window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// =====================================================================
// Track: architecture
// =====================================================================

INFRA.lessons.push({
  id: "arch-monolith-vs-microservices",
  track: "architecture",
  order: 1,
  icon: "🧱",
  level: 1,
  minutes: 10,
  title: { en: "Monolith vs Microservices", he: "Monolith מול Microservices" },
  tldr: {
    en: "Microservices trade code complexity for operational complexity — buy them only when team scale, not hype, forces you to.",
    he: "Microservices מחליפים סיבוכיות בקוד בסיבוכיות תפעולית — קונים אותם רק כשגודל הצוותים מכריח, לא כשההייפ קורא."
  },
  analogy: {
    en: "A monolith is a big family kitchen: one fridge, one stove, everyone bumps elbows but passing the salt takes a second. Microservices are a food court: each stall has its own fridge, staff and opening hours — great when 40 cooks would otherwise trip over each other, absurd if you're three people making a sandwich. And a 'distributed monolith' is a food court where every stall must open and close at the same time and shares one fridge down the hall.",
    he: "Monolith זה מטבח משפחתי גדול: מקרר אחד, כיריים אחד, כולם נתקעים אחד בשני — אבל להעביר את המלח לוקח שנייה. Microservices זה מתחם מזון בקניון: לכל דוכן מקרר, צוות ושעות פתיחה משלו — מעולה כשיש 40 טבחים שאחרת היו דורכים אחד על השני, מגוחך אם אתם שלושה אנשים שמכינים סנדוויץ'. ו-'distributed monolith'? זה מתחם מזון שבו כל הדוכנים חייבים לפתוח ולסגור ביחד וחולקים מקרר אחד בסוף המסדרון."
  },
  sections: [
    {
      h: { en: "What you actually trade", he: "על מה באמת משלמים" },
      body: {
        en: `<p>A <strong>monolith</strong> is one deployable unit: one process, one repo (usually), one database. Calls between modules are function calls — nanoseconds, type-checked, transactional. <strong>Microservices</strong> split the system into independently deployable services, each owning its data, talking over the network.</p>
<ul>
<li><strong>You gain:</strong> independent deploys per team, independent scaling (scale the image-resizer, not the whole app), fault isolation, tech freedom per service.</li>
<li><strong>You pay:</strong> network calls (~0.5–5 ms instead of ~50 ns), partial failures, no cross-service ACID transactions, distributed tracing, versioned APIs, N CI pipelines, N dashboards, N on-call runbooks.</li>
</ul>
<p>The honest summary: microservices don't remove complexity, they <em>move</em> it from the code into the network and the org chart.</p>
<blockquote>💡 Real world: Amazon Prime Video's monitoring team famously moved a distributed (serverless/Step Functions) pipeline back into a single process in 2023 and cut cost by ~90%. Shopify runs one of the largest Rails monoliths on earth — modularized, not split.</blockquote>`,
        he: `<p><strong>Monolith</strong> הוא יחידת deploy אחת: process אחד, repo אחד (בדרך כלל), database אחד. קריאה בין מודולים היא קריאה לפונקציה — ננו-שניות, עם type checking ועם טרנזקציה. <strong>Microservices</strong> מפרקים את המערכת לשירותים שעושים deploy בנפרד, כל אחד מחזיק את הדאטה שלו, ומדברים ברשת.</p>
<ul>
<li><strong>מה מרוויחים:</strong> deploy עצמאי לכל צוות, scaling עצמאי (מגדילים רק את ה-image-resizer ולא את כל האפליקציה), בידוד תקלות, חופש טכנולוגי לכל service.</li>
<li><strong>מה משלמים:</strong> קריאות רשת (~0.5–5 ms במקום ~50 ns), partial failures, אין טרנזקציות ACID בין שירותים, צריך distributed tracing, APIs עם גרסאות, N pipelines של CI, N דשבורדים, N runbooks ל-on-call.</li>
</ul>
<p>השורה התחתונה: microservices לא מעלימים סיבוכיות, הם <em>מזיזים</em> אותה מהקוד אל הרשת ואל המבנה הארגוני.</p>
<blockquote>💡 מהשטח: הצוות של Prime Video באמזון החזיר ב-2023 pipeline מבוזר (serverless/Step Functions) לתוך process אחד וחתך ~90% מהעלות. Shopify מריצים את אחד ה-monoliths הכי גדולים בעולם ב-Rails — מחולק למודולים, לא מפורק לשירותים.</blockquote>`
      }
    },
    {
      h: { en: "The modular monolith: the sweet spot", he: "Modular monolith: נקודת האיזון" },
      body: {
        en: `<p>A <strong>modular monolith</strong> is one deployable, but internally split into modules with hard boundaries: each module owns its tables, exposes a public interface, and other modules may not reach into its internals. You get 80% of the design benefits of microservices with none of the network tax.</p>
<pre>src/
  billing/   api.ts   (public)   internal/ ...   tables: invoices, payments
  catalog/   api.ts   (public)   internal/ ...   tables: products, prices
  orders/    api.ts   (public)   internal/ ...   tables: orders, order_items
# rule: orders may import billing/api.ts, never billing/internal/*</pre>
<p>Enforce boundaries with tooling, not good intentions: ArchUnit (Java), Packwerk (Ruby), dependency-cruiser or Nx module boundaries (TS), import-linter (Python). When a module genuinely needs independent scaling or a separate team, you extract it — and because the seam already exists, extraction is a weekend, not a quarter.</p>
<blockquote>⚠️ Production tip: "No foreign keys across module boundaries" is the rule that makes later extraction possible. Shared tables are the glue that turns microservices into a distributed monolith.</blockquote>`,
        he: `<p><strong>Modular monolith</strong> זה deployable אחד, אבל מבפנים הוא מחולק למודולים עם גבולות קשיחים: כל מודול מחזיק את הטבלאות שלו, חושף interface ציבורי, ואסור למודולים אחרים להיכנס לו לקרביים. מקבלים 80% מהיתרונות העיצוביים של microservices בלי מס הרשת.</p>
<pre>src/
  billing/   api.ts   (public)   internal/ ...   tables: invoices, payments
  catalog/   api.ts   (public)   internal/ ...   tables: products, prices
  orders/    api.ts   (public)   internal/ ...   tables: orders, order_items
# rule: orders may import billing/api.ts, never billing/internal/*</pre>
<p>אוכפים את הגבולות עם כלים, לא עם כוונות טובות: ArchUnit (Java), Packwerk (Ruby), dependency-cruiser או module boundaries של Nx (TS), import-linter (Python). כשמודול באמת צריך scaling עצמאי או צוות נפרד — מוציאים אותו החוצה. ובגלל שהתפר כבר קיים, זה עניין של סופ"ש ולא של רבעון.</p>
<blockquote>⚠️ טיפ לפרודקשן: "אין foreign keys בין מודולים" — זה הכלל שמאפשר לחלץ אחר כך. טבלאות משותפות הן הדבק שהופך microservices ל-distributed monolith.</blockquote>`
      }
    },
    {
      h: { en: "Conway's law: architecture follows the org chart", he: "החוק של Conway: הארכיטקטורה הולכת אחרי המבנה הארגוני" },
      body: {
        en: `<p><strong>Conway's law</strong> (1968): <em>"Organizations design systems that mirror their own communication structure."</em> Four teams building a compiler get a four-pass compiler. This is the real reason microservices exist: they are an <strong>organizational scaling tool</strong>. When 80 engineers share one deploy pipeline, the merge queue becomes the bottleneck, every release is a negotiation, and one team's bug blocks everyone's Friday.</p>
<p>The <strong>Inverse Conway Maneuver</strong>: design your team structure to match the architecture you want. Want an independent payments service? Create a payments team that owns it end-to-end — code, DB, on-call.</p>
<p>Rule of thumb: one service per team (or a handful), not ten services per developer. A 6-person startup with 25 microservices has a ratio problem, not an architecture.</p>
<blockquote>💡 Real world: Team Topologies' "stream-aligned team" is Conway applied on purpose — each team owns a business capability and the services behind it, minimizing cross-team handoffs.</blockquote>`,
        he: `<p><strong>החוק של Conway</strong> (1968): <em>"ארגונים מתכננים מערכות שמשקפות את מבנה התקשורת שלהם."</em> ארבעה צוותים שבונים קומפיילר יקבלו קומפיילר עם ארבעה שלבים. וזאת הסיבה האמיתית ש-microservices קיימים: הם <strong>כלי לסקיילינג ארגוני</strong>. כש-80 מפתחים חולקים pipeline אחד ל-deploy, ה-merge queue הופך לצוואר בקבוק, כל release הוא משא ומתן, ובאג של צוות אחד תוקע לכולם את יום שישי.</p>
<p><strong>Inverse Conway Maneuver</strong>: מעצבים את מבנה הצוותים כך שיתאים לארכיטקטורה שרוצים. רוצים payments service עצמאי? מקימים צוות payments שמחזיק אותו מקצה לקצה — קוד, DB, on-call.</p>
<p>כלל אצבע: service אחד לצוות (או קומץ), לא עשרה services למפתח. סטארטאפ של 6 אנשים עם 25 microservices — זו בעיית יחס, לא ארכיטקטורה.</p>
<blockquote>💡 מהשטח: ה-"stream-aligned team" של Team Topologies זה Conway בכוונה תחילה — כל צוות מחזיק יכולת עסקית ואת השירותים שמאחוריה, ומצמצם handoffs בין צוותים.</blockquote>`
      }
    },
    {
      h: { en: "When NOT to do microservices + the distributed monolith smell", he: "מתי לא ללכת על microservices + הריח של distributed monolith" },
      body: {
        en: `<p>Skip microservices when: the team is under ~15–20 engineers; the domain is still being discovered (boundaries will move, and moving a boundary between services is 10x harder than between modules); you lack CI/CD, centralized logging, tracing and on-call maturity; or you need strong consistency across most operations.</p>
<p><strong>Distributed monolith</strong> — all the costs of microservices, none of the benefits. Smells:</p>
<ul>
<li>You can't deploy service A without deploying B and C "in the right order".</li>
<li>Several services read/write the <strong>same database tables</strong>.</li>
<li>One user request fans out into a synchronous chain of 6+ services.</li>
<li>A shared "common" library bump forces every service to redeploy.</li>
<li>Integration tests require spinning up the whole fleet.</li>
</ul>
<blockquote>⚠️ Production tip: Start monolith-first (Martin Fowler's "MonolithFirst"), modularize hard, extract services along seams that are proven stable and that have a clear owner and a real scaling or deploy-cadence reason.</blockquote>`,
        he: `<p>לא ללכת על microservices כש: הצוות קטן מ-~15–20 מפתחים; הדומיין עדיין לא מגובש (הגבולות יזוזו, ולהזיז גבול בין services זה פי 10 יותר קשה מבין מודולים); אין לכם CI/CD, לוגים מרוכזים, tracing ובשלות של on-call; או שרוב הפעולות דורשות strong consistency.</p>
<p><strong>Distributed monolith</strong> — כל העלויות של microservices, אפס מהיתרונות. סימנים מחשידים:</p>
<ul>
<li>אי אפשר לעשות deploy ל-service A בלי B ו-C "בסדר הנכון".</li>
<li>כמה services קוראים וכותבים <strong>לאותן טבלאות</strong>.</li>
<li>בקשה אחת של משתמש מתפרקת לשרשרת סינכרונית של 6+ services.</li>
<li>עדכון ל-library "common" משותפת מכריח deploy לכל השירותים.</li>
<li>טסטי אינטגרציה דורשים להרים את כל הצי.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מתחילים monolith-first (ה-"MonolithFirst" של Martin Fowler), מחלקים למודולים בנוקשות, ומוציאים services רק לאורך תפרים שהוכחו כיציבים, שיש להם בעלים ברור וסיבה אמיתית של scaling או קצב deploy.</blockquote>`
      }
    }
  ],
  diagram:
`  MONOLITH                      MICROSERVICES
 +-----------------+           +-------+   +--------+   +---------+
 | orders          |           |orders |-->|billing |   |catalog  |
 | billing  (calls)|           +---+---+   +---+----+   +----+----+
 | catalog  ~50ns  |               |  HTTP/gRPC ~1-5ms      |
 +--------+--------+           +---v---+   +---v----+   +----v----+
          |                    | DB-o  |   | DB-b   |   | DB-c    |
      +---v---+                +-------+   +--------+   +---------+
      |  DB   |
      +-------+        DISTRIBUTED MONOLITH = the right side,
                       but all three services share ONE DB  :(`,
  handsOn: [
    { cmd: "npx dependency-cruiser --validate .dependency-cruiser.js src", what: { en: "Enforce module boundaries in a TS/JS modular monolith — fail CI when orders/ imports billing/internal.", he: "אוכפים גבולות מודולים ב-modular monolith של TS/JS — CI נכשל כש-orders/ מייבא מ-billing/internal." } },
    { cmd: "git log --since=3.months --name-only --format='' | cut -d/ -f1-2 | sort | uniq -c | sort -rn | head", what: { en: "Find which directories change most often — modules that always change together are bad candidates to split apart.", he: "מוצאים אילו תיקיות משתנות הכי הרבה — מודולים שמשתנים תמיד ביחד הם מועמדים גרועים לפיצול." } },
    { cmd: "psql -c \"SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;\"", what: { en: "See which services (DB users) hit the same database — multiple service users on one schema smells like a distributed monolith.", he: "רואים אילו services (משתמשי DB) מתחברים לאותו database — כמה services על אותה schema מריח כמו distributed monolith." } }
  ],
  mnemonic: {
    en: "\"Split teams, then split code\" — Conway first, Kubernetes later. And remember MONO: Modules, Ownership, No shared tables, Only then extract.",
    he: "\"קודם מפצלים צוותים, אחר כך קוד\" — Conway קודם, Kubernetes אחר כך. וזכרו MONO: Modules, Ownership, No shared tables, Only then extract."
  },
  pitfalls: [
    { en: "Splitting by technical layer (a 'database service', a 'validation service') instead of by business capability — every feature now touches every service.", he: "פיצול לפי שכבה טכנית ('database service', 'validation service') במקום לפי יכולת עסקית — עכשיו כל פיצ'ר נוגע בכל השירותים." },
    { en: "Sharing a database between services 'temporarily'. Temporary schemas are forever, and now no one can change a column.", he: "לחלוק database בין services 'זמנית'. schemas זמניות הן לנצח, ועכשיו אף אחד לא יכול לשנות עמודה." },
    { en: "Going microservices before having observability: without tracing and correlation IDs, debugging a cross-service bug is archaeology.", he: "ללכת על microservices לפני שיש observability: בלי tracing ו-correlation IDs, דיבאג של באג חוצה-שירותים הוא ארכיאולוגיה." },
    { en: "Nano-services: one service per function. You pay network latency and ops overhead for code that should be a method.", he: "Nano-services: service לכל פונקציה. משלמים latency רשת ותקורת תפעול על קוד שהיה צריך להיות method." }
  ],
  interview: [
    {
      q: { en: "Your 8-person startup wants to rewrite its monolith into microservices. What do you advise?", he: "סטארטאפ של 8 אנשים רוצה לשכתב את ה-monolith ל-microservices. מה תמליץ?" },
      a: { en: "Usually don't. Identify the actual pain (slow deploys? one hot component? test suite?) and fix it directly. Modularize the monolith with enforced boundaries and per-module tables. Extract a service only for a concrete reason — independent scaling, a separate team, a different runtime — and invest in CI/CD and tracing first.", he: "בדרך כלל לא. מזהים מה הכאב האמיתי (deploy איטי? רכיב אחד חם? test suite?) ומטפלים בו ישירות. מחלקים את ה-monolith למודולים עם גבולות אכופים וטבלאות לכל מודול. מוציאים service רק מסיבה קונקרטית — scaling עצמאי, צוות נפרד, runtime שונה — ומשקיעים קודם ב-CI/CD וב-tracing." }
    },
    {
      q: { en: "What is a distributed monolith and how do you detect one?", he: "מה זה distributed monolith ואיך מזהים אחד?" },
      a: { en: "Services that are deployed separately but are tightly coupled: lockstep deploys, shared DB tables, long synchronous call chains, shared libraries forcing coordinated releases. Detect it via deploy logs (services always released together), DB access audits, and trace waterfalls showing deep sync chains.", he: "שירותים שעושים deploy בנפרד אבל צמודים זה לזה: deploys בצעד אחיד, טבלאות DB משותפות, שרשראות קריאה סינכרוניות ארוכות, libraries משותפות שמכריחות releases מתואמים. מזהים דרך לוגים של deploys (שירותים שתמיד יוצאים ביחד), ביקורת גישה ל-DB, ו-trace waterfalls שמראים שרשראות סינכרוניות עמוקות." }
    }
  ],
  quiz: [
    {
      q: { en: "According to Conway's law, the main driver for adopting microservices should be:", he: "לפי החוק של Conway, המניע העיקרי לאמץ microservices צריך להיות:" },
      options: [
        { en: "Better raw performance, since services run in parallel", he: "ביצועים טובים יותר, כי השירותים רצים במקביל" },
        { en: "Letting many teams develop and deploy independently", he: "לאפשר לצוותים רבים לפתח ולעשות deploy באופן עצמאי" },
        { en: "Making it possible to use Kubernetes", he: "לאפשר שימוש ב-Kubernetes" },
        { en: "Reducing the total amount of code", he: "להקטין את כמות הקוד הכוללת" }
      ],
      answer: 1,
      explain: { en: "Microservices are an organizational scaling tool. Performance usually gets worse (network hops), and total code grows.", he: "Microservices הם כלי לסקיילינג ארגוני. ביצועים בדרך כלל דווקא נפגעים (hops ברשת), וכמות הקוד גדלה." }
    },
    {
      q: { en: "Which is the strongest sign of a distributed monolith?", he: "מה הסימן הכי חזק ל-distributed monolith?" },
      options: [
        { en: "Services are written in different languages", he: "השירותים כתובים בשפות שונות" },
        { en: "Each service has its own CI pipeline", he: "לכל service יש CI pipeline משלו" },
        { en: "Three services must be deployed together in a specific order", he: "שלושה services חייבים לעלות ביחד בסדר מסוים" },
        { en: "Services communicate through a message broker", he: "השירותים מתקשרים דרך message broker" }
      ],
      answer: 2,
      explain: { en: "Lockstep deploys mean the services aren't independent — you have the coupling of a monolith plus the network.", he: "deploys בצעד אחיד אומרים שהשירותים לא עצמאיים — יש לכם את הצימוד של monolith פלוס הרשת." }
    },
    {
      q: { en: "What makes a modular monolith easy to split later?", he: "מה הופך modular monolith לקל לפיצול בהמשך?" },
      options: [
        { en: "Each module owns its own tables and exposes only a public interface", he: "כל מודול מחזיק את הטבלאות שלו וחושף רק interface ציבורי" },
        { en: "All modules share one ORM model for consistency", he: "כל המודולים חולקים מודל ORM אחד לשם עקביות" },
        { en: "Modules call each other via HTTP on localhost", he: "המודולים קוראים זה לזה ב-HTTP על localhost" },
        { en: "Using a single global transaction for every request", he: "שימוש בטרנזקציה גלובלית אחת לכל בקשה" }
      ],
      answer: 0,
      explain: { en: "Data ownership + narrow interfaces create the seam. Shared ORM models and cross-module transactions are exactly what makes extraction painful.", he: "בעלות על הדאטה + interfaces צרים יוצרים את התפר. מודל ORM משותף וטרנזקציות חוצות-מודולים הם בדיוק מה שהופך חילוץ לכואב." }
    }
  ],
  related: ["arch-api-gateway", "arch-sync-vs-async", "arch-event-driven"]
});

INFRA.lessons.push({
  id: "arch-api-gateway",
  track: "architecture",
  order: 2,
  icon: "🚪",
  level: 2,
  minutes: 11,
  title: { en: "API Gateway, BFF & Service Mesh", he: "API Gateway, BFF ו-Service Mesh" },
  tldr: {
    en: "The gateway guards the front door (north-south traffic); the service mesh polices the hallways between services (east-west traffic).",
    he: "ה-Gateway שומר על הדלת הראשית (תעבורת north-south); ה-service mesh שוטר במסדרונות בין השירותים (תעבורת east-west)."
  },
  analogy: {
    en: "An API gateway is the hotel reception: it checks your ID, tells you which room to go to, and refuses you if you've asked for 500 towels this minute. A BFF is a personal concierge per guest type — one for families, one for business travelers. The service mesh is the hotel's internal phone system with a security guard on every floor: staff calls between rooms are encrypted, retried if the line drops, and logged.",
    he: "API gateway זה דלפק הקבלה במלון: בודק תעודה, אומר לך לאיזה חדר ללכת, ומסרב אם ביקשת 500 מגבות בדקה האחרונה. BFF זה קונסיירז' אישי לכל סוג אורח — אחד למשפחות, אחד לאנשי עסקים. ה-service mesh זה מערכת הטלפונים הפנימית של המלון עם מאבטח בכל קומה: שיחות בין חדרים מוצפנות, מנסים שוב אם הקו נפל, והכול מתועד."
  },
  sections: [
    {
      h: { en: "What a gateway does", he: "מה gateway עושה" },
      body: {
        en: `<p>An <strong>API gateway</strong> is a reverse proxy at the edge that gives clients one entry point and handles cross-cutting concerns so every service doesn't reimplement them:</p>
<ul>
<li><strong>Routing</strong>: <code>/api/orders/*</code> → orders-svc, <code>/api/users/*</code> → users-svc; versioning (<code>/v1</code>, <code>/v2</code>).</li>
<li><strong>Auth</strong>: validate JWT/OAuth2 tokens or API keys once, pass identity downstream as headers.</li>
<li><strong>Rate limiting &amp; quotas</strong>: e.g. 100 req/s per API key, 429 when exceeded.</li>
<li><strong>Aggregation</strong>: one client call fans out to 3 services and merges the result.</li>
<li>TLS termination, CORS, request/response transformation, caching, WAF, logging.</li>
</ul>
<p>Tools: Kong, AWS API Gateway, Azure API Management, Apigee, Envoy Gateway, Traefik, NGINX, Kubernetes Gateway API.</p>
<pre># Kong declarative config
services:
- name: orders
  url: http://orders.svc.cluster.local:8080
  routes: [{ paths: ["/api/orders"] }]
  plugins:
  - name: jwt
  - name: rate-limiting
    config: { second: 100, policy: redis }</pre>
<blockquote>⚠️ Production tip: Keep business logic OUT of the gateway. Once it starts knowing about discount rules, it's a bottleneck monolith every team must change.</blockquote>`,
        he: `<p><strong>API gateway</strong> הוא reverse proxy בקצה המערכת שנותן ללקוחות נקודת כניסה אחת ומטפל ב-cross-cutting concerns, כדי שכל service לא יממש אותם מחדש:</p>
<ul>
<li><strong>Routing</strong>: <code>/api/orders/*</code> → orders-svc, <code>/api/users/*</code> → users-svc; ניהול גרסאות (<code>/v1</code>, <code>/v2</code>).</li>
<li><strong>Auth</strong>: מאמתים JWT/OAuth2 או API keys פעם אחת, ומעבירים את הזהות הלאה ב-headers.</li>
<li><strong>Rate limiting ו-quotas</strong>: למשל 100 req/s לכל API key, ו-429 כשחורגים.</li>
<li><strong>Aggregation</strong>: קריאה אחת של הלקוח מתפצלת ל-3 services והתוצאה מאוחדת.</li>
<li>TLS termination, CORS, טרנספורמציה של request/response, caching, WAF, לוגים.</li>
</ul>
<p>כלים: Kong, AWS API Gateway, Azure API Management, Apigee, Envoy Gateway, Traefik, NGINX, Kubernetes Gateway API.</p>
<pre># Kong declarative config
services:
- name: orders
  url: http://orders.svc.cluster.local:8080
  routes: [{ paths: ["/api/orders"] }]
  plugins:
  - name: jwt
  - name: rate-limiting
    config: { second: 100, policy: redis }</pre>
<blockquote>⚠️ טיפ לפרודקשן: לוגיקה עסקית לא נכנסת ל-gateway. ברגע שהוא מתחיל לדעת על חוקי הנחות — הוא הופך ל-monolith צוואר בקבוק שכל צוות צריך לשנות.</blockquote>`
      }
    },
    {
      h: { en: "BFF: Backend for Frontend", he: "BFF: Backend for Frontend" },
      body: {
        en: `<p>One generic API for web, iOS, Android and partners ends up serving nobody well: mobile wants small payloads and fewer round-trips over 4G; the web dashboard wants rich data; partners want stable, versioned contracts. The <strong>BFF pattern</strong> gives each client type its own thin backend, owned by the team that owns that frontend.</p>
<p>The mobile BFF calls orders, users and recommendations in parallel and returns one compact JSON tailored to the home screen — one round-trip instead of three over a 150 ms mobile RTT saves ~300 ms of perceived latency. GraphQL servers are often used as BFFs because the client chooses the shape.</p>
<blockquote>💡 Real world: SoundCloud popularized BFF; Netflix ran per-device adapter layers for years. A common layout is: edge gateway (auth, rate limit, TLS) → BFF per client (aggregation, shaping) → domain services.</blockquote>
<p>Warning sign: if your BFFs start duplicating business rules, push that logic down into a domain service.</p>`,
        he: `<p>API גנרי אחד ל-web, iOS, Android ולשותפים בסוף לא משרת אף אחד טוב: המובייל רוצה payloads קטנים ופחות round-trips על 4G; הדשבורד ב-web רוצה דאטה עשיר; שותפים רוצים חוזים יציבים עם גרסאות. <strong>תבנית BFF</strong> נותנת לכל סוג לקוח backend דק משלו, שבבעלות הצוות שמחזיק את ה-frontend הזה.</p>
<p>ה-BFF של המובייל קורא ל-orders, users ו-recommendations במקביל ומחזיר JSON קומפקטי אחד שתפור למסך הבית — round-trip אחד במקום שלושה על RTT של 150 ms במובייל חוסך ~300 ms של latency מורגש. הרבה פעמים משתמשים ב-GraphQL server כ-BFF, כי הלקוח בוחר את הצורה.</p>
<blockquote>💡 מהשטח: SoundCloud הפכו את BFF לפופולרי; Netflix הריצו שכבות adapter לכל סוג מכשיר במשך שנים. מבנה נפוץ: edge gateway (auth, rate limit, TLS) → BFF לכל לקוח (aggregation, עיצוב התשובה) → domain services.</blockquote>
<p>סימן אזהרה: אם ה-BFFs מתחילים לשכפל חוקים עסקיים, תורידו את הלוגיקה הזו ל-domain service.</p>`
      }
    },
    {
      h: { en: "Service mesh: sidecars, mTLS, retries, traffic split", he: "Service mesh: sidecars, mTLS, retries, traffic split" },
      body: {
        en: `<p>A <strong>service mesh</strong> (Istio, Linkerd, Consul Connect, Cilium) handles service-to-service (east-west) traffic. Classically, it injects a <strong>sidecar proxy</strong> (Envoy for Istio, linkerd2-proxy for Linkerd) next to every pod; all traffic flows through it. The <em>control plane</em> configures; the <em>data plane</em> (proxies) does the work. Newer modes (Istio ambient, Cilium) drop the per-pod sidecar for per-node proxies.</p>
<ul>
<li><strong>mTLS</strong> everywhere with automatic cert rotation — zero app code.</li>
<li><strong>Retries, timeouts, circuit breaking</strong> configured as policy.</li>
<li><strong>Traffic splitting</strong> for canaries: 95% v1 / 5% v2.</li>
<li>Uniform golden-signal metrics and trace spans for every hop.</li>
</ul>
<pre>apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: reviews }
spec:
  hosts: [reviews]
  http:
  - route:
    - { destination: { host: reviews, subset: v1 }, weight: 95 }
    - { destination: { host: reviews, subset: v2 }, weight: 5 }
    retries: { attempts: 2, perTryTimeout: 300ms, retryOn: "5xx,reset" }
    timeout: 1s</pre>
<blockquote>⚠️ Production tip: A mesh costs ~1–3 ms p99 per hop and real memory per sidecar. With 5 services you probably don't need one; with 150 and a compliance requirement for mTLS, you probably do.</blockquote>`,
        he: `<p><strong>Service mesh</strong> (Istio, Linkerd, Consul Connect, Cilium) מטפל בתעבורה בין שירותים (east-west). בגרסה הקלאסית הוא מזריק <strong>sidecar proxy</strong> (Envoy ב-Istio, linkerd2-proxy ב-Linkerd) ליד כל pod, וכל התעבורה עוברת דרכו. ה-<em>control plane</em> מגדיר; ה-<em>data plane</em> (ה-proxies) עושה את העבודה. מצבים חדשים יותר (Istio ambient, Cilium) מוותרים על sidecar לכל pod לטובת proxy לכל node.</p>
<ul>
<li><strong>mTLS</strong> בכל מקום עם רוטציה אוטומטית של תעודות — אפס קוד באפליקציה.</li>
<li><strong>Retries, timeouts, circuit breaking</strong> מוגדרים כ-policy.</li>
<li><strong>Traffic splitting</strong> ל-canary: 95% ל-v1 / 5% ל-v2.</li>
<li>מטריקות golden signals ו-trace spans אחידים לכל hop.</li>
</ul>
<pre>apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: reviews }
spec:
  hosts: [reviews]
  http:
  - route:
    - { destination: { host: reviews, subset: v1 }, weight: 95 }
    - { destination: { host: reviews, subset: v2 }, weight: 5 }
    retries: { attempts: 2, perTryTimeout: 300ms, retryOn: "5xx,reset" }
    timeout: 1s</pre>
<blockquote>⚠️ טיפ לפרודקשן: mesh עולה ~1–3 ms ב-p99 לכל hop וזיכרון אמיתי לכל sidecar. עם 5 services כנראה לא צריך; עם 150 ודרישת compliance ל-mTLS — כנראה שכן.</blockquote>`
      }
    },
    {
      h: { en: "Service discovery", he: "Service discovery" },
      body: {
        en: `<p>In a dynamic world, pods come and go with new IPs every few minutes. <strong>Service discovery</strong> answers "where is orders-svc right now?"</p>
<ul>
<li><strong>DNS-based</strong> (Kubernetes): <code>orders.prod.svc.cluster.local</code> resolves to a stable ClusterIP; kube-proxy/eBPF load-balances to healthy pod IPs from the EndpointSlices.</li>
<li><strong>Registry-based</strong>: services register in Consul, Eureka or etcd with health checks; clients or proxies query it.</li>
<li><strong>Client-side vs server-side</strong>: the client picks an instance (gRPC with xDS, Netflix Ribbon) vs a load balancer picks for it (K8s Service, AWS ALB).</li>
</ul>
<blockquote>💡 Real world: gRPC uses long-lived HTTP/2 connections, so a plain K8s ClusterIP balances <em>connections</em>, not requests — one pod can get all the traffic. Fix: a mesh, a headless Service with client-side balancing, or an L7 proxy.</blockquote>
<p>Health checks matter as much as the registry: an instance that's registered but unhealthy is worse than one that's missing.</p>`,
        he: `<p>בעולם דינמי, pods עולים ויורדים עם IPs חדשים כל כמה דקות. <strong>Service discovery</strong> עונה על השאלה "איפה orders-svc נמצא עכשיו?"</p>
<ul>
<li><strong>מבוסס DNS</strong> (Kubernetes): <code>orders.prod.svc.cluster.local</code> מתורגם ל-ClusterIP יציב; kube-proxy/eBPF מאזנים ל-IPs של pods בריאים מתוך ה-EndpointSlices.</li>
<li><strong>מבוסס registry</strong>: שירותים נרשמים ב-Consul, Eureka או etcd עם health checks; לקוחות או proxies שואלים אותו.</li>
<li><strong>Client-side מול server-side</strong>: הלקוח בוחר instance (gRPC עם xDS, Netflix Ribbon) מול load balancer שבוחר בשבילו (K8s Service, AWS ALB).</li>
</ul>
<blockquote>💡 מהשטח: gRPC משתמש בחיבורי HTTP/2 ארוכים, אז ClusterIP רגיל ב-K8s מאזן <em>חיבורים</em>, לא בקשות — pod אחד יכול לחטוף את כל התעבורה. הפתרון: mesh, headless Service עם איזון בצד הלקוח, או proxy ב-L7.</blockquote>
<p>Health checks חשובים כמו ה-registry עצמו: instance שרשום אבל חולה גרוע יותר מ-instance שפשוט לא קיים.</p>`
      }
    }
  ],
  diagram:
`            NORTH-SOUTH                         EAST-WEST (mesh)
  [web] [mobile] [partner]
     |      |        |
  +--v------v--------v--+      +-----------------+    +-----------------+
  |    API GATEWAY      |      | orders | envoy  |<-->| billing | envoy |
  | TLS auth ratelimit  |----->+-----------------+mTLS+-----------------+
  +--+-----------+------+              ^  control plane (istiod) pushes
     |           |                     |  routes, certs, retry policy
  [web BFF]  [mobile BFF] ---> domain services`,
  handsOn: [
    { cmd: "for i in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}\\n' -H 'apikey: demo' https://api.example.com/orders; done | sort | uniq -c", what: { en: "Hammer a rate-limited endpoint and count 200s vs 429s to see the gateway's limiter kick in.", he: "מפציצים endpoint עם rate limit וסופרים 200 מול 429 כדי לראות את ה-limiter של ה-gateway נכנס לפעולה." } },
    { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=orders -o wide", what: { en: "See the actual pod IPs behind a Service — this is Kubernetes service discovery.", he: "רואים את ה-IPs האמיתיים של ה-pods מאחורי Service — זה ה-service discovery של Kubernetes." } },
    { cmd: "istioctl proxy-config routes deploy/orders -o json | head -50", what: { en: "Inspect the routes, retries and timeouts that Istio pushed into the Envoy sidecar.", he: "בודקים את ה-routes, retries ו-timeouts ש-Istio דחף ל-Envoy sidecar." } },
    { cmd: "linkerd viz stat deploy -n prod", what: { en: "Per-deployment success rate, RPS and p50/p95/p99 latency — for free from the mesh.", he: "Success rate, RPS ו-latency של p50/p95/p99 לכל deployment — במתנה מה-mesh." } }
  ],
  mnemonic: {
    en: "Gateway = \"RARA\": Route, Authenticate, Rate-limit, Aggregate. Mesh = \"Mesh handles the Mess between services\" (mTLS, retries, splits).",
    he: "Gateway = \"RARA\": Route, Authenticate, Rate-limit, Aggregate. Mesh = \"ה-Mesh מסדר את הבלגן בין השירותים\" (mTLS, retries, splits)."
  },
  pitfalls: [
    { en: "Retries configured both in the app and in the mesh (and the gateway): 3 x 3 x 3 = 27 attempts against a struggling service — a self-inflicted DDoS.", he: "Retries מוגדרים גם באפליקציה וגם ב-mesh (וגם ב-gateway): 3 x 3 x 3 = 27 ניסיונות מול service שכבר מתקשה — DDoS עצמי." },
    { en: "The gateway as a single point of failure: run it with multiple replicas across zones and give it its own capacity plan.", he: "ה-gateway כ-single point of failure: מריצים כמה replicas על כמה zones ונותנים לו capacity plan משלו." },
    { en: "Trusting identity headers (X-User-Id) from anywhere — internal services must only accept them from the gateway/mesh, or anyone inside the network can impersonate users.", he: "לסמוך על headers של זהות (X-User-Id) מכל מקום — שירותים פנימיים חייבים לקבל אותם רק מה-gateway/mesh, אחרת כל מי שבתוך הרשת יכול להתחזות למשתמשים." }
  ],
  interview: [
    {
      q: { en: "API gateway vs service mesh — do you need both?", he: "API gateway מול service mesh — צריך את שניהם?" },
      a: { en: "They solve different directions. The gateway handles north-south: external clients, auth, rate limits, API products. The mesh handles east-west: mTLS, retries, traffic shifting and telemetry between internal services. Small systems need only a gateway; large ones often run both, sometimes with the same Envoy technology underneath.", he: "הם פותרים כיוונים שונים. ה-gateway מטפל ב-north-south: לקוחות חיצוניים, auth, rate limits, מוצרי API. ה-mesh מטפל ב-east-west: mTLS, retries, traffic shifting ו-telemetry בין שירותים פנימיים. מערכות קטנות צריכות רק gateway; גדולות מריצות לעתים קרובות את שניהם, לפעמים עם אותו Envoy מתחת." }
    },
    {
      q: { en: "Why might a gRPC service behind a Kubernetes ClusterIP have one hot pod?", he: "למה service של gRPC מאחורי ClusterIP ב-Kubernetes יכול לקבל pod אחד חם?" },
      a: { en: "ClusterIP balances at L4 per connection. gRPC multiplexes all requests over one long-lived HTTP/2 connection, so all of a client's requests stick to one pod. Use L7 balancing: a service mesh, a headless Service with gRPC client-side load balancing, or periodic connection recycling (MaxConnectionAge).", he: "ClusterIP מאזן ב-L4 לפי חיבור. gRPC מרכז את כל הבקשות על חיבור HTTP/2 אחד ארוך, כך שכל הבקשות של לקוח נדבקות ל-pod אחד. הפתרון: איזון ב-L7 — service mesh, headless Service עם load balancing בצד הלקוח של gRPC, או מחזור חיבורים תקופתי (MaxConnectionAge)." }
    }
  ],
  quiz: [
    {
      q: { en: "Which responsibility does NOT belong in an API gateway?", he: "איזו אחריות לא שייכת ל-API gateway?" },
      options: [
        { en: "Validating JWTs", he: "אימות JWTs" },
        { en: "Per-API-key rate limiting", he: "Rate limiting לכל API key" },
        { en: "Calculating order discounts based on customer tier", he: "חישוב הנחות להזמנה לפי דרגת לקוח" },
        { en: "Routing /v2 paths to a new service version", he: "ניתוב נתיבי /v2 לגרסה חדשה של service" }
      ],
      answer: 2,
      explain: { en: "Discount rules are business logic and belong in a domain service. Auth, rate limiting and routing are classic cross-cutting gateway concerns.", he: "חוקי הנחות הם לוגיקה עסקית ושייכים ל-domain service. Auth, rate limiting ו-routing הם cross-cutting concerns קלאסיים של gateway." }
    },
    {
      q: { en: "In Istio's classic mode, what actually enforces mTLS between two pods?", he: "ב-Istio במצב הקלאסי, מה בפועל אוכף mTLS בין שני pods?" },
      options: [
        { en: "The application code using a TLS library", he: "קוד האפליקציה עם ספריית TLS" },
        { en: "The Envoy sidecar proxies in each pod", he: "ה-Envoy sidecar proxies בכל pod" },
        { en: "The Kubernetes API server", he: "ה-API server של Kubernetes" },
        { en: "The cloud load balancer", he: "ה-load balancer של הענן" }
      ],
      answer: 1,
      explain: { en: "The data-plane sidecars terminate and originate mTLS; istiod (control plane) only issues certificates and pushes config.", he: "ה-sidecars ב-data plane מבצעים את ה-mTLS בשני הצדדים; istiod (ה-control plane) רק מנפיק תעודות ודוחף קונפיגורציה." }
    },
    {
      q: { en: "Your mobile app makes 3 sequential API calls on launch over a 150 ms RTT network. What pattern most directly helps?", he: "אפליקציית המובייל עושה 3 קריאות API רצופות בעלייה, על רשת עם RTT של 150 ms. איזו תבנית עוזרת הכי ישירות?" },
      options: [
        { en: "A service mesh with mTLS", he: "Service mesh עם mTLS" },
        { en: "A Backend-for-Frontend that aggregates the calls server-side", he: "Backend-for-Frontend שמאחד את הקריאות בצד השרת" },
        { en: "Client-side service discovery", he: "Service discovery בצד הלקוח" },
        { en: "Increasing the gateway rate limit", he: "העלאת ה-rate limit ב-gateway" }
      ],
      answer: 1,
      explain: { en: "A BFF turns 3 slow mobile round-trips into 1, doing the fan-out over the fast datacenter network (~1 ms hops).", he: "BFF הופך 3 round-trips איטיים מהמובייל לאחד, ועושה את ה-fan-out ברשת המהירה של ה-datacenter (hops של ~1 ms)." }
    }
  ],
  related: ["net-load-balancing", "arch-resilience", "arch-monolith-vs-microservices", "obs-traces"]
});


INFRA.lessons.push({
  id: "arch-sync-vs-async",
  track: "architecture",
  order: 3,
  icon: "🔀",
  level: 2,
  minutes: 9,
  title: { en: "Sync vs Async Communication", he: "תקשורת סינכרונית מול אסינכרונית" },
  tldr: {
    en: "Sync calls couple services in time: if anyone in the chain is slow or down, you are too. Async decouples time at the cost of immediacy and simplicity.",
    he: "קריאות סינכרוניות מצמידות שירותים בזמן: אם מישהו בשרשרת איטי או נפל — גם אתם. אסינכרוני משחרר את הצימוד בזמן, במחיר של מיידיות ופשטות."
  },
  analogy: {
    en: "A sync call is a phone call: instant answers, but both people must be available right now, and if you're on hold you can't do anything else. Async messaging is WhatsApp: you send and move on, they reply when they can — but you don't know exactly when, and you'd better handle 'seen but no reply'.",
    he: "קריאה סינכרונית היא שיחת טלפון: תשובה מיידית, אבל שני הצדדים חייבים להיות זמינים עכשיו, ואם אתה בהמתנה — אתה לא עושה שום דבר אחר. הודעות אסינכרוניות הן וואטסאפ: שולחים וממשיכים הלאה, הצד השני עונה כשהוא יכול — אבל אתה לא יודע בדיוק מתי, וכדאי שתדע להתמודד עם 'וי כחול בלי תשובה'."
  },
  sections: [
    {
      h: { en: "Request-response: REST and gRPC", he: "Request-response: REST ו-gRPC" },
      body: {
        en: `<p>In <strong>synchronous request-response</strong>, the caller sends a request and blocks (or awaits) until it gets a response or times out.</p>
<ul>
<li><strong>REST/JSON over HTTP</strong>: universal, human-readable, cacheable (GET + ETag), easy to curl. Text parsing costs CPU; schemas are optional (OpenAPI helps).</li>
<li><strong>gRPC</strong>: Protobuf over HTTP/2 — binary, strongly typed contracts, code generation, streaming in both directions, multiplexing. Typically 3–10x smaller payloads than JSON. Harder to debug by eye, needs grpcurl, browsers need gRPC-Web.</li>
</ul>
<pre>// billing.proto
service Billing {
  rpc Charge(ChargeRequest) returns (ChargeReply);
}
message ChargeRequest { string order_id = 1; int64 amount_cents = 2; }</pre>
<p>Use sync when the caller <em>genuinely needs the answer to continue</em>: "is this password correct?", "what's the price?", "show me the cart". The user is waiting; a queue doesn't make them wait less.</p>
<blockquote>💡 Real world: A common split is REST at the edge (public APIs, browsers) and gRPC internally (service-to-service), with Kafka or a queue for everything that doesn't need an immediate answer.</blockquote>`,
        he: `<p>ב-<strong>request-response סינכרוני</strong>, הקורא שולח בקשה ונחסם (או עושה await) עד שמגיעה תשובה או timeout.</p>
<ul>
<li><strong>REST/JSON על HTTP</strong>: אוניברסלי, קריא לבני אדם, ניתן ל-caching (GET + ETag), קל לעשות לו curl. הפרסור של טקסט עולה CPU; schema אופציונלי (OpenAPI עוזר).</li>
<li><strong>gRPC</strong>: Protobuf על HTTP/2 — בינארי, חוזים עם טיפוסים חזקים, code generation, streaming לשני הכיוונים, multiplexing. בדרך כלל payloads קטנים פי 3–10 מ-JSON. קשה יותר לדבג בעין, צריך grpcurl, ובדפדפן צריך gRPC-Web.</li>
</ul>
<pre>// billing.proto
service Billing {
  rpc Charge(ChargeRequest) returns (ChargeReply);
}
message ChargeRequest { string order_id = 1; int64 amount_cents = 2; }</pre>
<p>משתמשים בסינכרוני כשהקורא <em>באמת צריך את התשובה כדי להמשיך</em>: "הסיסמה נכונה?", "מה המחיר?", "תראה לי את העגלה". המשתמש מחכה; queue לא יגרום לו לחכות פחות.</p>
<blockquote>💡 מהשטח: חלוקה נפוצה היא REST בקצה (APIs ציבוריים, דפדפנים) ו-gRPC בפנים (service-to-service), עם Kafka או queue לכל מה שלא צריך תשובה מיידית.</blockquote>`
      }
    },
    {
      h: { en: "Temporal coupling and the availability math", he: "צימוד בזמן ומתמטיקת הזמינות" },
      body: {
        en: `<p><strong>Temporal coupling</strong> means both sides must be up <em>at the same moment</em>. In a sync chain, availabilities multiply:</p>
<pre>checkout -&gt; orders -&gt; inventory -&gt; pricing -&gt; billing
each 99.9% available
chain availability = 0.999^5 = 0.995  (99.5%)
99.9% = 43 min downtime/month   99.5% = 3.6 hours/month</pre>
<p>Five "three-nines" services in a row give you two-and-a-half nines. Ten of them and you're at 99.0% — 7.3 hours a month.</p>
<p>With <strong>async messaging</strong>, checkout writes an <code>OrderPlaced</code> message to a durable broker and returns "order received". If billing is down for 10 minutes, messages wait in the queue and get processed when it recovers. The user never sees the outage. The price: the user gets "we're processing your order" instead of an instant confirmation, and you must handle failures after the fact (email "payment failed", compensations).</p>
<blockquote>⚠️ Production tip: Ask for each dependency: "If this is down for 5 minutes, should my request fail?" If the answer is no, it shouldn't be a synchronous call.</blockquote>`,
        he: `<p><strong>צימוד בזמן (temporal coupling)</strong> אומר ששני הצדדים חייבים להיות למעלה <em>באותו רגע</em>. בשרשרת סינכרונית, הזמינויות מוכפלות:</p>
<pre>checkout -&gt; orders -&gt; inventory -&gt; pricing -&gt; billing
each 99.9% available
chain availability = 0.999^5 = 0.995  (99.5%)
99.9% = 43 min downtime/month   99.5% = 3.6 hours/month</pre>
<p>חמישה שירותים של "שלוש תשיעיות" בשורה נותנים לכם שתיים וחצי. עם עשרה כאלה אתם ב-99.0% — 7.3 שעות בחודש.</p>
<p>עם <strong>הודעות אסינכרוניות</strong>, ה-checkout כותב הודעת <code>OrderPlaced</code> ל-broker עמיד ומחזיר "ההזמנה התקבלה". אם billing נופל ל-10 דקות, ההודעות מחכות ב-queue ומעובדות כשהוא חוזר. המשתמש בכלל לא רואה את התקלה. המחיר: המשתמש מקבל "אנחנו מעבדים את ההזמנה" במקום אישור מיידי, וצריך לטפל בכשלונות בדיעבד (מייל "התשלום נכשל", פעולות מפצות).</p>
<blockquote>⚠️ טיפ לפרודקשן: תשאלו על כל תלות: "אם זה למטה ל-5 דקות, הבקשה שלי צריכה להיכשל?" אם התשובה לא — זה לא צריך להיות קריאה סינכרונית.</blockquote>`
      }
    },
    {
      h: { en: "Latency chains: why p99 gets worse with every hop", he: "שרשראות latency: למה ה-p99 מחמיר עם כל hop" },
      body: {
        en: `<p>Latencies add along a sync chain, but the <strong>tail</strong> is the real killer. If each service has a 1% chance of a slow response (its p99), a request that touches N services hits at least one slow one with probability <code>1 - 0.99^N</code>:</p>
<table>
<tr><th>Hops / fan-out</th><th>Chance of hitting a p99-slow call</th></tr>
<tr><td>1</td><td>1%</td></tr>
<tr><td>5</td><td>4.9%</td></tr>
<tr><td>10</td><td>9.6%</td></tr>
<tr><td>100 (fan-out)</td><td>63%</td></tr>
</table>
<p>So your end-to-end <em>p95</em> is roughly made of your dependencies' <em>p99s</em>. This is "The Tail at Scale" (Dean &amp; Barroso, Google, 2013). Mitigations: fewer hops, parallel instead of sequential calls, tight timeouts, hedged requests (send a second copy after the p95 delay, use whichever returns first), caching, and moving non-essential work async.</p>
<blockquote>💡 Real world: Open a trace waterfall in Jaeger/Tempo. A staircase of sequential spans is a latency chain screaming to be parallelized or made async.</blockquote>`,
        he: `<p>ה-latency מצטבר לאורך שרשרת סינכרונית, אבל ה-<strong>tail</strong> הוא הרוצח האמיתי. אם לכל service יש 1% סיכוי לתשובה איטית (ה-p99 שלו), בקשה שנוגעת ב-N שירותים תפגוש לפחות אחד איטי בהסתברות <code>1 - 0.99^N</code>:</p>
<table>
<tr><th>Hops / fan-out</th><th>סיכוי לפגוש קריאה איטית ברמת p99</th></tr>
<tr><td>1</td><td>1%</td></tr>
<tr><td>5</td><td>4.9%</td></tr>
<tr><td>10</td><td>9.6%</td></tr>
<tr><td>100 (fan-out)</td><td>63%</td></tr>
</table>
<p>כלומר ה-<em>p95</em> מקצה לקצה שלכם בנוי בערך מה-<em>p99</em> של התלויות. זה "The Tail at Scale" (Dean ו-Barroso, Google, 2013). פתרונות: פחות hops, קריאות במקביל במקום ברצף, timeouts הדוקים, hedged requests (שולחים עותק שני אחרי זמן ה-p95 ולוקחים את מי שחוזר ראשון), caching, והעברת עבודה לא-הכרחית לאסינכרוני.</p>
<blockquote>💡 מהשטח: תפתחו trace waterfall ב-Jaeger/Tempo. מדרגות של spans רצופים זו שרשרת latency שצועקת שיעשו אותה במקביל או אסינכרונית.</blockquote>`
      }
    },
    {
      h: { en: "Choosing: a practical decision guide", he: "איך בוחרים: מדריך מעשי" },
      body: {
        en: `<ul>
<li><strong>Query</strong> (need data now, read-only) → sync. Cache it if you can.</li>
<li><strong>Command whose result the user must see now</strong> (login, payment authorization) → sync, with timeout + retry + fallback.</li>
<li><strong>Side effects others care about</strong> (send email, update search index, analytics, loyalty points) → publish an event, async.</li>
<li><strong>Long-running work</strong> (video transcoding, report generation, ML batch inference) → queue + return <code>202 Accepted</code> with a job ID; client polls or gets a webhook/WebSocket push.</li>
</ul>
<pre>POST /reports        -&gt; 202 Accepted  { "jobId": "r-8f2", "status": "queued" }
GET  /reports/r-8f2  -&gt; 200 { "status": "done", "url": "https://..." }</pre>
<p>Async is not free: you now need a broker (another thing to run), message schemas and versioning, idempotent consumers, DLQs, and tracing that propagates context through messages. Debugging "why didn't this happen?" is harder than "why did this 500?"</p>
<blockquote>⚠️ Production tip: Don't fake sync over async (send a message, then block waiting for a reply message) on the user's request path unless you really must — you get the latency of sync plus the moving parts of async.</blockquote>`,
        he: `<ul>
<li><strong>Query</strong> (צריך דאטה עכשיו, קריאה בלבד) → סינכרוני. אם אפשר — cache.</li>
<li><strong>Command שהמשתמש חייב לראות את התוצאה שלו עכשיו</strong> (login, אישור תשלום) → סינכרוני, עם timeout + retry + fallback.</li>
<li><strong>Side effects שמעניינים אחרים</strong> (שליחת מייל, עדכון search index, analytics, נקודות מועדון) → מפרסמים event, אסינכרוני.</li>
<li><strong>עבודה ארוכה</strong> (transcoding לווידאו, הפקת דוחות, batch של ML inference) → queue + מחזירים <code>202 Accepted</code> עם job ID; הלקוח עושה polling או מקבל webhook/WebSocket.</li>
</ul>
<pre>POST /reports        -&gt; 202 Accepted  { "jobId": "r-8f2", "status": "queued" }
GET  /reports/r-8f2  -&gt; 200 { "status": "done", "url": "https://..." }</pre>
<p>אסינכרוני זה לא בחינם: עכשיו צריך broker (עוד משהו להריץ), schemas להודעות וניהול גרסאות, consumers אידמפוטנטיים, DLQs, ו-tracing שמעביר context דרך ההודעות. לדבג "למה זה לא קרה?" קשה יותר מ-"למה זה החזיר 500?"</p>
<blockquote>⚠️ טיפ לפרודקשן: אל תזייפו סינכרוני מעל אסינכרוני (שולחים הודעה ואז חוסמים עד שמגיעה הודעת תשובה) בנתיב של בקשת משתמש, אלא אם באמת חייבים — מקבלים את ה-latency של סינכרוני ואת כל החלקים הנעים של אסינכרוני.</blockquote>`
      }
    }
  ],
  diagram:
`SYNC (coupled in time)                       ASYNC (decoupled)
client -> A --> B --> C --> D               client -> A --publish--> [ broker ]
          |<----|<----|<----|                          |                |   |
  latency = A+B+C+D                        202 Accepted            B   C  (consume
  avail   = a*b*c*d                        (fast!)                       when ready)
  any down => request fails                B down => messages wait, retry later`,
  handsOn: [
    { cmd: "curl -w 'dns=%{time_namelookup} connect=%{time_connect} ttfb=%{time_starttransfer} total=%{time_total}\\n' -o /dev/null -s https://httpbin.org/delay/1", what: { en: "Break a sync call into its phases — see how much of 'latency' is just waiting for the server.", he: "מפרקים קריאה סינכרונית לשלבים — רואים כמה מה-'latency' הוא פשוט המתנה לשרת." } },
    { cmd: "grpcurl -plaintext -d '{\"order_id\":\"o-1\",\"amount_cents\":4200}' localhost:50051 billing.Billing/Charge", what: { en: "Call a gRPC method from the terminal (requires server reflection) — curl for gRPC.", he: "קוראים ל-method של gRPC מהטרמינל (דורש server reflection) — ה-curl של gRPC." } },
    { cmd: "python3 -c \"[print(n, round(1-0.99**n,3)) for n in (1,5,10,20,50,100)]\"", what: { en: "Compute the tail-latency amplification table yourself for any number of hops.", he: "מחשבים בעצמכם את טבלת הגברת ה-tail latency לכל מספר hops." } }
  ],
  mnemonic: {
    en: "\"Sync multiplies, async buffers.\" Sync chains multiply availability (down) and tail latency (up); a queue is a shock absorber.",
    he: "\"סינכרוני מכפיל, אסינכרוני בולם.\" שרשראות סינכרוניות מכפילות זמינות (למטה) ו-tail latency (למעלה); queue הוא בולם זעזועים."
  },
  pitfalls: [
    { en: "Calling dependencies sequentially when they're independent — use Promise.all / goroutines / asyncio.gather to make latency max() instead of sum().", he: "לקרוא לתלויות ברצף כשהן בלתי תלויות — Promise.all / goroutines / asyncio.gather הופכים את ה-latency מ-sum() ל-max()." },
    { en: "No timeout on sync calls. Default HTTP clients often wait forever (or 60s+), so one slow dependency exhausts your thread pool.", he: "אין timeout על קריאות סינכרוניות. HTTP clients ברירת מחדל מחכים לנצח (או 60 שניות+), ו-dependency איטי אחד מרוקן את ה-thread pool." },
    { en: "Making everything async 'for decoupling', then building request-reply over queues for reads — slower, harder to debug, same coupling.", he: "להפוך הכול לאסינכרוני 'בשביל decoupling', ואז לבנות request-reply מעל queues לקריאות — יותר איטי, יותר קשה לדבג, אותו צימוד." }
  ],
  interview: [
    {
      q: { en: "Each of 6 downstream services has p99 = 200 ms. Your endpoint calls them sequentially. What happens to your tail latency, and how do you fix it?", he: "ל-6 שירותים downstream יש p99 של 200 ms. ה-endpoint שלכם קורא להם ברצף. מה קורה ל-tail latency, ואיך מתקנים?" },
      a: { en: "Latencies sum, and ~5.9% of requests (1-0.99^6) hit at least one p99-slow call, so your p95 is already dominated by dependency tails. Fixes: parallelize independent calls, set per-call timeouts within a total budget, cache stable data, hedge requests to replicated backends, and move non-essential calls (analytics, notifications) to async events.", he: "ה-latencies מצטברים, ו-~5.9% מהבקשות (1-0.99^6) פוגשות לפחות קריאה איטית אחת ברמת p99, כך שה-p95 שלכם כבר נשלט על ידי ה-tails של התלויות. תיקונים: לבצע קריאות בלתי תלויות במקביל, timeouts לכל קריאה בתוך תקציב זמן כולל, cache לדאטה יציב, hedged requests ל-backends משוכפלים, והעברת קריאות לא-הכרחיות (analytics, התראות) ל-events אסינכרוניים." }
    },
    {
      q: { en: "When would you choose gRPC over REST?", he: "מתי תבחרו ב-gRPC על פני REST?" },
      a: { en: "Internal, high-throughput service-to-service calls where you control both sides: you get typed contracts with codegen, smaller binary payloads, HTTP/2 multiplexing and streaming. REST stays better for public/browser APIs, HTTP caching and ease of debugging.", he: "קריאות פנימיות עם throughput גבוה בין שירותים כששולטים בשני הצדדים: מקבלים חוזים מוקלדים עם codegen, payloads בינאריים קטנים, multiplexing ו-streaming של HTTP/2. REST נשאר עדיף ל-APIs ציבוריים ולדפדפנים, ל-HTTP caching ולנוחות דיבאג." }
    }
  ],
  quiz: [
    {
      q: { en: "Four services in a synchronous chain each have 99.9% availability. The chain's availability is about:", he: "ארבעה שירותים בשרשרת סינכרונית, לכל אחד 99.9% זמינות. הזמינות של השרשרת היא בערך:" },
      options: [
        { en: "99.9% — the chain is as good as its parts", he: "99.9% — השרשרת טובה כמו החלקים שלה" },
        { en: "99.6%", he: "99.6%" },
        { en: "99.99% — more services means more redundancy", he: "99.99% — יותר שירותים זה יותר יתירות" },
        { en: "96%", he: "96%" }
      ],
      answer: 1,
      explain: { en: "0.999^4 ≈ 0.996. Serial dependencies multiply; there's no redundancy in a chain.", he: "0.999^4 ≈ 0.996. תלויות טוריות מוכפלות; אין שום יתירות בשרשרת." }
    },
    {
      q: { en: "A request fans out to 100 backends in parallel and waits for all. Each has a 1% chance of a slow response. Roughly how often is the whole request slow?", he: "בקשה מתפצלת ל-100 backends במקביל ומחכה לכולם. לכל אחד 1% סיכוי לתשובה איטית. בערך כמה פעמים הבקשה כולה איטית?" },
      options: [
        { en: "1% of the time", he: "1% מהזמן" },
        { en: "10% of the time", he: "10% מהזמן" },
        { en: "About 63% of the time", he: "בערך 63% מהזמן" },
        { en: "Never — parallel calls hide slowness", he: "אף פעם — קריאות במקביל מסתירות איטיות" }
      ],
      answer: 2,
      explain: { en: "1 - 0.99^100 ≈ 0.63. Waiting for all = you're as slow as the slowest; that's why hedging and partial results matter at fan-out.", he: "1 - 0.99^100 ≈ 0.63. לחכות לכולם = אתם איטיים כמו האיטי ביותר; לכן hedging ותוצאות חלקיות קריטיים ב-fan-out." }
    },
    {
      q: { en: "Which operation is the best candidate for async messaging?", he: "איזו פעולה היא המועמדת הכי טובה להודעות אסינכרוניות?" },
      options: [
        { en: "Checking a user's password at login", he: "בדיקת סיסמה בזמן login" },
        { en: "Fetching the cart to render the checkout page", he: "שליפת העגלה כדי לרנדר את דף ה-checkout" },
        { en: "Sending the order confirmation email", he: "שליחת מייל אישור הזמנה" },
        { en: "Reading the current product price", he: "קריאת המחיר הנוכחי של מוצר" }
      ],
      answer: 2,
      explain: { en: "The user doesn't need the email to be sent before seeing 'order placed'. The others are queries/commands whose result is needed immediately.", he: "המשתמש לא צריך שהמייל יישלח לפני שהוא רואה 'ההזמנה בוצעה'. השאר הן queries/commands שהתוצאה שלהן נדרשת מיד." }
    }
  ],
  related: ["arch-queues", "arch-resilience", "obs-traces", "rel-sli-slo-sla"]
});

INFRA.lessons.push({
  id: "arch-queues",
  track: "architecture",
  order: 4,
  icon: "📬",
  level: 2,
  minutes: 12,
  title: { en: "Queues: Delivery, Acks & DLQs", he: "Queues: מסירה, Acks ו-DLQs" },
  tldr: {
    en: "A queue buffers work between producers and consumers; assume every message can arrive twice, so make consumers idempotent and park poison in a DLQ.",
    he: "Queue הוא באפר של עבודה בין producers ל-consumers; תניחו שכל הודעה יכולה להגיע פעמיים, אז תעשו consumers אידמפוטנטיים ותחנו הודעות רעל ב-DLQ."
  },
  analogy: {
    en: "A queue is the ticket rail in a busy restaurant kitchen. Waiters (producers) clip orders on the rail; cooks (consumers) pull them off. When the dinner rush comes, the rail gets long (backlog) but nobody's turned away. If a cook grabs a ticket and faints, the ticket goes back on the rail after a while (visibility timeout). And the order for 'a pizza with ketchup and sushi' that makes every cook cry? It goes to the manager's desk (dead-letter queue) instead of being retried forever.",
    he: "Queue זה המתלה של הפתקים במטבח של מסעדה עמוסה. המלצרים (producers) תולים הזמנות; הטבחים (consumers) מורידים אותן. כשמגיע העומס של ערב שישי, המתלה מתארך (backlog) — אבל אף אחד לא נשלח הביתה. אם טבח לקח פתק והתעלף, הפתק חוזר למתלה אחרי זמן מה (visibility timeout). וההזמנה של 'פיצה עם קטשופ וסושי' שגורמת לכל טבח לבכות? היא הולכת לשולחן של המנהל (dead-letter queue) במקום לנסות אותה שוב לנצח."
  },
  sections: [
    {
      h: { en: "Producers, consumers and backlog", he: "Producers, consumers ו-backlog" },
      body: {
        en: `<p>A <strong>message queue</strong> decouples who creates work (<strong>producers</strong>) from who does it (<strong>consumers</strong>). Each message is delivered to <em>one</em> consumer out of a pool of <strong>competing consumers</strong> — add more workers, get more throughput.</p>
<p><strong>Backlog</strong> (queue depth) is the queue's vital sign. Simple math: if producers send 500 msg/s and you have 10 consumers each handling 40 msg/s (400 msg/s total), backlog grows by 100 msg/s = 360,000 messages per hour. To drain 360k while still receiving 500/s, you need capacity above 500/s — with 15 consumers (600/s) you drain at a net 100/s, which takes an hour.</p>
<p>Watch two metrics: <strong>queue depth</strong> and <strong>age of oldest message</strong>. Depth tells you volume; age tells you how late your users' work is. A depth of 10,000 is fine if consumers do 5,000/s; an oldest-message age of 45 minutes is bad no matter what.</p>
<blockquote>💡 Real world: KEDA autoscales Kubernetes consumers on queue depth (SQS ApproximateNumberOfMessages, RabbitMQ queue length, Kafka consumer lag) — the right signal, much better than CPU for workers.</blockquote>`,
        he: `<p><strong>Message queue</strong> מפריד בין מי שיוצר עבודה (<strong>producers</strong>) לבין מי שמבצע אותה (<strong>consumers</strong>). כל הודעה נמסרת ל-consumer <em>אחד</em> מתוך מאגר של <strong>competing consumers</strong> — מוסיפים workers, מקבלים יותר throughput.</p>
<p><strong>Backlog</strong> (עומק התור) הוא הדופק של ה-queue. חשבון פשוט: אם producers שולחים 500 הודעות לשנייה ויש 10 consumers שכל אחד מטפל ב-40 לשנייה (400 בסך הכול), ה-backlog גדל ב-100 לשנייה = 360,000 הודעות בשעה. כדי לרוקן 360k כשעדיין מגיעות 500 לשנייה, צריך קיבולת מעל 500 — עם 15 consumers (600 לשנייה) מרוקנים נטו 100 לשנייה, כלומר שעה.</p>
<p>עוקבים אחרי שתי מטריקות: <strong>queue depth</strong> ו-<strong>גיל ההודעה הכי ישנה</strong>. העומק מספר על נפח; הגיל מספר כמה העבודה של המשתמשים מאחרת. עומק של 10,000 זה בסדר אם ה-consumers עושים 5,000 לשנייה; הודעה בת 45 דקות זה רע בכל מקרה.</p>
<blockquote>💡 מהשטח: KEDA עושה autoscaling ל-consumers ב-Kubernetes לפי עומק התור (ApproximateNumberOfMessages של SQS, אורך תור ב-RabbitMQ, consumer lag ב-Kafka) — הסיגנל הנכון, הרבה יותר טוב מ-CPU ל-workers.</blockquote>`
      }
    },
    {
      h: { en: "Acks and visibility timeout", he: "Acks ו-visibility timeout" },
      body: {
        en: `<p>How does a queue know a message was processed? The consumer <strong>acknowledges (ack)</strong> it <em>after</em> doing the work. Until then, the message is "in flight".</p>
<ul>
<li><strong>SQS</strong>: on receive, the message becomes invisible for the <strong>visibility timeout</strong> (default 30 s). Call <code>DeleteMessage</code> to ack. If you don't within the timeout (crash, slow job), it reappears for another consumer.</li>
<li><strong>RabbitMQ</strong>: manual <code>basic.ack</code>; if the consumer's channel/connection dies, unacked messages are requeued. <code>basic.nack(requeue=false)</code> rejects to a dead-letter exchange.</li>
</ul>
<pre># Python + boto3 (SQS)
msgs = sqs.receive_message(QueueUrl=Q, MaxNumberOfMessages=10,
                           WaitTimeSeconds=20,          # long polling
                           VisibilityTimeout=120)
for m in msgs.get("Messages", []):
    process(m["Body"])                                  # do the work FIRST
    sqs.delete_message(QueueUrl=Q, ReceiptHandle=m["ReceiptHandle"])  # then ack</pre>
<blockquote>⚠️ Production tip: Set the visibility timeout comfortably above your worst-case processing time (AWS recommends 6x the function timeout for Lambda triggers). Too short and slow jobs get processed twice in parallel; too long and crashed work sits invisible for ages. For long jobs, extend it with ChangeMessageVisibility as a heartbeat.</blockquote>`,
        he: `<p>איך ה-queue יודע שהודעה עובדה? ה-consumer עושה לה <strong>ack</strong> <em>אחרי</em> שסיים את העבודה. עד אז ההודעה "in flight".</p>
<ul>
<li><strong>SQS</strong>: ברגע הקבלה ההודעה הופכת לבלתי נראית למשך ה-<strong>visibility timeout</strong> (ברירת מחדל 30 שניות). קוראים ל-<code>DeleteMessage</code> בתור ack. אם לא עשיתם את זה בזמן (קריסה, job איטי) — היא חוזרת ל-consumer אחר.</li>
<li><strong>RabbitMQ</strong>: <code>basic.ack</code> ידני; אם ה-channel/connection של ה-consumer מת, הודעות בלי ack חוזרות לתור. <code>basic.nack(requeue=false)</code> דוחה אותן ל-dead-letter exchange.</li>
</ul>
<pre># Python + boto3 (SQS)
msgs = sqs.receive_message(QueueUrl=Q, MaxNumberOfMessages=10,
                           WaitTimeSeconds=20,          # long polling
                           VisibilityTimeout=120)
for m in msgs.get("Messages", []):
    process(m["Body"])                                  # do the work FIRST
    sqs.delete_message(QueueUrl=Q, ReceiptHandle=m["ReceiptHandle"])  # then ack</pre>
<blockquote>⚠️ טיפ לפרודקשן: תגדירו visibility timeout עם מרווח נוח מעל זמן העיבוד הגרוע ביותר (AWS ממליצים על פי 6 מה-timeout של הפונקציה כשמחברים ל-Lambda). קצר מדי — jobs איטיים יעובדו פעמיים במקביל; ארוך מדי — עבודה שקרסה תשב בלתי נראית המון זמן. ל-jobs ארוכים, מאריכים עם ChangeMessageVisibility בתור heartbeat.</blockquote>`
      }
    },
    {
      h: { en: "At-most-once, at-least-once, exactly-once", he: "At-most-once, at-least-once, exactly-once" },
      body: {
        en: `<ul>
<li><strong>At-most-once</strong>: ack <em>before</em> processing (or fire-and-forget). Crash mid-work = message lost. OK for metrics samples, not for payments.</li>
<li><strong>At-least-once</strong>: ack <em>after</em> processing. Crash after work but before ack = message redelivered = processed twice. This is the default of SQS standard, RabbitMQ with manual acks, Kafka with commit-after-process, Pub/Sub.</li>
<li><strong>Exactly-once</strong>: end-to-end, across arbitrary side effects (sending an email, charging a card), it's impossible in general — the Two Generals problem bites. What systems offer is <em>exactly-once processing within their boundary</em>: Kafka transactions (read-process-write to Kafka atomically), SQS FIFO's 5-minute deduplication window.</li>
</ul>
<p>The practical recipe everyone converges on: <strong>at-least-once delivery + idempotent consumer = effectively-once</strong>.</p>
<blockquote>💡 Real world: When a vendor says "exactly-once", read the fine print: it's almost always "within our system" or "within a dedup window". Your Stripe call or email send still needs an idempotency key.</blockquote>`,
        he: `<ul>
<li><strong>At-most-once</strong>: ack <em>לפני</em> העיבוד (או fire-and-forget). קריסה באמצע = ההודעה אבדה. בסדר לדגימות של מטריקות, לא לתשלומים.</li>
<li><strong>At-least-once</strong>: ack <em>אחרי</em> העיבוד. קריסה אחרי העבודה אבל לפני ה-ack = ההודעה נמסרת שוב = מעובדת פעמיים. זו ברירת המחדל של SQS standard, RabbitMQ עם manual acks, Kafka עם commit אחרי עיבוד, Pub/Sub.</li>
<li><strong>Exactly-once</strong>: מקצה לקצה, כולל side effects שרירותיים (שליחת מייל, חיוב כרטיס), זה בלתי אפשרי באופן כללי — בעיית שני הגנרלים נושכת. מה שמערכות מציעות זה <em>exactly-once processing בתוך הגבולות שלהן</em>: Kafka transactions (קריאה-עיבוד-כתיבה ל-Kafka באופן אטומי), חלון ה-deduplication של 5 דקות ב-SQS FIFO.</li>
</ul>
<p>המתכון המעשי שכולם מגיעים אליו: <strong>at-least-once delivery + consumer אידמפוטנטי = effectively-once</strong>.</p>
<blockquote>💡 מהשטח: כשספק אומר "exactly-once", תקראו את האותיות הקטנות: כמעט תמיד זה "בתוך המערכת שלנו" או "בתוך חלון dedup". הקריאה ל-Stripe או שליחת המייל שלכם עדיין צריכים idempotency key.</blockquote>`
      }
    },
    {
      h: { en: "Idempotent consumers", he: "Consumers אידמפוטנטיים" },
      body: {
        en: `<p>An operation is <strong>idempotent</strong> if doing it twice has the same effect as doing it once. <code>SET balance = 100</code> is idempotent; <code>balance = balance + 10</code> is not. Techniques:</p>
<ul>
<li><strong>Processed-messages table</strong>: insert the message ID in the same DB transaction as the business change; a unique constraint rejects duplicates.</li>
<li><strong>Natural idempotency</strong>: upserts, "set status = SHIPPED where status = PAID" (conditional updates), PUT semantics.</li>
<li><strong>Downstream idempotency keys</strong>: pass a stable key (e.g. the message ID) to Stripe/your payment provider so the second charge returns the first result.</li>
</ul>
<pre>BEGIN;
INSERT INTO processed_messages(message_id) VALUES ('evt-91c2');  -- PK: dupes fail here
UPDATE accounts SET balance = balance + 10 WHERE id = 42;
COMMIT;
-- duplicate delivery -&gt; unique violation -&gt; rollback -&gt; just ack it</pre>
<blockquote>⚠️ Production tip: The dedup check and the side effect must be atomic. "Check Redis, then process, then write Redis" has a race window where two consumers both pass the check.</blockquote>`,
        he: `<p>פעולה היא <strong>אידמפוטנטית</strong> אם לבצע אותה פעמיים זה כמו לבצע אותה פעם אחת. <code>SET balance = 100</code> אידמפוטנטי; <code>balance = balance + 10</code> לא. טכניקות:</p>
<ul>
<li><strong>טבלת processed-messages</strong>: מכניסים את ה-message ID באותה טרנזקציה של השינוי העסקי; unique constraint דוחה כפילויות.</li>
<li><strong>אידמפוטנטיות טבעית</strong>: upserts, "set status = SHIPPED where status = PAID" (עדכונים מותנים), סמנטיקה של PUT.</li>
<li><strong>Idempotency keys כלפי downstream</strong>: מעבירים מפתח יציב (למשל ה-message ID) ל-Stripe/ספק התשלום כך שחיוב שני יחזיר את התוצאה של הראשון.</li>
</ul>
<pre>BEGIN;
INSERT INTO processed_messages(message_id) VALUES ('evt-91c2');  -- PK: dupes fail here
UPDATE accounts SET balance = balance + 10 WHERE id = 42;
COMMIT;
-- duplicate delivery -&gt; unique violation -&gt; rollback -&gt; just ack it</pre>
<blockquote>⚠️ טיפ לפרודקשן: הבדיקה של ה-dedup וה-side effect חייבים להיות אטומיים. "בודקים ב-Redis, מעבדים, כותבים ל-Redis" משאיר חלון של race שבו שני consumers עוברים את הבדיקה.</blockquote>`
      }
    },
    {
      h: { en: "DLQs, poison messages and backpressure", he: "DLQs, הודעות רעל ו-backpressure" },
      body: {
        en: `<p>A <strong>poison message</strong> always fails (malformed JSON, references a deleted user, triggers a bug). With at-least-once, it's redelivered forever, burning CPU and — in ordered queues — blocking everything behind it. Solution: a <strong>dead-letter queue (DLQ)</strong>. After N failed attempts, move it aside.</p>
<pre># SQS redrive policy: after 5 receives, move to DLQ
aws sqs set-queue-attributes --queue-url $Q --attributes '{
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:123456789012:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"}'</pre>
<p>A DLQ without an alarm is a black hole. Alert on DLQ depth &gt; 0, inspect, fix the bug, then <em>redrive</em> messages back.</p>
<p><strong>Backpressure</strong> is how a system says "slow down" instead of falling over. Queues absorb bursts (backlog grows, producers don't care) — but unbounded queues just move the problem to memory or disk. Options: bounded queues that reject/block producers (RabbitMQ <code>x-max-length</code>, flow control), consumer prefetch limits (<code>basic.qos prefetch=20</code>), and rate-limited producers.</p>
<blockquote>⚠️ Production tip: Retry transient errors with backoff (or a delay queue) but send non-retryable errors (validation failures) straight to the DLQ — retrying a 400 five times just delays the inevitable.</blockquote>`,
        he: `<p><strong>Poison message</strong> נכשלת תמיד (JSON פגום, מפנה למשתמש שנמחק, מפעילה באג). עם at-least-once היא נמסרת שוב ושוב לנצח, שורפת CPU ו — בתורים עם סדר — חוסמת את כל מה שמאחוריה. הפתרון: <strong>dead-letter queue (DLQ)</strong>. אחרי N ניסיונות כושלים, מזיזים אותה הצידה.</p>
<pre># SQS redrive policy: after 5 receives, move to DLQ
aws sqs set-queue-attributes --queue-url $Q --attributes '{
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:123456789012:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"}'</pre>
<p>DLQ בלי התראה זה חור שחור. מתריעים כשעומק ה-DLQ &gt; 0, בודקים, מתקנים את הבאג, ואז עושים <em>redrive</em> להודעות בחזרה.</p>
<p><strong>Backpressure</strong> זו הדרך של מערכת להגיד "תאטו" במקום לקרוס. Queues סופגים פרצי עומס (ה-backlog גדל, ל-producers לא אכפת) — אבל queues בלי גבול רק מזיזים את הבעיה לזיכרון או לדיסק. אפשרויות: queues חסומים שדוחים/חוסמים producers (<code>x-max-length</code> ב-RabbitMQ, flow control), הגבלת prefetch ל-consumer (<code>basic.qos prefetch=20</code>), ו-producers עם rate limit.</p>
<blockquote>⚠️ טיפ לפרודקשן: retry לשגיאות זמניות עם backoff (או delay queue), אבל שגיאות שלא שווה לנסות שוב (validation) — ישר ל-DLQ. לנסות 400 חמש פעמים רק דוחה את הבלתי נמנע.</blockquote>`
      }
    }
  ],
  diagram:
`producers                QUEUE (backlog)                    consumers (competing)
 [api] --send-->  | m7 | m6 | m5 | m4 | m3 |  --receive-->  [worker A]  process -> ack(delete)
 [cron]-send-->   +---------------------------+  --receive-->  [worker B]  crash! no ack
                        ^                                            |
                        |  visibility timeout expires: m3 reappears  |
                        +--------------------------------------------+
                  receiveCount > maxReceiveCount(5) ?  --> [ DLQ ] --> alarm, inspect, redrive`,
  handsOn: [
    { cmd: "docker run -d --name rmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management", what: { en: "Run RabbitMQ locally with its management UI at http://localhost:15672 (guest/guest) — watch Ready vs Unacked counts.", he: "מריצים RabbitMQ מקומית עם ממשק ניהול ב-http://localhost:15672 (guest/guest) — שימו לב ל-Ready מול Unacked." } },
    { cmd: "aws sqs get-queue-attributes --queue-url $Q --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible", what: { en: "Backlog vs in-flight. For 'how late is the oldest work', check the ApproximateAgeOfOldestMessage metric in CloudWatch.", he: "Backlog מול in-flight. בשביל 'כמה מאחרת העבודה הכי ישנה' — בודקים את המטריקה ApproximateAgeOfOldestMessage ב-CloudWatch." } },
    { cmd: "aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:123456789012:orders-dlq", what: { en: "Redrive messages from a DLQ back to their source queue after you've fixed the bug.", he: "מחזירים הודעות מה-DLQ לתור המקור אחרי שתיקנתם את הבאג." } },
    { cmd: "rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers", what: { en: "Spot a stuck consumer: messages_unacknowledged high and not moving = someone grabbed work and isn't finishing it.", he: "מזהים consumer תקוע: messages_unacknowledged גבוה ולא זז = מישהו לקח עבודה ולא מסיים אותה." } }
  ],
  mnemonic: {
    en: "\"Work, THEN ack. Twice is nice (if idempotent). Five strikes, DLQ.\"",
    he: "\"קודם עובדים, אחר כך ack. פעמיים זה בסדר (אם אידמפוטנטי). חמש פסילות — DLQ.\""
  },
  pitfalls: [
    { en: "Acking before processing 'for speed' — silently converts your system to at-most-once and loses messages on every crash or deploy.", he: "ack לפני העיבוד 'בשביל מהירות' — הופך בשקט את המערכת ל-at-most-once ומאבד הודעות בכל קריסה או deploy." },
    { en: "Visibility timeout shorter than processing time: the message reappears while still being processed, so two workers do it in parallel.", he: "Visibility timeout קצר מזמן העיבוד: ההודעה חוזרת בזמן שעדיין מעובדת, ושני workers עושים אותה במקביל." },
    { en: "A DLQ nobody watches. Weeks later you discover 40,000 failed orders sitting there — alert on depth > 0.", he: "DLQ שאף אחד לא מסתכל עליו. אחרי שבועות מגלים 40,000 הזמנות שנכשלו ויושבות שם — התראה על עומק > 0." },
    { en: "Autoscaling queue workers on CPU: I/O-bound workers sit at 10% CPU while the backlog explodes. Scale on depth or lag.", he: "Autoscaling ל-workers לפי CPU: workers שתלויים ב-I/O יושבים על 10% CPU בזמן שה-backlog מתפוצץ. עושים scale לפי עומק או lag." }
  ],
  interview: [
    {
      q: { en: "How do you guarantee a payment is charged exactly once when consuming from a queue?", he: "איך מבטיחים שתשלום יחויב בדיוק פעם אחת כשצורכים מ-queue?" },
      a: { en: "You can't get exactly-once delivery, so combine at-least-once delivery with idempotency: use a stable idempotency key (the message or order ID) when calling the payment provider, record processed IDs atomically with the state change (unique constraint), and use conditional state transitions (only charge if status = PENDING). Duplicates then become no-ops.", he: "אי אפשר לקבל exactly-once delivery, אז משלבים at-least-once עם אידמפוטנטיות: משתמשים ב-idempotency key יציב (ה-ID של ההודעה או ההזמנה) בקריאה לספק התשלום, רושמים IDs שעובדו באופן אטומי עם שינוי המצב (unique constraint), ומשתמשים במעברי מצב מותנים (מחייבים רק אם status = PENDING). כפילויות הופכות ל-no-op." }
    },
    {
      q: { en: "Your queue backlog is growing steadily. Walk through your investigation.", he: "ה-backlog בתור גדל בהתמדה. תעברו על החקירה." },
      a: { en: "Compare incoming rate vs processing rate. Did producers spike (campaign, retry storm upstream)? Did per-message processing time rise (slow DB, downstream latency)? Are consumers failing and redelivering (receive count, error logs, DLQ)? Are consumers actually running (crashloop, scaled to zero)? Short-term: scale consumers if the downstream can take it; long-term: fix the slow dependency or batch work.", he: "משווים קצב נכנס מול קצב עיבוד. ה-producers קפצו (קמפיין, retry storm מלמעלה)? זמן העיבוד להודעה עלה (DB איטי, latency של downstream)? consumers נכשלים ומקבלים שוב (receive count, לוגים של שגיאות, DLQ)? ה-consumers בכלל רצים (crashloop, scaled to zero)? בטווח הקצר: מוסיפים consumers אם ה-downstream עומד בזה; בטווח הארוך: מתקנים את התלות האיטית או עושים batching." }
    }
  ],
  quiz: [
    {
      q: { en: "A consumer processes a message, then crashes before acking. With at-least-once delivery, what happens?", he: "Consumer מעבד הודעה ואז קורס לפני ה-ack. עם at-least-once delivery, מה קורה?" },
      options: [
        { en: "The message is lost", he: "ההודעה אובדת" },
        { en: "The message is redelivered and processed again", he: "ההודעה נמסרת שוב ומעובדת שוב" },
        { en: "The broker detects the work was done and skips it", he: "ה-broker מזהה שהעבודה בוצעה ומדלג" },
        { en: "The message goes straight to the DLQ", he: "ההודעה עוברת ישר ל-DLQ" }
      ],
      answer: 1,
      explain: { en: "The broker only knows about acks. No ack = redelivery = duplicate processing, which is why consumers must be idempotent.", he: "ה-broker יודע רק על acks. אין ack = מסירה חוזרת = עיבוד כפול, ולכן consumers חייבים להיות אידמפוטנטיים." }
    },
    {
      q: { en: "Producers send 1,000 msg/s. You have 8 consumers at 100 msg/s each. After 10 minutes, the backlog is about:", he: "Producers שולחים 1,000 הודעות לשנייה. יש 8 consumers של 100 לשנייה כל אחד. אחרי 10 דקות ה-backlog הוא בערך:" },
      options: [
        { en: "0 — consumers keep up", he: "0 — ה-consumers עומדים בקצב" },
        { en: "12,000", he: "12,000" },
        { en: "120,000", he: "120,000" },
        { en: "600,000", he: "600,000" }
      ],
      answer: 2,
      explain: { en: "Net growth = 1000 - 800 = 200 msg/s x 600 s = 120,000 messages.", he: "גידול נטו = 1000 - 800 = 200 לשנייה x 600 שניות = 120,000 הודעות." }
    },
    {
      q: { en: "Which consumer operation is naturally idempotent?", he: "איזו פעולת consumer אידמפוטנטית באופן טבעי?" },
      options: [
        { en: "UPDATE stock SET qty = qty - 1 WHERE sku = 'A1'", he: "UPDATE stock SET qty = qty - 1 WHERE sku = 'A1'" },
        { en: "INSERT INTO emails_sent (...) with an auto-increment id", he: "INSERT INTO emails_sent (...) עם id של auto-increment" },
        { en: "UPDATE orders SET status = 'SHIPPED' WHERE id = 7 AND status = 'PAID'", he: "UPDATE orders SET status = 'SHIPPED' WHERE id = 7 AND status = 'PAID'" },
        { en: "Calling the payment API without any key", he: "קריאה ל-API של תשלומים בלי שום key" }
      ],
      answer: 2,
      explain: { en: "The conditional transition only succeeds once; a duplicate finds status already SHIPPED and changes nothing. Decrements and auto-ID inserts double-apply.", he: "המעבר המותנה מצליח רק פעם אחת; כפילות תמצא status שכבר SHIPPED ולא תשנה כלום. הפחתות ו-inserts עם auto-ID מתבצעים פעמיים." }
    },
    {
      q: { en: "What is the main purpose of a dead-letter queue?", he: "מה המטרה העיקרית של dead-letter queue?" },
      options: [
        { en: "Store messages that expired their TTL for billing purposes", he: "לשמור הודעות שה-TTL שלהן פג לצורכי חיוב" },
        { en: "Isolate messages that repeatedly fail so they stop blocking and burning resources", he: "לבודד הודעות שנכשלות שוב ושוב כדי שיפסיקו לחסום ולשרוף משאבים" },
        { en: "Guarantee exactly-once delivery", he: "להבטיח exactly-once delivery" },
        { en: "Speed up consumers by caching messages", he: "להאיץ consumers באמצעות cache של הודעות" }
      ],
      answer: 1,
      explain: { en: "DLQs park poison messages after N attempts so healthy traffic flows; you alert, debug and redrive them.", he: "DLQs מחנים הודעות רעל אחרי N ניסיונות כדי שהתעבורה הבריאה תזרום; מתריעים, מדבגים ועושים להן redrive." }
    }
  ],
  playground: "queue",
  related: ["arch-brokers", "arch-resilience", "arch-event-driven", "k8s-autoscaling"]
});


INFRA.lessons.push({
  id: "arch-brokers",
  track: "architecture",
  order: 5,
  icon: "📡",
  level: 3,
  minutes: 13,
  title: { en: "Message Brokers: RabbitMQ, Kafka & Cloud", he: "Message Brokers: RabbitMQ, Kafka והענן" },
  tldr: {
    en: "RabbitMQ is a smart post office that routes and deletes messages; Kafka is an append-only log you replay by offset; cloud services (SQS/SNS, Pub/Sub, Service Bus) trade knobs for zero ops.",
    he: "RabbitMQ הוא סניף דואר חכם שמנתב ומוחק הודעות; Kafka הוא log של append-only שמנגנים מחדש לפי offset; שירותי הענן (SQS/SNS, Pub/Sub, Service Bus) מוותרים על כפתורים בתמורה לאפס תפעול."
  },
  analogy: {
    en: "RabbitMQ is a post office: letters arrive, sorting clerks (exchanges) route them into mailboxes (queues) by address rules, and once you pick up your letter it's gone. Kafka is a newspaper archive: every edition is printed once and kept for weeks; each reader keeps a bookmark (offset) and can re-read from any day. SQS is a self-service locker you rent from Amazon — you don't care who runs the building.",
    he: "RabbitMQ זה סניף דואר: מכתבים מגיעים, פקידי מיון (exchanges) מנתבים אותם לתיבות (queues) לפי חוקי כתובת, וברגע שאספת את המכתב — הוא נעלם. Kafka זה ארכיון עיתונים: כל גיליון מודפס פעם אחת ונשמר שבועות; כל קורא מחזיק סימנייה (offset) ויכול לקרוא שוב מכל יום. SQS זה לוקר בשירות עצמי שאתה שוכר מאמזון — לא מעניין אותך מי מתחזק את הבניין."
  },
  sections: [
    {
      h: { en: "Three shapes: queue, pub/sub, stream", he: "שלוש צורות: queue, pub/sub, stream" },
      body: {
        en: `<ul>
<li><strong>Queue (point-to-point)</strong>: each message goes to <em>one</em> consumer among competitors, then is deleted. Use for distributing work: "resize this image". (SQS, RabbitMQ queue, Service Bus queue.)</li>
<li><strong>Pub/Sub (fan-out)</strong>: each message goes to <em>every</em> subscriber. Use for events many parties care about: "OrderPlaced" → email, analytics, inventory. (SNS, RabbitMQ fanout/topic exchange, Google Pub/Sub, Service Bus topics.)</li>
<li><strong>Stream (log)</strong>: messages are appended to a durable, ordered log and <em>retained</em> regardless of who read them. Each consumer group tracks its own position and can rewind. Use for event-driven backbones, replay, CDC, analytics pipelines. (Kafka, Kinesis, Event Hubs, Redpanda, Pulsar.)</li>
</ul>
<p>The key mental difference: a queue is a <strong>to-do list</strong> (done items disappear); a log is a <strong>history book</strong> (nothing disappears until retention expires).</p>
<blockquote>💡 Real world: The classic AWS combo is SNS topic → multiple SQS queues ("fan-out"). Each service gets its own durable queue with its own retries and DLQ, while the publisher sends once.</blockquote>`,
        he: `<ul>
<li><strong>Queue (point-to-point)</strong>: כל הודעה הולכת ל-consumer <em>אחד</em> מבין המתחרים ואז נמחקת. משמש לחלוקת עבודה: "תעשה resize לתמונה הזו". (SQS, queue ב-RabbitMQ, queue ב-Service Bus.)</li>
<li><strong>Pub/Sub (fan-out)</strong>: כל הודעה הולכת ל<em>כל</em> המנויים. משמש ל-events שהרבה גורמים צריכים: "OrderPlaced" → מייל, analytics, מלאי. (SNS, fanout/topic exchange ב-RabbitMQ, Google Pub/Sub, topics ב-Service Bus.)</li>
<li><strong>Stream (log)</strong>: הודעות נכתבות ל-log עמיד וממוין ו<em>נשמרות</em> לא משנה מי קרא אותן. כל consumer group עוקב אחרי המיקום שלו ויכול לחזור אחורה. משמש לשדרת events, replay, CDC, pipelines של analytics. (Kafka, Kinesis, Event Hubs, Redpanda, Pulsar.)</li>
</ul>
<p>ההבדל המנטלי החשוב: queue הוא <strong>רשימת משימות</strong> (מה שבוצע נמחק); log הוא <strong>ספר היסטוריה</strong> (שום דבר לא נמחק עד שה-retention פג).</p>
<blockquote>💡 מהשטח: הקומבו הקלאסי ב-AWS הוא SNS topic → כמה SQS queues ("fan-out"). כל service מקבל queue עמיד משלו עם retries ו-DLQ משלו, וה-publisher שולח פעם אחת.</blockquote>`
      }
    },
    {
      h: { en: "RabbitMQ: exchanges and routing", he: "RabbitMQ: exchanges ו-routing" },
      body: {
        en: `<p>In RabbitMQ (AMQP 0-9-1), producers never publish to a queue directly — they publish to an <strong>exchange</strong> with a <strong>routing key</strong>. <strong>Bindings</strong> connect exchanges to queues.</p>
<ul>
<li><strong>direct</strong>: routing key must match the binding key exactly (<code>pdf.render</code>).</li>
<li><strong>topic</strong>: wildcard patterns: <code>*</code> = one word, <code>#</code> = zero or more. Binding <code>order.*.eu</code> matches <code>order.created.eu</code>.</li>
<li><strong>fanout</strong>: ignore the key, copy to every bound queue.</li>
<li><strong>headers</strong>: match on message headers instead of the key.</li>
</ul>
<pre># bind a queue to all EU order events
rabbitmqadmin declare exchange name=orders type=topic durable=true
rabbitmqadmin declare queue name=eu-billing durable=true \\
  arguments='{"x-queue-type":"quorum","x-dead-letter-exchange":"dlx"}'
rabbitmqadmin declare binding source=orders destination=eu-billing routing_key="order.*.eu"</pre>
<p>Strengths: flexible routing, per-message acks, priorities, TTLs, low latency, great for task queues. Weaknesses: messages are deleted on ack (no replay — Streams add a log mode), throughput in the tens of thousands msg/s per queue rather than millions.</p>
<blockquote>⚠️ Production tip: Use <strong>quorum queues</strong> (Raft-replicated) for anything you care about; classic mirrored queues were removed in RabbitMQ 4.0. And keep queues short — RabbitMQ is happiest when queues are near-empty.</blockquote>`,
        he: `<p>ב-RabbitMQ (AMQP 0-9-1), producers אף פעם לא מפרסמים ישירות ל-queue — הם מפרסמים ל-<strong>exchange</strong> עם <strong>routing key</strong>. <strong>Bindings</strong> מחברים exchanges ל-queues.</p>
<ul>
<li><strong>direct</strong>: ה-routing key חייב להתאים בדיוק ל-binding key (<code>pdf.render</code>).</li>
<li><strong>topic</strong>: תבניות עם wildcards: <code>*</code> = מילה אחת, <code>#</code> = אפס או יותר. binding של <code>order.*.eu</code> תופס את <code>order.created.eu</code>.</li>
<li><strong>fanout</strong>: מתעלם מה-key, מעתיק לכל queue מחובר.</li>
<li><strong>headers</strong>: התאמה לפי headers של ההודעה במקום ה-key.</li>
</ul>
<pre># bind a queue to all EU order events
rabbitmqadmin declare exchange name=orders type=topic durable=true
rabbitmqadmin declare queue name=eu-billing durable=true \\
  arguments='{"x-queue-type":"quorum","x-dead-letter-exchange":"dlx"}'
rabbitmqadmin declare binding source=orders destination=eu-billing routing_key="order.*.eu"</pre>
<p>חוזקות: routing גמיש, ack לכל הודעה, priorities, TTLs, latency נמוך, מעולה ל-task queues. חולשות: הודעות נמחקות ב-ack (אין replay — Streams מוסיפים מצב log), throughput בעשרות אלפי הודעות לשנייה ל-queue ולא במיליונים.</p>
<blockquote>⚠️ טיפ לפרודקשן: תשתמשו ב-<strong>quorum queues</strong> (משוכפלים עם Raft) לכל דבר שחשוב לכם; classic mirrored queues הוסרו ב-RabbitMQ 4.0. ותשמרו על queues קצרים — RabbitMQ הכי מאושר כשהתורים כמעט ריקים.</blockquote>`
      }
    },
    {
      h: { en: "Kafka: log, partitions, offsets, consumer groups", he: "Kafka: log, partitions, offsets, consumer groups" },
      body: {
        en: `<p>A Kafka <strong>topic</strong> is split into <strong>partitions</strong>; each partition is an append-only log replicated to N brokers (typically <code>replication.factor=3</code>, <code>min.insync.replicas=2</code>, producer <code>acks=all</code>). Each record gets a sequential <strong>offset</strong>.</p>
<ul>
<li><strong>Keys decide partitions</strong>: <code>hash(key) % partitions</code>. Same key (e.g. <code>customerId</code>) → same partition → <strong>ordering is guaranteed per partition only</strong>, never across the whole topic.</li>
<li><strong>Consumer groups</strong>: each partition is assigned to exactly one consumer in a group. 12 partitions → max 12 active consumers per group; the 13th sits idle. Different groups read independently (billing and analytics each get everything).</li>
<li><strong>Offsets</strong>: consumers commit the offset they've processed. Commit after processing = at-least-once. Reset to an earlier offset = replay history.</li>
<li><strong>Retention</strong>: by time (<code>retention.ms</code>, default 7 days) or size; or <strong>log compaction</strong> to keep the latest value per key forever.</li>
</ul>
<pre>kafka-topics.sh --create --topic orders --partitions 12 --replication-factor 3 \\
  --config min.insync.replicas=2 --config retention.ms=604800000
kafka-consumer-groups.sh --describe --group billing   # shows LAG per partition</pre>
<blockquote>💡 Real world: Consumer <strong>lag</strong> (latest offset minus committed offset) is THE Kafka health metric. LinkedIn, where Kafka was born, pushes trillions of messages per day through it.</blockquote>`,
        he: `<p><strong>Topic</strong> ב-Kafka מחולק ל-<strong>partitions</strong>; כל partition הוא log של append-only שמשוכפל ל-N brokers (בדרך כלל <code>replication.factor=3</code>, <code>min.insync.replicas=2</code>, ו-<code>acks=all</code> ב-producer). כל רשומה מקבלת <strong>offset</strong> רץ.</p>
<ul>
<li><strong>ה-key קובע את ה-partition</strong>: <code>hash(key) % partitions</code>. אותו key (למשל <code>customerId</code>) → אותו partition → <strong>סדר מובטח רק בתוך partition</strong>, אף פעם לא על כל ה-topic.</li>
<li><strong>Consumer groups</strong>: כל partition משויך ל-consumer אחד בדיוק בתוך group. 12 partitions → מקסימום 12 consumers פעילים לכל group; ה-13 יושב בטל. groups שונים קוראים באופן עצמאי (billing ו-analytics מקבלים כל אחד את הכול).</li>
<li><strong>Offsets</strong>: consumers עושים commit ל-offset שעיבדו. commit אחרי עיבוד = at-least-once. איפוס ל-offset מוקדם יותר = replay של ההיסטוריה.</li>
<li><strong>Retention</strong>: לפי זמן (<code>retention.ms</code>, ברירת מחדל 7 ימים) או גודל; או <strong>log compaction</strong> ששומר לנצח את הערך האחרון לכל key.</li>
</ul>
<pre>kafka-topics.sh --create --topic orders --partitions 12 --replication-factor 3 \\
  --config min.insync.replicas=2 --config retention.ms=604800000
kafka-consumer-groups.sh --describe --group billing   # shows LAG per partition</pre>
<blockquote>💡 מהשטח: <strong>Lag</strong> של consumer (ה-offset האחרון פחות ה-offset שעשו לו commit) הוא מטריקת הבריאות של Kafka. ב-LinkedIn, שם Kafka נולד, עוברים דרכו טריליוני הודעות ביום.</blockquote>`
      }
    },
    {
      h: { en: "Cloud brokers and the comparison table", he: "Brokers בענן וטבלת ההשוואה" },
      body: {
        en: `<table>
<tr><th></th><th>RabbitMQ</th><th>Kafka</th><th>SQS / SNS</th><th>GCP Pub/Sub</th><th>Azure Service Bus</th></tr>
<tr><td>Model</td><td>Queue + routing</td><td>Partitioned log</td><td>Queue / fan-out topic</td><td>Pub/sub</td><td>Queue + topics</td></tr>
<tr><td>After consume</td><td>Deleted on ack</td><td>Retained (replay)</td><td>Deleted</td><td>Deleted (seek/snapshots possible)</td><td>Deleted</td></tr>
<tr><td>Ordering</td><td>Per queue (1 consumer)</td><td>Per partition</td><td>FIFO queues per group ID</td><td>With ordering keys</td><td>Sessions</td></tr>
<tr><td>Throughput</td><td>~10k–100k/s</td><td>Millions/s</td><td>Near-unlimited (standard)</td><td>Very high</td><td>High (Premium)</td></tr>
<tr><td>Ops burden</td><td>You run it</td><td>You run it (or MSK/Confluent)</td><td>Zero</td><td>Zero</td><td>Zero</td></tr>
</table>
<p>Rules of thumb: <strong>task queue / complex routing</strong> → RabbitMQ or SQS. <strong>Event backbone, replay, many independent readers, high volume</strong> → Kafka (or Kinesis/Event Hubs). <strong>On AWS and want boring</strong> → SNS+SQS. <strong>Enterprise .NET with sessions, transactions, scheduled messages</strong> → Service Bus.</p>
<blockquote>⚠️ Production tip: SQS FIFO is limited (300 msg/s per API action without batching, much more with high-throughput mode) and orders only within a MessageGroupId — choose group IDs like Kafka keys.</blockquote>`,
        he: `<table>
<tr><th></th><th>RabbitMQ</th><th>Kafka</th><th>SQS / SNS</th><th>GCP Pub/Sub</th><th>Azure Service Bus</th></tr>
<tr><td>מודל</td><td>Queue + routing</td><td>Log מחולק ל-partitions</td><td>Queue / topic ל-fan-out</td><td>Pub/sub</td><td>Queue + topics</td></tr>
<tr><td>אחרי צריכה</td><td>נמחק ב-ack</td><td>נשמר (replay)</td><td>נמחק</td><td>נמחק (אפשר seek/snapshots)</td><td>נמחק</td></tr>
<tr><td>סדר</td><td>לפי queue (consumer אחד)</td><td>לפי partition</td><td>FIFO queues לפי group ID</td><td>עם ordering keys</td><td>Sessions</td></tr>
<tr><td>Throughput</td><td>~10k–100k לשנייה</td><td>מיליונים לשנייה</td><td>כמעט בלי גבול (standard)</td><td>גבוה מאוד</td><td>גבוה (Premium)</td></tr>
<tr><td>עומס תפעולי</td><td>אתם מריצים</td><td>אתם מריצים (או MSK/Confluent)</td><td>אפס</td><td>אפס</td><td>אפס</td></tr>
</table>
<p>כללי אצבע: <strong>task queue / routing מורכב</strong> → RabbitMQ או SQS. <strong>שדרת events, replay, הרבה קוראים עצמאיים, נפח גבוה</strong> → Kafka (או Kinesis/Event Hubs). <strong>על AWS ורוצים משעמם</strong> → SNS+SQS. <strong>Enterprise ב-.NET עם sessions, טרנזקציות, scheduled messages</strong> → Service Bus.</p>
<blockquote>⚠️ טיפ לפרודקשן: SQS FIFO מוגבל (300 הודעות לשנייה לכל API action בלי batching, הרבה יותר במצב high-throughput) ושומר על סדר רק בתוך MessageGroupId — בחרו group IDs כמו שבוחרים keys ב-Kafka.</blockquote>`
      }
    }
  ],
  diagram:
`RabbitMQ:  producer --(key: order.created.eu)--> [topic exchange]
                                  |  binding "order.*.eu"   | binding "#"
                                  v                         v
                             [eu-billing q]            [audit q]   -> consumed & DELETED

Kafka topic "orders" (3 partitions), key = customerId
  P0: |0|1|2|3|4|5|6|7|   <- group "billing"   consumer A @ offset 6
  P1: |0|1|2|3|4|         <- group "billing"   consumer B @ offset 4
  P2: |0|1|2|3|4|5|       <- group "billing"   consumer C @ offset 2  (lag 3)
       group "analytics" reads the SAME partitions with its OWN offsets`,
  handsOn: [
    { cmd: "docker run -d --name kafka -p 9092:9092 apache/kafka:3.8.0", what: { en: "Start a single-node Kafka (KRaft mode, no ZooKeeper) for experiments.", he: "מרימים Kafka עם node אחד (מצב KRaft, בלי ZooKeeper) לניסויים." } },
    { cmd: "docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --property parse.key=true --property key.separator=:", what: { en: "Produce keyed messages (type cust1:hello). Same key always lands in the same partition.", he: "שולחים הודעות עם key (תקלידו cust1:hello). אותו key תמיד נוחת באותו partition." } },
    { cmd: "docker exec -it kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --reset-offsets --to-earliest --topic orders --execute", what: { en: "Replay: rewind a consumer group to the beginning (group must be stopped). Impossible with a classic queue.", he: "Replay: מחזירים consumer group להתחלה (ה-group חייב להיות עצור). בלתי אפשרי עם queue קלאסי." } },
    { cmd: "aws sns subscribe --topic-arn $TOPIC --protocol sqs --notification-endpoint $QUEUE_ARN", what: { en: "Wire the SNS→SQS fan-out: every message published to the topic lands in this queue too (queue policy must allow SNS).", he: "מחברים fan-out של SNS→SQS: כל הודעה שמתפרסמת ל-topic נוחתת גם ב-queue הזה (ה-queue policy צריך לאשר ל-SNS)." } }
  ],
  mnemonic: {
    en: "\"Rabbit Routes, Kafka Keeps.\" Rabbit is a post office (route, deliver, delete); Kafka is a library (append, keep, re-read by bookmark).",
    he: "\"Rabbit מנתב, Kafka שומר.\" Rabbit זה סניף דואר (מנתב, מוסר, מוחק); Kafka זה ספרייה (מוסיף, שומר, קורא שוב לפי סימנייה)."
  },
  pitfalls: [
    { en: "Expecting global ordering in Kafka. You only get order within a partition — key by the entity whose events must be ordered (orderId, accountId).", he: "לצפות לסדר גלובלי ב-Kafka. יש סדר רק בתוך partition — בוחרים key לפי הישות שה-events שלה חייבים להיות מסודרים (orderId, accountId)." },
    { en: "Too few partitions: they cap consumer parallelism per group, and increasing them later changes key→partition mapping, breaking ordering for existing keys.", he: "מעט מדי partitions: הם מגבילים את המקביליות של consumers בכל group, והגדלה בהמשך משנה את המיפוי key→partition ושוברת סדר ל-keys קיימים." },
    { en: "A hot key (one huge customer) pins one partition at 100% while others idle — consider compound keys or splitting that tenant.", he: "Hot key (לקוח ענק אחד) מקבע partition אחד על 100% בזמן שהשאר בטלים — שקלו keys מורכבים או פיצול של אותו tenant." },
    { en: "Using Kafka as a task queue with per-message retries: a single slow/poison record blocks its whole partition. You need retry topics + DLQ topics.", he: "להשתמש ב-Kafka כ-task queue עם retries לכל הודעה: רשומה איטית/רעילה אחת חוסמת את כל ה-partition. צריך retry topics ו-DLQ topics." }
  ],
  interview: [
    {
      q: { en: "You need all events for an order processed in order, but want high parallelism. How do you design the Kafka topic?", he: "צריך שכל ה-events של הזמנה יעובדו לפי הסדר, אבל רוצים מקביליות גבוהה. איך מתכננים את ה-topic ב-Kafka?" },
      a: { en: "Use orderId as the message key so all events of one order go to the same partition (ordered), while different orders spread across many partitions. Size partitions for peak parallelism (e.g. 24–48), run up to that many consumers per group, set acks=all with idempotent producers so retries don't reorder or duplicate.", he: "משתמשים ב-orderId בתור key, כך שכל ה-events של הזמנה אחת הולכים לאותו partition (מסודרים), והזמנות שונות מתפזרות על הרבה partitions. קובעים מספר partitions לפי המקביליות בשיא (למשל 24–48), מריצים עד כמה consumers כאלה לכל group, ומגדירים acks=all עם idempotent producer כדי ש-retries לא ישבשו סדר או ייצרו כפילויות." }
    },
    {
      q: { en: "Kafka vs RabbitMQ — how do you choose?", he: "Kafka מול RabbitMQ — איך בוחרים?" },
      a: { en: "RabbitMQ for task distribution, complex routing, per-message acks/priorities/TTLs and low-latency work queues where messages are done once consumed. Kafka for high-volume event streams that multiple independent consumers read, need replay or long retention, stream processing, or CDC. If you need both patterns, many companies run both.", he: "RabbitMQ לחלוקת משימות, routing מורכב, ack/priorities/TTL לכל הודעה ו-work queues עם latency נמוך, שבהן הודעה גמורה ברגע שנצרכה. Kafka ל-streams של events בנפח גבוה שהרבה consumers עצמאיים קוראים, שצריכים replay או retention ארוך, stream processing או CDC. אם צריך את שני הדפוסים — הרבה חברות מריצות את שניהם." }
    }
  ],
  quiz: [
    {
      q: { en: "A Kafka topic has 6 partitions. A consumer group has 10 consumers. How many actively consume?", he: "ל-topic ב-Kafka יש 6 partitions. ב-consumer group יש 10 consumers. כמה צורכים בפועל?" },
      options: [
        { en: "10 — Kafka splits partitions between them", he: "10 — Kafka מפצל partitions ביניהם" },
        { en: "6 — one per partition, 4 sit idle", he: "6 — אחד לכל partition, 4 יושבים בטלים" },
        { en: "1 — only the group leader consumes", he: "1 — רק ה-leader של ה-group צורך" },
        { en: "60 — each consumer reads every partition", he: "60 — כל consumer קורא כל partition" }
      ],
      answer: 1,
      explain: { en: "Within a group, a partition is owned by exactly one consumer. Extra consumers are standby until a rebalance.", he: "בתוך group, partition שייך ל-consumer אחד בדיוק. consumers עודפים הם standby עד rebalance." }
    },
    {
      q: { en: "Which RabbitMQ exchange type delivers a copy to every bound queue regardless of routing key?", he: "איזה סוג exchange ב-RabbitMQ מעביר עותק לכל queue מחובר בלי קשר ל-routing key?" },
      options: [
        { en: "direct", he: "direct" },
        { en: "topic with binding key '*'", he: "topic עם binding key '*'" },
        { en: "fanout", he: "fanout" },
        { en: "headers", he: "headers" }
      ],
      answer: 2,
      explain: { en: "fanout ignores the key. A topic binding of '*' only matches single-word keys; '#' would match all.", he: "fanout מתעלם מה-key. binding של '*' ב-topic תופס רק keys של מילה אחת; '#' היה תופס הכול." }
    },
    {
      q: { en: "A new analytics team wants to process the last 5 days of order events. Which system makes this trivial?", he: "צוות analytics חדש רוצה לעבד את ה-events של ההזמנות מ-5 הימים האחרונים. איזו מערכת הופכת את זה לטריוויאלי?" },
      options: [
        { en: "RabbitMQ classic queue", he: "Classic queue ב-RabbitMQ" },
        { en: "SQS standard queue", he: "SQS standard queue" },
        { en: "Kafka with 7-day retention", he: "Kafka עם retention של 7 ימים" },
        { en: "SNS topic", he: "SNS topic" }
      ],
      answer: 2,
      explain: { en: "Kafka retains records independent of consumption; a new consumer group can start from an offset 5 days back. Queues delete on consume; SNS doesn't store.", he: "Kafka שומר רשומות בלי קשר לצריכה; consumer group חדש יכול להתחיל מ-offset של לפני 5 ימים. queues מוחקים בצריכה; SNS לא שומר בכלל." }
    },
    {
      q: { en: "Where does Kafka guarantee message ordering?", he: "איפה Kafka מבטיח סדר הודעות?" },
      options: [
        { en: "Across the entire topic", he: "על כל ה-topic" },
        { en: "Within a single partition", he: "בתוך partition בודד" },
        { en: "Within a consumer group", he: "בתוך consumer group" },
        { en: "Nowhere — Kafka is unordered", he: "בשום מקום — Kafka לא מסודר" }
      ],
      answer: 1,
      explain: { en: "Offsets are per partition. Route related messages to the same partition via the key.", he: "Offsets הם לכל partition. מנתבים הודעות קשורות לאותו partition דרך ה-key." }
    }
  ],
  related: ["arch-queues", "arch-event-driven", "arch-sync-vs-async"]
});

INFRA.lessons.push({
  id: "arch-caching",
  track: "architecture",
  order: 6,
  icon: "⚡",
  level: 2,
  minutes: 12,
  title: { en: "Caching: Patterns, Eviction & Stampedes", he: "Caching: תבניות, Eviction ו-Stampedes" },
  tldr: {
    en: "A cache trades freshness for speed; the math of hit ratio decides if it's worth it, and invalidation decides if it's correct.",
    he: "Cache מחליף טריות במהירות; המתמטיקה של hit ratio קובעת אם זה משתלם, וה-invalidation קובע אם זה נכון."
  },
  analogy: {
    en: "A cache is the snack drawer in your desk. The supermarket (database) has everything but is a 20-minute trip; the drawer has a few things and takes 2 seconds. You restock it when it's empty (cache-aside), throw out what you haven't touched in ages (LRU), and check expiry dates (TTL). Cache stampede? That's the whole office discovering the drawer is empty at the same moment and all driving to the supermarket together.",
    he: "Cache זה מגירת החטיפים בשולחן. הסופר (database) יש בו הכול, אבל זה 20 דקות נסיעה; במגירה יש כמה דברים וזה 2 שניות. ממלאים אותה כשהיא מתרוקנת (cache-aside), זורקים את מה שלא נגעתם בו מלא זמן (LRU), ובודקים תאריכי תפוגה (TTL). Cache stampede? זה כל המשרד מגלה באותו רגע שהמגירה ריקה וכולם נוסעים ביחד לסופר."
  },
  sections: [
    {
      h: { en: "Hit ratio math: is the cache worth it?", he: "המתמטיקה של hit ratio: האם ה-cache שווה את זה?" },
      body: {
        en: `<p>Effective latency = <code>hit_ratio × cache_latency + (1 − hit_ratio) × (cache_latency + db_latency)</code>. Say Redis = 1 ms, DB query = 50 ms:</p>
<table>
<tr><th>Hit ratio</th><th>Avg latency</th><th>DB load (of 10k req/s)</th></tr>
<tr><td>0%</td><td>51 ms</td><td>10,000 q/s</td></tr>
<tr><td>80%</td><td>11 ms</td><td>2,000 q/s</td></tr>
<tr><td>95%</td><td>3.5 ms</td><td>500 q/s</td></tr>
<tr><td>99%</td><td>1.5 ms</td><td>100 q/s</td></tr>
</table>
<p>Notice the DB load column: going from 95% to 99% cuts DB traffic <strong>5x</strong>. That's why the last few percent of hit ratio matter so much — and why a cache flush or cold start can knock over a DB that was "fine" yesterday: the DB was only ever sized for the misses.</p>
<p>Caches pay off when data is <strong>read much more than written</strong>, has <strong>skewed popularity</strong> (top 1% of products get 50% of views), and is <strong>expensive to compute</strong>. Caching data that's read once is just extra latency.</p>
<blockquote>💡 Real world: Monitor <code>keyspace_hits / (keyspace_hits + keyspace_misses)</code> from Redis INFO. A sudden hit-ratio drop after a deploy usually means a changed cache key format.</blockquote>`,
        he: `<p>Latency אפקטיבי = <code>hit_ratio × cache_latency + (1 − hit_ratio) × (cache_latency + db_latency)</code>. נניח Redis = 1 ms, שאילתת DB = 50 ms:</p>
<table>
<tr><th>Hit ratio</th><th>Latency ממוצע</th><th>עומס על ה-DB (מתוך 10k req/s)</th></tr>
<tr><td>0%</td><td>51 ms</td><td>10,000 q/s</td></tr>
<tr><td>80%</td><td>11 ms</td><td>2,000 q/s</td></tr>
<tr><td>95%</td><td>3.5 ms</td><td>500 q/s</td></tr>
<tr><td>99%</td><td>1.5 ms</td><td>100 q/s</td></tr>
</table>
<p>שימו לב לעמודת העומס: מעבר מ-95% ל-99% מוריד את התעבורה ל-DB <strong>פי 5</strong>. בגלל זה האחוזים האחרונים של hit ratio כל כך חשובים — ובגלל זה flush ל-cache או cold start יכולים להפיל DB שהיה "בסדר" אתמול: ה-DB תמיד היה מתוכנן רק ל-misses.</p>
<p>Cache משתלם כשהדאטה <strong>נקרא הרבה יותר משנכתב</strong>, יש לו <strong>פופולריות מוטה</strong> (1% מהמוצרים מקבלים 50% מהצפיות), והוא <strong>יקר לחישוב</strong>. לשים ב-cache דאטה שנקרא פעם אחת — זה סתם עוד latency.</p>
<blockquote>💡 מהשטח: עוקבים אחרי <code>keyspace_hits / (keyspace_hits + keyspace_misses)</code> מתוך INFO של Redis. ירידה פתאומית ב-hit ratio אחרי deploy בדרך כלל אומרת שפורמט ה-cache key השתנה.</blockquote>`
      }
    },
    {
      h: { en: "Patterns: cache-aside, write-through, write-back", he: "תבניות: cache-aside, write-through, write-back" },
      body: {
        en: `<ul>
<li><strong>Cache-aside (lazy loading)</strong> — the default. App reads cache; on miss, reads DB and populates cache. On write, update DB then <em>delete</em> the cache key.</li>
<li><strong>Read-through</strong>: same, but the cache library loads from DB itself.</li>
<li><strong>Write-through</strong>: every write goes to cache and DB synchronously. Cache is always warm and fresh; writes are slower; you cache data that may never be read.</li>
<li><strong>Write-back (write-behind)</strong>: write to cache, flush to DB asynchronously in batches. Fastest writes, but a cache crash loses data. Used for counters/metrics, rarely for money.</li>
</ul>
<pre>def get_product(pid):
    key = f"product:v2:{pid}"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)                 # hit
    row = db.query("SELECT ... WHERE id=%s", pid) # miss
    redis.set(key, json.dumps(row), ex=300 + random.randint(0, 60))  # TTL + jitter
    return row

def update_product(pid, data):
    db.update(pid, data)
    redis.delete(f"product:v2:{pid}")              # invalidate, don't set</pre>
<blockquote>⚠️ Production tip: On write, <em>delete</em> the key instead of setting the new value. Two concurrent writers that both "set" can race and leave the older value in cache forever (until TTL).</blockquote>`,
        he: `<ul>
<li><strong>Cache-aside (lazy loading)</strong> — ברירת המחדל. האפליקציה קוראת מה-cache; ב-miss קוראת מה-DB וממלאת את ה-cache. בכתיבה: מעדכנים את ה-DB ואז <em>מוחקים</em> את ה-key.</li>
<li><strong>Read-through</strong>: אותו דבר, אבל ספריית ה-cache טוענת מה-DB בעצמה.</li>
<li><strong>Write-through</strong>: כל כתיבה הולכת ל-cache ול-DB באופן סינכרוני. ה-cache תמיד חם וטרי; כתיבות איטיות יותר; שומרים ב-cache דאטה שאולי אף פעם לא ייקרא.</li>
<li><strong>Write-back (write-behind)</strong>: כותבים ל-cache, ומשטפים ל-DB אסינכרונית ב-batches. הכתיבות הכי מהירות, אבל קריסה של ה-cache מאבדת דאטה. משמש ל-counters/מטריקות, כמעט אף פעם לא לכסף.</li>
</ul>
<pre>def get_product(pid):
    key = f"product:v2:{pid}"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)                 # hit
    row = db.query("SELECT ... WHERE id=%s", pid) # miss
    redis.set(key, json.dumps(row), ex=300 + random.randint(0, 60))  # TTL + jitter
    return row

def update_product(pid, data):
    db.update(pid, data)
    redis.delete(f"product:v2:{pid}")              # invalidate, don't set</pre>
<blockquote>⚠️ טיפ לפרודקשן: בכתיבה — <em>מוחקים</em> את ה-key במקום לכתוב את הערך החדש. שני writers במקביל שעושים "set" יכולים להיכנס ל-race ולהשאיר את הערך הישן ב-cache לנצח (עד ה-TTL).</blockquote>`
      }
    },
    {
      h: { en: "TTL, eviction and invalidation", he: "TTL, eviction ו-invalidation" },
      body: {
        en: `<p><em>"There are only two hard things in Computer Science: cache invalidation and naming things."</em> — Phil Karlton. Your options, from simple to hard:</p>
<ul>
<li><strong>TTL</strong>: data may be stale for at most TTL seconds. Pick it from the business: product description = 1 h, price = 60 s, stock count = maybe don't cache.</li>
<li><strong>Explicit invalidation</strong>: delete on write (cache-aside), or publish a change event (CDC/Kafka) that all cache owners consume.</li>
<li><strong>Versioned keys</strong>: <code>product:v2:42</code> or <code>user:42:ver17</code> — change the key and old entries simply age out.</li>
</ul>
<p>When memory fills, <strong>eviction</strong> kicks in. Redis <code>maxmemory-policy</code>: <code>allkeys-lru</code> (evict least recently used — the usual choice for a pure cache), <code>allkeys-lfu</code> (least frequently used — better for stable hot sets), <code>volatile-ttl</code>, or <code>noeviction</code> (writes fail — right for Redis-as-database, wrong for a cache).</p>
<pre>redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli INFO stats | grep -E "keyspace_(hits|misses)|evicted_keys"</pre>
<blockquote>⚠️ Production tip: Rising <code>evicted_keys</code> with falling hit ratio = your working set no longer fits. Add memory or shrink values before blaming the DB.</blockquote>`,
        he: `<p><em>"יש רק שני דברים קשים במדעי המחשב: cache invalidation ומתן שמות לדברים."</em> — Phil Karlton. האפשרויות, מהפשוט לקשה:</p>
<ul>
<li><strong>TTL</strong>: הדאטה יכול להיות לא עדכני לכל היותר TTL שניות. בוחרים אותו לפי הביזנס: תיאור מוצר = שעה, מחיר = 60 שניות, כמות במלאי = אולי בכלל לא ב-cache.</li>
<li><strong>Invalidation מפורש</strong>: מוחקים בכתיבה (cache-aside), או מפרסמים event של שינוי (CDC/Kafka) שכל מי שמחזיק cache צורך.</li>
<li><strong>Keys עם גרסה</strong>: <code>product:v2:42</code> או <code>user:42:ver17</code> — משנים את ה-key והרשומות הישנות פשוט מזדקנות ויוצאות.</li>
</ul>
<p>כשהזיכרון מתמלא, נכנס <strong>eviction</strong>. <code>maxmemory-policy</code> ב-Redis: <code>allkeys-lru</code> (מוציא את מה שהכי פחות היה בשימוש לאחרונה — הבחירה הרגילה ל-cache טהור), <code>allkeys-lfu</code> (הכי פחות תדיר — עדיף לסט חם ויציב), <code>volatile-ttl</code>, או <code>noeviction</code> (כתיבות נכשלות — נכון ל-Redis בתור database, לא נכון ל-cache).</p>
<pre>redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli INFO stats | grep -E "keyspace_(hits|misses)|evicted_keys"</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>evicted_keys</code> עולה ו-hit ratio יורד = ה-working set כבר לא נכנס. תוסיפו זיכרון או תקטינו ערכים לפני שמאשימים את ה-DB.</blockquote>`
      }
    },
    {
      h: { en: "Cache stampede / thundering herd", he: "Cache stampede / thundering herd" },
      body: {
        en: `<p>A hot key (homepage, 5,000 req/s) expires. In the ~200 ms it takes to recompute, <strong>~1,000 requests miss simultaneously</strong> and all hit the DB with the same expensive query. The DB slows, recompute takes longer, more requests pile up — classic <strong>thundering herd</strong>. Mass expiry (everything cached at deploy with TTL=3600) does the same an hour later.</p>
<ul>
<li><strong>Request coalescing / locking</strong>: only one caller recomputes (<code>SET lock:key 1 NX EX 10</code>); others wait briefly or serve stale. Go's <code>singleflight</code> does this in-process.</li>
<li><strong>Stale-while-revalidate</strong>: keep serving the old value while one worker refreshes in the background. CDNs support this via <code>Cache-Control: stale-while-revalidate=60</code>.</li>
<li><strong>Probabilistic early expiration</strong> (XFetch): each reader has a small, growing chance of refreshing before the TTL ends.</li>
<li><strong>TTL jitter</strong>: <code>ttl = 300 + rand(0..60)</code> so keys don't expire in sync.</li>
</ul>
<blockquote>💡 Real world: Facebook's memcache paper (2013) describes "leases" exactly for this: a miss hands out a lease token so only one client refills a key, and others wait a few ms and retry.</blockquote>`,
        he: `<p>Key חם (דף הבית, 5,000 req/s) פג תוקף. ב-~200 ms שלוקח לחשב אותו מחדש, <strong>~1,000 בקשות מפספסות בבת אחת</strong> וכולן פוגעות ב-DB עם אותה שאילתה יקרה. ה-DB מאט, החישוב לוקח יותר זמן, עוד בקשות נערמות — <strong>thundering herd</strong> קלאסי. פקיעה המונית (הכול נכנס ל-cache ב-deploy עם TTL=3600) עושה בדיוק את אותו הדבר שעה אחרי.</p>
<ul>
<li><strong>Request coalescing / locking</strong>: רק קורא אחד מחשב מחדש (<code>SET lock:key 1 NX EX 10</code>); האחרים מחכים רגע או מקבלים ערך ישן. <code>singleflight</code> של Go עושה את זה בתוך ה-process.</li>
<li><strong>Stale-while-revalidate</strong>: ממשיכים להגיש את הערך הישן בזמן ש-worker אחד מרענן ברקע. CDNs תומכים בזה עם <code>Cache-Control: stale-while-revalidate=60</code>.</li>
<li><strong>Probabilistic early expiration</strong> (XFetch): לכל קורא יש סיכוי קטן, שהולך וגדל, לרענן לפני שה-TTL נגמר.</li>
<li><strong>TTL jitter</strong>: <code>ttl = 300 + rand(0..60)</code> כדי שה-keys לא יפוגו ביחד.</li>
</ul>
<blockquote>💡 מהשטח: המאמר של Facebook על memcache (2013) מתאר "leases" בדיוק בשביל זה: miss מחלק lease token כך שרק לקוח אחד ממלא את ה-key, והשאר מחכים כמה ms ומנסים שוב.</blockquote>`
      }
    },
    {
      h: { en: "Redis vs Memcached (and where caches live)", he: "Redis מול Memcached (ואיפה caches יושבים)" },
      body: {
        en: `<table>
<tr><th></th><th>Redis / Valkey</th><th>Memcached</th></tr>
<tr><td>Data types</td><td>Strings, hashes, lists, sets, sorted sets, streams, HyperLogLog</td><td>Strings (blobs) only</td></tr>
<tr><td>Threads</td><td>Command execution single-threaded (I/O threads optional)</td><td>Multi-threaded</td></tr>
<tr><td>Persistence / replication</td><td>RDB/AOF, replicas, Sentinel, Cluster</td><td>None — pure cache</td></tr>
<tr><td>Extras</td><td>Pub/sub, Lua, locks, rate limiters, leaderboards</td><td>Simple, predictable, great for huge flat caches</td></tr>
</table>
<p>Pick <strong>Redis</strong> (or the Linux Foundation fork <strong>Valkey</strong>) by default — the data structures pay off. Pick <strong>Memcached</strong> for a giant, simple, multi-threaded blob cache.</p>
<p>Cache layers, from closest to farthest: browser cache → CDN (CloudFront, Cloudflare) → API gateway/reverse proxy cache → in-process cache (Caffeine, a Map with LRU: ~100 ns but per-instance and inconsistent between pods) → distributed cache (Redis: ~0.5–1 ms over the network) → DB buffer pool.</p>
<blockquote>⚠️ Production tip: Never make the cache a hard dependency. If Redis is down, fall back to the DB with a circuit breaker and rate limit — or you've turned a performance optimization into a single point of failure.</blockquote>`,
        he: `<table>
<tr><th></th><th>Redis / Valkey</th><th>Memcached</th></tr>
<tr><td>טיפוסי דאטה</td><td>Strings, hashes, lists, sets, sorted sets, streams, HyperLogLog</td><td>רק Strings (blobs)</td></tr>
<tr><td>Threads</td><td>הרצת פקודות single-threaded (I/O threads אופציונליים)</td><td>Multi-threaded</td></tr>
<tr><td>Persistence / replication</td><td>RDB/AOF, replicas, Sentinel, Cluster</td><td>אין — cache טהור</td></tr>
<tr><td>תוספות</td><td>Pub/sub, Lua, locks, rate limiters, leaderboards</td><td>פשוט, צפוי, מעולה ל-caches ענקיים ושטוחים</td></tr>
</table>
<p>ברירת מחדל: <strong>Redis</strong> (או ה-fork של Linux Foundation, <strong>Valkey</strong>) — מבני הנתונים מחזירים את ההשקעה. <strong>Memcached</strong> — ל-cache ענק, פשוט ו-multi-threaded של blobs.</p>
<p>שכבות cache, מהקרוב לרחוק: cache בדפדפן → CDN (CloudFront, Cloudflare) → cache ב-API gateway/reverse proxy → cache בתוך ה-process (Caffeine, Map עם LRU: ~100 ns אבל לכל instance בנפרד ולא עקבי בין pods) → cache מבוזר (Redis: ~0.5–1 ms ברשת) → ה-buffer pool של ה-DB.</p>
<blockquote>⚠️ טיפ לפרודקשן: לעולם אל תהפכו את ה-cache לתלות קשיחה. אם Redis נפל — fallback ל-DB עם circuit breaker ו-rate limit. אחרת הפכתם אופטימיזציית ביצועים ל-single point of failure.</blockquote>`
      }
    }
  ],
  diagram:
`CACHE-ASIDE                                 STAMPEDE (hot key expires)
 app --GET k--> [Redis]  hit? -> return       t=0  key expires
  |   miss                                    t+1ms   req1 miss -> DB
  +--SELECT--> [DB] --row--> app              t+2ms   req2 miss -> DB
  +--SET k EX 300+jitter--> [Redis]           ...     req1000 miss -> DB  (DB on fire)
 write: UPDATE DB, then DEL k                 fix: lock/singleflight, stale-while-revalidate`,
  handsOn: [
    { cmd: "docker run -d --name redis -p 6379:6379 redis:7 --maxmemory 50mb --maxmemory-policy allkeys-lru", what: { en: "Run Redis as a capped LRU cache — fill it past 50 MB and watch evicted_keys climb.", he: "מריצים Redis כ-cache מוגבל עם LRU — ממלאים מעבר ל-50 MB ורואים את evicted_keys מטפס." } },
    { cmd: "redis-cli SET product:v2:42 '{\"name\":\"mug\"}' EX 300 && redis-cli TTL product:v2:42", what: { en: "Set a key with a 5-minute TTL and check how long it has left.", he: "שומרים key עם TTL של 5 דקות ובודקים כמה זמן נשאר לו." } },
    { cmd: "redis-cli INFO stats | grep -E 'keyspace_hits|keyspace_misses|evicted_keys'", what: { en: "Compute your real hit ratio = hits / (hits + misses).", he: "מחשבים את ה-hit ratio האמיתי = hits / (hits + misses)." } },
    { cmd: "redis-cli --hotkeys", what: { en: "Find the hottest keys (requires an LFU maxmemory-policy) — your stampede candidates.", he: "מוצאים את ה-keys הכי חמים (דורש maxmemory-policy של LFU) — המועמדים ל-stampede." } }
  ],
  mnemonic: {
    en: "\"Read aside, write delete, jitter the expiry, one cook per miss.\"",
    he: "\"קוראים מהצד, בכתיבה מוחקים, מוסיפים jitter לתפוגה, טבח אחד לכל miss.\""
  },
  pitfalls: [
    { en: "Caching without a TTL 'because we invalidate on write' — one missed invalidation path and stale data lives forever.", he: "Cache בלי TTL 'כי אנחנו עושים invalidation בכתיבה' — מסלול invalidation אחד שנשכח ודאטה ישן חי לנצח." },
    { en: "Caching per-user or highly unique keys (search queries with timestamps) — near-0% hit ratio, pure overhead and memory churn.", he: "Cache ל-keys ייחודיים מאוד (חיפושים עם timestamps) — hit ratio קרוב ל-0%, תקורה טהורה ותחלופת זיכרון." },
    { en: "Flushing the whole cache during a deploy at peak traffic: the DB suddenly gets 10–100x its usual load. Warm up gradually or version keys.", he: "Flush לכל ה-cache בזמן deploy בשעת שיא: ה-DB פתאום מקבל פי 10–100 מהעומס הרגיל. מחממים בהדרגה או משתמשים ב-keys עם גרסה." },
    { en: "Caching negative results forgotten: repeated lookups for non-existent IDs always miss and hit the DB (cache penetration). Cache 'not found' briefly too.", he: "שוכחים לשמור תוצאות שליליות: חיפושים חוזרים ל-IDs שלא קיימים תמיד מפספסים ופוגעים ב-DB (cache penetration). שומרים גם 'לא נמצא' לזמן קצר." }
  ],
  interview: [
    {
      q: { en: "Your DB handles 10k QPS fine with a 95% cache hit ratio. What happens if the hit ratio drops to 80%?", he: "ה-DB שלכם מחזיק טוב 10k QPS עם cache hit ratio של 95%. מה קורה אם ה-hit ratio יורד ל-80%?" },
      a: { en: "DB load goes from 500 to 2,000 QPS — 4x — even though the hit ratio 'only' dropped 15 points. If the DB was sized for ~500 QPS, it saturates, latency climbs, and you may cascade into timeouts. Hence: alert on hit ratio, capacity-plan the DB for realistic miss rates, and protect it with rate limits and stampede protection.", he: "העומס על ה-DB עולה מ-500 ל-2,000 QPS — פי 4 — למרות שה-hit ratio ירד 'רק' ב-15 נקודות. אם ה-DB תוכנן ל-~500 QPS, הוא נחנק, ה-latency מטפס, ואפשר להתגלגל ל-timeouts בשרשרת. לכן: התראה על hit ratio, תכנון capacity ל-DB לפי שיעורי miss ריאליים, והגנה עליו עם rate limits והגנה מ-stampede." }
    },
    {
      q: { en: "Why delete the cache key on update instead of writing the new value?", he: "למה מוחקים את ה-key בעדכון במקום לכתוב את הערך החדש?" },
      a: { en: "Concurrent writers can interleave: A writes DB=1, B writes DB=2, B sets cache=2, A sets cache=1 — cache is now stale until TTL. Deleting makes the next reader load the current DB value. Small races remain (a reader can repopulate with an old read), which TTLs, versioning or delayed double-delete further reduce.", he: "Writers במקביל יכולים להשתלב: A כותב DB=1, B כותב DB=2, B שם cache=2, A שם cache=1 — ה-cache עכשיו ישן עד ה-TTL. מחיקה גורמת לקורא הבא לטעון את הערך הנוכחי מה-DB. נשארים races קטנים (קורא יכול למלא מחדש עם קריאה ישנה), ש-TTL, גרסאות או delayed double-delete מצמצמים עוד." }
    }
  ],
  quiz: [
    {
      q: { en: "Cache latency 1 ms, DB 50 ms, hit ratio 90%. Average read latency is roughly:", he: "Latency של cache הוא 1 ms, של DB הוא 50 ms, hit ratio של 90%. ה-latency הממוצע לקריאה הוא בערך:" },
      options: [
        { en: "1 ms", he: "1 ms" },
        { en: "6 ms", he: "6 ms" },
        { en: "25 ms", he: "25 ms" },
        { en: "45 ms", he: "45 ms" }
      ],
      answer: 1,
      explain: { en: "1 ms (always check cache) + 10% × 50 ms = 6 ms.", he: "1 ms (תמיד בודקים cache) + 10% × 50 ms = 6 ms." }
    },
    {
      q: { en: "Which Redis maxmemory-policy fits a pure cache best?", he: "איזה maxmemory-policy ב-Redis הכי מתאים ל-cache טהור?" },
      options: [
        { en: "noeviction", he: "noeviction" },
        { en: "allkeys-lru", he: "allkeys-lru" },
        { en: "volatile-lru with no TTLs set", he: "volatile-lru בלי TTLs מוגדרים" },
        { en: "Disable maxmemory entirely", he: "לבטל את maxmemory לגמרי" }
      ],
      answer: 1,
      explain: { en: "allkeys-lru evicts any key by recency. noeviction makes writes fail; volatile-* only evicts keys with TTLs; no maxmemory risks OOM.", he: "allkeys-lru מוציא כל key לפי זמן שימוש אחרון. noeviction גורם לכתיבות להיכשל; volatile-* מוציא רק keys עם TTL; בלי maxmemory מסתכנים ב-OOM." }
    },
    {
      q: { en: "A hot key expires and 2,000 requests hit the DB at once. Which fix targets this directly?", he: "Key חם פג ו-2,000 בקשות פוגעות ב-DB בבת אחת. איזה תיקון מטפל בזה ישירות?" },
      options: [
        { en: "Increase the DB connection pool", he: "להגדיל את ה-connection pool של ה-DB" },
        { en: "Switch from Redis to Memcached", he: "לעבור מ-Redis ל-Memcached" },
        { en: "Request coalescing / a recompute lock with stale-while-revalidate", he: "Request coalescing / lock לחישוב מחדש עם stale-while-revalidate" },
        { en: "Lower the TTL so data is fresher", he: "להוריד את ה-TTL כדי שהדאטה יהיה טרי יותר" }
      ],
      answer: 2,
      explain: { en: "Only one caller should recompute while others wait or get the stale value. A bigger pool just lets more duplicate queries hurt the DB; a lower TTL makes it happen more often.", he: "רק קורא אחד צריך לחשב מחדש בזמן שהשאר מחכים או מקבלים ערך ישן. pool גדול יותר רק מאפשר ליותר שאילתות כפולות לפגוע ב-DB; TTL נמוך יותר גורם לזה לקרות יותר." }
    }
  ],
  playground: "cache",
  related: ["arch-resilience", "arch-scaling", "db-replication"]
});

INFRA.lessons.push({
  id: "arch-resilience",
  track: "architecture",
  order: 7,
  icon: "🛡️",
  level: 3,
  minutes: 13,
  title: { en: "Resilience Patterns", he: "תבניות Resilience" },
  tldr: {
    en: "Fail fast (timeouts), retry politely (backoff + jitter), stop hammering the sick (circuit breaker), contain the blast (bulkheads), and degrade gracefully.",
    he: "נכשלים מהר (timeouts), מנסים שוב בנימוס (backoff + jitter), מפסיקים להכות את החולה (circuit breaker), מגבילים את רדיוס הפיצוץ (bulkheads), ומתדרדרים בחן."
  },
  analogy: {
    en: "Your house's electrical panel: each room has its own breaker (bulkhead) so a shorted toaster doesn't kill the fridge. The breaker trips when something's wrong (circuit breaker) instead of letting the wires melt, and you don't flip it back on 50 times per second — you wait, then try once (half-open). Timeouts are hanging up on a call that's just ringing; backoff with jitter is not having the entire neighborhood call the electric company at the exact same second after the outage.",
    he: "לוח החשמל בבית: לכל חדר יש מפסק משלו (bulkhead) כדי שטוסטר עם קצר לא יפיל את המקרר. המפסק קופץ כשמשהו לא בסדר (circuit breaker) במקום לתת לחוטים להימס, ואתם לא מרימים אותו בחזרה 50 פעם בשנייה — מחכים, ואז מנסים פעם אחת (half-open). Timeout זה לנתק שיחה שרק מצלצלת; backoff עם jitter זה שכל השכונה לא מתקשרת לחברת החשמל באותה שנייה בדיוק אחרי ההפסקה."
  },
  sections: [
    {
      h: { en: "Timeouts: the most underrated line of code", he: "Timeouts: שורת הקוד הכי לא מוערכת" },
      body: {
        en: `<p>Every network call needs a timeout. Without one, a slow dependency holds your threads/connections hostage; when the pool is exhausted, <em>your</em> service is down too — a <strong>cascading failure</strong>. Many defaults are terrifying: Python <code>requests</code> has no timeout by default; Java's HttpURLConnection defaults to infinite.</p>
<ul>
<li>Set <strong>connect</strong> timeout short (~100 ms–1 s inside a datacenter) and <strong>request</strong> timeout from the dependency's p99.9 plus margin (e.g. p99.9 = 250 ms → timeout 400 ms).</li>
<li>Use <strong>deadline propagation</strong>: if the user request has a 2 s budget and 1.5 s is spent, downstream calls get 500 ms, not their own fresh 2 s. gRPC does this natively with deadlines.</li>
</ul>
<pre>requests.get(url, timeout=(0.5, 2.0))           # (connect, read) seconds
ctx, cancel := context.WithTimeout(ctx, 400*time.Millisecond)  // Go
await fetch(url, { signal: AbortSignal.timeout(400) })        // JS</pre>
<blockquote>⚠️ Production tip: Outer timeouts must be longer than inner ones. Gateway 30 s → service 10 s → DB 5 s. If the gateway gives up at 5 s while the service still waits 10 s for the DB, you burn resources on answers nobody will receive.</blockquote>`,
        he: `<p>כל קריאת רשת צריכה timeout. בלי זה, dependency איטי מחזיק את ה-threads/connections שלכם כבני ערובה; כשה-pool נגמר — גם <em>השירות שלכם</em> למטה — <strong>cascading failure</strong>. הרבה ברירות מחדל מפחידות: ל-<code>requests</code> של Python אין timeout כברירת מחדל; ב-HttpURLConnection של Java ברירת המחדל היא אינסוף.</p>
<ul>
<li><strong>Connect</strong> timeout קצר (~100 ms–1 s בתוך datacenter), ו-<strong>request</strong> timeout לפי ה-p99.9 של ה-dependency פלוס מרווח (למשל p99.9 = 250 ms → timeout של 400 ms).</li>
<li><strong>Deadline propagation</strong>: אם לבקשת המשתמש יש תקציב של 2 שניות ו-1.5 כבר נוצלו, קריאות downstream מקבלות 500 ms, לא 2 שניות טריות משלהן. gRPC עושה את זה מובנה עם deadlines.</li>
</ul>
<pre>requests.get(url, timeout=(0.5, 2.0))           # (connect, read) seconds
ctx, cancel := context.WithTimeout(ctx, 400*time.Millisecond)  // Go
await fetch(url, { signal: AbortSignal.timeout(400) })        // JS</pre>
<blockquote>⚠️ טיפ לפרודקשן: timeouts חיצוניים חייבים להיות ארוכים מהפנימיים. Gateway 30 שניות → service 10 → DB 5. אם ה-gateway מוותר אחרי 5 שניות בזמן שה-service עדיין מחכה 10 ל-DB — שורפים משאבים על תשובות שאף אחד לא יקבל.</blockquote>`
      }
    },
    {
      h: { en: "Retries with exponential backoff + jitter", he: "Retries עם exponential backoff + jitter" },
      body: {
        en: `<p>Retries fix <em>transient</em> errors (connection reset, 503, 429, timeouts). But naive retries are a weapon: if a service is overloaded and every client retries 3 times immediately, load quadruples exactly when it can least afford it — a <strong>retry storm</strong>.</p>
<ul>
<li><strong>Exponential backoff</strong>: wait 100 ms, 200, 400, 800... capped (e.g. max 10 s, max 3–5 attempts).</li>
<li><strong>Jitter</strong>: randomize the wait so clients don't retry in synchronized waves. AWS's "full jitter": <code>sleep = random(0, min(cap, base × 2^attempt))</code>.</li>
<li>Only retry <strong>idempotent</strong> operations (or use idempotency keys). Never retry 400/401/403/404/422.</li>
<li>Honor <code>Retry-After</code> headers. Use a <strong>retry budget</strong> (e.g. retries ≤ 10% of requests) so retries can't amplify load.</li>
<li>Retry at <strong>one layer</strong> only. 3 layers × 3 attempts = 27x amplification.</li>
</ul>
<pre>def call_with_retry(fn, attempts=4, base=0.1, cap=5.0):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            time.sleep(random.uniform(0, min(cap, base * 2 ** i)))  # full jitter</pre>
<blockquote>💡 Real world: Many big outages are retry storms: a short blip, then synchronized clients hammer the recovering service until it falls again. Jitter and budgets turn a cliff into a slope.</blockquote>`,
        he: `<p>Retries מתקנים שגיאות <em>זמניות</em> (connection reset, 503, 429, timeouts). אבל retries נאיביים הם נשק: אם service עמוס וכל לקוח מנסה 3 פעמים מיד, העומס גדל פי 4 בדיוק ברגע שהכי פחות יכול להרשות את זה — <strong>retry storm</strong>.</p>
<ul>
<li><strong>Exponential backoff</strong>: מחכים 100 ms, 200, 400, 800... עם תקרה (למשל מקסימום 10 שניות, מקסימום 3–5 ניסיונות).</li>
<li><strong>Jitter</strong>: מגרילים את זמן ההמתנה כדי שלקוחות לא ינסו שוב בגלים מסונכרנים. ה-"full jitter" של AWS: <code>sleep = random(0, min(cap, base × 2^attempt))</code>.</li>
<li>עושים retry רק לפעולות <strong>אידמפוטנטיות</strong> (או עם idempotency keys). אף פעם לא retry ל-400/401/403/404/422.</li>
<li>מכבדים header של <code>Retry-After</code>. משתמשים ב-<strong>retry budget</strong> (למשל retries ≤ 10% מהבקשות) כדי ש-retries לא יוכלו להגביר עומס.</li>
<li>Retry רק ב<strong>שכבה אחת</strong>. 3 שכבות × 3 ניסיונות = הגברה פי 27.</li>
</ul>
<pre>def call_with_retry(fn, attempts=4, base=0.1, cap=5.0):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            time.sleep(random.uniform(0, min(cap, base * 2 ** i)))  # full jitter</pre>
<blockquote>💡 מהשטח: הרבה תקלות גדולות הן retry storms: תקלה קצרה, ואז לקוחות מסונכרנים מפציצים את השירות שמתאושש עד שהוא נופל שוב. Jitter ו-budgets הופכים צוק למדרון.</blockquote>`
      }
    },
    {
      h: { en: "Circuit breaker states", he: "המצבים של circuit breaker" },
      body: {
        en: `<p>A <strong>circuit breaker</strong> wraps calls to a dependency and tracks failures. Three states:</p>
<ul>
<li><strong>Closed</strong> (normal): calls pass through. If the failure rate exceeds a threshold (e.g. 50% of the last 20 calls, or slow calls &gt; 2 s), trip to Open.</li>
<li><strong>Open</strong>: calls fail <em>immediately</em> without touching the dependency (return fallback or error). This protects both you (no threads waiting) and the dependency (time to recover). After a wait (e.g. 30 s) → Half-Open.</li>
<li><strong>Half-Open</strong>: let a few trial calls through. Success → Closed. Failure → Open again.</li>
</ul>
<pre># Resilience4j (Spring Boot application.yml)
resilience4j.circuitbreaker.instances.pricing:
  slidingWindowSize: 20
  failureRateThreshold: 50
  slowCallDurationThreshold: 2s
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 3</pre>
<p>Libraries: Resilience4j (Java), Polly (.NET), opossum (Node), gobreaker (Go) — or at the mesh level (Istio outlier detection ejects bad hosts from the pool).</p>
<blockquote>⚠️ Production tip: Export breaker state as a metric and alert on it. A breaker that's been Open for an hour is an outage you're quietly hiding behind fallbacks.</blockquote>`,
        he: `<p><strong>Circuit breaker</strong> עוטף קריאות ל-dependency ועוקב אחרי כשלונות. שלושה מצבים:</p>
<ul>
<li><strong>Closed</strong> (רגיל): קריאות עוברות. אם שיעור הכשלונות עובר סף (למשל 50% מ-20 הקריאות האחרונות, או קריאות איטיות &gt; 2 שניות) — קופץ ל-Open.</li>
<li><strong>Open</strong>: קריאות נכשלות <em>מיד</em> בלי לגעת ב-dependency (מחזירים fallback או שגיאה). זה מגן גם עליכם (אין threads שמחכים) וגם על ה-dependency (זמן להתאושש). אחרי המתנה (למשל 30 שניות) → Half-Open.</li>
<li><strong>Half-Open</strong>: נותנים לכמה קריאות ניסיון לעבור. הצלחה → Closed. כשלון → חוזר ל-Open.</li>
</ul>
<pre># Resilience4j (Spring Boot application.yml)
resilience4j.circuitbreaker.instances.pricing:
  slidingWindowSize: 20
  failureRateThreshold: 50
  slowCallDurationThreshold: 2s
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 3</pre>
<p>ספריות: Resilience4j (Java), Polly (.NET), opossum (Node), gobreaker (Go) — או ברמת ה-mesh (outlier detection של Istio מוציא hosts בעייתיים מה-pool).</p>
<blockquote>⚠️ טיפ לפרודקשן: תייצאו את מצב ה-breaker כמטריקה ותתריעו עליו. breaker שנמצא ב-Open כבר שעה זו תקלה שאתם מסתירים בשקט מאחורי fallbacks.</blockquote>`
      }
    },
    {
      h: { en: "Bulkheads, rate limiting and the token bucket", he: "Bulkheads, rate limiting ו-token bucket" },
      body: {
        en: `<p><strong>Bulkheads</strong> (from ship compartments): isolate resources so one failing dependency can't sink everything. Separate thread/connection pools per dependency (20 threads for pricing, 20 for recommendations — if recommendations hangs, pricing still has its 20), separate node pools or clusters for critical vs batch workloads, per-tenant quotas.</p>
<p><strong>Rate limiting</strong> protects a service from its clients (including your own buggy ones). The <strong>token bucket</strong> is the classic algorithm:</p>
<ul>
<li>A bucket holds up to <strong>B</strong> tokens (burst size), refilled at <strong>R</strong> tokens/s.</li>
<li>Each request takes a token; empty bucket → reject with <code>429 Too Many Requests</code> + <code>Retry-After</code>.</li>
<li>Example R=10/s, B=50: a client can burst 50 requests instantly, then sustain 10/s.</li>
</ul>
<pre># NGINX: 10 r/s per client IP, burst of 20 served without delay
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ { limit_req zone=api burst=20 nodelay; limit_req_status 429; }</pre>
<p>Alternatives: leaky bucket (smooth constant outflow), fixed window (simple but allows 2x bursts at window edges), sliding window (accurate, a bit more state). Distributed limiters typically keep counters in Redis.</p>
<blockquote>💡 Real world: Stripe's API publicly documents its use of token-bucket rate limiters plus a separate "load shedder" that drops low-priority traffic first when the whole fleet is under stress.</blockquote>`,
        he: `<p><strong>Bulkheads</strong> (מהתאים האטומים באונייה): מבודדים משאבים כך ש-dependency אחד שנכשל לא יטביע את הכול. thread/connection pools נפרדים לכל dependency (20 threads ל-pricing, 20 ל-recommendations — אם recommendations נתקע, ל-pricing עדיין יש את ה-20 שלו), node pools או clusters נפרדים לעומסים קריטיים מול batch, quotas לכל tenant.</p>
<p><strong>Rate limiting</strong> מגן על service מהלקוחות שלו (כולל אלה שלכם, עם הבאגים). <strong>Token bucket</strong> הוא האלגוריתם הקלאסי:</p>
<ul>
<li>דלי מחזיק עד <strong>B</strong> tokens (גודל ה-burst), ומתמלא בקצב של <strong>R</strong> tokens לשנייה.</li>
<li>כל בקשה לוקחת token; דלי ריק → דוחים עם <code>429 Too Many Requests</code> + <code>Retry-After</code>.</li>
<li>דוגמה R=10/s, B=50: לקוח יכול לשלוח 50 בקשות בבת אחת, ואז להחזיק 10 לשנייה.</li>
</ul>
<pre># NGINX: 10 r/s per client IP, burst of 20 served without delay
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ { limit_req zone=api burst=20 nodelay; limit_req_status 429; }</pre>
<p>חלופות: leaky bucket (יציאה חלקה וקבועה), fixed window (פשוט אבל מאפשר bursts כפולים בקצוות החלון), sliding window (מדויק, קצת יותר state). limiters מבוזרים בדרך כלל מחזיקים counters ב-Redis.</p>
<blockquote>💡 מהשטח: Stripe מתעדים בפומבי שימוש ב-rate limiters מסוג token bucket ובנוסף "load shedder" שזורק קודם תעבורה בעדיפות נמוכה כשכל הצי בלחץ.</blockquote>`
      }
    },
    {
      h: { en: "Graceful degradation and idempotency keys", he: "Graceful degradation ו-idempotency keys" },
      body: {
        en: `<p><strong>Graceful degradation</strong>: decide in advance what the product does when a dependency is down. Recommendations down → show bestsellers from a static list. Reviews down → hide the reviews widget. Personalized pricing down → show list price. The checkout should never fail because the "people also bought" carousel timed out. Label each dependency <em>critical</em> or <em>optional</em>; optional ones get tight timeouts and fallbacks.</p>
<p><strong>Load shedding</strong>: when overloaded, reject early (cheap 503) rather than accept everything and time out on all of it. Serve 80% of users well instead of 100% badly.</p>
<p><strong>Idempotency keys</strong> make retries safe for non-idempotent operations like "create payment". The client generates a unique key per logical operation and sends it with every retry; the server stores key → result and returns the stored result on repeats.</p>
<pre>curl https://api.stripe.com/v1/payment_intents \\
  -u sk_test_xxx: \\
  -H "Idempotency-Key: 8e03978e-40d5-43e8-bc93-6894a57f9324" \\
  -d amount=2000 -d currency=usd
# retrying with the same key returns the SAME PaymentIntent, no double charge</pre>
<blockquote>⚠️ Production tip: Generate the idempotency key once, <em>before</em> the first attempt, and persist it with the pending operation — generating a fresh UUID inside the retry loop defeats the purpose.</blockquote>`,
        he: `<p><strong>Graceful degradation</strong>: מחליטים מראש מה המוצר עושה כש-dependency נופל. recommendations למטה → מציגים רבי-מכר מרשימה סטטית. reviews למטה → מסתירים את הווידג'ט. תמחור מותאם אישית למטה → מציגים מחיר מחירון. ה-checkout לעולם לא אמור להיכשל כי הקרוסלה של "אנשים קנו גם" עשתה timeout. מסמנים כל dependency כ-<em>critical</em> או <em>optional</em>; ל-optional יש timeouts הדוקים ו-fallbacks.</p>
<p><strong>Load shedding</strong>: בעומס יתר, דוחים מוקדם (503 זול) במקום לקבל הכול ולעשות timeout על הכול. עדיף לשרת 80% מהמשתמשים טוב מאשר 100% רע.</p>
<p><strong>Idempotency keys</strong> הופכים retries לבטוחים לפעולות לא-אידמפוטנטיות כמו "צור תשלום". הלקוח מייצר key ייחודי לכל פעולה לוגית ושולח אותו בכל retry; השרת שומר key → תוצאה ומחזיר את התוצאה השמורה בחזרות.</p>
<pre>curl https://api.stripe.com/v1/payment_intents \\
  -u sk_test_xxx: \\
  -H "Idempotency-Key: 8e03978e-40d5-43e8-bc93-6894a57f9324" \\
  -d amount=2000 -d currency=usd
# retrying with the same key returns the SAME PaymentIntent, no double charge</pre>
<blockquote>⚠️ טיפ לפרודקשן: מייצרים את ה-idempotency key פעם אחת, <em>לפני</em> הניסיון הראשון, ושומרים אותו עם הפעולה הממתינה — לייצר UUID חדש בתוך לולאת ה-retry מפספס את כל העניין.</blockquote>`
      }
    }
  ],
  diagram:
`CIRCUIT BREAKER
            failure rate > 50%
  +--------+ ----------------> +------+
  | CLOSED |                   | OPEN |  calls fail fast (fallback)
  +--------+ <--+              +------+
      ^         | trial ok        | wait 30s
      |     +-----------+ <-------+
      +-----| HALF-OPEN |--- trial fails ---> back to OPEN
            +-----------+

BACKOFF + FULL JITTER (base 100ms)       TOKEN BUCKET (R=10/s, B=50)
 try1 x  sleep rand(0..100ms)             [oooooooooo...] tokens
 try2 x  sleep rand(0..200ms)              +10/s refill -> bucket -> 1 token/request
 try3 x  sleep rand(0..400ms)              empty -> 429 + Retry-After
 try4 ok`,
  handsOn: [
    { cmd: "for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/; done; echo", what: { en: "Fire a burst at an NGINX limit_req endpoint: the first ~burst+1 succeed, then 429s appear.", he: "יורים burst על endpoint עם limit_req של NGINX: בערך burst+1 הראשונות מצליחות ואז מופיעים 429." } },
    { cmd: "python3 -c \"import random;[print(i, round(random.uniform(0,min(5,0.1*2**i)),3)) for i in range(8)]\"", what: { en: "Print full-jitter backoff delays per attempt — see how they spread out instead of syncing.", he: "מדפיסים את זמני ה-backoff עם full jitter לכל ניסיון — רואים איך הם מתפזרים במקום להסתנכרן." } },
    { cmd: "curl -s localhost:8080/actuator/circuitbreakers | jq", what: { en: "Inspect Resilience4j breaker states (CLOSED/OPEN/HALF_OPEN) and failure rates in a Spring Boot app.", he: "בודקים את מצבי ה-breaker של Resilience4j (CLOSED/OPEN/HALF_OPEN) ואת שיעורי הכשלון באפליקציית Spring Boot." } },
    { cmd: "toxiproxy-cli toxic add -t latency -a latency=3000 redis_proxy", what: { en: "Inject 3 s latency between your app and Redis with Toxiproxy — then verify your timeouts and fallbacks actually fire.", he: "מזריקים latency של 3 שניות בין האפליקציה ל-Redis עם Toxiproxy — ומוודאים שה-timeouts וה-fallbacks באמת עובדים." } }
  ],
  mnemonic: {
    en: "\"TRaCe BuLGe\": Timeouts, Retries (with jitter), Circuit breakers, Bulkheads, Limits (rate), Graceful degradation — plus idempotency keys to make it all safe.",
    he: "\"TRaCe BuLGe\": Timeouts, Retries (עם jitter), Circuit breakers, Bulkheads, Limits (rate), Graceful degradation — ועוד idempotency keys כדי שכל זה יהיה בטוח."
  },
  pitfalls: [
    { en: "Retrying non-idempotent POSTs without an idempotency key — the 'timeout' may have succeeded server-side, and now you've charged twice.", he: "Retry ל-POST לא-אידמפוטנטי בלי idempotency key — ה-'timeout' אולי הצליח בצד השרת, ועכשיו חייבתם פעמיים." },
    { en: "Exponential backoff without jitter: thousands of clients still retry at exactly 100, 200, 400 ms — synchronized waves.", he: "Exponential backoff בלי jitter: אלפי לקוחות עדיין מנסים שוב בדיוק ב-100, 200, 400 ms — גלים מסונכרנים." },
    { en: "A fallback that calls another fragile dependency (or the same DB) — your safety net has the same hole.", he: "Fallback שקורא ל-dependency שביר אחר (או לאותו DB) — לרשת הביטחון יש את אותו חור." },
    { en: "Never testing failure paths. Fallbacks and breakers that never ran in production often don't work — use chaos/fault injection in staging.", he: "אף פעם לא לבדוק מסלולי כשלון. fallbacks ו-breakers שמעולם לא רצו בפרודקשן בדרך כלל לא עובדים — chaos/fault injection ב-staging." }
  ],
  interview: [
    {
      q: { en: "A downstream service starts timing out. Walk through what each resilience pattern does to protect your service.", he: "service ב-downstream מתחיל לעשות timeouts. תסבירו מה כל תבנית resilience עושה כדי להגן על השירות שלכם." },
      a: { en: "Timeouts cap how long each call holds a thread. Retries with jittered backoff absorb brief blips without synchronized storms, within a retry budget. The circuit breaker sees the failure rate climb, opens, and fails fast so threads aren't wasted and the dependency can recover; half-open probes later. Bulkheads ensure only that dependency's pool is affected. Graceful degradation serves a fallback, and rate limiting/load shedding keep the remaining capacity for critical traffic.", he: "Timeouts מגבילים כמה זמן כל קריאה מחזיקה thread. Retries עם backoff ו-jitter סופגים תקלות קצרות בלי סערות מסונכרנות, בתוך retry budget. ה-circuit breaker רואה את שיעור הכשלונות עולה, נפתח ונכשל מהר כדי ש-threads לא יתבזבזו וה-dependency יוכל להתאושש; אחר כך half-open בודק. Bulkheads מבטיחים שרק ה-pool של אותו dependency נפגע. Graceful degradation מגיש fallback, ו-rate limiting/load shedding שומרים את הקיבולת שנשארה לתעבורה קריטית." }
    },
    {
      q: { en: "Explain the token bucket. How would you implement a limit of 100 req/min per API key across 20 gateway instances?", he: "תסבירו token bucket. איך תממשו מגבלה של 100 בקשות לדקה לכל API key על פני 20 instances של gateway?" },
      a: { en: "A bucket of capacity B refills at rate R; each request consumes a token or is rejected with 429. Across 20 instances, local buckets would allow 20x the limit, so keep state centrally — e.g. a Redis key per API key updated atomically with a Lua script (or INCR with EXPIRE for a fixed window), accepting a ~1 ms Redis hop. Alternatively, split the budget per instance if approximate limits are fine.", he: "דלי בקיבולת B מתמלא בקצב R; כל בקשה צורכת token או נדחית עם 429. עם 20 instances, דליים מקומיים יאפשרו פי 20 מהמגבלה, אז מחזיקים state מרכזי — למשל key ב-Redis לכל API key שמתעדכן אטומית עם סקריפט Lua (או INCR עם EXPIRE ל-fixed window), ומקבלים hop של ~1 ms ל-Redis. לחלופין, מחלקים את התקציב בין ה-instances אם מגבלה מקורבת מספיקה." }
    }
  ],
  quiz: [
    {
      q: { en: "A circuit breaker is OPEN. What happens to a new call?", he: "Circuit breaker נמצא ב-OPEN. מה קורה לקריאה חדשה?" },
      options: [
        { en: "It is queued until the dependency recovers", he: "היא נכנסת לתור עד שה-dependency מתאושש" },
        { en: "It fails immediately (or returns a fallback) without calling the dependency", he: "היא נכשלת מיד (או מחזירה fallback) בלי לקרוא ל-dependency" },
        { en: "It is retried with exponential backoff", he: "מנסים אותה שוב עם exponential backoff" },
        { en: "It goes through as a trial call", he: "היא עוברת כקריאת ניסיון" }
      ],
      answer: 1,
      explain: { en: "Open = fail fast. Trial calls only happen in HALF-OPEN after the wait duration.", he: "Open = נכשלים מהר. קריאות ניסיון קורות רק ב-HALF-OPEN אחרי זמן ההמתנה." }
    },
    {
      q: { en: "Why add jitter to exponential backoff?", he: "למה מוסיפים jitter ל-exponential backoff?" },
      options: [
        { en: "To make retries faster on average", he: "כדי ש-retries יהיו מהירים יותר בממוצע" },
        { en: "To prevent many clients from retrying in synchronized waves", he: "כדי למנוע מהרבה לקוחות לנסות שוב בגלים מסונכרנים" },
        { en: "To make non-idempotent operations safe to retry", he: "כדי להפוך פעולות לא-אידמפוטנטיות לבטוחות ל-retry" },
        { en: "To bypass the server's rate limiter", he: "כדי לעקוף את ה-rate limiter של השרת" }
      ],
      answer: 1,
      explain: { en: "Without jitter, clients that failed together retry together. Idempotency needs keys, not jitter.", he: "בלי jitter, לקוחות שנכשלו ביחד מנסים שוב ביחד. אידמפוטנטיות דורשת keys, לא jitter." }
    },
    {
      q: { en: "Token bucket with refill 5 tokens/s and capacity 20, initially full. A client sends 30 requests instantly. How many succeed?", he: "Token bucket עם מילוי של 5 tokens לשנייה וקיבולת 20, מלא בהתחלה. לקוח שולח 30 בקשות בבת אחת. כמה מצליחות?" },
      options: [
        { en: "5", he: "5" },
        { en: "20", he: "20" },
        { en: "25", he: "25" },
        { en: "30", he: "30" }
      ],
      answer: 1,
      explain: { en: "The burst is limited by the bucket capacity (20); the remaining 10 get 429 until tokens refill at 5/s.", he: "ה-burst מוגבל לקיבולת הדלי (20); 10 הנותרות מקבלות 429 עד שה-tokens מתמלאים בקצב 5 לשנייה." }
    },
    {
      q: { en: "Recommendations service hangs and exhausts a shared thread pool, taking down checkout. Which pattern would have prevented this most directly?", he: "שירות ה-recommendations נתקע ומרוקן thread pool משותף, ומפיל את ה-checkout. איזו תבנית הייתה מונעת את זה הכי ישירות?" },
      options: [
        { en: "Bulkheads — separate pools per dependency", he: "Bulkheads — pools נפרדים לכל dependency" },
        { en: "More retries on the recommendations call", he: "יותר retries על הקריאה ל-recommendations" },
        { en: "A longer timeout on recommendations", he: "Timeout ארוך יותר ל-recommendations" },
        { en: "Write-back caching", he: "Write-back caching" }
      ],
      answer: 0,
      explain: { en: "Bulkheads isolate the blast radius. More retries and longer timeouts make thread exhaustion worse.", he: "Bulkheads מבודדים את רדיוס הפיצוץ. יותר retries ו-timeouts ארוכים יותר רק מחמירים את ריקון ה-threads." }
    }
  ],
  related: ["arch-api-gateway", "arch-sync-vs-async", "arch-queues", "rel-sli-slo-sla"]
});


INFRA.lessons.push({
  id: "arch-scaling",
  track: "architecture",
  order: 8,
  icon: "📈",
  level: 2,
  minutes: 12,
  title: { en: "Scaling: Up, Out and the Scale Cube", he: "Scaling: למעלה, לרוחב וה-Scale Cube" },
  tldr: {
    en: "Scale up until it hurts, then scale out — which only works if your services are stateless and your data layer can keep up.",
    he: "עושים scale up עד שזה כואב, ואז scale out — וזה עובד רק אם השירותים stateless ושכבת הדאטה עומדת בקצב."
  },
  analogy: {
    en: "A popular falafel stand. Vertical scaling: hire a faster, more expensive cook with a bigger fryer — easy, but there's a limit to how fast one human can roll balls. Horizontal scaling: open five identical stands — but it only works if any stand can serve any customer (stateless), which means nobody's half-eaten order lives in a specific cook's head. And no matter how many stands you open, if they all share one pita supplier (the database), the pita truck is your new bottleneck.",
    he: "דוכן פלאפל פופולרי. Vertical scaling: מגייסים טבח מהיר ויקר יותר עם מטגנת גדולה יותר — קל, אבל יש גבול לכמה מהר בן אדם אחד יכול לגלגל כדורים. Horizontal scaling: פותחים חמישה דוכנים זהים — אבל זה עובד רק אם כל דוכן יכול לשרת כל לקוח (stateless), כלומר שום הזמנה חצי-גמורה לא יושבת בראש של טבח מסוים. וכמה דוכנים שלא תפתחו, אם כולם חולקים ספק פיתות אחד (ה-database) — משאית הפיתות היא צוואר הבקבוק החדש."
  },
  sections: [
    {
      h: { en: "Vertical vs horizontal", he: "Vertical מול horizontal" },
      body: {
        en: `<p><strong>Vertical scaling (scale up)</strong>: a bigger machine. From 4 vCPU/16 GB to 96 vCPU/768 GB is a few clicks on AWS (and some downtime for a resize). No code changes, no distributed-systems problems. Limits: there's a biggest instance, price grows faster than linearly at the top, and it's still a single point of failure.</p>
<p><strong>Horizontal scaling (scale out)</strong>: more machines behind a load balancer. Near-linear capacity growth, fault tolerance (lose 1 of 10 pods = lose 10% capacity, not 100%), and cheap commodity instances. Cost: the app must be stateless, you need load balancing, and the data layer becomes the hard part.</p>
<blockquote>💡 Real world: Don't underestimate scale-up. Stack Overflow famously served billions of page views a month from a handful of big SQL Server and web boxes. A single modern Postgres on a large instance with NVMe handles tens of thousands of simple queries per second — profile before you shard.</blockquote>
<p>Typical path: scale up the DB, scale out the stateless app tier, add caching and read replicas, and only then partition data.</p>`,
        he: `<p><strong>Vertical scaling (scale up)</strong>: מכונה גדולה יותר. מ-4 vCPU/16 GB ל-96 vCPU/768 GB זה כמה קליקים ב-AWS (וקצת downtime לשינוי הגודל). בלי שינויי קוד, בלי בעיות של מערכות מבוזרות. מגבלות: יש instance הכי גדול, המחיר בקצה העליון עולה מהר יותר מליניארי, וזה עדיין single point of failure.</p>
<p><strong>Horizontal scaling (scale out)</strong>: יותר מכונות מאחורי load balancer. גידול קיבולת כמעט ליניארי, עמידות לתקלות (מאבדים pod אחד מתוך 10 = מאבדים 10% קיבולת, לא 100%), ו-instances זולים. המחיר: האפליקציה חייבת להיות stateless, צריך load balancing, ושכבת הדאטה הופכת לחלק הקשה.</p>
<blockquote>💡 מהשטח: אל תזלזלו ב-scale up. Stack Overflow הגישו מיליארדי צפיות בחודש מקומץ שרתי SQL Server ו-web גדולים. Postgres מודרני אחד על instance גדול עם NVMe מחזיק עשרות אלפי שאילתות פשוטות לשנייה — תעשו profiling לפני sharding.</blockquote>
<p>המסלול הטיפוסי: scale up ל-DB, scale out לשכבת האפליקציה ה-stateless, מוסיפים caching ו-read replicas, ורק אז מחלקים את הדאטה.</p>`
      }
    },
    {
      h: { en: "Stateless services and sessions out of process", he: "שירותים stateless ו-sessions מחוץ ל-process" },
      body: {
        en: `<p>A <strong>stateless</strong> service keeps no client-specific state in memory or on local disk between requests. Any instance can serve any request, so you can add, kill, or replace instances freely — the prerequisite for autoscaling, rolling deploys and spot instances.</p>
<p>Where state goes instead:</p>
<ul>
<li><strong>Sessions</strong> → Redis/Memcached (<code>connect-redis</code>, Spring Session), or a signed/encrypted token (JWT) the client carries.</li>
<li><strong>Uploaded files</strong> → object storage (S3, GCS, Azure Blob), not <code>/tmp</code> on the pod.</li>
<li><strong>Scheduled jobs / locks</strong> → a DB or Redis-based lock, or a separate singleton worker — not "the cron that runs on instance #1".</li>
<li><strong>In-memory caches</strong> → fine as an optimization, never as the source of truth.</li>
</ul>
<pre>// Express: sessions in Redis instead of process memory
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 3600000 }
}));</pre>
<blockquote>⚠️ Production tip: Sticky sessions (LB affinity) are a crutch: they create uneven load, and when that pod dies or scales in, its users are logged out. Use them only as a temporary bridge while you move state out.</blockquote>`,
        he: `<p>Service <strong>stateless</strong> לא מחזיק state ספציפי ללקוח בזיכרון או בדיסק מקומי בין בקשות. כל instance יכול לשרת כל בקשה, אז אפשר להוסיף, להרוג או להחליף instances בחופשיות — תנאי בסיס ל-autoscaling, rolling deploys ו-spot instances.</p>
<p>לאן ה-state הולך במקום:</p>
<ul>
<li><strong>Sessions</strong> → Redis/Memcached (<code>connect-redis</code>, Spring Session), או token חתום/מוצפן (JWT) שהלקוח מחזיק.</li>
<li><strong>קבצים שהועלו</strong> → object storage (S3, GCS, Azure Blob), לא <code>/tmp</code> על ה-pod.</li>
<li><strong>Scheduled jobs / locks</strong> → lock מבוסס DB או Redis, או worker יחיד נפרד — לא "ה-cron שרץ על instance מספר 1".</li>
<li><strong>Caches בזיכרון</strong> → בסדר כאופטימיזציה, אף פעם לא כמקור האמת.</li>
</ul>
<pre>// Express: sessions in Redis instead of process memory
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 3600000 }
}));</pre>
<blockquote>⚠️ טיפ לפרודקשן: Sticky sessions (affinity ב-LB) הם קביים: הם יוצרים עומס לא אחיד, וכשה-pod הזה מת או יורד ב-scale in — המשתמשים שלו מתנתקים. משתמשים בהם רק כגשר זמני בזמן שמוציאים את ה-state החוצה.</blockquote>`
      }
    },
    {
      h: { en: "Scaling the data layer: replicas and partitioning", he: "Scaling לשכבת הדאטה: replicas ו-partitioning" },
      body: {
        en: `<p>Stateless app tiers scale easily; the database is where scaling gets real.</p>
<ul>
<li><strong>Read replicas</strong>: the primary streams its WAL/binlog to replicas; route reads there. Great for read-heavy workloads (typical web apps are 80–95% reads). Catch: <strong>replication lag</strong> (ms to seconds) — a user who just updated their profile may read the old value from a replica. Fix with "read-your-writes": route that user's reads to the primary for a few seconds after a write.</li>
<li><strong>Partitioning / sharding</strong>: split data by a key (<code>tenant_id</code>, <code>user_id</code>) across independent databases, each with its own write capacity. Hard parts: choosing the shard key, cross-shard queries and transactions, rebalancing, hot shards.</li>
<li><strong>Connection pooling</strong> (PgBouncer, RDS Proxy): 200 pods × 20 connections = 4,000 Postgres connections — far beyond what one Postgres handles well. A pooler multiplexes them.</li>
</ul>
<blockquote>💡 Real world: Before sharding, exhaust the cheap options in order: indexes and query fixes → caching → read replicas → bigger instance → archive old data → functional split (move one domain's tables to its own DB) → shard.</blockquote>`,
        he: `<p>שכבות אפליקציה stateless גדלות בקלות; ה-database הוא המקום שבו ה-scaling נהיה רציני.</p>
<ul>
<li><strong>Read replicas</strong>: ה-primary מזרים את ה-WAL/binlog ל-replicas; מנתבים לשם קריאות. מעולה לעומסים עם הרבה קריאות (אפליקציות web טיפוסיות הן 80–95% קריאות). המלכודת: <strong>replication lag</strong> (מילישניות עד שניות) — משתמש שהרגע עדכן פרופיל עלול לקרוא את הערך הישן מ-replica. פתרון: "read-your-writes" — מנתבים את הקריאות של אותו משתמש ל-primary לכמה שניות אחרי כתיבה.</li>
<li><strong>Partitioning / sharding</strong>: מחלקים דאטה לפי key (<code>tenant_id</code>, <code>user_id</code>) על פני databases עצמאיים, לכל אחד קיבולת כתיבה משלו. החלקים הקשים: בחירת ה-shard key, שאילתות וטרנזקציות חוצות-shards, rebalancing, hot shards.</li>
<li><strong>Connection pooling</strong> (PgBouncer, RDS Proxy): 200 pods × 20 connections = 4,000 חיבורים ל-Postgres — הרבה מעבר למה ש-Postgres אחד מחזיק טוב. pooler עושה להם multiplexing.</li>
</ul>
<blockquote>💡 מהשטח: לפני sharding, ממצים את האופציות הזולות לפי הסדר: indexes ותיקוני שאילתות → caching → read replicas → instance גדול יותר → ארכוב דאטה ישן → פיצול פונקציונלי (מעבירים את הטבלאות של דומיין אחד ל-DB משלו) → sharding.</blockquote>`
      }
    },
    {
      h: { en: "The scale cube and Amdahl's limits", he: "ה-Scale Cube והמגבלות של Amdahl" },
      body: {
        en: `<p>The <strong>Scale Cube</strong> (from "The Art of Scalability", Abbott &amp; Fisher) gives three axes:</p>
<ul>
<li><strong>X-axis — clone</strong>: N identical copies behind a load balancer. Easy, but every copy needs all the data.</li>
<li><strong>Y-axis — split by function</strong>: different services for different jobs (orders, search, billing). This is microservices.</li>
<li><strong>Z-axis — split by data</strong>: same code, each instance handles a subset of data (shard by customer, by region). Also great for blast-radius isolation ("cell-based architecture").</li>
</ul>
<p><strong>Amdahl's law</strong>: if a fraction <em>s</em> of the work is serial, max speedup = <code>1 / (s + (1−s)/N)</code>. With 5% serial work, even infinite servers give at most <strong>20x</strong>. In systems, the "serial part" is the shared thing everyone waits on: a single DB primary, a global lock, a single Kafka partition, one hot row (<code>UPDATE counters SET n = n + 1 WHERE id = 1</code>). The Universal Scalability Law adds coordination cost — beyond a point, adding nodes makes throughput <em>go down</em>.</p>
<blockquote>⚠️ Production tip: Before adding pods, find the shared bottleneck. If p99 rises while pod CPU is at 30%, more pods will just queue harder on the DB pool or the lock.</blockquote>`,
        he: `<p>ה-<strong>Scale Cube</strong> (מהספר "The Art of Scalability" של Abbott ו-Fisher) נותן שלושה צירים:</p>
<ul>
<li><strong>ציר X — שכפול</strong>: N עותקים זהים מאחורי load balancer. קל, אבל כל עותק צריך את כל הדאטה.</li>
<li><strong>ציר Y — פיצול לפי פונקציה</strong>: שירותים שונים לעבודות שונות (orders, search, billing). זה microservices.</li>
<li><strong>ציר Z — פיצול לפי דאטה</strong>: אותו קוד, כל instance מטפל בתת-קבוצה של הדאטה (shard לפי לקוח, לפי אזור). מעולה גם לבידוד רדיוס פיצוץ ("cell-based architecture").</li>
</ul>
<p><strong>חוק Amdahl</strong>: אם חלק <em>s</em> מהעבודה הוא סדרתי, ה-speedup המקסימלי = <code>1 / (s + (1−s)/N)</code>. עם 5% עבודה סדרתית, גם אינסוף שרתים יתנו לכל היותר <strong>פי 20</strong>. במערכות, "החלק הסדרתי" הוא הדבר המשותף שכולם מחכים לו: primary יחיד של DB, lock גלובלי, partition בודד של Kafka, שורה חמה אחת (<code>UPDATE counters SET n = n + 1 WHERE id = 1</code>). ה-Universal Scalability Law מוסיף עלות תיאום — מעבר לנקודה מסוימת, הוספת nodes גורמת ל-throughput <em>לרדת</em>.</p>
<blockquote>⚠️ טיפ לפרודקשן: לפני שמוסיפים pods, מוצאים את צוואר הבקבוק המשותף. אם ה-p99 עולה בזמן שה-CPU של ה-pods על 30%, עוד pods רק יעמדו בתור צפוף יותר על ה-DB pool או על ה-lock.</blockquote>`
      }
    },
    {
      h: { en: "Autoscaling in practice", he: "Autoscaling בפועל" },
      body: {
        en: `<p>Autoscaling adds/removes instances based on a signal. Good signals track <em>load</em>: CPU for CPU-bound services, requests per second per pod, queue depth/lag for workers, p95 latency as a guardrail. Kubernetes HPA, AWS Auto Scaling groups, KEDA for event sources.</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 40
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }</pre>
<p>Remember the <strong>reaction time</strong>: metric scrape (15–30 s) + HPA loop (15 s) + pod scheduling + image pull + app startup + readiness — often 1–3 minutes, longer if a new node is needed. Traffic that doubles in 30 seconds will hurt before autoscaling helps. So: keep headroom (target 60%, not 90%), set a sane <code>minReplicas</code>, pre-scale for known events (marketing pushes, Black Friday), and make startup fast.</p>
<blockquote>⚠️ Production tip: Always set <code>maxReplicas</code> with the database in mind. Autoscaling the app from 10 to 100 pods during a spike can exhaust DB connections and turn a slowdown into an outage.</blockquote>`,
        he: `<p>Autoscaling מוסיף/מוריד instances לפי סיגנל. סיגנלים טובים עוקבים אחרי <em>עומס</em>: CPU לשירותים שתלויים ב-CPU, בקשות לשנייה לכל pod, עומק תור/lag ל-workers, ו-p95 latency כמעקה בטיחות. Kubernetes HPA, AWS Auto Scaling groups, KEDA למקורות events.</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 40
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }</pre>
<p>זכרו את <strong>זמן התגובה</strong>: scrape של מטריקה (15–30 שניות) + לולאת HPA (15 שניות) + scheduling ל-pod + image pull + עליית האפליקציה + readiness — בדרך כלל 1–3 דקות, יותר אם צריך node חדש. תעבורה שמכפילה את עצמה ב-30 שניות תכאב לפני שה-autoscaling יעזור. אז: משאירים מרווח (target של 60%, לא 90%), <code>minReplicas</code> הגיוני, pre-scale לאירועים ידועים (קמפיינים, Black Friday), ועלייה מהירה של האפליקציה.</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד מגדירים <code>maxReplicas</code> עם ה-database בראש. autoscaling של האפליקציה מ-10 ל-100 pods בזמן spike יכול לגמור את ה-connections של ה-DB ולהפוך האטה ל-outage.</blockquote>`
      }
    }
  ],
  diagram:
`              THE SCALE CUBE
        Y: split by function (services)
        ^
        |   orders / search / billing
        |
        +------------> X: clone (N identical copies behind LB)
       /
      v
     Z: split by data (shard by customer / region / cell)

 AMDAHL: speedup(N) = 1 / (s + (1-s)/N)      s = 5% serial
   N=10 -> 6.9x   N=100 -> 16.8x   N=inf -> 20x   (the DB primary is your 's')`,
  handsOn: [
    { cmd: "kubectl get hpa -w", what: { en: "Watch the HPA's current vs target metric and replica count change live during a load test.", he: "צופים ב-HPA — המטריקה הנוכחית מול ה-target ומספר ה-replicas משתנים בזמן אמת בזמן load test." } },
    { cmd: "hey -z 60s -c 200 http://localhost:8080/api/products", what: { en: "Generate 60 s of load with 200 concurrent clients — find the point where adding pods stops helping.", he: "מייצרים 60 שניות של עומס עם 200 לקוחות במקביל — מוצאים את הנקודה שבה עוד pods כבר לא עוזרים." } },
    { cmd: "psql -c \"SELECT client_addr, state, count(*) FROM pg_stat_activity GROUP BY 1,2 ORDER BY 3 DESC;\"", what: { en: "Count DB connections per client/state — the hidden ceiling when the app tier scales out.", he: "סופרים חיבורי DB לפי לקוח/מצב — התקרה הנסתרת כששכבת האפליקציה עושה scale out." } },
    { cmd: "python3 -c \"s=0.05;[print(n, round(1/(s+(1-s)/n),1)) for n in (1,2,4,10,50,100,1000)]\"", what: { en: "Compute Amdahl speedups for 5% serial work — see the curve flatten toward 20x.", he: "מחשבים speedup לפי Amdahl עם 5% עבודה סדרתית — רואים את העקומה משתטחת לכיוון פי 20." } }
  ],
  mnemonic: {
    en: "\"Up is easy, Out needs Stateless, Data is the Dragon.\" And the cube: X = clone, Y = why (by function), Z = zone (by data).",
    he: "\"Up זה קל, Out דורש Stateless, הדאטה הוא הדרקון.\" וה-cube: X = שכפול, Y = לפי פונקציה, Z = לפי דאטה (zone)."
  },
  pitfalls: [
    { en: "Storing sessions or uploads in pod memory/disk — works with 1 replica, randomly logs users out or loses files with 3.", he: "לשמור sessions או uploads בזיכרון/דיסק של ה-pod — עובד עם replica אחד, ועם 3 מנתק משתמשים באקראי או מאבד קבצים." },
    { en: "Scaling the app tier while the DB is the bottleneck: more pods = more connections = more lock contention = slower.", he: "Scaling לשכבת האפליקציה כשה-DB הוא צוואר הבקבוק: יותר pods = יותר connections = יותר lock contention = יותר איטי." },
    { en: "Reading from replicas right after writing without considering replication lag — 'I saved it but it's gone!' bug reports.", he: "קריאה מ-replicas מיד אחרי כתיבה בלי לחשוב על replication lag — דיווחי באג של 'שמרתי והוא נעלם!'." },
    { en: "Autoscaling on CPU for an I/O-bound or queue-driven workload — CPU never rises, so nothing scales while latency or backlog explodes.", he: "Autoscaling לפי CPU לעומס שתלוי ב-I/O או בתור — ה-CPU אף פעם לא עולה, אז שום דבר לא גדל בזמן שה-latency או ה-backlog מתפוצצים." }
  ],
  interview: [
    {
      q: { en: "Your stateless API is at 30% CPU on 20 pods, but p99 latency doubles at peak. Adding pods doesn't help. What's going on?", he: "ה-API ה-stateless שלכם על 30% CPU ב-20 pods, אבל ה-p99 latency מוכפל בשיא. הוספת pods לא עוזרת. מה קורה?" },
      a: { en: "A shared bottleneck downstream — Amdahl's serial fraction. Likely suspects: DB connection pool exhaustion, lock contention on hot rows, a slow downstream dependency, or a single partition/queue. Check pool wait time, DB CPU and locks, trace waterfalls. Fix the bottleneck (pooler, query/index fixes, caching, read replicas, removing the hot row) rather than adding more pods.", he: "צוואר בקבוק משותף ב-downstream — החלק הסדרתי של Amdahl. חשודים סבירים: connection pool של ה-DB שנגמר, lock contention על שורות חמות, dependency איטי, או partition/queue בודד. בודקים זמן המתנה ל-pool, CPU ו-locks ב-DB, trace waterfalls. מתקנים את צוואר הבקבוק (pooler, תיקוני שאילתות/indexes, caching, read replicas, הורדת השורה החמה) במקום להוסיף pods." }
    },
    {
      q: { en: "Explain the three axes of the scale cube with an example.", he: "תסבירו את שלושת הצירים של ה-scale cube עם דוגמה." },
      a: { en: "X: run 10 identical copies of the e-commerce app behind an LB. Y: split it into catalog, cart and payment services that scale independently. Z: shard customers so EU customers live on cell A and US customers on cell B, each running the full stack on a subset of data. Real systems combine all three.", he: "X: מריצים 10 עותקים זהים של אפליקציית ה-e-commerce מאחורי LB. Y: מפצלים אותה ל-catalog, cart ו-payment שגדלים כל אחד בנפרד. Z: עושים sharding ללקוחות כך שלקוחות EU יושבים על cell A ולקוחות US על cell B, כל אחד מריץ את כל ה-stack על תת-קבוצה של הדאטה. מערכות אמיתיות משלבות את שלושתם." }
    }
  ],
  quiz: [
    {
      q: { en: "What makes a service horizontally scalable?", he: "מה הופך service לניתן ל-horizontal scaling?" },
      options: [
        { en: "It runs on the largest available instance type", he: "הוא רץ על ה-instance הכי גדול שיש" },
        { en: "Any instance can serve any request because no client state lives in-process", he: "כל instance יכול לשרת כל בקשה כי שום state של לקוח לא נמצא בתוך ה-process" },
        { en: "It uses sticky sessions on the load balancer", he: "הוא משתמש ב-sticky sessions ב-load balancer" },
        { en: "It caches everything in local memory", he: "הוא שומר הכול ב-cache בזיכרון המקומי" }
      ],
      answer: 1,
      explain: { en: "Statelessness is the prerequisite. Sticky sessions and local state are workarounds that limit scaling and failover.", he: "Stateless הוא תנאי הבסיס. sticky sessions ו-state מקומי הם מעקפים שמגבילים scaling ו-failover." }
    },
    {
      q: { en: "10% of request work is serialized on a single DB primary. Per Amdahl, the max speedup from adding app servers is:", he: "10% מהעבודה של כל בקשה עוברת באופן סדרתי דרך primary יחיד של DB. לפי Amdahl, ה-speedup המקסימלי מהוספת שרתי אפליקציה הוא:" },
      options: [
        { en: "Unlimited — just add servers", he: "בלי גבול — פשוט מוסיפים שרתים" },
        { en: "10x", he: "פי 10" },
        { en: "90x", he: "פי 90" },
        { en: "2x", he: "פי 2" }
      ],
      answer: 1,
      explain: { en: "1 / s = 1 / 0.10 = 10x as N → ∞.", he: "1 / s = 1 / 0.10 = פי 10 כש-N שואף לאינסוף." }
    },
    {
      q: { en: "Sharding customers across databases by customer_id is which axis of the scale cube?", he: "Sharding של לקוחות על פני databases לפי customer_id הוא איזה ציר של ה-scale cube?" },
      options: [
        { en: "X-axis (cloning)", he: "ציר X (שכפול)" },
        { en: "Y-axis (functional split)", he: "ציר Y (פיצול פונקציונלי)" },
        { en: "Z-axis (data partitioning)", he: "ציר Z (חלוקת דאטה)" },
        { en: "Vertical scaling", he: "Vertical scaling" }
      ],
      answer: 2,
      explain: { en: "Z = same code, different subset of data per instance.", he: "Z = אותו קוד, תת-קבוצה אחרת של דאטה לכל instance." }
    }
  ],
  playground: "scaling",
  related: ["net-load-balancing", "k8s-autoscaling", "db-replication", "db-sharding", "arch-caching"]
});

INFRA.lessons.push({
  id: "arch-event-driven",
  track: "architecture",
  order: 9,
  icon: "🎯",
  level: 3,
  minutes: 14,
  title: { en: "Event-Driven Architecture: Sourcing, CQRS, Sagas & Outbox", he: "ארכיטקטורה מונחית events: Sourcing, CQRS, Sagas ו-Outbox" },
  tldr: {
    en: "Events announce facts that already happened; build workflows from them with sagas, publish them reliably with an outbox, and accept that the world becomes eventually consistent.",
    he: "Events מכריזים על עובדות שכבר קרו; בונים מהם תהליכים עם sagas, מפרסמים אותם באמינות עם outbox, ומקבלים שהעולם הופך ל-eventually consistent."
  },
  analogy: {
    en: "A command is your boss saying 'Book the flight' — one recipient, it can be refused. An event is the company-wide announcement 'Dana got promoted!' — it already happened, and HR, payroll and the office party planner each react in their own way without the announcer knowing who's listening. Event sourcing is your bank statement: the balance isn't stored as truth, it's the sum of every transaction ever. A saga is planning a wedding with separate vendors: if the venue cancels, you don't 'rollback the universe' — you call the caterer and the band and cancel them (compensations).",
    he: "Command זה הבוס שאומר 'תזמין את הטיסה' — נמען אחד, ואפשר לסרב. Event זה ההודעה לכל החברה 'דנה קודמה!' — זה כבר קרה, ו-HR, שכר ומי שמארגן את המסיבה כל אחד מגיב בדרך שלו, בלי שמי שהודיע יודע מי מקשיב. Event sourcing זה דף חשבון הבנק: היתרה לא נשמרת כאמת, היא הסכום של כל הפעולות אי פעם. Saga זה לתכנן חתונה עם ספקים נפרדים: אם האולם מבטל, לא עושים 'rollback ליקום' — מתקשרים לקייטרינג וללהקה ומבטלים אותם (compensations)."
  },
  sections: [
    {
      h: { en: "Events vs commands", he: "Events מול commands" },
      body: {
        en: `<ul>
<li><strong>Command</strong>: an intent, imperative, addressed to one handler, can be rejected. <code>ChargeCard</code>, <code>ReserveStock</code>. The sender depends on the receiver.</li>
<li><strong>Event</strong>: a fact, past tense, broadcast, cannot be rejected (it already happened). <code>OrderPlaced</code>, <code>PaymentFailed</code>. The publisher doesn't know or care who listens — that's the decoupling.</li>
</ul>
<p>Events come in two flavors. <strong>Event notification</strong> (thin): <code>{ "type": "OrderPlaced", "orderId": "o-81" }</code> — consumers call back for details (coupling + load). <strong>Event-carried state transfer</strong> (fat): include what consumers need (items, totals, customer tier) so they don't call back.</p>
<pre>{
  "eventId": "6f1c...", "type": "OrderPlaced", "version": 2,
  "occurredAt": "2026-11-12T09:41:07Z", "correlationId": "req-77a",
  "data": { "orderId": "o-81", "customerId": "c-9", "totalCents": 12900,
            "items": [{ "sku": "MUG-1", "qty": 2 }] }
}</pre>
<blockquote>💡 Real world: Treat event schemas as public APIs: use a schema registry (Confluent, Apicurio, Glue) with Avro/Protobuf/JSON Schema, only make backward-compatible changes (add optional fields), and version breaking changes as new event types. The CloudEvents spec standardizes the envelope.</blockquote>`,
        he: `<ul>
<li><strong>Command</strong>: כוונה, בציווי, מופנה ל-handler אחד, אפשר לדחות אותו. <code>ChargeCard</code>, <code>ReserveStock</code>. השולח תלוי במקבל.</li>
<li><strong>Event</strong>: עובדה, בזמן עבר, משודר לכולם, אי אפשר לדחות אותו (זה כבר קרה). <code>OrderPlaced</code>, <code>PaymentFailed</code>. ה-publisher לא יודע ולא אכפת לו מי מקשיב — זה ה-decoupling.</li>
</ul>
<p>יש שני סוגים של events. <strong>Event notification</strong> (רזה): <code>{ "type": "OrderPlaced", "orderId": "o-81" }</code> — ה-consumers קוראים חזרה כדי לקבל פרטים (צימוד + עומס). <strong>Event-carried state transfer</strong> (שמן): כוללים את מה שה-consumers צריכים (פריטים, סכומים, דרגת לקוח) כדי שלא יצטרכו לקרוא חזרה.</p>
<pre>{
  "eventId": "6f1c...", "type": "OrderPlaced", "version": 2,
  "occurredAt": "2026-11-12T09:41:07Z", "correlationId": "req-77a",
  "data": { "orderId": "o-81", "customerId": "c-9", "totalCents": 12900,
            "items": [{ "sku": "MUG-1", "qty": 2 }] }
}</pre>
<blockquote>💡 מהשטח: תתייחסו ל-schemas של events כמו ל-APIs ציבוריים: schema registry (Confluent, Apicurio, Glue) עם Avro/Protobuf/JSON Schema, רק שינויים תואמים לאחור (מוסיפים שדות אופציונליים), ושינויים שוברים — כ-event type חדש. ה-spec של CloudEvents מתקנן את המעטפה.</blockquote>`
      }
    },
    {
      h: { en: "Event sourcing and CQRS", he: "Event sourcing ו-CQRS" },
      body: {
        en: `<p><strong>Event sourcing</strong>: instead of storing current state (<code>balance = 70</code>), store the append-only sequence of events (<code>Opened, Deposited 100, Withdrew 30</code>) and derive state by replaying them. Benefits: perfect audit log, time travel ("what was the state on March 3?"), debugging by replay, new read models built from history. Costs: schema evolution of old events forever, snapshots needed for long streams, GDPR deletion is hard (crypto-shredding), and a steep learning curve.</p>
<p><strong>CQRS</strong> (Command Query Responsibility Segregation): separate the write model (validates commands, enforces invariants) from one or more read models (denormalized, optimized per query). Writes emit events; projectors update read models — e.g. a Postgres write DB feeding an Elasticsearch search index and a Redis leaderboard.</p>
<pre>write side:  POST /accounts/42/withdraw  -&gt; validate -&gt; append MoneyWithdrawn(42, 30)
projector:   on MoneyWithdrawn -&gt; UPDATE account_summary SET balance = balance - 30
read side:   GET /accounts/42  -&gt; SELECT * FROM account_summary  (may lag by ~100 ms)</pre>
<blockquote>⚠️ Production tip: CQRS and event sourcing are independent — you can do CQRS without event sourcing (very common), and you rarely want event sourcing for a whole system. Use it where the history IS the business: ledgers, bookings, workflows, audit-heavy domains.</blockquote>`,
        he: `<p><strong>Event sourcing</strong>: במקום לשמור מצב נוכחי (<code>balance = 70</code>), שומרים את רצף ה-events (append-only) — <code>Opened, Deposited 100, Withdrew 30</code> — וגוזרים את המצב ע"י replay. יתרונות: audit log מושלם, מסע בזמן ("מה היה המצב ב-3 במרץ?"), דיבאג ע"י replay, ובניית read models חדשים מההיסטוריה. עלויות: התפתחות schema של events ישנים לנצח, צריך snapshots ל-streams ארוכים, מחיקה לפי GDPR קשה (crypto-shredding), ועקומת למידה תלולה.</p>
<p><strong>CQRS</strong> (Command Query Responsibility Segregation): מפרידים את מודל הכתיבה (מאמת commands, אוכף invariants) מאחד או יותר מודלי קריאה (denormalized, מותאמים לכל query). כתיבות מייצרות events; projectors מעדכנים את ה-read models — למשל DB כתיבה ב-Postgres שמזין search index ב-Elasticsearch ו-leaderboard ב-Redis.</p>
<pre>write side:  POST /accounts/42/withdraw  -&gt; validate -&gt; append MoneyWithdrawn(42, 30)
projector:   on MoneyWithdrawn -&gt; UPDATE account_summary SET balance = balance - 30
read side:   GET /accounts/42  -&gt; SELECT * FROM account_summary  (may lag by ~100 ms)</pre>
<blockquote>⚠️ טיפ לפרודקשן: CQRS ו-event sourcing בלתי תלויים — אפשר CQRS בלי event sourcing (נפוץ מאוד), ולעתים רחוקות רוצים event sourcing לכל המערכת. משתמשים בו איפה שההיסטוריה <em>היא</em> הביזנס: ledgers, הזמנות מקום, workflows, דומיינים עם הרבה audit.</blockquote>`
      }
    },
    {
      h: { en: "Sagas: choreography vs orchestration", he: "Sagas: choreography מול orchestration" },
      body: {
        en: `<p>With a database per service there's no cross-service ACID transaction (2PC across services is fragile and blocks). A <strong>saga</strong> is a sequence of local transactions; if step N fails, run <strong>compensating actions</strong> for steps N-1...1 (refund, release stock) — semantic undo, not rollback.</p>
<ul>
<li><strong>Choreography</strong>: no coordinator. Each service reacts to events and emits new ones: <code>OrderPlaced</code> → payments charges → <code>PaymentCompleted</code> → inventory reserves → <code>StockReserved</code> → shipping. Simple for 2–4 steps, loosely coupled; but the flow is implicit, hard to see, and cyclic dependencies creep in.</li>
<li><strong>Orchestration</strong>: a central orchestrator (a state machine) sends commands and handles replies: "charge" → ok → "reserve" → failed → "refund". The flow is explicit, testable and observable; the orchestrator is extra infrastructure and can grow into a god-service. Tools: Temporal, AWS Step Functions, Camunda/Zeebe, Azure Durable Functions.</li>
</ul>
<pre>Orchestrated order saga
 1. payments.Charge        -- compensate: payments.Refund
 2. inventory.Reserve      -- compensate: inventory.Release
 3. shipping.Schedule      -- (last step: pivot, no compensation)
 failure at 3 -&gt; Release(2) -&gt; Refund(1) -&gt; order = CANCELLED</pre>
<blockquote>💡 Real world: Uber built Cadence (now Temporal) because choreographed flows across dozens of services became impossible to reason about. Rule of thumb: choreography for simple fan-out reactions, orchestration for business-critical multi-step workflows.</blockquote>`,
        he: `<p>כשלכל service יש database משלו, אין טרנזקציית ACID חוצת-שירותים (2PC בין שירותים שביר וחוסם). <strong>Saga</strong> היא רצף של טרנזקציות מקומיות; אם שלב N נכשל, מריצים <strong>compensating actions</strong> לשלבים N-1...1 (החזר כספי, שחרור מלאי) — ביטול סמנטי, לא rollback.</p>
<ul>
<li><strong>Choreography</strong>: אין מתאם. כל service מגיב ל-events ומוציא חדשים: <code>OrderPlaced</code> → payments מחייב → <code>PaymentCompleted</code> → inventory שומר מלאי → <code>StockReserved</code> → shipping. פשוט ל-2–4 שלבים, צימוד רופף; אבל הזרימה מובלעת, קשה לראות אותה, ותלויות מעגליות מתגנבות.</li>
<li><strong>Orchestration</strong>: orchestrator מרכזי (state machine) שולח commands ומטפל בתשובות: "charge" → ok → "reserve" → נכשל → "refund". הזרימה מפורשת, ניתנת לבדיקה ולצפייה; ה-orchestrator הוא עוד תשתית ועלול לגדול ל-god-service. כלים: Temporal, AWS Step Functions, Camunda/Zeebe, Azure Durable Functions.</li>
</ul>
<pre>Orchestrated order saga
 1. payments.Charge        -- compensate: payments.Refund
 2. inventory.Reserve      -- compensate: inventory.Release
 3. shipping.Schedule      -- (last step: pivot, no compensation)
 failure at 3 -&gt; Release(2) -&gt; Refund(1) -&gt; order = CANCELLED</pre>
<blockquote>💡 מהשטח: Uber בנו את Cadence (היום Temporal) כי זרימות choreography על פני עשרות שירותים הפכו לבלתי אפשריות להבנה. כלל אצבע: choreography לתגובות fan-out פשוטות, orchestration ל-workflows עסקיים קריטיים עם הרבה שלבים.</blockquote>`
      }
    },
    {
      h: { en: "The transactional outbox (the dual-write problem)", he: "Transactional outbox (בעיית ה-dual-write)" },
      body: {
        en: `<p>The classic bug: <code>db.save(order); kafka.publish(OrderPlaced)</code>. If the process crashes between the two, the order exists but nobody hears about it. Publish first and the DB write fails — an event for an order that doesn't exist. You can't atomically write to two systems: the <strong>dual-write problem</strong>.</p>
<p>The <strong>transactional outbox</strong>: write the event into an <code>outbox</code> table <em>in the same local DB transaction</em> as the business change. A separate relay publishes outbox rows to the broker and marks them sent.</p>
<pre>BEGIN;
INSERT INTO orders (id, customer_id, total_cents, status) VALUES ('o-81','c-9',12900,'PLACED');
INSERT INTO outbox (id, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), 'o-81', 'OrderPlaced', '{"orderId":"o-81",...}');
COMMIT;   -- both or neither

-- relay: poll "SELECT ... FROM outbox WHERE sent_at IS NULL ORDER BY id LIMIT 100"
--        or tail the WAL with Debezium CDC (outbox event router) -&gt; Kafka</pre>
<p>The relay can publish a row twice (crash after publish, before marking sent), so delivery is at-least-once — consumers must be idempotent, keyed by <code>eventId</code>. The mirror pattern on the consumer side is the <strong>inbox</strong>: record processed event IDs in the same transaction as the side effect.</p>
<blockquote>⚠️ Production tip: Debezium + the outbox pattern is the de facto standard on Postgres/MySQL + Kafka. Clean up published outbox rows (or partition the table by day) or it will become your biggest table.</blockquote>`,
        he: `<p>הבאג הקלאסי: <code>db.save(order); kafka.publish(OrderPlaced)</code>. אם ה-process קורס בין השניים, ההזמנה קיימת אבל אף אחד לא שומע עליה. מפרסמים קודם והכתיבה ל-DB נכשלת — יש event על הזמנה שלא קיימת. אי אפשר לכתוב באופן אטומי לשתי מערכות: <strong>בעיית ה-dual-write</strong>.</p>
<p><strong>Transactional outbox</strong>: כותבים את ה-event לטבלת <code>outbox</code> <em>באותה טרנזקציה מקומית</em> של השינוי העסקי. relay נפרד מפרסם את השורות מה-outbox ל-broker ומסמן אותן כנשלחו.</p>
<pre>BEGIN;
INSERT INTO orders (id, customer_id, total_cents, status) VALUES ('o-81','c-9',12900,'PLACED');
INSERT INTO outbox (id, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), 'o-81', 'OrderPlaced', '{"orderId":"o-81",...}');
COMMIT;   -- both or neither

-- relay: poll "SELECT ... FROM outbox WHERE sent_at IS NULL ORDER BY id LIMIT 100"
--        or tail the WAL with Debezium CDC (outbox event router) -&gt; Kafka</pre>
<p>ה-relay יכול לפרסם שורה פעמיים (קריסה אחרי פרסום, לפני הסימון), אז המסירה היא at-least-once — ה-consumers חייבים להיות אידמפוטנטיים, לפי <code>eventId</code>. התבנית המקבילה בצד ה-consumer היא <strong>inbox</strong>: רושמים IDs של events שעובדו באותה טרנזקציה של ה-side effect.</p>
<blockquote>⚠️ טיפ לפרודקשן: Debezium + תבנית ה-outbox הם הסטנדרט דה-פקטו על Postgres/MySQL + Kafka. תנקו שורות outbox שפורסמו (או תעשו partitioning לטבלה לפי יום), אחרת היא תהפוך לטבלה הכי גדולה שלכם.</blockquote>`
      }
    },
    {
      h: { en: "Living with eventual consistency", he: "לחיות עם eventual consistency" },
      body: {
        en: `<p><strong>Eventual consistency</strong>: if no new updates happen, all replicas/read models will converge to the same value — <em>eventually</em> (usually milliseconds to seconds). The order service says "PLACED", the search index still says nothing, the email hasn't gone out. That's normal, not a bug — as long as the UX and the business rules are designed for it.</p>
<ul>
<li><strong>UX</strong>: show "Order received — confirming payment" states; optimistic UI updates; don't redirect to a page that reads from a lagging read model without handling "not found yet".</li>
<li><strong>Ordering</strong>: events can arrive out of order across partitions. Carry a version/sequence number per aggregate and ignore stale updates.</li>
<li><strong>Observability</strong>: propagate <code>correlationId</code>/trace context in message headers so a single trace spans the whole saga; alert on projection lag and stuck sagas (e.g. orders in PENDING &gt; 10 minutes).</li>
<li><strong>Reconciliation</strong>: a periodic job that compares sources of truth and fixes drift — the safety net every mature event-driven system has.</li>
</ul>
<blockquote>💡 Real world: Your bank is eventually consistent: card authorizations appear instantly as "pending", settle a day or two later, and nightly reconciliation catches mismatches. Event-driven systems borrowed the playbook from finance, not the other way around.</blockquote>`,
        he: `<p><strong>Eventual consistency</strong>: אם לא מגיעים עדכונים חדשים, כל ה-replicas/read models יתכנסו לאותו ערך — <em>בסוף</em> (בדרך כלל מילישניות עד שניות). ה-order service אומר "PLACED", ה-search index עוד לא יודע כלום, והמייל עוד לא יצא. זה נורמלי, לא באג — כל עוד ה-UX והחוקים העסקיים תוכננו לזה.</p>
<ul>
<li><strong>UX</strong>: מציגים מצבים כמו "ההזמנה התקבלה — מאשרים תשלום"; עדכוני UI אופטימיים; לא מפנים לעמוד שקורא מ-read model מפגר בלי לטפל ב-"עדיין לא נמצא".</li>
<li><strong>סדר</strong>: events יכולים להגיע לא לפי הסדר בין partitions. מצרפים מספר גרסה/sequence לכל aggregate ומתעלמים מעדכונים ישנים.</li>
<li><strong>Observability</strong>: מעבירים <code>correlationId</code>/trace context ב-headers של ההודעה כך ש-trace אחד מכסה את כל ה-saga; מתריעים על lag של projections ועל sagas תקועות (למשל הזמנות ב-PENDING יותר מ-10 דקות).</li>
<li><strong>Reconciliation</strong>: job תקופתי שמשווה בין מקורות אמת ומתקן סטיות — רשת הביטחון שיש לכל מערכת event-driven בוגרת.</li>
</ul>
<blockquote>💡 מהשטח: הבנק שלכם הוא eventually consistent: אישורי כרטיס מופיעים מיד כ-"ממתין", נסלקים יום-יומיים אחר כך, ו-reconciliation לילי תופס אי-התאמות. מערכות event-driven העתיקו את ה-playbook מעולם הפיננסים, לא להפך.</blockquote>`
      }
    }
  ],
  diagram:
`TRANSACTIONAL OUTBOX                              CHOREOGRAPHED SAGA
 order-svc                                         OrderPlaced --> [payments] --PaymentCompleted-->
 +-----------------------------+                                                    |
 | BEGIN                       |                   [inventory] <--------------------+
 |  INSERT orders  ...         |                       | StockReserved      | OutOfStock
 |  INSERT outbox  OrderPlaced |                       v                    v
 | COMMIT  (atomic)            |                   [shipping]          [payments] Refund
 +--------------+--------------+                                       (compensation)
                | Debezium / poller (at-least-once)
                v
            [ Kafka ] --> consumers (idempotent by eventId)`,
  handsOn: [
    { cmd: "docker run -d --name temporal -p 7233:7233 -p 8233:8233 temporalio/temporal:latest server start-dev --ip 0.0.0.0", what: { en: "Run a local Temporal dev server (UI on :8233) to try orchestrated sagas with durable state and retries.", he: "מריצים Temporal מקומי למפתחים (UI על 8233) כדי לנסות sagas עם orchestration, state עמיד ו-retries." } },
    { cmd: "psql -c \"SELECT type, count(*), min(created_at) FROM outbox WHERE sent_at IS NULL GROUP BY type;\"", what: { en: "Check outbox health: unsent rows piling up or an old min(created_at) means your relay is stuck.", he: "בודקים את בריאות ה-outbox: שורות שלא נשלחו שנערמות או min(created_at) ישן אומרים שה-relay תקוע." } },
    { cmd: "curl -s localhost:8083/connectors/orders-outbox/status | jq", what: { en: "Check a Debezium (Kafka Connect) outbox connector — RUNNING vs FAILED tasks.", he: "בודקים connector של Debezium (Kafka Connect) ל-outbox — tasks במצב RUNNING מול FAILED." } }
  ],
  mnemonic: {
    en: "\"Commands ask, events tell. Sagas undo by apology, not by rollback. Outbox: one transaction, two facts.\"",
    he: "\"Commands מבקשים, events מספרים. Sagas מבטלים בהתנצלות, לא ב-rollback. Outbox: טרנזקציה אחת, שתי עובדות.\""
  },
  pitfalls: [
    { en: "Dual writes (DB save then broker publish) without an outbox — events silently go missing on crashes and deploys.", he: "Dual writes (שמירה ב-DB ואז publish ל-broker) בלי outbox — events נעלמים בשקט בקריסות וב-deploys." },
    { en: "Commands disguised as events ('SendWelcomeEmail' published as an event) — the publisher still depends on a specific consumer; name events as past-tense facts.", he: "Commands שמתחפשים ל-events ('SendWelcomeEmail' שמתפרסם כ-event) — ה-publisher עדיין תלוי ב-consumer ספציפי; קוראים ל-events בשמות של עובדות בזמן עבר." },
    { en: "Sagas without compensations for every step, or compensations that aren't idempotent — a retry of 'Refund' refunds twice.", he: "Sagas בלי compensations לכל שלב, או compensations שאינם אידמפוטנטיים — retry של 'Refund' מחזיר כסף פעמיים." },
    { en: "Adopting event sourcing for CRUD-ish domains 'for the audit log' — an audit table or CDC gives you that at 5% of the complexity.", he: "לאמץ event sourcing לדומיינים שהם בעצם CRUD 'בשביל ה-audit log' — טבלת audit או CDC נותנים את זה ב-5% מהסיבוכיות." }
  ],
  interview: [
    {
      q: { en: "How do you reliably publish an event when an order is saved, without distributed transactions?", he: "איך מפרסמים event באמינות כשהזמנה נשמרת, בלי טרנזקציות מבוזרות?" },
      a: { en: "Transactional outbox: insert the order and an outbox row in one local transaction. A relay (poller or Debezium CDC reading the WAL) publishes outbox rows to Kafka and marks them sent. It's at-least-once, so events carry a unique eventId and consumers dedupe (inbox table or idempotent updates). Monitor outbox backlog and age.", he: "Transactional outbox: מכניסים את ההזמנה ושורת outbox בטרנזקציה מקומית אחת. relay (poller או Debezium CDC שקורא את ה-WAL) מפרסם את השורות ל-Kafka ומסמן אותן כנשלחו. זה at-least-once, אז ל-events יש eventId ייחודי וה-consumers עושים dedupe (טבלת inbox או עדכונים אידמפוטנטיים). מנטרים את ה-backlog והגיל של ה-outbox." }
    },
    {
      q: { en: "Choreography or orchestration for a 6-step order fulfillment flow with payments? Why?", he: "Choreography או orchestration לזרימת מילוי הזמנה של 6 שלבים עם תשלומים? למה?" },
      a: { en: "Orchestration. With 6 steps and money involved you want the flow explicit and versioned in one place, clear compensation logic, timeouts per step, and a dashboard showing where each order is stuck. Temporal or Step Functions give durable state and retries. Choreography would scatter the logic across 6 services and make 'where is order 81?' a log-grepping exercise. Domain events can still be published for other interested parties.", he: "Orchestration. עם 6 שלבים וכסף בתמונה, רוצים שהזרימה תהיה מפורשת ומגורסת במקום אחד, לוגיקת compensation ברורה, timeouts לכל שלב, ודשבורד שמראה איפה כל הזמנה תקועה. Temporal או Step Functions נותנים state עמיד ו-retries. Choreography הייתה מפזרת את הלוגיקה על 6 שירותים והופכת את 'איפה הזמנה 81?' לתרגיל grep בלוגים. עדיין אפשר לפרסם domain events לגורמים אחרים שמתעניינים." }
    }
  ],
  quiz: [
    {
      q: { en: "Which of these is an event (not a command)?", he: "איזה מהבאים הוא event (ולא command)?" },
      options: [
        { en: "ReserveInventory", he: "ReserveInventory" },
        { en: "SendInvoiceEmail", he: "SendInvoiceEmail" },
        { en: "PaymentCaptured", he: "PaymentCaptured" },
        { en: "CancelOrder", he: "CancelOrder" }
      ],
      answer: 2,
      explain: { en: "Events are past-tense facts that can't be rejected. The others are imperative requests to a specific handler.", he: "Events הם עובדות בזמן עבר שאי אפשר לדחות. האחרים הם בקשות בציווי ל-handler ספציפי." }
    },
    {
      q: { en: "What problem does the transactional outbox solve?", he: "איזו בעיה ה-transactional outbox פותר?" },
      options: [
        { en: "Slow consumers falling behind", he: "Consumers איטיים שמפגרים" },
        { en: "Atomically updating the DB and publishing an event (dual write)", he: "עדכון ה-DB ופרסום event באופן אטומי (dual write)" },
        { en: "Guaranteeing global ordering across partitions", he: "הבטחת סדר גלובלי בין partitions" },
        { en: "Exactly-once delivery to consumers", he: "מסירה exactly-once ל-consumers" }
      ],
      answer: 1,
      explain: { en: "The outbox row commits with the business data, so an event is published if and only if the change happened. Delivery is still at-least-once.", he: "שורת ה-outbox נכנסת ב-commit יחד עם הדאטה העסקי, אז event מתפרסם אם ורק אם השינוי קרה. המסירה עדיין at-least-once." }
    },
    {
      q: { en: "In a saga, step 3 (shipping) fails after payment and stock reservation succeeded. What happens?", he: "ב-saga, שלב 3 (shipping) נכשל אחרי שהתשלום ושמירת המלאי הצליחו. מה קורה?" },
      options: [
        { en: "A distributed rollback undoes all three databases atomically", he: "Rollback מבוזר מבטל את שלושת ה-databases באופן אטומי" },
        { en: "Compensating actions run: release stock, then refund payment", he: "רצות פעולות מפצות: שחרור מלאי, ואז החזר כספי" },
        { en: "Nothing — eventual consistency will fix it", he: "כלום — ה-eventual consistency יסדר את זה" },
        { en: "The saga retries step 1 from scratch", he: "ה-saga מנסה שוב את שלב 1 מההתחלה" }
      ],
      answer: 1,
      explain: { en: "Sagas have no global rollback; each completed step is undone semantically by its compensating action, in reverse order.", he: "ל-sagas אין rollback גלובלי; כל שלב שהושלם מבוטל סמנטית ע\"י הפעולה המפצה שלו, בסדר הפוך." }
    },
    {
      q: { en: "Which statement about CQRS is true?", he: "איזו טענה על CQRS נכונה?" },
      options: [
        { en: "CQRS requires event sourcing", he: "CQRS מחייב event sourcing" },
        { en: "CQRS separates the write model from read models, which may lag behind", he: "CQRS מפריד בין מודל הכתיבה למודלי הקריאה, שעלולים לפגר" },
        { en: "CQRS guarantees strong consistency between reads and writes", he: "CQRS מבטיח strong consistency בין קריאות לכתיבות" },
        { en: "CQRS means using two different programming languages", he: "CQRS אומר להשתמש בשתי שפות תכנות שונות" }
      ],
      answer: 1,
      explain: { en: "Read models are updated from the write side (often via events), so they're typically eventually consistent. Event sourcing is optional.", he: "Read models מתעדכנים מצד הכתיבה (בדרך כלל דרך events), ולכן הם בדרך כלל eventually consistent. Event sourcing אופציונלי." }
    }
  ],
  related: ["arch-brokers", "arch-queues", "arch-monolith-vs-microservices", "obs-traces"]
});

// =====================================================================
// Glossary — architecture
// =====================================================================
[
  ["Modular monolith", "One deployable with strictly enforced internal module boundaries and per-module data ownership — the easy path to later extraction.", "Deployable אחד עם גבולות מודולים פנימיים אכופים ובעלות על דאטה לכל מודול — המסלול הקל לחילוץ שירותים בהמשך.", "arch-monolith-vs-microservices"],
  ["Distributed monolith", "Separately deployed services that are so coupled (shared DB, lockstep deploys, long sync chains) they have microservice costs without the benefits.", "שירותים שעולים בנפרד אבל צמודים כל כך (DB משותף, deploys בצעד אחיד, שרשראות סינכרוניות ארוכות) שיש להם את העלויות של microservices בלי היתרונות.", "arch-monolith-vs-microservices"],
  ["Conway's law", "Organizations design systems that mirror their communication structure — architecture follows the org chart.", "ארגונים מתכננים מערכות שמשקפות את מבנה התקשורת שלהם — הארכיטקטורה הולכת אחרי המבנה הארגוני.", "arch-monolith-vs-microservices"],
  ["API gateway", "Edge reverse proxy giving clients one entry point and handling routing, auth, rate limiting, aggregation and TLS.", "Reverse proxy בקצה שנותן ללקוחות נקודת כניסה אחת ומטפל ב-routing, auth, rate limiting, aggregation ו-TLS.", "arch-api-gateway"],
  ["BFF (Backend for Frontend)", "A thin backend per client type (web, mobile) that aggregates and shapes data for that specific UI.", "Backend דק לכל סוג לקוח (web, מובייל) שמאחד ומעצב דאטה עבור ה-UI הספציפי הזה.", "arch-api-gateway"],
  ["Service mesh", "Infrastructure layer (Istio, Linkerd) of proxies handling service-to-service traffic: mTLS, retries, timeouts, traffic splitting, telemetry.", "שכבת תשתית (Istio, Linkerd) של proxies שמטפלת בתעבורה בין שירותים: mTLS, retries, timeouts, traffic splitting, telemetry.", "arch-api-gateway"],
  ["Service discovery", "Mechanism for finding the current network locations of service instances — DNS (Kubernetes Services) or a registry (Consul, Eureka).", "מנגנון למציאת המיקום הנוכחי ברשת של instances — DNS (Services ב-Kubernetes) או registry (Consul, Eureka).", "arch-api-gateway"],
  ["Temporal coupling", "When two services must both be available at the same moment for an operation to succeed — the core cost of synchronous calls.", "מצב שבו שני שירותים חייבים להיות זמינים באותו רגע כדי שפעולה תצליח — המחיר המרכזי של קריאות סינכרוניות.", "arch-sync-vs-async"],
  ["Visibility timeout", "In SQS, how long a received message stays hidden from other consumers; if not deleted (acked) in time, it reappears.", "ב-SQS, כמה זמן הודעה שהתקבלה מוסתרת מ-consumers אחרים; אם לא נמחקה (ack) בזמן — היא חוזרת.", "arch-queues"],
  ["At-least-once delivery", "Every message is delivered one or more times; duplicates are possible, so consumers must be idempotent.", "כל הודעה נמסרת פעם אחת או יותר; כפילויות אפשריות, ולכן consumers חייבים להיות אידמפוטנטיים.", "arch-queues"],
  ["Dead-letter queue (DLQ)", "A side queue where messages are moved after repeatedly failing processing, so they stop blocking and can be inspected and redriven.", "Queue צדדי שאליו מועברות הודעות אחרי שנכשלו שוב ושוב בעיבוד, כדי שיפסיקו לחסום ואפשר יהיה לבדוק אותן ולעשות redrive.", "arch-queues"],
  ["Idempotency", "Property of an operation where applying it multiple times has the same effect as applying it once.", "תכונה של פעולה שבה ביצוע כמה פעמים זהה בהשפעתו לביצוע אחד.", "arch-queues"],
  ["Consumer group (Kafka)", "A set of consumers sharing a topic's partitions — each partition is read by exactly one member; each group has independent offsets.", "קבוצת consumers שחולקים את ה-partitions של topic — כל partition נקרא ע\"י חבר אחד בדיוק; לכל group יש offsets עצמאיים.", "arch-brokers"],
  ["Partition (Kafka)", "An ordered, append-only log shard of a topic; the unit of parallelism and of ordering guarantees.", "Shard של topic שהוא log ממוין ו-append-only; יחידת המקביליות ויחידת הבטחת הסדר.", "arch-brokers"],
  ["Consumer lag", "How far a consumer group is behind the newest message (latest offset minus committed offset) — Kafka's key health metric.", "כמה consumer group מפגר אחרי ההודעה החדשה ביותר (ה-offset האחרון פחות ה-offset שעשו לו commit) — מטריקת הבריאות המרכזית של Kafka.", "arch-brokers"],
  ["Cache-aside", "Caching pattern where the app reads the cache, loads from the DB on a miss and populates the cache, and invalidates on writes.", "תבנית caching שבה האפליקציה קוראת מה-cache, טוענת מה-DB ב-miss וממלאת את ה-cache, ועושה invalidation בכתיבה.", "arch-caching"],
  ["Cache stampede", "Many concurrent requests missing the same expired hot key and hammering the backend at once (a.k.a. thundering herd / dogpile).", "הרבה בקשות במקביל שמפספסות את אותו key חם שפג ופוגעות ב-backend בבת אחת (נקרא גם thundering herd / dogpile).", "arch-caching"],
  ["Hit ratio", "Fraction of cache lookups served from the cache: hits / (hits + misses). Small changes at the top end change backend load dramatically.", "החלק של בקשות ה-cache שנענו מה-cache: hits / (hits + misses). שינויים קטנים בקצה העליון משנים דרמטית את העומס על ה-backend.", "arch-caching"],
  ["Circuit breaker", "Wrapper that stops calling a failing dependency (Open), fails fast, and periodically probes recovery (Half-Open) before resuming (Closed).", "עטיפה שמפסיקה לקרוא ל-dependency שנכשל (Open), נכשלת מהר, ובודקת מדי פעם התאוששות (Half-Open) לפני חזרה לשגרה (Closed).", "arch-resilience"],
  ["Exponential backoff with jitter", "Retry delays that double each attempt (capped) and are randomized, so clients don't retry in synchronized waves.", "זמני המתנה ל-retry שמוכפלים בכל ניסיון (עם תקרה) ומוגרלים, כדי שלקוחות לא ינסו שוב בגלים מסונכרנים.", "arch-resilience"],
  ["Bulkhead", "Isolating resources (thread pools, connection pools, clusters) per dependency or tenant so one failure can't exhaust everything.", "בידוד משאבים (thread pools, connection pools, clusters) לכל dependency או tenant כך שכשל אחד לא ירוקן את הכול.", "arch-resilience"],
  ["Token bucket", "Rate-limiting algorithm: a bucket of capacity B refills at R tokens/s; each request spends a token or is rejected (429).", "אלגוריתם rate limiting: דלי בקיבולת B מתמלא בקצב R tokens לשנייה; כל בקשה מוציאה token או נדחית (429).", "arch-resilience"],
  ["Idempotency key", "A client-generated unique key sent with a request so the server can recognize retries and return the original result instead of repeating the action.", "מפתח ייחודי שהלקוח מייצר ושולח עם הבקשה, כך שהשרת מזהה retries ומחזיר את התוצאה המקורית במקום לבצע שוב.", "arch-resilience"],
  ["Scale cube", "Three scaling axes: X = clone behind a load balancer, Y = split by function (services), Z = split by data (sharding/cells).", "שלושה צירי scaling: X = שכפול מאחורי load balancer, Y = פיצול לפי פונקציה (שירותים), Z = פיצול לפי דאטה (sharding/cells).", "arch-scaling"],
  ["Event sourcing", "Storing state as an append-only sequence of events and deriving current state by replaying them.", "שמירת state כרצף append-only של events וגזירת המצב הנוכחי ע\"י replay שלהם.", "arch-event-driven"],
  ["CQRS", "Command Query Responsibility Segregation — separate models for writes (commands) and reads (queries), with read models often eventually consistent.", "Command Query Responsibility Segregation — מודלים נפרדים לכתיבות (commands) ולקריאות (queries), כשמודלי הקריאה בדרך כלל eventually consistent.", "arch-event-driven"],
  ["Saga", "A long-running business transaction made of local transactions, with compensating actions to undo completed steps on failure.", "טרנזקציה עסקית ארוכה שבנויה מטרנזקציות מקומיות, עם פעולות מפצות לביטול שלבים שהושלמו במקרה של כשלון.", "arch-event-driven"],
  ["Transactional outbox", "Writing outgoing events to an outbox table in the same DB transaction as the business change, then relaying them to the broker.", "כתיבת events יוצאים לטבלת outbox באותה טרנזקציה של השינוי העסקי, ואז העברתם ל-broker.", "arch-event-driven"],
  ["Eventual consistency", "Guarantee that, absent new updates, all copies converge to the same value — but reads may be stale for a while.", "הבטחה שבהיעדר עדכונים חדשים כל העותקים יתכנסו לאותו ערך — אבל קריאות עלולות להיות לא עדכניות לזמן מה.", "arch-event-driven"]
].forEach(([term, en, he, lesson]) =>
  INFRA.glossary.push({ term, track: "architecture", def: { en, he }, lesson })
);
