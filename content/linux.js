// Track: linux — command-line fluency for DevOps/SRE: files, permissions, text, processes, systemd, networking, disks, SSH, bash, performance
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding so the file also runs in non-browser sandboxes (tools/validate.js)

/* ============================== 1. FILES & NAVIGATION ============================== */
INFRA.lessons.push({
  id: "linux-files-navigation",
  track: "linux",
  order: 1,
  icon: "🗂️",
  level: 1,
  minutes: 11,
  title: { en: "Files & navigation: where everything lives", he: "קבצים וניווט: איפה כל דבר גר" },
  tldr: {
    en: "Linux is one big tree starting at /, and almost everything in it — disks, processes, sockets — is a file you can ls, cat and find.",
    he: "Linux זה עץ אחד גדול שמתחיל ב-/, וכמעט כל דבר בו — דיסקים, תהליכים, sockets — הוא קובץ שאפשר לעשות לו ls, cat ו-find."
  },
  analogy: {
    en: "The Linux filesystem is a well-run hotel. /etc is the front desk with all the rules and configs, /var/log is the security camera archive, /home are the guest rooms, /tmp is the lobby where anything left overnight gets thrown out, and /proc is a magic window that shows you live what every guest is doing right now — it's not really stored anywhere, the hotel just narrates it on demand.",
    he: "מערכת הקבצים של Linux היא כמו מלון מסודר. /etc זו הקבלה עם כל החוקים והקונפיגורציות, /var/log זה ארכיון מצלמות האבטחה, /home אלה החדרים של האורחים, /tmp זה הלובי — מה שנשאר שם בלילה נזרק, ו-/proc זה חלון קסם שמראה לך בלייב מה כל אורח עושה עכשיו — זה לא באמת שמור בשום מקום, המלון פשוט מספר לך את זה כשאתה שואל."
  },
  sections: [
    {
      h: { en: "The map: Filesystem Hierarchy in 60 seconds", he: "המפה: ה-Filesystem Hierarchy ב-60 שניות" },
      body: {
        en: `<p>There are no drive letters. Everything hangs off <code>/</code>. The directories you will actually touch on-call:</p>
<table>
<tr><th>Path</th><th>What lives there</th></tr>
<tr><td><code>/etc</code></td><td>System-wide config: <code>nginx/</code>, <code>ssh/sshd_config</code>, <code>fstab</code>, <code>hosts</code></td></tr>
<tr><td><code>/var/log</code></td><td>Logs: <code>syslog</code>/<code>messages</code>, <code>nginx/access.log</code>, <code>auth.log</code></td></tr>
<tr><td><code>/var/lib</code></td><td>App state: <code>docker/</code>, <code>postgresql/</code>, <code>kubelet/</code> (often the disk hog)</td></tr>
<tr><td><code>/proc</code>, <code>/sys</code></td><td>Virtual: live kernel &amp; process info, nothing on disk</td></tr>
<tr><td><code>/tmp</code></td><td>Scratch space, often wiped on reboot (sometimes tmpfs = RAM)</td></tr>
<tr><td><code>/home</code>, <code>/root</code></td><td>User homes; root's home is separate</td></tr>
<tr><td><code>/opt</code></td><td>Third-party apps installed as a self-contained bundle</td></tr>
<tr><td><code>/usr/bin</code>, <code>/usr/local/bin</code></td><td>Binaries; <code>/usr/local</code> = installed by you, not the package manager</td></tr>
<tr><td><code>/dev</code></td><td>Devices: <code>/dev/sda</code>, <code>/dev/null</code>, <code>/dev/urandom</code></td></tr>
</table>
<blockquote>💡 Real world: "Where's the config?" → <code>/etc</code>. "Why did it crash?" → <code>/var/log</code> or <code>journalctl</code>. "Why is the disk full?" → usually <code>/var/lib/docker</code> or <code>/var/log</code>. Those three answers cover most of your first year on-call.</blockquote>`,
        he: `<p>אין אותיות כונן. הכל תלוי על <code>/</code>. התיקיות שבאמת תיגע בהן בתורנות:</p>
<table>
<tr><th>נתיב</th><th>מה יש שם</th></tr>
<tr><td><code>/etc</code></td><td>קונפיגורציה של המערכת: <code>nginx/</code>, <code>ssh/sshd_config</code>, <code>fstab</code>, <code>hosts</code></td></tr>
<tr><td><code>/var/log</code></td><td>לוגים: <code>syslog</code>/<code>messages</code>, <code>nginx/access.log</code>, <code>auth.log</code></td></tr>
<tr><td><code>/var/lib</code></td><td>state של אפליקציות: <code>docker/</code>, <code>postgresql/</code>, <code>kubelet/</code> (בדרך כלל זה מה שאוכל את הדיסק)</td></tr>
<tr><td><code>/proc</code>, <code>/sys</code></td><td>וירטואלי: מידע חי מה-kernel ועל תהליכים, שום דבר לא יושב על הדיסק</td></tr>
<tr><td><code>/tmp</code></td><td>שטח זמני, לרוב נמחק ב-reboot (לפעמים tmpfs = זיכרון)</td></tr>
<tr><td><code>/home</code>, <code>/root</code></td><td>תיקיות הבית של המשתמשים; ל-root יש בית נפרד</td></tr>
<tr><td><code>/opt</code></td><td>אפליקציות צד שלישי שמותקנות כחבילה סגורה</td></tr>
<tr><td><code>/usr/bin</code>, <code>/usr/local/bin</code></td><td>בינאריים; <code>/usr/local</code> = מה שאתה התקנת, לא ה-package manager</td></tr>
<tr><td><code>/dev</code></td><td>התקנים: <code>/dev/sda</code>, <code>/dev/null</code>, <code>/dev/urandom</code></td></tr>
</table>
<blockquote>💡 מהשטח: "איפה הקונפיג?" ← <code>/etc</code>. "למה זה קרס?" ← <code>/var/log</code> או <code>journalctl</code>. "למה הדיסק מלא?" ← בדרך כלל <code>/var/lib/docker</code> או <code>/var/log</code>. שלוש התשובות האלה מכסות את רוב השנה הראשונה שלך בתורנות.</blockquote>`
      }
    },
    {
      h: { en: "Moving around: pwd, cd, ls -lah", he: "להסתובב: pwd, cd, ls -lah" },
      body: {
        en: `<p><code>pwd</code> = where am I. <code>cd -</code> jumps back to the previous dir (the most underrated shortcut), <code>cd</code> alone goes home, <code>cd ..</code> goes up. Then the command you'll type 1000 times a day:</p>
<pre>$ ls -lah /var/log/nginx
total 1.3G
drwxr-xr-x  2 root     adm   4.0K Nov 12 06:25 .
drwxrwxr-x 12 root     syslog 4.0K Nov 12 00:00 ..
-rw-r-----  1 www-data adm   1.2G Nov 12 14:03 access.log
-rw-r-----  1 www-data adm    48M Nov 11 23:59 access.log.1
-rw-r-----  1 www-data adm   3.1K Nov 12 13:58 error.log</pre>
<p><code>-l</code> long format (perms, owner, group, size, mtime), <code>-a</code> include dotfiles, <code>-h</code> human sizes. Add <code>-t</code> to sort by time (newest first) and <code>-r</code> to reverse: <code>ls -lahtr</code> puts the most recently written file at the bottom, right above your prompt. <code>-S</code> sorts by size. The first char of the perms column tells the type: <code>-</code> file, <code>d</code> dir, <code>l</code> symlink, <code>c</code>/<code>b</code> device, <code>s</code> socket, <code>p</code> pipe.</p>`,
        he: `<p><code>pwd</code> = איפה אני. <code>cd -</code> קופץ חזרה לתיקייה הקודמת (הקיצור הכי לא מוערך שיש), <code>cd</code> לבד הולך הביתה, <code>cd ..</code> עולה רמה. ואז הפקודה שתקליד 1000 פעם ביום:</p>
<pre>$ ls -lah /var/log/nginx
total 1.3G
drwxr-xr-x  2 root     adm   4.0K Nov 12 06:25 .
drwxrwxr-x 12 root     syslog 4.0K Nov 12 00:00 ..
-rw-r-----  1 www-data adm   1.2G Nov 12 14:03 access.log
-rw-r-----  1 www-data adm    48M Nov 11 23:59 access.log.1
-rw-r-----  1 www-data adm   3.1K Nov 12 13:58 error.log</pre>
<p><code>-l</code> פורמט ארוך (הרשאות, owner, group, גודל, mtime), <code>-a</code> כולל dotfiles, <code>-h</code> גדלים קריאים. תוסיף <code>-t</code> למיון לפי זמן (החדש ראשון) ו-<code>-r</code> להפוך: <code>ls -lahtr</code> שם את הקובץ האחרון שנכתב בתחתית, ממש מעל ה-prompt. <code>-S</code> ממיין לפי גודל. התו הראשון בעמודת ההרשאות אומר את הסוג: <code>-</code> קובץ, <code>d</code> תיקייה, <code>l</code> symlink, <code>c</code>/<code>b</code> device, <code>s</code> socket, <code>p</code> pipe.</p>`
      }
    },
    {
      h: { en: "cp, mv, rm -r — and the rm -rf horror stories", he: "cp, mv, rm -r — וסיפורי האימה של rm -rf" },
      body: {
        en: `<p><code>cp -a src/ dst/</code> copies recursively <em>preserving</em> perms, owners and timestamps (prefer it over <code>-r</code> for backups). <code>mv</code> is a rename within the same filesystem (instant) and a copy+delete across filesystems (slow). <code>rm -r dir</code> deletes recursively; <code>-f</code> silences prompts and errors. There is <strong>no trash can</strong>.</p>
<pre>$ cp -a /etc/nginx /etc/nginx.bak-$(date +%F)
$ mv app.log app.log.old
$ rm -ri ./build        # -i: ask before each delete</pre>
<p>The classic disaster is an empty variable: <code>rm -rf "$BUILD_DIR/"*</code> with <code>BUILD_DIR</code> unset becomes <code>rm -rf /*</code>. Steam's Linux client shipped exactly this bug in 2015 and wiped users' home dirs. GitLab lost 300GB of production DB in 2017 when an engineer ran <code>rm -rf</code> on the wrong server.</p>
<blockquote>⚠️ Production tip: before any <code>rm -rf</code>, run the same path with <code>ls</code> first. In scripts use <code>set -u</code> and <code>rm -rf "\${DIR:?DIR is empty}"/</code> — bash aborts if DIR is unset. And always check your hostname in the prompt.</blockquote>`,
        he: `<p><code>cp -a src/ dst/</code> מעתיק רקורסיבית <em>ושומר</em> הרשאות, owners ו-timestamps (עדיף על <code>-r</code> כשעושים גיבוי). <code>mv</code> בתוך אותו filesystem זה rename (מיידי), ובין filesystems זה העתקה + מחיקה (איטי). <code>rm -r dir</code> מוחק רקורסיבית; <code>-f</code> משתיק שאלות ושגיאות. <strong>אין סל מחזור</strong>.</p>
<pre>$ cp -a /etc/nginx /etc/nginx.bak-$(date +%F)
$ mv app.log app.log.old
$ rm -ri ./build        # -i: ask before each delete</pre>
<p>האסון הקלאסי הוא משתנה ריק: <code>rm -rf "$BUILD_DIR/"*</code> כש-<code>BUILD_DIR</code> לא מוגדר הופך ל-<code>rm -rf /*</code>. ה-client של Steam ללינוקס שוחרר עם הבאג הזה בדיוק ב-2015 ומחק למשתמשים את ה-home. ב-GitLab ב-2017 מהנדס הריץ <code>rm -rf</code> על השרת הלא נכון ו-300GB של DB בפרודקשן הלכו.</p>
<blockquote>⚠️ טיפ לפרודקשן: לפני כל <code>rm -rf</code>, תריץ קודם <code>ls</code> על אותו נתיב. בסקריפטים תשתמש ב-<code>set -u</code> וב-<code>rm -rf "\${DIR:?DIR is empty}"/</code> — bash יעצור אם DIR ריק. ותמיד תסתכל על ה-hostname ב-prompt.</blockquote>`
      }
    },
    {
      h: { en: "find, locate, tree, file, stat", he: "find, locate, tree, file, stat" },
      body: {
        en: `<p><code>find</code> walks the tree live and filters by anything: <code>find PATH tests actions</code>.</p>
<pre>$ find /var/log -name "*.gz" -mtime +30            # gzipped logs older than 30 days
$ find / -xdev -type f -size +500M 2&gt;/dev/null     # big files, stay on this filesystem
$ find . -name "*.tmp" -mmin -10                   # touched in the last 10 minutes
$ find /var/log -name "*.log.*" -mtime +7 -exec rm {} \\;
$ find . -type f -name "*.py" -exec grep -l "TODO" {} +</pre>
<p><code>-mtime +30</code> = more than 30 days, <code>-30</code> = less than. <code>-exec ... {} \\;</code> runs once per file; <code>{} +</code> batches many files into one call (much faster). Use <code>-delete</code> instead of <code>-exec rm</code>, but put it <em>last</em> — <code>find . -delete -name x</code> deletes everything.</p>
<p><code>locate nginx.conf</code> searches a prebuilt index (instant but stale; refresh with <code>updatedb</code>). <code>tree -L 2</code> draws the structure. <code>file mystery.bin</code> tells you what something really is ("ELF 64-bit", "gzip compressed"). <code>stat</code> shows size, inode, perms and all three timestamps (access/modify/change).</p>`,
        he: `<p><code>find</code> סורק את העץ בזמן אמת ומסנן לפי כל דבר: <code>find PATH tests actions</code>.</p>
<pre>$ find /var/log -name "*.gz" -mtime +30            # gzipped logs older than 30 days
$ find / -xdev -type f -size +500M 2&gt;/dev/null     # big files, stay on this filesystem
$ find . -name "*.tmp" -mmin -10                   # touched in the last 10 minutes
$ find /var/log -name "*.log.*" -mtime +7 -exec rm {} \\;
$ find . -type f -name "*.py" -exec grep -l "TODO" {} +</pre>
<p><code>-mtime +30</code> = יותר מ-30 יום, <code>-30</code> = פחות. <code>-exec ... {} \\;</code> מריץ פעם אחת לכל קובץ; <code>{} +</code> מקבץ הרבה קבצים לקריאה אחת (הרבה יותר מהיר). עדיף <code>-delete</code> על <code>-exec rm</code>, אבל תשים אותו <em>בסוף</em> — <code>find . -delete -name x</code> מוחק הכל.</p>
<p><code>locate nginx.conf</code> מחפש באינדקס מוכן מראש (מיידי אבל לא עדכני; מרעננים עם <code>updatedb</code>). <code>tree -L 2</code> מצייר את המבנה. <code>file mystery.bin</code> אומר לך מה הדבר הזה באמת ("ELF 64-bit", "gzip compressed"). <code>stat</code> מראה גודל, inode, הרשאות ואת שלושת ה-timestamps (access/modify/change).</p>`
      }
    },
    {
      h: { en: "Links and \"everything is a file\"", he: "Links ו-\"הכל זה קובץ\"" },
      body: {
        en: `<p>A <strong>symlink</strong> is a pointer to a path: <code>ln -s /opt/app/releases/v42 /opt/app/current</code>. Deploy tools flip <code>current</code> atomically between releases (<code>ln -sfn</code>), which makes rollback a one-liner. A <strong>hard link</strong> (<code>ln</code> without <code>-s</code>) is a second name for the same inode — the data lives until the last name is gone.</p>
<p>"Everything is a file" means the same tools work on wildly different things:</p>
<pre>$ cat /proc/loadavg
0.42 0.37 0.30 2/613 18234
$ cat /proc/1234/cmdline | tr '\\0' ' '
/usr/bin/java -Xmx2g -jar app.jar
$ ls -l /proc/1234/fd | head -3
lr-x------ 1 app app 64 Nov 12 14:01 0 -&gt; /dev/null
l-wx------ 1 app app 64 Nov 12 14:01 1 -&gt; /var/log/app/out.log
lrwx------ 1 app app 64 Nov 12 14:01 7 -&gt; socket:[884213]
$ echo "test" &gt; /dev/null       # the black hole</pre>
<blockquote>💡 Real world: <code>/proc/PID/environ</code>, <code>/proc/PID/fd</code> and <code>/proc/PID/cwd</code> let you inspect a running process without restarting it or attaching a debugger — perfect for "which config file is this thing actually using?"</blockquote>`,
        he: `<p><strong>symlink</strong> הוא מצביע לנתיב: <code>ln -s /opt/app/releases/v42 /opt/app/current</code>. כלי deploy מחליפים את <code>current</code> באופן אטומי בין גרסאות (<code>ln -sfn</code>), וככה rollback הופך לשורה אחת. <strong>hard link</strong> (<code>ln</code> בלי <code>-s</code>) הוא שם נוסף לאותו inode — הדאטה חי עד שהשם האחרון נמחק.</p>
<p>"הכל זה קובץ" אומר שאותם כלים עובדים על דברים שונים לגמרי:</p>
<pre>$ cat /proc/loadavg
0.42 0.37 0.30 2/613 18234
$ cat /proc/1234/cmdline | tr '\\0' ' '
/usr/bin/java -Xmx2g -jar app.jar
$ ls -l /proc/1234/fd | head -3
lr-x------ 1 app app 64 Nov 12 14:01 0 -&gt; /dev/null
l-wx------ 1 app app 64 Nov 12 14:01 1 -&gt; /var/log/app/out.log
lrwx------ 1 app app 64 Nov 12 14:01 7 -&gt; socket:[884213]
$ echo "test" &gt; /dev/null       # the black hole</pre>
<blockquote>💡 מהשטח: <code>/proc/PID/environ</code>, <code>/proc/PID/fd</code> ו-<code>/proc/PID/cwd</code> נותנים לך להציץ לתהליך רץ בלי restart ובלי debugger — מושלם לשאלה "איזה קובץ קונפיג הדבר הזה באמת קורא?"</blockquote>`
      }
    }
  ],
  diagram: "/\n├── etc/        config (nginx/, ssh/, fstab, hosts)\n├── var/\n│   ├── log/    logs  ← 'why did it crash?'\n│   └── lib/    app state (docker/, postgresql/) ← 'why is disk full?'\n├── proc/       live process & kernel info (virtual)\n├── tmp/        scratch, wiped on reboot\n├── home/       users\n├── opt/        self-contained 3rd-party apps\n├── usr/bin/    binaries (usr/local/bin = yours)\n└── dev/        devices (sda, null, urandom)",
  handsOn: [
    { cmd: "ls -lahtr /var/log", what: { en: "Long listing incl. hidden files, human sizes, oldest first — the newest log lands right above your prompt.", he: "רשימה מלאה כולל קבצים נסתרים, גדלים קריאים, מהישן לחדש — הלוג הכי חדש נוחת ממש מעל ה-prompt." } },
    { cmd: "find / -xdev -type f -size +500M -exec ls -lh {} + 2>/dev/null", what: { en: "Find files over 500MB on the root filesystem only (-xdev skips other mounts), with sizes.", he: "מוצא קבצים מעל 500MB רק ב-filesystem של / (‏-xdev מדלג על mounts אחרים), עם הגדלים." } },
    { cmd: "find /var/log -name '*.gz' -mtime +30 -delete", what: { en: "Delete compressed logs older than 30 days. Run it without -delete first to preview.", he: "מוחק לוגים דחוסים ישנים מ-30 יום. תריץ קודם בלי -delete כדי לראות מה ייפול." } },
    { cmd: "find . -type f -mmin -15", what: { en: "Which files changed in the last 15 minutes? Great for 'what did that deploy touch?'", he: "אילו קבצים השתנו ב-15 הדקות האחרונות? מעולה לשאלה 'מה ה-deploy הזה נגע?'" } },
    { cmd: "ln -sfn /opt/app/releases/v43 /opt/app/current", what: { en: "Atomically repoint the 'current' symlink to a new release (-n treats an existing link-to-dir as a file).", he: "מעביר את ה-symlink של current לגרסה חדשה באופן אטומי (‏-n מתייחס ל-link קיים לתיקייה כקובץ)." } },
    { cmd: "stat -c '%n %s bytes, inode %i, modified %y' /etc/nginx/nginx.conf", what: { en: "Show exact size, inode and last-modified time of a file in a custom format.", he: "מציג גודל מדויק, inode וזמן שינוי אחרון של קובץ בפורמט מותאם." } },
    { cmd: "tree -L 2 -d /etc/nginx", what: { en: "Draw only the directory structure, two levels deep.", he: "מצייר רק את מבנה התיקיות, שתי רמות לעומק." } },
    { cmd: "cp -a /etc/nginx /etc/nginx.bak-$(date +%F)", what: { en: "Back up a config dir with perms and timestamps preserved, dated suffix (e.g. nginx.bak-2026-11-12).", he: "גיבוי של תיקיית קונפיג עם שמירת הרשאות ו-timestamps, עם תאריך בשם (למשל nginx.bak-2026-11-12)." } },
    { cmd: "ls -l /proc/$(pgrep -o nginx)/fd", what: { en: "List every file, socket and pipe the oldest nginx process has open.", he: "מציג כל קובץ, socket ו-pipe שתהליך ה-nginx הוותיק ביותר מחזיק פתוחים." } }
  ],
  mnemonic: {
    en: "\"Every Valuable Process Talks Home Often\": /Etc config, /Var logs, /Proc live, /Tmp trash, /Home users, /Opt apps. And find's age: +N = older than N days (plus = past), -N = newer.",
    he: "\"אֶתֶר־וַר־פְּרוֹק\": /etc = הוראות, /var = מה שמשתנה (לוגים), /proc = מה שקורה עכשיו. ולגבי find: ‎+N = ותיק מ-N ימים (פלוס = עבר), ‎-N = חדש מ-N."
  },
  pitfalls: [
    { en: "rm -rf with an unset variable or a stray space (rm -rf / tmp/x) — always preview with ls and use ${VAR:?} in scripts.", he: "rm -rf עם משתנה ריק או רווח מיותר (rm -rf / tmp/x) — תמיד תבדוק קודם עם ls ותשתמש ב-${VAR:?} בסקריפטים." },
    { en: "Putting -delete before the filters in find: it's evaluated left to right, so find . -delete -name '*.log' deletes everything.", he: "לשים -delete לפני הפילטרים ב-find: הוא מוערך משמאל לימין, אז find . -delete -name '*.log' מוחק הכל." },
    { en: "find / without -xdev wanders into /proc, NFS mounts and container overlays — slow and noisy. Add -xdev and 2>/dev/null.", he: "find / בלי -xdev נכנס ל-/proc, ל-NFS ול-overlays של קונטיינרים — איטי ומלא רעש. תוסיף -xdev ו-2>/dev/null." },
    { en: "Trusting locate for a file created 5 minutes ago — its database is refreshed daily. Use find for fresh files.", he: "לסמוך על locate בשביל קובץ שנוצר לפני 5 דקות — ה-DB שלו מתעדכן פעם ביום. לקבצים טריים תשתמש ב-find." }
  ],
  interview: [
    { q: { en: "What's the difference between a hard link and a symlink?", he: "מה ההבדל בין hard link ל-symlink?" },
      a: { en: "A hard link is another directory entry pointing to the same inode; deleting the original name doesn't delete the data, and it can't cross filesystems or point to directories. A symlink is a tiny file containing a path; it can cross filesystems and point to dirs, but breaks (dangles) if the target is removed.", he: "hard link זה עוד רשומה בתיקייה שמצביעה לאותו inode; מחיקת השם המקורי לא מוחקת את הדאטה, והוא לא יכול לחצות filesystems או להצביע לתיקיות. symlink זה קובץ קטנטן שמכיל נתיב; הוא יכול לחצות filesystems ולהצביע לתיקיות, אבל נשבר (dangling) אם המטרה נמחקת." } },
    { q: { en: "What does 'everything is a file' mean in Linux? Give examples.", he: "מה המשמעות של 'הכל זה קובץ' ב-Linux? תן דוגמאות." },
      a: { en: "Devices, processes, kernel tunables, sockets and pipes are exposed through the file API: /dev/sda is a disk, /proc/PID/ shows a process's fds and memory, /sys exposes hardware, /proc/sys/net/... are tunables you can echo into. So the same tools (cat, ls, echo >) work on all of them.", he: "devices, תהליכים, פרמטרים של ה-kernel, sockets ו-pipes חשופים דרך ה-API של קבצים: /dev/sda זה דיסק, /proc/PID/ מראה fds וזיכרון של תהליך, /sys חושף חומרה, ו-/proc/sys/net/... זה tunables שאפשר לעשות להם echo. אז אותם כלים (cat, ls, echo >) עובדים על כולם." } },
    { q: { en: "How would you find all files larger than 1GB modified in the last day?", he: "איך תמצא את כל הקבצים מעל 1GB ששונו ביום האחרון?" },
      a: { en: "find / -xdev -type f -size +1G -mtime -1 -exec ls -lh {} + 2>/dev/null. -xdev keeps it on one filesystem, -mtime -1 means less than 1 day old, and {} + batches the ls calls.", he: "find / -xdev -type f -size +1G -mtime -1 -exec ls -lh {} + 2>/dev/null. ‏-xdev משאיר אותו על filesystem אחד, ‏-mtime -1 זה פחות מיום, ו-{} + מקבץ את קריאות ה-ls." } }
  ],
  quiz: [
    { q: { en: "Where would you look first for nginx's configuration?", he: "איפה תחפש קודם את הקונפיגורציה של nginx?" },
      options: [ { en: "/var/lib/nginx", he: "/var/lib/nginx" }, { en: "/etc/nginx", he: "/etc/nginx" }, { en: "/usr/bin/nginx", he: "/usr/bin/nginx" }, { en: "/proc/nginx", he: "/proc/nginx" } ],
      answer: 1, explain: { en: "/etc holds system-wide configuration. /var/lib is state, /usr/bin is the binary, /proc is per-PID, not per-name.", he: "‏/etc מחזיק קונפיגורציה של המערכת. ‏/var/lib זה state, ‏/usr/bin זה הבינארי, ו-/proc מסודר לפי PID ולא לפי שם." } },
    { q: { en: "What does find /var/log -mtime +7 match?", he: "מה find /var/log -mtime +7 מוצא?" },
      options: [ { en: "Files modified in the last 7 days", he: "קבצים ששונו ב-7 הימים האחרונים" }, { en: "Files modified more than 7 days ago", he: "קבצים ששונו לפני יותר מ-7 ימים" }, { en: "Files larger than 7 blocks", he: "קבצים גדולים מ-7 בלוקים" }, { en: "Files accessed exactly 7 days ago", he: "קבצים שנקראו בדיוק לפני 7 ימים" } ],
      answer: 1, explain: { en: "+N means 'more than N days ago' (older); -N means newer than N days.", he: "‏+N אומר 'לפני יותר מ-N ימים' (ישן יותר); ‏-N אומר חדש מ-N ימים." } },
    { q: { en: "Why is '-exec cmd {} +' usually faster than '-exec cmd {} \\;'?", he: "למה '-exec cmd {} +' בדרך כלל מהיר יותר מ-'-exec cmd {} \\;'?" },
      options: [ { en: "It runs commands in parallel threads", he: "הוא מריץ פקודות ב-threads מקבילים" }, { en: "It passes many files to a single invocation instead of one process per file", he: "הוא מעביר הרבה קבצים להרצה אחת במקום תהליך לכל קובץ" }, { en: "It skips files it can't read", he: "הוא מדלג על קבצים שהוא לא יכול לקרוא" }, { en: "It caches results in locate's database", he: "הוא שומר תוצאות ב-DB של locate" } ],
      answer: 1, explain: { en: "Spawning a process per file is expensive; + appends as many paths as fit on one command line, like xargs.", he: "להרים תהליך לכל קובץ זה יקר; + מצרף כמה שיותר נתיבים לשורת פקודה אחת, כמו xargs." } },
    { q: { en: "You delete the original name of a file that has a hard link. What happens to the data?", he: "מחקת את השם המקורי של קובץ שיש לו hard link. מה קורה לדאטה?" },
      options: [ { en: "It's deleted; the hard link dangles", he: "היא נמחקת; ה-hard link נשאר תלוי באוויר" }, { en: "It stays, reachable via the other name, until the last link is removed", he: "היא נשארת, נגישה דרך השם השני, עד שה-link האחרון נמחק" }, { en: "It moves to /tmp", he: "היא עוברת ל-/tmp" }, { en: "The kernel refuses to delete it", he: "ה-kernel מסרב למחוק" } ],
      answer: 1, explain: { en: "Names point at an inode; the inode's data is freed only when its link count (and open-fd count) hits zero. Dangling is a symlink behavior.", he: "שמות מצביעים על inode; הדאטה משתחררת רק כשמונה ה-links (וה-fds הפתוחים) מגיע לאפס. 'תלוי באוויר' זו התנהגות של symlink." } }
  ],
  playground: "terminal",
  related: ["linux-permissions-users", "linux-disks-storage", "linux-toolkit"]
});

/* ============================== 2. PERMISSIONS & USERS ============================== */
INFRA.lessons.push({
  id: "linux-permissions-users",
  track: "linux",
  order: 2,
  icon: "🔐",
  level: 1,
  minutes: 10,
  title: { en: "Permissions & users: rwx, chmod, chown, sudo", he: "הרשאות ומשתמשים: rwx, chmod, chown, sudo" },
  tldr: {
    en: "Every file has an owner, a group and three rwx triplets (user/group/other); 'Permission denied' is almost always one of those bits — on the file or on a directory above it.",
    he: "לכל קובץ יש owner, group ושלוש שלשות rwx (user/group/other); 'Permission denied' זה כמעט תמיד אחד מהביטים האלה — על הקובץ או על תיקייה מעליו."
  },
  analogy: {
    en: "Think of an office building with keycards. Each room (file) has a sign: what the owner can do, what their team can do, and what visitors can do — read the whiteboard, write on it, or walk through the door (execute). sudo is the facilities manager's master key: powerful, logged, and you should feel slightly nervous every time you borrow it.",
    he: "תחשוב על בניין משרדים עם כרטיסי כניסה. על כל חדר (קובץ) יש שלט: מה הבעלים יכול לעשות, מה הצוות שלו יכול, ומה מבקרים יכולים — לקרוא את הלוח, לכתוב עליו, או לעבור בדלת (execute). sudo זה המפתח הראשי של אב הבית: חזק, מתועד, וכל פעם שאתה שואל אותו אתה אמור להרגיש קצת לחוץ."
  },
  sections: [
    {
      h: { en: "Reading the rwx string", he: "לקרוא את מחרוזת ה-rwx" },
      body: {
        en: `<pre>$ ls -l deploy.sh id_ed25519 /var/www
-rwxr-xr-x 1 meir devops  812 Nov 12 10:01 deploy.sh
-rw------- 1 meir meir    411 Nov 10 09:12 id_ed25519
drwxr-x--- 5 www-data www-data 4096 Nov 11 18:40 /var/www</pre>
<p>Skip the first char (type), then three triplets: <strong>user</strong> (owner), <strong>group</strong>, <strong>other</strong>. Each is <code>r</code> read, <code>w</code> write, <code>x</code> execute, or <code>-</code>.</p>
<p>On a <strong>directory</strong> the bits mean something different, and this is where people get burned: <code>r</code> = list names, <code>w</code> = create/delete/rename entries inside, <code>x</code> = enter/traverse (<code>cd</code>, or reach a file by path). To read <code>/var/www/html/index.html</code> you need <code>x</code> on <em>every</em> directory along the path plus <code>r</code> on the file.</p>
<blockquote>💡 Real world: deleting a file is a <em>directory</em> permission. If you have <code>w</code> on the dir, you can delete a file you can't even read. That's why <code>/tmp</code> has the sticky bit (<code>drwxrwxrwt</code>): only the owner can delete their own files there.</blockquote>`,
        he: `<pre>$ ls -l deploy.sh id_ed25519 /var/www
-rwxr-xr-x 1 meir devops  812 Nov 12 10:01 deploy.sh
-rw------- 1 meir meir    411 Nov 10 09:12 id_ed25519
drwxr-x--- 5 www-data www-data 4096 Nov 11 18:40 /var/www</pre>
<p>מדלגים על התו הראשון (סוג), ואז שלוש שלשות: <strong>user</strong> (הבעלים), <strong>group</strong>, <strong>other</strong>. בכל אחת יש <code>r</code> קריאה, <code>w</code> כתיבה, <code>x</code> הרצה, או <code>-</code>.</p>
<p>על <strong>תיקייה</strong> הביטים אומרים משהו אחר, ופה אנשים נשרפים: <code>r</code> = לראות את השמות, <code>w</code> = ליצור/למחוק/לשנות שם לרשומות בפנים, <code>x</code> = להיכנס/לעבור דרכה (<code>cd</code>, או להגיע לקובץ לפי נתיב). כדי לקרוא את <code>/var/www/html/index.html</code> צריך <code>x</code> על <em>כל</em> תיקייה בדרך ועוד <code>r</code> על הקובץ.</p>
<blockquote>💡 מהשטח: מחיקת קובץ היא הרשאה של <em>התיקייה</em>. אם יש לך <code>w</code> על התיקייה, אתה יכול למחוק קובץ שאתה אפילו לא יכול לקרוא. בגלל זה ל-<code>/tmp</code> יש sticky bit (<code>drwxrwxrwt</code>): רק הבעלים יכול למחוק את הקבצים שלו שם.</blockquote>`
      }
    },
    {
      h: { en: "chmod numeric & symbolic, chown, umask", he: "chmod במספרים ובסימבולי, chown, umask" },
      body: {
        en: `<p>Numeric mode: <strong>r=4, w=2, x=1</strong>, add them per triplet.</p>
<table>
<tr><th>Mode</th><th>String</th><th>Typical use</th></tr>
<tr><td>755</td><td>rwxr-xr-x</td><td>scripts, binaries, directories</td></tr>
<tr><td>644</td><td>rw-r--r--</td><td>regular files, configs</td></tr>
<tr><td>600</td><td>rw-------</td><td>private keys, secrets, .env</td></tr>
<tr><td>700</td><td>rwx------</td><td><code>~/.ssh</code> directory</td></tr>
</table>
<pre>$ chmod 600 ~/.ssh/id_ed25519
$ chmod u+x,go-w deploy.sh        # symbolic: add/remove specific bits
$ chmod -R g+rX /srv/shared        # capital X = exec only on dirs (and already-exec files)
$ sudo chown -R www-data:www-data /var/www/html
$ umask
0022</pre>
<p><strong>umask</strong> is the mask subtracted from the default (666 for files, 777 for dirs). With <code>022</code>, new files are <code>644</code> and new dirs <code>755</code>. Set <code>umask 077</code> in a service that writes secrets so nothing is ever group/world-readable by accident.</p>`,
        he: `<p>מצב מספרי: <strong>r=4, w=2, x=1</strong>, מחברים לכל שלשה.</p>
<table>
<tr><th>Mode</th><th>מחרוזת</th><th>שימוש נפוץ</th></tr>
<tr><td>755</td><td>rwxr-xr-x</td><td>סקריפטים, בינאריים, תיקיות</td></tr>
<tr><td>644</td><td>rw-r--r--</td><td>קבצים רגילים, קונפיגים</td></tr>
<tr><td>600</td><td>rw-------</td><td>מפתחות פרטיים, secrets, ‏.env</td></tr>
<tr><td>700</td><td>rwx------</td><td>התיקייה <code>~/.ssh</code></td></tr>
</table>
<pre>$ chmod 600 ~/.ssh/id_ed25519
$ chmod u+x,go-w deploy.sh        # symbolic: add/remove specific bits
$ chmod -R g+rX /srv/shared        # capital X = exec only on dirs (and already-exec files)
$ sudo chown -R www-data:www-data /var/www/html
$ umask
0022</pre>
<p><strong>umask</strong> זו מסכה שמורידים מברירת המחדל (666 לקבצים, 777 לתיקיות). עם <code>022</code>, קבצים חדשים יוצאים <code>644</code> ותיקיות <code>755</code>. תגדיר <code>umask 077</code> בשירות שכותב secrets, וככה שום דבר לא יהיה קריא ל-group/world בטעות.</p>`
      }
    },
    {
      h: { en: "Users, groups, sudo and setuid", he: "משתמשים, groups, sudo ו-setuid" },
      body: {
        en: `<pre>$ id
uid=1000(meir) gid=1000(meir) groups=1000(meir),27(sudo),998(docker)
$ grep www-data /etc/passwd
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
$ getent group docker
docker:x:998:meir,jenkins
$ sudo usermod -aG docker jenkins     # -a = APPEND, never forget it</pre>
<p><code>/etc/passwd</code> fields: <code>name:x:UID:GID:comment:home:shell</code> (the <code>x</code> means the hash lives in <code>/etc/shadow</code>). Service accounts get <code>/usr/sbin/nologin</code> as their shell. Group changes apply on the <em>next login</em> — run <code>newgrp docker</code> or log out/in.</p>
<p><code>sudo cmd</code> runs one command as root and logs it to <code>/var/log/auth.log</code>; <code>sudo -u postgres psql</code> runs as another user; <code>sudo -l</code> shows what you're allowed. Edit rules only with <code>visudo</code> (it syntax-checks — a broken sudoers file locks everyone out).</p>
<p><strong>setuid</strong> (<code>chmod u+s</code>, shows as <code>rwsr-xr-x</code>) makes a binary run as its <em>owner</em>: that's how <code>passwd</code> writes to <code>/etc/shadow</code>. A setuid-root binary with a bug is a privilege escalation — audit with <code>find / -perm -4000</code>.</p>`,
        he: `<pre>$ id
uid=1000(meir) gid=1000(meir) groups=1000(meir),27(sudo),998(docker)
$ grep www-data /etc/passwd
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
$ getent group docker
docker:x:998:meir,jenkins
$ sudo usermod -aG docker jenkins     # -a = APPEND, never forget it</pre>
<p>השדות ב-<code>/etc/passwd</code>: <code>name:x:UID:GID:comment:home:shell</code> (ה-<code>x</code> אומר שה-hash יושב ב-<code>/etc/shadow</code>). ל-service accounts נותנים shell של <code>/usr/sbin/nologin</code>. שינוי groups נכנס לתוקף רק ב<em>login הבא</em> — תריץ <code>newgrp docker</code> או תתנתק ותתחבר.</p>
<p><code>sudo cmd</code> מריץ פקודה אחת כ-root ומתעד ב-<code>/var/log/auth.log</code>; <code>sudo -u postgres psql</code> מריץ כמשתמש אחר; <code>sudo -l</code> מראה מה מותר לך. עורכים חוקים רק עם <code>visudo</code> (הוא בודק syntax — קובץ sudoers שבור נועל את כולם בחוץ).</p>
<p><strong>setuid</strong> (<code>chmod u+s</code>, נראה כמו <code>rwsr-xr-x</code>) גורם לבינארי לרוץ כ<em>בעלים</em> שלו: ככה <code>passwd</code> כותב ל-<code>/etc/shadow</code>. בינארי setuid-root עם באג = privilege escalation — בודקים עם <code>find / -perm -4000</code>.</p>`
      }
    },
    {
      h: { en: "Debugging \"Permission denied\" (and why SSH keys must be 600)", he: "לדבג \"Permission denied\" (ולמה מפתחות SSH חייבים 600)" },
      body: {
        en: `<p>The systematic approach: <strong>who am I, who owns it, every dir on the path</strong>.</p>
<pre>$ sudo -u www-data cat /srv/app/config/db.yml
cat: /srv/app/config/db.yml: Permission denied
$ namei -l /srv/app/config/db.yml
f: /srv/app/config/db.yml
drwxr-xr-x root  root  /
drwxr-xr-x root  root  srv
drwx------ deploy deploy app        &lt;-- here: no x for others
drwxr-xr-x deploy deploy config
-rw-r--r-- deploy deploy db.yml</pre>
<p><code>namei -l</code> walks the path and shows perms at each level — usually the culprit is a parent dir. If perms look right but it still fails, suspect SELinux/AppArmor (<code>ls -Z</code>, <code>ausearch -m avc</code>) or a read-only/noexec mount.</p>
<p>SSH is deliberately paranoid: if your private key is readable by others, <code>ssh</code> refuses it with <code>WARNING: UNPROTECTED PRIVATE KEY FILE!</code>. On the server, <code>sshd</code> ignores <code>authorized_keys</code> if <code>~</code>, <code>~/.ssh</code> or the file is group/world-writable (StrictModes). Fix: <code>chmod 700 ~/.ssh; chmod 600 ~/.ssh/id_* ~/.ssh/authorized_keys</code>.</p>
<blockquote>⚠️ Production tip: <code>chmod -R 777</code> "to make it work" is never the fix. It hides the real problem and turns a config dir into something any compromised process can rewrite.</blockquote>`,
        he: `<p>הגישה השיטתית: <strong>מי אני, למי זה שייך, וכל תיקייה בדרך</strong>.</p>
<pre>$ sudo -u www-data cat /srv/app/config/db.yml
cat: /srv/app/config/db.yml: Permission denied
$ namei -l /srv/app/config/db.yml
f: /srv/app/config/db.yml
drwxr-xr-x root  root  /
drwxr-xr-x root  root  srv
drwx------ deploy deploy app        &lt;-- here: no x for others
drwxr-xr-x deploy deploy config
-rw-r--r-- deploy deploy db.yml</pre>
<p><code>namei -l</code> הולך על הנתיב ומראה הרשאות בכל רמה — בדרך כלל האשם הוא תיקיית אב. אם ההרשאות נראות תקינות וזה עדיין נכשל, תחשוד ב-SELinux/AppArmor (<code>ls -Z</code>, <code>ausearch -m avc</code>) או ב-mount שהוא read-only/noexec.</p>
<p>SSH פרנואידי בכוונה: אם המפתח הפרטי שלך קריא לאחרים, <code>ssh</code> מסרב להשתמש בו עם <code>WARNING: UNPROTECTED PRIVATE KEY FILE!</code>. בצד השרת, <code>sshd</code> מתעלם מ-<code>authorized_keys</code> אם <code>~</code>, ‏<code>~/.ssh</code> או הקובץ עצמו writable ל-group/world (‏StrictModes). התיקון: <code>chmod 700 ~/.ssh; chmod 600 ~/.ssh/id_* ~/.ssh/authorized_keys</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>chmod -R 777</code> "כדי שיעבוד" אף פעם לא התיקון. זה מסתיר את הבעיה האמיתית והופך תיקיית קונפיג למשהו שכל תהליך פרוץ יכול לשכתב.</blockquote>`
      }
    }
  ],
  diagram: "-rwxr-x---  1  deploy  devops  ...\n│└┬┘└┬┘└┬┘     └─owner └─group\n│ │  │  └ other: ---  = 0\n│ │  └─── group: r-x  = 4+0+1 = 5\n│ └────── user:  rwx  = 4+2+1 = 7   → chmod 750\n└──────── type: - file, d dir, l link",
  handsOn: [
    { cmd: "chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519 ~/.ssh/authorized_keys", what: { en: "Fix the classic SSH 'unprotected private key' / ignored authorized_keys problem.", he: "מתקן את הבעיה הקלאסית של SSH — 'unprotected private key' או authorized_keys שמתעלמים ממנו." } },
    { cmd: "namei -l /srv/app/config/db.yml", what: { en: "Show owner and permissions of every directory along a path — finds the parent dir blocking access.", he: "מציג owner והרשאות לכל תיקייה לאורך הנתיב — מוצא את תיקיית האב שחוסמת." } },
    { cmd: "sudo -u www-data test -r /srv/app/config/db.yml && echo readable || echo DENIED", what: { en: "Test whether a specific service user can read a file, without guessing.", he: "בודק אם משתמש שירות מסוים יכול לקרוא קובץ, בלי לנחש." } },
    { cmd: "sudo chown -R www-data:www-data /var/www/html", what: { en: "Recursively give a directory to the web server user and group.", he: "מעביר תיקייה רקורסיבית לבעלות המשתמש וה-group של שרת ה-web." } },
    { cmd: "chmod -R u=rwX,g=rX,o= /srv/app", what: { en: "Sane recursive perms: X sets execute only on dirs, so files get 640 and dirs 750.", he: "הרשאות רקורסיביות שפויות: X נותן execute רק לתיקיות, אז קבצים יוצאים 640 ותיקיות 750." } },
    { cmd: "sudo usermod -aG docker $USER && newgrp docker", what: { en: "Add yourself to the docker group (append!) and activate it in the current shell.", he: "מוסיף אותך ל-group של docker (append!) ומפעיל את זה ב-shell הנוכחי." } },
    { cmd: "find / -xdev -perm -4000 -type f 2>/dev/null", what: { en: "List all setuid binaries — a standard security audit check.", he: "מציג את כל הבינאריים עם setuid — בדיקת אבטחה סטנדרטית." } },
    { cmd: "sudo grep -E 'sudo|Failed password' /var/log/auth.log | tail -20", what: { en: "Who used sudo recently, and who's brute-forcing SSH.", he: "מי השתמש ב-sudo לאחרונה, ומי מנסה brute-force על SSH." } }
  ],
  mnemonic: {
    en: "\"Read 4, Write 2, eXecute 1 — 7 is all, 5 is look-and-run, 4 is look-only.\" For SSH: 'seven-hundred the folder, six-hundred the key'.",
    he: "\"קריאה 4, כתיבה 2, הרצה 1 — 7 זה הכל, 5 זה לראות ולהריץ, 4 זה רק לראות.\" ול-SSH: 'שבע מאות לתיקייה, שש מאות למפתח'."
  },
  pitfalls: [
    { en: "usermod -G docker user without -a replaces ALL the user's supplementary groups — they can lose sudo.", he: "usermod -G docker user בלי -a מחליף את כל ה-groups של המשתמש — הוא יכול לאבד sudo." },
    { en: "Fixing perms on the file but not the parent directory: without x on every dir in the path, the file is unreachable.", he: "לתקן הרשאות על הקובץ ולא על תיקיית האב: בלי x על כל תיקייה בנתיב, אי אפשר להגיע לקובץ." },
    { en: "chmod -R 755 on a tree makes every data file executable; use X (capital) or find -type d / -type f separately.", he: "chmod -R 755 על עץ הופך כל קובץ דאטה ל-executable; תשתמש ב-X גדולה או ב-find -type d / -type f בנפרד." },
    { en: "sudo echo x > /etc/file fails: the redirect is done by your unprivileged shell. Use echo x | sudo tee /etc/file.", he: "sudo echo x > /etc/file נכשל: ה-redirect נעשה ע\"י ה-shell שלך שאין לו הרשאות. תשתמש ב-echo x | sudo tee /etc/file." }
  ],
  interview: [
    { q: { en: "What does chmod 640 mean, and what does x mean on a directory?", he: "מה המשמעות של chmod 640, ומה x אומר על תיקייה?" },
      a: { en: "640 = owner rw (6), group r (4), others nothing (0). On a directory, x is the search/traverse permission: you can cd into it and access entries by name; without it you can't reach anything inside even if you know the name.", he: "640 = לבעלים rw (6), ל-group r (4), לאחרים כלום (0). על תיקייה, x זו הרשאת מעבר: אפשר לעשות לה cd ולגשת לרשומות לפי שם; בלעדיה אי אפשר להגיע לשום דבר בפנים גם אם יודעים את השם." } },
    { q: { en: "A service gets 'Permission denied' reading its config. How do you debug?", he: "שירות מקבל 'Permission denied' כשהוא קורא את הקונפיג. איך מדבגים?" },
      a: { en: "Find the user it runs as (ps -o user= -p PID or the unit's User=), reproduce with sudo -u that-user cat file, run namei -l on the path to check every parent dir, then check SELinux/AppArmor denials and mount options (noexec/ro) if the mode bits look fine.", he: "מוצאים איזה user הוא רץ (ps -o user= -p PID או User= ב-unit), משחזרים עם sudo -u אותו-user cat file, מריצים namei -l על הנתיב כדי לבדוק כל תיקיית אב, ואם הביטים תקינים — בודקים SELinux/AppArmor ואת אפשרויות ה-mount (noexec/ro)." } },
    { q: { en: "What is umask and how does 027 affect new files?", he: "מה זה umask ואיך 027 משפיע על קבצים חדשים?" },
      a: { en: "umask removes bits from the default creation mode (666 files / 777 dirs). With 027, files become 640 and dirs 750: group can read, others get nothing.", he: "umask מוריד ביטים ממצב ברירת המחדל (666 לקבצים / 777 לתיקיות). עם 027 קבצים יוצאים 640 ותיקיות 750: ה-group יכול לקרוא, אחרים לא מקבלים כלום." } }
  ],
  quiz: [
    { q: { en: "Which mode is correct for an SSH private key?", he: "איזה mode נכון למפתח SSH פרטי?" },
      options: [ { en: "644", he: "644" }, { en: "600", he: "600" }, { en: "755", he: "755" }, { en: "666", he: "666" } ],
      answer: 1, explain: { en: "Only the owner may read/write it. ssh refuses keys that others can read (644 is world-readable).", he: "רק הבעלים קורא/כותב. ssh מסרב למפתחות שאחרים יכולים לקרוא (644 קריא לכולם)." } },
    { q: { en: "You have rw on a file but get 'Permission denied' opening it by full path. Most likely cause?", he: "יש לך rw על קובץ אבל אתה מקבל 'Permission denied' כשאתה פותח אותו לפי נתיב מלא. הסיבה הסבירה?" },
      options: [ { en: "The file's group is wrong", he: "ה-group של הקובץ לא נכון" }, { en: "A parent directory lacks x for you", he: "לתיקיית אב חסר x בשבילך" }, { en: "umask is 022", he: "ה-umask הוא 022" }, { en: "The file isn't executable", he: "הקובץ לא executable" } ],
      answer: 1, explain: { en: "Path traversal needs x on every directory. Opening for read doesn't need x on the file itself.", he: "מעבר בנתיב דורש x על כל תיקייה. פתיחה לקריאה לא דורשת x על הקובץ עצמו." } },
    { q: { en: "With umask 022, what mode does a newly created regular file get?", he: "עם umask 022, איזה mode מקבל קובץ רגיל חדש?" },
      options: [ { en: "755", he: "755" }, { en: "644", he: "644" }, { en: "600", he: "600" }, { en: "022", he: "022" } ],
      answer: 1, explain: { en: "Files start from 666 (no x by default) minus 022 = 644. Directories start at 777 → 755.", he: "קבצים מתחילים מ-666 (בלי x כברירת מחדל) פחות 022 = 644. תיקיות מתחילות מ-777 ← 755." } },
    { q: { en: "Why does 'sudo echo 1 > /proc/sys/net/ipv4/ip_forward' fail?", he: "למה 'sudo echo 1 > /proc/sys/net/ipv4/ip_forward' נכשל?" },
      options: [ { en: "echo isn't allowed under sudo", he: "אסור להריץ echo עם sudo" }, { en: "The redirection is performed by your non-root shell before sudo runs", he: "ה-redirect מתבצע ע\"י ה-shell שלך (לא root) לפני ש-sudo רץ" }, { en: "/proc is read-only", he: "‏/proc הוא read-only" }, { en: "You need chmod +x on the file", he: "צריך chmod +x על הקובץ" } ],
      answer: 1, explain: { en: "Only echo runs as root. Use: echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward (or sysctl -w).", he: "רק echo רץ כ-root. תשתמש ב: echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward (או sysctl -w)." } }
  ],
  playground: "terminal",
  related: ["linux-files-navigation", "linux-ssh-remote", "processes-linux"]
});

/* ============================== 3. TEXT PROCESSING ============================== */
INFRA.lessons.push({
  id: "linux-text-processing",
  track: "linux",
  order: 3,
  icon: "🔪",
  level: 2,
  minutes: 14,
  title: { en: "Text processing & pipes: grep, awk, sed, jq", he: "עיבוד טקסט ו-pipes: grep, awk, sed, jq" },
  tldr: {
    en: "Small tools that each do one thing, glued with pipes, turn a 2GB access log into an answer in one line — no Python, no Splunk, no waiting.",
    he: "כלים קטנים שכל אחד עושה דבר אחד, מודבקים עם pipes, הופכים access log של 2GB לתשובה בשורה אחת — בלי Python, בלי Splunk, בלי לחכות."
  },
  analogy: {
    en: "A pipeline is a factory conveyor belt. grep is the quality inspector throwing away irrelevant parts, cut and awk are the workers snapping off the one piece you need, sort lines them up, uniq -c counts identical ones, and head puts the top 10 on the manager's desk. Each worker is dumb and fast; the belt is where the intelligence lives.",
    he: "pipeline זה פס ייצור במפעל. grep הוא בודק האיכות שזורק חלקים לא רלוונטיים, cut ו-awk הם העובדים שתולשים את החתיכה שאתה צריך, sort מסדר אותם בשורה, uniq -c סופר את הזהים, ו-head שם את ה-top 10 על השולחן של המנהל. כל עובד טיפש ומהיר; האינטליגנציה נמצאת בפס."
  },
  sections: [
    {
      h: { en: "Viewing and searching: less, tail -f, grep", he: "לצפות ולחפש: less, tail -f, grep" },
      body: {
        en: `<p><code>cat</code> for small files, <code>less</code> for big ones (<code>/pattern</code> search, <code>n</code> next, <code>G</code> end, <code>F</code> follow like tail -f). <code>head -n 20</code> / <code>tail -n 50</code> for the edges, and <code>tail -F</code> to follow a log <em>even across rotation</em> (lowercase <code>-f</code> keeps watching the old, renamed file).</p>
<pre>$ grep -i "error" app.log              # case-insensitive
$ grep -rn "DB_HOST" /etc/myapp/        # recursive, with line numbers
$ grep -v "healthcheck" access.log      # invert: hide noise
$ grep -c " 502 " access.log            # count matching lines
1843
$ grep -E "timeout|refused" app.log     # extended regex: alternation
$ grep -oE "user_id=[0-9]+" app.log | head -3
user_id=4411
user_id=4411
user_id=93
$ grep -B 5 -A 20 "OutOfMemoryError" app.log   # 5 lines before, 20 after</pre>
<p><code>-o</code> prints only the match (perfect for feeding into <code>sort | uniq -c</code>), <code>-l</code> prints only filenames, <code>-w</code> matches whole words. <code>zgrep</code> searches <code>.gz</code> logs without unpacking.</p>`,
        he: `<p><code>cat</code> לקבצים קטנים, <code>less</code> לגדולים (<code>/pattern</code> חיפוש, <code>n</code> הבא, <code>G</code> לסוף, <code>F</code> מעקב כמו tail -f). <code>head -n 20</code> / <code>tail -n 50</code> לקצוות, ו-<code>tail -F</code> כדי לעקוב אחרי לוג <em>גם אחרי rotation</em> (‏<code>-f</code> קטן ממשיך להסתכל על הקובץ הישן ששינה שם).</p>
<pre>$ grep -i "error" app.log              # case-insensitive
$ grep -rn "DB_HOST" /etc/myapp/        # recursive, with line numbers
$ grep -v "healthcheck" access.log      # invert: hide noise
$ grep -c " 502 " access.log            # count matching lines
1843
$ grep -E "timeout|refused" app.log     # extended regex: alternation
$ grep -oE "user_id=[0-9]+" app.log | head -3
user_id=4411
user_id=4411
user_id=93
$ grep -B 5 -A 20 "OutOfMemoryError" app.log   # 5 lines before, 20 after</pre>
<p><code>-o</code> מדפיס רק את ההתאמה (מושלם להזנה ל-<code>sort | uniq -c</code>), ‏<code>-l</code> רק שמות קבצים, ‏<code>-w</code> מילים שלמות. <code>zgrep</code> מחפש בלוגים <code>.gz</code> בלי לפתוח אותם.</p>`
      }
    },
    {
      h: { en: "Pipes & redirection: >, >>, 2>&1, /dev/null, tee", he: "Pipes ו-redirection: ‏>, ‏>>, ‏2>&1, ‏/dev/null, tee" },
      body: {
        en: `<p>Every process has three streams: <strong>0 stdin</strong>, <strong>1 stdout</strong>, <strong>2 stderr</strong>. <code>|</code> connects stdout of the left to stdin of the right.</p>
<pre>$ cmd &gt; out.txt            # stdout to file (truncate!)
$ cmd &gt;&gt; out.txt           # append
$ cmd 2&gt; err.txt           # only stderr
$ cmd &gt; all.log 2&gt;&amp;1       # both: stdout to file, THEN stderr to where stdout points
$ cmd &amp;&gt; all.log           # bash shorthand for the same
$ cmd &gt; /dev/null 2&gt;&amp;1     # silence everything (cron classic)
$ cmd 2&gt;&amp;1 | grep -i warn  # pipe stderr too
$ ./deploy.sh | tee deploy.log   # see it AND save it
$ echo "10.0.0.5 db" | sudo tee -a /etc/hosts</pre>
<p>Order matters: <code>2&gt;&amp;1 &gt; file</code> sends stderr to the <em>terminal</em> (where stdout pointed at that moment) and only stdout to the file. Read <code>2&gt;&amp;1</code> as "make fd 2 a copy of fd 1 <em>as it is right now</em>".</p>
<blockquote>⚠️ Production tip: <code>&gt; file</code> truncates first. <code>sort file &gt; file</code> gives you an empty file. Write to a temp file and <code>mv</code>, or use <code>sponge</code> from moreutils.</blockquote>`,
        he: `<p>לכל תהליך יש שלושה streams: ‏<strong>0 stdin</strong>, ‏<strong>1 stdout</strong>, ‏<strong>2 stderr</strong>. ה-<code>|</code> מחבר את ה-stdout של השמאלי ל-stdin של הימני.</p>
<pre>$ cmd &gt; out.txt            # stdout to file (truncate!)
$ cmd &gt;&gt; out.txt           # append
$ cmd 2&gt; err.txt           # only stderr
$ cmd &gt; all.log 2&gt;&amp;1       # both: stdout to file, THEN stderr to where stdout points
$ cmd &amp;&gt; all.log           # bash shorthand for the same
$ cmd &gt; /dev/null 2&gt;&amp;1     # silence everything (cron classic)
$ cmd 2&gt;&amp;1 | grep -i warn  # pipe stderr too
$ ./deploy.sh | tee deploy.log   # see it AND save it
$ echo "10.0.0.5 db" | sudo tee -a /etc/hosts</pre>
<p>הסדר חשוב: <code>2&gt;&amp;1 &gt; file</code> שולח את stderr ל<em>טרמינל</em> (לאן ש-stdout הצביע באותו רגע) ורק את stdout לקובץ. תקרא את <code>2&gt;&amp;1</code> בתור "תעשה את fd 2 עותק של fd 1 <em>כמו שהוא עכשיו</em>".</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>&gt; file</code> קודם כל מרוקן את הקובץ. <code>sort file &gt; file</code> ייתן לך קובץ ריק. תכתוב לקובץ זמני ואז <code>mv</code>, או תשתמש ב-<code>sponge</code> מ-moreutils.</blockquote>`
      }
    },
    {
      h: { en: "The slicers: cut, sort, uniq, wc, tr, sed", he: "החותכים: cut, sort, uniq, wc, tr, sed" },
      body: {
        en: `<pre>$ cut -d: -f1,7 /etc/passwd | head -2       # fields 1 and 7, ':' delimiter
root:/bin/bash
daemon:/usr/sbin/nologin
$ sort -t, -k3 -nr data.csv | head           # by 3rd CSV column, numeric, descending
$ sort | uniq -c | sort -rn                  # THE frequency-count idiom
$ wc -l access.log                           # count lines
2381120 access.log
$ tr 'a-z' 'A-Z' &lt; names.txt                 # translate chars
$ tr -s ' ' &lt; ps.txt                         # squeeze repeated spaces (great before cut)
$ sed 's/http:/https:/g' urls.txt            # substitute, print result
$ sed -i.bak 's/^max_connections.*/max_connections = 500/' /etc/app.conf
$ sed -n '100,120p' big.log                  # print only lines 100-120
$ sed '/^#/d; /^$/d' nginx.conf              # strip comments and blank lines</pre>
<p><code>uniq</code> only collapses <em>adjacent</em> duplicates — always <code>sort</code> first. <code>sort -h</code> sorts human sizes (<code>2K 1M 3G</code>). <code>sed -i</code> edits in place; <code>-i.bak</code> keeps a backup (on macOS, <code>-i ''</code> is required — a classic portability trap).</p>`,
        he: `<pre>$ cut -d: -f1,7 /etc/passwd | head -2       # fields 1 and 7, ':' delimiter
root:/bin/bash
daemon:/usr/sbin/nologin
$ sort -t, -k3 -nr data.csv | head           # by 3rd CSV column, numeric, descending
$ sort | uniq -c | sort -rn                  # THE frequency-count idiom
$ wc -l access.log                           # count lines
2381120 access.log
$ tr 'a-z' 'A-Z' &lt; names.txt                 # translate chars
$ tr -s ' ' &lt; ps.txt                         # squeeze repeated spaces (great before cut)
$ sed 's/http:/https:/g' urls.txt            # substitute, print result
$ sed -i.bak 's/^max_connections.*/max_connections = 500/' /etc/app.conf
$ sed -n '100,120p' big.log                  # print only lines 100-120
$ sed '/^#/d; /^$/d' nginx.conf              # strip comments and blank lines</pre>
<p><code>uniq</code> מאחד רק כפילויות <em>צמודות</em> — תמיד <code>sort</code> לפני. <code>sort -h</code> ממיין גדלים קריאים (<code>2K 1M 3G</code>). <code>sed -i</code> עורך במקום; <code>-i.bak</code> שומר גיבוי (ב-macOS חייבים <code>-i ''</code> — מלכודת portability קלאסית).</p>`
      }
    },
    {
      h: { en: "awk, xargs and jq", he: "awk, xargs ו-jq" },
      body: {
        en: `<p><strong>awk</strong> splits each line on whitespace into <code>$1, $2, ... $NF</code> (last field) and runs <code>pattern { action }</code>. It's a whole language, but 90% of use is these:</p>
<pre>$ awk '{print $1}' access.log                         # 1st column (client IP)
$ awk '$9 &gt;= 500' access.log                          # filter: status &gt;= 500
$ awk '{sum += $10} END {print sum/1024/1024 " MB"}' access.log
18342.7 MB
$ awk -F: '$3 &gt;= 1000 {print $1}' /etc/passwd         # human users
$ awk '{c[$9]++} END {for (s in c) print s, c[s]}' access.log</pre>
<p><strong>xargs</strong> turns lines from stdin into arguments: <code>-n1</code> one per call, <code>-P8</code> 8 in parallel, <code>-I{}</code> placeholder, <code>-0</code> pairs with <code>find -print0</code> for filenames with spaces.</p>
<pre>$ cat hosts.txt | xargs -P10 -I{} ssh {} uptime
$ find . -name "*.log" -print0 | xargs -0 gzip</pre>
<p><strong>jq</strong> is awk for JSON:</p>
<pre>$ kubectl get pods -o json | jq -r '.items[] | select(.status.phase!="Running") | .metadata.name'
$ jq -r 'select(.level=="error") | [.ts, .msg] | @tsv' app.json.log
$ curl -s api/health | jq '.checks | keys'</pre>`,
        he: `<p><strong>awk</strong> מפצל כל שורה לפי רווחים ל-<code>$1, $2, ... $NF</code> (השדה האחרון) ומריץ <code>pattern { action }</code>. זו שפה שלמה, אבל 90% מהשימוש זה אלה:</p>
<pre>$ awk '{print $1}' access.log                         # 1st column (client IP)
$ awk '$9 &gt;= 500' access.log                          # filter: status &gt;= 500
$ awk '{sum += $10} END {print sum/1024/1024 " MB"}' access.log
18342.7 MB
$ awk -F: '$3 &gt;= 1000 {print $1}' /etc/passwd         # human users
$ awk '{c[$9]++} END {for (s in c) print s, c[s]}' access.log</pre>
<p><strong>xargs</strong> הופך שורות מ-stdin לארגומנטים: <code>-n1</code> אחד לכל קריאה, <code>-P8</code> שמונה במקביל, <code>-I{}</code> placeholder, ‏<code>-0</code> הולך יחד עם <code>find -print0</code> לשמות קבצים עם רווחים.</p>
<pre>$ cat hosts.txt | xargs -P10 -I{} ssh {} uptime
$ find . -name "*.log" -print0 | xargs -0 gzip</pre>
<p><strong>jq</strong> זה awk ל-JSON:</p>
<pre>$ kubectl get pods -o json | jq -r '.items[] | select(.status.phase!="Running") | .metadata.name'
$ jq -r 'select(.level=="error") | [.ts, .msg] | @tsv' app.json.log
$ curl -s api/health | jq '.checks | keys'</pre>`
      }
    },
    {
      h: { en: "Classic SRE one-liners on an nginx access log", he: "One-liners קלאסיים של SRE על access log של nginx" },
      body: {
        en: `<p>Combined log format: <code>$1</code> IP, <code>$4</code> <code>[12/Nov/2026:14:03:22</code>, <code>$7</code> path, <code>$9</code> status, <code>$10</code> bytes.</p>
<pre>$ awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10   # top 10 IPs
  48211 203.0.113.77
   9120 198.51.100.4
   ...
$ awk '$9 ~ /^5/ {print substr($4, 2, 17)}' access.log | uniq -c | tail -5   # 5xx per minute
     3 12/Nov/2026:14:01
     4 12/Nov/2026:14:02
   912 12/Nov/2026:14:03     &lt;-- incident starts here
$ awk '{s += $10} END {printf "%.1f GB\\n", s/1e9}' access.log           # total bytes served
$ awk '{print $7}' access.log | cut -d'?' -f1 | sort | uniq -c | sort -rn | head   # hottest endpoints
$ tail -F access.log | awk '$9 &gt;= 500 {print $9, $7}'                  # live 5xx stream</pre>
<p>The 5xx-per-minute trick works without sorting because log lines are already time-ordered, so equal minutes are adjacent.</p>
<blockquote>💡 Real world: during an incident, the top-IPs one-liner answers "are we being scraped/attacked or is it real traffic?" in 3 seconds — long before the dashboard finishes loading.</blockquote>`,
        he: `<p>פורמט combined: ‏<code>$1</code> IP, ‏<code>$4</code> <code>[12/Nov/2026:14:03:22</code>, ‏<code>$7</code> path, ‏<code>$9</code> status, ‏<code>$10</code> bytes.</p>
<pre>$ awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10   # top 10 IPs
  48211 203.0.113.77
   9120 198.51.100.4
   ...
$ awk '$9 ~ /^5/ {print substr($4, 2, 17)}' access.log | uniq -c | tail -5   # 5xx per minute
     3 12/Nov/2026:14:01
     4 12/Nov/2026:14:02
   912 12/Nov/2026:14:03     &lt;-- incident starts here
$ awk '{s += $10} END {printf "%.1f GB\\n", s/1e9}' access.log           # total bytes served
$ awk '{print $7}' access.log | cut -d'?' -f1 | sort | uniq -c | sort -rn | head   # hottest endpoints
$ tail -F access.log | awk '$9 &gt;= 500 {print $9, $7}'                  # live 5xx stream</pre>
<p>הטריק של 5xx לדקה עובד בלי sort כי שורות הלוג כבר מסודרות לפי זמן, אז דקות זהות צמודות.</p>
<blockquote>💡 מהשטח: באמצע תקלה, ה-one-liner של top IPs עונה על "תוקפים/סורקים אותנו או שזו תנועה אמיתית?" תוך 3 שניות — הרבה לפני שהדשבורד מסיים להיטען.</blockquote>`
      }
    }
  ],
  diagram: "access.log ─▶ awk '{print $1}' ─▶ sort ─▶ uniq -c ─▶ sort -rn ─▶ head -10\n   (2GB)        (IPs only)       (group)   (count)    (rank)      (top 10)\n\nfd 0 stdin ──▶ [ process ] ──▶ fd 1 stdout ──▶ | next cmd / > file\n                    └────────▶ fd 2 stderr ──▶ terminal (unless 2>&1)",
  handsOn: [
    { cmd: "awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10", what: { en: "Top 10 client IPs by request count — the #1 incident one-liner.", he: "10 ה-IPs עם הכי הרבה בקשות — ה-one-liner מספר 1 בתקלות." } },
    { cmd: "awk '$9 ~ /^5/ {print substr($4,2,17)}' /var/log/nginx/access.log | uniq -c", what: { en: "Count 5xx responses per minute to see exactly when an incident started.", he: "סופר תשובות 5xx לכל דקה כדי לראות בדיוק מתי התקלה התחילה." } },
    { cmd: "awk '{s+=$10} END {printf \"%.2f GB\\n\", s/1e9}' /var/log/nginx/access.log", what: { en: "Sum the response-size column to get total bytes served.", he: "סוכם את עמודת גודל התשובה — כמה bytes הוגשו בסך הכל." } },
    { cmd: "grep -rn --include='*.yaml' 'image:' .", what: { en: "Recursively find every image: line in YAML files, with file and line number.", he: "מוצא רקורסיבית כל שורת image: בקבצי YAML, עם שם קובץ ומספר שורה." } },
    { cmd: "grep -B 3 -A 15 'Exception' app.log | less", what: { en: "Show each exception with 3 lines of context before and the stack trace after.", he: "מציג כל exception עם 3 שורות הקשר לפני וה-stack trace אחרי." } },
    { cmd: "tail -F /var/log/nginx/access.log | grep --line-buffered ' 50[0-9] '", what: { en: "Live-follow a log (surviving rotation) and show only 5xx lines as they arrive.", he: "עוקב בלייב אחרי לוג (שורד rotation) ומציג רק שורות 5xx כשהן מגיעות." } },
    { cmd: "sed -i.bak 's/^\\(worker_connections\\).*/\\1 4096;/' /etc/nginx/nginx.conf", what: { en: "In-place edit of a config value, keeping nginx.conf.bak as a backup.", he: "עריכה במקום של ערך בקונפיג, עם nginx.conf.bak כגיבוי." } },
    { cmd: "kubectl get pods -A -o json | jq -r '.items[] | select(.status.phase!=\"Running\") | \"\\(.metadata.namespace)/\\(.metadata.name)\"'", what: { en: "List every pod that isn't Running, as namespace/name, using jq.", he: "מציג כל pod שלא במצב Running, בפורמט namespace/name, עם jq." } },
    { cmd: "./deploy.sh 2>&1 | tee deploy-$(date +%s).log", what: { en: "Run a script, see stdout+stderr live and save everything to a timestamped log.", he: "מריץ סקריפט, רואה stdout+stderr בלייב ושומר הכל ללוג עם timestamp." } },
    { cmd: "find . -name '*.log' -mtime +3 -print0 | xargs -0 -P4 gzip", what: { en: "Compress logs older than 3 days, 4 in parallel, safe for filenames with spaces.", he: "דוחס לוגים ישנים מ-3 ימים, 4 במקביל, בטוח לשמות קבצים עם רווחים." } }
  ],
  mnemonic: {
    en: "\"Grep finds it, Cut/Awk slices it, Sort lines it up, Uniq counts it, Head shows the winners\" — G-C-S-U-H: 'Good Coders Sort Until Happy'. And for redirects: '2>&1 goes LAST'.",
    he: "\"grep מוצא, awk חותך, sort מסדר, uniq סופר, head מכריז על המנצחים\". ולגבי redirect: '2>&1 תמיד בסוף' — קודם אומרים לאן stdout הולך, ואז ש-stderr ילך אחריו."
  },
  pitfalls: [
    { en: "uniq without sort first only merges adjacent duplicates — your counts will be silently wrong.", he: "uniq בלי sort לפני מאחד רק כפילויות צמודות — הספירה תהיה שגויה בשקט." },
    { en: "cmd 2>&1 > file vs cmd > file 2>&1: only the second captures stderr in the file.", he: "cmd 2>&1 > file לעומת cmd > file 2>&1: רק השני תופס את stderr בקובץ." },
    { en: "tail -f on a log that gets rotated keeps following the old file forever; use tail -F.", he: "tail -f על לוג שעובר rotation ממשיך לעקוב אחרי הקובץ הישן לנצח; תשתמש ב-tail -F." },
    { en: "grep in a live pipeline buffers output; add --line-buffered (and stdbuf -oL for other tools) or you'll see nothing for minutes.", he: "grep בתוך pipeline חי עושה buffering; תוסיף --line-buffered (ו-stdbuf -oL לכלים אחרים) אחרת לא תראה כלום דקות שלמות." }
  ],
  interview: [
    { q: { en: "Find the top 10 IPs hitting a server from its nginx access log.", he: "מצא את 10 ה-IPs שהכי פונים לשרת מתוך ה-access log של nginx." },
      a: { en: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10. awk extracts the IP column, sort groups identical IPs, uniq -c counts them, sort -rn orders by count descending, head keeps the top 10. On huge files, awk '{c[$1]++} END {for (i in c) print c[i], i}' | sort -rn | head avoids sorting every line.", he: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10. ‏awk שולף את עמודת ה-IP, ‏sort מקבץ IPs זהים, ‏uniq -c סופר, ‏sort -rn מסדר לפי ספירה בסדר יורד, ו-head משאיר 10. בקבצים ענקיים, awk '{c[$1]++} END {for (i in c) print c[i], i}' | sort -rn | head חוסך למיין כל שורה." } },
    { q: { en: "What does 2>&1 do and why does its position matter?", he: "מה 2>&1 עושה ולמה המיקום שלו חשוב?" },
      a: { en: "It duplicates file descriptor 2 (stderr) onto whatever fd 1 (stdout) points to at that moment. Redirections are processed left to right, so > file 2>&1 sends both to the file, while 2>&1 > file points stderr at the terminal and only then moves stdout to the file.", he: "הוא משכפל את file descriptor 2 (stderr) למה ש-fd 1 (stdout) מצביע עליו באותו רגע. ה-redirects מעובדים משמאל לימין, אז > file 2>&1 שולח את שניהם לקובץ, ואילו 2>&1 > file מכוון את stderr לטרמינל ורק אז מעביר את stdout לקובץ." } },
    { q: { en: "When would you use awk over cut?", he: "מתי תעדיף awk על cut?" },
      a: { en: "cut needs a single-character delimiter and can't handle runs of spaces; awk splits on any whitespace by default, can filter rows ($9 >= 500), do math (sums, averages), aggregate with associative arrays and format output. cut is fine for clean delimited data like /etc/passwd or CSV.", he: "cut צריך delimiter של תו אחד ולא מתמודד עם רצף רווחים; awk מפצל לפי כל whitespace כברירת מחדל, יכול לסנן שורות ($9 >= 500), לעשות חשבון (סכומים, ממוצעים), לצבור עם מערכים אסוציאטיביים ולעצב פלט. cut מספיק לדאטה מסודר עם delimiter כמו /etc/passwd או CSV." } }
  ],
  quiz: [
    { q: { en: "Which pipeline correctly counts occurrences of each status code (field 9)?", he: "איזה pipeline סופר נכון את המופעים של כל status code (שדה 9)?" },
      options: [ { en: "awk '{print $9}' log | uniq -c", he: "awk '{print $9}' log | uniq -c" }, { en: "awk '{print $9}' log | sort | uniq -c", he: "awk '{print $9}' log | sort | uniq -c" }, { en: "cut -f9 log | wc -l", he: "cut -f9 log | wc -l" }, { en: "grep -c '$9' log", he: "grep -c '$9' log" } ],
      answer: 1, explain: { en: "uniq only merges adjacent duplicates, so sort first. cut -f9 uses TAB by default and wc -l just counts lines.", he: "uniq מאחד רק כפילויות צמודות, אז קודם sort. ‏cut -f9 משתמש ב-TAB כברירת מחדל ו-wc -l רק סופר שורות." } },
    { q: { en: "You want both stdout and stderr of a cron job discarded. Which is correct?", he: "אתה רוצה לזרוק גם stdout וגם stderr של cron job. מה נכון?" },
      options: [ { en: "job 2>&1 > /dev/null", he: "job 2>&1 > /dev/null" }, { en: "job > /dev/null 2>&1", he: "job > /dev/null 2>&1" }, { en: "job | /dev/null", he: "job | /dev/null" }, { en: "job 1>2 /dev/null", he: "job 1>2 /dev/null" } ],
      answer: 1, explain: { en: "First point stdout at /dev/null, then make stderr a copy of it. The first option leaves stderr on the original stdout (cron mail).", he: "קודם מכוונים את stdout ל-/dev/null, ואז עושים את stderr עותק שלו. האופציה הראשונה משאירה את stderr על ה-stdout המקורי (מייל מ-cron)." } },
    { q: { en: "What does grep -v healthcheck access.log do?", he: "מה grep -v healthcheck access.log עושה?" },
      options: [ { en: "Shows verbose matches for healthcheck", he: "מציג התאמות מפורטות ל-healthcheck" }, { en: "Prints lines that do NOT contain 'healthcheck'", he: "מדפיס שורות שלא מכילות 'healthcheck'" }, { en: "Prints grep's version", he: "מדפיס את הגרסה של grep" }, { en: "Counts healthcheck lines", he: "סופר שורות healthcheck" } ],
      answer: 1, explain: { en: "-v inverts the match — the go-to way to strip noise from logs.", he: "‏-v הופך את ההתאמה — הדרך הקלאסית לנקות רעש מלוגים." } },
    { q: { en: "After 'sort data.txt > data.txt', what's in data.txt?", he: "אחרי 'sort data.txt > data.txt', מה יש ב-data.txt?" },
      options: [ { en: "The sorted data", he: "הדאטה ממוין" }, { en: "Nothing — the shell truncated it before sort read it", he: "כלום — ה-shell רוקן אותו לפני ש-sort קרא" }, { en: "The original data unchanged", he: "הדאטה המקורי בלי שינוי" }, { en: "An error is printed and the file is untouched", he: "מודפסת שגיאה והקובץ לא נגעו בו" } ],
      answer: 1, explain: { en: "The shell opens and truncates the output file before running sort. Use sort -o data.txt data.txt or a temp file.", he: "ה-shell פותח ומרוקן את קובץ הפלט לפני שהוא מריץ את sort. תשתמש ב-sort -o data.txt data.txt או בקובץ זמני." } }
  ],
  playground: "terminal",
  related: ["linux-files-navigation", "obs-logs", "linux-bash-scripting", "linux-toolkit"]
});

/* ============================== 4. PROCESSES ============================== */
INFRA.lessons.push({
  id: "linux-processes",
  track: "linux",
  order: 4,
  icon: "⚙️",
  level: 2,
  minutes: 12,
  title: { en: "Processes: ps, kill, signals, jobs, /proc, strace", he: "תהליכים: ps, kill, signals, jobs, ‏/proc, strace" },
  tldr: {
    en: "Find it with ps/pgrep, ask it nicely with SIGTERM, force it with SIGKILL only as a last resort, and when it's misbehaving silently, look inside with /proc, lsof and strace.",
    he: "מוצאים עם ps/pgrep, מבקשים יפה עם SIGTERM, מכריחים עם SIGKILL רק כמוצא אחרון, וכשמשהו מתנהג מוזר בשקט — מציצים פנימה עם ‎/proc, ‏lsof ו-strace."
  },
  analogy: {
    en: "Processes are employees. ps is the staff directory. SIGTERM is your manager saying 'please wrap up and go home' — they save their work and close the door. SIGKILL is security physically removing them from the building mid-sentence: fast, but whatever was half-written stays half-written. A zombie is an employee who already left but whose desk nobody cleared because their manager (parent) never signed the exit form.",
    he: "תהליכים הם עובדים. ps זה ספר הטלפונים של החברה. SIGTERM זה המנהל שאומר 'תסגור מה שאתה עושה ולך הביתה' — העובד שומר ונועל את הדלת. SIGKILL זה המאבטח שמוציא אותו מהבניין באמצע משפט: מהיר, אבל כל מה שנכתב חצי נשאר חצי. zombie זה עובד שכבר עזב אבל אף אחד לא פינה לו את השולחן, כי המנהל שלו (ה-parent) אף פעם לא חתם על טופס העזיבה."
  },
  sections: [
    {
      h: { en: "Finding processes: ps, pgrep, top-level view", he: "למצוא תהליכים: ps, pgrep" },
      body: {
        en: `<pre>$ ps aux --sort=-%mem | head -4
USER       PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
app       4121 87.3 41.2 9.1g  3.3g ?    Sl   09:12  91:02 java -Xmx4g -jar api.jar
postgres  1203  4.1 12.0 2.2g  980m ?    Ss   Nov10  40:11 postgres: checkpointer
root       812  0.3  0.4 1.2g   33m ?    Ssl  Nov10   5:40 /usr/bin/containerd
$ ps -ef --forest | grep -A3 [n]ginx
root      1501     1  0 Nov10 ?  00:00:00 nginx: master process /usr/sbin/nginx
www-data  1502  1501  0 Nov10 ?  00:02:11  \\_ nginx: worker process
$ pgrep -a -f "api.jar"
4121 java -Xmx4g -jar api.jar
$ ps -o pid,ppid,stat,etime,cmd -p 4121</pre>
<p><code>ps aux</code> (BSD style) shows %CPU/%MEM/RSS; <code>ps -ef</code> (System V) shows PPID — use it to see who spawned whom. <strong>RSS</strong> = real RAM used; <strong>VSZ</strong> = virtual, mostly irrelevant. <strong>STAT</strong>: <code>R</code> running, <code>S</code> sleeping, <code>D</code> uninterruptible (usually stuck on disk/NFS — can't even be killed), <code>Z</code> zombie, <code>T</code> stopped.</p>
<p>The <code>[n]ginx</code> trick stops grep from matching itself. Better: just use <code>pgrep -af</code>.</p>`,
        he: `<pre>$ ps aux --sort=-%mem | head -4
USER       PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
app       4121 87.3 41.2 9.1g  3.3g ?    Sl   09:12  91:02 java -Xmx4g -jar api.jar
postgres  1203  4.1 12.0 2.2g  980m ?    Ss   Nov10  40:11 postgres: checkpointer
root       812  0.3  0.4 1.2g   33m ?    Ssl  Nov10   5:40 /usr/bin/containerd
$ ps -ef --forest | grep -A3 [n]ginx
root      1501     1  0 Nov10 ?  00:00:00 nginx: master process /usr/sbin/nginx
www-data  1502  1501  0 Nov10 ?  00:02:11  \\_ nginx: worker process
$ pgrep -a -f "api.jar"
4121 java -Xmx4g -jar api.jar
$ ps -o pid,ppid,stat,etime,cmd -p 4121</pre>
<p><code>ps aux</code> (סגנון BSD) מראה %CPU/%MEM/RSS; ‏<code>ps -ef</code> (סגנון System V) מראה PPID — ככה רואים מי הוליד את מי. <strong>RSS</strong> = זיכרון RAM אמיתי; <strong>VSZ</strong> = וירטואלי, ברוב המקרים לא רלוונטי. <strong>STAT</strong>: ‏<code>R</code> רץ, ‏<code>S</code> ישן, ‏<code>D</code> uninterruptible (בדרך כלל תקוע על דיסק/NFS — אי אפשר אפילו להרוג), ‏<code>Z</code> zombie, ‏<code>T</code> stopped.</p>
<p>הטריק <code>[n]ginx</code> מונע מ-grep למצוא את עצמו. יותר טוב: פשוט <code>pgrep -af</code>.</p>`
      }
    },
    {
      h: { en: "Signals: -15 vs -9, -HUP for reload", he: "Signals: ‏‎-15 מול ‎-9, ו-HUP ל-reload" },
      body: {
        en: `<table>
<tr><th>Signal</th><th>#</th><th>Meaning</th></tr>
<tr><td>SIGTERM</td><td>15</td><td>Default of <code>kill</code>. "Please exit." Can be caught: app drains connections, flushes, exits.</td></tr>
<tr><td>SIGKILL</td><td>9</td><td>Kernel removes the process. Can't be caught, no cleanup, no flush.</td></tr>
<tr><td>SIGHUP</td><td>1</td><td>Many daemons (nginx, sshd, haproxy) reload config on HUP.</td></tr>
<tr><td>SIGINT</td><td>2</td><td>Ctrl+C.</td></tr>
<tr><td>SIGSTOP / SIGCONT</td><td>19 / 18</td><td>Freeze / resume (Ctrl+Z sends SIGTSTP).</td></tr>
</table>
<pre>$ kill 4121                 # SIGTERM
$ sleep 10; kill -0 4121 &amp;&amp; echo "still alive"
still alive
$ kill -9 4121              # last resort
$ kill -HUP $(cat /run/nginx.pid)
$ pkill -f "celery worker"  # by command-line pattern
$ killall -USR1 dd          # dd prints progress on USR1</pre>
<p><code>kill -0</code> sends nothing — it just checks the process exists and you're allowed to signal it.</p>
<blockquote>⚠️ Production tip: always TERM → wait → KILL. Jumping straight to <code>-9</code> can leave corrupt files, stale lock/PID files and unflushed buffers. This is exactly what Kubernetes does: SIGTERM, then <code>terminationGracePeriodSeconds</code> (30s), then SIGKILL.</blockquote>`,
        he: `<table>
<tr><th>Signal</th><th>#</th><th>משמעות</th></tr>
<tr><td>SIGTERM</td><td>15</td><td>ברירת המחדל של <code>kill</code>. "בבקשה תצא." אפשר לתפוס אותו: האפליקציה מנקזת חיבורים, עושה flush ויוצאת.</td></tr>
<tr><td>SIGKILL</td><td>9</td><td>ה-kernel מעיף את התהליך. אי אפשר לתפוס, אין ניקוי, אין flush.</td></tr>
<tr><td>SIGHUP</td><td>1</td><td>הרבה daemons (nginx, sshd, haproxy) טוענים קונפיג מחדש על HUP.</td></tr>
<tr><td>SIGINT</td><td>2</td><td>Ctrl+C.</td></tr>
<tr><td>SIGSTOP / SIGCONT</td><td>19 / 18</td><td>הקפאה / המשך (Ctrl+Z שולח SIGTSTP).</td></tr>
</table>
<pre>$ kill 4121                 # SIGTERM
$ sleep 10; kill -0 4121 &amp;&amp; echo "still alive"
still alive
$ kill -9 4121              # last resort
$ kill -HUP $(cat /run/nginx.pid)
$ pkill -f "celery worker"  # by command-line pattern
$ killall -USR1 dd          # dd prints progress on USR1</pre>
<p><code>kill -0</code> לא שולח כלום — רק בודק שהתהליך קיים ושמותר לך לשלוח לו signal.</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד TERM ← לחכות ← KILL. לקפוץ ישר ל-<code>-9</code> יכול להשאיר קבצים מושחתים, lock/PID files ישנים ו-buffers שלא נכתבו. זה בדיוק מה ש-Kubernetes עושה: SIGTERM, אחר כך <code>terminationGracePeriodSeconds</code> (‏30 שניות), ואז SIGKILL.</blockquote>`
      }
    },
    {
      h: { en: "Jobs, background, nohup, nice", he: "Jobs, רקע, nohup, nice" },
      body: {
        en: `<pre>$ ./backup.sh &amp;            # start in background
[1] 22311
$ long_task                  # oops, forgot &amp; → press Ctrl+Z
^Z
[2]+  Stopped    long_task
$ bg %2                      # continue it in the background
$ jobs -l
[1]- 22311 Running   ./backup.sh &amp;
[2]+ 22340 Running   long_task &amp;
$ fg %1                      # bring back to foreground
$ nohup ./migrate.sh &gt; migrate.log 2&gt;&amp;1 &amp;   # survives logout (ignores SIGHUP)
$ disown -h %2               # detach an already-running job from the shell
$ nice -n 19 tar czf /backup/www.tgz /var/www   # lowest CPU priority
$ renice -n 10 -p 4121       # lower priority of a running process
$ ionice -c3 -p 4121         # idle IO class: only touch disk when nobody else wants it</pre>
<p>When your SSH session dies, the shell sends SIGHUP to its jobs and they die. <code>nohup</code>/<code>disown</code> prevent that; for anything interactive or long, <code>tmux</code> is the better answer (see the SSH lesson). Niceness ranges from -20 (greedy) to 19 (polite); only root can go below 0.</p>`,
        he: `<pre>$ ./backup.sh &amp;            # start in background
[1] 22311
$ long_task                  # oops, forgot &amp; → press Ctrl+Z
^Z
[2]+  Stopped    long_task
$ bg %2                      # continue it in the background
$ jobs -l
[1]- 22311 Running   ./backup.sh &amp;
[2]+ 22340 Running   long_task &amp;
$ fg %1                      # bring back to foreground
$ nohup ./migrate.sh &gt; migrate.log 2&gt;&amp;1 &amp;   # survives logout (ignores SIGHUP)
$ disown -h %2               # detach an already-running job from the shell
$ nice -n 19 tar czf /backup/www.tgz /var/www   # lowest CPU priority
$ renice -n 10 -p 4121       # lower priority of a running process
$ ionice -c3 -p 4121         # idle IO class: only touch disk when nobody else wants it</pre>
<p>כשה-session של SSH מת, ה-shell שולח SIGHUP ל-jobs שלו והם מתים. <code>nohup</code>/<code>disown</code> מונעים את זה; לכל דבר אינטראקטיבי או ארוך, <code>tmux</code> זו התשובה הנכונה (ראה שיעור SSH). niceness נע בין ‎-20 (חמדן) ל-19 (מנומס); רק root יכול לרדת מתחת ל-0.</p>`
      }
    },
    {
      h: { en: "Zombies, orphans and exit codes", he: "Zombies, orphans ו-exit codes" },
      body: {
        en: `<p>When a process exits, it becomes a <strong>zombie</strong> (<code>Z</code>, <code>&lt;defunct&gt;</code>) until its parent calls <code>wait()</code> to read its exit code. Zombies use no CPU or memory — just a PID slot. Thousands of them means a buggy parent that never reaps; you can't kill a zombie (it's already dead), you kill or fix the <em>parent</em>.</p>
<pre>$ ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'
 9911  4121 Z    [python] &lt;defunct&gt;
$ ps -o pid,cmd -p 4121       # meet the negligent parent</pre>
<p>An <strong>orphan</strong> is a live process whose parent died; it gets re-parented to PID 1 (systemd), which reaps it properly. In containers your app often <em>is</em> PID 1 and doesn't reap — that's why <code>tini</code> / <code>docker run --init</code> exist.</p>
<p>Every process exits with a code: <code>0</code> = success, anything else = failure. <code>$?</code> holds the last one.</p>
<pre>$ grep -q root /etc/passwd; echo $?
0
$ ls /nope; echo $?
2
$ kill -9 $!; wait $!; echo $?
137        # 128 + 9 → killed by SIGKILL (hello, OOMKilled!)</pre>`,
        he: `<p>כשתהליך יוצא, הוא הופך ל-<strong>zombie</strong> (‏<code>Z</code>, ‏<code>&lt;defunct&gt;</code>) עד שה-parent קורא ל-<code>wait()</code> כדי לקרוא את ה-exit code. zombies לא צורכים CPU או זיכרון — רק תופסים PID. אלפים מהם = parent עם באג שלא אוסף את הילדים; אי אפשר להרוג zombie (הוא כבר מת), הורגים או מתקנים את ה-<em>parent</em>.</p>
<pre>$ ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'
 9911  4121 Z    [python] &lt;defunct&gt;
$ ps -o pid,cmd -p 4121       # meet the negligent parent</pre>
<p><strong>orphan</strong> זה תהליך חי שה-parent שלו מת; הוא עובר לאימוץ של PID 1 (‏systemd), שאוסף אותו כמו שצריך. בקונטיינרים האפליקציה שלך לרוב <em>היא</em> PID 1 ולא אוספת ילדים — בגלל זה קיימים <code>tini</code> / ‏<code>docker run --init</code>.</p>
<p>כל תהליך יוצא עם קוד: <code>0</code> = הצלחה, כל דבר אחר = כישלון. <code>$?</code> מחזיק את האחרון.</p>
<pre>$ grep -q root /etc/passwd; echo $?
0
$ ls /nope; echo $?
2
$ kill -9 $!; wait $!; echo $?
137        # 128 + 9 → killed by SIGKILL (hello, OOMKilled!)</pre>`
      }
    },
    {
      h: { en: "Looking inside: /proc/PID, lsof, strace", he: "להציץ פנימה: ‎/proc/PID, ‏lsof, ‏strace" },
      body: {
        en: `<pre>$ cat /proc/4121/status | grep -E "State|VmRSS|Threads"
State:  S (sleeping)
VmRSS:  3401224 kB
Threads:        212
$ tr '\\0' '\\n' &lt; /proc/4121/environ | grep DB_
DB_HOST=db-prod.internal
$ ls -l /proc/4121/cwd
lrwxrwxrwx 1 app app 0 Nov 12 14:10 /proc/4121/cwd -&gt; /opt/api
$ ls /proc/4121/fd | wc -l
1021                          # close to ulimit -n 1024? → "Too many open files"
$ lsof -p 4121 | grep -E "REG|IPv4" | head
$ lsof -i :8080               # who is listening/connected on port 8080
$ strace -f -p 4121 -e trace=network,openat -s 200
connect(87, {sa_family=AF_INET, sin_port=htons(5432), sin_addr=inet_addr("10.0.3.12")}, 16) = -1 ETIMEDOUT
$ strace -c -p 4121           # Ctrl+C after 10s → syscall summary</pre>
<p><code>strace</code> shows every system call — the ultimate "what is it actually doing?" tool. A process "hung" for 30s that shows <code>connect(...) = -1 ETIMEDOUT</code> isn't hung; it's waiting on the network.</p>
<blockquote>💡 Real world: strace adds heavy overhead (can slow a process 10x+). Use it briefly on prod, filter with <code>-e</code>, and prefer <code>perf</code>/eBPF tools for long investigations.</blockquote>`,
        he: `<pre>$ cat /proc/4121/status | grep -E "State|VmRSS|Threads"
State:  S (sleeping)
VmRSS:  3401224 kB
Threads:        212
$ tr '\\0' '\\n' &lt; /proc/4121/environ | grep DB_
DB_HOST=db-prod.internal
$ ls -l /proc/4121/cwd
lrwxrwxrwx 1 app app 0 Nov 12 14:10 /proc/4121/cwd -&gt; /opt/api
$ ls /proc/4121/fd | wc -l
1021                          # close to ulimit -n 1024? → "Too many open files"
$ lsof -p 4121 | grep -E "REG|IPv4" | head
$ lsof -i :8080               # who is listening/connected on port 8080
$ strace -f -p 4121 -e trace=network,openat -s 200
connect(87, {sa_family=AF_INET, sin_port=htons(5432), sin_addr=inet_addr("10.0.3.12")}, 16) = -1 ETIMEDOUT
$ strace -c -p 4121           # Ctrl+C after 10s → syscall summary</pre>
<p><code>strace</code> מראה כל system call — כלי ה-"מה הוא באמת עושה?" האולטימטיבי. תהליך ש"תקוע" 30 שניות ומראה <code>connect(...) = -1 ETIMEDOUT</code> לא תקוע; הוא מחכה לרשת.</p>
<blockquote>💡 מהשטח: ל-strace יש overhead כבד (יכול להאט תהליך פי 10 ויותר). תשתמש בו לזמן קצר בפרודקשן, תסנן עם <code>-e</code>, ולחקירות ארוכות עדיף <code>perf</code> או כלי eBPF.</blockquote>`
      }
    }
  ],
  diagram: "kill PID ──SIGTERM(15)──▶ app: drain, flush, exit(0)   ✔ graceful\n             │ still alive after grace period?\n             ▼\nkill -9 ──SIGKILL(9)──▶ kernel removes it  ✖ no cleanup → exit 137\n\nchild exits ─▶ ZOMBIE ─(parent wait())─▶ reaped\nparent dies ─▶ ORPHAN ─▶ adopted by PID 1",
  handsOn: [
    { cmd: "ps aux --sort=-%cpu | head -10", what: { en: "Top 10 processes by CPU usage (use -%mem for memory).", he: "10 התהליכים שהכי צורכים CPU (‏-%mem לזיכרון)." } },
    { cmd: "ps -ef --forest", what: { en: "Full process tree with PPIDs — see who spawned whom.", he: "עץ תהליכים מלא עם PPID — רואים מי הוליד את מי." } },
    { cmd: "pgrep -af java", what: { en: "Find PIDs and full command lines matching a pattern (no grep-matching-itself problem).", he: "מוצא PIDs ושורות פקודה מלאות לפי תבנית (בלי הבעיה של grep שמוצא את עצמו)." } },
    { cmd: "kill -TERM 4121; sleep 15; kill -0 4121 2>/dev/null && kill -KILL 4121", what: { en: "Graceful stop with a 15s grace period, then force-kill only if it's still alive.", he: "עצירה עדינה עם 15 שניות חסד, ו-kill -9 רק אם הוא עדיין חי." } },
    { cmd: "sudo kill -HUP $(cat /run/nginx.pid)", what: { en: "Tell nginx to reload its config without dropping connections.", he: "אומר ל-nginx לטעון קונפיג מחדש בלי להפיל חיבורים." } },
    { cmd: "nohup ./long-job.sh > job.log 2>&1 &", what: { en: "Run a job in the background that survives closing your SSH session.", he: "מריץ job ברקע ששורד סגירה של ה-session של SSH." } },
    { cmd: "ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'", what: { en: "List zombie processes along with their parent PID (the one to fix).", he: "מציג תהליכי zombie יחד עם ה-PPID שלהם (זה שצריך לתקן)." } },
    { cmd: "sudo lsof -i :8080", what: { en: "Which process is listening on or connected to port 8080.", he: "איזה תהליך מאזין או מחובר לפורט 8080." } },
    { cmd: "sudo strace -f -tt -p 4121 -e trace=network,openat -s 200", what: { en: "Live-trace a running process's network and file-open syscalls with timestamps.", he: "מעקב חי אחרי syscalls של רשת ופתיחת קבצים של תהליך רץ, עם timestamps." } },
    { cmd: "ls /proc/4121/fd | wc -l; grep 'open files' /proc/4121/limits", what: { en: "Compare a process's open file descriptors with its limit — diagnoses 'Too many open files'.", he: "משווה את מספר ה-fds הפתוחים של תהליך למגבלה שלו — מאבחן 'Too many open files'." } }
  ],
  mnemonic: {
    en: "\"15 asks, 9 axes, 1 refreshes\" — TERM asks politely, KILL takes the axe, HUP reloads. Exit code 128+N = killed by signal N (137 = 9, 143 = 15).",
    he: "\"15 מבקש, 9 שוחט, 1 מרענן\" — TERM מבקש יפה, KILL בלי שאלות, HUP טוען מחדש. exit code של 128+N = נהרג מ-signal מספר N (‏137 = 9, ‏143 = 15)."
  },
  pitfalls: [
    { en: "Defaulting to kill -9: no graceful shutdown, possible data corruption and stale locks. TERM first, always.", he: "kill -9 כברירת מחדל: אין כיבוי מסודר, אפשרות להשחתת דאטה ו-locks תקועים. תמיד TERM קודם." },
    { en: "Trying to kill a zombie or a D-state process: zombies are already dead (fix the parent), D-state waits on I/O (fix the disk/NFS).", he: "לנסות להרוג zombie או תהליך במצב D: zombie כבר מת (תתקן את ה-parent), ‏D מחכה ל-I/O (תתקן את הדיסק/NFS)." },
    { en: "pkill -f with a loose pattern ('python') kills far more than you intended. Preview with pgrep -af first.", he: "pkill -f עם תבנית רחבה ('python') הורג הרבה יותר ממה שהתכוונת. תבדוק קודם עם pgrep -af." },
    { en: "Running a long job with & and logging out — it receives SIGHUP and dies. Use nohup, disown, tmux or a systemd unit.", he: "להריץ job ארוך עם & ולהתנתק — הוא מקבל SIGHUP ומת. תשתמש ב-nohup, ‏disown, ‏tmux או unit של systemd." }
  ],
  interview: [
    { q: { en: "What's the difference between SIGTERM and SIGKILL?", he: "מה ההבדל בין SIGTERM ל-SIGKILL?" },
      a: { en: "SIGTERM (15) is a request: the process can catch it, finish in-flight work, flush and exit cleanly — or even ignore it. SIGKILL (9) is handled by the kernel; the process can't catch or ignore it and gets no chance to clean up. Best practice is TERM, wait a grace period, then KILL — what systemd and Kubernetes both do.", he: "SIGTERM (‏15) זו בקשה: התהליך יכול לתפוס אותה, לסיים עבודה שבאמצע, לעשות flush ולצאת נקי — או אפילו להתעלם. SIGKILL (‏9) מטופל ע\"י ה-kernel; התהליך לא יכול לתפוס או להתעלם ולא מקבל הזדמנות לנקות. הנוהל הנכון: TERM, לחכות grace period, ואז KILL — מה ש-systemd ו-Kubernetes עושים." } },
    { q: { en: "What is a zombie process and how do you get rid of it?", he: "מה זה zombie process ואיך נפטרים ממנו?" },
      a: { en: "A process that has exited but whose parent hasn't called wait() to collect its exit status. It holds only a PID table entry. You can't kill it; you make the parent reap it (send SIGCHLD, fix the bug) or kill the parent so PID 1 adopts and reaps it.", he: "תהליך שיצא אבל ה-parent שלו לא קרא ל-wait() כדי לאסוף את ה-exit status. הוא תופס רק רשומה בטבלת ה-PIDs. אי אפשר להרוג אותו; גורמים ל-parent לאסוף אותו (SIGCHLD, תיקון הבאג) או הורגים את ה-parent ואז PID 1 מאמץ ואוסף." } },
    { q: { en: "A process seems hung. How do you find out what it's doing?", he: "תהליך נראה תקוע. איך מבינים מה הוא עושה?" },
      a: { en: "Check its state in ps (D = blocked on I/O, S = sleeping), look at /proc/PID/stack and wchan, list open files and sockets with lsof -p, then strace -p PID to see the syscall it's blocked on (e.g. a connect() timing out, a futex wait, a read on a socket). For JVMs, a thread dump (jstack) complements this.", he: "בודקים את ה-state ב-ps (‏D = חסום על I/O, ‏S = ישן), מסתכלים על /proc/PID/stack ו-wchan, מציגים קבצים ו-sockets פתוחים עם lsof -p, ואז strace -p PID כדי לראות על איזה syscall הוא חסום (למשל connect() שעושה timeout, ‏futex, ‏read על socket). ב-JVM משלימים עם thread dump (‏jstack)." } }
  ],
  quiz: [
    { q: { en: "A container exits with code 137. What most likely happened?", he: "קונטיינר יוצא עם קוד 137. מה כנראה קרה?" },
      options: [ { en: "It exited normally", he: "הוא יצא כרגיל" }, { en: "It was killed with SIGKILL (e.g. OOM killer)", he: "הוא נהרג עם SIGKILL (למשל OOM killer)" }, { en: "A file was not found", he: "קובץ לא נמצא" }, { en: "It received SIGHUP", he: "הוא קיבל SIGHUP" } ],
      answer: 1, explain: { en: "128 + 9 = 137 → SIGKILL. SIGTERM would give 143, SIGHUP 129.", he: "‏128 + 9 = 137 ← SIGKILL. ‏SIGTERM היה נותן 143, ‏SIGHUP ‏129." } },
    { q: { en: "Which signal makes nginx reload its configuration?", he: "איזה signal גורם ל-nginx לטעון קונפיג מחדש?" },
      options: [ { en: "SIGKILL", he: "SIGKILL" }, { en: "SIGHUP", he: "SIGHUP" }, { en: "SIGSTOP", he: "SIGSTOP" }, { en: "SIGINT", he: "SIGINT" } ],
      answer: 1, explain: { en: "HUP is the conventional reload signal for daemons; nginx starts new workers with the new config and gracefully retires the old ones.", he: "HUP הוא ה-signal המקובל ל-reload ב-daemons; nginx מרים workers חדשים עם הקונפיג החדש ומוריד את הישנים בעדינות." } },
    { q: { en: "You see 2,000 processes in state Z. What do you do?", he: "אתה רואה 2,000 תהליכים במצב Z. מה עושים?" },
      options: [ { en: "kill -9 each zombie", he: "kill -9 לכל zombie" }, { en: "Find their parent (PPID) and fix/restart it", he: "למצוא את ה-parent (‏PPID) ולתקן/לאתחל אותו" }, { en: "Reboot is the only option", he: "reboot זו האופציה היחידה" }, { en: "Increase RAM", he: "להגדיל RAM" } ],
      answer: 1, explain: { en: "Zombies are already dead; only their parent can reap them. Kill/restart the parent and PID 1 reaps the leftovers.", he: "zombies כבר מתים; רק ה-parent יכול לאסוף אותם. הורגים/מאתחלים את ה-parent ו-PID 1 אוסף את השאריות." } },
    { q: { en: "What does 'kill -0 PID' do?", he: "מה 'kill -0 PID' עושה?" },
      options: [ { en: "Kills the process with the highest priority", he: "הורג את התהליך עם העדיפות הכי גבוהה" }, { en: "Checks whether the process exists and can be signaled, without sending anything", he: "בודק שהתהליך קיים ושאפשר לשלוח לו signal, בלי לשלוח כלום" }, { en: "Sends SIGTERM", he: "שולח SIGTERM" }, { en: "Kills the whole process group", he: "הורג את כל קבוצת התהליכים" } ],
      answer: 1, explain: { en: "Signal 0 performs only the permission/existence check — handy in scripts: kill -0 $PID && echo alive.", he: "signal 0 עושה רק את בדיקת הקיום וההרשאה — שימושי בסקריפטים: kill -0 $PID && echo alive." } }
  ],
  playground: "terminal",
  related: ["processes-linux", "linux-systemd-logs", "linux-performance-60s", "container-internals"]
});

/* ============================== 5. SYSTEMD & LOGS ============================== */
INFRA.lessons.push({
  id: "linux-systemd-logs",
  track: "linux",
  order: 5,
  icon: "🛎️",
  level: 2,
  minutes: 12,
  title: { en: "systemd, journalctl, logs & cron", he: "systemd, ‏journalctl, לוגים ו-cron" },
  tldr: {
    en: "systemd starts, restarts and supervises your services; journalctl is where their stdout goes; cron and timers run things on a schedule — learn the five verbs and you can run anything as a proper service.",
    he: "systemd מרים, מאתחל ומשגיח על השירותים שלך; journalctl זה לאן שה-stdout שלהם הולך; cron ו-timers מריצים דברים לפי לוח זמנים — תלמד את חמשת הפעלים ותוכל להריץ כל דבר כשירות אמיתי."
  },
  analogy: {
    en: "systemd is the building's facilities manager. Each service has a job card (unit file) saying how to start it, who it runs as, and what to do if it collapses (Restart=on-failure). The journal is the manager's logbook where everything any worker shouts gets written down with a timestamp. cron is the alarm clock on the wall; systemd timers are the same alarm clock, but the manager also writes down whether the job actually succeeded.",
    he: "systemd הוא אב הבית של הבניין. לכל שירות יש כרטיס עבודה (unit file) שאומר איך מרימים אותו, תחת איזה משתמש הוא רץ, ומה עושים אם הוא קורס (Restart=on-failure). ה-journal הוא היומן של אב הבית, שבו כל מה שעובד צועק נרשם עם timestamp. ‏cron זה השעון המעורר על הקיר; systemd timers זה אותו שעון, רק שאב הבית גם רושם אם המשימה באמת הצליחה."
  },
  sections: [
    {
      h: { en: "systemctl: the verbs you need", he: "systemctl: הפעלים שצריך" },
      body: {
        en: `<pre>$ systemctl status nginx
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Tue 2026-11-10 08:02:11 UTC; 2 days ago
   Main PID: 1501 (nginx)
      Tasks: 5 (limit: 9387)
     Memory: 14.2M
     CGroup: /system.slice/nginx.service
             ├─1501 "nginx: master process /usr/sbin/nginx"
             └─1502 "nginx: worker process"
Nov 12 13:58:01 web-1 nginx[1502]: upstream timed out (110) while reading ...</pre>
<p><code>status</code> shows state, PID, memory, the cgroup tree <em>and</em> the last 10 log lines — your first command for any broken service.</p>
<pre>$ sudo systemctl restart api        # stop + start
$ sudo systemctl reload nginx       # HUP-style reload, if the unit supports it
$ sudo systemctl enable --now api   # start at boot AND start now
$ sudo systemctl disable api        # don't start at boot (still running!)
$ systemctl is-active api; systemctl is-enabled api
$ systemctl --failed                # every failed unit on the box
$ systemctl list-units --type=service --state=running
$ sudo systemctl daemon-reload      # after editing ANY unit file</pre>
<p><strong>enable</strong> ≠ <strong>start</strong>: enable is about boot, start is about now. Forgetting enable = the service is gone after the next reboot.</p>`,
        he: `<pre>$ systemctl status nginx
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Tue 2026-11-10 08:02:11 UTC; 2 days ago
   Main PID: 1501 (nginx)
      Tasks: 5 (limit: 9387)
     Memory: 14.2M
     CGroup: /system.slice/nginx.service
             ├─1501 "nginx: master process /usr/sbin/nginx"
             └─1502 "nginx: worker process"
Nov 12 13:58:01 web-1 nginx[1502]: upstream timed out (110) while reading ...</pre>
<p><code>status</code> מראה מצב, PID, זיכרון, את עץ ה-cgroup <em>וגם</em> 10 שורות לוג אחרונות — הפקודה הראשונה לכל שירות שבור.</p>
<pre>$ sudo systemctl restart api        # stop + start
$ sudo systemctl reload nginx       # HUP-style reload, if the unit supports it
$ sudo systemctl enable --now api   # start at boot AND start now
$ sudo systemctl disable api        # don't start at boot (still running!)
$ systemctl is-active api; systemctl is-enabled api
$ systemctl --failed                # every failed unit on the box
$ systemctl list-units --type=service --state=running
$ sudo systemctl daemon-reload      # after editing ANY unit file</pre>
<p><strong>enable</strong> ≠ <strong>start</strong>: ‏enable זה על ה-boot, ‏start זה על עכשיו. שכחת enable = השירות נעלם אחרי ה-reboot הבא.</p>`
      }
    },
    {
      h: { en: "Writing a minimal unit file", he: "לכתוב unit file מינימלי" },
      body: {
        en: `<pre>$ sudo tee /etc/systemd/system/api.service &gt;/dev/null &lt;&lt;'EOF'
[Unit]
Description=Orders API
After=network-online.target
Wants=network-online.target

[Service]
User=api
WorkingDirectory=/opt/api
EnvironmentFile=/etc/api/env
ExecStart=/opt/api/bin/server --port 8080
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now api</pre>
<p>Key lines: <code>ExecStart</code> must be an absolute path and must run in the <em>foreground</em> (no <code>&amp;</code>, no daemonizing — systemd is the supervisor). <code>Restart=on-failure</code> restarts on non-zero exit or crash but not on a clean stop. <code>User=</code> so you never run as root. <code>LimitNOFILE</code> fixes "too many open files" — limits from <code>/etc/security/limits.conf</code> do <em>not</em> apply to systemd services.</p>
<blockquote>⚠️ Production tip: never edit files in <code>/lib/systemd/system</code> (package upgrades overwrite them). Use <code>systemctl edit nginx</code>, which creates a drop-in override in <code>/etc/systemd/system/nginx.service.d/override.conf</code>.</blockquote>`,
        he: `<pre>$ sudo tee /etc/systemd/system/api.service &gt;/dev/null &lt;&lt;'EOF'
[Unit]
Description=Orders API
After=network-online.target
Wants=network-online.target

[Service]
User=api
WorkingDirectory=/opt/api
EnvironmentFile=/etc/api/env
ExecStart=/opt/api/bin/server --port 8080
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now api</pre>
<p>השורות החשובות: <code>ExecStart</code> חייב נתיב מלא וחייב לרוץ ב-<em>foreground</em> (בלי <code>&amp;</code>, בלי daemonize — ה-supervisor זה systemd). <code>Restart=on-failure</code> מאתחל על exit code שאינו 0 או קריסה, אבל לא על עצירה נקייה. <code>User=</code> כדי שלעולם לא תרוץ כ-root. <code>LimitNOFILE</code> פותר "too many open files" — המגבלות מ-<code>/etc/security/limits.conf</code> <em>לא</em> חלות על שירותי systemd.</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם לא לערוך קבצים ב-<code>/lib/systemd/system</code> (שדרוג חבילה דורס אותם). תשתמש ב-<code>systemctl edit nginx</code>, שיוצר drop-in override ב-<code>/etc/systemd/system/nginx.service.d/override.conf</code>.</blockquote>`
      }
    },
    {
      h: { en: "journalctl and /var/log", he: "journalctl ו-/var/log" },
      body: {
        en: `<pre>$ journalctl -u api -f                       # follow one service (like tail -f)
$ journalctl -u api --since "10 min ago"
$ journalctl -u api --since "2026-11-12 13:55" --until "2026-11-12 14:10"
$ journalctl -u api -p err -b                # errors only, since this boot
$ journalctl -u api -n 100 --no-pager | grep -i timeout
$ journalctl -k | tail                       # kernel messages (= dmesg)
$ journalctl -b -1 -p warning                # previous boot — why did it reboot?
$ journalctl -u api -o json-pretty -n 1      # structured fields
$ journalctl --disk-usage
Archived and active journals take 3.9G in the file system.
$ sudo journalctl --vacuum-size=500M</pre>
<p>Classic files in <code>/var/log</code>: <code>syslog</code> (Debian/Ubuntu) or <code>messages</code> (RHEL), <code>auth.log</code>/<code>secure</code> (logins, sudo), <code>kern.log</code>, plus app dirs like <code>nginx/</code>. Many apps still write their own files, which brings us to <strong>logrotate</strong>:</p>
<pre>/var/log/api/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate        # or: postrotate → systemctl kill -s HUP api
}</pre>
<p>Test with <code>logrotate -d /etc/logrotate.d/api</code> (dry run) and <code>-f</code> to force. <code>copytruncate</code> is for apps that can't reopen their log file; it can lose a few lines during the copy.</p>`,
        he: `<pre>$ journalctl -u api -f                       # follow one service (like tail -f)
$ journalctl -u api --since "10 min ago"
$ journalctl -u api --since "2026-11-12 13:55" --until "2026-11-12 14:10"
$ journalctl -u api -p err -b                # errors only, since this boot
$ journalctl -u api -n 100 --no-pager | grep -i timeout
$ journalctl -k | tail                       # kernel messages (= dmesg)
$ journalctl -b -1 -p warning                # previous boot — why did it reboot?
$ journalctl -u api -o json-pretty -n 1      # structured fields
$ journalctl --disk-usage
Archived and active journals take 3.9G in the file system.
$ sudo journalctl --vacuum-size=500M</pre>
<p>הקבצים הקלאסיים ב-<code>/var/log</code>: ‏<code>syslog</code> (Debian/Ubuntu) או <code>messages</code> (RHEL), ‏<code>auth.log</code>/<code>secure</code> (התחברויות, sudo), ‏<code>kern.log</code>, ועוד תיקיות של אפליקציות כמו <code>nginx/</code>. הרבה אפליקציות עדיין כותבות לקבצים משלהן, ופה נכנס <strong>logrotate</strong>:</p>
<pre>/var/log/api/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate        # or: postrotate → systemctl kill -s HUP api
}</pre>
<p>בודקים עם <code>logrotate -d /etc/logrotate.d/api</code> (‏dry run) ו-<code>-f</code> כדי לכפות. <code>copytruncate</code> מיועד לאפליקציות שלא יודעות לפתוח מחדש את קובץ הלוג; הוא עלול לאבד כמה שורות בזמן ההעתקה.</p>`
      }
    },
    {
      h: { en: "cron vs systemd timers", he: "cron מול systemd timers" },
      body: {
        en: `<pre># ┌──────── minute (0-59)
# │ ┌────── hour (0-23)
# │ │ ┌──── day of month (1-31)
# │ │ │ ┌── month (1-12)
# │ │ │ │ ┌ day of week (0-7, 0 and 7 = Sunday)
# │ │ │ │ │
  */5 * * * *  /opt/bin/healthcheck.sh &gt;&gt; /var/log/hc.log 2&gt;&amp;1
  30 2 * * *   /opt/bin/backup.sh                 # 02:30 every day
  0 9 * * 1-5  /opt/bin/report.sh                 # 09:00 on weekdays
  0 0 1 * *    /opt/bin/monthly.sh                # midnight on the 1st</pre>
<p><code>crontab -e</code> edits your user's table, <code>crontab -l</code> lists it, system jobs live in <code>/etc/cron.d/</code> (with an extra <em>user</em> column). Cron runs with a minimal <code>PATH</code> and no profile — the #1 reason "it works in my shell but not in cron". Use absolute paths and redirect output to a log.</p>
<p><strong>systemd timers</strong> do the same with a <code>.timer</code> + <code>.service</code> pair: <code>OnCalendar=*-*-* 02:30:00</code>, <code>Persistent=true</code> (run missed jobs after downtime), <code>RandomizedDelaySec=</code> (avoid a thundering herd), and logs land in the journal. <code>systemctl list-timers</code> shows last and next run.</p>
<blockquote>💡 Real world: <code>*/5</code> on 500 servers all fire at :00, :05… and hammer the same API. Timers with <code>RandomizedDelaySec=60</code> spread them out for free.</blockquote>`,
        he: `<pre># ┌──────── minute (0-59)
# │ ┌────── hour (0-23)
# │ │ ┌──── day of month (1-31)
# │ │ │ ┌── month (1-12)
# │ │ │ │ ┌ day of week (0-7, 0 and 7 = Sunday)
# │ │ │ │ │
  */5 * * * *  /opt/bin/healthcheck.sh &gt;&gt; /var/log/hc.log 2&gt;&amp;1
  30 2 * * *   /opt/bin/backup.sh                 # 02:30 every day
  0 9 * * 1-5  /opt/bin/report.sh                 # 09:00 on weekdays
  0 0 1 * *    /opt/bin/monthly.sh                # midnight on the 1st</pre>
<p><code>crontab -e</code> עורך את הטבלה של המשתמש שלך, ‏<code>crontab -l</code> מציג אותה, ו-jobs של המערכת יושבים ב-<code>/etc/cron.d/</code> (עם עמודת <em>user</em> נוספת). cron רץ עם <code>PATH</code> מינימלי ובלי profile — הסיבה מספר 1 ל"זה עובד אצלי ב-shell אבל לא ב-cron". תשתמש בנתיבים מלאים ותפנה את הפלט ללוג.</p>
<p><strong>systemd timers</strong> עושים את אותו דבר עם זוג <code>.timer</code> + <code>.service</code>: ‏<code>OnCalendar=*-*-* 02:30:00</code>, ‏<code>Persistent=true</code> (מריץ jobs שפוספסו בזמן שהשרת היה למטה), ‏<code>RandomizedDelaySec=</code> (נגד thundering herd), והלוגים נוחתים ב-journal. <code>systemctl list-timers</code> מראה ריצה אחרונה והבאה.</p>
<blockquote>💡 מהשטח: <code>*/5</code> על 500 שרתים — כולם יורים ב-‎:00, ‏‎:05… ומפציצים את אותו API. timers עם <code>RandomizedDelaySec=60</code> מפזרים אותם בחינם.</blockquote>`
      }
    }
  ],
  diagram: "unit file ──daemon-reload──▶ systemd ──start──▶ ExecStart (foreground)\n                                 │                     │ crash / exit≠0\n                                 │◀── Restart=on-failure (after RestartSec)\n                                 └── stdout/stderr ──▶ journald ──▶ journalctl -u api\n\ncron:  m  h  dom  mon  dow   command\n      */5 *   *    *    *    /opt/bin/hc.sh",
  handsOn: [
    { cmd: "systemctl status api --no-pager -l", what: { en: "State, PID, memory, cgroup and the last log lines of a service, without truncation.", he: "מצב, PID, זיכרון, cgroup ושורות הלוג האחרונות של שירות, בלי חיתוך." } },
    { cmd: "journalctl -u api -f", what: { en: "Follow a service's logs live, like tail -f.", he: "עוקב אחרי הלוגים של שירות בלייב, כמו tail -f." } },
    { cmd: "journalctl -u api --since '30 min ago' -p err --no-pager", what: { en: "Only error-level (and worse) log lines from the last 30 minutes.", he: "רק שורות לוג ברמת error ומעלה מ-30 הדקות האחרונות." } },
    { cmd: "journalctl -b -1 -n 50 --no-pager", what: { en: "Last 50 lines of the previous boot — find out why the box rebooted or crashed.", he: "50 השורות האחרונות מה-boot הקודם — להבין למה השרת עשה reboot או קרס." } },
    { cmd: "systemctl --failed", what: { en: "List every unit currently in the failed state.", he: "מציג כל unit שנמצא כרגע במצב failed." } },
    { cmd: "sudo systemctl daemon-reload && sudo systemctl enable --now api", what: { en: "After creating/editing a unit file: reload systemd, enable at boot and start now.", he: "אחרי יצירה/עריכה של unit file: טוען מחדש את systemd, מפעיל ב-boot ומרים עכשיו." } },
    { cmd: "sudo systemctl edit api", what: { en: "Create a drop-in override (e.g. add LimitNOFILE or Environment) without touching the vendor unit.", he: "יוצר drop-in override (למשל להוסיף LimitNOFILE או Environment) בלי לגעת ב-unit של הספק." } },
    { cmd: "systemctl list-timers --all", what: { en: "Show all systemd timers with their last and next run times.", he: "מציג את כל ה-systemd timers עם זמני הריצה האחרונה והבאה." } },
    { cmd: "crontab -l; ls /etc/cron.d/", what: { en: "List your cron jobs and the system-wide ones.", he: "מציג את ה-cron jobs שלך ואת אלה של המערכת." } },
    { cmd: "sudo logrotate -d /etc/logrotate.d/nginx", what: { en: "Dry-run a logrotate config to see what it would rotate and why.", he: "dry-run לקונפיג של logrotate — לראות מה הוא היה מסובב ולמה." } }
  ],
  mnemonic: {
    en: "Cron fields: \"Mighty Hackers Destroy My Weekend\" — Minute, Hour, Day-of-month, Month, Weekday. And systemd: 'edit → daemon-reload → restart', never skip the middle.",
    he: "שדות cron: \"דקה, שעה, יום, חודש, יום-בשבוע\" — מהקטן לגדול, ורק יום-בשבוע בסוף כי הוא 'מחוץ לסדר'. ולגבי systemd: 'עורכים ← daemon-reload ← restart', אף פעם לא מדלגים על האמצע."
  },
  pitfalls: [
    { en: "Editing a unit file and forgetting daemon-reload — systemd keeps running the old definition (and warns you in status).", he: "לערוך unit file ולשכוח daemon-reload — systemd ממשיך להריץ את ההגדרה הישנה (ומזהיר על זה ב-status)." },
    { en: "ExecStart that daemonizes (forks into the background): systemd thinks it exited and restarts it in a loop. Run in the foreground or use Type=forking with PIDFile.", he: "ExecStart שעושה daemonize (‏fork לרקע): systemd חושב שהוא יצא ומאתחל אותו בלולאה. תריץ ב-foreground או תשתמש ב-Type=forking עם PIDFile." },
    { en: "cron jobs relying on PATH, aliases or env vars from .bashrc — cron has none of them. Use absolute paths and set variables in the crontab.", he: "cron jobs שמסתמכים על PATH, ‏aliases או משתני סביבה מ-‎.bashrc — ל-cron אין אף אחד מהם. תשתמש בנתיבים מלאים ותגדיר משתנים ב-crontab." },
    { en: "% in a crontab line is special (newline) — date +%F must be escaped as date +\\%F.", he: "‏% בשורת crontab הוא תו מיוחד (שורה חדשה) — date +%F צריך להיכתב date +\\%F." }
  ],
  interview: [
    { q: { en: "What's the difference between systemctl enable and systemctl start?", he: "מה ההבדל בין systemctl enable ל-systemctl start?" },
      a: { en: "start runs the unit now; enable creates symlinks so it starts automatically at boot (per its [Install] WantedBy target). They're independent; enable --now does both. A service can be running but disabled (gone after reboot) or enabled but stopped.", he: "start מריץ את ה-unit עכשיו; ‏enable יוצר symlinks כדי שיעלה אוטומטית ב-boot (לפי ה-WantedBy ב-[Install]). הם בלתי תלויים; ‏enable --now עושה את שניהם. שירות יכול לרוץ אבל להיות disabled (ייעלם אחרי reboot) או להיות enabled אבל עצור." } },
    { q: { en: "A service keeps crashing. Walk me through debugging it.", he: "שירות ממשיך לקרוס. תעביר אותי בדיבאג." },
      a: { en: "systemctl status to see exit code/signal and restart count; journalctl -u svc -n 200 --no-pager for the actual error; check if it's OOM (journalctl -k | grep -i oom, exit 137); run the ExecStart command manually as the same User with the same EnvironmentFile; check file/port permissions and limits (LimitNOFILE); finally systemctl show svc for effective settings.", he: "systemctl status לראות exit code/signal וכמה restarts היו; ‏journalctl -u svc -n 200 --no-pager לשגיאה האמיתית; לבדוק אם זה OOM (‏journalctl -k | grep -i oom, ‏exit 137); להריץ את פקודת ה-ExecStart ידנית עם אותו User ואותו EnvironmentFile; לבדוק הרשאות לקבצים/פורטים ומגבלות (LimitNOFILE); ולבסוף systemctl show svc להגדרות האפקטיביות." } },
    { q: { en: "Why might you choose a systemd timer over cron?", he: "למה לבחור systemd timer על פני cron?" },
      a: { en: "Logs and exit status go to the journal automatically, Persistent=true catches up on missed runs, RandomizedDelaySec spreads load, the job gets cgroup resource limits and dependency ordering, and you can trigger it manually with systemctl start. cron is simpler and universal.", he: "הלוגים וה-exit status נכנסים ל-journal אוטומטית, ‏Persistent=true משלים ריצות שפוספסו, ‏RandomizedDelaySec מפזר עומס, ה-job מקבל מגבלות משאבים של cgroup וסדר תלויות, ואפשר להפעיל ידנית עם systemctl start. ‏cron פשוט יותר וקיים בכל מקום." } }
  ],
  quiz: [
    { q: { en: "When does '0 3 * * 0' run?", he: "מתי '0 3 * * 0' רץ?" },
      options: [ { en: "Every day at 00:03", he: "כל יום ב-00:03" }, { en: "Sundays at 03:00", he: "בימי ראשון ב-03:00" }, { en: "Every 3 hours", he: "כל 3 שעות" }, { en: "On the 3rd of each month", he: "ב-3 לכל חודש" } ],
      answer: 1, explain: { en: "minute=0, hour=3, any day-of-month, any month, weekday 0 = Sunday.", he: "דקה=0, שעה=3, כל יום בחודש, כל חודש, יום בשבוע 0 = ראשון." } },
    { q: { en: "You edited /etc/systemd/system/api.service. What must you run before restarting?", he: "ערכת את /etc/systemd/system/api.service. מה חייבים להריץ לפני restart?" },
      options: [ { en: "systemctl enable api", he: "systemctl enable api" }, { en: "systemctl daemon-reload", he: "systemctl daemon-reload" }, { en: "journalctl --vacuum-size", he: "journalctl --vacuum-size" }, { en: "Nothing, systemd watches the file", he: "כלום, systemd עוקב אחרי הקובץ" } ],
      answer: 1, explain: { en: "systemd caches unit definitions; daemon-reload re-reads them.", he: "systemd שומר את הגדרות ה-units בזיכרון; ‏daemon-reload קורא אותן מחדש." } },
    { q: { en: "Which journalctl command shows only errors for the 'api' unit since the current boot?", he: "איזו פקודת journalctl מציגה רק errors של ה-unit 'api' מה-boot הנוכחי?" },
      options: [ { en: "journalctl api --errors", he: "journalctl api --errors" }, { en: "journalctl -u api -p err -b", he: "journalctl -u api -p err -b" }, { en: "journalctl -f api | grep error", he: "journalctl -f api | grep error" }, { en: "journalctl -k -u api", he: "journalctl -k -u api" } ],
      answer: 1, explain: { en: "-u selects the unit, -p err filters priority err and above, -b limits to this boot.", he: "‏-u בוחר את ה-unit, ‏-p err מסנן עדיפות err ומעלה, ו-‎-b מגביל ל-boot הנוכחי." } },
    { q: { en: "With Restart=on-failure, which event does NOT trigger a restart?", he: "עם Restart=on-failure, איזה אירוע לא יגרום ל-restart?" },
      options: [ { en: "Process exits with code 1", he: "התהליך יוצא עם קוד 1" }, { en: "Process is killed by SIGSEGV", he: "התהליך נהרג מ-SIGSEGV" }, { en: "systemctl stop api", he: "systemctl stop api" }, { en: "Watchdog timeout", he: "timeout של watchdog" } ],
      answer: 2, explain: { en: "A manual stop is a clean, intended stop. on-failure covers non-zero exits, crash signals, timeouts and watchdog failures.", he: "stop ידני זו עצירה נקייה ומכוונת. ‏on-failure מכסה exit שאינו 0, ‏signals של קריסה, ‏timeouts וכישלונות watchdog." } }
  ],
  playground: "terminal",
  related: ["linux-processes", "obs-logs", "linux-disks-storage"]
});

/* ============================== 6. NETWORKING COMMANDS ============================== */
INFRA.lessons.push({
  id: "linux-networking-commands",
  track: "linux",
  order: 6,
  icon: "🌐",
  level: 2,
  minutes: 13,
  title: { en: "Networking commands: ip, ss, dig, curl, nc, tcpdump", he: "פקודות רשת: ip, ss, dig, curl, nc, tcpdump" },
  tldr: {
    en: "Debug the network bottom-up: do I have an IP and route (ip), is anything listening (ss), does the name resolve (dig), can I reach the port (nc), does the app answer (curl) — and when all else fails, look at the packets (tcpdump).",
    he: "מדבגים רשת מלמטה למעלה: יש לי IP ו-route (‏ip), משהו מאזין (‏ss), השם מתורגם (‏dig), אני מגיע לפורט (‏nc), האפליקציה עונה (‏curl) — וכשכלום לא עוזר, מסתכלים על הפקטות (‏tcpdump)."
  },
  analogy: {
    en: "Sending a request is mailing a letter. ip a checks that your house has an address; ip r checks you know which post office to use; dig looks up the recipient's address in the phone book; nc knocks on their door to see if anyone's home; curl actually hands over the letter and reads the reply; tcpdump is the CCTV footage of the mailman to prove what really happened.",
    he: "לשלוח בקשה זה כמו לשלוח מכתב. ip a בודק שלבית שלך יש כתובת; ip r בודק שאתה יודע לאיזה סניף דואר ללכת; dig מחפש את הכתובת של הנמען בספר הטלפונים; nc דופק על הדלת לראות אם מישהו בבית; curl באמת מוסר את המכתב וקורא את התשובה; ו-tcpdump זה הצילומים של מצלמת האבטחה שמוכיחים מה הדוור באמת עשה."
  },
  sections: [
    {
      h: { en: "Interfaces, routes and listening ports: ip & ss", he: "ממשקים, routes ופורטים מאזינים: ip ו-ss" },
      body: {
        en: `<pre>$ ip -br a
lo        UNKNOWN  127.0.0.1/8 ::1/128
eth0      UP       10.0.1.23/24 fe80::4a1:2ff:fe3c:11/64
docker0   DOWN     172.17.0.1/16
$ ip r
default via 10.0.1.1 dev eth0 proto dhcp metric 100
10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.23
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1
$ ip r get 8.8.8.8
8.8.8.8 via 10.0.1.1 dev eth0 src 10.0.1.23
$ sudo ss -tulpn
Netid State  Local Address:Port  Peer Address:Port Process
tcp   LISTEN 127.0.0.1:5432      0.0.0.0:*         users:(("postgres",pid=1203,fd=6))
tcp   LISTEN 0.0.0.0:80          0.0.0.0:*         users:(("nginx",pid=1501,fd=8))
tcp   LISTEN *:8080              *:*               users:(("java",pid=4121,fd=41))
udp   UNCONN 127.0.0.53%lo:53    0.0.0.0:*         users:(("systemd-resolve",pid=601,fd=13))</pre>
<p><code>ss -tulpn</code> = <strong>t</strong>cp, <strong>u</strong>dp, <strong>l</strong>istening, <strong>p</strong>rocess, <strong>n</strong>umeric. The bind address is the #1 gotcha: <code>127.0.0.1:5432</code> is reachable only from this host; <code>0.0.0.0</code>/<code>*</code> means all interfaces. "Works on the box, connection refused from outside" → check this column first.</p>
<p><code>ss -tan state established | wc -l</code> counts connections; <code>ss -s</code> gives a summary including TIME-WAIT. <code>ifconfig</code>/<code>netstat</code> are deprecated but still everywhere — same info.</p>`,
        he: `<pre>$ ip -br a
lo        UNKNOWN  127.0.0.1/8 ::1/128
eth0      UP       10.0.1.23/24 fe80::4a1:2ff:fe3c:11/64
docker0   DOWN     172.17.0.1/16
$ ip r
default via 10.0.1.1 dev eth0 proto dhcp metric 100
10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.23
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1
$ ip r get 8.8.8.8
8.8.8.8 via 10.0.1.1 dev eth0 src 10.0.1.23
$ sudo ss -tulpn
Netid State  Local Address:Port  Peer Address:Port Process
tcp   LISTEN 127.0.0.1:5432      0.0.0.0:*         users:(("postgres",pid=1203,fd=6))
tcp   LISTEN 0.0.0.0:80          0.0.0.0:*         users:(("nginx",pid=1501,fd=8))
tcp   LISTEN *:8080              *:*               users:(("java",pid=4121,fd=41))
udp   UNCONN 127.0.0.53%lo:53    0.0.0.0:*         users:(("systemd-resolve",pid=601,fd=13))</pre>
<p><code>ss -tulpn</code> = ‏<strong>t</strong>cp, ‏<strong>u</strong>dp, ‏<strong>l</strong>istening, ‏<strong>p</strong>rocess, ‏<strong>n</strong>umeric. כתובת ה-bind היא המלכודת מספר 1: <code>127.0.0.1:5432</code> נגיש רק מהשרת עצמו; <code>0.0.0.0</code>/<code>*</code> זה כל הממשקים. "עובד על השרת, connection refused מבחוץ" ← קודם כל לבדוק את העמודה הזו.</p>
<p><code>ss -tan state established | wc -l</code> סופר חיבורים; ‏<code>ss -s</code> נותן סיכום כולל TIME-WAIT. ‏<code>ifconfig</code>/<code>netstat</code> deprecated אבל עדיין בכל מקום — אותו מידע.</p>`
      }
    },
    {
      h: { en: "Reachability & DNS: ping, mtr, dig, /etc/hosts", he: "נגישות ו-DNS: ping, mtr, dig, ‏/etc/hosts" },
      body: {
        en: `<pre>$ ping -c 3 10.0.3.12
64 bytes from 10.0.3.12: icmp_seq=1 ttl=64 time=0.412 ms
3 packets transmitted, 3 received, 0% packet loss
$ mtr -rwc 50 api.example.com        # traceroute + ping per hop, report mode
$ dig +short api.example.com
api-lb-123.eu-west-1.elb.amazonaws.com.
52.18.44.10
$ dig api.example.com @8.8.8.8       # ask a specific resolver
$ dig +trace example.com             # walk from the root servers down
$ dig -x 52.18.44.10 +short          # reverse lookup
$ host -t MX example.com
$ cat /etc/resolv.conf
nameserver 127.0.0.53
search svc.cluster.local cluster.local
options ndots:5
$ getent hosts db.internal           # resolve the way apps do (hosts file + DNS)
10.0.3.12       db.internal</pre>
<p>Ping failing doesn't mean the host is down — ICMP is often blocked by security groups. <code>dig</code> talks DNS directly and <em>ignores</em> <code>/etc/hosts</code>; <code>getent hosts</code> follows <code>/etc/nsswitch.conf</code> exactly like your app. So if <code>dig</code> and the app disagree, check <code>/etc/hosts</code>.</p>
<blockquote>💡 Real world: in Kubernetes, <code>ndots:5</code> + <code>search</code> domains make every external lookup try 4-5 suffixes first. A trailing dot (<code>api.example.com.</code>) skips them — a cheap latency win.</blockquote>`,
        he: `<pre>$ ping -c 3 10.0.3.12
64 bytes from 10.0.3.12: icmp_seq=1 ttl=64 time=0.412 ms
3 packets transmitted, 3 received, 0% packet loss
$ mtr -rwc 50 api.example.com        # traceroute + ping per hop, report mode
$ dig +short api.example.com
api-lb-123.eu-west-1.elb.amazonaws.com.
52.18.44.10
$ dig api.example.com @8.8.8.8       # ask a specific resolver
$ dig +trace example.com             # walk from the root servers down
$ dig -x 52.18.44.10 +short          # reverse lookup
$ host -t MX example.com
$ cat /etc/resolv.conf
nameserver 127.0.0.53
search svc.cluster.local cluster.local
options ndots:5
$ getent hosts db.internal           # resolve the way apps do (hosts file + DNS)
10.0.3.12       db.internal</pre>
<p>ping שנכשל לא אומר שהשרת למטה — ICMP הרבה פעמים חסום ב-security groups. ‏<code>dig</code> מדבר DNS ישירות ו<em>מתעלם</em> מ-<code>/etc/hosts</code>; ‏<code>getent hosts</code> הולך לפי <code>/etc/nsswitch.conf</code> בדיוק כמו האפליקציה. אז אם <code>dig</code> והאפליקציה לא מסכימים — תבדוק את <code>/etc/hosts</code>.</p>
<blockquote>💡 מהשטח: ב-Kubernetes, ‏<code>ndots:5</code> יחד עם <code>search</code> domains גורמים לכל lookup חיצוני לנסות 4-5 סיומות קודם. נקודה בסוף (<code>api.example.com.</code>) מדלגת עליהן — שיפור latency בחינם.</blockquote>`
      }
    },
    {
      h: { en: "curl like a pro (and wget, nc)", he: "curl כמו מקצוען (ו-wget, nc)" },
      body: {
        en: `<pre>$ curl -sI https://api.example.com/health        # HEAD: status + headers only
HTTP/2 200
content-type: application/json
x-request-id: 8f1c2a
$ curl -v https://api.example.com 2&gt;&amp;1 | grep -E "^\\* (Connected|SSL|Server cert)|^&lt; HTTP"
$ curl -s -o /dev/null -w "dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} code=%{http_code}\\n" https://api.example.com
dns=0.004 tcp=0.021 tls=0.058 ttfb=0.912 total=0.915 code=200
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \\
       -d '{"sku":"A1","qty":2}' https://api.example.com/orders
$ curl --resolve api.example.com:443:10.0.1.50 https://api.example.com/   # hit ONE backend, keep SNI/Host
$ curl -L -o app.tgz https://example.com/app.tgz    # follow redirects, save
$ wget -c https://example.com/big.iso               # resume a download
$ nc -zv db.internal 5432
Connection to db.internal (10.0.3.12) 5432 port [tcp/postgresql] succeeded!
$ nc -zv -w 3 10.0.3.12 6379
nc: connect to 10.0.3.12 port 6379 (tcp) timed out: Operation now in progress</pre>
<p>The <code>-w</code> timing line is gold: here TTFB (0.91s) dwarfs DNS/TCP/TLS, so the slowness is in the <em>application</em>, not the network. <strong>Refused</strong> = host reachable, nothing listening (or REJECT rule). <strong>Timed out</strong> = packets dropped: firewall / security group / routing.</p>`,
        he: `<pre>$ curl -sI https://api.example.com/health        # HEAD: status + headers only
HTTP/2 200
content-type: application/json
x-request-id: 8f1c2a
$ curl -v https://api.example.com 2&gt;&amp;1 | grep -E "^\\* (Connected|SSL|Server cert)|^&lt; HTTP"
$ curl -s -o /dev/null -w "dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} code=%{http_code}\\n" https://api.example.com
dns=0.004 tcp=0.021 tls=0.058 ttfb=0.912 total=0.915 code=200
$ curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \\
       -d '{"sku":"A1","qty":2}' https://api.example.com/orders
$ curl --resolve api.example.com:443:10.0.1.50 https://api.example.com/   # hit ONE backend, keep SNI/Host
$ curl -L -o app.tgz https://example.com/app.tgz    # follow redirects, save
$ wget -c https://example.com/big.iso               # resume a download
$ nc -zv db.internal 5432
Connection to db.internal (10.0.3.12) 5432 port [tcp/postgresql] succeeded!
$ nc -zv -w 3 10.0.3.12 6379
nc: connect to 10.0.3.12 port 6379 (tcp) timed out: Operation now in progress</pre>
<p>שורת ה-timing של <code>-w</code> שווה זהב: פה ה-TTFB (‏0.91 שניות) מגמד את DNS/TCP/TLS, אז האיטיות היא ב<em>אפליקציה</em>, לא ברשת. <strong>Refused</strong> = השרת נגיש, אף אחד לא מאזין (או חוק REJECT). <strong>Timed out</strong> = הפקטות נזרקות: firewall / security group / routing.</p>`
      }
    },
    {
      h: { en: "tcpdump and a quick look at the firewall", he: "tcpdump ומבט מהיר על ה-firewall" },
      body: {
        en: `<pre>$ sudo tcpdump -i eth0 -nn port 5432 -c 20
14:21:07.112 IP 10.0.1.23.51544 &gt; 10.0.3.12.5432: Flags [S], seq 1203..., length 0
14:21:08.115 IP 10.0.1.23.51544 &gt; 10.0.3.12.5432: Flags [S], seq 1203..., length 0   &lt;-- SYN retransmit, no reply
$ sudo tcpdump -i any -nn host 10.0.3.12 and tcp port 443
$ sudo tcpdump -i eth0 -nn -A 'tcp port 80 and (tcp[tcpflags] &amp; tcp-push != 0)'   # HTTP payloads
$ sudo tcpdump -i eth0 -w /tmp/cap.pcap port 53     # save, open later in Wireshark</pre>
<p>Reading flags: <code>[S]</code> SYN, <code>[S.]</code> SYN-ACK, <code>[.]</code> ACK, <code>[P.]</code> data, <code>[F.]</code> FIN, <code>[R]</code> reset. SYNs with no SYN-ACK = something drops them. An immediate <code>[R]</code> = port closed or a firewall rejecting.</p>
<pre>$ sudo iptables -L -n -v --line-numbers | head -20
Chain INPUT (policy DROP 1840 packets, 110K bytes)
num  pkts bytes target  prot opt in  out source     destination
1    2.1M  890M ACCEPT  all  --  lo  *   0.0.0.0/0  0.0.0.0/0
2    9.8M  6.1G ACCEPT  all  --  *   *   0.0.0.0/0  0.0.0.0/0  ctstate RELATED,ESTABLISHED
3     412 24720 ACCEPT  tcp  --  *   *   0.0.0.0/0  0.0.0.0/0  tcp dpt:22
$ sudo ufw status verbose
$ sudo nft list ruleset           # modern distros: iptables is often a wrapper over nftables</pre>
<blockquote>⚠️ Production tip: always use <code>-nn</code> (no DNS/port-name lookups — otherwise tcpdump generates its own DNS traffic) and a filter + <code>-c</code> count on busy boxes. And before touching firewall rules over SSH, schedule a rollback: <code>sudo at now + 5 min &lt;&lt;&lt; "ufw disable"</code>.</blockquote>`,
        he: `<pre>$ sudo tcpdump -i eth0 -nn port 5432 -c 20
14:21:07.112 IP 10.0.1.23.51544 &gt; 10.0.3.12.5432: Flags [S], seq 1203..., length 0
14:21:08.115 IP 10.0.1.23.51544 &gt; 10.0.3.12.5432: Flags [S], seq 1203..., length 0   &lt;-- SYN retransmit, no reply
$ sudo tcpdump -i any -nn host 10.0.3.12 and tcp port 443
$ sudo tcpdump -i eth0 -nn -A 'tcp port 80 and (tcp[tcpflags] &amp; tcp-push != 0)'   # HTTP payloads
$ sudo tcpdump -i eth0 -w /tmp/cap.pcap port 53     # save, open later in Wireshark</pre>
<p>לקרוא flags: ‏<code>[S]</code> SYN, ‏<code>[S.]</code> SYN-ACK, ‏<code>[.]</code> ACK, ‏<code>[P.]</code> דאטה, ‏<code>[F.]</code> FIN, ‏<code>[R]</code> reset. ‏SYNs בלי SYN-ACK = משהו זורק אותם. ‏<code>[R]</code> מיידי = פורט סגור או firewall שדוחה.</p>
<pre>$ sudo iptables -L -n -v --line-numbers | head -20
Chain INPUT (policy DROP 1840 packets, 110K bytes)
num  pkts bytes target  prot opt in  out source     destination
1    2.1M  890M ACCEPT  all  --  lo  *   0.0.0.0/0  0.0.0.0/0
2    9.8M  6.1G ACCEPT  all  --  *   *   0.0.0.0/0  0.0.0.0/0  ctstate RELATED,ESTABLISHED
3     412 24720 ACCEPT  tcp  --  *   *   0.0.0.0/0  0.0.0.0/0  tcp dpt:22
$ sudo ufw status verbose
$ sudo nft list ruleset           # modern distros: iptables is often a wrapper over nftables</pre>
<blockquote>⚠️ טיפ לפרודקשן: תמיד <code>-nn</code> (בלי תרגום DNS ושמות פורטים — אחרת tcpdump מייצר תעבורת DNS משלו) ופילטר + ‏<code>-c</code> על שרתים עמוסים. ולפני שנוגעים בחוקי firewall דרך SSH, מתזמנים rollback: <code>sudo at now + 5 min &lt;&lt;&lt; "ufw disable"</code>.</blockquote>`
      }
    }
  ],
  diagram: "Bottom-up checklist (stop at the first failure):\n 1. ip -br a / ip r        → do I have an IP & a route?\n 2. getent hosts / dig     → does the name resolve (to the right IP)?\n 3. ping / mtr             → is the host reachable? (ICMP may be blocked)\n 4. nc -zv host port       → TCP open? refused = nobody listening, timeout = firewall\n 5. ss -tulpn (server)     → listening on 0.0.0.0 or only 127.0.0.1?\n 6. curl -v -w timings     → TLS ok? HTTP code? where is the time spent?\n 7. tcpdump -nn            → what packets actually flow?",
  handsOn: [
    { cmd: "sudo ss -tulpn", what: { en: "Every listening TCP/UDP socket with the owning process and bind address.", he: "כל socket מאזין ב-TCP/UDP עם התהליך שמחזיק אותו וכתובת ה-bind." } },
    { cmd: "ip -br a && ip r", what: { en: "Brief view of interfaces/IPs, then the routing table (look for the default route).", he: "תצוגה מקוצרת של ממשקים ו-IPs, ואז טבלת הניתוב (לחפש את ה-default route)." } },
    { cmd: "nc -zv -w 3 db.internal 5432", what: { en: "Check if a TCP port is open with a 3s timeout — refused vs timed out tells you a lot.", he: "בודק אם פורט TCP פתוח עם timeout של 3 שניות — refused מול timed out אומר המון." } },
    { cmd: "curl -s -o /dev/null -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} code=%{http_code}\\n' https://example.com", what: { en: "Break an HTTP request's latency into DNS, TCP, TLS, time-to-first-byte and total.", he: "מפרק את ה-latency של בקשת HTTP ל-DNS, ‏TCP, ‏TLS, ‏time-to-first-byte וסה\"כ." } },
    { cmd: "curl -sv --resolve api.example.com:443:10.0.1.50 https://api.example.com/health", what: { en: "Send a request to one specific backend IP while keeping the right Host/SNI — bypass the LB/DNS.", he: "שולח בקשה ל-IP של backend ספציפי עם ה-Host/SNI הנכונים — עוקף את ה-LB וה-DNS." } },
    { cmd: "dig +short api.example.com @1.1.1.1", what: { en: "Resolve a name via a specific public resolver — compare with your local resolver to spot DNS issues.", he: "מתרגם שם דרך resolver ציבורי מסוים — משווים ל-resolver המקומי כדי לזהות בעיות DNS." } },
    { cmd: "getent hosts db.internal", what: { en: "Resolve exactly like applications do (honors /etc/hosts and nsswitch).", he: "מתרגם בדיוק כמו שאפליקציות עושות (כולל /etc/hosts ו-nsswitch)." } },
    { cmd: "mtr -rwc 100 api.example.com", what: { en: "Per-hop loss and latency report over 100 probes — find where packets get lost.", he: "דוח איבוד פקטות ו-latency לכל hop על 100 בדיקות — למצוא איפה פקטות הולכות לאיבוד." } },
    { cmd: "sudo tcpdump -i any -nn -c 50 host 10.0.3.12 and port 5432", what: { en: "Capture 50 packets to/from a DB host on port 5432 — see SYNs, resets, retransmits.", he: "לוכד 50 פקטות מ/אל שרת DB בפורט 5432 — רואים SYNs, ‏resets ו-retransmits." } },
    { cmd: "ss -tan | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn", what: { en: "Count TCP connections by state (ESTAB, TIME-WAIT, CLOSE-WAIT...). Lots of CLOSE-WAIT = app not closing sockets.", he: "סופר חיבורי TCP לפי state (‏ESTAB, ‏TIME-WAIT, ‏CLOSE-WAIT...). הרבה CLOSE-WAIT = האפליקציה לא סוגרת sockets." } }
  ],
  mnemonic: {
    en: "\"ss -tulpn\" reads like 'tulip-n' 🌷 — Tcp, Udp, Listening, Process, Numeric. Debug order bottom-up: \"I Really Do Need Coffee Today\" — Ip, Route, Dig, Nc, Curl, Tcpdump.",
    he: "‏ss -tulpn = \"טוליפ-N\" 🌷. וסדר הדיבאג מלמטה למעלה: IP ← route ← DNS ← פורט ← אפליקציה ← פקטות. \"אני רוצה דואר, נו, כבר, תכף\" — ip, ‏route, ‏dig, ‏nc, ‏curl, ‏tcpdump."
  },
  pitfalls: [
    { en: "Concluding a host is down because ping fails — ICMP is commonly blocked. Test the actual port with nc or curl.", he: "להסיק שהשרת למטה כי ping נכשל — ICMP חסום הרבה פעמים. תבדוק את הפורט עצמו עם nc או curl." },
    { en: "Using dig to debug what the app sees — dig bypasses /etc/hosts. Use getent hosts.", he: "להשתמש ב-dig כדי להבין מה האפליקציה רואה — dig עוקף את /etc/hosts. תשתמש ב-getent hosts." },
    { en: "Service bound to 127.0.0.1 and wondering why it's unreachable from other hosts — check the Local Address column in ss.", he: "שירות שמאזין על 127.0.0.1 ותוהים למה אי אפשר להגיע אליו משרתים אחרים — תבדוק את עמודת Local Address ב-ss." },
    { en: "Running tcpdump without -nn and filters on a busy server — it floods your terminal and generates its own DNS lookups.", he: "להריץ tcpdump בלי -nn ובלי פילטרים על שרת עמוס — מציף את הטרמינל ומייצר lookups של DNS משלו." }
  ],
  interview: [
    { q: { en: "An app can't connect to a database. How do you troubleshoot from the app host?", he: "אפליקציה לא מצליחה להתחבר ל-DB. איך מדבגים מהשרת של האפליקציה?" },
      a: { en: "Resolve the DB name (getent hosts / dig) and verify the IP; nc -zv host port: 'refused' means reachable but nothing listening (check ss -tlnp on the DB and its bind address), 'timeout' means filtered (security groups, NACLs, iptables, routing — ip r get). If TCP works, test auth/TLS with the real client (psql) and check DB logs and max_connections. tcpdump confirms whether SYNs get answered.", he: "מתרגמים את שם ה-DB (‏getent hosts / dig) ומוודאים את ה-IP; ‏nc -zv host port: ‏'refused' = נגיש אבל אף אחד לא מאזין (לבדוק ss -tlnp על ה-DB ואת כתובת ה-bind), ‏'timeout' = מסונן (security groups, ‏NACLs, ‏iptables, ‏routing — ‏ip r get). אם TCP עובד, בודקים auth/TLS עם ה-client האמיתי (‏psql) ומסתכלים בלוגים של ה-DB וב-max_connections. ‏tcpdump מאשר אם ה-SYNs מקבלים תשובה." } },
    { q: { en: "What's the difference between 'connection refused' and 'connection timed out'?", he: "מה ההבדל בין 'connection refused' ל-'connection timed out'?" },
      a: { en: "Refused: the target host answered with a TCP RST — it's reachable but no process listens on that port (or a firewall REJECTs). Timed out: no answer at all — packets are dropped by a firewall/security group, routing is broken or the host is down.", he: "Refused: השרת ענה עם TCP RST — הוא נגיש אבל אף תהליך לא מאזין על הפורט (או firewall עם REJECT). ‏Timed out: אין תשובה בכלל — הפקטות נזרקות ע\"י firewall/security group, ה-routing שבור או שהשרת למטה." } },
    { q: { en: "A request is slow. How do you tell if it's the network or the server?", he: "בקשה איטית. איך יודעים אם זו הרשת או השרת?" },
      a: { en: "curl -w with time_namelookup, time_connect, time_appconnect and time_starttransfer. If DNS/connect/TLS are small and TTFB is large, the server is slow to produce the response. If connect is large, it's network latency or SYN backlog/packet loss (check mtr). Compare from a host closer to the server.", he: "curl -w עם time_namelookup, ‏time_connect, ‏time_appconnect ו-time_starttransfer. אם DNS/connect/TLS קטנים ו-TTFB גדול — השרת איטי בייצור התשובה. אם connect גדול — latency ברשת או backlog של SYN/איבוד פקטות (לבדוק עם mtr). משווים מול שרת שקרוב יותר." } }
  ],
  quiz: [
    { q: { en: "ss shows 'LISTEN 127.0.0.1:6379'. A remote client gets 'connection refused'. Why?", he: "ss מראה 'LISTEN 127.0.0.1:6379'. ‏client מרוחק מקבל 'connection refused'. למה?" },
      options: [ { en: "Redis is down", he: "Redis למטה" }, { en: "Redis listens only on loopback, so the external interface has no listener on 6379", he: "Redis מאזין רק על loopback, אז בממשק החיצוני אין מאזין על 6379" }, { en: "DNS is broken", he: "DNS שבור" }, { en: "The security group drops the packets", he: "ה-security group זורק את הפקטות" } ],
      answer: 1, explain: { en: "Bound to 127.0.0.1 = only local connections. A dropping firewall would cause a timeout, not a refusal.", he: "bind ל-127.0.0.1 = רק חיבורים מקומיים. firewall שזורק היה גורם ל-timeout, לא ל-refused." } },
    { q: { en: "Which command resolves a hostname the same way applications do, including /etc/hosts?", he: "איזו פקודה מתרגמת hostname בדיוק כמו אפליקציות, כולל /etc/hosts?" },
      options: [ { en: "dig", he: "dig" }, { en: "getent hosts", he: "getent hosts" }, { en: "nslookup", he: "nslookup" }, { en: "host", he: "host" } ],
      answer: 1, explain: { en: "dig, host and nslookup query DNS servers directly. getent uses the system resolver (nsswitch: files, then dns).", he: "‏dig, ‏host ו-nslookup שואלים שרתי DNS ישירות. ‏getent משתמש ב-resolver של המערכת (‏nsswitch: קודם files, אחר כך dns)." } },
    { q: { en: "curl timing shows connect=0.02s, tls=0.05s, ttfb=2.8s. Where is the bottleneck?", he: "ה-timing של curl מראה connect=0.02s, ‏tls=0.05s, ‏ttfb=2.8s. איפה צוואר הבקבוק?" },
      options: [ { en: "DNS", he: "DNS" }, { en: "Network latency", he: "latency ברשת" }, { en: "Server-side processing", he: "עיבוד בצד השרת" }, { en: "TLS handshake", he: "ה-TLS handshake" } ],
      answer: 2, explain: { en: "Connection and TLS were fast; the server took ~2.7s after the request was sent to return the first byte.", he: "החיבור וה-TLS היו מהירים; השרת לקח בערך 2.7 שניות מרגע שליחת הבקשה עד הבייט הראשון." } },
    { q: { en: "tcpdump shows repeated [S] packets to port 5432 with no reply. Most likely?", he: "tcpdump מראה פקטות [S] חוזרות לפורט 5432 בלי תשובה. מה הכי סביר?" },
      options: [ { en: "Postgres is overloaded with queries", he: "Postgres עמוס בשאילתות" }, { en: "A firewall/security group is dropping the SYNs", he: "firewall/security group זורק את ה-SYNs" }, { en: "Wrong password", he: "סיסמה שגויה" }, { en: "The port is closed and sending resets", he: "הפורט סגור ושולח resets" } ],
      answer: 1, explain: { en: "SYN retransmits with no SYN-ACK or RST = packets vanish on the way. A closed port would answer with [R].", he: "retransmit של SYN בלי SYN-ACK ובלי RST = פקטות נעלמות בדרך. פורט סגור היה עונה עם [R]." } }
  ],
  playground: "terminal",
  related: ["net-troubleshooting", "net-dns", "linux-ssh-remote"]
});

/* ============================== 7. DISKS & STORAGE ============================== */
INFRA.lessons.push({
  id: "linux-disks-storage",
  track: "linux",
  order: 7,
  icon: "💽",
  level: 2,
  minutes: 11,
  title: { en: "Disks & storage: df, du, lsblk, mount, inodes", he: "דיסקים ואחסון: df, du, lsblk, mount, inodes" },
  tldr: {
    en: "df tells you a filesystem is full, du tells you which directory is to blame — and when they disagree, a process is holding a deleted file open.",
    he: "df אומר לך שה-filesystem מלא, du אומר לך איזו תיקייה אשמה — וכשהם לא מסכימים, יש תהליך שמחזיק קובץ מחוק פתוח."
  },
  analogy: {
    en: "df is the parking garage's sign at the entrance: 'FULL'. du is walking every floor counting cars. Sometimes the sign says full but you count empty spots — because some cars were 'deleted' from the registry yet are still physically parked, their drivers (processes) still holding the keys. Until the driver leaves, the spot isn't free. Inodes are the number of parking tickets: you can run out of tickets while spots are still free.",
    he: "df זה השלט בכניסה לחניון: 'מלא'. du זה ללכת בכל קומה ולספור מכוניות. לפעמים השלט אומר מלא אבל אתה סופר מקומות פנויים — כי חלק מהמכוניות 'נמחקו' מהרישום אבל עדיין חונות פיזית, והנהגים שלהן (תהליכים) עדיין מחזיקים את המפתחות. עד שהנהג יוצא, המקום לא מתפנה. ‏inodes זה מספר כרטיסי החניה: אפשר שייגמרו הכרטיסים כשיש עוד מקום."
  },
  sections: [
    {
      h: { en: "df vs du: two different questions", he: "df מול du: שתי שאלות שונות" },
      body: {
        en: `<pre>$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   48G  2.0G  97% /
/dev/nvme1n1    200G   61G  140G  31% /var/lib/docker
tmpfs           3.9G  1.2M  3.9G   1% /run
$ df -h /var/log                 # which filesystem holds this path?
$ sudo du -sh /var/* 2&gt;/dev/null | sort -h | tail -5
1.1G    /var/cache
3.4G    /var/lib
29G     /var/log
$ sudo du -xh --max-depth=1 / 2&gt;/dev/null | sort -h | tail
$ sudo ncdu -x /                 # interactive: arrows to drill down, d to delete</pre>
<p><code>df</code> asks the <em>filesystem</em> how many blocks are used — instant. <code>du</code> walks directories and sums file sizes — slow on big trees. <code>-x</code> keeps du on one filesystem (otherwise it counts <code>/proc</code>, other disks and NFS). <code>sort -h</code> understands <code>K/M/G</code>.</p>
<p>Ext4 reserves ~5% for root by default, which is why <code>Used + Avail</code> doesn't add up to <code>Size</code> and why root can still write when users see "No space left on device".</p>`,
        he: `<pre>$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   48G  2.0G  97% /
/dev/nvme1n1    200G   61G  140G  31% /var/lib/docker
tmpfs           3.9G  1.2M  3.9G   1% /run
$ df -h /var/log                 # which filesystem holds this path?
$ sudo du -sh /var/* 2&gt;/dev/null | sort -h | tail -5
1.1G    /var/cache
3.4G    /var/lib
29G     /var/log
$ sudo du -xh --max-depth=1 / 2&gt;/dev/null | sort -h | tail
$ sudo ncdu -x /                 # interactive: arrows to drill down, d to delete</pre>
<p><code>df</code> שואל את ה-<em>filesystem</em> כמה בלוקים בשימוש — מיידי. ‏<code>du</code> עובר על תיקיות וסוכם גדלי קבצים — איטי בעצים גדולים. ‏<code>-x</code> משאיר את du על filesystem אחד (אחרת הוא סופר גם <code>/proc</code>, דיסקים אחרים ו-NFS). ‏<code>sort -h</code> מבין <code>K/M/G</code>.</p>
<p>ext4 שומר כברירת מחדל בערך 5% ל-root, ולכן <code>Used + Avail</code> לא מסתכם ל-<code>Size</code>, ולכן root עדיין יכול לכתוב כשמשתמשים רגילים מקבלים "No space left on device".</p>`
      }
    },
    {
      h: { en: "Why df and du disagree: deleted-but-open files", he: "למה df ו-du לא מסכימים: קבצים מחוקים אבל פתוחים" },
      body: {
        en: `<p>You <code>rm</code> a 20GB log. <code>du</code> drops by 20GB, <code>df</code> doesn't move. Why? <code>rm</code> removes the <em>name</em>; the inode and its blocks are freed only when no process holds the file open. nginx/java still has it open and keeps writing to it.</p>
<pre>$ sudo lsof +L1
COMMAND  PID     USER  FD  TYPE DEVICE    SIZE/OFF NLINK  NODE NAME
java    4121      app  7w   REG  259,1 21474836480     0 39321 /var/log/api/app.log (deleted)
$ sudo ls -l /proc/4121/fd/7
l-wx------ 1 app app 64 Nov 12 14:30 7 -&gt; /var/log/api/app.log (deleted)
$ sudo truncate -s 0 /proc/4121/fd/7     # free the space WITHOUT restarting
$ df -h /
/dev/nvme0n1p1   50G   28G   22G  56% /</pre>
<p><code>lsof +L1</code> lists open files with link count &lt; 1 — i.e. deleted. Fix: restart/reload the process (it reopens a new file) or truncate via <code>/proc/PID/fd/N</code>.</p>
<blockquote>⚠️ Production tip: to empty a live log, <strong>truncate, don't delete</strong>: <code>: &gt; /var/log/api/app.log</code> or <code>truncate -s 0 file</code>. The process keeps its fd, the space is freed immediately, and nobody gets paged twice.</blockquote>`,
        he: `<p>עשית <code>rm</code> ללוג של 20GB. ‏<code>du</code> ירד ב-20GB, ‏<code>df</code> לא זז. למה? <code>rm</code> מוחק את ה<em>שם</em>; ה-inode והבלוקים שלו משתחררים רק כשאף תהליך לא מחזיק את הקובץ פתוח. ה-nginx/java עדיין מחזיק אותו וממשיך לכתוב אליו.</p>
<pre>$ sudo lsof +L1
COMMAND  PID     USER  FD  TYPE DEVICE    SIZE/OFF NLINK  NODE NAME
java    4121      app  7w   REG  259,1 21474836480     0 39321 /var/log/api/app.log (deleted)
$ sudo ls -l /proc/4121/fd/7
l-wx------ 1 app app 64 Nov 12 14:30 7 -&gt; /var/log/api/app.log (deleted)
$ sudo truncate -s 0 /proc/4121/fd/7     # free the space WITHOUT restarting
$ df -h /
/dev/nvme0n1p1   50G   28G   22G  56% /</pre>
<p><code>lsof +L1</code> מציג קבצים פתוחים עם link count קטן מ-1 — כלומר מחוקים. התיקון: restart/reload לתהליך (הוא פותח קובץ חדש) או truncate דרך <code>/proc/PID/fd/N</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: כדי לרוקן לוג חי — <strong>truncate, לא delete</strong>: ‏<code>: &gt; /var/log/api/app.log</code> או <code>truncate -s 0 file</code>. התהליך שומר את ה-fd שלו, המקום מתפנה מיד, ואף אחד לא מקבל page פעמיים.</blockquote>`
      }
    },
    {
      h: { en: "Block devices, mount and /etc/fstab", he: "Block devices, ‏mount ו-/etc/fstab" },
      body: {
        en: `<pre>$ lsblk -f
NAME        FSTYPE LABEL UUID                                 MOUNTPOINTS
nvme0n1
└─nvme0n1p1 ext4   root  3b1c...-a7e2                         /
nvme1n1     xfs          9f02...-11cd                         /var/lib/docker
nvme2n1                                                       (new, empty EBS volume)
$ sudo mkfs.xfs /dev/nvme2n1
$ sudo mkdir -p /data &amp;&amp; sudo mount /dev/nvme2n1 /data
$ sudo blkid /dev/nvme2n1
/dev/nvme2n1: UUID="5e7a...-c901" TYPE="xfs"
$ echo 'UUID=5e7a...-c901  /data  xfs  defaults,nofail,noatime  0 2' | sudo tee -a /etc/fstab
$ sudo umount /data &amp;&amp; sudo mount -a &amp;&amp; findmnt /data   # TEST fstab before rebooting!</pre>
<p>fstab fields: <code>device mountpoint fstype options dump fsck-order</code>. Use <strong>UUID</strong>, not <code>/dev/nvme2n1</code> — device names can change between boots, especially in the cloud. <code>nofail</code> lets the machine boot even if the volume is missing (otherwise it drops to emergency mode and you need a serial console). <code>mount | column -t</code> or <code>findmnt</code> show what's mounted and with which options (<code>ro</code>, <code>noexec</code>…).</p>`,
        he: `<pre>$ lsblk -f
NAME        FSTYPE LABEL UUID                                 MOUNTPOINTS
nvme0n1
└─nvme0n1p1 ext4   root  3b1c...-a7e2                         /
nvme1n1     xfs          9f02...-11cd                         /var/lib/docker
nvme2n1                                                       (new, empty EBS volume)
$ sudo mkfs.xfs /dev/nvme2n1
$ sudo mkdir -p /data &amp;&amp; sudo mount /dev/nvme2n1 /data
$ sudo blkid /dev/nvme2n1
/dev/nvme2n1: UUID="5e7a...-c901" TYPE="xfs"
$ echo 'UUID=5e7a...-c901  /data  xfs  defaults,nofail,noatime  0 2' | sudo tee -a /etc/fstab
$ sudo umount /data &amp;&amp; sudo mount -a &amp;&amp; findmnt /data   # TEST fstab before rebooting!</pre>
<p>שדות ה-fstab: <code>device mountpoint fstype options dump fsck-order</code>. תשתמש ב-<strong>UUID</strong>, לא ב-<code>/dev/nvme2n1</code> — שמות devices יכולים להשתנות בין boots, במיוחד בענן. ‏<code>nofail</code> מאפשר למכונה לעלות גם אם ה-volume חסר (אחרת היא נופלת ל-emergency mode ותצטרך serial console). ‏<code>mount | column -t</code> או <code>findmnt</code> מראים מה mounted ועם אילו options (‏<code>ro</code>, ‏<code>noexec</code>…).</p>`
      }
    },
    {
      h: { en: "Inodes, big files and the log-filled-the-disk incident", he: "Inodes, קבצים גדולים ותקלת \"הלוג מילא את הדיסק\"" },
      body: {
        en: `<p>Every file uses one <strong>inode</strong> (metadata: owner, perms, block pointers). Inodes are fixed at mkfs time on ext4. Millions of tiny files (PHP sessions, mail queue, cache shards) can exhaust them while gigabytes are free:</p>
<pre>$ touch /var/tmp/x
touch: cannot touch '/var/tmp/x': No space left on device
$ df -h /var  → 40% used    $ df -i /var
Filesystem      Inodes   IUsed IFree IUse% Mounted on
/dev/nvme0n1p1 3276800 3276800     0  100% /
$ sudo find /var -xdev -type f | cut -d/ -f2-4 | sort | uniq -c | sort -rn | head -3
3104221 var/lib/php
</pre>
<p>The incident playbook when <code>/</code> hits 100%:</p>
<ol>
<li><code>df -h</code> and <code>df -i</code> — blocks or inodes?</li>
<li><code>du -xh --max-depth=1 / | sort -h</code>, drill down (or <code>ncdu -x /</code>).</li>
<li><code>find / -xdev -type f -size +1G -exec ls -lh {} +</code> for the fat ones.</li>
<li>Check <code>lsof +L1</code> for deleted-but-open files.</li>
<li>Quick wins: <code>journalctl --vacuum-size=500M</code>, <code>docker system prune</code>, <code>apt-get clean</code>, truncate runaway logs.</li>
<li>Fix the cause: logrotate config, log level, retention — then add a disk alert at 80%.</li>
</ol>
<blockquote>💡 Real world: a full disk rarely looks like "disk full". It looks like Postgres refusing writes, Docker failing to pull, or SSH logins hanging because bash can't write history. Check <code>df -h</code> early in any weird incident.</blockquote>`,
        he: `<p>כל קובץ צורך <strong>inode</strong> אחד (מטא-דאטה: owner, הרשאות, מצביעים לבלוקים). ב-ext4 מספר ה-inodes נקבע ב-mkfs. מיליוני קבצים קטנטנים (sessions של PHP, תור מיילים, cache shards) יכולים לגמור אותם כשיש עוד גיגות פנויים:</p>
<pre>$ touch /var/tmp/x
touch: cannot touch '/var/tmp/x': No space left on device
$ df -h /var  → 40% used    $ df -i /var
Filesystem      Inodes   IUsed IFree IUse% Mounted on
/dev/nvme0n1p1 3276800 3276800     0  100% /
$ sudo find /var -xdev -type f | cut -d/ -f2-4 | sort | uniq -c | sort -rn | head -3
3104221 var/lib/php
</pre>
<p>ה-playbook כש-<code>/</code> מגיע ל-100%:</p>
<ol>
<li><code>df -h</code> ו-<code>df -i</code> — בלוקים או inodes?</li>
<li><code>du -xh --max-depth=1 / | sort -h</code>, ולצלול פנימה (או <code>ncdu -x /</code>).</li>
<li><code>find / -xdev -type f -size +1G -exec ls -lh {} +</code> בשביל השמנים.</li>
<li>לבדוק <code>lsof +L1</code> לקבצים מחוקים-אבל-פתוחים.</li>
<li>ניצחונות מהירים: <code>journalctl --vacuum-size=500M</code>, ‏<code>docker system prune</code>, ‏<code>apt-get clean</code>, ‏truncate ללוגים שהשתוללו.</li>
<li>לתקן את הסיבה: קונפיג של logrotate, ‏log level, ‏retention — ולהוסיף alert על דיסק ב-80%.</li>
</ol>
<blockquote>💡 מהשטח: דיסק מלא כמעט אף פעם לא נראה כמו "דיסק מלא". הוא נראה כמו Postgres שמסרב לכתוב, Docker שנכשל ב-pull, או login ב-SSH שנתקע כי bash לא מצליח לכתוב history. תבדוק <code>df -h</code> מוקדם בכל תקלה מוזרה.</blockquote>`
      }
    }
  ],
  diagram: "df (asks the filesystem)        du (walks the tree)\n   used = all allocated blocks     used = sum of files it can SEE\n                 \\                 /\n                  diff = deleted files still held open\n                         → lsof +L1  → restart / truncate /proc/PID/fd/N\n\nfile name ──▶ inode (perms, owner, size, block ptrs) ──▶ data blocks",
  handsOn: [
    { cmd: "df -hT && df -i", what: { en: "Free space per filesystem with type, then inode usage — rule out both kinds of 'disk full'.", he: "מקום פנוי לכל filesystem כולל סוג, ואז שימוש ב-inodes — לשלול את שני סוגי ה'דיסק מלא'." } },
    { cmd: "sudo du -xh --max-depth=1 / 2>/dev/null | sort -h | tail -15", what: { en: "Biggest top-level directories on the root filesystem, sorted by human size.", he: "התיקיות הכי גדולות ברמה העליונה של /, ממוינות לפי גודל קריא." } },
    { cmd: "sudo find / -xdev -type f -size +1G -exec ls -lh {} + 2>/dev/null | sort -k5 -h", what: { en: "Every file over 1GB on the root filesystem, smallest to largest.", he: "כל קובץ מעל 1GB ב-filesystem של /, מהקטן לגדול." } },
    { cmd: "sudo lsof +L1", what: { en: "Deleted files still held open by processes — the reason df and du disagree.", he: "קבצים מחוקים שתהליכים עדיין מחזיקים פתוחים — הסיבה ש-df ו-du לא מסכימים." } },
    { cmd: "sudo truncate -s 0 /var/log/app/huge.log", what: { en: "Empty a live log file in place without breaking the writer's file descriptor.", he: "מרוקן קובץ לוג חי במקום, בלי לשבור את ה-file descriptor של מי שכותב אליו." } },
    { cmd: "lsblk -f", what: { en: "All block devices and partitions with filesystem type, UUID and mount point — spot the new unmounted volume.", he: "כל ה-block devices והמחיצות עם סוג filesystem, ‏UUID ונקודת mount — לזהות volume חדש שלא mounted." } },
    { cmd: "sudo mount -a && findmnt --verify", what: { en: "Apply /etc/fstab and validate it — do this BEFORE rebooting after editing fstab.", he: "מחיל את /etc/fstab ומוודא אותו — לעשות את זה לפני reboot אחרי עריכת fstab." } },
    { cmd: "sudo ncdu -x /var", what: { en: "Interactive disk-usage browser for /var, staying on one filesystem.", he: "דפדפן אינטראקטיבי לשימוש בדיסק ב-/var, נשאר על filesystem אחד." } },
    { cmd: "sudo journalctl --vacuum-size=500M && sudo docker system prune -f", what: { en: "Two quick space wins: cap the systemd journal and remove unused Docker data.", he: "שני ניצחונות מהירים: להגביל את ה-journal ולמחוק דאטה לא בשימוש של Docker." } }
  ],
  mnemonic: {
    en: "\"df = Disk Free (the filesystem's opinion), du = Directory Usage (the files' opinion).\" When they argue, ask lsof +L1 — 'the ghost files'.",
    he: "\"df = מה ה-filesystem חושב, du = מה הקבצים חושבים.\" כשהם רבים — תשאל את lsof +L1, 'קבצי הרפאים'. ותזכור: מוחקים לוג חי עם truncate, לא עם rm."
  },
  pitfalls: [
    { en: "rm-ing a huge log that a process still writes to — space isn't freed until the process closes it. Truncate instead.", he: "לעשות rm ללוג ענק שתהליך עדיין כותב אליו — המקום לא מתפנה עד שהתהליך סוגר. תעשה truncate במקום." },
    { en: "Using /dev/sdX names in /etc/fstab — they can change across reboots. Use UUID= and add nofail for non-root volumes.", he: "להשתמש בשמות /dev/sdX ב-/etc/fstab — הם יכולים להשתנות בין reboots. תשתמש ב-UUID= ותוסיף nofail ל-volumes שאינם root." },
    { en: "Editing fstab and rebooting without mount -a — a typo means the server won't boot.", he: "לערוך fstab ולעשות reboot בלי mount -a — טעות הקלדה אחת והשרת לא עולה." },
    { en: "Seeing 'No space left on device' with free GBs and not checking df -i — inodes are exhausted.", he: "לראות 'No space left on device' כשיש גיגות פנויים ולא לבדוק df -i — נגמרו ה-inodes." }
  ],
  interview: [
    { q: { en: "df says the disk is 100% full but du only finds 50% used. What's going on?", he: "df אומר שהדיסק מלא ב-100% אבל du מוצא רק 50% בשימוש. מה קורה?" },
      a: { en: "Most likely deleted files still held open by a running process: the name is gone (du can't see it) but the blocks aren't freed (df counts them). Find them with lsof +L1, then restart/reload the process or truncate through /proc/PID/fd/N. Other causes: files hidden under a mount point, or du not run as root.", he: "כנראה קבצים מחוקים שתהליך רץ עדיין מחזיק פתוחים: השם נעלם (du לא רואה) אבל הבלוקים לא שוחררו (df סופר אותם). מוצאים עם lsof +L1, ואז restart/reload לתהליך או truncate דרך /proc/PID/fd/N. סיבות נוספות: קבצים שמוסתרים מתחת ל-mount point, או du שלא רץ כ-root." } },
    { q: { en: "What is an inode and how can you run out of them?", he: "מה זה inode ואיך אפשר שייגמרו?" },
      a: { en: "An inode is the on-disk structure holding a file's metadata (type, perms, owner, timestamps, size, pointers to data blocks) — everything except its name. ext4 allocates a fixed number at mkfs time; millions of small files can consume all inodes while blocks remain free, giving 'No space left on device'. Check with df -i.", he: "inode זה מבנה על הדיסק שמחזיק את המטא-דאטה של קובץ (סוג, הרשאות, owner, ‏timestamps, גודל, מצביעים לבלוקים) — הכל חוץ מהשם. ‏ext4 מקצה מספר קבוע ב-mkfs; מיליוני קבצים קטנים יכולים לגמור את כל ה-inodes כשעדיין יש בלוקים פנויים, ואז מקבלים 'No space left on device'. בודקים עם df -i." } },
    { q: { en: "How do you safely add a new data disk so it survives reboots?", he: "איך מוסיפים דיסק דאטה חדש בצורה בטוחה כך שישרוד reboot?" },
      a: { en: "Identify it with lsblk, mkfs it, mount it to test, get its UUID with blkid, add a UUID= line with nofail to /etc/fstab, then umount and mount -a (or findmnt --verify) to validate before any reboot.", he: "מזהים עם lsblk, עושים mkfs, עושים mount לבדיקה, לוקחים UUID עם blkid, מוסיפים שורת UUID= עם nofail ל-/etc/fstab, ואז umount ו-mount -a (או findmnt --verify) כדי לוודא לפני reboot." } }
  ],
  quiz: [
    { q: { en: "You deleted a 10GB log but df shows no change. What's the most likely reason?", he: "מחקת לוג של 10GB אבל df לא השתנה. מה הסיבה הכי סבירה?" },
      options: [ { en: "df caches results for an hour", he: "df שומר תוצאות בזיכרון לשעה" }, { en: "A process still has the file open", he: "תהליך עדיין מחזיק את הקובץ פתוח" }, { en: "The file went to the trash", he: "הקובץ עבר לסל המחזור" }, { en: "You need to run sync", he: "צריך להריץ sync" } ],
      answer: 1, explain: { en: "Blocks are freed only when the last link AND the last open fd are gone. lsof +L1 shows the culprit.", he: "בלוקים משתחררים רק כשה-link האחרון וגם ה-fd הפתוח האחרון נעלמים. ‏lsof +L1 מראה את האשם." } },
    { q: { en: "'No space left on device' but df -h shows 40% used. What do you check next?", he: "'No space left on device' אבל df -h מראה 40% בשימוש. מה בודקים?" },
      options: [ { en: "free -m", he: "free -m" }, { en: "df -i", he: "df -i" }, { en: "lsblk", he: "lsblk" }, { en: "ulimit -n", he: "ulimit -n" } ],
      answer: 1, explain: { en: "Inode exhaustion produces the same error while blocks are still free.", he: "כשנגמרים ה-inodes מקבלים את אותה שגיאה למרות שיש בלוקים פנויים." } },
    { q: { en: "Why use UUID= instead of /dev/nvme1n1 in /etc/fstab?", he: "למה להשתמש ב-UUID= ולא ב-/dev/nvme1n1 ב-/etc/fstab?" },
      options: [ { en: "UUIDs mount faster", he: "UUID עושה mount מהר יותר" }, { en: "Device names can change between boots; UUIDs are stable", he: "שמות devices יכולים להשתנות בין boots; ‏UUID יציב" }, { en: "fstab doesn't support /dev paths", he: "fstab לא תומך בנתיבי /dev" }, { en: "UUIDs enable encryption", he: "UUID מאפשר הצפנה" } ],
      answer: 1, explain: { en: "Enumeration order isn't guaranteed (especially with NVMe/EBS); the filesystem UUID always identifies the same volume.", he: "סדר הזיהוי לא מובטח (במיוחד עם NVMe/EBS); ה-UUID של ה-filesystem תמיד מזהה את אותו volume." } },
    { q: { en: "Best way to free space from a 30GB log that nginx is actively writing?", he: "מה הדרך הכי טובה לפנות מקום מלוג של 30GB ש-nginx כותב אליו כרגע?" },
      options: [ { en: "rm the file", he: "rm לקובץ" }, { en: "truncate -s 0 the file (then fix logrotate)", he: "truncate -s 0 לקובץ (ואז לתקן logrotate)" }, { en: "mv it to /tmp", he: "mv ל-/tmp" }, { en: "chmod 000 the file", he: "chmod 000 לקובץ" } ],
      answer: 1, explain: { en: "rm and mv (on the same FS) keep the space held by nginx's open fd. Truncate frees it immediately.", he: "rm ו-mv (באותו FS) משאירים את המקום תפוס דרך ה-fd הפתוח של nginx. ‏truncate משחרר מיד." } }
  ],
  playground: "terminal",
  related: ["storage-io", "linux-files-navigation", "linux-systemd-logs", "linux-performance-60s"]
});

/* ============================== 8. SSH & REMOTE WORK ============================== */
INFRA.lessons.push({
  id: "linux-ssh-remote",
  track: "linux",
  order: 8,
  icon: "🔑",
  level: 2,
  minutes: 12,
  title: { en: "SSH & remote work: keys, config, rsync, tunnels, tmux", he: "SSH ועבודה מרחוק: מפתחות, config, ‏rsync, מנהרות, tmux" },
  tldr: {
    en: "Use ed25519 keys and a ~/.ssh/config so every server is one short word away, move files with rsync, reach private services with -L/-J tunnels, and always work inside tmux so a dropped Wi-Fi doesn't kill a migration.",
    he: "משתמשים במפתחות ed25519 וב-‎~/.ssh/config כך שכל שרת במרחק מילה אחת, מעבירים קבצים עם rsync, מגיעים לשירותים פרטיים עם מנהרות ‎-L/-J, ותמיד עובדים בתוך tmux כדי ש-WiFi שנפל לא יהרוג migration באמצע."
  },
  analogy: {
    en: "Your SSH key pair is a padlock and its only key. You hand out copies of the padlock (public key) to every server — they bolt it on the door (authorized_keys). The key (private key) never leaves your pocket. A jump host is the building lobby you must pass through to reach the offices; port forwarding is a pneumatic tube through the lobby wall straight to one office's desk. tmux is leaving your desk with all papers open — when you come back, everything is exactly where you left it.",
    he: "זוג מפתחות SSH זה מנעול והמפתח היחיד שלו. אתה מחלק עותקים של המנעול (המפתח הציבורי) לכל שרת — הם מבריגים אותו על הדלת (authorized_keys). המפתח עצמו (הפרטי) לא יוצא לך מהכיס. ‏jump host זה הלובי של הבניין שחייבים לעבור דרכו כדי להגיע למשרדים; ‏port forwarding זה צינור דואר פנאומטי דרך הקיר של הלובי ישר לשולחן במשרד אחד. ‏tmux זה לעזוב את השולחן עם כל הניירות פתוחים — כשאתה חוזר, הכל בדיוק איפה שהשארת."
  },
  sections: [
    {
      h: { en: "Keys: ssh-keygen, ssh-copy-id, agent", he: "מפתחות: ssh-keygen, ‏ssh-copy-id, ‏agent" },
      body: {
        en: `<pre>$ ssh-keygen -t ed25519 -C "meir@laptop-2026" -f ~/.ssh/id_ed25519
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase): ********
Your public key has been saved in /home/meir/.ssh/id_ed25519.pub
$ ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@10.0.1.23
Number of key(s) added: 1
$ eval "$(ssh-agent -s)" &amp;&amp; ssh-add ~/.ssh/id_ed25519   # type the passphrase once
$ ssh-add -l
256 SHA256:Xq3v...9ZQ meir@laptop-2026 (ED25519)
$ ssh -v ubuntu@10.0.1.23 2&gt;&amp;1 | grep -E "Offering|Authenticated|denied"</pre>
<p><strong>ed25519</strong> keys are short, fast and secure — prefer them over RSA (if you must use RSA, 4096 bits). Always set a passphrase on laptop keys and let <code>ssh-agent</code> (or macOS Keychain) remember it. <code>ssh-copy-id</code> appends the <code>.pub</code> to the server's <code>~/.ssh/authorized_keys</code> with correct permissions. Without it: <code>cat ~/.ssh/id_ed25519.pub | ssh host 'cat &gt;&gt; ~/.ssh/authorized_keys'</code>.</p>
<p>When login fails, <code>ssh -v</code> (up to <code>-vvv</code>) shows which keys were offered and why they were rejected; on the server, <code>journalctl -u ssh</code> or <code>/var/log/auth.log</code> tells the other half (often "bad ownership or modes").</p>`,
        he: `<pre>$ ssh-keygen -t ed25519 -C "meir@laptop-2026" -f ~/.ssh/id_ed25519
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase): ********
Your public key has been saved in /home/meir/.ssh/id_ed25519.pub
$ ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@10.0.1.23
Number of key(s) added: 1
$ eval "$(ssh-agent -s)" &amp;&amp; ssh-add ~/.ssh/id_ed25519   # type the passphrase once
$ ssh-add -l
256 SHA256:Xq3v...9ZQ meir@laptop-2026 (ED25519)
$ ssh -v ubuntu@10.0.1.23 2&gt;&amp;1 | grep -E "Offering|Authenticated|denied"</pre>
<p>מפתחות <strong>ed25519</strong> קצרים, מהירים ומאובטחים — עדיף אותם על RSA (אם חייבים RSA, אז 4096 ביט). תמיד לשים passphrase על מפתחות בלפטופ ולתת ל-<code>ssh-agent</code> (או ל-Keychain ב-macOS) לזכור אותו. ‏<code>ssh-copy-id</code> מוסיף את ה-<code>.pub</code> ל-<code>~/.ssh/authorized_keys</code> בשרת עם הרשאות נכונות. בלעדיו: <code>cat ~/.ssh/id_ed25519.pub | ssh host 'cat &gt;&gt; ~/.ssh/authorized_keys'</code>.</p>
<p>כשה-login נכשל, ‏<code>ssh -v</code> (עד <code>-vvv</code>) מראה אילו מפתחות הוצעו ולמה נדחו; בצד השרת, <code>journalctl -u ssh</code> או <code>/var/log/auth.log</code> מספרים את החצי השני (הרבה פעמים "bad ownership or modes").</p>`
      }
    },
    {
      h: { en: "~/.ssh/config, jump hosts and agent-forwarding risks", he: "‏‎~/.ssh/config, ‏jump hosts והסכנות של agent forwarding" },
      body: {
        en: `<pre>$ cat ~/.ssh/config
Host bastion
    HostName bastion.prod.example.com
    User meir
    IdentityFile ~/.ssh/id_ed25519

Host prod-*
    User ubuntu
    ProxyJump bastion
    IdentityFile ~/.ssh/id_ed25519

Host prod-db1
    HostName 10.0.3.12

Host *
    ServerAliveInterval 30
    ServerAliveCountMax 4
    AddKeysToAgent yes
$ ssh prod-db1                     # → hops through bastion automatically
$ ssh -J meir@bastion.prod.example.com ubuntu@10.0.3.12   # same, ad hoc</pre>
<p><code>ProxyJump</code> / <code>-J</code> opens a TCP tunnel <em>through</em> the bastion; your private key never touches it. Contrast with <strong>agent forwarding</strong> (<code>ssh -A</code>, <code>ForwardAgent yes</code>): it exposes your agent socket on the remote host, and anyone with root there can use your keys to log in elsewhere <em>as you</em> while you're connected.</p>
<blockquote>⚠️ Production tip: never set <code>ForwardAgent yes</code> under <code>Host *</code>. Use <code>ProxyJump</code> for hopping; if you truly need forwarding (e.g. git pull on a box), enable it per-host and only for hosts you trust. <code>ServerAliveInterval</code> stops idle sessions being killed by NAT/firewall timeouts.</blockquote>`,
        he: `<pre>$ cat ~/.ssh/config
Host bastion
    HostName bastion.prod.example.com
    User meir
    IdentityFile ~/.ssh/id_ed25519

Host prod-*
    User ubuntu
    ProxyJump bastion
    IdentityFile ~/.ssh/id_ed25519

Host prod-db1
    HostName 10.0.3.12

Host *
    ServerAliveInterval 30
    ServerAliveCountMax 4
    AddKeysToAgent yes
$ ssh prod-db1                     # → hops through bastion automatically
$ ssh -J meir@bastion.prod.example.com ubuntu@10.0.3.12   # same, ad hoc</pre>
<p><code>ProxyJump</code> / ‏<code>-J</code> פותח מנהרת TCP <em>דרך</em> ה-bastion; המפתח הפרטי שלך לא נוגע בו. לעומת זאת, <strong>agent forwarding</strong> (‏<code>ssh -A</code>, ‏<code>ForwardAgent yes</code>) חושף את ה-socket של ה-agent שלך בשרת המרוחק, וכל מי שיש לו root שם יכול להשתמש במפתחות שלך כדי להתחבר למקומות אחרים <em>בתור אתה</em> כל עוד אתה מחובר.</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם לא לשים <code>ForwardAgent yes</code> תחת <code>Host *</code>. לקפיצות משתמשים ב-<code>ProxyJump</code>; אם באמת צריך forwarding (למשל git pull על שרת), מפעילים per-host ורק לשרתים שסומכים עליהם. ‏<code>ServerAliveInterval</code> מונע מ-sessions שקטים להיחתך ע"י timeouts של NAT/firewall.</blockquote>`
      }
    },
    {
      h: { en: "Moving files: scp vs rsync", he: "להעביר קבצים: scp מול rsync" },
      body: {
        en: `<pre>$ scp app.tgz prod-web1:/tmp/                 # simple one-off copy
$ scp prod-web1:/var/log/nginx/error.log .
$ rsync -avz --progress ./build/ prod-web1:/var/www/app/
sending incremental file list
index.html
     12,410 100%   11.83MB/s    0:00:00
assets/main.4f1c.js
  1,204,551 100%    9.12MB/s    0:00:00
sent 412,118 bytes  received 1,204 bytes  total size 48,221,903  speedup is 116.67
$ rsync -avz --delete --dry-run ./build/ prod-web1:/var/www/app/   # preview deletions!
$ rsync -avzP -e "ssh -J bastion" bigdump.sql.gz db1:/backup/    # -P = --partial --progress</pre>
<p><code>-a</code> archive (recursive + perms, times, symlinks, owners), <code>-v</code> verbose, <code>-z</code> compress in transit, <code>--progress</code> per-file progress. rsync only sends <em>differences</em> (that "speedup is 116" line), so re-runs are cheap and an interrupted transfer resumes with <code>-P</code>.</p>
<p>The trailing slash matters: <code>build/</code> = "contents of build", <code>build</code> = "the directory build itself" (you get <code>app/build/</code>). <code>--delete</code> makes the destination an exact mirror — combined with a wrong path it's an <code>rm -rf</code> with extra steps. Always <code>--dry-run</code> first.</p>`,
        he: `<pre>$ scp app.tgz prod-web1:/tmp/                 # simple one-off copy
$ scp prod-web1:/var/log/nginx/error.log .
$ rsync -avz --progress ./build/ prod-web1:/var/www/app/
sending incremental file list
index.html
     12,410 100%   11.83MB/s    0:00:00
assets/main.4f1c.js
  1,204,551 100%    9.12MB/s    0:00:00
sent 412,118 bytes  received 1,204 bytes  total size 48,221,903  speedup is 116.67
$ rsync -avz --delete --dry-run ./build/ prod-web1:/var/www/app/   # preview deletions!
$ rsync -avzP -e "ssh -J bastion" bigdump.sql.gz db1:/backup/    # -P = --partial --progress</pre>
<p><code>-a</code> archive (רקורסיבי + הרשאות, זמנים, symlinks, ‏owners), ‏<code>-v</code> verbose, ‏<code>-z</code> דחיסה בהעברה, ‏<code>--progress</code> התקדמות לכל קובץ. ‏rsync שולח רק <em>הבדלים</em> (השורה של "speedup is 116"), אז הרצה חוזרת זולה, והעברה שנקטעה ממשיכה מאיפה שעצרה עם <code>-P</code>.</p>
<p>ה-slash בסוף חשוב: <code>build/</code> = "התוכן של build", ‏<code>build</code> = "התיקייה build עצמה" (תקבל <code>app/build/</code>). ‏<code>--delete</code> הופך את היעד למראה מדויקת — ביחד עם נתיב שגוי זה <code>rm -rf</code> עם צעדים נוספים. תמיד <code>--dry-run</code> קודם.</p>`
      }
    },
    {
      h: { en: "Tunnels: -L and -R, plus tmux to survive disconnects", he: "מנהרות: ‎-L ו-‎-R, ו-tmux כדי לשרוד ניתוקים" },
      body: {
        en: `<pre>$ ssh -N -L 5433:prod-db.internal:5432 bastion     # local 5433 → DB via bastion
$ psql -h localhost -p 5433 -U readonly orders
$ ssh -N -L 8080:localhost:9090 prod-mon1           # reach Prometheus UI bound to localhost
$ ssh -N -R 9000:localhost:3000 dev-box             # remote 9000 → my laptop's :3000
$ ssh -f -N -D 1080 bastion                         # SOCKS proxy for your browser</pre>
<p>Read <code>-L LOCALPORT:TARGET:TARGETPORT</code> as "open LOCALPORT on <em>my</em> machine; traffic goes through the SSH server to TARGET:TARGETPORT" — TARGET is resolved <em>from the SSH server</em>. <code>-R</code> is the mirror image: a port on the remote side that comes back to you. <code>-N</code> = no shell, <code>-f</code> = background.</p>
<pre>$ tmux new -s migrate          # start a named session
$ ./run-migration.sh           # ...Wi-Fi drops, laptop sleeps...
$ ssh prod-db1 &amp;&amp; tmux attach -t migrate   # still running, output intact
# Ctrl-b d  detach | Ctrl-b c  new window | Ctrl-b %  split | tmux ls  list sessions</pre>
<blockquote>💡 Real world: rule #1 of production work — anything that takes longer than a coffee (migrations, big rsyncs, reindexing) runs inside <code>tmux</code> (or <code>screen -S name</code> / <code>screen -r</code> on old boxes). A dropped SSH connection sends SIGHUP and kills everything that wasn't.</blockquote>`,
        he: `<pre>$ ssh -N -L 5433:prod-db.internal:5432 bastion     # local 5433 → DB via bastion
$ psql -h localhost -p 5433 -U readonly orders
$ ssh -N -L 8080:localhost:9090 prod-mon1           # reach Prometheus UI bound to localhost
$ ssh -N -R 9000:localhost:3000 dev-box             # remote 9000 → my laptop's :3000
$ ssh -f -N -D 1080 bastion                         # SOCKS proxy for your browser</pre>
<p>תקרא את <code>-L LOCALPORT:TARGET:TARGETPORT</code> בתור "תפתח LOCALPORT על המכונה <em>שלי</em>; התעבורה עוברת דרך שרת ה-SSH אל TARGET:TARGETPORT" — ה-TARGET מתורגם <em>מצד שרת ה-SSH</em>. ‏<code>-R</code> זו תמונת המראה: פורט בצד המרוחק שחוזר אליך. ‏<code>-N</code> = בלי shell, ‏<code>-f</code> = ברקע.</p>
<pre>$ tmux new -s migrate          # start a named session
$ ./run-migration.sh           # ...Wi-Fi drops, laptop sleeps...
$ ssh prod-db1 &amp;&amp; tmux attach -t migrate   # still running, output intact
# Ctrl-b d  detach | Ctrl-b c  new window | Ctrl-b %  split | tmux ls  list sessions</pre>
<blockquote>💡 מהשטח: חוק מספר 1 בעבודה על פרודקשן — כל דבר שלוקח יותר מקפה (migrations, ‏rsync גדול, ‏reindex) רץ בתוך <code>tmux</code> (או <code>screen -S name</code> / ‏<code>screen -r</code> בשרתים ישנים). חיבור SSH שנפל שולח SIGHUP והורג כל מה שלא היה בפנים.</blockquote>`
      }
    }
  ],
  diagram: "laptop ──ssh -J bastion──▶ bastion ──TCP──▶ prod-db1 (10.0.3.12)\n   key stays here ✔            (no key copied)\n\nssh -L 5433:prod-db:5432 bastion\n laptop:5433 ═══ encrypted ═══▶ bastion ──▶ prod-db:5432\n\nssh -R 9000:localhost:3000 dev-box\n dev-box:9000 ═══ encrypted ═══▶ laptop:3000",
  handsOn: [
    { cmd: "ssh-keygen -t ed25519 -C \"you@laptop\" -f ~/.ssh/id_ed25519", what: { en: "Generate a modern ed25519 key pair (set a passphrase when prompted).", he: "יוצר זוג מפתחות ed25519 מודרני (לשים passphrase כשהוא שואל)." } },
    { cmd: "ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@10.0.1.23", what: { en: "Install your public key on a server's authorized_keys with the right permissions.", he: "מתקין את המפתח הציבורי שלך ב-authorized_keys בשרת עם ההרשאות הנכונות." } },
    { cmd: "ssh -J ubuntu@bastion.example.com ubuntu@10.0.3.12", what: { en: "Connect to a private host through a bastion without copying keys to it.", he: "מתחבר לשרת פרטי דרך bastion בלי להעתיק אליו מפתחות." } },
    { cmd: "ssh -N -L 5433:prod-db.internal:5432 bastion", what: { en: "Tunnel local port 5433 to a private database through the bastion; then connect to localhost:5433.", he: "מנהרה מפורט מקומי 5433 ל-DB פרטי דרך ה-bastion; ואז מתחברים ל-localhost:5433." } },
    { cmd: "rsync -avz --progress --delete --dry-run ./build/ web1:/var/www/app/", what: { en: "Preview an exact-mirror deploy (incl. deletions) — remove --dry-run to execute.", he: "תצוגה מקדימה של deploy כמראה מדויקת (כולל מחיקות) — להוריד --dry-run כדי לבצע." } },
    { cmd: "rsync -avzP user@host:/backup/db.sql.gz .", what: { en: "Pull a big file with progress and resume support if the connection drops.", he: "מושך קובץ גדול עם progress ותמיכה בהמשך אם החיבור נופל." } },
    { cmd: "tmux new -s work || tmux attach -t work", what: { en: "Start (or re-attach to) a named tmux session that survives SSH disconnects.", he: "מרים (או מתחבר מחדש ל-) session של tmux עם שם ששורד ניתוקי SSH." } },
    { cmd: "ssh -vvv prod-web1 2>&1 | grep -iE 'offering|accepted|denied|identity'", what: { en: "Debug key authentication: which identities were offered and what the server said.", he: "דיבאג של אימות מפתחות: אילו identities הוצעו ומה השרת ענה." } },
    { cmd: "ssh prod-web1 'sudo journalctl -u nginx -n 50 --no-pager'", what: { en: "Run a one-off remote command and get its output locally, no interactive shell.", he: "מריץ פקודה חד-פעמית מרחוק ומקבל את הפלט מקומית, בלי shell אינטראקטיבי." } }
  ],
  mnemonic: {
    en: "\"-L brings it Local, -R sends it Remote.\" And rsync: 'slash = contents, no slash = the folder itself'. Jump with -J, never -A.",
    he: "\"‎-L מביא את זה ל-Local, ‏‎-R שולח את זה ל-Remote.\" ב-rsync: 'עם slash = התוכן, בלי slash = התיקייה עצמה'. קופצים עם ‎-J, אף פעם לא עם ‎-A."
  },
  pitfalls: [
    { en: "Enabling ForwardAgent globally — root on any host you visit can use your keys while you're logged in. Use ProxyJump.", he: "להפעיל ForwardAgent גלובלית — root בכל שרת שאתה נכנס אליו יכול להשתמש במפתחות שלך כל עוד אתה מחובר. תשתמש ב-ProxyJump." },
    { en: "rsync --delete with a missing trailing slash or wrong destination — it happily deletes the mismatch. Always --dry-run first.", he: "rsync --delete עם slash חסר או יעד שגוי — הוא ימחק בשמחה את כל מה שלא תואם. תמיד --dry-run קודם." },
    { en: "Running a long migration directly in an SSH session — a network blip sends SIGHUP and kills it halfway. Use tmux/screen.", he: "להריץ migration ארוך ישירות ב-session של SSH — הפרעה ברשת שולחת SIGHUP והורגת אותו באמצע. תשתמש ב-tmux/screen." },
    { en: "Private key or ~/.ssh with loose permissions — ssh refuses the key / sshd ignores authorized_keys. 700 for the dir, 600 for keys.", he: "מפתח פרטי או ‎~/.ssh עם הרשאות פתוחות — ssh מסרב למפתח / sshd מתעלם מ-authorized_keys. ‏700 לתיקייה, 600 למפתחות." }
  ],
  interview: [
    { q: { en: "How does SSH public-key authentication work?", he: "איך עובד אימות SSH עם מפתח ציבורי?" },
      a: { en: "The server has your public key in authorized_keys. During login the client proves possession of the matching private key by signing session-specific data; the server verifies the signature with the public key. The private key never leaves the client, and the session is encrypted with keys from a Diffie-Hellman exchange; the server's host key (known_hosts) protects you from MITM.", he: "בשרת יש את המפתח הציבורי שלך ב-authorized_keys. בזמן ההתחברות ה-client מוכיח שיש לו את המפתח הפרטי התואם ע\"י חתימה על דאטה ייחודי ל-session; השרת מאמת את החתימה עם המפתח הציבורי. המפתח הפרטי לא עוזב את ה-client, וה-session מוצפן עם מפתחות מ-Diffie-Hellman; ה-host key של השרת (‏known_hosts) מגן מפני MITM." } },
    { q: { en: "How do you reach a database in a private subnet from your laptop?", he: "איך מגיעים מהלפטופ ל-DB ב-subnet פרטי?" },
      a: { en: "Through a bastion with a local port forward: ssh -N -L 5433:db.internal:5432 bastion, then connect the client to localhost:5433. Alternatives: SSM Session Manager port forwarding (no open port 22), a VPN, or ProxyJump for shell access.", he: "דרך bastion עם local port forward: ‏ssh -N -L 5433:db.internal:5432 bastion, ואז מחברים את ה-client ל-localhost:5433. חלופות: port forwarding של SSM Session Manager (בלי פורט 22 פתוח), ‏VPN, או ProxyJump לגישת shell." } },
    { q: { en: "Why is rsync usually better than scp?", he: "למה rsync בדרך כלל עדיף על scp?" },
      a: { en: "rsync transfers only changed parts (delta algorithm), can resume (--partial), preserves metadata with -a, supports --delete for mirroring, --dry-run for previews, excludes, and bandwidth limits. scp is fine for a quick single file.", he: "rsync מעביר רק חלקים שהשתנו (אלגוריתם delta), יכול להמשיך העברה (‏--partial), שומר מטא-דאטה עם -a, תומך ב-‎--delete למראה, ‏--dry-run לתצוגה מקדימה, ‏excludes והגבלת רוחב פס. ‏scp מספיק לקובץ בודד מהיר." } }
  ],
  quiz: [
    { q: { en: "What does 'ssh -L 8080:localhost:9090 mon1' do?", he: "מה 'ssh -L 8080:localhost:9090 mon1' עושה?" },
      options: [ { en: "Exposes your laptop's port 9090 on mon1:8080", he: "חושף את פורט 9090 של הלפטופ ב-mon1:8080" }, { en: "Opens port 8080 on your laptop forwarding to port 9090 on mon1 itself", he: "פותח פורט 8080 בלפטופ שמעביר לפורט 9090 על mon1 עצמו" }, { en: "Forwards 8080 to 9090 on your laptop", he: "מעביר 8080 ל-9090 בלפטופ שלך" }, { en: "Creates a SOCKS proxy", he: "יוצר SOCKS proxy" } ],
      answer: 1, explain: { en: "With -L, 'localhost' is resolved from the SSH server's point of view — so it's mon1's own 9090.", he: "עם ‎-L, ה-'localhost' מתורגם מנקודת המבט של שרת ה-SSH — כלומר ה-9090 של mon1 עצמו." } },
    { q: { en: "Which is the safest way to SSH into a private host via a bastion?", he: "מה הדרך הכי בטוחה להתחבר לשרת פרטי דרך bastion?" },
      options: [ { en: "Copy your private key to the bastion", he: "להעתיק את המפתח הפרטי ל-bastion" }, { en: "ssh -A bastion, then ssh from there", he: "ssh -A ל-bastion, ומשם ssh" }, { en: "ssh -J bastion target", he: "ssh -J bastion target" }, { en: "Use password auth on the target", he: "להשתמש בסיסמה על השרת" } ],
      answer: 2, explain: { en: "ProxyJump tunnels through the bastion; your key and agent never live there.", he: "ProxyJump עושה מנהרה דרך ה-bastion; המפתח וה-agent שלך אף פעם לא נמצאים שם." } },
    { q: { en: "rsync -a src dest/ vs rsync -a src/ dest/ — what's the difference?", he: "rsync -a src dest/ לעומת rsync -a src/ dest/ — מה ההבדל?" },
      options: [ { en: "No difference", he: "אין הבדל" }, { en: "The first creates dest/src/, the second copies src's contents into dest/", he: "הראשון יוצר dest/src/, השני מעתיק את התוכן של src לתוך dest/" }, { en: "The first is not recursive", he: "הראשון לא רקורסיבי" }, { en: "The second deletes extra files", he: "השני מוחק קבצים עודפים" } ],
      answer: 1, explain: { en: "A trailing slash on the source means 'the contents of'. Without it, the directory itself is copied.", he: "slash בסוף המקור = 'התוכן של'. בלעדיו, התיקייה עצמה מועתקת." } }
  ],
  playground: "terminal",
  related: ["linux-permissions-users", "linux-networking-commands", "linux-processes"]
});

/* ============================== 9. BASH SCRIPTING ============================== */
INFRA.lessons.push({
  id: "linux-bash-scripting",
  track: "linux",
  order: 9,
  icon: "📜",
  level: 2,
  minutes: 14,
  title: { en: "Bash scripting that doesn't bite: quoting, set -euo pipefail, retries", he: "Bash scripting שלא נושך: quoting, ‏set -euo pipefail, ‏retries" },
  tldr: {
    en: "Start every script with #!/usr/bin/env bash and set -euo pipefail, quote every variable, check exit codes, and run shellcheck — that's 90% of the difference between a script that works and one that deletes the wrong thing at 3am.",
    he: "כל סקריפט מתחיל ב-‎#!/usr/bin/env bash וב-set -euo pipefail, עוטפים כל משתנה במרכאות, בודקים exit codes ומריצים shellcheck — זה 90% מההבדל בין סקריפט שעובד לסקריפט שמוחק את הדבר הלא נכון ב-3 בלילה."
  },
  analogy: {
    en: "A bash script without set -euo pipefail is an intern who, when one step fails, shrugs and keeps going with the next instruction — 'couldn't cd into the build dir? No worries, I'll just run rm -rf * right here.' set -e is teaching the intern to stop and call you when something breaks; quoting is teaching them that 'John Smith' is one person, not two.",
    he: "סקריפט bash בלי set -euo pipefail זה מתמחה שכשצעד אחד נכשל, מושך בכתפיים וממשיך להוראה הבאה — 'לא הצלחתי לעשות cd לתיקיית ה-build? לא נורא, אריץ rm -rf * פה איפה שאני עומד.' ‏set -e זה ללמד את המתמחה לעצור ולהתקשר אליך כשמשהו נשבר; quoting זה ללמד אותו ש-'John Smith' זה בן אדם אחד, לא שניים."
  },
  sections: [
    {
      h: { en: "Shebang, variables and quoting", he: "Shebang, משתנים ו-quoting" },
      body: {
        en: `<pre>#!/usr/bin/env bash
set -euo pipefail

NAME="orders-api"                 # no spaces around =
ENV="\${1:-staging}"               # $1 or default "staging"
TS=$(date +%Y%m%d-%H%M%S)         # command substitution
LOG_DIR="/var/log/$NAME"
FILES=("a b.txt" "c.txt")         # array

echo "Deploying $NAME to $ENV at $TS"
echo "Second file: \${FILES[1]}, count: \${#FILES[@]}"
cp "$SRC" "$DST"                  # ALWAYS quote</pre>
<p>The shebang picks the interpreter; <code>/usr/bin/env bash</code> finds bash on PATH (macOS, NixOS). <code>chmod +x</code> and run with <code>./script.sh</code>, or <code>bash script.sh</code>.</p>
<p><strong>Quoting rules</strong>: <code>"double"</code> expands <code>$vars</code> and <code>$(cmds)</code> but keeps the result as one word; <code>'single'</code> is fully literal. An unquoted <code>$FILE</code> containing <code>my report.pdf</code> becomes <em>two</em> arguments, and an unquoted <code>*</code> expands to every file in the directory. Use <code>\${VAR}</code> braces when gluing text: <code>"\${NAME}_backup"</code> (without braces bash looks for a variable called <code>NAME_backup</code>).</p>
<p>Special vars: <code>$1..$9</code> args, <code>$#</code> count, <code>"$@"</code> all args as separate words (always quote it), <code>$?</code> last exit code, <code>$$</code> this PID, <code>$!</code> last background PID.</p>`,
        he: `<pre>#!/usr/bin/env bash
set -euo pipefail

NAME="orders-api"                 # no spaces around =
ENV="\${1:-staging}"               # $1 or default "staging"
TS=$(date +%Y%m%d-%H%M%S)         # command substitution
LOG_DIR="/var/log/$NAME"
FILES=("a b.txt" "c.txt")         # array

echo "Deploying $NAME to $ENV at $TS"
echo "Second file: \${FILES[1]}, count: \${#FILES[@]}"
cp "$SRC" "$DST"                  # ALWAYS quote</pre>
<p>ה-shebang בוחר את ה-interpreter; ‏<code>/usr/bin/env bash</code> מוצא את bash ב-PATH (‏macOS, ‏NixOS). ‏<code>chmod +x</code> ומריצים עם <code>./script.sh</code>, או <code>bash script.sh</code>.</p>
<p><strong>חוקי quoting</strong>: <code>"כפולות"</code> מרחיבות <code>$vars</code> ו-<code>$(cmds)</code> אבל משאירות את התוצאה כמילה אחת; <code>'בודדות'</code> הן מילוליות לגמרי. ‏<code>$FILE</code> בלי מרכאות שמכיל <code>my report.pdf</code> הופך ל<em>שני</em> ארגומנטים, ו-<code>*</code> בלי מרכאות מתרחב לכל קובץ בתיקייה. משתמשים בסוגריים <code>\${VAR}</code> כשמדביקים טקסט: <code>"\${NAME}_backup"</code> (בלי סוגריים bash יחפש משתנה בשם <code>NAME_backup</code>).</p>
<p>משתנים מיוחדים: <code>$1..$9</code> ארגומנטים, ‏<code>$#</code> כמה, ‏<code>"$@"</code> כל הארגומנטים כמילים נפרדות (תמיד במרכאות), ‏<code>$?</code> ה-exit code האחרון, ‏<code>$$</code> ה-PID הנוכחי, ‏<code>$!</code> ה-PID האחרון ברקע.</p>`
      }
    },
    {
      h: { en: "set -euo pipefail and exit codes", he: "set -euo pipefail ו-exit codes" },
      body: {
        en: `<table>
<tr><th>Flag</th><th>Effect</th><th>Without it…</th></tr>
<tr><td><code>-e</code></td><td>exit on any command failure</td><td><code>cd /build</code> fails, next line <code>rm -rf *</code> runs in the wrong dir</td></tr>
<tr><td><code>-u</code></td><td>unset variable = error</td><td><code>rm -rf "$DIR/"</code> with typo <code>$DIRR</code> → <code>rm -rf /</code></td></tr>
<tr><td><code>-o pipefail</code></td><td>pipeline fails if <em>any</em> stage fails</td><td><code>curl bad-url | jq .</code> "succeeds" because jq's exit code wins</td></tr>
</table>
<pre>if ! curl -fsS "$URL" -o /tmp/payload.json; then
  echo "download failed" &gt;&amp;2
  exit 1
fi
grep -q "ready" status.txt &amp;&amp; echo "ready" || echo "not ready"
count=$(grep -c ERROR app.log || true)   # grep exits 1 on no match — don't let -e kill us
trap 'echo "failed at line $LINENO" &gt;&amp;2' ERR
trap 'rm -f "$TMP"' EXIT                 # cleanup no matter how we exit</pre>
<p>Conventions: exit <code>0</code> = OK, <code>1</code> = generic error, <code>2</code> = usage error. Print errors to <strong>stderr</strong> (<code>&gt;&amp;2</code>) so callers can capture stdout cleanly. <code>curl -f</code> makes HTTP 4xx/5xx a non-zero exit — without it, a 500 page counts as success.</p>
<blockquote>⚠️ Production tip: <code>set -e</code> has quirks — it's ignored inside <code>if</code> conditions, in <code>&amp;&amp;</code>/<code>||</code> chains, and in functions called from them. Don't treat it as a substitute for explicit checks on the commands that matter.</blockquote>`,
        he: `<table>
<tr><th>Flag</th><th>מה הוא עושה</th><th>בלעדיו…</th></tr>
<tr><td><code>-e</code></td><td>יציאה בכל כישלון של פקודה</td><td><code>cd /build</code> נכשל, והשורה הבאה <code>rm -rf *</code> רצה בתיקייה הלא נכונה</td></tr>
<tr><td><code>-u</code></td><td>משתנה לא מוגדר = שגיאה</td><td><code>rm -rf "$DIR/"</code> עם טעות הקלדה <code>$DIRR</code> ← <code>rm -rf /</code></td></tr>
<tr><td><code>-o pipefail</code></td><td>pipeline נכשל אם <em>כל</em> שלב בו נכשל</td><td><code>curl bad-url | jq .</code> "מצליח" כי ה-exit code של jq מנצח</td></tr>
</table>
<pre>if ! curl -fsS "$URL" -o /tmp/payload.json; then
  echo "download failed" &gt;&amp;2
  exit 1
fi
grep -q "ready" status.txt &amp;&amp; echo "ready" || echo "not ready"
count=$(grep -c ERROR app.log || true)   # grep exits 1 on no match — don't let -e kill us
trap 'echo "failed at line $LINENO" &gt;&amp;2' ERR
trap 'rm -f "$TMP"' EXIT                 # cleanup no matter how we exit</pre>
<p>מוסכמות: exit <code>0</code> = תקין, ‏<code>1</code> = שגיאה כללית, ‏<code>2</code> = שימוש שגוי. מדפיסים שגיאות ל-<strong>stderr</strong> (‏<code>&gt;&amp;2</code>) כדי שמי שקורא לסקריפט יוכל לתפוס stdout נקי. ‏<code>curl -f</code> הופך HTTP 4xx/5xx ל-exit code שאינו 0 — בלעדיו, דף 500 נחשב הצלחה.</p>
<blockquote>⚠️ טיפ לפרודקשן: ל-<code>set -e</code> יש מוזרויות — הוא לא פועל בתוך תנאי <code>if</code>, בשרשראות <code>&amp;&amp;</code>/<code>||</code>, ובפונקציות שנקראות מהן. אל תתייחס אליו כתחליף לבדיקות מפורשות על הפקודות שחשובות.</blockquote>`
      }
    },
    {
      h: { en: "Control flow, functions and here-docs", he: "Control flow, פונקציות ו-here-docs" },
      body: {
        en: `<pre>if [[ -f "$CONF" &amp;&amp; -r "$CONF" ]]; then echo "config ok"; fi
if [[ "$ENV" == "prod" ]]; then confirm; fi
if (( count &gt; 100 )); then echo "too many"; fi      # arithmetic

for host in web1 web2 web3; do
  ssh "$host" 'systemctl is-active nginx' || echo "$host: nginx DOWN"
done
for f in /var/log/app/*.log; do gzip "$f"; done

while read -r ip count; do
  echo "$ip made $count requests"
done &lt; &lt;(awk '{print $1}' access.log | sort | uniq -c | awk '{print $2, $1}' | head -5)

log() { echo "[$(date +%H:%M:%S)] $*" &gt;&amp;2; }
die() { log "ERROR: $*"; exit 1; }
[[ $# -ge 1 ]] || die "usage: $0 &lt;env&gt;"

cat &gt; /etc/app/config.yaml &lt;&lt;EOF
env: $ENV
generated: $TS
EOF
cat &lt;&lt;'EOF'                # quoted delimiter = no expansion: $HOME stays literal
EOF</pre>
<p>Prefer <code>[[ ]]</code> over <code>[ ]</code> in bash: no word-splitting surprises, supports <code>&amp;&amp;</code>, <code>==</code> globs and <code>=~</code> regex. Common tests: <code>-f</code> file, <code>-d</code> dir, <code>-z</code> empty string, <code>-n</code> non-empty. <code>while read -r</code> is the correct way to loop over lines (<code>for line in $(cat f)</code> splits on spaces, not lines).</p>`,
        he: `<pre>if [[ -f "$CONF" &amp;&amp; -r "$CONF" ]]; then echo "config ok"; fi
if [[ "$ENV" == "prod" ]]; then confirm; fi
if (( count &gt; 100 )); then echo "too many"; fi      # arithmetic

for host in web1 web2 web3; do
  ssh "$host" 'systemctl is-active nginx' || echo "$host: nginx DOWN"
done
for f in /var/log/app/*.log; do gzip "$f"; done

while read -r ip count; do
  echo "$ip made $count requests"
done &lt; &lt;(awk '{print $1}' access.log | sort | uniq -c | awk '{print $2, $1}' | head -5)

log() { echo "[$(date +%H:%M:%S)] $*" &gt;&amp;2; }
die() { log "ERROR: $*"; exit 1; }
[[ $# -ge 1 ]] || die "usage: $0 &lt;env&gt;"

cat &gt; /etc/app/config.yaml &lt;&lt;EOF
env: $ENV
generated: $TS
EOF
cat &lt;&lt;'EOF'                # quoted delimiter = no expansion: $HOME stays literal
EOF</pre>
<p>ב-bash עדיף <code>[[ ]]</code> על <code>[ ]</code>: בלי הפתעות של word-splitting, תומך ב-<code>&amp;&amp;</code>, ב-globs עם <code>==</code> וב-regex עם <code>=~</code>. בדיקות נפוצות: <code>-f</code> קובץ, ‏<code>-d</code> תיקייה, ‏<code>-z</code> מחרוזת ריקה, ‏<code>-n</code> לא ריקה. ‏<code>while read -r</code> זו הדרך הנכונה לעבור על שורות (‏<code>for line in $(cat f)</code> מפצל לפי רווחים, לא לפי שורות).</p>`
      }
    },
    {
      h: { en: "A realistic script: health check with retry + shellcheck", he: "סקריפט אמיתי: health check עם retry ו-shellcheck" },
      body: {
        en: `<pre>#!/usr/bin/env bash
# wait-healthy.sh — poll a health endpoint until it's 200 or we give up
set -euo pipefail

URL="\${1:?usage: $0 &lt;url&gt; [retries] [delay]}"
RETRIES="\${2:-10}"
DELAY="\${3:-3}"

log() { printf '[%s] %s\\n' "$(date +%T)" "$*" &gt;&amp;2; }

for ((i = 1; i &lt;= RETRIES; i++)); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$URL" || echo 000)
  if [[ "$code" == "200" ]]; then
    log "healthy after $i attempt(s)"
    exit 0
  fi
  log "attempt $i/$RETRIES: got $code, retrying in \${DELAY}s"
  sleep "$DELAY"
  DELAY=$(( DELAY * 2 &gt; 30 ? 30 : DELAY * 2 ))   # exponential backoff, capped
done
log "UNHEALTHY after $RETRIES attempts"
exit 1</pre>
<pre>$ ./wait-healthy.sh http://localhost:8080/health 5 2
[14:02:01] attempt 1/5: got 000, retrying in 2s
[14:02:03] attempt 2/5: got 503, retrying in 4s
[14:02:07] healthy after 3 attempt(s)
$ shellcheck deploy.sh
In deploy.sh line 12:
rm -rf $BUILD_DIR/*
       ^--------^ SC2086: Double quote to prevent globbing and word splitting.</pre>
<blockquote>💡 Real world: this exact pattern gates deploys in CI ("roll out, then wait-healthy, else roll back"). Run <code>shellcheck</code> in CI on every <code>*.sh</code> — it catches unquoted vars, useless cats and <code>set -e</code> traps before production does. And when a script passes ~100 lines or needs JSON/HTTP logic, switch to Python or Go.</blockquote>`,
        he: `<pre>#!/usr/bin/env bash
# wait-healthy.sh — poll a health endpoint until it's 200 or we give up
set -euo pipefail

URL="\${1:?usage: $0 &lt;url&gt; [retries] [delay]}"
RETRIES="\${2:-10}"
DELAY="\${3:-3}"

log() { printf '[%s] %s\\n' "$(date +%T)" "$*" &gt;&amp;2; }

for ((i = 1; i &lt;= RETRIES; i++)); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$URL" || echo 000)
  if [[ "$code" == "200" ]]; then
    log "healthy after $i attempt(s)"
    exit 0
  fi
  log "attempt $i/$RETRIES: got $code, retrying in \${DELAY}s"
  sleep "$DELAY"
  DELAY=$(( DELAY * 2 &gt; 30 ? 30 : DELAY * 2 ))   # exponential backoff, capped
done
log "UNHEALTHY after $RETRIES attempts"
exit 1</pre>
<pre>$ ./wait-healthy.sh http://localhost:8080/health 5 2
[14:02:01] attempt 1/5: got 000, retrying in 2s
[14:02:03] attempt 2/5: got 503, retrying in 4s
[14:02:07] healthy after 3 attempt(s)
$ shellcheck deploy.sh
In deploy.sh line 12:
rm -rf $BUILD_DIR/*
       ^--------^ SC2086: Double quote to prevent globbing and word splitting.</pre>
<blockquote>💡 מהשטח: התבנית הזו בדיוק משמשת כ-gate ל-deploys ב-CI ("עושים rollout, ואז wait-healthy, אחרת rollback"). תריץ <code>shellcheck</code> ב-CI על כל <code>*.sh</code> — הוא תופס משתנים בלי מרכאות, ‏cat מיותרים ומלכודות של <code>set -e</code> לפני שהפרודקשן תופס. וכשסקריפט עובר ~100 שורות או צריך לוגיקה של JSON/HTTP — תעבור ל-Python או Go.</blockquote>`
      }
    }
  ],
  diagram: "#!/usr/bin/env bash\nset -euo pipefail          ← -e stop on error | -u no unset vars | pipefail: any stage fails\ntrap cleanup EXIT          ← always clean up\nmain() { parse \"$@\" → validate → do work → check $? }\nmain \"$@\"\n\nexit 0 = OK   1 = error   2 = usage   126 = not executable   127 = not found   128+N = signal N",
  handsOn: [
    { cmd: "bash -n deploy.sh && shellcheck deploy.sh", what: { en: "Syntax-check a script without running it, then lint it for real bugs (quoting, traps).", he: "בודק syntax של סקריפט בלי להריץ, ואז lint לבאגים אמיתיים (quoting, מלכודות)." } },
    { cmd: "bash -x ./deploy.sh staging", what: { en: "Trace execution: prints every command after expansion — the fastest way to debug a script.", he: "מעקב הרצה: מדפיס כל פקודה אחרי הרחבה — הדרך הכי מהירה לדבג סקריפט." } },
    { cmd: "for h in web{1..5}; do echo -n \"$h: \"; ssh -o ConnectTimeout=3 \"$h\" 'systemctl is-active nginx' || true; done", what: { en: "Loop over hosts web1..web5 and report nginx status on each, tolerating unreachable hosts.", he: "לולאה על web1..web5 ודיווח על מצב nginx בכל אחד, בלי ליפול על שרת לא נגיש." } },
    { cmd: "until curl -fsS http://localhost:8080/health >/dev/null; do echo waiting; sleep 2; done", what: { en: "One-line retry loop: wait until a service's health endpoint returns 2xx.", he: "לולאת retry בשורה אחת: מחכה עד שה-health endpoint של שירות מחזיר 2xx." } },
    { cmd: "while read -r line; do echo \"processing: $line\"; done < hosts.txt", what: { en: "Correctly iterate over a file line by line (handles spaces, unlike for-in-cat).", he: "מעבר נכון על קובץ שורה-שורה (מתמודד עם רווחים, בניגוד ל-for על cat)." } },
    { cmd: "cat <<'EOF' > /tmp/run.sh\n#!/usr/bin/env bash\necho \"$HOME stays literal\"\nEOF", what: { en: "Write a file with a here-doc; quoting 'EOF' prevents $variable expansion.", he: "כותב קובץ עם here-doc; ה-'EOF' במרכאות מונע הרחבה של $משתנים." } },
    { cmd: "some_cmd; echo \"exit code: $?\"", what: { en: "Print the exit code of the last command — 0 success, 127 not found, 137 SIGKILL.", he: "מדפיס את ה-exit code של הפקודה האחרונה — 0 הצלחה, 127 לא נמצא, 137 SIGKILL." } },
    { cmd: "TMP=$(mktemp -d) && trap 'rm -rf \"$TMP\"' EXIT", what: { en: "Create a safe temp directory and guarantee it's deleted when the script exits.", he: "יוצר תיקייה זמנית בטוחה ומבטיח שתימחק כשהסקריפט יוצא." } }
  ],
  mnemonic: {
    en: "\"EUP — Every Unquoted Pipe hurts\": set -e, -u, -o pipefail. And 'Quote it unless you can explain why not.'",
    he: "\"EUP\" — ‏set -e, ‏-u, ‏-o pipefail בראש כל סקריפט. וכלל הזהב: 'שים מרכאות, אלא אם אתה יכול להסביר למה לא.'"
  },
  pitfalls: [
    { en: "Unquoted variables: a filename with a space becomes two arguments, an empty var disappears entirely (rm -rf $DIR/ → rm -rf /).", he: "משתנים בלי מרכאות: שם קובץ עם רווח הופך לשני ארגומנטים, ומשתנה ריק פשוט נעלם (rm -rf $DIR/ ← rm -rf /)." },
    { en: "Pipelines without pipefail: curl fails, jq happily parses nothing, the script reports success.", he: "pipelines בלי pipefail: ‏curl נכשל, ‏jq מפענח בשמחה כלום, והסקריפט מדווח הצלחה." },
    { en: "Spaces around = in assignments (VAR = x) — bash runs a command named VAR. No spaces: VAR=x.", he: "רווחים סביב = בהשמה (VAR = x) — bash מנסה להריץ פקודה בשם VAR. בלי רווחים: VAR=x." },
    { en: "grep/diff returning 1 for 'no match/different' under set -e kills the script. Append || true or test explicitly.", he: "grep/diff שמחזירים 1 על 'אין התאמה/שונה' תחת set -e הורגים את הסקריפט. תוסיף || true או תבדוק במפורש." }
  ],
  interview: [
    { q: { en: "What does set -euo pipefail do and why use it?", he: "מה set -euo pipefail עושה ולמה להשתמש בו?" },
      a: { en: "-e exits on the first failing command, -u treats unset variables as errors, -o pipefail makes a pipeline's status the last non-zero exit of any stage. Together they turn silent failures into loud ones, preventing a script from continuing in a broken state (e.g. after a failed cd).", he: "‏-e יוצא בפקודה הראשונה שנכשלת, ‏-u מתייחס למשתנים לא מוגדרים כשגיאה, ‏-o pipefail גורם לסטטוס של pipeline להיות ה-exit האחרון שאינו 0 מכל שלב. ביחד הם הופכים כישלונות שקטים לרועשים, ומונעים מסקריפט להמשיך במצב שבור (למשל אחרי cd שנכשל)." } },
    { q: { en: "What's the difference between \"$@\" and $*?", he: "מה ההבדל בין \"$@\" ל-$*?" },
      a: { en: "\"$@\" expands to each positional argument as a separate, intact word — the right way to pass arguments through. $* (unquoted) re-splits everything on whitespace; \"$*\" joins all args into one string. Use \"$@\" almost always.", he: "\"$@\" מתרחב לכל ארגומנט כמילה נפרדת ושלמה — הדרך הנכונה להעביר ארגומנטים הלאה. ‏$* (בלי מרכאות) מפצל הכל מחדש לפי רווחים; \"$*\" מחבר את כולם למחרוזת אחת. כמעט תמיד משתמשים ב-\"$@\"." } },
    { q: { en: "How would you write a retry with backoff in bash?", he: "איך תכתוב retry עם backoff ב-bash?" },
      a: { en: "A for loop up to N attempts; run the command inside if (so set -e doesn't abort), exit 0 on success, otherwise log to stderr, sleep $delay and double it with a cap (delay=$((delay*2))). After the loop, exit non-zero. Add timeouts on the command itself (curl --max-time) so one attempt can't hang forever.", he: "לולאת for עד N ניסיונות; מריצים את הפקודה בתוך if (כדי ש-set -e לא יעצור), ‏exit 0 בהצלחה, אחרת לוג ל-stderr, ‏sleep $delay ומכפילים עם תקרה (delay=$((delay*2))). אחרי הלולאה — exit שאינו 0. מוסיפים timeout לפקודה עצמה (‏curl --max-time) כדי שניסיון אחד לא ייתקע לנצח." } }
  ],
  quiz: [
    { q: { en: "FILE='my report.pdf'; rm $FILE — what happens?", he: "FILE='my report.pdf'; rm $FILE — מה קורה?" },
      options: [ { en: "my report.pdf is deleted", he: "my report.pdf נמחק" }, { en: "rm tries to delete two files: 'my' and 'report.pdf'", he: "rm מנסה למחוק שני קבצים: 'my' ו-'report.pdf'" }, { en: "Syntax error", he: "שגיאת syntax" }, { en: "Nothing, rm needs -f", he: "כלום, rm צריך -f" } ],
      answer: 1, explain: { en: "Unquoted expansion undergoes word splitting. Use rm \"$FILE\".", he: "הרחבה בלי מרכאות עוברת word splitting. תשתמש ב-rm \"$FILE\"." } },
    { q: { en: "With set -e but WITHOUT pipefail, what's the exit status of 'false | true'?", he: "עם set -e אבל בלי pipefail, מה ה-exit status של 'false | true'?" },
      options: [ { en: "1 — the script exits", he: "1 — הסקריפט יוצא" }, { en: "0 — the pipeline's status is the last command's", he: "0 — הסטטוס של pipeline הוא של הפקודה האחרונה" }, { en: "2", he: "2" }, { en: "It depends on the shell version only", he: "תלוי רק בגרסת ה-shell" } ],
      answer: 1, explain: { en: "Without pipefail, only the last stage counts, so failures earlier in the pipe are hidden.", he: "בלי pipefail רק השלב האחרון נחשב, אז כישלונות מוקדמים ב-pipe מוסתרים." } },
    { q: { en: "What does ${1:?missing arg} do?", he: "מה ${1:?missing arg} עושה?" },
      options: [ { en: "Defaults $1 to 'missing arg'", he: "נותן ל-$1 ערך ברירת מחדל 'missing arg'" }, { en: "Aborts with 'missing arg' if $1 is unset or empty", he: "עוצר עם 'missing arg' אם $1 לא מוגדר או ריק" }, { en: "Checks if $1 is a file", he: "בודק אם $1 הוא קובץ" }, { en: "Prints $1 with a question mark", he: "מדפיס את $1 עם סימן שאלה" } ],
      answer: 1, explain: { en: ":- gives a default, :? fails with a message — perfect for required arguments.", he: "‏:- נותן ברירת מחדל, ‏:? נכשל עם הודעה — מושלם לארגומנטים חובה." } },
    { q: { en: "In a here-doc, what's the effect of quoting the delimiter (<<'EOF')?", he: "ב-here-doc, מה ההשפעה של מרכאות סביב ה-delimiter (‏<<'EOF')?" },
      options: [ { en: "The body is executed as a command", he: "התוכן מורץ כפקודה" }, { en: "Variables and $(...) inside are NOT expanded", he: "משתנים ו-$(...) בפנים לא מורחבים" }, { en: "Leading tabs are stripped", he: "tabs בתחילת שורה מוסרים" }, { en: "It appends instead of overwriting", he: "זה מוסיף במקום לדרוס" } ],
      answer: 1, explain: { en: "A quoted delimiter makes the body literal. Tab stripping is <<-, appending is >>.", he: "delimiter במרכאות הופך את התוכן למילולי. הסרת tabs זה <<-, הוספה זה >>." } }
  ],
  playground: "terminal",
  related: ["linux-text-processing", "linux-processes", "linux-toolkit"]
});

/* ============================== 10. PERFORMANCE IN 60 SECONDS ============================== */
INFRA.lessons.push({
  id: "linux-performance-60s",
  track: "linux",
  order: 10,
  icon: "⏱️",
  level: 3,
  minutes: 14,
  title: { en: "Linux performance analysis in 60 seconds", he: "ניתוח ביצועים ב-Linux ב-60 שניות" },
  tldr: {
    en: "Ten commands, one minute, in a fixed order: uptime, dmesg, vmstat, mpstat, pidstat, iostat, free, sar DEV, sar TCP, top — and you'll know whether the box is starved for CPU, memory, disk or network before anyone opens a dashboard.",
    he: "עשר פקודות, דקה אחת, בסדר קבוע: uptime, ‏dmesg, ‏vmstat, ‏mpstat, ‏pidstat, ‏iostat, ‏free, ‏sar DEV, ‏sar TCP, ‏top — ותדע אם לשרת חסר CPU, זיכרון, דיסק או רשת עוד לפני שמישהו פתח דשבורד."
  },
  analogy: {
    en: "It's an ER triage. You don't start with an MRI; you check pulse, breathing, blood pressure and temperature in a fixed order, in a minute, and the numbers tell you which specialist to call. uptime is the pulse, dmesg is 'any recent trauma?', vmstat is the full vitals monitor, and iostat/sar are the specialists' quick tests. This checklist comes from Brendan Gregg's Netflix team — it's how they triage a sick instance.",
    he: "זה טריאז' במיון. לא מתחילים מ-MRI; בודקים דופק, נשימה, לחץ דם וחום בסדר קבוע, תוך דקה, והמספרים אומרים לאיזה מומחה לקרוא. uptime זה הדופק, dmesg זה 'הייתה איזו טראומה לאחרונה?', vmstat זה מוניטור המדדים המלא, ו-iostat/sar הם הבדיקות המהירות של המומחים. הצ'קליסט הזה מגיע מהצוות של Brendan Gregg ב-Netflix — ככה הם עושים טריאז' לשרת חולה."
  },
  sections: [
    {
      h: { en: "1-2: uptime and dmesg — the first glance", he: "1-2: ‏uptime ו-dmesg — המבט הראשון" },
      body: {
        en: `<pre>$ uptime
 14:31:02 up 41 days,  3:12,  2 users,  load average: 30.02, 26.43, 19.02
$ nproc
8
$ dmesg -T | tail
[Thu Nov 12 14:29:51 2026] Out of memory: Killed process 4121 (java) total-vm:9123412kB, anon-rss:7340032kB
[Thu Nov 12 14:30:02 2026] TCP: request_sock_TCP: Possible SYN flooding on port 443. Sending cookies.
[Thu Nov 12 14:30:40 2026] blk_update_request: I/O error, dev nvme1n1, sector 2097152</pre>
<p><strong>Load average</strong> = average number of tasks running <em>or waiting</em> (on CPU, and on Linux also in uninterruptible D-state, i.e. disk I/O) over 1, 5 and 15 minutes. Compare it to <code>nproc</code>: load 30 on 8 CPUs = heavy queueing. The three numbers show the <em>trend</em>: 30 → 26 → 19 means it's getting worse.</p>
<p><code>dmesg</code> shows kernel messages — the stuff applications never log: <strong>OOM kills</strong>, disk I/O errors, TCP SYN floods, NIC resets, segfaults. Ten seconds here can solve the whole incident.</p>
<blockquote>💡 Real world: high load with <em>low</em> CPU usage almost always means processes stuck in D-state on slow storage or NFS — a disk problem disguised as a CPU problem. That's why load alone never tells you the bottleneck.</blockquote>`,
        he: `<pre>$ uptime
 14:31:02 up 41 days,  3:12,  2 users,  load average: 30.02, 26.43, 19.02
$ nproc
8
$ dmesg -T | tail
[Thu Nov 12 14:29:51 2026] Out of memory: Killed process 4121 (java) total-vm:9123412kB, anon-rss:7340032kB
[Thu Nov 12 14:30:02 2026] TCP: request_sock_TCP: Possible SYN flooding on port 443. Sending cookies.
[Thu Nov 12 14:30:40 2026] blk_update_request: I/O error, dev nvme1n1, sector 2097152</pre>
<p><strong>Load average</strong> = הממוצע של כמה tasks רצים <em>או מחכים</em> (ל-CPU, וב-Linux גם במצב D של uninterruptible, כלומר I/O לדיסק) על פני 1, 5 ו-15 דקות. משווים ל-<code>nproc</code>: ‏load 30 על 8 CPUs = תור כבד. שלושת המספרים מראים את ה<em>מגמה</em>: ‏30 ← 26 ← 19 אומר שזה מחמיר.</p>
<p><code>dmesg</code> מציג הודעות kernel — הדברים שאפליקציות אף פעם לא כותבות ללוג: <strong>OOM kills</strong>, שגיאות I/O בדיסק, ‏SYN floods, ‏resets של כרטיס רשת, ‏segfaults. עשר שניות פה יכולות לפתור את כל התקלה.</p>
<blockquote>💡 מהשטח: load גבוה עם שימוש CPU <em>נמוך</em> כמעט תמיד אומר תהליכים תקועים במצב D על storage איטי או NFS — בעיית דיסק שמתחפשת לבעיית CPU. בגלל זה load לבד אף פעם לא אומר לך מה צוואר הבקבוק.</blockquote>`
      }
    },
    {
      h: { en: "3-5: vmstat, mpstat, pidstat — CPU and run queue", he: "3-5: ‏vmstat, ‏mpstat, ‏pidstat — CPU ותור הריצה" },
      body: {
        en: `<pre>$ vmstat 1
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
34  0      0 200889  73708 591828    0    0     0     5    6   10 96  1  3  0  0
32  0      0 200937  73708 591860    0    0     0   592 13284 4282 98  1  1  0  0
$ mpstat -P ALL 1
CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %idle
all   98.47    0.00    0.75    0.00    0.00    0.00    0.00    0.78
  0   96.04    0.00    2.97    0.00    0.00    0.00    0.00    0.99
  1   97.00    0.00    1.00    0.00    0.00    0.00    0.00    2.00
$ pidstat 1
UID   PID    %usr %system  %guest   %CPU   CPU  Command
1000  4121  765.00    3.00    0.00  768.00    2  java
1000  9902   12.00    1.00    0.00   13.00    5  node</pre>
<p><strong>vmstat</strong> columns to read: <code>r</code> = runnable tasks (if &gt; CPU count → CPU saturation), <code>b</code> = blocked on I/O, <code>si/so</code> = swap in/out (non-zero = memory pressure), <code>us/sy/id/wa/st</code> = user, system, idle, <strong>iowait</strong>, <strong>steal</strong> (a noisy neighbor or burstable-instance credits running out). Ignore the first line (averages since boot).</p>
<p><strong>mpstat -P ALL</strong> shows per-CPU balance: one core at 100% and the rest idle = a single-threaded bottleneck (or one hot IRQ). <strong>pidstat</strong> is a rolling <code>top</code> that doesn't clear the screen — here <code>java</code> uses 768% = ~7.7 cores: the culprit.</p>`,
        he: `<pre>$ vmstat 1
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
34  0      0 200889  73708 591828    0    0     0     5    6   10 96  1  3  0  0
32  0      0 200937  73708 591860    0    0     0   592 13284 4282 98  1  1  0  0
$ mpstat -P ALL 1
CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %idle
all   98.47    0.00    0.75    0.00    0.00    0.00    0.00    0.78
  0   96.04    0.00    2.97    0.00    0.00    0.00    0.00    0.99
  1   97.00    0.00    1.00    0.00    0.00    0.00    0.00    2.00
$ pidstat 1
UID   PID    %usr %system  %guest   %CPU   CPU  Command
1000  4121  765.00    3.00    0.00  768.00    2  java
1000  9902   12.00    1.00    0.00   13.00    5  node</pre>
<p>עמודות לקרוא ב-<strong>vmstat</strong>: ‏<code>r</code> = tasks שמחכים לרוץ (אם &gt; מספר ה-CPUs ← רוויית CPU), ‏<code>b</code> = חסומים על I/O, ‏<code>si/so</code> = swap in/out (לא אפס = לחץ זיכרון), ‏<code>us/sy/id/wa/st</code> = ‏user, ‏system, ‏idle, ‏<strong>iowait</strong>, ‏<strong>steal</strong> (שכן רועש, או credits של instance מסוג burstable שנגמרים). מתעלמים מהשורה הראשונה (ממוצעים מאז ה-boot).</p>
<p><strong>mpstat -P ALL</strong> מראה איזון בין ה-CPUs: ליבה אחת ב-100% והשאר idle = צוואר בקבוק single-threaded (או IRQ חם אחד). ‏<strong>pidstat</strong> זה top מתגלגל שלא מנקה את המסך — פה <code>java</code> משתמש ב-768% = בערך 7.7 ליבות: הנה האשם.</p>`
      }
    },
    {
      h: { en: "6-7: iostat and free — disk and memory", he: "6-7: ‏iostat ו-free — דיסק וזיכרון" },
      body: {
        en: `<pre>$ iostat -xz 1
Device   r/s     w/s   rkB/s    wkB/s  r_await w_await aqu-sz  %util
nvme0n1  0.00   12.0    0.00    96.00     0.00    0.42   0.01   0.80
nvme1n1 812.0  1403.0 51968.0 112240.0   18.30   41.70  61.20  99.60
$ free -m
               total        used        free      shared  buff/cache   available
Mem:           15883       14921         211          44         750         612
Swap:           2047        1980          67</pre>
<p><strong>iostat -xz</strong>: <code>-x</code> extended stats, <code>-z</code> hide idle devices. Read <code>r_await/w_await</code> (ms per I/O, including queue time — on SSD/NVMe, tens of ms is bad), <code>aqu-sz</code> (average queue length; &gt; 1 means requests are waiting) and <code>%util</code> (busy time — ~100% on a single spinning disk = saturated; on NVMe/RAID it can be misleading because they serve requests in parallel). Here <code>nvme1n1</code> is clearly the bottleneck.</p>
<p><strong>free -m</strong>: ignore <code>free</code>, read <strong>available</strong> — Linux uses spare RAM as page cache and gives it back on demand, so low "free" is normal and healthy. Here available is 612MB out of 15.8GB <em>and</em> swap is nearly full: real memory pressure. Expect swapping (<code>si/so</code> in vmstat) and soon an OOM kill in dmesg.</p>`,
        he: `<pre>$ iostat -xz 1
Device   r/s     w/s   rkB/s    wkB/s  r_await w_await aqu-sz  %util
nvme0n1  0.00   12.0    0.00    96.00     0.00    0.42   0.01   0.80
nvme1n1 812.0  1403.0 51968.0 112240.0   18.30   41.70  61.20  99.60
$ free -m
               total        used        free      shared  buff/cache   available
Mem:           15883       14921         211          44         750         612
Swap:           2047        1980          67</pre>
<p><strong>iostat -xz</strong>: ‏<code>-x</code> סטטיסטיקות מורחבות, ‏<code>-z</code> מסתיר devices שלא עושים כלום. קוראים את <code>r_await/w_await</code> (מילישניות לכל I/O כולל זמן בתור — ב-SSD/NVMe עשרות ms זה רע), ‏<code>aqu-sz</code> (אורך תור ממוצע; מעל 1 אומר שבקשות מחכות) ו-<code>%util</code> (זמן עסוק — ~100% על דיסק מסתובב בודד = רווי; ב-NVMe/RAID זה יכול להטעות כי הם משרתים בקשות במקביל). פה <code>nvme1n1</code> הוא בבירור צוואר הבקבוק.</p>
<p><strong>free -m</strong>: מתעלמים מ-<code>free</code>, קוראים את <strong>available</strong> — Linux משתמש ב-RAM פנוי כ-page cache ומחזיר אותו לפי דרישה, אז "free" נמוך זה נורמלי ובריא. פה available הוא 612MB מתוך 15.8GB <em>וגם</em> ה-swap כמעט מלא: לחץ זיכרון אמיתי. צפה ל-swapping (‏<code>si/so</code> ב-vmstat) ובקרוב ל-OOM kill ב-dmesg.</p>`
      }
    },
    {
      h: { en: "8-10: sar -n DEV, sar -n TCP,ETCP, top", he: "8-10: ‏sar -n DEV, ‏sar -n TCP,ETCP, ‏top" },
      body: {
        en: `<pre>$ sar -n DEV 1
IFACE   rxpck/s  txpck/s    rxkB/s    txkB/s  %ifutil
eth0   22190.0  18765.0  118034.1  121410.6    96.70
lo        14.0     14.0       1.4       1.4     0.00
$ sar -n TCP,ETCP 1
active/s passive/s    iseg/s    oseg/s
    1.00    412.00  21544.00  19870.00
atmptf/s  estres/s retrans/s isegerr/s   orsts/s
    0.00      3.00    214.00      0.00     51.00
$ top        # then: 1 = per-CPU, M = sort by mem, P = by CPU, c = full cmd, H = threads</pre>
<p><strong>sar -n DEV</strong>: throughput per interface. Compare <code>rxkB/s + txkB/s</code> to the NIC/instance limit — ~120MB/s ≈ 1 Gbit/s, so <code>%ifutil</code> 96.7 means the network pipe is full. <strong>sar -n TCP,ETCP</strong>: <code>active/s</code> = outbound connections opened, <code>passive/s</code> = inbound accepted (a load proxy), <code>retrans/s</code> = retransmits — a high rate relative to <code>oseg/s</code> means packet loss or an overloaded peer.</p>
<p><strong>top</strong> last, to confirm everything you've already seen and to catch anything missed. Check <code>%wa</code>, <code>st</code>, the load line, and the top processes.</p>
<blockquote>⚠️ Production tip: install <code>sysstat</code> (mpstat, pidstat, iostat, sar) on <em>every</em> base image <em>before</em> you need it — during an incident with a full disk or a hung package mirror, you can't apt-get. Enable its collector and <code>sar -u -f /var/log/sysstat/saXX</code> gives you yesterday's 3am history too.</blockquote>`,
        he: `<pre>$ sar -n DEV 1
IFACE   rxpck/s  txpck/s    rxkB/s    txkB/s  %ifutil
eth0   22190.0  18765.0  118034.1  121410.6    96.70
lo        14.0     14.0       1.4       1.4     0.00
$ sar -n TCP,ETCP 1
active/s passive/s    iseg/s    oseg/s
    1.00    412.00  21544.00  19870.00
atmptf/s  estres/s retrans/s isegerr/s   orsts/s
    0.00      3.00    214.00      0.00     51.00
$ top        # then: 1 = per-CPU, M = sort by mem, P = by CPU, c = full cmd, H = threads</pre>
<p><strong>sar -n DEV</strong>: תפוקה לכל ממשק. משווים את <code>rxkB/s + txkB/s</code> למגבלה של הכרטיס/ה-instance — ~120MB/s ≈ 1 Gbit/s, אז <code>%ifutil</code> של 96.7 אומר שצינור הרשת מלא. ‏<strong>sar -n TCP,ETCP</strong>: ‏<code>active/s</code> = חיבורים יוצאים שנפתחו, ‏<code>passive/s</code> = חיבורים נכנסים שהתקבלו (מדד לעומס), ‏<code>retrans/s</code> = retransmits — יחס גבוה ביחס ל-<code>oseg/s</code> אומר איבוד פקטות או צד שני עמוס.</p>
<p><strong>top</strong> בסוף, כדי לאשר את מה שכבר ראית ולתפוס משהו שפספסת. בודקים <code>%wa</code>, ‏<code>st</code>, שורת ה-load והתהליכים בראש.</p>
<blockquote>⚠️ טיפ לפרודקשן: תתקין <code>sysstat</code> (‏mpstat, ‏pidstat, ‏iostat, ‏sar) על <em>כל</em> base image <em>לפני</em> שאתה צריך אותו — באמצע תקלה עם דיסק מלא או mirror של חבילות תקוע, אי אפשר לעשות apt-get. תפעיל את ה-collector שלו, ו-<code>sar -u -f /var/log/sysstat/saXX</code> ייתן לך גם את ההיסטוריה של 3 בלילה אתמול.</blockquote>`
      }
    },
    {
      h: { en: "Putting it together: symptom → resource", he: "לחבר הכל: סימפטום ← משאב" },
      body: {
        en: `<table>
<tr><th>You see</th><th>It means</th><th>Next step</th></tr>
<tr><td>vmstat <code>r</code> &gt; nproc, <code>us</code> ~100%</td><td>CPU saturation</td><td>pidstat → profile the hot process (perf top), scale out</td></tr>
<tr><td>high <code>sy</code></td><td>kernel time: syscalls, context switches</td><td>strace -c, check <code>cs</code> column, lock contention</td></tr>
<tr><td>high <code>wa</code>, <code>b</code> &gt; 0, high load + idle CPU</td><td>waiting on disk</td><td>iostat -xz → which device; iotop/pidstat -d → which process</td></tr>
<tr><td><code>st</code> &gt; 5-10%</td><td>hypervisor stealing CPU</td><td>bigger / non-burstable instance, check CPU credits</td></tr>
<tr><td>low <code>available</code>, <code>si/so</code> &gt; 0, OOM in dmesg</td><td>memory pressure</td><td>ps --sort=-rss, fix leak / raise limits</td></tr>
<tr><td>%ifutil ~100, retrans/s high</td><td>network saturation or loss</td><td>ss -ti, mtr, check instance bandwidth limits</td></tr>
</table>
<p>This is Brendan Gregg's <strong>USE method</strong> in practice: for every resource check <strong>U</strong>tilization, <strong>S</strong>aturation (queueing) and <strong>E</strong>rrors. The 60-second checklist hits all three for CPU, memory, disk and network.</p>`,
        he: `<table>
<tr><th>מה רואים</th><th>מה זה אומר</th><th>הצעד הבא</th></tr>
<tr><td>vmstat <code>r</code> &gt; nproc, ‏<code>us</code> ~100%</td><td>רוויית CPU</td><td>pidstat ← profile לתהליך החם (perf top), ‏scale out</td></tr>
<tr><td><code>sy</code> גבוה</td><td>זמן kernel: ‏syscalls, ‏context switches</td><td>strace -c, לבדוק את עמודת <code>cs</code>, ‏lock contention</td></tr>
<tr><td><code>wa</code> גבוה, ‏<code>b</code> &gt; 0, ‏load גבוה + CPU פנוי</td><td>מחכים לדיסק</td><td>iostat -xz ← איזה device; ‏iotop/pidstat -d ← איזה תהליך</td></tr>
<tr><td><code>st</code> &gt; 5-10%</td><td>ה-hypervisor גונב CPU</td><td>instance גדול יותר / לא burstable, לבדוק CPU credits</td></tr>
<tr><td><code>available</code> נמוך, ‏<code>si/so</code> &gt; 0, ‏OOM ב-dmesg</td><td>לחץ זיכרון</td><td>ps --sort=-rss, לתקן leak / להעלות limits</td></tr>
<tr><td>%ifutil ~100, ‏retrans/s גבוה</td><td>רוויית רשת או איבוד פקטות</td><td>ss -ti, ‏mtr, לבדוק מגבלות רוחב פס של ה-instance</td></tr>
</table>
<p>זו <strong>שיטת USE</strong> של Brendan Gregg בפועל: לכל משאב בודקים <strong>U</strong>tilization (ניצולת), ‏<strong>S</strong>aturation (תור) ו-<strong>E</strong>rrors (שגיאות). הצ'קליסט של 60 השניות מכסה את שלושתם ל-CPU, זיכרון, דיסק ורשת.</p>`
      }
    }
  ],
  diagram: "  1 uptime          load trend vs nproc\n  2 dmesg -T|tail   OOM, I/O errors, SYN flood\n  3 vmstat 1        r, b, si/so, us sy id wa st\n  4 mpstat -P ALL 1 per-CPU imbalance\n  5 pidstat 1       which process eats CPU\n  6 iostat -xz 1    await, aqu-sz, %util per disk\n  7 free -m         'available', swap\n  8 sar -n DEV 1    NIC throughput vs limit\n  9 sar -n TCP,ETCP 1  conn rate, retransmits\n 10 top             confirm\n\n CPU ─┐  Memory ─┐  Disk ─┐  Network ─┐   → Utilization? Saturation? Errors?",
  handsOn: [
    { cmd: "uptime; nproc", what: { en: "Load averages (1/5/15 min) next to the CPU count — is work queueing, and is it getting worse?", he: "load averages (‏1/5/15 דקות) ליד מספר ה-CPUs — יש תור, והוא מחמיר?" } },
    { cmd: "dmesg -T | tail -20", what: { en: "Recent kernel messages with human timestamps: OOM kills, disk errors, network drops.", he: "הודעות kernel אחרונות עם זמנים קריאים: ‏OOM kills, שגיאות דיסק, נפילות רשת." } },
    { cmd: "vmstat 1 5", what: { en: "Five 1-second samples of run queue, swap, I/O and CPU split (us/sy/id/wa/st). Ignore line 1.", he: "חמש דגימות של שנייה: תור ריצה, ‏swap, ‏I/O וחלוקת CPU (‏us/sy/id/wa/st). מתעלמים משורה 1." } },
    { cmd: "mpstat -P ALL 1 3", what: { en: "Per-CPU utilization — spot a single pegged core (single-threaded bottleneck or IRQ).", he: "ניצולת לכל CPU — לזהות ליבה אחת תקועה ב-100% (צוואר בקבוק single-threaded או IRQ)." } },
    { cmd: "pidstat 1 5", what: { en: "Per-process CPU usage over time, without top's screen clearing.", he: "שימוש CPU לכל תהליך לאורך זמן, בלי שהמסך מתנקה כמו ב-top." } },
    { cmd: "iostat -xz 1 5", what: { en: "Extended per-disk stats, hiding idle devices: latency (await), queue (aqu-sz), %util.", he: "סטטיסטיקות מורחבות לכל דיסק בלי devices רדומים: ‏latency (‏await), תור (‏aqu-sz), ‏%util." } },
    { cmd: "free -m", what: { en: "Memory in MB — look at 'available' (not 'free') and whether swap is in use.", he: "זיכרון ב-MB — מסתכלים על 'available' (לא 'free') והאם ה-swap בשימוש." } },
    { cmd: "sar -n DEV 1 5", what: { en: "Network throughput per interface (packets and kB/s) — compare against the instance bandwidth.", he: "תפוקת רשת לכל ממשק (פקטות ו-kB/s) — להשוות למגבלת רוחב הפס של ה-instance." } },
    { cmd: "sar -n TCP,ETCP 1 5", what: { en: "TCP connection rates and retransmits per second — new-connection storms and packet loss.", he: "קצב חיבורי TCP ו-retransmits לשנייה — סערות חיבורים חדשים ואיבוד פקטות." } },
    { cmd: "pidstat -d 1 5", what: { en: "Per-process disk read/write rates — find who is hammering the disk.", he: "קצב קריאה/כתיבה לדיסק לכל תהליך — למצוא מי מפציץ את הדיסק." } }
  ],
  mnemonic: {
    en: "\"U Do Very Many Pretty Important Fixes So Saturation Ends\": Uptime, Dmesg, Vmstat, Mpstat, Pidstat, Iostat, Free, Sar DEV, Sar TCP, (top) — and for every resource ask U-S-E: Utilization, Saturation, Errors.",
    he: "כמו טריאז' במיון: 'דופק ← טראומה ← מוניטור ← מומחים ← אישור' = uptime ← dmesg ← vmstat/mpstat/pidstat ← iostat/free/sar ← top. ולכל משאב שואלים USE: ניצולת, תור, שגיאות."
  },
  pitfalls: [
    { en: "Reading load average as CPU usage — on Linux it includes tasks waiting on disk (D-state). Always compare with vmstat's us/wa.", he: "לקרוא load average כשימוש CPU — ב-Linux הוא כולל tasks שמחכים לדיסק (מצב D). תמיד להשוות ל-us/wa ב-vmstat." },
    { en: "Panicking about low 'free' memory — Linux fills spare RAM with page cache. Watch 'available' and swap activity.", he: "להיבהל מ-'free' נמוך — Linux ממלא RAM פנוי ב-page cache. מסתכלים על 'available' ועל פעילות swap." },
    { en: "Trusting the first line of vmstat/iostat — it's the average since boot, not now.", he: "לסמוך על השורה הראשונה של vmstat/iostat — זה ממוצע מאז ה-boot, לא מה שקורה עכשיו." },
    { en: "Treating %util ~100% on NVMe/RAID as saturation — these devices handle many parallel I/Os; check await and aqu-sz instead.", he: "להתייחס ל-%util ~100% ב-NVMe/RAID כרוויה — הם מטפלים בהרבה I/Os במקביל; תסתכל על await ו-aqu-sz במקום." }
  ],
  interview: [
    { q: { en: "You SSH into a slow server. What do you run in the first minute?", he: "נכנסת ב-SSH לשרת איטי. מה אתה מריץ בדקה הראשונה?" },
      a: { en: "uptime (load trend vs nproc), dmesg -T | tail (OOM, disk errors), vmstat 1 (run queue, swap, us/sy/wa/st), mpstat -P ALL 1 (per-CPU imbalance), pidstat 1 (top CPU consumers), iostat -xz 1 (disk latency/queue), free -m (available memory), sar -n DEV 1 and sar -n TCP,ETCP 1 (network throughput, retransmits), then top. That classifies the bottleneck as CPU, memory, disk or network before deeper profiling.", he: "uptime (מגמת load מול nproc), ‏dmesg -T | tail (‏OOM, שגיאות דיסק), ‏vmstat 1 (תור ריצה, swap, ‏us/sy/wa/st), ‏mpstat -P ALL 1 (חוסר איזון בין CPUs), ‏pidstat 1 (מי אוכל CPU), ‏iostat -xz 1 (‏latency ותור בדיסק), ‏free -m (זיכרון available), ‏sar -n DEV 1 ו-sar -n TCP,ETCP 1 (תפוקת רשת, ‏retransmits), ואז top. ככה מסווגים את צוואר הבקבוק ל-CPU, זיכרון, דיסק או רשת לפני profiling עמוק." } },
    { q: { en: "Load average is 40 on a 16-core box but CPU is 70% idle. What's happening?", he: "load average הוא 40 על שרת עם 16 ליבות אבל ה-CPU ‏70% idle. מה קורה?" },
      a: { en: "Linux load counts tasks in uninterruptible sleep (D-state), typically blocked on disk or NFS I/O. Confirm with vmstat (b column, wa), ps -eo stat,pid,cmd | grep '^D', and iostat -xz for a device with high await/queue. The fix is on the storage side, not more CPU.", he: "ה-load ב-Linux סופר tasks ב-uninterruptible sleep (מצב D), בדרך כלל חסומים על I/O לדיסק או NFS. מאשרים עם vmstat (עמודת b, ‏wa), ‏ps -eo stat,pid,cmd | grep '^D', ו-iostat -xz כדי למצוא device עם await/תור גבוהים. התיקון בצד ה-storage, לא עוד CPU." } },
    { q: { en: "What is CPU steal time and when does it matter?", he: "מה זה CPU steal time ומתי זה משנה?" },
      a: { en: "The percentage of time a virtual CPU wanted to run but the hypervisor was serving another guest. Sustained steal above ~5-10% means noisy neighbors or exhausted burst credits (e.g. AWS t3). Your app slows down while its own CPU% looks moderate. Fix: larger or dedicated/non-burstable instance types.", he: "אחוז הזמן שה-vCPU רצה לרוץ אבל ה-hypervisor שירת guest אחר. ‏steal קבוע מעל ~5-10% אומר שכנים רועשים או credits של burst שנגמרו (למשל t3 ב-AWS). האפליקציה מאטה בזמן שה-CPU% שלה נראה סביר. התיקון: instance גדול יותר או dedicated/לא burstable." } }
  ],
  quiz: [
    { q: { en: "vmstat shows r=2, b=12, wa=55, us=5 on an 8-CPU box. What's the bottleneck?", he: "vmstat מראה r=2, ‏b=12, ‏wa=55, ‏us=5 על שרת עם 8 CPUs. מה צוואר הבקבוק?" },
      options: [ { en: "CPU", he: "CPU" }, { en: "Disk I/O", he: "I/O לדיסק" }, { en: "Network", he: "רשת" }, { en: "Nothing, the box is idle", he: "כלום, השרת idle" } ],
      answer: 1, explain: { en: "Many tasks blocked (b) and high iowait with little user CPU = waiting on storage. Next: iostat -xz 1.", he: "הרבה tasks חסומים (‏b) ו-iowait גבוה עם מעט user CPU = מחכים ל-storage. הצעד הבא: iostat -xz 1." } },
    { q: { en: "free -m shows free=180MB, available=9800MB of 16GB, swap unused. Is memory a problem?", he: "free -m מראה free=180MB, ‏available=9800MB מתוך 16GB, ‏swap לא בשימוש. יש בעיית זיכרון?" },
      options: [ { en: "Yes, only 180MB free", he: "כן, רק 180MB פנויים" }, { en: "No — most RAM is reclaimable page cache", he: "לא — רוב ה-RAM הוא page cache שאפשר לשחרר" }, { en: "Yes, swap should be in use", he: "כן, ה-swap אמור להיות בשימוש" }, { en: "Can't tell without a reboot", he: "אי אפשר לדעת בלי reboot" } ],
      answer: 1, explain: { en: "'available' estimates memory usable without swapping. ~9.8GB available is healthy.", he: "'available' מעריך כמה זיכרון אפשר להשתמש בלי swap. ‏~9.8GB זמינים זה בריא." } },
    { q: { en: "Which command best reveals one CPU core pegged at 100% while others idle?", he: "איזו פקודה הכי טובה לגלות ליבה אחת ב-100% כשהשאר idle?" },
      options: [ { en: "uptime", he: "uptime" }, { en: "mpstat -P ALL 1", he: "mpstat -P ALL 1" }, { en: "free -m", he: "free -m" }, { en: "iostat -xz 1", he: "iostat -xz 1" } ],
      answer: 1, explain: { en: "mpstat -P ALL breaks utilization down per CPU; aggregate tools hide imbalance (1 of 16 cores = ~6%).", he: "mpstat -P ALL מפרק ניצולת לכל CPU; כלים מצרפיים מסתירים חוסר איזון (ליבה 1 מ-16 = ~6%)." } },
    { q: { en: "dmesg shows 'Out of memory: Killed process 4121 (java)'. Which exit code did java likely report?", he: "dmesg מראה 'Out of memory: Killed process 4121 (java)'. איזה exit code כנראה דווח ל-java?" },
      options: [ { en: "0", he: "0" }, { en: "1", he: "1" }, { en: "137", he: "137" }, { en: "143", he: "143" } ],
      answer: 2, explain: { en: "The OOM killer sends SIGKILL (9): 128 + 9 = 137. 143 would be SIGTERM.", he: "ה-OOM killer שולח SIGKILL (‏9): ‏128 + 9 = 137. ‏143 זה SIGTERM." } }
  ],
  playground: "terminal",
  related: ["cpu", "memory", "storage-io", "linux-processes", "linux-disks-storage", "net-troubleshooting"]
});

/* ============================== GLOSSARY ============================== */
[
  ["inode", "The on-disk record holding a file's metadata (type, owner, permissions, timestamps, size, block pointers) — everything except its name. Check usage with df -i.", "הרשומה על הדיסק שמחזיקה את המטא-דאטה של קובץ (סוג, owner, הרשאות, timestamps, גודל, מצביעים לבלוקים) — הכל חוץ מהשם. בודקים שימוש עם df -i.", "linux-disks-storage"],
  ["Symlink", "A special file containing a path to another file or directory (ln -s). Can cross filesystems; dangles if the target is removed.", "קובץ מיוחד שמכיל נתיב לקובץ או תיקייה אחרים (ln -s). יכול לחצות filesystems; נשאר תלוי באוויר אם היעד נמחק.", "linux-files-navigation"],
  ["/proc", "A virtual filesystem exposing live kernel and per-process information (/proc/PID/fd, /proc/loadavg, /proc/meminfo). Nothing is stored on disk.", "filesystem וירטואלי שחושף מידע חי מה-kernel ועל כל תהליך (‏/proc/PID/fd, ‏/proc/loadavg, ‏/proc/meminfo). שום דבר לא שמור על הדיסק.", "linux-files-navigation"],
  ["Permission bits (rwx)", "Read/write/execute flags for user, group and other; numeric r=4, w=2, x=1 (e.g. 755, 644, 600). On directories x means 'may traverse'.", "דגלי קריאה/כתיבה/הרצה ל-user, ‏group ו-other; במספרים r=4, ‏w=2, ‏x=1 (למשל 755, ‏644, ‏600). על תיקייה x אומר 'מותר לעבור דרכה'.", "linux-permissions-users"],
  ["umask", "A mask of permission bits removed from newly created files and dirs. umask 022 → files 644, dirs 755; 077 → private by default.", "מסכה של ביטי הרשאות שמורדים מקבצים ותיקיות חדשים. ‏umask 022 ← קבצים 644, תיקיות 755; ‏077 ← פרטי כברירת מחדל.", "linux-permissions-users"],
  ["sudo", "Runs a single command as root (or another user) per rules in /etc/sudoers, logging every use. Edit rules only with visudo.", "מריץ פקודה אחת כ-root (או כמשתמש אחר) לפי חוקים ב-/etc/sudoers, ומתעד כל שימוש. עורכים חוקים רק עם visudo.", "linux-permissions-users"],
  ["setuid", "A permission bit (rwsr-xr-x) that makes an executable run with its owner's privileges, e.g. passwd. A common privilege-escalation target.", "ביט הרשאה (‏rwsr-xr-x) שגורם לבינארי לרוץ עם ההרשאות של הבעלים שלו, למשל passwd. מטרה נפוצה ל-privilege escalation.", "linux-permissions-users"],
  ["stdin / stdout / stderr", "The three standard streams every process starts with: fd 0 input, fd 1 normal output, fd 2 errors and diagnostics.", "שלושת ה-streams הסטנדרטיים שכל תהליך מתחיל איתם: ‏fd 0 קלט, ‏fd 1 פלט רגיל, ‏fd 2 שגיאות ואבחון.", "linux-text-processing"],
  ["Pipe", "The | operator connecting one process's stdout to the next one's stdin, so small tools compose into pipelines.", "האופרטור | שמחבר את ה-stdout של תהליך אחד ל-stdin של הבא, כך שכלים קטנים מתחברים ל-pipelines.", "linux-text-processing"],
  ["File descriptor", "A small integer a process uses to refer to an open file, socket or pipe (0,1,2 are the std streams). Listed in /proc/PID/fd; limited by ulimit -n.", "מספר קטן שתהליך משתמש בו כדי להתייחס לקובץ, socket או pipe פתוח (‏0,1,2 הם ה-streams הסטנדרטיים). מופיעים ב-/proc/PID/fd; מוגבלים ע\"י ulimit -n.", "linux-processes"],
  ["PID", "Process ID: the unique number the kernel assigns to each running process. PID 1 is init (systemd) and adopts orphans.", "Process ID: המספר הייחודי שה-kernel נותן לכל תהליך רץ. ‏PID 1 הוא ה-init (‏systemd) והוא מאמץ orphans.", "linux-processes"],
  ["Signal", "An asynchronous notification sent to a process (kill -SIGNAL PID), e.g. TERM to stop, HUP to reload, KILL to force-terminate.", "הודעה אסינכרונית שנשלחת לתהליך (‏kill -SIGNAL PID), למשל TERM לעצירה, ‏HUP ל-reload, ‏KILL להריגה בכוח.", "linux-processes"],
  ["SIGTERM", "Signal 15, the default of kill: a polite request to exit that the process can catch to shut down gracefully. Exit code 143 if unhandled.", "signal 15, ברירת המחדל של kill: בקשה מנומסת לצאת שהתהליך יכול לתפוס כדי לכבות בצורה מסודרת. ‏exit code 143 אם לא טופל.", "linux-processes"],
  ["SIGKILL", "Signal 9: the kernel terminates the process immediately; it can't be caught or ignored, so there's no cleanup. Exit code 137 (also what OOM kills give).", "signal 9: ה-kernel מסיים את התהליך מיד; אי אפשר לתפוס או להתעלם, אז אין ניקוי. ‏exit code 137 (גם מה ש-OOM kill נותן).", "linux-processes"],
  ["SIGHUP", "Signal 1: originally 'terminal hung up' (kills jobs on logout); by convention daemons like nginx reload their config on it.", "signal 1: במקור 'הטרמינל נותק' (הורג jobs ביציאה); במוסכמה, daemons כמו nginx טוענים קונפיג מחדש כשהם מקבלים אותו.", "linux-processes"],
  ["Zombie process", "A process that has exited but whose parent hasn't wait()ed for its exit status. Uses only a PID slot; fixed by reaping or killing the parent.", "תהליך שיצא אבל ה-parent שלו לא עשה wait() לסטטוס היציאה. תופס רק PID; מתקנים ע\"י איסוף או הריגת ה-parent.", "linux-processes"],
  ["Orphan process", "A running process whose parent died; it's re-parented to PID 1 (or a subreaper), which reaps it when it exits.", "תהליך רץ שה-parent שלו מת; הוא מאומץ ע\"י PID 1 (או subreaper), שאוסף אותו כשהוא יוצא.", "linux-processes"],
  ["Exit code", "The 0-255 status a process returns: 0 success, non-zero failure, 126 not executable, 127 not found, 128+N killed by signal N. Read via $?.", "הסטטוס 0-255 שתהליך מחזיר: 0 הצלחה, אחר = כישלון, 126 לא executable, ‏127 לא נמצא, 128+N נהרג מ-signal N. קוראים עם $?.", "linux-bash-scripting"],
  ["systemd unit", "A config file (.service, .timer, .socket, .mount) describing something systemd manages: how to start it, as whom, dependencies and restart policy.", "קובץ קונפיג (‏.service, ‏.timer, ‏.socket, ‏.mount) שמתאר משהו ש-systemd מנהל: איך להרים, תחת איזה משתמש, תלויות ומדיניות restart.", "linux-systemd-logs"],
  ["journald / journalctl", "systemd's logging service, capturing stdout/stderr of units and kernel messages in a structured journal; journalctl queries it (-u, -f, --since, -p).", "שירות הלוגים של systemd, שתופס stdout/stderr של units והודעות kernel ב-journal מובנה; ‏journalctl מתשאל אותו (‏-u, ‏-f, ‏--since, ‏-p).", "linux-systemd-logs"],
  ["cron", "The classic time-based job scheduler; each crontab line has 5 fields (minute hour day-of-month month day-of-week) and a command.", "מתזמן המשימות הקלאסי לפי זמן; בכל שורת crontab יש 5 שדות (דקה, שעה, יום בחודש, חודש, יום בשבוע) ופקודה.", "linux-systemd-logs"],
  ["logrotate", "A tool that rotates, compresses and deletes old log files on a schedule so logs don't fill the disk.", "כלי שמסובב, דוחס ומוחק קבצי לוג ישנים לפי לוח זמנים, כדי שהלוגים לא ימלאו את הדיסק.", "linux-systemd-logs"],
  ["Socket", "An endpoint for network or inter-process communication, identified by IP:port (or a file path for Unix sockets). ss -tulpn lists listening sockets.", "נקודת קצה לתקשורת רשת או בין תהליכים, מזוהה ע\"י IP:port (או נתיב קובץ ב-Unix sockets). ‏ss -tulpn מציג sockets מאזינים.", "linux-networking-commands"],
  ["Deleted-but-open file", "A file removed with rm while a process still holds it open: its space stays used until the fd closes. Find with lsof +L1.", "קובץ שנמחק עם rm בזמן שתהליך עדיין מחזיק אותו פתוח: המקום נשאר תפוס עד שה-fd נסגר. מוצאים עם lsof +L1.", "linux-disks-storage"],
  ["SSH key pair", "A private key (kept secret, mode 600) and public key (placed in the server's authorized_keys) used for passwordless, cryptographic login. Prefer ed25519.", "מפתח פרטי (נשמר בסוד, ‏mode 600) ומפתח ציבורי (נכנס ל-authorized_keys בשרת) לכניסה קריפטוגרפית בלי סיסמה. עדיף ed25519.", "linux-ssh-remote"],
  ["Bastion / jump host", "A hardened, internet-facing host used as the single entry point to private servers; reached through with ssh -J / ProxyJump.", "שרת מוקשח שפונה לאינטרנט ומשמש נקודת כניסה יחידה לשרתים פרטיים; עוברים דרכו עם ssh -J / ‏ProxyJump.", "linux-ssh-remote"],
  ["Port forwarding (SSH tunnel)", "Carrying a TCP port through an SSH connection: -L exposes a remote service on a local port, -R exposes a local service on the remote side.", "העברת פורט TCP דרך חיבור SSH: ‏-L חושף שירות מרוחק על פורט מקומי, ‏-R חושף שירות מקומי בצד המרוחק.", "linux-ssh-remote"],
  ["tmux", "A terminal multiplexer: sessions keep running on the server after you disconnect and can be re-attached (tmux attach).", "terminal multiplexer: ה-sessions ממשיכים לרוץ על השרת אחרי שהתנתקת ואפשר להתחבר אליהם מחדש (‏tmux attach).", "linux-ssh-remote"],
  ["set -euo pipefail", "Bash strict mode: exit on error (-e), fail on unset variables (-u), and make pipelines fail if any stage fails (pipefail).", "strict mode של bash: יציאה בשגיאה (‏-e), כישלון על משתנה לא מוגדר (‏-u), ו-pipeline נכשל אם שלב כלשהו נכשל (‏pipefail).", "linux-bash-scripting"],
  ["Load average", "Average number of tasks running or waiting (CPU run queue plus uninterruptible I/O on Linux) over 1, 5 and 15 minutes; compare to nproc.", "הממוצע של מספר ה-tasks שרצים או מחכים (תור ה-CPU ועוד I/O מסוג uninterruptible ב-Linux) על פני 1, 5 ו-15 דקות; משווים ל-nproc.", "linux-performance-60s"],
  ["iowait", "CPU time spent idle while there was outstanding disk I/O (the wa column). High iowait points to storage, not CPU, as the bottleneck.", "זמן CPU שעבר ב-idle בזמן שהיה I/O לדיסק שעוד לא הסתיים (עמודת wa). ‏iowait גבוה מצביע על ה-storage, לא ה-CPU, כצוואר הבקבוק.", "linux-performance-60s"],
  ["CPU steal time", "Time a virtual CPU was ready to run but the hypervisor ran someone else (st column). Sustained >5-10% = noisy neighbors or exhausted burst credits.", "זמן שבו ה-vCPU היה מוכן לרוץ אבל ה-hypervisor הריץ מישהו אחר (עמודת st). מעל 5-10% לאורך זמן = שכנים רועשים או credits של burst שנגמרו.", "linux-performance-60s"],
  ["OOM killer", "The kernel mechanism that SIGKILLs a process when memory is exhausted; logged in dmesg as 'Out of memory: Killed process'.", "המנגנון ב-kernel ששולח SIGKILL לתהליך כשהזיכרון נגמר; מתועד ב-dmesg בתור 'Out of memory: Killed process'.", "linux-performance-60s"],
  ["USE method", "Brendan Gregg's checklist: for every resource (CPU, memory, disk, network) check Utilization, Saturation and Errors.", "הצ'קליסט של Brendan Gregg: לכל משאב (CPU, זיכרון, דיסק, רשת) בודקים Utilization, ‏Saturation ו-Errors.", "linux-performance-60s"]
].forEach(([term, en, he, lesson]) => INFRA.glossary.push({ term, track: "linux", def: { en, he }, lesson }));
