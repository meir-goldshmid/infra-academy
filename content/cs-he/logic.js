CQ.unitHe({
  id: 'logic',
  order: 1,
  title: 'לוגיקה ואלגברה בוליאנית',
  emoji: '🧠',
  color: '#7c5cff',
  tagline: 'המתמטיקה שמסתתרת בתוך כל if',
  lessons: [
    // ─────────────────────────────────────────────────────────────
    {
      id: 'propositions',
      title: 'אמת, שקר ופסוקים',
      emoji: '💡',
      steps: [
        { type: 'learn', title: 'ברוכים הבאים ללוגיקה 👋', html: `
<p>כתבת כבר אלפי משפטי <code>if</code>. מזל טוב: אתה כבר לוגיקן, פשוט אף פעם לא קיבלת תעודה.</p>
<p><b>פסוק</b> (proposition) הוא טענה שהיא <b>אמת</b> או <b>שקר</b>. לא שניהם, לא "תלוי", ולא "אצלי זה עובד".</p>
<ul><li>"פורט 443 פתוח על web-1" ✅ פסוק</li><li>"2 + 2 = 5" ✅ פסוק (שקרי, אבל פסוק!)</li><li>"תעשה ריסטרט לפוד" ❌ פקודה</li><li>"Redis למעלה?" ❌ שאלה</li></ul>
<div class="dev">את זה אתה כבר מכיר: endpoint של health check מחזיר פסוק. "השירות בריא" הוא אמת (200) או שקר (503).</div>` },
        { type: 'mcq', q: 'איזה מהבאים הוא פסוק?',
          choices: ['תעשה rollback לדיפלוי', 'ה-DB למעלה?', 'בקלאסטר יש 12 nodes', 'x + 1'], answer: 2,
          explain: `"בקלאסטר יש 12 nodes" הוא אמת או שקר. השאר הם פקודה, שאלה, וביטוי שמחזיר מספר (לא ערך אמת).` },
        { type: 'learn', title: 'משתנים וקשרים', html: `
<p>לוגיקנים נותנים לפסוקים שמות של אותיות: נגיד <b>p</b> = "הדיפלוי הצליח", <b>q</b> = "הטסטים עברו".</p>
<p>ואז מדביקים אותם עם <b>קשרים</b> (connectives) לפסוקים מורכבים:</p>
<table><tr><th>לוגיקה</th><th>קוראים</th><th>קוד</th></tr>
<tr><td>¬p</td><td>NOT p</td><td><code>!p</code></td></tr>
<tr><td>p ∧ q</td><td>p AND q</td><td><code>p &amp;&amp; q</code></td></tr>
<tr><td>p ∨ q</td><td>p OR q</td><td><code>p || q</code></td></tr></table>
<div class="callout">טריק לזכור: ∧ נראה כמו ה-A של <b>A</b>ND. ∨ זה השני.</div>` },
        { type: 'input', q: 'איזה אופרטור ב-JavaScript מתאים לסמל הלוגי ∧ ?', answer: ['&&'], placeholder: 'אופרטור',
          explain: `∧ זה AND, שב-JS, C, Java, Go, Bash וחברים נכתב <code>&amp;&amp;</code>. (ב-Python כותבים <code>and</code>.)` },
        { type: 'mcq', q: 'p = "הדיפלוי הצליח", q = "הטסטים עברו". תרגם: "הטסטים עברו, אבל הדיפלוי נכשל."',
          choices: ['p ∧ ¬q', 'q ∧ ¬p', 'q ∨ ¬p', '¬(p ∧ q)'], answer: 1,
          explain: `"הטסטים עברו" זה q, "הדיפלוי נכשל" זה ¬p, וה"אבל" מדביק אותם עם AND: q ∧ ¬p.` },
        { type: 'tf', q: 'בלוגיקה, המילה "אבל" פירושה AND.', answer: true,
          explain: `"אבל" מוסיף טון ("באופן מפתיע…"), אבל לוגית זה רק אומר ששני החלקים נכונים. ללוגיקה לא אכפת מהטון שלך.` },
        { type: 'learn', title: 'לא לכל דבר יש ערך אמת', html: `
<p>יש משפטים שנראים כמו פסוקים אבל הם שבורים. הקלאסיקה: <b>"המשפט הזה שקרי."</b></p>
<p>אם הוא אמת, אז הוא שקר. אם הוא שקר, אז הוא אמת. זה אף פעם לא מתייצב. לוגיקנים קוראים לזה <b>פרדוקס השקרן</b> ומוציאים אותו מהגדרת פסוק.</p>
<div class="dev">את זה אתה כבר מכיר: health check מהבהב (flapping) שמסמן את עצמו לא-בריא בכל פעם שהוא בריא. אין מצב יציב.</div>
<div class="fun">🤓 עובדה משעשעת: ג׳ורג׳ בול פרסם את "חוקי המחשבה" ב-1854. מאה שנה אחר כך האלגברה שלו הפכה למעגלים בתוך כל CPU. ומכאן "boolean".</div>` },
        { type: 'tf', q: '"המשפט הזה שקרי" הוא פסוק תקין.', answer: false,
          explain: `הוא לא יכול להיות באופן עקבי לא אמת ולא שקר, ולכן הוא לא נחשב פסוק. זה פרדוקס השקרן.` },
        { type: 'mcq', q: 'p = "CPU > 90%", q = "התראה קופצת". איזו נוסחה אומרת "ה-CPU לא מעל 90%, ובכל זאת קופצת התראה"?',
          choices: ['¬p ∧ q', '¬(p ∧ q)', 'p ∨ q', '¬p ∨ ¬q'], answer: 0,
          explain: `"לא מעל 90%" זה ¬p, "קופצת התראה" זה q, ו"ובכל זאת" הוא עוד AND בתחפושת: ¬p ∧ q. ידוע גם בשם "התראה רועשת".` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'truth-tables',
      title: 'AND, OR, NOT, XOR וטבלאות אמת',
      emoji: '📋',
      steps: [
        { type: 'learn', title: 'טבלאות אמת', html: `
<p><b>טבלת אמת</b> (truth table) מפרטת כל צירוף של קלטים ואת הפלט שיוצא. בעצם unit testing ממצה ללוגיקה.</p>
<table><tr><th>p</th><th>q</th><th>p ∧ q</th><th>p ∨ q</th></tr>
<tr><td>F</td><td>F</td><td>F</td><td>F</td></tr>
<tr><td>F</td><td>T</td><td>F</td><td>T</td></tr>
<tr><td>T</td><td>F</td><td>F</td><td>T</td></tr>
<tr><td>T</td><td>T</td><td>T</td><td>T</td></tr></table>
<p><b>AND</b> בררן: אמת רק אם שניהם אמת. <b>OR</b> זורם: אמת אם לפחות אחד אמת. <b>NOT</b> פשוט הופך.</p>` },
        { type: 'widget', widget: 'truth', title: 'שחק עם המתגים', html: '<p>הדלק וכבה את A ו-B ותראה איך כל אופרטור מגיב. נסה לנחש כל פלט לפני שאתה לוחץ!</p>' },
        { type: 'mcq', q: 'p אמת ו-q אמת. מה ערכו של p ∨ q?',
          choices: ['אמת', 'שקר', 'לא מוגדר'], answer: 0,
          explain: `OR לוגי הוא <b>כוללני</b> (inclusive): "לפחות אחד". גם שניהם אמת נחשב. "או" בשפה רגילה (מרק או סלט?) הוא הרבה פעמים בלעדי; ה-OR של הלוגיקה לא.` },
        { type: 'learn', title: 'XOR: הגלאי של "הם שונים?"', html: `
<p><b>XOR</b> (exclusive or, נכתב ⊕) הוא אמת כאשר <b>בדיוק אחד</b> מהקלטים אמת.</p>
<table><tr><th>p</th><th>q</th><th>p ⊕ q</th></tr>
<tr><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>T</td><td>T</td></tr>
<tr><td>T</td><td>F</td><td>T</td></tr><tr><td>T</td><td>T</td><td>F</td></tr></table>
<p>דרך אחרת לקרוא את זה: p ⊕ q אמת כש-p ו-q <b>שונים</b>. ברוב השפות זה <code>^</code> על ביטים, או <code>a !== b</code> על בוליאנים.</p>
<div class="dev">את זה אתה כבר מכיר: בדיקת config drift. הרצוי והמצוי שונים ← XOR הוא 1 ← reconcile!</div>` },
        { type: 'tf', q: 'נכון או לא: true ⊕ true = true', answer: false,
          explain: `XOR אמת רק כשבדיוק קלט אחד אמת. שני true זהים, אז XOR נותן false.` },
        { type: 'mcq', q: 'איזה ביטוי אמת בדיוק כש-p ו-q שונים (כלומר שווה ל-p ⊕ q)?',
          choices: ['p ∧ q', '(p ∨ q) ∧ ¬(p ∧ q)', '¬p ∨ q', 'p ∨ q'], answer: 1,
          explain: `"לפחות אחד אמת" AND "לא שניהם אמת" = בדיוק אחד אמת. זה XOR שבנוי מ-AND, OR ו-NOT.` },
        { type: 'learn', title: 'כמה גדולה טבלת אמת?', html: `
<p>כל משתנה יכול להיות T או F. שני משתנים נותנים 2 × 2 = 4 שורות. שלושה נותנים 2 × 2 × 2 = 8.</p>
<div class="formula">n variables → 2ⁿ rows</div>
<div class="dev">את זה אתה כבר מכיר: 10 feature flags זה 2¹⁰ = 1024 קונפיגורציות אפשריות. בגלל זה אף אחד לא בודק את כולן (ובגלל זה שילובי flags עושים תקלות).</div>` },
        { type: 'input', q: 'כמה שורות יש בטבלת אמת עם 3 משתנים?', answer: ['8', 'eight', 'שמונה'], placeholder: 'מספר',
          explain: `2³ = 8 שורות: כל צירוף של T/F לשלושה קלטים.` },
        { type: 'learn', title: 'NAND שולט בכולם', html: `
<p><b>NAND</b> = NOT AND: שקר רק כששני הקלטים אמת.</p>
<p>עובדה מטורפת: עם <b>שערי NAND בלבד</b> אפשר לבנות NOT, AND, OR, XOR... כל פונקציה בוליאנית שקיימת. NOT p זה פשוט p NAND p.</p>
<div class="fun">🤓 עובדה משעשעת: הקורס המפורסם "From NAND to Tetris" (שנולד אגב בישראל) בונה מחשב שלם, ואז משחק, מכלום חוץ מ-NAND. גם NOR אוניברסלי באותה צורה.</div>` },
        { type: 'tf', q: 'בעזרת פעולות NAND בלבד אפשר לבטא כל פונקציה בוליאנית.', answer: true,
          explain: `NAND הוא "שלם פונקציונלית" (functionally complete). NOT p = p NAND p, ומשם נגזרים AND ו-OR. מתכנני שבבים מתים על זה.` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'implication',
      title: 'אם-אז: גרירה',
      emoji: '➡️',
      steps: [
        { type: 'learn', title: 'p → q', html: `
<p><b>גרירה</b> (implication) p → q נקראת "אם p, אז q". תחשוב על זה כעל <b>הבטחה</b>. הדרך היחידה להפר הבטחה: p קרה, ו-q לא.</p>
<table><tr><th>p</th><th>q</th><th>p → q</th></tr>
<tr><td>T</td><td>T</td><td>T</td></tr><tr><td>T</td><td>F</td><td><b>F</b></td></tr>
<tr><td>F</td><td>T</td><td>T</td></tr><tr><td>F</td><td>F</td><td>T</td></tr></table>
<div class="callout">p → q שקרי בדיוק בשורה אחת: p אמת, q שקר.</div>` },
        { type: 'mcq', q: 'מתי p → q שקרי?',
          choices: ['p שקר, q אמת', 'p אמת, q שקר', 'שניהם שקר', 'שניהם אמת'], answer: 1,
          explain: `ההבטחה "אם p אז q" מופרת רק כש-p מתקיים ו-q לא.` },
        { type: 'learn', title: 'השורות המוזרות', html: `
<p>למה p → q <b>אמת</b> כש-p שקר? כי ההבטחה אף פעם לא נבחנה.</p>
<p>המנהל שלך אומר: "אם אתה בכוננות בסופ״ש, אני קונה לך פיצה." לא היית בכוננות. פיצה או לא פיצה, ההבטחה לא הופרה. זה נקרא <b>אמת ריקה</b> (vacuous truth).</p>
<div class="dev">את זה אתה כבר מכיר: חוק SLO "אם latency > 500ms אז מעירים מישהו". ביום רגוע בלי page, החוק לא מופר. ואם מישהו קיבל page בכל זאת מסיבה אחרת, החוק הזה עדיין לא מופר (סתם pager רועש).</div>` },
        { type: 'tf', q: '"אם 2 + 2 = 5, אז הירח עשוי מגבינה" היא טענה אמיתית בלוגיקה.', answer: true,
          explain: `ההנחה שקרית, ולכן הגרירה אמיתית באופן ריק. ללוגיקה לא אכפת שהירח לא עשוי מגבינה.` },
        { type: 'learn', title: 'הפוך, קונטרפוזיציה ושכתוב שימושי', html: `
<p>מתחילים מ-p → q. הקרובים שלו:</p>
<ul><li><b>קונטרפוזיציה</b> (contrapositive): ¬q → ¬p. <b>תמיד שקולה</b> למקור.</li>
<li><b>ההפוך</b> (converse): q → p. לא שקול!</li>
<li><b>השלילה ההפוכה</b> (inverse): ¬p → ¬q. גם לא שקולה (היא שווה להפוך).</li></ul>
<p>והשכתוב שהופך כל גרירה לקוד:</p>
<div class="formula">p → q  ≡  ¬p ∨ q</div>
<div class="dev">את זה אתה כבר מכיר: <code>assert(!isProd || tlsEnabled)</code> אומר "אם זה prod, אז TLS חייב להיות דלוק".</div>` },
        { type: 'mcq', q: '"אם ה-build ירוק, אז הטסטים עברו." מה שקול לוגית?',
          choices: ['אם הטסטים עברו, ה-build ירוק.', 'אם ה-build לא ירוק, הטסטים לא עברו.', 'אם הטסטים לא עברו, ה-build לא ירוק.', 'ה-build ירוק והטסטים עברו.'], answer: 2,
          explain: `זו הקונטרפוזיציה (¬q → ¬p), שתמיד תואמת למקור. האפשרות הראשונה היא ההפוך והשנייה היא השלילה ההפוכה: טסטים יכולים לעבור בזמן שה-lint עדיין שובר את ה-build.` },
        { type: 'tf', q: 'ההפוך של p → q (כלומר q → p) שקול לוגית ל-p → q.', answer: false,
          explain: `"אם זה Postgres, אז זה database" נכון. ההפוך "אם זה database, אז זה Postgres" לא נכון (היי, MySQL). לבלבל ביניהם זה באג חשיבה קלאסי.` },
        { type: 'learn', title: 'אם ורק אם', html: `
<p><b>הדו-תנאי</b> (biconditional) p ⇔ q ("p אם ורק אם q", באנגלית בקיצור "iff") אמת כש-p ו-q בעלי <b>אותו</b> ערך.</p>
<p>זה (p → q) ∧ (q → p), הבטחה לשני הכיוונים. שים לב שזה בדיוק ההפך של XOR. בגלל זה קוראים לו גם <b>XNOR</b>.</p>
<div class="dev">את זה אתה כבר מכיר: "הפוד מקבל traffic אם ורק אם ה-readiness probe שלו עובר". מוכן ⇒ traffic, ו-traffic ⇒ מוכן.</div>` },
        { type: 'input', q: 'p שקר ו-q שקר. מה ערכו של p → q? (true/false)', answer: ['true', 't', '1', 'אמת'], placeholder: 'true או false',
          explain: `ההנחה שקרית, ולכן הגרירה אמיתית באופן ריק.` },
        { type: 'mcq', q: 'איזה ביטוי שקול ל-p → q?',
          choices: ['¬p ∨ q', 'p ∨ ¬q', '¬p ∧ q', 'p ∧ ¬q'], answer: 0,
          explain: `¬p ∨ q שקרי רק כש-p אמת ו-q שקר, שזו בדיוק השורה השקרית היחידה של p → q. (p ∧ ¬q הוא השלילה של p → q.)` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'de-morgan',
      title: 'חוקי דה מורגן',
      emoji: '🔀',
      steps: [
        { type: 'learn', title: 'להכניס את ה-NOT פנימה', html: `
<p>אוגוסטוס דה מורגן נתן לנו את שני חוקי ה-refactoring הכי שימושיים בהיסטוריה:</p>
<div class="formula">¬(A ∧ B) ≡ ¬A ∨ ¬B</div>
<div class="formula">¬(A ∨ B) ≡ ¬A ∧ ¬B</div>
<p>לזכור: כשה-NOT נכנס לסוגריים, הוא <b>הופך כל אופרנד</b> ו<b>מחליף AND ↔ OR</b>.</p>
<p>"לא נכון ש-(Redis AND Postgres למעלה)" = "Redis למטה OR Postgres למטה".</p>` },
        { type: 'tf', q: 'לכל שני בוליאנים a ו-b: !(a && b) === (!a || !b)', answer: true,
          explain: `זה חוק דה מורגן הראשון. לא מאמין? תבדוק את כל 4 הצירופים. זה מחזיק כל פעם.` },
        { type: 'learn', title: 'Refactoring עם דה מורגן', html: `
<p>שלילות כפולות בתנאים גורמות ל-reviewers להזיע:</p>
<pre><code>if (!(user.isAdmin || user.isOwner)) {
  return deny();
}</code></pre>
<p>מפעילים דה מורגן: ה-NOT הופך כל חלק, ה-OR הופך ל-AND.</p>
<pre><code>if (!user.isAdmin &amp;&amp; !user.isOwner) {
  return deny();
}</code></pre>
<div class="dev">את זה אתה כבר מכיר: זה אותו חוק שהופך "תאשר אם admin OR owner" ל-guard clause "תדחה אם לא admin AND לא owner".</div>` },
        { type: 'mcq', q: 'מה שקול ל-!(status === 200 && body !== "")?',
          choices: ['status !== 200 && body === ""', 'status !== 200 || body === ""', 'status === 200 || body !== ""', 'status !== 200 || body !== ""'], answer: 1,
          explain: `הופכים כל השוואה (=== ↔ !==) ומחליפים && ב-||. התגובה גרועה אם הסטטוס שגוי OR ה-body ריק.` },
        { type: 'learn', title: 'עוד חוקים של האלגברה', html: `
<table><tr><th>חוק</th><th>כלל</th></tr>
<tr><td>שלילה כפולה</td><td>¬¬p ≡ p</td></tr>
<tr><td>זהות</td><td>p ∧ T ≡ p, p ∨ F ≡ p</td></tr>
<tr><td>שליטה</td><td>p ∨ T ≡ T, p ∧ F ≡ F</td></tr>
<tr><td>פילוג</td><td>p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)</td></tr>
<tr><td>בליעה</td><td>p ∨ (p ∧ q) ≡ p</td></tr></table>
<p>אלה ה"אלגברה" שבאלגברה בוליאנית: אפשר לפשט תנאים באופן סימבולי, בדיוק כמו לפשט 2x + 3x = 5x.</p>` },
        { type: 'mcq', q: 'מה שקול ל-!(x > 5 || y <= 3)?',
          choices: ['x <= 5 || y > 3', 'x <= 5 && y > 3', 'x < 5 && y > 3', 'x > 5 && y <= 3'], answer: 1,
          explain: `OR הופך ל-AND, וכל השוואה מתהפכת: ההפך של x > 5 הוא x <= 5 (זהירות, לא x < 5!), וההפך של y <= 3 הוא y > 3.` },
        { type: 'tf', q: 'האם מתקיים: ¬(A ∨ B) ≡ ¬A ∨ ¬B', answer: false,
          explain: `כשה-NOT נכנס פנימה, OR חייב להפוך ל-AND: ¬(A ∨ B) ≡ ¬A ∧ ¬B. לשכוח להחליף את האופרטור זה באג דה מורגן מספר 1.` },
        { type: 'input', q: 'פשט את ¬¬p', answer: ['p'], placeholder: 'ביטוי',
          explain: `שלילה כפולה: לא-לא-p זה פשוט p. כמו <code>!!x</code> ב-JS, שמחזיר את ה-truthiness של x.` },
        { type: 'mcq', q: 'פשט: isProd || (isProd && isEU)',
          choices: ['isProd', 'isProd && isEU', 'isEU', 'true'], answer: 0,
          explain: `בליעה: p ∨ (p ∧ q) ≡ p. אם isProd אמת, הכול אמת; אם isProd שקר, גם החלק השני שקר. ל-isEU אין שום השפעה.` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'short-circuit',
      title: 'הערכה מקוצרת (Short-Circuit)',
      emoji: '⚡',
      steps: [
        { type: 'learn', title: 'אופרטורים עצלנים', html: `
<p>הלוגיקה אומרת: F ∧ כלום-לא-משנה = F, ו-T ∨ כלום-לא-משנה = T. שפות תכנות מנצלות את זה כדי <b>לחסוך עבודה</b>:</p>
<ul><li><code>a &amp;&amp; b</code>: אם a שקר, b <b>אף פעם לא מחושב</b>.</li>
<li><code>a || b</code>: אם a אמת, b <b>אף פעם לא מחושב</b>.</li></ul>
<p>זו <b>הערכה מקוצרת</b> (short-circuit evaluation), ובגללה <code>user &amp;&amp; user.name</code> לא קורס על user שהוא null.</p>` },
        { type: 'mcq', q: 'ב-JS, האם false && launchMissiles() קורא ל-launchMissiles?',
          choices: ['כן, תמיד', 'לא, אף פעם', 'רק ב-strict mode'], answer: 1,
          explain: `הצד השמאלי שקר, אז כבר ידוע שהתוצאה שקר. הצד הימני מדולג. שלום עולמי נשמר.` },
        { type: 'learn', title: 'גם ה-shell שלך עושה את זה', html: `
<p>ב-Bash, exit code 0 פירושו הצלחה (בערך "אמת"). אז:</p>
<pre><code>make build &amp;&amp; make deploy   # deploy only if build succeeds
cd /app || exit 1           # bail out if cd fails</code></pre>
<div class="dev">את זה אתה כבר מכיר: כל שורת <code>RUN apt-get update &amp;&amp; apt-get install -y ...</code> ב-Dockerfile היא לוגיקה מקוצרת. פקודה אחת שנכשלת עוצרת את השרשרת.</div>` },
        { type: 'tf', q: 'ב-Bash, ב-make test || echo "tests failed", ה-echo רץ רק אם make test נכשל.', answer: true,
          explain: `|| מריץ את הצד הימני רק כשהצד השמאלי "שקר", כלומר יוצא עם קוד שונה מאפס.` },
        { type: 'learn', title: 'הסדר חשוב', html: `
<p>כיוון שההערכה היא משמאל לימין ועצלנית:</p>
<ul><li>שים <b>guards קודם</b>: <code>user != null &amp;&amp; user.isAdmin</code></li>
<li>שים <b>בדיקות זולות קודם</b>: <code>flagEnabled &amp;&amp; await expensiveDbCheck()</code></li>
<li>היזהר מ-<b>side effects</b> בצד ימין: יכול להיות שהם לעולם לא ירוצו.</li></ul>
<p>שים לב: ב-C, Java ואחרות, <code>&amp;</code> ו-<code>|</code> בודדים הם bitwise/לא מקוצרים ומחשבים את שני הצדדים.</p>` },
        { type: 'mcq', q: 'user עלול להיות null. איזו שורה בטוחה?',
          choices: ['if (user.isAdmin && user != null)', 'if (user != null && user.isAdmin)', 'שתיהן בטוחות באותה מידה'], answer: 1,
          explain: `ה-guard חייב לבוא ראשון. באפשרות הראשונה, user.isAdmin מחושב לפני בדיקת ה-null וזורק TypeError כש-user הוא null.` },
        { type: 'learn', title: 'טוויסט של JS: || מחזיר ערך', html: `
<p>ב-JS (וב-Python), <code>a || b</code> מחזיר <b>את האופרנד ה-truthy הראשון</b> (או את האחרון), לא בוליאני טהור. מכאן ברירות מחדל כמו:</p>
<pre><code>const port = process.env.PORT || 8080;</code></pre>
<p>מלכודת: 0, "" ו-NaN הם falsy, אז <code>0 || 8080</code> הוא 8080 גם אם ה-0 היה מכוון. האופרטור nullish <code>??</code> נופל לברירת המחדל רק על null/undefined.</p>
<div class="dev">את זה אתה כבר מכיר: הבאג בקונפיג שבו "retries: 0 הפך בשקט ל-retries: 3". זה היה ה-||.</div>` },
        { type: 'input', q: 'ב-JavaScript, למה מוערך 0 || 8080?', answer: ['8080'], placeholder: 'ערך',
          explain: `0 הוא falsy, אז || ממשיך הלאה ומחזיר 8080.` },
        { type: 'tf', q: 'ב-JavaScript, 0 ?? 8080 מוערך ל-8080.', answer: false,
          explain: `?? נופל לברירת המחדל רק כשהצד השמאלי הוא null או undefined. 0 הוא לא אף אחד מהם, אז התוצאה 0.` },
        { type: 'mcq', q: 'אתה רוצה לדלג על שליפה יקרה מה-DB כשה-feature flag כבוי. מה עדיף?',
          choices: ['flagOn && (await dbCheck())', '(await dbCheck()) && flagOn'], answer: 0,
          explain: `כשה-flag הזול ראשון, flag כבוי עושה short-circuit וה-DB לא נשאל בכלל. הסדר השני תמיד משלם על השאילתה.` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'bitwise',
      title: 'פעולות Bitwise, מסכות ו-Flags',
      emoji: '🎚️',
      steps: [
        { type: 'learn', title: 'לוגיקה, אבל על כל ביט בבת אחת', html: `
<p>אופרטורי bitwise מפעילים לוגיקה על כל מיקום ביט בנפרד:</p>
<pre><code>  1100   (12)        1100        1100
&amp; 1010   (10)      | 1010      ^ 1010
= 1000   (8)       = 1110 (14) = 0110 (6)</code></pre>
<p>וגם: <code>~x</code> הופך כל ביט, <code>x &lt;&lt; n</code> מזיז שמאלה, <code>x &gt;&gt; n</code> מזיז ימינה.</p>
<div class="callout">&amp;&amp; עובד על ערכי אמת שלמים; &amp; עובד ביט אחרי ביט. פקודת CPU אחת מטפלת ב-64 ביטים בבת אחת.</div>` },
        { type: 'widget', widget: 'bits', title: 'תהפוך כמה ביטים', html: '<p>תבנה בראש 12 (00001100) ו-10 (00001010), ואז תדליק רק את הביטים המשותפים להם. אתה אמור לנחות על 8.</p>' },
        { type: 'input', q: 'כמה זה 6 & 3 בעשרוני? (6 = 110, 3 = 011)', answer: ['2', 'two', 'שתיים', 'שניים'], placeholder: 'מספר',
          explain: `110 & 011 = 010 = 2. רק הביט האמצעי דלוק בשניהם.` },
        { type: 'learn', title: 'Flags ומסכות', html: `
<p>דוחסים הרבה בוליאנים לתוך integer אחד, ביט לכל אחד. הרשאות Unix עושות בדיוק את זה: <b>r = 4</b> (100), <b>w = 2</b> (010), <b>x = 1</b> (001).</p>
<table><tr><th>מטרה</th><th>קוד</th></tr>
<tr><td>לבדוק flag</td><td><code>perms &amp; 4</code> (לא אפס ← דלוק)</td></tr>
<tr><td>להדליק flag</td><td><code>perms | 1</code></td></tr>
<tr><td>לכבות flag</td><td><code>perms &amp; ~2</code></td></tr>
<tr><td>להפוך flag</td><td><code>perms ^ 1</code></td></tr></table>
<div class="dev">את זה אתה כבר מכיר: Linux capabilities, אירועי epoll, flags של open() כמו O_CREAT | O_TRUNC, וביטי ה-infomask של Postgres הם כולם bitmasks.</div>` },
        { type: 'mcq', q: 'perms = 6 (rw-). איזה ביטוי מוסיף הרשאת הרצה?',
          choices: ['perms & 1', 'perms | 1', 'perms ^ 6', 'perms & ~1'], answer: 1,
          explain: `OR מדליק ביט: 110 | 001 = 111 = 7 (rwx). AND עם 1 רק היה בודק אותו, ו-& ~1 היה מכבה אותו.` },
        { type: 'tf', q: '7 & 4 שונה מאפס, ולכן הרשאה 7 כוללת קריאה.', answer: true,
          explain: `111 & 100 = 100 = 4, לא אפס. ביט הקריאה דלוק.` },
        { type: 'learn', title: 'Shifts ומסכות רשת', html: `
<p><code>1 &lt;&lt; n</code> שווה 2ⁿ. הזזה ימינה ב-1 מחלקת integer אי-שלילי בחצי (עם עיגול כלפי מטה).</p>
<p>רשתות זה מסכות עד הסוף. netmask של /24 הוא 24 אחדות ואחריהן 8 אפסים = 255.255.255.0. <b>כתובת הרשת</b> היא <code>ip &amp; mask</code>.</p>
<div class="dev">את זה אתה כבר מכיר: כשאתה בוחר pod CIDR ב-Kubernetes כמו 10.244.0.0/16, הקלאסטר משתמש במסכה של 16 ביטים דלוקים כדי להחליט "האם ה-IP הזה בתוך רשת הפודים?"</div>` },
        { type: 'input', q: 'כמה זה 1 << 10 בעשרוני?', answer: ['1024'], placeholder: 'מספר',
          explain: `הזזה של 1 ב-10 מקומות שמאלה נותנת 2¹⁰ = 1024.` },
        { type: 'mcq', q: 'IP 192.168.5.77 עם מסכה 255.255.255.0. מהי כתובת הרשת (ip & mask)?',
          choices: ['192.168.5.0', '192.168.0.0', '0.0.0.77', '192.168.5.255'], answer: 0,
          explain: `255 שומר על אוקטט, 0 מוחק אותו. שלושת האוקטטים הראשונים שורדים והאחרון הופך ל-0.` },
        { type: 'learn', title: 'טריקים של XOR', html: `
<p>ל-XOR יש תכונות קסומות: <b>x ^ x = 0</b>, <b>x ^ 0 = x</b>, והוא ההופכי של עצמו.</p>
<p>אז <code>(a ^ b) ^ b === a</code>: עושים XOR עם b פעמיים וחוזרים בדיוק לנקודת ההתחלה.</p>
<div class="dev">את זה אתה כבר מכיר: parity של RAID 5. parity = d1 ^ d2 ^ d3. דיסק מת? עושים XOR לשורדים עם ה-parity והמידע האבוד חוזר.</div>` },
        { type: 'tf', q: 'לכל שני מספרים שלמים a ו-b: (a ^ b) ^ b === a', answer: true,
          explain: `b ^ b = 0 ו-a ^ 0 = a. זה הבסיס ל-XOR parity ולצפני XOR פשוטים.` }
      ]
    },
    // ─────────────────────────────────────────────────────────────
    {
      id: 'quantifiers',
      title: 'פרדיקטים וכמתים ∀ ∃',
      emoji: '🌍',
      steps: [
        { type: 'learn', title: 'פסוקים עם חורים', html: `
<p>"x > 3" עוד לא פסוק. יש בו חור: x. טענה עם משתנים היא <b>פרדיקט</b> (predicate): P(x) = "x > 3". ממלאים את החור ומקבלים פסוק: P(5) אמת, P(1) שקר.</p>
<p>או ש<b>מכמתים</b> אותו:</p>
<ul><li><b>∀x P(x)</b>: "<b>לכל</b> x, P(x)" (A הפוכה, מ-All)</li>
<li><b>∃x P(x)</b>: "<b>קיים</b> x כך ש-P(x)" (E הפוכה, מ-Exists)</li></ul>` },
        { type: 'mcq', q: 'התחום: הפודים בקלאסטר שלך. Ready(p) = "הפוד p מוכן". איך כותבים "כל הפודים מוכנים"?',
          choices: ['∃p Ready(p)', '∀p Ready(p)', '∀p ¬Ready(p)', '¬∃p Ready(p)'], answer: 1,
          explain: `"כל" זה ∀. ‏∃p Ready(p) היה אומר "לפחות פוד אחד מוכן", רף הרבה יותר נמוך.` },
        { type: 'learn', title: 'אתה משתמש בכמתים כל יום', html: `
<table><tr><th>לוגיקה</th><th>JS</th><th>Python</th></tr>
<tr><td>∀x P(x)</td><td><code>xs.every(P)</code></td><td><code>all(...)</code></td></tr>
<tr><td>∃x P(x)</td><td><code>xs.some(P)</code></td><td><code>any(...)</code></td></tr></table>
<p>מקרה קצה: על תחום <b>ריק</b>, ∀ הוא <b>אמת</b> (באופן ריק, אף אחד לא הפר את הכלל) ו-∃ הוא <b>שקר</b> (אין אף אחד שיקיים אותו).</p>
<div class="dev">את זה אתה כבר מכיר: deployment עם 0 replicas מדווח "all replicas available" ✅. אמת ריקה כבר עבדה על לא מעט דשבורדים.</div>` },
        { type: 'tf', q: 'ב-JavaScript, [].every(x => x > 1000) מחזיר true.', answer: true,
          explain: `∀ על קבוצה ריקה הוא אמת באופן ריק: אין אף איבר שנכשל בבדיקה.` },
        { type: 'learn', title: 'שלילת כמתים', html: `
<p>דה מורגן תוקף שוב, הפעם עם כמתים:</p>
<div class="formula">¬∀x P(x) ≡ ∃x ¬P(x)</div>
<div class="formula">¬∃x P(x) ≡ ∀x ¬P(x)</div>
<p>"לא כל הפודים בריאים" = "יש פוד לא בריא". "אף פוד לא קורס" = "כל פוד לא קורס".</p>` },
        { type: 'mcq', q: 'מהי השלילה של "לכל שרת יש גיבוי"?',
          choices: ['לאף שרת אין גיבוי', 'יש שרת שאין לו גיבוי', 'לכל שרת אין גיבוי', 'יש שרת שיש לו גיבוי'], answer: 1,
          explain: `¬∀s Backup(s) ≡ ∃s ¬Backup(s). מספיק שרת אחד בלי גיבוי כדי לשבור את הטענה. תשאל כל מי שעבר את התקלה ההיא.` },
        { type: 'tf', q: '¬∃x P(x) שקול ל-∀x ¬P(x).', answer: true,
          explain: `"אין x שמקיים P" פירושו "כל x נכשל ב-P". הופכים את הכמת ומכניסים את ה-NOT פנימה.` },
        { type: 'learn', title: 'סדר הכמתים חשוב', html: `
<p>נגדיר H(e, i) = "המהנדס e מטפל בתקלה i". השוו:</p>
<ul><li><b>∀i ∃e H(e, i)</b>: בכל תקלה מטפל <i>מהנדס כלשהו</i> (אולי כל פעם אחר). רוטציה בריאה.</li>
<li><b>∃e ∀i H(e, i)</b>: יש מהנדס <i>אחד</i> שמטפל ב<i>כל</i> התקלות. הבנאדם הזה צריך חופש.</li></ul>
<div class="callout">החלפה בין ∀ ל-∃ משנה את המשמעות. קוראים משמאל לימין: כל כמת נבחר בידיעת הכמתים שלפניו.</div>` },
        { type: 'mcq', q: 'איזו נוסחה אומרת "מהנדס אחד ויחיד מטפל בכל התקלות"?',
          choices: ['∀i ∃e H(e, i)', '∃e ∀i H(e, i)', '∀e ∀i H(e, i)', '∃i ∃e H(e, i)'], answer: 1,
          explain: `‏∃e קודם בוחר מהנדס ספציפי אחד, ואז ∀i אומר שאותו מהנדס מטפל בכל התקלות.` },
        { type: 'input', q: 'מה מחזיר [1, 2, 3].some(x => x > 2)?', answer: ['true', 'אמת'], placeholder: 'true או false',
          explain: `‏∃x (x > 2) מתקיים כי 3 > 2. עד אחד מספיק.` }
      ]
    }
  ]
});
