/* Principal track: Domain-Driven Design and the architecture styles catalog. */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

INFRA.lessons.push({
  id: "pr-ddd",
  track: "principal",
  order: 120,
  icon: "🧩",
  level: 3,
  minutes: 18,
  title: { en: "Domain-Driven Design: Drawing Service Boundaries That Last", he: "Domain-Driven Design: לצייר גבולות שירות שמחזיקים מעמד" },
  tldr: {
    en: "Split the system where the language and the rules change, not where the database tables are: bounded contexts become modules or services, aggregates guard invariants in one transaction, and everything else talks through events and explicit contracts.",
    he: "מפצלים את המערכת איפה שהשפה והחוקים משתנים, לא איפה שהטבלאות נגמרות: bounded contexts הופכים למודולים או שירותים, aggregates שומרים על invariants בטרנזקציה אחת, וכל השאר מדבר דרך events וחוזים מפורשים."
  },
  analogy: {
    en: "A hospital uses the word 'patient' everywhere, but it means different things: at reception it's a name, ID and insurance; in surgery it's blood type, allergies and a procedure; in billing it's a payer and a list of charges. If you build one giant Patient object for all three, every department fights over it. DDD says: let each department (bounded context) own its own model of 'patient', translate at the doors, and agree on a few announcements ('patient admitted', 'patient discharged') that everyone can react to.",
    he: "בבית חולים משתמשים במילה 'מטופל' בכל מקום, אבל היא אומרת דברים שונים: בקבלה זה שם, ת.ז וביטוח; בחדר ניתוח זה סוג דם, אלרגיות ופרוצדורה; בהנהלת חשבונות זה משלם ורשימת חיובים. אם בונים אובייקט Patient ענק אחד לשלושתם, כל מחלקה נלחמת עליו. DDD אומר: תן לכל מחלקה (bounded context) מודל משלה של 'מטופל', תתרגם בדלתות, ותסכים על כמה הודעות ('מטופל התקבל', 'מטופל שוחרר') שכולם יכולים להגיב אליהן."
  },
  sections: [
    {
      h: { en: "Ubiquitous language and subdomains", he: "Ubiquitous language ו-subdomains" },
      body: {
        en: `<p><strong>Ubiquitous language</strong>: inside one context, developers and domain experts use the <em>same</em> words, and those words appear in the code. If the business says "a booking is <em>confirmed</em> once the deposit clears", the code has <code>booking.confirm()</code> and a <code>BookingConfirmed</code> event, not <code>updateStatus(3)</code>.</p>
<p>Then classify the business into <strong>subdomains</strong>, because they deserve different investment:</p>
<table>
<tr><th>Subdomain</th><th>What it is</th><th>Example (online travel)</th><th>Strategy</th></tr>
<tr><td><strong>Core</strong></td><td>What makes you win</td><td>Pricing &amp; availability engine</td><td>Best engineers, rich model, build in-house</td></tr>
<tr><td><strong>Supporting</strong></td><td>Needed, specific to you, not a differentiator</td><td>Partner onboarding, reviews moderation</td><td>Build simply, CRUD is fine</td></tr>
<tr><td><strong>Generic</strong></td><td>Solved problem</td><td>Auth, payments, email, invoicing</td><td>Buy / SaaS (Auth0, Stripe, SES)</td></tr>
</table>
<blockquote>💡 Real world: the most common principal-level mistake is gold-plating a generic subdomain (a home-grown auth system) while the core domain is a pile of CRUD endpoints. DDD's first gift is telling you where <em>not</em> to spend effort.</blockquote>`,
        he: `<p><strong>Ubiquitous language</strong>: בתוך context אחד, המפתחים ואנשי הדומיין משתמשים <em>באותן</em> מילים, והמילים האלה מופיעות בקוד. אם הביזנס אומר "הזמנה <em>מאושרת</em> ברגע שהמקדמה עוברת", בקוד יש <code>booking.confirm()</code> ו-event בשם <code>BookingConfirmed</code>, לא <code>updateStatus(3)</code>.</p>
<p>אחר כך מסווגים את הביזנס ל-<strong>subdomains</strong>, כי כל אחד מצדיק השקעה אחרת:</p>
<table>
<tr><th>Subdomain</th><th>מה זה</th><th>דוגמה (אתר תיירות)</th><th>אסטרטגיה</th></tr>
<tr><td><strong>Core</strong></td><td>מה שגורם לך לנצח</td><td>מנוע תמחור וזמינות</td><td>המהנדסים הכי טובים, מודל עשיר, בונים בבית</td></tr>
<tr><td><strong>Supporting</strong></td><td>נחוץ וייחודי לך, אבל לא מבדל</td><td>קליטת שותפים, מודרציה של ביקורות</td><td>לבנות פשוט, CRUD זה בסדר</td></tr>
<tr><td><strong>Generic</strong></td><td>בעיה פתורה</td><td>Auth, תשלומים, מייל, חשבוניות</td><td>לקנות / SaaS (Auth0, Stripe, SES)</td></tr>
</table>
<blockquote>💡 מהשטח: הטעות הכי נפוצה ברמת Principal היא להשקיע בטירוף ב-subdomain גנרי (מערכת auth שבנית לבד) בזמן שה-core domain הוא ערימה של CRUD endpoints. המתנה הראשונה של DDD היא להגיד לך איפה <em>לא</em> להשקיע.</blockquote>`
      }
    },
    {
      h: { en: "Bounded contexts and context mapping", he: "Bounded contexts ו-context mapping" },
      body: {
        en: `<p>A <strong>bounded context</strong> is a boundary inside which a model and its language are consistent. "Product" in <em>Catalog</em> (title, images, SEO) is a different model from "Product" in <em>Inventory</em> (SKU, warehouse, quantity) and in <em>Pricing</em> (base price, rules). Same ID, different models — and that's correct.</p>
<p>A <strong>context map</strong> documents how contexts relate. The patterns are really about <em>team power and coupling</em>:</p>
<table>
<tr><th>Pattern</th><th>Meaning</th><th>Use when</th></tr>
<tr><td>Shared kernel</td><td>Two teams share a small model/library</td><td>Tight collaboration, same release rhythm</td></tr>
<tr><td>Customer–supplier</td><td>Downstream's needs shape upstream's API</td><td>Upstream team will prioritize you</td></tr>
<tr><td>Conformist</td><td>Downstream just accepts upstream's model</td><td>No leverage (big vendor, other org)</td></tr>
<tr><td>Anti-corruption layer</td><td>Translate the foreign model at the border</td><td>Legacy or messy upstream must not leak in</td></tr>
<tr><td>Open host + published language</td><td>A stable public API/schema for many consumers</td><td>One upstream, many downstreams</td></tr>
<tr><td>Separate ways</td><td>No integration at all</td><td>Cost of integration &gt; value</td></tr>
</table>
<pre>[Catalog] --published language (ProductPublished v2)--&gt; [Search]
[Ordering] --customer/supplier--&gt; [Pricing]
[Ordering] --ACL--&gt; [Legacy ERP]   (translate SAP IDocs -&gt; Order)
[Billing]  --conformist--&gt; [Stripe]</pre>
<blockquote>⚠️ Production tip: draw the context map before drawing services. If two contexts need a synchronous call for every request and share half their fields, they are probably one context split too early.</blockquote>`,
        he: `<p><strong>Bounded context</strong> הוא גבול שבתוכו המודל והשפה עקביים. "מוצר" ב-<em>Catalog</em> (כותרת, תמונות, SEO) הוא מודל שונה מ"מוצר" ב-<em>Inventory</em> (SKU, מחסן, כמות) וב-<em>Pricing</em> (מחיר בסיס, חוקים). אותו ID, מודלים שונים — וזה נכון.</p>
<p><strong>Context map</strong> מתעד איך ה-contexts קשורים. הדפוסים הם בעצם על <em>כוח בין צוותים וצימוד</em>:</p>
<table>
<tr><th>דפוס</th><th>משמעות</th><th>מתי</th></tr>
<tr><td>Shared kernel</td><td>שני צוותים חולקים מודל/ספרייה קטנים</td><td>שיתוף פעולה הדוק, אותו קצב releases</td></tr>
<tr><td>Customer–supplier</td><td>הצרכים של ה-downstream מעצבים את ה-API של ה-upstream</td><td>צוות ה-upstream ייתן לך עדיפות</td></tr>
<tr><td>Conformist</td><td>ה-downstream פשוט מקבל את המודל של ה-upstream</td><td>אין לך מנוף (vendor גדול, ארגון אחר)</td></tr>
<tr><td>Anti-corruption layer</td><td>מתרגמים את המודל הזר בגבול</td><td>Legacy או upstream מבולגן שאסור שיחלחל פנימה</td></tr>
<tr><td>Open host + published language</td><td>API/schema ציבורי ויציב להרבה צרכנים</td><td>Upstream אחד, הרבה downstreams</td></tr>
<tr><td>Separate ways</td><td>בלי אינטגרציה בכלל</td><td>העלות של אינטגרציה גדולה מהערך</td></tr>
</table>
<pre>[Catalog] --published language (ProductPublished v2)--&gt; [Search]
[Ordering] --customer/supplier--&gt; [Pricing]
[Ordering] --ACL--&gt; [Legacy ERP]   (translate SAP IDocs -&gt; Order)
[Billing]  --conformist--&gt; [Stripe]</pre>
<blockquote>⚠️ טיפ לפרודקשן: תצייר את ה-context map לפני שאתה מצייר שירותים. אם שני contexts צריכים קריאה סינכרונית בכל בקשה וחולקים חצי מהשדות, כנראה שזה context אחד שפוצל מוקדם מדי.</blockquote>`
      }
    },
    {
      h: { en: "Aggregates, entities and value objects", he: "Aggregates, entities ו-value objects" },
      body: {
        en: `<p>An <strong>aggregate</strong> is a cluster of objects changed together in <em>one transaction</em>, with one <strong>root</strong> that enforces the invariants. Outside code may only hold a reference to the root (by ID), never to inner parts.</p>
<pre>class Order {                       // aggregate root
  private lines: OrderLine[] = [];
  private status: "DRAFT" | "PLACED" = "DRAFT";
  constructor(readonly id: OrderId,
              readonly customerId: CustomerId) {}

  addLine(sku: Sku, qty: number, price: Money) {
    if (this.status !== "DRAFT")
      throw new DomainError("order already placed");
    if (qty &lt;= 0) throw new DomainError("qty must be &gt; 0");
    this.lines.push(new OrderLine(sku, qty, price));
  }

  place(): OrderPlaced {             // invariant: 1..50 lines
    if (this.lines.length === 0 || this.lines.length &gt; 50)
      throw new DomainError("order must have 1..50 lines");
    this.status = "PLACED";
    return new OrderPlaced(this.id, this.total());
  }

  total(): Money {
    return this.lines.reduce((s, l) =&gt; s.add(l.subtotal()),
                             Money.zero("ILS"));
  }
}</pre>
<ul>
<li><strong>Entity</strong>: has identity that survives change (<code>Order#o-81</code> is the same order after you add a line).</li>
<li><strong>Value object</strong>: defined only by its values, immutable, compared by value (<code>Money(129.00, "ILS")</code>, <code>Address</code>, <code>DateRange</code>). Put behavior and validation here — it kills primitive obsession.</li>
<li><strong>Rules of thumb</strong>: keep aggregates small; reference other aggregates by ID; one transaction = one aggregate; cross-aggregate consistency is <em>eventual</em>, via domain events.</li>
</ul>
<blockquote>💡 Real world: "the customer's credit limit must not be exceeded across all their open orders" is a rule spanning many Order aggregates. Don't make a giant Customer aggregate holding all orders — use a Credit context that reserves credit on <code>OrderPlaced</code> and rejects with a compensating event.</blockquote>`,
        he: `<p><strong>Aggregate</strong> הוא אשכול של אובייקטים שמשתנים יחד ב<em>טרנזקציה אחת</em>, עם <strong>root</strong> אחד שאוכף את ה-invariants. קוד מבחוץ מחזיק רק reference ל-root (לפי ID), אף פעם לא לחלקים הפנימיים.</p>
<pre>class Order {                       // aggregate root
  private lines: OrderLine[] = [];
  private status: "DRAFT" | "PLACED" = "DRAFT";
  constructor(readonly id: OrderId,
              readonly customerId: CustomerId) {}

  addLine(sku: Sku, qty: number, price: Money) {
    if (this.status !== "DRAFT")
      throw new DomainError("order already placed");
    if (qty &lt;= 0) throw new DomainError("qty must be &gt; 0");
    this.lines.push(new OrderLine(sku, qty, price));
  }

  place(): OrderPlaced {             // invariant: 1..50 lines
    if (this.lines.length === 0 || this.lines.length &gt; 50)
      throw new DomainError("order must have 1..50 lines");
    this.status = "PLACED";
    return new OrderPlaced(this.id, this.total());
  }

  total(): Money {
    return this.lines.reduce((s, l) =&gt; s.add(l.subtotal()),
                             Money.zero("ILS"));
  }
}</pre>
<ul>
<li><strong>Entity</strong>: יש לו זהות ששורדת שינויים (<code>Order#o-81</code> היא אותה הזמנה גם אחרי שהוספת שורה).</li>
<li><strong>Value object</strong>: מוגדר רק לפי הערכים שלו, immutable, משווים לפי ערך (<code>Money(129.00, "ILS")</code>, <code>Address</code>, <code>DateRange</code>). שם שמים התנהגות ו-validation — זה הורג את ה-primitive obsession.</li>
<li><strong>כללי אצבע</strong>: aggregates קטנים; מפנים ל-aggregates אחרים לפי ID; טרנזקציה אחת = aggregate אחד; עקביות בין aggregates היא <em>eventual</em>, דרך domain events.</li>
</ul>
<blockquote>💡 מהשטח: "אסור לחרוג ממסגרת האשראי של הלקוח על פני כל ההזמנות הפתוחות שלו" הוא חוק שחוצה הרבה Order aggregates. אל תבנה Customer aggregate ענק שמחזיק את כל ההזמנות — תשתמש ב-Credit context ששומר אשראי על <code>OrderPlaced</code> ודוחה עם event מפצה.</blockquote>`
      }
    },
    {
      h: { en: "Event storming: finding the boundaries in a room", he: "Event storming: למצוא את הגבולות בחדר אחד" },
      body: {
        en: `<p><strong>Event storming</strong> is a 2–4 hour workshop with engineers and domain experts and a very long wall of sticky notes:</p>
<ol>
<li><strong>Chaotic exploration</strong>: everyone writes domain events in past tense on orange stickies — <em>Cart Checked Out, Payment Authorized, Room Released</em>.</li>
<li><strong>Timeline</strong>: order them left to right; duplicates and arguments surface hidden complexity (hot spots in red/pink).</li>
<li><strong>Commands &amp; actors</strong>: blue stickies for what triggers each event (<em>Place Order</em>), yellow for who (<em>Guest, Hotel Manager</em>), purple for policies ("whenever <em>Payment Failed</em>, then <em>Cancel Reservation</em>").</li>
<li><strong>Aggregates</strong>: group commands/events around the thing that enforces the rule.</li>
<li><strong>Boundaries</strong>: draw lines where language shifts and where few events cross — those are candidate bounded contexts.</li>
</ol>
<pre>[Guest] -&gt; (Place Order) -&gt; {Order} -&gt; OrderPlaced
   policy: whenever OrderPlaced -&gt; (Authorize Payment)
(Authorize Payment) -&gt; {Payment} -&gt; PaymentAuthorized
   policy: whenever PaymentFailed -&gt; (Cancel Order)
   ------------------ boundary: Ordering | Payments ---</pre>
<blockquote>💡 Real world: the output that matters is not the wall photo but three artifacts: a glossary per context, a context map, and a short list of hot spots that become design-doc questions.</blockquote>`,
        he: `<p><strong>Event storming</strong> היא סדנה של 2–4 שעות עם מהנדסים ואנשי דומיין וקיר ארוך מאוד של פתקים:</p>
<ol>
<li><strong>חקירה כאוטית</strong>: כל אחד כותב domain events בזמן עבר על פתקים כתומים — <em>Cart Checked Out, Payment Authorized, Room Released</em>.</li>
<li><strong>ציר זמן</strong>: מסדרים אותם משמאל לימין; כפילויות וויכוחים חושפים מורכבות נסתרת (hot spots באדום/ורוד).</li>
<li><strong>Commands ושחקנים</strong>: פתקים כחולים למה שמפעיל כל event (<em>Place Order</em>), צהובים למי (<em>אורח, מנהל מלון</em>), סגולים ל-policies ("בכל פעם ש-<em>Payment Failed</em>, אז <em>Cancel Reservation</em>").</li>
<li><strong>Aggregates</strong>: מקבצים commands ו-events סביב הדבר שאוכף את החוק.</li>
<li><strong>גבולות</strong>: מותחים קווים איפה שהשפה משתנה ואיפה שמעט events חוצים — אלה המועמדים ל-bounded contexts.</li>
</ol>
<pre>[Guest] -&gt; (Place Order) -&gt; {Order} -&gt; OrderPlaced
   policy: whenever OrderPlaced -&gt; (Authorize Payment)
(Authorize Payment) -&gt; {Payment} -&gt; PaymentAuthorized
   policy: whenever PaymentFailed -&gt; (Cancel Order)
   ------------------ boundary: Ordering | Payments ---</pre>
<blockquote>💡 מהשטח: התוצר שחשוב הוא לא התמונה של הקיר אלא שלושה דברים: מילון לכל context, context map, ורשימה קצרה של hot spots שהופכים לשאלות ב-design doc.</blockquote>`
      }
    },
    {
      h: { en: "From contexts to deployables (and the classic mistakes)", he: "מ-contexts ליחידות deploy (והטעויות הקלאסיות)" },
      body: {
        en: `<p>A bounded context is a <em>logical</em> boundary. It can be deployed as a module in a modular monolith, as one service, or (rarely) as a few services. Map it to a deployable based on team ownership, scaling profile and change cadence:</p>
<table>
<tr><th>Signal</th><th>Keep as module</th><th>Extract as service</th></tr>
<tr><td>Team</td><td>Same team owns neighbors</td><td>Separate team, separate on-call</td></tr>
<tr><td>Scale</td><td>Similar load profile</td><td>10x different load or hardware (GPU)</td></tr>
<tr><td>Change rate</td><td>Changes ship together</td><td>Independent release cadence</td></tr>
<tr><td>Data</td><td>Shares transactions with neighbors</td><td>Own data, async integration OK</td></tr>
<tr><td>Compliance</td><td>Same rules</td><td>PCI/PHI scope to isolate</td></tr>
</table>
<p><strong>Mistakes that hurt</strong>:</p>
<ul>
<li><strong>Entity-per-service</strong>: a <code>customer-service</code>, <code>order-service</code>, <code>product-service</code> split by nouns. Every use case becomes a distributed join and a chain of sync calls. Split by <em>capability</em> (Ordering, Fulfillment, Pricing), not by table.</li>
<li><strong>Anemic domain model</strong>: classes with getters/setters and all rules in 2,000-line "service" classes. Invariants get duplicated and broken. Put behavior on the aggregate.</li>
<li><strong>Shared database between contexts</strong>: kills the boundary silently — one team's migration breaks another's reports.</li>
<li><strong>DDD everywhere</strong>: tactical patterns (aggregates, repositories, events) in a generic subdomain are ceremony. Use them in the core.</li>
</ul>
<blockquote>⚠️ Production tip: enforce module boundaries in a monolith with tooling — ArchUnit (Java), Packwerk (Ruby), dependency-cruiser (TS), import-linter (Python). A boundary that isn't checked in CI erodes within months.</blockquote>`,
        he: `<p>Bounded context הוא גבול <em>לוגי</em>. אפשר לפרוס אותו כמודול ב-modular monolith, כשירות אחד, או (לעתים רחוקות) ככמה שירותים. ממפים אותו ליחידת deploy לפי בעלות צוותית, פרופיל סקייל וקצב שינוי:</p>
<table>
<tr><th>סימן</th><th>להשאיר כמודול</th><th>לחלץ לשירות</th></tr>
<tr><td>צוות</td><td>אותו צוות אחראי על השכנים</td><td>צוות נפרד, on-call נפרד</td></tr>
<tr><td>סקייל</td><td>פרופיל עומס דומה</td><td>עומס שונה פי 10 או חומרה אחרת (GPU)</td></tr>
<tr><td>קצב שינוי</td><td>השינויים יוצאים יחד</td><td>קצב releases עצמאי</td></tr>
<tr><td>Data</td><td>חולק טרנזקציות עם השכנים</td><td>Data משלו, אינטגרציה אסינכרונית מספיקה</td></tr>
<tr><td>Compliance</td><td>אותם חוקים</td><td>Scope של PCI/PHI שצריך לבודד</td></tr>
</table>
<p><strong>טעויות שכואבות</strong>:</p>
<ul>
<li><strong>Entity-per-service</strong>: <code>customer-service</code>, <code>order-service</code>, <code>product-service</code> מפוצלים לפי שמות עצם. כל use case הופך ל-join מבוזר ולשרשרת קריאות סינכרוניות. מפצלים לפי <em>יכולת</em> (Ordering, Fulfillment, Pricing), לא לפי טבלה.</li>
<li><strong>Anemic domain model</strong>: מחלקות עם getters/setters וכל החוקים במחלקות "service" של 2,000 שורות. Invariants משוכפלים ונשברים. שים את ההתנהגות על ה-aggregate.</li>
<li><strong>Database משותף בין contexts</strong>: הורג את הגבול בשקט — מיגרציה של צוות אחד שוברת את הדוחות של צוות אחר.</li>
<li><strong>DDD בכל מקום</strong>: דפוסים טקטיים (aggregates, repositories, events) ב-subdomain גנרי הם טקס מיותר. משתמשים בהם ב-core.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: תאכוף גבולות מודולים במונוליט עם כלים — ArchUnit (Java), Packwerk (Ruby), dependency-cruiser (TS), import-linter (Python). גבול שלא נבדק ב-CI נשחק תוך כמה חודשים.</blockquote>`
      }
    }
  ],
  diagram: `            Online travel company
 +-------------+  OrderPlaced   +-------------+
 |  Ordering   |--------------->|  Payments   |
 | {Order}     |<---------------| {Payment}   |
 +-------------+ PaymentFailed  +-------------+
      | customer/supplier             | conformist
      v                               v
 +-------------+                 [ Stripe ]
 |  Pricing    |  (core domain)
 +-------------+
      ^ ACL (translate IDocs)
 [ Legacy ERP ]
 Each box = bounded context: own model, own data, own language`,
  handsOn: [
    { cmd: "npx depcruise src --include-only '^src' --output-type err", what: { en: "Check that modules (bounded contexts) in a TS monolith don't import each other's internals; add forbidden rules to .dependency-cruiser.js.", he: "לבדוק שמודולים (bounded contexts) במונוליט TS לא מייבאים את הפנים אחד של השני; מוסיפים חוקי forbidden ל-.dependency-cruiser.js." } },
    { cmd: "pip install import-linter && lint-imports", what: { en: "Same for Python: define 'independence' and 'layers' contracts between packages in .importlinter and fail CI on violations.", he: "אותו דבר ב-Python: מגדירים חוזי 'independence' ו-'layers' בין packages ב-.importlinter ומכשילים את ה-CI על הפרות." } },
    { cmd: "grep -rhoE 'class [A-Z][a-zA-Z]+(Service|Manager|Helper)' src | sort | uniq -c | sort -rn | head", what: { en: "Smell test for an anemic model: many *Service/*Manager classes holding the rules instead of the domain objects.", he: "בדיקת ריח למודל anemic: הרבה מחלקות *Service/*Manager שמחזיקות את החוקים במקום אובייקטי הדומיין." } },
    { cmd: "git log --since=6.months --name-only --format='' | cut -d/ -f2 | sort | uniq -c | sort -rn", what: { en: "Change-coupling hint: folders that always change together are probably one bounded context.", he: "רמז לצימוד שינויים: תיקיות שתמיד משתנות יחד הן כנראה bounded context אחד." } }
  ],
  mnemonic: {
    en: "Language draws the line, the aggregate guards the rule, events cross the border.",
    he: "השפה מותחת את הקו, ה-aggregate שומר על החוק, ה-events חוצים את הגבול."
  },
  pitfalls: [
    { en: "Splitting services by nouns (entity-per-service). You get chatty sync calls and distributed transactions for every use case. Split by business capability and bounded context instead.", he: "לפצל שירותים לפי שמות עצם (entity-per-service). מקבלים קריאות סינכרוניות פטפטניות וטרנזקציות מבוזרות בכל use case. מפצלים לפי יכולת עסקית ו-bounded context." },
    { en: "Huge aggregates ('Customer' holding all orders, addresses and tickets). Every write locks everything, contention explodes. Keep aggregates small and reference others by ID.", he: "Aggregates ענקיים ('Customer' שמחזיק את כל ההזמנות, הכתובות והטיקטים). כל כתיבה נועלת הכול וה-contention מתפוצץ. שומרים aggregates קטנים ומפנים לאחרים לפי ID." },
    { en: "Applying full tactical DDD to generic subdomains. Repositories and domain events around a settings page are ceremony; save the rich model for the core domain.", he: "להפעיל DDD טקטי מלא על subdomains גנריים. Repositories ו-domain events סביב עמוד הגדרות הם טקס; שומרים את המודל העשיר ל-core domain." }
  ],
  interview: [
    {
      q: { en: "How would you decide the service boundaries for a new marketplace platform?", he: "איך היית מחליט על גבולות השירותים לפלטפורמת marketplace חדשה?" },
      a: { en: "Start from the domain, not the database: run event storming with domain experts, classify subdomains (core: matching/pricing; supporting: seller onboarding; generic: payments, auth), and draw bounded contexts where the language changes. Produce a context map with relationship patterns (ACL to the legacy ERP, conformist to Stripe). Then map contexts to deployables by team ownership, scaling and change cadence — often a modular monolith first, with 1–2 contexts extracted where load or compliance differs. Enforce module boundaries in CI and integrate via domain events with an outbox.", he: "מתחילים מהדומיין, לא מה-database: מריצים event storming עם אנשי הדומיין, מסווגים subdomains (core: matching/תמחור; supporting: קליטת מוכרים; generic: תשלומים, auth), ומותחים bounded contexts איפה שהשפה משתנה. מוציאים context map עם דפוסי קשר (ACL ל-ERP הישן, conformist ל-Stripe). אחר כך ממפים contexts ליחידות deploy לפי בעלות צוותית, סקייל וקצב שינוי — הרבה פעמים modular monolith קודם, עם 1–2 contexts שמחולצים איפה שהעומס או ה-compliance שונים. אוכפים גבולות מודולים ב-CI ומתחברים דרך domain events עם outbox." }
    },
    {
      q: { en: "What is an aggregate and how big should it be?", he: "מה זה aggregate וכמה גדול הוא צריך להיות?" },
      a: { en: "A consistency boundary: the set of objects that must change atomically to keep an invariant, accessed only through its root. It should be as small as the true invariants allow — usually one root plus a few value objects/child entities. Rules spanning aggregates are handled with eventual consistency (domain events, sagas), because big aggregates cause lock contention and slow writes.", he: "גבול עקביות: קבוצת האובייקטים שחייבים להשתנות באופן אטומי כדי לשמור על invariant, ונגישים רק דרך ה-root. הוא צריך להיות קטן ככל שה-invariants האמיתיים מאפשרים — בדרך כלל root אחד ועוד כמה value objects או ישויות בנות. חוקים שחוצים aggregates מטופלים ב-eventual consistency (domain events, sagas), כי aggregates גדולים גורמים ל-lock contention וכתיבות איטיות." }
    }
  ],
  quiz: [
    {
      q: { en: "'Product' means different things in Catalog, Inventory and Pricing. What does DDD recommend?", he: "'מוצר' אומר דברים שונים ב-Catalog, Inventory ו-Pricing. מה DDD ממליץ?" },
      options: [
        { en: "One canonical Product model shared by all services", he: "מודל Product קנוני אחד שכל השירותים חולקים" },
        { en: "Each bounded context owns its own Product model, linked by ID and translated at the borders", he: "לכל bounded context מודל Product משלו, מקושרים לפי ID ומתורגמים בגבולות" },
        { en: "Put Product in a shared database table", he: "לשים את Product בטבלה משותפת ב-database" },
        { en: "Rename them to avoid confusion", he: "לשנות להם שמות כדי למנוע בלבול" }
      ],
      answer: 1,
      explain: { en: "A single shared model couples every team to every other. Separate models per context, connected by IDs and events, keep each context free to evolve.", he: "מודל משותף אחד מצמיד כל צוות לכל צוות אחר. מודלים נפרדים לכל context, מחוברים לפי IDs ו-events, משאירים לכל context חופש להתפתח." }
    },
    {
      q: { en: "Which rule belongs inside one aggregate?", he: "איזה חוק שייך לתוך aggregate אחד?" },
      options: [
        { en: "An order must have between 1 and 50 lines", he: "להזמנה חייבות להיות בין 1 ל-50 שורות" },
        { en: "Total open orders of a customer must not exceed their credit limit", he: "סך ההזמנות הפתוחות של לקוח לא יחרוג ממסגרת האשראי" },
        { en: "A product must be in stock in some warehouse", he: "מוצר חייב להיות במלאי באיזשהו מחסן" },
        { en: "Every order must eventually be shipped", he: "כל הזמנה חייבת להישלח בסופו של דבר" }
      ],
      answer: 0,
      explain: { en: "The line-count rule only needs the Order's own data, so the Order root enforces it in one transaction. The others span many aggregates or contexts and are handled with eventual consistency.", he: "חוק מספר השורות צריך רק את ה-data של ה-Order עצמו, אז ה-root אוכף אותו בטרנזקציה אחת. האחרים חוצים הרבה aggregates או contexts ומטופלים ב-eventual consistency." }
    },
    {
      q: { en: "Your team must integrate with a messy 20-year-old ERP. Which context-map pattern protects your model?", he: "הצוות שלך צריך להתחבר ל-ERP מבולגן בן 20. איזה דפוס context map מגן על המודל שלך?" },
      options: [
        { en: "Shared kernel", he: "Shared kernel" },
        { en: "Conformist", he: "Conformist" },
        { en: "Anti-corruption layer", he: "Anti-corruption layer" },
        { en: "Separate ways", he: "Separate ways" }
      ],
      answer: 2,
      explain: { en: "An ACL translates the ERP's concepts into your language at the border so its model doesn't leak in. Conformist would adopt the mess.", he: "ACL מתרגם את המושגים של ה-ERP לשפה שלך בגבול כדי שהמודל שלו לא יחלחל פנימה. Conformist היה מאמץ את הבלגן." }
    },
    {
      q: { en: "Services named customer-service, order-service and product-service call each other synchronously for every request. What's the likely root cause?", he: "שירותים בשם customer-service, order-service ו-product-service קוראים אחד לשני סינכרונית בכל בקשה. מה כנראה שורש הבעיה?" },
      options: [
        { en: "Not enough caching", he: "אין מספיק caching" },
        { en: "Entity-per-service split instead of capability-based bounded contexts", he: "פיצול entity-per-service במקום bounded contexts לפי יכולת" },
        { en: "Wrong programming language", he: "שפת תכנות לא נכונה" },
        { en: "Too few replicas", he: "מעט מדי replicas" }
      ],
      answer: 1,
      explain: { en: "Splitting by nouns forces every use case to assemble data across services. Boundaries drawn around capabilities keep most use cases inside one context.", he: "פיצול לפי שמות עצם מכריח כל use case להרכיב data מכמה שירותים. גבולות סביב יכולות משאירים את רוב ה-use cases בתוך context אחד." }
    }
  ],
  related: ["pr-architecture-styles", "arch-monolith-vs-microservices", "arch-event-driven", "pr-cloud-patterns", "pr-integration-styles", "pr-solid"]
});

INFRA.lessons.push({
  id: "pr-architecture-styles",
  track: "principal",
  order: 121,
  icon: "🏛️",
  level: 3,
  minutes: 20,
  title: { en: "Architecture Styles Catalog: Which Shape, When and Why", he: "קטלוג סגנונות ארכיטקטורה: איזו צורה, מתי ולמה" },
  tldr: {
    en: "There is no best architecture, only the best fit for your top 3 architecture characteristics, your team shape and your stage: start with the simplest style that meets them, keep boundaries clean, and evolve deliberately.",
    he: "אין ארכיטקטורה הכי טובה, יש רק את ההתאמה הכי טובה ל-3 מאפייני הארכיטקטורה החשובים לך, למבנה הצוותים ולשלב שבו אתה נמצא: מתחילים בסגנון הכי פשוט שעונה עליהם, שומרים על גבולות נקיים, ומתפתחים בכוונה."
  },
  analogy: {
    en: "Architecture styles are building types. A studio apartment (monolith) is cheap and everything is one step away, but you can't renovate the kitchen while someone sleeps. An apartment building with separate units (modular monolith) shares plumbing but has walls. A neighborhood of houses (microservices) lets each family renovate freely, but now you need roads, mail delivery and a municipality. A food truck (serverless) appears only when customers come. You don't pick the 'best building' — you pick based on how many people live there and how often they renovate.",
    he: "סגנונות ארכיטקטורה הם סוגי מבנים. דירת סטודיו (monolith) זולה והכול במרחק צעד, אבל אי אפשר לשפץ את המטבח כשמישהו ישן. בניין עם דירות נפרדות (modular monolith) חולק צנרת אבל יש קירות. שכונה של בתים (microservices) נותנת לכל משפחה לשפץ בחופשיות, אבל עכשיו צריך כבישים, דואר ועירייה. Food truck (serverless) מופיע רק כשיש לקוחות. לא בוחרים 'בניין הכי טוב' — בוחרים לפי כמה אנשים גרים שם וכמה פעמים הם משפצים."
  },
  sections: [
    {
      h: { en: "Start from architecture characteristics", he: "מתחילים ממאפייני הארכיטקטורה" },
      body: {
        en: `<p>Before naming a style, pick the <strong>top 3 architecture characteristics</strong> ("-ilities") the business actually needs. Choosing all of them is choosing none.</p>
<table>
<tr><th>Characteristic</th><th>Question to ask</th><th>Pushes you toward</th></tr>
<tr><td>Deployability</td><td>How often, how independently?</td><td>Modular monolith → services</td></tr>
<tr><td>Elasticity</td><td>Spiky load (10x in minutes)?</td><td>Serverless, event-driven, space-based</td></tr>
<tr><td>Scalability</td><td>Steady growth to 100x?</td><td>Stateless services, partitioning, cells</td></tr>
<tr><td>Fault isolation</td><td>Can one feature take down all?</td><td>Services, cells, bulkheads</td></tr>
<tr><td>Simplicity / cost</td><td>Team of 6, tight budget?</td><td>Layered or modular monolith</td></tr>
<tr><td>Extensibility</td><td>Customers add plugins?</td><td>Microkernel</td></tr>
<tr><td>Auditability</td><td>Must replay history?</td><td>Event-driven + event sourcing</td></tr>
</table>
<blockquote>💡 Real world: write the top 3 in the design doc as the decision criteria ("we optimize for deployability, fault isolation and cost, in that order"). Every later debate becomes "which option scores better on these three", not taste.</blockquote>`,
        he: `<p>לפני שנותנים שם לסגנון, בוחרים את <strong>3 מאפייני הארכיטקטורה</strong> ("-ilities") שהביזנס באמת צריך. מי שבוחר את כולם לא בוחר אף אחד.</p>
<table>
<tr><th>מאפיין</th><th>השאלה לשאול</th><th>דוחף לכיוון</th></tr>
<tr><td>Deployability</td><td>כמה פעמים, כמה עצמאי?</td><td>Modular monolith → services</td></tr>
<tr><td>Elasticity</td><td>עומס קופצני (פי 10 בדקות)?</td><td>Serverless, event-driven, space-based</td></tr>
<tr><td>Scalability</td><td>צמיחה יציבה עד פי 100?</td><td>שירותים stateless, partitioning, cells</td></tr>
<tr><td>Fault isolation</td><td>פיצ'ר אחד יכול להפיל הכול?</td><td>Services, cells, bulkheads</td></tr>
<tr><td>פשטות / עלות</td><td>צוות של 6, תקציב צפוף?</td><td>Layered או modular monolith</td></tr>
<tr><td>Extensibility</td><td>לקוחות מוסיפים plugins?</td><td>Microkernel</td></tr>
<tr><td>Auditability</td><td>חייבים לשחזר היסטוריה?</td><td>Event-driven + event sourcing</td></tr>
</table>
<blockquote>💡 מהשטח: תכתוב את ה-3 ב-design doc כקריטריוני ההחלטה ("אנחנו מבצעים אופטימיזציה ל-deployability, fault isolation ועלות, בסדר הזה"). כל ויכוח אחר כך הופך ל"איזו אופציה מקבלת ציון טוב יותר על השלושה", לא לעניין של טעם.</blockquote>`
      }
    },
    {
      h: { en: "The catalog, part 1: inside one deployable", he: "הקטלוג, חלק 1: בתוך יחידת deploy אחת" },
      body: {
        en: `<ul>
<li><strong>Layered (n-tier)</strong> — <code>UI → Service → Repository → DB</code>. Analogy: a layer cake. + Familiar, fast to start. − Changes cut through all layers; business logic leaks everywhere; "sinkhole" layers that just pass calls. Pick for: small CRUD apps, internal tools.</li>
<li><strong>Hexagonal / ports &amp; adapters</strong> — the domain core in the middle, <em>ports</em> (interfaces) on the edge, <em>adapters</em> plug in (HTTP, Kafka, Postgres, a fake for tests). Analogy: a laptop with USB-C ports. + Domain testable without infra; swap DB or broker. − More interfaces and mapping code. Pick for: core domains with rich rules.</li>
<li><strong>Clean / onion</strong> — same idea as hexagonal with explicit rings (entities → use cases → interface adapters → frameworks); dependencies point <em>inward only</em>.</li>
<li><strong>Modular monolith</strong> — one deployable, many modules with enforced boundaries and their own schemas. Analogy: an apartment building. + One deploy, in-process calls, easy refactors, transactions when needed. − One runtime: a memory leak in one module hurts all; scaling is all-or-nothing. Pick for: most new products and teams under ~30–50 engineers.</li>
<li><strong>Microkernel / plugin</strong> — a minimal core plus plugins via a stable extension API. Analogy: a browser and its extensions. Examples: VS Code, Jenkins, Kubernetes (CRDs + controllers), Envoy filters. Pick for: products customers extend.</li>
</ul>
<pre>          +---------------------------+
 HTTP --&gt; | adapter | port |          |
 Kafka -&gt; | adapter | port |  DOMAIN  |
          |         | port | (no I/O) | -- port --&gt; Postgres adapter
          +---------------------------+ -- port --&gt; FakeRepo (tests)</pre>`,
        he: `<ul>
<li><strong>Layered (n-tier)</strong> — <code>UI → Service → Repository → DB</code>. אנלוגיה: עוגת שכבות. + מוכר, מהיר להתחיל. − שינויים חוצים את כל השכבות; לוגיקה עסקית דולפת לכל מקום; שכבות "בור" שרק מעבירות קריאות. מתאים ל: אפליקציות CRUD קטנות, כלים פנימיים.</li>
<li><strong>Hexagonal / ports &amp; adapters</strong> — ה-domain במרכז, <em>ports</em> (interfaces) בקצוות, <em>adapters</em> מתחברים (HTTP, Kafka, Postgres, fake לבדיקות). אנלוגיה: לפטופ עם חיבורי USB-C. + הדומיין נבדק בלי תשתית; אפשר להחליף DB או broker. − יותר interfaces וקוד מיפוי. מתאים ל: core domains עם הרבה חוקים.</li>
<li><strong>Clean / onion</strong> — אותו רעיון כמו hexagonal עם טבעות מפורשות (entities → use cases → interface adapters → frameworks); התלויות מצביעות <em>רק פנימה</em>.</li>
<li><strong>Modular monolith</strong> — יחידת deploy אחת, הרבה מודולים עם גבולות נאכפים ו-schemas משלהם. אנלוגיה: בניין דירות. + deploy אחד, קריאות in-process, refactor קל, טרנזקציות כשצריך. − runtime אחד: memory leak במודול אחד פוגע בכולם; הסקייל הוא הכול-או-כלום. מתאים ל: רוב המוצרים החדשים וצוותים של עד ~30–50 מהנדסים.</li>
<li><strong>Microkernel / plugin</strong> — core מינימלי ועוד plugins דרך extension API יציב. אנלוגיה: דפדפן וה-extensions שלו. דוגמאות: VS Code, Jenkins, Kubernetes (CRDs + controllers), Envoy filters. מתאים ל: מוצרים שהלקוחות מרחיבים.</li>
</ul>
<pre>          +---------------------------+
 HTTP --&gt; | adapter | port |          |
 Kafka -&gt; | adapter | port |  DOMAIN  |
          |         | port | (no I/O) | -- port --&gt; Postgres adapter
          +---------------------------+ -- port --&gt; FakeRepo (tests)</pre>`
      }
    },
    {
      h: { en: "The catalog, part 2: distributed styles", he: "הקטלוג, חלק 2: סגנונות מבוזרים" },
      body: {
        en: `<ul>
<li><strong>Service-based</strong> — 4–12 coarse-grained domain services, often sharing one database. Analogy: a few departments in one building. The pragmatic middle ground; underrated.</li>
<li><strong>Microservices</strong> — many small services, each owning its data, deployed independently. Analogy: a neighborhood of houses. + Independent deploys and scaling, fault isolation, team autonomy. − Network calls, distributed data, observability and platform cost; needs mature CI/CD, tracing and on-call.</li>
<li><strong>Event-driven</strong> — components react to events through a broker (broker topology) or a central mediator/orchestrator. + Loose coupling, elastic, natural audit trail. − Eventual consistency, harder debugging, schema evolution.</li>
<li><strong>Serverless</strong> — functions and managed services (Lambda, Cloud Run, Step Functions, DynamoDB). Analogy: a food truck. + Scale to zero, no servers, pay per use. − Cold starts, execution limits, vendor lock-in, cost at steady high load.</li>
<li><strong>Space-based</strong> — processing units with in-memory data grids (Hazelcast, Apache Ignite), async write-behind to the DB. For extreme spikes (ticket sales, auctions). − Complex, expensive, hard to test.</li>
<li><strong>Cell-based</strong> — the whole stack replicated into independent cells, each serving a slice of customers, behind a thin router. + Blast radius = one cell. − Duplication, routing and cell-migration tooling.</li>
<li><strong>Pipeline (pipes &amp; filters)</strong> — stages transform a stream: ETL, CI/CD, media transcoding, Unix pipes.</li>
</ul>
<blockquote>⚠️ Production tip: "microservices" is an <em>organizational</em> scaling tool first. If you don't have multiple teams blocked on each other's releases, you're paying the distributed-systems tax without the benefit.</blockquote>`,
        he: `<ul>
<li><strong>Service-based</strong> — 4–12 שירותי דומיין גסים, הרבה פעמים עם database אחד משותף. אנלוגיה: כמה מחלקות באותו בניין. דרך האמצע הפרגמטית; מוערכת פחות ממה שמגיע לה.</li>
<li><strong>Microservices</strong> — הרבה שירותים קטנים, כל אחד מחזיק את ה-data שלו, עם deploy עצמאי. אנלוגיה: שכונה של בתים. + deploy וסקייל עצמאיים, fault isolation, אוטונומיה לצוותים. − קריאות רשת, data מבוזר, עלות observability ופלטפורמה; צריך CI/CD בוגר, tracing ו-on-call.</li>
<li><strong>Event-driven</strong> — רכיבים מגיבים ל-events דרך broker (broker topology) או mediator/orchestrator מרכזי. + צימוד רופף, אלסטי, audit trail טבעי. − Eventual consistency, דיבאג קשה יותר, התפתחות schemas.</li>
<li><strong>Serverless</strong> — פונקציות ושירותים מנוהלים (Lambda, Cloud Run, Step Functions, DynamoDB). אנלוגיה: food truck. + scale to zero, בלי שרתים, משלמים לפי שימוש. − Cold starts, מגבלות ריצה, vendor lock-in, עלות בעומס גבוה וקבוע.</li>
<li><strong>Space-based</strong> — יחידות עיבוד עם in-memory data grids (Hazelcast, Apache Ignite), וכתיבה אסינכרונית (write-behind) ל-DB. לקפיצות קיצוניות (מכירת כרטיסים, מכרזים). − מורכב, יקר, קשה לבדיקה.</li>
<li><strong>Cell-based</strong> — כל ה-stack משוכפל ל-cells עצמאיים, כל אחד משרת פרוסה של לקוחות, מאחורי router דק. + blast radius = cell אחד. − שכפול, routing וכלים להעברת לקוחות בין cells.</li>
<li><strong>Pipeline (pipes &amp; filters)</strong> — שלבים שמעבדים זרם: ETL, CI/CD, transcoding של מדיה, Unix pipes.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: "microservices" הוא קודם כל כלי לסקייל <em>ארגוני</em>. אם אין לך כמה צוותים שחוסמים אחד את ה-releases של השני, אתה משלם את מס המערכות המבוזרות בלי לקבל את התועלת.</blockquote>`
      }
    },
    {
      h: { en: "The comparison table", he: "טבלת ההשוואה" },
      body: {
        en: `<p>Stars are relative (1 = poor, 5 = great). Cost and complexity: more stars = cheaper / simpler.</p>
<table>
<tr><th>Style</th><th>Deploy</th><th>Scale</th><th>Fault iso.</th><th>Cost</th><th>Simplicity</th><th>Team fit</th></tr>
<tr><td>Layered</td><td>★</td><td>★</td><td>★</td><td>★★★★★</td><td>★★★★★</td><td>1 team</td></tr>
<tr><td>Modular monolith</td><td>★★</td><td>★★</td><td>★★</td><td>★★★★★</td><td>★★★★</td><td>1–6 teams</td></tr>
<tr><td>Microkernel</td><td>★★★</td><td>★</td><td>★★</td><td>★★★★</td><td>★★★</td><td>core + plugin teams</td></tr>
<tr><td>Service-based</td><td>★★★</td><td>★★★</td><td>★★★</td><td>★★★★</td><td>★★★</td><td>3–10 teams</td></tr>
<tr><td>Event-driven</td><td>★★★</td><td>★★★★★</td><td>★★★★</td><td>★★★</td><td>★★</td><td>many teams</td></tr>
<tr><td>Microservices</td><td>★★★★★</td><td>★★★★★</td><td>★★★★</td><td>★</td><td>★</td><td>10+ teams</td></tr>
<tr><td>Serverless</td><td>★★★★★</td><td>★★★★</td><td>★★★★</td><td>★★★ (spiky) / ★ (steady)</td><td>★★★</td><td>small teams</td></tr>
<tr><td>Space-based</td><td>★★★</td><td>★★★★★</td><td>★★★</td><td>★</td><td>★</td><td>specialists</td></tr>
<tr><td>Cell-based</td><td>★★★★</td><td>★★★★★</td><td>★★★★★</td><td>★★</td><td>★★</td><td>platform + product teams</td></tr>
</table>
<blockquote>💡 Real world: Shopify runs one of the world's largest Rails apps as a modular monolith with enforced components; Amazon and Netflix run thousands of services; Slack and AWS use cells for blast radius. All are right for their characteristics and org size.</blockquote>`,
        he: `<p>הכוכבים יחסיים (1 = חלש, 5 = מצוין). בעלות ובפשטות: יותר כוכבים = זול / פשוט יותר.</p>
<table>
<tr><th>סגנון</th><th>Deploy</th><th>סקייל</th><th>Fault iso.</th><th>עלות</th><th>פשטות</th><th>מתאים ל</th></tr>
<tr><td>Layered</td><td>★</td><td>★</td><td>★</td><td>★★★★★</td><td>★★★★★</td><td>צוות אחד</td></tr>
<tr><td>Modular monolith</td><td>★★</td><td>★★</td><td>★★</td><td>★★★★★</td><td>★★★★</td><td>1–6 צוותים</td></tr>
<tr><td>Microkernel</td><td>★★★</td><td>★</td><td>★★</td><td>★★★★</td><td>★★★</td><td>צוות core + צוותי plugins</td></tr>
<tr><td>Service-based</td><td>★★★</td><td>★★★</td><td>★★★</td><td>★★★★</td><td>★★★</td><td>3–10 צוותים</td></tr>
<tr><td>Event-driven</td><td>★★★</td><td>★★★★★</td><td>★★★★</td><td>★★★</td><td>★★</td><td>הרבה צוותים</td></tr>
<tr><td>Microservices</td><td>★★★★★</td><td>★★★★★</td><td>★★★★</td><td>★</td><td>★</td><td>10+ צוותים</td></tr>
<tr><td>Serverless</td><td>★★★★★</td><td>★★★★</td><td>★★★★</td><td>★★★ (קופצני) / ★ (קבוע)</td><td>★★★</td><td>צוותים קטנים</td></tr>
<tr><td>Space-based</td><td>★★★</td><td>★★★★★</td><td>★★★</td><td>★</td><td>★</td><td>מומחים</td></tr>
<tr><td>Cell-based</td><td>★★★★</td><td>★★★★★</td><td>★★★★★</td><td>★★</td><td>★★</td><td>צוות פלטפורמה + צוותי מוצר</td></tr>
</table>
<blockquote>💡 מהשטח: Shopify מריצים את אחת מאפליקציות ה-Rails הכי גדולות בעולם כ-modular monolith עם components נאכפים; Amazon ו-Netflix מריצים אלפי שירותים; Slack ו-AWS משתמשים ב-cells בשביל blast radius. כולם צודקים לפי המאפיינים וגודל הארגון שלהם.</blockquote>`
      }
    },
    {
      h: { en: "Evolution path and Conway's law", he: "מסלול התפתחות ו-Conway's law" },
      body: {
        en: `<p>Architecture is a trajectory, not a snapshot. A typical healthy path:</p>
<pre>Year 0  Monolith (1 team)  -- ship, learn the domain
Year 1  Modular monolith   -- modules per bounded context,
                              own schemas, lint boundaries
Year 2  + 1-3 extracted     -- only where scale/team/compliance
        services               differs (e.g. search, payments)
Year 3+ Service-based or    -- when many teams block each other;
        microservices          platform (CI/CD, mesh, tracing) first
        + cells             -- when blast radius becomes the risk</pre>
<p><strong>Conway's law</strong>: systems mirror the communication structure of the org that builds them. Use it on purpose (the <em>inverse Conway maneuver</em>): shape teams around the architecture you want. <strong>Team Topologies</strong> gives the vocabulary — <em>stream-aligned</em> teams own a bounded context end to end, a <em>platform</em> team provides paved roads, <em>enabling</em> teams coach, and <em>complicated-subsystem</em> teams own deep specialties (pricing engine, video codec).</p>
<blockquote>⚠️ Production tip: never extract a service you can't name an owning team for. An ownerless service becomes the one nobody dares to deploy — the opposite of why you extracted it.</blockquote>`,
        he: `<p>ארכיטקטורה היא מסלול, לא תמונת מצב. מסלול בריא טיפוסי:</p>
<pre>Year 0  Monolith (1 team)  -- ship, learn the domain
Year 1  Modular monolith   -- modules per bounded context,
                              own schemas, lint boundaries
Year 2  + 1-3 extracted     -- only where scale/team/compliance
        services               differs (e.g. search, payments)
Year 3+ Service-based or    -- when many teams block each other;
        microservices          platform (CI/CD, mesh, tracing) first
        + cells             -- when blast radius becomes the risk</pre>
<p><strong>Conway's law</strong>: מערכות משקפות את מבנה התקשורת של הארגון שבונה אותן. תשתמש בזה בכוונה (<em>inverse Conway maneuver</em>): תעצב את הצוותים סביב הארכיטקטורה שאתה רוצה. <strong>Team Topologies</strong> נותן את אוצר המילים — צוותי <em>stream-aligned</em> מחזיקים bounded context מקצה לקצה, צוות <em>platform</em> נותן paved roads, צוותי <em>enabling</em> מלווים, וצוותי <em>complicated-subsystem</em> מחזיקים התמחויות עמוקות (מנוע תמחור, codec וידאו).</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם אל תחלץ שירות שאתה לא יכול לנקוב בשם הצוות שאחראי עליו. שירות בלי בעלים הופך לזה שאף אחד לא מעז לעשות לו deploy — ההפך ממה שבשבילו חילצת אותו.</blockquote>`
      }
    }
  ],
  diagram: `Pick by top-3 characteristics, team size and stage:

 simplicity/cost ---------------------------> independence/scale
 [Layered] [Modular monolith] [Service-based] [Microservices]
                 |                  |               |
            [Microkernel]     [Event-driven]    [Cells]
                                   |
                       [Serverless] [Space-based]
 Evolve left -> right only when a real pain forces you.`,
  handsOn: [
    { cmd: "npx arkit src -o arch.svg", what: { en: "Generate a dependency diagram of a JS/TS codebase to see the architecture you actually have (often not the one on the slide).", he: "לייצר דיאגרמת תלויות של codebase ב-JS/TS כדי לראות את הארכיטקטורה שבאמת יש לך (הרבה פעמים לא זו שבמצגת)." } },
    { cmd: "kubectl get deploy -A --no-headers | wc -l", what: { en: "Count deployables. Compare with the number of teams: far more services than teams is a smell of premature microservices.", he: "לספור יחידות deploy. להשוות למספר הצוותים: הרבה יותר שירותים מצוותים זה סימן ל-microservices מוקדמים מדי." } },
    { cmd: "git shortlog -sn --since=90.days -- services/payments | head", what: { en: "Who actually changes a service? If 5 teams commit to it, the boundary doesn't match the org (Conway's law).", he: "מי באמת משנה שירות? אם 5 צוותים עושים לו commit, הגבול לא מתאים לארגון (Conway's law)." } },
    { cmd: "mvn test -Dtest=ArchitectureTest", what: { en: "Run ArchUnit rules (e.g. 'domain must not depend on adapters') to keep a hexagonal or layered structure honest in CI.", he: "להריץ חוקי ArchUnit (למשל 'ה-domain לא תלוי ב-adapters') כדי לשמור על מבנה hexagonal או layered כן ב-CI." } }
  ],
  mnemonic: {
    en: "Top-3 -ilities, team size, stage — then the simplest shape that fits.",
    he: "3 ה-ilities, גודל הצוות, השלב — ואז הצורה הכי פשוטה שמתאימה."
  },
  pitfalls: [
    { en: "Choosing microservices for a 6-person team to 'be ready for scale'. You get the platform, tracing and on-call cost of a big company with none of the org benefits. Start with a modular monolith.", he: "לבחור microservices לצוות של 6 אנשים כדי 'להיות מוכנים לסקייל'. מקבלים את עלות הפלטפורמה, ה-tracing וה-on-call של חברה גדולה בלי אף אחת מהתועלות הארגוניות. מתחילים ב-modular monolith." },
    { en: "A 'distributed monolith': services that must deploy together and share a database. All the network pain, none of the independence. Fix boundaries or merge the services back.", he: "'Distributed monolith': שירותים שחייבים לעלות יחד וחולקים database. כל הכאב של הרשת, בלי אף עצמאות. מתקנים את הגבולות או מאחדים את השירותים בחזרה." },
    { en: "Picking a style from a conference talk instead of from your characteristics. Write the top 3 -ilities in the design doc and score options against them.", he: "לבחור סגנון מהרצאה בכנס במקום מהמאפיינים שלך. כותבים את 3 ה-ilities ב-design doc ונותנים ציון לאופציות מולם." }
  ],
  interview: [
    {
      q: { en: "A startup with 8 engineers asks you to design their architecture for 'massive scale'. What do you recommend?", he: "סטארט-אפ עם 8 מהנדסים מבקש ממך לתכנן ארכיטקטורה ל'סקייל עצום'. מה אתה ממליץ?" },
      a: { en: "Clarify the real top-3 characteristics and numbers first — usually time-to-market, cost and reasonable scalability. Then a modular monolith with modules per bounded context, hexagonal core for the main domain, stateless app tier behind a load balancer, managed Postgres with read replicas and a queue for async work. That scales to millions of users. Enforce module boundaries in CI so that extracting a service later is a mechanical step, and define the triggers for extraction (separate team, 10x different load, compliance scope).", he: "קודם מבררים את 3 המאפיינים והמספרים האמיתיים — בדרך כלל time-to-market, עלות וסקייל סביר. אחר כך modular monolith עם מודולים לפי bounded context, core ב-hexagonal לדומיין המרכזי, שכבת אפליקציה stateless מאחורי load balancer, Postgres מנוהל עם read replicas ותור לעבודה אסינכרונית. זה מגיע למיליוני משתמשים. אוכפים גבולות מודולים ב-CI כדי שחילוץ שירות בהמשך יהיה צעד מכני, ומגדירים מראש מתי מחלצים (צוות נפרד, עומס שונה פי 10, scope של compliance)." }
    },
    {
      q: { en: "When would you choose cell-based architecture over plain microservices?", he: "מתי היית בוחר ארכיטקטורת cells על פני microservices רגילים?" },
      a: { en: "When blast radius is the dominant risk: a bad deploy, poison message or noisy tenant must not take down all customers, and you already run at a scale where regional/AZ redundancy isn't enough. Cells add a routing layer, duplication and cell-migration tooling, so they fit mature platform teams with many large tenants — not early-stage products.", he: "כש-blast radius הוא הסיכון הדומיננטי: deploy רע, poison message או tenant רועש אסור שיפילו את כל הלקוחות, ואתה כבר בסקייל שבו redundancy של region/AZ לא מספיק. Cells מוסיפים שכבת routing, שכפול וכלים להעברת לקוחות בין cells, אז הם מתאימים לצוותי פלטפורמה בוגרים עם הרבה tenants גדולים — לא למוצרים בשלב מוקדם." }
    }
  ],
  quiz: [
    {
      q: { en: "What should you decide BEFORE choosing an architecture style?", he: "מה צריך להחליט לפני שבוחרים סגנון ארכיטקטורה?" },
      options: [
        { en: "The programming language", he: "את שפת התכנות" },
        { en: "The top 3 architecture characteristics the business needs", he: "את 3 מאפייני הארכיטקטורה שהביזנס צריך" },
        { en: "The cloud provider", he: "את ספק הענן" },
        { en: "The number of microservices", he: "את מספר ה-microservices" }
      ],
      answer: 1,
      explain: { en: "Styles are trade-offs between characteristics. Without knowing which ones matter most, any choice is taste.", he: "סגנונות הם trade-offs בין מאפיינים. בלי לדעת מה הכי חשוב, כל בחירה היא עניין של טעם." }
    },
    {
      q: { en: "In hexagonal architecture, which way do dependencies point?", he: "בארכיטקטורת hexagonal, לאיזה כיוון מצביעות התלויות?" },
      options: [
        { en: "From the domain out to the database and frameworks", he: "מה-domain החוצה ל-database ול-frameworks" },
        { en: "From adapters inward to the domain through ports", he: "מה-adapters פנימה ל-domain דרך ports" },
        { en: "Both ways, as needed", he: "לשני הכיוונים, לפי הצורך" },
        { en: "Only between adapters", he: "רק בין adapters" }
      ],
      answer: 1,
      explain: { en: "The domain defines ports (interfaces) and knows nothing about Postgres or HTTP; adapters depend on the domain and implement those ports.", he: "ה-domain מגדיר ports (interfaces) ולא יודע כלום על Postgres או HTTP; ה-adapters תלויים ב-domain ומממשים את ה-ports." }
    },
    {
      q: { en: "Services that must always be deployed together and share one database are called…", he: "שירותים שחייבים תמיד לעלות יחד וחולקים database אחד נקראים…" },
      options: [
        { en: "A modular monolith", he: "Modular monolith" },
        { en: "A distributed monolith", he: "Distributed monolith" },
        { en: "Cell-based architecture", he: "ארכיטקטורת cells" },
        { en: "Service mesh", he: "Service mesh" }
      ],
      answer: 1,
      explain: { en: "A distributed monolith has the coupling of a monolith plus the network costs of services — the worst of both.", he: "Distributed monolith הוא הצימוד של מונוליט ועוד עלויות הרשת של שירותים — הגרוע משני העולמות." }
    },
    {
      q: { en: "Which style fits a product where customers install their own extensions (like an IDE)?", he: "איזה סגנון מתאים למוצר שבו הלקוחות מתקינים הרחבות משלהם (כמו IDE)?" },
      options: [
        { en: "Space-based", he: "Space-based" },
        { en: "Pipeline", he: "Pipeline" },
        { en: "Microkernel / plugin", he: "Microkernel / plugin" },
        { en: "Layered", he: "Layered" }
      ],
      answer: 2,
      explain: { en: "A microkernel keeps a small stable core and a plugin API — VS Code, Jenkins and Kubernetes CRDs work this way.", he: "Microkernel שומר core קטן ויציב ו-plugin API — כך עובדים VS Code, Jenkins ו-CRDs ב-Kubernetes." }
    }
  ],
  related: ["pr-ddd", "arch-monolith-vs-microservices", "staff-cells-blast-radius", "cloud-serverless", "arch-event-driven", "pr-scaling-kinds", "staff-design-docs"]
});

INFRA.glossary.push(
  { term: "Bounded context", track: "principal", def: { en: "A boundary inside which one domain model and its language are consistent; the natural unit for a module or service.", he: "גבול שבתוכו מודל דומיין אחד והשפה שלו עקביים; היחידה הטבעית למודול או שירות." }, lesson: "pr-ddd" },
  { term: "Ubiquitous language", track: "principal", def: { en: "The shared vocabulary of developers and domain experts within a bounded context, used directly in the code.", he: "אוצר המילים המשותף של מפתחים ואנשי דומיין בתוך bounded context, שמופיע ישירות בקוד." }, lesson: "pr-ddd" },
  { term: "Aggregate", track: "principal", def: { en: "A cluster of domain objects changed together in one transaction, accessed only through its root, which enforces the invariants.", he: "אשכול של אובייקטי דומיין שמשתנים יחד בטרנזקציה אחת, נגישים רק דרך ה-root שאוכף את ה-invariants." }, lesson: "pr-ddd" },
  { term: "Value object", track: "principal", def: { en: "An immutable domain object defined only by its values (Money, Address), compared by value, with no identity.", he: "אובייקט דומיין immutable שמוגדר רק לפי הערכים שלו (Money, Address), משווים לפי ערך, בלי זהות." }, lesson: "pr-ddd" },
  { term: "Event storming", track: "principal", def: { en: "A workshop where engineers and domain experts map domain events on a timeline to discover aggregates and bounded contexts.", he: "סדנה שבה מהנדסים ואנשי דומיין ממפים domain events על ציר זמן כדי לגלות aggregates ו-bounded contexts." }, lesson: "pr-ddd" },
  { term: "Context map", track: "principal", def: { en: "A diagram of bounded contexts and their relationships (customer-supplier, conformist, ACL, shared kernel).", he: "תרשים של bounded contexts והקשרים ביניהם (customer-supplier, conformist, ACL, shared kernel)." }, lesson: "pr-ddd" },
  { term: "Hexagonal architecture", track: "principal", def: { en: "Ports & adapters: the domain core defines interfaces (ports) and infrastructure plugs in through adapters; dependencies point inward.", he: "Ports & adapters: ה-domain מגדיר interfaces (ports) והתשתית מתחברת דרך adapters; התלויות מצביעות פנימה." }, lesson: "pr-architecture-styles" },
  { term: "Architecture characteristics", track: "principal", def: { en: "The '-ilities' a system must optimize for (deployability, elasticity, fault isolation, cost…); pick the top 3 before choosing a style.", he: "ה-'ilities' שהמערכת צריכה לבצע להם אופטימיזציה (deployability, elasticity, fault isolation, עלות…); בוחרים את 3 החשובים לפני שבוחרים סגנון." }, lesson: "pr-architecture-styles" }
);
