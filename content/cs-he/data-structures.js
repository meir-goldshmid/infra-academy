CQ.unitHe({
  id: 'data-structures',
  order: 7,
  title: 'מבני נתונים',
  emoji: '🧱',
  color: '#0ea5e9',
  tagline: 'הצורה של הדאטה קובעת כמה מהר הקוד שלך ירוץ',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'arrays',
      title: 'Arrays, זיכרון ו-Cache',
      emoji: '📦',
      steps: [
        { type: 'learn', title: 'Array זה בסך הכול שורה של קופסאות', html: `
<p>ה-RAM הוא רחוב ענק וממוספר של בתים (bytes). <b>Array</b> (מערך) תופס קטע <b>רציף</b> (contiguous) מהרחוב הזה ומסדר בו פריטים באותו גודל אחד ליד השני.</p>
<p>מכיוון שכל הפריטים באותו גודל, למצוא את פריט <code>i</code> זה חשבון נטו — בלי לחפש בכלל:</p>
<div class="formula">address(i) = base + i × size</div>
<p>בגלל זה <code>arr[i]</code> הוא <b>O(1)</b>: כפל אחד, חיבור אחד, קריאה אחת מהזיכרון. לא משנה אם יש במערך 10 פריטים או 10 מיליארד.</p>` },
        { type: 'input', q: 'מערך של ints בגודל 4 bytes מתחיל בכתובת 1000. מה הכתובת של arr[5]?', answer: ['1020'], placeholder: 'כתובת',
          explain: '1000 + 5 × 4 = 1020. אינדקס 0 גר ב-1000, אז אינדקס 5 נמצא חמש קופסאות הלאה. (וזו גם הסיבה שמערכים מתחילים מ-0: האינדקס הוא פשוטו כמשמעו ה-offset.)' },
        { type: 'learn', title: 'ה-CPU אוהב שכנים', html: `
<p>ה-CPU אף פעם לא מביא מה-RAM byte בודד. הוא מושך <b>cache line</b> שלם (בדרך כלל 64 bytes) לתוך ה-cache הקטנטן והמהיר-בטירוף שלו. קראת את <code>arr[0]</code>? קיבלת את <code>arr[1..15]</code> (ints של 4 bytes) בחינם.</p>
<p>זה נקרא <b>cache locality</b> (מקומיות). מעבר על מערך מההתחלה לסוף מהיר בצורה מגוחכת, כי הפריט הבא כמעט תמיד כבר יושב ב-cache — וה-prefetcher בחומרה אפילו מנחש מה תרצה עוד רגע.</p>
<div class="dev">אתה כבר מכיר את זה: זה כמו לעשות batching לקריאות מדיסק איטי או מ-S3 bucket. round trip אחד שמחזיר דף שלם מנצח 16 round trips קטנים. מנקודת המבט של ה-CPU, ה-RAM הוא ה"שירות המרוחק האיטי" (~100 ns לעומת ~1 ns ל-L1 cache).</div>` },
        { type: 'tf', q: 'שני אלגוריתמים עם אותו Big-O יכולים להיות שונים מאוד במהירות בפועל בגלל cache locality.', answer: true,
          explain: 'Big-O מתעלם מקבועים, ו-cache misses הם קבוע עצום (~פי 100 יותר איטי מ-cache hit). מעבר על מערך רציף מנצח לעיתים קרובות בפער גדול מעבר על linked list באותו אורך, למרות ששניהם O(n).' },
        { type: 'learn', title: 'Dynamic arrays: הטריק של המערך שגדל', html: `
<p>למערך רגיל יש גודל קבוע. אבל ה-<code>list</code> של Python, slices ב-Go, ה-<code>ArrayList</code> של Java וה-<code>vector</code> של C++ — כולם גדלים. איך?</p>
<ol><li>מקצים קצת <b>capacity</b> (קיבולת) רזרבית.</li><li>מוסיפים לתוך המקום הפנוי: O(1).</li><li>כשמתמלא, מקצים בלוק <b>גדול יותר</b> (בדרך כלל פי 1.5–2), מעתיקים הכול, ומשחררים את הישן.</li></ol>
<p>ההעתקה היא O(n), אבל היא קורית כל כך לעיתים רחוקות שהעלות ה-<b>amortized</b> (מפוזרת) לכל append היא עדיין <b>O(1)</b>.</p>
<div class="dev">זה כמו capacity planning עם headroom: לא מוסיפים node בכל פעם שהטראפיק גדל בבקשה אחת. מכפילים את ה-node pool מדי פעם, והעלות של המהלך הגדול מתפזרת על כל הגדילה שהוא סופג.</div>` },
        { type: 'mcq', q: 'למה הכפלת ה-capacity נותנת append ב-amortized O(1), ואילו הגדלה ב-1 בכל פעם לא?',
          choices: ['הכפלה צורכת פחות זיכרון', 'בהכפלה, סך עבודת ההעתקה ל-n הוספות הוא לכל היותר בערך 2n; בהגדלה ב-1 זה בערך n²/2', 'הכפלה חוסכת העתקה לגמרי', 'ה-cache של ה-CPU הופך את ההעתקות לחינמיות'], answer: 1,
          explain: 'הכפלה: מעתיקים 1 + 2 + 4 + … + n < 2n פריטים בסך הכול, כלומר ~2 העתקות ל-append בממוצע. הגדלה ב-1 מעתיקה 1 + 2 + 3 + … + n ≈ n²/2 פריטים — O(n) ל-append בממוצע.' },
        { type: 'mcq', q: 'יש לך dynamic array עם מיליון פריטים. איזו פעולה היא O(n)?',
          choices: ['קריאה של arr[500000]', 'הוספה לסוף (amortized)', 'הכנסת פריט חדש באינדקס 0', 'דריסה של arr[0]'], answer: 2,
          explain: 'הכנסה בהתחלה אומרת להזיז את כל מיליון הפריטים משבצת אחת ימינה. קריאה, דריסה, ו-append לסוף (amortized) — כולם O(1).' },
        { type: 'order', q: 'סדרו מה-latency הטיפוסי הכי מהיר להכי איטי',
          items: ['L1 cache של ה-CPU', 'זיכרון ראשי (RAM)', 'קריאה מ-NVMe SSD', 'Round trip ברשת ל-region אחר'],
          explain: 'בערך: L1 ~1 ns, RAM ~100 ns, NVMe SSD ~10–100 µs, רשת בין regions ~50–150 ms. כל שלב איטי בכמה סדרי גודל — ה-"latency numbers every programmer should know" המפורסמים.' },
        { type: 'tf', q: 'גישה ל-arr[i] במערך נהיית איטית יותר ככל שהמערך גדל, כי המחשב צריך ללכת עד מקום i.', answer: false,
          explain: 'אין שום הליכה! הכתובת מחושבת ישירות: base + i × size. זה כל כוח-העל של מערכים — random access ב-O(1).' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'linked-lists',
      title: 'Linked Lists (רשימות מקושרות)',
      emoji: '🔗',
      steps: [
        { type: 'learn', title: 'חפש את המטמון בזיכרון', html: `
<p><b>Linked list</b> (רשימה מקושרת) שומרת כל פריט ב-<b>node</b> קטן משלו, איפשהו בזיכרון. כל node מחזיק ערך ו-<b>pointer</b> (מצביע) ל-node הבא.</p>
<svg viewBox="0 0 300 60" width="100%" style="max-width:320px" fill="none" stroke="currentColor">
<rect x="5" y="15" width="50" height="30" rx="5"/><text x="22" y="35" fill="currentColor" stroke="none" font-size="13">7</text>
<rect x="85" y="15" width="50" height="30" rx="5"/><text x="102" y="35" fill="currentColor" stroke="none" font-size="13">3</text>
<rect x="165" y="15" width="50" height="30" rx="5"/><text x="180" y="35" fill="currentColor" stroke="none" font-size="13">42</text>
<line x1="55" y1="30" x2="83" y2="30" stroke="var(--accent)" stroke-width="2"/><line x1="135" y1="30" x2="163" y2="30" stroke="var(--accent)" stroke-width="2"/><line x1="215" y1="30" x2="243" y2="30" stroke="var(--accent)" stroke-width="2"/>
<text x="248" y="35" fill="currentColor" stroke="none" font-size="12">null</text></svg>
<p>כדי למצוא את פריט מס׳ 500 צריך לעקוב אחרי 500 pointers, אחד אחרי השני. כמו חפש את המטמון, שבו כל רמז אומר לך איפה הרמז הבא.</p>` },
        { type: 'mcq', q: 'ב-singly linked list עם n nodes, מה העלות של קריאת הפריט ה-i?',
          choices: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2,
          explain: 'צריך להתחיל מה-head ולעקוב אחרי pointers i פעמים. במקרה הגרוע זה n קפיצות: O(n). אין קיצור דרך חשבוני כמו במערכים.' },
        { type: 'learn', title: 'אז למה שמישהו ישתמש בזה?', html: `
<p>כי <b>הכנסה או מחיקה</b> זולות ברגע שאתה כבר עומד במקום הנכון: פשוט מחווטים מחדש pointer או שניים. בלי להזיז מיליוני פריטים.</p>
<pre><code>// insert X after node A
X.next = A.next
A.next = X      // O(1), done</code></pre>
<p>הכנסה ב-<b>head</b> היא תמיד O(1). <b>Doubly</b> linked list מוסיפה pointer מסוג <code>prev</code>, כך שאפשר גם למחוק node ב-O(1) כשיש לך reference אליו.</p>
<div class="dev">אתה כבר מכיר את זה: ה-Linux kernel מלא ב-doubly linked lists מסוג intrusive (<code>struct list_head</code>) — רשימות תהליכים, wait queues ועוד. ו-<b>LRU cache</b> (תחשוב על eviction ב-Redis, או על ה-CDN שלך) הוא באופן קלאסי hash map + doubly linked list: מזיזים hit לקדימה ב-O(1), ומפנים מהזנב ב-O(1).</div>` },
        { type: 'tf', q: 'הכנסת node חדש ב-head של singly linked list היא O(1), לא משנה כמה הרשימה ארוכה.', answer: true,
          explain: 'ה-node החדש מצביע על ה-head הישן, וה-head מצביע עכשיו על ה-node החדש. שתי כתיבות של pointer, בלי קשר לאורך.' },
        { type: 'learn', title: 'המחיר הנסתר: pointer chasing', html: `
<p>ה-nodes של linked list מפוזרים ברחבי הזיכרון. כל קפיצה היא <b>cache miss</b> פוטנציאלי (~100 ns), בזמן שמעבר על מערך פוגע ב-cache רוב הזמן (~1 ns).</p>
<p>ובנוסף, כל node סוחב overhead של pointer: במערכות 64-bit זה 8 bytes לכל pointer — לעיתים קרובות יותר מהערך עצמו!</p>
<div class="callout">בפועל: ברירת המחדל היא dynamic array. תשלוף linked list כשאתה צריך splicing ב-O(1) באמצע, כשה-node כבר ביד, או כתובות node יציבות.</div>
<div class="fun">🤓 עובדה משעשעת: Bjarne Stroustrup (היוצר של C++) הראה במפורסם שבעומסים של "הכנס במיקום ממוין אקראי", <code>vector</code> מנצח את <code>list</code> למרות שה-list עושה "פחות עבודה" — כי מציאת המקום היא מה שקובע, ומערכים מוחקים את ה-pointer chasing.</div>` },
        { type: 'mcq', q: 'צריך LRU cache: חיפוש לפי key ב-O(1) וגם "הזז את הרשומה הזו ל-most-recently-used" ב-O(1). מה התכנון הקלאסי?',
          choices: ['מערך ממוין', 'Hash map שמצביע לתוך doubly linked list', 'Singly linked list אחת ויחידה', 'רק binary search tree'], answer: 1,
          explain: 'ה-hash map מוצא את ה-node ב-O(1); ה-doubly linked list מאפשרת לנתק אותו ולהזיז לקדימה ב-O(1), ולפנות מהזנב ב-O(1). זה ה-LRU של ספרי הלימוד (והאהוב על מראיינים).' },
        { type: 'order', q: 'סדרו את השלבים להכנסת node חדש X מיד אחרי node A ב-singly linked list',
          items: ['ליצור node X עם הערך שלו', 'לקבוע X.next = A.next', 'לקבוע A.next = X'],
          explain: 'הסדר קובע! אם תקבע קודם A.next = X, איבדת את ה-pointer היחיד לשאר הרשימה — הבאג הקלאסי של "הרגע הדלפתי חצי רשימה".' },
        { type: 'mcq', q: 'איזה עומס עבודה הכי פחות מתאים ל-linked list?',
          choices: ['Job queue שמוסיפים בזנב ומוציאים מה-head', 'גישה אקראית לפי אינדקס, כמו ב-binary search', 'שתילת רשימה אחת באמצע של אחרת', 'היסטוריית undo שעושים בה push ו-pop בקצה אחד'], answer: 1,
          explain: 'Binary search צריך לקפוץ ישר לאמצע — O(1) במערך, O(n) ב-linked list. שאר העומסים נוגעים רק בקצוות או ב-node שכבר מחזיקים ביד.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'stacks-queues',
      title: 'Stacks ו-Queues',
      emoji: '🥞',
      steps: [
        { type: 'learn', title: 'שני חוקים לעמידה בתור', html: `
<p>שניהם בסך הכול רשימות עם <b>חוק</b> לגבי איזה קצה משתמשים בו:</p>
<ul><li><b>Stack</b> (מחסנית) — LIFO, Last In First Out. כמו ערימת פנקייקים: push למעלה, pop מלמעלה.</li>
<li><b>Queue</b> (תור) — FIFO, First In First Out. כמו התור בבית הקפה: נכנסים מאחורה, יוצאים מקדימה.</li></ul>
<p>כל הפעולות העיקריות (push, pop, enqueue, dequeue, peek) הן <b>O(1)</b>.</p>
<div class="dev">אתה כבר מכיר את זה: message queue (SQS, RabbitMQ, partition ב-Kafka) הוא FIFO. היסטוריית ה-undo של <code>Ctrl+Z</code> ו-<code>pushd</code>/<code>popd</code> בטרמינל הם stacks.</div>` },
        { type: 'mcq', q: 'Push 1, push 2, push 3, ואז pop. מה יוצא מ-STACK?',
          choices: ['1', '2', '3'], answer: 2,
          explain: 'Last In, First Out — 3 היה האחרון שנכנס, אז הוא יוצא ראשון.' },
        { type: 'input', q: 'Enqueue ל-A, B, C, ואז dequeue פעמיים מ-QUEUE. איזו אות יצאה בפעם השנייה?', answer: ['B', 'b', 'בי'], placeholder: 'אות',
          explain: 'First In, First Out: A יוצא ראשון, אחריו B. C עוד מחכה בתור.' },
        { type: 'learn', title: 'ה-call stack', html: `
<p>בכל פעם שפונקציה נקראת, ה-runtime דוחף <b>stack frame</b> (משתנים מקומיים + כתובת חזרה). כשהיא חוזרת, ה-frame נשלף. זה ה-stack ב-"stack trace".</p>
<pre><code>main()
 └ handleRequest()
    └ parseJson()
       └ parseValue()   ← top of stack</code></pre>
<p>רקורסיה עמוקה מדי ונגמר לך המקום ב-stack: <b>stack overflow</b>. ה-stacks של threads קטנים כברירת מחדל (לרוב 1–8 MB), ולכן רקורסיה שיצאה משליטה קורסת מהר.</p>
<div class="dev">stack trace בשגיאה ב-Sentry/Datadog הוא ממש dump של ה-call stack, ה-frame העליון ראשון — הפונקציה שנקראה אחרונה היא איפה שזה התפוצץ.</div>` },
        { type: 'tf', q: 'ה-frame בראש ה-call stack שייך לפונקציה שרצה כרגע.', answer: true,
          explain: 'הקריאה האחרונה תמיד למעלה; כשהיא חוזרת, ה-frame שלה נשלף וה-caller ממשיך. (קוריוז: Python מדפיסה tracebacks עם "most recent call last", כלומר הפוך — ואפילו מנומסת מספיק להגיד לך.)' },
        { type: 'learn', title: 'Queues מניעים BFS, stacks מניעים DFS', html: `
<p>סורקים גרף (רשת, עץ תלויות, הלינקים של אתר)?</p>
<ul><li>משתמשים ב-<b>queue</b> → <b>Breadth-First Search</b>: מבקרים בכל השכנים במרחק 1, אחר כך מרחק 2… מוצא מסלולים קצרים ביותר בגרפים לא ממושקלים.</li>
<li>משתמשים ב-<b>stack</b> → <b>Depth-First Search</b>: צוללים במסלול אחד עד הסוף, ואז חוזרים אחורה (backtrack).</li></ul>
<p>אותה לולאה, container אחר. נסו בעצמכם:</p>` },
        { type: 'widget', widget: 'graph', title: 'BFS מול DFS', html: '<p>עברו צעד-צעד ב-BFS (queue) וב-DFS (stack). שימו לב איך ה-container קובע את סדר הביקור.</p>' },
        { type: 'mcq', q: 'רוצים למצוא את מספר ה-hops המינימלי ברשת בין שני hosts (כל הלינקים שווים). איזה סריקה?',
          choices: ['DFS עם stack', 'BFS עם queue', 'שניהם נותנים את המסלול הקצר ביותר', 'אף אחד מהם לא יכול'], answer: 1,
          explain: 'BFS סורק בטבעות של מרחק הולך וגדל, אז הפעם הראשונה שהוא מגיע ליעד היא דרך מסלול קצר ביותר (במספר hops). DFS עלול לשוטט קודם במסלול ארוך.' },
        { type: 'mcq', q: 'איזה כלי בודק שסוגריים כמו ( [ { } ] ) מאוזנים במעבר אחד?',
          choices: ['Queue', 'Stack', 'Hash table', 'Heap'], answer: 1,
          explain: 'דוחפים כל סוגר פותח; על כל סוגר סוגר, שולפים ובודקים שהם מתאימים. הסוגר שנפתח אחרון חייב להיסגר ראשון — LIFO. כל linter וכל JSON parser עושים גרסה של זה.' },
        { type: 'tf', q: 'אפשר לממש queue ביעילות עם circular buffer (מערך שבו ה-head וה-tail מתגלגלים חזרה להתחלה).', answer: true,
          explain: 'Ring buffer נותן enqueue/dequeue ב-O(1) עם cache locality מעולה. ה-Linux kernel, ה-RX/TX rings של כרטיסי רשת, ו-log buffers — כולם משתמשים בזה.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'hash-tables',
      title: 'Hash Tables (טבלאות גיבוב)',
      emoji: '#️⃣',
      steps: [
        { type: 'learn', title: 'מבנה הנתונים הכי שימושי אי-פעם', html: `
<p><b>Hash table</b> (טבלת גיבוב: dict, map, object, HashMap) נותנת חיפוש key → value ב-<b>O(1) בממוצע</b>. הטריק:</p>
<ol><li>מריצים את ה-key דרך <b>hash function</b> → מספר גדול.</li>
<li>לוקחים אותו <code>mod</code> מספר ה-buckets → אינדקס של bucket.</li>
<li>שומרים/מוצאים את הערך ב-bucket הזה — שיושב בתוך מערך, אז הקפיצה אליו היא O(1).</li></ol>
<div class="formula">bucket = hash(key) mod m</div>
<div class="dev">אתה כבר מכיר את זה: Redis הוא בעצם hash table ענקי מעל הרשת. כך גם ה-cache של ה-service discovery שלך, בלוק <code>map</code> ב-nginx, וכל JSON object שאי-פעם עשית לו parse.</div>` },
        { type: 'widget', widget: 'hash', title: 'תעשו hash לכמה keys', html: '<p>הקלידו keys כמו <code>alice</code>, <code>bob</code>, <code>pod-7</code>… וראו לאיזה bucket הם נוחתים. תמשיכו עד ששני keys מתנגשים!</p>' },
        { type: 'learn', title: 'התנגשויות הן בלתי נמנעות', html: `
<p>אינסוף keys אפשריים, מספר סופי של buckets — שני keys <i>ינחתו</i> באותו bucket. זו <b>collision</b> (התנגשות). שני פתרונות קלאסיים:</p>
<ul><li><b>Chaining</b>: כל bucket מחזיק רשימה קטנה של רשומות (מה שה-widget עושה). ה-HashMap של Java עובד ככה (והופך שרשראות ארוכות לעצים).</li>
<li><b>Open addressing</b>: אם ה-bucket תפוס, בודקים (probe) את המקום הפנוי הבא. ה-dict של Python וה-maps החדשים של Go עובדים ככה.</li></ul>
<p>בכל מקרה, אם הכול מתנגש לתוך bucket אחד, חיפוש מתדרדר לסריקה של רשימה: <b>O(n) במקרה הגרוע</b>.</p>
<div class="fun">🤓 עובדה משעשעת: ב-2011, מתקפות "hash flooding" שלחו לשרתי web גופי POST עם אלפי keys שנבנו בכוונה כדי להתנגש, והפכו כל בקשה לעבודה של O(n²). בגלל זה Python, Ruby, Perl וחבריהן מגרילות היום hash seed לכל תהליך.</div>` },
        { type: 'mcq', q: 'מה עלות החיפוש הממוצעת והגרועה ביותר ב-hash table?',
          choices: ['O(1) בממוצע, O(1) במקרה הגרוע', 'O(1) בממוצע, O(n) במקרה הגרוע', 'O(log n) בממוצע, O(n) במקרה הגרוע', 'O(n) בממוצע, O(n) במקרה הגרוע'], answer: 1,
          explain: 'עם hash function טובה ו-resizing, ה-buckets נשארים קטנטנים → O(1) בממוצע. אם הכול מתנגש (hash גרוע או תוקף), סורקים שרשרת ארוכה אחת → O(n).' },
        { type: 'learn', title: 'Load factor ו-resizing', html: `
<p>ה-<b>load factor</b> הוא כמה הטבלה מלאה:</p>
<div class="formula">α = n / m  (entries / buckets)</div>
<p>ככל ש-α גדל, ההתנגשויות גדלות. אז טבלאות עושות <b>resize</b> אחרי סף מסוים — ה-HashMap של Java ב-0.75, ה-dict של Python בסביבות 2/3 — בדרך כלל מכפילות את מספר ה-buckets ועושות <b>rehash</b> לכל key לבית החדש שלו. כמו ב-dynamic arrays: צעד O(n) מדי פעם, amortized O(1).</p>
<div class="dev">Redis עושה את זה <i>בהדרגה</i> (incrementally): הוא מחזיק שתי טבלאות במהלך resize ומעביר כמה buckets בכל פעולה, כך ש-rehash ענק אף פעם לא גורם ל-latency spike. תכנון ש-SRE-ים אוהבים.</div>` },
        { type: 'input', q: 'ל-hash table יש 16 buckets ו-12 רשומות. מה ה-load factor שלו? (מספר עשרוני)', answer: ['0.75', '.75', '3/4'], placeholder: 'למשל 0.5',
          explain: '12 / 16 = 0.75 — בדיוק הנקודה שבה ה-HashMap של Java היה מכפיל ל-32 buckets.' },
        { type: 'learn', title: 'Consistent hashing (טעימה)', html: `
<p>חלוקת keys בין שרתים עם <code>hash(key) mod N</code> עובדת… עד ש-N משתנה. עוברים מ-4 ל-5 שרתי cache ובערך <b>80%</b> מה-keys פתאום ממופים לשרת אחר. Cache stampede! 🔥</p>
<p><b>Consistent hashing</b> שם שרתים ו-keys על טבעת; כל key הולך לשרת הבא עם כיוון השעון. הוספת שרת גונבת keys רק מהשכן שלו — בערך <b>1/N</b> מה-keys זזים.</p>
<div class="dev">כבר נתקלת בזה: <code>hash $request_uri consistent;</code> ב-nginx, ה-ring hash של Envoy / load balancers מסוג Maglev, ספריות client של memcached (ketama), וה-partitioning של Cassandra ו-DynamoDB.</div>` },
        { type: 'tf', q: 'עם sharding פשוט של "hash(key) mod N", הוספת שרת אחד בדרך כלל ממפה מחדש את רוב ה-keys.', answer: true,
          explain: 'key נשאר במקום רק אם hash mod N שווה ל-hash mod (N+1), וזה נכון רק לבערך 1/(N+1) מה-keys. במעבר מ-4 ל-5 שרתים, ~80% זזים. Consistent hashing פותר את זה.' },
        { type: 'mcq', q: 'באיזו משימה hash table גרוע?',
          choices: ['לבדוק אם user ID כבר נראה', 'לספור בקשות לכל כתובת IP', 'לרשום את כל ה-keys בין "user_100" ל-"user_200" בסדר ממוין', 'לעשות cache לתוצאות מחושבות לפי input'], answer: 2,
          explain: 'Hashing מפזר keys בכוונה, אז אין שום סדר לנצל — range query אומר לסרוק הכול. מבנים מסודרים (BSTs, B-trees, מערכים ממוינים) בנויים בשביל טווחים.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'trees-bst',
      title: 'עצים ו-Binary Search Trees',
      emoji: '🌳',
      steps: [
        { type: 'learn', title: 'עצים: היררכיה, הפוכה', html: `
<p><b>Tree</b> (עץ) הוא nodes שמחוברים הורה → ילדים, עם <b>root</b> (שורש) אחד למעלה ובלי מעגלים. nodes בלי ילדים הם <b>leaves</b> (עלים). ה-<b>height</b> (גובה) הוא המסלול הארוך ביותר מהשורש לעלה.</p>
<div class="dev">אתה חי בתוך עצים: ה-filesystem (<code>/</code> הוא השורש), ה-DOM, מסמכי JSON, DNS (<code>.</code> → <code>com</code> → <code>example</code>), ownerReferences ב-Kubernetes (Deployment → ReplicaSet → Pod), והמבנה הארגוני שלך.</div>
<p><b>Binary tree</b> (עץ בינארי) הוא עץ שבו לכל node יש לכל היותר 2 ילדים: שמאלי וימני.</p>` },
        { type: 'learn', title: 'Binary Search Tree: ממוין לפי הצורה', html: `
<p><b>BST</b> שומר על חוק אחד ב-<i>כל</i> node: כל מה שבתת-העץ השמאלי קטן יותר, כל מה שבתת-העץ הימני גדול יותר.</p>
<svg viewBox="0 0 240 130" width="100%" style="max-width:280px" fill="none" stroke="currentColor">
<line x1="120" y1="22" x2="65" y2="62"/><line x1="120" y1="22" x2="175" y2="62"/><line x1="65" y1="62" x2="35" y2="105"/><line x1="65" y1="62" x2="95" y2="105"/><line x1="175" y1="62" x2="205" y2="105"/>
<circle cx="120" cy="22" r="15" fill="var(--accent)" fill-opacity="0.2"/><circle cx="65" cy="62" r="15"/><circle cx="175" cy="62" r="15"/><circle cx="35" cy="105" r="15"/><circle cx="95" cy="105" r="15"/><circle cx="205" cy="105" r="15"/>
<g fill="currentColor" stroke="none" font-size="12" text-anchor="middle"><text x="120" y="26">50</text><text x="65" y="66">30</text><text x="175" y="66">70</text><text x="35" y="109">20</text><text x="95" y="109">40</text><text x="205" y="109">80</text></g></svg>
<p>מחפשים את 40: 40 &lt; 50 → שמאלה; 40 &gt; 30 → ימינה; נמצא! כל השוואה זורקת תת-עץ שלם — binary search, אפוי לתוך מבנה נתונים.</p>` },
        { type: 'mcq', q: 'בעץ שלמעלה, מכניסים את 45. לאן הוא הולך?',
          choices: ['ילד שמאלי של 40', 'ילד ימני של 40', 'ילד ימני של 30, במקום 40', 'ילד שמאלי של 70'], answer: 1,
          explain: '45 < 50 → שמאלה ל-30. 45 > 30 → ימינה ל-40. 45 > 40 → מימין ל-40, שם ריק, אז הוא נוחת שם.' },
        { type: 'learn', title: 'In-order traversal = פלט ממוין', html: `
<p>מבקרים ב-<b>תת-העץ השמאלי, אחר כך ב-node, אחר כך בתת-העץ הימני</b>, רקורסיבית. על BST זה פולט את ה-keys בסדר ממוין — בחינם.</p>
<pre><code>def in_order(node):
    if node is None: return
    in_order(node.left)
    print(node.key)
    in_order(node.right)</code></pre>
<p>בגלל זה ordered maps (ה-<code>TreeMap</code> של Java, <code>std::map</code> של C++) יכולים לענות ביעילות על range queries כמו "כל ה-keys מ-30 עד 60", מה ש-hash table לא יכול.</p>` },
        { type: 'order', q: 'מה ה-in-order traversal של העץ שלמעלה (50 בשורש, 30 ו-70, ואז 20, 40, 80)?',
          items: ['20', '30', '40', '50', '70', '80'],
          explain: 'תת-העץ השמאלי של 50 נותן 20, 30, 40; אחר כך 50; ואז תת-העץ הימני נותן 70, 80. ממוין, כמו שהבטחנו.' },
        { type: 'learn', title: 'מאוזן מול מנוון', html: `
<p>עלות חיפוש = גובה העץ. לעץ <b>מאוזן</b> יפה עם n nodes יש גובה ≈ log₂ n. מיליון keys? בערך 20 רמות. 🚀</p>
<p>אבל תכניסו keys <b>שכבר ממוינים</b> (1, 2, 3, 4…) ל-BST נאיבי: כל אחד הולך מימין לקודם. מקבלים "עץ" שהוא בעצם linked list — גובה n, חיפוש O(n). 🐌</p>
<p>עצים <b>מאזנים את עצמם</b> (self-balancing: AVL, red-black) עושים רוטציות קטנות בהכנסה/מחיקה כדי להבטיח גובה O(log n).</p>
<div class="dev">ה-CFS scheduler של Linux החזיק את התהליכים המוכנים לריצה ב-red-black tree, ממוין לפי virtual runtime; ה-node הכי שמאלי הוא המשימה הבאה שתרוץ. IDs מסוג auto-increment הם בדיוק סוג ה-input הממוין שהיה הורס BST נאיבי.</div>` },
        { type: 'tf', q: 'הכנסת ה-keys 1, 2, 3, …, n לפי הסדר ל-BST רגיל (שלא מאזן את עצמו) יוצרת עץ בגובה של בערך log₂ n.', answer: false,
          explain: 'כל key חדש גדול מכל מה שהיה עד עכשיו, אז הוא תמיד הולך ימינה. התוצאה היא שרשרת ישרה בגובה n — linked list בתחפושת של עץ.' },
        { type: 'input', q: 'בערך כמה רמות עומק יש ל-BST מאוזן שמחזיק ~1,000,000 keys? (למספר שלם הקרוב)', answer: ['20', 'twenty', 'עשרים'], placeholder: 'רמות',
          explain: '2²⁰ = 1,048,576 ≈ מיליון, אז log₂(1,000,000) ≈ 20. חיפוש צריך רק ~20 השוואות.' },
        { type: 'mcq', q: 'למה להשתמש ב-BST מאוזן במקום ב-hash table?',
          choices: ['יש לו חיפוש ממוצע מהיר יותר', 'הוא שומר את ה-keys מסודרים, ומאפשר range queries, min/max ו-"ה-key הבא אחרי X"', 'הוא לא משתמש ב-pointers', 'הוא אף פעם לא צריך השוואות'], answer: 1,
          explain: 'Hash tables מנצחים בחיפוש ממוצע גולמי (O(1) מול O(log n)), אבל עצים שומרים על סדר. צריך מעבר ממוין או טווחים? עצים.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'heaps',
      title: 'Heaps ו-Priority Queues',
      emoji: '⛰️',
      steps: [
        { type: 'learn', title: 'תמיד לדעת מי הכי חשוב', html: `
<p><b>Priority queue</b> (תור עדיפויות) הוא תור שבו מי שיוצא הבא הוא בעל העדיפות הגבוהה (או הנמוכה) ביותר — לא הוותיק ביותר.</p>
<p>המימוש הקלאסי הוא <b>binary heap</b>: עץ בינארי שבו כל הורה ≤ הילדים שלו (<b>min-heap</b>). אז הפריט הקטן ביותר תמיד בשורש.</p>
<ul><li>Peek למינימום: <b>O(1)</b></li><li>Insert: <b>O(log n)</b></li><li>Pop למינימום: <b>O(log n)</b></li></ul>
<div class="dev">אתה כבר מכיר את זה: kube-scheduler מחזיק pods שממתינים ב-priority queue (PriorityClass גבוה יותר קודם). ה-runtime של Go ו-libuv (מתחת ל-Node.js) מחזיקים timers ממתינים ב-heaps כדי לדעת איזה timeout יקפוץ הבא.</div>` },
        { type: 'tf', q: 'ב-min-heap, הפריטים ממוינים לגמרי משמאל לימין.', answer: false,
          explain: 'רק החוק הורה ≤ ילד מתקיים. אחים ובני דודים יכולים להיות בכל סדר. ההבטחה החלשה הזו היא בדיוק מה שהופך heaps לזולים יותר לתחזוקה ממבנה ממוין לגמרי.' },
        { type: 'learn', title: 'עץ שמתחבא בתוך מערך', html: `
<p>Heaps הם תמיד עצים <b>שלמים</b> (complete: מתמלאים רמה אחרי רמה, משמאל לימין), אז הם נדחסים בצורה מושלמת לתוך מערך — בלי צורך ב-pointers! לאינדקס <code>i</code> שמתחיל מ-0:</p>
<pre><code>parent(i) = (i - 1) // 2
left(i)   = 2*i + 1
right(i)  = 2*i + 2</code></pre>
<p><b>Insert</b>: שמים את הפריט בסוף, ואז <b>sift up</b> (מחליפים עם ההורה כל עוד קטן ממנו).<br><b>Pop</b>: לוקחים את השורש, מעבירים את הפריט האחרון לשורש, ואז <b>sift down</b> (מחליפים עם הילד הקטן כל עוד גדול ממנו). כל אחד הולך במסלול אחד משורש לעלה: O(log n).</p>` },
        { type: 'input', q: 'ב-heap שמאוחסן במערך עם אינדקסים מ-0, מה האינדקס של ההורה של ה-node באינדקס 9?', answer: ['4', 'four', 'ארבע'], placeholder: 'אינדקס',
          explain: '(9 − 1) // 2 = 8 // 2 = 4. בדיקה: left(4) = 9. ✔' },
        { type: 'mcq', q: 'מערך min-heap: [2, 5, 3, 9, 7]. עושים pop למינימום. מה השורש אחרי זה?',
          choices: ['5', '3', '7', '9'], answer: 1,
          explain: 'מוציאים את 2, מעבירים את הפריט האחרון (7) לשורש: [7, 5, 3, 9]. Sift down: הילד הקטן של 7 הוא 3, מחליפים → [3, 5, 7, 9]. השורש הוא 3 — הבא בתור הכי קטן, כמו שצריך.' },
        { type: 'learn', title: 'Top-k: הטריק האהוב על SRE-ים', html: `
<p>"תראה לי את 10 ה-endpoints הכי איטיים מתוך 50 מיליון שורות לוג." למיין הכול זה O(n log n) ודורש את כל הדאטה בזיכרון.</p>
<p>במקום זה מחזיקים <b>min-heap בגודל k</b>. לכל פריט: אם הוא מנצח את השורש של ה-heap (הקטן ביותר ב-top-k הנוכחי), עושים pop לשורש ו-push לפריט החדש.</p>
<div class="formula">O(n log k) time, O(k) memory</div>
<p>עם k = 10, ה-log k זעיר — בעצם מעבר streaming יחיד. עובד גם על stream שאף פעם לא תוכל להחזיק בזיכרון.</p>
<div class="dev">ככה אפשר לחשב בצורת streaming את ה-"top talkers" בניטור רשת ואת ה-"top N queries" בדשבורדים בסגנון pg_stat_statements.</div>` },
        { type: 'mcq', q: 'כדי למצוא את k הפריטים הגדולים ביותר ב-stream, איזה heap מחזיקים?',
          choices: ['Max-heap של כל הפריטים', 'Min-heap בגודל k', 'Max-heap בגודל k', 'בלי heap — ממיינים את ה-stream'], answer: 1,
          explain: 'השורש של ה-min-heap הוא הקטן ביותר ב-top-k הנוכחי — ה"סלקטור" בכניסה. כל מי שגדול ממנו מעיף אותו. max-heap בגודל k היה מציב את הפריט הלא נכון בדלת.' },
        { type: 'tf', q: 'אפשר לבנות heap מ-n פריטים לא ממוינים ב-O(n), מהר יותר מ-n הכנסות נפרדות.', answer: true,
          explain: '"heapify" מלמטה למעלה עושה sift down מההורה האחרון ועד השורש. רוב ה-nodes נמצאים קרוב לתחתית וכמעט לא זזים, אז סך העבודה מסתכם ב-O(n), לא O(n log n).' },
        { type: 'order', q: 'סדרו לפי סיבוכיות זמן על binary heap עם n פריטים, מהזול ליקר',
          items: ['Peek למינימום', 'הכנסת פריט אחד', 'בניית heap מ-n פריטים', 'מיון כל הפריטים ע״י pop חוזר'],
          explain: 'Peek O(1) < insert O(log n) < build O(n) < לשלוף-הכול O(n log n). (האחרון הזה הוא heap sort — מגיע ביחידה הבאה!)' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'tries-btrees',
      title: 'Tries, B-trees ו-Bloom Filters',
      emoji: '🗄️',
      steps: [
        { type: 'learn', title: 'Tries: עצים של prefixes', html: `
<p><b>Trie</b> (מהמילה re<i>trie</i>val) שומר מחרוזות תו אחרי תו. כל קשת היא אות; מילים עם prefix (תחילית) משותף חולקות מסלול.</p>
<p>עלות חיפוש היא <b>O(L)</b>, כש-L הוא אורך ה-key — בלי קשר לכמה keys שמורים! ו"כל מה שמתחיל ב-<code>kube</code>" הוא פשוט תת-עץ אחד.</p>
<div class="dev">אתה כבר מכיר את זה: HTTP routers כמו httprouter/Gin ב-Go משתמשים ב-radix trees (tries דחוסים) בשביל <code>/api/v1/pods/:name</code>. טבלת הניתוב של IPv4 ב-Linux (fib_trie) היא trie שעושה longest-prefix match על בלוקי CIDR. Tab-completion ב-shell הוא שאילתה על trie.</div>` },
        { type: 'mcq', q: 'Router צריך למצוא את נתיב ה-CIDR הכי ספציפי עבור 10.1.2.3 מבין 10.0.0.0/8, 10.1.0.0/16 ו-10.1.2.0/24. איזה מבנה בנוי בדיוק בשביל זה?',
          choices: ['Hash table על ה-IP המלא', 'Trie על הביטים של הכתובת (longest-prefix match)', 'Min-heap של אורכי prefix', 'FIFO queue'], answer: 1,
          explain: 'הולכים ב-trie ביט אחרי ביט; הנתיב התואם העמוק ביותר שראינו הוא ה-prefix הארוך ביותר — כאן 10.1.2.0/24. hash table על IPs מדויקים לא יכול לענות על "ה-prefix הכי ספציפי".' },
        { type: 'learn', title: 'B-trees: עצים שנבנו בשביל דיסקים', html: `
<p>לעץ בינארי עם מיליארד keys יש ~30 רמות. אם כל רמה היא <b>קריאה מהדיסק</b> אקראית, זה 30 I/Os איטיים לכל חיפוש. אאוץ׳.</p>
<p><b>B-tree</b> הופך כל node ל-<b>disk page</b> שלם (ב-Postgres: 8 KB) שמחזיק <b>מאות</b> keys ממוינים ו-pointers לילדים. Fanout ענק → גובה זעיר:</p>
<div class="formula">height ≈ log₂₀₀(10⁹) ≈ 4</div>
<p>ובנוסף הרמות העליונות תמיד חמות ב-RAM, אז חיפוש בטבלה של מיליארד שורות הוא לרוב רק 1–2 קריאות דיסק אמיתיות. ה-keys נשארים ממוינים, אז range scans (<code>WHERE created_at BETWEEN …</code>) הולכים על עלים שכנים.</p>
<div class="dev">בגלל זה <code>CREATE INDEX</code> ב-Postgres נותן לך B-tree כברירת מחדל, ו-MySQL InnoDB שומר טבלאות שלמות כ-B+trees. האינדקס שלך הוא ממש מבנה הנתונים הזה.</div>` },
        { type: 'tf', q: 'B-trees משתמשים ב-fanout גבוה (הרבה keys לכל node) בעיקר כדי למזער את מספר קריאות הדיסק/page האיטיות לכל חיפוש.', answer: true,
          explain: 'קריאת page אחד של 8 KB עולה בערך כמו קריאה של 8 bytes, אז דוחסים כמה שיותר קבלת החלטות לכל page. פחות רמות = פחות I/Os.' },
        { type: 'learn', title: 'LSM trees (טעימה)', html: `
<p>B-trees מעדכנים pages <b>במקום</b> (in place) — כתיבות אקראיות. לעומסים כבדי-כתיבה, <b>LSM trees</b> (Log-Structured Merge) הופכים את זה: אוגרים כתיבות בזיכרון, שופכים אותן כקבצים ממוינים ובלתי ניתנים לשינוי (<b>SSTables</b>), וממזגים (compact) קבצים ברקע.</p>
<ul><li>כתיבות: מהירות, סדרתיות, append-only.</li><li>קריאות: אולי צריך לבדוק כמה קבצים.</li></ul>
<div class="dev">RocksDB, LevelDB, Cassandra, ScyllaDB והרבה time-series DBs מבוססים LSM. ה-"compaction storms" שאולי ראית בדשבורדים הם שלב המיזוג שמנסה להדביק את הקצב.</div>` },
        { type: 'learn', title: 'Bloom filters: "בטוח שלא" או "אולי"', html: `
<p>קריאה ב-LSM אולי תבדוק הרבה קבצים. איך מדלגים על קבצים שלא יכולים להכיל את ה-key? <b>Bloom filter</b>: מערך ביטים ועוד k פונקציות hash.</p>
<ul><li><b>הוספה</b>: מדליקים את k הביטים שה-key ממופה אליהם.</li><li><b>שאילתה</b>: אם <i>אחד</i> מ-k הביטים האלה הוא 0 → <b>בטוח לא קיים</b>. אם כולם 1 → <b>אולי קיים</b>.</li></ul>
<p>זיכרון זעיר (≈10 ביטים ל-key בשביל ~1% false positives), אפס false negatives.</p>
<div class="dev">Cassandra ו-RocksDB מחזיקים Bloom filter לכל SSTable כדי שקריאה תוכל לדלג על קבצים שבטוח לא מכילים את ה-key. CDNs משתמשים בהם כדי לא לעשות cache ל-"one-hit wonders".</div>` },
        { type: 'mcq', q: 'Bloom filter אומר "אולי קיים" עבור key X. מה אתה יודע?',
          choices: ['X בטוח בקבוצה', 'X בטוח לא בקבוצה', 'X אולי בקבוצה — חייבים לבדוק בדאטה האמיתי', 'הפילטר מושחת'], answer: 2,
          explain: 'כל הביטים של X יכלו להידלק על ידי keys אחרים — false positive. רק "לא" הוא חד-משמעי. אז "אולי" אומר: לך תעשה את החיפוש האמיתי (והיקר).' },
        { type: 'tf', q: 'Bloom filter סטנדרטי יכול לתת false negatives (להגיד "לא קיים" על key שהוסף).', answer: false,
          explain: 'הוספת key מדליקה את כל הביטים שלו ל-1, ו-Bloom filter סטנדרטי אף פעם לא מכבה ביטים. אז key שהוסף תמיד ימצא את הביטים שלו דולקים. false positives כן, false negatives אף פעם. (וזו גם הסיבה שאי אפשר למחוק מ-Bloom filter רגיל.)' },
        { type: 'order', q: 'סדרו את החיפושים לפי כמה קריאות disk page הם צריכים בטבלה של מיליארד שורות, מהמעט ביותר',
          items: ['חיפוש באינדקס B-tree (fanout של ~מאות)', 'עץ בינארי מאוזן על דיסק (key אחד לכל node)', 'Full table scan'],
          explain: 'B-tree: ~4 רמות (ולרוב פחות קריאות אמיתיות בזכות caching). עץ בינארי: ~30 רמות. Full scan: כל page בטבלה — אולי מיליונים. זה ה-EXPLAIN plan שלך על רגל אחת.' },
        { type: 'mcq', q: 'התאימו משימה למבנה: "autocomplete לכל ה-hostnames שמתחילים ב-web-prod-".',
          choices: ['Bloom filter', 'Trie', 'Min-heap', 'Hash table'], answer: 1,
          explain: 'יורדים ב-trie לאורך "web-prod-", ואז מונים את כל מה שבתת-העץ הזה. hash table מפזר keys ולא יכול למצוא prefixes בלי לסרוק הכול.' }
      ]
    }
  ]
});
