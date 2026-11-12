// Interview prep — coding patterns (sliding window, monotonic stack/deque, two pointers,
// binary search, DP, backtracking, O(1) design) with an infrastructure twist (INFRA.problems)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.problems = window.INFRA.problems || [];

/* ------------------------------------------------------------------ */
/* 1. Sliding window — Longest Substring Without Repeating (LC 3)      */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "longest-unique-request-window",
  icon: "🪟",
  difficulty: "medium",
  tags: ["sliding-window", "hashmap", "strings"],
  leetcode: "3",
  title: { en: "Longest Window of Unique Request IDs", he: "החלון הארוך ביותר של Request IDs ייחודיים" },
  statement: {
    en: `<p>A client sends requests tagged with an idempotency key / request id. When a retry storm starts, ids begin to repeat. Given the sequence of request ids as seen by the gateway, return the <strong>length of the longest contiguous run in which no id repeats</strong>.</p>
<p>This is exactly LeetCode 3 (Longest Substring Without Repeating Characters): the input can be a string (each character is an id) or a list of ids.</p>
<ul>
<li>0 &lt;= n &lt;= 10<sup>5</sup></li>
<li>Ids are hashable (strings, ints).</li>
</ul>`,
    he: `<p>Client שולח בקשות עם idempotency key / request id. כשמתחיל retry storm, ה-ids מתחילים לחזור על עצמם. בהינתן רצף ה-request ids כפי שה-gateway ראה אותם, תחזיר את <strong>האורך של הרצף הרציף הארוך ביותר שבו אף id לא חוזר</strong>.</p>
<p>זו בדיוק LeetCode 3 (Longest Substring Without Repeating Characters): ה-input יכול להיות string (כל תו הוא id) או list של ids.</p>
<ul>
<li>0 &lt;= n &lt;= 10<sup>5</sup></li>
<li>ה-ids הם hashable (strings, ints).</li>
</ul>`
  },
  examples: `Input:  "abcabcbb"
Output: 3          # "abc"

Input:  ["r1", "r2", "r3", "r1", "r4"]
Output: 4          # r2, r3, r1, r4

Input:  "bbbbb"   -> 1
Input:  "pwwkew"  -> 3   # "wke" (must be contiguous, "pwke" is not)
Input:  ""        -> 0`,
  hints: [
    { en: "Brute force checks every start/end pair: O(n²) or worse. Notice that once a window [left, right] is valid, every smaller window inside it is valid too.", he: "Brute force בודק כל זוג start/end: O(n²) ומעלה. שים לב שאם חלון [left, right] תקין, כל חלון קטן יותר בתוכו גם תקין." },
    { en: "Grow the window with the right pointer. When the new id is already inside the window, move left just past its previous occurrence.", he: "תרחיב את החלון עם המצביע הימני. כשה-id החדש כבר נמצא בתוך החלון, תזיז את left למקום אחד אחרי ההופעה הקודמת שלו." },
    { en: "Keep a dict id -> last index. Careful: only jump left if that last index is inside the current window (last &gt;= left), otherwise \"abba\" breaks.", he: "תחזיק dict של id -> אינדקס אחרון. זהירות: מקפיצים את left רק אם האינדקס האחרון בתוך החלון הנוכחי (last &gt;= left), אחרת \"abba\" נשבר." }
  ],
  solution: String.raw`from typing import Hashable, Sequence


def longest_unique_window(ids: Sequence[Hashable]) -> int:
    """Length of the longest contiguous run with no repeated id (LC 3)."""
    last_seen = {}      # id -> index of its most recent occurrence
    left = 0            # window is ids[left .. right], all unique
    best = 0
    for right, rid in enumerate(ids):
        # Repeat inside the current window? Shrink past its previous copy.
        # The ">= left" check ignores stale occurrences already outside the window.
        if rid in last_seen and last_seen[rid] >= left:
            left = last_seen[rid] + 1
        last_seen[rid] = right
        best = max(best, right - left + 1)
    return best


if __name__ == "__main__":
    print(longest_unique_window("abcabcbb"))                    # 3
    print(longest_unique_window(["r1", "r2", "r3", "r1", "r4"]))  # 4
    print(longest_unique_window("abba"))                        # 2
`,
  explain: {
    en: `<p>A <strong>variable-size sliding window</strong>. The invariant is: <code>ids[left..right]</code> contains no duplicates. Each step adds <code>ids[right]</code>. If that id was last seen at index <code>j &gt;= left</code>, the window now has a duplicate, so the only way to restore the invariant is to move <code>left</code> to <code>j + 1</code>. Because <code>left</code> only ever moves forward, each element enters and leaves the window at most once: O(n).</p>
<p>Instead of a set plus a <code>while</code> loop that removes from the left one by one, the dict of last positions lets <code>left</code> <em>jump</em>. The <code>last_seen[rid] &gt;= left</code> check matters: in <code>"abba"</code>, when the second <code>a</code> arrives, its old index 0 is already outside the window (left = 2), so we must not move left backwards.</p>
<p><strong>Pattern recognition:</strong> when you see "longest/shortest <em>contiguous</em> range such that a condition holds" and the condition is monotonic (shrinking a valid window keeps it valid), think <strong>two-pointer sliding window + hashmap of counts or last positions</strong>.</p>`,
    he: `<p><strong>Sliding window בגודל משתנה</strong>. ה-invariant: <code>ids[left..right]</code> בלי כפילויות. בכל צעד מוסיפים את <code>ids[right]</code>. אם ה-id הזה נראה לאחרונה באינדקס <code>j &gt;= left</code>, יש עכשיו כפילות בחלון, והדרך היחידה להחזיר את ה-invariant היא להזיז את <code>left</code> ל-<code>j + 1</code>. מכיוון ש-<code>left</code> רק זז קדימה, כל איבר נכנס ויוצא מהחלון לכל היותר פעם אחת: O(n).</p>
<p>במקום set ולולאת <code>while</code> שמוציאה איברים משמאל אחד-אחד, ה-dict של המיקומים האחרונים מאפשר ל-<code>left</code> <em>לקפוץ</em>. הבדיקה <code>last_seen[rid] &gt;= left</code> קריטית: ב-<code>"abba"</code>, כשה-<code>a</code> השני מגיע, האינדקס הישן שלו (0) כבר מחוץ לחלון (left = 2), אז אסור להחזיר את left אחורה.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "הטווח ה<em>רציף</em> הארוך/קצר ביותר שמקיים תנאי" והתנאי מונוטוני (חלון תקין נשאר תקין כשמקטינים אותו), חושבים על <strong>sliding window עם שני מצביעים + hashmap של ספירות או מיקומים אחרונים</strong>.</p>`
  },
  complexity: "Time O(n), Space O(min(n, distinct ids))",
  whyInfra: {
    en: "Dedup windows are everywhere: Kafka idempotent producers track sequence numbers per producer to drop duplicates, SQS FIFO deduplicates by MessageDeduplicationId within a 5-minute window, and API gateways use idempotency keys (Stripe-style) so retries don't double-charge. Measuring \"how long did we go without a duplicate\" is a cheap retry-storm detector for a client or a misbehaving SDK.",
    he: "חלונות dedup נמצאים בכל מקום: idempotent producer ב-Kafka עוקב אחרי sequence numbers לכל producer כדי לזרוק כפילויות, SQS FIFO עושה dedup לפי MessageDeduplicationId בחלון של 5 דקות, ו-API gateways משתמשים ב-idempotency keys (בסגנון Stripe) כדי ש-retries לא יחייבו פעמיים. למדוד \"כמה זמן עברנו בלי כפילות\" זה detector זול ל-retry storm של client או SDK שמתנהג לא יפה."
  },
  followUps: [
    { q: { en: "What if at most K repeats are allowed inside the window?", he: "מה אם מותרות עד K חזרות בתוך החלון?" },
      a: { en: "Keep a Counter of ids in the window and a running count of \"extra\" occurrences. When it exceeds K, advance left and decrement counts until it is back to K. Still O(n), the classic shrink-while-invalid loop.", he: "מחזיקים Counter של ה-ids בחלון ומונה של הופעות \"עודפות\". כשהוא עובר את K, מקדמים את left ומורידים ספירות עד שחוזרים ל-K. עדיין O(n), לולאת shrink-while-invalid הקלאסית." } },
    { q: { en: "The stream is unbounded and ids are high-cardinality. Memory?", he: "ה-stream אינסופי וה-ids עם cardinality גבוה. מה עם זיכרון?" },
      a: { en: "last_seen only needs entries inside the current window, so evict entries whose index &lt; left (or bound the window by time, e.g. 5 minutes like SQS). For approximate dedup at huge scale use a Bloom filter or a time-rotated pair of Bloom filters and accept a small false-positive rate.", he: "ב-last_seen צריך רק רשומות שבתוך החלון הנוכחי, אז מפנים רשומות עם אינדקס &lt; left (או מגבילים את החלון בזמן, למשל 5 דקות כמו ב-SQS). ל-dedup מקורב בסקייל עצום משתמשים ב-Bloom filter או בזוג Bloom filters שמתחלפים לפי זמן, ומקבלים אחוז קטן של false positives." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 2. Monotonic deque — Sliding Window Maximum (LC 239)                */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "peak-cpu-sliding-window-max",
  icon: "📈",
  difficulty: "hard",
  tags: ["sliding-window", "deque", "monotonic-queue"],
  leetcode: "239",
  title: { en: "Peak CPU per Rolling Window", he: "שיא CPU בכל חלון מתגלגל" },
  statement: {
    en: `<p>A node exports one CPU-utilization sample per minute. The autoscaler needs the <strong>peak CPU of every rolling k-minute window</strong> (for k = 5: minutes 0-4, 1-5, 2-6, ...). Given the list <code>samples</code> and <code>k</code>, return a list of the maximum of each window, in order.</p>
<ul>
<li>1 &lt;= k &lt;= n &lt;= 10<sup>5</sup></li>
<li>The output has <code>n - k + 1</code> values.</li>
<li>Target: O(n) total, not O(n·k).</li>
</ul>`,
    he: `<p>Node מייצא דגימת CPU utilization אחת לדקה. ה-autoscaler צריך את <strong>שיא ה-CPU בכל חלון מתגלגל של k דקות</strong> (עבור k = 5: דקות 0-4, 1-5, 2-6, ...). בהינתן הרשימה <code>samples</code> ו-<code>k</code>, תחזיר רשימה של המקסימום של כל חלון, לפי הסדר.</p>
<ul>
<li>1 &lt;= k &lt;= n &lt;= 10<sup>5</sup></li>
<li>ב-output יש <code>n - k + 1</code> ערכים.</li>
<li>היעד: O(n) בסך הכל, לא O(n·k).</li>
</ul>`
  },
  examples: `Input:  samples = [40, 55, 30, 20, 25, 10, 15, 60], k = 3
Output: [55, 55, 30, 25, 25, 60]

Input:  samples = [1, 3, -1, -3, 5, 3, 6, 7], k = 3     # LeetCode example
Output: [3, 3, 5, 5, 6, 7]

Input:  samples = [9], k = 1
Output: [9]`,
  hints: [
    { en: "Recomputing max() per window is O(n·k). A heap with lazy deletion gets O(n log n). Can you do better?", he: "לחשב max() מחדש לכל חלון זה O(n·k). Heap עם lazy deletion נותן O(n log n). אפשר יותר טוב?" },
    { en: "If a newer sample is higher than an older one, the older one can never be a window max again: it leaves the window first and is always dominated.", he: "אם דגימה חדשה יותר גבוהה מדגימה ישנה, הישנה לעולם לא תהיה שוב מקסימום של חלון: היא יוצאת מהחלון קודם ותמיד נשלטת." },
    { en: "Keep a deque of indices whose values are strictly decreasing. Pop smaller values from the back on insert; pop the front when it falls out of the window. The front is the max.", he: "תחזיק deque של אינדקסים שהערכים שלהם יורדים ממש. בהכנסה מוציאים מהסוף ערכים קטנים יותר; מוציאים מההתחלה כשהאינדקס יוצא מהחלון. הראש הוא המקסימום." }
  ],
  solution: String.raw`from collections import deque
from typing import List


def window_peaks(samples: List[float], k: int) -> List[float]:
    """Max of every contiguous window of size k (LC 239), O(n)."""
    dq = deque()        # indices; samples[dq[0]] > samples[dq[1]] > ... (decreasing)
    peaks = []
    for i, value in enumerate(samples):
        # 1. Drop the front if it slid out of the window [i-k+1, i].
        if dq and dq[0] <= i - k:
            dq.popleft()
        # 2. Drop everything from the back that the new value dominates:
        #    they are older AND not larger, so they can never be a max again.
        while dq and samples[dq[-1]] <= value:
            dq.pop()
        dq.append(i)
        # 3. Once the first full window is formed, the front is its max.
        if i >= k - 1:
            peaks.append(samples[dq[0]])
    return peaks


if __name__ == "__main__":
    print(window_peaks([40, 55, 30, 20, 25, 10, 15, 60], 3))  # [55, 55, 30, 25, 25, 60]
    print(window_peaks([1, 3, -1, -3, 5, 3, 6, 7], 3))        # [3, 3, 5, 5, 6, 7]
`,
  explain: {
    en: `<p>The trick is a <strong>monotonic deque</strong>: it stores indices (so we know when they expire) whose values are decreasing from front to back. Two kinds of elements are useless and get thrown away:</p>
<ul>
<li><strong>Expired</strong>: index &lt;= i - k. Only the front can be expired, because indices are appended in increasing order.</li>
<li><strong>Dominated</strong>: an older value &lt;= the new value. It leaves the window before the new one and is never larger, so it can never be the answer. We pop those from the back.</li>
</ul>
<p>What remains is the list of "candidates for future max", and the front is the current max. Each index is pushed once and popped at most once, so the total work is O(n) amortized even though there is a <code>while</code> inside the <code>for</code>.</p>
<p><strong>Pattern recognition:</strong> when you see "max/min of every window" or "next greater/smaller element", think <strong>monotonic deque/stack</strong>: throw away elements that can never win.</p>`,
    he: `<p>הטריק הוא <strong>monotonic deque</strong>: הוא שומר אינדקסים (כדי לדעת מתי הם פגים) שהערכים שלהם יורדים מההתחלה לסוף. שני סוגי איברים מיותרים ונזרקים:</p>
<ul>
<li><strong>פגי תוקף</strong>: אינדקס &lt;= i - k. רק הראש יכול להיות פג תוקף, כי האינדקסים נכנסים בסדר עולה.</li>
<li><strong>נשלטים</strong>: ערך ישן &lt;= הערך החדש. הוא יוצא מהחלון לפני החדש ואף פעם לא גדול ממנו, אז הוא לעולם לא יהיה התשובה. מוציאים אותם מהסוף.</li>
</ul>
<p>מה שנשאר זו רשימת "המועמדים למקסימום עתידי", והראש הוא המקסימום הנוכחי. כל אינדקס נכנס פעם אחת ויוצא לכל היותר פעם אחת, אז העבודה הכוללת היא O(n) amortized למרות שיש <code>while</code> בתוך ה-<code>for</code>.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "max/min של כל חלון" או "האיבר הגדול/קטן הבא", חושבים על <strong>monotonic deque/stack</strong>: זורקים איברים שאין להם סיכוי לנצח.</p>`
  },
  complexity: "Time O(n) amortized, Space O(k) for the deque",
  whyInfra: {
    en: "Autoscalers and alerting rules work on rolling windows: PromQL <code>max_over_time(cpu[5m])</code>, Kubernetes HPA scale-down stabilization (it takes the max recommendation over the last 5 minutes so it doesn't flap), and CloudWatch alarms over N periods. Streaming engines (Flink, Kafka Streams) keep per-window aggregates incrementally exactly to avoid re-scanning every sample on each tick.",
    he: "Autoscalers וחוקי alerting עובדים על חלונות מתגלגלים: ב-PromQL <code>max_over_time(cpu[5m])</code>, ה-scale-down stabilization של Kubernetes HPA (הוא לוקח את ההמלצה המקסימלית של 5 הדקות האחרונות כדי לא לקפוץ הלוך-חזור), ו-CloudWatch alarms על N תקופות. מנועי streaming (Flink, Kafka Streams) מחזיקים aggregates לכל חלון בצורה אינקרמנטלית בדיוק כדי לא לסרוק מחדש כל דגימה בכל tick."
  },
  followUps: [
    { q: { en: "Samples arrive as a live stream. How does the API change?", he: "הדגימות מגיעות כ-stream חי. איך ה-API משתנה?" },
      a: { en: "Wrap the same deque in a class with push(value) -&gt; current_max. Memory stays O(k). For time-based windows (last 5 minutes, irregular samples) store (timestamp, value) and expire by timestamp instead of index.", he: "עוטפים את אותו deque במחלקה עם push(value) -&gt; current_max. הזיכרון נשאר O(k). לחלונות מבוססי זמן (5 הדקות האחרונות, דגימות לא סדירות) שומרים (timestamp, value) ומפנים לפי timestamp במקום לפי אינדקס." } },
    { q: { en: "What about the p95 per window instead of the max?", he: "ומה אם צריך p95 לכל חלון במקום max?" },
      a: { en: "Percentiles aren't decomposable this way. Use two heaps / a sorted container with deletions (O(log k) per step), or approximate sketches like t-digest or HDR histograms merged per bucket, which is what Prometheus histograms + histogram_quantile do.", he: "אחוזונים לא מתפרקים ככה. משתמשים בשני heaps או ב-sorted container עם מחיקות (O(log k) לצעד), או ב-sketches מקורבים כמו t-digest או HDR histograms שממזגים לכל bucket, וזה מה ש-Prometheus histograms + histogram_quantile עושים." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 3. Monotonic stack — Daily Temperatures (LC 739)                    */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "days-until-latency-regression",
  icon: "🌡️",
  difficulty: "medium",
  tags: ["monotonic-stack", "arrays"],
  leetcode: "739",
  title: { en: "Days Until Latency Gets Worse", he: "כמה ימים עד שה-latency מחמיר" },
  statement: {
    en: `<p>You have the daily p99 latency of a service, <code>latency[i]</code> in ms. For each day, return <strong>how many days you have to wait until a day with strictly higher latency</strong>. If there is no such future day, return 0 for that day.</p>
<p>This is LeetCode 739 (Daily Temperatures) with latencies instead of temperatures.</p>
<ul><li>1 &lt;= n &lt;= 10<sup>5</sup>; target O(n).</li></ul>`,
    he: `<p>יש לך את ה-p99 latency היומי של שירות, <code>latency[i]</code> ב-ms. לכל יום, תחזיר <strong>כמה ימים צריך לחכות עד יום עם latency גבוה ממש</strong>. אם אין יום כזה בעתיד, תחזיר 0 לאותו יום.</p>
<p>זו LeetCode 739 (Daily Temperatures), עם latencies במקום טמפרטורות.</p>
<ul><li>1 &lt;= n &lt;= 10<sup>5</sup>; היעד O(n).</li></ul>`
  },
  examples: `Input:  latency = [73, 74, 75, 71, 69, 72, 76, 73]
Output:           [ 1,  1,  4,  2,  1,  1,  0,  0]
# day 2 (75ms): next worse day is day 6 (76ms) -> 4 days

Input:  latency = [30, 40, 50, 60]  -> [1, 1, 1, 0]
Input:  latency = [60, 50, 40]      -> [0, 0, 0]
Input:  latency = [50, 50, 51]      -> [2, 1, 0]   # equal is not "worse"`,
  hints: [
    { en: "Brute force: for each day scan forward until something bigger. O(n²) on a long decreasing run.", he: "Brute force: לכל יום סורקים קדימה עד משהו גדול יותר. O(n²) על רצף ארוך שיורד." },
    { en: "Think of each day as \"waiting\" for its answer. Which days are still waiting when a new day arrives? Do they form some order?", he: "תחשוב על כל יום כ\"מחכה\" לתשובה שלו. אילו ימים עדיין מחכים כשמגיע יום חדש? יש להם סדר מסוים?" },
    { en: "The waiting days have non-increasing latencies, so keep them on a stack. A new higher day resolves days from the top of the stack until it meets one that is not lower.", he: "לימים שמחכים יש latency לא-עולה, אז מחזיקים אותם ב-stack. יום חדש גבוה יותר פותר ימים מראש ה-stack עד שהוא פוגש אחד שלא נמוך ממנו." }
  ],
  solution: String.raw`from typing import List


def days_until_worse(latency: List[int]) -> List[int]:
    """For each day, days until a strictly higher value (LC 739)."""
    answer = [0] * len(latency)      # default 0 = never gets worse
    waiting = []                     # stack of day indices, latencies non-increasing
    for day, value in enumerate(latency):
        # Today resolves every waiting day with a strictly lower latency.
        while waiting and latency[waiting[-1]] < value:
            prev = waiting.pop()
            answer[prev] = day - prev
        waiting.append(day)          # today waits for its own answer
    return answer


if __name__ == "__main__":
    print(days_until_worse([73, 74, 75, 71, 69, 72, 76, 73]))  # [1, 1, 4, 2, 1, 1, 0, 0]
    print(days_until_worse([50, 50, 51]))                      # [2, 1, 0]
`,
  explain: {
    en: `<p>Walk left to right and keep a <strong>stack of days that haven't found a worse day yet</strong>. Invariant: latencies on the stack are non-increasing from bottom to top (if a higher day came after a lower one, the lower one would already have been resolved and popped).</p>
<p>When today's value arrives, every waiting day on top with a strictly lower value has found its answer: <code>today - that_day</code>. Pop them until the top is &gt;= today, then push today. Days left on the stack at the end keep the default 0. Each index is pushed and popped once: O(n).</p>
<p>Using <code>&lt;</code> (not <code>&lt;=</code>) in the pop condition implements "strictly higher": equal days stay on the stack together.</p>
<p><strong>Pattern recognition:</strong> when you see "for each element, find the next (or previous) greater/smaller element", think <strong>monotonic stack of indices</strong>.</p>`,
    he: `<p>עוברים משמאל לימין ומחזיקים <strong>stack של ימים שעוד לא מצאו יום גרוע יותר</strong>. ה-invariant: ה-latencies ב-stack לא-עולים מלמטה למעלה (אם יום גבוה היה בא אחרי יום נמוך, הנמוך כבר היה נפתר ויוצא).</p>
<p>כשהערך של היום מגיע, כל יום שמחכה בראש ה-stack עם ערך נמוך ממש מצא את התשובה שלו: <code>today - that_day</code>. מוציאים אותם עד שהראש &gt;= היום, ואז דוחפים את היום. ימים שנשארו ב-stack בסוף נשארים עם ברירת המחדל 0. כל אינדקס נכנס ויוצא פעם אחת: O(n).</p>
<p>השימוש ב-<code>&lt;</code> (ולא <code>&lt;=</code>) בתנאי ה-pop מממש "גבוה ממש": ימים שווים נשארים ביחד ב-stack.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "לכל איבר, תמצא את האיבר הגדול/קטן הבא (או הקודם)", חושבים על <strong>monotonic stack של אינדקסים</strong>.</p>`
  },
  complexity: "Time O(n), Space O(n) for the stack and answer",
  whyInfra: {
    en: "\"How long until it got worse\" is a regression-tracking question: after each deploy, how many releases until p99 degraded again? The same next-greater scan powers \"time until the next spike\" features for anomaly detection, and the monotonic-stack idea is how you compute the largest rectangle in a histogram, e.g. the longest period during which free disk stayed above X on a capacity dashboard.",
    he: "\"כמה זמן עד שזה החמיר\" זו שאלה של מעקב רגרסיות: אחרי כל deploy, כמה releases עד שה-p99 שוב הידרדר? אותה סריקה של next-greater מזינה פיצ'רים של \"זמן עד ה-spike הבא\" ל-anomaly detection, ורעיון ה-monotonic stack הוא גם הדרך לחשב את המלבן הגדול ביותר ב-histogram, למשל התקופה הארוכה ביותר שבה הדיסק הפנוי נשאר מעל X ב-dashboard של capacity."
  },
  followUps: [
    { q: { en: "Can you do it with O(1) extra space (besides the output)?", he: "אפשר עם O(1) זיכרון נוסף (חוץ מה-output)?" },
      a: { en: "Yes: iterate from the right and use the answer array to jump. For day i, start at j = i + 1 and while latency[j] &lt;= latency[i], jump j += answer[j] (if answer[j] is 0, there is no worse day). Still amortized O(n).", he: "כן: עוברים מימין ומשתמשים במערך התשובות כדי לקפוץ. ליום i, מתחילים ב-j = i + 1 וכל עוד latency[j] &lt;= latency[i], קופצים j += answer[j] (אם answer[j] הוא 0, אין יום גרוע יותר). עדיין O(n) amortized." } },
    { q: { en: "How would you answer \"days since latency was last this bad\" instead?", he: "איך היית עונה על \"כמה ימים מאז שה-latency היה גרוע כמו היום\"?" },
      a: { en: "That's the previous greater-or-equal element: same stack, but the answer for today is read from the top of the stack after popping smaller values (this is LeetCode 901, Online Stock Span, if you count the span instead).", he: "זה ה-previous greater-or-equal element: אותו stack, אבל התשובה להיום נקראת מראש ה-stack אחרי שמוציאים את הקטנים (זו LeetCode 901, Online Stock Span, אם סופרים את ה-span)." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 4. Two pointers — 3Sum (LC 15)                                      */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "three-sum-quota-reconcile",
  icon: "⚖️",
  difficulty: "medium",
  tags: ["two-pointers", "sorting", "arrays"],
  leetcode: "15",
  title: { en: "Quota Adjustments That Cancel Out (3Sum)", he: "התאמות quota שמבטלות אחת את השנייה (3Sum)" },
  statement: {
    en: `<p>The capacity team keeps a ledger of quota adjustments in vCPU: positive numbers are grants, negative numbers are releases. During reconciliation you want to find <strong>all unique triples of adjustments that net to exactly zero</strong> (they can be compacted away).</p>
<p>Given an integer list <code>deltas</code>, return all unique triples <code>[a, b, c]</code> taken from three different positions with <code>a + b + c == 0</code>. No duplicate triples in the output (order inside a triple and between triples does not matter). This is LeetCode 15 (3Sum).</p>
<ul><li>3 &lt;= n &lt;= 3000; target O(n²).</li></ul>`,
    he: `<p>צוות ה-capacity מחזיק ledger של התאמות quota ב-vCPU: מספרים חיוביים הם הקצאות, שליליים הם שחרורים. ב-reconciliation רוצים למצוא <strong>את כל השלשות הייחודיות של התאמות שהסכום שלהן בדיוק אפס</strong> (אפשר לדחוס אותן החוצה).</p>
<p>בהינתן list של מספרים שלמים <code>deltas</code>, תחזיר את כל השלשות הייחודיות <code>[a, b, c]</code> משלושה מיקומים שונים עם <code>a + b + c == 0</code>. בלי שלשות כפולות ב-output (הסדר בתוך שלשה ובין שלשות לא משנה). זו LeetCode 15 (3Sum).</p>
<ul><li>3 &lt;= n &lt;= 3000; היעד O(n²).</li></ul>`
  },
  examples: `Input:  deltas = [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]

Input:  deltas = [0, 0, 0, 0]
Output: [[0, 0, 0]]          # only once

Input:  deltas = [8, -4, -4, 2]
Output: [[-4, -4, 8]]

Input:  deltas = [1, 2, -2]
Output: []`,
  hints: [
    { en: "Triple loop is O(n³). Fix the first element; the rest is Two Sum with target -a.", he: "שלוש לולאות זה O(n³). תקבע את האיבר הראשון; השאר הוא Two Sum עם target של -a." },
    { en: "Sort first. On a sorted array, Two Sum is two pointers moving inward: sum too small -&gt; move left up, too big -&gt; move right down.", he: "קודם למיין. על מערך ממוין, Two Sum זה שני מצביעים שמתקרבים: סכום קטן מדי -&gt; left עולה, גדול מדי -&gt; right יורד." },
    { en: "Duplicates: skip a first element equal to the previous one, and after recording a triple, skip equal values on both pointers.", he: "כפילויות: מדלגים על איבר ראשון ששווה לקודם, ואחרי שרושמים שלשה, מדלגים על ערכים שווים בשני המצביעים." }
  ],
  solution: String.raw`from typing import List


def zero_sum_triples(deltas: List[int]) -> List[List[int]]:
    """All unique triples summing to 0 (LC 15): sort + two pointers, O(n^2)."""
    nums = sorted(deltas)
    n = len(nums)
    result = []
    for i in range(n - 2):
        a = nums[i]
        if a > 0:                       # sorted: everything after is > 0 too
            break
        if i > 0 and a == nums[i - 1]:  # same first element -> same triples
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = a + nums[lo] + nums[hi]
            if s < 0:
                lo += 1                 # need a bigger sum
            elif s > 0:
                hi -= 1                 # need a smaller sum
            else:
                result.append([a, nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                # skip duplicates so each triple is reported once
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1
    return result


if __name__ == "__main__":
    print(zero_sum_triples([-1, 0, 1, 2, -1, -4]))  # [[-1, -1, 2], [-1, 0, 1]]
    print(zero_sum_triples([0, 0, 0, 0]))           # [[0, 0, 0]]
`,
  explain: {
    en: `<p>Sorting buys two things: the <strong>two-pointer search</strong> and an easy way to <strong>skip duplicates</strong>. For each first element <code>a</code>, we look for a pair in <code>nums[i+1..]</code> that sums to <code>-a</code>. With <code>lo</code> at the smallest and <code>hi</code> at the largest candidate, if the sum is too small the only useful move is <code>lo += 1</code> (decreasing <code>hi</code> would make it smaller); if too big, <code>hi -= 1</code>. Each pair search is O(n), so the total is O(n²), which beats the O(n log n) sort.</p>
<p>Dedup happens at both levels: skip <code>a</code> when it equals the previous first element, and after a hit move both pointers past equal values. The early <code>break</code> when <code>a &gt; 0</code> is a cheap pruning: three positives can't sum to 0.</p>
<p><strong>Pattern recognition:</strong> when you see "find pairs/triples with a target sum" and you can afford to sort, think <strong>sort + two pointers converging from both ends</strong> (k-Sum = fix k-2 elements, then two pointers).</p>`,
    he: `<p>המיון קונה שני דברים: את <strong>החיפוש עם שני מצביעים</strong> ודרך קלה <strong>לדלג על כפילויות</strong>. לכל איבר ראשון <code>a</code>, מחפשים זוג ב-<code>nums[i+1..]</code> שסכומו <code>-a</code>. כש-<code>lo</code> על המועמד הכי קטן ו-<code>hi</code> על הכי גדול, אם הסכום קטן מדי, הצעד היחיד שעוזר הוא <code>lo += 1</code> (להוריד את <code>hi</code> רק יקטין); אם גדול מדי, <code>hi -= 1</code>. כל חיפוש זוג הוא O(n), אז הסך הכל O(n²), שגובר על ה-O(n log n) של המיון.</p>
<p>ה-dedup קורה בשתי רמות: מדלגים על <code>a</code> כששווה לאיבר הראשון הקודם, ואחרי פגיעה מזיזים את שני המצביעים מעבר לערכים שווים. ה-<code>break</code> המוקדם כש-<code>a &gt; 0</code> הוא pruning זול: שלושה חיוביים לא יכולים להסתכם ל-0.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "תמצא זוגות/שלשות עם סכום מטרה" ומותר למיין, חושבים על <strong>מיון + שני מצביעים שמתכנסים משני הקצוות</strong> (k-Sum = קובעים k-2 איברים, ואז שני מצביעים).</p>`
  },
  complexity: "Time O(n²) (sort O(n log n) is dominated), Space O(1) extra besides the sort and output",
  whyInfra: {
    en: "Reconciliation jobs (billing, quota, inventory) constantly search for entries that cancel out: a reserve + release pair, or three partial refunds that net a charge. The two-pointer scan over sorted data is also the core of merge joins in databases and of comparing two sorted listings (e.g. S3 inventory vs. a manifest) in a single pass.",
    he: "Jobs של reconciliation (billing, quota, inventory) כל הזמן מחפשים רשומות שמבטלות אחת את השנייה: זוג של reserve + release, או שלושה החזרים חלקיים שמאפסים חיוב. הסריקה עם שני מצביעים על מידע ממוין היא גם הלב של merge join בבסיסי נתונים ושל השוואה בין שתי רשימות ממוינות (למשל S3 inventory מול manifest) במעבר אחד."
  },
  followUps: [
    { q: { en: "Why not a hashset per first element instead of two pointers?", he: "למה לא hashset לכל איבר ראשון במקום שני מצביעים?" },
      a: { en: "That also gives O(n²) but uses O(n) extra memory and makes dedup harder (you need a set of sorted tuples). Two pointers on the already-sorted array is O(1) extra and dedups naturally.", he: "גם זה נותן O(n²), אבל עם O(n) זיכרון נוסף ו-dedup יותר מסובך (צריך set של tuples ממוינים). שני מצביעים על המערך הממוין הם O(1) נוסף וה-dedup יוצא טבעי." } },
    { q: { en: "Find the triple whose sum is closest to a target (e.g. a capacity goal).", he: "תמצא את השלשה שהסכום שלה הכי קרוב ל-target (למשל יעד capacity)." },
      a: { en: "LeetCode 16 (3Sum Closest): same loop, track the best |sum - target| and move pointers by the sign of sum - target. Return early on an exact match.", he: "LeetCode 16 (3Sum Closest): אותה לולאה, שומרים את ה-|sum - target| הכי טוב ומזיזים מצביעים לפי הסימן של sum - target. מחזירים מוקדם על התאמה מדויקת." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 5. Binary search on the answer — Ship Within D Days (LC 1011)       */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "min-throughput-drain-backlog",
  icon: "🚚",
  difficulty: "medium",
  tags: ["binary-search", "greedy", "capacity-planning"],
  leetcode: "1011",
  title: { en: "Minimum Throughput to Drain a Backlog in D Hours", he: "ה-throughput המינימלי לרוקן backlog תוך D שעות" },
  statement: {
    en: `<p>A queue has a backlog of batch jobs, <code>jobs[i]</code> = work units of job i. Jobs must be processed <strong>in order</strong> and a job can't be split across hours. Each hour, the worker pool processes consecutive jobs as long as their total does not exceed its hourly throughput <code>C</code>.</p>
<p>Return the <strong>minimum throughput C</strong> that drains the whole backlog within <code>hours</code> hours. This is LeetCode 1011 (Capacity To Ship Packages Within D Days).</p>
<ul><li>1 &lt;= hours &lt;= n &lt;= 5·10<sup>4</sup>, 1 &lt;= jobs[i] &lt;= 500</li></ul>`,
    he: `<p>בתור יש backlog של batch jobs, <code>jobs[i]</code> = יחידות עבודה של job i. חייבים לעבד את ה-jobs <strong>לפי הסדר</strong> ואי אפשר לפצל job בין שעות. בכל שעה, ה-worker pool מעבד jobs רצופים כל עוד הסכום שלהם לא עובר את ה-throughput השעתי <code>C</code>.</p>
<p>תחזיר את <strong>ה-throughput המינימלי C</strong> שמרוקן את כל ה-backlog תוך <code>hours</code> שעות. זו LeetCode 1011 (Capacity To Ship Packages Within D Days).</p>
<ul><li>1 &lt;= hours &lt;= n &lt;= 5·10<sup>4</sup>, 1 &lt;= jobs[i] &lt;= 500</li></ul>`
  },
  examples: `Input:  jobs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], hours = 5
Output: 15
# hour 1: 1+2+3+4+5 | hour 2: 6+7 | hour 3: 8 | hour 4: 9 | hour 5: 10

Input:  jobs = [3, 2, 2, 4, 1, 4], hours = 3
Output: 6        # [3,2] [2,4] [1,4]

Input:  jobs = [1, 2, 3, 1, 1], hours = 4
Output: 3        # [1] [2] [3] [1,1]`,
  hints: [
    { en: "If throughput C works, does C + 1 also work? What does that tell you about the set of valid answers?", he: "אם throughput C עובד, האם גם C + 1 עובד? מה זה אומר על קבוצת התשובות התקינות?" },
    { en: "Given a fixed C, checking feasibility is easy: greedily pack jobs into the current hour until the next one doesn't fit, then start a new hour. Count hours.", he: "בהינתן C קבוע, קל לבדוק אם הוא אפשרי: אורזים jobs בשעה הנוכחית בצורה greedy עד שהבא לא נכנס, ואז פותחים שעה חדשה. סופרים שעות." },
    { en: "Binary search C between max(jobs) (must fit the biggest job) and sum(jobs) (everything in one hour). Find the first C where the check passes.", he: "עושים binary search על C בין max(jobs) (חייב להכיל את ה-job הכי גדול) ל-sum(jobs) (הכל בשעה אחת). מחפשים את ה-C הראשון שעובר את הבדיקה." }
  ],
  solution: String.raw`from typing import List


def hours_needed(jobs: List[int], throughput: int) -> int:
    """Greedy: fill each hour with consecutive jobs until the next doesn't fit."""
    hours, load = 1, 0
    for work in jobs:
        if load + work > throughput:   # doesn't fit -> start a new hour
            hours += 1
            load = 0
        load += work
    return hours


def min_throughput(jobs: List[int], hours: int) -> int:
    """Smallest hourly throughput that drains jobs (in order) within hours (LC 1011)."""
    lo = max(jobs)          # below this the biggest job never fits
    hi = sum(jobs)          # always feasible: everything in one hour
    while lo < hi:          # find the FIRST feasible value in [lo, hi]
        mid = (lo + hi) // 2
        if hours_needed(jobs, mid) <= hours:
            hi = mid        # mid works, maybe something smaller works too
        else:
            lo = mid + 1    # mid is too slow
    return lo


if __name__ == "__main__":
    print(min_throughput([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))  # 15
    print(min_throughput([3, 2, 2, 4, 1, 4], 3))               # 6
    print(min_throughput([1, 2, 3, 1, 1], 4))                  # 3
`,
  explain: {
    en: `<p>We are not searching <em>in</em> the array, we are searching over the <strong>answer space</strong>. Feasibility is <strong>monotonic</strong>: if throughput C drains the backlog in time, any larger C does too. So the answers look like <code>[no, no, no, yes, yes, yes]</code> and binary search finds the first <code>yes</code>.</p>
<p>The check is greedy and O(n): packing each hour as full as possible never uses more hours than any other packing (an exchange argument: pushing a job earlier never hurts later hours). The bounds matter: <code>lo = max(jobs)</code> because a single job can't be split, <code>hi = sum(jobs)</code> because one hour can take everything. Total O(n · log(sum)).</p>
<p>The loop shape <code>while lo &lt; hi</code> / <code>hi = mid</code> / <code>lo = mid + 1</code> is the "first true" template: it always terminates with <code>lo == hi</code> on the answer.</p>
<p><strong>Pattern recognition:</strong> when you see "minimize the maximum" or "smallest capacity/speed such that it finishes within X", and checking one candidate is easy, think <strong>binary search on the answer + greedy feasibility check</strong>.</p>`,
    he: `<p>אנחנו לא מחפשים <em>בתוך</em> המערך, אלא ב<strong>מרחב התשובות</strong>. האפשרות היא <strong>מונוטונית</strong>: אם throughput C מרוקן את ה-backlog בזמן, כל C גדול יותר גם כן. אז התשובות נראות כמו <code>[no, no, no, yes, yes, yes]</code> ו-binary search מוצא את ה-<code>yes</code> הראשון.</p>
<p>הבדיקה היא greedy ו-O(n): למלא כל שעה כמה שיותר אף פעם לא משתמש ביותר שעות מכל אריזה אחרת (טיעון החלפה: להקדים job לא פוגע בשעות הבאות). הגבולות חשובים: <code>lo = max(jobs)</code> כי אי אפשר לפצל job, <code>hi = sum(jobs)</code> כי שעה אחת יכולה לקחת הכל. בסך הכל O(n · log(sum)).</p>
<p>צורת הלולאה <code>while lo &lt; hi</code> / <code>hi = mid</code> / <code>lo = mid + 1</code> היא התבנית של "ה-true הראשון": היא תמיד נגמרת עם <code>lo == hi</code> על התשובה.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "למזער את המקסימום" או "הקיבולת/מהירות הקטנה ביותר כך שיסתיים תוך X", ובדיקה של מועמד אחד קלה, חושבים על <strong>binary search על התשובה + בדיקת אפשרות greedy</strong>.</p>`
  },
  complexity: "Time O(n · log(sum(jobs) - max(jobs))), Space O(1)",
  whyInfra: {
    en: "This is capacity planning in miniature: \"how many consumers / how much IOPS / what instance size do we need to drain this Kafka lag or SQS backlog before the SLA?\" Real autoscalers (KEDA on queue length, Karpenter bin-packing) answer variants of it continuously. The binary-search-on-answer trick also shows up in load testing: binary-search the RPS at which p99 crosses the SLO, because \"passes the SLO\" is monotonic in load.",
    he: "זה capacity planning בקטן: \"כמה consumers / כמה IOPS / איזה instance size צריך כדי לרוקן את ה-lag ב-Kafka או את ה-backlog ב-SQS לפני ה-SLA?\" Autoscalers אמיתיים (KEDA לפי אורך תור, ה-bin-packing של Karpenter) עונים על וריאציות של זה כל הזמן. הטריק של binary search על התשובה מופיע גם ב-load testing: עושים binary search על ה-RPS שבו ה-p99 חוצה את ה-SLO, כי \"עומד ב-SLO\" הוא מונוטוני בעומס."
  },
  followUps: [
    { q: { en: "What if jobs can run in any order?", he: "מה אם אפשר להריץ את ה-jobs בכל סדר?" },
      a: { en: "Then it's bin packing (NP-hard): minimize bin size for a fixed number of bins. In an interview, say so, then offer heuristics like First-Fit-Decreasing, or binary search on C with a backtracking feasibility check for small n.", he: "אז זה bin packing (NP-hard): למזער את גודל ה-bin עבור מספר bins קבוע. בראיון, תגיד את זה, ואז תציע היוריסטיקות כמו First-Fit-Decreasing, או binary search על C עם בדיקת אפשרות ב-backtracking ל-n קטן." } },
    { q: { en: "Name another problem with the exact same shape.", he: "תן עוד בעיה עם בדיוק אותה צורה." },
      a: { en: "Koko Eating Bananas (875, minimum speed), Split Array Largest Sum (410, split logs across k workers minimizing the biggest shard), and Minimum Time to Complete Trips (2187). Same template, different feasibility function.", he: "Koko Eating Bananas (875, מהירות מינימלית), Split Array Largest Sum (410, לפצל לוגים בין k workers כך שה-shard הכי גדול יהיה מינימלי), ו-Minimum Time to Complete Trips (2187). אותה תבנית, פונקציית בדיקה אחרת." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 6. Binary search — First and Last Position (LC 34)                  */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "log-range-by-timestamp",
  icon: "🔎",
  difficulty: "medium",
  tags: ["binary-search", "logs"],
  leetcode: "34",
  title: { en: "Find the Log Range for a Timestamp", he: "למצוא את טווח הלוגים של timestamp" },
  statement: {
    en: `<p>A log segment is sorted by timestamp (epoch seconds), and many lines share the same second. Given the sorted list <code>ts</code> and a timestamp <code>t</code>, return <code>[first, last]</code>: the index of the first and last line with timestamp <code>t</code>, or <code>[-1, -1]</code> if there is none.</p>
<p>Must run in <strong>O(log n)</strong>: the segment has millions of lines. This is LeetCode 34 (Find First and Last Position of Element in Sorted Array). Implement the binary search yourself (then mention <code>bisect</code>).</p>`,
    he: `<p>Log segment ממוין לפי timestamp (epoch seconds), והרבה שורות חולקות את אותה שנייה. בהינתן הרשימה הממוינת <code>ts</code> ו-timestamp <code>t</code>, תחזיר <code>[first, last]</code>: האינדקס של השורה הראשונה והאחרונה עם timestamp <code>t</code>, או <code>[-1, -1]</code> אם אין כזו.</p>
<p>חייב לרוץ ב-<strong>O(log n)</strong>: ב-segment יש מיליוני שורות. זו LeetCode 34 (Find First and Last Position of Element in Sorted Array). תממש את ה-binary search בעצמך (ואחר כך תזכיר את <code>bisect</code>).</p>`
  },
  examples: `Input:  ts = [5, 7, 7, 8, 8, 10], t = 8
Output: [3, 4]

Input:  ts = [5, 7, 7, 8, 8, 10], t = 6
Output: [-1, -1]

Input:  ts = [], t = 0           -> [-1, -1]
Input:  ts = [3, 3, 3], t = 3    -> [0, 2]`,
  hints: [
    { en: "A normal binary search stops at any match. You need the leftmost and rightmost match, so don't stop on equality.", he: "Binary search רגיל עוצר על התאמה כלשהי. אתה צריך את ההתאמה השמאלית והימנית ביותר, אז לא עוצרים על שוויון." },
    { en: "Write one helper: lower_bound(x) = first index with ts[i] &gt;= x. Then first = lower_bound(t) and last = lower_bound(t + 1) - 1.", he: "תכתוב helper אחד: lower_bound(x) = האינדקס הראשון עם ts[i] &gt;= x. ואז first = lower_bound(t) ו-last = lower_bound(t + 1) - 1." },
    { en: "Use the half-open template: lo = 0, hi = len(ts); while lo &lt; hi; if ts[mid] &lt; x: lo = mid + 1 else hi = mid. It handles empty input and \"past the end\" for free.", he: "תשתמש בתבנית החצי-פתוחה: lo = 0, hi = len(ts); while lo &lt; hi; if ts[mid] &lt; x: lo = mid + 1 else hi = mid. היא מטפלת ב-input ריק וב\"אחרי הסוף\" בחינם." }
  ],
  solution: String.raw`from typing import List


def lower_bound(ts: List[int], x: int) -> int:
    """First index i with ts[i] >= x (len(ts) if none). Same as bisect_left."""
    lo, hi = 0, len(ts)            # search space is the half-open range [lo, hi)
    while lo < hi:
        mid = (lo + hi) // 2
        if ts[mid] < x:
            lo = mid + 1           # answer is strictly right of mid
        else:
            hi = mid               # mid could be the answer
    return lo


def log_range(ts: List[int], t: int) -> List[int]:
    """[first, last] index of timestamp t in sorted ts, or [-1, -1] (LC 34)."""
    first = lower_bound(ts, t)
    if first == len(ts) or ts[first] != t:
        return [-1, -1]
    last = lower_bound(ts, t + 1) - 1  # integer timestamps: next value is t + 1
    return [first, last]


if __name__ == "__main__":
    print(log_range([5, 7, 7, 8, 8, 10], 8))  # [3, 4]
    print(log_range([5, 7, 7, 8, 8, 10], 6))  # [-1, -1]
    print(log_range([], 0))                   # [-1, -1]
`,
  explain: {
    en: `<p>Everything reduces to one well-tested primitive: <strong>lower_bound</strong>, the first position where <code>ts[i] &gt;= x</code>. It's a "first true" binary search over the monotonic predicate <code>ts[i] &gt;= x</code>. The half-open interval <code>[lo, hi)</code> with <code>hi = len(ts)</code> means the answer can be "past the end", which is exactly what we want when <code>x</code> is larger than everything.</p>
<p>The first occurrence is <code>lower_bound(t)</code> (then verify it really equals <code>t</code>). The last occurrence is one before the first element <code>&gt; t</code>, i.e. <code>lower_bound(t + 1) - 1</code> for integers; for floats use an <code>upper_bound</code> helper (<code>ts[mid] &lt;= x</code> instead of <code>&lt;</code>), which is <code>bisect_right</code>. Two O(log n) searches.</p>
<p>Avoid the tempting "find any match, then walk left and right": if one second has a million lines, that's O(n).</p>
<p><strong>Pattern recognition:</strong> when you see "sorted data" plus "first/last/count/range of X", think <strong>lower_bound / upper_bound (bisect_left / bisect_right)</strong>, never a linear walk from a match.</p>`,
    he: `<p>הכל מתכנס ל-primitive אחד שנבדק היטב: <strong>lower_bound</strong>, המיקום הראשון שבו <code>ts[i] &gt;= x</code>. זה binary search של "ה-true הראשון" על ה-predicate המונוטוני <code>ts[i] &gt;= x</code>. הטווח החצי-פתוח <code>[lo, hi)</code> עם <code>hi = len(ts)</code> אומר שהתשובה יכולה להיות "אחרי הסוף", וזה בדיוק מה שרוצים כש-<code>x</code> גדול מהכל.</p>
<p>ההופעה הראשונה היא <code>lower_bound(t)</code> (ואז מוודאים שהיא באמת שווה ל-<code>t</code>). ההופעה האחרונה היא אחת לפני האיבר הראשון שהוא <code>&gt; t</code>, כלומר <code>lower_bound(t + 1) - 1</code> למספרים שלמים; ל-floats משתמשים ב-helper של <code>upper_bound</code> (<code>ts[mid] &lt;= x</code> במקום <code>&lt;</code>), שזה <code>bisect_right</code>. שני חיפושים של O(log n).</p>
<p>תימנע מהפיתוי של "למצוא התאמה כלשהי ואז ללכת שמאלה וימינה": אם בשנייה אחת יש מיליון שורות, זה O(n).</p>
<p><strong>זיהוי pattern:</strong> כשרואים "מידע ממוין" ועוד "ראשון/אחרון/כמות/טווח של X", חושבים על <strong>lower_bound / upper_bound (bisect_left / bisect_right)</strong>, אף פעם לא הליכה לינארית מהתאמה.</p>`
  },
  complexity: "Time O(log n), Space O(1)",
  whyInfra: {
    en: "Time-sorted storage is everywhere: Kafka finds the offset for a timestamp with a binary search over its <code>.timeindex</code> file, Loki and Elasticsearch prune chunks/segments by min/max time, Prometheus TSDB blocks are time-partitioned, and <code>journalctl --since/--until</code> seeks by time. \"Give me all lines between 10:02:00 and 10:02:59\" is exactly lower_bound(start) to upper_bound(end).",
    he: "אחסון שממוין לפי זמן נמצא בכל מקום: Kafka מוצא את ה-offset של timestamp עם binary search על קובץ ה-<code>.timeindex</code> שלו, Loki ו-Elasticsearch מסננים chunks/segments לפי min/max time, ה-blocks ב-Prometheus TSDB מחולקים לפי זמן, ו-<code>journalctl --since/--until</code> קופץ לפי זמן. \"תביא לי את כל השורות בין 10:02:00 ל-10:02:59\" זה בדיוק lower_bound(start) עד upper_bound(end)."
  },
  followUps: [
    { q: { en: "Return all lines in a time range [t1, t2].", he: "תחזיר את כל השורות בטווח זמן [t1, t2]." },
      a: { en: "lines[bisect_left(ts, t1) : bisect_right(ts, t2)]. Two binary searches, then a slice of size k: O(log n + k).", he: "lines[bisect_left(ts, t1) : bisect_right(ts, t2)]. שני binary searches ואז slice בגודל k: O(log n + k)." } },
    { q: { en: "The log is a 50 GB file on disk, not a list. Now what?", he: "הלוג הוא קובץ של 50 GB בדיסק, לא list. מה עכשיו?" },
      a: { en: "Binary search on byte offsets: seek to the middle, skip to the next newline, parse its timestamp, and narrow. That's O(log n) seeks. Or build a sparse index (timestamp every N KB) like Kafka's index files, and binary search the index first.", he: "Binary search על byte offsets: קופצים לאמצע, מתקדמים לשורה הבאה, מפרסרים את ה-timestamp ומצמצמים. זה O(log n) seeks. או בונים sparse index (timestamp כל N KB) כמו קבצי ה-index של Kafka, ועושים binary search קודם על ה-index." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 7. DP — Coin Change (LC 322)                                        */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "fewest-instances-capacity-target",
  icon: "🪙",
  difficulty: "medium",
  tags: ["dynamic-programming", "unbounded-knapsack"],
  leetcode: "322",
  title: { en: "Fewest Instances to Hit a Capacity Target", he: "הכי מעט instances כדי להגיע ליעד capacity" },
  statement: {
    en: `<p>Your cloud offers instance sizes with fixed vCPU counts, e.g. <code>sizes = [4, 12, 16]</code>, and you can launch any number of each. A licensing rule says the fleet must have <strong>exactly</strong> <code>target</code> vCPUs. Return the <strong>minimum number of instances</strong> that sum exactly to <code>target</code>, or <code>-1</code> if it's impossible.</p>
<p>This is LeetCode 322 (Coin Change).</p>
<ul><li>1 &lt;= len(sizes) &lt;= 12, 0 &lt;= target &lt;= 10<sup>4</sup></li></ul>`,
    he: `<p>ה-cloud שלך מציע instance sizes עם מספר vCPU קבוע, למשל <code>sizes = [4, 12, 16]</code>, ואפשר להרים כמה שרוצים מכל אחד. חוק רישוי קובע שב-fleet צריכים להיות <strong>בדיוק</strong> <code>target</code> vCPUs. תחזיר את <strong>מספר ה-instances המינימלי</strong> שמסתכם בדיוק ל-<code>target</code>, או <code>-1</code> אם זה בלתי אפשרי.</p>
<p>זו LeetCode 322 (Coin Change).</p>
<ul><li>1 &lt;= len(sizes) &lt;= 12, 0 &lt;= target &lt;= 10<sup>4</sup></li></ul>`
  },
  examples: `Input:  sizes = [4, 12, 16], target = 24
Output: 2            # 12 + 12  (greedy 16 + 4 + 4 = 3 instances is worse)

Input:  sizes = [1, 2, 5], target = 11
Output: 3            # 5 + 5 + 1

Input:  sizes = [2], target = 3     -> -1
Input:  sizes = [1], target = 0     -> 0`,
  hints: [
    { en: "Try greedy (largest size first) on sizes [4, 12, 16] and target 24. Why does it fail?", he: "תנסה greedy (הגודל הכי גדול קודם) על sizes [4, 12, 16] ו-target 24. למה זה נכשל?" },
    { en: "Define best[a] = fewest instances that sum to exactly a. The last instance you add has some size s, so best[a] = 1 + min(best[a - s]).", he: "תגדיר best[a] = הכי מעט instances שמסתכמים בדיוק ל-a. ל-instance האחרון שהוספת יש גודל s, אז best[a] = 1 + min(best[a - s])." },
    { en: "Fill best[0..target] bottom-up with best[0] = 0 and \"infinity\" for unreachable amounts.", he: "ממלאים את best[0..target] מלמטה למעלה עם best[0] = 0 ו\"אינסוף\" לסכומים שאי אפשר להגיע אליהם." }
  ],
  solution: String.raw`from typing import List


def fewest_instances(sizes: List[int], target: int) -> int:
    """Min number of instances whose vCPUs sum exactly to target, or -1 (LC 322)."""
    INF = float("inf")
    best = [0] + [INF] * target          # best[a] = fewest instances summing to a
    for amount in range(1, target + 1):
        for s in sizes:
            # Use one instance of size s on top of the best way to build amount - s.
            if s <= amount and best[amount - s] + 1 < best[amount]:
                best[amount] = best[amount - s] + 1
    return best[target] if best[target] != INF else -1


if __name__ == "__main__":
    print(fewest_instances([4, 12, 16], 24))  # 2
    print(fewest_instances([1, 2, 5], 11))    # 3
    print(fewest_instances([2], 3))           # -1
`,
  explain: {
    en: `<p><strong>Why greedy fails:</strong> sizes don't form a "canonical" system. Taking 16 for target 24 leaves 8, which needs two 4s (3 instances), while 12 + 12 needs 2. Whenever a local choice can block a better global combination, think DP.</p>
<p><strong>State:</strong> <code>best[a]</code> = fewest instances summing to exactly <code>a</code>. <strong>Transition:</strong> any optimal fleet for <code>a</code> has a "last" instance of some size <code>s</code>; removing it leaves an optimal fleet for <code>a - s</code>. So <code>best[a] = 1 + min over s of best[a - s]</code>. <strong>Base:</strong> <code>best[0] = 0</code>. Unreachable amounts stay infinite, which naturally propagates <code>-1</code>.</p>
<p>It's an <em>unbounded</em> knapsack: each size can be reused, which is why we read <code>best[a - s]</code> from the same table we are filling. You can also see it as BFS on amounts 0..target where each edge adds one instance; BFS's level is the instance count.</p>
<p><strong>Pattern recognition:</strong> when you see "minimum number of items to reach an exact total" with reusable items, think <strong>1-D DP over the total (unbounded knapsack)</strong>, and test greedy against a counter-example first.</p>`,
    he: `<p><strong>למה greedy נכשל:</strong> הגדלים לא יוצרים מערכת "קנונית". לקחת 16 עבור target 24 משאיר 8, שדורש שני 4 (3 instances), בזמן ש-12 + 12 דורש 2. בכל פעם שבחירה מקומית יכולה לחסום שילוב גלובלי טוב יותר, חושבים DP.</p>
<p><strong>State:</strong> <code>best[a]</code> = הכי מעט instances שמסתכמים בדיוק ל-<code>a</code>. <strong>מעבר:</strong> לכל fleet אופטימלי עבור <code>a</code> יש instance "אחרון" בגודל <code>s</code>; אם מורידים אותו נשאר fleet אופטימלי עבור <code>a - s</code>. אז <code>best[a] = 1 + min על s של best[a - s]</code>. <strong>בסיס:</strong> <code>best[0] = 0</code>. סכומים שאי אפשר להגיע אליהם נשארים אינסוף, וזה מעביר <code>-1</code> באופן טבעי.</p>
<p>זה knapsack <em>unbounded</em>: אפשר להשתמש בכל גודל שוב, ולכן קוראים את <code>best[a - s]</code> מאותה טבלה שממלאים. אפשר לראות את זה גם כ-BFS על הסכומים 0..target שבו כל קשת מוסיפה instance אחד; הרמה ב-BFS היא מספר ה-instances.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "מספר מינימלי של פריטים כדי להגיע לסכום מדויק" עם פריטים שאפשר לחזור עליהם, חושבים על <strong>DP חד-ממדי על הסכום (unbounded knapsack)</strong>, ובודקים קודם את ה-greedy מול דוגמה נגדית.</p>`
  },
  complexity: "Time O(target · len(sizes)), Space O(target)",
  whyInfra: {
    en: "Fleet sizing and bin-packing decisions (Karpenter picking instance types, Spot Fleet allocation, reserved-instance planning) are knapsack-family problems. The interview lesson is the important one: \"just take the biggest box\" is a greedy heuristic that can waste money, and real schedulers say explicitly when they use a heuristic instead of an exact solver.",
    he: "החלטות של fleet sizing ו-bin packing (Karpenter שבוחר instance types, הקצאה ב-Spot Fleet, תכנון reserved instances) הן בעיות ממשפחת ה-knapsack. הלקח מהראיון הוא החשוב: \"פשוט תיקח את הקופסה הכי גדולה\" זו היוריסטיקה greedy שיכולה לבזבז כסף, ו-schedulers אמיתיים אומרים במפורש מתי הם משתמשים בהיוריסטיקה במקום ב-solver מדויק."
  },
  followUps: [
    { q: { en: "Count the number of distinct fleets that reach the target.", he: "תספור כמה fleets שונים מגיעים ל-target." },
      a: { en: "LeetCode 518 (Coin Change II): ways[0] = 1; loop sizes in the OUTER loop and amounts in the inner loop, ways[a] += ways[a - s]. Sizes outer means each combination is counted once, not once per ordering.", he: "LeetCode 518 (Coin Change II): ways[0] = 1; הלולאה החיצונית על ה-sizes והפנימית על הסכומים, ways[a] += ways[a - s]. Sizes בחוץ אומר שכל קומבינציה נספרת פעם אחת, ולא פעם לכל סדר." } },
    { q: { en: "Minimize cost instead of count, where each size has a price.", he: "למזער עלות במקום כמות, כשלכל גודל יש מחיר." },
      a: { en: "Same DP, replace +1 with +price[s]. If you also allow \"at least target\" instead of exactly, extend the table to target + max(sizes) and take the min over that tail.", he: "אותו DP, מחליפים את ה-+1 ב-+price[s]. אם מותר גם \"לפחות target\" במקום בדיוק, מרחיבים את הטבלה עד target + max(sizes) ולוקחים את המינימום על הזנב." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 8. DP — Edit Distance (LC 72)                                       */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "config-drift-edit-distance",
  icon: "🧬",
  difficulty: "medium",
  tags: ["dynamic-programming", "strings", "diff"],
  leetcode: "72",
  title: { en: "Config Drift Distance (Edit Distance)", he: "מרחק ה-drift בקונפיגורציה (Edit Distance)" },
  statement: {
    en: `<p>Your GitOps controller compares the <strong>desired</strong> config (from git) with the <strong>live</strong> config on a server, line by line. Return the <strong>minimum number of single-line operations</strong> (insert a line, delete a line, replace a line) that turn <code>live</code> into <code>desired</code>. A drift score above a threshold triggers an alert.</p>
<p>The function must work on any sequences: lists of lines, or plain strings (characters). This is LeetCode 72 (Edit Distance / Levenshtein distance).</p>
<ul><li>0 &lt;= len(a), len(b) &lt;= 500</li></ul>`,
    he: `<p>ה-GitOps controller שלך משווה את הקונפיגורציה ה<strong>רצויה</strong> (מ-git) לקונפיגורציה ה<strong>חיה</strong> על שרת, שורה מול שורה. תחזיר את <strong>מספר הפעולות המינימלי על שורה בודדת</strong> (הוספת שורה, מחיקת שורה, החלפת שורה) שהופכות את <code>live</code> ל-<code>desired</code>. ציון drift מעל סף מקפיץ alert.</p>
<p>הפונקציה צריכה לעבוד על כל רצף: lists של שורות או strings רגילים (תווים). זו LeetCode 72 (Edit Distance / מרחק Levenshtein).</p>
<ul><li>0 &lt;= len(a), len(b) &lt;= 500</li></ul>`
  },
  examples: `Input:  live    = ["port 80", "workers 4", "gzip on"]
        desired = ["port 80", "workers 8", "gzip on", "http2 on"]
Output: 2        # replace "workers 4" -> "workers 8", insert "http2 on"

Input:  "horse", "ros"            -> 3   # LeetCode example
Input:  "intention", "execution"  -> 5
Input:  [], ["a", "b"]            -> 2
Input:  "same", "same"            -> 0`,
  hints: [
    { en: "Look at the last element of both sequences. If they are equal, what is left to solve? If not, what are the three possible last operations?", he: "תסתכל על האיבר האחרון בשני הרצפים. אם הם שווים, מה נשאר לפתור? ואם לא, מה שלוש הפעולות האחרונות האפשריות?" },
    { en: "dp[i][j] = distance between the first i items of a and the first j items of b. dp[i][0] = i (delete all), dp[0][j] = j (insert all).", he: "dp[i][j] = המרחק בין i האיברים הראשונים של a ל-j הראשונים של b. dp[i][0] = i (למחוק הכל), dp[0][j] = j (להוסיף הכל)." },
    { en: "If a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1]. Else 1 + min(delete dp[i-1][j], insert dp[i][j-1], replace dp[i-1][j-1]). Only the previous row is needed.", he: "אם a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1]. אחרת 1 + min(מחיקה dp[i-1][j], הוספה dp[i][j-1], החלפה dp[i-1][j-1]). צריך רק את השורה הקודמת." }
  ],
  solution: String.raw`from typing import Hashable, Sequence


def drift_distance(live: Sequence[Hashable], desired: Sequence[Hashable]) -> int:
    """Min inserts/deletes/replaces turning live into desired (LC 72), O(m*n) time, O(n) space."""
    m, n = len(live), len(desired)
    # prev[j] = distance between live[:i-1] and desired[:j]; start with i = 0:
    prev = list(range(n + 1))            # empty live -> insert j lines
    for i in range(1, m + 1):
        cur = [i] + [0] * n              # live[:i] -> empty desired: delete i lines
        for j in range(1, n + 1):
            if live[i - 1] == desired[j - 1]:
                cur[j] = prev[j - 1]     # same line: no cost
            else:
                cur[j] = 1 + min(
                    prev[j],             # delete live[i-1]
                    cur[j - 1],          # insert desired[j-1]
                    prev[j - 1],         # replace live[i-1] with desired[j-1]
                )
        prev = cur
    return prev[n]


if __name__ == "__main__":
    live = ["port 80", "workers 4", "gzip on"]
    desired = ["port 80", "workers 8", "gzip on", "http2 on"]
    print(drift_distance(live, desired))            # 2
    print(drift_distance("horse", "ros"))           # 3
    print(drift_distance("intention", "execution")) # 5
`,
  explain: {
    en: `<p>Classic 2-D DP over prefixes. Think about the <strong>last operation</strong> in an optimal edit script from <code>live[:i]</code> to <code>desired[:j]</code>:</p>
<ul>
<li>Last items equal: they line up for free, <code>dp[i][j] = dp[i-1][j-1]</code>.</li>
<li>Otherwise one of three things happened last: <strong>delete</strong> <code>live[i-1]</code> (<code>dp[i-1][j]</code>), <strong>insert</strong> <code>desired[j-1]</code> (<code>dp[i][j-1]</code>), or <strong>replace</strong> one with the other (<code>dp[i-1][j-1]</code>). Take 1 + the minimum.</li>
</ul>
<p>Base cases are the empty prefixes: turning <code>i</code> lines into nothing costs <code>i</code> deletes, and nothing into <code>j</code> lines costs <code>j</code> inserts. Each cell depends only on the row above and the cell to its left, so we keep two rows: O(n) memory instead of O(m·n). Because we compare with <code>==</code>, the same code works for characters or whole lines.</p>
<p><strong>Pattern recognition:</strong> when you see "minimum operations to transform sequence A into B" or "longest common subsequence", think <strong>2-D DP on prefixes dp[i][j], decided by the last element</strong>.</p>`,
    he: `<p>DP דו-ממדי קלאסי על prefixes. חושבים על <strong>הפעולה האחרונה</strong> בסקריפט עריכה אופטימלי מ-<code>live[:i]</code> ל-<code>desired[:j]</code>:</p>
<ul>
<li>האיברים האחרונים שווים: הם מתיישרים בחינם, <code>dp[i][j] = dp[i-1][j-1]</code>.</li>
<li>אחרת אחד משלושה דברים קרה אחרון: <strong>מחיקה</strong> של <code>live[i-1]</code> (<code>dp[i-1][j]</code>), <strong>הוספה</strong> של <code>desired[j-1]</code> (<code>dp[i][j-1]</code>), או <strong>החלפה</strong> של אחד בשני (<code>dp[i-1][j-1]</code>). לוקחים 1 + המינימום.</li>
</ul>
<p>מקרי הבסיס הם ה-prefixes הריקים: להפוך <code>i</code> שורות לכלום עולה <code>i</code> מחיקות, ומכלום ל-<code>j</code> שורות עולה <code>j</code> הוספות. כל תא תלוי רק בשורה שמעליו ובתא שמשמאלו, אז מחזיקים שתי שורות: O(n) זיכרון במקום O(m·n). מכיוון שמשווים עם <code>==</code>, אותו קוד עובד על תווים או על שורות שלמות.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "מספר פעולות מינימלי להפוך רצף A ל-B" או "longest common subsequence", חושבים על <strong>DP דו-ממדי על prefixes dp[i][j], שמוכרע לפי האיבר האחרון</strong>.</p>`
  },
  complexity: "Time O(m · n), Space O(min(m, n)) with the two-row trick (O(n) as written)",
  whyInfra: {
    en: "Drift detection and diffs are this algorithm's family: <code>diff</code>/<code>git diff</code> use Myers' algorithm (an optimized edit script with insert/delete only), <code>terraform plan</code> and Argo CD show desired-vs-live diffs, and Ansible <code>--diff</code> prints line edits. Levenshtein distance itself powers \"did you mean\" suggestions in CLIs (git, kubectl plugins) and fuzzy matching of hostnames or alert names during dedup.",
    he: "זיהוי drift ו-diffs הם המשפחה של האלגוריתם הזה: <code>diff</code>/<code>git diff</code> משתמשים באלגוריתם של Myers (סקריפט עריכה מאופטם עם הוספה/מחיקה בלבד), <code>terraform plan</code> ו-Argo CD מציגים diff של desired מול live, ו-Ansible <code>--diff</code> מדפיס עריכות שורה. מרחק Levenshtein עצמו מפעיל הצעות \"did you mean\" ב-CLIs (git, plugins של kubectl) והתאמה fuzzy של hostnames או שמות alerts ב-dedup."
  },
  followUps: [
    { q: { en: "Return the actual edit script, not just the number.", he: "תחזיר את סקריפט העריכה עצמו, לא רק את המספר." },
      a: { en: "Keep the full m×n table (or store which choice won per cell), then backtrack from dp[m][n] to dp[0][0], emitting delete/insert/replace/keep. Hirschberg's algorithm gets the script in O(n) memory with divide and conquer.", he: "שומרים את כל טבלת ה-m×n (או שומרים איזו בחירה ניצחה בכל תא), ואז הולכים אחורה מ-dp[m][n] ל-dp[0][0] ומוציאים delete/insert/replace/keep. האלגוריתם של Hirschberg מוציא את הסקריפט ב-O(n) זיכרון עם divide and conquer." } },
    { q: { en: "The configs are 100k lines and mostly identical. O(m·n) is too slow.", he: "הקונפיגים באורך 100k שורות וכמעט זהים. O(m·n) איטי מדי." },
      a: { en: "Strip the common prefix and suffix first, hash lines to ints, and use Myers' O((m+n)·D) algorithm where D is the number of differences: when drift is small, it's near-linear. That's why git diff is fast on big files with small changes.", he: "קודם מורידים את ה-prefix וה-suffix המשותפים, עושים hash לשורות למספרים, ומשתמשים באלגוריתם של Myers ב-O((m+n)·D) כש-D הוא מספר ההבדלים: כשה-drift קטן, זה כמעט לינארי. בגלל זה git diff מהיר על קבצים גדולים עם שינויים קטנים." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 9. Backtracking — Combination Sum (LC 39)                           */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "instance-mix-exact-budget",
  icon: "🧩",
  difficulty: "medium",
  tags: ["backtracking", "recursion"],
  leetcode: "39",
  title: { en: "Instance Mixes That Exactly Fit a Budget", he: "שילובי instances שנכנסים בדיוק בתקציב" },
  statement: {
    en: `<p>FinOps gives you an hourly budget (in cents) that must be spent <strong>exactly</strong>, for example to consume a committed-use discount. You have a list of <strong>distinct</strong> instance prices, and you can buy any number of each. Return <strong>all unique mixes</strong> (multisets of prices) that sum exactly to <code>budget</code>.</p>
<p>Two mixes are the same if they contain the same prices with the same counts, regardless of order. This is LeetCode 39 (Combination Sum).</p>
<ul><li>1 &lt;= len(prices) &lt;= 30, 2 &lt;= prices[i] &lt;= 40, 1 &lt;= budget &lt;= 40</li></ul>`,
    he: `<p>FinOps נותנים לך תקציב שעתי (בסנטים) שחייבים לנצל <strong>בדיוק</strong>, למשל כדי לממש הנחת committed-use. יש לך רשימה של מחירי instances <strong>שונים</strong>, ואפשר לקנות כמה שרוצים מכל אחד. תחזיר <strong>את כל השילובים הייחודיים</strong> (multisets של מחירים) שמסתכמים בדיוק ל-<code>budget</code>.</p>
<p>שני שילובים זהים אם יש בהם אותם מחירים באותן כמויות, בלי קשר לסדר. זו LeetCode 39 (Combination Sum).</p>
<ul><li>1 &lt;= len(prices) &lt;= 30, 2 &lt;= prices[i] &lt;= 40, 1 &lt;= budget &lt;= 40</li></ul>`
  },
  examples: `Input:  prices = [2, 3, 6, 7], budget = 7
Output: [[2, 2, 3], [7]]

Input:  prices = [2, 3, 5], budget = 8
Output: [[2, 2, 2, 2], [2, 3, 3], [3, 5]]

Input:  prices = [2], budget = 1
Output: []`,
  hints: [
    { en: "Build a mix one instance at a time and recurse on the remaining budget. How do you avoid generating [2, 3] and [3, 2] as two different answers?", he: "תבנה שילוב instance אחד בכל פעם ותעשה רקורסיה על התקציב שנשאר. איך נמנעים מלייצר את [2, 3] ואת [3, 2] כשתי תשובות שונות?" },
    { en: "Only allow choices from index start onwards. Recurse with the same index (reuse allowed), never with an earlier one. Mixes are then generated in non-decreasing order, each exactly once.", he: "מרשים בחירה רק מאינדקס start והלאה. עושים רקורסיה עם אותו אינדקס (מותר לחזור), אף פעם לא עם אינדקס קודם. ככה כל שילוב נוצר בסדר לא-יורד, ובדיוק פעם אחת." },
    { en: "Sort the prices: as soon as a price exceeds the remaining budget, every later price does too, so break out of the loop (pruning).", he: "תמיין את המחירים: ברגע שמחיר עובר את התקציב שנשאר, גם כל המחירים שאחריו עוברים, אז יוצאים מהלולאה (pruning)." }
  ],
  solution: String.raw`from typing import List


def exact_budget_mixes(prices: List[int], budget: int) -> List[List[int]]:
    """All unique multisets of prices summing exactly to budget (LC 39)."""
    prices = sorted(prices)              # enables the early break below
    result: List[List[int]] = []
    mix: List[int] = []                  # current partial mix (the "path")

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            result.append(mix.copy())    # copy: mix keeps changing
            return
        for i in range(start, len(prices)):
            price = prices[i]
            if price > remaining:        # sorted -> all later prices too big
                break
            mix.append(price)            # choose
            backtrack(i, remaining - price)  # same i: this price can repeat
            mix.pop()                    # un-choose

    backtrack(0, budget)
    return result


if __name__ == "__main__":
    print(exact_budget_mixes([2, 3, 6, 7], 7))  # [[2, 2, 3], [7]]
    print(exact_budget_mixes([2, 3, 5], 8))     # [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
`,
  explain: {
    en: `<p>Backtracking explores a decision tree: at each node we <strong>choose</strong> a price, <strong>recurse</strong> on the smaller budget, then <strong>un-choose</strong> it (pop) to try the next option. A leaf with <code>remaining == 0</code> is a valid mix; we append a <em>copy</em> because <code>mix</code> is reused.</p>
<p>The <code>start</code> index is the dedup trick: we only pick prices at index &gt;= the last one picked, so every mix is built in sorted order and generated once. Passing <code>i</code> (not <code>i + 1</code>) allows reuse of the same price; passing <code>i + 1</code> would turn this into "each price at most once" (LeetCode 40). Sorting plus <code>break</code> prunes whole subtrees as soon as prices get too big.</p>
<p>The output itself can be exponential, so no algorithm is polynomial here; the goal is to avoid exploring dead or duplicate branches.</p>
<p><strong>Pattern recognition:</strong> when you see "return <em>all</em> combinations / subsets / permutations / placements", think <strong>backtracking: choose, recurse, un-choose, with a start index for combinations and pruning on sorted input</strong>. If they only ask "how many" or "the best one", think DP instead.</p>`,
    he: `<p>Backtracking סורק עץ החלטות: בכל צומת <strong>בוחרים</strong> מחיר, עושים <strong>רקורסיה</strong> על התקציב הקטן יותר, ואז <strong>מבטלים</strong> את הבחירה (pop) כדי לנסות את האפשרות הבאה. עלה עם <code>remaining == 0</code> הוא שילוב תקין; מוסיפים <em>עותק</em> כי <code>mix</code> ממשיך להשתנות.</p>
<p>האינדקס <code>start</code> הוא הטריק ל-dedup: בוחרים רק מחירים באינדקס &gt;= זה שנבחר אחרון, אז כל שילוב נבנה בסדר ממוין ונוצר פעם אחת. להעביר <code>i</code> (ולא <code>i + 1</code>) מאפשר לחזור על אותו מחיר; <code>i + 1</code> היה הופך את זה ל"כל מחיר לכל היותר פעם אחת" (LeetCode 40). מיון ועוד <code>break</code> חותכים תתי-עצים שלמים ברגע שהמחירים גדולים מדי.</p>
<p>ה-output עצמו יכול להיות אקספוננציאלי, אז אין פה אלגוריתם פולינומי; המטרה היא לא לסרוק ענפים מתים או כפולים.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "תחזיר את <em>כל</em> הקומבינציות / תתי-הקבוצות / הפרמוטציות / ההצבות", חושבים על <strong>backtracking: לבחור, רקורסיה, לבטל, עם start index לקומבינציות ו-pruning על input ממוין</strong>. אם שואלים רק "כמה" או "מה הכי טוב", חושבים DP.</p>`
  },
  complexity: "Time O(N^(T/m + 1)) worst case (N prices, T budget, m smallest price) — exponential, bounded by output size; Space O(T/m) recursion depth",
  whyInfra: {
    en: "Enumerating feasible configurations is a real platform task: listing every instance mix that matches a Savings Plan commitment, every node-pool combination that satisfies a cluster's CPU/GPU request, or every placement of replicas across zones that meets anti-affinity. Kubernetes' scheduler and Karpenter avoid full enumeration with heuristics precisely because this search blows up; knowing when to switch from \"all options\" to \"good enough\" is the senior signal.",
    he: "לעבור על כל הקונפיגורציות האפשריות זו משימת platform אמיתית: לרשום כל שילוב instances שמתאים להתחייבות של Savings Plan, כל שילוב של node pools שעומד בבקשת CPU/GPU של cluster, או כל הצבה של replicas בין zones שעומדת ב-anti-affinity. ה-scheduler של Kubernetes ו-Karpenter נמנעים מסריקה מלאה עם היוריסטיקות בדיוק כי החיפוש הזה מתפוצץ; לדעת מתי לעבור מ\"כל האפשרויות\" ל\"מספיק טוב\" זה הסיגנל של סניור."
  },
  followUps: [
    { q: { en: "Prices may repeat in the input and each listed instance can be used at most once.", he: "מחירים יכולים לחזור ב-input וכל instance ברשימה אפשר לקחת לכל היותר פעם אחת." },
      a: { en: "That's LeetCode 40 (Combination Sum II): recurse with i + 1, and inside the loop skip i &gt; start where prices[i] == prices[i-1], so equal prices at the same tree level are tried only once.", he: "זו LeetCode 40 (Combination Sum II): רקורסיה עם i + 1, ובתוך הלולאה מדלגים כש-i &gt; start ו-prices[i] == prices[i-1], כדי שמחירים שווים באותה רמה בעץ ינוסו רק פעם אחת." } },
    { q: { en: "FinOps only needs the cheapest-to-run mix with the fewest instances, not all of them.", he: "FinOps צריכים רק את השילוב עם הכי מעט instances, לא את כולם." },
      a: { en: "Then don't enumerate: it's the Coin Change DP (O(budget · N)). Backtracking is for when you truly need every solution, or when constraints are too irregular for a DP table.", he: "אז לא סורקים הכל: זה ה-DP של Coin Change (O(budget · N)). Backtracking מתאים כשבאמת צריך כל פתרון, או כשהאילוצים לא סדירים מדי לטבלת DP." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 10. Design — LRU cache with TTL (Redis SET EX / GET)                */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "redis-ttl-lru-cache",
  icon: "⏳",
  difficulty: "hard",
  tags: ["design", "hashmap", "lru", "ttl", "randomized"],
  title: { en: "Redis-like Cache with TTL Expiry and LRU Eviction", he: "Cache בסגנון Redis עם TTL ו-LRU eviction" },
  statement: {
    en: `<p>Build a small in-memory cache that behaves like Redis with <code>maxmemory-policy allkeys-lru</code>:</p>
<ul>
<li><code>set(key, value, ex=None)</code>: like <code>SET key value EX ttl</code>. Stores the value; with <code>ex</code>, the key expires <code>ex</code> seconds from now. A plain <code>set</code> without <code>ex</code> <strong>clears</strong> any previous TTL (Redis semantics). If the cache is at <code>capacity</code> and the key is new, evict the least recently used key first.</li>
<li><code>get(key)</code>: returns the value or <code>None</code>. An expired key must never be returned (<strong>lazy expiry</strong>: check on access and delete).</li>
<li><code>ttl(key)</code>: like Redis <code>TTL</code>: seconds left, <code>-1</code> if the key has no expiry, <code>-2</code> if it doesn't exist.</li>
<li><code>active_expire_cycle()</code>: called periodically (Redis runs it ~10 times/sec). Keys that are never read again must still be reclaimed, but you may not scan all keys: <strong>sample</strong> random keys that have a TTL, delete the expired ones, and repeat while more than 25% of the sample was expired.</li>
</ul>
<p><code>get</code>/<code>set</code>/<code>ttl</code> must be O(1). Take a <code>clock</code> function in the constructor so tests can control time. There is no direct LeetCode equivalent; it combines LRU Cache (146) with Insert Delete GetRandom O(1) (380).</p>`,
    he: `<p>תבנה cache קטן בזיכרון שמתנהג כמו Redis עם <code>maxmemory-policy allkeys-lru</code>:</p>
<ul>
<li><code>set(key, value, ex=None)</code>: כמו <code>SET key value EX ttl</code>. שומר את הערך; עם <code>ex</code>, המפתח פג תוקף בעוד <code>ex</code> שניות. <code>set</code> רגיל בלי <code>ex</code> <strong>מוחק</strong> TTL קודם (כמו ב-Redis). אם ה-cache מלא (<code>capacity</code>) והמפתח חדש, מפנים קודם את ה-LRU.</li>
<li><code>get(key)</code>: מחזיר את הערך או <code>None</code>. אסור אף פעם להחזיר מפתח שפג תוקפו (<strong>lazy expiry</strong>: בודקים בגישה ומוחקים).</li>
<li><code>ttl(key)</code>: כמו <code>TTL</code> ב-Redis: שניות שנשארו, <code>-1</code> אם אין למפתח תפוגה, <code>-2</code> אם הוא לא קיים.</li>
<li><code>active_expire_cycle()</code>: נקרא באופן תקופתי (Redis מריץ את זה בערך 10 פעמים בשנייה). מפתחות שאף אחד לא יקרא שוב עדיין צריכים להתפנות, אבל אסור לסרוק את כל המפתחות: <strong>דוגמים</strong> מפתחות אקראיים שיש להם TTL, מוחקים את אלה שפגו, וחוזרים כל עוד יותר מ-25% מהמדגם היו פגי תוקף.</li>
</ul>
<p><code>get</code>/<code>set</code>/<code>ttl</code> חייבים להיות O(1). תקבל פונקציית <code>clock</code> ב-constructor כדי שבדיקות יוכלו לשלוט בזמן. אין מקבילה ישירה ב-LeetCode; זה שילוב של LRU Cache (146) עם Insert Delete GetRandom O(1) (380).</p>`
  },
  examples: `now = 0; clock = lambda: now
c = TTLCache(capacity=2, clock=clock)
c.set("session:1", "alice", ex=10)
c.ttl("session:1")        -> 10
c.set("cfg", "v1")        # no TTL
c.ttl("cfg")              -> -1
now = 11
c.get("session:1")        -> None     # lazily expired and deleted
c.ttl("session:1")        -> -2
c.set("a", 1); c.get("cfg")           # cfg is now most recently used
c.set("b", 2)             # full -> evicts LRU "a"
c.get("a")                -> None
c.get("cfg"), c.get("b")  -> "v1", 2`,
  hints: [
    { en: "Start from an LRU cache (OrderedDict or hashmap + doubly linked list) and add a second dict expires: key -&gt; absolute deadline, only for keys with a TTL. Store deadlines, not durations.", he: "תתחיל מ-LRU cache (OrderedDict או hashmap + doubly linked list) ותוסיף dict שני expires: key -&gt; deadline אבסולוטי, רק למפתחות עם TTL. שומרים deadlines, לא משכי זמן." },
    { en: "Lazy expiry alone leaks memory: a key written once with a TTL and never read stays forever. You need a background pass, but scanning all keys is O(n) and blocks a single-threaded server.", he: "Lazy expiry לבד דולף זיכרון: מפתח שנכתב פעם אחת עם TTL ואף אחד לא קורא אותו נשאר לנצח. צריך מעבר ברקע, אבל סריקה של כל המפתחות היא O(n) וחוסמת שרת single-threaded." },
    { en: "To sample random keys with a TTL in O(1), keep them in a list plus a key -&gt; index map, and delete with swap-with-last (the GetRandom O(1) trick).", he: "כדי לדגום מפתחות אקראיים עם TTL ב-O(1), מחזיקים אותם ב-list ועוד map של key -&gt; index, ומוחקים עם swap-with-last (הטריק של GetRandom O(1))." }
  ],
  solution: String.raw`import random
import time
from collections import OrderedDict
from typing import Any, Callable, Dict, Hashable, List, Optional


class TTLCache:
    """Redis-like cache: SET key val [EX ttl], GET, TTL; LRU eviction;
    lazy expiry on access + active expiry by random sampling."""

    def __init__(self, capacity: int, clock: Callable[[], float] = time.monotonic):
        self.capacity = capacity
        self.clock = clock
        self.data: "OrderedDict[Hashable, Any]" = OrderedDict()  # first = LRU, last = MRU
        self.expires: Dict[Hashable, float] = {}  # key -> absolute deadline (volatile keys only)
        self._vkeys: List[Hashable] = []          # volatile keys, for O(1) random sampling
        self._vpos: Dict[Hashable, int] = {}      # key -> index in _vkeys

    # ---------- volatile-key set: O(1) add / remove / random pick ----------
    def _set_deadline(self, key: Hashable, deadline: float) -> None:
        if key not in self._vpos:
            self._vpos[key] = len(self._vkeys)
            self._vkeys.append(key)
        self.expires[key] = deadline

    def _clear_deadline(self, key: Hashable) -> None:
        idx = self._vpos.pop(key, None)
        if idx is None:
            return
        last = self._vkeys.pop()          # swap-with-last removal
        if last != key:
            self._vkeys[idx] = last
            self._vpos[last] = idx
        del self.expires[key]

    # ---------- helpers ----------
    def _delete(self, key: Hashable) -> None:
        self.data.pop(key, None)
        self._clear_deadline(key)

    def _expired(self, key: Hashable) -> bool:
        deadline = self.expires.get(key)
        return deadline is not None and self.clock() >= deadline

    # ---------- public API ----------
    def set(self, key: Hashable, value: Any, ex: Optional[float] = None) -> None:
        if ex is not None and ex <= 0:
            raise ValueError("invalid expire time")   # Redis rejects EX <= 0
        if self.capacity <= 0:
            return
        if key in self.data:
            self._delete(key)              # overwrite: also drops the old TTL
        elif len(self.data) >= self.capacity:
            lru_key = next(iter(self.data))
            self._delete(lru_key)          # evict least recently used
        self.data[key] = value             # inserted at the MRU end
        if ex is not None:
            self._set_deadline(key, self.clock() + ex)

    def get(self, key: Hashable) -> Optional[Any]:
        if key not in self.data:
            return None
        if self._expired(key):             # lazy expiry: checked on every access
            self._delete(key)
            return None
        self.data.move_to_end(key)         # touch: now most recently used
        return self.data[key]

    def ttl(self, key: Hashable) -> float:
        if key not in self.data or self._expired(key):
            self._delete(key)
            return -2
        if key not in self.expires:
            return -1
        return self.expires[key] - self.clock()

    def active_expire_cycle(self, sample_size: int = 20, max_rounds: int = 16) -> int:
        """Sample random volatile keys, delete expired ones; repeat while the
        sample was more than 25% expired. Returns how many keys were removed."""
        removed = 0
        for _ in range(max_rounds):        # time budget: never loop forever
            if not self._vkeys:
                break
            n = min(sample_size, len(self._vkeys))
            sample = random.sample(self._vkeys, n)
            expired = [k for k in sample if self._expired(k)]
            for k in expired:
                self._delete(k)
            removed += len(expired)
            if len(expired) * 4 <= n:      # <= 25% expired: good enough, stop
                break
        return removed

    def __len__(self) -> int:
        # Like Redis DBSIZE: may include expired keys not reclaimed yet.
        return len(self.data)


if __name__ == "__main__":
    now = [0.0]
    c = TTLCache(2, clock=lambda: now[0])
    c.set("session:1", "alice", ex=10)
    c.set("cfg", "v1")
    print(c.ttl("session:1"), c.ttl("cfg"))   # 10.0 -1
    now[0] = 11
    print(c.get("session:1"), c.ttl("session:1"))  # None -2
`,
  explain: {
    en: `<p>Three structures, each with one job:</p>
<ul>
<li><code>data</code> (an <code>OrderedDict</code>) holds values in <strong>recency order</strong>: <code>move_to_end</code> on access, evict from the front. In the interview, say you would build it with a hashmap + doubly linked list (see LRU Cache) and use <code>OrderedDict</code> to save time.</li>
<li><code>expires</code> maps only <em>volatile</em> keys to an <strong>absolute deadline</strong>. Redis keeps exactly this: a separate <code>expires</code> dict next to the main keyspace. Absolute deadlines mean nothing has to "tick down".</li>
<li><code>_vkeys</code> + <code>_vpos</code> are the volatile keys as an array with an index map, so we can <strong>pick random keys in O(1)</strong> and remove with swap-with-last.</li>
</ul>
<p><strong>Expiry is two-pronged, exactly like Redis:</strong> (1) <em>Lazy/passive</em>: every <code>get</code>/<code>ttl</code> checks the deadline and deletes on the spot, so a client can never observe an expired value. (2) <em>Active</em>: keys nobody reads would leak, so a periodic cycle samples 20 random keys with a TTL, deletes the expired ones, and repeats if more than 25% were expired (statistically, many more expired keys remain). A round cap / time budget keeps the single-threaded server responsive. This keeps memory used by already-expired keys at roughly 25% of volatile keys or less, without ever scanning the keyspace.</p>
<p><strong>Approximated LRU in real Redis:</strong> Redis does <em>not</em> keep a linked list (two pointers per key is too much memory at hundreds of millions of keys). Each object stores a 24-bit LRU clock; on eviction Redis samples <code>maxmemory-samples</code> keys (default 5) and evicts the oldest, using a small eviction pool to keep good candidates across rounds. With 10 samples it is very close to true LRU. <code>volatile-lru</code>/<code>volatile-ttl</code> restrict eviction to keys with a TTL.</p>
<p><strong>Pattern recognition:</strong> when you see "O(1) operations plus some ordering or randomness", think <strong>several hashmaps pointing into the same keys, each structure owning one property</strong> (order, deadline, random index), and keep them consistent in one <code>_delete</code> helper.</p>`,
    he: `<p>שלושה מבנים, לכל אחד תפקיד אחד:</p>
<ul>
<li><code>data</code> (<code>OrderedDict</code>) מחזיק ערכים <strong>לפי סדר שימוש</strong>: <code>move_to_end</code> בגישה, מפנים מההתחלה. בראיון תגיד שהיית בונה את זה עם hashmap + doubly linked list (ראה LRU Cache) ושאתה משתמש ב-<code>OrderedDict</code> כדי לחסוך זמן.</li>
<li><code>expires</code> ממפה רק מפתחות <em>volatile</em> ל-<strong>deadline אבסולוטי</strong>. זה בדיוק מה ש-Redis מחזיק: dict נפרד בשם <code>expires</code> ליד ה-keyspace הראשי. Deadlines אבסולוטיים אומרים שאף אחד לא צריך "לספור אחורה".</li>
<li><code>_vkeys</code> + <code>_vpos</code> הם המפתחות ה-volatile כמערך עם map של אינדקסים, כדי <strong>לבחור מפתחות אקראיים ב-O(1)</strong> ולמחוק עם swap-with-last.</li>
</ul>
<p><strong>התפוגה עובדת בשני ערוצים, בדיוק כמו ב-Redis:</strong> (1) <em>Lazy/passive</em>: כל <code>get</code>/<code>ttl</code> בודק את ה-deadline ומוחק במקום, אז client לעולם לא יראה ערך שפג תוקפו. (2) <em>Active</em>: מפתחות שאף אחד לא קורא היו דולפים, אז מחזור תקופתי דוגם 20 מפתחות אקראיים עם TTL, מוחק את הפגים, וחוזר אם יותר מ-25% היו פגים (סטטיסטית, נשארו עוד הרבה פגים). תקרה על מספר הסבבים / תקציב זמן שומרת על השרת ה-single-threaded רספונסיבי. ככה הזיכרון שתפוס על ידי מפתחות שכבר פגו נשאר בערך 25% מהמפתחות ה-volatile או פחות, בלי לסרוק אף פעם את כל ה-keyspace.</p>
<p><strong>LRU מקורב ב-Redis האמיתי:</strong> Redis <em>לא</em> מחזיק linked list (שני pointers לכל מפתח זה יותר מדי זיכרון במאות מיליוני מפתחות). כל אובייקט שומר שעון LRU של 24 bits; ב-eviction, Redis דוגם <code>maxmemory-samples</code> מפתחות (ברירת מחדל 5) ומפנה את הישן ביותר, עם eviction pool קטן ששומר מועמדים טובים בין סבבים. עם 10 דגימות זה קרוב מאוד ל-LRU אמיתי. <code>volatile-lru</code>/<code>volatile-ttl</code> מגבילים את הפינוי למפתחות עם TTL.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "פעולות O(1) ועוד סדר או אקראיות", חושבים על <strong>כמה hashmaps שמצביעים על אותם מפתחות, כשכל מבנה אחראי על תכונה אחת</strong> (סדר, deadline, אינדקס אקראי), ושומרים אותם מסונכרנים ב-helper אחד של <code>_delete</code>.</p>`
  },
  complexity: "Time O(1) for get/set/ttl, O(sample_size · rounds) per active cycle; Space O(capacity)",
  whyInfra: {
    en: "This is how Redis and Memcached actually expire keys. Redis: passive expiry on access + <code>activeExpireCycle</code> sampling 20 volatile keys per round (10 Hz via <code>hz</code>), repeating while &gt;25% are expired, under a CPU time budget. Memcached also expires lazily and has an LRU crawler for cleanup. The same deadline-plus-lazy-check pattern appears in DNS caches (TTL), CDN edges (<code>Cache-Control: max-age</code>), session stores, and Kubernetes leases. Debugging \"memory keeps growing even though everything has a TTL\" is a classic on-call ticket.",
    he: "ככה Redis ו-Memcached באמת מפנים מפתחות. Redis: passive expiry בגישה + <code>activeExpireCycle</code> שדוגם 20 מפתחות volatile בכל סבב (10 פעמים בשנייה דרך <code>hz</code>), וחוזר כל עוד יותר מ-25% פגי תוקף, תחת תקציב זמן CPU. גם Memcached מפנה בצורה lazy ויש לו LRU crawler לניקוי. אותו pattern של deadline ועוד בדיקה lazy מופיע ב-DNS caches (TTL), ב-CDN edges (<code>Cache-Control: max-age</code>), ב-session stores וב-leases של Kubernetes. לדבג \"הזיכרון ממשיך לגדול למרות שלכל דבר יש TTL\" זה טיקט on-call קלאסי."
  },
  followUps: [
    { q: { en: "Why not a min-heap ordered by deadline instead of random sampling?", he: "למה לא min-heap לפי deadline במקום דגימה אקראית?" },
      a: { en: "A heap gives exact expiry order but costs O(log n) per set and needs lazy deletion (or an index map) when a key is overwritten or its TTL changes, plus extra memory per key. Redis prefers O(1) writes and probabilistic cleanup. A hierarchical timing wheel (Kafka, Netty, Linux timers) is another O(1) option when deadlines are bounded.", he: "Heap נותן סדר תפוגה מדויק, אבל עולה O(log n) לכל set וצריך lazy deletion (או map של אינדקסים) כשמפתח נדרס או שה-TTL שלו משתנה, ועוד זיכרון לכל מפתח. Redis מעדיף כתיבות ב-O(1) וניקוי הסתברותי. Hierarchical timing wheel (Kafka, Netty, timers בלינוקס) היא עוד אפשרות O(1) כשה-deadlines חסומים." } },
    { q: { en: "How do expirations work with replicas?", he: "איך התפוגות עובדות עם replicas?" },
      a: { en: "In Redis only the primary expires keys; when it deletes one it propagates a DEL to replicas and the AOF. Replicas don't delete on their own (their clocks may differ), but since Redis 3.2 they return \"not found\" for a logically expired key on read, so clients never see stale data.", he: "ב-Redis רק ה-primary מפנה מפתחות; כשהוא מוחק אחד הוא שולח DEL ל-replicas ול-AOF. Replicas לא מוחקים בעצמם (השעונים שלהם יכולים להיות שונים), אבל מאז Redis 3.2 הם מחזירים \"not found\" על מפתח שפג לוגית בקריאה, אז clients אף פעם לא רואים מידע ישן." } },
    { q: { en: "Make it approximate-LRU like Redis to save memory.", he: "תהפוך את זה ל-LRU מקורב כמו Redis כדי לחסוך זיכרון." },
      a: { en: "Drop the ordering structure; store last_access per key and keep all keys in the same array + index map. On eviction sample K random keys and evict the one with the oldest last_access (optionally keep a small pool of the best candidates between evictions). O(K) per eviction, zero pointers per key.", he: "מורידים את מבנה הסדר; שומרים last_access לכל מפתח ומחזיקים את כל המפתחות באותו מערך + map של אינדקסים. ב-eviction דוגמים K מפתחות אקראיים ומפנים את זה עם ה-last_access הכי ישן (אפשר לשמור pool קטן של המועמדים הכי טובים בין פינויים). O(K) לפינוי, אפס pointers למפתח." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 11. Design — Insert Delete GetRandom O(1) (LC 380)                  */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "random-replica-pool-o1",
  icon: "🎲",
  difficulty: "medium",
  tags: ["design", "hashmap", "arrays", "randomized"],
  leetcode: "380",
  title: { en: "Healthy Replica Pool with O(1) Random Pick", he: "Pool של replicas תקינים עם בחירה אקראית ב-O(1)" },
  statement: {
    en: `<p>A client-side load balancer keeps the set of healthy replicas. Health checks add and remove replicas constantly, and every request picks one <strong>uniformly at random</strong>. Implement:</p>
<ul>
<li><code>add(replica)</code>: insert if absent; return <code>True</code> if it was added, <code>False</code> if already present.</li>
<li><code>remove(replica)</code>: remove if present; return <code>True</code> if removed, <code>False</code> otherwise.</li>
<li><code>pick()</code>: return a random member, each with equal probability (at least one member exists when called).</li>
</ul>
<p>All three in <strong>average O(1)</strong>. This is LeetCode 380 (Insert Delete GetRandom O(1)).</p>`,
    he: `<p>Load balancer בצד ה-client מחזיק את קבוצת ה-replicas התקינים. Health checks מוסיפים ומורידים replicas כל הזמן, וכל בקשה בוחרת אחד <strong>באופן אקראי אחיד</strong>. תממש:</p>
<ul>
<li><code>add(replica)</code>: מכניס אם לא קיים; מחזיר <code>True</code> אם נוסף, <code>False</code> אם כבר קיים.</li>
<li><code>remove(replica)</code>: מוריד אם קיים; מחזיר <code>True</code> אם הוסר, <code>False</code> אחרת.</li>
<li><code>pick()</code>: מחזיר איבר אקראי, לכל אחד אותה הסתברות (כשקוראים לו יש לפחות איבר אחד).</li>
</ul>
<p>שלושתם ב-<strong>O(1) בממוצע</strong>. זו LeetCode 380 (Insert Delete GetRandom O(1)).</p>`
  },
  examples: `pool = ReplicaPool()
pool.add("10.0.1.5")      -> True
pool.add("10.0.1.5")      -> False     # already there
pool.add("10.0.2.7")      -> True
pool.remove("10.0.9.9")   -> False
pool.pick()               -> "10.0.1.5" or "10.0.2.7" (50/50)
pool.remove("10.0.1.5")   -> True
pool.pick()               -> "10.0.2.7"`,
  hints: [
    { en: "A set gives O(1) add/remove but random.choice needs indexing, so it would copy the set: O(n). A list gives O(1) random pick but O(n) remove. Can you combine them?", he: "Set נותן add/remove ב-O(1), אבל random.choice צריך אינדקסים, אז הוא יעתיק את ה-set: O(n). List נותן בחירה אקראית ב-O(1) אבל remove ב-O(n). אפשר לשלב?" },
    { en: "Keep a list of members and a dict member -&gt; index in the list.", he: "תחזיק list של האיברים ו-dict של איבר -&gt; האינדקס שלו ב-list." },
    { en: "Removing from the middle of a list is O(n), but removing the last element is O(1). Move the last element into the hole first, and update its index in the dict.", he: "להוציא מאמצע list זה O(n), אבל להוציא את האיבר האחרון זה O(1). קודם מעבירים את האיבר האחרון לחור, ומעדכנים את האינדקס שלו ב-dict." }
  ],
  solution: String.raw`import random
from typing import Dict, Hashable, List


class ReplicaPool:
    """Set with O(1) add, remove and uniform random pick (LC 380)."""

    def __init__(self) -> None:
        self.items: List[Hashable] = []       # dense array -> O(1) random index
        self.index: Dict[Hashable, int] = {}  # replica -> position in items

    def add(self, replica: Hashable) -> bool:
        if replica in self.index:
            return False
        self.index[replica] = len(self.items)
        self.items.append(replica)
        return True

    def remove(self, replica: Hashable) -> bool:
        idx = self.index.pop(replica, None)
        if idx is None:
            return False
        last = self.items.pop()               # O(1): remove from the end
        if last != replica:                   # fill the hole with the old last item
            self.items[idx] = last
            self.index[last] = idx
        return True

    def pick(self) -> Hashable:
        return self.items[random.randrange(len(self.items))]

    def __len__(self) -> int:
        return len(self.items)


if __name__ == "__main__":
    pool = ReplicaPool()
    print(pool.add("10.0.1.5"), pool.add("10.0.1.5"), pool.add("10.0.2.7"))  # True False True
    print(pool.remove("10.0.9.9"))  # False
    pool.remove("10.0.1.5")
    print(pool.pick())              # 10.0.2.7
`,
  explain: {
    en: `<p>Each structure covers the other's weakness. The <strong>array</strong> is dense (no holes), so a uniformly random index is a uniformly random member: O(1). The <strong>dict</strong> tells us where a member lives, so we find it in O(1).</p>
<p>The key move is <strong>swap-with-last removal</strong>: order in the array doesn't matter, so instead of shifting everything after the hole, we pop the last element (O(1)) and drop it into the hole, updating its index. The <code>last != replica</code> check handles removing the element that was already last. Pop from the dict <em>before</em> writing the moved element's index, or removing the last element would re-insert it.</p>
<p><strong>Pattern recognition:</strong> when you see "O(1) insert/delete <em>and</em> random access / random pick", think <strong>array + hashmap of value -&gt; index, delete by swapping with the last element</strong>.</p>`,
    he: `<p>כל מבנה מכסה את החולשה של השני. ה-<strong>מערך</strong> צפוף (בלי חורים), אז אינדקס אקראי אחיד הוא איבר אקראי אחיד: O(1). ה-<strong>dict</strong> אומר לנו איפה כל איבר יושב, אז מוצאים אותו ב-O(1).</p>
<p>המהלך המרכזי הוא <strong>מחיקה עם swap-with-last</strong>: הסדר במערך לא משנה, אז במקום להזיז את כל מה שאחרי החור, מוציאים את האיבר האחרון (O(1)) ומכניסים אותו לחור, ומעדכנים את האינדקס שלו. הבדיקה <code>last != replica</code> מטפלת במחיקה של האיבר שכבר היה אחרון. מוציאים מה-dict <em>לפני</em> שכותבים את האינדקס של האיבר שזז, אחרת מחיקת האיבר האחרון הייתה מכניסה אותו מחדש.</p>
<p><strong>זיהוי pattern:</strong> כשרואים "insert/delete ב-O(1) <em>וגם</em> גישה אקראית / בחירה אקראית", חושבים על <strong>מערך + hashmap של ערך -&gt; אינדקס, ומחיקה על ידי החלפה עם האיבר האחרון</strong>.</p>`
  },
  complexity: "Time O(1) average for add/remove/pick, Space O(n)",
  whyInfra: {
    en: "Random replica selection is a real load-balancing strategy (Envoy's RANDOM policy, and the base of \"power of two choices\": pick two random healthy hosts, send to the less loaded one). Redis implements <code>SRANDMEMBER</code>/<code>SPOP</code> on hash-table sets by sampling buckets, and its active expiry needs random volatile keys for the same reason. The swap-with-last trick also shows up in object pools, free-lists and ECS-style game/sim engines.",
    he: "בחירת replica אקראית היא אסטרטגיית load balancing אמיתית (מדיניות RANDOM ב-Envoy, והבסיס של \"power of two choices\": בוחרים שני hosts תקינים באקראי ושולחים לפחות עמוס). Redis מממש <code>SRANDMEMBER</code>/<code>SPOP</code> על sets מבוססי hash table על ידי דגימת buckets, וה-active expiry שלו צריך מפתחות volatile אקראיים מאותה סיבה. הטריק של swap-with-last מופיע גם ב-object pools, ב-free-lists ובמנועי משחק/סימולציה בסגנון ECS."
  },
  followUps: [
    { q: { en: "Allow duplicates (a replica registered twice gets double traffic).", he: "תאפשר כפילויות (replica שנרשם פעמיים מקבל פי שניים traffic)." },
      a: { en: "LeetCode 381: map each value to a <em>set</em> of indices. On remove, take any index from its set, move the last element there, and fix the moved element's index set (remove the old last position, add idx). Uniform over entries means weighted by count.", he: "LeetCode 381: ממפים כל ערך ל-<em>set</em> של אינדקסים. ב-remove לוקחים אינדקס כלשהו מה-set שלו, מעבירים לשם את האיבר האחרון, ומתקנים את ה-set של האיבר שזז (מוציאים את המיקום האחרון הישן, מוסיפים את idx). אחיד על הרשומות אומר משוקלל לפי הכמות." } },
    { q: { en: "Pick replicas by weight (e.g. bigger instances get more traffic).", he: "בחירת replicas לפי משקל (למשל instances גדולים מקבלים יותר traffic)." },
      a: { en: "Static weights: prefix sums + binary search (O(log n) pick), or Walker's alias method (O(1) pick, O(n) rebuild). Frequently changing weights: a Fenwick tree over weights gives O(log n) update and pick. Envoy and gRPC use weighted round robin / EDF scheduling instead of pure random.", he: "משקלים סטטיים: prefix sums + binary search (בחירה ב-O(log n)), או alias method של Walker (בחירה ב-O(1), בנייה מחדש ב-O(n)). משקלים שמשתנים הרבה: Fenwick tree על המשקלים נותן עדכון ובחירה ב-O(log n). Envoy ו-gRPC משתמשים ב-weighted round robin / EDF scheduling במקום random טהור." } }
  ]
});
