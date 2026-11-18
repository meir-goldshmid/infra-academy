CQ.unitHe({
  id: 'os-concurrency',
  order: 14,
  title: 'מערכות הפעלה ו-Concurrency',
  emoji: '🧵',
  color: '#f97316',
  tagline: 'תהליכים, schedulers, זיכרון וירטואלי, locks ו-deadlocks: מה הקונטיינרים שלך באמת עושים',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'processes-threads',
      title: 'תהליכים מול threads',
      emoji: '🧬',
      steps: [
        { type: 'learn', title: 'דירות ושותפים', html: `
<p><b>Process</b> (תהליך) הוא תוכנית רצה עם <b>address space</b> פרטי משלה: קוד, heap, משתנים גלובליים וקבצים פתוחים. תחשוב עליו כמו דירה. תהליכים אחרים לא יכולים להיכנס.</p>
<p><b>Thread</b> הוא קו ביצוע אחד <i>בתוך</i> תהליך. ה-threads הם שותפים לדירה: הם חולקים את המטבח (heap, גלובליים, file descriptors), אבל לכל אחד יש <b>stack</b> משלו ו-<b>registers</b> משלו (כולל ה-program counter).</p>
<table><tr><th></th><th>Process</th><th>Thread</th></tr>
<tr><td>זיכרון</td><td>address space פרטי</td><td>משותף עם ה-threads האחים</td></tr>
<tr><td>רדיוס הנזק בקריסה</td><td>רק הוא עצמו</td><td>segfault אחד מפיל את כל התהליך</td></tr>
<tr><td>עלות יצירה</td><td>גבוהה יותר (page tables חדשים)</td><td>נמוכה יותר</td></tr>
<tr><td>תקשורת ביניהם</td><td>IPC: pipes, sockets, shared memory</td><td>פשוט קוראים את אותו משתנה (בזהירות!)</td></tr></table>
<div class="dev">אתה כבר מכיר את זה: Nginx ו-Postgres משתמשים ב-<b>תהליכים</b> (worker או backend לכל חיבור), כך ש-worker דפוק אחד לא יכול להשחית את השכן. שירות JVM או Go הוא תהליך אחד עם הרבה threads, ולכן באג אחד יכול להפיל הכול בבת אחת.</div>` },
        { type: 'mcq', q: 'מה מהבאים לא משותף בין threads של אותו תהליך?',
          choices: ['ה-heap', 'ה-file descriptors הפתוחים', 'ה-stack', 'משתנים גלובליים'], answer: 2,
          explain: 'לכל thread יש stack משלו (משתנים מקומיים, כתובות חזרה) ו-registers משלו. ה-heap, הגלובליים וה-file descriptors שייכים לתהליך ומשותפים לכל ה-threads שלו.' },
        { type: 'learn', title: 'ה-PCB, fork ו-exec', html: `
<p>ה-kernel עוקב אחרי כל תהליך ב-<b>Process Control Block</b> (PCB). ב-Linux זה <code>struct task_struct</code>: PID, מצב (רץ, ישן...), registers שמורים, מצביע ל-page tables, קבצים פתוחים, מידע ל-scheduler ושיוך ל-cgroup.</p>
<p>פרט נחמד ב-Linux: גם thread הוא <code>task_struct</code>. ה-flags של <code>clone()</code> קובעים מה משותף (<code>CLONE_VM</code>, <code>CLONE_FILES</code>...). "thread" הוא בסך הכול task שחולק את הזיכרון של ההורה שלו.</p>
<p>תוכנית חדשה עולה בשני שלבים:</p>
<ul><li><code>fork()</code> משכפל את התהליך הקורא. הוא מחזיר <b>0 בילד</b> ואת <b>ה-PID של הילד בהורה</b>. הזיכרון הוא <b>copy-on-write</b>, אז זה זול עד שמישהו כותב.</li>
<li><code>exec()</code> מחליף את התמונה של התהליך הנוכחי בתוכנית חדשה. אותו PID, קוד חדש.</li></ul>
<pre><code>pid = fork()
if pid == 0:  exec("/bin/ls")      # child becomes ls
else:         waitpid(pid)         # parent waits and reaps</code></pre>
<div class="dev">ה-<code>BGSAVE</code> של Redis עובד בדיוק ככה: <code>fork()</code>, והילד כותב את ה-snapshot בזמן שההורה ממשיך לשרת. בזכות copy-on-write הזיכרון גדל רק בדפים שההורה משנה בזמן השמירה. לכן Redis עם הרבה כתיבות יכול לצרוך לרגע עד פי 2 RAM.</div>` },
        { type: 'input', q: 'תוכנית מריצה fork(); fork(); fork(); ואז printf("hi\\n"). בהנחה שכל fork מצליח, כמה שורות "hi" יודפסו?', answer: ['8'], placeholder: 'מספר',
          explain: 'כל fork מכפיל את מספר התהליכים: 1 ← 2 ← 4 ← 8. כל השמונה מגיעים ל-printf. עם n פעמים fork ברצף מקבלים 2ⁿ תהליכים. ככה בדיוק "fork bomb" ממיס מכונה (ובגלל זה קיים pids.max ב-cgroups).' },
        { type: 'order', q: 'סדר מה קורה כשאתה מקליד ls ב-bash',
          items: ['bash קורא ל-fork() ומקבל תהליך ילד', 'הילד קורא ל-exec("/bin/ls")', 'ls רץ, מדפיס ויוצא', 'ה-wait() של bash אוסף את הילד ומציג שוב prompt'],
          explain: 'fork, exec, exit, wait. ה-shell עושה fork קודם כדי שה-exec יחליף את הילד ולא את ה-shell עצמו. בגלל זה exec ls מחליף את ה-shell שלך והסשן נסגר.' },
        { type: 'mcq', q: 'ה-ps בתוך קונטיינר מראה עשרות תהליכים במצב Z (zombie). מה הסיבה הסבירה?',
          choices: ['ל-node נגמר הזיכרון', 'תהליכי הילד יצאו, אבל ההורה אף פעם לא קרא ל-wait() כדי לאסוף אותם', 'התהליכים תקועים בלולאה אינסופית', 'התהליכים מחכים ל-I/O מהדיסק'], answer: 1,
          explain: 'zombie כבר יצא. נשארה ממנו רק רשומת ה-PCB, עד שההורה יקרא את ה-exit code שלו עם wait(). בקונטיינרים זה קורה הרבה כשהאפליקציה רצה כ-PID 1, מייצרת ילדים ולא אוספת אותם. הפתרון: init כמו tini (docker run --init, או shareProcessNamespace), או לאסוף ילדים בקוד.' },
        { type: 'learn', title: 'המחיר של context switch', html: `
<p><b>Context switch</b> זה ה-kernel שעוצר task אחד וממשיך task אחר: שומר registers, בוחר את ה-task הבא, טוען את ה-registers שלו. בין שני <i>תהליכים</i> הוא גם מחליף page tables, וזה יכול לבטל תרגומי כתובות שמורים (ה-TLB).</p>
<ul><li><b>עלות ישירה:</b> בערך 1–5 µs בחומרה מודרנית.</li>
<li><b>עלות עקיפה:</b> ה-task החדש מוצא caches ו-TLB קרים. זה יכול לעלות יותר מההחלפה עצמה.</li></ul>
<pre><code>$ vmstat 1
procs ---system---
 r  b   in    cs
 3  0  1200  45000     # cs = context switches per second

$ grep ctxt /proc/1234/status
voluntary_ctxt_switches:     9120   # blocked on I/O or a lock
nonvoluntary_ctxt_switches:  88411  # preempted: time slice ran out</code></pre>
<div class="dev">הרבה מאוד switches מסוג <b>nonvoluntary</b> אומר שיותר מדי threads מוכנים לריצה נלחמים על מעט מדי CPUs. סיבות קלאסיות: thread pool של 500 ב-Pod עם 4 ליבות, או CPU limit הדוק מדי.</div>` },
        { type: 'tf', q: 'מעבר בין שני threads של אותו תהליך בדרך כלל זול יותר ממעבר בין שני תהליכים שונים.', answer: true,
          explain: 'threads חולקים address space אחד, אז ה-kernel לא צריך להחליף page tables והרשומות ב-TLB נשארות תקפות. רק ה-registers וה-stack pointer משתנים.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'scheduling',
      title: 'תזמון CPU',
      emoji: '⏱️',
      steps: [
        { type: 'learn', title: 'מי מקבל את ה-CPU עכשיו?', html: `
<p>בכל רגע, חלק מה-tasks <b>רצים</b> (running), חלק <b>מוכנים</b> (ready, מחכים ל-CPU) וחלק <b>חסומים</b> (blocked, מחכים לדיסק, לרשת או ל-lock). ה-<b>scheduler</b> בוחר איזה task מוכן ירוץ הבא.</p>
<p>שתי השיטות הוותיקות:</p>
<ul><li><b>FCFS</b> (First-Come, First-Served): מריצים לפי סדר ההגעה, כל job עד הסוף. פשוט, אבל job ארוך אחד גורם לכולם לחכות: <b>convoy effect</b>.</li>
<li><b>SJF</b> (Shortest Job First): מריצים קודם את הקצר ביותר. זה נותן את <b>זמן ההמתנה הממוצע המינימלי</b>, אבל צריך לדעת מראש כמה כל job ייקח, והוא יכול להרעיב jobs ארוכים.</li></ul>
<p>דוגמה: jobs מגיעים בזמן 0 בסדר A=24, B=3, C=3 (ms).</p>
<table><tr><th>שיטה</th><th>סדר</th><th>המתנות</th><th>המתנה ממוצעת</th></tr>
<tr><td>FCFS</td><td>A, B, C</td><td>0, 24, 27</td><td>17 ms</td></tr>
<tr><td>SJF</td><td>B, C, A</td><td>0, 3, 6</td><td>3 ms</td></tr></table>` },
        { type: 'input', q: 'jobs מגיעים בזמן 0 בסדר A=9, B=3, C=3 (ms). ב-FCFS, מה זמן ההמתנה הממוצע ב-ms?', answer: ['7'], placeholder: 'ms',
          explain: 'A מחכה 0, B מחכה 9, C מחכה 9 + 3 = 12. ‏(0 + 9 + 12) / 3 = 7 ms.' },
        { type: 'input', q: 'אותם jobs (A=9, B=3, C=3), הפעם עם SJF. מה זמן ההמתנה הממוצע ב-ms?', answer: ['3'], placeholder: 'ms',
          explain: 'SJF מריץ B, C, A. המתנות: 0, 3, 6. ‏(0 + 3 + 6) / 3 = 3 ms. אותה עבודה, פחות מחצי המתנה, רק משינוי הסדר.' },
        { type: 'learn', title: 'Round robin, עדיפויות ו-preemption', html: `
<p><b>Round robin</b> נותן לכל task מוכן <b>time quantum</b> (נגיד 10 ms). כשה-quantum נגמר, timer interrupt עושה לו <b>preemption</b> (מפקיע ממנו את ה-CPU) ושולח אותו לסוף התור.</p>
<ul><li>quantum קטן מדי: ה-CPU מבזבז את הזמן על context switches.</li>
<li>quantum גדול מדי: זה מתדרדר ל-FCFS, ו-tasks אינטראקטיביים מרגישים תקועים.</li></ul>
<p><b>Priority scheduling</b> תמיד מריץ את ה-task המוכן עם העדיפות הגבוהה ביותר. הסכנה היא <b>starvation</b> (הרעבה): זרם קבוע של עבודה בעדיפות גבוהה, ו-task בעדיפות נמוכה לעולם לא רץ. הפתרון הקלאסי הוא <b>aging</b>: ככל ש-task מחכה יותר, העדיפות שלו עולה.</p>
<div class="dev">בזכות preemption בקשה אחת שתקועה בלולאה לא מקפיאה לך את כל השרת: ה-kernel לוקח ממנה את ה-CPU כל כמה מילישניות. בלי preemption (תזמון שיתופי, כמו קוד event-loop ישן ב-Node.js), callback אחד כבד ב-CPU חוסם את כולם.</div>` },
        { type: 'mcq', q: 'Round robin עם time quantum ענק (ארוך מכל job) מתנהג בדיוק כמו איזו שיטה?',
          choices: ['SJF', 'FCFS', 'Priority scheduling', 'תזמון אקראי'], answer: 1,
          explain: 'אם אף job לא מנצל את כל ה-quantum שלו, אף אחד לא עובר preemption. ה-jobs פשוט רצים עד הסוף לפי סדר התור, וזה FCFS.' },
        { type: 'tf', q: 'Priority scheduling קשיח בלי aging יכול להרעיב tasks בעדיפות נמוכה לנצח.', answer: true,
          explain: 'כל עוד ממשיכה להגיע עבודה בעדיפות גבוהה, ה-task בעדיפות נמוכה אף פעם לא הבחירה הכי טובה. aging (או fair-share scheduler) מבטיח שבסוף הוא ירוץ.' },
        { type: 'learn', title: 'Linux: CFS, EEVDF וה-CPU limits שלך', html: `
<p>ה-<b>CFS</b> (Completely Fair Scheduler, 2007) של Linux שומר לכל task ערך <b>vruntime</b>: כמה CPU הוא צרך, משוקלל לפי ערך ה-<code>nice</code> שלו. ה-tasks המוכנים יושבים ב-red-black tree ממוין לפי vruntime, וה-task עם ה-<b>vruntime הקטן ביותר</b> רץ הבא. כל צעד של nice משנה את המשקל בערך פי 1.25, כלומר בערך 10% יותר או פחות CPU.</p>
<p>מאז kernel 6.6 (2023), <b>EEVDF</b> מחליף את לוגיקת הבחירה של CFS: כל task מקבל חלק הוגן ועוד <b>virtual deadline</b>, וה-task הזכאי עם ה-deadline המוקדם ביותר רץ. אותו רעיון של הוגנות, latency טוב יותר ל-tasks קצרים ומתפרצים.</p>
<p>Kubernetes ממופה ישירות על זה:</p>
<ul><li><code>requests.cpu</code> → <code>cpu.weight</code> (חלק יחסי כשיש תחרות).</li>
<li><code>limits.cpu</code> → <b>bandwidth quota</b> של CFS: ‏<code>cpu.max = "50000 100000"</code> אומר 50 ms של CPU לכל period של 100 ms. גמרת אותו מוקדם? ה-cgroup עובר <b>throttling</b> עד ה-period הבא.</li></ul>
<pre><code>$ cat /sys/fs/cgroup/cpu.stat
nr_periods 12000
nr_throttled 4100        # throttled in ~34% of periods!
throttled_usec 98000000</code></pre>` },
        { type: 'tf', q: 'ב-CFS, ה-task המוכן עם ה-vruntime הקטן ביותר נבחר לרוץ הבא.', answer: true,
          explain: 'vruntime הכי קטן = ה-task שקיבל הכי מעט CPU (משוקלל) עד עכשיו, כלומר זה ש"חייבים לו" הכי הרבה. הכלל הפשוט הזה נותן הוגנות.' },
        { type: 'mcq', q: 'ל-Pod יש limits.cpu: 500m והוא מריץ 8 threads עמוסים. צריכת ה-CPU הממוצעת רק 30%, אבל ב-p99 latency יש קפיצות של בערך 80 ms. מה הסיבה הסבירה?',
          choices: ['ה-node עושה swapping', 'Throttling של CFS quota: שמונה threads שורפים את ה-quota של 50 ms תוך בערך 6 ms, ואז ה-cgroup מחכה ל-period הבא של 100 ms', 'יותר מדי page faults', 'Deadlock באפליקציה'], answer: 1,
          explain: 'ה-quota הוא זמן CPU מצטבר של כל ה-threads. ‏8 threads × ~6 ms = 50 ms, ואז כל ה-cgroup קפוא עד סוף ה-period. הממוצעים נראים מצוין, ה-tail latency לא. בדוק nr_throttled ב-cpu.stat. הפתרון: להעלות או להוריד את ה-limit, או להתאים את מספר ה-threads ל-limit.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'virtual-memory',
      title: 'זיכרון וירטואלי',
      emoji: '🗺️',
      steps: [
        { type: 'learn', title: 'לכל תהליך מפה משלו', html: `
<p>כל תהליך רואה <b>virtual address space</b> פרטי, ענק ונקי. הכתובת <code>0x7ffd1000</code> בתהליך A ואותה כתובת בתהליך B הן bytes פיזיים שונים. ה-<b>MMU</b> (Memory Management Unit) שב-CPU מתרגם כל כתובת וירטואלית לכתובת פיזית, בכל גישה.</p>
<p>הזיכרון מנוהל ב-<b>pages</b> (דפים) בגודל קבוע, בדרך כלל <b>4 KiB</b>. כתובת וירטואלית מתפצלת לשני חלקים:</p>
<div class="formula">virtual address = page number | offset inside the page</div>
<p>עם דפים של 4 KiB = 2¹² bytes, ה-12 ביטים הנמוכים הם ה-offset. רק מספר הדף מתורגם. ה-offset מועתק כמו שהוא.</p>
<div class="dev">זה מה שנותן לך בידוד (תהליך לא יכול אפילו <i>לנקוב בשם</i> של זיכרון של תהליך אחר), <code>fork()</code> זול בזכות copy-on-write, ו-memory overcommit: Linux שמח לתת לך לעשות <code>malloc</code> ליותר ממה שקיים, כי דף מקבל RAM אמיתי רק בנגיעה הראשונה.</div>` },
        { type: 'input', q: 'הדפים בגודל 4 KiB (4096 bytes). כמה ביטים נמוכים בכתובת וירטואלית הם ה-offset בתוך הדף?', answer: ['12'], placeholder: 'ביטים',
          explain: '4096 = 2¹², אז 12 ביטים מספיקים כדי להצביע על כל byte בתוך דף. הביטים הגבוהים שנשארו הם מספר הדף.' },
        { type: 'learn', title: 'Page tables וה-TLB', html: `
<p>התרגום יושב ב-<b>page tables</b>. ב-x86-64 הם עץ של 4 רמות (9 ביטים לכל רמה + 12 ביטים offset = כתובות של 48 ביט). כל <b>page table entry</b> (PTE) מחזיק את מספר ה-frame הפיזי ועוד flags: <b>present</b>, writable, user/kernel, no-execute, <b>dirty</b>, <b>accessed</b>.</p>
<p>הליכה מלאה בעץ עולה 4 קריאות זיכרון לכל גישה. איטי מדי. אז ה-CPU שומר תרגומים אחרונים ב-<b>TLB</b> (Translation Lookaside Buffer): cache קטנטן של כמה אלפי רשומות לכל היותר.</p>
<ul><li>TLB hit: תרגום בערך במחזור שעון אחד.</li>
<li>TLB miss: הליכה בעץ (page walk), עשרות עד מאות מחזורים.</li></ul>
<p><b>Huge pages</b> (‏2 MiB או 1 GiB) מאפשרים לרשומה אחת ב-TLB לכסות הרבה יותר זיכרון.</p>
<div class="dev">בגלל זה ב-Postgres יש <code>huge_pages = on</code>, ב-JVM יש <code>-XX:+UseLargePages</code>, ו-Kubernetes מאפשר לבקש <code>hugepages-2Mi</code> כ-resource. buffer pool של 64 GB צריך 16 מיליון רשומות עם דפים של 4 KiB, אבל רק 32,768 רשומות עם דפים של 2 MiB.</div>` },
        { type: 'input', q: 'עם דפים של 4 KiB (0x1000 bytes), מה מספר הדף של הכתובת הווירטואלית 0x3A7F? (ענה כמספר רגיל.)', answer: ['3', '0x3'], placeholder: 'מספר דף',
          explain: '0x3A7F / 0x1000 = 3, עם שארית 0xA7F. ב-hex זה קל: 3 הספרות הנמוכות (12 ביטים) הן ה-offset, וכל מה שמעליהן הוא מספר הדף.' },
        { type: 'mcq', q: 'למה huge pages מאיצים database עם buffer pool של 64 GB?',
          choices: ['הם הופכים את ה-RAM למהיר יותר פיזית', 'כל רשומה ב-TLB מכסה 2 MiB במקום 4 KiB, אז ה-TLB misses וה-page walks יורדים דרמטית', 'הם דוחסים את הדאטה', 'הם מבטלים לגמרי את הזיכרון הווירטואלי'], answer: 1,
          explain: 'אותו גודל TLB, פי 512 יותר זיכרון לכל רשומה. גישה אקראית על working set גדול מפסיקה לשלם page walk בכל כך הרבה גישות.' },
        { type: 'learn', title: 'כשהזיכרון לא מספיק: page faults, swapping ו-thrashing', html: `
<p>כשה-PTE לא present (או שהגישה לא מורשית), ה-CPU מעלה <b>page fault</b> וה-kernel לוקח פיקוד:</p>
<ul><li><b>Minor fault:</b> הדאטה כבר ב-RAM, ה-kernel רק ממפה אותו. נגיעה ראשונה בדף חדש של <code>malloc</code>, copy-on-write אחרי <code>fork()</code>, קובץ שכבר יושב ב-page cache. מיקרו-שניות.</li>
<li><b>Major fault:</b> צריך לקרוא את הדאטה מהדיסק (swap, או <code>mmap</code> של קובץ שלא ב-cache). מילישניות על דיסק.</li>
<li><b>גישה לא חוקית:</b> אין מיפוי בכלל, או כתיבה לזיכרון read-only ← <code>SIGSEGV</code>.</li></ul>
<p><b>Thrashing</b>: כשסך ה-working set של כל התהליכים גדול מה-RAM, המערכת מבלה את הזמן בהעברת דפים אל ה-swap וממנו. ה-CPU נראה פנוי (<code>iowait</code> גבוה), ‏<code>si</code>/<code>so</code> ב-<code>vmstat</code> גבוהים, והכול זוחל.</p>
<div class="dev">היסטורית Kubernetes דרש swap כבוי, אז לחץ זיכרון נגמר אחרת: כשקונטיינר עובר את ה-<code>limits.memory</code> שלו, ה-OOM killer של ה-cgroup שולח <code>SIGKILL</code> וה-Pod מציג <code>OOMKilled</code>. ה-exit code הוא 128 + מספר ה-signal.</div>` },
        { type: 'mcq', q: 'תהליך קורא קובץ גדול דרך mmap בפעם הראשונה, והדאטה לא ב-page cache. איזה סוג fault קורה?',
          choices: ['Minor page fault', 'Major page fault', 'Segmentation fault', 'רק TLB miss, בלי fault'], answer: 1,
          explain: 'הדף חוקי, אבל התוכן שלו על הדיסק, אז ה-kernel חייב לעשות I/O לפני שהגישה תושלם. זה major fault. אם הקובץ כבר היה ב-page cache, זה היה minor fault.' },
        { type: 'tf', q: 'כל page fault אומר שיש באג בתוכנית והיא עומדת לקרוס.', answer: false,
          explain: 'Page faults הם דבר רגיל וקבוע: demand paging, copy-on-write וקבצים ממופים בזיכרון כולם נשענים עליהם. רק גישה לא חוקית הופכת ל-SIGSEGV.' },
        { type: 'input', q: 'קונטיינר נהרג על ידי ה-OOM killer עם SIGKILL (signal 9). איזה exit code יראה Kubernetes?', answer: ['137'], placeholder: 'exit code',
          explain: '128 + 9 = 137. כשאתה רואה exit code 137 עם reason של OOMKilled, הקונטיינר עבר את ה-memory limit שלו. ‏143 (128 + 15) הוא SIGTERM, בדרך כלל כיבוי רגיל.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'race-conditions',
      title: 'Race conditions ו-critical sections',
      emoji: '🏁',
      steps: [
        { type: 'learn', title: 'counter++ זה שלושה צעדים, לא אחד', html: `
<p>מבחינת ה-CPU, <code>counter++</code> זה שלוש פקודות נפרדות:</p>
<pre><code>LOAD  r1, [counter]   ; read
ADD   r1, 1           ; modify
STORE [counter], r1   ; write</code></pre>
<p>שני threads, ה-counter מתחיל ב-0, שניהם מגדילים. שזירה אפשרית אחת:</p>
<table><tr><th>Thread A</th><th>Thread B</th><th>counter</th></tr>
<tr><td>LOAD → 0</td><td></td><td>0</td></tr>
<tr><td></td><td>LOAD → 0</td><td>0</td></tr>
<tr><td>ADD, STORE 1</td><td></td><td>1</td></tr>
<tr><td></td><td>ADD, STORE 1</td><td><b>1</b></td></tr></table>
<p>שתי הגדלות, ערך סופי 1. עדכון אחד פשוט <b>הלך לאיבוד</b>. זה ה-<b>lost update</b>, ה-race הכי נפוץ שיש.</p>` },
        { type: 'input', q: 'counter מתחיל ב-0. אלף threads מריצים כל אחד counter++ פעם אחת, בלי שום נעילה. מה הערך הסופי הכי קטן שאפשרי?', answer: ['1'], placeholder: 'ערך',
          explain: 'אם כל ה-threads קוראים 0 לפני שמישהו כותב, כולם כותבים 1. בפועל תראה בדרך כלל משהו בין 1 ל-1000, ומספר אחר בכל הרצה. חוסר הדטרמיניזם הזה הוא החתימה של race.' },
        { type: 'learn', title: 'מרוצים: races, critical sections ו-atomicity', html: `
<p><b>Race condition</b> הוא באג שבו התוצאה תלויה בתזמון של threads או תהליכים. <b>Critical section</b> הוא קטע הקוד שנוגע ב-state משותף ואסור שירוץ בשני מקומות במקביל.</p>
<p>פתרון נכון צריך:</p>
<ul><li><b>Mutual exclusion:</b> לכל היותר thread אחד בפנים בכל רגע.</li>
<li><b>Progress:</b> אם אף אחד לא בפנים, מי שרוצה להיכנס נכנס.</li>
<li><b>Bounded waiting:</b> אף אחד לא מחכה לנצח.</li></ul>
<p>פעולה היא <b>atomic</b> אם אף אחד לא יכול לראות אותה באמצע. ל-CPU יש פקודות אטומיות כמו <code>LOCK XADD</code> (חיבור אטומי) ו-<b>compare-and-swap</b> (CAS): "קבע את x לערך החדש רק אם x עדיין שווה לישן". ‏<code>atomic.AddInt64</code> של Go ו-<code>AtomicLong</code> של Java בנויים עליהן.</p>
<div class="callout">חלקים אטומיים לא הופכים רצף לאטומי. <code>if (!map.contains(k)) map.put(k, v)</code> הוא racy גם אם כל קריאה בנפרד thread-safe: thread אחר יכול להשתחל בין הבדיקה לפעולה.</div>` },
        { type: 'tf', q: 'Race conditions לא יכולים לקרות במכונה עם ליבה אחת, כי רק thread אחד רץ בכל רגע.', answer: false,
          explain: 'ה-scheduler יכול לעשות preemption ל-thread בין ה-LOAD ל-STORE ולהריץ thread אחר על אותה ליבה. מה שגורם ל-races זו השזירה, לא המקביליות.' },
        { type: 'input', q: 'x = 0. ‏Thread A מריץ x = x + 1 ו-thread B מריץ x = x * 2, כל אחד כ-load, חישוב, store, בלי locks. כמה ערכים סופיים שונים של x אפשריים?', answer: ['3', 'three', 'שלושה', 'שלוש'], placeholder: 'כמות',
          explain: 'A ואז B: ‏(0+1)×2 = 2. ‏B ואז A: ‏0×2+1 = 1. שניהם קוראים 0 ו-A כותב אחרון: 1. שניהם קוראים 0 ו-B כותב אחרון: 0. התוצאות האפשריות: {0, 1, 2}, כלומר 3 ערכים שונים.' },
        { type: 'mcq', q: 'באיזה קטע קוד יש race מסוג TOCTOU (time-of-check to time-of-use) כששני תהליכים מריצים אותו במקביל?',
          choices: ['open(path, O_CREAT | O_EXCL)', 'if not os.path.exists(lock): open(lock, "w")', 'atomic.AddInt64(&n, 1)', 'mkdir lockdir (נכשל אם כבר קיים)'], answer: 1,
          explain: 'שני התהליכים יכולים לראות "לא קיים" לפני שמישהו מהם יוצר את הקובץ, ושניהם בטוחים שה-lock שלהם. ‏O_EXCL ו-mkdir עושים את הבדיקה והיצירה בפעולת kernel אטומית אחת.' },
        { type: 'learn', title: 'Races בתשתיות', html: `
<p>Races הם לא רק עניין של threads. כל read-modify-write על state משותף יכול לאבד עדכונים:</p>
<ul><li><b>Terraform:</b> שני pipelines מריצים <code>apply</code> על אותו state. בגלל זה ה-backends עושים <b>state locking</b> (טבלת lock ב-DynamoDB, או lockfile ב-S3).</li>
<li><b>Kubernetes:</b> לכל אובייקט יש <code>resourceVersion</code>. עדכון שנשלח עם גרסה ישנה נדחה עם <code>409 Conflict</code>, וה-controller קורא מחדש ומנסה שוב. זה <b>optimistic concurrency</b>, CAS ברמת ה-API.</li>
<li><b>Databases:</b> תעשה את החישוב בתוך ה-database, לא באפליקציה.</li></ul>
<pre><code>-- racy: read in app, compute, write back
SELECT qty FROM stock WHERE id = 7;     -- app sees 5
UPDATE stock SET qty = 4 WHERE id = 7;

-- safe: the row is locked during the update
UPDATE stock SET qty = qty - 1 WHERE id = 7 AND qty &gt; 0;</code></pre>
<div class="dev">כדי לתפוס races בקוד: <code>go test -race</code>, ו-ThreadSanitizer (<code>-fsanitize=thread</code>) ל-C/C++. הם מוצאים races שאף פעם לא מופיעים בטסטים על הלפטופ, ואז מופיעים ב-3 בלילה ב-production.</div>` },
        { type: 'mcq', q: 'שני controllers מנסים לעדכן את אותו Deployment באותו רגע. איך ה-API server של Kubernetes מונע מאחד לדרוס בשקט את השני?',
          choices: ['הוא מחזיק mutex גלובלי על etcd', 'Optimistic concurrency: העדכון עם resourceVersion ישן נכשל עם 409 Conflict', 'הוא ממזג את שני העדכונים אוטומטית', 'הכתיבה האחרונה תמיד מנצחת ואף אחד לא מדווח'], answer: 1,
          explain: 'כל עדכון נושא את ה-resourceVersion שעליו הוא מבוסס. אם מישהו אחר כתב בינתיים, הגרסאות לא תואמות וה-API מחזיר 409. ה-client קורא מחדש ומנסה שוב. (server-side apply מוסיף על זה בעלות על שדות.)' },
        { type: 'tf', q: 'UPDATE stock SET qty = qty - 1 WHERE id = 7 בטוח מפני lost updates תחת בקשות מקבילות, ואילו קריאת qty באפליקציה וכתיבה חזרה של qty - 1 לא בטוחה.', answer: true,
          explain: 'ה-UPDATE הבודד קורא וכותב את השורה תחת row lock, אז הורדות מקבילות עומדות בתור. בגרסה של האפליקציה יש פער בין ה-SELECT ל-UPDATE, ובקשה אחרת יכולה לקרוא בו את אותו ערך ישן.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'sync-primitives',
      title: 'Mutexes, semaphores וחברים',
      emoji: '🔒',
      steps: [
        { type: 'learn', title: 'Mutex: מפתח אחד לחדר', html: `
<p><b>Mutex</b> (mutual exclusion lock) הוא מפתח לחדר. <code>lock()</code> לוקח את המפתח, או מחכה עד שהוא פנוי. <code>unlock()</code> מחזיר אותו. רק ה-thread שנעל אמור לשחרר: ל-mutex יש <b>owner</b> (בעלים).</p>
<pre><code>mu.Lock()
balance += amount     // critical section
mu.Unlock()</code></pre>
<p>כללי אצבע: תשמור על ה-critical section <b>קצר</b>, אף פעם אל תעשה קריאות רשת בזמן שאתה מחזיק lock, ותמיד תשחרר בכל מסלול (<code>defer mu.Unlock()</code> ב-Go, ‏<code>try/finally</code> או <code>with lock:</code> בשפות אחרות).</p>` },
        { type: 'mcq', q: 'Thread A מחזיק mutex (מסוג שמרדים). ‏Thread B קורא עליו ל-lock(). מה קורה ל-B?',
          choices: ['B מקבל שגיאה וממשיך', 'B נחסם: ה-kernel מרדים אותו עד שה-mutex משתחרר', 'A ו-B נכנסים שניהם ל-critical section', 'B לוקח בכוח את ה-mutex מ-A'], answer: 1,
          explain: 'B יורד מה-CPU לתור ההמתנה של ה-mutex. כש-A משחרר, B (או ממתין אחר) מתעורר. זה mutual exclusion בלי לבזבז CPU על המתנה.' },
        { type: 'learn', title: 'Semaphores: מונה עם חדר המתנה', html: `
<p><b>Semaphore</b> הוא מספר שלם עם שתי פעולות אטומיות (Dijkstra, 1965):</p>
<ul><li><code>wait()</code> ‏(P, acquire): אם הערך &gt; 0, מורידים אותו ב-1 וממשיכים. אם הוא 0, נחסמים.</li>
<li><code>signal()</code> ‏(V, release): מעלים ב-1, ומעירים ממתין אחד אם יש.</li></ul>
<p><b>Counting semaphore</b> שמתחיל ב-N אומר "יש N מקומות פנויים". <b>Binary semaphore</b> מקבל רק 0 או 1. הוא נראה כמו mutex, אבל <b>אין לו owner</b>: כל thread יכול לעשות לו signal. זה הופך אותו לטוב לאיתות ("הדאטה מוכן"), אבל חלש יותר כ-lock (אין priority inheritance, אין בדיקה של "שוחרר על ידי ה-thread הלא נכון").</p>
<div class="dev">אתה כבר מכיר את זה: <b>DB connection pool</b> עם <code>max=10</code> הוא counting semaphore של 10. בקשה מספר 11 נחסמת עד שמישהו מחזיר חיבור. ‏<code>maxUnavailable</code> ב-rolling update של Kubernetes ותקרת המקביליות של rate limiter הם אותו רעיון.</div>` },
        { type: 'input', q: 'Counting semaphore מתחיל ב-5. שבעה threads קוראים כל אחד ל-wait(), ואף אחד לא קורא ל-signal(). כמה threads חסומים?', answer: ['2', 'two', 'שניים', 'שתיים'], placeholder: 'threads',
          explain: 'חמש הקריאות הראשונות ל-wait() מורידות את הערך מ-5 ל-0 ועוברות. threads מספר 6 ו-7 מוצאים 0 ונחסמים.' },
        { type: 'tf', q: 'Binary semaphore ו-mutex זהים לגמרי מכל בחינה.', answer: false,
          explain: 'ל-mutex יש owner: רק מי שנעל רשאי לשחרר, וה-OS יכול להשתמש בזה ל-priority inheritance ולבדיקת שגיאות. ל-binary semaphore אין owner, אז כל thread יכול לעשות לו signal. אותה צורה של 0/1, משמעות אחרת.' },
        { type: 'learn', title: 'Condition variables ו-monitors', html: `
<p>Mutex מגן על דאטה. אבל איך <b>מחכים</b> עד שהדאטה יגיע למצב מסוים ("התור לא ריק") בלי להסתובב בלולאה? עם <b>condition variable</b>:</p>
<pre><code>mu.lock()
while queue.empty():
    cv.wait(mu)        # atomically: unlock mu + sleep; re-locks on wakeup
item = queue.pop()
mu.unlock()

# producer side
mu.lock(); queue.push(x); cv.signal(); mu.unlock()</code></pre>
<p>תמיד תבדוק שוב את התנאי בתוך <b><code>while</code></b>, לא <code>if</code>: יש התעוררויות סתמיות (spurious wakeups), ו-consumer אחר אולי כבר חטף את הפריט.</p>
<p><b>Monitor</b> אורז mutex וה-condition variables שלו יחד עם הדאטה שהם מגינים עליו. ‏<code>synchronized</code> עם <code>wait()</code>/<code>notify()</code> ב-Java הוא monitor. ב-Go בדרך כלל תשתמש ב-channel, שהוא בדיוק הדפוס הזה ארוז מראש.</p>` },
        { type: 'order', q: 'סדר את השלבים של consumer נכון שמחכה על condition variable',
          items: ['lock(mu)', 'while queue is empty: cv.wait(mu)', 'item = queue.pop()', 'unlock(mu)'],
          explain: 'לוקחים את ה-lock, בודקים את התנאי בלולאה (wait משחרר את ה-lock בזמן השינה ותופס אותו מחדש כשמתעוררים), עושים את העבודה כשה-lock עדיין אצלך, ואז משחררים.' },
        { type: 'learn', title: 'לסובב או לישון?', html: `
<p><b>Spinlock</b> מחכה בלולאה: <code>while (!CAS(&amp;lock, 0, 1)) {}</code>. בלי syscall ובלי context switch, אבל הוא שורף CPU כל זמן ההמתנה.</p>
<p><b>Sleeping lock</b> (mutex) מרדים את הממתין. זה עולה context switch (מיקרו-שניות) אבל משחרר את ה-CPU.</p>
<table><tr><th>spinlock מתאים כש...</th><th>sleeping lock מתאים כש...</th></tr>
<tr><td>זמן ההחזקה זעיר (ננו-שניות)</td><td>זמן ההחזקה ארוך או לא ידוע</td></tr>
<tr><td>יש כמה ליבות וה-holder רץ עכשיו</td><td>ה-holder עלול להיחסם על I/O</td></tr>
<tr><td>אסור לישון (interrupt context ב-kernel)</td><td>קוד user-space רגיל</td></tr></table>
<p>ה-mutexes ב-user-space של Linux בנויים על <b>futex</b>: נעילה ושחרור הם פקודה אטומית אחת כשאין תחרות. רק lock עם תחרות קורא ל-syscall בשם <code>futex()</code> כדי לישון. הרבה מימושים מסתובבים קצת קודם ורק אז ישנים (adaptive mutex).</p>
<div class="dev">אם <code>perf top</code> מראה <code>native_queued_spin_lock_slowpath</code> חם, ה-kernel נלחם על spinlock: הרבה פעמים הרבה ליבות שדופקות על socket אחד, קובץ אחד או cgroup אחד.</div>` },
        { type: 'mcq', q: 'מתי spinlock ב-user-space הוא הבחירה הגרועה ביותר?',
          choices: ['ה-critical section אורך כמה ננו-שניות על מכונה עם 32 ליבות', 'VM עם ליבה אחת, שבה ה-holder של ה-lock יכול לעבור preemption', 'הגדלה של counter פר-CPU', 'Lock שכמעט אף פעם אין עליו תחרות'], answer: 1,
          explain: 'על ליבה אחת, אם ה-holder עבר preemption, הממתין מסתובב כל ה-time slice שלו בזמן שה-holder בכלל לא יכול לרוץ ולשחרר. בזבוז נטו. לסובב יש טעם רק כשה-holder רץ ממש עכשיו על ליבה אחרת.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'deadlock',
      title: 'Deadlock: כולם תקועים',
      emoji: '💀',
      steps: [
        { type: 'learn', title: 'פקק תנועה בקוד', html: `
<p><b>Deadlock</b> זו קבוצה של threads שבה כל אחד מחכה למשהו שמחזיק thread אחר בקבוצה. אף אחד לא זז, לנצח. כמו ארבע מכוניות בצומת, כל אחת מחכה למכונית שמימינה.</p>
<pre><code>Thread 1: lock(A) ... lock(B)    # holds A, waits for B
Thread 2: lock(B) ... lock(A)    # holds B, waits for A</code></pre>
<p>Coffman (1971): deadlock אפשרי רק אם ארבעת התנאים מתקיימים יחד:</p>
<ol><li><b>Mutual exclusion:</b> משאב יכול להיות מוחזק רק על ידי thread אחד.</li>
<li><b>Hold and wait:</b> thread מחזיק משאב אחד בזמן שהוא מחכה לאחר.</li>
<li><b>No preemption:</b> אי אפשר לקחת משאבים בכוח. רק המחזיק משחרר.</li>
<li><b>Circular wait:</b> מעגל של "מחכה ל-": ‏T1 ← T2 ← ... ← T1.</li></ol>
<p>תשבור <b>אחד מהם</b>, ו-deadlock הופך לבלתי אפשרי.</p>` },
        { type: 'mcq', q: 'מה מהבאים הוא לא אחד מארבעת תנאי Coffman ל-deadlock?',
          choices: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait', 'Starvation'], answer: 4,
          explain: 'Starvation היא בעיה אחרת: thread מחכה בלי סוף בזמן שאחרים ממשיכים להתקדם. ב-deadlock אף אחד במעגל לא מתקדם.' },
        { type: 'learn', title: 'גרף הקצאת משאבים', html: `
<p>מציירים threads כעיגולים ומשאבים כריבועים:</p>
<ul><li><b>Request edge</b> ‏T ← R: ‏T מחכה ל-R.</li>
<li><b>Assignment edge</b> ‏R ← T: ‏R מוחזק על ידי T.</li></ul>
<p>T1 ← B ← T2 ← A ← T1 הוא מעגל, ולכן זה deadlock.</p>
<ul><li>אם לכל משאב יש <b>מופע אחד</b>, מעגל אומר deadlock. נקודה.</li>
<li>אם למשאבים יש <b>כמה מופעים</b> (נגיד 3 חיבורים ב-pool), מעגל הוא תנאי <i>הכרחי אבל לא מספיק</i>: thread מחוץ למעגל יכול לשחרר מופע ולשבור אותו.</li></ul>
<div class="dev">Databases בונים בדיוק את הגרף הזה (ה-"wait-for graph": טרנזקציה ← טרנזקציה) כדי לזהות deadlocks. ל-runtime של Go יש גרסה הרבה יותר פשוטה: אם <i>כל</i> ה-goroutines חסומים, הוא עושה panic עם <code>fatal error: all goroutines are asleep - deadlock!</code></div>` },
        { type: 'tf', q: 'בגרף הקצאת משאבים שבו לכל משאב יש בדיוק מופע אחד, מעגל אומר שיש deadlock.', answer: true,
          explain: 'עם מופע יחיד, כל המתנה במעגל יכולה להתמלא רק על ידי ה-thread הבא במעגל, והוא בעצמו מחכה. אף אחד לא יכול לשחרר לעולם.' },
        { type: 'learn', title: 'למנוע, להימנע, או לזהות', html: `
<p><b>Prevention</b> (מניעה): שוברים תנאי Coffman כבר בתכנון.</p>
<ul><li><b>Lock ordering</b> (שובר circular wait): נותנים לכל lock סדר גלובלי ותמיד נועלים לפי הסדר הזה. ה-kernel של Linux אוכף את זה עם <code>lockdep</code>.</li>
<li><b>הכול או כלום</b> (שובר hold and wait), או <b>try-lock עם timeout</b> ונסיגה (שובר no preemption).</li></ul>
<p><b>Avoidance</b> (הימנעות): <b>אלגוריתם הבנקאי</b> (banker's algorithm). כל תהליך מצהיר מראש על הצורך המקסימלי שלו. בקשה מאושרת רק אם אחריה עדיין קיים <b>safe sequence</b>: סדר שבו כל תהליך יכול לקבל את מה שחסר לו ולסיים. אלגנטי, אבל כמעט לא בשימוש במערכות הפעלה כלליות, כי אף אחד לא יודע מראש את הצורך המקסימלי שלו.</p>
<p><b>Detection and recovery</b> (זיהוי והתאוששות): נותנים לזה לקרות, מוצאים את המעגל, הורגים קורבן.</p>
<pre><code>ERROR:  deadlock detected
DETAIL: Process 4127 waits for ShareLock on transaction 9031; blocked by process 4130.
        Process 4130 waits for ShareLock on transaction 9030; blocked by process 4127.
HINT:   See server log for query details.</code></pre>
<div class="dev">Postgres בודק deadlocks אחרי <code>deadlock_timeout</code> (ברירת מחדל 1s), מבטל טרנזקציה אחת עם SQLSTATE <code>40P01</code>, והשנייה ממשיכה. האפליקציה שלך חייבת לתפוס את זה ולעשות <b>retry</b>.</div>` },
        { type: 'mcq', q: 'transfer(from, to) נועל את from ואז את to. קריאות מקבילות של transfer(A, B) ו-transfer(B, A) נתקעות לפעמים לנצח. מה התיקון הפשוט והחסין ביותר?',
          choices: ['להוסיף sleep בין שני ה-locks', 'תמיד לנעול קודם את החשבון עם ה-ID הקטן, בלי קשר לכיוון', 'להגדיל את ה-thread pool', 'לעשות retry להעברה כשהיא איטית'], answer: 1,
          explain: 'סדר נעילה גלובלי מעלים את ה-circular wait: שתי ההעברות נועלות עכשיו קודם את A, אז אחת פשוט מחכה לשנייה. אותו טריק עובד ב-SQL: לעדכן שורות בסדר עקבי (למשל ORDER BY id) כדי להימנע מ-deadlocks ב-DB.' },
        { type: 'input', q: 'אלגוריתם הבנקאי: 12 יחידות בסך הכול. ‏P1 מחזיק 5 (מקסימום 10), ‏P2 מחזיק 2 (מקסימום 4), ‏P3 מחזיק 2 (מקסימום 9). כמה יחידות פנויות כרגע?', answer: ['3', 'three', 'שלוש', 'שלושה'], placeholder: 'יחידות',
          explain: '12 − (5 + 2 + 2) = 3. הצרכים שנשארו: P1 צריך 5, ‏P2 צריך 2, ‏P3 צריך 7.' },
        { type: 'order', q: 'אותו מצב (3 פנויות; צרכים: P1=5, P2=2, P3=7). סדר את התהליכים ב-safe sequence',
          items: ['P2', 'P1', 'P3'],
          explain: 'רק P2 נכנס ב-3. הוא מסיים ומחזיר את ה-4 שלו ← 5 פנויות. עכשיו P1 (צריך 5) יכול לסיים ומחזיר 10 ← 10 פנויות. ואז P3 (צריך 7) מסיים. קיים safe sequence, אז המצב בטוח.' },
        { type: 'mcq', q: 'Postgres כותב ללוג "deadlock detected" בין שתי טרנזקציות. מה בעצם קרה?',
          choices: ['שתי הטרנזקציות בוטלו וה-database עשה restart', 'Postgres ביטל טרנזקציה אחת (הקורבן) כדי שהשנייה תמשיך; האפליקציה צריכה לעשות retry לזו שנכשלה', 'Postgres מחכה לנצח עד שאדמין יתערב', 'הדאטה עכשיו מושחת'], answer: 1,
          explain: 'זיהוי והתאוששות: Postgres מוצא את המעגל ב-wait-for graph, בוחר קורבן, מגלגל אותו אחורה עם שגיאה 40P01, והשורד ממשיך. שום דבר לא מושחת, אבל ה-client צריך לוגיקת retry.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'classic-problems',
      title: 'בעיות קלאסיות במערכות אמיתיות',
      emoji: '🍝',
      steps: [
        { type: 'learn', title: 'Producer / consumer (bounded buffer)', html: `
<p>Producers שמים פריטים ב-buffer בגודל N, ו-consumers מוציאים אותם. הפתרון הקלאסי משתמש בשלושה כלים:</p>
<pre><code>empty = Semaphore(N)   # free slots
full  = Semaphore(0)   # filled slots
mutex = Mutex()

producer:  empty.wait(); mutex.lock(); buf.put(x);    mutex.unlock(); full.signal()
consumer:  full.wait();  mutex.lock(); x = buf.take(); mutex.unlock(); empty.signal()</code></pre>
<p>Buffer מלא חוסם את ה-producers: זה <b>backpressure</b>, וזה פיצ'ר.</p>
<div class="dev">אתה משתמש בזה בכל מקום: buffered channel ב-Go (<code>make(chan Job, 100)</code>), טופיק ב-Kafka עם consumer lag, ה-<b>workqueue</b> של controller ב-Kubernetes (ה-informers מייצרים מפתחות של אובייקטים, ו-worker goroutines צורכים אותם), log shippers עם buffer בזיכרון.</div>` },
        { type: 'mcq', q: 'החלפת תור חסום בתור לא חסום "כדי שה-producers אף פעם לא ייחסמו". ה-consumers איטיים מה-producers. מה קורה?',
          choices: ['ה-throughput עולה לנצח', 'התור גדל בלי גבול עד שלתהליך נגמר הזיכרון, וה-latency גדל יחד איתו', 'ה-consumers מאיצים אוטומטית', 'שום דבר לא משתנה'], answer: 1,
          explain: 'תור לא חסום לא מעלים את העומס, הוא רק מסתיר אותו. הזיכרון וזמן ההמתנה בתור גדלים עד שמשהו חוטף OOMKilled. ‏buffer חסום הופך עומס יתר ל-backpressure שהקוראים יכולים לראות.' },
        { type: 'input', q: 'Bounded buffer בקיבולת 10 משתמש ב-semaphores בשם empty ו-full. כרגע יש בו 4 פריטים ואף אחד לא באמצע פעולה. מה הערך של empty?', answer: ['6', 'six', 'שש', 'שישה'], placeholder: 'ערך',
          explain: 'empty סופר מקומות פנויים: 10 − 4 = 6. ‏full סופר מקומות תפוסים: 4. האינווריאנטה: empty + full = קיבולת (כשאין פעולה באמצע).' },
        { type: 'learn', title: 'Readers / writers', html: `
<p>הרבה threads יכולים <b>לקרוא</b> במקביל, אבל <b>writer</b> צריך את הדאטה לעצמו. ‏<b>Read-write lock</b> (<code>sync.RWMutex</code>, ‏<code>pthread_rwlock_t</code>) עושה בדיוק את זה.</p>
<ul><li><b>העדפת readers:</b> readers חדשים מצטרפים כל עוד אחרים קוראים. זרם קבוע של readers יכול <b>להרעיב את ה-writer</b>.</li>
<li><b>העדפת writers:</b> ברגע ש-writer מחכה, readers חדשים עומדים מאחוריו בתור. ה-writers לא מורעבים, אבל ה-readers מחכים יותר.</li></ul>
<p>Databases עוקפים חלק גדול מזה עם <b>MVCC</b>: ב-Postgres ה-readers רואים snapshot ולא חוסמים writers בכלל. אבל שינויי schema עדיין צריכים locks חזקים.</p>
<div class="dev">התקלה הקלאסית ב-Postgres: <code>SELECT</code> ארוך של אנליטיקה רץ. מיגרציה מריצה <code>ALTER TABLE</code> ומחכה ל-lock מסוג <code>ACCESS EXCLUSIVE</code>. עכשיו כל <code>SELECT</code> חדש על הטבלה עומד בתור <b>מאחורי ה-ALTER שמחכה</b>, והאתר נופל. הפתרון: <code>SET lock_timeout = '3s'</code> במיגרציות, ו-retry.</div>` },
        { type: 'mcq', q: 'בתקלה הזו, למה SELECTs פשוטים וחדשים נחסמים, למרות שה-ALTER TABLE עוד לא קיבל את ה-lock שלו?',
          choices: ['SELECT תמיד צריך lock בלעדי', 'בקשות lock עומדות בתור לפי הסדר: ה-SELECTs החדשים מתנגשים עם בקשת ה-ACCESS EXCLUSIVE שמחכה, אז הם עומדים מאחוריה', 'ה-SELECT הארוך הפיל את השרת', 'MVCC כבוי בזמן מיגרציות'], answer: 1,
          explain: 'Postgres מחלק locks בהוגנות. ה-lock של ה-SELECT החדש מסתדר עם ה-SELECT שרץ, אבל לא עם ה-ALTER שמחכה לפניו בתור, אז הוא מחכה. ‏writer אחד שמחכה הופך ל-outage מלא. ‏lock_timeout גורם ל-ALTER לוותר במקום זה.' },
        { type: 'learn', title: 'הפילוסופים הסועדים', html: `
<p>חמישה פילוסופים יושבים סביב שולחן עגול, עם מזלג אחד בין כל שניים. כדי לאכול, פילוסוף צריך את <b>שני</b> המזלגות שלידו. אם כולם מרימים את המזלג השמאלי באותו רגע, כולם מחכים למזלג הימני לנצח: <b>deadlock</b> (כל ארבעת תנאי Coffman מתקיימים).</p>
<p>פתרונות, כל אחד שובר תנאי אחד:</p>
<ul><li><b>Lock ordering:</b> ממספרים את המזלגות ותמיד לוקחים קודם את המספר הנמוך. עכשיו פילוסוף אחד מושיט יד קודם ימינה, והמעגל לא יכול להיסגר.</li>
<li><b>מלצר:</b> semaphore שמרשה לכל היותר N−1 פילוסופים לשבת בבת אחת.</li>
<li><b>Try-lock:</b> אם המזלג השני תפוס, מניחים את הראשון ומנסים שוב אחר כך (תיזהר מ-livelock: כולם מנסים שוב בנימוס, ובדיוק באותו קצב).</li></ul>
<div class="dev">הגרסה מהעולם האמיתי: כל בקשה מחזיקה חיבור DB מ-pool של 10, <i>ותוך כדי</i> קוראת ל-endpoint אחר של אותו שירות שצריך חיבור שני. עם 10 בקשות מקבילות, כל 10 החיבורים מוחזקים וכל 10 הקריאות הפנימיות מחכות. ה-pool הוא המזלגות. הפתרון: אף פעם לא להחזיק משאב אחד מ-pool בזמן שמחכים למשאב נוסף מאותו pool, או להשתמש ב-pools נפרדים.</div>` },
        { type: 'input', q: 'חמישה פילוסופים סועדים. לכל היותר כמה פילוסופים יכול ה-semaphore של ה"מלצר" להרשות ליד השולחן בבת אחת, כדי להבטיח שאין deadlock?', answer: ['4', 'four', 'ארבעה', 'ארבע'], placeholder: 'מספר',
          explain: 'עם לכל היותר 4 פילוסופים שחולקים 5 מזלגות, לפי עקרון שובך היונים לפחות אחד מהם יכול להרים את שני המזלגות, לאכול ולשחרר אותם. המעגל אף פעם לא נסגר.' },
        { type: 'mcq', q: 'תחת עומס, שירות נתקע. כל thread מחזיק חיבור אחד מ-pool של 10 ומחכה לחיבור שני מאותו pool. איזה תנאי Coffman הכי קל להסיר?',
          choices: ['Mutual exclusion: לתת לשתי בקשות לחלוק חיבור אחד', 'Hold and wait: לקחת מראש את כל מה שצריך, או אף פעם לא להחזיק חיבור בזמן שמחכים לאחר', 'No preemption: לגנוב חיבורים משאילתות שרצות', 'אף אחד: להוסיף CPUs'], answer: 1,
          explain: 'תבנה את הקוד כך שבקשה לוקחת חיבור אחד בלבד (ומעבירה אותו לקריאה הפנימית), או משתמשת ב-pool נפרד לעבודה המקוננת. לחלוק חיבורים או לגנוב אותם באמצע שאילתה ישחית טרנזקציות.' },
        { type: 'order', q: 'סדר את חיי הפריט ב-workqueue של controller ב-Kubernetes (ה-producer/consumer שבלב כל controller)',
          items: ['Informer רואה שינוי ומוסיף את מפתח האובייקט לתור', 'Worker קורא ל-Get() ומקבל את המפתח', 'ה-worker עושה reconcile בין ה-desired state ל-actual state', 'ה-worker קורא ל-Done(); אם הייתה שגיאה, המפתח חוזר לתור עם backoff מוגבל-קצב'],
          explain: 'ה-informers מייצרים, ה-workers צורכים. ה-workqueue של client-go גם מוריד כפילויות: מפתח שהשתנה 50 פעמים בזמן שחיכה מעובד פעם אחת, ומפתח שבעיבוד אף פעם לא נמסר לשני workers במקביל. זה mutual exclusion לכל אובייקט, בחינם.' }
      ]
    }
  ]
});
