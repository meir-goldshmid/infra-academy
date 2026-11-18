window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// Search algorithms: fuzzy matching, ranking, similarity at scale
// ---------------------------------------------------------------------------

// 1. Fuzzy matching & edit distance
INFRA.lessons.push({
  id: "algo-edit-distance",
  track: "data",
  order: 60,
  icon: "🔤",
  level: 3,
  minutes: 18,
  title: { en: "Fuzzy Matching & Edit Distance", he: "Fuzzy matching ו-edit distance" },
  tldr: {
    en: "Edit distance counts the minimum single-character edits between two strings with an O(n·m) DP table; real systems make it fast by capping the distance (1 edit for short words, 2 for long), exiting early, and never comparing against the whole vocabulary — they use BK-trees, SymSpell deletions, Levenshtein automata or trigram indexes instead.",
    he: "Edit distance סופר את המספר המינימלי של עריכות של תו בודד בין שתי מחרוזות, בעזרת טבלת DP של O(n·m). מערכות אמיתיות מאיצות את זה כשהן מגבילות את המרחק (עריכה אחת למילים קצרות, שתיים לארוכות), עוצרות מוקדם, ואף פעם לא משוות מול כל אוצר המילים — במקום זה הן משתמשות ב-BK-trees, ב-SymSpell, ב-Levenshtein automata או ב-trigram index."
  },
  analogy: {
    en: "Think of a proofreader with three red pens: one to cross out a letter, one to add a letter, one to replace a letter. Edit distance is the smallest number of pen strokes that turns your typo into a real word. A lazy proofreader compares your word to every word in the dictionary; a smart one only opens the pages where the word could possibly be, and stops reading a word the moment it needs more strokes than allowed.",
    he: "תחשוב על מגיה עם שלושה עטים אדומים: אחד למחוק אות, אחד להוסיף אות, ואחד להחליף אות. Edit distance הוא המספר הקטן ביותר של משיכות עט שהופך את שגיאת ההקלדה שלך למילה אמיתית. מגיה עצלן משווה את המילה שלך לכל מילה במילון; מגיה חכם פותח רק את הדפים שבהם המילה יכולה להיות, ומפסיק לבדוק מילה ברגע שהיא דורשת יותר משיכות ממה שמותר."
  },
  sections: [
    {
      h: { en: "Levenshtein distance: the DP table, worked by hand", he: "Levenshtein distance: טבלת ה-DP, צעד אחרי צעד" },
      body: {
        en: `<p><strong>Levenshtein distance</strong> is the minimum number of single-character <strong>insertions, deletions and substitutions</strong> that turn string <code>a</code> into string <code>b</code>. It is solved with dynamic programming: <code>D[i][j]</code> = distance between the first <code>i</code> chars of <code>a</code> and the first <code>j</code> chars of <code>b</code>.</p>
<pre>D[i][0] = i                      (delete everything)
D[0][j] = j                      (insert everything)
D[i][j] = min( D[i-1][j]   + 1,          # delete a[i]
               D[i][j-1]   + 1,          # insert b[j]
               D[i-1][j-1] + (a[i] != b[j]) )   # substitute, free if equal</pre>
<p>The classic example, <code>kitten</code> → <code>sitting</code> (rows = kitten, columns = sitting, ε = empty prefix):</p>
<pre>      ε  s  i  t  t  i  n  g
 ε    0  1  2  3  4  5  6  7
 k    1  1  2  3  4  5  6  7
 i    2  2  1  2  3  4  5  6
 t    3  3  2  1  2  3  4  5
 t    4  4  3  2  1  2  3  4
 e    5  5  4  3  2  2  3  4
 n    6  6  5  4  3  3  2  3   ← bottom-right = 3</pre>
<p>Walk back from the bottom-right corner along the cells that produced each minimum and you get the edit script: <strong>k→s</strong> (substitute), <strong>e→i</strong> (substitute), <strong>insert g</strong>. Three edits. Each cell only reads its left, upper and upper-left neighbours, so you need just <strong>two rows</strong> of memory:</p>
<pre>def levenshtein(a: str, b: str) -&gt; int:
    prev = list(range(len(b) + 1))          # row for the empty prefix of a
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1,          # delete ca
                           cur[j - 1] + 1,       # insert cb
                           prev[j - 1] + (ca != cb)))  # substitute (free if equal)
        prev = cur
    return prev[-1]

print(levenshtein("kitten", "sitting"))   # 3
print(levenshtein("teh", "the"))          # 2  (plain Levenshtein: no transpositions)</pre>
<p>Cost: <strong>O(n·m) time</strong>, O(min(n, m)) memory. Two 10-letter words = 100 cells — nothing. But "compare the query against 1M vocabulary words" = 100M cells per keystroke, and that is where the real engineering starts.</p>
<blockquote>💡 Real world: Postgres ships this in the <code>fuzzystrmatch</code> extension — <code>SELECT levenshtein('kitten','sitting');</code> returns <code>3</code>, and <code>levenshtein_less_equal(a, b, 2)</code> stops early once the distance is known to exceed 2.</blockquote>`,
        he: `<p><strong>Levenshtein distance</strong> הוא המספר המינימלי של <strong>הוספות, מחיקות והחלפות</strong> של תו בודד שהופכות את המחרוזת <code>a</code> למחרוזת <code>b</code>. פותרים את זה עם dynamic programming: <code>D[i][j]</code> הוא המרחק בין <code>i</code> התווים הראשונים של <code>a</code> לבין <code>j</code> התווים הראשונים של <code>b</code>.</p>
<pre>D[i][0] = i                      (delete everything)
D[0][j] = j                      (insert everything)
D[i][j] = min( D[i-1][j]   + 1,          # delete a[i]
               D[i][j-1]   + 1,          # insert b[j]
               D[i-1][j-1] + (a[i] != b[j]) )   # substitute, free if equal</pre>
<p>הדוגמה הקלאסית, <code>kitten</code> ל-<code>sitting</code> (שורות = kitten, עמודות = sitting, ε = prefix ריק):</p>
<pre>      ε  s  i  t  t  i  n  g
 ε    0  1  2  3  4  5  6  7
 k    1  1  2  3  4  5  6  7
 i    2  2  1  2  3  4  5  6
 t    3  3  2  1  2  3  4  5
 t    4  4  3  2  1  2  3  4
 e    5  5  4  3  2  2  3  4
 n    6  6  5  4  3  3  2  3   ← bottom-right = 3</pre>
<p>אם הולכים אחורה מהפינה הימנית-תחתונה לאורך התאים שנתנו כל מינימום, מקבלים את סקריפט העריכה: <strong>k→s</strong> (החלפה), <strong>e→i</strong> (החלפה), <strong>הוספת g</strong>. שלוש עריכות. כל תא קורא רק את השכן משמאל, מלמעלה ומלמעלה-משמאל, אז מספיקות <strong>שתי שורות</strong> בזיכרון:</p>
<pre>def levenshtein(a: str, b: str) -&gt; int:
    prev = list(range(len(b) + 1))          # row for the empty prefix of a
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1,          # delete ca
                           cur[j - 1] + 1,       # insert cb
                           prev[j - 1] + (ca != cb)))  # substitute (free if equal)
        prev = cur
    return prev[-1]

print(levenshtein("kitten", "sitting"))   # 3
print(levenshtein("teh", "the"))          # 2  (plain Levenshtein: no transpositions)</pre>
<p>העלות: <strong>O(n·m) זמן</strong>, ו-O(min(n, m)) זיכרון. שתי מילים של 10 אותיות זה 100 תאים — כלום. אבל "להשוות את ה-query מול מיליון מילים באוצר המילים" זה 100 מיליון תאים לכל הקשה על המקלדת, ושם מתחילה ההנדסה האמיתית.</p>
<blockquote>💡 Real world: ב-Postgres זה מגיע ב-extension בשם <code>fuzzystrmatch</code> — <code>SELECT levenshtein('kitten','sitting');</code> מחזיר <code>3</code>, ו-<code>levenshtein_less_equal(a, b, 2)</code> עוצר מוקדם ברגע שברור שהמרחק גדול מ-2.</blockquote>`
      }
    },
    {
      h: { en: "Variants: Damerau/OSA, Hamming, Jaro-Winkler", he: "וריאציות: Damerau/OSA, Hamming, Jaro-Winkler" },
      body: {
        en: `<p>About 80% of human typos are a single edit, and a big share of those are <strong>two adjacent letters swapped</strong> ("teh", "pdo", "postgers"). Plain Levenshtein charges 2 for a swap. <strong>Damerau-Levenshtein</strong> adds a fourth operation — transposition of adjacent characters — so a swap costs 1. The common cheap version is <strong>OSA (Optimal String Alignment)</strong>: one extra case in the recurrence:</p>
<pre>if i &gt; 1 and j &gt; 1 and a[i] == b[j-1] and a[i-1] == b[j]:
    D[i][j] = min(D[i][j], D[i-2][j-2] + 1)      # transposition

Levenshtein "teh" → "the"        OSA "teh" → "the"
      ε  t  h  e                       ε  t  h  e
 ε    0  1  2  3                  ε    0  1  2  3
 t    1  0  1  2                  t    1  0  1  2
 e    2  1  1  1                  e    2  1  1  1
 h    3  2  1  2  ← 2             h    3  2  1  1  ← 1 (D[1][1]=0, +1 swap)</pre>
<p>OSA has one quirk: it never edits a substring twice, so <code>"ca"</code> → <code>"abc"</code> is 3 in OSA but 2 in true (unrestricted) Damerau-Levenshtein ("ca" → "ac" → "abc"). For typo correction nobody cares; OSA is what Lucene's fuzzy query (<code>transpositions: true</code>, the default) and the search box in this app use.</p>
<table><tr><th>Metric</th><th>What it counts</th><th>Example</th><th>Good for</th></tr>
<tr><td>Levenshtein</td><td>insert / delete / substitute</td><td>kitten→sitting = 3</td><td>general fuzzy matching</td></tr>
<tr><td>Damerau / OSA</td><td>+ adjacent swap</td><td>teh→the = 1</td><td>typos from humans on keyboards</td></tr>
<tr><td>Hamming</td><td>positions that differ, equal length only</td><td>karolin / kathrin = 3</td><td>fixed-length codes, hashes, SimHash fingerprints</td></tr>
<tr><td>Jaro-Winkler</td><td>similarity 0..1, matching chars within a window, bonus for a shared prefix (up to 4 chars)</td><td>martha / marhta: Jaro 0.944, JW 0.961</td><td>short strings: person names, record linkage, entity resolution</td></tr></table>
<p>Jaro-Winkler is a <em>similarity</em> (higher = closer) rather than a distance. For martha/marhta: 6 matching characters, 1 transposition, so Jaro = (6/6 + 6/6 + 5/6) / 3 = 0.944; the 3-char shared prefix "mar" adds 3 × 0.1 × (1 − 0.944) → 0.961. It rewards a correct beginning, which matches how people misspell names.</p>
<blockquote>⚠️ Production tip: for names in a CRM/KYC dedup, Jaro-Winkler ≥ 0.9 plus a second signal (same phone or date of birth) beats any single threshold. A single fuzzy score alone will merge "Dan Cohen" and "Dana Cohen".</blockquote>`,
        he: `<p>בערך 80% משגיאות ההקלדה של בני אדם הן עריכה אחת, וחלק גדול מהן הן <strong>שתי אותיות סמוכות שהתחלפו</strong> ("teh", "pdo", "postgers"). Levenshtein רגיל גובה 2 על החלפת מקומות. <strong>Damerau-Levenshtein</strong> מוסיף פעולה רביעית — transposition של תווים סמוכים — ואז החלפת מקומות עולה 1. הגרסה הזולה והנפוצה היא <strong>OSA (Optimal String Alignment)</strong>: מקרה אחד נוסף ב-recurrence:</p>
<pre>if i &gt; 1 and j &gt; 1 and a[i] == b[j-1] and a[i-1] == b[j]:
    D[i][j] = min(D[i][j], D[i-2][j-2] + 1)      # transposition

Levenshtein "teh" → "the"        OSA "teh" → "the"
      ε  t  h  e                       ε  t  h  e
 ε    0  1  2  3                  ε    0  1  2  3
 t    1  0  1  2                  t    1  0  1  2
 e    2  1  1  1                  e    2  1  1  1
 h    3  2  1  2  ← 2             h    3  2  1  1  ← 1 (D[1][1]=0, +1 swap)</pre>
<p>ל-OSA יש מוזרות אחת: הוא אף פעם לא עורך את אותו substring פעמיים, ולכן <code>"ca"</code> ל-<code>"abc"</code> זה 3 ב-OSA אבל 2 ב-Damerau-Levenshtein האמיתי ("ca" ← "ac" ← "abc"). לתיקון שגיאות הקלדה זה לא משנה לאף אחד; OSA הוא מה שה-fuzzy query של Lucene משתמש בו (<code>transpositions: true</code>, ברירת המחדל), וגם תיבת החיפוש של האפליקציה הזאת.</p>
<table><tr><th>מדד</th><th>מה הוא סופר</th><th>דוגמה</th><th>טוב בשביל</th></tr>
<tr><td>Levenshtein</td><td>הוספה / מחיקה / החלפה</td><td>kitten→sitting = 3</td><td>fuzzy matching כללי</td></tr>
<tr><td>Damerau / OSA</td><td>+ החלפת מקומות של סמוכים</td><td>teh→the = 1</td><td>שגיאות הקלדה של בני אדם</td></tr>
<tr><td>Hamming</td><td>מיקומים ששונים, רק באורך שווה</td><td>karolin / kathrin = 3</td><td>קודים באורך קבוע, hashes, טביעות SimHash</td></tr>
<tr><td>Jaro-Winkler</td><td>דמיון בין 0 ל-1: תווים תואמים בתוך חלון, בונוס על prefix משותף (עד 4 תווים)</td><td>martha / marhta: Jaro 0.944, JW 0.961</td><td>מחרוזות קצרות: שמות אנשים, record linkage, entity resolution</td></tr></table>
<p>Jaro-Winkler הוא <em>דמיון</em> (גבוה = קרוב) ולא מרחק. עבור martha/marhta: 6 תווים תואמים ו-transposition אחד, אז Jaro = (6/6 + 6/6 + 5/6) / 3 = 0.944; ה-prefix המשותף "mar" באורך 3 מוסיף 3 × 0.1 × (1 − 0.944) ומגיעים ל-0.961. הוא מתגמל התחלה נכונה, וזה בדיוק איך שאנשים טועים בכתיבת שמות.</p>
<blockquote>⚠️ Production tip: בשביל dedup של שמות ב-CRM או KYC, Jaro-Winkler מעל 0.9 ועוד סיגנל שני (אותו טלפון או תאריך לידה) עדיף על כל threshold בודד. ציון fuzzy לבד ימזג את "דן כהן" ו-"דנה כהן".</blockquote>`
      }
    },
    {
      h: { en: "Making it fast: max distance by length, banding, early exit — the search box in this app", he: "להאיץ: מרחק מקסימלי לפי אורך, banding ו-early exit — תיבת החיפוש של האפליקציה" },
      body: {
        en: `<p>Three tricks turn O(n·m) per pair into something you can run on every keystroke:</p>
<ol><li><strong>Cap the distance by word length.</strong> One edit on a 3-letter word changes 33% of it — "pod" is 1 edit from "pid", "pot", "god". Elasticsearch's <code>fuzziness: AUTO</code> allows <strong>0 edits for 1-2 chars, 1 edit for 3-5, 2 edits for 6+</strong>. Lucene never goes beyond 2: the candidate set explodes and the matches stop making sense.</li>
<li><strong>Length filter + band.</strong> If <code>|len(a) − len(b)| &gt; k</code>, the distance is already &gt; k — skip without computing. Inside the table, only cells with <code>|i − j| ≤ k</code> can lead to a result ≤ k (Ukkonen's band), so the work drops from O(n·m) to O(k·n).</li>
<li><strong>Early exit.</strong> The row minimum never decreases from one row to the next, so if the smallest value in the current row is already &gt; k, the final answer will be too — stop.</li></ol>
<p><strong>The search box in this app does exactly this.</strong> From <code>js/app.js</code> ("smart search"):</p>
<pre>// optimal-string-alignment distance, stops early once it exceeds max
function editDist(a, b, max) {
  if (Math.abs(a.length - b.length) &gt; max) return max + 1;      // length filter
  let p2 = null, p1 = Array.from({ length: b.length + 1 }, (_, j) =&gt; j);
  for (let i = 1; i &lt;= a.length; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j &lt;= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + cost);
      if (p2 &amp;&amp; i &gt; 1 &amp;&amp; j &gt; 1 &amp;&amp; a[i - 1] === b[j - 2] &amp;&amp; a[i - 2] === b[j - 1])
        v = Math.min(v, p2[j - 2] + 1);                            // OSA transposition
      cur.push(v); if (v &lt; rowMin) rowMin = v;
    }
    if (rowMin &gt; max) return max + 1;                              // early exit
    p2 = p1; p1 = cur;                                             // keep 3 rows only
  }
  return p1[b.length];
}
// max edits: 0 below 4 chars, 1 for 4-7, 2 for 8+
const max = w.length &gt;= 8 ? 2 : w.length &gt;= 4 ? 1 : 0;
// vocabulary is bucketed by length: only words of length w.length ± max are compared
for (let len = w.length - max; len &lt;= w.length + max; len++)
  (vocab.byLen[len] || []).forEach(v =&gt; { const d = editDist(w, v, max); ... });</pre>
<p>Note the extra trick: the vocabulary (every token of length 3-29 in all lessons, with its frequency) is <strong>bucketed by length</strong>, so the length filter never even touches words that can't match. Candidates are then sorted by <strong>distance first, frequency second</strong> — "kuberntes" (9 chars, max 2) finds "kubernetes" at distance 1, and that becomes the "Did you mean" suggestion. With a few tens of thousands of distinct tokens this brute force is a few milliseconds in a browser, which is why a static site needs no search server.</p>
<blockquote>⚠️ Production tip: the same brute force does <em>not</em> scale to a 10M-term Elasticsearch shard or a Postgres table of product names. Above ~100k terms, use an index structure (next section) instead of scanning.</blockquote>`,
        he: `<p>שלושה טריקים הופכים O(n·m) לכל זוג למשהו שאפשר להריץ על כל הקשה על המקלדת:</p>
<ol><li><strong>להגביל את המרחק לפי אורך המילה.</strong> עריכה אחת במילה של 3 אותיות משנה 33% ממנה — "pod" במרחק 1 מ-"pid", מ-"pot" ומ-"god". ב-Elasticsearch, <code>fuzziness: AUTO</code> מרשה <strong>0 עריכות ל-1-2 תווים, עריכה אחת ל-3-5, ושתיים ל-6 ומעלה</strong>. Lucene אף פעם לא עובר את 2: קבוצת המועמדים מתפוצצת וההתאמות מפסיקות להיות הגיוניות.</li>
<li><strong>Length filter ו-band.</strong> אם <code>|len(a) − len(b)| &gt; k</code>, המרחק כבר גדול מ-k — מדלגים בלי לחשב. בתוך הטבלה, רק תאים עם <code>|i − j| ≤ k</code> יכולים להוביל לתוצאה של k או פחות (ה-band של Ukkonen), אז העבודה יורדת מ-O(n·m) ל-O(k·n).</li>
<li><strong>Early exit.</strong> המינימום של שורה אף פעם לא קטן משורה לשורה, אז אם הערך הכי קטן בשורה הנוכחית כבר גדול מ-k, גם התשובה הסופית תהיה כזאת — עוצרים.</li></ol>
<p><strong>תיבת החיפוש של האפליקציה הזאת עושה בדיוק את זה.</strong> מתוך <code>js/app.js</code> ("smart search"):</p>
<pre>// optimal-string-alignment distance, stops early once it exceeds max
function editDist(a, b, max) {
  if (Math.abs(a.length - b.length) &gt; max) return max + 1;      // length filter
  let p2 = null, p1 = Array.from({ length: b.length + 1 }, (_, j) =&gt; j);
  for (let i = 1; i &lt;= a.length; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j &lt;= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + cost);
      if (p2 &amp;&amp; i &gt; 1 &amp;&amp; j &gt; 1 &amp;&amp; a[i - 1] === b[j - 2] &amp;&amp; a[i - 2] === b[j - 1])
        v = Math.min(v, p2[j - 2] + 1);                            // OSA transposition
      cur.push(v); if (v &lt; rowMin) rowMin = v;
    }
    if (rowMin &gt; max) return max + 1;                              // early exit
    p2 = p1; p1 = cur;                                             // keep 3 rows only
  }
  return p1[b.length];
}
// max edits: 0 below 4 chars, 1 for 4-7, 2 for 8+
const max = w.length &gt;= 8 ? 2 : w.length &gt;= 4 ? 1 : 0;
// vocabulary is bucketed by length: only words of length w.length ± max are compared
for (let len = w.length - max; len &lt;= w.length + max; len++)
  (vocab.byLen[len] || []).forEach(v =&gt; { const d = editDist(w, v, max); ... });</pre>
<p>שים לב לטריק הנוסף: אוצר המילים (כל token באורך 3 עד 29 מכל השיעורים, עם התדירות שלו) <strong>מחולק לדליים לפי אורך</strong>, כך שה-length filter אפילו לא נוגע במילים שלא יכולות להתאים. אחר כך ממיינים את המועמדים <strong>קודם לפי מרחק, ואז לפי תדירות</strong> — "kuberntes" (9 תווים, מקסימום 2) מוצא את "kubernetes" במרחק 1, וזה הופך להצעת "האם התכוונת ל". עם כמה עשרות אלפי token-ים שונים, ה-brute force הזה לוקח כמה מילישניות בדפדפן, ולכן אתר סטטי לא צריך שרת חיפוש.</p>
<blockquote>⚠️ Production tip: אותו brute force <em>לא</em> מחזיק ב-shard של Elasticsearch עם 10 מיליון terms או בטבלת שמות מוצרים ב-Postgres. מעל בערך 100 אלף terms, משתמשים במבנה אינדקס (הסעיף הבא) במקום לסרוק.</blockquote>`
      }
    },
    {
      h: { en: "Scaling to huge vocabularies: BK-trees, SymSpell, Levenshtein automata", he: "סקייל לאוצר מילים ענק: BK-trees, SymSpell, Levenshtein automata" },
      body: {
        en: `<p><strong>BK-tree</strong> (Burkhard-Keller, 1973). Edit distance is a true <em>metric</em> (it obeys the triangle inequality), so you can build a tree where each child edge is labelled with its distance from the parent. To find all words within k of the query: compute <code>d = dist(query, node)</code>, then only descend into children whose edge label is in <code>[d − k, d + k]</code>. Typically visits 5-20% of the nodes for k = 1-2.</p>
<pre>class BKTree:
    def __init__(self, dist):
        self.dist, self.root = dist, None          # node = (word, {edge_distance: child})
    def add(self, word):
        if self.root is None:
            self.root = (word, {}); return
        node = self.root
        while True:
            d = self.dist(word, node[0])
            if d == 0: return
            if d not in node[1]:
                node[1][d] = (word, {}); return
            node = node[1][d]
    def search(self, word, k):
        out, stack = [], [self.root] if self.root else []
        while stack:
            w, children = stack.pop()
            d = self.dist(word, w)
            if d &lt;= k: out.append((d, w))
            stack += [c for e, c in children.items() if d - k &lt;= e &lt;= d + k]   # triangle inequality
        return sorted(out)

t = BKTree(levenshtein)
for w in ["kubernetes", "kubectl", "kafka", "karpenter", "keda", "kustomize"]:
    t.add(w)
print(t.search("kubernets", 2))   # [(1, 'kubernetes')]</pre>
<p><strong>SymSpell</strong> (2012) flips the problem: generate only <strong>deletions</strong>. At index time, store every word plus every string you get by deleting up to k characters, pointing back to the original. At query time, generate the query's deletions and look them up in a hash map. Two words are within distance k if their deletion sets intersect (then verify with a real distance). Why deletions only? For "kubernetes" with a 26-letter alphabet, all 1-edit variants (insert, delete, substitute, swap) are 10 + 11×26 + 10×25 + 9 = 555 strings; the deletes are just <strong>10</strong> at k=1 and <strong>54</strong> unique at k=2 — and they are language-independent (works for Hebrew with zero changes). The price is memory: a 500k-word dictionary at k=2 is millions of keys.</p>
<p><strong>Levenshtein automata</strong> (Schulz &amp; Mihov, 2002) are what Lucene uses. For a query word and k, build a DFA that accepts exactly the strings within distance k. Lucene's term dictionary is itself an automaton (an FST), so it intersects the two and walks only the matching branches — no per-term DP at all. Lucene 4.0 (2012) switched FuzzyQuery to this and it got ~100× faster. That's why Elasticsearch caps fuzziness at 2: the automaton for k=3 gets huge.</p>
<pre>GET products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "kubernets dashbord",
        "fuzziness": "AUTO",        // 0 / 1 / 2 edits by term length (AUTO:3,6)
        "prefix_length": 1,         // first char must match: 10-50x fewer candidates
        "max_expansions": 50,       // at most 50 fuzzy terms per query term
        "transpositions": true      // OSA: "teh" = 1 edit (default)
      }
    }
  }
}</pre>
<blockquote>💡 Real world: <code>prefix_length: 1</code> or <code>2</code> is the single best performance knob for fuzzy search — people rarely mistype the first letter, and it cuts the automaton walk to one branch of the term dictionary.</blockquote>`,
        he: `<p><strong>BK-tree</strong> (Burkhard-Keller, 1973). Edit distance הוא <em>metric</em> אמיתי (מקיים את אי-שוויון המשולש), אז אפשר לבנות עץ שבו כל קשת לילד מסומנת במרחק שלו מההורה. כדי למצוא את כל המילים במרחק k מה-query: מחשבים <code>d = dist(query, node)</code>, ויורדים רק לילדים שהתווית של הקשת שלהם בטווח <code>[d − k, d + k]</code>. בדרך כלל מבקרים ב-5%-20% מה-nodes עבור k של 1-2.</p>
<pre>class BKTree:
    def __init__(self, dist):
        self.dist, self.root = dist, None          # node = (word, {edge_distance: child})
    def add(self, word):
        if self.root is None:
            self.root = (word, {}); return
        node = self.root
        while True:
            d = self.dist(word, node[0])
            if d == 0: return
            if d not in node[1]:
                node[1][d] = (word, {}); return
            node = node[1][d]
    def search(self, word, k):
        out, stack = [], [self.root] if self.root else []
        while stack:
            w, children = stack.pop()
            d = self.dist(word, w)
            if d &lt;= k: out.append((d, w))
            stack += [c for e, c in children.items() if d - k &lt;= e &lt;= d + k]   # triangle inequality
        return sorted(out)

t = BKTree(levenshtein)
for w in ["kubernetes", "kubectl", "kafka", "karpenter", "keda", "kustomize"]:
    t.add(w)
print(t.search("kubernets", 2))   # [(1, 'kubernetes')]</pre>
<p><strong>SymSpell</strong> (2012) הופך את הבעיה: מייצרים רק <strong>מחיקות</strong>. בזמן האינדוקס שומרים כל מילה ועוד כל מחרוזת שמתקבלת ממחיקה של עד k תווים, עם הפניה למקור. בזמן ה-query מייצרים את המחיקות של ה-query ומחפשים אותן ב-hash map. שתי מילים במרחק k אם קבוצות המחיקות שלהן נחתכות (ואז מאמתים עם מרחק אמיתי). למה רק מחיקות? עבור "kubernetes" עם אלפבית של 26 אותיות, כל הווריאציות במרחק עריכה אחת (הוספה, מחיקה, החלפה, החלפת מקומות) הן 10 + 11×26 + 10×25 + 9 = 555 מחרוזות; המחיקות הן רק <strong>10</strong> עבור k=1 ו-<strong>54</strong> ייחודיות עבור k=2 — והן לא תלויות בשפה (עובד על עברית בלי שום שינוי). המחיר הוא זיכרון: מילון של 500 אלף מילים עם k=2 זה מיליוני מפתחות.</p>
<p><strong>Levenshtein automata</strong> (Schulz ו-Mihov, 2002) הם מה ש-Lucene משתמש בו. עבור מילת query ו-k בונים DFA שמקבל בדיוק את המחרוזות שבמרחק k. מילון ה-terms של Lucene הוא בעצמו automaton (FST), אז חותכים את שניהם והולכים רק על הענפים שמתאימים — בלי DP לכל term. ב-Lucene 4.0 (2012) עברו ל-FuzzyQuery בשיטה הזאת, והוא נהיה מהיר פי 100 בערך. בגלל זה Elasticsearch מגביל fuzziness ל-2: ה-automaton עבור k=3 נהיה ענק.</p>
<pre>GET products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "kubernets dashbord",
        "fuzziness": "AUTO",        // 0 / 1 / 2 edits by term length (AUTO:3,6)
        "prefix_length": 1,         // first char must match: 10-50x fewer candidates
        "max_expansions": 50,       // at most 50 fuzzy terms per query term
        "transpositions": true      // OSA: "teh" = 1 edit (default)
      }
    }
  }
}</pre>
<blockquote>💡 Real world: <code>prefix_length</code> של 1 או 2 הוא כפתור הביצועים הכי טוב ל-fuzzy search — אנשים כמעט לא טועים באות הראשונה, וזה מצמצם את ההליכה על ה-automaton לענף אחד של מילון ה-terms.</blockquote>`
      }
    },
    {
      h: { en: "Trigram indexes (pg_trgm) and phonetic algorithms", he: "Trigram indexes (pg_trgm) ואלגוריתמים פונטיים" },
      body: {
        en: `<p>An <strong>n-gram index</strong> breaks every string into overlapping chunks of n characters and indexes those. Two strings that share most of their trigrams are probably close. Postgres <code>pg_trgm</code> pads each word with two spaces in front and one behind:</p>
<pre>CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT show_trgm('postgres');
-- {"  p"," po","es ",gre,ost,pos,res,stg,tgr}        9 trigrams

SELECT similarity('postgres', 'postgras');     -- 0.5     (6 shared / 12 in the union)
SELECT similarity('kubernetes', 'kubernets');  -- 0.615385 (8 / 13)
SELECT similarity('postgres', 'progress');     -- 0.2      (3 / 15)

-- index it: GIN for search-heavy tables, GiST if you need ORDER BY distance (&lt;-&gt;) top-k
CREATE INDEX CONCURRENTLY idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

SELECT name, similarity(name, 'postgras') AS sim
FROM products
WHERE name % 'postgras'                  -- % = similarity above pg_trgm.similarity_threshold (default 0.3)
ORDER BY sim DESC LIMIT 10;

-- the same index also speeds up the query everyone writes and nobody indexes:
SELECT * FROM products WHERE name ILIKE '%dashboard%';</pre>
<p>Similarity is Jaccard over trigram sets (shared / union), so it is cheap to index: the GIN index maps each trigram → rows (see <code>db-index-kinds</code>), Postgres fetches rows sharing enough trigrams, then rechecks. Rule of thumb: trigrams work well for strings of 5+ characters and for "contains" search; for 3-letter words there are too few trigrams to be selective. Use <code>word_similarity()</code> / <code>&lt;%</code> when matching a short query inside a long title. Hebrew works as long as the database is UTF-8 with a locale that classifies Hebrew letters as alphanumeric — check with <code>show_trgm('אוזניות')</code>.</p>
<p><strong>Phonetic algorithms</strong> map words to a code of how they <em>sound</em>, so differently spelled names collide on purpose. <strong>Soundex</strong> (1918, US census): keep the first letter, map consonants to digits (b/f/p/v→1, c/g/j/k/q/s/x/z→2, d/t→3, l→4, m/n→5, r→6), drop vowels, collapse repeats, pad to 4. Robert and Rupert → <code>R163</code>; Smith, Smyth and Schmidt → <code>S530</code>. <strong>Metaphone / Double Metaphone</strong> (1990/2000) use ~100 English pronunciation rules ("PH"→F, silent "K" in "KN"). Postgres <code>fuzzystrmatch</code> has <code>soundex()</code>, <code>metaphone()</code>, <code>dmetaphone()</code> and, since PG 16, <code>daitch_mokotoff()</code> — a Soundex variant designed for Slavic and Yiddish surnames.</p>
<p>Why they are English-only: the rules encode <em>English</em> spelling-to-sound. Hebrew breaks every assumption — vowels are mostly not written, so "ספר" is book, barber, counted and border; letters sound alike (ט/ת, כ/ק, ס/שׂ, א/ע for most Israelis) and transliteration of names is chaotic (Cohen / Kohen / Kahn). For Hebrew, a small custom mapping (merge ט+ת, כ+ק, ס+שׂ, drop א/ע/ה/ו/י as near-vowels) plus edit distance usually beats any off-the-shelf phonetic algorithm.</p>
<blockquote>⚠️ Production tip: never ship <code>WHERE levenshtein(name, $1) &lt;= 2</code> on a big table — it is a sequential scan computing a DP for every row. Filter with an indexable operator first (<code>name % $1</code> via pg_trgm), then rank the few hundred survivors with levenshtein.</blockquote>`,
        he: `<p><strong>N-gram index</strong> מפרק כל מחרוזת לחתיכות חופפות של n תווים ומאנדקס אותן. שתי מחרוזות שחולקות את רוב ה-trigrams שלהן כנראה קרובות. ב-Postgres, <code>pg_trgm</code> מרפד כל מילה בשני רווחים מלפנים ורווח אחד מאחור:</p>
<pre>CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT show_trgm('postgres');
-- {"  p"," po","es ",gre,ost,pos,res,stg,tgr}        9 trigrams

SELECT similarity('postgres', 'postgras');     -- 0.5     (6 shared / 12 in the union)
SELECT similarity('kubernetes', 'kubernets');  -- 0.615385 (8 / 13)
SELECT similarity('postgres', 'progress');     -- 0.2      (3 / 15)

-- index it: GIN for search-heavy tables, GiST if you need ORDER BY distance (&lt;-&gt;) top-k
CREATE INDEX CONCURRENTLY idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

SELECT name, similarity(name, 'postgras') AS sim
FROM products
WHERE name % 'postgras'                  -- % = similarity above pg_trgm.similarity_threshold (default 0.3)
ORDER BY sim DESC LIMIT 10;

-- the same index also speeds up the query everyone writes and nobody indexes:
SELECT * FROM products WHERE name ILIKE '%dashboard%';</pre>
<p>ה-similarity הוא Jaccard על קבוצות trigrams (משותפים חלקי איחוד), ולכן קל לאנדקס אותו: ה-GIN index ממפה כל trigram לשורות (ראה <code>db-index-kinds</code>), Postgres שולף שורות שחולקות מספיק trigrams ואז עושה recheck. כלל אצבע: trigrams עובדים טוב למחרוזות של 5 תווים ומעלה ולחיפוש "מכיל"; במילים של 3 אותיות יש מעט מדי trigrams כדי להיות סלקטיבי. משתמשים ב-<code>word_similarity()</code> או ב-<code>&lt;%</code> כשמחפשים query קצר בתוך כותרת ארוכה. עברית עובדת כל עוד ה-database ב-UTF-8 עם locale שמסווג אותיות עבריות כאלפאנומריות — בדוק עם <code>show_trgm('אוזניות')</code>.</p>
<p><strong>אלגוריתמים פונטיים</strong> ממפים מילים לקוד של איך שהן <em>נשמעות</em>, כך ששמות שנכתבים אחרת מתנגשים בכוונה. <strong>Soundex</strong> (1918, מפקד האוכלוסין בארה״ב): שומרים את האות הראשונה, ממפים עיצורים לספרות (b/f/p/v←1, c/g/j/k/q/s/x/z←2, d/t←3, l←4, m/n←5, r←6), זורקים תנועות, מכווצים חזרות ומרפדים ל-4. Robert ו-Rupert הופכים ל-<code>R163</code>; Smith, Smyth ו-Schmidt הופכים ל-<code>S530</code>. <strong>Metaphone</strong> ו-<strong>Double Metaphone</strong> (1990 ו-2000) משתמשים בכ-100 חוקי הגייה של אנגלית ("PH" נהיה F, ה-"K" השקטה ב-"KN"). ב-Postgres, <code>fuzzystrmatch</code> כולל <code>soundex()</code>, <code>metaphone()</code>, <code>dmetaphone()</code> ומ-PG 16 גם <code>daitch_mokotoff()</code> — וריאציה של Soundex שתוכננה לשמות משפחה סלאביים ויידישאיים.</p>
<p>למה הם עובדים רק באנגלית: החוקים מקודדים את הקשר בין כתיב להגייה <em>באנגלית</em>. עברית שוברת כל הנחה — רוב התנועות לא נכתבות, אז "ספר" זה ספר, סַפָּר, סָפַר ו-סְפָר; יש אותיות שנשמעות אותו דבר (ט/ת, כ/ק, ס/שׂ, ולרוב הישראלים גם א/ע), והתעתיק של שמות כאוטי (Cohen / Kohen / Kahn). בעברית, מיפוי קטן משלך (לאחד ט+ת, כ+ק, ס+שׂ, ולהשמיט א/ע/ה/ו/י כמעט-תנועות) יחד עם edit distance בדרך כלל מנצח כל אלגוריתם פונטי מהמדף.</p>
<blockquote>⚠️ Production tip: אף פעם אל תעלה ל-production את <code>WHERE levenshtein(name, $1) &lt;= 2</code> על טבלה גדולה — זה sequential scan שמחשב DP לכל שורה. קודם מסננים עם אופרטור שיש לו index (<code>name % $1</code> דרך pg_trgm), ורק אז מדרגים עם levenshtein את כמה מאות השורות ששרדו.</blockquote>`
      }
    }
  ],
  diagram: "query \"kuberntes\" (9 chars -> max 2 edits)\n   |\n   +-- length filter: only terms of length 7..11\n   +-- candidate generation:  BK-tree | SymSpell deletes | Levenshtein automaton x term FST | pg_trgm GIN\n   +-- verify: OSA editDist(query, cand, 2) with early exit\n   +-- rank: distance ASC, then frequency DESC\n   v\n\"kubernetes\" (d=1)  -> results + \"Did you mean: kubernetes\"",
  handsOn: [
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS fuzzystrmatch; SELECT levenshtein('kitten','sitting'), soundex('Robert'), soundex('Rupert');\"", what: { en: "Levenshtein = 3, and both names get Soundex R163.", he: "Levenshtein שווה 3, ושני השמות מקבלים Soundex של R163." } },
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS pg_trgm; SELECT show_trgm('postgres'), similarity('postgres','postgras');\"", what: { en: "See the 9 padded trigrams and similarity 0.5 (6 shared of 12).", he: "תראה את 9 ה-trigrams המרופדים ו-similarity של 0.5 (6 משותפים מתוך 12)." } },
    { cmd: "curl -s localhost:9200/products/_search -H 'Content-Type: application/json' -d '{\"query\":{\"match\":{\"name\":{\"query\":\"kubernets\",\"fuzziness\":\"AUTO\",\"prefix_length\":1}}}}'", what: { en: "Run a Lucene fuzzy match; compare hit counts with fuzziness 0 and AUTO.", he: "הרץ fuzzy match של Lucene; השווה את מספר התוצאות עם fuzziness 0 ועם AUTO." } },
    { cmd: "python3 -c \"import difflib; print(difflib.get_close_matches('kuberntes', ['kubernetes','kubectl','kustomize']))\"", what: { en: "The standard library's quick fuzzy matcher (ratio-based, not Levenshtein) — fine for CLIs and scripts.", he: "ה-fuzzy matcher המהיר של הספרייה הסטנדרטית (מבוסס ratio, לא Levenshtein) — מספיק ל-CLI ולסקריפטים." } }
  ],
  mnemonic: { en: "Cap it, band it, bail early — and never scan the dictionary: BK, SymSpell, automaton or trigram.", he: "תגביל, תצמצם ל-band, תצא מוקדם — ואל תסרוק את המילון: BK, SymSpell, automaton או trigram." },
  pitfalls: [
    { en: "Allowing 2 edits on short words: 'pod' matches 'god', 'pot', 'pid', 'po'. Scale the max distance with length (AUTO), and require the first letter (prefix_length 1).", he: "לאפשר 2 עריכות במילים קצרות: 'pod' מתאים ל-'god', 'pot', 'pid' ו-'po'. תתאים את המרחק המקסימלי לאורך (AUTO), ותדרוש התאמה באות הראשונה (prefix_length 1)." },
    { en: "Computing levenshtein() per row in SQL on a large table — a full scan with a DP per row. Filter by a trigram GIN index first, then rank.", he: "לחשב levenshtein() לכל שורה ב-SQL על טבלה גדולה — full scan עם DP לכל שורה. קודם מסננים עם trigram GIN index, ואז מדרגים." },
    { en: "Using plain Levenshtein for typos: swaps ('teh') cost 2 and fall outside a 1-edit budget. Use OSA / Damerau (transpositions).", he: "להשתמש ב-Levenshtein רגיל לשגיאות הקלדה: החלפת מקומות ('teh') עולה 2 ונופלת מחוץ לתקציב של עריכה אחת. תשתמש ב-OSA או Damerau (transpositions)." },
    { en: "Using Soundex/Metaphone for non-English text. They encode English pronunciation; for Hebrew names use a custom letter-merge map plus edit distance.", he: "להשתמש ב-Soundex או Metaphone על טקסט שאינו אנגלית. הם מקודדים הגייה באנגלית; לשמות בעברית תשתמש במיפוי איחוד אותיות משלך ועוד edit distance." }
  ],
  interview: [
    { q: { en: "How would you implement 'did you mean' over a 5M-term vocabulary with < 20 ms latency?", he: "איך היית מממש \"האם התכוונת ל\" על אוצר מילים של 5 מיליון terms עם latency מתחת ל-20ms?" },
      a: { en: "Never scan. Generate candidates with an index: SymSpell deletion map (fast, memory-heavy), a Levenshtein automaton intersected with an FST term dictionary (Lucene), or a trigram index. Cap distance by length (1 for 3-5 chars, 2 for 6+), require the first character, verify with OSA plus early exit, then rank by distance and term frequency (or query-log popularity). Cache results for frequent typos.", he: "לא סורקים. מייצרים מועמדים בעזרת index: מפת מחיקות של SymSpell (מהיר, כבד בזיכרון), Levenshtein automaton שנחתך עם מילון terms ב-FST (כמו ב-Lucene), או trigram index. מגבילים את המרחק לפי אורך (1 ל-3-5 תווים, 2 ל-6 ומעלה), דורשים את התו הראשון, מאמתים עם OSA ו-early exit, ומדרגים לפי מרחק ותדירות ה-term (או פופולריות מה-query log). שומרים ב-cache את התוצאות לשגיאות נפוצות." } },
    { q: { en: "Why does a BK-tree work for edit distance but not for, say, Jaro-Winkler?", he: "למה BK-tree עובד עם edit distance אבל לא, נגיד, עם Jaro-Winkler?" },
      a: { en: "A BK-tree prunes using the triangle inequality: if dist(q, node) = d, any word within k of q must be at distance d±k from the node. Levenshtein (and OSA in practice) is a metric. Jaro-Winkler is a similarity that does not satisfy the triangle inequality, so pruning could drop real matches.", he: "BK-tree גוזם בעזרת אי-שוויון המשולש: אם dist(q, node) = d, כל מילה במרחק k מ-q חייבת להיות במרחק d±k מה-node. Levenshtein (ובפועל גם OSA) הוא metric. Jaro-Winkler הוא מדד דמיון שלא מקיים את אי-שוויון המשולש, אז גיזום עלול לזרוק התאמות אמיתיות." } }
  ],
  quiz: [
    { q: { en: "What is the OSA (Damerau) distance between 'postgers' and 'postgres'?", he: "מה מרחק ה-OSA (Damerau) בין 'postgers' ל-'postgres'?" },
      options: [ { en: "0", he: "0" }, { en: "1", he: "1" }, { en: "2", he: "2" }, { en: "3", he: "3" } ], answer: 1,
      explain: { en: "'er' ↔ 're' is one adjacent transposition, which OSA counts as 1. Plain Levenshtein would say 2.", he: "'er' מול 're' זה transposition אחד של תווים סמוכים, ו-OSA סופר אותו כ-1. Levenshtein רגיל היה אומר 2." } },
    { q: { en: "With Elasticsearch fuzziness AUTO, how many edits are allowed for the term 'redis'?", he: "עם fuzziness AUTO ב-Elasticsearch, כמה עריכות מותרות ל-term 'redis'?" },
      options: [ { en: "0", he: "0" }, { en: "1", he: "1" }, { en: "2", he: "2" }, { en: "3", he: "3" } ], answer: 1,
      explain: { en: "AUTO = 0 edits for 1-2 chars, 1 for 3-5, 2 for 6+. 'redis' has 5 characters.", he: "AUTO זה 0 עריכות ל-1-2 תווים, 1 ל-3-5, ו-2 ל-6 ומעלה. ב-'redis' יש 5 תווים." } },
    { q: { en: "Why does SymSpell generate only deletions instead of all edits?", he: "למה SymSpell מייצר רק מחיקות ולא את כל העריכות?" },
      options: [ { en: "Deletions are the most common typo", he: "מחיקות הן שגיאת ההקלדה הכי נפוצה" }, { en: "Deletions are few and alphabet-independent; an insert on one side equals a delete on the other", he: "יש מעט מחיקות והן לא תלויות באלפבית; הוספה בצד אחד שקולה למחיקה בצד השני" }, { en: "Hash maps can't store insertions", he: "Hash map לא יכול לשמור הוספות" }, { en: "It only supports distance 1", he: "הוא תומך רק במרחק 1" } ], answer: 1,
      explain: { en: "'kubernetes' has 10 single deletions vs ~555 variants for all 1-edit operations over 26 letters. Matching deletion sets from both sides covers inserts, deletes and substitutions.", he: "ל-'kubernetes' יש 10 מחיקות בודדות מול כ-555 וריאציות לכל פעולות העריכה האחת על 26 אותיות. התאמה של קבוצות מחיקות משני הצדדים מכסה הוספות, מחיקות והחלפות." } },
    { q: { en: "pg_trgm similarity('postgres','postgras') = 0.5. What does that number measure?", he: "ב-pg_trgm, similarity('postgres','postgras') שווה 0.5. מה המספר הזה מודד?" },
      options: [ { en: "Edit distance divided by length", he: "Edit distance חלקי האורך" }, { en: "Jaccard similarity of the two padded trigram sets (6 shared / 12 total)", he: "Jaccard similarity של שתי קבוצות ה-trigrams המרופדות (6 משותפים מתוך 12)" }, { en: "Cosine similarity of embeddings", he: "Cosine similarity של embeddings" }, { en: "Fraction of matching characters by position", he: "אחוז התווים שתואמים לפי מיקום" } ], answer: 1,
      explain: { en: "pg_trgm compares trigram sets: shared / union. That's why a GIN index on trigrams can accelerate it.", he: "pg_trgm משווה קבוצות trigrams: משותפים חלקי איחוד. בגלל זה GIN index על trigrams יכול להאיץ אותו." } }
  ],
  related: ["db-search-engines", "db-index-kinds", "infra-data-structures", "algo-search-ranking", "algo-similarity-dedup"]
});

// 2. How search engines rank
INFRA.lessons.push({
  id: "algo-search-ranking",
  track: "data",
  order: 61,
  icon: "🔎",
  level: 3,
  minutes: 20,
  title: { en: "How Search Engines Rank", he: "איך מנועי חיפוש מדרגים תוצאות" },
  tldr: {
    en: "Search quality is decided before scoring: the analyzer (tokenize, normalize, stem, handle Hebrew prefixes) must turn the query and the document into the same tokens; then BM25 ranks by rare-term matches with saturation and length normalization, field boosts and typo tolerance add recall, and you only know it works if you measure nDCG, MRR and zero-result rate.",
    he: "איכות החיפוש נקבעת עוד לפני הניקוד: ה-analyzer (פירוק ל-token-ים, נרמול, stemming, טיפול בתחיליות בעברית) חייב להפוך את ה-query ואת המסמך לאותם token-ים; אחר כך BM25 מדרג לפי התאמה של מילים נדירות עם saturation ונרמול אורך, field boosts ו-typo tolerance מוסיפים recall, ואתה יודע שזה עובד רק אם אתה מודד nDCG, MRR ו-zero-result rate."
  },
  analogy: {
    en: "A librarian finding books for 'cheap flights to Eilat'. First she normalizes what you said (flight = flights, ignore 'to'). Then she prefers books that mention 'Eilat' — a rare word — over books that mention 'cheap' a hundred times, and a short pamphlet about Eilat flights over a 900-page encyclopedia that mentions Eilat once. A book with Eilat in the title beats one with Eilat on page 400. And if you said 'Eliat', she still knows what you meant.",
    he: "ספרנית שמחפשת ספרים על \"טיסות זולות לאילת\". קודם היא מנרמלת את מה שאמרת (טיסה = טיסות, \"ל\" זו תחילית ולא מילה). אחר כך היא מעדיפה ספרים שמזכירים \"אילת\" — מילה נדירה — על פני ספרים שאומרים \"זול\" מאה פעמים, וחוברת קצרה על טיסות לאילת על פני אנציקלופדיה של 900 עמודים שמזכירה את אילת פעם אחת. ספר עם אילת בכותרת מנצח ספר עם אילת בעמוד 400. ואם אמרת \"אלית\", היא עדיין מבינה למה התכוונת."
  },
  sections: [
    {
      h: { en: "The analysis pipeline: tokenize, normalize, stem, stop words", he: "ה-analysis pipeline: פירוק ל-token-ים, נרמול, stemming ו-stop words" },
      body: {
        en: `<p>An inverted index (see <code>db-search-engines</code>) can only match <strong>exact tokens</strong>. So the most important part of search runs before any scoring: the <strong>analyzer</strong>, applied identically to documents at index time and to the query at search time. In Lucene/Elasticsearch it has three stages:</p>
<ol><li><strong>Char filters</strong> — rewrite raw text: strip HTML, map characters, remove Hebrew niqqud and cantillation marks (Unicode U+0591-U+05C7).</li>
<li><strong>Tokenizer</strong> — split into tokens. <code>standard</code> uses Unicode word boundaries (UAX #29): "CrashLoopBackOff, pods!" → <code>CrashLoopBackOff</code>, <code>pods</code>.</li>
<li><strong>Token filters</strong> — lowercase, ASCII folding (café → cafe), stop words, stemming, synonyms.</li></ol>
<pre>POST _analyze
{ "analyzer": "english", "text": "The Pods are Running" }

{ "tokens": [
    { "token": "pod", "start_offset": 4,  "end_offset": 8,  "type": "&lt;ALPHANUM&gt;", "position": 1 },
    { "token": "run", "start_offset": 13, "end_offset": 20, "type": "&lt;ALPHANUM&gt;", "position": 3 } ] }</pre>
<p>"The" and "are" were removed as stop words (positions 0 and 2 are kept as gaps so phrase queries stay correct), "Pods" → "pod" and "Running" → "run" by the Porter stemmer.</p>
<ul><li><strong>Stemming</strong> chops suffixes by rules: fast, no dictionary, sometimes wrong. Porter maps both "university" and "universe" to <code>univers</code> (over-stemming) and leaves "ran" alone (under-stemming).</li>
<li><strong>Lemmatization</strong> uses a dictionary and part of speech: "ran" → "run", "better" → "good". More accurate, slower, needs a language model or lexicon — and for Hebrew, the only practical route.</li>
<li><strong>Stop words</strong> ("the", "of", "של", "את") used to be dropped to save space. Modern engines often keep them: BM25's IDF already makes them nearly worthless in scoring, and dropping them breaks queries like "to be or not to be" or the band "The Who".</li></ul>
<p>Normalization in miniature — this app's search does it in one line before anything else:</p>
<pre>const normQ = (s) =&gt; String(s).toLowerCase().normalize("NFKD").replace(/[\\u0591-\\u05C7\\u0300-\\u036F]/g, "");
// lowercase + Unicode decomposition + strip Hebrew niqqud and Latin accents: "Café" → "cafe", "שָׁלוֹם" → "שלום"</pre>
<blockquote>⚠️ Production tip: the #1 cause of "search finds nothing" is an analyzer mismatch — documents indexed with one analyzer, queries analyzed with another (or a new index template that silently fell back to <code>standard</code>). Always debug with <code>POST index/_analyze</code> on both sides before touching scoring.</blockquote>`,
        he: `<p>Inverted index (ראה <code>db-search-engines</code>) יודע להתאים רק <strong>token-ים זהים בדיוק</strong>. לכן החלק הכי חשוב בחיפוש רץ עוד לפני כל ניקוד: ה-<strong>analyzer</strong>, שמופעל באותה צורה על המסמכים בזמן האינדוקס ועל ה-query בזמן החיפוש. ב-Lucene וב-Elasticsearch יש לו שלושה שלבים:</p>
<ol><li><strong>Char filters</strong> — משכתבים את הטקסט הגולמי: מסירים HTML, ממפים תווים, מורידים ניקוד וטעמים (Unicode U+0591-U+05C7).</li>
<li><strong>Tokenizer</strong> — מפרק ל-token-ים. ה-<code>standard</code> משתמש בגבולות מילים של Unicode (UAX #29): "CrashLoopBackOff, pods!" נהיה <code>CrashLoopBackOff</code> ו-<code>pods</code>.</li>
<li><strong>Token filters</strong> — אותיות קטנות, ASCII folding (café ← cafe), stop words, stemming, synonyms.</li></ol>
<pre>POST _analyze
{ "analyzer": "english", "text": "The Pods are Running" }

{ "tokens": [
    { "token": "pod", "start_offset": 4,  "end_offset": 8,  "type": "&lt;ALPHANUM&gt;", "position": 1 },
    { "token": "run", "start_offset": 13, "end_offset": 20, "type": "&lt;ALPHANUM&gt;", "position": 3 } ] }</pre>
<p>"The" ו-"are" הוסרו כ-stop words (המיקומים 0 ו-2 נשמרים כרווחים כדי ש-phrase queries יישארו נכונים), ו-"Pods" נהיה "pod" ו-"Running" נהיה "run" בזכות ה-Porter stemmer.</p>
<ul><li><strong>Stemming</strong> חותך סיומות לפי חוקים: מהיר, בלי מילון, לפעמים טועה. Porter ממפה גם את "university" וגם את "universe" ל-<code>univers</code> (over-stemming) ומשאיר את "ran" כמו שהוא (under-stemming).</li>
<li><strong>Lemmatization</strong> משתמש במילון ובחלק הדיבר: "ran" נהיה "run", "better" נהיה "good". מדויק יותר, איטי יותר, צריך מודל שפה או לקסיקון — ובעברית זו הדרך המעשית היחידה.</li>
<li><strong>Stop words</strong> ("the", "of", "של", "את") פעם הוסרו כדי לחסוך מקום. מנועים מודרניים לרוב משאירים אותן: ה-IDF של BM25 כבר הופך אותן לכמעט חסרות משקל בניקוד, והסרה שלהן שוברת queries כמו "to be or not to be" או את הלהקה "The Who".</li></ul>
<p>נרמול בקטן — החיפוש של האפליקציה הזאת עושה את זה בשורה אחת לפני כל דבר אחר:</p>
<pre>const normQ = (s) =&gt; String(s).toLowerCase().normalize("NFKD").replace(/[\\u0591-\\u05C7\\u0300-\\u036F]/g, "");
// lowercase + Unicode decomposition + strip Hebrew niqqud and Latin accents: "Café" → "cafe", "שָׁלוֹם" → "שלום"</pre>
<blockquote>⚠️ Production tip: הסיבה מספר 1 ל"החיפוש לא מוצא כלום" היא חוסר התאמה ב-analyzer — מסמכים שאונדקסו עם analyzer אחד, queries שעוברים analyzer אחר (או index template חדש שבשקט חזר ל-<code>standard</code>). תמיד תדבג עם <code>POST index/_analyze</code> על שני הצדדים לפני שאתה נוגע בניקוד.</blockquote>`
      }
    },
    {
      h: { en: "Hebrew: prefix letters, no vowels, final letters", he: "עברית: אותיות שימוש, בלי תנועות, אותיות סופיות" },
      body: {
        en: `<p>Hebrew is hard for search engines built around English, for three reasons:</p>
<ul><li><strong>Prefix letters glue onto words.</strong> ו, ה, ב, ל, מ, ש, כ attach directly and stack: "וכשבבית" = ו + כש + ב + בית ("and when in the house"). With the <code>standard</code> analyzer, "באוזניות", "האוזניות" and "לאוזניות" are three different tokens, none equal to "אוזניות" in the product title. And stripping is ambiguous: "מדבר" is "desert", "speaks" or מ + דבר ("from a thing"); "בצל" is "onion" or ב + צל ("in the shade"); "שמן" is "oil" or ש + מן.</li>
<li><strong>No vowels.</strong> "ספר" can be book, barber, counted or border. A morphological analyzer has to guess from context, so it returns several candidate lemmas per word.</li>
<li><strong>Final letters and spelling variants.</strong> ך ם ן ף ץ are the same letters as כ מ נ פ צ at the end of a word; "ספרים" stems to "ספר" only if you know that. Plus full vs defective spelling: "תוכנית" / "תכנית", "אוזניות" / "אזניות".</li></ul>
<p>Elasticsearch ships no Hebrew analyzer. Practical options, from cheapest to best:</p>
<ol><li><strong>Index-time prefix expansion</strong> with the built-in <code>pattern_capture</code> filter: emit the original token plus versions with 1-2 prefix letters removed, at the same position. Cheap, no plugin; adds noise ("מטען" also indexes "טען"), so keep the original in a separately boosted field.
<pre>"filter": {
  "he_prefixes": {
    "type": "pattern_capture",
    "preserve_original": true,
    "patterns": ["^[ובהלמשכ](..+)$", "^[ובהלמשכ]{2}(..+)$"]
  }
}
// "באוזניות" → [באוזניות, אוזניות]   "ובבית" → [ובבית, בבית, בית]</pre></li>
<li><strong>N-grams</strong> (e.g. 3-grams): language-agnostic, handles prefixes and spelling variants, but the index grows 3-5× and ranking gets fuzzier.</li>
<li><strong>A morphological analyzer</strong> (HebMorph for Lucene/Elasticsearch, based on the Hspell lexicon; AGPL or commercial license) that returns lemmas — the best precision, more operational work.</li></ol>
<blockquote>💡 Real world: the search box in this app uses the cheapest trick at query time: if a Hebrew term starts with one of הבלומשכו and has 3+ letters, it also tries the term without the first letter, with a small penalty (score ÷ 1.2), so "בקאש" finds lessons about "קאש". The exact form always ranks first.</blockquote>`,
        he: `<p>עברית קשה למנועי חיפוש שנבנו סביב אנגלית, משלוש סיבות:</p>
<ul><li><strong>אותיות השימוש נדבקות למילה.</strong> ו, ה, ב, ל, מ, ש, כ נצמדות ישירות ונערמות: "וכשבבית" = ו + כש + ב + בית. עם ה-analyzer בשם <code>standard</code>, "באוזניות", "האוזניות" ו-"לאוזניות" הם שלושה token-ים שונים, ואף אחד מהם לא שווה ל-"אוזניות" שבכותרת המוצר. וההסרה דו-משמעית: "מדבר" זה מדבר (ישימון), מְדַבֵּר, או מ + דבר; "בצל" זה בצל או ב + צל; "שמן" זה שמן או ש + מן.</li>
<li><strong>בלי תנועות.</strong> "ספר" יכול להיות ספר, סַפָּר, סָפַר או סְפָר. analyzer מורפולוגי צריך לנחש מההקשר, ולכן הוא מחזיר כמה lemmas אפשריים לכל מילה.</li>
<li><strong>אותיות סופיות וכתיב.</strong> ך ם ן ף ץ הן אותן אותיות כמו כ מ נ פ צ בסוף מילה; "ספרים" מגיע ל-"ספר" רק אם יודעים את זה. ועוד כתיב מלא מול חסר: "תוכנית" / "תכנית", "אוזניות" / "אזניות".</li></ul>
<p>ל-Elasticsearch אין analyzer מובנה לעברית. אפשרויות מעשיות, מהזולה לטובה:</p>
<ol><li><strong>הרחבת תחיליות בזמן האינדוקס</strong> עם ה-filter המובנה <code>pattern_capture</code>: פולטים את ה-token המקורי ועוד גרסאות בלי 1-2 אותיות שימוש, באותו מיקום. זול, בלי plugin; מוסיף רעש ("מטען" מאנדקס גם "טען"), אז שומרים את המקור בשדה נפרד עם boost.
<pre>"filter": {
  "he_prefixes": {
    "type": "pattern_capture",
    "preserve_original": true,
    "patterns": ["^[ובהלמשכ](..+)$", "^[ובהלמשכ]{2}(..+)$"]
  }
}
// "באוזניות" → [באוזניות, אוזניות]   "ובבית" → [ובבית, בבית, בית]</pre></li>
<li><strong>N-grams</strong> (למשל 3-grams): לא תלוי שפה, מטפל בתחיליות ובווריאציות כתיב, אבל ה-index גדל פי 3-5 והדירוג נהיה פחות חד.</li>
<li><strong>Analyzer מורפולוגי</strong> (HebMorph ל-Lucene ול-Elasticsearch, מבוסס על הלקסיקון של Hspell; רישיון AGPL או מסחרי) שמחזיר lemmas — הדיוק הכי טוב, יותר עבודה תפעולית.</li></ol>
<blockquote>💡 Real world: תיבת החיפוש של האפליקציה הזאת משתמשת בטריק הכי זול בזמן ה-query: אם term בעברית מתחיל באחת מ-הבלומשכו ויש בו 3 אותיות או יותר, היא מנסה גם את ה-term בלי האות הראשונה, עם קנס קטן (הציון מחולק ב-1.2), כך ש-"בקאש" מוצא שיעורים על "קאש". הצורה המדויקת תמיד מדורגת ראשונה.</blockquote>`
      }
    },
    {
      h: { en: "Scoring: from TF-IDF to BM25, with a worked example", he: "ניקוד: מ-TF-IDF ל-BM25, עם דוגמה מחושבת" },
      body: {
        en: `<p><strong>TF-IDF</strong>: a term matters more if it appears often in this document (TF) and rarely in the corpus (IDF = log(N / df)). Two problems: TF grows linearly (50 mentions = 50× the score, so keyword stuffing wins) and long documents win just by being long. <strong>BM25</strong> (Okapi, 1994; Lucene's default since 6.0) fixes both:</p>
<pre>score(D, Q) = Σ over q in Q   IDF(q) · f(q,D) · (k1 + 1) / ( f(q,D) + k1 · (1 − b + b · |D| / avgdl) )

IDF(q) = ln( 1 + (N − n(q) + 0.5) / (n(q) + 0.5) )      # Lucene's variant, never negative
f(q,D) = term frequency in D     |D| = doc length in tokens     avgdl = average doc length</pre>
<ul><li><strong>k1 = 1.2</strong> controls <strong>TF saturation</strong>. With b = 0 the TF part is f·2.2 / (f + 1.2): 1 occurrence → 1.0, 2 → 1.375, 3 → 1.571, 5 → 1.774, 10 → 1.964, and it never passes 2.2. The 10th mention adds almost nothing.</li>
<li><strong>b = 0.75</strong> controls <strong>length normalization</strong>: b = 0 ignores length, b = 1 fully normalizes. Short fields like titles often do better with lower b.</li></ul>
<p>Worked example: 4 docs, query <code>redis cache</code>, N = 4, avgdl = (3+6+4+3)/4 = 4.</p>
<pre>d1  "redis cache eviction"                          |D|=3
d2  "redis cluster redis sentinel redis failover"   |D|=6
d3  "postgres cache tuning guide"                   |D|=4
d4  "cdn cache headers"                             |D|=3

IDF(redis): n=2 → ln(1 + 2.5/2.5) = 0.693        IDF(cache): n=3 → ln(1 + 1.5/3.5) = 0.357

        redis                 cache                 total
d1  f=1 → 0.772           f=1 → 0.397              1.169   ← both terms, short doc
d2  f=3 → 0.984           f=0                      0.984   ← 3× redis, but saturated + long
d4  —                     f=1 → 0.397              0.397
d3  —                     f=1 → 0.357              0.357   ← longer than d4, same f

d1 redis: 0.693 · 1·2.2 / (1 + 1.2·(0.25 + 0.75·3/4)) = 0.693 · 2.2/1.975 = 0.772</pre>
<pre>import math
from collections import Counter

def bm25(query, docs, k1=1.2, b=0.75):
    N = len(docs)
    avgdl = sum(len(d) for d in docs) / N
    df = Counter(t for d in docs for t in set(d))
    scores = []
    for d in docs:
        tf, s = Counter(d), 0.0
        for t in query:
            if t not in tf:
                continue
            idf = math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5))   # Lucene's IDF (never negative)
            norm = k1 * (1 - b + b * len(d) / avgdl)
            s += idf * tf[t] * (k1 + 1) / (tf[t] + norm)
        scores.append(round(s, 3))
    return scores

docs = [d.split() for d in ["redis cache eviction",
                            "redis cluster redis sentinel redis failover",
                            "postgres cache tuning guide",
                            "cdn cache headers"]]
print(bm25(["redis", "cache"], docs))   # [1.169, 0.984, 0.357, 0.397]</pre>
<p><strong>Field boosting</strong>: BM25 runs per field, and a match in the title should count more than one in the body:</p>
<pre>{ "query": { "multi_match": {
    "query": "redis cache",
    "fields": ["title^3", "tags^2", "body"],     // title match worth 3x
    "type": "best_fields", "tie_breaker": 0.3 } } }</pre>
<p>This app does the same by hand: a hit in the indexed title/summary scores 10, a hit only in the body scores 2, +15 if the word is in the visible title, +3 if it starts a word, all divided by (1 + penalty) for synonym, prefix-stripped or fuzzy matches.</p>
<blockquote>⚠️ Production tip: BM25 scores are relative to one shard's statistics. With few documents per shard, IDF differs between shards and identical docs get different scores. Use fewer shards for small indexes, or <code>search_type=dfs_query_then_fetch</code> when debugging relevance.</blockquote>`,
        he: `<p><strong>TF-IDF</strong>: מילה חשובה יותר אם היא מופיעה הרבה במסמך הזה (TF) ומעט בכל הקורפוס (IDF = log(N / df)). שתי בעיות: TF גדל לינארית (50 אזכורים = פי 50 בציון, אז keyword stuffing מנצח) ומסמכים ארוכים מנצחים רק כי הם ארוכים. <strong>BM25</strong> (Okapi, 1994; ברירת המחדל של Lucene מגרסה 6.0) מתקן את שתיהן:</p>
<pre>score(D, Q) = Σ over q in Q   IDF(q) · f(q,D) · (k1 + 1) / ( f(q,D) + k1 · (1 − b + b · |D| / avgdl) )

IDF(q) = ln( 1 + (N − n(q) + 0.5) / (n(q) + 0.5) )      # Lucene's variant, never negative
f(q,D) = term frequency in D     |D| = doc length in tokens     avgdl = average doc length</pre>
<ul><li><strong>k1 = 1.2</strong> שולט ב-<strong>TF saturation</strong>. עם b = 0 החלק של ה-TF הוא f·2.2 / (f + 1.2): מופע אחד נותן 1.0, שניים 1.375, שלושה 1.571, חמישה 1.774, עשרה 1.964, ולעולם לא עובר את 2.2. האזכור העשירי כמעט לא מוסיף.</li>
<li><strong>b = 0.75</strong> שולט ב-<strong>נרמול אורך</strong>: b = 0 מתעלם מאורך, b = 1 מנרמל לגמרי. שדות קצרים כמו כותרות עובדים לרוב טוב יותר עם b נמוך יותר.</li></ul>
<p>דוגמה מחושבת: 4 מסמכים, query של <code>redis cache</code>, N = 4, avgdl = (3+6+4+3)/4 = 4.</p>
<pre>d1  "redis cache eviction"                          |D|=3
d2  "redis cluster redis sentinel redis failover"   |D|=6
d3  "postgres cache tuning guide"                   |D|=4
d4  "cdn cache headers"                             |D|=3

IDF(redis): n=2 → ln(1 + 2.5/2.5) = 0.693        IDF(cache): n=3 → ln(1 + 1.5/3.5) = 0.357

        redis                 cache                 total
d1  f=1 → 0.772           f=1 → 0.397              1.169   ← both terms, short doc
d2  f=3 → 0.984           f=0                      0.984   ← 3× redis, but saturated + long
d4  —                     f=1 → 0.397              0.397
d3  —                     f=1 → 0.357              0.357   ← longer than d4, same f

d1 redis: 0.693 · 1·2.2 / (1 + 1.2·(0.25 + 0.75·3/4)) = 0.693 · 2.2/1.975 = 0.772</pre>
<pre>import math
from collections import Counter

def bm25(query, docs, k1=1.2, b=0.75):
    N = len(docs)
    avgdl = sum(len(d) for d in docs) / N
    df = Counter(t for d in docs for t in set(d))
    scores = []
    for d in docs:
        tf, s = Counter(d), 0.0
        for t in query:
            if t not in tf:
                continue
            idf = math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5))   # Lucene's IDF (never negative)
            norm = k1 * (1 - b + b * len(d) / avgdl)
            s += idf * tf[t] * (k1 + 1) / (tf[t] + norm)
        scores.append(round(s, 3))
    return scores

docs = [d.split() for d in ["redis cache eviction",
                            "redis cluster redis sentinel redis failover",
                            "postgres cache tuning guide",
                            "cdn cache headers"]]
print(bm25(["redis", "cache"], docs))   # [1.169, 0.984, 0.357, 0.397]</pre>
<p><strong>Field boosting</strong>: BM25 רץ לכל שדה בנפרד, והתאמה בכותרת צריכה לשקול יותר מהתאמה בגוף הטקסט:</p>
<pre>{ "query": { "multi_match": {
    "query": "redis cache",
    "fields": ["title^3", "tags^2", "body"],     // title match worth 3x
    "type": "best_fields", "tie_breaker": 0.3 } } }</pre>
<p>האפליקציה הזאת עושה את אותו הדבר ידנית: פגיעה בכותרת או בתקציר המאונדקסים שווה 10, פגיעה רק בגוף שווה 2, ועוד 15 אם המילה מופיעה בכותרת הגלויה, ועוד 3 אם היא בתחילת מילה, והכול מחולק ב-(1 + קנס) עבור התאמות דרך synonym, הסרת תחילית או fuzzy.</p>
<blockquote>⚠️ Production tip: ציוני BM25 יחסיים לסטטיסטיקה של shard אחד. כשיש מעט מסמכים בכל shard, ה-IDF שונה בין shards ומסמכים זהים מקבלים ציונים שונים. תשתמש בפחות shards ל-indexes קטנים, או ב-<code>search_type=dfs_query_then_fetch</code> כשאתה מדבג relevance.</blockquote>`
      }
    },
    {
      h: { en: "Autocomplete, synonyms, typos, 'did you mean' and wrong keyboard layout", he: "Autocomplete, synonyms, שגיאות הקלדה, \"האם התכוונת ל\" ומקלדת בשפה הלא נכונה" },
      body: {
        en: `<p><strong>Prefix search / autocomplete</strong> has to answer within ~50 ms on every keystroke. Three structures:</p>
<ul><li><strong>Trie</strong>: one node per character; find all words under "kub" in O(prefix length), then pick the top-k by popularity stored at each node. Great in memory, poor fit for a distributed inverted index.</li>
<li><strong>Edge n-grams</strong> at index time: "kube" is indexed as <code>ku, kub, kube</code> (min_gram 2). Prefix search becomes an exact term match — fast, but the index grows several times, and you must use a <em>different</em> search analyzer (don't n-gram the query too). Elasticsearch's <code>search_as_you_type</code> field type sets this up for you.</li>
<li><strong>FST</strong> (finite state transducer): a trie that also shares suffixes and stores a weight per word — Lucene's term dictionary and the <code>completion</code> suggester keep it in memory: millions of suggestions in tens of MB, prefix lookups in microseconds.</li></ul>
<p><strong>Synonyms</strong>: "k8s" ↔ "kubernetes", "pg" ↔ "postgres". Apply them at <strong>query time</strong> with <code>synonym_graph</code> (multi-word synonyms like "load balancer" ↔ "lb" work, and you can update the list with a reload instead of a full reindex). Index-time synonyms are faster at query time but every change needs a reindex.</p>
<p><strong>Typo tolerance</strong> = fuzzy matching at query time (see <code>algo-edit-distance</code>). <strong>"Did you mean"</strong> is a separate step: for a query term that is not in the vocabulary (or returns few hits), generate candidates within distance 1-2, then pick the best by <strong>distance first, frequency second</strong> — the noisy-channel idea: P(correction) × P(typo | correction). Query logs beat corpus frequency: what other users successfully searched is the best prior. Elasticsearch has the <code>term</code> and <code>phrase</code> suggesters for this.</p>
<p><strong>Wrong keyboard layout</strong> — a very Israeli bug: you meant "pod" but the keyboard was on Hebrew, so you typed <code>פםג</code>. No edit distance will fix that; you need a key-position map (q→/, w→', e→ק, r→ר, …). "redis" becomes <code>רקגןד</code>, "kubernetes" becomes <code>לונקרמקאקד</code>.</p>
<p><strong>The search box in this app</strong> chains all of it, cheapest first:</p>
<pre>for each query term, candidate forms with a penalty:
  exact token / substring                      penalty 0
  synonyms (k8s ↔ kubernetes, דוקר ↔ docker)    0.3
  Hebrew prefix letter stripped ("בקאש"→"קאש")   0.2
  English plural stripped ("pods"→"pod")        0.2
  fuzzy (OSA ≤ 1 or 2, only if the exact term is unknown)   = edit distance
score per doc = Σ best( (10 in title/summary | 2 in body) + 15 if in visible title + 3 if at word start ) / (1 + penalty)
if (almost) nothing matched: swap keyboard layout (פםג → pod) and search again → "⌨️ Looks like the wrong keyboard layout"
if a term matched only via fuzzy: "🔤 Did you mean: kubernetes"</pre>
<blockquote>💡 Real world: show the correction instead of silently replacing the query ("Showing results for X. Search instead for Y") — users trust it, and the click-through on the "instead" link is a free label for whether your speller was wrong.</blockquote>`,
        he: `<p><strong>Prefix search ו-autocomplete</strong> צריכים לענות בתוך כ-50ms על כל הקשה על המקלדת. שלושה מבנים:</p>
<ul><li><strong>Trie</strong>: node לכל תו; מוצאים את כל המילים מתחת ל-"kub" ב-O(אורך ה-prefix), ואז בוחרים את ה-top-k לפי פופולריות שנשמרת בכל node. מצוין בזיכרון, לא מתאים ל-inverted index מבוזר.</li>
<li><strong>Edge n-grams</strong> בזמן האינדוקס: "kube" מאונדקס כ-<code>ku, kub, kube</code> (עם min_gram 2). Prefix search הופך להתאמת term מדויקת — מהיר, אבל ה-index גדל פי כמה, וחייבים search analyzer <em>אחר</em> (לא מפרקים גם את ה-query ל-n-grams). שדה מסוג <code>search_as_you_type</code> ב-Elasticsearch מגדיר את זה בשבילך.</li>
<li><strong>FST</strong> (finite state transducer): trie שגם משתף סיומות ושומר משקל לכל מילה — מילון ה-terms של Lucene וה-suggester בשם <code>completion</code> מחזיקים אותו בזיכרון: מיליוני הצעות בעשרות MB, ו-prefix lookup במיקרו-שניות.</li></ul>
<p><strong>Synonyms</strong>: "k8s" ↔ "kubernetes", "pg" ↔ "postgres". מפעילים אותם <strong>בזמן ה-query</strong> עם <code>synonym_graph</code> (synonyms של כמה מילים כמו "load balancer" ↔ "lb" עובדים, ואפשר לעדכן את הרשימה עם reload במקום reindex מלא). Synonyms בזמן האינדוקס מהירים יותר ב-query, אבל כל שינוי דורש reindex.</p>
<p><strong>Typo tolerance</strong> זה fuzzy matching בזמן ה-query (ראה <code>algo-edit-distance</code>). <strong>"האם התכוונת ל"</strong> הוא שלב נפרד: ל-term שלא נמצא באוצר המילים (או שמחזיר מעט תוצאות), מייצרים מועמדים במרחק 1-2, ובוחרים את הטוב ביותר <strong>קודם לפי מרחק, ואז לפי תדירות</strong> — הרעיון של noisy channel: P(תיקון) × P(שגיאה | תיקון). Query logs מנצחים תדירות בקורפוס: מה שמשתמשים אחרים חיפשו בהצלחה הוא ה-prior הכי טוב. ב-Elasticsearch יש לזה את ה-suggesters בשם <code>term</code> ו-<code>phrase</code>.</p>
<p><strong>מקלדת בשפה הלא נכונה</strong> — באג ישראלי מאוד: התכוונת ל-"pod" אבל המקלדת הייתה על עברית, אז הקלדת <code>פםג</code>. שום edit distance לא יתקן את זה; צריך מפה של מיקומי מקשים (q←/, w←', e←ק, r←ר, …). "redis" נהיה <code>רקגןד</code>, ו-"kubernetes" נהיה <code>לונקרמקאקד</code>.</p>
<p><strong>תיבת החיפוש של האפליקציה הזאת</strong> משרשרת את כל זה, מהזול ליקר:</p>
<pre>for each query term, candidate forms with a penalty:
  exact token / substring                      penalty 0
  synonyms (k8s ↔ kubernetes, דוקר ↔ docker)    0.3
  Hebrew prefix letter stripped ("בקאש"→"קאש")   0.2
  English plural stripped ("pods"→"pod")        0.2
  fuzzy (OSA ≤ 1 or 2, only if the exact term is unknown)   = edit distance
score per doc = Σ best( (10 in title/summary | 2 in body) + 15 if in visible title + 3 if at word start ) / (1 + penalty)
if (almost) nothing matched: swap keyboard layout (פםג → pod) and search again → "⌨️ Looks like the wrong keyboard layout"
if a term matched only via fuzzy: "🔤 Did you mean: kubernetes"</pre>
<blockquote>💡 Real world: תציג את התיקון במקום להחליף את ה-query בשקט ("מציג תוצאות עבור X. לחפש במקום זאת Y") — משתמשים סומכים על זה, וה-click-through על הקישור "במקום זאת" הוא label בחינם שאומר לך אם ה-speller שלך טעה.</blockquote>`
      }
    },
    {
      h: { en: "Hybrid search and measuring quality: precision, recall, MRR, nDCG", he: "Hybrid search ומדידת איכות: precision, recall, MRR, nDCG" },
      body: {
        en: `<p><strong>Hybrid search</strong>: BM25 is great at exact identifiers ("OOMKilled", "ERR_SSL_PROTOCOL_ERROR", SKUs) and terrible at meaning ("my pod keeps restarting" vs "CrashLoopBackOff"). Vector search (see <code>db-vector</code>) is the opposite. Run both and fuse with <strong>Reciprocal Rank Fusion</strong>, which needs only ranks, not comparable scores:</p>
<pre>RRF(d) = Σ over result lists   1 / (60 + rank(d))

doc ranked #1 by BM25 and #4 by vectors:  1/61 + 1/64 = 0.01639 + 0.01563 = 0.0320
doc ranked #2 by BM25 only:               1/62        = 0.0161</pre>
<p><strong>Measuring</strong> — you can't tune what you don't measure. Build a judged set: 100-500 real queries, each with graded relevant docs (0 = irrelevant … 3 = perfect).</p>
<table><tr><th>Metric</th><th>Formula</th><th>Example</th><th>Answers</th></tr>
<tr><td>Precision@k</td><td>relevant in top k / k</td><td>6 of top 10 relevant → 0.6</td><td>Is the first page clean?</td></tr>
<tr><td>Recall</td><td>relevant found / all relevant</td><td>6 found of 8 that exist → 0.75</td><td>Did we miss things? (critical for logs, legal, security)</td></tr>
<tr><td>MRR</td><td>mean of 1 / rank of first relevant</td><td>ranks 1, 3, none → (1 + 0.333 + 0) / 3 = 0.444</td><td>Navigational search: "find THE page"</td></tr>
<tr><td>nDCG@k</td><td>DCG / ideal DCG, DCG = Σ (2^rel − 1) / log2(i + 1)</td><td>see below</td><td>Graded relevance with position discount — the standard offline metric</td></tr></table>
<pre>results with relevance [3, 2, 0, 1]:
DCG  = 7/log2(2) + 3/log2(3) + 0/log2(4) + 1/log2(5) = 7 + 1.893 + 0 + 0.431 = 9.323
ideal order [3, 2, 1, 0]:
IDCG = 7 + 1.893 + 1/log2(4) + 0               = 7 + 1.893 + 0.5         = 9.393
nDCG = 9.323 / 9.393 = 0.993          (if the best doc were at position 2: [0,3,2,1] → 0.676)</pre>
<p><strong>Online</strong> signals from click logs: CTR on the first result, <strong>zero-result rate</strong> (the cheapest alarm you can build — healthy e-commerce search is around 2-5%), query reformulation rate (user searches again within 30 s), and abandonment. Clicks are biased by position (people click #1 because it's #1), so compare rankers with A/B tests or <strong>interleaving</strong> (mix results from rankers A and B in one list and see which side gets the clicks).</p>
<blockquote>⚠️ Production tip: keep the judged query set in the repo and run it in CI against every analyzer, synonym or boost change. A synonym that fixes one query routinely breaks five others; nDCG on 300 queries catches it before users do. Elasticsearch has a <code>_rank_eval</code> API that computes precision, MRR and DCG for exactly this.</blockquote>`,
        he: `<p><strong>Hybrid search</strong>: BM25 מצוין במזהים מדויקים ("OOMKilled", "ERR_SSL_PROTOCOL_ERROR", מק״טים) וגרוע במשמעות ("ה-Pod שלי כל הזמן עושה restart" מול "CrashLoopBackOff"). Vector search (ראה <code>db-vector</code>) הוא ההפך. מריצים את שניהם וממזגים עם <strong>Reciprocal Rank Fusion</strong>, שצריך רק דירוגים ולא ציונים שאפשר להשוות:</p>
<pre>RRF(d) = Σ over result lists   1 / (60 + rank(d))

doc ranked #1 by BM25 and #4 by vectors:  1/61 + 1/64 = 0.01639 + 0.01563 = 0.0320
doc ranked #2 by BM25 only:               1/62        = 0.0161</pre>
<p><strong>מדידה</strong> — אי אפשר לכוונן את מה שלא מודדים. בונים סט שיפוט: 100-500 queries אמיתיים, לכל אחד מסמכים רלוונטיים עם ציון מדורג (0 = לא רלוונטי … 3 = מושלם).</p>
<table><tr><th>מדד</th><th>נוסחה</th><th>דוגמה</th><th>עונה על</th></tr>
<tr><td>Precision@k</td><td>רלוונטיים ב-top k חלקי k</td><td>6 מתוך 10 הראשונים רלוונטיים ← 0.6</td><td>האם העמוד הראשון נקי?</td></tr>
<tr><td>Recall</td><td>רלוונטיים שנמצאו חלקי כל הרלוונטיים</td><td>נמצאו 6 מתוך 8 שקיימים ← 0.75</td><td>פספסנו משהו? (קריטי ללוגים, משפטי, אבטחה)</td></tr>
<tr><td>MRR</td><td>ממוצע של 1 חלקי הדירוג של הרלוונטי הראשון</td><td>דירוגים 1, 3, אין ← (1 + 0.333 + 0) / 3 = 0.444</td><td>חיפוש ניווטי: "תמצא את הדף"</td></tr>
<tr><td>nDCG@k</td><td>DCG חלקי ה-DCG האידיאלי, DCG = Σ (2^rel − 1) / log2(i + 1)</td><td>ראה למטה</td><td>רלוונטיות מדורגת עם הנחה לפי מיקום — מדד ה-offline הסטנדרטי</td></tr></table>
<pre>results with relevance [3, 2, 0, 1]:
DCG  = 7/log2(2) + 3/log2(3) + 0/log2(4) + 1/log2(5) = 7 + 1.893 + 0 + 0.431 = 9.323
ideal order [3, 2, 1, 0]:
IDCG = 7 + 1.893 + 1/log2(4) + 0               = 7 + 1.893 + 0.5         = 9.393
nDCG = 9.323 / 9.393 = 0.993          (if the best doc were at position 2: [0,3,2,1] → 0.676)</pre>
<p>סיגנלים <strong>online</strong> מ-click logs: CTR על התוצאה הראשונה, <strong>zero-result rate</strong> (ההתראה הכי זולה שאפשר לבנות — בחיפוש e-commerce בריא זה בערך 2%-5%), שיעור ניסוח מחדש (המשתמש מחפש שוב תוך 30 שניות), ונטישה. קליקים מוטים לפי מיקום (אנשים לוחצים על הראשון כי הוא ראשון), אז משווים rankers עם A/B tests או עם <strong>interleaving</strong> (מערבבים תוצאות מ-ranker A ומ-ranker B ברשימה אחת ובודקים איזה צד מקבל את הקליקים).</p>
<blockquote>⚠️ Production tip: תשמור את סט ה-queries המשופט ב-repo ותריץ אותו ב-CI על כל שינוי ב-analyzer, ב-synonyms או ב-boosts. Synonym שמתקן query אחד שובר באופן קבוע חמישה אחרים; nDCG על 300 queries תופס את זה לפני המשתמשים. ל-Elasticsearch יש API בשם <code>_rank_eval</code> שמחשב precision, MRR ו-DCG בדיוק בשביל זה.</blockquote>`
      }
    }
  ],
  diagram: "doc  -> char filters -> tokenizer -> token filters -> tokens -> inverted index (term -> postings)\nquery-> char filters -> tokenizer -> token filters -> tokens --+\n                                    (SAME analyzer!)           |\n        candidates: exact | synonyms | prefix-stripped | fuzzy | edge n-gram\n                                                               v\n                      BM25 per field x boosts  (+ vector kNN -> RRF fusion)\n                                                               v\n                      top-k -> \"did you mean\" / layout swap if empty -> click logs -> nDCG/MRR",
  handsOn: [
    { cmd: "curl -s localhost:9200/_analyze -H 'Content-Type: application/json' -d '{\"analyzer\":\"english\",\"text\":\"The Pods are Running\"}'", what: { en: "See stop words removed and Porter stemming: pod, run (positions 1 and 3).", he: "תראה stop words שהוסרו ואת ה-Porter stemming: pod ו-run (מיקומים 1 ו-3)." } },
    { cmd: "curl -s localhost:9200/_analyze -H 'Content-Type: application/json' -d '{\"analyzer\":\"standard\",\"text\":\"האוזניות באוזניות אוזניות\"}'", what: { en: "Three different tokens for one word — this is why Hebrew search 'finds nothing'.", he: "שלושה token-ים שונים למילה אחת — זו הסיבה שחיפוש בעברית \"לא מוצא כלום\"." } },
    { cmd: "curl -s 'localhost:9200/products/_search?explain=true' -H 'Content-Type: application/json' -d '{\"query\":{\"match\":{\"title\":\"redis cache\"}}}'", what: { en: "Read the BM25 breakdown per hit: idf, tf, dl, avgdl, k1, b.", he: "תקרא את הפירוק של BM25 לכל תוצאה: idf, tf, dl, avgdl, k1, b." } },
    { cmd: "curl -s localhost:9200/products/_rank_eval -H 'Content-Type: application/json' -d @judged-queries.json", what: { en: "Score your ranking offline (precision, MRR, DCG) against a judged query set.", he: "תמדוד את הדירוג offline (precision, MRR, DCG) מול סט queries משופט." } }
  ],
  mnemonic: { en: "Same analyzer both sides, rare words win, the 10th mention is worth nothing, title beats body — and measure with nDCG.", he: "אותו analyzer בשני הצדדים, מילים נדירות מנצחות, האזכור העשירי לא שווה כלום, כותרת מנצחת גוף — ומודדים עם nDCG." },
  pitfalls: [
    { en: "Changing the index analyzer without checking the query side (or a new template falling back to 'standard'): tokens stop matching and zero-result rate jumps. Debug with _analyze on both sides.", he: "לשנות את ה-analyzer של ה-index בלי לבדוק את צד ה-query (או template חדש שחוזר ל-'standard'): ה-token-ים מפסיקים להתאים וה-zero-result rate קופץ. מדבגים עם _analyze על שני הצדדים." },
    { en: "Running edge n-grams on the query too: 'kub' becomes 'ku' and 'kub', matching everything starting with 'ku'. Use a plain search_analyzer.", he: "להריץ edge n-grams גם על ה-query: 'kub' הופך ל-'ku' ול-'kub' ומתאים לכל מה שמתחיל ב-'ku'. תשתמש ב-search_analyzer רגיל." },
    { en: "Index-time synonyms for a list that changes weekly: every change needs a full reindex. Use query-time synonym_graph with a reloadable synonym set.", he: "Synonyms בזמן האינדוקס לרשימה שמשתנה כל שבוע: כל שינוי דורש reindex מלא. תשתמש ב-synonym_graph בזמן ה-query עם synonym set שאפשר לעשות לו reload." },
    { en: "Tuning boosts by eyeballing three queries. Without a judged set and nDCG/MRR in CI, every fix silently breaks other queries.", he: "לכוונן boosts לפי שלושה queries שבדקת בעין. בלי סט משופט ו-nDCG או MRR ב-CI, כל תיקון שובר בשקט queries אחרים." }
  ],
  interview: [
    { q: { en: "Explain BM25's k1 and b. When would you change them?", he: "תסביר את k1 ואת b ב-BM25. מתי היית משנה אותם?" },
      a: { en: "k1 (default 1.2) sets how fast term frequency saturates — the TF factor is capped at k1+1, so repeated mentions add less and less. b (default 0.75) sets length normalization — 0 ignores length, 1 fully penalizes long docs. Lower b for short fields like titles or tags where length is noise; raise k1 for long documents where repetition really signals topic. Always validate with nDCG on a judged set.", he: "k1 (ברירת מחדל 1.2) קובע כמה מהר ה-term frequency מגיע לרוויה — מקדם ה-TF חסום ב-k1+1, אז כל אזכור נוסף מוסיף פחות. b (ברירת מחדל 0.75) קובע נרמול אורך — 0 מתעלם מאורך, 1 מעניש מסמכים ארוכים לגמרי. מורידים את b לשדות קצרים כמו כותרות או tags, שבהם האורך הוא רעש; מעלים את k1 למסמכים ארוכים שבהם חזרה באמת מעידה על הנושא. תמיד מאמתים עם nDCG על סט משופט." } },
    { q: { en: "Users say Hebrew product search returns nothing for 'באוזניות' though 'אוזניות' works. What's happening and how do you fix it?", he: "משתמשים אומרים שחיפוש מוצרים בעברית לא מחזיר כלום עבור 'באוזניות', למרות ש-'אוזניות' עובד. מה קורה ואיך מתקנים?" },
      a: { en: "The analyzer keeps the prefix letter, so 'באוזניות' is a different token. Confirm with _analyze. Fix: a custom analyzer that emits prefix-stripped variants (pattern_capture, preserve_original) or a morphological analyzer (HebMorph), keep the original form in a boosted field, add niqqud stripping, then reindex into a new index and swap the alias. Track zero-result rate before and after.", he: "ה-analyzer משאיר את אות השימוש, אז 'באוזניות' הוא token אחר. מאמתים עם _analyze. התיקון: analyzer מותאם שפולט גרסאות בלי תחיליות (pattern_capture עם preserve_original) או analyzer מורפולוגי (HebMorph), שומרים את הצורה המקורית בשדה עם boost, מוסיפים הסרת ניקוד, ואז עושים reindex ל-index חדש ומחליפים את ה-alias. עוקבים אחרי ה-zero-result rate לפני ואחרי." } },
    { q: { en: "How do you combine keyword and vector results when their scores aren't comparable?", he: "איך משלבים תוצאות של keyword ושל vectors כשהציונים שלהם לא ברי השוואה?" },
      a: { en: "Reciprocal Rank Fusion: score = Σ 1/(60 + rank) across lists. It uses only ranks, so BM25's unbounded scores and cosine similarities don't need normalizing; documents high in both lists rise to the top. Elasticsearch, OpenSearch and most vector DBs support it natively.", he: "Reciprocal Rank Fusion: הציון הוא Σ 1/(60 + rank) על פני הרשימות. הוא משתמש רק בדירוגים, אז לא צריך לנרמל את הציונים הלא חסומים של BM25 ואת ה-cosine similarities; מסמכים שגבוהים בשתי הרשימות עולים למעלה. Elasticsearch, OpenSearch ורוב ה-vector DBs תומכים בזה מובנה." } }
  ],
  quiz: [
    { q: { en: "In BM25 with k1 = 1.2 (b = 0), a term appearing 10 times instead of once multiplies the TF part by about:", he: "ב-BM25 עם k1 = 1.2 (ו-b = 0), term שמופיע 10 פעמים במקום פעם אחת מכפיל את חלק ה-TF בערך פי:" },
      options: [ { en: "10×", he: "פי 10" }, { en: "~2× (1.0 → 1.96)", he: "בערך פי 2 (מ-1.0 ל-1.96)" }, { en: "log(10) ≈ 2.3×", he: "log(10), בערך פי 2.3" }, { en: "No change", he: "אין שינוי" } ], answer: 1,
      explain: { en: "TF factor = f·2.2/(f+1.2): f=1 → 1.0, f=10 → 1.964. It saturates toward k1+1 = 2.2, which defeats keyword stuffing.", he: "מקדם ה-TF הוא f·2.2/(f+1.2): עבור f=1 מקבלים 1.0, ועבור f=10 מקבלים 1.964. הוא מגיע לרוויה לכיוון k1+1 = 2.2, וזה מנטרל keyword stuffing." } },
    { q: { en: "Search for 'האוזניות' returns nothing, but 'אוזניות' works. The first thing to run is:", he: "חיפוש של 'האוזניות' לא מחזיר כלום, אבל 'אוזניות' עובד. הדבר הראשון שמריצים הוא:" },
      options: [ { en: "Increase the number of shards", he: "להגדיל את מספר ה-shards" }, { en: "POST index/_analyze on the query text and on a document field", he: "POST index/_analyze על טקסט ה-query ועל שדה במסמך" }, { en: "Raise BM25 k1", he: "להעלות את k1 של BM25" }, { en: "Restart the cluster", he: "לעשות restart לקלאסטר" } ], answer: 1,
      explain: { en: "It's a token mismatch: the analyzer keeps the ה prefix. _analyze shows the exact tokens on both sides; scoring knobs can't fix tokens that don't match.", he: "זו אי-התאמה של token-ים: ה-analyzer משאיר את התחילית ה. ה-_analyze מראה את ה-token-ים המדויקים בשני הצדדים; כפתורי ניקוד לא יכולים לתקן token-ים שלא מתאימים." } },
    { q: { en: "Three queries: first relevant result at rank 1, rank 2, and rank 4. What is the MRR?", he: "שלושה queries: התוצאה הרלוונטית הראשונה בדירוג 1, בדירוג 2 ובדירוג 4. מה ה-MRR?" },
      options: [ { en: "0.333", he: "0.333" }, { en: "0.583", he: "0.583" }, { en: "0.75", he: "0.75" }, { en: "2.333", he: "2.333" } ], answer: 1,
      explain: { en: "(1/1 + 1/2 + 1/4) / 3 = 1.75 / 3 = 0.583.", he: "(1/1 + 1/2 + 1/4) / 3 = 1.75 / 3 = 0.583." } },
    { q: { en: "A user types 'פםג' into the search box. What fixes it?", he: "משתמש מקליד 'פםג' בתיבת החיפוש. מה מתקן את זה?" },
      options: [ { en: "Fuzziness 2", he: "Fuzziness 2" }, { en: "A Hebrew stemmer", he: "Stemmer לעברית" }, { en: "Mapping keys between Hebrew and English layouts: פםג → pod", he: "מיפוי מקשים בין פריסת עברית לאנגלית: פםג ← pod" }, { en: "Synonyms", he: "Synonyms" } ], answer: 2,
      explain: { en: "It's 'pod' typed with the keyboard on Hebrew (p→פ, o→ם, d→ג). Every character differs, so edit distance can't help; a layout map can.", he: "זה 'pod' שהוקלד כשהמקלדת על עברית (p←פ, o←ם, d←ג). כל תו שונה, אז edit distance לא יעזור; מפת פריסה כן." } }
  ],
  related: ["algo-edit-distance", "db-search-engines", "db-vector", "ai-rag-deep", "algo-similarity-dedup"]
});

// 3. Similarity at scale
INFRA.lessons.push({
  id: "algo-similarity-dedup",
  track: "data",
  order: 62,
  icon: "👯",
  level: 3,
  minutes: 18,
  title: { en: "Similarity at Scale: MinHash, SimHash, Bloom & HyperLogLog", he: "דמיון בסקייל: MinHash, SimHash, Bloom ו-HyperLogLog" },
  tldr: {
    en: "Comparing every pair is O(N²) and dies at a few million items, so at scale you compress each item into a small sketch whose collisions mean 'similar' — MinHash + LSH for Jaccard, SimHash for near-duplicate pages, random hyperplanes or ANN for cosine — and answer 'seen it?' and 'how many distinct?' with Bloom/Cuckoo filters and HyperLogLog in kilobytes.",
    he: "השוואה של כל זוג היא O(N²) וקורסת בכמה מיליוני פריטים, אז בסקייל דוחסים כל פריט ל-sketch קטן שהתנגשות בו אומרת \"דומה\" — MinHash ו-LSH ל-Jaccard, SimHash לדפים כמעט כפולים, random hyperplanes או ANN ל-cosine — ועונים על \"ראיתי את זה?\" ועל \"כמה ייחודיים יש?\" עם Bloom או Cuckoo filters ו-HyperLogLog בכמה קילובייטים."
  },
  analogy: {
    en: "Finding near-identical twins in a city of 10 million by comparing every pair of faces would take centuries. Instead, you give everyone a few cheap stickers — hair color, height band, eye color — and only compare people who share a whole row of stickers. Twins almost always land in the same group; strangers almost never do. And to know how many different people entered the stadium, you don't keep a list of names — you just remember the rarest-looking ticket number you saw.",
    he: "למצוא תאומים כמעט זהים בעיר של 10 מיליון אנשים על ידי השוואת כל זוג פרצופים ייקח מאות שנים. במקום זה, נותנים לכל אחד כמה מדבקות זולות — צבע שיער, טווח גובה, צבע עיניים — ומשווים רק אנשים שחולקים שורה שלמה של מדבקות. תאומים כמעט תמיד נופלים באותה קבוצה; זרים כמעט אף פעם. וכדי לדעת כמה אנשים שונים נכנסו לאצטדיון, לא שומרים רשימת שמות — רק זוכרים את מספר הכרטיס הכי נדיר שראית."
  },
  sections: [
    {
      h: { en: "Jaccard similarity and shingling", he: "Jaccard similarity ו-shingling" },
      body: {
        en: `<p><strong>Jaccard similarity</strong> of two sets = |A ∩ B| / |A ∪ B|, from 0 (nothing shared) to 1 (identical). To use it on text, turn each document into a set of <strong>shingles</strong> (overlapping n-grams of words or characters):</p>
<pre>a = "ERROR db timeout after 30s on host db-1 retrying"
b = "ERROR db timeout after 30s on host db-2 retrying"

word sets:          8 shared / 10 total → J = 0.8
word 2-shingles:    {"ERROR db", "db timeout", "timeout after", "after 30s", "30s on",
                     "on host", "host db-1", "db-1 retrying"}
                    6 shared / 10 total → J = 0.6</pre>
<p>Larger shingles are stricter (word order matters more). Rules of thumb from the <em>Mining of Massive Datasets</em> book: character 5-shingles for short texts like emails, 9-shingles for web pages; words with k = 2-3 for logs and messages. Hashing each shingle to 32 or 64 bits saves memory.</p>
<p>The problem is not computing J, it's <strong>how many pairs</strong>: 10M documents = 10<sup>7</sup>·10<sup>7</sup>/2 = 5×10<sup>13</sup> pairs. At a million comparisons per second per core that's ~1.6 years on 1,000 cores. We need sketches that make similar items <em>collide</em>.</p>`,
        he: `<p><strong>Jaccard similarity</strong> של שתי קבוצות הוא |A ∩ B| / |A ∪ B|, מ-0 (אין שום דבר משותף) עד 1 (זהות). כדי להשתמש בזה על טקסט, הופכים כל מסמך לקבוצה של <strong>shingles</strong> (n-grams חופפים של מילים או של תווים):</p>
<pre>a = "ERROR db timeout after 30s on host db-1 retrying"
b = "ERROR db timeout after 30s on host db-2 retrying"

word sets:          8 shared / 10 total → J = 0.8
word 2-shingles:    {"ERROR db", "db timeout", "timeout after", "after 30s", "30s on",
                     "on host", "host db-1", "db-1 retrying"}
                    6 shared / 10 total → J = 0.6</pre>
<p>Shingles גדולים יותר מחמירים יותר (סדר המילים משנה יותר). כללי אצבע מהספר <em>Mining of Massive Datasets</em>: shingles של 5 תווים לטקסטים קצרים כמו מיילים, 9 תווים לדפי web; ובמילים k = 2-3 ללוגים ולהודעות. Hash של כל shingle ל-32 או 64 ביט חוסך זיכרון.</p>
<p>הבעיה היא לא לחשב את J, אלא <strong>כמה זוגות יש</strong>: 10 מיליון מסמכים זה 10<sup>7</sup>·10<sup>7</sup>/2 = 5×10<sup>13</sup> זוגות. במיליון השוואות בשנייה לכל core זה בערך שנה וחצי על 1,000 cores. צריך sketches שגורמים לפריטים דומים <em>להתנגש</em>.</p>`
      }
    },
    {
      h: { en: "MinHash and LSH: near-duplicates without comparing all pairs", he: "MinHash ו-LSH: כמעט-כפולים בלי להשוות את כל הזוגות" },
      body: {
        en: `<p><strong>MinHash</strong> (Broder, 1997, built for AltaVista's web dedup): apply a random hash function to every shingle and keep the <strong>minimum</strong>. The magic property: <strong>P[min h(A) = min h(B)] = J(A, B)</strong> — the smallest element of A ∪ B is equally likely to be any of them, and it's shared exactly when it's in A ∩ B. Repeat with 128 hash functions and the fraction of equal minimums estimates J, with standard error ≈ 1/√128 ≈ 0.09. Each document becomes a fixed 128-number signature (512 bytes with 32-bit values) regardless of its size.</p>
<pre>import hashlib, re

def shingles(text, k=5):
    t = re.sub(r"\\s+", " ", text.lower())
    return {t[i:i+k] for i in range(len(t) - k + 1)}

def h(x, seed):
    return int.from_bytes(hashlib.blake2b(x.encode(), digest_size=8, salt=seed.to_bytes(16, "little")).digest(), "little")

def minhash(sh, num=128):
    return [min(h(s, seed) for s in sh) for seed in range(num)]

def est_jaccard(a, b):
    return sum(x == y for x, y in zip(a, b)) / len(a)

a = "ERROR db timeout after 30s on host db-1, retrying in 5s"
b = "ERROR db timeout after 30s on host db-7, retrying in 5s"
A, B = shingles(a), shingles(b)
print("true", round(len(A &amp; B) / len(A | B), 3))          # true 0.821
print("est ", round(est_jaccard(minhash(A), minhash(B)), 3))  # est  0.789</pre>
<p>Signatures are smaller but we still have N² pairs. <strong>LSH (locality-sensitive hashing) banding</strong> fixes that: split the 100-value signature into <strong>b = 20 bands of r = 5 rows</strong>, hash each band into a bucket, and only compare documents that share <em>any</em> bucket. The probability that two docs with similarity s become candidates is <strong>1 − (1 − s<sup>r</sup>)<sup>b</sup></strong>:</p>
<pre>similarity s     0.2     0.4     0.5     0.6     0.8     0.9
P(candidate)   0.006   0.186   0.470   0.802   0.9996  ~1.0
threshold ≈ (1/b)^(1/r) = (1/20)^(1/5) ≈ 0.55          ← the S-curve's steep point</pre>
<p>Pick b and r to put the threshold where "duplicate" starts for your data: more rows per band = stricter, more bands = higher recall. Then verify candidates with exact Jaccard.</p>
<blockquote>💡 Real world: MinHash-LSH is how LLM training corpora are deduplicated (near-duplicate web pages inflate memorization) — tools like <code>datasketch</code> in Python and Spark's <code>MinHashLSH</code> run it over billions of documents. The same idea finds near-duplicate tickets, plagiarized code and re-uploaded product listings.</blockquote>`,
        he: `<p><strong>MinHash</strong> (Broder, 1997, נבנה ל-dedup של ה-web ב-AltaVista): מפעילים hash function אקראית על כל shingle ושומרים את ה-<strong>מינימום</strong>. התכונה הקסומה: <strong>P[min h(A) = min h(B)] = J(A, B)</strong> — האיבר הקטן ביותר ב-A ∪ B יכול להיות כל אחד מהם בהסתברות שווה, והוא משותף בדיוק כשהוא ב-A ∩ B. חוזרים על זה עם 128 hash functions, ושיעור המינימומים השווים מעריך את J, עם שגיאת תקן של בערך 1/√128 ≈ 0.09. כל מסמך הופך לחתימה קבועה של 128 מספרים (512 בייט עם ערכים של 32 ביט) בלי קשר לגודל שלו.</p>
<pre>import hashlib, re

def shingles(text, k=5):
    t = re.sub(r"\\s+", " ", text.lower())
    return {t[i:i+k] for i in range(len(t) - k + 1)}

def h(x, seed):
    return int.from_bytes(hashlib.blake2b(x.encode(), digest_size=8, salt=seed.to_bytes(16, "little")).digest(), "little")

def minhash(sh, num=128):
    return [min(h(s, seed) for s in sh) for seed in range(num)]

def est_jaccard(a, b):
    return sum(x == y for x, y in zip(a, b)) / len(a)

a = "ERROR db timeout after 30s on host db-1, retrying in 5s"
b = "ERROR db timeout after 30s on host db-7, retrying in 5s"
A, B = shingles(a), shingles(b)
print("true", round(len(A &amp; B) / len(A | B), 3))          # true 0.821
print("est ", round(est_jaccard(minhash(A), minhash(B)), 3))  # est  0.789</pre>
<p>החתימות קטנות יותר, אבל עדיין יש N² זוגות. <strong>LSH (locality-sensitive hashing) banding</strong> פותר את זה: מחלקים חתימה של 100 ערכים ל-<strong>b = 20 bands של r = 5 שורות</strong>, עושים hash לכל band לתוך bucket, ומשווים רק מסמכים שחולקים bucket <em>כלשהו</em>. ההסתברות ששני מסמכים עם דמיון s יהפכו למועמדים היא <strong>1 − (1 − s<sup>r</sup>)<sup>b</sup></strong>:</p>
<pre>similarity s     0.2     0.4     0.5     0.6     0.8     0.9
P(candidate)   0.006   0.186   0.470   0.802   0.9996  ~1.0
threshold ≈ (1/b)^(1/r) = (1/20)^(1/5) ≈ 0.55          ← the S-curve's steep point</pre>
<p>בוחרים b ו-r כדי למקם את ה-threshold איפה ש"כפול" מתחיל אצלך בדאטה: יותר שורות לכל band = יותר מחמיר, יותר bands = recall גבוה יותר. אחר כך מאמתים את המועמדים עם Jaccard מדויק.</p>
<blockquote>💡 Real world: ככה עושים dedup לקורפוסים של אימון LLM (דפי web כמעט כפולים מגבירים שינון) — כלים כמו <code>datasketch</code> ב-Python ו-<code>MinHashLSH</code> ב-Spark מריצים את זה על מיליארדי מסמכים. אותו רעיון מוצא tickets כמעט כפולים, קוד מועתק ומודעות מוצר שהועלו מחדש.</blockquote>`
      }
    },
    {
      h: { en: "SimHash and cosine similarity", he: "SimHash ו-cosine similarity" },
      body: {
        en: `<p><strong>SimHash</strong> (Charikar, 2002) compresses a document into one <strong>64-bit fingerprint</strong> where similar documents differ in <em>few bits</em> (small Hamming distance). For each feature (word, shingle), hash it to 64 bits; for each bit position add +weight if the bit is 1, −weight if 0; the final fingerprint takes the sign of each position.</p>
<pre>import hashlib, re

def simhash(text, bits=64):
    v = [0] * bits
    for tok in re.findall(r"\\w+", text.lower()):
        x = int.from_bytes(hashlib.blake2b(tok.encode(), digest_size=8).digest(), "little")
        for i in range(bits):
            v[i] += 1 if (x &gt;&gt; i) &amp; 1 else -1
    return sum(1 &lt;&lt; i for i in range(bits) if v[i] &gt; 0)

def hamming(x, y): return bin(x ^ y).count("1")

p1 = "Kubernetes pod stuck in CrashLoopBackOff after deploy of payments service version 4.2 to production cluster"
p2 = "Kubernetes pod stuck in CrashLoopBackOff after deploy of payments service version 4.3 to production cluster"
p3 = "Postgres replication lag alert on the orders database primary in eu-west-1"
print(hamming(simhash(p1), simhash(p2)), hamming(simhash(p1), simhash(p3)))
# 10 28   ← 15-word texts are noisy; pages with hundreds of weighted features separate far better</pre>
<p><strong>Google's web crawler</strong> (Manku, Jain, Das Sarma, WWW 2007) used 64-bit SimHash over ~8 billion pages, calling two pages near-duplicates if their fingerprints differ in <strong>≤ 3 bits</strong>. The lookup trick is pigeonhole: split the 64 bits into 4 blocks of 16; if two fingerprints differ in ≤ 3 bits, at least one block is identical. Keep 4 tables, each sorted by a different block, and look up exact matches on that block — then check Hamming on the few candidates. One fingerprint = 8 bytes vs a 512-byte MinHash signature, which is why SimHash wins at web scale; MinHash estimates Jaccard more precisely.</p>
<p><strong>Cosine similarity</strong> is the metric for vectors (embeddings, TF-IDF vectors): cos θ = (u·v) / (‖u‖·‖v‖). For u = [1, 2, 0], v = [2, 3, 1]: 8 / (2.236 · 3.742) = <strong>0.956</strong>. If vectors are normalized to length 1 it's just the dot product, which is why vector DBs normalize at insert time (see <code>db-vector</code>). SimHash is in fact LSH for cosine: each bit is the sign of a projection onto a random hyperplane, and P[bit differs] = θ/π. For <em>semantic</em> dedup ("same question, different words") use embeddings + an ANN index with a cosine threshold (often 0.9-0.95 — tune it on labelled pairs).</p>
<blockquote>⚠️ Production tip: lexical sketches (MinHash, SimHash) catch copies and templates; they do not catch paraphrases. Embeddings catch paraphrases but cost a model call per item and drift when you change models. Big pipelines run the cheap lexical pass first and embeddings only on what's left.</blockquote>`,
        he: `<p><strong>SimHash</strong> (Charikar, 2002) דוחס מסמך ל-<strong>fingerprint אחד של 64 ביט</strong>, שבו מסמכים דומים שונים ב-<em>מעט ביטים</em> (Hamming distance קטן). לכל feature (מילה, shingle) עושים hash ל-64 ביט; לכל מיקום ביט מוסיפים +משקל אם הביט 1, ו-−משקל אם 0; ה-fingerprint הסופי לוקח את הסימן של כל מיקום.</p>
<pre>import hashlib, re

def simhash(text, bits=64):
    v = [0] * bits
    for tok in re.findall(r"\\w+", text.lower()):
        x = int.from_bytes(hashlib.blake2b(tok.encode(), digest_size=8).digest(), "little")
        for i in range(bits):
            v[i] += 1 if (x &gt;&gt; i) &amp; 1 else -1
    return sum(1 &lt;&lt; i for i in range(bits) if v[i] &gt; 0)

def hamming(x, y): return bin(x ^ y).count("1")

p1 = "Kubernetes pod stuck in CrashLoopBackOff after deploy of payments service version 4.2 to production cluster"
p2 = "Kubernetes pod stuck in CrashLoopBackOff after deploy of payments service version 4.3 to production cluster"
p3 = "Postgres replication lag alert on the orders database primary in eu-west-1"
print(hamming(simhash(p1), simhash(p2)), hamming(simhash(p1), simhash(p3)))
# 10 28   ← 15-word texts are noisy; pages with hundreds of weighted features separate far better</pre>
<p><strong>ה-crawler של Google</strong> (Manku, Jain ו-Das Sarma, WWW 2007) השתמש ב-SimHash של 64 ביט על בערך 8 מיליארד דפים, וקבע ששני דפים כמעט כפולים אם ה-fingerprints שלהם שונים ב-<strong>3 ביטים או פחות</strong>. טריק החיפוש הוא עקרון שובך היונים: מחלקים את 64 הביטים ל-4 בלוקים של 16; אם שני fingerprints שונים ב-3 ביטים או פחות, לפחות בלוק אחד זהה. מחזיקים 4 טבלאות, כל אחת ממוינת לפי בלוק אחר, ומחפשים התאמה מדויקת על הבלוק הזה — ואז בודקים Hamming על המועמדים המעטים. Fingerprint אחד זה 8 בייט מול חתימת MinHash של 512 בייט, ולכן SimHash מנצח בסקייל של ה-web; MinHash מעריך Jaccard בצורה מדויקת יותר.</p>
<p><strong>Cosine similarity</strong> הוא המדד ל-vectors (embeddings, וקטורי TF-IDF): cos θ = (u·v) / (‖u‖·‖v‖). עבור u = [1, 2, 0] ו-v = [2, 3, 1]: 8 / (2.236 · 3.742) = <strong>0.956</strong>. אם הווקטורים מנורמלים לאורך 1, זה פשוט dot product, ולכן vector DBs מנרמלים בזמן ההכנסה (ראה <code>db-vector</code>). SimHash הוא בעצם LSH ל-cosine: כל ביט הוא הסימן של הטלה על hyperplane אקראי, ו-P[הביט שונה] = θ/π. ל-dedup <em>סמנטי</em> ("אותה שאלה, מילים אחרות") משתמשים ב-embeddings ו-ANN index עם threshold של cosine (לרוב 0.9-0.95 — מכווננים על זוגות מתויגים).</p>
<blockquote>⚠️ Production tip: sketches לקסיקליים (MinHash, SimHash) תופסים העתקות ו-templates; הם לא תופסים פרפרזות. Embeddings תופסים פרפרזות, אבל עולים קריאה למודל לכל פריט וזזים כשמחליפים מודל. pipelines גדולים מריצים קודם את המעבר הלקסיקלי הזול, ו-embeddings רק על מה שנשאר.</blockquote>`
      }
    },
    {
      h: { en: "'Have I seen this?' and 'how many distinct?': Bloom, Cuckoo, HyperLogLog", he: "\"ראיתי את זה?\" ו-\"כמה ייחודיים?\": Bloom, Cuckoo, HyperLogLog" },
      body: {
        en: `<p>Lesson <code>infra-data-structures</code> introduced these; here is how to choose and size them.</p>
<p><strong>Bloom filter</strong> — m bits, k hashes; "no" is certain, "yes" may be a false positive. Optimal size: <strong>m/n = −ln(p) / (ln 2)²</strong> bits per item, k = (m/n)·ln 2. For p = 1% that's <strong>9.6 bits per item and k ≈ 7</strong>; for 0.1%, 14.4 bits. One billion URLs at 1% ≈ <strong>1.2 GB</strong>, vs ~60+ GB to store the URLs themselves. Weaknesses: no delete (a counting Bloom filter uses 4-bit counters = 4× memory), and it can't grow — size it for the final n or the FP rate climbs fast.</p>
<p><strong>Cuckoo filter</strong> (Fan et al., 2014) stores a small <strong>fingerprint</strong> (8-16 bits) of each item in one of two candidate buckets (4 slots each); inserts kick existing fingerprints to their alternate bucket, like cuckoo hashing. It supports <strong>delete</strong>, has better lookup locality (2 memory reads), and uses less space than Bloom when the target FP rate is below ~3%. The catch: when the table is ~95% full, inserts start failing — you must size it and handle the error.</p>
<pre># Redis Stack / Redis 8 (RedisBloom)
BF.RESERVE seen:urls 0.001 100000000      # 0.1% FP, 100M items
BF.ADD     seen:urls "https://example.com/a"
BF.EXISTS  seen:urls "https://example.com/a"    # 1 = maybe, 0 = definitely not
CF.RESERVE seen:jobs 50000000
CF.ADD     seen:jobs job-8812
CF.DEL     seen:jobs job-8812                  # Cuckoo can delete; Bloom can't</pre>
<p><strong>HyperLogLog</strong> counts distinct items: hash each item, use the first 14 bits to pick one of 2<sup>14</sup> = <strong>16,384 registers</strong>, and store in it the longest run of leading zeros seen in the rest of the hash (a run of 20 zeros "suggests" ~2<sup>20</sup> distinct items). A harmonic mean across registers gives the estimate. Redis uses 6-bit registers: <strong>12 KB</strong> per key, standard error <strong>1.04/√16384 = 0.81%</strong>, whether you count 1,000 or 1 billion items. Registers merge by taking the max, so daily HLLs combine into a weekly unique count without double-counting:</p>
<pre>PFADD   uv:2026-11-13 user:17 user:42 user:99
PFADD   uv:2026-11-14 user:42 user:7
PFCOUNT uv:2026-11-13 uv:2026-11-14              # 4 (distinct across both days, ±0.81%)
PFMERGE uv:week:46 uv:2026-11-13 uv:2026-11-14</pre>
<table><tr><th>Question</th><th>Structure</th><th>Memory</th><th>Error</th></tr>
<tr><td>Seen this exact key?</td><td>Bloom (append-only) / Cuckoo (needs delete)</td><td>~10 bits/item at 1%</td><td>false positives only</td></tr>
<tr><td>How many distinct?</td><td>HyperLogLog</td><td>12 KB fixed (Redis)</td><td>~0.8% std error</td></tr>
<tr><td>How often did X occur?</td><td>Count-Min Sketch</td><td>width × depth counters</td><td>overestimates only</td></tr>
<tr><td>Near-duplicate of something seen?</td><td>MinHash + LSH / SimHash tables</td><td>512 B / 8 B per item + index</td><td>tunable threshold</td></tr></table>`,
        he: `<p>השיעור <code>infra-data-structures</code> הציג את המבנים האלה; כאן נראה איך לבחור ביניהם ואיך לקבוע להם גודל.</p>
<p><strong>Bloom filter</strong> — m ביטים, k hashes; "לא" זה ודאי, "כן" יכול להיות false positive. גודל אופטימלי: <strong>m/n = −ln(p) / (ln 2)²</strong> ביטים לפריט, ו-k = (m/n)·ln 2. עבור p = 1% זה <strong>9.6 ביטים לפריט ו-k ≈ 7</strong>; עבור 0.1%, 14.4 ביטים. מיליארד URLs ב-1% זה בערך <strong>1.2GB</strong>, מול יותר מ-60GB כדי לשמור את ה-URLs עצמם. חולשות: אין מחיקה (counting Bloom filter משתמש במונים של 4 ביט = פי 4 זיכרון), והוא לא יכול לגדול — קובעים לו גודל לפי ה-n הסופי, אחרת שיעור ה-false positives מטפס מהר.</p>
<p><strong>Cuckoo filter</strong> (Fan ואחרים, 2014) שומר <strong>fingerprint</strong> קטן (8-16 ביט) של כל פריט באחד משני buckets אפשריים (4 slots בכל אחד); הכנסה בועטת fingerprints קיימים ל-bucket החלופי שלהם, כמו ב-cuckoo hashing. הוא תומך ב-<strong>מחיקה</strong>, יש לו locality טוב יותר ב-lookup (2 קריאות זיכרון), והוא תופס פחות מקום מ-Bloom כשיעד ה-false positives נמוך מכ-3%. המלכודת: כשהטבלה מלאה בכ-95%, הכנסות מתחילות להיכשל — חייבים לקבוע גודל ולטפל בשגיאה.</p>
<pre># Redis Stack / Redis 8 (RedisBloom)
BF.RESERVE seen:urls 0.001 100000000      # 0.1% FP, 100M items
BF.ADD     seen:urls "https://example.com/a"
BF.EXISTS  seen:urls "https://example.com/a"    # 1 = maybe, 0 = definitely not
CF.RESERVE seen:jobs 50000000
CF.ADD     seen:jobs job-8812
CF.DEL     seen:jobs job-8812                  # Cuckoo can delete; Bloom can't</pre>
<p><strong>HyperLogLog</strong> סופר פריטים ייחודיים: עושים hash לכל פריט, משתמשים ב-14 הביטים הראשונים כדי לבחור אחד מתוך 2<sup>14</sup> = <strong>16,384 registers</strong>, ושומרים בו את הרצף הארוך ביותר של אפסים מובילים שנראה בשאר ה-hash (רצף של 20 אפסים "מרמז" על כ-2<sup>20</sup> פריטים ייחודיים). ממוצע הרמוני על פני ה-registers נותן את ההערכה. Redis משתמש ב-registers של 6 ביט: <strong>12KB</strong> לכל key, שגיאת תקן של <strong>1.04/√16384 = 0.81%</strong>, בין אם סופרים אלף פריטים או מיליארד. Registers מתמזגים על ידי לקיחת המקסימום, אז HLLs יומיים מתחברים לספירה שבועית של ייחודיים בלי ספירה כפולה:</p>
<pre>PFADD   uv:2026-11-13 user:17 user:42 user:99
PFADD   uv:2026-11-14 user:42 user:7
PFCOUNT uv:2026-11-13 uv:2026-11-14              # 4 (distinct across both days, ±0.81%)
PFMERGE uv:week:46 uv:2026-11-13 uv:2026-11-14</pre>
<table><tr><th>שאלה</th><th>מבנה</th><th>זיכרון</th><th>שגיאה</th></tr>
<tr><td>ראיתי את ה-key המדויק הזה?</td><td>Bloom (רק הוספה) / Cuckoo (צריך מחיקה)</td><td>כ-10 ביטים לפריט ב-1%</td><td>רק false positives</td></tr>
<tr><td>כמה ייחודיים?</td><td>HyperLogLog</td><td>12KB קבוע (Redis)</td><td>שגיאת תקן של כ-0.8%</td></tr>
<tr><td>כמה פעמים X הופיע?</td><td>Count-Min Sketch</td><td>רוחב × עומק מונים</td><td>רק הערכת יתר</td></tr>
<tr><td>כמעט-כפול של משהו שראיתי?</td><td>MinHash ו-LSH / טבלאות SimHash</td><td>512 בייט / 8 בייט לפריט ועוד index</td><td>threshold שאפשר לכוונן</td></tr></table>`
      }
    },
    {
      h: { en: "Where these live in infrastructure", he: "איפה הם חיים בתשתית" },
      body: {
        en: `<table><tr><th>Where</th><th>Problem</th><th>Technique</th></tr>
<tr><td>Log pipelines</td><td>10k copies of the same error with different IDs and hosts</td><td>Mask variables (numbers, UUIDs, IPs) → template hash for exact grouping; SimHash/MinHash on the template for near-identical stack traces (Sentry-style fingerprinting)</td></tr>
<tr><td>CDN edge caches</td><td>Most objects are requested once and evict useful ones</td><td>Akamai reported ~75% of objects are "one-hit wonders" and uses a Bloom filter to cache only on the 2nd request — big disk-write savings</td></tr>
<tr><td>Web crawlers</td><td>"Have I fetched this URL?" for billions of URLs; mirror pages</td><td>Bloom filter on normalized URLs; SimHash ≤ 3 bits for near-duplicate content</td></tr>
<tr><td>Spam / abuse</td><td>The same message with small mutations sent to 100k users</td><td>MinHash-LSH on character shingles; Count-Min Sketch for "this fingerprint is trending"</td></tr>
<tr><td>Data pipelines (Kafka, Flink, Spark)</td><td>At-least-once delivery creates duplicate events</td><td>Exact dedup by event id within a window (state store / RocksDB), Bloom in front to skip lookups for new ids</td></tr>
<tr><td>Storage engines</td><td>Avoid reading SSTables that can't contain the key</td><td>Bloom filter per SSTable (Cassandra, RocksDB; ~10 bits/key)</td></tr>
<tr><td>Analytics</td><td>Unique visitors / distinct users per day</td><td>HyperLogLog: Redis <code>PFCOUNT</code>, BigQuery <code>APPROX_COUNT_DISTINCT</code> (HLL++), Druid, ClickHouse <code>uniq</code></td></tr>
<tr><td>Search &amp; RAG</td><td>The same chunk indexed 20 times, crowding the top-k</td><td>MinHash dedup at ingest; cosine threshold on embeddings for semantic duplicates</td></tr></table>
<blockquote>💡 Real world: in a log pipeline, the cheapest 10× volume cut is usually exact: replace digits, hex and UUIDs with placeholders, hash the result, and count per hash per minute. "<code>timeout after 30s on host db-1</code>" and "<code>... db-7</code>" collapse into one template with count=2. Reach for MinHash only when exact templates still leave near-duplicates.</blockquote>
<blockquote>⚠️ Production tip: every sketch is <em>probabilistic</em>. Never use a Bloom "yes" as proof (billing, security decisions) and never use HLL for exact counts on invoices. Use sketches to skip work or estimate, and fall back to an exact check where a mistake costs money.</blockquote>`,
        he: `<table><tr><th>איפה</th><th>הבעיה</th><th>הטכניקה</th></tr>
<tr><td>Log pipelines</td><td>10 אלף עותקים של אותה שגיאה עם IDs ו-hosts שונים</td><td>מיסוך משתנים (מספרים, UUIDs, IPs) ואז hash של ה-template לקיבוץ מדויק; SimHash או MinHash על ה-template ל-stack traces כמעט זהים (fingerprinting בסגנון Sentry)</td></tr>
<tr><td>CDN edge caches</td><td>רוב האובייקטים מבוקשים פעם אחת ודוחקים החוצה אובייקטים שימושיים</td><td>Akamai דיווחו שבערך 75% מהאובייקטים הם "one-hit wonders", ומשתמשים ב-Bloom filter כדי לשמור ב-cache רק בבקשה השנייה — חיסכון גדול בכתיבות לדיסק</td></tr>
<tr><td>Web crawlers</td><td>"כבר הבאתי את ה-URL הזה?" למיליארדי URLs; דפי mirror</td><td>Bloom filter על URLs מנורמלים; SimHash של 3 ביטים או פחות לתוכן כמעט כפול</td></tr>
<tr><td>ספאם ו-abuse</td><td>אותה הודעה עם שינויים קטנים שנשלחת ל-100 אלף משתמשים</td><td>MinHash-LSH על shingles של תווים; Count-Min Sketch בשביל "ה-fingerprint הזה ב-trend"</td></tr>
<tr><td>Data pipelines (Kafka, Flink, Spark)</td><td>At-least-once delivery יוצר events כפולים</td><td>Dedup מדויק לפי event id בתוך חלון זמן (state store או RocksDB), עם Bloom מלפנים כדי לדלג על lookups ל-ids חדשים</td></tr>
<tr><td>Storage engines</td><td>לא לקרוא SSTables שלא יכולים להכיל את ה-key</td><td>Bloom filter לכל SSTable (Cassandra, RocksDB; בערך 10 ביטים ל-key)</td></tr>
<tr><td>Analytics</td><td>מבקרים ייחודיים / משתמשים ייחודיים ביום</td><td>HyperLogLog: <code>PFCOUNT</code> ב-Redis, <code>APPROX_COUNT_DISTINCT</code> ב-BigQuery (HLL++), Druid, ו-<code>uniq</code> ב-ClickHouse</td></tr>
<tr><td>Search ו-RAG</td><td>אותו chunk מאונדקס 20 פעם ותופס את ה-top-k</td><td>Dedup עם MinHash בזמן ה-ingest; threshold של cosine על embeddings לכפולים סמנטיים</td></tr></table>
<blockquote>💡 Real world: ב-log pipeline, החיתוך הכי זול של פי 10 בנפח הוא בדרך כלל מדויק: מחליפים ספרות, hex ו-UUIDs ב-placeholders, עושים hash לתוצאה וסופרים לכל hash בכל דקה. "<code>timeout after 30s on host db-1</code>" ו-"<code>... db-7</code>" מתכווצים ל-template אחד עם count=2. מגיעים ל-MinHash רק כשאחרי templates מדויקים עדיין נשארים כמעט-כפולים.</blockquote>
<blockquote>⚠️ Production tip: כל sketch הוא <em>הסתברותי</em>. אף פעם אל תשתמש ב-"כן" של Bloom כהוכחה (חיוב, החלטות אבטחה), ואף פעם אל תשתמש ב-HLL לספירות מדויקות בחשבוניות. משתמשים ב-sketches כדי לדלג על עבודה או להעריך, ונופלים חזרה לבדיקה מדויקת איפה שטעות עולה כסף.</blockquote>`
      }
    }
  ],
  diagram: "doc -> shingles {k-grams} -> MinHash signature [128 x min-hash] -> LSH bands (b=20 x r=5) -> buckets\n                                                                          | share any bucket?\n                                                                          v\n                                                  candidates only -> exact Jaccard >= 0.8 -> duplicate\n\ndoc -> weighted features -> SimHash (64 bit) -> 4 tables keyed by 16-bit blocks -> Hamming <= 3\n\"seen?\" -> Bloom / Cuckoo      \"how many distinct?\" -> HyperLogLog (12 KB)",
  handsOn: [
    { cmd: "redis-cli PFADD uv:today u1 u2 u3 u2 && redis-cli PFCOUNT uv:today && redis-cli MEMORY USAGE uv:today", what: { en: "Count distinct users with HLL; note the tiny sparse encoding at first (grows to ~12 KB dense).", he: "ספירת משתמשים ייחודיים עם HLL; שים לב לקידוד ה-sparse הקטן בהתחלה (גדל לכ-12KB במצב dense)." } },
    { cmd: "redis-cli BF.RESERVE seen 0.01 1000000 && redis-cli BF.ADD seen a && redis-cli BF.EXISTS seen a && redis-cli BF.EXISTS seen b", what: { en: "A Bloom filter for 1M items at 1% FP (needs Redis Stack or Redis 8).", he: "Bloom filter למיליון פריטים ב-1% false positives (צריך Redis Stack או Redis 8)." } },
    { cmd: "pip install datasketch && python3 -c \"from datasketch import MinHash; a,b=MinHash(128),MinHash(128); [a.update(w.encode()) for w in 'db timeout on host db-1'.split()]; [b.update(w.encode()) for w in 'db timeout on host db-2'.split()]; print(a.jaccard(b))\"", what: { en: "Estimate Jaccard of two log lines (true value: 4/6 = 0.67).", he: "הערכת Jaccard של שתי שורות לוג (הערך האמיתי: 4/6 = 0.67)." } },
    { cmd: "bq query --use_legacy_sql=false 'SELECT APPROX_COUNT_DISTINCT(user_id), COUNT(DISTINCT user_id) FROM analytics.events'", what: { en: "Compare HLL++ to an exact distinct count — and the bytes/slot time each one costs.", he: "השוואה בין HLL++ לספירה מדויקת של ייחודיים — וכמה בייטים וזמן slot כל אחת עולה." } }
  ],
  mnemonic: { en: "Jaccard on shingles, MinHash to shrink, LSH to skip pairs, SimHash for the web, Bloom says 'maybe', HLL counts in 12 KB.", he: "Jaccard על shingles, MinHash כדי לכווץ, LSH כדי לדלג על זוגות, SimHash ל-web, Bloom אומר \"אולי\", HLL סופר ב-12KB." },
  pitfalls: [
    { en: "Comparing all pairs 'because it's only 2M items': that's 2×10^12 pairs. Use LSH or SimHash tables to generate candidates first.", he: "להשוות את כל הזוגות \"כי זה רק 2 מיליון פריטים\": זה 2×10^12 זוגות. משתמשים ב-LSH או בטבלאות SimHash כדי לייצר מועמדים קודם." },
    { en: "Undersizing a Bloom filter: at 2× the planned items the FP rate goes from 1% to ~15%. Size for the final n, or use a scalable Bloom filter (RedisBloom expands by stacking filters).", he: "לקבוע ל-Bloom filter גודל קטן מדי: בפי 2 מהפריטים המתוכננים, שיעור ה-false positives עולה מ-1% לבערך 15%. קובעים גודל לפי ה-n הסופי, או משתמשים ב-scalable Bloom filter (RedisBloom מתרחב על ידי הוספת filters)." },
    { en: "Using Bloom where you need deletes (expiring sessions, cancelled jobs): stale bits stay forever. Use a Cuckoo filter or rotate time-bucketed Bloom filters.", he: "להשתמש ב-Bloom כשצריך מחיקות (sessions שפגו, jobs שבוטלו): ביטים ישנים נשארים לנצח. תשתמש ב-Cuckoo filter או תחליף Bloom filters לפי חלונות זמן." },
    { en: "Expecting MinHash or SimHash to catch paraphrases. They are lexical; use embeddings with a cosine threshold for semantic duplicates.", he: "לצפות ש-MinHash או SimHash יתפסו פרפרזות. הם לקסיקליים; לכפולים סמנטיים משתמשים ב-embeddings עם threshold של cosine." }
  ],
  interview: [
    { q: { en: "Design near-duplicate detection for 1 billion web pages.", he: "תתכנן זיהוי של דפים כמעט כפולים ל-מיליארד דפי web." },
      a: { en: "Normalize the page (strip boilerplate), extract weighted features, compute a 64-bit SimHash (8 bytes × 1B = 8 GB). Near-duplicate = Hamming ≤ 3. For lookup, permute/split the 64 bits into 4 blocks of 16 and keep 4 tables keyed by each block; a new page queries 4 exact lookups and checks Hamming on the small candidate set. Alternative with better precision: MinHash (128 hashes) + LSH banding tuned so the S-curve threshold sits at J ≈ 0.8, then verify candidates. Shard by block value, run as a batch job plus an online path for newly crawled pages.", he: "מנרמלים את הדף (מסירים boilerplate), מחלצים features עם משקלים ומחשבים SimHash של 64 ביט (8 בייט × מיליארד = 8GB). כמעט-כפול = Hamming של 3 או פחות. לחיפוש, מחלקים את 64 הביטים ל-4 בלוקים של 16 ומחזיקים 4 טבלאות לפי כל בלוק; דף חדש עושה 4 lookups מדויקים ובודק Hamming על קבוצת מועמדים קטנה. חלופה עם precision טוב יותר: MinHash (128 hashes) ו-LSH banding שמכוונן כך שה-threshold של עקומת ה-S יהיה ב-J ≈ 0.8, ואז מאמתים מועמדים. עושים sharding לפי ערך הבלוק, ומריצים כ-batch job ועוד מסלול online לדפים חדשים." } },
    { q: { en: "Count unique daily and weekly visitors for 500M events/day with bounded memory.", he: "תספור מבקרים ייחודיים ביום ובשבוע ל-500 מיליון events ביום עם זיכרון חסום." },
      a: { en: "HyperLogLog per day (Redis PFADD, 12 KB per key, 0.81% error). Weekly/monthly = PFMERGE of the daily keys (register-wise max), so no double counting and no raw ids kept. If you need per-segment counts (country × device), keep one HLL per segment — still KBs each. Use exact COUNT(DISTINCT) only for billing.", he: "HyperLogLog לכל יום (PFADD ב-Redis, 12KB לכל key, שגיאה של 0.81%). שבועי או חודשי = PFMERGE של ה-keys היומיים (מקסימום לפי register), אז אין ספירה כפולה ולא שומרים ids גולמיים. אם צריך ספירה לכל סגמנט (מדינה × מכשיר), מחזיקים HLL לכל סגמנט — עדיין KBs לכל אחד. COUNT(DISTINCT) מדויק רק לחיוב." } }
  ],
  quiz: [
    { q: { en: "Why does MinHash estimate Jaccard similarity?", he: "למה MinHash מעריך Jaccard similarity?" },
      options: [ { en: "Because hashes of similar strings are numerically close", he: "כי hashes של מחרוזות דומות קרובים מספרית" }, { en: "Because P[min h(A) = min h(B)] equals |A∩B| / |A∪B|", he: "כי P[min h(A) = min h(B)] שווה ל-|A∩B| / |A∪B|" }, { en: "Because it counts shared characters", he: "כי הוא סופר תווים משותפים" }, { en: "Because it uses cosine similarity internally", he: "כי הוא משתמש ב-cosine similarity מבפנים" } ], answer: 1,
      explain: { en: "The minimum hash over A ∪ B is a uniformly random element of the union; both sets share that minimum exactly when the element is in the intersection.", he: "ה-hash המינימלי על A ∪ B הוא איבר אקראי אחיד מהאיחוד; שתי הקבוצות חולקות את המינימום הזה בדיוק כשהאיבר נמצא בחיתוך." } },
    { q: { en: "LSH with b = 20 bands × r = 5 rows. Two docs with Jaccard 0.8 become candidates with probability about:", he: "LSH עם b = 20 bands × r = 5 שורות. שני מסמכים עם Jaccard של 0.8 הופכים למועמדים בהסתברות של בערך:" },
      options: [ { en: "0.33", he: "0.33" }, { en: "0.80", he: "0.80" }, { en: "0.9996", he: "0.9996" }, { en: "0.006", he: "0.006" } ], answer: 2,
      explain: { en: "1 − (1 − 0.8^5)^20 = 1 − (1 − 0.328)^20 ≈ 0.9996. At J = 0.2 it's only 0.006 — that's the S-curve.", he: "1 − (1 − 0.8^5)^20 = 1 − (1 − 0.328)^20 ≈ 0.9996. ב-J = 0.2 זה רק 0.006 — זו עקומת ה-S." } },
    { q: { en: "You need a 'seen' set for job ids that also supports removing cancelled jobs, at 0.5% FP. Best fit?", he: "אתה צריך קבוצת \"ראיתי\" ל-job ids שתומכת גם בהסרת jobs שבוטלו, ב-0.5% false positives. מה הכי מתאים?" },
      options: [ { en: "Bloom filter", he: "Bloom filter" }, { en: "HyperLogLog", he: "HyperLogLog" }, { en: "Cuckoo filter", he: "Cuckoo filter" }, { en: "Count-Min Sketch", he: "Count-Min Sketch" } ], answer: 2,
      explain: { en: "Cuckoo filters store fingerprints, so they support delete, and they beat Bloom on space below ~3% FP. Bloom can't delete; HLL counts; CMS estimates frequencies.", he: "Cuckoo filters שומרים fingerprints, ולכן תומכים במחיקה, והם חסכוניים יותר מ-Bloom במקום מתחת לכ-3% false positives. Bloom לא יכול למחוק; HLL סופר; CMS מעריך תדירויות." } },
    { q: { en: "Redis HyperLogLog uses about how much memory per key, and with what error?", he: "כמה זיכרון בערך HyperLogLog של Redis תופס לכל key, ובאיזו שגיאה?" },
      options: [ { en: "12 KB, ~0.81% standard error", he: "12KB, שגיאת תקן של כ-0.81%" }, { en: "1 MB, exact", he: "1MB, מדויק" }, { en: "Grows with the number of items, ~5% error", he: "גדל עם מספר הפריטים, שגיאה של כ-5%" }, { en: "64 bytes, ~10% error", he: "64 בייט, שגיאה של כ-10%" } ], answer: 0,
      explain: { en: "16,384 six-bit registers ≈ 12 KB; error = 1.04/√16384 ≈ 0.81%, independent of cardinality.", he: "16,384 registers של 6 ביט ≈ 12KB; השגיאה היא 1.04/√16384 ≈ 0.81%, בלי קשר ל-cardinality." } }
  ],
  related: ["infra-data-structures", "db-vector", "crypto-hashing-practice", "redis-deep", "obs-logging-pipeline", "algo-edit-distance", "algo-search-ranking"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  { term: "Levenshtein distance", track: "data", def: { en: "Minimum number of single-character insertions, deletions and substitutions to turn one string into another; computed with an O(n·m) DP table (kitten → sitting = 3).", he: "המספר המינימלי של הוספות, מחיקות והחלפות של תו בודד שהופכות מחרוזת אחת לאחרת; מחושב עם טבלת DP של O(n·m) (kitten ← sitting = 3)." }, lesson: "algo-edit-distance" },
  { term: "SymSpell", track: "data", def: { en: "Spelling-correction algorithm that precomputes deletion-only variants of every dictionary word, so fuzzy lookup becomes a few hash-map hits instead of a scan.", he: "אלגוריתם לתיקון איות שמחשב מראש וריאציות של מחיקות בלבד לכל מילה במילון, כך ש-fuzzy lookup הופך לכמה פגיעות ב-hash map במקום סריקה." }, lesson: "algo-edit-distance" },
  { term: "pg_trgm", track: "data", def: { en: "Postgres extension that splits text into trigrams; similarity() is Jaccard over trigram sets, and a GIN/GiST index accelerates fuzzy matches and ILIKE '%x%'.", he: "Extension של Postgres שמפרק טקסט ל-trigrams; ה-similarity() הוא Jaccard על קבוצות trigrams, ו-GIN או GiST index מאיץ התאמות fuzzy ו-ILIKE '%x%'." }, lesson: "algo-edit-distance" },
  { term: "Search analyzer", track: "data", def: { en: "The pipeline (char filters → tokenizer → token filters) that turns text into index tokens; documents and queries must go through compatible analyzers or nothing matches.", he: "ה-pipeline (char filters ← tokenizer ← token filters) שהופך טקסט ל-token-ים ב-index; מסמכים ו-queries חייבים לעבור analyzers תואמים, אחרת שום דבר לא מתאים." }, lesson: "algo-search-ranking" },
  { term: "Stemming", track: "data", def: { en: "Rule-based suffix stripping that maps word forms to a common stem (running → run); fast but imprecise, unlike dictionary-based lemmatization.", he: "חיתוך סיומות לפי חוקים שממפה צורות של מילה ל-stem משותף (running ← run); מהיר אבל לא מדויק, בניגוד ל-lemmatization שמבוסס על מילון." }, lesson: "algo-search-ranking" },
  { term: "nDCG", track: "data", def: { en: "Normalized Discounted Cumulative Gain: ranking-quality metric that rewards highly relevant results near the top, divided by the ideal ordering's score (0..1).", he: "Normalized Discounted Cumulative Gain: מדד איכות דירוג שמתגמל תוצאות רלוונטיות מאוד בראש הרשימה, מחולק בציון של הסדר האידיאלי (בין 0 ל-1)." }, lesson: "algo-search-ranking" },
  { term: "MinHash", track: "data", def: { en: "Sketch that keeps the minimum hash of a set under many hash functions; the fraction of matching minimums estimates Jaccard similarity, and LSH banding finds near-duplicates without all-pairs comparison.", he: "Sketch ששומר את ה-hash המינימלי של קבוצה תחת הרבה hash functions; שיעור המינימומים התואמים מעריך Jaccard similarity, ו-LSH banding מוצא כמעט-כפולים בלי להשוות את כל הזוגות." }, lesson: "algo-similarity-dedup" },
  { term: "SimHash", track: "data", def: { en: "64-bit fingerprint where similar documents differ in few bits; Google's crawler treated pages within Hamming distance 3 as near-duplicates.", he: "Fingerprint של 64 ביט שבו מסמכים דומים שונים במעט ביטים; ה-crawler של Google התייחס לדפים במרחק Hamming של עד 3 ככמעט כפולים." }, lesson: "algo-similarity-dedup" },
  { term: "Cuckoo filter", track: "data", def: { en: "Approximate membership filter storing small fingerprints in two candidate buckets; like a Bloom filter but supports delete and is smaller below ~3% false-positive rate.", he: "Filter הסתברותי לשייכות ששומר fingerprints קטנים באחד משני buckets; כמו Bloom filter אבל תומך במחיקה וקטן יותר מתחת לכ-3% false positives." }, lesson: "algo-similarity-dedup" }
);

// ---------------------------------------------------------------------------
// Scenario: product search returns nothing
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "search-returns-nothing",
  icon: "🔍",
  title: { en: "Product search finds nothing", he: "חיפוש המוצרים לא מוצא כלום" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Monday 10:15. Over the weekend the team migrated product search to a new Elasticsearch 8 cluster with a fresh index template. Support is flooded: 'search finds nothing'. Sales from search are down 18% vs last Monday. The old cluster was decommissioned on Sunday.",
        he: "יום שני, 10:15. בסוף השבוע הצוות העביר את חיפוש המוצרים לקלאסטר Elasticsearch 8 חדש עם index template חדש. התמיכה מוצפת: \"החיפוש לא מוצא כלום\". המכירות שמגיעות מחיפוש ירדו ב-18% לעומת יום שני שעבר. הקלאסטר הישן פורק ביום ראשון."
      },
      data: "search-analytics (last 24h)\n  zero-result rate:  23.7%   (baseline 4.1%)\n  p95 latency:       41 ms   (fine)\n  cluster health:    green\n\ntop zero-result queries:\n  באוזניות        1,912\n  האוזניות        1,407\n  headphnes         988\n  לאייפון           861\n  ןפיםמק            344\n  אזניות            301",
      choices: [
        { label: { en: "Compare how the old and new index analyze these exact queries", he: "להשוות איך ה-index הישן והחדש מנתחים בדיוק את ה-queries האלה" }, next: "s2", score: 10,
          feedback: { en: "Right: latency and health are fine, so this is a relevance/matching problem. Hebrew prefixes, a typo and a wrong-layout query all fail together — that smells like the analyzer and the query, not the cluster.", he: "נכון: ה-latency וה-health תקינים, אז זו בעיית התאמה, לא בעיית קלאסטר. תחיליות בעברית, שגיאת הקלדה ו-query במקלדת הלא נכונה נכשלים ביחד — זה מריח כמו ה-analyzer וה-query." } },
        { label: { en: "Scale out the data nodes; maybe queries are timing out", he: "להוסיף data nodes; אולי ה-queries נכנסים ל-timeout" }, next: "s2", score: -10,
          feedback: { en: "p95 is 41 ms and the cluster is green. Timeouts would show as errors, not zero results. You spent 40 minutes and money on nodes that changed nothing.", he: "ה-p95 הוא 41ms והקלאסטר ירוק. timeouts היו מופיעים כשגיאות, לא כאפס תוצאות. בזבזת 40 דקות וכסף על nodes שלא שינו כלום." } },
        { label: { en: "Tell support users should type more carefully", he: "להגיד לתמיכה שהמשתמשים צריכים להקליד יותר בזהירות" }, next: "lose", score: -20,
          feedback: { en: "Zero-result rate went from 4% to 24% overnight — users didn't change, the system did.", he: "ה-zero-result rate קפץ מ-4% ל-24% בין לילה — המשתמשים לא השתנו, המערכת השתנתה." } }
      ]
    },
    s2: {
      text: {
        en: "You run _analyze on the new index and dig the old index settings out of the migration repo. You also check the query the API sends.",
        he: "אתה מריץ _analyze על ה-index החדש ומוציא את ההגדרות של ה-index הישן מה-repo של המיגרציה. אתה גם בודק את ה-query שה-API שולח."
      },
      data: "POST products_v3/_analyze {\"field\": \"name\", \"text\": \"באוזניות\"}\n{ \"tokens\": [ { \"token\": \"באוזניות\", \"type\": \"<ALPHANUM>\", \"position\": 0 } ] }\n\nGET products_v3/_mapping  ->  \"name\": { \"type\": \"text\" }          # analyzer: standard (default)\n\nold index (git: search-infra/products_v2.json):\n  \"name\": { \"type\": \"text\", \"analyzer\": \"he_products\" }   # niqqud strip + prefix variants + synonyms\n\nAPI query (new search-service v2.0):\n  { \"match\": { \"name\": { \"query\": \"באוזניות\", \"operator\": \"and\" } } }   # no fuzziness",
      choices: [
        { label: { en: "Restore a Hebrew-aware analyzer in the mapping and add fuzziness to the query", he: "להחזיר analyzer שמבין עברית ל-mapping ולהוסיף fuzziness ל-query" }, next: "s3", score: 10,
          feedback: { en: "Two regressions found: the template lost the custom analyzer (prefixes no longer stripped) and the new service dropped fuzziness (typos no longer forgiven).", he: "מצאת שתי רגרסיות: ה-template איבד את ה-analyzer המותאם (התחיליות כבר לא מוסרות) והשירות החדש הוריד את ה-fuzziness (שגיאות הקלדה כבר לא נסלחות)." } },
        { label: { en: "Hot-fix the API to send a wildcard query: *באוזניות*", he: "Hot-fix ל-API שישלח wildcard query: *באוזניות*" }, next: "s3", score: -15,
          feedback: { en: "A leading wildcard scans the whole term dictionary: CPU hit 95% on every data node and p95 went to 2.3 s. And '*באוזניות*' still doesn't match 'אוזניות'. You reverted after 15 minutes.", he: "Wildcard בהתחלה סורק את כל מילון ה-terms: ה-CPU הגיע ל-95% בכל data node וה-p95 עלה ל-2.3 שניות. ו-'*באוזניות*' עדיין לא מתאים ל-'אוזניות'. עשית revert אחרי 15 דקות." } },
        { label: { en: "PUT _mapping to switch the existing 'name' field to the he_products analyzer", he: "PUT _mapping כדי להעביר את השדה הקיים 'name' ל-analyzer בשם he_products" }, next: "s3", score: -5,
          feedback: { en: "Elasticsearch refuses: 'Mapper for [name] conflicts with existing mapper: Cannot update parameter [analyzer] from [default] to [he_products]'. Existing tokens are already on disk — an analyzer change always needs a reindex.", he: "Elasticsearch מסרב: 'Mapper for [name] conflicts with existing mapper: Cannot update parameter [analyzer] from [default] to [he_products]'. ה-token-ים הקיימים כבר על הדיסק — שינוי analyzer תמיד דורש reindex." } }
      ]
    },
    s3: {
      text: {
        en: "Time to design the fix. Product names are short (2-6 words), mixed Hebrew and English, ~4M documents.",
        he: "הגיע הזמן לתכנן את התיקון. שמות המוצרים קצרים (2-6 מילים), מעורבים בעברית ובאנגלית, בערך 4 מיליון מסמכים."
      },
      data: "proposal A:\n  name      -> he_products (strip niqqud, lowercase, asciifolding,\n               pattern_capture [ובהלמשכ]{1,2} with preserve_original, synonyms)\n  name.raw  -> standard            (boost ^2, exact form ranks first)\n  query: multi_match name.raw^2, name ; fuzziness AUTO ; prefix_length 1 ; max_expansions 50\n\nproposal B:\n  keep standard analyzer; query fuzziness 2 ; prefix_length 0\n\nproposal C:\n  edge_ngram min_gram 1, max_gram 20 on name for index AND search",
      choices: [
        { label: { en: "Proposal A", he: "הצעה A" }, next: "s4", score: 10,
          feedback: { en: "Prefix variants fix Hebrew, the raw subfield keeps exact matches on top, AUTO + prefix_length 1 forgives typos cheaply, and synonyms cover 'אזניות' ↔ 'אוזניות'.", he: "גרסאות בלי תחיליות מתקנות את העברית, תת-השדה raw שומר התאמות מדויקות למעלה, AUTO עם prefix_length 1 סולח על שגיאות בזול, ו-synonyms מכסים את 'אזניות' ↔ 'אוזניות'." } },
        { label: { en: "Proposal B: no reindex, just fuzziness 2", he: "הצעה B: בלי reindex, רק fuzziness 2" }, next: "s4", score: -5,
          feedback: { en: "Fuzziness 2 on short words matches garbage ('usb' ↔ 'ssd' ↔ 'sd'), prefix_length 0 makes every query walk the whole term automaton, and two stacked prefixes ('ולאוזניות') still fail. Partial fix, noisy results.", he: "Fuzziness 2 במילים קצרות מתאים לזבל ('usb' ↔ 'ssd' ↔ 'sd'), prefix_length 0 גורם לכל query ללכת על כל ה-automaton של ה-terms, ושתי תחיליות ('ולאוזניות') עדיין נכשלות. תיקון חלקי עם תוצאות רועשות." } },
        { label: { en: "Proposal C: edge n-grams everywhere", he: "הצעה C: edge n-grams בכל מקום" }, next: "s4", score: -5,
          feedback: { en: "N-gramming the query too means 'ב' alone matches every word starting with ב, and min_gram 1 roughly triples the index. Edge n-grams fix suffixes of typing, not Hebrew prefixes.", he: "לפרק גם את ה-query ל-n-grams אומר ש-'ב' לבד מתאים לכל מילה שמתחילה ב-ב, ו-min_gram 1 מגדיל את ה-index בערך פי 3. Edge n-grams פותרים הקלדה חלקית בסוף המילה, לא תחיליות בעברית." } }
      ]
    },
    s4: {
      text: {
        en: "The new analyzer is ready. The API reads through the alias 'products', which points at products_v3. How do you roll it out?",
        he: "ה-analyzer החדש מוכן. ה-API קורא דרך ה-alias בשם 'products', שמצביע על products_v3. איך אתה מעלה את זה?"
      },
      data: "GET _alias/products\n{ \"products_v3\": { \"aliases\": { \"products\": {} } } }\n\nPOST products_v4/_analyze {\"field\": \"name\", \"text\": \"באוזניות\"}\n{ \"tokens\": [\n  { \"token\": \"באוזניות\", \"position\": 0 },\n  { \"token\": \"אוזניות\",  \"position\": 0 } ] }",
      choices: [
        { label: { en: "Create products_v4, _reindex from v3 (slices=auto), run the judged query set, then swap the alias atomically", he: "ליצור products_v4, לעשות _reindex מ-v3 (slices=auto), להריץ את סט ה-queries המשופט, ואז להחליף את ה-alias באופן אטומי" }, next: "s5", score: 10,
          feedback: { en: "Zero downtime, instant rollback (point the alias back to v3), and you verified before users saw it. Writes during the reindex are replayed from the outbox/CDC offset you noted.", he: "בלי downtime, rollback מיידי (מחזירים את ה-alias ל-v3), ואימתת לפני שמשתמשים ראו. כתיבות שקרו בזמן ה-reindex מנוגנות מחדש מה-offset של ה-outbox או ה-CDC שרשמת." } },
        { label: { en: "Delete products_v3 and recreate it with the new settings, then re-ingest", he: "למחוק את products_v3 וליצור אותו מחדש עם ההגדרות החדשות, ואז לטעון מחדש" }, next: "lose", score: -25,
          feedback: { en: "Search returned 100% zero results for the 50 minutes the re-ingest took — in business hours. The alias exists exactly so you never do this.", he: "החיפוש החזיר 100% אפס תוצאות במשך 50 הדקות שלקחה הטעינה מחדש — בשעות העבודה. ה-alias קיים בדיוק כדי שלעולם לא תעשה את זה." } },
        { label: { en: "Reindex into v4 and add it to the alias next to v3", he: "לעשות reindex ל-v4 ולהוסיף אותו ל-alias לצד v3" }, next: "s5", score: -5,
          feedback: { en: "Now every product appears twice and scores differ between the two indexes. You removed v3 from the alias 20 minutes later. Swap with one _aliases call (remove + add) instead.", he: "עכשיו כל מוצר מופיע פעמיים והציונים שונים בין שני ה-indexes. הוצאת את v3 מה-alias אחרי 20 דקות. צריך להחליף בקריאת _aliases אחת (remove ו-add)." } }
      ]
    },
    s5: {
      text: {
        en: "Alias swapped. Two hours later the dashboard looks much better, but one query still returns nothing.",
        he: "ה-alias הוחלף. שעתיים אחר כך הדשבורד נראה הרבה יותר טוב, אבל query אחד עדיין לא מחזיר כלום."
      },
      data: "zero-result rate (last 2h):  4.6%   (was 23.7%, baseline 4.1%)\n  באוזניות     -> 2,340 hits\n  headphnes    -> 1,118 hits   (fuzzy: headphones, d=1)\n  לאייפון      ->   960 hits\n  ןפיםמק       ->     0 hits   ('iphone' typed on a Hebrew keyboard layout)",
      choices: [
        { label: { en: "Add a keyboard-layout retry in the API when a query returns 0 hits, plus an alert on zero-result rate > 8% for 15 min and the judged query set in CI", he: "להוסיף ב-API ניסיון חוזר עם המרת פריסת מקלדת כש-query מחזיר 0 תוצאות, ועוד התראה על zero-result rate מעל 8% במשך 15 דקות, ואת סט ה-queries המשופט ב-CI" }, next: "win", score: 10,
          feedback: { en: "'ןפיםמק' → 'iphone' is a key-map problem, not edit distance. And the alert plus CI check would have caught this whole incident on Saturday night.", he: "'ןפיםמק' ← 'iphone' זו בעיה של מפת מקשים, לא של edit distance. וההתראה ובדיקת ה-CI היו תופסות את כל התקלה הזאת כבר במוצאי שבת." } },
        { label: { en: "Raise fuzziness to 2 for everything so 'ןפיםמק' matches", he: "להעלות fuzziness ל-2 לכולם כדי ש-'ןפיםמק' יתאים" }, next: "win", score: -5,
          feedback: { en: "Every character of 'ןפיםמק' differs from 'iphone' — no fuzziness fixes it, and fuzziness 2 adds noise to all short queries. You rolled it back; the incident is closed but without guardrails.", he: "כל תו ב-'ןפיםמק' שונה מ-'iphone' — שום fuzziness לא יתקן את זה, ו-fuzziness 2 מוסיף רעש לכל ה-queries הקצרים. עשית rollback; התקלה נסגרה, אבל בלי מנגנוני הגנה." } }
      ]
    },
    win: {
      text: {
        en: "Resolved. Zero-result rate is back to 4.2%, search revenue recovered by the afternoon. The postmortem's action items: index templates are code-reviewed with an _analyze diff, the judged query set (300 Hebrew/English queries, nDCG@10) runs in CI, and zero-result rate pages on-call.",
        he: "נפתר. ה-zero-result rate חזר ל-4.2%, וההכנסות מחיפוש התאוששו עד אחר הצהריים. ה-action items של ה-postmortem: index templates עוברים code review עם diff של _analyze, סט ה-queries המשופט (300 queries בעברית ובאנגלית, nDCG@10) רץ ב-CI, ו-zero-result rate מקפיץ את ה-on-call."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The incident drags on: users keep getting empty results and search revenue stays down for the day. The root cause — a template that dropped the Hebrew analyzer and a service that dropped fuzziness — was found by someone else running _analyze.",
        he: "התקלה נמשכת: משתמשים ממשיכים לקבל תוצאות ריקות וההכנסות מחיפוש נשארות למטה כל היום. את ה-root cause — template שאיבד את ה-analyzer לעברית ושירות שהוריד את ה-fuzziness — מצא מישהו אחר שהריץ _analyze."
      },
      end: "lose"
    }
  },
  lessons: ["algo-search-ranking", "algo-edit-distance", "db-search-engines"]
});
