window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

(function () {
/* Shared code blocks (identical in both languages; code is always LTR). */

const PY_SKLEARN = `<pre>import joblib, numpy as np, pandas as pd
from sklearn.linear_model import LogisticRegression

df = pd.read_parquet("s3://ml-data/churn/2026-11.parquet")      # needs s3fs + pyarrow
X = df[["age", "tenure_days", "tickets_90d"]].to_numpy(dtype=np.float32)
y = df["churned"].to_numpy()
clf = LogisticRegression(max_iter=1000).fit(X, y)

joblib.dump(clf, "model.joblib")   # pickle under the hood: joblib.load() can run ANY code

# Portable, pickle-free alternative: export to ONNX, serve with onnxruntime only
from skl2onnx import to_onnx
open("model.onnx", "wb").write(to_onnx(clf, X[:1]).SerializeToString())

import onnxruntime as ort          # ~50 MB, no scikit-learn / pandas at runtime
sess = ort.InferenceSession("model.onnx", providers=["CPUExecutionProvider"])
print(sess.run(None, {sess.get_inputs()[0].name: X[:2]}))</pre>`;

const PY_PICKLE = `<pre># Why "never unpickle untrusted files": this is a complete exploit
import pickle, os
class Payload:
    def __reduce__(self):
        return (os.system, ("id &gt; /tmp/pwned",))   # runs at LOAD time
open("model.pkl", "wb").write(pickle.dumps(Payload()))
pickle.load(open("model.pkl", "rb"))                # -&gt; executes the command</pre>`;

const PY_TORCH = `<pre>import torch
print(torch.__version__, torch.version.cuda, torch.cuda.is_available(),
      torch.cuda.get_device_capability())
# 2.9.1+cu128  12.8  True  (9, 0)      &lt;- H100 = sm_90

x = torch.randn(4096, 4096, device="cuda", dtype=torch.bfloat16)  # 32 MB on the GPU
y = x @ x                                                          # runs a cuBLAS kernel

model = torch.compile(model)          # first call JIT-compiles kernels: seconds to minutes
state = torch.load("w.pt", weights_only=True)   # default since 2.6; never set it to False
                                                # for a file you didn't produce
print(torch.cuda.max_memory_allocated() / 2**30, "GiB peak")</pre>`;

const PY_HF = `<pre>import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

REPO, REV = "org/model-8b-instruct", "3f1c9a7e..."     # pin a commit SHA, not "main"
tok = AutoTokenizer.from_pretrained(REPO, revision=REV)
model = AutoModelForCausalLM.from_pretrained(
    REPO, revision=REV, dtype=torch.bfloat16, device_map="auto",
    use_safetensors=True,            # refuse pickle .bin weights
    trust_remote_code=False)         # True = run Python from the repo

ids = tok.apply_chat_template([{"role": "user", "content": "ping"}],
                              add_generation_prompt=True, return_tensors="pt").to(model.device)
print(len(ids[0]), "prompt tokens")</pre>
<pre># Pre-fetch weights in CI or an init container, then run offline
hf download org/model-8b-instruct --revision 3f1c9a7e... \\
   --include "*.safetensors" "*.json" --local-dir /models/m8b
export HF_HUB_OFFLINE=1 HF_HOME=/cache/hf      # no surprise downloads at startup</pre>`;

const SERVE_CMDS = `<pre># vLLM: OpenAI-compatible server on :8000, Prometheus metrics on /metrics
vllm serve /models/m8b --served-model-name chat \\
  --max-model-len 32768 --gpu-memory-utilization 0.90

# SGLang: same idea, port 30000 by default
python -m sglang.launch_server --model-path /models/m8b --port 30000

# Local / laptop / edge: llama.cpp with a quantized GGUF file, or Ollama on :11434
llama-server -m model-8b-Q4_K_M.gguf --port 8080 -c 8192
ollama run some-model:8b

# Any of them answers the same request shape
curl -s localhost:8000/v1/chat/completions -H 'content-type: application/json' \\
  -d '{"model":"chat","messages":[{"role":"user","content":"ping"}],"max_tokens":16}'</pre>`;

const PY_APP = `<pre>import os
from openai import OpenAI
import anthropic

# The openai SDK is also the client for vLLM, SGLang, Ollama and most gateways
local = OpenAI(base_url="http://vllm.ai.svc:8000/v1", api_key="unused",
               timeout=30, max_retries=2)        # SDK default timeout is 10 minutes
r = local.chat.completions.create(model="chat",
        messages=[{"role": "user", "content": "ping"}])
print(r.usage.prompt_tokens, r.usage.completion_tokens)

hosted = anthropic.Anthropic(timeout=60, max_retries=3)   # reads ANTHROPIC_API_KEY
msg = hosted.messages.create(model=os.environ["CHAT_MODEL"], max_tokens=512,
        messages=[{"role": "user", "content": "ping"}])
print(msg.usage.input_tokens, msg.usage.output_tokens)</pre>`;

const OTEL_GENAI = `<pre>span: "chat chat"                        kind: CLIENT
  gen_ai.operation.name      = "chat"
  gen_ai.provider.name       = "openai"          # older instrumentations: gen_ai.system
  gen_ai.request.model       = "chat"
  gen_ai.request.max_tokens  = 512
  gen_ai.response.model      = "model-8b-instruct"
  gen_ai.usage.input_tokens  = 1834
  gen_ai.usage.output_tokens = 212
  server.address             = "vllm.ai.svc"
metric: gen_ai.client.token.usage (histogram), gen_ai.client.operation.duration</pre>`;

const DOCKERFILE = `<pre># syntax=docker/dockerfile:1
# ---- build: resolve wheels into a venv (pinned + hashed) ----
FROM nvidia/cuda:12.8.1-base-ubuntu24.04 AS build
RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends python3.12 python3.12-venv \\
 &amp;&amp; rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
WORKDIR /app
COPY requirements.lock .        # torch==2.9.1+cu128 etc., generated with --generate-hashes
RUN --mount=type=cache,target=/root/.cache/uv \\
    uv venv /opt/venv --python /usr/bin/python3.12 \\
 &amp;&amp; VIRTUAL_ENV=/opt/venv uv pip install --require-hashes --no-deps \\
      --extra-index-url https://download.pytorch.org/whl/cu128 -r requirements.lock

# ---- runtime: CUDA "base" (~100 MB), no compilers, no -devel layers ----
FROM nvidia/cuda:12.8.1-base-ubuntu24.04
RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends python3.12 \\
 &amp;&amp; rm -rf /var/lib/apt/lists/* &amp;&amp; useradd -u 10001 -m app
COPY --from=build /opt/venv /opt/venv
COPY --chown=app src/ /app/src/
ENV PATH=/opt/venv/bin:$PATH PYTHONUNBUFFERED=1 \\
    HF_HUB_OFFLINE=1 HF_HOME=/cache/hf TORCHINDUCTOR_CACHE_DIR=/cache/inductor
USER 10001
WORKDIR /app
# weights are NOT baked in: mounted from a PVC / pulled by an init container
CMD ["python", "-m", "src.server"]</pre>`;

const TS_AWS = `<pre>import { S3Client, paginateListObjectsV2, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

// One client per process (it owns the connection pool). Import ONLY the client you use.
const s3 = new S3Client({
  region: "eu-west-1",
  maxAttempts: 4,                 // default 3 = 1 try + 2 retries
  retryMode: "adaptive",          // "standard" + client-side rate limiting on throttles
  requestHandler: { requestTimeout: 5_000, httpsAgent: { maxSockets: 100 } }, // default 50
  // Default chain: env -&gt; SSO/ini -&gt; web identity (IRSA) -&gt; container (ECS, EKS Pod Identity) -&gt; IMDS.
  // Cross-account: assume a role on top of whatever the chain found.
  credentials: fromTemporaryCredentials({ params: { RoleArn: process.env.REPORTS_ROLE_ARN! } }),
});

// Paginators: async iterators that follow ContinuationToken for you
for await (const page of paginateListObjectsV2({ client: s3, pageSize: 1000 }, { Bucket: "invoices" })) {
  for (const obj of page.Contents ?? []) console.log(obj.Key, obj.Size);
}

// Middleware: every request passes through a stack you can hook into
s3.middlewareStack.add(
  (next, ctx) =&gt; async (args) =&gt; {
    const t0 = performance.now();
    try { return await next(args); }
    finally { console.log(ctx.commandName, Math.round(performance.now() - t0), "ms"); }
  },
  { step: "initialize", name: "timingMiddleware" },
);

const res = await s3.send(new GetObjectCommand({ Bucket: "invoices", Key: "2026/11/a.pdf" }),
                          { abortSignal: AbortSignal.timeout(10_000) });
const bytes = await res.Body!.transformToByteArray();   // ALWAYS consume or destroy the stream</pre>`;

const TS_ZOD = `<pre>import { z } from "zod";      // zod 4

// 1) Env vars: crash at boot, not at 3 a.m. on the first request that reads them
const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  FEATURE_X: z.stringbool().default(false),        // "true"/"1"/"yes"/"on" -&gt; true
});
export const env = Env.parse(process.env);

// 2) API input: one schema = validation + TypeScript type
export const CreateOrder = z.object({
  customerId: z.uuid(),
  items: z.array(z.object({ sku: z.string().min(1), qty: z.number().int().positive() })).min(1).max(100),
  coupon: z.string().max(32).optional(),
}).strict();                                       // reject unknown fields
export type CreateOrder = z.infer&lt;typeof CreateOrder&gt;;

const parsed = CreateOrder.safeParse(req.body);
if (!parsed.success) return reply.code(400).send({ error: z.prettifyError(parsed.error) });

// 3) LLM tool arguments: the model is an untrusted client
const RefundArgs = z.object({ orderId: z.string().regex(/^ord_[a-z0-9]{12}$/),
                              amountCents: z.number().int().positive().max(50_000) });
const tool = { name: "refund_order", description: "Refund part of an order",
               input_schema: z.toJSONSchema(RefundArgs) };       // JSON Schema for the LLM API
const args = RefundArgs.parse(toolCall.input);   // validate what came BACK before acting</pre>`;

const TS_HTTP = `<pre>import { Agent, fetch, interceptors } from "undici";

// Node's global fetch IS undici. A dedicated Agent gives you pool + keep-alive control.
const upstream = new Agent({
  connections: 64,              // max sockets per origin
  keepAliveTimeout: 4_000,      // must be SHORTER than the server's idle timeout
  connect: { timeout: 2_000 },
}).compose(interceptors.retry({ maxRetries: 2, minTimeout: 200, maxTimeout: 2_000,
  methods: ["GET", "HEAD", "PUT", "DELETE"],          // idempotent only
  statusCodes: [429, 502, 503, 504] }));

const res = await fetch("https://pricing.internal/v1/quote", {
  method: "POST",
  headers: { "content-type": "application/json", "idempotency-key": key },
  body: JSON.stringify(input),
  dispatcher: upstream,
  signal: AbortSignal.timeout(3_000),    // whole request deadline; fetch has none by default
});
if (!res.ok) { await res.body?.cancel(); throw new Error("pricing " + res.status); }
const quote = Quote.parse(await res.json());          // zod again: responses are input too</pre>
<pre>import pino from "pino";

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { svc: "orders-api" },
  redact: { paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.apiKey"],
            censor: "[REDACTED]" },
});
const reqLog = log.child({ requestId, tenantId });   // every line below carries both fields
reqLog.info({ orderId }, "order created");
// {"level":30,"time":1763380000000,"svc":"orders-api","requestId":"r-91","tenantId":"t-7","orderId":"o-1","msg":"order created"}</pre>`;

const TS_OTEL = `<pre>// otel.ts -- loaded BEFORE the app:  node --import ./dist/otel.js dist/main.js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

new NodeSDK({
  serviceName: "orders-api",
  traceExporter: new OTLPTraceExporter(),          // OTEL_EXPORTER_OTLP_ENDPOINT
  instrumentations: [getNodeAutoInstrumentations({
    "@opentelemetry/instrumentation-fs": { enabled: false },   // very noisy
  })],
}).start();</pre>
<pre>// Manual span around business logic the auto-instrumentation can't see
import { trace, SpanStatusCode } from "@opentelemetry/api";
const tracer = trace.getTracer("orders");

export async function priceCart(cart: Cart): Promise&lt;number&gt; {
  return tracer.startActiveSpan("price-cart", async (span) =&gt; {
    span.setAttribute("cart.items", cart.items.length);
    try { return await computeTotal(cart); }
    catch (e) { span.recordException(e as Error); span.setStatus({ code: SpanStatusCode.ERROR }); throw e; }
    finally { span.end(); }                        // forget this = span never exported
  });
}</pre>`;

const TS_DATA = `<pre>// Drizzle: SQL-shaped, schema in TS, no codegen step
const rows = await db.select({ id: orders.id, total: orders.totalCents })
  .from(orders).where(and(eq(orders.tenantId, t), gt(orders.createdAt, since))).limit(50);

// Kysely: a typed query builder, nothing more (types from kysely-codegen or by hand)
const rows2 = await kdb.selectFrom("orders").select(["id", "total_cents"])
  .where("tenant_id", "=", t).orderBy("created_at", "desc").limit(50).execute();

// Prisma: schema.prisma + generated client, the nicest DX for CRUD
const rows3 = await prisma.order.findMany({ where: { tenantId: t }, take: 50,
  include: { items: true } });                     // watch the SQL this generates</pre>
<pre>// Integration test against a real Postgres (vitest + testcontainers)
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { beforeAll, afterAll, it, expect } from "vitest";

let pg: StartedPostgreSqlContainer;
beforeAll(async () =&gt; { pg = await new PostgreSqlContainer("postgres:17-alpine").start();
                        await migrate(pg.getConnectionUri()); }, 60_000);
afterAll(async () =&gt; { await pg.stop(); });

it("is idempotent on duplicate events", async () =&gt; {
  await handleEvent(evt); await handleEvent(evt);
  expect(await countInvoices(pg.getConnectionUri(), evt.orderId)).toBe(1);
});</pre>`;

const TS_BULL = `<pre>import { Queue, Worker } from "bullmq";
const connection = { host: "redis", port: 6379, maxRetriesPerRequest: null };  // required by Worker

const emails = new Queue("emails", { connection });
await emails.add("welcome", { userId }, {
  jobId: "welcome:" + userId,                       // de-dupe: same id = not added twice
  attempts: 5, backoff: { type: "exponential", delay: 1_000 },
  removeOnComplete: 1_000, removeOnFail: 5_000 });  // or Redis fills up forever

new Worker("emails", async (job) =&gt; sendWelcome(job.data.userId), { connection, concurrency: 20 });
// Redis for BullMQ MUST run with maxmemory-policy noeviction</pre>`;

const TS_SQS = `<pre>import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand,
         type Message, type MessageAttributeValue } from "@aws-sdk/client-sqs";
import { context, propagation, trace, SpanKind, SpanStatusCode,
         type TextMapGetter } from "@opentelemetry/api";
import { z } from "zod";
import pino from "pino";
import { Pool } from "pg";

// ---- config: validated once at boot ----
const env = z.object({
  QUEUE_URL: z.url(),
  AWS_REGION: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  VISIBILITY_SECONDS: z.coerce.number().int().min(10).max(43_200).default(60),
}).parse(process.env);

// ---- the contract: what a message MUST look like ----
const OrderPlaced = z.object({
  eventId: z.uuid(),                    // idempotency key, set by the PRODUCER
  type: z.literal("order.placed"),
  orderId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.enum(["USD", "EUR", "ILS"]),
});
type OrderPlaced = z.infer&lt;typeof OrderPlaced&gt;;

const log = pino({ base: { svc: "invoice-consumer" } });
const tracer = trace.getTracer("invoice-consumer");
const sqs = new SQSClient({ region: env.AWS_REGION, maxAttempts: 5 });
const db = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

// W3C traceparent travels in SQS message attributes (max 10 attributes per message)
type Attrs = Record&lt;string, MessageAttributeValue&gt;;
const getter: TextMapGetter&lt;Attrs&gt; = {
  keys: (c) =&gt; Object.keys(c),
  get: (c, k) =&gt; c[k]?.StringValue,
};

class PoisonMessage extends Error {}

function parse(msg: Message): OrderPlaced {
  let raw: unknown;
  try { raw = JSON.parse(msg.Body ?? ""); } catch { throw new PoisonMessage("body is not JSON"); }
  const r = OrderPlaced.safeParse(raw);
  if (!r.success) throw new PoisonMessage(z.prettifyError(r.error));
  return r.data;
}

// Exactly-once EFFECT on top of at-least-once delivery:
// dedupe row + business write in ONE transaction.
async function apply(evt: OrderPlaced): Promise&lt;"done" | "duplicate"&gt; {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const ins = await c.query(
      "INSERT INTO processed_events (event_id, processed_at) VALUES ($1, now()) ON CONFLICT DO NOTHING",
      [evt.eventId]);
    if (ins.rowCount === 0) { await c.query("ROLLBACK"); return "duplicate"; }
    await c.query("INSERT INTO invoices (order_id, amount_cents, currency) VALUES ($1, $2, $3)",
      [evt.orderId, evt.amountCents, evt.currency]);
    await c.query("COMMIT");
    return "done";
  } catch (e) { await c.query("ROLLBACK"); throw e; }
  finally { c.release(); }
}

async function handle(msg: Message): Promise&lt;void&gt; {
  const parent = propagation.extract(context.active(), (msg.MessageAttributes ?? {}) as Attrs, getter);
  await tracer.startActiveSpan("invoice-queue process", {
    kind: SpanKind.CONSUMER,
    attributes: { "messaging.system": "aws_sqs", "messaging.message.id": msg.MessageId ?? "",
                  "messaging.operation.type": "process" },
  }, parent, async (span) =&gt; {
    const mlog = log.child({ messageId: msg.MessageId, traceId: span.spanContext().traceId,
                             receiveCount: msg.Attributes?.ApproximateReceiveCount });
    try {
      const evt = parse(msg);
      const outcome = await apply(evt);
      span.setAttribute("app.outcome", outcome);
      mlog.info({ eventId: evt.eventId, outcome }, "processed");
      // delete ONLY after the commit; a crash before this line = redelivery = dedupe row catches it
      await sqs.send(new DeleteMessageCommand({ QueueUrl: env.QUEUE_URL, ReceiptHandle: msg.ReceiptHandle! }));
    } catch (e) {
      span.recordException(e as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      // Not deleted: becomes visible again after the timeout; after maxReceiveCount the
      // queue's redrive policy moves it to the DLQ. Poison messages get there the same way.
      mlog.error({ err: e, poison: e instanceof PoisonMessage }, "processing failed");
    } finally { span.end(); }
  });
}

let stopping = false;
process.on("SIGTERM", () =&gt; { stopping = true; log.info("draining"); });

while (!stopping) {
  const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: env.QUEUE_URL,
    MaxNumberOfMessages: 10,             // batch: fewer API calls, lower cost
    WaitTimeSeconds: 20,                 // long polling: no busy loop of empty receives
    VisibilityTimeout: env.VISIBILITY_SECONDS,   // &gt; worst-case processing time
    MessageAttributeNames: ["All"],
    MessageSystemAttributeNames: ["ApproximateReceiveCount"],
  }));
  await Promise.allSettled(Messages.map(handle));   // finish the in-flight batch, then re-check
}
await db.end();                          // terminationGracePeriodSeconds must be &gt; 20s poll + batch</pre>`;

/* ================================================================== */
INFRA.lessons.push({
  id: "ml-llm-library-map",
  track: "ai",
  order: 15,
  icon: "🧱",
  level: 2,
  minutes: 18,
  title: { en: "The ML and LLM Library Map for Infra Engineers", he: "מפת ספריות ה-ML וה-LLM למהנדסי תשתיות" },
  tldr: {
    en: "AI services are a stack of Python (and some TS) libraries: NumPy and pandas at the bottom, scikit-learn and PyTorch for models, Hugging Face for weights and tokenizers, vLLM or SGLang to serve, SDKs and frameworks to call them, OpenTelemetry to watch them. You don't need to train models to run them well; you need to know which layer pulls in CUDA, which file format executes code on load, and what to pin.",
    he: "שירות AI הוא ערימה של ספריות Python (וקצת TS): NumPy ו-pandas בתחתית, scikit-learn ו-PyTorch למודלים, Hugging Face למשקולות ול-tokenizers, vLLM או SGLang להגשה, SDKs ו-frameworks כדי לקרוא להם, ו-OpenTelemetry כדי לראות מה קורה. לא צריך לאמן מודלים כדי להריץ אותם טוב. צריך לדעת איזו שכבה מושכת CUDA, איזה פורמט קובץ מריץ קוד כשטוענים אותו, ומה לנעול גרסה."
  },
  analogy: {
    en: "Think of a restaurant kitchen. NumPy is the knife set, pandas the prep station, PyTorch the industrial oven that only runs on a specific gas pressure (the CUDA driver). Hugging Face is the supplier who delivers ingredients, sometimes sealed (safetensors), sometimes in an unlabeled box that might contain a live animal (pickle). vLLM is the line cook plating 200 dishes at once, and the SDKs are the waiters. Your job is not to cook. It is to make sure the gas pressure matches the oven, nothing enters the kitchen unsealed, and you know which station is slow.",
    he: "תחשוב על מטבח של מסעדה. NumPy זה סט הסכינים, pandas עמדת ההכנה, ו-PyTorch הוא התנור התעשייתי שעובד רק בלחץ גז מסוים (ה-driver של CUDA). Hugging Face הוא הספק שמביא את חומרי הגלם: לפעמים באריזה אטומה (safetensors), לפעמים בקופסה בלי תווית שאולי יש בה חיה (pickle). vLLM הוא הטבח בפס שמוציא 200 מנות במקביל, וה-SDKs הם המלצרים. התפקיד שלך הוא לא לבשל. התפקיד שלך הוא לוודא שלחץ הגז מתאים לתנור, ששום דבר לא נכנס למטבח בלי אריזה אטומה, ושאתה יודע איזו עמדה איטית."
  },
  sections: [
    {
      h: { en: "Layer 1: NumPy, pandas, scikit-learn (classic ML)", he: "שכבה 1: NumPy, pandas, scikit-learn (ML קלאסי)" },
      body: {
        en: `<p><strong>NumPy</strong> is the n-dimensional array everything else is built on: contiguous memory plus C/Fortran kernels (BLAS). <strong>pandas</strong> is a table (DataFrame) on top of NumPy or Arrow. <strong>scikit-learn</strong> is classic ML (regression, trees, clustering) and still powers most fraud, churn and ranking models. It runs fine on CPU.</p>
<table>
<tr><th>Library</th><th>What infra cares about</th></tr>
<tr><td>NumPy</td><td>Ships its own OpenBLAS, which by default starts one thread per core. Ten workers on a 64-core node = 640 threads fighting. Set <code>OMP_NUM_THREADS</code> / <code>OPENBLAS_NUM_THREADS</code> to the CPU limit.</td></tr>
<tr><td>pandas</td><td>Loads the whole table into RAM, often 2-5x the file size. A 4 GB Parquet file can OOMKill a 8 Gi pod. Pin the major: pandas 2 to 3 changed defaults (copy-on-write, string dtype).</td></tr>
<tr><td>scikit-learn</td><td>Models are saved with pickle/joblib. A model trained on 1.5 may refuse to load, or load and behave differently, on 1.7. Pin training and serving to the same version.</td></tr>
</table>
${PY_SKLEARN}
<p><strong>The pickle problem.</strong> <code>pickle</code>, <code>joblib</code>, and old PyTorch <code>.bin</code>/<code>.pt</code> files are not data. They are a small program that Python runs to rebuild the object. Loading one from an untrusted source is remote code execution:</p>
${PY_PICKLE}
<p>Safer options: <strong>ONNX</strong> (a graph format; run it with <code>onnxruntime</code> in a small image, even from Node or Go), <code>skops</code> for scikit-learn with an allow-list of types, and <code>safetensors</code> for neural network weights. If you must accept pickles, scan them (<code>modelscan</code>, <code>picklescan</code>) and only load artifacts your own pipeline signed.</p>`,
        he: `<p><strong>NumPy</strong> הוא המערך ה-n-ממדי שכל השאר בנוי עליו: זיכרון רציף ועוד kernels של C/Fortran (BLAS). <strong>pandas</strong> הוא טבלה (DataFrame) מעל NumPy או Arrow. <strong>scikit-learn</strong> זה ML קלאסי (רגרסיה, עצים, clustering), והוא עדיין מריץ את רוב מודלי ה-fraud, ה-churn וה-ranking. הוא רץ טוב על CPU.</p>
<table>
<tr><th>ספרייה</th><th>מה מעניין את התשתיות</th></tr>
<tr><td>NumPy</td><td>מגיעה עם OpenBLAS משלה, שכברירת מחדל פותח thread לכל core. עשרה workers על node עם 64 cores זה 640 threads שנלחמים זה בזה. תגדיר <code>OMP_NUM_THREADS</code> ו-<code>OPENBLAS_NUM_THREADS</code> לפי ה-CPU limit.</td></tr>
<tr><td>pandas</td><td>טוען את כל הטבלה ל-RAM, הרבה פעמים פי 2-5 מגודל הקובץ. קובץ Parquet של 4 GB יכול לגרום ל-OOMKill ב-Pod עם 8 Gi. תנעל את ה-major: המעבר מ-pandas 2 ל-3 שינה defaults (copy-on-write, string dtype).</td></tr>
<tr><td>scikit-learn</td><td>מודלים נשמרים עם pickle/joblib. מודל שאומן ב-1.5 יכול לסרב להיטען ב-1.7, או להיטען ולהתנהג אחרת. תנעל את אותה גרסה ב-training וב-serving.</td></tr>
</table>
${PY_SKLEARN}
<p><strong>בעיית ה-pickle.</strong> קבצי <code>pickle</code>, <code>joblib</code> וקבצי <code>.bin</code>/<code>.pt</code> ישנים של PyTorch הם לא data. הם תוכנית קטנה ש-Python מריץ כדי לבנות מחדש את האובייקט. לטעון כזה ממקור לא מהימן זה remote code execution:</p>
${PY_PICKLE}
<p>אפשרויות בטוחות יותר: <strong>ONNX</strong> (פורמט של גרף; מריצים אותו עם <code>onnxruntime</code> ב-image קטן, אפילו מ-Node או Go), <code>skops</code> ל-scikit-learn עם allow-list של טיפוסים, ו-<code>safetensors</code> למשקולות של רשתות נוירונים. אם אין ברירה וצריך לקבל pickles, תסרוק אותם (<code>modelscan</code>, <code>picklescan</code>) ותטען רק artifacts שה-pipeline שלך חתם עליהם.</p>`
      }
    },
    {
      h: { en: "Layer 2: PyTorch and the CUDA version matrix", he: "שכבה 2: PyTorch ומטריצת הגרסאות של CUDA" },
      body: {
        en: `<p><strong>PyTorch</strong> is tensors (NumPy-like arrays that can live on a GPU) plus autograd plus a huge library of GPU kernels. <code>torch.compile</code> traces your model and generates fused kernels (via Triton the compiler, not Triton the server), often 1.3-2x faster, at the price of a slow first call.</p>
${PY_TORCH}
<p><strong>Why images break: four versions must line up.</strong></p>
<table>
<tr><th>Piece</th><th>Where it lives</th><th>Rule</th></tr>
<tr><td>NVIDIA driver</td><td>The node (host), injected by the container toolkit</td><td>Must be new enough for the CUDA runtime: CUDA 12.x needs driver 525+ (with minor-version compatibility), CUDA 13 needs 580+</td></tr>
<tr><td>CUDA runtime + cuDNN, NCCL</td><td>Inside the PyTorch wheel (the <code>nvidia-*</code> pip packages) or the base image</td><td>Chosen by the wheel tag: <code>+cu126</code>, <code>+cu128</code>, <code>+cu130</code></td></tr>
<tr><td>PyTorch build</td><td>Your image</td><td>Compiled for a list of GPU architectures (sm_80, sm_90, sm_100...)</td></tr>
<tr><td>GPU</td><td>The node</td><td>Newer GPUs need a build that includes their architecture: Blackwell needs CUDA 12.8+ builds</td></tr>
</table>
<p>Classic failures: <code>CUDA driver version is insufficient for CUDA runtime version</code> (image newer than the node driver), <code>no kernel image is available for execution on the device</code> (wheel compiled without your GPU's architecture), and <code>torch.cuda.is_available() == False</code> because someone ran <code>pip install torch</code> without the CUDA index and got a different build. Note that <code>nvidia-smi</code>'s "CUDA Version" is the <em>maximum</em> the driver supports, not what is installed.</p>
<p><strong>Size.</strong> The CUDA PyTorch wheel plus its NVIDIA dependencies is ~3-4 GB installed. Start from a <code>-devel</code> CUDA image, add transformers, a serving engine and a few "just in case" tools, and you land at 5-10 GB per image. That means minutes of image pull on every new GPU node, which kills autoscaling. See <code>container-slim-images</code> and the Dockerfile below.</p>`,
        he: `<p><strong>PyTorch</strong> זה tensors (מערכים בסגנון NumPy שיכולים לשבת על GPU), ועוד autograd, ועוד ספרייה ענקית של GPU kernels. <code>torch.compile</code> עוקב אחרי המודל ומייצר kernels מאוחדים (דרך Triton הקומפיילר, לא Triton השרת). הרבה פעמים זה מהיר פי 1.3-2, והמחיר הוא קריאה ראשונה איטית.</p>
${PY_TORCH}
<p><strong>למה images נשברים: ארבע גרסאות צריכות להתאים.</strong></p>
<table>
<tr><th>רכיב</th><th>איפה הוא יושב</th><th>הכלל</th></tr>
<tr><td>NVIDIA driver</td><td>על ה-node (ה-host), מוזרק ע"י ה-container toolkit</td><td>חייב להיות חדש מספיק ל-CUDA runtime: CUDA 12.x צריך driver 525+ (עם minor-version compatibility), CUDA 13 צריך 580+</td></tr>
<tr><td>CUDA runtime, cuDNN, NCCL</td><td>בתוך ה-wheel של PyTorch (חבילות ה-pip של <code>nvidia-*</code>) או ב-base image</td><td>נקבע לפי ה-tag של ה-wheel: <code>+cu126</code>, <code>+cu128</code>, <code>+cu130</code></td></tr>
<tr><td>ה-build של PyTorch</td><td>ה-image שלך</td><td>מקומפל לרשימה של ארכיטקטורות GPU (sm_80, sm_90, sm_100...)</td></tr>
<tr><td>GPU</td><td>ה-node</td><td>GPU חדש צריך build שכולל את הארכיטקטורה שלו: Blackwell צריך builds של CUDA 12.8 ומעלה</td></tr>
</table>
<p>תקלות קלאסיות: <code>CUDA driver version is insufficient for CUDA runtime version</code> (ה-image חדש יותר מה-driver של ה-node), <code>no kernel image is available for execution on the device</code> (ה-wheel קומפל בלי הארכיטקטורה של ה-GPU שלך), ו-<code>torch.cuda.is_available() == False</code> כי מישהו הריץ <code>pip install torch</code> בלי ה-index של CUDA וקיבל build אחר. שים לב: ה-"CUDA Version" שמופיע ב-<code>nvidia-smi</code> הוא ה<em>מקסימום</em> שה-driver תומך בו, לא מה שמותקן.</p>
<p><strong>גודל.</strong> ה-wheel של PyTorch עם CUDA ועוד התלויות של NVIDIA זה בערך 3-4 GB אחרי התקנה. תתחיל מ-image של CUDA מסוג <code>-devel</code>, תוסיף transformers, מנוע serving וכמה כלים "ליתר ביטחון", ואתה ב-5-10 GB ל-image. זה אומר דקות של image pull בכל GPU node חדש, וזה הורג את ה-autoscaling. ראה <code>container-slim-images</code> ואת ה-Dockerfile בהמשך.</p>`
      }
    },
    {
      h: { en: "Layer 3: Hugging Face (transformers, tokenizers, datasets, the Hub, safetensors)", he: "שכבה 3: Hugging Face (transformers, tokenizers, datasets, ה-Hub, safetensors)" },
      body: {
        en: `<ul>
<li><strong>transformers</strong>: Python model definitions for hundreds of architectures, plus <code>AutoModel</code>/<code>AutoTokenizer</code> loaders. Version 5 went PyTorch-only and positions itself as the reference definition that engines like vLLM and SGLang build on.</li>
<li><strong>tokenizers</strong>: the Rust tokenizer. Token counts drive cost, context limits and rate limits, so this is the library your gateway uses to count before sending.</li>
<li><strong>datasets</strong>: Arrow-backed datasets with memory-mapping and streaming. Its cache silently fills node disks (<code>~/.cache/huggingface</code>).</li>
<li><strong>The Hub</strong>: git-like repos of weights, configs and tokenizers, each with commit SHAs. Treat it like a public package registry: pin, mirror, scan.</li>
<li><strong>safetensors</strong>: a weights format that is a JSON header plus raw tensor bytes. Loading cannot run code, and it can be memory-mapped (fast, zero-copy). Prefer it over <code>.bin</code> (pickle) every time.</li>
</ul>
${PY_HF}
<blockquote>⚠️ Production tip: <code>trust_remote_code=True</code> downloads and runs Python from the model repo at load time. Treat it like <code>curl | bash</code>: allow only for repos you mirrored and reviewed, pinned to a SHA. Same for a tokenizer or chat template that changed under a moving <code>main</code>: the model "got worse" overnight and nobody deployed anything.</blockquote>`,
        he: `<ul>
<li><strong>transformers</strong>: הגדרות מודל ב-Python למאות ארכיטקטורות, ועוד loaders כמו <code>AutoModel</code> ו-<code>AutoTokenizer</code>. גרסה 5 עברה ל-PyTorch בלבד ומציגה את עצמה כהגדרת הייחוס שמנועים כמו vLLM ו-SGLang נשענים עליה.</li>
<li><strong>tokenizers</strong>: ה-tokenizer שכתוב ב-Rust. מספר ה-tokens קובע עלות, גבולות context ו-rate limits, אז זו הספרייה שה-gateway שלך סופר איתה לפני שליחה.</li>
<li><strong>datasets</strong>: datasets מבוססי Arrow עם memory-mapping ו-streaming. ה-cache שלו ממלא בשקט את הדיסקים של ה-nodes (<code>~/.cache/huggingface</code>).</li>
<li><strong>ה-Hub</strong>: repos בסגנון git של משקולות, configs ו-tokenizers, לכל אחד יש commit SHA. תתייחס אליו כמו ל-registry ציבורי של חבילות: לנעול, לעשות mirror, לסרוק.</li>
<li><strong>safetensors</strong>: פורמט משקולות שהוא header של JSON ועוד bytes גולמיים של tensors. הטעינה לא יכולה להריץ קוד, ואפשר לעשות לו memory-map (מהיר, zero-copy). תעדיף אותו על פני <code>.bin</code> (pickle) תמיד.</li>
</ul>
${PY_HF}
<blockquote>⚠️ Production tip: <code>trust_remote_code=True</code> מוריד ומריץ Python מה-repo של המודל בזמן הטעינה. תתייחס לזה כמו ל-<code>curl | bash</code>: לאשר רק ל-repos שעשית להם mirror ובדקת, נעולים ל-SHA. אותו דבר ל-tokenizer או ל-chat template שהשתנו מתחת ל-<code>main</code> זז: המודל "נהיה גרוע" בלילה ואף אחד לא עשה deploy.</blockquote>`
      }
    },
    {
      h: { en: "Layer 4: serving engines", he: "שכבה 4: מנועי serving" },
      body: {
        en: `<table>
<tr><th>Engine</th><th>Use it for</th><th>Infra notes</th></tr>
<tr><td><strong>vLLM</strong></td><td>The default open-source LLM server</td><td>OpenAI-compatible API, Prometheus <code>/metrics</code>, preallocates ~90% of GPU memory for KV cache at start (so the GPU always "looks full"). Large image, frequent releases: pin and test upgrades.</td></tr>
<tr><td><strong>SGLang</strong></td><td>Shared-prefix, agentic and structured-output heavy traffic</td><td>Same API shape; strong prefix reuse. Swap-in alternative to vLLM, benchmark both on your traffic.</td></tr>
<tr><td><strong>TGI</strong> (Hugging Face)</td><td>Existing deployments only</td><td>In maintenance mode since late 2025; Hugging Face itself points new deployments to vLLM or SGLang. Plan a migration.</td></tr>
<tr><td><strong>Triton Inference Server</strong> (NVIDIA)</td><td>Many model types in one server: ONNX, TensorRT, PyTorch, Python backends</td><td>Model repository on disk or S3, dynamic batching, gRPC/HTTP. Common for classic ML and vision; now part of NVIDIA's Dynamo platform.</td></tr>
<tr><td><strong>llama.cpp / Ollama</strong></td><td>Laptops, CI, edge, CPU or Apple silicon</td><td>Quantized GGUF files, tiny footprint. Not built for multi-tenant high throughput; fine for dev and on-device.</td></tr>
</table>
${SERVE_CMDS}
<p>Because they all speak the OpenAI API shape, the app layer can switch engines by changing a base URL. That is the seam an AI gateway sits on (<code>ai-gateway-design</code>). GPU sizing, KV cache and batching are covered in <code>ai-llm-serving</code> and <code>k8s-gpu-inference</code>.</p>`,
        he: `<table>
<tr><th>מנוע</th><th>מתי משתמשים</th><th>הערות תשתית</th></tr>
<tr><td><strong>vLLM</strong></td><td>ברירת המחדל לשרת LLM בקוד פתוח</td><td>API תואם OpenAI, <code>/metrics</code> של Prometheus, תופס מראש ~90% מזיכרון ה-GPU ל-KV cache בעלייה (לכן ה-GPU תמיד "נראה מלא"). image גדול, releases תכופים: לנעול גרסה ולבדוק upgrades.</td></tr>
<tr><td><strong>SGLang</strong></td><td>תעבורה עם prefixes משותפים, agents ו-structured output</td><td>אותו API; שימוש חוזר חזק ב-prefix. חלופה ל-vLLM שאפשר להחליף, תעשה benchmark לשניהם על התעבורה שלך.</td></tr>
<tr><td><strong>TGI</strong> (Hugging Face)</td><td>רק ל-deployments קיימים</td><td>ב-maintenance mode מסוף 2025; Hugging Face עצמם מפנים deployments חדשים ל-vLLM או SGLang. תתכנן מיגרציה.</td></tr>
<tr><td><strong>Triton Inference Server</strong> (NVIDIA)</td><td>הרבה סוגי מודלים בשרת אחד: ONNX, TensorRT, PyTorch, backends של Python</td><td>Model repository על דיסק או S3, dynamic batching, gRPC/HTTP. נפוץ ל-ML קלאסי ול-vision; היום חלק מפלטפורמת Dynamo של NVIDIA.</td></tr>
<tr><td><strong>llama.cpp / Ollama</strong></td><td>לפטופים, CI, edge, CPU או Apple silicon</td><td>קבצי GGUF מכווצים (quantized), footprint קטן. לא בנוי ל-throughput גבוה עם הרבה tenants; מצוין ל-dev ול-on-device.</td></tr>
</table>
${SERVE_CMDS}
<p>כיוון שכולם מדברים ב-API בצורה של OpenAI, שכבת האפליקציה יכולה להחליף מנוע ע"י שינוי של base URL. זה בדיוק התפר שעליו יושב AI gateway (<code>ai-gateway-design</code>). גודל GPU, KV cache ו-batching מכוסים ב-<code>ai-llm-serving</code> וב-<code>k8s-gpu-inference</code>.</p>`
      }
    },
    {
      h: { en: "Layers 5-6: the app layer and observability", he: "שכבות 5-6: שכבת האפליקציה ו-observability" },
      body: {
        en: `<table>
<tr><th>Library</th><th>What it is</th><th>What infra cares about</th></tr>
<tr><td><code>openai</code>, <code>anthropic</code> SDKs (Python and TS)</td><td>Thin typed clients for the provider APIs</td><td>Built-in retries (default 2) with backoff, a default timeout of 10 minutes (set your own), streaming over SSE. The <code>openai</code> client also talks to vLLM, SGLang, Ollama and most gateways via <code>base_url</code>.</td></tr>
<tr><td>LangChain / LangGraph (1.x)</td><td>LangChain: integrations and a standard agent loop. LangGraph: agents as durable state graphs with checkpoints</td><td>Dependency sprawl (pin each <code>langchain-*</code> integration package). LangGraph checkpointers need a real store (Postgres), not memory, in production.</td></tr>
<tr><td>LlamaIndex</td><td>Data and RAG framework: loaders, indexes, query engines, workflows</td><td>Loaders pull many parsers (PDF, Office); ingestion jobs are memory-hungry batch workloads.</td></tr>
<tr><td>MCP SDKs (<code>@modelcontextprotocol/sdk</code>, Python <code>mcp</code>)</td><td>Build MCP servers and clients that expose tools to agents</td><td>Each server is a service with auth, egress and secrets; see <code>ai-mcp-servers</code>.</td></tr>
</table>
${PY_APP}
<p><strong>Observability.</strong> OpenTelemetry has GenAI semantic conventions (still marked "development", so attribute names can still move) for spans and metrics of model calls. Instrumentations exist for the openai SDK, vLLM and the frameworks:</p>
${OTEL_GENAI}
<p><strong>Langfuse</strong> is an open-source LLM observability product (traces, prompt versions, evals, cost per user) whose current SDKs are built on OpenTelemetry. Self-hosted, it is Postgres + ClickHouse + Redis + object storage: a real stateful service to run. Prompts and completions in traces are sensitive data: decide on redaction and retention before you turn it on.</p>`,
        he: `<table>
<tr><th>ספרייה</th><th>מה זה</th><th>מה מעניין את התשתיות</th></tr>
<tr><td>ה-SDKs של <code>openai</code> ו-<code>anthropic</code> (Python ו-TS)</td><td>clients דקים ו-typed ל-APIs של הספקים</td><td>retries מובנים (2 כברירת מחדל) עם backoff, timeout ברירת מחדל של 10 דקות (תגדיר משלך), streaming על SSE. ה-client של <code>openai</code> מדבר גם עם vLLM, SGLang, Ollama ורוב ה-gateways דרך <code>base_url</code>.</td></tr>
<tr><td>LangChain / LangGraph (1.x)</td><td>LangChain: אינטגרציות ולולאת agent סטנדרטית. LangGraph: agents כגרף state עמיד עם checkpoints</td><td>התפשטות תלויות (תנעל כל חבילת אינטגרציה של <code>langchain-*</code>). ל-checkpointers של LangGraph צריך store אמיתי (Postgres) ב-production, לא זיכרון.</td></tr>
<tr><td>LlamaIndex</td><td>framework ל-data ו-RAG: loaders, indexes, query engines, workflows</td><td>ה-loaders מושכים הרבה parsers (PDF, Office); jobs של ingestion הם batch שאוכל הרבה זיכרון.</td></tr>
<tr><td>ה-SDKs של MCP (<code>@modelcontextprotocol/sdk</code>, ו-<code>mcp</code> של Python)</td><td>בניית MCP servers ו-clients שחושפים tools ל-agents</td><td>כל server הוא שירות עם auth, egress ו-secrets; ראה <code>ai-mcp-servers</code>.</td></tr>
</table>
${PY_APP}
<p><strong>Observability.</strong> ל-OpenTelemetry יש GenAI semantic conventions ל-spans ול-metrics של קריאות למודל. הן עדיין מסומנות "development", אז שמות attributes עוד יכולים לזוז. יש instrumentations ל-SDK של openai, ל-vLLM ול-frameworks:</p>
${OTEL_GENAI}
<p><strong>Langfuse</strong> הוא מוצר observability ל-LLM בקוד פתוח (traces, גרסאות prompt, evals, עלות לכל משתמש), וה-SDKs העדכניים שלו בנויים על OpenTelemetry. ב-self-host זה Postgres, ClickHouse, Redis ו-object storage: שירות stateful אמיתי שצריך להריץ. prompts ו-completions בתוך traces הם מידע רגיש. תחליט על redaction ועל retention לפני שאתה מדליק את זה.</p>`
      }
    },
    {
      h: { en: "What to pin and scan, and a slim CUDA image", he: "מה לנעול ומה לסרוק, ו-image רזה של CUDA" },
      body: {
        en: `<table>
<tr><th>Pin</th><th>How</th></tr>
<tr><td>Python packages, including transitive ones</td><td>A lock file with hashes (<code>uv pip compile --generate-hashes</code>, <code>uv.lock</code>); install with <code>--require-hashes</code></td></tr>
<tr><td>The PyTorch build variant</td><td>Exact <code>torch==2.9.1+cu128</code> from the PyTorch index, not "latest torch"</td></tr>
<tr><td>Base image</td><td>Tag plus digest (<code>nvidia/cuda:12.8.1-base-ubuntu24.04@sha256:...</code>)</td></tr>
<tr><td>Node GPU driver</td><td>Node image / GPU operator version per node pool; record the minimum driver your images need</td></tr>
<tr><td>Model weights, tokenizer, chat template</td><td>Hub commit SHA, mirrored to your own bucket or registry with a checksum</td></tr>
<tr><td>Serving engine</td><td>Exact vLLM/SGLang version; upgrade with a benchmark and an eval run</td></tr>
</table>
<p><strong>Scan:</strong> CVEs in the image (<code>trivy image</code>, <code>grype</code>); Python deps (<code>pip-audit</code>); model files (<code>modelscan</code> for pickles, and reject non-safetensors weights by policy); typosquatted packages (private index / allow-list); SBOM plus signature (<code>syft</code>, <code>cosign</code>) for image and model artifacts. See <code>staff-supply-chain</code>.</p>
${DOCKERFILE}
<p>Why this is small: the <code>base</code> CUDA image only sets up the environment the NVIDIA container toolkit needs; the CUDA libraries come from the pinned PyTorch wheel; no compilers or <code>-devel</code> headers ship; weights live outside the image. Typical result: ~4 GB instead of 9 GB, and a node can start serving as soon as the model volume is ready.</p>`,
        he: `<table>
<tr><th>מה לנעול</th><th>איך</th></tr>
<tr><td>חבילות Python, כולל טרנזיטיביות</td><td>lock file עם hashes (<code>uv pip compile --generate-hashes</code>, <code>uv.lock</code>); התקנה עם <code>--require-hashes</code></td></tr>
<tr><td>ה-variant של ה-build של PyTorch</td><td><code>torch==2.9.1+cu128</code> מדויק מה-index של PyTorch, לא "ה-torch האחרון"</td></tr>
<tr><td>Base image</td><td>tag ועוד digest (<code>nvidia/cuda:12.8.1-base-ubuntu24.04@sha256:...</code>)</td></tr>
<tr><td>ה-GPU driver של ה-node</td><td>גרסת node image או GPU operator לכל node pool; לתעד את ה-driver המינימלי שה-images שלך צריכים</td></tr>
<tr><td>משקולות, tokenizer, chat template</td><td>commit SHA ב-Hub, עם mirror ל-bucket או ל-registry שלך ו-checksum</td></tr>
<tr><td>מנוע ה-serving</td><td>גרסה מדויקת של vLLM/SGLang; upgrade רק עם benchmark והרצת evals</td></tr>
</table>
<p><strong>מה לסרוק:</strong> CVEs ב-image (<code>trivy image</code>, <code>grype</code>); תלויות Python (<code>pip-audit</code>); קבצי מודל (<code>modelscan</code> ל-pickles, ומדיניות שדוחה משקולות שהן לא safetensors); חבילות typosquatting (index פרטי או allow-list); SBOM וחתימה (<code>syft</code>, <code>cosign</code>) ל-images ול-artifacts של מודלים. ראה <code>staff-supply-chain</code>.</p>
${DOCKERFILE}
<p>למה זה קטן: ה-image של CUDA מסוג <code>base</code> רק מכין את הסביבה שה-NVIDIA container toolkit צריך; ספריות ה-CUDA מגיעות מה-wheel הנעול של PyTorch; אין קומפיילרים ואין headers של <code>-devel</code>; המשקולות יושבות מחוץ ל-image. תוצאה טיפוסית: בערך 4 GB במקום 9 GB, ו-node יכול להתחיל לשרת ברגע שה-volume של המודל מוכן.</p>`
      }
    }
  ],
  diagram: `obs:      OpenTelemetry GenAI spans/metrics  ->  Langfuse / your APM
app:      openai / anthropic SDKs | LangChain, LangGraph | LlamaIndex | MCP SDKs
             | HTTP (OpenAI-compatible API)
serve:    vLLM | SGLang | Triton | llama.cpp / Ollama      (TGI: maintenance)
models:   Hugging Face hub -> transformers + tokenizers + safetensors weights
compute:  PyTorch (torch.compile)  ->  CUDA runtime, cuDNN, NCCL (in the wheel)
host:     NVIDIA driver on the node  ->  GPU (sm_80 / sm_90 / sm_100)
classic:  NumPy -> pandas -> scikit-learn -> joblib (pickle!) | ONNX -> onnxruntime`,
  handsOn: [
    { cmd: "python -c \"import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available(), torch.cuda.get_device_capability())\"",
      what: { en: "The first command in any GPU image: which PyTorch build, which CUDA runtime it bundles, whether it sees a GPU, and the GPU architecture.", he: "הפקודה הראשונה בכל image של GPU: איזה build של PyTorch, איזה CUDA runtime הוא אורז, האם הוא רואה GPU, ומה הארכיטקטורה של ה-GPU." } },
    { cmd: "nvidia-smi --query-gpu=name,driver_version,memory.used,memory.total --format=csv",
      what: { en: "Driver version on the node and GPU memory use. Compare the driver with the minimum your image's CUDA runtime needs.", he: "גרסת ה-driver על ה-node ושימוש בזיכרון ה-GPU. תשווה את ה-driver למינימום שה-CUDA runtime ב-image שלך צריך." } },
    { cmd: "hf download org/model-8b-instruct --revision <commit-sha> --include \"*.safetensors\" \"*.json\" --local-dir /models/m8b",
      what: { en: "Download pinned weights and configs only (no pickle .bin files) to a local dir, for a PVC or an init container.", he: "מוריד משקולות ו-configs נעולים בלבד (בלי קבצי .bin של pickle) לתיקייה מקומית, בשביל PVC או init container." } },
    { cmd: "docker history --format \"{{.Size}}\\t{{.CreatedBy}}\" ai-svc:1.4 | head -15",
      what: { en: "See which layers make the image huge: usually the torch install, a -devel base, or weights someone baked in.", he: "רואים אילו layers מנפחים את ה-image: בדרך כלל התקנת ה-torch, base מסוג -devel, או משקולות שמישהו אפה לתוכו." } },
    { cmd: "pip-audit -r requirements.lock && modelscan -p ./models/",
      what: { en: "Scan Python dependencies for known CVEs and model files for unsafe pickle operations before they reach a cluster.", he: "סורק את תלויות ה-Python ל-CVEs ידועים ואת קבצי המודל לפעולות pickle מסוכנות, לפני שהם מגיעים ל-cluster." } }
  ],
  mnemonic: {
    en: "\"Driver on the host, CUDA in the wheel, weights in safetensors, versions in the lock.\" If any of the four floats, the 3 a.m. page is yours.",
    he: "\"ה-driver על ה-host, ה-CUDA ב-wheel, המשקולות ב-safetensors, הגרסאות ב-lock.\" אם אחד מהארבעה זז, ה-page של שלוש בלילה שלך."
  },
  pitfalls: [
    { en: "Loading a pickle/joblib/.bin model from the internet or a shared bucket. It is code execution, not data loading. Require safetensors or ONNX, scan anything else, and only load artifacts your own pipeline produced and signed.",
      he: "לטעון מודל pickle/joblib/.bin מהאינטרנט או מ-bucket משותף. זו הרצת קוד, לא טעינת data. תדרוש safetensors או ONNX, תסרוק כל דבר אחר, ותטען רק artifacts שה-pipeline שלך יצר וחתם." },
    { en: "Upgrading the GPU node image or driver separately from the app images. A new image built on CUDA 13 meets an old 570 driver and every pod fails with \"driver version is insufficient\". Track the minimum driver per image and roll node pools first.",
      he: "לשדרג את ה-node image או את ה-driver של ה-GPU בנפרד מה-images של האפליקציה. image חדש שבנוי על CUDA 13 פוגש driver ישן מסדרה 570, וכל Pod נופל עם \"driver version is insufficient\". תעקוב אחרי ה-driver המינימלי לכל image ותגלגל קודם את ה-node pools." },
    { en: "Baking 16-140 GB of weights into the container image. Every deploy re-pushes them, every new node pulls them, and registries choke. Keep weights in object storage or a model registry and mount or pre-fetch them.",
      he: "לאפות 16-140 GB של משקולות לתוך ה-image. כל deploy דוחף אותן שוב, כל node חדש מושך אותן, וה-registry נחנק. תשאיר משקולות ב-object storage או ב-model registry ותעשה mount או pre-fetch." },
    { en: "Letting the LLM SDKs keep their defaults: a 10-minute timeout plus automatic retries, behind your own retry layer, turns one slow provider into a retry storm and hung workers. Set explicit timeouts and one retry owner.",
      he: "להשאיר את ה-SDKs של ה-LLM עם ה-defaults: timeout של 10 דקות ועוד retries אוטומטיים, מאחורי שכבת retry משלך, הופכים ספק איטי אחד ל-retry storm ול-workers תקועים. תגדיר timeouts מפורשים ובעלים אחד ל-retries." }
  ],
  interview: [
    { q: { en: "A GPU pod crashes on start with \"no kernel image is available for execution on the device\". The same image works on other nodes. What is going on?", he: "Pod של GPU קורס בעלייה עם \"no kernel image is available for execution on the device\". אותו image עובד על nodes אחרים. מה קורה?" },
      a: { en: "The PyTorch (or engine) build in the image was not compiled for that GPU's architecture. The new node pool probably has a newer GPU (for example Blackwell, sm_100/sm_120) and the wheel is a cu126 build without those kernels. Check torch.cuda.get_device_capability() and torch.cuda.get_arch_list(). Fix: rebuild on a CUDA 12.8+ wheel that includes the arch, and make the minimum driver and supported archs part of the image metadata so the scheduler (node selectors or affinity on GPU type) never puts it on a mismatched node.", he: "ה-build של PyTorch (או של המנוע) ב-image לא קומפל לארכיטקטורה של ה-GPU הזה. כנראה ב-node pool החדש יש GPU חדש יותר (למשל Blackwell, sm_100/sm_120) וה-wheel הוא build של cu126 בלי ה-kernels האלה. בודקים עם torch.cuda.get_device_capability() ו-torch.cuda.get_arch_list(). הפתרון: לבנות מחדש על wheel של CUDA 12.8 ומעלה שכולל את הארכיטקטורה, ולהפוך את ה-driver המינימלי ואת הארכיטקטורות הנתמכות לחלק מה-metadata של ה-image, כדי שה-scheduler (node selectors או affinity לפי סוג GPU) לא ישים אותו על node שלא מתאים." } },
    { q: { en: "Why is safetensors safer than a PyTorch .bin file, and what else would you put in a model supply-chain policy?", he: "למה safetensors בטוח יותר מקובץ .bin של PyTorch, ומה עוד היית שם במדיניות supply chain למודלים?" },
      a: { en: ".bin/.pt files are pickles: loading them executes whatever the pickle program says. safetensors is a JSON header plus raw bytes, so loading can only produce tensors, and it can be memory-mapped. Policy: only safetensors or ONNX from outside; trust_remote_code off by default; pin every model, tokenizer and template to a commit SHA; mirror to an internal bucket with checksums and signatures; scan any remaining pickles with modelscan; SBOM and signatures for images; and evals as the gate for a model version change, like tests for code.", he: "קבצי .bin/.pt הם pickles: הטעינה מריצה כל מה שתוכנית ה-pickle אומרת. safetensors הוא header של JSON ועוד bytes גולמיים, אז טעינה יכולה לייצר רק tensors, ואפשר לעשות לו memory-map. המדיניות: מבחוץ רק safetensors או ONNX; trust_remote_code כבוי כברירת מחדל; לנעול כל מודל, tokenizer ו-template ל-commit SHA; mirror ל-bucket פנימי עם checksums וחתימות; לסרוק pickles שנשארו עם modelscan; SBOM וחתימות ל-images; ו-evals כ-gate לכל החלפת גרסת מודל, כמו בדיקות לקוד." } },
    { q: { en: "A team asks for a 9 GB inference image and complains that scale-out takes six minutes. What do you change?", he: "צוות מבקש image של inference בגודל 9 GB ומתלונן ש-scale-out לוקח שש דקות. מה אתה משנה?" },
      a: { en: "Look at docker history: usually a -devel CUDA base, duplicated CUDA libs (base image plus the torch wheel), build tools, and baked-in weights. Move to a multi-stage build on the CUDA base image with only the pinned wheel set, take weights out (PVC, pre-fetch init container, or a node-local cache), and enable image streaming or pre-pulling (GKE image streaming, a DaemonSet that pre-pulls, or a pre-baked node image) on GPU node pools. Then measure separately: image pull, weight load, and torch.compile/CUDA graph warmup, and cache the compile artifacts.", he: "מסתכלים ב-docker history: בדרך כלל base של CUDA מסוג -devel, ספריות CUDA כפולות (גם ב-base image וגם ב-wheel של torch), כלי build, ומשקולות אפויות. עוברים ל-multi-stage build על ה-base image של CUDA עם סט ה-wheels הנעול בלבד, מוציאים את המשקולות (PVC, init container שעושה pre-fetch, או cache מקומי על ה-node), ומפעילים image streaming או pre-pull ב-GPU node pools (image streaming של GKE, DaemonSet שמושך מראש, או node image אפוי). אחר כך מודדים בנפרד: image pull, טעינת משקולות, ו-warmup של torch.compile ו-CUDA graphs, ושומרים את תוצרי הקומפילציה ב-cache." } }
  ],
  quiz: [
    { q: { en: "nvidia-smi on a node shows \"CUDA Version: 12.8\". What does that number mean?", he: "nvidia-smi על node מראה \"CUDA Version: 12.8\". מה המספר הזה אומר?" },
      options: [
        { en: "CUDA 12.8 toolkit is installed on the node", he: "ה-toolkit של CUDA 12.8 מותקן על ה-node" },
        { en: "The highest CUDA runtime the installed driver supports", he: "ה-CUDA runtime הכי גבוה שה-driver המותקן תומך בו" },
        { en: "The CUDA version PyTorch in your container uses", he: "גרסת ה-CUDA ש-PyTorch בקונטיינר שלך משתמש בה" },
        { en: "The GPU's compute capability", he: "ה-compute capability של ה-GPU" }
      ],
      answer: 1,
      explain: { en: "It is the driver's maximum supported CUDA version. The runtime actually used comes from your image (usually the PyTorch wheel); check torch.version.cuda.", he: "זו הגרסה המקסימלית של CUDA שה-driver תומך בה. ה-runtime שבאמת רץ מגיע מה-image שלך (בדרך כלל מה-wheel של PyTorch); בודקים עם torch.version.cuda." } },
    { q: { en: "Which model file can execute arbitrary code when loaded?", he: "איזה קובץ מודל יכול להריץ קוד שרירותי כשטוענים אותו?" },
      options: [
        { en: "model.safetensors", he: "model.safetensors" },
        { en: "model.onnx", he: "model.onnx" },
        { en: "model.joblib", he: "model.joblib" },
        { en: "config.json", he: "config.json" }
      ],
      answer: 2,
      explain: { en: "joblib uses pickle, and unpickling runs the reconstruction program inside the file. safetensors and ONNX are data formats; config.json is plain JSON (though trust_remote_code can still pull code from the repo).", he: "joblib משתמש ב-pickle, ו-unpickling מריץ את תוכנית השחזור שבתוך הקובץ. safetensors ו-ONNX הם פורמטים של data; config.json הוא JSON רגיל (אבל trust_remote_code עדיין יכול למשוך קוד מה-repo)." } },
    { q: { en: "You need to serve a new open-weights LLM to many internal users with high throughput. Which choice fits best in late 2026?", he: "צריך להגיש LLM חדש עם משקולות פתוחות להרבה משתמשים פנימיים ב-throughput גבוה. איזו בחירה מתאימה הכי טוב בסוף 2026?" },
      options: [
        { en: "Ollama on a single GPU node", he: "Ollama על GPU node אחד" },
        { en: "A Flask app calling transformers' generate()", he: "אפליקציית Flask שקוראת ל-generate() של transformers" },
        { en: "A new TGI deployment", he: "deployment חדש של TGI" },
        { en: "vLLM or SGLang behind a gateway, benchmarked on your traffic", he: "vLLM או SGLang מאחורי gateway, עם benchmark על התעבורה שלך" }
      ],
      answer: 3,
      explain: { en: "vLLM and SGLang provide continuous batching, KV cache management and OpenAI-compatible APIs. TGI is in maintenance mode, Ollama targets local use, and raw generate() has no batching across requests.", he: "vLLM ו-SGLang נותנים continuous batching, ניהול KV cache ו-API תואם OpenAI. TGI ב-maintenance mode, Ollama מכוון לשימוש מקומי, ו-generate() גולמי לא עושה batching בין בקשות." } },
    { q: { en: "A scikit-learn churn model must be called from a Node.js service with a small image. What's the cleanest path?", he: "מודל churn של scikit-learn צריך להיקרא משירות Node.js עם image קטן. מה הדרך הכי נקייה?" },
      options: [
        { en: "Export to ONNX and run it with onnxruntime", he: "לייצא ל-ONNX ולהריץ עם onnxruntime" },
        { en: "Ship the joblib file and unpickle it from Node", he: "לשלוח את קובץ ה-joblib ולעשות לו unpickle מ-Node" },
        { en: "Rewrite the model in TensorFlow.js", he: "לכתוב את המודל מחדש ב-TensorFlow.js" },
        { en: "Run a full PyTorch CUDA image as a sidecar", he: "להריץ image מלא של PyTorch עם CUDA כ-sidecar" }
      ],
      answer: 0,
      explain: { en: "ONNX is a portable graph format with runtimes for many languages (onnxruntime-node for Node), needs no scikit-learn at runtime, and loading it does not execute code.", he: "ONNX הוא פורמט גרף נייד עם runtimes להרבה שפות (onnxruntime-node ל-Node), לא צריך scikit-learn בזמן ריצה, והטעינה שלו לא מריצה קוד." } }
  ],
  related: ["ai-llm-serving", "k8s-gpu-inference", "ai-gpu-clusters", "mlops-lifecycle", "mlops-serving-monitoring", "ai-gateway-design", "ai-mcp-servers", "container-slim-images", "staff-supply-chain", "ai-security-practice"]
});

/* ================================================================== */
INFRA.lessons.push({
  id: "ts-platform-toolbox",
  track: "architecture",
  order: 62,
  icon: "🧰",
  level: 2,
  minutes: 20,
  title: { en: "The TypeScript Platform Toolbox", he: "ארגז הכלים של פלטפורמת TypeScript" },
  tldr: {
    en: "A production TypeScript backend is a handful of libraries used well: AWS SDK v3 clients configured once, zod at every edge where data enters, undici/fetch with keep-alive and deadlines, pino with redaction, OpenTelemetry loaded first, a deliberately chosen ORM or query builder behind a connection pooler, a queue (BullMQ or SQS) with idempotent consumers, and tests that run against real containers.",
    he: "backend של TypeScript ב-production זה קומץ ספריות שמשתמשים בהן נכון: clients של AWS SDK v3 שמוגדרים פעם אחת, zod בכל קצה שבו data נכנס, undici/fetch עם keep-alive ו-deadlines, pino עם redaction, OpenTelemetry שנטען ראשון, ORM או query builder שנבחר בכוונה מאחורי connection pooler, תור (BullMQ או SQS) עם consumers אידמפוטנטיים, ובדיקות שרצות מול containers אמיתיים."
  },
  analogy: {
    en: "TypeScript types are the building's blueprint; they vanish when the building opens (compile time). zod is the security guard at every entrance who checks what actually walks in. pino is the CCTV log with faces blurred, OpenTelemetry the visitor badge that follows a guest through every floor, and the queue's idempotency table is the stamp that says \"this delivery was already signed for\" so the second courier is sent away.",
    he: "ה-types של TypeScript הם התוכנית האדריכלית של הבניין; הם נעלמים ברגע שהבניין נפתח (compile time). zod הוא המאבטח בכל כניסה שבודק מה באמת נכנס. pino הוא יומן מצלמות האבטחה עם פנים מטושטשות, OpenTelemetry הוא תג המבקר שעוקב אחרי האורח בכל קומה, וטבלת ה-idempotency של התור היא החותמת \"המשלוח הזה כבר נחתם\", כדי שהשליח השני יישלח הביתה."
  },
  sections: [
    {
      h: { en: "AWS SDK for JavaScript v3", he: "AWS SDK for JavaScript v3" },
      body: {
        en: `<p>v3 is modular: one npm package per service (<code>@aws-sdk/client-s3</code>, <code>@aws-sdk/client-sqs</code>), and commands are classes you <code>send()</code>. A Lambda that used the v2 monolith bundled several MB of SDK; with v3 plus tree-shaking (esbuild) it is often tens of KB, which shows up directly in cold-start time. v2 reached end of support in September 2025, so any remaining <code>aws-sdk</code> import is tech debt.</p>
${TS_AWS}
<ul>
<li><strong>Retries</strong>: <code>standard</code> mode retries throttling, 5xx and transient network errors with exponential backoff and a retry quota; <code>adaptive</code> adds client-side rate limiting. Count your layers: SDK retries x your retries x the caller's retries.</li>
<li><strong>Credentials</strong>: never put keys in env vars in a cluster. The default chain picks up EKS Pod Identity or IRSA automatically. Credentials are cached and refreshed; create the client once, not per request.</li>
<li><strong>Streams</strong>: <code>GetObject</code> returns a stream. If you don't read or destroy it, the socket stays checked out, and after 50 calls the pool is exhausted and every new request hangs.</li>
</ul>`,
        he: `<p>v3 מודולרי: חבילת npm לכל שירות (<code>@aws-sdk/client-s3</code>, <code>@aws-sdk/client-sqs</code>), והפקודות הן classes שעושים להן <code>send()</code>. Lambda שהשתמשה במונולית של v2 ארזה כמה MB של SDK; עם v3 ו-tree-shaking (esbuild) זה הרבה פעמים עשרות KB, וזה מורגש ישר בזמן ה-cold start. ל-v2 נגמרה התמיכה בספטמבר 2025, אז כל import של <code>aws-sdk</code> שנשאר הוא חוב טכני.</p>
${TS_AWS}
<ul>
<li><strong>Retries</strong>: מצב <code>standard</code> עושה retry ל-throttling, ל-5xx ולשגיאות רשת חולפות עם exponential backoff ו-retry quota; <code>adaptive</code> מוסיף rate limiting בצד ה-client. תספור את השכבות: retries של ה-SDK כפול ה-retries שלך כפול ה-retries של מי שקורא לך.</li>
<li><strong>Credentials</strong>: אף פעם לא keys במשתני סביבה בתוך cluster. ה-chain ברירת המחדל מרים EKS Pod Identity או IRSA אוטומטית. ה-credentials נשמרים ב-cache ומתחדשים; תיצור את ה-client פעם אחת, לא לכל בקשה.</li>
<li><strong>Streams</strong>: <code>GetObject</code> מחזיר stream. אם לא קורא אותו או סוגר אותו, ה-socket נשאר תפוס, ואחרי 50 קריאות ה-pool מוצה וכל בקשה חדשה נתקעת.</li>
</ul>`
      }
    },
    {
      h: { en: "zod at the edges: env, API input, LLM tool arguments", he: "zod בקצוות: env, קלט API, ארגומנטים של tools ל-LLM" },
      body: {
        en: `<p>TypeScript types disappear at runtime. Anything that crosses a boundary (env vars, HTTP bodies, queue messages, third-party responses, LLM output) is <code>unknown</code> until validated. zod gives you the validator and the static type from one schema. zod 4 is faster, smaller, and adds top-level formats (<code>z.email()</code>, <code>z.url()</code>, <code>z.uuid()</code>), <code>z.stringbool()</code>, <code>z.prettifyError()</code> and native <code>z.toJSONSchema()</code>.</p>
${TS_ZOD}
<p>The LLM case matters most: models produce well-formed but wrong arguments (an order id from another tenant, a refund of 10x the amount). The JSON Schema guides the model; the zod <code>parse</code> on the way back, plus an authorization check, is what protects you. See <code>ai-agent-runtime</code> and <code>pr-input-validation</code>.</p>`,
        he: `<p>ה-types של TypeScript נעלמים בזמן ריצה. כל מה שחוצה גבול (משתני סביבה, HTTP bodies, הודעות בתור, תשובות של צד שלישי, פלט של LLM) הוא <code>unknown</code> עד שבדקת אותו. zod נותן לך את ה-validator ואת ה-type הסטטי מ-schema אחד. zod 4 מהיר וקטן יותר, ומוסיף formats ברמה העליונה (<code>z.email()</code>, <code>z.url()</code>, <code>z.uuid()</code>), את <code>z.stringbool()</code>, את <code>z.prettifyError()</code> ו-<code>z.toJSONSchema()</code> מובנה.</p>
${TS_ZOD}
<p>המקרה של ה-LLM הכי חשוב: מודלים מייצרים ארגומנטים תקינים בפורמט אבל שגויים (order id של tenant אחר, refund פי 10 מהסכום). ה-JSON Schema מכוון את המודל; ה-<code>parse</code> של zod בדרך חזרה, ועוד בדיקת הרשאות, הם מה שמגן עליך. ראה <code>ai-agent-runtime</code> ו-<code>pr-input-validation</code>.</p>`
      }
    },
    {
      h: { en: "HTTP clients and logging: undici, fetch, pino", he: "HTTP clients ולוגים: undici, fetch, pino" },
      body: {
        en: `<p>Node's built-in <code>fetch</code> is implemented by <strong>undici</strong>. It keeps connections alive by default, but it has <em>no overall timeout</em>, and the global pool is shared by everything in the process. For each important upstream, create an <code>Agent</code> with explicit pool size and keep-alive, put a deadline on every call with <code>AbortSignal.timeout()</code>, and retry only idempotent requests (or ones carrying an idempotency key).</p>
${TS_HTTP}
<ul>
<li><strong>keepAliveTimeout</strong> shorter than the server's idle timeout, or you reuse a socket the server just closed and get <code>ECONNRESET</code>/<code>UND_ERR_SOCKET</code>. The mirror problem on the server side is the ALB 502 in <code>node-keepalive-502s</code>.</li>
<li><strong>pino</strong> writes JSON fast because it does almost nothing on the main thread; formatting and shipping happen in transports (worker threads) or in the log agent. Use child loggers for request context and <code>redact</code> for secrets. Never log raw request bodies or LLM prompts by default.</li>
</ul>`,
        he: `<p>ה-<code>fetch</code> המובנה של Node ממומש ע"י <strong>undici</strong>. הוא שומר חיבורים ב-keep-alive כברירת מחדל, אבל <em>אין לו timeout כולל</em>, וה-pool הגלובלי משותף לכל מה שרץ בתהליך. לכל upstream חשוב תיצור <code>Agent</code> עם גודל pool ו-keep-alive מפורשים, תשים deadline על כל קריאה עם <code>AbortSignal.timeout()</code>, ותעשה retry רק לבקשות אידמפוטנטיות (או כאלה שנושאות idempotency key).</p>
${TS_HTTP}
<ul>
<li><strong>keepAliveTimeout</strong> קצר מה-idle timeout של השרת, אחרת אתה משתמש שוב ב-socket שהשרת בדיוק סגר ומקבל <code>ECONNRESET</code> או <code>UND_ERR_SOCKET</code>. הבעיה ההפוכה בצד השרת היא ה-502 של ה-ALB שב-<code>node-keepalive-502s</code>.</li>
<li><strong>pino</strong> כותב JSON מהר כי הוא כמעט לא עושה כלום על ה-main thread; הפירמוט והשליחה קורים ב-transports (worker threads) או ב-log agent. תשתמש ב-child loggers בשביל context של הבקשה וב-<code>redact</code> בשביל secrets. אל תכתוב ללוג request bodies גולמיים או prompts של LLM כברירת מחדל.</li>
</ul>`
      }
    },
    {
      h: { en: "OpenTelemetry JS: auto-instrumentation and manual spans", he: "OpenTelemetry JS: auto-instrumentation ו-spans ידניים" },
      body: {
        en: `<p>Auto-instrumentation works by patching modules (<code>http</code>, <code>undici</code>, <code>pg</code>, <code>ioredis</code>, the AWS SDK, Express/Fastify/NestJS) as they are loaded. So the SDK must start <em>before</em> your app imports them: <code>node --import ./otel.js</code> for ESM (or <code>--require</code> for CommonJS). If traces show only the inbound HTTP span and nothing below it, the load order is wrong.</p>
${TS_OTEL}
<p>Context propagation is automatic over HTTP (W3C <code>traceparent</code> header) and through <code>async/await</code> (AsyncLocalStorage). Across a queue it needs carriers: message attributes for SQS, job data for BullMQ. The AWS SDK instrumentation injects into SQS attributes on send; the consumer below extracts explicitly. Collector setup and sampling are in <code>obs-otel-collector</code>.</p>`,
        he: `<p>ה-auto-instrumentation עובד ע"י patching למודולים (<code>http</code>, <code>undici</code>, <code>pg</code>, <code>ioredis</code>, ה-AWS SDK, Express/Fastify/NestJS) ברגע שהם נטענים. לכן ה-SDK חייב לעלות <em>לפני</em> שהאפליקציה עושה להם import: <code>node --import ./otel.js</code> ל-ESM (או <code>--require</code> ל-CommonJS). אם ב-traces רואים רק את ה-span של ה-HTTP הנכנס ושום דבר מתחתיו, סדר הטעינה לא נכון.</p>
${TS_OTEL}
<p>העברת ה-context אוטומטית ב-HTTP (ה-header של W3C שנקרא <code>traceparent</code>) ודרך <code>async/await</code> (AsyncLocalStorage). מעבר לתור זה דורש carriers: message attributes ב-SQS, ה-data של ה-job ב-BullMQ. ה-instrumentation של ה-AWS SDK מזריק ל-attributes של SQS בשליחה; ה-consumer למטה מחלץ את זה במפורש. הגדרת ה-collector וה-sampling נמצאות ב-<code>obs-otel-collector</code>.</p>`
      }
    },
    {
      h: { en: "Data access and tests: ORMs, query builders, pooling, testcontainers", he: "גישה ל-data ובדיקות: ORMs, query builders, pooling, testcontainers" },
      body: {
        en: `<table>
<tr><th></th><th>Prisma</th><th>TypeORM</th><th>Drizzle</th><th>Kysely</th></tr>
<tr><td>Style</td><td>Schema file + generated client</td><td>Decorated entity classes, active record or data mapper</td><td>Schema in TS, SQL-like API</td><td>Typed query builder only</td></tr>
<tr><td>Strength</td><td>Best DX for CRUD, migrations, relations</td><td>Familiar to Java/.NET folks; NestJS integration</td><td>Thin, close to SQL, serverless friendly</td><td>You write SQL in TS; full control</td></tr>
<tr><td>Watch out</td><td>Codegen step; check generated SQL for N+1 and over-fetching; recent versions dropped the Rust engine binary for a TS query compiler</td><td>Decorator magic, weaker type safety on queries, lazy-relation surprises</td><td>Younger; relations API still evolving</td><td>No migrations or relations built in</td></tr>
</table>
${TS_DATA}
<p><strong>Pooling.</strong> Each Node process holds its own pool (often 10 connections). 40 pods x 10 = 400 connections; Postgres degrades well before <code>max_connections</code> because every connection is a process. Put PgBouncer (transaction mode) or RDS Proxy in front, and size app pools small. Transaction pooling breaks session state (<code>SET</code>, advisory locks, <code>LISTEN</code>); prepared statements need PgBouncer 1.21+ with <code>max_prepared_statements</code>, or the ORM's pgbouncer mode. See <code>db-operations</code> and <code>db-managed-cloud</code>.</p>
<p><strong>Tests.</strong> vitest (fast, native ESM and TS) or jest for units; testcontainers for integration tests against the real Postgres, Redis or LocalStack instead of mocks. The idempotency test above catches exactly the bug that mocks hide.</p>`,
        he: `<table>
<tr><th></th><th>Prisma</th><th>TypeORM</th><th>Drizzle</th><th>Kysely</th></tr>
<tr><td>סגנון</td><td>קובץ schema ו-client שנוצר בקוד</td><td>classes של entities עם decorators, active record או data mapper</td><td>schema ב-TS, API שדומה ל-SQL</td><td>query builder עם types בלבד</td></tr>
<tr><td>חוזקה</td><td>ה-DX הכי טוב ל-CRUD, migrations ו-relations</td><td>מוכר לאנשי Java/.NET; אינטגרציה עם NestJS</td><td>דק, קרוב ל-SQL, מתאים ל-serverless</td><td>כותבים SQL בתוך TS; שליטה מלאה</td></tr>
<tr><td>לשים לב</td><td>שלב codegen; לבדוק את ה-SQL שנוצר בשביל N+1 ו-over-fetching; גרסאות חדשות החליפו את ה-binary של ה-engine ב-Rust ב-query compiler של TS</td><td>קסם של decorators, type safety חלש יותר ב-queries, הפתעות עם lazy relations</td><td>צעיר יותר; ה-API של relations עוד מתפתח</td><td>אין migrations או relations מובנים</td></tr>
</table>
${TS_DATA}
<p><strong>Pooling.</strong> לכל תהליך Node יש pool משלו (הרבה פעמים 10 חיבורים). 40 Pods כפול 10 זה 400 חיבורים; Postgres מתדרדר הרבה לפני <code>max_connections</code> כי כל חיבור הוא תהליך. תשים PgBouncer (ב-transaction mode) או RDS Proxy מלפנים, ותשאיר את ה-pools באפליקציה קטנים. transaction pooling שובר state של session (<code>SET</code>, advisory locks, <code>LISTEN</code>); ל-prepared statements צריך PgBouncer 1.21 ומעלה עם <code>max_prepared_statements</code>, או את מצב ה-pgbouncer של ה-ORM. ראה <code>db-operations</code> ו-<code>db-managed-cloud</code>.</p>
<p><strong>בדיקות.</strong> vitest (מהיר, ESM ו-TS native) או jest ל-unit tests; testcontainers לבדיקות אינטגרציה מול Postgres, Redis או LocalStack אמיתיים במקום mocks. בדיקת ה-idempotency למעלה תופסת בדיוק את הבאג שה-mocks מסתירים.</p>`
      }
    },
    {
      h: { en: "Job queues: BullMQ vs SQS, and a production SQS consumer", he: "תורי jobs: BullMQ מול SQS, ו-consumer של SQS ל-production" },
      body: {
        en: `<table>
<tr><th></th><th>BullMQ (Redis)</th><th>SQS consumer</th></tr>
<tr><td>Ops</td><td>You run Redis (or ElastiCache) with <code>noeviction</code> and persistence</td><td>Fully managed, effectively unlimited throughput (standard queues)</td></tr>
<tr><td>Features</td><td>Delays, cron repeats, priorities, rate limits, parent/child flows, a UI (Bull Board)</td><td>Visibility timeout, DLQ via redrive, FIFO with groups and 5-minute dedupe, delays up to 15 min</td></tr>
<tr><td>Delivery</td><td>At-least-once (stalled jobs are retried)</td><td>At-least-once (standard); FIFO dedupes only within 5 minutes</td></tr>
<tr><td>Best for</td><td>App-level background jobs inside one service</td><td>Cross-service events, Lambda triggers, buffering spikes</td></tr>
</table>
${TS_BULL}
<p>Both deliver at least once, so the consumer must be idempotent. The key comes from the <em>producer</em> (an event id), not the SQS <code>MessageId</code>, because a producer retry creates a new MessageId for the same event. Here is a complete consumer: validated config, a zod contract, trace context extracted from message attributes, a dedupe row and the business write in one transaction, delete only after commit, poison messages left to the DLQ, and graceful drain on SIGTERM.</p>
${TS_SQS}
<blockquote>⚠️ Production tip: set the queue's redrive policy (<code>maxReceiveCount</code> 5 or so) and alarm on DLQ depth and on <code>ApproximateAgeOfOldestMessage</code>, not just queue length. For work longer than the visibility timeout, extend it with <code>ChangeMessageVisibility</code> as a heartbeat. Poison-message handling in depth: <code>sqs-poison-message</code>.</blockquote>`,
        he: `<table>
<tr><th></th><th>BullMQ (Redis)</th><th>SQS consumer</th></tr>
<tr><td>תפעול</td><td>אתה מריץ Redis (או ElastiCache) עם <code>noeviction</code> ו-persistence</td><td>מנוהל לגמרי, throughput כמעט בלתי מוגבל (ב-standard queues)</td></tr>
<tr><td>יכולות</td><td>delays, חזרות cron, priorities, rate limits, flows של parent/child, ממשק (Bull Board)</td><td>visibility timeout, DLQ דרך redrive, FIFO עם groups ו-dedupe של 5 דקות, delays עד 15 דקות</td></tr>
<tr><td>Delivery</td><td>At-least-once (jobs תקועים חוזרים)</td><td>At-least-once (ב-standard); FIFO עושה dedupe רק בתוך 5 דקות</td></tr>
<tr><td>הכי מתאים ל</td><td>background jobs ברמת האפליקציה בתוך שירות אחד</td><td>events בין שירותים, triggers ל-Lambda, ספיגת קפיצות</td></tr>
</table>
${TS_BULL}
<p>שניהם at-least-once, אז ה-consumer חייב להיות אידמפוטנטי. המפתח מגיע מה-<em>producer</em> (event id), לא מה-<code>MessageId</code> של SQS, כי retry של ה-producer יוצר MessageId חדש לאותו event. הנה consumer מלא: config שנבדק, חוזה ב-zod, trace context שמחולץ מה-message attributes, שורת dedupe וכתיבה עסקית באותה transaction, delete רק אחרי commit, poison messages שנשארים ל-DLQ, ו-drain מסודר ב-SIGTERM.</p>
${TS_SQS}
<blockquote>⚠️ Production tip: תגדיר redrive policy לתור (<code>maxReceiveCount</code> בסביבות 5) ותשים alarm על העומק של ה-DLQ ועל <code>ApproximateAgeOfOldestMessage</code>, לא רק על אורך התור. לעבודה שארוכה מה-visibility timeout, תאריך אותו עם <code>ChangeMessageVisibility</code> בתור heartbeat. טיפול ב-poison messages לעומק: <code>sqs-poison-message</code>.</blockquote>`
      }
    }
  ],
  diagram: `HTTP in --> [zod parse] --> handler --(undici Agent, timeout, retry)--> upstream
                 |             |  \\--(Prisma/Drizzle/Kysely)--> PgBouncer / RDS Proxy --> Postgres
                 |             \\--(AWS SDK v3 client, Pod Identity creds)--> SQS send (+traceparent attr)
  pino child logger + OTel span wrap every step
SQS --> consumer: receive(10, wait 20s) -> extract trace -> zod -> BEGIN; dedupe row; write; COMMIT -> delete
                                                         \\-- fail: no delete -> retry -> DLQ after maxReceiveCount`,
  handsOn: [
    { cmd: "npx esbuild src/handler.ts --bundle --platform=node --minify --analyze --outfile=dist/h.js",
      what: { en: "Bundle a Lambda handler and check its size. With v3 modular clients, a handler that only uses SQS should be tens to low hundreds of KB, not MB.", he: "אורז handler של Lambda ובודק את הגודל. עם clients מודולריים של v3, handler שמשתמש רק ב-SQS אמור להיות עשרות עד כמה מאות KB, לא MB." } },
    { cmd: "NODE_DEBUG=undici node --import ./dist/otel.js dist/main.js 2>&1 | grep -iE 'connect|socket' | head",
      what: { en: "Watch undici open and reuse connections. Many new connects per second toward one host means keep-alive isn't working or the pool is too small.", he: "רואים את undici פותח ומשתמש שוב בחיבורים. הרבה connects חדשים בשנייה לאותו host אומר ש-keep-alive לא עובד או שה-pool קטן מדי." } },
    { cmd: "aws sqs get-queue-attributes --queue-url \"$QUEUE_URL\" --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible RedrivePolicy VisibilityTimeout",
      what: { en: "Check backlog, in-flight messages, the DLQ redrive policy and the visibility timeout your consumer must stay under.", he: "בודק backlog, הודעות in-flight, את ה-redrive policy ל-DLQ ואת ה-visibility timeout שה-consumer שלך חייב להישאר מתחתיו." } },
    { cmd: "psql \"$DATABASE_URL\" -c \"select application_name, state, count(*) from pg_stat_activity group by 1,2 order by 3 desc\"",
      what: { en: "Count connections per app and state. Hundreds of idle connections from Node pods is the signal to shrink pools or add PgBouncer/RDS Proxy.", he: "סופר חיבורים לפי אפליקציה ו-state. מאות חיבורים idle מ-Pods של Node זה הסימן להקטין pools או להוסיף PgBouncer או RDS Proxy." } },
    { cmd: "npx vitest run --project integration",
      what: { en: "Run integration tests that start real Postgres/Redis via testcontainers (needs a Docker socket in CI).", he: "מריץ בדיקות אינטגרציה שמרימות Postgres ו-Redis אמיתיים דרך testcontainers (צריך Docker socket ב-CI)." } }
  ],
  mnemonic: {
    en: "\"Types at compile, zod at the door, deadline on every call, key on every message.\"",
    he: "\"Types בקומפילציה, zod בכניסה, deadline על כל קריאה, מפתח על כל הודעה.\""
  },
  pitfalls: [
    { en: "Creating an AWS SDK client (or an undici Agent, or a pg Pool) per request. You lose connection reuse, re-resolve credentials, and leak sockets. Create them once at module scope and close them on shutdown.",
      he: "ליצור client של AWS SDK (או Agent של undici, או Pool של pg) לכל בקשה. מאבדים reuse של חיבורים, פותרים credentials מחדש ודולפים sockets. תיצור אותם פעם אחת ב-scope של המודול ותסגור אותם ב-shutdown." },
    { en: "Using the SQS MessageId (or a random UUID generated in the consumer) as the idempotency key. A producer retry sends the same event with a new MessageId, and you charge twice. The key must come from the producer and be stored in the same transaction as the side effect.",
      he: "להשתמש ב-MessageId של SQS (או ב-UUID רנדומלי שנוצר ב-consumer) בתור idempotency key. retry של ה-producer שולח את אותו event עם MessageId חדש, ואתה מחייב פעמיים. המפתח חייב להגיע מה-producer ולהישמר באותה transaction כמו ה-side effect." },
    { en: "Calling fetch with no AbortSignal. Node's fetch has no total timeout, so a hung upstream holds the request, the socket and the memory until the client gives up, and your pods pile up open handlers.",
      he: "לקרוא ל-fetch בלי AbortSignal. ל-fetch של Node אין timeout כולל, אז upstream תקוע מחזיק את הבקשה, את ה-socket ואת הזיכרון עד שה-client מוותר, וה-Pods שלך צוברים handlers פתוחים." },
    { en: "Loading the OpenTelemetry SDK after the app imports http, pg or the AWS SDK. Patching misses those modules and traces are mostly empty. Use node --import (ESM) or --require (CJS) so it runs first.",
      he: "לטעון את ה-SDK של OpenTelemetry אחרי שהאפליקציה כבר עשתה import ל-http, ל-pg או ל-AWS SDK. ה-patching מפספס את המודולים האלה וה-traces כמעט ריקים. תשתמש ב-node --import (ESM) או --require (CJS) כדי שזה ירוץ ראשון." }
  ],
  interview: [
    { q: { en: "How do you make an SQS consumer safe against duplicate deliveries?", he: "איך הופכים consumer של SQS לבטוח מול הודעות כפולות?" },
      a: { en: "Assume at-least-once. Have the producer put a stable event id in the message. In the consumer, insert that id into a processed_events table with a unique constraint in the same database transaction as the business write; if the insert conflicts, skip. Delete the message only after commit. Keep visibility timeout above worst-case processing (or heartbeat with ChangeMessageVisibility), use a redrive policy to a DLQ, and alarm on DLQ depth and oldest-message age. FIFO's 5-minute dedupe helps but does not replace this.", he: "מניחים at-least-once. ה-producer שם event id יציב בהודעה. ב-consumer מכניסים את ה-id לטבלת processed_events עם unique constraint, באותה transaction של ה-DB כמו הכתיבה העסקית; אם ה-insert מתנגש, מדלגים. מוחקים את ההודעה רק אחרי commit. שומרים visibility timeout מעל זמן העיבוד הגרוע ביותר (או heartbeat עם ChangeMessageVisibility), מגדירים redrive policy ל-DLQ, ושמים alarm על העומק של ה-DLQ ועל הגיל של ההודעה הכי ישנה. ה-dedupe של 5 דקות ב-FIFO עוזר אבל לא מחליף את זה." } },
    { q: { en: "Prisma, TypeORM, Drizzle or Kysely for a new service on a platform team? Defend the choice.", he: "Prisma, TypeORM, Drizzle או Kysely לשירות חדש בצוות פלטפורמה? תגן על הבחירה." },
      a: { en: "It depends on who maintains it and what the queries look like. For CRUD-heavy services written by many teams, Prisma's schema, migrations and DX reduce mistakes, provided you review generated SQL and handle pooling. For SQL-literate teams with reporting queries, Kysely or Drizzle keep you close to SQL with full types and less magic, and work well in serverless. TypeORM mostly when the codebase already uses it (common with NestJS). Whatever the choice: one pattern per org, migrations in CI, small pools behind PgBouncer or RDS Proxy, and slow-query visibility via OTel spans.", he: "תלוי מי מתחזק ואיך ה-queries נראים. לשירותים כבדי CRUD שהרבה צוותים כותבים, ה-schema, ה-migrations וה-DX של Prisma מורידים טעויות, בתנאי שבודקים את ה-SQL שנוצר ומטפלים ב-pooling. לצוותים שיודעים SQL ויש להם queries של reporting, Kysely או Drizzle משאירים אותך קרוב ל-SQL עם types מלאים ופחות קסם, ועובדים טוב ב-serverless. TypeORM בעיקר כשה-codebase כבר משתמש בו (נפוץ עם NestJS). מה שלא תבחר: דפוס אחד לארגון, migrations ב-CI, pools קטנים מאחורי PgBouncer או RDS Proxy, ונראות ל-queries איטיים דרך spans של OTel." } },
    { q: { en: "Why validate LLM tool-call arguments with zod if you already gave the model a JSON Schema?", he: "למה לבדוק עם zod את הארגומנטים של tool call אם כבר נתת למודל JSON Schema?" },
      a: { en: "The schema is a hint to the model, not enforcement. Even with strict or constrained decoding you can get values that are well-formed but out of range, belong to another tenant, or come from a prompt injection. Treat tool arguments like any untrusted API input: parse with the same zod schema you generated the JSON Schema from, then authorize against the user's real permissions, enforce limits, and log the decision.", he: "ה-schema הוא רמז למודל, לא אכיפה. גם עם strict mode או constrained decoding אפשר לקבל ערכים תקינים בפורמט אבל מחוץ לטווח, של tenant אחר, או כאלה שהגיעו מ-prompt injection. תתייחס לארגומנטים של tool כמו לכל קלט API לא מהימן: parse עם אותו schema של zod שממנו יצרת את ה-JSON Schema, ואז בדיקת הרשאות מול ההרשאות האמיתיות של המשתמש, אכיפת גבולות, ולוג של ההחלטה." } }
  ],
  quiz: [
    { q: { en: "Your Node service calls an internal API with fetch(). One upstream instance hangs. What happens without extra configuration?", he: "השירות שלך ב-Node קורא ל-API פנימי עם fetch(). instance אחד של ה-upstream נתקע. מה קורה בלי הגדרות נוספות?" },
      options: [
        { en: "fetch times out after 30 seconds by default", he: "fetch עושה timeout אחרי 30 שניות כברירת מחדל" },
        { en: "fetch retries on another instance automatically", he: "fetch עושה retry אוטומטית ל-instance אחר" },
        { en: "The request can wait a very long time; you need AbortSignal.timeout() or similar", he: "הבקשה יכולה לחכות הרבה מאוד זמן; צריך AbortSignal.timeout() או משהו דומה" },
        { en: "Node kills the socket after keepAliveTimeout", he: "Node הורג את ה-socket אחרי keepAliveTimeout" }
      ],
      answer: 2,
      explain: { en: "fetch has no overall deadline and no retries. undici has internal header/body timeouts measured in minutes, far too long for a request path. keepAliveTimeout applies to idle sockets, not in-flight requests.", he: "ל-fetch אין deadline כולל ואין retries. ל-undici יש timeouts פנימיים ל-headers ול-body שנמדדים בדקות, הרבה יותר מדי ל-request path. keepAliveTimeout חל על sockets במנוחה, לא על בקשות באמצע." } },
    { q: { en: "What is the main reason AWS SDK v3 shrinks Lambda bundles compared to v2?", he: "מה הסיבה העיקרית ש-AWS SDK v3 מקטין bundles של Lambda לעומת v2?" },
      options: [
        { en: "Per-service packages and command classes that bundlers can tree-shake", he: "חבילה לכל שירות ו-classes של commands שה-bundler יכול לעשות להם tree-shaking" },
        { en: "It is written in Rust and compiled to WebAssembly", he: "הוא כתוב ב-Rust ומקומפל ל-WebAssembly" },
        { en: "It downloads service code lazily at runtime", he: "הוא מוריד את הקוד של השירות בזמן ריצה לפי הצורך" },
        { en: "It removes retries and credential providers", he: "הוא מוריד את ה-retries ואת ה-credential providers" }
      ],
      answer: 0,
      explain: { en: "v3 splits the SDK into @aws-sdk/client-* packages with modular commands, so you ship only what you import. Retries and credential providers are still there.", he: "v3 מפצל את ה-SDK לחבילות @aws-sdk/client-* עם commands מודולריים, אז נארז רק מה שעשית לו import. ה-retries וה-credential providers עדיין שם." } },
    { q: { en: "Which value should an SQS consumer use as the idempotency key?", he: "באיזה ערך consumer של SQS צריך להשתמש כ-idempotency key?" },
      options: [
        { en: "The SQS MessageId", he: "ה-MessageId של SQS" },
        { en: "The ReceiptHandle", he: "ה-ReceiptHandle" },
        { en: "A UUID generated when the consumer receives the message", he: "UUID שנוצר כשה-consumer מקבל את ההודעה" },
        { en: "A stable event id set by the producer and stored in the same transaction as the side effect", he: "event id יציב שה-producer קובע, שנשמר באותה transaction כמו ה-side effect" }
      ],
      answer: 3,
      explain: { en: "MessageId changes when the producer retries, the ReceiptHandle changes on every receive, and a consumer-side UUID is new every time. Only a producer-assigned id identifies the business event.", he: "ה-MessageId משתנה כשה-producer עושה retry, ה-ReceiptHandle משתנה בכל receive, ו-UUID מצד ה-consumer חדש בכל פעם. רק id שה-producer קבע מזהה את ה-event העסקי." } },
    { q: { en: "Traces from your Node service show the inbound HTTP span but no database or outbound HTTP spans. Most likely cause?", he: "ה-traces מהשירות שלך ב-Node מראים את ה-span של ה-HTTP הנכנס אבל בלי spans של ה-DB או של HTTP יוצא. מה הסיבה הסבירה?" },
      options: [
        { en: "The collector drops child spans by default", he: "ה-collector זורק child spans כברירת מחדל" },
        { en: "The OTel SDK was started after pg and http were imported, so they were never patched", he: "ה-SDK של OTel עלה אחרי ש-pg ו-http כבר יובאו, אז הם לא עברו patching" },
        { en: "Sampling is set to 100%", he: "ה-sampling מוגדר ל-100%" },
        { en: "pino redaction removed the trace ids", he: "ה-redaction של pino הוריד את ה-trace ids" }
      ],
      answer: 1,
      explain: { en: "Auto-instrumentation patches modules at load time. Start the SDK first with node --import (ESM) or --require (CJS).", he: "ה-auto-instrumentation עושה patching למודולים בזמן הטעינה. תעלה את ה-SDK ראשון עם node --import (ESM) או --require (CJS)." } }
  ],
  related: ["node-web-frameworks", "web-service-production-checklist", "nestjs-in-depth", "nestjs-ddd-event-driven", "arch-queues", "pr-queue-kinds", "pr-idempotency", "pr-input-validation", "obs-otel-collector", "db-operations", "db-managed-cloud", "pr-integration-testing", "ai-agent-runtime"]
});

/* ================================================================== */
INFRA.glossary.push(
  { term: "safetensors", track: "ai", def: { en: "A model-weights file format (JSON header + raw tensor bytes) that cannot execute code on load and can be memory-mapped; the safe replacement for pickle-based .bin/.pt files.", he: "פורמט קובץ למשקולות של מודל (header של JSON ועוד bytes גולמיים של tensors) שלא יכול להריץ קוד בטעינה ואפשר לעשות לו memory-map; התחליף הבטוח לקבצי .bin/.pt שמבוססים על pickle." }, lesson: "ml-llm-library-map" },
  { term: "CUDA", track: "ai", def: { en: "NVIDIA's GPU programming platform. In containers the CUDA runtime ships in the image (often inside the PyTorch wheel) while the driver lives on the node, and the driver must be new enough for the runtime.", he: "פלטפורמת התכנות של NVIDIA ל-GPU. בקונטיינרים ה-CUDA runtime מגיע בתוך ה-image (הרבה פעמים בתוך ה-wheel של PyTorch) וה-driver יושב על ה-node, וה-driver חייב להיות חדש מספיק בשביל ה-runtime." }, lesson: "ml-llm-library-map" },
  { term: "GGUF", track: "ai", def: { en: "The single-file, usually quantized model format used by llama.cpp and Ollama for running LLMs locally on CPU, Apple silicon or small GPUs.", he: "פורמט מודל בקובץ יחיד, בדרך כלל quantized, ש-llama.cpp ו-Ollama משתמשים בו כדי להריץ LLMs מקומית על CPU, Apple silicon או GPUs קטנים." }, lesson: "ml-llm-library-map" },
  { term: "zod", track: "architecture", def: { en: "A TypeScript schema library that validates untrusted data at runtime and infers the static type from the same schema; zod 4 can also emit JSON Schema (for LLM tools and OpenAPI).", he: "ספריית schemas ל-TypeScript שבודקת data לא מהימן בזמן ריצה ומסיקה את ה-type הסטטי מאותו schema; zod 4 יודע גם לייצר JSON Schema (ל-tools של LLM ול-OpenAPI)." }, lesson: "ts-platform-toolbox" },
  { term: "BullMQ", track: "architecture", def: { en: "A Node.js job queue on Redis with retries, backoff, delays, repeatable jobs, priorities and rate limits; requires Redis with maxmemory-policy noeviction.", he: "תור jobs ל-Node.js מעל Redis עם retries, backoff, delays, jobs חוזרים, priorities ו-rate limits; דורש Redis עם maxmemory-policy noeviction." }, lesson: "ts-platform-toolbox" }
);
})();
