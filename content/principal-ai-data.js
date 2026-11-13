window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ============================================================
   Principal v4: AI systems design + data modeling
   ============================================================ */

INFRA.lessons.push({
  id: "pr-ai-systems-design",
  track: "principal",
  order: 122,
  icon: "🤖",
  level: 3,
  minutes: 20,
  title: { en: "AI Systems Design: RAG, Evals, Guardrails, Cost & Latency", he: "תכנון מערכות AI: RAG, Evals, Guardrails, עלות ו-latency" },
  tldr: {
    en: "Treat the LLM as an unreliable, expensive, slow dependency: climb the ladder (prompt → RAG → fine-tune → agent) only as far as you must, prove quality with evals, fence it with guardrails, and budget tokens like you budget latency.",
    he: "מתייחסים ל-LLM כמו ל-dependency לא אמין, יקר ואיטי: עולים בסולם (prompt → RAG → fine-tune → agent) רק כמה שחייבים, מוכיחים איכות עם evals, מגדרים עם guardrails, ומתקצבים tokens כמו שמתקצבים latency."
  },
  analogy: {
    en: "An LLM is a brilliant new hire with no memory of your company and a habit of confidently making things up. Prompting is giving clear instructions. RAG is handing them the right folder before each question. Fine-tuning is sending them to a month-long course. An agent is giving them your credit card and the keys to the office: only after they've proven themselves, with spending limits and someone checking their work. Evals are their performance review, done every week, not once.",
    he: "LLM הוא עובד חדש מבריק, בלי שום זיכרון על החברה שלך, עם הרגל להמציא דברים בביטחון מלא. Prompting זה לתת לו הוראות ברורות. RAG זה לתת לו את התיקייה הנכונה לפני כל שאלה. Fine-tuning זה לשלוח אותו לקורס של חודש. Agent זה לתת לו את כרטיס האשראי ואת המפתחות למשרד: רק אחרי שהוכיח את עצמו, עם תקרת הוצאות ומישהו שבודק את העבודה שלו. Evals הם הערכת הביצועים שלו, כל שבוע ולא פעם אחת."
  },
  sections: [
    {
      h: { en: "First question: should this be an LLM at all? The decision ladder", he: "שאלה ראשונה: האם זה בכלל צריך להיות LLM? סולם ההחלטות" },
      body: {
        en: `<p>A principal's first move is to ask whether a deterministic solution (rules, search, a classifier, SQL) solves 90% of the problem. LLMs win on fuzzy language tasks: summarizing, extracting from messy text, answering over documents, drafting. They lose on exact math, strict consistency and anything that needs a guaranteed answer.</p>
<table>
<tr><th>Rung</th><th>What you change</th><th>Use when</th><th>Cost / effort</th></tr>
<tr><td>1. Prompting</td><td>Instructions, examples, output schema</td><td>The model already knows the domain</td><td>Hours</td></tr>
<tr><td>2. RAG</td><td>What the model sees at query time</td><td>Answers depend on your private or fresh data</td><td>Days to weeks</td></tr>
<tr><td>3. Fine-tuning</td><td>Model weights (style, format, narrow task)</td><td>Consistent format/tone at scale, cheaper smaller model</td><td>Weeks + data pipeline</td></tr>
<tr><td>4. Agents</td><td>The model chooses tools and steps</td><td>Multi-step tasks with real actions</td><td>Highest risk; needs strong guardrails</td></tr>
</table>
<p>Fine-tuning teaches <em>behavior</em>, not <em>facts</em>. If the problem is "the model doesn't know our refund policy", that's RAG, not fine-tuning. Climb only as high as evals prove you must.</p>
<blockquote>💡 Real world: most production "AI features" are rung 1-2 with structured output (JSON schema) and a deterministic system around them. The LLM is one function call inside a normal service with retries, timeouts and a fallback.</blockquote>`,
        he: `<p>הצעד הראשון של Principal הוא לשאול אם פתרון דטרמיניסטי (כללים, search, classifier, SQL) פותר 90% מהבעיה. LLMs מנצחים במשימות שפה עמומות: סיכום, חילוץ מטקסט מבולגן, תשובות על בסיס מסמכים, כתיבת טיוטות. הם מפסידים בחישוב מדויק, בעקביות קשיחה ובכל מה שדורש תשובה מובטחת.</p>
<table>
<tr><th>שלב</th><th>מה משנים</th><th>מתי</th><th>עלות / מאמץ</th></tr>
<tr><td>1. Prompting</td><td>הוראות, דוגמאות, output schema</td><td>המודל כבר מכיר את הדומיין</td><td>שעות</td></tr>
<tr><td>2. RAG</td><td>מה המודל רואה בזמן ה-query</td><td>התשובה תלויה במידע פרטי או עדכני שלך</td><td>ימים עד שבועות</td></tr>
<tr><td>3. Fine-tuning</td><td>משקלות המודל (סגנון, פורמט, משימה צרה)</td><td>פורמט/טון עקבי בסקייל, מודל קטן וזול יותר</td><td>שבועות + data pipeline</td></tr>
<tr><td>4. Agents</td><td>המודל בוחר tools וצעדים</td><td>משימות מרובות שלבים עם פעולות אמיתיות</td><td>הסיכון הכי גבוה; דורש guardrails חזקים</td></tr>
</table>
<p>Fine-tuning מלמד <em>התנהגות</em>, לא <em>עובדות</em>. אם הבעיה היא "המודל לא מכיר את מדיניות ההחזרים שלנו", זה RAG ולא fine-tuning. עולים בסולם רק כמה שה-evals מוכיחים שחייבים.</p>
<blockquote>💡 מהשטח: רוב "פיצ'רי ה-AI" בפרודקשן הם שלב 1-2 עם structured output (JSON schema) ומערכת דטרמיניסטית מסביב. ה-LLM הוא קריאה אחת לפונקציה בתוך service רגיל, עם retries, timeouts ו-fallback.</blockquote>`
      }
    },
    {
      h: { en: "RAG design: retrieval quality decides answer quality", he: "תכנון RAG: איכות ה-retrieval קובעת את איכות התשובה" },
      body: {
        en: `<p>If the right passage isn't retrieved, no model can answer correctly. Design the retrieval pipeline like a search engine:</p>
<ul>
<li><strong>Chunking</strong>: 300-800 tokens with 10-15% overlap, split on structure (headings, paragraphs), keep the title and section path in each chunk.</li>
<li><strong>Embeddings</strong>: one model for both documents and queries; re-embed everything when you change it (store the model version per row).</li>
<li><strong>Hybrid search</strong>: vector similarity + keyword BM25, merged with reciprocal rank fusion. Keywords catch exact IDs, error codes and names that embeddings blur.</li>
<li><strong>Reranking</strong>: fetch top 50 cheaply, rerank to top 5 with a cross-encoder. Usually the biggest single quality win.</li>
<li><strong>Freshness</strong>: CDC or events from the source system re-index changed docs; delete removed ones (stale answers are a bug).</li>
<li><strong>Tenant and permission filters</strong> applied <em>inside</em> the query, never after.</li>
</ul>
<pre>-- pgvector: hybrid-ready, tenant-filtered retrieval
SELECT id, title, chunk
FROM doc_chunks
WHERE tenant_id = $1
  AND acl && $2::text[]          -- user's groups
ORDER BY embedding &lt;=&gt; $3       -- cosine distance
LIMIT 50;                         -- then rerank to 5</pre>
<blockquote>⚠️ Production tip: log the retrieved chunk IDs with every answer. When a user reports a wrong answer, the first question is "was the right chunk retrieved?" Without that log you can't tell a retrieval bug from a generation bug.</blockquote>`,
        he: `<p>אם הקטע הנכון לא נשלף, שום מודל לא יענה נכון. מתכננים את ה-retrieval pipeline כמו מנוע חיפוש:</p>
<ul>
<li><strong>Chunking</strong>: 300-800 tokens עם overlap של 10-15%, חותכים לפי מבנה (כותרות, פסקאות), ושומרים בכל chunk את הכותרת ואת מסלול הסעיף.</li>
<li><strong>Embeddings</strong>: אותו מודל למסמכים ול-queries; כשמחליפים מודל עושים re-embed לכול (שומרים גרסת מודל בכל שורה).</li>
<li><strong>Hybrid search</strong>: דמיון וקטורי + BM25 של מילות מפתח, ממוזגים עם reciprocal rank fusion. מילות מפתח תופסות IDs מדויקים, קודי שגיאה ושמות ש-embeddings מטשטשים.</li>
<li><strong>Reranking</strong>: שולפים top 50 בזול, ועושים rerank ל-top 5 עם cross-encoder. בדרך כלל זה השיפור הכי גדול באיכות.</li>
<li><strong>Freshness</strong>: CDC או events ממערכת המקור עושים re-index למסמכים שהשתנו, ומוחקים מסמכים שהוסרו (תשובה מיושנת היא באג).</li>
<li><strong>פילטרים של tenant והרשאות</strong> מופעלים <em>בתוך</em> ה-query, אף פעם לא אחריו.</li>
</ul>
<pre>-- pgvector: hybrid-ready, tenant-filtered retrieval
SELECT id, title, chunk
FROM doc_chunks
WHERE tenant_id = $1
  AND acl && $2::text[]          -- user's groups
ORDER BY embedding &lt;=&gt; $3       -- cosine distance
LIMIT 50;                         -- then rerank to 5</pre>
<blockquote>⚠️ טיפ לפרודקשן: תרשום ב-log את ה-IDs של ה-chunks שנשלפו עם כל תשובה. כשמשתמש מדווח על תשובה שגויה, השאלה הראשונה היא "האם ה-chunk הנכון נשלף?" בלי ה-log הזה אי אפשר להבדיל בין באג ב-retrieval לבאג ב-generation.</blockquote>`
      }
    },
    {
      h: { en: "Evals: you can't improve what you don't measure", he: "Evals: אי אפשר לשפר את מה שלא מודדים" },
      body: {
        en: `<p>LLM output is non-deterministic, and a prompt tweak that fixes one case silently breaks five others. Evals are your unit tests:</p>
<ul>
<li><strong>Golden set</strong>: 100-500 real questions with expected answers or grading rubrics, including the nasty ones (ambiguous, out of scope, adversarial).</li>
<li><strong>Graders</strong>: exact match or JSON-schema checks where possible; <strong>LLM-as-judge</strong> with a strict rubric for open answers (calibrate it against human labels first, aim for 85%+ agreement).</li>
<li><strong>Regression evals in CI</strong>: every prompt, model or retrieval change runs the suite; block the merge if the score drops more than a threshold.</li>
<li><strong>Online metrics</strong>: thumbs up/down, escalation-to-human rate, answer edit distance, "no answer" rate, cost and latency per request.</li>
</ul>
<pre># evals.yaml - run on every PR that touches prompts/
suite: support-answers
dataset: evals/golden_v7.jsonl      # 320 cases
graders:
  - type: json_schema
  - type: llm_judge
    rubric: evals/rubric_grounded.md
    judge_model: large-model
gate:
  min_score: 0.86
  max_regression: 0.02</pre>
<blockquote>💡 Real world: teams that ship reliable AI features treat the eval dataset as a product asset: every production failure becomes a new eval case. After a few months the golden set encodes the business better than any spec.</blockquote>`,
        he: `<p>הפלט של LLM לא דטרמיניסטי, ושינוי ב-prompt שמתקן מקרה אחד שובר בשקט חמישה אחרים. Evals הם ה-unit tests שלך:</p>
<ul>
<li><strong>Golden set</strong>: 100-500 שאלות אמיתיות עם תשובות צפויות או rubric לציון, כולל המקרים המגעילים (עמומים, מחוץ ל-scope, עוינים).</li>
<li><strong>Graders</strong>: exact match או בדיקת JSON schema איפה שאפשר; <strong>LLM-as-judge</strong> עם rubric קשיח לתשובות פתוחות (מכיילים אותו קודם מול תיוג אנושי, ומכוונים להסכמה של 85%+).</li>
<li><strong>Regression evals ב-CI</strong>: כל שינוי ב-prompt, מודל או retrieval מריץ את הסוויטה; חוסמים merge אם הציון יורד מעבר לסף.</li>
<li><strong>מדדים online</strong>: אגודל למעלה/למטה, שיעור העברה לנציג אנושי, כמה המשתמש ערך את התשובה, שיעור "אין תשובה", עלות ו-latency לכל בקשה.</li>
</ul>
<pre># evals.yaml - run on every PR that touches prompts/
suite: support-answers
dataset: evals/golden_v7.jsonl      # 320 cases
graders:
  - type: json_schema
  - type: llm_judge
    rubric: evals/rubric_grounded.md
    judge_model: large-model
gate:
  min_score: 0.86
  max_regression: 0.02</pre>
<blockquote>💡 מהשטח: צוותים שמשחררים פיצ'רי AI אמינים מתייחסים ל-dataset של ה-evals כנכס של המוצר: כל כשל בפרודקשן הופך ל-case חדש. אחרי כמה חודשים ה-golden set מקודד את הביזנס יותר טוב מכל spec.</blockquote>`
      }
    },
    {
      h: { en: "Guardrails, latency and the cost model", he: "Guardrails, latency ומודל העלות" },
      body: {
        en: `<p><strong>Guardrails</strong>: treat all model input (including retrieved documents and tool results) as untrusted. Screen for prompt injection, validate output against a schema, give tools least privilege (read-only by default, scoped to the user's tenant), and require human approval for irreversible actions (payments, deletes, emails to customers). See <code>pr-owasp-api-llm</code>.</p>
<p><strong>Latency</strong>: users feel <em>time to first token</em> (TTFT), not total time. Stream tokens over SSE, keep the prompt prefix stable so <strong>prompt caching</strong> hits (often 50-90% cheaper and faster on the cached part), and use a <strong>semantic cache</strong> for repeated questions (embedding similarity above ~0.95 returns the stored answer).</p>
<p><strong>Worked cost estimate</strong> for a support assistant:</p>
<pre>requests/day        = 200,000
input tokens/req    = 3,000  (system + 5 chunks + history)
output tokens/req   = 300
price (example)     = $3 / 1M input, $15 / 1M output

input  = 200k * 3,000 = 600M tok  -&gt; $1,800/day
output = 200k * 300   =  60M tok  -&gt;   $900/day
total ~ $2,700/day ~ $81k/month

with 70% prompt-cache hits on input (90% off):
input ~ $1,800 * (0.3 + 0.7*0.1) = $666/day
route 60% easy queries to a model 10x cheaper
-&gt; total drops to roughly $25-30k/month</pre>
<p><strong>Model routing and fallbacks</strong>: a small fast model for classification and easy questions, a large one for hard ones; a second provider behind the same interface for outages and rate limits (link <code>pr-third-party-deps</code>).</p>
<blockquote>⚠️ Production tip: put a per-tenant and per-user token budget in the gateway. One runaway agent loop or one abusive user can burn a month's budget in an afternoon (OWASP LLM "unbounded consumption").</blockquote>`,
        he: `<p><strong>Guardrails</strong>: מתייחסים לכל input של המודל (כולל מסמכים שנשלפו ותוצאות של tools) כלא אמין. סורקים prompt injection, בודקים את הפלט מול schema, נותנים ל-tools מינימום הרשאות (read-only כברירת מחדל, מוגבל ל-tenant של המשתמש), ודורשים אישור אנושי לפעולות בלתי הפיכות (תשלומים, מחיקות, מיילים ללקוחות). ראה <code>pr-owasp-api-llm</code>.</p>
<p><strong>Latency</strong>: המשתמש מרגיש את <em>הזמן עד ה-token הראשון</em> (TTFT), לא את הזמן הכולל. עושים streaming של tokens ב-SSE, שומרים prefix יציב ב-prompt כדי ש-<strong>prompt caching</strong> יפגע (לרוב זול ומהיר ב-50-90% על החלק השמור), ומשתמשים ב-<strong>semantic cache</strong> לשאלות שחוזרות (דמיון embedding מעל ~0.95 מחזיר את התשובה השמורה).</p>
<p><strong>הערכת עלות לדוגמה</strong> לעוזר תמיכה:</p>
<pre>requests/day        = 200,000
input tokens/req    = 3,000  (system + 5 chunks + history)
output tokens/req   = 300
price (example)     = $3 / 1M input, $15 / 1M output

input  = 200k * 3,000 = 600M tok  -&gt; $1,800/day
output = 200k * 300   =  60M tok  -&gt;   $900/day
total ~ $2,700/day ~ $81k/month

with 70% prompt-cache hits on input (90% off):
input ~ $1,800 * (0.3 + 0.7*0.1) = $666/day
route 60% easy queries to a model 10x cheaper
-&gt; total drops to roughly $25-30k/month</pre>
<p><strong>Model routing ו-fallbacks</strong>: מודל קטן ומהיר ל-classification ולשאלות קלות, מודל גדול לקשות; ספק שני מאחורי אותו interface למקרה של תקלות ו-rate limits (ראה <code>pr-third-party-deps</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: שים תקציב tokens לכל tenant ולכל משתמש ב-gateway. לולאה אחת של agent שיצא משליטה או משתמש אחד שמנצל לרעה יכולים לשרוף תקציב של חודש בצהריים אחד (OWASP LLM "unbounded consumption").</blockquote>`
      }
    },
    {
      h: { en: "Self-hosting vs API, observability and privacy", he: "Self-hosting מול API, observability ופרטיות" },
      body: {
        en: `<table>
<tr><th></th><th>Hosted API</th><th>Self-hosted (vLLM on GPUs)</th></tr>
<tr><td>Time to start</td><td>Minutes</td><td>Weeks (capacity, drivers, autoscaling)</td></tr>
<tr><td>Cost shape</td><td>Per token, scales to zero</td><td>Per GPU-hour, cheap only at high steady utilization</td></tr>
<tr><td>Quality</td><td>Frontier models</td><td>Open-weight models, usually a step behind</td></tr>
<tr><td>Data control</td><td>Contract + region + zero-retention options</td><td>Full, stays in your VPC</td></tr>
<tr><td>Ops burden</td><td>Rate limits, provider outages</td><td>GPU scarcity, batching, upgrades, on-call</td></tr>
</table>
<p>Self-hosting pays off when utilization is high and steady: continuous batching (vLLM) can push one modern GPU to thousands of tokens/second across concurrent requests, but an idle GPU still costs the same. Link <code>k8s-gpu-inference</code>.</p>
<p><strong>Observability</strong>: one trace per user request with spans for retrieval, each model call (model, prompt version, input/output tokens, TTFT, cost), each tool call and guardrail verdict. Track quality drift weekly by re-running evals on a sample of live traffic.</p>
<p><strong>Privacy</strong>: redact PII before it reaches prompts and logs, choose providers with zero data retention and the right region, never put secrets in prompts, and remember that embeddings of personal data are personal data too (deletion requests must reach the vector index).</p>`,
        he: `<table>
<tr><th></th><th>API מנוהל</th><th>Self-hosted (vLLM על GPUs)</th></tr>
<tr><td>זמן התחלה</td><td>דקות</td><td>שבועות (capacity, drivers, autoscaling)</td></tr>
<tr><td>מבנה עלות</td><td>לפי token, יורד לאפס</td><td>לפי GPU-hour, זול רק בניצולת גבוהה ויציבה</td></tr>
<tr><td>איכות</td><td>מודלי frontier</td><td>מודלי open-weight, בדרך כלל צעד מאחור</td></tr>
<tr><td>שליטה במידע</td><td>חוזה + region + אפשרויות zero-retention</td><td>מלאה, נשאר ב-VPC שלך</td></tr>
<tr><td>עומס תפעולי</td><td>Rate limits, תקלות של הספק</td><td>מחסור ב-GPU, batching, שדרוגים, on-call</td></tr>
</table>
<p>Self-hosting משתלם כשהניצולת גבוהה ויציבה: continuous batching (vLLM) יכול להביא GPU מודרני אחד לאלפי tokens בשנייה על פני בקשות במקביל, אבל GPU שעומד בטל עולה אותו דבר. ראה <code>k8s-gpu-inference</code>.</p>
<p><strong>Observability</strong>: trace אחד לכל בקשת משתמש, עם spans ל-retrieval, לכל קריאה למודל (מודל, גרסת prompt, tokens של input/output, TTFT, עלות), לכל קריאת tool ולכל החלטה של guardrail. עוקבים אחרי quality drift כל שבוע ע"י הרצה חוזרת של evals על דגימה מה-traffic החי.</p>
<p><strong>פרטיות</strong>: מסירים PII לפני שהוא מגיע ל-prompts ול-logs, בוחרים ספקים עם zero data retention וב-region הנכון, אף פעם לא שמים secrets ב-prompts, וזוכרים ש-embeddings של מידע אישי הם מידע אישי בעצמם (בקשות מחיקה חייבות להגיע גם ל-vector index).</p>`
      }
    }
  ],
  diagram: `user -> gateway (auth, tenant, token budget, rate limit)
          |
          v
   input guardrails (PII redact, injection screen)
          |
          v
   retrieval: hybrid search (vector + BM25, tenant filter)
          |  top 50
          v
   reranker -> top 5 chunks
          |
          v
   router --easy--> small model --+
          \\--hard--> large model --+--> output guardrails
                                    |    (schema, policy)
                                    v
                           stream tokens (SSE) -> user
   every hop -> trace: tokens, cost, TTFT, chunk ids
   nightly   -> evals on golden set + live sample`,
  handsOn: [
    { cmd: "python -c \"import tiktoken;e=tiktoken.get_encoding('cl100k_base');print(len(e.encode(open('prompt.txt').read())))\"", what: { en: "Count the tokens in your real prompt before estimating cost. Most teams underestimate input size by 2-3x once history and chunks are added.", he: "סופרים tokens ב-prompt האמיתי שלך לפני שמעריכים עלות. רוב הצוותים מעריכים בחסר את גודל ה-input פי 2-3 אחרי שמוסיפים history ו-chunks." } },
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS vector; CREATE INDEX ON doc_chunks USING hnsw (embedding vector_cosine_ops);\"", what: { en: "Enable pgvector and add an HNSW index: often all the vector database you need below tens of millions of chunks.", he: "מפעילים pgvector ומוסיפים HNSW index: לרוב זה כל ה-vector database שצריך מתחת לעשרות מיליוני chunks." } },
    { cmd: "curl -N https://api.example.com/v1/chat -H 'Accept: text/event-stream' -d '{\"q\":\"reset password\",\"stream\":true}'", what: { en: "Watch a streamed answer arrive token by token (-N disables buffering). Measure TTFT, not just total time.", he: "רואים תשובה ב-streaming מגיעה token אחרי token (-N מבטל buffering). מודדים TTFT, לא רק זמן כולל." } },
    { cmd: "python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.1-8B-Instruct --max-num-seqs 128", what: { en: "Serve an open-weight model with continuous batching on your own GPU, behind an OpenAI-compatible API.", he: "מגישים מודל open-weight עם continuous batching על GPU משלך, מאחורי API תואם OpenAI." } }
  ],
  mnemonic: {
    en: "LADDER, then PROVE, FENCE, BUDGET: climb only as high as needed, prove it with evals, fence it with guardrails, budget tokens like latency.",
    he: "סולם, אז להוכיח, לגדר, לתקצב: עולים רק כמה שצריך, מוכיחים עם evals, מגדרים עם guardrails, ומתקצבים tokens כמו latency."
  },
  pitfalls: [
    { en: "Fine-tuning to teach facts. Facts change and fine-tuned facts can't be cited or updated quickly; use RAG for knowledge and fine-tuning only for behavior and format.", he: "Fine-tuning כדי ללמד עובדות. עובדות משתנות, ואי אפשר לצטט או לעדכן מהר עובדות שנכנסו ב-fine-tuning; משתמשים ב-RAG לידע וב-fine-tuning רק להתנהגות ולפורמט." },
    { en: "Shipping prompt changes without evals. 'It looked good on my three examples' is how regressions reach production; gate prompt PRs on a golden set.", he: "לשחרר שינויי prompt בלי evals. 'זה נראה טוב על שלוש הדוגמאות שלי' זו הדרך שבה רגרסיות מגיעות לפרודקשן; חוסמים PRs של prompts על golden set." },
    { en: "Filtering tenant data after retrieval. If tenant B's chunk entered the prompt, it can leak in the answer even if you hide the citation; filter inside the vector query.", he: "לסנן מידע של tenant אחרי ה-retrieval. אם chunk של tenant B נכנס ל-prompt, הוא יכול לדלוף בתשובה גם אם מסתירים את הציטוט; מסננים בתוך ה-vector query." }
  ],
  interview: [
    {
      q: { en: "Design a support assistant that answers from 2M internal documents for 500 enterprise tenants. What are your key decisions?", he: "תכנן עוזר תמיכה שעונה מתוך 2M מסמכים פנימיים עבור 500 tenants ארגוניים. מה ההחלטות המרכזיות שלך?" },
      a: { en: "RAG, not fine-tuning, because knowledge changes and must be tenant-scoped. Ingestion via CDC with structure-aware chunking and a stored embedding model version. Hybrid retrieval with tenant and ACL filters inside the query, then a reranker. Structured output with citations. Evals: a golden set per major tenant segment, regression gate in CI, online thumbs and escalation rate. Guardrails: injection screening on retrieved text, read-only tools. Cost: prompt caching on the stable system prefix, routing easy questions to a small model, per-tenant token budgets. Observability: a trace per request with chunk IDs, tokens and cost. Privacy: zero-retention provider in the right region, deletion propagates to the index.", he: "RAG ולא fine-tuning, כי הידע משתנה וחייב להיות מוגבל ל-tenant. Ingestion דרך CDC עם chunking שמכבד מבנה ושמירת גרסת מודל ה-embedding. Hybrid retrieval עם פילטרים של tenant ו-ACL בתוך ה-query, ואחריו reranker. Structured output עם ציטוטים. Evals: golden set לכל סגמנט מרכזי של tenants, gate של רגרסיה ב-CI, ואגודלים ושיעור העברה לנציג online. Guardrails: סריקת injection על טקסט שנשלף, tools ב-read-only. עלות: prompt caching על ה-prefix היציב, ניתוב שאלות קלות למודל קטן, תקציב tokens לכל tenant. Observability: trace לכל בקשה עם chunk IDs, tokens ועלות. פרטיות: ספק עם zero-retention ב-region הנכון, ומחיקה שמגיעה גם ל-index." }
    },
    {
      q: { en: "Answers got worse after a model upgrade. How do you find out why and protect against it next time?", he: "התשובות נהיו גרועות יותר אחרי שדרוג מודל. איך תבין למה ואיך תגן מפני זה בפעם הבאה?" },
      a: { en: "Re-run the golden set on both models and diff per category to localize the drop. Check whether retrieval changed (same chunk IDs?) to separate retrieval from generation. Look at format failures (schema validation rate) since new models often change verbosity. Fix with prompt adjustments or keep the old model pinned. Next time: pin model versions explicitly, run the eval suite as a gate on any model change, canary the new model on a slice of traffic with online metrics, and keep a fallback route to the previous model.", he: "מריצים את ה-golden set על שני המודלים ועושים diff לפי קטגוריה כדי למקם את הירידה. בודקים אם ה-retrieval השתנה (אותם chunk IDs?) כדי להפריד בין retrieval ל-generation. בודקים כשלי פורמט (שיעור ה-schema validation), כי מודלים חדשים משנים הרבה פעמים את אורך התשובה. מתקנים עם התאמות prompt או נשארים עם המודל הישן מקובע. בפעם הבאה: מקבעים גרסאות מודל במפורש, מריצים את סוויטת ה-evals כ-gate על כל החלפת מודל, עושים canary למודל החדש על חלק מה-traffic עם מדדים online, ושומרים route של fallback למודל הקודם." }
    }
  ],
  quiz: [
    {
      q: { en: "Your assistant doesn't know the company's new refund policy. What's the right fix?", he: "העוזר שלך לא מכיר את מדיניות ההחזרים החדשה של החברה. מה התיקון הנכון?" },
      options: [
        { en: "Fine-tune the model on the policy", he: "לעשות fine-tune למודל על המדיניות" },
        { en: "Retrieve the policy document at query time (RAG)", he: "לשלוף את מסמך המדיניות בזמן ה-query (RAG)" },
        { en: "Switch to a bigger model", he: "לעבור למודל גדול יותר" },
        { en: "Increase the temperature", he: "להעלות את ה-temperature" }
      ],
      answer: 1,
      explain: { en: "Fine-tuning teaches behavior, not facts. Knowledge that changes belongs in retrieval, where it can be updated instantly and cited.", he: "Fine-tuning מלמד התנהגות, לא עובדות. ידע שמשתנה שייך ל-retrieval, שם אפשר לעדכן אותו מיד ולצטט אותו." }
    },
    {
      q: { en: "Where must tenant filtering happen in a multi-tenant RAG system?", he: "איפה חייב לקרות הסינון לפי tenant במערכת RAG מרובת tenants?" },
      options: [
        { en: "In the UI, by hiding other tenants' citations", he: "ב-UI, ע\"י הסתרת ציטוטים של tenants אחרים" },
        { en: "After generation, by checking the answer", he: "אחרי ה-generation, ע\"י בדיקת התשובה" },
        { en: "Inside the retrieval query, before anything reaches the prompt", he: "בתוך ה-retrieval query, לפני שמשהו מגיע ל-prompt" },
        { en: "Only in the system prompt instructions", he: "רק בהוראות של ה-system prompt" }
      ],
      answer: 2,
      explain: { en: "Once another tenant's text is in the prompt, it can leak into the answer. Filter in the query itself, like row-level security.", he: "ברגע שטקסט של tenant אחר נמצא ב-prompt, הוא יכול לדלוף לתשובה. מסננים ב-query עצמו, כמו row-level security." }
    },
    {
      q: { en: "Which metric best reflects how fast a streamed chat answer feels?", he: "איזה מדד הכי משקף כמה מהירה מרגישה תשובת צ'אט ב-streaming?" },
      options: [
        { en: "Total generation time", he: "זמן ה-generation הכולל" },
        { en: "Time to first token (TTFT)", he: "הזמן עד ה-token הראשון (TTFT)" },
        { en: "Tokens per request", he: "Tokens לבקשה" },
        { en: "GPU utilization", he: "ניצולת ה-GPU" }
      ],
      answer: 1,
      explain: { en: "With streaming, the user starts reading at the first token; TTFT dominates perceived speed.", he: "עם streaming המשתמש מתחיל לקרוא מה-token הראשון; TTFT קובע את תחושת המהירות." }
    },
    {
      q: { en: "What's the main purpose of a golden set?", he: "מה המטרה העיקרית של golden set?" },
      options: [
        { en: "Training data for fine-tuning", he: "Training data ל-fine-tuning" },
        { en: "A fixed suite of real cases to catch quality regressions on every change", he: "סוויטה קבועה של מקרים אמיתיים שתופסת רגרסיות באיכות בכל שינוי" },
        { en: "A cache of popular answers", he: "Cache של תשובות פופולריות" },
        { en: "A list of banned words", he: "רשימת מילים אסורות" }
      ],
      answer: 1,
      explain: { en: "The golden set is the eval suite: real questions with expected answers or rubrics, run on every prompt, model or retrieval change.", he: "ה-golden set הוא סוויטת ה-evals: שאלות אמיתיות עם תשובות צפויות או rubrics, שרצה על כל שינוי ב-prompt, מודל או retrieval." }
    }
  ],
  related: ["flow-llm-request", "pr-owasp-api-llm", "ai-agent-infra-mcp", "k8s-gpu-inference", "pr-third-party-deps", "pr-db-landscape", "pr-privacy", "pr-tenant-isolation-deep"]
});

INFRA.lessons.push({
  id: "pr-data-modeling",
  track: "principal",
  order: 123,
  icon: "🧩",
  level: 3,
  minutes: 18,
  title: { en: "Data Modeling & Schema Design: From Access Patterns to Online Migrations", he: "Data modeling ותכנון schema: מ-access patterns ועד מיגרציות online" },
  tldr: {
    en: "Model from the questions the system must answer, normalize by default, denormalize on purpose, index for real queries, keep history explicitly, and evolve the schema with expand/contract so you never need downtime.",
    he: "ממדלים לפי השאלות שהמערכת צריכה לענות עליהן, עושים normalization כברירת מחדל ו-denormalization בכוונה, בונים indexes ל-queries אמיתיים, שומרים היסטוריה במפורש, ומשנים schema עם expand/contract כדי שלא יהיה צורך ב-downtime."
  },
  analogy: {
    en: "A schema is the layout of a warehouse. Normalization is storing each product on exactly one shelf, so a price change happens in one place. Denormalization is keeping a pre-packed box of the 20 best sellers by the door because 80% of orders want exactly that. Indexes are the aisle signs. And you never rebuild the warehouse overnight: you open the new aisle first, move stock gradually, then close the old one (expand/contract).",
    he: "Schema זה תכנון של מחסן. Normalization זה לשים כל מוצר על מדף אחד בדיוק, כך ששינוי מחיר קורה במקום אחד. Denormalization זה להחזיק ליד הדלת קופסה ארוזה מראש של 20 המוצרים הנמכרים, כי 80% מההזמנות רוצות בדיוק את זה. Indexes הם השלטים במעברים. ואף פעם לא בונים את המחסן מחדש בלילה אחד: פותחים קודם את המעבר החדש, מעבירים סחורה בהדרגה, ורק אז סוגרים את הישן (expand/contract)."
  },
  sections: [
    {
      h: { en: "Start from access patterns, not entities", he: "מתחילים מ-access patterns, לא מישויות" },
      body: {
        en: `<p>Before drawing tables, write down the questions: who reads what, how often, with what filters and sort order, and what must be consistent together. This list drives keys, indexes and whether you can use a relational or a key-value store at all.</p>
<table>
<tr><th>#</th><th>Access pattern</th><th>Freq</th><th>Shape</th></tr>
<tr><td>1</td><td>Get order by id</td><td>5k/s</td><td>point read</td></tr>
<tr><td>2</td><td>List a customer's orders, newest first</td><td>800/s</td><td>range, paginated</td></tr>
<tr><td>3</td><td>Orders by status for ops dashboard</td><td>20/s</td><td>filter + sort</td></tr>
<tr><td>4</td><td>Revenue per day per region</td><td>hourly</td><td>aggregate (OLAP)</td></tr>
</table>
<p><strong>Normalize by default</strong> (each fact in one place, roughly 3NF): no repeating groups (1NF), every column depends on the whole key (2NF), no column depends on another non-key column (3NF). Then <strong>denormalize deliberately</strong> where a hot read path pays for it, and write down who keeps the copy in sync (trigger, application code, event consumer).</p>
<pre>-- normalized core
CREATE TABLE customers (
  id          bigint PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  email       text   NOT NULL,
  UNIQUE (tenant_id, email)
);
CREATE TABLE orders (
  id          bigint PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  customer_id bigint NOT NULL REFERENCES customers(id),
  status      text   NOT NULL,
  total_cents bigint NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- index driven by access pattern #2
CREATE INDEX orders_by_customer
  ON orders (tenant_id, customer_id, created_at DESC);</pre>
<blockquote>💡 Real world: pattern #4 (aggregates over all orders) is the one that kills OLTP databases. Don't index your way out of it; stream changes to a warehouse or OLAP store (link <code>pr-db-landscape</code>).</blockquote>`,
        he: `<p>לפני שמציירים טבלאות, כותבים את השאלות: מי קורא מה, באיזו תדירות, עם אילו פילטרים וסדר מיון, ומה חייב להיות עקבי יחד. הרשימה הזו קובעת את ה-keys, את ה-indexes, ואם בכלל אפשר להשתמש ב-store רלציוני או key-value.</p>
<table>
<tr><th>#</th><th>Access pattern</th><th>תדירות</th><th>צורה</th></tr>
<tr><td>1</td><td>הזמנה לפי id</td><td>5k/s</td><td>point read</td></tr>
<tr><td>2</td><td>ההזמנות של לקוח, מהחדשה לישנה</td><td>800/s</td><td>range, עם pagination</td></tr>
<tr><td>3</td><td>הזמנות לפי סטטוס לדשבורד של ops</td><td>20/s</td><td>filter + sort</td></tr>
<tr><td>4</td><td>הכנסות ליום לכל region</td><td>כל שעה</td><td>aggregate (OLAP)</td></tr>
</table>
<p><strong>Normalization כברירת מחדל</strong> (כל עובדה במקום אחד, בערך 3NF): בלי קבוצות חוזרות (1NF), כל עמודה תלויה בכל ה-key (2NF), ואף עמודה לא תלויה בעמודה אחרת שאינה key (3NF). אחר כך <strong>denormalization בכוונה</strong> איפה שנתיב קריאה חם מצדיק את זה, וכותבים מי שומר על העותק מסונכרן (trigger, קוד אפליקציה, event consumer).</p>
<pre>-- normalized core
CREATE TABLE customers (
  id          bigint PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  email       text   NOT NULL,
  UNIQUE (tenant_id, email)
);
CREATE TABLE orders (
  id          bigint PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  customer_id bigint NOT NULL REFERENCES customers(id),
  status      text   NOT NULL,
  total_cents bigint NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- index driven by access pattern #2
CREATE INDEX orders_by_customer
  ON orders (tenant_id, customer_id, created_at DESC);</pre>
<blockquote>💡 מהשטח: pattern #4 (aggregates על כל ההזמנות) הוא זה שהורג databases של OLTP. לא פותרים אותו עם עוד indexes; מזרימים את השינויים ל-warehouse או ל-OLAP store (ראה <code>pr-db-landscape</code>).</blockquote>`
      }
    },
    {
      h: { en: "Keys, relationships, JSONB and multi-tenant columns", he: "Keys, קשרים, JSONB ועמודות multi-tenant" },
      body: {
        en: `<ul>
<li><strong>Surrogate vs natural keys</strong>: use a surrogate primary key (bigint or UUIDv7, see <code>pr-ids-pagination</code>) and enforce natural uniqueness with a separate UNIQUE constraint. Emails, SKUs and tax IDs change; primary keys referenced by foreign keys should not.</li>
<li><strong>Many-to-many</strong>: a join table with its own attributes (<code>order_items(order_id, product_id, qty, unit_price_cents)</code>). Copy the price at purchase time: that's history, not duplication.</li>
<li><strong>JSONB</strong>: great for sparse, schema-light attributes you read as a blob (integration payloads, per-tenant custom fields). Bad for anything you filter, join or aggregate often, or that needs constraints. Promote hot JSON keys to real columns.</li>
<li><strong>Multi-tenant</strong>: put <code>tenant_id</code> on every tenant-owned table, lead composite indexes and unique constraints with it, and enforce it with RLS (link <code>pr-tenant-isolation-deep</code>).</li>
</ul>
<pre>-- per-tenant custom fields: JSONB is fine here
ALTER TABLE customers
  ADD COLUMN attrs jsonb NOT NULL DEFAULT '{}';
-- one hot key queried a lot: index it explicitly
CREATE INDEX customers_tier
  ON customers ((attrs-&gt;&gt;'tier'));</pre>
<p><strong>Anti-patterns to reject in review</strong>: EAV tables (<code>entity, attribute, value</code>) that turn every query into a pivot; polymorphic foreign keys (<code>commentable_type, commentable_id</code>) that the database can't enforce; god tables with 150 nullable columns; storing money as float.</p>`,
        he: `<ul>
<li><strong>Surrogate מול natural keys</strong>: משתמשים ב-primary key מלאכותי (bigint או UUIDv7, ראה <code>pr-ids-pagination</code>) ואוכפים ייחודיות טבעית עם UNIQUE constraint נפרד. מיילים, SKUs ומספרי עוסק משתנים; primary keys שיש עליהם foreign keys לא אמורים להשתנות.</li>
<li><strong>Many-to-many</strong>: join table עם attributes משלה (<code>order_items(order_id, product_id, qty, unit_price_cents)</code>). מעתיקים את המחיר ברגע הרכישה: זו היסטוריה, לא כפילות.</li>
<li><strong>JSONB</strong>: מצוין ל-attributes דלילים בלי schema קשיח שקוראים כ-blob (payloads של אינטגרציות, שדות מותאמים לכל tenant). גרוע לכל מה שמסננים, עושים join או aggregate עליו הרבה, או שצריך constraints. מקדמים keys חמים מה-JSON לעמודות אמיתיות.</li>
<li><strong>Multi-tenant</strong>: שמים <code>tenant_id</code> על כל טבלה ששייכת ל-tenant, מתחילים איתו indexes מורכבים ו-unique constraints, ואוכפים עם RLS (ראה <code>pr-tenant-isolation-deep</code>).</li>
</ul>
<pre>-- per-tenant custom fields: JSONB is fine here
ALTER TABLE customers
  ADD COLUMN attrs jsonb NOT NULL DEFAULT '{}';
-- one hot key queried a lot: index it explicitly
CREATE INDEX customers_tier
  ON customers ((attrs-&gt;&gt;'tier'));</pre>
<p><strong>Anti-patterns שדוחים ב-review</strong>: טבלאות EAV (<code>entity, attribute, value</code>) שהופכות כל query ל-pivot; polymorphic foreign keys (<code>commentable_type, commentable_id</code>) שה-database לא יכול לאכוף; god tables עם 150 עמודות nullable; שמירת כסף כ-float.</p>`
      }
    },
    {
      h: { en: "Modeling time and history", he: "למדל זמן והיסטוריה" },
      body: {
        en: `<p>"What was true on March 3?" is a question every business eventually asks. Decide up front how you'll answer it:</p>
<ul>
<li><strong>Audit table</strong>: append-only log of changes (who, when, old, new), written by trigger or the app. Answers "who changed this?".</li>
<li><strong>SCD Type 2</strong> (slowly changing dimension): keep every version with a validity range. Answers "what was the customer's plan on that date?".</li>
<li><strong>Event sourcing</strong> where history <em>is</em> the domain (link <code>arch-event-driven</code>).</li>
</ul>
<pre>CREATE TABLE customer_plan_history (
  customer_id bigint NOT NULL,
  plan        text   NOT NULL,
  valid_from  timestamptz NOT NULL,
  valid_to    timestamptz,          -- NULL = current
  PRIMARY KEY (customer_id, valid_from)
);
-- plan on a given date
SELECT plan FROM customer_plan_history
WHERE customer_id = 42
  AND valid_from &lt;= '2026-03-03'
  AND (valid_to IS NULL OR valid_to &gt; '2026-03-03');</pre>
<blockquote>⚠️ Production tip: soft delete (<code>deleted_at</code>) looks free but leaks everywhere: every query, every unique constraint (use a partial index <code>WHERE deleted_at IS NULL</code>) and every privacy erasure request. Prefer moving deleted rows to an archive table, or hard delete plus an audit record.</blockquote>`,
        he: `<p>"מה היה נכון ב-3 במרץ?" זו שאלה שכל ביזנס שואל בסוף. מחליטים מראש איך עונים עליה:</p>
<ul>
<li><strong>Audit table</strong>: log של שינויים, append-only (מי, מתי, ישן, חדש), נכתב ע"י trigger או האפליקציה. עונה על "מי שינה את זה?".</li>
<li><strong>SCD Type 2</strong> (slowly changing dimension): שומרים כל גרסה עם טווח תוקף. עונה על "באיזו תוכנית היה הלקוח בתאריך הזה?".</li>
<li><strong>Event sourcing</strong> איפה שההיסטוריה <em>היא</em> הדומיין (ראה <code>arch-event-driven</code>).</li>
</ul>
<pre>CREATE TABLE customer_plan_history (
  customer_id bigint NOT NULL,
  plan        text   NOT NULL,
  valid_from  timestamptz NOT NULL,
  valid_to    timestamptz,          -- NULL = current
  PRIMARY KEY (customer_id, valid_from)
);
-- plan on a given date
SELECT plan FROM customer_plan_history
WHERE customer_id = 42
  AND valid_from &lt;= '2026-03-03'
  AND (valid_to IS NULL OR valid_to &gt; '2026-03-03');</pre>
<blockquote>⚠️ טיפ לפרודקשן: soft delete (<code>deleted_at</code>) נראה בחינם אבל דולף לכל מקום: לכל query, לכל unique constraint (צריך partial index עם <code>WHERE deleted_at IS NULL</code>) ולכל בקשת מחיקה לפי חוקי פרטיות. עדיף להעביר שורות שנמחקו לטבלת archive, או למחוק באמת ולשמור רשומת audit.</blockquote>`
      }
    },
    {
      h: { en: "NoSQL modeling: DynamoDB single-table and MongoDB documents", he: "מידול NoSQL: DynamoDB single-table ומסמכים ב-MongoDB" },
      body: {
        en: `<p>In key-value stores you can't join, so you <strong>pre-join by key design</strong>. In DynamoDB single-table design, items of different types share one table and are grouped by a partition key (PK) and ordered by a sort key (SK):</p>
<pre>PK            SK                      attrs
CUST#42       PROFILE                 email, tier
CUST#42       ORDER#2026-11-02#o81    total, status
CUST#42       ORDER#2026-11-09#o93    total, status
ORDER#o81     ITEM#MUG-1              qty, price
GSI1PK=STATUS#PENDING  GSI1SK=2026-11-09#o93</pre>
<table>
<tr><th>Access pattern</th><th>Query</th></tr>
<tr><td>Customer profile</td><td>GetItem PK=CUST#42, SK=PROFILE</td></tr>
<tr><td>Customer's orders, newest first</td><td>Query PK=CUST#42, SK begins_with ORDER#, ScanIndexForward=false</td></tr>
<tr><td>Order with items</td><td>Query PK=ORDER#o81</td></tr>
<tr><td>Pending orders by date</td><td>Query GSI1 PK=STATUS#PENDING</td></tr>
</table>
<p>The price: every new access pattern may need a new GSI or a data migration, so this only works when patterns are known and stable. If they aren't, a relational database is the safer default.</p>
<p><strong>MongoDB: embed or reference?</strong> Embed what's read together and bounded in size (order lines inside an order). Reference what's shared, grows without bound, or is updated independently (customer from many orders, comments on a viral post). Documents have a 16 MB limit; unbounded arrays are the classic production failure.</p>`,
        he: `<p>ב-key-value stores אין join, אז <strong>עושים pre-join דרך תכנון ה-keys</strong>. ב-single-table design של DynamoDB, פריטים מסוגים שונים חולקים טבלה אחת, מקובצים לפי partition key (PK) וממוינים לפי sort key (SK):</p>
<pre>PK            SK                      attrs
CUST#42       PROFILE                 email, tier
CUST#42       ORDER#2026-11-02#o81    total, status
CUST#42       ORDER#2026-11-09#o93    total, status
ORDER#o81     ITEM#MUG-1              qty, price
GSI1PK=STATUS#PENDING  GSI1SK=2026-11-09#o93</pre>
<table>
<tr><th>Access pattern</th><th>Query</th></tr>
<tr><td>פרופיל לקוח</td><td>GetItem PK=CUST#42, SK=PROFILE</td></tr>
<tr><td>ההזמנות של לקוח, מהחדשה לישנה</td><td>Query PK=CUST#42, SK begins_with ORDER#, ScanIndexForward=false</td></tr>
<tr><td>הזמנה עם הפריטים</td><td>Query PK=ORDER#o81</td></tr>
<tr><td>הזמנות pending לפי תאריך</td><td>Query GSI1 PK=STATUS#PENDING</td></tr>
</table>
<p>המחיר: כל access pattern חדש עלול לדרוש GSI חדש או מיגרציית נתונים, אז זה עובד רק כשה-patterns ידועים ויציבים. אם הם לא, database רלציוני הוא ברירת המחדל הבטוחה יותר.</p>
<p><strong>MongoDB: embed או reference?</strong> עושים embed למה שנקרא יחד ומוגבל בגודל (שורות הזמנה בתוך הזמנה). עושים reference למה שמשותף, גדל בלי גבול, או מתעדכן בנפרד (לקוח מהרבה הזמנות, תגובות על פוסט ויראלי). למסמך יש מגבלה של 16 MB; מערכים שגדלים בלי גבול הם הכשל הקלאסי בפרודקשן.</p>`
      }
    },
    {
      h: { en: "Evolving the schema online: expand / contract", he: "לשנות schema online: expand / contract" },
      body: {
        en: `<p>Old and new application versions run side by side during every deploy, so each schema step must work with both. Renaming <code>customers.name</code> to <code>full_name</code> without downtime:</p>
<pre>1 EXPAND   ALTER TABLE customers ADD COLUMN full_name text;
2 DUAL     app v2 writes name AND full_name
3 BACKFILL UPDATE customers SET full_name = name
           WHERE full_name IS NULL AND id BETWEEN $1 AND $2;
           -- in batches of ~5k rows, throttled
4 READ     app v3 reads full_name (fallback to name)
5 VERIFY   SELECT count(*) WHERE full_name IS NULL -&gt; 0
6 CONTRACT app v4 stops writing name;
           later: ALTER TABLE customers DROP COLUMN name;</pre>
<ul>
<li>Postgres: <code>CREATE INDEX CONCURRENTLY</code>; add constraints as <code>NOT VALID</code> then <code>VALIDATE CONSTRAINT</code>; set a short <code>lock_timeout</code> so a blocked ALTER fails fast instead of queuing all traffic behind it.</li>
<li>MySQL: online DDL, or gh-ost / pt-online-schema-change for big tables (shadow table + binlog replay + atomic cut-over).</li>
<li>Every migration is reviewed for: lock level, table size, rollback path, and whether old code still works.</li>
</ul>
<blockquote>💡 Real world: most "the database went down during deploy" incidents are an innocent ALTER waiting for a lock while every new query queues behind it. <code>SET lock_timeout = '3s'</code> in the migration session turns an outage into a retried deploy step.</blockquote>`,
        he: `<p>בכל deploy גרסה ישנה וחדשה של האפליקציה רצות במקביל, אז כל צעד ב-schema חייב לעבוד עם שתיהן. לשנות את השם של <code>customers.name</code> ל-<code>full_name</code> בלי downtime:</p>
<pre>1 EXPAND   ALTER TABLE customers ADD COLUMN full_name text;
2 DUAL     app v2 writes name AND full_name
3 BACKFILL UPDATE customers SET full_name = name
           WHERE full_name IS NULL AND id BETWEEN $1 AND $2;
           -- in batches of ~5k rows, throttled
4 READ     app v3 reads full_name (fallback to name)
5 VERIFY   SELECT count(*) WHERE full_name IS NULL -&gt; 0
6 CONTRACT app v4 stops writing name;
           later: ALTER TABLE customers DROP COLUMN name;</pre>
<ul>
<li>Postgres: <code>CREATE INDEX CONCURRENTLY</code>; מוסיפים constraints כ-<code>NOT VALID</code> ואחר כך <code>VALIDATE CONSTRAINT</code>; מגדירים <code>lock_timeout</code> קצר כדי ש-ALTER חסום ייכשל מהר במקום שכל ה-traffic יעמוד בתור מאחוריו.</li>
<li>MySQL: online DDL, או gh-ost / pt-online-schema-change לטבלאות גדולות (shadow table + replay מה-binlog + cut-over אטומי).</li>
<li>כל מיגרציה עוברת review על: רמת ה-lock, גודל הטבלה, דרך ה-rollback, והאם הקוד הישן עדיין עובד.</li>
</ul>
<blockquote>💡 מהשטח: רוב התקלות של "ה-database נפל באמצע deploy" הן ALTER תמים שמחכה ל-lock בזמן שכל query חדש עומד בתור מאחוריו. <code>SET lock_timeout = '3s'</code> ב-session של המיגרציה הופך outage לצעד deploy שעושה retry.</blockquote>`
      }
    }
  ],
  diagram: `access patterns (who reads what, how often)
        |
        v
 entities + invariants  -> normalize (~3NF) by default
        |
        +--> hot read path?  -> denormalize on purpose
        |                       (+ owner that keeps it in sync)
        +--> history needed? -> audit table / SCD2 / events
        +--> aggregates?     -> stream to OLAP, not OLTP
        |
        v
 keys: surrogate PK + UNIQUE natural key, tenant_id first
        |
        v
 indexes = exactly the queries you listed
        |
        v
 change it later: EXPAND -> DUAL WRITE -> BACKFILL
                  -> READ NEW -> VERIFY -> CONTRACT`,
  handsOn: [
    { cmd: "psql -c \"EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE tenant_id=7 AND customer_id=42 ORDER BY created_at DESC LIMIT 20;\"", what: { en: "Check that access pattern #2 uses the composite index (Index Scan, no Sort node) before you call the model done.", he: "בודקים ש-access pattern #2 משתמש ב-index המורכב (Index Scan, בלי צומת Sort) לפני שמכריזים שהמודל גמור." } },
    { cmd: "psql -c \"SET lock_timeout='3s'; CREATE INDEX CONCURRENTLY orders_status_created ON orders (status, created_at);\"", what: { en: "Add an index online without blocking writes, and fail fast instead of queuing traffic behind a lock.", he: "מוסיפים index online בלי לחסום כתיבות, ונכשלים מהר במקום שה-traffic יעמוד בתור מאחורי lock." } },
    { cmd: "aws dynamodb query --table-name app --key-condition-expression 'PK = :pk AND begins_with(SK, :o)' --expression-attribute-values '{\":pk\":{\"S\":\"CUST#42\"},\":o\":{\"S\":\"ORDER#\"}}' --no-scan-index-forward", what: { en: "Run the single-table 'customer's orders, newest first' pattern as one Query, no joins.", he: "מריצים את ה-pattern של 'ההזמנות של לקוח, מהחדשה לישנה' ב-single-table כ-Query אחד, בלי joins." } },
    { cmd: "gh-ost --table=customers --alter='ADD COLUMN full_name VARCHAR(255)' --execute", what: { en: "Online schema change on a big MySQL table with a shadow table and binlog replay.", he: "שינוי schema online על טבלת MySQL גדולה עם shadow table ו-replay מה-binlog." } }
  ],
  mnemonic: {
    en: "QUESTIONS first, FACTS once, COPIES on purpose, HISTORY explicit, CHANGES in two steps (expand, then contract).",
    he: "קודם השאלות, כל עובדה פעם אחת, עותקים רק בכוונה, היסטוריה במפורש, ושינויים בשני צעדים (expand ואז contract)."
  },
  pitfalls: [
    { en: "Designing tables from a whiteboard of entities and discovering the hot query needs a 5-way join and a sort on a non-indexed column. List access patterns with frequencies first.", he: "לתכנן טבלאות מלוח של ישויות ולגלות שה-query החם דורש join של 5 טבלאות ו-sort על עמודה בלי index. קודם רושמים את ה-access patterns עם התדירויות." },
    { en: "Choosing DynamoDB single-table design while product requirements are still changing weekly. Every new query becomes a GSI or a migration; relational is the better default when patterns are unknown.", he: "לבחור single-table design ב-DynamoDB כשדרישות המוצר עוד משתנות כל שבוע. כל query חדש הופך ל-GSI או למיגרציה; רלציוני הוא ברירת מחדל טובה יותר כשה-patterns לא ידועים." },
    { en: "Renaming or dropping a column in the same deploy that changes the code. Old pods still running the previous version crash; always expand first and contract in a later release.", he: "לשנות שם או למחוק עמודה באותו deploy שמשנה את הקוד. Pods ישנים שעדיין מריצים את הגרסה הקודמת קורסים; תמיד קודם expand, ו-contract ב-release מאוחר יותר." }
  ],
  interview: [
    {
      q: { en: "Model a multi-tenant subscription billing system. Walk me through your schema decisions.", he: "תמדל מערכת billing של מנויים מרובת tenants. תעבור איתי על ההחלטות שלך ב-schema." },
      a: { en: "Access patterns first: current plan per customer (hot), invoices per customer by date, usage per period, revenue reports (OLAP, streamed out). Tables: tenants, customers (tenant_id, surrogate PK, UNIQUE(tenant_id, email)), plans, subscriptions with SCD2 validity (valid_from/valid_to) so I can price any past date, invoices and invoice_lines copying unit prices at billing time, usage_events partitioned by month. tenant_id leads every index and RLS enforces it. Money as integer cents with a currency column. Changes via expand/contract with lock_timeout; reporting via CDC to a warehouse.", he: "קודם access patterns: התוכנית הנוכחית של כל לקוח (חם), חשבוניות לכל לקוח לפי תאריך, שימוש לכל תקופה, דוחות הכנסות (OLAP, מוזרם החוצה). טבלאות: tenants, customers (tenant_id, surrogate PK, UNIQUE(tenant_id, email)), plans, subscriptions עם תוקף SCD2 (valid_from/valid_to) כדי לתמחר כל תאריך בעבר, invoices ו-invoice_lines שמעתיקות את מחיר היחידה ברגע החיוב, ו-usage_events עם partition לפי חודש. tenant_id מוביל כל index ו-RLS אוכף אותו. כסף כ-integer cents עם עמודת מטבע. שינויים דרך expand/contract עם lock_timeout; דוחות דרך CDC ל-warehouse." }
    },
    {
      q: { en: "When would you choose JSONB columns over a normalized design?", he: "מתי תבחר בעמודות JSONB על פני תכנון מנורמל?" },
      a: { en: "For sparse, variable, schema-light data that's mostly read and written as a whole: per-tenant custom fields, raw integration payloads, feature-specific settings. Not for data you filter, join, aggregate or must constrain. I keep core business fields as real typed columns with constraints, index specific JSON keys only when proven hot, and promote a JSON key to a column once it becomes part of the core model.", he: "למידע דליל, משתנה ובלי schema קשיח שבעיקר נקרא ונכתב כשלם: שדות מותאמים לכל tenant, payloads גולמיים של אינטגרציות, הגדרות של פיצ'ר ספציפי. לא למידע שמסננים, עושים join או aggregate עליו, או שחייב constraints. שדות הליבה של הביזנס נשארים עמודות אמיתיות עם טיפוסים ו-constraints, עושים index ל-keys ספציפיים ב-JSON רק כשהוכח שהם חמים, ומקדמים key לעמודה ברגע שהוא נהיה חלק ממודל הליבה." }
    }
  ],
  quiz: [
    {
      q: { en: "What should drive your indexes?", he: "מה צריך לקבוע את ה-indexes שלך?" },
      options: [
        { en: "Every foreign key and every column, just in case", he: "כל foreign key וכל עמודה, ליתר ביטחון" },
        { en: "The access patterns you listed, with their filters and sort order", he: "ה-access patterns שרשמת, עם הפילטרים וסדר המיון שלהם" },
        { en: "Only the primary key", he: "רק ה-primary key" },
        { en: "Whatever the ORM generates", he: "מה שה-ORM מייצר" }
      ],
      answer: 1,
      explain: { en: "Indexes cost writes and storage; build exactly the ones your real queries need, leading with equality filters (tenant_id) and ending with the sort column.", he: "Indexes עולים בכתיבות ובאחסון; בונים בדיוק את אלה שה-queries האמיתיים צריכים, מתחילים בפילטרי שוויון (tenant_id) ומסיימים בעמודת המיון." }
    },
    {
      q: { en: "You need to answer 'which plan was this customer on last March?'. Which pattern fits?", he: "צריך לענות על 'באיזו תוכנית היה הלקוח הזה במרץ שעבר?'. איזה pattern מתאים?" },
      options: [
        { en: "Overwrite the plan column on change", he: "לדרוס את עמודת התוכנית בכל שינוי" },
        { en: "SCD Type 2 with valid_from / valid_to", he: "SCD Type 2 עם valid_from / valid_to" },
        { en: "Soft delete the old row", he: "לעשות soft delete לשורה הישנה" },
        { en: "Store it in a JSONB blob", he: "לשמור את זה ב-blob של JSONB" }
      ],
      answer: 1,
      explain: { en: "SCD Type 2 keeps every version with a validity range, so point-in-time questions become a simple range query.", he: "SCD Type 2 שומר כל גרסה עם טווח תוקף, כך ששאלות על נקודת זמן הופכות ל-range query פשוט." }
    },
    {
      q: { en: "What's the safe order to rename a column without downtime?", he: "מה הסדר הבטוח לשנות שם של עמודה בלי downtime?" },
      options: [
        { en: "ALTER TABLE RENAME, then deploy the new code", he: "ALTER TABLE RENAME, ואז deploy של הקוד החדש" },
        { en: "Add new column, dual-write, backfill, read new, verify, then drop old", he: "להוסיף עמודה חדשה, dual-write, backfill, לקרוא מהחדשה, לוודא, ורק אז למחוק את הישנה" },
        { en: "Drop the old column and recreate it", he: "למחוק את העמודה הישנה וליצור אותה מחדש" },
        { en: "Take a maintenance window, there's no other way", he: "לקחת חלון תחזוקה, אין דרך אחרת" }
      ],
      answer: 1,
      explain: { en: "Expand/contract keeps every step compatible with both the old and the new code running during a rolling deploy.", he: "Expand/contract שומר שכל צעד תואם גם לקוד הישן וגם לחדש, שרצים יחד בזמן rolling deploy." }
    },
    {
      q: { en: "In MongoDB, comments on a post that can go viral should be…", he: "ב-MongoDB, תגובות על פוסט שיכול להפוך לויראלי צריכות להיות…" },
      options: [
        { en: "Embedded as an array inside the post document", he: "מוטמעות כמערך בתוך מסמך הפוסט" },
        { en: "Referenced from a separate comments collection", he: "ב-collection נפרד של תגובות, עם reference" },
        { en: "Stored as one big string", he: "שמורות כמחרוזת אחת גדולה" },
        { en: "Kept only in a cache", he: "שמורות רק ב-cache" }
      ],
      answer: 1,
      explain: { en: "Unbounded arrays hit the 16 MB document limit and make every post read heavy; reference data that grows without bound.", he: "מערכים בלי גבול נתקעים במגבלת 16 MB למסמך והופכים כל קריאה של פוסט לכבדה; עושים reference למידע שגדל בלי גבול." }
    }
  ],
  related: ["pr-db-landscape", "db-indexes", "db-sql-vs-nosql", "pr-ids-pagination", "pr-tenant-isolation-deep", "staff-postgres-at-scale", "staff-zero-downtime-migrations", "pr-ddd"]
});

INFRA.glossary.push(
  { term: "Embedding", track: "principal", def: { en: "A vector of numbers representing the meaning of a text, so similar texts are close in vector space; the basis of semantic search and RAG retrieval.", he: "וקטור של מספרים שמייצג את המשמעות של טקסט, כך שטקסטים דומים קרובים במרחב הווקטורי; הבסיס ל-semantic search ול-retrieval ב-RAG." }, lesson: "pr-ai-systems-design" },
  { term: "LLM-as-judge", track: "principal", def: { en: "Using a model with a strict rubric to grade another model's open-ended answers in evals; must be calibrated against human labels.", he: "שימוש במודל עם rubric קשיח כדי לתת ציון לתשובות פתוחות של מודל אחר ב-evals; חייבים לכייל אותו מול תיוג אנושי." }, lesson: "pr-ai-systems-design" },
  { term: "Semantic cache", track: "principal", def: { en: "A cache keyed by embedding similarity instead of exact text, returning a stored answer for questions that mean the same thing.", he: "Cache שהמפתח שלו הוא דמיון embedding ולא טקסט מדויק, ומחזיר תשובה שמורה לשאלות שמשמעותן זהה." }, lesson: "pr-ai-systems-design" },
  { term: "Model routing", track: "principal", def: { en: "Sending each LLM request to the cheapest model that can handle it (small for easy, large for hard), with fallbacks to other providers.", he: "שליחת כל בקשת LLM למודל הכי זול שיכול לטפל בה (קטן לקלות, גדול לקשות), עם fallbacks לספקים אחרים." }, lesson: "pr-ai-systems-design" },
  { term: "Single-table design", track: "principal", def: { en: "DynamoDB modeling where many entity types share one table and are pre-joined by partition and sort key design around known access patterns.", he: "מידול ב-DynamoDB שבו הרבה סוגי ישויות חולקים טבלה אחת ו'מצורפים' מראש דרך תכנון ה-partition וה-sort key סביב access patterns ידועים." }, lesson: "pr-data-modeling" },
  { term: "SCD Type 2", track: "principal", def: { en: "Slowly changing dimension pattern that keeps every version of a record with valid_from/valid_to, enabling point-in-time queries.", he: "Pattern של slowly changing dimension ששומר כל גרסה של רשומה עם valid_from/valid_to, ומאפשר queries לפי נקודת זמן." }, lesson: "pr-data-modeling" },
  { term: "Surrogate key", track: "principal", def: { en: "A meaningless, stable primary key (bigint, UUID) used instead of a business value like email or SKU, which can change.", he: "Primary key יציב וחסר משמעות (bigint, UUID) שמשמש במקום ערך עסקי כמו מייל או SKU, שיכול להשתנות." }, lesson: "pr-data-modeling" },
  { term: "Denormalization", track: "principal", def: { en: "Deliberately storing a copy of data in a second place to speed up a hot read path, with an explicit owner that keeps the copy in sync.", he: "שמירה מכוונת של עותק של מידע במקום נוסף כדי להאיץ נתיב קריאה חם, עם בעלים מוגדר ששומר על העותק מסונכרן." }, lesson: "pr-data-modeling" }
);
