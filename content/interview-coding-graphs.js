// Interview prep — graph, union-find, trie and tree coding problems, framed as infrastructure problems.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.problems = window.INFRA.problems || [];

INFRA.problems.push({
  id: "min-hops-fabric-grid",
  icon: "🧭",
  difficulty: "medium",
  tags: ["graph", "bfs", "grid", "shortest-path"],
  leetcode: "1091",
  title: { en: "Minimum Hops Across a Switch Fabric (BFS)", he: "מינימום hops דרך switch fabric (BFS)" },
  statement: {
    en: `<p>A datacenter switch fabric is modelled as an <code>n x n</code> grid. <code>grid[r][c] == 0</code> is a healthy switch and <code>1</code> is a switch that is down. A packet enters at the top-left switch <code>(0, 0)</code> and must leave at the bottom-right switch <code>(n-1, n-1)</code>. From any switch it can be forwarded to any of its <strong>8</strong> neighbours (horizontal, vertical or diagonal) as long as that neighbour is healthy.</p>
<p>Return the number of switches on the shortest path (including the first and last), or <code>-1</code> if no path exists.</p>`,
    he: `<p>switch fabric בדאטה-סנטר ממודל כ-grid בגודל <code>n x n</code>. <code>grid[r][c] == 0</code> זה switch תקין ו-<code>1</code> זה switch שנפל. פקטה נכנסת ב-switch השמאלי-עליון <code>(0, 0)</code> וצריכה לצאת ב-switch הימני-תחתון <code>(n-1, n-1)</code>. מכל switch אפשר להעביר אותה לכל אחד מ-<strong>8</strong> השכנים (אופקי, אנכי או אלכסוני), בתנאי שהשכן תקין.</p>
<p>תחזיר את מספר ה-switches על המסלול הקצר ביותר (כולל הראשון והאחרון), או <code>-1</code> אם אין מסלול.</p>`
  },
  examples: `Input:  grid = [[0, 1],
                [1, 0]]
Output: 2      # one diagonal hop

Input:  grid = [[0, 0, 0],
                [1, 1, 0],
                [1, 1, 0]]
Output: 4

Input:  grid = [[1, 0, 0],
                [1, 1, 0],
                [1, 1, 0]]
Output: -1     # the entry switch itself is down`,
  hints: [
    { en: "Every hop costs the same (1). Shortest path in an unweighted graph means BFS, not Dijkstra.", he: "כל hop עולה אותו דבר (1). מסלול קצר ביותר בגרף בלי משקלים = BFS, לא Dijkstra." },
    { en: "BFS explores the grid in rings of equal distance. The first time you pop the exit cell, its distance is the answer.", he: "BFS סורק את ה-grid בטבעות של מרחק שווה. בפעם הראשונה שמוציאים מהתור את תא היציאה – המרחק שלו הוא התשובה." },
    { en: "Mark a cell as visited when you enqueue it, not when you pop it, or the same cell gets queued many times.", he: "תסמן תא כ-visited כשמכניסים אותו לתור, לא כשמוציאים – אחרת אותו תא ייכנס לתור הרבה פעמים." }
  ],
  solution: String.raw`from collections import deque
from typing import List


def min_hops(grid: List[List[int]]) -> int:
    """BFS over an 8-connected grid. Returns path length in cells, or -1."""
    n = len(grid)
    if grid[0][0] == 1 or grid[n - 1][n - 1] == 1:
        return -1                        # entry or exit switch is down

    directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1),
                  (0, 1), (1, -1), (1, 0), (1, 1)]
    queue = deque([(0, 0, 1)])           # (row, col, cells on path so far)
    seen = {(0, 0)}                      # mark on enqueue -> each cell queued once
    while queue:
        r, c, dist = queue.popleft()
        if (r, c) == (n - 1, n - 1):
            return dist                  # BFS order => first arrival is shortest
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc, dist + 1))
    return -1                            # exit not reachable


if __name__ == "__main__":
    print(min_hops([[0, 1], [1, 0]]))                       # 2
    print(min_hops([[0, 0, 0], [1, 1, 0], [1, 1, 0]]))      # 4
    print(min_hops([[1, 0, 0], [1, 1, 0], [1, 1, 0]]))      # -1
`,
  explain: {
    en: `<p>Treat each healthy switch as a node and each of the 8 possible moves as an edge of weight 1. In a graph where all edges cost the same, <strong>BFS</strong> finds shortest paths: it visits every node at distance 1, then every node at distance 2, and so on. So the first time the exit is dequeued, no shorter path can exist.</p>
<p>Two details make it correct and fast: check the entry/exit cells up front, and add a cell to <code>seen</code> at enqueue time. Without the second one, a cell reachable from several neighbours in the same ring gets queued several times — still correct, but potentially much slower.</p>
<p><strong>Pattern recognition:</strong> when you see "minimum number of steps / hops / moves" and every step costs the same, think <strong>BFS</strong>. If steps have different non-negative costs, think Dijkstra; if costs are only 0 or 1, think 0-1 BFS with a deque. Grids are just graphs whose edges you generate on the fly.</p>`,
    he: `<p>מתייחסים לכל switch תקין כ-node ולכל אחד מ-8 הצעדים האפשריים כקשת עם משקל 1. בגרף שבו כל הקשתות עולות אותו דבר, <strong>BFS</strong> מוצא מסלולים קצרים: הוא מבקר בכל ה-nodes במרחק 1, אחר כך בכל אלה שבמרחק 2, וכן הלאה. לכן בפעם הראשונה שהיציאה יוצאת מהתור, אין מסלול קצר יותר.</p>
<p>שני פרטים הופכים את זה לנכון ומהיר: בודקים את תא הכניסה והיציאה מראש, ומוסיפים תא ל-<code>seen</code> ברגע ההכנסה לתור. בלי הפרט השני, תא שאפשר להגיע אליו מכמה שכנים באותה טבעת נכנס לתור כמה פעמים – עדיין נכון, אבל יכול להיות הרבה יותר איטי.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "מספר מינימלי של צעדים / hops / מהלכים" וכל צעד עולה אותו דבר – תחשוב <strong>BFS</strong>. אם לצעדים יש עלויות שונות אי-שליליות – Dijkstra; אם העלויות הן רק 0 או 1 – 0-1 BFS עם deque. grid הוא סתם גרף שהקשתות שלו מחושבות תוך כדי.</p>`
  },
  complexity: "Time O(n^2), Space O(n^2) — each cell is enqueued at most once and has 8 neighbours",
  whyInfra: {
    en: "Hop count is the oldest routing metric: RIP picks routes by hop count (16 = unreachable), traceroute reports hops via TTL expiry, and BGP prefers the shortest AS-path. In leaf-spine / fat-tree fabrics every leaf-to-leaf path is 2 hops, which is exactly why ECMP can spread traffic evenly. Finding blast radius ('which services are within 2 hops of the broken one?') is also a BFS over the dependency graph.",
    he: "מספר hops הוא ה-metric הכי ותיק בניתוב: RIP בוחר routes לפי hop count (16 = לא נגיש), traceroute מדווח hops דרך פקיעת TTL, ו-BGP מעדיף את ה-AS-path הקצר. ב-fabrics של leaf-spine / fat-tree כל מסלול leaf-to-leaf הוא 2 hops, וזו בדיוק הסיבה ש-ECMP יכול לפזר תעבורה באופן שווה. גם חישוב blast radius ('אילו שירותים נמצאים עד 2 hops מהשירות השבור?') הוא BFS על גרף התלויות."
  },
  followUps: [
    { q: { en: "Return the actual path, not just its length.", he: "תחזיר את המסלול עצמו, לא רק את האורך." },
      a: { en: "Store parent[(nr, nc)] = (r, c) when enqueuing. When you reach the exit, walk parents back to the entry and reverse. Same O(n^2).", he: "שומרים parent[(nr, nc)] = (r, c) בזמן ההכנסה לתור. כשמגיעים ליציאה, הולכים אחורה על ה-parents עד הכניסה והופכים. אותו O(n^2)." } },
    { q: { en: "The fabric has millions of switches. How do you speed it up?", he: "ב-fabric יש מיליוני switches. איך מאיצים?" },
      a: { en: "Bidirectional BFS from both ends meets in the middle and explores roughly 2 * b^(d/2) nodes instead of b^d. On a grid, A* with the Chebyshev distance max(|dr|, |dc|) as an admissible heuristic also prunes most of the search.", he: "BFS דו-כיווני משני הקצוות נפגש באמצע וסורק בערך 2 * b^(d/2) nodes במקום b^d. על grid, גם A* עם מרחק Chebyshev, כלומר max(|dr|, |dc|), כ-heuristic קביל חוסך את רוב החיפוש." } }
  ]
});

INFRA.problems.push({
  id: "clone-dependency-graph",
  icon: "🧬",
  difficulty: "medium",
  tags: ["graph", "hashmap", "bfs", "deep-copy"],
  leetcode: "133",
  title: { en: "Clone a Service Dependency Graph", he: "שכפול גרף תלויות של שירותים" },
  statement: {
    en: `<p>You want to spin up a staging copy of production's service graph and then mutate it freely (rename services, rewire calls) without touching the original. Each service is a <code>Node(name, deps)</code> where <code>deps</code> is a list of other <code>Node</code> objects it calls. The graph may contain <strong>cycles</strong> (<code>api</code> calls <code>cache</code>, <code>cache</code> calls back into <code>api</code>) and shared dependencies.</p>
<p>Given a reference to one entry service, return a <strong>deep copy</strong> of every service reachable from it: new <code>Node</code> objects with the same names and the same edges, and no edge in the copy may point to an original node.</p>`,
    he: `<p>אתה רוצה להרים עותק staging של גרף השירותים של production ואז לשנות אותו חופשי (לשנות שמות, לחווט מחדש קריאות) בלי לגעת במקור. כל שירות הוא <code>Node(name, deps)</code>, כש-<code>deps</code> זו רשימה של אובייקטי <code>Node</code> אחרים שהוא קורא להם. בגרף יכולים להיות <strong>מעגלים</strong> (<code>api</code> קורא ל-<code>cache</code>, ו-<code>cache</code> קורא בחזרה ל-<code>api</code>) ותלויות משותפות.</p>
<p>בהינתן reference לשירות כניסה אחד, תחזיר <strong>deep copy</strong> של כל שירות שאפשר להגיע אליו ממנו: אובייקטי <code>Node</code> חדשים עם אותם שמות ואותן קשתות, ואף קשת בעותק לא מצביעה על node מהמקור.</p>`
  },
  examples: `Input (adjacency of the original, entry = "web"):
  web   -> [api]
  api   -> [db, cache]
  cache -> [api]          # cycle api <-> cache
  db    -> []
Output: a new graph with the same adjacency,
        and (copy is not original) for every node`,
  hints: [
    { en: "A naive recursive copy loops forever on the api/cache cycle. You need to remember what you already copied.", he: "העתקה רקורסיבית נאיבית תיכנס ללולאה אינסופית על המעגל api/cache. צריך לזכור מה כבר העתקת." },
    { en: "Keep a hashmap original -> copy. It is both the visited set and the way to find the copy of a neighbour.", he: "תחזיק hashmap של original -> copy. הוא גם ה-visited set וגם הדרך למצוא את העותק של שכן." },
    { en: "Create the copy and put it in the map before you process its neighbours, so a cycle back to it finds the existing copy.", he: "תיצור את העותק ותכניס אותו למפה לפני שאתה מעבד את השכנים שלו, ככה מעגל שחוזר אליו ימצא את העותק הקיים." }
  ],
  solution: String.raw`from collections import deque
from typing import List, Optional


class Node:
    def __init__(self, name: str, deps: Optional[List["Node"]] = None):
        self.name = name
        self.deps = deps if deps is not None else []


def clone_graph(entry: Optional[Node]) -> Optional[Node]:
    """BFS deep copy. 'copies' maps original node -> its clone (also our visited set)."""
    if entry is None:
        return None
    copies = {entry: Node(entry.name)}
    queue = deque([entry])
    while queue:
        node = queue.popleft()
        for dep in node.deps:
            if dep not in copies:                 # first time we see it: clone + schedule
                copies[dep] = Node(dep.name)
                queue.append(dep)
            copies[node].deps.append(copies[dep])  # wire clone -> clone, never clone -> original
    return copies[entry]


# --- helpers for the example ---------------------------------------------------
def build(adj: dict, entry: str) -> Node:
    nodes = {name: Node(name) for name in adj}
    for name, deps in adj.items():
        nodes[name].deps = [nodes[d] for d in deps]
    return nodes[entry]


def to_adj(entry: Node) -> dict:
    adj, stack, seen = {}, [entry], {id(entry)}
    while stack:
        n = stack.pop()
        adj[n.name] = [d.name for d in n.deps]
        for d in n.deps:
            if id(d) not in seen:
                seen.add(id(d))
                stack.append(d)
    return adj


if __name__ == "__main__":
    original = build({"web": ["api"], "api": ["db", "cache"],
                      "cache": ["api"], "db": []}, "web")
    copy = clone_graph(original)
    print(to_adj(copy) == to_adj(original))      # True  (same shape)
    print(copy is not original,
          copy.deps[0] is not original.deps[0])  # True True (new objects)
`,
  explain: {
    en: `<p>The whole problem is the hashmap <code>copies</code> from original node to clone. It does three jobs at once: it is the <em>visited set</em> (so cycles terminate), it guarantees that a shared dependency is cloned <em>once</em> (so two services that both call <code>db</code> still share one cloned <code>db</code>), and it lets us translate every original edge <code>node -&gt; dep</code> into <code>copies[node] -&gt; copies[dep]</code>.</p>
<p>The order matters: a node is cloned and registered <em>before</em> its neighbours are processed. When the walk comes back around a cycle, it finds the clone already in the map and just wires an edge to it. BFS and DFS both work; the iterative BFS avoids Python's recursion limit on long dependency chains.</p>
<p><strong>Pattern recognition:</strong> when you see "copy a structure that may contain cycles or shared references" (graphs, linked list with random pointers, LeetCode 138), think <strong>hashmap original -&gt; copy</strong>, filled before you recurse.</p>`,
    he: `<p>כל הבעיה היא ה-hashmap <code>copies</code> מ-node מקורי לעותק. הוא עושה שלושה דברים בבת אחת: הוא ה-<em>visited set</em> (ככה מעגלים נגמרים), הוא מבטיח שתלות משותפת משוכפלת <em>פעם אחת</em> (אז שני שירותים שקוראים ל-<code>db</code> עדיין חולקים <code>db</code> משוכפל אחד), והוא מאפשר לתרגם כל קשת מקורית <code>node -&gt; dep</code> ל-<code>copies[node] -&gt; copies[dep]</code>.</p>
<p>הסדר חשוב: node משוכפל ונרשם במפה <em>לפני</em> שמעבדים את השכנים שלו. כשההליכה חוזרת סביב מעגל, היא מוצאת את העותק כבר במפה ורק מחווטת אליו קשת. גם BFS וגם DFS עובדים; BFS איטרטיבי חוסך את ה-recursion limit של Python בשרשראות תלויות ארוכות.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "להעתיק מבנה שיכולים להיות בו מעגלים או references משותפים" (גרפים, linked list עם random pointers, LeetCode 138) – תחשוב <strong>hashmap של original -&gt; copy</strong>, שממלאים לפני שנכנסים פנימה.</p>`
  },
  complexity: "Time O(V + E), Space O(V) for the map and queue (plus the copy itself)",
  whyInfra: {
    en: "Python's copy.deepcopy uses exactly this memo dict, which is why it survives self-referencing objects. Cloning environments (a Terraform workspace or a Helm umbrella chart for staging, an ephemeral preview environment per PR) means copying a dependency graph and rewiring it to new endpoints without touching prod. Snapshotting a live topology for a what-if analysis (chaos experiment, failover drill) is the same operation.",
    he: "copy.deepcopy ב-Python משתמש בדיוק ב-memo dict כזה, ולכן הוא שורד אובייקטים שמצביעים על עצמם. שכפול סביבות (Terraform workspace או umbrella chart של Helm ל-staging, סביבת preview זמנית לכל PR) זה להעתיק גרף תלויות ולחווט אותו ל-endpoints חדשים בלי לגעת ב-prod. גם snapshot של טופולוגיה חיה לניתוח what-if (ניסוי chaos, תרגיל failover) זו אותה פעולה."
  },
  followUps: [
    { q: { en: "Why not just copy each node's name and neighbour names into a dict and rebuild?", he: "למה לא פשוט להעתיק את השם ואת שמות השכנים של כל node ל-dict ולבנות מחדש?" },
      a: { en: "That works only if names are unique keys. If two different nodes can share a name (two 'redis' instances), you must key by object identity — which is what the original -> copy map does.", he: "זה עובד רק אם השמות ייחודיים. אם שני nodes שונים יכולים לחלוק שם (שני instances של 'redis'), חייבים להשתמש בזהות האובייקט כמפתח – וזה בדיוק מה שה-map של original -> copy עושה." } },
    { q: { en: "Some services are unreachable from the entry service. How do you clone the whole graph?", he: "חלק מהשירותים לא נגישים משירות הכניסה. איך משכפלים את כל הגרף?" },
      a: { en: "Run the same BFS from every node that is not yet in the copies map (like counting connected components) and return the list of all clones.", he: "מריצים את אותו BFS מכל node שעוד לא נמצא ב-copies (כמו ספירת רכיבי קשירות) ומחזירים את רשימת כל העותקים." } }
  ]
});

INFRA.problems.push({
  id: "eventual-safe-services",
  icon: "🔁",
  difficulty: "medium",
  tags: ["graph", "dfs", "cycle-detection", "topological-sort"],
  leetcode: "802",
  title: { en: "Services Safe From Circular Dependencies", he: "שירותים שבטוחים ממעגלי תלויות" },
  statement: {
    en: `<p>There are <code>n</code> services numbered <code>0..n-1</code>. <code>graph[i]</code> lists the services that service <code>i</code> waits on at startup. A service with no dependencies (a <em>terminal</em> service) always starts. A service is <strong>safe</strong> if every possible chain of dependencies starting from it eventually reaches terminal services — i.e. it can never get stuck waiting on a circular dependency.</p>
<p>Return all safe services in ascending order.</p>`,
    he: `<p>יש <code>n</code> שירותים שממוספרים <code>0..n-1</code>. <code>graph[i]</code> מפרט את השירותים ששירות <code>i</code> מחכה להם ב-startup. שירות בלי תלויות (שירות <em>terminal</em>) תמיד עולה. שירות הוא <strong>safe</strong> אם כל שרשרת תלויות אפשרית שמתחילה ממנו מגיעה בסוף לשירותי terminal – כלומר הוא אף פעם לא ייתקע בהמתנה על תלות מעגלית.</p>
<p>תחזיר את כל השירותים ה-safe בסדר עולה.</p>`
  },
  examples: `Input:  graph = [[1, 2], [2, 3], [5], [0], [5], [], []]
Output: [2, 4, 5, 6]
# 0 -> 1 -> 3 -> 0 is a cycle, so 0, 1, 3 are unsafe.
# 2 -> 5 and 4 -> 5 only lead to terminal service 5.

Input:  graph = [[1, 2, 3, 4], [1, 2], [3, 4], [0, 4], []]
Output: [4]    # 1 depends on itself; 0, 2, 3 can reach a cycle`,
  hints: [
    { en: "A service is unsafe exactly when some path from it reaches a cycle. So this is cycle detection in a directed graph.", he: "שירות לא safe בדיוק כשיש ממנו מסלול שמגיע למעגל. אז זה זיהוי מעגל בגרף מכוון." },
    { en: "Use DFS with three colours: white = unvisited, gray = on the current DFS path, black = proven safe. Meeting a gray node means you found a cycle.", he: "תשתמש ב-DFS עם שלושה צבעים: לבן = לא בוקר, אפור = על מסלול ה-DFS הנוכחי, שחור = הוכח כ-safe. פגישה ב-node אפור אומרת שמצאת מעגל." },
    { en: "If a DFS from a node finds a cycle, leave that node gray forever. Gray then means 'unsafe' for every later query, so each node is processed once.", he: "אם DFS מ-node מוצא מעגל, תשאיר את ה-node הזה אפור לתמיד. מעכשיו אפור אומר 'לא safe' לכל שאילתה אחרי זה, ככה כל node מעובד פעם אחת." }
  ],
  solution: String.raw`import sys
from typing import List

WHITE, GRAY, BLACK = 0, 1, 2   # unvisited / on current path (or unsafe) / safe


def eventual_safe(graph: List[List[int]]) -> List[int]:
    """DFS with colours. A node is safe iff no path from it reaches a cycle."""
    sys.setrecursionlimit(max(1000, 2 * len(graph) + 10))  # long dependency chains
    color = [WHITE] * len(graph)

    def is_safe(u: int) -> bool:
        if color[u] != WHITE:
            return color[u] == BLACK     # GRAY = cycle on this path, or known unsafe
        color[u] = GRAY                  # u is now on the DFS stack
        for v in graph[u]:
            if not is_safe(v):
                return False             # leave u GRAY: it can reach a cycle
        color[u] = BLACK                 # every dependency is safe -> u is safe
        return True

    return [u for u in range(len(graph)) if is_safe(u)]


if __name__ == "__main__":
    print(eventual_safe([[1, 2], [2, 3], [5], [0], [5], [], []]))   # [2, 4, 5, 6]
    print(eventual_safe([[1, 2, 3, 4], [1, 2], [3, 4], [0, 4], []]))  # [4]
`,
  explain: {
    en: `<p>In a directed graph, a cycle shows up during DFS as a <strong>back edge</strong>: an edge to a node that is still on the current recursion stack. The three-colour scheme tracks exactly that. White nodes are untouched, gray nodes are "in progress" (on the stack), black nodes are finished and proven safe.</p>
<p>The trick specific to this problem: when a DFS discovers a cycle, every node on the current path can reach that cycle, so they are all unsafe. We simply <em>return without un-graying them</em>. Gray now doubles as "unsafe", so later DFS calls that touch these nodes stop immediately. Each node changes colour at most twice and each edge is followed once: linear time.</p>
<p>Why not plain visited/unvisited? In a directed graph, reaching an already-visited node is not necessarily a cycle (two paths can merge at a shared dependency, like <code>db</code>). Only reaching a node that is <em>still on the stack</em> is. That is the difference between gray and black.</p>
<p><strong>Pattern recognition:</strong> when you see "cycle in a <em>directed</em> graph" or "which nodes can get stuck", think <strong>DFS with white/gray/black</strong> (or Kahn's algorithm on in-degrees). For an <em>undirected</em> graph, think union-find or "visited neighbour that is not my parent".</p>`,
    he: `<p>בגרף מכוון, מעגל מתגלה במהלך DFS כ-<strong>back edge</strong>: קשת ל-node שעדיין נמצא על ה-stack של הרקורסיה. שיטת שלושת הצבעים עוקבת בדיוק אחרי זה. nodes לבנים לא נגענו בהם, אפורים הם "בתהליך" (על ה-stack), ושחורים סיימו והוכחו כ-safe.</p>
<p>הטריק שספציפי לבעיה הזו: כש-DFS מגלה מעגל, כל node על המסלול הנוכחי יכול להגיע למעגל הזה, אז כולם לא safe. אנחנו פשוט <em>חוזרים בלי להחזיר אותם ללבן</em>. אפור עכשיו משמש גם כ"לא safe", אז קריאות DFS מאוחרות יותר שנוגעות ב-nodes האלה עוצרות מיד. כל node מחליף צבע לכל היותר פעמיים וכל קשת נבדקת פעם אחת: זמן לינארי.</p>
<p>למה לא מספיק visited/unvisited רגיל? בגרף מכוון, הגעה ל-node שכבר בוקר היא לא בהכרח מעגל (שני מסלולים יכולים להתאחד בתלות משותפת, כמו <code>db</code>). רק הגעה ל-node ש<em>עדיין על ה-stack</em> היא מעגל. זה ההבדל בין אפור לשחור.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "מעגל בגרף <em>מכוון</em>" או "אילו nodes יכולים להיתקע" – תחשוב <strong>DFS עם לבן/אפור/שחור</strong> (או האלגוריתם של Kahn על in-degrees). בגרף <em>לא מכוון</em> – union-find או "שכן שכבר בוקר ושהוא לא ה-parent שלי".</p>`
  },
  complexity: "Time O(V + E), Space O(V) for colours and recursion stack",
  whyInfra: {
    en: "Circular startup dependencies are a classic outage: service A's readiness probe needs B, B's needs A, and after a full-cluster restart nothing ever becomes Ready. systemd detects ordering cycles and breaks them by dropping a job ('Found ordering cycle'), Terraform refuses to plan with 'Error: Cycle', and Go refuses import cycles at compile time. Listing the safe services tells you what can be restarted without risking a deadlock and where the cycle's blast radius ends.",
    he: "תלויות startup מעגליות הן outage קלאסי: ה-readiness probe של שירות A צריך את B, ושל B צריך את A, ואחרי restart של כל ה-cluster אף אחד לא נהיה Ready. systemd מזהה ordering cycles ושובר אותם על ידי זריקת job ('Found ordering cycle'), Terraform מסרב לעשות plan עם 'Error: Cycle', ו-Go מסרבת ל-import cycles בזמן קומפילציה. רשימת השירותים ה-safe אומרת לך מה אפשר לעשות לו restart בלי סיכון ל-deadlock, ואיפה נגמר ה-blast radius של המעגל."
  },
  followUps: [
    { q: { en: "Solve it without recursion.", he: "תפתור בלי רקורסיה." },
      a: { en: "Reverse the edges and run Kahn's algorithm: start from terminal nodes (out-degree 0 in the original graph), and each time a node is 'safe', decrement the out-degree of every node that depends on it; nodes that reach 0 are safe too. Whatever never reaches 0 is in or behind a cycle.", he: "הופכים את הקשתות ומריצים את Kahn: מתחילים מ-nodes terminal (out-degree 0 בגרף המקורי), ובכל פעם ש-node הוא 'safe' מורידים 1 מה-out-degree של כל node שתלוי בו; מי שמגיע ל-0 גם safe. מה שאף פעם לא מגיע ל-0 נמצא במעגל או מאחוריו." } },
    { q: { en: "Report the actual cycles so an engineer can fix them.", he: "תדווח על המעגלים עצמם כדי שמהנדס יוכל לתקן." },
      a: { en: "Keep the DFS path as an explicit stack; when you hit a gray node v, the stack slice from v to the top is the cycle. To find all strongly connected components at once, use Tarjan's or Kosaraju's SCC algorithm in O(V + E).", he: "מחזיקים את מסלול ה-DFS כ-stack מפורש; כשנתקלים ב-node אפור v, החלק ב-stack מ-v ועד הראש הוא המעגל. כדי למצוא את כל ה-strongly connected components בבת אחת – Tarjan או Kosaraju ב-O(V + E)." } }
  ]
});

INFRA.problems.push({
  id: "redundant-link-stp",
  icon: "🔌",
  difficulty: "medium",
  tags: ["union-find", "graph", "cycle-detection"],
  leetcode: "684",
  title: { en: "The Redundant Cable That Creates a Loop (Union-Find)", he: "הכבל המיותר שיוצר לולאה (Union-Find)" },
  statement: {
    en: `<p>A layer-2 network of <code>n</code> switches (labelled <code>1..n</code>) was cabled as a tree — every switch reachable, no loops. Then someone added <strong>one extra cable</strong>, creating exactly one loop (a recipe for a broadcast storm). You get the cabling log <code>edges</code>, where <code>edges[i] = [a, b]</code> is an undirected cable between switches <code>a</code> and <code>b</code>.</p>
<p>Return a cable that can be removed so the network becomes a tree again. If there are several answers, return the one that appears <strong>last</strong> in <code>edges</code>.</p>`,
    he: `<p>רשת layer-2 של <code>n</code> switches (ממוספרים <code>1..n</code>) חווטה כעץ – כל switch נגיש, בלי לולאות. ואז מישהו הוסיף <strong>כבל אחד נוסף</strong> ויצר בדיוק לולאה אחת (מתכון ל-broadcast storm). קיבלת את לוג החיווט <code>edges</code>, כש-<code>edges[i] = [a, b]</code> הוא כבל לא מכוון בין switch <code>a</code> ל-switch <code>b</code>.</p>
<p>תחזיר כבל שאפשר להוריד כדי שהרשת תחזור להיות עץ. אם יש כמה תשובות, תחזיר את זה שמופיע <strong>אחרון</strong> ב-<code>edges</code>.</p>`
  },
  examples: `Input:  edges = [[1, 2], [1, 3], [2, 3]]
Output: [2, 3]

Input:  edges = [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]
Output: [1, 4]   # 1-2-3-4-1 is the loop; [1, 4] is its last cable`,
  hints: [
    { en: "Add cables one by one. The answer is the first cable whose two ends are already connected by earlier cables.", he: "תוסיף את הכבלים אחד-אחד. התשובה היא הכבל הראשון ששני הקצוות שלו כבר מחוברים דרך כבלים קודמים." },
    { en: "'Are a and b already connected?' over a growing set of edges is exactly what Union-Find (disjoint set union) answers in near O(1).", he: "'האם a ו-b כבר מחוברים?' על קבוצת קשתות שגדלה – זה בדיוק מה ש-Union-Find (disjoint set union) עונה עליו בכמעט O(1)." },
    { en: "Keep the trees flat: path compression in find(), and union by rank (attach the shorter tree under the taller one).", he: "תשמור על העצים שטוחים: path compression ב-find(), ו-union by rank (מחברים את העץ הנמוך מתחת לגבוה)." }
  ],
  solution: String.raw`from typing import List


class DSU:
    """Disjoint Set Union with path compression + union by rank."""

    def __init__(self, n: int):
        self.parent = list(range(n + 1))   # switches are 1..n
        self.rank = [0] * (n + 1)          # upper bound on tree height

    def find(self, x: int) -> int:
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:      # path compression: point everyone at root
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a: int, b: int) -> bool:
        """Merge the sets of a and b. Returns False if they were already connected."""
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:  # union by rank: short tree under tall tree
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True


def redundant_cable(edges: List[List[int]]) -> List[int]:
    dsu = DSU(len(edges))                  # a tree on n nodes + 1 edge => n edges
    for a, b in edges:
        if not dsu.union(a, b):
            return [a, b]                  # a and b were already connected: loop!
    return []


if __name__ == "__main__":
    print(redundant_cable([[1, 2], [1, 3], [2, 3]]))                    # [2, 3]
    print(redundant_cable([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]))    # [1, 4]
`,
  explain: {
    en: `<p>Process cables in log order and maintain the connected components seen so far. A cable between two switches in <em>different</em> components merges them — fine. A cable between two switches in the <em>same</em> component closes a loop. Since there is exactly one loop, the first such cable is the last cable of that loop in the input, which is precisely the tie-break the problem asks for.</p>
<p><strong>Union-Find</strong> keeps each component as a tree with a representative root. <code>find(x)</code> walks up to the root; <code>union(a, b)</code> links one root under the other. Two optimisations make it practically O(1):</p>
<ul><li><strong>Path compression</strong> — after finding the root, re-point every node on the path directly to it, so the next lookup is one hop.</li>
<li><strong>Union by rank</strong> — always hang the shorter tree under the taller one, so heights stay logarithmic even before compression.</li></ul>
<p>Together they give amortised O(α(n)) per operation, where α (inverse Ackermann) is at most 4 for any realistic n.</p>
<p><strong>Pattern recognition:</strong> when you see "edges arrive one by one, are these two already connected?", "merge groups", or "cycle in an <em>undirected</em> graph", think <strong>Union-Find</strong>.</p>`,
    he: `<p>מעבדים את הכבלים לפי סדר הלוג ומתחזקים את רכיבי הקשירות שראינו עד עכשיו. כבל בין שני switches ברכיבים <em>שונים</em> ממזג אותם – בסדר. כבל בין שני switches באותו רכיב סוגר לולאה. מכיוון שיש בדיוק לולאה אחת, הכבל הראשון כזה הוא הכבל האחרון של הלולאה ב-input, וזה בדיוק ה-tie-break שהבעיה מבקשת.</p>
<p><strong>Union-Find</strong> מחזיק כל רכיב כעץ עם root מייצג. <code>find(x)</code> עולה עד ה-root; <code>union(a, b)</code> מחבר root אחד מתחת לשני. שתי אופטימיזציות הופכות את זה לכמעט O(1) בפועל:</p>
<ul><li><strong>Path compression</strong> – אחרי שמצאנו את ה-root, מפנים כל node על המסלול ישירות אליו, אז החיפוש הבא הוא hop אחד.</li>
<li><strong>Union by rank</strong> – תמיד תולים את העץ הנמוך מתחת לגבוה, ככה הגבהים נשארים לוגריתמיים גם לפני ה-compression.</li></ul>
<p>ביחד הן נותנות O(α(n)) amortized לפעולה, כש-α (ההופכי של Ackermann) לכל היותר 4 לכל n מציאותי.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "קשתות מגיעות אחת-אחת, האם שני אלה כבר מחוברים?", "למזג קבוצות", או "מעגל בגרף <em>לא מכוון</em>" – תחשוב <strong>Union-Find</strong>.</p>`
  },
  complexity: "Time O(n · α(n)) ≈ O(n), Space O(n)",
  whyInfra: {
    en: "This is the problem Spanning Tree Protocol exists for: Ethernet has no TTL, so a single loop lets broadcast frames circulate forever and melts the network. STP (802.1D/RSTP) elects a root bridge and puts redundant ports into blocking state so the active topology is a tree. Network automation and CMDB tools run exactly this check on LLDP/CDP neighbour data before applying a cabling change, and Kruskal's MST algorithm uses the same Union-Find to skip loop-forming links.",
    he: "זו הבעיה ש-Spanning Tree Protocol קיים בשבילה: ל-Ethernet אין TTL, אז לולאה אחת גורמת ל-broadcast frames להסתובב לנצח ולהפיל את הרשת. STP (802.1D/RSTP) בוחר root bridge ומעביר ports מיותרים למצב blocking, כך שהטופולוגיה הפעילה היא עץ. כלי network automation ו-CMDB מריצים בדיוק את הבדיקה הזו על נתוני שכנים מ-LLDP/CDP לפני שמחילים שינוי חיווט, ו-Kruskal (MST) משתמש באותו Union-Find כדי לדלג על לינקים שיוצרים לולאה."
  },
  followUps: [
    { q: { en: "The cables are directed (uplink -> downlink) and the network should be a rooted tree. What changes?", he: "הכבלים מכוונים (uplink -> downlink) והרשת צריכה להיות עץ עם root. מה משתנה?" },
      a: { en: "That is LeetCode 685. Besides a cycle, the extra edge can give some node two parents. Detect a node with in-degree 2, try removing each candidate edge, and use Union-Find to check the rest has no cycle.", he: "זה LeetCode 685. חוץ ממעגל, הקשת הנוספת יכולה לתת ל-node שני parents. מזהים node עם in-degree 2, מנסים להוריד כל אחת מהקשתות המועמדות, ובודקים עם Union-Find שבשאר אין מעגל." } },
    { q: { en: "Why does Union-Find not support removing a cable?", he: "למה Union-Find לא תומך בהורדת כבל?" },
      a: { en: "Union merges trees and compression destroys the history, so splitting a set is not possible cheaply. For deletions you need offline tricks (process in reverse as additions) or dynamic-connectivity structures like link-cut trees.", he: "union ממזג עצים ו-compression מוחק את ההיסטוריה, אז אין דרך זולה לפצל קבוצה. למחיקות צריך טריקים offline (לעבד בסדר הפוך כהוספות) או מבני dynamic connectivity כמו link-cut trees." } }
  ]
});

INFRA.problems.push({
  id: "merge-host-inventory",
  icon: "🗂️",
  difficulty: "medium",
  tags: ["union-find", "hashmap", "graph"],
  leetcode: "721",
  title: { en: "Merge Duplicate Host Inventory Records", he: "מיזוג רשומות inventory כפולות של hosts" },
  statement: {
    en: `<p>Your CMDB imports host records from several sources (cloud API, DHCP leases, LLDP, Ansible facts). Each record is <code>[hostname, id1, id2, ...]</code> where the ids are IP or MAC addresses. Two records describe the <strong>same machine</strong> if they share at least one id — and this is transitive (A shares an id with B, B with C, so A, B, C are one machine). Records with the same hostname but no shared id are <em>different</em> machines.</p>
<p>Return the merged records: each as <code>[hostname, sorted unique ids...]</code>, with the whole list sorted. All records of one machine have the same hostname.</p>`,
    he: `<p>ה-CMDB שלך מייבא רשומות hosts מכמה מקורות (cloud API, DHCP leases, LLDP, Ansible facts). כל רשומה היא <code>[hostname, id1, id2, ...]</code>, כשה-ids הם כתובות IP או MAC. שתי רשומות מתארות את <strong>אותה מכונה</strong> אם יש להן לפחות id משותף אחד – וזה טרנזיטיבי (ל-A יש id משותף עם B, ול-B עם C, אז A, B, C הם מכונה אחת). רשומות עם אותו hostname אבל בלי id משותף הן מכונות <em>שונות</em>.</p>
<p>תחזיר את הרשומות הממוזגות: כל אחת כ-<code>[hostname, ids ייחודיים ממוינים...]</code>, וכל הרשימה ממוינת. לכל הרשומות של מכונה אחת יש אותו hostname.</p>`
  },
  examples: `Input:
records = [["web-1", "10.0.0.5", "aa:bb:cc:00:00:01"],
           ["web-1", "10.0.0.6"],
           ["web-1", "aa:bb:cc:00:00:01", "10.0.0.7"],
           ["db-1",  "10.0.1.9"]]
Output:
[["db-1", "10.0.1.9"],
 ["web-1", "10.0.0.5", "10.0.0.7", "aa:bb:cc:00:00:01"],
 ["web-1", "10.0.0.6"]]
# records 0 and 2 share the MAC; record 1 is a different web-1`,
  hints: [
    { en: "Think of every id as a node. A record says 'all these ids belong together' — connect them.", he: "תחשוב על כל id כ-node. רשומה אומרת 'כל ה-ids האלה שייכים יחד' – תחבר ביניהם." },
    { en: "You do not need all pairs: union every id in a record with the record's first id. Union-Find takes care of transitivity.", he: "לא צריך את כל הזוגות: תעשה union לכל id ברשומה עם ה-id הראשון של אותה רשומה. Union-Find כבר מטפל בטרנזיטיביות." },
    { en: "Afterwards, group ids by find(id), and remember which hostname owns each id.", he: "אחר כך, קבץ את ה-ids לפי find(id), ותזכור לאיזה hostname שייך כל id." }
  ],
  solution: String.raw`from collections import defaultdict
from typing import Dict, List


def merge_inventory(records: List[List[str]]) -> List[List[str]]:
    parent: Dict[str, str] = {}
    rank: Dict[str, int] = {}

    def find(x: str) -> str:
        root = x
        while parent[root] != root:
            root = parent[root]
        while parent[x] != root:                 # path compression
            parent[x], x = root, parent[x]
        return root

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra == rb:
            return
        if rank[ra] < rank[rb]:                  # union by rank
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1

    owner: Dict[str, str] = {}                   # id -> hostname
    for hostname, *ids in records:
        for ident in ids:
            if ident not in parent:
                parent[ident], rank[ident] = ident, 0
            owner[ident] = hostname
            union(ids[0], ident)                 # star-connect the record's ids

    groups = defaultdict(list)                   # root id -> all ids of that machine
    for ident in parent:
        groups[find(ident)].append(ident)

    merged = [[owner[root]] + sorted(ids) for root, ids in groups.items()]
    return sorted(merged)


if __name__ == "__main__":
    print(merge_inventory([
        ["web-1", "10.0.0.5", "aa:bb:cc:00:00:01"],
        ["web-1", "10.0.0.6"],
        ["web-1", "aa:bb:cc:00:00:01", "10.0.0.7"],
        ["db-1", "10.0.1.9"],
    ]))
    # [['db-1', '10.0.1.9'], ['web-1', '10.0.0.5', '10.0.0.7', 'aa:bb:cc:00:00:01'],
    #  ['web-1', '10.0.0.6']]
`,
  explain: {
    en: `<p>The key modelling step: the nodes are the <strong>identifiers</strong>, not the records or the hostnames. Hostnames are not unique (two different <code>web-1</code> boxes), but an IP or MAC in the same snapshot pins down one machine. Each record is a statement "these ids are the same machine", so we union them. Connecting each id to the record's first id (a star) is enough; Union-Find makes "same machine" transitive across records automatically.</p>
<p>After all unions, every id's <code>find()</code> is the representative of its machine. Group by representative, sort the ids, and prefix the hostname we recorded for any id in the group.</p>
<p>A BFS/DFS over an id graph works too (build adjacency, count components), but Union-Find is shorter, needs no adjacency lists, and fits the streaming case where new records keep arriving.</p>
<p><strong>Pattern recognition:</strong> when you see "group items that share <em>any</em> attribute, transitively" (accounts by email, hosts by IP/MAC, users by device), think <strong>Union-Find over the attribute values</strong>, then group by root.</p>`,
    he: `<p>צעד המידול החשוב: ה-nodes הם ה-<strong>מזהים</strong>, לא הרשומות ולא ה-hostnames. hostnames לא ייחודיים (שתי קופסאות <code>web-1</code> שונות), אבל IP או MAC באותו snapshot מצביעים על מכונה אחת. כל רשומה היא הצהרה "ה-ids האלה הם אותה מכונה", אז עושים להם union. מספיק לחבר כל id ל-id הראשון ברשומה (כוכב); Union-Find הופך את "אותה מכונה" לטרנזיטיבי בין רשומות אוטומטית.</p>
<p>אחרי כל ה-unions, ה-<code>find()</code> של כל id הוא הנציג של המכונה שלו. מקבצים לפי נציג, ממיינים את ה-ids, ומוסיפים בהתחלה את ה-hostname ששמרנו לאיזשהו id בקבוצה.</p>
<p>גם BFS/DFS על גרף של ids עובד (בונים adjacency, סופרים רכיבים), אבל Union-Find קצר יותר, לא צריך adjacency lists, ומתאים למקרה streaming שבו רשומות חדשות ממשיכות להגיע.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "לקבץ פריטים שחולקים <em>איזשהו</em> מאפיין, בצורה טרנזיטיבית" (חשבונות לפי email, hosts לפי IP/MAC, משתמשים לפי device) – תחשוב <strong>Union-Find על ערכי המאפיינים</strong>, ואז קיבוץ לפי root.</p>`
  },
  complexity: "Time O(N · α(N) + N log N) where N = total ids (sorting dominates), Space O(N)",
  whyInfra: {
    en: "CMDB reconciliation is exactly this: ServiceNow's Identification and Reconciliation Engine, NetBox/Nautobot sync jobs and asset-discovery tools merge CIs from many sources by matching identifiers (serial number, MAC, cloud instance id, IP). Security tooling does the same to correlate an alert's IP with a pod, a node and a cloud instance. The danger is over-merging through non-unique identifiers — see the follow-up.",
    he: "reconciliation של CMDB זה בדיוק זה: ה-Identification and Reconciliation Engine של ServiceNow, jobs של סנכרון ב-NetBox/Nautobot וכלי asset discovery ממזגים CIs מהרבה מקורות לפי התאמת מזהים (serial number, MAC, instance id בענן, IP). גם כלי security עושים את אותו הדבר כדי לקשר IP מ-alert ל-pod, ל-node ול-instance בענן. הסכנה היא over-merging דרך מזהים לא ייחודיים – ראה את ה-follow-up."
  },
  followUps: [
    { q: { en: "After running this on real data, half the fleet merged into one giant 'host'. What happened?", he: "אחרי שהרצת את זה על דאטה אמיתי, חצי מה-fleet התמזג ל-'host' ענק אחד. מה קרה?" },
      a: { en: "A non-unique identifier bridged components: a NAT gateway or load balancer IP that many hosts report, a reused DHCP lease, a default MAC on virtual interfaces (docker0, 02:42:...). Fix: drop identifiers seen on too many records, scope IPs by VPC/time window, and prefer strong ids (serial, instance id) over weak ones.", he: "מזהה לא ייחודי גישר בין רכיבים: IP של NAT gateway או load balancer שהרבה hosts מדווחים, DHCP lease שמוחזר, MAC ברירת מחדל על ממשקים וירטואליים (docker0, 02:42:...). התיקון: לזרוק מזהים שמופיעים ביותר מדי רשומות, לתחום IPs לפי VPC/חלון זמן, ולהעדיף מזהים חזקים (serial, instance id) על חלשים." } },
    { q: { en: "Records stream in continuously. How do you keep merged groups up to date?", he: "רשומות מגיעות בזרם רציף. איך שומרים את הקבוצות הממוזגות מעודכנות?" },
      a: { en: "Union-Find is naturally incremental: each new record is a few find/union calls in near O(1). Keep the root -> group map updated on union (merge smaller group into larger). Deletions are the hard part: periodically rebuild from scratch.", he: "Union-Find אינקרמנטלי מטבעו: כל רשומה חדשה היא כמה קריאות find/union בכמעט O(1). מעדכנים את ה-map של root -> קבוצה בכל union (ממזגים את הקבוצה הקטנה לגדולה). מחיקות הן החלק הקשה: בונים מחדש מאפס מדי פעם." } }
  ]
});

INFRA.problems.push({
  id: "min-cost-dc-cabling",
  icon: "🕸️",
  difficulty: "medium",
  tags: ["graph", "minimum-spanning-tree", "prim", "kruskal"],
  leetcode: "1584",
  title: { en: "Cheapest Cabling to Connect All Racks (MST)", he: "החיווט הזול ביותר לחיבור כל ה-racks (MST)" },
  statement: {
    en: `<p>You are designing the fibre plant for a new hall. <code>points[i] = [x, y]</code> is the floor position of rack <code>i</code>. Cable trays run along the aisles, so a cable between racks <code>i</code> and <code>j</code> costs their <strong>Manhattan distance</strong> <code>|xi - xj| + |yi - yj|</code>.</p>
<p>Return the minimum total cable cost so that every rack can reach every other rack (directly or through other racks).</p>`,
    he: `<p>אתה מתכנן את תשתית הסיבים לאולם חדש. <code>points[i] = [x, y]</code> הוא המיקום של rack <code>i</code> על הרצפה. ה-cable trays עוברים לאורך המעברים, אז כבל בין rack <code>i</code> ל-rack <code>j</code> עולה את <strong>מרחק מנהטן</strong> ביניהם: <code>|xi - xj| + |yi - yj|</code>.</p>
<p>תחזיר את עלות הכבלים הכוללת המינימלית כך שכל rack יוכל להגיע לכל rack אחר (ישירות או דרך racks אחרים).</p>`
  },
  examples: `Input:  points = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]
Output: 20

Input:  points = [[3, 12], [-2, 5], [-4, 1]]
Output: 18

Input:  points = [[0, 0]]
Output: 0`,
  hints: [
    { en: "Connecting all nodes with minimum total edge weight, with no need for loops, is a Minimum Spanning Tree.", he: "לחבר את כל ה-nodes בסכום משקלים מינימלי, בלי צורך בלולאות – זה Minimum Spanning Tree." },
    { en: "Every pair of racks is a possible edge, so the graph is complete: n^2 edges. Kruskal would sort all of them.", he: "כל זוג racks הוא קשת אפשרית, אז הגרף מלא: n^2 קשתות. Kruskal היה ממיין את כולן." },
    { en: "Prim's algorithm with a plain array (no heap) is O(n^2) and ideal for dense graphs: keep, for each rack outside the tree, the cheapest cable to any rack inside it.", he: "Prim עם מערך רגיל (בלי heap) הוא O(n^2) ומושלם לגרפים צפופים: לכל rack מחוץ לעץ שומרים את הכבל הזול ביותר לאיזשהו rack בתוך העץ." }
  ],
  solution: String.raw`from typing import List


def min_cabling_cost(points: List[List[int]]) -> int:
    """Prim's MST on a complete graph, O(n^2) with arrays (no heap needed)."""
    n = len(points)
    INF = float("inf")
    best = [INF] * n          # best[i] = cheapest cable from rack i to the tree
    in_tree = [False] * n
    best[0] = 0               # start the tree at rack 0
    total = 0

    for _ in range(n):
        # pick the cheapest rack not yet connected
        u = min((i for i in range(n) if not in_tree[i]), key=lambda i: best[i])
        in_tree[u] = True
        total += best[u]
        ux, uy = points[u]
        # rack u is now in the tree: maybe it offers a cheaper cable to others
        for v in range(n):
            if not in_tree[v]:
                cost = abs(ux - points[v][0]) + abs(uy - points[v][1])
                if cost < best[v]:
                    best[v] = cost
    return total


if __name__ == "__main__":
    print(min_cabling_cost([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]))  # 20
    print(min_cabling_cost([[3, 12], [-2, 5], [-4, 1]]))                 # 18
    print(min_cabling_cost([[0, 0]]))                                    # 0
`,
  explain: {
    en: `<p>"Connect everything at minimum total cost" is the definition of a <strong>Minimum Spanning Tree</strong>: <code>n - 1</code> edges, no cycles (a cycle always has a removable edge, so it can never be cheapest), minimum sum. Both classic algorithms rely on the <em>cut property</em>: for any split of the nodes into two groups, the cheapest edge crossing the split is safe to include.</p>
<ul><li><strong>Prim</strong> grows one tree from a start node, always adding the cheapest edge leaving the tree. With an array of "best known cost to the tree" per node, each step is O(n) and the total is O(n^2).</li>
<li><strong>Kruskal</strong> sorts all edges and adds them cheapest-first, skipping any edge whose endpoints are already connected (Union-Find — same as the redundant-cable problem). O(E log E).</li></ul>
<p>Here the graph is complete (every pair of racks can be cabled), so E = n^2/2. Kruskal would be O(n^2 log n) and store every edge; array-based Prim is O(n^2) time and O(n) memory. For sparse graphs (E close to n) the trade-off flips: Kruskal or heap-based Prim.</p>
<p><strong>Pattern recognition:</strong> when you see "connect all X with minimum total cost", think <strong>MST</strong> (Prim for dense, Kruskal for sparse). Do not confuse it with "cheapest path between two nodes", which is shortest path (Dijkstra) — an MST does not minimise any particular path.</p>`,
    he: `<p>"לחבר הכול בעלות כוללת מינימלית" זו ההגדרה של <strong>Minimum Spanning Tree</strong>: <code>n - 1</code> קשתות, בלי מעגלים (במעגל תמיד יש קשת שאפשר להוריד, אז הוא אף פעם לא הכי זול), סכום מינימלי. שני האלגוריתמים הקלאסיים מסתמכים על <em>cut property</em>: לכל חלוקה של ה-nodes לשתי קבוצות, הקשת הזולה ביותר שחוצה את החלוקה בטוחה להכללה.</p>
<ul><li><strong>Prim</strong> מגדל עץ אחד מ-node התחלתי, ותמיד מוסיף את הקשת הזולה ביותר שיוצאת מהעץ. עם מערך של "העלות הכי טובה שידועה לעץ" לכל node, כל צעד הוא O(n) והסך הכול O(n^2).</li>
<li><strong>Kruskal</strong> ממיין את כל הקשתות ומוסיף אותן מהזולה ליקרה, ומדלג על קשת שהקצוות שלה כבר מחוברים (Union-Find – כמו בבעיית הכבל המיותר). O(E log E).</li></ul>
<p>כאן הגרף מלא (אפשר לחווט כל זוג racks), אז E = n^2/2. Kruskal היה O(n^2 log n) ושומר את כל הקשתות; Prim עם מערך הוא O(n^2) זמן ו-O(n) זיכרון. בגרפים דלילים (E קרוב ל-n) ה-trade-off מתהפך: Kruskal או Prim עם heap.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "לחבר את כל ה-X בעלות כוללת מינימלית" – תחשוב <strong>MST</strong> (Prim לגרף צפוף, Kruskal לדליל). אל תבלבל עם "המסלול הזול ביותר בין שני nodes", שזה shortest path (Dijkstra) – MST לא ממזער אף מסלול ספציפי.</p>`
  },
  complexity: "Time O(n^2), Space O(n)",
  whyInfra: {
    en: "Physical network design (fibre between racks, halls, campus buildings, or dark fibre between DCs) starts from an MST as the cheapest connected baseline, then adds redundancy. Multicast distribution trees and overlay meshes (e.g. choosing which sites peer directly) are spanning-tree problems, and Kruskal's 'skip the edge that closes a loop' is the same idea STP enforces on L2. Clustering algorithms on latency graphs (single-linkage = MST) are used to group nodes into regions or cells.",
    he: "תכנון רשת פיזית (סיבים בין racks, אולמות, בניינים בקמפוס, או dark fibre בין DCs) מתחיל מ-MST כ-baseline הכי זול שמחובר, ואז מוסיפים redundancy. עצי הפצה של multicast ו-overlay meshes (למשל אילו אתרים יעשו peering ישיר) הם בעיות spanning tree, וה-'דלג על קשת שסוגרת לולאה' של Kruskal זה אותו רעיון ש-STP אוכף ב-L2. אלגוריתמי clustering על גרפי latency (single-linkage = MST) משמשים לחלוקת nodes ל-regions או cells."
  },
  followUps: [
    { q: { en: "Your manager asks: 'is the MST design production-ready?'", he: "המנהל שואל: 'תכנון ה-MST מוכן ל-production?'" },
      a: { en: "No — a tree has zero redundancy: any single cable cut partitions the network. Real designs need 2-edge-connectivity (or 2 disjoint paths, as in leaf-spine). Start from the MST and add the cheapest edges that remove every bridge, or design a known redundant topology directly.", he: "לא – לעץ אין שום redundancy: כל חתך של כבל בודד מפצל את הרשת. תכנון אמיתי צריך 2-edge-connectivity (או 2 מסלולים זרים, כמו ב-leaf-spine). מתחילים מה-MST ומוסיפים את הקשתות הזולות שמבטלות כל bridge, או מתכננים ישר טופולוגיה redundant מוכרת." } },
    { q: { en: "Write it with Kruskal instead.", he: "תכתוב את זה עם Kruskal במקום." },
      a: { en: "Generate all (cost, i, j) pairs, sort them, and run Union-Find: add an edge when union(i, j) succeeds, stop after n - 1 edges. Simpler to explain, but O(n^2 log n) time and O(n^2) memory here.", he: "מייצרים את כל הזוגות (cost, i, j), ממיינים, ומריצים Union-Find: מוסיפים קשת כש-union(i, j) מצליח, ועוצרים אחרי n - 1 קשתות. יותר פשוט להסביר, אבל כאן זה O(n^2 log n) זמן ו-O(n^2) זיכרון." } }
  ]
});

INFRA.problems.push({
  id: "az-bipartite-replicas",
  icon: "⚖️",
  difficulty: "medium",
  tags: ["graph", "bfs", "bipartite", "coloring"],
  leetcode: "785",
  title: { en: "Split Replicas Across Two AZs (Bipartite Check)", he: "חלוקת replicas לשני AZs (בדיקת Bipartite)" },
  statement: {
    en: `<p>You run <code>n</code> database nodes (<code>0..n-1</code>) in a region with only <strong>two</strong> availability zones. <code>graph[i]</code> lists the nodes that hold a replica of the same shard as node <code>i</code> — two such nodes must <strong>not</strong> be in the same AZ, or one AZ outage takes out both copies. The relation is symmetric and the graph may be disconnected.</p>
<p>Return <code>True</code> if every node can be assigned to AZ-a or AZ-b with no conflicting pair in the same AZ, otherwise <code>False</code>.</p>`,
    he: `<p>אתה מריץ <code>n</code> nodes של DB (<code>0..n-1</code>) ב-region עם <strong>שני</strong> availability zones בלבד. <code>graph[i]</code> מפרט את ה-nodes שמחזיקים replica של אותו shard כמו node <code>i</code> – שני nodes כאלה <strong>אסור</strong> שיהיו באותו AZ, אחרת outage של AZ אחד מוריד את שני העותקים. היחס סימטרי, והגרף יכול להיות לא קשיר.</p>
<p>תחזיר <code>True</code> אם אפשר לשבץ כל node ל-AZ-a או ל-AZ-b בלי אף זוג מתנגש באותו AZ, אחרת <code>False</code>.</p>`
  },
  examples: `Input:  graph = [[1, 3], [0, 2], [1, 3], [0, 2]]
Output: True    # AZ-a = {0, 2}, AZ-b = {1, 3}

Input:  graph = [[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]
Output: False   # 0, 1, 2 all conflict with each other: a triangle needs 3 AZs`,
  hints: [
    { en: "This is 2-colouring: give each node a colour so every edge connects different colours.", he: "זה צביעה ב-2 צבעים: לתת לכל node צבע כך שכל קשת מחברת צבעים שונים." },
    { en: "Once you colour one node, all its neighbours are forced to the other colour, and so on. BFS propagates the forced choices.", he: "ברגע שצבעת node אחד, כל השכנים שלו נאלצים לצבע השני, וכן הלאה. BFS מפיץ את הבחירות הכפויות." },
    { en: "If an edge ever connects two nodes of the same colour, it is impossible (an odd cycle). Remember to start a BFS from every uncoloured node — the graph may be disconnected.", he: "אם קשת אי פעם מחברת שני nodes באותו צבע – אי אפשר (מעגל באורך אי-זוגי). אל תשכח להתחיל BFS מכל node לא צבוע – הגרף יכול להיות לא קשיר." }
  ],
  solution: String.raw`from collections import deque
from typing import List


def can_split_two_azs(graph: List[List[int]]) -> bool:
    """BFS 2-colouring. az[i] is 0 or 1 once assigned, -1 before."""
    az = [-1] * len(graph)
    for start in range(len(graph)):
        if az[start] != -1:
            continue                       # already placed by an earlier component
        az[start] = 0                      # free choice for a new component
        queue = deque([start])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if az[v] == -1:
                    az[v] = 1 - az[u]      # forced: opposite AZ of its conflict
                    queue.append(v)
                elif az[v] == az[u]:
                    return False           # two conflicting replicas in one AZ
    return True


if __name__ == "__main__":
    print(can_split_two_azs([[1, 3], [0, 2], [1, 3], [0, 2]]))         # True
    print(can_split_two_azs([[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]))   # False
`,
  explain: {
    en: `<p>Assigning two AZs so that no edge stays inside one AZ is exactly asking whether the graph is <strong>bipartite</strong> (2-colourable). There is no real choice involved: within a connected component, once the first node is placed, every other placement is forced (neighbours of AZ-a must be AZ-b, their neighbours AZ-a...). BFS just propagates those forced choices and checks for a contradiction.</p>
<p>A contradiction happens exactly when the component contains an <strong>odd cycle</strong> — walk around a triangle and you need a third colour. So "bipartite" equals "no odd cycle". Each component gets an independent free choice for its first node, which is why we loop over all start nodes.</p>
<p><strong>Pattern recognition:</strong> when you see "split into two groups so that conflicting pairs are separated" (two teams, two AZs, two shifts, two racks), think <strong>bipartite check / 2-colouring with BFS or DFS</strong>. With 3 or more groups it becomes graph colouring, which is NP-hard in general.</p>`,
    he: `<p>לשבץ לשני AZs כך שאף קשת לא נשארת בתוך AZ אחד – זו בדיוק השאלה אם הגרף <strong>bipartite</strong> (ניתן לצביעה ב-2 צבעים). אין פה באמת בחירה: בתוך רכיב קשירות, ברגע שהצבת את ה-node הראשון, כל שאר ההצבות כפויות (השכנים של AZ-a חייבים להיות ב-AZ-b, השכנים שלהם ב-AZ-a...). BFS רק מפיץ את הבחירות הכפויות ובודק אם יש סתירה.</p>
<p>סתירה קורית בדיוק כשברכיב יש <strong>מעגל באורך אי-זוגי</strong> – תסתובב סביב משולש ותצטרך צבע שלישי. אז "bipartite" שקול ל"אין מעגל אי-זוגי". לכל רכיב יש בחירה חופשית ובלתי תלויה ל-node הראשון שלו, ולכן עוברים בלולאה על כל ה-nodes כנקודות התחלה.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "לחלק לשתי קבוצות כך שזוגות מתנגשים יופרדו" (שני צוותים, שני AZs, שתי משמרות, שני racks) – תחשוב <strong>בדיקת bipartite / צביעה ב-2 צבעים עם BFS או DFS</strong>. עם 3 קבוצות ומעלה זה הופך ל-graph colouring, שהוא NP-hard במקרה הכללי.</p>`
  },
  complexity: "Time O(V + E), Space O(V)",
  whyInfra: {
    en: "Anti-affinity is everywhere in infra: Kubernetes podAntiAffinity and topologySpreadConstraints, Kafka rack-aware replica assignment (broker.rack), Cassandra NetworkTopologyStrategy, and RDS/Aurora Multi-AZ all exist to keep copies of the same data out of one failure domain. A bipartite check tells you whether a region with two AZs can satisfy your constraints at all — if the conflict graph has a triangle (replication factor 3), it cannot, which is why RF=3 deployments want 3 AZs.",
    he: "anti-affinity נמצא בכל מקום בתשתיות: podAntiAffinity ו-topologySpreadConstraints ב-Kubernetes, הקצאת replicas מודעת-rack ב-Kafka (broker.rack), NetworkTopologyStrategy ב-Cassandra, ו-Multi-AZ ב-RDS/Aurora – כולם קיימים כדי להחזיק עותקים של אותו דאטה מחוץ ל-failure domain אחד. בדיקת bipartite אומרת לך אם region עם שני AZs בכלל יכול לעמוד באילוצים – אם בגרף ההתנגשויות יש משולש (replication factor 3), אי אפשר, ולכן deployments עם RF=3 רוצים 3 AZs."
  },
  followUps: [
    { q: { en: "Return the actual AZ assignment instead of True/False.", he: "תחזיר את השיבוץ ל-AZs עצמו במקום True/False." },
      a: { en: "Return the az array (or two lists built from it) when no conflict is found. Each component's colouring can be flipped independently, which you can use to balance the number of nodes per AZ.", he: "מחזירים את מערך az (או שתי רשימות שנבנות ממנו) כשלא נמצאה התנגשות. אפשר להפוך את הצביעה של כל רכיב בנפרד, ולהשתמש בזה כדי לאזן את מספר ה-nodes בכל AZ." } },
    { q: { en: "The region now has three AZs. Same algorithm?", he: "עכשיו ב-region יש שלושה AZs. אותו אלגוריתם?" },
      a: { en: "No — 3-colouring is NP-complete. In practice you use greedy colouring (e.g. DSatur), backtracking for small graphs, or avoid the general problem: replicas of one shard form a clique of size RF, so place them round-robin across AZs per shard, which is what schedulers' spread constraints do.", he: "לא – צביעה ב-3 צבעים היא NP-complete. בפועל משתמשים בצביעה greedy (למשל DSatur), backtracking לגרפים קטנים, או נמנעים מהבעיה הכללית: ה-replicas של shard אחד הם clique בגודל RF, אז מפזרים אותם round-robin בין AZs לכל shard – וזה מה ש-spread constraints של schedulers עושים." } }
  ]
});

INFRA.problems.push({
  id: "cheapest-egress-k-hops",
  icon: "💸",
  difficulty: "medium",
  tags: ["graph", "bellman-ford", "shortest-path", "dynamic-programming"],
  leetcode: "787",
  title: { en: "Cheapest Egress Route Within K Relays", he: "מסלול ה-egress הזול ביותר עם עד K תחנות ביניים" },
  statement: {
    en: `<p>You replicate data between <code>n</code> regions (<code>0..n-1</code>). <code>links[i] = [from, to, cost]</code> is a one-way transfer path with a per-GB egress <code>cost</code>. To keep latency acceptable, data may pass through <strong>at most <code>k</code> intermediate regions</strong> (relays) between <code>src</code> and <code>dst</code>.</p>
<p>Return the cheapest total cost from <code>src</code> to <code>dst</code> using at most <code>k</code> relays, or <code>-1</code> if no such route exists.</p>`,
    he: `<p>אתה משכפל דאטה בין <code>n</code> regions (<code>0..n-1</code>). <code>links[i] = [from, to, cost]</code> הוא נתיב העברה חד-כיווני עם <code>cost</code> של egress לכל GB. כדי לשמור על latency סביר, הדאטה יכול לעבור דרך <strong>לכל היותר <code>k</code> regions באמצע</strong> (relays) בין <code>src</code> ל-<code>dst</code>.</p>
<p>תחזיר את העלות הכוללת הזולה ביותר מ-<code>src</code> ל-<code>dst</code> עם לכל היותר <code>k</code> relays, או <code>-1</code> אם אין מסלול כזה.</p>`
  },
  examples: `Input:  n = 4, links = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],
        src = 0, dst = 3, k = 1
Output: 700     # 0 -> 1 -> 3; the cheaper 0 -> 1 -> 2 -> 3 (400) needs 2 relays

Input:  n = 3, links = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1
Output: 200

Input:  n = 3, links = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0
Output: 500     # direct link only`,
  hints: [
    { en: "k relays means at most k + 1 links. Plain Dijkstra ignores the hop limit: it may lock in a cheap path that uses too many hops.", he: "k relays אומר לכל היותר k + 1 לינקים. Dijkstra רגיל מתעלם ממגבלת ה-hops: הוא יכול לקבע מסלול זול שמשתמש ביותר מדי hops." },
    { en: "Bellman-Ford after i rounds of relaxing every edge knows the cheapest cost using at most i edges. Run exactly k + 1 rounds.", he: "Bellman-Ford, אחרי i סבבים של relax על כל הקשתות, יודע את העלות הזולה ביותר עם לכל היותר i קשתות. תריץ בדיוק k + 1 סבבים." },
    { en: "In each round, read costs from a copy of the previous round. Otherwise one round can chain several edges and break the hop limit.", he: "בכל סבב, תקרא עלויות מעותק של הסבב הקודם. אחרת סבב אחד יכול לשרשר כמה קשתות ולשבור את מגבלת ה-hops." }
  ],
  solution: String.raw`from typing import List


def cheapest_route(n: int, links: List[List[int]], src: int, dst: int, k: int) -> int:
    """Bellman-Ford limited to k + 1 rounds (= at most k + 1 links)."""
    INF = float("inf")
    cost = [INF] * n
    cost[src] = 0
    for _ in range(k + 1):
        prev = cost[:]                       # snapshot: only paths with one fewer link
        for u, v, w in links:
            if prev[u] + w < cost[v]:        # extend a (round-1)-link path by one link
                cost[v] = prev[u] + w
    return -1 if cost[dst] == INF else cost[dst]


if __name__ == "__main__":
    links = [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]]
    print(cheapest_route(4, links, 0, 3, 1))                                   # 700
    print(cheapest_route(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1))  # 200
    print(cheapest_route(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0))  # 500
`,
  explain: {
    en: `<p>Without the hop limit this is a plain shortest path. The limit breaks Dijkstra's key assumption: Dijkstra finalises a node at its cheapest cost, but the cheapest way to reach region 2 might use too many hops to continue on to <code>dst</code>, while a pricier-but-shorter path would have been valid. The "best" state is no longer just the node — it is (node, hops used).</p>
<p><strong>Bellman-Ford</strong> handles this naturally because it is a DP over the number of edges: after round <code>i</code>, <code>cost[v]</code> is the cheapest cost to <code>v</code> using at most <code>i</code> edges. We run exactly <code>k + 1</code> rounds and read the answer.</p>
<p>The one subtle bug: if you relax edges in place, an update made earlier in the same round can be used again later in that round, letting one round chain two or three links. Reading from the <code>prev</code> snapshot guarantees each round adds at most one link.</p>
<p><strong>Pattern recognition:</strong> when you see "shortest/cheapest path <em>with at most K edges/stops</em>", think <strong>Bellman-Ford limited to K+1 rounds</strong> (or BFS by levels, or Dijkstra over the state (node, stops)). Negative weights also point to Bellman-Ford.</p>`,
    he: `<p>בלי מגבלת ה-hops זה shortest path רגיל. המגבלה שוברת את ההנחה המרכזית של Dijkstra: Dijkstra מקבע node בעלות הזולה ביותר שלו, אבל הדרך הזולה ביותר להגיע ל-region 2 אולי משתמשת ביותר מדי hops כדי להמשיך ל-<code>dst</code>, בזמן שמסלול יקר יותר אבל קצר יותר היה תקין. ה-state ה"טוב ביותר" הוא כבר לא רק ה-node – הוא (node, כמה hops השתמשנו).</p>
<p><strong>Bellman-Ford</strong> מטפל בזה בטבעיות כי הוא DP על מספר הקשתות: אחרי סבב <code>i</code>, <code>cost[v]</code> היא העלות הזולה ביותר ל-<code>v</code> עם לכל היותר <code>i</code> קשתות. מריצים בדיוק <code>k + 1</code> סבבים וקוראים את התשובה.</p>
<p>הבאג העדין היחיד: אם עושים relax על הקשתות in place, עדכון שנעשה מוקדם בסבב יכול לשמש שוב מאוחר יותר באותו סבב, וסבב אחד ישרשר שניים או שלושה לינקים. קריאה מה-snapshot <code>prev</code> מבטיחה שכל סבב מוסיף לכל היותר לינק אחד.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "מסלול קצר/זול ביותר <em>עם לכל היותר K קשתות/עצירות</em>" – תחשוב <strong>Bellman-Ford מוגבל ל-K+1 סבבים</strong> (או BFS לפי רמות, או Dijkstra על ה-state (node, stops)). גם משקלים שליליים מכוונים ל-Bellman-Ford.</p>`
  },
  complexity: "Time O(k · E), Space O(n)",
  whyInfra: {
    en: "Cloud egress is priced per GB and differs per path (inter-region vs. inter-AZ vs. internet vs. via a CDN or a transit provider), so multi-region replication and backup routing is a cheapest-path problem. The hop limit models latency budgets and TTL. Distance-vector routing protocols (RIP, and conceptually BGP) are distributed Bellman-Ford: each router repeatedly relaxes routes learned from neighbours, and RIP's 15-hop limit is the k in this problem.",
    he: "egress בענן מתומחר לפי GB ושונה לפי מסלול (inter-region מול inter-AZ מול אינטרנט מול דרך CDN או transit provider), אז ניתוב של replication וגיבויים בין regions הוא בעיית cheapest path. מגבלת ה-hops ממדלת תקציבי latency ו-TTL. פרוטוקולי distance-vector (RIP, וקונספטואלית גם BGP) הם Bellman-Ford מבוזר: כל ראוטר שוב ושוב עושה relax ל-routes שהוא לומד מהשכנים, ומגבלת 15 ה-hops של RIP היא ה-k בבעיה הזו."
  },
  followUps: [
    { q: { en: "Solve it with Dijkstra.", he: "תפתור עם Dijkstra." },
      a: { en: "Run Dijkstra over states (cost, node, links_used). Skip expanding a state whose links_used is already k + 1, and keep best_links[node] so you only re-expand a node if you arrive with fewer links than before. The first time dst is popped is the answer.", he: "מריצים Dijkstra על states של (cost, node, links_used). לא מרחיבים state שה-links_used שלו כבר k + 1, ומחזיקים best_links[node] כדי להרחיב node שוב רק אם הגענו אליו עם פחות לינקים מקודם. הפעם הראשונה ש-dst יוצא מה-heap היא התשובה." } },
    { q: { en: "Also return the route so the replication job can configure it.", he: "תחזיר גם את המסלול, כדי שה-job של ה-replication יוכל להגדיר אותו." },
      a: { en: "Keep a parent per round (parent[round][v] = u) or carry the path in the Dijkstra state. A single parent array is not enough with the hop limit, because the best predecessor depends on how many hops are left.", he: "שומרים parent לכל סבב (parent[round][v] = u) או נושאים את המסלול ב-state של Dijkstra. מערך parent יחיד לא מספיק עם מגבלת hops, כי ה-predecessor הכי טוב תלוי בכמה hops נשארו." } }
  ]
});

INFRA.problems.push({
  id: "longest-prefix-match-trie",
  icon: "🌳",
  difficulty: "medium",
  tags: ["trie", "design", "bit-manipulation", "networking"],
  leetcode: "208",
  title: { en: "Routing Table: Longest Prefix Match with a Trie", he: "Routing table: longest prefix match עם Trie" },
  statement: {
    en: `<p><strong>Part 1 (LeetCode 208).</strong> Implement a <code>Trie</code> with <code>insert(word)</code>, <code>search(word)</code> (exact match) and <code>starts_with(prefix)</code>.</p>
<p><strong>Part 2 — the infra version.</strong> Build an IPv4 routing table with <code>add_route(cidr, next_hop)</code> (e.g. <code>"10.1.0.0/16" -&gt; "vpc-peer"</code>) and <code>lookup(ip)</code>, which returns the next hop of the <strong>most specific</strong> route that contains <code>ip</code> — the longest matching prefix — or <code>None</code> if nothing matches.</p>`,
    he: `<p><strong>חלק 1 (LeetCode 208).</strong> תממש <code>Trie</code> עם <code>insert(word)</code>, <code>search(word)</code> (התאמה מדויקת) ו-<code>starts_with(prefix)</code>.</p>
<p><strong>חלק 2 – גרסת התשתיות.</strong> תבנה routing table של IPv4 עם <code>add_route(cidr, next_hop)</code> (למשל <code>"10.1.0.0/16" -&gt; "vpc-peer"</code>) ו-<code>lookup(ip)</code>, שמחזיר את ה-next hop של ה-route <strong>הכי ספציפי</strong> שמכיל את <code>ip</code> – ה-prefix התואם הארוך ביותר – או <code>None</code> אם אין התאמה.</p>`
  },
  examples: `Part 1:
insert("apple"); search("apple") -> True; search("app") -> False
starts_with("app") -> True; insert("app"); search("app") -> True

Part 2:
add_route("0.0.0.0/0",   "igw")
add_route("10.0.0.0/8",  "tgw")
add_route("10.1.0.0/16", "vpc-peer")
add_route("10.1.2.0/24", "local")
lookup("10.1.2.7")   -> "local"
lookup("10.1.9.9")   -> "vpc-peer"
lookup("10.200.0.1") -> "tgw"
lookup("8.8.8.8")    -> "igw"`,
  hints: [
    { en: "A trie stores strings character by character along a path from the root; shared prefixes share nodes. Mark the nodes where a word ends.", he: "Trie שומר מחרוזות תו-אחר-תו לאורך מסלול מה-root; prefixes משותפים חולקים nodes. מסמנים את ה-nodes שבהם מילה נגמרת." },
    { en: "An IPv4 prefix /n is just the first n bits of a 32-bit number. Build a binary trie: each node has children for bit 0 and bit 1, and a /n route is stored at depth n.", he: "prefix של IPv4 בגודל /n הוא פשוט n הביטים הראשונים של מספר 32-bit. תבנה binary trie: לכל node יש ילדים לביט 0 ולביט 1, ו-route של /n נשמר בעומק n." },
    { en: "To look up an IP, walk its bits from the most significant one and remember the last route you passed. When the path ends, that remembered route is the longest match.", he: "כדי לחפש IP, הולכים על הביטים שלו מהמשמעותי ביותר וזוכרים את ה-route האחרון שעברנו. כשהמסלול נגמר, ה-route שזכרנו הוא ההתאמה הארוכה ביותר." }
  ],
  solution: String.raw`import ipaddress
from typing import Optional


# ---------- Part 1: classic Trie (LeetCode 208) ----------
class Trie:
    def __init__(self):
        self.children = {}      # char -> Trie
        self.is_end = False     # a word ends exactly here

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            node = node.children.setdefault(ch, Trie())
        node.is_end = True

    def _walk(self, s: str) -> Optional["Trie"]:
        node = self
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_end

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None


# ---------- Part 2: binary trie for IPv4 longest prefix match ----------
class RouteNode:
    __slots__ = ("child", "next_hop")

    def __init__(self):
        self.child = [None, None]   # child[bit]
        self.next_hop = None        # set if a route ends at this depth


class RoutingTable:
    def __init__(self):
        self.root = RouteNode()     # depth 0 = the /0 default route

    def add_route(self, cidr: str, next_hop: str) -> None:
        net = ipaddress.IPv4Network(cidr)          # strict: host bits must be 0
        addr, plen = int(net.network_address), net.prefixlen
        node = self.root
        for i in range(plen):                      # only the first plen bits matter
            bit = (addr >> (31 - i)) & 1
            if node.child[bit] is None:
                node.child[bit] = RouteNode()
            node = node.child[bit]
        node.next_hop = next_hop

    def lookup(self, ip: str) -> Optional[str]:
        addr = int(ipaddress.IPv4Address(ip))
        node, best = self.root, self.root.next_hop  # /0 matches everything
        for i in range(32):
            node = node.child[(addr >> (31 - i)) & 1]
            if node is None:
                break                              # no longer prefix exists
            if node.next_hop is not None:
                best = node.next_hop               # a longer (more specific) match
        return best


if __name__ == "__main__":
    t = Trie()
    t.insert("apple")
    print(t.search("apple"), t.search("app"), t.starts_with("app"))  # True False True
    t.insert("app")
    print(t.search("app"))                                           # True

    rt = RoutingTable()
    rt.add_route("0.0.0.0/0", "igw")
    rt.add_route("10.0.0.0/8", "tgw")
    rt.add_route("10.1.0.0/16", "vpc-peer")
    rt.add_route("10.1.2.0/24", "local")
    for ip in ["10.1.2.7", "10.1.9.9", "10.200.0.1", "8.8.8.8"]:
        print(ip, rt.lookup(ip))   # local, vpc-peer, tgw, igw
`,
  explain: {
    en: `<p><strong>Trie basics.</strong> Each node represents a prefix; following a child adds one symbol. All words that share a prefix share the path for it, so <code>insert</code>, <code>search</code> and <code>starts_with</code> cost O(length of the key), independent of how many keys are stored. The <code>is_end</code> flag is what separates "app is a word" from "app is only a prefix of apple".</p>
<p><strong>From strings to IPs.</strong> A CIDR like <code>10.1.0.0/16</code> means "any address whose first 16 bits equal those of 10.1.0.0". So use an alphabet of {0, 1} and store each route at depth = prefix length: <code>/0</code> at the root, <code>/8</code> at depth 8, <code>/24</code> at depth 24. All routes that contain a given IP lie on <em>one</em> root-to-leaf path — the path spelled by the IP's bits.</p>
<p><strong>Longest prefix match</strong> is then a single walk down that path, remembering the last node that holds a route. For <code>10.1.9.9</code>, the walk passes <code>/0 (igw)</code>, <code>/8 (tgw)</code>, <code>/16 (vpc-peer)</code>, then bit 22 differs from the <code>10.1.2.0/24</code> branch and the walk stops: answer <code>vpc-peer</code>. At most 32 steps, regardless of table size — compare with scanning every route and keeping the longest match, O(routes) per packet.</p>
<p><strong>Pattern recognition:</strong> when you see "prefix", "autocomplete", "most specific match" or "many lookups against a fixed set of keys sharing prefixes", think <strong>trie</strong>. For bits (IPs, hashes), think binary trie.</p>`,
    he: `<p><strong>יסודות ה-Trie.</strong> כל node מייצג prefix; מעבר לילד מוסיף סימן אחד. כל המילים שחולקות prefix חולקות את המסלול שלו, אז <code>insert</code>, <code>search</code> ו-<code>starts_with</code> עולים O(אורך המפתח), בלי קשר לכמה מפתחות שמורים. הדגל <code>is_end</code> הוא מה שמבדיל בין "app היא מילה" ל-"app היא רק prefix של apple".</p>
<p><strong>ממחרוזות ל-IPs.</strong> CIDR כמו <code>10.1.0.0/16</code> אומר "כל כתובת ש-16 הביטים הראשונים שלה שווים לאלה של 10.1.0.0". אז משתמשים ב-alphabet של {0, 1} ושומרים כל route בעומק = אורך ה-prefix: <code>/0</code> ב-root, <code>/8</code> בעומק 8, <code>/24</code> בעומק 24. כל ה-routes שמכילים IP מסוים נמצאים על מסלול <em>אחד</em> מה-root – המסלול שהביטים של ה-IP מאייתים.</p>
<p><strong>Longest prefix match</strong> הוא אז הליכה אחת במורד המסלול הזה, תוך זכירת ה-node האחרון שמחזיק route. עבור <code>10.1.9.9</code>, ההליכה עוברת ב-<code>/0 (igw)</code>, <code>/8 (tgw)</code>, <code>/16 (vpc-peer)</code>, ואז ביט 22 שונה מהענף של <code>10.1.2.0/24</code> וההליכה נעצרת: התשובה <code>vpc-peer</code>. לכל היותר 32 צעדים, בלי קשר לגודל הטבלה – לעומת סריקה של כל ה-routes ושמירת ההתאמה הארוכה, O(routes) לכל פקטה.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "prefix", "autocomplete", "ההתאמה הכי ספציפית" או "הרבה חיפושים מול קבוצה קבועה של מפתחות שחולקים prefixes" – תחשוב <strong>trie</strong>. לביטים (IPs, hashes) – binary trie.</p>`
  },
  complexity: "Trie: O(L) per op. Routing: add O(prefix length) ≤ 32, lookup O(32) = O(1); Space O(total prefix bits)",
  whyInfra: {
    en: "Every IP router does longest prefix match per packet: the Linux kernel's FIB is an LC-trie (level-compressed trie, see /proc/net/fib_trie), BSD uses a radix (Patricia) tree, and hardware routers use TCAM to match all prefixes in parallel in one clock cycle. AWS VPC route tables, Kubernetes CNI routes and 'ip route get 10.1.9.9' all resolve by the most specific route. Tries also back DNS zone lookups, etcd/Consul prefix watches, HTTP routers in Envoy/nginx (prefix routes) and Go's httprouter.",
    he: "כל IP router עושה longest prefix match לכל פקטה: ה-FIB של קרנל Linux הוא LC-trie (level-compressed trie, ראה /proc/net/fib_trie), ב-BSD משתמשים ב-radix (Patricia) tree, וראוטרים בחומרה משתמשים ב-TCAM כדי להתאים את כל ה-prefixes במקביל במחזור שעון אחד. route tables ב-AWS VPC, routes של CNI ב-Kubernetes ו-'ip route get 10.1.9.9' – כולם נפתרים לפי ה-route הכי ספציפי. Tries נמצאים גם מאחורי חיפושי DNS zones, prefix watches ב-etcd/Consul, HTTP routers ב-Envoy/nginx (prefix routes) ו-httprouter של Go."
  },
  followUps: [
    { q: { en: "A full BGP table has ~1M IPv4 prefixes. How do you cut memory and lookup steps?", he: "טבלת BGP מלאה מכילה ~1M prefixes של IPv4. איך מורידים זיכרון וצעדי חיפוש?" },
      a: { en: "Path compression (Patricia/radix trie) collapses chains of single-child nodes, so depth depends on the number of branching points, not 32. Multibit tries use a stride of 4-8 bits per level (fewer memory accesses, more memory). Linux's LC-trie combines both; DIR-24-8 does a single /24-indexed array lookup for most packets.", he: "Path compression (Patricia/radix trie) מכווץ שרשראות של nodes עם ילד יחיד, אז העומק תלוי במספר נקודות הפיצול ולא ב-32. Multibit tries משתמשים ב-stride של 4-8 ביטים לרמה (פחות גישות לזיכרון, יותר זיכרון). ה-LC-trie של Linux משלב את שניהם; DIR-24-8 עושה חיפוש יחיד במערך מאונדקס לפי /24 לרוב הפקטות." } },
    { q: { en: "What changes for IPv6 and for route deletion?", he: "מה משתנה ב-IPv6 ובמחיקת route?" },
      a: { en: "IPv6 is the same algorithm with 128 bits (compression matters even more). To delete, walk to the node, clear next_hop, then prune nodes on the way back up that have no route and no children.", he: "IPv6 זה אותו אלגוריתם עם 128 ביטים (ה-compression חשוב עוד יותר). כדי למחוק, הולכים ל-node, מנקים את next_hop, ואז בדרך חזרה למעלה גוזמים nodes שאין להם route ואין להם ילדים." } }
  ]
});

INFRA.problems.push({
  id: "serialize-merkle-tree",
  icon: "📦",
  difficulty: "hard",
  tags: ["tree", "dfs", "design", "serialization"],
  leetcode: "297",
  title: { en: "Ship a Merkle Tree Over the Wire (Serialize / Deserialize)", he: "שליחת Merkle tree על הרשת (Serialize / Deserialize)" },
  statement: {
    en: `<p>Two replicas run anti-entropy repair: each builds a binary <strong>Merkle tree</strong> of hashes over its key ranges, and replica A must send its tree to replica B to find which ranges differ. Nodes are <code>TreeNode(val, left, right)</code> with an integer <code>val</code> (a truncated hash); the tree is <em>not</em> necessarily complete or balanced, and values may repeat or be negative.</p>
<p>Implement <code>serialize(root) -&gt; str</code> and <code>deserialize(data) -&gt; root</code> so that <code>deserialize(serialize(t))</code> rebuilds exactly the same shape and values. The format is up to you.</p>`,
    he: `<p>שני replicas מריצים anti-entropy repair: כל אחד בונה <strong>Merkle tree</strong> בינארי של hashes על טווחי המפתחות שלו, ו-replica A צריך לשלוח את העץ שלו ל-replica B כדי למצוא אילו טווחים שונים. ה-nodes הם <code>TreeNode(val, left, right)</code> עם <code>val</code> שלם (hash מקוצר); העץ <em>לא</em> בהכרח מלא או מאוזן, וערכים יכולים לחזור על עצמם או להיות שליליים.</p>
<p>תממש <code>serialize(root) -&gt; str</code> ו-<code>deserialize(data) -&gt; root</code> כך ש-<code>deserialize(serialize(t))</code> בונה מחדש בדיוק את אותו מבנה ואותם ערכים. הפורמט לבחירתך.</p>`
  },
  examples: String.raw`Input tree:        1
                  / \
                 2   3
                    / \
                   4   5
serialize   -> "1,2,#,#,3,4,#,#,5,#,#"
deserialize -> the same tree

Input: empty tree
serialize   -> "#"
deserialize -> None`,
  hints: [
    { en: "A pre-order list of values alone is ambiguous: [1, 2] could be 2 as a left or a right child. What extra information removes the ambiguity?", he: "רשימת pre-order של ערכים לבד היא דו-משמעית: [1, 2] יכול להיות 2 כילד שמאלי או ימני. איזה מידע נוסף מבטל את הדו-משמעות?" },
    { en: "Write an explicit marker (e.g. '#') for every missing child. Pre-order with null markers uniquely defines the tree.", he: "תכתוב סמן מפורש (למשל '#') לכל ילד חסר. pre-order עם סמני null מגדיר את העץ באופן חד-ערכי." },
    { en: "To rebuild, consume tokens from an iterator with the same recursion: read a token; '#' means None, otherwise build the node, then its left subtree, then its right subtree.", he: "כדי לבנות מחדש, צורכים tokens מ-iterator עם אותה רקורסיה: קוראים token; '#' זה None, אחרת בונים את ה-node, ואז את תת-העץ השמאלי, ואז את הימני." }
  ],
  solution: String.raw`from typing import Iterator, Optional


class TreeNode:
    def __init__(self, val: int, left: "Optional[TreeNode]" = None,
                 right: "Optional[TreeNode]" = None):
        self.val, self.left, self.right = val, left, right


NULL = "#"


def serialize(root: Optional[TreeNode]) -> str:
    """Pre-order DFS, writing '#' for every missing child. Iterative: no recursion limit."""
    out, stack = [], [root]
    while stack:
        node = stack.pop()
        if node is None:
            out.append(NULL)
            continue
        out.append(str(node.val))
        stack.append(node.right)     # push right first so left is emitted first
        stack.append(node.left)
    return ",".join(out)


def deserialize(data: str) -> Optional[TreeNode]:
    """Rebuild by consuming tokens in the same pre-order the serializer wrote them."""
    tokens: Iterator[str] = iter(data.split(","))

    def build() -> Optional[TreeNode]:
        tok = next(tokens)
        if tok == NULL:
            return None
        node = TreeNode(int(tok))
        node.left = build()           # the left subtree's tokens come next...
        node.right = build()          # ...followed by the right subtree's
        return node

    return build()


if __name__ == "__main__":
    tree = TreeNode(1, TreeNode(2), TreeNode(3, TreeNode(4), TreeNode(5)))
    s = serialize(tree)
    print(s)                                  # 1,2,#,#,3,4,#,#,5,#,#
    print(serialize(deserialize(s)) == s)     # True (round trip)
    print(serialize(None), deserialize("#"))  # # None
`,
  explain: {
    en: `<p>A tree's shape is lost if you only write its values. The fix is to also write the <strong>holes</strong>: in pre-order (node, left, right), emit <code>#</code> for every <code>None</code> child. With the nulls included, every value sequence corresponds to exactly one tree, because the reader always knows when a subtree ends — a subtree is either <code>#</code> or a value followed by two complete subtrees.</p>
<p>Deserialisation mirrors serialisation: read one token; if it is <code>#</code> return <code>None</code>; otherwise create the node, then recursively build the left subtree (which consumes exactly its own tokens), then the right. Sharing a single iterator between recursive calls is what makes the "consume exactly what the subtree needs" part work without index bookkeeping.</p>
<p>The serializer here is iterative (explicit stack, push right before left) so it does not hit Python's recursion limit on a degenerate, list-shaped tree; the deserializer can be made iterative the same way if needed. The output has <code>n</code> values and <code>n + 1</code> null markers. Level-order (BFS) with nulls, as LeetCode prints trees, works equally well.</p>
<p><strong>Pattern recognition:</strong> when you see "serialize / encode a tree or graph and rebuild it", think <strong>traversal + explicit null markers</strong> (or traversal + child counts for n-ary trees), decoded by the same traversal over a shared token stream.</p>`,
    he: `<p>אם כותבים רק את הערכים של עץ, המבנה שלו הולך לאיבוד. התיקון הוא לכתוב גם את ה<strong>חורים</strong>: ב-pre-order (node, left, right) כותבים <code>#</code> לכל ילד שהוא <code>None</code>. כשה-nulls כלולים, כל רצף ערכים מתאים לעץ אחד בדיוק, כי הקורא תמיד יודע מתי תת-עץ נגמר – תת-עץ הוא או <code>#</code> או ערך ואחריו שני תתי-עצים שלמים.</p>
<p>ה-deserialization משקף את ה-serialization: קוראים token אחד; אם הוא <code>#</code> מחזירים <code>None</code>; אחרת יוצרים את ה-node, ואז בונים רקורסיבית את תת-העץ השמאלי (שצורך בדיוק את ה-tokens שלו), ואז את הימני. שיתוף iterator אחד בין הקריאות הרקורסיביות הוא מה שגורם ל"לצרוך בדיוק את מה שתת-העץ צריך" לעבוד בלי ניהול אינדקסים.</p>
<p>ה-serializer כאן איטרטיבי (stack מפורש, דוחפים ימין לפני שמאל) כדי לא להיתקע ב-recursion limit של Python על עץ מנוון בצורת רשימה; אפשר להפוך גם את ה-deserializer לאיטרטיבי באותה שיטה אם צריך. ב-output יש <code>n</code> ערכים ו-<code>n + 1</code> סמני null. גם level-order (BFS) עם nulls, כמו ש-LeetCode מדפיס עצים, עובד באותה מידה.</p>
<p><strong>זיהוי תבנית:</strong> כשאתה רואה "לעשות serialize / encode לעץ או גרף ולבנות אותו מחדש" – תחשוב <strong>traversal + סמני null מפורשים</strong> (או traversal + מספר ילדים לעצים n-ary), שמפוענחים באותו traversal על stream משותף של tokens.</p>`
  },
  complexity: "Time O(n) for both, Space O(n) for the string plus O(h) stack",
  whyInfra: {
    en: "Cassandra (nodetool repair), DynamoDB-style stores and Riak exchange Merkle trees between replicas so they only stream the key ranges whose hashes differ; Git and IPFS address trees the same way. More generally, every config and state tree you ship has a serialisation format with a defined way to express absence: protobuf field presence, JSON null vs. missing key in Kubernetes strategic-merge patches, and etcd/Consul KV trees. Getting 'missing' vs. 'empty' wrong is a classic source of config drift bugs.",
    he: "Cassandra (nodetool repair), stores בסגנון DynamoDB ו-Riak מחליפים Merkle trees בין replicas כדי להזרים רק את טווחי המפתחות שה-hashes שלהם שונים; Git ו-IPFS ממענים עצים באותה צורה. באופן כללי, לכל עץ קונפיג או state שאתה שולח יש פורמט serialization עם דרך מוגדרת לבטא היעדר: field presence ב-protobuf, JSON null מול מפתח חסר ב-strategic-merge patches של Kubernetes, ועצי KV ב-etcd/Consul. לבלבל בין 'חסר' ל-'ריק' זה מקור קלאסי לבאגים של config drift."
  },
  followUps: [
    { q: { en: "The tree is a Binary Search Tree. Can you drop the null markers?", he: "העץ הוא Binary Search Tree. אפשר לוותר על סמני ה-null?" },
      a: { en: "Yes (LeetCode 449): pre-order values alone determine a BST, because the ordering tells you where each value goes. Rebuild with bounds: build(lo, hi) consumes the next value only if lo &lt; v &lt; hi. That makes the payload more compact.", he: "כן (LeetCode 449): ערכי pre-order לבד קובעים BST, כי הסדר אומר לך לאן כל ערך הולך. בונים מחדש עם גבולות: build(lo, hi) צורך את הערך הבא רק אם lo &lt; v &lt; hi. ככה ה-payload יותר קומפקטי." } },
    { q: { en: "For anti-entropy, do you even need to send the whole tree?", he: "ל-anti-entropy, בכלל צריך לשלוח את כל העץ?" },
      a: { en: "No. Compare top-down: exchange root hashes; if equal, the replicas match and you are done. Otherwise exchange the children's hashes and recurse only into subtrees that differ. Traffic is O(d · log n) for d differing ranges instead of O(n).", he: "לא. משווים מלמעלה למטה: מחליפים hash של ה-root; אם שווה, ה-replicas זהים וסיימנו. אחרת מחליפים את ה-hashes של הילדים ויורדים רק לתתי-עצים ששונים. התעבורה היא O(d · log n) עבור d טווחים שונים, במקום O(n)." } }
  ]
});
