window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// Writing SQL: foundations & joins, window functions, CTEs & advanced SQL.
// Every query and result set below was executed (SQLite 3.45 for the portable parts),
// then shown in PostgreSQL shape (psql with \pset null NULL).
// Snippets shared by the English and Hebrew bodies live in P / W / C (scoped in an IIFE).
(function () {

/* ---------- Lesson 1: SQL foundations & joins ---------- */
const P = {
order: `written order:    SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT
evaluation order: FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`,
alias: `SELECT id, amount * 1.17 AS gross FROM orders WHERE gross &gt; 100;
ERROR:  column "gross" does not exist

-- fix: repeat the expression in WHERE (ORDER BY runs after SELECT, so the alias works there)
SELECT id, amount * 1.17 AS gross
FROM orders
WHERE amount * 1.17 &gt; 100
ORDER BY gross DESC;

 id  | gross
-----+--------
 103 | 234.00
 101 | 140.40
(2 rows)`,
data: `customers                    orders
 id | name  | city            id  | customer_id | amount | status
----+-------+-------         -----+-------------+--------+----------
  1 | Dana  | TLV             101 |           1 |    120 | paid
  2 | Avi   | Haifa           102 |           1 |     80 | paid
  3 | Noa   | TLV             103 |           2 |    200 | refunded
  4 | Yossi | NULL            104 |           5 |     50 | paid      -- customer 5 doesn't exist (legacy import, no FK)
                              105 |        NULL |     30 | paid      -- guest checkout

order_items                   employees
 order_id | sku | qty          id | name | manager_id
----------+-----+-----        ----+------+------------
      101 | A   |   1            1 | Rina |       NULL
      101 | B   |   2            2 | Omer |          1
      102 | A   |   1            3 | Tal  |          1
      103 | C   |   1            4 | Gil  |          2`,
inner: `SELECT c.name, o.id AS order_id, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id      -- JOIN = INNER JOIN
ORDER BY o.id;

 name | order_id | amount
------+----------+--------
 Dana |      101 |    120
 Dana |      102 |     80
 Avi  |      103 |    200
(3 rows)          -- Noa, Yossi (no orders) and orders 104, 105 (no customer) are gone`,
left: `SELECT c.name, o.id AS order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.id, o.id;

  name | order_id | amount
-------+----------+--------
 Dana  |      101 |    120
 Dana  |      102 |     80
 Avi   |      103 |    200
 Noa   |     NULL |   NULL
 Yossi |     NULL |   NULL
(5 rows)`,
leftTrap: `-- ❌ filter on the right table in WHERE: the NULL rows fail the test → silently an INNER JOIN
SELECT c.name, o.id AS order_id
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';

 name | order_id
------+----------
 Dana |      101
 Dana |      102
(2 rows)

-- ✅ move the condition into ON: it decides which orders match, every customer stays
SELECT c.name, o.id AS order_id
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
ORDER BY c.id, o.id;

  name | order_id
-------+----------
 Dana  |      101
 Dana  |      102
 Avi   |     NULL
 Noa   |     NULL
 Yossi |     NULL
(5 rows)`,
full: `SELECT c.name, o.id AS order_id
FROM customers c
FULL JOIN orders o ON o.customer_id = c.id
ORDER BY c.id, o.id;

  name | order_id
-------+----------
 Dana  |      101
 Dana  |      102
 Avi   |      103
 Noa   |     NULL      -- customer without orders (left side only)
 Yossi |     NULL
 NULL  |      104      -- orders without a customer (right side only)
 NULL  |      105
(7 rows)`,
crossSelf: `SELECT s.size, k.color FROM sizes s CROSS JOIN colors k;   -- 2 sizes × 2 colors

 size | color
------+-------
 S    | black
 S    | white
 M    | black
 M    | white
(4 rows)

-- self join: the same table twice, with two aliases
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;

 employee | manager
----------+---------
 Rina     | NULL
 Omer     | Rina
 Tal      | Rina
 Gil      | Omer
(4 rows)`,
anti: `-- customers who never ordered — three ways to write it
-- 1) LEFT JOIN … IS NULL
SELECT c.name FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- 2) NOT EXISTS (preferred)
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

  name
-------
 Noa
 Yossi
(2 rows)      -- both queries

-- 3) NOT IN — order 105 has customer_id NULL...
SELECT c.name FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM orders);

 name
------
(0 rows)      -- !!`,
notinWhy: `3 NOT IN (1, 2, 5, NULL)
= 3 &lt;&gt; 1 AND 3 &lt;&gt; 2 AND 3 &lt;&gt; 5 AND 3 &lt;&gt; NULL
= TRUE  AND TRUE  AND TRUE  AND NULL
= NULL   → not TRUE → row filtered out`,
semi: `-- ❌ JOIN to test existence: one row per matching order
SELECT c.name FROM customers c
JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';

 name
------
 Dana
 Dana
(2 rows)

-- ✅ semi-join: "is there at least one?" — each customer at most once, stops at the first match
SELECT c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.customer_id = c.id AND o.status = 'paid');

 name
------
 Dana
(1 row)`,
counts: `SELECT COUNT(*)                    AS all_rows,
       COUNT(customer_id)          AS with_customer,      -- skips NULLs
       COUNT(DISTINCT customer_id) AS distinct_customers
FROM orders;

 all_rows | with_customer | distinct_customers
----------+---------------+--------------------
        5 |             4 |                  3
(1 row)

SELECT status, COUNT(*) AS orders, SUM(amount) AS total
FROM orders
WHERE amount &gt;= 50            -- row filter, before grouping (drops order 105)
GROUP BY status
HAVING SUM(amount) &gt; 100;     -- group filter, after aggregation

  status  | orders | total
----------+--------+-------
 paid     |      3 |   250
 refunded |      1 |   200
(2 rows)`,
fanout: `-- ❌ revenue per customer, plus "number of items" — a second one-to-many join
SELECT c.name, SUM(o.amount) AS revenue, COUNT(i.sku) AS items
FROM customers c
JOIN orders o      ON o.customer_id = c.id
JOIN order_items i ON i.order_id = o.id
GROUP BY c.name ORDER BY c.name;

 name | revenue | items
------+---------+-------
 Avi  |     200 |     1
 Dana |     320 |     3       -- Dana really paid 200!
(2 rows)

-- why: the rows before GROUP BY — order 101 has 2 items, so its 120 appears twice
  id  | amount | sku
------+--------+-----
  101 |    120 | A
  101 |    120 | B
  102 |     80 | A

-- ✅ pre-aggregate the "many" side to one row per order, THEN join
WITH items AS (
  SELECT order_id, COUNT(*) AS items FROM order_items GROUP BY order_id
)
SELECT c.name, SUM(o.amount) AS revenue, SUM(COALESCE(i.items, 0)) AS items
FROM customers c
JOIN orders o     ON o.customer_id = c.id
LEFT JOIN items i ON i.order_id = o.id
GROUP BY c.name ORDER BY c.name;

 name | revenue | items
------+---------+-------
 Avi  |     200 |     1
 Dana |     200 |     3
(2 rows)`,
nulls: `SELECT NULL = NULL AS eq, NULL IS NULL AS is_null,
       (NULL = 1) OR TRUE AS or_true, (NULL = 1) AND FALSE AS and_false;

  eq  | is_null | or_true | and_false
------+---------+---------+-----------
 NULL | t       | t       | f
(1 row)

SELECT name FROM customers WHERE city &lt;&gt; 'TLV';

 name
------
 Avi
(1 row)       -- Yossi (city NULL) vanished: NULL &lt;&gt; 'TLV' is NULL, not TRUE

SELECT name FROM customers WHERE city IS DISTINCT FROM 'TLV';   -- NULL-safe

  name
-------
 Avi
 Yossi
(2 rows)`,
caseCoalesce: `SELECT name,
       COALESCE(city, 'unknown') AS city,                -- first non-NULL argument
       CASE WHEN city = 'TLV'  THEN 'center'
            WHEN city IS NULL  THEN 'n/a'
            ELSE 'north' END   AS region
FROM customers ORDER BY id;

  name  |  city   | region
--------+---------+--------
 Dana   | TLV     | center
 Avi    | Haifa   | north
 Noa    | TLV     | center
 Yossi  | unknown | n/a
(4 rows)`,
union: `SELECT city FROM customers WHERE id &lt;= 2       -- TLV, Haifa
UNION ALL
SELECT city FROM customers WHERE id IN (1, 3);  -- TLV, TLV

 city
-------
 TLV
 Haifa
 TLV
 TLV
(4 rows)      -- UNION ALL: just appends

-- UNION (… ORDER BY city): removes duplicates = an extra sort/hash over everything
 city
-------
 Haifa
 TLV
(2 rows)`,
upsert: `CREATE TABLE inventory (sku text PRIMARY KEY, qty int NOT NULL);
INSERT INTO inventory VALUES ('A', 10);

INSERT INTO inventory (sku, qty) VALUES ('A', 5), ('B', 3)
ON CONFLICT (sku) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty;
-- EXCLUDED = the row you tried to insert

SELECT * FROM inventory ORDER BY sku;
 sku | qty
-----+-----
 A   |  15
 B   |   3
(2 rows)`,
updFrom: `-- set qty from a staging table (Postgres / SQLite syntax)
UPDATE inventory AS inv
SET    qty = st.new_qty
FROM   stock_count st              -- rows: ('B', 7), ('Z', 1)
WHERE  st.sku = inv.sku;
UPDATE 1                           -- 'Z' has no inventory row → nothing happens

 sku | qty
-----+-----
 A   |  15
 B   |   7

-- MySQL:      UPDATE inventory inv JOIN stock_count st ON st.sku = inv.sku SET inv.qty = st.new_qty;
-- SQL Server: UPDATE inv SET qty = st.new_qty FROM inventory inv JOIN stock_count st ON st.sku = inv.sku;`,
del: `BEGIN;
DELETE FROM orders
WHERE customer_id IS NULL
   OR customer_id NOT IN (SELECT id FROM customers)   -- safe here: customers.id is a NOT NULL PK
RETURNING id, customer_id;

 id  | customer_id
-----+-------------
 104 |           5
 105 |        NULL
(2 rows)
DELETE 2

-- expected 2? → COMMIT;   expected 2 and got 2,000,000? → ROLLBACK;
ROLLBACK;`
};

INFRA.lessons.push({
  id: "sql-basics-joins",
  track: "data",
  order: 70,
  icon: "🧮",
  level: 1,
  minutes: 18,
  title: { en: "SQL Foundations & Joins", he: "יסודות SQL ו-joins" },
  tldr: {
    en: "SQL runs FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT, so think in rows: a join multiplies rows, NULL is 'unknown' (not a value), and every write you can't undo goes inside BEGIN … RETURNING … COMMIT.",
    he: "SQL רץ בסדר FROM ← WHERE ← GROUP BY ← HAVING ← SELECT ← ORDER BY ← LIMIT, אז תחשוב ב-rows: join מכפיל rows, NULL הוא 'לא ידוע' (לא ערך), וכל כתיבה שאי אפשר לבטל נכנסת בתוך BEGIN … RETURNING … COMMIT."
  },
  analogy: {
    en: "A join is a wedding seating chart. INNER JOIN seats only guests who RSVP'd and have a table; LEFT JOIN seats every guest even if their table number is missing (they get a folding chair called NULL). And if one guest appears on three family lists, they get three chairs — that's join fan-out, and your headcount (SUM) is now wrong.",
    he: "join זה סידור הושבה בחתונה. INNER JOIN מושיב רק אורחים שאישרו הגעה ויש להם שולחן; LEFT JOIN מושיב כל אורח, גם אם אין לו מספר שולחן (הוא מקבל כיסא מתקפל שקוראים לו NULL). ואם אורח אחד מופיע בשלוש רשימות משפחתיות, הוא מקבל שלושה כיסאות — זה join fan-out, וספירת המוזמנים (SUM) שלך כבר לא נכונה."
  },
  sections: [
    {
      h: { en: "The order SQL really runs in (and why your alias fails in WHERE)", he: "הסדר שבו SQL באמת רץ (ולמה ה-alias נכשל ב-WHERE)" },
      body: {
        en: `<p>You write <code>SELECT</code> first, but the database evaluates it almost last:</p>
<pre>${P.order}</pre>
<p>Consequences you hit every week:</p>
<ul><li>A column alias defined in <code>SELECT</code> doesn't exist yet in <code>WHERE</code>, <code>GROUP BY</code> (standard) or <code>HAVING</code>. It does exist in <code>ORDER BY</code>.</li>
<li>Aggregates can't go in <code>WHERE</code> (<code>ERROR: aggregate functions are not allowed in WHERE</code>) — rows are filtered before groups exist. Filter groups in <code>HAVING</code>.</li>
<li><code>LIMIT</code> comes after <code>ORDER BY</code>: without an <code>ORDER BY</code>, "the first 10 rows" is whatever the plan produced — it can change after a VACUUM or a new index.</li></ul>
<pre>${P.alias}</pre>
<p>Dialect notes: Postgres also allows an output alias in <code>GROUP BY</code> (an extension); MySQL allows aliases in <code>GROUP BY</code> and <code>HAVING</code>; SQLite even allows them in <code>WHERE</code> — so a query that "works locally" can fail in Postgres. The portable fix for a complex expression is a subquery or CTE that computes it once.</p>
<p>The sample tables used in the rest of this lesson (note the traps on purpose: Yossi has no city, order 104 points to a customer that doesn't exist, order 105 has no customer at all):</p>
<pre>${P.data}</pre>`,
        he: `<p>אתה כותב <code>SELECT</code> ראשון, אבל ה-DB מחשב אותו כמעט אחרון:</p>
<pre>${P.order}</pre>
<p>ההשלכות שתיתקל בהן כל שבוע:</p>
<ul><li>alias שהגדרת ב-<code>SELECT</code> עדיין לא קיים ב-<code>WHERE</code>, ב-<code>GROUP BY</code> (לפי התקן) או ב-<code>HAVING</code>. ב-<code>ORDER BY</code> הוא כן קיים.</li>
<li>אי אפשר לשים aggregate ב-<code>WHERE</code> (<code>ERROR: aggregate functions are not allowed in WHERE</code>) — ה-rows מסוננים לפני שהקבוצות קיימות. מסננים קבוצות ב-<code>HAVING</code>.</li>
<li><code>LIMIT</code> מגיע אחרי <code>ORDER BY</code>: בלי <code>ORDER BY</code>, "10 השורות הראשונות" הן מה שה-plan במקרה החזיר — וזה יכול להשתנות אחרי VACUUM או אינדקס חדש.</li></ul>
<pre>${P.alias}</pre>
<p>הבדלים בין dialects: Postgres מרשה גם alias ב-<code>GROUP BY</code> (הרחבה); MySQL מרשה aliases ב-<code>GROUP BY</code> וב-<code>HAVING</code>; SQLite מרשה אותם אפילו ב-<code>WHERE</code> — כך ש-query ש"עובד אצלי" יכול להיכשל ב-Postgres. הפתרון הנייד לביטוי מסובך הוא subquery או CTE שמחשב אותו פעם אחת.</p>
<p>טבלאות הדוגמה לשאר השיעור (המלכודות בכוונה: ליוסי אין עיר, הזמנה 104 מצביעה על לקוח שלא קיים, ולהזמנה 105 אין לקוח בכלל):</p>
<pre>${P.data}</pre>`
      }
    },
    {
      h: { en: "Joins, row by row (no Venn diagrams)", he: "joins, שורה אחרי שורה (בלי דיאגרמות ון)" },
      body: {
        en: `<p>Mental model: a join pairs every row on the left with every row on the right that satisfies <code>ON</code>. One customer with two orders → two output rows. That's all there is; the join types only differ in what happens to rows that found <strong>no</strong> partner.</p>
<pre>${P.inner}</pre>
<p><strong>LEFT JOIN</strong> keeps every left row; where no partner exists the right-side columns are NULL:</p>
<pre>${P.left}</pre>
<p>The #1 LEFT JOIN bug — a <code>WHERE</code> on the right table turns it back into an inner join:</p>
<pre>${P.leftTrap}</pre>
<p><strong>RIGHT JOIN</strong> is a LEFT JOIN with the tables swapped (most teams just write LEFT and reorder). <strong>FULL JOIN</strong> keeps unmatched rows from both sides — perfect for reconciliation ("what's in system A but not B, and vice versa"). MySQL has no FULL JOIN: emulate with LEFT JOIN UNION ALL (RIGHT JOIN … WHERE left.id IS NULL).</p>
<pre>${P.full}</pre>
<p><strong>CROSS JOIN</strong> = every combination (no ON). Useful for generating grids (sizes × colors, days × products). A join with a forgotten or always-true ON condition is an <em>accidental</em> cross join: 10k × 10k = 100M rows. <strong>Self join</strong> = same table, two aliases:</p>
<pre>${P.crossSelf}</pre>`,
        he: `<p>המודל המנטלי: join מצמיד כל row משמאל לכל row מימין שמקיים את ה-<code>ON</code>. לקוח אחד עם שתי הזמנות ← שני rows בפלט. זה הכול; סוגי ה-join נבדלים רק במה שקורה ל-rows שלא מצאו <strong>אף</strong> בן זוג.</p>
<pre>${P.inner}</pre>
<p><strong>LEFT JOIN</strong> שומר כל row משמאל; כשאין בן זוג, העמודות של הצד הימני הן NULL:</p>
<pre>${P.left}</pre>
<p>הבאג מספר 1 של LEFT JOIN — תנאי ב-<code>WHERE</code> על הטבלה הימנית הופך אותו בחזרה ל-inner join:</p>
<pre>${P.leftTrap}</pre>
<p><strong>RIGHT JOIN</strong> הוא LEFT JOIN עם הטבלאות הפוכות (רוב הצוותים פשוט כותבים LEFT ומחליפים סדר). <strong>FULL JOIN</strong> שומר rows בלי התאמה משני הצדדים — מושלם ל-reconciliation ("מה יש במערכת A ואין ב-B, ולהפך"). ב-MySQL אין FULL JOIN: מחקים עם LEFT JOIN UNION ALL (RIGHT JOIN … WHERE left.id IS NULL).</p>
<pre>${P.full}</pre>
<p><strong>CROSS JOIN</strong> = כל הצירופים (בלי ON). שימושי לייצור גריד (מידות × צבעים, ימים × מוצרים). join עם ON שנשכח או שתמיד TRUE הוא cross join <em>בטעות</em>: 10k × 10k = 100M rows. <strong>Self join</strong> = אותה טבלה, שני aliases:</p>
<pre>${P.crossSelf}</pre>`
      }
    },
    {
      h: { en: "Anti-joins and semi-joins: \"has no …\" and \"has at least one …\"", he: "anti-join ו-semi-join: \"אין לו …\" ו\"יש לו לפחות …\"" },
      body: {
        en: `<p>Half of real-world questions are existence questions: users who never logged in, orders without a shipment, customers who bought at least once. Don't use a plain JOIN for them.</p>
<pre>${P.anti}</pre>
<p>Why NOT IN returned nothing: <code>x NOT IN (list)</code> expands to a chain of <code>&lt;&gt;</code> ANDed together, and a single NULL in the list makes the whole thing NULL for every row:</p>
<pre>${P.notinWhy}</pre>
<blockquote>⚠️ Production tip: never use <code>NOT IN (subquery)</code> unless the subquery column is <code>NOT NULL</code>. Use <code>NOT EXISTS</code> — it's NULL-safe, and Postgres plans it as a real <em>Hash Anti Join</em>, while <code>NOT IN</code> over a large subquery can fall back to a per-row scan of a hashed or even un-hashed subplan.</blockquote>
<p>The mirror image is the <strong>semi-join</strong>: "customers with at least one paid order". A JOIN returns a customer once per matching order (and then someone "fixes" it with DISTINCT, which costs a sort). <code>EXISTS</code> returns each left row at most once and can stop at the first match:</p>
<pre>${P.semi}</pre>
<blockquote>💡 Real world: <code>IN (subquery)</code> is also a semi-join and is fine (NULLs don't hurt IN, only NOT IN). Modern planners turn <code>IN</code> and <code>EXISTS</code> into the same plan — pick whichever reads better, but never a JOIN + DISTINCT.</blockquote>`,
        he: `<p>חצי מהשאלות בעולם האמיתי הן שאלות קיום: משתמשים שאף פעם לא התחברו, הזמנות בלי משלוח, לקוחות שקנו לפחות פעם אחת. אל תשתמש בשבילן ב-JOIN רגיל.</p>
<pre>${P.anti}</pre>
<p>למה NOT IN החזיר כלום: <code>x NOT IN (list)</code> נפתח לשרשרת של <code>&lt;&gt;</code> עם AND ביניהם, ו-NULL אחד ברשימה הופך את כל הביטוי ל-NULL עבור כל row:</p>
<pre>${P.notinWhy}</pre>
<blockquote>⚠️ Production tip: אף פעם אל תשתמש ב-<code>NOT IN (subquery)</code> אלא אם עמודת ה-subquery היא <code>NOT NULL</code>. תשתמש ב-<code>NOT EXISTS</code> — הוא NULL-safe, ו-Postgres מתכנן אותו כ-<em>Hash Anti Join</em> אמיתי, בזמן ש-<code>NOT IN</code> על subquery גדול יכול ליפול לסריקה לכל row מול subplan עם hash, או אפילו בלעדיו.</blockquote>
<p>תמונת המראה היא <strong>semi-join</strong>: "לקוחות עם לפחות הזמנה ששולמה אחת". JOIN מחזיר לקוח פעם אחת לכל הזמנה מתאימה (ואז מישהו "מתקן" עם DISTINCT, שעולה sort). <code>EXISTS</code> מחזיר כל row משמאל לכל היותר פעם אחת ויכול לעצור בהתאמה הראשונה:</p>
<pre>${P.semi}</pre>
<blockquote>💡 Real world: גם <code>IN (subquery)</code> הוא semi-join והוא בסדר (NULL-ים לא מזיקים ל-IN, רק ל-NOT IN). planners מודרניים הופכים את <code>IN</code> ואת <code>EXISTS</code> לאותו plan — תבחר מה שקריא יותר, אבל אף פעם לא JOIN + DISTINCT.</blockquote>`
      }
    },
    {
      h: { en: "Aggregation: GROUP BY, HAVING, COUNT — and the fan-out bug", he: "אגרגציה: GROUP BY, HAVING, COUNT — ובאג ה-fan-out" },
      body: {
        en: `<p><code>COUNT(*)</code> counts rows; <code>COUNT(col)</code> counts non-NULL values of col; <code>COUNT(DISTINCT col)</code> counts distinct non-NULL values. <code>SUM</code>/<code>AVG</code> also skip NULLs, and <code>SUM</code> of zero rows is NULL, not 0 (wrap in <code>COALESCE(SUM(x), 0)</code>).</p>
<pre>${P.counts}</pre>
<p>Every column in <code>SELECT</code> must be either in <code>GROUP BY</code> or inside an aggregate. Postgres allows other columns of a table if you grouped by its primary key; old MySQL (without <code>ONLY_FULL_GROUP_BY</code>) silently returned a random value — a classic source of wrong reports.</p>
<p><strong>Join fan-out</strong> is the most expensive SQL bug in analytics because it doesn't fail — it returns a plausible, bigger number. Joining two one-to-many relationships multiplies the "one" side's rows, and any SUM over a "one"-side column is counted once per child:</p>
<pre>${P.fanout}</pre>
<p>The rule: <strong>know the grain</strong> (what one row means) of every input. Aggregate each "many" side to the grain you join on before joining. Quick detector: <code>SELECT COUNT(*), COUNT(DISTINCT o.id)</code> on the joined result — if they differ, any SUM over order columns is inflated.</p>
<blockquote>⚠️ Production tip: <code>SUM(DISTINCT o.amount)</code> is not a fix — two different orders of ₪99.90 collapse into one and you now under-count. Pre-aggregate instead.</blockquote>`,
        he: `<p><code>COUNT(*)</code> סופר rows; <code>COUNT(col)</code> סופר ערכים שאינם NULL ב-col; <code>COUNT(DISTINCT col)</code> סופר ערכים שונים שאינם NULL. גם <code>SUM</code> ו-<code>AVG</code> מדלגים על NULL, ו-<code>SUM</code> של אפס rows הוא NULL, לא 0 (עוטפים ב-<code>COALESCE(SUM(x), 0)</code>).</p>
<pre>${P.counts}</pre>
<p>כל עמודה ב-<code>SELECT</code> חייבת להיות ב-<code>GROUP BY</code> או בתוך aggregate. Postgres מרשה עמודות אחרות של טבלה אם עשית group לפי ה-primary key שלה; MySQL ישן (בלי <code>ONLY_FULL_GROUP_BY</code>) החזיר בשקט ערך אקראי — מקור קלאסי לדוחות שגויים.</p>
<p><strong>Join fan-out</strong> הוא באג ה-SQL הכי יקר באנליטיקה, כי הוא לא נכשל — הוא מחזיר מספר סביר ופשוט גדול יותר. join של שני קשרי one-to-many מכפיל את ה-rows של צד ה-"one", וכל SUM על עמודה מצד ה-"one" נספר פעם אחת לכל ילד:</p>
<pre>${P.fanout}</pre>
<p>הכלל: <strong>תדע מה ה-grain</strong> (מה row אחד מייצג) של כל קלט. תאגרג כל צד "many" ל-grain שעליו אתה עושה join, ורק אז תעשה join. גלאי מהיר: <code>SELECT COUNT(*), COUNT(DISTINCT o.id)</code> על התוצאה המחוברת — אם הם שונים, כל SUM על עמודות של orders מנופח.</p>
<blockquote>⚠️ Production tip: <code>SUM(DISTINCT o.amount)</code> הוא לא תיקון — שתי הזמנות שונות של ₪99.90 מתמזגות לאחת ועכשיו אתה סופר פחות מדי. תעשה pre-aggregation במקום.</blockquote>`
      }
    },
    {
      h: { en: "NULL logic, CASE, COALESCE, UNION", he: "הלוגיקה של NULL, CASE, COALESCE, UNION" },
      body: {
        en: `<p>NULL means "unknown". Any comparison with unknown is unknown (NULL), and <code>WHERE</code> keeps only rows where the condition is <strong>TRUE</strong> — FALSE and NULL are both dropped. That's three-valued logic:</p>
<pre>${P.nulls}</pre>
<p><code>IS DISTINCT FROM</code> is standard SQL (Postgres, SQL Server 2022+); MySQL spells it <code>NOT (city &lt;=&gt; 'TLV')</code>. Other NULL gotchas: <code>NULL + 1</code> is NULL; <code>'a' || NULL</code> is NULL in Postgres (use <code>concat()</code>, which skips NULLs); a <code>UNIQUE</code> column allows many NULLs (Postgres 15+: <code>UNIQUE NULLS NOT DISTINCT</code>).</p>
<pre>${P.caseCoalesce}</pre>
<p><code>CASE</code> is evaluated top-down and stops at the first match; without <code>ELSE</code> it returns NULL. Inside an aggregate it becomes a conditional count — <code>SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)</code> — the portable form of a pivot (more in the CTE lesson).</p>
<pre>${P.union}</pre>
<blockquote>💡 Real world: default to <code>UNION ALL</code>. Use <code>UNION</code> only when you actually need dedup — on millions of rows that hidden sort/hash can spill to disk. Both sides must have the same number of columns with compatible types, matched by <em>position</em>, not by name.</blockquote>`,
        he: `<p>NULL פירושו "לא ידוע". כל השוואה מול לא-ידוע היא לא-ידועה (NULL), ו-<code>WHERE</code> שומר רק rows שבהם התנאי <strong>TRUE</strong> — FALSE ו-NULL שניהם נזרקים. זו לוגיקה תלת-ערכית:</p>
<pre>${P.nulls}</pre>
<p><code>IS DISTINCT FROM</code> הוא SQL תקני (Postgres, SQL Server 2022+); ב-MySQL כותבים <code>NOT (city &lt;=&gt; 'TLV')</code>. עוד מלכודות NULL: <code>NULL + 1</code> הוא NULL; <code>'a' || NULL</code> הוא NULL ב-Postgres (תשתמש ב-<code>concat()</code>, שמדלג על NULL); עמודה עם <code>UNIQUE</code> מרשה הרבה NULL-ים (מ-Postgres 15: <code>UNIQUE NULLS NOT DISTINCT</code>).</p>
<pre>${P.caseCoalesce}</pre>
<p><code>CASE</code> נבדק מלמעלה למטה ועוצר בהתאמה הראשונה; בלי <code>ELSE</code> הוא מחזיר NULL. בתוך aggregate הוא הופך לספירה מותנית — <code>SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)</code> — הצורה הניידת של pivot (עוד על זה בשיעור על CTE).</p>
<pre>${P.union}</pre>
<blockquote>💡 Real world: ברירת המחדל היא <code>UNION ALL</code>. תשתמש ב-<code>UNION</code> רק כשבאמת צריך dedup — על מיליוני rows ה-sort או ה-hash הנסתר הזה יכול לגלוש לדיסק. לשני הצדדים חייב להיות אותו מספר עמודות עם טיפוסים תואמים, והן מותאמות לפי <em>מיקום</em>, לא לפי שם.</blockquote>`
      }
    },
    {
      h: { en: "Changing data safely: upsert, UPDATE … FROM, DELETE in a transaction", he: "לשנות נתונים בבטחה: upsert, UPDATE … FROM, DELETE בתוך טרנזקציה" },
      body: {
        en: `<p><strong>Upsert</strong> — insert, or update if the key already exists — in one atomic statement. It needs a unique index or constraint on the conflict columns:</p>
<pre>${P.upsert}</pre>
<p><code>ON CONFLICT DO NOTHING</code> is the idempotent-insert workhorse (event dedup, "create if missing"). MySQL: <code>INSERT … ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)</code>; SQL Server and Postgres 15+: <code>MERGE</code>. Never do "SELECT, then INSERT if not found" in app code — two concurrent requests both see "not found".</p>
<p><strong>UPDATE … FROM</strong> updates rows using another table. The dialects really differ here:</p>
<pre>${P.updFrom}</pre>
<blockquote>⚠️ Production tip: if the FROM table has two rows for the same key, Postgres updates the target with one of them, arbitrarily, and doesn't warn. Make sure the source is unique on the join key (pre-aggregate or <code>DISTINCT ON</code>).</blockquote>
<p><strong>DELETE / UPDATE on production</strong>: open a transaction, use <code>RETURNING</code> (or check the row count), then decide:</p>
<pre>${P.del}</pre>
<blockquote>💡 Real world: run the <code>WHERE</code> as a <code>SELECT COUNT(*)</code> first, set <code>SET lock_timeout = '3s'</code> so you don't queue behind a long transaction, and delete millions of rows in batches (<code>… WHERE id IN (SELECT id … LIMIT 5000)</code> in a loop) to keep locks short and replicas caught up. In psql, <code>\set AUTOCOMMIT off</code> makes every statement wait for COMMIT.</blockquote>`,
        he: `<p><strong>Upsert</strong> — להכניס, או לעדכן אם המפתח כבר קיים — ב-statement אטומי אחד. צריך unique index או constraint על עמודות הקונפליקט:</p>
<pre>${P.upsert}</pre>
<p><code>ON CONFLICT DO NOTHING</code> הוא סוס העבודה של insert אידמפוטנטי (dedup לאירועים, "צור אם לא קיים"). ב-MySQL: <code>INSERT … ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)</code>; ב-SQL Server וב-Postgres 15+: <code>MERGE</code>. אף פעם אל תעשה בקוד "SELECT, ואם לא נמצא אז INSERT" — שתי בקשות במקביל יראו שתיהן "לא נמצא".</p>
<p><strong>UPDATE … FROM</strong> מעדכן rows לפי טבלה אחרת. כאן ה-dialects באמת שונים:</p>
<pre>${P.updFrom}</pre>
<blockquote>⚠️ Production tip: אם בטבלת ה-FROM יש שני rows לאותו מפתח, Postgres מעדכן את היעד לפי אחד מהם, שרירותית, ולא מזהיר. תוודא שהמקור ייחודי על מפתח ה-join (pre-aggregation או <code>DISTINCT ON</code>).</blockquote>
<p><strong>DELETE / UPDATE על production</strong>: פותחים טרנזקציה, משתמשים ב-<code>RETURNING</code> (או בודקים את מספר ה-rows), ורק אז מחליטים:</p>
<pre>${P.del}</pre>
<blockquote>💡 Real world: תריץ קודם את ה-<code>WHERE</code> כ-<code>SELECT COUNT(*)</code>, תגדיר <code>SET lock_timeout = '3s'</code> כדי לא לעמוד בתור מאחורי טרנזקציה ארוכה, ותמחק מיליוני rows ב-batches (<code>… WHERE id IN (SELECT id … LIMIT 5000)</code> בלולאה) כדי שה-locks יהיו קצרים וה-replicas לא יפגרו. ב-psql, <code>\set AUTOCOMMIT off</code> גורם לכל statement לחכות ל-COMMIT.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: "docker run -d --name pg -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres:17 && docker exec -it pg psql -U postgres", what: { en: "Spin up a throwaway Postgres and open psql. Run \\pset null NULL so NULLs are visible.", he: "מרים Postgres זמני ופותח psql. תריץ \\pset null NULL כדי שה-NULL-ים יהיו גלויים." } },
    { cmd: "SELECT COUNT(*), COUNT(DISTINCT o.id) FROM orders o JOIN order_items i ON i.order_id = o.id;", what: { en: "The fan-out detector: if the two numbers differ, any SUM over order columns on this join is inflated.", he: "הגלאי של fan-out: אם שני המספרים שונים, כל SUM על עמודות של orders ב-join הזה מנופח." } },
    { cmd: "SELECT 3 NOT IN (1, 2, NULL), 3 IN (1, 2, NULL), NULL = NULL, NULL IS DISTINCT FROM NULL;", what: { en: "See three-valued logic with your own eyes: NULL, NULL, NULL, f.", he: "תראה לוגיקה תלת-ערכית בעיניים: NULL, NULL, NULL, f." } },
    { cmd: "BEGIN; DELETE FROM orders WHERE created_at < now() - interval '2 years' RETURNING id; ROLLBACK;", what: { en: "Rehearse a destructive statement: see exactly which rows it hits, then undo.", he: "חזרה גנרלית על פקודה הרסנית: רואים בדיוק אילו rows היא תופסת, ואז מבטלים." } }
  ],
  mnemonic: {
    en: "\"Fred Wears Green Hats, So Others Lie\": FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. And: joins multiply, NULL infects, NOT IN lies.",
    he: "FROM ← WHERE ← GROUP ← HAVING ← SELECT ← ORDER ← LIMIT: קודם בוחרים טבלאות, אחר כך rows, אחר כך קבוצות, ורק בסוף עמודות. וגם: join מכפיל, NULL מדביק, NOT IN משקר."
  },
  pitfalls: [
    { en: "Filtering the right-hand table of a LEFT JOIN in WHERE — it silently becomes an INNER JOIN. Put the condition in ON (or test IS NULL deliberately).", he: "סינון של הטבלה הימנית של LEFT JOIN ב-WHERE — הוא הופך בשקט ל-INNER JOIN. תשים את התנאי ב-ON (או תבדוק IS NULL בכוונה)." },
    { en: "NOT IN (subquery) when the subquery can return NULL: the query returns zero rows and nobody notices. Use NOT EXISTS.", he: "NOT IN (subquery) כשה-subquery יכול להחזיר NULL: ה-query מחזיר אפס rows ואף אחד לא שם לב. תשתמש ב-NOT EXISTS." },
    { en: "Summing a parent column after joining two child tables (fan-out). The total is plausible and wrong. Pre-aggregate children to the parent's grain first.", he: "SUM על עמודה של ההורה אחרי join לשתי טבלאות ילדים (fan-out). הסכום נראה סביר והוא שגוי. קודם תאגרג את הילדים ל-grain של ההורה." },
    { en: "Running UPDATE/DELETE on production in autocommit mode without first checking the row count. Wrap it in BEGIN … RETURNING … and COMMIT only when the count matches.", he: "להריץ UPDATE או DELETE על production ב-autocommit בלי לבדוק קודם את מספר ה-rows. עוטפים ב-BEGIN … RETURNING … ועושים COMMIT רק כשהמספר מתאים." }
  ],
  interview: [
    { q: { en: "What's the difference between WHERE and HAVING? Can you use a SELECT alias in each?", he: "מה ההבדל בין WHERE ל-HAVING? אפשר להשתמש ב-alias מה-SELECT בכל אחד מהם?" },
      a: { en: "WHERE filters rows before GROUP BY; HAVING filters groups after aggregation, so only HAVING can reference aggregates. SELECT is evaluated after both, so standard SQL (and Postgres) doesn't allow SELECT aliases in either; MySQL allows them in HAVING. ORDER BY runs after SELECT, so aliases work there. Prefer WHERE when possible — it shrinks the data before the expensive grouping.", he: "WHERE מסנן rows לפני GROUP BY; HAVING מסנן קבוצות אחרי האגרגציה, ולכן רק HAVING יכול להתייחס ל-aggregates. ה-SELECT מחושב אחרי שניהם, אז SQL תקני (ו-Postgres) לא מרשה aliases מה-SELECT באף אחד מהם; MySQL מרשה ב-HAVING. ORDER BY רץ אחרי SELECT, ולכן שם aliases עובדים. כשאפשר עדיף WHERE — הוא מקטין את הנתונים לפני ה-grouping היקר." } },
    { q: { en: "Find customers with no orders. Give two ways and explain which you'd ship.", he: "תמצא לקוחות בלי הזמנות. תן שתי דרכים ותסביר איזו היית מכניס ל-production." },
      a: { en: "LEFT JOIN orders … WHERE orders.id IS NULL, or WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = c.id). I'd ship NOT EXISTS: it states intent, is NULL-safe and plans as a hash/merge anti-join. I would not use NOT IN because a single NULL customer_id in orders makes it return zero rows.", he: "LEFT JOIN orders … WHERE orders.id IS NULL, או WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = c.id). הייתי מכניס NOT EXISTS: הוא מבטא את הכוונה, NULL-safe ומתוכנן כ-anti-join מסוג hash או merge. לא הייתי משתמש ב-NOT IN, כי customer_id אחד שהוא NULL ב-orders גורם לו להחזיר אפס rows." } },
    { q: { en: "A report's revenue doubled after someone added a join. What happened and how do you fix it?", he: "ההכנסות בדוח הוכפלו אחרי שמישהו הוסיף join. מה קרה ואיך מתקנים?" },
      a: { en: "Join fan-out: the new table is one-to-many to orders, so each order row is repeated per child and SUM(amount) counts it multiple times. Confirm with COUNT(*) vs COUNT(DISTINCT order_id). Fix by aggregating the child table to one row per order in a CTE/subquery before joining, not with SUM(DISTINCT), which merges equal amounts from different orders.", he: "Join fan-out: הטבלה החדשה היא one-to-many מול orders, אז כל row של הזמנה משוכפל לכל ילד ו-SUM(amount) סופר אותו כמה פעמים. מאמתים עם COUNT(*) מול COUNT(DISTINCT order_id). מתקנים באגרגציה של טבלת הילדים ל-row אחד לכל הזמנה ב-CTE או subquery לפני ה-join, ולא עם SUM(DISTINCT), שממזג סכומים שווים של הזמנות שונות." } }
  ],
  quiz: [
    { q: { en: "orders.customer_id contains one NULL. What does SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) return?", he: "ב-orders.customer_id יש NULL אחד. מה מחזיר SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)?" },
      options: [
        { en: "Customers without orders", he: "לקוחות בלי הזמנות" },
        { en: "Zero rows", he: "אפס rows" },
        { en: "All customers", he: "כל הלקוחות" },
        { en: "An error", he: "שגיאה" }
      ], answer: 1,
      explain: { en: "id NOT IN (…, NULL) contains id <> NULL, which is NULL, so the AND chain is never TRUE and every row is filtered out. Use NOT EXISTS.", he: "id NOT IN (…, NULL) כולל id <> NULL, שהוא NULL, אז שרשרת ה-AND אף פעם לא TRUE וכל row מסונן. תשתמש ב-NOT EXISTS." } },
    { q: { en: "You LEFT JOIN customers to orders and add WHERE orders.status = 'paid'. What happens to customers with no orders?", he: "עשית LEFT JOIN מ-customers ל-orders והוספת WHERE orders.status = 'paid'. מה קורה ללקוחות בלי הזמנות?" },
      options: [
        { en: "They appear with NULL status", he: "הם מופיעים עם status שהוא NULL" },
        { en: "They are dropped — the LEFT JOIN behaves like an INNER JOIN", he: "הם נזרקים — ה-LEFT JOIN מתנהג כמו INNER JOIN" },
        { en: "They appear once per paid order", he: "הם מופיעים פעם לכל הזמנה ששולמה" },
        { en: "Postgres raises an error", he: "Postgres זורק שגיאה" }
      ], answer: 1,
      explain: { en: "Their status is NULL, NULL = 'paid' is NULL, and WHERE drops it. Move the condition into the ON clause to keep them.", he: "ה-status שלהם הוא NULL, ו-NULL = 'paid' הוא NULL, אז WHERE זורק אותם. תעביר את התנאי ל-ON כדי לשמור אותם." } },
    { q: { en: "orders has 5 rows; customer_id is NULL in one and two rows share customer 1. What are COUNT(*), COUNT(customer_id), COUNT(DISTINCT customer_id)?", he: "ב-orders יש 5 rows; באחד מהם customer_id הוא NULL ושני rows שייכים ללקוח 1. מה COUNT(*), COUNT(customer_id), COUNT(DISTINCT customer_id)?" },
      options: [
        { en: "5, 5, 4", he: "5, 5, 4" },
        { en: "5, 4, 4", he: "5, 4, 4" },
        { en: "5, 4, 3", he: "5, 4, 3" },
        { en: "4, 4, 3", he: "4, 4, 3" }
      ], answer: 2,
      explain: { en: "COUNT(*) counts rows (5), COUNT(col) skips the NULL (4), DISTINCT also merges the two customer-1 rows (3).", he: "COUNT(*) סופר rows (5), COUNT(col) מדלג על ה-NULL (4), ו-DISTINCT גם ממזג את שני ה-rows של לקוח 1 (3)." } },
    { q: { en: "Which is the safest way to make 'insert this event unless we already have it' idempotent under concurrency in Postgres?", he: "מה הדרך הבטוחה ביותר לעשות 'תכניס את האירוע הזה אלא אם כבר יש לנו אותו' אידמפוטנטי תחת מקביליות ב-Postgres?" },
      options: [
        { en: "SELECT first, INSERT if not found", he: "קודם SELECT, ואם לא נמצא אז INSERT" },
        { en: "INSERT … ON CONFLICT (event_id) DO NOTHING with a unique index on event_id", he: "INSERT … ON CONFLICT (event_id) DO NOTHING עם unique index על event_id" },
        { en: "INSERT and then DELETE duplicates nightly with DISTINCT", he: "INSERT ואז מחיקת כפילויות כל לילה עם DISTINCT" },
        { en: "UNION the new row with the table", he: "UNION בין ה-row החדש לטבלה" }
      ], answer: 1,
      explain: { en: "The unique index makes the check and the insert one atomic operation. SELECT-then-INSERT races: two requests both see 'not found' and both insert.", he: "ה-unique index הופך את הבדיקה וההכנסה לפעולה אטומית אחת. SELECT ואז INSERT זה race: שתי בקשות רואות 'לא נמצא' ושתיהן מכניסות." } }
  ],
  related: ["sql-window-functions", "sql-ctes-advanced", "db-transactions", "db-indexes", "pr-data-modeling", "db-query-debugging"]
});

/* ---------- Lesson 2: window functions ---------- */
const W = {
data: `emp                              daily
 name | dept | salary            day     | revenue
------+------+--------       ------------+---------
 Dana | eng  |     30         2026-03-01 |     100
 Avi  | eng  |     25         2026-03-02 |     120
 Noa  | eng  |     25         2026-03-03 |      90
 Gil  | eng  |     20         2026-03-04 |     150
 Tal  | ops  |     22         2026-03-05 |     150
 Rina | ops  |     18`,
basic: `-- GROUP BY collapses rows; a window keeps every row and adds the group's value next to it
SELECT name, dept, salary,
       ROUND(AVG(salary) OVER (PARTITION BY dept), 1)          AS dept_avg,
       ROUND(salary - AVG(salary) OVER (PARTITION BY dept), 1) AS diff
FROM emp ORDER BY dept, salary DESC, name;

 name | dept | salary | dept_avg | diff
------+------+--------+----------+------
 Dana | eng  |     30 |     25.0 |  5.0
 Avi  | eng  |     25 |     25.0 |  0.0
 Noa  | eng  |     25 |     25.0 |  0.0
 Gil  | eng  |     20 |     25.0 | -5.0
 Tal  | ops  |     22 |     20.0 |  2.0
 Rina | ops  |     18 |     20.0 | -2.0
(6 rows)`,
ranks: `SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_number,
       RANK()       OVER (ORDER BY salary DESC) AS rank,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM emp WHERE dept = 'eng' ORDER BY salary DESC, name;

 name | salary | row_number | rank | dense_rank
------+--------+------------+------+------------
 Dana |     30 |          1 |    1 |          1
 Avi  |     25 |          2 |    2 |          2
 Noa  |     25 |          3 |    2 |          2      -- tie: who gets 2 vs 3 is arbitrary!
 Gil  |     20 |          4 |    4 |          3      -- RANK skips 3, DENSE_RANK doesn't
(4 rows)`,
topn: `-- top 2 earners per department
SELECT dept, name, salary
FROM (
  SELECT e.*,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, name) AS rn
  FROM emp e
) t
WHERE rn &lt;= 2               -- can't filter a window in WHERE of the same level
ORDER BY dept, rn;

 dept | name | salary
------+------+--------
 eng  | Dana |     30
 eng  | Avi  |     25
 ops  | Tal  |     22
 ops  | Rina |     18
(4 rows)`,
lag: `SELECT day, revenue,
       LAG(revenue)  OVER (ORDER BY day)           AS prev,
       revenue - LAG(revenue) OVER (ORDER BY day)  AS delta,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY day))
             / LAG(revenue) OVER (ORDER BY day), 1) AS pct,
       LEAD(revenue) OVER (ORDER BY day)           AS next
FROM daily ORDER BY day;

    day     | revenue | prev | delta |  pct  | next
------------+---------+------+-------+-------+------
 2026-03-01 |     100 | NULL |  NULL |  NULL |  120
 2026-03-02 |     120 |  100 |    20 |  20.0 |   90
 2026-03-03 |      90 |  120 |   -30 | -25.0 |  150
 2026-03-04 |     150 |   90 |    60 |  66.7 |  150
 2026-03-05 |     150 |  150 |     0 |   0.0 | NULL
(5 rows)`,
running: `SELECT day, revenue,
       SUM(revenue) OVER (ORDER BY day) AS running_total,
       ROUND(AVG(revenue) OVER (ORDER BY day
             ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS avg_3d
FROM daily ORDER BY day;

    day     | revenue | running_total | avg_3d
------------+---------+---------------+--------
 2026-03-01 |     100 |           100 |  100.0     -- only 1 row in the frame so far
 2026-03-02 |     120 |           220 |  110.0
 2026-03-03 |      90 |           310 |  103.3     -- (100+120+90)/3
 2026-03-04 |     150 |           460 |  120.0     -- (120+90+150)/3
 2026-03-05 |     150 |           610 |  130.0
(5 rows)`,
rangeRows: `-- ordering by a column with ties: default RANGE frame includes all peers
SELECT day, revenue,
       SUM(revenue) OVER (ORDER BY revenue)                    AS sum_range,
       SUM(revenue) OVER (ORDER BY revenue
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)  AS sum_rows
FROM daily ORDER BY revenue, day;

    day     | revenue | sum_range | sum_rows
------------+---------+-----------+----------
 2026-03-03 |      90 |        90 |       90
 2026-03-01 |     100 |       190 |      190
 2026-03-02 |     120 |       310 |      310
 2026-03-04 |     150 |       610 |      460     -- RANGE jumped ahead: both 150s are "peers"
 2026-03-05 |     150 |       610 |      610
(5 rows)`,
lastValue: `SELECT name, salary,
       FIRST_VALUE(name) OVER (ORDER BY salary DESC) AS top_paid,
       LAST_VALUE(name)  OVER (ORDER BY salary DESC) AS last_wrong,
       LAST_VALUE(name)  OVER (ORDER BY salary DESC
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_right
FROM emp WHERE dept = 'eng' ORDER BY salary DESC, name;

 name | salary | top_paid | last_wrong | last_right
------+--------+----------+------------+------------
 Dana |     30 | Dana     | Dana       | Gil
 Avi  |     25 | Dana     | Noa        | Gil
 Noa  |     25 | Dana     | Noa        | Gil
 Gil  |     20 | Dana     | Gil        | Gil
(4 rows)`,
ntile: `SELECT name, salary,
       NTILE(3) OVER (ORDER BY salary DESC) AS bucket,
       ROUND((PERCENT_RANK() OVER (ORDER BY salary))::numeric, 2) AS pct_rank
FROM emp ORDER BY salary DESC, name;

 name | salary | bucket | pct_rank
------+--------+--------+----------
 Dana |     30 |      1 |     1.00
 Avi  |     25 |      1 |     0.60
 Noa  |     25 |      2 |     0.60     -- NTILE splits ties across buckets
 Tal  |     22 |      2 |     0.40
 Gil  |     20 |      3 |     0.20
 Rina |     18 |      3 |     0.00
(6 rows)

-- percentiles are ordered-set aggregates
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS p50,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY salary) AS p90,
       percentile_disc(0.5) WITHIN GROUP (ORDER BY salary) AS p50_disc
FROM emp;

 p50  | p90  | p50_disc
------+------+----------
 23.5 | 27.5 |       22      -- cont interpolates (22+25)/2; disc returns a real value
(1 row)`,
session: `-- clicks: user 1 at 10:00, 10:05, 10:20, 11:30, 11:40; user 2 at 09:00
-- a new session starts after 30 minutes of silence
WITH marked AS (
  SELECT user_id, ts,
         CASE WHEN ts - LAG(ts) OVER w &lt;= interval '30 minutes'
              THEN 0 ELSE 1 END AS new_session        -- first click: LAG is NULL → ELSE → 1
  FROM clicks
  WINDOW w AS (PARTITION BY user_id ORDER BY ts)
)
SELECT user_id, ts, new_session,
       SUM(new_session) OVER (PARTITION BY user_id ORDER BY ts) AS session_id
FROM marked ORDER BY user_id, ts;

 user_id |         ts          | new_session | session_id
---------+---------------------+-------------+------------
       1 | 2026-03-01 10:00:00 |           1 |          1
       1 | 2026-03-01 10:05:00 |           0 |          1
       1 | 2026-03-01 10:20:00 |           0 |          1
       1 | 2026-03-01 11:30:00 |           1 |          2     -- 70 min gap
       1 | 2026-03-01 11:40:00 |           0 |          2
       2 | 2026-03-01 09:00:00 |           1 |          1
(6 rows)`,
dedup: `-- user_profile has duplicates per user_id; keep the latest
 id | user_id | email  | updated_at
----+---------+--------+------------
  1 |       7 | a@x.io | 2026-01-01
  2 |       7 | b@x.io | 2026-02-10
  3 |       8 | c@x.io | 2026-01-05
  4 |       7 | b@x.io | 2026-02-01

SELECT id, user_id, email, updated_at FROM (
  SELECT p.*, ROW_NUMBER() OVER (PARTITION BY user_id
                                 ORDER BY updated_at DESC, id DESC) AS rn  -- id = tie-breaker
  FROM user_profile p
) t WHERE rn = 1 ORDER BY user_id;

 id | user_id | email  | updated_at
----+---------+--------+------------
  2 |       7 | b@x.io | 2026-02-10
  3 |       8 | c@x.io | 2026-01-05
(2 rows)

-- Postgres shortcut for the same thing
SELECT DISTINCT ON (user_id) * FROM user_profile ORDER BY user_id, updated_at DESC, id DESC;

-- actually delete the losers (in a transaction!)
DELETE FROM user_profile WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, id DESC) AS rn
    FROM user_profile
  ) t WHERE rn &gt; 1
) RETURNING id;          -- returns 1 and 4
DELETE 2`,
perf: `EXPLAIN SELECT * FROM (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) rn
  FROM orders o) t WHERE rn = 1;

 Subquery Scan on t
   Filter: (t.rn = 1)
   -&gt;  WindowAgg
         -&gt;  Sort                                    -- the expensive part on big tables
               Sort Key: o.customer_id, o.created_at DESC
               -&gt;  Seq Scan on orders o

CREATE INDEX ON orders (customer_id, created_at DESC);
-- now:   WindowAgg -&gt; Index Scan using orders_customer_id_created_at_idx  (no Sort)`
};

INFRA.lessons.push({
  id: "sql-window-functions",
  track: "data",
  order: 71,
  icon: "🪟",
  level: 2,
  minutes: 17,
  title: { en: "Window Functions", he: "Window Functions — חישובים על שכנים" },
  tldr: {
    en: "A window function computes over a set of related rows without collapsing them: OVER (PARTITION BY who ORDER BY when ROWS BETWEEN …) — the tool for rankings, top-N per group, day-over-day deltas, running totals, sessions and dedup.",
    he: "Window function מחשבת על קבוצת rows קשורים בלי לכווץ אותם: OVER (PARTITION BY מי ORDER BY מתי ROWS BETWEEN …) — הכלי ל-ranking, ל-top-N לכל קבוצה, לשינוי יום מול יום, לסכום מצטבר, ל-sessions ול-dedup."
  },
  analogy: {
    en: "GROUP BY is a class photo: everyone squeezed into one picture per class, individuals lost. A window function is a yearbook: every student keeps their own page, and on each page there's a little box saying 'class average: 87, your rank: 3rd, the kid before you scored 91'. PARTITION BY picks the class, ORDER BY lines students up, and the frame decides which classmates the little box looks at.",
    he: "GROUP BY זו תמונה מחזורית: כולם נדחסים לתמונה אחת לכל כיתה, והפרט הולך לאיבוד. Window function זה ספר מחזור: לכל תלמיד נשאר עמוד משלו, ובכל עמוד יש תיבה קטנה שאומרת 'ממוצע הכיתה: 87, המקום שלך: 3, מי שלפניך קיבל 91'. PARTITION BY בוחר את הכיתה, ORDER BY מסדר את התלמידים בשורה, וה-frame קובע על אילו חברים לכיתה התיבה מסתכלת."
  },
  sections: [
    {
      h: { en: "OVER and PARTITION BY: aggregates that keep every row", he: "OVER ו-PARTITION BY: aggregates ששומרים כל row" },
      body: {
        en: `<p>Any aggregate (<code>SUM</code>, <code>AVG</code>, <code>COUNT</code>, <code>MAX</code>…) becomes a window function when you add <code>OVER (…)</code>. Inside the parentheses: <code>PARTITION BY</code> (which rows belong together — like GROUP BY, but no collapse), <code>ORDER BY</code> (order inside the partition) and an optional <strong>frame</strong> (which part of the partition to look at). Empty <code>OVER ()</code> = the whole result set.</p>
<p>Sample data:</p>
<pre>${W.data}</pre>
<pre>${W.basic}</pre>
<p>Where windows sit in the evaluation order: after <code>WHERE</code>, <code>GROUP BY</code> and <code>HAVING</code>, together with <code>SELECT</code>, before <code>ORDER BY</code>/<code>LIMIT</code>. Two consequences: (1) a window sees only rows that survived <code>WHERE</code>; (2) you can't filter on a window result in the same query's <code>WHERE</code> — wrap it in a subquery/CTE (Snowflake, BigQuery and DuckDB add <code>QUALIFY</code> for exactly this; Postgres doesn't have it).</p>
<p>When you repeat the same window, name it once: <code>… OVER w … WINDOW w AS (PARTITION BY dept ORDER BY salary DESC)</code>. You can even window over an aggregate: <code>SUM(SUM(amount)) OVER ()</code> gives each group's share of the grand total.</p>`,
        he: `<p>כל aggregate (<code>SUM</code>, <code>AVG</code>, <code>COUNT</code>, <code>MAX</code>…) הופך ל-window function כשמוסיפים <code>OVER (…)</code>. בתוך הסוגריים: <code>PARTITION BY</code> (אילו rows שייכים יחד — כמו GROUP BY, אבל בלי כיווץ), <code>ORDER BY</code> (סדר בתוך ה-partition) ו-<strong>frame</strong> אופציונלי (על איזה חלק של ה-partition להסתכל). <code>OVER ()</code> ריק = כל ה-result set.</p>
<p>נתוני הדוגמה:</p>
<pre>${W.data}</pre>
<pre>${W.basic}</pre>
<p>איפה windows נמצאים בסדר החישוב: אחרי <code>WHERE</code>, <code>GROUP BY</code> ו-<code>HAVING</code>, יחד עם ה-<code>SELECT</code>, ולפני <code>ORDER BY</code> ו-<code>LIMIT</code>. שתי השלכות: (1) window רואה רק rows ששרדו את ה-<code>WHERE</code>; (2) אי אפשר לסנן לפי תוצאה של window ב-<code>WHERE</code> של אותו query — עוטפים ב-subquery או CTE (ב-Snowflake, ב-BigQuery וב-DuckDB יש <code>QUALIFY</code> בדיוק בשביל זה; ב-Postgres אין).</p>
<p>כשחוזרים על אותו window, נותנים לו שם פעם אחת: <code>… OVER w … WINDOW w AS (PARTITION BY dept ORDER BY salary DESC)</code>. אפשר אפילו לעשות window מעל aggregate: <code>SUM(SUM(amount)) OVER ()</code> נותן לכל קבוצה את החלק שלה מהסכום הכולל.</p>`
      }
    },
    {
      h: { en: "Ranking: ROW_NUMBER vs RANK vs DENSE_RANK, and top-N per group", he: "דירוג: ROW_NUMBER מול RANK מול DENSE_RANK, ו-top-N לכל קבוצה" },
      body: {
        en: `<pre>${W.ranks}</pre>
<ul><li><strong>ROW_NUMBER</strong> — always unique 1, 2, 3… Ties are broken arbitrarily, so add a tie-breaker (<code>ORDER BY salary DESC, id</code>) or the result can change between runs — a nasty source of flaky tests and "the report changed by itself".</li>
<li><strong>RANK</strong> — ties share a rank, then it skips (1, 2, 2, 4) — sports-style.</li>
<li><strong>DENSE_RANK</strong> — ties share, no gaps (1, 2, 2, 3) — "the 2nd-highest salary" = <code>DENSE_RANK = 2</code>.</li></ul>
<p><strong>Top-N per group</strong> is the most common window query in interviews and in production ("latest 3 orders per customer", "top product per category"):</p>
<pre>${W.topn}</pre>
<blockquote>💡 Real world: want "top 2 including ties"? Use <code>RANK() … &lt;= 2</code> instead of ROW_NUMBER. For "top 1 per group" on Postgres, <code>DISTINCT ON (dept) … ORDER BY dept, salary DESC</code> is shorter and often faster; for "top N per group" when groups are few and the table is huge, a <code>LATERAL</code> join with <code>LIMIT N</code> that walks an index is fastest (see the CTE/advanced lesson).</blockquote>`,
        he: `<pre>${W.ranks}</pre>
<ul><li><strong>ROW_NUMBER</strong> — תמיד ייחודי 1, 2, 3… שוויונות נשברים שרירותית, אז תוסיף tie-breaker (<code>ORDER BY salary DESC, id</code>) אחרת התוצאה יכולה להשתנות בין הרצות — מקור מגעיל לטסטים flaky ול"הדוח השתנה מעצמו".</li>
<li><strong>RANK</strong> — בשוויון חולקים דירוג, ואז מדלגים (1, 2, 2, 4) — כמו בספורט.</li>
<li><strong>DENSE_RANK</strong> — בשוויון חולקים, בלי חורים (1, 2, 2, 3) — "המשכורת השנייה בגובהה" = <code>DENSE_RANK = 2</code>.</li></ul>
<p><strong>Top-N לכל קבוצה</strong> הוא ה-window query הכי נפוץ בראיונות וב-production ("3 ההזמנות האחרונות לכל לקוח", "המוצר המוביל בכל קטגוריה"):</p>
<pre>${W.topn}</pre>
<blockquote>💡 Real world: רוצה "top 2 כולל שוויונות"? תשתמש ב-<code>RANK() … &lt;= 2</code> במקום ROW_NUMBER. ל-"top 1 לכל קבוצה" ב-Postgres, <code>DISTINCT ON (dept) … ORDER BY dept, salary DESC</code> קצר יותר ולרוב מהיר יותר; ל-"top N לכל קבוצה" כשיש מעט קבוצות והטבלה ענקית, join עם <code>LATERAL</code> ו-<code>LIMIT N</code> שהולך על אינדקס הוא המהיר ביותר (ראה את השיעור על CTE ו-SQL מתקדם).</blockquote>`
      }
    },
    {
      h: { en: "LAG/LEAD, running totals and frames (ROWS BETWEEN …)", he: "LAG/LEAD, סכום מצטבר ו-frames (ROWS BETWEEN …)" },
      body: {
        en: `<p><code>LAG(col, n, default)</code> reads the value <em>n</em> rows back in the partition's order, <code>LEAD</code> reads forward. Day-over-day change in one query, no self-join:</p>
<pre>${W.lag}</pre>
<p>Note <code>100.0 *</code>: in Postgres <code>int / int</code> is integer division (<code>-30/120 = 0</code>). And LAG compares to the previous <em>row</em>, not the previous <em>day</em> — if a day is missing, you compare to two days ago. Zero-fill the calendar first (<code>generate_series</code>, next lesson).</p>
<p>Add an <code>ORDER BY</code> to an aggregate window and you get a running aggregate. A <strong>frame</strong> narrows which rows of the partition count:</p>
<pre>${W.running}</pre>
<p>Frame vocabulary: <code>ROWS BETWEEN &lt;start&gt; AND &lt;end&gt;</code> where start/end are <code>UNBOUNDED PRECEDING</code>, <code>n PRECEDING</code>, <code>CURRENT ROW</code>, <code>n FOLLOWING</code>, <code>UNBOUNDED FOLLOWING</code>. <code>ROWS</code> counts physical rows; <code>RANGE</code> works on values (<code>RANGE BETWEEN interval '7 days' PRECEDING AND CURRENT ROW</code> = a true 7-day window even with missing days, Postgres 11+).</p>
<p>The catch: with <code>ORDER BY</code> and no explicit frame, the default is <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — and RANGE includes all <strong>peers</strong> (rows with the same ORDER BY value):</p>
<pre>${W.rangeRows}</pre>
<blockquote>⚠️ Production tip: running totals ordered by a non-unique column (a date, an amount) jump at ties. Order by something unique (<code>ORDER BY day, id</code>) or say <code>ROWS</code> explicitly.</blockquote>`,
        he: `<p><code>LAG(col, n, default)</code> קורא את הערך <em>n</em> rows אחורה לפי הסדר של ה-partition, ו-<code>LEAD</code> קורא קדימה. שינוי יום מול יום ב-query אחד, בלי self-join:</p>
<pre>${W.lag}</pre>
<p>שים לב ל-<code>100.0 *</code>: ב-Postgres, <code>int / int</code> הוא חילוק שלמים (<code>-30/120 = 0</code>). ו-LAG משווה ל-<em>row</em> הקודם, לא ל-<em>יום</em> הקודם — אם חסר יום, אתה משווה ללפני יומיים. קודם ממלאים את לוח השנה באפסים (<code>generate_series</code>, בשיעור הבא).</p>
<p>מוסיפים <code>ORDER BY</code> ל-aggregate window ומקבלים aggregate מצטבר. <strong>frame</strong> מצמצם אילו rows מה-partition נספרים:</p>
<pre>${W.running}</pre>
<p>אוצר המילים של frames: <code>ROWS BETWEEN &lt;start&gt; AND &lt;end&gt;</code>, כש-start ו-end הם <code>UNBOUNDED PRECEDING</code>, <code>n PRECEDING</code>, <code>CURRENT ROW</code>, <code>n FOLLOWING</code>, <code>UNBOUNDED FOLLOWING</code>. <code>ROWS</code> סופר rows פיזיים; <code>RANGE</code> עובד על ערכים (<code>RANGE BETWEEN interval '7 days' PRECEDING AND CURRENT ROW</code> = חלון אמיתי של 7 ימים גם כשחסרים ימים, מ-Postgres 11).</p>
<p>המלכודת: עם <code>ORDER BY</code> ובלי frame מפורש, ברירת המחדל היא <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — ו-RANGE כולל את כל ה-<strong>peers</strong> (rows עם אותו ערך ORDER BY):</p>
<pre>${W.rangeRows}</pre>
<blockquote>⚠️ Production tip: סכום מצטבר שממוין לפי עמודה לא ייחודית (תאריך, סכום) קופץ בשוויונות. תמיין לפי משהו ייחודי (<code>ORDER BY day, id</code>) או תכתוב <code>ROWS</code> במפורש.</blockquote>`
      }
    },
    {
      h: { en: "FIRST_VALUE / LAST_VALUE, NTILE and percentiles", he: "FIRST_VALUE / LAST_VALUE, NTILE ואחוזונים" },
      body: {
        en: `<p>The default frame bites hardest with <code>LAST_VALUE</code>: the frame ends at the current row (and its peers), so "last" means "me":</p>
<pre>${W.lastValue}</pre>
<p>Fix: an explicit full frame, or flip the sort and use <code>FIRST_VALUE(name) OVER (ORDER BY salary ASC)</code>. Same trap for <code>NTH_VALUE</code>. <code>FIRST_VALUE</code> is safe because the frame always starts at the partition's beginning.</p>
<p><strong>NTILE(n)</strong> splits ordered rows into n nearly-equal buckets (quartiles = NTILE(4)); <strong>PERCENT_RANK</strong>/<strong>CUME_DIST</strong> give a 0–1 relative position. For actual percentile values (p50, p90, p99 latency), use the ordered-set aggregates:</p>
<pre>${W.ntile}</pre>
<blockquote>💡 Real world: <code>percentile_cont</code> sorts all values — fine for a report, too heavy for a dashboard over a billion request rows. That's why observability systems store histograms or sketches (t-digest, HDR, DDSketch) and compute approximate percentiles. MySQL has no percentile_cont: emulate with ROW_NUMBER and COUNT, or use the warehouse's <code>APPROX_PERCENTILE</code>/<code>APPROX_QUANTILES</code>.</blockquote>`,
        he: `<p>ה-frame של ברירת המחדל נושך הכי חזק עם <code>LAST_VALUE</code>: ה-frame נגמר ב-row הנוכחי (וב-peers שלו), אז "האחרון" פירושו "אני":</p>
<pre>${W.lastValue}</pre>
<p>התיקון: frame מלא ומפורש, או להפוך את המיון ולהשתמש ב-<code>FIRST_VALUE(name) OVER (ORDER BY salary ASC)</code>. אותה מלכודת גם ב-<code>NTH_VALUE</code>. <code>FIRST_VALUE</code> בטוח, כי ה-frame תמיד מתחיל בתחילת ה-partition.</p>
<p><strong>NTILE(n)</strong> מחלק rows ממוינים ל-n דליים כמעט שווים (רבעונים = NTILE(4)); <strong>PERCENT_RANK</strong> ו-<strong>CUME_DIST</strong> נותנים מיקום יחסי בין 0 ל-1. בשביל ערכי אחוזון אמיתיים (latency של p50, p90, p99) משתמשים ב-ordered-set aggregates:</p>
<pre>${W.ntile}</pre>
<blockquote>💡 Real world: <code>percentile_cont</code> ממיין את כל הערכים — בסדר לדוח, כבד מדי ל-dashboard על מיליארד rows של בקשות. בגלל זה מערכות observability שומרות histograms או sketches (t-digest, HDR, DDSketch) ומחשבות אחוזונים בקירוב. ב-MySQL אין percentile_cont: מחקים עם ROW_NUMBER ו-COUNT, או משתמשים ב-<code>APPROX_PERCENTILE</code> או <code>APPROX_QUANTILES</code> של ה-warehouse.</blockquote>`
      }
    },
    {
      h: { en: "Two production patterns: sessionization and dedup", he: "שני דפוסים מ-production: sessionization ו-dedup" },
      body: {
        en: `<p><strong>Sessionization</strong> (a classic "gaps" problem): mark each row that starts something new with LAG, then a running SUM of the marks numbers the groups:</p>
<pre>${W.session}</pre>
<p>The same two-step trick (flag with LAG, number with running SUM) finds deploy streaks, status changes ("how long was the service in state DOWN"), and price-change periods.</p>
<p><strong>Dedup keeping the latest row</strong> — the CDC/ingestion cleanup you'll write a hundred times:</p>
<pre>${W.dedup}</pre>
<blockquote>⚠️ Production tip: after the cleanup, add the <code>UNIQUE (user_id)</code> constraint and switch the writer to <code>INSERT … ON CONFLICT (user_id) DO UPDATE</code>, or the duplicates are back next week. On a big table, delete in batches at a quiet hour — each deleted row is a dead tuple VACUUM has to clean.</blockquote>`,
        he: `<p><strong>Sessionization</strong> (בעיית "gaps" קלאסית): מסמנים עם LAG כל row שמתחיל משהו חדש, ואז SUM מצטבר של הסימונים ממספר את הקבוצות:</p>
<pre>${W.session}</pre>
<p>אותו טריק בשני שלבים (מסמנים עם LAG, ממספרים עם SUM מצטבר) מוצא רצפי deploy, שינויי סטטוס ("כמה זמן השירות היה במצב DOWN") ותקופות בין שינויי מחיר.</p>
<p><strong>Dedup שמשאיר את ה-row האחרון</strong> — הניקוי של CDC או ingestion שתכתוב מאה פעם:</p>
<pre>${W.dedup}</pre>
<blockquote>⚠️ Production tip: אחרי הניקוי, תוסיף constraint <code>UNIQUE (user_id)</code> ותעביר את הכותב ל-<code>INSERT … ON CONFLICT (user_id) DO UPDATE</code>, אחרת הכפילויות חוזרות בשבוע הבא. בטבלה גדולה, תמחק ב-batches ובשעה שקטה — כל row שנמחק הוא dead tuple ש-VACUUM צריך לנקות.</blockquote>`
      }
    },
    {
      h: { en: "Performance: windows mean sorts", he: "ביצועים: windows זה sorts" },
      body: {
        en: `<p>Every distinct <code>(PARTITION BY, ORDER BY)</code> combination needs the input sorted that way. In the plan that's a <code>Sort</code> under a <code>WindowAgg</code> — and on 100M rows the sort spills to disk (<code>Sort Method: external merge  Disk: 2400000kB</code>).</p>
<pre>${W.perf}</pre>
<ul><li>An index on <code>(partition cols, order cols)</code> in the same direction lets Postgres read rows already sorted. Combine it with a selective <code>WHERE</code> (one customer, last 30 days) and windows are cheap.</li>
<li>Several windows with the same spec share one sort; different specs each add a sort. Reuse a named <code>WINDOW</code>.</li>
<li>Raise <code>work_mem</code> for the session (<code>SET work_mem = '256MB'</code>) for a big report to keep the sort in memory — not globally: it's per sort node, per connection.</li>
<li>Filtering <code>rn = 1</code> outside still computes the window for every row underneath. For "latest per key" on a hot path, keep a separate "current state" table maintained on write instead.</li></ul>`,
        he: `<p>כל צירוף שונה של <code>(PARTITION BY, ORDER BY)</code> צריך את הקלט ממוין ככה. ב-plan זה <code>Sort</code> מתחת ל-<code>WindowAgg</code> — ועל 100M rows ה-sort גולש לדיסק (<code>Sort Method: external merge  Disk: 2400000kB</code>).</p>
<pre>${W.perf}</pre>
<ul><li>אינדקס על <code>(partition cols, order cols)</code> באותו כיוון מאפשר ל-Postgres לקרוא rows שכבר ממוינים. בשילוב עם <code>WHERE</code> סלקטיבי (לקוח אחד, 30 הימים האחרונים) windows הם זולים.</li>
<li>כמה windows עם אותו spec חולקים sort אחד; כל spec שונה מוסיף sort. תשתמש שוב ב-<code>WINDOW</code> עם שם.</li>
<li>לדוח גדול, תעלה <code>work_mem</code> ל-session (<code>SET work_mem = '256MB'</code>) כדי שה-sort יישאר בזיכרון — לא גלובלית: זה לכל sort node, לכל connection.</li>
<li>סינון <code>rn = 1</code> מבחוץ עדיין מחשב את ה-window לכל row שמתחת. ל-"האחרון לכל מפתח" ב-hot path, עדיף לתחזק טבלת "מצב נוכחי" נפרדת שמתעדכנת בכתיבה.</li></ul>`
      }
    }
  ],
  handsOn: [
    { cmd: "SELECT name, salary, ROW_NUMBER() OVER w, RANK() OVER w, DENSE_RANK() OVER w FROM emp WINDOW w AS (ORDER BY salary DESC);", what: { en: "Put the three ranking functions side by side on data with ties.", he: "שלוש פונקציות הדירוג זו לצד זו, על נתונים עם שוויונות." } },
    { cmd: "SELECT day, revenue, SUM(revenue) OVER (ORDER BY revenue), SUM(revenue) OVER (ORDER BY revenue ROWS UNBOUNDED PRECEDING) FROM daily;", what: { en: "See the RANGE-vs-ROWS default-frame difference on tied values.", he: "תראה את ההבדל בין RANGE ל-ROWS ב-frame של ברירת המחדל, על ערכים שווים." } },
    { cmd: "EXPLAIN (ANALYZE, BUFFERS) SELECT DISTINCT ON (customer_id) * FROM orders ORDER BY customer_id, created_at DESC;", what: { en: "Check whether 'latest per customer' sorts or walks an index; then CREATE INDEX ON orders (customer_id, created_at DESC) and compare.", he: "תבדוק אם 'האחרון לכל לקוח' עושה sort או הולך על אינדקס; אחר כך CREATE INDEX ON orders (customer_id, created_at DESC) ותשווה." } }
  ],
  mnemonic: {
    en: "\"Who, in what order, how far\": PARTITION BY = who, ORDER BY = in what order, ROWS BETWEEN = how far. Ranks: ROW_NUMBER never ties, RANK skips, DENSE_RANK doesn't.",
    he: "\"מי, באיזה סדר, כמה רחוק\": PARTITION BY = מי, ORDER BY = באיזה סדר, ROWS BETWEEN = כמה רחוק. דירוג: ROW_NUMBER אף פעם לא בשוויון, RANK מדלג, DENSE_RANK לא."
  },
  pitfalls: [
    { en: "ROW_NUMBER without a unique tie-breaker: 'latest row per user' picks a random one among equal timestamps, and dedup deletes the wrong row.", he: "ROW_NUMBER בלי tie-breaker ייחודי: 'ה-row האחרון לכל משתמש' בוחר אחד אקראי מבין timestamps שווים, וה-dedup מוחק את ה-row הלא נכון." },
    { en: "LAST_VALUE with the default frame returns the current row. Specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING, or use FIRST_VALUE with the reverse order.", he: "LAST_VALUE עם ה-frame של ברירת המחדל מחזיר את ה-row הנוכחי. תכתוב ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING, או תשתמש ב-FIRST_VALUE עם סדר הפוך." },
    { en: "Trying WHERE rn = 1 in the same SELECT that defines rn — windows are computed after WHERE. Wrap in a subquery/CTE (or QUALIFY in Snowflake/BigQuery).", he: "לנסות WHERE rn = 1 באותו SELECT שמגדיר את rn — windows מחושבים אחרי WHERE. עוטפים ב-subquery או CTE (או QUALIFY ב-Snowflake וב-BigQuery)." },
    { en: "LAG over days with gaps: 'yesterday' is really 'the previous row'. Zero-fill the calendar before computing day-over-day.", he: "LAG על ימים עם חורים: 'אתמול' הוא בעצם 'ה-row הקודם'. ממלאים את לוח השנה באפסים לפני חישוב יום מול יום." }
  ],
  interview: [
    { q: { en: "Return the 3 most recent orders per customer. How would you write it, and how would you make it fast on 500M rows?", he: "תחזיר את 3 ההזמנות האחרונות לכל לקוח. איך היית כותב את זה, ואיך היית הופך את זה למהיר על 500M rows?" },
      a: { en: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC) in a subquery, then WHERE rn &lt;= 3. For speed: an index on (customer_id, created_at DESC, id DESC) removes the sort; if you only need a subset of customers, a LATERAL subquery with ORDER BY created_at DESC LIMIT 3 per customer does 3 index lookups each instead of ranking all 500M rows.", he: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC) בתוך subquery, ואז WHERE rn &lt;= 3. למהירות: אינדקס על (customer_id, created_at DESC, id DESC) מבטל את ה-sort; ואם צריך רק חלק מהלקוחות, subquery עם LATERAL ו-ORDER BY created_at DESC LIMIT 3 לכל לקוח עושה 3 קריאות אינדקס לכל אחד במקום לדרג את כל ה-500M rows." } },
    { q: { en: "What's the difference between ROWS and RANGE frames, and when does it matter?", he: "מה ההבדל בין frame של ROWS ל-frame של RANGE, ומתי זה משנה?" },
      a: { en: "ROWS counts physical rows relative to the current one; RANGE is based on the ORDER BY value, so all rows with the same value (peers) are inside together, and you can use offsets like interval '7 days'. It matters with ties: the default frame (RANGE … CURRENT ROW) makes a running total jump over all tied rows at once and makes LAST_VALUE return the last peer. Use ROWS for row-count windows and RANGE with intervals for true time windows over gappy data.", he: "ROWS סופר rows פיזיים ביחס ל-row הנוכחי; RANGE מבוסס על הערך של ה-ORDER BY, כך שכל ה-rows עם אותו ערך (peers) נכנסים יחד, ואפשר להשתמש ב-offsets כמו interval '7 days'. זה משנה כשיש שוויונות: ה-frame של ברירת המחדל (RANGE … CURRENT ROW) גורם לסכום מצטבר לקפוץ על כל ה-rows השווים בבת אחת ול-LAST_VALUE להחזיר את ה-peer האחרון. ROWS לחלונות לפי מספר rows, ו-RANGE עם intervals לחלונות זמן אמיתיים על נתונים עם חורים." } }
  ],
  quiz: [
    { q: { en: "Salaries 30, 25, 25, 20 ordered DESC. What does DENSE_RANK give the 20?", he: "משכורות 30, 25, 25, 20 בסדר יורד. איזה DENSE_RANK מקבל ה-20?" },
      options: [ { en: "4", he: "4" }, { en: "3", he: "3" }, { en: "2", he: "2" }, { en: "It depends on the tie-breaker", he: "תלוי ב-tie-breaker" } ], answer: 1,
      explain: { en: "DENSE_RANK gives 1, 2, 2, 3 — no gaps after ties. RANK would give 4; ROW_NUMBER would give 4.", he: "DENSE_RANK נותן 1, 2, 2, 3 — בלי חורים אחרי שוויון. RANK היה נותן 4, וגם ROW_NUMBER היה נותן 4." } },
    { q: { en: "Why does LAST_VALUE(name) OVER (ORDER BY salary DESC) seem to return the current row's name?", he: "למה נראה ש-LAST_VALUE(name) OVER (ORDER BY salary DESC) מחזיר את השם של ה-row הנוכחי?" },
      options: [
        { en: "LAST_VALUE ignores ORDER BY", he: "LAST_VALUE מתעלם מ-ORDER BY" },
        { en: "The default frame ends at the current row (and its peers)", he: "ה-frame של ברירת המחדל נגמר ב-row הנוכחי (וב-peers שלו)" },
        { en: "It needs PARTITION BY to work", he: "הוא צריך PARTITION BY כדי לעבוד" },
        { en: "It's a Postgres bug fixed in v16", he: "זה באג של Postgres שתוקן בגרסה 16" }
      ], answer: 1,
      explain: { en: "With ORDER BY the default frame is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Extend it to UNBOUNDED FOLLOWING.", he: "עם ORDER BY, ה-frame של ברירת המחדל הוא RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. צריך להרחיב אותו עד UNBOUNDED FOLLOWING." } },
    { q: { en: "Which expression computes a 7-row moving average of revenue?", he: "איזה ביטוי מחשב ממוצע נע של 7 rows על revenue?" },
      options: [
        { en: "AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)", he: "AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)" },
        { en: "AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 7 PRECEDING AND CURRENT ROW)", he: "AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 7 PRECEDING AND CURRENT ROW)" },
        { en: "AVG(revenue) OVER (PARTITION BY day)", he: "AVG(revenue) OVER (PARTITION BY day)" },
        { en: "AVG(revenue) … GROUP BY day LIMIT 7", he: "AVG(revenue) … GROUP BY day LIMIT 7" }
      ], answer: 0,
      explain: { en: "6 preceding rows + the current row = 7 rows. '7 PRECEDING' would be 8 rows. PARTITION BY day averages each day with itself.", he: "6 rows קודמים + ה-row הנוכחי = 7 rows. '7 PRECEDING' זה 8 rows. PARTITION BY day מחשב ממוצע של כל יום עם עצמו." } },
    { q: { en: "A ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) query on a big table is slow and the plan shows a big Sort. Best first fix?", he: "query עם ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) על טבלה גדולה הוא איטי, וב-plan יש Sort ענק. מה התיקון הראשון הכי טוב?" },
      options: [
        { en: "Replace it with GROUP BY customer_id", he: "להחליף ב-GROUP BY customer_id" },
        { en: "An index on (customer_id, created_at DESC)", he: "אינדקס על (customer_id, created_at DESC)" },
        { en: "An index on created_at only", he: "אינדקס רק על created_at" },
        { en: "Add DISTINCT", he: "להוסיף DISTINCT" }
      ], answer: 1,
      explain: { en: "The window needs rows ordered by partition then order columns; a matching composite index delivers them pre-sorted and the Sort node disappears.", he: "ה-window צריך rows ממוינים לפי עמודות ה-partition ואז עמודות הסדר; אינדקס מורכב תואם מספק אותם כבר ממוינים, וה-Sort נעלם מה-plan." } }
  ],
  related: ["sql-basics-joins", "sql-ctes-advanced", "db-query-debugging", "db-index-kinds", "db-time-series", "db-olap-columnar"]
});

/* ---------- Lesson 3: CTEs, recursion & advanced SQL ---------- */
const C = {
data: `orders
 id | customer_id | amount |  status  |     created_at
----+-------------+--------+----------+---------------------
  1 |           1 |    120 | paid     | 2026-03-01 09:10:00
  2 |           1 |     80 | refunded | 2026-03-01 17:45:00
  3 |           2 |    200 | paid     | 2026-03-03 12:00:00
  4 |           1 |     50 | paid     | 2026-03-04 08:30:00
  5 |           2 |     40 | pending  | 2026-03-04 22:15:00

customers: (1, Dana), (2, Avi), (3, Noa)`,
cte: `WITH paid AS (                       -- step 1: revenue per customer
  SELECT customer_id, SUM(amount) AS revenue
  FROM orders WHERE status = 'paid'
  GROUP BY customer_id
),
ranked AS (                          -- step 2: attach names, keep customers with 0
  SELECT c.name, COALESCE(p.revenue, 0) AS revenue
  FROM customers c LEFT JOIN paid p ON p.customer_id = c.id
)
SELECT * FROM ranked ORDER BY revenue DESC;

 name | revenue
------+---------
 Avi  |     200
 Dana |     170
 Noa  |       0
(3 rows)`,
org: `-- employees: Rina (CEO) ← Omer, Tal;  Omer ← Gil;  Gil ← Maya
WITH RECURSIVE chain AS (
  -- anchor: where to start
  SELECT id, name, manager_id, 0 AS depth, name::text AS path
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  -- recursive step: everyone whose manager is already in "chain"
  SELECT e.id, e.name, e.manager_id, c.depth + 1, c.path || ' &gt; ' || e.name
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
  WHERE c.depth &lt; 20                 -- safety net against bad data
)
SELECT depth, name, path FROM chain ORDER BY path;

 depth | name |           path
-------+------+--------------------------
     0 | Rina | Rina
     1 | Omer | Rina &gt; Omer
     2 | Gil  | Rina &gt; Omer &gt; Gil
     3 | Maya | Rina &gt; Omer &gt; Gil &gt; Maya
     1 | Tal  | Rina &gt; Tal
(5 rows)`,
deps: `-- deps(service, depends_on): web→api, api→auth, api→db, auth→db, worker→db
-- "what does web need, directly or transitively?"
WITH RECURSIVE need AS (
  SELECT depends_on AS svc, 1 AS hops FROM deps WHERE service = 'web'
  UNION
  SELECT d.depends_on, n.hops + 1
  FROM deps d JOIN need n ON d.service = n.svc
)
SELECT svc, MIN(hops) AS min_hops FROM need GROUP BY svc ORDER BY min_hops, svc;

 svc  | min_hops
------+----------
 api  |        1
 auth |        2
 db   |        2       -- reachable via api (2 hops) and via auth (3 hops)
(3 rows)

-- graphs can have cycles (a→b→a): Postgres 14+ detects them for you
WITH RECURSIVE need AS (…same…)
  CYCLE svc SET is_cycle USING visited
SELECT …;`,
series: `-- a calendar without generate_series (works in MySQL 8 / SQLite too)
WITH RECURSIVE days AS (
  SELECT DATE '2026-03-01' AS day
  UNION ALL
  SELECT day + 1 FROM days WHERE day &lt; DATE '2026-03-05'
)
SELECT day FROM days;           -- 2026-03-01 … 2026-03-05, 5 rows`,
islands: `-- logins: user 1 on Mar 1, 2, 3, 5, 6;  user 2 on Mar 2
-- trick: consecutive days minus a consecutive row number = the same constant
SELECT user_id, day,
       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) AS rn,
       day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS grp
FROM logins ORDER BY user_id, day;

 user_id |    day     | rn |    grp
---------+------------+----+------------
       1 | 2026-03-01 |  1 | 2026-02-28
       1 | 2026-03-02 |  2 | 2026-02-28
       1 | 2026-03-03 |  3 | 2026-02-28
       1 | 2026-03-05 |  4 | 2026-03-01     -- gap on Mar 4 → new constant
       1 | 2026-03-06 |  5 | 2026-03-01
       2 | 2026-03-02 |  1 | 2026-03-01
(6 rows)

-- group by that constant → one row per island (streak)
WITH g AS ( …the query above… )
SELECT user_id, MIN(day) AS streak_start, MAX(day) AS streak_end, COUNT(*) AS days
FROM g GROUP BY user_id, grp ORDER BY user_id, streak_start;

 user_id | streak_start | streak_end | days
---------+--------------+------------+------
       1 | 2026-03-01   | 2026-03-03 |    3
       1 | 2026-03-05   | 2026-03-06 |    2
       2 | 2026-03-02   | 2026-03-02 |    1
(3 rows)`,
pivot: `SELECT created_at::date AS day,
       COUNT(*)    FILTER (WHERE status = 'paid')     AS paid,
       COUNT(*)    FILTER (WHERE status = 'refunded') AS refunded,
       COUNT(*)    FILTER (WHERE status = 'pending')  AS pending,
       SUM(amount) FILTER (WHERE status = 'paid')     AS paid_amount
FROM orders
GROUP BY created_at::date ORDER BY day;

    day     | paid | refunded | pending | paid_amount
------------+------+----------+---------+-------------
 2026-03-01 |    1 |        1 |       0 |         120
 2026-03-03 |    1 |        0 |       0 |         200
 2026-03-04 |    1 |        0 |       1 |          50
(3 rows)

-- portable (MySQL, SQL Server, everything):
SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)      AS paid,
SUM(CASE WHEN status = 'paid' THEN amount END)        AS paid_amount`,
json: `CREATE TABLE events (id int PRIMARY KEY, payload jsonb NOT NULL);
-- 1: {"type":"checkout","user":{"id":7,"plan":"pro"},"items":[{"sku":"A","qty":2},{"sku":"B","qty":1}]}
-- 2: {"type":"login","user":{"id":8,"plan":"free"}}
-- 3: {"type":"checkout","user":{"id":8,"plan":"free"},"items":[{"sku":"A","qty":5}]}

SELECT id,
       payload -&gt;&gt; 'type'           AS type,       -- -&gt;&gt; returns text
       payload -&gt; 'user'            AS user_obj,   -- -&gt;  returns jsonb
       payload -&gt; 'user' -&gt;&gt; 'plan' AS plan
FROM events ORDER BY id;

 id |   type   |         user_obj          | plan
----+----------+---------------------------+------
  1 | checkout | {"id": 7, "plan": "pro"}  | pro
  2 | login    | {"id": 8, "plan": "free"} | free
  3 | checkout | {"id": 8, "plan": "free"} | free
(3 rows)

-- one row per array element
SELECT e.id, item -&gt;&gt; 'sku' AS sku, (item -&gt;&gt; 'qty')::int AS qty
FROM events e
CROSS JOIN LATERAL jsonb_array_elements(e.payload -&gt; 'items') AS item
ORDER BY e.id;

 id | sku | qty
----+-----+-----
  1 | A   |   2
  1 | B   |   1
  3 | A   |   5
(3 rows)            -- event 2 has no "items" → produces no rows

-- SQL/JSON path: skus with qty &gt; 1
SELECT id, jsonb_path_query(payload, '$.items[*] ? (@.qty &gt; 1).sku') AS sku FROM events;

 id | sku
----+-----
  1 | "A"
  3 | "A"
(2 rows)

-- filter + index: containment is GIN-indexable, -&gt;&gt; = 'x' is not (without an expression index)
CREATE INDEX ON events USING gin (payload jsonb_path_ops);
SELECT count(*) FROM events WHERE payload @&gt; '{"type": "checkout"}';    -- 2`,
lateral: `-- latest 2 orders per customer; LATERAL lets the subquery see c.id
SELECT c.name, o.id, o.amount
FROM customers c
LEFT JOIN LATERAL (
  SELECT id, amount FROM orders
  WHERE customer_id = c.id
  ORDER BY created_at DESC
  LIMIT 2
) o ON true
ORDER BY c.name, o.id DESC;

 name |  id  | amount
------+------+--------
 Avi  |    5 |     40
 Avi  |    3 |    200
 Dana |    4 |     50
 Dana |    2 |     80
 Noa  | NULL |   NULL       -- LEFT JOIN … ON true keeps customers with no orders
(5 rows)`,
buckets: `-- revenue per day, INCLUDING days with no orders (charts need the zeros)
SELECT d::date AS day,
       COUNT(o.id)                AS orders,
       COALESCE(SUM(o.amount), 0) AS revenue
FROM generate_series(DATE '2026-03-01', DATE '2026-03-05', interval '1 day') AS d
LEFT JOIN orders o
       ON o.created_at &gt;= d AND o.created_at &lt; d + interval '1 day'   -- range: index-friendly
GROUP BY d ORDER BY d;

    day     | orders | revenue
------------+--------+---------
 2026-03-01 |      2 |     200
 2026-03-02 |      0 |       0      -- without generate_series this row doesn't exist
 2026-03-03 |      1 |     200
 2026-03-04 |      2 |      90
 2026-03-05 |      0 |       0
(5 rows)

date_trunc('hour', ts)                         -- 2026-03-04 22:15:00 → 2026-03-04 22:00:00
date_trunc('week', ts)                         -- Monday 00:00 of that ISO week
date_bin('15 minutes', ts, TIMESTAMP '2000-01-01')   -- any bucket size (Postgres 14+)
date_trunc('day', ts, 'Asia/Jerusalem')        -- timestamptz: bucket in local time (Postgres 12+)`,
anti: `-- ❌ function on an indexed column: the index on created_at can't be used
EXPLAIN SELECT * FROM orders WHERE created_at::date = '2026-03-01';
 Seq Scan on orders  (cost=0.00..21846.00 rows=5000 width=52)
   Filter: ((created_at)::date = '2026-03-01'::date)

-- ✅ sargable: leave the column bare, move the math to the constant side
EXPLAIN SELECT * FROM orders
WHERE created_at &gt;= '2026-03-01' AND created_at &lt; '2026-03-02';
 Index Scan using orders_created_at_idx on orders  (cost=0.43..112.70 rows=2702 width=52)
   Index Cond: ((created_at &gt;= '2026-03-01 00:00:00') AND (created_at &lt; '2026-03-02 00:00:00'))

-- ❌ implicit cast: driver binds the parameter as numeric, column is bigint
EXPLAIN SELECT * FROM orders WHERE customer_id = 42::numeric;
 Seq Scan on orders
   Filter: ((customer_id)::numeric = '42'::numeric)    -- the COLUMN got cast

-- ❌ deep OFFSET: reads and throws away 100,000 rows to return 20
SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 100000;
-- ✅ keyset: continue from the last row of the previous page
SELECT * FROM orders
WHERE (created_at, id) &lt; ('2026-03-04 08:30:00', 4)
ORDER BY created_at DESC, id DESC LIMIT 20;`,
rewrite: `-- ❌ correlated subquery per row: runs once for every customer
SELECT c.name,
       (SELECT SUM(amount) FROM orders o WHERE o.customer_id = c.id) AS revenue
FROM customers c;

-- ✅ aggregate once, then join (one hash join instead of N lookups)
SELECT c.name, COALESCE(r.revenue, 0) AS revenue
FROM customers c
LEFT JOIN (SELECT customer_id, SUM(amount) AS revenue
           FROM orders GROUP BY customer_id) r ON r.customer_id = c.id;

-- CTE materialization (Postgres 12+): inlined by default if referenced once
WITH big AS MATERIALIZED (SELECT …)        -- compute once, reuse (old pre-12 behavior)
WITH big AS NOT MATERIALIZED (SELECT …)    -- let outer WHERE push down into it`
};

INFRA.lessons.push({
  id: "sql-ctes-advanced",
  track: "data",
  order: 72,
  icon: "🧬",
  level: 3,
  minutes: 20,
  title: { en: "CTEs, Recursion & Advanced SQL", he: "CTE, רקורסיה ו-SQL מתקדם" },
  tldr: {
    en: "Use WITH to write queries as named steps, WITH RECURSIVE to walk trees, graphs and calendars, and a few patterns (gaps & islands, FILTER pivots, LATERAL top-N, jsonb, generate_series zero-fill) that replace pages of app code — while keeping indexed columns bare so the planner can still use your indexes.",
    he: "משתמשים ב-WITH כדי לכתוב queries כשלבים עם שם, ב-WITH RECURSIVE כדי לטייל על עצים, גרפים ולוחות שנה, ובכמה דפוסים (gaps & islands, pivot עם FILTER, top-N עם LATERAL, jsonb, מילוי אפסים עם generate_series) שמחליפים עמודים של קוד באפליקציה — ושומרים על עמודות מאונדקסות 'נקיות' כדי שה-planner עדיין יוכל להשתמש באינדקסים."
  },
  analogy: {
    en: "A CTE is a recipe written as steps: 'make the dough, make the sauce, assemble' instead of one paragraph-long sentence. A recursive CTE is a family-tree hunt: start with grandma (the anchor), then repeatedly ask 'who are the children of the people I found last round?' until a round finds nobody new.",
    he: "CTE זה מתכון שכתוב בשלבים: 'מכינים בצק, מכינים רוטב, מרכיבים' במקום משפט אחד באורך פסקה. CTE רקורסיבי זה חיפוש בעץ משפחה: מתחילים מסבתא (ה-anchor), ושוב ושוב שואלים 'מי הילדים של האנשים שמצאתי בסיבוב הקודם?' עד שסיבוב לא מוצא אף אחד חדש."
  },
  sections: [
    {
      h: { en: "WITH: queries as named steps", he: "WITH: queries כשלבים עם שם" },
      body: {
        en: `<p>A <strong>CTE</strong> (Common Table Expression) names a subquery so you can read the query top to bottom like a pipeline, reference a step more than once, and test each step on its own (just <code>SELECT * FROM paid</code>). Sample data for this lesson:</p>
<pre>${C.data}</pre>
<pre>${C.cte}</pre>
<p>Is it slower than a subquery? Since Postgres 12, no: a non-recursive, side-effect-free CTE referenced once is inlined into the main query and optimized as one. Before 12, every CTE was an <em>optimization fence</em> — computed fully and materialized — which is why old blog posts say "CTEs are slow". You control it explicitly:</p>
<pre>${C.rewrite}</pre>
<blockquote>💡 Real world: CTEs can also contain writes — <code>WITH moved AS (DELETE FROM queue WHERE … RETURNING *) INSERT INTO archive SELECT * FROM moved;</code> moves rows atomically in one statement. That's the backbone of many "archive old rows" jobs.</blockquote>`,
        he: `<p><strong>CTE</strong> (Common Table Expression) נותן שם ל-subquery, כך שאפשר לקרוא את ה-query מלמעלה למטה כמו pipeline, להשתמש בשלב יותר מפעם אחת, ולבדוק כל שלב לבד (פשוט <code>SELECT * FROM paid</code>). נתוני הדוגמה לשיעור הזה:</p>
<pre>${C.data}</pre>
<pre>${C.cte}</pre>
<p>זה יותר איטי מ-subquery? מאז Postgres 12, לא: CTE לא רקורסיבי, בלי side effects, שמשתמשים בו פעם אחת, משולב (inlined) ב-query הראשי ועובר אופטימיזציה כיחידה אחת. לפני 12, כל CTE היה <em>optimization fence</em> — חושב במלואו ונשמר בצד — ולכן בפוסטים ישנים כתוב ש"CTE זה איטי". שולטים בזה במפורש:</p>
<pre>${C.rewrite}</pre>
<blockquote>💡 Real world: CTE יכול להכיל גם כתיבות — <code>WITH moved AS (DELETE FROM queue WHERE … RETURNING *) INSERT INTO archive SELECT * FROM moved;</code> מעביר rows באופן אטומי ב-statement אחד. זה עמוד השדרה של הרבה jobs של "ארכוב rows ישנים".</blockquote>`
      }
    },
    {
      h: { en: "Recursive CTEs: trees, graphs and calendars", he: "CTE רקורסיבי: עצים, גרפים ולוחות שנה" },
      body: {
        en: `<p>Shape: an <strong>anchor</strong> query, <code>UNION ALL</code>, and a <strong>recursive</strong> query that joins the table to the CTE itself. The engine runs the anchor, then repeatedly runs the recursive part on the rows produced by the previous round, and stops when a round produces nothing.</p>
<pre>${C.org}</pre>
<p>The <code>::text</code> cast matters: the anchor's column types fix the CTE's types, and <code>name</code> (varchar(50)) concatenated grows past it — Postgres fails with <em>"recursive query column 5 has type character varying(50) in non-recursive term but type character varying overall"</em>.</p>
<p>Graphs (service dependencies, IAM role inheritance, package trees) are the same pattern. <code>UNION</code> instead of <code>UNION ALL</code> drops duplicate rows each round:</p>
<pre>${C.deps}</pre>
<p>And when you don't have <code>generate_series</code> (MySQL, SQLite), a recursive CTE makes a calendar or a numbers table:</p>
<pre>${C.series}</pre>
<blockquote>⚠️ Production tip: a recursive CTE over data with a cycle (an employee who is their own manager's manager) runs until it eats <code>work_mem</code> and temp disk. Always add a depth guard (<code>WHERE depth &lt; 20</code>) or Postgres 14's <code>CYCLE</code> clause. MySQL stops at <code>cte_max_recursion_depth</code> (1000); SQL Server at <code>MAXRECURSION</code> (100). MySQL writes <code>WITH RECURSIVE</code>; SQL Server writes a plain <code>WITH</code>.</blockquote>`,
        he: `<p>המבנה: query של <strong>anchor</strong>, <code>UNION ALL</code>, ו-query <strong>רקורסיבי</strong> שעושה join בין הטבלה ל-CTE עצמו. המנוע מריץ את ה-anchor, ואז שוב ושוב מריץ את החלק הרקורסיבי על ה-rows שיצאו בסיבוב הקודם, ועוצר כשסיבוב לא מייצר כלום.</p>
<pre>${C.org}</pre>
<p>ה-cast ל-<code>::text</code> חשוב: טיפוסי העמודות של ה-anchor קובעים את הטיפוסים של ה-CTE, ו-<code>name</code> (varchar(50)) שמשורשר גדל מעבר לזה — Postgres נכשל עם <em>"recursive query column 5 has type character varying(50) in non-recursive term but type character varying overall"</em>.</p>
<p>גרפים (תלויות בין שירותים, ירושת roles ב-IAM, עצי packages) הם אותו דפוס. <code>UNION</code> במקום <code>UNION ALL</code> זורק rows כפולים בכל סיבוב:</p>
<pre>${C.deps}</pre>
<p>וכשאין לך <code>generate_series</code> (MySQL, SQLite), CTE רקורסיבי מייצר לוח שנה או טבלת מספרים:</p>
<pre>${C.series}</pre>
<blockquote>⚠️ Production tip: CTE רקורסיבי על נתונים עם מעגל (עובד שהוא המנהל של המנהל של עצמו) רץ עד שהוא אוכל את ה-<code>work_mem</code> ואת דיסק ה-temp. תמיד תוסיף שמירה על עומק (<code>WHERE depth &lt; 20</code>) או את <code>CYCLE</code> של Postgres 14. ב-MySQL זה נעצר ב-<code>cte_max_recursion_depth</code> (1000); ב-SQL Server ב-<code>MAXRECURSION</code> (100), ושם כותבים <code>WITH</code> רגיל בלי RECURSIVE.</blockquote>`
      }
    },
    {
      h: { en: "Gaps & islands, and pivots with FILTER", he: "Gaps & islands, ו-pivot עם FILTER" },
      body: {
        en: `<p><strong>Gaps and islands</strong>: find runs of consecutive values — login streaks, uptime periods, consecutive failed health checks, ranges of free IDs. The classic trick: for consecutive values, <code>value − ROW_NUMBER()</code> is constant inside a run and changes after every gap.</p>
<pre>${C.islands}</pre>
<p>When the "next" value isn't simply +1 (timestamps with a 30-minute tolerance, statuses), use the LAG + running SUM version from the window functions lesson.</p>
<p><strong>Pivot</strong> — turn row values into columns. Postgres (and SQLite) support the standard aggregate <code>FILTER</code> clause; everywhere else use <code>CASE</code> inside the aggregate:</p>
<pre>${C.pivot}</pre>
<blockquote>💡 Real world: SQL needs to know the columns at parse time, so a "dynamic pivot" (one column per status, whatever statuses exist) needs generated SQL (or <code>crosstab()</code> from the tablefunc extension). Usually better: return long format and let the BI tool pivot.</blockquote>`,
        he: `<p><strong>Gaps and islands</strong>: מוצאים רצפים של ערכים עוקבים — רצפי התחברות, תקופות uptime, health checks כושלים ברצף, טווחים של IDs פנויים. הטריק הקלאסי: בערכים עוקבים, <code>value − ROW_NUMBER()</code> קבוע בתוך רצף ומשתנה אחרי כל חור.</p>
<pre>${C.islands}</pre>
<p>כשהערך ה"בא" הוא לא פשוט +1 (timestamps עם סבילות של 30 דקות, סטטוסים), משתמשים בגרסה של LAG ו-SUM מצטבר מהשיעור על window functions.</p>
<p><strong>Pivot</strong> — הופכים ערכים ב-rows לעמודות. Postgres (וגם SQLite) תומכים ב-<code>FILTER</code> התקני על aggregates; בכל מקום אחר משתמשים ב-<code>CASE</code> בתוך ה-aggregate:</p>
<pre>${C.pivot}</pre>
<blockquote>💡 Real world: SQL צריך לדעת את העמודות בזמן ה-parse, אז "pivot דינמי" (עמודה לכל status, לא משנה אילו קיימים) דורש SQL מג'ונרט (או <code>crosstab()</code> מה-extension tablefunc). בדרך כלל עדיף: להחזיר פורמט ארוך ולתת לכלי ה-BI לעשות pivot.</blockquote>`
      }
    },
    {
      h: { en: "JSON in Postgres and LATERAL joins", he: "JSON ב-Postgres ו-joins עם LATERAL" },
      body: {
        en: `<p>Use <code>jsonb</code> (binary, indexable), not <code>json</code> (text, keeps whitespace and duplicate keys). The operators you'll use daily: <code>-&gt;</code> returns jsonb, <code>-&gt;&gt;</code> returns text, <code>#&gt;&gt; '{user,plan}'</code> follows a path, <code>@&gt;</code> tests containment, <code>?</code> tests a key.</p>
<pre>${C.json}</pre>
<p>Remember <code>-&gt;&gt;</code> returns text: <code>payload-&gt;&gt;'qty' &gt; 10</code> compares strings ('9' &gt; '10'). Cast first: <code>(payload-&gt;&gt;'qty')::int &gt; 10</code>. MySQL uses the same arrows with a path (<code>payload-&gt;&gt;'$.type'</code>); SQL Server uses <code>JSON_VALUE(payload, '$.type')</code> and <code>OPENJSON</code>.</p>
<p><strong>LATERAL</strong> lets a subquery in FROM reference columns of tables to its left — a "for each row, run this" join. It's how you call set-returning functions per row (<code>jsonb_array_elements</code> above) and the fastest top-N-per-group when there's a matching index:</p>
<pre>${C.lateral}</pre>
<blockquote>⚠️ Production tip: jsonb is great for sparse, rarely-filtered attributes. If you filter or join on a JSON field in every query, promote it to a real column (<code>ALTER TABLE … ADD COLUMN plan text GENERATED ALWAYS AS (payload-&gt;'user'-&gt;&gt;'plan') STORED</code>) — you get statistics, a B-tree index and types back. The planner has no statistics inside jsonb and guesses selectivity.</blockquote>`,
        he: `<p>משתמשים ב-<code>jsonb</code> (בינארי, ניתן לאינדוקס), לא ב-<code>json</code> (טקסט, שומר רווחים ומפתחות כפולים). האופרטורים היומיומיים: <code>-&gt;</code> מחזיר jsonb, <code>-&gt;&gt;</code> מחזיר text, <code>#&gt;&gt; '{user,plan}'</code> הולך לפי path, <code>@&gt;</code> בודק הכלה, ו-<code>?</code> בודק אם מפתח קיים.</p>
<pre>${C.json}</pre>
<p>זכור ש-<code>-&gt;&gt;</code> מחזיר text: <code>payload-&gt;&gt;'qty' &gt; 10</code> משווה מחרוזות ('9' &gt; '10'). קודם עושים cast: <code>(payload-&gt;&gt;'qty')::int &gt; 10</code>. ב-MySQL יש את אותם חצים עם path (<code>payload-&gt;&gt;'$.type'</code>); ב-SQL Server משתמשים ב-<code>JSON_VALUE(payload, '$.type')</code> וב-<code>OPENJSON</code>.</p>
<p><strong>LATERAL</strong> מאפשר ל-subquery ב-FROM להתייחס לעמודות של טבלאות משמאלו — join של "לכל row, תריץ את זה". ככה קוראים ל-set-returning functions לכל row (<code>jsonb_array_elements</code> למעלה), וזה ה-top-N לכל קבוצה הכי מהיר כשיש אינדקס מתאים:</p>
<pre>${C.lateral}</pre>
<blockquote>⚠️ Production tip: jsonb מצוין לתכונות דלילות שמסננים לפיהן לעתים רחוקות. אם אתה מסנן או עושה join על שדה JSON בכל query, תקדם אותו לעמודה אמיתית (<code>ALTER TABLE … ADD COLUMN plan text GENERATED ALWAYS AS (payload-&gt;'user'-&gt;&gt;'plan') STORED</code>) — מקבלים בחזרה statistics, אינדקס B-tree וטיפוסים. ל-planner אין statistics בתוך jsonb והוא מנחש את ה-selectivity.</blockquote>`
      }
    },
    {
      h: { en: "Time bucketing and zero-filled charts", he: "חלוקה לדליי זמן וגרפים עם אפסים" },
      body: {
        en: `<p>Dashboards ask "per hour/day/week". <code>GROUP BY date_trunc('day', created_at)</code> answers it — but only for buckets that have data. A day with zero orders simply has no row, and the chart draws a straight line across the gap (or LAG compares to the wrong day). Generate the buckets first, then LEFT JOIN the facts:</p>
<pre>${C.buckets}</pre>
<p>Two production details: join with a half-open range (<code>&gt;= d AND &lt; d + 1 day</code>) rather than <code>created_at::date = d</code>, so an index on <code>created_at</code> works; and decide the time zone explicitly — "yesterday" for an Israeli business is <code>Asia/Jerusalem</code>, not UTC, and a <code>timestamptz</code> bucketed in UTC shifts 2–3 hours of orders into the wrong day.</p>
<blockquote>💡 Real world: for very large time-series tables, pre-aggregate into hourly rollups (a materialized view refreshed every few minutes, or TimescaleDB continuous aggregates) and let dashboards read the rollup, not the raw events.</blockquote>`,
        he: `<p>dashboards שואלים "לשעה, ליום, לשבוע". <code>GROUP BY date_trunc('day', created_at)</code> עונה על זה — אבל רק לדליים שיש בהם נתונים. ליום עם אפס הזמנות פשוט אין row, והגרף מותח קו ישר מעל החור (או ש-LAG משווה ליום הלא נכון). קודם מייצרים את הדליים, ואז עושים LEFT JOIN לנתונים:</p>
<pre>${C.buckets}</pre>
<p>שני פרטים מ-production: עושים join עם טווח חצי-פתוח (<code>&gt;= d AND &lt; d + 1 day</code>) ולא <code>created_at::date = d</code>, כדי שאינדקס על <code>created_at</code> יעבוד; ומחליטים במפורש על אזור הזמן — "אתמול" לעסק ישראלי זה <code>Asia/Jerusalem</code>, לא UTC, ו-<code>timestamptz</code> שמחולק לדליים לפי UTC מזיז 2–3 שעות של הזמנות ליום הלא נכון.</p>
<blockquote>💡 Real world: בטבלאות time-series ענקיות, עושים pre-aggregation ל-rollups של שעה (materialized view שמתרענן כל כמה דקות, או continuous aggregates של TimescaleDB), וה-dashboards קוראים את ה-rollup ולא את האירועים הגולמיים.</blockquote>`
      }
    },
    {
      h: { en: "Anti-patterns and EXPLAIN-friendly rewrites", he: "anti-patterns ושכתובים ש-EXPLAIN אוהב" },
      body: {
        en: `<p>Most "the DB is slow" tickets are a handful of query shapes. A predicate is <strong>sargable</strong> (Search ARGument ABLE) when the indexed column stands alone on one side of the comparison:</p>
<pre>${C.anti}</pre>
<ul><li><strong>Functions on indexed columns</strong> — <code>lower(email) = …</code>, <code>created_at::date = …</code>, <code>amount * 1.17 &gt; …</code>. Rewrite as a range or move the math to the constant, or build an expression index: <code>CREATE INDEX ON users (lower(email))</code>.</li>
<li><strong>Implicit casts</strong> — a bigint column compared to a numeric parameter (common with ORMs and BigDecimal), or in MySQL a VARCHAR phone column compared to a number (<code>WHERE phone = 0501234567</code>): every row is cast, the index is ignored, and leading zeros vanish. Match parameter types to column types.</li>
<li><strong>Deep OFFSET</strong> — page 5,000 reads 100,000 rows and discards them; latency grows linearly with the page number. Use keyset pagination on a unique sort key.</li>
<li><strong>SELECT *</strong> — pulls large TOASTed columns over the network, prevents index-only scans, and breaks consumers when columns are added or reordered (a Postgres view defined with * freezes the column list at creation). Name your columns.</li>
<li><strong>Correlated subqueries in SELECT</strong>, <code>NOT IN</code> with NULLs, <code>OR</code> across different columns (often better as <code>UNION ALL</code> of two indexed queries), and <code>DISTINCT</code> used to hide a fan-out bug.</li></ul>
<blockquote>⚠️ Production tip: always confirm a rewrite with <code>EXPLAIN (ANALYZE, BUFFERS)</code> on production-sized data — on a 1,000-row dev table every plan is a Seq Scan and every query is fast.</blockquote>`,
        he: `<p>רוב הטיקטים של "ה-DB איטי" הם קומץ צורות של queries. predicate הוא <strong>sargable</strong> (Search ARGument ABLE) כשהעמודה המאונדקסת עומדת לבד בצד אחד של ההשוואה:</p>
<pre>${C.anti}</pre>
<ul><li><strong>פונקציות על עמודות מאונדקסות</strong> — <code>lower(email) = …</code>, <code>created_at::date = …</code>, <code>amount * 1.17 &gt; …</code>. משכתבים לטווח או מעבירים את החישוב לצד של הקבוע, או בונים expression index: <code>CREATE INDEX ON users (lower(email))</code>.</li>
<li><strong>Implicit casts</strong> — עמודת bigint מושווית לפרמטר numeric (נפוץ עם ORMs ו-BigDecimal), או ב-MySQL עמודת טלפון VARCHAR מושווית למספר (<code>WHERE phone = 0501234567</code>): כל row עובר cast, האינדקס לא בשימוש, והאפסים המובילים נעלמים. תתאים את טיפוסי הפרמטרים לטיפוסי העמודות.</li>
<li><strong>OFFSET עמוק</strong> — עמוד 5,000 קורא 100,000 rows וזורק אותם; ה-latency גדל לינארית עם מספר העמוד. תשתמש ב-keyset pagination על מפתח מיון ייחודי.</li>
<li><strong>SELECT *</strong> — מושך עמודות TOAST גדולות דרך הרשת, מונע index-only scans, ושובר צרכנים כשמוסיפים או מסדרים מחדש עמודות (view ב-Postgres שהוגדר עם * מקפיא את רשימת העמודות ברגע היצירה). תכתוב את שמות העמודות.</li>
<li><strong>Subqueries מתואמים ב-SELECT</strong>, <code>NOT IN</code> עם NULL-ים, <code>OR</code> על עמודות שונות (לרוב עדיף <code>UNION ALL</code> של שני queries מאונדקסים), ו-<code>DISTINCT</code> שמשמש להסתיר באג fan-out.</li></ul>
<blockquote>⚠️ Production tip: תמיד תאמת שכתוב עם <code>EXPLAIN (ANALYZE, BUFFERS)</code> על נתונים בגודל של production — על טבלת dev של 1,000 rows כל plan הוא Seq Scan וכל query מהיר.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: "WITH RECURSIVE n AS (SELECT 1 AS i UNION ALL SELECT i + 1 FROM n WHERE i < 10) SELECT i, i * i AS square FROM n;", what: { en: "The smallest recursive CTE: a numbers table. Remove the WHERE and watch it never end (Ctrl+C).", he: "ה-CTE הרקורסיבי הכי קטן: טבלת מספרים. תוריד את ה-WHERE ותראה שהוא לא נגמר (Ctrl+C)." } },
    { cmd: "SELECT d::date, extract(isodow FROM d) AS dow FROM generate_series(now() - interval '6 days', now(), interval '1 day') d;", what: { en: "Generate the last 7 days — the skeleton for any zero-filled chart.", he: "מייצר את 7 הימים האחרונים — השלד לכל גרף עם אפסים." } },
    { cmd: "SELECT '{\"user\":{\"plan\":\"pro\"},\"items\":[{\"sku\":\"A\"}]}'::jsonb #>> '{user,plan}', jsonb_path_query('{\"items\":[{\"sku\":\"A\",\"qty\":2}]}', '$.items[*].sku');", what: { en: "Play with jsonb path access without creating a table.", he: "משחקים עם גישה ל-jsonb לפי path בלי ליצור טבלה." } },
    { cmd: "EXPLAIN SELECT * FROM orders WHERE created_at::date = current_date; EXPLAIN SELECT * FROM orders WHERE created_at >= current_date AND created_at < current_date + 1;", what: { en: "Compare a non-sargable and a sargable version of 'today's orders' (needs an index on created_at).", he: "משווה גרסה לא sargable וגרסה sargable של 'ההזמנות של היום' (צריך אינדקס על created_at)." } }
  ],
  mnemonic: {
    en: "\"Anchor, then repeat until empty\" for recursion; \"generate the calendar, then LEFT JOIN the facts\" for charts; \"leave the column naked\" for indexes.",
    he: "\"anchor, ואז לחזור עד שריק\" לרקורסיה; \"מייצרים לוח שנה ואז LEFT JOIN לנתונים\" לגרפים; \"משאירים את העמודה ערומה\" לאינדקסים."
  },
  pitfalls: [
    { en: "Recursive CTE without a depth guard or CYCLE clause on data that can contain a loop — it runs until it exhausts temp disk.", he: "CTE רקורסיבי בלי שמירה על עומק או CYCLE, על נתונים שיכולים להכיל לולאה — הוא רץ עד שנגמר דיסק ה-temp." },
    { en: "Comparing ->> results without a cast: they're text, so '9' > '10' and numeric filters silently return wrong rows.", he: "השוואה של תוצאות ->> בלי cast: הן text, אז '9' > '10' ופילטרים מספריים מחזירים בשקט rows לא נכונים." },
    { en: "GROUP BY date_trunc(...) for a chart without generating the buckets: empty days disappear and the chart lies.", he: "GROUP BY date_trunc(...) לגרף בלי לייצר את הדליים: ימים ריקים נעלמים והגרף משקר." },
    { en: "Wrapping an indexed column in a function or cast (created_at::date, lower(email)) and wondering why the index isn't used.", he: "לעטוף עמודה מאונדקסת בפונקציה או ב-cast (created_at::date, lower(email)) ולתהות למה האינדקס לא בשימוש." }
  ],
  interview: [
    { q: { en: "How would you find the longest login streak per user?", he: "איך היית מוצא את רצף ההתחברויות הארוך ביותר לכל משתמש?" },
      a: { en: "Gaps and islands. Dedup to one row per user per day, compute day minus ROW_NUMBER() OVER (PARTITION BY user ORDER BY day) — constant within a streak — then GROUP BY user, that constant to get each streak's start, end and length, and take the max per user (another window or DISTINCT ON).", he: "Gaps and islands. עושים dedup ל-row אחד לכל משתמש ליום, מחשבים day פחות ROW_NUMBER() OVER (PARTITION BY user ORDER BY day) — קבוע בתוך רצף — ואז GROUP BY לפי משתמש והקבוע הזה כדי לקבל התחלה, סוף ואורך של כל רצף, ולוקחים את המקסימום לכל משתמש (עוד window או DISTINCT ON)." } },
    { q: { en: "When is a CTE slower than a subquery in Postgres, and how do you control it?", he: "מתי CTE איטי יותר מ-subquery ב-Postgres, ואיך שולטים בזה?" },
      a: { en: "Before Postgres 12 every CTE was materialized — an optimization fence, so filters from the outer query couldn't be pushed in. Since 12, a non-recursive, side-effect-free CTE referenced once is inlined. If it's referenced twice it's materialized by default; add NOT MATERIALIZED to inline it anyway, or MATERIALIZED to force computing an expensive step once.", he: "לפני Postgres 12 כל CTE עבר materialization — optimization fence, כך שפילטרים מה-query החיצוני לא יכלו להיכנס פנימה. מאז 12, CTE לא רקורסיבי, בלי side effects, שמשתמשים בו פעם אחת — עובר inline. אם משתמשים בו פעמיים, ברירת המחדל היא materialization; מוסיפים NOT MATERIALIZED כדי לעשות inline בכל זאת, או MATERIALIZED כדי לחשב שלב יקר פעם אחת בלבד." } },
    { q: { en: "An API endpoint uses LIMIT 50 OFFSET n and gets slower the further users scroll. Why, and what do you change?", he: "endpoint ב-API משתמש ב-LIMIT 50 OFFSET n ונהיה איטי יותר ככל שהמשתמשים גוללים. למה, ומה משנים?" },
      a: { en: "OFFSET doesn't skip — the database produces and discards the first n rows, so cost grows linearly with depth (and rows shift between pages under concurrent inserts). Switch to keyset pagination: ORDER BY created_at DESC, id DESC and WHERE (created_at, id) &lt; (last_seen_created_at, last_seen_id), backed by an index on (created_at, id). Each page is then an index range scan of 50 rows.", he: "OFFSET לא מדלג — ה-DB מייצר וזורק את n ה-rows הראשונים, אז העלות גדלה לינארית עם העומק (ו-rows זזים בין עמודים כשיש inserts במקביל). עוברים ל-keyset pagination: ORDER BY created_at DESC, id DESC ו-WHERE (created_at, id) &lt; (last_seen_created_at, last_seen_id), עם אינדקס על (created_at, id). כל עמוד הוא אז index range scan של 50 rows." } }
  ],
  quiz: [
    { q: { en: "In a recursive CTE, when does the recursion stop?", he: "ב-CTE רקורסיבי, מתי הרקורסיה נעצרת?" },
      options: [
        { en: "After exactly 100 iterations", he: "אחרי 100 איטרציות בדיוק" },
        { en: "When an iteration of the recursive term returns no new rows", he: "כשאיטרציה של החלק הרקורסיבי לא מחזירה rows חדשים" },
        { en: "When the anchor returns NULL", he: "כשה-anchor מחזיר NULL" },
        { en: "It never stops without LIMIT", he: "הוא אף פעם לא נעצר בלי LIMIT" }
      ], answer: 1,
      explain: { en: "Each round runs the recursive term on the previous round's rows; an empty round ends it. (SQL Server additionally caps at MAXRECURSION 100 by default, MySQL at 1000.)", he: "כל סיבוב מריץ את החלק הרקורסיבי על ה-rows של הסיבוב הקודם; סיבוב ריק מסיים. (ב-SQL Server יש בנוסף תקרה של MAXRECURSION 100 כברירת מחדל, וב-MySQL של 1000.)" } },
    { q: { en: "Logins on Mar 1, 2, 3, 5, 6. With grp = day − ROW_NUMBER(), how many islands are there?", he: "התחברויות ב-1, 2, 3, 5, 6 במרץ. עם grp = day − ROW_NUMBER(), כמה islands יש?" },
      options: [ { en: "1", he: "1" }, { en: "2", he: "2" }, { en: "3", he: "3" }, { en: "5", he: "5" } ], answer: 1,
      explain: { en: "Mar 1–3 all give Feb 28; Mar 5–6 both give Mar 1. Two distinct constants = two streaks (3 days and 2 days).", he: "1–3 במרץ נותנים כולם 28 בפברואר; 5–6 במרץ נותנים 1 במרץ. שני קבועים שונים = שני רצפים (3 ימים ו-2 ימים)." } },
    { q: { en: "Which WHERE clause can use a B-tree index on orders(created_at)?", he: "איזה WHERE יכול להשתמש באינדקס B-tree על orders(created_at)?" },
      options: [
        { en: "WHERE created_at::date = '2026-03-01'", he: "WHERE created_at::date = '2026-03-01'" },
        { en: "WHERE date_trunc('day', created_at) = '2026-03-01'", he: "WHERE date_trunc('day', created_at) = '2026-03-01'" },
        { en: "WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02'", he: "WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02'" },
        { en: "WHERE extract(day FROM created_at) = 1", he: "WHERE extract(day FROM created_at) = 1" }
      ], answer: 2,
      explain: { en: "Only the range leaves the column bare (sargable). The others apply a function to every row's column, so a plain index on created_at can't be used.", he: "רק הטווח משאיר את העמודה 'ערומה' (sargable). האחרים מפעילים פונקציה על העמודה בכל row, אז אינדקס רגיל על created_at לא יכול לעזור." } },
    { q: { en: "payload->>'qty' > '10' returns rows where qty is 9. Why?", he: "payload->>'qty' > '10' מחזיר rows שבהם qty הוא 9. למה?" },
      options: [
        { en: "jsonb stores numbers as floats", he: "jsonb שומר מספרים כ-floats" },
        { en: "->> returns text, so it's a string comparison and '9' > '10'", he: "->> מחזיר text, אז זו השוואת מחרוזות ו-'9' > '10'" },
        { en: "The GIN index is stale", he: "ה-GIN index לא מעודכן" },
        { en: "-> should be used for comparisons", he: "צריך להשתמש ב--> להשוואות" }
      ], answer: 1,
      explain: { en: "Cast before comparing: (payload->>'qty')::int > 10.", he: "עושים cast לפני ההשוואה: (payload->>'qty')::int > 10." } }
  ],
  related: ["sql-basics-joins", "sql-window-functions", "db-query-debugging", "db-index-kinds", "db-indexes", "db-time-series", "pr-data-modeling"]
});

/* ---------- Glossary ---------- */
INFRA.glossary.push(
  { term: "Anti-join", track: "data", def: { en: "A query for rows that have NO match in another table (customers without orders). Write it with NOT EXISTS or LEFT JOIN … IS NULL — NOT IN breaks when the subquery returns a NULL.", he: "query שמחפש rows שאין להם התאמה בטבלה אחרת (לקוחות בלי הזמנות). כותבים עם NOT EXISTS או LEFT JOIN … IS NULL — NOT IN נשבר כשה-subquery מחזיר NULL." }, lesson: "sql-basics-joins" },
  { term: "Join fan-out", track: "data", def: { en: "Row multiplication caused by joining one-to-many relationships; aggregates over the 'one' side (SUM of order amounts) get counted once per child row. Fix by pre-aggregating to the join grain.", he: "הכפלת rows שנגרמת מ-join של קשרי one-to-many; aggregates על צד ה-'one' (SUM של סכומי הזמנות) נספרים פעם לכל row של ילד. מתקנים ב-pre-aggregation ל-grain של ה-join." }, lesson: "sql-basics-joins" },
  { term: "Upsert", track: "data", def: { en: "Insert a row, or update it if the key already exists, atomically: INSERT … ON CONFLICT DO UPDATE in Postgres, ON DUPLICATE KEY UPDATE in MySQL, MERGE in SQL Server. Requires a unique constraint.", he: "להכניס row, או לעדכן אותו אם המפתח כבר קיים, באופן אטומי: INSERT … ON CONFLICT DO UPDATE ב-Postgres, ON DUPLICATE KEY UPDATE ב-MySQL, MERGE ב-SQL Server. דורש unique constraint." }, lesson: "sql-basics-joins" },
  { term: "Window function", track: "data", def: { en: "A function computed over a set of rows related to the current row (OVER (PARTITION BY … ORDER BY …)) without collapsing them like GROUP BY: ROW_NUMBER, RANK, LAG, running SUM.", he: "פונקציה שמחושבת על קבוצת rows שקשורים ל-row הנוכחי (OVER (PARTITION BY … ORDER BY …)) בלי לכווץ אותם כמו GROUP BY: ROW_NUMBER, RANK, LAG, SUM מצטבר." }, lesson: "sql-window-functions" },
  { term: "Window frame", track: "data", def: { en: "The subset of the partition a window aggregate looks at, e.g. ROWS BETWEEN 6 PRECEDING AND CURRENT ROW. The default with ORDER BY is RANGE … CURRENT ROW, which includes tied peers — the cause of the LAST_VALUE gotcha.", he: "תת-הקבוצה של ה-partition ש-window aggregate מסתכל עליה, למשל ROWS BETWEEN 6 PRECEDING AND CURRENT ROW. ברירת המחדל עם ORDER BY היא RANGE … CURRENT ROW, שכוללת peers בשוויון — הסיבה למלכודת של LAST_VALUE." }, lesson: "sql-window-functions" },
  { term: "CTE (Common Table Expression)", track: "data", def: { en: "A named subquery defined with WITH at the top of a statement; WITH RECURSIVE lets it reference itself to walk trees and graphs. Inlined by Postgres 12+ unless MATERIALIZED.", he: "subquery עם שם שמוגדר עם WITH בראש ה-statement; WITH RECURSIVE מאפשר לו להתייחס לעצמו כדי לטייל על עצים וגרפים. מ-Postgres 12 הוא עובר inline אלא אם כתוב MATERIALIZED." }, lesson: "sql-ctes-advanced" },
  { term: "Gaps and islands", track: "data", def: { en: "The family of SQL problems about runs of consecutive values (streaks, uptime periods, free ID ranges); classic solution: value minus ROW_NUMBER() is constant within each run.", he: "משפחת בעיות SQL על רצפים של ערכים עוקבים (streaks, תקופות uptime, טווחי IDs פנויים); הפתרון הקלאסי: הערך פחות ROW_NUMBER() קבוע בתוך כל רצף." }, lesson: "sql-ctes-advanced" },
  { term: "Sargable", track: "data", def: { en: "A predicate that can use an index because the column stands alone (created_at >= X), as opposed to wrapped in a function or cast (created_at::date = X).", he: "predicate שיכול להשתמש באינדקס כי העמודה עומדת לבד (created_at >= X), בניגוד לעמודה עטופה בפונקציה או ב-cast (created_at::date = X)." }, lesson: "sql-ctes-advanced" }
);

/* ---------- On-call scenario ---------- */
INFRA.scenarios.push({
  id: "dashboard-double-counting",
  icon: "📊",
  title: { en: "Revenue dashboard shows double the money", he: "dashboard ההכנסות מראה כפול כסף" },
  start: "s1",
  steps: {
    s1: {
      text: { en: "09:05. The CFO posts in #data: \"Yesterday's revenue on the exec dashboard is ₪2.6M. We never cross ₪1.3M. Is this real? Board meeting at 14:00.\" Nothing changed in payments. Yesterday afternoon the analytics team shipped a dashboard update that adds a 'carrier' breakdown.", he: "09:05. ה-CFO כותב ב-#data: \"ההכנסות של אתמול ב-dashboard של ההנהלה הן ₪2.6M. אנחנו אף פעם לא עוברים ₪1.3M. זה אמיתי? ישיבת דירקטוריון ב-14:00.\" שום דבר לא השתנה במערכת התשלומים. אתמול אחר הצהריים צוות האנליטיקה העלה עדכון ל-dashboard שמוסיף פילוח לפי 'carrier'." },
      data: "dashboard: daily_revenue (last 4 days)\n day        | orders | revenue\n------------+--------+-----------\n 2026-11-11 | 11,902 | 1,203,410\n 2026-11-12 | 12,355 | 1,254,980\n 2026-11-13 | 12,140 | 1,231,775\n 2026-11-14 | 29,870 | 2,603,915   <- after the dashboard deploy\n\npayments service (source of truth), 2026-11-14:\n captured: 11,987 charges, ₪1,184,220",
      choices: [
        { label: { en: "Diff the dashboard query before/after yesterday's change", he: "לעשות diff לשאילתת ה-dashboard לפני ואחרי השינוי של אתמול" }, next: "s2", score: 10,
          feedback: { en: "Right instinct: the money didn't change, the query did. The payments total is the truth to reconcile against.", he: "אינסטינקט נכון: הכסף לא השתנה, ה-query השתנה. הסכום משירות התשלומים הוא האמת שמולה עושים reconciliation." } },
        { label: { en: "Tell the CFO it's probably a Black Friday preview spike", he: "להגיד ל-CFO שזה כנראה זינוק מוקדם של בלאק פריידי" }, next: "lose", score: -10,
          feedback: { en: "The payments service shows a normal day. Guessing in front of the CFO, with a board meeting today, is how wrong numbers end up in a deck.", he: "שירות התשלומים מראה יום רגיל. לנחש מול ה-CFO, כשיש ישיבת דירקטוריון היום, זו הדרך שבה מספרים שגויים נכנסים למצגת." } },
        { label: { en: "Clear the BI tool's cache and re-run", he: "לנקות את ה-cache של כלי ה-BI ולהריץ מחדש" }, next: "s2", score: 0,
          feedback: { en: "Same numbers after a fresh run — it's not stale cache. You lost 10 minutes; now look at what changed.", he: "אותם מספרים אחרי הרצה טרייה — זה לא cache ישן. הפסדת 10 דקות; עכשיו תסתכל מה השתנה." } }
      ]
    },
    s2: {
      text: { en: "The diff is one line: a new LEFT JOIN to shipments so the chart can show the carrier. Orders can be split into several shipments. What do you check first?", he: "ה-diff הוא שורה אחת: LEFT JOIN חדש ל-shipments כדי שהגרף יוכל להציג את ה-carrier. הזמנה יכולה להתפצל לכמה משלוחים. מה אתה בודק קודם?" },
      data: " SELECT o.created_at::date AS day,\n        COUNT(*)        AS orders,\n        SUM(o.amount)   AS revenue,\n+       MIN(s.carrier)  AS carrier\n FROM orders o\n+LEFT JOIN shipments s ON s.order_id = o.id\n WHERE o.status = 'paid'\n GROUP BY 1;",
      choices: [
        { label: { en: "Compare COUNT(*) with COUNT(DISTINCT o.id) on the joined rows", he: "להשוות COUNT(*) מול COUNT(DISTINCT o.id) על ה-rows אחרי ה-join" }, next: "s3", score: 10,
          feedback: { en: "The fan-out detector. If rows ≠ distinct orders, every SUM over order columns is inflated.", he: "הגלאי של fan-out. אם מספר ה-rows שונה ממספר ההזמנות השונות, כל SUM על עמודות של orders מנופח." } },
        { label: { en: "Change SUM(o.amount) to SUM(DISTINCT o.amount) and ship", he: "לשנות את SUM(o.amount) ל-SUM(DISTINCT o.amount) ולהעלות" }, next: "s3b", score: -5,
          feedback: { en: "That dedups amounts, not orders. Let's see what it does to the numbers.", he: "זה עושה dedup לסכומים, לא להזמנות. בוא נראה מה זה עושה למספרים." } }
      ]
    },
    s3: {
      text: { en: "Confirmed: the join multiplies each order by its number of shipments. On a 4-order sample the true revenue is ₪499.80 and the dashboard says ₪1,099.70. How do you fix the query?", he: "מאומת: ה-join מכפיל כל הזמנה במספר המשלוחים שלה. במדגם של 4 הזמנות, ההכנסה האמיתית היא ₪499.80 וה-dashboard מראה ₪1,099.70. איך מתקנים את ה-query?" },
      data: "-- sample of 4 orders\n rows | distinct_orders | revenue | sum_distinct\n------+-----------------+---------+--------------\n    7 |               4 | 1099.70 |       399.90\n\n id | amount | shipments\n----+--------+-----------\n  1 |  99.90 |         2\n  2 |  99.90 |         1\n  3 | 250.00 |         3\n  4 |  50.00 |         1\n\n-- full day: 29,870 rows vs 11,987 distinct orders",
      choices: [
        { label: { en: "Pre-aggregate shipments to one row per order in a CTE, then join", he: "לעשות pre-aggregation ל-shipments ל-row אחד לכל הזמנה ב-CTE, ואז join" }, next: "s4", score: 10,
          feedback: { en: "Correct: bring the 'many' side to the order grain first, then the join is one-to-one and SUM is safe.", he: "נכון: קודם מביאים את צד ה-'many' ל-grain של ההזמנה, ואז ה-join הוא one-to-one ו-SUM בטוח." } },
        { label: { en: "Use SUM(DISTINCT o.amount) — the sample shows it removes the duplicates", he: "להשתמש ב-SUM(DISTINCT o.amount) — המדגם מראה שזה מוריד את הכפילויות" }, next: "s3b", score: -5,
          feedback: { en: "Look at the sample again: sum_distinct is 399.90, not 499.80.", he: "תסתכל שוב על המדגם: sum_distinct הוא 399.90, לא 499.80." } }
      ]
    },
    s3b: {
      text: { en: "With SUM(DISTINCT) the number dropped too far: orders 1 and 2 both cost ₪99.90 and collapsed into one. Yesterday now shows ₪876K — under-counted by 26%, because many orders share price points.", he: "עם SUM(DISTINCT) המספר ירד יותר מדי: הזמנות 1 ו-2 עלו שתיהן ₪99.90 והתמזגו לאחת. אתמול מראה עכשיו ₪876K — ספירת חסר של 26%, כי להרבה הזמנות יש אותו מחיר." },
      data: " revenue (true) | SUM(o.amount) after join | SUM(DISTINCT o.amount)\n----------------+--------------------------+------------------------\n         499.80 |                  1099.70 |                 399.90",
      choices: [
        { label: { en: "Revert and pre-aggregate shipments per order instead", he: "לבטל ולעשות במקום זה pre-aggregation ל-shipments לכל הזמנה" }, next: "s4", score: 5,
          feedback: { en: "Good recovery. DISTINCT on a measure is never a fan-out fix.", he: "התאוששות טובה. DISTINCT על מדד הוא אף פעם לא תיקון ל-fan-out." } },
        { label: { en: "Ship it — lower is safer than higher before a board meeting", he: "להעלות — נמוך בטוח יותר מגבוה לפני ישיבת דירקטוריון" }, next: "lose", score: -10,
          feedback: { en: "Wrong in the other direction is still wrong, and the board sees a fake 26% drop.", he: "שגוי לכיוון השני עדיין שגוי, והדירקטוריון רואה ירידה מדומה של 26%." } }
      ]
    },
    s4: {
      text: { en: "The fixed query matches the payments service to the shekel. It's 11:30. What do you do before closing the incident?", he: "ה-query המתוקן מתאים לשירות התשלומים עד השקל. השעה 11:30. מה אתה עושה לפני שסוגרים את האירוע?" },
      data: "WITH ship AS (\n  SELECT order_id, COUNT(*) AS shipments, MIN(carrier) AS carrier\n  FROM shipments GROUP BY order_id\n)\nSELECT o.created_at::date AS day, COUNT(*) AS orders,\n       SUM(o.amount) AS revenue, SUM(s.shipments) AS shipments\nFROM orders o LEFT JOIN ship s ON s.order_id = o.id\nWHERE o.status = 'paid' GROUP BY 1;\n\n day        | orders | revenue   | shipments\n------------+--------+-----------+-----------\n 2026-11-14 | 11,987 | 1,184,220 |    29,870",
      choices: [
        { label: { en: "Deploy the fix, tell the CFO the correct number and the cause, and add a grain test (rows = distinct order ids) plus a daily reconciliation against payments", he: "להעלות את התיקון, למסור ל-CFO את המספר הנכון ואת הסיבה, ולהוסיף grain test (מספר rows = מספר order ids שונים) ו-reconciliation יומי מול התשלומים" }, next: "win", score: 10,
          feedback: { en: "Fix, communicate, prevent. The next fan-out fails a test in CI instead of reaching the board.", he: "מתקנים, מתקשרים, מונעים. ה-fan-out הבא ייכשל בטסט ב-CI במקום להגיע לדירקטוריון." } },
        { label: { en: "Deploy the fix quietly and close the ticket", he: "להעלות את התיקון בשקט ולסגור את הטיקט" }, next: "lose", score: -5,
          feedback: { en: "Finance already exported the ₪2.6M into the board deck at 10:00. Nobody told them it was wrong.", he: "צוות הכספים כבר ייצא את ה-₪2.6M למצגת הדירקטוריון ב-10:00. אף אחד לא אמר להם שזה שגוי." } }
      ]
    },
    win: { text: { en: "The board deck shows ₪1.18M with a footnote. The dbt test 'unique order_id in fct_daily_orders' now guards the model, and a nightly job alerts if dashboard revenue drifts more than 0.5% from captured payments. Postmortem title: 'Know your grain'.", he: "במצגת הדירקטוריון מופיע ₪1.18M עם הערת שוליים. טסט ה-dbt 'unique order_id in fct_daily_orders' שומר עכשיו על המודל, ו-job לילי מתריע אם ההכנסות ב-dashboard סוטות ביותר מ-0.5% מהתשלומים שנגבו. כותרת ה-postmortem: 'תדע מה ה-grain שלך'." }, end: "win" },
    lose: { text: { en: "The wrong revenue number reached the board. The fix is a 3-line CTE; the trust in the dashboard takes months to rebuild. Lesson: reconcile against the source of truth, find the fan-out with COUNT(*) vs COUNT(DISTINCT id), pre-aggregate, and communicate.", he: "מספר ההכנסות השגוי הגיע לדירקטוריון. התיקון הוא CTE של 3 שורות; האמון ב-dashboard ייבנה מחדש במשך חודשים. הלקח: עושים reconciliation מול מקור האמת, מוצאים fan-out עם COUNT(*) מול COUNT(DISTINCT id), עושים pre-aggregation, ומתקשרים." }, end: "lose" }
  },
  lessons: ["sql-basics-joins", "sql-ctes-advanced", "sql-window-functions"]
});

})();
