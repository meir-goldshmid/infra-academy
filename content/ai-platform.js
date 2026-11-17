window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* AI platform engineering: AI gateway design, agent runtimes, agent evals, and the paved road for LLM features. */

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "ai-gateway-design",
  track: "ai",
  order: 10,
  icon: "🚦",
  level: 3,
  minutes: 18,
  title: { en: "Designing an AI Gateway", he: "תכנון AI Gateway" },
  tldr: {
    en: "An AI gateway is the single egress point for model traffic: it swaps provider keys for scoped virtual keys, enforces policy, rate-limits in tokens (not just requests), routes logical model aliases to real deployments with fallbacks and circuit breakers, caches, applies guardrails, streams SSE untouched, and meters every token to a team. Keep the data plane thin and fast; put keys, prices, routes and budgets in a separate control plane.",
    he: "AI gateway הוא נקודת היציאה היחידה של תעבורת מודלים: הוא מחליף מפתחות של providers ב-virtual keys מוגבלים, אוכף policy, עושה rate limit לפי token-ים (לא רק לפי בקשות), מנתב aliases לוגיים של מודלים ל-deployments אמיתיים עם fallbacks ו-circuit breakers, עושה cache, מפעיל guardrails, מעביר SSE בלי לגעת, ומודד כל token לצוות שצרך אותו. ה-data plane צריך להיות דק ומהיר; מפתחות, מחירים, routes ותקציבים יושבים ב-control plane נפרד."
  },
  analogy: {
    en: "Think of a company fuel card system. Drivers never see the master credit card; each gets a card with a monthly limit, allowed fuel types and a cost center. Any station in the network accepts it, and if one station is closed the app sends you to the next one. At the end of the month finance gets a per-department report, not one giant bill. The gateway is that card system for tokens.",
    he: "תחשוב על מערכת כרטיסי דלק בחברה. הנהגים אף פעם לא רואים את כרטיס האשראי הראשי. כל אחד מקבל כרטיס עם תקרה חודשית, סוגי דלק מותרים ומרכז עלות. כל תחנה ברשת מכבדת אותו, ואם תחנה סגורה האפליקציה שולחת אותך לבאה בתור. בסוף החודש הכספים מקבלים דוח לפי מחלקה, לא חשבונית ענקית אחת. ה-gateway הוא מערכת הכרטיסים הזאת, רק ל-token-ים."
  },
  sections: [
    {
      h: { en: "Why you need one: keys, governance, cost attribution, provider abstraction", he: "למה צריך אחד: מפתחות, governance, שיוך עלויות והפשטה מעל ה-providers" },
      body: {
        en: `<p>Without a gateway every service holds a provider API key, hard-codes a vendor model id, retries in its own way, and finance gets one invoice line per provider with no idea which feature spent it. The gateway becomes the <strong>single egress point</strong> for model traffic and solves four problems at once:</p>
<ul>
<li><strong>Keys</strong>: provider keys (or IAM roles for Bedrock / Vertex / Azure) live only in the gateway, loaded from a secret store. Teams get <em>virtual keys</em> or present a workload JWT. A leaked virtual key is revoked in seconds; the org's provider key never leaves the gateway.</li>
<li><strong>Governance</strong>: which teams may call which models, which data classes may go to which provider and region, mandatory guardrails, an audit trail of who sent what and when.</li>
<li><strong>Cost attribution</strong>: every request carries team, service, feature and environment, and is metered in tokens and dollars. It is the only reliable way to answer "which feature costs $40k a month?".</li>
<li><strong>Provider abstraction</strong>: one OpenAI-compatible API and logical aliases (<code>chat-large</code>, <code>chat-fast</code>, <code>embed-default</code>) instead of vendor model ids. Swapping a model becomes a config change plus an eval run, not 60 pull requests.</li>
</ul>
<p>What it is <em>not</em>: a home for product prompts, business logic or agent orchestration. Keep the <strong>data plane</strong> (the proxy on the hot path) thin, stateless and boring. The <strong>control plane</strong> (key portal, model catalog, price table, routes, budgets) can be slower and richer, and pushes config to the data plane.</p>
<p><a href="#/lesson/ai-llmops">LLMOps in Production</a> gives the short version of the gateway. This lesson is the design review: the exact request path, the rate-limit math, failure handling, and how to run it.</p>
<blockquote>💡 Real world: the gateway pays for itself twice. First when a provider region degrades and every product fails over by changing one route. Then the first time finance asks for chargeback per team and you answer with a SQL query instead of a month of archaeology.</blockquote>`,
        he: `<p>בלי gateway, כל service מחזיק API key של provider, מקודד בתוכו model id של vendor, עושה retry בדרך שלו, והכספים מקבלים שורה אחת בחשבונית לכל provider בלי מושג איזה פיצ'ר הוציא את הכסף. ה-gateway הופך ל<strong>נקודת יציאה יחידה</strong> לתעבורת מודלים ופותר ארבע בעיות בבת אחת:</p>
<ul>
<li><strong>מפתחות</strong>: המפתחות של ה-providers (או IAM roles ל-Bedrock, Vertex או Azure) חיים רק ב-gateway, ונטענים מ-secret store. צוותים מקבלים <em>virtual keys</em> או מציגים JWT של ה-workload. Virtual key שדלף נחסם תוך שניות, והמפתח הארגוני אף פעם לא יוצא מה-gateway.</li>
<li><strong>Governance</strong>: איזה צוות רשאי לקרוא לאיזה מודל, איזה סיווג מידע מותר לשלוח לאיזה provider ולאיזה region, guardrails חובה, ו-audit trail של מי שלח מה ומתי.</li>
<li><strong>שיוך עלויות</strong>: כל בקשה נושאת צוות, service, פיצ'ר וסביבה, ונמדדת ב-token-ים ובדולרים. זו הדרך האמינה היחידה לענות על השאלה "איזה פיצ'ר עולה לנו $40k בחודש?".</li>
<li><strong>הפשטה מעל ה-providers</strong>: API אחד תואם OpenAI ו-aliases לוגיים (<code>chat-large</code>, <code>chat-fast</code>, <code>embed-default</code>) במקום model ids של vendor. החלפת מודל הופכת לשינוי config ועוד הרצת eval, לא 60 pull requests.</li>
</ul>
<p>מה הוא <em>לא</em>: מקום ל-prompts של מוצרים, ללוגיקה עסקית או ל-orchestration של agents. ה-<strong>data plane</strong> (ה-proxy שעל ה-hot path) צריך להיות דק, stateless ומשעמם. ה-<strong>control plane</strong> (פורטל מפתחות, קטלוג מודלים, טבלת מחירים, routes ותקציבים) יכול להיות איטי ועשיר יותר, והוא דוחף config ל-data plane.</p>
<p>ב-<a href="#/lesson/ai-llmops">LLMOps in Production</a> יש את הגרסה הקצרה. השיעור הזה הוא ה-design review: מסלול הבקשה המדויק, החשבון של ה-rate limit, טיפול בכשלים, ואיך מריצים את זה.</p>
<blockquote>💡 Real world: ה-gateway מחזיר את עצמו פעמיים. פעם ראשונה כש-region של provider נופל וכל המוצרים עוברים ל-fallback בשינוי route אחד. פעם שנייה כשהכספים מבקשים chargeback לפי צוות, ואתה עונה עם שאילתת SQL במקום חודש של ארכיאולוגיה.</blockquote>`
      }
    },
    {
      h: { en: "The request path, hop by hop", he: "מסלול הבקשה, תחנה אחרי תחנה" },
      body: {
        en: `<ol>
<li><strong>AuthN</strong>: virtual key (look up the SHA-256 of the key, cache the result in-process for 30-60 s) or a workload JWT (validate the signature against cached JWKS, check <code>aud</code> and expiry). Resolve a principal: org, team, service, environment, allowed models, limits.</li>
<li><strong>Policy</strong>: is the alias allowed for this key? Does the declared data class (for example a header <code>x-data-class: restricted</code>) permit this provider and region? Cap <code>max_tokens</code> and context size, reject absurd requests early with 400.</li>
<li><strong>Rate limits and budget</strong>: RPM and TPM per key, per team and per deployment. Reserve an <em>estimated</em> token count now, reconcile with the real usage after the response (next section).</li>
<li><strong>Routing</strong>: resolve the alias to a list of deployments, drop those with an open circuit, pick one by weight, latency or load.</li>
<li><strong>Cache</strong>: exact-match first (hash of the normalized request plus tenant), optional semantic cache.</li>
<li><strong>Input guardrails</strong>: PII and secret detection or redaction, prompt-injection classifier, size and attachment limits.</li>
<li><strong>Provider call</strong>: translate the schema if needed (OpenAI chat format to Anthropic Messages or Bedrock Converse), inject provider credentials, apply timeouts: connect ~2 s, time-to-first-token ~30-60 s, idle-between-chunks ~30 s.</li>
<li><strong>Streaming</strong>: forward SSE chunks as they arrive, run output guardrails on a sliding window.</li>
<li><strong>Metering</strong>: read <code>usage</code> (for streams, ask for it with <code>stream_options: {"include_usage": true}</code> and read the final chunk), reconcile the reservation, compute cost, emit a usage event asynchronously and an OpenTelemetry span.</li>
</ol>
<p>Steps 1-6 must add single-digit milliseconds at p50 when the guardrails are regex or local. A model-based guardrail or a semantic-cache lookup (which needs an embedding call) adds tens of milliseconds and must be measured and budgeted per route. Compare that to TTFT of hundreds of milliseconds to seconds: the gateway is rarely the bottleneck, unless it buffers streams or makes a remote call per request.</p>
<pre>// What a caller sees: the OpenAI SDK pointed at the gateway (TypeScript)
import OpenAI from "openai";
const llm = new OpenAI({
  baseURL: "https://llm-gw.internal/v1",
  apiKey: process.env.LLM_GW_KEY,                 // virtual key, not a provider key
  defaultHeaders: { "x-feature": "ticket-summary", "x-data-class": "internal" },
});
const r = await llm.chat.completions.create({
  model: "chat-fast",                             // alias, resolved by the gateway
  messages: [{ role: "user", content: "Summarize: ..." }],
  max_tokens: 300,
});</pre>`,
        he: `<ol>
<li><strong>AuthN</strong>: virtual key (בודקים את ה-SHA-256 של המפתח ושומרים את התוצאה ב-cache בתוך התהליך ל-30 עד 60 שניות) או JWT של ה-workload (מאמתים חתימה מול JWKS שב-cache, בודקים <code>aud</code> ותוקף). מזה נגזר principal: ארגון, צוות, service, סביבה, מודלים מותרים ומגבלות.</li>
<li><strong>Policy</strong>: האם ה-alias מותר למפתח הזה? האם סיווג המידע שהוצהר (למשל header <code>x-data-class: restricted</code>) מתיר את ה-provider וה-region? מגבילים <code>max_tokens</code> וגודל context, ודוחים בקשות מופרכות מוקדם עם 400.</li>
<li><strong>Rate limits ותקציב</strong>: RPM ו-TPM לכל מפתח, לכל צוות ולכל deployment. שומרים עכשיו כמות token-ים <em>משוערת</em>, ומיישרים מול השימוש האמיתי אחרי התשובה (בסעיף הבא).</li>
<li><strong>ניתוב</strong>: מתרגמים את ה-alias לרשימת deployments, מורידים את אלה שה-circuit שלהם פתוח, ובוחרים אחד לפי משקל, latency או עומס.</li>
<li><strong>Cache</strong>: קודם התאמה מדויקת (hash של הבקשה המנורמלת יחד עם ה-tenant), ואופציונלית semantic cache.</li>
<li><strong>Guardrails על הקלט</strong>: זיהוי או השחרה של PII ו-secrets, classifier ל-prompt injection, מגבלות גודל וקבצים מצורפים.</li>
<li><strong>הקריאה ל-provider</strong>: תרגום סכמה כשצריך (מפורמט ה-chat של OpenAI ל-Anthropic Messages או ל-Bedrock Converse), הזרקת ה-credentials של ה-provider, ו-timeouts: חיבור ~2 שניות, זמן עד token ראשון ~30 עד 60 שניות, שקט בין chunks ~30 שניות.</li>
<li><strong>Streaming</strong>: מעבירים chunks של SSE ברגע שהם מגיעים, ומריצים guardrails על הפלט בחלון מתגלגל.</li>
<li><strong>מדידה</strong>: קוראים את ה-<code>usage</code> (ב-stream מבקשים אותו עם <code>stream_options: {"include_usage": true}</code> וקוראים מה-chunk האחרון), מיישרים את ההזמנה, מחשבים עלות, ושולחים usage event בצורה אסינכרונית יחד עם span של OpenTelemetry.</li>
</ol>
<p>שלבים 1 עד 6 צריכים להוסיף אלפיות שנייה בודדות ב-p50, כשה-guardrails הם regex או מקומיים. Guardrail מבוסס מודל, או lookup ב-semantic cache (שדורש קריאת embedding), מוסיפים עשרות אלפיות שנייה, וצריך למדוד ולתקצב אותם לכל route. תשווה את זה ל-TTFT של מאות אלפיות שנייה עד שניות: ה-gateway כמעט אף פעם לא צוואר הבקבוק, אלא אם הוא עושה buffering ל-streams או קריאה מרוחקת בכל בקשה.</p>
<pre>// What a caller sees: the OpenAI SDK pointed at the gateway (TypeScript)
import OpenAI from "openai";
const llm = new OpenAI({
  baseURL: "https://llm-gw.internal/v1",
  apiKey: process.env.LLM_GW_KEY,                 // virtual key, not a provider key
  defaultHeaders: { "x-feature": "ticket-summary", "x-data-class": "internal" },
});
const r = await llm.chat.completions.create({
  model: "chat-fast",                             // alias, resolved by the gateway
  messages: [{ role: "user", content: "Summarize: ..." }],
  max_tokens: 300,
});</pre>`
      }
    },
    {
      h: { en: "Token-aware rate limits, budgets and chargeback", he: "Rate limits לפי token-ים, תקציבים ו-chargeback" },
      body: {
        en: `<p><strong>Why RPM is not enough</strong>: one request with a 100k-token context costs as much provider quota as 500 requests of 200 tokens. Providers enforce TPM and RPM per account, deployment or region; the gateway's job is to <em>divide that shared quota between teams</em> so one batch job cannot starve the checkout assistant.</p>
<p><strong>Token bucket per (team, model)</strong>: capacity = allowed burst, refill = TPM / 60 per second. A team with 300k TPM refills 5,000 tokens per second. See <a href="#/lesson/pr-rate-limiters">Rate Limiters</a> for the algorithms.</p>
<p><strong>The catch: you don't know the output size before the call.</strong> So you reserve and reconcile:</p>
<ul>
<li><em>Reserve</em> = input tokens (count with the model's tokenizer, or estimate) + <code>min(max_tokens, p95 output for this route)</code>. If the client sent no <code>max_tokens</code>, the gateway sets a default cap; otherwise one runaway generation can eat a minute of quota.</li>
<li><em>Reconcile</em> after the response with the real <code>usage</code>: refund the difference or debit the overshoot. If the stream breaks before usage arrives, charge the reservation (or count streamed chunks).</li>
<li>Character-based estimates (~4 chars per token) are tuned for English. Hebrew, code and JSON usually produce more tokens per character, so a chars/4 estimate under-reserves. Use the real tokenizer where you can.</li>
</ul>
<pre>// Reserve -&gt; call -&gt; reconcile (TypeScript, Redis Lua scripts do the atomic math)
const key = \`tpm:\${team}:\${alias}\`;
const est = countTokens(req.messages) + Math.min(req.max_tokens ?? 1024, p95Out(alias));
const granted = await redis.evalsha(TAKE_SHA, 1, key, est, Date.now());
if (!granted) throw new HttpError(429, { "retry-after": "2" });
const res = await callProvider(req);
const actual = res.usage.prompt_tokens + res.usage.completion_tokens;
await redis.evalsha(ADJUST_SHA, 1, key, actual - est);   // refund (negative) or debit</pre>
<p><strong>Distributed limits</strong>: Redis with an atomic Lua script is the standard. At high request rates, each replica can hold a local bucket that leases chunks of quota from Redis to save a round trip. Decide failure behaviour up front: if Redis is down, rate limits usually <em>fail open</em> to a conservative local limit, while hard budgets for risky keys fail closed.</p>
<p><strong>Budgets</strong>: dollars per key or team per day and month. Alerts at 50/80/100%; at 100% the action is a policy choice: block, downgrade the alias to a cheaper model, or require an approval. Spend counters are eventually consistent (increment by cost in micro-dollars after each response), so accept a small overshoot.</p>
<p><strong>Chargeback</strong>: emit one usage event per request (request_id, team, service, feature, env, alias, provider model, input / cached-input / output tokens, cost, latency, cache_hit, fallback) to a queue such as Kafka or Kinesis, land it in S3 and the warehouse, roll up daily. Store a <code>price_version</code> on every event: prices change, and recomputing last quarter's bill with today's price table is a classic mistake.</p>
<pre>cost = input_uncached * p_in + input_cached * p_cached_in + output * p_out   # per 1M tokens
# provider batch APIs are typically ~50% cheaper; tag batch traffic separately</pre>
<blockquote>⚠️ Production tip: start with <strong>showback</strong> (a dashboard per team) for a quarter before real chargeback. Teams fix waste once they see it; billing them before the numbers are trusted just starts arguments. See <a href="#/lesson/cloud-finops">FinOps</a>.</blockquote>`,
        he: `<p><strong>למה RPM לא מספיק</strong>: בקשה אחת עם context של 100k token-ים צורכת מה-quota של ה-provider כמו 500 בקשות של 200 token-ים. ה-providers אוכפים TPM ו-RPM לכל חשבון, deployment או region. התפקיד של ה-gateway הוא <em>לחלק את ה-quota המשותפת בין הצוותים</em>, כדי ש-batch job אחד לא ירעיב את ה-assistant של ה-checkout.</p>
<p><strong>Token bucket לכל זוג (צוות, מודל)</strong>: הקיבולת היא ה-burst המותר, וקצב המילוי הוא TPM חלקי 60 לשנייה. צוות עם 300k TPM מתמלא ב-5,000 token-ים לשנייה. האלגוריתמים עצמם נמצאים ב-<a href="#/lesson/pr-rate-limiters">Rate Limiters</a>.</p>
<p><strong>הבעיה: לפני הקריאה אתה לא יודע כמה פלט יחזור.</strong> לכן עושים הזמנה ויישור:</p>
<ul>
<li><em>הזמנה</em> = token-ים של הקלט (סופרים עם ה-tokenizer של המודל, או מעריכים) ועוד <code>min(max_tokens, p95 output for this route)</code>. אם ה-client לא שלח <code>max_tokens</code>, ה-gateway קובע תקרת ברירת מחדל. אחרת generation אחד שהשתולל יכול לאכול דקה שלמה של quota.</li>
<li><em>יישור</em> אחרי התשובה מול ה-<code>usage</code> האמיתי: מחזירים את ההפרש או מחייבים את החריגה. אם ה-stream נשבר לפני שה-usage הגיע, מחייבים לפי ההזמנה (או סופרים את ה-chunks שעברו).</li>
<li>הערכה לפי תווים (בערך 4 תווים ל-token) מכוילת לאנגלית. עברית, קוד ו-JSON בדרך כלל מייצרים יותר token-ים לתו, אז הערכה כזאת מזמינה פחות מדי. איפה שאפשר, תשתמש ב-tokenizer האמיתי.</li>
</ul>
<pre>// Reserve -&gt; call -&gt; reconcile (TypeScript, Redis Lua scripts do the atomic math)
const key = \`tpm:\${team}:\${alias}\`;
const est = countTokens(req.messages) + Math.min(req.max_tokens ?? 1024, p95Out(alias));
const granted = await redis.evalsha(TAKE_SHA, 1, key, est, Date.now());
if (!granted) throw new HttpError(429, { "retry-after": "2" });
const res = await callProvider(req);
const actual = res.usage.prompt_tokens + res.usage.completion_tokens;
await redis.evalsha(ADJUST_SHA, 1, key, actual - est);   // refund (negative) or debit</pre>
<p><strong>מגבלות מבוזרות</strong>: הסטנדרט הוא Redis עם Lua script אטומי. בקצב בקשות גבוה, כל replica יכולה להחזיק bucket מקומי ששוכר נתחי quota מ-Redis, וכך חוסכים round trip. תחליט מראש מה קורה בכשל: אם Redis למטה, rate limits בדרך כלל עושים <em>fail open</em> למגבלה מקומית שמרנית, ותקציבים קשיחים של מפתחות מסוכנים עושים fail closed.</p>
<p><strong>תקציבים</strong>: דולרים לכל מפתח או צוות, ליום ולחודש. התראות ב-50, 80 ו-100 אחוז. ב-100% הפעולה היא החלטת policy: לחסום, להוריד את ה-alias למודל זול יותר, או לדרוש אישור. מוני ההוצאה הם eventually consistent (מוסיפים את העלות במיקרו-דולרים אחרי כל תשובה), אז מקבלים חריגה קטנה.</p>
<p><strong>Chargeback</strong>: שולחים usage event אחד לכל בקשה (request_id, צוות, service, פיצ'ר, סביבה, alias, המודל בפועל, token-ים של input רגיל, input מה-cache ו-output, עלות, latency, cache_hit, fallback) לתור כמו Kafka או Kinesis, מורידים ל-S3 ול-warehouse, ומסכמים יומית. שומרים <code>price_version</code> על כל event: מחירים משתנים, ולחשב את החשבון של הרבעון הקודם עם טבלת המחירים של היום זו טעות קלאסית.</p>
<pre>cost = input_uncached * p_in + input_cached * p_cached_in + output * p_out   # per 1M tokens
# provider batch APIs are typically ~50% cheaper; tag batch traffic separately</pre>
<blockquote>⚠️ Production tip: תתחיל עם <strong>showback</strong> (dashboard לכל צוות) לרבעון אחד לפני chargeback אמיתי. צוותים מתקנים בזבוז ברגע שהם רואים אותו. לחייב אותם לפני שסומכים על המספרים רק פותח ויכוחים. ראה <a href="#/lesson/cloud-finops">FinOps</a>.</blockquote>`
      }
    },
    {
      h: { en: "Routing, fallbacks, circuit breakers, caching, guardrails, streaming", he: "ניתוב, fallbacks, circuit breakers, caching, guardrails ו-streaming" },
      body: {
        en: `<p><strong>Aliases and routing</strong>: <code>chat-large</code> maps to an ordered set of deployments, for example the same model in two regions of provider A plus the same model on Bedrock. Strategies: weighted (send 5% to a new model version as a canary), latency-based (EWMA of TTFT per deployment), least-busy (in-flight requests), cost-based.</p>
<p><strong>Fallback order</strong>: same model in another region or account, then same model on another cloud, and only then a <em>different</em> model, which must be eval-approved for that route ahead of time. Return a header such as <code>x-gateway-fallback: true</code> and the real model in the response, so callers and traces can see it.</p>
<table>
<tr><th>Upstream result</th><th>Gateway action</th></tr>
<tr><td>429</td><td>Try the next deployment now (respect <code>Retry-After</code> for the failed one). Do not hammer the same one.</td></tr>
<tr><td>5xx, timeout, connection reset</td><td>Retry on another deployment; count toward the circuit breaker.</td></tr>
<tr><td>400 / context length exceeded</td><td>Do not retry the same request. Optionally route to a longer-context alias if policy allows.</td></tr>
<tr><td>Content-filter refusal</td><td>Return it to the caller. Never "launder" it through a weaker provider.</td></tr>
<tr><td>Failure after the first streamed byte</td><td>Do not retry: the client already rendered partial text. Close the stream with an error event.</td></tr>
</table>
<p><strong>Circuit breaker per deployment</strong>: open after, say, 5 failures in 60 s or a 50% error rate over 20 requests; cool down 30-60 s; let one probe through when half-open. Cap retries with a <em>retry budget</em> (retries at most ~10% of traffic) or a regional outage turns into a retry storm. LiteLLM exposes this as <code>allowed_fails</code> and <code>cooldown_time</code>; Envoy has outlier detection. See <a href="#/lesson/arch-resilience">Resilience Patterns</a>.</p>
<p><strong>Caching</strong>: exact-match caching works for deterministic calls (classification at temperature 0, embeddings). The key must include tenant, alias, all generation params and the system prompt version. A <strong>semantic cache</strong> is riskier: "what's my balance?" from two users is semantically identical and must never share an answer. Scope it per tenant, use it only for FAQ-like routes, and tune the similarity threshold against an eval set. Provider <em>prompt caching</em> is a different thing (reusing the prefix computation): the gateway helps it by never reordering or mutating the stable prefix of a prompt.</p>
<p><strong>Guardrails</strong>: input checks (PII and secret detection or redaction, injection classifier, banned topics) and output checks (PII leakage, policy). An injection classifier is a <em>signal</em>, not a security boundary; real protection is least privilege on the tools (see <a href="#/lesson/ai-security-practice">AI Security in Practice</a>). Output guardrails on a stream need a small buffer window or a cut-the-stream-on-violation approach; both cost latency or UX, so choose per route.</p>
<p><strong>Streaming SSE passthrough</strong>: never buffer the full response. Flush each chunk; turn off proxy buffering (for nginx, <code>proxy_buffering off</code> or the <code>X-Accel-Buffering: no</code> header); raise load balancer idle timeouts (an ALB defaults to 60 s, and reasoning models can be silent longer than that before the first token) or send SSE comment keep-alives like <code>: ping</code>. When the client disconnects, cancel the upstream request, or you keep paying for tokens nobody reads.</p>`,
        he: `<p><strong>Aliases וניתוב</strong>: <code>chat-large</code> ממופה לסט מסודר של deployments, למשל אותו מודל בשני regions של provider A ועוד אותו מודל ב-Bedrock. אסטרטגיות: לפי משקל (5% ל-version חדש של מודל בתור canary), לפי latency (EWMA של TTFT לכל deployment), least-busy (בקשות פתוחות) או לפי עלות.</p>
<p><strong>סדר ה-fallback</strong>: אותו מודל ב-region או חשבון אחר, אחר כך אותו מודל בענן אחר, ורק אז מודל <em>אחר</em>, שחייב להיות מאושר מראש ב-eval עבור ה-route הזה. מחזירים header כמו <code>x-gateway-fallback: true</code> ואת המודל האמיתי בתשובה, כדי שהקוראים וה-traces יראו את זה.</p>
<table>
<tr><th>מה חזר מה-upstream</th><th>מה ה-gateway עושה</th></tr>
<tr><td>429</td><td>עובר מיד ל-deployment הבא (ומכבד <code>Retry-After</code> עבור זה שנכשל). לא דופק שוב על אותו אחד.</td></tr>
<tr><td>5xx, timeout, connection reset</td><td>Retry על deployment אחר, ונספר ל-circuit breaker.</td></tr>
<tr><td>400 או חריגה מאורך ה-context</td><td>לא עושים retry לאותה בקשה. אופציונלית מנתבים ל-alias עם context ארוך יותר, אם ה-policy מתיר.</td></tr>
<tr><td>סירוב של content filter</td><td>מחזירים אותו לקורא. אף פעם לא "מלבינים" אותו דרך provider מתירני יותר.</td></tr>
<tr><td>כשל אחרי שה-byte הראשון כבר נשלח ב-stream</td><td>לא עושים retry: ה-client כבר הציג טקסט חלקי. סוגרים את ה-stream עם error event.</td></tr>
</table>
<p><strong>Circuit breaker לכל deployment</strong>: נפתח אחרי, נגיד, 5 כשלים ב-60 שניות או 50% שגיאות על פני 20 בקשות. מתקרר 30 עד 60 שניות, ובמצב half-open מעביר בקשת בדיקה אחת. מגבילים retries עם <em>retry budget</em> (לכל היותר בערך 10% מהתעבורה), אחרת תקלה אזורית הופכת ל-retry storm. ב-LiteLLM זה נקרא <code>allowed_fails</code> ו-<code>cooldown_time</code>, וב-Envoy יש outlier detection. ראה <a href="#/lesson/arch-resilience">Resilience Patterns</a>.</p>
<p><strong>Caching</strong>: cache של התאמה מדויקת עובד לקריאות דטרמיניסטיות (סיווג ב-temperature 0, embeddings). המפתח חייב לכלול tenant, alias, את כל הפרמטרים של ה-generation ואת הגרסה של ה-system prompt. <strong>Semantic cache</strong> מסוכן יותר: "מה היתרה שלי?" משני משתמשים זהה סמנטית, ואסור שיקבל אותה תשובה. מגבילים אותו ל-tenant, משתמשים בו רק ב-routes שדומים ל-FAQ, ומכיילים את סף הדמיון מול eval set. <em>Prompt caching</em> של ה-provider זה משהו אחר (שימוש חוזר בחישוב של ה-prefix). ה-gateway עוזר לו בכך שהוא אף פעם לא משנה סדר או תוכן בחלק הקבוע של ה-prompt.</p>
<p><strong>Guardrails</strong>: בדיקות קלט (זיהוי או השחרה של PII ו-secrets, classifier ל-injection, נושאים אסורים) ובדיקות פלט (דליפת PII, policy). Classifier ל-injection הוא <em>סיגנל</em>, לא גבול אבטחה. ההגנה האמיתית היא least privilege על ה-tools (ראה <a href="#/lesson/ai-security-practice">AI Security in Practice</a>). Guardrails על פלט ב-stream צריכים חלון buffer קטן, או גישה של לחתוך את ה-stream ברגע שיש הפרה. שתי הדרכים עולות ב-latency או ב-UX, אז בוחרים לכל route.</p>
<p><strong>מעבר SSE שקוף</strong>: אף פעם לא עושים buffering לתשובה המלאה. עושים flush לכל chunk, מכבים buffering ב-proxy (ב-nginx זה <code>proxy_buffering off</code> או ה-header <code>X-Accel-Buffering: no</code>), ומעלים את ה-idle timeout של ה-load balancer (ב-ALB ברירת המחדל היא 60 שניות, ומודלי reasoning יכולים לשתוק יותר מזה לפני ה-token הראשון), או שולחים keep-alive כהערת SSE כמו <code>: ping</code>. כשה-client מתנתק, מבטלים את הבקשה ל-upstream. אחרת ממשיכים לשלם על token-ים שאף אחד לא קורא.</p>`
      }
    },
    {
      h: { en: "Observability, HA, latency overhead and running it on Kubernetes", he: "Observability, HA, תוספת latency והרצה על Kubernetes" },
      body: {
        en: `<p><strong>Tracing with OpenTelemetry GenAI semantic conventions</strong>: one client span per model call named <code>chat {model}</code>, with <code>gen_ai.operation.name</code>, <code>gen_ai.provider.name</code>, <code>gen_ai.request.model</code>, <code>gen_ai.response.model</code>, <code>gen_ai.usage.input_tokens</code> and <code>gen_ai.usage.output_tokens</code>, plus your own attributes (team, feature, alias, cost, cache_hit, fallback). Standard metrics include <code>gen_ai.client.token.usage</code> and <code>gen_ai.client.operation.duration</code>; the conventions also define server-side TTFT and time-per-output-token histograms. The conventions are still marked experimental, so pin the version you emit.</p>
<p>The gateway dashboard per alias and per team: RPS, TTFT p50/p95, output tokens/s, total latency, 429 rate (split: ours vs the provider's), fallback rate, circuit state, cache hit rate, guardrail hit rate, $/hour and $/request. Prompt and completion <em>content</em> is off by default: opt-in per route, redacted, written to a separate store with short retention.</p>
<p><strong>HA</strong>: the data plane is stateless; run at least 3 replicas across 3 AZs with a PodDisruptionBudget. Streams are long-lived, so scale on <em>in-flight requests</em> or connections, not RPS or CPU alone. Config is pulled from the control plane and cached as last-known-good, so a control-plane outage never stops traffic. Redis for limits is multi-AZ; decide fail-open or fail-closed per limit type.</p>
<pre>apiVersion: apps/v1
kind: Deployment
metadata: { name: llm-gateway, namespace: ai-platform }
spec:
  replicas: 3
  template:
    spec:
      terminationGracePeriodSeconds: 300      # let long streams finish on rollout
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: DoNotSchedule,
            labelSelector: { matchLabels: { app: llm-gateway } } }
      containers:
        - name: gw
          lifecycle: { preStop: { exec: { command: ["sleep", "15"] } } }   # drain from the LB first
          readinessProbe: { httpGet: { path: /health/readiness, port: 4000 } }
          resources: { requests: { cpu: "1", memory: 2Gi }, limits: { memory: 2Gi } }</pre>
<p><strong>Network</strong>: reach Bedrock over a VPC interface endpoint (PrivateLink) rather than the NAT gateway; for public providers, route through a fixed egress IP that the provider account can allow-list, and watch NAT data-processing cost on large payloads. Block all other model-provider domains at the egress proxy, so the gateway is the only path (this is how you find "shadow" API keys).</p>`,
        he: `<p><strong>Tracing עם ה-GenAI semantic conventions של OpenTelemetry</strong>: span אחד של client לכל קריאה למודל, בשם <code>chat {model}</code>, עם <code>gen_ai.operation.name</code>, <code>gen_ai.provider.name</code>, <code>gen_ai.request.model</code>, <code>gen_ai.response.model</code>, <code>gen_ai.usage.input_tokens</code> ו-<code>gen_ai.usage.output_tokens</code>, ועוד attributes משלך (צוות, פיצ'ר, alias, עלות, cache_hit, fallback). ה-metrics הסטנדרטיים כוללים <code>gen_ai.client.token.usage</code> ו-<code>gen_ai.client.operation.duration</code>, וה-conventions מגדירים גם היסטוגרמות בצד השרת ל-TTFT ולזמן לכל token של פלט. ה-conventions עדיין מסומנים כ-experimental, אז נועלים את הגרסה שאתה פולט.</p>
<p>ה-dashboard של ה-gateway לכל alias ולכל צוות: RPS, TTFT ב-p50 וב-p95, token-ים של פלט לשנייה, latency כולל, שיעור 429 (מפוצל: שלנו מול של ה-provider), שיעור fallback, מצב ה-circuit, cache hit rate, שיעור הפעלת guardrails, דולר לשעה ודולר לבקשה. ה-<em>תוכן</em> של ה-prompts וה-completions כבוי כברירת מחדל: opt-in לכל route, אחרי השחרה, נכתב ל-store נפרד עם retention קצר.</p>
<p><strong>HA</strong>: ה-data plane הוא stateless. מריצים לפחות 3 replicas על פני 3 AZs עם PodDisruptionBudget. ה-streams ארוכים, אז עושים scale לפי <em>בקשות פתוחות</em> או חיבורים, לא רק לפי RPS או CPU. ה-config נמשך מה-control plane ונשמר כ-last-known-good, כך שנפילה של ה-control plane אף פעם לא עוצרת תעבורה. ה-Redis של המגבלות הוא multi-AZ, ומחליטים fail-open או fail-closed לכל סוג מגבלה.</p>
<pre>apiVersion: apps/v1
kind: Deployment
metadata: { name: llm-gateway, namespace: ai-platform }
spec:
  replicas: 3
  template:
    spec:
      terminationGracePeriodSeconds: 300      # let long streams finish on rollout
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: DoNotSchedule,
            labelSelector: { matchLabels: { app: llm-gateway } } }
      containers:
        - name: gw
          lifecycle: { preStop: { exec: { command: ["sleep", "15"] } } }   # drain from the LB first
          readinessProbe: { httpGet: { path: /health/readiness, port: 4000 } }
          resources: { requests: { cpu: "1", memory: 2Gi }, limits: { memory: 2Gi } }</pre>
<p><strong>רשת</strong>: ל-Bedrock מגיעים דרך VPC interface endpoint (PrivateLink) ולא דרך ה-NAT gateway. ל-providers ציבוריים, מוציאים את התעבורה מ-IP יציאה קבוע שאפשר לשים ב-allow-list בחשבון של ה-provider, ושמים עין על עלות ה-data processing של ה-NAT ב-payloads גדולים. חוסמים ב-egress proxy את כל שאר הדומיינים של ספקי מודלים, כך שה-gateway הוא המסלול היחיד (ככה מוצאים API keys "בצל").</p>`
      }
    },
    {
      h: { en: "Build vs buy", he: "לבנות או לקנות" },
      body: {
        en: `<table>
<tr><th>Option</th><th>Shape</th><th>Strong at</th><th>Watch out for</th></tr>
<tr><td>LiteLLM proxy</td><td>Open-source Python proxy, Postgres for keys/spend, Redis for limits and cache</td><td>Huge provider coverage, virtual keys, teams, budgets, TPM/RPM, fallbacks, spend tracking out of the box</td><td>Python data plane: run multiple workers and replicas and load-test at your peak; some admin and SSO features are in the paid tier</td></tr>
<tr><td>Envoy AI Gateway</td><td>Envoy project built on Envoy Gateway, Kubernetes CRDs (<code>AIGatewayRoute</code>, <code>AIServiceBackend</code>, <code>BackendSecurityPolicy</code>)</td><td>High-performance Envoy data plane, K8s-native, token-based limits via <code>llmRequestCosts</code> plus the global rate-limit service on Redis</td><td>You build the portal, budgets UI and chargeback yourself; fast-moving API versions</td></tr>
<tr><td>Kong AI Gateway</td><td>AI plugins on Kong (<code>ai-proxy</code>, <code>ai-proxy-advanced</code>, <code>ai-rate-limiting-advanced</code>, <code>ai-semantic-cache</code>, <code>ai-prompt-guard</code>)</td><td>Natural if Kong already fronts your APIs; mature plugin, auth and ops model</td><td>Several AI plugins are enterprise-licensed</td></tr>
<tr><td>Portkey</td><td>Open-source gateway plus a hosted or self-hosted control plane</td><td>Declarative configs for fallbacks and load balancing, guardrails, built-in observability</td><td>Decide where logs and prompts are stored; SaaS data-residency review</td></tr>
<tr><td>Cloud-native</td><td>Bedrock (Guardrails, cross-region inference, application inference profiles for cost tags), Azure API Management AI gateway policies (token limit, token metrics, semantic cache)</td><td>No extra service to run, IAM integration, private networking</td><td>Bound to that cloud's model catalog; cross-provider routing and unified chargeback need another layer</td></tr>
</table>
<p>The common senior answer: <strong>buy or adopt the data plane, build the control plane</strong>. The proxy is commodity; what is specific to your company is identity integration, the model catalog and approval flow, data-classification rules, and chargeback into your finance systems. Build the data plane yourself only with a strong reason (very high RPS, custom protocols, strict latency) and a team to own it.</p>
<pre># LiteLLM: issue a team-scoped virtual key with limits and a monthly budget
curl -s https://llm-gw.internal/key/generate \\
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \\
  -d '{"team_id":"payments","models":["chat-fast","embed-default"],
       "tpm_limit":300000,"rpm_limit":600,"max_budget":2000,"budget_duration":"30d",
       "metadata":{"service":"refund-bot","env":"prod"}}'</pre>`,
        he: `<table>
<tr><th>אפשרות</th><th>צורה</th><th>חזק ב-</th><th>לשים לב ל-</th></tr>
<tr><td>LiteLLM proxy</td><td>Proxy בקוד פתוח ב-Python, עם Postgres למפתחות ולהוצאות ו-Redis למגבלות ול-cache</td><td>כיסוי ענק של providers, virtual keys, צוותים, תקציבים, TPM ו-RPM, fallbacks ומעקב הוצאות מהקופסה</td><td>Data plane ב-Python: מריצים כמה workers ו-replicas, ועושים load test בשיא שלך. חלק מיכולות ה-admin וה-SSO בגרסה בתשלום</td></tr>
<tr><td>Envoy AI Gateway</td><td>פרויקט של Envoy מעל Envoy Gateway, עם Kubernetes CRDs (<code>AIGatewayRoute</code>, <code>AIServiceBackend</code>, <code>BackendSecurityPolicy</code>)</td><td>Data plane מהיר של Envoy, native ל-K8s, מגבלות לפי token-ים דרך <code>llmRequestCosts</code> ושירות ה-rate limit הגלובלי על Redis</td><td>את הפורטל, ממשק התקציבים וה-chargeback אתה בונה לבד. גרסאות ה-API זזות מהר</td></tr>
<tr><td>Kong AI Gateway</td><td>Plugins של AI מעל Kong (<code>ai-proxy</code>, <code>ai-proxy-advanced</code>, <code>ai-rate-limiting-advanced</code>, <code>ai-semantic-cache</code>, <code>ai-prompt-guard</code>)</td><td>טבעי אם Kong כבר עומד מול ה-APIs שלך. מודל בשל של plugins, auth ותפעול</td><td>חלק מה-plugins של AI דורשים רישיון enterprise</td></tr>
<tr><td>Portkey</td><td>Gateway בקוד פתוח ועוד control plane מנוהל או self-hosted</td><td>Configs דקלרטיביים ל-fallbacks ול-load balancing, guardrails, observability מובנה</td><td>להחליט איפה נשמרים ה-logs וה-prompts, ובדיקת data residency ל-SaaS</td></tr>
<tr><td>Native של הענן</td><td>Bedrock (Guardrails, cross-region inference, application inference profiles ל-cost tags), ו-policies של AI gateway ב-Azure API Management (token limit, token metrics, semantic cache)</td><td>אין עוד שירות להריץ, אינטגרציה עם IAM, רשת פרטית</td><td>קשור לקטלוג המודלים של אותו ענן. ניתוב בין providers ו-chargeback אחיד דורשים עוד שכבה</td></tr>
</table>
<p>התשובה הבכירה הנפוצה: <strong>את ה-data plane קונים או מאמצים, את ה-control plane בונים</strong>. ה-proxy הוא commodity. מה שייחודי לחברה שלך זה האינטגרציה עם ה-identity, קטלוג המודלים ותהליך האישור, כללי סיווג המידע, וה-chargeback למערכות הכספים. בונים data plane לבד רק עם סיבה חזקה (RPS גבוה מאוד, פרוטוקולים מיוחדים, latency קשוח) וצוות שיחזיק אותו.</p>
<pre># LiteLLM: issue a team-scoped virtual key with limits and a monthly budget
curl -s https://llm-gw.internal/key/generate \\
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" -H "Content-Type: application/json" \\
  -d '{"team_id":"payments","models":["chat-fast","embed-default"],
       "tpm_limit":300000,"rpm_limit":600,"max_budget":2000,"budget_duration":"30d",
       "metadata":{"service":"refund-bot","env":"prod"}}'</pre>`
      }
    }
  ],
  diagram: `app (SDK, virtual key / JWT)
   |
   v
[ AI gateway data plane  x3 AZ ]
  authN -> policy -> TPM/RPM + budget (Redis) -> route(alias)
        -> cache -> input guardrails -> provider adapter
   |            \\                               |
   |             \\-- usage events -> queue -> S3/warehouse (chargeback)
   |              \\- OTel spans/metrics -> collector
   v
 deployment A (provider 1, region X)  --429/5xx-->  B (region Y)  -->  C (Bedrock, same model)
                                                     circuit breaker per deployment
[ control plane ]: keys, model catalog, routes, prices, budgets  --push/pull--> data plane`,
  handsOn: [
    {
      cmd: `curl -N https://llm-gw.internal/v1/chat/completions \\
  -H "Authorization: Bearer $LLM_GW_KEY" -H "Content-Type: application/json" \\
  -H "x-feature: ticket-summary" \\
  -d '{"model":"chat-fast","stream":true,"stream_options":{"include_usage":true},
       "max_tokens":200,"messages":[{"role":"user","content":"Explain TPM in one line"}]}'`,
      what: { en: "Stream a completion through the gateway. -N disables curl buffering so you see SSE chunks arrive; the last data chunk carries usage, and the stream ends with data: [DONE].", he: "Stream של completion דרך ה-gateway. הדגל -N מבטל buffering ב-curl כדי שתראה את ה-chunks של SSE מגיעים. ה-chunk האחרון עם data נושא את ה-usage, וה-stream נגמר ב-data: [DONE]." }
    },
    {
      cmd: `curl -s -D - -o /dev/null https://llm-gw.internal/v1/chat/completions \\
  -H "Authorization: Bearer $LLM_GW_KEY" -H "Content-Type: application/json" \\
  -d '{"model":"chat-large","max_tokens":5,"messages":[{"role":"user","content":"ping"}]}' \\
  | grep -iE 'x-ratelimit|retry-after|x-gateway|x-litellm'`,
      what: { en: "Inspect only the response headers: remaining requests/tokens, which deployment served the call, and whether a fallback happened. Good gateways expose all of this.", he: "בודקים רק את ה-headers של התשובה: כמה בקשות ו-token-ים נשארו, איזה deployment שירת את הקריאה, והאם היה fallback. Gateway טוב חושף את כל זה." }
    },
    {
      cmd: `kubectl get aigatewayroutes,aiservicebackends,backendtrafficpolicies -A
kubectl -n ai-platform describe aigatewayroute chat-routes | sed -n '/Llm Request Costs/,/Rules/p'`,
      what: { en: "On Envoy AI Gateway: list routes and backends, and check which token counts (input, output, total) are captured for rate limiting.", he: "ב-Envoy AI Gateway: רשימת routes ו-backends, ובדיקה אילו ספירות token-ים (input, output, total) נאספות בשביל ה-rate limiting." }
    },
    {
      cmd: `kubectl -n ai-platform get hpa llm-gateway
kubectl -n ai-platform rollout restart deploy/llm-gateway && kubectl -n ai-platform rollout status deploy/llm-gateway`,
      what: { en: "Check autoscaling and do a rolling restart. Keep a stream open during the restart: with preStop and a long grace period it should finish cleanly instead of being cut.", he: "בודקים autoscaling ועושים rolling restart. תשאיר stream פתוח בזמן ה-restart: עם preStop ו-grace period ארוך הוא אמור להסתיים נקי ולא להיחתך." }
    }
  ],
  mnemonic: {
    en: "\"Keys out, tokens in\": providers' keys never leave the gateway, and everything (limits, budgets, chargeback) is counted in tokens. Path: Auth, Policy, Limit, Route, Cache, Guard, Stream, Meter.",
    he: "\"מפתחות נשארים בפנים, הכול נספר ב-token-ים\": המפתחות של ה-providers לא יוצאים מה-gateway, וכל דבר (מגבלות, תקציבים, chargeback) נמדד ב-token-ים. המסלול: Auth, Policy, Limit, Route, Cache, Guard, Stream, Meter."
  },
  pitfalls: [
    { en: "Rate limiting only on requests per minute. A few long-context calls exhaust the provider's TPM and every team gets 429s. Limit on tokens with reserve-then-reconcile, and set a default max_tokens.", he: "Rate limit רק לפי בקשות לדקה. כמה קריאות עם context ארוך מרוקנות את ה-TPM של ה-provider, וכל הצוותים מקבלים 429. מגבילים לפי token-ים עם הזמנה ויישור, וקובעים max_tokens ברירת מחדל." },
    { en: "Retrying a 429 on the same deployment, or retrying after the first streamed byte. The first turns a provider throttle into a retry storm; the second shows the user duplicated or spliced text. Move to the next deployment and cap retries with a budget.", he: "Retry על 429 לאותו deployment, או retry אחרי שה-byte הראשון כבר נשלח ב-stream. הראשון הופך throttling של provider ל-retry storm. השני מציג למשתמש טקסט כפול או מודבק. עוברים ל-deployment הבא ומגבילים retries עם budget." },
    { en: "Silent fallback to a different model. Output format, tool-calling behaviour and quality change, JSON parsers break, and nobody knows why. Cross-model fallbacks must be eval-approved and visible in headers and traces.", he: "Fallback שקט למודל אחר. פורמט הפלט, התנהגות ה-tool calling והאיכות משתנים, parsers של JSON נשברים, ואף אחד לא יודע למה. Fallback בין מודלים חייב להיות מאושר ב-eval ולהיראות ב-headers וב-traces." },
    { en: "Logging full prompts and completions by default, or a semantic cache shared across tenants. Both leak customer data: one into logs everyone can read, the other into another customer's answer.", he: "Logging מלא של prompts ו-completions כברירת מחדל, או semantic cache משותף לכמה tenants. שניהם מדליפים מידע של לקוחות: אחד ל-logs שכולם קוראים, והשני לתשובה של לקוח אחר." }
  ],
  interview: [
    {
      q: { en: "How do you rate-limit LLM traffic per team when you don't know the output size in advance?", he: "איך עושים rate limit לתעבורת LLM לכל צוות כשלא יודעים מראש את גודל הפלט?" },
      a: { en: "Token bucket per (team, model) in TPM, refilled at TPM/60 per second, held in Redis with an atomic Lua script. Before the call reserve input tokens (real tokenizer) plus min(max_tokens, route p95 output); enforce a default max_tokens. After the call reconcile with usage: refund or debit the difference; for streams request include_usage and charge the reservation if the stream breaks. Add RPM as a second limit, a per-deployment limit matching the provider quota, and decide fail-open (local conservative bucket) vs fail-closed when Redis is down.", he: "Token bucket לכל זוג (צוות, מודל) ב-TPM, שמתמלא ב-TPM חלקי 60 לשנייה ונשמר ב-Redis עם Lua script אטומי. לפני הקריאה מזמינים את token-י הקלט (עם tokenizer אמיתי) ועוד min של max_tokens וה-p95 של הפלט ב-route, ואוכפים max_tokens ברירת מחדל. אחרי הקריאה מיישרים מול ה-usage: מחזירים או מחייבים את ההפרש. ב-stream מבקשים include_usage, ואם ה-stream נשבר מחייבים לפי ההזמנה. מוסיפים RPM כמגבלה שנייה, מגבלה לכל deployment שתואמת ל-quota של ה-provider, ומחליטים fail-open (bucket מקומי שמרני) או fail-closed כש-Redis למטה." }
    },
    {
      q: { en: "Provider A's region starts returning 5xx for 30% of requests. Walk through what your gateway does.", he: "ה-region של provider A מתחיל להחזיר 5xx ל-30% מהבקשות. תעבור על מה שה-gateway שלך עושה." },
      a: { en: "Each failed request is retried once on the next deployment of the same alias (same model, other region or cloud), within a retry budget of ~10% so we don't amplify load. The per-deployment circuit breaker opens after the error threshold (e.g. 50% over 20 requests), so new traffic skips A entirely; after the cooldown a half-open probe tests recovery. Requests already streaming are not retried. Metrics show fallback rate and circuit state; alerts fire on fallback rate, not every 5xx. Different-model fallback only kicks in if pre-approved by evals, with a response header so callers know.", he: "כל בקשה שנכשלה מקבלת retry אחד על ה-deployment הבא של אותו alias (אותו מודל, region או ענן אחר), בתוך retry budget של בערך 10%, כדי לא להגביר את העומס. ה-circuit breaker של ה-deployment נפתח אחרי סף השגיאות (למשל 50% על פני 20 בקשות), כך שתעבורה חדשה מדלגת על A לגמרי, ואחרי ה-cooldown בקשת half-open בודקת התאוששות. בקשות שכבר ב-stream לא מקבלות retry. ה-metrics מראים שיעור fallback ומצב circuit, וההתראות יורות על שיעור ה-fallback ולא על כל 5xx. Fallback למודל אחר נכנס רק אם אושר מראש ב-evals, עם header בתשובה כדי שהקוראים ידעו." }
    },
    {
      q: { en: "Would you build your own AI gateway or adopt one?", he: "היית בונה AI gateway בעצמך או מאמץ קיים?" },
      a: { en: "Adopt the data plane, build the control plane. Proxying, schema translation, fallbacks and SSE are commodity (LiteLLM, Envoy AI Gateway, Kong, Portkey, or the cloud's own). The differentiated parts are identity integration, model catalog and approvals, data-class policy, budgets and chargeback into finance. Criteria: provider coverage, latency overhead at our p99 and peak RPS (load-test it), token-aware limits, K8s fit, where logs live, license cost, and exit cost: keep callers on the OpenAI-compatible API and aliases so the gateway itself is replaceable.", he: "את ה-data plane מאמצים, את ה-control plane בונים. Proxying, תרגום סכמות, fallbacks ו-SSE הם commodity (LiteLLM, Envoy AI Gateway, Kong, Portkey, או מה שהענן נותן). החלקים שמבדלים הם אינטגרציה עם ה-identity, קטלוג מודלים ואישורים, policy לפי סיווג מידע, ותקציבים ו-chargeback מול הכספים. הקריטריונים: כיסוי providers, תוספת latency ב-p99 וב-RPS של השיא שלנו (עושים load test), מגבלות לפי token-ים, התאמה ל-K8s, איפה ה-logs נשמרים, עלות רישוי, ועלות יציאה: משאירים את הקוראים על API תואם OpenAI ועל aliases, כך שגם ה-gateway עצמו בר החלפה." }
    }
  ],
  quiz: [
    {
      q: { en: "A team's TPM limit is 120,000. What is the token bucket refill rate?", he: "מגבלת ה-TPM של צוות היא 120,000. מה קצב המילוי של ה-token bucket?" },
      options: [
        { en: "120,000 tokens per second", he: "120,000 token-ים לשנייה" },
        { en: "2,000 tokens per second", he: "2,000 token-ים לשנייה" },
        { en: "200 tokens per second", he: "200 token-ים לשנייה" },
        { en: "It depends only on RPM", he: "זה תלוי רק ב-RPM" }
      ],
      answer: 1,
      explain: { en: "120,000 / 60 = 2,000 tokens per second. Capacity (burst) is set separately.", he: "120,000 חלקי 60 זה 2,000 token-ים לשנייה. הקיבולת (ה-burst) נקבעת בנפרד." }
    },
    {
      q: { en: "A stream has already sent 40 tokens to the client when the provider connection resets. What should the gateway do?", he: "Stream כבר שלח 40 token-ים ל-client כשהחיבור ל-provider מתאפס. מה ה-gateway צריך לעשות?" },
      options: [
        { en: "Retry the full request on another deployment and keep streaming", he: "לעשות retry לכל הבקשה על deployment אחר ולהמשיך את ה-stream" },
        { en: "Retry on the same deployment after Retry-After", he: "לעשות retry לאותו deployment אחרי Retry-After" },
        { en: "Close the stream with an error event, meter the tokens used, count the failure for the circuit breaker", he: "לסגור את ה-stream עם error event, למדוד את ה-token-ים שנצרכו ולספור את הכשל ל-circuit breaker" },
        { en: "Return a cached answer", he: "להחזיר תשובה מה-cache" }
      ],
      answer: 2,
      explain: { en: "After the first byte the client has rendered partial output; a transparent retry would duplicate or splice text. Fail the stream cleanly and let the caller decide.", he: "אחרי ה-byte הראשון ה-client כבר הציג פלט חלקי. Retry שקוף ישכפל או ידביק טקסט. מכשילים את ה-stream בצורה נקייה ונותנים לקורא להחליט." }
    },
    {
      q: { en: "Why must the exact-match cache key include the tenant and the system prompt version?", he: "למה המפתח של cache עם התאמה מדויקת חייב לכלול את ה-tenant ואת הגרסה של ה-system prompt?" },
      options: [
        { en: "To make the hash shorter", he: "כדי שה-hash יהיה קצר יותר" },
        { en: "So one tenant never receives another's answer and a prompt change invalidates stale answers", he: "כדי ש-tenant אחד לעולם לא יקבל תשובה של אחר, ושינוי prompt יבטל תשובות ישנות" },
        { en: "Providers require it for prompt caching", he: "ה-providers דורשים את זה בשביל prompt caching" },
        { en: "It improves TTFT on cache misses", he: "זה משפר TTFT כשאין hit ב-cache" }
      ],
      answer: 1,
      explain: { en: "Cache correctness is isolation plus invalidation. Without tenant scope you leak data; without prompt version you serve answers produced by the old prompt.", he: "נכונות של cache היא בידוד ועוד invalidation. בלי scope של tenant מדליפים מידע, ובלי גרסת prompt מגישים תשובות שנוצרו עם ה-prompt הישן." }
    },
    {
      q: { en: "What is the best metric to autoscale a gateway that mostly serves long SSE streams?", he: "מה ה-metric הכי טוב ל-autoscaling של gateway שמגיש בעיקר streams ארוכים של SSE?" },
      options: [
        { en: "Requests per second", he: "בקשות לשנייה" },
        { en: "In-flight requests (concurrent connections) per replica", he: "בקשות פתוחות (חיבורים במקביל) לכל replica" },
        { en: "Provider error rate", he: "שיעור השגיאות של ה-provider" },
        { en: "Memory limit", he: "ה-memory limit" }
      ],
      answer: 1,
      explain: { en: "A stream holds a connection for seconds to minutes while using little CPU; RPS and CPU under-count load. Concurrency is what fills a replica.", he: "Stream מחזיק חיבור לשניות עד דקות ומשתמש בקצת CPU, אז RPS ו-CPU מראים פחות עומס ממה שיש. Concurrency הוא מה שממלא replica." }
    }
  ],
  related: ["ai-llmops", "pr-rate-limiters", "arch-resilience", "ai-security-practice", "cloud-finops", "ai-llm-serving", "ai-platform-paved-road"]
});

INFRA.lessons.push({
  id: "ai-agent-runtime",
  track: "ai",
  order: 11,
  icon: "🤖",
  level: 3,
  minutes: 20,
  title: { en: "Agent Runtimes: Loop, Tools, State and Isolation", he: "Agent runtimes: הלולאה, ה-tools, ה-state והבידוד" },
  tldr: {
    en: "An agent runtime is the server-side machinery around the model loop: it validates and executes tool calls (often over MCP), checkpoints state after every step so a crash resumes instead of restarting, enforces step, token, dollar and time budgets, makes side effects idempotent, pauses durably for human approval, isolates tenants (scoped credentials, sandboxed code in microVMs, default-deny egress), and streams events and traces so you can see and replay every trajectory.",
    he: "Agent runtime הוא המכונה בצד השרת שעוטפת את הלולאה של המודל: היא מאמתת ומריצה tool calls (הרבה פעמים דרך MCP), שומרת checkpoint אחרי כל צעד כדי שקריסה תמשיך ולא תתחיל מאפס, אוכפת תקציבים של צעדים, token-ים, דולרים וזמן, הופכת side effects ל-idempotent, עוצרת בצורה durable לאישור אנושי, מבודדת tenants (credentials מוגבלים, קוד ב-sandbox של microVM, egress חסום כברירת מחדל), ומזרימה events ו-traces כדי שתוכל לראות ולשחזר כל trajectory."
  },
  analogy: {
    en: "The model is a brilliant contractor who can't touch anything himself. The runtime is the site manager: it hands him only the tools on his work order, checks every request against the plan, writes every finished step in the site log so a new shift can continue after a storm, makes him wait for the owner's signature before knocking down a wall, and keeps each client's job behind its own fence.",
    he: "המודל הוא קבלן מבריק שלא נוגע בשום דבר בעצמו. ה-runtime הוא מנהל העבודה: הוא נותן לו רק את הכלים שבהזמנת העבודה, בודק כל בקשה מול התוכנית, רושם כל שלב שהסתיים ביומן העבודה כדי שמשמרת חדשה תמשיך אחרי סערה, מחכה לחתימה של הבעלים לפני שמפילים קיר, ושם כל פרויקט של לקוח מאחורי גדר משלו."
  },
  sections: [
    {
      h: { en: "The loop and the tool-calling protocol", he: "הלולאה והפרוטוקול של tool calling" },
      body: {
        en: `<p>Every agent, whatever the framework, is this loop: send messages plus tool definitions to the model; if the response contains tool calls, execute them, append the results, and call the model again; stop when the model answers without tool calls or a budget runs out. <a href="#/lesson/ai-agents-patterns">Agent Patterns</a> covers when to use an agent at all; this lesson is about running the loop in production.</p>
<p><strong>The wire protocol</strong> (OpenAI-compatible shape; Anthropic and Bedrock Converse are equivalent with different field names): each tool has a name, description and a JSON Schema for its arguments. The model returns <code>tool_calls[]</code>, each with an <code>id</code>, a function name and <em>arguments as a JSON string</em>. You answer with one <code>role: "tool"</code> message per call, carrying the matching <code>tool_call_id</code>. A missing or mismatched id is a 400 on the next turn.</p>
<ul>
<li><strong>Validate before you execute</strong>: parse the arguments and validate them against the schema (pydantic, zod, ajv). Models emit wrong types, missing fields and invented enum values. Use strict / structured-output modes where the provider supports them, and still validate.</li>
<li><strong>Errors are tool results</strong>: return a validation or execution error to the model as the tool result (<code>{"error": "customer_id must look like C-123"}</code>); it usually self-corrects on the next step. Count these: a rising tool-error rate is an early quality alarm.</li>
<li><strong>Parallel tool calls</strong>: one response can contain several independent calls (look up three orders). Execute them concurrently with a per-call timeout, and return all results before the next model call. Allow parallelism only for read-only tools, or for writes you have proven independent.</li>
<li><strong>Authorization is not the model's job</strong>: the runtime checks that this tenant and user may call this tool with these arguments. The tool list itself is filtered per tenant before it is sent.</li>
</ul>
<pre># The core loop (Python, OpenAI-compatible client pointed at the AI gateway)
for step in range(budget.max_steps):                       # e.g. 25
    resp = llm.chat.completions.create(model="chat-large", messages=msgs,
                                       tools=tools_for(tenant), parallel_tool_calls=True)
    msg = resp.choices[0].message
    budget.charge(resp.usage)                              # raises when tokens / $ exceeded
    msgs.append(msg)
    if not msg.tool_calls:
        return msg.content                                 # final answer
    results = await asyncio.gather(*[run_tool(tc, tenant, run_id) for tc in msg.tool_calls])
    msgs += [{"role": "tool", "tool_call_id": tc.id, "content": r}
             for tc, r in zip(msg.tool_calls, results)]
    checkpoint(run_id, step, msgs)                         # durable: resume from here
raise BudgetExceeded("max_steps")</pre>`,
        he: `<p>כל agent, לא משנה באיזה framework, הוא הלולאה הזאת: שולחים למודל הודעות ועוד הגדרות של tools. אם בתשובה יש tool calls, מריצים אותם, מוסיפים את התוצאות וקוראים למודל שוב. עוצרים כשהמודל עונה בלי tool calls או כשנגמר תקציב. ב-<a href="#/lesson/ai-agents-patterns">Agent Patterns</a> מוסבר מתי בכלל צריך agent. השיעור הזה עוסק בהרצת הלולאה בפרודקשן.</p>
<p><strong>הפרוטוקול על החוט</strong> (בצורה של OpenAI. ב-Anthropic וב-Bedrock Converse זה שקול עם שמות שדות אחרים): לכל tool יש שם, תיאור ו-JSON Schema לארגומנטים. המודל מחזיר <code>tool_calls[]</code>, ולכל אחד יש <code>id</code>, שם פונקציה ו<em>ארגומנטים כמחרוזת JSON</em>. אתה עונה בהודעת <code>role: "tool"</code> אחת לכל קריאה, עם ה-<code>tool_call_id</code> המתאים. id חסר או לא תואם יחזיר 400 בסבב הבא.</p>
<ul>
<li><strong>מאמתים לפני שמריצים</strong>: עושים parse לארגומנטים ומאמתים מול הסכמה (pydantic, zod, ajv). מודלים מחזירים טיפוסים לא נכונים, שדות חסרים וערכי enum מומצאים. משתמשים ב-strict או ב-structured output כשה-provider תומך, ובכל זאת מאמתים.</li>
<li><strong>שגיאות הן תוצאות של tool</strong>: מחזירים למודל שגיאת אימות או הרצה בתור תוצאת ה-tool (<code>{"error": "customer_id must look like C-123"}</code>), ובדרך כלל הוא מתקן את עצמו בצעד הבא. סופרים את זה: עלייה בשיעור השגיאות של tools היא אזעקה מוקדמת לאיכות.</li>
<li><strong>Tool calls במקביל</strong>: תשובה אחת יכולה להכיל כמה קריאות בלתי תלויות (לבדוק שלוש הזמנות). מריצים אותן במקביל עם timeout לכל קריאה, ומחזירים את כל התוצאות לפני הקריאה הבאה למודל. מתירים מקביליות רק ל-tools של קריאה בלבד, או לכתיבות שהוכחת שהן בלתי תלויות.</li>
<li><strong>הרשאות הן לא העבודה של המודל</strong>: ה-runtime בודק שה-tenant והמשתמש הזה רשאים לקרוא ל-tool הזה עם הארגומנטים האלה. גם רשימת ה-tools עצמה מסוננת לפי tenant לפני שהיא נשלחת.</li>
</ul>
<pre># The core loop (Python, OpenAI-compatible client pointed at the AI gateway)
for step in range(budget.max_steps):                       # e.g. 25
    resp = llm.chat.completions.create(model="chat-large", messages=msgs,
                                       tools=tools_for(tenant), parallel_tool_calls=True)
    msg = resp.choices[0].message
    budget.charge(resp.usage)                              # raises when tokens / $ exceeded
    msgs.append(msg)
    if not msg.tool_calls:
        return msg.content                                 # final answer
    results = await asyncio.gather(*[run_tool(tc, tenant, run_id) for tc in msg.tool_calls])
    msgs += [{"role": "tool", "tool_call_id": tc.id, "content": r}
             for tc, r in zip(msg.tool_calls, results)]
    checkpoint(run_id, step, msgs)                         # durable: resume from here
raise BudgetExceeded("max_steps")</pre>`
      }
    },
    {
      h: { en: "Tools at scale: MCP as the tool bus, and the context cost of tools", he: "Tools ב-scale: MCP בתור ה-bus של ה-tools, והמחיר של tools ב-context" },
      body: {
        en: `<p>With 30 teams exposing capabilities, you don't want every agent to link every SDK. <strong>MCP</strong> makes tools a network service: teams run MCP servers (<code>tools/list</code>, <code>tools/call</code> over Streamable HTTP, OAuth-protected), and the runtime is an MCP client that discovers and calls them. The platform adds an <strong>MCP gateway or registry</strong>: which servers exist, which tenants and agents may use which tools, and central logging of every call. Protocol details are in <a href="#/lesson/ai-mcp-servers">MCP Servers</a>.</p>
<p><strong>Tools cost tokens on every step.</strong> Each definition (name, description, schema) is sent with every model call. 60 tools at ~300 tokens each is ~18k input tokens per step before any conversation; over a 20-step run that is 360k tokens of tool definitions alone. Prompt caching softens the price, but accuracy also drops when the model must choose among many similar tools. Fixes: give each agent a small curated toolset (5-15), load tools dynamically (a search-tools step or routing by intent), and merge chatty fine-grained tools into task-level ones (<code>refund_order</code>, not <code>get_order</code> + <code>create_ledger_entry</code> + <code>send_email</code>).</p>
<p><strong>Classify every tool by side effect</strong>, because the runtime treats them differently:</p>
<table>
<tr><th>Class</th><th>Examples</th><th>Runtime policy</th></tr>
<tr><td>Read-only</td><td>search_docs, get_order</td><td>Parallel allowed, retried freely, cached within a run</td></tr>
<tr><td>Reversible write</td><td>create_draft, add_label</td><td>Idempotency key required, retried with the same key</td></tr>
<tr><td>Irreversible or external</td><td>issue_refund, send_email, deploy</td><td>Idempotency key, human approval above a threshold, never parallel, audited</td></tr>
<tr><td>Code execution</td><td>run_python, run_shell</td><td>Only inside a sandbox (see isolation below), with CPU, memory, time and egress limits</td></tr>
</table>`,
        he: `<p>כש-30 צוותים חושפים יכולות, אתה לא רוצה שכל agent יקשר את כל ה-SDKs. <strong>MCP</strong> הופך tools לשירות רשת: צוותים מריצים MCP servers (<code>tools/list</code>, <code>tools/call</code> מעל Streamable HTTP, מוגנים ב-OAuth), וה-runtime הוא MCP client שמגלה אותם וקורא להם. הפלטפורמה מוסיפה <strong>MCP gateway או registry</strong>: אילו servers קיימים, איזה tenant ואיזה agent רשאים להשתמש באיזה tool, ו-logging מרכזי של כל קריאה. פרטי הפרוטוקול נמצאים ב-<a href="#/lesson/ai-mcp-servers">MCP Servers</a>.</p>
<p><strong>Tools עולים token-ים בכל צעד.</strong> כל הגדרה (שם, תיאור, סכמה) נשלחת בכל קריאה למודל. 60 tools של בערך 300 token-ים כל אחד זה בערך 18k token-ים של input בכל צעד, עוד לפני השיחה. בריצה של 20 צעדים זה 360k token-ים רק על הגדרות. Prompt caching מוריד את המחיר, אבל גם הדיוק יורד כשהמודל צריך לבחור מבין הרבה tools דומים. הפתרונות: לתת לכל agent סט קטן ומאוצר (5 עד 15), לטעון tools דינמית (צעד של חיפוש tools או ניתוב לפי כוונה), ולאחד tools קטנים ופטפטניים ל-tools ברמת משימה (<code>refund_order</code>, ולא <code>get_order</code> ועוד <code>create_ledger_entry</code> ועוד <code>send_email</code>).</p>
<p><strong>מסווגים כל tool לפי ה-side effect שלו</strong>, כי ה-runtime מתייחס אליהם אחרת:</p>
<table>
<tr><th>סוג</th><th>דוגמאות</th><th>ה-policy של ה-runtime</th></tr>
<tr><td>קריאה בלבד</td><td>search_docs, get_order</td><td>מותר במקביל, retry חופשי, cache בתוך הריצה</td></tr>
<tr><td>כתיבה הפיכה</td><td>create_draft, add_label</td><td>חובה idempotency key, ו-retry עם אותו key</td></tr>
<tr><td>בלתי הפיך או חיצוני</td><td>issue_refund, send_email, deploy</td><td>Idempotency key, אישור אנושי מעל סף, אף פעם לא במקביל, עם audit</td></tr>
<tr><td>הרצת קוד</td><td>run_python, run_shell</td><td>רק בתוך sandbox (ראה בידוד בהמשך), עם מגבלות CPU, זיכרון, זמן ו-egress</td></tr>
</table>`
      }
    },
    {
      h: { en: "State, memory, checkpointing and durable execution", he: "State, זיכרון, checkpointing ו-durable execution" },
      body: {
        en: `<p>Three kinds of state, with different stores and lifetimes:</p>
<ul>
<li><strong>Run state</strong> (the message list, tool results, step counter, budget used): lives for the run, checkpointed after every step. Large tool outputs (a 2 MB log, a CSV) are stored in S3 and referenced by pointer, with a truncated preview in the context.</li>
<li><strong>Scratchpad / working notes</strong>: the agent's own plan and notes (a todo list, findings so far), kept so that context compaction doesn't erase progress on long runs.</li>
<li><strong>Long-term memory</strong>: facts about a user or tenant across runs (preferences, past decisions), in a key-value or vector store partitioned by tenant, with TTL, provenance and a delete path for privacy requests. Memory written by an agent is untrusted input next time: an injected instruction saved to memory is a persistent attack.</li>
</ul>
<p><strong>Why durable execution</strong>: a 40-minute run with 60 steps will meet pod evictions, deploys, provider timeouts and human approvals that take a day. Restarting from zero repays every token and can repeat side effects. Model the run so that each model call and each tool call is a recorded step; on crash, a new worker replays the history and continues at the first unfinished step (see <a href="#/lesson/arch-durable-execution">Durable Execution</a>).</p>
<table>
<tr><th>Option</th><th>How the agent maps</th><th>Fits when</th></tr>
<tr><td>Temporal</td><td>Loop = deterministic workflow; LLM and tool calls = activities with retry policies; approval = signal; timeouts = durable timers</td><td>Many long runs, complex retries, you can operate Temporal or buy the cloud service</td></tr>
<tr><td>AWS Step Functions</td><td>Standard workflow, Lambda/ECS tasks per step, approval via <code>.waitForTaskToken</code>; Standard workflows can run up to a year</td><td>AWS-native, moderate step counts; mind the 256 KB state payload limit (pass S3 pointers) and per-transition pricing</td></tr>
<tr><td>LangGraph checkpointer</td><td>Graph state saved after each node by a checkpointer (e.g. Postgres) keyed by <code>thread_id</code>; <code>interrupt()</code> pauses for a human, resume with a command</td><td>Python agents already on LangGraph; you still own workers, leases and retries</td></tr>
<tr><td>Your own table</td><td><code>agent_steps(run_id, step, kind, input_ref, output_ref, status)</code> plus a lease per run</td><td>Simple, short loops; becomes a homemade workflow engine quickly</td></tr>
</table>
<pre># LangGraph: checkpoint every step in Postgres, pause for approval, resume later
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.types import interrupt, Command

def approve_refund(state):
    decision = interrupt({"action": "issue_refund", "amount": state["amount"]})  # run pauses here
    return {"approved": decision == "approve"}

with PostgresSaver.from_conn_string(DB_URL) as saver:
    graph = builder.compile(checkpointer=saver)
    cfg = {"configurable": {"thread_id": run_id}}
    graph.invoke({"ticket": t}, cfg)                       # stops at interrupt()
    graph.invoke(Command(resume="approve"), cfg)           # hours later, any worker</pre>`,
        he: `<p>שלושה סוגי state, עם stores ואורך חיים שונים:</p>
<ul>
<li><strong>Run state</strong> (רשימת ההודעות, תוצאות ה-tools, מונה הצעדים, התקציב שנוצל): חי לאורך הריצה, ונשמר ב-checkpoint אחרי כל צעד. פלט גדול של tool (log של 2 MB, קובץ CSV) נשמר ב-S3 ומופיע כמצביע, עם תצוגה מקוצרת בתוך ה-context.</li>
<li><strong>Scratchpad, הערות עבודה</strong>: התוכנית וההערות של ה-agent עצמו (רשימת משימות, ממצאים עד עכשיו). שומרים אותם כדי ש-compaction של ה-context לא ימחק התקדמות בריצות ארוכות.</li>
<li><strong>זיכרון לטווח ארוך</strong>: עובדות על משתמש או tenant בין ריצות (העדפות, החלטות קודמות), ב-store של key-value או וקטורים, מחולק לפי tenant, עם TTL, מקור ומסלול מחיקה לבקשות פרטיות. זיכרון שה-agent כתב הוא קלט לא אמין בפעם הבאה: הוראה מוזרקת שנשמרה בזיכרון היא מתקפה קבועה.</li>
</ul>
<p><strong>למה durable execution</strong>: ריצה של 40 דקות עם 60 צעדים תפגוש evictions של Pods, deploys, timeouts של providers ואישורים אנושיים שלוקחים יום. להתחיל מאפס אומר לשלם שוב על כל token, ואולי לחזור על side effects. בונים את הריצה כך שכל קריאה למודל וכל קריאה ל-tool היא צעד מתועד. בקריסה, worker חדש משחזר את ההיסטוריה וממשיך מהצעד הראשון שלא הסתיים (ראה <a href="#/lesson/arch-durable-execution">Durable Execution</a>).</p>
<table>
<tr><th>אפשרות</th><th>איך ה-agent ממופה</th><th>מתאים כש-</th></tr>
<tr><td>Temporal</td><td>הלולאה היא workflow דטרמיניסטי. קריאות למודל ול-tools הן activities עם retry policies. אישור הוא signal, ו-timeouts הם timers עמידים</td><td>הרבה ריצות ארוכות, retries מורכבים, ויש לך יכולת להפעיל Temporal או לקנות את שירות הענן</td></tr>
<tr><td>AWS Step Functions</td><td>Standard workflow, משימת Lambda או ECS לכל צעד, ואישור דרך <code>.waitForTaskToken</code>. Standard workflow יכול לרוץ עד שנה</td><td>עולם AWS, מספר צעדים בינוני. שים לב למגבלת payload של 256 KB ל-state (מעבירים מצביעי S3) ולתמחור לפי מעבר</td></tr>
<tr><td>LangGraph checkpointer</td><td>ה-state של הגרף נשמר אחרי כל node ע"י checkpointer (למשל Postgres) לפי <code>thread_id</code>. <code>interrupt()</code> עוצר לאדם, וממשיכים עם command</td><td>Agents ב-Python שכבר על LangGraph. את ה-workers, ה-leases וה-retries עדיין מחזיק אתה</td></tr>
<tr><td>טבלה משלך</td><td><code>agent_steps(run_id, step, kind, input_ref, output_ref, status)</code> ועוד lease לכל ריצה</td><td>לולאות פשוטות וקצרות. מהר מאוד הופך ל-workflow engine ביתי</td></tr>
</table>
<pre># LangGraph: checkpoint every step in Postgres, pause for approval, resume later
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.types import interrupt, Command

def approve_refund(state):
    decision = interrupt({"action": "issue_refund", "amount": state["amount"]})  # run pauses here
    return {"approved": decision == "approve"}

with PostgresSaver.from_conn_string(DB_URL) as saver:
    graph = builder.compile(checkpointer=saver)
    cfg = {"configurable": {"thread_id": run_id}}
    graph.invoke({"ticket": t}, cfg)                       # stops at interrupt()
    graph.invoke(Command(resume="approve"), cfg)           # hours later, any worker</pre>`
      }
    },
    {
      h: { en: "Budgets, timeouts, idempotent retries and human-in-the-loop", he: "תקציבים, timeouts, retries אידמפוטנטיים ו-human-in-the-loop" },
      body: {
        en: `<p><strong>Every run has four budgets</strong>, enforced by the runtime, never by the prompt: max steps (e.g. 25-50), max tokens, max dollars (e.g. $2 per support run, $20 per coding run), and max wall-clock. Plus per-call timeouts: model call 60-120 s, read tool 10-30 s, code execution 5 min. When a budget runs out, end gracefully: summarize progress, return a partial result, mark the run <code>budget_exceeded</code>, and alert if the rate rises. A loop that calls the same failing tool 40 times is the most common runaway; detect repeated identical calls and stop early.</p>
<p><strong>Retries and idempotency</strong>: model calls are safe to retry. Side-effecting tools are not, and durable engines retry activities after a crash, so "exactly once" must come from the tool. Derive an idempotency key deterministically, for example <code>sha256(run_id + step + tool_call_id)</code>, and pass it to the downstream API (Stripe-style <code>Idempotency-Key</code> header or a unique constraint). If the tool ran but the worker died before recording it, the retry returns the stored result instead of refunding twice. See <a href="#/lesson/pr-idempotency">Idempotency</a>.</p>
<pre>// NestJS tool handler: idempotent side effect
async issueRefund(args: RefundArgs, ctx: ToolCtx) {
  const key = createHash("sha256").update(\`\${ctx.runId}:\${ctx.step}:\${ctx.toolCallId}\`).digest("hex");
  const prior = await this.toolResults.findOne({ key });
  if (prior) return prior.result;                         // replay after crash: no double refund
  const res = await this.payments.refund(args, { idempotencyKey: key });
  await this.toolResults.insert({ key, result: res });    // unique index on key
  return res;
}</pre>
<p><strong>Human-in-the-loop</strong>: tier tools by risk. Low risk runs automatically; medium risk (refund under $100) is allowed by policy with audit; high risk (refund above the threshold, sending an external email, a production change) creates an approval request and the run <em>pauses durably</em>: a Temporal signal, a Step Functions task token, a LangGraph interrupt. The approval UI shows the exact action and arguments, not the model's summary of them. Approvals expire (e.g. 24 h, then the run is cancelled or escalated), and an approval applies to one action with those arguments, not to "whatever the agent does next".</p>`,
        he: `<p><strong>לכל ריצה יש ארבעה תקציבים</strong>, שה-runtime אוכף ולא ה-prompt: מקסימום צעדים (למשל 25 עד 50), מקסימום token-ים, מקסימום דולרים (למשל $2 לריצת support ו-$20 לריצת קוד), ומקסימום זמן. ובנוסף timeouts לכל קריאה: קריאה למודל 60 עד 120 שניות, tool של קריאה 10 עד 30 שניות, הרצת קוד 5 דקות. כשתקציב נגמר, מסיימים בצורה מסודרת: מסכמים את ההתקדמות, מחזירים תוצאה חלקית, מסמנים את הריצה כ-<code>budget_exceeded</code>, ומתריעים אם השיעור עולה. לולאה שקוראת 40 פעם לאותו tool שנכשל היא ה-runaway הכי נפוץ. מזהים קריאות זהות שחוזרות ועוצרים מוקדם.</p>
<p><strong>Retries ו-idempotency</strong>: על קריאות למודל בטוח לעשות retry. על tools עם side effects לא, ו-durable engines עושים retry ל-activities אחרי קריסה, אז ה-"exactly once" חייב להגיע מה-tool. גוזרים idempotency key בצורה דטרמיניסטית, למשל <code>sha256(run_id + step + tool_call_id)</code>, ומעבירים אותו ל-API שמאחור (header בסגנון <code>Idempotency-Key</code> של Stripe, או unique constraint). אם ה-tool רץ אבל ה-worker מת לפני שתיעד את זה, ה-retry מחזיר את התוצאה השמורה במקום להחזיר כסף פעמיים. ראה <a href="#/lesson/pr-idempotency">Idempotency</a>.</p>
<pre>// NestJS tool handler: idempotent side effect
async issueRefund(args: RefundArgs, ctx: ToolCtx) {
  const key = createHash("sha256").update(\`\${ctx.runId}:\${ctx.step}:\${ctx.toolCallId}\`).digest("hex");
  const prior = await this.toolResults.findOne({ key });
  if (prior) return prior.result;                         // replay after crash: no double refund
  const res = await this.payments.refund(args, { idempotencyKey: key });
  await this.toolResults.insert({ key, result: res });    // unique index on key
  return res;
}</pre>
<p><strong>Human-in-the-loop</strong>: מדרגים tools לפי סיכון. סיכון נמוך רץ אוטומטית. סיכון בינוני (החזר מתחת ל-$100) מותר לפי policy עם audit. סיכון גבוה (החזר מעל הסף, מייל חיצוני, שינוי בפרודקשן) יוצר בקשת אישור, והריצה <em>נעצרת בצורה durable</em>: signal ב-Temporal, task token ב-Step Functions, או interrupt ב-LangGraph. ממשק האישור מציג את הפעולה והארגומנטים המדויקים, לא את הסיכום של המודל עליהם. לאישורים יש תוקף (למשל 24 שעות, ואז הריצה מבוטלת או מוסלמת), ואישור חל על פעולה אחת עם הארגומנטים האלה, לא על "מה שה-agent יעשה אחר כך".</p>`
      }
    },
    {
      h: { en: "Multi-tenant isolation: credentials, sandboxes, egress", he: "בידוד multi-tenant: credentials, sandboxes ו-egress" },
      body: {
        en: `<p>Assume the model can be steered by anything it reads (a web page, a ticket, a PDF). Isolation must hold even when the agent is fully hijacked. Deeper background: <a href="#/lesson/pr-tenant-isolation-deep">Tenant Isolation Deep Dive</a> and <a href="#/lesson/pr-owasp-api-llm">OWASP API &amp; LLM Top 10</a>.</p>
<ul>
<li><strong>Credentials per tenant and per user</strong>: the agent acts <em>on behalf of</em> a user, with that user's permissions. Exchange the user's token for a short-lived, narrowly scoped downstream token (OAuth token exchange, or STS AssumeRole with a session policy and a tenant tag). Never give the runtime a shared super-credential that can read every tenant's data; the tool layer adds <code>tenant_id</code> from the authenticated context, never from model-supplied arguments.</li>
<li><strong>Sandboxed code execution</strong>: a normal container shares the host kernel, which is not a safe boundary for code written by a model under attacker influence. Options: <strong>gVisor</strong> (a user-space kernel that intercepts syscalls; runs as a Kubernetes RuntimeClass; some syscall-heavy overhead), <strong>Firecracker microVMs</strong> (KVM-based, boot in roughly 125 ms with a few MiB of memory overhead per VM; needs bare-metal or nested-virtualization hosts), <strong>Kata Containers</strong> (pods inside lightweight VMs). Managed options exist (cloud code-interpreter services and agent runtimes that give each session its own microVM). One sandbox per run or per session, never shared across tenants, destroyed at the end, with CPU, memory, disk, process and time limits.</li>
<li><strong>Network egress policy</strong>: default deny. Sandboxes get no route to the cloud metadata endpoint (<code>169.254.169.254</code>), the VPC, or internal services. If browsing or package install is needed, go through an egress proxy with a domain allowlist and logging. Exfiltration usually happens through egress (a URL with secrets in its query string), so this is the control that matters most.</li>
<li><strong>Noisy neighbours</strong>: per-tenant concurrency limits on runs and sandboxes, per-tenant token budgets at the gateway, separate queues or priorities for large tenants.</li>
</ul>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: gvisor }
handler: runsc
scheduling: { nodeSelector: { sandbox: "gvisor" } }     # dedicated node pool for untrusted code
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: sandbox-egress, namespace: agent-sandboxes }
spec:
  podSelector: { matchLabels: { role: code-sandbox } }
  policyTypes: [Egress]
  egress:
    - to: [ { podSelector: { matchLabels: { app: egress-proxy } } } ]   # only the allowlisting proxy
      ports: [ { port: 3128, protocol: TCP } ]</pre>`,
        he: `<p>תניח שכל דבר שהמודל קורא (דף אינטרנט, טיקט, PDF) יכול להטות אותו. הבידוד חייב להחזיק גם כשה-agent נחטף לגמרי. רקע מעמיק נמצא ב-<a href="#/lesson/pr-tenant-isolation-deep">Tenant Isolation Deep Dive</a> וב-<a href="#/lesson/pr-owasp-api-llm">OWASP API &amp; LLM Top 10</a>.</p>
<ul>
<li><strong>Credentials לכל tenant ולכל משתמש</strong>: ה-agent פועל <em>בשם</em> משתמש, עם ההרשאות של המשתמש הזה. מחליפים את ה-token של המשתמש ב-token קצר מועד ומוגבל לשירות שמאחור (OAuth token exchange, או STS AssumeRole עם session policy ו-tag של tenant). אף פעם לא נותנים ל-runtime credential-על משותף שקורא את המידע של כל ה-tenants. שכבת ה-tools מוסיפה את ה-<code>tenant_id</code> מה-context המאומת, אף פעם לא מארגומנטים שהמודל סיפק.</li>
<li><strong>הרצת קוד ב-sandbox</strong>: container רגיל חולק את ה-kernel של ה-host, וזה לא גבול בטוח לקוד שמודל כתב תחת השפעה של תוקף. האפשרויות: <strong>gVisor</strong> (kernel ב-user space שמיירט syscalls, רץ כ-RuntimeClass ב-Kubernetes, עם תקורה בעומסים כבדי syscalls), <strong>Firecracker microVMs</strong> (מבוסס KVM, עולה בערך ב-125 אלפיות שנייה עם תקורת זיכרון של כמה MiB לכל VM, ודורש hosts מסוג bare-metal או nested virtualization), ו-<strong>Kata Containers</strong> (Pods בתוך VMs קלים). יש גם אפשרויות מנוהלות (שירותי code interpreter של עננים ו-agent runtimes שנותנים לכל session microVM משלו). Sandbox אחד לכל ריצה או session, אף פעם לא משותף בין tenants, נהרס בסוף, עם מגבלות CPU, זיכרון, דיסק, תהליכים וזמן.</li>
<li><strong>Policy ל-egress</strong>: חסום כברירת מחדל. ל-sandboxes אין route ל-metadata endpoint של הענן (<code>169.254.169.254</code>), ל-VPC או לשירותים פנימיים. אם צריך גלישה או התקנת packages, עוברים דרך egress proxy עם allowlist של דומיינים ו-logging. הוצאת מידע קורית בדרך כלל דרך egress (URL עם secrets ב-query string), אז זו הבקרה הכי חשובה.</li>
<li><strong>שכנים רועשים</strong>: מגבלות concurrency לכל tenant על ריצות ו-sandboxes, תקציבי token-ים לכל tenant ב-gateway, ותורים או עדיפויות נפרדים ל-tenants גדולים.</li>
</ul>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: gvisor }
handler: runsc
scheduling: { nodeSelector: { sandbox: "gvisor" } }     # dedicated node pool for untrusted code
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: sandbox-egress, namespace: agent-sandboxes }
spec:
  podSelector: { matchLabels: { role: code-sandbox } }
  policyTypes: [Egress]
  egress:
    - to: [ { podSelector: { matchLabels: { app: egress-proxy } } } ]   # only the allowlisting proxy
      ports: [ { port: 3128, protocol: TCP } ]</pre>`
      }
    },
    {
      h: { en: "Streaming events to the UI, and observing trajectories", he: "הזרמת events ל-UI, ו-observability של trajectories" },
      body: {
        en: `<p>Users tolerate a 3-minute run if they can watch it work. Define a small, versioned <strong>event protocol</strong> instead of piping raw model chunks: <code>run.started</code>, <code>message.delta</code>, <code>tool.started</code> (name, redacted args), <code>tool.completed</code> (status, duration), <code>approval.required</code>, <code>run.completed</code> / <code>run.failed</code>, each with a monotonically increasing sequence number.</p>
<p><strong>Plumbing</strong>: workers run the loop, not the API pods that hold the browser connection. Workers append events to a per-run stream (Redis Streams, or a pub/sub channel plus a durable event table); the API pod subscribes and relays as SSE with <code>id: &lt;seq&gt;</code>. When the browser reconnects with <code>Last-Event-ID</code>, the API replays from that sequence. A deploy of the API tier therefore never kills a run, and a worker crash only pauses the stream until the durable engine resumes the run.</p>
<p><strong>Trajectory observability</strong>: one trace per run. OpenTelemetry GenAI conventions define agent operations (<code>invoke_agent</code>), model calls (<code>chat</code>) and tool executions (<code>execute_tool</code>, with <code>gen_ai.tool.name</code> and <code>gen_ai.tool.call.id</code>). Add run_id, tenant, step, budget used, and approval waits. Store full trajectories (with redaction) for replay: they are the raw material for debugging and for the eval datasets in <a href="#/lesson/ai-agent-evals">Evaluating Agents</a>. Fleet metrics: run success rate, steps and $ per run (p50/p95), budget-exceeded rate, tool error rate per tool, approval wait time, sandbox start latency.</p>
<pre>run 7f3a  tenant=acme  agent=support-v14  status=completed  steps=9  cost=$0.31  wall=74s
 ├─ invoke_agent support-v14                                   74.1s
 │   ├─ chat chat-large            in=6.2k out=180  TTFT 0.9s   2.1s
 │   ├─ execute_tool get_order     ok                           0.3s
 │   ├─ chat chat-large            in=7.0k out=95               1.4s
 │   ├─ execute_tool issue_refund  approval_wait=51s  ok       52.2s
 │   └─ chat chat-large            in=7.6k out=240              2.6s</pre>`,
        he: `<p>משתמשים סובלים ריצה של 3 דקות אם הם יכולים לראות אותה עובדת. מגדירים <strong>פרוטוקול events</strong> קטן ומנוהל בגרסאות, במקום להעביר chunks גולמיים של המודל: <code>run.started</code>, <code>message.delta</code>, <code>tool.started</code> (שם וארגומנטים מושחרים), <code>tool.completed</code> (סטטוס ומשך), <code>approval.required</code>, <code>run.completed</code> או <code>run.failed</code>, לכל אחד מספר רצף עולה.</p>
<p><strong>הצנרת</strong>: workers מריצים את הלולאה, לא ה-Pods של ה-API שמחזיקים את החיבור לדפדפן. ה-workers כותבים events ל-stream של הריצה (Redis Streams, או ערוץ pub/sub ועוד טבלת events עמידה). ה-Pod של ה-API נרשם ומעביר אותם כ-SSE עם <code>id: &lt;seq&gt;</code>. כשהדפדפן מתחבר מחדש עם <code>Last-Event-ID</code>, ה-API משחזר מאותו מספר רצף. ככה deploy של שכבת ה-API אף פעם לא הורג ריצה, וקריסה של worker רק משהה את ה-stream עד שה-durable engine ממשיך את הריצה.</p>
<p><strong>Observability של trajectories</strong>: trace אחד לכל ריצה. ה-GenAI conventions של OpenTelemetry מגדירים פעולות agent (<code>invoke_agent</code>), קריאות למודל (<code>chat</code>) והרצת tools (<code>execute_tool</code>, עם <code>gen_ai.tool.name</code> ו-<code>gen_ai.tool.call.id</code>). מוסיפים run_id, tenant, צעד, תקציב שנוצל וזמני המתנה לאישור. שומרים trajectories מלאים (אחרי השחרה) לשחזור: הם חומר הגלם ל-debugging ול-datasets של ה-evals ב-<a href="#/lesson/ai-agent-evals">Evaluating Agents</a>. Metrics ברמת הצי: שיעור הצלחת ריצות, צעדים ודולרים לריצה (p50 ו-p95), שיעור חריגות תקציב, שיעור שגיאות לכל tool, זמן המתנה לאישור, ו-latency של עליית sandbox.</p>
<pre>run 7f3a  tenant=acme  agent=support-v14  status=completed  steps=9  cost=$0.31  wall=74s
 ├─ invoke_agent support-v14                                   74.1s
 │   ├─ chat chat-large            in=6.2k out=180  TTFT 0.9s   2.1s
 │   ├─ execute_tool get_order     ok                           0.3s
 │   ├─ chat chat-large            in=7.0k out=95               1.4s
 │   ├─ execute_tool issue_refund  approval_wait=51s  ok       52.2s
 │   └─ chat chat-large            in=7.6k out=240              2.6s</pre>`
      }
    }
  ],
  diagram: `UI --SSE (Last-Event-ID)--> API pods <--subscribe-- run event stream (Redis Streams)
 |                                                          ^
 | POST /runs                                               | append events
 v                                                          |
durable engine (Temporal / Step Functions / checkpointer) --> agent workers
                                                              |  loop: model -> tools -> model
                       +--------------------------------------+-----------------------+
                       v                       v                                      v
                AI gateway (budgets)   MCP gateway -> MCP servers           sandbox pool (gVisor / microVM)
                                       (per-tenant creds, audit)           egress -> allowlist proxy only
checkpoints + tool results (Postgres/S3)      traces: invoke_agent > chat > execute_tool`,
  handsOn: [
    {
      cmd: `curl -s https://llm-gw.internal/v1/chat/completions -H "Authorization: Bearer $LLM_GW_KEY" \\
  -H "Content-Type: application/json" -d '{
  "model":"chat-large","parallel_tool_calls":true,
  "messages":[{"role":"user","content":"Status of orders A-1 and A-2?"}],
  "tools":[{"type":"function","function":{"name":"get_order","description":"Get one order by id",
    "parameters":{"type":"object","properties":{"order_id":{"type":"string","pattern":"^A-[0-9]+$"}},
    "required":["order_id"],"additionalProperties":false}}}]}' | jq '.choices[0].message.tool_calls'`,
      what: { en: "See the raw protocol: the model should return two parallel tool_calls, each with its own id and arguments as a JSON string. Answer each with a role=tool message carrying that tool_call_id.", he: "רואים את הפרוטוקול הגולמי: המודל אמור להחזיר שני tool_calls במקביל, לכל אחד id משלו וארגומנטים כמחרוזת JSON. עונים על כל אחד בהודעת role=tool עם ה-tool_call_id שלו." }
    },
    {
      cmd: `temporal workflow show --workflow-id agent-run-7f3a | head -40
temporal workflow signal --workflow-id agent-run-7f3a --name approval --input '{"decision":"approve"}'`,
      what: { en: "Inspect a durable agent run's event history (each model and tool call is an activity) and send the human approval signal that resumes it.", he: "בודקים את היסטוריית ה-events של ריצת agent עמידה (כל קריאה למודל ול-tool היא activity), ושולחים את ה-signal של האישור האנושי שממשיך אותה." }
    },
    {
      cmd: `kubectl get runtimeclass
kubectl -n agent-sandboxes run sbx-test --rm -it --restart=Never --image=python:3.12-slim \\
  --overrides='{"spec":{"runtimeClassName":"gvisor"}}' -- sh -c 'dmesg | head -3; python -c "import urllib.request as u; u.urlopen(\\"http://169.254.169.254/\\", timeout=3)" || echo blocked'`,
      what: { en: "Start a throwaway pod under gVisor: dmesg shows the gVisor kernel instead of the host's, and the metadata endpoint must be unreachable.", he: "מרימים Pod זמני תחת gVisor: הפקודה dmesg מציגה את ה-kernel של gVisor ולא של ה-host, וה-metadata endpoint חייב להיות לא נגיש." }
    },
    {
      cmd: `curl -N -H "Last-Event-ID: 41" https://agents.internal/v1/runs/7f3a/events`,
      what: { en: "Reconnect to a run's event stream from sequence 41: a correct runtime replays the missed events and continues live, with no gaps or duplicates.", he: "מתחברים מחדש ל-stream של ריצה ממספר רצף 41: runtime תקין משחזר את ה-events שהוחמצו וממשיך live, בלי חורים ובלי כפילויות." }
    }
  ],
  mnemonic: {
    en: "\"Loop, Log, Limit, Lock\": loop the model and tools, log (checkpoint) every step, limit every run with budgets, lock each tenant into its own credentials, sandbox and egress.",
    he: "\"לולאה, יומן, תקרה, מנעול\": מריצים את המודל וה-tools בלולאה, רושמים (checkpoint) כל צעד ביומן, שמים תקרת תקציב על כל ריצה, ונועלים כל tenant בתוך ה-credentials, ה-sandbox וה-egress שלו."
  },
  pitfalls: [
    { en: "Running the agent loop inside the HTTP request handler. A deploy, a pod eviction or a browser refresh kills a 10-minute run and the user pays twice. Run loops on workers under a durable engine and stream events through a separate tier.", he: "להריץ את הלולאה של ה-agent בתוך ה-handler של בקשת HTTP. Deploy, eviction של Pod או רענון של הדפדפן הורגים ריצה של 10 דקות, והמשתמש משלם פעמיים. מריצים לולאות על workers תחת durable engine, ומזרימים events דרך שכבה נפרדת." },
    { en: "Side-effecting tools without idempotency keys. Durable engines retry after crashes by design, so the refund or email goes out twice. Derive the key from run, step and tool_call_id and enforce it downstream.", he: "Tools עם side effects בלי idempotency keys. Durable engines עושים retry אחרי קריסה בכוונה, אז ההחזר או המייל יוצאים פעמיים. גוזרים key מהריצה, מהצעד ומה-tool_call_id, ואוכפים אותו בשירות שמאחור." },
    { en: "Letting the model pass tenant_id or user_id as a tool argument. A prompt injection changes it and reads another tenant's data. Identity comes from the authenticated run context only.", he: "לתת למודל להעביר tenant_id או user_id כארגומנט של tool. Prompt injection משנה אותו וקורא מידע של tenant אחר. ה-identity מגיע רק מה-context המאומת של הריצה." },
    { en: "Executing model-written code in a normal container with default networking. It shares the host kernel and can reach the metadata endpoint and internal services. Use gVisor or microVMs plus default-deny egress.", he: "להריץ קוד שהמודל כתב ב-container רגיל עם רשת ברירת מחדל. הוא חולק את ה-kernel של ה-host ויכול להגיע ל-metadata endpoint ולשירותים פנימיים. משתמשים ב-gVisor או ב-microVMs, ועם egress חסום כברירת מחדל." }
  ],
  interview: [
    {
      q: { en: "An agent run takes up to 2 hours and may wait a day for approval. How do you make it survive deploys and crashes?", he: "ריצת agent לוקחת עד שעתיים ויכולה לחכות יום לאישור. איך גורמים לה לשרוד deploys וקריסות?" },
      a: { en: "Run it under durable execution: the loop is a workflow, each model call and tool call is a recorded activity with its own retry policy and timeout, and the approval is a signal or task token with an expiry timer. After a crash another worker replays history and continues at the first incomplete step, without re-paying for completed model calls. Large payloads go to S3 by reference. Side-effecting tools use idempotency keys derived from run, step and tool_call_id because the engine will retry them. The UI connects to an event stream with sequence ids, so it can reconnect and replay.", he: "מריצים אותה תחת durable execution: הלולאה היא workflow, כל קריאה למודל ול-tool היא activity מתועדת עם retry policy ו-timeout משלה, והאישור הוא signal או task token עם timer של תוקף. אחרי קריסה worker אחר משחזר את ההיסטוריה וממשיך מהצעד הראשון שלא הושלם, בלי לשלם שוב על קריאות מודל שהסתיימו. Payloads גדולים הולכים ל-S3 כמצביע. Tools עם side effects משתמשים ב-idempotency keys שנגזרים מהריצה, מהצעד ומה-tool_call_id, כי ה-engine יעשה להם retry. ה-UI מתחבר ל-stream של events עם מספרי רצף, כך שהוא יכול להתחבר מחדש ולשחזר." }
    },
    {
      q: { en: "How do you isolate tenants when agents can execute code and browse?", he: "איך מבודדים tenants כש-agents יכולים להריץ קוד ולגלוש?" },
      a: { en: "Assume the agent is compromised. Code runs in a per-run sandbox with a separate kernel (gVisor or a Firecracker/Kata microVM), never shared across tenants, with CPU, memory, time and disk limits, destroyed after the run. Egress is default-deny: no metadata endpoint, no VPC; browsing goes through an allowlisting, logging proxy. Credentials are per user and short-lived via token exchange or AssumeRole with session tags, and tools take tenant identity from the authenticated context. Add per-tenant concurrency and token budgets against noisy neighbours, and audit every tool call.", he: "מניחים שה-agent נפרץ. קוד רץ ב-sandbox לכל ריצה עם kernel נפרד (gVisor או microVM של Firecracker או Kata), אף פעם לא משותף בין tenants, עם מגבלות CPU, זיכרון, זמן ודיסק, ונהרס אחרי הריצה. Egress חסום כברירת מחדל: אין metadata endpoint ואין VPC, וגלישה עוברת דרך proxy עם allowlist ו-logging. Credentials הם לכל משתמש וקצרי מועד, דרך token exchange או AssumeRole עם session tags, וה-tools לוקחים את ה-identity של ה-tenant מה-context המאומת. מוסיפים concurrency ותקציבי token-ים לכל tenant נגד שכנים רועשים, ו-audit לכל קריאה ל-tool." }
    }
  ],
  quiz: [
    {
      q: { en: "The model returns two tool_calls in one response. What must the next request contain?", he: "המודל מחזיר שני tool_calls בתשובה אחת. מה הבקשה הבאה חייבת להכיל?" },
      options: [
        { en: "One user message with both results concatenated", he: "הודעת user אחת עם שתי התוצאות מחוברות" },
        { en: "The assistant message with the calls, then one tool message per call with the matching tool_call_id", he: "את הודעת ה-assistant עם הקריאות, ואחריה הודעת tool אחת לכל קריאה עם ה-tool_call_id המתאים" },
        { en: "Only the result of the first call", he: "רק את התוצאה של הקריאה הראשונה" },
        { en: "Nothing: the provider runs the tools itself", he: "כלום: ה-provider מריץ את ה-tools בעצמו" }
      ],
      answer: 1,
      explain: { en: "Every tool call needs a tool result tied to its id, after the assistant message that issued it; otherwise the provider rejects the conversation.", he: "כל tool call צריך תוצאה שקשורה ל-id שלו, אחרי הודעת ה-assistant שיצרה אותו. אחרת ה-provider דוחה את השיחה." }
    },
    {
      q: { en: "60 tools averaging 300 tokens each are sent on every step of a 20-step run. Roughly how many input tokens go to tool definitions alone?", he: "60 tools של 300 token-ים בממוצע נשלחים בכל צעד בריצה של 20 צעדים. בערך כמה token-ים של input הולכים רק על הגדרות ה-tools?" },
      options: [
        { en: "18k", he: "18k" },
        { en: "36k", he: "36k" },
        { en: "360k", he: "360k" },
        { en: "6k", he: "6k" }
      ],
      answer: 2,
      explain: { en: "60 x 300 = 18k per step, x 20 steps = 360k. That is why agents get curated or dynamically loaded toolsets.", he: "60 כפול 300 זה 18k לצעד, כפול 20 צעדים זה 360k. בגלל זה נותנים ל-agents סט tools מאוצר או נטען דינמית." }
    },
    {
      q: { en: "Where should the tenant_id used by a data-access tool come from?", he: "מאיפה צריך להגיע ה-tenant_id שבו משתמש tool של גישה לנתונים?" },
      options: [
        { en: "From the model's tool arguments", he: "מהארגומנטים שהמודל שלח ל-tool" },
        { en: "From the system prompt text", he: "מהטקסט של ה-system prompt" },
        { en: "From the authenticated run context set by the runtime", he: "מה-context המאומת של הריצה שה-runtime קבע" },
        { en: "From long-term memory", he: "מהזיכרון לטווח ארוך" }
      ],
      answer: 2,
      explain: { en: "Anything the model emits can be steered by injected content. Identity and authorization come from the server-side context only.", he: "כל מה שהמודל מוציא יכול להיות מוטה ע\"י תוכן מוזרק. Identity והרשאות מגיעים רק מה-context בצד השרת." }
    },
    {
      q: { en: "Why is a standard container not enough for running model-generated code from untrusted inputs?", he: "למה container רגיל לא מספיק להרצת קוד שהמודל יצר מקלט לא אמין?" },
      options: [
        { en: "Containers can't run Python", he: "Containers לא יכולים להריץ Python" },
        { en: "Containers are too slow to start", he: "Containers עולים לאט מדי" },
        { en: "Kubernetes forbids it", he: "Kubernetes אוסר את זה" },
        { en: "It shares the host kernel, so a kernel exploit or misconfiguration escapes to the node", he: "הוא חולק את ה-kernel של ה-host, אז exploit ב-kernel או הגדרה שגויה בורחים ל-node" }
      ],
      answer: 3,
      explain: { en: "gVisor puts a user-space kernel in between; microVMs give each sandbox its own kernel under KVM. Both shrink the shared attack surface.", he: "gVisor שם kernel ב-user space באמצע, ו-microVMs נותנים לכל sandbox kernel משלו מעל KVM. שניהם מקטינים את משטח התקיפה המשותף." }
    }
  ],
  related: ["ai-agents-patterns", "ai-agent-infra-mcp", "ai-mcp-servers", "arch-durable-execution", "pr-idempotency", "pr-tenant-isolation-deep", "ai-security-practice", "ai-agent-evals"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "ai-agent-evals",
  track: "ai",
  order: 12,
  icon: "🧪",
  level: 3,
  minutes: 18,
  title: { en: "Evaluating Agents: Offline, Online and in CI", he: "Evals ל-agents: offline, online וב-CI" },
  tldr: {
    en: "Agent evals grade tasks, not answers: run each task in a reproducible environment, check the final state with code, score the trajectory (right tools, right arguments, steps, cost), and use calibrated LLM judges only where code can't decide. Agents are stochastic, so repeat runs, report confidence intervals and pass^k, and compare versions on paired tasks. Gate CI on regressions, and close the loop with online sampling and user feedback that feed new cases back into the dataset.",
    he: "Evals ל-agents בודקים משימות, לא תשובות: מריצים כל משימה בסביבה שאפשר לשחזר, בודקים את המצב הסופי בקוד, נותנים ציון ל-trajectory (tools נכונים, ארגומנטים נכונים, צעדים, עלות), ומשתמשים ב-LLM judges מכוילים רק איפה שקוד לא יכול להכריע. Agents הם סטוכסטיים, אז חוזרים על ריצות, מדווחים confidence intervals ו-pass^k, ומשווים גרסאות על אותן משימות בזוגות. חוסמים ב-CI על רגרסיות, וסוגרים את המעגל עם דגימה online ו-feedback של משתמשים שמזינים מקרים חדשים חזרה ל-dataset."
  },
  analogy: {
    en: "Testing a single prompt is grading an essay. Testing an agent is a driving test: the examiner cares whether you arrived (final state), whether you ran a red light on the way (forbidden tool calls), how long and how much fuel it took (steps, cost), and whether you'd pass again tomorrow in the rain (repeat runs). One lucky drive proves very little.",
    he: "לבדוק prompt בודד זה כמו לבדוק חיבור. לבדוק agent זה טסט נהיגה: הבוחן רוצה לדעת אם הגעת (המצב הסופי), אם עברת באדום בדרך (tool calls אסורים), כמה זמן ודלק זה לקח (צעדים ועלות), והאם תעבור שוב מחר בגשם (ריצות חוזרות). נסיעה אחת עם מזל מוכיחה מעט מאוד."
  },
  sections: [
    {
      h: { en: "Why agent evals are different", he: "למה evals ל-agents שונים" },
      body: {
        en: `<p>A chat eval has one input and one output. An agent run has a <strong>trajectory</strong> (a sequence of model calls, tool calls and results) and <strong>side effects</strong> in an environment. That changes what you measure and how you run it:</p>
<ul>
<li><strong>The environment is part of the test</strong>: each task needs a seeded state (a database with order A-17, a fixture repo, a mocked CRM) that is reset per trial. Without it you can't check outcomes or reproduce failures.</li>
<li><strong>Many correct paths</strong>: two agents can solve the same task with different tool orders. Exact-match on the trajectory is brittle; grade the end state first and constrain the path only where it matters (must call <code>verify_identity</code> before <code>issue_refund</code>; must never call <code>delete_account</code>).</li>
<li><strong>Errors compound</strong>: if each step is right 95% of the time, a 10-step task succeeds about 0.95^10 ≈ 60% of the time. Small per-step regressions become large task-level ones.</li>
<li><strong>Three levels of test</strong>, like a test pyramid: <em>step evals</em> (given this exact state, does the model pick the right tool with the right arguments; fast and cheap), <em>trajectory evals</em> (full run with mocked tools), <em>end-to-end evals</em> (full run against a sandboxed real environment; slow, closest to production).</li>
</ul>
<p>Basics of evals and judges are in <a href="#/lesson/ai-llmops">LLMOps in Production</a> and the outcome-vs-trajectory overview in <a href="#/lesson/ai-agents-patterns">Agent Patterns</a>. This lesson is how to build an eval system you can gate releases on.</p>`,
        he: `<p>ל-eval של chat יש קלט אחד ופלט אחד. לריצת agent יש <strong>trajectory</strong> (רצף של קריאות למודל, קריאות ל-tools ותוצאות) ו-<strong>side effects</strong> בסביבה. זה משנה מה מודדים ואיך מריצים:</p>
<ul>
<li><strong>הסביבה היא חלק מהבדיקה</strong>: כל משימה צריכה state התחלתי (database עם הזמנה A-17, repo של fixtures, CRM מדומה) שמתאפס בכל ניסיון. בלי זה אי אפשר לבדוק תוצאות או לשחזר כשלים.</li>
<li><strong>הרבה מסלולים נכונים</strong>: שני agents יכולים לפתור את אותה משימה עם סדר tools שונה. התאמה מדויקת של ה-trajectory שבירה. בודקים קודם את המצב הסופי, ומגבילים את המסלול רק איפה שזה חשוב (חייב לקרוא ל-<code>verify_identity</code> לפני <code>issue_refund</code>, ואסור אף פעם לקרוא ל-<code>delete_account</code>).</li>
<li><strong>שגיאות מצטברות</strong>: אם כל צעד נכון ב-95% מהמקרים, משימה של 10 צעדים מצליחה בערך ב-0.95 בחזקת 10, כלומר בערך 60%. רגרסיות קטנות ברמת הצעד הופכות לגדולות ברמת המשימה.</li>
<li><strong>שלוש רמות בדיקה</strong>, כמו פירמידת טסטים: <em>step evals</em> (בהינתן state מדויק, האם המודל בוחר את ה-tool הנכון עם הארגומנטים הנכונים. מהיר וזול), <em>trajectory evals</em> (ריצה מלאה עם tools מדומים), ו-<em>end-to-end evals</em> (ריצה מלאה מול סביבה אמיתית ב-sandbox. איטי, והכי קרוב לפרודקשן).</li>
</ul>
<p>היסודות של evals ו-judges נמצאים ב-<a href="#/lesson/ai-llmops">LLMOps in Production</a>, והסקירה של outcome מול trajectory נמצאת ב-<a href="#/lesson/ai-agents-patterns">Agent Patterns</a>. השיעור הזה עוסק באיך בונים מערכת evals שאפשר לחסום עליה releases.</p>`
      }
    },
    {
      h: { en: "Building the dataset from production traces", he: "בניית ה-dataset מ-traces של פרודקשן" },
      body: {
        en: `<p>Hand-written tasks get you started (30-100 cases covering the main intents). After launch, production traces are the best source, because they contain the phrasing, the edge cases and the failures you didn't imagine.</p>
<ul>
<li><strong>Mine failures, not averages</strong>: thumbs-down, user retries and rephrasings, escalations to a human, budget-exceeded runs, tool-error spikes, guardrail hits, and every bug report. A random sample mostly repeats easy cases.</li>
<li><strong>Turn a trace into a task</strong>: extract the user goal and the initial state; record the tool responses from that run so the task can be replayed with mocks; write the expected end state (or a rubric) by hand; redact PII before it enters the dataset, and keep tenant data out of shared datasets unless the contract allows it.</li>
<li><strong>Stratify and tag</strong>: intent, difficulty, language (Hebrew and English behave differently), tenant tier, risky-tool involvement, adversarial content (injected instructions inside tool results). Report metrics per slice; an overall average hides a broken slice.</li>
<li><strong>Split by purpose</strong>: a <em>regression set</em> (must keep passing, gates CI), a <em>capability set</em> (hard tasks you are trying to improve; low pass rate is expected), a <em>held-out set</em> you don't tune prompts against, to catch overfitting.</li>
<li><strong>Version everything</strong>: dataset, environment fixtures, grader code and judge prompts live in git (or a versioned dataset store). A score only means something together with the versions that produced it.</li>
</ul>
<pre># Pull last week's failed runs from the trace store and draft eval cases (Python)
runs = traces.query(agent="support", since="7d",
                    where="feedback = 'down' OR status IN ('budget_exceeded','escalated')")
for r in sample_stratified(runs, by=["intent", "lang"], n=60):
    case = {
        "id": f"support-{r.run_id[:8]}",
        "task": redact(r.user_goal),
        "initial_state": snapshot_fixture(r.tenant_tier, r.entities),   # synthetic, no real PII
        "recorded_tools": redact(r.tool_results),                      # for replay mode
        "expected": None,                                              # filled by a human reviewer
        "tags": [r.intent, r.lang, "from-prod", r.failure_kind],
    }
    write_jsonl("datasets/support/candidates.jsonl", case)</pre>`,
        he: `<p>משימות שנכתבו ביד מספיקות כדי להתחיל (30 עד 100 מקרים שמכסים את הכוונות העיקריות). אחרי ה-launch, ה-traces מפרודקשן הם המקור הכי טוב, כי יש בהם את הניסוחים, את מקרי הקצה ואת הכשלים שלא דמיינת.</p>
<ul>
<li><strong>כורים כשלים, לא ממוצעים</strong>: thumbs-down, משתמשים שמנסחים מחדש ומנסים שוב, הסלמות לנציג אנושי, ריצות שחרגו מתקציב, קפיצות בשגיאות של tools, הפעלות של guardrails, וכל דיווח באג. דגימה אקראית בעיקר חוזרת על מקרים קלים.</li>
<li><strong>הופכים trace למשימה</strong>: מחלצים את המטרה של המשתמש ואת ה-state ההתחלתי, מקליטים את התשובות של ה-tools מאותה ריצה כדי שאפשר יהיה לשחזר עם mocks, כותבים ביד את המצב הסופי הצפוי (או rubric), משחירים PII לפני שזה נכנס ל-dataset, ולא מכניסים מידע של tenants ל-datasets משותפים אלא אם החוזה מתיר.</li>
<li><strong>שכבות ותגיות</strong>: כוונה, רמת קושי, שפה (עברית ואנגלית מתנהגות אחרת), tier של tenant, מעורבות של tools מסוכנים, ותוכן עוין (הוראות מוזרקות בתוך תוצאות של tools). מדווחים metrics לכל פרוסה. ממוצע כללי מסתיר פרוסה שבורה.</li>
<li><strong>מחלקים לפי מטרה</strong>: <em>regression set</em> (חייב להמשיך לעבור, חוסם ב-CI), <em>capability set</em> (משימות קשות שמנסים לשפר, ושיעור הצלחה נמוך הוא צפוי), ו-<em>held-out set</em> שלא מכווננים מולו prompts, כדי לתפוס overfitting.</li>
<li><strong>מנהלים גרסאות להכול</strong>: ה-dataset, ה-fixtures של הסביבה, קוד ה-graders וה-prompts של ה-judges יושבים ב-git (או ב-store של datasets עם גרסאות). לציון יש משמעות רק יחד עם הגרסאות שיצרו אותו.</li>
</ul>
<pre># Pull last week's failed runs from the trace store and draft eval cases (Python)
runs = traces.query(agent="support", since="7d",
                    where="feedback = 'down' OR status IN ('budget_exceeded','escalated')")
for r in sample_stratified(runs, by=["intent", "lang"], n=60):
    case = {
        "id": f"support-{r.run_id[:8]}",
        "task": redact(r.user_goal),
        "initial_state": snapshot_fixture(r.tenant_tier, r.entities),   # synthetic, no real PII
        "recorded_tools": redact(r.tool_results),                      # for replay mode
        "expected": None,                                              # filled by a human reviewer
        "tags": [r.intent, r.lang, "from-prod", r.failure_kind],
    }
    write_jsonl("datasets/support/candidates.jsonl", case)</pre>`
      }
    },
    {
      h: { en: "Graders: code first, calibrated judges second", he: "Graders: קודם קוד, אחר כך judges מכוילים" },
      body: {
        en: `<p><strong>Code graders</strong> are cheap, deterministic and should carry most of the weight:</p>
<ul>
<li><em>Final-state checks</em>: query the sandbox DB after the run. Is there exactly one refund row of $42 for order A-17? Did the ticket move to <code>resolved</code> with label <code>damaged</code>?</li>
<li><em>Trajectory constraints</em>: required tools were called; forbidden tools never were; ordering rules hold; no tool was called with arguments outside policy; no more than N steps.</li>
<li><em>Tool-call accuracy</em>: compare emitted calls to expected ones with normalization (case, whitespace, number formats, order of independent calls). Report precision (calls that were correct) and recall (expected calls that happened) separately.</li>
<li><em>Format</em>: output parses as JSON and validates against its schema; citations point to real retrieved documents.</li>
</ul>
<p><strong>LLM-as-judge</strong> for what code can't decide (tone, helpfulness, faithfulness of a summary to the tool results):</p>
<ul>
<li>Use a <strong>rubric of binary criteria</strong> ("states the refund amount", "does not promise a delivery date", "answers in the user's language") instead of a 1-10 score. Binary checks are more consistent and easier to debug.</li>
<li><strong>Calibrate against humans</strong>: have people label 100-200 outputs, run the judge on the same items, and measure agreement (Cohen's kappa, plus the judge's true-positive and true-negative rates per criterion). Many teams want kappa around 0.7 or higher before a judge may gate a release. Re-check whenever the judge model or prompt changes.</li>
<li><strong>Pairwise</strong> (A vs B, which is better?) is more sensitive than absolute scores for comparing two versions. Run both orders and count only consistent wins, to cancel position bias.</li>
<li>Pin the judge model version, use a different model family from the agent where possible (self-preference bias), and budget for it: judges can cost as much as the runs.</li>
</ul>
<pre># Final-state + trajectory grader for one task (Python)
def grade(run, db):
    refunds = db.query("SELECT amount FROM refunds WHERE order_id = 'A-17'")
    calls = [c.name for c in run.tool_calls]
    checks = {
        "one_refund_42":      [r.amount for r in refunds] == [42.00],
        "verified_first":     "verify_identity" in calls and
                              calls.index("verify_identity") &lt; calls.index("issue_refund"),
        "no_forbidden_tools": not {"delete_account", "change_email"} &amp; set(calls),
        "within_steps":       run.steps &lt;= 12,
    }
    return {"pass": all(checks.values()), "checks": checks, "cost": run.cost_usd}</pre>`,
        he: `<p><strong>Graders בקוד</strong> זולים, דטרמיניסטיים, והם צריכים לשאת את רוב המשקל:</p>
<ul>
<li><em>בדיקות של המצב הסופי</em>: שואלים את ה-DB של ה-sandbox אחרי הריצה. יש בדיוק שורת החזר אחת של $42 להזמנה A-17? הטיקט עבר ל-<code>resolved</code> עם התווית <code>damaged</code>?</li>
<li><em>אילוצים על ה-trajectory</em>: ה-tools הנדרשים נקראו, ה-tools האסורים אף פעם לא נקראו, כללי הסדר מתקיימים, אף tool לא נקרא עם ארגומנטים מחוץ ל-policy, ולא יותר מ-N צעדים.</li>
<li><em>Tool-call accuracy</em>: משווים את הקריאות שיצאו לקריאות הצפויות, עם נרמול (אותיות גדולות וקטנות, רווחים, פורמט מספרים, סדר של קריאות בלתי תלויות). מדווחים בנפרד precision (כמה מהקריאות היו נכונות) ו-recall (כמה מהקריאות הצפויות קרו).</li>
<li><em>פורמט</em>: הפלט עובר parse כ-JSON ומאומת מול הסכמה שלו, וה-citations מצביעים על מסמכים שבאמת נשלפו.</li>
</ul>
<p><strong>LLM-as-judge</strong> רק למה שקוד לא יכול להכריע (טון, מועילות, נאמנות של סיכום לתוצאות ה-tools):</p>
<ul>
<li>משתמשים ב-<strong>rubric של קריטריונים בינאריים</strong> ("מציין את סכום ההחזר", "לא מבטיח תאריך משלוח", "עונה בשפה של המשתמש") במקום ציון 1 עד 10. בדיקות בינאריות עקביות יותר וקל יותר לדבג אותן.</li>
<li><strong>מכיילים מול בני אדם</strong>: אנשים מתייגים 100 עד 200 פלטים, מריצים את ה-judge על אותם פריטים, ומודדים הסכמה (Cohen's kappa, ועוד שיעורי true-positive ו-true-negative של ה-judge לכל קריטריון). הרבה צוותים רוצים kappa של בערך 0.7 ומעלה לפני שנותנים ל-judge לחסום release. בודקים מחדש בכל פעם שהמודל או ה-prompt של ה-judge משתנים.</li>
<li><strong>Pairwise</strong> (A מול B, מי יותר טוב?) רגיש יותר מציונים מוחלטים כשמשווים שתי גרסאות. מריצים בשני הסדרים וסופרים רק ניצחונות עקביים, כדי לנטרל position bias.</li>
<li>נועלים את הגרסה של מודל ה-judge, משתמשים כשאפשר במשפחת מודלים שונה מזו של ה-agent (בגלל self-preference bias), ומתקצבים את זה: judges יכולים לעלות כמו הריצות עצמן.</li>
</ul>
<pre># Final-state + trajectory grader for one task (Python)
def grade(run, db):
    refunds = db.query("SELECT amount FROM refunds WHERE order_id = 'A-17'")
    calls = [c.name for c in run.tool_calls]
    checks = {
        "one_refund_42":      [r.amount for r in refunds] == [42.00],
        "verified_first":     "verify_identity" in calls and
                              calls.index("verify_identity") &lt; calls.index("issue_refund"),
        "no_forbidden_tools": not {"delete_account", "change_email"} &amp; set(calls),
        "within_steps":       run.steps &lt;= 12,
    }
    return {"pass": all(checks.values()), "checks": checks, "cost": run.cost_usd}</pre>`
      }
    },
    {
      h: { en: "Metrics and statistics: non-determinism is the default", he: "Metrics וסטטיסטיקה: חוסר דטרמיניזם הוא ברירת המחדל" },
      body: {
        en: `<table>
<tr><th>Metric</th><th>Definition</th><th>Why</th></tr>
<tr><td>Task success</td><td>Share of trials whose final-state checks pass</td><td>The primary metric</td></tr>
<tr><td>pass^k</td><td>Share of tasks that pass in <em>all</em> k trials</td><td>What a user experiences; per-trial 0.9 gives pass^5 ≈ 0.59</td></tr>
<tr><td>Tool-call precision / recall</td><td>Correct calls / all calls; expected calls made / expected</td><td>Finds wrong or missing tool use even when the answer looks fine</td></tr>
<tr><td>Steps, tokens, $ per task (p50/p95)</td><td>From the trajectory</td><td>Two versions with equal success can differ several-fold in cost</td></tr>
<tr><td>Latency (p50/p95 wall-clock)</td><td>Run start to final answer</td><td>Agents regress on latency silently</td></tr>
<tr><td>Safety</td><td>Forbidden-tool rate, injection-resistance pass rate</td><td>Must-pass, usually zero tolerance</td></tr>
</table>
<p><strong>How big is the noise?</strong> With 200 tasks and an 80% success rate, the standard error is √(0.8 × 0.2 / 200) ≈ 2.8 points, so the 95% confidence interval is about ±5.5 points. A "drop from 81% to 78%" on 200 independent tasks is noise. Two ways to see real changes:</p>
<ul>
<li><strong>Repeat trials</strong> (k = 3-5 per task) and average per task; this also gives you pass^k.</li>
<li><strong>Paired comparison</strong>: run old and new versions on the same tasks and look only at tasks where they disagree. McNemar's test: if 18 tasks pass only on the old version and 6 only on the new one, χ² = (|18 - 6| - 1)² / (18 + 6) ≈ 5.0 &gt; 3.84, so the regression is significant at p &lt; 0.05. Paired designs detect much smaller changes than comparing two independent averages.</li>
</ul>
<p>Measure the noise floor too: run the <em>same</em> version twice. If two identical runs differ by 4 points, a 3-point gate will flap.</p>`,
        he: `<table>
<tr><th>Metric</th><th>הגדרה</th><th>למה</th></tr>
<tr><td>Task success</td><td>חלק הניסיונות שבהם בדיקות המצב הסופי עוברות</td><td>ה-metric הראשי</td></tr>
<tr><td>pass^k</td><td>חלק המשימות שעוברות ב<em>כל</em> k הניסיונות</td><td>מה שהמשתמש חווה. 0.9 לניסיון נותן pass^5 של בערך 0.59</td></tr>
<tr><td>Tool-call precision ו-recall</td><td>קריאות נכונות מתוך כל הקריאות, וקריאות צפויות שקרו מתוך הצפויות</td><td>מוצא שימוש שגוי או חסר ב-tools גם כשהתשובה נראית בסדר</td></tr>
<tr><td>צעדים, token-ים ודולרים למשימה (p50 ו-p95)</td><td>מתוך ה-trajectory</td><td>שתי גרסאות עם אותה הצלחה יכולות להיות שונות פי כמה בעלות</td></tr>
<tr><td>Latency (זמן כולל ב-p50 וב-p95)</td><td>מתחילת הריצה עד התשובה הסופית</td><td>Agents נסוגים ב-latency בשקט</td></tr>
<tr><td>בטיחות</td><td>שיעור tools אסורים, שיעור עמידה ב-injection</td><td>Must-pass, בדרך כלל אפס סובלנות</td></tr>
</table>
<p><strong>כמה גדול הרעש?</strong> עם 200 משימות ו-80% הצלחה, ה-standard error הוא שורש של 0.8 כפול 0.2 חלקי 200, כלומר בערך 2.8 נקודות, אז ה-confidence interval של 95% הוא בערך פלוס מינוס 5.5 נקודות. "ירידה מ-81% ל-78%" על 200 משימות בלתי תלויות היא רעש. שתי דרכים לראות שינויים אמיתיים:</p>
<ul>
<li><strong>ניסיונות חוזרים</strong> (k בין 3 ל-5 לכל משימה) וממוצע לכל משימה. זה גם נותן לך pass^k.</li>
<li><strong>השוואה בזוגות</strong>: מריצים את הגרסה הישנה והחדשה על אותן משימות, ומסתכלים רק על המשימות שבהן הן לא מסכימות. מבחן McNemar: אם 18 משימות עוברות רק בגרסה הישנה ו-6 רק בחדשה, אז χ² = (|18 - 6| - 1)² / (18 + 6), בערך 5.0, שזה יותר מ-3.84, אז הרגרסיה מובהקת ב-p &lt; 0.05. תכנון בזוגות מזהה שינויים קטנים בהרבה מהשוואה של שני ממוצעים בלתי תלויים.</li>
</ul>
<p>מודדים גם את רצפת הרעש: מריצים את <em>אותה</em> גרסה פעמיים. אם שתי ריצות זהות שונות ב-4 נקודות, gate של 3 נקודות יהבהב.</p>`
      }
    },
    {
      h: { en: "Gating in CI", he: "Gating ב-CI" },
      body: {
        en: `<p>Tier the suites by cost and speed, like any test strategy (<a href="#/lesson/pr-test-strategy">Test Strategy</a>):</p>
<table>
<tr><th>Tier</th><th>When</th><th>Size</th><th>Mode</th><th>Budget</th></tr>
<tr><td>Smoke</td><td>Every PR touching prompts, tools, model aliases or agent code</td><td>30-50 tasks, k=1</td><td>Step evals + replayed (mocked) tools</td><td>&lt; 10 min, a few dollars</td></tr>
<tr><td>Regression</td><td>Merge to main / nightly</td><td>300-500 tasks, k=3</td><td>Sandboxed environment, judges on</td><td>&lt; 1 h, tens of dollars</td></tr>
<tr><td>Release</td><td>Before a model or major prompt change ships</td><td>Full + held-out + safety suite, k=5</td><td>Paired vs current production</td><td>Hours, planned spend</td></tr>
</table>
<p><strong>Gate rules that don't flap</strong>: (1) every <em>must-pass</em> case passes (safety, forbidden tools, critical flows); (2) no statistically significant drop in task success on the paired comparison; (3) cost and p95 latency per task within, say, +15% of baseline; (4) no slice drops more than a set threshold. Post the diff table to the PR, with links to the failing trajectories.</p>
<pre># promptfooconfig.yaml: the agent runs through a custom provider; graders are code + a rubric judge
description: support-agent regression
providers:
  - id: file://evals/support/agent_provider.py     # runs the loop in a sandbox, returns answer + trajectory
prompts: ["{{task}}"]
defaultTest:
  options:
    provider: { id: "openai:chat:chat-judge", config: { apiBaseUrl: "https://llm-gw.internal/v1" } }
tests: file://evals/support/regression.jsonl
  # each case: vars.task plus asserts, for example
  #   - type: javascript   value: file://evals/support/graders/final_state.js
  #   - type: llm-rubric   value: "States the refund amount; does not promise a delivery date"
  #   - type: cost         threshold: 0.50
  #   - type: latency      threshold: 60000</pre>`,
        he: `<p>מחלקים את ה-suites לשכבות לפי עלות ומהירות, כמו כל אסטרטגיית טסטים (<a href="#/lesson/pr-test-strategy">Test Strategy</a>):</p>
<table>
<tr><th>שכבה</th><th>מתי</th><th>גודל</th><th>מצב</th><th>תקציב</th></tr>
<tr><td>Smoke</td><td>כל PR שנוגע ב-prompts, ב-tools, ב-aliases של מודלים או בקוד של ה-agent</td><td>30 עד 50 משימות, k=1</td><td>Step evals ו-tools משוחזרים (mocks)</td><td>פחות מ-10 דקות, כמה דולרים</td></tr>
<tr><td>Regression</td><td>Merge ל-main או לילי</td><td>300 עד 500 משימות, k=3</td><td>סביבה ב-sandbox, judges פעילים</td><td>פחות משעה, עשרות דולרים</td></tr>
<tr><td>Release</td><td>לפני שמודל או שינוי prompt גדול יוצאים</td><td>הכול, ועוד held-out ו-suite של בטיחות, k=5</td><td>השוואה בזוגות מול מה שבפרודקשן</td><td>שעות, הוצאה מתוכננת</td></tr>
</table>
<p><strong>כללי gate שלא מהבהבים</strong>: (1) כל מקרה <em>must-pass</em> עובר (בטיחות, tools אסורים, flows קריטיים). (2) אין ירידה מובהקת סטטיסטית ב-task success בהשוואה בזוגות. (3) עלות ו-latency ב-p95 למשימה בטווח של, נגיד, עד 15% מעל ה-baseline. (4) אף פרוסה לא יורדת יותר מסף שנקבע. מפרסמים את טבלת ההבדלים ב-PR, עם לינקים ל-trajectories שנכשלו.</p>
<pre># promptfooconfig.yaml: the agent runs through a custom provider; graders are code + a rubric judge
description: support-agent regression
providers:
  - id: file://evals/support/agent_provider.py     # runs the loop in a sandbox, returns answer + trajectory
prompts: ["{{task}}"]
defaultTest:
  options:
    provider: { id: "openai:chat:chat-judge", config: { apiBaseUrl: "https://llm-gw.internal/v1" } }
tests: file://evals/support/regression.jsonl
  # each case: vars.task plus asserts, for example
  #   - type: javascript   value: file://evals/support/graders/final_state.js
  #   - type: llm-rubric   value: "States the refund amount; does not promise a delivery date"
  #   - type: cost         threshold: 0.50
  #   - type: latency      threshold: 60000</pre>`
      }
    },
    {
      h: { en: "Online evals and the feedback flywheel; tools", he: "Online evals וגלגל ה-feedback; כלים" },
      body: {
        en: `<p>Offline suites only cover what you thought of. In production:</p>
<ul>
<li><strong>Sampled online grading</strong>: score 1-5% of production trajectories asynchronously with the same code checks and judges (never in the request path). Sample more heavily from new versions, rare intents and high-value tenants.</li>
<li><strong>Explicit and implicit feedback</strong>: thumbs up/down and comments; implicit signals are often stronger: the user rephrases and retries, edits the agent's draft heavily, abandons the session, or asks for a human.</li>
<li><strong>Operational signals</strong>: guardrail hits, tool error rate, budget-exceeded rate, approval rejection rate (humans rejecting the agent's proposed action is a quality signal), cost per successful task.</li>
<li><strong>Rollouts</strong>: shadow runs (new version runs on copied traffic, no side effects, outputs graded) and canaries (5% of tenants) with automatic rollback on success-rate or cost alerts. Tie this to the feature-flag system (<a href="#/lesson/arch-feature-flags">Feature Flags</a>).</li>
<li><strong>The flywheel</strong>: online failures are triaged weekly, turned into dataset cases, fixed, and the case joins the regression set. The dataset grows exactly where the product breaks.</li>
</ul>
<p><strong>Tooling landscape</strong> (pick by fit, many teams combine two): open-source CLI eval runners that live in the repo and CI (promptfoo is a common example; YAML config, code and rubric assertions, repeat runs); model providers' own eval APIs and graders; and LLM observability platforms with tracing, datasets, annotation queues, online scoring and experiment comparison (Langfuse and Arize Phoenix are open source and self-hostable; LangSmith and Braintrust are commercial with self-hosting options for enterprises). Criteria: OpenTelemetry ingestion, data residency, agent-trajectory support, CI integration, human-labeling workflow, cost.</p>`,
        he: `<p>Suites של offline מכסים רק את מה שחשבת עליו. בפרודקשן:</p>
<ul>
<li><strong>ציון online בדגימה</strong>: נותנים ציון ל-1 עד 5 אחוז מה-trajectories בפרודקשן, אסינכרונית, עם אותן בדיקות קוד ואותם judges (אף פעם לא במסלול הבקשה). דוגמים יותר מגרסאות חדשות, מכוונות נדירות ומ-tenants בעלי ערך גבוה.</li>
<li><strong>Feedback מפורש ומרומז</strong>: thumbs up או down והערות. הסיגנלים המרומזים הרבה פעמים חזקים יותר: המשתמש מנסח מחדש ומנסה שוב, עורך בכבדות את הטיוטה של ה-agent, נוטש את ה-session, או מבקש נציג אנושי.</li>
<li><strong>סיגנלים תפעוליים</strong>: הפעלות של guardrails, שיעור שגיאות של tools, שיעור חריגות תקציב, שיעור דחיית אישורים (בני אדם שדוחים פעולה שה-agent הציע זה סיגנל איכות), ועלות למשימה מוצלחת.</li>
<li><strong>Rollouts</strong>: ריצות shadow (הגרסה החדשה רצה על תעבורה מועתקת, בלי side effects, והפלטים מקבלים ציון) ו-canaries (5% מה-tenants) עם rollback אוטומטי על התראות של שיעור הצלחה או עלות. מחברים את זה למערכת ה-feature flags (<a href="#/lesson/arch-feature-flags">Feature Flags</a>).</li>
<li><strong>גלגל התנופה</strong>: כשלים מ-online עוברים triage שבועי, הופכים למקרים ב-dataset, מתוקנים, והמקרה מצטרף ל-regression set. ה-dataset גדל בדיוק איפה שהמוצר נשבר.</li>
</ul>
<p><strong>מפת הכלים</strong> (בוחרים לפי התאמה, והרבה צוותים משלבים שניים): כלי CLI בקוד פתוח להרצת evals שחיים ב-repo וב-CI (promptfoo הוא דוגמה נפוצה: config ב-YAML, assertions בקוד וב-rubric, ריצות חוזרות), ה-APIs וה-graders של ה-evals אצל ספקי המודלים עצמם, ופלטפורמות observability ל-LLM עם tracing, datasets, תורי תיוג, ציון online והשוואת ניסויים (Langfuse ו-Arize Phoenix בקוד פתוח ואפשר להריץ אותן בעצמך, LangSmith ו-Braintrust מסחריות עם אפשרויות self-hosting לארגונים). הקריטריונים: קליטת OpenTelemetry, data residency, תמיכה ב-trajectories של agents, אינטגרציה ל-CI, תהליך תיוג אנושי ועלות.</p>`
      }
    }
  ],
  diagram: `prod traces --(failures, feedback, sampled 1-5%)--> triage --> dataset (git, versioned)
                                                                  |   regression / capability / held-out
                                                                  v
PR (prompt/tool/model change) --> CI smoke (30-50 tasks, mocks, k=1) --gate--> merge
merge/nightly --> regression (300-500 tasks, sandbox, k=3, judges) --paired diff--> report
release --> full + safety + held-out (k=5) vs prod --gate--> canary 5% --> online grading --> back to traces`,
  handsOn: [
    {
      cmd: `npx promptfoo@latest eval -c evals/support/promptfooconfig.yaml --repeat 3 -o out/support.json`,
      what: { en: "Run the agent regression suite with 3 trials per case, so you can compute per-task pass rates and pass^3 instead of trusting a single run.", he: "מריצים את suite הרגרסיה של ה-agent עם 3 ניסיונות לכל מקרה, כדי לחשב שיעור הצלחה לכל משימה ו-pass^3 במקום לסמוך על ריצה אחת." }
    },
    {
      cmd: `python - <<'EOF'
import math
p, n = 0.80, 200
se = math.sqrt(p*(1-p)/n); print(f"95% CI: +/-{1.96*se*100:.1f} pts")
b, c = 18, 6        # tasks passing only on old / only on new
chi2 = (abs(b-c)-1)**2/(b+c); print(f"McNemar chi2={chi2:.2f}  significant={chi2>3.84}")
print("pass^5 at p=0.9:", round(0.9**5, 2))
EOF`,
      what: { en: "The three numbers to have in your head: the noise band of a 200-task suite (about ±5.5 points), a paired McNemar test, and how fast pass^k decays.", he: "שלושת המספרים שצריך לזכור: רצועת הרעש של suite עם 200 משימות (בערך פלוס מינוס 5.5 נקודות), מבחן McNemar בזוגות, וכמה מהר pass^k דועך." }
    },
    {
      cmd: `jq -r '.results.results[] | select(.success==false) | [.vars.task[0:60], .gradingResult.reason[0:80]] | @tsv' out/support.json | head -20`,
      what: { en: "List failing cases with the grader's reason, the starting point for triage. Open the trajectory for each before blaming the model: many failures are broken fixtures or wrong expectations.", he: "רשימת המקרים שנכשלו עם הסיבה של ה-grader, נקודת ההתחלה ל-triage. פותחים את ה-trajectory של כל אחד לפני שמאשימים את המודל: הרבה כשלים הם fixtures שבורים או ציפיות שגויות." }
    }
  ],
  mnemonic: {
    en: "\"State, Path, Price, Repeat\": grade the final state, constrain the path, track the price, and repeat every run before you believe a number.",
    he: "\"מצב, מסלול, מחיר, שוב\": בודקים את המצב הסופי, מגבילים את המסלול, עוקבים אחרי המחיר, וחוזרים על כל ריצה לפני שמאמינים למספר."
  },
  pitfalls: [
    { en: "Grading only the final text. The answer says \"refund issued\" while the tool call failed or refunded the wrong order. Check the environment's end state with code.", he: "לבדוק רק את הטקסט הסופי. התשובה אומרת \"ההחזר בוצע\" בזמן שה-tool call נכשל או החזיר כסף על ההזמנה הלא נכונה. בודקים בקוד את המצב הסופי של הסביבה." },
    { en: "Single runs and unpaired averages. A 3-point swing on 200 tasks is inside the noise band, so the CI gate flaps and people learn to ignore it. Use repeats, paired comparisons and must-pass cases.", he: "ריצה אחת וממוצעים לא מזווגים. תנודה של 3 נקודות על 200 משימות נמצאת בתוך רצועת הרעש, אז ה-gate ב-CI מהבהב ואנשים לומדים להתעלם ממנו. משתמשים בריצות חוזרות, בהשוואה בזוגות ובמקרי must-pass." },
    { en: "Trusting an uncalibrated LLM judge. It prefers longer answers, its own model family and the first option. Calibrate against human labels and re-calibrate when the judge changes.", he: "לסמוך על LLM judge שלא כוילו. הוא מעדיף תשובות ארוכות, את משפחת המודלים שלו ואת האפשרות הראשונה. מכיילים מול תיוג אנושי, ומכיילים מחדש כשה-judge משתנה." },
    { en: "Tuning prompts against the whole dataset. Scores climb while production doesn't improve. Keep a held-out set and refresh the dataset from production traces.", he: "לכוונן prompts מול כל ה-dataset. הציונים עולים והפרודקשן לא משתפר. שומרים held-out set ומרעננים את ה-dataset מ-traces של פרודקשן." }
  ],
  interview: [
    {
      q: { en: "Your team wants to switch the agent to a newer model. How do you decide?", he: "הצוות רוצה להעביר את ה-agent למודל חדש יותר. איך מחליטים?" },
      a: { en: "Run the release tier: regression, held-out and safety suites with k=5 for both models on the same tasks in the same sandboxed environment. Compare paired: per-task success with McNemar or a bootstrap CI, pass^k, tool-call precision/recall, steps, cost and p95 latency per task, per slice (language, intent, tenant tier). All must-pass cases must pass. If it wins or ties within the noise band at acceptable cost, ship behind an alias change as a 5% canary with online grading and automatic rollback on success-rate or cost alerts, then ramp.", he: "מריצים את שכבת ה-release: suites של רגרסיה, held-out ובטיחות עם k=5 לשני המודלים, על אותן משימות ובאותה סביבת sandbox. משווים בזוגות: הצלחה לכל משימה עם McNemar או bootstrap CI, pass^k, precision ו-recall של tool calls, צעדים, עלות ו-latency ב-p95 לכל משימה, לכל פרוסה (שפה, כוונה, tier של tenant). כל מקרי ה-must-pass חייבים לעבור. אם המודל החדש מנצח או שווה בתוך רצועת הרעש בעלות סבירה, משחררים דרך שינוי alias כ-canary של 5% עם ציון online ו-rollback אוטומטי על התראות של הצלחה או עלות, ואז מגדילים." }
    },
    {
      q: { en: "How do you make an LLM-as-judge trustworthy enough to gate releases?", he: "איך הופכים LLM-as-judge לאמין מספיק כדי לחסום עליו releases?" },
      a: { en: "Narrow it: binary rubric criteria, only for things code can't check. Build a human-labeled set of 100-200 items, measure agreement per criterion (kappa, TPR/TNR) and iterate on the judge prompt until agreement is high (around 0.7+ kappa is a common bar). Pin the judge model version, prefer a different model family from the agent, swap order in pairwise comparisons, and re-calibrate on any judge change. Keep code checks as the primary gate and treat the judge as one signal among several.", he: "מצמצמים אותו: קריטריונים בינאריים ב-rubric, ורק לדברים שקוד לא יכול לבדוק. בונים סט עם תיוג אנושי של 100 עד 200 פריטים, מודדים הסכמה לכל קריטריון (kappa, TPR ו-TNR), ומשפרים את ה-prompt של ה-judge עד שההסכמה גבוהה (kappa של בערך 0.7 ומעלה הוא רף נפוץ). נועלים את הגרסה של מודל ה-judge, מעדיפים משפחת מודלים שונה מזו של ה-agent, מחליפים סדר בהשוואות pairwise, ומכיילים מחדש בכל שינוי של ה-judge. בדיקות הקוד נשארות ה-gate הראשי, וה-judge הוא סיגנל אחד מכמה." }
    }
  ],
  quiz: [
    {
      q: { en: "Each step of a 10-step task is correct 95% of the time, independently. What is the approximate task success rate?", he: "כל צעד במשימה של 10 צעדים נכון ב-95% מהמקרים, באופן בלתי תלוי. מה שיעור ההצלחה המשוער של המשימה?" },
      options: [
        { en: "95%", he: "95%" },
        { en: "About 60%", he: "בערך 60%" },
        { en: "About 85%", he: "בערך 85%" },
        { en: "50%", he: "50%" }
      ],
      answer: 1,
      explain: { en: "0.95^10 ≈ 0.60. Per-step errors compound, which is why small step-level regressions matter.", he: "0.95 בחזקת 10 זה בערך 0.60. שגיאות ברמת הצעד מצטברות, ובגלל זה רגרסיות קטנות ברמת הצעד חשובות." }
    },
    {
      q: { en: "A suite has 200 independent tasks at ~80% success. Version B scores 78% vs A's 81%. What can you conclude?", he: "ב-suite יש 200 משימות בלתי תלויות עם בערך 80% הצלחה. גרסה B מקבלת 78% מול 81% של A. מה אפשר להסיק?" },
      options: [
        { en: "B is clearly worse; block it", he: "B בבירור גרועה יותר, חוסמים" },
        { en: "B is better because it's newer", he: "B טובה יותר כי היא חדשה יותר" },
        { en: "Nothing yet: the 95% CI is about ±5.5 points; use repeats and a paired test", he: "עדיין כלום: ה-CI של 95% הוא בערך פלוס מינוס 5.5 נקודות. צריך ריצות חוזרות ומבחן בזוגות" },
        { en: "The judge is broken", he: "ה-judge שבור" }
      ],
      answer: 2,
      explain: { en: "√(0.8·0.2/200) ≈ 2.8 points standard error. A 3-point gap is within noise for independent samples.", he: "שורש של 0.8 כפול 0.2 חלקי 200 זה standard error של בערך 2.8 נקודות. פער של 3 נקודות נמצא בתוך הרעש לדגימות בלתי תלויות." }
    },
    {
      q: { en: "Which grader should carry most of the weight for 'refund the damaged order'?", he: "איזה grader צריך לשאת את רוב המשקל עבור \"להחזיר כסף על ההזמנה הפגומה\"?" },
      options: [
        { en: "A code check on the sandbox DB: exactly one refund of the right amount for the right order", he: "בדיקת קוד על ה-DB של ה-sandbox: בדיוק החזר אחד בסכום הנכון להזמנה הנכונה" },
        { en: "An LLM judge rating helpfulness 1-10", he: "LLM judge שנותן ציון מועילות 1 עד 10" },
        { en: "Exact string match on the final message", he: "התאמה מדויקת של מחרוזת בהודעה הסופית" },
        { en: "User thumbs-up rate", he: "שיעור ה-thumbs-up של משתמשים" }
      ],
      answer: 0,
      explain: { en: "The outcome is a state change; code can check it deterministically. Judges cover tone and faithfulness on top.", he: "התוצאה היא שינוי state, וקוד יכול לבדוק אותה בצורה דטרמיניסטית. Judges מכסים מעל זה טון ונאמנות." }
    },
    {
      q: { en: "Per-trial success is 0.9. What is pass^3?", he: "ההצלחה לניסיון היא 0.9. מה ה-pass^3?" },
      options: [
        { en: "0.999", he: "0.999" },
        { en: "0.9", he: "0.9" },
        { en: "0.27", he: "0.27" },
        { en: "About 0.73", he: "בערך 0.73" }
      ],
      answer: 3,
      explain: { en: "0.9^3 = 0.729. pass^k asks for success in every trial; 0.999 would be pass@3 (at least one success).", he: "0.9 בחזקת 3 זה 0.729. pass^k דורש הצלחה בכל הניסיונות. 0.999 זה pass@3 (לפחות הצלחה אחת)." }
    }
  ],
  related: ["ai-llmops", "ai-agents-patterns", "ai-agent-runtime", "ai-agent-infra-mcp", "pr-test-strategy", "arch-feature-flags", "pr-ai-systems-design"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "ai-platform-paved-road",
  track: "ai",
  order: 13,
  icon: "🛣️",
  level: 3,
  minutes: 17,
  title: { en: "A Paved Road for 100+ Engineers Shipping LLM Features", he: "Paved road ל-100+ מהנדסים שמשחררים פיצ'רים של LLM" },
  tldr: {
    en: "At 100+ engineers, the AI platform's product is a paved road: an internal SDK over the gateway with tracing, retries and cost tags built in; a prompt registry with versions and labels; templates that start with an eval harness wired into CI; a model catalog with an approval policy and data-handling rules; per-team quotas and cost dashboards; a launch checklist; and async, event-driven paths for batch work. Measure it by time-to-first-feature, adoption, and how much LLM traffic still bypasses it.",
    he: "כשיש 100+ מהנדסים, המוצר של פלטפורמת ה-AI הוא paved road: SDK פנימי מעל ה-gateway עם tracing, retries ותגיות עלות מובנים, prompt registry עם גרסאות ו-labels, templates שמתחילים עם eval harness מחובר ל-CI, קטלוג מודלים עם policy של אישור וכללי טיפול במידע, quotas לכל צוות ו-dashboards של עלות, launch checklist, ומסלולים אסינכרוניים מבוססי events לעבודות batch. מודדים אותו לפי time-to-first-feature, אימוץ, וכמה תעבורת LLM עדיין עוקפת אותו."
  },
  analogy: {
    en: "A city can't stop people from walking across the grass, but it can pave the path they already want to take, light it, and put a map at the entrance. Most people follow the paved road because it's easier, not because it's mandatory. The few who go off-road still have to respect the fence around the reservoir (the gateway and data rules).",
    he: "עירייה לא יכולה למנוע מאנשים ללכת על הדשא, אבל היא יכולה לסלול את השביל שהם ממילא רוצים ללכת בו, להאיר אותו ולשים מפה בכניסה. רוב האנשים הולכים בשביל הסלול כי הוא קל יותר, לא כי הוא חובה. המעטים שיורדים ממנו עדיין חייבים לכבד את הגדר סביב המאגר (ה-gateway וכללי המידע)."
  },
  sections: [
    {
      h: { en: "The problem, and the platform as a product", he: "הבעיה, והפלטפורמה כמוצר" },
      body: {
        en: `<p>Fifteen teams adopting LLMs on their own produce fifteen ways to call models, prompts pasted into code, no evals, provider keys in CI variables, PII in logs, and a surprise invoice. Central review of every feature doesn't scale either: the AI platform team becomes the bottleneck.</p>
<p>The paved-road answer (see <a href="#/lesson/staff-platform-engineering">Platform Engineering</a>): make the <strong>right way the easiest way</strong>. Hard guardrails are few and enforced by infrastructure (all model traffic goes through the gateway; restricted data never leaves approved providers). Everything else is defaults and tooling teams <em>choose</em> because it saves them time. The platform team owns:</p>
<ul>
<li>The <strong>gateway</strong> (<a href="#/lesson/ai-gateway-design">Designing an AI Gateway</a>) and the <strong>agent runtime</strong> (<a href="#/lesson/ai-agent-runtime">Agent Runtimes</a>).</li>
<li>The <strong>SDKs</strong> (TypeScript and Python), the <strong>prompt registry</strong>, <strong>templates</strong>, the <strong>eval harness</strong>.</li>
<li>The <strong>model catalog</strong> and approval process, data-handling rules, quotas and cost reporting.</li>
<li>Docs, office hours, and a short <strong>launch review</strong> instead of a long design review.</li>
</ul>
<p>Product teams own their prompts, evals, features and on-call. The split matters: the platform makes the safe path cheap; it doesn't write every feature.</p>`,
        he: `<p>15 צוותים שמאמצים LLMs לבד מייצרים 15 דרכים לקרוא למודלים, prompts מודבקים בקוד, אפס evals, מפתחות של providers במשתני CI, PII ב-logs, וחשבונית מפתיעה. גם review מרכזי לכל פיצ'ר לא עושה scale: צוות פלטפורמת ה-AI הופך לצוואר הבקבוק.</p>
<p>התשובה של paved road (ראה <a href="#/lesson/staff-platform-engineering">Platform Engineering</a>): לגרום ל<strong>דרך הנכונה להיות הדרך הקלה</strong>. יש מעט guardrails קשיחים, והתשתית אוכפת אותם (כל תעבורת המודלים עוברת דרך ה-gateway, ומידע מוגבל אף פעם לא יוצא מ-providers מאושרים). כל השאר הוא ברירות מחדל וכלים שצוותים <em>בוחרים</em> בהם כי הם חוסכים להם זמן. צוות הפלטפורמה מחזיק את:</p>
<ul>
<li>ה-<strong>gateway</strong> (<a href="#/lesson/ai-gateway-design">Designing an AI Gateway</a>) וה-<strong>agent runtime</strong> (<a href="#/lesson/ai-agent-runtime">Agent Runtimes</a>).</li>
<li>ה-<strong>SDKs</strong> (TypeScript ו-Python), ה-<strong>prompt registry</strong>, ה-<strong>templates</strong> וה-<strong>eval harness</strong>.</li>
<li><strong>קטלוג המודלים</strong> ותהליך האישור, כללי הטיפול במידע, quotas ודיווח עלויות.</li>
<li>תיעוד, office hours, ו-<strong>launch review</strong> קצר במקום design review ארוך.</li>
</ul>
<p>צוותי המוצר מחזיקים את ה-prompts, ה-evals, הפיצ'רים וה-on-call שלהם. החלוקה הזאת חשובה: הפלטפורמה הופכת את הדרך הבטוחה לזולה, היא לא כותבת כל פיצ'ר.</p>`
      }
    },
    {
      h: { en: "The internal SDK: thin, typed, observable by default", he: "ה-SDK הפנימי: דק, typed, ועם observability כברירת מחדל" },
      body: {
        en: `<p>The SDK wraps the OpenAI-compatible gateway API rather than replacing it. What it adds is what every team would otherwise get wrong:</p>
<ul>
<li><strong>Identity and attribution</strong>: picks up the workload identity, adds <code>team</code>, <code>service</code>, <code>feature</code>, <code>env</code> headers automatically.</li>
<li><strong>Tracing by default</strong>: OpenTelemetry GenAI spans linked to the caller's trace, with prompt id and version as attributes. Content capture stays off unless the route opts in.</li>
<li><strong>Sane defaults</strong>: timeouts, retries with jitter only on retryable errors, a default <code>max_tokens</code>, streaming helpers, cancellation on client disconnect.</li>
<li><strong>Structured output</strong>: pass a zod or pydantic schema, get a validated typed object or a typed error, with one repair retry.</li>
<li><strong>Prompt registry client</strong>: fetch prompt by name and label, cached locally with a fallback to the last-known-good version.</li>
</ul>
<pre>// NestJS: the paved-road module a team imports (TypeScript)
@Module({ imports: [LlmModule.forRoot({ team: "payments", service: "refund-bot" })] })
export class AppModule {}

@Injectable()
export class TicketSummarizer {
  constructor(private readonly llm: LlmClient, private readonly prompts: PromptRegistry) {}

  async summarize(ticket: Ticket) {
    const p = await this.prompts.get("ticket-summary", { label: "production" });  // e.g. v7
    return this.llm.structured({
      feature: "ticket-summary",
      model: p.model,                        // alias from the registry, e.g. "chat-fast"
      messages: p.render({ ticket: ticket.body }),
      schema: SummarySchema,                 // zod; validated, one repair retry
      maxTokens: 400,
    });                                      // span: chat chat-fast, prompt=ticket-summary@7, team=payments
  }
}</pre>
<pre># Python: same contract
summary = llm.structured(feature="ticket-summary", prompt=prompts.get("ticket-summary", label="production"),
                         variables={"ticket": body}, schema=Summary, max_tokens=400)</pre>
<blockquote>⚠️ Production tip: keep the SDK thin and version it with semver. A fat SDK that hides the gateway API becomes a framework nobody can debug, and pins 30 services to its release cadence. If the SDK disappeared, teams should be able to call the gateway with the plain OpenAI client.</blockquote>`,
        he: `<p>ה-SDK עוטף את ה-API של ה-gateway, שתואם OpenAI, ולא מחליף אותו. מה שהוא מוסיף זה בדיוק מה שכל צוות היה עושה לא נכון לבד:</p>
<ul>
<li><strong>Identity ושיוך</strong>: לוקח את ה-identity של ה-workload ומוסיף אוטומטית את ה-headers <code>team</code>, <code>service</code>, <code>feature</code> ו-<code>env</code>.</li>
<li><strong>Tracing כברירת מחדל</strong>: spans לפי GenAI של OpenTelemetry שמקושרים ל-trace של הקורא, עם ה-id והגרסה של ה-prompt כ-attributes. איסוף התוכן כבוי, אלא אם ה-route ביקש.</li>
<li><strong>ברירות מחדל שפויות</strong>: timeouts, retries עם jitter רק על שגיאות שמותר לחזור עליהן, <code>max_tokens</code> ברירת מחדל, helpers ל-streaming, וביטול כשה-client מתנתק.</li>
<li><strong>Structured output</strong>: מעבירים סכמה של zod או pydantic, ומקבלים אובייקט typed שעבר אימות, או שגיאה typed, עם retry תיקון אחד.</li>
<li><strong>Client ל-prompt registry</strong>: מביא prompt לפי שם ו-label, שומר אותו ב-cache מקומי, ונופל לגרסת last-known-good.</li>
</ul>
<pre>// NestJS: the paved-road module a team imports (TypeScript)
@Module({ imports: [LlmModule.forRoot({ team: "payments", service: "refund-bot" })] })
export class AppModule {}

@Injectable()
export class TicketSummarizer {
  constructor(private readonly llm: LlmClient, private readonly prompts: PromptRegistry) {}

  async summarize(ticket: Ticket) {
    const p = await this.prompts.get("ticket-summary", { label: "production" });  // e.g. v7
    return this.llm.structured({
      feature: "ticket-summary",
      model: p.model,                        // alias from the registry, e.g. "chat-fast"
      messages: p.render({ ticket: ticket.body }),
      schema: SummarySchema,                 // zod; validated, one repair retry
      maxTokens: 400,
    });                                      // span: chat chat-fast, prompt=ticket-summary@7, team=payments
  }
}</pre>
<pre># Python: same contract
summary = llm.structured(feature="ticket-summary", prompt=prompts.get("ticket-summary", label="production"),
                         variables={"ticket": body}, schema=Summary, max_tokens=400)</pre>
<blockquote>⚠️ Production tip: תשאיר את ה-SDK דק ותנהל לו גרסאות לפי semver. SDK שמן שמסתיר את ה-API של ה-gateway הופך ל-framework שאף אחד לא מצליח לדבג, וקושר 30 services לקצב ה-releases שלו. אם ה-SDK ייעלם, צוותים צריכים להיות מסוגלים לקרוא ל-gateway עם ה-client הרגיל של OpenAI.</blockquote>`
      }
    },
    {
      h: { en: "Prompt registry, templates and golden paths", he: "Prompt registry, templates ו-golden paths" },
      body: {
        en: `<p><strong>Prompts are deployable artifacts.</strong> Two workable models: prompts in the service repo (reviewed in PRs, deployed with the code, simplest) or a <strong>prompt registry</strong> (immutable numbered versions, labels like <code>staging</code> and <code>production</code> that point at a version, change without a code deploy). Either way:</p>
<ul>
<li>A version bundles the template, the model alias, generation params, the tool set and the output schema; changing any of them is a new version.</li>
<li>Promoting a label requires the eval suite to pass for that version (the registry calls CI, or CI updates the registry).</li>
<li>Every trace records <code>prompt_name@version</code>, so a quality drop can be tied to a specific change, and rollback means moving the label back.</li>
<li>Gradual rollout uses the feature-flag system: 10% of traffic on v8, compare online metrics, then 100%.</li>
</ul>
<p><strong>Templates (golden paths)</strong>: a scaffolder (for example Backstage software templates) creates a new service or job with everything wired in. Typical set:</p>
<table>
<tr><th>Template</th><th>Comes with</th></tr>
<tr><td>Classifier / extractor</td><td>Structured output schema, temperature 0, exact-match cache, labeled eval set skeleton, accuracy gate</td></tr>
<tr><td>RAG service</td><td>Ingestion job, tenant-filtered retrieval, citation checks, retrieval + answer evals (<a href="#/lesson/ai-rag-deep">RAG Deep Dive</a>)</td></tr>
<tr><td>Agent with tools</td><td>Runtime registration, tool schemas with side-effect classes, budgets, approval hooks, trajectory evals</td></tr>
<tr><td>Batch enrichment job</td><td>Queue consumer, provider batch API, idempotent writes, DLQ, cost tag</td></tr>
</table>
<p>Each template ships with a working CI pipeline: lint, unit tests, the <strong>eval harness</strong> (smoke suite on PR, regression nightly), and the launch checklist as a PR template. A new team runs one command and has a deployable, traced, evaluated hello-world in an hour.</p>`,
        he: `<p><strong>Prompts הם artifacts שעושים להם deploy.</strong> יש שני מודלים שעובדים: prompts ב-repo של ה-service (עוברים review ב-PRs, יוצאים עם הקוד, הכי פשוט), או <strong>prompt registry</strong> (גרסאות ממוספרות שלא משתנות, ו-labels כמו <code>staging</code> ו-<code>production</code> שמצביעים על גרסה ומשתנים בלי deploy של קוד). בכל מקרה:</p>
<ul>
<li>גרסה אורזת את ה-template, את ה-alias של המודל, את הפרמטרים של ה-generation, את סט ה-tools ואת סכמת הפלט. שינוי של כל אחד מהם הוא גרסה חדשה.</li>
<li>קידום של label דורש שה-eval suite יעבור על הגרסה הזאת (ה-registry קורא ל-CI, או שה-CI מעדכן את ה-registry).</li>
<li>כל trace רושם <code>prompt_name@version</code>, כך שאפשר לקשר ירידה באיכות לשינוי מסוים, ו-rollback זה להחזיר את ה-label אחורה.</li>
<li>Rollout הדרגתי משתמש במערכת ה-feature flags: 10% מהתעבורה על v8, משווים metrics של online, ואז 100%.</li>
</ul>
<p><strong>Templates, או golden paths</strong>: scaffolder (למשל software templates של Backstage) יוצר service או job חדש עם הכול מחובר. סט טיפוסי:</p>
<table>
<tr><th>Template</th><th>מה מגיע איתו</th></tr>
<tr><td>Classifier או extractor</td><td>סכמת structured output, temperature 0, cache של התאמה מדויקת, שלד של eval set מתויג, gate על accuracy</td></tr>
<tr><td>RAG service</td><td>Job של ingestion, retrieval מסונן לפי tenant, בדיקות citations, evals ל-retrieval ולתשובות (<a href="#/lesson/ai-rag-deep">RAG Deep Dive</a>)</td></tr>
<tr><td>Agent עם tools</td><td>רישום ב-runtime, סכמות של tools עם סוגי side effect, תקציבים, hooks לאישור, ו-evals ל-trajectories</td></tr>
<tr><td>Batch enrichment job</td><td>Consumer של תור, batch API של ה-provider, כתיבות אידמפוטנטיות, DLQ ותגית עלות</td></tr>
</table>
<p>כל template מגיע עם pipeline של CI שעובד: lint, unit tests, ה-<strong>eval harness</strong> (smoke suite על PR ורגרסיה לילית), וה-launch checklist כ-template של PR. צוות חדש מריץ פקודה אחת ותוך שעה יש לו hello-world שאפשר לעשות לו deploy, עם tracing ו-evals.</p>`
      }
    },
    {
      h: { en: "Governance without a bottleneck: catalog, data rules, quotas, launch checklist", he: "Governance בלי צוואר בקבוק: קטלוג, כללי מידע, quotas ו-launch checklist" },
      body: {
        en: `<p><strong>Model catalog</strong>: one page (and API) listing every approved alias with the provider and region behind it, allowed data classes, retention terms (zero-data-retention or not), context limit, price per 1M input/output tokens, typical TTFT and throughput, eval scores on the internal benchmark suites, and status (preview, GA, deprecated with a date).</p>
<p><strong>Approval policy for a new model or provider</strong>: security and legal review of the provider terms (training on your data, retention, sub-processors, region), the platform's benchmark and safety evals, a cost estimate, and gateway integration. A target lead time (for example two weeks) keeps teams from going around the process.</p>
<p><strong>Data-handling rules</strong>, expressed as data classes the gateway can enforce:</p>
<table>
<tr><th>Class</th><th>Example</th><th>Allowed</th></tr>
<tr><td>Public / internal</td><td>Docs, code without secrets</td><td>Any approved alias</td></tr>
<tr><td>Confidential</td><td>Customer tickets, business data</td><td>Approved providers with zero-data-retention terms, in approved regions</td></tr>
<tr><td>Restricted</td><td>Payment data, health data, credentials</td><td>Not sent to models; or only after redaction / tokenization; or only to in-VPC models</td></tr>
</table>
<p><strong>Quotas and cost</strong>: each team gets TPM and monthly budget per environment, raised by a self-service request with a reason. Dashboards per team and per feature: spend, cost per request, cost per successful task, cache hit rate, top prompts by spend. Weekly anomaly alerts (a feature's spend doubles) go to the owning team, not to the platform.</p>
<p><strong>Launch checklist</strong> (a PR template, reviewed in 30 minutes, not a committee):</p>
<ul>
<li>Uses the SDK / gateway alias; feature tag set; budget and max_tokens set.</li>
<li>Data class declared; no restricted data in prompts or logs; content capture decision documented.</li>
<li>Eval suite in CI with must-pass cases; baseline numbers recorded; online sampling on.</li>
<li>Failure behaviour defined: timeout, fallback alias, degraded UX when the model is unavailable.</li>
<li>Prompt-injection review for any feature with tools or untrusted content (<a href="#/lesson/ai-security-practice">AI Security in Practice</a>).</li>
<li>Owner, on-call, dashboard and alert links; kill switch flag.</li>
</ul>`,
        he: `<p><strong>קטלוג מודלים</strong>: עמוד אחד (ו-API) שמפרט כל alias מאושר, עם ה-provider וה-region שמאחוריו, סוגי המידע המותרים, תנאי retention (zero-data-retention או לא), מגבלת context, מחיר למיליון token-ים של input ו-output, TTFT ו-throughput טיפוסיים, ציוני eval על ה-benchmarks הפנימיים, וסטטוס (preview, GA, או deprecated עם תאריך).</p>
<p><strong>Policy לאישור מודל או provider חדש</strong>: review של אבטחה ומשפטית על התנאים של ה-provider (אימון על המידע שלך, retention, sub-processors, region), ה-benchmarks וה-evals של הבטיחות של הפלטפורמה, הערכת עלות, ואינטגרציה ל-gateway. זמן יעד (למשל שבועיים) מונע מצוותים לעקוף את התהליך.</p>
<p><strong>כללי טיפול במידע</strong>, בתור סוגי מידע שה-gateway יכול לאכוף:</p>
<table>
<tr><th>סוג</th><th>דוגמה</th><th>מה מותר</th></tr>
<tr><td>Public או internal</td><td>תיעוד, קוד בלי secrets</td><td>כל alias מאושר</td></tr>
<tr><td>Confidential</td><td>טיקטים של לקוחות, מידע עסקי</td><td>Providers מאושרים עם תנאי zero-data-retention, ב-regions מאושרים</td></tr>
<tr><td>Restricted</td><td>מידע תשלומים, מידע רפואי, credentials</td><td>לא נשלח למודלים. או רק אחרי השחרה או tokenization, או רק למודלים בתוך ה-VPC</td></tr>
</table>
<p><strong>Quotas ועלות</strong>: כל צוות מקבל TPM ותקציב חודשי לכל סביבה, ומגדיל אותם בבקשת self-service עם נימוק. Dashboards לכל צוות ולכל פיצ'ר: הוצאה, עלות לבקשה, עלות למשימה מוצלחת, cache hit rate, וה-prompts הכי יקרים. התראות anomaly שבועיות (ההוצאה של פיצ'ר הוכפלה) הולכות לצוות שמחזיק את הפיצ'ר, לא לפלטפורמה.</p>
<p><strong>Launch checklist</strong> (template של PR, עובר review בחצי שעה, לא ועדה):</p>
<ul>
<li>משתמש ב-SDK או ב-alias של ה-gateway, תגית פיצ'ר מוגדרת, תקציב ו-max_tokens מוגדרים.</li>
<li>סוג המידע הוצהר, אין מידע restricted ב-prompts או ב-logs, וההחלטה לגבי איסוף תוכן מתועדת.</li>
<li>Eval suite ב-CI עם מקרי must-pass, מספרי baseline מתועדים, דגימה online פעילה.</li>
<li>התנהגות בכשל מוגדרת: timeout, alias ל-fallback, ו-UX מנוון כשהמודל לא זמין.</li>
<li>Review של prompt injection לכל פיצ'ר עם tools או עם תוכן לא אמין (<a href="#/lesson/ai-security-practice">AI Security in Practice</a>).</li>
<li>בעלים, on-call, לינקים ל-dashboard ולהתראות, ו-flag של kill switch.</li>
</ul>`
      }
    },
    {
      h: { en: "Event-driven pieces: async jobs, batch inference, outbox", he: "החלקים מבוססי ה-events: jobs אסינכרוניים, batch inference ו-outbox" },
      body: {
        en: `<p>Not every LLM call belongs in a request path. Give teams three paved lanes:</p>
<ul>
<li><strong>Interactive (sync)</strong>: user waiting, streaming, tight timeouts, high gateway priority.</li>
<li><strong>Async jobs</strong>: "summarize this 200-page contract", "enrich this ticket". The API enqueues a job (SQS, Kafka, or the durable engine) and returns <code>202</code> with a job id; workers call the gateway; the result arrives by webhook, event or polling. Retries and timeouts belong to the queue, not the user's browser.</li>
<li><strong>Batch inference</strong>: nightly classification of 2M records, embedding a corpus. Use the providers' batch APIs where latency allows (typically about half price, results within hours, up to a 24 h window), or a low-priority gateway class that only uses spare TPM. Consumers should read rate-limit headroom and slow down instead of hammering into 429s.</li>
</ul>
<p><strong>Event-driven correctness</strong> (see <a href="#/lesson/arch-event-driven">Event-Driven Architecture</a> and <a href="#/lesson/arch-queues">Queues</a>):</p>
<ul>
<li><strong>Outbox</strong>: when a feature writes a business row and must trigger LLM work ("ticket created, summarize it"), write the row and an outbox event in the same DB transaction; a relay publishes the event. No lost or phantom jobs.</li>
<li><strong>Idempotent consumers</strong>: LLM results are written with a key like <code>(entity_id, prompt_version)</code>, so redelivery doesn't duplicate work or overwrite a newer result with an older one.</li>
<li><strong>DLQ for poison inputs</strong>: a document that always exceeds the context limit or always trips a guardrail goes to a DLQ after N attempts, with the reason, instead of burning tokens forever.</li>
<li><strong>Usage events</strong> from the gateway are themselves an event stream feeding chargeback, anomaly detection and the eval flywheel.</li>
</ul>
<pre>-- Outbox in the same transaction as the business write (Postgres)
BEGIN;
INSERT INTO tickets (id, body, tenant_id) VALUES ($1, $2, $3);
INSERT INTO outbox (aggregate_id, type, payload)
  VALUES ($1, 'ticket.created', jsonb_build_object('ticket_id', $1, 'task', 'summarize'));
COMMIT;
-- relay -&gt; Kafka topic llm.jobs -&gt; worker -&gt; gateway (priority=batch) -&gt; UPSERT summaries ON CONFLICT (ticket_id, prompt_version)</pre>`,
        he: `<p>לא כל קריאה ל-LLM שייכת למסלול של בקשה. נותנים לצוותים שלושה מסלולים סלולים:</p>
<ul>
<li><strong>אינטראקטיבי (sync)</strong>: משתמש מחכה, streaming, timeouts הדוקים, עדיפות גבוהה ב-gateway.</li>
<li><strong>Jobs אסינכרוניים</strong>: "תסכם את החוזה של 200 העמודים", "תעשיר את הטיקט". ה-API מכניס job לתור (SQS, Kafka או ה-durable engine) ומחזיר <code>202</code> עם job id. Workers קוראים ל-gateway, והתוצאה מגיעה ב-webhook, ב-event או ב-polling. ה-retries וה-timeouts שייכים לתור, לא לדפדפן של המשתמש.</li>
<li><strong>Batch inference</strong>: סיווג לילי של 2M רשומות, embedding של קורפוס. משתמשים ב-batch APIs של ה-providers כשה-latency מאפשר (בדרך כלל בערך חצי מחיר, תוצאות תוך שעות, עם חלון של עד 24 שעות), או ב-class של עדיפות נמוכה ב-gateway שמשתמש רק ב-TPM פנוי. ה-consumers צריכים לקרוא את המרווח שנשאר ב-rate limit ולהאט, במקום לדפוק עד 429.</li>
</ul>
<p><strong>נכונות במערכת מבוססת events</strong> (ראה <a href="#/lesson/arch-event-driven">Event-Driven Architecture</a> ו-<a href="#/lesson/arch-queues">Queues</a>):</p>
<ul>
<li><strong>Outbox</strong>: כשפיצ'ר כותב שורה עסקית וצריך להפעיל עבודת LLM ("נוצר טיקט, תסכם אותו"), כותבים את השורה ו-event של outbox באותה טרנזקציה ב-DB, ו-relay מפרסם את ה-event. אין jobs שהולכים לאיבוד ואין jobs רפאים.</li>
<li><strong>Consumers אידמפוטנטיים</strong>: תוצאות LLM נכתבות עם מפתח כמו <code>(entity_id, prompt_version)</code>, כך ש-redelivery לא משכפל עבודה ולא דורס תוצאה חדשה עם ישנה.</li>
<li><strong>DLQ לקלט רעיל</strong>: מסמך שתמיד חורג ממגבלת ה-context או תמיד מפעיל guardrail הולך ל-DLQ אחרי N ניסיונות, עם הסיבה, במקום לשרוף token-ים לנצח.</li>
<li><strong>Usage events</strong> מה-gateway הם בעצמם stream של events שמזין chargeback, זיהוי anomalies וגלגל ה-evals.</li>
</ul>
<pre>-- Outbox in the same transaction as the business write (Postgres)
BEGIN;
INSERT INTO tickets (id, body, tenant_id) VALUES ($1, $2, $3);
INSERT INTO outbox (aggregate_id, type, payload)
  VALUES ($1, 'ticket.created', jsonb_build_object('ticket_id', $1, 'task', 'summarize'));
COMMIT;
-- relay -&gt; Kafka topic llm.jobs -&gt; worker -&gt; gateway (priority=batch) -&gt; UPSERT summaries ON CONFLICT (ticket_id, prompt_version)</pre>`
      }
    },
    {
      h: { en: "Platform metrics: is the road actually used?", he: "Metrics של הפלטפורמה: האם באמת נוסעים על הכביש?" },
      body: {
        en: `<table>
<tr><th>Metric</th><th>How to measure</th><th>A reasonable target</th></tr>
<tr><td>Time to first call</td><td>From template run to the first traced gateway call in a dev environment</td><td>Under a day</td></tr>
<tr><td>Time to first feature</td><td>From kickoff to the first LLM feature in production behind a flag</td><td>Weeks, not quarters</td></tr>
<tr><td>Adoption</td><td>Share of model traffic and of services going through the gateway and SDK</td><td>Close to 100% of traffic; find the rest via egress logs and provider invoices</td></tr>
<tr><td>Eval coverage</td><td>Share of production LLM features with an eval suite gating CI</td><td>All tier-1 features</td></tr>
<tr><td>Cost efficiency</td><td>Cost per successful task, cache hit rate, share of batch-eligible traffic on batch</td><td>Trending down per feature</td></tr>
<tr><td>Reliability</td><td>Gateway availability and overhead, fallback rate, LLM-caused incidents</td><td>Gateway 99.95%+, overhead p99 in single-digit to low-double-digit ms</td></tr>
<tr><td>Developer satisfaction</td><td>Quarterly survey, support tickets per team, office-hours themes</td><td>Rising; recurring questions turned into docs or features</td></tr>
</table>
<p>Watch for the anti-metric: high adoption achieved by mandate while teams quietly work around the SDK. "Shadow AI" (provider keys in a team's own account, direct calls from laptops) shows up in the egress proxy logs and in expense reports; treat it as feedback that the road is missing a lane, not only as a policy violation.</p>`,
        he: `<table>
<tr><th>Metric</th><th>איך מודדים</th><th>יעד סביר</th></tr>
<tr><td>Time to first call</td><td>מהרצת ה-template ועד הקריאה הראשונה ל-gateway עם trace בסביבת dev</td><td>פחות מיום</td></tr>
<tr><td>Time to first feature</td><td>מה-kickoff ועד פיצ'ר ה-LLM הראשון בפרודקשן מאחורי flag</td><td>שבועות, לא רבעונים</td></tr>
<tr><td>אימוץ</td><td>החלק של תעבורת המודלים ושל ה-services שעוברים דרך ה-gateway וה-SDK</td><td>קרוב ל-100% מהתעבורה. את השאר מוצאים ב-logs של ה-egress ובחשבוניות של ה-providers</td></tr>
<tr><td>כיסוי evals</td><td>החלק של פיצ'רי LLM בפרודקשן שיש להם eval suite שחוסם ב-CI</td><td>כל הפיצ'רים של tier 1</td></tr>
<tr><td>יעילות עלות</td><td>עלות למשימה מוצלחת, cache hit rate, והחלק של תעבורה שמתאימה ל-batch ובאמת רצה ב-batch</td><td>מגמת ירידה לכל פיצ'ר</td></tr>
<tr><td>אמינות</td><td>זמינות ה-gateway והתקורה שלו, שיעור fallback, ותקלות שנגרמו מ-LLM</td><td>Gateway ב-99.95% ומעלה, תקורה ב-p99 של אלפיות שנייה בודדות עד עשרות בודדות</td></tr>
<tr><td>שביעות רצון של מפתחים</td><td>סקר רבעוני, טיקטים של support לכל צוות, הנושאים שעולים ב-office hours</td><td>במגמת עלייה, ושאלות חוזרות הופכות לתיעוד או לפיצ'רים</td></tr>
</table>
<p>שים לב ל-anti-metric: אימוץ גבוה שהושג בכפייה, בזמן שצוותים עוקפים בשקט את ה-SDK. "Shadow AI" (מפתחות של providers בחשבון של הצוות, קריאות ישירות מ-laptops) מופיע ב-logs של ה-egress proxy ובדוחות ההוצאות. תתייחס לזה כ-feedback שחסר נתיב בכביש, ולא רק כהפרת policy.</p>`
      }
    }
  ],
  diagram: `team service --(SDK: identity, tags, tracing, retries, schema)--> AI gateway --> providers / in-VPC models
     |                         ^                                     |
     | prompts.get(label)      | model catalog + data classes        +--> usage events --> chargeback, anomalies
     v                         |                                     +--> OTel traces  --> dashboards, online evals
prompt registry (versions, labels) <-- CI eval harness (smoke on PR, nightly regression) <-- templates (Backstage)
async lane: outbox -> Kafka/SQS -> workers -> gateway (priority=batch) / provider batch API -> idempotent upsert, DLQ`,
  handsOn: [
    {
      cmd: `curl -s "https://prompts.internal/v1/prompts/ticket-summary?label=production" | jq '{name, version, model, params, eval_run}'
curl -s -X POST https://prompts.internal/v1/prompts/ticket-summary/labels/production -d '{"version": 7}'   # rollback = move the label`,
      what: { en: "Read which prompt version a label points at, with its model alias, params and the eval run that approved it; rolling back is moving the label to the previous version, no code deploy.", he: "בודקים לאיזו גרסת prompt ה-label מצביע, עם ה-alias של המודל, הפרמטרים והרצת ה-eval שאישרה אותה. Rollback זה להזיז את ה-label לגרסה הקודמת, בלי deploy של קוד." }
    },
    {
      cmd: `curl -s https://llm-gw.internal/v1/models -H "Authorization: Bearer $LLM_GW_KEY" | jq -r '.data[].id'`,
      what: { en: "List the aliases your key is allowed to use. The paved road exposes the catalog through the same OpenAI-compatible API teams already know.", he: "רשימת ה-aliases שהמפתח שלך רשאי להשתמש בהם. ה-paved road חושף את הקטלוג דרך אותו API תואם OpenAI שהצוותים כבר מכירים." }
    },
    {
      cmd: `# Weekly spend per team and feature from usage events (warehouse SQL)
SELECT team, feature, round(sum(cost_usd), 2) AS usd,
       round(sum(cost_usd) / nullif(count_if(task_success), 0), 4) AS usd_per_success
FROM llm_usage WHERE ts >= current_date - 7 GROUP BY 1, 2 ORDER BY usd DESC LIMIT 20;`,
      what: { en: "The showback query behind the cost dashboard. Cost per successful task is more honest than cost per request.", he: "שאילתת ה-showback שמאחורי ה-dashboard של העלויות. עלות למשימה מוצלחת הוגנת יותר מעלות לבקשה." }
    },
    {
      cmd: `kubectl -n platform-egress logs deploy/egress-proxy --since=24h | grep -E 'api\\.(openai|anthropic)\\.com|generativelanguage' | awk '{print $3}' | sort | uniq -c | sort -rn | head`,
      what: { en: "Find services that call model providers directly instead of through the gateway (shadow AI). Each hit is a conversation with a team about what the paved road is missing.", he: "מוצאים services שקוראים ל-providers ישירות במקום דרך ה-gateway (shadow AI). כל תוצאה היא שיחה עם צוות על מה שחסר ב-paved road." }
    }
  ],
  mnemonic: {
    en: "\"SPEC-Q\": SDK, Prompts registry, Evals in CI, Catalog of models, Quotas and cost. If the right way isn't the easy way, teams will pave their own.",
    he: "\"SPEC-Q\": SDK, Prompt registry, Evals ב-CI, Catalog של מודלים, Quotas ועלות. אם הדרך הנכונה היא לא הדרך הקלה, הצוותים יסללו כביש משלהם."
  },
  pitfalls: [
    { en: "Building a fat framework instead of a thin SDK. It hides the gateway API, lags behind provider features, and becomes a blocker. Wrap, don't replace; keep plain-OpenAI-client compatibility.", he: "לבנות framework שמן במקום SDK דק. הוא מסתיר את ה-API של ה-gateway, מפגר אחרי יכולות של providers, והופך לחסם. עוטפים, לא מחליפים, ושומרים תאימות ל-client הרגיל של OpenAI." },
    { en: "Governance by committee. A month-long review per feature pushes teams to their own provider accounts. Encode rules in the gateway, keep the launch review to a checklist, and publish a lead time for new models.", he: "Governance דרך ועדה. Review של חודש לכל פיצ'ר דוחף צוותים לפתוח חשבונות משלהם אצל providers. מקודדים את הכללים ב-gateway, משאירים את ה-launch review כ-checklist, ומפרסמים זמן יעד לאישור מודלים חדשים." },
    { en: "Prompts changed in production without versions or evals. Quality drops and nobody can tell which change caused it. Every prompt change is a version with an eval run, recorded in traces.", he: "שינוי prompts בפרודקשן בלי גרסאות ובלי evals. האיכות יורדת ואף אחד לא יודע איזה שינוי גרם לזה. כל שינוי prompt הוא גרסה עם הרצת eval, ונרשם ב-traces." },
    { en: "Running batch jobs on the interactive lane. A nightly job eats the shared TPM and the customer-facing assistant gets 429s at 2 a.m. Use batch APIs or a low-priority class with its own quota.", he: "להריץ jobs של batch על המסלול האינטראקטיבי. Job לילי אוכל את ה-TPM המשותף, וה-assistant שמול הלקוחות מקבל 429 בשתיים בלילה. משתמשים ב-batch APIs או ב-class של עדיפות נמוכה עם quota משלו." }
  ],
  interview: [
    {
      q: { en: "You join as the first AI platform engineer; 12 teams already call LLMs their own way. What do you do in the first 90 days?", he: "אתה מצטרף כמהנדס פלטפורמת ה-AI הראשון, ו-12 צוותים כבר קוראים ל-LLMs כל אחד בדרך שלו. מה אתה עושה ב-90 הימים הראשונים?" },
      a: { en: "Weeks 1-3: inventory (egress logs, invoices, interviews): which teams, providers, models, data classes, spend, incidents. Weeks 3-8: put a gateway in front of all traffic with an OpenAI-compatible API and aliases, virtual keys per team, usage events and showback; migrate the highest-spend and highest-risk teams first, by changing a base URL. Ship a thin SDK with tracing and cost tags. Weeks 8-12: model catalog and data-class rules enforced at the gateway, one golden-path template with an eval harness in CI, and a one-page launch checklist. Measure adoption and time to first call; decide the next investments (prompt registry, agent runtime) from what teams actually ask for.", he: "שבועות 1 עד 3: מיפוי (logs של egress, חשבוניות, שיחות): אילו צוותים, providers, מודלים, סוגי מידע, הוצאות ותקלות. שבועות 3 עד 8: מציבים gateway מול כל התעבורה, עם API תואם OpenAI ו-aliases, virtual keys לכל צוות, usage events ו-showback. מעבירים קודם את הצוותים עם ההוצאה והסיכון הגבוהים, בשינוי של base URL. משחררים SDK דק עם tracing ותגיות עלות. שבועות 8 עד 12: קטלוג מודלים וכללי סוגי מידע שנאכפים ב-gateway, template אחד של golden path עם eval harness ב-CI, ו-launch checklist של עמוד אחד. מודדים אימוץ ו-time to first call, ומחליטים על ההשקעות הבאות (prompt registry, agent runtime) לפי מה שהצוותים באמת מבקשים." }
    },
    {
      q: { en: "How do you balance governance with speed for 100+ engineers?", he: "איך מאזנים בין governance למהירות כשיש 100+ מהנדסים?" },
      a: { en: "Few hard rules, enforced by infrastructure, not people: all traffic through the gateway, data classes mapped to allowed providers, budgets, content-logging off by default. Everything else is a paved default: SDK, templates, eval harness, checklist. The launch review is a 30-minute checklist owned by the product team, with platform as advisor. New models have a published approval process and lead time. Then watch the signals: shadow traffic in egress logs, support tickets and lead times; when teams route around the road, fix the road.", he: "מעט כללים קשיחים, שהתשתית אוכפת ולא אנשים: כל התעבורה דרך ה-gateway, סוגי מידע שממופים ל-providers מותרים, תקציבים, ו-logging של תוכן כבוי כברירת מחדל. כל השאר הוא ברירת מחדל סלולה: SDK, templates, eval harness ו-checklist. ה-launch review הוא checklist של חצי שעה שצוות המוצר מחזיק, והפלטפורמה מייעצת. למודלים חדשים יש תהליך אישור מפורסם עם זמן יעד. ואז עוקבים אחרי הסיגנלים: תעבורת צל ב-logs של ה-egress, טיקטים של support וזמני המתנה. כשצוותים עוקפים את הכביש, מתקנים את הכביש." }
    }
  ],
  quiz: [
    {
      q: { en: "What should the internal LLM SDK do?", he: "מה ה-SDK הפנימי של LLM צריך לעשות?" },
      options: [
        { en: "Replace the gateway API with its own proprietary protocol", he: "להחליף את ה-API של ה-gateway בפרוטוקול קנייני משלו" },
        { en: "Wrap the OpenAI-compatible gateway API, adding identity tags, tracing, defaults and schema validation", he: "לעטוף את ה-API של ה-gateway שתואם OpenAI, ולהוסיף תגיות identity, tracing, ברירות מחדל ואימות סכמה" },
        { en: "Hold provider API keys for each service", he: "להחזיק את מפתחות ה-API של ה-providers לכל service" },
        { en: "Run evals in the request path", he: "להריץ evals במסלול הבקשה" }
      ],
      answer: 1,
      explain: { en: "Thin and compatible: teams get the safe defaults for free, and can still debug with the plain client.", he: "דק ותואם: הצוותים מקבלים את ברירות המחדל הבטוחות בחינם, ועדיין יכולים לדבג עם ה-client הרגיל." }
    },
    {
      q: { en: "A ticket row is inserted and an LLM summary must follow. Which pattern avoids lost or phantom jobs?", he: "נכנסת שורת טיקט, וחייב לבוא אחריה סיכום LLM. איזה דפוס מונע jobs אבודים או jobs רפאים?" },
      options: [
        { en: "Call the LLM inside the DB transaction", he: "לקרוא ל-LLM בתוך הטרנזקציה של ה-DB" },
        { en: "Publish to Kafka after commit, best effort", he: "לפרסם ל-Kafka אחרי ה-commit, best effort" },
        { en: "Write an outbox event in the same transaction and relay it to the queue", he: "לכתוב event של outbox באותה טרנזקציה ולהעביר אותו לתור עם relay" },
        { en: "Poll the tickets table every hour", he: "לעשות polling לטבלת הטיקטים כל שעה" }
      ],
      answer: 2,
      explain: { en: "The outbox makes the business write and the job event atomic; consumers stay idempotent on (entity, prompt_version).", he: "ה-outbox הופך את הכתיבה העסקית ואת ה-event של ה-job לאטומיים, וה-consumers נשארים אידמפוטנטיים לפי (entity, prompt_version)." }
    },
    {
      q: { en: "What must change when a prompt's model alias or tool set changes?", he: "מה חייב לקרות כשה-alias של המודל או סט ה-tools של prompt משתנים?" },
      options: [
        { en: "Nothing, only the template text is versioned", he: "כלום, רק הטקסט של ה-template מנוהל בגרסאות" },
        { en: "A new prompt version that passes evals before its label is promoted", he: "גרסת prompt חדשה שעוברת evals לפני שה-label שלה מקודם" },
        { en: "A new gateway deployment", he: "Deployment חדש של ה-gateway" },
        { en: "A new virtual key", he: "Virtual key חדש" }
      ],
      answer: 1,
      explain: { en: "A version bundles template, alias, params, tools and schema; any of them changes behaviour and needs an eval run.", he: "גרסה אורזת template, alias, פרמטרים, tools וסכמה. כל אחד מהם משנה התנהגות ודורש הרצת eval." }
    },
    {
      q: { en: "Which signal best reveals that the paved road is missing something?", he: "איזה סיגנל הכי טוב חושף שחסר משהו ב-paved road?" },
      options: [
        { en: "Total token volume grew", he: "נפח ה-token-ים הכולל גדל" },
        { en: "The SDK has many GitHub stars internally", he: "ל-SDK יש הרבה כוכבים ב-GitHub הפנימי" },
        { en: "The gateway CPU is low", he: "ה-CPU של ה-gateway נמוך" },
        { en: "Direct provider calls in egress logs and team-owned provider accounts", he: "קריאות ישירות ל-providers ב-logs של ה-egress, וחשבונות providers שצוותים פתחו בעצמם" }
      ],
      answer: 3,
      explain: { en: "Shadow AI is teams voting with their feet. Find out what they needed that the road didn't offer.", he: "Shadow AI זה צוותים שמצביעים ברגליים. צריך לברר מה הם היו צריכים שהכביש לא נתן." }
    }
  ],
  related: ["ai-gateway-design", "ai-agent-runtime", "ai-agent-evals", "staff-platform-engineering", "ai-llmops", "arch-event-driven", "arch-queues", "cloud-finops", "ai-security-practice"]
});

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-agent-runtime-platform", icon: "🤖", level: 3,
  title: { en: "Design a multi-tenant AI agent runtime platform", he: "תכנון פלטפורמת agent runtime עם multi-tenancy" },
  prompt: {
    en: "Design a platform that runs AI agents for 400 B2B tenants. Tenants configure agents (prompt, model, tools via MCP), and end users start runs from a web app or via API. Runs call tools that read and change tenant systems, sometimes execute code, sometimes need a human approval, and can take from seconds to hours. Expect 300k runs a day. The platform must isolate tenants, stream progress to the UI, control cost, and survive crashes without repeating side effects.",
    he: "תתכנן פלטפורמה שמריצה AI agents עבור 400 tenants עסקיים. ה-tenants מגדירים agents (prompt, מודל, ו-tools דרך MCP), ומשתמשי קצה מתחילים ריצות מאפליקציית web או דרך API. ריצות קוראות ל-tools שקוראים ומשנים מערכות של ה-tenant, לפעמים מריצות קוד, לפעמים צריכות אישור אנושי, ויכולות לקחת משניות ועד שעות. צפי של 300k ריצות ביום. הפלטפורמה חייבת לבודד tenants, להזרים התקדמות ל-UI, לשלוט בעלות, ולשרוד קריסות בלי לחזור על side effects."
  },
  clarify: [
    { en: "What is the run length distribution, and what share needs code execution or human approval?", he: "מה התפלגות האורך של ריצות, ואיזה חלק צריך הרצת קוד או אישור אנושי?" },
    { en: "Who hosts the tools: tenant-run MCP servers on the internet, our hosted connectors, or both? How do tools authenticate on behalf of the end user?", he: "מי מארח את ה-tools: MCP servers שה-tenants מריצים באינטרנט, connectors שאנחנו מארחים, או שניהם? איך ה-tools מזדהים בשם משתמש הקצה?" },
    { en: "Which models and providers are allowed, and do some tenants require data residency or zero-data-retention?", he: "אילו מודלים ו-providers מותרים, והאם יש tenants שדורשים data residency או zero-data-retention?" },
    { en: "Is there a per-tenant budget or plan limit (runs, dollars, concurrency), and who pays for tokens?", he: "יש תקציב או מגבלת תוכנית לכל tenant (ריצות, דולרים, concurrency), ומי משלם על ה-token-ים?" },
    { en: "What latency matters to users: time to first visible event, or total run time?", he: "איזה latency חשוב למשתמשים: הזמן עד ה-event הראשון שרואים, או זמן הריצה הכולל?" },
    { en: "Retention and audit: how long do we keep trajectories, and must every tool action be auditable?", he: "Retention ו-audit: כמה זמן שומרים trajectories, והאם כל פעולת tool חייבת להיות ניתנת ל-audit?" }
  ],
  functional: [
    { en: "Tenants register agents (prompt version, model alias, allowed tools, budgets) and MCP tool servers.", he: "Tenants רושמים agents (גרסת prompt, alias של מודל, tools מותרים, תקציבים) ו-MCP servers של tools." },
    { en: "Start, stream, cancel and inspect runs; resume after disconnect from the last event.", he: "להתחיל, להזרים, לבטל ולבדוק ריצות, ולהמשיך אחרי ניתוק מה-event האחרון." },
    { en: "Execute tool calls with per-user credentials, sandboxed code execution, and approvals for high-risk actions.", he: "להריץ tool calls עם credentials לכל משתמש, הרצת קוד ב-sandbox, ואישורים לפעולות בסיכון גבוה." },
    { en: "Enforce per-run and per-tenant budgets; report usage and cost per tenant, agent and run.", he: "לאכוף תקציבים לכל ריצה ולכל tenant, ולדווח שימוש ועלות לכל tenant, agent וריצה." },
    { en: "Full trajectory traces for debugging, audit and evals.", he: "Traces מלאים של trajectories ל-debugging, ל-audit ול-evals." }
  ],
  nonFunctional: [
    { en: "Scale: 300k runs/day, peak ~10 runs/s started, ~1,000 concurrent active runs, ~125 LLM calls/s at peak.", he: "Scale: 300k ריצות ביום, בשיא בערך 10 ריצות חדשות לשנייה, בערך 1,000 ריצות פעילות במקביל, ובערך 125 קריאות LLM לשנייה בשיא." },
    { en: "Durability: no run lost on crash or deploy; side effects at most once per tool call (idempotent).", he: "עמידות: אף ריצה לא הולכת לאיבוד בקריסה או ב-deploy, ו-side effects קורים לכל היותר פעם אחת לכל tool call (idempotent)." },
    { en: "Isolation: a fully hijacked agent cannot read another tenant's data or reach internal networks.", he: "בידוד: agent שנחטף לגמרי לא יכול לקרוא מידע של tenant אחר או להגיע לרשתות פנימיות." },
    { en: "Latency: first event to the UI under 1 s p95; platform overhead per step under 50 ms p95 (excluding model and tool time).", he: "Latency: ה-event הראשון מגיע ל-UI תוך פחות משנייה ב-p95, ותקורת הפלטפורמה לכל צעד מתחת ל-50 אלפיות שנייה ב-p95 (בלי זמן המודל וה-tools)." },
    { en: "Availability 99.9% for run start and streaming; provider outages degrade via fallback, not failure.", he: "זמינות של 99.9% להתחלת ריצות ול-streaming. נפילות של providers גורמות לירידה מבוקרת דרך fallback, לא לכשל." }
  ],
  estimates: {
    en: `<p><strong>Runs</strong>: 300k/day ≈ 3.5 runs/s average; peak 3x ≈ 10 runs/s. Average active time 90 s (excluding approval waits). Little's law: 10/s × 90 s ≈ <strong>900-1,000 concurrent active runs</strong> at peak; design for 1,500.</p>
<p><strong>Approvals</strong>: 5% of runs = 15k/day; median wait 2 h → about 15k × 2/24 ≈ <strong>1,250 paused runs</strong> at any time. Durable pauses cost storage, not workers.</p>
<p><strong>LLM calls</strong>: 12 steps/run → 3.6M calls/day ≈ 42/s average, <strong>~125/s peak</strong>. Average input 10k tokens (context grows per step), output 400. Input 36B tokens/day, output 1.44B/day. Peak ≈ 125 × 10.4k × 60 ≈ <strong>78M tokens per minute</strong>: more than one provider account or region can usually give you, so the gateway pools quota across several accounts and regions.</p>
<p><strong>Cost</strong> (illustrative prices: $1.50 per 1M uncached input, cached input at 10% of that, $8 per 1M output; 70% of input served from prompt cache): uncached 10.8B × $1.50/M ≈ $16.2k; cached 25.2B × $0.15/M ≈ $3.8k; output 1.44B × $8/M ≈ $11.5k → <strong>~$31.5k/day, ~$0.10 per run</strong>. Without prompt caching the input line alone becomes $54k/day, which is why stable prompt prefixes are a design requirement.</p>
<p><strong>Sandboxes</strong>: 20% of runs = 60k/day, 3 min each → 60k × 180 / 86,400 ≈ 125 concurrent on average, <strong>~375 at peak</strong>, plus a warm pool of ~100. At 1 vCPU and 1 GiB each: ~475 vCPU and ~475 GiB, i.e. a handful of bare-metal hosts with headroom.</p>
<p><strong>Checkpoints</strong>: ~24 step records per run × 8 KB inline (large outputs go to S3) ≈ 190 KB/run → 58 GB/day, ~1.7 TB for 30 days hot. Write rate 7.2M/day ≈ 85/s average, 250/s peak: easy for partitioned Postgres or DynamoDB.</p>
<p><strong>UI events</strong>: ~200 events/run (token deltas batched every 50 ms) → 60M/day ≈ 700/s average, ~2k/s peak, on Redis Streams with 24 h retention, archived to S3.</p>`,
    he: `<p><strong>ריצות</strong>: 300k ביום זה בערך 3.5 ריצות לשנייה בממוצע, ובשיא פי 3, כלומר בערך 10 לשנייה. זמן פעיל ממוצע של 90 שניות (בלי המתנה לאישורים). לפי Little's law: 10 לשנייה כפול 90 שניות זה <strong>900 עד 1,000 ריצות פעילות במקביל</strong> בשיא. מתכננים ל-1,500.</p>
<p><strong>אישורים</strong>: 5% מהריצות זה 15k ביום. עם המתנה חציונית של שעתיים, זה בערך 15k כפול 2 חלקי 24, כלומר <strong>בערך 1,250 ריצות מושהות</strong> בכל רגע. השהיה durable עולה אחסון, לא workers.</p>
<p><strong>קריאות LLM</strong>: 12 צעדים לריצה זה 3.6M קריאות ביום, בערך 42 לשנייה בממוצע ו-<strong>בערך 125 לשנייה בשיא</strong>. Input ממוצע של 10k token-ים (ה-context גדל בכל צעד), ו-output של 400. Input של 36B token-ים ביום ו-output של 1.44B ביום. בשיא זה בערך 125 כפול 10.4k כפול 60, כלומר <strong>בערך 78M token-ים לדקה</strong>: יותר ממה שחשבון או region אחד של provider בדרך כלל נותן, ולכן ה-gateway מאחד quota מכמה חשבונות ו-regions.</p>
<p><strong>עלות</strong> (מחירים להמחשה: $1.50 למיליון token-ים של input בלי cache, input מה-cache ב-10% מזה, ו-$8 למיליון של output, כש-70% מה-input מגיע מ-prompt cache): בלי cache זה 10.8B כפול $1.50 למיליון, בערך $16.2k. מה-cache זה 25.2B כפול $0.15 למיליון, בערך $3.8k. Output זה 1.44B כפול $8 למיליון, בערך $11.5k. סך הכול <strong>בערך $31.5k ביום, בערך $0.10 לריצה</strong>. בלי prompt caching, שורת ה-input לבדה הופכת ל-$54k ביום, ולכן prefixes יציבים של prompts הם דרישת design.</p>
<p><strong>Sandboxes</strong>: 20% מהריצות זה 60k ביום, 3 דקות כל אחד, כלומר 60k כפול 180 חלקי 86,400, בערך 125 במקביל בממוצע ו-<strong>בערך 375 בשיא</strong>, ועוד warm pool של בערך 100. ב-vCPU אחד ו-1 GiB לכל אחד: בערך 475 vCPU ו-475 GiB, כלומר כמה hosts מסוג bare-metal עם מרווח.</p>
<p><strong>Checkpoints</strong>: בערך 24 רשומות צעד לריצה, כפול 8 KB inline (פלטים גדולים הולכים ל-S3), זה בערך 190 KB לריצה, כלומר 58 GB ביום ובערך 1.7 TB ל-30 יום ב-hot. קצב כתיבה של 7.2M ביום, בערך 85 לשנייה בממוצע ו-250 בשיא: קל ל-Postgres עם partitions או ל-DynamoDB.</p>
<p><strong>Events ל-UI</strong>: בערך 200 events לריצה (deltas של token-ים שנאספים כל 50 אלפיות שנייה), כלומר 60M ביום, בערך 700 לשנייה בממוצע ובערך 2k בשיא, על Redis Streams עם retention של 24 שעות וארכוב ל-S3.</p>`
  },
  api: `POST /v1/agents                         {name, prompt_ref, model_alias, tools[], budgets} -> 201 {agent_id, version}
POST /v1/tool-servers                   {url, auth: oauth|static, allowed_tools[]} -> 201 {server_id}
POST /v1/agents/{agent_id}/runs         {input, idempotency_key, budget_override?} -> 202 {run_id}
GET  /v1/runs/{run_id}                  -> {status, steps, usage{tokens_in, tokens_out, cost_usd}, result?}
GET  /v1/runs/{run_id}/events           SSE; Last-Event-ID: <seq> to resume
     events: run.started | message.delta | tool.started | tool.completed | approval.required | run.completed | run.failed
POST /v1/runs/{run_id}/approvals/{approval_id}   {decision: approve|reject, comment} -> 200
POST /v1/runs/{run_id}/cancel           -> 202
GET  /v1/usage?group_by=agent&from=...  -> per-tenant usage and cost`,
  dataModel: `tenants(id PK, tier, monthly_budget_usd, max_concurrent_runs, data_residency, allowed_aliases[])
agents(id, version, tenant_id, prompt_ref, model_alias, tool_ids[], budgets jsonb, PK(id, version))
tool_servers(id PK, tenant_id, url, auth_kind, allowed_tools[], egress_allowlist[])
runs(id PK, tenant_id, agent_id, agent_version, user_id, status, idempotency_key, UNIQUE(tenant_id, idempotency_key),
     steps, tokens_in, tokens_cached, tokens_out, cost_usd, created_at, ended_at)          -- partitioned by day
run_steps(run_id, seq, kind[llm|tool|approval|sandbox], input_ref, output_ref, status, started_at, ended_at, PK(run_id, seq))
tool_results(idempotency_key PK, run_id, tool, result_ref, created_at)   -- key = sha256(run_id:seq:tool_call_id)
approvals(id PK, run_id, action, args_hash, status, expires_at, decided_by, decided_at)
run_events: Redis Stream "ev:{run_id}" (seq, type, payload), 24h; archived to S3 as JSONL
memory(tenant_id, subject_id, key, value, embedding, source_run_id, expires_at, PK(tenant_id, subject_id, key))
usage_events -> Kafka "llm.usage" -> S3/warehouse (tenant, agent, run, alias, model, tokens, cost, price_version)`,
  diagram: `web app / API clients
   |  POST /runs                         GET /runs/{id}/events (SSE)
   v                                             ^
[ API tier (stateless) ] --admission: tenant concurrency, budget--> [ run scheduler: per-tenant queues, weighted fair ]
   |                                             ^                                   |
   |                                   Redis Streams ev:{run_id}                     v
   |                                             ^                      [ durable engine (Temporal) ]
   |                                             |                                   |
   |                                   [ agent workers (K8s, HPA on task-queue backlog) ]
   |                                     |                 |                       |
   |                                     v                 v                       v
   |                           [ AI gateway ]      [ MCP / tool gateway ]   [ sandbox fleet: microVMs ]
   |                           TPM pools across    per-user token exchange,  bare-metal nodes, warm pool,
   |                           accounts/regions    audit, egress allowlist   default-deny egress proxy
   |                                     |                 |
   v                                 providers       tenant systems / hosted connectors
[ Postgres: runs, steps, approvals ]  [ S3: large tool outputs, archives ]  [ OTel collector -> traces, evals ]`,
  deepDives: [
    {
      h: { en: "Execution model: durable runs, idempotent tools", he: "מודל ההרצה: ריצות עמידות ו-tools אידמפוטנטיים" },
      body: {
        en: `<p>Each run is a Temporal workflow (or an equivalent durable engine). Model calls and tool calls are activities with their own timeouts and retry policies; approvals are signals with a 24 h timer; cancellation is a signal checked between steps. Workflow history stays small by keeping payloads out of it: activities write large outputs to S3 and return a pointer. Long agents use <em>continue-as-new</em> every ~100 steps to keep history bounded.</p>
<p>Side-effecting tools receive an idempotency key <code>sha256(run_id:seq:tool_call_id)</code>. The tool gateway checks <code>tool_results</code> before forwarding and passes the key downstream, so a retried activity after a worker crash returns the stored result. Read-only tools are retried freely. Non-idempotent third-party APIs without key support are wrapped by a connector that records intent before calling and reconciles on retry, or are marked approval-required.</p>
<p>Workers are stateless pods pulling from per-tenant-tier task queues; autoscale on task-queue backlog and schedule-to-start latency, not CPU (they mostly wait on I/O). A worker can host hundreds of concurrent runs because each run is waiting on a model most of the time; 1,500 concurrent runs fit in roughly 15-30 worker pods.</p>`,
        he: `<p>כל ריצה היא workflow של Temporal (או durable engine שקול). קריאות למודל ול-tools הן activities עם timeouts ו-retry policies משלהן. אישורים הם signals עם timer של 24 שעות, וביטול הוא signal שנבדק בין צעדים. ההיסטוריה של ה-workflow נשארת קטנה כי ה-payloads לא נכנסים אליה: activities כותבות פלטים גדולים ל-S3 ומחזירות מצביע. Agents ארוכים משתמשים ב-<em>continue-as-new</em> כל בערך 100 צעדים, כדי שההיסטוריה תישאר חסומה.</p>
<p>Tools עם side effects מקבלים idempotency key של <code>sha256(run_id:seq:tool_call_id)</code>. ה-tool gateway בודק את <code>tool_results</code> לפני שהוא מעביר הלאה ומעביר את ה-key לשירות שמאחור, כך ש-activity שקיבלה retry אחרי קריסה של worker מחזירה את התוצאה השמורה. על tools של קריאה בלבד עושים retry חופשי. APIs חיצוניים שאינם אידמפוטנטיים ולא תומכים ב-key נעטפים ב-connector שרושם כוונה לפני הקריאה ומיישר ב-retry, או מסומנים כדורשי אישור.</p>
<p>ה-workers הם Pods בלי state שמושכים מ-task queues לפי tier של tenant. עושים להם autoscaling לפי ה-backlog של התור ולפי ה-latency מתזמון להתחלה, לא לפי CPU (רוב הזמן הם מחכים ל-I/O). Worker אחד יכול להחזיק מאות ריצות במקביל, כי כל ריצה מחכה למודל רוב הזמן. 1,500 ריצות במקביל נכנסות בבערך 15 עד 30 Pods של workers.</p>`
      }
    },
    {
      h: { en: "Tenant isolation and fairness", he: "בידוד tenants והוגנות" },
      body: {
        en: `<ul>
<li><strong>Identity</strong>: the run carries tenant_id and user_id from the authenticated request. The tool gateway performs OAuth token exchange (or STS AssumeRole with session tags) per user and per tool server, with short-lived tokens; models never see credentials and never supply tenant ids.</li>
<li><strong>Data</strong>: every table keyed by tenant_id with row-level security in Postgres; memory and vector stores partitioned per tenant; S3 prefixes per tenant with KMS keys per tenant for the top tier.</li>
<li><strong>Code</strong>: one microVM per run (Firecracker or Kata), never reused across tenants, destroyed after the run; no metadata endpoint, no VPC route; egress only via a proxy enforcing the tenant's allowlist.</li>
<li><strong>Fairness</strong>: admission control caps concurrent runs per tenant (by plan); the scheduler uses weighted fair queuing across tenants so one tenant's 50k-run batch can't starve others; per-tenant TPM budgets at the gateway; batch-mode runs go to a low-priority queue that uses spare capacity.</li>
<li><strong>Blast radius</strong>: cell-based deployment for the largest tenants (dedicated worker pools and queues), so a noisy or compromised tenant is contained.</li>
</ul>`,
        he: `<ul>
<li><strong>Identity</strong>: הריצה נושאת tenant_id ו-user_id מהבקשה המאומתת. ה-tool gateway מבצע OAuth token exchange (או STS AssumeRole עם session tags) לכל משתמש ולכל tool server, עם token-ים קצרי מועד. המודלים אף פעם לא רואים credentials ואף פעם לא מספקים tenant ids.</li>
<li><strong>מידע</strong>: כל טבלה עם מפתח tenant_id ו-row-level security ב-Postgres, stores של זיכרון ווקטורים מחולקים לפי tenant, ו-prefixes ב-S3 לכל tenant, עם KMS key לכל tenant ב-tier העליון.</li>
<li><strong>קוד</strong>: microVM אחד לכל ריצה (Firecracker או Kata), אף פעם לא ממוחזר בין tenants, ונהרס בסוף הריצה. אין metadata endpoint ואין route ל-VPC, ו-egress רק דרך proxy שאוכף את ה-allowlist של ה-tenant.</li>
<li><strong>הוגנות</strong>: admission control מגביל ריצות במקביל לכל tenant (לפי תוכנית). ה-scheduler משתמש ב-weighted fair queuing בין tenants, כך ש-batch של 50k ריצות של tenant אחד לא ירעיב אחרים. תקציבי TPM לכל tenant ב-gateway, וריצות במצב batch הולכות לתור בעדיפות נמוכה שמשתמש בקיבולת פנויה.</li>
<li><strong>Blast radius</strong>: deployment מבוסס cells ל-tenants הגדולים (pools של workers ותורים ייעודיים), כך ש-tenant רועש או פרוץ נשאר מוכל.</li>
</ul>`
      }
    },
    {
      h: { en: "LLM capacity and cost", he: "קיבולת LLM ועלות" },
      body: {
        en: `<p>Peak demand (~78M TPM) exceeds a single provider quota, so the AI gateway pools deployments: the same model alias across several accounts and regions, plus a second provider as an eval-approved fallback. Token buckets exist at three levels: per tenant (plan), per agent (to stop one runaway agent), per deployment (provider quota). Interactive runs have priority; batch runs back off when headroom is low.</p>
<p>Cost levers, in order of impact: <strong>prompt caching</strong> (static system prompt and tool definitions first, conversation after; never reorder the prefix), <strong>context management</strong> (truncate and summarize old tool outputs, store big results by reference; input tokens dominate cost), <strong>model routing</strong> (a small model for classification and routing steps, the large model only for planning and hard steps), <strong>budgets</strong> per run and tenant with graceful stop, and provider <strong>batch APIs</strong> for non-interactive runs.</p>`,
        he: `<p>הביקוש בשיא (בערך 78M TPM) גבוה מה-quota של provider אחד, אז ה-AI gateway מאחד deployments: אותו alias של מודל על פני כמה חשבונות ו-regions, ועוד provider שני כ-fallback שאושר ב-eval. יש token buckets בשלוש רמות: לכל tenant (לפי תוכנית), לכל agent (כדי לעצור agent אחד שהשתולל), ולכל deployment (ה-quota של ה-provider). לריצות אינטראקטיביות יש עדיפות, וריצות batch נסוגות כשהמרווח קטן.</p>
<p>המנופים לעלות, לפי סדר ההשפעה: <strong>prompt caching</strong> (קודם ה-system prompt הסטטי והגדרות ה-tools, אחריהם השיחה, ואף פעם לא משנים סדר ב-prefix), <strong>ניהול context</strong> (קיצור וסיכום של פלטי tools ישנים, ושמירת תוצאות גדולות כמצביע, כי token-ים של input הם רוב העלות), <strong>ניתוב מודלים</strong> (מודל קטן לצעדי סיווג וניתוב, והמודל הגדול רק לתכנון ולצעדים קשים), <strong>תקציבים</strong> לכל ריצה ולכל tenant עם עצירה מסודרת, ו-<strong>batch APIs</strong> של ה-providers לריצות לא אינטראקטיביות.</p>`
      }
    },
    {
      h: { en: "Failure modes", he: "מצבי כשל" },
      body: {
        en: `<table>
<tr><th>Failure</th><th>Effect</th><th>Mitigation</th></tr>
<tr><td>Provider region 5xx / 429 storm</td><td>Steps fail, runs stall</td><td>Gateway fails over across deployments with circuit breakers and a retry budget; activities retry with backoff; runs slow down, don't fail</td></tr>
<tr><td>Worker pod killed mid-step</td><td>Step in flight lost</td><td>Durable engine reschedules the activity; idempotency key prevents double side effects</td></tr>
<tr><td>Agent loops on a failing tool</td><td>Burns tokens</td><td>Repeated-call detector, step and $ budgets, per-agent token bucket</td></tr>
<tr><td>Tenant's MCP server slow or down</td><td>Runs of that tenant hang</td><td>Per-server timeouts and circuit breaker; tool error returned to the model; per-tenant isolation keeps others healthy</td></tr>
<tr><td>Prompt injection via tool output</td><td>Agent attempts exfiltration or a risky action</td><td>Least-privilege tools, approvals for high-risk actions, egress allowlist, output and URL filtering, audit</td></tr>
<tr><td>Redis Streams node lost</td><td>UI stream gap</td><td>Events also persisted (S3/DB) per step; UI reconnects with Last-Event-ID and the API backfills from the durable copy</td></tr>
</table>`,
        he: `<table>
<tr><th>כשל</th><th>השפעה</th><th>טיפול</th></tr>
<tr><td>Region של provider מחזיר סערה של 5xx או 429</td><td>צעדים נכשלים, ריצות נתקעות</td><td>ה-gateway עובר בין deployments עם circuit breakers ו-retry budget, ה-activities עושות retry עם backoff, והריצות מאטות במקום להיכשל</td></tr>
<tr><td>Pod של worker נהרג באמצע צעד</td><td>הצעד שבאוויר הולך לאיבוד</td><td>ה-durable engine מתזמן מחדש את ה-activity, וה-idempotency key מונע side effects כפולים</td></tr>
<tr><td>Agent תקוע בלולאה על tool שנכשל</td><td>שורף token-ים</td><td>גלאי קריאות חוזרות, תקציבי צעדים ודולרים, token bucket לכל agent</td></tr>
<tr><td>ה-MCP server של tenant איטי או למטה</td><td>הריצות של אותו tenant נתקעות</td><td>Timeouts ו-circuit breaker לכל server, שגיאת tool חוזרת למודל, והבידוד לפי tenant שומר על האחרים בריאים</td></tr>
<tr><td>Prompt injection דרך פלט של tool</td><td>ה-agent מנסה להוציא מידע או לבצע פעולה מסוכנת</td><td>Tools עם least privilege, אישורים לפעולות בסיכון גבוה, allowlist ל-egress, סינון פלט ו-URLs, ו-audit</td></tr>
<tr><td>Node של Redis Streams נופל</td><td>חור ב-stream של ה-UI</td><td>ה-events נשמרים גם בצורה עמידה (S3 או DB) בכל צעד, ה-UI מתחבר מחדש עם Last-Event-ID, וה-API משלים מהעותק העמיד</td></tr>
</table>`
      }
    }
  ],
  tradeoffs: [
    { en: "Temporal vs a homemade step table: Temporal gives retries, timers, signals and replay out of the box but is a stateful system to operate (or buy); a step table is simpler at first and turns into a homemade workflow engine once you add approvals and timeouts.", he: "Temporal מול טבלת צעדים ביתית: Temporal נותן retries, timers, signals ו-replay מהקופסה, אבל זו מערכת עם state שצריך להפעיל (או לקנות). טבלת צעדים פשוטה יותר בהתחלה, והופכת ל-workflow engine ביתי ברגע שמוסיפים אישורים ו-timeouts." },
    { en: "microVMs vs gVisor for sandboxes: microVMs give a stronger boundary (own kernel) but need bare-metal or nested virtualization and a warm pool; gVisor runs on ordinary Kubernetes nodes with lower isolation and some syscall overhead.", he: "microVMs מול gVisor ל-sandboxes: microVMs נותנים גבול חזק יותר (kernel משלהם) אבל דורשים bare-metal או nested virtualization ו-warm pool. gVisor רץ על nodes רגילים של Kubernetes, עם בידוד נמוך יותר ותקורה מסוימת על syscalls." },
    { en: "Shared multi-tenant pools vs cells per large tenant: shared pools are cheaper and simpler to run; cells cap blast radius and noisy neighbours at the cost of utilization and operational overhead.", he: "Pools משותפים מול cells ל-tenants גדולים: pools משותפים זולים ופשוטים יותר להפעלה. Cells מגבילים את ה-blast radius ואת השכנים הרועשים, במחיר של ניצולת ותקורה תפעולית." },
    { en: "Rich trajectory logging vs privacy: full content makes debugging and evals possible but stores customer data; default to redacted metadata with per-tenant opt-in content capture and short retention.", he: "Logging עשיר של trajectories מול פרטיות: תוכן מלא מאפשר debugging ו-evals, אבל שומר מידע של לקוחות. ברירת המחדל היא metadata מושחר, עם opt-in לכל tenant לאיסוף תוכן ו-retention קצר." }
  ],
  followUps: [
    {
      q: { en: "A tenant reports that an agent refunded the same order twice. How did that happen and how do you prevent it?", he: "Tenant מדווח ש-agent החזיר כסף על אותה הזמנה פעמיים. איך זה קרה ואיך מונעים את זה?" },
      a: { en: "Two common causes: the activity was retried after the downstream call succeeded but before the result was recorded, without an idempotency key; or the model itself issued a second refund call in a later step. Fix the first with deterministic keys (run, seq, tool_call_id) enforced by the tool gateway and passed downstream. Fix the second at the business level: the refund connector checks whether the order was already refunded (a natural idempotency key on order_id), and refunds above a threshold need approval. Add an eval case reproducing it.", he: "שתי סיבות נפוצות: ה-activity קיבלה retry אחרי שהקריאה לשירות שמאחור הצליחה אבל לפני שהתוצאה נרשמה, בלי idempotency key. או שהמודל עצמו הוציא קריאת החזר שנייה בצעד מאוחר יותר. את הראשונה מתקנים עם keys דטרמיניסטיים (ריצה, seq, tool_call_id) שה-tool gateway אוכף ומעביר הלאה. את השנייה מתקנים ברמה העסקית: ה-connector של ההחזרים בודק אם ההזמנה כבר קיבלה החזר (idempotency key טבעי לפי order_id), והחזרים מעל סף דורשים אישור. ומוסיפים מקרה eval שמשחזר את זה." }
    },
    {
      q: { en: "Provider A announces the model you rely on will be deprecated in 90 days. What does your platform do?", he: "Provider A מודיע שהמודל שאתם נשענים עליו יוצא משימוש בעוד 90 יום. מה הפלטפורמה שלך עושה?" },
      a: { en: "Agents reference aliases, not model ids, so migration is a catalog change. Run the release eval tier (paired, k=5) for every agent version on the candidate model, per tenant tier and language; publish the results to tenants; fix prompt regressions with new prompt versions; then shift the alias by weighted routing (5%, 25%, 100%) with online grading and automatic rollback, well before the deadline.", he: "Agents מצביעים על aliases ולא על model ids, אז המעבר הוא שינוי בקטלוג. מריצים את שכבת ה-eval של release (בזוגות, k=5) לכל גרסת agent על המודל המועמד, לפי tier של tenant ולפי שפה. מפרסמים את התוצאות ל-tenants, מתקנים רגרסיות עם גרסאות prompt חדשות, ואז מזיזים את ה-alias בניתוב לפי משקל (5%, 25%, 100%) עם ציון online ו-rollback אוטומטי, הרבה לפני הדדליין." }
    },
    {
      q: { en: "How would you let tenants bring their own model keys or their own models?", he: "איך היית מאפשר ל-tenants להביא מפתחות מודל משלהם או מודלים משלהם?" },
      a: { en: "Model 'bring your own key' as a per-tenant deployment in the gateway: the tenant's key in a secrets store under a per-tenant KMS key, used only for that tenant's aliases, with their own rate limits and cost reported but not billed. For their own models, register an OpenAI-compatible endpoint (for example a vLLM deployment in their VPC reached over PrivateLink) as a deployment. Run the same eval gates before an agent may switch to it, and keep fallbacks per tenant explicit, since falling back to our provider may violate their data terms.", he: "מתייחסים ל-bring your own key כ-deployment לכל tenant ב-gateway: המפתח של ה-tenant נשמר ב-secrets store תחת KMS key לכל tenant, ומשמש רק ל-aliases של אותו tenant, עם rate limits משלו, ועלות שמדווחת אבל לא מחויבת. למודלים משלהם, רושמים endpoint תואם OpenAI (למשל deployment של vLLM ב-VPC שלהם שמגיעים אליו דרך PrivateLink) בתור deployment. מריצים את אותם eval gates לפני ש-agent מורשה לעבור אליו, ומגדירים fallbacks לכל tenant במפורש, כי fallback ל-provider שלנו עלול להפר את תנאי המידע שלהם." }
    }
  ],
  related: ["ai-agent-runtime", "ai-gateway-design", "ai-agent-evals", "arch-durable-execution", "pr-tenant-isolation-deep", "pr-idempotency", "ai-security-practice", "ai-agents-patterns"]
});

/* ------------------------------------------------------------------ */
INFRA.glossary.push(
  { term: "Virtual key", track: "ai", def: { en: "A gateway-issued API key scoped to a team or service, with model allow-lists, rate limits and budgets; the real provider keys never leave the gateway and a leaked virtual key is revoked on its own.", he: "API key שה-gateway מנפיק לצוות או ל-service, עם allow-list של מודלים, rate limits ותקציבים. המפתחות האמיתיים של ה-providers לא יוצאים מה-gateway, ו-virtual key שדלף נחסם לבד." }, lesson: "ai-gateway-design" },
  { term: "TPM (tokens per minute)", track: "ai", def: { en: "The token-based rate limit LLM providers and gateways enforce alongside RPM; a gateway reserves estimated tokens before a call and reconciles with actual usage after it.", he: "ה-rate limit לפי token-ים שספקי LLM ו-gateways אוכפים לצד RPM. ה-gateway מזמין token-ים משוערים לפני קריאה ומיישר מול השימוש האמיתי אחריה." }, lesson: "ai-gateway-design" },
  { term: "Model alias", track: "ai", def: { en: "A logical model name (chat-large, embed-default) that the gateway maps to real provider deployments, so routing, fallbacks and model upgrades change config instead of application code.", he: "שם לוגי של מודל (chat-large, embed-default) שה-gateway ממפה ל-deployments אמיתיים אצל providers, כך שניתוב, fallbacks ושדרוג מודלים משנים config ולא קוד של אפליקציה." }, lesson: "ai-gateway-design" },
  { term: "Agent trajectory", track: "ai", def: { en: "The ordered record of an agent run: every model call, tool call with arguments, tool result and decision; the unit for tracing, replay and trajectory evals.", he: "התיעוד המסודר של ריצת agent: כל קריאה למודל, כל tool call עם הארגומנטים, כל תוצאה של tool וכל החלטה. זו היחידה ל-tracing, לשחזור ול-evals של trajectories." }, lesson: "ai-agent-evals" },
  { term: "Prompt registry", track: "ai", def: { en: "A store of immutable, numbered prompt versions (template, model alias, params, tools, schema) with movable labels like production, so prompts roll out and roll back without code deploys.", he: "Store של גרסאות prompt ממוספרות שלא משתנות (template, alias של מודל, פרמטרים, tools, סכמה), עם labels שאפשר להזיז כמו production, כך ש-prompts יוצאים וחוזרים אחורה בלי deploy של קוד." }, lesson: "ai-platform-paved-road" },
  { term: "Paved road", track: "ai", def: { en: "The platform-supported default way to build something (SDK, templates, CI, guardrails) made so easy that teams choose it, with only a few rules enforced by infrastructure.", he: "הדרך ברירת המחדל לבנות משהו, שהפלטפורמה תומכת בה (SDK, templates, CI, guardrails), ועשויה כל כך קלה שצוותים בוחרים בה, עם מעט כללים שהתשתית אוכפת." }, lesson: "ai-platform-paved-road" }
);
