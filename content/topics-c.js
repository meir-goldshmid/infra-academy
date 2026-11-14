// Topics C: GraphQL in production, WebAssembly & edge compute, graph databases, SLOs as code
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. GraphQL in Production
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "arch-graphql-production",
  track: "architecture",
  order: 60,
  icon: "🕸️",
  level: 3,
  minutes: 14,
  title: { en: "GraphQL in Production", he: "GraphQL בפרודקשן" },
  tldr: {
    en: "GraphQL lets the client choose the exact shape of the response from one typed schema — which moves the hard problems (N+1, query cost, caching, per-field auth, observability) from the client to your server.",
    he: "GraphQL נותן ללקוח לבחור בדיוק את צורת התשובה מתוך schema אחד עם טיפוסים — וזה מעביר את הבעיות הקשות (N+1, עלות query, caching, הרשאות לכל שדה, observability) מהלקוח אל השרת שלך."
  },
  analogy: {
    en: "REST is a set menu: each endpoint is a fixed dish, and if you want the soup from menu A and the dessert from menu B, you order twice. GraphQL is a buffet where the client fills one plate with exactly what it wants. Great for the guest — but now the kitchen has no idea what will be asked for next, someone can pile 40 plates on one tray, and you can't pre-plate anything for the takeaway window (the CDN).",
    he: "REST זה תפריט עסקי: כל endpoint הוא מנה קבועה, ואם אתה רוצה את המרק מתפריט A ואת הקינוח מתפריט B, אתה מזמין פעמיים. GraphQL זה מזנון שבו הלקוח ממלא צלחת אחת בדיוק במה שהוא רוצה. מעולה לאורח — אבל עכשיו המטבח לא יודע מה יבקשו בפעם הבאה, מישהו יכול להעמיס 40 צלחות על מגש אחד, ואי אפשר להכין מנות מראש לחלון ה-takeaway (ה-CDN)."
  },
  sections: [
    {
      h: { en: "Schema, resolvers, and where GraphQL fits next to REST and gRPC", he: "Schema, ‏resolver-ים, ואיפה GraphQL עומד ליד REST ו-gRPC" },
      body: {
        en: `<p>A GraphQL server is two things: a <strong>schema</strong> (SDL — the typed contract) and <strong>resolvers</strong> (one function per field that knows how to fetch it). The executor walks the query tree and calls a resolver for every field of every object — that per-field execution is the source of both its flexibility and its production problems.</p>
<pre>type Query {
  order(id: ID!): Order
  orders(first: Int = 20, after: String): OrderConnection!
}
type Order {
  id: ID!
  status: OrderStatus!
  total: Money!
  customer: Customer!        # resolved by the customers service
  items: [LineItem!]!
}
type Customer { id: ID! name: String! email: String @auth(requires: SUPPORT) }</pre>
<pre>// resolvers (Node, Apollo Server / graphql-js)
const resolvers = {
  Query: { order: (_, { id }, ctx) =&gt; ctx.db.orders.byId(id) },
  Order: { customer: (order, _, ctx) =&gt; ctx.loaders.customer.load(order.customerId) }
};</pre>
<table><tr><th></th><th>REST</th><th>GraphQL</th><th>gRPC</th></tr>
<tr><td>Contract</td><td>OpenAPI (optional)</td><td>SDL schema (mandatory, introspectable)</td><td>.proto (mandatory)</td></tr>
<tr><td>Transport</td><td>HTTP verbs + URLs</td><td>usually one <code>POST /graphql</code></td><td>HTTP/2, binary protobuf</td></tr>
<tr><td>Response shape</td><td>server decides</td><td>client decides per query</td><td>server decides</td></tr>
<tr><td>HTTP caching</td><td>native (GET, ETag, CDN)</td><td>hard (needs GET + persisted queries)</td><td>none</td></tr>
<tr><td>Status codes</td><td>meaningful</td><td>mostly 200 + <code>errors[]</code></td><td>rich status codes</td></tr>
<tr><td>Best at</td><td>public APIs, CRUD, caching</td><td>many UI clients aggregating many services</td><td>service-to-service, streaming, low latency</td></tr></table>
<blockquote>💡 Real world: the classic production shape is gRPC or REST <em>between</em> services and a single GraphQL layer (a BFF or a federated gateway) <em>at the edge</em>, facing web and mobile clients. GraphQL is a client-facing aggregation layer, not a replacement for your internal RPC.</blockquote>`,
        he: `<p>שרת GraphQL הוא שני דברים: <strong>schema</strong> (‏SDL — החוזה עם הטיפוסים) ו-<strong>resolver-ים</strong> (פונקציה לכל שדה שיודעת להביא אותו). ה-executor עובר על עץ ה-query וקורא ל-resolver עבור כל שדה של כל אובייקט — וההרצה הזאת ברמת השדה היא המקור גם לגמישות וגם לבעיות בפרודקשן.</p>
<pre>type Query {
  order(id: ID!): Order
  orders(first: Int = 20, after: String): OrderConnection!
}
type Order {
  id: ID!
  status: OrderStatus!
  total: Money!
  customer: Customer!        # resolved by the customers service
  items: [LineItem!]!
}
type Customer { id: ID! name: String! email: String @auth(requires: SUPPORT) }</pre>
<pre>// resolvers (Node, Apollo Server / graphql-js)
const resolvers = {
  Query: { order: (_, { id }, ctx) =&gt; ctx.db.orders.byId(id) },
  Order: { customer: (order, _, ctx) =&gt; ctx.loaders.customer.load(order.customerId) }
};</pre>
<table><tr><th></th><th>REST</th><th>GraphQL</th><th>gRPC</th></tr>
<tr><td>חוזה</td><td>OpenAPI (אופציונלי)</td><td>SDL schema (חובה, עם introspection)</td><td>.proto (חובה)</td></tr>
<tr><td>Transport</td><td>HTTP verbs ו-URLs</td><td>בדרך כלל <code>POST /graphql</code> אחד</td><td>HTTP/2, ‏protobuf בינארי</td></tr>
<tr><td>צורת התשובה</td><td>השרת מחליט</td><td>הלקוח מחליט בכל query</td><td>השרת מחליט</td></tr>
<tr><td>HTTP caching</td><td>מובנה (GET, ‏ETag, ‏CDN)</td><td>קשה (צריך GET ו-persisted queries)</td><td>אין</td></tr>
<tr><td>Status codes</td><td>בעלי משמעות</td><td>בעיקר 200 ו-<code>errors[]</code></td><td>status codes עשירים</td></tr>
<tr><td>הכי טוב ל</td><td>API ציבורי, CRUD, caching</td><td>הרבה לקוחות UI שמאגדים הרבה services</td><td>service-to-service, ‏streaming, ‏latency נמוך</td></tr></table>
<blockquote>💡 מהשטח: הצורה הקלאסית בפרודקשן היא gRPC או REST <em>בין</em> ה-services, ושכבת GraphQL אחת (BFF או gateway מפודרל) <em>בקצה</em>, מול לקוחות web ומובייל. GraphQL הוא שכבת אגרגציה מול הלקוח, לא תחליף ל-RPC הפנימי שלך.</blockquote>`
      }
    },
    {
      h: { en: "N+1 and DataLoader batching", he: "N+1 ו-batching עם DataLoader" },
      body: {
        en: `<p>Because each field has its own resolver, a query for 50 orders with their customers naively runs 1 query for the list and then 50 calls to <code>Order.customer</code> — the N+1 problem, built into the execution model. Nest one more level (<code>items { product { seller } }</code>) and it becomes 1 + 50 + 50×N.</p>
<p><strong>DataLoader</strong> fixes it per request: every <code>load(id)</code> call made in the same tick of the event loop is collected, de-duplicated and sent as <em>one</em> batch call, and results are memoized for the rest of the request.</p>
<pre>import DataLoader from "dataloader";

// create NEW loaders per request (in the context factory) — never share across users
function createLoaders(db) {
  return {
    customer: new DataLoader(async (ids) =&gt; {
      const rows = await db.query(
        "SELECT * FROM customers WHERE id = ANY($1)", [ids]);   // 1 query for all ids
      const byId = new Map(rows.map(r =&gt; [r.id, r]));
      return ids.map(id =&gt; byId.get(id) ?? null);               // same order &amp; length as ids!
    }, { maxBatchSize: 500 })
  };
}</pre>
<p>Result: 50 orders + customers = 2 queries instead of 51. Two contract rules break people: the batch function must return an array of the <strong>same length and order</strong> as the keys (return <code>null</code>/an Error for missing ones), and loaders must be <strong>per request</strong> — a global DataLoader caches user A's data and serves it to user B.</p>
<blockquote>⚠️ Production tip: in traces, N+1 looks like a staircase of 50 identical short DB spans under one GraphQL operation. Add a CI check that runs your top 20 operations against a test DB and fails if the SQL statement count grows — it catches the resolver someone added without a loader.</blockquote>`,
        he: `<p>כיוון שלכל שדה יש resolver משלו, query של 50 הזמנות עם הלקוחות שלהן מריץ בצורה נאיבית query אחד לרשימה ואז 50 קריאות ל-<code>Order.customer</code> — בעיית N+1, מובנית במודל ההרצה. תוסיף עוד רמה (<code>items { product { seller } }</code>) וזה הופך ל-1 + 50 + 50×N.</p>
<p><strong>DataLoader</strong> פותר את זה ברמת ה-request: כל קריאות ה-<code>load(id)</code> שנעשו באותו tick של ה-event loop נאספות, עוברות de-dup ונשלחות כקריאת batch <em>אחת</em>, והתוצאות נשמרות ב-memo לשאר ה-request.</p>
<pre>import DataLoader from "dataloader";

// create NEW loaders per request (in the context factory) — never share across users
function createLoaders(db) {
  return {
    customer: new DataLoader(async (ids) =&gt; {
      const rows = await db.query(
        "SELECT * FROM customers WHERE id = ANY($1)", [ids]);   // 1 query for all ids
      const byId = new Map(rows.map(r =&gt; [r.id, r]));
      return ids.map(id =&gt; byId.get(id) ?? null);               // same order &amp; length as ids!
    }, { maxBatchSize: 500 })
  };
}</pre>
<p>התוצאה: 50 הזמנות עם לקוחות = 2 queries במקום 51. שני כללים בחוזה שוברים אנשים: פונקציית ה-batch חייבת להחזיר מערך <strong>באותו אורך ובאותו סדר</strong> כמו המפתחות (להחזיר <code>null</code> או Error לחסרים), וה-loader-ים חייבים להיות <strong>לכל request</strong> — DataLoader גלובלי שומר ב-cache את ה-data של משתמש A ומגיש אותו למשתמש B.</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-traces, ‏N+1 נראה כמו מדרגות של 50 spans זהים וקצרים של DB תחת operation אחד של GraphQL. תוסיף בדיקה ב-CI שמריצה את 20 ה-operations המובילים מול DB של טסטים ונכשלת אם מספר ה-SQL statements עולה — היא תופסת את ה-resolver שמישהו הוסיף בלי loader.</blockquote>`
      }
    },
    {
      h: { en: "Protecting the server: depth, cost, persisted queries", he: "להגן על השרת: עומק, עלות ו-persisted queries" },
      body: {
        en: `<p>With REST you know the worst case of every endpoint. With GraphQL the client writes the query, so one request can be cheap or can fan out to millions of rows. A schema with a cycle (<code>User.friends → [User]</code>) makes this trivial:</p>
<pre>{ user(id: 1) { friends(first: 100) { friends(first: 100) { friends(first: 100) { name } } } } }
# 100 × 100 × 100 = 1,000,000 User objects from a 90-byte request</pre>
<p>Defenses, layered:</p>
<ul><li><strong>Depth limit</strong>: reject queries deeper than ~10-15 levels. Cheap, blunt.</li>
<li><strong>Cost / complexity analysis</strong>: before executing, compute a cost from the AST — each object field costs 1, list fields multiply by their <code>first</code>/<code>limit</code> argument — and reject above a budget (e.g. 1,000 points). GitHub's API does this: a node limit of 500,000 per call and 5,000 points per hour. Shopify's Admin API uses a calculated cost with a leaky bucket and returns it in <code>extensions.cost</code>.</li>
<li><strong>Mandatory pagination</strong>: every list field requires <code>first</code> with a max (e.g. 100). No unbounded lists.</li>
<li><strong>Persisted queries / allowlist</strong>: at build time, the client's queries are extracted and registered by hash; in production the server only accepts known hashes. Arbitrary queries become impossible for first-party apps. (APQ — Automatic Persisted Queries — is a <em>caching</em> optimization, not security: it registers any query on first sight.)</li>
<li><strong>Timeouts and limits</strong>: request timeout (e.g. 10 s), max aliases (alias-based batching like <code>a1: login(...) a2: login(...)</code> bypasses rate limits), max tokens, disable batched arrays, disable introspection in prod for private APIs.</li></ul>
<pre>// GraphQL Armor (Envelop / Apollo / Yoga plugin) — typical prod config
const armor = new ApolloArmor({
  maxDepth:      { n: 10 },
  costLimit:     { maxCost: 5000, objectCost: 2, scalarCost: 1, depthCostFactor: 1.5 },
  maxAliases:    { n: 15 },
  maxTokens:     { n: 1000 },
  maxDirectives: { n: 50 },
  blockFieldSuggestion: { enabled: true }   // no "Did you mean ...?" schema leaks
});</pre>
<blockquote>💡 Real world: rate-limit by <em>cost</em>, not by request count. 100 requests/min means nothing when one request can be worth 1 point and another 50,000.</blockquote>`,
        he: `<p>ב-REST אתה יודע מה ה-worst case של כל endpoint. ב-GraphQL הלקוח כותב את ה-query, אז request אחד יכול להיות זול או להתפצל למיליוני שורות. Schema עם מעגל (<code>User.friends → [User]</code>) הופך את זה לטריוויאלי:</p>
<pre>{ user(id: 1) { friends(first: 100) { friends(first: 100) { friends(first: 100) { name } } } } }
# 100 × 100 × 100 = 1,000,000 User objects from a 90-byte request</pre>
<p>ההגנות, בשכבות:</p>
<ul><li><strong>Depth limit</strong>: לדחות queries עמוקים מ-10-15 רמות בערך. זול וגס.</li>
<li><strong>ניתוח cost / complexity</strong>: לפני ההרצה מחשבים עלות מה-AST — כל שדה אובייקט עולה 1, שדות רשימה מוכפלים בארגומנט <code>first</code>/<code>limit</code> — ודוחים מעל תקציב (למשל 1,000 נקודות). ה-API של GitHub עושה את זה: מגבלה של 500,000 nodes לקריאה ו-5,000 נקודות לשעה. ה-Admin API של Shopify משתמש ב-calculated cost עם leaky bucket ומחזיר אותו ב-<code>extensions.cost</code>.</li>
<li><strong>Pagination חובה</strong>: כל שדה רשימה דורש <code>first</code> עם מקסימום (למשל 100). אין רשימות בלי גבול.</li>
<li><strong>Persisted queries / allowlist</strong>: בזמן ה-build מחלצים את ה-queries של הלקוח ורושמים אותם לפי hash; בפרודקשן השרת מקבל רק hash-ים מוכרים. Queries שרירותיים הופכים לבלתי אפשריים לאפליקציות שלך. (APQ — ‏Automatic Persisted Queries — היא אופטימיזציה של <em>caching</em>, לא אבטחה: היא רושמת כל query בפעם הראשונה שהיא רואה אותו.)</li>
<li><strong>Timeouts ומגבלות</strong>: timeout ל-request (למשל 10 שניות), מקסימום aliases (batching דרך aliases כמו <code>a1: login(...) a2: login(...)</code> עוקף rate limits), מקסימום tokens, לבטל מערכים של batch, ולכבות introspection בפרודקשן ל-API פרטי.</li></ul>
<pre>// GraphQL Armor (Envelop / Apollo / Yoga plugin) — typical prod config
const armor = new ApolloArmor({
  maxDepth:      { n: 10 },
  costLimit:     { maxCost: 5000, objectCost: 2, scalarCost: 1, depthCostFactor: 1.5 },
  maxAliases:    { n: 15 },
  maxTokens:     { n: 1000 },
  maxDirectives: { n: 50 },
  blockFieldSuggestion: { enabled: true }   // no "Did you mean ...?" schema leaks
});</pre>
<blockquote>💡 מהשטח: תעשה rate limit לפי <em>עלות</em>, לא לפי מספר requests. ‏100 requests לדקה לא אומר כלום כשבקשה אחת שווה נקודה אחת ואחרת 50,000.</blockquote>`
      }
    },
    {
      h: { en: "Caching and the error model", he: "Caching ומודל השגיאות" },
      body: {
        en: `<p><strong>Why HTTP caching breaks:</strong> every operation is a <code>POST /graphql</code> with the query in the body — CDNs and browsers don't cache POST, and the URL is identical for every query. Three layers solve it differently:</p>
<ul><li><strong>Client-side normalized cache</strong> (Apollo Client, Relay, urql Graphcache): splits responses into objects keyed by <code>__typename:id</code>, so updating <code>Order:42</code> in one query updates every screen showing it. Requires every type to expose a stable <code>id</code>.</li>
<li><strong>CDN caching with GET + persisted queries</strong>: send <code>GET /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"ecf4..."}}&amp;variables={"id":"42"}</code>. Now the URL is short and stable, the CDN can key on it, and the server sets <code>Cache-Control</code> — usually the minimum <code>maxAge</code> across all fields in the response (Apollo's <code>@cacheControl(maxAge: 60)</code>; any field marked <code>scope: PRIVATE</code> makes the whole response private).</li>
<li><strong>Server-side</strong>: DataLoader per request, plus a shared cache (Redis) at the resolver or data-source level for hot entities.</li></ul>
<p><strong>The error model:</strong> a GraphQL response is usually <code>HTTP 200</code> even when parts failed. Partial success is a feature — one broken field shouldn't blank the whole screen:</p>
<pre>HTTP/1.1 200 OK
{
  "data":   { "order": { "id": "42", "status": "SHIPPED", "customer": null } },
  "errors": [ { "message": "customers service unavailable",
                "path": ["order", "customer"],
                "extensions": { "code": "UPSTREAM_UNAVAILABLE", "retryable": true } } ]
}</pre>
<p>Consequences: your load balancer's 5xx rate says nothing about GraphQL health — you must count <code>errors[]</code> by <code>extensions.code</code>. Many teams also model expected business errors as types in the schema (<code>union PlaceOrderResult = Order | OutOfStock | PaymentDeclined</code>) and keep <code>errors[]</code> for unexpected failures. The GraphQL-over-HTTP spec allows 4xx/5xx with <code>application/graphql-response+json</code> when the whole request fails (parse/validation errors → 400).</p>
<blockquote>⚠️ Production tip: never put raw exception messages or stack traces in <code>errors[].message</code> — mask unexpected errors to "Internal error" plus a request id, and log the details server-side.</blockquote>`,
        he: `<p><strong>למה HTTP caching נשבר:</strong> כל operation הוא <code>POST /graphql</code> עם ה-query ב-body — CDN-ים ודפדפנים לא שומרים POST ב-cache, וה-URL זהה לכל query. שלוש שכבות פותרות את זה בדרכים שונות:</p>
<ul><li><strong>Cache מנורמל בצד הלקוח</strong> (Apollo Client, ‏Relay, ‏urql Graphcache): מפרק תשובות לאובייקטים לפי מפתח <code>__typename:id</code>, כך שעדכון של <code>Order:42</code> ב-query אחד מעדכן כל מסך שמציג אותו. דורש שכל type יחשוף <code>id</code> יציב.</li>
<li><strong>Caching ב-CDN עם GET ו-persisted queries</strong>: שולחים <code>GET /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"ecf4..."}}&amp;variables={"id":"42"}</code>. עכשיו ה-URL קצר ויציב, ה-CDN יכול להשתמש בו כמפתח, והשרת קובע <code>Cache-Control</code> — בדרך כלל ה-<code>maxAge</code> המינימלי מכל השדות בתשובה (ב-Apollo זה <code>@cacheControl(maxAge: 60)</code>; כל שדה שמסומן <code>scope: PRIVATE</code> הופך את כל התשובה ל-private).</li>
<li><strong>בצד השרת</strong>: DataLoader לכל request, ועוד cache משותף (Redis) ברמת ה-resolver או ה-data source לישויות חמות.</li></ul>
<p><strong>מודל השגיאות:</strong> תשובת GraphQL היא בדרך כלל <code>HTTP 200</code> גם כשחלקים נכשלו. הצלחה חלקית היא פיצ'ר — שדה אחד שבור לא אמור להשאיר את כל המסך ריק:</p>
<pre>HTTP/1.1 200 OK
{
  "data":   { "order": { "id": "42", "status": "SHIPPED", "customer": null } },
  "errors": [ { "message": "customers service unavailable",
                "path": ["order", "customer"],
                "extensions": { "code": "UPSTREAM_UNAVAILABLE", "retryable": true } } ]
}</pre>
<p>ההשלכות: שיעור ה-5xx של ה-load balancer לא אומר כלום על הבריאות של GraphQL — אתה חייב לספור את <code>errors[]</code> לפי <code>extensions.code</code>. הרבה צוותים גם ממדלים שגיאות עסקיות צפויות כ-types ב-schema ‏(<code>union PlaceOrderResult = Order | OutOfStock | PaymentDeclined</code>) ומשאירים את <code>errors[]</code> לכישלונות לא צפויים. ה-spec של GraphQL-over-HTTP מאפשר 4xx/5xx עם <code>application/graphql-response+json</code> כשכל ה-request נכשל (שגיאות parse או validation מחזירות 400).</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם אל תכניס הודעות exception גולמיות או stack traces ל-<code>errors[].message</code> — תמסך שגיאות לא צפויות ל-"Internal error" יחד עם request id, ותכתוב את הפרטים ללוג בצד השרת.</blockquote>`
      }
    },
    {
      h: { en: "Federation, per-field auth and per-resolver observability", he: "Federation, הרשאות לכל שדה ו-observability לכל resolver" },
      body: {
        en: `<p><strong>Federation</strong> splits one graph across teams. Each service owns a <em>subgraph</em>; a composition step builds the <em>supergraph</em> schema; a router (Apollo Router, written in Rust, or open alternatives like Cosmo Router / Hive Gateway) plans each query and fans out to subgraphs.</p>
<pre># orders subgraph                         # customers subgraph
type Order @key(fields: "id") {           type Customer @key(fields: "id") {
  id: ID!                                   id: ID!
  customer: Customer!                       name: String!
}                                         }
type Customer @key(fields: "id") {        # the router calls
  id: ID!            # stub: reference    #   _entities(representations: [{__typename:"Customer", id:"7"}])
}                                         # to resolve the rest</pre>
<pre>rover supergraph compose --config supergraph.yaml &gt; supergraph.graphql
rover subgraph check my-graph@prod --name orders --schema orders.graphql   # breaking-change check vs real traffic</pre>
<p>Schema checks against recorded operations are the real value: CI fails if a field you want to remove was used by any client in the last 7 days.</p>
<p><strong>Auth per field:</strong> authenticate once at the gateway (JWT → context), but authorize <em>in the graph</em>, because the same <code>Customer.email</code> is reachable from <code>order.customer</code>, <code>search</code>, <code>node(id:)</code>... Put the check on the field or the type (a directive like <code>@auth(requires: SUPPORT)</code> or <code>@requiresScopes</code> in Federation 2.5+), or better in the data layer the resolver calls, so every path is covered.</p>
<p><strong>Observability:</strong> a single <code>POST /graphql</code> p99 is useless — it mixes a 5 ms <code>viewer</code> query with a 3 s report. Label metrics by <strong>operation name</strong> (require clients to name operations, reject anonymous ones), record per-resolver timings (Apollo usage reporting, OpenTelemetry spans for resolvers above a threshold — a span for every scalar field adds massive overhead), and track <code>errors[]</code> by code and path.</p>
<blockquote>💡 Real world: the most useful single dashboard for a GraphQL gateway is "top operations by total time (count × p50)" — it tells you which query to optimize first, and it is impossible to build from HTTP-level metrics.</blockquote>`,
        he: `<p><strong>Federation</strong> מפצל graph אחד בין צוותים. כל service מחזיק <em>subgraph</em>; שלב composition בונה את ה-schema של ה-<em>supergraph</em>; ו-router ‏(Apollo Router שכתוב ב-Rust, או חלופות פתוחות כמו Cosmo Router או Hive Gateway) מתכנן כל query ומפזר אותו ל-subgraph-ים.</p>
<pre># orders subgraph                         # customers subgraph
type Order @key(fields: "id") {           type Customer @key(fields: "id") {
  id: ID!                                   id: ID!
  customer: Customer!                       name: String!
}                                         }
type Customer @key(fields: "id") {        # the router calls
  id: ID!            # stub: reference    #   _entities(representations: [{__typename:"Customer", id:"7"}])
}                                         # to resolve the rest</pre>
<pre>rover supergraph compose --config supergraph.yaml &gt; supergraph.graphql
rover subgraph check my-graph@prod --name orders --schema orders.graphql   # breaking-change check vs real traffic</pre>
<p>הערך האמיתי הוא schema checks מול operations שהוקלטו: ה-CI נכשל אם שדה שאתה רוצה להסיר שימש לקוח כלשהו ב-7 הימים האחרונים.</p>
<p><strong>הרשאות לכל שדה:</strong> עושים authentication פעם אחת ב-gateway ‏(JWT לתוך ה-context), אבל authorization עושים <em>בתוך ה-graph</em>, כי לאותו <code>Customer.email</code> אפשר להגיע מ-<code>order.customer</code>, מ-<code>search</code>, מ-<code>node(id:)</code>... שים את הבדיקה על השדה או על ה-type (directive כמו <code>@auth(requires: SUPPORT)</code> או <code>@requiresScopes</code> ב-Federation 2.5 ומעלה), או עדיף בשכבת ה-data שה-resolver קורא לה, כך שכל מסלול מכוסה.</p>
<p><strong>Observability:</strong> ‏p99 אחד של <code>POST /graphql</code> חסר תועלת — הוא מערבב query של <code>viewer</code> ב-5 ms עם דוח של 3 שניות. תתייג metrics לפי <strong>operation name</strong> (תחייב לקוחות לתת שם ל-operations ותדחה אנונימיים), תמדוד זמנים לכל resolver ‏(Apollo usage reporting, או spans של OpenTelemetry ל-resolver-ים מעל סף — span לכל שדה scalar מוסיף overhead עצום), ותספור את <code>errors[]</code> לפי code ו-path.</p>
<blockquote>💡 מהשטח: ה-dashboard הבודד הכי שימושי ל-gateway של GraphQL הוא "ה-operations המובילים לפי זמן כולל (count × p50)" — הוא אומר לך איזה query לייעל קודם, ואי אפשר לבנות אותו מ-metrics ברמת HTTP.</blockquote>`
      }
    },
    {
      h: { en: "When not to use GraphQL", he: "מתי לא להשתמש ב-GraphQL" },
      body: {
        en: `<ul><li><strong>Service-to-service calls</strong>: you control both sides; gRPC gives you deadlines, streaming, binary encoding and simpler ops.</li>
<li><strong>Public, cache-heavy, read-mostly APIs</strong> (catalogs, content): REST + CDN + ETag is simpler and caches for free.</li>
<li><strong>One client, a handful of screens</strong>: a small BFF with REST endpoints shaped for those screens costs less than a schema, a gateway, cost analysis and persisted-query tooling.</li>
<li><strong>File upload/download and big binary payloads</strong>: use pre-signed URLs; multipart uploads over GraphQL are a CSRF and complexity headache.</li>
<li><strong>Bulk exports / analytics</strong>: a 2 M-row export doesn't belong in a JSON response tree; return a job id and a file.</li></ul>
<p>GraphQL earns its cost when you have <strong>many clients</strong> (web, iOS, Android, partners) with different data needs over <strong>many backend services</strong>, and a team willing to own the gateway as a product.</p>`,
        he: `<ul><li><strong>קריאות service-to-service</strong>: אתה שולט בשני הצדדים; gRPC נותן deadlines, ‏streaming, קידוד בינארי ותפעול פשוט יותר.</li>
<li><strong>API ציבורי שרובו קריאות ו-cache</strong> (קטלוגים, תוכן): ‏REST עם CDN ו-ETag פשוט יותר ומקבל caching בחינם.</li>
<li><strong>לקוח אחד וכמה מסכים</strong>: BFF קטן עם endpoints של REST שתפורים למסכים האלה עולה פחות מ-schema, ‏gateway, ניתוח עלות וכלים ל-persisted queries.</li>
<li><strong>העלאה והורדה של קבצים ו-payloads בינאריים גדולים</strong>: תשתמש ב-pre-signed URLs; העלאות multipart דרך GraphQL הן כאב ראש של CSRF ומורכבות.</li>
<li><strong>Exports גדולים ואנליטיקה</strong>: export של 2 מיליון שורות לא שייך לעץ תשובה של JSON; תחזיר job id וקובץ.</li></ul>
<p>GraphQL מצדיק את המחיר שלו כשיש לך <strong>הרבה לקוחות</strong> (web, ‏iOS, ‏Android, שותפים) עם צרכי data שונים מעל <strong>הרבה services</strong> בבקאנד, וצוות שמוכן להחזיק את ה-gateway כמוצר.</p>`
      }
    }
  ],
  diagram: `web / iOS / Android
        │  POST /graphql  (or GET + persisted query hash → CDN)
        ▼
  ┌──────────────── Router / gateway ─────────────────┐
  │ parse → validate → depth/cost check → query plan  │
  │ authN (JWT) · operation-name metrics · timeouts   │
  └─────┬───────────────────┬──────────────────┬──────┘
        ▼                   ▼                  ▼
  orders subgraph     customers subgraph   catalog subgraph
  resolvers +         resolvers +          resolvers +
  DataLoader          DataLoader           DataLoader
        ▼                   ▼                  ▼
     Postgres            gRPC svc           Redis / ES`,
  handsOn: [
    { cmd: `curl -s https://api.example.com/graphql -H 'content-type: application/json' -d '{"query":"query OrderPage($id: ID!){ order(id:$id){ id status } }","variables":{"id":"42"},"operationName":"OrderPage"}'`,
      what: { en: "A raw GraphQL call: one POST with query, variables and an operation name. Look at the 200 + data/errors shape.", he: "קריאת GraphQL גולמית: ‏POST אחד עם query, ‏variables ו-operation name. תסתכל על הצורה של 200 עם data ו-errors." } },
    { cmd: `curl -s -X POST https://api.example.com/graphql -H 'content-type: application/json' -d '{"query":"{ __schema { types { name } } }"}' | jq '.data.__schema.types | length'`,
      what: { en: "Check whether introspection is open in production. For a private API it should be disabled.", he: "תבדוק אם introspection פתוח בפרודקשן. ל-API פרטי הוא צריך להיות כבוי." } },
    { cmd: `curl -sG https://api.example.com/graphql --data-urlencode 'extensions={"persistedQuery":{"version":1,"sha256Hash":"<sha256 of query>"}}' --data-urlencode 'variables={"id":"42"}' -D - -o /dev/null | grep -i -E 'cache-control|age|x-cache'`,
      what: { en: "A persisted query over GET: check the Cache-Control the server returns and whether the CDN reports a HIT.", he: "Persisted query דרך GET: תבדוק איזה Cache-Control השרת מחזיר והאם ה-CDN מדווח HIT." } },
    { cmd: "rover subgraph check my-graph@prod --name orders --schema ./orders.graphql",
      what: { en: "Federation schema check: composition errors plus breaking changes against real client operations.", he: "Schema check ב-Federation: שגיאות composition ו-breaking changes מול operations אמיתיים של לקוחות." } }
  ],
  mnemonic: {
    en: "\"LCD-FAO\": Loaders per request, Cost limits, Don't trust POST caching (persist + GET), Federate by team, Authorize per field, Observe per operation.",
    he: "\"LCD-FAO\": ‏Loaders לכל request, ‏Cost limits, ‏Don't trust POST caching (persist + GET), ‏Federate לפי צוות, ‏Authorize לכל שדה, ‏Observe לפי operation."
  },
  pitfalls: [
    { en: "A global (shared) DataLoader instance: it caches across requests and leaks one user's data to another. Create loaders in the per-request context.", he: "מופע DataLoader גלובלי ומשותף: הוא שומר cache בין requests ומדליף data של משתמש אחד לאחר. תיצור loader-ים ב-context של כל request." },
    { en: "Only a depth limit: a depth-3 query with first: 1000 on each list is still a billion objects. You need cost analysis that multiplies by list sizes.", he: "רק depth limit: ‏query בעומק 3 עם first: 1000 על כל רשימה זה עדיין מיליארד אובייקטים. צריך ניתוח עלות שמכפיל בגודל הרשימות." },
    { en: "Alerting on HTTP 5xx: GraphQL failures come back as 200 with errors[]. Alert on errors by extensions.code and operation name.", he: "התראות על HTTP 5xx: כישלונות של GraphQL חוזרים כ-200 עם errors[]. תתריע על שגיאות לפי extensions.code ו-operation name." },
    { en: "Authorizing only in the resolver of the top-level query: the same sensitive field is reachable through other paths (node(id:), search, nested objects).", he: "Authorization רק ב-resolver של ה-query העליון: לאותו שדה רגיש אפשר להגיע דרך מסלולים אחרים (node(id:), ‏search, אובייקטים מקוננים)." }
  ],
  interview: [
    { q: { en: "How do you stop a malicious client from sending an expensive GraphQL query?", he: "איך אתה מונע מלקוח זדוני לשלוח query יקר ב-GraphQL?" },
      a: { en: "Layers: persisted-query allowlist for first-party clients (arbitrary queries rejected), static cost analysis multiplying list sizes with a per-request budget and per-client cost-based rate limit, depth/alias/token limits, mandatory pagination with max page size, request timeouts and DB statement timeouts, and per-operation monitoring to spot new expensive shapes.", he: "שכבות: allowlist של persisted queries ללקוחות שלך (queries שרירותיים נדחים), ניתוח עלות סטטי שמכפיל בגודל רשימות עם תקציב לכל request ו-rate limit לפי עלות לכל לקוח, מגבלות על עומק, ‏aliases ו-tokens, ‏pagination חובה עם גודל עמוד מקסימלי, ‏timeouts ל-request ו-statement timeout ב-DB, ומוניטורינג לפי operation כדי לזהות צורות יקרות חדשות." } },
    { q: { en: "Why is caching harder in GraphQL than REST, and how do you get CDN caching anyway?", he: "למה caching קשה יותר ב-GraphQL מאשר ב-REST, ואיך בכל זאת מקבלים caching ב-CDN?" },
      a: { en: "Queries go as POST to one URL, so URL-keyed HTTP caches can't help, and a response mixes fields with different freshness. Fix: persisted queries sent as GET (short stable URL = hash + variables), with the server computing Cache-Control as the minimum maxAge across fields and marking responses private if any field is user-specific. On the client, a normalized cache keyed by __typename:id.", he: "ה-queries נשלחים כ-POST ל-URL אחד, אז caches שממפתחים לפי URL לא עוזרים, ותשובה מערבבת שדות עם רעננות שונה. הפתרון: persisted queries שנשלחים כ-GET ‏(URL קצר ויציב = hash ועוד variables), כשהשרת מחשב Cache-Control כ-maxAge המינימלי מכל השדות ומסמן private אם שדה כלשהו ספציפי למשתמש. בצד הלקוח: cache מנורמל לפי __typename:id." } }
  ],
  quiz: [
    { q: { en: "A query for 100 posts with their authors issues 101 SQL queries. What is the standard GraphQL fix?", he: "Query של 100 פוסטים עם הכותבים שלהם מריץ 101 שאילתות SQL. מה הפתרון הסטנדרטי ב-GraphQL?" },
      options: [
        { en: "Add an index on authors.id", he: "להוסיף index על authors.id" },
        { en: "A per-request DataLoader that batches author ids into one WHERE id = ANY(...) query", he: "DataLoader לכל request שמאגד את ה-ids של הכותבים ל-query אחד עם WHERE id = ANY(...)" },
        { en: "A depth limit of 2", he: "Depth limit של 2" },
        { en: "Switch the endpoint to GET", he: "להעביר את ה-endpoint ל-GET" }
      ], answer: 1,
      explain: { en: "The cost is 100 round trips, not a missing index. DataLoader collects all load() calls in the same tick and issues one batch, turning 101 queries into 2.", he: "המחיר הוא 100 הלוך-חזור, לא index חסר. ‏DataLoader אוסף את כל קריאות ה-load() באותו tick ושולח batch אחד, כך ש-101 queries הופכים ל-2." } },
    { q: { en: "Your GraphQL gateway shows 0.01% HTTP 5xx, but users report broken screens. Most likely why?", he: "ה-gateway של GraphQL מראה 0.01% של HTTP 5xx, אבל משתמשים מדווחים על מסכים שבורים. מה הסיבה הסבירה?" },
      options: [
        { en: "The CDN is hiding errors", he: "ה-CDN מסתיר שגיאות" },
        { en: "Partial failures return HTTP 200 with an errors[] array, which the 5xx metric never sees", he: "כישלונות חלקיים חוזרים כ-HTTP 200 עם מערך errors[], שה-metric של 5xx לא רואה בכלל" },
        { en: "DataLoader is swallowing exceptions", he: "ה-DataLoader בולע exceptions" },
        { en: "Introspection is disabled", he: "Introspection כבוי" }
      ], answer: 1,
      explain: { en: "GraphQL's error model returns 200 with data plus errors[]. Health must be measured by counting errors by code/path/operation, not by HTTP status.", he: "מודל השגיאות של GraphQL מחזיר 200 עם data ועוד errors[]. צריך למדוד בריאות לפי ספירת שגיאות לפי code, ‏path ו-operation, לא לפי HTTP status." } },
    { q: { en: "Which control actually prevents arbitrary queries from your own mobile app's API?", he: "איזה מנגנון באמת מונע queries שרירותיים מה-API של אפליקציית המובייל שלך?" },
      options: [
        { en: "Automatic Persisted Queries (APQ)", he: "Automatic Persisted Queries ‏(APQ)" },
        { en: "Disabling introspection", he: "לכבות introspection" },
        { en: "A persisted-query allowlist registered at build time, rejecting unknown hashes", he: "Allowlist של persisted queries שנרשם בזמן build ודוחה hash-ים לא מוכרים" },
        { en: "A normalized client cache", he: "Cache מנורמל בצד הלקוח" }
      ], answer: 2,
      explain: { en: "APQ registers any query on first use, so it's a caching optimization. Disabling introspection only hides the schema. Only a build-time allowlist rejects queries the app never shipped.", he: "APQ רושם כל query בשימוש הראשון, אז זו אופטימיזציה של caching. כיבוי introspection רק מסתיר את ה-schema. רק allowlist מזמן ה-build דוחה queries שהאפליקציה מעולם לא שלחה." } },
    { q: { en: "In Apollo Federation, how does the router fetch Customer.name for an Order owned by another subgraph?", he: "ב-Apollo Federation, איך ה-router מביא את Customer.name עבור Order שנמצא ב-subgraph אחר?" },
      options: [
        { en: "The orders subgraph calls the customers database directly", he: "ה-subgraph של orders קורא ישירות ל-DB של customers" },
        { en: "It calls the customers subgraph's _entities field with representations keyed by @key (e.g. id)", he: "הוא קורא לשדה _entities של ה-subgraph של customers עם representations לפי ה-@key (למשל id)" },
        { en: "It merges both databases into the supergraph", he: "הוא ממזג את שני ה-DB-ים לתוך ה-supergraph" },
        { en: "Clients must send two separate queries", he: "הלקוחות חייבים לשלוח שני queries נפרדים" }
      ], answer: 1,
      explain: { en: "Entities declare @key fields. The query plan fetches orders first, then sends batched representations {__typename, id} to the owning subgraph's _entities resolver.", he: "ישויות מצהירות על שדות @key. ה-query plan מביא קודם את ה-orders, ואז שולח representations מאוגדים {__typename, id} ל-resolver של _entities ב-subgraph שמחזיק אותן." } }
  ],
  related: ["pr-api-design", "pr-integration-styles", "net-grpc-production", "arch-api-gateway", "net-proxies-cdn", "pr-rate-limiters"]
});

// ---------------------------------------------------------------------------
// 2. WebAssembly & Edge Compute
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "arch-wasm-edge",
  track: "architecture",
  order: 61,
  icon: "⚡",
  level: 3,
  minutes: 14,
  title: { en: "WebAssembly & Edge Compute", he: "WebAssembly ו-Edge Compute" },
  tldr: {
    en: "Wasm is portable, sandboxed bytecode that starts in microseconds; V8 isolates and Wasm runtimes let you run code in 300+ edge locations with near-zero cold starts — in exchange for tight CPU, memory and API limits.",
    he: "Wasm הוא bytecode נייד ומבודד שעולה במיקרו-שניות; V8 isolates ו-runtimes של Wasm מאפשרים להריץ קוד ב-300 ומעלה מיקומי edge כמעט בלי cold start — בתמורה למגבלות הדוקות של CPU, זיכרון ו-API."
  },
  analogy: {
    en: "A container is a furnished apartment: its own kitchen, its own plumbing, takes a while to move into. A V8 isolate or Wasm instance is a hotel room in a building that's already running — the elevator, electricity and security desk are shared, you get a key card in milliseconds, but you can't bring your own stove or knock down walls. Edge platforms are hotel chains with a branch on every street corner.",
    he: "Container זו דירה מרוהטת: מטבח משלה, צנרת משלה, ולוקח זמן להיכנס אליה. V8 isolate או instance של Wasm זה חדר במלון שכבר פועל — המעלית, החשמל והקבלה משותפים, אתה מקבל כרטיס מגנטי תוך מילישניות, אבל אסור להביא כיריים משלך או להפיל קירות. פלטפורמות edge הן רשתות מלונות עם סניף בכל פינת רחוב."
  },
  sections: [
    {
      h: { en: "What Wasm is: sandboxed bytecode, WASI and the component model", he: "מה זה Wasm: ‏bytecode מבודד, ‏WASI וה-component model" },
      body: {
        en: `<p><strong>WebAssembly</strong> is a compact binary instruction format for a stack-based virtual machine. You compile Rust, C/C++, Go (TinyGo or Go 1.21+ <code>GOOS=wasip1</code>), Zig or C# to a <code>.wasm</code> module; a runtime (V8, Wasmtime, WasmEdge, Wasmer) validates it and JIT/AOT-compiles it to native code.</p>
<p>Its security model is what makes it interesting for infra:</p>
<ul><li><strong>Linear memory</strong>: a module sees only its own bounds-checked byte array. It cannot read the host's memory or another instance's.</li>
<li><strong>No ambient authority</strong>: a module has no syscalls at all. It can only call functions the host explicitly <em>imports</em> into it — no files, sockets or clock unless granted (capability-based security).</li>
<li><strong>Deterministic validation</strong>: control flow is structured, so the runtime verifies the whole module before running a single instruction.</li></ul>
<p><strong>WASI</strong> is the standard set of system interfaces for Wasm outside the browser. WASI Preview 1 (<code>wasip1</code>) was POSIX-like (files, clocks, random). <strong>WASI 0.2</strong> (Preview 2, released January 2024) is built on the <strong>component model</strong>: modules described by typed interfaces in <strong>WIT</strong>, so a Rust component and a Python component can call each other with rich types (strings, records, lists) without sharing memory.</p>
<pre>// world.wit — the contract a component exports/imports
package acme:auth@1.0.0;

interface verifier {
  record claims { sub: string, scopes: list&lt;string&gt;, exp: u64 }
  verify: func(token: string) -&gt; result&lt;claims, string&gt;;
}

world auth-plugin {
  import wasi:clocks/wall-clock@0.2.0;   // the only capability granted
  export verifier;
}</pre>
<blockquote>💡 Real world: Solomon Hykes (Docker co-founder) tweeted in 2019 that if Wasm+WASI had existed in 2008, they wouldn't have needed to create Docker. It's not a container replacement yet — but for small, untrusted, fast-starting code, it's the better sandbox.</blockquote>`,
        he: `<p><strong>WebAssembly</strong> הוא פורמט הוראות בינארי קומפקטי למכונה וירטואלית מבוססת stack. מקמפלים Rust, ‏C/C++, ‏Go ‏(TinyGo או Go 1.21 ומעלה עם <code>GOOS=wasip1</code>), ‏Zig או C# למודול <code>.wasm</code>; ‏runtime ‏(V8, ‏Wasmtime, ‏WasmEdge, ‏Wasmer) מאמת אותו ומקמפל אותו ב-JIT או AOT לקוד native.</p>
<p>מודל האבטחה הוא מה שהופך אותו למעניין בתשתיות:</p>
<ul><li><strong>Linear memory</strong>: מודול רואה רק מערך בתים משלו עם בדיקת גבולות. הוא לא יכול לקרוא את הזיכרון של ה-host או של instance אחר.</li>
<li><strong>אין הרשאות ברירת מחדל</strong>: למודול אין syscalls בכלל. הוא יכול לקרוא רק לפונקציות שה-host עושה להן <em>import</em> במפורש — בלי קבצים, sockets או שעון אלא אם נתנו לו (אבטחה מבוססת capabilities).</li>
<li><strong>Validation דטרמיניסטי</strong>: ה-control flow מובנה, אז ה-runtime מאמת את כל המודול לפני שהוא מריץ הוראה אחת.</li></ul>
<p><strong>WASI</strong> הוא סט סטנדרטי של ממשקי מערכת ל-Wasm מחוץ לדפדפן. ‏WASI Preview 1 ‏(<code>wasip1</code>) היה דומה ל-POSIX (קבצים, שעונים, random). ‏<strong>WASI 0.2</strong> ‏(Preview 2, שוחרר בינואר 2024) בנוי על ה-<strong>component model</strong>: מודולים שמתוארים בממשקים עם טיפוסים ב-<strong>WIT</strong>, כך ש-component ב-Rust ו-component ב-Python יכולים לקרוא אחד לשני עם טיפוסים עשירים (strings, ‏records, ‏lists) בלי לשתף זיכרון.</p>
<pre>// world.wit — the contract a component exports/imports
package acme:auth@1.0.0;

interface verifier {
  record claims { sub: string, scopes: list&lt;string&gt;, exp: u64 }
  verify: func(token: string) -&gt; result&lt;claims, string&gt;;
}

world auth-plugin {
  import wasi:clocks/wall-clock@0.2.0;   // the only capability granted
  export verifier;
}</pre>
<blockquote>💡 מהשטח: ‏Solomon Hykes (ממייסדי Docker) צייץ ב-2019 שאם Wasm ו-WASI היו קיימים ב-2008, לא היו צריכים להמציא את Docker. זה עדיין לא תחליף ל-containers — אבל לקוד קטן, לא אמין ושעולה מהר, זה ה-sandbox הטוב יותר.</blockquote>`
      }
    },
    {
      h: { en: "Server-side Wasm: Wasmtime, Spin, wasmCloud", he: "Wasm בצד השרת: ‏Wasmtime, ‏Spin, ‏wasmCloud" },
      body: {
        en: `<p><strong>Wasmtime</strong> (Bytecode Alliance) is the reference runtime: Cranelift compiler, WASI 0.2, used inside Fastly, Spin, and many plugin hosts. Instantiating a pre-compiled module takes on the order of <strong>microseconds</strong> — so you can create a fresh, isolated instance <em>per request</em> and throw it away afterward. No warm pool, no state leaking between requests.</p>
<p><strong>Spin</strong> (Fermyon, a CNCF sandbox project) is a framework for HTTP/event-driven Wasm microservices:</p>
<pre>$ spin new -t http-rust hello &amp;&amp; cd hello
$ spin build          # cargo build --target wasm32-wasip1 → ~2 MB .wasm
$ spin up             # Serving http://127.0.0.1:3000

# spin.toml
spin_manifest_version = 2
[application]
name = "hello"
[[trigger.http]]
route = "/api/..."
component = "hello"
[component.hello]
source = "target/wasm32-wasip1/release/hello.wasm"
allowed_outbound_hosts = ["https://api.stripe.com"]   # capability: nothing else is reachable
key_value_stores = ["default"]</pre>
<p><strong>wasmCloud</strong> (CNCF incubating) takes a different angle: components declare <em>what</em> they need (a key-value store, HTTP, messaging) via WIT interfaces, and <em>providers</em> linked at deploy time decide <em>how</em> (Redis vs NATS KV), across a lattice of hosts in different clouds/edges.</p>
<table><tr><th></th><th>Linux container</th><th>Wasm component</th></tr>
<tr><td>Artifact size</td><td>20-500 MB image</td><td>0.5-10 MB</td></tr>
<tr><td>Cold start</td><td>~100 ms to seconds</td><td>~µs to low ms</td></tr>
<tr><td>Isolation</td><td>kernel namespaces/cgroups (shared kernel)</td><td>language VM sandbox + capabilities</td></tr>
<tr><td>Portability</td><td>per CPU arch (amd64/arm64 images)</td><td>one binary for any arch</td></tr>
<tr><td>Ecosystem</td><td>everything runs</td><td>no threads in most runtimes yet, limited libraries, no fork/exec</td></tr></table>`,
        he: `<p><strong>Wasmtime</strong> ‏(Bytecode Alliance) הוא ה-runtime המרכזי: קומפיילר Cranelift, ‏WASI 0.2, ומשמש בתוך Fastly, ‏Spin והרבה plugin hosts. יצירת instance ממודול שכבר קומפל לוקחת סדר גודל של <strong>מיקרו-שניות</strong> — אז אפשר ליצור instance טרי ומבודד <em>לכל request</em> ולזרוק אותו אחר כך. בלי warm pool, בלי state שדולף בין requests.</p>
<p><strong>Spin</strong> ‏(Fermyon, פרויקט sandbox ב-CNCF) הוא framework ל-microservices של Wasm מבוססי HTTP ו-events:</p>
<pre>$ spin new -t http-rust hello &amp;&amp; cd hello
$ spin build          # cargo build --target wasm32-wasip1 → ~2 MB .wasm
$ spin up             # Serving http://127.0.0.1:3000

# spin.toml
spin_manifest_version = 2
[application]
name = "hello"
[[trigger.http]]
route = "/api/..."
component = "hello"
[component.hello]
source = "target/wasm32-wasip1/release/hello.wasm"
allowed_outbound_hosts = ["https://api.stripe.com"]   # capability: nothing else is reachable
key_value_stores = ["default"]</pre>
<p><strong>wasmCloud</strong> ‏(CNCF incubating) לוקח זווית אחרת: components מצהירים <em>מה</em> הם צריכים (key-value store, ‏HTTP, ‏messaging) דרך ממשקי WIT, ו-<em>providers</em> שמחוברים בזמן ה-deploy מחליטים <em>איך</em> ‏(Redis או NATS KV), על פני lattice של hosts בעננים וב-edge שונים.</p>
<table><tr><th></th><th>Linux container</th><th>Wasm component</th></tr>
<tr><td>גודל artifact</td><td>image של 20-500 MB</td><td>0.5-10 MB</td></tr>
<tr><td>Cold start</td><td>~100 ms עד שניות</td><td>מיקרו-שניות עד מילישניות בודדות</td></tr>
<tr><td>בידוד</td><td>namespaces ו-cgroups של ה-kernel (kernel משותף)</td><td>sandbox של VM ועוד capabilities</td></tr>
<tr><td>ניידות</td><td>לכל ארכיטקטורת CPU (images של amd64/arm64)</td><td>בינארי אחד לכל ארכיטקטורה</td></tr>
<tr><td>אקוסיסטם</td><td>הכל רץ</td><td>ברוב ה-runtimes עדיין אין threads, ספריות מוגבלות, אין fork/exec</td></tr></table>`
      }
    },
    {
      h: { en: "Edge platforms compared: isolates, Wasm, and Lambda@Edge", he: "השוואת פלטפורמות edge: ‏isolates, ‏Wasm ו-Lambda@Edge" },
      body: {
        en: `<p><strong>V8 isolates</strong> (Cloudflare Workers, Deno Deploy, Vercel's edge runtime) run thousands of tenants inside one process: each isolate has its own heap and globals, but they share the engine. Creating one takes ~5 ms and a few MB, versus a container or microVM per function. Cloudflare also pre-warms the isolate during the TLS handshake, using the SNI, so the cold start is often hidden entirely.</p>
<table><tr><th>Platform</th><th>Runtime</th><th>Where it runs</th><th>Key limits (typical, check current docs)</th></tr>
<tr><td>Cloudflare Workers</td><td>V8 isolates (JS/TS, Wasm, Python)</td><td>every Cloudflare PoP (330+ cities)</td><td>128 MB memory/isolate; CPU time 10 ms (free) / 30 s default, up to 5 min (paid); wall time while waiting on I/O doesn't count as CPU</td></tr>
<tr><td>Fastly Compute</td><td>Wasm on Wasmtime</td><td>every Fastly PoP</td><td>fresh instance per request (~tens of µs startup); per-request CPU/memory/heap limits</td></tr>
<tr><td>CloudFront Functions</td><td>restricted JS runtime</td><td>all CloudFront edge locations (600+)</td><td>viewer request/response only; sub-millisecond execution budget; 2 MB memory; 10 KB code; no network calls</td></tr>
<tr><td>Lambda@Edge</td><td>Node.js / Python (Firecracker)</td><td>regional edge caches (~13)</td><td>viewer triggers: 128 MB, 5 s; origin triggers: up to 10 GB, 30 s; real cold starts (100s of ms)</td></tr>
<tr><td>Deno Deploy / Vercel edge</td><td>V8 isolates</td><td>global PoPs</td><td>web-standard APIs only (fetch, Request/Response, crypto.subtle)</td></tr></table>
<p>Rule of thumb on AWS: header rewrites, redirects, cache-key normalization and simple JWT checks → <strong>CloudFront Functions</strong> (about 1/6 the price of Lambda@Edge). Anything that calls the network, needs a body, or needs more than a millisecond → <strong>Lambda@Edge</strong>.</p>
<blockquote>⚠️ Production tip: "edge" doesn't mean "near your data". A Worker in Frankfurt that makes 5 sequential queries to a database in us-east-1 pays 5 × ~90 ms RTT. Either keep edge logic data-free (auth, routing, A/B), use edge-replicated data (KV, read replicas, D1/Turso), or use placement features (Cloudflare Smart Placement) that run the code near the backend instead.</blockquote>`,
        he: `<p><strong>V8 isolates</strong> ‏(Cloudflare Workers, ‏Deno Deploy, ה-edge runtime של Vercel) מריצים אלפי tenants בתוך process אחד: לכל isolate יש heap ו-globals משלו, אבל הם חולקים את המנוע. יצירת isolate לוקחת ~5 ms וכמה MB, לעומת container או microVM לכל פונקציה. ‏Cloudflare גם מחממת את ה-isolate מראש בזמן ה-TLS handshake לפי ה-SNI, כך שה-cold start הרבה פעמים מוסתר לגמרי.</p>
<table><tr><th>פלטפורמה</th><th>Runtime</th><th>איפה רץ</th><th>מגבלות עיקריות (טיפוסי, תבדוק בתיעוד העדכני)</th></tr>
<tr><td>Cloudflare Workers</td><td>V8 isolates ‏(JS/TS, ‏Wasm, ‏Python)</td><td>כל PoP של Cloudflare ‏(330+ ערים)</td><td>‏128 MB זיכרון ל-isolate; ‏CPU time של 10 ms ‏(free) / ‏30 שניות כברירת מחדל ועד 5 דקות (בתשלום); זמן המתנה ל-I/O לא נספר כ-CPU</td></tr>
<tr><td>Fastly Compute</td><td>Wasm על Wasmtime</td><td>כל PoP של Fastly</td><td>instance טרי לכל request (עלייה של עשרות מיקרו-שניות); מגבלות CPU, זיכרון ו-heap לכל request</td></tr>
<tr><td>CloudFront Functions</td><td>runtime מוגבל של JS</td><td>כל ה-edge locations של CloudFront ‏(600+)</td><td>רק viewer request/response; תקציב הרצה של פחות ממילישנייה; ‏2 MB זיכרון; ‏10 KB קוד; בלי קריאות רשת</td></tr>
<tr><td>Lambda@Edge</td><td>Node.js / Python ‏(Firecracker)</td><td>regional edge caches (~13)</td><td>viewer triggers: ‏128 MB, ‏5 שניות; ‏origin triggers: עד 10 GB, ‏30 שניות; cold starts אמיתיים (מאות ms)</td></tr>
<tr><td>Deno Deploy / Vercel edge</td><td>V8 isolates</td><td>PoP-ים גלובליים</td><td>רק web-standard APIs ‏(fetch, ‏Request/Response, ‏crypto.subtle)</td></tr></table>
<p>כלל אצבע ב-AWS: שכתוב headers, ‏redirects, נרמול של cache key ובדיקות JWT פשוטות הולכים ל-<strong>CloudFront Functions</strong> (בערך שישית מהמחיר של Lambda@Edge). כל דבר שקורא לרשת, צריך body או צריך יותר ממילישנייה הולך ל-<strong>Lambda@Edge</strong>.</p>
<blockquote>⚠️ טיפ לפרודקשן: "edge" לא אומר "קרוב ל-data שלך". ‏Worker בפרנקפורט שעושה 5 queries סדרתיים ל-DB ב-us-east-1 משלם 5 × ~90 ms של RTT. או שתשאיר את הלוגיקה ב-edge בלי data (auth, ‏routing, ‏A/B), או שתשתמש ב-data משוכפל ל-edge ‏(KV, ‏read replicas, ‏D1/Turso), או בפיצ'רים של placement ‏(Cloudflare Smart Placement) שמריצים את הקוד דווקא ליד ה-backend.</blockquote>`
      }
    },
    {
      h: { en: "Cold starts, limits and what fits at the edge", he: "Cold starts, מגבלות ומה מתאים ל-edge" },
      body: {
        en: `<p>What you give up at the edge:</p>
<ul><li><strong>CPU time</strong> is metered in milliseconds; a 200 ms image resize or a big JSON transform can blow the budget.</li>
<li><strong>Memory</strong> ~128 MB per isolate; no loading a 1 GB ML model.</li>
<li><strong>No raw sockets / listening ports</strong>: you handle a request via a <code>fetch</code> handler. Outbound is mostly HTTP <code>fetch</code> (Workers added a TCP <code>connect()</code> API, Postgres drivers work through it or through HTTP proxies like Hyperdrive), no UDP.</li>
<li><strong>No local disk, no long-lived global state</strong>: a global variable lives as long as the isolate, which can be evicted any time and is not shared between PoPs. State goes to KV (eventually consistent, ~60 s propagation), Durable Objects (single-writer, strongly consistent), or an origin DB.</li>
<li><strong>Node.js APIs are partial</strong>: web-standard APIs first; Node compatibility flags cover many but not all packages.</li></ul>
<p>Use cases that fit perfectly — small, stateless, latency-sensitive, run on every request:</p>
<pre>// Cloudflare Worker: JWT check + A/B bucketing before the cache/origin
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
      if (!(await verifyJwt(token, env.JWKS_URL))) return new Response("unauthorized", { status: 401 });
    }
    // sticky A/B: reuse cookie, else hash a random id into 0..99
    let bucket = getCookie(req, "ab");
    if (!bucket) bucket = (crypto.getRandomValues(new Uint8Array(1))[0] % 100) &lt; 10 ? "B" : "A";
    const originReq = new Request(req);
    originReq.headers.set("x-variant", bucket);          // origin / cache key varies on it
    const res = await fetch(originReq, { cf: { cacheKey: url.pathname + "|" + bucket } });
    const out = new Response(res.body, res);
    out.headers.append("set-cookie", "ab=" + bucket + "; Path=/; Max-Age=2592000; Secure; HttpOnly");
    return out;
  }
};</pre>
<ul><li><strong>Auth at the edge</strong>: reject bad tokens in the PoP before they cost origin capacity (also a DDoS layer).</li>
<li><strong>A/B tests and feature flags</strong> without client-side flicker.</li>
<li><strong>Personalization</strong> of cached HTML: geo (<code>request.cf.country</code>), language, logged-in vs anonymous — stitch small fragments into a cached page.</li>
<li><strong>Image transforms</strong>: resize/format negotiation (AVIF/WebP by <code>Accept</code>) at the edge with results cached.</li>
<li><strong>Redirects, rewrites, bot filtering, header security</strong> (CSP, HSTS) at scale.</li></ul>`,
        he: `<p>על מה מוותרים ב-edge:</p>
<ul><li><strong>CPU time</strong> נמדד במילישניות; שינוי גודל של תמונה ב-200 ms או טרנספורמציה של JSON גדול יכולים לפוצץ את התקציב.</li>
<li><strong>זיכרון</strong> של ~128 MB ל-isolate; אין טעינה של מודל ML של 1 GB.</li>
<li><strong>אין raw sockets ואין ports שמאזינים</strong>: מטפלים ב-request דרך handler של <code>fetch</code>. יציאה החוצה היא בעיקר HTTP ‏<code>fetch</code> ‏(Workers הוסיפו API של TCP ‏<code>connect()</code>, ודרייברים של Postgres עובדים דרכו או דרך HTTP proxies כמו Hyperdrive), בלי UDP.</li>
<li><strong>אין דיסק מקומי ואין state גלובלי ארוך-טווח</strong>: משתנה גלובלי חי כל עוד ה-isolate חי, והוא יכול להיזרק בכל רגע ולא משותף בין PoP-ים. ‏State הולך ל-KV ‏(eventually consistent, הפצה של ~60 שניות), ל-Durable Objects ‏(single-writer, ‏strongly consistent), או ל-DB ב-origin.</li>
<li><strong>ה-APIs של Node.js חלקיים</strong>: קודם web-standard APIs; דגלי Node compatibility מכסים הרבה חבילות, אבל לא את כולן.</li></ul>
<p>Use cases שמתאימים בול — קטנים, stateless, רגישים ל-latency, רצים על כל request:</p>
<pre>// Cloudflare Worker: JWT check + A/B bucketing before the cache/origin
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
      if (!(await verifyJwt(token, env.JWKS_URL))) return new Response("unauthorized", { status: 401 });
    }
    // sticky A/B: reuse cookie, else hash a random id into 0..99
    let bucket = getCookie(req, "ab");
    if (!bucket) bucket = (crypto.getRandomValues(new Uint8Array(1))[0] % 100) &lt; 10 ? "B" : "A";
    const originReq = new Request(req);
    originReq.headers.set("x-variant", bucket);          // origin / cache key varies on it
    const res = await fetch(originReq, { cf: { cacheKey: url.pathname + "|" + bucket } });
    const out = new Response(res.body, res);
    out.headers.append("set-cookie", "ab=" + bucket + "; Path=/; Max-Age=2592000; Secure; HttpOnly");
    return out;
  }
};</pre>
<ul><li><strong>Auth ב-edge</strong>: דוחים tokens לא תקינים ב-PoP לפני שהם עולים לך ב-capacity של ה-origin (גם שכבת הגנה מ-DDoS).</li>
<li><strong>בדיקות A/B ו-feature flags</strong> בלי הבהוב בצד הלקוח.</li>
<li><strong>Personalization</strong> של HTML שנמצא ב-cache: גיאוגרפיה (<code>request.cf.country</code>), שפה, מחובר מול אנונימי — תופרים fragments קטנים לתוך דף מה-cache.</li>
<li><strong>טרנספורמציות של תמונות</strong>: שינוי גודל ובחירת פורמט (AVIF/WebP לפי <code>Accept</code>) ב-edge, עם התוצאות ב-cache.</li>
<li><strong>Redirects, ‏rewrites, סינון bots ו-headers של אבטחה</strong> ‏(CSP, ‏HSTS) בסקייל.</li></ul>`
      }
    },
    {
      h: { en: "Wasm in Kubernetes, proxies and plugin systems", he: "Wasm ב-Kubernetes, ב-proxies ובמערכות plugins" },
      body: {
        en: `<p><strong>Kubernetes</strong>: <code>runwasi</code> (a containerd project) provides shims like <code>containerd-shim-spin-v2</code> and <code>containerd-shim-wasmtime-v1</code>. The kubelet still talks CRI to containerd; containerd hands the "container" (an OCI artifact holding a <code>.wasm</code>) to the Wasm shim instead of runc. You select it with a <strong>RuntimeClass</strong>:</p>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: wasmtime-spin-v2 }
handler: spin                      # matches the containerd runtime name on the node
scheduling:
  nodeSelector: { kwasm.sh/kwasm-provisioned: "true" }
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: hello-spin }
spec:
  replicas: 3
  selector: { matchLabels: { app: hello-spin } }
  template:
    metadata: { labels: { app: hello-spin } }
    spec:
      runtimeClassName: wasmtime-spin-v2
      containers:
      - name: hello
        image: ghcr.io/acme/hello-spin:1.0.0     # OCI artifact with the .wasm
        command: ["/"]</pre>
<p><strong>SpinKube</strong> (CNCF sandbox) packages this: an operator with a <code>SpinApp</code> CRD, the runtime-class-manager that installs shims on nodes, and the containerd shim. Density is the selling point — hundreds of Wasm apps per node, scale-to-zero with near-instant scale-up.</p>
<p><strong>Proxies</strong>: Envoy supports the <strong>proxy-wasm</strong> ABI — filters written in Rust/Go/C++ compiled to Wasm, loaded at runtime without rebuilding Envoy. Istio exposes it as a <code>WasmPlugin</code> resource (e.g. custom auth headers, request signing). Cost: a Wasm filter adds tens of µs per request and copies headers/bodies across the sandbox boundary — fine for headers, expensive for large bodies.</p>
<p><strong>Plugin systems</strong> are the quiet killer use case: run customer- or third-party-supplied code safely inside your product. Shopify Functions (merchant discount logic in Wasm, with a strict instruction-count limit), Redpanda data transforms, Envoy/Istio filters, Zellij plugins, Extism as a general plugin framework. The sandbox plus fuel/instruction metering means a buggy plugin can't crash or hang the host.</p>`,
        he: `<p><strong>Kubernetes</strong>: ‏<code>runwasi</code> (פרויקט של containerd) מספק shims כמו <code>containerd-shim-spin-v2</code> ו-<code>containerd-shim-wasmtime-v1</code>. ה-kubelet עדיין מדבר CRI עם containerd; ‏containerd מעביר את ה-"container" ‏(OCI artifact שמכיל <code>.wasm</code>) ל-shim של Wasm במקום ל-runc. בוחרים בו עם <strong>RuntimeClass</strong>:</p>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: wasmtime-spin-v2 }
handler: spin                      # matches the containerd runtime name on the node
scheduling:
  nodeSelector: { kwasm.sh/kwasm-provisioned: "true" }
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: hello-spin }
spec:
  replicas: 3
  selector: { matchLabels: { app: hello-spin } }
  template:
    metadata: { labels: { app: hello-spin } }
    spec:
      runtimeClassName: wasmtime-spin-v2
      containers:
      - name: hello
        image: ghcr.io/acme/hello-spin:1.0.0     # OCI artifact with the .wasm
        command: ["/"]</pre>
<p><strong>SpinKube</strong> ‏(CNCF sandbox) אורז את זה: operator עם CRD של <code>SpinApp</code>, ה-runtime-class-manager שמתקין shims על ה-nodes, וה-shim של containerd. נקודת המכירה היא צפיפות — מאות אפליקציות Wasm ל-node, ‏scale-to-zero עם scale-up כמעט מיידי.</p>
<p><strong>Proxies</strong>: ‏Envoy תומך ב-ABI של <strong>proxy-wasm</strong> — filters שכתובים ב-Rust, ‏Go או C++ ומקומפלים ל-Wasm, ונטענים בזמן ריצה בלי לבנות מחדש את Envoy. ‏Istio חושף את זה כמשאב <code>WasmPlugin</code> (למשל headers מותאמים ל-auth, חתימה של requests). המחיר: filter של Wasm מוסיף עשרות מיקרו-שניות ל-request ומעתיק headers ו-bodies דרך גבול ה-sandbox — בסדר ל-headers, יקר ל-bodies גדולים.</p>
<p><strong>מערכות plugins</strong> הן ה-use case השקט והחזק: להריץ בבטחה קוד שלקוחות או צד שלישי סיפקו, בתוך המוצר שלך. ‏Shopify Functions (לוגיקת הנחות של סוחרים ב-Wasm, עם מגבלה קשיחה על מספר הוראות), ‏data transforms של Redpanda, ‏filters של Envoy/Istio, ‏plugins של Zellij, ו-Extism כ-framework כללי ל-plugins. ה-sandbox יחד עם fuel או מדידת הוראות אומר ש-plugin באגי לא יכול להפיל או לתקוע את ה-host.</p>`
      }
    }
  ],
  diagram: `user (Tel Aviv) ──TLS──► edge PoP (TLV)  ~5-15 ms RTT
                         │ V8 isolate / Wasm instance (µs-ms start)
                         │  ├─ verify JWT ──✗──► 401 (origin never sees it)
                         │  ├─ A/B bucket, geo, rewrite cache key
                         │  └─ cache HIT? ──► respond
                         ▼ miss
                   origin (eu-central-1)  ~40-60 ms
                         │
                   k8s: runc pods  +  RuntimeClass=spin (runwasi shim)`,
  handsOn: [
    { cmd: "npm create cloudflare@latest edge-ab -- --type hello-world && cd edge-ab && npx wrangler dev",
      what: { en: "Scaffold a Worker and run it locally in workerd (the open-source Workers runtime).", he: "תיצור Worker ותריץ אותו מקומית ב-workerd ‏(ה-runtime של Workers בקוד פתוח)." } },
    { cmd: "spin new -t http-rust hello && cd hello && spin build && spin up",
      what: { en: "Build a Spin HTTP component to wasm32-wasip1 and serve it on localhost:3000. Check the .wasm size.", he: "תבנה component של HTTP ב-Spin ל-wasm32-wasip1 ותגיש אותו ב-localhost:3000. תבדוק את גודל ה-.wasm." } },
    { cmd: "wasmtime run --dir=. app.wasm && wasmtime run app.wasm   # second run: no file access",
      what: { en: "See capability-based security: without --dir the module simply cannot open files.", he: "תראה אבטחה מבוססת capabilities: בלי --dir המודול פשוט לא יכול לפתוח קבצים." } },
    { cmd: "kubectl get runtimeclass && kubectl get pods -o custom-columns=NAME:.metadata.name,RUNTIME:.spec.runtimeClassName",
      what: { en: "On a cluster with SpinKube/runwasi: list runtime classes and which Pods run under the Wasm shim.", he: "בקלאסטר עם SpinKube או runwasi: תציג runtime classes ואילו Pod-ים רצים תחת ה-shim של Wasm." } }
  ],
  mnemonic: {
    en: "\"Small, Stateless, Speedy, Sandboxed\": if the logic is all four, put it at the edge. If it needs the database, it probably belongs next to the database.",
    he: "\"קטן, stateless, מהיר, מבודד\": אם הלוגיקה עונה על כל הארבעה, תשים אותה ב-edge. אם היא צריכה את ה-DB, כנראה שמקומה ליד ה-DB."
  },
  pitfalls: [
    { en: "Moving data-heavy logic to the edge: several sequential calls to a single-region DB make edge code slower than running it in that region.", he: "להעביר לוגיקה כבדת data ל-edge: כמה קריאות סדרתיות ל-DB באזור אחד הופכות את קוד ה-edge לאיטי יותר מאשר להריץ אותו באותו region." },
    { en: "Relying on global variables as a cache or counter: isolates are evicted at any time and each PoP (and often each machine) has its own copy.", he: "להסתמך על משתנים גלובליים כ-cache או מונה: ‏isolates נזרקים בכל רגע, ולכל PoP (והרבה פעמים לכל מכונה) יש עותק משלו." },
    { en: "Choosing Lambda@Edge for a header rewrite: you pay cold starts and ~6x the price of CloudFront Functions for something that needs microseconds.", he: "לבחור Lambda@Edge לשכתוב header: אתה משלם cold starts ופי ~6 מהמחיר של CloudFront Functions על משהו שצריך מיקרו-שניות." },
    { en: "Assuming any library compiles to Wasm: threads, sockets, fork/exec and native extensions often don't; check the WASI support before you commit.", he: "להניח שכל ספרייה מתקמפלת ל-Wasm: ‏threads, ‏sockets, ‏fork/exec ו-native extensions הרבה פעמים לא; תבדוק את התמיכה ב-WASI לפני שאתה מתחייב." }
  ],
  interview: [
    { q: { en: "Why do Cloudflare Workers have near-zero cold starts while Lambda has noticeable ones?", he: "למה ל-Cloudflare Workers כמעט אין cold starts ול-Lambda יש cold starts מורגשים?" },
      a: { en: "Workers run as V8 isolates inside an already-running process: creating one is allocating a heap and compiling a script (~5 ms), and it can be started during the TLS handshake. Lambda boots a Firecracker microVM with a language runtime and your package (100 ms to seconds). The price: isolates impose CPU/memory limits, web APIs only, and a shared-process security model hardened by V8 sandboxing.", he: "Workers רצים כ-V8 isolates בתוך process שכבר פועל: יצירה של isolate היא הקצאת heap וקימפול של script (~5 ms), ואפשר להתחיל אותה כבר בזמן ה-TLS handshake. ‏Lambda מעלה microVM של Firecracker עם runtime של שפה וה-package שלך (100 ms עד שניות). המחיר: ‏isolates מטילים מגבלות CPU וזיכרון, רק web APIs, ומודל אבטחה של process משותף שמוקשח על ידי ה-sandbox של V8." } },
    { q: { en: "How would you let customers upload custom logic to run inside your SaaS safely?", he: "איך היית מאפשר ללקוחות להעלות לוגיקה מותאמת שתרוץ בתוך ה-SaaS שלך בבטחה?" },
      a: { en: "Compile to Wasm components with a WIT interface defining exactly what they can call; run them in Wasmtime with fuel/epoch interruption for CPU limits, a memory cap, no WASI filesystem or network unless granted, a fresh instance per invocation, and a timeout. Validate and AOT-compile at upload time, version the interface, and log/meter per tenant.", he: "לקמפל ל-Wasm components עם ממשק WIT שמגדיר בדיוק למה הם יכולים לקרוא; להריץ ב-Wasmtime עם fuel או epoch interruption כמגבלת CPU, תקרת זיכרון, בלי filesystem או רשת של WASI אלא אם הוענקו, ‏instance טרי לכל הפעלה ו-timeout. לאמת ולקמפל AOT בזמן ההעלאה, לנהל גרסאות לממשק, ולעשות לוג ומדידה לכל tenant." } }
  ],
  quiz: [
    { q: { en: "What makes a Wasm module unable to read files on the host by default?", he: "מה גורם לכך שמודול Wasm לא יכול לקרוא קבצים ב-host כברירת מחדל?" },
      options: [
        { en: "It runs as a non-root user", he: "הוא רץ כמשתמש שאינו root" },
        { en: "It has no syscalls; it can only call host functions explicitly imported/granted (capability-based)", he: "אין לו syscalls; הוא יכול לקרוא רק לפונקציות host שהוענקו לו במפורש (מבוסס capabilities)" },
        { en: "seccomp filters block open()", he: "Filters של seccomp חוסמים את open()" },
        { en: "Wasm files are read-only", he: "קבצי Wasm הם read-only" }
      ], answer: 1,
      explain: { en: "Wasm has no ambient authority. File access exists only if the host provides WASI filesystem imports and preopens directories (e.g. wasmtime --dir).", he: "ל-Wasm אין הרשאות ברירת מחדל. גישה לקבצים קיימת רק אם ה-host מספק imports של filesystem ב-WASI ופותח מראש תיקיות (למשל wasmtime --dir)." } },
    { q: { en: "On AWS you need to add a security header and normalize the cache key on every request at minimal cost. Which fits?", he: "ב-AWS אתה צריך להוסיף header של אבטחה ולנרמל את ה-cache key בכל request בעלות מינימלית. מה מתאים?" },
      options: [
        { en: "Lambda@Edge origin-request trigger", he: "Trigger של origin-request ב-Lambda@Edge" },
        { en: "CloudFront Functions on viewer request/response", he: "CloudFront Functions על viewer request/response" },
        { en: "A Lambda behind API Gateway", he: "Lambda מאחורי API Gateway" },
        { en: "An ECS service in every region", he: "Service של ECS בכל region" }
      ], answer: 1,
      explain: { en: "CloudFront Functions run in all edge locations with sub-ms execution and no network — perfect for header/cache-key manipulation, and much cheaper than Lambda@Edge.", he: "CloudFront Functions רצות בכל ה-edge locations עם הרצה של פחות ממילישנייה ובלי רשת — מושלם לשינוי headers ו-cache key, והרבה יותר זול מ-Lambda@Edge." } },
    { q: { en: "How does a Kubernetes Pod end up running a Wasm app with runwasi?", he: "איך Pod ב-Kubernetes מגיע להריץ אפליקציית Wasm עם runwasi?" },
      options: [
        { en: "The kubelet executes the .wasm directly", he: "ה-kubelet מריץ את ה-.wasm ישירות" },
        { en: "The Pod sets runtimeClassName; containerd uses the matching Wasm shim instead of runc", he: "ה-Pod מגדיר runtimeClassName; ‏containerd משתמש ב-shim המתאים של Wasm במקום ב-runc" },
        { en: "A sidecar container compiles Wasm to x86 at startup", he: "Sidecar מקמפל Wasm ל-x86 בזמן העלייה" },
        { en: "Wasm needs a separate scheduler", he: "Wasm צריך scheduler נפרד" }
      ], answer: 1,
      explain: { en: "RuntimeClass maps to a containerd handler (e.g. spin). The kubelet/CRI flow is unchanged; only the low-level runtime differs.", he: "RuntimeClass ממופה ל-handler של containerd (למשל spin). התהליך של kubelet ו-CRI לא משתנה; רק ה-runtime ברמה הנמוכה שונה." } },
    { q: { en: "A Worker in Europe makes 4 sequential queries to a Postgres in us-east-1 per request. What's the best fix?", he: "Worker באירופה עושה 4 queries סדרתיים ל-Postgres ב-us-east-1 בכל request. מה התיקון הכי טוב?" },
      options: [
        { en: "Increase the Worker's CPU limit", he: "להגדיל את מגבלת ה-CPU של ה-Worker" },
        { en: "Run the logic near the database (smart placement / regional backend) or replicate the data to the edge", he: "להריץ את הלוגיקה ליד ה-DB ‏(smart placement או backend אזורי) או לשכפל את ה-data ל-edge" },
        { en: "Store results in a global variable", he: "לשמור את התוצאות במשתנה גלובלי" },
        { en: "Switch to Lambda@Edge", he: "לעבור ל-Lambda@Edge" }
      ], answer: 1,
      explain: { en: "The cost is 4 × transatlantic RTT (~90 ms each). Edge compute only helps when the work doesn't depend on far-away data; otherwise move compute to the data or the data to the edge.", he: "המחיר הוא 4 פעמים RTT טרנס-אטלנטי (~90 ms כל אחד). ‏Edge compute עוזר רק כשהעבודה לא תלויה ב-data רחוק; אחרת מעבירים את ה-compute ל-data או את ה-data ל-edge." } }
  ],
  related: ["cloud-serverless", "net-proxies-cdn", "net-ddos-edge", "staff-service-mesh", "arch-api-gateway"]
});

// ---------------------------------------------------------------------------
// 3. Graph Databases
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-graph",
  track: "data",
  order: 51,
  icon: "🔗",
  level: 3,
  minutes: 13,
  title: { en: "Graph Databases", he: "Graph Databases" },
  tldr: {
    en: "A graph database stores relationships as first-class, directly linked records, so a multi-hop traversal costs per edge visited instead of per JOIN over whole tables — great for fraud rings, permissions and recommendations, painful to shard.",
    he: "Graph database שומר קשרים כרשומות מדרגה ראשונה שמקושרות ישירות, כך ש-traversal של כמה hops עולה לפי מספר הקשתות שעברת ולא לפי JOIN על טבלאות שלמות — מעולה ל-fraud rings, הרשאות והמלצות, וכואב לעשות לו sharding."
  },
  analogy: {
    en: "A relational DB is a phone book: to find your friend's friends you look up every friend's name in the index, one by one. A graph DB is everyone holding hands: from you, you just follow the arms. Following arms is fast no matter how big the city is — until you reach the mayor, who is holding two million hands.",
    he: "DB רלציוני זה ספר טלפונים: כדי למצוא את החברים של החבר שלך אתה מחפש כל שם באינדקס, אחד אחד. ‏Graph DB זה כולם מחזיקים ידיים: ממך פשוט הולכים לאורך הזרועות. ללכת לאורך זרועות זה מהיר לא משנה כמה העיר גדולה — עד שמגיעים לראש העיר, שמחזיק שני מיליון ידיים."
  },
  sections: [
    {
      h: { en: "Property graphs vs RDF, and the engines", he: "Property graph מול RDF, והמנועים" },
      body: {
        en: `<p>Two data models dominate:</p>
<table><tr><th></th><th>Property graph</th><th>RDF (triple store)</th></tr>
<tr><td>Unit</td><td>nodes and relationships, both with labels and key/value properties</td><td>triples: subject → predicate → object, identified by URIs</td></tr>
<tr><td>Query language</td><td>Cypher / openCypher, Gremlin, ISO <strong>GQL</strong> (published 2024)</td><td>SPARQL</td></tr>
<tr><td>Edge properties</td><td>native (<code>[:PAID {amount: 120, at: ...}]</code>)</td><td>awkward (reification, RDF-star)</td></tr>
<tr><td>Strength</td><td>application data, traversal performance</td><td>ontologies, linked open data, inference/reasoning, data integration</td></tr>
<tr><td>Engines</td><td>Neo4j, Memgraph, Neptune, TigerGraph, JanusGraph</td><td>Neptune, GraphDB, Stardog, Virtuoso</td></tr></table>
<ul><li><strong>Neo4j</strong>: the most widely used property graph DB; native storage, Cypher, causal clustering (Raft) with one writer per database and read replicas. AuraDB is its managed service.</li>
<li><strong>Amazon Neptune</strong>: managed, supports both models (Gremlin/openCypher <em>and</em> SPARQL), one writer + up to 15 read replicas over shared storage, like Aurora. Neptune Analytics adds in-memory graph algorithms and vector search.</li>
<li><strong>Memgraph</strong>: in-memory, Cypher-compatible, built for low-latency streaming graph analytics (Kafka in, real-time fraud scores out). Your data must fit in RAM.</li></ul>
<p>Also worth knowing: SQL:2023 added <strong>SQL/PGQ</strong> (property graph queries over relational tables with <code>GRAPH_TABLE(... MATCH ...)</code>), and Oracle and DuckDB extensions already implement it — the line between "graph DB" and "SQL DB" is getting thinner.</p>`,
        he: `<p>שני מודלים של data שולטים:</p>
<table><tr><th></th><th>Property graph</th><th>RDF ‏(triple store)</th></tr>
<tr><td>יחידה</td><td>nodes ו-relationships, לשניהם labels ו-properties של key/value</td><td>triples: ‏subject → predicate → object, מזוהים לפי URIs</td></tr>
<tr><td>שפת שאילתות</td><td>Cypher / openCypher, ‏Gremlin, ‏<strong>GQL</strong> של ISO (פורסם ב-2024)</td><td>SPARQL</td></tr>
<tr><td>Properties על קשתות</td><td>מובנה (<code>[:PAID {amount: 120, at: ...}]</code>)</td><td>מסורבל (reification, ‏RDF-star)</td></tr>
<tr><td>חוזקה</td><td>data של אפליקציות, ביצועי traversal</td><td>אונטולוגיות, linked open data, הסקה ו-reasoning, אינטגרציית data</td></tr>
<tr><td>מנועים</td><td>Neo4j, ‏Memgraph, ‏Neptune, ‏TigerGraph, ‏JanusGraph</td><td>Neptune, ‏GraphDB, ‏Stardog, ‏Virtuoso</td></tr></table>
<ul><li><strong>Neo4j</strong>: ה-property graph DB הכי נפוץ; אחסון native, ‏Cypher, ‏causal clustering ‏(Raft) עם writer אחד לכל database ו-read replicas. ‏AuraDB הוא השירות המנוהל שלו.</li>
<li><strong>Amazon Neptune</strong>: מנוהל, תומך בשני המודלים (Gremlin/openCypher <em>וגם</em> SPARQL), ‏writer אחד ועד 15 read replicas מעל storage משותף, כמו Aurora. ‏Neptune Analytics מוסיף אלגוריתמים של graph בזיכרון ו-vector search.</li>
<li><strong>Memgraph</strong>: בזיכרון, תואם Cypher, בנוי ל-analytics של graph ב-streaming עם latency נמוך (Kafka נכנס, ציוני fraud בזמן אמת יוצאים). ה-data חייב להיכנס ל-RAM.</li></ul>
<p>שווה לדעת גם: ‏SQL:2023 הוסיף את <strong>SQL/PGQ</strong> (שאילתות property graph מעל טבלאות רלציוניות עם <code>GRAPH_TABLE(... MATCH ...)</code>), ו-Oracle והרחבות של DuckDB כבר מממשים אותו — הקו בין "graph DB" ל-"SQL DB" הולך ונהיה דק.</p>`
      }
    },
    {
      h: { en: "Cypher by example", he: "Cypher דרך דוגמאות" },
      body: {
        en: `<p>Cypher draws the pattern you want with ASCII art: <code>(node)</code>, <code>-[:REL]-&gt;</code>.</p>
<pre>// create data
CREATE (a:Account {id: "A1", name: "Dana"})-[:USES]-&gt;(d:Device {fp: "ab12"}),
       (b:Account {id: "A2", name: "Yossi"})-[:USES]-&gt;(d);

// index the lookup property (traversal starts from an index seek)
CREATE INDEX account_id IF NOT EXISTS FOR (a:Account) ON (a.id);

// friends-of-friends I don't already follow, ranked by mutual friends
MATCH (me:User {id: $uid})-[:FOLLOWS]-&gt;(f)-[:FOLLOWS]-&gt;(fof)
WHERE fof &lt;&gt; me AND NOT (me)-[:FOLLOWS]-&gt;(fof)
RETURN fof.name, count(f) AS mutual
ORDER BY mutual DESC LIMIT 10;

// variable-length path: who can reach the payroll DB within 4 hops?
MATCH p = (u:User)-[:MEMBER_OF|CAN_ASSUME*1..4]-&gt;(r:Resource {name: "payroll-db"})
RETURN u.email, length(p) ORDER BY length(p);

// shortest path between two accounts
MATCH p = shortestPath((a:Account {id: "A1"})-[*..6]-(b:Account {id: "Z9"}))
RETURN [n IN nodes(p) | coalesce(n.id, n.fp)] AS hops;</pre>
<p>Always bound variable-length patterns (<code>*1..4</code>, not <code>*</code>) and always start from an indexed node. <code>PROFILE</code> before a query shows the plan with <strong>db hits</strong> per operator — the graph equivalent of <code>EXPLAIN ANALYZE</code>.</p>
<blockquote>⚠️ Production tip: an unbounded <code>[*]</code> on a dense graph explores paths, not nodes — the number of paths grows exponentially with depth. One such query can pin a CPU core and fill the heap of a Neo4j instance. Set <code>db.transaction.timeout</code> (e.g. 30s) and <code>dbms.memory.transaction.total.max</code>.</blockquote>`,
        he: `<p>Cypher מצייר את הדפוס שאתה מחפש עם ASCII art: ‏<code>(node)</code>, ‏<code>-[:REL]-&gt;</code>.</p>
<pre>// create data
CREATE (a:Account {id: "A1", name: "Dana"})-[:USES]-&gt;(d:Device {fp: "ab12"}),
       (b:Account {id: "A2", name: "Yossi"})-[:USES]-&gt;(d);

// index the lookup property (traversal starts from an index seek)
CREATE INDEX account_id IF NOT EXISTS FOR (a:Account) ON (a.id);

// friends-of-friends I don't already follow, ranked by mutual friends
MATCH (me:User {id: $uid})-[:FOLLOWS]-&gt;(f)-[:FOLLOWS]-&gt;(fof)
WHERE fof &lt;&gt; me AND NOT (me)-[:FOLLOWS]-&gt;(fof)
RETURN fof.name, count(f) AS mutual
ORDER BY mutual DESC LIMIT 10;

// variable-length path: who can reach the payroll DB within 4 hops?
MATCH p = (u:User)-[:MEMBER_OF|CAN_ASSUME*1..4]-&gt;(r:Resource {name: "payroll-db"})
RETURN u.email, length(p) ORDER BY length(p);

// shortest path between two accounts
MATCH p = shortestPath((a:Account {id: "A1"})-[*..6]-(b:Account {id: "Z9"}))
RETURN [n IN nodes(p) | coalesce(n.id, n.fp)] AS hops;</pre>
<p>תמיד תגביל דפוסים באורך משתנה (<code>*1..4</code>, לא <code>*</code>) ותמיד תתחיל מ-node עם index. ‏<code>PROFILE</code> לפני query מראה את ה-plan עם <strong>db hits</strong> לכל operator — המקבילה של <code>EXPLAIN ANALYZE</code> בעולם ה-graph.</p>
<blockquote>⚠️ טיפ לפרודקשן: ‏<code>[*]</code> בלי גבול על graph צפוף חוקר מסלולים, לא nodes — מספר המסלולים גדל אקספוננציאלית עם העומק. ‏Query אחד כזה יכול לתפוס core של CPU ולמלא את ה-heap של instance של Neo4j. תגדיר <code>db.transaction.timeout</code> (למשל 30s) ו-<code>dbms.memory.transaction.total.max</code>.</blockquote>`
      }
    },
    {
      h: { en: "Recursive CTEs vs index-free adjacency", he: "Recursive CTE מול index-free adjacency" },
      body: {
        en: `<p>You <em>can</em> traverse a graph in Postgres with a recursive CTE over an <code>edges</code> table:</p>
<pre>-- edges(src bigint, dst bigint, kind text), index on (src, kind)
WITH RECURSIVE reach(node, depth, path) AS (
  SELECT dst, 1, ARRAY[src, dst] FROM edges WHERE src = 42 AND kind = 'follows'
  UNION ALL
  SELECT e.dst, r.depth + 1, r.path || e.dst
  FROM reach r JOIN edges e ON e.src = r.node AND e.kind = 'follows'
  WHERE r.depth &lt; 3 AND e.dst &lt;&gt; ALL(r.path)          -- stop cycles
)
SELECT node, min(depth) FROM reach GROUP BY node;
-- Postgres 14+: CYCLE node SET is_cycle USING path  does the cycle check for you</pre>
<p>Each hop is a JOIN: for every frontier node, a B-tree lookup in the edges index — O(log E) per edge, with random I/O as the index grows past RAM. The planner also can't estimate recursive depth well.</p>
<p><strong>Index-free adjacency</strong> (Neo4j's native store) means each node record points directly at its first relationship record, and relationship records form linked lists per node. Following an edge is a pointer dereference to a fixed-size record at a computable offset — O(1) per hop, independent of total graph size. The cost of a traversal depends on the part of the graph you touch, not on how big the graph is.</p>
<table><tr><th>Query (social graph, ~1M users, ~50 friends each)</th><th>Relational (JOINs)</th><th>Native graph</th></tr>
<tr><td>Friends (depth 1)</td><td>ms</td><td>ms</td></tr>
<tr><td>Friends-of-friends (depth 2, ~2,500 nodes)</td><td>tens of ms</td><td>ms</td></tr>
<tr><td>Depth 4-5 (~millions of paths)</td><td>seconds to minutes</td><td>sub-second to seconds</td></tr></table>
<p>(Order-of-magnitude figures from the classic "Graph Databases" book benchmark; your mileage varies with data shape and caching. At depth 1-2, a well-indexed Postgres is fine.)</p>`,
        he: `<p>אפשר <em>כן</em> לעשות traversal על graph ב-Postgres עם recursive CTE מעל טבלת <code>edges</code>:</p>
<pre>-- edges(src bigint, dst bigint, kind text), index on (src, kind)
WITH RECURSIVE reach(node, depth, path) AS (
  SELECT dst, 1, ARRAY[src, dst] FROM edges WHERE src = 42 AND kind = 'follows'
  UNION ALL
  SELECT e.dst, r.depth + 1, r.path || e.dst
  FROM reach r JOIN edges e ON e.src = r.node AND e.kind = 'follows'
  WHERE r.depth &lt; 3 AND e.dst &lt;&gt; ALL(r.path)          -- stop cycles
)
SELECT node, min(depth) FROM reach GROUP BY node;
-- Postgres 14+: CYCLE node SET is_cycle USING path  does the cycle check for you</pre>
<p>כל hop הוא JOIN: לכל node בחזית, חיפוש ב-B-tree של ה-index של edges — ‏O(log E) לכל קשת, עם I/O אקראי כשה-index גדל מעבר ל-RAM. גם ה-planner לא יודע להעריך טוב עומק רקורסיבי.</p>
<p><strong>Index-free adjacency</strong> (האחסון ה-native של Neo4j) אומר שכל רשומת node מצביעה ישירות לרשומת ה-relationship הראשונה שלה, ורשומות ה-relationships יוצרות רשימות מקושרות לכל node. מעבר על קשת הוא dereference של pointer לרשומה בגודל קבוע ב-offset שאפשר לחשב — ‏O(1) לכל hop, בלי קשר לגודל ה-graph הכולל. המחיר של traversal תלוי בחלק של ה-graph שנגעת בו, לא בכמה ה-graph גדול.</p>
<table><tr><th>Query ‏(graph חברתי, ~מיליון משתמשים, ~50 חברים לכל אחד)</th><th>רלציוני (JOINs)</th><th>Graph native</th></tr>
<tr><td>חברים (עומק 1)</td><td>ms</td><td>ms</td></tr>
<tr><td>חברים של חברים (עומק 2, ~2,500 nodes)</td><td>עשרות ms</td><td>ms</td></tr>
<tr><td>עומק 4-5 (~מיליוני מסלולים)</td><td>שניות עד דקות</td><td>פחות משנייה עד שניות</td></tr></table>
<p>(סדרי גודל מה-benchmark הקלאסי של הספר "Graph Databases"; התוצאות שלך ישתנו לפי צורת ה-data וה-caching. בעומק 1-2, ‏Postgres עם index טוב זה בסדר גמור.)</p>`
      }
    },
    {
      h: { en: "Use cases: fraud rings, recommendations, Zanzibar, GraphRAG", he: "Use cases: ‏fraud rings, המלצות, ‏Zanzibar, ‏GraphRAG" },
      body: {
        en: `<p><strong>Fraud rings</strong>: individual accounts look clean; the ring is visible only in shared attributes. Model accounts, devices, cards, phones, addresses and IPs as nodes, then look for connected components:</p>
<pre>// accounts sharing a device or card with an account already flagged, within 3 hops
MATCH (bad:Account {flagged: true})-[:USES|PAYS_WITH*1..3]-(other:Account)
WHERE other.flagged = false
RETURN other.id, count(*) AS links ORDER BY links DESC LIMIT 50;

// or offline, with Graph Data Science: weakly connected components
CALL gds.wcc.stream('fraud-graph') YIELD nodeId, componentId ...</pre>
<p><strong>Recommendations</strong>: "people who bought X also bought Y" is a 2-hop traversal <code>(me)-[:BOUGHT]-&gt;(p)&lt;-[:BOUGHT]-(other)-[:BOUGHT]-&gt;(rec)</code>; in production it's often precomputed offline and served from a KV store.</p>
<p><strong>Access-control graphs (ReBAC)</strong>: Google's <strong>Zanzibar</strong> paper (2019) stores permissions as relation tuples (<code>doc:readme#viewer@group:eng#member</code>) and answers "can user U view doc D?" by walking the graph — for Google Drive, YouTube, Cloud IAM, at millions of checks per second with p95 under 10 ms. Open implementations: <strong>SpiceDB</strong> (AuthZed), OpenFGA (CNCF), Ory Keto.</p>
<pre>// SpiceDB schema
definition user {}
definition team { relation member: user | team#member }
definition folder {
  relation owner: user
  relation viewer: user | team#member
  permission view = viewer + owner
}
definition document {
  relation parent: folder
  relation viewer: user
  permission view = viewer + parent-&gt;view     // inherits through the folder
}

$ zed permission check document:roadmap view user:dana   →   true</pre>
<p>Zanzibar-style systems are not general graph DBs: they're specialized for permission checks, with <strong>zookies</strong> (consistency tokens) to avoid the "new enemy" problem — a check evaluated against a snapshot older than the ACL change that removed someone.</p>
<p><strong>Knowledge graphs &amp; GraphRAG</strong>: extract entities and relations from documents with an LLM into a graph, then answer questions by retrieving connected subgraphs or community summaries instead of only top-k similar chunks. It helps for "global" questions ("what are the main themes across these 10,000 tickets?") and multi-hop questions; it costs a lot of LLM calls to build and to keep current.</p>`,
        he: `<p><strong>Fraud rings</strong>: חשבונות בודדים נראים נקיים; הטבעת נראית רק דרך תכונות משותפות. ממדלים חשבונות, מכשירים, כרטיסים, טלפונים, כתובות ו-IPs כ-nodes, ומחפשים connected components:</p>
<pre>// accounts sharing a device or card with an account already flagged, within 3 hops
MATCH (bad:Account {flagged: true})-[:USES|PAYS_WITH*1..3]-(other:Account)
WHERE other.flagged = false
RETURN other.id, count(*) AS links ORDER BY links DESC LIMIT 50;

// or offline, with Graph Data Science: weakly connected components
CALL gds.wcc.stream('fraud-graph') YIELD nodeId, componentId ...</pre>
<p><strong>המלצות</strong>: "מי שקנה X קנה גם Y" זה traversal של 2 hops ‏<code>(me)-[:BOUGHT]-&gt;(p)&lt;-[:BOUGHT]-(other)-[:BOUGHT]-&gt;(rec)</code>; בפרודקשן הרבה פעמים מחשבים את זה מראש offline ומגישים מ-KV store.</p>
<p><strong>Graphs של הרשאות (ReBAC)</strong>: המאמר של גוגל על <strong>Zanzibar</strong> ‏(2019) שומר הרשאות כ-relation tuples ‏(<code>doc:readme#viewer@group:eng#member</code>) ועונה על "האם משתמש U יכול לראות מסמך D?" על ידי הליכה על ה-graph — עבור Google Drive, ‏YouTube, ‏Cloud IAM, במיליוני בדיקות בשנייה עם p95 מתחת ל-10 ms. מימושים פתוחים: <strong>SpiceDB</strong> ‏(AuthZed), ‏OpenFGA ‏(CNCF), ‏Ory Keto.</p>
<pre>// SpiceDB schema
definition user {}
definition team { relation member: user | team#member }
definition folder {
  relation owner: user
  relation viewer: user | team#member
  permission view = viewer + owner
}
definition document {
  relation parent: folder
  relation viewer: user
  permission view = viewer + parent-&gt;view     // inherits through the folder
}

$ zed permission check document:roadmap view user:dana   →   true</pre>
<p>מערכות בסגנון Zanzibar הן לא graph DB כללי: הן מתמחות בבדיקות הרשאה, עם <strong>zookies</strong> ‏(tokens של עקביות) כדי להימנע מבעיית ה-"new enemy" — בדיקה שמחושבת מול snapshot ישן יותר משינוי ה-ACL שהוציא מישהו.</p>
<p><strong>Knowledge graphs ו-GraphRAG</strong>: מחלצים ישויות וקשרים ממסמכים עם LLM לתוך graph, ואז עונים על שאלות על ידי שליפה של subgraphs מחוברים או סיכומי communities, במקום רק top-k של chunks דומים. זה עוזר לשאלות "גלובליות" ("מה הנושאים המרכזיים ב-10,000 הטיקטים האלה?") ולשאלות multi-hop; וזה עולה הרבה קריאות LLM כדי לבנות ולשמור עדכני.</p>`
      }
    },
    {
      h: { en: "Supernodes, sharding, and when Postgres is enough", he: "Supernodes, ‏sharding, ומתי Postgres מספיק" },
      body: {
        en: `<p><strong>Supernodes</strong> (dense nodes): real graphs follow a power law. A celebrity with 30 M followers, the "USA" country node, a shared office Wi-Fi IP, a default device fingerprint. Any traversal that passes through one explodes: depth-2 from a supernode touches tens of millions of edges, and writes to it contend on one record chain. Mitigations:</p>
<ul><li>Filter by <strong>relationship type and direction</strong> early — Neo4j groups a dense node's relationships by type/direction, so <code>-[:LIVES_IN]-&gt;</code> doesn't scan <code>&lt;-[:FOLLOWS]-</code>.</li>
<li><strong>Model around it</strong>: replace <code>(user)-[:IN]-&gt;(country)</code> with a property; bucket edges (<code>(celebrity)&lt;-[:FOLLOWS]-(bucket_2026_11)</code>); exclude known hub values (shared NAT IPs, "unknown" device) in fraud graphs.</li>
<li><strong>Cap traversals</strong>: <code>WHERE COUNT { (n)--() } &lt; 10000</code>-style degree guards, LIMIT per hop, timeouts.</li></ul>
<p><strong>Scaling is the hard part.</strong> Sharding a graph means cutting edges; any traversal crossing a cut becomes a network hop, and real graphs (social, fraud) have no clean partition. Hence the typical shapes:</p>
<ul><li><strong>Scale up + read replicas</strong>: one writer holding the whole graph (Neo4j cluster, Neptune), replicas for read throughput. Most production graphs are well under a few billion edges and fit on one big machine.</li>
<li><strong>Distributed graph DBs</strong> (JanusGraph on Cassandra/HBase, Dgraph, TigerGraph, NebulaGraph): scale-out storage, but multi-hop queries pay network latency per hop across shards.</li>
<li><strong>Composite/Fabric</strong> (Neo4j): split by a natural boundary (tenant, region) and query across databases explicitly.</li></ul>
<p><strong>When Postgres is enough:</strong> fixed shallow depth (1-3 hops), hierarchies (org charts, categories — consider <code>ltree</code> or a closure table), a graph that's a side feature of an otherwise relational app, and teams that don't want another stateful system to back up, patch and page on. Extensions like <strong>Apache AGE</strong> even add openCypher to Postgres. Reach for a native graph DB when depth is variable/deep, traversals are the main workload, or you need graph algorithms (PageRank, community detection, shortest paths) online.</p>
<blockquote>💡 Real world: many "we need a graph DB" projects end up as Postgres with an <code>edges</code> table plus an offline job (Spark GraphFrames, Neo4j GDS, NetworkX) for the heavy algorithms. Prove the traversal is your bottleneck before adding a new database to your on-call.</blockquote>`,
        he: `<p><strong>Supernodes</strong> ‏(nodes צפופים): graphs אמיתיים מתנהגים לפי power law. סלבריטי עם 30 מיליון עוקבים, ה-node של המדינה "USA", ‏IP של Wi-Fi משותף במשרד, ‏device fingerprint דיפולטי. כל traversal שעובר דרך אחד כזה מתפוצץ: עומק 2 מ-supernode נוגע בעשרות מיליוני קשתות, וכתיבות אליו מתחרות על שרשרת רשומות אחת. דרכי התמודדות:</p>
<ul><li>לסנן לפי <strong>סוג relationship וכיוון</strong> מוקדם — ‏Neo4j מקבץ את ה-relationships של node צפוף לפי סוג וכיוון, כך ש-<code>-[:LIVES_IN]-&gt;</code> לא סורק את <code>&lt;-[:FOLLOWS]-</code>.</li>
<li><strong>למדל מסביב</strong>: להחליף <code>(user)-[:IN]-&gt;(country)</code> ב-property; לחלק קשתות ל-buckets ‏(<code>(celebrity)&lt;-[:FOLLOWS]-(bucket_2026_11)</code>); להוציא ערכי hub ידועים (IPs של NAT משותף, מכשיר "unknown") ב-graphs של fraud.</li>
<li><strong>להגביל traversals</strong>: שמירה על degree בסגנון <code>WHERE COUNT { (n)--() } &lt; 10000</code>, ‏LIMIT לכל hop, ‏timeouts.</li></ul>
<p><strong>ה-scaling הוא החלק הקשה.</strong> לעשות sharding ל-graph אומר לחתוך קשתות; כל traversal שחוצה חתך הופך ל-hop ברשת, ול-graphs אמיתיים (חברתיים, fraud) אין חלוקה נקייה. לכן הצורות הטיפוסיות:</p>
<ul><li><strong>Scale up ו-read replicas</strong>: ‏writer אחד שמחזיק את כל ה-graph ‏(cluster של Neo4j, ‏Neptune), ו-replicas ל-throughput של קריאה. רוב ה-graphs בפרודקשן הרבה מתחת לכמה מיליארדי קשתות ונכנסים למכונה גדולה אחת.</li>
<li><strong>Graph DBs מבוזרים</strong> ‏(JanusGraph על Cassandra/HBase, ‏Dgraph, ‏TigerGraph, ‏NebulaGraph): אחסון שעושה scale-out, אבל queries של כמה hops משלמים latency של רשת לכל hop בין shards.</li>
<li><strong>Composite/Fabric</strong> ‏(Neo4j): לפצל לפי גבול טבעי (tenant, ‏region) ולשאול על פני databases במפורש.</li></ul>
<p><strong>מתי Postgres מספיק:</strong> עומק קבוע ורדוד (1-3 hops), היררכיות (מבנה ארגוני, קטגוריות — שקול <code>ltree</code> או closure table), ‏graph שהוא פיצ'ר צדדי באפליקציה שבעיקרה רלציונית, וצוותים שלא רוצים עוד מערכת stateful לגבות, לעדכן ולקבל עליה page. הרחבות כמו <strong>Apache AGE</strong> אפילו מוסיפות openCypher ל-Postgres. תלך ל-graph DB native כשהעומק משתנה או עמוק, כשה-traversals הם ה-workload המרכזי, או כשאתה צריך אלגוריתמים של graph ‏(PageRank, ‏community detection, ‏shortest paths) אונליין.</p>
<blockquote>💡 מהשטח: הרבה פרויקטים של "אנחנו צריכים graph DB" נגמרים כ-Postgres עם טבלת <code>edges</code> ועוד job אופליין ‏(Spark GraphFrames, ‏Neo4j GDS, ‏NetworkX) לאלגוריתמים הכבדים. תוכיח שה-traversal הוא צוואר הבקבוק לפני שאתה מוסיף DB חדש ל-on-call שלך.</blockquote>`
      }
    }
  ],
  diagram: `fraud graph (property model)

 (Account A1 ⚑)──USES──►(Device ab12)◄──USES──(Account A2)
       │                                          │
   PAYS_WITH                                  PAYS_WITH
       ▼                                          ▼
 (Card 4580..11)◄────────PAYS_WITH────────(Account A3)

 native store: node record → first rel record → next rel → ...   O(1) per hop
 SQL:          frontier ⨝ edges(src) index lookup per hop          O(log E) per edge`,
  handsOn: [
    { cmd: "docker run -d --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/devpassword123 neo4j:5",
      what: { en: "Run Neo4j locally; open http://localhost:7474 and try the Cypher examples from this lesson.", he: "תריץ Neo4j מקומית; תפתח את http://localhost:7474 ותנסה את דוגמאות ה-Cypher מהשיעור." } },
    { cmd: `docker exec -it neo4j cypher-shell -u neo4j -p devpassword123 "PROFILE MATCH (a:Account {id:'A1'})-[:USES]->(d)<-[:USES]-(b) RETURN b.id"`,
      what: { en: "PROFILE shows db hits per operator and whether the traversal started from an index seek or a full label scan.", he: "PROFILE מראה db hits לכל operator והאם ה-traversal התחיל מ-index seek או מסריקה מלאה של label." } },
    { cmd: `psql -c "EXPLAIN ANALYZE WITH RECURSIVE r(n,d) AS (SELECT dst,1 FROM edges WHERE src=42 UNION ALL SELECT e.dst,r.d+1 FROM r JOIN edges e ON e.src=r.n WHERE r.d<3) SELECT count(DISTINCT n) FROM r;"`,
      what: { en: "Compare the same 3-hop traversal in Postgres: see the recursive union and an index scan per iteration.", he: "תשווה את אותו traversal של 3 hops ב-Postgres: תראה את ה-recursive union ו-index scan בכל איטרציה." } },
    { cmd: "zed permission check document:roadmap view user:dana --explain",
      what: { en: "SpiceDB: check a permission and print the relation path that granted it.", he: "SpiceDB: בודק הרשאה ומדפיס את מסלול ה-relations שהעניק אותה." } }
  ],
  mnemonic: {
    en: "\"Graph DBs pay per hop, SQL pays per table.\" Deep and variable → graph. Shallow and fixed → Postgres. Watch the mayor holding two million hands (supernodes).",
    he: "\"Graph DB משלם לפי hop, ‏SQL משלם לפי טבלה.\" עמוק ומשתנה ← graph. רדוד וקבוע ← Postgres. ותיזהר מראש העיר שמחזיק שני מיליון ידיים (supernodes)."
  },
  pitfalls: [
    { en: "Unbounded variable-length patterns ([*]) on a dense graph: path count grows exponentially and one query can exhaust heap. Always bound depth and set transaction timeouts.", he: "דפוסים באורך משתנה בלי גבול ([*]) על graph צפוף: מספר המסלולים גדל אקספוננציאלית ו-query אחד יכול לגמור את ה-heap. תמיד תגביל עומק ותגדיר transaction timeouts." },
    { en: "Modeling low-cardinality attributes (country, gender, status) as nodes: you create supernodes that every traversal crosses. Use properties.", he: "למדל תכונות עם cardinality נמוך (מדינה, מגדר, סטטוס) כ-nodes: אתה יוצר supernodes שכל traversal עובר דרכם. תשתמש ב-properties." },
    { en: "Planning to 'just shard it later': graph partitioning cuts edges and turns hops into network calls. Size for scale-up + replicas, or partition by a natural boundary like tenant.", he: "לתכנן 'נעשה sharding אחר כך': חלוקה של graph חותכת קשתות והופכת hops לקריאות רשת. תתכנן ל-scale up ו-replicas, או לחלוקה לפי גבול טבעי כמו tenant." },
    { en: "Adopting a graph DB for a 2-hop query that a JOIN with good indexes serves in milliseconds — a new stateful system to operate for no gain.", he: "לאמץ graph DB בשביל query של 2 hops ש-JOIN עם indexes טובים מגיש במילישניות — עוד מערכת stateful לתפעל בלי שום רווח." }
  ],
  interview: [
    { q: { en: "Why are graph databases faster than SQL for deep traversals, and when is that advantage irrelevant?", he: "למה graph databases מהירים יותר מ-SQL ב-traversals עמוקים, ומתי היתרון הזה לא רלוונטי?" },
      a: { en: "Native graph stores use index-free adjacency: each node links directly to its relationships, so a hop is a pointer chase (O(1)) and traversal cost scales with the subgraph touched. SQL does an index lookup + JOIN per hop (O(log E) per edge, random I/O), and the planner handles recursion poorly. For 1-2 fixed hops with good indexes the difference is negligible, and operational cost dominates.", he: "אחסון graph native משתמש ב-index-free adjacency: כל node מקושר ישירות ל-relationships שלו, אז hop הוא מעקב אחרי pointer ‏(O(1)) והמחיר של traversal גדל לפי ה-subgraph שנגעת בו. ‏SQL עושה חיפוש ב-index ועוד JOIN לכל hop ‏(O(log E) לכל קשת, ‏I/O אקראי), וה-planner מתמודד גרוע עם רקורסיה. ב-1-2 hops קבועים עם indexes טובים ההבדל זניח, והעלות התפעולית היא מה שקובע." } },
    { q: { en: "How would you design authorization for a Google-Drive-like product with nested folders and shared groups?", he: "איך היית מתכנן authorization למוצר בסגנון Google Drive עם תיקיות מקוננות וקבוצות משותפות?" },
      a: { en: "ReBAC à la Zanzibar: store relation tuples (doc#parent@folder, folder#viewer@team#member), define permissions as set expressions (view = viewer + owner + parent->view), and evaluate checks by graph walk in a dedicated service (SpiceDB/OpenFGA). Cache aggressively, use consistency tokens (zookies) so a check is never evaluated against a snapshot older than a revocation, and add a ListObjects/lookup path for 'what can user X see'.", he: "ReBAC בסגנון Zanzibar: לשמור relation tuples ‏(doc#parent@folder, ‏folder#viewer@team#member), להגדיר הרשאות כביטויי קבוצות (view = viewer + owner + parent->view), ולחשב בדיקות בהליכה על graph ב-service ייעודי ‏(SpiceDB/OpenFGA). לעשות caching אגרסיבי, להשתמש ב-tokens של עקביות (zookies) כדי שבדיקה לא תחושב מול snapshot ישן יותר מביטול הרשאה, ולהוסיף מסלול ListObjects/lookup ל-'מה משתמש X יכול לראות'." } }
  ],
  quiz: [
    { q: { en: "What does 'index-free adjacency' mean?", he: "מה המשמעות של 'index-free adjacency'?" },
      options: [
        { en: "The graph DB has no indexes at all", he: "ל-graph DB אין indexes בכלל" },
        { en: "Each node directly references its relationships, so following an edge is a pointer hop independent of graph size", he: "כל node מצביע ישירות על ה-relationships שלו, כך שמעבר על קשת הוא קפיצת pointer שלא תלויה בגודל ה-graph" },
        { en: "Edges are stored in a hash index", he: "הקשתות נשמרות ב-hash index" },
        { en: "Queries never need a starting node", he: "Queries אף פעם לא צריכים node התחלתי" }
      ], answer: 1,
      explain: { en: "You still use an index to find the starting node; after that, each hop follows stored pointers (O(1)) instead of an index lookup per edge.", he: "עדיין משתמשים ב-index כדי למצוא את ה-node ההתחלתי; אחרי זה, כל hop הולך לפי pointers שמורים ‏(O(1)) במקום חיפוש ב-index לכל קשת." } },
    { q: { en: "A fraud-graph query that used to take 50 ms now times out. It traverses through Device nodes. What's the most likely cause?", he: "Query על graph של fraud שלקח 50 ms עכשיו נכנס ל-timeout. הוא עובר דרך nodes של Device. מה הסיבה הסבירה?" },
      options: [
        { en: "The index on Account.id was dropped", he: "ה-index על Account.id נמחק" },
        { en: "A supernode — e.g. a default/unknown device fingerprint now shared by hundreds of thousands of accounts", he: "Supernode — למשל device fingerprint דיפולטי או unknown שעכשיו משותף למאות אלפי חשבונות" },
        { en: "Cypher doesn't support 3 hops", he: "Cypher לא תומך ב-3 hops" },
        { en: "Too many read replicas", he: "יותר מדי read replicas" }
      ], answer: 1,
      explain: { en: "Hub values (shared NAT IPs, 'unknown' fingerprints) create dense nodes; any traversal through them explodes. Exclude hub values or cap degree.", he: "ערכי hub ‏(IPs של NAT משותף, ‏fingerprints של 'unknown') יוצרים nodes צפופים; כל traversal דרכם מתפוצץ. תוציא ערכי hub או תגביל degree." } },
    { q: { en: "Which system is purpose-built for 'can user U do action A on resource R' over nested groups and folders?", he: "איזו מערכת בנויה במיוחד ל-'האם משתמש U יכול לעשות פעולה A על משאב R' מעל קבוצות ותיקיות מקוננות?" },
      options: [
        { en: "Memgraph", he: "Memgraph" },
        { en: "SPARQL endpoint", he: "SPARQL endpoint" },
        { en: "A Zanzibar-style ReBAC service such as SpiceDB or OpenFGA", he: "Service של ReBAC בסגנון Zanzibar כמו SpiceDB או OpenFGA" },
        { en: "A recursive CTE in the app DB per request", he: "Recursive CTE ב-DB של האפליקציה בכל request" }
      ], answer: 2,
      explain: { en: "Zanzibar-style systems store relation tuples and evaluate permission expressions by graph walk, with caching and consistency tokens tuned for millions of checks per second.", he: "מערכות בסגנון Zanzibar שומרות relation tuples ומחשבות ביטויי הרשאה בהליכה על graph, עם caching ו-tokens של עקביות שמכוונים למיליוני בדיקות בשנייה." } },
    { q: { en: "Your app needs 'manager chain up to the CEO' for an org of 20,000 people. Best choice?", he: "האפליקציה שלך צריכה 'שרשרת מנהלים עד ה-CEO' לארגון של 20,000 איש. מה הבחירה הכי טובה?" },
      options: [
        { en: "Add Neo4j", he: "להוסיף Neo4j" },
        { en: "Postgres with a recursive CTE (or ltree/closure table)", he: "Postgres עם recursive CTE (או ltree/closure table)" },
        { en: "A distributed graph DB on Cassandra", he: "Graph DB מבוזר על Cassandra" },
        { en: "GraphRAG", he: "GraphRAG" }
      ], answer: 1,
      explain: { en: "A shallow hierarchy (depth ~10) over 20k rows is trivial for Postgres. A new graph DB adds operational cost for no benefit.", he: "היררכיה רדודה (עומק ~10) מעל 20 אלף שורות היא טריוויאלית ל-Postgres. ‏Graph DB חדש מוסיף עלות תפעולית בלי שום תועלת." } }
  ],
  related: ["pr-db-landscape", "db-indexes", "db-sql-vs-nosql", "pr-auth", "ai-rag-deep", "db-vector"]
});

// ---------------------------------------------------------------------------
// 4. SLOs as Code
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "obs-slo-as-code",
  track: "observability",
  order: 40,
  icon: "📐",
  level: 3,
  minutes: 14,
  title: { en: "SLOs as Code", he: "SLOs as Code" },
  tldr: {
    en: "Write each SLO once as a reviewed YAML spec (good events / total events, target, window), and let a generator (Sloth, Pyrra, OpenSLO tooling) produce the recording rules, multi-window multi-burn-rate alerts and dashboards — so SLOs are versioned, consistent and reviewed like code.",
    he: "כותבים כל SLO פעם אחת כ-spec של YAML שעובר review ‏(good events חלקי total events, יעד, חלון), ונותנים ל-generator ‏(Sloth, ‏Pyrra, כלים של OpenSLO) לייצר את ה-recording rules, ההתראות מסוג multi-window multi-burn-rate וה-dashboards — כך שה-SLOs מנוהלים בגרסאות, עקביים ועוברים review כמו קוד."
  },
  analogy: {
    en: "Hand-written SLO alerts are like every chef in a chain writing their own version of the recipe on a napkin: each kitchen's 'medium-rare' is different and nobody knows which napkin is current. SLOs as code is the central recipe book: one card per dish, reviewed by the head chef, and the kitchen machines (rules, alerts, dashboards) are programmed straight from the card.",
    he: "התראות SLO שנכתבות ביד הן כמו שכל שף ברשת כותב גרסה משלו של המתכון על מפית: ה-'מדיום-רייר' שונה בכל מטבח ואף אחד לא יודע איזו מפית עדכנית. ‏SLOs as code זה ספר המתכונים המרכזי: כרטיס אחד לכל מנה, שהשף הראשי עבר עליו, ומכונות המטבח (rules, התראות, dashboards) מתוכנתות ישר מהכרטיס."
  },
  sections: [
    {
      h: { en: "SLIs in PromQL: good over total", he: "SLI ב-PromQL: ‏good חלקי total" },
      body: {
        en: `<p>Every SLI is a ratio of <strong>good events / valid events</strong> over a window. In Prometheus that means two counters and <code>rate()</code>:</p>
<pre># Availability: non-5xx responses / all responses (exclude health checks)
sum(rate(http_requests_total{job="checkout", route!="/healthz", code!~"5.."}[5m]))
/
sum(rate(http_requests_total{job="checkout", route!="/healthz"}[5m]))

# Latency: requests faster than 300 ms / all requests — straight from histogram buckets
sum(rate(http_request_duration_seconds_bucket{job="checkout", le="0.3"}[5m]))
/
sum(rate(http_request_duration_seconds_count{job="checkout"}[5m]))</pre>
<p>Why the bucket and not <code>histogram_quantile()</code>? Because "p99 &lt; 300 ms" can't be summed into an error budget, but "99% of requests under 300 ms" can: each request is good or bad, and bad requests consume budget. The <code>le</code> bucket counter is <em>exactly</em> the count of requests ≤ 0.3 s — no interpolation error.</p>
<p>The catch: <strong>the threshold must be a bucket boundary</strong>. Default client buckets are <code>.005 .01 .025 .05 .1 .25 .5 1 2.5 5 10</code> — there's no 0.3. Either define buckets that include your SLO thresholds (<code>buckets=[0.05, 0.1, 0.3, 0.5, 1, 2]</code>) or use native histograms, where <code>histogram_fraction(0, 0.3, rate(http_request_duration_seconds[5m]))</code> estimates it.</p>
<blockquote>⚠️ Production tip: decide where you measure. Server-side metrics miss requests that died at the load balancer or never arrived. Many teams take the availability SLI from the LB/ingress (e.g. <code>nginx_ingress_controller_requests</code> or ALB metrics) — closest to what users feel — and keep service metrics for debugging.</blockquote>`,
        he: `<p>כל SLI הוא יחס של <strong>good events חלקי valid events</strong> על פני חלון. ב-Prometheus זה אומר שני counters ו-<code>rate()</code>:</p>
<pre># Availability: non-5xx responses / all responses (exclude health checks)
sum(rate(http_requests_total{job="checkout", route!="/healthz", code!~"5.."}[5m]))
/
sum(rate(http_requests_total{job="checkout", route!="/healthz"}[5m]))

# Latency: requests faster than 300 ms / all requests — straight from histogram buckets
sum(rate(http_request_duration_seconds_bucket{job="checkout", le="0.3"}[5m]))
/
sum(rate(http_request_duration_seconds_count{job="checkout"}[5m]))</pre>
<p>למה ה-bucket ולא <code>histogram_quantile()</code>? כי את "p99 מתחת ל-300 ms" אי אפשר לסכום ל-error budget, אבל את "99% מהבקשות מתחת ל-300 ms" אפשר: כל בקשה היא טובה או רעה, ובקשות רעות צורכות budget. ה-counter של ה-bucket עם <code>le</code> הוא <em>בדיוק</em> מספר הבקשות שלקחו 0.3 שניות או פחות — בלי שגיאת אינטרפולציה.</p>
<p>הקאץ': <strong>הסף חייב להיות גבול של bucket</strong>. ה-buckets הדיפולטיים ב-client הם <code>.005 .01 .025 .05 .1 .25 .5 1 2.5 5 10</code> — אין 0.3. או שתגדיר buckets שכוללים את ספי ה-SLO שלך (<code>buckets=[0.05, 0.1, 0.3, 0.5, 1, 2]</code>), או שתשתמש ב-native histograms, שבהם <code>histogram_fraction(0, 0.3, rate(http_request_duration_seconds[5m]))</code> מעריך את זה.</p>
<blockquote>⚠️ טיפ לפרודקשן: תחליט איפה אתה מודד. ‏Metrics בצד השרת מפספסים בקשות שמתו ב-load balancer או שלא הגיעו בכלל. הרבה צוותים לוקחים את ה-SLI של availability מה-LB או ה-ingress (למשל <code>nginx_ingress_controller_requests</code> או metrics של ALB) — הכי קרוב למה שהמשתמש מרגיש — ומשאירים את ה-metrics של ה-service ל-debugging.</blockquote>`
      }
    },
    {
      h: { en: "The spec: OpenSLO and Sloth YAML", he: "ה-spec: ‏YAML של OpenSLO ו-Sloth" },
      body: {
        en: `<p><strong>OpenSLO</strong> is a vendor-neutral spec (Kubernetes-style YAML) for services, SLIs, SLOs, alert policies. Nobl9 implements it natively; tools convert it to Prometheus rules or vendor configs.</p>
<pre>apiVersion: openslo/v1
kind: SLO
metadata:
  name: checkout-availability
  displayName: Checkout availability
spec:
  service: checkout
  description: "Successful checkout API responses, measured at the ingress"
  budgetingMethod: Occurrences        # or Timeslices
  timeWindow:
    - duration: 28d
      isRolling: true
  indicator:
    metadata: { name: checkout-good-ratio }
    spec:
      ratioMetric:
        counter: true
        good:
          metricSource:
            type: Prometheus
            spec: { query: 'sum(rate(http_requests_total{job="checkout",code!~"5.."}[1m]))' }
        total:
          metricSource:
            type: Prometheus
            spec: { query: 'sum(rate(http_requests_total{job="checkout"}[1m]))' }
  objectives:
    - displayName: good
      target: 0.999</pre>
<p><strong>Sloth</strong> uses a shorter Prometheus-specific spec; <code>{{.window}}</code> is replaced by each window it needs (5m, 30m, 1h, 2h, 6h, 1d, 3d, 30d):</p>
<pre># slos/checkout.yaml
version: "prometheus/v1"
service: "checkout"
labels: { owner: "payments-team", tier: "1" }
slos:
  - name: "requests-availability"
    objective: 99.9
    description: "99.9% of checkout requests return non-5xx over 30 days"
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="checkout",code=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{job="checkout"}[{{.window}}]))
    alerting:
      name: CheckoutHighErrorRate
      annotations: { runbook: "https://runbooks.internal/checkout/availability" }
      page_alert:   { labels: { severity: critical, team: payments } }
      ticket_alert: { labels: { severity: warning,  team: payments } }</pre>
<pre>$ sloth validate -i ./slos
$ sloth generate -i ./slos/checkout.yaml -o ./rules/checkout.rules.yaml</pre>`,
        he: `<p><strong>OpenSLO</strong> הוא spec ניטרלי לספקים (YAML בסגנון Kubernetes) ל-services, ‏SLIs, ‏SLOs ו-alert policies. ‏Nobl9 מממש אותו באופן native; כלים ממירים אותו ל-rules של Prometheus או לקונפיג של ספקים.</p>
<pre>apiVersion: openslo/v1
kind: SLO
metadata:
  name: checkout-availability
  displayName: Checkout availability
spec:
  service: checkout
  description: "Successful checkout API responses, measured at the ingress"
  budgetingMethod: Occurrences        # or Timeslices
  timeWindow:
    - duration: 28d
      isRolling: true
  indicator:
    metadata: { name: checkout-good-ratio }
    spec:
      ratioMetric:
        counter: true
        good:
          metricSource:
            type: Prometheus
            spec: { query: 'sum(rate(http_requests_total{job="checkout",code!~"5.."}[1m]))' }
        total:
          metricSource:
            type: Prometheus
            spec: { query: 'sum(rate(http_requests_total{job="checkout"}[1m]))' }
  objectives:
    - displayName: good
      target: 0.999</pre>
<p><strong>Sloth</strong> משתמש ב-spec קצר יותר שספציפי ל-Prometheus; ‏<code>{{.window}}</code> מוחלף בכל חלון שהוא צריך (5m, ‏30m, ‏1h, ‏2h, ‏6h, ‏1d, ‏3d, ‏30d):</p>
<pre># slos/checkout.yaml
version: "prometheus/v1"
service: "checkout"
labels: { owner: "payments-team", tier: "1" }
slos:
  - name: "requests-availability"
    objective: 99.9
    description: "99.9% of checkout requests return non-5xx over 30 days"
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="checkout",code=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{job="checkout"}[{{.window}}]))
    alerting:
      name: CheckoutHighErrorRate
      annotations: { runbook: "https://runbooks.internal/checkout/availability" }
      page_alert:   { labels: { severity: critical, team: payments } }
      ticket_alert: { labels: { severity: warning,  team: payments } }</pre>
<pre>$ sloth validate -i ./slos
$ sloth generate -i ./slos/checkout.yaml -o ./rules/checkout.rules.yaml</pre>`
      }
    },
    {
      h: { en: "What the generator produces: recording rules and burn-rate alerts", he: "מה ה-generator מייצר: ‏recording rules והתראות burn-rate" },
      body: {
        en: `<p>From those ~20 lines Sloth emits ~3 rule groups (abridged):</p>
<pre>groups:
- name: sloth-slo-sli-recordings-checkout-requests-availability
  rules:
  - record: slo:sli_error:ratio_rate5m
    expr: |
      (sum(rate(http_requests_total{job="checkout",code=~"5.."}[5m])))
      /
      (sum(rate(http_requests_total{job="checkout"}[5m])))
    labels: { sloth_id: checkout-requests-availability, sloth_service: checkout,
              sloth_slo: requests-availability, sloth_window: 5m }
  # ... same for 30m, 1h, 2h, 6h, 1d, 3d, and slo:sli_error:ratio_rate30d

- name: sloth-slo-meta-recordings-checkout-requests-availability
  rules:
  - record: slo:objective:ratio
    expr: vector(0.999)
  - record: slo:error_budget:ratio
    expr: vector(1 - 0.999)
  - record: slo:current_burn_rate:ratio            # error ratio (5m) / budget
  - record: slo:period_burn_rate:ratio             # error ratio (30d) / budget
  - record: slo:period_error_budget_remaining:ratio
    expr: 1 - slo:period_burn_rate:ratio{sloth_id="checkout-requests-availability"}

- name: sloth-slo-alerts-checkout-requests-availability
  rules:
  - alert: CheckoutHighErrorRate
    expr: |
      (
        max(slo:sli_error:ratio_rate5m{sloth_id="checkout-requests-availability"} &gt; (14.4 * 0.001)) without (sloth_window)
        and
        max(slo:sli_error:ratio_rate1h{sloth_id="checkout-requests-availability"} &gt; (14.4 * 0.001)) without (sloth_window)
      )
      or
      (
        max(slo:sli_error:ratio_rate30m{sloth_id="checkout-requests-availability"} &gt; (6 * 0.001)) without (sloth_window)
        and
        max(slo:sli_error:ratio_rate6h{sloth_id="checkout-requests-availability"} &gt; (6 * 0.001)) without (sloth_window)
      )
    labels: { sloth_severity: page, severity: critical, team: payments }
  - alert: CheckoutHighErrorRate
    expr: |   # ticket: 3x over 2h AND 1d,  or  1x over 6h AND 3d
      ...
    labels: { sloth_severity: ticket, severity: warning, team: payments }</pre>
<p>Reading the page alert: <strong>14.4×</strong> burn over <strong>1 h</strong> = 2% of a 30-day budget gone in an hour (budget exhausted in ~2 days); the <strong>5 m</strong> short window makes the alert resolve within minutes of recovery. <strong>6×</strong> over 6 h = 5% gone. The ticket alerts (3× over 1 d = 10%, 1× over 3 d = 10%) catch slow leaks. These are the Google SRE Workbook numbers — and writing them by hand for 40 SLOs is how typos ship. That's the whole point of generating them.</p>
<p><strong>Pyrra</strong> does the same as a Kubernetes CRD, plus a built-in UI that lists every SLO with budget remaining:</p>
<pre>apiVersion: pyrra.dev/v1alpha1
kind: ServiceLevelObjective
metadata:
  name: checkout-latency
  namespace: monitoring
  labels: { prometheus: k8s, role: alert-rules }
spec:
  target: "99"
  window: 28d
  description: "99% of checkout requests complete in under 300 ms"
  indicator:
    latency:
      success: { metric: http_request_duration_seconds_bucket{job="checkout",le="0.3"} }
      total:   { metric: http_request_duration_seconds_count{job="checkout"} }</pre>
<p>The Pyrra operator writes a <code>PrometheusRule</code> next to it (recording rules like <code>http_request_duration_seconds:burnrate5m</code> and burn-rate alerts), which prometheus-operator loads.</p>`,
        he: `<p>מתוך ~20 השורות האלה Sloth מוציא ~3 קבוצות של rules (בקיצור):</p>
<pre>groups:
- name: sloth-slo-sli-recordings-checkout-requests-availability
  rules:
  - record: slo:sli_error:ratio_rate5m
    expr: |
      (sum(rate(http_requests_total{job="checkout",code=~"5.."}[5m])))
      /
      (sum(rate(http_requests_total{job="checkout"}[5m])))
    labels: { sloth_id: checkout-requests-availability, sloth_service: checkout,
              sloth_slo: requests-availability, sloth_window: 5m }
  # ... same for 30m, 1h, 2h, 6h, 1d, 3d, and slo:sli_error:ratio_rate30d

- name: sloth-slo-meta-recordings-checkout-requests-availability
  rules:
  - record: slo:objective:ratio
    expr: vector(0.999)
  - record: slo:error_budget:ratio
    expr: vector(1 - 0.999)
  - record: slo:current_burn_rate:ratio            # error ratio (5m) / budget
  - record: slo:period_burn_rate:ratio             # error ratio (30d) / budget
  - record: slo:period_error_budget_remaining:ratio
    expr: 1 - slo:period_burn_rate:ratio{sloth_id="checkout-requests-availability"}

- name: sloth-slo-alerts-checkout-requests-availability
  rules:
  - alert: CheckoutHighErrorRate
    expr: |
      (
        max(slo:sli_error:ratio_rate5m{sloth_id="checkout-requests-availability"} &gt; (14.4 * 0.001)) without (sloth_window)
        and
        max(slo:sli_error:ratio_rate1h{sloth_id="checkout-requests-availability"} &gt; (14.4 * 0.001)) without (sloth_window)
      )
      or
      (
        max(slo:sli_error:ratio_rate30m{sloth_id="checkout-requests-availability"} &gt; (6 * 0.001)) without (sloth_window)
        and
        max(slo:sli_error:ratio_rate6h{sloth_id="checkout-requests-availability"} &gt; (6 * 0.001)) without (sloth_window)
      )
    labels: { sloth_severity: page, severity: critical, team: payments }
  - alert: CheckoutHighErrorRate
    expr: |   # ticket: 3x over 2h AND 1d,  or  1x over 6h AND 3d
      ...
    labels: { sloth_severity: ticket, severity: warning, team: payments }</pre>
<p>איך קוראים את התראת ה-page: burn של <strong>פי 14.4</strong> על פני <strong>שעה</strong> = ‏2% מ-budget של 30 יום נעלמו בשעה (ה-budget ייגמר תוך ~יומיים); החלון הקצר של <strong>5 דקות</strong> גורם להתראה להיסגר תוך דקות מההתאוששות. <strong>פי 6</strong> על פני 6 שעות = ‏5% נעלמו. התראות ה-ticket ‏(פי 3 על פני יום = ‏10%, פי 1 על פני 3 ימים = ‏10%) תופסות דליפות איטיות. אלה המספרים מה-SRE Workbook של גוגל — ולכתוב אותם ביד ל-40 SLOs זו הדרך שבה typos מגיעים לפרודקשן. זו כל הנקודה בלייצר אותם.</p>
<p><strong>Pyrra</strong> עושה את אותו הדבר כ-CRD של Kubernetes, ועוד UI מובנה שמציג כל SLO עם ה-budget שנשאר:</p>
<pre>apiVersion: pyrra.dev/v1alpha1
kind: ServiceLevelObjective
metadata:
  name: checkout-latency
  namespace: monitoring
  labels: { prometheus: k8s, role: alert-rules }
spec:
  target: "99"
  window: 28d
  description: "99% of checkout requests complete in under 300 ms"
  indicator:
    latency:
      success: { metric: http_request_duration_seconds_bucket{job="checkout",le="0.3"} }
      total:   { metric: http_request_duration_seconds_count{job="checkout"} }</pre>
<p>ה-operator של Pyrra כותב לידו <code>PrometheusRule</code> ‏(recording rules כמו <code>http_request_duration_seconds:burnrate5m</code> והתראות burn-rate), ש-prometheus-operator טוען.</p>`
      }
    },
    {
      h: { en: "SLOs for async, batch and pipeline work", he: "SLOs לעבודה אסינכרונית, batch ו-pipelines" },
      body: {
        en: `<p>Request/response SLIs don't fit a nightly billing job or a Kafka consumer. Pick the user-visible property instead:</p>
<table><tr><th>Workload</th><th>SLI (good / total)</th><th>Example PromQL / signal</th></tr>
<tr><td>Batch job</td><td>runs that finished successfully <em>before the deadline</em> / scheduled runs</td><td><code>increase(job_runs_total{job="billing",result="success",on_time="true"}[30d]) / increase(job_runs_total{job="billing"}[30d])</code></td></tr>
<tr><td>Data freshness</td><td>minutes in which data is fresher than X / all minutes (timeslice)</td><td><code>time() - max(pipeline_last_success_timestamp_seconds{pipeline="orders_dwh"}) &lt; 3600</code></td></tr>
<tr><td>Queue consumer</td><td>messages processed within 5 min of being produced / messages processed</td><td>end-to-end latency histogram with <code>le="300"</code>, or <code>kafka_consumergroup_lag</code> converted to seconds</td></tr>
<tr><td>Correctness</td><td>records passing validation / records processed</td><td>data quality checks emitting good/bad counters</td></tr></table>
<p>For freshness-style SLIs use a <strong>timeslice</strong> budget (OpenSLO <code>budgetingMethod: Timeslices</code>): each minute is good or bad, so a 99% monthly target allows ~7.2 hours of stale data. Make the batch job push its last-success timestamp (Pushgateway or a textfile collector) — and alert on <code>absent()</code> too, because a job that never runs emits no failures.</p>
<blockquote>💡 Real world: the classic pipeline incident is silent — the job "succeeded" but processed 0 rows because an upstream export was empty. Add a correctness/volume SLI (rows processed vs a 7-day baseline), not just "exit code 0".</blockquote>`,
        he: `<p>SLIs של request/response לא מתאימים ל-job לילי של חיובים או ל-consumer של Kafka. תבחר במקום זה את התכונה שהמשתמש רואה:</p>
<table><tr><th>Workload</th><th>SLI ‏(good / total)</th><th>דוגמה ל-PromQL או לסיגנל</th></tr>
<tr><td>Batch job</td><td>ריצות שהסתיימו בהצלחה <em>לפני ה-deadline</em> / ריצות מתוזמנות</td><td><code>increase(job_runs_total{job="billing",result="success",on_time="true"}[30d]) / increase(job_runs_total{job="billing"}[30d])</code></td></tr>
<tr><td>רעננות data</td><td>דקות שבהן ה-data רענן מ-X / כל הדקות (timeslice)</td><td><code>time() - max(pipeline_last_success_timestamp_seconds{pipeline="orders_dwh"}) &lt; 3600</code></td></tr>
<tr><td>Queue consumer</td><td>הודעות שעובדו תוך 5 דקות מרגע שנוצרו / הודעות שעובדו</td><td>histogram של latency מקצה לקצה עם <code>le="300"</code>, או <code>kafka_consumergroup_lag</code> שהומר לשניות</td></tr>
<tr><td>נכונות</td><td>רשומות שעברו validation / רשומות שעובדו</td><td>בדיקות data quality שמוציאות counters של good/bad</td></tr></table>
<p>ל-SLIs בסגנון רעננות תשתמש ב-budget של <strong>timeslice</strong> ‏(ב-OpenSLO זה <code>budgetingMethod: Timeslices</code>): כל דקה היא טובה או רעה, אז יעד חודשי של 99% מאפשר ~7.2 שעות של data לא עדכני. תגרום ל-batch job לדחוף את ה-timestamp של ההצלחה האחרונה (Pushgateway או textfile collector) — ותתריע גם על <code>absent()</code>, כי job שלא רץ בכלל לא מוציא כישלונות.</p>
<blockquote>💡 מהשטח: התקלה הקלאסית של pipeline היא שקטה — ה-job "הצליח" אבל עיבד 0 שורות כי ה-export מלמעלה היה ריק. תוסיף SLI של נכונות או נפח (שורות שעובדו מול baseline של 7 ימים), לא רק "exit code 0".</blockquote>`
      }
    },
    {
      h: { en: "Living with SLOs: repo layout, dashboards, policy and quarterly review", he: "לחיות עם SLOs: מבנה repo, ‏dashboards, ‏policy וסקירה רבעונית" },
      body: {
        en: `<p>A typical layout — SLO specs live next to the service (or in a central <code>slos</code> repo) and CI does the rest:</p>
<pre>checkout/
  slo/
    checkout.sloth.yaml          # the specs (owned by the team, CODEOWNERS)
    error-budget-policy.yaml     # what happens at each budget level
.github/workflows/slo.yaml:
  - sloth validate -i checkout/slo
  - sloth generate -i checkout/slo -o build/rules/
  - promtool check rules build/rules/*.yaml
  - promtool test rules tests/checkout_slo_test.yaml   # unit-test alerts with synthetic series
  - deploy rules (PrometheusRule via GitOps) + provision Grafana dashboard</pre>
<pre># error-budget-policy.yaml — agreed by eng + product, versioned, reviewed
slo: checkout-requests-availability
owners: [payments-team]
levels:
  - when: "budget_remaining &gt; 50%"
    actions: ["normal release cadence"]
  - when: "budget_remaining &lt; 25%"
    actions: ["canary-only deploys", "no risky migrations", "reliability item in next sprint"]
  - when: "budget_remaining &lt;= 0"
    actions: ["feature freeze except fixes", "postmortem for top budget consumers", "VP sign-off to override"]
  - when: "single incident &gt; 20% of budget"
    actions: ["mandatory postmortem with P0 action item"]
review: quarterly</pre>
<p><strong>Dashboards</strong>: one row per SLO — current SLI vs objective, budget remaining (30d), burn rate (1h/6h), and a budget burn-down line. Generated from the same spec (Sloth and Pyrra ship Grafana dashboards keyed by the <code>sloth_*</code>/Pyrra labels), so a new SLO appears without anyone editing JSON.</p>
<p><strong>Quarterly review</strong> (30 minutes per service): Did we meet it? Did we page when users were hurt — and <em>only</em> then? Any incident users felt that the SLO missed (wrong SLI)? Is the target still right (always 100% met for a year = too loose or the budget is wasted; constantly broken = too tight or underinvested)? Change the YAML in a PR — the history of SLO changes becomes auditable.</p>
<p><strong>Managed options</strong> if you don't want to run this yourself:</p>
<ul><li><strong>Datadog SLOs</strong>: metric-based (good/total queries), monitor-based (uptime of monitors) and time-slice SLOs; burn-rate alerts built in; manageable via Terraform (<code>datadog_service_level_objective</code>).</li>
<li><strong>Grafana SLO</strong> (Grafana Cloud): wizard or API/Terraform; generates the Prometheus recording rules, multi-window burn-rate alerts and dashboards for you.</li>
<li><strong>Nobl9</strong>: OpenSLO-native, pulls SLIs from many sources (Prometheus, Datadog, CloudWatch, Splunk...), <code>sloctl apply -f slo.yaml</code>, strong reporting for error-budget policies across many teams.</li>
<li>Cloud-native: Google Cloud Monitoring SLOs, AWS CloudWatch Application Signals SLOs, Dynatrace, New Relic service levels.</li></ul>`,
        he: `<p>מבנה טיפוסי — ה-specs של ה-SLO חיים ליד ה-service (או ב-repo מרכזי של <code>slos</code>) וה-CI עושה את השאר:</p>
<pre>checkout/
  slo/
    checkout.sloth.yaml          # the specs (owned by the team, CODEOWNERS)
    error-budget-policy.yaml     # what happens at each budget level
.github/workflows/slo.yaml:
  - sloth validate -i checkout/slo
  - sloth generate -i checkout/slo -o build/rules/
  - promtool check rules build/rules/*.yaml
  - promtool test rules tests/checkout_slo_test.yaml   # unit-test alerts with synthetic series
  - deploy rules (PrometheusRule via GitOps) + provision Grafana dashboard</pre>
<pre># error-budget-policy.yaml — agreed by eng + product, versioned, reviewed
slo: checkout-requests-availability
owners: [payments-team]
levels:
  - when: "budget_remaining &gt; 50%"
    actions: ["normal release cadence"]
  - when: "budget_remaining &lt; 25%"
    actions: ["canary-only deploys", "no risky migrations", "reliability item in next sprint"]
  - when: "budget_remaining &lt;= 0"
    actions: ["feature freeze except fixes", "postmortem for top budget consumers", "VP sign-off to override"]
  - when: "single incident &gt; 20% of budget"
    actions: ["mandatory postmortem with P0 action item"]
review: quarterly</pre>
<p><strong>Dashboards</strong>: שורה לכל SLO — ה-SLI הנוכחי מול היעד, ה-budget שנשאר (30 יום), ‏burn rate ‏(1h/6h), וקו burn-down של ה-budget. נוצרים מאותו spec ‏(Sloth ו-Pyrra מגיעים עם dashboards של Grafana לפי ה-labels של <code>sloth_*</code> או של Pyrra), כך ש-SLO חדש מופיע בלי שמישהו יערוך JSON.</p>
<p><strong>סקירה רבעונית</strong> (30 דקות ל-service): עמדנו ביעד? קיבלנו page כשמשתמשים נפגעו — ו<em>רק</em> אז? היה אירוע שמשתמשים הרגישו וה-SLO פספס (SLI שגוי)? היעד עדיין נכון (עומדים ב-100% כבר שנה = רופף מדי או שה-budget מתבזבז; נשבר כל הזמן = הדוק מדי או שאין מספיק השקעה)? משנים את ה-YAML ב-PR — וההיסטוריה של שינויי SLO נהיית ניתנת לביקורת.</p>
<p><strong>אפשרויות מנוהלות</strong> אם אתה לא רוצה להריץ את זה בעצמך:</p>
<ul><li><strong>Datadog SLOs</strong>: מבוססי metric ‏(queries של good/total), מבוססי monitor ‏(uptime של monitors) ו-SLOs של time-slice; התראות burn-rate מובנות; ניהול דרך Terraform ‏(<code>datadog_service_level_objective</code>).</li>
<li><strong>Grafana SLO</strong> ‏(Grafana Cloud): wizard או API/Terraform; מייצר בשבילך את ה-recording rules של Prometheus, התראות burn-rate עם כמה חלונות ו-dashboards.</li>
<li><strong>Nobl9</strong>: native ל-OpenSLO, מושך SLIs מהרבה מקורות (Prometheus, ‏Datadog, ‏CloudWatch, ‏Splunk...), ‏<code>sloctl apply -f slo.yaml</code>, ודוחות חזקים ל-error-budget policies על פני הרבה צוותים.</li>
<li>Cloud-native: ‏SLOs של Google Cloud Monitoring, ‏SLOs של AWS CloudWatch Application Signals, ‏Dynatrace, ‏service levels של New Relic.</li></ul>`
      }
    }
  ],
  diagram: `slo/checkout.sloth.yaml  ──PR + review──►  CI
   (good/total, 99.9%, 30d)                │ sloth validate / generate
                                           │ promtool check + test rules
                                           ▼
             PrometheusRule (GitOps) ──► Prometheus
               ├─ slo:sli_error:ratio_rate{5m,30m,1h,2h,6h,1d,3d,30d}
               ├─ slo:period_error_budget_remaining:ratio ──► Grafana SLO dashboard
               └─ alerts: page  (14.4x 1h&5m | 6x 6h&30m)  ──► Alertmanager ──► on-call
                          ticket (3x 1d&2h  | 1x 3d&6h)   ──► Jira`,
  handsOn: [
    { cmd: "docker run --rm -v $PWD:/w ghcr.io/slok/sloth generate -i /w/slos/checkout.yaml -o /w/rules/checkout.rules.yaml",
      what: { en: "Generate recording rules and burn-rate alerts from a Sloth spec; open the output and find the 14.4 / 6 / 3 / 1 factors.", he: "תייצר recording rules והתראות burn-rate מ-spec של Sloth; תפתח את הפלט ותמצא את המקדמים 14.4 / 6 / 3 / 1." } },
    { cmd: "promtool check rules rules/checkout.rules.yaml && promtool test rules tests/checkout_slo_test.yaml",
      what: { en: "Lint the generated rules and unit-test that a synthetic 2% error rate fires the page alert.", he: "תעשה lint ל-rules שנוצרו ובדיקת unit שקצב שגיאות סינתטי של 2% מפעיל את התראת ה-page." } },
    { cmd: `curl -sG http://localhost:9090/api/v1/query --data-urlencode 'query=slo:period_error_budget_remaining:ratio' | jq '.data.result[] | {slo: .metric.sloth_id, remaining: .value[1]}'`,
      what: { en: "Query budget remaining for every SLO straight from Prometheus — the same series the dashboard uses.", he: "תשאל את ה-budget שנשאר לכל SLO ישירות מ-Prometheus — אותה סדרה שה-dashboard משתמש בה." } },
    { cmd: "kubectl get servicelevelobjectives.pyrra.dev -A && kubectl get prometheusrules -n monitoring",
      what: { en: "With Pyrra: list the SLO CRDs and the PrometheusRules the operator generated from them.", he: "עם Pyrra: תציג את ה-CRDs של ה-SLO ואת ה-PrometheusRules שה-operator ייצר מהם." } }
  ],
  mnemonic: {
    en: "\"Spec once, generate everything\": one reviewed YAML → rules, alerts, dashboard. And the magic numbers: 14.4 / 6 page, 3 / 1 ticket.",
    he: "\"Spec פעם אחת, לייצר הכל\": ‏YAML אחד שעבר review ← rules, התראות, dashboard. והמספרים הקסומים: 14.4 / 6 ל-page, ‏3 / 1 ל-ticket."
  },
  pitfalls: [
    { en: "Latency SLO threshold that isn't a histogram bucket boundary (300 ms with default buckets): the le=\"0.3\" series doesn't exist, so the SLI silently returns nothing. Align buckets with SLO thresholds.", he: "סף של latency SLO שהוא לא גבול של bucket ב-histogram ‏(300 ms עם buckets דיפולטיים): הסדרה le=\"0.3\" לא קיימת, אז ה-SLI מחזיר בשקט כלום. תיישר את ה-buckets לספי ה-SLO." },
    { en: "No traffic = no data = no alert: a ratio of 0/0 is NaN, not an error. Add absent()/low-traffic alerts and synthetic probes for low-volume services.", he: "אין טראפיק = אין data = אין התראה: יחס של 0/0 הוא NaN, לא שגיאה. תוסיף התראות absent() ו-low-traffic ו-probes סינתטיים ל-services עם נפח נמוך." },
    { en: "Hand-editing generated rules: the next generate overwrites them. Change the spec and regenerate in CI.", he: "לערוך ביד rules שנוצרו: ה-generate הבא דורס אותם. תשנה את ה-spec ותייצר מחדש ב-CI." },
    { en: "Defining SLOs nobody owns or reviews: targets drift away from user experience. Put owners in the spec and review quarterly.", he: "להגדיר SLOs שאף אחד לא אחראי עליהם ולא עובר עליהם: היעדים מתרחקים מחוויית המשתמש. תכניס owners ל-spec ותעשה סקירה רבעונית." }
  ],
  interview: [
    { q: { en: "Why define latency SLOs as 'fraction of requests under X ms' rather than 'p99 under X ms'?", he: "למה להגדיר latency SLO כ-'אחוז הבקשות מתחת ל-X ms' ולא כ-'p99 מתחת ל-X ms'?" },
      a: { en: "Because a fraction of good events composes into an error budget and burn rate — every slow request consumes budget, and you can aggregate across instances and windows exactly by summing bucket counters. Percentiles can't be averaged or summed, histogram_quantile interpolates, and 'p99 over 5m' doesn't tell you how much budget you've spent this month.", he: "כי אחוז של good events מתחבר ל-error budget ול-burn rate — כל בקשה איטית צורכת budget, ואפשר לאגד בדיוק על פני instances וחלונות על ידי סכימה של counters של buckets. אי אפשר למצע או לסכום percentiles, ‏histogram_quantile עושה אינטרפולציה, ו-'p99 על 5 דקות' לא אומר לך כמה budget הוצאת החודש." } },
    { q: { en: "Explain the multi-window multi-burn-rate alert and why each window exists.", he: "תסביר את ההתראה מסוג multi-window multi-burn-rate ולמה כל חלון קיים." },
      a: { en: "Page if the error ratio exceeds 14.4× budget over both 1h and 5m (2% of a 30-day budget per hour), or 6× over 6h and 30m (5%); ticket at 3× over 1d+2h and 1× over 3d+6h. The long window gives significance (no paging on a blip); the short window confirms it's still happening, so the alert resolves quickly after recovery. Multiple rates catch both fast outages and slow leaks.", he: "Page אם יחס השגיאות עובר פי 14.4 מה-budget גם על שעה וגם על 5 דקות (2% מ-budget של 30 יום בשעה), או פי 6 על 6 שעות ו-30 דקות (5%); ‏ticket בפי 3 על יום ו-2 שעות ובפי 1 על 3 ימים ו-6 שעות. החלון הארוך נותן מובהקות (לא מעירים על קפיצה רגעית); החלון הקצר מאשר שזה עדיין קורה, כך שההתראה נסגרת מהר אחרי ההתאוששות. כמה קצבים תופסים גם השבתות מהירות וגם דליפות איטיות." } }
  ],
  quiz: [
    { q: { en: "Your latency SLO is '99% of requests under 300 ms', but your histogram uses default buckets. What happens?", he: "ה-latency SLO שלך הוא '99% מהבקשות מתחת ל-300 ms', אבל ה-histogram משתמש ב-buckets דיפולטיים. מה קורה?" },
      options: [
        { en: "Prometheus interpolates the 0.3 bucket automatically", he: "Prometheus עושה אינטרפולציה ל-bucket של 0.3 אוטומטית" },
        { en: "There is no le=\"0.3\" series, so the bucket-based SLI returns no data; you must add 0.3 as a bucket (or use native histograms)", he: "אין סדרה le=\"0.3\", אז ה-SLI שמבוסס על buckets לא מחזיר data; צריך להוסיף 0.3 כ-bucket (או להשתמש ב-native histograms)" },
        { en: "It works but is 10% less accurate", he: "זה עובד אבל פחות מדויק ב-10%" },
        { en: "Sloth rounds it to 0.25", he: "Sloth מעגל את זה ל-0.25" }
      ], answer: 1,
      explain: { en: "Default buckets are .005…10 without 0.3. A selector on a non-existent le value matches nothing. Define buckets at your SLO thresholds.", he: "ה-buckets הדיפולטיים הם .005 עד 10 בלי 0.3. ‏Selector על ערך le שלא קיים לא תופס כלום. תגדיר buckets בספי ה-SLO שלך." } },
    { q: { en: "In the generated page alert, why AND the 1h window with a 5m window?", he: "בהתראת ה-page שנוצרה, למה עושים AND בין חלון של שעה לחלון של 5 דקות?" },
      options: [
        { en: "To page faster", he: "כדי להעיר מהר יותר" },
        { en: "So the alert stops firing within minutes once the problem is fixed, instead of for the rest of the hour", he: "כדי שההתראה תפסיק לירות תוך דקות אחרי שהבעיה תוקנה, במקום עד סוף השעה" },
        { en: "To save Prometheus memory", he: "כדי לחסוך זיכרון ב-Prometheus" },
        { en: "Because Alertmanager requires two conditions", he: "כי Alertmanager דורש שני תנאים" }
      ], answer: 1,
      explain: { en: "The 1h window alone stays above threshold long after recovery. The short window (1/12 of the long one) confirms the burn is still happening.", he: "החלון של שעה לבד נשאר מעל הסף הרבה אחרי ההתאוששות. החלון הקצר (1/12 מהארוך) מאשר שה-burn עדיין קורה." } },
    { q: { en: "Which SLI best fits a nightly ETL that must land data by 06:00?", he: "איזה SLI הכי מתאים ל-ETL לילי שחייב להנחית data עד 06:00?" },
      options: [
        { en: "HTTP 5xx ratio of the ETL's metrics endpoint", he: "יחס ה-5xx של ה-endpoint של ה-metrics של ה-ETL" },
        { en: "CPU utilization of the job", he: "ניצול ה-CPU של ה-job" },
        { en: "Runs that succeed before the deadline / scheduled runs, plus a freshness/volume check", he: "ריצות שמצליחות לפני ה-deadline / ריצות מתוזמנות, ועוד בדיקת רעננות או נפח" },
        { en: "p99 of the job's duration", he: "p99 של משך ה-job" }
      ], answer: 2,
      explain: { en: "Users care that fresh, correct data is there on time. Count on-time successful runs, and add freshness and row-volume checks to catch silent empty runs.", he: "למשתמשים אכפת ש-data רענן ונכון יהיה שם בזמן. סופרים ריצות מוצלחות בזמן, ומוסיפים בדיקות רעננות ונפח שורות כדי לתפוס ריצות ריקות שקטות." } },
    { q: { en: "What is the main advantage of generating SLO rules (Sloth/Pyrra) over writing them by hand?", he: "מה היתרון העיקרי בלייצר rules של SLO ‏(Sloth/Pyrra) לעומת לכתוב אותם ביד?" },
      options: [
        { en: "Generated rules use less CPU", he: "Rules שנוצרו צורכים פחות CPU" },
        { en: "One reviewed spec produces consistent recording rules, burn-rate alerts and dashboards for every SLO, without copy-paste errors", he: "Spec אחד שעבר review מייצר recording rules, התראות burn-rate ו-dashboards עקביים לכל SLO, בלי טעויות של copy-paste" },
        { en: "They remove the need for Prometheus", he: "הם מבטלים את הצורך ב-Prometheus" },
        { en: "They guarantee meeting the SLO", he: "הם מבטיחים עמידה ב-SLO" }
      ], answer: 1,
      explain: { en: "Each SLO needs ~8 windowed recording rules, meta rules and 4 burn-rate conditions. Generating them from a spec in CI keeps them correct and uniform across dozens of services.", he: "כל SLO צריך ~8 recording rules לפי חלונות, ‏meta rules ו-4 תנאי burn-rate. ייצור שלהם מ-spec ב-CI שומר עליהם נכונים ואחידים על פני עשרות services." } }
  ],
  playground: "slo",
  related: ["rel-sli-slo-sla", "rel-error-budgets", "obs-prometheus-deep", "obs-alerting", "obs-metrics"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["DataLoader", "architecture", "A per-request batching and memoization utility for GraphQL resolvers: collects load(id) calls in one tick and issues a single batch query, fixing N+1.", "כלי batching ו-memoization לכל request עבור resolver-ים ב-GraphQL: אוסף קריאות load(id) באותו tick ושולח query אחד של batch, וכך פותר N+1.", "arch-graphql-production"],
  ["Persisted query", "architecture", "A GraphQL query registered on the server by hash so clients send only the hash (often via GET); as a build-time allowlist it blocks arbitrary queries and enables CDN caching.", "Query של GraphQL שנרשם בשרת לפי hash כך שהלקוח שולח רק את ה-hash (הרבה פעמים ב-GET); כ-allowlist מזמן ה-build הוא חוסם queries שרירותיים ומאפשר caching ב-CDN.", "arch-graphql-production"],
  ["GraphQL Federation", "architecture", "Splitting one GraphQL graph into team-owned subgraphs composed into a supergraph; a router plans each query and fetches entities across subgraphs by @key.", "פיצול graph אחד של GraphQL ל-subgraph-ים שבבעלות צוותים, שמורכבים ל-supergraph; ‏router מתכנן כל query ומביא ישויות בין subgraph-ים לפי @key.", "arch-graphql-production"],
  ["WebAssembly (Wasm)", "architecture", "A portable, sandboxed binary bytecode format: modules get only linear memory and host functions explicitly imported, and start in microseconds.", "פורמט bytecode בינארי, נייד ומבודד: מודולים מקבלים רק linear memory ופונקציות host שהועברו להם במפורש, ועולים במיקרו-שניות.", "arch-wasm-edge"],
  ["WASI", "architecture", "WebAssembly System Interface: standard, capability-based APIs (files, clocks, sockets, HTTP) for Wasm outside the browser; WASI 0.2 is built on the component model and WIT.", "WebAssembly System Interface: ממשקים סטנדרטיים מבוססי capabilities ‏(קבצים, שעונים, sockets, ‏HTTP) ל-Wasm מחוץ לדפדפן; ‏WASI 0.2 בנוי על ה-component model ועל WIT.", "arch-wasm-edge"],
  ["V8 isolate", "architecture", "A lightweight sandbox inside one V8 process with its own heap; edge platforms like Cloudflare Workers run thousands per process and create one in ~5 ms, avoiding container cold starts.", "Sandbox קל בתוך process אחד של V8 עם heap משלו; פלטפורמות edge כמו Cloudflare Workers מריצות אלפים כאלה ב-process ויוצרות אחד תוך ~5 ms, בלי cold start של container.", "arch-wasm-edge"],
  ["Index-free adjacency", "data", "Native graph storage where each node points directly to its relationships, so each traversal hop is a pointer chase (O(1)) independent of total graph size.", "אחסון graph native שבו כל node מצביע ישירות על ה-relationships שלו, כך שכל hop ב-traversal הוא מעקב אחרי pointer ‏(O(1)) שלא תלוי בגודל ה-graph הכולל.", "db-graph"],
  ["Supernode", "data", "A graph node with a huge number of edges (celebrity, shared IP, default device); traversals through it explode and writes to it contend.", "Node ב-graph עם מספר עצום של קשתות (סלבריטי, ‏IP משותף, מכשיר דיפולטי); ‏traversals שעוברים דרכו מתפוצצים וכתיבות אליו מתחרות.", "db-graph"],
  ["Cypher", "data", "Declarative query language for property graphs (Neo4j, Memgraph, Neptune openCypher) that draws patterns as ASCII art: (a)-[:REL]->(b). Basis for ISO GQL.", "שפת שאילתות דקלרטיבית ל-property graphs ‏(Neo4j, ‏Memgraph, ‏openCypher ב-Neptune) שמציירת דפוסים כ-ASCII art: ‏(a)-[:REL]->(b). הבסיס ל-GQL של ISO.", "db-graph"],
  ["OpenSLO", "observability", "A vendor-neutral YAML specification for SLIs, SLOs and alert policies, so SLOs can be versioned in git and translated to Prometheus rules or vendor tools.", "Specification ניטרלי לספקים ב-YAML ל-SLIs, ‏SLOs ו-alert policies, כך שאפשר לנהל SLOs ב-git ולתרגם אותם ל-rules של Prometheus או לכלים של ספקים.", "obs-slo-as-code"],
  ["Sloth", "observability", "Open-source generator that turns a short SLO spec into Prometheus recording rules (slo:sli_error:ratio_rate*) and multi-window multi-burn-rate alerts.", "Generator בקוד פתוח שהופך spec קצר של SLO ל-recording rules של Prometheus ‏(slo:sli_error:ratio_rate*) ולהתראות multi-window multi-burn-rate.", "obs-slo-as-code"],
  ["Multi-window multi-burn-rate alert", "observability", "SLO alert that fires when the error ratio exceeds a burn-rate factor over both a long and a short window (e.g. 14.4x over 1h and 5m to page), balancing speed, precision and fast reset.", "התראת SLO שיורה כשיחס השגיאות עובר מקדם burn-rate גם בחלון ארוך וגם בחלון קצר (למשל פי 14.4 על שעה ו-5 דקות ל-page), ומאזנת בין מהירות, דיוק ואיפוס מהיר.", "obs-slo-as-code"]
].forEach(([term, track, en, he, lesson]) => INFRA.glossary.push({ term, track, def: { en, he }, lesson }));

// ---------------------------------------------------------------------------
// Scenario: GraphQL query of death
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "graphql-query-of-death",
  icon: "🕸️",
  title: { en: "The GraphQL query of death", he: "ה-query הקטלני של GraphQL" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "02:40. PagerDuty: 'CheckoutHighErrorRate — burn rate 22x'. Postgres primary CPU is at 100%, the GraphQL gateway's p99 went from 180 ms to 9 s, and the HTTP 5xx graph is... almost flat. What do you look at first?",
        he: "02:40. ‏PagerDuty: ‏'CheckoutHighErrorRate — burn rate 22x'. ה-CPU של ה-primary של Postgres על 100%, ה-p99 של ה-gateway של GraphQL קפץ מ-180 ms ל-9 שניות, והגרף של HTTP 5xx... כמעט שטוח. על מה אתה מסתכל קודם?"
      },
      data: `gateway  http_5xx_ratio          0.3%
gateway  graphql_errors_ratio    31%   (code=TIMEOUT, DB_POOL_EXHAUSTED)
postgres cpu                      100%  active connections 200/200
deploys in last 24h               none`,
      choices: [
        { label: { en: "Top queries in Postgres (pg_stat_activity) and the gateway's top operations by total time", he: "ה-queries המובילים ב-Postgres ‏(pg_stat_activity) וה-operations המובילים ב-gateway לפי זמן כולל" }, next: "s2", score: 10,
          feedback: { en: "Right: correlate the DB symptom with the GraphQL operation causing it.", he: "נכון: לחבר בין הסימפטום ב-DB ל-operation של GraphQL שגורם לו." } },
        { label: { en: "Restart the gateway Pods, they look stuck", he: "לעשות restart ל-Pod-ים של ה-gateway, הם נראים תקועים" }, next: "s1b", score: -5,
          feedback: { en: "The gateway is waiting on the DB. Restarting it drops in-flight requests and fixes nothing.", he: "ה-gateway מחכה ל-DB. ‏Restart מפיל requests באמצע ולא מתקן כלום." } },
        { label: { en: "Scale the DB to a bigger instance class right away", he: "להגדיל מיד את ה-DB ל-instance class גדול יותר" }, next: "s1b", score: -5,
          feedback: { en: "A resize means a failover and minutes of downtime, before you even know what's eating the CPU.", he: "Resize אומר failover ודקות של downtime, עוד לפני שאתה יודע מה אוכל את ה-CPU." } }
      ]
    },
    s1b: {
      text: {
        en: "10 minutes later the error rate is back at 30% and the budget burn continues. The incident commander asks what's actually hitting the database.",
        he: "אחרי 10 דקות שיעור השגיאות חזר ל-30% וה-budget ממשיך להישרף. ה-incident commander שואל מה בעצם פוגע ב-DB."
      },
      choices: [
        { label: { en: "Go look at pg_stat_activity and the gateway's operation metrics", he: "ללכת להסתכל על pg_stat_activity ועל ה-metrics של ה-operations ב-gateway" }, next: "s2", score: 0,
          feedback: { en: "Better late than never — but you lost 10 minutes of budget.", he: "עדיף מאוחר מאשר אף פעם — אבל הפסדת 10 דקות של budget." } }
      ]
    },
    s2: {
      text: {
        en: "Postgres shows 180 identical queries on customers/orders with huge row counts. The gateway's top operation is an anonymous query you've never seen, from one API key belonging to a partner integration, ~40 req/s.",
        he: "Postgres מראה 180 queries זהים על customers ו-orders עם מספרי שורות ענקיים. ה-operation המוביל ב-gateway הוא query אנונימי שלא ראית אף פעם, מ-API key אחד של אינטגרציה של שותף, ~40 בקשות בשנייה."
      },
      data: `operation        client_key        rps   p50      total_time_share
(anonymous)      partner-acme-42   41    8.7 s    93%
CheckoutPage     web-app           310   45 ms    4%

query {
  customers(first: 500) {
    orders(first: 100) {
      items { product { reviews(first: 100) { author { orders(first: 100) { id } } } } }
    }
  }
}
# depth 9; worst case 500 × 100 × ~5 × 100 × 100 ≈ 2.5 billion nodes`,
      choices: [
        { label: { en: "Block that client key / operation at the gateway (or WAF) immediately, and tell the partner", he: "לחסום מיד את ה-client key או ה-operation ב-gateway (או ב-WAF), ולעדכן את השותף" }, next: "s3", score: 10,
          feedback: { en: "Stop the bleeding with the smallest blast radius: one key, not all traffic.", he: "עוצרים את הדימום עם רדיוס פגיעה הכי קטן: ‏key אחד, לא כל הטראפיק." } },
        { label: { en: "Add a missing index on orders.customer_id first", he: "קודם להוסיף index חסר על orders.customer_id" }, next: "s2b", score: -5,
          feedback: { en: "The index exists. The problem is billions of potential objects per request, not one slow lookup.", he: "ה-index קיים. הבעיה היא מיליארדי אובייקטים פוטנציאליים לכל request, לא חיפוש איטי אחד." } },
        { label: { en: "Turn off the whole GraphQL endpoint until morning", he: "לכבות את כל ה-endpoint של GraphQL עד הבוקר" }, next: "s2b", score: -10,
          feedback: { en: "That takes checkout down for all users to stop one client.", he: "זה מפיל את ה-checkout לכל המשתמשים כדי לעצור לקוח אחד." } }
      ]
    },
    s2b: {
      text: {
        en: "Things got worse or stayed the same. The partner query keeps arriving at 40 req/s.",
        he: "המצב החמיר או נשאר אותו דבר. ה-query של השותף ממשיך להגיע ב-40 בקשות בשנייה."
      },
      choices: [
        { label: { en: "Block the partner key at the gateway", he: "לחסום את ה-key של השותף ב-gateway" }, next: "s3", score: 0,
          feedback: { en: "Correct move, just later than it should have been.", he: "המהלך הנכון, רק מאוחר ממה שהיה צריך." } }
      ]
    },
    s3: {
      text: {
        en: "Key blocked. Within 2 minutes DB CPU drops to 35% and errors return to baseline. But 180 of the heavy queries are still running inside Postgres and holding connections. What now?",
        he: "ה-key נחסם. תוך 2 דקות ה-CPU של ה-DB יורד ל-35% והשגיאות חוזרות ל-baseline. אבל 180 מה-queries הכבדים עדיין רצים בתוך Postgres ומחזיקים connections. מה עכשיו?"
      },
      data: `SELECT pid, now() - query_start AS age, left(query, 60)
FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds';
-- 180 rows, ages 40 s .. 6 min`,
      choices: [
        { label: { en: "pg_cancel_backend() the long-running ones, and set statement_timeout for the gateway's DB role", he: "לעשות pg_cancel_backend() לאלה שרצים הרבה זמן, ולהגדיר statement_timeout ל-role של ה-gateway ב-DB" }, next: "s4", score: 10,
          feedback: { en: "Cancel the orphans and make sure the DB never runs a query longer than the client would wait.", he: "מבטלים את היתומים ומוודאים שה-DB אף פעם לא מריץ query יותר זמן ממה שהלקוח יחכה." } },
        { label: { en: "Leave them; they'll finish eventually", he: "להשאיר אותם; הם ייגמרו בסוף" }, next: "s4", score: 0,
          feedback: { en: "They hold connections and I/O for minutes after their clients gave up. A statement_timeout would have killed them.", he: "הם מחזיקים connections ו-I/O לדקות אחרי שהלקוחות שלהם כבר ויתרו. ‏statement_timeout היה הורג אותם." } }
      ]
    },
    s4: {
      text: {
        en: "Stable. The partner says they 'just exported everything in one query'. Tomorrow someone else could do the same. What's the durable fix?",
        he: "יציב. השותף אומר שהם 'רק ייצאו הכל ב-query אחד'. מחר מישהו אחר יכול לעשות את אותו הדבר. מה התיקון העמיד?"
      },
      choices: [
        { label: { en: "Static cost analysis with a budget per request + cost-based rate limits per key, max depth/aliases, mandatory pagination caps, persisted-query allowlist for first-party apps", he: "ניתוח עלות סטטי עם תקציב לכל request ו-rate limit לפי עלות לכל key, מקסימום עומק ו-aliases, תקרות pagination חובה, ו-allowlist של persisted queries לאפליקציות שלך" }, next: "s5", score: 10,
          feedback: { en: "Defense in depth: the server decides what a query may cost before executing it.", he: "הגנה בשכבות: השרת מחליט כמה query יכול לעלות לפני שהוא מריץ אותו." } },
        { label: { en: "A request-count rate limit of 10 req/s per key", he: "Rate limit לפי מספר בקשות של 10 בשנייה לכל key" }, next: "lose", score: -5,
          feedback: { en: "Ten requests of 2.5 billion nodes each still melt the DB. Rate limits must be cost-based.", he: "עשר בקשות של 2.5 מיליארד nodes כל אחת עדיין ממיסות את ה-DB. ‏Rate limits חייבים להיות לפי עלות." } },
        { label: { en: "Disable introspection so partners can't discover the nested fields", he: "לכבות introspection כדי ששותפים לא יגלו את השדות המקוננים" }, next: "lose", score: -5,
          feedback: { en: "Obscurity: the partner already knows the schema from your docs. Introspection off doesn't limit cost.", he: "Security through obscurity: השותף כבר מכיר את ה-schema מהתיעוד שלך. כיבוי introspection לא מגביל עלות." } }
      ]
    },
    s5: {
      text: {
        en: "You roll out cost limits in 'log-only' mode first. What else goes into the postmortem's action items?",
        he: "אתה מוציא את מגבלות העלות קודם במצב 'log-only'. מה עוד נכנס ל-action items של ה-postmortem?"
      },
      data: `cost-limit dry run (24h):
  operations over 5,000 points: 3
    (anonymous) partner-acme-42   est. 2.5e9
    AdminExport  backoffice         12,400   ← legit, needs pagination
    OrdersReport web-app            6,100    ← legit, raise budget or optimize`,
      choices: [
        { label: { en: "Require named operations, alert on GraphQL errors[] by code (not only 5xx), offer partners a bulk-export job API, then enforce limits", he: "לחייב operations עם שם, להתריע על errors[] של GraphQL לפי code (לא רק 5xx), להציע לשותפים API של export כ-job, ואז לאכוף את המגבלות" }, next: "win", score: 10,
          feedback: { en: "You fixed detection, gave the legit use case a proper path, and enforced limits without breaking real clients.", he: "תיקנת את הזיהוי, נתת ל-use case הלגיטימי מסלול נכון, ואכפת מגבלות בלי לשבור לקוחות אמיתיים." } },
        { label: { en: "Enforce the 5,000 limit for everyone immediately", he: "לאכוף מיד את המגבלה של 5,000 על כולם" }, next: "lose", score: -5,
          feedback: { en: "You just broke the back-office export and a web report at 9 AM. Dry-run results exist to be acted on.", he: "הרגע שברת את ה-export של ה-back-office ודוח ב-web ב-9 בבוקר. תוצאות dry run קיימות כדי לפעול לפיהן." } }
      ]
    },
    win: {
      text: {
        en: "Resolved in 14 minutes with 6% of the monthly budget spent. Cost limits are enforced, partners use the export API, and the next anonymous expensive query gets a clean 'QUERY_TOO_COMPLEX' error instead of a page at 3 AM.",
        he: "נפתר תוך 14 דקות עם 6% מה-budget החודשי. מגבלות העלות נאכפות, השותפים משתמשים ב-API של ה-export, וה-query היקר והאנונימי הבא מקבל שגיאת 'QUERY_TOO_COMPLEX' נקייה במקום page ב-3 בלילה."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The fix didn't hold. Two weeks later a different client sends a deep query and the DB melts again — or you broke legitimate clients. GraphQL needs cost-based limits rolled out carefully, plus monitoring on errors[] and per operation.",
        he: "התיקון לא החזיק. שבועיים אחר כך לקוח אחר שולח query עמוק וה-DB נמס שוב — או ששברת לקוחות לגיטימיים. ‏GraphQL צריך מגבלות לפי עלות שמוצאות בזהירות, ועוד מוניטורינג על errors[] ולפי operation."
      },
      end: "lose"
    }
  },
  lessons: ["arch-graphql-production", "pr-rate-limiters", "obs-slo-as-code", "rel-error-budgets"]
});
