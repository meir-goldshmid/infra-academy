CQ.unitHe({
  id: 'recursion-dp',
  order: 9,
  title: 'רקורסיה, Greedy ו-Dynamic Programming',
  emoji: '🪆',
  color: '#e8590c',
  tagline: 'פונקציות שקוראות לעצמן, וטריק ה-caching שהופך אותן למהירות',
  lessons: [
    // ───────────────────────────── Lesson 1 ─────────────────────────────
    {
      id: 'recursion-basics',
      title: 'רקורסיה וה-Call Stack',
      emoji: '🪆',
      steps: [
        {
          type: 'learn', title: 'פונקציה שקוראת לעצמה',
          html: `<p><b>Recursion</b> (רקורסיה) פירושה לפתור בעיה על ידי זה שמעבירים <i>עותק קטן יותר של אותה בעיה</i> לעצמך.</p>
<pre><code>def factorial(n):
    if n &lt;= 1:          # base case
        return 1
    return n * factorial(n - 1)   # recursive case</code></pre>
<p>לכל פונקציה רקורסיבית צריכים להיות שני חלקים:</p>
<ul><li><b>Base case</b> (מקרה בסיס): בעיה כל כך קטנה שפשוט עונים עליה.</li>
<li><b>Recursive case</b> (צעד רקורסיבי): מקטינים את הבעיה וקוראים לעצמך.</li></ul>
<div class="callout">כל קריאה חייבת להתקרב <b>עוד קצת</b> ל-base case, אחרת לא תעצור אף פעם.</div>`
        },
        {
          type: 'learn', title: 'ה-call stack',
          html: `<p>כש-<code>factorial(3)</code> רצה, כל קריאה מחכה לזו שמתחתיה. ה-runtime שומר את הקריאות המושהות האלה על ה-<b>call stack</b> (מחסנית הקריאות):</p>
<pre><code>factorial(3)  waits for ...
  factorial(2)  waits for ...
    factorial(1)  returns 1   ← base case
  returns 2 * 1 = 2
returns 3 * 2 = 6</code></pre>
<p>כל קריאה מושהית היא <b>stack frame</b> שמחזיק את המשתנים המקומיים שלו (ה-<code>n</code> הפרטי שלו). הקריאות נערמות בדרך למטה, ואז <i>מתפרקות</i> (unwind) בדרך חזרה למעלה: האחרון שנכנס הוא הראשון שיוצא.</p>
<div class="dev">אתם כבר מכירים את זה: זה stack trace! כל שורה ב-traceback של Python או ב-exception של Java היא frame אחד על ה-call stack, החדש ביותר בסוף (Python) או למעלה (Java).</div>`
        },
        {
          type: 'mcq', q: 'מה קורה אם לפונקציה רקורסיבית אין base case?',
          choices: ['היא מחזירה 0 אוטומטית', 'היא ממשיכה לקרוא לעצמה עד שנגמר המקום ב-stack', 'הקומפיילר הופך אותה ללולאה', 'היא רצה בדיוק פעם אחת'],
          answer: 1,
          explain: `אין שום דבר שעוצר אותה, אז כל קריאה יוצרת עוד קריאה. ה-frames נערמים עד שה-stack מתמלא ומקבלים stack overflow (ב-Python: RecursionError, ב-Java: StackOverflowError).`
        },
        {
          type: 'learn', title: 'Stack overflow (המקורי)',
          html: `<p>ה-stack קטן: לרוב בערך <b>8 MB</b> ל-thread הראשי בלינוקס (<code>ulimit -s</code> מראה 8192 KB כברירת מחדל), והרבה פחות ל-threads נוספים. Python גם מגבילה את עומק הרקורסיה ל-<b>1000</b> כברירת מחדל (<code>sys.getrecursionlimit()</code>).</p>
<p>אז עומק רקורסיה הוא משאב אמיתי. רקורסיה של 10 רמות לעומק עץ? סבבה. רקורסיה של 1,000,000 פעמים לאורך linked list? בום.</p>
<div class="dev">זה בדיוק כמו retries בלי גבול שקוראים ל-retries: כל שכבה מחזיקה משאבים בזמן שהיא מחכה לבאה. בלי גבול (ה-base case) אתם מרוקנים את ה-pool והכול קורס.</div>
<div class="fun">🤓 עובדה משעשעת: כן, האתר נקרא על שם הקריסה הזו.</div>`
        },
        {
          type: 'input', q: 'כמה frames יש על ה-stack בנקודה העמוקה ביותר של factorial(5) (כולל הקריאה ל-factorial(5) עצמה)?',
          answer: ['5', 'five', 'חמש', 'חמישה'], placeholder: 'מספר',
          explain: `factorial(5) → factorial(4) → factorial(3) → factorial(2) → factorial(1). זה 5 frames שנערמים לפני ש-factorial(1) פוגעת ב-base case והם מתחילים להתפרק. העומק גדל לינארית עם n.`
        },
        {
          type: 'learn', title: 'איפה רקורסיה זורחת: עצים',
          html: `<p>רקורסיה טבעית כשה<i>מידע</i> עצמו רקורסיבי. תיקייה מכילה קבצים ו... עוד תיקיות. כל תת-תיקייה היא גרסה קטנה יותר של אותה בעיה:</p>
<pre><code>def total_size(path):
    if os.path.isfile(path):          # base case
        return os.path.getsize(path)
    return sum(total_size(os.path.join(path, c))
               for c in os.listdir(path))</code></pre>
<div class="dev">זה ממש <code>du -s</code>. אותה צורה כמו <code>rm -r</code>, <code>chmod -R</code>, <code>find</code>, מעבר על מסמך JSON/YAML, או רינדור של Helm values מקוננים. "-R" בדגל של CLI כמעט תמיד אומר "יש פה רקורסיה בפנים".</div>
<p>כאן עומק ה-stack הוא <b>עומק הקינון</b> של העץ, לא מספר הקבצים, אז הוא כמעט אף פעם לא עושה overflow.</p>`
        },
        {
          type: 'tf', q: 'בפונקציה total_size שלמעלה, עומק הרקורסיה המקסימלי שווה למספר הקבצים הכולל בדיסק.',
          answer: false,
          explain: `העומק שווה לכמה עמוק התיקיות מקוננות. תיקייה עם מיליון קבצים זה לצד זה היא רק רמה אחת לעומק; כל קריאה על קובץ חוזרת מיד לפני שהבאה מתחילה.`
        },
        {
          type: 'learn', title: 'רקורסיה מול לולאות',
          html: `<p>כל דבר רקורסיבי אפשר לכתוב מחדש עם לולאה ועוד stack מפורש (רשימה שאתם עושים לה push ו-pop בעצמכם). זה בדיוק מה שה-call stack של ה-runtime עשה בשבילכם.</p>
<pre><code>stack = [root]
while stack:
    path = stack.pop()
    ...
    stack.extend(children(path))</code></pre>
<div class="callout">רקורסיה = קוד ברור יותר. Stack מפורש = בלי מגבלת עומק (הוא חי על ה-heap). תבחרו לפי כמה עמוק ה-input יכול להגיע.</div>
<div class="fun">🤓 יש שפות (Scheme, Haskell) שמבטיחות <b>tail-call optimisation</b>: אם הקריאה הרקורסיבית היא הדבר האחרון שהפונקציה עושה, ה-frame ממוחזר. Python ו-Java לא.</div>`
        },
        {
          type: 'order', q: 'סדרו את האירועים של קריאה ל-factorial(2).',
          items: ['factorial(2) נקראת ודוחפת frame', 'factorial(2) קוראת ל-factorial(1)', 'factorial(1) פוגעת ב-base case ומחזירה 1', 'factorial(2) מחשבת 2 * 1 ומחזירה 2'],
          explain: `הקריאות יורדות למטה (push), ה-base case עונה, ואז התוצאות זורמות חזרה למעלה (pop) כשכל frame שחיכה מסיים את הכפל שלו.`
        },
        {
          type: 'mcq', q: 'צריך לעבד linked list עם 5 מיליון nodes ב-Python. מה הגישה הכי טובה?',
          choices: ['רקורסיה: קריאה אחת לכל node', 'לולאה פשוטה', 'רקורסיה, אבל להעלות את ה-recursion limit ל-10 מיליון'],
          answer: 1,
          explain: `5 מיליון frames יפילו את ה-C stack האמיתי גם עם limit מוגדל. לולאה משתמשת בכמות קבועה של stack. רקורסיה מתאימה לבעיות שהעומק שלהן נשאר קטן (עצים, divide and conquer), לא לשרשראות לינאריות ארוכות.`
        }
      ]
    },

    // ───────────────────────────── Lesson 2 ─────────────────────────────
    {
      id: 'recursion-trees',
      title: 'עצי רקורסיה ופיבונאצ\'י שמתפוצץ',
      emoji: '🌳',
      steps: [
        {
          type: 'learn', title: 'פיבונאצ\'י, המלכודת שנראית תמימה',
          html: `<p>פיבונאצ'י: כל מספר הוא סכום שני הקודמים לו. 0, 1, 1, 2, 3, 5, 8, 13, 21...</p>
<pre><code>def fib(n):
    if n &lt; 2:
        return n
    return fib(n - 1) + fib(n - 2)</code></pre>
<p>נראה מושלם. תואם בדיוק להגדרה המתמטית. תריצו <code>fib(40)</code> ולכו להכין קפה. תריצו <code>fib(100)</code> ולכו לפנסיה.</p>
<p>למה? בניגוד ל-factorial, כל קריאה עושה <b>שתי</b> קריאות.</p>`
        },
        {
          type: 'learn', title: 'ציירו את עץ הרקורסיה',
          html: `<p>ציירו כל קריאה כ-node, כשהילדים שלו הם הקריאות שהוא עושה:</p>
<svg viewBox="0 0 300 150" width="100%" style="max-width:320px" font-size="12" text-anchor="middle">
<g stroke="currentColor" stroke-width="1.5" opacity="0.6">
<line x1="150" y1="18" x2="80" y2="58"/><line x1="150" y1="18" x2="220" y2="58"/>
<line x1="80" y1="58" x2="45" y2="98"/><line x1="80" y1="58" x2="115" y2="98"/>
<line x1="220" y1="58" x2="190" y2="98"/><line x1="220" y1="58" x2="250" y2="98"/>
<line x1="45" y1="98" x2="25" y2="135"/><line x1="45" y1="98" x2="65" y2="135"/>
</g>
<g fill="currentColor">
<text x="150" y="22">fib(4)</text>
<text x="80" y="62">fib(3)</text><text x="220" y="62" fill="var(--accent)" font-weight="bold">fib(2)</text>
<text x="45" y="102" fill="var(--accent)" font-weight="bold">fib(2)</text><text x="115" y="102">fib(1)</text>
<text x="190" y="102">fib(1)</text><text x="250" y="102">fib(0)</text>
<text x="25" y="139">fib(1)</text><text x="65" y="139">fib(0)</text>
</g></svg>
<p>רואים ש-<b>fib(2)</b> מחושב פעמיים? עבור n גדול יותר, אותן תת-בעיות מחושבות מחדש אלפי ואז מיליוני פעמים.</p>
<div class="callout">עץ רקורסיה: סך העבודה = סכום העבודה בכל node. תספרו את ה-nodes, תדעו את המחיר.</div>`
        },
        {
          type: 'input', q: 'ספרו את ה-nodes בעץ שלמעלה: כמה קריאות בסך הכול עושה fib(4) (כולל את עצמה)?',
          answer: ['9', 'nine', 'תשע', 'תשעה'], placeholder: 'מספר',
          explain: `fib(4), שתיים ברמה הבאה (fib(3)/fib(2)), ארבע ברמה שאחריה, שתיים בתחתית: 1 + 2 + 4 + 2 = 9 קריאות. באופן כללי calls(n) = calls(n−1) + calls(n−2) + 1.`
        },
        {
          type: 'learn', title: 'למה זה אקספוננציאלי',
          html: `<p>כל רמה בעץ בערך <b>מכפילה</b> את מספר הקריאות, והעץ בעומק של בערך n רמות. חסם עליון: 2 × 2 × 2 ... n פעמים = <b>O(2ⁿ)</b>.</p>
<p>(החסם ההדוק הוא בערך 1.618ⁿ, יחס הזהב, כי הענף של fib(n−2) קצר יותר. עדיין אקספוננציאלי, עדיין אסון.)</p>
<table><tr><th>n</th><th>קריאות (בערך)</th></tr>
<tr><td>10</td><td>177</td></tr><tr><td>30</td><td>2.7 מיליון</td></tr><tr><td>50</td><td>40 מיליארד</td></tr></table>
<p>ובכל זאת יש רק <b>n+1 שאלות שונות</b>: fib(0) עד fib(n). אנחנו שואלים את אותן כמה שאלות מיליארדי פעמים.</p>`
        },
        {
          type: 'widget', widget: 'growth', title: 'תרגישו את הפיצוץ',
          html: `<p>גררו את n למעלה ותראו את העמודה של 2ⁿ משאירה את כל השאר מאחור. זה fib הנאיבי. התיקון שלנו בשיעור הבא יהפוך אותו לעמודה המשעממת והמקסימה של <b>n</b>.</p>`
        },
        {
          type: 'mcq', q: 'מה הסיבה העיקרית ש-fib הרקורסיבי הנאיבי איטי?',
          choices: ['קריאות לפונקציות איטיות ב-Python', 'הוא מחשב מחדש את אותן תת-בעיות שוב ושוב', 'חיבור של מספרים גדולים יקר', 'עומק הרקורסיה אקספוננציאלי'],
          answer: 1,
          explain: `העומק הוא רק בערך n (לינארי). הבעיה היא הרוחב: תת-בעיות חופפות כמו fib(2) מחושבות שוב ושוב, ולכן מספר הקריאות הכולל אקספוננציאלי.`
        },
        {
          type: 'tf', q: 'עומק ה-stack המקסימלי של fib(n) הנאיבי הוא בערך n, למרות שמספר הקריאות הכולל אקספוננציאלי.',
          answer: true,
          explain: `ה-stack מחזיק בכל רגע רק מסלול אחד מהשורש לעלה: fib(n) → fib(n−1) → ... → fib(1). עומק ≈ n. הזמן אקספוננציאלי כי העץ רחב בטירוף, לא עמוק.`
        },
        {
          type: 'learn', title: 'שתי צורות שונות של רקורסיה',
          html: `<ul><li><b>קריאה אחת בכל רמה</b> (factorial, מעבר על רשימה): שרשרת. O(n) קריאות.</li>
<li><b>שתי קריאות, כל אחת על חצי מה-input</b> (merge sort): log n רמות, n עבודה בכל רמה → O(n log n).</li>
<li><b>שתי קריאות, כל אחת על input שקטן רק ב-1 או 2</b> (fib נאיבי): ~n רמות, הכפלה בכל רמה → אקספוננציאלי.</li></ul>
<div class="callout">הקומבו הקטלני: <b>הסתעפות</b> + <b>הקטנה זעירה</b>. חיתוך לחצי מאלף את ההסתעפות; הורדה של 1 לא.</div>
<div class="dev">זה כמו retry storm: כל בקשה שנכשלה מתפצלת ל-2 retries, וכל אחד מהם מתפצל לעוד 2... fan-out עם מעט התקדמות בכל hop = עומס אקספוננציאלי.</div>`
        },
        {
          type: 'mcq', q: 'f(n) קוראת ל-f(n−1) שלוש פעמים (ועושה O(1) עבודה נוספת). זמן הריצה שלה הוא בערך...',
          choices: ['O(n)', 'O(3n)', 'O(n³)', 'O(3ⁿ)'],
          answer: 3,
          explain: `כל רמה משלשת את הקריאות ויש n רמות: 3 × 3 × ... × 3 = 3ⁿ. מקדם הסתעפות b עם עומק d נותן בערך bᵈ nodes.`
        }
      ]
    },

    // ───────────────────────────── Lesson 3 ─────────────────────────────
    {
      id: 'memoization',
      title: 'Memoization: זה בסך הכול Caching',
      emoji: '🧠',
      steps: [
        {
          type: 'learn', title: 'תזכרו מה כבר חישבתם',
          html: `<p>התיקון ל-fib: לפני שמחשבים, בודקים אם כבר ראינו את ה-input הזה. אחרי שמחשבים, שומרים את התשובה.</p>
<pre><code>memo = {}
def fib(n):
    if n &lt; 2:
        return n
    if n in memo:
        return memo[n]          # cache hit
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]</code></pre>
<p>זה <b>memoization</b> (כן, "memo", לא "memorization").</p>
<div class="dev">אתם כבר מכירים את זה: זה Redis מול Postgres. דפוס cache-aside: בודקים ב-cache, ב-miss מחשבים ושומרים. ההבדל היחיד הוא שה-cache חי ב-dict וה-"backend האיטי" הוא הפונקציה שלכם.</div>`
        },
        {
          type: 'learn', title: 'מה זה עושה לעץ',
          html: `<p>עם memoization, כל <code>fib(k)</code> מחושב <b>פעם אחת</b>. כל בקשה מאוחרת יותר היא cache hit שחוזר מיד, וגוזם את כל תת-העץ הזה.</p>
<p>העץ הענק מתכווץ לשרשרת: fib(n), fib(n−1), ..., fib(0), כל אחד מחושב פעם אחת, כל אחד עושה O(1) עבודה.</p>
<div class="formula">O(2ⁿ) → O(n)</div>
<p>fib(100) לוקח עכשיו מיקרו-שניות במקום יותר מגיל היקום. אותה צורת קוד, dictionary אחד.</p>`
        },
        {
          type: 'mcq', q: 'מה סיבוכיות הזמן של fib(n) עם memoization?',
          choices: ['O(1)', 'O(log n)', 'O(n)', 'O(2ⁿ)'],
          answer: 2,
          explain: `יש n+1 תת-בעיות שונות (fib(0)..fib(n)), כל אחת מחושבת פעם אחת עם O(1) עבודה (חיבור ועוד בדיקות ב-cache). סך הכול O(n).`
        },
        {
          type: 'learn', title: 'Python עושה את זה בשבילכם',
          html: `<pre><code>from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n &lt; 2:
        return n
    return fib(n - 1) + fib(n - 2)</code></pre>
<p>(<code>functools.cache</code> זה אותו דבר, רק קצר יותר.) ה-decorator עוטף את הפונקציה שלכם ב-dict שהמפתח שלו הוא הארגומנטים.</p>
<div class="callout">Memoization עובד רק על פונקציות <b>pure</b> (טהורות): אותו input → אותו output, בלי side effects.</div>
<div class="dev">אותו כלל כמו HTTP caching: אפשר לעשות cache ל-GET /users/42, אבל cache ל-POST /payments יהיה... אינסידנט. ואם המידע מאחורי זה משתנה, צריך invalidation. פונקציות pure אף פעם לא צריכות invalidation, ובגלל זה memoization כל כך קל.</div>`
        },
        {
          type: 'tf', q: 'בטוח לעשות memoization לפונקציה שמחזירה את השעה הנוכחית.',
          answer: false,
          explain: `ה-output תלוי במשהו שהוא לא הארגומנטים, אז היא לא pure. גרסה עם memoization תחזיר את השעה הראשונה לנצח. באג stale-cache קלאסי.`
        },
        {
          type: 'learn', title: 'המתכון: dynamic programming',
          html: `<p>Memoization עובד כשלבעיה יש שתי תכונות:</p>
<ol><li><b>Optimal substructure</b> (תת-מבנה אופטימלי): התשובה נבנית מתשובות לתת-בעיות קטנות יותר.</li>
<li><b>Overlapping subproblems</b> (תת-בעיות חופפות): אותן תת-בעיות קטנות צצות שוב ושוב.</li></ol>
<p>בעיות עם שתי התכונות נפתרות עם <b>dynamic programming (DP)</b> (תכנון דינמי). רקורסיה עם memoization נקראת <b>top-down DP</b>.</p>
<div class="fun">🤓 עובדה משעשעת: ריצ'רד בלמן בחר את השם "dynamic programming" בשנות ה-50, בין היתר כי זה נשמע מרשים והמממנים שלו היו אלרגיים למילה "מחקר". "Programming" אז היה תכנון/טבלאות, לא קוד.</div>`
        },
        {
          type: 'mcq', q: 'Merge sort מפצל את המערך לחצאים שאף פעם לא חופפים. האם memoization ל-merge sort יעזור?',
          choices: ['כן, זה יהפוך אותו ל-O(n)', 'לא, כל תת-בעיה נפתרת רק פעם אחת בכל מקרה', 'כן, זה יהפוך אותו ל-O(log n)'],
          answer: 1,
          explain: `התת-בעיות של merge sort לא חופפות: כל תת-מערך ממוין בדיוק פעם אחת. ה-cache לא יקבל אף hit. Memoization צריך תת-בעיות חופפות כדי להשתלם.`
        },
        {
          type: 'input', q: 'fib(30) עם memoization: כמה ערכים שונים נשמרים בסוף ב-memo (נשמרים fib(2) עד fib(30), ה-base cases לא נשמרים)?',
          answer: ['29', 'twenty-nine', 'twenty nine', 'עשרים ותשע', 'עשרים ותשעה'], placeholder: 'מספר',
          explain: `fib(2), fib(3), ..., fib(30): זה 30 − 2 + 1 = 29 רשומות. לינארי ב-n, לעומת בערך 2.7 מיליון קריאות בלי ה-cache.`
        },
        {
          type: 'mcq', q: 'ה-dict של memo עולה זיכרון נוסף. איזו עסקת מקום/זמן עשינו עכשיו עבור fib?',
          choices: ['O(n) זיכרון נוסף כדי לעבור מזמן אקספוננציאלי ללינארי', 'O(2ⁿ) זיכרון כדי לחסוך O(n) זמן', 'בלי זיכרון נוסף בכלל'],
          answer: 0,
          explain: `אנחנו שומרים בערך n ערכים כדי להימנע מחישוב-מחדש אקספוננציאלי. קצת RAM תמורת הרבה CPU: העסקה האוניברסלית של caching.`
        }
      ]
    },

    // ───────────────────────────── Lesson 4 ─────────────────────────────
    {
      id: 'bottom-up-dp',
      title: 'טבלאות DP מלמטה למעלה (Bottom-Up)',
      emoji: '📊',
      steps: [
        {
          type: 'learn', title: 'הופכים את זה: ממלאים טבלה מלמטה',
          html: `<p>Top-down: מתחילים ב-fib(n), יורדים ברקורסיה, שומרים ב-cache בדרך. <b>Bottom-up</b>: מתחילים מה-base cases וממלאים טבלה כלפי מעלה, כך שכל תשובה שצריך כבר מחכה שם.</p>
<pre><code>def fib(n):
    dp = [0, 1] + [0] * (n - 1)
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]</code></pre>
<p>בלי רקורסיה, בלי stack overflow, בלי dict. רק לולאה ומערך.</p>
<div class="dev">Top-down זה cache-aside עצלן (מחשבים לפי דרישה). Bottom-up זה materialized view מחושב מראש: ממלאים הכול לפי הסדר, ואז קוראים.</div>`
        },
        {
          type: 'learn', title: 'עולים במדרגות',
          html: `<p>שאלת ראיון קלאסית: לגרם מדרגות יש n מדרגות. אפשר לעלות <b>1 או 2</b> מדרגות בכל פעם. בכמה דרכים שונות אפשר להגיע למעלה?</p>
<p>תחשבו על הצעד <i>האחרון</i> שלכם. הגעתם למדרגה n או ממדרגה n−1 (צעד של 1) או ממדרגה n−2 (צעד של 2). לכן:</p>
<div class="formula">ways(n) = ways(n−1) + ways(n−2)</div>
<p>עם ways(1) = 1 ו-ways(2) = 2 (1+1 או 2).</p>
<table><tr><th>n</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr>
<tr><th>ways</th><td>1</td><td>2</td><td>3</td><td>5</td><td>8</td></tr></table>
<p>הפתעה: זה פיבונאצ'י עם כובע.</p>`
        },
        {
          type: 'input', q: 'בעזרת ways(n) = ways(n−1) + ways(n−2), בכמה דרכים אפשר לעלות 6 מדרגות?',
          answer: ['13', 'thirteen', 'שלוש עשרה', 'שלושה עשר'], placeholder: 'מספר',
          explain: `ways(5) = 8 ו-ways(4) = 5, אז ways(6) = 8 + 5 = 13.`
        },
        {
          type: 'tf', q: 'fib בגרסת bottom-up קורא רק את שתי הרשומות האחרונות, אז אפשר להחליף את כל המערך בשני משתנים ולהשתמש ב-O(1) מקום.',
          answer: true,
          explain: `שומרים prev ו-curr, ושוב ושוב עושים prev, curr = curr, prev + curr. עדיין O(n) זמן, עכשיו O(1) זיכרון. הרבה טבלאות DP אפשר לכווץ ככה כשכל שורה תלויה רק בקודמת.`
        },
        {
          type: 'learn', title: 'Coin change: כמה שפחות מטבעות',
          html: `<p>מטבעות {1, 3, 4}. מה המספר הקטן ביותר של מטבעות שמרכיבים סכום A?</p>
<p>המטבע האחרון שמשתמשים בו הוא 1, 3 או 4. לכן:</p>
<div class="formula">best(A) = 1 + min(best(A−1), best(A−3), best(A−4))</div>
<p>(מדלגים על מטבעות גדולים מ-A), עם best(0) = 0. ממלאים את הטבלה משמאל לימין:</p>
<table><tr><th>A</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr>
<tr><th>best</th><td>0</td><td>1</td><td>2</td><td>1</td><td>1</td><td>2</td><td>?</td></tr></table>
<p>דוגמה: best(5) = 1 + min(best(4), best(2), best(1)) = 1 + min(1, 2, 1) = 2 (4+1).</p>`
        },
        {
          type: 'input', q: 'מטבעות {1, 3, 4}: מה זה best(6), המספר הקטן ביותר של מטבעות שמרכיבים 6?',
          answer: ['2', 'two', 'שתיים', 'שניים', 'שני'], placeholder: 'מספר',
          explain: `best(6) = 1 + min(best(5), best(3), best(2)) = 1 + min(2, 1, 2) = 2. המטבעות הם 3 + 3. תזכרו את זה: זה יחזור לרדוף אלגוריתם greedy בשיעור הבא.`
        },
        {
          type: 'learn', title: 'Edit distance: האלגוריתם שמאחורי diff',
          html: `<p>כמה פעולות של <b>הוספה / מחיקה / החלפה</b> של תו בודד הופכות מחרוזת אחת לאחרת? זה ה-<b>edit distance</b> (מרחק Levenshtein).</p>
<p><code>kitten → sitten → sittin → sitting</code>: 3 עריכות.</p>
<p>טבלת DP: <code>d[i][j]</code> = ה-edit distance בין i התווים הראשונים של A ל-j התווים הראשונים של B. אם התווים זהים, <code>d[i][j] = d[i−1][j−1]</code>. אחרת:</p>
<div class="formula">1 + min(delete d[i−1][j], insert d[i][j−1], replace d[i−1][j−1])</div>
<p>גודל הטבלה (m+1) × (n+1), אז <b>O(m·n)</b> זמן.</p>
<div class="dev">אתם משתמשים בזה כל יום: <code>git diff</code> ו-<code>diff</code> פותרים בן דוד קרוב (longest common subsequence / האלגוריתם של Myers). ה-"Did you mean <i>git status</i>?" כשאתם מקלידים <code>git stauts</code> זה edit distance שבוחר את הפקודה הכי קרובה.</div>`
        },
        {
          type: 'mcq', q: 'מה ה-edit distance בין "cat" ל-"cut"?',
          choices: ['0', '1', '2', '3'],
          answer: 1,
          explain: `מחליפים את 'a' ב-'u'. פעולה אחת.`
        },
        {
          type: 'input', q: 'מה ה-edit distance בין "flaw" ל-"lawn"?',
          answer: ['2', 'two', 'שתיים', 'שניים'], placeholder: 'מספר',
          explain: `מוחקים את ה-'f' בהתחלה (→ "law"), ואז מוסיפים 'n' בסוף (→ "lawn"). 2 עריכות, ואי אפשר לעשות את זה ב-1 כי המחרוזות שונות בשני הקצוות.`
        },
        {
          type: 'order', q: 'סדרו את השלבים לתכנון פתרון DP בגישת bottom-up.',
          items: ['להגדיר מה זו תת-בעיה (למשל best(A) = הכי מעט מטבעות לסכום A)', 'לכתוב את נוסחת הנסיגה (recurrence) שמקשרת אותה לתת-בעיות קטנות יותר', 'למלא את ה-base cases', 'לעבור בלולאה על התת-בעיות מהקטנה לגדולה ולמלא את הטבלה', 'לקרוא את התשובה הסופית מהטבלה'],
          explain: `מגדירים את ה-state, כותבים את ה-recurrence, זורעים את ה-base cases, ממלאים לפי סדר התלויות, קוראים את התשובה. המתכון הזה פותר כמות מדהימה של בעיות.`
        }
      ]
    },

    // ───────────────────────────── Lesson 5 ─────────────────────────────
    {
      id: 'greedy',
      title: 'אלגוריתמים חמדנים (Greedy) ומתי הם משקרים',
      emoji: '🤑',
      steps: [
        {
          type: 'learn', title: 'תחטפו את הדבר הכי טוב עכשיו',
          html: `<p><b>Greedy algorithm</b> (אלגוריתם חמדן) עושה את הבחירה שנראית הכי טובה <i>ברגע זה</i> ולא חוזר בו לעולם.</p>
<p>נותנים עודף במטבעות אמריקאיים (25, 10, 5, 1)? חוטפים את המטבע הכי גדול שנכנס, וחוזר חלילה. 63¢ = 25+25+10+1+1+1. שישה מטבעות, וזה אופטימלי.</p>
<div class="callout">Greedy מהיר ופשוט: בלי טבלה, בלי backtracking. הקאץ': הוא נכון רק לבעיות עם המבנה המתאים.</div>
<div class="dev">ככה עובדים רוב ה-schedulers. ה-scheduler של Kubernetes נותן ציון ל-nodes ומציב כל pod על ה-node עם הציון הכי טוב ברגע זה. הוא אף פעם לא מזיז pods קודמים כדי להגיע לסידור כללי טוב יותר (בשביל זה יש את ה-descheduler!).</div>`
        },
        {
          type: 'learn', title: 'Greedy נכשל: מלכודת המטבעות',
          html: `<p>עכשיו קחו מטבעות <b>{1, 3, 4}</b> ותרכיבו <b>6</b>.</p>
<ul><li><b>Greedy:</b> לוקחים 4 (הכי גדול שנכנס), אז 1, אז 1. <b>3 מטבעות.</b></li>
<li><b>אופטימלי (DP):</b> 3 + 3. <b>2 מטבעות.</b></li></ul>
<p>לחטוף את ה-4 הרגיש מעולה, אבל זה נעל אותנו על סכום גרוע יותר. Greedy לא יכול לבטל בחירה.</p>
<div class="callout">Greedy עובד כשבחירה שהיא הכי טובה מקומית היא תמיד חלק מ<i>איזשהו</i> פתרון אופטימלי גלובלי (ה-"greedy choice property"). אחרת צריך DP או חיפוש.</div>`
        },
        {
          type: 'mcq', q: 'מטבעות {1, 5, 6, 9}, סכום 11. Greedy בוחר 9 + 1 + 1. במה משתמש פתרון אופטימלי?',
          choices: ['9 + 1 + 1 (3 מטבעות, greedy אופטימלי)', '6 + 5 (2 מטבעות)', '5 + 5 + 1 (3 מטבעות)', '6 + 1 + 1 + 1 + 1 + 1 (6 מטבעות)'],
          answer: 1,
          explain: `6 + 5 = 11 עם 2 מטבעות בלבד. ה-9 של greedy היה מלכודת שהשאירה שארית של 2 שרק אחדים יכולים לכסות.`
        },
        {
          type: 'tf', q: 'אם אלגוריתם greedy עובד לסט אחד של ערכי מטבעות, הוא עובד לכל ערכי המטבעות.',
          answer: false,
          explain: `זה תלוי בערכי המטבעות. המטבעות האמריקאיים {1, 5, 10, 25} במקרה "קנוניים" (greedy אופטימלי), אבל {1, 3, 4} לא. DP עובד לכל סט.`
        },
        {
          type: 'learn', title: 'איפה greedy מנצח: interval scheduling',
          html: `<p>חדר ישיבות אחד, ערימה של בקשות לפגישות (התחלה, סוף). תזמינו את <b>המספר המקסימלי</b> של פגישות שלא חופפות.</p>
<p>כללי greedy מפתים ש<b>נכשלים</b>:</p>
<ul><li>הפגישה הקצרה ביותר קודם (פגישה קצרה יכולה לחפוף לשתיים אחרות).</li>
<li>ההתחלה המוקדמת ביותר קודם (פגישה של יום שלם מתחילה ראשונה וחוסמת הכול).</li></ul>
<p>הכלל ש<b>מוכח כאופטימלי</b>:</p>
<div class="callout">ממיינים לפי <b>זמן סיום</b>. בוחרים את הפגישה שמסתיימת הכי מוקדם, זורקים את כל מה שחופף לה, וחוזר חלילה.</div>
<p>לסיים מוקדם משאיר הכי הרבה מקום לכל השאר. מיון + מעבר אחד = O(n log n).</p>`
        },
        {
          type: 'learn', title: 'נסו בעצמכם',
          html: `<p>פגישות (התחלה–סוף):</p>
<table><tr><th>A</th><td>1–4</td></tr><tr><th>B</th><td>3–5</td></tr><tr><th>C</th><td>0–6</td></tr><tr><th>D</th><td>5–7</td></tr><tr><th>E</th><td>3–9</td></tr><tr><th>F</th><td>5–9</td></tr><tr><th>G</th><td>6–10</td></tr><tr><th>H</th><td>8–11</td></tr></table>
<p>הסיום המוקדם ביותר הוא A (נגמרת ב-4): לוקחים. הפגישה הבאה שמתחילה ב-4 או אחרי ומסתיימת הכי מוקדם היא D (5–7): לוקחים. הבאה שמתחילה ב-7 או אחרי: H (8–11). לוקחים.</p>
<p>התוצאה: A, D, H. שלוש פגישות, ואין לוח זמנים שמכניס ארבע.</p>`
        },
        {
          type: 'mcq', q: 'פגישות: X 0–10, Y 1–3, Z 4–6. איזה כלל greedy נותן כאן תשובה שגויה?',
          choices: ['זמן סיום מוקדם ביותר קודם', 'זמן התחלה מוקדם ביותר קודם', 'שניהם נותנים 2 פגישות'],
          answer: 1,
          explain: `התחלה מוקדמת בוחרת את X (0–10), שחוסמת את Y ואת Z: רק פגישה אחת. סיום מוקדם בוחר את Y (נגמרת ב-3), ואז את Z (נגמרת ב-6): 2 פגישות, האופטימום.`
        },
        {
          type: 'learn', title: 'Greedy מול DP: שליף',
          html: `<table><tr><th></th><th>Greedy</th><th>DP</th></tr>
<tr><td>בחירות</td><td>אחת, אף פעם לא חוזרים אליה</td><td>מנסה את כולן, שומר את הטובה ביותר</td></tr>
<tr><td>מהירות</td><td>לרוב הכי מהיר</td><td>איטי יותר, משתמש בטבלה</td></tr>
<tr><td>נכון?</td><td>רק עם ה-greedy-choice property</td><td>בכל פעם שתת-בעיות חופפות ומתחברות</td></tr></table>
<p>ניצחונות greedy מפורסמים: המסלולים הקצרים של Dijkstra, דחיסת Huffman (gzip!), עצים פורשים מינימליים של Kruskal/Prim (ביחידה הבאה).</p>
<div class="dev">בתרגום להרגלי אינסידנטים: greedy זה "לתקן קודם את ה-alert הכי רועש". לרוב זה בסדר! אבל לפעמים ה-root cause הוא alert שקט, והתיקון ה"ברור" מאריך את כל ה-outage.</div>`
        },
        {
          type: 'order', q: 'הפעילו "סיום מוקדם ביותר קודם" על הפגישות P 1–3, Q 2–5, R 3–6, S 6–8, T 7–9 (פגישה יכולה להתחיל בדיוק כשאחרת נגמרת). סדרו את הפגישות ש-greedy בוחר לפי הסדר שבו הוא בוחר אותן.',
          items: ['P (1–3)', 'R (3–6)', 'S (6–8)'],
          explain: `ממוין לפי סיום: P(3), Q(5), R(6), S(8), T(9). לוקחים את P. Q מתחילה ב-2, לפני ש-P נגמרת: מדלגים. R מתחילה ב-3: לוקחים. S מתחילה ב-6: לוקחים. T מתחילה ב-7, לפני ש-S נגמרת ב-8: מדלגים. שלוש פגישות: P, R, S.`
        }
      ]
    },

    // ───────────────────────────── Lesson 6 ─────────────────────────────
    {
      id: 'backtracking',
      title: 'Divide & Conquer ו-Backtracking',
      emoji: '♛',
      steps: [
        {
          type: 'learn', title: 'Divide & conquer, תזכורת',
          html: `<p>שלושה מהלכים:</p>
<ol><li><b>Divide</b> (הפרד): מחלקים את הבעיה לחלקים קטנים ובלתי תלויים.</li>
<li><b>Conquer</b> (משול): פותרים כל חלק ברקורסיה.</li>
<li><b>Combine</b> (צרף): מחברים את התשובות.</li></ol>
<p>Merge sort: חותכים לחצי, ממיינים כל חצי, ממזגים. Binary search: מסתכלים באמצע, נכנסים ברקורסיה לחצי אחד. החלקים <i>לא חופפים</i>, וזה מה שמבדיל את זה מ-DP.</p>
<div class="dev">זה MapReduce, זה Spark, וזו כל שאילתה של "fan out ל-N shards ואז aggregate". Elasticsearch מפזר חיפוש ל-shards (divide/conquer) וה-coordinating node ממזג את התוצאות (combine).</div>`
        },
        {
          type: 'mcq', q: 'Merge sort: שני חצאים, ואז O(n) עבודת מיזוג. הפתרון של T(n) = 2T(n/2) + n הוא...',
          choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
          answer: 1,
          explain: `יש log₂ n רמות של חיתוך לחצי, וכל רמה עושה n עבודת מיזוג בסך הכול על פני כל החלקים שלה. n × log n.`
        },
        {
          type: 'learn', title: 'Backtracking: לנסות, לבדוק, לבטל',
          html: `<p>לחלק מהבעיות אין קיצור דרך חכם: חייבים <b>לחפש</b> בין בחירות. <b>Backtracking</b> בונה פתרון בחירה אחרי בחירה, וברגע שפתרון חלקי שובר חוק, הוא <b>מבטל</b> את הבחירה האחרונה ומנסה את הבאה.</p>
<pre><code>def solve(state):
    if is_complete(state):
        record(state); return
    for choice in options(state):
        if is_valid(state, choice):
            apply(state, choice)
            solve(state)
            undo(state, choice)   # backtrack</code></pre>
<div class="callout">מהלך הכוח הוא <b>pruning</b> (גיזום): לנטוש ענף מת מוקדם במקום לסיים אותו.</div>`
        },
        {
          type: 'learn', title: 'N-queens',
          html: `<p>מציבים N מלכות שחמט על לוח N×N כך ששתיים מהן לא מאיימות זו על זו (בלי שורה, עמודה או אלכסון משותפים).</p>
<p>Backtracking: מציבים מלכה אחת בכל שורה. בכל שורה מנסים כל עמודה; אם היא מאוימת, מדלגים. אם בשורה אין אף עמודה בטוחה, חוזרים למעלה ומזיזים את המלכה הקודמת.</p>
<svg viewBox="0 0 120 120" width="120" style="max-width:120px">
<g fill="currentColor" opacity="0.12"><rect x="30" y="0" width="30" height="30"/><rect x="90" y="0" width="30" height="30"/><rect x="0" y="30" width="30" height="30"/><rect x="60" y="30" width="30" height="30"/><rect x="30" y="60" width="30" height="30"/><rect x="90" y="60" width="30" height="30"/><rect x="0" y="90" width="30" height="30"/><rect x="60" y="90" width="30" height="30"/></g>
<rect x="0" y="0" width="120" height="120" fill="none" stroke="currentColor"/>
<g fill="var(--accent)" font-size="22" text-anchor="middle"><text x="45" y="23">♛</text><text x="105" y="53">♛</text><text x="15" y="83">♛</text><text x="75" y="113">♛</text></g></svg>
<p>אחד משני הפתרונות היחידים ללוח 4×4. ללוח 8×8 יש 92 פתרונות. פותרי סודוקו עובדים בדיוק באותה צורה: ממלאים משבצת, בודקים חוקים, עושים backtrack כשיש התנגשות.</p>`
        },
        {
          type: 'tf', q: 'Backtracking יכול לדלג על חלקים עצומים ממרחב החיפוש כי הוא נוטש פתרון חלקי ברגע שהוא שובר חוק.',
          answer: true,
          explain: `זה pruning. ב-8 מלכות, לנסות בעיוורון כל הצבה של 8 מלכות על 64 משבצות זה בערך 4.4 מיליארד קומבינציות; backtracking שורה אחרי שורה בודק רק כמה אלפי nodes.`
        },
        {
          type: 'learn', title: 'יצירת פרמוטציות',
          html: `<p>כל הסידורים של [A, B, C]: בוחרים איבר ראשון, ואז מייצרים ברקורסיה פרמוטציות של השאר.</p>
<pre><code>def perms(items, path=[]):
    if not items:
        print(path); return
    for i, x in enumerate(items):
        perms(items[:i] + items[i+1:], path + [x])</code></pre>
<p>הפלט: ABC, ACB, BAC, BCA, CAB, CBA. 3 בחירות, אז 2, אז 1: <b>3! = 6</b>. עבור n פריטים יש n! סידורים, וזה גדל אפילו מהר יותר מ-2ⁿ.</p>
<div class="dev">בגלל זה "בואו פשוט ננסה כל סדר deploy של 15 ה-services שלנו" זו לא תוכנית: 15! ≈ 1.3 טריליון. כלים אמיתיים משתמשים בגרף התלויות במקום (topological sort, ביחידה הבאה).</div>`
        },
        {
          type: 'input', q: 'כמה פרמוטציות perms() מדפיסה עבור רשימה של 4 פריטים שונים?',
          answer: ['24', 'twenty-four', 'twenty four', '4!', 'עשרים וארבע', 'עשרים וארבעה'], placeholder: 'מספר',
          explain: `4! = 4 × 3 × 2 × 1 = 24. ארבע בחירות לראשון, שלוש לשני, שתיים לשלישי, ואחת לאחרון.`
        },
        {
          type: 'mcq', q: 'איזו טכניקה מתאימה הכי טוב: "למצוא את הדרך הזולה ביותר לחתוך מוט, כשאותם תת-אורכים חוזרים שוב ושוב בחישוב"?',
          choices: ['Divide & conquer (חלקים בלתי תלויים)', 'Dynamic programming (תת-בעיות חופפות)', 'Backtracking (חיפוש עם pruning)', 'Greedy (לחטוף את החתיכה הכי גדולה)'],
          answer: 1,
          explain: `"אותם תת-אורכים חוזרים שוב ושוב" זו החתימה של תת-בעיות חופפות. שומרים אותן ב-cache: dynamic programming.`
        },
        {
          type: 'order', q: 'סדרו מהגדילה המהירה ביותר (הכי גרועה) לאיטית ביותר, לפי מספר הדברים שחיפוש נאיבי צריך לנסות.',
          items: ['n! (כל הסידורים של n פריטים)', '2ⁿ (כל תת-הקבוצות של n פריטים)', 'n² (כל הזוגות של n פריטים)', 'n log n (מיון n פריטים)'],
          explain: `n! עוקף את 2ⁿ עבור n ≥ 4 (למשל 10! = 3,628,800 לעומת 2¹⁰ = 1024). פולינומים כמו n² הרבה יותר מאולפים, ו-n log n מאולף עוד יותר.`
        }
      ]
    }
  ]
});
