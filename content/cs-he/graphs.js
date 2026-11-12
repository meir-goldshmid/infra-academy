CQ.unitHe({
  id: 'graphs',
  order: 10,
  title: 'גרפים ואלגוריתמים על גרפים',
  emoji: '🕸️',
  color: '#0ca678',
  tagline: 'התשתית שלכם הייתה גרף כל הזמן הזה',
  lessons: [
    // ───────────────────────────── Lesson 1 ─────────────────────────────
    {
      id: 'graph-basics',
      title: 'נקודות, קווים ודרגות',
      emoji: '🔵',
      steps: [
        {
          type: 'learn', title: 'גרף זה נקודות וקווים',
          html: `<p><b>גרף</b> (graph) הוא קבוצה של <b>צמתים</b> (vertices, או nodes, הנקודות) ו-<b>קשתות</b> (edges, הקווים שמחברים זוגות שלהם). זהו. אין שום קשר לגרף עמודות.</p>
<svg viewBox="0 0 210 120" width="100%" style="max-width:260px" font-size="14" text-anchor="middle">
<g stroke="currentColor" stroke-width="2"><line x1="30" y1="25" x2="130" y2="25"/><line x1="30" y1="25" x2="80" y2="95"/><line x1="130" y1="25" x2="80" y2="95"/><line x1="80" y1="95" x2="180" y2="95"/></g>
<g fill="var(--accent)"><circle cx="30" cy="25" r="14"/><circle cx="130" cy="25" r="14"/><circle cx="80" cy="95" r="14"/><circle cx="180" cy="95" r="14"/></g>
<g fill="#fff" font-weight="bold"><text x="30" y="30">A</text><text x="130" y="30">B</text><text x="80" y="100">C</text><text x="180" y="100">D</text></g></svg>
<p>כאן: V = {A, B, C, D} ו-E = {A–B, A–C, B–C, C–D}. כותבים |V| = 4 ו-|E| = 4.</p>
<div class="dev">אתם כבר חיים בתוך גרפים: microservices (מי קורא למי), טופולוגיית רשת (נתבים ולינקים), commits ב-Git (מצביעים להורים), resources ב-Terraform (תלויות), follows ברשתות חברתיות, foreign keys בין טבלאות ב-Postgres.</div>`
        },
        {
          type: 'learn', title: 'טעמים של גרפים',
          html: `<ul><li><b>Undirected</b> (לא מכוון): קשתות הולכות לשני הכיוונים. A–B אומר גם B–A. (כבל רשת, חברות בפייסבוק.)</li>
<li><b>Directed</b> (מכוון, digraph): לקשתות יש חצים. A→B לא גורר B→A. (service A קורא ל-service B; אתם עוקבים אחרי מישהו ב-X.)</li>
<li><b>Weighted</b> (ממושקל): על הקשתות יש מספר: latency, עלות, מרחק, bandwidth.</li></ul>
<div class="dev">מפת service mesh ב-Kiali או service map ב-Datadog היא גרף <b>מכוון וממושקל</b>: החצים מראים את כיוון הקריאה, המשקלים מראים requests/sec או p99 latency.</div>`
        },
        {
          type: 'mcq', q: 'מה הכי טבעי למדל כגרף מכוון (DIRECTED)?',
          choices: ['כבלי Ethernet בין switches', 'מודולים ב-Python והמודולים שהם עושים להם import', 'שני אנשים שהם חברים בפייסבוק', 'כבישים שכולם דו-סטריים'],
          answer: 1,
          explain: `"a עושה import ל-b" לא אומר "b עושה import ל-a". ליחס יש כיוון, אז זו קשת מכוונת. כבלים, חברות הדדית וכבישים דו-סטריים הם סימטריים: לא מכוונים.`
        },
        {
          type: 'learn', title: 'דרגה (Degree)',
          html: `<p>ה-<b>degree</b> (דרגה) של צומת הוא כמה קשתות נוגעות בו. בתמונה למעלה: ל-A דרגה 2, ל-B דרגה 2, ל-C דרגה 3, ל-D דרגה 1.</p>
<p>תחברו: 2 + 2 + 3 + 1 = <b>8</b>. מספר הקשתות: <b>4</b>. צירוף מקרים?</p>
<div class="formula">∑ deg(v) = 2 · |E|</div>
<p>זו <b>handshake lemma</b> (למת לחיצות הידיים): לכל קשת יש שני קצוות, אז כל קשת מוסיפה בדיוק 1 לדרגה של <i>שני</i> צמתים. במסיבה, סך לחיצות הידיים כשסופרים לפי כל אדם הוא פי שניים ממספר לחיצות הידיים.</p>`
        },
        {
          type: 'input', q: 'ברשת יש 10 switches, וסכום הדרגות (מספר הכבלים) של כל ה-switches הוא 30. כמה כבלים יש?',
          answer: ['15', 'fifteen', 'חמש עשרה', 'חמישה עשר'], placeholder: 'מספר',
          explain: `סכום הדרגות = 2 × מספר הקשתות, אז מספר הקשתות = 30 / 2 = 15.`
        },
        {
          type: 'tf', q: 'אפשר לבנות גרף לא מכוון שבו בדיוק ל-3 צמתים יש דרגה אי-זוגית.',
          answer: false,
          explain: `סכום הדרגות הוא 2|E|, תמיד זוגי. שלושה מספרים אי-זוגיים ועוד כל כמות של מספרים זוגיים זה אי-זוגי. לכן מספר הצמתים עם דרגה אי-זוגית תמיד זוגי. מסקנה חמודה מה-handshake lemma!`
        },
        {
          type: 'learn', title: 'In-degree ו-out-degree',
          html: `<p>בגרף מכוון לכל צומת יש <b>in-degree</b> (חצים שנכנסים) ו-<b>out-degree</b> (חצים שיוצאים).</p>
<svg viewBox="0 0 240 120" width="100%" style="max-width:300px" font-size="12" text-anchor="middle">
<defs><marker id="g1arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
<g stroke="currentColor" stroke-width="1.8" marker-end="url(#g1arr)"><line x1="52" y1="25" x2="93" y2="25"/><line x1="140" y1="32" x2="182" y2="83"/><line x1="140" y1="22" x2="182" y2="22"/><line x1="52" y1="95" x2="178" y2="95"/></g>
<g fill="var(--accent)"><rect x="4" y="12" width="48" height="26" rx="6"/><rect x="94" y="12" width="46" height="26" rx="6"/><rect x="183" y="10" width="54" height="26" rx="6"/><rect x="4" y="82" width="48" height="26" rx="6"/><rect x="179" y="82" width="46" height="26" rx="6"/></g>
<g fill="#fff" font-weight="bold"><text x="28" y="29">web</text><text x="117" y="29">api</text><text x="210" y="27">cache</text><text x="28" y="99">worker</text><text x="202" y="99">db</text></g></svg>
<p>api: in-degree 1, out-degree 2. db: in-degree 2, out-degree 0.</p>
<div class="dev">In-degree גבוה = הרבה דברים תלויים בכם = blast radius ענק. זה ה-db שלכם, שירות ה-auth, ה-DNS. Out-degree גבוה = אתם תלויים בהרבה דברים = אתם נופלים בכל פעם שאחד מהם מתעטש.</div>
<p>Handshake בגרף מכוון: ∑ in-degrees = ∑ out-degrees = |E|.</p>`
        },
        {
          type: 'mcq', q: 'בדיאגרמת ה-services שלמעלה, לאיזה צומת יש את ה-in-degree הכי גבוה?',
          choices: ['web', 'api', 'db', 'cache'],
          answer: 2,
          explain: `db מקבל חצים מ-api ומ-worker: in-degree 2. ל-api ול-cache יש in-degree 1, ל-web ול-worker יש 0.`
        },
        {
          type: 'input', q: 'בגרף לא מכוון "שלם" (complete) כל צומת מחובר לכל צומת אחר. כמה קשתות יש בגרף שלם על 6 צמתים?',
          answer: ['15', 'fifteen', 'חמש עשרה', 'חמישה עשר'], placeholder: 'מספר',
          explain: `לכל אחד מ-6 הצמתים יש דרגה 5, אז סכום הדרגות הוא 30, ולפי ה-handshake lemma |E| = 30 / 2 = 15. באופן כללי n(n−1)/2.`
        },
        {
          type: 'learn', title: 'איפה הכול התחיל',
          html: `<div class="fun">🤓 עובדה משעשעת: תורת הגרפים התחילה ב-1736, כשלאונרד אוילר הוכיח שאי אפשר לעבור על כל שבעת הגשרים של קניגסברג בדיוק פעם אחת. הטיעון שלו? דרגות! הליכה שעוברת על כל קשת פעם אחת צריכה 0 או 2 צמתים עם דרגה אי-זוגית, ובקניגסברג היו 4.</div>
<p>אותו היגיון אומר לכם אם טכנאי רשת יכול לעקוב אחרי כל כבל בבניין בדיוק פעם אחת בלי לחזור על עקבותיו.</p>`
        },
        {
          type: 'tf', q: 'בגרף מכוון, סכום כל ה-in-degrees תמיד שווה לסכום כל ה-out-degrees.',
          answer: true,
          explain: `כל חץ יוצא מבדיוק צומת אחד ונכנס לבדיוק צומת אחד, אז שני הסכומים שווים ל-|E|.`
        }
      ]
    },

    // ───────────────────────────── Lesson 2 ─────────────────────────────
    {
      id: 'representations',
      title: 'איך שומרים גרף בזיכרון',
      emoji: '🗄️',
      steps: [
        {
          type: 'learn', title: 'אפשרות 1: adjacency list',
          html: `<p>לכל צומת שומרים רשימה של השכנים שלו. dict של רשימות:</p>
<pre><code>graph = {
  'A': ['B', 'C'],
  'B': ['A', 'C'],
  'C': ['A', 'B', 'D'],
  'D': ['C'],
}</code></pre>
<p>(זה גרף A-B-C-D מהשיעור הקודם.) זיכרון: רשומה אחת לכל צומת ועוד אחת לכל קצה של קשת: <b>O(V + E)</b>.</p>
<div class="dev">ככה רוב המערכות האמיתיות שומרות גרפים: רשימת <code>depends_on</code> על כל resource ב-Terraform, רשימת ה-<code>parents</code> בכל אובייקט commit ב-Git, שורות ה-<code>import</code> בראש כל קובץ Python.</div>`
        },
        {
          type: 'learn', title: 'אפשרות 2: adjacency matrix',
          html: `<p>טבלה של V × V: בשורה u ועמודה v יש 1 אם יש קשת u–v.</p>
<table><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
<tr><th>A</th><td>0</td><td>1</td><td>1</td><td>0</td></tr>
<tr><th>B</th><td>1</td><td>0</td><td>1</td><td>0</td></tr>
<tr><th>C</th><td>1</td><td>1</td><td>0</td><td>1</td></tr>
<tr><th>D</th><td>0</td><td>0</td><td>1</td><td>0</td></tr></table>
<p>בגרף לא מכוון היא סימטרית סביב האלכסון. בגרף ממושקל שומרים את המשקל במקום 1.</p>
<p>זיכרון: <b>O(V²)</b> לא משנה כמה מעט קשתות יש.</p>`
        },
        {
          type: 'input', q: 'כמה אחדות (1) יש ב-adjacency matrix שלמעלה?',
          answer: ['8', 'eight', 'שמונה'], placeholder: 'מספר',
          explain: `כל קשת לא מכוונת מופיעה פעמיים (שורה u עמודה v, וגם שורה v עמודה u). 4 קשתות × 2 = 8. ה-handshake lemma מכה שוב: סכומי השורות הם הדרגות.`
        },
        {
          type: 'learn', title: 'Trade-offs',
          html: `<table><tr><th>פעולה</th><th>List</th><th>Matrix</th></tr>
<tr><td>זיכרון</td><td>O(V + E)</td><td>O(V²)</td></tr>
<tr><td>האם u–v זו קשת?</td><td>O(deg u)</td><td>O(1)</td></tr>
<tr><td>לולאה על השכנים של u</td><td>O(deg u)</td><td>O(V)</td></tr></table>
<p>גרף הוא <b>sparse</b> (דליל) כש-E הרבה יותר קטן מ-V² (רוב הגרפים האמיתיים!), ו-<b>dense</b> (צפוף) כש-E קרוב ל-V².</p>
<div class="callout">Sparse → adjacency list. Dense, או שצריך בדיקת קשת מיידית → matrix.</div>`
        },
        {
          type: 'mcq', q: 'לרשת חברתית יש מיליארד משתמשים עם בערך 200 חברים לכל אחד. איזה ייצוג שפוי?',
          choices: ['Adjacency matrix', 'Adjacency list', 'שניהם משתמשים בערך באותה כמות זיכרון'],
          answer: 1,
          explain: `Matrix צריכה 10⁹ × 10⁹ = 10¹⁸ תאים: גם בביט אחד לתא זה 125 פטה-בייט. ה-list שומרת בערך 10⁹ × 200 רשומות: גדול, אבל אפשרי. גרף מאוד דליל → list.`
        },
        {
          type: 'tf', q: 'ה-adjacency matrix של גרף מכוון תמיד סימטרית.',
          answer: false,
          explain: `אם A→B קיים אבל B→A לא, אז בתא [A][B] יש 1 וב-[B][A] יש 0. רק גרפים לא מכוונים מובטחים להיות סימטריים.`
        },
        {
          type: 'learn', title: 'גרפים בתוך ה-database שלכם',
          html: `<p>ב-Postgres הדרך הקלאסית היא <b>edge table</b>: שורה אחת לכל קשת.</p>
<pre><code>CREATE TABLE edges (src int, dst int, weight int);
CREATE INDEX ON edges (src);  -- fast "neighbours of src"</code></pre>
<p>זה בסך הכול adjacency list, משוטחת. עם ה-index, "תן לי את השכנים של u" זה lookup מהיר, ושאילתות <code>WITH RECURSIVE</code> יכולות לטייל עליה (כן, שוב רקורסיה).</p>
<div class="dev">ה-ownerReferences של Kubernetes (Pod → ReplicaSet → Deployment) הם גרף ששמור כ-edge list על כל אובייקט. ה-garbage collector מטייל על הקשתות האלה כדי לעשות cascade-delete.</div>`
        },
        {
          type: 'mcq', q: 'גרף של 500 nodes שבו כמעט כל זוג nodes מחובר, וה-hot loop שלכם כל הזמן שואל "האם u ו-v מחוברים?". מה הבחירה הכי טובה?',
          choices: ['Adjacency matrix', 'Adjacency list', 'מערך ממוין אחד של כל הצמתים'],
          answer: 0,
          explain: `גרף צפוף (E קרוב ל-V²) ועוד בדיקות קשת בזמן קבוע: ה-sweet spot של ה-matrix. 500 × 500 = 250,000 תאים זה קטנטן.`
        },
        {
          type: 'input', q: 'לגרף לא מכוון יש 100 צמתים ו-300 קשתות. ב-adjacency list, כמה רשומות של שכנים שמורות בסך הכול בכל הרשימות?',
          answer: ['600', 'six hundred', 'שש מאות'], placeholder: 'מספר',
          explain: `כל קשת לא מכוונת u–v נשמרת פעמיים: v ברשימה של u ו-u ברשימה של v. 2 × 300 = 600 רשומות (= סכום הדרגות).`
        }
      ]
    },

    // ───────────────────────────── Lesson 3 ─────────────────────────────
    {
      id: 'bfs-dfs',
      title: 'BFS ו-DFS: איך חוקרים גרף',
      emoji: '🔦',
      steps: [
        {
          type: 'learn', title: 'שתי דרכים לחקור',
          html: `<p>כדי לבקר בכל צומת שאפשר להגיע אליו מצומת התחלה, יש שתי אסטרטגיות קלאסיות:</p>
<ul><li><b>Breadth-first search (BFS)</b> (חיפוש לרוחב): מבקרים קודם בכל השכנים, אחר כך בשכנים שלהם... כמו אדוות שמתפשטות בבריכה. משתמש ב-<b>queue</b> (FIFO).</li>
<li><b>Depth-first search (DFS)</b> (חיפוש לעומק): הולכים במסלול אחד הכי עמוק שאפשר, ואז חוזרים אחורה ומנסים את הענף הבא. כמו מי שחוקר מבוך עם יד אחת על הקיר. משתמש ב-<b>stack</b> (LIFO), או ברקורסיה.</li></ul>
<p>שניהם מחזיקים set של <b>visited</b> כדי לא לעבד צומת פעמיים (בגרפים יש מעגלים; בעצים אין).</p>
<div class="callout">שניהם רצים ב-<b>O(V + E)</b>: כל צומת מבוקר פעם אחת, כל קשת נבדקת פעם אחת (פעמיים אם הגרף לא מכוון).</div>`
        },
        {
          type: 'learn', title: 'BFS בקוד',
          html: `<pre><code>from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        u = queue.popleft()          # FIFO
        print(u)
        for v in graph[u]:
            if v not in visited:
                visited.add(v)
                queue.append(v)</code></pre>
<p>תחליפו את <code>deque.popleft()</code> ב-<code>list.pop()</code> (stack) ותקבלו מעבר איטרטיבי בסגנון DFS. בחירת מבנה הנתונים = אסטרטגיית החיפוש.</p>`
        },
        {
          type: 'widget', widget: 'graph', title: 'הריצו BFS ו-DFS צעד אחרי צעד',
          html: `<p>הריצו BFS, ואז DFS, מאותה נקודת התחלה. תסתכלו על ה-queue מול ה-stack, ואיך BFS מתפרס רמה אחרי רמה בזמן ש-DFS צולל לעומק של ענף אחד.</p>`
        },
        {
          type: 'learn', title: 'גרף לתרגול',
          html: `<p>השתמשו בגרף הזה לשאלות הבאות. מבקרים בשכנים תמיד לפי סדר אלפביתי.</p>
<svg viewBox="0 0 270 120" width="100%" style="max-width:300px" font-size="14" text-anchor="middle">
<g stroke="currentColor" stroke-width="2"><line x1="30" y1="60" x2="100" y2="25"/><line x1="30" y1="60" x2="100" y2="95"/><line x1="100" y1="25" x2="170" y2="25"/><line x1="100" y1="95" x2="170" y2="95"/><line x1="170" y1="25" x2="240" y2="25"/></g>
<g fill="var(--accent)"><circle cx="30" cy="60" r="14"/><circle cx="100" cy="25" r="14"/><circle cx="100" cy="95" r="14"/><circle cx="170" cy="25" r="14"/><circle cx="170" cy="95" r="14"/><circle cx="240" cy="25" r="14"/></g>
<g fill="#fff" font-weight="bold"><text x="30" y="65">A</text><text x="100" y="30">B</text><text x="100" y="100">D</text><text x="170" y="30">E</text><text x="170" y="100">C</text><text x="240" y="30">F</text></g></svg>
<p>קשתות: A–B, A–D, B–E, E–F, D–C.</p>`
        },
        {
          type: 'order', q: 'מתחילים מ-A: סדרו את הצמתים לפי סדר הביקור של BFS.',
          items: ['A', 'B', 'D', 'E', 'C', 'F'],
          explain: `Queue: [A] → מבקרים ב-A, מכניסים לתור את B ו-D. מבקרים ב-B, מכניסים את E. מבקרים ב-D, מכניסים את C. מבקרים ב-E, מכניסים את F. מבקרים ב-C. מבקרים ב-F. רמה אחרי רמה: {A}, {B, D}, {E, C}, {F}.`
        },
        {
          type: 'order', q: 'עכשיו DFS רקורסיבי מ-A (שכנים לפי סדר אלפביתי). סדרו את הצמתים לפי סדר הביקור.',
          items: ['A', 'B', 'E', 'F', 'D', 'C'],
          explain: `A → B (השכן הראשון) → E → F, מבוי סתום. חוזרים אחורה עד A, שהשכן הבא שלו הוא D → C. DFS מסיים ענף אחד לגמרי לפני שהוא מתחיל את הבא.`
        },
        {
          type: 'learn', title: 'BFS מוצא את הכי מעט hops',
          html: `<p>מכיוון ש-BFS מעבד צמתים לפי סדר המרחק (כל מי שבמרחק hop אחד, אז כל מי שבמרחק 2...), הפעם הראשונה שהוא מגיע לצומת היא דרך <b>shortest path</b> (המסלול הקצר ביותר) במספר קשתות.</p>
<div class="dev"><code>traceroute</code> מראה לכם hops. "קשר מדרגה 2" בלינקדאין זה מרחק BFS של 2. Crawler שמכבד "max depth 3" הוא BFS עם הגבלת רמות. וה-garbage collector של Kubernetes שמטייל על ownerReferences? מעבר על גרף.</div>
<p>DFS לא נותן מסלולים קצרים ביותר, אבל הוא מצטיין בחקירה של הכול, בזיהוי מעגלים וב-topological sort (מיד מגיע).</p>`
        },
        {
          type: 'mcq', q: 'אתם רוצים את המספר המינימלי של hops בין services מה-edge gateway עד ל-payments service. איזה מעבר?',
          choices: ['BFS', 'DFS', 'כל אחד מהם: שניהם מוצאים את המסלול הקצר ביותר'],
          answer: 0,
          explain: `BFS חוקר לפי סדר מספר ה-hops, אז הפעם הראשונה שהוא מגיע ל-payments היא דרך מסלול עם מינימום hops. DFS עלול לשוטט קודם במסלול ארוך.`
        },
        {
          type: 'tf', q: 'בלי set של visited, BFS על גרף עם מעגל יכול להיתקע בלולאה לנצח.',
          answer: true,
          explain: `A–B–C–A: מ-A מכניסים לתור את B, מ-B את C, מ-C שוב את A... לנצח. עצים לא צריכים את בדיקת ה-visited כי אין בהם מעגלים; גרפים כלליים כן צריכים.`
        },
        {
          type: 'mcq', q: 'לגרף יש 1,000 צמתים ו-5,000 קשתות, שמור כ-adjacency list. בערך כמה עבודה BFS עושה?',
          choices: ['בערך 1,000 צעדים', 'בערך 6,000 צעדים (V + E)', 'בערך 1,000,000 צעדים (V²)', 'בערך 5,000,000 צעדים (V × E)'],
          answer: 1,
          explain: `O(V + E): כל צומת יוצא מהתור פעם אחת וכל רשומה ב-adjacency נסרקת פעם אחת. (עם matrix זה היה O(V²), כי מציאת השכנים דורשת לסרוק שורה שלמה.)`
        }
      ]
    },

    // ───────────────────────────── Lesson 4 ─────────────────────────────
    {
      id: 'shortest-paths',
      title: 'מסלולים קצרים ביותר ו-Dijkstra',
      emoji: '🗺️',
      steps: [
        {
          type: 'learn', title: 'כשיש לקשתות משקלים',
          html: `<p>BFS סופר hops. אבל מסלול של 3 לינקים מהירים יכול לנצח לינק איטי אחד. עם משקלים צריך את <b>האלגוריתם של Dijkstra</b> (1956).</p>
<p>הרעיון: מחזיקים מרחק זמני לכל צומת (ההתחלה = 0, השאר = ∞). ושוב ושוב:</p>
<ol><li>בוחרים את <b>הצומת שעוד לא סגור עם המרחק הקטן ביותר</b>. עכשיו הוא סופי.</li>
<li>עושים <b>relax</b> לקשתות היוצאות ממנו: אם dist[u] + w(u,v) &lt; dist[v], מעדכנים את dist[v].</li></ol>
<div class="callout">Dijkstra = BFS שבו התור הוא <b>priority queue</b> (min-heap) שממוין לפי מרחק. זה אלגוריתם greedy שמוכח כנכון, כל עוד אין אף קשת עם משקל שלילי.</div>`
        },
        {
          type: 'learn', title: 'הריצו ביד',
          html: `<svg viewBox="0 0 220 135" width="100%" style="max-width:280px" font-size="13" text-anchor="middle">
<defs><marker id="g4arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
<g stroke="currentColor" stroke-width="1.8" marker-end="url(#g4arr)"><line x1="32" y1="58" x2="96" y2="25"/><line x1="32" y1="76" x2="96" y2="110"/><line x1="110" y1="102" x2="110" y2="34"/><line x1="124" y1="25" x2="188" y2="58"/><line x1="124" y1="110" x2="188" y2="76"/></g>
<g fill="var(--accent)"><circle cx="20" cy="67" r="13"/><circle cx="110" cy="20" r="13"/><circle cx="110" cy="115" r="13"/><circle cx="200" cy="67" r="13"/></g>
<g fill="#fff" font-weight="bold"><text x="20" y="72">A</text><text x="110" y="25">B</text><text x="110" y="120">C</text><text x="200" y="72">D</text></g>
<g fill="currentColor" font-weight="bold"><text x="55" y="33">4</text><text x="55" y="107">1</text><text x="122" y="72">2</text><text x="165" y="33">1</text><text x="165" y="107">5</text></g></svg>
<p>מ-A: dist A=0, כל השאר ∞.</p>
<ol><li>סוגרים את <b>A</b>(0). Relax: B=4, C=1.</li>
<li>הקטן ביותר הוא <b>C</b>(1). Relax: B = min(4, 1+2) = 3, D = 1+5 = 6.</li>
<li>הקטן ביותר הוא <b>B</b>(3). Relax: D = min(6, 3+1) = 4.</li>
<li>סוגרים את <b>D</b>(4).</li></ol>`
        },
        {
          type: 'input', q: 'מה המרחק הקצר ביותר מ-A ל-D בגרף הזה?',
          answer: ['4', 'four', 'ארבע', 'ארבעה'], placeholder: 'מספר',
          explain: `A→C→B→D = 1 + 2 + 1 = 4. ה-A→B→D שנראה ישיר עולה 4 + 1 = 5, ו-A→C→D עולה 1 + 5 = 6.`
        },
        {
          type: 'order', q: 'באיזה סדר Dijkstra סוגר את הצמתים של הגרף הזה, כשמתחילים מ-A?',
          items: ['A (0)', 'C (1)', 'B (3)', 'D (4)'],
          explain: `תמיד המרחק הזמני הקטן ביותר הוא הבא: A ב-0, אז C ב-1, אז B (השתפר מ-4 ל-3 דרך C), אז D (השתפר מ-6 ל-4 דרך B).`
        },
        {
          type: 'learn', title: 'הנתבים שלכם מריצים Dijkstra',
          html: `<div class="dev"><b>OSPF</b> (ו-IS-IS), פרוטוקולי הניתוב שבתוך רוב רשתות ה-data center והארגונים, הם פרוטוקולי "link-state": כל נתב מציף את כולם בלינקים שלו ובעלויות שלהם, כך שכל נתב מחזיק את הגרף כולו. ואז כל אחד מריץ <b>Dijkstra</b> (ב-OSPF זה ממש נקרא חישוב SPF, "shortest path first") כדי לבנות את טבלת הניתוב שלו. כשלינק עושה flap, הנתבים מריצים SPF מחדש. על זה בדיוק הטיימרים של "SPF throttling".</div>
<p>גם בטעם Dijkstra: Google Maps (עם האצות כבדות כמו A*), מציאת מסלולים במשחקים, ורעיונות של load balancing שמודע ל-latency.</p>
<p>עם binary heap, Dijkstra רץ ב-<b>O((V + E) log V)</b>.</p>`
        },
        {
          type: 'learn', title: 'טיזר: קשתות שליליות שוברות אותו',
          html: `<p>Dijkstra מניח שברגע שלצומת יש את המרחק הקטן ביותר, שום דבר מאוחר יותר לא ישפר אותו. קשת <b>שלילית</b> שוברת את זה.</p>
<p>קשתות: A→B (2), A→C (3), C→B (−2). Dijkstra סוגר את B על 2 לפני שהוא מסתכל על C. אבל A→C→B = 3 − 2 = <b>1</b>. תשובה שגויה, שנמסרת בביטחון מלא.</p>
<p>התיקון הוא <b>Bellman-Ford</b>: עושים relax ל<i>כל</i> קשת, V−1 פעמים. איטי יותר, O(V·E), אבל מתמודד עם משקלים שליליים ומזהה <b>negative cycles</b> (מעגלים שליליים, שבהם להסתובב לנצח ממשיך להוריד את העלות, אז "הקצר ביותר" חסר משמעות).</p>
<div class="fun">🤓 עובדה משעשעת: RIP, פרוטוקול הניתוב העתיק מסוג "distance-vector", הוא Bellman-Ford מבוזר. משקלים שליליים מופיעים בפיננסים: ארביטראז' של מטבעות זה ממש ציד של מעגל שלילי.</div>`
        },
        {
          type: 'tf', q: 'האלגוריתם של Dijkstra תמיד נותן מסלולים קצרים ביותר נכונים, גם אם לחלק מהקשתות יש משקל שלילי.',
          answer: false,
          explain: `הוא עלול לסגור צומת מוקדם מדי, לפני שמתגלה מסלול זול יותר דרך קשת שלילית. למשקלים שליליים משתמשים ב-Bellman-Ford.`
        },
        {
          type: 'mcq', q: 'לכל הקשתות בגרף שלכם אותו משקל (נגיד 1). מה האלגוריתם הנכון הכי פשוט למסלול קצר ביותר?',
          choices: ['BFS רגיל', 'חייבים Dijkstra', 'חייבים Bellman-Ford', 'DFS'],
          answer: 0,
          explain: `כשכל קשת עולה אותו דבר, הכי מעט hops = המסלול הזול ביותר, ו-BFS מוצא הכי מעט hops ב-O(V + E) בלי heap.`
        },
        {
          type: 'mcq', q: 'איזה מבנה נתונים הופך את Dijkstra ליעיל ב"לבחור את הצומת שעוד לא סגור עם המרחק הקטן ביותר"?',
          choices: ['תור FIFO', 'Stack', 'Min-heap (priority queue)', 'Hash set'],
          answer: 2,
          explain: `Min-heap נותן את האיבר הקטן ביותר ב-O(log V) לפעולה. תור FIFO זה BFS, stack זה DFS.`
        }
      ]
    },

    // ───────────────────────────── Lesson 5 ─────────────────────────────
    {
      id: 'dags-topo',
      title: 'DAGs, Topological Sort ומעגלים',
      emoji: '🧬',
      steps: [
        {
          type: 'learn', title: 'Directed Acyclic Graphs',
          html: `<p><b>DAG</b> הוא גרף מכוון <b>בלי מעגלים</b>: תלכו לפי החצים מכל מקום, ולעולם לא תחזרו לנקודת ההתחלה.</p>
<p>DAGs הם הדרך שבה העולם מבטא <b>תלויות</b>:</p>
<ul><li>Terraform: subnet תלוי ב-VPC (<code>terraform graph</code> ממש מדפיס את זה).</li>
<li>מערכות build: Make, Bazel, Docker multi-stage builds.</li>
<li>Airflow ו-Argo Workflows: DAG של Airflow זה בדיוק זה.</li>
<li>CI pipelines: <code>needs:</code> ב-GitHub Actions, <code>needs:</code> ב-GitLab.</li>
<li>Package managers שפותרים תלויות (apt, npm, pip).</li></ul>`
        },
        {
          type: 'learn', title: 'Git הוא DAG',
          html: `<div class="dev">כל commit ב-Git מצביע על ה-<b>parent(s)</b> שלו. ל-commit רגיל יש parent אחד, ל-commit הראשון בכלל יש 0, ול-merge commit יש 2 (או יותר). החצים תמיד מצביעים אחורה בזמן, אז אי אפשר לחזור בלולאה: זה DAG. Branches הם בסך הכול מצביעים עם שם לתוכו. <code>git log --graph</code> מצייר אותו, ו-<code>git merge-base</code> מוצא את האב המשותף הקרוב ביותר של שני צמתים.</div>
<p>Commits הם content-addressed: ה-hash של commit כולל את ה-hashes של ההורים שלו, אז כדי ליצור מעגל צריך commit שמכיל את ה-hash העתידי של עצמו. בפועל בלתי אפשרי.</p>`
        },
        {
          type: 'tf', q: 'ב-repository של Git, merge commit הוא צומת עם out-degree של 2 או יותר (אם הקשתות מצביעות מהילד להורה).',
          answer: true,
          explain: `Merge commit רושם שני הורים (או יותר, ב-octopus merge), אז יש לו חץ לכל אחד מהם.`
        },
        {
          type: 'learn', title: 'Topological sort',
          html: `<p><b>Topological order</b> (סדר טופולוגי) מסדר את כל הצמתים כך שכל קשת מצביעה <i>קדימה</i>: כל דבר בא אחרי כל מה שהוא תלוי בו. הוא קיים <b>אם ורק אם</b> הגרף הוא DAG.</p>
<p><b>האלגוריתם של Kahn:</b></p>
<ol><li>סופרים את ה-in-degree של כל צומת (מספר התלויות שעוד לא התמלאו).</li>
<li>מכניסים לתור כל צומת עם in-degree 0: הם מוכנים.</li>
<li>שולפים אחד, מוציאים אותו לפלט, ומורידים ב-1 את ה-in-degree של כל מי שהיה תלוי בו. כל מי שמגיע ל-0 מצטרף לתור.</li>
<li>חוזרים. אם נשארו צמתים שאף פעם לא הגיעו ל-0, יש מעגל.</li></ol>
<div class="dev">ככה בדיוק Terraform מתכנן apply: כל מה שאין לו תלויות פתוחות "מוכן" ורץ במקביל (עד <code>-parallelism=10</code> כברירת מחדל). Airflow מתזמן tasks באותה צורה.</div>`
        },
        {
          type: 'order', q: 'Resources ב-Terraform: ה-subnet מפנה ל-VPC, ה-instance מפנה ל-subnet, רשומת ה-DNS מפנה ל-IP של ה-instance. סדרו אותם בסדר יצירה תקין.',
          items: ['aws_vpc', 'aws_subnet', 'aws_instance', 'aws_route53_record'],
          explain: `כל resource חייב להיווצר אחרי זה שהוא מפנה אליו. לשרשרת הזו יש בדיוק סדר טופולוגי אחד. ו-destroy מריץ אותו הפוך!`
        },
        {
          type: 'input', q: 'ל-DAG יש קשתות A→B, A→C, B→D, C→D. כמה סדרים טופולוגיים תקינים שונים יש לו?',
          answer: ['2', 'two', 'שניים', 'שתיים', 'שני'], placeholder: 'מספר',
          explain: `A חייב להיות ראשון ו-D חייב להיות אחרון. B ו-C לא תלויים זה בזה, אז כל אחד מהם יכול לבוא קודם: A,B,C,D או A,C,B,D. צמתים בלתי תלויים = בחירה = מקביליות.`
        },
        {
          type: 'learn', title: 'זיהוי מעגלים',
          html: `<p>מעגל בגרף תלויות הוא תמיד חדשות רעות:</p>
<ul><li>Terraform: <code>Error: Cycle: aws_security_group.a, aws_security_group.b</code></li>
<li>Python: <code>ImportError: cannot import name ... (most likely due to a circular import)</code></li>
<li>Databases: <b>deadlock</b>. טרנזקציה T1 מחכה ל-lock ש-T2 מחזיקה, ו-T2 מחכה ל-T1. Postgres בונה גרף "wait-for" ואחרי <code>deadlock_timeout</code> (שנייה אחת כברירת מחדל) מחפש בו מעגל והורג קורבן אחד.</li></ul>
<p><b>איך מוצאים מעגל עם DFS:</b> מסמנים צמתים כ-unvisited, "in progress" (על מסלול ה-DFS הנוכחי) או done. אם DFS מגיע לצומת <b>in-progress</b>, מצאתם back edge: מעגל.</p>`
        },
        {
          type: 'mcq', q: 'האלגוריתם של Kahn מסתיים אבל הוציא לפלט רק 5 מתוך 8 צמתים. מה זה אומר לכם?',
          choices: ['יש בגרף מעגל', 'הגרף לא קשיר', 'יש בגרף משקלים שליליים', 'לשלושה צמתים אין קשתות'],
          answer: 0,
          explain: `צמתים על מעגל מחכים זה לזה לנצח, אז ה-in-degree שלהם אף פעם לא מגיע ל-0 והם אף פעם לא יוצאים לפלט. חלקים לא קשירים או צמתים מבודדים זה בסדר: צמתים מבודדים מתחילים עם in-degree 0.`
        },
        {
          type: 'mcq', q: 'גרף wait-for ב-Postgres: T1 מחכה ל-T2, T2 מחכה ל-T3, T3 מחכה ל-T1. מה זה?',
          choices: ['DAG, אז הכול יסתיים בסוף', 'מעגל, אז זה deadlock', 'עץ שהשורש שלו T1'],
          answer: 1,
          explain: `T1 → T2 → T3 → T1 זה מעגל: אף אחד לא יכול להתקדם. Postgres יעשה abort לאחת הטרנזקציות עם "deadlock detected" כדי לשבור אותו.`
        },
        {
          type: 'tf', q: 'בכל DAG יש לפחות צומת אחד עם in-degree 0.',
          answer: true,
          explain: `מתחילים מכל מקום והולכים נגד כיוון החצים. בלי מעגלים אי אפשר לחזור לצומת שכבר ביקרנו בו, והגרף סופי, אז בסוף חייבים להגיע לצומת בלי חצים נכנסים. בגלל זה לאלגוריתם של Kahn תמיד יש מאיפה להתחיל ב-DAG.`
        }
      ]
    },

    // ───────────────────────────── Lesson 6 ─────────────────────────────
    {
      id: 'trees-mst',
      title: 'עצים, עצים פורשים ו-Union-Find',
      emoji: '🌲',
      steps: [
        {
          type: 'learn', title: 'עץ הוא גרף מיוחד',
          html: `<p>במונחי גרפים, <b>עץ</b> (tree) הוא גרף לא מכוון שהוא <b>קשיר</b> (connected) ו<b>בלי מעגלים</b>. שתי העובדות האלה גוררות עוד שורה של עובדות:</p>
<ul><li>לעץ עם n צמתים יש בדיוק <b>n − 1 קשתות</b>.</li>
<li>יש בדיוק <b>מסלול אחד</b> בין כל שני צמתים.</li>
<li>תסירו קשת כלשהי והוא מתפרק לשני חלקים. תוסיפו קשת כלשהי ותיצרו בדיוק מעגל אחד.</li></ul>
<div class="dev">מערכת הקבצים של לינוקס (אם מתעלמים מ-hard links ו-symlinks), ה-DOM, מסמך JSON, עץ התהליכים (<code>pstree</code>): כולם עצים. ו-spanning-tree protocol (STP) על Ethernet switches קיים בדיוק כדי להפוך רשת עם לולאות לעץ, כדי ש-broadcast frames לא יסתובבו לנצח.</div>`
        },
        {
          type: 'input', q: 'רשת משרדית של 40 switches מחווטת כעץ (תודה, STP). כמה לינקים פעילים יש בה?',
          answer: ['39', 'thirty-nine', 'thirty nine', 'שלושים ותשע', 'שלושים ותשעה'], placeholder: 'מספר',
          explain: `לעץ על n צמתים יש n − 1 קשתות: 40 − 1 = 39. פחות מזה והוא לא יכול להיות קשיר; יותר מזה וחייב להיות מעגל.`
        },
        {
          type: 'learn', title: 'Minimum spanning tree',
          html: `<p>צריך לחווט 4 בניינים. לכל כבל אפשרי יש עלות. תחברו את <b>כולם</b>, הכי <b>בזול</b> שאפשר. התשובה היא <b>minimum spanning tree (MST)</b> (עץ פורש מינימלי): עץ שנוגע בכל צומת עם המשקל הכולל הקטן ביותר.</p>
<svg viewBox="0 0 220 130" width="100%" style="max-width:280px" font-size="13" text-anchor="middle">
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="65" x2="110" y2="18"/><line x1="110" y1="18" x2="110" y2="112"/><line x1="20" y1="65" x2="110" y2="112"/><line x1="110" y1="112" x2="200" y2="65"/><line x1="110" y1="18" x2="200" y2="65"/></g>
<g fill="var(--accent)"><circle cx="20" cy="65" r="13"/><circle cx="110" cy="18" r="13"/><circle cx="110" cy="112" r="13"/><circle cx="200" cy="65" r="13"/></g>
<g fill="#fff" font-weight="bold"><text x="20" y="70">A</text><text x="110" y="23">B</text><text x="110" y="117">C</text><text x="200" y="70">D</text></g>
<g fill="currentColor" font-weight="bold"><text x="55" y="33">1</text><text x="121" y="70">2</text><text x="55" y="104">3</text><text x="165" y="104">4</text><text x="165" y="33">5</text></g></svg>
<p>קשתות: A–B 1, B–C 2, A–C 3, C–D 4, B–D 5.</p>`
        },
        {
          type: 'learn', title: 'האלגוריתם של Kruskal',
          html: `<p>Greedy, ומוכח כאופטימלי:</p>
<ol><li>ממיינים את הקשתות לפי משקל, מהזולה ביותר.</li>
<li>לוקחים כל קשת <b>אלא אם היא תיצור מעגל</b>.</li>
<li>עוצרים ב-V − 1 קשתות.</li></ol>
<p>על הגרף שלמעלה: לוקחים A–B (1), לוקחים B–C (2), <b>מדלגים</b> על A–C (3), כי A ו-C כבר מחוברים, לוקחים C–D (4). סיימנו: 3 קשתות ל-4 צמתים.</p>
<p><b>האלגוריתם של Prim</b> הוא הקלאסיקה השנייה: מתחילים מצומת אחד וממשיכים להוסיף את הקשת הזולה ביותר שמגיעה לצומת חדש (שוב priority queue, כמו ב-Dijkstra). שניהם נותנים סכום מינימלי.</p>`
        },
        {
          type: 'input', q: 'מה המשקל הכולל של ה-minimum spanning tree של הגרף A, B, C, D?',
          answer: ['7', 'seven', 'שבע', 'שבעה'], placeholder: 'מספר',
          explain: `A–B (1) + B–C (2) + C–D (4) = 7. דילגנו על A–C (3) כי היא הייתה סוגרת את המעגל A–B–C, ו-B–D (5) אף פעם לא הייתה נחוצה.`
        },
        {
          type: 'learn', title: 'Union-find: "כבר מחוברים?" בכמעט O(1)',
          html: `<p>השאלה המרכזית של Kruskal היא "האם u ו-v כבר באותה קבוצה?". מבנה ה-<b>union-find</b> (disjoint-set, קבוצות זרות) עונה עליה מהר:</p>
<pre><code>parent = {v: v for v in vertices}
def find(x):                 # who is x's group leader?
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path compression
        x = parent[x]
    return x
def union(a, b):             # merge two groups
    parent[find(a)] = find(b)</code></pre>
<p>כל קבוצה היא עץ קטן; <code>find</code> הולך עד השורש. עם path compression ו-"union by rank" (מחברים את העץ הנמוך מתחת לגבוה), הפעולות הן <b>כמעט בזמן קבוע</b> (ההופכית של Ackermann, α(n) ≤ 4 לכל n שתפגשו אי פעם).</p>`
        },
        {
          type: 'mcq', q: 'באלגוריתם של Kruskal, find(u) == find(v) עבור הקשת הזולה הבאה u–v. מה עושים?',
          choices: ['מוסיפים את הקשת', 'מדלגים על הקשת: היא תיצור מעגל', 'עוצרים את האלגוריתם', 'מתחילים מחדש עם סדר קשתות אחר'],
          answer: 1,
          explain: `אותו leader אומר ש-u ו-v כבר מחוברים דרך קשתות שבחרתם. הוספת u–v תיצור מעגל, ולעץ אסור שיהיה מעגל.`
        },
        {
          type: 'tf', q: 'Minimum spanning tree נותן גם את המסלול הקצר ביותר בין כל זוג צמתים.',
          answer: false,
          explain: `מטרות שונות! ה-MST ממזער את עלות הכבלים הכוללת. בדוגמה שלנו, המסלול ב-MST מ-A ל-D הוא A–B–C–D = 1 + 2 + 4 = 7, אבל המסלול הקצר ביותר הוא A–B–D = 1 + 5 = 6, דרך הקשת B–D, שבכלל לא נמצאת ב-MST. למסלולים קצרים ביותר משתמשים ב-Dijkstra.`
        }
      ]
    },

    // ───────────────────────────── Lesson 7 ─────────────────────────────
    {
      id: 'graphs-in-the-wild',
      title: 'רכיבי קשירות, PageRank והעולם האמיתי',
      emoji: '🌍',
      steps: [
        {
          type: 'learn', title: 'רכיבי קשירות (Connected components)',
          html: `<p><b>Connected component</b> (רכיב קשירות) הוא קבוצה מקסימלית של צמתים שכולם יכולים להגיע זה לזה. גרף לא מכוון מתפצל לרכיב אחד או יותר.</p>
<p>איך סופרים אותם: עוברים בלולאה על כל צומת; אם עוד לא ביקרנו בו, זה רכיב חדש, אז מריצים ממנו BFS/DFS כדי לסמן את כל הקבוצה שלו. O(V + E). או: עושים union לכל קשת עם union-find, ואז סופרים כמה leaders שונים יש.</p>
<div class="dev">Network partition זה הקלאסטר שלכם שמתפצל לרכיבים. etcd ו-Consul משתמשים ב-Raft כך שרק הרכיב שמחזיק <b>רוב</b> מהחברים ממשיך לקבל כתיבות, והצד של המיעוט עוצר. "האם הגרף קשיר?" זו השאלה שה-monitoring שלכם שואל כשהוא מתריע על split brain.</div>`
        },
        {
          type: 'input', q: 'צמתים 1 עד 7, קשתות 1–2, 2–3, 4–5. לצמתים 6 ו-7 אין קשתות. כמה רכיבי קשירות יש?',
          answer: ['4', 'four', 'ארבע', 'ארבעה'], placeholder: 'מספר',
          explain: `{1, 2, 3}, {4, 5}, {6}, {7}. צומת מבודד הוא רכיב בפני עצמו.`
        },
        {
          type: 'learn', title: 'PageRank: חשיבות כתכונה של גרף',
          html: `<p>התובנה המקורית של Google: הרשת היא גרף מכוון (דפים → לינקים). דף חשוב אם <b>דפים חשובים מקשרים אליו</b>. מעגלי? כן, וזה עדיין עובד: מריצים איטרציות עד שהציונים מתייצבים.</p>
<p>מודל ה-"random surfer": מישהו לוחץ על לינקים אקראיים לנצח, ובהסתברות 0.15 (damping factor של 0.85) משתעמם וקופץ לדף אקראי. ה-<b>PageRank</b> של דף הוא חלק הזמן שהגולש מבלה בו.</p>
<div class="dev">אותו רעיון מוצא את ה-services ה"קריטיים ביותר" בגרף תלויות, או את החשבונות הכי משפיעים בגרף חברתי. מדדי centrality בגרף הם הדרך לאתר את ה-single point of failure הנסתר שאף אחד לא צייר בדיאגרמת הארכיטקטורה.</div>`
        },
        {
          type: 'mcq', q: 'לדף X יש לינק נכנס אחד, מדף עם PageRank עצום. לדף Y יש 3 לינקים נכנסים, מדפים שאף אחד לא מקשר אליהם. איזו טענה נכונה?',
          choices: ['Y תמיד מדורג גבוה יותר: יותר לינקים מנצח', 'X יכול להיות מדורג גבוה יותר: חשוב מי מקשר אליך, לא רק כמה', 'הם תמיד מדורגים שווה'],
          answer: 1,
          explain: `PageRank נותן לכל לינק נכנס משקל לפי הדירוג של הדף המקשר עצמו (שמתחלק בין הלינקים היוצאים שלו). קול אחד ממשקל כבד יכול לגבור על כמה קולות מאפסים.`
        },
        {
          type: 'learn', title: 'ניתוב: גרפים עד הסוף',
          html: `<ul><li><b>OSPF / IS-IS</b> (בתוך רשת): link-state, כל נתב מריץ Dijkstra.</li>
<li><b>RIP</b>: distance-vector, Bellman-Ford מבוזר.</li>
<li><b>BGP</b> (בין ספקי אינטרנט): path-vector, בוחר מסלולים לפי policy, לא רק לפי הקצר ביותר. האינטרנט עצמו הוא גרף של עשרות אלפי רשתות (autonomous systems).</li></ul>
<div class="dev">בפעם הבאה שתראו "BGP route leak הפיל חצי אינטרנט", זו קשת שהופיעה בגרף במקום שאסור לה להיות, והתעבורה הולכת אחריה בצייתנות.</div>
<div class="fun">🤓 עובדה משעשעת: "שש דרגות של הפרדה" היא טענה על מרחקי BFS בגרף החברויות האנושי. פייסבוק מדדה את הגרף שלה ב-2016: בממוצע, כל שני משתמשים היו מחוברים דרך בערך 3.5 אנשים באמצע.</div>`
        },
        {
          type: 'mcq', q: 'התאימו את הבעיה לכלי: "לפרוס סיבים בין 12 משרדים כך שכולם מחוברים בעלות כוללת מינימלית."',
          choices: ['Dijkstra', 'Topological sort', 'Minimum spanning tree (Kruskal/Prim)', 'PageRank'],
          answer: 2,
          explain: `"לחבר הכול, בעלות כוללת מינימלית" זו בדיוק בעיית ה-MST. Dijkstra ממזער מסלול ממקור אחד, לא את סך הכבילה.`
        },
        {
          type: 'mcq', q: 'התאימו את הבעיה לכלי: "להריץ 200 tasks ב-Airflow, כל אחד רק אחרי שה-tasks שהוא צריך סיימו."',
          choices: ['Topological sort על DAG', 'BFS למסלול הקצר ביותר', 'Union-find', 'Bellman-Ford'],
          answer: 0,
          explain: `תלויות + "להריץ אחרי הדרישות המוקדמות" = סדר טופולוגי של ה-DAG. ה-scheduler של Airflow הוא לולאה בסגנון האלגוריתם של Kahn: "מה מוכן עכשיו?".`
        },
        {
          type: 'order', q: 'סדרו את אלגוריתמי הגרפים האלה לפי זמן ריצה טיפוסי על גרף דליל, מהמהיר ביותר.',
          items: ['BFS: O(V + E)', 'Dijkstra עם heap: O((V + E) log V)', 'Bellman-Ford: O(V · E)'],
          explain: `BFS נוגע בכל דבר פעם אחת. Dijkstra מוסיף פקטור log בשביל ה-heap. Bellman-Ford עושה relax לכל קשת עד V−1 פעמים, וזה הרבה יותר איטי.`
        },
        {
          type: 'tf', q: 'הוספת קשת חדשה אחת בין שני רכיבי קשירות שונים מקטינה את מספר הרכיבים בדיוק באחד.',
          answer: true,
          explain: `הקשת ממזגת את שני הרכיבים האלה לאחד ולא נוגעת בשום דבר אחר. זה בדיוק union() ב-union-find.`
        }
      ]
    }
  ]
});
