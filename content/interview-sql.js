// Interview prep — SQL problems with an infrastructure twist (INFRA.problems)
// Each problem: schema + sample data, examples, progressive hints, PostgreSQL solution (MySQL notes), walkthrough, complexity, follow-ups.
// Every solution was run against its sample data; the expected output in `examples` is the real result.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.problems = window.INFRA.problems || [];

/* ------------------------------------------------------------------ */
/* 1. Second highest salary                                            */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-second-highest-salary",
  icon: "🥈",
  difficulty: "easy",
  tags: ["sql", "subquery", "null"],
  leetcode: "176",
  title: { en: "SQL: Second Highest Salary", he: "SQL: המשכורת השנייה בגובהה" },
  statement: {
    en: `<p>Return the <strong>second highest distinct</strong> salary from <code>employee</code> as a single column <code>second_highest_salary</code>. If there is no second distinct value (one row, or all salaries equal), return <strong>one row with NULL</strong>, not an empty result.</p>
<pre>employee(id int PRIMARY KEY, salary int)

 id | salary
----+-------
  1 |    100
  2 |    200
  3 |    300</pre>`,
    he: `<p>תחזיר את המשכורת <strong>השנייה בגובהה מבין הערכים השונים</strong> בטבלה <code>employee</code>, בעמודה אחת בשם <code>second_highest_salary</code>. אם אין ערך שני שונה (שורה אחת, או שכל המשכורות זהות), תחזיר <strong>שורה אחת עם NULL</strong> ולא תוצאה ריקה.</p>
<pre>employee(id int PRIMARY KEY, salary int)

 id | salary
----+-------
  1 |    100
  2 |    200
  3 |    300</pre>`
  },
  examples: `employee = (1,100), (2,200), (3,300)
-> second_highest_salary = 200

employee = (1,100)
-> second_highest_salary = NULL

employee = (1,100), (2,100)
-> second_highest_salary = NULL      # DISTINCT matters`,
  hints: [
    { en: "Sort salaries descending and skip the first one. What breaks if two people share the top salary?", he: "תמיין את המשכורות בסדר יורד ותדלג על הראשונה. מה נשבר אם לשני אנשים יש את המשכורת הכי גבוהה?" },
    { en: "DISTINCT + ORDER BY ... LIMIT 1 OFFSET 1 gives the value, but returns zero rows when it doesn't exist.", he: "DISTINCT עם ORDER BY ... LIMIT 1 OFFSET 1 נותן את הערך, אבל מחזיר אפס שורות כשהוא לא קיים." },
    { en: "Wrap it in a scalar subquery: SELECT (subquery). A scalar subquery with no rows evaluates to NULL.", he: "תעטוף את זה ב-scalar subquery: SELECT (subquery). scalar subquery בלי שורות מחזיר NULL." }
  ],
  solution: String.raw`-- PostgreSQL (identical in MySQL 8 and SQLite)
-- The outer SELECT always returns exactly one row:
-- a scalar subquery that finds nothing evaluates to NULL.
SELECT (
    SELECT DISTINCT salary          -- DISTINCT: (100, 100) has no "second" salary
    FROM employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1                -- skip the highest, take the next one
) AS second_highest_salary;

-- Alternative without LIMIT/OFFSET (portable to any SQL dialect):
SELECT MAX(salary) AS second_highest_salary
FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);

-- Generalized: N-th highest with a window function
SELECT (
    SELECT salary
    FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
          FROM employee) t
    WHERE rnk = 2
    LIMIT 1
) AS second_highest_salary;`,
  explain: {
    en: `<p>Two traps hide in this "easy" question. First, <strong>duplicates</strong>: with salaries (300, 300, 200) the second row is 300, but the second <em>distinct</em> salary is 200, so <code>DISTINCT</code> (or <code>DENSE_RANK</code>) is required. Second, <strong>empty vs NULL</strong>: <code>LIMIT 1 OFFSET 1</code> on a one-row table returns zero rows, and a dashboard or app usually expects exactly one row.</p>
<p>The fix is the scalar subquery. <code>SELECT (subquery)</code> always produces one row, and the subquery's "no rows" becomes NULL. The <code>MAX(...) WHERE salary &lt; MAX</code> version gets the same behaviour for free, because an aggregate over zero rows returns NULL.</p>`,
    he: `<p>בשאלה ה"קלה" הזאת מסתתרות שתי מלכודות. הראשונה היא <strong>כפילויות</strong>: עם משכורות (300, 300, 200) השורה השנייה היא 300, אבל המשכורת השנייה <em>השונה</em> היא 200, אז חייבים <code>DISTINCT</code> (או <code>DENSE_RANK</code>). השנייה היא <strong>ריק מול NULL</strong>: <code>LIMIT 1 OFFSET 1</code> על טבלה עם שורה אחת מחזיר אפס שורות, ודשבורד או אפליקציה בדרך כלל מצפים לשורה אחת בדיוק.</p>
<p>הפתרון הוא scalar subquery. <code>SELECT (subquery)</code> תמיד מחזיר שורה אחת, וה-"אין שורות" של ה-subquery הופך ל-NULL. הגרסה עם <code>MAX(...) WHERE salary &lt; MAX</code> מקבלת את אותה התנהגות בחינם, כי aggregate על אפס שורות מחזיר NULL.</p>`
  },
  complexity: "Sort of distinct values: O(n log n); O(n) with an index on salary (index scan, stop after 2 values)",
  whyInfra: {
    en: "\"Second highest\" is how you find the runner-up in cost reports (the second most expensive AWS account, the node with the second highest memory use) and how you check that a top offender isn't a one-off. The empty-vs-NULL trap is real: Grafana panels and alert queries that return zero rows show \"No data\" and can silently skip alerting.",
    he: "\"השני בגובהו\" זה איך מוצאים את המקום השני בדוחות עלויות (חשבון ה-AWS השני הכי יקר, ה-node עם צריכת הזיכרון השנייה בגובהה) ואיך בודקים שהחריג הראשון הוא לא מקרה חד-פעמי. מלכודת הריק מול NULL אמיתית לגמרי: פאנל ב-Grafana או query של alert שמחזירים אפס שורות מציגים \"No data\" ויכולים לדלג על התראה בשקט."
  },
  followUps: [
    { q: { en: "Return the N-th highest salary as a reusable function.", he: "תחזיר את המשכורת ה-N בגובהה כפונקציה לשימוש חוזר." },
      a: { en: "In PostgreSQL write a SQL function taking n and use OFFSET n - 1 on the DISTINCT list (or WHERE rnk = n with DENSE_RANK). Validate n &gt;= 1. LeetCode 177 asks exactly this.", he: "ב-PostgreSQL כותבים SQL function שמקבלת n ומשתמשים ב-OFFSET n - 1 על הרשימה עם DISTINCT (או WHERE rnk = n עם DENSE_RANK). צריך לוודא ש-n &gt;= 1. זה בדיוק LeetCode 177." } },
    { q: { en: "How does this behave on a 500M-row table?", he: "איך זה מתנהג על טבלה של 500 מיליון שורות?" },
      a: { en: "With a B-tree index on salary, the planner walks the index backwards and stops after two distinct values: milliseconds. Without it, it's a full scan plus sort. Check with EXPLAIN ANALYZE.", he: "עם B-tree index על salary, ה-planner הולך על ה-index אחורה ועוצר אחרי שני ערכים שונים: מילישניות. בלי index זה full scan ועוד מיון. בודקים עם EXPLAIN ANALYZE." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 2. Top N per group                                                  */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-top-n-per-group",
  icon: "🏆",
  difficulty: "medium",
  tags: ["sql", "window-function", "dense-rank", "top-n"],
  leetcode: "185",
  title: { en: "SQL: Top 3 Salaries per Department", he: "SQL: שלוש המשכורות הגבוהות בכל מחלקה" },
  statement: {
    en: `<p>Return every employee who earns one of the <strong>top 3 distinct salaries</strong> in their department. Ties share a place: if two people earn the second highest salary, both appear, and the next salary is still "third". Output <code>department, employee, salary</code>, ordered by department, then salary descending.</p>
<pre>department(id int, name text)
employee(id int, name text, salary int, department_id int)

department:  (1,'IT'), (2,'Sales')
employee:
 id | name  | salary | department_id
----+-------+--------+--------------
  1 | Joe   |  85000 | 1
  2 | Henry |  80000 | 2
  3 | Sam   |  60000 | 2
  4 | Max   |  90000 | 1
  5 | Janet |  69000 | 1
  6 | Randy |  85000 | 1
  7 | Will  |  70000 | 1</pre>`,
    he: `<p>תחזיר כל עובד שמרוויח אחת מ-<strong>3 המשכורות השונות הגבוהות</strong> במחלקה שלו. תיקו חולק מקום: אם שניים מרוויחים את המשכורת השנייה בגובהה, שניהם מופיעים, והמשכורת הבאה עדיין נחשבת "שלישית". ה-output הוא <code>department, employee, salary</code>, ממוין לפי מחלקה ואז לפי משכורת בסדר יורד.</p>
<pre>department(id int, name text)
employee(id int, name text, salary int, department_id int)

department:  (1,'IT'), (2,'Sales')
employee:
 id | name  | salary | department_id
----+-------+--------+--------------
  1 | Joe   |  85000 | 1
  2 | Henry |  80000 | 2
  3 | Sam   |  60000 | 2
  4 | Max   |  90000 | 1
  5 | Janet |  69000 | 1
  6 | Randy |  85000 | 1
  7 | Will  |  70000 | 1</pre>`
  },
  examples: `department | employee | salary
-----------+----------+-------
IT         | Max      | 90000     # rank 1
IT         | Joe      | 85000     # rank 2 (tie)
IT         | Randy    | 85000     # rank 2 (tie)
IT         | Will     | 70000     # rank 3 -> Janet (69000) is rank 4, excluded
Sales      | Henry    | 80000
Sales      | Sam      | 60000     # a department with fewer than 3 is fine`,
  hints: [
    { en: "GROUP BY can't return \"the top rows of each group\", it collapses them. You need a number per row that restarts per department.", he: "GROUP BY לא יכול להחזיר \"את השורות העליונות בכל קבוצה\", הוא מכווץ אותן. צריך מספר לכל שורה שמתאפס בכל מחלקה." },
    { en: "Window function with PARTITION BY department_id ORDER BY salary DESC. Which one: ROW_NUMBER, RANK or DENSE_RANK?", he: "Window function עם PARTITION BY department_id ORDER BY salary DESC. איזו: ROW_NUMBER, RANK או DENSE_RANK?" },
    { en: "DENSE_RANK gives 1, 2, 2, 3 (no gaps), which matches \"top 3 distinct salaries\". You can't filter a window function in WHERE, so compute it in a CTE and filter outside.", he: "DENSE_RANK נותן 1, 2, 2, 3 (בלי חורים), וזה מתאים ל-\"3 המשכורות השונות הגבוהות\". אי אפשר לסנן window function ב-WHERE, אז מחשבים אותה ב-CTE ומסננים בחוץ." }
  ],
  solution: String.raw`-- PostgreSQL (same in MySQL 8+, SQLite 3.25+)
WITH ranked AS (
    SELECT d.name   AS department,
           e.name   AS employee,
           e.salary,
           -- restarts at 1 for every department; ties get the same rank, no gaps
           DENSE_RANK() OVER (PARTITION BY e.department_id
                              ORDER BY e.salary DESC) AS rnk
    FROM employee e
    JOIN department d ON d.id = e.department_id
)
SELECT department, employee, salary
FROM ranked
WHERE rnk <= 3                      -- window results can only be filtered one level up
ORDER BY department, salary DESC, employee;

-- Pre-window-function version (MySQL 5.7): count distinct higher salaries
-- SELECT d.name, e.name, e.salary
-- FROM employee e JOIN department d ON d.id = e.department_id
-- WHERE (SELECT COUNT(DISTINCT e2.salary) FROM employee e2
--        WHERE e2.department_id = e.department_id AND e2.salary > e.salary) < 3;`,
  explain: {
    en: `<p>This is the canonical <strong>top-N per group</strong> pattern. <code>PARTITION BY</code> splits rows into departments without collapsing them, <code>ORDER BY salary DESC</code> orders inside each partition, and the ranking function numbers the rows.</p>
<p>Choosing the function is the actual interview question. For IT (90, 85, 85, 70, 69): <code>ROW_NUMBER</code> gives 1,2,3,4,5 and arbitrarily drops Randy or Joe; <code>RANK</code> gives 1,2,2,4,5 and drops Will even though 70k is the third distinct salary; <code>DENSE_RANK</code> gives 1,2,2,3,4, exactly "top 3 distinct salaries".</p>
<p>Window functions are evaluated after <code>WHERE</code>, so the filter <code>rnk &lt;= 3</code> must live in an outer query. PostgreSQL has no <code>QUALIFY</code>; Snowflake, BigQuery and DuckDB do (<code>QUALIFY rnk &lt;= 3</code>).</p>`,
    he: `<p>זה ה-pattern הקלאסי של <strong>top-N לכל קבוצה</strong>. <code>PARTITION BY</code> מחלק את השורות למחלקות בלי לכווץ אותן, <code>ORDER BY salary DESC</code> ממיין בתוך כל partition, ופונקציית הדירוג ממספרת את השורות.</p>
<p>הבחירה בפונקציה היא השאלה האמיתית בראיון. ב-IT (90, 85, 85, 70, 69): <code>ROW_NUMBER</code> נותן 1,2,3,4,5 ומפיל את Randy או את Joe באופן שרירותי; <code>RANK</code> נותן 1,2,2,4,5 ומפיל את Will למרות ש-70k היא המשכורת השונה השלישית; <code>DENSE_RANK</code> נותן 1,2,2,3,4, בדיוק "3 המשכורות השונות הגבוהות".</p>
<p>Window functions מחושבות אחרי <code>WHERE</code>, אז הסינון <code>rnk &lt;= 3</code> חייב לשבת ב-query חיצוני. ל-PostgreSQL אין <code>QUALIFY</code>; ל-Snowflake, BigQuery ו-DuckDB יש (<code>QUALIFY rnk &lt;= 3</code>).</p>`
  },
  complexity: "One sort per partition: O(n log n) overall; an index on (department_id, salary DESC) lets the planner skip the sort",
  whyInfra: {
    en: "Top-N per group is everywhere in infra reporting: top 3 most expensive resources per AWS account, top 5 slowest endpoints per service, top 10 noisiest Pods per namespace, top error messages per release. Any \"per X, show the worst Y\" panel is this query.",
    he: "Top-N לכל קבוצה נמצא בכל מקום בדוחות תשתית: 3 המשאבים הכי יקרים בכל חשבון AWS, 5 ה-endpoints הכי איטיים בכל service, 10 ה-Pods הכי רועשים בכל namespace, הודעות השגיאה הנפוצות בכל release. כל פאנל של \"לכל X, תראה את ה-Y הכי גרועים\" הוא ה-query הזה."
  },
  followUps: [
    { q: { en: "Exactly 3 rows per department, ties broken by hire date?", he: "בדיוק 3 שורות לכל מחלקה, ותיקו נשבר לפי תאריך גיוס?" },
      a: { en: "Switch to ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, hired_at ASC, id). Always add a unique column last so the result is deterministic between runs.", he: "עוברים ל-ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, hired_at ASC, id). תמיד מוסיפים עמודה ייחודית בסוף כדי שהתוצאה תהיה דטרמיניסטית בין הרצות." } },
    { q: { en: "The table has 1M departments and you need the top 3 of each fast. Another approach?", he: "יש מיליון מחלקות וצריך את ה-3 העליונים של כל אחת מהר. גישה אחרת?" },
      a: { en: "In PostgreSQL use a LATERAL join: for each department, SELECT ... ORDER BY salary DESC LIMIT 3 using an index on (department_id, salary DESC). Each lookup reads 3 index entries instead of sorting the whole table.", he: "ב-PostgreSQL משתמשים ב-LATERAL join: לכל מחלקה, SELECT ... ORDER BY salary DESC LIMIT 3 עם index על (department_id, salary DESC). כל חיפוש קורא 3 רשומות מה-index במקום למיין את כל הטבלה." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 3. Duplicate emails / dedup keeping latest                          */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-duplicate-emails",
  icon: "👯",
  difficulty: "easy",
  tags: ["sql", "group-by", "having", "dedup", "window-function"],
  leetcode: "196",
  title: { en: "SQL: Find and Remove Duplicate Emails", he: "SQL: למצוא ולמחוק אימיילים כפולים" },
  statement: {
    en: `<p>A bad sync job inserted duplicate users. Emails are case-insensitive (<code>A@x.io</code> = <code>a@x.io</code>).</p>
<ol><li>List every email that appears more than once, with its count.</li>
<li>Delete the duplicates, <strong>keeping only the most recently updated row</strong> per email. If two rows have the same <code>updated_at</code>, keep the higher <code>id</code>.</li></ol>
<pre>users(id int PRIMARY KEY, email text, updated_at timestamp)

 id | email  | updated_at
----+--------+-----------------
  1 | a@x.io | 2026-01-01 10:00
  2 | b@x.io | 2026-01-02 09:00
  3 | a@x.io | 2026-02-10 08:00
  4 | c@x.io | 2026-01-05 12:00
  5 | b@x.io | 2026-01-02 09:00
  6 | A@x.io | 2026-03-01 00:00</pre>`,
    he: `<p>Sync job שבור הכניס משתמשים כפולים. אימיילים לא תלויים ב-case (<code>A@x.io</code> = <code>a@x.io</code>).</p>
<ol><li>תציג כל אימייל שמופיע יותר מפעם אחת, ביחד עם מספר ההופעות.</li>
<li>תמחק את הכפולים, ו<strong>תשאיר רק את השורה שעודכנה אחרונה</strong> לכל אימייל. אם לשתי שורות יש אותו <code>updated_at</code>, תשאיר את ה-<code>id</code> הגבוה.</li></ol>
<pre>users(id int PRIMARY KEY, email text, updated_at timestamp)

 id | email  | updated_at
----+--------+-----------------
  1 | a@x.io | 2026-01-01 10:00
  2 | b@x.io | 2026-01-02 09:00
  3 | a@x.io | 2026-02-10 08:00
  4 | c@x.io | 2026-01-05 12:00
  5 | b@x.io | 2026-01-02 09:00
  6 | A@x.io | 2026-03-01 00:00</pre>`
  },
  examples: `Part 1 (find):
email  | copies
-------+-------
a@x.io | 3
b@x.io | 2

Part 2 (delete, then SELECT * FROM users ORDER BY id):
id | email  | updated_at
---+--------+-----------------
 4 | c@x.io | 2026-01-05 12:00
 5 | b@x.io | 2026-01-02 09:00     # tie with id 2 -> higher id wins
 6 | A@x.io | 2026-03-01 00:00     # latest of the three a@x.io rows`,
  hints: [
    { en: "Finding: GROUP BY the normalized email and keep groups with HAVING COUNT(*) &gt; 1. WHERE can't filter on an aggregate.", he: "למצוא: GROUP BY על האימייל המנורמל ולהשאיר קבוצות עם HAVING COUNT(*) &gt; 1. WHERE לא יכול לסנן על aggregate." },
    { en: "Deleting: number the rows inside each email group so that the row you keep gets 1.", he: "למחוק: תמספר את השורות בתוך כל קבוצת אימייל כך שהשורה שנשארת תקבל 1." },
    { en: "ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY updated_at DESC, id DESC); delete every id where rn &gt; 1.", he: "ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY updated_at DESC, id DESC); מוחקים כל id שבו rn &gt; 1." }
  ],
  solution: String.raw`-- PostgreSQL
-- Part 1: which emails are duplicated?
SELECT lower(email) AS email, COUNT(*) AS copies
FROM users
GROUP BY lower(email)
HAVING COUNT(*) > 1                 -- filter on the aggregate, after grouping
ORDER BY email;

-- Part 2: keep the newest row per email, delete the rest.
-- Run inside a transaction and check the row count before COMMIT.
BEGIN;
DELETE FROM users
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY lower(email)
                   ORDER BY updated_at DESC, id DESC   -- id breaks ties deterministically
               ) AS rn
        FROM users
    ) t
    WHERE rn > 1                    -- rn = 1 is the survivor
);
-- expect: DELETE 3
COMMIT;

-- Then stop it from happening again:
CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));

-- MySQL 8: the same DELETE works because the inner query is wrapped in a
-- derived table (t); referencing users directly in the subquery raises error 1093.
-- MySQL has no functional index before 8.0.13; use a generated column + UNIQUE.`,
  explain: {
    en: `<p><strong>Finding</strong> is <code>GROUP BY</code> + <code>HAVING</code>. <code>HAVING</code> runs after aggregation, which is why it can see <code>COUNT(*)</code> and <code>WHERE</code> can't. Grouping by <code>lower(email)</code> catches <code>A@x.io</code>.</p>
<p><strong>Deleting</strong> needs to say which row survives, and that is a ranking problem. <code>ROW_NUMBER</code> (not <code>RANK</code>: we want exactly one survivor even on ties) with <code>ORDER BY updated_at DESC, id DESC</code> gives 1 to the row we keep. Every id with <code>rn &gt; 1</code> is deleted: ids 1, 2 and 3.</p>
<p>The production habits matter as much as the SQL: run it in a transaction, compare the reported row count with Part 1 (3 + 2 rows, minus 2 survivors = 3), and finish with a unique index so the bug can't come back.</p>`,
    he: `<p><strong>למצוא</strong> זה <code>GROUP BY</code> ועוד <code>HAVING</code>. <code>HAVING</code> רץ אחרי ה-aggregation, ולכן הוא רואה את <code>COUNT(*)</code> ו-<code>WHERE</code> לא. GROUP BY לפי <code>lower(email)</code> תופס גם את <code>A@x.io</code>.</p>
<p><strong>למחוק</strong> דורש להגיד איזו שורה שורדת, וזו בעיית דירוג. <code>ROW_NUMBER</code> (ולא <code>RANK</code>: אנחנו רוצים שורד אחד בדיוק גם בתיקו) עם <code>ORDER BY updated_at DESC, id DESC</code> נותן 1 לשורה שנשארת. כל id עם <code>rn &gt; 1</code> נמחק: ids 1, 2 ו-3.</p>
<p>ההרגלים של production חשובים כמו ה-SQL: להריץ בתוך transaction, להשוות את מספר השורות שנמחקו לחלק 1 (3 ועוד 2 שורות, פחות 2 שורדים = 3), ולסיים עם unique index כדי שהבאג לא יחזור.</p>`
  },
  complexity: "One hash or sort pass over users: O(n log n) for the window sort, O(n) for the GROUP BY with hashing",
  whyInfra: {
    en: "Dedup-keep-latest is the bread and butter of data pipelines and inventory: the same EC2 instance reported by two collectors, duplicate alerts from an at-least-once queue, CMDB rows imported twice, the latest config version per host. It's also how you build a \"current state\" table from an append-only event log.",
    he: "Dedup עם שמירת האחרון זה לחם וחמאה של data pipelines ושל inventory: אותו EC2 instance שמדווח משני collectors, התראות כפולות מתור at-least-once, שורות CMDB שיובאו פעמיים, גרסת ה-config האחרונה לכל host. ככה גם בונים טבלת \"מצב נוכחי\" מתוך event log שרק מוסיפים אליו."
  },
  followUps: [
    { q: { en: "The table has 2 billion rows. Is a single DELETE OK?", he: "בטבלה יש 2 מיליארד שורות. DELETE אחד זה בסדר?" },
      a: { en: "No: one huge transaction bloats WAL, holds locks and lags replicas. Delete in batches (e.g. 10k ids per transaction), or if most rows go, CREATE TABLE new AS SELECT the survivors, swap names, and rebuild indexes.", he: "לא: transaction ענק אחד מנפח את ה-WAL, מחזיק locks וגורם ל-replication lag. מוחקים ב-batches (למשל 10k ids לכל transaction), ואם רוב השורות הולכות, CREATE TABLE new AS SELECT לשורדים, מחליפים שמות ובונים indexes מחדש." } },
    { q: { en: "How do you just read the deduplicated view without deleting?", he: "איך קוראים את התצוגה בלי כפילויות בלי למחוק?" },
      a: { en: "In PostgreSQL: SELECT DISTINCT ON (lower(email)) * FROM users ORDER BY lower(email), updated_at DESC, id DESC. Elsewhere use the same ROW_NUMBER CTE with WHERE rn = 1.", he: "ב-PostgreSQL: SELECT DISTINCT ON (lower(email)) * FROM users ORDER BY lower(email), updated_at DESC, id DESC. במקומות אחרים משתמשים באותו CTE עם ROW_NUMBER ו-WHERE rn = 1." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 4. Customers who never ordered (anti-join)                          */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-customers-never-ordered",
  icon: "🚫",
  difficulty: "easy",
  tags: ["sql", "anti-join", "null", "not-exists"],
  leetcode: "183",
  title: { en: "SQL: Customers Who Never Ordered (the NOT IN NULL trap)", he: "SQL: לקוחות שאף פעם לא הזמינו (מלכודת NOT IN עם NULL)" },
  statement: {
    en: `<p>Return the names of customers who have <strong>no</strong> rows in <code>orders</code>. Note that guest checkouts create orders with <code>customer_id = NULL</code>.</p>
<pre>customers(id int PRIMARY KEY, name text)
orders(id int PRIMARY KEY, customer_id int NULL)

customers: (1,'Joe'), (2,'Henry'), (3,'Sam'), (4,'Max')
orders:    (1, 3), (2, 1), (3, NULL)   -- order 3 is a guest checkout</pre>`,
    he: `<p>תחזיר את השמות של הלקוחות שאין להם <strong>אף</strong> שורה ב-<code>orders</code>. שים לב: הזמנות של אורחים נשמרות עם <code>customer_id = NULL</code>.</p>
<pre>customers(id int PRIMARY KEY, name text)
orders(id int PRIMARY KEY, customer_id int NULL)

customers: (1,'Joe'), (2,'Henry'), (3,'Sam'), (4,'Max')
orders:    (1, 3), (2, 1), (3, NULL)   -- order 3 is a guest checkout</pre>`
  },
  examples: `NOT EXISTS / LEFT JOIN ... IS NULL:
name
-----
Henry
Max

WHERE id NOT IN (SELECT customer_id FROM orders):
(0 rows)     # the NULL from order 3 makes every comparison UNKNOWN`,
  hints: [
    { en: "This is an anti-join: rows from A with no match in B. There are three common ways to write it.", he: "זה anti-join: שורות מ-A שאין להן התאמה ב-B. יש שלוש דרכים נפוצות לכתוב את זה." },
    { en: "Try NOT IN on the sample data and think about what id &lt;&gt; NULL evaluates to.", he: "תנסה NOT IN על הנתונים לדוגמה ותחשוב מה יוצא מ-id &lt;&gt; NULL." },
    { en: "x NOT IN (3, 1, NULL) means x&lt;&gt;3 AND x&lt;&gt;1 AND x&lt;&gt;NULL. The last term is UNKNOWN, so the whole thing is never TRUE. Use NOT EXISTS.", he: "x NOT IN (3, 1, NULL) זה x&lt;&gt;3 AND x&lt;&gt;1 AND x&lt;&gt;NULL. האיבר האחרון הוא UNKNOWN, אז כל הביטוי אף פעם לא TRUE. תשתמש ב-NOT EXISTS." }
  ],
  solution: String.raw`-- PostgreSQL (same in MySQL / SQLite)
-- Preferred: NOT EXISTS. NULL-safe, and the planner turns it into a hash anti-join.
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id      -- a NULL customer_id simply never matches
)
ORDER BY c.id;

-- Equivalent: LEFT JOIN and keep the rows where nothing joined.
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL                  -- test a NOT NULL column of orders (its PK)
ORDER BY c.id;

-- TRAP: returns 0 rows as soon as orders.customer_id contains one NULL.
-- SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);
-- If you must use NOT IN, filter the NULLs out:
-- ... WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);`,
  explain: {
    en: `<p>SQL uses three-valued logic: TRUE, FALSE, UNKNOWN. Any comparison with NULL is UNKNOWN, and <code>WHERE</code> keeps only TRUE rows. <code>id NOT IN (3, 1, NULL)</code> expands to <code>id &lt;&gt; 3 AND id &lt;&gt; 1 AND id &lt;&gt; NULL</code>; for Henry that is TRUE AND TRUE AND UNKNOWN = UNKNOWN, so Henry disappears, and so does everyone else. One guest checkout silently empties the report.</p>
<p><code>NOT EXISTS</code> asks a different question: "is there a row where <code>o.customer_id = c.id</code> is TRUE?". The NULL row is never TRUE, so it is simply ignored. The <code>LEFT JOIN ... WHERE o.id IS NULL</code> form works too; test a column that is never NULL on a real match (the primary key), not <code>customer_id</code> itself.</p>`,
    he: `<p>ב-SQL יש לוגיקה של שלושה ערכים: TRUE, FALSE, UNKNOWN. כל השוואה עם NULL יוצאת UNKNOWN, ו-<code>WHERE</code> משאיר רק שורות שהן TRUE. <code>id NOT IN (3, 1, NULL)</code> נפתח ל-<code>id &lt;&gt; 3 AND id &lt;&gt; 1 AND id &lt;&gt; NULL</code>; בשביל Henry זה TRUE AND TRUE AND UNKNOWN = UNKNOWN, אז Henry נעלם, וכך גם כל השאר. הזמנת אורח אחת מרוקנת את הדוח בשקט.</p>
<p><code>NOT EXISTS</code> שואל שאלה אחרת: "יש שורה שבה <code>o.customer_id = c.id</code> הוא TRUE?". שורת ה-NULL אף פעם לא TRUE, אז פשוט מתעלמים ממנה. גם הצורה <code>LEFT JOIN ... WHERE o.id IS NULL</code> עובדת; בודקים עמודה שאף פעם לא NULL כשיש התאמה אמיתית (ה-primary key), ולא את <code>customer_id</code> עצמו.</p>`
  },
  complexity: "Hash anti-join: O(n + m) time, O(m) memory for the hash of orders",
  whyInfra: {
    en: "Anti-joins are how you find orphans and drift: EC2 instances with no matching CMDB/Terraform record, IAM users with no login in 90 days, DNS records pointing to IPs no instance owns, EBS volumes not attached to anything (pure cost waste). Nullable foreign keys are common in inventory data, so the NOT IN bug produces a reassuring \"0 orphans\" report.",
    he: "Anti-join זה איך מוצאים יתומים ו-drift: EC2 instances בלי רשומה תואמת ב-CMDB או ב-Terraform, IAM users בלי login ב-90 יום, רשומות DNS שמצביעות על IPs שאף instance לא מחזיק, EBS volumes שלא מחוברים לשום דבר (בזבוז כסף נקי). Foreign keys שיכולים להיות NULL נפוצים בנתוני inventory, אז הבאג של NOT IN מייצר דוח מרגיע של \"0 יתומים\"."
  },
  followUps: [
    { q: { en: "Which is faster, NOT EXISTS or LEFT JOIN / IS NULL?", he: "מה יותר מהיר, NOT EXISTS או LEFT JOIN עם IS NULL?" },
      a: { en: "In PostgreSQL both become the same Hash Anti Join plan; check with EXPLAIN. NOT IN with a subquery can't use the anti-join (because of NULL semantics) and may become a hashed SubPlan or worse, which is one more reason to avoid it.", he: "ב-PostgreSQL שניהם הופכים לאותה תוכנית Hash Anti Join; בודקים עם EXPLAIN. NOT IN עם subquery לא יכול להשתמש ב-anti-join (בגלל הסמנטיקה של NULL) ויכול להפוך ל-hashed SubPlan או גרוע מזה, עוד סיבה להימנע ממנו." } },
    { q: { en: "Customers with no orders in the last 30 days?", he: "לקוחות בלי הזמנות ב-30 הימים האחרונים?" },
      a: { en: "Put the time filter inside the subquery: NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.created_at &gt;= now() - interval '30 days'). Putting it in the outer WHERE of a LEFT JOIN would turn it back into an inner join.", he: "שמים את סינון הזמן בתוך ה-subquery: NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.created_at &gt;= now() - interval '30 days'). אם שמים אותו ב-WHERE החיצוני של LEFT JOIN, זה הופך בחזרה ל-inner join." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 5. Consecutive login days (gaps and islands)                        */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-consecutive-days",
  icon: "🏝️",
  difficulty: "hard",
  tags: ["sql", "window-function", "gaps-and-islands", "row-number"],
  title: { en: "SQL: Consecutive Login Streaks (Gaps and Islands)", he: "SQL: רצפים של ימי login (Gaps and Islands)" },
  statement: {
    en: `<p>Find every streak of <strong>3 or more consecutive calendar days</strong> on which a user logged in at least once. Return <code>user_id, streak_start, streak_end, days</code>. A user can log in several times a day, and a user can have several streaks.</p>
<pre>logins(user_id int, login_at timestamp)

 user_id | login_at
---------+-----------------
       1 | 2026-03-01 08:10
       1 | 2026-03-02 09:00
       1 | 2026-03-02 21:30
       1 | 2026-03-03 07:45
       1 | 2026-03-05 10:00
       2 | 2026-03-01 12:00
       2 | 2026-03-03 12:00
       2 | 2026-03-04 12:00
       3 | 2026-03-10 23:59
       3 | 2026-03-11 00:01
       3 | 2026-03-12 18:00
       3 | 2026-03-13 06:00</pre>`,
    he: `<p>תמצא כל רצף של <strong>3 ימים קלנדריים רצופים או יותר</strong> שבהם משתמש עשה login לפחות פעם אחת. תחזיר <code>user_id, streak_start, streak_end, days</code>. משתמש יכול לעשות login כמה פעמים ביום, ולמשתמש יכולים להיות כמה רצפים.</p>
<pre>logins(user_id int, login_at timestamp)

 user_id | login_at
---------+-----------------
       1 | 2026-03-01 08:10
       1 | 2026-03-02 09:00
       1 | 2026-03-02 21:30
       1 | 2026-03-03 07:45
       1 | 2026-03-05 10:00
       2 | 2026-03-01 12:00
       2 | 2026-03-03 12:00
       2 | 2026-03-04 12:00
       3 | 2026-03-10 23:59
       3 | 2026-03-11 00:01
       3 | 2026-03-12 18:00
       3 | 2026-03-13 06:00</pre>`
  },
  examples: `user_id | streak_start | streak_end | days
--------+--------------+------------+-----
      1 | 2026-03-01   | 2026-03-03 | 3     # 03-02 counted once; 03-05 is a separate 1-day island
      3 | 2026-03-10   | 2026-03-13 | 4     # 23:59 and 00:01 are different days
# user 2: 03-01 alone, then 03-03..03-04 = 2 days -> no streak of 3`,
  hints: [
    { en: "First reduce to one row per (user, day): DISTINCT user_id, login_at::date. Multiple logins per day would break the counting.", he: "קודם תצמצם לשורה אחת לכל (משתמש, יום): DISTINCT user_id, login_at::date. כמה logins ביום ישברו את הספירה." },
    { en: "Number each user's days with ROW_NUMBER in date order. Look at day - row_number for a streak: what do you notice?", he: "תמספר את הימים של כל משתמש עם ROW_NUMBER לפי סדר התאריכים. תסתכל על day - row_number בתוך רצף: מה אתה רואה?" },
    { en: "Inside a run of consecutive days both the date and the row number grow by 1, so date - rn is constant. That constant is the island id: GROUP BY user_id, it and keep HAVING COUNT(*) &gt;= 3.", he: "בתוך רצף של ימים רצופים גם התאריך וגם מספר השורה עולים ב-1, אז date - rn קבוע. הקבוע הזה הוא ה-id של האי: GROUP BY user_id ועליו, ולהשאיר HAVING COUNT(*) &gt;= 3." }
  ],
  solution: String.raw`-- PostgreSQL
WITH days AS (
    -- one row per user per calendar day (timezone! see follow-up)
    SELECT DISTINCT user_id, login_at::date AS d
    FROM logins
),
islands AS (
    SELECT user_id, d,
           -- date - integer = date in PostgreSQL. Consecutive days share the same value.
           d - CAST(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d) AS int) AS grp
    FROM days
)
SELECT user_id,
       MIN(d)   AS streak_start,
       MAX(d)   AS streak_end,
       COUNT(*) AS days
FROM islands
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, streak_start;

-- MySQL 8: DATE(login_at) AS d, and
--   DATE_SUB(d, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d) DAY) AS grp
-- SQLite: date(d, '-' || ROW_NUMBER() OVER (...) || ' days') AS grp`,
  explain: {
    en: `<p>"Gaps and islands" problems ask you to group rows that form an unbroken run. The trick: subtract a dense sequence from the value. For user 1 the distinct days are 03-01, 03-02, 03-03, 03-05 with row numbers 1, 2, 3, 4:</p>
<pre>d        rn   d - rn
03-01     1   02-28
03-02     2   02-28
03-03     3   02-28
03-05     4   03-01   &lt;- gap, new island</pre>
<p>Each island gets a constant <code>grp</code>, and a gap shifts it. Then it's a plain <code>GROUP BY user_id, grp</code> with <code>MIN</code>/<code>MAX</code>/<code>COUNT</code>.</p>
<p>The <code>DISTINCT</code> step is essential: without it, the two logins on 03-02 get row numbers 2 and 3, the date minus rn drops by one, and the streak breaks in the wrong place.</p>`,
    he: `<p>בעיות "gaps and islands" מבקשות לקבץ שורות שיוצרות רצף בלי הפסקה. הטריק: מחסירים מהערך סדרה רציפה. אצל משתמש 1 הימים השונים הם 03-01, 03-02, 03-03, 03-05 עם מספרי שורה 1, 2, 3, 4:</p>
<pre>d        rn   d - rn
03-01     1   02-28
03-02     2   02-28
03-03     3   02-28
03-05     4   03-01   &lt;- gap, new island</pre>
<p>כל אי מקבל <code>grp</code> קבוע, וחור מזיז אותו. משם זה סתם <code>GROUP BY user_id, grp</code> עם <code>MIN</code>/<code>MAX</code>/<code>COUNT</code>.</p>
<p>שלב ה-<code>DISTINCT</code> קריטי: בלעדיו שני ה-logins של 03-02 מקבלים מספרי שורה 2 ו-3, התאריך פחות rn יורד באחד, והרצף נשבר במקום הלא נכון.</p>`
  },
  complexity: "Distinct + one window sort per user: O(n log n)",
  whyInfra: {
    en: "Gaps and islands is the core of uptime and incident analytics: turn per-minute health-check results into outage windows (consecutive failed minutes), find how many consecutive days a cron job failed, compute the longest streak of nights a backup succeeded, or merge consecutive \"firing\" alert samples into incidents for MTTR reports.",
    he: "Gaps and islands זה הלב של ניתוח uptime ו-incidents: להפוך תוצאות health-check לכל דקה לחלונות outage (דקות כושלות רצופות), למצוא כמה ימים ברצף cron job נכשל, לחשב את הרצף הכי ארוך של לילות שבהם ה-backup הצליח, או לאחד דגימות \"firing\" רצופות של alert ל-incidents בשביל דוחות MTTR."
  },
  followUps: [
    { q: { en: "Users are worldwide. Which \"day\" do you use?", he: "המשתמשים בכל העולם. איזה \"יום\" אתה משתמש?" },
      a: { en: "login_at::date uses the session TimeZone. For per-user days, store timestamptz and convert: (login_at AT TIME ZONE u.tz)::date. Decide explicitly and document it; UTC days can split one local evening across two days.", he: "login_at::date משתמש ב-TimeZone של ה-session. בשביל ימים לפי משתמש, שומרים timestamptz וממירים: (login_at AT TIME ZONE u.tz)::date. מחליטים במפורש ומתעדים; ימי UTC יכולים לחתוך ערב מקומי אחד לשני ימים." } },
    { q: { en: "Find outage windows: consecutive minutes where status = 'down', with health checks every minute.", he: "תמצא חלונות outage: דקות רצופות שבהן status = 'down', כש-health checks רצים כל דקה." },
      a: { en: "Same trick with two row numbers: ROW_NUMBER() OVER (ORDER BY ts) - ROW_NUMBER() OVER (PARTITION BY status ORDER BY ts) is constant inside each run of equal status. Group by (status, that difference) and keep status = 'down'.", he: "אותו טריק עם שני מספרי שורה: ROW_NUMBER() OVER (ORDER BY ts) פחות ROW_NUMBER() OVER (PARTITION BY status ORDER BY ts) קבוע בתוך כל רצף של אותו status. עושים GROUP BY לפי (status, ההפרש) ומשאירים status = 'down'." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 6. Running total and 7-day moving average                           */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-running-total-and-7day-avg",
  icon: "📈",
  difficulty: "medium",
  tags: ["sql", "window-function", "frame", "moving-average"],
  title: { en: "SQL: Running Total and 7-Day Moving Average of Cloud Cost", he: "SQL: סכום מצטבר וממוצע נע של 7 ימים לעלות ענן" },
  statement: {
    en: `<p>For a daily cloud bill, return for each day: the cost, the <strong>month-to-date running total</strong>, and the <strong>7-day moving average</strong> (the current day plus up to 6 previous days, rounded to 2 decimals). Also show how many days are in the averaging window so readers know the first days are partial.</p>
<pre>daily_cost(day date PRIMARY KEY, cost_usd numeric(12,2))

 day        | cost_usd
------------+---------
 2026-05-01 |   100
 2026-05-02 |   120
 2026-05-03 |    90
 2026-05-04 |   110
 2026-05-05 |   130
 2026-05-06 |   150
 2026-05-07 |   140
 2026-05-08 |   200</pre>`,
    he: `<p>בהינתן חשבון ענן יומי, תחזיר לכל יום: את העלות, את <strong>הסכום המצטבר מתחילת החודש</strong>, ואת <strong>הממוצע הנע של 7 ימים</strong> (היום הנוכחי ועוד עד 6 ימים קודמים, מעוגל ל-2 ספרות). תציג גם כמה ימים יש בחלון הממוצע, כדי שהקורא יידע שהימים הראשונים חלקיים.</p>
<pre>daily_cost(day date PRIMARY KEY, cost_usd numeric(12,2))

 day        | cost_usd
------------+---------
 2026-05-01 |   100
 2026-05-02 |   120
 2026-05-03 |    90
 2026-05-04 |   110
 2026-05-05 |   130
 2026-05-06 |   150
 2026-05-07 |   140
 2026-05-08 |   200</pre>`
  },
  examples: `day        | cost_usd | running_total | avg_7d | days_in_window
-----------+----------+---------------+--------+---------------
2026-05-01 |      100 |           100 | 100.00 | 1
2026-05-02 |      120 |           220 | 110.00 | 2
2026-05-03 |       90 |           310 | 103.33 | 3
2026-05-04 |      110 |           420 | 105.00 | 4
2026-05-05 |      130 |           550 | 110.00 | 5
2026-05-06 |      150 |           700 | 116.67 | 6
2026-05-07 |      140 |           840 | 120.00 | 7
2026-05-08 |      200 |          1040 | 134.29 | 7     # window = 05-02..05-08, 05-01 dropped out`,
  hints: [
    { en: "An aggregate with OVER (ORDER BY day) keeps every row and aggregates \"up to here\". That is a running total.", he: "Aggregate עם OVER (ORDER BY day) משאיר כל שורה ומחשב \"עד כאן\". זה סכום מצטבר." },
    { en: "The moving average needs a window frame: ROWS BETWEEN 6 PRECEDING AND CURRENT ROW.", he: "הממוצע הנע צריך window frame: ROWS BETWEEN 6 PRECEDING AND CURRENT ROW." },
    { en: "ROWS counts rows, not days. If a day is missing, \"6 preceding rows\" spans more than a week. Use RANGE with an interval, or fill the gaps with generate_series.", he: "ROWS סופר שורות, לא ימים. אם חסר יום, \"6 שורות קודמות\" משתרעות על יותר משבוע. תשתמש ב-RANGE עם interval, או תמלא את החורים עם generate_series." }
  ],
  solution: String.raw`-- PostgreSQL
SELECT day,
       cost_usd,
       -- month-to-date: restart the sum every month
       SUM(cost_usd) OVER (PARTITION BY date_trunc('month', day)
                           ORDER BY day
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       ROUND(AVG(cost_usd) OVER w7, 2)                                          AS avg_7d,
       COUNT(*)        OVER w7                                                  AS days_in_window
FROM daily_cost
-- Calendar-correct 7-day window: by date value, not by row count (PostgreSQL 11+).
WINDOW w7 AS (ORDER BY day RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)
ORDER BY day;

-- If every day is guaranteed present, this is equivalent and works everywhere:
--   WINDOW w7 AS (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
-- MySQL 8: RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW
-- SQLite has no interval RANGE; fill missing days first (recursive CTE) and use ROWS.

-- Gap-filling alternative in PostgreSQL (missing day = $0, not "skip"):
-- SELECT g::date AS day, COALESCE(c.cost_usd, 0) AS cost_usd
-- FROM generate_series('2026-05-01'::date, '2026-05-31', '1 day') g
-- LEFT JOIN daily_cost c ON c.day = g::date;`,
  explain: {
    en: `<p>Adding <code>OVER (...)</code> turns an aggregate into a window function: every row stays, and the aggregate is computed over that row's <strong>frame</strong>. With <code>ORDER BY day</code> and a frame from <code>UNBOUNDED PRECEDING</code> to <code>CURRENT ROW</code> you get a running total; <code>PARTITION BY date_trunc('month', day)</code> resets it monthly.</p>
<p>For the moving average the frame is "the last 7 days". On 05-08 it covers 05-02..05-08: (120+90+110+130+150+140+200)/7 = 940/7 = 134.29. The first six days have partial windows, which is why <code>days_in_window</code> is worth showing (or hide those rows).</p>
<p>The senior-level point is <code>ROWS</code> vs <code>RANGE</code>. <code>ROWS 6 PRECEDING</code> means six physical rows; if 05-04 were missing, the 05-08 window would silently reach back to 05-01. <code>RANGE INTERVAL '6 days' PRECEDING</code> uses the date values. Also mention the default frame: with <code>ORDER BY</code> and no frame, PostgreSQL uses <code>RANGE UNBOUNDED PRECEDING</code>, which includes all peer rows with the same day, a surprise when the order key isn't unique.</p>`,
    he: `<p>הוספת <code>OVER (...)</code> הופכת aggregate ל-window function: כל שורה נשארת, וה-aggregate מחושב על ה-<strong>frame</strong> של אותה שורה. עם <code>ORDER BY day</code> ו-frame מ-<code>UNBOUNDED PRECEDING</code> עד <code>CURRENT ROW</code> מקבלים סכום מצטבר; <code>PARTITION BY date_trunc('month', day)</code> מאפס אותו כל חודש.</p>
<p>בממוצע הנע ה-frame הוא "7 הימים האחרונים". ב-05-08 הוא מכסה את 05-02..05-08: (120+90+110+130+150+140+200)/7 = 940/7 = 134.29. לשישה הימים הראשונים יש חלונות חלקיים, ובגלל זה שווה להציג את <code>days_in_window</code> (או להסתיר את השורות האלה).</p>
<p>הנקודה ברמת senior היא <code>ROWS</code> מול <code>RANGE</code>. <code>ROWS 6 PRECEDING</code> זה שש שורות פיזיות; אם 05-04 היה חסר, החלון של 05-08 היה מגיע בשקט עד 05-01. <code>RANGE INTERVAL '6 days' PRECEDING</code> עובד לפי ערכי התאריך. כדאי להזכיר גם את ה-frame הדיפולטי: עם <code>ORDER BY</code> ובלי frame, PostgreSQL משתמש ב-<code>RANGE UNBOUNDED PRECEDING</code>, שכולל את כל השורות עם אותו יום, הפתעה כשמפתח המיון לא ייחודי.</p>`
  },
  complexity: "One sort by day, then each frame is maintained incrementally: O(n log n), O(n) if already sorted/indexed",
  whyInfra: {
    en: "This is the FinOps dashboard query: month-to-date spend vs budget, 7-day average to smooth weekday/weekend noise, and \"today is 40% above the 7-day average\" anomaly alerts. The same frames power SLO burn-rate panels (rolling 7d/28d error budget) and capacity trend lines.",
    he: "זה ה-query של דשבורד FinOps: הוצאה מתחילת החודש מול התקציב, ממוצע של 7 ימים כדי להחליק את הרעש של אמצע שבוע מול סוף שבוע, והתראות anomaly של \"היום 40% מעל הממוצע של 7 הימים\". אותם frames מפעילים פאנלים של SLO burn-rate (error budget מתגלגל של 7d/28d) וקווי מגמה של capacity."
  },
  followUps: [
    { q: { en: "Flag days that are more than 30% above the previous 7-day average (excluding today).", he: "תסמן ימים שגבוהים ביותר מ-30% מהממוצע של 7 הימים הקודמים (בלי היום)." },
      a: { en: "Use a frame that ends before the current row: AVG(cost_usd) OVER (ORDER BY day ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING), wrap in a CTE, and filter cost_usd &gt; 1.3 * prev_avg. Including today would dampen the very spike you're trying to catch.", he: "משתמשים ב-frame שנגמר לפני השורה הנוכחית: AVG(cost_usd) OVER (ORDER BY day ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING), עוטפים ב-CTE ומסננים cost_usd &gt; 1.3 * prev_avg. אם כוללים את היום, הוא מחליש בדיוק את הקפיצה שמנסים לתפוס." } },
    { q: { en: "Do the same per AWS account.", he: "אותו דבר לכל חשבון AWS." },
      a: { en: "Add PARTITION BY account_id to every window (and to the month partition). Without it, the frames mix accounts and the running total becomes a global one.", he: "מוסיפים PARTITION BY account_id לכל window (וגם ל-partition של החודש). בלעדיו ה-frames מערבבים חשבונות והסכום המצטבר הופך לגלובלי." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 7. Day-over-day change with LAG                                     */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-day-over-day-change",
  icon: "↕️",
  difficulty: "medium",
  tags: ["sql", "window-function", "lag", "null"],
  title: { en: "SQL: Day-over-Day Error Change per Service (LAG)", he: "SQL: שינוי יומי בכמות השגיאות לכל service (LAG)" },
  statement: {
    en: `<p>For each service and day, return the error count, the previous day's count, the absolute change, and the <strong>percentage change rounded to 1 decimal</strong>. The first day of each service has no previous value. Division by zero must not crash the query.</p>
<pre>daily_errors(day date, service text, errors int, PRIMARY KEY (service, day))

 day        | service | errors
------------+---------+-------
 2026-06-01 | api     |   120
 2026-06-02 | api     |   150
 2026-06-03 | api     |    90
 2026-06-01 | auth    |     0
 2026-06-02 | auth    |     8
 2026-06-03 | auth    |    10</pre>`,
    he: `<p>לכל service ויום, תחזיר את כמות השגיאות, את הכמות של היום הקודם, את השינוי המוחלט, ואת <strong>השינוי באחוזים מעוגל לספרה אחת</strong>. ליום הראשון של כל service אין ערך קודם. חלוקה באפס לא אמורה להפיל את ה-query.</p>
<pre>daily_errors(day date, service text, errors int, PRIMARY KEY (service, day))

 day        | service | errors
------------+---------+-------
 2026-06-01 | api     |   120
 2026-06-02 | api     |   150
 2026-06-03 | api     |    90
 2026-06-01 | auth    |     0
 2026-06-02 | auth    |     8
 2026-06-03 | auth    |    10</pre>`
  },
  examples: `service | day        | errors | prev_errors | delta | pct_change
--------+------------+--------+-------------+-------+-----------
api     | 2026-06-01 |    120 | NULL        | NULL  | NULL
api     | 2026-06-02 |    150 | 120         |    30 |  25.0
api     | 2026-06-03 |     90 | 150         |   -60 | -40.0
auth    | 2026-06-01 |      0 | NULL        | NULL  | NULL
auth    | 2026-06-02 |      8 | 0           |     8 | NULL     # from 0: percentage undefined
auth    | 2026-06-03 |     10 | 8           |     2 |  25.0`,
  hints: [
    { en: "A self-join on day = day - 1 works but is clumsy and breaks on missing days. Which window function reads the previous row?", he: "Self-join על day = day - 1 עובד, אבל מסורבל ונשבר כשחסרים ימים. איזו window function קוראת את השורה הקודמת?" },
    { en: "LAG(errors) OVER (PARTITION BY service ORDER BY day). Without PARTITION BY, auth's first day would compare to api's last day.", he: "LAG(errors) OVER (PARTITION BY service ORDER BY day). בלי PARTITION BY, היום הראשון של auth יושווה ליום האחרון של api." },
    { en: "Guard the division with NULLIF(prev, 0), and multiply by 100.0 (not 100) so integer division doesn't truncate.", he: "תגן על החלוקה עם NULLIF(prev, 0), ותכפיל ב-100.0 (לא 100) כדי שחלוקת integers לא תקצץ את התוצאה." }
  ],
  solution: String.raw`-- PostgreSQL (MySQL 8 / SQLite 3.25+ identical, incl. the named WINDOW clause)
SELECT service,
       day,
       errors,
       LAG(errors) OVER w                        AS prev_errors,
       errors - LAG(errors) OVER w               AS delta,
       ROUND(
           100.0 * (errors - LAG(errors) OVER w)  -- 100.0 forces numeric, not integer division
           / NULLIF(LAG(errors) OVER w, 0)        -- 0 -> NULL, so x / NULL = NULL instead of an error
       , 1)                                      AS pct_change
FROM daily_errors
WINDOW w AS (PARTITION BY service ORDER BY day)  -- define once, reuse
ORDER BY service, day;

-- Variants:
--   LAG(errors, 7) OVER w            -> week-over-week (same weekday last week)
--   LAG(errors, 1, 0) OVER w         -> default 0 instead of NULL on the first row`,
  explain: {
    en: `<p><code>LAG(expr, offset = 1)</code> returns <code>expr</code> from the row <code>offset</code> positions earlier in the window's order; <code>LEAD</code> looks forward. <code>PARTITION BY service</code> keeps the services independent, so each one's first row gets NULL.</p>
<p>Then NULL propagation does the right thing for free: <code>errors - NULL</code> is NULL, so the first day shows no change instead of a fake +120. For the percentage, <code>NULLIF(prev, 0)</code> turns a zero baseline into NULL, and dividing by NULL yields NULL instead of <code>ERROR: division by zero</code>. That matters: auth going from 0 to 8 errors is an infinite percentage increase, and NULL ("undefined") is more honest than a number.</p>
<p>Watch the integer trap: in PostgreSQL <code>30 / 120</code> is 0. Writing <code>100.0 *</code> first makes the whole expression numeric.</p>`,
    he: `<p><code>LAG(expr, offset = 1)</code> מחזיר את <code>expr</code> מהשורה שנמצאת <code>offset</code> מקומות קודם לפי הסדר של ה-window; <code>LEAD</code> מסתכל קדימה. <code>PARTITION BY service</code> שומר על כל service בנפרד, אז השורה הראשונה של כל אחד מקבלת NULL.</p>
<p>משם NULL propagation עושה את העבודה בחינם: <code>errors - NULL</code> זה NULL, אז היום הראשון לא מראה שינוי במקום +120 מזויף. באחוזים, <code>NULLIF(prev, 0)</code> הופך בסיס של אפס ל-NULL, וחלוקה ב-NULL נותנת NULL במקום <code>ERROR: division by zero</code>. זה חשוב: auth שעובר מ-0 ל-8 שגיאות זו עלייה של אינסוף אחוז, ו-NULL ("לא מוגדר") כן יותר ממספר.</p>
<p>תיזהר ממלכודת ה-integer: ב-PostgreSQL <code>30 / 120</code> זה 0. כשכותבים <code>100.0 *</code> בהתחלה, כל הביטוי הופך ל-numeric.</p>`
  },
  complexity: "One sort by (service, day): O(n log n); O(n) with the (service, day) primary key index",
  whyInfra: {
    en: "Day-over-day and week-over-week deltas are the first thing you compute in incident analysis (\"errors jumped 300% after Tuesday's deploy\"), in cost anomaly reports (\"S3 spend +45% vs yesterday\"), and in capacity reviews (disk growth per day from LAG of used bytes, which also gives you days-until-full).",
    he: "שינויים יום מול יום ושבוע מול שבוע זה הדבר הראשון שמחשבים בניתוח incident (\"השגיאות קפצו ב-300% אחרי ה-deploy של יום שלישי\"), בדוחות anomaly של עלויות (\"הוצאות S3 עלו ב-45% מאתמול\"), ובסקירות capacity (גדילת דיסק ליום מ-LAG של ה-bytes בשימוש, שגם נותן כמה ימים נשארו עד שהדיסק מתמלא)."
  },
  followUps: [
    { q: { en: "Some days have no row at all (zero errors aren't written). What goes wrong?", he: "לחלק מהימים אין שורה בכלל (אפס שגיאות לא נכתב). מה משתבש?" },
      a: { en: "LAG returns the previous existing row, which may be three days ago, so \"day-over-day\" silently compares non-adjacent days. Build a calendar with generate_series, CROSS JOIN the services, LEFT JOIN the data with COALESCE(errors, 0), then apply LAG.", he: "LAG מחזיר את השורה הקודמת שקיימת, שיכולה להיות מלפני שלושה ימים, אז ה-\"יום מול יום\" משווה בשקט ימים לא סמוכים. בונים לוח שנה עם generate_series, עושים CROSS JOIN עם ה-services, LEFT JOIN לנתונים עם COALESCE(errors, 0), ורק אז LAG." } },
    { q: { en: "Return only days where errors at least doubled and were above 100.", he: "תחזיר רק ימים שבהם השגיאות לפחות הוכפלו והיו מעל 100." },
      a: { en: "Compute prev_errors in a CTE, then WHERE errors &gt;= 2 * prev_errors AND errors &gt; 100. You can't reference a window function in WHERE of the same SELECT. The absolute floor avoids alerting on 1 -&gt; 2.", he: "מחשבים את prev_errors ב-CTE, ואז WHERE errors &gt;= 2 * prev_errors AND errors &gt; 100. אי אפשר להשתמש ב-window function ב-WHERE של אותו SELECT. הרצפה המוחלטת מונעת התראה על 1 -&gt; 2." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 8. Retention by signup cohort                                       */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-retention-cohort",
  icon: "🧪",
  difficulty: "hard",
  tags: ["sql", "cohort", "date-math", "aggregation"],
  title: { en: "SQL: Week-N Retention by Signup Cohort", he: "SQL: Retention לפי שבוע N וקוהורט הרשמה" },
  statement: {
    en: `<p>Group users into <strong>cohorts by signup week</strong> (weeks start on Monday). For each cohort and each <code>week_n</code> (0 = days 0-6 after signup, 1 = days 7-13, ...), return how many distinct users of the cohort were active and the retention percentage (1 decimal). Week N is measured from <em>each user's</em> signup date, not from the cohort's Monday.</p>
<pre>users(user_id int PRIMARY KEY, signup_date date)
events(user_id int, event_date date)

users:  (1,'2026-01-05'), (2,'2026-01-07'), (3,'2026-01-08'),
        (4,'2026-01-12'), (5,'2026-01-14')
events: (1,'2026-01-06'), (1,'2026-01-13'), (1,'2026-01-14'), (1,'2026-01-20'),
        (2,'2026-01-15'), (3,'2026-01-09'),
        (4,'2026-01-13'), (4,'2026-01-20'), (5,'2026-01-28')</pre>`,
    he: `<p>תחלק את המשתמשים ל-<strong>cohorts לפי שבוע ההרשמה</strong> (שבוע מתחיל ביום שני). לכל cohort ולכל <code>week_n</code> (0 = ימים 0-6 אחרי ההרשמה, 1 = ימים 7-13, ...), תחזיר כמה משתמשים שונים מה-cohort היו פעילים ואת אחוז ה-retention (ספרה אחת אחרי הנקודה). שבוע N נמדד מתאריך ההרשמה של <em>כל משתמש</em>, ולא מיום שני של ה-cohort.</p>
<pre>users(user_id int PRIMARY KEY, signup_date date)
events(user_id int, event_date date)

users:  (1,'2026-01-05'), (2,'2026-01-07'), (3,'2026-01-08'),
        (4,'2026-01-12'), (5,'2026-01-14')
events: (1,'2026-01-06'), (1,'2026-01-13'), (1,'2026-01-14'), (1,'2026-01-20'),
        (2,'2026-01-15'), (3,'2026-01-09'),
        (4,'2026-01-13'), (4,'2026-01-20'), (5,'2026-01-28')</pre>`
  },
  examples: `cohort_week | cohort_size | week_n | active_users | retention_pct
------------+-------------+--------+--------------+--------------
2026-01-05  | 3           | 0      | 2            | 66.7    # users 1 (01-06), 3 (01-09)
2026-01-05  | 3           | 1      | 2            | 66.7    # user 1 (2 events, counted once), user 2 (day 8)
2026-01-05  | 3           | 2      | 1            | 33.3    # user 1 (day 15)
2026-01-12  | 2           | 0      | 1            | 50.0    # user 4
2026-01-12  | 2           | 1      | 1            | 50.0    # user 4 (day 8)
2026-01-12  | 2           | 2      | 1            | 50.0    # user 5 (day 14)`,
  hints: [
    { en: "Break it into CTEs: (1) each user's cohort week, (2) cohort sizes, (3) distinct (cohort, user, week_n) activity rows, (4) aggregate.", he: "תפרק ל-CTEs: (1) שבוע ה-cohort של כל משתמש, (2) גודל כל cohort, (3) שורות פעילות ייחודיות של (cohort, user, week_n), (4) aggregate." },
    { en: "date_trunc('week', signup_date) gives the Monday. week_n = (event_date - signup_date) / 7, since date - date is an integer number of days in PostgreSQL.", he: "date_trunc('week', signup_date) נותן את יום שני. week_n = (event_date - signup_date) / 7, כי ב-PostgreSQL date פחות date זה מספר ימים שלם." },
    { en: "Compute cohort_size separately from the activity join. If you count users after joining events, inactive users vanish and retention looks great.", he: "תחשב את cohort_size בנפרד מה-join עם הפעילות. אם סופרים משתמשים אחרי ה-join עם events, משתמשים לא פעילים נעלמים וה-retention נראה מעולה." }
  ],
  solution: String.raw`-- PostgreSQL
WITH cohorts AS (
    SELECT user_id,
           signup_date,
           date_trunc('week', signup_date)::date AS cohort_week   -- ISO week: Monday
    FROM users
),
sizes AS (
    -- denominator from users, NOT from events: inactive users must count
    SELECT cohort_week, COUNT(*) AS cohort_size
    FROM cohorts
    GROUP BY cohort_week
),
activity AS (
    -- one row per user per week_n, no matter how many events
    SELECT DISTINCT
           c.cohort_week,
           c.user_id,
           (e.event_date - c.signup_date) / 7 AS week_n    -- int / int = floor for >= 0
    FROM cohorts c
    JOIN events e
      ON e.user_id = c.user_id
     AND e.event_date >= c.signup_date                     -- ignore pre-signup noise
)
SELECT a.cohort_week,
       s.cohort_size,
       a.week_n,
       COUNT(*)                                      AS active_users,
       ROUND(100.0 * COUNT(*) / s.cohort_size, 1)    AS retention_pct
FROM activity a
JOIN sizes s USING (cohort_week)
GROUP BY a.cohort_week, s.cohort_size, a.week_n
ORDER BY a.cohort_week, a.week_n;

-- MySQL 8:
--   cohort_week = DATE_SUB(signup_date, INTERVAL WEEKDAY(signup_date) DAY)
--   week_n      = FLOOR(DATEDIFF(e.event_date, c.signup_date) / 7)   -- '/' is decimal in MySQL
-- Pivot to a classic triangle (one row per cohort):
--   COUNT(*) FILTER (WHERE week_n = 1) ... in PostgreSQL, SUM(week_n = 1) in MySQL.`,
  explain: {
    en: `<p>Cohort retention is a composition of simple steps, and interviewers watch whether you structure it with CTEs instead of one giant query.</p>
<ol><li><strong>Cohort key.</strong> <code>date_trunc('week', ...)</code> maps 01-05, 01-07 and 01-08 to Monday 01-05, and 01-12, 01-14 to 01-12.</li>
<li><strong>Denominator.</strong> Count cohort members from <code>users</code>. The classic bug is counting from the joined activity, which drops users who never came back.</li>
<li><strong>week_n per user.</strong> User 2 signed up 01-07 and was active 01-15: 8 days, so week 1, even though 01-15 is in calendar week 2 of the cohort. Measuring from each user's own signup keeps early-week and late-week signups comparable.</li>
<li><strong>Distinct.</strong> User 1 had two events in week 1; <code>DISTINCT</code> on (cohort, user, week_n) makes him count once.</li></ol>
<p>Note the result has no row for a week where nobody was active. If the chart needs explicit zeros, generate the (cohort, week_n) grid with <code>generate_series</code> and LEFT JOIN.</p>`,
    he: `<p>Cohort retention מורכב מצעדים פשוטים, והמראיינים בודקים אם אתה בונה את זה עם CTEs במקום query ענק אחד.</p>
<ol><li><strong>מפתח ה-cohort.</strong> <code>date_trunc('week', ...)</code> ממפה את 01-05, 01-07 ו-01-08 ליום שני 01-05, ואת 01-12, 01-14 ל-01-12.</li>
<li><strong>המכנה.</strong> סופרים את חברי ה-cohort מ-<code>users</code>. הבאג הקלאסי הוא לספור מתוך הפעילות אחרי ה-join, וזה מפיל משתמשים שלא חזרו אף פעם.</li>
<li><strong>week_n לכל משתמש.</strong> משתמש 2 נרשם ב-01-07 והיה פעיל ב-01-15: 8 ימים, אז שבוע 1, למרות ש-01-15 נמצא בשבוע הקלנדרי השני של ה-cohort. מדידה מההרשמה של כל משתמש שומרת על השוואה הוגנת בין מי שנרשם בתחילת השבוע לבין מי שנרשם בסופו.</li>
<li><strong>Distinct.</strong> למשתמש 1 היו שני events בשבוע 1; <code>DISTINCT</code> על (cohort, user, week_n) גורם לו להיספר פעם אחת.</li></ol>
<p>שים לב שבתוצאה אין שורה לשבוע שבו אף אחד לא היה פעיל. אם הגרף צריך אפסים מפורשים, מייצרים את ה-grid של (cohort, week_n) עם <code>generate_series</code> ועושים LEFT JOIN.</p>`
  },
  complexity: "Join users-events (hash join) + DISTINCT + GROUP BY: O(n + m) with hashing, O(m log m) if the planner sorts",
  whyInfra: {
    en: "Platform teams run cohort queries on their own product: of the services onboarded to the new deploy platform in week X, how many still deploy through it in week 4? Of the engineers who got on-call access, how many are still active? It's also the shape of fleet analysis: of the nodes launched in a given week, how many are still alive after N weeks (spot interruption and churn by AMI version).",
    he: "צוותי platform מריצים queries של cohort על המוצר של עצמם: מתוך ה-services שעלו לפלטפורמת ה-deploy החדשה בשבוע X, כמה עדיין עושים דרכה deploy בשבוע 4? מתוך המהנדסים שקיבלו הרשאות on-call, כמה עדיין פעילים? זו גם הצורה של ניתוח fleet: מתוך ה-nodes שעלו בשבוע מסוים, כמה עדיין חיים אחרי N שבועות (spot interruptions ו-churn לפי גרסת AMI)."
  },
  followUps: [
    { q: { en: "The last cohort shows week-2 retention of 0%. Is the product broken?", he: "ה-cohort האחרון מראה retention של 0% בשבוע 2. המוצר שבור?" },
      a: { en: "Probably not: those users haven't lived 14 days yet. Only report week_n for users where signup_date + 7 * (week_n + 1) &lt;= today (right-censoring), or grey out the incomplete cells in the triangle.", he: "כנראה שלא: המשתמשים האלה עוד לא חיו 14 יום. מדווחים week_n רק למשתמשים שבהם signup_date + 7 * (week_n + 1) &lt;= היום (right-censoring), או מאפירים את התאים שלא הושלמו במשולש." } },
    { q: { en: "events has 5 billion rows. How would you make this cheap?", he: "ב-events יש 5 מיליארד שורות. איך הופכים את זה לזול?" },
      a: { en: "Pre-aggregate a daily_active_users(user_id, day) table (one row per user per active day) incrementally, partition events by date and only scan from the earliest relevant signup. In a warehouse (BigQuery/Snowflake) cluster by event_date and user_id.", he: "מחזיקים טבלה מוכנה מראש daily_active_users(user_id, day) (שורה אחת לכל משתמש לכל יום פעיל) שמתעדכנת אינקרמנטלית, עושים partition ל-events לפי תאריך וסורקים רק מההרשמה הכי מוקדמת שרלוונטית. ב-warehouse (BigQuery/Snowflake) עושים cluster לפי event_date ו-user_id." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 9. Median and p95 latency per service                               */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-median-and-p95",
  icon: "⏱️",
  difficulty: "medium",
  tags: ["sql", "percentile", "ordered-set-aggregate", "latency"],
  title: { en: "SQL: Median and p95 Latency per Service", he: "SQL: Median ו-p95 של latency לכל service" },
  statement: {
    en: `<p>For each service, return the request count, the <strong>average</strong>, the <strong>median (p50)</strong> and the <strong>p95</strong> latency, using linear interpolation between ranks (rounded to 1 decimal). Then explain why the average is a bad SLO metric for this data.</p>
<pre>requests(service text, latency_ms int)

api:  12, 15, 11, 250, 14, 13, 18, 16, 900, 17
auth:  5,  7,  6,  40,  8</pre>`,
    he: `<p>לכל service, תחזיר את מספר ה-requests, את ה-latency ה<strong>ממוצע</strong>, את ה-<strong>median (p50)</strong> ואת ה-<strong>p95</strong>, עם אינטרפולציה לינארית בין הדירוגים (מעוגל לספרה אחת). אחר כך תסביר למה הממוצע הוא מדד SLO גרוע לנתונים האלה.</p>
<pre>requests(service text, latency_ms int)

api:  12, 15, 11, 250, 14, 13, 18, 16, 900, 17
auth:  5,  7,  6,  40,  8</pre>`
  },
  examples: `service | requests | avg_ms | p50_ms | p95_ms
--------+----------+--------+--------+-------
api     | 10       | 126.6  | 15.5   | 607.5
auth    | 5        | 13.2   | 7.0    | 33.6

# api sorted: 11 12 13 14 15 16 17 18 250 900
#   p50: position 0.5*(10-1) = 4.5  -> 15 + 0.5*(16-15)    = 15.5
#   p95: position 0.95*(10-1) = 8.55 -> 250 + 0.55*(900-250) = 607.5
# Nearest-rank (MySQL fallback below) gives api p50 = 15, p95 = 900; auth p50 = 7, p95 = 40`,
  hints: [
    { en: "Percentiles need the sorted values per group, which GROUP BY + a normal aggregate can't express. PostgreSQL has ordered-set aggregates for this.", he: "Percentiles צריכים את הערכים הממוינים בכל קבוצה, ו-GROUP BY עם aggregate רגיל לא יכול לבטא את זה. ל-PostgreSQL יש ordered-set aggregates בדיוק בשביל זה." },
    { en: "percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms). _cont interpolates; percentile_disc returns an actual value from the data.", he: "percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms). ה-_cont עושה אינטרפולציה; percentile_disc מחזיר ערך שבאמת קיים בנתונים." },
    { en: "Without percentile functions (MySQL): ROW_NUMBER and COUNT(*) over the service partition, then take the first value whose row number &gt;= CEIL(p * n).", he: "בלי פונקציות percentile (MySQL): ROW_NUMBER ו-COUNT(*) על ה-partition של ה-service, ואז לוקחים את הערך הראשון שמספר השורה שלו &gt;= CEIL(p * n)." }
  ],
  solution: String.raw`-- PostgreSQL: ordered-set aggregates
SELECT service,
       COUNT(*)                                                       AS requests,
       ROUND(AVG(latency_ms), 1)                                      AS avg_ms,
       ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 1) AS p50_ms,
       ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 1) AS p95_ms
       -- percentile_cont returns double precision; cast to numeric for ROUND(x, 1)
FROM requests
GROUP BY service
ORDER BY service;

-- Several percentiles in one sort:
--   percentile_cont(ARRAY[0.5, 0.95, 0.99]) WITHIN GROUP (ORDER BY latency_ms)

-- MySQL 8 has no percentile_cont: nearest-rank with window functions.
-- WITH r AS (
--     SELECT service, latency_ms,
--            ROW_NUMBER() OVER (PARTITION BY service ORDER BY latency_ms) AS rn,
--            COUNT(*)     OVER (PARTITION BY service)                     AS n
--     FROM requests
-- )
-- SELECT service,
--        MIN(CASE WHEN rn >= CEIL(0.50 * n) THEN latency_ms END) AS p50_ms,
--        MIN(CASE WHEN rn >= CEIL(0.95 * n) THEN latency_ms END) AS p95_ms
-- FROM r
-- GROUP BY service;`,
  explain: {
    en: `<p><code>percentile_cont(p) WITHIN GROUP (ORDER BY x)</code> sorts each group, computes the fractional position <code>p * (n - 1)</code> (0-based) and interpolates between the two neighbours. For api: position 8.55 lies between 250 (index 8) and 900 (index 9), so p95 = 250 + 0.55 × 650 = 607.5. <code>percentile_disc</code> instead returns the first actual value whose cumulative share reaches p (900 here).</p>
<p>The data shows why SLOs use percentiles. api's average is 126.6 ms, yet 8 of 10 requests finished under 20 ms and 1 in 10 took almost a second. The mean describes no real user. The median (15.5) says "typical is fast", and p95 (607.5) says "the tail is terrible": two different problems with two different fixes.</p>
<p>Know the limits: exact percentiles need every value sorted in memory per group, and they <strong>can't be averaged</strong>; the p95 of a day is not the average of 24 hourly p95s. That's why monitoring systems store histograms or sketches instead.</p>`,
    he: `<p><code>percentile_cont(p) WITHIN GROUP (ORDER BY x)</code> ממיין כל קבוצה, מחשב את המיקום השברי <code>p * (n - 1)</code> (מאינדקס 0) ועושה אינטרפולציה בין שני השכנים. ב-api: מיקום 8.55 נמצא בין 250 (אינדקס 8) ל-900 (אינדקס 9), אז p95 = 250 + 0.55 × 650 = 607.5. <code>percentile_disc</code> לעומת זאת מחזיר את הערך האמיתי הראשון שהחלק המצטבר שלו מגיע ל-p (כאן 900).</p>
<p>הנתונים מראים למה SLOs משתמשים ב-percentiles. הממוצע של api הוא 126.6 ms, אבל 8 מתוך 10 requests הסתיימו מתחת ל-20 ms ואחד מעשרה לקח כמעט שנייה. הממוצע לא מתאר אף משתמש אמיתי. ה-median (15.5) אומר "בדרך כלל מהיר", וה-p95 (607.5) אומר "ה-tail נוראי": שתי בעיות שונות עם שני פתרונות שונים.</p>
<p>כדאי להכיר את המגבלות: percentiles מדויקים צריכים את כל הערכים ממוינים בזיכרון לכל קבוצה, ו<strong>אי אפשר לעשות להם ממוצע</strong>; ה-p95 של יום הוא לא הממוצע של 24 ה-p95 השעתיים. בגלל זה מערכות monitoring שומרות histograms או sketches.</p>`
  },
  complexity: "Sort within each group: O(n log n) time, O(n) memory (all values of a group must be held)",
  whyInfra: {
    en: "This is the latency SLO query: p50/p95/p99 per service or endpoint from access logs in Athena/BigQuery/ClickHouse, post-incident tail-latency comparisons before vs after a deploy, and capacity sign-off (\"p99 stays under 300 ms at 2x load\"). Prometheus histogram_quantile() does the same interpolation over histogram buckets.",
    he: "זה ה-query של latency SLO: p50/p95/p99 לכל service או endpoint מתוך access logs ב-Athena, BigQuery או ClickHouse, השוואת tail latency לפני ואחרי deploy בתחקיר אחרי incident, ואישור capacity (\"ה-p99 נשאר מתחת ל-300 ms בעומס כפול\"). ב-Prometheus הפונקציה histogram_quantile() עושה את אותה אינטרפולציה על buckets של histogram."
  },
  followUps: [
    { q: { en: "The table has 10 billion rows per day. Exact percentiles are too slow. Options?", he: "בטבלה יש 10 מיליארד שורות ביום. percentiles מדויקים איטיים מדי. אפשרויות?" },
      a: { en: "Approximate sketches: approx_percentile (Athena/Trino), APPROX_QUANTILES (BigQuery), quantileTDigest (ClickHouse), or the tdigest/HLL-style extensions in PostgreSQL. Or store per-minute histograms (fixed buckets) and compute percentiles from merged buckets, which also makes them aggregatable over time.", he: "Sketches מקורבים: approx_percentile (Athena/Trino), APPROX_QUANTILES (BigQuery), quantileTDigest (ClickHouse), או הרחבות כמו tdigest ב-PostgreSQL. או לשמור histograms לכל דקה (buckets קבועים) ולחשב percentiles מ-buckets ממוזגים, מה שגם מאפשר לצבור אותם לאורך זמן." } },
    { q: { en: "What fraction of requests met a 300 ms SLO, per service?", he: "איזה אחוז מה-requests עמד ב-SLO של 300 ms, לכל service?" },
      a: { en: "That's the inverse question and it's cheaper and aggregatable: AVG((latency_ms &lt;= 300)::int) or COUNT(*) FILTER (WHERE latency_ms &lt;= 300) * 100.0 / COUNT(*). api = 90%, auth = 100%. SLOs are usually defined this way (good events / total events).", he: "זו השאלה ההפוכה, והיא זולה יותר ואפשר לצבור אותה: AVG((latency_ms &lt;= 300)::int) או COUNT(*) FILTER (WHERE latency_ms &lt;= 300) * 100.0 / COUNT(*). ב-api זה 90%, ב-auth זה 100%. בדרך כלל SLOs מוגדרים בדיוק ככה (good events חלקי total events)." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 10. Sessionize events (30-minute inactivity)                        */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "sql-sessionize-events",
  icon: "🧵",
  difficulty: "hard",
  tags: ["sql", "window-function", "lag", "sessionization", "running-sum"],
  title: { en: "SQL: Sessionize Events with a 30-Minute Inactivity Timeout", he: "SQL: חלוקת events ל-sessions לפי 30 דקות חוסר פעילות" },
  statement: {
    en: `<p>A new session starts on a user's first event, or when more than <strong>30 minutes</strong> passed since that user's previous event (exactly 30 minutes is still the same session). Return one row per session: <code>user_id, session_no</code> (1, 2, ... per user), start, end, number of events and duration in minutes.</p>
<pre>events(user_id int, ts timestamp)

 user_id | ts
---------+-----------------
       1 | 2026-07-01 09:00
       1 | 2026-07-01 09:10
       1 | 2026-07-01 09:35
       1 | 2026-07-01 10:20
       1 | 2026-07-01 10:30
       2 | 2026-07-01 09:00
       2 | 2026-07-01 09:30
       2 | 2026-07-01 10:01</pre>`,
    he: `<p>Session חדש מתחיל ב-event הראשון של משתמש, או כשעברו יותר מ-<strong>30 דקות</strong> מה-event הקודם של אותו משתמש (30 דקות בדיוק זה עדיין אותו session). תחזיר שורה לכל session: <code>user_id, session_no</code> (1, 2, ... לכל משתמש), התחלה, סוף, מספר events ומשך בדקות.</p>
<pre>events(user_id int, ts timestamp)

 user_id | ts
---------+-----------------
       1 | 2026-07-01 09:00
       1 | 2026-07-01 09:10
       1 | 2026-07-01 09:35
       1 | 2026-07-01 10:20
       1 | 2026-07-01 10:30
       2 | 2026-07-01 09:00
       2 | 2026-07-01 09:30
       2 | 2026-07-01 10:01</pre>`
  },
  examples: `user_id | session_no | session_start    | session_end      | events | minutes
--------+------------+------------------+------------------+--------+--------
      1 |          1 | 2026-07-01 09:00 | 2026-07-01 09:35 |      3 |      35   # gaps 10, 25
      1 |          2 | 2026-07-01 10:20 | 2026-07-01 10:30 |      2 |      10   # 45 min gap -> new
      2 |          1 | 2026-07-01 09:00 | 2026-07-01 09:30 |      2 |      30   # exactly 30 -> same
      2 |          2 | 2026-07-01 10:01 | 2026-07-01 10:01 |      1 |       0   # 31 min gap -> new`,
  hints: [
    { en: "Compare each event with the previous event of the same user. Which window function gives you that?", he: "תשווה כל event ל-event הקודם של אותו משתמש. איזו window function נותנת את זה?" },
    { en: "Turn the comparison into a flag: is_new = 1 if LAG(ts) is NULL or ts - LAG(ts) &gt; 30 minutes, else 0.", he: "תהפוך את ההשוואה ל-flag: is_new = 1 אם LAG(ts) הוא NULL או ts - LAG(ts) &gt; 30 דקות, אחרת 0." },
    { en: "A running SUM of is_new per user (ORDER BY ts) numbers the sessions 1, 1, 1, 2, 2. Then GROUP BY user_id, session_no.", he: "SUM מצטבר של is_new לכל משתמש (ORDER BY ts) ממספר את ה-sessions כך: 1, 1, 1, 2, 2. ואז GROUP BY user_id, session_no." }
  ],
  solution: String.raw`-- PostgreSQL
WITH flagged AS (
    SELECT user_id,
           ts,
           CASE
               WHEN LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL       THEN 1  -- first event
               WHEN ts - LAG(ts) OVER (PARTITION BY user_id ORDER BY ts)
                    > INTERVAL '30 minutes'                                         THEN 1  -- idle too long
               ELSE 0
           END AS is_new
    FROM events
),
numbered AS (
    SELECT user_id,
           ts,
           -- running count of session starts = session number
           SUM(is_new) OVER (PARTITION BY user_id ORDER BY ts
                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no
    FROM flagged
)
SELECT user_id,
       session_no,
       MIN(ts)                                          AS session_start,
       MAX(ts)                                          AS session_end,
       COUNT(*)                                         AS events,
       EXTRACT(EPOCH FROM MAX(ts) - MIN(ts))::int / 60  AS minutes
FROM numbered
GROUP BY user_id, session_no
ORDER BY user_id, session_no;

-- MySQL 8: TIMESTAMPDIFF(SECOND, LAG(ts) OVER w, ts) > 1800 for the gap,
--          TIMESTAMPDIFF(MINUTE, MIN(ts), MAX(ts)) for the duration.
-- ROWS (not the default RANGE) in the running SUM matters when two events share a ts:
-- with RANGE, peers are summed together and get the same, possibly wrong, number.`,
  explain: {
    en: `<p>Sessionization is "gaps and islands" where the gap is defined by time. Three steps, each a classic window pattern:</p>
<ol><li><strong>Detect boundaries</strong> with <code>LAG(ts)</code>: user 1's gaps are NULL, 10, 25, 45, 10 minutes, so <code>is_new</code> = 1, 0, 0, 1, 0.</li>
<li><strong>Number the islands</strong> with a running <code>SUM(is_new)</code>: 1, 1, 1, 2, 2. Every row now carries its session number.</li>
<li><strong>Aggregate</strong> per (user, session) for start, end, count and duration.</li></ol>
<p>Boundary rules are where interviews are won: user 2's 30-minute gap stays in the session because the condition is <code>&gt;</code>, not <code>&gt;=</code>; agree on this with the interviewer. A single-event session has duration 0, which is correct but worth mentioning (analytics tools often add the timeout or a fixed "last event dwell time").</p>`,
    he: `<p>Sessionization זה "gaps and islands" שבו ה-gap מוגדר לפי זמן. שלושה צעדים, כל אחד pattern קלאסי של window:</p>
<ol><li><strong>לזהות גבולות</strong> עם <code>LAG(ts)</code>: אצל משתמש 1 הפערים הם NULL, 10, 25, 45, 10 דקות, אז <code>is_new</code> = 1, 0, 0, 1, 0.</li>
<li><strong>למספר את האיים</strong> עם <code>SUM(is_new)</code> מצטבר: 1, 1, 1, 2, 2. עכשיו כל שורה נושאת את מספר ה-session שלה.</li>
<li><strong>לעשות aggregate</strong> לכל (user, session) בשביל התחלה, סוף, ספירה ומשך.</li></ol>
<p>חוקי הגבול זה המקום שבו מנצחים בראיון: הפער של 30 דקות אצל משתמש 2 נשאר באותו session כי התנאי הוא <code>&gt;</code> ולא <code>&gt;=</code>; תסגור את זה עם המראיין. ל-session עם event אחד יש משך 0, וזה נכון, אבל שווה להזכיר (כלי analytics מוסיפים לפעמים את ה-timeout או "זמן שהייה" קבוע ל-event האחרון).</p>`
  },
  complexity: "One sort by (user_id, ts) shared by both windows, then a GROUP BY: O(n log n); O(n) with an index on (user_id, ts)",
  whyInfra: {
    en: "Sessionizing is how you turn raw logs into units humans reason about: group a client IP's requests into sessions to spot scrapers or credential stuffing, group SSH/kubectl audit events into operator sessions for security reviews, merge flapping alert notifications into one incident, or group CI job events into pipeline runs. It's exactly what ELK, Datadog and web-analytics tools do behind the scenes.",
    he: "Sessionization זה איך הופכים לוגים גולמיים ליחידות שבני אדם חושבים בהן: לקבץ requests של IP מסוים ל-sessions כדי לזהות scrapers או credential stuffing, לקבץ audit events של SSH או kubectl ל-sessions של מפעיל בשביל סקירות security, לאחד התראות שעושות flapping ל-incident אחד, או לקבץ events של CI jobs להרצות pipeline. זה בדיוק מה ש-ELK, Datadog וכלי web analytics עושים מאחורי הקלעים."
  },
  followUps: [
    { q: { en: "Sessions must also end at midnight UTC, even if the user is still active.", he: "Sessions צריכים להיגמר גם בחצות UTC, גם אם המשתמש עדיין פעיל." },
      a: { en: "Add a second boundary condition: WHEN ts::date &lt;&gt; (LAG(ts) OVER w)::date THEN 1. Any number of rules (new device, logout event, campaign change) just OR into is_new; the running SUM stays the same.", he: "מוסיפים תנאי גבול שני: WHEN ts::date &lt;&gt; (LAG(ts) OVER w)::date THEN 1. אפשר להוסיף כמה חוקים שרוצים (מכשיר חדש, event של logout, שינוי campaign) עם OR לתוך is_new; ה-SUM המצטבר נשאר אותו דבר." } },
    { q: { en: "Events arrive as a live stream. How do you sessionize without re-running this over all history?", he: "ה-events מגיעים כ-stream חי. איך עושים sessionization בלי להריץ את זה מחדש על כל ההיסטוריה?" },
      a: { en: "Use a stream processor with session windows (Flink/Kafka Streams/Beam session windows with a 30-min gap), keyed by user_id, plus allowed lateness for out-of-order events. In batch, process only recent partitions and carry each user's last event and session number forward as state.", he: "משתמשים ב-stream processor עם session windows (ב-Flink, Kafka Streams או Beam, עם gap של 30 דקות) לפי user_id, ועוד allowed lateness בשביל events שמגיעים לא בסדר. ב-batch מעבדים רק partitions אחרונים ומעבירים את ה-event האחרון ומספר ה-session של כל משתמש הלאה כ-state." } }
  ]
});
