window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

INFRA.lessons.push({
  id: "pr-input-validation",
  track: "principal",
  order: 110,
  icon: "🛂",
  level: 3,
  minutes: 17,
  title: { en: "Input Validation at Every Boundary: Parse, Don't Validate", he: "ולידציה בכל גבול: Parse, Don't Validate" },
  tldr: {
    en: "Treat every byte that crosses a boundary as hostile: canonicalize it, parse it into a typed value with limits, enforce business rules in the domain and constraints in the DB, and answer with precise, safe errors.",
    he: "כל byte שחוצה גבול הוא עוין עד שהוכח אחרת: עושים לו canonicalization, הופכים אותו (parse) לערך typed עם גבולות, אוכפים חוקים עסקיים ב-domain ו-constraints ב-DB, ומחזירים שגיאות מדויקות ובטוחות."
  },
  analogy: {
    en: "Airport security has layers: the airline checks your ticket at the gate (syntax), passport control checks you're allowed in the country (business rule), and the plane itself has a weight limit no matter what the agents said (DB constraint). Nobody says 'the gate already checked, so passport control can skip it'. 'Parse, don't validate' is the boarding pass: once the gate scans you, you get a pass that proves it — later checkpoints trust the pass instead of re-reading your crumpled printout.",
    he: "בשדה תעופה יש שכבות אבטחה: חברת התעופה בודקת כרטיס בשער (syntax), ביקורת הגבולות בודקת שמותר לך להיכנס למדינה (חוק עסקי), ולמטוס עצמו יש מגבלת משקל לא משנה מה אמרו הפקידים (constraint ב-DB). אף אחד לא אומר 'השער כבר בדק, אז ביקורת הגבולות יכולה לוותר'. 'Parse, don't validate' זה כרטיס העלייה למטוס: ברגע שסרקו אותך בשער אתה מקבל כרטיס שמוכיח את זה — התחנות הבאות סומכות על הכרטיס במקום לקרוא שוב את הדף המקומט שהדפסת."
  },
  sections: [
    {
      h: { en: "Where to validate: defense in depth", he: "איפה עושים ולידציה: defense in depth" },
      body: {
        en: `<p>Validation is not one <code>if</code> in the controller. Each layer validates what it is <em>responsible</em> for, and each layer assumes the one before it might be bypassed (a new internal caller, a batch job, a bug).</p>
<table>
<tr><th>Layer</th><th>What it checks</th><th>Example</th></tr>
<tr><td>Edge / WAF / gateway</td><td>Size, rate, auth present, content-type, obvious junk</td><td>Body &gt; 1 MB → 413, no token → 401</td></tr>
<tr><td>API / transport</td><td>Schema: types, required fields, formats, ranges, enums</td><td><code>quantity</code> is int 1..100</td></tr>
<tr><td>Domain / service</td><td>Business rules that need state</td><td>Coupon not expired, user owns the cart</td></tr>
<tr><td>Database</td><td>Invariants that must hold forever</td><td><code>CHECK (qty &gt; 0)</code>, <code>UNIQUE(email)</code>, FK</td></tr>
<tr><td>Output</td><td>Encode for the sink</td><td>HTML-escape, parameterized SQL, shell args array</td></tr>
</table>
<p>Two kinds of rules: <strong>syntactic</strong> (is it a well-formed email, an ISO date, ≤ 200 chars?) — cheap, stateless, do it at the edge of your service. <strong>Semantic / business</strong> (does this order ID belong to this tenant, is the end date after the start date, is there stock?) — needs context, lives in the domain layer.</p>
<blockquote>⚠️ Production tip: client-side validation (JS in the browser, the mobile app) is a UX feature, not a security control. Anyone can <code>curl</code> your API directly. Always re-validate on the server.</blockquote>`,
        he: `<p>ולידציה זה לא <code>if</code> אחד ב-controller. כל שכבה בודקת את מה שהיא <em>אחראית</em> עליו, וכל שכבה מניחה שאפשר לעקוף את זו שלפניה (caller פנימי חדש, batch job, באג).</p>
<table>
<tr><th>שכבה</th><th>מה היא בודקת</th><th>דוגמה</th></tr>
<tr><td>Edge / WAF / gateway</td><td>גודל, rate, שיש auth, content-type, זבל ברור</td><td>Body &gt; 1 MB → 413, אין token → 401</td></tr>
<tr><td>API / transport</td><td>Schema: טיפוסים, שדות חובה, פורמטים, טווחים, enums</td><td><code>quantity</code> הוא int בין 1 ל-100</td></tr>
<tr><td>Domain / service</td><td>חוקים עסקיים שצריכים state</td><td>הקופון לא פג, המשתמש הוא הבעלים של העגלה</td></tr>
<tr><td>Database</td><td>Invariants שחייבים להתקיים לנצח</td><td><code>CHECK (qty &gt; 0)</code>, <code>UNIQUE(email)</code>, FK</td></tr>
<tr><td>Output</td><td>Encoding לפי היעד</td><td>HTML-escape, SQL עם פרמטרים, args של shell כמערך</td></tr>
</table>
<p>יש שני סוגי חוקים: <strong>תחביריים</strong> (זה email תקין? תאריך ISO? עד 200 תווים?) — זולים, בלי state, עושים אותם בכניסה לשירות. <strong>סמנטיים / עסקיים</strong> (ה-order ID הזה שייך ל-tenant הזה? תאריך הסיום אחרי תאריך ההתחלה? יש מלאי?) — צריכים הקשר, חיים בשכבת ה-domain.</p>
<blockquote>⚠️ טיפ לפרודקשן: ולידציה בצד הלקוח (JS בדפדפן, האפליקציה) היא פיצ'ר UX, לא בקרת אבטחה. כל אחד יכול לעשות <code>curl</code> ישר ל-API. תמיד בודקים שוב בשרת.</blockquote>`
      }
    },
    {
      h: { en: "Parse, don't validate — schemas in 4 languages", he: "Parse, don't validate — schemas ב-4 שפות" },
      body: {
        en: `<p>A <em>validator</em> returns true/false and leaves you holding the same untyped dict — the next function must trust (or re-check) it. A <em>parser</em> turns untrusted input into a <strong>typed value that can only exist if it's valid</strong>. After the boundary, your code handles <code>Order</code>, never <code>dict</code>.</p>
<pre># Python — Pydantic v2
from pydantic import BaseModel, Field, EmailStr
from typing import Literal

class OrderIn(BaseModel):
    model_config = {"extra": "forbid"}   # unknown field -&gt; 422
    email: EmailStr
    sku: str = Field(pattern=r"^[A-Z0-9-]{3,20}$")
    qty: int = Field(ge=1, le=100)
    currency: Literal["USD", "EUR", "ILS"]

order = OrderIn.model_validate(request_json)  # raises on bad input</pre>
<pre>// TypeScript — Zod
import { z } from "zod";
const OrderIn = z.object({
  email: z.string().email().max(254),
  sku: z.string().regex(/^[A-Z0-9-]{3,20}$/),
  qty: z.number().int().min(1).max(100),
  currency: z.enum(["USD", "EUR", "ILS"]),
}).strict();
type OrderIn = z.infer&lt;typeof OrderIn&gt;;
const r = OrderIn.safeParse(body);
if (!r.success) return problem(422, r.error.issues);</pre>
<pre>// Java — Bean Validation (Jakarta)
public record OrderIn(
  @NotNull @Email @Size(max = 254) String email,
  @Pattern(regexp = "^[A-Z0-9-]{3,20}$") String sku,
  @Min(1) @Max(100) int qty) {}
// controller: createOrder(@Valid @RequestBody OrderIn in)</pre>
<pre>{ "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object", "additionalProperties": false,
  "required": ["email", "sku", "qty"],
  "properties": {
    "email": { "type": "string", "format": "email",
               "maxLength": 254 },
    "qty": { "type": "integer", "minimum": 1,
             "maximum": 100 } } }</pre>
<blockquote>💡 Real world: <code>extra: forbid</code> / <code>.strict()</code> / <code>additionalProperties: false</code> blocks <strong>mass assignment</strong> — the classic bug where a client sends <code>"role": "admin"</code> or <code>"price": 0</code> and the ORM happily binds it (GitHub's 2012 Rails incident).</blockquote>`,
        he: `<p><em>Validator</em> מחזיר true/false ומשאיר אותך עם אותו dict בלי טיפוסים — הפונקציה הבאה צריכה לסמוך עליו (או לבדוק שוב). <em>Parser</em> הופך קלט לא-אמין ל<strong>ערך typed שיכול להתקיים רק אם הוא תקין</strong>. אחרי הגבול, הקוד שלך מטפל ב-<code>Order</code>, אף פעם לא ב-<code>dict</code>.</p>
<pre># Python — Pydantic v2
from pydantic import BaseModel, Field, EmailStr
from typing import Literal

class OrderIn(BaseModel):
    model_config = {"extra": "forbid"}   # unknown field -&gt; 422
    email: EmailStr
    sku: str = Field(pattern=r"^[A-Z0-9-]{3,20}$")
    qty: int = Field(ge=1, le=100)
    currency: Literal["USD", "EUR", "ILS"]

order = OrderIn.model_validate(request_json)  # raises on bad input</pre>
<pre>// TypeScript — Zod
import { z } from "zod";
const OrderIn = z.object({
  email: z.string().email().max(254),
  sku: z.string().regex(/^[A-Z0-9-]{3,20}$/),
  qty: z.number().int().min(1).max(100),
  currency: z.enum(["USD", "EUR", "ILS"]),
}).strict();
type OrderIn = z.infer&lt;typeof OrderIn&gt;;
const r = OrderIn.safeParse(body);
if (!r.success) return problem(422, r.error.issues);</pre>
<pre>// Java — Bean Validation (Jakarta)
public record OrderIn(
  @NotNull @Email @Size(max = 254) String email,
  @Pattern(regexp = "^[A-Z0-9-]{3,20}$") String sku,
  @Min(1) @Max(100) int qty) {}
// controller: createOrder(@Valid @RequestBody OrderIn in)</pre>
<pre>{ "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object", "additionalProperties": false,
  "required": ["email", "sku", "qty"],
  "properties": {
    "email": { "type": "string", "format": "email",
               "maxLength": 254 },
    "qty": { "type": "integer", "minimum": 1,
             "maximum": 100 } } }</pre>
<blockquote>💡 מהשטח: <code>extra: forbid</code> / <code>.strict()</code> / <code>additionalProperties: false</code> חוסמים <strong>mass assignment</strong> — הבאג הקלאסי שבו לקוח שולח <code>"role": "admin"</code> או <code>"price": 0</code> וה-ORM מחבר את זה בשמחה (התקרית של GitHub עם Rails ב-2012).</blockquote>`
      }
    },
    {
      h: { en: "Allowlists, canonicalization and limits", he: "Allowlists, canonicalization וגבולות" },
      body: {
        en: `<p><strong>Allowlist, not denylist.</strong> "Reject <code>&lt;script&gt;</code>" loses to <code>&lt;ScRiPt&gt;</code>, <code>&lt;img onerror=…&gt;</code> and a thousand encodings. "Accept only <code>[A-Za-z0-9 .'-]{1,80}</code>" can't be bypassed by creativity.</p>
<p><strong>Canonicalize first, then validate.</strong> The same value has many spellings; validate the one you'll actually use:</p>
<ul>
<li>Paths: <code>/files/../../etc/passwd</code>, <code>%2e%2e%2f</code>. Resolve with <code>realpath</code> and check it still starts with the allowed root.</li>
<li>Unicode: normalize to NFC/NFKC before comparing usernames — <code>"ﬁle"</code> (ligature) vs <code>"file"</code>, Cyrillic <code>"а"</code> vs Latin <code>"a"</code> (homograph accounts).</li>
<li>URLs (SSRF): parse with a real URL parser, resolve DNS, and reject private ranges <em>after</em> resolution — <code>http://2130706433/</code> is 127.0.0.1.</li>
</ul>
<pre># path traversal guard (Python)
from pathlib import Path
ROOT = Path("/srv/uploads").resolve()
p = (ROOT / user_name).resolve()
if not p.is_relative_to(ROOT):
    raise BadRequest("invalid path")</pre>
<p><strong>Limits are validation too</strong> — most DoS-by-input bugs are missing limits:</p>
<table>
<tr><th>Attack</th><th>Limit</th></tr>
<tr><td>Huge body</td><td>Max body 1 MB at the proxy (<code>client_max_body_size 1m;</code>)</td></tr>
<tr><td>JSON nesting bomb <code>[[[[…]]]]</code></td><td>Max depth 32, max array length 1,000</td></tr>
<tr><td>Zip bomb (42 KB → 4.5 PB)</td><td>Cap uncompressed size &amp; ratio while streaming</td></tr>
<tr><td>ReDoS <code>^(a+)+$</code> on "aaaa…!"</td><td>Linear-time engine (RE2, Go regexp) or input length cap + timeout</td></tr>
<tr><td>Billion laughs (XML entities)</td><td>Disable DTDs / external entities (defusedxml)</td></tr>
</table>
<blockquote>⚠️ Production tip: In 2019 a single regex with catastrophic backtracking in Cloudflare's WAF pinned CPU to 100% worldwide for 27 minutes. Treat regexes on untrusted input as code that needs a complexity review.</blockquote>`,
        he: `<p><strong>Allowlist, לא denylist.</strong> "לחסום <code>&lt;script&gt;</code>" מפסיד ל-<code>&lt;ScRiPt&gt;</code>, ל-<code>&lt;img onerror=…&gt;</code> ולאלף encodings. "לקבל רק <code>[A-Za-z0-9 .'-]{1,80}</code>" אי אפשר לעקוף ביצירתיות.</p>
<p><strong>קודם canonicalization, אחר כך ולידציה.</strong> לאותו ערך יש הרבה איותים; בודקים את זה שבאמת ישתמשו בו:</p>
<ul>
<li>Paths: <code>/files/../../etc/passwd</code>, <code>%2e%2e%2f</code>. עושים resolve עם <code>realpath</code> ובודקים שזה עדיין מתחיל ב-root המותר.</li>
<li>Unicode: עושים normalize ל-NFC/NFKC לפני השוואת שמות משתמש — <code>"ﬁle"</code> (ligature) מול <code>"file"</code>, <code>"а"</code> קירילי מול <code>"a"</code> לטיני (חשבונות homograph).</li>
<li>URLs (SSRF): מפרסרים עם URL parser אמיתי, עושים DNS resolve, ודוחים טווחים פרטיים <em>אחרי</em> ה-resolve — <code>http://2130706433/</code> זה 127.0.0.1.</li>
</ul>
<pre># path traversal guard (Python)
from pathlib import Path
ROOT = Path("/srv/uploads").resolve()
p = (ROOT / user_name).resolve()
if not p.is_relative_to(ROOT):
    raise BadRequest("invalid path")</pre>
<p><strong>גבולות הם גם ולידציה</strong> — רוב באגי ה-DoS דרך קלט הם גבולות חסרים:</p>
<table>
<tr><th>מתקפה</th><th>גבול</th></tr>
<tr><td>Body ענק</td><td>מקסימום 1 MB ב-proxy (<code>client_max_body_size 1m;</code>)</td></tr>
<tr><td>JSON nesting bomb <code>[[[[…]]]]</code></td><td>עומק מקסימלי 32, אורך מערך מקסימלי 1,000</td></tr>
<tr><td>Zip bomb (‏42 KB → 4.5 PB)</td><td>תקרה לגודל אחרי פריסה וליחס הדחיסה, תוך כדי streaming</td></tr>
<tr><td>ReDoS ‏<code>^(a+)+$</code> על "aaaa…!"</td><td>מנוע בזמן לינארי (RE2, Go regexp) או תקרת אורך + timeout</td></tr>
<tr><td>Billion laughs (XML entities)</td><td>לכבות DTDs / external entities ‏(defusedxml)</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: ב-2019 regex אחד עם catastrophic backtracking ב-WAF של Cloudflare הקפיץ CPU ל-100% בכל העולם ל-27 דקות. regex על קלט לא-אמין הוא קוד שצריך review של סיבוכיות.</blockquote>`
      }
    },
    {
      h: { en: "Files, config, IaC and LLM output", he: "קבצים, config, IaC ופלט של LLM" },
      body: {
        en: `<p><strong>File uploads:</strong> never trust the extension or the <code>Content-Type</code> header — both are client-controlled. Check <em>magic bytes</em> (PNG starts with <code>89 50 4E 47</code>, PDF with <code>%PDF</code>), cap size, re-encode images (strips polyglots and EXIF GPS), store under a random name outside the web root, scan with an AV in a quarantine bucket, serve from a separate domain with <code>Content-Disposition: attachment</code>.</p>
<p><strong>Config is input too.</strong> A typo in YAML has taken down more production than hackers. Validate config with a schema in CI and at startup (fail fast, before taking traffic). For infrastructure, use <strong>policy as code</strong>:</p>
<pre># Conftest (OPA/Rego) — run in CI on Terraform plan JSON
package main
deny[msg] {
  r := input.resource_changes[_]
  r.type == "aws_s3_bucket_public_access_block"
  r.change.after.block_public_acls == false
  msg := sprintf("%s must block public ACLs", [r.address])
}
# conftest test plan.json</pre>
<pre># Kyverno — reject Pods without resource limits
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-limits }
spec:
  validationFailureAction: Enforce
  rules:
  - name: limits
    match: { any: [ { resources: { kinds: [Pod] } } ] }
    validate:
      message: "cpu and memory limits are required"
      pattern:
        spec:
          containers:
          - resources:
              limits: { memory: "?*", cpu: "?*" }</pre>
<p><strong>Validate outbound data and LLM output.</strong> Data from your own DB, a partner API or a model is still untrusted when it flows into another sink. An LLM asked for JSON will sometimes return prose, extra fields, or an injected instruction — parse it with the same schema you'd use for a user, reject or retry, and never pass model output straight into SQL, a shell, or a tool call with side effects.</p>`,
        he: `<p><strong>העלאת קבצים:</strong> לא סומכים על הסיומת או על header ה-<code>Content-Type</code> — שניהם בשליטת הלקוח. בודקים <em>magic bytes</em> (PNG מתחיל ב-<code>89 50 4E 47</code>, PDF ב-<code>%PDF</code>), מגבילים גודל, עושים re-encode לתמונות (מוריד polyglots ו-GPS מה-EXIF), שומרים בשם אקראי מחוץ ל-web root, סורקים AV ב-bucket של הסגר, ומגישים מדומיין נפרד עם <code>Content-Disposition: attachment</code>.</p>
<p><strong>גם config הוא קלט.</strong> שגיאת הקלדה ב-YAML הפילה יותר פרודקשן מהאקרים. בודקים config מול schema ב-CI ובעלייה (fail fast, לפני שמקבלים traffic). לתשתית משתמשים ב-<strong>policy as code</strong>:</p>
<pre># Conftest (OPA/Rego) — run in CI on Terraform plan JSON
package main
deny[msg] {
  r := input.resource_changes[_]
  r.type == "aws_s3_bucket_public_access_block"
  r.change.after.block_public_acls == false
  msg := sprintf("%s must block public ACLs", [r.address])
}
# conftest test plan.json</pre>
<pre># Kyverno — reject Pods without resource limits
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-limits }
spec:
  validationFailureAction: Enforce
  rules:
  - name: limits
    match: { any: [ { resources: { kinds: [Pod] } } ] }
    validate:
      message: "cpu and memory limits are required"
      pattern:
        spec:
          containers:
          - resources:
              limits: { memory: "?*", cpu: "?*" }</pre>
<p><strong>בודקים גם מידע יוצא ופלט של LLM.</strong> מידע מה-DB שלך, מ-API של שותף או ממודל הוא עדיין לא-אמין כשהוא זורם ליעד אחר. LLM שביקשו ממנו JSON לפעמים יחזיר טקסט חופשי, שדות מיותרים או הוראה מוזרקת — מפרסרים אותו עם אותו schema שהיית משתמש בו למשתמש, דוחים או מנסים שוב, ולעולם לא מעבירים פלט של מודל ישר ל-SQL, ל-shell או ל-tool call עם side effects.</p>`
      }
    },
    {
      h: { en: "Returning errors well: RFC 9457 problem+json", he: "להחזיר שגיאות נכון: RFC 9457 problem+json" },
      body: {
        en: `<p>A good validation error tells the <em>client developer</em> exactly which field is wrong and why, in a machine-readable shape — and tells an <em>attacker</em> nothing about your internals. RFC 9457 (Problem Details, successor of RFC 7807) is the standard envelope:</p>
<pre>HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.shop.io/problems/validation",
  "title": "Request body is invalid",
  "status": 422,
  "detail": "2 fields failed validation",
  "instance": "/orders",
  "traceId": "4bf92f3577b34da6",
  "errors": [
    { "pointer": "/qty", "code": "too_large",
      "detail": "must be &lt;= 100" },
    { "pointer": "/currency", "code": "enum",
      "detail": "must be one of USD, EUR, ILS" }
  ]
}</pre>
<ul>
<li><strong>400</strong> for malformed syntax (not JSON at all), <strong>422</strong> for well-formed but invalid, <strong>409</strong> for state conflicts (already exists), <strong>413</strong> too large, <strong>415</strong> wrong content type.</li>
<li>Return <em>all</em> field errors at once — fixing one per round-trip is miserable.</li>
<li>Use stable <code>code</code> values clients can switch on; <code>detail</code> is for humans and can change.</li>
<li>Never echo stack traces, SQL, or internal hostnames. Log them server-side with the same <code>traceId</code>.</li>
<li>Don't reflect raw input back unescaped (that's how validation errors become XSS).</li>
</ul>
<blockquote>💡 Real world: count validation failures per endpoint and per client as a metric. A spike in 422s right after a deploy is the fastest signal that you broke backward compatibility for a client you forgot existed.</blockquote>`,
        he: `<p>שגיאת ולידציה טובה אומרת ל<em>מפתח של הלקוח</em> בדיוק איזה שדה שגוי ולמה, במבנה שמכונה יכולה לקרוא — ולא אומרת ל<em>תוקף</em> כלום על הפנים של המערכת. RFC 9457 (Problem Details, היורש של RFC 7807) הוא המעטפה הסטנדרטית:</p>
<pre>HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.shop.io/problems/validation",
  "title": "Request body is invalid",
  "status": 422,
  "detail": "2 fields failed validation",
  "instance": "/orders",
  "traceId": "4bf92f3577b34da6",
  "errors": [
    { "pointer": "/qty", "code": "too_large",
      "detail": "must be &lt;= 100" },
    { "pointer": "/currency", "code": "enum",
      "detail": "must be one of USD, EUR, ILS" }
  ]
}</pre>
<ul>
<li><strong>400</strong> ל-syntax שבור (בכלל לא JSON), <strong>422</strong> לתקין מבנית אבל לא חוקי, <strong>409</strong> להתנגשות state (כבר קיים), <strong>413</strong> גדול מדי, <strong>415</strong> content type שגוי.</li>
<li>מחזירים את <em>כל</em> שגיאות השדות בבת אחת — לתקן שדה אחד בכל round-trip זה סבל.</li>
<li>משתמשים בערכי <code>code</code> יציבים שהלקוח יכול לעשות עליהם switch; ה-<code>detail</code> הוא לבני אדם ויכול להשתנות.</li>
<li>לעולם לא מחזירים stack traces, SQL או hostnames פנימיים. רושמים אותם בלוג בצד השרת עם אותו <code>traceId</code>.</li>
<li>לא משקפים קלט גולמי חזרה בלי escaping (ככה שגיאות ולידציה הופכות ל-XSS).</li>
</ul>
<blockquote>💡 מהשטח: סופרים כשלי ולידציה לכל endpoint ולכל לקוח כ-metric. קפיצה ב-422 מיד אחרי deploy היא הסימן הכי מהיר ששברת תאימות לאחור ללקוח ששכחת שקיים.</blockquote>`
      }
    }
  ],
  diagram: `untrusted bytes
     |
 [edge]   size<=1MB, rate, auth, content-type      -> 413/429/401/415
     |
 [parse]  canonicalize -> schema -> typed OrderIn  -> 400/422
     |
 [domain] owner? stock? dates? coupon valid?       -> 403/409/422
     |
 [db]     CHECK, UNIQUE, FK, NOT NULL              -> last line
     |
 [output] encode per sink: HTML / SQL params / shell argv`,
  handsOn: [
    { cmd: "curl -s -X POST localhost:8000/orders -H 'Content-Type: application/json' -d '{\"email\":\"x\",\"qty\":500,\"role\":\"admin\"}' | jq", what: { en: "Send an invalid body with an extra field — expect one 422 listing every bad field, and the extra 'role' rejected, not silently bound.", he: "שולחים body לא תקין עם שדה מיותר — מצפים ל-422 אחד שמפרט כל שדה שגוי, ו-'role' נדחה ולא מתחבר בשקט." } },
    { cmd: "python -c \"import re,time;t=time.time();re.match(r'^(a+)+$','a'*26+'!');print(round(time.time()-t,2),'s')\"", what: { en: "Feel ReDoS: a 27-char input takes seconds with a backtracking regex. Add one 'a' and it roughly doubles.", he: "להרגיש ReDoS: קלט של 27 תווים לוקח שניות עם regex שעושה backtracking. מוסיפים 'a' אחת וזה בערך מכפיל את עצמו." } },
    { cmd: "head -c 8 upload.bin | xxd", what: { en: "Read magic bytes instead of trusting the extension: 89504e47 = PNG, 25504446 = PDF, 504b0304 = ZIP (also docx/xlsx).", he: "קוראים magic bytes במקום לסמוך על הסיומת: 89504e47 = PNG, ‏25504446 = PDF, ‏504b0304 = ZIP (גם docx/xlsx)." } },
    { cmd: "conftest test tfplan.json --policy policy/", what: { en: "Run policy-as-code on a Terraform plan (terraform show -json tfplan > tfplan.json) so bad infra fails in CI, not in prod.", he: "מריצים policy-as-code על Terraform plan ‏(terraform show -json tfplan > tfplan.json) כדי שתשתית לא תקינה תיכשל ב-CI ולא בפרודקשן." } }
  ],
  mnemonic: {
    en: "C-P-L-E: Canonicalize, Parse into types, Limit everything, Encode on the way out. And: allow-list, never deny-list.",
    he: "C-P-L-E: ‏Canonicalize, ‏Parse לטיפוסים, ‏Limit לכל דבר, ‏Encode ביציאה. ובנוסף: allow-list, אף פעם לא deny-list."
  },
  pitfalls: [
    { en: "Validating only in the frontend. The API is public the moment it has a URL; curl doesn't run your React form.", he: "ולידציה רק ב-frontend. ה-API ציבורי מהרגע שיש לו URL; ל-curl לא אכפת מהטופס שלך ב-React." },
    { en: "Validating before canonicalizing: checking that a path has no '..' and then URL-decoding it, or comparing usernames before Unicode normalization.", he: "ולידציה לפני canonicalization: בודקים שאין '..' בנתיב ואז עושים לו URL-decode, או משווים שמות משתמש לפני נרמול Unicode." },
    { en: "Accepting unknown fields and binding them straight to an ORM model — mass assignment of role, price, tenant_id.", he: "לקבל שדות לא מוכרים ולחבר אותם ישר למודל ORM — mass assignment של role, price, tenant_id." },
    { en: "No limits: unbounded body size, array length, JSON depth or regex input. Every missing limit is a cheap DoS.", he: "בלי גבולות: גודל body, אורך מערך, עומק JSON או קלט ל-regex בלי תקרה. כל גבול חסר הוא DoS זול." }
  ],
  interview: [
    { q: { en: "What does 'parse, don't validate' mean and why does it matter at scale?", he: "מה זה 'parse, don't validate' ולמה זה חשוב בסקייל?" },
      a: { en: "Instead of checking input and passing the same loose dict around, convert it at the boundary into a type that can only hold valid values (OrderIn with qty 1..100). Downstream code can't forget a check because invalid states are unrepresentable, the compiler/type checker enforces it, and there's exactly one place to change the rules. At scale, with many teams and entry points (HTTP, queue consumers, batch), this prevents the 'someone added a new caller that skipped validation' class of bugs.", he: "במקום לבדוק קלט ולהעביר את אותו dict רופף הלאה, ממירים אותו בגבול לטיפוס שיכול להחזיק רק ערכים תקינים (OrderIn עם qty בין 1 ל-100). קוד בהמשך לא יכול לשכוח בדיקה כי מצבים לא חוקיים פשוט לא ניתנים לייצוג, ה-compiler/type checker אוכף את זה, ויש מקום אחד לשנות בו את החוקים. בסקייל, עם הרבה צוותים ונקודות כניסה (HTTP, consumers של תורים, batch), זה מונע את משפחת הבאגים של 'מישהו הוסיף caller חדש שדילג על הוולידציה'." } },
    { q: { en: "A user can submit a URL and your server fetches a preview. How do you validate it?", he: "משתמש יכול לשלוח URL והשרת מושך ממנו preview. איך עושים ולידציה?" },
      a: { en: "This is SSRF territory. Allowlist schemes (https only), parse with a real URL parser, resolve DNS yourself, reject private/loopback/link-local ranges (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 incl. the cloud metadata IP, ::1, fc00::/7) after resolution, then connect to that exact IP (prevents DNS rebinding), disable redirects or re-validate each hop, cap response size and time, and run the fetcher in an isolated network segment with no route to internal services or metadata (IMDSv2 / hop limit 1).", he: "זה שטח של SSRF. עושים allowlist ל-schemes (רק https), מפרסרים עם URL parser אמיתי, עושים DNS resolve בעצמך, דוחים טווחים פרטיים/loopback/link-local ‏(10/8, ‏172.16/12, ‏192.168/16, ‏127/8, ‏169.254/16 כולל IP ה-metadata של הענן, ‏::1, ‏fc00::/7) אחרי ה-resolve, ואז מתחברים בדיוק ל-IP הזה (מונע DNS rebinding), מכבים redirects או בודקים מחדש כל קפיצה, מגבילים גודל וזמן תגובה, ומריצים את ה-fetcher בסגמנט רשת מבודד בלי route לשירותים פנימיים או ל-metadata ‏(IMDSv2 / hop limit 1)." } }
  ],
  quiz: [
    { q: { en: "A request body is valid JSON, but qty is 500 where the max is 100. Best status code?", he: "ה-body הוא JSON תקין, אבל qty הוא 500 כשהמקסימום 100. מה ה-status code הכי נכון?" },
      options: [ { en: "400 Bad Request", he: "400 Bad Request" }, { en: "422 Unprocessable Content", he: "422 Unprocessable Content" }, { en: "409 Conflict", he: "409 Conflict" }, { en: "500 Internal Server Error", he: "500 Internal Server Error" } ],
      answer: 1, explain: { en: "422 means the syntax was fine but the content failed validation. 400 fits unparseable input; 409 is a conflict with current state.", he: "‏422 אומר שה-syntax תקין אבל התוכן נכשל בוולידציה. 400 מתאים לקלט שאי אפשר לפרסר; 409 זה התנגשות עם ה-state הנוכחי." } },
    { q: { en: "Why validate a file upload by magic bytes instead of extension?", he: "למה בודקים קובץ שהועלה לפי magic bytes ולא לפי הסיומת?" },
      options: [ { en: "Magic bytes are faster to read", he: "קל יותר לקרוא magic bytes" }, { en: "The extension and Content-Type are client-controlled; the content's signature is what the parser will actually see", he: "הסיומת וה-Content-Type בשליטת הלקוח; החתימה של התוכן היא מה שה-parser באמת יראה" }, { en: "Browsers strip extensions", he: "דפדפנים מורידים סיומות" }, { en: "It's required by HTTP", he: "HTTP מחייב את זה" } ],
      answer: 1, explain: { en: "evil.php renamed to cat.jpg is still PHP. Check the real signature, re-encode, and store safely.", he: "evil.php ששונה ל-cat.jpg הוא עדיין PHP. בודקים את החתימה האמיתית, עושים re-encode ושומרים בצורה בטוחה." } },
    { q: { en: "Which ordering is correct?", he: "איזה סדר נכון?" },
      options: [ { en: "Validate, then canonicalize", he: "ולידציה, ואז canonicalize" }, { en: "Canonicalize, then validate", he: "Canonicalize, ואז ולידציה" }, { en: "Order doesn't matter", he: "הסדר לא משנה" }, { en: "Only canonicalize output", he: "רק לעשות canonicalize לפלט" } ],
      answer: 1, explain: { en: "If you validate first, a later decode/normalize step can turn a 'safe' value into ../ or a homograph.", he: "אם בודקים קודם, שלב decode/normalize מאוחר יותר יכול להפוך ערך 'בטוח' ל-../ או ל-homograph." } },
    { q: { en: "What's the most robust defense against ReDoS on user input?", he: "מה ההגנה הכי חזקה מפני ReDoS על קלט משתמש?" },
      options: [ { en: "A denylist of bad regexes", he: "Denylist של regexes רעים" }, { en: "A linear-time regex engine like RE2 plus input length caps", he: "מנוע regex בזמן לינארי כמו RE2 בתוספת תקרת אורך לקלט" }, { en: "More CPU", he: "יותר CPU" }, { en: "Running the regex twice", he: "להריץ את ה-regex פעמיים" } ],
      answer: 1, explain: { en: "RE2/Go regexp guarantee linear time by design; length caps bound the work for any engine.", he: "RE2/Go regexp מבטיחים זמן לינארי by design; תקרת אורך מגבילה את העבודה בכל מנוע." } }
  ],
  related: ["pr-api-design", "pr-error-handling", "pr-owasp-2025", "pr-security-owasp", "pr-encoding-serialization", "flow-file-upload"]
});

INFRA.lessons.push({
  id: "pr-api-design",
  track: "principal",
  order: 111,
  icon: "📐",
  level: 3,
  minutes: 18,
  title: { en: "API Design Review: REST Conventions a Principal Signs Off On", he: "API Design Review: מוסכמות REST ש-Principal חותם עליהן" },
  tldr: {
    en: "An API is a contract you can't take back: model resources, use status codes precisely, standardize errors, pagination and concurrency, design for retries and long operations, write the OpenAPI first and lint it, and only ever make backward-compatible changes.",
    he: "API הוא חוזה שאי אפשר לקחת בחזרה: ממדלים resources, משתמשים ב-status codes בדיוק, מתקננים שגיאות, pagination ו-concurrency, מתכננים ל-retries ולפעולות ארוכות, כותבים את ה-OpenAPI קודם ועושים לו lint, ועושים רק שינויים תואמים לאחור."
  },
  analogy: {
    en: "A public API is like the electrical socket standard in your country. Once millions of appliances are plugged in, you can add a new socket type next to the old one, but you can never change the shape of the old one — every toaster in the country would stop working. Good API design is choosing the plug shape carefully on day one, because you'll live with it for a decade.",
    he: "API ציבורי זה כמו תקן השקע החשמלי במדינה. ברגע שמיליוני מכשירים מחוברים, אפשר להוסיף סוג שקע חדש ליד הישן, אבל אי אפשר לשנות את צורת הישן — כל טוסטר במדינה יפסיק לעבוד. API design טוב זה לבחור את צורת התקע בזהירות ביום הראשון, כי תחיה איתה עשור."
  },
  sections: [
    {
      h: { en: "Resources, naming and methods", he: "Resources, שמות ו-methods" },
      body: {
        en: `<p>Model <strong>nouns</strong> (resources), let HTTP methods be the verbs. Plural collections, stable IDs, shallow nesting (max one level), lowercase-kebab paths, camelCase or snake_case JSON — pick one and lint for it.</p>
<pre>GET    /v1/orders?status=paid&amp;limit=50   list (filter + page)
POST   /v1/orders                         create  -&gt; 201 + Location
GET    /v1/orders/ord_8Fk2                read
PATCH  /v1/orders/ord_8Fk2                partial update
PUT    /v1/orders/ord_8Fk2                full replace (idempotent)
DELETE /v1/orders/ord_8Fk2                delete  -&gt; 204
GET    /v1/customers/cus_1/orders         one level of nesting
POST   /v1/orders/ord_8Fk2/cancel         action that isn't CRUD</pre>
<p>Actions that aren't CRUD (<code>cancel</code>, <code>refund</code>, <code>retry</code>) are fine as sub-resource POSTs — better than overloading <code>PATCH status=cancelled</code> with hidden side effects. Prefixed, opaque IDs (<code>ord_</code>, <code>cus_</code>, Stripe-style) make logs readable and stop people from guessing sequential IDs.</p>
<table>
<tr><th>Method</th><th>Safe</th><th>Idempotent</th><th>Typical success</th></tr>
<tr><td>GET / HEAD</td><td>✓</td><td>✓</td><td>200 / 304</td></tr>
<tr><td>PUT</td><td>✗</td><td>✓</td><td>200 / 204</td></tr>
<tr><td>DELETE</td><td>✗</td><td>✓</td><td>204 (and 404 or 204 on repeat — document which)</td></tr>
<tr><td>POST</td><td>✗</td><td>✗ (make it so with Idempotency-Key)</td><td>201 / 202</td></tr>
<tr><td>PATCH</td><td>✗</td><td>✗ (unless JSON Merge Patch on absolute values)</td><td>200</td></tr>
</table>`,
        he: `<p>ממדלים <strong>שמות עצם</strong> (resources), ונותנים ל-methods של HTTP להיות הפעלים. Collections ברבים, IDs יציבים, קינון רדוד (רמה אחת לכל היותר), paths באותיות קטנות עם מקפים, ו-JSON ב-camelCase או snake_case — בוחרים אחד ועושים לו lint.</p>
<pre>GET    /v1/orders?status=paid&amp;limit=50   list (filter + page)
POST   /v1/orders                         create  -&gt; 201 + Location
GET    /v1/orders/ord_8Fk2                read
PATCH  /v1/orders/ord_8Fk2                partial update
PUT    /v1/orders/ord_8Fk2                full replace (idempotent)
DELETE /v1/orders/ord_8Fk2                delete  -&gt; 204
GET    /v1/customers/cus_1/orders         one level of nesting
POST   /v1/orders/ord_8Fk2/cancel         action that isn't CRUD</pre>
<p>פעולות שהן לא CRUD (<code>cancel</code>, <code>refund</code>, <code>retry</code>) בסדר גמור כ-POST על sub-resource — עדיף מלהעמיס על <code>PATCH status=cancelled</code> side effects נסתרים. IDs עם prefix ואטומים (<code>ord_</code>, <code>cus_</code>, בסגנון Stripe) הופכים לוגים לקריאים ומונעים ניחוש של IDs רציפים.</p>
<table>
<tr><th>Method</th><th>Safe</th><th>Idempotent</th><th>הצלחה טיפוסית</th></tr>
<tr><td>GET / HEAD</td><td>✓</td><td>✓</td><td>200 / 304</td></tr>
<tr><td>PUT</td><td>✗</td><td>✓</td><td>200 / 204</td></tr>
<tr><td>DELETE</td><td>✗</td><td>✓</td><td>204 (ובפעם השנייה 404 או 204 — מתעדים איזה)</td></tr>
<tr><td>POST</td><td>✗</td><td>✗ (הופכים לכזה עם Idempotency-Key)</td><td>201 / 202</td></tr>
<tr><td>PATCH</td><td>✗</td><td>✗ (אלא אם JSON Merge Patch על ערכים מוחלטים)</td><td>200</td></tr>
</table>`
      }
    },
    {
      h: { en: "Status codes and errors, precisely", he: "Status codes ושגיאות, בדיוק" },
      body: {
        en: `<table>
<tr><th>Code</th><th>Meaning</th><th>Client should…</th></tr>
<tr><td>201 Created</td><td>New resource; send <code>Location</code></td><td>Store the ID</td></tr>
<tr><td>202 Accepted</td><td>Queued for async work</td><td>Poll the status URL / wait for webhook</td></tr>
<tr><td>204 No Content</td><td>Done, nothing to return</td><td>—</td></tr>
<tr><td>400</td><td>Malformed request</td><td>Fix the code, don't retry</td></tr>
<tr><td>401</td><td>Not authenticated (missing/expired token)</td><td>Refresh token, retry once</td></tr>
<tr><td>403</td><td>Authenticated but not allowed</td><td>Don't retry; show "no access"</td></tr>
<tr><td>404</td><td>Not found — <em>or</em> exists but you mustn't know (avoid leaking)</td><td>Don't retry</td></tr>
<tr><td>409</td><td>Conflict with current state (duplicate, wrong state)</td><td>Re-read, decide</td></tr>
<tr><td>412</td><td>Precondition failed (If-Match ETag stale)</td><td>Re-read, re-apply, retry</td></tr>
<tr><td>422</td><td>Valid syntax, invalid content</td><td>Fix input</td></tr>
<tr><td>429</td><td>Rate limited; send <code>Retry-After</code></td><td>Back off, retry later</td></tr>
<tr><td>500</td><td>Bug on our side</td><td>Retry with backoff if idempotent</td></tr>
<tr><td>503</td><td>Overloaded / maintenance; <code>Retry-After</code></td><td>Back off, retry</td></tr>
</table>
<p>Every error uses one envelope — RFC 9457 <code>application/problem+json</code> with a stable <code>type</code>/<code>code</code>, a human <code>detail</code>, and a <code>traceId</code> (see <a href="#/lesson/pr-input-validation">input validation</a>). The <em>retryability</em> of each code is part of your contract: SDKs and gateways will build retry logic on it.</p>
<blockquote>⚠️ Production tip: returning 200 with <code>{"success": false}</code> breaks every proxy, CDN, monitor and retry library in the world — they all key off the status code. Your error-rate SLO will show 0% errors during an outage.</blockquote>`,
        he: `<table>
<tr><th>Code</th><th>משמעות</th><th>מה הלקוח צריך לעשות</th></tr>
<tr><td>201 Created</td><td>Resource חדש; שולחים <code>Location</code></td><td>לשמור את ה-ID</td></tr>
<tr><td>202 Accepted</td><td>נכנס לתור לעבודה אסינכרונית</td><td>לעשות poll ל-status URL / לחכות ל-webhook</td></tr>
<tr><td>204 No Content</td><td>בוצע, אין מה להחזיר</td><td>—</td></tr>
<tr><td>400</td><td>בקשה שבורה</td><td>לתקן את הקוד, לא לנסות שוב</td></tr>
<tr><td>401</td><td>לא מזוהה (token חסר/פג)</td><td>לרענן token, לנסות פעם אחת</td></tr>
<tr><td>403</td><td>מזוהה אבל אין הרשאה</td><td>לא לנסות שוב; להראות "אין גישה"</td></tr>
<tr><td>404</td><td>לא נמצא — <em>או</em> קיים אבל אסור לך לדעת (כדי לא לדלוף)</td><td>לא לנסות שוב</td></tr>
<tr><td>409</td><td>התנגשות עם ה-state (כפילות, מצב לא נכון)</td><td>לקרוא מחדש ולהחליט</td></tr>
<tr><td>412</td><td>Precondition failed ‏(ETag ב-If-Match לא עדכני)</td><td>לקרוא מחדש, להחיל שוב, לנסות</td></tr>
<tr><td>422</td><td>Syntax תקין, תוכן לא חוקי</td><td>לתקן את הקלט</td></tr>
<tr><td>429</td><td>Rate limit; שולחים <code>Retry-After</code></td><td>Back off, לנסות אחר כך</td></tr>
<tr><td>500</td><td>באג אצלנו</td><td>Retry עם backoff אם הפעולה idempotent</td></tr>
<tr><td>503</td><td>עומס / תחזוקה; <code>Retry-After</code></td><td>Back off, לנסות שוב</td></tr>
</table>
<p>כל שגיאה משתמשת במעטפה אחת — RFC 9457 ‏<code>application/problem+json</code> עם <code>type</code>/<code>code</code> יציב, <code>detail</code> לבני אדם ו-<code>traceId</code> (ראה <a href="#/lesson/pr-input-validation">ולידציה של קלט</a>). ה<em>האם-לנסות-שוב</em> של כל קוד הוא חלק מהחוזה: SDKs ו-gateways יבנו עליו לוגיקת retry.</p>
<blockquote>⚠️ טיפ לפרודקשן: להחזיר 200 עם <code>{"success": false}</code> שובר כל proxy, CDN, מוניטור וספריית retry בעולם — כולם מסתכלים על ה-status code. ה-SLO של אחוז השגיאות שלך יראה 0% שגיאות בזמן outage.</blockquote>`
      }
    },
    {
      h: { en: "Lists, concurrency, retries and long operations", he: "רשימות, concurrency, retries ופעולות ארוכות" },
      body: {
        en: `<p><strong>Lists:</strong> always paginated from day one (adding it later is breaking), cursor-based (<a href="#/lesson/pr-ids-pagination">keyset</a>), a max <code>limit</code> (e.g. 100), stable sort with a tie-breaker, and filters as query params.</p>
<pre>GET /v1/orders?status=paid&amp;created_gte=2026-11-01
             &amp;sort=-created_at&amp;limit=50&amp;cursor=eyJpZCI6...
200 { "data": [...], "next_cursor": "eyJpZCI6...", "has_more": true }</pre>
<p><strong>Optimistic concurrency</strong> stops lost updates between two editors:</p>
<pre>GET  /v1/docs/42           -&gt; 200  ETag: "v7"
PUT  /v1/docs/42  If-Match: "v7"   -&gt; 200 ETag: "v8"
PUT  /v1/docs/42  If-Match: "v7"   -&gt; 412 Precondition Failed</pre>
<p><strong>Retries:</strong> every POST that creates or charges accepts an <code>Idempotency-Key</code> header (see <a href="#/lesson/pr-idempotency">idempotency</a>), so a client timeout + retry never double-charges.</p>
<p><strong>Long-running operations</strong> (export, video transcode, provisioning): don't hold a request open for 5 minutes behind a 60 s LB timeout. Return 202 with an operation resource:</p>
<pre>POST /v1/exports            -&gt; 202 Location: /v1/operations/op_9
GET  /v1/operations/op_9    -&gt; 200 {"status":"running","progress":0.4}
GET  /v1/operations/op_9    -&gt; 200 {"status":"succeeded",
                                    "result":"/v1/exports/exp_3"}</pre>
<p><strong>Bulk:</strong> <code>POST /v1/orders:batch</code> with up to N items; respond 200 with a per-item result array (<code>{index, status, id | error}</code>) — or 207 Multi-Status — so one bad row doesn't fail 999 good ones, and document whether the batch is atomic.</p>
<p><strong>Webhooks</strong> are part of the API: signed (HMAC with timestamp), versioned payloads, at-least-once with retries over ~3 days, an event ID for dedupe, and a "resend" endpoint/UI.</p>`,
        he: `<p><strong>רשימות:</strong> תמיד עם pagination מהיום הראשון (להוסיף אחר כך זה שינוי שובר), מבוסס cursor ‏(<a href="#/lesson/pr-ids-pagination">keyset</a>), <code>limit</code> מקסימלי (למשל 100), מיון יציב עם tie-breaker, ופילטרים כ-query params.</p>
<pre>GET /v1/orders?status=paid&amp;created_gte=2026-11-01
             &amp;sort=-created_at&amp;limit=50&amp;cursor=eyJpZCI6...
200 { "data": [...], "next_cursor": "eyJpZCI6...", "has_more": true }</pre>
<p><strong>Optimistic concurrency</strong> מונע lost updates בין שני עורכים:</p>
<pre>GET  /v1/docs/42           -&gt; 200  ETag: "v7"
PUT  /v1/docs/42  If-Match: "v7"   -&gt; 200 ETag: "v8"
PUT  /v1/docs/42  If-Match: "v7"   -&gt; 412 Precondition Failed</pre>
<p><strong>Retries:</strong> כל POST שיוצר משהו או מחייב כסף מקבל header ‏<code>Idempotency-Key</code> (ראה <a href="#/lesson/pr-idempotency">אידמפוטנטיות</a>), כך ש-timeout אצל הלקוח + retry אף פעם לא מחייב פעמיים.</p>
<p><strong>פעולות ארוכות</strong> (export, transcode של וידאו, provisioning): לא מחזיקים בקשה פתוחה 5 דקות מאחורי LB עם timeout של 60 שניות. מחזירים 202 עם resource של פעולה:</p>
<pre>POST /v1/exports            -&gt; 202 Location: /v1/operations/op_9
GET  /v1/operations/op_9    -&gt; 200 {"status":"running","progress":0.4}
GET  /v1/operations/op_9    -&gt; 200 {"status":"succeeded",
                                    "result":"/v1/exports/exp_3"}</pre>
<p><strong>Bulk:</strong> ‏<code>POST /v1/orders:batch</code> עם עד N פריטים; מחזירים 200 עם מערך תוצאות לכל פריט (<code>{index, status, id | error}</code>) — או 207 Multi-Status — כדי ששורה רעה אחת לא תכשיל 999 טובות, ומתעדים אם ה-batch אטומי.</p>
<p><strong>Webhooks</strong> הם חלק מה-API: חתומים (HMAC עם timestamp), payloads עם גרסה, at-least-once עם retries לאורך ~3 ימים, event ID ל-dedupe, ו-endpoint/UI של "שלח שוב".</p>`
      }
    },
    {
      h: { en: "Versioning, compatibility and deprecation", he: "Versioning, תאימות ו-deprecation" },
      body: {
        en: `<p><strong>Backward-compatible (safe):</strong> add an endpoint, add an optional request field, add a response field, add an enum value <em>only if</em> clients were told to tolerate unknowns, relax a validation.</p>
<p><strong>Breaking:</strong> remove/rename a field, change a type (<code>id</code> int → string), make an optional field required, tighten validation, change a default, change error codes or semantics, change pagination, reorder positional fields.</p>
<p>Clients must follow <strong>tolerant reader</strong>: ignore unknown fields, handle unknown enum values. Write that in your API guidelines and your SDKs.</p>
<table>
<tr><th>Versioning style</th><th>Example</th><th>Notes</th></tr>
<tr><td>URL major</td><td><code>/v1/orders</code></td><td>Most common, obvious, cache-friendly</td></tr>
<tr><td>Header</td><td><code>Accept: application/vnd.shop.v2+json</code></td><td>Clean URLs, harder to test in a browser</td></tr>
<tr><td>Dated (Stripe)</td><td><code>Stripe-Version: 2026-10-01</code></td><td>Account pinned to a date; server transforms responses per version</td></tr>
</table>
<p>Deprecating: announce, add response headers, measure who still calls it, contact them, then turn it off.</p>
<pre>Deprecation: @1767225600          (RFC 9745, Unix time)
Sunset: Thu, 30 Apr 2027 00:00:00 GMT   (RFC 8594)
Link: &lt;https://docs.shop.io/migrate-v2&gt;; rel="deprecation"</pre>
<blockquote>💡 Real world: you cannot deprecate what you can't see. Log API version, endpoint and client ID (API key / OAuth client) on every request, and build a dashboard "who still calls v1" before you announce anything.</blockquote>`,
        he: `<p><strong>תואם לאחור (בטוח):</strong> להוסיף endpoint, להוסיף שדה אופציונלי בבקשה, להוסיף שדה בתשובה, להוסיף ערך ל-enum <em>רק אם</em> אמרו ללקוחות לסבול ערכים לא מוכרים, להקל ולידציה.</p>
<p><strong>שובר:</strong> להסיר/לשנות שם של שדה, לשנות טיפוס (<code>id</code> מ-int ל-string), להפוך שדה אופציונלי לחובה, להחמיר ולידציה, לשנות default, לשנות קודי שגיאה או משמעות, לשנות pagination, לשנות סדר של שדות פוזיציונליים.</p>
<p>הלקוחות חייבים לעבוד כ-<strong>tolerant reader</strong>: מתעלמים משדות לא מוכרים, מטפלים בערכי enum לא מוכרים. כותבים את זה ב-API guidelines וב-SDKs.</p>
<table>
<tr><th>סגנון versioning</th><th>דוגמה</th><th>הערות</th></tr>
<tr><td>Major ב-URL</td><td><code>/v1/orders</code></td><td>הכי נפוץ, ברור, ידידותי ל-cache</td></tr>
<tr><td>Header</td><td><code>Accept: application/vnd.shop.v2+json</code></td><td>URLs נקיים, קשה יותר לבדוק בדפדפן</td></tr>
<tr><td>לפי תאריך (Stripe)</td><td><code>Stripe-Version: 2026-10-01</code></td><td>החשבון נעול לתאריך; השרת ממיר תשובות לפי גרסה</td></tr>
</table>
<p>Deprecation: מכריזים, מוסיפים headers לתשובה, מודדים מי עדיין קורא, יוצרים קשר, ורק אז מכבים.</p>
<pre>Deprecation: @1767225600          (RFC 9745, Unix time)
Sunset: Thu, 30 Apr 2027 00:00:00 GMT   (RFC 8594)
Link: &lt;https://docs.shop.io/migrate-v2&gt;; rel="deprecation"</pre>
<blockquote>💡 מהשטח: אי אפשר לעשות deprecation למה שלא רואים. רושמים API version, endpoint ו-client ID ‏(API key / OAuth client) על כל בקשה, ובונים dashboard של "מי עדיין קורא ל-v1" לפני שמכריזים על משהו.</blockquote>`
      }
    },
    {
      h: { en: "OpenAPI-first, linting, gRPC/GraphQL and the review checklist", he: "OpenAPI-first, ‏lint, ‏gRPC/GraphQL ו-checklist ל-review" },
      body: {
        en: `<p>Write the contract before the code: review it in a PR, generate mocks for the frontend, generate server stubs and SDKs (openapi-generator, Kiota), and lint it so conventions are enforced by a robot, not a meeting.</p>
<pre>openapi: 3.1.0
info: { title: Orders API, version: "1.4.0" }
paths:
  /v1/orders/{id}:
    get:
      operationId: getOrder
      parameters:
        - { name: id, in: path, required: true,
            schema: { type: string, pattern: "^ord_" } }
      responses:
        "200": { content: { application/json:
                 { schema: { $ref: "#/components/schemas/Order" } } } }
        "404": { $ref: "#/components/responses/Problem" }</pre>
<pre># .spectral.yaml
extends: ["spectral:oas"]
rules:
  paths-kebab-case: error
  operation-operationId: error
  no-200-on-post:
    given: "$.paths[*].post.responses"
    then: { field: "200", function: falsy }</pre>
<p>Break detection in CI: <code>oasdiff breaking old.yaml new.yaml</code> fails the build on removed fields or new required params.</p>
<p><strong>gRPC:</strong> never reuse or renumber protobuf field numbers (mark removed ones <code>reserved</code>), add fields freely, use <code>google.rpc.Status</code> codes (<code>UNAVAILABLE</code> retryable, <code>INVALID_ARGUMENT</code> not), set deadlines on every call. <strong>GraphQL:</strong> evolve without versions (add fields, <code>@deprecated</code> old ones), but enforce query depth/complexity limits and persisted queries, or one query can scan your DB.</p>
<p><strong>The principal's API review checklist:</strong></p>
<ol>
<li>Resources and IDs make sense to an outsider? Consistent naming and casing?</li>
<li>Every list paginated with a max limit? Stable sort?</li>
<li>Every create/charge idempotent? Concurrency control (ETag) where two writers can collide?</li>
<li>Status codes correct and documented as retryable or not? One error envelope?</li>
<li>AuthN/AuthZ per endpoint; object-level checks (no IDOR); tenant scoping?</li>
<li>Limits: body size, rate limits, batch size, timeouts; long work is async (202)?</li>
<li>Compatibility: only additive changes; tolerant readers; deprecation plan?</li>
<li>Observability: request ID, client ID and version logged; per-endpoint SLOs?</li>
</ol>`,
        he: `<p>כותבים את החוזה לפני הקוד: עושים לו review ב-PR, מייצרים mocks ל-frontend, מייצרים server stubs ו-SDKs ‏(openapi-generator, ‏Kiota), ועושים lint כך שהמוסכמות נאכפות ע"י רובוט ולא ע"י פגישה.</p>
<pre>openapi: 3.1.0
info: { title: Orders API, version: "1.4.0" }
paths:
  /v1/orders/{id}:
    get:
      operationId: getOrder
      parameters:
        - { name: id, in: path, required: true,
            schema: { type: string, pattern: "^ord_" } }
      responses:
        "200": { content: { application/json:
                 { schema: { $ref: "#/components/schemas/Order" } } } }
        "404": { $ref: "#/components/responses/Problem" }</pre>
<pre># .spectral.yaml
extends: ["spectral:oas"]
rules:
  paths-kebab-case: error
  operation-operationId: error
  no-200-on-post:
    given: "$.paths[*].post.responses"
    then: { field: "200", function: falsy }</pre>
<p>זיהוי שבירות ב-CI: ‏<code>oasdiff breaking old.yaml new.yaml</code> מפיל את ה-build על שדות שהוסרו או פרמטרים חדשים שהם חובה.</p>
<p><strong>gRPC:</strong> אף פעם לא ממחזרים או ממספרים מחדש field numbers ב-protobuf (מסמנים שדות שהוסרו כ-<code>reserved</code>), מוסיפים שדות בחופשיות, משתמשים בקודים של <code>google.rpc.Status</code> ‏(<code>UNAVAILABLE</code> מותר retry, ‏<code>INVALID_ARGUMENT</code> לא), ושמים deadline על כל קריאה. <strong>GraphQL:</strong> מתפתחים בלי גרסאות (מוסיפים שדות, מסמנים ישנים ב-<code>@deprecated</code>), אבל אוכפים מגבלות עומק/מורכבות של query ו-persisted queries, אחרת query אחד יכול לסרוק לך את ה-DB.</p>
<p><strong>ה-checklist של Principal ל-API review:</strong></p>
<ol>
<li>ה-resources וה-IDs הגיוניים למישהו מבחוץ? שמות ו-casing עקביים?</li>
<li>כל רשימה עם pagination ו-limit מקסימלי? מיון יציב?</li>
<li>כל create/חיוב אידמפוטנטי? בקרת concurrency ‏(ETag) איפה ששני כותבים יכולים להתנגש?</li>
<li>Status codes נכונים ומתועדים כ-retryable או לא? מעטפת שגיאה אחת?</li>
<li>AuthN/AuthZ לכל endpoint; בדיקות ברמת אובייקט (בלי IDOR); scoping לפי tenant?</li>
<li>גבולות: גודל body, rate limits, גודל batch, timeouts; עבודה ארוכה היא async ‏(202)?</li>
<li>תאימות: רק שינויים מוסיפים; tolerant readers; תוכנית deprecation?</li>
<li>Observability: request ID, client ID וגרסה נרשמים; SLO לכל endpoint?</li>
</ol>`
      }
    }
  ],
  diagram: `client SDK ──HTTPS──> gateway (auth, rate limit 429, size 413)
                          │
                          v
                   /v1/orders  ──POST + Idempotency-Key──> 201 Location
                          │
             GET ?cursor  │  PUT If-Match:"v7" ──> 200 | 412
                          │
   POST /v1/exports ──> 202 ──> /v1/operations/op_9 (poll) ──> done
                          │
                  webhooks (HMAC signed, retried, event id)

contract: openapi.yaml ──spectral lint──oasdiff breaking──> CI gate`,
  handsOn: [
    { cmd: "npx @stoplight/spectral-cli lint openapi.yaml", what: { en: "Lint your OpenAPI spec against the built-in ruleset plus your own conventions (casing, operationId, error schema).", he: "עושים lint ל-OpenAPI spec מול ה-ruleset המובנה ועוד המוסכמות שלך (casing, ‏operationId, schema לשגיאות)." } },
    { cmd: "oasdiff breaking openapi-main.yaml openapi-pr.yaml --fail-on ERR", what: { en: "Fail CI when a PR removes a field, changes a type or adds a required parameter.", he: "מפילים את ה-CI כש-PR מסיר שדה, משנה טיפוס או מוסיף פרמטר חובה." } },
    { cmd: "curl -i https://api.github.com/repos/octocat/hello-world -H 'If-None-Match: \"abc\"'", what: { en: "See a real API's ETag, cache and rate-limit headers (x-ratelimit-remaining); repeat with the returned ETag to get 304 Not Modified.", he: "רואים ETag, ‏cache ו-headers של rate limit ‏(x-ratelimit-remaining) של API אמיתי; חוזרים עם ה-ETag שקיבלת ומקבלים 304 Not Modified." } },
    { cmd: "npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o sdk/", what: { en: "Generate a typed client SDK from the contract — the same spec drives docs, mocks, stubs and SDKs.", he: "מייצרים SDK typed מהחוזה — אותו spec מייצר docs, ‏mocks, ‏stubs ו-SDKs." } }
  ],
  mnemonic: {
    en: "N-S-E-P-I-C: Nouns, Status codes, one Error shape, Pagination, Idempotency, Compatibility. An API is a socket standard — add sockets, never reshape them.",
    he: "N-S-E-P-I-C: ‏Nouns, ‏Status codes, צורת Error אחת, ‏Pagination, ‏Idempotency, ‏Compatibility. ‏API הוא תקן שקע — מוסיפים שקעים, לא משנים צורה."
  },
  pitfalls: [
    { en: "Shipping a list endpoint without pagination 'because there are only 20 items'. A year later there are 2 million and adding pagination breaks every client.", he: "לשחרר endpoint של רשימה בלי pagination 'כי יש רק 20 פריטים'. שנה אחר כך יש 2 מיליון ולהוסיף pagination שובר כל לקוח." },
    { en: "Returning 200 for errors or 500 for client mistakes — retries hammer you on 500s that will never succeed, and monitors stay green during real outages.", he: "להחזיר 200 על שגיאות או 500 על טעויות של הלקוח — retries דופקים אותך על 500 שלעולם לא יצליחו, והמוניטורים נשארים ירוקים בזמן outage אמיתי." },
    { en: "Leaking internal models: exposing DB column names, auto-increment IDs and every ORM field makes the schema impossible to evolve and enables IDOR guessing.", he: "לחשוף מודלים פנימיים: שמות עמודות ב-DB, ‏IDs רציפים וכל שדה של ה-ORM הופכים את ה-schema לבלתי ניתן לשינוי ומאפשרים ניחוש IDOR." },
    { en: "'Small' breaking changes without a version: renaming a field, adding a required parameter, changing an enum's meaning. Someone's integration breaks at 3 AM.", he: "שינויים שוברים 'קטנים' בלי גרסה: לשנות שם שדה, להוסיף פרמטר חובה, לשנות משמעות של enum. האינטגרציה של מישהו נשברת ב-3 בלילה." }
  ],
  interview: [
    { q: { en: "How would you design an endpoint that generates a 2 GB report?", he: "איך היית מתכנן endpoint שמייצר דוח של 2 GB?" },
      a: { en: "Async: POST /v1/reports with an Idempotency-Key returns 202 and an operation resource; a worker builds the report from a queue; GET /v1/operations/{id} returns status/progress, and optionally a webhook fires on completion. The result is written to object storage and the API returns a short-lived pre-signed URL rather than streaming 2 GB through the API tier. Add per-tenant concurrency limits, a TTL on results, and cancellation (POST .../cancel).", he: "אסינכרוני: ‏POST /v1/reports עם Idempotency-Key מחזיר 202 ו-resource של פעולה; worker בונה את הדוח מתור; ‏GET /v1/operations/{id} מחזיר status/progress, ואפשר גם webhook בסיום. התוצאה נכתבת ל-object storage וה-API מחזיר pre-signed URL קצר-מועד במקום להזרים 2 GB דרך שכבת ה-API. מוסיפים מגבלות concurrency לכל tenant, ‏TTL לתוצאות וביטול ‏(POST .../cancel)." } },
    { q: { en: "A partner asks to rename a confusing field. How do you do it without breaking anyone?", he: "שותף מבקש לשנות שם של שדה מבלבל. איך עושים את זה בלי לשבור אף אחד?" },
      a: { en: "Expand and contract: add the new field alongside the old one (both populated, same value), document the new one, mark the old deprecated in OpenAPI and with Deprecation/Sunset headers, measure usage of the old field per client (log which clients send/read it), notify them, and only remove it in the next major version (or a new dated version) once usage is near zero.", he: "Expand and contract: מוסיפים את השדה החדש לצד הישן (שניהם מאוכלסים באותו ערך), מתעדים את החדש, מסמנים את הישן כ-deprecated ב-OpenAPI ועם headers של Deprecation/Sunset, מודדים שימוש בשדה הישן לכל לקוח (רושמים אילו לקוחות שולחים/קוראים אותו), מודיעים להם, ומסירים רק בגרסת major הבאה (או גרסה חדשה לפי תאריך) כשהשימוש קרוב לאפס." } }
  ],
  quiz: [
    { q: { en: "Two users edit the same document; the second save should not silently overwrite the first. What do you use?", he: "שני משתמשים עורכים אותו מסמך; השמירה השנייה לא אמורה לדרוס בשקט את הראשונה. במה משתמשים?" },
      options: [ { en: "Idempotency-Key", he: "Idempotency-Key" }, { en: "ETag + If-Match, returning 412 on mismatch", he: "ETag + If-Match, ומחזירים 412 כשאין התאמה" }, { en: "Retry-After", he: "Retry-After" }, { en: "HTTP/2", he: "HTTP/2" } ],
      answer: 1, explain: { en: "If-Match makes the write conditional on the version the client saw — optimistic concurrency.", he: "If-Match הופך את הכתיבה למותנית בגרסה שהלקוח ראה — optimistic concurrency." } },
    { q: { en: "Which change is backward-compatible?", he: "איזה שינוי תואם לאחור?" },
      options: [ { en: "Making an optional request field required", he: "להפוך שדה אופציונלי בבקשה לחובה" }, { en: "Adding a new optional field to the response", he: "להוסיף שדה אופציונלי חדש לתשובה" }, { en: "Changing id from integer to string", he: "לשנות id מ-integer ל-string" }, { en: "Renaming a field", he: "לשנות שם של שדה" } ],
      answer: 1, explain: { en: "Additive response changes are safe for tolerant readers; the others break existing clients.", he: "הוספה לתשובה בטוחה ל-tolerant readers; השאר שוברים לקוחות קיימים." } },
    { q: { en: "An export takes 4 minutes. The best API shape is…", he: "Export לוקח 4 דקות. הצורה הכי טובה ל-API היא…" },
      options: [ { en: "Hold the connection open and return 200 at the end", he: "להחזיק את החיבור פתוח ולהחזיר 200 בסוף" }, { en: "202 Accepted + an operation resource to poll (and/or a webhook)", he: "202 Accepted + resource של פעולה לעשות לו poll (ו/או webhook)" }, { en: "500 and ask the client to retry", he: "500 ולבקש מהלקוח לנסות שוב" }, { en: "204 No Content", he: "204 No Content" } ],
      answer: 1, explain: { en: "Long work goes async; LBs and clients time out long before 4 minutes.", he: "עבודה ארוכה הולכת ל-async; ‏LBs ולקוחות עושים timeout הרבה לפני 4 דקות." } },
    { q: { en: "In protobuf/gRPC, you removed field 7. What must you do?", he: "ב-protobuf/gRPC הסרת את field 7. מה חובה לעשות?" },
      options: [ { en: "Reuse 7 for the next new field", he: "להשתמש ב-7 לשדה החדש הבא" }, { en: "Mark 7 as reserved so it's never reused", he: "לסמן את 7 כ-reserved כדי שלעולם לא ישתמשו בו שוב" }, { en: "Renumber all fields", he: "למספר מחדש את כל השדות" }, { en: "Nothing", he: "כלום" } ],
      answer: 1, explain: { en: "Old clients still send field 7 with the old meaning; reusing the number silently corrupts data.", he: "לקוחות ישנים עדיין שולחים field 7 במשמעות הישנה; שימוש חוזר במספר משבש מידע בשקט." } }
  ],
  related: ["pr-input-validation", "pr-idempotency", "pr-ids-pagination", "pr-integration-styles", "arch-api-gateway", "pr-rate-limiters", "pr-error-handling"]
});

INFRA.lessons.push({
  id: "pr-enterprise-integrations",
  track: "principal",
  order: 112,
  icon: "🏢",
  level: 3,
  minutes: 18,
  title: { en: "Enterprise Integrations: SSO, SCIM, Payments, CRM/ERP and B2B Files", he: "אינטגרציות Enterprise: ‏SSO, ‏SCIM, תשלומים, CRM/ERP וקבצי B2B" },
  tldr: {
    en: "Enterprise customers don't buy features, they buy integrations: per-tenant SSO and SCIM, payments driven by signed webhooks and reconciliation, CRM/ERP sync through bulk APIs with mapping and conflict rules, and file drops with schemas — all behind an anti-corruption layer and monitored per integration.",
    he: "לקוחות Enterprise לא קונים פיצ'רים, הם קונים אינטגרציות: SSO ו-SCIM לכל tenant, תשלומים שמונעים ע\"י webhooks חתומים ו-reconciliation, סנכרון CRM/ERP דרך bulk APIs עם טבלאות מיפוי וחוקי התנגשות, וקבצים עם schema — הכול מאחורי anti-corruption layer ועם ניטור לכל אינטגרציה."
  },
  analogy: {
    en: "Your product is a new employee joining a big company. SSO is using the company badge instead of getting your own key. SCIM is HR automatically adding and removing people from your access list when they join or quit. Payments are the finance department — they only trust the bank statement (reconciliation), never your memory. And the CRM/ERP sync is translating between two departments that use different words for the same thing — you need an interpreter (anti-corruption layer) so their jargon doesn't leak into your own notes.",
    he: "המוצר שלך הוא עובד חדש שמצטרף לחברה גדולה. SSO זה להשתמש בתג של החברה במקום לקבל מפתח משלך. SCIM זה HR שמוסיף ומוריד אוטומטית אנשים מרשימת הגישה שלך כשהם מתקבלים או עוזבים. תשלומים זה מחלקת הכספים — הם סומכים רק על דף הבנק (reconciliation), אף פעם לא על הזיכרון שלך. וסנכרון CRM/ERP זה לתרגם בין שתי מחלקות שקוראות לאותו דבר בשמות שונים — צריך מתורגמן (anti-corruption layer) כדי שהז'רגון שלהם לא ידלוף למחברת שלך."
  },
  sections: [
    {
      h: { en: "B2B identity: per-tenant SSO and SCIM provisioning", he: "זהות ב-B2B: ‏SSO לכל tenant ו-SCIM provisioning" },
      body: {
        en: `<p>Every enterprise deal asks: "Do you support SSO with our IdP (Okta, Entra ID, Google, Ping)?" and "Do you support SCIM?". Plan for both from the first enterprise customer.</p>
<table>
<tr><th></th><th>SAML 2.0</th><th>OIDC</th></tr>
<tr><td>Format</td><td>Signed XML assertions</td><td>JWT ID tokens over OAuth 2.0</td></tr>
<tr><td>Typical use</td><td>Older enterprise IdPs, still the most requested</td><td>Modern IdPs, mobile, SPAs</td></tr>
<tr><td>Pain points</td><td>XML signature wrapping bugs, clock skew, cert rotation</td><td>Simpler, but per-tenant issuer/JWKS config</td></tr>
</table>
<p><strong>Per-tenant config</strong>: each customer has its own IdP metadata (entity ID, SSO URL, signing cert / issuer + client ID), a <em>verified email domain</em> for home-realm discovery (<code>@acme.com</code> → Acme's IdP), and policies (enforce SSO, allowed domains, JIT provisioning on/off). Most teams buy this layer (WorkOS, Auth0/Okta CIC, Keycloak, Cognito) rather than parse SAML themselves.</p>
<p><strong>SCIM 2.0</strong> (RFC 7643/7644) is how the customer's IdP creates, updates and — critically — <em>deactivates</em> users in your app. Without it, an employee fired on Friday can still log in on Monday with a session or API key.</p>
<pre>POST /scim/v2/Users
Authorization: Bearer &lt;per-tenant SCIM token&gt;
Content-Type: application/scim+json

{ "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "userName": "dana@acme.com", "externalId": "00u1ab2c",
  "name": { "givenName": "Dana", "familyName": "Levi" },
  "active": true,
  "emails": [{ "value": "dana@acme.com", "primary": true }] }

PATCH /scim/v2/Users/usr_77   (offboarding)
{ "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{ "op": "replace", "value": { "active": false } }] }</pre>
<blockquote>⚠️ Production tip: on <code>active: false</code>, revoke sessions, refresh tokens and API keys immediately — not at next login. Auditors will ask for proof (an audit log entry with the SCIM request ID).</blockquote>`,
        he: `<p>כל עסקת Enterprise שואלת: "אתם תומכים ב-SSO עם ה-IdP שלנו (Okta, ‏Entra ID, ‏Google, ‏Ping)?" ו-"אתם תומכים ב-SCIM?". מתכננים לשניהם מהלקוח ה-Enterprise הראשון.</p>
<table>
<tr><th></th><th>SAML 2.0</th><th>OIDC</th></tr>
<tr><td>פורמט</td><td>XML assertions חתומים</td><td>JWT ID tokens מעל OAuth 2.0</td></tr>
<tr><td>שימוש טיפוסי</td><td>IdPs ותיקים ב-Enterprise, עדיין הכי מבוקש</td><td>IdPs מודרניים, מובייל, SPAs</td></tr>
<tr><td>כאבים</td><td>באגים של XML signature wrapping, ‏clock skew, החלפת certs</td><td>פשוט יותר, אבל config של issuer/JWKS לכל tenant</td></tr>
</table>
<p><strong>Config לכל tenant</strong>: לכל לקוח יש IdP metadata משלו (entity ID, ‏SSO URL, ‏signing cert / issuer + client ID), <em>דומיין מייל מאומת</em> ל-home-realm discovery ‏(<code>@acme.com</code> → ה-IdP של Acme), ומדיניות (לחייב SSO, דומיינים מותרים, JIT provisioning כן/לא). רוב הצוותים קונים את השכבה הזו (WorkOS, ‏Auth0/Okta CIC, ‏Keycloak, ‏Cognito) במקום לפרסר SAML לבד.</p>
<p><strong>SCIM 2.0</strong> ‏(RFC 7643/7644) הוא הדרך שבה ה-IdP של הלקוח יוצר, מעדכן ו — הכי חשוב — <em>מבטל</em> משתמשים אצלך. בלי זה, עובד שפוטר ביום שישי עדיין יכול להתחבר ביום שני עם session או API key.</p>
<pre>POST /scim/v2/Users
Authorization: Bearer &lt;per-tenant SCIM token&gt;
Content-Type: application/scim+json

{ "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "userName": "dana@acme.com", "externalId": "00u1ab2c",
  "name": { "givenName": "Dana", "familyName": "Levi" },
  "active": true,
  "emails": [{ "value": "dana@acme.com", "primary": true }] }

PATCH /scim/v2/Users/usr_77   (offboarding)
{ "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{ "op": "replace", "value": { "active": false } }] }</pre>
<blockquote>⚠️ טיפ לפרודקשן: ב-<code>active: false</code> מבטלים sessions, ‏refresh tokens ו-API keys מיד — לא בהתחברות הבאה. מבקרים (auditors) יבקשו הוכחה (רשומה ב-audit log עם ה-request ID של ה-SCIM).</blockquote>`
      }
    },
    {
      h: { en: "Payments: PaymentIntents, webhooks, 3DS and reconciliation", he: "תשלומים: ‏PaymentIntents, ‏webhooks, ‏3DS ו-reconciliation" },
      body: {
        en: `<p>A card payment is a <em>state machine</em> that partly lives in the customer's bank, not a single API call. With Stripe (similar in Adyen, Braintree):</p>
<pre>1 server: POST /v1/payment_intents
          amount=12900 currency=ils
          Idempotency-Key: order_o81_attempt1
          -&gt; pi_3Q.. status=requires_payment_method
2 browser: stripe.confirmPayment(client_secret)
          -&gt; bank may demand 3-D Secure (OTP / app)
          -&gt; status=requires_action -&gt; processing
3 Stripe -&gt; your webhook: payment_intent.succeeded
4 your server: verify signature, dedupe event id,
          mark order PAID, emit OrderPaid (outbox)</pre>
<p>The <strong>webhook is the source of truth</strong>, not the browser redirect — the user may close the tab after 3DS. Verify every webhook:</p>
<pre># Python, Stripe webhook receiver
@app.post("/webhooks/stripe")
def stripe_hook(req):
    payload = req.body  # raw bytes, not parsed JSON
    sig = req.headers["Stripe-Signature"]
    try:
        ev = stripe.Webhook.construct_event(
            payload, sig, WHSEC, tolerance=300)
    except (ValueError, stripe.SignatureVerificationError):
        return 400
    if seen_events.add_if_absent(ev["id"]) is False:
        return 200          # duplicate delivery: ack, do nothing
    enqueue(ev)             # do the work async, ack fast
    return 200</pre>
<p><strong>Reconciliation</strong>: every night, pull the provider's balance transactions / settlement report and compare to your ledger by payment ID — missing in yours (webhook lost), missing in theirs (you marked paid wrongly), amount/currency/fee mismatch, refunds, chargebacks. Finance trusts the report, not your DB.</p>
<blockquote>💡 Real world: never store card numbers — use the provider's hosted fields/Elements so PANs never touch your servers, which keeps you at PCI DSS SAQ A instead of a full SAQ D audit.</blockquote>`,
        he: `<p>תשלום בכרטיס הוא <em>state machine</em> שחלק ממנה חי בבנק של הלקוח, לא קריאת API אחת. עם Stripe (דומה ב-Adyen, ‏Braintree):</p>
<pre>1 server: POST /v1/payment_intents
          amount=12900 currency=ils
          Idempotency-Key: order_o81_attempt1
          -&gt; pi_3Q.. status=requires_payment_method
2 browser: stripe.confirmPayment(client_secret)
          -&gt; bank may demand 3-D Secure (OTP / app)
          -&gt; status=requires_action -&gt; processing
3 Stripe -&gt; your webhook: payment_intent.succeeded
4 your server: verify signature, dedupe event id,
          mark order PAID, emit OrderPaid (outbox)</pre>
<p><strong>ה-webhook הוא מקור האמת</strong>, לא ה-redirect בדפדפן — המשתמש יכול לסגור את הטאב אחרי ה-3DS. מאמתים כל webhook:</p>
<pre># Python, Stripe webhook receiver
@app.post("/webhooks/stripe")
def stripe_hook(req):
    payload = req.body  # raw bytes, not parsed JSON
    sig = req.headers["Stripe-Signature"]
    try:
        ev = stripe.Webhook.construct_event(
            payload, sig, WHSEC, tolerance=300)
    except (ValueError, stripe.SignatureVerificationError):
        return 400
    if seen_events.add_if_absent(ev["id"]) is False:
        return 200          # duplicate delivery: ack, do nothing
    enqueue(ev)             # do the work async, ack fast
    return 200</pre>
<p><strong>Reconciliation</strong>: כל לילה מושכים את דוח ה-balance transactions / settlement של הספק ומשווים ל-ledger שלך לפי payment ID — חסר אצלך (webhook אבד), חסר אצלם (סימנת כשולם בטעות), אי-התאמה בסכום/מטבע/עמלה, החזרים, chargebacks. הכספים סומכים על הדוח, לא על ה-DB שלך.</p>
<blockquote>💡 מהשטח: אף פעם לא שומרים מספרי כרטיס — משתמשים ב-hosted fields/Elements של הספק כדי ש-PANs לעולם לא יגיעו לשרתים שלך, וזה משאיר אותך ב-PCI DSS SAQ A במקום audit מלא של SAQ D.</blockquote>`
      }
    },
    {
      h: { en: "CRM/ERP sync: bulk APIs, limits, CDC and conflicts", he: "סנכרון CRM/ERP: ‏bulk APIs, מגבלות, CDC והתנגשויות" },
      body: {
        en: `<p>Syncing accounts, contacts or invoices with Salesforce, HubSpot, SAP or NetSuite is a data problem disguised as an API call.</p>
<ul>
<li><strong>Use the right API for volume:</strong> Salesforce REST for single records, Bulk API 2.0 for 10k+ rows (async jobs with CSV), Change Data Capture / Platform Events to receive changes instead of polling. Respect quotas — e.g. a daily API-call allocation per org — and track usage per tenant.</li>
<li><strong>Mapping table</strong> as a first-class object: <code>(tenant, local_type, local_id) ↔ (remote_system, remote_id)</code> plus last-synced version/hash. Never rely on matching by name or email.</li>
<li><strong>Field mapping per tenant</strong>: customers have custom fields (<code>Region__c</code>); store mapping config, validate it, show it in the UI.</li>
<li><strong>Direction &amp; conflicts</strong>: decide the system of record per field (CRM owns <code>owner</code>, you own <code>usage</code>). For two-way fields use last-writer-wins by remote <code>LastModifiedDate</code>, or flag conflicts for a human. Prevent ping-pong loops by tagging writes with your integration user and ignoring echoes.</li>
<li><strong>Incremental sync</strong>: high-water mark (<code>SystemModstamp &gt; :cursor</code>) with overlap, plus a periodic full reconciliation to heal drift.</li>
</ul>
<pre>sync_state(tenant, object, cursor_ts, last_full_sync, status)
id_map(tenant, kind, local_id, remote_id, remote_version)
sync_errors(tenant, kind, remote_id, error, attempts, next_try)</pre>
<p><strong>File-based B2B</strong> is still everywhere (banks, retail, logistics, healthcare): SFTP drops, EDI (X12 850 purchase order, EDIFACT), fixed-width or CSV files. Treat a file like an API: a published schema and version, checksum and row count in a manifest/trailer, idempotent processing by file name + hash, a quarantine folder for rejects with a per-row error report, and PGP encryption for files at rest.</p>`,
        he: `<p>סנכרון accounts, ‏contacts או חשבוניות עם Salesforce, ‏HubSpot, ‏SAP או NetSuite הוא בעיית data שמתחפשת לקריאת API.</p>
<ul>
<li><strong>ה-API הנכון לנפח:</strong> Salesforce REST לרשומות בודדות, ‏Bulk API 2.0 ל-10k+ שורות (jobs אסינכרוניים עם CSV), ‏Change Data Capture / Platform Events כדי לקבל שינויים במקום polling. מכבדים quotas — למשל הקצאה יומית של קריאות API לכל org — ועוקבים אחרי שימוש לכל tenant.</li>
<li><strong>טבלת מיפוי</strong> כאובייקט מרכזי: <code>(tenant, local_type, local_id) ↔ (remote_system, remote_id)</code> ועוד גרסה/hash של הסנכרון האחרון. אף פעם לא מתאימים לפי שם או מייל.</li>
<li><strong>מיפוי שדות לכל tenant</strong>: ללקוחות יש שדות מותאמים (<code>Region__c</code>); שומרים config של מיפוי, מאמתים אותו ומציגים ב-UI.</li>
<li><strong>כיוון והתנגשויות</strong>: מחליטים מי ה-system of record לכל שדה (ה-CRM הבעלים של <code>owner</code>, אתה הבעלים של <code>usage</code>). לשדות דו-כיווניים משתמשים ב-last-writer-wins לפי <code>LastModifiedDate</code> של הצד השני, או מסמנים התנגשות לבדיקה אנושית. מונעים לולאות פינג-פונג ע"י תיוג כתיבות עם משתמש האינטגרציה והתעלמות מההדים.</li>
<li><strong>סנכרון אינקרמנטלי</strong>: high-water mark ‏(<code>SystemModstamp &gt; :cursor</code>) עם חפיפה, ועוד reconciliation מלא תקופתי כדי לרפא drift.</li>
</ul>
<pre>sync_state(tenant, object, cursor_ts, last_full_sync, status)
id_map(tenant, kind, local_id, remote_id, remote_version)
sync_errors(tenant, kind, remote_id, error, attempts, next_try)</pre>
<p><strong>B2B מבוסס קבצים</strong> עדיין בכל מקום (בנקים, קמעונאות, לוגיסטיקה, בריאות): קבצים ב-SFTP, ‏EDI ‏(X12 850 הזמנת רכש, EDIFACT), קבצים ברוחב קבוע או CSV. מתייחסים לקובץ כמו ל-API: schema וגרסה מפורסמים, checksum ומספר שורות ב-manifest/trailer, עיבוד אידמפוטנטי לפי שם קובץ + hash, תיקיית הסגר לדחויים עם דוח שגיאות לכל שורה, והצפנת PGP לקבצים במנוחה.</p>`
      }
    },
    {
      h: { en: "Architecture: integration hub, anti-corruption layer, build vs iPaaS", he: "ארכיטקטורה: integration hub, ‏anti-corruption layer, ‏build מול iPaaS" },
      body: {
        en: `<p>Don't let 30 vendors' quirks leak into your core domain. Put integrations in their own service(s) — an <strong>integration hub</strong> — with one adapter per external system behind an <strong>anti-corruption layer</strong> that translates their model (Salesforce <code>Account</code>, SAP <code>KUNNR</code>) into your canonical events (<code>CustomerUpdated</code>).</p>
<ul>
<li><strong>Connector pattern</strong>: each connector implements the same interface (<code>authorize</code>, <code>pull_changes(cursor)</code>, <code>push(entity)</code>, <code>health()</code>), runs as queue workers, and is isolated so one vendor's outage or rate limit can't starve the others (bulkheads, per-connector queues).</li>
<li><strong>Credentials per customer</strong>: OAuth tokens or API keys per tenant per connector, encrypted with envelope encryption (KMS), refresh-token rotation handled centrally, and a "reconnect" flow in the UI when a customer's admin revokes access.</li>
<li><strong>Sandboxes</strong>: test against vendor sandboxes (Stripe test mode, Salesforce sandbox orgs) in CI with recorded fixtures (VCR-style), and give customers a sandbox tenant of <em>your</em> product to test their side.</li>
</ul>
<table>
<tr><th></th><th>Build connectors</th><th>iPaaS (Workato, MuleSoft, Boomi) / unified APIs (Merge, Paragon)</th></tr>
<tr><td>Good when</td><td>Core to your product, high volume, deep two-way sync</td><td>Long tail of systems, customer-specific flows, speed</td></tr>
<tr><td>Cost</td><td>Engineering + forever maintenance as vendor APIs change</td><td>License per connection/task; less control over limits &amp; data residency</td></tr>
</table>
<blockquote>💡 Real world: a common split — build the 3–5 integrations that win deals (your top CRM, SSO/SCIM, payments) natively; offer webhooks + a public API + an iPaaS connector for the long tail.</blockquote>`,
        he: `<p>לא נותנים לשיגעונות של 30 ספקים לדלוף ל-domain המרכזי שלך. שמים את האינטגרציות בשירות(ים) משלהן — <strong>integration hub</strong> — עם adapter אחד לכל מערכת חיצונית מאחורי <strong>anti-corruption layer</strong> שמתרגם את המודל שלהם (Salesforce ‏<code>Account</code>, ‏SAP ‏<code>KUNNR</code>) ל-events הקנוניים שלך (<code>CustomerUpdated</code>).</p>
<ul>
<li><strong>Connector pattern</strong>: כל connector מממש את אותו interface ‏(<code>authorize</code>, ‏<code>pull_changes(cursor)</code>, ‏<code>push(entity)</code>, ‏<code>health()</code>), רץ כ-workers על תורים, ומבודד כך ש-outage או rate limit של ספק אחד לא ירעיב את האחרים (bulkheads, תור לכל connector).</li>
<li><strong>Credentials לכל לקוח</strong>: OAuth tokens או API keys לכל tenant ולכל connector, מוצפנים ב-envelope encryption ‏(KMS), החלפת refresh tokens מנוהלת במרוכז, ו-flow של "התחבר מחדש" ב-UI כשאדמין של הלקוח מבטל גישה.</li>
<li><strong>Sandboxes</strong>: בודקים מול sandboxes של הספקים (Stripe test mode, ‏Salesforce sandbox orgs) ב-CI עם fixtures מוקלטים (בסגנון VCR), ונותנים ללקוחות tenant של sandbox ב<em>מוצר שלך</em> כדי לבדוק את הצד שלהם.</li>
</ul>
<table>
<tr><th></th><th>לבנות connectors</th><th>iPaaS ‏(Workato, ‏MuleSoft, ‏Boomi) / unified APIs ‏(Merge, ‏Paragon)</th></tr>
<tr><td>טוב כש</td><td>ליבת המוצר, נפח גבוה, סנכרון דו-כיווני עמוק</td><td>זנב ארוך של מערכות, flows ספציפיים ללקוח, מהירות</td></tr>
<tr><td>עלות</td><td>הנדסה + תחזוקה לנצח כשה-APIs של הספקים משתנים</td><td>רישיון לכל חיבור/task; פחות שליטה על מגבלות ו-data residency</td></tr>
</table>
<blockquote>💡 מהשטח: חלוקה נפוצה — בונים native את 3–5 האינטגרציות שסוגרות עסקאות (ה-CRM המוביל, ‏SSO/SCIM, תשלומים); לזנב הארוך מציעים webhooks + API ציבורי + connector ל-iPaaS.</blockquote>`
      }
    },
    {
      h: { en: "Operating integrations: health, SLOs, dead letters and replay", he: "להפעיל אינטגרציות: בריאות, SLOs, ‏dead letters ו-replay" },
      body: {
        en: `<p>Integrations fail silently: the customer's admin rotates a password, a field is deleted in their CRM, the vendor changes an API. You find out when the customer's VP asks why the dashboard is two weeks stale. Make integration health visible:</p>
<ul>
<li><strong>Per-integration SLIs</strong>: sync freshness (now − last successful sync), success rate of pushes, backlog size, webhook delivery latency. Example SLO: "99% of CRM changes visible in our app within 15 minutes".</li>
<li><strong>Error classes</strong>: auth expired (→ notify customer admin, pause the connector), validation (→ per-record error, continue others), rate limited (→ back off using the vendor's <code>Retry-After</code>), vendor down (→ retry with backoff, circuit breaker).</li>
<li><strong>Dead letters with context</strong>: store the failed payload, the error, attempts and the tenant; build an internal (and ideally customer-facing) UI to inspect, fix mapping, and <strong>replay</strong> — replay must be idempotent.</li>
<li><strong>Customer-facing status page per connection</strong>: "Last synced 3 min ago · 2 records failed · Reconnect". It cuts support tickets dramatically.</li>
<li><strong>Audit</strong>: who connected what, which scopes were granted, every SCIM change, every outbound data push — enterprise security reviews will ask.</li>
</ul>
<pre># Prometheus: alert on stale CRM syncs per tenant
- alert: CrmSyncStale
  expr: time() - integration_last_success_ts{kind="crm"} &gt; 3600
  for: 10m
  labels: { severity: ticket }
  annotations:
    summary: "CRM sync stale for tenant {{ $labels.tenant }}"</pre>`,
        he: `<p>אינטגרציות נכשלות בשקט: האדמין של הלקוח מחליף סיסמה, שדה נמחק ב-CRM שלהם, הספק משנה API. מגלים כשה-VP של הלקוח שואל למה ה-dashboard לא מעודכן שבועיים. הופכים את בריאות האינטגרציות לגלויה:</p>
<ul>
<li><strong>SLIs לכל אינטגרציה</strong>: טריות הסנכרון (עכשיו פחות הסנכרון המוצלח האחרון), אחוז הצלחה של pushes, גודל backlog, ‏latency של מסירת webhooks. דוגמת SLO: "‏99% משינויי ה-CRM נראים אצלנו תוך 15 דקות".</li>
<li><strong>סוגי שגיאות</strong>: auth פג (← מודיעים לאדמין של הלקוח, עוצרים את ה-connector), ולידציה (← שגיאה לרשומה, ממשיכים עם השאר), rate limited (← back off לפי ה-<code>Retry-After</code> של הספק), הספק למטה (← retry עם backoff, ‏circuit breaker).</li>
<li><strong>Dead letters עם הקשר</strong>: שומרים את ה-payload שנכשל, השגיאה, מספר הניסיונות וה-tenant; בונים UI פנימי (ועדיף גם ללקוח) לבדוק, לתקן מיפוי ולעשות <strong>replay</strong> — וה-replay חייב להיות אידמפוטנטי.</li>
<li><strong>עמוד סטטוס לכל חיבור, מול הלקוח</strong>: "סונכרן לפני 3 דקות · 2 רשומות נכשלו · התחבר מחדש". זה מוריד פניות תמיכה בצורה דרמטית.</li>
<li><strong>Audit</strong>: מי חיבר מה, אילו scopes ניתנו, כל שינוי SCIM, כל push של מידע החוצה — סקירות אבטחה של Enterprise ישאלו.</li>
</ul>
<pre># Prometheus: alert on stale CRM syncs per tenant
- alert: CrmSyncStale
  expr: time() - integration_last_success_ts{kind="crm"} &gt; 3600
  for: 10m
  labels: { severity: ticket }
  annotations:
    summary: "CRM sync stale for tenant {{ $labels.tenant }}"</pre>`
      }
    }
  ],
  diagram: `   customer IdP ──SAML/OIDC──> [auth: per-tenant SSO]
   customer IdP ──SCIM──────> [users: create/deactivate]

   Stripe ──signed webhook──> [payments adapter] ─┐
   Salesforce ──CDC/Bulk────> [crm connector]   ──┤  anti-corruption
   SAP / NetSuite ──────────> [erp connector]   ──┤  layer -> canonical
   SFTP / EDI files ────────> [file ingester]   ──┘  events
                                   │
                         queue per connector (bulkhead)
                                   │
                     core domain  <── CustomerUpdated, OrderPaid
                                   │
     DLQ + replay UI · per-tenant credentials (KMS) · sync SLOs`,
  handsOn: [
    { cmd: "stripe listen --forward-to localhost:8000/webhooks/stripe", what: { en: "Stripe CLI: receive real test-mode webhooks locally, see signatures, and replay events with 'stripe events resend evt_...'.", he: "Stripe CLI: מקבלים webhooks אמיתיים של test mode מקומית, רואים חתימות, ועושים replay עם 'stripe events resend evt_...'." } },
    { cmd: "stripe trigger payment_intent.succeeded", what: { en: "Fire a test event end to end and confirm your handler is idempotent by triggering it twice.", he: "יורים event בדיקה מקצה לקצה ומוודאים שה-handler אידמפוטנטי ע\"י הפעלה פעמיים." } },
    { cmd: "curl -s -H 'Authorization: Bearer $SCIM_TOKEN' 'https://app.local/scim/v2/Users?filter=userName%20eq%20%22dana@acme.com%22' | jq", what: { en: "Query your SCIM endpoint the way Okta/Entra does (filter by userName) — the IdP relies on this to avoid creating duplicates.", he: "שואלים את ה-SCIM endpoint שלך כמו ש-Okta/Entra עושים (filter לפי userName) — ה-IdP סומך על זה כדי לא ליצור כפילויות." } },
    { cmd: "sf data query --query \"SELECT Id, Name, SystemModstamp FROM Account WHERE SystemModstamp > 2026-11-01T00:00:00Z\" --target-org sandbox", what: { en: "Salesforce CLI incremental pull by high-water mark — the core of a polling-based CRM sync.", he: "משיכה אינקרמנטלית עם Salesforce CLI לפי high-water mark — הלב של סנכרון CRM מבוסס polling." } }
  ],
  mnemonic: {
    en: "S-S-P-C-F: SSO, SCIM, Payments, CRM/ERP, Files — each one behind an adapter, each one with its own SLO, each one replayable.",
    he: "S-S-P-C-F: ‏SSO, ‏SCIM, ‏Payments, ‏CRM/ERP, ‏Files — כל אחד מאחורי adapter, כל אחד עם SLO משלו, וכל אחד ניתן ל-replay."
  },
  pitfalls: [
    { en: "Trusting the browser redirect after payment instead of the signed webhook — users close tabs mid-3DS, and you either lose paid orders or mark unpaid ones as paid.", he: "לסמוך על ה-redirect בדפדפן אחרי תשלום במקום על ה-webhook החתום — משתמשים סוגרים טאבים באמצע 3DS, ואתה מאבד הזמנות ששולמו או מסמן כשולמו כאלה שלא." },
    { en: "SSO without SCIM: deactivated employees keep access through existing sessions and API keys until someone notices.", he: "SSO בלי SCIM: עובדים שבוטלו שומרים על גישה דרך sessions ו-API keys קיימים עד שמישהו שם לב." },
    { en: "Matching records across systems by name/email instead of a mapping table — duplicates, merges of different people, and impossible-to-debug drift.", he: "התאמת רשומות בין מערכות לפי שם/מייל במקום טבלת מיפוי — כפילויות, איחוד של אנשים שונים ו-drift שאי אפשר לדבג." },
    { en: "Letting vendor models leak into the core domain (Salesforce field names in your DB schema). The next CRM integration means a rewrite.", he: "לתת למודלים של הספק לדלוף ל-domain המרכזי (שמות שדות של Salesforce ב-schema של ה-DB שלך). האינטגרציה הבאה עם CRM אחר תהיה שכתוב." }
  ],
  interview: [
    { q: { en: "Design two-way sync between your app's accounts and a customer's Salesforce.", he: "תתכנן סנכרון דו-כיווני בין ה-accounts באפליקציה שלך ל-Salesforce של לקוח." },
      a: { en: "Per-tenant OAuth connection with encrypted tokens. Initial backfill with Bulk API 2.0, then incremental via CDC/Platform Events (or SystemModstamp polling with overlap). An id_map table links local and remote IDs; a per-tenant field-mapping config; per-field system of record, last-writer-wins on remote timestamps for shared fields, conflicts flagged. Writes tagged with the integration user to drop echoes. Work runs on a per-connector queue with rate-limit-aware backoff, DLQ + replay UI, a nightly full reconciliation, and an SLO on freshness with alerts and a customer-facing status page.", he: "חיבור OAuth לכל tenant עם tokens מוצפנים. Backfill ראשוני עם Bulk API 2.0, ואז אינקרמנטלי דרך CDC/Platform Events (או polling על SystemModstamp עם חפיפה). טבלת id_map מקשרת IDs מקומיים ומרוחקים; config של מיפוי שדות לכל tenant; system of record לכל שדה, ‏last-writer-wins לפי timestamps מרוחקים לשדות משותפים, והתנגשויות מסומנות. כתיבות מתויגות עם משתמש האינטגרציה כדי לזרוק הדים. העבודה רצה על תור לכל connector עם backoff שמודע ל-rate limit, ‏DLQ + UI ל-replay, ‏reconciliation מלא כל לילה, ו-SLO על טריות עם alerts ועמוד סטטוס מול הלקוח." } },
    { q: { en: "Your payment webhook endpoint was down for 2 hours. What happens and what do you do?", he: "ה-endpoint של webhooks לתשלומים היה למטה שעתיים. מה קורה ומה עושים?" },
      a: { en: "Providers like Stripe retry with exponential backoff for up to ~3 days, so most events will arrive once you're back — your handler must dedupe by event ID and process out-of-order events by checking the object's current state rather than assuming sequence. Meanwhile, run reconciliation: list payment intents / events for the outage window via the API and process anything missing. Afterwards: alert on webhook failures from the provider dashboard and your own 5xx, and make the receiver a thin 'verify, store, ack' layer so it rarely goes down.", he: "ספקים כמו Stripe עושים retry עם exponential backoff עד ~3 ימים, אז רוב ה-events יגיעו כשתחזור — ה-handler חייב לעשות dedupe לפי event ID ולטפל ב-events שמגיעים לא לפי הסדר ע\"י בדיקת ה-state הנוכחי של האובייקט במקום להניח רצף. במקביל מריצים reconciliation: מושכים payment intents / events לחלון ה-outage דרך ה-API ומעבדים כל מה שחסר. אחר כך: alert על כשלי webhooks מה-dashboard של הספק ומה-5xx שלך, והופכים את המקבל לשכבה דקה של 'verify, store, ack' כדי שכמעט אף פעם לא ייפול." } }
  ],
  quiz: [
    { q: { en: "An employee leaves the customer's company. Which mechanism removes their access in your app automatically?", he: "עובד עוזב את החברה של הלקוח. איזה מנגנון מסיר לו את הגישה אצלך אוטומטית?" },
      options: [ { en: "SAML", he: "SAML" }, { en: "SCIM deprovisioning (active=false)", he: "SCIM deprovisioning ‏(active=false)" }, { en: "Password expiry", he: "תפוגת סיסמה" }, { en: "CORS", he: "CORS" } ],
      answer: 1, explain: { en: "SSO only controls new logins; SCIM pushes lifecycle changes so you can revoke sessions and keys.", he: "SSO שולט רק בהתחברויות חדשות; SCIM דוחף שינויי מחזור חיים כך שאפשר לבטל sessions ומפתחות." } },
    { q: { en: "What is the source of truth that a payment succeeded?", he: "מה מקור האמת לכך שתשלום הצליח?" },
      options: [ { en: "The browser's success redirect", he: "ה-redirect של ההצלחה בדפדפן" }, { en: "A verified provider webhook (plus reconciliation)", he: "Webhook מאומת מהספק (ועוד reconciliation)" }, { en: "The client's JavaScript callback", he: "ה-callback ב-JavaScript של הלקוח" }, { en: "A log line", he: "שורה בלוג" } ],
      answer: 1, explain: { en: "The redirect can be skipped or forged; a signed webhook and the provider's records can't.", he: "אפשר לדלג על ה-redirect או לזייף אותו; webhook חתום והרשומות של הספק — לא." } },
    { q: { en: "Best way to link a local customer to a Salesforce Account?", he: "הדרך הכי טובה לקשר לקוח מקומי ל-Account ב-Salesforce?" },
      options: [ { en: "Match by company name", he: "התאמה לפי שם חברה" }, { en: "A mapping table of local_id ↔ remote_id per tenant", he: "טבלת מיפוי של local_id ↔ remote_id לכל tenant" }, { en: "Match by email domain", he: "התאמה לפי דומיין מייל" }, { en: "Store the Salesforce ID in a free-text note", he: "לשמור את ה-ID של Salesforce בהערה חופשית" } ],
      answer: 1, explain: { en: "Names and emails change and collide; explicit ID mapping is stable and debuggable.", he: "שמות ומיילים משתנים ומתנגשים; מיפוי מפורש של IDs יציב וניתן לדיבאג." } },
    { q: { en: "Why put each connector on its own queue/worker pool?", he: "למה לשים כל connector על תור/מאגר workers משלו?" },
      options: [ { en: "It's cheaper", he: "זה זול יותר" }, { en: "Bulkhead: one vendor's outage or rate limit can't starve the other integrations", he: "Bulkhead: ‏outage או rate limit של ספק אחד לא ירעיב את שאר האינטגרציות" }, { en: "Vendors require it", he: "הספקים דורשים את זה" }, { en: "To avoid using a database", he: "כדי לא להשתמש ב-database" } ],
      answer: 1, explain: { en: "Shared pools let a slow vendor consume all workers; isolation contains the blast radius.", he: "מאגר משותף מאפשר לספק איטי לתפוס את כל ה-workers; בידוד מכיל את ה-blast radius." } }
  ],
  related: ["pr-integration-styles", "pr-third-party-deps", "pr-auth", "pr-idempotency", "pr-multi-tenancy", "flow-checkout-payment", "flow-login-sso", "flow-tenant-onboarding", "pr-cloud-patterns"]
});

INFRA.lessons.push({
  id: "pr-error-handling",
  track: "principal",
  order: 113,
  icon: "🧯",
  level: 3,
  minutes: 17,
  title: { en: "Error Handling: Mishandling Exceptional Conditions (OWASP A10:2025)", he: "טיפול בשגיאות: Mishandling Exceptional Conditions ‏(OWASP A10:2025)" },
  tldr: {
    en: "Classify every error (transient vs permanent, caller's fault vs ours, expected vs bug), fail closed on anything security-related, never swallow, add context as it bubbles up, retry only what's transient and idempotent, clean up resources, hide internals from clients, and test the error paths on purpose.",
    he: "מסווגים כל שגיאה (חולפת מול קבועה, אשמת ה-caller מול אשמתנו, צפויה מול באג), נכשלים 'סגור' בכל מה שקשור לאבטחה, לא בולעים, מוסיפים הקשר כשהשגיאה עולה למעלה, עושים retry רק למה שחולף ואידמפוטנטי, משחררים משאבים, מסתירים פרטים פנימיים מהלקוח, ובודקים את מסלולי השגיאה בכוונה."
  },
  analogy: {
    en: "A bank vault door has a rule: if the power fails, it stays locked (fail closed). A fire exit has the opposite rule: if the power fails, it opens (fail open). Neither is 'right' in general — each door decides on purpose. Most security bugs in error handling are doors nobody decided about: an exception in the 'check permission' code that falls through to 'allow' because the catch block just logged and moved on.",
    he: "לדלת של כספת בבנק יש חוק: אם החשמל נופל, היא נשארת נעולה (fail closed). ליציאת חירום יש חוק הפוך: אם החשמל נופל, היא נפתחת (fail open). אף אחד מהם לא 'נכון' באופן כללי — כל דלת מחליטה בכוונה. רוב באגי האבטחה בטיפול בשגיאות הם דלתות שאף אחד לא החליט לגביהן: exception בקוד של 'בדוק הרשאה' שנופל ל-'אשר' כי בלוק ה-catch רק רשם ללוג והמשיך."
  },
  sections: [
    {
      h: { en: "A taxonomy that drives decisions", he: "טקסונומיה שמכתיבה החלטות" },
      body: {
        en: `<p>"Handle errors properly" means nothing until you classify them, because each class has a different correct reaction:</p>
<table>
<tr><th>Class</th><th>Examples</th><th>Reaction</th><th>HTTP</th></tr>
<tr><td>Caller error (permanent)</td><td>Invalid input, not found, not allowed</td><td>Return a clear error, don't retry, don't page anyone</td><td>400/403/404/409/422</td></tr>
<tr><td>Transient dependency</td><td>Timeout, connection reset, 503, deadlock victim, throttled</td><td>Retry with backoff + jitter if idempotent; circuit-break</td><td>503/504 + Retry-After</td></tr>
<tr><td>Permanent dependency</td><td>Auth to vendor revoked, schema mismatch</td><td>Fail fast, alert, degrade feature</td><td>502/503</td></tr>
<tr><td>Resource exhaustion</td><td>Pool empty, disk full, OOM, queue full</td><td>Shed load, fail fast, alert</td><td>503/429</td></tr>
<tr><td>Bug / invariant violated</td><td>Null deref, impossible state, assertion</td><td>Crash the request (or process), log loudly, alert</td><td>500</td></tr>
</table>
<p><strong>OWASP Top 10:2025 added A10 — Mishandling of Exceptional Conditions</strong>: failing open, leaking sensitive data in error messages, inconsistent states after a partial failure, unhandled exceptions that crash the service (DoS), and logic that silently continues after something it depended on failed.</p>
<blockquote>💡 Real world: define the taxonomy as types in your codebase (<code>ValidationError</code>, <code>NotFound</code>, <code>Conflict</code>, <code>DependencyUnavailable</code>) and map them to status codes in exactly one place — the global handler. Then every engineer gets status codes and retry semantics right for free.</blockquote>`,
        he: `<p>"לטפל בשגיאות כמו שצריך" לא אומר כלום עד שמסווגים אותן, כי לכל סוג יש תגובה נכונה אחרת:</p>
<table>
<tr><th>סוג</th><th>דוגמאות</th><th>תגובה</th><th>HTTP</th></tr>
<tr><td>שגיאת caller (קבועה)</td><td>קלט לא תקין, לא נמצא, אין הרשאה</td><td>להחזיר שגיאה ברורה, לא לעשות retry, לא להעיר אף אחד</td><td>400/403/404/409/422</td></tr>
<tr><td>תלות חולפת</td><td>Timeout, ‏connection reset, ‏503, קורבן deadlock, ‏throttled</td><td>Retry עם backoff + jitter אם אידמפוטנטי; ‏circuit breaker</td><td>503/504 + Retry-After</td></tr>
<tr><td>תלות קבועה</td><td>ה-auth מול הספק בוטל, אי-התאמה ב-schema</td><td>Fail fast, ‏alert, להוריד את הפיצ'ר בחן</td><td>502/503</td></tr>
<tr><td>מיצוי משאבים</td><td>Pool ריק, דיסק מלא, ‏OOM, תור מלא</td><td>Load shedding, ‏fail fast, ‏alert</td><td>503/429</td></tr>
<tr><td>באג / invariant שנשבר</td><td>Null deref, מצב בלתי אפשרי, assertion</td><td>להפיל את הבקשה (או את ה-process), לוג רועש, ‏alert</td><td>500</td></tr>
</table>
<p><strong>OWASP Top 10:2025 הוסיף את A10 — Mishandling of Exceptional Conditions</strong>: כשל פתוח (fail open), דליפת מידע רגיש בהודעות שגיאה, מצבים לא עקביים אחרי כשל חלקי, exceptions לא מטופלים שמפילים את השירות (DoS), ולוגיקה שממשיכה בשקט אחרי שמשהו שהיא תלויה בו נכשל.</p>
<blockquote>💡 מהשטח: מגדירים את הטקסונומיה כטיפוסים בקוד (<code>ValidationError</code>, <code>NotFound</code>, <code>Conflict</code>, <code>DependencyUnavailable</code>) וממפים אותם ל-status codes במקום אחד בלבד — ה-global handler. ככה כל מהנדס מקבל status codes וסמנטיקת retry נכונים בחינם.</blockquote>`
      }
    },
    {
      h: { en: "Fail closed, never swallow, wrap with context", he: "Fail closed, לא בולעים, עוטפים בהקשר" },
      body: {
        en: `<p>The classic fail-open bug — authorization that "allows on error":</p>
<pre># BAD: an outage of the policy service = everyone is admin
def can_delete(user, doc):
    try:
        return policy.check(user, "delete", doc)
    except Exception as e:
        log.warning("policy check failed: %s", e)
        return True        # "don't block users"

# GOOD: fail closed, surface it, alert
def can_delete(user, doc):
    try:
        return policy.check(user, "delete", doc, timeout=0.2)
    except PolicyUnavailable:
        metrics.inc("authz_unavailable")
        raise ServiceUnavailable("authorization unavailable")</pre>
<p>Rules of thumb: <strong>security decisions fail closed</strong> (authn, authz, signature checks, input validation, rate limits for expensive ops). <strong>Non-critical features fail open / degrade</strong> (recommendations, avatars, analytics). Write the choice down per dependency.</p>
<p><strong>Never swallow.</strong> An empty <code>catch {}</code> converts a loud, debuggable failure into silent data corruption. If you truly expect and ignore something, catch the <em>specific</em> type and comment why.</p>
<p><strong>Wrap with context</strong> as errors bubble up, so the log tells a story instead of "connection refused":</p>
<pre>// Go: %w keeps the cause for errors.Is / errors.As
if err := repo.Save(ctx, order); err != nil {
    return fmt.Errorf("save order %s for tenant %s: %w",
        order.ID, order.TenantID, err)
}
// later
if errors.Is(err, sql.ErrNoRows) { return NotFound }</pre>
<pre>// Java: keep the cause
catch (SQLException e) {
  throw new OrderSaveException("save order " + id, e);
}</pre>`,
        he: `<p>באג ה-fail-open הקלאסי — authorization ש"מאשרת כשיש שגיאה":</p>
<pre># BAD: an outage of the policy service = everyone is admin
def can_delete(user, doc):
    try:
        return policy.check(user, "delete", doc)
    except Exception as e:
        log.warning("policy check failed: %s", e)
        return True        # "don't block users"

# GOOD: fail closed, surface it, alert
def can_delete(user, doc):
    try:
        return policy.check(user, "delete", doc, timeout=0.2)
    except PolicyUnavailable:
        metrics.inc("authz_unavailable")
        raise ServiceUnavailable("authorization unavailable")</pre>
<p>כללי אצבע: <strong>החלטות אבטחה נכשלות סגור</strong> (authn, ‏authz, בדיקות חתימה, ולידציה של קלט, rate limits לפעולות יקרות). <strong>פיצ'רים לא קריטיים נכשלים פתוח / יורדים בחן</strong> (המלצות, תמונות פרופיל, אנליטיקה). כותבים את הבחירה לכל תלות.</p>
<p><strong>לא בולעים.</strong> ‏<code>catch {}</code> ריק הופך כשל רועש שאפשר לדבג להשחתת מידע שקטה. אם באמת מצפים למשהו ומתעלמים ממנו, תופסים את הטיפוס ה<em>ספציפי</em> וכותבים הערה למה.</p>
<p><strong>עוטפים בהקשר</strong> כשהשגיאה עולה למעלה, כדי שהלוג יספר סיפור ולא רק "connection refused":</p>
<pre>// Go: %w keeps the cause for errors.Is / errors.As
if err := repo.Save(ctx, order); err != nil {
    return fmt.Errorf("save order %s for tenant %s: %w",
        order.ID, order.TenantID, err)
}
// later
if errors.Is(err, sql.ErrNoRows) { return NotFound }</pre>
<pre>// Java: keep the cause
catch (SQLException e) {
  throw new OrderSaveException("save order " + id, e);
}</pre>`
      }
    },
    {
      h: { en: "Exceptions vs result types, cleanup and timeouts", he: "Exceptions מול result types, שחרור משאבים ו-timeouts" },
      body: {
        en: `<p>Two families of error models:</p>
<ul>
<li><strong>Exceptions</strong> (Java, C#, Python, JS): errors jump up the stack invisibly. Easy to write, easy to forget what can throw.</li>
<li><strong>Errors as values</strong> (Go <code>err</code>, Rust <code>Result&lt;T, E&gt;</code>, functional <code>Either</code>): the signature says it can fail and the compiler/linter nags you to handle it.</li>
</ul>
<pre>// Rust: the ? operator propagates, the type documents failure
fn load_cfg(p: &amp;str) -&gt; Result&lt;Config, CfgError&gt; {
    let raw = std::fs::read_to_string(p)?;
    let cfg: Config = toml::from_str(&amp;raw)?;
    cfg.validate()?;
    Ok(cfg)
}</pre>
<p>A good middle ground in exception languages: exceptions for bugs and infrastructure failures, <em>return values</em> (<code>Optional</code>, a Result type, or a sealed union) for expected business outcomes like "insufficient funds".</p>
<p><strong>Always release resources</strong>, on success <em>and</em> failure — leaked connections are how a 1% error rate becomes a full outage when the pool drains:</p>
<pre>with pool.connection() as conn:        # Python
using var conn = await ds.OpenAsync(); // C#
try (var conn = ds.getConnection()) {} // Java
defer rows.Close()                     // Go</pre>
<p><strong>Timeouts everywhere</strong>: every network call, DB query (<code>statement_timeout</code>), lock wait (<code>lock_timeout</code>) and queue receive has an explicit deadline, and deadlines propagate (gRPC deadline, <code>context.Context</code>, <code>AbortSignal</code>). A missing timeout turns a slow dependency into hung threads, then an exhausted pool, then your outage.</p>
<p><strong>Retries</strong> only for transient + idempotent operations, with exponential backoff, jitter, a cap on attempts and a retry budget (≈10% extra load max) — see <a href="#/lesson/pr-idempotency">idempotency</a> and <a href="#/lesson/staff-overload-metastable">retry storms</a>.</p>`,
        he: `<p>שתי משפחות של מודלי שגיאה:</p>
<ul>
<li><strong>Exceptions</strong> ‏(Java, ‏C#, ‏Python, ‏JS): שגיאות קופצות במעלה ה-stack בצורה בלתי נראית. קל לכתוב, קל לשכוח מה יכול לזרוק.</li>
<li><strong>שגיאות כערכים</strong> ‏(Go ‏<code>err</code>, ‏Rust ‏<code>Result&lt;T, E&gt;</code>, ‏<code>Either</code> פונקציונלי): החתימה אומרת שזה יכול להיכשל וה-compiler/linter מציק לך לטפל.</li>
</ul>
<pre>// Rust: the ? operator propagates, the type documents failure
fn load_cfg(p: &amp;str) -&gt; Result&lt;Config, CfgError&gt; {
    let raw = std::fs::read_to_string(p)?;
    let cfg: Config = toml::from_str(&amp;raw)?;
    cfg.validate()?;
    Ok(cfg)
}</pre>
<p>דרך ביניים טובה בשפות עם exceptions: exceptions לבאגים ולכשלי תשתית, <em>ערכי החזרה</em> ‏(<code>Optional</code>, טיפוס Result או sealed union) לתוצאות עסקיות צפויות כמו "אין מספיק יתרה".</p>
<p><strong>תמיד משחררים משאבים</strong>, בהצלחה <em>וגם</em> בכישלון — connections שדולפים זה איך ש-1% שגיאות הופך ל-outage מלא כשה-pool מתרוקן:</p>
<pre>with pool.connection() as conn:        # Python
using var conn = await ds.OpenAsync(); // C#
try (var conn = ds.getConnection()) {} // Java
defer rows.Close()                     // Go</pre>
<p><strong>Timeouts בכל מקום</strong>: לכל קריאת רשת, query ל-DB ‏(<code>statement_timeout</code>), המתנה לנעילה (<code>lock_timeout</code>) וקבלה מתור יש deadline מפורש, וה-deadlines מועברים הלאה (gRPC deadline, ‏<code>context.Context</code>, ‏<code>AbortSignal</code>). Timeout חסר הופך תלות איטית ל-threads תקועים, ואז ל-pool מרוקן, ואז ל-outage שלך.</p>
<p><strong>Retries</strong> רק לפעולות חולפות + אידמפוטנטיות, עם exponential backoff, ‏jitter, תקרה למספר ניסיונות ו-retry budget (בערך 10% עומס נוסף לכל היותר) — ראה <a href="#/lesson/pr-idempotency">אידמפוטנטיות</a> ו-<a href="#/lesson/staff-overload-metastable">retry storms</a>.</p>`
      }
    },
    {
      h: { en: "Global handlers, crash-only design and let-it-crash", he: "Global handlers, ‏crash-only design ו-let-it-crash" },
      body: {
        en: `<p>Every process needs a <strong>last line of defense</strong> that turns any unexpected error into: one structured log with stack trace and trace ID, a metric increment, and a generic response for the client — no stack trace, SQL, file paths or library versions in the body.</p>
<pre>// Express: the global error handler (4 args)
app.use((err, req, res, next) =&gt; {
  const status = err.status ?? 500;
  log.error({ err, traceId: req.traceId, path: req.path });
  res.status(status).type("application/problem+json").json({
    type: status === 500 ? "about:blank" : err.type,
    title: status === 500 ? "Internal error" : err.message,
    status, traceId: req.traceId });
});
process.on("unhandledRejection", (e) =&gt; {
  log.fatal({ err: e }, "unhandled rejection");
  process.exit(1);   // let the orchestrator restart us
});</pre>
<p>Background work is where errors disappear: a panic in a goroutine without <code>recover</code> kills the whole Go process; an unhandled promise rejection in Node (≥ 15) exits the process; an exception in a Java <code>ExecutorService</code> task is silently stored in a <code>Future</code> nobody reads. Wrap worker loops so one bad message is logged and dead-lettered, not fatal — and not silently lost.</p>
<p><strong>Crash-only design / let it crash</strong> (Erlang/OTP): instead of trying to recover from every weird state in-process, crash quickly and let a <em>supervisor</em> restart from a known-good state. Kubernetes is a supervisor: liveness probes + <code>restartPolicy</code> restart the container. This only works if startup is fast and idempotent, state lives outside the process, and in-flight work is retried (queues with visibility timeouts). Watch for <code>CrashLoopBackOff</code> — a crash that repeats isn't recovery, it's an outage with extra steps.</p>
<blockquote>⚠️ Production tip: page on error <em>rates</em> and burn rates (5xx ratio vs SLO), not on individual exceptions. Track "unhandled exceptions per release" as a quality metric — a new exception type appearing after a deploy is a strong rollback signal.</blockquote>`,
        he: `<p>כל process צריך <strong>קו הגנה אחרון</strong> שהופך כל שגיאה לא צפויה ל: לוג מובנה אחד עם stack trace ו-trace ID, הגדלה של metric, ותשובה גנרית ללקוח — בלי stack trace, ‏SQL, נתיבי קבצים או גרסאות ספריות ב-body.</p>
<pre>// Express: the global error handler (4 args)
app.use((err, req, res, next) =&gt; {
  const status = err.status ?? 500;
  log.error({ err, traceId: req.traceId, path: req.path });
  res.status(status).type("application/problem+json").json({
    type: status === 500 ? "about:blank" : err.type,
    title: status === 500 ? "Internal error" : err.message,
    status, traceId: req.traceId });
});
process.on("unhandledRejection", (e) =&gt; {
  log.fatal({ err: e }, "unhandled rejection");
  process.exit(1);   // let the orchestrator restart us
});</pre>
<p>עבודת רקע היא המקום שבו שגיאות נעלמות: panic ב-goroutine בלי <code>recover</code> הורג את כל ה-process של Go; ‏unhandled promise rejection ב-Node ‏(≥ 15) מסיים את ה-process; ‏exception ב-task של <code>ExecutorService</code> ב-Java נשמר בשקט ב-<code>Future</code> שאף אחד לא קורא. עוטפים לולאות של workers כך שהודעה רעה אחת נרשמת ונשלחת ל-dead letter, לא הורגת — וגם לא נאבדת בשקט.</p>
<p><strong>Crash-only design / let it crash</strong> ‏(Erlang/OTP): במקום לנסות להתאושש בתוך ה-process מכל מצב מוזר, קורסים מהר ונותנים ל-<em>supervisor</em> להפעיל מחדש ממצב ידוע וטוב. Kubernetes הוא supervisor: ‏liveness probes + ‏<code>restartPolicy</code> מפעילים את הקונטיינר מחדש. זה עובד רק אם העלייה מהירה ואידמפוטנטית, ה-state חי מחוץ ל-process, ועבודה שהייתה באמצע מקבלת retry (תורים עם visibility timeouts). שימו לב ל-<code>CrashLoopBackOff</code> — קריסה שחוזרת על עצמה זה לא התאוששות, זה outage עם צעדים נוספים.</p>
<blockquote>⚠️ טיפ לפרודקשן: מעירים on-call על <em>שיעורי</em> שגיאה ו-burn rates ‏(יחס 5xx מול ה-SLO), לא על exceptions בודדים. עוקבים אחרי "unhandled exceptions לכל release" כ-metric של איכות — טיפוס exception חדש שמופיע אחרי deploy הוא סימן חזק ל-rollback.</blockquote>`
      }
    },
    {
      h: { en: "Partial failure and testing the error paths", he: "כשל חלקי ובדיקת מסלולי השגיאה" },
      body: {
        en: `<p>The nastiest A10 bugs are <strong>inconsistent state after a partial failure</strong>: the charge succeeded, the DB write failed; the file was uploaded, the metadata wasn't; 3 of 5 items were reserved. Defenses: keep each step's side effect in one local transaction, publish events via an <a href="#/lesson/arch-event-driven">outbox</a>, model multi-step work as a saga with compensations, and run reconcilers that detect and repair drift.</p>
<p>Error paths are the least-tested code you own — and the code that runs during incidents. Test them deliberately:</p>
<ul>
<li><strong>Unit</strong>: mocks/fakes that throw (<code>side_effect=TimeoutError</code>) — assert the exact status, the retry count, that no partial write happened, that the authz check failed closed.</li>
<li><strong>Integration</strong>: Toxiproxy between service and DB/Redis to inject latency, resets and bandwidth limits; testcontainers that you <code>pause()</code> mid-test.</li>
<li><strong>System</strong>: fault injection in the mesh (Istio <code>fault.abort</code>/<code>fault.delay</code>), chaos experiments (kill pods, drop a zone) with a hypothesis and abort conditions.</li>
</ul>
<pre># pytest: authz must fail closed when the policy service is down
def test_delete_denied_when_policy_unavailable(client, policy):
    policy.check.side_effect = PolicyUnavailable()
    r = client.delete("/docs/42", headers=USER)
    assert r.status_code == 503
    assert docs_repo.exists("42")      # nothing was deleted</pre>
<pre># Istio: 10% of calls to payments return 503 (staging)
http:
- fault:
    abort: { percentage: { value: 10 }, httpStatus: 503 }
  route: [ { destination: { host: payments } } ]</pre>`,
        he: `<p>באגי A10 הכי מגעילים הם <strong>state לא עקבי אחרי כשל חלקי</strong>: החיוב הצליח, הכתיבה ל-DB נכשלה; הקובץ עלה, ה-metadata לא; ‏3 מתוך 5 פריטים נשמרו. ההגנות: מחזיקים את ה-side effect של כל שלב בטרנזקציה מקומית אחת, מפרסמים events דרך <a href="#/lesson/arch-event-driven">outbox</a>, ממדלים עבודה רב-שלבית כ-saga עם compensations, ומריצים reconcilers שמזהים ומתקנים drift.</p>
<p>מסלולי שגיאה הם הקוד הכי פחות בדוק שלך — והקוד שרץ בזמן תקלות. בודקים אותם בכוונה:</p>
<ul>
<li><strong>Unit</strong>: mocks/fakes שזורקים (<code>side_effect=TimeoutError</code>) — בודקים את ה-status המדויק, מספר ה-retries, שלא קרתה כתיבה חלקית, ושבדיקת ה-authz נכשלה סגור.</li>
<li><strong>Integration</strong>: ‏Toxiproxy בין השירות ל-DB/Redis כדי להזריק latency, ‏resets והגבלת רוחב פס; ‏testcontainers שעושים להם <code>pause()</code> באמצע הבדיקה.</li>
<li><strong>System</strong>: הזרקת תקלות ב-mesh ‏(Istio ‏<code>fault.abort</code>/<code>fault.delay</code>), ניסויי chaos (להרוג pods, להפיל zone) עם השערה ותנאי עצירה.</li>
</ul>
<pre># pytest: authz must fail closed when the policy service is down
def test_delete_denied_when_policy_unavailable(client, policy):
    policy.check.side_effect = PolicyUnavailable()
    r = client.delete("/docs/42", headers=USER)
    assert r.status_code == 503
    assert docs_repo.exists("42")      # nothing was deleted</pre>
<pre># Istio: 10% of calls to payments return 503 (staging)
http:
- fault:
    abort: { percentage: { value: 10 }, httpStatus: 503 }
  route: [ { destination: { host: payments } } ]</pre>`
      }
    }
  ],
  diagram: `             error happens
                   |
        +----------+-----------+-------------+-------------+
        |          |           |             |             |
     caller     transient   permanent    exhausted       bug
     4xx        dependency  dependency   resources    invariant
     no retry   retry+jitter fail fast    shed load    500 + crash
                if idempotent alert        503/429      supervisor
                circuit-break degrade                   restarts
        |
  security check failed?  ->  FAIL CLOSED (deny / 503), never allow
        |
  global handler: log(stack, traceId) + metric + generic problem+json`,
  handsOn: [
    { cmd: "node -e \"Promise.reject(new Error('boom')); setTimeout(()=>console.log('still alive?'),100)\"; echo exit=$?", what: { en: "See that an unhandled promise rejection kills a modern Node process (exit code 1) — 'still alive?' never prints.", he: "רואים ש-unhandled promise rejection הורג process מודרני של Node ‏(exit code 1) — 'still alive?' לא מודפס אף פעם." } },
    { cmd: "toxiproxy-cli toxic add -t latency -a latency=3000 pg_proxy", what: { en: "Inject 3 s of latency between your service and Postgres; check that timeouts fire, the pool doesn't drain and the API returns 503, not a hang.", he: "מזריקים 3 שניות latency בין השירות ל-Postgres; בודקים שה-timeouts קופצים, ה-pool לא מתרוקן וה-API מחזיר 503 ולא נתקע." } },
    { cmd: "grep -rnE \"except( Exception)?:\\s*(pass|$)|catch *\\([^)]*\\) *\\{ *\\}\" --include=*.py --include=*.js --include=*.ts src/", what: { en: "Hunt for swallowed errors: bare except/pass and empty catch blocks.", he: "מחפשים שגיאות שנבלעות: except ריק עם pass ובלוקי catch ריקים." } },
    { cmd: "psql -c \"SET statement_timeout = '2s'; SELECT pg_sleep(5);\"", what: { en: "See a DB-side timeout fire (ERROR: canceling statement due to statement timeout) — set one per role/app in production.", he: "רואים timeout בצד ה-DB קופץ (ERROR: canceling statement due to statement timeout) — מגדירים כזה לכל role/אפליקציה בפרודקשן." } }
  ],
  mnemonic: {
    en: "C-L-O-S-E: Classify, Log with context, Open only for non-critical (security fails closed), Shut resources (finally/defer), Expose nothing internal. And: test the sad path like the happy one.",
    he: "C-L-O-S-E: ‏Classify (לסווג), ‏Log עם הקשר, ‏Open רק ללא-קריטי (אבטחה נכשלת סגור), ‏Shut משאבים (finally/defer), ‏Expose כלום פנימי. ובנוסף: בודקים את המסלול העצוב כמו את השמח."
  },
  pitfalls: [
    { en: "Fail-open security: catch blocks that return true/allow when the auth, policy or signature service errors out.", he: "אבטחה שנכשלת פתוח: בלוקי catch שמחזירים true/allow כששירות ה-auth, ה-policy או החתימות נכשל." },
    { en: "Retrying everything: retrying 400s and 403s wastes capacity, and retrying non-idempotent POSTs double-charges customers.", he: "Retry על הכול: ‏retry על 400 ו-403 מבזבז קיבולת, ו-retry על POSTs לא אידמפוטנטיים מחייב לקוחות פעמיים." },
    { en: "Leaking internals in error responses: stack traces, SQL, internal hostnames and library versions are reconnaissance for attackers.", he: "דליפת פרטים פנימיים בתשובות שגיאה: stack traces, ‏SQL, ‏hostnames פנימיים וגרסאות ספריות הם מודיעין לתוקפים." },
    { en: "Errors lost in background work: exceptions inside executors, goroutines or fire-and-forget promises that nobody observes.", he: "שגיאות שנאבדות בעבודת רקע: exceptions בתוך executors, ‏goroutines או promises של fire-and-forget שאף אחד לא מסתכל עליהם." }
  ],
  interview: [
    { q: { en: "How do you decide whether a dependency failure should fail open or closed?", he: "איך מחליטים אם כשל של תלות צריך להיכשל פתוח או סגור?" },
      a: { en: "Ask what's worse: wrongly allowing or wrongly denying. Anything that protects security, money or data integrity (authn, authz, payment verification, fraud checks on high-value actions, quota on expensive operations) fails closed — return 503 and alert. Features that only enrich the experience (recommendations, personalization, analytics) fail open with a fallback. Some cases are tiered: a fraud check may fail open for small amounts and closed above a threshold. Document the choice per dependency in the design doc and test it.", he: "שואלים מה יותר גרוע: לאשר בטעות או לדחות בטעות. כל מה שמגן על אבטחה, כסף או שלמות מידע (authn, ‏authz, אימות תשלום, בדיקות fraud לפעולות בעלות ערך גבוה, quota על פעולות יקרות) נכשל סגור — מחזירים 503 ומתריעים. פיצ'רים שרק מעשירים את החוויה (המלצות, פרסונליזציה, אנליטיקה) נכשלים פתוח עם fallback. יש מקרים מדורגים: בדיקת fraud יכולה להיכשל פתוח לסכומים קטנים וסגור מעל סף. מתעדים את הבחירה לכל תלות במסמך ה-design ובודקים אותה." } },
    { q: { en: "A service shows rare 500s that nobody can reproduce. How do you approach it?", he: "שירות מראה 500 נדירים שאף אחד לא מצליח לשחזר. איך ניגשים?" },
      a: { en: "First make errors observable: global handler logging the full cause chain with trace IDs, error type and route as metric labels, and sampling traces for failed requests. Group by exception type and endpoint, correlate with deploys, dependency latency and specific tenants/inputs. Look for timeouts and pool exhaustion masquerading as 500s (they should be 503/504), and for swallowed or re-wrapped errors losing the cause. Then reproduce with fault injection (Toxiproxy, mesh faults) and add a regression test on that error path.", he: "קודם הופכים שגיאות לנצפות: global handler שרושם את כל שרשרת הסיבות עם trace IDs, סוג ה-exception וה-route כ-labels ב-metric, ו-sampling של traces לבקשות שנכשלו. מקבצים לפי סוג exception ו-endpoint, מצליבים עם deploys, ‏latency של תלויות ו-tenants/קלטים ספציפיים. מחפשים timeouts ומיצוי pool שמתחפשים ל-500 (הם אמורים להיות 503/504), ושגיאות שנבלעו או נעטפו מחדש ואיבדו את הסיבה. אז משחזרים עם הזרקת תקלות (Toxiproxy, תקלות ב-mesh) ומוסיפים בדיקת רגרסיה על מסלול השגיאה." } }
  ],
  quiz: [
    { q: { en: "The authorization service times out. What should the API do for a 'delete document' request?", he: "שירות ה-authorization עושה timeout. מה ה-API צריך לעשות לבקשת 'מחק מסמך'?" },
      options: [ { en: "Allow it, to avoid blocking users", he: "לאשר, כדי לא לחסום משתמשים" }, { en: "Fail closed: deny with 503 and alert", he: "להיכשל סגור: לדחות עם 503 ולהתריע" }, { en: "Retry forever", he: "לנסות שוב לנצח" }, { en: "Return 200 with an error flag", he: "להחזיר 200 עם דגל שגיאה" } ],
      answer: 1, explain: { en: "Security decisions fail closed; availability of authz is something you engineer and alert on, not bypass.", he: "החלטות אבטחה נכשלות סגור; את הזמינות של ה-authz מהנדסים ומתריעים עליה, לא עוקפים." } },
    { q: { en: "Which errors are good candidates for automatic retry?", he: "אילו שגיאות מתאימות ל-retry אוטומטי?" },
      options: [ { en: "422 validation errors", he: "שגיאות ולידציה 422" }, { en: "Transient ones (timeouts, 503, deadlock victim) on idempotent operations", he: "חולפות (timeouts, ‏503, קורבן deadlock) על פעולות אידמפוטנטיות" }, { en: "403 Forbidden", he: "403 Forbidden" }, { en: "Every 500 on any POST", he: "כל 500 על כל POST" } ],
      answer: 1, explain: { en: "Permanent errors will fail again; non-idempotent retries cause duplicates.", he: "שגיאות קבועות ייכשלו שוב; ‏retry לא אידמפוטנטי יוצר כפילויות." } },
    { q: { en: "What should a 500 response body contain?", he: "מה צריך להיות ב-body של תשובת 500?" },
      options: [ { en: "The full stack trace for easier debugging", he: "את כל ה-stack trace כדי שיהיה קל לדבג" }, { en: "A generic message plus a trace ID; details go to server logs", he: "הודעה גנרית ועוד trace ID; הפרטים הולכים ללוגים בשרת" }, { en: "The SQL query that failed", he: "את ה-SQL שנכשל" }, { en: "Nothing, an empty 200", he: "כלום, ‏200 ריק" } ],
      answer: 1, explain: { en: "The trace ID lets support find the logs without leaking internals to attackers.", he: "ה-trace ID מאפשר לתמיכה למצוא את הלוגים בלי לדלוף פרטים פנימיים לתוקפים." } },
    { q: { en: "'Let it crash' works well only when…", he: "'Let it crash' עובד טוב רק כש…" },
      options: [ { en: "The process holds important state in memory", he: "ה-process מחזיק state חשוב בזיכרון" }, { en: "A supervisor restarts quickly, startup is idempotent, and state/in-flight work lives outside the process", he: "Supervisor מפעיל מחדש מהר, העלייה אידמפוטנטית, וה-state והעבודה שבאמצע חיים מחוץ ל-process" }, { en: "There are no health checks", he: "אין health checks" }, { en: "Errors are swallowed", he: "שגיאות נבלעות" } ],
      answer: 1, explain: { en: "Crash-only design relies on fast, safe restarts and externalized state; otherwise crashes lose work or loop.", he: "Crash-only design נשען על הפעלה מחדש מהירה ובטוחה ועל state חיצוני; אחרת קריסות מאבדות עבודה או נכנסות ללולאה." } }
  ],
  related: ["pr-owasp-2025", "pr-idempotency", "pr-third-party-deps", "pr-input-validation", "pr-api-design", "staff-overload-metastable", "rel-chaos-engineering", "pr-unit-testing-craft"]
});

INFRA.glossary.push(
  { term: "Problem Details (RFC 9457)", track: "principal", lesson: "pr-input-validation",
    def: { en: "Standard JSON error envelope (application/problem+json) with type, title, status, detail and instance; successor of RFC 7807.", he: "מעטפת שגיאה סטנדרטית ב-JSON ‏(application/problem+json) עם type, ‏title, ‏status, ‏detail ו-instance; היורש של RFC 7807." } },
  { term: "Parse, don't validate", track: "principal", lesson: "pr-input-validation",
    def: { en: "Convert untrusted input at the boundary into a typed value that can only hold valid data, instead of checking it and passing the raw value on.", he: "להמיר קלט לא-אמין בגבול לערך typed שיכול להחזיק רק מידע תקין, במקום לבדוק אותו ולהעביר את הערך הגולמי הלאה." } },
  { term: "Canonicalization", track: "principal", lesson: "pr-input-validation",
    def: { en: "Reducing input to its single standard form (decoded, normalized Unicode, resolved path) before validating it, so alternate spellings can't bypass checks.", he: "הבאת קלט לצורה הסטנדרטית היחידה שלו (אחרי decode, ‏Unicode מנורמל, path אחרי resolve) לפני הוולידציה, כדי שאיותים חלופיים לא יעקפו בדיקות." } },
  { term: "ReDoS", track: "principal", lesson: "pr-input-validation",
    def: { en: "Regular-expression denial of service: a backtracking regex takes exponential time on a crafted input, pinning CPU.", he: "Regular-expression denial of service: ‏regex עם backtracking לוקח זמן אקספוננציאלי על קלט מתוכנן ותוקע את ה-CPU." } },
  { term: "ETag / If-Match", track: "principal", lesson: "pr-api-design",
    def: { en: "A version tag returned with a resource; sending it back in If-Match makes an update conditional (412 if someone changed it) — optimistic concurrency over HTTP.", he: "תג גרסה שחוזר עם resource; שליחתו חזרה ב-If-Match הופכת עדכון למותנה (412 אם מישהו שינה בינתיים) — optimistic concurrency מעל HTTP." } },
  { term: "Sunset header", track: "principal", lesson: "pr-api-design",
    def: { en: "HTTP response header (RFC 8594) announcing the date an endpoint will stop working; paired with the Deprecation header.", he: "Header בתשובת HTTP ‏(RFC 8594) שמכריז על התאריך שבו endpoint יפסיק לעבוד; הולך יחד עם header ה-Deprecation." } },
  { term: "SCIM", track: "principal", lesson: "pr-enterprise-integrations",
    def: { en: "System for Cross-domain Identity Management (RFC 7643/7644): a REST standard IdPs use to create, update and deactivate users and groups in your app.", he: "System for Cross-domain Identity Management ‏(RFC 7643/7644): תקן REST ש-IdPs משתמשים בו כדי ליצור, לעדכן ולבטל משתמשים וקבוצות באפליקציה שלך." } },
  { term: "SAML", track: "principal", lesson: "pr-enterprise-integrations",
    def: { en: "XML-based SSO standard where the identity provider sends a signed assertion about the user to the service provider; still the most common enterprise SSO.", he: "תקן SSO מבוסס XML שבו ה-identity provider שולח assertion חתום על המשתמש ל-service provider; עדיין ה-SSO הכי נפוץ ב-Enterprise." } },
  { term: "Fail closed", track: "principal", lesson: "pr-error-handling",
    def: { en: "On error, deny or stop rather than allow (the opposite of fail open). Required for security decisions such as authentication and authorization.", he: "בשגיאה — לדחות או לעצור ולא לאשר (ההפך מ-fail open). חובה בהחלטות אבטחה כמו authentication ו-authorization." } },
  { term: "Let it crash", track: "principal", lesson: "pr-error-handling",
    def: { en: "Erlang/OTP philosophy: don't defensively recover from every bad state in-process; crash fast and let a supervisor restart from a known-good state.", he: "הפילוסופיה של Erlang/OTP: לא מנסים להתאושש בתוך ה-process מכל מצב רע; קורסים מהר ונותנים ל-supervisor להפעיל מחדש ממצב ידוע וטוב." } }
);
