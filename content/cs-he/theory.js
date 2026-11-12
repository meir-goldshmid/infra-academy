CQ.unitHe({
  id: 'theory',
  order: 13,
  title: 'תורת החישוביות',
  emoji: '🤖',
  color: '#e0457b',
  tagline: 'מה מחשבים יכולים לעשות, מה הם לא יכולים, ומה הם לא יכולים לעשות מהר',
  lessons: [
    // ───────────────────────────── Lesson 1 ─────────────────────────────
    {
      id: 'fsm',
      title: 'מכונות מצבים סופיות',
      emoji: '🚦',
      steps: [
        { type: 'learn', title: 'המחשב הכי פשוט שיש', html: `
<p>ל<b>מכונת מצבים סופית</b> (FSM, finite state machine) יש:</p>
<ul>
<li>קבוצה סופית של <b>מצבים</b> (אחד מהם הוא מצב ההתחלה)</li>
<li><b>מעברים</b>: "במצב S, על קלט X, עוברים למצב T"</li>
</ul>
<p>זהו. בלי משתנים, בלי stack, בלי heap. הזיכרון היחיד שלה הוא <b>באיזה מצב היא נמצאת ברגע זה</b>.</p>
<svg viewBox="0 0 220 70" width="260" height="83" style="display:block;margin:auto">
  <circle cx="35" cy="35" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="110" cy="35" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="185" cy="35" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="35" y="39" font-size="10" text-anchor="middle" fill="currentColor">ירוק</text>
  <text x="110" y="39" font-size="10" text-anchor="middle" fill="currentColor">צהוב</text>
  <text x="185" y="39" font-size="10" text-anchor="middle" fill="currentColor">אדום</text>
  <line x1="57" y1="35" x2="84" y2="35" stroke="var(--accent)" stroke-width="1.5"/>
  <polygon points="88,35 81,31 81,39" fill="var(--accent)"/>
  <line x1="132" y1="35" x2="159" y2="35" stroke="var(--accent)" stroke-width="1.5"/>
  <polygon points="163,35 156,31 156,39" fill="var(--accent)"/>
  <path d="M185 57 Q110 85 39 59" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <polygon points="36,57 45,58 40,64" fill="var(--accent)"/>
</svg>
<p style="text-align:center">על כל חץ כתוב "טיימר".</p>` },
        { type: 'mcq', q: 'ה-FSM של הרמזור נמצא במצב אדום. הטיימר מתפוצץ. מה המצב הבא?', choices: ['צהוב', 'ירוק', 'אדום', 'כבוי'], answer: 1,
          explain: 'עקבו אחרי החץ שיוצא מאדום: הוא חוזר בלולאה לירוק.' },
        { type: 'learn', title: 'אתם מריצים FSMs כל היום', html: `
<div class="dev">אתם כבר מכירים את זה:
<ul>
<li><b>ה-phase של pod ב-Kubernetes</b>: Pending → Running → Succeeded או Failed (ועוד Unknown כשה-node מפסיק לדווח).</li>
<li><b>חיבורי TCP</b>: <code>ss -tan</code> מראה LISTEN, SYN-SENT, ESTABLISHED, FIN-WAIT-1, TIME-WAIT… ישר מדיאגרמת המצבים של TCP ב-RFC 793.</li>
<li>Circuit breakers: Closed → Open → Half-Open.</li>
<li>תהליך האינסידנטים שלכם: Triggered → Acknowledged → Resolved.</li>
</ul></div>
<p>לכתוב אותם כ-FSM מפורש (enum + טבלת מעברים) הורג משפחה שלמה של באגים מסוג "איך לעזאזל הוא הגיע <i>למצב הזה</i>?".</p>` },
        { type: 'order', q: 'לקוח TCP סוגר חיבור באופן אקטיבי. סדרו את המצבים שהוא עובר בהם.', items: ['ESTABLISHED', 'FIN_WAIT_1', 'FIN_WAIT_2', 'TIME_WAIT', 'CLOSED'],
          explain: 'שולחים FIN → FIN_WAIT_1. מקבלים ACK → FIN_WAIT_2. מקבלים את ה-FIN של הצד השני → TIME_WAIT (מחכים 2×MSL כדי שפקטות תועות ימותו בשקט). ואז CLOSED. מכאן כל ה-sockets ב-TIME_WAIT על שרתים עמוסים.' },
        { type: 'tf', q: 'FSM יכולה לזכור כמות לא חסומה של מידע, בתנאי שיש לה מספיק זמן.', answer: false,
          explain: 'הזיכרון היחיד שלה הוא המצב הנוכחי, ויש מספר סופי של מצבים. המגבלה הזו היא כל העניין — וכמו שנראה, גם נקודת התורפה שלה.' },
        { type: 'learn', title: 'FSMs כמזהות', html: `
<p>מסמנים חלק מהמצבים כ<b>מקבלים</b>. מאכילים את המכונה במחרוזת, תו אחרי תו. אם היא מסיימת במצב מקבל, המחרוזת <b>מתקבלת</b>.</p>
<p>דוגמה — "האם במחרוזת הבינארית הזו יש מספר זוגי של אחדות?" שני מצבים: <b>זוגי</b> (התחלה, מקבל) ו<b>אי-זוגי</b>. כל 1 מעביר ביניהם; כל 0 משאיר במקום.</p>
<svg viewBox="0 0 200 80" width="230" height="92" style="display:block;margin:auto">
  <circle cx="50" cy="40" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="50" cy="40" r="18" fill="none" stroke="currentColor" stroke-width="1"/>
  <circle cx="150" cy="40" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="50" y="44" font-size="10" text-anchor="middle" fill="currentColor">זוגי</text>
  <text x="150" y="44" font-size="10" text-anchor="middle" fill="currentColor">אי-זוגי</text>
  <path d="M70 30 Q100 12 130 30" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <path d="M130 50 Q100 68 70 50" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <text x="100" y="16" font-size="10" text-anchor="middle" fill="currentColor">1</text>
  <text x="100" y="72" font-size="10" text-anchor="middle" fill="currentColor">1</text>
</svg>
<p style="text-align:center">(0 מחזיר כל מצב לעצמו; עיגול כפול = מצב מקבל.)</p>` },
        { type: 'input', q: 'הריצו את מכונת הזוגיות על הקלט 1101, החל ממצב זוגי. באיזה מצב היא מסיימת? (זוגי/אי-זוגי)', answer: ['odd', 'אי-זוגי', 'אי זוגי', 'איזוגי', 'אי־זוגי'], placeholder: 'זוגי או אי-זוגי',
          explain: '1 → אי-זוגי, 1 → זוגי, 0 → זוגי, 1 → אי-זוגי. שלוש אחדות: אי-זוגי. המחרוזת נדחית.' },
        { type: 'mcq', q: 'ה-pod של Job ב-Kubernetes מסיים עם exit code 0. באיזה phase הוא נגמר?', choices: ['Running', 'Succeeded', 'Completed', 'Terminated'], answer: 1,
          explain: 'ה-phase של ה-pod הוא Succeeded. ("Completed" זה מה ש-kubectl מציג בעמודת STATUS — מחרוזת תצוגה, לא ה-phase. ערמומי.)' }
      ]
    },
    // ───────────────────────────── Lesson 2 ─────────────────────────────
    {
      id: 'regular-languages',
      title: 'שפות רגולריות ו-Regex',
      emoji: '🔍',
      steps: [
        { type: 'learn', title: 'שפות = קבוצות של מחרוזות', html: `
<p>בארץ התיאוריה, <b>שפה</b> היא פשוט קבוצה של מחרוזות. "כל כתובות ה-IPv4 החוקיות" היא שפה. גם "כל המחרוזות הבינאריות עם מספר זוגי של אחדות".</p>
<p>שפה היא <b>רגולרית</b> אם יש FSM כלשהי שמזהה אותה. ועכשיו לגילוי הגדול:</p>
<div class="callout">ביטויים רגולריים ומכונות מצבים סופיות חזקים בדיוק באותה מידה. כל regex אפשר לקמפל ל-FSM, ולהפך (משפט קליני).</div>
<div class="dev">אתם כבר מכירים את זה: <code>regexp</code> של Go ו-RE2 של Google מקמפלים את התבנית שלכם לאוטומט ומבטיחים התאמה בזמן ליניארי. ככה תיאוריה משלמת שכר דירה.</div>` },
        { type: 'mcq', q: 'איזו מחרוזת מתאימה ל-regex ‏^a(b|c)*d$ ?', choices: ['abcd', 'abbe', 'bcd', 'a'], answer: 0,
          explain: 'צריך: a, אחריו כל מספר של b-ים ו-c-ים, אחריו d, ותו לא. "abcd" = a + bc + d. ✓' },
        { type: 'input', q: 'מה המספר המינימלי של מצבים ל-FSM שמקבלת מחרוזות בינאריות שמסתיימות ב-1?', answer: ['2', 'two', 'שתיים', 'שניים'], placeholder: 'מספר',
          explain: 'שני מצבים: "התו האחרון היה 1" (מקבל) ו"כל דבר אחר" (התחלה). על 1 עוברים לראשון, על 0 לשני. מצב אחד לא יכול להבדיל בין קבלה לדחייה.' },
        { type: 'learn', title: 'מה regex לא יודע לעשות', html: `
<p>נסו להתאים <b>סוגריים מאוזנים</b> — <code>(()(()))</code> — בכל עומק. או את השפה aⁿbⁿ: כמה a-ים ואחריהם <i>בדיוק אותו מספר</i> של b-ים.</p>
<p>תצטרכו <b>לספור</b> בלי גבול. FSM עם k מצבים יכולה לעקוב רק אחרי k ספירות שונות; תנו לה k+1 פעמים a ושתי ספירות שונות חייבות לחלוק מצב (שובך היונים!). מעכשיו היא מבולבלת לנצח.</p>
<div class="callout">סוגריים מאוזנים ו-aⁿbⁿ הן <b>לא רגולריות</b>. שום regex אמיתי לא יכול להתאים אותן.</div>` },
        { type: 'tf', q: 'ביטוי רגולרי קלאסי יכול לבדוק שסוגריים מאוזנים, בכל עומק קינון.', answer: false,
          explain: 'בדיקת איזון דורשת ספירה לא חסומה, ומצבים סופיים לא יכולים לספור בלי גבול. צריך stack (או מונה שיכול לגדול לנצח).' },
        { type: 'learn', title: 'למה זה חשוב בתורנות', html: `
<div class="dev">אתם כבר מכירים את זה:
<ul>
<li>התשובה האגדית ב-Stack Overflow על פרסור HTML עם regex? זו התיאוריה שמאחוריה. HTML, JSON ו-YAML מקוננים — תשתמשו ב-parser אמיתי (<code>jq</code>, <code>yq</code>).</li>
<li>"ביטויים רגולריים" של PCRE מוסיפים backreferences, שהם <i>לא</i> רגולריים ודורשים מנועי backtracking. backtracking יכול להפוך לאקספוננציאלי: <b>ReDoS</b>. ה-outage הגלובלי של Cloudflare ב-2 ביולי 2019 היה regex אחד בחוק WAF שעשה backtracking עד 100% CPU.</li>
</ul></div>` },
        { type: 'mcq', q: 'למה אף FSM לא יכולה לזהות את aⁿbⁿ (n פעמים a ואחריהם בדיוק n פעמים b)?', choices: ['מחרוזות יכולות להיות ארוכות מכדי לקרוא', 'יש לה מספר סופי של מצבים, אז היא לא יכולה לספור גבוה כרצונה', 'FSMs לא יודעות לקרוא את האות b', 'היא יכולה, אם יהיו לה מספיק מצבים'], answer: 1,
          explain: 'לכל מספר קבוע של מצבים, רצף ארוך מספיק של a-ים מכריח שתי ספירות שונות להיכנס לאותו מצב. "מספיק מצבים" אף פעם לא מספיק, כי n לא חסום.' },
        { type: 'mcq', q: 'איזה תכנון של מנוע regex מבטיח זמן התאמה ליניארי באורך הקלט (בלי ReDoS)?', choices: ['מנועי backtracking כמו PCRE', 'מנועים מבוססי אוטומט כמו RE2 / regexp של Go', 'כל מנוע, אם ה-regex קצר', 'אף אחד — כל regex הוא אקספוננציאלי'], answer: 1,
          explain: 'מנועים בסגנון RE2 מסמלצים FSM ועוברים על הקלט פעם אחת. המחיר: אין backreferences, כי הם לא רגולריים.' }
      ]
    },
    // ───────────────────────────── Lesson 3 ─────────────────────────────
    {
      id: 'grammars-parsers',
      title: 'דקדוקים ו-Parsers',
      emoji: '🌳',
      steps: [
        { type: 'learn', title: 'דקדוקים חסרי הקשר', html: `
<p><b>דקדוק</b> הוא קבוצה של כללי שכתוב. הנה אחד לסוגריים מאוזנים:</p>
<div class="formula">S → ( S ) S &nbsp;|&nbsp; ε</div>
<p>"S הוא: סוגר פותח, S, סוגר סוגר, ואז עוד S — או כלום (ε)." הכלל מזכיר <b>את עצמו</b>. הרקורסיה הזו היא בדיוק הכוח שחסר ל-FSMs.</p>
<p>שפות שמתוארות כך נקראות <b>חסרות הקשר</b> (context-free). המכונה שמזהה אותן היא <b>אוטומט מחסנית</b> (pushdown automaton): FSM ועוד <b>stack</b>.</p>` },
        { type: 'mcq', q: 'אוטומט מחסנית הוא FSM ועוד מה?', choices: ['תור', 'מחסנית (stack)', 'hash map', 'עוד FSM'], answer: 1,
          explain: 'Stack. דוחפים על "(", שולפים על ")". stack ריק בסוף = מאוזן. בדיוק איך שהייתם כותבים את הפתרון ב-LeetCode.' },
        { type: 'tf', q: 'הדקדוק S → a S b | ε מייצר בדיוק את המחרוזות aⁿbⁿ (n ≥ 0).', answer: true,
          explain: 'כל צעד מוסיף a אחד משמאל ו-b אחד מימין, כך שהספירות תמיד תואמות: ε, ab, aabb, aaabbb… השפה ש-regex לא הצליח להתמודד איתה קלה לדקדוק.' },
        { type: 'learn', title: 'JSON הוא דקדוק', html: `
<pre><code>value  → object | array | string
       | number | true | false | null
object → { } | { members }
members→ string : value | string : value , members
array  → [ ] | [ elements ]
elements → value | value , elements</code></pre>
<p>value מכיל object, object מכיל value… שוב רקורסיה. בגלל זה JSON יכול להתקנן לנצח, ובגלל זה regex לא יכול לוולדט אותו.</p>
<div class="dev">אתם כבר מכירים את זה: Postgres מפרסר את ה-SQL שלכם עם קובץ דקדוק (<code>gram.y</code>) שמוזן ל-parser generator בשם Bison. ל-YAML, HCL, PromQL, nginx.conf — לכולם יש דקדוקים ו-parsers.</div>` },
        { type: 'input', q: 'בעזרת S → ( S ) S | ε, אפשר לייצר את המחרוזת "(()"? (כן/לא)', answer: ['no', 'n', 'false', 'לא'], placeholder: 'כן או לא',
          explain: 'כל כלל מוסיף סוגריים בזוגות תואמים, אז כל מחרוזת שנוצרת מאוזנת. ב-"(()" יש 2 פותחים וסוגר אחד — בלתי אפשרי.' },
        { type: 'learn', title: 'ה-pipeline של הפרסור', html: `
<ol>
<li><b>Lexer</b> (tokenizer): חותך טקסט ל-tokens — <code>{</code>, <code>"name"</code>, <code>:</code>, <code>42</code>. tokens הם רגולריים, אז lexers משתמשים ב-regex/FSMs.</li>
<li><b>Parser</b>: מסדר את ה-tokens לעץ לפי הדקדוק (הרבה פעמים parser מסוג <b>recursive descent</b> שנכתב ביד: פונקציה אחת לכל כלל).</li>
<li><b>AST</b>: עץ התחביר המופשט שהתוכנית שלכם באמת עובדת איתו.</li>
<li><b>הערכה / קומפילציה</b> של העץ.</li>
</ol>
<div class="dev">אתם כבר מכירים את זה: שגיאת אינדנטציה ב-YAML של Helm chart היא ה-parser שאומר לכם שהקלט שלכם לא מתאים לדקדוק.</div>` },
        { type: 'order', q: 'סדרו את שלבי העיבוד של קוד מקור', items: ['טקסט גולמי', 'Tokens (lexer)', 'עץ תחביר (parser)', 'הערכה / יצירת קוד'],
          explain: 'טקסט → tokens → עץ → עושים איתו משהו. אותו pipeline לקומפיילרים, ל-jq, למנועי SQL ולטועני קונפיגורציה.' },
        { type: 'order', q: 'סדרו את סוגי המכונות מהחלשה לחזקה', items: ['מכונת מצבים סופית (רגולרית)', 'אוטומט מחסנית (חסרת הקשר)', 'מכונת טיורינג (כל מה שניתן לחישוב)'],
          explain: 'כל אחת מוסיפה זיכרון: כלום מעבר למצב → stack → סרט קריאה/כתיבה לא חסום. הסולם הזה הוא חלק מהיררכיית חומסקי.' },
        { type: 'mcq', q: 'למה lexers בדרך כלל משתמשים ב-regex ו-parsers בדקדוקים?', choices: ['Tokens הם תבניות שטוחות (רגולריות); מבנה התוכנית מקונן (חסר הקשר)', 'regex חדש יותר', 'דקדוקים לא יכולים לתאר מספרים', 'זו סתם מסורת'], answer: 0,
          explain: 'tokens בודדים כמו 42 או "hello" לא מתקננים, אז FSM מספיקה. סוגריים, בלוקים ואובייקטים מתקננים, וזה דורש stack.' }
      ]
    },
    // ───────────────────────────── Lesson 4 ─────────────────────────────
    {
      id: 'turing-machines',
      title: 'מכונות טיורינג',
      emoji: '📼',
      steps: [
        { type: 'learn', title: 'מכונת הסרט של טיורינג (1936)', html: `
<p>אלן טיורינג דמיין את ה"מחשב" הפשוט ביותר האפשרי:</p>
<ul>
<li><b>סרט אינסופי</b> של תאים, שבכל אחד סימן</li>
<li><b>ראש</b> שקורא/כותב תא אחד וזז שמאלה או ימינה</li>
<li><b>טבלת מצבים</b> סופית: "במצב q, קורא s → כותב t, זז L/R, עובר למצב r"</li>
</ul>
<svg viewBox="0 0 220 60" width="260" height="71" style="display:block;margin:auto">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="10" y="10" width="30" height="24"/><rect x="40" y="10" width="30" height="24"/><rect x="70" y="10" width="30" height="24"/>
    <rect x="100" y="10" width="30" height="24" stroke="var(--accent)" stroke-width="2.5"/><rect x="130" y="10" width="30" height="24"/><rect x="160" y="10" width="30" height="24"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="currentColor">
    <text x="25" y="27">1</text><text x="55" y="27">0</text><text x="85" y="27">1</text><text x="115" y="27">1</text><text x="145" y="27">_</text><text x="175" y="27">_</text>
    <text x="205" y="27">…</text>
  </g>
  <polygon points="115,38 108,50 122,50" fill="var(--accent)"/>
  <text x="130" y="50" font-size="9" fill="currentColor">ראש (מצב q)</text>
</svg>
<p>זו FSM שקיבלה דף טיוטה בלי הגבלה, שהיא יכולה לקרוא ולכתוב בו בכל מקום.</p>` },
        { type: 'input', q: 'מכונת טיורינג הולכת ימינה לאורך הסרט והופכת כל ביט (0↔1), ועוצרת בתא הריק הראשון. הסרט בקלט: 1011. מה כתוב על הסרט כשהיא עוצרת?', answer: ['0100'], placeholder: 'ביטים',
          explain: 'הופכים כל ביט: 1→0, 0→1, 1→0, 1→0 ומקבלים 0100.' },
        { type: 'learn', title: 'צ\'רץ\'–טיורינג ו-Turing-completeness', html: `
<p><b>תזת צ'רץ'–טיורינג</b>: כל מה שאפשר לחשב בכל תהליך צעד-אחר-צעד, אפשר לחשב במכונת טיורינג. כל שפה אמיתית — Python, Go, Bash, SQL עם רקורסיה — חזקה באותה מידה ב<i>מה</i> שהיא יכולה לחשב (לא בכמה מהר).</p>
<p>מערכת היא <b>Turing-complete</b> אם היא יכולה לסמלץ מכונת טיורינג. בערך: תנאים + זיכרון לא חסום + לולאות לא חסומות (או רקורסיה).</p>
<div class="fun">🤓 עובדה משעשעת: דברים שהוכחו כ-Turing-complete בטעות כוללים templates של C++, SQL עם recursive CTEs, נוסחאות Excel (עם LAMBDA), Magic: The Gathering, רדסטון של Minecraft ואנימציות של PowerPoint.</div>` },
        { type: 'mcq', q: 'מה מבין אלה הוא Turing-complete?', choices: ['מסמך JSON', 'ביטוי רגולרי קלאסי', 'Python', 'קובץ HTML בלי סקריפטים'], answer: 2,
          explain: 'ל-Python יש תנאים, לולאות וזיכרון לא חסום (עקרונית). JSON ו-HTML פשוט הם דאטה, ו-regex חזק רק כמו FSM.' },
        { type: 'tf', q: 'SQL של PostgreSQL עם recursive CTEs (WITH RECURSIVE) הוא Turing-complete.', answer: true,
          explain: 'Recursive CTEs נותנים איטרציה לא חסומה; אנשים מימשו בהם cyclic tag systems ואפילו מכונות טיורינג. מסד הנתונים שלכם הוא מחשב מלא.' },
        { type: 'learn', title: 'כשקונפיגורציה הופכת לקוד', html: `
<div class="dev">אתם כבר מכירים את זה: YAML הוא רק דאטה. ואז מוסיפים templating של Helm/Jinja עם תנאים, לולאות ו-includes רקורסיביים… ופתאום ה"קונפיג" שלכם הוא שפת תכנות שיכולה להיות באגית, איטית, או לא להסתיים אף פעם.</div>
<p>חלק משפות הקונפיגורציה מסרבות בכוונה: <b>Dhall</b> ו-<b>CUE</b> הן בכוונה <i>לא</i> Turing-complete, ו-<b>Starlark</b> של Bazel אוסרת רקורסיה ולולאות while. התמורה: ההערכה <b>מובטחת להסתיים</b>.</p>` },
        { type: 'mcq', q: 'למה שפת קונפיגורציה כמו Dhall תימנע בכוונה מלהיות Turing-complete?', choices: ['כדי שיהיה מהיר יותר להקליד', 'כדי שהערכה של קונפיג תהיה מובטחת להסתיים', 'כי שפות Turing-complete לא יכולות להוציא YAML', 'כדי לחסוך בדמי רישוי'], answer: 1,
          explain: 'מוותרים על לולאות/רקורסיה כלליות ומקבלים הבטחה לסיום: ה-deploy שלכם אף פעם לא נתקע בהערכת קונפיג. השיעור הבא יראה למה שפות Turing-complete לעולם לא יכולות לתת את ההבטחה הזו.' },
        { type: 'mcq', q: 'מה הופך מכונת טיורינג לחזקה יותר מאוטומט מחסנית?', choices: ['היא קוראת מהר יותר', 'היא יכולה לקרוא ולכתוב בכל מקום על סרט לא חסום, לא רק בראש ה-stack', 'יש לה יותר מצבים', 'היא רצה על חשמל'], answer: 1,
          explain: 'stack מאפשר לגעת רק בראש שלו. סרט מאפשר לחזור אחורה ולקרוא מחדש או לשכתב כל דבר — הגישה החופשית-למחצה הזו היא הקפיצה לחישוב מלא.' }
      ]
    },
    // ───────────────────────────── Lesson 5 ─────────────────────────────
    {
      id: 'halting-problem',
      title: 'בעיית העצירה (Halting Problem)',
      emoji: '🛑',
      steps: [
        { type: 'learn', title: 'כלי החלומות', html: `
<p>לא היה מדהים שיהיה שלב ב-CI: <code>halts(program, input)</code> שמחזיר true אם התוכנית תסתיים בסוף, ו-false אם היא תיתקע בלולאה לנצח? נגמרו ה-jobs התקועים!</p>
<p>ב-1936 טיורינג הוכיח: <b>לא יכולה להתקיים תוכנית כזו</b> שעובדת נכון עבור <i>כל</i> תוכנית וכל קלט.</p>
<p>ההוכחה היא מלכודת יפהפייה. בואו נבנה אותה.</p>` },
        { type: 'learn', title: 'תוכנית הטרול', html: `
<p>נניח ש-<code>halts(P, x)</code> קיימת. כתבו את זה:</p>
<pre><code>def troll(P):
    if halts(P, P):
        while True: pass   # loop forever
    else:
        return             # halt</code></pre>
<p>troll עושה <b>את ההפך</b> ממה ש-halts חוזה. ועכשיו השאלה הקטלנית: מה עושה <code>troll(troll)</code>?</p>` },
        { type: 'input', q: 'נניח ש-halts(troll, troll) מחזירה true. האם troll(troll) באמת עוצרת? (כן/לא)', answer: ['no', 'n', 'לא'], placeholder: 'כן או לא',
          explain: 'אם halts אומרת "היא עוצרת", troll נכנסת ללולאה האינסופית — אז היא לא עוצרת. halts טעתה.' },
        { type: 'mcq', q: 'ואם halts(troll, troll) מחזירה false?', choices: ['troll(troll) נתקעת בלולאה לנצח, אז halts צדקה', 'troll(troll) חוזרת מיד, אז halts טעתה', 'התוכנית קורסת', 'אי אפשר לקרוא ל-halts על עצמה'], answer: 1,
          explain: 'חוזים "לולאה לנצח" ו-troll חוזרת מיד. כל תשובה שגויה — אז ה-halts() שהנחנו לא יכולה להתקיים. סתירה, מש"ל.' },
        { type: 'learn', title: 'משפט רייס: זה רק מחמיר', html: `
<p>משפט רייס מכליל את זה: <b>כל</b> שאלה לא טריוויאלית על מה שתוכנית <i>עושה</i> (ההתנהגות שלה, לא הטקסט שלה) היא בלתי כריעה במקרה הכללי.</p>
<ul>
<li>"האם הקוד הזה אי פעם מחלק באפס?"</li>
<li>"האם הפונקציה הזו היא dead code?"</li>
<li>"האם השירות הזה יכול אי פעם להדליף את ה-API key?"</li>
</ul>
<p>אז כל static analyzer חייב להתפשר: לאפשר <b>false positives</b>, <b>false negatives</b>, או להגיד "אני לא יודע".</p>
<div class="dev">אתם כבר מכירים את זה: linters מתריעים על דברים שבסדר, ומפספסים דברים שלא. זה לא הנדסה עצלנית — זה בלתי נמנע מתמטית.</div>` },
        { type: 'tf', q: 'בעיית העצירה אומרת שאי אפשר לדעת אם תוכנית מסוימת כלשהי עוצרת.', answer: false,
          explain: 'עבור הרבה תוכניות ספציפיות זה קל (print("hi") עוצרת). מה שבלתי אפשרי זה אלגוריתם אחד שעונה נכון על כל זוג של תוכנית וקלט.' },
        { type: 'learn', title: 'איך SREs מתמודדים', html: `
<div class="dev">את התשובה ההנדסית לבעיה בלתי כריעה אתם כבר מכירים: <b>timeouts</b>. timeouts ל-jobs ב-CI, <code>activeDeadlineSeconds</code> ב-Jobs, <code>statement_timeout</code> ב-Postgres, liveness probes, context deadlines ב-Go. אי אפשר לחזות אם זה ייגמר — אז מפסיקים לחכות.</div>` },
        { type: 'order', q: 'סדרו את שלבי ההוכחה של בעיית העצירה', items: ['מניחים שקיימת halts(P, x) מושלמת', 'בונים את troll(P), שעושה את ההפך מ-halts(P, P)', 'שואלים מה עושה troll(troll)', 'שתי התשובות סותרות את halts', 'מסיקים ש-halts לא יכולה להתקיים'],
          explain: 'הוכחה קלאסית בדרך השלילה: מניחים, בונים איתה משהו פרדוקסלי, ומסיקים שההנחה הייתה שגויה.' },
        { type: 'mcq', q: 'ספק מוכר כלי ש"מזהה כל לולאה אינסופית בכל codebase עם אפס התראות שווא". מה כדאי לחשוב?', choices: ['מעולה, קונים', 'בלתי אפשרי כפי שנוסח — זה היה פותר את בעיית העצירה', 'אפשרי רק ב-Rust', 'אפשרי עם מספיק GPUs'], answer: 1,
          explain: 'זיהוי מושלם וכללי של לולאות אינסופיות הוא בעיית העצירה. כלים אמיתיים שימושיים, אבל חייבים לפספס חלק מהלולאות או לסמן חלק בטעות.' }
      ]
    },
    // ───────────────────────────── Lesson 6 ─────────────────────────────
    {
      id: 'p-vs-np',
      title: 'P מול NP',
      emoji: '🧩',
      steps: [
        { type: 'learn', title: 'קל לפתור מול קל לבדוק', html: `
<p>עכשיו: בעיות ש<i>כן</i> פתירות, אבל כמה מהר?</p>
<ul>
<li><b>P</b>: בעיות שאפשר <b>לפתור</b> בזמן פולינומי (n, n², n³…). מיון, מסלולים קצרים, חיפוש.</li>
<li><b>NP</b>: בעיות שבהן אפשר <b>לבדוק</b> תשובה מוצעת בזמן פולינומי. סודוקו: למלא אותו קשה, לבדוק לוח מלא קל.</li>
</ul>
<div class="dev">את הטעם אתם כבר מכירים: לבדוק סיסמה מול ה-hash שלה ב-bcrypt לוקח מילישניות; למצוא את הסיסמה מתוך ה-hash זה חסר סיכוי. לעבור על Terraform plan שעובד זה קל; לכתוב אותו זה היה החלק הקשה.</div>` },
        { type: 'mcq', q: 'איזו בעיה ידוע שהיא ב-P?', choices: ['מציאת המסלול הקצר ביותר בין שני צמתים בגרף', 'פתרון כל סודוקו בכל גודל', 'מציאת הסיור הקצר ביותר שעובר בכל העיירות', 'אריזת פריטים במינימום ארגזים'], answer: 0,
          explain: 'Dijkstra / BFS פותרים מסלול קצר ביותר בזמן פולינומי. שלוש האחרות הן NP-complete (או NP-hard): אין להן אלגוריתם פולינומי ידוע.' },
        { type: 'tf', q: 'כל בעיה ב-P נמצאת גם ב-NP.', answer: true,
          explain: 'אם אפשר לפתור מהר, אפשר לבדוק תשובה מהר: פשוט פותרים ומשווים. אז P ⊆ NP.' },
        { type: 'learn', title: 'שאלת המיליון דולר', html: `
<div class="formula">P = NP ?</div>
<p>האם כל בעיה שקל <i>לבדוק</i> את התשובה שלה גם קל <i>לפתור</i>? אף אחד לא יודע. זו אחת מבעיות המילניום של מכון קליי, עם פרס של <b>$1,000,000</b>.</p>
<p>רוב המומחים מאמינים ש-<b>P ≠ NP</b>. אם P = NP (עם אלגוריתם מעשי), חלק גדול מהקריפטוגרפיה המודרנית יקרוס — למצוא מפתחות יהיה קל כמו לבדוק אותם.</p>` },
        { type: 'mcq', q: 'מה המצב הנוכחי של P vs NP?', choices: ['הוכח ש-P = NP', 'הוכח ש-P ≠ NP', 'לא פתורה', 'הוכח שהיא בלתי כריעה'], answer: 2,
          explain: 'עדיין פתוחה מאז שנוסחה ב-1971. רובם מאמינים ש-P ≠ NP, אבל אמונה זו לא הוכחה.' },
        { type: 'learn', title: 'NP-complete: הקשות שבחבורה', html: `
<p>בעיה היא <b>NP-complete</b> אם היא ב-NP <i>וגם</i> כל בעיה ב-NP אפשר לתרגם (לעשות רדוקציה) אליה בזמן פולינומי.</p>
<p>הראשונה: <b>SAT</b> — בהינתן נוסחה בוליאנית, האם יש השמה של true/false שהופכת אותה ל-true? (קוק–לוין, 1971.) אלפים נוספות באו אחריה: traveling salesman, צביעת גרפים, knapsack, bin packing, סודוקו…</p>
<div class="callout">פתרתם בעיית NP-complete אחת כלשהי בזמן פולינומי? פתרתם את כולן — והוכחתם ש-P = NP.</div>` },
        { type: 'input', q: 'זמן SAT! (A ∨ B) ∧ (¬A ∨ B) ∧ (¬B ∨ C). בכל השמה מספקת, מה חייב להיות C? (true/false)', answer: ['true', 't', '1', 'yes', 'אמת', 'כן'], placeholder: 'true או false',
          explain: 'שתי הפסוקיות הראשונות: אם B היה false, היינו צריכים גם A וגם ¬A. אז B = true. ואז (¬B ∨ C) מכריח C = true. לבדוק היה מהיר — למצוא, במקרה הכללי, זה החלק הקשה.' },
        { type: 'mcq', q: 'אם מישהו היה מוצא אלגוריתם בזמן פולינומי ל-SAT, מה היה נובע מזה?', choices: ['רק SAT נהיית מהירה יותר', 'כל בעיה ב-NP הייתה ניתנת לפתרון בזמן פולינומי (P = NP)', 'בעיית העצירה נהיית פתירה', 'שום דבר חשוב'], answer: 1,
          explain: 'כל בעיה ב-NP מצטמצמת ל-SAT, אז solver מהיר ל-SAT הוא solver מהיר לכל NP. בעיית העצירה נשארת בלתי כריעה — זה קיר אחר לגמרי.' }
      ]
    },
    // ───────────────────────────── Lesson 7 ─────────────────────────────
    {
      id: 'np-in-practice',
      title: 'NP-Hard ב-Production',
      emoji: '📦',
      steps: [
        { type: 'learn', title: 'אתם פוגשים בעיות NP-hard כל שבוע', html: `
<div class="dev">אתם כבר מכירים את זה: <b>ה-scheduler של Kubernetes</b> משבץ pods (פריטים עם גדלי CPU/memory) על nodes (ארגזים עם קיבולת). שיבוץ אופטימלי הוא <b>bin packing</b> רב-ממדי — NP-hard. אז kube-scheduler לא מחפש את התשובה המושלמת: הוא <b>מסנן</b> nodes אפשריים, <b>נותן להם ציון</b> לפי היוריסטיקות, ובוחר את הטוב ביותר, pod אחד בכל פעם.</div>
<p>עוד דוגמאות מהשטח: שיבוץ תורנויות on-call, שיבוץ jobs ב-CI, אופטימיזציה של עלויות ענן, ו<b>פתרון תלויות של חבילות</b> (apt, pip, npm) — שהיא NP-complete במקרה הכללי.</p>` },
        { type: 'mcq', q: 'למה ה-scheduler של Kubernetes לא מחשב את השיבוץ האופטימלי הגלובלי של כל ה-pods?', choices: ['אף אחד לא חשב על זה', 'bin packing רב-ממדי אופטימלי הוא NP-hard, אז הוא משתמש בהיוריסטיקות מהירות במקום', 'Kubernetes לא יודע את הגדלים של ה-pods', 'הוא כן — כל פעם'], answer: 1,
          explain: 'אופטימיזציה מדויקת הייתה מתפוצצת אקספוננציאלית על clusters גדולים. היוריסטיקות של filter + score נותנות שיבוץ טוב מספיק במילישניות.' },
        { type: 'learn', title: 'Brute force מתפוצץ', html: `
<p><b>Traveling salesman</b>: לבקר ב-n ערים פעם אחת, לחזור הביתה, ולמזער את המרחק. אם מקבעים את עיר ההתחלה ומתעלמים מהכיוון, יש <b>(n−1)!/2</b> סיורים אפשריים.</p>
<ul>
<li>5 ערים → 12 סיורים</li>
<li>10 ערים → 181,440</li>
<li>20 ערים → ≈ 6 × 10¹⁶ (בערך שנתיים, במיליארד סיורים לשנייה)</li>
<li>25 ערים → ≈ 3 × 10²³ (בערך 10 מיליון שנה. הוספתם 5 ערים, הכפלתם את הכאב פי 5 מיליון.)</li>
</ul>` },
        { type: 'input', q: 'לפי (n−1)!/2, כמה סיורים שונים יש ל-6 ערים?', answer: ['60'], placeholder: 'מספר',
          explain: '(6 − 1)! / 2 = 120 / 2 = 60. כבר ב-6 ערים זה 60 סיורים — ומכאן זה רק מתפוצץ.' },
        { type: 'learn', title: 'היוריסטיקות וקירובים', html: `
<p>כשמדויק זה איטי מדי, מהנדסים מרמים — בחוכמה:</p>
<ul>
<li><b>היוריסטיקות חמדניות</b>: למשל First-Fit Decreasing ל-bin packing — ממיינים פריטים מהגדול לקטן, ושמים כל אחד בארגז הראשון שיש בו מקום. מוכח שאף פעם לא גרוע בהרבה מהאופטימום.</li>
<li><b>אלגוריתמי קירוב</b>: מובטח שיהיו בתוך פקטור מסוים מהאופטימום.</li>
<li><b>SAT solvers</b>: אקספוננציאליים במקרה הגרוע, ובכל זאת מפרקים באופן שגרתי מקרים אמיתיים עם מיליוני משתנים (אימות שבבים, מנהלי חבילות).</li>
</ul>
<div class="dev">סיפור תכנון משעשע: Go modules משתמשים ב-<b>Minimal Version Selection</b>, שתוכנן בכוונה כך שפתרון תלויות <i>לא</i> יהיה NP-complete. משנים את הבעיה, עוקפים את הקיר.</div>` },
        { type: 'input', q: 'First-Fit Decreasing: ארגזים בקיבולת 10, פריטים 6, 5, 4, 3, 2. בכמה ארגזים משתמשים?', answer: ['2', 'two', 'שניים', 'שתיים'], placeholder: 'מספר',
          explain: '6 → ארגז 1. 5 → ארגז 2 (6+5 > 10). 4 → ארגז 1 (עכשיו 10). 3 → ארגז 2 (8). 2 → ארגז 2 (10). שני ארגזים — ומכיוון שסך הפריטים הוא 20, זה אופטימלי.' },
        { type: 'tf', q: 'NP-complete פירושו שאי אפשר לפתור את הבעיה בפועל.', answer: false,
          explain: 'פירושו שאין אלגוריתם ידוע שמהיר במקרה הגרוע. מקרים מהעולם האמיתי נפתרים הרבה פעמים יפה — במדויק או בקירוב — בעזרת solvers והיוריסטיקות.' },
        { type: 'order', q: 'סדרו את האלגוריתם First-Fit Decreasing', items: ['ממיינים את הפריטים מהגדול לקטן', 'לוקחים את הפריט הבא', 'שמים אותו בארגז הראשון שיש בו מספיק מקום', 'אם אף ארגז לא מתאים, פותחים ארגז חדש', 'חוזרים עד שכל הפריטים שובצו'],
          explain: 'פריטים גדולים קודם (הכי קשה לשבץ אותם), ואז נותנים לקטנים למלא את החורים. פשוט, מהיר ומפתיע כמה קרוב לאופטימום.' },
        { type: 'mcq', q: 'חבר צוות טוען שהסקריפט החדש שלו תמיד מוצא את שיבוץ ה-pods האופטימלי לכל cluster בזמן פולינומי. התגובה הכי טובה?', choices: ['לשחרר ל-prod', 'טענה יוצאת דופן: זה היה מוכיח ש-P = NP — בוא נראה את ההוכחה (ואת ה-$1M)', 'שיבוץ אופטימלי הוא טריוויאלי', 'לבקש ממנו לכתוב את זה מחדש ב-Rust'], answer: 1,
          explain: 'Bin packing הוא NP-hard. אלגוריתם פולינומי שמובטח שהוא אופטימלי היה סוגר את שאלת P vs NP. סביר יותר שזו היוריסטיקה טובה שלא תמיד אופטימלית — וזה עדיין יכול להיות שימושי מאוד!' }
      ]
    }
  ]
});
