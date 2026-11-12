CQ.unitHe({
  id: 'sorting-searching',
  order: 8,
  title: 'מיון וחיפוש',
  emoji: '🔍',
  color: '#f97316',
  tagline: 'למצוא את המחט מהר — ולסדר את ערימת השחת קודם',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'binary-search',
      title: 'חיפוש לינארי מול Binary Search',
      emoji: '🎯',
      steps: [
        { type: 'learn', title: 'הדרך הישרה: להסתכל על הכול', html: `
<p><b>Linear search</b> (חיפוש לינארי): בודקים את פריט 0, פריט 1, פריט 2… עד שמוצאים או שנגמרים הפריטים. עובד על <i>כל</i> רשימה, ממוינת או לא.</p>
<p>עלות: <b>O(n)</b>. בסדר גמור ל-50 פריטים. כואב ל-50 מיליון.</p>
<div class="dev">אתה כבר מכיר את זה: <code>grep</code> על קובץ לוג בלי אינדקס, או <b>Seq Scan</b> של Postgres ב-EXPLAIN plan שלך. ישר, אמין, איטי בסקייל.</div>` },
        { type: 'learn', title: 'הדרך החכמה: לחצות את הבעיה', html: `
<p>אם הדאטה <b>ממוין</b>, מציצים באמצע. המטרה גדולה יותר? זורקים את כל החצי השמאלי. קטנה יותר? זורקים את החצי הימני. וחוזר חלילה.</p>
<p>כל צעד חוצה את מרחב החיפוש, אז זה לוקח בערך <b>log₂ n</b> צעדים:</p>
<div class="formula">1,000,000 → 500,000 → 250,000 → … → 1   (≈ 20 steps)</div>
<p>זה <b>binary search</b> (חיפוש בינארי): O(log n). בואו נרגיש את זה.</p>` },
        { type: 'widget', widget: 'guess', title: 'נחשו את המספר שלי', html: '<p>תמיד נחשו את האמצע של מה שנשאר. אף פעם לא אמורים להצטרך יותר מ-7 ניחושים בשביל 1–100.</p>' },
        { type: 'input', q: 'עם binary search, מה המספר המקסימלי של ניחושים שצריך כדי למצוא מספר בין 1 ל-100?', answer: ['7', 'seven', 'שבע', 'שבעה'], placeholder: 'ניחושים',
          explain: '2⁶ = 64 < 100 ≤ 128 = 2⁷. שש חציות יכולות להבחין רק בין 64 אפשרויות, שבע מסתדרות עם 128. אז 7 ניחושים תמיד מספיקים.' },
        { type: 'tf', q: 'Binary search עובד על כל רשימה, ממוינת או לא, כל עוד היא שמורה במערך.', answer: false,
          explain: 'כל הטריק נשען על הסדר: "האמצע קטן מדי, אז כל מה שמשמאלו קטן מדי גם כן". על דאטה לא ממוין ההסקה הזו שגויה, ותפספס דברים בביטחון מלא.' },
        { type: 'learn', title: 'Off-by-one: הבוס של השלב', html: `
<p>Binary search מפורסם בכך שהוא קל להסביר וקשה לכתוב בדיוק נכון. גרסה נכונה (גבולות כוללים):</p>
<pre><code>def bsearch(a, target):
    lo, hi = 0, len(a) - 1
    while lo &lt;= hi:               # &lt;=, not &lt;
        mid = lo + (hi - lo) // 2
        if a[mid] == target: return mid
        if a[mid] &lt; target: lo = mid + 1   # +1!
        else:                hi = mid - 1   # -1!
    return -1</code></pre>
<div class="fun">🤓 עובדה משעשעת: ה-<code>Arrays.binarySearch</code> של Java שוחרר ורץ ~9 שנים עם <code>mid = (lo + hi) / 2</code>. במערכים עם יותר מ-~מיליארד איברים, <code>lo + hi</code> גולש מ-int של 32 ביט והופך לשלילי. Joshua Bloch כתב על זה ב-2006. ומכאן <code>lo + (hi - lo) / 2</code>.</div>` },
        { type: 'tf', q: 'בקוד שלמעלה, שינוי של "lo = mid + 1" ל-"lo = mid" יכול לגרום ללולאה לרוץ לנצח.', answer: true,
          explain: 'נגיד lo = 3, hi = 4: mid = 3. אם a[3] < target, אז lo = mid מחזיר את lo ל-3 — אין התקדמות, לולאה אינסופית. ה-+1 מבטיח שהטווח מתכווץ בכל איטרציה.' },
        { type: 'learn', title: 'git bisect: binary search לבאגים', html: `
<p>משהו נשבר בין release v1.4 (טוב) ל-HEAD (רע), עם 1,000 commits ביניהם. <code>git bisect</code> עושה checkout ל-commit האמצעי; אתה בודק ואומר <code>good</code> או <code>bad</code>; הוא חוצה את הטווח. וחוזר חלילה.</p>
<pre><code>git bisect start
git bisect bad HEAD
git bisect good v1.4
git bisect run ./test.sh    # fully automatic!</code></pre>
<div class="dev">זה ה-binary search הכי פרקטי שתעשה בקריירה. אותו רעיון כשאתה עושה bisect לקונפיג רע על פני 64 nodes, או מצמצם איזה מתוך 200 feature flags הפיל את פרודקשן ע״י הפיכה של חצי בכל פעם.</div>` },
        { type: 'input', q: 'בערך כמה הרצות טסטים git bisect צריך (במקרה הגרוע) כדי למצוא את ה-commit הרע מבין 1,000 commits?', answer: ['10', 'ten', 'עשר', 'עשרה'], placeholder: 'הרצות',
          explain: '2¹⁰ = 1024 ≥ 1000, אז בערך 10 חציות. עשרה builds במקום אלף. bisect הוא קסם שהוא בעצם סתם log₂.' },
        { type: 'mcq', q: 'אתה הולך לחפש ברשימה לא ממוינת של מיליון פריטים פעם אחת בדיוק. מה הגישה המהירה ביותר?',
          choices: ['למיין (O(n log n)), ואז binary search', 'פשוט לעשות linear search (O(n))', 'Binary search ישירות', 'לבנות קודם B-tree'], answer: 1,
          explain: 'המיון לבדו עולה יותר מסריקה לינארית אחת. מיון (או אינדוקס) משתלם רק כשתחפש הרבה פעמים — בדיוק ה-trade-off שמאחורי "כדאי להוסיף את האינדקס הזה?".' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'simple-sorts',
      title: 'Bubble, Insertion ו-Selection',
      emoji: '🫧',
      steps: [
        { type: 'learn', title: 'Bubble sort: הצב המפורסם', html: `
<p>עוברים על הרשימה ומשווים שכנים; אם הם בסדר הלא נכון — מחליפים. אחרי מעבר אחד הפריט הגדול ביותר "בעבע" לסוף. חוזרים עד שמעבר שלם לא עושה אף החלפה.</p>
<pre><code>[5, 1, 4, 2, 8]
 swap 5,1 → [1, 5, 4, 2, 8]
 swap 5,4 → [1, 4, 5, 2, 8]
 swap 5,2 → [1, 4, 2, 5, 8]
 5 &lt; 8, ok   (end of pass 1: 8 is in place)</code></pre>
<p>במקרה הגרוע O(n²). מלמדים אותו בעיקר כדי שתדע מה <i>לא</i> לשלוח לפרודקשן.</p>` },
        { type: 'widget', widget: 'sort', title: 'תראו אותם מתחרים', html: '<p>הריצו bubble sort ו-insertion sort על אותו דאטה והשוו את מוני ההשוואות. אחר כך הציצו ב-merge וב-quick sort בתור טעימה.</p>' },
        { type: 'mcq', q: 'אחרי מעבר bubble sort שלם אחד על [3, 1, 2], מה הרשימה?',
          choices: ['[1, 2, 3]', '[1, 3, 2]', '[3, 1, 2]', '[2, 1, 3]'], answer: 0,
          explain: '3 > 1 מחליפים → [1, 3, 2]; 3 > 2 מחליפים → [1, 2, 3]. מזל — ממוין במעבר אחד (אבל bubble sort צריך עוד מעבר אחד בלי החלפות כדי להיות בטוח).' },
        { type: 'learn', title: 'Insertion sort: איך שממיינים קלפים', html: `
<p>מחזיקים חלק ממוין בצד שמאל. לוקחים את הפריט הבא ומחליקים אותו שמאלה עד שהוא מתיישב, כמו לסדר קלפים ביד.</p>
<pre><code>for i in range(1, len(a)):
    x = a[i]; j = i - 1
    while j &gt;= 0 and a[j] &gt; x:
        a[j+1] = a[j]; j -= 1
    a[j+1] = x</code></pre>
<ul><li>מקרה גרוע (ממוין הפוך): O(n²)</li><li>מקרה טוב (כבר ממוין): <b>O(n)</b> — כל פריט עושה השוואה אחת ונשאר במקום.</li></ul>
<div class="callout">Insertion sort באמת מצוין לדאטה <b>קטן</b> או <b>כמעט ממוין</b>. מיונים בעולם האמיתי משתמשים בו לחתיכות קטנות!</div>` },
        { type: 'mcq', q: 'שורות הלוג שלך כבר ממוינות לפי timestamp, חוץ מכמה מאחרות שקצת לא במקום. איזה מיון פשוט זורח פה?',
          choices: ['Selection sort', 'Insertion sort', 'Bubble sort בלי יציאה מוקדמת', 'כולם טובים באותה מידה'], answer: 1,
          explain: 'Insertion sort עושה עבודה ביחס למרחק שהפריטים רחוקים מהמקום שלהם. כמעט ממוין → כמעט O(n). Selection sort תמיד עושה ~n²/2 השוואות, לא משנה מה.' },
        { type: 'learn', title: 'Selection sort: מוצאים מינימום, וחוזר חלילה', html: `
<p>סורקים את כל החלק הלא ממוין בחיפוש אחרי המינימום, ומחליפים אותו למקום הבא. וחוזר חלילה.</p>
<p>הוא תמיד עושה בערך <b>n²/2 השוואות</b>, אפילו על קלט ממוין — הוא פשוט לא שם לב. אבל הוא עושה לכל היותר <b>n − 1 החלפות</b>, מה שהיה חשוב פעם כשכתיבות היו יקרות מאוד.</p>
<div class="dev">תחשוב עליו כמו rolling deploy טיפש שתמיד בודק מחדש כל pod שנשאר לפני שהוא בוחר את הבא — צפוי, אבל אף פעם לא לוקח קיצור דרך.</div>` },
        { type: 'tf', q: 'Selection sort רץ מהר יותר על קלט שכבר ממוין מאשר על קלט אקראי.', answer: false,
          explain: 'הוא עדיין סורק את כל החלק הלא ממוין בכל סבב כדי לוודא את המינימום: n(n−1)/2 השוואות כל פעם. הזמן שלו בכלל לא תלוי בסדר הקלט.' },
        { type: 'input', q: 'כמה השוואות insertion sort עושה על רשימה ממוינת של 10 פריטים?', answer: ['9', 'nine', 'תשע', 'תשעה'], placeholder: 'מספר',
          explain: 'כל אחד מפריטים 2..10 מושווה פעם אחת לשכן השמאלי שלו, מגלה שהוא כבר במקום, ועוצר: n − 1 = 9 השוואות. זה המקרה הטוב של O(n).' },
        { type: 'order', q: 'Insertion sort על [4, 3, 1]: סדרו את מצבי המערך מההתחלה עד הסוף',
          items: ['[4, 3, 1]', '[3, 4, 1]', '[1, 3, 4]'],
          explain: 'שלב 1: לוקחים את 3, מחליקים אותו שמאלה מעבר ל-4 → [3, 4, 1]. שלב 2: לוקחים את 1, מחליקים אותו מעבר ל-4 ול-3 → [1, 3, 4]. החלק הממוין בשמאל גדל באחד בכל שלב.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'merge-sort',
      title: 'Merge Sort (מיון מיזוג)',
      emoji: '🪓',
      steps: [
        { type: 'learn', title: 'הפרד ומשול', html: `
<p>התוכנית של merge sort עצלנית להפליא:</p>
<ol><li><b>מפצלים</b> את הרשימה לשניים.</li><li><b>ממיינים</b> כל חצי (רקורסיבית — אותו טריק).</li><li><b>ממזגים</b> (merge) את שני החצאים הממוינים.</li></ol>
<p>רשימה של פריט אחד כבר ממוינת, אז הרקורסיה נעצרת שם. כל העבודה האמיתית קורית במיזוג.</p>
<div class="dev">אתה כבר מכיר את הדפוס הזה: מפצלים job גדול ל-shards, נותנים ל-workers לטפל בהם במקביל, ואז מאחדים תוצאות. MapReduce, shards מקביליים של טסטים ב-CI, ו-pipelines של fan-out/fan-in — כולם divide and conquer (הפרד ומשול).</div>` },
        { type: 'learn', title: 'מיזוג שתי רשימות ממוינות', html: `
<p>שמים אצבע על ההתחלה של כל רשימה. לוקחים את הקטן מבין שני הראשונים, ומקדמים את האצבע הזו. כשרשימה אחת נגמרת, מצרפים את כל השאר מהשנייה.</p>
<pre><code>L = [1, 4, 7]   R = [2, 3, 9]
1 vs 2 → 1     4 vs 2 → 2     4 vs 3 → 3
4 vs 9 → 4     7 vs 9 → 7     L empty → 9
result: [1, 2, 3, 4, 7, 9]</code></pre>
<p>מיזוג רשימות באורך כולל n לוקח <b>O(n)</b> — לכל היותר n − 1 השוואות.</p>` },
        { type: 'input', q: 'במיזוג שלמעלה, כמה השוואות נעשו?', answer: ['5', 'five', 'חמש', 'חמישה'], placeholder: 'מספר',
          explain: '1v2, 4v2, 4v3, 4v9, 7v9 — חמש השוואות. אחר כך L נגמרה ו-9 צורף בחינם. זה n − 1 = 6 − 1 = 5, המקסימום ל-6 פריטים.' },
        { type: 'learn', title: 'למה n log n?', html: `
<p>תדמיינו את הרקורסיה כעץ. כל רמה חוצה רשימות לשניים, אז יש <b>log₂ n</b> רמות. בכל רמה, המיזוגים ביחד נוגעים בכל <b>n</b> הפריטים פעם אחת.</p>
<div class="formula">log₂ n levels × n work per level = O(n log n)</div>
<p>וזה גם המקרה הגרוע — ל-merge sort לא אכפת איך הקלט נראה. מיליון פריטים: ~20 רמות × 1M ≈ 20M צעדים, לעומת ~500 מיליארד במיון O(n²).</p>` },
        { type: 'input', q: 'כמה רמות של חצייה merge sort צריך כדי להביא רשימה של 8 פריטים לפריטים בודדים?', answer: ['3', 'three', 'שלוש', 'שלושה'], placeholder: 'רמות',
          explain: '8 → 4 → 2 → 1: שלוש חציות, כי log₂ 8 = 3.' },
        { type: 'learn', title: 'יציב, ומסתדר עם דיסקים', html: `
<p>Merge sort הוא <b>stable</b> (יציב): פריטים שווים שומרים על הסדר היחסי המקורי שלהם (עוד על למה זה חשוב בהמשך). המחיר: O(n) <b>זיכרון נוסף</b> בשביל המיזוג.</p>
<p>כוח-העל שלו הוא <b>external sorting</b> — מיון של דאטה גדול בהרבה מה-RAM:</p>
<ol><li>קוראים chunk שנכנס בזיכרון, ממיינים אותו, וכותבים אותו כ-"run" ממוין.</li><li>חוזרים על זה לכל הקובץ.</li><li>K-way merge לכל ה-runs, ב-streaming, כשכל אחד נקרא באופן סדרתי.</li></ol>
<div class="dev">ה-<code>sort</code> של GNU עושה בדיוק את זה על ה-access log של 200 GB שלך (תראה את קבצי ה-temp שלו ואת גודל ה-buffer ב-<code>-S</code>). גם Postgres: EXPLAIN ANALYZE מראה <code>Sort Method: external merge  Disk: …</code> כשמיון חורג מ-<code>work_mem</code>.</div>` },
        { type: 'order', q: 'סדרו את השלבים של external merge sort ללוג של 500 GB על מכונה עם 16 GB',
          items: ['לקרוא chunk שנכנס ב-RAM', 'למיין את ה-chunk הזה בזיכרון', 'לכתוב אותו לדיסק כ-run ממוין', 'K-way merge לכל ה-runs הממוינים לתוך הפלט הסופי'],
          explain: 'Chunk → מיון → spill לדיסק → שוב → merge. המיזוג צריך לקרוא רק את ההתחלה של כל run, אז הוא עובד ב-streaming עם מעט זיכרון.' },
        { type: 'mcq', q: 'מה סיבוכיות הזמן של merge sort במקרה הגרוע?',
          choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 1,
          explain: 'תמיד log n רמות × O(n) מיזוג לכל רמה. אין קלטים חסרי מזל — סיבה גדולה לכך שמשתמשים בו איפה שצפיות חשובה.' },
        { type: 'tf', q: 'Merge sort סטנדרטי על מערך ממיין in place, עם O(1) זיכרון נוסף בלבד.', answer: false,
          explain: 'המיזוג הסטנדרטי צריך buffer זמני בגודל של עד n: זיכרון נוסף של O(n). קיימות גרסאות של מיזוג in-place, אבל הן מסובכות ואיטיות יותר. (merge sort על linked lists, לעומת זאת, יכול להסתדר בלי buffer.)' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'quicksort',
      title: 'Quicksort (מיון מהיר)',
      emoji: '⚡',
      steps: [
        { type: 'learn', title: 'בוחרים pivot, מפצלים את הקהל', html: `
<p><b>Quicksort</b> הופך את merge sort: עושים את העבודה <i>לפני</i> הרקורסיה.</p>
<ol><li>בוחרים איבר <b>pivot</b> (ציר).</li><li><b>Partition</b>: מזיזים כל מה שקטן ממנו לשמאלו, וכל מה שגדול ממנו לימינו. ה-pivot עכשיו במקום הסופי שלו!</li><li>מריצים quicksort רקורסיבית על החלק השמאלי והימני.</li></ol>
<p>אין צורך בשלב מיזוג — ברגע ששני הצדדים ממוינים, הכול ממוין.</p>
<div class="dev">כמו triage לתור של incidents: בוחרים סף severity, מפצלים את הטיקטים ל"מעל" ו"מתחת", ואז עושים triage לכל ערימה באותה שיטה.</div>` },
        { type: 'order', q: 'סדרו את השלבים של quicksort על תת-מערך אחד',
          items: ['לבחור pivot', 'Partition: פריטים קטנים שמאלה, פריטים גדולים ימינה', 'למיין רקורסיבית את החלק השמאלי והימני'],
          explain: 'Pivot → partition → רקורסיה. בניגוד ל-merge sort, שלב ה"איחוד" בחינם: ה-pivot כבר יושב בין שני חצאים ממוינים.' },
        { type: 'input', q: 'עושים partition ל-[7, 2, 9, 4, 5] סביב pivot 5. באיזה אינדקס (מ-0) 5 נוחת?', answer: ['2', 'two', 'שתיים', 'שניים'], placeholder: 'אינדקס',
          explain: 'שני פריטים (2 ו-4) קטנים מ-5, אז הם תופסים את אינדקסים 0 ו-1, ו-5 נוחת באינדקס 2 — המקום הממוין הסופי שלו. 7 ו-9 הולכים ימינה.' },
        { type: 'learn', title: 'כש-quicksort מתקלקל', html: `
<p>מקרה ממוצע: pivots מפצלים בערך לחצי → ~log n רמות → <b>O(n log n)</b>, עם קבועים זעירים והתנהגות cache מעולה. בדרך כלל ה-comparison sort הכי מהיר בפועל.</p>
<p>מקרה גרוע: ה-pivot הוא תמיד הפריט הקטן או הגדול ביותר. כל partition מקלף רק איבר אחד → n רמות → <b>O(n²)</b>.</p>
<p>המלכודת הקלאסית: <b>תמיד לבחור את האיבר הראשון</b> כ-pivot, ואז להאכיל אותו בדאטה <b>שכבר ממוין</b>. 💥</p>
<div class="dev">זה incident שמחכה ל-input ספציפי — כמו regex שעובד מצוין עד שמישהו שולח את המחרוזת הפתולוגית האחת. קלטים זדוניים יכולים להפעיל את זה בכוונה ("quicksort killer").</div>` },
        { type: 'tf', q: 'Quicksort עם "האיבר הראשון כ-pivot" על מערך שכבר ממוין לוקח זמן O(n²).', answer: true,
          explain: 'האיבר הראשון הוא המינימום, אז כל partition לא שם כלום בשמאל ואת כל השאר בימין. n − 1, n − 2, … השוואות מסתכמות ב-~n²/2.' },
        { type: 'learn', title: 'הגנות', html: `
<ul><li><b>Pivot אקראי</b>: אין קלט קבוע שהוא רע באופן אמין; תוחלת O(n log n).</li>
<li><b>Median-of-three</b>: pivot = החציון של הראשון, האמצעי והאחרון. הורג את מלכודת הקלט הממוין.</li>
<li><b>Fallback</b>: אם הרקורסיה נהיית עמוקה מדי, מחליפים אלגוריתם (introsort — מגיע בקרוב).</li></ul>
<p>תכונות נוספות: הוא ממיין <b>in place</b> (רק O(log n) stack אם עושים רקורסיה קודם על הצד הקטן), והוא <b>לא stable</b> — ה-partitioning מחליף פריטים למרחקים ארוכים.</p>` },
        { type: 'widget', widget: 'sort', title: 'Quick מול merge', html: '<p>הריצו quick sort ו-merge sort על אותו דאטה. השוו את מוני ההשוואות שלהם ל-bubble ול-insertion sort.</p>' },
        { type: 'mcq', q: 'למה pivot אקראי הוא הגנה טובה?',
          choices: ['הוא מבטיח O(n log n) במקרה הגרוע', 'הוא הופך את תוחלת הזמן ל-O(n log n) לכל קלט, כך שאין קלט ספציפי שאיטי באופן אמין', 'הוא הופך את quicksort ל-stable', 'הוא מבטל את הצורך ב-partitioning'], answer: 1,
          explain: 'המקרה הגרוע עדיין קיים בתיאוריה, אבל עכשיו הוא תלוי במזל רע ולא בקלט רע — והמזל הזה בלתי סביר באופן אסטרונומי עבור n גדול. O(n log n) מובטח דורש משהו כמו ה-fallback של introsort.' },
        { type: 'mcq', q: 'איזה צימוד נכון?',
          choices: ['Quicksort: stable, זיכרון נוסף O(n) · Merge sort: לא stable, in place', 'Quicksort: לא stable, in place · Merge sort: stable, זיכרון נוסף O(n)', 'שניהם stable ו-in place', 'שניהם לא stable, זיכרון נוסף O(n)'], answer: 1,
          explain: 'ה-trade-off הקלאסי: quicksort הוא in-place ומהיר אבל לא stable ועם מקרה גרוע של O(n²); merge sort הוא stable ותמיד O(n log n) אבל צריך buffer.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'heapsort-lower-bound',
      title: 'Heap Sort ומגבלת המהירות',
      emoji: '🚧',
      steps: [
        { type: 'learn', title: 'Heap sort', html: `
<p>זוכרים heaps? ב-<b>max-heap</b> הפריט הגדול ביותר תמיד בשורש. אז:</p>
<ol><li>הופכים את המערך ל-max-heap במקום: O(n).</li><li>מחליפים את השורש (המקסימום) עם הפריט האחרון; מקטינים את ה-heap באחד; עושים sift down לשורש החדש: O(log n).</li><li>חוזרים n פעמים.</li></ol>
<p>החלק הממוין גדל מהקצה הימני. סך הכול: <b>O(n log n) במקרה הגרוע</b>, <b>O(1) זיכרון נוסף</b>. לא stable, וגישת הזיכרון הקופצנית שלו לא ידידותית ל-cache, אז בפועל הוא בדרך כלל איטי יותר מ-quicksort.</p>
<div class="dev">Postgres משתמש ב-heap כשאתה כותב <code>ORDER BY … LIMIT 10</code>: EXPLAIN ANALYZE מראה <code>Sort Method: top-N heapsort</code>. הוא שומר רק את 10 הטובים במקום למיין הכול.</div>` },
        { type: 'mcq', q: 'איזה שילוב heap sort מציע ששום quicksort או merge sort לא מציעים?',
          choices: ['O(n log n) במקרה הגרוע וגם O(1) זיכרון נוסף', 'יציבות (stability)', 'O(n) במקרה הטוב על קלט ממוין', 'Cache locality מעולה'], answer: 0,
          explain: 'Quicksort הוא in place אבל עם מקרה גרוע של O(n²); merge sort הוא O(n log n) במקרה הגרוע אבל צריך O(n) זיכרון. Heap sort מקבל את שתי ההבטחות — במחיר של מהירות בפועל ויציבות.' },
        { type: 'learn', title: 'יש מגבלת מהירות?', html: `
<p>כל מיון מהיר שראינו עד עכשיו נוחת על O(n log n). צירוף מקרים? ממש לא. זה <b>חסם תחתון מוכח</b> ל-<b>comparison sorts</b> — אלגוריתמים שלומדים על הדאטה רק דרך השאלה "האם a &lt; b?".</p>
<p>הטיעון: אפשר לסדר n פריטים ב-<b>n!</b> סדרים אפשריים. האלגוריתם חייב להבחין בין כולם. כל השוואת כן/לא יכולה במקרה הטוב לחצות את האפשרויות שנשארו.</p>
<div class="formula">comparisons ≥ log₂(n!) ≈ n log₂ n</div>
<p>זה עץ החלטות עם n! עלים, אז הגובה שלו לפחות log₂(n!).</p>` },
        { type: 'input', q: 'כמה סידורים אפשריים יש ל-3 פריטים שונים?', answer: ['6', 'six', 'שש', 'שישה'], placeholder: 'מספר',
          explain: '3! = 3 × 2 × 1 = 6, והנה הם: abc, acb, bac, bca, cab, cba.' },
        { type: 'input', q: 'אז מה המספר המינימלי של השוואות שכל comparison sort צריך במקרה הגרוע כדי למיין 3 פריטים?', answer: ['3', 'three', 'שלוש', 'שלושה'], placeholder: 'מספר',
          explain: '2 השוואות נותנות לכל היותר 2² = 4 תוצאות — לא מספיק כדי להבחין בין 6 סידורים. 3 השוואות נותנות 8 ≥ 6. אז ⌈log₂ 6⌉ = 3.' },
        { type: 'learn', title: 'עשרים שאלות, אבל בשביל מיון', html: `
<p>כל השוואה היא שאלת כן/לא. מיון הוא משחק של "איזה מתוך n! הסידורים זה?". עם 20 שאלות אפשר להבחין בין ~מיליון דברים; כדי להבחין בין n! דברים צריך log₂(n!) שאלות.</p>
<p>ו-log₂(n!) גדל כמו n log n (קירוב סטירלינג). אז merge sort ו-heap sort הם comparison sorts <b>אופטימליים אסימפטוטית</b>. אי אפשר, פשוטו כמשמעו, לעשות יותר טוב… <i>בעזרת השוואות</i>.</p>
<div class="fun">🤓 עובדה משעשעת: החסם הדוק גם ל-n קטנטן. מיון של 5 פריטים צריך לפחות ⌈log₂ 120⌉ = 7 השוואות, ו-7 אכן אפשרי.</div>` },
        { type: 'tf', q: 'שום אלגוריתם מיון מבוסס השוואות לא יכול להיות עם מקרה גרוע טוב יותר מ-O(n log n).', answer: true,
          explain: 'לעץ ההחלטות שלו חייבים להיות ≥ n! עלים, אז העומק במקרה הגרוע ≥ log₂(n!) = Ω(n log n). זו הוכחה על כל האלגוריתמים האפשריים, לא רק על אלה שמצאנו.' },
        { type: 'mcq', q: 'מה טיעון החסם התחתון מניח?',
          choices: ['שהדאטה נכנס בזיכרון', 'שהאלגוריתם לומד על הסדר רק דרך השוואה של זוגות פריטים', 'שהדאטה אקראי', 'שהאלגוריתם רקורסיבי'], answer: 1,
          explain: 'הפרצה: אם אפשר להסתכל על הערכים עצמם (ספרות, bytes, טווחים קטנים של מספרים שלמים) במקום רק להשוות, החסם לא חל. בשיעור הבא: מיונים ששוברים את "מגבלת המהירות".' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'linear-sorts',
      title: 'Counting, Radix ויציבות',
      emoji: '🔢',
      steps: [
        { type: 'learn', title: 'Counting sort: פשוט סופרים', html: `
<p>ממיינים 10 מיליון HTTP status codes? יש רק קומץ ערכים שונים. אל תשווה — <b>תספור</b>:</p>
<pre><code>counts = {200: 9100000, 301: 40000, 404: 800000, 500: 60000}
# then emit each value count times, in key order</code></pre>
<p>למספרים שלמים בטווח בגודל k: מעבר אחד כדי לספור, מעבר אחד על k ה-buckets.</p>
<div class="formula">O(n + k)</div>
<p>אין השוואות בכלל, אז מגבלת המהירות של n log n פשוט לא חלה.</p>
<div class="dev">אתה עושה את זה כל יום: <code>awk '{print $9}' access.log | sort | uniq -c</code> הוא אותו רעיון של ספירה — ו-histogram של Prometheus הוא מערך ה-buckets של counting sort, קפוא בזמן.</div>` },
        { type: 'mcq', q: 'Counting sort הוא בחירה גרועה כאשר…',
          choices: ['הערכים הם מספרים שלמים קטנים כמו גילאים 0–150', 'הערכים הם מספרים שלמים של 64 ביט שמפוזרים על פני כל הטווח', 'יש הרבה כפילויות', 'n גדול מאוד'], answer: 1,
          explain: 'k יהיה 2⁶⁴ — אי אפשר להקצות כל כך הרבה מונים. Counting sort צריך טווח ערכים k קטן ביחס ל-n.' },
        { type: 'learn', title: 'Radix sort: ספרה אחרי ספרה', html: `
<p>ומה אם הטווח גדול? ממיינים לפי <b>ספרות</b>, מהפחות משמעותית קודם, עם counting sort יציב לכל ספרה:</p>
<pre><code>[170, 45, 75, 90, 802, 24, 2, 66]
by ones:     [170, 90, 802, 2, 24, 45, 75, 66]
by tens:     [802, 2, 24, 45, 66, 170, 75, 90]
by hundreds: [2, 24, 45, 66, 75, 90, 170, 802]</code></pre>
<p>עם d ספרות בבסיס b: <b>O(d · (n + b))</b>. ints של 32 ביט כ-4 bytes: 4 מעברים של counting sort עם 256 buckets — לינארי ב-n.</p>` },
        { type: 'tf', q: 'LSD radix sort עובד רק אם המיון לכל ספרה הוא stable.', answer: true,
          explain: 'כשממיינים לפי העשרות, פריטים עם אותה ספרת עשרות חייבים לשמור על הסדר שנקבע במעבר של האחדות. בלי יציבות, המעברים הקודמים מתערבבים והתוצאה שגויה.' },
        { type: 'learn', title: 'יציבות: שוויונות שומרים על הסדר', html: `
<p>מיון הוא <b>stable</b> (יציב) אם פריטים שנחשבים שווים נשארים בסדר היחסי המקורי שלהם.</p>
<p>למה זה אכפת לנו? זה מאפשר <b>למיין לפי כמה מפתחות</b> בכמה מעברים. רוצים incidents לפי severity, ובתוך כל severity לפי זמן? ממיינים קודם לפי זמן, ואז מיון stable לפי severity. מי ששווים ב-severity שומרים על סדר הזמן שלהם.</p>
<ul><li>Stable: merge sort, insertion sort, bubble sort, counting sort, Timsort</li><li>לא stable: quicksort, heap sort, selection sort</li></ul>
<div class="dev">יצא לך ללחוץ על כותרת של עמודה אחת, ואז על עוד אחת, בטבלה בדשבורד, ולקבל תצוגה מקובצת ויפה? זה מיון stable שמצדיק את המשכורת שלו.</div>` },
        { type: 'mcq', q: 'טיקטים ממוינים לפי זמן: [(P2, 09:00), (P1, 09:05), (P2, 09:10), (P1, 09:20)]. עושים מיון STABLE לפי priority. מה התוצאה?',
          choices: ['(P1, 09:05), (P1, 09:20), (P2, 09:00), (P2, 09:10)', '(P1, 09:20), (P1, 09:05), (P2, 09:10), (P2, 09:00)', '(P1, 09:05), (P1, 09:20), (P2, 09:10), (P2, 09:00)', 'הסדר בתוך כל priority לא צפוי'], answer: 0,
          explain: 'ה-P1 באים ראשונים, ה-P2 שניים, ובתוך כל priority הסדר המקורי (לפי זמן) נשמר: 09:05 לפני 09:20, 09:00 לפני 09:10.' },
        { type: 'mcq', q: 'איזה מיון הוא לא stable (בגרסה הסטנדרטית שלו)?',
          choices: ['Merge sort', 'Insertion sort', 'Quicksort', 'Counting sort'], answer: 2,
          explain: 'Partitioning מחליף פריטים למרחקים ארוכים, אז פריטים שווים יכולים להתחלף במקומות. Merge, insertion ו-counting sort כולם שומרים על הסדר של שוויונות.' },
        { type: 'input', q: 'Counting sort של n = 1,000,000 ערכים בטווח 0–999 (k = 1,000). מה הסיבוכיות שלו, במונחים של n ו-k?', answer: ['O(n + k)', 'n + k', 'O(n+k)', 'n+k', 'O(k + n)', 'k + n'], placeholder: 'O(...)',
          explain: 'מעבר אחד על n הפריטים כדי לספור, מעבר אחד על k המונים כדי לפלוט: O(n + k). כאן זה בערך 1,001,000 צעדים — לינארי.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'real-world-sorts',
      title: 'במה משתמשות שפות אמיתיות',
      emoji: '🏭',
      steps: [
        { type: 'learn', title: 'אף אחד לא שולח לפרודקשן מיון מהספר', html: `
<p>מיונים בפרודקשן הם <b>היברידיים</b>: הם משלבים אלגוריתמים כדי לקבל את הטוב שבכל אחד. שתי המשפחות הגדולות:</p>
<ul><li><b>Timsort</b> — merge sort + insertion sort, מכוונן לדאטה אמיתי.</li><li><b>Introsort</b> (והצאצאים שלו) — quicksort + heap sort + insertion sort.</li></ul>
<p>שניהם משתמשים ב-<b>insertion sort לחתיכות קטנטנות</b> (בערך מתחת ל-16–64 פריטים), שם ה-overhead הנמוך שלו מנצח את כולם.</p>` },
        { type: 'learn', title: 'Timsort: לנצל סדר קיים', html: `
<p>נכתב על ידי Tim Peters בשביל Python ב-2002. דאטה אמיתי כמעט אף פעם לא אקראי — לרוב הוא ממוין חלקית (לוגים שמתווספים בסוף, IDs שרובם מסודרים). Timsort:</p>
<ol><li>סורק בחיפוש אחרי <b>runs</b> שכבר עולים (או יורדים, ואותם הוא הופך).</li><li>מאריך runs קצרים עם insertion sort.</li><li>ממזג runs בחוכמה, עם "galloping" כש-run אחד שולט.</li></ol>
<p>קלט שכבר ממוין: <b>O(n)</b>. מקרה גרוע: <b>O(n log n)</b>. והוא <b>stable</b>.</p>
<div class="dev">בשימוש ב-<code>sorted()</code>/<code>list.sort()</code> של Python (עם מדיניות מיזוג משופרת, Powersort, מאז 3.11), ב-<code>Arrays.sort</code> של Java לאובייקטים וב-<code>Collections.sort</code>, וב-V8 בשביל <code>Array.prototype.sort</code> של JavaScript.</div>` },
        { type: 'tf', q: 'Timsort ממיין רשימה שכבר ממוינת בערך בזמן לינארי.', answer: true,
          explain: 'הוא מזהה run ענק אחד שמכסה את כל הרשימה ואין לו מה למזג: ~n − 1 השוואות.' },
        { type: 'learn', title: 'Introsort: quicksort עם רשת ביטחון', html: `
<p><b>Introsort</b> (Musser, 1997) מתחיל כ-quicksort. אם עומק הרקורסיה עובר בערך 2·log₂ n — סימן ל-pivots גרועים — הוא מעביר את החלק הזה ל-<b>heap sort</b>. partitions קטנים מקבלים insertion sort.</p>
<p>התוצאה: המהירות של quicksort בעולם האמיתי, עם <b>מקרה גרוע מובטח של O(n log n)</b>. לא stable.</p>
<div class="dev">בשימוש ב-<code>std::sort</code> של C++ וב-<code>Array.Sort</code> של .NET. ה-<code>sort.Sort</code> של Go (מאז Go 1.19) ו-<code>slices.Sort</code> משתמשים ב-<b>pdqsort</b>, צאצא מודרני שגם מזהה דפוסים כמו runs ממוינים. זה circuit breaker למיון שלך: כשדברים נראים פתולוגיים, עושים failover לנתיב המשעמם והאמין.</div>` },
        { type: 'mcq', q: 'למה introsort נופל חזרה ל-heap sort ולא ל-merge sort?',
          choices: ['Heap sort הוא stable', 'Heap sort הוא O(n log n) במקרה הגרוע וגם in place, בדיוק כמו טביעת הזיכרון של quicksort', 'Heap sort מהיר יותר מ-quicksort בממוצע', 'Merge sort הוא O(n²) במקרה הגרוע'], answer: 1,
          explain: 'Introsort רוצה להישאר in place כמו quicksort. Heap sort נותן את ההבטחה של O(n log n) עם O(1) זיכרון נוסף. Merge sort היה צריך buffer של O(n).' },
        { type: 'mcq', q: 'Java משתמשת ב-dual-pivot quicksort בשביל int[] אבל ב-Timsort בשביל Object[]. למה ההבדל?',
          choices: ['אובייקטים תמיד כמעט ממוינים', 'יציבות חשובה רק כשאפשר להבחין בין איברים שווים — שני ints שווים זהים לגמרי, שני אובייקטים שווים אולי לא', 'Quicksort לא יכול להשוות אובייקטים', 'Timsort מהיר יותר על מספרים שלמים'], answer: 1,
          explain: 'החלפה בין שני 5 לא משנה שום דבר שאפשר לראות, אז primitives יכולים להשתמש במיון הלא-יציב והמהיר יותר. לאובייקטים עם מפתח מיון שווה יכולים להיות שדות אחרים שונים, אז ה-API מבטיח יציבות.' },
        { type: 'order', q: 'מיון היברידי מקבל מערך אקראי של מיליון פריטים. סדרו מה קורה בדרך כלל (בסגנון introsort)',
          items: ['Quicksort עושה partition למערך הגדול', 'ה-partitions מתכווצים ככל שהרקורסיה מעמיקה', 'Partitions קטנטנים נגמרים עם insertion sort'],
          explain: 'קודם התמונה הגדולה (quicksort), אחר כך ניקיון קטן (insertion sort). אם עומק הרקורסיה היה עובר בדרך את ~2 log n, ה-partition הזה היה עובר ל-heap sort.' },
        { type: 'mcq', q: 'צריך למיין 300 GB של שורות לוג JSON לפי timestamp על מכונה עם 32 GB RAM. מה התוכנית הכי טובה?',
          choices: ['לטעון הכול ולקרוא ל-sorted()', 'External merge sort — למשל GNU sort עם גודל buffer ותיקיית temp', 'Bubble sort, in place, כדי לחסוך זיכרון', 'Heap sort, כי הוא in place'], answer: 1,
          explain: 'זה לא נכנס ב-RAM, אז אלגוריתמים בזיכרון יוצאים מהמשחק (in-place לא יעזור — הדאטה עצמו גדול מה-RAM). ממיינים chunks, שופכים runs ממוינים לדיסק, וממזגים ב-streaming: external merge sort, בדיוק מה ש-GNU sort עושה.' },
        { type: 'tf', q: 'בקוד יומיומי, בדרך כלל עדיף לקרוא ל-sort המובנה של השפה ולא לכתוב אחד משלך.', answer: true,
          explain: 'המובנים הם היברידיים שכווננו במשך שנים על דאטה אמיתי, מטפלים ב-edge cases ונבדקו לעומק. להבין איך הם עובדים אומר לך מתי הם stable, מתי הם O(n) על דאטה ממוין, ומתי לשלוף משהו אחר (top-k heap, external sort, counting sort).' }
      ]
    }
  ]
});
