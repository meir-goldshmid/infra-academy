// Interview prep — coding problems with an infrastructure twist (INFRA.problems)
// Each problem: statement, examples, progressive hints, runnable Python 3 solution, walkthrough, complexity, follow-ups.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.problems = window.INFRA.problems || [];

/* ------------------------------------------------------------------ */
/* 0. Playbook                                                         */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "coding-playbook",
  icon: "🧭",
  difficulty: "easy",
  tags: ["strategy"],
  title: { en: "Coding Interview Playbook", he: "ה-Playbook לראיון קוד" },
  statement: {
    en: `<p>Before solving any problem, learn <strong>how</strong> to run a 45-minute coding round. Interviewers grade the process (communication, structure, testing) almost as much as the final code.</p>
<ol>
<li><strong>Clarify (2-5 min).</strong> Restate the problem in your own words. Ask about input size, value ranges, duplicates, empty input, sorted or not, streaming or batch, what to return when there is no answer.</li>
<li><strong>Examples.</strong> Write one normal example and one edge case on the board <em>before</em> coding. Agree on the expected output.</li>
<li><strong>Brute force first.</strong> Say the naive solution and its complexity out loud ("O(n²) with two loops"). It proves you understand the problem and gives you a fallback.</li>
<li><strong>Optimize.</strong> Ask: what work is repeated? Can a hashmap remember it? Can sorting, a heap or a window remove a loop? Name the pattern.</li>
<li><strong>Code while talking.</strong> Narrate decisions, use clear names, write small helpers. Silence is the #1 reason good candidates get "no hire".</li>
<li><strong>Test.</strong> Dry-run your example line by line, then edge cases: empty, one element, duplicates, negative numbers, huge values, cycles.</li>
<li><strong>Complexity.</strong> State time and space, and what would change at 100x scale.</li>
</ol>
<p><strong>Pattern cheat sheet</strong></p>
<table>
<tr><th>Pattern</th><th>Signal in the question</th><th>Example problems</th></tr>
<tr><td>Hashmap / set</td><td>"find a pair", "seen before?", counting, dedup</td><td>Two Sum, Top-K IPs, log counter</td></tr>
<tr><td>Two pointers</td><td>sorted array, pairs, in-place compaction</td><td>3Sum, remove duplicates, container with most water</td></tr>
<tr><td>Sliding window</td><td>"last N seconds", longest/shortest contiguous range</td><td>Rate limiter, hit counter, longest substring without repeats</td></tr>
<tr><td>Heap</td><td>top-K, k-th largest, merge K sorted, "next earliest"</td><td>Merge K logs, p99 stream, meeting rooms</td></tr>
<tr><td>BFS / DFS</td><td>grid, graph, connectivity, shortest path in unweighted graph</td><td>Number of islands, network segments</td></tr>
<tr><td>Topological sort</td><td>dependencies, ordering, "can we finish?"</td><td>Course schedule, deploy order, build systems</td></tr>
<tr><td>Binary search</td><td>sorted data, "first/last time when", monotonic answer</td><td>Time-based KV store, search rotated array</td></tr>
<tr><td>Intervals</td><td>start/end pairs, overlaps, windows</td><td>Merge intervals, meeting rooms, downtime</td></tr>
<tr><td>Union-Find</td><td>dynamic connectivity, "are these in the same group?"</td><td>Network partitions, redundant connection</td></tr>
<tr><td>Dynamic programming</td><td>"number of ways", min/max cost, choices with overlap</td><td>Coin change, edit distance, knapsack</td></tr>
</table>`,
    he: `<p>לפני שפותרים בעיה, צריך לדעת <strong>איך</strong> מנהלים סבב קוד של 45 דקות. המראיינים מעריכים את התהליך (תקשורת, מבנה, בדיקות) כמעט באותה מידה כמו את הקוד הסופי.</p>
<ol>
<li><strong>Clarify (2-5 דק').</strong> תנסח מחדש את הבעיה במילים שלך. תשאל על גודל ה-input, טווח ערכים, כפילויות, input ריק, האם ממוין, streaming או batch, ומה מחזירים כשאין תשובה.</li>
<li><strong>Examples.</strong> תכתוב דוגמה רגילה אחת ו-edge case אחד על הלוח <em>לפני</em> שמתחילים לקודד. תסגרו ביחד מה ה-output הצפוי.</li>
<li><strong>Brute force קודם.</strong> תגיד בקול את הפתרון הנאיבי ואת ה-complexity שלו ("O(n²) עם שתי לולאות"). זה מראה שהבנת את הבעיה ונותן לך רשת ביטחון.</li>
<li><strong>אופטימיזציה.</strong> תשאל: איזו עבודה חוזרת על עצמה? hashmap יכול לזכור אותה? מיון, heap או window יכולים להוריד לולאה? תן שם ל-pattern.</li>
<li><strong>לקודד תוך כדי דיבור.</strong> תסביר החלטות, שמות ברורים, פונקציות עזר קטנות. שתיקה היא הסיבה מספר 1 שמועמדים טובים מקבלים "no hire".</li>
<li><strong>בדיקות.</strong> תעשה dry-run על הדוגמה שורה-שורה, ואז edge cases: ריק, איבר אחד, כפילויות, מספרים שליליים, ערכים ענקיים, מעגלים.</li>
<li><strong>Complexity.</strong> תגיד time ו-space, ומה ישתנה בסקייל של פי 100.</li>
</ol>
<p><strong>שליפה מהירה של patterns</strong></p>
<table>
<tr><th>Pattern</th><th>הסימן בשאלה</th><th>בעיות לדוגמה</th></tr>
<tr><td>Hashmap / set</td><td>"תמצא זוג", "ראינו כבר?", ספירה, dedup</td><td>Two Sum, Top-K IPs, ספירת לוגים</td></tr>
<tr><td>Two pointers</td><td>מערך ממוין, זוגות, דחיסה in-place</td><td>3Sum, הסרת כפילויות, container with most water</td></tr>
<tr><td>Sliding window</td><td>"N השניות האחרונות", הטווח הרציף הכי ארוך/קצר</td><td>Rate limiter, hit counter, longest substring</td></tr>
<tr><td>Heap</td><td>top-K, ה-k הכי גדול, מיזוג K רשימות ממוינות, "מה הבא בתור"</td><td>מיזוג K לוגים, p99 ב-stream, meeting rooms</td></tr>
<tr><td>BFS / DFS</td><td>grid, גרף, קישוריות, מסלול קצר בגרף לא ממושקל</td><td>Number of islands, סגמנטים ברשת</td></tr>
<tr><td>Topological sort</td><td>תלויות, סדר, "אפשר לסיים?"</td><td>Course schedule, סדר deploy, מערכות build</td></tr>
<tr><td>Binary search</td><td>מידע ממוין, "הפעם הראשונה/אחרונה ש...", תשובה מונוטונית</td><td>Time-based KV store, חיפוש במערך מסובב</td></tr>
<tr><td>Intervals</td><td>זוגות start/end, חפיפות, חלונות זמן</td><td>Merge intervals, meeting rooms, downtime</td></tr>
<tr><td>Union-Find</td><td>קישוריות דינמית, "הם באותה קבוצה?"</td><td>Network partitions, redundant connection</td></tr>
<tr><td>Dynamic programming</td><td>"כמה דרכים", עלות מינימלית/מקסימלית, בחירות עם חפיפה</td><td>Coin change, edit distance, knapsack</td></tr>
</table>`
  },
  examples: `Interviewer: "Given request latencies, return the p99."
You: "Is it a fixed list or a stream? How many values? Do I need it once or after every new value?"
-> Fixed list, once:      sort + index            O(n log n)
-> Stream, after each:    heaps / sketch          O(log n) per value
-> Billions, approximate: t-digest / HDR histogram`,
  hints: [
    { en: "Never start typing in the first two minutes. Clarifying questions are part of the score.", he: "אל תתחיל להקליד בשתי הדקות הראשונות. שאלות הבהרה הן חלק מהציון." },
    { en: "If stuck, say the brute force and ask yourself which data structure removes the inner loop: hashmap (lookup), heap (min/max), sorted + binary search, or a window.", he: "אם נתקעת, תגיד את ה-brute force ותשאל את עצמך איזה data structure מוריד את הלולאה הפנימית: hashmap (lookup), heap (min/max), מיון + binary search, או window." },
    { en: "Leave 5 minutes at the end to test with edge cases out loud. Finding your own bug is a positive signal.", he: "תשאיר 5 דקות בסוף לבדיקות עם edge cases בקול. למצוא באג בעצמך זה סיגנל חיובי." }
  ],
  solution: String.raw`# Python snippets worth having in muscle memory for coding rounds.
import heapq
import bisect
from collections import defaultdict, deque, Counter, OrderedDict

# --- Hashmap / counting ---
counts = Counter(["a", "b", "a"])          # Counter({'a': 2, 'b': 1})
top2 = counts.most_common(2)               # [('a', 2), ('b', 1)]
graph = defaultdict(list)                  # adjacency list without KeyError
graph["api"].append("db")

# --- Heap (min-heap by default) ---
h = []
heapq.heappush(h, (5, "task-a"))           # tuples compare by first item
heapq.heappush(h, (1, "task-b"))
smallest = heapq.heappop(h)                # (1, 'task-b')
heapq.heappush(h, (-10, "x"))              # negate values for a max-heap
largest3 = heapq.nlargest(3, [4, 9, 1, 7]) # [9, 7, 4]

# --- BFS on a graph (shortest path in unweighted graph) ---
def bfs(start, neighbors):
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in neighbors(node):
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return dist

# --- Grid neighbours ---
def grid_neighbors(r, c, rows, cols):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            yield nr, nc

# --- Binary search on a sorted list ---
times = [1, 4, 9, 15]
i = bisect.bisect_right(times, 10) - 1     # index of last value <= 10 -> 2

# --- Sliding window with a deque ---
def count_last_window(events, now, window):
    q = deque(sorted(events))
    while q and q[0] <= now - window:
        q.popleft()
    return len(q)

# --- LRU in two lines (know how to build it by hand too) ---
lru = OrderedDict()
lru["k"] = 1
lru.move_to_end("k")                       # mark as most recently used
# lru.popitem(last=False)                  # evict least recently used

if __name__ == "__main__":
    adj = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}
    print(bfs("a", lambda n: adj[n]))      # {'a': 0, 'b': 1, 'c': 1, 'd': 2}
    print(top2, smallest, largest3, i)
`,
  explain: {
    en: `<p>The playbook works because it turns an open-ended puzzle into a checklist. <strong>Clarify</strong> prevents solving the wrong problem. <strong>Examples</strong> give you test cases for free. <strong>Brute force</strong> guarantees you have <em>something</em> and gives a baseline complexity. <strong>Optimize</strong> is mostly pattern matching: the cheat-sheet "signals" tell you which tool fits.</p>
<p>The snippets in the solution are the 90% toolbox for Python rounds: <code>Counter</code>/<code>defaultdict</code> for counting and graphs, <code>heapq</code> (min-heap, negate for max), <code>deque</code> for BFS and sliding windows, <code>bisect</code> for binary search over sorted lists, and <code>OrderedDict</code> for LRU-style ordering.</p>
<blockquote>💡 Talk like an on-call engineer: state assumptions, say what you are checking, and say when you are not sure. That is exactly what interviewers for infra roles want to see.</blockquote>`,
    he: `<p>ה-playbook עובד כי הוא הופך חידה פתוחה ל-checklist. <strong>Clarify</strong> מונע ממך לפתור את הבעיה הלא נכונה. <strong>Examples</strong> נותנות לך test cases בחינם. <strong>Brute force</strong> מבטיח שיש לך <em>משהו</em> ונותן baseline ל-complexity. <strong>אופטימיזציה</strong> היא בעיקר זיהוי patterns: ה"סימנים" בטבלה אומרים לך איזה כלי מתאים.</p>
<p>ה-snippets בפתרון הם 90% מארגז הכלים לראיון בפייתון: <code>Counter</code>/<code>defaultdict</code> לספירה וגרפים, <code>heapq</code> (min-heap, מכפילים במינוס בשביל max), <code>deque</code> ל-BFS ול-sliding window, <code>bisect</code> ל-binary search על רשימה ממוינת, ו-<code>OrderedDict</code> לסדר בסגנון LRU.</p>
<blockquote>💡 תדבר כמו מהנדס on-call: תגיד הנחות, תגיד מה אתה בודק, ותגיד כשאתה לא בטוח. זה בדיוק מה שמראיינים לתפקידי infra רוצים לראות.</blockquote>`
  },
  complexity: "Know the cost of each tool: dict/set O(1) avg, heap push/pop O(log n), sort O(n log n), bisect O(log n), deque append/popleft O(1)",
  whyInfra: {
    en: "DevOps, SRE and platform roles still have coding rounds because the job is automation: writing operators, CLIs, log processors, rate limiters, schedulers and migration scripts. Google SRE, Meta Production Engineering and most Israeli startups test the same data structures as SWE, often with an ops flavour (parse logs, dedupe alerts, order deployments). A weak coding round is the most common reason strong infra candidates get rejected.",
    he: "בתפקידי DevOps, SRE ו-platform עדיין יש סבבי קוד, כי העבודה היא אוטומציה: לכתוב operators, CLIs, מעבדי לוגים, rate limiters, schedulers וסקריפטים ל-migration. ב-Google SRE, ב-Meta Production Engineering וברוב הסטארטאפים בארץ בודקים את אותם data structures כמו ל-SWE, הרבה פעמים עם טוויסט של ops (לפרסר לוגים, לעשות dedup להתראות, לסדר deployments). סבב קוד חלש הוא הסיבה הכי נפוצה שמועמדי infra חזקים נדחים."
  },
  followUps: [
    { q: { en: "What if you can't find the optimal solution?", he: "מה אם לא מוצאים את הפתרון האופטימלי?" },
      a: { en: "Implement the brute force cleanly, test it, and then discuss how you would optimize. Working, tested O(n²) code beats a half-written O(n) idea.", he: "תממש את ה-brute force בצורה נקייה, תבדוק אותו, ואז תדבר על איך היית משפר. קוד O(n²) שעובד ונבדק עדיף על רעיון O(n) שנכתב בחצי." } },
    { q: { en: "Which language should I use?", he: "באיזו שפה כדאי לכתוב?" },
      a: { en: "The one you are fastest in. Python is ideal for interviews: concise, with heapq, deque, Counter and bisect built in. Go is common for infra teams but more verbose under time pressure.", he: "בזו שאתה הכי מהיר בה. פייתון אידיאלית לראיונות: תמציתית, ויש בה heapq, deque, Counter ו-bisect מובנים. Go נפוצה בצוותי infra, אבל יותר ארוכה כשיש לחץ זמן." } }
  ]
});

/* ------------------------------------------------------------------ */
/* EASY                                                                */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "two-sum-latency",
  icon: "⏱️",
  difficulty: "easy",
  tags: ["hashmap", "array"],
  leetcode: "1",
  title: { en: "Two Sum: Latency Budget", he: "Two Sum: תקציב latency" },
  statement: {
    en: `<p>A request goes through two backend hops in sequence. You have a list of measured hop latencies (ms) from a trace sample and a <strong>latency budget</strong> <code>target</code>. Return the indices of the two <em>different</em> hops whose latencies add up to exactly <code>target</code>. Assume exactly one valid answer exists; return the indices in increasing order.</p>
<p>The same idea matches request/response pairs: for each response, ask "have I already seen the request that completes it?" in O(1).</p>
<p>Constraints: <code>2 &lt;= n &lt;= 10^5</code>, latencies are non-negative integers.</p>`,
    he: `<p>בקשה עוברת שני hops בבקאנד אחד אחרי השני. יש לך רשימה של latencies (ms) שנמדדו ב-trace sample ו<strong>תקציב latency</strong> בשם <code>target</code>. תחזיר את האינדקסים של שני hops <em>שונים</em> שסכום ה-latency שלהם שווה בדיוק ל-<code>target</code>. אפשר להניח שיש בדיוק תשובה אחת; תחזיר את האינדקסים בסדר עולה.</p>
<p>אותו רעיון משמש להתאמת זוגות request/response: על כל response שואלים "כבר ראיתי את ה-request שמשלים אותו?" ב-O(1).</p>
<p>אילוצים: <code>2 &lt;= n &lt;= 10^5</code>, ה-latencies הם מספרים שלמים אי-שליליים.</p>`
  },
  examples: `Input:  latencies = [120, 45, 300, 80], target = 125
Output: [1, 3]        # 45 + 80 = 125

Input:  latencies = [60, 60], target = 120
Output: [0, 1]`,
  hints: [
    { en: "Brute force: try every pair, O(n²). What are you searching for in the inner loop?", he: "Brute force: לנסות כל זוג, O(n²). מה בעצם מחפשים בלולאה הפנימית?" },
    { en: "For value x you need its complement target - x. Can you look it up in O(1)?", he: "בשביל ערך x צריך את המשלים target - x. אפשר לחפש אותו ב-O(1)?" },
    { en: "Walk once, keep a dict value -> index of everything seen so far; check the complement before inserting the current value (handles duplicates like [60, 60]).", he: "תעבור פעם אחת, ותחזיק dict של ערך -> אינדקס לכל מה שראית; תבדוק את המשלים לפני שאתה מכניס את הערך הנוכחי (ככה [60, 60] עובד)." }
  ],
  solution: String.raw`from typing import List


def two_sum(latencies: List[int], target: int) -> List[int]:
    """Return indices [i, j] (i < j) with latencies[i] + latencies[j] == target."""
    seen = {}  # latency value -> index where we saw it
    for j, value in enumerate(latencies):
        need = target - value
        if need in seen:              # the complement appeared earlier
            return [seen[need], j]
        seen[value] = j               # insert AFTER the check, so we never pair j with itself
    return []                         # no pair found (problem says this won't happen)


if __name__ == "__main__":
    print(two_sum([120, 45, 300, 80], 125))  # [1, 3]
    print(two_sum([60, 60], 120))            # [0, 1]
`,
  explain: {
    en: `<p>The brute force checks all n(n-1)/2 pairs. The trick is to flip the question: instead of "which pair sums to target?", ask for each element "has its complement <code>target - x</code> already appeared?". A hashmap answers that in O(1) on average.</p>
<p>We scan left to right. For index <code>j</code> we compute <code>need</code>; if it is in <code>seen</code>, the earlier index plus <code>j</code> is the answer, and it is already in increasing order. Only then do we store the current value. Checking before inserting is what makes <code>[60, 60], 120</code> work and stops an element from pairing with itself.</p>`,
    he: `<p>ה-brute force בודק את כל n(n-1)/2 הזוגות. הטריק הוא להפוך את השאלה: במקום "איזה זוג נותן target?", שואלים על כל איבר "המשלים שלו <code>target - x</code> כבר הופיע?". hashmap עונה על זה ב-O(1) בממוצע.</p>
<p>סורקים משמאל לימין. באינדקס <code>j</code> מחשבים את <code>need</code>; אם הוא ב-<code>seen</code>, האינדקס הקודם ביחד עם <code>j</code> הם התשובה, וכבר בסדר עולה. רק אחרי זה שומרים את הערך הנוכחי. הבדיקה לפני ההכנסה היא מה שגורם ל-<code>[60, 60], 120</code> לעבוד ומונעת מאיבר להתחבר לעצמו.</p>`
  },
  complexity: "Time O(n), Space O(n)",
  whyInfra: {
    en: "\"Have I seen the matching half?\" is how proxies and tracing systems pair requests with responses (by request-id or span-id), how TCP matches ACKs to segments, and how alert dedup works: a hashmap keyed by an ID, checked as each event streams in.",
    he: "\"ראיתי כבר את החצי המתאים?\" זה בדיוק איך proxies ומערכות tracing מצמידים requests ל-responses (לפי request-id או span-id), איך TCP מתאים ACKs ל-segments, ואיך dedup של התראות עובד: hashmap לפי ID שנבדק בכל event שנכנס."
  },
  followUps: [
    { q: { en: "What if the input is sorted and memory is tight?", he: "מה אם ה-input ממוין והזיכרון מוגבל?" },
      a: { en: "Use two pointers from both ends: if the sum is too small move left forward, too large move right back. O(n) time, O(1) extra space.", he: "שני pointers משני הקצוות: אם הסכום קטן מדי מזיזים את השמאלי קדימה, גדול מדי – את הימני אחורה. O(n) זמן, O(1) זיכרון נוסף." } },
    { q: { en: "Return all pairs, not just one?", he: "להחזיר את כל הזוגות ולא רק אחד?" },
      a: { en: "Store value -> list of indices and emit a pair for every earlier index of the complement. Output can be O(n²) in the worst case (all equal values), so mention that.", he: "שומרים ערך -> רשימת אינדקסים ומוציאים זוג לכל אינדקס קודם של המשלים. ה-output יכול להיות O(n²) במקרה הגרוע (כל הערכים שווים), כדאי להזכיר את זה." } }
  ]
});

INFRA.problems.push({
  id: "valid-parentheses-config",
  icon: "🧾",
  difficulty: "easy",
  tags: ["stack", "string", "parsing"],
  leetcode: "20",
  title: { en: "Valid Brackets in a Config File", he: "סוגריים תקינים בקובץ קונפיג" },
  statement: {
    en: `<p>Before a CI pipeline applies a JSON/HCL-like config, a linter checks that its brackets are balanced. Given a string <code>s</code> containing <code>()[]{}</code> and any other characters, return <code>-1</code> if every bracket is closed by the same type in the correct order, otherwise return the <strong>index of the first error</strong>: a closing bracket that does not match, or <code>len(s)</code> if the string ends with unclosed brackets.</p>
<p>Ignore all non-bracket characters (assume no brackets appear inside quoted strings for now).</p>`,
    he: `<p>לפני ש-pipeline של CI מפעיל קונפיג בסגנון JSON/HCL, linter בודק שהסוגריים מאוזנים. בהינתן מחרוזת <code>s</code> עם <code>()[]{}</code> ועוד תווים אחרים, תחזיר <code>-1</code> אם כל סוגר נסגר באותו סוג ובסדר הנכון, אחרת תחזיר את <strong>האינדקס של השגיאה הראשונה</strong>: סוגר סוגר שלא מתאים, או <code>len(s)</code> אם המחרוזת נגמרת עם סוגריים פתוחים.</p>
<p>מתעלמים מכל תו שהוא לא סוגר (בינתיים מניחים שאין סוגריים בתוך מחרוזות במירכאות).</p>`
  },
  examples: `Input:  s = '{"a": [1, 2, {"b": (3)}]}'
Output: -1

Input:  s = '{"a": [1, 2}'
Output: 11      # '}' closes while '[' is still open

Input:  s = 'resource "x" { tags = ['
Output: 23      # reached the end (len) with '{' and '[' open`,
  hints: [
    { en: "The most recently opened bracket must be closed first. Which data structure is last-in, first-out?", he: "הסוגר שנפתח אחרון חייב להיסגר ראשון. איזה data structure הוא last-in, first-out?" },
    { en: "Push opening brackets on a stack. On a closing bracket, the top of the stack must be its partner; use a dict closing -> opening.", he: "דוחפים סוגריים פותחים ל-stack. בסוגר סוגר, הראש של ה-stack חייב להיות בן הזוג שלו; תשתמש ב-dict של סוגר -> פותח." },
    { en: "Don't forget the end: a non-empty stack means something was never closed.", he: "אל תשכח את הסוף: stack לא ריק אומר שמשהו לא נסגר אף פעם." }
  ],
  solution: String.raw`PAIRS = {")": "(", "]": "[", "}": "{"}
OPENING = set(PAIRS.values())


def first_bracket_error(s: str) -> int:
    """Return -1 if brackets are balanced, else the index of the first error."""
    stack = []  # opening brackets waiting to be closed
    for i, ch in enumerate(s):
        if ch in OPENING:
            stack.append(ch)
        elif ch in PAIRS:
            # closing bracket: must match the most recent opening one
            if not stack or stack[-1] != PAIRS[ch]:
                return i
            stack.pop()
        # any other character is ignored
    return -1 if not stack else len(s)


def is_valid(s: str) -> bool:
    """The classic LeetCode 20 signature."""
    return first_bracket_error(s) == -1


if __name__ == "__main__":
    print(first_bracket_error('{"a": [1, 2, {"b": (3)}]}'))  # -1
    print(first_bracket_error('{"a": [1, 2}'))               # 11
    print(first_bracket_error('resource "x" { tags = ['))    # 23
    print(is_valid("()[]{}"), is_valid("(]"))                # True False
`,
  explain: {
    en: `<p>Nested structures are naturally LIFO: the innermost block opened last must close first. We push every opening bracket. When a closing bracket arrives, the stack top must be the matching opener; if the stack is empty or holds a different type, that index is the first error. After the scan, leftover openers mean the file ended too early, so we report <code>len(s)</code>.</p>
<p>Returning the error position instead of a bare boolean is what a real linter does: "unexpected '}' at column 11" is far more useful in a CI log than "invalid".</p>`,
    he: `<p>מבנים מקוננים הם LIFO מטבעם: הבלוק הפנימי שנפתח אחרון חייב להיסגר ראשון. דוחפים כל סוגר פותח. כשמגיע סוגר סוגר, הראש של ה-stack חייב להיות הפותח המתאים; אם ה-stack ריק או שיש בו סוג אחר, האינדקס הזה הוא השגיאה הראשונה. בסוף הסריקה, אם נשארו פותחים, הקובץ נגמר מוקדם מדי ומחזירים <code>len(s)</code>.</p>
<p>להחזיר מיקום שגיאה במקום boolean זה מה ש-linter אמיתי עושה: "unexpected '}' at column 11" הרבה יותר שימושי בלוג של CI מאשר "invalid".</p>`
  },
  complexity: "Time O(n), Space O(n) for the stack",
  whyInfra: {
    en: "Every JSON/YAML/HCL parser, Helm template renderer and Terraform validate step uses a stack for nesting. Pre-commit hooks and CI linters catch exactly this class of error before a broken config reaches production.",
    he: "כל parser של JSON/YAML/HCL, כל renderer של Helm templates ושלב ה-validate של Terraform משתמשים ב-stack בשביל קינון. pre-commit hooks ו-linters ב-CI תופסים בדיוק את סוג השגיאה הזה לפני שקונפיג שבור מגיע לפרודקשן."
  },
  followUps: [
    { q: { en: "Brackets can appear inside quoted strings like \"a{b\". How do you handle that?", he: "סוגריים יכולים להופיע בתוך מחרוזות כמו \"a{b\". איך מטפלים בזה?" },
      a: { en: "Add a small state machine: an in_string flag toggled by an unescaped quote; while in_string, skip brackets. Track a backslash escape flag so \\\" doesn't end the string.", he: "מוסיפים state machine קטנה: דגל in_string שמתהפך בכל מירכאה שלא עברה escape; כל עוד in_string מדלגים על סוגריים. מחזיקים גם דגל escape של backslash כדי ש-\\\" לא יסגור את המחרוזת." } },
    { q: { en: "Can you do it in O(1) space?", he: "אפשר ב-O(1) זיכרון?" },
      a: { en: "With a single bracket type, a counter is enough. With several types you need the order of opens, so O(depth) space is required in general.", he: "עם סוג סוגריים אחד מספיק counter. עם כמה סוגים צריך לזכור את סדר הפתיחות, אז באופן כללי צריך O(depth) זיכרון." } }
  ]
});

INFRA.problems.push({
  id: "log-level-counter",
  icon: "📜",
  difficulty: "easy",
  tags: ["hashmap", "string", "parsing"],
  title: { en: "Log Level Counter", he: "ספירת רמות לוג" },
  statement: {
    en: `<p>You are given log lines in the format <code>&lt;timestamp&gt; &lt;LEVEL&gt; &lt;message&gt;</code>, for example <code>2024-05-01T10:00:03Z ERROR db: connection refused</code>. Write <code>analyze(lines, k)</code> that returns:</p>
<ol>
<li>a dict of counts per level (<code>INFO</code>, <code>WARN</code>, <code>ERROR</code>, ...), case-insensitive, stored upper-case;</li>
<li>the <code>k</code> most frequent <code>ERROR</code> messages as <code>(message, count)</code> pairs, most frequent first.</li>
</ol>
<p>Skip malformed lines (fewer than three fields) instead of crashing — real logs are messy.</p>`,
    he: `<p>מקבלים שורות לוג בפורמט <code>&lt;timestamp&gt; &lt;LEVEL&gt; &lt;message&gt;</code>, למשל <code>2024-05-01T10:00:03Z ERROR db: connection refused</code>. תכתוב <code>analyze(lines, k)</code> שמחזירה:</p>
<ol>
<li>dict עם ספירה לכל level (<code>INFO</code>, <code>WARN</code>, <code>ERROR</code>, ...), בלי תלות ב-case, נשמר באותיות גדולות;</li>
<li>את <code>k</code> הודעות ה-<code>ERROR</code> הכי נפוצות כזוגות <code>(message, count)</code>, מהנפוצה ביותר.</li>
</ol>
<p>שורות פגומות (פחות משלושה שדות) מדלגים עליהן במקום לקרוס – לוגים אמיתיים מבולגנים.</p>`
  },
  examples: `Input:
lines = [
  "2024-05-01T10:00:00Z INFO  api: started",
  "2024-05-01T10:00:03Z ERROR db: connection refused",
  "2024-05-01T10:00:04Z warn  cache: high eviction rate",
  "2024-05-01T10:00:05Z ERROR db: connection refused",
  "garbage",
  "2024-05-01T10:00:09Z ERROR api: timeout calling payments",
]
k = 2
Output:
({'INFO': 1, 'ERROR': 3, 'WARN': 1},
 [('db: connection refused', 2), ('api: timeout calling payments', 1)])`,
  hints: [
    { en: "Split each line into at most 3 parts: the message itself contains spaces, so use split(maxsplit=2).", he: "תפצל כל שורה לכל היותר ל-3 חלקים: ההודעה עצמה מכילה רווחים, אז split(maxsplit=2)." },
    { en: "Two counters: one for levels, one for error messages. collections.Counter does the bookkeeping.", he: "שני counters: אחד ל-levels ואחד להודעות שגיאה. collections.Counter עושה את העבודה." },
    { en: "For top-k use Counter.most_common(k) or heapq.nlargest; mention that sorting everything is O(m log m).", he: "ל-top-k משתמשים ב-Counter.most_common(k) או heapq.nlargest; תזכיר שמיון של הכל הוא O(m log m)." }
  ],
  solution: String.raw`from collections import Counter
from typing import Dict, Iterable, List, Tuple


def analyze(lines: Iterable[str], k: int = 3) -> Tuple[Dict[str, int], List[Tuple[str, int]]]:
    """Count lines per level and return the k most common ERROR messages."""
    levels = Counter()
    error_messages = Counter()
    for line in lines:
        parts = line.split(maxsplit=2)   # timestamp, level, rest-of-line
        if len(parts) < 3:
            continue                     # malformed line: skip, don't crash
        _timestamp, level, message = parts
        level = level.upper()
        levels[level] += 1
        if level == "ERROR":
            error_messages[message.strip()] += 1
    return dict(levels), error_messages.most_common(k)


if __name__ == "__main__":
    sample = [
        "2024-05-01T10:00:00Z INFO  api: started",
        "2024-05-01T10:00:03Z ERROR db: connection refused",
        "2024-05-01T10:00:04Z warn  cache: high eviction rate",
        "2024-05-01T10:00:05Z ERROR db: connection refused",
        "garbage",
        "2024-05-01T10:00:09Z ERROR api: timeout calling payments",
    ]
    print(analyze(sample, k=2))
`,
  explain: {
    en: `<p>This is a hashmap-counting problem dressed as log parsing. <code>split(maxsplit=2)</code> splits on runs of whitespace (so double spaces after <code>INFO</code> are fine) and keeps the message intact. Normalising the level with <code>upper()</code> merges <code>warn</code> and <code>WARN</code>.</p>
<p><code>Counter.most_common(k)</code> uses a heap internally when k is smaller than the number of distinct messages, giving O(m log k). Because the input is an iterable, the function also works on a file object line by line, so memory is O(distinct levels + distinct messages), not O(file size).</p>`,
    he: `<p>זו בעיית ספירה עם hashmap בתחפושת של פרסור לוגים. <code>split(maxsplit=2)</code> מפצל לפי רצפים של רווחים (אז שני רווחים אחרי <code>INFO</code> זה לא בעיה) ומשאיר את ההודעה שלמה. נרמול ה-level עם <code>upper()</code> מאחד את <code>warn</code> ו-<code>WARN</code>.</p>
<p><code>Counter.most_common(k)</code> משתמש ב-heap מאחורי הקלעים כש-k קטן ממספר ההודעות השונות, כלומר O(m log k). מכיוון שה-input הוא iterable, הפונקציה עובדת גם על file object שורה אחרי שורה, ולכן הזיכרון הוא O(levels שונים + הודעות שונות) ולא O(גודל הקובץ).</p>`
  },
  complexity: "Time O(N + m log k) for N lines and m distinct error messages, Space O(m)",
  whyInfra: {
    en: "This is what `grep ERROR app.log | sort | uniq -c | sort -rn | head` does, and what Loki, Elasticsearch aggregations and Datadog log patterns compute at scale. On-call engineers write this exact script during incidents.",
    he: "זה מה ש-`grep ERROR app.log | sort | uniq -c | sort -rn | head` עושה, ומה ש-Loki, aggregations של Elasticsearch ו-log patterns של Datadog מחשבים בסקייל. מהנדסי on-call כותבים בדיוק את הסקריפט הזה באמצע אינצידנט."
  },
  followUps: [
    { q: { en: "Messages contain IDs (\"user 123 not found\", \"user 456 not found\"). How do you group them?", he: "בהודעות יש IDs (\"user 123 not found\", \"user 456 not found\"). איך מקבצים אותן?" },
      a: { en: "Normalise before counting: replace numbers, UUIDs, IPs and hex with placeholders via regex (e.g. re.sub(r'\\d+', '&lt;N&gt;', msg)). That's the basic idea behind log-pattern / template mining like Drain.", he: "מנרמלים לפני הספירה: מחליפים מספרים, UUIDs, IPs ו-hex ב-placeholders עם regex (למשל re.sub(r'\\d+', '&lt;N&gt;', msg)). זה הרעיון הבסיסי מאחורי log patterns / template mining כמו Drain." } },
    { q: { en: "The log is 200 GB. What changes?", he: "הלוג שוקל 200 GB. מה משתנה?" },
      a: { en: "Stream it (never read all into memory), shard by file or hash of message across workers, count locally, then merge counters (map-reduce). If distinct messages are huge, use Count-Min Sketch + a heap for approximate heavy hitters.", he: "עושים streaming (לא טוענים הכל לזיכרון), מפצלים לפי קובץ או hash של ההודעה בין workers, סופרים מקומית ואז ממזגים counters (map-reduce). אם יש המון הודעות שונות, Count-Min Sketch + heap בשביל heavy hitters משוערים." } }
  ]
});

INFRA.problems.push({
  id: "merge-sorted-logs",
  icon: "🔀",
  difficulty: "easy",
  tags: ["heap", "merge", "k-way"],
  leetcode: "23",
  title: { en: "Merge K Sorted Log Streams", he: "מיזוג K זרמי לוגים ממוינים" },
  statement: {
    en: `<p>You collected logs from <code>k</code> pods. Each pod's log is already sorted by timestamp and is a list of <code>(timestamp, message)</code> tuples. Produce one list of all entries sorted by timestamp. When timestamps tie, keep entries from the lower stream index first (stable).</p>
<p>Total entries <code>N</code> can be large and <code>k</code> can be in the hundreds; do better than concatenating and sorting.</p>`,
    he: `<p>אספת לוגים מ-<code>k</code> pods. הלוג של כל pod כבר ממוין לפי timestamp, והוא רשימה של tuples מסוג <code>(timestamp, message)</code>. תייצר רשימה אחת של כל הרשומות ממוינת לפי timestamp. כשיש timestamps זהים, רשומות מ-stream עם אינדקס נמוך יותר באות קודם (stable).</p>
<p>סך הרשומות <code>N</code> יכול להיות גדול ו-<code>k</code> יכול להיות במאות; תעשה יותר טוב מלחבר הכל ולמיין.</p>`
  },
  examples: `Input:
streams = [
  [(1, "pod-a: start"), (5, "pod-a: ready")],
  [(2, "pod-b: start"), (3, "pod-b: pull image"), (9, "pod-b: ready")],
  [(5, "pod-c: start")],
]
Output:
[(1, 'pod-a: start'), (2, 'pod-b: start'), (3, 'pod-b: pull image'),
 (5, 'pod-a: ready'), (5, 'pod-c: start'), (9, 'pod-b: ready')]`,
  hints: [
    { en: "At any moment the next output line is the smallest among the k current heads of the streams.", he: "בכל רגע, השורה הבאה ב-output היא הקטנה מבין k הראשים הנוכחיים של ה-streams." },
    { en: "Keep those k heads in a min-heap. Pop the smallest, then push the next entry from the same stream.", he: "תחזיק את k הראשים ב-min-heap. מוציאים את הקטן, ומכניסים את הרשומה הבאה מאותו stream." },
    { en: "Put (timestamp, stream_index, position) in the heap so ties break by stream index and you never compare messages.", he: "תכניס ל-heap את (timestamp, stream_index, position) כדי שתיקו יוכרע לפי אינדקס ה-stream ולא נשווה הודעות." }
  ],
  solution: String.raw`import heapq
from typing import Iterator, List, Tuple

Entry = Tuple[int, str]


def merge_logs(streams: List[List[Entry]]) -> Iterator[Entry]:
    """Yield entries from k timestamp-sorted streams in global timestamp order."""
    heap = []  # (timestamp, stream_index, position_in_stream)
    for s, stream in enumerate(streams):
        if stream:
            heapq.heappush(heap, (stream[0][0], s, 0))

    while heap:
        ts, s, pos = heapq.heappop(heap)
        yield streams[s][pos]
        nxt = pos + 1
        if nxt < len(streams[s]):            # refill from the same stream
            heapq.heappush(heap, (streams[s][nxt][0], s, nxt))


if __name__ == "__main__":
    streams = [
        [(1, "pod-a: start"), (5, "pod-a: ready")],
        [(2, "pod-b: start"), (3, "pod-b: pull image"), (9, "pod-b: ready")],
        [(5, "pod-c: start")],
    ]
    print(list(merge_logs(streams)))
`,
  explain: {
    en: `<p>Concatenate-and-sort costs O(N log N) and needs everything in memory. Since each stream is already sorted, only the <em>heads</em> compete. A min-heap of size k gives the smallest head in O(log k); after popping it we push the next element from the same stream.</p>
<p>The heap holds <code>(timestamp, stream_index, position)</code>: the stream index breaks ties deterministically and avoids comparing message strings. The function is a generator, so it can feed a file or socket without materialising the whole output — exactly how you'd merge huge log files. (Python's <code>heapq.merge</code> does the same thing.)</p>`,
    he: `<p>לחבר ולמיין עולה O(N log N) ודורש הכל בזיכרון. מכיוון שכל stream כבר ממוין, רק ה<em>ראשים</em> מתחרים. min-heap בגודל k נותן את הראש הקטן ב-O(log k); אחרי שמוציאים אותו, מכניסים את האיבר הבא מאותו stream.</p>
<p>ב-heap יש <code>(timestamp, stream_index, position)</code>: אינדקס ה-stream מכריע תיקו בצורה דטרמיניסטית ומונע השוואה של מחרוזות. הפונקציה היא generator, אז אפשר להזרים לקובץ או ל-socket בלי להחזיק את כל ה-output – בדיוק איך ממזגים קבצי לוג ענקיים. (<code>heapq.merge</code> של פייתון עושה אותו דבר.)</p>`
  },
  complexity: "Time O(N log k), Space O(k) (plus output)",
  whyInfra: {
    en: "`kubectl logs` across pods, `stern`, Loki/Elasticsearch queries over many shards, and LSM-tree compaction in RocksDB/Cassandra all do a k-way merge of sorted runs. External sort of files bigger than RAM is the same algorithm.",
    he: "`kubectl logs` על כמה pods, `stern`, שאילתות Loki/Elasticsearch על הרבה shards, ו-compaction של LSM-tree ב-RocksDB/Cassandra – כולם עושים k-way merge של רצפים ממוינים. External sort לקבצים שגדולים מה-RAM זה אותו אלגוריתם."
  },
  followUps: [
    { q: { en: "Clocks on different pods are skewed by up to 200 ms. Is the merged order 'true'?", he: "השעונים ב-pods שונים זזים עד 200 ms. הסדר הממוזג הוא 'האמיתי'?" },
      a: { en: "No, only per-source order is reliable. For causality use trace IDs / Lamport or vector clocks, or accept a small reorder window. Mention NTP/chrony and that cross-host ordering is best-effort.", he: "לא, רק הסדר בתוך כל מקור אמין. בשביל סיבתיות משתמשים ב-trace IDs / שעוני Lamport או vector clocks, או מקבלים חלון reorder קטן. כדאי להזכיר NTP/chrony ושסדר בין hosts הוא best-effort." } },
    { q: { en: "Streams are live and never end. Does this still work?", he: "ה-streams חיים ולא נגמרים. זה עדיין עובד?" },
      a: { en: "You can only emit the heap minimum once every stream has produced something newer (a watermark), otherwise a slow stream may later send an older timestamp. This is the watermark concept in Flink/Kafka Streams.", he: "אפשר להוציא את המינימום רק אחרי שכל stream שלח משהו חדש יותר (watermark), אחרת stream איטי עלול לשלוח אחר כך timestamp ישן יותר. זה בדיוק מושג ה-watermark ב-Flink/Kafka Streams." } }
  ]
});

/* ------------------------------------------------------------------ */
/* MEDIUM                                                              */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "lru-cache",
  icon: "🧠",
  difficulty: "medium",
  tags: ["hashmap", "linked-list", "design"],
  leetcode: "146",
  title: { en: "LRU Cache", he: "LRU Cache" },
  statement: {
    en: `<p>Design a cache with a fixed <code>capacity</code> that evicts the <strong>least recently used</strong> key when full.</p>
<ul>
<li><code>get(key)</code> returns the value or <code>-1</code>, and marks the key as recently used.</li>
<li><code>put(key, value)</code> inserts or updates; if the cache exceeds capacity, evict the least recently used key.</li>
</ul>
<p>Both operations must run in <strong>O(1)</strong> average time. Interviewers usually want the hashmap + doubly linked list version, not just <code>OrderedDict</code>.</p>`,
    he: `<p>תתכנן cache עם <code>capacity</code> קבוע שמפנה את המפתח <strong>שהשתמשו בו הכי מזמן</strong> (least recently used) כשהוא מלא.</p>
<ul>
<li><code>get(key)</code> מחזיר את הערך או <code>-1</code>, ומסמן את המפתח כ"בשימוש לאחרונה".</li>
<li><code>put(key, value)</code> מכניס או מעדכן; אם עוברים את ה-capacity, מפנים את ה-LRU.</li>
</ul>
<p>שתי הפעולות חייבות לרוץ ב-<strong>O(1)</strong> בממוצע. מראיינים בדרך כלל רוצים את הגרסה של hashmap + doubly linked list, ולא רק <code>OrderedDict</code>.</p>`
  },
  examples: `cache = LRUCache(2)
cache.put(1, 1); cache.put(2, 2)
cache.get(1)     -> 1        # order now (LRU..MRU): 2, 1
cache.put(3, 3)              # evicts key 2
cache.get(2)     -> -1
cache.put(4, 4)              # evicts key 1
cache.get(1)     -> -1
cache.get(3)     -> 3
cache.get(4)     -> 4`,
  hints: [
    { en: "A dict gives O(1) lookup but no order. What gives O(1) reordering and removal from the middle?", he: "dict נותן lookup ב-O(1) אבל בלי סדר. מה נותן שינוי סדר והסרה מהאמצע ב-O(1)?" },
    { en: "Doubly linked list ordered by recency; the dict maps key -> node so you can unlink a node in O(1).", he: "Doubly linked list שממוינת לפי עדכניות; ה-dict ממפה key -> node כדי שאפשר לנתק node ב-O(1)." },
    { en: "Use two sentinel nodes (head/tail) so you never special-case an empty list.", he: "תשתמש בשני sentinel nodes (head/tail) כדי שלא יהיו מקרים מיוחדים לרשימה ריקה." }
  ],
  solution: String.raw`class Node:
    __slots__ = ("key", "value", "prev", "next")

    def __init__(self, key=0, value=0):
        self.key, self.value = key, value
        self.prev = self.next = None


class LRUCache:
    """Hashmap + doubly linked list. head.next = LRU, tail.prev = MRU."""

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.map = {}                       # key -> Node
        self.head, self.tail = Node(), Node()  # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    # --- list helpers, all O(1) ---
    def _unlink(self, node: Node) -> None:
        node.prev.next, node.next.prev = node.next, node.prev

    def _append_mru(self, node: Node) -> None:
        last = self.tail.prev
        last.next = node
        node.prev, node.next = last, self.tail
        self.tail.prev = node

    # --- public API ---
    def get(self, key: int) -> int:
        node = self.map.get(key)
        if node is None:
            return -1
        self._unlink(node)                 # move to most-recently-used end
        self._append_mru(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if self.capacity <= 0:
            return
        node = self.map.get(key)
        if node:                           # update existing key
            node.value = value
            self._unlink(node)
            self._append_mru(node)
            return
        if len(self.map) == self.capacity: # evict LRU (right after head)
            lru = self.head.next
            self._unlink(lru)
            del self.map[lru.key]
        node = Node(key, value)
        self.map[key] = node
        self._append_mru(node)


if __name__ == "__main__":
    c = LRUCache(2)
    c.put(1, 1); c.put(2, 2)
    print(c.get(1))   # 1
    c.put(3, 3)
    print(c.get(2))   # -1
    c.put(4, 4)
    print(c.get(1), c.get(3), c.get(4))  # -1 3 4
`,
  explain: {
    en: `<p>Two structures, each covering the other's weakness. The <strong>dict</strong> finds a key's node in O(1). The <strong>doubly linked list</strong> keeps nodes in recency order and lets us move or remove any node in O(1), because each node knows its neighbours.</p>
<p>Convention: right after <code>head</code> is the LRU, right before <code>tail</code> is the MRU. <code>get</code> unlinks the node and re-appends it at the MRU end. <code>put</code> either updates in place (and touches recency) or, when full, removes <code>head.next</code> from both the list and the dict. The node stores its key so eviction can delete it from the dict. Sentinels remove all <code>if head is None</code> edge cases.</p>
<blockquote>💡 In Python you can mention that <code>OrderedDict</code> with <code>move_to_end</code> and <code>popitem(last=False)</code> is the 10-line production version — then build the real one.</blockquote>`,
    he: `<p>שני מבנים, שכל אחד מכסה את החולשה של השני. ה-<strong>dict</strong> מוצא את ה-node של מפתח ב-O(1). ה-<strong>doubly linked list</strong> מחזיקה את ה-nodes לפי סדר שימוש ומאפשרת להזיז או להסיר כל node ב-O(1), כי כל node מכיר את השכנים שלו.</p>
<p>המוסכמה: מיד אחרי <code>head</code> נמצא ה-LRU, מיד לפני <code>tail</code> נמצא ה-MRU. <code>get</code> מנתק את ה-node ומחבר אותו מחדש בקצה ה-MRU. <code>put</code> או מעדכן במקום (ומרענן את הסדר) או, כשמלא, מסיר את <code>head.next</code> גם מהרשימה וגם מה-dict. ה-node שומר את ה-key שלו כדי שבפינוי אפשר יהיה למחוק אותו מה-dict. ה-sentinels מעיפים את כל מקרי הקצה של <code>if head is None</code>.</p>
<blockquote>💡 בפייתון אפשר להזכיר ש-<code>OrderedDict</code> עם <code>move_to_end</code> ו-<code>popitem(last=False)</code> זו גרסת ה-production של 10 שורות – ואז לבנות את האמיתית.</blockquote>`
  },
  complexity: "Time O(1) per get/put, Space O(capacity)",
  whyInfra: {
    en: "LRU (or variants) evicts entries in Memcached, Redis (allkeys-lru, approximated by sampling), the Linux page cache (active/inactive lists), CDN edge caches, DNS resolvers and connection pools. Knowing why Redis approximates LRU with random sampling (memory per key) is a great senior-level remark.",
    he: "LRU (או וריאציות שלו) מפנה רשומות ב-Memcached, ב-Redis (allkeys-lru, בקירוב עם sampling), ב-page cache של לינוקס (רשימות active/inactive), ב-edge caches של CDN, ב-DNS resolvers וב-connection pools. להסביר למה Redis עושה קירוב ל-LRU עם sampling אקראי (זיכרון לכל מפתח) – זו הערה מעולה ברמת סניור."
  },
  followUps: [
    { q: { en: "How do you make it thread-safe?", he: "איך הופכים את זה ל-thread-safe?" },
      a: { en: "Wrap get/put in a lock (get mutates order, so even reads need it). To reduce contention, shard the cache into N independent LRUs by hash(key) % N, as Guava/Caffeine and many Go caches do.", he: "עוטפים את get/put ב-lock (get משנה סדר, אז גם קריאות צריכות אותו). כדי להוריד contention, מפצלים את ה-cache ל-N מטמונים עצמאיים לפי hash(key) % N, כמו ב-Guava/Caffeine והרבה caches ב-Go." } },
    { q: { en: "Add a TTL per key.", he: "תוסיף TTL לכל מפתח." },
      a: { en: "Store expires_at in the node; on get, treat expired as a miss and remove it (lazy expiry). Optionally a background sweeper or a min-heap by expiry removes cold expired keys — Redis combines lazy expiry with periodic random sampling.", he: "שומרים expires_at ב-node; ב-get, פג תוקף = miss ומוחקים (lazy expiry). אפשר להוסיף sweeper ברקע או min-heap לפי זמן תפוגה כדי לנקות מפתחות קרים – Redis משלב lazy expiry עם sampling אקראי תקופתי." } }
  ]
});

INFRA.problems.push({
  id: "rate-limiter-token-bucket",
  icon: "🪣",
  difficulty: "medium",
  tags: ["design", "math", "rate-limiting"],
  title: { en: "Token Bucket Rate Limiter", he: "Rate Limiter עם Token Bucket" },
  statement: {
    en: `<p>Implement a <code>TokenBucket(capacity, refill_rate)</code> class with <code>allow(ts, cost=1) -&gt; bool</code>.</p>
<ul>
<li>The bucket starts full with <code>capacity</code> tokens.</li>
<li>Tokens are added continuously at <code>refill_rate</code> tokens per second, never exceeding <code>capacity</code>.</li>
<li><code>allow</code> is called with a timestamp in seconds (float, non-decreasing). If at least <code>cost</code> tokens are available, consume them and return <code>True</code>; otherwise return <code>False</code> and consume nothing.</li>
</ul>
<p>Do not use background threads or timers.</p>`,
    he: `<p>תממש מחלקה <code>TokenBucket(capacity, refill_rate)</code> עם <code>allow(ts, cost=1) -&gt; bool</code>.</p>
<ul>
<li>ה-bucket מתחיל מלא, עם <code>capacity</code> טוקנים.</li>
<li>טוקנים מתווספים ברציפות בקצב <code>refill_rate</code> לשנייה, ואף פעם לא מעבר ל-<code>capacity</code>.</li>
<li><code>allow</code> נקראת עם timestamp בשניות (float, לא יורד). אם יש לפחות <code>cost</code> טוקנים, צורכים אותם ומחזירים <code>True</code>; אחרת מחזירים <code>False</code> ולא צורכים כלום.</li>
</ul>
<p>בלי threads ברקע ובלי טיימרים.</p>`
  },
  examples: `tb = TokenBucket(capacity=3, refill_rate=1.0)   # 1 token per second
tb.allow(0.0) -> True     # 2 left
tb.allow(0.0) -> True     # 1 left
tb.allow(0.0) -> True     # 0 left
tb.allow(0.0) -> False    # empty
tb.allow(1.0) -> True     # refilled 1 token, now 0
tb.allow(1.0) -> False
tb.allow(5.0) -> True     # refilled to cap 3 (not 4), now 2`,
  hints: [
    { en: "You don't need a timer: compute how many tokens would have been added since the last call.", he: "לא צריך טיימר: מחשבים כמה טוקנים היו מתווספים מאז הקריאה הקודמת." },
    { en: "Store (tokens, last_ts). On each call: tokens = min(capacity, tokens + (ts - last_ts) * rate).", he: "שומרים (tokens, last_ts). בכל קריאה: tokens = min(capacity, tokens + (ts - last_ts) * rate)." },
    { en: "Guard against clock going backwards (ts < last_ts) and against cost > capacity.", he: "תגן מפני שעון שחוזר אחורה (ts < last_ts) ומפני cost > capacity." }
  ],
  solution: String.raw`class TokenBucket:
    """Lazy-refill token bucket: O(1) time and memory per call, no background timer."""

    def __init__(self, capacity: float, refill_rate: float):
        if capacity <= 0 or refill_rate < 0:
            raise ValueError("capacity must be > 0 and refill_rate >= 0")
        self.capacity = float(capacity)
        self.rate = float(refill_rate)     # tokens per second
        self.tokens = float(capacity)      # start full -> allows an initial burst
        self.last_ts = None

    def _refill(self, ts: float) -> None:
        if self.last_ts is None:
            self.last_ts = ts
            return
        elapsed = max(0.0, ts - self.last_ts)   # ignore clocks moving backwards
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_ts = max(self.last_ts, ts)

    def allow(self, ts: float, cost: float = 1.0) -> bool:
        self._refill(ts)
        if cost <= self.tokens:
            self.tokens -= cost
            return True
        return False                        # cost > capacity can never succeed


if __name__ == "__main__":
    tb = TokenBucket(capacity=3, refill_rate=1.0)
    calls = [0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 5.0]
    print([tb.allow(t) for t in calls])
    # [True, True, True, False, True, False, True]
`,
  explain: {
    en: `<p>The key insight is <strong>lazy refill</strong>: instead of a timer adding tokens every tick, each call computes <code>elapsed * rate</code> since the last call and caps the result at <code>capacity</code>. This makes every call O(1) with two floats of state, which is why it scales to millions of keys (one bucket per user/IP).</p>
<p><code>capacity</code> controls the <em>burst</em> size, <code>refill_rate</code> the <em>sustained</em> rate. In the example, three requests at t=0 drain the bucket, the fourth is rejected, at t=1 exactly one token is back, and by t=5 the bucket is capped at 3 rather than 4. Clock skew is handled by clamping elapsed to zero.</p>`,
    he: `<p>התובנה המרכזית היא <strong>lazy refill</strong>: במקום טיימר שמוסיף טוקנים כל tick, כל קריאה מחשבת <code>elapsed * rate</code> מאז הקריאה הקודמת וחותכת ב-<code>capacity</code>. ככה כל קריאה היא O(1) עם שני floats של state, ולכן זה מחזיק מיליוני מפתחות (bucket לכל user/IP).</p>
<p><code>capacity</code> קובע את גודל ה-<em>burst</em>, ו-<code>refill_rate</code> את הקצב ה<em>ממושך</em>. בדוגמה, שלוש בקשות ב-t=0 מרוקנות את ה-bucket, הרביעית נדחית, ב-t=1 חזר בדיוק טוקן אחד, וב-t=5 ה-bucket נחתך ב-3 ולא 4. clock skew מטופל בכך שחותכים את elapsed לאפס.</p>`
  },
  complexity: "Time O(1) per call, Space O(1) per bucket",
  whyInfra: {
    en: "Token bucket is the algorithm behind AWS API Gateway throttling (rate + burst), Envoy's local rate limit filter, NGINX limit_req (leaky-bucket variant), Linux tc tbf for traffic shaping, and the Kubernetes client-go / API server client rate limiter (QPS + burst flags).",
    he: "Token bucket הוא האלגוריתם מאחורי throttling ב-AWS API Gateway (rate + burst), ה-local rate limit filter של Envoy, limit_req של NGINX (וריאנט של leaky bucket), tc tbf בלינוקס ל-traffic shaping, וה-rate limiter של client-go / ה-API server בקוברנטיס (הדגלים QPS ו-burst)."
  },
  followUps: [
    { q: { en: "Make it work across 20 API gateway instances.", he: "תגרום לזה לעבוד על פני 20 מופעים של API gateway." },
      a: { en: "Store (tokens, last_ts) per key in Redis and run the refill+consume atomically with a Lua script (or Redis 7 functions) so concurrent gateways can't double-spend. Use the Redis server time to avoid client clock skew. Alternative: give each instance capacity/20 locally and accept imprecision.", he: "שומרים (tokens, last_ts) לכל מפתח ב-Redis ומריצים refill+consume אטומית עם Lua script (או functions ב-Redis 7) כדי ש-gateways מקבילים לא יבזבזו פעמיים. משתמשים בזמן של שרת ה-Redis כדי להימנע מ-clock skew. אלטרנטיבה: לתת לכל מופע capacity/20 מקומית ולקבל חוסר דיוק." } },
    { q: { en: "Token bucket vs leaky bucket vs sliding window?", he: "Token bucket מול leaky bucket מול sliding window?" },
      a: { en: "Token bucket allows bursts up to capacity then a steady rate. Leaky bucket smooths output to a constant rate (queue). Fixed window is cheap but allows 2x bursts at window edges; sliding log is exact but O(limit) memory; sliding-window counter approximates with two counters.", he: "Token bucket מאפשר bursts עד ה-capacity ואז קצב קבוע. Leaky bucket מחליק את ה-output לקצב קבוע (תור). Fixed window זול אבל מאפשר פי 2 בגבולות החלון; sliding log מדויק אבל O(limit) זיכרון; sliding-window counter עושה קירוב עם שני counters." } }
  ]
});

INFRA.problems.push({
  id: "sliding-window-rate-limiter",
  icon: "🪟",
  difficulty: "medium",
  tags: ["queue", "sliding-window", "design"],
  leetcode: "362",
  title: { en: "Sliding Window Rate Limiter / Hit Counter", he: "Rate Limiter עם Sliding Window / Hit Counter" },
  statement: {
    en: `<p>Implement <code>SlidingWindowLimiter(limit, window)</code>:</p>
<ul>
<li><code>allow(client, ts) -&gt; bool</code>: allow the request if the client made fewer than <code>limit</code> <em>accepted</em> requests in the window <code>(ts - window, ts]</code>; record it only if accepted.</li>
<li><code>hits(client, ts) -&gt; int</code>: number of accepted requests of that client in the same window (the LeetCode 362 "hit counter").</li>
</ul>
<p>Timestamps are integers in seconds and arrive in non-decreasing order.</p>`,
    he: `<p>תממש <code>SlidingWindowLimiter(limit, window)</code>:</p>
<ul>
<li><code>allow(client, ts) -&gt; bool</code>: מאשרים את הבקשה אם ל-client היו פחות מ-<code>limit</code> בקשות <em>מאושרות</em> בחלון <code>(ts - window, ts]</code>; שומרים אותה רק אם אושרה.</li>
<li><code>hits(client, ts) -&gt; int</code>: מספר הבקשות המאושרות של ה-client באותו חלון (ה-"hit counter" של LeetCode 362).</li>
</ul>
<p>ה-timestamps הם מספרים שלמים בשניות ומגיעים בסדר לא יורד.</p>`
  },
  examples: `rl = SlidingWindowLimiter(limit=3, window=10)
rl.allow("10.0.0.1", 1)  -> True
rl.allow("10.0.0.1", 2)  -> True
rl.allow("10.0.0.1", 3)  -> True
rl.allow("10.0.0.1", 4)  -> False   # 3 hits in (−6, 4]
rl.allow("10.0.0.9", 4)  -> True    # other client, own window
rl.allow("10.0.0.1", 11) -> True    # hit at t=1 left the window (1, 11]
rl.hits("10.0.0.1", 12)  -> 2       # window (2, 12] holds hits at 3 and 11`,
  hints: [
    { en: "Keep, per client, the timestamps of accepted requests in arrival order.", he: "תשמור, לכל client, את ה-timestamps של הבקשות שאושרו לפי סדר ההגעה." },
    { en: "Old timestamps always leave from the front: a deque with popleft is O(1).", he: "timestamps ישנים תמיד יוצאים מההתחלה: deque עם popleft זה O(1)." },
    { en: "Evict while q[0] <= ts - window, then compare len(q) with limit.", he: "מפנים כל עוד q[0] <= ts - window, ואז משווים את len(q) ל-limit." }
  ],
  solution: String.raw`from collections import defaultdict, deque


class SlidingWindowLimiter:
    """Sliding-log limiter: exact, O(limit) memory per client."""

    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self.log = defaultdict(deque)   # client -> deque of accepted timestamps

    def _evict(self, q: deque, ts: int) -> None:
        # window is (ts - window, ts]; anything <= ts - window has expired
        while q and q[0] <= ts - self.window:
            q.popleft()

    def allow(self, client: str, ts: int) -> bool:
        q = self.log[client]
        self._evict(q, ts)
        if len(q) < self.limit:
            q.append(ts)
            return True
        return False

    def hits(self, client: str, ts: int) -> int:
        q = self.log.get(client)
        if not q:
            return 0
        self._evict(q, ts)
        return len(q)


if __name__ == "__main__":
    rl = SlidingWindowLimiter(limit=3, window=10)
    print([rl.allow("10.0.0.1", t) for t in (1, 2, 3, 4)])  # [True, True, True, False]
    print(rl.allow("10.0.0.9", 4))                          # True
    print(rl.allow("10.0.0.1", 11))                         # True
    print(rl.hits("10.0.0.1", 12))                          # 2
`,
  explain: {
    en: `<p>A fixed window ("count per calendar minute") lets a client send <code>limit</code> requests at 0:59 and another <code>limit</code> at 1:00 — double the rate. A <strong>sliding log</strong> fixes that by remembering the exact timestamps of accepted requests.</p>
<p>Because timestamps arrive in order, expired entries are always at the left of the deque, so eviction is amortised O(1): each timestamp is appended once and popped once. After evicting, the deque length is the number of hits in the window. The deque never holds more than <code>limit</code> entries per client.</p>
<p>For LeetCode 362 (count <em>all</em> hits, up to 300 s, many hits per second) the memory-bounded version is a circular array of 300 buckets <code>(timestamp, count)</code> — see the distributed hit counter problem.</p>`,
    he: `<p>Fixed window ("ספירה לכל דקה עגולה") מאפשר ל-client לשלוח <code>limit</code> בקשות ב-0:59 ועוד <code>limit</code> ב-1:00 – פי שניים מהקצב. <strong>Sliding log</strong> פותר את זה כי הוא זוכר את ה-timestamps המדויקים של הבקשות שאושרו.</p>
<p>מכיוון שה-timestamps מגיעים לפי הסדר, הרשומות שפג תוקפן תמיד בצד שמאל של ה-deque, אז הפינוי הוא O(1) amortized: כל timestamp נכנס פעם אחת ויוצא פעם אחת. אחרי הפינוי, האורך של ה-deque הוא מספר ה-hits בחלון. ה-deque אף פעם לא מחזיק יותר מ-<code>limit</code> רשומות לכל client.</p>
<p>ב-LeetCode 362 (סופרים <em>את כל</em> ה-hits, עד 300 שניות, הרבה hits בשנייה) הגרסה עם זיכרון חסום היא מערך מעגלי של 300 buckets של <code>(timestamp, count)</code> – ראה את בעיית ה-hit counter המבוזר.</p>`
  },
  complexity: "Time O(1) amortised per call, Space O(clients × limit)",
  whyInfra: {
    en: "Sliding windows power API rate limits (GitHub, Stripe, Cloudflare use sliding-window counters), fail2ban (N failed logins in T seconds -> ban), alert rules like 'more than 5 errors in 1 minute', and Prometheus rate()/increase() over a range window.",
    he: "Sliding windows עומדים מאחורי rate limits של APIs (GitHub, Stripe ו-Cloudflare משתמשים ב-sliding-window counters), fail2ban (N התחברויות כושלות ב-T שניות -> ban), כללי התראה כמו 'יותר מ-5 שגיאות בדקה', ו-rate()/increase() של Prometheus על range window."
  },
  followUps: [
    { q: { en: "limit is 10,000 per hour per client and you have 1M clients. Memory?", he: "ה-limit הוא 10,000 לשעה לכל client ויש מיליון clients. מה עם זיכרון?" },
      a: { en: "Sliding log could store 10^10 timestamps — too much. Use the sliding-window counter: keep counts for the current and previous fixed window and estimate prev * (overlap fraction) + current. Two integers per client, ~1% error; this is what Cloudflare describes.", he: "Sliding log יכול להגיע ל-10^10 timestamps – יותר מדי. משתמשים ב-sliding-window counter: שומרים ספירה לחלון הנוכחי ולקודם ומעריכים prev * (חלק החפיפה) + current. שני מספרים לכל client, שגיאה של בערך 1%; זה מה ש-Cloudflare מתארים." } },
    { q: { en: "Clients that stop sending keep their deques forever. Fix it.", he: "Clients שמפסיקים לשלוח נשארים עם deque לנצח. תתקן." },
      a: { en: "Delete a client's entry when its deque becomes empty, or run a periodic sweep / use a TTL cache (in Redis: EXPIRE on the key equal to the window).", he: "מוחקים את הרשומה של ה-client כשה-deque שלו מתרוקן, או מריצים sweep תקופתי / cache עם TTL (ב-Redis: EXPIRE על המפתח בגודל החלון)." } }
  ]
});

INFRA.problems.push({
  id: "top-k-frequent-ips",
  icon: "🌐",
  difficulty: "medium",
  tags: ["hashmap", "heap", "bucket-sort"],
  leetcode: "347",
  title: { en: "Top K Frequent IPs", he: "K כתובות ה-IP הנפוצות ביותר" },
  statement: {
    en: `<p>During a suspected DDoS you dump the source IP of every request from the load balancer access log. Return the <code>k</code> most frequent IPs, most frequent first. Break ties by IP string (ascending) so the output is deterministic.</p>
<p>Aim for better than O(n log n) where n is the number of distinct IPs.</p>`,
    he: `<p>בזמן חשד ל-DDoS אתה שולף את ה-source IP של כל בקשה מה-access log של ה-load balancer. תחזיר את <code>k</code> כתובות ה-IP הכי נפוצות, מהנפוצה ביותר. בתיקו – לפי מחרוזת ה-IP בסדר עולה, כדי שה-output יהיה דטרמיניסטי.</p>
<p>תכוון ליותר טוב מ-O(n log n), כאשר n הוא מספר ה-IPs השונים.</p>`
  },
  examples: `Input:
ips = ["1.1.1.1", "2.2.2.2", "1.1.1.1", "3.3.3.3", "2.2.2.2", "1.1.1.1", "9.9.9.9"]
k = 2
Output: ["1.1.1.1", "2.2.2.2"]      # 3 and 2 hits

Input: ips = ["5.5.5.5", "4.4.4.4"], k = 1
Output: ["4.4.4.4"]                 # tie -> smaller string`,
  hints: [
    { en: "First count occurrences with a hashmap. The problem becomes: top-k items of a dict by value.", he: "קודם סופרים עם hashmap. הבעיה הופכת ל: top-k פריטים ב-dict לפי ערך." },
    { en: "A heap of size k gives O(n log k): heapq.nlargest / nsmallest with a key.", he: "heap בגודל k נותן O(n log k): heapq.nlargest / nsmallest עם key." },
    { en: "For O(n): bucket sort by frequency — counts are between 1 and len(ips).", he: "בשביל O(n): bucket sort לפי תדירות – הספירות הן בין 1 ל-len(ips)." }
  ],
  solution: String.raw`import heapq
from collections import Counter
from typing import List


def top_k_ips(ips: List[str], k: int) -> List[str]:
    """Heap approach: O(N + n log k)."""
    counts = Counter(ips)
    # smallest by (-count, ip) == highest count first, then ip ascending
    best = heapq.nsmallest(k, counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [ip for ip, _ in best]


def top_k_ips_bucket(ips: List[str], k: int) -> List[str]:
    """Bucket-sort approach: O(N + n) (plus sorting inside the few buckets we touch)."""
    counts = Counter(ips)
    buckets = [[] for _ in range(len(ips) + 1)]  # index = frequency
    for ip, c in counts.items():
        buckets[c].append(ip)
    result = []
    for freq in range(len(buckets) - 1, 0, -1):
        for ip in sorted(buckets[freq]):         # sort only for deterministic ties
            result.append(ip)
            if len(result) == k:
                return result
    return result


if __name__ == "__main__":
    ips = ["1.1.1.1", "2.2.2.2", "1.1.1.1", "3.3.3.3", "2.2.2.2", "1.1.1.1", "9.9.9.9"]
    print(top_k_ips(ips, 2), top_k_ips_bucket(ips, 2))   # ['1.1.1.1', '2.2.2.2'] twice
    print(top_k_ips(["5.5.5.5", "4.4.4.4"], 1))          # ['4.4.4.4']
`,
  explain: {
    en: `<p>Step 1 is always counting: <code>Counter</code> builds ip → hits in O(N). Sorting all n distinct IPs is O(n log n); we only need k of them.</p>
<p><strong>Heap:</strong> <code>heapq.nsmallest(k, ..., key=(-count, ip))</code> keeps a heap of size k, giving O(n log k) — great when k is small (top 10 out of a million IPs). The key negates the count for "largest first" and adds the IP for tie-breaking.</p>
<p><strong>Bucket sort:</strong> a frequency is at most N, so we drop IPs into <code>buckets[freq]</code> and walk from the highest frequency down until we have k. That is linear in N plus small sorts for ties.</p>`,
    he: `<p>שלב 1 הוא תמיד ספירה: <code>Counter</code> בונה ip → hits ב-O(N). למיין את כל n ה-IPs השונים זה O(n log n); אנחנו צריכים רק k מהם.</p>
<p><strong>Heap:</strong> <code>heapq.nsmallest(k, ..., key=(-count, ip))</code> מחזיק heap בגודל k, כלומר O(n log k) – מצוין כש-k קטן (top 10 מתוך מיליון IPs). ה-key הופך את הספירה לשלילית בשביל "הגדול קודם" ומוסיף את ה-IP לשבירת תיקו.</p>
<p><strong>Bucket sort:</strong> תדירות היא לכל היותר N, אז זורקים כל IP ל-<code>buckets[freq]</code> והולכים מהתדירות הכי גבוהה למטה עד שיש k. זה לינארי ב-N, ועוד מיונים קטנים לתיקו.</p>`
  },
  complexity: "Heap: Time O(N + n log k), Space O(n). Bucket: Time O(N + n), Space O(N)",
  whyInfra: {
    en: "Finding heavy hitters is the first step in DDoS mitigation (block the top talkers at the WAF / security group), in noisy-neighbour analysis, in Redis --hotkeys, and in CloudWatch Contributor Insights / Datadog top lists. At line rate, routers use Count-Min Sketch + heap instead of exact counts.",
    he: "מציאת heavy hitters היא הצעד הראשון ב-DDoS mitigation (לחסום את ה-top talkers ב-WAF / ב-security group), בניתוח noisy neighbours, ב-redis --hotkeys, וב-Contributor Insights של CloudWatch / top lists של Datadog. במהירות קו, ראוטרים משתמשים ב-Count-Min Sketch + heap במקום ספירה מדויקת."
  },
  followUps: [
    { q: { en: "The stream is endless and you have 1 MB of memory. Top 10 IPs?", he: "ה-stream אינסופי ויש לך 1 MB זיכרון. 10 ה-IPs המובילים?" },
      a: { en: "Approximate: Count-Min Sketch for frequencies plus a min-heap of size k of candidates, or the Space-Saving / Misra-Gries algorithm, which keeps k counters and guarantees finding items above N/k frequency.", he: "בקירוב: Count-Min Sketch לתדירויות ועוד min-heap בגודל k של מועמדים, או האלגוריתם Space-Saving / Misra-Gries, ששומר k counters ומבטיח למצוא פריטים עם תדירות מעל N/k." } },
    { q: { en: "Top-k across 50 load balancers?", he: "Top-k על פני 50 load balancers?" },
      a: { en: "Merge full counts centrally (exact but heavy), or have each LB send its top-m with m much larger than k and merge — fast but can miss an IP that is moderately frequent everywhere. Mention this correctness trade-off.", he: "ממזגים את כל הספירות במרכז (מדויק אבל כבד), או שכל LB שולח top-m עם m גדול בהרבה מ-k וממזגים – מהיר אבל עלול לפספס IP שהוא בינוני בכל מקום. כדאי להזכיר את ה-trade-off הזה על נכונות." } }
  ]
});

INFRA.problems.push({
  id: "merge-intervals-maintenance",
  icon: "🛠️",
  difficulty: "medium",
  tags: ["intervals", "sorting"],
  leetcode: "56",
  title: { en: "Merge Maintenance Windows & Total Downtime", he: "מיזוג חלונות תחזוקה וחישוב downtime" },
  statement: {
    en: `<p>Several teams reported outage / maintenance windows for the same service as <code>[start, end]</code> minutes (they may overlap or touch). Return:</p>
<ol>
<li>the merged, non-overlapping windows sorted by start (windows that touch, e.g. <code>[1,3]</code> and <code>[3,5]</code>, merge);</li>
<li>the total downtime in minutes (sum of merged lengths, <code>end - start</code>).</li>
</ol>
<p>Input is not sorted.</p>`,
    he: `<p>כמה צוותים דיווחו על חלונות תקלה / תחזוקה לאותו שירות בתור <code>[start, end]</code> בדקות (הם יכולים לחפוף או לגעת). תחזיר:</p>
<ol>
<li>את החלונות הממוזגים, בלי חפיפות, ממוינים לפי start (חלונות שנוגעים, כמו <code>[1,3]</code> ו-<code>[3,5]</code>, מתמזגים);</li>
<li>את סך ה-downtime בדקות (סכום האורכים הממוזגים, <code>end - start</code>).</li>
</ol>
<p>ה-input לא ממוין.</p>`
  },
  examples: `Input:  windows = [[8, 10], [1, 3], [2, 6], [15, 18]]
Output: ([[1, 6], [8, 10], [15, 18]], 10)    # 5 + 2 + 3

Input:  windows = [[1, 4], [4, 5]]
Output: ([[1, 5]], 4)`,
  hints: [
    { en: "If the windows were sorted by start, overlapping ones would be adjacent.", he: "אם החלונות היו ממוינים לפי start, החופפים היו צמודים." },
    { en: "After sorting, compare each window with the last merged one: if start <= last_end, extend; else start a new block.", he: "אחרי מיון, משווים כל חלון לאחרון שמוזג: אם start <= last_end מאריכים; אחרת פותחים בלוק חדש." },
    { en: "Use max(last_end, end) — a window can be fully contained inside the previous one.", he: "תשתמש ב-max(last_end, end) – חלון יכול להיות מוכל לגמרי בתוך הקודם." }
  ],
  solution: String.raw`from typing import List, Tuple


def merge_windows(windows: List[List[int]]) -> Tuple[List[List[int]], int]:
    """Merge overlapping/touching [start, end] windows and return (merged, total_downtime)."""
    merged: List[List[int]] = []
    for start, end in sorted(windows):            # sort by start (then end)
        if merged and start <= merged[-1][1]:      # overlaps or touches the last block
            merged[-1][1] = max(merged[-1][1], end)  # handle fully-contained windows
        else:
            merged.append([start, end])
    downtime = sum(end - start for start, end in merged)
    return merged, downtime


if __name__ == "__main__":
    print(merge_windows([[8, 10], [1, 3], [2, 6], [15, 18]]))  # ([[1, 6], [8, 10], [15, 18]], 10)
    print(merge_windows([[1, 4], [4, 5]]))                      # ([[1, 5]], 4)
    print(merge_windows([]))                                    # ([], 0)
`,
  explain: {
    en: `<p>Sorting by start is the whole trick: once sorted, any window that overlaps the current merged block must come right after it. We keep a list of merged blocks and only ever look at the last one. If the next window starts at or before the block's end, it extends the block (taking the max end, because <code>[1,10]</code> followed by <code>[2,3]</code> must stay <code>[1,10]</code>). Otherwise there is a gap and a new block starts.</p>
<p>Summing lengths <em>after</em> merging is crucial: summing the raw windows double-counts overlaps and would report 13 minutes instead of 10 in the example — a classic SLA reporting bug.</p>`,
    he: `<p>המיון לפי start הוא כל הטריק: אחרי מיון, כל חלון שחופף לבלוק הממוזג הנוכחי חייב להגיע מיד אחריו. מחזיקים רשימה של בלוקים ממוזגים ומסתכלים רק על האחרון. אם החלון הבא מתחיל לפני או בדיוק בסוף הבלוק, הוא מאריך אותו (לוקחים max של ה-end, כי <code>[1,10]</code> ואחריו <code>[2,3]</code> צריך להישאר <code>[1,10]</code>). אחרת יש פער ומתחיל בלוק חדש.</p>
<p>קריטי לסכום את האורכים <em>אחרי</em> המיזוג: סכום של החלונות הגולמיים סופר חפיפות פעמיים וידווח 13 דקות במקום 10 בדוגמה – באג קלאסי בדוחות SLA.</p>`
  },
  complexity: "Time O(n log n) for the sort, Space O(n)",
  whyInfra: {
    en: "SLO/SLA reporting merges overlapping incident windows to compute real downtime and error-budget burn. Alertmanager silences, PagerDuty maintenance windows, change-freeze calendars and cron/backup scheduling all reason about interval overlap. IP range / CIDR aggregation is the same merge on address ranges.",
    he: "בדוחות SLO/SLA ממזגים חלונות אינצידנט חופפים כדי לחשב downtime אמיתי ואת שריפת ה-error budget. silences ב-Alertmanager, maintenance windows ב-PagerDuty, יומני change-freeze ותזמון cron/גיבויים – כולם עוסקים בחפיפת intervals. איחוד טווחי IP / CIDR זה אותו מיזוג על טווחי כתובות."
  },
  followUps: [
    { q: { en: "Compute availability % for a 30-day month (43,200 minutes).", he: "תחשב availability % לחודש של 30 יום (43,200 דקות)." },
      a: { en: "availability = 1 - downtime / 43200. Clip windows to the month boundaries first. 10 minutes of downtime -> 99.977%. For 99.9% the budget is 43.2 minutes.", he: "availability = 1 - downtime / 43200. קודם חותכים את החלונות לגבולות החודש. 10 דקות downtime -> 99.977%. ל-99.9% התקציב הוא 43.2 דקות." } },
    { q: { en: "Windows arrive one at a time and you must keep the merged set updated.", he: "החלונות מגיעים אחד-אחד וצריך לשמור את הקבוצה הממוזגת מעודכנת." },
      a: { en: "Keep merged intervals in a sorted structure (sortedcontainers / balanced BST). Binary-search the insert position, then absorb overlapping neighbours. O(log n + overlaps) per insert (LeetCode 57 / 352).", he: "מחזיקים את ה-intervals הממוזגים במבנה ממוין (sortedcontainers / balanced BST). binary search למיקום ההכנסה, ואז בולעים שכנים חופפים. O(log n + חפיפות) להכנסה (LeetCode 57 / 352)." } }
  ]
});

INFRA.problems.push({
  id: "course-schedule-deploy-order",
  icon: "🚀",
  difficulty: "medium",
  tags: ["graph", "topological-sort", "bfs"],
  leetcode: "210",
  title: { en: "Deploy Order of Dependent Services", he: "סדר deploy של שירותים תלויים" },
  statement: {
    en: `<p>You are rolling out a new environment. Given a list of <code>services</code> and a list of dependencies <code>(service, depends_on)</code> meaning <em>depends_on</em> must be deployed before <em>service</em>, return a valid deploy order. If the dependencies contain a cycle, return <code>None</code> together with the services stuck in or behind the cycle.</p>
<p>Prefer the input order of <code>services</code> when several are ready at once, so the output is deterministic.</p>`,
    he: `<p>אתה מרים סביבה חדשה. בהינתן רשימת <code>services</code> ורשימת תלויות <code>(service, depends_on)</code> – כלומר <em>depends_on</em> חייב לעלות לפני <em>service</em> – תחזיר סדר deploy תקין. אם יש מעגל בתלויות, תחזיר <code>None</code> ביחד עם השירותים שתקועים במעגל או מאחוריו.</p>
<p>כשכמה שירותים מוכנים באותו זמן, תעדיף את הסדר של <code>services</code> ב-input, כדי שה-output יהיה דטרמיניסטי.</p>`
  },
  examples: `Input:
services = ["db", "cache", "api", "web"]
deps = [("api", "db"), ("api", "cache"), ("web", "api")]
Output: (['db', 'cache', 'api', 'web'], [])

Input:
services = ["auth", "users", "web"]
deps = [("auth", "users"), ("users", "auth"), ("web", "auth")]
Output: (None, ['auth', 'users', 'web'])   # auth <-> users cycle blocks web too`,
  hints: [
    { en: "Model it as a directed graph: edge depends_on -> service. A valid order is a topological sort.", he: "תמדל את זה כגרף מכוון: קשת depends_on -> service. סדר תקין הוא topological sort." },
    { en: "Kahn's algorithm: count incoming edges (in-degree). Services with in-degree 0 can deploy now.", he: "האלגוריתם של Kahn: סופרים קשתות נכנסות (in-degree). שירותים עם in-degree 0 יכולים לעלות עכשיו." },
    { en: "When you deploy one, decrement its dependents. If at the end you deployed fewer than all services, the rest are in or behind a cycle.", he: "כשמעלים אחד, מורידים 1 לכל מי שתלוי בו. אם בסוף העלית פחות מכל השירותים – השאר במעגל או מאחוריו." }
  ],
  solution: String.raw`from collections import defaultdict, deque
from typing import List, Optional, Tuple


def deploy_order(services: List[str],
                 deps: List[Tuple[str, str]]) -> Tuple[Optional[List[str]], List[str]]:
    """Kahn's topological sort. Returns (order, []) or (None, blocked_services)."""
    dependents = defaultdict(list)            # depends_on -> [services that need it]
    indegree = {s: 0 for s in services}
    for service, depends_on in deps:
        for name in (service, depends_on):    # tolerate services missing from the list
            indegree.setdefault(name, 0)
        dependents[depends_on].append(service)
        indegree[service] += 1

    ready = deque(s for s in indegree if indegree[s] == 0)  # dict keeps input order
    order = []
    while ready:
        current = ready.popleft()
        order.append(current)
        for nxt in dependents[current]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                ready.append(nxt)

    if len(order) == len(indegree):
        return order, []
    blocked = [s for s in indegree if indegree[s] > 0]
    return None, blocked


if __name__ == "__main__":
    print(deploy_order(["db", "cache", "api", "web"],
                       [("api", "db"), ("api", "cache"), ("web", "api")]))
    # (['db', 'cache', 'api', 'web'], [])
    print(deploy_order(["auth", "users", "web"],
                       [("auth", "users"), ("users", "auth"), ("web", "auth")]))
    # (None, ['auth', 'users', 'web'])
`,
  explain: {
    en: `<p>Draw an edge from each dependency to the service that needs it. A service can deploy once all its incoming edges are satisfied, i.e. its <strong>in-degree</strong> drops to 0. Kahn's algorithm starts a queue with every in-degree-0 service, repeatedly deploys one, and "removes" its outgoing edges by decrementing dependents; anything that hits 0 joins the queue.</p>
<p>If the graph has a cycle, the services on it never reach in-degree 0 (each waits for the other), and nor does anything downstream. So <code>len(order) &lt; number of services</code> detects a cycle, and the services with leftover in-degree are exactly the blocked ones — a useful error message for an engineer.</p>
<p>Using a FIFO queue and seeding it in input order makes the output deterministic. Services in the same "wave" could also be deployed in parallel (group by BFS level).</p>`,
    he: `<p>מציירים קשת מכל תלות אל השירות שצריך אותה. שירות יכול לעלות ברגע שכל הקשתות הנכנסות שלו סופקו, כלומר ה-<strong>in-degree</strong> שלו ירד ל-0. האלגוריתם של Kahn מתחיל תור עם כל השירותים שה-in-degree שלהם 0, מעלה אחד בכל פעם, ו"מוחק" את הקשתות היוצאות שלו על ידי הורדה של 1 אצל התלויים בו; מי שמגיע ל-0 נכנס לתור.</p>
<p>אם יש בגרף מעגל, השירותים שעליו לא מגיעים אף פעם ל-in-degree 0 (כל אחד מחכה לשני), וגם לא כל מה שתלוי בהם. אז <code>len(order) &lt; מספר השירותים</code> מזהה מעגל, והשירותים שנשאר להם in-degree הם בדיוק החסומים – הודעת שגיאה שימושית למהנדס.</p>
<p>תור FIFO שמאותחל לפי סדר ה-input הופך את ה-output לדטרמיניסטי. שירותים באותו "גל" יכולים גם לעלות במקביל (קיבוץ לפי רמת BFS).</p>`
  },
  complexity: "Time O(V + E), Space O(V + E)",
  whyInfra: {
    en: "Terraform builds a dependency DAG and walks it in topological order (with parallelism = 10 by default), and fails with 'Cycle:' errors. Helm hooks, Argo CD sync waves, docker compose depends_on, systemd After=/Requires=, Bazel/Make and Airflow DAGs all run topological sorts.",
    he: "Terraform בונה DAG של תלויות ועובר עליו לפי סדר טופולוגי (עם parallelism = 10 כברירת מחדל), ונופל עם שגיאות 'Cycle:'. Helm hooks, sync waves ב-Argo CD, depends_on ב-docker compose, After=/Requires= ב-systemd, Bazel/Make ו-DAGs של Airflow – כולם מריצים topological sort."
  },
  followUps: [
    { q: { en: "Return deploy 'waves' that can run in parallel.", he: "תחזיר 'גלים' של deploy שיכולים לרוץ במקביל." },
      a: { en: "Process the queue level by level: take all current zero-in-degree services as one wave, then compute the next wave. The number of waves is the longest dependency chain — the minimum rollout time if each wave takes one step.", he: "מעבדים את התור רמה-רמה: כל השירותים עם in-degree 0 כרגע הם גל אחד, ואז מחשבים את הגל הבא. מספר הגלים הוא שרשרת התלויות הארוכה ביותר – זמן ה-rollout המינימלי אם כל גל לוקח צעד אחד." } },
    { q: { en: "Print the actual cycle path (auth -> users -> auth).", he: "תדפיס את מסלול המעגל עצמו (auth -> users -> auth)." },
      a: { en: "Use DFS with three colours (white/grey/black) and a path stack; hitting a grey node means a back edge, and the stack from that node to the top is the cycle. See the 'alien-dependency-resolver' problem.", he: "DFS עם שלושה צבעים (לבן/אפור/שחור) ו-stack של המסלול; פגיעה ב-node אפור היא back edge, והמסלול ב-stack מה-node הזה ועד הראש הוא המעגל. ראה את הבעיה 'alien-dependency-resolver'." } }
  ]
});

INFRA.problems.push({
  id: "consistent-hashing",
  icon: "💍",
  difficulty: "medium",
  tags: ["hashing", "binary-search", "design"],
  title: { en: "Consistent Hashing Ring", he: "Consistent Hashing Ring" },
  statement: {
    en: `<p>Implement a consistent hash ring that maps keys (e.g. cache keys or user IDs) to nodes:</p>
<ul>
<li><code>HashRing(vnodes=100)</code> — each physical node is placed on the ring <code>vnodes</code> times (virtual nodes).</li>
<li><code>add_node(name)</code>, <code>remove_node(name)</code>.</li>
<li><code>get_node(key)</code> — hash the key and walk clockwise to the first virtual node; return its physical node. Return <code>None</code> if the ring is empty.</li>
</ul>
<p>Use a stable hash (not Python's randomized <code>hash()</code>). Lookups should be O(log n).</p>`,
    he: `<p>תממש consistent hash ring שממפה keys (למשל מפתחות cache או user IDs) ל-nodes:</p>
<ul>
<li><code>HashRing(vnodes=100)</code> – כל node פיזי מוצב על הטבעת <code>vnodes</code> פעמים (virtual nodes).</li>
<li><code>add_node(name)</code>, <code>remove_node(name)</code>.</li>
<li><code>get_node(key)</code> – עושים hash למפתח והולכים עם כיוון השעון עד ה-virtual node הראשון; מחזירים את ה-node הפיזי שלו. אם הטבעת ריקה מחזירים <code>None</code>.</li>
</ul>
<p>תשתמש ב-hash יציב (לא ב-<code>hash()</code> של פייתון, שהוא אקראי בין ריצות). lookup צריך להיות O(log n).</p>`
  },
  examples: `ring = HashRing(vnodes=100)
for n in ["cache-a", "cache-b", "cache-c"]:
    ring.add_node(n)
ring.get_node("user:42")       -> one of cache-a / cache-b / cache-c (stable across runs)

# Distribution of 10,000 keys is roughly even (~3,333 each, typically within ~10%).
# After ring.add_node("cache-d"), only ~1/4 of keys move — all of them TO cache-d.
# With naive hash(key) % N, going 3 -> 4 nodes moves ~3/4 of keys.`,
  hints: [
    { en: "Map both nodes and keys into the same integer space (e.g. first 8 bytes of md5). Keep node positions in a sorted list.", he: "תמפה גם nodes וגם keys לאותו מרחב של מספרים (למשל 8 הבתים הראשונים של md5). תחזיק את מיקומי ה-nodes ברשימה ממוינת." },
    { en: "'First position clockwise' = bisect_right on the sorted list; wrap around to index 0 at the end.", he: "'המיקום הראשון עם כיוון השעון' = bisect_right על הרשימה הממוינת; בסוף חוזרים לאינדקס 0." },
    { en: "With one point per node the arcs are very uneven. Hash 'node#i' for i in range(vnodes) to spread each node around the ring.", he: "עם נקודה אחת לכל node הקשתות מאוד לא שוות. תעשה hash ל-'node#i' עבור i ב-range(vnodes) כדי לפזר כל node על הטבעת." }
  ],
  solution: String.raw`import bisect
import hashlib
from collections import Counter
from typing import Dict, List, Optional


def stable_hash(value: str) -> int:
    """64-bit stable hash (Python's hash() is salted per process)."""
    return int.from_bytes(hashlib.md5(value.encode()).digest()[:8], "big")


class HashRing:
    def __init__(self, vnodes: int = 100):
        self.vnodes = vnodes
        self.positions: List[int] = []     # sorted virtual-node positions
        self.owner: Dict[int, str] = {}    # position -> physical node
        self.nodes = set()

    def add_node(self, node: str) -> None:
        if node in self.nodes:
            return
        self.nodes.add(node)
        for i in range(self.vnodes):
            pos = stable_hash(f"{node}#{i}")
            if pos in self.owner:          # astronomically rare 64-bit collision
                continue
            self.owner[pos] = node
            bisect.insort(self.positions, pos)

    def remove_node(self, node: str) -> None:
        if node not in self.nodes:
            return
        self.nodes.remove(node)
        self.positions = [p for p in self.positions if self.owner[p] != node]
        self.owner = {p: n for p, n in self.owner.items() if n != node}

    def get_node(self, key: str) -> Optional[str]:
        if not self.positions:
            return None
        idx = bisect.bisect_right(self.positions, stable_hash(key))
        if idx == len(self.positions):     # past the last point: wrap around
            idx = 0
        return self.owner[self.positions[idx]]


if __name__ == "__main__":
    ring = HashRing(vnodes=100)
    for n in ["cache-a", "cache-b", "cache-c"]:
        ring.add_node(n)
    keys = [f"user:{i}" for i in range(10_000)]
    before = {k: ring.get_node(k) for k in keys}
    print(Counter(before.values()))

    ring.add_node("cache-d")
    after = {k: ring.get_node(k) for k in keys}
    moved = [k for k in keys if before[k] != after[k]]
    print(len(moved), "keys moved;", all(after[k] == "cache-d" for k in moved))
`,
  explain: {
    en: `<p>With <code>hash(key) % N</code>, changing N remaps almost every key — a cache cluster would lose nearly all hits when one node is added. Consistent hashing places nodes and keys on the same circle; a key belongs to the first node clockwise. Adding a node only steals the keys on the arcs just before its points; removing a node hands its keys to the next ones. On average only <code>1/N</code> of keys move.</p>
<p>The ring is a sorted list of positions. <code>bisect_right</code> finds the first position greater than the key's hash in O(log V), and running off the end wraps to index 0. <strong>Virtual nodes</strong> fix the uneven arcs you get with one random point per node and let you weight bigger machines (more vnodes). Removing a node here is O(V) by rebuilding, which is fine because membership changes are rare compared with lookups.</p>`,
    he: `<p>עם <code>hash(key) % N</code>, שינוי של N ממפה מחדש כמעט כל מפתח – cluster של cache יאבד כמעט את כל ה-hits כשמוסיפים node אחד. Consistent hashing שם את ה-nodes וה-keys על אותו מעגל; מפתח שייך ל-node הראשון עם כיוון השעון. הוספת node גונבת רק את המפתחות שעל הקשתות שלפני הנקודות שלו; הסרת node מעבירה את המפתחות שלו לבאים בתור. בממוצע זזים רק <code>1/N</code> מהמפתחות.</p>
<p>הטבעת היא רשימה ממוינת של מיקומים. <code>bisect_right</code> מוצא את המיקום הראשון שגדול מה-hash של המפתח ב-O(log V), ואם עוברים את הסוף חוזרים לאינדקס 0. <strong>Virtual nodes</strong> מתקנים את הקשתות הלא שוות שמקבלים עם נקודה אקראית אחת לכל node, ומאפשרים לתת משקל למכונות גדולות (יותר vnodes). הסרת node כאן היא O(V) כי בונים מחדש, וזה בסדר כי שינויי membership נדירים לעומת lookups.</p>`
  },
  complexity: "get_node O(log V), add_node O(v · V) with insort (or O(V log V) rebuild), remove_node O(V); V = nodes × vnodes",
  whyInfra: {
    en: "Consistent hashing shards data in Cassandra, DynamoDB and Riak, routes keys in memcached clients (ketama), powers Envoy/NGINX ring-hash and Maglev load balancing for sticky sessions, and Discord/Akamai use it to spread load. Redis Cluster uses a related idea: 16,384 fixed hash slots assigned to nodes.",
    he: "Consistent hashing מבצע sharding לנתונים ב-Cassandra, DynamoDB ו-Riak, מנתב מפתחות ב-clients של memcached (ketama), עומד מאחורי ring-hash ו-Maglev ב-Envoy/NGINX בשביל sticky sessions, ו-Discord/Akamai משתמשים בו לפיזור עומס. Redis Cluster משתמש ברעיון קרוב: 16,384 hash slots קבועים שמחולקים בין ה-nodes."
  },
  followUps: [
    { q: { en: "How do you replicate each key to 3 nodes?", he: "איך משכפלים כל מפתח ל-3 nodes?" },
      a: { en: "Keep walking clockwise from the key's position and collect the first 3 distinct physical nodes (skip vnodes of a node you already picked). That's Dynamo's preference list.", he: "ממשיכים ללכת עם כיוון השעון מהמיקום של המפתח ואוספים את 3 ה-nodes הפיזיים השונים הראשונים (מדלגים על vnodes של node שכבר נבחר). זו ה-preference list של Dynamo." } },
    { q: { en: "One key is extremely hot. Does consistent hashing help?", he: "מפתח אחד חם בטירוף. consistent hashing עוזר?" },
      a: { en: "No — one key always maps to one node. Use bounded-load consistent hashing (Google), replicate hot keys and read from any replica, or add a local in-process cache in front.", he: "לא – מפתח אחד תמיד ממופה ל-node אחד. משתמשים ב-consistent hashing with bounded loads (של Google), משכפלים מפתחות חמים וקוראים מכל replica, או מוסיפים cache מקומי בתהליך לפני." } }
  ]
});

INFRA.problems.push({
  id: "kth-largest-latency-stream",
  icon: "📈",
  difficulty: "medium",
  tags: ["heap", "stream", "percentiles"],
  leetcode: "703",
  title: { en: "K-th Largest Latency in a Stream", he: "ה-latency ה-K הכי גדול ב-stream" },
  statement: {
    en: `<p>Latency samples stream in. Implement <code>KthLargest(k, nums)</code> with <code>add(val) -&gt; int</code> that adds a sample and returns the <strong>k-th largest</strong> value seen so far.</p>
<p>Why it matters: if you have exactly 1,000 samples, the p99 is roughly the 10th largest. Assume at least <code>k</code> values exist after each <code>add</code>.</p>`,
    he: `<p>דגימות latency מגיעות ב-stream. תממש <code>KthLargest(k, nums)</code> עם <code>add(val) -&gt; int</code> שמוסיפה דגימה ומחזירה את הערך <strong>ה-k הכי גדול</strong> שנראה עד עכשיו.</p>
<p>למה זה חשוב: אם יש בדיוק 1,000 דגימות, ה-p99 הוא בערך הערך העשירי הכי גדול. אפשר להניח שאחרי כל <code>add</code> יש לפחות <code>k</code> ערכים.</p>`
  },
  examples: `kth = KthLargest(3, [4, 5, 8, 2])
kth.add(3)  -> 4
kth.add(5)  -> 5
kth.add(10) -> 5
kth.add(9)  -> 8
kth.add(4)  -> 8`,
  hints: [
    { en: "Sorting after every add is O(n log n) per call. You only care about the top k values.", he: "מיון אחרי כל add זה O(n log n) לקריאה. מעניינים אותך רק k הערכים העליונים." },
    { en: "Keep a min-heap of size k holding the k largest values. Its root is the answer.", he: "תחזיק min-heap בגודל k עם k הערכים הכי גדולים. השורש שלו הוא התשובה." },
    { en: "On add: push; if size > k, pop the smallest. heapq.heappushpop does both efficiently.", he: "ב-add: דוחפים; אם הגודל > k, מוציאים את הקטן. heapq.heappushpop עושה את שניהם ביעילות." }
  ],
  solution: String.raw`import heapq
from typing import List


class KthLargest:
    """Min-heap of the k largest values; heap[0] is the k-th largest."""

    def __init__(self, k: int, nums: List[int]):
        self.k = k
        self.heap: List[int] = []
        for n in nums:
            self.add(n)

    def add(self, val: int) -> int:
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, val)
        elif val > self.heap[0]:
            heapq.heapreplace(self.heap, val)   # pop smallest, push val, one O(log k) op
        # values <= heap[0] can never be in the top k: ignore them
        return self.heap[0]


if __name__ == "__main__":
    kth = KthLargest(3, [4, 5, 8, 2])
    print([kth.add(v) for v in (3, 5, 10, 9, 4)])  # [4, 5, 5, 8, 8]
`,
  explain: {
    en: `<p>The k largest values form a "club". The weakest member of the club is the k-th largest. A <strong>min-heap</strong> of size k keeps the weakest member at the root, so reading the answer is O(1).</p>
<p>When a new value arrives: if the club has room, it joins. Otherwise it joins only if it beats the weakest member, which gets kicked out (<code>heapreplace</code>). Values that don't beat the root can never matter again, so memory stays O(k) no matter how long the stream runs.</p>
<p>For p99 over a live stream, k grows with the count (1% of n), and samples should expire. That's where real systems switch to histograms or sketches (see follow-ups).</p>`,
    he: `<p>k הערכים הכי גדולים הם "מועדון". החבר הכי חלש במועדון הוא ה-k הכי גדול. <strong>min-heap</strong> בגודל k מחזיק את החבר הכי חלש בשורש, אז קריאת התשובה היא O(1).</p>
<p>כשמגיע ערך חדש: אם יש מקום במועדון, הוא נכנס. אחרת הוא נכנס רק אם הוא מנצח את החלש ביותר, שעף החוצה (<code>heapreplace</code>). ערכים שלא מנצחים את השורש לעולם לא ישפיעו שוב, אז הזיכרון נשאר O(k) לא משנה כמה זמן ה-stream רץ.</p>
<p>בשביל p99 על stream חי, k גדל עם הכמות (1% מ-n), ודגימות צריכות לפוג. שם מערכות אמיתיות עוברות ל-histograms או sketches (ראה follow-ups).</p>`
  },
  complexity: "Time O(log k) per add (O(n log k) init), Space O(k)",
  whyInfra: {
    en: "Tail latency (p99/p999) drives SLOs and autoscaling decisions. Load tools like wrk/k6 and APMs compute it; exact top-k heaps work for small windows, while Prometheus histograms (histogram_quantile), HDR Histogram, t-digest (Elasticsearch percentiles) and DDSketch (Datadog) handle billions of samples.",
    he: "Tail latency (p99/p999) מניע SLOs והחלטות autoscaling. כלי עומס כמו wrk/k6 ו-APMs מחשבים אותו; heap מדויק של top-k עובד לחלונות קטנים, ואילו histograms של Prometheus (histogram_quantile), HDR Histogram, t-digest (percentiles ב-Elasticsearch) ו-DDSketch (Datadog) מתמודדים עם מיליארדי דגימות."
  },
  followUps: [
    { q: { en: "Compute p99 over billions of requests across 500 hosts.", he: "תחשב p99 על מיליארדי בקשות מ-500 hosts." },
      a: { en: "Exact is impractical. Use a mergeable sketch: t-digest (accurate at the tails), DDSketch (relative-error guarantee) or fixed histogram buckets. Each host keeps a small sketch, and sketches are merged centrally. Never average per-host p99s — percentiles are not averageable.", he: "מדויק זה לא מעשי. משתמשים ב-sketch שאפשר למזג: t-digest (מדויק בזנבות), DDSketch (הבטחת relative error) או histogram buckets קבועים. כל host מחזיק sketch קטן, וממזגים במרכז. אף פעם לא עושים ממוצע של p99 בין hosts – אי אפשר למצע percentiles." } },
    { q: { en: "Need p99 of only the last 60 seconds.", he: "צריך p99 רק של 60 השניות האחרונות." },
      a: { en: "Keep one sketch/histogram per second in a ring buffer of 60 and merge them on query (or keep two rotating windows). This is how Prometheus histograms plus rate() over [1m] work.", he: "מחזיקים sketch/histogram לכל שנייה ב-ring buffer של 60 וממזגים בזמן השאילתה (או שני חלונות מתחלפים). ככה עובדים histograms של Prometheus עם rate() על [1m]." } }
  ]
});

INFRA.problems.push({
  id: "number-of-islands-network-segments",
  icon: "🏝️",
  difficulty: "medium",
  tags: ["graph", "bfs", "union-find", "grid"],
  leetcode: "200",
  title: { en: "Number of Islands: Network Segments", he: "Number of Islands: סגמנטים ברשת" },
  statement: {
    en: `<p>A data-center floor map is a grid: <code>"1"</code> is a healthy switch, <code>"0"</code> is a failed switch or empty slot. Healthy switches are linked to their 4 direct neighbours (up/down/left/right). After a failure, count how many <strong>isolated network segments</strong> (connected groups of healthy switches) exist.</p>
<p>Grid can be up to 300×300 — avoid recursion-depth issues.</p>`,
    he: `<p>מפת קומה בדאטה סנטר היא grid: <code>"1"</code> הוא switch תקין, <code>"0"</code> הוא switch שנפל או מקום ריק. switches תקינים מחוברים ל-4 השכנים הישירים שלהם (למעלה/למטה/שמאלה/ימינה). אחרי תקלה, תספור כמה <strong>סגמנטים מבודדים</strong> ברשת (קבוצות מחוברות של switches תקינים) יש.</p>
<p>ה-grid יכול להגיע ל-300×300 – תימנע מבעיות של עומק רקורסיה.</p>`
  },
  examples: `Input:
grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"],
]
Output: 3

Input: grid = [["1","0","1"]]
Output: 2`,
  hints: [
    { en: "Each segment is a connected component in a graph whose nodes are '1' cells.", he: "כל סגמנט הוא connected component בגרף שה-nodes שלו הם תאי '1'." },
    { en: "Scan the grid; every time you find an unvisited '1', that's a new segment — flood-fill it so you don't count it again.", he: "סורקים את ה-grid; בכל פעם שמוצאים '1' שלא ביקרנו בו, זה סגמנט חדש – עושים לו flood-fill כדי לא לספור שוב." },
    { en: "Use an explicit queue (BFS) instead of recursion: a 300×300 snake would blow Python's recursion limit.", he: "תשתמש בתור מפורש (BFS) במקום רקורסיה: נחש של 300×300 יפוצץ את ה-recursion limit של פייתון." }
  ],
  solution: String.raw`from collections import deque
from typing import List


def count_segments(grid: List[List[str]]) -> int:
    """Count 4-connected components of '1' cells using iterative BFS."""
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    segments = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or seen[r][c]:
                continue
            segments += 1                     # found a new segment: flood it
            seen[r][c] = True
            q = deque([(r, c)])
            while q:
                cr, cc = q.popleft()
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols \
                            and grid[nr][nc] == "1" and not seen[nr][nc]:
                        seen[nr][nc] = True   # mark when enqueued, not when popped
                        q.append((nr, nc))
    return segments


if __name__ == "__main__":
    grid = [
        ["1", "1", "0", "0", "0"],
        ["1", "1", "0", "0", "0"],
        ["0", "0", "1", "0", "0"],
        ["0", "0", "0", "1", "1"],
    ]
    print(count_segments(grid))             # 3
    print(count_segments([["1", "0", "1"]]))  # 2
`,
  explain: {
    en: `<p>Counting connected components = "start a search from every node not yet visited, and count how many searches you start". Each BFS marks an entire segment as seen, so the outer loop only triggers once per segment.</p>
<p>Two details interviewers watch for: mark a cell as seen <strong>when you enqueue it</strong> (marking on pop lets the same cell enter the queue several times), and prefer iterative BFS/DFS over recursion in Python. We use a separate <code>seen</code> matrix so the input isn't mutated; flipping visited cells to <code>"0"</code> in place is an O(1)-extra-space alternative if mutation is allowed.</p>`,
    he: `<p>ספירת connected components = "מתחילים חיפוש מכל node שעוד לא ביקרנו בו, וסופרים כמה חיפושים התחלנו". כל BFS מסמן סגמנט שלם כ-seen, כך שהלולאה החיצונית מופעלת פעם אחת לכל סגמנט.</p>
<p>שני פרטים שמראיינים שמים לב אליהם: לסמן תא כ-seen <strong>כשמכניסים אותו לתור</strong> (סימון ביציאה מאפשר לאותו תא להיכנס לתור כמה פעמים), ולהעדיף BFS/DFS איטרטיבי על פני רקורסיה בפייתון. משתמשים במטריצת <code>seen</code> נפרדת כדי לא לשנות את ה-input; אם מותר לשנות, להפוך תאים ל-<code>"0"</code> במקום זו אלטרנטיבה עם O(1) זיכרון נוסף.</p>`
  },
  complexity: "Time O(rows × cols), Space O(rows × cols)",
  whyInfra: {
    en: "Detecting network partitions is connected components: after a link or switch failure, which hosts can still reach each other? Cluster managers and consensus systems (etcd/Raft, Kafka, Elasticsearch) must notice split-brain, and SDN controllers and BGP route computation reason about graph connectivity. Union-Find is used when links come and go dynamically.",
    he: "זיהוי network partitions זה connected components: אחרי שלינק או switch נופל, אילו hosts עדיין רואים אחד את השני? מנהלי cluster ומערכות consensus (etcd/Raft, Kafka, Elasticsearch) חייבים לזהות split-brain, ובקרי SDN וחישובי route ב-BGP חושבים על קישוריות בגרף. Union-Find משמש כשלינקים עולים ונופלים דינמית."
  },
  followUps: [
    { q: { en: "Input is a list of hosts and links, and links keep failing/recovering. Count partitions after each change.", he: "ה-input הוא רשימת hosts ולינקים, ולינקים כל הזמן נופלים ועולים. תספור partitions אחרי כל שינוי." },
      a: { en: "For links only being added, Union-Find with path compression + union by rank: start with n components and decrement on every successful union (near O(1) per op, LeetCode 323/305). Deletions are harder: recompute, or process changes offline in reverse as additions.", he: "אם רק מוסיפים לינקים – Union-Find עם path compression + union by rank: מתחילים עם n רכיבים ומורידים 1 בכל union מוצלח (כמעט O(1) לפעולה, LeetCode 323/305). מחיקות קשות יותר: מחשבים מחדש, או מעבדים את השינויים offline בסדר הפוך כהוספות." } },
    { q: { en: "Which segment is the 'majority' that should keep serving writes?", he: "איזה סגמנט הוא ה'רוב' שצריך להמשיך לקבל writes?" },
      a: { en: "Track component sizes during BFS (or in Union-Find). Only a component holding a strict majority of voting members (quorum, e.g. 3 of 5 etcd nodes) may elect a leader; the others must stop accepting writes to avoid split-brain.", he: "סופרים גודל לכל רכיב בזמן ה-BFS (או ב-Union-Find). רק רכיב שמחזיק רוב מוחלט של חברים מצביעים (quorum, למשל 3 מתוך 5 nodes של etcd) יכול לבחור leader; האחרים חייבים להפסיק לקבל writes כדי למנוע split-brain." } }
  ]
});

INFRA.problems.push({
  id: "time-based-kv-store",
  icon: "🕰️",
  difficulty: "medium",
  tags: ["hashmap", "binary-search", "design"],
  leetcode: "981",
  title: { en: "Time-Based Config Store", he: "Config Store מבוסס זמן" },
  statement: {
    en: `<p>Build a versioned config store:</p>
<ul>
<li><code>set(key, value, ts)</code> stores a new version of <code>key</code> at time <code>ts</code>. For each key, <code>ts</code> values of <code>set</code> are strictly increasing.</li>
<li><code>get(key, ts)</code> returns the value that was active at time <code>ts</code>: the version with the largest timestamp <code>&lt;= ts</code>, or <code>""</code> if none.</li>
</ul>`,
    he: `<p>תבנה config store עם גרסאות:</p>
<ul>
<li><code>set(key, value, ts)</code> שומר גרסה חדשה של <code>key</code> בזמן <code>ts</code>. לכל key, ה-<code>ts</code> של קריאות <code>set</code> עולים ממש.</li>
<li><code>get(key, ts)</code> מחזיר את הערך שהיה פעיל בזמן <code>ts</code>: הגרסה עם ה-timestamp הגדול ביותר שהוא <code>&lt;= ts</code>, או <code>""</code> אם אין.</li>
</ul>`
  },
  examples: `store = TimeMap()
store.set("feature_flag", "off", 1)
store.get("feature_flag", 1)  -> "off"
store.get("feature_flag", 3)  -> "off"
store.set("feature_flag", "on", 4)
store.get("feature_flag", 4)  -> "on"
store.get("feature_flag", 5)  -> "on"
store.get("feature_flag", 0)  -> ""
store.get("missing", 10)      -> ""`,
  hints: [
    { en: "Per key, the timestamps arrive sorted for free because sets are strictly increasing.", he: "לכל key, ה-timestamps מגיעים ממוינים בחינם כי ה-sets עולים ממש." },
    { en: "'Largest timestamp <= ts' is a binary search problem.", he: "'ה-timestamp הגדול ביותר <= ts' זו בעיית binary search." },
    { en: "bisect_right(times, ts) - 1 gives the index of the last version not after ts (or -1).", he: "bisect_right(times, ts) - 1 נותן את האינדקס של הגרסה האחרונה שלא אחרי ts (או -1)." }
  ],
  solution: String.raw`import bisect
from collections import defaultdict


class TimeMap:
    """key -> parallel sorted lists of timestamps and values."""

    def __init__(self):
        self.times = defaultdict(list)
        self.values = defaultdict(list)

    def set(self, key: str, value: str, ts: int) -> None:
        # timestamps per key are strictly increasing, so append keeps them sorted
        self.times[key].append(ts)
        self.values[key].append(value)

    def get(self, key: str, ts: int) -> str:
        times = self.times.get(key)
        if not times:
            return ""
        i = bisect.bisect_right(times, ts) - 1   # last index with times[i] <= ts
        return self.values[key][i] if i >= 0 else ""


if __name__ == "__main__":
    s = TimeMap()
    s.set("feature_flag", "off", 1)
    print(s.get("feature_flag", 1), s.get("feature_flag", 3))   # off off
    s.set("feature_flag", "on", 4)
    print(s.get("feature_flag", 4), s.get("feature_flag", 5))   # on on
    print(repr(s.get("feature_flag", 0)), repr(s.get("missing", 10)))  # '' ''
`,
  explain: {
    en: `<p>We need two lookups: by key (hashmap) and by time within a key (ordered search). Because timestamps per key only grow, appending keeps each list sorted, so <code>set</code> is O(1).</p>
<p>For <code>get</code>, <code>bisect_right(times, ts)</code> returns the insertion point after all timestamps <code>&lt;= ts</code>; subtracting one gives the latest version active at <code>ts</code>. If that is <code>-1</code>, the key did not exist yet. Two parallel lists keep the binary search on plain integers (fast and simple); a list of tuples also works.</p>`,
    he: `<p>צריך שני lookups: לפי key (hashmap) ולפי זמן בתוך key (חיפוש ממוין). מכיוון שה-timestamps לכל key רק עולים, append שומר כל רשימה ממוינת, ולכן <code>set</code> הוא O(1).</p>
<p>ב-<code>get</code>, <code>bisect_right(times, ts)</code> מחזיר את נקודת ההכנסה אחרי כל ה-timestamps שהם <code>&lt;= ts</code>; מינוס אחד נותן את הגרסה האחרונה שהייתה פעילה ב-<code>ts</code>. אם יוצא <code>-1</code>, המפתח עוד לא היה קיים. שתי רשימות מקבילות משאירות את ה-binary search על מספרים פשוטים (מהיר ופשוט); גם רשימה של tuples עובדת.</p>`
  },
  complexity: "set O(1), get O(log v) where v = versions of that key; Space O(total sets)",
  whyInfra: {
    en: "\"What was the config at 03:12 when the incident started?\" is a point-in-time lookup. etcd keeps a revision history (MVCC) and supports reads at a revision; Consul/ZooKeeper, S3 object versioning, feature-flag audit logs and Prometheus TSDB (find the sample at or before t) all do this exact search.",
    he: "\"מה היה הקונפיג ב-03:12 כשהאינצידנט התחיל?\" זה lookup לנקודת זמן. etcd שומר היסטוריית revisions (MVCC) ותומך בקריאה ב-revision מסוים; Consul/ZooKeeper, versioning של S3, audit logs של feature flags ו-Prometheus TSDB (למצוא את הדגימה ב-t או לפניו) – כולם עושים בדיוק את החיפוש הזה."
  },
  followUps: [
    { q: { en: "Timestamps can arrive out of order (late writes).", he: "ה-timestamps יכולים להגיע לא לפי הסדר (writes מאוחרים)." },
      a: { en: "Use bisect.insort to insert in sorted position (O(v) shift), or a balanced tree / sortedcontainers.SortedList for O(log v). Decide what happens on equal timestamps (last-writer-wins needs a tiebreaker such as a node id).", he: "משתמשים ב-bisect.insort כדי להכניס במקום הממוין (הזזה של O(v)), או בעץ מאוזן / sortedcontainers.SortedList בשביל O(log v). צריך להחליט מה קורה ב-timestamps שווים (last-writer-wins צריך tiebreaker כמו node id)." } },
    { q: { en: "History grows forever. How do you bound memory?", he: "ההיסטוריה גדלה לנצח. איך חוסמים את הזיכרון?" },
      a: { en: "Compaction: drop versions older than a retention window but keep the newest version before the cutoff so reads at the boundary still work — exactly what etcd compaction does (and why reads at a compacted revision fail).", he: "Compaction: זורקים גרסאות ישנות מחלון השמירה, אבל משאירים את הגרסה הכי חדשה לפני נקודת החיתוך כדי שקריאות בגבול עדיין יעבדו – בדיוק מה ש-compaction של etcd עושה (ולמה קריאה ב-revision שעבר compaction נכשלת)." } }
  ]
});

INFRA.problems.push({
  id: "min-meeting-rooms-servers",
  icon: "🖥️",
  difficulty: "medium",
  tags: ["intervals", "heap", "sorting"],
  leetcode: "253",
  title: { en: "Minimum Servers for Overlapping Jobs", he: "מינימום שרתים לג'ובים חופפים" },
  statement: {
    en: `<p>A batch system receives jobs as <code>[start, end)</code> intervals (end is exclusive: a job ending at 10 frees its server for a job starting at 10). Each server runs one job at a time. Return the <strong>minimum number of servers</strong> needed to run all jobs without delaying any.</p>`,
    he: `<p>מערכת batch מקבלת ג'ובים כ-intervals מסוג <code>[start, end)</code> (ה-end לא כלול: ג'וב שנגמר ב-10 משחרר את השרת לג'וב שמתחיל ב-10). כל שרת מריץ ג'וב אחד בכל רגע. תחזיר את <strong>מספר השרתים המינימלי</strong> שצריך כדי להריץ את כל הג'ובים בלי לעכב אף אחד.</p>`
  },
  examples: `Input:  jobs = [[0, 30], [5, 10], [15, 20]]
Output: 2

Input:  jobs = [[7, 10], [2, 4]]
Output: 1

Input:  jobs = [[1, 5], [5, 10], [2, 7], [3, 4]]
Output: 3      # at t=3: [1,5), [2,7), [3,4) overlap`,
  hints: [
    { en: "The answer is the maximum number of jobs running at the same instant.", he: "התשובה היא המספר המקסימלי של ג'ובים שרצים באותו רגע." },
    { en: "Process jobs by start time. Keep a min-heap of end times of servers currently busy.", he: "תעבור על הג'ובים לפי זמן התחלה. תחזיק min-heap של זמני סיום של השרתים שתפוסים כרגע." },
    { en: "If the earliest-ending server is free by this job's start (heap[0] <= start), reuse it; otherwise add a server. The heap size at the end is the answer.", he: "אם השרת שמסתיים הכי מוקדם פנוי עד תחילת הג'וב (heap[0] <= start), משתמשים בו שוב; אחרת מוסיפים שרת. גודל ה-heap בסוף הוא התשובה." }
  ],
  solution: String.raw`import heapq
from typing import List


def min_servers(jobs: List[List[int]]) -> int:
    """Minimum servers so that no two overlapping [start, end) jobs share one."""
    busy_until: List[int] = []                 # min-heap of end times, one per server
    for start, end in sorted(jobs):            # process in order of start time
        if busy_until and busy_until[0] <= start:
            heapq.heapreplace(busy_until, end) # reuse the server that frees up first
        else:
            heapq.heappush(busy_until, end)    # every server busy: add one
    return len(busy_until)


def min_servers_sweep(jobs: List[List[int]]) -> int:
    """Alternative: sweep line over +1/-1 events. Ends sort before starts at equal times."""
    events = []
    for start, end in jobs:
        events.append((start, 1))
        events.append((end, -1))
    events.sort()                              # (t, -1) comes before (t, 1)
    running = peak = 0
    for _, delta in events:
        running += delta
        peak = max(peak, running)
    return peak


if __name__ == "__main__":
    for jobs in ([[0, 30], [5, 10], [15, 20]], [[7, 10], [2, 4]], [[1, 5], [5, 10], [2, 7], [3, 4]]):
        print(min_servers(jobs), min_servers_sweep(jobs))   # 2 2 / 1 1 / 3 3
`,
  explain: {
    en: `<p>The minimum number of servers equals the peak concurrency. Sort jobs by start; the heap holds, for each server in use, the time it becomes free. For each job, the server freeing up earliest is <code>heap[0]</code>. If it's free by the job's start, reuse it (replace its end time). Otherwise all servers are busy and we must add one. The heap never shrinks, so its final size is the number of servers ever needed.</p>
<p>The sweep-line alternative turns every job into a +1 at start and -1 at end, sorts the events, and tracks the running sum. Sorting <code>(t, -1)</code> before <code>(t, 1)</code> implements the exclusive end. Both are O(n log n); the sweep is easy to extend to "how many servers at each moment" (a capacity graph).</p>`,
    he: `<p>מספר השרתים המינימלי שווה ל-concurrency בשיא. ממיינים את הג'ובים לפי start; ה-heap מחזיק, לכל שרת בשימוש, את הזמן שבו הוא מתפנה. לכל ג'וב, השרת שמתפנה הכי מוקדם הוא <code>heap[0]</code>. אם הוא פנוי עד ה-start של הג'וב, משתמשים בו שוב (מחליפים את זמן הסיום שלו). אחרת כל השרתים תפוסים וצריך להוסיף אחד. ה-heap אף פעם לא קטן, ולכן הגודל הסופי שלו הוא מספר השרתים שהיה צריך.</p>
<p>האלטרנטיבה של sweep line הופכת כל ג'וב ל-+1 ב-start ו-1- ב-end, ממיינת את האירועים ועוקבת אחרי הסכום הרץ. מיון של <code>(t, -1)</code> לפני <code>(t, 1)</code> מממש את ה-end הלא כלול. שתיהן O(n log n); ה-sweep קל להרחבה ל"כמה שרתים צריך בכל רגע" (גרף capacity).</p>`
  },
  complexity: "Time O(n log n), Space O(n)",
  whyInfra: {
    en: "Capacity planning is peak concurrency: how many runners does the CI fleet need for the nightly builds, how many nodes for the Kubernetes CronJobs at midnight, how many DB connections at peak? Schedulers (K8s, Nomad, YARN) and autoscalers reason about overlapping reservations the same way.",
    he: "תכנון capacity זה concurrency בשיא: כמה runners צריך ב-CI בשביל ה-builds הליליים, כמה nodes בשביל ה-CronJobs בקוברנטיס בחצות, כמה חיבורי DB בשיא? schedulers (K8s, Nomad, YARN) ו-autoscalers חושבים על הזמנות חופפות בדיוק ככה."
  },
  followUps: [
    { q: { en: "Jobs have different CPU requests and servers have 8 cores. Still the same?", he: "לג'ובים יש CPU requests שונים ולשרתים יש 8 cores. עדיין אותו דבר?" },
      a: { en: "No — it becomes bin packing over time, which is NP-hard. Use heuristics like first-fit decreasing / best-fit, which is roughly what the Kubernetes scheduler's scoring does. The sweep still gives a lower bound: ceil(peak total CPU / 8).", he: "לא – זה הופך ל-bin packing לאורך זמן, שזה NP-hard. משתמשים בהיוריסטיקות כמו first-fit decreasing / best-fit, בערך מה שה-scoring של ה-scheduler בקוברנטיס עושה. ה-sweep עדיין נותן חסם תחתון: ceil(סך ה-CPU בשיא / 8)." } },
    { q: { en: "Return which server each job runs on.", he: "תחזיר על איזה שרת רץ כל ג'וב." },
      a: { en: "Store (end_time, server_id) in the heap and keep the original job index when sorting; when reusing, assign the popped server_id; when adding, use a new id.", he: "שומרים (end_time, server_id) ב-heap ואת האינדקס המקורי של הג'וב במיון; כשמשתמשים שוב – מקצים את ה-server_id שיצא; כשמוסיפים – id חדש." } }
  ]
});

/* ------------------------------------------------------------------ */
/* HARD                                                                */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "lfu-cache",
  icon: "🧊",
  difficulty: "hard",
  tags: ["hashmap", "linked-list", "design"],
  leetcode: "460",
  title: { en: "LFU Cache", he: "LFU Cache" },
  statement: {
    en: `<p>Design a cache with a fixed <code>capacity</code> that evicts the <strong>least frequently used</strong> key when full. If several keys share the lowest frequency, evict the <em>least recently used</em> among them.</p>
<ul>
<li><code>get(key)</code> returns the value or <code>-1</code>; a hit increments the key's use count.</li>
<li><code>put(key, value)</code> inserts or updates (an update also counts as a use). A new key starts with count 1.</li>
</ul>
<p>Both operations in <strong>O(1)</strong>.</p>`,
    he: `<p>תתכנן cache עם <code>capacity</code> קבוע שמפנה את המפתח <strong>שהשתמשו בו הכי מעט פעמים</strong> (least frequently used) כשהוא מלא. אם לכמה מפתחות יש את התדירות הנמוכה ביותר, מפנים את ה-<em>least recently used</em> מביניהם.</p>
<ul>
<li><code>get(key)</code> מחזיר את הערך או <code>-1</code>; hit מעלה את מונה השימוש של המפתח.</li>
<li><code>put(key, value)</code> מכניס או מעדכן (עדכון נחשב גם הוא שימוש). מפתח חדש מתחיל עם מונה 1.</li>
</ul>
<p>שתי הפעולות ב-<strong>O(1)</strong>.</p>`
  },
  examples: `c = LFUCache(2)
c.put(1, 1); c.put(2, 2)
c.get(1)    -> 1       # freq: 1->2, 2->1
c.put(3, 3)            # evicts key 2 (lowest freq)
c.get(2)    -> -1
c.get(3)    -> 3       # freq: 1->2, 3->2
c.put(4, 4)            # tie at freq 2: evict LRU among them = key 1
c.get(1)    -> -1
c.get(3)    -> 3
c.get(4)    -> 4`,
  hints: [
    { en: "A min-heap by frequency gives O(log n). For O(1), group keys into buckets by frequency.", he: "min-heap לפי תדירות נותן O(log n). בשביל O(1), תקבץ מפתחות ל-buckets לפי תדירות." },
    { en: "Each bucket must remember recency order: freq -> OrderedDict of keys (oldest first).", he: "כל bucket צריך לזכור סדר עדכניות: freq -> OrderedDict של מפתחות (הישן ראשון)." },
    { en: "Track min_freq. It only changes in two ways: reset to 1 on insert, or +1 when the min bucket empties after a touch.", he: "תעקוב אחרי min_freq. הוא משתנה רק בשתי דרכים: מתאפס ל-1 בהכנסה, או עולה ב-1 כשה-bucket המינימלי מתרוקן אחרי שימוש." }
  ],
  solution: String.raw`from collections import OrderedDict, defaultdict


class LFUCache:
    """O(1) LFU with LRU tie-breaking.

    key_info: key -> [value, freq]
    buckets:  freq -> OrderedDict of keys, least recently used first
    """

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.key_info = {}
        self.buckets = defaultdict(OrderedDict)
        self.min_freq = 0

    def _touch(self, key: int) -> None:
        """Move key from its frequency bucket to freq + 1."""
        value, freq = self.key_info[key]
        bucket = self.buckets[freq]
        del bucket[key]
        if not bucket:
            del self.buckets[freq]
            if self.min_freq == freq:
                self.min_freq = freq + 1     # the key we moved is now the minimum
        self.key_info[key][1] = freq + 1
        self.buckets[freq + 1][key] = None   # appended = most recent in that bucket

    def get(self, key: int) -> int:
        if key not in self.key_info:
            return -1
        self._touch(key)
        return self.key_info[key][0]

    def put(self, key: int, value: int) -> None:
        if self.capacity <= 0:
            return
        if key in self.key_info:
            self.key_info[key][0] = value
            self._touch(key)
            return
        if len(self.key_info) == self.capacity:
            # evict LRU key of the lowest-frequency bucket
            victim, _ = self.buckets[self.min_freq].popitem(last=False)
            if not self.buckets[self.min_freq]:
                del self.buckets[self.min_freq]
            del self.key_info[victim]
        self.key_info[key] = [value, 1]
        self.buckets[1][key] = None
        self.min_freq = 1                    # a brand-new key always has the lowest freq


if __name__ == "__main__":
    c = LFUCache(2)
    c.put(1, 1); c.put(2, 2)
    print(c.get(1))             # 1
    c.put(3, 3)
    print(c.get(2), c.get(3))   # -1 3
    c.put(4, 4)
    print(c.get(1), c.get(3), c.get(4))  # -1 3 4
`,
  explain: {
    en: `<p>LFU needs to find "the smallest frequency, and within it the oldest key" in O(1). We keep <strong>one LRU list per frequency</strong> (<code>buckets[freq]</code>, an <code>OrderedDict</code> used as a linked list) plus <code>min_freq</code>.</p>
<p><code>_touch</code> moves a key from bucket <code>f</code> to <code>f+1</code>, appending it as most recent. If bucket <code>f</code> becomes empty and it was the minimum, the minimum must now be <code>f+1</code> — the key we just moved lives there. On insert of a new key, <code>min_freq</code> becomes 1. Eviction pops the oldest key from <code>buckets[min_freq]</code>. Every step is a dict operation, so everything is O(1).</p>
<p>Walk the example: after <code>get(1)</code>, key 1 is in bucket 2, key 2 in bucket 1, so <code>put(3)</code> evicts 2. After <code>get(3)</code>, keys 1 and 3 are both in bucket 2 with 1 older, so <code>put(4)</code> evicts 1.</p>`,
    he: `<p>LFU צריך למצוא "את התדירות הכי נמוכה, ובתוכה את המפתח הכי ישן" ב-O(1). מחזיקים <strong>רשימת LRU אחת לכל תדירות</strong> (<code>buckets[freq]</code>, <code>OrderedDict</code> שמשמש כ-linked list) ועוד <code>min_freq</code>.</p>
<p><code>_touch</code> מעביר מפתח מ-bucket <code>f</code> ל-<code>f+1</code> ומוסיף אותו כהכי עדכני. אם ה-bucket <code>f</code> התרוקן והוא היה המינימום, המינימום עכשיו חייב להיות <code>f+1</code> – המפתח שהעברנו נמצא שם. בהכנסה של מפתח חדש, <code>min_freq</code> הופך ל-1. פינוי מוציא את המפתח הכי ישן מ-<code>buckets[min_freq]</code>. כל צעד הוא פעולת dict, ולכן הכל O(1).</p>
<p>מעבר על הדוגמה: אחרי <code>get(1)</code>, מפתח 1 ב-bucket 2 ומפתח 2 ב-bucket 1, אז <code>put(3)</code> מפנה את 2. אחרי <code>get(3)</code>, מפתחות 1 ו-3 שניהם ב-bucket 2 ו-1 ישן יותר, אז <code>put(4)</code> מפנה את 1.</p>`
  },
  complexity: "Time O(1) per get/put, Space O(capacity)",
  whyInfra: {
    en: "LFU protects caches from scans: one big batch job reading every key once would flush an LRU cache, but barely affects LFU. Redis offers allkeys-lfu (an approximate Morris counter with decay), Caffeine/Ristretto use TinyLFU admission, and CDNs use frequency-aware eviction for hot objects.",
    he: "LFU מגן על caches מפני scans: ג'וב batch גדול שקורא כל מפתח פעם אחת ישטוף LRU cache, אבל כמעט לא ישפיע על LFU. Redis מציע allkeys-lfu (מונה Morris משוער עם decay), Caffeine/Ristretto משתמשים ב-TinyLFU admission, ו-CDNs משתמשים בפינוי שמודע לתדירות בשביל אובייקטים חמים."
  },
  followUps: [
    { q: { en: "A key was hot last week and is never used now, but its count is huge. Problem?", he: "מפתח היה חם בשבוע שעבר ועכשיו לא בשימוש בכלל, אבל המונה שלו ענק. בעיה?" },
      a: { en: "Yes — cache pollution. Add aging/decay: periodically halve all counts (TinyLFU reset), or decay by elapsed time as Redis lfu-decay-time does. Hybrid policies like W-TinyLFU or ARC balance recency and frequency.", he: "כן – cache pollution. מוסיפים aging/decay: מחלקים את כל המונים ב-2 מדי פעם (reset של TinyLFU), או decay לפי זמן שעבר כמו lfu-decay-time ב-Redis. מדיניות היברידית כמו W-TinyLFU או ARC מאזנת בין עדכניות לתדירות." } },
    { q: { en: "Why not just use a heap keyed by (freq, last_used)?", he: "למה לא פשוט heap לפי (freq, last_used)?" },
      a: { en: "It works in O(log n), but updating a key's priority inside a heap requires an index map or lazy deletion. The bucket design is O(1) and simpler to reason about once explained.", he: "זה עובד ב-O(log n), אבל עדכון עדיפות של מפתח בתוך heap דורש מפת אינדקסים או lazy deletion. העיצוב עם buckets הוא O(1) ופשוט יותר להבנה אחרי שמסבירים אותו." } }
  ]
});

INFRA.problems.push({
  id: "median-from-stream",
  icon: "⚖️",
  difficulty: "hard",
  tags: ["heap", "stream", "design"],
  leetcode: "295",
  title: { en: "Live Latency Median", he: "Median חי של latency" },
  statement: {
    en: `<p>Implement <code>MedianFinder</code> for a live latency dashboard:</p>
<ul>
<li><code>add(ms)</code> adds a latency sample.</li>
<li><code>median()</code> returns the median of all samples so far (average of the two middle values for an even count).</li>
</ul>
<p><code>add</code> should be O(log n) and <code>median</code> O(1).</p>`,
    he: `<p>תממש <code>MedianFinder</code> בשביל דשבורד latency חי:</p>
<ul>
<li><code>add(ms)</code> מוסיף דגימת latency.</li>
<li><code>median()</code> מחזיר את ה-median של כל הדגימות עד עכשיו (ממוצע של שני האמצעיים כשהכמות זוגית).</li>
</ul>
<p><code>add</code> צריך להיות O(log n) ו-<code>median</code> O(1).</p>`
  },
  examples: `mf = MedianFinder()
mf.add(40); mf.add(10)
mf.median() -> 25.0
mf.add(30)
mf.median() -> 30
mf.add(500)                # an outlier barely moves the median
mf.median() -> 35.0`,
  hints: [
    { en: "Split the samples into a lower half and an upper half. The median lives at the boundary.", he: "תחלק את הדגימות לחצי תחתון וחצי עליון. ה-median נמצא בגבול ביניהם." },
    { en: "Lower half: max-heap (store negatives in heapq). Upper half: min-heap. Their tops are the middle values.", he: "חצי תחתון: max-heap (שומרים מספרים שליליים ב-heapq). חצי עליון: min-heap. הראשים שלהם הם הערכים האמצעיים." },
    { en: "Invariant: every lower value <= every upper value, and len(lower) is len(upper) or len(upper) + 1. Rebalance after each add.", he: "Invariant: כל ערך תחתון <= כל ערך עליון, ו-len(lower) שווה ל-len(upper) או len(upper) + 1. מאזנים אחרי כל add." }
  ],
  solution: String.raw`import heapq


class MedianFinder:
    def __init__(self):
        self.lower = []   # max-heap via negated values: the smaller half
        self.upper = []   # min-heap: the larger half

    def add(self, value: float) -> None:
        # 1) push through lower so the largest of the small half moves up
        heapq.heappush(self.lower, -value)
        heapq.heappush(self.upper, -heapq.heappop(self.lower))
        # 2) keep lower the same size as upper or one bigger
        if len(self.upper) > len(self.lower):
            heapq.heappush(self.lower, -heapq.heappop(self.upper))

    def median(self) -> float:
        if not self.lower:
            raise ValueError("no samples yet")
        if len(self.lower) > len(self.upper):
            return -self.lower[0]
        return (-self.lower[0] + self.upper[0]) / 2


if __name__ == "__main__":
    mf = MedianFinder()
    mf.add(40); mf.add(10)
    print(mf.median())   # 25.0
    mf.add(30)
    print(mf.median())   # 30
    mf.add(500)
    print(mf.median())   # 35.0
`,
  explain: {
    en: `<p>The median only depends on the one or two values in the middle. Two heaps keep exactly those at their tops: <code>lower</code> (max-heap) holds the smaller half, <code>upper</code> (min-heap) the larger half.</p>
<p>Each <code>add</code> first pushes into <code>lower</code> and immediately moves <code>lower</code>'s max into <code>upper</code>. That guarantees the ordering invariant (nothing in lower is bigger than anything in upper) without any comparisons of our own. Then, if <code>upper</code> got bigger, move its min back. With an odd count the median is <code>lower</code>'s top; with an even count it's the average of both tops. Each add does a constant number of heap operations: O(log n).</p>`,
    he: `<p>ה-median תלוי רק בערך אחד או שניים באמצע. שני heaps מחזיקים בדיוק אותם בראש: <code>lower</code> (max-heap) מחזיק את החצי הקטן, <code>upper</code> (min-heap) את החצי הגדול.</p>
<p>כל <code>add</code> קודם דוחף ל-<code>lower</code> ומיד מעביר את המקסימום של <code>lower</code> ל-<code>upper</code>. זה מבטיח את ה-invariant של הסדר (שום דבר ב-lower לא גדול מכלום ב-upper) בלי שנצטרך להשוות בעצמנו. אחר כך, אם <code>upper</code> גדל יותר, מחזירים את המינימום שלו. בכמות אי-זוגית ה-median הוא הראש של <code>lower</code>; בזוגית – הממוצע של שני הראשים. כל add עושה מספר קבוע של פעולות heap: O(log n).</p>`
  },
  complexity: "add O(log n), median O(1), Space O(n)",
  whyInfra: {
    en: "Median (p50) latency is the 'typical user' signal on every dashboard and is robust to outliers, unlike the mean. Load balancers like Envoy's least-request / EWMA and adaptive concurrency limiters track running latency statistics; Netflix's concurrency-limits library uses latency gradients over moving windows.",
    he: "Median (p50) של latency הוא האות של 'המשתמש הטיפוסי' בכל דשבורד, והוא עמיד ל-outliers, בניגוד לממוצע. Load balancers כמו least-request / EWMA ב-Envoy ו-adaptive concurrency limiters עוקבים אחרי סטטיסטיקות latency רצות; ספריית concurrency-limits של Netflix משתמשת בגרדיאנטים של latency על חלונות נעים."
  },
  followUps: [
    { q: { en: "Median of only the last 1,000 samples (sliding window)?", he: "Median רק של 1,000 הדגימות האחרונות (sliding window)?" },
      a: { en: "You must remove arbitrary old values. Use lazy deletion (a 'to delete' counter per value, pruned when it reaches a heap top) or a sorted list (sortedcontainers) with O(log n) insert/remove — LeetCode 480.", he: "צריך להסיר ערכים ישנים שרירותיים. משתמשים ב-lazy deletion (מונה 'למחיקה' לכל ערך, שמנוקה כשהוא מגיע לראש heap) או ברשימה ממוינת (sortedcontainers) עם insert/remove ב-O(log n) – LeetCode 480." } },
    { q: { en: "Latencies are integers 0-10,000 ms. Can you do better?", he: "ה-latencies הם מספרים שלמים 0-10,000 ms. אפשר יותר טוב?" },
      a: { en: "Yes — a counting histogram of 10,001 buckets: add is O(1), median is a scan (or O(log B) with a Fenwick tree). This is how HDR Histogram / Prometheus-style buckets trade exactness for constant memory.", he: "כן – histogram של ספירות עם 10,001 buckets: add ב-O(1), ו-median זו סריקה (או O(log B) עם Fenwick tree). ככה HDR Histogram ו-buckets בסגנון Prometheus מחליפים דיוק בזיכרון קבוע." } }
  ]
});

INFRA.problems.push({
  id: "network-delay-time",
  icon: "📡",
  difficulty: "hard",
  tags: ["graph", "dijkstra", "heap", "shortest-path"],
  leetcode: "743",
  title: { en: "Config Propagation Time (Dijkstra)", he: "זמן הפצת קונפיג (Dijkstra)" },
  statement: {
    en: `<p>A cluster has <code>n</code> nodes labelled <code>1..n</code>. A config change is pushed to node <code>k</code>, and nodes forward it over directed links <code>times[i] = (u, v, w)</code>: it takes <code>w</code> ms for the update to travel from <code>u</code> to <code>v</code>. Return the time until <strong>all</strong> nodes have the new config, or <code>-1</code> if some node can never receive it.</p>`,
    he: `<p>ב-cluster יש <code>n</code> nodes שממוספרים <code>1..n</code>. שינוי קונפיג נדחף ל-node <code>k</code>, וה-nodes מעבירים אותו הלאה על לינקים מכוונים <code>times[i] = (u, v, w)</code>: לוקח <code>w</code> ms לעדכון לעבור מ-<code>u</code> ל-<code>v</code>. תחזיר את הזמן עד ש<strong>כל</strong> ה-nodes מקבלים את הקונפיג החדש, או <code>-1</code> אם יש node שלא יקבל אותו אף פעם.</p>`
  },
  examples: `Input:  times = [(2, 1, 1), (2, 3, 1), (3, 4, 1)], n = 4, k = 2
Output: 2

Input:  times = [(1, 2, 1)], n = 2, k = 2
Output: -1     # nothing flows from node 2 back to node 1

Input:  times = [(1, 2, 10), (1, 3, 1), (3, 2, 2)], n = 3, k = 1
Output: 3      # 1 -> 3 -> 2 (1 + 2) beats the direct 10 ms link`,
  hints: [
    { en: "Each node receives the config at its shortest-path distance from k. The answer is the maximum of those distances.", he: "כל node מקבל את הקונפיג במרחק המסלול הקצר ביותר שלו מ-k. התשובה היא המקסימום של המרחקים האלה." },
    { en: "Weights are non-negative: use Dijkstra with a min-heap of (distance, node).", he: "המשקלים אי-שליליים: Dijkstra עם min-heap של (distance, node)." },
    { en: "Skip stale heap entries (a node popped again with a larger distance). If fewer than n nodes are reached, return -1.", he: "תדלג על רשומות ישנות ב-heap (node שיוצא שוב עם מרחק גדול יותר). אם הגעת לפחות מ-n nodes, תחזיר -1." }
  ],
  solution: String.raw`import heapq
from collections import defaultdict
from typing import List, Tuple


def propagation_time(times: List[Tuple[int, int, int]], n: int, k: int) -> int:
    """Dijkstra from k; answer = max shortest distance, or -1 if unreachable."""
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))

    dist = {}                       # finalised shortest distances
    heap = [(0, k)]
    while heap:
        d, node = heapq.heappop(heap)
        if node in dist:            # stale entry: already finalised with a smaller d
            continue
        dist[node] = d
        for nxt, w in graph[node]:
            if nxt not in dist:
                heapq.heappush(heap, (d + w, nxt))

    if len(dist) < n:
        return -1                   # some node never receives the config
    return max(dist.values())


if __name__ == "__main__":
    print(propagation_time([(2, 1, 1), (2, 3, 1), (3, 4, 1)], 4, 2))      # 2
    print(propagation_time([(1, 2, 1)], 2, 2))                            # -1
    print(propagation_time([(1, 2, 10), (1, 3, 1), (3, 2, 2)], 3, 1))     # 3
`,
  explain: {
    en: `<p>The update spreads along all links in parallel, so each node gets it at the earliest possible moment = its <strong>shortest-path distance</strong> from <code>k</code>. The cluster is consistent when the slowest node gets it: <code>max(dist)</code>.</p>
<p>Dijkstra pops nodes in increasing order of distance. The first time a node is popped, its distance is final (non-negative weights mean no later path can be shorter). We use "lazy" Dijkstra: instead of decrease-key, we push duplicates and skip any node already in <code>dist</code>. In the third example node 2 is pushed with 10 and later with 3; it is popped first with 3, and the 10 entry is ignored.</p>
<p>If <code>dist</code> has fewer than <code>n</code> entries, part of the cluster is unreachable — in real life, a partition or a missing route.</p>`,
    he: `<p>העדכון מתפשט על כל הלינקים במקביל, אז כל node מקבל אותו ברגע המוקדם ביותר האפשרי = <strong>מרחק המסלול הקצר ביותר</strong> שלו מ-<code>k</code>. ה-cluster עקבי כשה-node האיטי ביותר מקבל אותו: <code>max(dist)</code>.</p>
<p>Dijkstra מוציא nodes לפי סדר עולה של מרחק. בפעם הראשונה ש-node יוצא, המרחק שלו סופי (משקלים אי-שליליים אומרים שאף מסלול מאוחר יותר לא יהיה קצר יותר). משתמשים ב-Dijkstra "עצלן": במקום decrease-key דוחפים כפילויות ומדלגים על כל node שכבר ב-<code>dist</code>. בדוגמה השלישית node 2 נדחף עם 10 ואחר כך עם 3; הוא יוצא קודם עם 3, והרשומה של 10 מתעלמים ממנה.</p>
<p>אם ב-<code>dist</code> יש פחות מ-<code>n</code> רשומות, חלק מה-cluster לא נגיש – במציאות, partition או route חסר.</p>`
  },
  complexity: "Time O(E log E), Space O(V + E)",
  whyInfra: {
    en: "OSPF and IS-IS routers literally run Dijkstra (SPF) to build routing tables. Gossip protocols (Consul/Serf, Cassandra) and config pushes (Envoy xDS fan-out, CDN purges) care about time-to-converge = the slowest shortest path. Service meshes use latency-weighted paths for routing decisions.",
    he: "ראוטרים עם OSPF ו-IS-IS ממש מריצים Dijkstra (SPF) כדי לבנות routing tables. פרוטוקולי gossip (Consul/Serf, Cassandra) ודחיפות קונפיג (fan-out של Envoy xDS, purge ב-CDN) מתעניינים ב-time-to-converge = המסלול הקצר ביותר האיטי ביותר. Service meshes משתמשים במסלולים עם משקל latency להחלטות ניתוב."
  },
  followUps: [
    { q: { en: "Some links can have negative weight (credits). Does Dijkstra still work?", he: "לחלק מהלינקים יש משקל שלילי (קרדיטים). Dijkstra עדיין עובד?" },
      a: { en: "No — a finalised node could later be improved. Use Bellman-Ford (O(VE)), which also detects negative cycles. In networking, weights are delays/costs and always non-negative.", he: "לא – node שכבר נקבע יכול להשתפר אחר כך. משתמשים ב-Bellman-Ford (O(VE)), שגם מזהה מעגלים שליליים. ברשתות, משקלים הם delays/costs ותמיד אי-שליליים." } },
    { q: { en: "Each node forwards to at most 2 neighbours per round (gossip). How long until everyone has it?", he: "כל node מעביר לכל היותר ל-2 שכנים בכל סבב (gossip). כמה זמן עד שכולם מקבלים?" },
      a: { en: "With random fan-out, the infected set roughly multiplies each round, so convergence is O(log n) rounds — why gossip scales to thousands of nodes. Exact answers need simulation or BFS over rounds.", he: "עם fan-out אקראי, הקבוצה ה'נגועה' בערך מוכפלת כל סבב, אז ההתכנסות היא O(log n) סבבים – זו הסיבה ש-gossip מחזיק אלפי nodes. תשובה מדויקת דורשת סימולציה או BFS לפי סבבים." } }
  ]
});

INFRA.problems.push({
  id: "alien-dependency-resolver",
  icon: "👽",
  difficulty: "hard",
  tags: ["graph", "topological-sort", "dfs", "validation"],
  leetcode: "269",
  title: { en: "Package Lockfile Validator & Build Order", he: "Validator ל-lockfile וסדר build" },
  statement: {
    en: `<p>You are writing the core of a package manager's <code>install --frozen</code> step. Input:</p>
<ul>
<li><code>lock</code>: pinned versions, e.g. <code>{"web": "2.1.0", "api": "1.4.2", "log": "1.2.0"}</code>.</li>
<li><code>deps</code>: for each package, its requirements as <code>(dependency, min_version, max_version)</code>; <code>min</code> is inclusive, <code>max</code> exclusive, either may be <code>None</code>.</li>
</ul>
<p>Return <code>(order, errors)</code>:</p>
<ol>
<li><code>errors</code>: every missing dependency and every version-constraint violation (compare versions numerically: <code>1.10.0 &gt; 1.9.0</code>), plus a cycle as <code>"cycle: a -&gt; b -&gt; a"</code> if one exists.</li>
<li><code>order</code>: a build order where every package comes after its dependencies (alphabetical among independent ones), or <code>None</code> if there is a cycle.</li>
</ol>`,
    he: `<p>אתה כותב את הליבה של שלב <code>install --frozen</code> של package manager. ה-input:</p>
<ul>
<li><code>lock</code>: גרסאות נעולות, למשל <code>{"web": "2.1.0", "api": "1.4.2", "log": "1.2.0"}</code>.</li>
<li><code>deps</code>: לכל חבילה, הדרישות שלה בתור <code>(dependency, min_version, max_version)</code>; <code>min</code> כולל, <code>max</code> לא כולל, כל אחד מהם יכול להיות <code>None</code>.</li>
</ul>
<p>תחזיר <code>(order, errors)</code>:</p>
<ol>
<li><code>errors</code>: כל תלות חסרה וכל הפרה של אילוץ גרסה (משווים גרסאות מספרית: <code>1.10.0 &gt; 1.9.0</code>), ועוד מעגל בפורמט <code>"cycle: a -&gt; b -&gt; a"</code> אם יש.</li>
<li><code>order</code>: סדר build שבו כל חבילה באה אחרי התלויות שלה (לפי א"ב בין חבילות בלתי תלויות), או <code>None</code> אם יש מעגל.</li>
</ol>`
  },
  examples: `Input:
lock = {"web": "2.1.0", "api": "1.10.0", "log": "1.2.0", "db": "3.0.1"}
deps = {
  "web": [("api", "1.4.0", "2.0.0"), ("log", "1.0.0", None)],
  "api": [("db", "3.0.0", None), ("log", None, "1.2.0"), ("auth", None, None)],
}
Output:
(['db', 'log', 'api', 'web'],
 ['api needs log in [-, 1.2.0) but lock has 1.2.0',
  'api needs auth, which is not in the lockfile'])

Input:
lock = {"a": "1.0.0", "b": "1.0.0"}
deps = {"a": [("b", None, None)], "b": [("a", None, None)]}
Output: (None, ['cycle: a -> b -> a'])`,
  hints: [
    { en: "Split the problem: (1) validate each edge independently, (2) order the graph. Parse versions into int tuples so 1.10 > 1.9.", he: "תפרק את הבעיה: (1) לבדוק כל קשת בנפרד, (2) לסדר את הגרף. תפרסר גרסאות ל-tuple של ints כדי ש-1.10 > 1.9." },
    { en: "For the order, DFS post-order works: emit a package after all its dependencies are emitted.", he: "בשביל הסדר, DFS post-order עובד: מוציאים חבילה אחרי שכל התלויות שלה יצאו." },
    { en: "Three colours: white (unvisited), grey (on the current path), black (done). Reaching a grey node = cycle; keep a path stack to print it.", he: "שלושה צבעים: לבן (לא ביקרנו), אפור (על המסלול הנוכחי), שחור (סיימנו). הגעה ל-node אפור = מעגל; מחזיקים stack של המסלול כדי להדפיס אותו." }
  ],
  solution: String.raw`from typing import Dict, List, Optional, Tuple

Req = Tuple[str, Optional[str], Optional[str]]   # (dependency, min_incl, max_excl)


def parse_version(v: str) -> Tuple[int, ...]:
    return tuple(int(part) for part in v.split("."))


def resolve(lock: Dict[str, str],
            deps: Dict[str, List[Req]]) -> Tuple[Optional[List[str]], List[str]]:
    errors: List[str] = []

    # 1) validate every edge: missing packages and version ranges
    for pkg in sorted(deps):
        for dep, lo, hi in deps[pkg]:
            if dep not in lock:
                errors.append(f"{pkg} needs {dep}, which is not in the lockfile")
                continue
            have = parse_version(lock[dep])
            too_low = lo is not None and have < parse_version(lo)
            too_high = hi is not None and have >= parse_version(hi)
            if too_low or too_high:
                errors.append(f"{pkg} needs {dep} in [{lo or '-'}, {hi or '-'}) "
                              f"but lock has {lock[dep]}")

    # 2) DFS post-order topological sort with 3-colour cycle detection
    WHITE, GREY, BLACK = 0, 1, 2
    color = {p: WHITE for p in lock}
    order: List[str] = []
    path: List[str] = []

    def visit(node: str) -> Optional[List[str]]:
        color[node] = GREY
        path.append(node)
        for dep in sorted({d for d, _, _ in deps.get(node, [])}):
            if dep not in color:            # missing package, already reported
                continue
            if color[dep] == GREY:          # back edge -> cycle
                return path[path.index(dep):] + [dep]
            if color[dep] == WHITE:
                cycle = visit(dep)
                if cycle:
                    return cycle
        path.pop()
        color[node] = BLACK
        order.append(node)                  # all deps already in order
        return None

    for pkg in sorted(lock):
        if color[pkg] == WHITE:
            cycle = visit(pkg)
            if cycle:
                errors.append("cycle: " + " -> ".join(cycle))
                return None, errors
    return order, errors


if __name__ == "__main__":
    lock = {"web": "2.1.0", "api": "1.10.0", "log": "1.2.0", "db": "3.0.1"}
    deps = {
        "web": [("api", "1.4.0", "2.0.0"), ("log", "1.0.0", None)],
        "api": [("db", "3.0.0", None), ("log", None, "1.2.0"), ("auth", None, None)],
    }
    print(resolve(lock, deps))
    print(resolve({"a": "1.0.0", "b": "1.0.0"},
                  {"a": [("b", None, None)], "b": [("a", None, None)]}))
`,
  explain: {
    en: `<p>Real dependency tooling separates <strong>validation</strong> from <strong>ordering</strong>. Validation is per edge: is the dependency in the lockfile, and does its pinned version fall in <code>[min, max)</code>? Versions must be compared as integer tuples — string comparison says <code>"1.10.0" &lt; "1.9.0"</code>, a classic bug. Note that <code>api 1.10.0</code> satisfies <code>[1.4.0, 2.0.0)</code> in the example.</p>
<p>Ordering is a DFS post-order: a package is appended only after all its dependencies finish, so the list is a valid build order. Visiting roots and neighbours in sorted order makes it deterministic. The <strong>grey</strong> colour marks nodes on the current recursion path; meeting a grey node means we found a back edge, and slicing the <code>path</code> stack from that node gives the human-readable cycle.</p>
<p>The recursion depth equals the longest dependency chain (small in practice); for adversarial inputs switch to an explicit stack or Kahn's algorithm.</p>`,
    he: `<p>כלי תלויות אמיתיים מפרידים בין <strong>validation</strong> ל-<strong>סידור</strong>. validation הוא לכל קשת: התלות נמצאת ב-lockfile, והגרסה הנעולה שלה בטווח <code>[min, max)</code>? חייבים להשוות גרסאות כ-tuple של מספרים – השוואת מחרוזות אומרת ש-<code>"1.10.0" &lt; "1.9.0"</code>, באג קלאסי. שים לב ש-<code>api 1.10.0</code> עומד ב-<code>[1.4.0, 2.0.0)</code> בדוגמה.</p>
<p>הסידור הוא DFS post-order: חבילה נכנסת לרשימה רק אחרי שכל התלויות שלה סיימו, אז הרשימה היא סדר build תקין. ביקור בשורשים ובשכנים לפי סדר ממוין הופך את התוצאה לדטרמיניסטית. הצבע ה<strong>אפור</strong> מסמן nodes על מסלול הרקורסיה הנוכחי; פגיעה ב-node אפור אומרת שמצאנו back edge, וחיתוך ה-stack של <code>path</code> מה-node הזה נותן מעגל קריא לבני אדם.</p>
<p>עומק הרקורסיה שווה לשרשרת התלויות הארוכה ביותר (קטן בפועל); ל-inputs עוינים עוברים ל-stack מפורש או לאלגוריתם של Kahn.</p>`
  },
  complexity: "Time O(V + E) plus O(E · L) to parse versions of length L (and sorting neighbours), Space O(V + E)",
  whyInfra: {
    en: "pip/uv, npm, Cargo, Go modules, Helm dependency update and Terraform provider locking all validate pinned versions against constraints and then compute an install/build order. Bazel and Gradle fail builds with exactly this kind of 'cycle: a -> b -> a' message. Full resolution (choosing versions) is NP-complete; modern resolvers like PubGrub (uv, Dart) and Go's MVS make it tractable.",
    he: "pip/uv, npm, Cargo, Go modules, helm dependency update ונעילת providers ב-Terraform – כולם בודקים גרסאות נעולות מול אילוצים ואז מחשבים סדר התקנה/build. Bazel ו-Gradle מפילים builds עם הודעה בדיוק כמו 'cycle: a -> b -> a'. רזולוציה מלאה (בחירת גרסאות) היא NP-complete; resolvers מודרניים כמו PubGrub (uv, Dart) ו-MVS של Go הופכים אותה לפתירה בפועל."
  },
  followUps: [
    { q: { en: "Now choose the versions yourself from a registry of available versions. How?", he: "עכשיו תבחר את הגרסאות בעצמך מתוך registry של גרסאות זמינות. איך?" },
      a: { en: "Backtracking search: pick the highest version of a package that fits current constraints, add its requirements, recurse; on conflict, backtrack. It's equivalent to SAT in general, so real resolvers add conflict learning (PubGrub) or restrict the problem (Go's Minimal Version Selection picks the max of minimums — no backtracking).", he: "חיפוש עם backtracking: בוחרים את הגרסה הגבוהה ביותר שמתאימה לאילוצים הנוכחיים, מוסיפים את הדרישות שלה, ממשיכים ברקורסיה; בקונפליקט חוזרים אחורה. באופן כללי זה שקול ל-SAT, ולכן resolvers אמיתיים מוסיפים conflict learning (PubGrub) או מגבילים את הבעיה (Minimal Version Selection של Go לוקח את המקסימום של המינימומים – בלי backtracking)." } },
    { q: { en: "How is this related to the 'Alien Dictionary' problem (LC 269)?", he: "איך זה קשור לבעיית 'Alien Dictionary' (LC 269)?" },
      a: { en: "Same core: derive ordering constraints (there from adjacent sorted words, here from dependency lists), build a graph, topologically sort it, and report invalid input (a cycle or a prefix violation) instead of crashing.", he: "אותה ליבה: מפיקים אילוצי סדר (שם ממילים ממוינות סמוכות, כאן מרשימות תלויות), בונים גרף, עושים לו topological sort ומדווחים על input לא תקין (מעגל או הפרת prefix) במקום לקרוס." } }
  ]
});

INFRA.problems.push({
  id: "design-hit-counter-distributed",
  icon: "🧮",
  difficulty: "hard",
  tags: ["design", "sliding-window", "concurrency", "sharding"],
  leetcode: "362",
  title: { en: "Distributed Hit Counter", he: "Hit Counter מבוזר" },
  statement: {
    en: `<p>Count hits on an endpoint over the last <code>window = 300</code> seconds, under very high write load (millions of hits per second across many threads/instances). Implement <code>ShardedHitCounter(shards, window)</code>:</p>
<ul>
<li><code>hit(ts, source)</code> records one hit at integer second <code>ts</code>; <code>source</code> (thread/instance id) chooses a shard to avoid lock contention.</li>
<li><code>get_hits(ts)</code> returns hits in <code>(ts - window, ts]</code>, aggregated over all shards.</li>
</ul>
<p>Memory must be O(shards × window), independent of the number of hits. Then discuss how to scale it across machines.</p>`,
    he: `<p>צריך לספור hits על endpoint ב-<code>window = 300</code> השניות האחרונות, תחת עומס כתיבה גבוה מאוד (מיליוני hits בשנייה מהרבה threads/instances). תממש <code>ShardedHitCounter(shards, window)</code>:</p>
<ul>
<li><code>hit(ts, source)</code> רושם hit אחד בשנייה <code>ts</code> (מספר שלם); <code>source</code> (מזהה thread/instance) בוחר shard כדי להימנע מ-lock contention.</li>
<li><code>get_hits(ts)</code> מחזיר את ה-hits בטווח <code>(ts - window, ts]</code>, מסוכמים על כל ה-shards.</li>
</ul>
<p>הזיכרון חייב להיות O(shards × window), בלי תלות במספר ה-hits. אחר כך תדון איך מגדילים את זה לכמה מכונות.</p>`
  },
  examples: `c = ShardedHitCounter(shards=4, window=300)
c.hit(1, "t1"); c.hit(2, "t2"); c.hit(3, "t1")
c.get_hits(4)   -> 3
c.hit(300, "t3")
c.get_hits(300) -> 4
c.get_hits(301) -> 3      # the hit at t=1 left the window (1, 301]
c.get_hits(700) -> 0`,
  hints: [
    { en: "Storing every timestamp (a deque) costs memory per hit. Aggregate per second instead: a circular array of `window` buckets.", he: "לשמור כל timestamp (deque) עולה זיכרון לכל hit. במקום זה מסכמים לפי שנייה: מערך מעגלי של `window` buckets." },
    { en: "Bucket i = ts % window holds (second, count). If the stored second differs from ts, the bucket is stale: reset it.", he: "Bucket i = ts % window מחזיק (second, count). אם השנייה ששמורה שונה מ-ts, ה-bucket ישן: מאפסים אותו." },
    { en: "Writes contend on one lock. Give each shard its own buckets and lock; reads sum all shards (writes are hot, reads are rare).", he: "ה-writes מתחרים על lock אחד. תן לכל shard buckets ו-lock משלו; קריאות מסכמות את כל ה-shards (writes חמים, reads נדירים)." }
  ],
  solution: String.raw`import threading
import zlib
from typing import List


class _Shard:
    """Circular array of per-second buckets with its own lock."""

    def __init__(self, window: int):
        self.window = window
        self.seconds: List[int] = [-1] * window   # which second each bucket holds
        self.counts: List[int] = [0] * window
        self.lock = threading.Lock()

    def hit(self, ts: int) -> None:
        i = ts % self.window
        with self.lock:
            if self.seconds[i] != ts:             # stale bucket from an old cycle
                self.seconds[i] = ts
                self.counts[i] = 0
            self.counts[i] += 1

    def count(self, ts: int) -> int:
        oldest_valid = ts - self.window           # window is (ts - window, ts]
        with self.lock:
            return sum(c for s, c in zip(self.seconds, self.counts)
                       if oldest_valid < s <= ts)


class ShardedHitCounter:
    def __init__(self, shards: int = 8, window: int = 300):
        self.shards = [_Shard(window) for _ in range(shards)]

    def _shard_for(self, source: str) -> _Shard:
        # stable hash so the same writer always hits the same shard (cache-friendly)
        return self.shards[zlib.crc32(source.encode()) % len(self.shards)]

    def hit(self, ts: int, source: str = "") -> None:
        self._shard_for(source).hit(ts)

    def get_hits(self, ts: int) -> int:
        return sum(shard.count(ts) for shard in self.shards)


if __name__ == "__main__":
    c = ShardedHitCounter(shards=4, window=300)
    c.hit(1, "t1"); c.hit(2, "t2"); c.hit(3, "t1")
    print(c.get_hits(4))     # 3
    c.hit(300, "t3")
    print(c.get_hits(300))   # 4
    print(c.get_hits(301))   # 3
    print(c.get_hits(700))   # 0

    # concurrent writers
    threads = [threading.Thread(target=lambda n=n: [c.hit(1000, f"t{n}") for _ in range(10_000)])
               for n in range(8)]
    for t in threads: t.start()
    for t in threads: t.join()
    print(c.get_hits(1000))  # 80000
`,
  explain: {
    en: `<p><strong>Single node.</strong> We don't need individual timestamps, only counts per second. A ring of <code>window</code> buckets indexed by <code>ts % window</code> stores <code>(second, count)</code>. On write, if the bucket holds an old second, it's from a previous lap of the ring, so we reset it. On read, we sum buckets whose second falls in <code>(ts - window, ts]</code>, which also ignores stale buckets that were never overwritten. Memory is fixed at 300 buckets no matter how many hits.</p>
<p><strong>Contention.</strong> With one lock, millions of writers serialize. Sharding the counter (one ring + lock per shard, writer picks a shard by a stable hash) spreads writes; reads pay O(shards × window) to sum, which is fine because reads are rare. This is the same trick as Java's <code>LongAdder</code> or per-CPU counters in the Linux kernel.</p>
<p><strong>Across machines</strong> — trade-offs to discuss:</p>
<ul>
<li><em>Local aggregation + push</em>: each instance keeps its own ring and periodically (e.g. every 1-10 s) pushes per-second counts to a central store or a metrics pipeline. Cheap and scalable; reads are slightly stale. This is how Prometheus counters + rate() and StatsD work.</li>
<li><em>Central atomic counters</em>: <code>INCR hits:{second}</code> in Redis with a TTL of the window, read with <code>MGET</code> over 300 keys. Exact and simple, but every hit is a network call and a single hot key becomes the bottleneck; shard the key (<code>hits:{second}:{0..N}</code>) to spread it.</li>
<li><em>Stream processing</em>: hits go to Kafka, a Flink/Kafka Streams job keeps windowed counts. Durable and replayable; seconds of latency.</li>
<li><em>Consistency</em>: exact counts need coordination; most dashboards accept approximate, eventually consistent sums. Clock skew between instances blurs window edges by the skew amount.</li>
</ul>`,
    he: `<p><strong>Node בודד.</strong> לא צריך timestamps בודדים, רק ספירה לכל שנייה. טבעת של <code>window</code> buckets לפי <code>ts % window</code> שומרת <code>(second, count)</code>. בכתיבה, אם ב-bucket יש שנייה ישנה, הוא מסיבוב קודם של הטבעת, אז מאפסים אותו. בקריאה, סוכמים buckets שהשנייה שלהם בטווח <code>(ts - window, ts]</code>, וזה גם מתעלם מ-buckets ישנים שלא נדרסו. הזיכרון קבוע על 300 buckets לא משנה כמה hits יש.</p>
<p><strong>Contention.</strong> עם lock אחד, מיליוני writers עומדים בתור. פיצול ה-counter ל-shards (טבעת + lock לכל shard, ה-writer בוחר shard לפי hash יציב) מפזר את ה-writes; קריאות משלמות O(shards × window) כדי לסכום, וזה בסדר כי קריאות נדירות. זה אותו טריק כמו <code>LongAdder</code> ב-Java או per-CPU counters בקרנל של לינוקס.</p>
<p><strong>על פני כמה מכונות</strong> – trade-offs לדיון:</p>
<ul>
<li><em>אגרגציה מקומית + push</em>: כל instance מחזיק טבעת משלו ודוחף מדי פעם (כל 1-10 שניות) ספירות לשנייה ל-store מרכזי או ל-pipeline של metrics. זול ו-scalable; הקריאות קצת stale. ככה עובדים counters של Prometheus עם rate() ו-StatsD.</li>
<li><em>Counters אטומיים מרכזיים</em>: <code>INCR hits:{second}</code> ב-Redis עם TTL בגודל החלון, וקריאה עם <code>MGET</code> על 300 מפתחות. מדויק ופשוט, אבל כל hit הוא קריאת רשת ומפתח חם אחד הופך לצוואר בקבוק; מפצלים את המפתח (<code>hits:{second}:{0..N}</code>) כדי לפזר.</li>
<li><em>Stream processing</em>: ה-hits הולכים ל-Kafka, וג'וב Flink/Kafka Streams מחזיק ספירות לפי חלון. עמיד וניתן ל-replay; latency של שניות.</li>
<li><em>Consistency</em>: ספירה מדויקת דורשת תיאום; רוב הדשבורדים מקבלים סכומים משוערים ו-eventually consistent. clock skew בין instances מטשטש את גבולות החלון בגודל ה-skew.</li>
</ul>`
  },
  complexity: "hit O(1), get_hits O(shards × window), Space O(shards × window)",
  whyInfra: {
    en: "This is the shape of every metrics system: Prometheus client counters are per-process, scraped and summed with sum(rate(http_requests_total[5m])); StatsD/Datadog agents aggregate locally and flush every 10 s; Envoy and NGINX keep per-worker stats; global rate limiters (Envoy RLS on Redis) shard hot counters. Knowing why you aggregate locally before going over the network is a senior SRE signal.",
    he: "זו הצורה של כל מערכת metrics: counters בצד ה-client של Prometheus הם לכל process, נאספים ב-scrape ומסוכמים עם sum(rate(http_requests_total[5m])); agents של StatsD/Datadog מסכמים מקומית ועושים flush כל 10 שניות; Envoy ו-NGINX מחזיקים stats לכל worker; rate limiters גלובליים (Envoy RLS על Redis) מפצלים counters חמים. להבין למה מסכמים מקומית לפני שיוצאים לרשת – זה סיגנל של SRE סניור."
  },
  followUps: [
    { q: { en: "get_hits is called 10,000 times per second too. Now what?", he: "גם get_hits נקרא 10,000 פעמים בשנייה. מה עכשיו?" },
      a: { en: "Maintain a running total: add on hit, subtract buckets as they expire (advance a 'last expired second' pointer on each call), so reads become O(1) amortised. Or cache the aggregated value for ~1 s — dashboards don't need fresher data.", he: "מחזיקים סכום רץ: מוסיפים ב-hit, ומחסירים buckets כשהם פגים (מקדמים מצביע 'השנייה האחרונה שפגה' בכל קריאה), כך שהקריאות הופכות ל-O(1) amortized. או עושים cache לערך המסוכם לשנייה בערך – דשבורדים לא צריכים מידע טרי יותר." } },
    { q: { en: "An instance crashes. Do you lose hits?", he: "instance קורס. מאבדים hits?" },
      a: { en: "With local aggregation you lose up to one flush interval of its counts — usually acceptable for metrics. If every hit matters (billing), write hits to a durable log (Kafka) first and count from it, accepting higher cost and latency.", he: "עם אגרגציה מקומית מאבדים עד interval אחד של flush מהספירות שלו – בדרך כלל מקובל ל-metrics. אם כל hit חשוב (billing), כותבים את ה-hits קודם ל-log עמיד (Kafka) וסופרים ממנו, ומקבלים עלות ו-latency גבוהים יותר." } },
    { q: { en: "Why not one global Redis INCR per hit?", he: "למה לא INCR גלובלי אחד ב-Redis לכל hit?" },
      a: { en: "A single key lives on one Redis shard (~100k ops/s per core) and adds a network round trip to every request. Batching locally and incrementing by N every second cuts traffic by orders of magnitude.", he: "מפתח אחד יושב על shard אחד של Redis (בערך 100k ops/s ל-core) ומוסיף round trip ברשת לכל בקשה. batching מקומי ו-INCRBY של N פעם בשנייה מורידים את התעבורה בסדרי גודל." } }
  ]
});
