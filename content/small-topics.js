window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ───────────────────────────── Regex for Engineers ─────────────────────────────
INFRA.lessons.push({
  id: "regex-for-engineers",
  track: "linux",
  order: 50,
  icon: "🧩",
  level: 2,
  minutes: 16,
  title: { en: "Regex for Engineers", he: "Regex למהנדסי תשתיות" },
  tldr: {
    en: "Regex is a tiny pattern language you'll use in grep, sed, awk, nginx, PromQL, Loki, WAF rules and validation code — learn the 10 building blocks, know which flavor you're in (POSIX, PCRE, RE2), anchor everything, and never nest quantifiers on user input.",
    he: "Regex היא שפת תבניות קטנה שתפגוש ב-grep, ‏sed, ‏awk, ‏nginx, ‏PromQL, ‏Loki, חוקי WAF וקוד ולידציה — תלמד את 10 אבני הבניין, תדע באיזה flavor אתה נמצא (POSIX, ‏PCRE, ‏RE2), תעגן הכל, ואף פעם אל תקנן quantifiers על קלט של משתמשים."
  },
  analogy: {
    en: "A regex is a search warrant written for a very literal-minded cop. \"Find a man, 30-40, red hat, near the station\" — he checks every person, one by one, exactly as written. Write it vaguely (\"someone, wearing something, somewhere\") and he either arrests everyone or spends all night re-checking the same crowd in every possible combination. That all-night re-check is catastrophic backtracking.",
    he: "Regex זה צו חיפוש שנכתב לשוטר שמבין הכל מילולית. \"תמצא גבר, 30-40, כובע אדום, ליד התחנה\" — הוא בודק כל אדם, אחד אחד, בדיוק לפי מה שכתוב. תכתוב את זה מעורפל (\"מישהו, לובש משהו, איפשהו\") והוא או עוצר את כולם, או מבלה את כל הלילה בבדיקה חוזרת של אותו קהל בכל צירוף אפשרי. הבדיקה החוזרת הזאת כל הלילה — זה catastrophic backtracking."
  },
  sections: [
    {
      h: { en: "The 10 building blocks", he: "10 אבני הבניין" },
      body: {
        en: `<table><tr><th>Block</th><th>Syntax</th><th>Example → matches</th></tr>
<tr><td>Literal</td><td><code>error</code></td><td><code>error</code> anywhere in the line</td></tr>
<tr><td>Any char</td><td><code>.</code></td><td><code>5..</code> → 500, 503, 5xx (and "5ab"!)</td></tr>
<tr><td>Class</td><td><code>[0-9]</code> <code>[a-f0-9]</code> <code>[^"]</code></td><td>one char from the set; <code>^</code> inside = NOT</td></tr>
<tr><td>Shorthand</td><td><code>\\d \\w \\s</code> (and <code>\\D \\W \\S</code>)</td><td>digit, word char <code>[A-Za-z0-9_]</code>, whitespace</td></tr>
<tr><td>Anchors</td><td><code>^ $ \\b</code></td><td>start, end, word boundary — match <em>positions</em>, not chars</td></tr>
<tr><td>Quantifiers</td><td><code>* + ? {3} {1,3}</code></td><td>0+, 1+, 0-1, exactly 3, 1 to 3 of the previous item</td></tr>
<tr><td>Lazy</td><td><code>*? +? ??</code></td><td>same, but as <em>few</em> as possible</td></tr>
<tr><td>Groups</td><td><code>(...)</code> <code>(?:...)</code> <code>(?&lt;name&gt;...)</code></td><td>capture, non-capture, named capture</td></tr>
<tr><td>Alternation</td><td><code>timeout|refused</code></td><td>either side (lowest precedence — use a group: <code>^(GET|POST) </code>)</td></tr>
<tr><td>Lookaround</td><td><code>(?=x) (?!x) (?&lt;=x) (?&lt;!x)</code></td><td>"followed by / not followed by / preceded by / not preceded by" — zero-width</td></tr></table>
<p><strong>Greedy vs lazy</strong> — quantifiers grab as much as they can, then give back. Tested in Node:</p>
<pre>&gt; 'key="a" other="b"'.match(/".+"/)[0]
'"a" other="b"'          // greedy: ran to the LAST quote
&gt; 'key="a" other="b"'.match(/".+?"/)[0]
'"a"'                    // lazy: stopped at the first closing quote
&gt; 'key="a" other="b"'.match(/"[^"]*"/)[0]
'"a"'                    // negated class: same result, no backtracking, works in every flavor</pre>
<p><strong>Named groups</strong> turn a match into a record:</p>
<pre>&gt; const m = '2026-11-15T10:02:13.481Z level=error msg="db timeout"'
    .match(/^(?&lt;ts&gt;\\d{4}-\\d{2}-\\d{2}T[\\d:.]+Z) level=(?&lt;level&gt;\\w+)/);
&gt; m.groups
{ ts: '2026-11-15T10:02:13.481Z', level: 'error' }</pre>
<p><strong>Lookarounds</strong> check context without consuming it: <code>(?&lt;=user_id=)\\d+</code> returns just <code>4411</code> from <code>user_id=4411</code>; <code>^(?=.*\\d)(?=.*[a-z]).{8,}$</code> means "8+ chars AND contains a digit AND a lowercase letter".</p>
<p><strong>Flags</strong>: <code>i</code> case-insensitive, <code>m</code> multiline (<code>^ $</code> match at every line), <code>s</code> dotall (<code>.</code> matches newline), <code>g</code> global (JS: all matches), <code>x</code> verbose (PCRE/Python: whitespace and comments ignored). Inline form: <code>(?i)error</code> — works in PCRE, Python, Go/RE2 and PromQL.</p>
<blockquote>💡 Real world: 80% of the regex you write on-call is <code>[0-9]+</code>, <code>[^ ]+</code>, <code>[^"]*</code>, <code>^</code>, <code>$</code> and one group. Negated classes like <code>[^"]*</code> ("everything up to the next quote") are faster and safer than <code>.*?</code> and behave identically in every engine.</blockquote>`,
        he: `<table><tr><th>אבן בניין</th><th>תחביר</th><th>דוגמה ← מה תופס</th></tr>
<tr><td>Literal</td><td><code>error</code></td><td><code>error</code> איפשהו בשורה</td></tr>
<tr><td>כל תו</td><td><code>.</code></td><td><code>5..</code> ← ‏500, ‏503, ‏5xx (וגם "5ab"!)</td></tr>
<tr><td>Class</td><td><code>[0-9]</code> <code>[a-f0-9]</code> <code>[^"]</code></td><td>תו אחד מהקבוצה; <code>^</code> בפנים = שלילה</td></tr>
<tr><td>קיצורים</td><td><code>\\d \\w \\s</code> (וגם <code>\\D \\W \\S</code>)</td><td>ספרה, תו מילה <code>[A-Za-z0-9_]</code>, רווח לבן</td></tr>
<tr><td>Anchors</td><td><code>^ $ \\b</code></td><td>התחלה, סוף, גבול מילה — תופסים <em>מיקומים</em>, לא תווים</td></tr>
<tr><td>Quantifiers</td><td><code>* + ? {3} {1,3}</code></td><td>0 ומעלה, 1 ומעלה, 0-1, בדיוק 3, בין 1 ל-3 של הפריט הקודם</td></tr>
<tr><td>Lazy</td><td><code>*? +? ??</code></td><td>אותו דבר, אבל <em>כמה שפחות</em></td></tr>
<tr><td>Groups</td><td><code>(...)</code> <code>(?:...)</code> <code>(?&lt;name&gt;...)</code></td><td>capture, ‏non-capture, ‏named capture</td></tr>
<tr><td>Alternation</td><td><code>timeout|refused</code></td><td>אחד מהצדדים (קדימות הכי נמוכה — תעטוף ב-group: <code>^(GET|POST) </code>)</td></tr>
<tr><td>Lookaround</td><td><code>(?=x) (?!x) (?&lt;=x) (?&lt;!x)</code></td><td>"אחריו בא / לא בא / לפניו בא / לא בא" — ברוחב אפס</td></tr></table>
<p><strong>Greedy מול lazy</strong> — quantifiers תופסים כמה שיותר ואז מחזירים. נבדק ב-Node:</p>
<pre>&gt; 'key="a" other="b"'.match(/".+"/)[0]
'"a" other="b"'          // greedy: ran to the LAST quote
&gt; 'key="a" other="b"'.match(/".+?"/)[0]
'"a"'                    // lazy: stopped at the first closing quote
&gt; 'key="a" other="b"'.match(/"[^"]*"/)[0]
'"a"'                    // negated class: same result, no backtracking, works in every flavor</pre>
<p><strong>Named groups</strong> הופכים match לרשומה:</p>
<pre>&gt; const m = '2026-11-15T10:02:13.481Z level=error msg="db timeout"'
    .match(/^(?&lt;ts&gt;\\d{4}-\\d{2}-\\d{2}T[\\d:.]+Z) level=(?&lt;level&gt;\\w+)/);
&gt; m.groups
{ ts: '2026-11-15T10:02:13.481Z', level: 'error' }</pre>
<p><strong>Lookarounds</strong> בודקים הקשר בלי "לאכול" אותו: <code>(?&lt;=user_id=)\\d+</code> מחזיר רק <code>4411</code> מתוך <code>user_id=4411</code>; ‏<code>^(?=.*\\d)(?=.*[a-z]).{8,}$</code> אומר "8 תווים ומעלה, וגם יש ספרה, וגם יש אות קטנה".</p>
<p><strong>Flags</strong>: ‏<code>i</code> בלי רגישות לאותיות, ‏<code>m</code> multiline (‏<code>^ $</code> בכל שורה), ‏<code>s</code> dotall (‏<code>.</code> תופס גם ירידת שורה), ‏<code>g</code> global (ב-JS: כל ההתאמות), ‏<code>x</code> verbose (ב-PCRE/Python מתעלם מרווחים והערות). צורה inline: ‏<code>(?i)error</code> — עובד ב-PCRE, ‏Python, ‏Go/RE2 וב-PromQL.</p>
<blockquote>💡 מהשטח: 80% מה-regex שתכתוב ב-on-call זה <code>[0-9]+</code>, ‏<code>[^ ]+</code>, ‏<code>[^"]*</code>, ‏<code>^</code>, ‏<code>$</code> ו-group אחד. Negated class כמו <code>[^"]*</code> ("הכל עד המירכאה הבאה") מהיר ובטוח יותר מ-<code>.*?</code> ומתנהג אותו דבר בכל מנוע.</blockquote>`
      }
    },
    {
      h: { en: "Flavors: POSIX BRE/ERE vs PCRE vs RE2", he: "Flavors: ‏POSIX BRE/ERE מול PCRE מול RE2" },
      body: {
        en: `<p>"Regex" is a family of dialects. The same pattern can match in one tool and silently match nothing in another.</p>
<table><tr><th>Flavor</th><th>Where</th><th>Quirks</th></tr>
<tr><td><strong>POSIX BRE</strong></td><td><code>grep</code>, <code>sed</code> (default)</td><td><code>+ ? | ( ) { }</code> are literal; write <code>\\+ \\( \\) \\{3\\}</code>. No <code>\\d</code> — use <code>[0-9]</code> or <code>[[:digit:]]</code></td></tr>
<tr><td><strong>POSIX ERE</strong></td><td><code>grep -E</code>, <code>sed -E</code>, <code>awk</code></td><td>Normal metachars. Still no <code>\\d</code>, no lazy, no lookaround</td></tr>
<tr><td><strong>PCRE</strong></td><td><code>grep -P</code>, nginx, PHP, HAProxy, ModSecurity; Python/JS/Java/.NET are "Perl-like" cousins</td><td>Everything: <code>\\d</code>, lazy, lookaround, backreferences, <code>\\K</code>. Backtracking engine → can blow up</td></tr>
<tr><td><strong>RE2</strong></td><td>Go <code>regexp</code>, Prometheus/PromQL, Loki/LogQL, Alertmanager, Grafana, Vector, Envoy <code>safe_regex</code>, BigQuery</td><td><strong>No backreferences, no lookarounds.</strong> Guaranteed linear time. Named groups as <code>(?P&lt;name&gt;...)</code></td></tr></table>
<p>Seen for real (GNU grep 3.x, an older build):</p>
<pre>$ echo "502" | grep -E '\\d'; echo rc=$?
rc=1                                   # \\d is not POSIX: no match (newer grep warns "stray \\ before d")
$ echo "a+b" | grep 'a+b'              # BRE: + is a literal
a+b
$ echo "aab" | grep -E 'a+b'           # ERE: + is a quantifier
aab
$ echo "aaa bbb" | sed 's/\\(a*\\) \\(b*\\)/\\2 \\1/'     # BRE groups need backslashes
bbb aaa
$ echo "aaa bbb" | sed -E 's/(a*) (b*)/\\2 \\1/'       # ERE: much more readable
bbb aaa</pre>
<p>Why does RE2 refuse lookarounds and backreferences? Because they make linear-time matching impossible. RE2 compiles the pattern into an automaton and walks the input <em>once</em>: runtime is O(pattern × input), whatever the input. That's exactly the property you want in a monitoring system evaluating user-written queries over billions of log lines.</p>
<blockquote>⚠️ Production tip: copy a PCRE-style regex from Stack Overflow into a Prometheus relabel rule or a LogQL query and you'll get <code>error parsing regexp: invalid or unsupported Perl syntax: (?=</code>. Rewrite lookarounds as "match more, then capture the part you want" with a group.</blockquote>`,
        he: `<p>"Regex" זו משפחה של דיאלקטים. אותה תבנית יכולה לתפוס בכלי אחד ובשקט לא לתפוס כלום בכלי אחר.</p>
<table><tr><th>Flavor</th><th>איפה</th><th>מוזרויות</th></tr>
<tr><td><strong>POSIX BRE</strong></td><td><code>grep</code>, ‏<code>sed</code> (ברירת מחדל)</td><td><code>+ ? | ( ) { }</code> הם literal; כותבים <code>\\+ \\( \\) \\{3\\}</code>. אין <code>\\d</code> — משתמשים ב-<code>[0-9]</code> או <code>[[:digit:]]</code></td></tr>
<tr><td><strong>POSIX ERE</strong></td><td><code>grep -E</code>, ‏<code>sed -E</code>, ‏<code>awk</code></td><td>Metachars רגילים. עדיין אין <code>\\d</code>, אין lazy, אין lookaround</td></tr>
<tr><td><strong>PCRE</strong></td><td><code>grep -P</code>, ‏nginx, ‏PHP, ‏HAProxy, ‏ModSecurity; ‏Python/JS/Java/.NET הם "בני דודים" בסגנון Perl</td><td>הכל: <code>\\d</code>, ‏lazy, ‏lookaround, ‏backreferences, ‏<code>\\K</code>. מנוע backtracking ← יכול להתפוצץ</td></tr>
<tr><td><strong>RE2</strong></td><td>‏<code>regexp</code> של Go, ‏Prometheus/PromQL, ‏Loki/LogQL, ‏Alertmanager, ‏Grafana, ‏Vector, ‏<code>safe_regex</code> של Envoy, ‏BigQuery</td><td><strong>אין backreferences, אין lookarounds.</strong> זמן לינארי מובטח. ‏Named groups בצורה <code>(?P&lt;name&gt;...)</code></td></tr></table>
<p>נבדק באמת (GNU grep 3.x, גרסה ישנה יותר):</p>
<pre>$ echo "502" | grep -E '\\d'; echo rc=$?
rc=1                                   # \\d is not POSIX: no match (newer grep warns "stray \\ before d")
$ echo "a+b" | grep 'a+b'              # BRE: + is a literal
a+b
$ echo "aab" | grep -E 'a+b'           # ERE: + is a quantifier
aab
$ echo "aaa bbb" | sed 's/\\(a*\\) \\(b*\\)/\\2 \\1/'     # BRE groups need backslashes
bbb aaa
$ echo "aaa bbb" | sed -E 's/(a*) (b*)/\\2 \\1/'       # ERE: much more readable
bbb aaa</pre>
<p>למה RE2 מסרב ל-lookarounds ול-backreferences? כי הם הופכים התאמה בזמן לינארי לבלתי אפשרית. ‏RE2 מקמפל את התבנית לאוטומט ועובר על הקלט <em>פעם אחת</em>: זמן הריצה הוא O(pattern × input), לא משנה מה הקלט. זו בדיוק התכונה שאתה רוצה במערכת ניטור שמריצה queries שמשתמשים כתבו על מיליארדי שורות לוג.</p>
<blockquote>⚠️ טיפ לפרודקשן: תעתיק regex בסגנון PCRE מ-Stack Overflow לחוק relabel של Prometheus או ל-query של LogQL ותקבל <code>error parsing regexp: invalid or unsupported Perl syntax: (?=</code>. תכתוב מחדש את ה-lookaround כ"תתפוס יותר, ואז תעשה capture לחלק שאתה צריך" עם group.</blockquote>`
      }
    },
    {
      h: { en: "Infra patterns you'll actually use", he: "תבניות תשתית שבאמת תשתמש בהן" },
      body: {
        en: `<p>Sample nginx combined log line (<code>access.log</code>):</p>
<pre>10.1.2.3 - - [15/Nov/2026:10:02:13 +0000] "GET /api/orders?id=7 HTTP/1.1" 502 157 "-" "curl/8.5.0"</pre>
<table><tr><th>Need</th><th>Regex</th><th>Notes</th></tr>
<tr><td>IPv4 (quick)</td><td><code>\\b([0-9]{1,3}\\.){3}[0-9]{1,3}\\b</code></td><td>Also accepts <code>256.1.1.1</code> — fine for grepping logs</td></tr>
<tr><td>IPv4 (strict)</td><td><code>\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b</code></td><td>Rejects <code>256.1.1.1</code>; for validation, prefer a real parser (<code>ipaddress</code>, <code>net.ParseIP</code>)</td></tr>
<tr><td>ISO-8601 timestamp</td><td><code>\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})</code></td><td>Matches <code>2026-11-15T10:02:13.481Z</code> and <code>...+02:00</code></td></tr>
<tr><td>Status in access log</td><td><code>" ([0-9]{3}) </code></td><td>The 3 digits right after the closing quote of the request</td></tr>
<tr><td>k8s label value</td><td><code>^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$</code></td><td>The official one from apimachinery, plus max 63 chars. Empty is valid; <code>-bad</code> / <code>bad-</code> are not</td></tr></table>
<p>Extracting fields — three tools, same answer (real output on the 3-line sample log):</p>
<pre>$ grep -oP '" \\K[0-9]{3}(?= )' access.log | sort | uniq -c      # PCRE: \\K drops what came before
      1 200
      2 502
$ grep -oP 'user_id=\\K\\d+' app.log                               # \\K = lookbehind without length limits
4411
$ sed -E 's/^([0-9.]+) .*\\] "([A-Z]+) ([^ ]+) [^"]*" ([0-9]{3}) .*/\\4 \\2 \\3 \\1/' access.log
502 GET /api/orders?id=7 10.1.2.3
200 POST /login 10.1.2.9
502 GET /api/orders?id=8 10.1.2.3
$ awk '$9 ~ /^5[0-9][0-9]$/ {print $7}' access.log | sort | uniq -c   # awk: regex on ONE field
      1 /api/orders?id=7
      1 /api/orders?id=8</pre>
<p><strong>PromQL</strong> (RE2) — <code>=~</code> and <code>!~</code> are <strong>fully anchored</strong>: <code>{status=~"5.."}</code> behaves like <code>^(?:5..)$</code>, so it matches <code>503</code> but not <code>1503</code>. And <code>{job=~"api"}</code> matches only the job named exactly <code>api</code> — for "contains" you need <code>{job=~".*api.*"}</code>.</p>
<pre>sum by (status) (rate(http_requests_total{status=~"5..", path!~"/health.*"}[5m]))
{namespace="prod", app=~"(checkout|payments)-.*"} |~ "(?i)timeout|refused"     # LogQL: |~ is NOT anchored
{app="nginx"} | regexp "\\" (?P&lt;status&gt;\\\\d{3}) " | status=~"5.."                 # LogQL: RE2 named group</pre>
<p><strong>nginx</strong> (PCRE) — <code>~</code> case-sensitive, <code>~*</code> case-insensitive. Order: exact <code>=</code> first, then the longest prefix (if it's <code>^~</code>, stop), then regex locations <em>in file order</em>, first match wins:</p>
<pre>location = /healthz            { return 200; }
location ^~ /static/           { root /srv; }                   # prefix, skip regex checks
location ~* \\.(png|jpe?g|css|js)$ { expires 30d; }
location ~ ^/api/v(?&lt;ver&gt;[0-9]+)/ { proxy_pass http://api_v$ver; }   # named capture -&gt; variable</pre>
<p><strong>Python / JS</strong>:</p>
<pre>import re
LINE = re.compile(r'^(?P&lt;ip&gt;\\S+) \\S+ \\S+ \\[(?P&lt;ts&gt;[^\\]]+)\\] "(?P&lt;method&gt;\\S+) (?P&lt;path&gt;\\S+)[^"]*" (?P&lt;status&gt;\\d{3})')
m = LINE.match(line); m["status"]          # '502'   -- always r'' raw strings in Python!

"GET /api/v2/users".replace(/^(\\w+) \\/api\\/v(\\d+)\\/(\\w+)$/, "$1 $3 (v$2)")   // 'GET users (v2)'</pre>
<blockquote>💡 Real world: in Python <code>re.match</code> anchors only at the start, <code>re.search</code> scans, <code>re.fullmatch</code> anchors both ends. Using <code>match</code> for validation lets <code>"admin; rm -rf /"</code> through a <code>[a-z]+</code> check. Use <code>fullmatch</code>.</blockquote>`,
        he: `<p>שורת לוג לדוגמה בפורמט combined של nginx (‏<code>access.log</code>):</p>
<pre>10.1.2.3 - - [15/Nov/2026:10:02:13 +0000] "GET /api/orders?id=7 HTTP/1.1" 502 157 "-" "curl/8.5.0"</pre>
<table><tr><th>צורך</th><th>Regex</th><th>הערות</th></tr>
<tr><td>IPv4 (מהיר)</td><td><code>\\b([0-9]{1,3}\\.){3}[0-9]{1,3}\\b</code></td><td>מקבל גם <code>256.1.1.1</code> — בסדר ל-grep על לוגים</td></tr>
<tr><td>IPv4 (מחמיר)</td><td><code>\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b</code></td><td>דוחה <code>256.1.1.1</code>; לוולידציה עדיף parser אמיתי (‏<code>ipaddress</code>, ‏<code>net.ParseIP</code>)</td></tr>
<tr><td>Timestamp ‏ISO-8601</td><td><code>\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})</code></td><td>תופס <code>2026-11-15T10:02:13.481Z</code> וגם <code>...+02:00</code></td></tr>
<tr><td>Status ב-access log</td><td><code>" ([0-9]{3}) </code></td><td>3 הספרות מיד אחרי המירכאה שסוגרת את ה-request</td></tr>
<tr><td>ערך label ב-k8s</td><td><code>^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$</code></td><td>הרשמי מ-apimachinery, ועוד מקסימום 63 תווים. ריק זה תקין; <code>-bad</code> ו-<code>bad-</code> לא</td></tr></table>
<p>חילוץ שדות — שלושה כלים, אותה תשובה (פלט אמיתי על לוג של 3 שורות):</p>
<pre>$ grep -oP '" \\K[0-9]{3}(?= )' access.log | sort | uniq -c      # PCRE: \\K drops what came before
      1 200
      2 502
$ grep -oP 'user_id=\\K\\d+' app.log                               # \\K = lookbehind without length limits
4411
$ sed -E 's/^([0-9.]+) .*\\] "([A-Z]+) ([^ ]+) [^"]*" ([0-9]{3}) .*/\\4 \\2 \\3 \\1/' access.log
502 GET /api/orders?id=7 10.1.2.3
200 POST /login 10.1.2.9
502 GET /api/orders?id=8 10.1.2.3
$ awk '$9 ~ /^5[0-9][0-9]$/ {print $7}' access.log | sort | uniq -c   # awk: regex on ONE field
      1 /api/orders?id=7
      1 /api/orders?id=8</pre>
<p><strong>PromQL</strong> ‏(RE2) — ‏<code>=~</code> ו-<code>!~</code> <strong>מעוגנים לגמרי</strong>: ‏<code>{status=~"5.."}</code> מתנהג כמו <code>^(?:5..)$</code>, אז הוא תופס <code>503</code> אבל לא <code>1503</code>. ו-<code>{job=~"api"}</code> תופס רק job שקוראים לו בדיוק <code>api</code> — בשביל "מכיל" צריך <code>{job=~".*api.*"}</code>.</p>
<pre>sum by (status) (rate(http_requests_total{status=~"5..", path!~"/health.*"}[5m]))
{namespace="prod", app=~"(checkout|payments)-.*"} |~ "(?i)timeout|refused"     # LogQL: |~ is NOT anchored
{app="nginx"} | regexp "\\" (?P&lt;status&gt;\\\\d{3}) " | status=~"5.."                 # LogQL: RE2 named group</pre>
<p><strong>nginx</strong> ‏(PCRE) — ‏<code>~</code> רגיש לאותיות, ‏<code>~*</code> לא רגיש. הסדר: קודם <code>=</code> מדויק, אחר כך ה-prefix הכי ארוך (אם הוא <code>^~</code> — עוצרים), ואז locations של regex <em>לפי הסדר בקובץ</em>, הראשון שתופס מנצח:</p>
<pre>location = /healthz            { return 200; }
location ^~ /static/           { root /srv; }                   # prefix, skip regex checks
location ~* \\.(png|jpe?g|css|js)$ { expires 30d; }
location ~ ^/api/v(?&lt;ver&gt;[0-9]+)/ { proxy_pass http://api_v$ver; }   # named capture -&gt; variable</pre>
<p><strong>Python / JS</strong>:</p>
<pre>import re
LINE = re.compile(r'^(?P&lt;ip&gt;\\S+) \\S+ \\S+ \\[(?P&lt;ts&gt;[^\\]]+)\\] "(?P&lt;method&gt;\\S+) (?P&lt;path&gt;\\S+)[^"]*" (?P&lt;status&gt;\\d{3})')
m = LINE.match(line); m["status"]          # '502'   -- always r'' raw strings in Python!

"GET /api/v2/users".replace(/^(\\w+) \\/api\\/v(\\d+)\\/(\\w+)$/, "$1 $3 (v$2)")   // 'GET users (v2)'</pre>
<blockquote>💡 מהשטח: ב-Python ‏<code>re.match</code> מעגן רק בהתחלה, ‏<code>re.search</code> סורק, ו-<code>re.fullmatch</code> מעגן בשני הקצוות. אם תשתמש ב-<code>match</code> לוולידציה, ‏<code>"admin; rm -rf /"</code> יעבור בדיקת <code>[a-z]+</code>. תשתמש ב-<code>fullmatch</code>.</blockquote>`
      }
    },
    {
      h: { en: "Catastrophic backtracking (ReDoS) — and the Cloudflare outage", he: "Catastrophic backtracking ‏(ReDoS) — וה-outage של Cloudflare" },
      body: {
        en: `<p>PCRE, Python, JS, Java and .NET use <strong>backtracking</strong> engines: when a path fails, they rewind and try the next way to split the input. With <strong>nested or overlapping quantifiers</strong> the number of ways explodes. <code>^(a+)+$</code> against <code>"aaaa…a!"</code>: every split of the a's between the inner and outer <code>+</code> is tried before giving up — 2<sup>n</sup> paths.</p>
<p>Measured on Node 22 (V8 irregexp):</p>
<pre>/^(a+)+$/ on "a"*n + "!"
n=25    321 ms
n=26    532 ms
n=27    976 ms
n=28   1858 ms      # +1 char = 2x CPU. n=40 would take ~2 hours.
/^a+$/  on "a"*100000 + "!"     1 ms   # same language, no nesting, linear</pre>
<p><strong>Cloudflare, 2 July 2019</strong>: a new WAF rule was deployed globally at once. It contained <code>.*(?:.*=.*)</code> — two <code>.*</code> competing for the same characters. On every HTTP request it pinned CPU to 100% on every core of every edge machine; Cloudflare served 502s worldwide for ~27 minutes until they hit the global WAF kill switch. Same shape, measured in Node on a string with no <code>=</code>:</p>
<pre>/.*(?:.*=.*)/ on "a"*n
n=1000    201 ms
n=2000   1793 ms
n=4000  16018 ms     # 2x input = ~8x time: polynomial (n^3), still fatal at request scale
/=/      on "a"*4000     0 ms</pre>
<p><strong>The shapes to fear</strong>: <code>(a+)+</code>, <code>(\\w+\\s?)*</code>, <code>(a|aa)+</code>, <code>(.*a){10}</code>, <code>.*x.*y.*</code> with no anchors, alternatives that overlap (<code>(\\d|\\w)+</code>).</p>
<p><strong>Defenses</strong>, strongest first:</p>
<ol><li><strong>Linear engine</strong>: RE2 (Go <code>regexp</code>, <code>google-re2</code> for Python, <code>re2</code> for Node), Rust <code>regex</code>, .NET <code>RegexOptions.NonBacktracking</code>. Can't blow up, by design.</li>
<li><strong>Don't nest quantifiers</strong>: make each piece unambiguous. <code>^(\\w+\\s?)*$</code> → <code>^\\w+(?:\\s\\w+)*$</code> (each space forces a new word, only one way to split).</li>
<li><strong>Prefer negated classes</strong> over <code>.*</code>: <code>"[^"]*"</code> instead of <code>".*"</code>.</li>
<li><strong>Cap input length</strong> before matching (e.g. 256 chars for a name field) and set a <strong>match timeout</strong> where supported (.NET <code>matchTimeout</code>, Java via interruptible CharSequence, PCRE <code>match_limit</code>).</li>
<li><strong>Possessive / atomic</strong> groups (<code>a++</code>, <code>(?&gt;a+)</code>) in PCRE/Java/Python 3.11+ forbid giving back.</li></ol>
<blockquote>⚠️ Production tip: treat a regex change on a hot path (WAF, input validation, log router, API gateway) like a code change with a perf test: run it against an adversarial input (<code>"a"*50 + "!"</code>) with a time budget in CI, and roll it out to 1% of traffic first. Cloudflare's post-mortem fixes were exactly this: staged rollouts for WAF rules and a move to linear-time engines.</blockquote>`,
        he: `<p>‏PCRE, ‏Python, ‏JS, ‏Java ו-.NET משתמשים במנועי <strong>backtracking</strong>: כשמסלול נכשל, הם חוזרים אחורה ומנסים את הדרך הבאה לחלק את הקלט. עם <strong>quantifiers מקוננים או חופפים</strong> מספר הדרכים מתפוצץ. ‏<code>^(a+)+$</code> מול <code>"aaaa…a!"</code>: כל חלוקה של ה-a-ים בין ה-<code>+</code> הפנימי לחיצוני נבדקת לפני שהמנוע מוותר — 2<sup>n</sup> מסלולים.</p>
<p>נמדד ב-Node 22 ‏(V8 irregexp):</p>
<pre>/^(a+)+$/ on "a"*n + "!"
n=25    321 ms
n=26    532 ms
n=27    976 ms
n=28   1858 ms      # +1 char = 2x CPU. n=40 would take ~2 hours.
/^a+$/  on "a"*100000 + "!"     1 ms   # same language, no nesting, linear</pre>
<p><strong>Cloudflare, ‏2 ביולי 2019</strong>: חוק WAF חדש עלה לכל העולם בבת אחת. היה בו <code>.*(?:.*=.*)</code> — שני <code>.*</code> שמתחרים על אותם תווים. על כל בקשת HTTP הוא תקע CPU על 100% בכל core של כל מכונת edge; ‏Cloudflare החזירו 502 בכל העולם בערך 27 דקות, עד שלחצו על ה-kill switch הגלובלי של ה-WAF. אותה צורה, נמדדה ב-Node על מחרוזת בלי <code>=</code>:</p>
<pre>/.*(?:.*=.*)/ on "a"*n
n=1000    201 ms
n=2000   1793 ms
n=4000  16018 ms     # 2x input = ~8x time: polynomial (n^3), still fatal at request scale
/=/      on "a"*4000     0 ms</pre>
<p><strong>הצורות שצריך לפחד מהן</strong>: ‏<code>(a+)+</code>, ‏<code>(\\w+\\s?)*</code>, ‏<code>(a|aa)+</code>, ‏<code>(.*a){10}</code>, ‏<code>.*x.*y.*</code> בלי anchors, חלופות שחופפות (‏<code>(\\d|\\w)+</code>).</p>
<p><strong>הגנות</strong>, מהחזקה לחלשה:</p>
<ol><li><strong>מנוע לינארי</strong>: ‏RE2 (‏<code>regexp</code> של Go, ‏<code>google-re2</code> ל-Python, ‏<code>re2</code> ל-Node), ‏<code>regex</code> של Rust, ‏<code>RegexOptions.NonBacktracking</code> ב-.NET. לא יכול להתפוצץ, by design.</li>
<li><strong>לא לקנן quantifiers</strong>: לעשות כל חלק חד-משמעי. ‏<code>^(\\w+\\s?)*$</code> ← <code>^\\w+(?:\\s\\w+)*$</code> (כל רווח מכריח מילה חדשה, יש רק דרך אחת לחלק).</li>
<li><strong>להעדיף negated class</strong> על <code>.*</code>: ‏<code>"[^"]*"</code> במקום <code>".*"</code>.</li>
<li><strong>להגביל אורך קלט</strong> לפני ההתאמה (למשל 256 תווים לשדה שם) ולהגדיר <strong>timeout להתאמה</strong> איפה שאפשר (‏<code>matchTimeout</code> ב-.NET, ב-Java דרך CharSequence שאפשר לעצור, ‏<code>match_limit</code> ב-PCRE).</li>
<li>Groups מסוג <strong>possessive / atomic</strong> ‏(<code>a++</code>, ‏<code>(?&gt;a+)</code>) ב-PCRE/Java/Python 3.11+ אוסרים להחזיר תווים.</li></ol>
<blockquote>⚠️ טיפ לפרודקשן: תתייחס לשינוי regex ב-hot path (‏WAF, ולידציית קלט, log router, ‏API gateway) כמו לשינוי קוד עם בדיקת ביצועים: תריץ אותו מול קלט עוין (<code>"a"*50 + "!"</code>) עם תקציב זמן ב-CI, ותעלה אותו קודם ל-1% מהתעבורה. התיקונים מה-post-mortem של Cloudflare היו בדיוק זה: rollout מדורג לחוקי WAF ומעבר למנועים בזמן לינארי.</blockquote>`
      }
    },
    {
      h: { en: "Testing regexes — and when NOT to use one", he: "לבדוק regex — ומתי לא להשתמש בו בכלל" },
      body: {
        en: `<p><strong>Test like code</strong>: keep a list of should-match and should-not-match strings next to the pattern.</p>
<pre>import re
LABEL = re.compile(r'^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$')
good = ["web-v2", "my.app_1", ""]
bad  = ["-bad", "bad-", "a b"]
assert all(LABEL.fullmatch(s) for s in good)
assert not any(LABEL.fullmatch(s) for s in bad)</pre>
<ul><li><strong>regex101.com</strong> — pick the flavor (PCRE2, Python, Go, JS), see each group, and the "debugger" counts steps: a ReDoS candidate shows "catastrophic backtracking".</li>
<li><strong>Try it on real data first</strong>: <code>grep -cE 'pattern' access.log</code> vs. <code>wc -l</code> — a count of 0 or "everything" means the pattern is wrong.</li>
<li><strong>Static checkers</strong>: <code>semgrep</code> rules, <code>eslint-plugin-regexp</code> / <code>safe-regex</code> flag nested quantifiers in CI.</li>
<li><strong>Comment big ones</strong> with verbose mode: <code>re.compile(r"""^(?P&lt;ip&gt;\\S+) \\s  # client ip ...""", re.X)</code>.</li></ul>
<p><strong>When not to use regex</strong>:</p>
<table><tr><th>Data</th><th>Use instead</th></tr>
<tr><td>JSON (logs, API output, kubectl)</td><td><code>jq -r '.items[] | select(.status.phase!="Running") | .metadata.name'</code> or <code>kubectl -o jsonpath</code></td></tr>
<tr><td>YAML</td><td><code>yq '.spec.template.spec.containers[].image'</code></td></tr>
<tr><td>HTML / XML</td><td>A real parser (BeautifulSoup, <code>xmllint --xpath</code>). Nested tags are not a regular language</td></tr>
<tr><td>CSV with quoted commas</td><td><code>python -c 'import csv…'</code>, <code>mlr</code>, <code>csvkit</code></td></tr>
<tr><td>IPs / CIDRs</td><td><code>ipaddress.ip_network("10.0.0.0/8")</code>, <code>net.ParseCIDR</code> — also does "is this IP in that subnet?" which regex can't</td></tr>
<tr><td>Dates</td><td><code>datetime.fromisoformat</code>; regex says "2026-02-31" is fine</td></tr>
<tr><td>Fixed substring</td><td><code>grep -F</code> / <code>in</code> / <code>strings.Contains</code> — faster and no escaping bugs</td></tr></table>
<blockquote>💡 Real world: <code>grep '"status":500'</code> on JSON logs breaks the day a logger adds a space (<code>"status": 500</code>) or reorders keys. <code>jq 'select(.status==500)'</code> doesn't care.</blockquote>`,
        he: `<p><strong>תבדוק כמו קוד</strong>: תחזיק רשימה של מחרוזות שצריכות לתפוס ושלא צריכות לתפוס, ליד התבנית.</p>
<pre>import re
LABEL = re.compile(r'^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$')
good = ["web-v2", "my.app_1", ""]
bad  = ["-bad", "bad-", "a b"]
assert all(LABEL.fullmatch(s) for s in good)
assert not any(LABEL.fullmatch(s) for s in bad)</pre>
<ul><li><strong>regex101.com</strong> — בוחרים flavor (‏PCRE2, ‏Python, ‏Go, ‏JS), רואים כל group, וה-debugger סופר צעדים: מועמד ל-ReDoS מראה "catastrophic backtracking".</li>
<li><strong>קודם על דאטה אמיתי</strong>: ‏<code>grep -cE 'pattern' access.log</code> מול <code>wc -l</code> — ספירה של 0 או "הכל" אומרת שהתבנית שגויה.</li>
<li><strong>בדיקות סטטיות</strong>: חוקי <code>semgrep</code>, ‏<code>eslint-plugin-regexp</code> או <code>safe-regex</code> מסמנים quantifiers מקוננים ב-CI.</li>
<li><strong>להוסיף הערות לגדולים</strong> עם verbose mode: ‏<code>re.compile(r"""^(?P&lt;ip&gt;\\S+) \\s  # client ip ...""", re.X)</code>.</li></ul>
<p><strong>מתי לא להשתמש ב-regex</strong>:</p>
<table><tr><th>דאטה</th><th>במה להשתמש במקום</th></tr>
<tr><td>JSON (לוגים, פלט API, ‏kubectl)</td><td><code>jq -r '.items[] | select(.status.phase!="Running") | .metadata.name'</code> או <code>kubectl -o jsonpath</code></td></tr>
<tr><td>YAML</td><td><code>yq '.spec.template.spec.containers[].image'</code></td></tr>
<tr><td>HTML / XML</td><td>parser אמיתי (‏BeautifulSoup, ‏<code>xmllint --xpath</code>). תגיות מקוננות הן לא שפה רגולרית</td></tr>
<tr><td>CSV עם פסיקים בתוך מירכאות</td><td><code>python -c 'import csv…'</code>, ‏<code>mlr</code>, ‏<code>csvkit</code></td></tr>
<tr><td>IPs / CIDRs</td><td><code>ipaddress.ip_network("10.0.0.0/8")</code>, ‏<code>net.ParseCIDR</code> — עונים גם על "האם ה-IP הזה בתוך ה-subnet ההוא?", ש-regex לא יכול</td></tr>
<tr><td>תאריכים</td><td><code>datetime.fromisoformat</code>; לפי regex גם "2026-02-31" זה תאריך תקין</td></tr>
<tr><td>Substring קבוע</td><td><code>grep -F</code> / ‏<code>in</code> / ‏<code>strings.Contains</code> — מהיר יותר ובלי באגים של escaping</td></tr></table>
<blockquote>💡 מהשטח: ‏<code>grep '"status":500'</code> על לוגים ב-JSON נשבר ביום שה-logger מוסיף רווח (‏<code>"status": 500</code>) או משנה את סדר המפתחות. ל-<code>jq 'select(.status==500)'</code> זה לא משנה.</blockquote>`
      }
    }
  ],
  diagram: "pattern ──compile──> engine\n  backtracking (PCRE, Python, JS, Java):  try path -> fail -> rewind -> try next   (can be 2^n)\n  automaton    (RE2, Go, Rust, Prometheus): one pass over input, O(pattern x input) (no lookaround/backrefs)",
  handsOn: [
    { cmd: "grep -oP '\" \\K[0-9]{3}(?= )' /var/log/nginx/access.log | sort | uniq -c | sort -rn", what: { en: "Status-code histogram from an nginx access log using PCRE \\K and a lookahead.", he: "היסטוגרמה של status codes מ-access log של nginx, עם \\K ו-lookahead של PCRE." } },
    { cmd: "sed -E 's/^([0-9.]+) .*\\] \"([A-Z]+) ([^ ]+) [^\"]*\" ([0-9]{3}) .*/\\4 \\2 \\3 \\1/' /var/log/nginx/access.log | head", what: { en: "Rewrite each log line as 'status method path ip' with ERE capture groups and backreferences.", he: "לכתוב כל שורת לוג מחדש בתור 'status method path ip' עם capture groups ו-backreferences של ERE." } },
    { cmd: "node -e 'for (const n of [24,25,26,27]) { const t=Date.now(); /^(a+)+$/.test(\"a\".repeat(n)+\"!\"); console.log(n, Date.now()-t, \"ms\") }'", what: { en: "Feel catastrophic backtracking: each extra character roughly doubles the CPU time.", he: "להרגיש catastrophic backtracking: כל תו נוסף בערך מכפיל את זמן ה-CPU." } },
    { cmd: "kubectl get pods -A -o json | jq -r '.items[] | select(.status.phase != \"Running\") | \"\\(.metadata.namespace)/\\(.metadata.name)\"'", what: { en: "The right tool for JSON: jq, not grep. Lists every non-Running Pod.", he: "הכלי הנכון ל-JSON: ‏jq, לא grep. מציג כל Pod שלא ב-Running." } }
  ],
  mnemonic: {
    en: "Anchor it, class it, don't nest it — and know your flavor: POSIX has no \\d, RE2 has no lookaround, PromQL is anchored for you.",
    he: "תעגן, תשתמש ב-class, אל תקנן — ותכיר את ה-flavor: ב-POSIX אין \\d, ב-RE2 אין lookaround, ‏PromQL מעוגן בשבילך."
  },
  pitfalls: [
    { en: "Using \\d in grep -E or sed -E. POSIX ERE has no \\d: older GNU grep silently matches nothing, newer warns 'stray \\ before d'. Use [0-9] or switch to grep -P.", he: "להשתמש ב-\\d ב-grep -E או sed -E. ב-POSIX ERE אין \\d: ‏grep ישן פשוט לא תופס כלום, וחדש מזהיר 'stray \\ before d'. תשתמש ב-[0-9] או תעבור ל-grep -P." },
    { en: "Forgetting that PromQL =~ is fully anchored: {pod=~\"api\"} matches only a pod literally named 'api'. Write {pod=~\"api-.*\"}.", he: "לשכוח ש-=~ ב-PromQL מעוגן לגמרי: ‏{pod=~\"api\"} תופס רק Pod שקוראים לו בדיוק 'api'. תכתוב {pod=~\"api-.*\"}." },
    { en: "Unanchored validation: [a-z]+ 'matches' admin;rm -rf / because it finds 'admin'. Use ^...$ or fullmatch for validation.", he: "ולידציה בלי anchors: ‏[a-z]+ 'תופס' את admin;rm -rf / כי הוא מוצא את 'admin'. לוולידציה תשתמש ב-^...$ או ב-fullmatch." },
    { en: "Nested quantifiers like (\\w+\\s?)* on user input in a backtracking engine — one 30-char request can pin a core for seconds to minutes (ReDoS).", he: "Quantifiers מקוננים כמו (\\w+\\s?)* על קלט משתמש במנוע backtracking — בקשה אחת של 30 תווים יכולה לתקוע core לשניות ואפילו דקות (ReDoS)." }
  ],
  interview: [
    { q: { en: "Why don't Prometheus and Go support lookaheads or backreferences?", he: "למה Prometheus ו-Go לא תומכים ב-lookahead או ב-backreferences?" },
      a: { en: "They use RE2, which compiles the regex to an automaton and scans input once, guaranteeing O(pattern × input) time. Backreferences (and general lookarounds) can't be expressed in that model — matching with backreferences is NP-hard. The trade: less expressive, but no regex can ever DoS your monitoring system.", he: "הם משתמשים ב-RE2, שמקמפל את ה-regex לאוטומט וסורק את הקלט פעם אחת, עם זמן מובטח של O(pattern × input). אי אפשר לבטא backreferences (ו-lookarounds באופן כללי) במודל הזה — התאמה עם backreferences היא NP-hard. הטרייד-אוף: פחות כוח הבעה, אבל אף regex לא יכול לעשות DoS למערכת הניטור שלך." } },
    { q: { en: "A validation regex makes one request take 20 seconds of CPU. What's happening and how do you fix it?", he: "Regex של ולידציה גורם לבקשה אחת לקחת 20 שניות CPU. מה קורה ואיך מתקנים?" },
      a: { en: "Catastrophic backtracking: nested/overlapping quantifiers give the backtracking engine exponentially many ways to split a non-matching input. Short term: roll back, cap input length. Fix: rewrite unambiguously (^\\w+(?:\\s\\w+)*$ instead of ^(\\w+\\s?)*$), or use a linear engine (RE2, Rust regex, .NET NonBacktracking), add a timeout, and add an adversarial-input perf test in CI.", he: "Catastrophic backtracking: ‏quantifiers מקוננים או חופפים נותנים למנוע ה-backtracking מספר אקספוננציאלי של דרכים לחלק קלט שלא תואם. בטווח הקצר: rollback ולהגביל אורך קלט. התיקון: לכתוב חד-משמעי (‏^\\w+(?:\\s\\w+)*$ במקום ^(\\w+\\s?)*$), או מנוע לינארי (‏RE2, ‏Rust regex, ‏.NET NonBacktracking), להוסיף timeout, ולהוסיף בדיקת ביצועים עם קלט עוין ב-CI." } }
  ],
  quiz: [
    { q: { en: "What does {status=~\"5..\"} match in PromQL?", he: "מה {status=~\"5..\"} תופס ב-PromQL?" },
      options: [
        { en: "Any status containing a 5 followed by two chars, e.g. 1503", he: "כל status שמכיל 5 ואחריו שני תווים, למשל 1503" },
        { en: "Exactly three-character values starting with 5, like 500 or 503 (anchored)", he: "בדיוק ערכים של שלושה תווים שמתחילים ב-5, כמו 500 או 503 (מעוגן)" },
        { en: "Only the literal string 5..", he: "רק את המחרוזת המילולית 5.." },
        { en: "Nothing — PromQL does not support regex", he: "כלום — PromQL לא תומך ב-regex" }
      ], answer: 1,
      explain: { en: "PromQL label matchers are RE2 and fully anchored: =~\"5..\" is ^(?:5..)$.", he: "Label matchers ב-PromQL הם RE2 ומעוגנים לגמרי: ‏=~\"5..\" זה ^(?:5..)$." } },
    { q: { en: "Which pattern is a ReDoS risk in a backtracking engine?", he: "איזו תבנית היא סיכון ReDoS במנוע backtracking?" },
      options: [
        { en: "^[a-z0-9-]{1,63}$", he: "^[a-z0-9-]{1,63}$" },
        { en: "\"[^\"]*\"", he: "\"[^\"]*\"" },
        { en: "^(\\w+\\s?)*$", he: "^(\\w+\\s?)*$" },
        { en: "^\\d{3}$", he: "^\\d{3}$" }
      ], answer: 2,
      explain: { en: "\\w+ inside a repeated group with an optional separator means many ways to split the same word characters — exponential backtracking on a non-matching tail like '!'.", he: "‏\\w+ בתוך group שחוזר עם מפריד אופציונלי — יש הרבה דרכים לחלק את אותם תווים, וזה backtracking אקספוננציאלי כשהסוף לא תואם, למשל '!'." } },
    { q: { en: "You paste (?<=user=)\\w+ into a Loki query and get a parse error. Why?", he: "הדבקת (?<=user=)\\w+ ב-query של Loki וקיבלת שגיאת parse. למה?" },
      options: [
        { en: "Loki needs double escaping of =", he: "Loki צריך escaping כפול ל-=" },
        { en: "Loki uses RE2, which has no lookbehind; use a capture group instead", he: "Loki משתמש ב-RE2, שאין בו lookbehind; תשתמש ב-capture group במקום" },
        { en: "Loki only supports POSIX BRE", he: "Loki תומך רק ב-POSIX BRE" },
        { en: "Lookbehind needs the m flag", he: "Lookbehind דורש את ה-flag m" }
      ], answer: 1,
      explain: { en: "RE2 (Go, Prometheus, Loki) rejects lookarounds and backreferences to guarantee linear time. Rewrite as user=(?P<user>\\w+).", he: "RE2 (‏Go, ‏Prometheus, ‏Loki) דוחה lookarounds ו-backreferences כדי להבטיח זמן לינארי. תכתוב מחדש: user=(?P<user>\\w+)." } },
    { q: { en: "Best way to list Pods whose phase isn't Running from kubectl JSON output?", he: "מה הדרך הכי טובה להציג Pods שה-phase שלהם לא Running מתוך פלט JSON של kubectl?" },
      options: [
        { en: "grep -v '\"phase\":\"Running\"'", he: "grep -v '\"phase\":\"Running\"'" },
        { en: "A PCRE with lookahead over the whole JSON", he: "PCRE עם lookahead על כל ה-JSON" },
        { en: "jq 'select(.status.phase != \"Running\")' (or a field selector)", he: "jq 'select(.status.phase != \"Running\")' (או field selector)" },
        { en: "sed -E to strip braces, then awk", he: "sed -E שמוריד סוגריים ואז awk" }
      ], answer: 2,
      explain: { en: "JSON is structured, nested and whitespace-insensitive; regex breaks on formatting changes. Use jq (or kubectl --field-selector status.phase!=Running).", he: "JSON הוא מובנה, מקונן ולא רגיש לרווחים; ‏regex נשבר כשהפורמט משתנה. תשתמש ב-jq (או kubectl --field-selector status.phase!=Running)." } }
  ],
  playground: "terminal",
  related: ["linux-text-processing", "pr-input-validation", "obs-prometheus-deep", "obs-logging-pipeline", "net-ddos-edge"]
});

// ───────────────────────────── Linux Namespaces Hands-On ─────────────────────────────
INFRA.lessons.push({
  id: "linux-namespaces-hands-on",
  track: "linux",
  order: 51,
  icon: "🪆",
  level: 3,
  minutes: 18,
  title: { en: "Linux Namespaces Hands-On", he: "Linux Namespaces בידיים" },
  tldr: {
    en: "A container is a process started with a few clone()/unshare() flags. With unshare, ip netns, veth pairs and a bridge you can build one by hand in 15 commands — and with nsenter you can walk into any container or Pod with your host's debugging tools.",
    he: "קונטיינר הוא תהליך שהופעל עם כמה flags של clone() או unshare(). עם unshare, ‏ip netns, זוגות veth ו-bridge אפשר לבנות אחד בידיים ב-15 פקודות — ועם nsenter אפשר להיכנס לכל קונטיינר או Pod עם כלי הדיבאג של ה-host."
  },
  analogy: {
    en: "Namespaces are a hotel. Every guest gets a room with its own door number, phone extension, mini-bar and TV channel list — from inside the room it looks like a private apartment. But it's one building: one foundation (the kernel), one electrical system, one water main. Housekeeping (nsenter) holds a master key and can walk into any room with its own cart of tools. And if the foundation cracks, every room shakes.",
    he: "Namespaces זה מלון. כל אורח מקבל חדר עם מספר דלת משלו, שלוחת טלפון, מיני-בר ורשימת ערוצים — מבפנים זה נראה כמו דירה פרטית. אבל זה בניין אחד: יסודות אחד (ה-kernel), מערכת חשמל אחת, צנרת מים אחת. משק הבית (nsenter) מחזיק master key ויכול להיכנס לכל חדר עם עגלת הכלים שלו. ואם היסודות נסדקים, כל החדרים רועדים."
  },
  sections: [
    {
      h: { en: "The 8 namespaces and where to see them", he: "8 ה-namespaces ואיפה רואים אותם" },
      body: {
        en: `<table><tr><th>Namespace</th><th>Flag</th><th>Isolates</th><th>Since</th></tr>
<tr><td><strong>mnt</strong></td><td>CLONE_NEWNS</td><td>Mount table: own <code>/</code>, own mounts (the image rootfs via <code>pivot_root</code>)</td><td>2.4.19 (2002)</td></tr>
<tr><td><strong>uts</strong></td><td>CLONE_NEWUTS</td><td>Hostname and NIS domain name</td><td>2.6.19</td></tr>
<tr><td><strong>ipc</strong></td><td>CLONE_NEWIPC</td><td>SysV IPC, POSIX message queues (<code>/dev/shm</code> is a mount thing)</td><td>2.6.19</td></tr>
<tr><td><strong>pid</strong></td><td>CLONE_NEWPID</td><td>PID numbers: first process is PID 1; parent sees the real PIDs</td><td>2.6.24</td></tr>
<tr><td><strong>net</strong></td><td>CLONE_NEWNET</td><td>Interfaces, IPs, routes, iptables/nftables, sockets, ports, <code>/proc/sys/net</code></td><td>2.6.29</td></tr>
<tr><td><strong>user</strong></td><td>CLONE_NEWUSER</td><td>UID/GID mapping and capabilities: root inside, nobody outside</td><td>3.8</td></tr>
<tr><td><strong>cgroup</strong></td><td>CLONE_NEWCGROUP</td><td>View of <code>/proc/self/cgroup</code> and <code>/sys/fs/cgroup</code>: own cgroup looks like the root</td><td>4.6</td></tr>
<tr><td><strong>time</strong></td><td>CLONE_NEWTIME</td><td>Offsets for <code>CLOCK_MONOTONIC</code> and <code>CLOCK_BOOTTIME</code> (not wall-clock time!)</td><td>5.6</td></tr></table>
<p>Every process's namespaces are symlinks in <code>/proc/PID/ns</code>. Two processes share a namespace if the inode numbers match:</p>
<pre>$ ls -l /proc/$$/ns
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 cgroup -&gt; 'cgroup:[4026531835]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 ipc -&gt; 'ipc:[4026531839]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 mnt -&gt; 'mnt:[4026531841]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 net -&gt; 'net:[4026531840]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 pid -&gt; 'pid:[4026531836]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 pid_for_children -&gt; 'pid:[4026531836]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 time -&gt; 'time:[4026531834]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 time_for_children -&gt; 'time:[4026531834]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 user -&gt; 'user:[4026531837]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 uts -&gt; 'uts:[4026531838]'

$ sudo lsns                      # all namespaces on the box, with their first process
        NS TYPE   NPROCS   PID USER   COMMAND
4026531834 time      214     1 root   /sbin/init
4026531835 cgroup    201     1 root   /sbin/init
4026531836 pid       201     1 root   /sbin/init
4026531840 net       203     1 root   /sbin/init
4026532301 mnt         1 48211 root   sleep 9999
4026532302 uts         1 48211 root   sleep 9999
4026532303 ipc         1 48211 root   sleep 9999
4026532304 pid         1 48211 root   sleep 9999
4026532306 net         1 48211 root   sleep 9999
4026532370 cgroup      1 48211 root   sleep 9999
$ sudo lsns -t net -p 48211      # just the net namespace of one process</pre>
<p>Note the container (<code>sleep 9999</code>, PID 48211) has no own <code>user</code> or <code>time</code> line — Docker's default is to share the host's user and time namespaces. A Kubernetes Pod shows the same <code>net</code>, <code>ipc</code> and <code>uts</code> inode for all its containers (plus the <code>pause</code> process that holds them open).</p>
<blockquote>💡 Real world: a namespace lives as long as something references it — a process, an open fd to <code>/proc/PID/ns/net</code>, or a bind mount like <code>/run/netns/red</code>. That's exactly what <code>ip netns add</code> does and why a Pod's <code>pause</code> container exists: to keep the net namespace alive while app containers crash and restart.</blockquote>`,
        he: `<table><tr><th>Namespace</th><th>Flag</th><th>מה מבודד</th><th>מאז</th></tr>
<tr><td><strong>mnt</strong></td><td>CLONE_NEWNS</td><td>טבלת ה-mounts: ‏<code>/</code> משלו, ‏mounts משלו (ה-rootfs של ה-image דרך <code>pivot_root</code>)</td><td>2.4.19 (2002)</td></tr>
<tr><td><strong>uts</strong></td><td>CLONE_NEWUTS</td><td>Hostname ושם NIS domain</td><td>2.6.19</td></tr>
<tr><td><strong>ipc</strong></td><td>CLONE_NEWIPC</td><td>SysV IPC, תורי הודעות POSIX (‏<code>/dev/shm</code> זה עניין של mount)</td><td>2.6.19</td></tr>
<tr><td><strong>pid</strong></td><td>CLONE_NEWPID</td><td>מספרי PID: התהליך הראשון הוא PID 1; ההורה רואה את ה-PIDs האמיתיים</td><td>2.6.24</td></tr>
<tr><td><strong>net</strong></td><td>CLONE_NEWNET</td><td>Interfaces, ‏IPs, ‏routes, ‏iptables/nftables, ‏sockets, פורטים, ‏<code>/proc/sys/net</code></td><td>2.6.29</td></tr>
<tr><td><strong>user</strong></td><td>CLONE_NEWUSER</td><td>מיפוי UID/GID ו-capabilities: ‏root בפנים, ‏nobody בחוץ</td><td>3.8</td></tr>
<tr><td><strong>cgroup</strong></td><td>CLONE_NEWCGROUP</td><td>התצוגה של <code>/proc/self/cgroup</code> ו-<code>/sys/fs/cgroup</code>: ה-cgroup שלו נראה כמו השורש</td><td>4.6</td></tr>
<tr><td><strong>time</strong></td><td>CLONE_NEWTIME</td><td>Offsets ל-<code>CLOCK_MONOTONIC</code> ול-<code>CLOCK_BOOTTIME</code> (לא שעון הקיר!)</td><td>5.6</td></tr></table>
<p>ה-namespaces של כל תהליך הם symlinks תחת <code>/proc/PID/ns</code>. שני תהליכים חולקים namespace אם מספרי ה-inode זהים:</p>
<pre>$ ls -l /proc/$$/ns
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 cgroup -&gt; 'cgroup:[4026531835]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 ipc -&gt; 'ipc:[4026531839]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 mnt -&gt; 'mnt:[4026531841]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 net -&gt; 'net:[4026531840]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 pid -&gt; 'pid:[4026531836]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 pid_for_children -&gt; 'pid:[4026531836]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 time -&gt; 'time:[4026531834]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 time_for_children -&gt; 'time:[4026531834]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 user -&gt; 'user:[4026531837]'
lrwxrwxrwx 1 dev dev 0 Nov 15 10:20 uts -&gt; 'uts:[4026531838]'

$ sudo lsns                      # all namespaces on the box, with their first process
        NS TYPE   NPROCS   PID USER   COMMAND
4026531834 time      214     1 root   /sbin/init
4026531835 cgroup    201     1 root   /sbin/init
4026531836 pid       201     1 root   /sbin/init
4026531840 net       203     1 root   /sbin/init
4026532301 mnt         1 48211 root   sleep 9999
4026532302 uts         1 48211 root   sleep 9999
4026532303 ipc         1 48211 root   sleep 9999
4026532304 pid         1 48211 root   sleep 9999
4026532306 net         1 48211 root   sleep 9999
4026532370 cgroup      1 48211 root   sleep 9999
$ sudo lsns -t net -p 48211      # just the net namespace of one process</pre>
<p>שים לב שלקונטיינר (‏<code>sleep 9999</code>, ‏PID 48211) אין שורת <code>user</code> או <code>time</code> משלו — ברירת המחדל של Docker היא לחלוק את ה-user וה-time namespaces של ה-host. ‏Pod ב-Kubernetes מראה את אותו inode של <code>net</code>, ‏<code>ipc</code> ו-<code>uts</code> לכל הקונטיינרים שלו (ועוד תהליך <code>pause</code> שמחזיק אותם פתוחים).</p>
<blockquote>💡 מהשטח: namespace חי כל עוד משהו מפנה אליו — תהליך, ‏fd פתוח ל-<code>/proc/PID/ns/net</code>, או bind mount כמו <code>/run/netns/red</code>. זה בדיוק מה ש-<code>ip netns add</code> עושה, ובגלל זה קיים קונטיינר ה-<code>pause</code> ב-Pod: להחזיק את ה-net namespace בחיים בזמן שקונטיינרי האפליקציה קורסים ועולים מחדש.</blockquote>`
      }
    },
    {
      h: { en: "Build a \"container\" by hand with unshare", he: "לבנות \"קונטיינר\" בידיים עם unshare" },
      body: {
        en: `<p><code>unshare</code> (util-linux) runs a command in new namespaces. Add them one at a time and watch what changes.</p>
<p><strong>PID</strong> — you need <code>--fork</code> (the <em>child</em> becomes PID 1) and <code>--mount-proc</code> (a fresh <code>/proc</code>, otherwise <code>ps</code> reads the host's):</p>
<pre>$ sudo unshare --pid --fork --mount-proc bash
# ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   8964  5376 pts/2    S    10:14   0:00 bash
root           8  0.0  0.0  10884  4352 pts/2    R+   10:14   0:00 ps aux
# kill -9 1        # PID 1 ignores signals it has no handler for, even from root inside
# exit             # when PID 1 dies, the kernel SIGKILLs everything in the namespace</pre>
<p>Without <code>--fork</code>: <code>unshare</code> itself isn't moved, its first child becomes PID 1 and exits, and the next fork fails with <code>bash: fork: Cannot allocate memory</code>. Without <code>--mount-proc</code>: <code>ps</code> shows all host processes, because <code>/proc</code> is still the host's mount.</p>
<p><strong>UTS + NET</strong>:</p>
<pre>$ sudo unshare --uts --net bash
# hostname box1; hostname
box1                                  # host's hostname untouched
# ip a
1: lo: &lt;LOOPBACK&gt; mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
# ping -c1 8.8.8.8
ping: connect: Network is unreachable # a brand-new net ns has only a DOWN loopback
# ip link set lo up                   # even localhost needs this</pre>
<p><strong>USER</strong> — no sudo needed. You're "root" inside, still yourself outside:</p>
<pre>$ unshare --user --map-root-user bash
# id
uid=0(root) gid=0(root) groups=0(root),65534(nogroup)
# cat /proc/self/uid_map
         0       1000          1         # inside-uid  outside-uid  count
# cat /etc/shadow
cat: /etc/shadow: Permission denied     # host files still see uid 1000</pre>
<p><strong>All together</strong> — basically <code>docker run</code> minus the image, cgroups and seccomp:</p>
<pre>$ sudo unshare --mount --uts --ipc --net --pid --fork --cgroup --mount-proc \\
       chroot /srv/alpine-rootfs /bin/sh
/ # hostname c1; ps; ls /
PID   USER     TIME  COMMAND
    1 root      0:00 /bin/sh
    3 root      0:00 ps
bin    dev    etc    home   lib    ...</pre>
<p>Real runtimes (runc, crun) do the same with <code>clone(CLONE_NEW*)</code>, then <code>pivot_root</code> into the image (stronger than chroot), drop capabilities, apply seccomp and AppArmor/SELinux, and put the PID in a cgroup. Want only the "time" one? <code>sudo unshare --time --fork --boottime 86400 uptime</code> reports 1 day more uptime — the wall clock stays the same.</p>`,
        he: `<p><code>unshare</code> (מ-util-linux) מריץ פקודה ב-namespaces חדשים. תוסיף אותם אחד אחד ותראה מה משתנה.</p>
<p><strong>PID</strong> — צריך <code>--fork</code> (ה<em>ילד</em> הופך ל-PID 1) ו-<code>--mount-proc</code> (‏<code>/proc</code> חדש, אחרת <code>ps</code> קורא את של ה-host):</p>
<pre>$ sudo unshare --pid --fork --mount-proc bash
# ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   8964  5376 pts/2    S    10:14   0:00 bash
root           8  0.0  0.0  10884  4352 pts/2    R+   10:14   0:00 ps aux
# kill -9 1        # PID 1 ignores signals it has no handler for, even from root inside
# exit             # when PID 1 dies, the kernel SIGKILLs everything in the namespace</pre>
<p>בלי <code>--fork</code>: ‏<code>unshare</code> עצמו לא עובר, הילד הראשון שלו הופך ל-PID 1 ויוצא, וה-fork הבא נכשל עם <code>bash: fork: Cannot allocate memory</code>. בלי <code>--mount-proc</code>: ‏<code>ps</code> מראה את כל התהליכים של ה-host, כי <code>/proc</code> עדיין ה-mount של ה-host.</p>
<p><strong>UTS + NET</strong>:</p>
<pre>$ sudo unshare --uts --net bash
# hostname box1; hostname
box1                                  # host's hostname untouched
# ip a
1: lo: &lt;LOOPBACK&gt; mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
# ping -c1 8.8.8.8
ping: connect: Network is unreachable # a brand-new net ns has only a DOWN loopback
# ip link set lo up                   # even localhost needs this</pre>
<p><strong>USER</strong> — בלי sudo. אתה "root" בפנים, ועדיין אתה עצמך בחוץ:</p>
<pre>$ unshare --user --map-root-user bash
# id
uid=0(root) gid=0(root) groups=0(root),65534(nogroup)
# cat /proc/self/uid_map
         0       1000          1         # inside-uid  outside-uid  count
# cat /etc/shadow
cat: /etc/shadow: Permission denied     # host files still see uid 1000</pre>
<p><strong>הכל ביחד</strong> — בעצם <code>docker run</code> בלי ה-image, ‏cgroups ו-seccomp:</p>
<pre>$ sudo unshare --mount --uts --ipc --net --pid --fork --cgroup --mount-proc \\
       chroot /srv/alpine-rootfs /bin/sh
/ # hostname c1; ps; ls /
PID   USER     TIME  COMMAND
    1 root      0:00 /bin/sh
    3 root      0:00 ps
bin    dev    etc    home   lib    ...</pre>
<p>Runtimes אמיתיים (‏runc, ‏crun) עושים אותו דבר עם <code>clone(CLONE_NEW*)</code>, ואז <code>pivot_root</code> לתוך ה-image (חזק יותר מ-chroot), מורידים capabilities, מפעילים seccomp ו-AppArmor/SELinux, ומכניסים את ה-PID ל-cgroup. רוצה רק את ה-time? ‏<code>sudo unshare --time --fork --boottime 86400 uptime</code> מדווח על יום uptime יותר — ושעון הקיר נשאר אותו דבר.</p>`
      }
    },
    {
      h: { en: "Wire two namespaces: ip netns, veth pairs and a bridge", he: "לחבר שני namespaces: ‏ip netns, זוגות veth ו-bridge" },
      body: {
        en: `<p>This is what Docker's <code>docker0</code> and the Kubernetes bridge CNI plugin do for every container. A <strong>veth pair</strong> is a virtual cable: a packet in one end comes out the other. Put one end in the namespace, plug the other into a Linux <strong>bridge</strong> (a virtual switch) on the host.</p>
<pre>red [veth-red 10.10.0.2] ══ veth-red-br ─┐
                                         br0 10.10.0.1/24 (host) ── eth0 ── internet (NAT)
blue[veth-blue 10.10.0.3]══ veth-blue-br ┘</pre>
<pre># 1. two namespaces + a bridge
sudo ip netns add red
sudo ip netns add blue
sudo ip link add br0 type bridge
sudo ip addr add 10.10.0.1/24 dev br0
sudo ip link set br0 up

# 2. two cables, one end of each into a namespace
sudo ip link add veth-red  type veth peer name veth-red-br
sudo ip link add veth-blue type veth peer name veth-blue-br
sudo ip link set veth-red  netns red
sudo ip link set veth-blue netns blue

# 3. plug the host ends into the bridge
sudo ip link set veth-red-br  master br0 up
sudo ip link set veth-blue-br master br0 up

# 4. addresses inside
sudo ip -n red  addr add 10.10.0.2/24 dev veth-red
sudo ip -n blue addr add 10.10.0.3/24 dev veth-blue
sudo ip -n red  link set veth-red  up;  sudo ip -n red  link set lo up
sudo ip -n blue link set veth-blue up;  sudo ip -n blue link set lo up

$ sudo ip netns exec red ping -c 3 10.10.0.3
PING 10.10.0.3 (10.10.0.3) 56(84) bytes of data.
64 bytes from 10.10.0.3: icmp_seq=1 ttl=64 time=0.072 ms
64 bytes from 10.10.0.3: icmp_seq=2 ttl=64 time=0.061 ms
64 bytes from 10.10.0.3: icmp_seq=3 ttl=64 time=0.051 ms

--- 10.10.0.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2041ms
rtt min/avg/max/mdev = 0.051/0.061/0.072/0.008 ms</pre>
<p><strong>Out to the internet</strong> = default route via the bridge + forwarding + NAT (this is literally Docker's MASQUERADE rule):</p>
<pre>sudo ip -n red route add default via 10.10.0.1
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -s 10.10.0.0/24 ! -o br0 -j MASQUERADE
$ sudo ip netns exec red ping -c1 1.1.1.1
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=3.12 ms

$ bridge link                    # who's plugged into br0
5: veth-red-br@if6: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 master br0 state forwarding
7: veth-blue-br@if8: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 master br0 state forwarding
sudo ip netns del red; sudo ip netns del blue; sudo ip link del br0   # cleanup (veths die with their ns)</pre>
<blockquote>⚠️ Production tip: if red can't ping blue on a box that also runs Docker, check <code>iptables -L FORWARD</code>: Docker sets the FORWARD policy to DROP, and with <code>br_netfilter</code> loaded (Kubernetes requires it) bridged traffic goes through iptables too. Add <code>iptables -I FORWARD -i br0 -o br0 -j ACCEPT</code>. Interface names max out at 15 characters — <code>veth-payments-br</code> fails with <code>Error: argument ... is wrong: "name" not a valid ifname</code>.</blockquote>`,
        he: `<p>זה מה ש-<code>docker0</code> של Docker ו-plugin ה-bridge של CNI ב-Kubernetes עושים לכל קונטיינר. <strong>זוג veth</strong> הוא כבל וירטואלי: חבילה שנכנסת בקצה אחד יוצאת בשני. שמים קצה אחד ב-namespace, ואת השני מחברים ל-<strong>bridge</strong> של Linux (switch וירטואלי) על ה-host.</p>
<pre>red [veth-red 10.10.0.2] ══ veth-red-br ─┐
                                         br0 10.10.0.1/24 (host) ── eth0 ── internet (NAT)
blue[veth-blue 10.10.0.3]══ veth-blue-br ┘</pre>
<pre># 1. two namespaces + a bridge
sudo ip netns add red
sudo ip netns add blue
sudo ip link add br0 type bridge
sudo ip addr add 10.10.0.1/24 dev br0
sudo ip link set br0 up

# 2. two cables, one end of each into a namespace
sudo ip link add veth-red  type veth peer name veth-red-br
sudo ip link add veth-blue type veth peer name veth-blue-br
sudo ip link set veth-red  netns red
sudo ip link set veth-blue netns blue

# 3. plug the host ends into the bridge
sudo ip link set veth-red-br  master br0 up
sudo ip link set veth-blue-br master br0 up

# 4. addresses inside
sudo ip -n red  addr add 10.10.0.2/24 dev veth-red
sudo ip -n blue addr add 10.10.0.3/24 dev veth-blue
sudo ip -n red  link set veth-red  up;  sudo ip -n red  link set lo up
sudo ip -n blue link set veth-blue up;  sudo ip -n blue link set lo up

$ sudo ip netns exec red ping -c 3 10.10.0.3
PING 10.10.0.3 (10.10.0.3) 56(84) bytes of data.
64 bytes from 10.10.0.3: icmp_seq=1 ttl=64 time=0.072 ms
64 bytes from 10.10.0.3: icmp_seq=2 ttl=64 time=0.061 ms
64 bytes from 10.10.0.3: icmp_seq=3 ttl=64 time=0.051 ms

--- 10.10.0.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2041ms
rtt min/avg/max/mdev = 0.051/0.061/0.072/0.008 ms</pre>
<p><strong>יציאה לאינטרנט</strong> = default route דרך ה-bridge, ‏forwarding ו-NAT (זה ממש חוק ה-MASQUERADE של Docker):</p>
<pre>sudo ip -n red route add default via 10.10.0.1
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -s 10.10.0.0/24 ! -o br0 -j MASQUERADE
$ sudo ip netns exec red ping -c1 1.1.1.1
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=3.12 ms

$ bridge link                    # who's plugged into br0
5: veth-red-br@if6: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 master br0 state forwarding
7: veth-blue-br@if8: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 master br0 state forwarding
sudo ip netns del red; sudo ip netns del blue; sudo ip link del br0   # cleanup (veths die with their ns)</pre>
<blockquote>⚠️ טיפ לפרודקשן: אם red לא מצליח לעשות ping ל-blue על מכונה שמריצה גם Docker, תבדוק <code>iptables -L FORWARD</code>: ‏Docker משנה את ה-policy של FORWARD ל-DROP, וכש-<code>br_netfilter</code> טעון (‏Kubernetes דורש אותו) גם תעבורה שעוברת ב-bridge עוברת דרך iptables. תוסיף <code>iptables -I FORWARD -i br0 -o br0 -j ACCEPT</code>. שמות interface מוגבלים ל-15 תווים — ‏<code>veth-payments-br</code> ייכשל עם <code>Error: argument ... is wrong: "name" not a valid ifname</code>.</blockquote>`
      }
    },
    {
      h: { en: "nsenter: debug a container or Pod with host tools", he: "nsenter: לדבג קונטיינר או Pod עם הכלים של ה-host" },
      body: {
        en: `<p>Distroless and scratch images have no shell, no <code>ss</code>, no <code>tcpdump</code>. You don't need them: enter just the container's <strong>net</strong> namespace and run the host's binaries (the mount namespace stays the host's, so <code>/usr/sbin/tcpdump</code> is there).</p>
<pre># Docker
$ PID=$(docker inspect -f '{{.State.Pid}}' web); echo $PID
48211

# Kubernetes node (containerd / CRI-O)
$ crictl ps --name api -q
3f9a1c0b7e2d4...
$ PID=$(crictl inspect -o go-template --template '{{.info.pid}}' 3f9a1c0b7e2d4); echo $PID
51877

$ sudo nsenter -t $PID -n ss -tlnp              # what's the app really listening on?
State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
LISTEN 0      4096        127.0.0.1:8080       0.0.0.0:*     users:(("api",pid=51877,fd=7))
# ^ bound to 127.0.0.1, not 0.0.0.0 -&gt; the Service gets "connection refused". Found it.

$ sudo nsenter -t $PID -n tcpdump -i eth0 -nn port 5432      # the Pod's traffic, from the Pod's eth0
$ sudo nsenter -t $PID -n ip route; sudo nsenter -t $PID -n cat /etc/resolv.conf   # careful: see below
$ sudo nsenter -t $PID -a sh                    # ALL namespaces = like docker exec (needs a shell in the image)</pre>
<table><tr><th>Flag</th><th>Enters</th><th>Typical use</th></tr>
<tr><td><code>-n</code></td><td>net</td><td><code>ss</code>, <code>tcpdump</code>, <code>curl</code>, <code>ip</code>, <code>iptables -L</code> as the Pod sees them</td></tr>
<tr><td><code>-m</code></td><td>mnt</td><td>see the container's filesystem; then your host tools are gone</td></tr>
<tr><td><code>-p</code></td><td>pid</td><td><code>ps</code> as the container sees it (combine with <code>-m</code> for its <code>/proc</code>)</td></tr>
<tr><td><code>-u -i -U -C</code></td><td>uts, ipc, user, cgroup</td><td>hostname checks, shared memory, rootless containers</td></tr>
<tr><td><code>-a</code></td><td>all</td><td>full "exec" into the container</td></tr></table>
<p>Gotcha: with only <code>-n</code>, <code>cat /etc/resolv.conf</code> reads the <em>host's</em> file (mount namespace not entered). To see the Pod's: <code>cat /proc/$PID/root/etc/resolv.conf</code> — <code>/proc/PID/root</code> is a window into any process's root filesystem.</p>
<blockquote>💡 Real world: the Kubernetes-native equivalent is <code>kubectl debug -it pod/api --image=nicolaka/netshoot --target=api</code> — an ephemeral container that joins the Pod's namespaces (and with <code>--target</code>, the app's PID namespace). Use it when you don't have node SSH; reach for nsenter when you do, or when the kubelet itself is the problem.</blockquote>`,
        he: `<p>ל-images מסוג distroless ו-scratch אין shell, אין <code>ss</code>, אין <code>tcpdump</code>. אתה לא צריך אותם: תיכנס רק ל-<strong>net</strong> namespace של הקונטיינר ותריץ את הבינאריים של ה-host (ה-mount namespace נשאר של ה-host, אז <code>/usr/sbin/tcpdump</code> קיים).</p>
<pre># Docker
$ PID=$(docker inspect -f '{{.State.Pid}}' web); echo $PID
48211

# Kubernetes node (containerd / CRI-O)
$ crictl ps --name api -q
3f9a1c0b7e2d4...
$ PID=$(crictl inspect -o go-template --template '{{.info.pid}}' 3f9a1c0b7e2d4); echo $PID
51877

$ sudo nsenter -t $PID -n ss -tlnp              # what's the app really listening on?
State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
LISTEN 0      4096        127.0.0.1:8080       0.0.0.0:*     users:(("api",pid=51877,fd=7))
# ^ bound to 127.0.0.1, not 0.0.0.0 -&gt; the Service gets "connection refused". Found it.

$ sudo nsenter -t $PID -n tcpdump -i eth0 -nn port 5432      # the Pod's traffic, from the Pod's eth0
$ sudo nsenter -t $PID -n ip route; sudo nsenter -t $PID -n cat /etc/resolv.conf   # careful: see below
$ sudo nsenter -t $PID -a sh                    # ALL namespaces = like docker exec (needs a shell in the image)</pre>
<table><tr><th>Flag</th><th>נכנס ל-</th><th>שימוש טיפוסי</th></tr>
<tr><td><code>-n</code></td><td>net</td><td><code>ss</code>, ‏<code>tcpdump</code>, ‏<code>curl</code>, ‏<code>ip</code>, ‏<code>iptables -L</code> כמו שה-Pod רואה אותם</td></tr>
<tr><td><code>-m</code></td><td>mnt</td><td>לראות את ה-filesystem של הקונטיינר; אבל אז הכלים של ה-host נעלמים</td></tr>
<tr><td><code>-p</code></td><td>pid</td><td><code>ps</code> כמו שהקונטיינר רואה (ביחד עם <code>-m</code> בשביל ה-<code>/proc</code> שלו)</td></tr>
<tr><td><code>-u -i -U -C</code></td><td>uts, ‏ipc, ‏user, ‏cgroup</td><td>בדיקת hostname, ‏shared memory, ‏rootless containers</td></tr>
<tr><td><code>-a</code></td><td>הכל</td><td>"exec" מלא לתוך הקונטיינר</td></tr></table>
<p>מלכודת: עם <code>-n</code> בלבד, ‏<code>cat /etc/resolv.conf</code> קורא את הקובץ של <em>ה-host</em> (לא נכנסת ל-mount namespace). כדי לראות את של ה-Pod: ‏<code>cat /proc/$PID/root/etc/resolv.conf</code> — ‏<code>/proc/PID/root</code> הוא חלון ל-root filesystem של כל תהליך.</p>
<blockquote>💡 מהשטח: המקבילה של Kubernetes היא <code>kubectl debug -it pod/api --image=nicolaka/netshoot --target=api</code> — ‏ephemeral container שמצטרף ל-namespaces של ה-Pod (ועם <code>--target</code> גם ל-PID namespace של האפליקציה). תשתמש בזה כשאין לך SSH ל-node; תלך ל-nsenter כשיש, או כשה-kubelet עצמו הוא הבעיה.</blockquote>`
      }
    },
    {
      h: { en: "User namespaces, rootless containers — and what namespaces do NOT isolate", he: "User namespaces, ‏rootless containers — ומה namespaces לא מבודדים" },
      body: {
        en: `<p><strong>Rootless containers</strong> (Podman, rootless Docker, Kubernetes <code>hostUsers: false</code>) run the whole container in a user namespace. UID 0 inside maps to an unprivileged range on the host, taken from <code>/etc/subuid</code>:</p>
<pre>$ grep dev /etc/subuid
dev:100000:65536
$ podman run --rm alpine cat /proc/self/uid_map
         0       1000          1           # root in container = me (1000) on host
         1     100000      65536           # uid 1..65536 in container = 100000..165535 on host
$ podman run -d --name w alpine sleep 999; ps -o user,pid,cmd -C sleep
USER        PID CMD
dev      61204 sleep 999                  # "root" inside, plain user outside</pre>
<p>If a process escapes such a container, it lands on the host as UID 100000 — owning nothing. Root capabilities inside a user namespace (<code>CAP_NET_ADMIN</code>, <code>CAP_SYS_ADMIN</code>) apply only to resources <em>owned by</em> that namespace, not to the host. The flip side: unprivileged user namespaces expose much more kernel code to normal users, which is why some distros restrict them (<code>kernel.apparmor_restrict_unprivileged_userns=1</code> on Ubuntu 24.04).</p>
<p><strong>What namespaces do NOT isolate</strong>:</p>
<table><tr><th>Shared</th><th>Consequence</th></tr>
<tr><td><strong>The kernel</strong></td><td>One kernel, one set of syscalls. A kernel bug (Dirty Pipe CVE-2022-0847) or runtime bug (runc CVE-2019-5736, CVE-2024-21626 "Leaky Vessels") = container escape. Mitigate with seccomp, AppArmor/SELinux, gVisor, Kata/Firecracker microVMs</td></tr>
<tr><td><strong>Wall-clock time</strong></td><td><code>CLOCK_REALTIME</code> is global even with a time namespace (it only offsets monotonic/boottime). <code>date -s</code> in a privileged container changes the host's clock</td></tr>
<tr><td><strong>Most of /proc and /sys</strong></td><td><code>/proc/meminfo</code>, <code>/proc/cpuinfo</code>, <code>/proc/loadavg</code> show the <em>host</em>. A JVM or <code>nproc</code>-based worker count sees 64 CPUs in a 2-CPU container (LXCFS fakes these files)</td></tr>
<tr><td><strong>Non-net sysctls</strong></td><td><code>net.*</code> is per net namespace; <code>vm.swappiness</code>, <code>kernel.pid_max</code>, <code>fs.file-max</code> are host-wide. That's why k8s splits "safe" vs "unsafe" sysctls</td></tr>
<tr><td><strong>Devices, modules, keyring, dmesg</strong></td><td>Kernel modules are global; <code>/dev</code> nodes, kernel keyrings and the kernel log are only partly namespaced</td></tr>
<tr><td><strong>Resources</strong></td><td>Namespaces limit what you <em>see</em>, not what you <em>use</em> — CPU, memory, I/O and PIDs are cgroups' job</td></tr></table>
<blockquote>⚠️ Production tip: "containers aren't VMs" in one sentence — a VM has its own kernel behind a hypervisor (a small attack surface of virtual hardware); a container is a host process behind ~350 syscalls. For multi-tenant untrusted code (CI runners for strangers, customer plugins), add a sandbox: gVisor (<code>runtimeClassName: gvisor</code>), Kata Containers, or Firecracker.</blockquote>`,
        he: `<p><strong>Rootless containers</strong> (‏Podman, ‏rootless Docker, ‏<code>hostUsers: false</code> ב-Kubernetes) מריצים את כל הקונטיינר בתוך user namespace. ‏UID 0 בפנים ממופה לטווח לא מורשה על ה-host, שנלקח מ-<code>/etc/subuid</code>:</p>
<pre>$ grep dev /etc/subuid
dev:100000:65536
$ podman run --rm alpine cat /proc/self/uid_map
         0       1000          1           # root in container = me (1000) on host
         1     100000      65536           # uid 1..65536 in container = 100000..165535 on host
$ podman run -d --name w alpine sleep 999; ps -o user,pid,cmd -C sleep
USER        PID CMD
dev      61204 sleep 999                  # "root" inside, plain user outside</pre>
<p>אם תהליך בורח מקונטיינר כזה, הוא נוחת על ה-host בתור UID 100000 — שלא מחזיק בכלום. ‏Capabilities של root בתוך user namespace (‏<code>CAP_NET_ADMIN</code>, ‏<code>CAP_SYS_ADMIN</code>) חלות רק על משאבים <em>ששייכים</em> ל-namespace הזה, לא על ה-host. הצד השני: user namespaces לא מורשים חושפים הרבה יותר קוד kernel למשתמשים רגילים, ובגלל זה חלק מההפצות מגבילות אותם (‏<code>kernel.apparmor_restrict_unprivileged_userns=1</code> ב-Ubuntu 24.04).</p>
<p><strong>מה namespaces לא מבודדים</strong>:</p>
<table><tr><th>משותף</th><th>ההשלכה</th></tr>
<tr><td><strong>ה-kernel</strong></td><td>Kernel אחד, סט syscalls אחד. באג ב-kernel (‏Dirty Pipe ‏CVE-2022-0847) או ב-runtime (‏runc ‏CVE-2019-5736, ‏CVE-2024-21626 "Leaky Vessels") = בריחה מהקונטיינר. מצמצמים עם seccomp, ‏AppArmor/SELinux, ‏gVisor, ‏microVMs של Kata/Firecracker</td></tr>
<tr><td><strong>שעון הקיר</strong></td><td><code>CLOCK_REALTIME</code> גלובלי גם עם time namespace (הוא רק מזיז monotonic/boottime). ‏<code>date -s</code> בקונטיינר privileged משנה את השעון של ה-host</td></tr>
<tr><td><strong>רוב /proc ו-/sys</strong></td><td><code>/proc/meminfo</code>, ‏<code>/proc/cpuinfo</code>, ‏<code>/proc/loadavg</code> מראים את <em>ה-host</em>. ‏JVM או מספר workers לפי <code>nproc</code> רואים 64 CPUs בקונטיינר של 2 CPUs (‏LXCFS מזייף את הקבצים האלה)</td></tr>
<tr><td><strong>Sysctls שהם לא net</strong></td><td><code>net.*</code> הוא per net namespace; ‏<code>vm.swappiness</code>, ‏<code>kernel.pid_max</code>, ‏<code>fs.file-max</code> הם לכל ה-host. בגלל זה k8s מפריד בין sysctls "בטוחים" ל"לא בטוחים"</td></tr>
<tr><td><strong>Devices, ‏modules, ‏keyring, ‏dmesg</strong></td><td>Kernel modules גלובליים; צמתים ב-<code>/dev</code>, ‏kernel keyrings וה-kernel log מבודדים רק חלקית</td></tr>
<tr><td><strong>משאבים</strong></td><td>Namespaces מגבילים מה אתה <em>רואה</em>, לא במה אתה <em>משתמש</em> — ‏CPU, זיכרון, I/O ו-PIDs זה התפקיד של cgroups</td></tr></table>
<blockquote>⚠️ טיפ לפרודקשן: "קונטיינרים הם לא VMs" במשפט אחד — ל-VM יש kernel משלו מאחורי hypervisor (שטח תקיפה קטן של חומרה וירטואלית); קונטיינר הוא תהליך של ה-host מאחורי בערך 350 syscalls. לקוד לא אמין של כמה לקוחות (CI runners לזרים, plugins של לקוחות), תוסיף sandbox: ‏gVisor (‏<code>runtimeClassName: gvisor</code>), ‏Kata Containers, או Firecracker.</blockquote>`
      }
    }
  ],
  diagram: "host kernel (ONE)\n ├─ init ns: pid net mnt uts ipc user cgroup time\n ├─ container A: clone(NEWPID|NEWNET|NEWNS|NEWUTS|NEWIPC|NEWCGROUP) -> PID 1 inside = 48211 outside\n │     eth0 ══veth══ vethA ─┐\n ├─ container B:            ├── br0 (bridge) ── NAT ── eth0\n │     eth0 ══veth══ vethB ─┘\n └─ nsenter -t 48211 -n tcpdump   (host binary, container's network)",
  handsOn: [
    { cmd: "sudo unshare --pid --fork --mount-proc --uts bash -c 'hostname box1; hostname; ps aux'", what: { en: "A one-shot mini container: own hostname and a process tree where bash is PID 1.", he: "מיני קונטיינר חד-פעמי: ‏hostname משלו ועץ תהליכים שבו bash הוא PID 1." } },
    { cmd: "unshare --user --map-root-user bash -c 'id; cat /proc/self/uid_map; cat /etc/shadow'", what: { en: "Be root without sudo — and see that host files still treat you as yourself.", he: "להיות root בלי sudo — ולראות שקבצים של ה-host עדיין מתייחסים אליך כאל עצמך." } },
    { cmd: "sudo ip netns add red && sudo ip netns exec red ip a && sudo ip netns del red", what: { en: "A fresh network namespace contains only a DOWN loopback interface.", he: "Network namespace חדש מכיל רק loopback במצב DOWN." } },
    { cmd: "PID=$(docker inspect -f '{{.State.Pid}}' web) && sudo nsenter -t $PID -n ss -tlnp", what: { en: "See which ports a container really listens on, using the host's ss — works even on distroless images.", he: "לראות על אילו פורטים קונטיינר באמת מאזין, עם ה-ss של ה-host — עובד גם על images של distroless." } },
    { cmd: "sudo lsns -t net", what: { en: "List every network namespace on the node with its first process (one per Pod on a k8s node).", he: "להציג כל network namespace על ה-node עם התהליך הראשון שלו (אחד לכל Pod על node של k8s)." } }
  ],
  mnemonic: {
    en: "\"My Pet Nerd Uses Its User Cgroup Time\" — mnt, pid, net, uts, ipc, user, cgroup, time. Namespaces = what you SEE, cgroups = what you USE, the kernel = what you SHARE.",
    he: "Namespaces = מה שאתה רואה, ‏cgroups = במה שאתה משתמש, ה-kernel = מה שכולם חולקים. שמונה: mnt, ‏pid, ‏net, ‏uts, ‏ipc, ‏user, ‏cgroup, ‏time."
  },
  pitfalls: [
    { en: "unshare --pid without --fork: the shell's first child becomes PID 1, exits, and every later command fails with 'fork: Cannot allocate memory'. Without --mount-proc, ps still shows host processes.", he: "unshare --pid בלי --fork: הילד הראשון של ה-shell הופך ל-PID 1, יוצא, וכל פקודה אחר כך נכשלת עם 'fork: Cannot allocate memory'. בלי --mount-proc, ‏ps עדיין מראה את התהליכים של ה-host." },
    { en: "nsenter -n then reading /etc/resolv.conf or /etc/hosts: you get the host's files, because you didn't enter the mount namespace. Read /proc/PID/root/etc/resolv.conf instead.", he: "nsenter -n ואז לקרוא את /etc/resolv.conf או /etc/hosts: תקבל את הקבצים של ה-host, כי לא נכנסת ל-mount namespace. תקרא את /proc/PID/root/etc/resolv.conf במקום." },
    { en: "Assuming the app inside sees its limits: /proc/cpuinfo and /proc/meminfo are not namespaced, so thread pools sized from them oversubscribe the cgroup and get throttled.", he: "להניח שהאפליקציה בפנים רואה את ה-limits שלה: ‏/proc/cpuinfo ו-/proc/meminfo לא מבודדים, אז thread pools שמחושבים לפיהם חורגים מה-cgroup ונחנקים ב-throttling." },
    { en: "Treating namespaces as a security boundary for hostile code. They share one kernel; a kernel or runc CVE is a full escape. Use gVisor/Kata/microVMs for untrusted multi-tenant workloads.", he: "להתייחס ל-namespaces כגבול אבטחה לקוד עוין. כולם חולקים kernel אחד; ‏CVE ב-kernel או ב-runc זו בריחה מלאה. לעומסים לא אמינים של כמה לקוחות תשתמש ב-gVisor, ‏Kata או microVMs." }
  ],
  interview: [
    { q: { en: "How would you check what port a process in a distroless Pod is listening on, if the image has no shell?", he: "איך תבדוק על איזה פורט מאזין תהליך ב-Pod של distroless, אם אין ב-image אפילו shell?" },
      a: { en: "On the node: crictl ps to get the container ID, crictl inspect to get its host PID, then nsenter -t PID -n ss -tlnp — this enters only the net namespace and runs the host's ss. Without node access: kubectl debug with an ephemeral netshoot container sharing the Pod's namespaces.", he: "על ה-node: ‏crictl ps כדי לקבל container ID, ‏crictl inspect כדי לקבל את ה-PID על ה-host, ואז nsenter -t PID -n ss -tlnp — נכנסים רק ל-net namespace ומריצים את ה-ss של ה-host. בלי גישה ל-node: ‏kubectl debug עם ephemeral container של netshoot שחולק את ה-namespaces של ה-Pod." } },
    { q: { en: "Why do all containers in a Pod reach each other on localhost, and what is the pause container for?", he: "למה כל הקונטיינרים ב-Pod מגיעים אחד לשני ב-localhost, ובשביל מה קונטיינר ה-pause?" },
      a: { en: "They share one network namespace (and IPC/UTS). The pause container is created first, holds those namespaces open by just sleeping, and app containers join them. If an app container crashes and restarts, the namespace — and the Pod IP — survive.", he: "הם חולקים network namespace אחד (וגם IPC/UTS). קונטיינר ה-pause נוצר ראשון, מחזיק את ה-namespaces פתוחים בזה שהוא פשוט ישן, וקונטיינרי האפליקציה מצטרפים אליהם. אם קונטיינר אפליקציה קורס ועולה מחדש, ה-namespace — וה-IP של ה-Pod — שורדים." } },
    { q: { en: "What does a user namespace buy you, and what's the risk?", he: "מה user namespace נותן לך, ומה הסיכון?" },
      a: { en: "UID 0 inside maps to an unprivileged UID range outside (from /etc/subuid), and capabilities apply only to namespace-owned resources — an escape lands as a nobody. The risk: unprivileged users can now reach kernel code paths (mount, netfilter) that used to need real root, so user-namespace-based kernel exploits are a real class; some distros restrict unprivileged userns.", he: "UID 0 בפנים ממופה לטווח UIDs לא מורשה בחוץ (מ-/etc/subuid), ו-capabilities חלות רק על משאבים של ה-namespace — בריחה נוחתת בתור nobody. הסיכון: משתמשים לא מורשים מגיעים עכשיו לנתיבי קוד ב-kernel (‏mount, ‏netfilter) שפעם דרשו root אמיתי, אז exploits ל-kernel דרך user namespaces הם קטגוריה אמיתית; חלק מההפצות מגבילות userns לא מורשים." } }
  ],
  quiz: [
    { q: { en: "Inside 'sudo unshare --pid --fork bash' (no --mount-proc), ps aux shows hundreds of processes. Why?", he: "בתוך 'sudo unshare --pid --fork bash' (בלי --mount-proc), ‏ps aux מראה מאות תהליכים. למה?" },
      options: [
        { en: "The PID namespace failed to create", he: "יצירת ה-PID namespace נכשלה" },
        { en: "ps reads /proc, which is still the host's procfs mount", he: "ps קורא את /proc, שהוא עדיין ה-procfs של ה-host" },
        { en: "--fork shares the parent's PIDs", he: "--fork חולק את ה-PIDs של ההורה" },
        { en: "PID namespaces only hide processes from non-root users", he: "PID namespaces מסתירים תהליכים רק ממשתמשים שאינם root" }
      ], answer: 1,
      explain: { en: "The PID namespace works (echo $$ prints 1), but ps reads /proc. You need a new mount namespace with a fresh procfs — that's --mount-proc.", he: "ה-PID namespace עובד (‏echo $$ מדפיס 1), אבל ps קורא את /proc. צריך mount namespace חדש עם procfs חדש — זה בדיוק --mount-proc." } },
    { q: { en: "Which command lets you run the host's tcpdump against a container's network only?", he: "איזו פקודה מאפשרת להריץ את ה-tcpdump של ה-host רק על הרשת של קונטיינר?" },
      options: [
        { en: "docker exec web tcpdump -i eth0", he: "docker exec web tcpdump -i eth0" },
        { en: "nsenter -t PID -a tcpdump -i eth0", he: "nsenter -t PID -a tcpdump -i eth0" },
        { en: "nsenter -t PID -n tcpdump -i eth0", he: "nsenter -t PID -n tcpdump -i eth0" },
        { en: "ip netns exec PID tcpdump", he: "ip netns exec PID tcpdump" }
      ], answer: 2,
      explain: { en: "-n enters only the net namespace, keeping the host's mount namespace so /usr/sbin/tcpdump exists. -a and docker exec use the container's filesystem, which often has no tcpdump; ip netns exec takes a name from /run/netns, not a PID.", he: "-n נכנס רק ל-net namespace ומשאיר את ה-mount namespace של ה-host, אז /usr/sbin/tcpdump קיים. ‏-a ו-docker exec משתמשים ב-filesystem של הקונטיינר, שלרוב אין בו tcpdump; ‏ip netns exec מקבל שם מ-/run/netns, לא PID." } },
    { q: { en: "Two network namespaces are connected with veth pairs to a bridge, IPs are set, but ping fails on a host that runs Docker. Most likely cause?", he: "שני network namespaces מחוברים בזוגות veth ל-bridge, ה-IPs מוגדרים, אבל ping נכשל על host שמריץ Docker. מה הסיבה הסבירה?" },
      options: [
        { en: "veth pairs can't carry ICMP", he: "זוגות veth לא מעבירים ICMP" },
        { en: "Docker set the iptables FORWARD policy to DROP and br_netfilter sends bridged traffic through it", he: "Docker שינה את ה-policy של FORWARD ב-iptables ל-DROP, ו-br_netfilter מעביר דרכו גם תעבורת bridge" },
        { en: "Bridges need a default route", he: "Bridge צריך default route" },
        { en: "The namespaces must share a PID namespace", he: "ה-namespaces חייבים לחלוק PID namespace" }
      ], answer: 1,
      explain: { en: "Classic: Docker's FORWARD DROP + br_netfilter. Add 'iptables -I FORWARD -i br0 -o br0 -j ACCEPT'. Also check both veth ends and lo are up.", he: "קלאסי: ‏FORWARD DROP של Docker ועוד br_netfilter. תוסיף 'iptables -I FORWARD -i br0 -o br0 -j ACCEPT'. ותבדוק גם ששני קצוות ה-veth וה-lo ב-up." } },
    { q: { en: "Which is NOT isolated by Linux namespaces?", he: "מה לא מבודד על ידי namespaces של Linux?" },
      options: [
        { en: "Hostname", he: "Hostname" },
        { en: "Routing table and iptables rules", he: "טבלת ניתוב וחוקי iptables" },
        { en: "The kernel itself and the wall-clock time", he: "ה-kernel עצמו ושעון הקיר" },
        { en: "UID mapping", he: "מיפוי UIDs" }
      ], answer: 2,
      explain: { en: "uts isolates hostname, net isolates routes/iptables, user isolates UIDs. All containers share one kernel, and the time namespace offsets only monotonic/boottime clocks, never CLOCK_REALTIME.", he: "uts מבודד hostname, ‏net מבודד routes ו-iptables, ‏user מבודד UIDs. כל הקונטיינרים חולקים kernel אחד, וה-time namespace מזיז רק את שעוני monotonic ו-boottime, אף פעם לא את CLOCK_REALTIME." } }
  ],
  playground: "terminal",
  related: ["container-internals", "linux-cgroups-v2", "container-security", "k8s-networking-cni", "k8s-debugging", "container-runtimes-oci"]
});

// ───────────────────────────── Glossary ─────────────────────────────
INFRA.glossary.push(
  { term: "Catastrophic backtracking", track: "linux", lesson: "regex-for-engineers",
    def: { en: "When a backtracking regex engine tries exponentially (or polynomially) many ways to match a failing input because of nested or overlapping quantifiers like (a+)+ — the cause of ReDoS.", he: "כשמנוע regex מסוג backtracking מנסה מספר אקספוננציאלי (או פולינומי) של דרכים להתאים קלט שנכשל, בגלל quantifiers מקוננים או חופפים כמו (a+)+ — הסיבה ל-ReDoS." } },
  { term: "RE2", track: "linux", lesson: "regex-for-engineers",
    def: { en: "Google's linear-time regex engine used by Go, Prometheus, Loki and Envoy: guaranteed O(pattern × input), at the cost of no backreferences and no lookarounds.", he: "מנוע ה-regex בזמן לינארי של Google שמשמש את Go, ‏Prometheus, ‏Loki ו-Envoy: זמן מובטח של O(pattern × input), במחיר של אין backreferences ואין lookarounds." } },
  { term: "Lookaround", track: "linux", lesson: "regex-for-engineers",
    def: { en: "Zero-width regex assertion that checks what comes after (lookahead) or before (lookbehind) without consuming it. Supported in PCRE, Python, JS; not in POSIX or RE2.", he: "Assertion ברוחב אפס ב-regex שבודק מה בא אחרי (lookahead) או לפני (lookbehind) בלי לצרוך את זה. נתמך ב-PCRE, ‏Python, ‏JS; לא ב-POSIX ולא ב-RE2." } },
  { term: "veth pair", track: "linux", lesson: "linux-namespaces-hands-on",
    def: { en: "A pair of virtual Ethernet interfaces acting as a cable: packets sent into one end come out the other. Used to connect a container's network namespace to a host bridge.", he: "זוג interfaces וירטואליים של Ethernet שמתנהגים כמו כבל: חבילה שנשלחת לקצה אחד יוצאת בשני. משמש לחבר את ה-network namespace של קונטיינר ל-bridge על ה-host." } },
  { term: "nsenter", track: "linux", lesson: "linux-namespaces-hands-on",
    def: { en: "util-linux tool that runs a command inside the namespaces of an existing process (nsenter -t PID -n ...), letting you debug a container with host tools.", he: "כלי של util-linux שמריץ פקודה בתוך ה-namespaces של תהליך קיים (‏nsenter -t PID -n ...), כדי לדבג קונטיינר עם הכלים של ה-host." } },
  { term: "User namespace", track: "linux", lesson: "linux-namespaces-hands-on",
    def: { en: "Namespace that maps UIDs/GIDs: UID 0 inside can be an unprivileged UID on the host. The basis of rootless containers.", he: "Namespace שממפה UIDs/GIDs: ‏UID 0 בפנים יכול להיות UID לא מורשה על ה-host. הבסיס של rootless containers." } }
);

// ───────────────────────────── Scenario ─────────────────────────────
INFRA.scenarios.push({
  id: "regex-redos-cpu",
  icon: "🌀",
  title: { en: "One regex pegs every CPU", he: "Regex אחד תוקע את כל ה-CPUs" },
  start: "s1",
  steps: {
    s1: {
      text: { en: "14:07. PagerDuty: profile-api p99 latency 12s, error rate 38%, HPA scaled from 6 to 20 Pods and it's still getting worse. Every Pod shows ~1000m CPU (its limit). Traffic is normal. The last deploy, 40 minutes ago, was 'tighten display-name validation'. What first?", he: "14:07. ‏PagerDuty: ה-p99 של profile-api עומד על 12 שניות, ‏error rate של 38%, ה-HPA עלה מ-6 ל-20 Pods וזה עדיין מחמיר. כל Pod מראה בערך 1000m CPU (ה-limit שלו). התעבורה רגילה. ה-deploy האחרון, לפני 40 דקות, היה 'הקשחת ולידציה לשם תצוגה'. מה קודם?" },
      data: "$ kubectl top pods -l app=profile-api | head -4\nNAME                           CPU(cores)   MEMORY(bytes)\nprofile-api-7d9f8c6b5-2xkqp    999m         212Mi\nprofile-api-7d9f8c6b5-8mz4t    1000m        208Mi\nprofile-api-7d9f8c6b5-c7wln    998m         215Mi\n\nrate(http_requests_total[5m])            1.21k req/s   (yesterday same time: 1.18k)\nrate(container_cpu_cfs_throttled_periods_total[5m]) / rate(container_cpu_cfs_periods_total[5m])   0.97",
      choices: [
        { label: { en: "Compare CPU per request before/after the deploy and grab a profile from one hot Pod", he: "להשוות CPU לבקשה לפני ואחרי ה-deploy ולקחת profile מ-Pod חם אחד" }, next: "s2", score: 10,
          feedback: { en: "Right: same traffic, 20x CPU per request, right after a deploy — that's a code path, not load. Get evidence fast.", he: "נכון: אותה תעבורה, פי 20 CPU לבקשה, מיד אחרי deploy — זה code path, לא עומס. תשיג ראיות מהר." } },
        { label: { en: "Raise the CPU limit to 4 cores and maxReplicas to 60", he: "להעלות את ה-CPU limit ל-4 cores ואת maxReplicas ל-60" }, next: "s1b", score: -5,
          feedback: { en: "Throwing hardware at it. If one request can burn seconds of CPU, more cores just means more requests burning.", he: "לזרוק חומרה על הבעיה. אם בקשה אחת שורפת שניות של CPU, עוד cores זה רק עוד בקשות ששורפות." } },
        { label: { en: "Roll back the deploy right now", he: "לעשות rollback ל-deploy עכשיו" }, next: "s4", score: 8,
          feedback: { en: "Strong instinct — a change 40 minutes before the incident is the prime suspect, and rollback is cheap. You'll still need to find the cause.", he: "אינסטינקט טוב — שינוי 40 דקות לפני התקלה הוא החשוד הראשי, ו-rollback זול. עדיין תצטרך למצוא את הסיבה." } }
      ]
    },
    s1b: {
      text: { en: "14:19. 60 Pods × 4 cores. The node pool autoscaler added 9 nodes. p99 is now 15s and CPU is pinned on every Pod again. Finance pings about the cost spike. The CPU just follows the bad requests.", he: "14:19. ‏60 Pods כפול 4 cores. ה-autoscaler של ה-node pool הוסיף 9 nodes. ה-p99 עכשיו 15 שניות וה-CPU שוב תקוע בכל Pod. מ-Finance שואלים על קפיצת העלות. ה-CPU פשוט הולך אחרי הבקשות הרעות." },
      choices: [
        { label: { en: "Stop scaling, profile a hot Pod", he: "להפסיק לעשות scale, לעשות profile ל-Pod חם" }, next: "s2", score: 5, feedback: { en: "Better late than never.", he: "עדיף מאוחר מאשר אף פעם." } },
        { label: { en: "Keep scaling, it must be a traffic spike from a bot", he: "להמשיך לעשות scale, זה בטח spike של בוט" }, next: "lose", score: -10, feedback: { en: "Traffic graph says 1.2k req/s, same as yesterday. You're ignoring the data.", he: "גרף התעבורה אומר 1.2k req/s, כמו אתמול. אתה מתעלם מהדאטה." } }
      ]
    },
    s2: {
      text: { en: "You run py-spy on one Pod and pull the deploy diff. Where's the time going?", he: "הרצת py-spy על Pod אחד ומשכת את ה-diff של ה-deploy. לאן הזמן הולך?" },
      data: "$ kubectl debug -it profile-api-7d9f8c6b5-2xkqp --image=python:3.12 --target=api -- \\\n    sh -c 'pip -q install py-spy && py-spy dump --pid 1'\nThread 0x7F3A (active): \"worker-3\"\n    _match (re/__init__.py)\n    validate_display_name (profile/validators.py:41)\n    update_profile (profile/views.py:118)\nThread 0x7F3B (active): \"worker-4\"\n    _match (re/__init__.py)\n    validate_display_name (profile/validators.py:41)\n\n$ git show HEAD -- profile/validators.py\n-NAME_RE = re.compile(r\"^[\\w .'-]{1,64}$\")\n+NAME_RE = re.compile(r\"^(\\w+\\s?)*$\")      # words separated by single spaces",
      choices: [
        { label: { en: "That's catastrophic backtracking: (\\w+\\s?)* nested quantifier, no length cap", he: "זה catastrophic backtracking: ‏quantifier מקונן (\\w+\\s?)*, בלי הגבלת אורך" }, next: "s3", score: 10,
          feedback: { en: "Exactly. \\w+ inside a starred group with an optional space = exponential ways to split 'aaaa…' when the string ends in a non-word char.", he: "בדיוק. ‏\\w+ בתוך group עם כוכבית ורווח אופציונלי = מספר אקספוננציאלי של דרכים לחלק 'aaaa…' כשהמחרוזת נגמרת בתו שאינו תו מילה." } },
        { label: { en: "Python's re is slow; the GIL is the problem", he: "ה-re של Python איטי; ה-GIL הוא הבעיה" }, next: "s2b", score: -3,
          feedback: { en: "The old regex ran in microseconds on the same Python. Something about this pattern is different.", he: "ה-regex הישן רץ במיקרו-שניות על אותו Python. משהו בתבנית הזאת שונה." } }
      ]
    },
    s2b: {
      text: { en: "A teammate pastes a benchmark of the old vs new regex on a 27-character name 'aaaaaaaaaaaaaaaaaaaaaaaaaa!'. Old: 2µs. New: 6.5 seconds. Same interpreter.", he: "חבר צוות מדביק benchmark של ה-regex הישן מול החדש על שם של 27 תווים 'aaaaaaaaaaaaaaaaaaaaaaaaaa!'. הישן: ‏2µs. החדש: 6.5 שניות. אותו interpreter." },
      choices: [ { label: { en: "OK — it's the pattern. Look at the access logs for that kind of input", he: "אוקיי — זו התבנית. בוא נחפש קלט כזה ב-access logs" }, next: "s3", score: 3, feedback: { en: "Back on track.", he: "חזרת למסלול." } } ]
    },
    s3: {
      text: { en: "Logs show a handful of clients sending long display names ending in an emoji or '!' — some a bot, some real users with names like 'JoséMaríaGarcíaRodríguezFernández🙂'. Each such request pins a worker until the 30s gunicorn timeout kills it. ~20 of them per second are enough to saturate the fleet. What now?", he: "הלוגים מראים כמה clients ששולחים שמות תצוגה ארוכים שנגמרים באימוג'י או '!' — חלקם בוט, חלקם משתמשים אמיתיים עם שמות כמו 'JoséMaríaGarcíaRodríguezFernández🙂'. כל בקשה כזו תוקעת worker עד שה-timeout של gunicorn ‏(30 שניות) הורג אותו. בערך 20 כאלה בשנייה מספיקות כדי להרוויה את כל ה-fleet. מה עכשיו?" },
      data: "$ kubectl logs -l app=profile-api --since=10m | grep -oP 'display_name_len=\\K[0-9]+' | sort -n | uniq -c | tail -3\n    212 31\n    187 34\n     96 41\n$ python3 -c \"import re,time; r=re.compile(r'^(\\w+\\s?)*$'); t=time.time(); r.match('a'*24+'!'); print(round(time.time()-t,2))\"\n1.63      # every +2 chars ~= 4x: 30 chars ~= 100 s",
      choices: [
        { label: { en: "Roll back now to stop the bleeding, then fix the regex properly", he: "rollback עכשיו כדי לעצור את הדימום, ואז לתקן את ה-regex כמו שצריך" }, next: "s4", score: 10,
          feedback: { en: "Mitigate first, fix second. Rollback restores the known-good linear pattern in minutes.", he: "קודם mitigation, אחר כך תיקון. ה-rollback מחזיר את התבנית הלינארית שידוע שעובדת תוך דקות." } },
        { label: { en: "Hotfix in prod: wrap the regex in a try/except", he: "Hotfix בפרודקשן: לעטוף את ה-regex ב-try/except" }, next: "lose", score: -10,
          feedback: { en: "Python's re doesn't raise or time out — it just keeps backtracking. try/except catches nothing, and you shipped an untested hotfix mid-incident.", he: "ה-re של Python לא זורק exception ולא עושה timeout — הוא פשוט ממשיך לעשות backtracking. ‏try/except לא תופס כלום, והעלית hotfix לא בדוק באמצע תקלה." } },
        { label: { en: "Block the bot's IPs at the WAF and keep the new regex", he: "לחסום את ה-IPs של הבוט ב-WAF ולהשאיר את ה-regex החדש" }, next: "s3b", score: -3,
          feedback: { en: "Real users with long names hit it too, and any attacker can find this in minutes. The bug is in your code.", he: "גם משתמשים אמיתיים עם שמות ארוכים נתקעים בזה, וכל תוקף ימצא את זה תוך דקות. הבאג בקוד שלך." } }
      ]
    },
    s3b: {
      text: { en: "CPU drops to 70%, then climbs back as legitimate users retry their profile saves. Support gets tickets: 'can't save my name'.", he: "ה-CPU יורד ל-70%, ואז חוזר לטפס כשמשתמשים אמיתיים מנסים שוב לשמור פרופיל. ל-Support מגיעים tickets: 'אני לא מצליח לשמור את השם שלי'." },
      choices: [ { label: { en: "Roll back the deploy", he: "rollback ל-deploy" }, next: "s4", score: 3, feedback: { en: "The right move, a bit later than ideal.", he: "המהלך הנכון, קצת מאוחר מהאידיאלי." } } ]
    },
    s4: {
      text: { en: "14:31. kubectl rollout undo deployment/profile-api. Within 3 minutes CPU per Pod is back to ~60m, p99 to 85ms, HPA scales back down. Now the permanent fix — product still wants 'words separated by single spaces'. Which do you ship?", he: "14:31. ‏kubectl rollout undo deployment/profile-api. תוך 3 דקות ה-CPU לכל Pod חוזר לבערך 60m, ה-p99 ל-85ms, וה-HPA יורד בחזרה. עכשיו התיקון הקבוע — ה-product עדיין רוצה 'מילים שמופרדות ברווח יחיד'. מה אתה מעלה?" },
      data: "$ kubectl rollout undo deployment/profile-api\ndeployment.apps/profile-api rolled back\n$ kubectl rollout status deployment/profile-api\ndeployment \"profile-api\" successfully rolled out",
      choices: [
        { label: { en: "Length check first (max 64), then the unambiguous ^\\w+(?:\\s\\w+)*$ (or google-re2), plus a CI test with adversarial input and a time budget", he: "קודם בדיקת אורך (מקסימום 64), ואז התבנית החד-משמעית ^\\w+(?:\\s\\w+)*$ (או google-re2), ועוד בדיקת CI עם קלט עוין ותקציב זמן" }, next: "win", score: 10,
          feedback: { en: "Defense in depth: bounded input, a pattern with exactly one way to match, and a guard so the next 'small regex tweak' can't do this again.", he: "Defense in depth: קלט מוגבל, תבנית עם דרך אחת בלבד להתאים, ומנגנון שמונע מ'שינוי regex קטן' הבא לעשות את זה שוב." } },
        { label: { en: "Make it lazy: ^(\\w+?\\s?)*?$", he: "להפוך ל-lazy: ‏^(\\w+?\\s?)*?$" }, next: "lose", score: -10,
          feedback: { en: "Lazy changes the ORDER paths are tried, not how many exist. On a non-matching input it still explores all of them.", he: "Lazy משנה את הסדר שבו מסלולים נבדקים, לא כמה מסלולים יש. על קלט שלא תואם הוא עדיין עובר על כולם." } }
      ]
    },
    win: {
      text: { en: "Fixed in 24 minutes of user impact. The new validator handles a 100,000-char input in under 1ms, the CI job fails any regex that takes over 50ms on 'a'*50+'!', and the post-mortem adds: regex changes on request paths go through a canary at 5% first. You also add semgrep's ReDoS rule to the pipeline.", he: "תוקן אחרי 24 דקות של פגיעה במשתמשים. ה-validator החדש מטפל בקלט של 100,000 תווים בפחות ממילישנייה, ה-job ב-CI מכשיל כל regex שלוקח יותר מ-50ms על 'a'*50+'!', וה-post-mortem מוסיף: שינויי regex בנתיבי request עוברים קודם canary של 5%. הוספת גם את חוק ה-ReDoS של semgrep ל-pipeline." },
      end: "win"
    },
    lose: {
      text: { en: "The fleet stays pinned for over an hour and the cloud bill spikes. The fix was always the same: roll back the change that introduced the nested quantifier, then replace it with a bounded, unambiguous pattern or a linear-time engine. Read 'Regex for Engineers' — the ReDoS section — and try again.", he: "ה-fleet נשאר תקוע יותר משעה וחשבון הענן קופץ. התיקון תמיד היה אותו דבר: rollback לשינוי שהכניס את ה-quantifier המקונן, ואז להחליף אותו בתבנית מוגבלת וחד-משמעית או במנוע בזמן לינארי. תקרא את 'Regex למהנדסי תשתיות' — החלק על ReDoS — ותנסה שוב." },
      end: "lose"
    }
  },
  lessons: ["regex-for-engineers", "pr-input-validation", "k8s-autoscaling"]
});
