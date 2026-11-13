window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — code design: SOLID, GoF patterns, singletons, cloud patterns */

INFRA.lessons.push({
  id: "pr-solid",
  track: "principal",
  order: 30,
  icon: "🧱",
  level: 2,
  minutes: 16,
  title: { en: "SOLID (and Friends): Code That Survives Change", he: "SOLID (והחברים): קוד ששורד שינויים" },
  tldr: {
    en: "SOLID is five rules for keeping the cost of change low: one reason to change, extend without editing, honest substitutes, small interfaces, depend on abstractions — and the same five rules scale up to services and whole platforms.",
    he: "SOLID הם חמישה כללים שמחזיקים את מחיר השינוי נמוך: סיבה אחת לשינוי, להרחיב בלי לערוך, תחליפים ישרים, interfaces קטנים, תלות באבסטרקציות — ואותם חמישה כללים עובדים גם ברמת services ופלטפורמות שלמות."
  },
  analogy: {
    en: "Think of a well-run restaurant kitchen. Each cook owns one station (S). You add a new dish by adding a recipe card, not by rebuilding the stove (O). Any certified sous-chef can cover a shift without the head chef noticing (L). The dishwasher gets a dishwasher's checklist, not the 40-page kitchen manual (I). And the head chef orders 'a fridge that keeps 4°C', not 'the Samsung RT38 in aisle 3' — so the fridge can be swapped (D).",
    he: "תחשבו על מטבח מסעדה שמתנהל טוב. כל טבח אחראי על עמדה אחת (S). מוסיפים מנה חדשה ע\"י כרטיס מתכון חדש, לא בונים מחדש את הכיריים (O). כל סו-שף מוסמך יכול להחליף משמרת בלי שהשף הראשי ירגיש (L). שוטף הכלים מקבל צ'קליסט של שוטף כלים, לא את המדריך של 40 עמודים (I). והשף הראשי מזמין 'מקרר ששומר על 4°C', לא 'ה-Samsung RT38 במעבר 3' — כך שאפשר להחליף מקרר (D)."
  },
  sections: [
    {
      h: { en: "S — Single Responsibility: one reason to change", he: "S — Single Responsibility: סיבה אחת לשינוי" },
      body: {
        en: `<p>"A module should have one, and only one, <em>reason to change</em>" — i.e. it should answer to one actor (finance, ops, the UI team). It's not "do one thing"; it's "don't let two different stakeholders' changes collide in the same file".</p>
<pre>// ❌ Before: 3 reasons to change in one class (pricing rules, persistence, email copy)
class InvoiceService {
  calculateTotal(inv: Invoice): number { /* tax rules - finance */ }
  saveToPostgres(inv: Invoice): void   { /* SQL - DBA / infra */ }
  emailCustomer(inv: Invoice): void    { /* HTML template - marketing */ }
}

// ✅ After: each class answers to one actor
class InvoiceCalculator { total(inv: Invoice): Money { /* ... */ } }
class InvoiceRepository { save(inv: Invoice): Promise&lt;void&gt; { /* ... */ } }
class InvoiceMailer     { send(inv: Invoice): Promise&lt;void&gt; { /* ... */ } }</pre>
<p><strong>At service scale</strong>: SRP ≈ a microservice owns one business capability and one team. A "user-and-billing-and-notifications" service means three teams merge-fighting and deploying together. The org-chart version is Conway's law: design boundaries along ownership.</p>
<blockquote>💡 Real world: A good smell test — describe the class/service in one sentence without using "and". If the git log shows unrelated teams touching the same file every week, SRP is broken.</blockquote>`,
        he: `<p>"למודול צריכה להיות סיבה אחת, ורק אחת, <em>להשתנות</em>" — כלומר הוא עונה לגורם אחד (כספים, ops, צוות ה-UI). זה לא "תעשה דבר אחד"; זה "אל תיתן לשינויים של שני בעלי עניין שונים להתנגש באותו קובץ".</p>
<pre>// ❌ Before: 3 reasons to change in one class (pricing rules, persistence, email copy)
class InvoiceService {
  calculateTotal(inv: Invoice): number { /* tax rules - finance */ }
  saveToPostgres(inv: Invoice): void   { /* SQL - DBA / infra */ }
  emailCustomer(inv: Invoice): void    { /* HTML template - marketing */ }
}

// ✅ After: each class answers to one actor
class InvoiceCalculator { total(inv: Invoice): Money { /* ... */ } }
class InvoiceRepository { save(inv: Invoice): Promise&lt;void&gt; { /* ... */ } }
class InvoiceMailer     { send(inv: Invoice): Promise&lt;void&gt; { /* ... */ } }</pre>
<p><strong>ברמת service</strong>: SRP ≈ microservice שמחזיק יכולת עסקית אחת וצוות אחד. Service של "users-וגם-billing-וגם-notifications" אומר שלושה צוותים שנלחמים על merges ועושים deploy ביחד. הגרסה הארגונית היא חוק Conway: מעצבים גבולות לפי בעלות.</p>
<blockquote>💡 מהשטח: מבחן ריח טוב — תתארו את ה-class/service במשפט אחד בלי המילה "וגם". אם ב-git log רואים צוותים לא קשורים נוגעים באותו קובץ כל שבוע, SRP שבור.</blockquote>`
      }
    },
    {
      h: { en: "O — Open/Closed and L — Liskov Substitution", he: "O — Open/Closed ו-L — Liskov Substitution" },
      body: {
        en: `<p><strong>Open/Closed</strong>: open for extension, closed for modification. Adding a new payment provider should mean <em>adding</em> a class, not editing a 300-line <code>switch</code> that every provider shares (and every release can break).</p>
<pre># ❌ Before: every new provider edits this function
def charge(provider, amount):
    if provider == "stripe":   ...
    elif provider == "paypal": ...
    elif provider == "adyen":  ...   # edit #3, regression risk for #1 and #2

# ✅ After: a registry of strategies — add, don't edit
class PaymentProvider(Protocol):
    def charge(self, amount: int) -&gt; str: ...

PROVIDERS: dict[str, PaymentProvider] = {"stripe": Stripe(), "paypal": PayPal()}
PROVIDERS["adyen"] = Adyen()          # new file + one registration line

def charge(provider: str, amount: int) -&gt; str:
    return PROVIDERS[provider].charge(amount)</pre>
<p>Infra version: Kubernetes is OCP by design — you extend it with CRDs, admission webhooks, CSI/CNI plugins and operators, never by forking the API server. Same for nginx/Envoy filters and Terraform providers.</p>
<p><strong>Liskov Substitution</strong>: a subtype must be usable anywhere its base type is, <em>without surprises</em> — same preconditions or weaker, same postconditions or stronger, no new exceptions. The classic violation: <code>Square extends Rectangle</code> — setting width silently changes height, breaking every caller that assumed independence.</p>
<pre>// ❌ LSP violation: a "read-only" storage that throws on write
class S3Storage implements Storage { put(k, v) {...}; get(k) {...} }
class ReadOnlyArchive implements Storage {
  put(k, v) { throw new Error("not supported"); }   // callers explode at runtime
  get(k) {...}
}
// ✅ Split the contract: Reader { get } and Writer { put }; Archive implements only Reader</pre>
<blockquote>💡 Real world: LSP at the service level is <strong>API compatibility</strong>. A v2 that still accepts v1 requests but returns a 500 for a field v1 clients always send is an LSP break. Every S3-compatible store (MinIO, R2, Ceph) lives or dies by how well it substitutes for S3 — the edge cases (eventual listing, multipart limits, error codes) are exactly where substitution fails.</blockquote>`,
        he: `<p><strong>Open/Closed</strong>: פתוח להרחבה, סגור לשינוי. הוספת ספק תשלומים חדש צריכה להיות <em>הוספה</em> של class, לא עריכה של <code>switch</code> של 300 שורות שכל הספקים חולקים (וכל release יכול לשבור).</p>
<pre># ❌ Before: every new provider edits this function
def charge(provider, amount):
    if provider == "stripe":   ...
    elif provider == "paypal": ...
    elif provider == "adyen":  ...   # edit #3, regression risk for #1 and #2

# ✅ After: a registry of strategies — add, don't edit
class PaymentProvider(Protocol):
    def charge(self, amount: int) -&gt; str: ...

PROVIDERS: dict[str, PaymentProvider] = {"stripe": Stripe(), "paypal": PayPal()}
PROVIDERS["adyen"] = Adyen()          # new file + one registration line

def charge(provider: str, amount: int) -&gt; str:
    return PROVIDERS[provider].charge(amount)</pre>
<p>גרסת התשתית: Kubernetes בנוי OCP — מרחיבים אותו עם CRDs, admission webhooks, plugins של CSI/CNI ו-operators, אף פעם לא ע"י fork ל-API server. אותו דבר ב-filters של nginx/Envoy וב-providers של Terraform.</p>
<p><strong>Liskov Substitution</strong>: תת-טיפוס חייב להיות שמיש בכל מקום שטיפוס הבסיס שמיש, <em>בלי הפתעות</em> — אותם preconditions או חלשים יותר, אותם postconditions או חזקים יותר, בלי exceptions חדשים. ההפרה הקלאסית: <code>Square extends Rectangle</code> — קביעת הרוחב משנה בשקט את הגובה, ושוברת כל caller שהניח שהם בלתי תלויים.</p>
<pre>// ❌ LSP violation: a "read-only" storage that throws on write
class S3Storage implements Storage { put(k, v) {...}; get(k) {...} }
class ReadOnlyArchive implements Storage {
  put(k, v) { throw new Error("not supported"); }   // callers explode at runtime
  get(k) {...}
}
// ✅ Split the contract: Reader { get } and Writer { put }; Archive implements only Reader</pre>
<blockquote>💡 מהשטח: LSP ברמת service זה <strong>תאימות API</strong>. v2 שעדיין מקבל בקשות v1 אבל מחזיר 500 על שדה שלקוחות v1 תמיד שולחים — זו שבירת LSP. כל storage שתואם S3 (MinIO, R2, Ceph) חי או מת לפי כמה טוב הוא מחליף את S3 — מקרי הקצה (listing עם eventual consistency, מגבלות multipart, קודי שגיאה) הם בדיוק המקום שבו ההחלפה נכשלת.</blockquote>`
      }
    },
    {
      h: { en: "I — Interface Segregation and D — Dependency Inversion", he: "I — Interface Segregation ו-D — Dependency Inversion" },
      body: {
        en: `<p><strong>Interface Segregation</strong>: clients shouldn't depend on methods they don't use. A fat <code>IRepository</code> with 25 methods forces every fake in every test to stub 25 methods, and every change recompiles/redeploys every consumer.</p>
<pre>// ❌ Fat interface
interface IUserStore { Get(id); Find(q); Create(u); Update(u); Delete(id); Export(); Import(); Audit(); }
// ✅ Role interfaces — consumers pick what they need
interface IUserReader { User Get(string id); IEnumerable&lt;User&gt; Find(Query q); }
interface IUserWriter { void Create(User u); void Update(User u); }
class ReportJob(IUserReader users) { ... }   // can't accidentally write</pre>
<p>Infra version: don't expose one giant "platform API"; expose focused APIs (or GraphQL/BFF per client). In IAM, it's least privilege: a role per need, not <code>*:*</code>.</p>
<p><strong>Dependency Inversion</strong>: high-level policy (business rules) must not depend on low-level details (Postgres, Kafka, Twilio). Both depend on an abstraction <em>owned by the high-level side</em>. This is the heart of <strong>Hexagonal / Ports &amp; Adapters / Clean Architecture</strong>.</p>
<pre># Port (owned by the domain)
class Notifier(Protocol):
    def notify(self, user_id: str, text: str) -&gt; None: ...

# Domain logic depends only on the port
class OrderService:
    def __init__(self, notifier: Notifier): self.notifier = notifier
    def place(self, order):
        ...  # business rules
        self.notifier.notify(order.user_id, "Order placed")

# Adapters (details) plug in at the edge — composition root
OrderService(TwilioSmsNotifier(api_key))      # prod
OrderService(FakeNotifier())                  # unit test, no network</pre>
<blockquote>⚠️ Production tip: DIP is what makes migrations cheap. Teams that wrapped their queue behind a <code>MessagePublisher</code> port moved RabbitMQ → Kafka by writing one adapter. Teams that sprinkled <code>pika.basic_publish</code> across 200 files rewrote 200 files.</blockquote>`,
        he: `<p><strong>Interface Segregation</strong>: לקוחות לא צריכים להיות תלויים במתודות שהם לא משתמשים בהן. <code>IRepository</code> שמן עם 25 מתודות מכריח כל fake בכל טסט לממש 25 מתודות, וכל שינוי גורם ל-recompile/redeploy לכל צרכן.</p>
<pre>// ❌ Fat interface
interface IUserStore { Get(id); Find(q); Create(u); Update(u); Delete(id); Export(); Import(); Audit(); }
// ✅ Role interfaces — consumers pick what they need
interface IUserReader { User Get(string id); IEnumerable&lt;User&gt; Find(Query q); }
interface IUserWriter { void Create(User u); void Update(User u); }
class ReportJob(IUserReader users) { ... }   // can't accidentally write</pre>
<p>גרסת התשתית: לא חושפים "platform API" ענק אחד; חושפים APIs ממוקדים (או GraphQL/BFF לכל סוג לקוח). ב-IAM זה least privilege: role לכל צורך, לא <code>*:*</code>.</p>
<p><strong>Dependency Inversion</strong>: מדיניות ברמה גבוהה (חוקים עסקיים) לא תלויה בפרטים ברמה נמוכה (Postgres, Kafka, Twilio). שניהם תלויים באבסטרקציה <em>שבבעלות הצד הגבוה</em>. זה הלב של <strong>Hexagonal / Ports &amp; Adapters / Clean Architecture</strong>.</p>
<pre># Port (owned by the domain)
class Notifier(Protocol):
    def notify(self, user_id: str, text: str) -&gt; None: ...

# Domain logic depends only on the port
class OrderService:
    def __init__(self, notifier: Notifier): self.notifier = notifier
    def place(self, order):
        ...  # business rules
        self.notifier.notify(order.user_id, "Order placed")

# Adapters (details) plug in at the edge — composition root
OrderService(TwilioSmsNotifier(api_key))      # prod
OrderService(FakeNotifier())                  # unit test, no network</pre>
<blockquote>⚠️ טיפ לפרודקשן: DIP זה מה שהופך מיגרציות לזולות. צוותים שעטפו את ה-queue מאחורי port בשם <code>MessagePublisher</code> עברו מ-RabbitMQ ל-Kafka ע"י כתיבת adapter אחד. צוותים שפיזרו <code>pika.basic_publish</code> ב-200 קבצים — שכתבו 200 קבצים.</blockquote>`
      }
    },
    {
      h: { en: "The friends: DRY, KISS, YAGNI, composition, cohesion, Demeter", he: "החברים: DRY, KISS, YAGNI, composition, cohesion, Demeter" },
      body: {
        en: `<table>
<tr><th>Principle</th><th>Means</th><th>Analogy</th><th>Trap</th></tr>
<tr><td><strong>DRY</strong></td><td>Every piece of <em>knowledge</em> has one authoritative place</td><td>One master copy of the recipe</td><td>Merging code that only <em>looks</em> alike → wrong abstraction. Rule of three: abstract on the 3rd copy.</td></tr>
<tr><td><strong>KISS</strong></td><td>Simplest thing that meets the requirement</td><td>A hammer, not a Swiss army knife</td><td>"Simple" ≠ "easy for me today"</td></tr>
<tr><td><strong>YAGNI</strong></td><td>Don't build for imagined futures</td><td>Don't buy a 10-seat van "in case"</td><td>Still design seams (DIP) so the future is cheap</td></tr>
<tr><td><strong>Composition over inheritance</strong></td><td>Build behavior by holding parts, not by deep class trees</td><td>LEGO vs a carved statue</td><td>Inheritance is fine for true is-a with stable bases</td></tr>
<tr><td><strong>High cohesion, low coupling</strong></td><td>Things that change together live together; modules know little about each other</td><td>A team that sits together; teams talk via APIs</td><td>Microservices with chatty sync calls = distributed monolith</td></tr>
<tr><td><strong>Law of Demeter</strong></td><td>Talk to friends, not friends of friends</td><td>Ask the waiter, don't reach into the kitchen</td><td><code>order.getCustomer().getAddress().getCity()</code></td></tr>
</table>
<p><strong>Coupling at system scale</strong>: shared databases between services (the worst), synchronous call chains, shared libraries with business logic, and lockstep deployments. Cohesion at system scale: a bounded context (DDD) — one model, one language, one team.</p>
<blockquote>💡 Real world: "Duplication is far cheaper than the wrong abstraction" (Sandi Metz). Two services with similar validation code are fine; a shared "common-utils" library that 40 services pin to different versions is the coupling that blocks every upgrade.</blockquote>`,
        he: `<table>
<tr><th>עיקרון</th><th>משמעות</th><th>אנלוגיה</th><th>מלכודת</th></tr>
<tr><td><strong>DRY</strong></td><td>לכל פיסת <em>ידע</em> יש מקום סמכותי אחד</td><td>עותק מאסטר אחד של המתכון</td><td>איחוד קוד שרק <em>נראה</em> דומה → אבסטרקציה שגויה. כלל השלוש: מפשטים בעותק השלישי.</td></tr>
<tr><td><strong>KISS</strong></td><td>הדבר הכי פשוט שעונה על הדרישה</td><td>פטיש, לא אולר שוויצרי</td><td>"פשוט" ≠ "קל לי היום"</td></tr>
<tr><td><strong>YAGNI</strong></td><td>לא בונים לעתיד דמיוני</td><td>לא קונים ואן של 10 מקומות "ליתר ביטחון"</td><td>עדיין משאירים תפרים (DIP) כדי שהעתיד יהיה זול</td></tr>
<tr><td><strong>Composition over inheritance</strong></td><td>בונים התנהגות ע"י הרכבת חלקים, לא עצי ירושה עמוקים</td><td>LEGO מול פסל מגולף</td><td>ירושה בסדר ל-is-a אמיתי עם בסיס יציב</td></tr>
<tr><td><strong>High cohesion, low coupling</strong></td><td>מה שמשתנה ביחד גר ביחד; מודולים יודעים מעט אחד על השני</td><td>צוות שיושב יחד; צוותים מדברים דרך APIs</td><td>Microservices עם קריאות sync פטפטניות = distributed monolith</td></tr>
<tr><td><strong>Law of Demeter</strong></td><td>מדברים עם חברים, לא עם חברים של חברים</td><td>שואלים את המלצר, לא נכנסים למטבח</td><td><code>order.getCustomer().getAddress().getCity()</code></td></tr>
</table>
<p><strong>Coupling ברמת מערכת</strong>: DB משותף בין services (הכי גרוע), שרשראות קריאות סינכרוניות, ספריות משותפות עם לוגיקה עסקית, ו-deployments שחייבים לצאת ביחד. Cohesion ברמת מערכת: bounded context (DDD) — מודל אחד, שפה אחת, צוות אחד.</p>
<blockquote>💡 מהשטח: "שכפול זול בהרבה מאבסטרקציה שגויה" (Sandi Metz). שני services עם קוד ולידציה דומה — זה בסדר; ספריית "common-utils" ש-40 services נועלים על גרסאות שונות שלה — זה ה-coupling שחוסם כל שדרוג.</blockquote>`
      }
    },
    {
      h: { en: "When SOLID is overkill — the principal's judgment", he: "מתי SOLID זה overkill — שיקול הדעת של Principal" },
      body: {
        en: `<p>SOLID is a tool for managing <em>change</em>. Where there's little change, it's ceremony:</p>
<ul>
<li><strong>Scripts, one-off migrations, spikes</strong>: a 200-line procedural script is the right design. Interfaces with one implementation that will never have a second are noise.</li>
<li><strong>Early product discovery</strong>: you don't know the axes of change yet. Abstracting now guesses wrong. Keep it simple, keep it tested, refactor when the second use case appears.</li>
<li><strong>Hot paths</strong>: virtual dispatch, allocations from small objects, and indirection can matter in a 1M-ops/sec inner loop. Measure first.</li>
</ul>
<p>Where SOLID pays off massively: long-lived core domains, shared platforms with many consumers, anything with external integrations (payments, messaging, cloud providers), and code that many teams touch.</p>
<pre>Decision heuristic
  Will this change for different reasons/actors?     -&gt; split (S)
  Do we add variants regularly (providers, formats)? -&gt; strategy/registry (O)
  Is there an external system behind it?             -&gt; port + adapter (D)
  Only one impl, no tests need a fake, short-lived?  -&gt; keep it concrete (YAGNI)</pre>
<blockquote>⚠️ Production tip: In design reviews, ask "what change are we protecting against?" If nobody can name a likely change, the abstraction is speculative. If the answer is "swapping the vendor" or "testing without the network", it earns its keep.</blockquote>`,
        he: `<p>SOLID הוא כלי לניהול <em>שינוי</em>. איפה שאין הרבה שינוי, זה טקס:</p>
<ul>
<li><strong>סקריפטים, מיגרציות חד-פעמיות, spikes</strong>: סקריפט פרוצדורלי של 200 שורות הוא העיצוב הנכון. Interfaces עם מימוש אחד שלעולם לא יהיה לו שני — רעש.</li>
<li><strong>שלב גילוי מוקדם של מוצר</strong>: עוד לא יודעים על אילו צירים דברים ישתנו. אבסטרקציה עכשיו תנחש לא נכון. שומרים פשוט, עם טסטים, ועושים refactor כשמגיע ה-use case השני.</li>
<li><strong>Hot paths</strong>: virtual dispatch, הקצאות של אובייקטים קטנים ו-indirection יכולים להשפיע בלולאה פנימית של 1M פעולות לשנייה. קודם מודדים.</li>
</ul>
<p>איפה SOLID משתלם בגדול: core domains ארוכי חיים, פלטפורמות משותפות עם הרבה צרכנים, כל דבר עם אינטגרציות חיצוניות (תשלומים, הודעות, ספקי ענן), וקוד שהרבה צוותים נוגעים בו.</p>
<pre>Decision heuristic
  Will this change for different reasons/actors?     -&gt; split (S)
  Do we add variants regularly (providers, formats)? -&gt; strategy/registry (O)
  Is there an external system behind it?             -&gt; port + adapter (D)
  Only one impl, no tests need a fake, short-lived?  -&gt; keep it concrete (YAGNI)</pre>
<blockquote>⚠️ טיפ לפרודקשן: ב-design reviews תשאלו "מאיזה שינוי אנחנו מתגוננים?" אם אף אחד לא יכול לנקוב בשינוי סביר — האבסטרקציה ספקולטיבית. אם התשובה היא "החלפת ספק" או "טסטים בלי רשת" — היא מצדיקה את עצמה.</blockquote>`
      }
    }
  ],
  diagram: `Hexagonal (Ports & Adapters) = DIP applied to a whole service

   [REST controller]  [Kafka consumer]   <- driving adapters
            \\             /
             v           v
        +---------------------+
        |   DOMAIN / USE CASES |   depends ONLY on ports
        |   OrderService       |
        |  port: Notifier      |---> [TwilioSmsAdapter] [FakeNotifier]
        |  port: OrderRepo     |---> [PostgresRepo]     [InMemoryRepo]
        +---------------------+      driven adapters (swap freely)

 S: one actor per module   O: add adapters, don't edit domain
 L: every adapter honors the port contract
 I: small ports            D: arrows point INTO the domain`,
  handsOn: [
    { cmd: "git log --format='%an' -- src/services/InvoiceService.ts | sort | uniq -c | sort -rn", what: { en: "SRP smell test: how many different people/teams change this one file? Many unrelated authors = multiple reasons to change.", he: "מבחן ריח ל-SRP: כמה אנשים/צוותים שונים משנים את הקובץ הזה? הרבה כותבים לא קשורים = כמה סיבות לשינוי." } },
    { cmd: "grep -rn \"elif provider ==\\|case \\\"\" src/ | wc -l", what: { en: "Find OCP violations: long if/elif/switch chains on a type code are candidates for a strategy registry.", he: "מוצאים הפרות OCP: שרשראות if/elif/switch ארוכות על קוד סוג הן מועמדות ל-strategy registry." } },
    { cmd: "python -c \"from typing import Protocol\nclass N(Protocol):\n  def notify(self,u:str,t:str)->None: ...\nclass Fake:\n  def __init__(s): s.sent=[]\n  def notify(s,u,t): s.sent.append((u,t))\nf=Fake(); f.notify('u1','hi'); print(f.sent)\"", what: { en: "DIP in 6 lines: a port (Protocol) and a fake adapter you can assert on in a unit test — no network, no mocks library.", he: "DIP ב-6 שורות: port (Protocol) ו-fake adapter שאפשר לבדוק עליו ב-unit test — בלי רשת, בלי ספריית mocks." } },
    { cmd: "npx madge --circular --extensions ts src/", what: { en: "Detect circular dependencies between modules — a sure sign of high coupling / broken layering.", he: "מזהים תלויות מעגליות בין מודולים — סימן בטוח ל-coupling גבוה / שכבות שבורות." } }
  ],
  mnemonic: {
    en: "SOLID = 'Single chef, Open menu, Loyal substitutes, Individual checklists, Depend on the fridge spec.' And DIP's arrows always point INTO the domain.",
    he: "SOLID = 'שף אחד לעמדה, תפריט פתוח, מחליפים נאמנים, צ'קליסט אישי, תלות במפרט המקרר.' והחצים של DIP תמיד מצביעים פנימה לדומיין."
  },
  pitfalls: [
    { en: "Interface-per-class ritual: IUserService with exactly one UserService and no fake in any test. That's indirection, not DIP — DIP is about who OWNS the abstraction and why.", he: "טקס interface-לכל-class: IUserService עם UserService אחד בדיוק ואף fake באף טסט. זה indirection, לא DIP — DIP עוסק במי שמחזיק את האבסטרקציה ולמה." },
    { en: "Over-DRYing: merging two similar-looking functions owned by different domains couples them forever; the next change for one breaks the other.", he: "Over-DRY: איחוד שתי פונקציות שנראות דומות אבל שייכות לדומיינים שונים מצמיד אותן לנצח; השינוי הבא באחת שובר את השנייה." },
    { en: "Reading SRP as 'one method per class' — leads to anemic, scattered code. It's about one actor / reason to change, not one function.", he: "לקרוא SRP כ'מתודה אחת ל-class' — מוביל לקוד מפוזר ואנמי. זה על גורם אחד / סיבה אחת לשינוי, לא פונקציה אחת." },
    { en: "Leaking adapter types through ports (returning a pgx.Row or a Stripe SDK object from the repository) — the domain is now coupled to the vendor anyway.", he: "דליפת טיפוסים של ה-adapter דרך ה-port (להחזיר pgx.Row או אובייקט של Stripe SDK מה-repository) — הדומיין שוב צמוד לספק." }
  ],
  interview: [
    { q: { en: "Explain Dependency Inversion and how it differs from Dependency Injection.", he: "תסביר Dependency Inversion ואיך הוא שונה מ-Dependency Injection." },
      a: { en: "Inversion is the design principle: high-level policy defines an abstraction (port) and low-level details implement it, so source-code dependencies point toward the domain. Injection is a technique for supplying the concrete implementation from outside (constructor params, a DI container). You can inject without inverting (injecting a concrete PostgresClient) and invert without a container (manual wiring in main). The payoff: swap vendors, test without infrastructure, isolate business rules.", he: "Inversion הוא עיקרון התכנון: המדיניות ברמה הגבוהה מגדירה אבסטרקציה (port) והפרטים ברמה הנמוכה מממשים אותה, כך שתלויות קוד המקור מצביעות לכיוון הדומיין. Injection היא טכניקה לספק את המימוש הקונקרטי מבחוץ (פרמטרים ב-constructor, DI container). אפשר להזריק בלי להפוך (להזריק PostgresClient קונקרטי) ולהפוך בלי container (חיווט ידני ב-main). הרווח: החלפת ספקים, טסטים בלי תשתית, בידוד חוקים עסקיים." } },
    { q: { en: "How do SOLID principles map to microservice architecture?", he: "איך עקרונות SOLID ממופים לארכיטקטורת microservices?" },
      a: { en: "S: one service per business capability/team. O: extend via events, plugins and new consumers rather than editing a central service. L: backward-compatible API versions — new versions must accept old clients. I: small focused APIs / BFFs instead of one giant API; least-privilege IAM. D: services depend on contracts (OpenAPI, protobuf, event schemas), not each other's databases or internals; anti-corruption layers at vendor boundaries.", he: "S: service אחד ליכולת עסקית/צוות. O: מרחיבים דרך events, plugins ו-consumers חדשים ולא ע\"י עריכת service מרכזי. L: גרסאות API תואמות לאחור — גרסה חדשה חייבת לקבל לקוחות ישנים. I: APIs קטנים וממוקדים / BFFs במקום API ענק; IAM עם least privilege. D: services תלויים בחוזים (OpenAPI, protobuf, event schemas), לא ב-DB או בפנים של השני; anti-corruption layers בגבול מול ספקים." } },
    { q: { en: "When would you deliberately NOT apply SOLID?", he: "מתי תבחר בכוונה לא להחיל SOLID?" },
      a: { en: "Short-lived or one-off code (scripts, migrations, spikes), early discovery when change axes are unknown, and measured hot paths where indirection costs. I'd still keep tests and a clear seam at external I/O, because that's the cheapest insurance; everything else waits for the rule of three.", he: "קוד קצר-חיים או חד-פעמי (סקריפטים, מיגרציות, spikes), שלב גילוי מוקדם כשצירי השינוי לא ידועים, ו-hot paths שמדדנו בהם שה-indirection עולה. עדיין הייתי שומר טסטים ותפר ברור ב-I/O חיצוני, כי זה הביטוח הכי זול; כל השאר מחכה לכלל השלוש." } }
  ],
  quiz: [
    { q: { en: "A class calculates tax, writes to Postgres and renders the email. Which principle is violated most directly?", he: "Class מחשב מס, כותב ל-Postgres ומרנדר את המייל. איזה עיקרון מופר הכי ישירות?" },
      options: [ { en: "Liskov Substitution", he: "Liskov Substitution" }, { en: "Single Responsibility", he: "Single Responsibility" }, { en: "Interface Segregation", he: "Interface Segregation" }, { en: "Law of Demeter", he: "Law of Demeter" } ],
      answer: 1, explain: { en: "Three different actors (finance, DBAs, marketing) have reasons to change it — classic SRP violation.", he: "לשלושה גורמים שונים (כספים, DBAs, שיווק) יש סיבות לשנות אותו — הפרת SRP קלאסית." } },
    { q: { en: "ReadOnlyArchive implements Storage but throws on put(). What breaks?", he: "ReadOnlyArchive מממש Storage אבל זורק ב-put(). מה נשבר?" },
      options: [ { en: "Open/Closed", he: "Open/Closed" }, { en: "DRY", he: "DRY" }, { en: "Liskov Substitution — it can't stand in for Storage", he: "Liskov Substitution — הוא לא יכול להחליף Storage" }, { en: "Nothing, throwing is fine", he: "כלום, לזרוק זה בסדר" } ],
      answer: 2, explain: { en: "Callers of Storage expect put() to work; a subtype that throws violates the contract. Split into Reader/Writer interfaces (also ISP).", he: "מי שקורא ל-Storage מצפה ש-put() יעבוד; תת-טיפוס שזורק מפר את החוזה. מפצלים ל-Reader/Writer (וגם ISP)." } },
    { q: { en: "In Dependency Inversion, who owns the Notifier interface?", he: "ב-Dependency Inversion, למי שייך ה-interface של Notifier?" },
      options: [ { en: "The Twilio SDK", he: "ה-SDK של Twilio" }, { en: "The domain/high-level module that uses it", he: "הדומיין/המודול ברמה הגבוהה שמשתמש בו" }, { en: "A shared common-utils library", he: "ספריית common-utils משותפת" }, { en: "The DI container", he: "ה-DI container" } ],
      answer: 1, explain: { en: "The high-level policy defines the port in its own terms; adapters implement it. That's what makes the arrow point inward.", he: "המדיניות ברמה הגבוהה מגדירה את ה-port במונחים שלה; adapters מממשים אותו. זה מה שגורם לחץ להצביע פנימה." } },
    { q: { en: "Two services have similar 10-line validation functions. Best default?", he: "לשני services יש פונקציית ולידציה דומה של 10 שורות. ברירת המחדל הכי טובה?" },
      options: [ { en: "Extract a shared library immediately (DRY)", he: "לחלץ מיד ספרייה משותפת (DRY)" }, { en: "Keep the duplication until a clear shared concept emerges (rule of three)", he: "להשאיר את השכפול עד שמתגבש מושג משותף ברור (כלל השלוש)" }, { en: "Merge the two services", he: "לאחד את שני ה-services" }, { en: "Move validation into the database", he: "להעביר ולידציה ל-database" } ],
      answer: 1, explain: { en: "Cross-service shared libraries create version coupling. Duplication is cheaper than the wrong abstraction.", he: "ספריות משותפות בין services יוצרות coupling של גרסאות. שכפול זול יותר מאבסטרקציה שגויה." } }
  ],
  related: ["pr-design-patterns", "pr-cloud-patterns", "pr-test-strategy", "arch-monolith-vs-microservices"]
});

INFRA.lessons.push({
  id: "pr-design-patterns",
  track: "principal",
  order: 31,
  icon: "🧩",
  level: 2,
  minutes: 20,
  title: { en: "Design Patterns That Matter (GoF + DI, Repository, Unit of Work)", he: "Design Patterns שבאמת חשובים (GoF + DI, Repository, Unit of Work)" },
  tldr: {
    en: "Patterns are named solutions to recurring problems: creational patterns control HOW objects are made, structural patterns control how they're WRAPPED and connected, behavioral patterns control who DOES what — and every one of them is already hiding in your infrastructure.",
    he: "Patterns הם פתרונות עם שם לבעיות חוזרות: creational שולטים ב-איך אובייקטים נוצרים, structural ב-איך עוטפים ומחברים אותם, behavioral ב-מי עושה מה — וכל אחד מהם כבר מסתתר בתשתית שלכם."
  },
  analogy: {
    en: "Patterns are like chess openings. Nobody invents the Sicilian Defense at the board — you recognize the position and reach for a known, battle-tested response, and you can say 'Sicilian' to another player and they instantly understand five moves of intent. Saying 'put a Decorator around the client for retries' in a design review does the same thing: one word, a whole structure, shared understanding.",
    he: "Patterns הם כמו פתיחות בשחמט. אף אחד לא ממציא את ההגנה הסיציליאנית ליד הלוח — מזהים את העמדה ומושיטים יד לתגובה מוכרת שנבדקה בקרב, ואפשר להגיד 'סיציליאנית' לשחקן אחר והוא מבין מיד חמישה מהלכים של כוונה. להגיד ב-design review 'שים Decorator סביב ה-client בשביל retries' עושה בדיוק את זה: מילה אחת, מבנה שלם, הבנה משותפת."
  },
  sections: [
    {
      h: { en: "Creational: how objects get made", he: "Creational: איך אובייקטים נוצרים" },
      body: {
        en: `<ul>
<li><strong>Factory Method</strong> — let a function/subclass decide which concrete class to create. <em>Analogy</em>: you order "a coffee", the barista decides the machine. <em>Infra</em>: <code>boto3.client("s3")</code>, <code>sql.Open("postgres", dsn)</code> — the driver registry picks the implementation.</li>
<li><strong>Abstract Factory</strong> — create <em>families</em> of related objects that must match. <em>Analogy</em>: IKEA collections — all pieces in the same style. <em>Infra</em>: a cloud-provider factory that returns a matching Storage + Queue + Secrets trio for AWS vs GCP; test vs prod fixtures.</li>
<li><strong>Builder</strong> — construct complex objects step by step, with readable optional params. <em>Analogy</em>: the Subway sandwich line. <em>Infra</em>: HTTP request builders, fluent k8s clients, protobuf builders.</li>
<li><strong>Prototype</strong> — create by cloning a configured instance. <em>Analogy</em>: photocopy a filled-in form and change the name. <em>Infra</em>: VM golden images / AMIs, the Pod template in a Deployment, <code>copy.deepcopy(base_config)</code>.</li>
<li><strong>Singleton</strong> — exactly one instance. Deep dive (and why it's often an anti-pattern): <code>#/lesson/pr-singletons</code>.</li>
</ul>
<pre>// Builder (TypeScript) — no 9-argument constructor, no "null, null, true" at call sites
const req = new HttpRequestBuilder("https://api.pay.example/charges")
  .method("POST")
  .header("Idempotency-Key", key)
  .timeoutMs(2000)
  .retries(3)
  .json({ amountCents: 1290, currency: "ILS" })
  .build();

# Factory Method (Python) — callers never import the concrete class
def make_storage(url: str) -&gt; Storage:
    scheme = url.split("://")[0]
    return {"s3": S3Storage, "gs": GcsStorage, "file": LocalStorage}[scheme](url)</pre>`,
        he: `<ul>
<li><strong>Factory Method</strong> — פונקציה/subclass מחליטים איזה class קונקרטי ליצור. <em>אנלוגיה</em>: מזמינים "קפה", הבריסטה מחליט על המכונה. <em>בתשתית</em>: <code>boto3.client("s3")</code>, <code>sql.Open("postgres", dsn)</code> — ה-registry של ה-drivers בוחר מימוש.</li>
<li><strong>Abstract Factory</strong> — יוצר <em>משפחות</em> של אובייקטים קשורים שחייבים להתאים. <em>אנלוגיה</em>: קולקציות של IKEA — כל החלקים באותו סגנון. <em>בתשתית</em>: factory לספק ענן שמחזיר שלישייה תואמת של Storage + Queue + Secrets ל-AWS מול GCP; fixtures של טסט מול פרוד.</li>
<li><strong>Builder</strong> — בונים אובייקט מורכב צעד אחר צעד, עם פרמטרים אופציונליים קריאים. <em>אנלוגיה</em>: הפס של Subway. <em>בתשתית</em>: builders של בקשות HTTP, clients של k8s בסגנון fluent, builders של protobuf.</li>
<li><strong>Prototype</strong> — יוצרים ע"י שכפול של מופע מוגדר. <em>אנלוגיה</em>: מצלמים טופס ממולא ומשנים את השם. <em>בתשתית</em>: golden images / AMIs, ה-Pod template ב-Deployment, <code>copy.deepcopy(base_config)</code>.</li>
<li><strong>Singleton</strong> — מופע אחד בדיוק. צלילה לעומק (ולמה זה לעתים קרובות anti-pattern): <code>#/lesson/pr-singletons</code>.</li>
</ul>
<pre>// Builder (TypeScript) — no 9-argument constructor, no "null, null, true" at call sites
const req = new HttpRequestBuilder("https://api.pay.example/charges")
  .method("POST")
  .header("Idempotency-Key", key)
  .timeoutMs(2000)
  .retries(3)
  .json({ amountCents: 1290, currency: "ILS" })
  .build();

# Factory Method (Python) — callers never import the concrete class
def make_storage(url: str) -&gt; Storage:
    scheme = url.split("://")[0]
    return {"s3": S3Storage, "gs": GcsStorage, "file": LocalStorage}[scheme](url)</pre>`
      }
    },
    {
      h: { en: "Structural: wrapping and connecting", he: "Structural: עטיפה וחיבור" },
      body: {
        en: `<ul>
<li><strong>Adapter</strong> — convert one interface into another the client expects. <em>Analogy</em>: a travel plug adapter. <em>Infra</em>: adapters in hexagonal architecture; a Prometheus exporter adapting a legacy app's stats to <code>/metrics</code>; S3-compatible gateways.</li>
<li><strong>Decorator</strong> — wrap an object to add behavior, same interface. <em>Analogy</em>: a phone case — still a phone, now shockproof. <em>Infra</em>: retry/timeout/metrics/caching wrappers around a client; Python <code>@retry</code>, <code>@lru_cache</code>; Go <code>http.RoundTripper</code> chains.</li>
<li><strong>Facade</strong> — one simple front door to a complex subsystem. <em>Analogy</em>: a hotel concierge. <em>Infra</em>: an internal platform CLI (<code>platform deploy</code>) hiding Helm + Argo + Vault; an API gateway.</li>
<li><strong>Proxy</strong> — a stand-in that controls access to the real object (lazy, auth, remote, caching). <em>Analogy</em>: a lawyer speaking for you. <em>Infra</em>: ORM lazy-loading proxies (Hibernate, SQLAlchemy), gRPC client stubs, Envoy sidecars, CDNs.</li>
<li><strong>Composite</strong> — treat a tree of objects and a single object uniformly. <em>Analogy</em>: a folder is "a file that contains files". <em>Infra</em>: Terraform modules of modules, aggregated health checks, React component trees.</li>
</ul>
<pre># Decorator (Python) — retries without touching the client
def with_retries(fn, attempts=3, base=0.1):
    def wrapper(*a, **kw):
        for i in range(attempts):
            try:
                return fn(*a, **kw)
            except TransientError:
                if i == attempts - 1: raise
                time.sleep(base * 2 ** i + random.random() * base)   # backoff + jitter
    return wrapper

client.get = with_retries(with_metrics(client.get, "inventory_get"))</pre>
<blockquote>💡 Real world: Adapter, Decorator and Proxy all "wrap". The difference is intent: Adapter <em>changes</em> the interface, Decorator <em>adds behavior</em> with the same interface, Proxy <em>controls access</em> with the same interface.</blockquote>`,
        he: `<ul>
<li><strong>Adapter</strong> — ממיר interface אחד לאחר שהלקוח מצפה לו. <em>אנלוגיה</em>: מתאם שקע לחו"ל. <em>בתשתית</em>: ה-adapters בארכיטקטורה הקסגונלית; Prometheus exporter שמתאים סטטיסטיקות של אפליקציה ישנה ל-<code>/metrics</code>; gateways שתואמים S3.</li>
<li><strong>Decorator</strong> — עוטף אובייקט ומוסיף התנהגות, אותו interface. <em>אנלוגיה</em>: כיסוי לטלפון — עדיין טלפון, עכשיו עמיד לנפילות. <em>בתשתית</em>: wrappers של retry/timeout/metrics/caching סביב client; <code>@retry</code>, <code>@lru_cache</code> בפייתון; שרשראות <code>http.RoundTripper</code> ב-Go.</li>
<li><strong>Facade</strong> — דלת כניסה פשוטה אחת למערכת מורכבת. <em>אנלוגיה</em>: קונסיירז' במלון. <em>בתשתית</em>: CLI פנימי של הפלטפורמה (<code>platform deploy</code>) שמסתיר Helm + Argo + Vault; API gateway.</li>
<li><strong>Proxy</strong> — ממלא מקום ששולט בגישה לאובייקט האמיתי (lazy, auth, remote, caching). <em>אנלוגיה</em>: עורך דין שמדבר בשמך. <em>בתשתית</em>: proxies של lazy loading ב-ORM (Hibernate, SQLAlchemy), stubs של gRPC, sidecars של Envoy, CDNs.</li>
<li><strong>Composite</strong> — מתייחסים לעץ של אובייקטים ולאובייקט בודד באותה צורה. <em>אנלוגיה</em>: תיקייה היא "קובץ שמכיל קבצים". <em>בתשתית</em>: modules בתוך modules ב-Terraform, health checks מאוגדים, עצי components ב-React.</li>
</ul>
<pre># Decorator (Python) — retries without touching the client
def with_retries(fn, attempts=3, base=0.1):
    def wrapper(*a, **kw):
        for i in range(attempts):
            try:
                return fn(*a, **kw)
            except TransientError:
                if i == attempts - 1: raise
                time.sleep(base * 2 ** i + random.random() * base)   # backoff + jitter
    return wrapper

client.get = with_retries(with_metrics(client.get, "inventory_get"))</pre>
<blockquote>💡 מהשטח: Adapter, Decorator ו-Proxy כולם "עוטפים". ההבדל הוא בכוונה: Adapter <em>משנה</em> את ה-interface, Decorator <em>מוסיף התנהגות</em> עם אותו interface, Proxy <em>שולט בגישה</em> עם אותו interface.</blockquote>`
      }
    },
    {
      h: { en: "Behavioral: who does what, and when", he: "Behavioral: מי עושה מה, ומתי" },
      body: {
        en: `<ul>
<li><strong>Strategy</strong> — swap an algorithm at runtime behind one interface. <em>Analogy</em>: Waze: fastest / shortest / no tolls. <em>Infra</em>: load-balancing algorithms (round robin, least-conn, P2C), cache eviction (LRU/LFU), compression codecs, retry policies.</li>
<li><strong>Observer (pub/sub)</strong> — subscribers are notified when a subject changes. <em>Analogy</em>: YouTube "subscribe + bell". <em>Infra</em>: k8s informers/watches feeding controllers, webhooks, Kafka consumers at system scale.</li>
<li><strong>Command</strong> — turn a request into an object (queue it, log it, undo it, retry it). <em>Analogy</em>: an order ticket on the kitchen rail. <em>Infra</em>: job-queue messages, Celery tasks, DB migrations (up/down).</li>
<li><strong>Template Method</strong> — base defines the skeleton, subclasses fill steps. <em>Analogy</em>: a wedding — fixed order, you choose the music. <em>Infra</em>: test frameworks (<code>setUp/test/tearDown</code>), CI pipeline templates, controller-runtime calling your <code>Reconcile</code>.</li>
<li><strong>Chain of Responsibility</strong> — pass a request along a chain; each handler acts or forwards. <em>Analogy</em>: support tiers L1 → L2 → L3. <em>Infra</em>: HTTP middleware, Envoy filter chains, iptables chains.</li>
<li><strong>State</strong> — behavior changes with internal state. <em>Analogy</em>: a traffic light. <em>Infra</em>: circuit breaker, TCP connection states, order/payment state machines.</li>
<li><strong>Iterator</strong> — traverse without exposing structure. <em>Analogy</em>: "next channel" on a remote. <em>Infra</em>: cursor-based API pagination, DB cursors, Kafka offsets, generators streaming a 50 GB file.</li>
</ul>
<pre>// Chain of Responsibility = HTTP middleware (Express)
app.use(requestId);                // tag request
app.use(accessLog);                // log
app.use(rateLimit({ rps: 100 }));  // may stop the chain with 429
app.use(authenticate);             // may stop with 401
app.use(router);                   // business handler

// State = circuit breaker
CLOSED --(failures &gt; 50% in 10s)--&gt; OPEN --(after 30s)--&gt; HALF_OPEN
HALF_OPEN --(probe ok)--&gt; CLOSED      HALF_OPEN --(probe fails)--&gt; OPEN</pre>
<blockquote>💡 Real world: A Kubernetes controller is Observer + State + Command rolled together: it <em>watches</em> resources, compares desired vs actual state, and issues <em>commands</em> to converge — the reconcile loop.</blockquote>`,
        he: `<ul>
<li><strong>Strategy</strong> — מחליפים אלגוריתם בזמן ריצה מאחורי interface אחד. <em>אנלוגיה</em>: Waze: הכי מהיר / הכי קצר / בלי אגרה. <em>בתשתית</em>: אלגוריתמי load balancing (round robin, least-conn, P2C), eviction של cache (LRU/LFU), codecs של דחיסה, מדיניות retry.</li>
<li><strong>Observer (pub/sub)</strong> — מנויים מקבלים הודעה כשנושא משתנה. <em>אנלוגיה</em>: "הירשמו + פעמון" ביוטיוב. <em>בתשתית</em>: informers/watches של k8s שמזינים controllers, webhooks, ו-Kafka consumers ברמת מערכת.</li>
<li><strong>Command</strong> — הופכים בקשה לאובייקט (לשים בתור, לתעד, לבטל, לנסות שוב). <em>אנלוגיה</em>: פתק הזמנה על המסילה במטבח. <em>בתשתית</em>: הודעות ב-job queue, Celery tasks, מיגרציות DB (up/down).</li>
<li><strong>Template Method</strong> — הבסיס מגדיר שלד, ה-subclasses ממלאים צעדים. <em>אנלוגיה</em>: חתונה — הסדר קבוע, אתם בוחרים מוזיקה. <em>בתשתית</em>: frameworks של טסטים (<code>setUp/test/tearDown</code>), תבניות CI, controller-runtime שקורא ל-<code>Reconcile</code> שלכם.</li>
<li><strong>Chain of Responsibility</strong> — מעבירים בקשה בשרשרת; כל handler מטפל או מעביר. <em>אנלוגיה</em>: תמיכה L1 → L2 → L3. <em>בתשתית</em>: HTTP middleware, filter chains של Envoy, chains של iptables.</li>
<li><strong>State</strong> — ההתנהגות משתנה לפי המצב הפנימי. <em>אנלוגיה</em>: רמזור. <em>בתשתית</em>: circuit breaker, מצבי חיבור TCP, state machines של הזמנה/תשלום.</li>
<li><strong>Iterator</strong> — מעבר בלי לחשוף מבנה. <em>אנלוגיה</em>: "ערוץ הבא" בשלט. <em>בתשתית</em>: pagination מבוסס cursor, cursors ב-DB, offsets ב-Kafka, generators שמזרימים קובץ של 50 GB.</li>
</ul>
<pre>// Chain of Responsibility = HTTP middleware (Express)
app.use(requestId);                // tag request
app.use(accessLog);                // log
app.use(rateLimit({ rps: 100 }));  // may stop the chain with 429
app.use(authenticate);             // may stop with 401
app.use(router);                   // business handler

// State = circuit breaker
CLOSED --(failures &gt; 50% in 10s)--&gt; OPEN --(after 30s)--&gt; HALF_OPEN
HALF_OPEN --(probe ok)--&gt; CLOSED      HALF_OPEN --(probe fails)--&gt; OPEN</pre>
<blockquote>💡 מהשטח: controller של Kubernetes הוא Observer + State + Command ביחד: הוא <em>צופה</em> במשאבים, משווה desired מול actual, ומוציא <em>commands</em> כדי להתכנס — ה-reconcile loop.</blockquote>`
      }
    },
    {
      h: { en: "Enterprise patterns: Dependency Injection, Repository, Unit of Work", he: "Enterprise patterns: Dependency Injection, Repository, Unit of Work" },
      body: {
        en: `<p><strong>Dependency Injection</strong> — objects receive their collaborators instead of creating them. <em>Analogy</em>: a film set — actors don't build their props; the prop department hands them in. Constructor injection is the default; a container (Spring, ASP.NET Core, NestJS, Guice) automates the wiring and lifetimes.</p>
<p><strong>Repository</strong> — a collection-like interface over persistence: <code>orders.get(id)</code>, <code>orders.add(o)</code>. The domain doesn't know if it's Postgres, DynamoDB or a dict in a test. <em>Analogy</em>: a library desk — you ask for a book by ID, you don't walk the stacks.</p>
<p><strong>Unit of Work</strong> — track all changes in one business operation and commit them atomically once. <em>Analogy</em>: a shopping cart — collect items, pay once. ORMs implement it: EF Core <code>DbContext.SaveChanges()</code>, SQLAlchemy <code>Session.commit()</code>.</p>
<pre>// C# — DI + Repository + Unit of Work (ASP.NET Core)
builder.Services.AddDbContext&lt;ShopDb&gt;();                            // UoW, scoped per request
builder.Services.AddScoped&lt;IOrderRepository, EfOrderRepository&gt;();
builder.Services.AddScoped&lt;PlaceOrderHandler&gt;();

public class PlaceOrderHandler(IOrderRepository orders, ShopDb uow) {
  public async Task Handle(PlaceOrder cmd) {
    var order = Order.Create(cmd.CustomerId, cmd.Items);   // domain rules
    orders.Add(order);
    uow.Outbox.Add(OutboxMessage.From(new OrderPlaced(order.Id)));
    await uow.SaveChangesAsync();                           // one transaction: order + outbox
  }
}</pre>
<blockquote>⚠️ Production tip: A Repository that returns <code>IQueryable</code> leaks the ORM into every caller (and invites N+1 queries). Return materialized domain objects or purpose-built query methods.</blockquote>`,
        he: `<p><strong>Dependency Injection</strong> — אובייקטים מקבלים את השותפים שלהם במקום ליצור אותם. <em>אנלוגיה</em>: סט צילומים — שחקנים לא בונים אביזרים; מחלקת האביזרים מגישה להם. הזרקה ב-constructor היא ברירת המחדל; container (Spring, ASP.NET Core, NestJS, Guice) ממכן את החיווט וה-lifetimes.</p>
<p><strong>Repository</strong> — interface דמוי-אוסף מעל persistence: <code>orders.get(id)</code>, <code>orders.add(o)</code>. הדומיין לא יודע אם זה Postgres, DynamoDB או dict בטסט. <em>אנלוגיה</em>: דלפק בספרייה — מבקשים ספר לפי מזהה, לא מסתובבים בין המדפים.</p>
<p><strong>Unit of Work</strong> — עוקב אחרי כל השינויים בפעולה עסקית אחת ועושה commit אטומי פעם אחת. <em>אנלוגיה</em>: עגלת קניות — אוספים, משלמים פעם אחת. ORMs מממשים את זה: <code>DbContext.SaveChanges()</code> ב-EF Core, <code>Session.commit()</code> ב-SQLAlchemy.</p>
<pre>// C# — DI + Repository + Unit of Work (ASP.NET Core)
builder.Services.AddDbContext&lt;ShopDb&gt;();                            // UoW, scoped per request
builder.Services.AddScoped&lt;IOrderRepository, EfOrderRepository&gt;();
builder.Services.AddScoped&lt;PlaceOrderHandler&gt;();

public class PlaceOrderHandler(IOrderRepository orders, ShopDb uow) {
  public async Task Handle(PlaceOrder cmd) {
    var order = Order.Create(cmd.CustomerId, cmd.Items);   // domain rules
    orders.Add(order);
    uow.Outbox.Add(OutboxMessage.From(new OrderPlaced(order.Id)));
    await uow.SaveChangesAsync();                           // one transaction: order + outbox
  }
}</pre>
<blockquote>⚠️ טיפ לפרודקשן: Repository שמחזיר <code>IQueryable</code> מדליף את ה-ORM לכל caller (ומזמין N+1 queries). תחזירו אובייקטי דומיין ממומשים או מתודות query ייעודיות.</blockquote>`
      }
    },
    {
      h: { en: "Cheat sheet: pattern → where you've already seen it", he: "שליף: pattern → איפה כבר ראיתם אותו" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>Family</th><th>Intent</th><th>Lives in infra as…</th></tr>
<tr><td>Factory Method</td><td>Creational</td><td>Decide which class to instantiate</td><td><code>boto3.client("sqs")</code>, DB driver registry</td></tr>
<tr><td>Abstract Factory</td><td>Creational</td><td>Matching families of objects</td><td>Per-cloud provider kits, test fixtures</td></tr>
<tr><td>Builder</td><td>Creational</td><td>Step-by-step construction</td><td>Request builders, protobuf builders</td></tr>
<tr><td>Prototype</td><td>Creational</td><td>Clone a configured instance</td><td>AMIs, Pod templates</td></tr>
<tr><td>Adapter</td><td>Structural</td><td>Translate interfaces</td><td>Exporters, ports &amp; adapters</td></tr>
<tr><td>Decorator</td><td>Structural</td><td>Add behavior, same interface</td><td>Retry/metrics wrappers, <code>@lru_cache</code></td></tr>
<tr><td>Facade</td><td>Structural</td><td>Simple front for a complex subsystem</td><td>Platform CLI, API gateway</td></tr>
<tr><td>Proxy</td><td>Structural</td><td>Control access to the real thing</td><td>ORM lazy load, Envoy, CDN, gRPC stub</td></tr>
<tr><td>Composite</td><td>Structural</td><td>Tree treated like a leaf</td><td>Terraform modules, aggregated health</td></tr>
<tr><td>Strategy</td><td>Behavioral</td><td>Swappable algorithm</td><td>LB algorithms, eviction policies</td></tr>
<tr><td>Observer</td><td>Behavioral</td><td>Notify subscribers</td><td>k8s watches, webhooks, pub/sub</td></tr>
<tr><td>Command</td><td>Behavioral</td><td>Request as an object</td><td>Queue messages, migrations, jobs</td></tr>
<tr><td>Template Method</td><td>Behavioral</td><td>Fixed skeleton, custom steps</td><td>Test frameworks, CI templates</td></tr>
<tr><td>Chain of Responsibility</td><td>Behavioral</td><td>Pass along a chain</td><td>HTTP middleware, Envoy filters, iptables</td></tr>
<tr><td>State</td><td>Behavioral</td><td>Behavior per state</td><td>Circuit breaker, TCP, workflows</td></tr>
<tr><td>Iterator</td><td>Behavioral</td><td>Traverse without exposing</td><td>Cursor pagination, Kafka offsets</td></tr>
</table>
<blockquote>💡 Real world: In interviews, don't recite the GoF book. Show you recognize a pattern in a real system and know its cost: "Decorator gives us retries without touching the SDK, but order matters — the per-attempt timeout goes inside the retry, plus an overall deadline outside."</blockquote>`,
        he: `<table>
<tr><th>Pattern</th><th>משפחה</th><th>כוונה</th><th>חי בתשתית בתור…</th></tr>
<tr><td>Factory Method</td><td>Creational</td><td>להחליט איזה class ליצור</td><td><code>boto3.client("sqs")</code>, registry של drivers</td></tr>
<tr><td>Abstract Factory</td><td>Creational</td><td>משפחות תואמות של אובייקטים</td><td>ערכות לכל ספק ענן, fixtures לטסט</td></tr>
<tr><td>Builder</td><td>Creational</td><td>בנייה צעד אחר צעד</td><td>builders של בקשות, protobuf</td></tr>
<tr><td>Prototype</td><td>Creational</td><td>שכפול מופע מוגדר</td><td>AMIs, Pod templates</td></tr>
<tr><td>Adapter</td><td>Structural</td><td>תרגום בין interfaces</td><td>Exporters, ports &amp; adapters</td></tr>
<tr><td>Decorator</td><td>Structural</td><td>הוספת התנהגות, אותו interface</td><td>wrappers של retry/metrics, <code>@lru_cache</code></td></tr>
<tr><td>Facade</td><td>Structural</td><td>חזית פשוטה למערכת מורכבת</td><td>CLI של הפלטפורמה, API gateway</td></tr>
<tr><td>Proxy</td><td>Structural</td><td>שליטה בגישה לדבר האמיתי</td><td>lazy load ב-ORM, Envoy, CDN, stub של gRPC</td></tr>
<tr><td>Composite</td><td>Structural</td><td>עץ שמתנהג כמו עלה</td><td>modules ב-Terraform, health מאוגד</td></tr>
<tr><td>Strategy</td><td>Behavioral</td><td>אלגוריתם בר-החלפה</td><td>אלגוריתמי LB, מדיניות eviction</td></tr>
<tr><td>Observer</td><td>Behavioral</td><td>להודיע למנויים</td><td>watches ב-k8s, webhooks, pub/sub</td></tr>
<tr><td>Command</td><td>Behavioral</td><td>בקשה כאובייקט</td><td>הודעות בתור, מיגרציות, jobs</td></tr>
<tr><td>Template Method</td><td>Behavioral</td><td>שלד קבוע, צעדים מותאמים</td><td>frameworks של טסטים, תבניות CI</td></tr>
<tr><td>Chain of Responsibility</td><td>Behavioral</td><td>מעבירים בשרשרת</td><td>HTTP middleware, filters של Envoy, iptables</td></tr>
<tr><td>State</td><td>Behavioral</td><td>התנהגות לפי מצב</td><td>Circuit breaker, TCP, workflows</td></tr>
<tr><td>Iterator</td><td>Behavioral</td><td>מעבר בלי לחשוף</td><td>Cursor pagination, offsets ב-Kafka</td></tr>
</table>
<blockquote>💡 מהשטח: בראיונות אל תדקלמו את ספר ה-GoF. תראו שאתם מזהים pattern במערכת אמיתית ויודעים מה הוא עולה: "Decorator נותן retries בלי לגעת ב-SDK, אבל הסדר חשוב — timeout לכל ניסיון בתוך ה-retry, ו-deadline כולל מבחוץ."</blockquote>`
      }
    }
  ],
  diagram: `Same interface, different intent:

   caller --> [ Adapter ]   --> LegacySoapClient    (CHANGES the interface)
   caller --> [ Decorator ] --> HttpClient          (ADDS retries/metrics)
   caller --> [ Proxy ]     --> RealObject          (CONTROLS access / lazy / remote)
   caller --> [ Facade ]    --> {Helm, Argo, Vault} (SIMPLIFIES many)

Chain of Responsibility (HTTP middleware):
   req -> requestId -> log -> rateLimit --x 429
                                  |
                                  v
                               auth --x 401 -> router -> handler

Observer + State + Command = k8s controller:
   watch(Deployment) -> diff(desired, actual) -> create/delete Pods -> repeat`,
  handsOn: [
    { cmd: "python -c \"import functools,time\n@functools.lru_cache(maxsize=128)\ndef slow(x):\n  time.sleep(1); return x*2\nt=time.time(); slow(2); slow(2); print(round(time.time()-t,2), slow.cache_info())\"", what: { en: "Decorator in the standard library: lru_cache wraps a function with caching without changing its signature. The second call is instant.", he: "Decorator בספרייה הסטנדרטית: lru_cache עוטף פונקציה ב-caching בלי לשנות את החתימה. הקריאה השנייה מיידית." } },
    { cmd: "kubectl get deploy web -o jsonpath='{.spec.template}' | head -c 400", what: { en: "Prototype in Kubernetes: the Pod template every replica is cloned from.", he: "Prototype ב-Kubernetes: ה-Pod template שממנו משוכפלת כל replica." } },
    { cmd: "kubectl get events -w", what: { en: "Observer live: watch the event stream that controllers react to while you scale a deployment in another terminal.", he: "Observer בלייב: צופים ב-stream שה-controllers מגיבים אליו בזמן שעושים scale ל-deployment בטרמינל אחר." } },
    { cmd: "curl -sI 'https://api.github.com/repos/kubernetes/kubernetes/issues?per_page=2' | grep -i '^link'", what: { en: "Iterator over HTTP: the Link header gives next/last page cursors — clients iterate without knowing the storage layout.", he: "Iterator מעל HTTP: ה-Link header נותן cursors לעמוד הבא/האחרון — הלקוחות עוברים בלי לדעת את מבנה האחסון." } }
  ],
  mnemonic: {
    en: "Creational = HOW it's born, Structural = WHAT it wears, Behavioral = WHO does the work. Adapter swaps the plug, Decorator adds a case, Proxy is your lawyer, Facade is the concierge.",
    he: "Creational = איך הוא נולד, Structural = מה הוא לובש, Behavioral = מי עושה את העבודה. Adapter מחליף תקע, Decorator מוסיף כיסוי, Proxy הוא עורך הדין, Facade הוא הקונסיירז'."
  },
  pitfalls: [
    { en: "Pattern-itis: AbstractSingletonProxyFactoryBean. Apply a pattern when you feel the pain it solves, not to show you know it.", he: "Pattern-itis: AbstractSingletonProxyFactoryBean. משתמשים ב-pattern כשמרגישים את הכאב שהוא פותר, לא כדי להראות שמכירים אותו." },
    { en: "Wrong decorator order: wrapping retry inside one timeout gives the whole retry loop a single budget; usually you want a per-attempt timeout inside the retry plus an overall deadline.", he: "סדר decorators שגוי: לעטוף את כל ה-retry ב-timeout אחד נותן תקציב יחיד לכל הלולאה; בדרך כלל רוצים timeout לכל ניסיון בתוך ה-retry ועוד deadline כולל." },
    { en: "ORM proxies + lazy loading in a loop = N+1 queries; one page render fires 500 SELECTs. Eager-load or write explicit queries.", he: "Proxies של ORM עם lazy loading בתוך לולאה = N+1 queries; רינדור עמוד אחד יורה 500 SELECTs. עושים eager load או queries מפורשים." },
    { en: "Observers without unsubscribe or backpressure leak memory and create fan-out storms — the in-process version of a retry storm.", he: "Observers בלי unsubscribe או backpressure מדליפים זיכרון ויוצרים סערות fan-out — הגרסה בתוך-התהליך של retry storm." }
  ],
  interview: [
    { q: { en: "Decorator vs Proxy vs Adapter — what's the difference?", he: "Decorator מול Proxy מול Adapter — מה ההבדל?" },
      a: { en: "All three wrap an object. Adapter exposes a DIFFERENT interface to make an incompatible thing fit (a SOAP client behind a REST-like port). Decorator keeps the SAME interface and adds behavior (retries, metrics, caching) and is stackable. Proxy keeps the SAME interface and controls access to the real subject (lazy creation, remote call, auth) — the caller may not know the real object doesn't exist yet.", he: "שלושתם עוטפים אובייקט. Adapter חושף interface שונה כדי להתאים משהו לא תואם (client של SOAP מאחורי port דמוי REST). Decorator שומר על אותו interface ומוסיף התנהגות (retries, metrics, caching) ואפשר לשרשר. Proxy שומר על אותו interface ושולט בגישה לאובייקט האמיתי (יצירה עצלה, קריאה מרוחקת, auth) — ה-caller אולי לא יודע שהאובייקט האמיתי עוד לא קיים." } },
    { q: { en: "Which patterns do you see inside a Kubernetes controller?", he: "אילו patterns רואים בתוך controller של Kubernetes?" },
      a: { en: "Observer (informers watch the API server and push keys to a work queue), Command (work items to reconcile, retried with backoff), State (desired vs observed status drives actions), Template Method (controller-runtime runs your Reconcile inside a fixed loop), and Iterator semantics via resourceVersion for list+watch.", he: "Observer (informers צופים ב-API server ודוחפים מפתחות ל-work queue), Command (פריטי עבודה ל-reconcile, עם retries ו-backoff), State (desired מול observed מניע פעולות), Template Method (controller-runtime מריץ את ה-Reconcile שלכם בתוך לולאה קבועה), וסמנטיקה של Iterator דרך resourceVersion ב-list+watch." } },
    { q: { en: "Why use a Repository and Unit of Work if you already have an ORM?", he: "למה Repository ו-Unit of Work אם כבר יש ORM?" },
      a: { en: "The ORM IS a Unit of Work, but exposing it everywhere couples the domain to the ORM and lets anyone build arbitrary queries. A Repository gives a narrow, domain-shaped API that's testable with an in-memory fake; the UoW boundary makes 'one business operation = one transaction' explicit — which is also where the outbox row is written.", he: "ה-ORM הוא כבר Unit of Work, אבל לחשוף אותו בכל מקום מצמיד את הדומיין ל-ORM ומאפשר לכל אחד לבנות queries שרירותיים. Repository נותן API צר בצורת הדומיין, בר-בדיקה עם fake בזיכרון; גבול ה-UoW הופך את 'פעולה עסקית אחת = טרנזקציה אחת' למפורש — וזה גם המקום שבו נכתבת שורת ה-outbox." } }
  ],
  quiz: [
    { q: { en: "Express/ASP.NET middleware pipelines are an example of…", he: "pipelines של middleware ב-Express/ASP.NET הם דוגמה ל…" },
      options: [ { en: "Composite", he: "Composite" }, { en: "Chain of Responsibility", he: "Chain of Responsibility" }, { en: "Abstract Factory", he: "Abstract Factory" }, { en: "Prototype", he: "Prototype" } ],
      answer: 1, explain: { en: "Each middleware handles the request or passes it on — and can stop the chain (401, 429).", he: "כל middleware מטפל בבקשה או מעביר הלאה — ויכול לעצור את השרשרת (401, 429)." } },
    { q: { en: "A circuit breaker moving CLOSED → OPEN → HALF_OPEN is best modeled with…", he: "Circuit breaker שעובר CLOSED → OPEN → HALF_OPEN ממודל הכי טוב עם…" },
      options: [ { en: "State", he: "State" }, { en: "Builder", he: "Builder" }, { en: "Facade", he: "Facade" }, { en: "Iterator", he: "Iterator" } ],
      answer: 0, explain: { en: "Behavior (allow, reject, probe) depends on the current state, with explicit transitions.", he: "ההתנהגות (לאפשר, לדחות, לבדוק) תלויה במצב הנוכחי, עם מעברים מפורשים." } },
    { q: { en: "You add retries and metrics around an HTTP client without changing its interface. Pattern?", he: "מוסיפים retries ו-metrics סביב HTTP client בלי לשנות את ה-interface. איזה pattern?" },
      options: [ { en: "Adapter", he: "Adapter" }, { en: "Decorator", he: "Decorator" }, { en: "Singleton", he: "Singleton" }, { en: "Template Method", he: "Template Method" } ],
      answer: 1, explain: { en: "Same interface, added behavior, stackable — Decorator.", he: "אותו interface, התנהגות נוספת, אפשר לשרשר — Decorator." } },
    { q: { en: "An ORM entity whose related collection loads only on first access uses…", he: "Entity של ORM שהאוסף הקשור אליו נטען רק בגישה הראשונה משתמש ב…" },
      options: [ { en: "Observer", he: "Observer" }, { en: "Command", he: "Command" }, { en: "Proxy (lazy loading)", he: "Proxy (lazy loading)" }, { en: "Strategy", he: "Strategy" } ],
      answer: 2, explain: { en: "A proxy stands in for the real collection and hits the DB on first access — convenient, and the source of N+1 queries.", he: "Proxy ממלא את מקום האוסף האמיתי ופונה ל-DB בגישה הראשונה — נוח, ומקור ה-N+1 queries." } }
  ],
  related: ["pr-solid", "pr-singletons", "pr-cloud-patterns", "arch-resilience", "k8s-operators-crds"]
});

INFRA.lessons.push({
  id: "pr-singletons",
  track: "principal",
  order: 32,
  icon: "☝️",
  level: 3,
  minutes: 18,
  title: { en: "Kinds of Singletons: From a Lazy Field to a Cluster-Wide Leader", he: "סוגי Singletons: משדה עצל ועד Leader ברמת ה-cluster" },
  tldr: {
    en: "\"Exactly one\" always has a scope — per class loader, per process, per DI container, per request, per pod, per cluster — and the further out the scope, the more you need locks, leases and fencing tokens instead of a static field.",
    he: "ל\"בדיוק אחד\" תמיד יש scope — לכל class loader, לכל process, לכל DI container, לכל request, לכל pod, לכל cluster — וככל שה-scope רחב יותר, צריך יותר locks, leases ו-fencing tokens במקום שדה static."
  },
  analogy: {
    en: "A singleton is 'the one TV remote in the house'. Eager: the remote is on the table before anyone wakes up. Lazy: whoever wants TV first goes and finds it — fine alone, but if two kids search at the same time you end up buying two remotes (race). Double-checked locking: glance at the table, and only if it's empty lock the door and look properly. A cluster-wide singleton is 'only one person holds the car keys this weekend' — you need a key box with a sign-out sheet (a lease), and if someone's lease expired while they were still driving, the garage must reject their old key (fencing token).",
    he: "Singleton זה 'השלט היחיד בבית'. Eager: השלט כבר על השולחן לפני שמישהו קם. Lazy: מי שרוצה טלוויזיה ראשון הולך למצוא אותו — בסדר כשאתה לבד, אבל אם שני ילדים מחפשים באותו זמן קונים שני שלטים (race). Double-checked locking: מציצים על השולחן, ורק אם הוא ריק נועלים את הדלת ומחפשים ברצינות. Singleton ברמת cluster זה 'רק אחד מחזיק את מפתחות האוטו בסופ\"ש' — צריך קופסת מפתחות עם דף חתימה (lease), ואם ה-lease של מישהו פג בזמן שהוא עוד נוהג, המוסך חייב לדחות את המפתח הישן שלו (fencing token)."
  },
  sections: [
    {
      h: { en: "Classic in-process singletons (Java/C#)", he: "Singletons קלאסיים בתוך process (Java/C#)" },
      body: {
        en: `<table>
<tr><th>Kind</th><th>Thread-safe?</th><th>Lazy?</th><th>Notes</th></tr>
<tr><td>Eager (static final field)</td><td>✅ (class init is locked by JVM/CLR)</td><td>❌</td><td>Simplest. Cost paid at class load even if unused.</td></tr>
<tr><td>Lazy, unsynchronized</td><td>❌</td><td>✅</td><td>Two threads can both see null → two instances.</td></tr>
<tr><td>Synchronized getter</td><td>✅</td><td>✅</td><td>Every call takes a lock — contention on hot paths.</td></tr>
<tr><td>Double-checked locking</td><td>✅ only with <code>volatile</code></td><td>✅</td><td>Lock only on first creation.</td></tr>
<tr><td>Holder idiom (init-on-demand)</td><td>✅</td><td>✅</td><td>Uses JVM class-init guarantees. Idiomatic Java.</td></tr>
<tr><td>Enum singleton</td><td>✅</td><td>❌ (on enum load)</td><td>Serialization- and reflection-proof (Effective Java).</td></tr>
<tr><td>C# <code>Lazy&lt;T&gt;</code></td><td>✅ (default mode)</td><td>✅</td><td>Idiomatic .NET.</td></tr>
</table>
<pre>// Java — double-checked locking. WITHOUT volatile this is broken:
// another thread can see a non-null reference to a partially constructed object
// because the JIT/CPU may reorder "write fields" and "publish reference".
public final class Config {
  private static volatile Config instance;
  private Config() { /* load file */ }
  public static Config get() {
    Config c = instance;                 // 1st check, no lock (fast path)
    if (c == null) {
      synchronized (Config.class) {
        c = instance;
        if (c == null) instance = c = new Config();   // 2nd check, under lock
      }
    }
    return c;
  }
}

// Java — holder idiom: lazy + thread-safe with zero locking code
public final class Registry {
  private Registry() {}
  private static class Holder { static final Registry INSTANCE = new Registry(); }
  public static Registry get() { return Holder.INSTANCE; }   // Holder loads on first call
}

// Java — enum singleton
public enum Metrics { INSTANCE; public void inc(String k) { /* ... */ } }

// C#
public sealed class Clock {
  private static readonly Lazy&lt;Clock&gt; _i = new(() =&gt; new Clock());
  public static Clock Instance =&gt; _i.Value;
  private Clock() {}
}</pre>`,
        he: `<table>
<tr><th>סוג</th><th>Thread-safe?</th><th>Lazy?</th><th>הערות</th></tr>
<tr><td>Eager (שדה static final)</td><td>✅ (אתחול class נעול ע"י ה-JVM/CLR)</td><td>❌</td><td>הכי פשוט. משלמים בטעינת ה-class גם אם לא משתמשים.</td></tr>
<tr><td>Lazy בלי סנכרון</td><td>❌</td><td>✅</td><td>שני threads יכולים לראות null → שני מופעים.</td></tr>
<tr><td>Getter מסונכרן</td><td>✅</td><td>✅</td><td>כל קריאה לוקחת lock — contention ב-hot paths.</td></tr>
<tr><td>Double-checked locking</td><td>✅ רק עם <code>volatile</code></td><td>✅</td><td>lock רק ביצירה הראשונה.</td></tr>
<tr><td>Holder idiom (init-on-demand)</td><td>✅</td><td>✅</td><td>משתמש בהבטחות אתחול ה-class של ה-JVM. Java אידיומטי.</td></tr>
<tr><td>Enum singleton</td><td>✅</td><td>❌ (בטעינת ה-enum)</td><td>חסין serialization ו-reflection (Effective Java).</td></tr>
<tr><td><code>Lazy&lt;T&gt;</code> ב-C#</td><td>✅ (במצב ברירת מחדל)</td><td>✅</td><td>.NET אידיומטי.</td></tr>
</table>
<pre>// Java — double-checked locking. WITHOUT volatile this is broken:
// another thread can see a non-null reference to a partially constructed object
// because the JIT/CPU may reorder "write fields" and "publish reference".
public final class Config {
  private static volatile Config instance;
  private Config() { /* load file */ }
  public static Config get() {
    Config c = instance;                 // 1st check, no lock (fast path)
    if (c == null) {
      synchronized (Config.class) {
        c = instance;
        if (c == null) instance = c = new Config();   // 2nd check, under lock
      }
    }
    return c;
  }
}

// Java — holder idiom: lazy + thread-safe with zero locking code
public final class Registry {
  private Registry() {}
  private static class Holder { static final Registry INSTANCE = new Registry(); }
  public static Registry get() { return Holder.INSTANCE; }   // Holder loads on first call
}

// Java — enum singleton
public enum Metrics { INSTANCE; public void inc(String k) { /* ... */ } }

// C#
public sealed class Clock {
  private static readonly Lazy&lt;Clock&gt; _i = new(() =&gt; new Clock());
  public static Clock Instance =&gt; _i.Value;
  private Clock() {}
}</pre>
<p>למה <code>volatile</code>? בלי זה, ה-JIT/CPU רשאים לסדר מחדש "כתיבת השדות" ו"פרסום ה-reference", ו-thread אחר עלול לקבל reference לא-null לאובייקט שעוד לא נבנה עד הסוף.</p>`
      }
    },
    {
      h: { en: "Python and Node.js: modules are singletons (until they aren't)", he: "Python ו-Node.js: מודולים הם singletons (עד שהם לא)" },
      body: {
        en: `<p><strong>Python</strong> caches imported modules in <code>sys.modules</code>, so a module-level object is a per-process singleton — the most Pythonic option.</p>
<pre># db.py — module-level singleton (Pythonic)
engine = create_engine(os.environ["DATABASE_URL"], pool_size=10)

# functools.cache — lazy singleton factory
@functools.cache
def get_settings() -&gt; Settings:
    return Settings()            # built once, on first call (FastAPI's recommended style)

# __new__ — classic, rarely needed
class Registry:
    _inst = None
    def __new__(cls):
        if cls._inst is None:
            cls._inst = super().__new__(cls)
        return cls._inst

# metaclass — one instance per class that uses it
class SingletonMeta(type):
    _instances = {}
    _lock = threading.Lock()
    def __call__(cls, *a, **kw):
        with cls._lock:
            if cls not in cls._instances:
                cls._instances[cls] = super().__call__(*a, **kw)
        return cls._instances[cls]</pre>
<p>Gotchas: Gunicorn/uWSGI <strong>fork</strong> workers — each worker is a separate process with its own "singleton"; a DB pool created <em>before</em> fork shares sockets across processes (corruption) — create pools post-fork. Multiprocessing and Celery workers: same story.</p>
<p><strong>Node.js</strong> caches modules by <em>resolved file path</em> in <code>require.cache</code>, so <code>export const pool = new Pool()</code> is a singleton… unless:</p>
<ul>
<li>two copies of a package exist in <code>node_modules</code> (different versions → different paths → two "singletons"; the infamous duplicate React / duplicate <code>graphql</code> "instanceof" errors),</li>
<li>a bundler/micro-frontend creates separate bundles each with their own copy,</li>
<li>Next.js dev mode hot-reloads modules and re-creates your Prisma client every edit ("too many connections") — fix: stash it on <code>globalThis</code>,</li>
<li>you run multiple processes (cluster module, PM2, k8s replicas) — one per process, never global.</li>
</ul>
<pre>// Next.js / hot reload safe singleton
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;</pre>`,
        he: `<p><strong>Python</strong> שומר מודולים מיובאים ב-<code>sys.modules</code>, אז אובייקט ברמת המודול הוא singleton לכל process — האפשרות הכי פייתונית.</p>
<pre># db.py — module-level singleton (Pythonic)
engine = create_engine(os.environ["DATABASE_URL"], pool_size=10)

# functools.cache — lazy singleton factory
@functools.cache
def get_settings() -&gt; Settings:
    return Settings()            # built once, on first call (FastAPI's recommended style)

# __new__ — classic, rarely needed
class Registry:
    _inst = None
    def __new__(cls):
        if cls._inst is None:
            cls._inst = super().__new__(cls)
        return cls._inst

# metaclass — one instance per class that uses it
class SingletonMeta(type):
    _instances = {}
    _lock = threading.Lock()
    def __call__(cls, *a, **kw):
        with cls._lock:
            if cls not in cls._instances:
                cls._instances[cls] = super().__call__(*a, **kw)
        return cls._instances[cls]</pre>
<p>מלכודות: Gunicorn/uWSGI עושים <strong>fork</strong> ל-workers — כל worker הוא process נפרד עם "singleton" משלו; pool של DB שנוצר <em>לפני</em> ה-fork חולק sockets בין processes (השחתה) — יוצרים pools אחרי ה-fork. multiprocessing ו-Celery workers: אותו סיפור.</p>
<p><strong>Node.js</strong> שומר מודולים לפי <em>נתיב הקובץ שנפתר</em> ב-<code>require.cache</code>, אז <code>export const pool = new Pool()</code> הוא singleton… אלא אם:</p>
<ul>
<li>יש שני עותקים של חבילה ב-<code>node_modules</code> (גרסאות שונות → נתיבים שונים → שני "singletons"; שגיאות ה-instanceof המפורסמות של React כפול / <code>graphql</code> כפול),</li>
<li>bundler/micro-frontend יוצר bundles נפרדים שלכל אחד עותק משלו,</li>
<li>Next.js ב-dev עושה hot reload למודולים ויוצר מחדש את ה-Prisma client בכל שמירה ("too many connections") — הפתרון: לשמור אותו על <code>globalThis</code>,</li>
<li>מריצים כמה processes (cluster module, PM2, replicas ב-k8s) — אחד לכל process, אף פעם לא גלובלי.</li>
</ul>
<pre>// Next.js / hot reload safe singleton
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;</pre>`
      }
    },
    {
      h: { en: "DI lifetimes: singleton vs scoped vs transient", he: "Lifetimes ב-DI: singleton מול scoped מול transient" },
      body: {
        en: `<p>Modern code rarely writes <code>getInstance()</code>; it asks the DI container for a lifetime. The container owns "one per what".</p>
<table>
<tr><th>Lifetime</th><th>One instance per…</th><th>Use for</th><th>ASP.NET Core / NestJS</th></tr>
<tr><td>Singleton</td><td>container (≈ process)</td><td>HttpClient handlers, connection pools, caches, config, loggers</td><td><code>AddSingleton</code> / <code>Scope.DEFAULT</code></td></tr>
<tr><td>Scoped</td><td>request (or unit of work)</td><td>DbContext, current user, transaction, per-request cache</td><td><code>AddScoped</code> / <code>Scope.REQUEST</code></td></tr>
<tr><td>Transient</td><td>every resolution</td><td>Lightweight stateless helpers</td><td><code>AddTransient</code> / <code>Scope.TRANSIENT</code></td></tr>
</table>
<pre>// ❌ Captive dependency: a singleton holding a scoped DbContext
builder.Services.AddSingleton&lt;PriceCache&gt;();       // lives forever
public class PriceCache(ShopDb db) { ... }           // ShopDb is scoped -&gt; one DbContext shared by
                                                    // all requests/threads: not thread-safe, stale
// ✅ Inject IServiceScopeFactory / IDbContextFactory&lt;ShopDb&gt; and create a scope per operation.
// ASP.NET Core catches this in Development with ValidateScopes = true.</pre>
<blockquote>⚠️ Production tip: The rule — a service may only depend on services with an <em>equal or longer</em> lifetime. Singleton → Scoped is the bug ("captive dependency"). Also: <code>new HttpClient()</code> per request exhausts sockets (TIME_WAIT); use <code>IHttpClientFactory</code> (a managed singleton handler pool).</blockquote>`,
        he: `<p>קוד מודרני כמעט לא כותב <code>getInstance()</code>; הוא מבקש מה-DI container lifetime. ה-container אחראי על "אחד לכל מה".</p>
<table>
<tr><th>Lifetime</th><th>מופע אחד לכל…</th><th>מתאים ל</th><th>ASP.NET Core / NestJS</th></tr>
<tr><td>Singleton</td><td>container (≈ process)</td><td>HttpClient handlers, connection pools, caches, config, loggers</td><td><code>AddSingleton</code> / <code>Scope.DEFAULT</code></td></tr>
<tr><td>Scoped</td><td>request (או unit of work)</td><td>DbContext, המשתמש הנוכחי, טרנזקציה, cache לכל request</td><td><code>AddScoped</code> / <code>Scope.REQUEST</code></td></tr>
<tr><td>Transient</td><td>כל resolve</td><td>helpers קלים וחסרי state</td><td><code>AddTransient</code> / <code>Scope.TRANSIENT</code></td></tr>
</table>
<pre>// ❌ Captive dependency: a singleton holding a scoped DbContext
builder.Services.AddSingleton&lt;PriceCache&gt;();       // lives forever
public class PriceCache(ShopDb db) { ... }           // ShopDb is scoped -&gt; one DbContext shared by
                                                    // all requests/threads: not thread-safe, stale
// ✅ Inject IServiceScopeFactory / IDbContextFactory&lt;ShopDb&gt; and create a scope per operation.
// ASP.NET Core catches this in Development with ValidateScopes = true.</pre>
<blockquote>⚠️ טיפ לפרודקשן: הכלל — service יכול להיות תלוי רק ב-services עם lifetime <em>שווה או ארוך יותר</em>. Singleton → Scoped זה הבאג ("captive dependency"). ועוד: <code>new HttpClient()</code> בכל request מכלה sockets (TIME_WAIT); משתמשים ב-<code>IHttpClientFactory</code> (pool של handlers שמנוהל כ-singleton).</blockquote>`
      }
    },
    {
      h: { en: "Beyond one process: per-pod and per-cluster singletons", he: "מעבר ל-process אחד: singletons לכל pod ולכל cluster" },
      body: {
        en: `<p>The moment you run 3 replicas, your "singleton" scheduler runs 3 times and sends every email 3×. Options, from simplest:</p>
<ul>
<li><strong>Don't run it in the replicas</strong>: a k8s <code>CronJob</code> with <code>concurrencyPolicy: Forbid</code> (no overlapping runs), or a separate Deployment with <code>replicas: 1</code> + <code>strategy: Recreate</code> (no overlap during rollout). Note: replicas:1 is <em>not</em> a guarantee — during node partition the old pod may still run while a new one starts.</li>
<li><strong>Leader election</strong>: all replicas run, one holds a lease and does the work; others stand by. Kubernetes <code>coordination.k8s.io/v1 Lease</code> (used by kube-controller-manager, every operator via controller-runtime), etcd/Consul sessions, ZooKeeper ephemeral nodes.</li>
<li><strong>Distributed lock per job</strong>: Redis <code>SET lock:report NX PX 30000</code>, Postgres advisory locks (<code>pg_try_advisory_lock</code>), DynamoDB conditional writes.</li>
<li><strong>Make the work idempotent</strong> so duplicates are harmless — always do this anyway.</li>
</ul>
<pre>apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-invoices }
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid        # skip a run if the previous one is still going
  startingDeadlineSeconds: 300
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers: [{ name: job, image: billing:1.42, args: ["invoices", "--date=yesterday"] }]</pre>
<p><strong>Fencing tokens</strong>: a lease holder can pause (GC stop-the-world, VM freeze) past its lease, a new leader takes over, and the old one wakes up still believing it's leader. Locks alone can't prevent this. Each lease grant returns a monotonically increasing token; the storage/side-effect system rejects writes with a token lower than the highest it has seen.</p>
<pre>leader A gets lease, token=33 ... GC pause 40s ... lease expires
leader B gets lease, token=34 -&gt; writes(token=34) OK
A wakes up               -&gt; writes(token=33) REJECTED (33 &lt; 34)</pre>
<blockquote>💡 Real world: Martin Kleppmann's critique of Redlock is exactly this: a Redis lock without fencing is fine for <em>efficiency</em> (avoid doing work twice) but not for <em>correctness</em> (never corrupt data). For correctness use a consensus store (etcd/ZooKeeper) + fencing, or make the write itself conditional (<code>UPDATE ... WHERE version = 7</code>).</blockquote>`,
        he: `<p>ברגע שמריצים 3 replicas, ה-scheduler ה"singleton" רץ 3 פעמים ושולח כל מייל 3×. אפשרויות, מהפשוטה:</p>
<ul>
<li><strong>לא להריץ את זה ב-replicas</strong>: <code>CronJob</code> ב-k8s עם <code>concurrencyPolicy: Forbid</code> (בלי ריצות חופפות), או Deployment נפרד עם <code>replicas: 1</code> + <code>strategy: Recreate</code> (בלי חפיפה ב-rollout). שימו לב: replicas:1 <em>לא</em> הבטחה — בזמן partition של node ה-pod הישן עשוי לרוץ עדיין בזמן שחדש עולה.</li>
<li><strong>Leader election</strong>: כל ה-replicas רצים, אחד מחזיק lease ועושה את העבודה; האחרים בהמתנה. <code>Lease</code> של <code>coordination.k8s.io/v1</code> ב-Kubernetes (בשימוש ע"י kube-controller-manager וכל operator דרך controller-runtime), sessions של etcd/Consul, ephemeral nodes ב-ZooKeeper.</li>
<li><strong>Distributed lock לכל job</strong>: <code>SET lock:report NX PX 30000</code> ב-Redis, advisory locks ב-Postgres (<code>pg_try_advisory_lock</code>), conditional writes ב-DynamoDB.</li>
<li><strong>להפוך את העבודה לאידמפוטנטית</strong> כך שכפילויות לא מזיקות — תמיד עושים את זה בכל מקרה.</li>
</ul>
<pre>apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-invoices }
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid        # skip a run if the previous one is still going
  startingDeadlineSeconds: 300
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers: [{ name: job, image: billing:1.42, args: ["invoices", "--date=yesterday"] }]</pre>
<p><strong>Fencing tokens</strong>: מחזיק lease יכול לעצור (GC stop-the-world, הקפאת VM) מעבר ל-lease שלו, leader חדש לוקח פיקוד, והישן מתעורר בטוח שהוא עדיין leader. locks לבד לא מונעים את זה. כל הענקת lease מחזירה token שעולה מונוטונית; מערכת האחסון/ה-side effect דוחה כתיבות עם token נמוך מהגבוה ביותר שראתה.</p>
<pre>leader A gets lease, token=33 ... GC pause 40s ... lease expires
leader B gets lease, token=34 -&gt; writes(token=34) OK
A wakes up               -&gt; writes(token=33) REJECTED (33 &lt; 34)</pre>
<blockquote>💡 מהשטח: הביקורת של Martin Kleppmann על Redlock היא בדיוק זו: lock ב-Redis בלי fencing בסדר בשביל <em>יעילות</em> (לא לעשות עבודה פעמיים) אבל לא בשביל <em>נכונות</em> (לעולם לא להשחית נתונים). בשביל נכונות — consensus store (etcd/ZooKeeper) + fencing, או לעשות את הכתיבה עצמה מותנית (<code>UPDATE ... WHERE version = 7</code>).</blockquote>`
      }
    },
    {
      h: { en: "Anti-pattern or the right tool?", he: "Anti-pattern או הכלי הנכון?" },
      body: {
        en: `<p>Why singletons get a bad name:</p>
<ul>
<li><strong>Hidden global state</strong>: <code>Config.get()</code> deep inside a function is an invisible dependency — signatures lie about what the code needs.</li>
<li><strong>Testing pain</strong>: tests share state, order-dependent failures, can't run in parallel, can't swap a fake without monkey-patching.</li>
<li><strong>Concurrency hazards</strong>: a mutable singleton is a shared variable for every thread.</li>
<li><strong>Lifecycle</strong>: hard to reset, reload config, or close cleanly on shutdown.</li>
</ul>
<p>When "one instance" is genuinely right: <strong>connection pools</strong> (one pool per process per DB), <strong>HTTP client handlers</strong>, <strong>loggers / metrics registries</strong>, <strong>immutable config</strong>, <strong>expensive caches</strong> (compiled regexes, ML models loaded once — 4 GB, you don't want two).</p>
<p>The principal's rule: <em>"one instance" is fine; "reached through a global" is the problem.</em> Create the one instance in the composition root (main / DI container) and pass it in. You get the single instance and testability.</p>
<pre># ❌ Hidden global
def send_invoice(inv):
    Mailer.instance().send(inv.email, render(inv))

# ✅ Same single instance, made explicit
def send_invoice(inv, mailer: Mailer):
    mailer.send(inv.email, render(inv))

# main.py (composition root)
mailer = SmtpMailer(host=cfg.smtp_host)      # created once
app = build_app(mailer=mailer)</pre>`,
        he: `<p>למה ל-singletons יש שם רע:</p>
<ul>
<li><strong>State גלובלי מוסתר</strong>: <code>Config.get()</code> עמוק בתוך פונקציה הוא תלות בלתי נראית — החתימות משקרות לגבי מה הקוד צריך.</li>
<li><strong>כאב בטסטים</strong>: טסטים חולקים state, כשלים שתלויים בסדר, אי אפשר להריץ במקביל, אי אפשר להחליף ב-fake בלי monkey-patching.</li>
<li><strong>סכנות מקביליות</strong>: singleton שניתן לשינוי הוא משתנה משותף לכל thread.</li>
<li><strong>מחזור חיים</strong>: קשה לאפס, לטעון config מחדש, או לסגור נקי ב-shutdown.</li>
</ul>
<p>מתי "מופע אחד" באמת נכון: <strong>connection pools</strong> (pool אחד לכל process לכל DB), <strong>HTTP client handlers</strong>, <strong>loggers / registries של metrics</strong>, <strong>config בלתי משתנה</strong>, <strong>caches יקרים</strong> (regexes מקומפלים, מודל ML שנטען פעם אחת — 4 GB, לא רוצים שניים).</p>
<p>הכלל של Principal: <em>"מופע אחד" זה בסדר; "מגיעים אליו דרך גלובלי" — זו הבעיה.</em> יוצרים את המופע היחיד ב-composition root (main / DI container) ומעבירים אותו פנימה. מקבלים גם מופע יחיד וגם טסטביליות.</p>
<pre># ❌ Hidden global
def send_invoice(inv):
    Mailer.instance().send(inv.email, render(inv))

# ✅ Same single instance, made explicit
def send_invoice(inv, mailer: Mailer):
    mailer.send(inv.email, render(inv))

# main.py (composition root)
mailer = SmtpMailer(host=cfg.smtp_host)      # created once
app = build_app(mailer=mailer)</pre>`
      }
    }
  ],
  diagram: `"Exactly one" — per WHAT?

  scope                      mechanism                         breaks when...
  -------------------------  --------------------------------  ---------------------------------
  class loader / module      static field, holder, enum,       2 copies of the package,
                             sys.modules, require.cache        hot reload, multiple bundles
  DI container               AddSingleton / Scope.DEFAULT      captive scoped dependency
  request                    AddScoped / Scope.REQUEST         background threads outliving req
  process                    module global                     fork (gunicorn), cluster module
  pod / deployment           replicas: 1 + Recreate            node partition -> 2 running
  cluster                    Lease / etcd / ZK + fencing token GC pause past lease w/o fencing

  Lease timeline:  A[token 33]----pause----X     B[token 34]---- writes OK
                                          A wakes: write(33) -> REJECTED`,
  handsOn: [
    { cmd: "kubectl get lease -n kube-system", what: { en: "See real cluster-wide singletons: kube-controller-manager and kube-scheduler hold Leases; HOLDER shows the current leader.", he: "רואים singletons אמיתיים ברמת cluster: kube-controller-manager ו-kube-scheduler מחזיקים Leases; HOLDER מראה את ה-leader הנוכחי." } },
    { cmd: "python -c \"import threading,time\nclass S:\n  inst=None\n  @classmethod\n  def get(c):\n    if c.inst is None:\n      time.sleep(0.01); c.inst=object()\n    return c.inst\nr=set()\nts=[threading.Thread(target=lambda: r.add(id(S.get()))) for _ in range(8)]\n[t.start() for t in ts]; [t.join() for t in ts]; print('instances:', len(r))\"", what: { en: "Reproduce the lazy-singleton race: 8 threads, no lock → you'll usually get several 'singletons'. Add a threading.Lock and it drops to 1.", he: "משחזרים את ה-race של lazy singleton: 8 threads בלי lock → בדרך כלל יוצאים כמה 'singletons'. מוסיפים threading.Lock ויורד ל-1." } },
    { cmd: "redis-cli SET lock:nightly-report $(hostname) NX PX 30000", what: { en: "Acquire a simple distributed lock: OK means you got it, (nil) means someone else holds it. Expires after 30 s if the holder dies.", he: "תופסים distributed lock פשוט: OK — הוא שלכם, (nil) — מישהו אחר מחזיק. פג אחרי 30 שניות אם המחזיק מת." } },
    { cmd: "npm ls react", what: { en: "Find duplicate package copies — each copy is its own module-cache 'singleton' (the root cause of 'Invalid hook call' and instanceof bugs).", he: "מוצאים עותקים כפולים של חבילה — כל עותק הוא 'singleton' נפרד ב-module cache (שורש הבעיה של 'Invalid hook call' ובאגים של instanceof)." } }
  ],
  mnemonic: {
    en: "Always ask 'one per WHAT?' — class, container, request, process, pod, cluster. Volatile for DCL, holder for Java, Lazy&lt;T&gt; for C#, module for Python, globalThis for hot reload, Lease + fencing for the cluster.",
    he: "תמיד לשאול 'אחד לכל מה?' — class, container, request, process, pod, cluster. volatile ל-DCL, holder ל-Java, Lazy&lt;T&gt; ל-C#, מודול לפייתון, globalThis ל-hot reload, Lease + fencing ל-cluster."
  },
  pitfalls: [
    { en: "Double-checked locking without volatile (Java) — compiles, passes tests, and very rarely hands out a half-built object in production.", he: "Double-checked locking בלי volatile (Java) — מתקמפל, עובר טסטים, ולעתים נדירות מאוד מחלק אובייקט חצי-בנוי בפרודקשן." },
    { en: "Assuming replicas: 1 means 'exactly one' — rolling updates (maxSurge) and node partitions both create overlap. Use Recreate, leader election or idempotency.", he: "להניח ש-replicas: 1 אומר 'בדיוק אחד' — rolling updates (maxSurge) ו-partitions של nodes יוצרים חפיפה. משתמשים ב-Recreate, leader election או אידמפוטנטיות." },
    { en: "Creating DB pools at import time in a pre-fork server (gunicorn --preload): workers share sockets and corrupt each other's protocol streams.", he: "ליצור pools של DB בזמן import בשרת pre-fork (gunicorn --preload): ה-workers חולקים sockets ומשחיתים אחד לשני את ה-protocol." },
    { en: "Captive dependency: a singleton capturing a scoped DbContext → cross-request data leaks and threading exceptions.", he: "Captive dependency: singleton שתופס DbContext שהוא scoped → דליפת נתונים בין requests ו-exceptions של threading." }
  ],
  interview: [
    { q: { en: "Why does double-checked locking need volatile in Java?", he: "למה double-checked locking צריך volatile ב-Java?" },
      a: { en: "Object construction isn't atomic: allocate, initialize fields, publish the reference. Without a happens-before edge, the JIT/CPU may publish the reference before the fields are written, so a thread on the fast path (no lock) sees non-null and uses a partially constructed object. volatile (Java 5+ memory model) forbids that reordering and makes the write visible. Simpler alternatives: holder idiom or enum.", he: "בניית אובייקט אינה אטומית: הקצאה, אתחול שדות, פרסום ה-reference. בלי קשר happens-before, ה-JIT/CPU יכולים לפרסם את ה-reference לפני שהשדות נכתבו, ו-thread במסלול המהיר (בלי lock) רואה non-null ומשתמש באובייקט חצי-בנוי. volatile (מודל הזיכרון של Java 5+) אוסר את הסידור מחדש הזה ומבטיח נראות. חלופות פשוטות: holder idiom או enum." } },
    { q: { en: "How do you ensure a scheduled job runs exactly once across 5 replicas?", he: "איך מבטיחים ש-job מתוזמן ירוץ פעם אחת בדיוק על פני 5 replicas?" },
      a: { en: "You can't get true exactly-once execution; you get at-most-one-at-a-time plus idempotent effects. Options: move it to a k8s CronJob with concurrencyPolicy Forbid; or leader election via a Lease so only the leader schedules; or a per-run lock (Postgres advisory lock / Redis SET NX PX) keyed by job+date. Then make the job idempotent (unique constraint on invoice_date+customer, upserts) so a duplicate run after a lease expiry is harmless; use fencing tokens if a stale leader could corrupt data.", he: "אי אפשר לקבל exactly-once אמיתי בביצוע; מקבלים לכל היותר אחד בכל רגע + השפעות אידמפוטנטיות. אפשרויות: להעביר ל-CronJob ב-k8s עם concurrencyPolicy Forbid; או leader election דרך Lease כך שרק ה-leader מתזמן; או lock לכל ריצה (advisory lock ב-Postgres / SET NX PX ב-Redis) לפי job+תאריך. ואז להפוך את ה-job לאידמפוטנטי (unique constraint על invoice_date+customer, upserts) כך שריצה כפולה אחרי פקיעת lease לא מזיקה; fencing tokens אם leader ישן יכול להשחית נתונים." } },
    { q: { en: "Are singletons an anti-pattern?", he: "האם singletons הם anti-pattern?" },
      a: { en: "The global access point is; the single instance often isn't. One pool, one logger, one loaded model per process are correct. The problem is reaching them via static getters — hidden dependencies, shared mutable state, untestable. Create the one instance in the composition root and inject it (or use the DI container's singleton lifetime).", he: "נקודת הגישה הגלובלית — כן; המופע היחיד — לרוב לא. pool אחד, logger אחד, מודל טעון אחד לכל process — זה נכון. הבעיה היא להגיע אליהם דרך getters סטטיים — תלויות מוסתרות, state משותף שניתן לשינוי, לא בר-בדיקה. יוצרים את המופע היחיד ב-composition root ומזריקים אותו (או משתמשים ב-singleton lifetime של ה-DI container)." } }
  ],
  quiz: [
    { q: { en: "Which Java singleton is lazy AND thread-safe without any explicit locking code?", he: "איזה singleton ב-Java הוא גם lazy וגם thread-safe בלי שום קוד נעילה מפורש?" },
      options: [ { en: "Unsynchronized lazy getter", he: "Getter עצל בלי סנכרון" }, { en: "Initialization-on-demand holder", he: "Initialization-on-demand holder" }, { en: "Double-checked locking without volatile", he: "Double-checked locking בלי volatile" }, { en: "Public static mutable field", he: "שדה static ציבורי שניתן לשינוי" } ],
      answer: 1, explain: { en: "The nested Holder class is loaded on first access, and the JVM guarantees class initialization is thread-safe.", he: "ה-class המקונן Holder נטען בגישה הראשונה, וה-JVM מבטיח שאתחול class הוא thread-safe." } },
    { q: { en: "An ASP.NET Core singleton takes a scoped DbContext in its constructor. Result?", he: "Singleton ב-ASP.NET Core מקבל DbContext שהוא scoped ב-constructor. התוצאה?" },
      options: [ { en: "Works fine, DI handles it", he: "עובד מצוין, ה-DI מטפל בזה" }, { en: "Captive dependency: one DbContext shared across all requests and threads", he: "Captive dependency: DbContext אחד משותף לכל ה-requests וה-threads" }, { en: "A new DbContext per request", he: "DbContext חדש לכל request" }, { en: "Compile error", he: "שגיאת קומפילציה" } ],
      answer: 1, explain: { en: "The singleton lives forever, so the scoped object it captured does too — not thread-safe, stale tracking. Use a scope/context factory.", he: "ה-singleton חי לנצח, אז גם האובייקט ה-scoped שהוא תפס — לא thread-safe, tracking מעופש. משתמשים ב-scope/context factory." } },
    { q: { en: "What does a fencing token protect against?", he: "מפני מה fencing token מגן?" },
      options: [ { en: "Two threads creating two instances", he: "שני threads שיוצרים שני מופעים" }, { en: "A stale leader (paused past its lease) writing after a new leader took over", he: "Leader ישן (שנעצר מעבר ל-lease) שכותב אחרי ש-leader חדש לקח פיקוד" }, { en: "Network packet loss", he: "אובדן packets ברשת" }, { en: "Memory leaks", he: "דליפות זיכרון" } ],
      answer: 1, explain: { en: "The storage rejects writes with a token lower than the highest seen, so the old leader's late writes are refused.", he: "האחסון דוחה כתיבות עם token נמוך מהגבוה ביותר שנראה, אז הכתיבות המאוחרות של ה-leader הישן נדחות." } },
    { q: { en: "Your Node app has two versions of the same library in node_modules, each exporting a singleton client. You get…", he: "באפליקציית Node יש שתי גרסאות של אותה ספרייה ב-node_modules, כל אחת מייצאת client singleton. מקבלים…" },
      options: [ { en: "One shared instance", he: "מופע משותף אחד" }, { en: "Two separate instances — module cache is keyed by resolved path", he: "שני מופעים נפרדים — ה-module cache ממופתח לפי הנתיב שנפתר" }, { en: "A startup crash", he: "קריסה בעלייה" }, { en: "Node merges them automatically", he: "Node מאחד אותם אוטומטית" } ],
      answer: 1, explain: { en: "Different paths → different cache entries → two 'singletons'. Dedupe dependencies (npm dedupe, peerDependencies).", he: "נתיבים שונים → רשומות cache שונות → שני 'singletons'. עושים dedupe לתלויות (npm dedupe, peerDependencies)." } }
  ],
  related: ["pr-design-patterns", "pr-concurrency-parallelism", "pr-clusters", "pr-idempotency", "staff-consensus-consistency"]
});

INFRA.lessons.push({
  id: "pr-cloud-patterns",
  track: "principal",
  order: 33,
  icon: "🏛️",
  level: 3,
  minutes: 22,
  title: { en: "Cloud & Architecture Design Patterns: The Distributed-Systems Toolbox", he: "Design Patterns של ענן וארכיטקטורה: ארגז הכלים של מערכות מבוזרות" },
  tldr: {
    en: "GoF patterns organize classes; cloud patterns organize services: sidecars and ambassadors for cross-cutting concerns, strangler fig and anti-corruption layers for migrations, CQRS/sagas/outbox for data across services, and retry/circuit breaker/bulkhead/throttling for surviving failure.",
    he: "Patterns של GoF מארגנים classes; patterns של ענן מארגנים services: sidecars ו-ambassadors ל-cross-cutting concerns, strangler fig ו-anti-corruption layers למיגרציות, CQRS/sagas/outbox לנתונים בין services, ו-retry/circuit breaker/bulkhead/throttling כדי לשרוד כשלים."
  },
  analogy: {
    en: "Think of a city. A sidecar is the motorcycle sidecar: a passenger bolted onto every vehicle doing the navigation and radio. A strangler fig is building a new highway next to the old road, moving traffic lane by lane, and only then demolishing the old road. A bulkhead is a ship's watertight compartments: one flooded room doesn't sink the ship. A valet key is the car key that only opens the door and starts the engine — not the trunk or glovebox — and only for tonight.",
    he: "תחשבו על עיר. Sidecar זה סירת צד של אופנוע: נוסע שמוברג לכל רכב ועושה ניווט וקשר. Strangler fig זה לבנות כביש מהיר חדש ליד הכביש הישן, להעביר תנועה נתיב אחרי נתיב, ורק אז להרוס את הישן. Bulkhead זה תאים אטומים במים בספינה: חדר אחד שמוצף לא מטביע את הספינה. Valet key זה מפתח הוולט שפותח רק את הדלת ומניע — לא את תא המטען ולא את תא הכפפות — ורק להערב."
  },
  sections: [
    {
      h: { en: "Structural & deployment patterns: sidecar, ambassador, adapter, gateway", he: "Patterns מבניים ופריסה: sidecar, ambassador, adapter, gateway" },
      body: {
        en: `<ul>
<li><strong>Sidecar</strong> — <em>Problem</em>: every service needs TLS, metrics, log shipping, config reload, in every language. <em>Solution</em>: a helper container in the same Pod sharing network/volumes. <em>Example</em>: Envoy (Istio), Fluent Bit, Vault Agent injector, Cloud SQL Auth Proxy.</li>
<li><strong>Ambassador</strong> — a sidecar specialized as an <em>outbound</em> proxy: the app calls <code>localhost:6379</code> and the ambassador handles sharding, retries, TLS and service discovery to the real backend. <em>Analogy</em>: a diplomat who speaks the foreign language for you. <em>Example</em>: twemproxy/envoy for Redis, the Cloud SQL proxy.</li>
<li><strong>Adapter (sidecar)</strong> — normalizes the app's <em>outputs</em> to a standard: a Prometheus exporter beside a legacy app, a log-format converter.</li>
<li><strong>Gateway offloading / routing / aggregation</strong> — put TLS, auth, rate limits, WAF in the edge gateway (offloading); route <code>/api/orders</code> to service A (routing); one client call fans out to 3 services and merges (aggregation). <em>Example</em>: Kong, Envoy Gateway, AWS API Gateway, Apigee.</li>
<li><strong>Backends for Frontends (BFF)</strong> — one backend per client type (mobile, web, partner) shaping data for that UI. <em>Analogy</em>: a translator per delegation instead of one universal translator. <em>Example</em>: Netflix and SoundCloud per-device APIs; a GraphQL BFF for the web app.</li>
</ul>
<pre>apiVersion: v1
kind: Pod
metadata: { name: orders }
spec:
  containers:
  - name: app                     # business logic only, talks to localhost
    image: orders:3.1
  - name: envoy                   # sidecar: mTLS, retries, metrics (ambassador for outbound)
    image: envoyproxy/envoy:v1.31
  - name: log-shipper             # sidecar: tails /var/log/app, ships to Loki
    image: fluent/fluent-bit:3.1
    volumeMounts: [{ name: logs, mountPath: /var/log/app }]
  volumes: [{ name: logs, emptyDir: {} }]</pre>
<blockquote>⚠️ Production tip: Sidecars cost per-Pod CPU/RAM (×1000 pods), add a hop of latency, and complicate startup/shutdown ordering (use native sidecars: <code>initContainers</code> with <code>restartPolicy: Always</code>, k8s 1.29+). Ambient/eBPF meshes exist precisely to remove the per-pod sidecar.</blockquote>`,
        he: `<ul>
<li><strong>Sidecar</strong> — <em>בעיה</em>: כל service צריך TLS, metrics, שליחת logs, reload ל-config, בכל שפה. <em>פתרון</em>: container עזר באותו Pod שחולק רשת/volumes. <em>דוגמה</em>: Envoy (Istio), Fluent Bit, Vault Agent injector, Cloud SQL Auth Proxy.</li>
<li><strong>Ambassador</strong> — sidecar שמתמחה כ-proxy <em>יוצא</em>: האפליקציה קוראת ל-<code>localhost:6379</code> וה-ambassador מטפל ב-sharding, retries, TLS ו-service discovery מול ה-backend האמיתי. <em>אנלוגיה</em>: דיפלומט שמדבר בשבילך את השפה הזרה. <em>דוגמה</em>: twemproxy/envoy ל-Redis, ה-Cloud SQL proxy.</li>
<li><strong>Adapter (sidecar)</strong> — מנרמל את ה-<em>פלטים</em> של האפליקציה לסטנדרט: Prometheus exporter ליד אפליקציה ישנה, ממיר פורמט logs.</li>
<li><strong>Gateway offloading / routing / aggregation</strong> — שמים TLS, auth, rate limits, WAF ב-gateway בקצה (offloading); מנתבים <code>/api/orders</code> ל-service A (routing); קריאה אחת של הלקוח מתפצלת ל-3 services ומתמזגת (aggregation). <em>דוגמה</em>: Kong, Envoy Gateway, AWS API Gateway, Apigee.</li>
<li><strong>Backends for Frontends (BFF)</strong> — backend לכל סוג לקוח (מובייל, ווב, שותפים) שמעצב נתונים ל-UI הזה. <em>אנלוגיה</em>: מתורגמן לכל משלחת במקום מתורגמן אוניברסלי אחד. <em>דוגמה</em>: ה-APIs לכל מכשיר של Netflix ו-SoundCloud; BFF ב-GraphQL לאפליקציית הווב.</li>
</ul>
<pre>apiVersion: v1
kind: Pod
metadata: { name: orders }
spec:
  containers:
  - name: app                     # business logic only, talks to localhost
    image: orders:3.1
  - name: envoy                   # sidecar: mTLS, retries, metrics (ambassador for outbound)
    image: envoyproxy/envoy:v1.31
  - name: log-shipper             # sidecar: tails /var/log/app, ships to Loki
    image: fluent/fluent-bit:3.1
    volumeMounts: [{ name: logs, mountPath: /var/log/app }]
  volumes: [{ name: logs, emptyDir: {} }]</pre>
<blockquote>⚠️ טיפ לפרודקשן: sidecars עולים CPU/RAM לכל Pod (×1000 pods), מוסיפים hop של latency, ומסבכים סדר עלייה/כיבוי (משתמשים ב-native sidecars: <code>initContainers</code> עם <code>restartPolicy: Always</code>, מ-k8s 1.29). Ambient/eBPF meshes קיימים בדיוק כדי להיפטר מה-sidecar לכל pod.</blockquote>`
      }
    },
    {
      h: { en: "Migration patterns: strangler fig and anti-corruption layer", he: "Patterns של מיגרציה: strangler fig ו-anti-corruption layer" },
      body: {
        en: `<p><strong>Strangler fig</strong> — <em>Problem</em>: a big-bang rewrite of a legacy monolith takes 2 years and fails. <em>Solution</em>: put a routing facade (gateway/proxy) in front, carve out one capability at a time into new services, route that path to the new code, and keep going until the monolith is empty. Named after the vine that grows around a tree until it replaces it.</p>
<pre># nginx as the strangler facade
location /api/invoices/ { proxy_pass http://invoices-svc; }   # migrated (step 3)
location /api/users/    { proxy_pass http://users-svc; }      # migrated (step 1)
location /              { proxy_pass http://legacy-monolith; } # everything else, shrinking</pre>
<p>Pair it with shadow traffic (send copies to the new service, compare responses) and feature flags for per-tenant cut-over; keep rollback as a one-line route change.</p>
<p><strong>Anti-Corruption Layer (ACL)</strong> — <em>Problem</em>: the legacy ERP or a vendor API has a messy model (<code>CUST_FLG_3 = 'Y'</code>), and if your new service uses it directly, the mess spreads into your domain. <em>Solution</em>: a translation layer that converts their model to yours at the boundary. <em>Analogy</em>: customs at the border — nothing gets in without inspection and repackaging.</p>
<pre># ACL: the domain never sees SAP field names
class SapCustomerTranslator:
    def to_domain(self, raw: dict) -&gt; Customer:
        return Customer(
            id=raw["KUNNR"].lstrip("0"),
            name=raw["NAME1"].strip(),
            is_vip=raw.get("CUST_FLG_3") == "Y",
            country=ISO_FROM_SAP[raw["LAND1"]],
        )</pre>
<blockquote>💡 Real world: Most successful monolith-to-microservices migrations (Amazon, Shopify's modular monolith path, countless banks) are strangler-style. Martin Fowler named it in 2004; the key insight is that the facade makes every step reversible.</blockquote>`,
        he: `<p><strong>Strangler fig</strong> — <em>בעיה</em>: שכתוב big-bang של מונוליט ישן לוקח שנתיים ונכשל. <em>פתרון</em>: שמים facade של ניתוב (gateway/proxy) מלפנים, מוציאים יכולת אחת בכל פעם ל-services חדשים, מנתבים את הנתיב הזה לקוד החדש, וממשיכים עד שהמונוליט ריק. נקרא על שם הצמח המטפס שגדל סביב עץ עד שהוא מחליף אותו.</p>
<pre># nginx as the strangler facade
location /api/invoices/ { proxy_pass http://invoices-svc; }   # migrated (step 3)
location /api/users/    { proxy_pass http://users-svc; }      # migrated (step 1)
location /              { proxy_pass http://legacy-monolith; } # everything else, shrinking</pre>
<p>משלבים עם shadow traffic (שולחים עותקים ל-service החדש ומשווים תשובות) ו-feature flags למעבר לפי tenant; ה-rollback נשאר שינוי של שורת ניתוב אחת.</p>
<p><strong>Anti-Corruption Layer (ACL)</strong> — <em>בעיה</em>: ל-ERP הישן או ל-API של ספק יש מודל מבולגן (<code>CUST_FLG_3 = 'Y'</code>), ואם ה-service החדש משתמש בו ישירות, הבלגן מתפשט לדומיין שלכם. <em>פתרון</em>: שכבת תרגום שממירה את המודל שלהם לשלכם בגבול. <em>אנלוגיה</em>: מכס בגבול — שום דבר לא נכנס בלי בדיקה ואריזה מחדש.</p>
<pre># ACL: the domain never sees SAP field names
class SapCustomerTranslator:
    def to_domain(self, raw: dict) -&gt; Customer:
        return Customer(
            id=raw["KUNNR"].lstrip("0"),
            name=raw["NAME1"].strip(),
            is_vip=raw.get("CUST_FLG_3") == "Y",
            country=ISO_FROM_SAP[raw["LAND1"]],
        )</pre>
<blockquote>💡 מהשטח: רוב המיגרציות המוצלחות ממונוליט ל-microservices (Amazon, המסלול של Shopify ל-modular monolith, אינספור בנקים) הן בסגנון strangler. Martin Fowler נתן לזה שם ב-2004; התובנה המרכזית היא שה-facade הופך כל צעד להפיך.</blockquote>`
      }
    },
    {
      h: { en: "Data patterns: CQRS, event sourcing, saga, outbox, materialized view, sharding", he: "Patterns של נתונים: CQRS, event sourcing, saga, outbox, materialized view, sharding" },
      body: {
        en: `<ul>
<li><strong>CQRS &amp; Event Sourcing</strong> — separate write and read models; store events as the source of truth. Full lesson: <code>#/lesson/arch-event-driven</code>.</li>
<li><strong>Saga + Compensating Transaction</strong> — multi-service business transaction as a sequence of local transactions, each with a semantic undo (refund, release stock). Orchestrated (Temporal, Step Functions) or choreographed (events).</li>
<li><strong>Transactional Outbox</strong> — write the event into an outbox table in the same DB transaction, relay it to the broker (Debezium). Solves dual-write.</li>
<li><strong>Materialized View</strong> — precompute a read-optimized view from data spread across stores. <em>Analogy</em>: the restaurant's printed menu vs asking the kitchen each time. <em>Example</em>: a <code>customer_order_summary</code> table updated by a consumer; Postgres <code>MATERIALIZED VIEW</code> refreshed every 5 min; Elasticsearch index fed by CDC.</li>
<li><strong>Sharding</strong> — split data horizontally by a key (customer_id hash, region, tenant) to scale writes and storage. Watch for hot shards, cross-shard queries and resharding. See <code>#/lesson/db-sharding</code>.</li>
<li><strong>Cache patterns</strong>:
<table>
<tr><th>Pattern</th><th>Read</th><th>Write</th><th>Trade-off</th></tr>
<tr><td>Cache-aside</td><td>App checks cache, on miss reads DB and fills</td><td>App writes DB, deletes key</td><td>Most common; stale window, stampede risk</td></tr>
<tr><td>Read-through</td><td>Cache loads from DB itself on miss</td><td>—</td><td>Simpler app; cache needs DB access</td></tr>
<tr><td>Write-through</td><td>—</td><td>Write cache + DB synchronously</td><td>Always fresh; slower writes</td></tr>
<tr><td>Write-behind (back)</td><td>—</td><td>Write cache, flush to DB async</td><td>Fast writes; data loss if cache dies</td></tr>
</table></li>
</ul>
<pre># cache-aside with stampede protection (Python + Redis)
def get_product(pid):
    key = f"product:{pid}"
    if (hit := r.get(key)) is not None:
        return json.loads(hit)
    if r.set(f"lock:{key}", 1, nx=True, ex=5):            # only one rebuilds
        row = db.fetch_product(pid)
        r.set(key, json.dumps(row), ex=300 + random.randint(0, 60))  # jittered TTL
        r.delete(f"lock:{key}")
        return row
    time.sleep(0.05); return get_product(pid)              # others wait briefly</pre>`,
        he: `<ul>
<li><strong>CQRS ו-Event Sourcing</strong> — מפרידים מודל כתיבה ומודל קריאה; שומרים events כמקור האמת. שיעור מלא: <code>#/lesson/arch-event-driven</code>.</li>
<li><strong>Saga + Compensating Transaction</strong> — טרנזקציה עסקית חוצת-services כרצף טרנזקציות מקומיות, לכל אחת ביטול סמנטי (החזר כספי, שחרור מלאי). Orchestrated (Temporal, Step Functions) או choreographed (events).</li>
<li><strong>Transactional Outbox</strong> — כותבים את ה-event לטבלת outbox באותה טרנזקציה של ה-DB, ו-relay מעביר ל-broker (Debezium). פותר dual-write.</li>
<li><strong>Materialized View</strong> — מחשבים מראש view מותאם לקריאה מנתונים שמפוזרים בכמה stores. <em>אנלוגיה</em>: התפריט המודפס במסעדה מול לשאול את המטבח כל פעם. <em>דוגמה</em>: טבלת <code>customer_order_summary</code> שמתעדכנת ע"י consumer; <code>MATERIALIZED VIEW</code> ב-Postgres שמתרענן כל 5 דקות; אינדקס Elasticsearch שמוזן מ-CDC.</li>
<li><strong>Sharding</strong> — מפצלים נתונים אופקית לפי מפתח (hash של customer_id, אזור, tenant) כדי להגדיל כתיבות ואחסון. שימו לב ל-hot shards, queries חוצי-shards ו-resharding. ראו <code>#/lesson/db-sharding</code>.</li>
<li><strong>Patterns של cache</strong>:
<table>
<tr><th>Pattern</th><th>קריאה</th><th>כתיבה</th><th>Trade-off</th></tr>
<tr><td>Cache-aside</td><td>האפליקציה בודקת cache, ב-miss קוראת מה-DB וממלאת</td><td>האפליקציה כותבת ל-DB, מוחקת key</td><td>הכי נפוץ; חלון של stale, סיכון ל-stampede</td></tr>
<tr><td>Read-through</td><td>ה-cache עצמו טוען מה-DB ב-miss</td><td>—</td><td>אפליקציה פשוטה יותר; ה-cache צריך גישה ל-DB</td></tr>
<tr><td>Write-through</td><td>—</td><td>כותבים ל-cache ול-DB סינכרונית</td><td>תמיד טרי; כתיבות איטיות יותר</td></tr>
<tr><td>Write-behind (back)</td><td>—</td><td>כותבים ל-cache, flush ל-DB אסינכרוני</td><td>כתיבות מהירות; אובדן נתונים אם ה-cache מת</td></tr>
</table></li>
</ul>
<pre># cache-aside with stampede protection (Python + Redis)
def get_product(pid):
    key = f"product:{pid}"
    if (hit := r.get(key)) is not None:
        return json.loads(hit)
    if r.set(f"lock:{key}", 1, nx=True, ex=5):            # only one rebuilds
        row = db.fetch_product(pid)
        r.set(key, json.dumps(row), ex=300 + random.randint(0, 60))  # jittered TTL
        r.delete(f"lock:{key}")
        return row
    time.sleep(0.05); return get_product(pid)              # others wait briefly</pre>`
      }
    },
    {
      h: { en: "Messaging & coordination: competing consumers, claim check, leader election, valet key", he: "הודעות ותיאום: competing consumers, claim check, leader election, valet key" },
      body: {
        en: `<ul>
<li><strong>Competing Consumers</strong> — many workers pull from one queue; each message goes to one worker. Scales throughput horizontally and smooths spikes (queue-based load leveling). <em>Analogy</em>: one line at the bank, many tellers. <em>Example</em>: SQS + an autoscaled worker Deployment (KEDA on queue depth). Needs idempotent handlers — messages can be redelivered.</li>
<li><strong>Claim Check</strong> — <em>Problem</em>: a 40 MB video or PDF doesn't fit in a message (SQS max 256 KB, Kafka default 1 MB). <em>Solution</em>: store the payload in blob storage, send a small message with the reference. <em>Analogy</em>: coat check — you carry the ticket, not the coat.</li>
<li><strong>Leader Election</strong> — one instance coordinates (schedules, compacts, assigns partitions) while others stand by. k8s Lease, etcd, ZooKeeper; always with fencing for correctness. See <code>#/lesson/pr-singletons</code>.</li>
<li><strong>Valet Key</strong> — <em>Problem</em>: routing 2 GB uploads through your API servers wastes bandwidth and CPU. <em>Solution</em>: the API issues a short-lived, scoped token (S3 pre-signed URL, Azure SAS, GCS signed URL) and the client talks to storage directly.</li>
<li><strong>Priority Queue / Queue-based load leveling / Scheduler-agent-supervisor</strong> — separate queues per priority, buffer bursts so the backend sees a steady rate, and a supervisor that retries or compensates stuck work.</li>
</ul>
<pre># Valet key: pre-signed upload URL, valid 10 minutes, one object only
url = s3.generate_presigned_url(
    "put_object",
    Params={"Bucket": "uploads-prod", "Key": f"user/{uid}/{uuid4()}.mp4",
            "ContentType": "video/mp4"},
    ExpiresIn=600)
# client: curl -X PUT -H "Content-Type: video/mp4" --upload-file clip.mp4 "$url"

# Claim check: message carries a pointer, not the payload
{ "type": "VideoUploaded", "videoId": "v-91", "blob": "s3://uploads-prod/user/42/ab12.mp4", "sizeBytes": 41943040 }</pre>`,
        he: `<ul>
<li><strong>Competing Consumers</strong> — הרבה workers מושכים מתור אחד; כל הודעה הולכת ל-worker אחד. מגדיל throughput אופקית ומחליק קפיצות (queue-based load leveling). <em>אנלוגיה</em>: תור אחד בבנק, הרבה פקידים. <em>דוגמה</em>: SQS + Deployment של workers עם autoscaling (KEDA לפי עומק התור). דורש handlers אידמפוטנטיים — הודעות יכולות להימסר שוב.</li>
<li><strong>Claim Check</strong> — <em>בעיה</em>: וידאו או PDF של 40 MB לא נכנס בהודעה (מקסימום 256 KB ב-SQS, ברירת מחדל 1 MB ב-Kafka). <em>פתרון</em>: שומרים את ה-payload ב-blob storage, ושולחים הודעה קטנה עם הפניה. <em>אנלוגיה</em>: מלתחה — מחזיקים את הפתק, לא את המעיל.</li>
<li><strong>Leader Election</strong> — מופע אחד מתאם (מתזמן, עושה compaction, מחלק partitions) ואחרים בהמתנה. Lease ב-k8s, etcd, ZooKeeper; תמיד עם fencing בשביל נכונות. ראו <code>#/lesson/pr-singletons</code>.</li>
<li><strong>Valet Key</strong> — <em>בעיה</em>: להעביר העלאות של 2 GB דרך שרתי ה-API מבזבז רוחב פס ו-CPU. <em>פתרון</em>: ה-API מנפיק token קצר-חיים ומוגבל (pre-signed URL ב-S3, SAS ב-Azure, signed URL ב-GCS) והלקוח מדבר ישירות עם האחסון.</li>
<li><strong>Priority Queue / Queue-based load leveling / Scheduler-agent-supervisor</strong> — תורים נפרדים לפי עדיפות, מאגר לקפיצות כדי שה-backend יראה קצב יציב, ו-supervisor שמנסה שוב או מפצה על עבודה תקועה.</li>
</ul>
<pre># Valet key: pre-signed upload URL, valid 10 minutes, one object only
url = s3.generate_presigned_url(
    "put_object",
    Params={"Bucket": "uploads-prod", "Key": f"user/{uid}/{uuid4()}.mp4",
            "ContentType": "video/mp4"},
    ExpiresIn=600)
# client: curl -X PUT -H "Content-Type: video/mp4" --upload-file clip.mp4 "$url"

# Claim check: message carries a pointer, not the payload
{ "type": "VideoUploaded", "videoId": "v-91", "blob": "s3://uploads-prod/user/42/ab12.mp4", "sizeBytes": 41943040 }</pre>`
      }
    },
    {
      h: { en: "Resilience patterns: retry, circuit breaker, bulkhead, throttling, health endpoints", he: "Patterns של חוסן: retry, circuit breaker, bulkhead, throttling, health endpoints" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>Problem</th><th>Analogy</th><th>Example / config</th></tr>
<tr><td><strong>Retry</strong> (backoff + jitter)</td><td>Transient failures (blip, 503, timeout)</td><td>Redial a busy line, but wait a bit longer each time</td><td>3 attempts, 100ms·2ⁿ + jitter, only idempotent ops, retry budget ≤10%</td></tr>
<tr><td><strong>Circuit Breaker</strong></td><td>Hammering a dead dependency; threads pile up</td><td>The fuse in your electrical panel</td><td>Open at 50% errors/10 s, half-open after 30 s (Resilience4j, Polly, Envoy outlier detection)</td></tr>
<tr><td><strong>Bulkhead</strong></td><td>One slow dependency consumes all threads/connections</td><td>Ship compartments</td><td>Separate pools: 20 conns for payments, 10 for recommendations; per-tenant concurrency caps</td></tr>
<tr><td><strong>Timeout + deadline propagation</strong></td><td>Requests wait forever</td><td>"If the bus isn't here in 10 min, take a taxi"</td><td>gRPC deadlines passed downstream; every hop gets remaining budget</td></tr>
<tr><td><strong>Throttling / rate limiting</strong></td><td>One client or a spike exhausts capacity</td><td>A nightclub bouncer</td><td>Token bucket per API key, 429 + Retry-After. See <code>#/lesson/pr-rate-limiters</code></td></tr>
<tr><td><strong>Load shedding / graceful degradation</strong></td><td>Overload causes total collapse</td><td>Restaurant serves a short menu on a packed night</td><td>Drop low-priority traffic first, serve cached/static fallbacks</td></tr>
<tr><td><strong>Health Endpoint Monitoring</strong></td><td>LB/orchestrator can't tell if an instance works</td><td>A nurse checking vitals</td><td><code>/livez</code> (process alive), <code>/readyz</code> (can serve: deps ok), synthetic probes from outside</td></tr>
</table>
<pre>// C# (Polly v8) — the standard resilience pipeline, ordered outer to inner
builder.Services.AddHttpClient("payments")
  .AddResilienceHandler("pay", p =&gt; p
    .AddTimeout(TimeSpan.FromSeconds(10))                 // overall deadline
    .AddRetry(new() { MaxRetryAttempts = 3, BackoffType = DelayBackoffType.Exponential, UseJitter = true })
    .AddCircuitBreaker(new() { FailureRatio = 0.5, SamplingDuration = TimeSpan.FromSeconds(10),
                               BreakDuration = TimeSpan.FromSeconds(30) })
    .AddTimeout(TimeSpan.FromSeconds(2)));                // per-attempt timeout</pre>
<blockquote>⚠️ Production tip: Retries without a budget turn a 1-minute blip into a metastable outage (3 retries at 3 layers = 27× load). Retry at ONE layer, add jitter, cap with a retry budget, and never make <code>/readyz</code> depend on a shared dependency (the DB) or every pod goes unready at once and the LB has nowhere to send traffic.</blockquote>`,
        he: `<table>
<tr><th>Pattern</th><th>בעיה</th><th>אנלוגיה</th><th>דוגמה / קונפיג</th></tr>
<tr><td><strong>Retry</strong> (backoff + jitter)</td><td>כשלים חולפים (blip, 503, timeout)</td><td>לחייג שוב לקו תפוס, ולחכות קצת יותר בכל פעם</td><td>3 ניסיונות, 100ms·2ⁿ + jitter, רק פעולות אידמפוטנטיות, retry budget ≤10%</td></tr>
<tr><td><strong>Circuit Breaker</strong></td><td>להפציץ תלות מתה; threads נערמים</td><td>הפיוז בלוח החשמל</td><td>נפתח ב-50% שגיאות/10 שניות, half-open אחרי 30 שניות (Resilience4j, Polly, outlier detection ב-Envoy)</td></tr>
<tr><td><strong>Bulkhead</strong></td><td>תלות איטית אחת אוכלת את כל ה-threads/connections</td><td>תאים בספינה</td><td>pools נפרדים: 20 connections ל-payments, 10 ל-recommendations; מגבלת concurrency לכל tenant</td></tr>
<tr><td><strong>Timeout + deadline propagation</strong></td><td>בקשות מחכות לנצח</td><td>"אם האוטובוס לא מגיע תוך 10 דקות, לוקחים מונית"</td><td>deadlines של gRPC שעוברים הלאה; כל hop מקבל את התקציב שנשאר</td></tr>
<tr><td><strong>Throttling / rate limiting</strong></td><td>לקוח אחד או קפיצה מכלים את הקיבולת</td><td>סלקטור במועדון</td><td>Token bucket לכל API key, 429 + Retry-After. ראו <code>#/lesson/pr-rate-limiters</code></td></tr>
<tr><td><strong>Load shedding / graceful degradation</strong></td><td>עומס יתר גורם לקריסה טוטאלית</td><td>מסעדה שמגישה תפריט מצומצם בערב עמוס</td><td>זורקים קודם תנועה בעדיפות נמוכה, מגישים fallbacks מ-cache/סטטיים</td></tr>
<tr><td><strong>Health Endpoint Monitoring</strong></td><td>ה-LB/orchestrator לא יודע אם מופע עובד</td><td>אחות שבודקת סימנים חיוניים</td><td><code>/livez</code> (התהליך חי), <code>/readyz</code> (יכול לשרת: התלויות תקינות), probes סינתטיים מבחוץ</td></tr>
</table>
<pre>// C# (Polly v8) — the standard resilience pipeline, ordered outer to inner
builder.Services.AddHttpClient("payments")
  .AddResilienceHandler("pay", p =&gt; p
    .AddTimeout(TimeSpan.FromSeconds(10))                 // overall deadline
    .AddRetry(new() { MaxRetryAttempts = 3, BackoffType = DelayBackoffType.Exponential, UseJitter = true })
    .AddCircuitBreaker(new() { FailureRatio = 0.5, SamplingDuration = TimeSpan.FromSeconds(10),
                               BreakDuration = TimeSpan.FromSeconds(30) })
    .AddTimeout(TimeSpan.FromSeconds(2)));                // per-attempt timeout</pre>
<blockquote>⚠️ טיפ לפרודקשן: retries בלי budget הופכים blip של דקה לתקלה metastable (3 retries ב-3 שכבות = פי 27 עומס). עושים retry בשכבה אחת, מוסיפים jitter, מגבילים ב-retry budget, ולעולם לא גורמים ל-<code>/readyz</code> להיות תלוי בתלות משותפת (ה-DB) — אחרת כל ה-pods הופכים unready בבת אחת ול-LB אין לאן לשלוח תנועה.</blockquote>`
      }
    },
    {
      h: { en: "Master table: pick the pattern from the problem", he: "טבלת מאסטר: בוחרים pattern לפי הבעיה" },
      body: {
        en: `<table>
<tr><th>If your problem is…</th><th>Reach for</th></tr>
<tr><td>Same cross-cutting concern in every service/language</td><td>Sidecar / service mesh</td></tr>
<tr><td>Complex outbound connectivity (sharded Redis, DB auth)</td><td>Ambassador</td></tr>
<tr><td>Each client type wants different data shapes</td><td>BFF / gateway aggregation</td></tr>
<tr><td>Replacing a legacy system without a big bang</td><td>Strangler fig + shadow traffic</td></tr>
<tr><td>Vendor/legacy model leaking into your domain</td><td>Anti-corruption layer</td></tr>
<tr><td>Read load and write load have different shapes</td><td>CQRS + materialized views</td></tr>
<tr><td>Business transaction spans services</td><td>Saga + compensating transactions</td></tr>
<tr><td>Must update DB and publish event atomically</td><td>Transactional outbox</td></tr>
<tr><td>Bursty async work</td><td>Queue-based load leveling + competing consumers</td></tr>
<tr><td>Huge payloads through a broker</td><td>Claim check</td></tr>
<tr><td>Large uploads/downloads through your API</td><td>Valet key (pre-signed URLs)</td></tr>
<tr><td>Exactly one instance must coordinate</td><td>Leader election + fencing</td></tr>
<tr><td>Slow reads of hot data</td><td>Cache-aside (or read/write-through)</td></tr>
<tr><td>Data or write throughput too big for one node</td><td>Sharding</td></tr>
<tr><td>Flaky/slow dependencies</td><td>Timeout + retry w/ jitter + circuit breaker + bulkhead</td></tr>
<tr><td>Overload / noisy neighbors</td><td>Throttling, load shedding, per-tenant quotas</td></tr>
</table>
<blockquote>💡 Real world: Microsoft's "Cloud Design Patterns" catalog (Azure Architecture Center) and AWS Prescriptive Guidance list ~40 of these with diagrams — vendor-neutral enough to be the shared vocabulary in most design reviews.</blockquote>`,
        he: `<table>
<tr><th>אם הבעיה שלכם היא…</th><th>מושיטים יד ל</th></tr>
<tr><td>אותו cross-cutting concern בכל service/שפה</td><td>Sidecar / service mesh</td></tr>
<tr><td>קישוריות יוצאת מורכבת (Redis עם shards, auth ל-DB)</td><td>Ambassador</td></tr>
<tr><td>כל סוג לקוח רוצה צורת נתונים אחרת</td><td>BFF / gateway aggregation</td></tr>
<tr><td>החלפת מערכת legacy בלי big bang</td><td>Strangler fig + shadow traffic</td></tr>
<tr><td>מודל של ספק/legacy דולף לדומיין שלכם</td><td>Anti-corruption layer</td></tr>
<tr><td>לעומס הקריאה ולעומס הכתיבה יש צורות שונות</td><td>CQRS + materialized views</td></tr>
<tr><td>טרנזקציה עסקית שחוצה services</td><td>Saga + compensating transactions</td></tr>
<tr><td>חייבים לעדכן DB ולפרסם event באופן אטומי</td><td>Transactional outbox</td></tr>
<tr><td>עבודה אסינכרונית עם קפיצות</td><td>Queue-based load leveling + competing consumers</td></tr>
<tr><td>payloads ענקיים דרך broker</td><td>Claim check</td></tr>
<tr><td>העלאות/הורדות גדולות דרך ה-API</td><td>Valet key (pre-signed URLs)</td></tr>
<tr><td>מופע אחד בדיוק חייב לתאם</td><td>Leader election + fencing</td></tr>
<tr><td>קריאות איטיות של נתונים חמים</td><td>Cache-aside (או read/write-through)</td></tr>
<tr><td>נתונים או throughput כתיבה גדולים מדי ל-node אחד</td><td>Sharding</td></tr>
<tr><td>תלויות לא יציבות/איטיות</td><td>Timeout + retry עם jitter + circuit breaker + bulkhead</td></tr>
<tr><td>עומס יתר / noisy neighbors</td><td>Throttling, load shedding, quotas לכל tenant</td></tr>
</table>
<blockquote>💡 מהשטח: הקטלוג "Cloud Design Patterns" של Microsoft (Azure Architecture Center) ו-AWS Prescriptive Guidance מפרטים ~40 כאלה עם דיאגרמות — ניטרליים מספיק כדי להיות אוצר המילים המשותף ברוב ה-design reviews.</blockquote>`
      }
    }
  ],
  diagram: `                 clients (web / mobile / partner)
                     |        |          |
                  [BFF-web] [BFF-mobile] [partner API]      <- BFF
                        \\       |        /
                     [ API gateway: TLS, auth, 429 ]        <- offloading + throttling
                        /        |         \\
   strangler:  /users->[users]  /orders->[orders]   / -> [legacy monolith]
                                   |  pod = app + envoy sidecar (retry, CB, mTLS)
                                   |
                      DB tx: orders + outbox  --Debezium-->  Kafka
                                                             |
                              competing consumers  [w1][w2][w3]  (idempotent)
                                                             |
                         materialized view / search index (CQRS read side)

  uploads: client --(pre-signed URL = valet key)--> S3 ; msg {blob: s3://...} = claim check`,
  handsOn: [
    { cmd: "aws s3 presign s3://my-bucket/report.pdf --expires-in 600", what: { en: "Valet key in one command: a URL that grants read access to exactly one object for 10 minutes.", he: "Valet key בפקודה אחת: URL שנותן גישת קריאה לאובייקט אחד בדיוק ל-10 דקות." } },
    { cmd: "kubectl get pod <pod> -o jsonpath='{.spec.containers[*].name}{\"\\n\"}{.spec.initContainers[*].name}'", what: { en: "Spot sidecars: list every container (and native-sidecar init containers) in a Pod — istio-proxy, vault-agent, fluent-bit…", he: "מזהים sidecars: מציגים את כל ה-containers (ו-init containers שהם native sidecars) ב-Pod — istio-proxy, vault-agent, fluent-bit…" } },
    { cmd: "curl -s -o /dev/null -w '%{http_code}\\n' localhost:8080/readyz; curl -s -o /dev/null -w '%{http_code}\\n' localhost:8080/livez", what: { en: "Health endpoint monitoring: check readiness (can serve) and liveness (process alive) separately — they must mean different things.", he: "Health endpoint monitoring: בודקים readiness (יכול לשרת) ו-liveness (התהליך חי) בנפרד — הם חייבים לסמן דברים שונים." } },
    { cmd: "for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' https://api.example.com/v1/ping; done; echo", what: { en: "Hit a rate-limited endpoint in a loop and watch 200s turn into 429s — throttling in action. Check the Retry-After header with -I.", he: "פונים בלולאה ל-endpoint עם rate limit ורואים 200 הופכים ל-429 — throttling בפעולה. בודקים את ה-header של Retry-After עם -I." } }
  ],
  mnemonic: {
    en: "Edge → Migrate → Data → Messaging → Survive: 'Sidecar & Gateway guard the door, Strangler & ACL replace the floor, CQRS-Saga-Outbox keep data true, Queues & Claim-checks carry the load through, Retry-Breaker-Bulkhead see you through.'",
    he: "קצה → מיגרציה → נתונים → הודעות → הישרדות: 'Sidecar ו-Gateway שומרים על הדלת, Strangler ו-ACL מחליפים את הרצפה, CQRS-Saga-Outbox שומרים על אמת, תורים ו-Claim-check סוחבים את העומס, Retry-Breaker-Bulkhead מעבירים את הסערה.'"
  },
  pitfalls: [
    { en: "Retrying non-idempotent operations (POST /charge) without an idempotency key — every retry is a double charge.", he: "לעשות retry לפעולות לא אידמפוטנטיות (POST /charge) בלי idempotency key — כל retry הוא חיוב כפול." },
    { en: "Readiness probes that check the shared database: a DB blip marks every pod unready simultaneously and turns a slowdown into a full outage.", he: "Readiness probes שבודקים את ה-DB המשותף: blip ב-DB מסמן את כל ה-pods כ-unready בבת אחת והופך האטה ל-outage מלא." },
    { en: "A strangler migration with no end date: the 'temporary' facade and dual systems live for 5 years and double operational cost. Set milestones and decommission.", he: "מיגרציית strangler בלי תאריך סיום: ה-facade ה'זמני' והמערכות הכפולות חיים 5 שנים ומכפילים את העלות התפעולית. קובעים אבני דרך ומפרקים." },
    { en: "Write-behind caching for data you can't afford to lose (payments, inventory) — a cache node crash silently drops acknowledged writes.", he: "Write-behind caching לנתונים שאסור לאבד (תשלומים, מלאי) — קריסה של node ב-cache מפילה בשקט כתיבות שכבר אושרו." }
  ],
  interview: [
    { q: { en: "You must migrate a 10-year-old monolith to services without downtime. Walk me through the patterns.", he: "צריך להעביר מונוליט בן 10 ל-services בלי downtime. תעביר אותי דרך ה-patterns." },
      a: { en: "Strangler fig: put a routing facade (gateway/nginx) in front first — no behavior change. Pick a capability with clear boundaries and low coupling; build the new service behind an anti-corruption layer so the legacy model doesn't leak. Sync data via CDC/outbox, run shadow traffic and compare responses, cut over per tenant with flags, keep rollback as a route change. Repeat, and decommission the monolith paths as they empty. Measure progress by % of traffic and code removed.", he: "Strangler fig: קודם שמים facade של ניתוב (gateway/nginx) מלפנים — בלי שינוי התנהגות. בוחרים יכולת עם גבולות ברורים ו-coupling נמוך; בונים את ה-service החדש מאחורי anti-corruption layer כדי שהמודל הישן לא ידלוף. מסנכרנים נתונים דרך CDC/outbox, מריצים shadow traffic ומשווים תשובות, עוברים לפי tenant עם flags, וה-rollback נשאר שינוי ניתוב. חוזרים על זה, ומפרקים את נתיבי המונוליט כשהם מתרוקנים. מודדים התקדמות לפי % תנועה וקוד שהוסר." } },
    { q: { en: "Sidecar vs library — when would you choose each for cross-cutting concerns?", he: "Sidecar מול ספרייה — מתי תבחר כל אחד ל-cross-cutting concerns?" },
      a: { en: "Library: lowest latency and resource cost, richest app context, but must be implemented and upgraded per language and per service (slow fleet-wide rollouts). Sidecar: language-agnostic, upgraded by the platform team independently, uniform policy (mTLS, retries, telemetry); costs per-pod CPU/RAM, an extra hop, and lifecycle complexity. Polyglot fleets with strong platform teams favor sidecars (or sidecarless eBPF/ambient meshes); a single-language shop with few services often does fine with a good shared library.", he: "ספרייה: latency ועלות משאבים הכי נמוכים, הכי הרבה הקשר מהאפליקציה, אבל צריך לממש ולשדרג לכל שפה ולכל service (rollouts איטיים לכל הצי). Sidecar: לא תלוי שפה, צוות הפלטפורמה משדרג בנפרד, מדיניות אחידה (mTLS, retries, telemetry); עולה CPU/RAM לכל pod, hop נוסף, ומורכבות מחזור חיים. צי רב-שפתי עם צוות פלטפורמה חזק מעדיף sidecars (או mesh בלי sidecar עם eBPF/ambient); חברה עם שפה אחת ומעט services מסתדרת לרוב עם ספרייה משותפת טובה." } },
    { q: { en: "How do retry, circuit breaker and bulkhead work together?", he: "איך retry, circuit breaker ו-bulkhead עובדים ביחד?" },
      a: { en: "Bulkhead limits blast radius: each dependency gets its own bounded pool, so a slow one can't starve the rest. Inside it, per-attempt timeouts bound each call; retry with exponential backoff + jitter handles transient errors, only for idempotent ops and within a retry budget; the circuit breaker watches the error rate and, when the dependency is clearly down, fails fast (optionally to a fallback) instead of retrying, then probes in half-open. Overall deadline on the outside caps total time.", he: "Bulkhead מגביל את רדיוס הפגיעה: לכל תלות pool חסום משלה, אז תלות איטית לא מרעיבה את השאר. בפנים, timeouts לכל ניסיון חוסמים כל קריאה; retry עם exponential backoff + jitter מטפל בשגיאות חולפות, רק לפעולות אידמפוטנטיות ובתוך retry budget; ה-circuit breaker עוקב אחרי שיעור השגיאות, וכשהתלות בבירור למטה הוא נכשל מהר (אולי ל-fallback) במקום לנסות שוב, ואז בודק ב-half-open. Deadline כולל מבחוץ חוסם את הזמן הכולל." } }
  ],
  quiz: [
    { q: { en: "Users upload 2 GB videos and your API servers are saturated on network. Best pattern?", he: "משתמשים מעלים סרטונים של 2 GB ושרתי ה-API רוויים ברשת. ה-pattern הכי מתאים?" },
      options: [ { en: "Bulkhead", he: "Bulkhead" }, { en: "Valet key (pre-signed URLs) so clients upload directly to storage", he: "Valet key (pre-signed URLs) כדי שלקוחות יעלו ישירות לאחסון" }, { en: "Strangler fig", he: "Strangler fig" }, { en: "Write-through cache", he: "Write-through cache" } ],
      answer: 1, explain: { en: "The API only issues a short-lived scoped token; the bytes go client → S3/Blob directly.", he: "ה-API רק מנפיק token קצר-חיים ומוגבל; הבייטים עוברים ישירות מהלקוח ל-S3/Blob." } },
    { q: { en: "A 30 MB document must be passed through SQS (256 KB limit). Pattern?", he: "מסמך של 30 MB צריך לעבור דרך SQS (מגבלה של 256 KB). איזה pattern?" },
      options: [ { en: "Claim check", he: "Claim check" }, { en: "Sharding", he: "Sharding" }, { en: "BFF", he: "BFF" }, { en: "Ambassador", he: "Ambassador" } ],
      answer: 0, explain: { en: "Store the payload in blob storage and send a small message with the reference.", he: "שומרים את ה-payload ב-blob storage ושולחים הודעה קטנה עם ההפניה." } },
    { q: { en: "Your new service must consume a legacy ERP API with cryptic field names without polluting your domain model. Pattern?", he: "ה-service החדש צריך לצרוך API של ERP ישן עם שמות שדות מוצפנים בלי לזהם את מודל הדומיין. איזה pattern?" },
      options: [ { en: "Sidecar", he: "Sidecar" }, { en: "Anti-corruption layer", he: "Anti-corruption layer" }, { en: "Competing consumers", he: "Competing consumers" }, { en: "Leader election", he: "Leader election" } ],
      answer: 1, explain: { en: "An ACL translates the foreign model to your domain model at the boundary.", he: "ACL מתרגם את המודל הזר למודל הדומיין שלכם בגבול." } },
    { q: { en: "Which cache pattern risks losing acknowledged writes if the cache node crashes?", he: "איזה pattern של cache מסתכן באובדן כתיבות שאושרו אם ה-node של ה-cache קורס?" },
      options: [ { en: "Cache-aside", he: "Cache-aside" }, { en: "Read-through", he: "Read-through" }, { en: "Write-through", he: "Write-through" }, { en: "Write-behind", he: "Write-behind" } ],
      answer: 3, explain: { en: "Write-behind acknowledges after writing the cache and flushes to the DB later — a crash before flush loses data.", he: "Write-behind מאשר אחרי כתיבה ל-cache ועושה flush ל-DB מאוחר יותר — קריסה לפני ה-flush מאבדת נתונים." } }
  ],
  related: ["arch-event-driven", "arch-resilience", "arch-caching", "pr-design-patterns", "pr-idempotency", "pr-rate-limiters", "staff-service-mesh", "staff-migrations-at-scale"]
});

INFRA.glossary.push(
  { term: "SOLID", track: "principal", def: { en: "Five OO design principles: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion.", he: "חמישה עקרונות תכנון OO: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion." }, lesson: "pr-solid" },
  { term: "Dependency Inversion", track: "principal", def: { en: "High-level policy defines abstractions (ports) that low-level details implement, so dependencies point toward the domain.", he: "המדיניות ברמה הגבוהה מגדירה אבסטרקציות (ports) שהפרטים ברמה הנמוכה מממשים, כך שהתלויות מצביעות לכיוון הדומיין." }, lesson: "pr-solid" },
  { term: "Decorator pattern", track: "principal", def: { en: "Wrap an object to add behavior (retries, metrics, caching) while keeping the same interface.", he: "עוטפים אובייקט כדי להוסיף התנהגות (retries, metrics, caching) תוך שמירה על אותו interface." }, lesson: "pr-design-patterns" },
  { term: "Chain of Responsibility", track: "principal", def: { en: "A request passes through a chain of handlers, each of which handles it or forwards it — e.g. HTTP middleware.", he: "בקשה עוברת בשרשרת handlers, שכל אחד מטפל בה או מעביר הלאה — למשל HTTP middleware." }, lesson: "pr-design-patterns" },
  { term: "Double-checked locking", track: "principal", def: { en: "Lazy singleton init that locks only when the instance is null; in Java it requires volatile to be correct.", he: "אתחול singleton עצל שנועל רק כשהמופע null; ב-Java דורש volatile כדי להיות נכון." }, lesson: "pr-singletons" },
  { term: "Captive dependency", track: "principal", def: { en: "A longer-lived service (singleton) holding a shorter-lived one (scoped), keeping it alive and shared incorrectly.", he: "Service עם חיים ארוכים (singleton) שמחזיק service קצר-חיים (scoped), ומשאיר אותו חי ומשותף באופן שגוי." }, lesson: "pr-singletons" },
  { term: "Fencing token", track: "principal", def: { en: "Monotonic number issued with each lock/lease; storage rejects writes with an older token, blocking stale leaders.", he: "מספר מונוטוני שמונפק עם כל lock/lease; האחסון דוחה כתיבות עם token ישן יותר וחוסם leaders מעופשים." }, lesson: "pr-singletons" },
  { term: "Strangler fig", track: "principal", def: { en: "Incrementally replace a legacy system by routing one capability at a time to new code behind a facade.", he: "מחליפים מערכת legacy בהדרגה ע\"י ניתוב יכולת אחת בכל פעם לקוד חדש מאחורי facade." }, lesson: "pr-cloud-patterns" },
  { term: "Anti-corruption layer", track: "principal", def: { en: "A translation layer at the boundary with a legacy/vendor system so its model doesn't leak into your domain.", he: "שכבת תרגום בגבול מול מערכת legacy/ספק כדי שהמודל שלה לא ידלוף לדומיין שלכם." }, lesson: "pr-cloud-patterns" },
  { term: "Valet key", track: "principal", def: { en: "A short-lived, narrowly scoped token (pre-signed URL, SAS) letting clients access storage directly.", he: "Token קצר-חיים ומוגבל (pre-signed URL, SAS) שמאפשר ללקוחות לגשת לאחסון ישירות." }, lesson: "pr-cloud-patterns" }
);
