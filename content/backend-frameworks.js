window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Backend web frameworks — the infra/production angle: servers, workers, timeouts, health, shutdown */

INFRA.lessons.push({
  id: "python-web-frameworks",
  track: "architecture",
  order: 70,
  icon: "🐍",
  level: 2,
  minutes: 16,
  title: { en: "Flask vs FastAPI vs Django in Production", he: "Flask מול FastAPI מול Django ב-production" },
  tldr: {
    en: "The framework is the easy choice; what decides production behavior is the server around it (WSGI vs ASGI, gunicorn/uvicorn/granian), how many workers you run, and whether anything blocks the event loop.",
    he: "בחירת ה-framework היא החלק הקל; מה שקובע איך השירות יתנהג ב-production זה השרת שעוטף אותו (WSGI מול ASGI, ‏gunicorn/uvicorn/granian), כמה worker-ים אתה מריץ, והאם משהו חוסם את ה-event loop."
  },
  analogy: {
    en: "The framework is the recipe; the server is the kitchen staff. Flask and Django are classic kitchens where each cook (sync worker) handles one dish start to finish — simple, but ten cooks means at most ten dishes at once. FastAPI is one very fast cook juggling many pans (async) — brilliant while dishes simmer (IO), but if he stops to knead dough by hand (a blocking call), every pan burns.",
    he: "ה-framework הוא המתכון; השרת הוא צוות המטבח. Flask ו-Django הם מטבח קלאסי שבו כל טבח (sync worker) מכין מנה אחת מההתחלה ועד הסוף — פשוט, אבל עשרה טבחים זה לכל היותר עשר מנות במקביל. FastAPI הוא טבח אחד מהיר מאוד שמלהטט בהרבה מחבתות (async) — מבריק כל עוד המנות מתבשלות לבד (IO), אבל אם הוא עוצר ללוש בצק בידיים (קריאה חוסמת), כל המחבתות נשרפות."
  },
  sections: [
    {
      h: { en: "The same endpoint in Flask, FastAPI and Django", he: "אותו endpoint ב-Flask, ב-FastAPI וב-Django" },
      body: {
        en: `<pre># Flask 3 (WSGI, sync) — app.py
from flask import Flask, jsonify
app = Flask(__name__)

@app.get("/healthz")
def healthz():
    return jsonify(ok=True)

@app.get("/users/&lt;int:uid&gt;")
def get_user(uid):
    return jsonify(id=uid, name="dana")</pre>
<pre># FastAPI (ASGI, async-first, Pydantic v2) — main.py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class UserIn(BaseModel):
    email: str
    age: int = Field(ge=18, le=120)

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.post("/users", status_code=201)
async def create_user(u: UserIn):      # invalid body -&gt; automatic 422 with field errors
    return {"email": u.email}</pre>
<pre># Django 5 — users/views.py  (+ urls.py, models.py, settings.py ...)
from django.http import JsonResponse
from .models import User

def get_user(request, uid):
    u = User.objects.get(pk=uid)        # ORM, migrations, admin come for free
    return JsonResponse({"id": u.id, "email": u.email})</pre>
<table>
<tr><th></th><th>Flask</th><th>FastAPI</th><th>Django</th></tr>
<tr><td>Interface</td><td>WSGI (sync)</td><td>ASGI (async + sync)</td><td>WSGI or ASGI (async views since 3.1)</td></tr>
<tr><td>Philosophy</td><td>Micro, pick your own libs</td><td>Typed APIs, OpenAPI docs at <code>/docs</code></td><td>Batteries included: ORM, admin, auth, migrations</td></tr>
<tr><td>Validation</td><td>Add-on (marshmallow, pydantic)</td><td>Pydantic built in (422 on bad input)</td><td>Forms / DRF serializers</td></tr>
<tr><td>Prod server</td><td>gunicorn (sync/gthread)</td><td>uvicorn / gunicorn+uvicorn workers / granian</td><td>gunicorn (WSGI) or uvicorn (ASGI)</td></tr>
<tr><td>Sweet spot</td><td>Small services, glue</td><td>IO-heavy JSON APIs, ML model serving</td><td>CRUD products, back-offices, content</td></tr>
</table>
<blockquote>💡 Real world: Instagram runs one of the largest Django deployments in the world; many ML teams expose models through FastAPI. Neither proves the framework is "fast" — both prove that architecture and ops matter more than framework benchmarks.</blockquote>`,
        he: `<pre># Flask 3 (WSGI, sync) — app.py
from flask import Flask, jsonify
app = Flask(__name__)

@app.get("/healthz")
def healthz():
    return jsonify(ok=True)

@app.get("/users/&lt;int:uid&gt;")
def get_user(uid):
    return jsonify(id=uid, name="dana")</pre>
<pre># FastAPI (ASGI, async-first, Pydantic v2) — main.py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class UserIn(BaseModel):
    email: str
    age: int = Field(ge=18, le=120)

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.post("/users", status_code=201)
async def create_user(u: UserIn):      # invalid body -&gt; automatic 422 with field errors
    return {"email": u.email}</pre>
<pre># Django 5 — users/views.py  (+ urls.py, models.py, settings.py ...)
from django.http import JsonResponse
from .models import User

def get_user(request, uid):
    u = User.objects.get(pk=uid)        # ORM, migrations, admin come for free
    return JsonResponse({"id": u.id, "email": u.email})</pre>
<table>
<tr><th></th><th>Flask</th><th>FastAPI</th><th>Django</th></tr>
<tr><td>ממשק</td><td>WSGI (sync)</td><td>ASGI (async + sync)</td><td>WSGI או ASGI (async views מאז 3.1)</td></tr>
<tr><td>פילוסופיה</td><td>מיקרו, אתה בוחר ספריות</td><td>APIs עם types, תיעוד OpenAPI ב-<code>/docs</code></td><td>הכול כלול: ORM, admin, auth, migrations</td></tr>
<tr><td>Validation</td><td>תוסף (marshmallow, pydantic)</td><td>Pydantic מובנה (422 על קלט לא תקין)</td><td>Forms / serializers של DRF</td></tr>
<tr><td>שרת ל-prod</td><td>gunicorn (sync/gthread)</td><td>uvicorn / gunicorn עם uvicorn workers / granian</td><td>gunicorn ‏(WSGI) או uvicorn ‏(ASGI)</td></tr>
<tr><td>איפה הוא מצטיין</td><td>שירותים קטנים, glue</td><td>JSON APIs עתירי IO, הגשת מודלים של ML</td><td>מוצרי CRUD, back-office, תוכן</td></tr>
</table>
<blockquote>💡 Real world: אינסטגרם מריצה את אחד מה-deployments הגדולים בעולם של Django; הרבה צוותי ML חושפים מודלים דרך FastAPI. אף אחד מהם לא מוכיח שה-framework "מהיר" — שניהם מוכיחים שארכיטקטורה ו-ops חשובים יותר מ-benchmarks של frameworks.</blockquote>`
      }
    },
    {
      h: { en: "WSGI vs ASGI and the server zoo: gunicorn, uvicorn, granian", he: "WSGI מול ASGI וגן החיות של השרתים: gunicorn, ‏uvicorn, ‏granian" },
      body: {
        en: `<p>Python frameworks don't listen on sockets in production — a <strong>server</strong> does, and calls your app through a standard interface. <strong>WSGI</strong> (PEP 3333) is a sync function call: one request occupies one worker thread until it returns. <strong>ASGI</strong> is the async successor: an <code>async</code> callable that also supports WebSockets, long-polling and HTTP/2 streams.</p>
<table>
<tr><th>Server</th><th>Speaks</th><th>Model</th><th>Use it for</th></tr>
<tr><td>gunicorn <code>-k sync</code> (default)</td><td>WSGI</td><td>pre-fork processes, 1 request per worker</td><td>Flask/Django, CPU-ish or simple apps</td></tr>
<tr><td>gunicorn <code>-k gthread --threads 4</code></td><td>WSGI</td><td>processes × threads</td><td>Flask/Django that wait on DB/HTTP</td></tr>
<tr><td>gunicorn <code>-k uvicorn_worker.UvicornWorker</code></td><td>ASGI</td><td>gunicorn manages processes, each runs an asyncio loop</td><td>FastAPI with gunicorn's process mgmt</td></tr>
<tr><td>uvicorn <code>--workers N</code></td><td>ASGI</td><td>N processes, asyncio + uvloop + httptools</td><td>FastAPI/Starlette, one process per container in k8s</td></tr>
<tr><td>granian</td><td>WSGI + ASGI + RSGI</td><td>Rust (hyper/tokio) HTTP core</td><td>Higher throughput, HTTP/2, one binary for both worlds</td></tr>
</table>
<p><strong>Never</strong> run <code>flask run</code>, <code>app.run()</code> or <code>manage.py runserver</code> in production. They print it themselves: <code>WARNING: This is a development server. Do not use it in a production deployment.</code> They're single-process, have no worker supervision, no timeouts, auto-reload and (in debug) the Werkzeug debugger — which is remote code execution if exposed.</p>
<p><strong>How many workers?</strong></p>
<pre># sync workers (gunicorn docs' starting point)
workers = (2 x CPU) + 1          # 2 vCPU -&gt; 5 workers -&gt; max 5 concurrent requests

# gthread: concurrency = workers x threads
gunicorn app:app -k gthread -w 3 --threads 8      # 24 in-flight requests

# async (uvicorn): 1 worker per core is enough; each holds 1000s of idle connections
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2</pre>
<p>In Kubernetes, prefer <strong>fewer workers per Pod and more Pods</strong>: 1-2 vCPU per Pod, workers sized to the Pod's CPU <em>limit</em> (not the node's core count — <code>os.cpu_count()</code> returns the node's 64 cores and gunicorn happily spawns 129 workers that OOM the Pod).</p>
<blockquote>⚠️ Production tip: memory is per process. A Django worker is typically 80-200 MB RSS; 5 workers = up to 1 GB before any traffic. Use <code>--preload</code> to load the app once and share pages copy-on-write, and <code>--max-requests 1000 --max-requests-jitter 100</code> to recycle workers that leak.</blockquote>`,
        he: `<p>ב-production, frameworks של Python לא מאזינים על sockets בעצמם — <strong>שרת</strong> עושה את זה וקורא לאפליקציה דרך ממשק סטנדרטי. <strong>WSGI</strong> ‏(PEP 3333) הוא קריאת פונקציה סינכרונית: בקשה אחת תופסת thread של worker אחד עד שהיא חוזרת. <strong>ASGI</strong> הוא היורש ה-async: callable מסוג <code>async</code> שתומך גם ב-WebSockets, ב-long-polling וב-streams של HTTP/2.</p>
<table>
<tr><th>שרת</th><th>מדבר</th><th>מודל</th><th>מתי</th></tr>
<tr><td>gunicorn <code>-k sync</code> (ברירת מחדל)</td><td>WSGI</td><td>pre-fork processes, בקשה אחת לכל worker</td><td>Flask/Django, אפליקציות פשוטות או CPU-יות</td></tr>
<tr><td>gunicorn <code>-k gthread --threads 4</code></td><td>WSGI</td><td>processes × threads</td><td>Flask/Django שמחכים ל-DB/HTTP</td></tr>
<tr><td>gunicorn <code>-k uvicorn_worker.UvicornWorker</code></td><td>ASGI</td><td>gunicorn מנהל processes, בכל אחד רץ asyncio loop</td><td>FastAPI עם ניהול ה-processes של gunicorn</td></tr>
<tr><td>uvicorn <code>--workers N</code></td><td>ASGI</td><td>N processes, ‏asyncio + uvloop + httptools</td><td>FastAPI/Starlette, process אחד לכל container ב-k8s</td></tr>
<tr><td>granian</td><td>WSGI + ASGI + RSGI</td><td>ליבת HTTP ב-Rust ‏(hyper/tokio)</td><td>throughput גבוה יותר, HTTP/2, בינארי אחד לשני העולמות</td></tr>
</table>
<p><strong>לעולם</strong> אל תריץ <code>flask run</code>, ‏<code>app.run()</code> או <code>manage.py runserver</code> ב-production. הם אומרים את זה בעצמם: <code>WARNING: This is a development server. Do not use it in a production deployment.</code> הם process יחיד, בלי פיקוח על worker-ים, בלי timeouts, עם auto-reload, ובמצב debug — עם ה-debugger של Werkzeug, שזה בפועל remote code execution אם הוא חשוף.</p>
<p><strong>כמה worker-ים?</strong></p>
<pre># sync workers (gunicorn docs' starting point)
workers = (2 x CPU) + 1          # 2 vCPU -&gt; 5 workers -&gt; max 5 concurrent requests

# gthread: concurrency = workers x threads
gunicorn app:app -k gthread -w 3 --threads 8      # 24 in-flight requests

# async (uvicorn): 1 worker per core is enough; each holds 1000s of idle connections
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2</pre>
<p>ב-Kubernetes עדיף <strong>פחות worker-ים בכל Pod ויותר Pod-ים</strong>: ‏1-2 vCPU ל-Pod, ומספר ה-worker-ים לפי ה-CPU <em>limit</em> של ה-Pod (לא לפי מספר הליבות של ה-node — <code>os.cpu_count()</code> מחזיר את 64 הליבות של ה-node, ו-gunicorn מרים בשמחה 129 worker-ים שמפילים את ה-Pod על OOM).</p>
<blockquote>⚠️ Production tip: זיכרון הוא לכל process. worker של Django תופס בדרך כלל 80-200 MB RSS; חמישה worker-ים = עד 1 GB עוד לפני תעבורה. השתמש ב-<code>--preload</code> כדי לטעון את האפליקציה פעם אחת ולשתף דפים ב-copy-on-write, וב-<code>--max-requests 1000 --max-requests-jitter 100</code> כדי למחזר worker-ים שדולפים.</blockquote>`
      }
    },
    {
      h: { en: "The GIL, free-threaded Python, and the #1 FastAPI mistake", he: "ה-GIL, ‏Python בלי GIL, והטעות מספר 1 ב-FastAPI" },
      body: {
        en: `<p>CPython's <strong>GIL</strong> lets only one thread execute Python bytecode at a time per process. Threads still help for IO (the GIL is released while waiting on sockets), but CPU-bound code needs <em>processes</em> — which is exactly why gunicorn/uvicorn fork workers. <strong>Free-threaded Python</strong> (PEP 703) shipped as an experimental build in 3.13 (<code>python3.13t</code>) and became officially supported — but still optional, not the default — in 3.14. Single-thread overhead dropped from roughly 40% in 3.13 to around 5-10% in 3.14, and C extensions must declare support. For web services in 2026: keep the process model; treat free-threading as something to benchmark, not to bet on.</p>
<p><strong>The #1 FastAPI mistake: blocking inside <code>async def</code>.</strong> FastAPI runs <code>async def</code> endpoints directly on the event loop, and plain <code>def</code> endpoints in a thread pool (AnyIO, 40 threads by default). So a sync call inside <code>async def</code> freezes <em>every</em> request in that worker:</p>
<pre>import time, requests, httpx, asyncio

@app.get("/bad")
async def bad():
    time.sleep(1)                         # blocks the loop: whole worker stalls 1 s
    r = requests.get("https://api.x.com") # sync HTTP: same disaster
    return r.json()

@app.get("/ok-sync")
def ok_sync():                            # plain def -&gt; runs in the thread pool
    return requests.get("https://api.x.com").json()

client = httpx.AsyncClient(timeout=2.0)   # ONE shared client: pooled keep-alive connections

@app.get("/good")
async def good():
    r = await client.get("https://api.x.com")   # async, explicit timeout
    await asyncio.sleep(0)                # never time.sleep in async code
    return r.json()

@app.get("/cpu")
async def cpu():
    return await asyncio.to_thread(resize_image)      # offload blocking work</pre>
<p>Symptoms in production: p99 latency jumps for <em>all</em> endpoints (even <code>/healthz</code>), CPU looks low, and liveness probes time out — so kubelet restarts healthy-but-stuck Pods. Same traps: <code>psycopg2</code> / sync SQLAlchemy sessions, <code>boto3</code>, <code>pandas</code> work inside <code>async def</code>. Use <code>asyncpg</code>/<code>psycopg</code> 3 async, <code>aioboto3</code>, or just write a plain <code>def</code>.</p>
<blockquote>💡 Real world: enable asyncio debug mode in staging (<code>PYTHONASYNCIODEBUG=1</code>) — it logs <code>Executing &lt;Task ...&gt; took 0.512 seconds</code> for every callback that blocks the loop longer than 100 ms.</blockquote>`,
        he: `<p>ה-<strong>GIL</strong> של CPython מאפשר רק ל-thread אחד בכל process להריץ bytecode של Python בכל רגע. threads עדיין עוזרים ל-IO (ה-GIL משתחרר בזמן המתנה ל-sockets), אבל קוד CPU-bound צריך <em>processes</em> — ובדיוק בגלל זה gunicorn ו-uvicorn עושים fork ל-worker-ים. <strong>Python בלי GIL</strong> ‏(free-threaded, ‏PEP 703) יצא כ-build ניסיוני ב-3.13 ‏(<code>python3.13t</code>) והפך לנתמך רשמית — אבל עדיין אופציונלי ולא ברירת המחדל — ב-3.14. התקורה ב-thread יחיד ירדה מבערך 40% ב-3.13 לבערך 5-10% ב-3.14, ו-C extensions צריכים להצהיר על תמיכה. לשירותי web ב-2026: תישאר עם מודל ה-processes; free-threading זה משהו למדוד ב-benchmark, לא להמר עליו.</p>
<p><strong>הטעות מספר 1 ב-FastAPI: קריאה חוסמת בתוך <code>async def</code>.</strong> ‏FastAPI מריץ endpoints של <code>async def</code> ישירות על ה-event loop, ו-endpoints של <code>def</code> רגיל ב-thread pool ‏(AnyIO, ‏40 threads כברירת מחדל). לכן קריאה סינכרונית בתוך <code>async def</code> מקפיאה <em>כל</em> בקשה באותו worker:</p>
<pre>import time, requests, httpx, asyncio

@app.get("/bad")
async def bad():
    time.sleep(1)                         # blocks the loop: whole worker stalls 1 s
    r = requests.get("https://api.x.com") # sync HTTP: same disaster
    return r.json()

@app.get("/ok-sync")
def ok_sync():                            # plain def -&gt; runs in the thread pool
    return requests.get("https://api.x.com").json()

client = httpx.AsyncClient(timeout=2.0)   # ONE shared client: pooled keep-alive connections

@app.get("/good")
async def good():
    r = await client.get("https://api.x.com")   # async, explicit timeout
    await asyncio.sleep(0)                # never time.sleep in async code
    return r.json()

@app.get("/cpu")
async def cpu():
    return await asyncio.to_thread(resize_image)      # offload blocking work</pre>
<p>הסימפטומים ב-production: ה-p99 latency קופץ ל-<em>כל</em> ה-endpoints (גם <code>/healthz</code>), ה-CPU נראה נמוך, וה-liveness probes עושים timeout — אז ה-kubelet מאתחל Pod-ים שהם תקינים אבל תקועים. אותן מלכודות: ‏<code>psycopg2</code> או sessions סינכרוניים של SQLAlchemy, ‏<code>boto3</code>, ועבודת <code>pandas</code> בתוך <code>async def</code>. השתמש ב-<code>asyncpg</code> או ב-<code>psycopg</code> 3 במצב async, ב-<code>aioboto3</code>, או פשוט כתוב <code>def</code> רגיל.</p>
<blockquote>💡 Real world: תפעיל את ה-debug mode של asyncio ב-staging ‏(<code>PYTHONASYNCIODEBUG=1</code>) — הוא כותב ללוג <code>Executing &lt;Task ...&gt; took 0.512 seconds</code> על כל callback שחוסם את ה-loop יותר מ-100 ms.</blockquote>`
      }
    },
    {
      h: { en: "Django in production: ORM, migrations, admin, connections, Celery", he: "Django ב-production: ‏ORM, ‏migrations, ‏admin, חיבורים ו-Celery" },
      body: {
        en: `<ul>
<li><strong>ORM &amp; N+1</strong>: <code>for o in Order.objects.all(): o.customer.name</code> runs 1 + N queries. Use <code>select_related("customer")</code> (JOIN) / <code>prefetch_related</code>, and watch query counts with django-debug-toolbar or <code>assertNumQueries</code> in tests.</li>
<li><strong>Migrations</strong>: <code>makemigrations</code> in dev (commit the files), <code>migrate</code> once per deploy — as a Kubernetes Job or Helm pre-upgrade hook, <em>not</em> in every Pod's entrypoint (10 replicas racing the same <code>ALTER TABLE</code>). Use <code>sqlmigrate</code> to see the SQL before running it on a 200M-row table.</li>
<li><strong>Admin</strong>: a free back-office — and a target. Move it off <code>/admin/</code>, put it behind SSO/VPN, never expose it on the public ingress.</li>
<li><strong>DB connections</strong>: <code>CONN_MAX_AGE</code> defaults to <code>0</code> — a new Postgres connection (TCP + TLS + auth, ~5-20 ms) per request. Set <code>CONN_MAX_AGE=60</code> with <code>CONN_HEALTH_CHECKS=True</code>, or use Django 5.1+'s native psycopg pool (<code>"OPTIONS": {"pool": True}</code>), or PgBouncer. Budget: Pods × workers × pool size must stay under Postgres <code>max_connections</code> (default 100).</li>
<li><strong>Background work → Celery</strong>: never send emails or render PDFs inside the request. <code>send_receipt.delay(order_id)</code> puts a task on Redis/RabbitMQ; separate worker Pods run <code>celery -A proj worker --concurrency=4</code>. Make tasks idempotent and set <code>acks_late=True</code> so a killed worker's task is redelivered.</li>
</ul>
<pre># settings.py (production bits)
DEBUG = False                                   # True leaks settings + stack traces
ALLOWED_HOSTS = ["api.shop.com"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "HOST": os.environ["DB_HOST"], "CONN_MAX_AGE": 60, "CONN_HEALTH_CHECKS": True,
    "OPTIONS": {"options": "-c statement_timeout=5000"},   # 5 s per query
}}
STATIC_ROOT = "/app/static"                     # collectstatic at build, serve via CDN/whitenoise</pre>
<blockquote>⚠️ Production tip: a <code>/healthz</code> (liveness) should only prove the worker answers; a <code>/readyz</code> may check the DB with a 1-second timeout. Never put a Celery broker or third-party API check in liveness — see the k8s probes lesson.</blockquote>`,
        he: `<ul>
<li><strong>ORM ו-N+1</strong>: ‏<code>for o in Order.objects.all(): o.customer.name</code> מריץ 1 + N שאילתות. השתמש ב-<code>select_related("customer")</code> ‏(JOIN) או ב-<code>prefetch_related</code>, ותעקוב אחרי מספר השאילתות עם django-debug-toolbar או <code>assertNumQueries</code> בטסטים.</li>
<li><strong>Migrations</strong>: ‏<code>makemigrations</code> בפיתוח (ועושים commit לקבצים), ו-<code>migrate</code> פעם אחת בכל deploy — כ-Job של Kubernetes או כ-pre-upgrade hook של Helm, <em>לא</em> ב-entrypoint של כל Pod (עשרה replicas שמתחרים על אותו <code>ALTER TABLE</code>). השתמש ב-<code>sqlmigrate</code> כדי לראות את ה-SQL לפני שמריצים אותו על טבלה של 200 מיליון שורות.</li>
<li><strong>Admin</strong>: ‏back-office בחינם — וגם מטרה לתוקפים. תזיז אותו מ-<code>/admin/</code>, תשים אותו מאחורי SSO או VPN, ואל תחשוף אותו ב-ingress הציבורי.</li>
<li><strong>חיבורי DB</strong>: ‏<code>CONN_MAX_AGE</code> הוא <code>0</code> כברירת מחדל — חיבור Postgres חדש (TCP + TLS + auth, בערך 5-20 ms) לכל בקשה. תגדיר <code>CONN_MAX_AGE=60</code> עם <code>CONN_HEALTH_CHECKS=True</code>, או תשתמש ב-pool המובנה של psycopg מ-Django 5.1 ‏(<code>"OPTIONS": {"pool": True}</code>), או ב-PgBouncer. התקציב: Pod-ים × worker-ים × גודל pool חייב להישאר מתחת ל-<code>max_connections</code> של Postgres (ברירת מחדל 100).</li>
<li><strong>עבודת רקע → Celery</strong>: אף פעם לא שולחים מיילים או מרנדרים PDF בתוך הבקשה. ‏<code>send_receipt.delay(order_id)</code> שם task על Redis או RabbitMQ; ‏Pod-ים נפרדים של worker מריצים <code>celery -A proj worker --concurrency=4</code>. תעשה את ה-tasks אידמפוטנטיים ותגדיר <code>acks_late=True</code>, כדי ש-task של worker שנהרג יישלח מחדש.</li>
</ul>
<pre># settings.py (production bits)
DEBUG = False                                   # True leaks settings + stack traces
ALLOWED_HOSTS = ["api.shop.com"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "HOST": os.environ["DB_HOST"], "CONN_MAX_AGE": 60, "CONN_HEALTH_CHECKS": True,
    "OPTIONS": {"options": "-c statement_timeout=5000"},   # 5 s per query
}}
STATIC_ROOT = "/app/static"                     # collectstatic at build, serve via CDN/whitenoise</pre>
<blockquote>⚠️ Production tip: ‏<code>/healthz</code> ‏(liveness) צריך רק להוכיח שה-worker עונה; ‏<code>/readyz</code> יכול לבדוק את ה-DB עם timeout של שנייה. אף פעם אל תכניס בדיקה של broker של Celery או של API חיצוני ל-liveness — ראה את השיעור על probes ב-k8s.</blockquote>`
      }
    },
    {
      h: { en: "Dockerfiles, timeouts and the gunicorn-vs-LB trap", he: "Dockerfiles, ‏timeouts והמלכודת של gunicorn מול ה-LB" },
      body: {
        en: `<pre># Dockerfile — Flask/Django on gunicorn
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput   # Django only
USER 1000
EXPOSE 8000
CMD ["gunicorn", "proj.wsgi:application", "-b", "0.0.0.0:8000",
     "-k", "gthread", "-w", "3", "--threads", "4",
     "--timeout", "30", "--graceful-timeout", "25", "--keep-alive", "75",
     "--max-requests", "1000", "--max-requests-jitter", "100",
     "--access-logfile", "-"]</pre>
<pre># Dockerfile — FastAPI on uvicorn (one process per container; scale with replicas)
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # fastapi uvicorn[standard]
COPY . .
USER 1000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000",
     "--timeout-keep-alive", "75", "--timeout-graceful-shutdown", "25",
     "--proxy-headers", "--forwarded-allow-ips", "*"]</pre>
<p>Use the exec form (<code>CMD ["..."]</code>) so gunicorn/uvicorn is PID 1 and receives SIGTERM — a shell-form CMD wraps it in <code>/bin/sh -c</code>, which doesn't forward signals.</p>
<table>
<tr><th>Setting</th><th>Default</th><th>What it really does</th></tr>
<tr><td>gunicorn <code>--timeout</code></td><td>30 s</td><td>Arbiter kills a worker silent for that long (sync: one request too slow → <code>[CRITICAL] WORKER TIMEOUT</code>, SIGKILL, client gets 502 from the LB)</td></tr>
<tr><td>gunicorn <code>--graceful-timeout</code></td><td>30 s</td><td>Time workers get to finish in-flight requests after SIGTERM; keep under the Pod's <code>terminationGracePeriodSeconds</code> (30 s)</td></tr>
<tr><td>gunicorn <code>--keep-alive</code></td><td>2 s</td><td>Idle keep-alive time (only for non-sync workers). Behind an LB with a 60 s idle timeout → raise above it</td></tr>
<tr><td>uvicorn <code>--timeout-keep-alive</code></td><td>5 s</td><td>Same trap as Node's 5 s: shorter than ALB's 60 s idle timeout → sporadic 502s</td></tr>
</table>
<blockquote>⚠️ Production tip: the request timeout must <em>nest</em>: DB <code>statement_timeout</code> (5 s) &lt; gunicorn <code>--timeout</code> (30 s) &lt; LB request timeout (60 s) — so the innermost layer fails first with a clean error instead of the LB returning a bare 504. The keep-alive timeout goes the <em>other</em> way: app idle timeout &gt; LB idle timeout, so the LB always closes idle connections first.</blockquote>`,
        he: `<pre># Dockerfile — Flask/Django on gunicorn
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput   # Django only
USER 1000
EXPOSE 8000
CMD ["gunicorn", "proj.wsgi:application", "-b", "0.0.0.0:8000",
     "-k", "gthread", "-w", "3", "--threads", "4",
     "--timeout", "30", "--graceful-timeout", "25", "--keep-alive", "75",
     "--max-requests", "1000", "--max-requests-jitter", "100",
     "--access-logfile", "-"]</pre>
<pre># Dockerfile — FastAPI on uvicorn (one process per container; scale with replicas)
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # fastapi uvicorn[standard]
COPY . .
USER 1000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000",
     "--timeout-keep-alive", "75", "--timeout-graceful-shutdown", "25",
     "--proxy-headers", "--forwarded-allow-ips", "*"]</pre>
<p>תשתמש ב-exec form ‏(<code>CMD ["..."]</code>) כדי ש-gunicorn או uvicorn יהיו PID 1 ויקבלו את ה-SIGTERM — CMD ב-shell form עוטף אותם ב-<code>/bin/sh -c</code>, שלא מעביר signals הלאה.</p>
<table>
<tr><th>הגדרה</th><th>ברירת מחדל</th><th>מה היא באמת עושה</th></tr>
<tr><td>gunicorn <code>--timeout</code></td><td>30 s</td><td>ה-arbiter הורג worker ששותק כל כך הרבה זמן (ב-sync: בקשה אחת איטית מדי → <code>[CRITICAL] WORKER TIMEOUT</code>, ‏SIGKILL, והלקוח מקבל 502 מה-LB)</td></tr>
<tr><td>gunicorn <code>--graceful-timeout</code></td><td>30 s</td><td>הזמן שיש ל-worker-ים לסיים בקשות פתוחות אחרי SIGTERM; תשאיר אותו מתחת ל-<code>terminationGracePeriodSeconds</code> של ה-Pod ‏(30 s)</td></tr>
<tr><td>gunicorn <code>--keep-alive</code></td><td>2 s</td><td>זמן idle של keep-alive (רק ל-workers שאינם sync). מאחורי LB עם idle timeout של 60 s → להעלות מעליו</td></tr>
<tr><td>uvicorn <code>--timeout-keep-alive</code></td><td>5 s</td><td>אותה מלכודת כמו ה-5 s של Node: קצר מה-idle timeout של 60 s ב-ALB → ‏502 ספורדיים</td></tr>
</table>
<blockquote>⚠️ Production tip: ה-request timeouts חייבים <em>להיות מקוננים</em>: ה-<code>statement_timeout</code> של ה-DB ‏(5 s) קטן מה-<code>--timeout</code> של gunicorn ‏(30 s), שקטן מה-request timeout של ה-LB ‏(60 s) — כך השכבה הפנימית נכשלת ראשונה עם שגיאה נקייה, במקום שה-LB יחזיר 504 ריק. ה-keep-alive timeout הולך <em>הפוך</em>: ה-idle timeout של האפליקציה גדול מזה של ה-LB, כדי שה-LB תמיד יסגור חיבורים idle ראשון.</blockquote>`
      }
    }
  ],
  diagram: "client -> ALB (idle 60s) -> Pod: gunicorn arbiter (PID 1)\n                                   |-- worker 1 (sync | gthread x4 | uvicorn loop)\n                                   |-- worker 2\n                                   `-- worker N = (2 x CPU limit) + 1\n         each worker -> DB pool (Pods x workers x pool < max_connections)\n         slow work -> Redis/RabbitMQ -> Celery worker Pods",
  handsOn: [
    { cmd: "pip install fastapi uvicorn[standard] && uvicorn main:app --workers 2 --timeout-keep-alive 75", what: { en: "Run FastAPI the production way: multiple processes, keep-alive above the LB idle timeout.", he: "להריץ FastAPI כמו ב-production: כמה processes, ו-keep-alive מעל ה-idle timeout של ה-LB." } },
    { cmd: "gunicorn app:app -k gthread -w 3 --threads 8 --timeout 30 --access-logfile -", what: { en: "Serve Flask with 3 processes × 8 threads = 24 concurrent requests, logs to stdout.", he: "להגיש Flask עם 3 processes × ‏8 threads = ‏24 בקשות במקביל, עם לוגים ל-stdout." } },
    { cmd: "hey -n 200 -c 50 http://localhost:8000/bad & curl -w '%{time_total}\\n' -s -o /dev/null localhost:8000/healthz", what: { en: "Prove the async trap: while /bad blocks the loop with time.sleep, even /healthz takes seconds.", he: "להוכיח את המלכודת: בזמן ש-/bad חוסם את ה-loop עם time.sleep, אפילו /healthz לוקח שניות." } },
    { cmd: "python manage.py sqlmigrate orders 0042 && python manage.py migrate --plan", what: { en: "See the exact SQL and the plan before a migration runs against production.", he: "לראות את ה-SQL המדויק ואת התוכנית לפני ש-migration רץ מול production." } }
  ],
  mnemonic: {
    en: "\"Dev server never, sync = 2×CPU+1, async = don't block, keep-alive > LB.\"",
    he: "\"dev server אף פעם, sync זה 2×CPU+1, ב-async לא חוסמים, keep-alive גדול מה-LB.\""
  },
  pitfalls: [
    { en: "Calling requests/psycopg2/time.sleep inside async def — one call stalls every request in the worker. Use async libraries, asyncio.to_thread, or a plain def endpoint.", he: "לקרוא ל-requests, ל-psycopg2 או ל-time.sleep בתוך async def — קריאה אחת מקפיאה כל בקשה ב-worker. השתמש בספריות async, ב-asyncio.to_thread, או ב-endpoint של def רגיל." },
    { en: "Sizing workers from os.cpu_count() in a container — it returns the node's cores, not the Pod's CPU limit, so you spawn dozens of workers and get OOMKilled.", he: "לקבוע את מספר ה-worker-ים לפי os.cpu_count() בתוך container — הוא מחזיר את הליבות של ה-node ולא את ה-CPU limit של ה-Pod, אז מרימים עשרות worker-ים ומקבלים OOMKilled." },
    { en: "Running migrate in every Pod's entrypoint — replicas race on DDL locks; run migrations once as a Job before the rollout.", he: "להריץ migrate ב-entrypoint של כל Pod — ה-replicas מתחרים על locks של DDL; מריצים migrations פעם אחת כ-Job לפני ה-rollout." },
    { en: "Leaving uvicorn's 5 s / gunicorn's 2 s keep-alive behind a 60 s LB idle timeout — the server closes connections the LB still reuses, causing random 502s.", he: "להשאיר את ה-keep-alive של 5 s ב-uvicorn או 2 s ב-gunicorn מאחורי LB עם idle timeout של 60 s — השרת סוגר חיבורים שה-LB עדיין משתמש בהם, וזה נגמר ב-502 אקראיים." }
  ],
  interview: [
    { q: { en: "Your FastAPI service's p99 jumps to 3 s under load, but CPU is at 20%. What do you suspect?", he: "ה-p99 של שירות FastAPI קופץ ל-3 s תחת עומס, אבל ה-CPU על 20%. מה החשד שלך?" },
      a: { en: "A blocking call inside an async def endpoint (sync DB driver, requests, time.sleep, heavy pandas). It freezes the event loop, so all requests queue behind it while CPU stays low. Confirm with asyncio debug mode or py-spy dump; fix with async drivers, asyncio.to_thread, or converting the endpoint to plain def so it runs in the thread pool.", he: "קריאה חוסמת בתוך endpoint של async def (driver סינכרוני ל-DB, ‏requests, ‏time.sleep, ‏pandas כבד). היא מקפיאה את ה-event loop, אז כל הבקשות נעמדות בתור מאחוריה בזמן שה-CPU נשאר נמוך. מאמתים עם ה-debug mode של asyncio או עם py-spy dump; מתקנים עם drivers אסינכרוניים, ‏asyncio.to_thread, או הפיכת ה-endpoint ל-def רגיל כדי שירוץ ב-thread pool." } },
    { q: { en: "How do you size gunicorn for a Django app on a 2-vCPU Pod that mostly waits on Postgres?", he: "איך תקבע את gunicorn לאפליקציית Django על Pod של 2 vCPU שבעיקר מחכה ל-Postgres?" },
      a: { en: "Start with gthread: (2×2)+1 = 5 workers or fewer processes with threads (e.g. 3 × 8 = 24 concurrent), check RSS per worker against the memory limit, and make sure Pods × workers × DB connections stays under max_connections (or put PgBouncer in front). Then load test and adjust; keep --timeout below the LB timeout and --graceful-timeout below terminationGracePeriodSeconds.", he: "מתחילים עם gthread: ‏(2×2)+1 = ‏5 worker-ים, או פחות processes עם threads (למשל 3 × 8 = ‏24 במקביל), בודקים RSS לכל worker מול ה-memory limit, ומוודאים ש-Pod-ים × worker-ים × חיבורי DB נשאר מתחת ל-max_connections (או שמים PgBouncer לפני). אחר כך load test וכיוונון; ה-<code>--timeout</code> מתחת ל-timeout של ה-LB, וה-<code>--graceful-timeout</code> מתחת ל-terminationGracePeriodSeconds." } }
  ],
  quiz: [
    { q: { en: "In FastAPI, where does a plain def (non-async) endpoint run?", he: "ב-FastAPI, איפה רץ endpoint שמוגדר עם def רגיל (לא async)?" },
      options: [
        { en: "Directly on the event loop", he: "ישירות על ה-event loop" },
        { en: "In a thread pool, so blocking calls don't freeze the loop", he: "ב-thread pool, כך שקריאות חוסמות לא מקפיאות את ה-loop" },
        { en: "In a new process per request", he: "ב-process חדש לכל בקשה" },
        { en: "It's not allowed — FastAPI requires async def", he: "זה אסור — FastAPI מחייב async def" }
      ], answer: 1,
      explain: { en: "FastAPI/Starlette offloads sync endpoints to an AnyIO thread pool (40 threads by default). async def endpoints run on the loop itself — which is why blocking calls there are so harmful.", he: "‏FastAPI/Starlette מעבירים endpoints סינכרוניים ל-thread pool של AnyIO ‏(40 threads כברירת מחדל). endpoints של async def רצים על ה-loop עצמו — ולכן קריאות חוסמות שם מזיקות כל כך." } },
    { q: { en: "A sync gunicorn worker handles a 45 s report request with default settings. What happens?", he: "worker סינכרוני של gunicorn מטפל בבקשת דוח של 45 s עם הגדרות ברירת מחדל. מה קורה?" },
      options: [
        { en: "It completes normally", he: "היא מסתיימת כרגיל" },
        { en: "gunicorn logs WORKER TIMEOUT after 30 s and kills the worker; the client gets an error", he: "‏gunicorn כותב WORKER TIMEOUT אחרי 30 s והורג את ה-worker; הלקוח מקבל שגיאה" },
        { en: "gunicorn queues it for a background thread", he: "‏gunicorn מעביר אותה ל-thread ברקע" },
        { en: "The LB automatically retries on another Pod and succeeds", he: "ה-LB מנסה שוב אוטומטית על Pod אחר ומצליח" }
      ], answer: 1,
      explain: { en: "The default --timeout is 30 s. Long work belongs in a background job (Celery) with polling or a callback — not in the request.", he: "ברירת המחדל של <code>--timeout</code> היא 30 s. עבודה ארוכה שייכת ל-job ברקע (Celery) עם polling או callback — לא לבקשה." } },
    { q: { en: "Why is os.cpu_count() dangerous for sizing workers in Kubernetes?", he: "למה os.cpu_count() מסוכן לקביעת מספר worker-ים ב-Kubernetes?" },
      options: [
        { en: "It returns 0 in containers", he: "הוא מחזיר 0 בתוך containers" },
        { en: "It returns the node's CPU count, not the Pod's CPU limit", he: "הוא מחזיר את מספר ה-CPU של ה-node, לא את ה-CPU limit של ה-Pod" },
        { en: "It counts only physical cores, ignoring hyperthreads", he: "הוא סופר רק ליבות פיזיות ומתעלם מ-hyperthreads" },
        { en: "It is slow to call", he: "הוא איטי לקריאה" }
      ], answer: 1,
      explain: { en: "On a 64-core node, (2×64)+1 = 129 workers in a Pod limited to 2 CPU and 1 GiB → throttling and OOMKill. Set workers explicitly (env var) from the Pod's limit.", he: "על node של 64 ליבות, ‏(2×64)+1 = ‏129 worker-ים בתוך Pod שמוגבל ל-2 CPU ו-1 GiB → ‏throttling ו-OOMKill. קובעים את מספר ה-worker-ים במפורש (משתנה סביבה) לפי ה-limit של ה-Pod." } },
    { q: { en: "Which ordering of timeouts is correct for a request path?", he: "איזה סדר של timeouts נכון למסלול של בקשה?" },
      options: [
        { en: "DB statement_timeout < app request timeout < LB timeout", he: "‏statement_timeout של ה-DB < ה-timeout של האפליקציה < ה-timeout של ה-LB" },
        { en: "LB timeout < app timeout < DB timeout", he: "ה-timeout של ה-LB < ה-timeout של האפליקציה < ה-timeout של ה-DB" },
        { en: "All equal, so they fail together", he: "כולם שווים, כדי שייכשלו ביחד" },
        { en: "Only the LB needs a timeout", he: "רק ל-LB צריך timeout" }
      ], answer: 0,
      explain: { en: "Inner layers must give up first so the app can return a meaningful error (and free resources) before the outer layer cuts the connection with a generic 504.", he: "השכבות הפנימיות צריכות לוותר ראשונות, כדי שהאפליקציה תחזיר שגיאה עם משמעות (ותשחרר משאבים) לפני שהשכבה החיצונית חותכת את החיבור עם 504 גנרי." } }
  ],
  playground: "resources",
  related: ["pr-platforms", "pr-event-loop", "pr-async-await", "pr-concurrency-parallelism", "k8s-probes", "db-operations", "arch-queues"]
});

INFRA.glossary.push(
  { term: "WSGI", track: "architecture", def: { en: "Web Server Gateway Interface (PEP 3333): the synchronous standard between Python web servers (gunicorn, uWSGI) and apps (Flask, Django); one request occupies one worker thread.", he: "‏Web Server Gateway Interface ‏(PEP 3333): הסטנדרט הסינכרוני בין שרתי web של Python ‏(gunicorn, ‏uWSGI) לאפליקציות (Flask, ‏Django); בקשה אחת תופסת thread אחד של worker." }, lesson: "python-web-frameworks" },
  { term: "ASGI", track: "architecture", def: { en: "Asynchronous Server Gateway Interface: the async successor to WSGI, used by FastAPI/Starlette/Django async with servers like uvicorn, hypercorn and granian; supports WebSockets and long-lived connections.", he: "‏Asynchronous Server Gateway Interface: היורש האסינכרוני של WSGI, שמשמש את FastAPI, ‏Starlette ו-Django במצב async עם שרתים כמו uvicorn, ‏hypercorn ו-granian; תומך ב-WebSockets ובחיבורים ארוכים." }, lesson: "python-web-frameworks" },
  { term: "Gunicorn", track: "architecture", def: { en: "Pre-fork Python WSGI server: an arbiter process supervises N workers (sync, gthread, or uvicorn ASGI workers), restarts dead ones and kills workers silent longer than --timeout (30 s default).", he: "שרת WSGI של Python במודל pre-fork: תהליך arbiter מפקח על N worker-ים (sync, ‏gthread או uvicorn workers של ASGI), מרים מחדש worker-ים שמתו והורג worker-ים ששותקים יותר מ-<code>--timeout</code> ‏(30 s כברירת מחדל)." }, lesson: "python-web-frameworks" }
);

INFRA.lessons.push({
  id: "node-web-frameworks",
  track: "architecture",
  order: 71,
  icon: "🟩",
  level: 2,
  minutes: 15,
  title: { en: "Express vs Fastify vs NestJS (and Hono) in Production", he: "Express מול Fastify מול NestJS (ו-Hono) ב-production" },
  tldr: {
    en: "Every Node framework sits on the same single-threaded event loop and the same http.Server — so production issues are the same everywhere: never block the loop, one process per container, keepAliveTimeout above the LB idle timeout, and a real SIGTERM handler.",
    he: "כל ה-frameworks של Node יושבים על אותו event loop חד-תהליכוני ועל אותו http.Server — אז הבעיות ב-production זהות בכולם: לא חוסמים את ה-loop, ‏process אחד לכל container, ‏keepAliveTimeout מעל ה-idle timeout של ה-LB, ו-handler אמיתי ל-SIGTERM."
  },
  analogy: {
    en: "Express, Fastify and NestJS are different uniforms on the same single receptionist. Express is a T-shirt (wear anything), Fastify is running gear (fast, strict schemas), NestJS is a full suit with a badge and org chart (modules, DI, decorators). Whatever he wears, there's still one receptionist — if he stops to do long math by hand, the whole lobby waits; and if he hangs up idle phones after 5 seconds while the switchboard (the LB) thinks lines stay open for 60, some callers hear a dial tone (502).",
    he: "‏Express, ‏Fastify ו-NestJS הם מדים שונים על אותו פקיד קבלה יחיד. Express זה טי-שירט (תלבש מה שבא לך), Fastify זה בגדי ריצה (מהיר, schemas קשוחים), ו-NestJS זה חליפה מלאה עם תג ועץ ארגוני (modules, ‏DI, ‏decorators). לא משנה מה הוא לובש, עדיין יש פקיד אחד — אם הוא עוצר לעשות חישוב ארוך בראש, כל הלובי מחכה; ואם הוא מנתק קווים שקטים אחרי 5 שניות בזמן שהמרכזייה (ה-LB) חושבת שהם פתוחים 60, חלק מהמתקשרים שומעים צליל חיוג (502)."
  },
  sections: [
    {
      h: { en: "Four frameworks, one endpoint", he: "ארבעה frameworks, ‏endpoint אחד" },
      body: {
        en: `<pre>// Express 5 — minimal, huge middleware ecosystem; async errors now reach the error handler
import express from "express";
const app = express();
app.use(express.json({ limit: "100kb" }));          // 100kb is also the default
app.get("/healthz", (req, res) =&gt; res.json({ ok: true }));
app.post("/users", async (req, res) =&gt; res.status(201).json(await createUser(req.body)));
const server = app.listen(3000);</pre>
<pre>// Fastify 5 — JSON-schema validation + serialization, pino logger built in
import Fastify from "fastify";
const app = Fastify({ logger: true, bodyLimit: 1048576 });   // 1 MiB default
app.post("/users", {
  schema: { body: { type: "object", required: ["email"],
            properties: { email: { type: "string", format: "email" } } } }
}, async (req, reply) =&gt; reply.code(201).send(await createUser(req.body)));   // bad body -&gt; 400
await app.listen({ port: 3000, host: "0.0.0.0" });</pre>
<pre>// NestJS 11 — Angular-style modules, DI, decorators; runs on Express (default) or Fastify adapter
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Post() create(@Body() dto: CreateUserDto) { return this.users.create(dto); }  // class-validator DTO
}
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();                 // without this, SIGTERM never reaches onModuleDestroy
await app.listen(3000);</pre>
<pre>// Hono — Web-standard Request/Response; same code on Node, Bun, Deno, Cloudflare Workers
import { Hono } from "hono";
import { serve } from "@hono/node-server";
const app = new Hono();
app.get("/healthz", (c) =&gt; c.json({ ok: true }));
serve({ fetch: app.fetch, port: 3000 });</pre>
<table>
<tr><th></th><th>Express</th><th>Fastify</th><th>NestJS</th><th>Hono</th></tr>
<tr><td>Style</td><td>Minimal, middleware chain</td><td>Plugins + schemas</td><td>Opinionated architecture</td><td>Tiny, edge-first</td></tr>
<tr><td>Rough req/s (hello JSON, 1 core)</td><td>~15-20k</td><td>~45-70k</td><td>≈ its adapter, minus DI overhead</td><td>~40-60k on Node</td></tr>
<tr><td>Validation</td><td>Add zod/joi/celebrate</td><td>JSON Schema (ajv) built in</td><td>class-validator pipes</td><td>zod validator middleware</td></tr>
<tr><td>Default keepAliveTimeout</td><td>5 s (Node default)</td><td>72 s</td><td>its adapter's</td><td>5 s (Node default)</td></tr>
<tr><td>Pick when</td><td>Legacy, max ecosystem</td><td>New perf-sensitive APIs</td><td>Big teams, enterprise structure</td><td>Edge/serverless, multi-runtime</td></tr>
</table>
<blockquote>💡 Real world: the framework rarely is the bottleneck — your DB calls are. Fastify's real production win is schema-based serialization (faster JSON.stringify, and it won't leak fields you didn't declare) and pino logging by default.</blockquote>`,
        he: `<pre>// Express 5 — minimal, huge middleware ecosystem; async errors now reach the error handler
import express from "express";
const app = express();
app.use(express.json({ limit: "100kb" }));          // 100kb is also the default
app.get("/healthz", (req, res) =&gt; res.json({ ok: true }));
app.post("/users", async (req, res) =&gt; res.status(201).json(await createUser(req.body)));
const server = app.listen(3000);</pre>
<pre>// Fastify 5 — JSON-schema validation + serialization, pino logger built in
import Fastify from "fastify";
const app = Fastify({ logger: true, bodyLimit: 1048576 });   // 1 MiB default
app.post("/users", {
  schema: { body: { type: "object", required: ["email"],
            properties: { email: { type: "string", format: "email" } } } }
}, async (req, reply) =&gt; reply.code(201).send(await createUser(req.body)));   // bad body -&gt; 400
await app.listen({ port: 3000, host: "0.0.0.0" });</pre>
<pre>// NestJS 11 — Angular-style modules, DI, decorators; runs on Express (default) or Fastify adapter
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Post() create(@Body() dto: CreateUserDto) { return this.users.create(dto); }  // class-validator DTO
}
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();                 // without this, SIGTERM never reaches onModuleDestroy
await app.listen(3000);</pre>
<pre>// Hono — Web-standard Request/Response; same code on Node, Bun, Deno, Cloudflare Workers
import { Hono } from "hono";
import { serve } from "@hono/node-server";
const app = new Hono();
app.get("/healthz", (c) =&gt; c.json({ ok: true }));
serve({ fetch: app.fetch, port: 3000 });</pre>
<table>
<tr><th></th><th>Express</th><th>Fastify</th><th>NestJS</th><th>Hono</th></tr>
<tr><td>סגנון</td><td>מינימלי, שרשרת middleware</td><td>Plugins + schemas</td><td>ארכיטקטורה דעתנית</td><td>זעיר, edge-first</td></tr>
<tr><td>req/s בערך (hello JSON, ליבה אחת)</td><td>~15-20k</td><td>~45-70k</td><td>בערך כמו ה-adapter שלו, פחות תקורת DI</td><td>~40-60k על Node</td></tr>
<tr><td>Validation</td><td>מוסיפים zod/joi/celebrate</td><td>JSON Schema ‏(ajv) מובנה</td><td>pipes של class-validator</td><td>middleware של zod</td></tr>
<tr><td>keepAliveTimeout ברירת מחדל</td><td>5 s (של Node)</td><td>72 s</td><td>של ה-adapter</td><td>5 s (של Node)</td></tr>
<tr><td>מתי לבחור</td><td>Legacy, מקסימום ecosystem</td><td>APIs חדשים רגישי ביצועים</td><td>צוותים גדולים, מבנה enterprise</td><td>Edge/serverless, כמה runtimes</td></tr>
</table>
<blockquote>💡 Real world: ה-framework כמעט אף פעם לא צוואר הבקבוק — הקריאות ל-DB כן. היתרון האמיתי של Fastify ב-production הוא serialization מבוסס schema ‏(JSON.stringify מהיר יותר, והוא לא ידליף שדות שלא הצהרת עליהם) ולוגים של pino כברירת מחדל.</blockquote>`
      }
    },
    {
      h: { en: "One thread: blocking the loop, and clustering vs more Pods", he: "thread אחד: חסימת ה-loop, ו-cluster מול עוד Pod-ים" },
      body: {
        en: `<p>Every framework above runs your handlers on <strong>one</strong> JS thread (see the event loop lesson for the mechanics). Production consequences:</p>
<ul>
<li><strong>Sync work blocks everyone</strong>: <code>crypto.pbkdf2Sync</code> / <code>bcrypt.hashSync</code> (~100 ms each), <code>JSON.parse</code> of a 20 MB body (~200 ms), <code>zlib.gzipSync</code>, a catastrophic regex (ReDoS). At 100 ms sync per request, one process caps at 10 req/s. Fixes: async variants (<code>crypto.pbkdf2</code> runs on the libuv pool, 4 threads by default — <code>UV_THREADPOOL_SIZE</code>), body size limits, streaming parsers, <code>worker_threads</code> (piscina) for real CPU work.</li>
<li><strong>Measure loop lag</strong>: <code>perf_hooks.monitorEventLoopDelay()</code> or prom-client's default <code>nodejs_eventloop_lag_seconds</code>. Alert when p99 lag &gt; 100 ms.</li>
</ul>
<p><strong>Using more cores</strong>: on a VM you'd use <code>node:cluster</code> or <code>pm2 start app.js -i max</code> (a primary forks N workers sharing the port). In Kubernetes the rule is <strong>one Node process per container</strong>, ~1 vCPU per Pod, and scale with replicas + HPA:</p>
<table>
<tr><th></th><th>PM2 / cluster in one container</th><th>1 process per Pod (k8s)</th></tr>
<tr><td>Restart on crash</td><td>PM2 restarts the worker</td><td>kubelet restarts the container</td></tr>
<tr><td>Health / readiness</td><td>Hidden: the Pod looks healthy while workers flap</td><td>Per process, visible to probes and the LB</td></tr>
<tr><td>Metrics &amp; logs</td><td>Need aggregation across workers</td><td>One process = one series, one stdout</td></tr>
<tr><td>Memory limit</td><td>N heaps share one cgroup — one OOM kills all</td><td>Each Pod sized for one heap</td></tr>
<tr><td>Signals</td><td>PM2 must forward SIGTERM correctly</td><td>Node gets SIGTERM directly</td></tr>
</table>
<blockquote>⚠️ Production tip: <code>-i max</code> and <code>os.cpus().length</code> see the <em>node's</em> 64 cores, not the Pod's limit — same trap as gunicorn. If you must cluster, use <code>os.availableParallelism()</code> plus an explicit env var. PM2 is fine on plain VMs; on k8s it duplicates what the orchestrator already does.</blockquote>`,
        he: `<p>כל ה-frameworks שלמעלה מריצים את ה-handlers שלך על thread <strong>אחד</strong> של JS (המנגנון מוסבר בשיעור על ה-event loop). ההשלכות ב-production:</p>
<ul>
<li><strong>עבודה סינכרונית חוסמת את כולם</strong>: ‏<code>crypto.pbkdf2Sync</code> או <code>bcrypt.hashSync</code> (בערך 100 ms כל אחד), ‏<code>JSON.parse</code> על body של 20 MB (בערך 200 ms), ‏<code>zlib.gzipSync</code>, ‏regex קטסטרופלי (ReDoS). עם 100 ms סינכרוני לבקשה, process אחד מוגבל ל-10 req/s. התיקונים: גרסאות async ‏(<code>crypto.pbkdf2</code> רץ על ה-pool של libuv, ‏4 threads כברירת מחדל — <code>UV_THREADPOOL_SIZE</code>), הגבלת גודל body, ‏parsers של streaming, ו-<code>worker_threads</code> ‏(piscina) לעבודת CPU אמיתית.</li>
<li><strong>תמדוד lag של ה-loop</strong>: ‏<code>perf_hooks.monitorEventLoopDelay()</code> או ה-metric הדיפולטי של prom-client ‏<code>nodejs_eventloop_lag_seconds</code>. התראה כשה-p99 של ה-lag מעל 100 ms.</li>
</ul>
<p><strong>שימוש ביותר ליבות</strong>: על VM היית משתמש ב-<code>node:cluster</code> או ב-<code>pm2 start app.js -i max</code> ‏(primary שעושה fork ל-N worker-ים שחולקים את ה-port). ב-Kubernetes הכלל הוא <strong>process אחד של Node לכל container</strong>, בערך 1 vCPU ל-Pod, ו-scale עם replicas ו-HPA:</p>
<table>
<tr><th></th><th>PM2 או cluster בתוך container אחד</th><th>process אחד לכל Pod ‏(k8s)</th></tr>
<tr><td>Restart אחרי קריסה</td><td>‏PM2 מרים את ה-worker מחדש</td><td>ה-kubelet מרים את ה-container מחדש</td></tr>
<tr><td>Health / readiness</td><td>מוסתר: ה-Pod נראה תקין בזמן שה-workers קורסים וקמים</td><td>לכל process, גלוי ל-probes ול-LB</td></tr>
<tr><td>Metrics ולוגים</td><td>צריך לאגרגט בין worker-ים</td><td>process אחד = סדרה אחת, ‏stdout אחד</td></tr>
<tr><td>Memory limit</td><td>N heaps חולקים cgroup אחד — OOM אחד הורג את כולם</td><td>כל Pod מתוכנן ל-heap אחד</td></tr>
<tr><td>Signals</td><td>‏PM2 חייב להעביר SIGTERM נכון</td><td>‏Node מקבל SIGTERM ישירות</td></tr>
</table>
<blockquote>⚠️ Production tip: ‏<code>-i max</code> ו-<code>os.cpus().length</code> רואים את 64 הליבות של ה-<em>node</em>, לא את ה-limit של ה-Pod — אותה מלכודת כמו ב-gunicorn. אם חייבים cluster, השתמש ב-<code>os.availableParallelism()</code> יחד עם משתנה סביבה מפורש. ‏PM2 בסדר על VMs רגילים; ב-k8s הוא משכפל את מה שה-orchestrator כבר עושה.</blockquote>`
      }
    },
    {
      h: { en: "The 502 bug: keepAliveTimeout vs the LB idle timeout", he: "באג ה-502: ‏keepAliveTimeout מול ה-idle timeout של ה-LB" },
      body: {
        en: `<p>An ALB (and most L7 LBs, nginx upstream keepalive, Envoy) reuses TCP connections to your Pods. AWS ALB's default <strong>idle timeout is 60 s</strong>. Node's <code>http.Server</code> default <code>keepAliveTimeout</code> is <strong>5 s</strong>. So after 5 idle seconds Node sends FIN — but the ALB believes the connection is good for 55 more seconds. If the ALB sends a request on that connection at the same instant Node closes it, the request hits a closed socket, and the client gets a <strong>502</strong> generated by the ALB — no app log, no error in your APM, ~0.01-0.5% of requests, worse at low/medium traffic when connections sit idle.</p>
<pre>// Fix: the server must keep idle connections LONGER than the LB does
const server = app.listen(3000);
server.keepAliveTimeout = 65_000;   // &gt; ALB idle timeout (60 s)
server.headersTimeout   = 66_000;   // keep &gt; keepAliveTimeout (old Node bug made this mandatory)
// server.requestTimeout default is 300_000 (5 min) in Node 18+: lower it to ~30_000 for APIs

// Fastify: Fastify({ keepAliveTimeout: 72000 })  -- already its default
// NestJS:  const s = app.getHttpServer(); s.keepAliveTimeout = 65000;</pre>
<table>
<tr><th>Component</th><th>Default idle / keep-alive</th></tr>
<tr><td>AWS ALB idle timeout</td><td>60 s (configurable 1-4000 s)</td></tr>
<tr><td>GCP external HTTP(S) LB backend keep-alive</td><td>600 s (so backends need &gt; 620 s)</td></tr>
<tr><td>nginx <code>keepalive_timeout</code> (to clients)</td><td>75 s</td></tr>
<tr><td>Node <code>http.Server.keepAliveTimeout</code></td><td>5 s</td></tr>
<tr><td>Fastify <code>keepAliveTimeout</code></td><td>72 s</td></tr>
<tr><td>uvicorn / gunicorn keep-alive</td><td>5 s / 2 s</td></tr>
</table>
<blockquote>💡 Real world: the signature in CloudWatch is <code>HTTPCode_ELB_502_Count</code> rising while <code>HTTPCode_Target_5XX_Count</code> stays at 0; in ALB access logs the line shows <code>elb_status_code=502</code>, <code>target_status_code=-</code> and <code>-1</code> processing times. See the on-call scenario "node-keepalive-502s".</blockquote>`,
        he: `<p>‏ALB (ורוב ה-LBs של L7, ‏upstream keepalive של nginx, ‏Envoy) עושה שימוש חוזר בחיבורי TCP ל-Pod-ים שלך. ה-<strong>idle timeout</strong> הדיפולטי של AWS ALB הוא <strong>60 s</strong>. ה-<code>keepAliveTimeout</code> הדיפולטי של <code>http.Server</code> ב-Node הוא <strong>5 s</strong>. אז אחרי 5 שניות של שקט Node שולח FIN — אבל ה-ALB בטוח שהחיבור תקין עוד 55 שניות. אם ה-ALB שולח בקשה על החיבור הזה בדיוק ברגע ש-Node סוגר אותו, הבקשה פוגעת ב-socket סגור והלקוח מקבל <strong>502</strong> שה-ALB ייצר — בלי לוג באפליקציה, בלי שגיאה ב-APM, בערך 0.01-0.5% מהבקשות, וגרוע יותר בתעבורה נמוכה-בינונית, כשחיבורים יושבים idle.</p>
<pre>// Fix: the server must keep idle connections LONGER than the LB does
const server = app.listen(3000);
server.keepAliveTimeout = 65_000;   // &gt; ALB idle timeout (60 s)
server.headersTimeout   = 66_000;   // keep &gt; keepAliveTimeout (old Node bug made this mandatory)
// server.requestTimeout default is 300_000 (5 min) in Node 18+: lower it to ~30_000 for APIs

// Fastify: Fastify({ keepAliveTimeout: 72000 })  -- already its default
// NestJS:  const s = app.getHttpServer(); s.keepAliveTimeout = 65000;</pre>
<table>
<tr><th>רכיב</th><th>idle / keep-alive ברירת מחדל</th></tr>
<tr><td>AWS ALB idle timeout</td><td>60 s (ניתן לשינוי 1-4000 s)</td></tr>
<tr><td>keep-alive ל-backend ב-GCP external HTTP(S) LB</td><td>600 s (אז ה-backends צריכים יותר מ-620 s)</td></tr>
<tr><td>nginx <code>keepalive_timeout</code> (מול לקוחות)</td><td>75 s</td></tr>
<tr><td>Node <code>http.Server.keepAliveTimeout</code></td><td>5 s</td></tr>
<tr><td>Fastify <code>keepAliveTimeout</code></td><td>72 s</td></tr>
<tr><td>uvicorn / gunicorn keep-alive</td><td>5 s / 2 s</td></tr>
</table>
<blockquote>💡 Real world: החתימה ב-CloudWatch היא <code>HTTPCode_ELB_502_Count</code> שעולה בזמן ש-<code>HTTPCode_Target_5XX_Count</code> נשאר על 0; ב-access logs של ה-ALB השורה מראה <code>elb_status_code=502</code>, ‏<code>target_status_code=-</code> וזמני עיבוד של <code>-1</code>. ראה את תרחיש ה-on-call ‏"node-keepalive-502s".</blockquote>`
      }
    },
    {
      h: { en: "Graceful shutdown, logging with pino, and memory limits", he: "Graceful shutdown, לוגים עם pino ו-memory limits" },
      body: {
        en: `<pre>// Graceful shutdown for Express/Hono/raw http (Fastify: app.close(); Nest: enableShutdownHooks)
let shuttingDown = false;
app.get("/readyz", (req, res) =&gt; res.status(shuttingDown ? 503 : 200).end());

process.on("SIGTERM", async () =&gt; {
  shuttingDown = true;                          // 1. fail readiness
  await new Promise(r =&gt; setTimeout(r, 5000));  // 2. let endpoints/LB notice (or use a preStop sleep)
  server.close(async () =&gt; {                    // 3. stop accepting, finish in-flight
    await db.end(); await redis.quit();         // 4. close pools
    process.exit(0);
  });
  server.closeIdleConnections();                // drop idle keep-alives now (Node 18.2+)
  setTimeout(() =&gt; process.exit(1), 20000).unref();   // 5. hard stop before the 30 s SIGKILL
});</pre>
<ul>
<li><strong>PID 1</strong>: <code>CMD ["node", "server.js"]</code>, not <code>npm start</code> — npm/yarn wrappers don't reliably forward SIGTERM. Node as PID 1 has no default SIGTERM action: without a handler it ignores it and dies only at SIGKILL after 30 s. <code>docker run --init</code> or tini also reaps zombies.</li>
<li><strong>Logging</strong>: <code>console.log</code> is synchronous to a pipe/file and unstructured. Use <strong>pino</strong> (Fastify's built-in, ~5× faster than winston): JSON lines to stdout, <code>pino-http</code> for per-request logs with a request id, <code>redact: ["req.headers.authorization"]</code>. Pretty-print only in dev (<code>pino-pretty</code>).</li>
<li><strong>Memory</strong>: the V8 heap limit (<code>--max-old-space-size</code>) is derived from host memory and, depending on Node version, may not match your container limit. Set it explicitly to ~75% of the limit, leaving room for buffers, native addons and thread stacks: limit 1 GiB → <code>NODE_OPTIONS=--max-old-space-size=768</code>. Too high → the kernel OOMKills (exit 137) before V8 GCs; too low → <code>FATAL ERROR: Reached heap limit</code>.</li>
</ul>
<pre>FROM node:22-slim
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=768
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]</pre>
<p><strong>Bun &amp; Deno</strong>: Bun (JavaScriptCore, Zig) runs most Node/Express/Hono code with faster startup and a built-in <code>Bun.serve</code>; Deno 2 adds npm compatibility, a permission sandbox and <code>Deno.serve</code>. Both are production-viable for greenfield services, but every operational rule here (one loop, timeouts, SIGTERM, memory limit) still applies — check native-addon and APM-agent support before switching.</p>`,
        he: `<pre>// Graceful shutdown for Express/Hono/raw http (Fastify: app.close(); Nest: enableShutdownHooks)
let shuttingDown = false;
app.get("/readyz", (req, res) =&gt; res.status(shuttingDown ? 503 : 200).end());

process.on("SIGTERM", async () =&gt; {
  shuttingDown = true;                          // 1. fail readiness
  await new Promise(r =&gt; setTimeout(r, 5000));  // 2. let endpoints/LB notice (or use a preStop sleep)
  server.close(async () =&gt; {                    // 3. stop accepting, finish in-flight
    await db.end(); await redis.quit();         // 4. close pools
    process.exit(0);
  });
  server.closeIdleConnections();                // drop idle keep-alives now (Node 18.2+)
  setTimeout(() =&gt; process.exit(1), 20000).unref();   // 5. hard stop before the 30 s SIGKILL
});</pre>
<ul>
<li><strong>PID 1</strong>: ‏<code>CMD ["node", "server.js"]</code> ולא <code>npm start</code> — העטיפות של npm ו-yarn לא מעבירות SIGTERM בצורה אמינה. ל-Node כ-PID 1 אין פעולת ברירת מחדל ל-SIGTERM: בלי handler הוא מתעלם ממנו ומת רק ב-SIGKILL אחרי 30 s. ‏<code>docker run --init</code> או tini גם אוספים zombies.</li>
<li><strong>לוגים</strong>: ‏<code>console.log</code> סינכרוני כשהוא כותב ל-pipe או לקובץ, ולא מובנה. תשתמש ב-<strong>pino</strong> (מובנה ב-Fastify, בערך פי 5 מהיר מ-winston): שורות JSON ל-stdout, ‏<code>pino-http</code> ללוג לכל בקשה עם request id, ו-<code>redact: ["req.headers.authorization"]</code>. הדפסה יפה רק בפיתוח (<code>pino-pretty</code>).</li>
<li><strong>זיכרון</strong>: ה-heap limit של V8 ‏(<code>--max-old-space-size</code>) נגזר מהזיכרון של המכונה, ותלוי בגרסת Node — הוא לא בהכרח מתאים ל-limit של ה-container. תגדיר אותו במפורש לבערך 75% מה-limit, ותשאיר מקום ל-buffers, ל-native addons ול-stacks של threads: ‏limit של 1 GiB → <code>NODE_OPTIONS=--max-old-space-size=768</code>. גבוה מדי → הקרנל עושה OOMKill ‏(exit 137) לפני ש-V8 מספיק לעשות GC; נמוך מדי → <code>FATAL ERROR: Reached heap limit</code>.</li>
</ul>
<pre>FROM node:22-slim
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=768
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]</pre>
<p><strong>Bun ו-Deno</strong>: ‏Bun ‏(JavaScriptCore, ‏Zig) מריץ את רוב הקוד של Node, ‏Express ו-Hono עם startup מהיר יותר ו-<code>Bun.serve</code> מובנה; ‏Deno 2 מוסיף תאימות ל-npm, ‏sandbox של הרשאות ו-<code>Deno.serve</code>. שניהם בשלים ל-production בשירותים חדשים, אבל כל כלל תפעולי כאן (loop אחד, ‏timeouts, ‏SIGTERM, ‏memory limit) עדיין תקף — תבדוק תמיכה ב-native addons וב-agent של ה-APM לפני שעוברים.</p>`
      }
    }
  ],
  diagram: "client --(keep-alive)--> ALB  [idle timeout 60 s]\n                           |   reuses pooled TCP connections\n                           v\n                 Pod: node server.js (PID 1, 1 event loop)\n                      keepAliveTimeout 65 s  > 60 s   OK\n                      keepAliveTimeout  5 s  < 60 s   -> FIN races next request -> ELB 502",
  handsOn: [
    { cmd: "node -e \"const s=require('http').createServer((q,r)=>r.end('ok')).listen(3000);console.log(s.keepAliveTimeout, s.headersTimeout, s.requestTimeout)\"", what: { en: "Print Node's real defaults on your version: 5000 60000 300000.", he: "להדפיס את ברירות המחדל האמיתיות של Node בגרסה שלך: 5000 60000 300000." } },
    { cmd: "curl -sv http://localhost:3000/ http://localhost:3000/ 2>&1 | grep -iE 're-using|connected|keep-alive'", what: { en: "Watch connection reuse and the Keep-Alive: timeout=5 response header.", he: "לראות שימוש חוזר בחיבור ואת ה-header ‏Keep-Alive: timeout=5 בתשובה." } },
    { cmd: "node --cpu-prof server.js  # then load test and open the .cpuprofile in Chrome DevTools", what: { en: "Find what blocks the event loop: long sync frames (JSON.parse, pbkdf2Sync, regex) stand out.", he: "למצוא מה חוסם את ה-event loop: frames סינכרוניים ארוכים (JSON.parse, ‏pbkdf2Sync, ‏regex) בולטים מיד." } },
    { cmd: "kubectl exec deploy/api -- node -e \"console.log(require('v8').getHeapStatistics().heap_size_limit/1048576)\"", what: { en: "Check the actual heap limit (MiB) inside the Pod versus its memory limit.", he: "לבדוק את ה-heap limit האמיתי (MiB) בתוך ה-Pod מול ה-memory limit שלו." } }
  ],
  mnemonic: {
    en: "\"One loop, one process, one Pod — and keep-alive outlives the LB.\"",
    he: "\"loop אחד, ‏process אחד, ‏Pod אחד — וה-keep-alive חי יותר מה-LB.\""
  },
  pitfalls: [
    { en: "Leaving Node's 5 s keepAliveTimeout behind a 60 s ALB — intermittent ELB-generated 502s with nothing in app logs.", he: "להשאיר את ה-keepAliveTimeout של 5 s ב-Node מאחורי ALB של 60 s — ‏502 לסירוגין שה-ELB מייצר, בלי שום דבר בלוגים של האפליקציה." },
    { en: "CMD [\"npm\", \"start\"] — SIGTERM may never reach Node, so every deploy waits 30 s and SIGKILLs in-flight requests.", he: "‏CMD [\"npm\", \"start\"] — ה-SIGTERM אולי לא יגיע ל-Node, אז כל deploy מחכה 30 s ועושה SIGKILL לבקשות באמצע." },
    { en: "Running PM2 -i max inside a Pod — N heaps in one memory limit, crashes hidden from probes, and the node's core count instead of the Pod's.", he: "להריץ PM2 -i max בתוך Pod — ‏N heaps בתוך memory limit אחד, קריסות מוסתרות מה-probes, ומספר הליבות של ה-node במקום של ה-Pod." },
    { en: "No --max-old-space-size in a container — V8 sizes the heap from host memory, and the cgroup OOMKills with exit 137 before GC kicks in.", he: "בלי <code>--max-old-space-size</code> ב-container — ‏V8 קובע את ה-heap לפי הזיכרון של המכונה, וה-cgroup עושה OOMKill עם exit 137 לפני שה-GC נכנס לפעולה." }
  ],
  interview: [
    { q: { en: "Behind an ALB you see 0.2% 502s, nothing in app logs, and Target_5XX at zero. Walk me through it.", he: "מאחורי ALB אתה רואה 0.2% של 502, כלום בלוגים של האפליקציה, ו-Target_5XX על אפס. תוביל אותי." },
      a: { en: "ELB-generated 502 with no target status means the target closed or reset the connection. Classic cause: app keep-alive (Node 5 s) shorter than ALB idle (60 s), so Node FINs a connection the ALB just reused. Confirm in access logs (target_status_code '-', -1 processing times) and correlate with idle gaps; fix by setting keepAliveTimeout to 65 s and headersTimeout to 66 s, then watch HTTPCode_ELB_502_Count drop.", he: "‏502 שה-ELB ייצר בלי סטטוס מה-target אומר שה-target סגר או עשה reset לחיבור. הסיבה הקלאסית: ה-keep-alive של האפליקציה (5 s ב-Node) קצר מה-idle של ה-ALB ‏(60 s), אז Node שולח FIN על חיבור שה-ALB בדיוק עשה בו שימוש חוזר. מאמתים ב-access logs ‏(target_status_code '-', זמני עיבוד של -1) ומצליבים עם פערי idle; מתקנים עם keepAliveTimeout של 65 s ו-headersTimeout של 66 s, ובודקים ש-HTTPCode_ELB_502_Count יורד." } },
    { q: { en: "Cluster module or more Pods for a Node API on Kubernetes?", he: "‏cluster module או עוד Pod-ים ל-API של Node על Kubernetes?" },
      a: { en: "More Pods: one process per container, ~1 vCPU each, scaled by HPA. Kubernetes already restarts, load-balances and health-checks processes; clustering inside a Pod hides crashes from probes, shares one memory limit across heaps and complicates metrics and signals. Use worker_threads only for CPU-heavy work inside a request.", he: "עוד Pod-ים: ‏process אחד לכל container, בערך 1 vCPU לכל אחד, עם scale של HPA. ‏Kubernetes כבר עושה restart, ‏load balancing ו-health checks ל-processes; ‏cluster בתוך Pod מסתיר קריסות מה-probes, מחלק memory limit אחד בין כמה heaps ומסבך metrics ו-signals. ‏worker_threads רק לעבודת CPU כבדה בתוך בקשה." } }
  ],
  quiz: [
    { q: { en: "What is Node's default http.Server keepAliveTimeout?", he: "מה ה-keepAliveTimeout הדיפולטי של http.Server ב-Node?" },
      options: [
        { en: "5 seconds", he: "5 שניות" },
        { en: "60 seconds", he: "60 שניות" },
        { en: "75 seconds", he: "75 שניות" },
        { en: "Unlimited", he: "ללא הגבלה" }
      ], answer: 0,
      explain: { en: "5000 ms. ALB's idle timeout defaults to 60 s, so the server must be raised above it (e.g. 65 s) to avoid the keep-alive race. Fastify defaults to 72 s for exactly this reason.", he: "‏5000 ms. ה-idle timeout של ALB הוא 60 s כברירת מחדל, אז צריך להעלות את השרת מעליו (למשל 65 s) כדי למנוע את מרוץ ה-keep-alive. ‏Fastify בוחר 72 s כברירת מחדל בדיוק בגלל זה." } },
    { q: { en: "A handler calls crypto.pbkdf2Sync (100 ms). What's the max throughput of that single Node process for this endpoint?", he: "handler קורא ל-crypto.pbkdf2Sync ‏(100 ms). מה ה-throughput המקסימלי של process יחיד של Node ל-endpoint הזה?" },
      options: [
        { en: "~10 req/s — and every other endpoint stalls meanwhile", he: "בערך 10 req/s — וכל שאר ה-endpoints נתקעים בינתיים" },
        { en: "~40 req/s thanks to the 4-thread libuv pool", he: "בערך 40 req/s בזכות ה-pool של libuv עם 4 threads" },
        { en: "Unlimited, Node is async", he: "ללא הגבלה, ‏Node הוא async" },
        { en: "~1000 req/s", he: "בערך 1000 req/s" }
      ], answer: 0,
      explain: { en: "The Sync variant runs on the main thread: 1 s / 100 ms = 10 req/s total. The async crypto.pbkdf2 runs on the libuv pool (4 threads by default), freeing the loop.", he: "גרסת ה-Sync רצה על ה-main thread: ‏1 s / 100 ms = ‏10 req/s בסך הכול. ה-crypto.pbkdf2 האסינכרוני רץ על ה-pool של libuv ‏(4 threads כברירת מחדל) ומשחרר את ה-loop." } },
    { q: { en: "Your Pod has a 1 GiB memory limit. Which NODE_OPTIONS is sensible?", he: "ל-Pod שלך יש memory limit של 1 GiB. איזה NODE_OPTIONS הגיוני?" },
      options: [
        { en: "--max-old-space-size=1024", he: "‏--max-old-space-size=1024" },
        { en: "--max-old-space-size=768", he: "‏--max-old-space-size=768" },
        { en: "--max-old-space-size=4096", he: "‏--max-old-space-size=4096" },
        { en: "None — V8 always reads cgroup limits", he: "כלום — ‏V8 תמיד קורא את ה-cgroup limits" }
      ], answer: 1,
      explain: { en: "~75% of the limit leaves headroom for off-heap memory (buffers, native code, stacks). Setting it equal to the limit lets the kernel OOMKill the process before V8 tries hard to GC.", he: "בערך 75% מה-limit משאיר מרווח לזיכרון מחוץ ל-heap ‏(buffers, קוד native, ‏stacks). אם קובעים אותו שווה ל-limit, הקרנל יעשה OOMKill לפני ש-V8 ינסה ברצינות לעשות GC." } },
    { q: { en: "Why is CMD [\"npm\", \"start\"] a problem in Kubernetes?", he: "למה CMD [\"npm\", \"start\"] הוא בעיה ב-Kubernetes?" },
      options: [
        { en: "npm is too slow to start", he: "‏npm איטי מדי בעלייה" },
        { en: "SIGTERM may not be forwarded to Node, so graceful shutdown never runs and the Pod is SIGKILLed", he: "ה-SIGTERM אולי לא יועבר ל-Node, אז ה-graceful shutdown לא רץ וה-Pod מקבל SIGKILL" },
        { en: "npm can't read environment variables", he: "‏npm לא יכול לקרוא משתני סביבה" },
        { en: "It disables keep-alive", he: "זה מבטל keep-alive" }
      ], answer: 1,
      explain: { en: "Run node directly as PID 1 (exec form) and handle SIGTERM yourself; add --init/tini if you spawn child processes.", he: "תריץ את node ישירות כ-PID 1 ‏(exec form) ותטפל ב-SIGTERM בעצמך; תוסיף --init או tini אם אתה מריץ child processes." } }
  ],
  playground: "lb",
  related: ["pr-event-loop", "pr-platforms", "pr-async-await", "k8s-probes", "processes-linux", "net-load-balancing", "python-web-frameworks"]
});

INFRA.glossary.push(
  { term: "keepAliveTimeout (Node.js)", track: "architecture", def: { en: "How long Node's http.Server keeps an idle keep-alive connection open (default 5 s). Must exceed the load balancer's idle timeout (ALB: 60 s) or the server closes connections the LB reuses, causing 502s.", he: "כמה זמן ה-http.Server של Node משאיר חיבור keep-alive פתוח כשהוא idle (ברירת מחדל 5 s). חייב להיות גדול מה-idle timeout של ה-LB ‏(ALB: ‏60 s), אחרת השרת סוגר חיבורים שה-LB משתמש בהם שוב, וזה נגמר ב-502." }, lesson: "node-web-frameworks" },
  { term: "PM2", track: "architecture", def: { en: "A Node.js process manager: restarts crashed apps, runs cluster mode (-i max) and manages logs on VMs; on Kubernetes it duplicates the orchestrator, so one node process per container is preferred.", he: "‏process manager ל-Node.js: מרים מחדש אפליקציות שקרסו, מריץ cluster mode ‏(-i max) ומנהל לוגים על VMs; ב-Kubernetes הוא משכפל את ה-orchestrator, ולכן עדיף process אחד של node לכל container." }, lesson: "node-web-frameworks" }
);

INFRA.lessons.push({
  id: "jvm-dotnet-go-web",
  track: "architecture",
  order: 72,
  icon: "☕",
  level: 3,
  minutes: 17,
  title: { en: "Spring Boot, ASP.NET Core, Go & Rust Web Services in Production", he: "Spring Boot, ‏ASP.NET Core, ‏Go ו-Rust: שירותי web ב-production" },
  tldr: {
    en: "Compiled/JIT stacks give you real multi-core concurrency out of the box — but each has one default that bites in containers: the JVM's 25% heap, Go's zero timeouts, .NET's generous Kestrel limits, and a DB pool far smaller than your thread count.",
    he: "‏stacks מקומפלים או עם JIT נותנים מקביליות אמיתית על כמה ליבות מהקופסה — אבל לכל אחד יש ברירת מחדל אחת שנושכת ב-containers: ה-heap של 25% ב-JVM, ה-timeouts של אפס ב-Go, ה-limits הנדיבים של Kestrel ב-.NET, ו-pool של DB שקטן בהרבה ממספר ה-threads."
  },
  analogy: {
    en: "Spring Boot is a big hotel kitchen: slow to open in the morning, then industrial-grade. ASP.NET Core is the same hotel run by a very tidy manager with a checklist for everything. Go is a food truck that opens in a second — but ships with the doors unlocked (no timeouts) unless you lock them. Rust (Axum) is a Formula-1 pit crew: fastest and leanest, but you need trained people. And whichever kitchen you pick, there are only ten stoves (the DB pool): hiring a thousand cooks (virtual threads, goroutines) just makes a longer queue at the stoves.",
    he: "‏Spring Boot זה מטבח של מלון גדול: לוקח זמן להיפתח בבוקר, ואז עובד ברמה תעשייתית. ‏ASP.NET Core זה אותו מלון בניהול של מנהל מסודר מאוד עם checklist לכל דבר. ‏Go זה food truck שנפתח תוך שנייה — אבל יוצא לדרך עם דלתות לא נעולות (בלי timeouts) אלא אם אתה נועל אותן. ‏Rust ‏(Axum) זה צוות pit של פורמולה 1: הכי מהיר והכי רזה, אבל צריך אנשים מיומנים. ולא משנה איזה מטבח תבחר, יש רק עשר כיריים (ה-pool של ה-DB): להעסיק אלף טבחים (virtual threads, ‏goroutines) רק יוצר תור ארוך יותר ליד הכיריים."
  },
  sections: [
    {
      h: { en: "The same service in four stacks", he: "אותו שירות בארבעה stacks" },
      body: {
        en: `<pre>// Spring Boot 3 (Java 21)
@RestController
class UserController {
  private final UserRepo repo;
  UserController(UserRepo repo) { this.repo = repo; }

  @GetMapping("/users/{id}")
  ResponseEntity&lt;User&gt; get(@PathVariable long id) {
    return ResponseEntity.of(repo.findById(id));          // Optional&lt;User&gt; -&gt; 200 or 404
  }
}
# application.yml
spring.threads.virtual.enabled: true        # Tomcat handles each request on a virtual thread
server.shutdown: graceful                   # default since Boot 3.4</pre>
<pre>// ASP.NET Core (.NET 8/10) — minimal API, Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.MapGet("/users/{id:int}", async (int id, AppDb db) =&gt;
    await db.Users.FindAsync(id) is User u ? Results.Ok(u) : Results.NotFound());
app.MapHealthChecks("/healthz");
app.Run();                                  // Kestrel, listens on :8080 in the official images</pre>
<pre>// Go 1.22+ — stdlib router with methods and path params (no framework needed)
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    json.NewEncoder(w).Encode(map[string]string{"id": id})
})
// Gin:  r.GET("/users/:id", func(c *gin.Context) { c.JSON(200, gin.H{"id": c.Param("id")}) })
// Chi:  r.Get("/users/{id}", h)   -- 100% net/http-compatible handlers and middleware
// Echo: e.GET("/users/:id", func(c echo.Context) error { return c.JSON(200, ...) })</pre>
<pre>// Rust — Axum 0.8 on tokio
async fn get_user(Path(id): Path&lt;u64&gt;) -&gt; Json&lt;serde_json::Value&gt; {
    Json(serde_json::json!({ "id": id }))
}
let app = Router::new().route("/users/{id}", get(get_user));
let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await?;</pre>
<table>
<tr><th>Stack</th><th>Concurrency per request</th><th>What limits you first</th></tr>
<tr><td>Spring MVC (classic)</td><td>Thread-per-request, Tomcat <code>threads.max</code> = 200</td><td>200 blocked threads → requests queue (accept-count 100), then refused</td></tr>
<tr><td>Spring + virtual threads (Java 21+)</td><td>One cheap virtual thread per request</td><td>The DB pool (HikariCP default 10) and downstream limits</td></tr>
<tr><td>Spring WebFlux</td><td>Event loop (Netty), reactive types</td><td>Any blocking call on the loop; steep learning curve</td></tr>
<tr><td>ASP.NET Core</td><td>Thread pool + async/await on Kestrel</td><td>Sync-over-async (<code>.Result</code>) → thread-pool starvation</td></tr>
<tr><td>Go</td><td>One goroutine per connection (~2-8 KB stack)</td><td>Missing timeouts, unbounded goroutines, DB pool</td></tr>
<tr><td>Rust (Axum/tokio)</td><td>Async tasks on a work-stealing runtime</td><td>Blocking calls inside async (use <code>spawn_blocking</code>)</td></tr>
</table>`,
        he: `<pre>// Spring Boot 3 (Java 21)
@RestController
class UserController {
  private final UserRepo repo;
  UserController(UserRepo repo) { this.repo = repo; }

  @GetMapping("/users/{id}")
  ResponseEntity&lt;User&gt; get(@PathVariable long id) {
    return ResponseEntity.of(repo.findById(id));          // Optional&lt;User&gt; -&gt; 200 or 404
  }
}
# application.yml
spring.threads.virtual.enabled: true        # Tomcat handles each request on a virtual thread
server.shutdown: graceful                   # default since Boot 3.4</pre>
<pre>// ASP.NET Core (.NET 8/10) — minimal API, Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.MapGet("/users/{id:int}", async (int id, AppDb db) =&gt;
    await db.Users.FindAsync(id) is User u ? Results.Ok(u) : Results.NotFound());
app.MapHealthChecks("/healthz");
app.Run();                                  // Kestrel, listens on :8080 in the official images</pre>
<pre>// Go 1.22+ — stdlib router with methods and path params (no framework needed)
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    json.NewEncoder(w).Encode(map[string]string{"id": id})
})
// Gin:  r.GET("/users/:id", func(c *gin.Context) { c.JSON(200, gin.H{"id": c.Param("id")}) })
// Chi:  r.Get("/users/{id}", h)   -- 100% net/http-compatible handlers and middleware
// Echo: e.GET("/users/:id", func(c echo.Context) error { return c.JSON(200, ...) })</pre>
<pre>// Rust — Axum 0.8 on tokio
async fn get_user(Path(id): Path&lt;u64&gt;) -&gt; Json&lt;serde_json::Value&gt; {
    Json(serde_json::json!({ "id": id }))
}
let app = Router::new().route("/users/{id}", get(get_user));
let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await?;</pre>
<table>
<tr><th>Stack</th><th>מקביליות לבקשה</th><th>מה מגביל אותך ראשון</th></tr>
<tr><td>Spring MVC (קלאסי)</td><td>thread לכל בקשה, ‏<code>threads.max</code> של Tomcat = ‏200</td><td>‏200 threads חסומים → בקשות נכנסות לתור (accept-count 100), ואז נדחות</td></tr>
<tr><td>Spring עם virtual threads ‏(Java 21+)</td><td>virtual thread זול אחד לכל בקשה</td><td>ה-pool של ה-DB ‏(HikariCP, ברירת מחדל 10) והמגבלות של ה-downstream</td></tr>
<tr><td>Spring WebFlux</td><td>event loop ‏(Netty), טיפוסים ריאקטיביים</td><td>כל קריאה חוסמת על ה-loop; עקומת למידה תלולה</td></tr>
<tr><td>ASP.NET Core</td><td>thread pool עם async/await על Kestrel</td><td>‏sync-over-async ‏(<code>.Result</code>) → הרעבה של ה-thread pool</td></tr>
<tr><td>Go</td><td>goroutine אחד לכל חיבור (stack של 2-8 KB)</td><td>timeouts חסרים, goroutines בלי גבול, ה-pool של ה-DB</td></tr>
<tr><td>Rust ‏(Axum/tokio)</td><td>async tasks על runtime עם work-stealing</td><td>קריאות חוסמות בתוך async (משתמשים ב-<code>spawn_blocking</code>)</td></tr>
</table>`
      }
    },
    {
      h: { en: "Spring Boot: Actuator, JVM container settings, startup", he: "Spring Boot: ‏Actuator, הגדרות JVM ל-containers, ו-startup" },
      body: {
        en: `<pre># application.yml — production essentials
management:
  server.port: 8081                                   # actuator off the public port
  endpoints.web.exposure.include: health,info,prometheus   # only "health" is exposed by default
  endpoint.health.probes.enabled: true                # auto-enabled when running on Kubernetes
  endpoint.health.group.readiness.include: readinessState,db
spring:
  lifecycle.timeout-per-shutdown-phase: 25s           # default 30s; keep below terminationGracePeriodSeconds
  datasource.hikari:
    maximum-pool-size: 10                             # default 10
    connection-timeout: 2000                          # default 30000 ms: fail fast instead
    max-lifetime: 1740000                             # default 30 min; keep below DB/proxy idle kill</pre>
<p>Kubernetes then probes <code>/actuator/health/liveness</code> (only the app's internal state) and <code>/actuator/health/readiness</code> (state + DB). Micrometer exposes <code>http_server_requests_seconds</code>, <code>jvm_memory_used_bytes</code>, <code>hikaricp_connections_pending</code> at <code>/actuator/prometheus</code> — the last one is your first look when latency spikes.</p>
<p><strong>JVM in a container</strong> (container-aware since JDK 10 / 8u191):</p>
<ul>
<li><code>-XX:MaxRAMPercentage</code> defaults to <strong>25%</strong> — a 2 GiB Pod gets a 512 MB heap. Use <code>-XX:MaxRAMPercentage=75</code>; the rest is metaspace, thread stacks, direct buffers, code cache.</li>
<li>CPU: <code>availableProcessors()</code> follows the CPU <em>limit</em> (JDK 19+ ignores CPU shares/requests). With &lt; 2 CPUs or &lt; 1792 MB the JVM silently picks <strong>SerialGC</strong> — give it 2 CPUs or set <code>-XX:+UseG1GC</code> explicitly; override with <code>-XX:ActiveProcessorCount=N</code>.</li>
<li>Startup: a typical Spring Boot app boots in 3-8 s with a JIT that needs minutes of traffic to warm up. Options: AppCDS / the JDK 24+ AOT cache (Project Leyden, ~30-50% faster start), Spring AOT + <strong>GraalVM native image</strong> (~50-100 ms start, ~50-100 MB RSS, slower builds, reflection config), or CRaC snapshots. Give slow starters a <code>startupProbe</code>, not a long liveness delay.</li>
</ul>
<pre>ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
# ExitOnOutOfMemoryError: crash and get restarted instead of limping on in a broken state</pre>
<blockquote>⚠️ Production tip: virtual threads remove the 200-thread ceiling — so the <em>next</em> ceiling (10 Hikari connections) hits harder: 5,000 virtual threads wait up to <code>connection-timeout</code> for a connection. Keep the pool small (HikariCP's guide: connections ≈ (cores × 2) + effective spindles), add a bulkhead/semaphore around the DB, and fail fast. Before JDK 24, <code>synchronized</code> blocks also pinned virtual threads to carriers (fixed by JEP 491).</blockquote>`,
        he: `<pre># application.yml — production essentials
management:
  server.port: 8081                                   # actuator off the public port
  endpoints.web.exposure.include: health,info,prometheus   # only "health" is exposed by default
  endpoint.health.probes.enabled: true                # auto-enabled when running on Kubernetes
  endpoint.health.group.readiness.include: readinessState,db
spring:
  lifecycle.timeout-per-shutdown-phase: 25s           # default 30s; keep below terminationGracePeriodSeconds
  datasource.hikari:
    maximum-pool-size: 10                             # default 10
    connection-timeout: 2000                          # default 30000 ms: fail fast instead
    max-lifetime: 1740000                             # default 30 min; keep below DB/proxy idle kill</pre>
<p>‏Kubernetes עושה probe ל-<code>/actuator/health/liveness</code> (רק המצב הפנימי של האפליקציה) ול-<code>/actuator/health/readiness</code> (מצב + DB). ‏Micrometer חושף ב-<code>/actuator/prometheus</code> את <code>http_server_requests_seconds</code>, ‏<code>jvm_memory_used_bytes</code> ו-<code>hikaricp_connections_pending</code> — האחרון הוא המקום הראשון להסתכל בו כש-latency קופץ.</p>
<p><strong>JVM בתוך container</strong> (מודע ל-containers מאז JDK 10 / 8u191):</p>
<ul>
<li>‏<code>-XX:MaxRAMPercentage</code> הוא <strong>25%</strong> כברירת מחדל — Pod של 2 GiB מקבל heap של 512 MB. תגדיר <code>-XX:MaxRAMPercentage=75</code>; השאר הולך ל-metaspace, ל-stacks של threads, ל-direct buffers ול-code cache.</li>
<li>CPU: ‏<code>availableProcessors()</code> הולך לפי ה-CPU <em>limit</em> ‏(JDK 19+ מתעלם מ-CPU shares/requests). עם פחות מ-2 CPU או פחות מ-1792 MB ה-JVM בוחר בשקט <strong>SerialGC</strong> — תן לו 2 CPU או תגדיר <code>-XX:+UseG1GC</code> במפורש; אפשר לדרוס עם <code>-XX:ActiveProcessorCount=N</code>.</li>
<li>Startup: אפליקציית Spring Boot טיפוסית עולה תוך 3-8 s, עם JIT שצריך דקות של תעבורה כדי להתחמם. האפשרויות: AppCDS או ה-AOT cache של JDK 24+ ‏(Project Leyden, ‏startup מהיר בבערך 30-50%), ‏Spring AOT עם <strong>GraalVM native image</strong> (עלייה תוך 50-100 ms, בערך 50-100 MB RSS, ‏builds איטיים יותר, הגדרות reflection), או snapshots של CRaC. לאפליקציות שעולות לאט תן <code>startupProbe</code>, לא delay ארוך ל-liveness.</li>
</ul>
<pre>ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
# ExitOnOutOfMemoryError: crash and get restarted instead of limping on in a broken state</pre>
<blockquote>⚠️ Production tip: ‏virtual threads מורידים את התקרה של 200 threads — ולכן התקרה <em>הבאה</em> (10 חיבורים של Hikari) מכה חזק יותר: ‏5,000 virtual threads מחכים עד <code>connection-timeout</code> לחיבור. תשאיר את ה-pool קטן (המדריך של HikariCP: חיבורים ≈ ‏(ליבות × 2) + דיסקים אפקטיביים), תוסיף bulkhead או semaphore סביב ה-DB, ותיכשל מהר. לפני JDK 24, בלוקים של <code>synchronized</code> גם עשו pinning ל-virtual threads על ה-carriers (תוקן ב-JEP 491).</blockquote>`
      }
    },
    {
      h: { en: "ASP.NET Core: health checks, Kestrel limits, GC in containers", he: "ASP.NET Core: ‏health checks, ה-limits של Kestrel, ו-GC ב-containers" },
      body: {
        en: `<pre>// Program.cs — liveness vs readiness with tags
builder.Services.AddHealthChecks()
    .AddCheck("self", () =&gt; HealthCheckResult.Healthy())
    .AddNpgSql(connString, tags: new[] { "ready" });   // AspNetCore.HealthChecks.NpgSql package

app.MapHealthChecks("/healthz/live",  new HealthCheckOptions { Predicate = c =&gt; c.Name == "self" });
app.MapHealthChecks("/healthz/ready", new HealthCheckOptions { Predicate = c =&gt; c.Tags.Contains("ready") });

builder.WebHost.ConfigureKestrel(o =&gt; {
    o.Limits.KeepAliveTimeout      = TimeSpan.FromSeconds(130);   // default 130 s (&gt; ALB 60 s: good)
    o.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);    // default 30 s
    o.Limits.MaxRequestBodySize    = 10 * 1024 * 1024;            // default 30,000,000 bytes (~28.6 MB)
    o.Limits.MaxConcurrentConnections = 10_000;                   // default: unlimited
});
builder.Services.Configure&lt;HostOptions&gt;(o =&gt; o.ShutdownTimeout = TimeSpan.FromSeconds(25)); // default 30 s (.NET 8+)</pre>
<ul>
<li><strong>Containers</strong>: official .NET 8+ images listen on <strong>8080</strong> (<code>ASPNETCORE_HTTP_PORTS</code>) and ship a non-root <code>app</code> user. The GC respects the cgroup limit and caps the heap at 75% of it by default (<code>DOTNET_GCHeapHardLimitPercent</code>); Server GC creates heaps per CPU — fine for 2+ CPUs, and .NET 9+ enables DATAS to shrink memory for small Pods.</li>
<li><strong>Thread-pool starvation</strong>: <code>.Result</code> / <code>.Wait()</code> on async calls blocks pool threads; the pool grows only ~1-2 threads/s, so a burst causes multi-second latency with low CPU. Diagnose with <code>dotnet-counters monitor System.Runtime</code> (watch <em>ThreadPool Queue Length</em>).</li>
<li><strong>Startup</strong>: ~0.3-1 s JIT; Native AOT (.NET 8+) for minimal APIs gets ~50 ms startup and smaller images, with trimming limits (no runtime reflection-heavy libs).</li>
</ul>`,
        he: `<pre>// Program.cs — liveness vs readiness with tags
builder.Services.AddHealthChecks()
    .AddCheck("self", () =&gt; HealthCheckResult.Healthy())
    .AddNpgSql(connString, tags: new[] { "ready" });   // AspNetCore.HealthChecks.NpgSql package

app.MapHealthChecks("/healthz/live",  new HealthCheckOptions { Predicate = c =&gt; c.Name == "self" });
app.MapHealthChecks("/healthz/ready", new HealthCheckOptions { Predicate = c =&gt; c.Tags.Contains("ready") });

builder.WebHost.ConfigureKestrel(o =&gt; {
    o.Limits.KeepAliveTimeout      = TimeSpan.FromSeconds(130);   // default 130 s (&gt; ALB 60 s: good)
    o.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);    // default 30 s
    o.Limits.MaxRequestBodySize    = 10 * 1024 * 1024;            // default 30,000,000 bytes (~28.6 MB)
    o.Limits.MaxConcurrentConnections = 10_000;                   // default: unlimited
});
builder.Services.Configure&lt;HostOptions&gt;(o =&gt; o.ShutdownTimeout = TimeSpan.FromSeconds(25)); // default 30 s (.NET 8+)</pre>
<ul>
<li><strong>Containers</strong>: ה-images הרשמיים של .NET 8+ מאזינים על <strong>8080</strong> ‏(<code>ASPNETCORE_HTTP_PORTS</code>) ומגיעים עם משתמש <code>app</code> שאינו root. ה-GC מכבד את ה-limit של ה-cgroup ומגביל את ה-heap ל-75% ממנו כברירת מחדל (<code>DOTNET_GCHeapHardLimitPercent</code>); ‏Server GC יוצר heap לכל CPU — בסדר ל-2 CPU ומעלה, ו-.NET 9+ מפעיל DATAS כדי לצמצם זיכרון ב-Pod-ים קטנים.</li>
<li><strong>הרעבה של ה-thread pool</strong>: ‏<code>.Result</code> או <code>.Wait()</code> על קריאות async חוסמים threads של ה-pool; ה-pool גדל רק בבערך 1-2 threads לשנייה, אז burst גורם ל-latency של כמה שניות עם CPU נמוך. מאבחנים עם <code>dotnet-counters monitor System.Runtime</code> (מסתכלים על <em>ThreadPool Queue Length</em>).</li>
<li><strong>Startup</strong>: בערך 0.3-1 s עם JIT; ‏Native AOT ‏(.NET 8+) ל-minimal APIs מגיע לבערך 50 ms ול-images קטנים יותר, עם מגבלות של trimming (בלי ספריות שנשענות על reflection בזמן ריצה).</li>
</ul>`
      }
    },
    {
      h: { en: "Go: the zero-timeout trap and graceful Shutdown (plus Rust)", he: "Go: מלכודת ה-timeout של אפס ו-Shutdown מסודר (ו-Rust)" },
      body: {
        en: `<p>Go's zero values mean <strong>"no timeout"</strong>. <code>http.ListenAndServe(":8080", mux)</code> builds a server with no read, write or idle timeout — one Slowloris client that sends a header byte every 10 s holds a goroutine and an FD forever (gosec flags it as G112). Same for the client: <code>http.DefaultClient</code> has <code>Timeout: 0</code>, so a hung dependency hangs your handler forever.</p>
<pre>srv := &amp;http.Server{
    Addr:              ":8080",
    Handler:           http.TimeoutHandler(mux, 10*time.Second, "timeout"), // per-request budget -&gt; 503
    ReadHeaderTimeout: 5 * time.Second,    // Slowloris guard
    ReadTimeout:       15 * time.Second,   // whole request incl. body
    WriteTimeout:      20 * time.Second,   // from end of headers to end of response
    IdleTimeout:       75 * time.Second,   // keep-alive; &gt; ALB 60 s (0 = falls back to ReadTimeout)
    MaxHeaderBytes:    1 &lt;&lt; 20,            // default 1 MB
}
go func() {
    if err := srv.ListenAndServe(); err != nil &amp;&amp; err != http.ErrServerClosed { log.Fatal(err) }
}()

ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
defer stop()
&lt;-ctx.Done()                                      // SIGTERM from kubelet
ready.Store(false)                                // /readyz -&gt; 503
time.Sleep(5 * time.Second)                       // let endpoints update
shutCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
defer cancel()
srv.Shutdown(shutCtx)                             // stop listening, close idle conns, wait for active
db.Close()

client := &amp;http.Client{Timeout: 3 * time.Second}  // never use http.DefaultClient for outbound calls</pre>
<ul>
<li><strong>Runtime in containers</strong>: Go 1.25+ sets <code>GOMAXPROCS</code> from the cgroup CPU limit automatically; on older versions import <code>go.uber.org/automaxprocs</code> or a 2-CPU Pod on a 64-core node runs 64 Ps and gets throttled. Set <code>GOMEMLIMIT</code> (~90% of the memory limit) so the GC works harder before the OOM killer.</li>
<li><strong>Frameworks</strong>: since Go 1.22 the stdlib mux does methods and <code>{id}</code> params, so many teams use plain <code>net/http</code> + Chi for middleware. Gin (largest community) and Echo add binding/validation; none of them sets server timeouts for you.</li>
<li><strong>Rust/Axum</strong>: add <code>tower_http::timeout::TimeoutLayer</code> and a body limit layer (Axum's default body limit is 2 MB), call <code>.with_graceful_shutdown(...)</code>, and wrap blocking work in <code>tokio::task::spawn_blocking</code>. Idle memory 5-10 MB, no GC pauses — at the cost of hiring and compile times.</li>
</ul>`,
        he: `<p>ב-Go, ערכי אפס אומרים <strong>"בלי timeout"</strong>. ‏<code>http.ListenAndServe(":8080", mux)</code> בונה שרת בלי read, ‏write או idle timeout — לקוח Slowloris אחד ששולח byte של header כל 10 s מחזיק goroutine ו-FD לנצח (gosec מסמן את זה כ-G112). אותו דבר בצד הלקוח: ל-<code>http.DefaultClient</code> יש <code>Timeout: 0</code>, אז dependency תקוע תוקע את ה-handler שלך לנצח.</p>
<pre>srv := &amp;http.Server{
    Addr:              ":8080",
    Handler:           http.TimeoutHandler(mux, 10*time.Second, "timeout"), // per-request budget -&gt; 503
    ReadHeaderTimeout: 5 * time.Second,    // Slowloris guard
    ReadTimeout:       15 * time.Second,   // whole request incl. body
    WriteTimeout:      20 * time.Second,   // from end of headers to end of response
    IdleTimeout:       75 * time.Second,   // keep-alive; &gt; ALB 60 s (0 = falls back to ReadTimeout)
    MaxHeaderBytes:    1 &lt;&lt; 20,            // default 1 MB
}
go func() {
    if err := srv.ListenAndServe(); err != nil &amp;&amp; err != http.ErrServerClosed { log.Fatal(err) }
}()

ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
defer stop()
&lt;-ctx.Done()                                      // SIGTERM from kubelet
ready.Store(false)                                // /readyz -&gt; 503
time.Sleep(5 * time.Second)                       // let endpoints update
shutCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
defer cancel()
srv.Shutdown(shutCtx)                             // stop listening, close idle conns, wait for active
db.Close()

client := &amp;http.Client{Timeout: 3 * time.Second}  // never use http.DefaultClient for outbound calls</pre>
<ul>
<li><strong>ה-runtime ב-containers</strong>: ‏Go 1.25+ קובע את <code>GOMAXPROCS</code> אוטומטית לפי ה-CPU limit של ה-cgroup; בגרסאות ישנות יותר תעשה import ל-<code>go.uber.org/automaxprocs</code>, אחרת Pod של 2 CPU על node של 64 ליבות מריץ 64 Ps ומקבל throttling. תגדיר <code>GOMEMLIMIT</code> (בערך 90% מה-memory limit) כדי שה-GC יעבוד קשה יותר לפני שה-OOM killer מגיע.</li>
<li><strong>Frameworks</strong>: מאז Go 1.22 ה-mux של ה-stdlib תומך ב-methods ובפרמטרים של <code>{id}</code>, אז הרבה צוותים משתמשים ב-<code>net/http</code> נקי עם Chi בשביל middleware. ‏Gin (הקהילה הכי גדולה) ו-Echo מוסיפים binding ו-validation; אף אחד מהם לא מגדיר בשבילך timeouts לשרת.</li>
<li><strong>Rust/Axum</strong>: מוסיפים <code>tower_http::timeout::TimeoutLayer</code> ו-layer של body limit (ה-body limit הדיפולטי של Axum הוא 2 MB), קוראים ל-<code>.with_graceful_shutdown(...)</code>, ועוטפים עבודה חוסמת ב-<code>tokio::task::spawn_blocking</code>. זיכרון idle של 5-10 MB, בלי GC pauses — במחיר של גיוס וזמני קומפילציה.</li>
</ul>`
      }
    },
    {
      h: { en: "Choosing: startup, memory, throughput, hiring", he: "איך בוחרים: startup, זיכרון, throughput וגיוס" },
      body: {
        en: `<table>
<tr><th></th><th>Spring Boot (JIT)</th><th>Spring native</th><th>ASP.NET Core</th><th>Go</th><th>Rust (Axum)</th></tr>
<tr><td>Startup</td><td>3-8 s + warm-up</td><td>50-100 ms</td><td>0.3-1 s (AOT ~50 ms)</td><td>~10-50 ms</td><td>~5-20 ms</td></tr>
<tr><td>Idle RSS</td><td>250-500 MB</td><td>50-100 MB</td><td>60-150 MB</td><td>10-30 MB</td><td>5-15 MB</td></tr>
<tr><td>Throughput profile</td><td>Excellent once warm</td><td>Good, lower peak than JIT</td><td>Excellent (top of TechEmpower)</td><td>Very good, flat latency</td><td>Best, no GC pauses</td></tr>
<tr><td>Key container setting</td><td>MaxRAMPercentage=75</td><td>-Xmx explicit</td><td>Defaults OK (75% heap)</td><td>Timeouts, GOMEMLIMIT</td><td>Timeout + body layers</td></tr>
<tr><td>Ecosystem / hiring</td><td>Huge, enterprise</td><td>Same, fewer compatible libs</td><td>Large, Microsoft shops</td><td>Large in infra/cloud</td><td>Smaller, senior-heavy</td></tr>
<tr><td>Fits</td><td>Big domains, long-lived services</td><td>Serverless, scale-to-zero</td><td>Enterprise, Azure, Windows heritage</td><td>Infra, proxies, high fan-out APIs</td><td>Hot paths, proxies, edge</td></tr>
</table>
<blockquote>💡 Real world: autoscaling cares about startup. A Spring Boot Pod that needs 40 s to become ready (boot + warm caches) means HPA reacts to a spike almost a minute late — teams either over-provision, add a CDS/AOT cache, or move bursty endpoints to Go. For steady, heavy traffic, warmed-up JVMs are as fast as anything.</blockquote>`,
        he: `<table>
<tr><th></th><th>Spring Boot ‏(JIT)</th><th>Spring native</th><th>ASP.NET Core</th><th>Go</th><th>Rust ‏(Axum)</th></tr>
<tr><td>Startup</td><td>3-8 s + warm-up</td><td>50-100 ms</td><td>0.3-1 s ‏(AOT בערך 50 ms)</td><td>בערך 10-50 ms</td><td>בערך 5-20 ms</td></tr>
<tr><td>Idle RSS</td><td>250-500 MB</td><td>50-100 MB</td><td>60-150 MB</td><td>10-30 MB</td><td>5-15 MB</td></tr>
<tr><td>פרופיל throughput</td><td>מצוין אחרי חימום</td><td>טוב, peak נמוך יותר מ-JIT</td><td>מצוין (בראש TechEmpower)</td><td>טוב מאוד, latency יציב</td><td>הכי טוב, בלי GC pauses</td></tr>
<tr><td>הגדרת container מרכזית</td><td>MaxRAMPercentage=75</td><td>-Xmx מפורש</td><td>ברירות המחדל בסדר (heap של 75%)</td><td>Timeouts, ‏GOMEMLIMIT</td><td>layers של timeout ו-body</td></tr>
<tr><td>Ecosystem / גיוס</td><td>ענק, enterprise</td><td>אותו דבר, פחות ספריות תואמות</td><td>גדול, ארגוני Microsoft</td><td>גדול בעולם ה-infra/cloud</td><td>קטן יותר, בעיקר seniors</td></tr>
<tr><td>מתאים ל-</td><td>domains גדולים, שירותים ארוכי חיים</td><td>Serverless, ‏scale-to-zero</td><td>Enterprise, ‏Azure, מורשת Windows</td><td>Infra, ‏proxies, ‏APIs עם fan-out גבוה</td><td>Hot paths, ‏proxies, ‏edge</td></tr>
</table>
<blockquote>💡 Real world: ל-autoscaling אכפת מ-startup. ‏Pod של Spring Boot שצריך 40 s כדי להיות ready ‏(boot + חימום caches) אומר שה-HPA מגיב ל-spike באיחור של כמעט דקה — צוותים או עושים over-provisioning, או מוסיפים CDS/AOT cache, או מעבירים endpoints עם bursts ל-Go. בתעבורה יציבה וכבדה, JVM מחומם מהיר כמו כל דבר אחר.</blockquote>`
      }
    }
  ],
  diagram: "requests --> [Tomcat 200 threads | virtual threads | Kestrel pool | goroutines | tokio tasks]\n                                   \\        all of them        /\n                                    v                        v\n                          HikariCP / DB pool  (default 10 connections)\n                                    v\n                          Postgres max_connections (default 100)\n   => total concurrency to the DB = Pods x pool size, NOT thread count",
  handsOn: [
    { cmd: "docker run --rm -m 2g eclipse-temurin:21 java -XX:+PrintFlagsFinal -version | grep -E 'MaxHeapSize|MaxRAMPercentage|UseSerialGC|UseG1GC'", what: { en: "See the JVM pick a 512 MB heap (25%) in a 2 GiB container, and which GC it chose.", he: "לראות את ה-JVM בוחר heap של 512 MB ‏(25%) ב-container של 2 GiB, ואיזה GC הוא בחר." } },
    { cmd: "curl -s localhost:8081/actuator/health/readiness && curl -s localhost:8081/actuator/prometheus | grep hikaricp_connections", what: { en: "Check Spring readiness and live HikariCP pool metrics (active, idle, pending).", he: "לבדוק את ה-readiness של Spring ואת ה-metrics החיים של ה-pool של HikariCP ‏(active, ‏idle, ‏pending)." } },
    { cmd: "dotnet-counters monitor --process-id 1 System.Runtime", what: { en: "Watch .NET thread-pool queue length, GC heap size and exception rate live inside the container.", he: "לראות בזמן אמת את אורך התור של ה-thread pool, גודל ה-heap של ה-GC וקצב ה-exceptions בתוך ה-container." } },
    { cmd: "gosec -include=G112,G107 ./...", what: { en: "Find Go servers without ReadHeaderTimeout (Slowloris) and risky outbound HTTP calls.", he: "למצוא שרתי Go בלי ReadHeaderTimeout ‏(Slowloris) וקריאות HTTP יוצאות מסוכנות." } }
  ],
  mnemonic: {
    en: "\"JVM: 75 not 25. Go: zero means forever. .NET: never .Result. Everyone: the pool is the real limit.\"",
    he: "\"‏JVM: ‏75 ולא 25. ‏Go: אפס זה לנצח. ‏.NET: אף פעם לא .Result. כולם: ה-pool הוא הגבול האמיתי.\""
  },
  pitfalls: [
    { en: "Running the JVM with default MaxRAMPercentage (25%) — a 4 GiB Pod uses a 1 GiB heap, GC thrashes while 3 GiB sit idle.", he: "להריץ JVM עם MaxRAMPercentage דיפולטי (25%) — ‏Pod של 4 GiB משתמש ב-heap של 1 GiB, וה-GC עובד בלי הפסקה בזמן ש-3 GiB לא בשימוש." },
    { en: "Go http.ListenAndServe / http.DefaultClient in production — zero timeouts mean Slowloris exposure and handlers stuck forever on a hung dependency.", he: "‏http.ListenAndServe או http.DefaultClient של Go ב-production — ‏timeouts של אפס אומרים חשיפה ל-Slowloris ו-handlers שתקועים לנצח על dependency שנתקע." },
    { en: "Turning on virtual threads and expecting 10× throughput — the DB pool (10) is now the bottleneck and requests wait 30 s for a connection.", he: "להדליק virtual threads ולצפות לפי 10 ב-throughput — ה-pool של ה-DB ‏(10) הופך לצוואר הבקבוק, ובקשות מחכות 30 s לחיבור." },
    { en: "Sync-over-async in .NET (.Result, .Wait()) — thread-pool starvation: seconds of latency at low CPU under bursts.", he: "‏sync-over-async ב-.NET ‏(.Result, ‏.Wait()) — הרעבה של ה-thread pool: שניות של latency עם CPU נמוך בזמן bursts." }
  ],
  interview: [
    { q: { en: "You enabled virtual threads in Spring Boot and p99 got worse. Why?", he: "הפעלת virtual threads ב-Spring Boot וה-p99 נהיה גרוע יותר. למה?" },
      a: { en: "The 200-thread Tomcat limit used to act as natural back-pressure. With virtual threads thousands of requests run concurrently and all contend for the 10-connection HikariCP pool, so they queue on getConnection (hikaricp_connections_pending spikes) and some hit connection-timeout. Fix: keep the pool sized to what the DB can handle, add a semaphore/bulkhead or rate limit, set a short connection-timeout to fail fast, and check for pinning (synchronized on JDK < 24).", he: "המגבלה של 200 threads ב-Tomcat שימשה בעבר כ-back-pressure טבעי. עם virtual threads אלפי בקשות רצות במקביל וכולן מתחרות על pool של 10 חיבורים ב-HikariCP, אז הן נעמדות בתור על getConnection ‏(hikaricp_connections_pending קופץ) וחלקן מגיעות ל-connection-timeout. התיקון: לשמור את ה-pool בגודל שה-DB מסוגל לו, להוסיף semaphore/bulkhead או rate limit, ‏connection-timeout קצר כדי להיכשל מהר, ולבדוק pinning ‏(synchronized ב-JDK מתחת ל-24)." } },
    { q: { en: "What timeouts would you set on a Go http.Server behind an ALB, and why?", he: "אילו timeouts תגדיר ל-http.Server של Go מאחורי ALB, ולמה?" },
      a: { en: "ReadHeaderTimeout ~5 s (Slowloris), ReadTimeout and WriteTimeout sized to the largest legitimate request/response (e.g. 15/20 s), a per-request budget via http.TimeoutHandler or context deadlines below the ALB's 60 s, and IdleTimeout above the ALB's 60 s idle timeout (e.g. 75 s) so the ALB closes idle connections first. Plus outbound http.Client timeouts and graceful Shutdown on SIGTERM.", he: "‏ReadHeaderTimeout של בערך 5 s ‏(Slowloris), ‏ReadTimeout ו-WriteTimeout לפי הבקשה/התשובה הלגיטימית הגדולה ביותר (למשל 15/20 s), תקציב לכל בקשה עם http.TimeoutHandler או context deadlines מתחת ל-60 s של ה-ALB, ו-IdleTimeout מעל ה-idle timeout של ה-ALB ‏(60 s), למשל 75 s, כדי שה-ALB יסגור חיבורים idle ראשון. ובנוסף timeouts ל-http.Client היוצא ו-Shutdown מסודר על SIGTERM." } }
  ],
  quiz: [
    { q: { en: "A JVM in a 2 GiB container with no heap flags gets roughly what max heap?", he: "‏JVM ב-container של 2 GiB בלי דגלי heap מקבל בערך איזה heap מקסימלי?" },
      options: [
        { en: "2 GiB", he: "2 GiB" },
        { en: "1.5 GiB", he: "1.5 GiB" },
        { en: "512 MB (25%)", he: "512 MB ‏(25%)" },
        { en: "The host's total RAM / 4", he: "רבע מה-RAM של המכונה" }
      ], answer: 2,
      explain: { en: "Container-aware JVMs read the cgroup limit, but MaxRAMPercentage defaults to 25%. Set -XX:MaxRAMPercentage=75 for services.", he: "‏JVMs שמודעים ל-containers קוראים את ה-limit של ה-cgroup, אבל MaxRAMPercentage הוא 25% כברירת מחדל. לשירותים מגדירים <code>-XX:MaxRAMPercentage=75</code>." } },
    { q: { en: "What timeouts does http.ListenAndServe(\":8080\", mux) configure in Go?", he: "אילו timeouts ‏http.ListenAndServe(\":8080\", mux) מגדיר ב-Go?" },
      options: [
        { en: "30 s read, 30 s write", he: "30 s ל-read, ‏30 s ל-write" },
        { en: "None — all zero, meaning no timeout", he: "אף אחד — כולם אפס, כלומר בלי timeout" },
        { en: "Only a 5 s ReadHeaderTimeout", he: "רק ReadHeaderTimeout של 5 s" },
        { en: "Whatever GOMAXPROCS is", he: "מה שה-GOMAXPROCS קובע" }
      ], answer: 1,
      explain: { en: "Zero values mean unlimited. Build an explicit http.Server with ReadHeaderTimeout, ReadTimeout, WriteTimeout and IdleTimeout.", he: "ערכי אפס אומרים בלי הגבלה. בונים http.Server מפורש עם ReadHeaderTimeout, ‏ReadTimeout, ‏WriteTimeout ו-IdleTimeout." } },
    { q: { en: "Spring Boot uses HikariCP's defaults. How many DB connections can one Pod use, regardless of thread count?", he: "‏Spring Boot משתמש בברירות המחדל של HikariCP. כמה חיבורי DB ‏Pod אחד יכול להשתמש בהם, בלי קשר למספר ה-threads?" },
      options: [
        { en: "200, matching Tomcat threads", he: "‏200, כמו ה-threads של Tomcat" },
        { en: "10", he: "10" },
        { en: "100, matching Postgres max_connections", he: "‏100, כמו max_connections של Postgres" },
        { en: "Unlimited", he: "ללא הגבלה" }
      ], answer: 1,
      explain: { en: "maximumPoolSize defaults to 10. 20 Pods × 10 = 200 connections — already twice Postgres' default max_connections (100), so plan pool size × replicas (or use PgBouncer / RDS Proxy).", he: "‏maximumPoolSize הוא 10 כברירת מחדל. ‏20 Pod-ים × 10 = ‏200 חיבורים — כבר פי שניים מה-max_connections הדיפולטי של Postgres ‏(100), אז מתכננים גודל pool × replicas (או משתמשים ב-PgBouncer או ב-RDS Proxy)." } },
    { q: { en: "Which Kestrel default protects you from the keep-alive 502 race behind an ALB (60 s idle)?", he: "איזו ברירת מחדל של Kestrel מגינה עליך ממרוץ ה-keep-alive שמייצר 502 מאחורי ALB ‏(idle של 60 s)?" },
      options: [
        { en: "MaxRequestBodySize = 30 MB", he: "‏MaxRequestBodySize = ‏30 MB" },
        { en: "KeepAliveTimeout = 130 s, longer than the ALB idle timeout", he: "‏KeepAliveTimeout = ‏130 s, ארוך מה-idle timeout של ה-ALB" },
        { en: "RequestHeadersTimeout = 30 s", he: "‏RequestHeadersTimeout = ‏30 s" },
        { en: "MaxConcurrentConnections = unlimited", he: "‏MaxConcurrentConnections = ללא הגבלה" }
      ], answer: 1,
      explain: { en: "The server must keep idle connections longer than the LB so the LB always closes first. Kestrel's 130 s does; Node's 5 s and uvicorn's 5 s don't.", he: "השרת צריך להחזיק חיבורים idle יותר זמן מה-LB, כדי שה-LB תמיד יסגור ראשון. ה-130 s של Kestrel עושים את זה; ה-5 s של Node ושל uvicorn לא." } }
  ],
  related: ["pr-platforms", "pr-concurrency-parallelism", "pr-garbage-collection", "k8s-resources", "k8s-probes", "db-operations", "node-web-frameworks"]
});

INFRA.glossary.push(
  { term: "Spring Boot Actuator", track: "architecture", def: { en: "Spring Boot's production endpoints: /actuator/health with liveness and readiness groups for Kubernetes probes, /actuator/prometheus metrics via Micrometer, info and more; only health is exposed over HTTP by default.", he: "ה-endpoints של Spring Boot ל-production: ‏/actuator/health עם קבוצות liveness ו-readiness ל-probes של Kubernetes, ‏metrics ב-/actuator/prometheus דרך Micrometer, ‏info ועוד; כברירת מחדל רק health חשוף ב-HTTP." }, lesson: "jvm-dotnet-go-web" },
  { term: "HikariCP", track: "architecture", def: { en: "The default JDBC connection pool in Spring Boot: maximumPoolSize 10 and connectionTimeout 30 s by default; the pool, not the thread count, caps how many queries a Pod runs at once.", he: "ה-connection pool הדיפולטי של JDBC ב-Spring Boot: ‏maximumPoolSize של 10 ו-connectionTimeout של 30 s כברירת מחדל; ה-pool, ולא מספר ה-threads, קובע כמה שאילתות Pod מריץ במקביל." }, lesson: "jvm-dotnet-go-web" },
  { term: "Kestrel", track: "architecture", def: { en: "ASP.NET Core's built-in cross-platform web server; defaults include KeepAliveTimeout 130 s, RequestHeadersTimeout 30 s and MaxRequestBodySize ~30 MB, tuned via KestrelServerOptions.Limits.", he: "שרת ה-web המובנה וחוצה-הפלטפורמות של ASP.NET Core; ברירות המחדל כוללות KeepAliveTimeout של 130 s, ‏RequestHeadersTimeout של 30 s ו-MaxRequestBodySize של בערך 30 MB, ומכווננים אותן דרך KestrelServerOptions.Limits." }, lesson: "jvm-dotnet-go-web" }
);

INFRA.lessons.push({
  id: "web-service-production-checklist",
  track: "architecture",
  order: 73,
  icon: "✅",
  level: 2,
  minutes: 18,
  title: { en: "Any Framework, Production-Ready: The Web Service Checklist", he: "כל framework, מוכן ל-production: ה-checklist לשירות web" },
  tldr: {
    en: "Production-readiness is framework-agnostic: health and readiness, graceful draining, nested timeouts, bounded pools, structured logs with request IDs, OpenTelemetry, env config, limits and safe errors, migrations as a deploy step, a lean image — and a load test before launch.",
    he: "מוכנות ל-production לא תלויה ב-framework: ‏health ו-readiness, ‏draining מסודר, ‏timeouts מקוננים, ‏pools מוגבלים, לוגים מובנים עם request IDs, ‏OpenTelemetry, קונפיגורציה מ-env, מגבלות ושגיאות בטוחות, ‏migrations כשלב ב-deploy, ‏image רזה — ו-load test לפני ההשקה."
  },
  analogy: {
    en: "A pre-flight checklist: a Boeing and a Cessna fly differently, but every pilot checks fuel, flaps, instruments and doors before takeoff — not because they're bad pilots, but because the one item they skip is the one that crashes the plane. Frameworks are the aircraft models; this list is the pre-flight.",
    he: "‏checklist לפני טיסה: בואינג וססנה טסים אחרת, אבל כל טייס בודק דלק, מדפים, מכשירים ודלתות לפני ההמראה — לא כי הוא טייס גרוע, אלא כי הסעיף האחד שהוא מדלג עליו הוא זה שמפיל את המטוס. ה-frameworks הם דגמי המטוסים; הרשימה הזו היא הבדיקה לפני הטיסה."
  },
  sections: [
    {
      h: { en: "1. Health, readiness and graceful shutdown", he: "1. ‏Health, ‏readiness ו-graceful shutdown" },
      body: {
        en: `<ul>
<li><strong>Liveness</strong> (<code>/healthz</code>): "is this process able to answer?" — no dependencies. <strong>Readiness</strong> (<code>/readyz</code>): "should I get traffic?" — may check the DB with a 1 s timeout, and returns 503 while starting or draining. <strong>Startup probe</strong> for slow boots (JVM).</li>
<li><strong>Drain on SIGTERM</strong>: fail readiness → wait ~5-10 s for endpoints/LB to update → stop accepting → finish in-flight → close pools → exit before <code>terminationGracePeriodSeconds</code> (30 s). Exec-form CMD so your process is PID 1 and actually gets the signal.</li>
</ul>
<table>
<tr><th>Framework</th><th>Health</th><th>Graceful shutdown</th></tr>
<tr><td>Spring Boot</td><td>Actuator <code>/actuator/health/{liveness,readiness}</code></td><td><code>server.shutdown=graceful</code> (default 3.4+), <code>timeout-per-shutdown-phase</code></td></tr>
<tr><td>ASP.NET Core</td><td><code>AddHealthChecks()</code> + tags</td><td>Built in; <code>HostOptions.ShutdownTimeout</code> (30 s)</td></tr>
<tr><td>Express / Hono</td><td>Hand-written route</td><td><code>server.close()</code> + <code>closeIdleConnections()</code></td></tr>
<tr><td>Fastify / NestJS</td><td>route / <code>@nestjs/terminus</code></td><td><code>app.close()</code> / <code>enableShutdownHooks()</code></td></tr>
<tr><td>gunicorn / uvicorn</td><td>Hand-written route</td><td><code>--graceful-timeout</code> / <code>--timeout-graceful-shutdown</code></td></tr>
<tr><td>Go</td><td>Hand-written handler</td><td><code>srv.Shutdown(ctx)</code></td></tr>
</table>
<pre># Kubernetes side
lifecycle:
  preStop: { sleep: { seconds: 5 } }     # k8s 1.30+ native sleep; older: exec ["sleep","5"]
terminationGracePeriodSeconds: 30        # must exceed preStop + app drain time
readinessProbe: { httpGet: { path: /readyz, port: 8080 }, periodSeconds: 5, failureThreshold: 2 }
livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10, failureThreshold: 3, timeoutSeconds: 2 }</pre>`,
        he: `<ul>
<li><strong>Liveness</strong> ‏(<code>/healthz</code>): "האם ה-process מסוגל לענות?" — בלי תלויות. <strong>Readiness</strong> ‏(<code>/readyz</code>): "האם לשלוח לי תעבורה?" — יכול לבדוק את ה-DB עם timeout של שנייה, ומחזיר 503 בזמן עלייה או draining. <strong>Startup probe</strong> לאפליקציות שעולות לאט (JVM).</li>
<li><strong>Drain על SIGTERM</strong>: מכשילים readiness → מחכים בערך 5-10 s שה-endpoints וה-LB יתעדכנו → מפסיקים לקבל חיבורים → מסיימים בקשות פתוחות → סוגרים pools → יוצאים לפני <code>terminationGracePeriodSeconds</code> ‏(30 s). ‏CMD ב-exec form, כדי שה-process שלך יהיה PID 1 ובאמת יקבל את ה-signal.</li>
</ul>
<table>
<tr><th>Framework</th><th>Health</th><th>Graceful shutdown</th></tr>
<tr><td>Spring Boot</td><td>Actuator <code>/actuator/health/{liveness,readiness}</code></td><td><code>server.shutdown=graceful</code> (ברירת מחדל מ-3.4), ‏<code>timeout-per-shutdown-phase</code></td></tr>
<tr><td>ASP.NET Core</td><td><code>AddHealthChecks()</code> עם tags</td><td>מובנה; ‏<code>HostOptions.ShutdownTimeout</code> ‏(30 s)</td></tr>
<tr><td>Express / Hono</td><td>route שכותבים לבד</td><td><code>server.close()</code> + <code>closeIdleConnections()</code></td></tr>
<tr><td>Fastify / NestJS</td><td>route או <code>@nestjs/terminus</code></td><td><code>app.close()</code> או <code>enableShutdownHooks()</code></td></tr>
<tr><td>gunicorn / uvicorn</td><td>route שכותבים לבד</td><td><code>--graceful-timeout</code> או <code>--timeout-graceful-shutdown</code></td></tr>
<tr><td>Go</td><td>handler שכותבים לבד</td><td><code>srv.Shutdown(ctx)</code></td></tr>
</table>
<pre># Kubernetes side
lifecycle:
  preStop: { sleep: { seconds: 5 } }     # k8s 1.30+ native sleep; older: exec ["sleep","5"]
terminationGracePeriodSeconds: 30        # must exceed preStop + app drain time
readinessProbe: { httpGet: { path: /readyz, port: 8080 }, periodSeconds: 5, failureThreshold: 2 }
livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10, failureThreshold: 3, timeoutSeconds: 2 }</pre>`
      }
    },
    {
      h: { en: "2. Timeouts at every layer, and bounded pools", he: "2. ‏Timeouts בכל שכבה, ו-pools מוגבלים" },
      body: {
        en: `<p>Two different rules, often confused:</p>
<ul>
<li><strong>Request timeouts nest inward</strong>: each inner layer gives up <em>before</em> the outer one, so the error is produced where the context is, resources are freed, and no one keeps working for a client that left.</li>
<li><strong>Idle (keep-alive) timeouts go outward</strong>: the server keeps idle connections <em>longer</em> than the proxy in front of it, so the proxy always closes first (otherwise: the 502 race).</li>
</ul>
<pre>REQUEST BUDGET (shrinks inward)                 IDLE KEEP-ALIVE (grows inward)
client / mobile app   timeout 15 s              ALB idle timeout           60 s
  ALB / gateway       60 s idle, 30 s route      app server keep-alive     65-75 s
    app per-request   10 s (deadline)            (Node 65 s, Go IdleTimeout 75 s,
      outbound HTTP    3 s  x max 1 retry          uvicorn --timeout-keep-alive 75)
      DB pool acquire  1 s
      DB statement     2 s (statement_timeout)</pre>
<p><strong>Pools are the real concurrency limits</strong>: DB pool, HTTP client pool, thread pool. Size them on purpose and expose their metrics.</p>
<table>
<tr><th>Pool</th><th>Rule of thumb</th><th>Watch</th></tr>
<tr><td>DB connections</td><td>Small (10-20 per Pod); Pods × pool &lt; DB max_connections; PgBouncer/RDS Proxy beyond that</td><td>pending/wait time (<code>hikaricp_connections_pending</code>)</td></tr>
<tr><td>Outbound HTTP</td><td>Reuse one client per process (connection keep-alive); never create a client per request</td><td>connect time, TIME_WAIT count</td></tr>
<tr><td>Worker threads</td><td>Little's Law: in-flight = RPS × latency (200 RPS × 0.1 s = 20)</td><td>queue length, saturation</td></tr>
</table>
<blockquote>⚠️ Production tip: retries multiply load — 3 layers each retrying 3 times = up to 27 calls to the bottom service. Retry at one layer, only idempotent calls, with exponential backoff + jitter and a retry budget; propagate the remaining deadline (gRPC deadlines, <code>context</code> in Go, <code>AbortSignal.timeout</code> in Node).</blockquote>`,
        he: `<p>שני כללים שונים, שמבלבלים ביניהם הרבה:</p>
<ul>
<li><strong>Request timeouts מתקצרים פנימה</strong>: כל שכבה פנימית מוותרת <em>לפני</em> השכבה החיצונית, כך שהשגיאה נוצרת איפה שיש הקשר, משאבים משתחררים, ואף אחד לא ממשיך לעבוד בשביל לקוח שכבר הלך.</li>
<li><strong>Idle (keep-alive) timeouts מתארכים פנימה</strong>: השרת מחזיק חיבורים idle <em>יותר זמן</em> מה-proxy שלפניו, כך שה-proxy תמיד סוגר ראשון (אחרת: מרוץ ה-502).</li>
</ul>
<pre>REQUEST BUDGET (shrinks inward)                 IDLE KEEP-ALIVE (grows inward)
client / mobile app   timeout 15 s              ALB idle timeout           60 s
  ALB / gateway       60 s idle, 30 s route      app server keep-alive     65-75 s
    app per-request   10 s (deadline)            (Node 65 s, Go IdleTimeout 75 s,
      outbound HTTP    3 s  x max 1 retry          uvicorn --timeout-keep-alive 75)
      DB pool acquire  1 s
      DB statement     2 s (statement_timeout)</pre>
<p><strong>Pools הם מגבלות המקביליות האמיתיות</strong>: ‏pool של DB, ‏pool של HTTP client, ‏thread pool. קובעים את הגודל שלהם בכוונה וחושפים את ה-metrics שלהם.</p>
<table>
<tr><th>Pool</th><th>כלל אצבע</th><th>מה לנטר</th></tr>
<tr><td>חיבורי DB</td><td>קטן (10-20 ל-Pod); ‏Pod-ים × pool קטן מ-max_connections של ה-DB; מעבר לזה PgBouncer או RDS Proxy</td><td>pending וזמן המתנה (<code>hikaricp_connections_pending</code>)</td></tr>
<tr><td>HTTP יוצא</td><td>client אחד משותף לכל process ‏(keep-alive לחיבורים); אף פעם לא client חדש לכל בקשה</td><td>זמן connect, כמות TIME_WAIT</td></tr>
<tr><td>Worker threads</td><td>‏Little's Law: בקשות בטיפול = RPS × latency ‏(200 RPS × 0.1 s = ‏20)</td><td>אורך תור, רוויה</td></tr>
</table>
<blockquote>⚠️ Production tip: ‏retries מכפילים עומס — 3 שכבות שכל אחת עושה 3 retries = עד 27 קריאות לשירות התחתון. עושים retry בשכבה אחת, רק לקריאות אידמפוטנטיות, עם exponential backoff ו-jitter ועם retry budget; ומעבירים הלאה את ה-deadline שנשאר (deadlines של gRPC, ‏<code>context</code> ב-Go, ‏<code>AbortSignal.timeout</code> ב-Node).</blockquote>`
      }
    },
    {
      h: { en: "3. Logs, request IDs and OpenTelemetry", he: "3. לוגים, ‏request IDs ו-OpenTelemetry" },
      body: {
        en: `<ul>
<li><strong>Structured JSON to stdout</strong>, one line per event, never to local files: pino (Node), structlog / python-json-logger, Logback JSON encoder or Spring Boot 3.4+ <code>logging.structured.format.console=ecs</code>, Serilog / built-in JSON console (.NET), <code>log/slog</code> (Go 1.21+).</li>
<li><strong>Request ID</strong>: accept <code>X-Request-ID</code> (or generate a UUID), put it on every log line, return it in the response, pass it downstream. Better: the W3C <code>traceparent</code> header from OpenTelemetry, so logs and traces join on <code>trace_id</code>.</li>
<li>Never log secrets, tokens, full card numbers or raw bodies with PII — use redaction lists.</li>
</ul>
<table>
<tr><th>Language</th><th>OpenTelemetry auto-instrumentation</th></tr>
<tr><td>Java</td><td><code>-javaagent:/otel/opentelemetry-javaagent.jar</code> (Spring MVC, JDBC, Kafka, HTTP clients — zero code)</td></tr>
<tr><td>Python</td><td><code>opentelemetry-bootstrap -a install</code> then <code>opentelemetry-instrument uvicorn main:app</code></td></tr>
<tr><td>Node.js</td><td><code>node --require @opentelemetry/auto-instrumentations-node/register server.js</code></td></tr>
<tr><td>.NET</td><td>OpenTelemetry .NET automatic instrumentation, or <code>AddOpenTelemetry().WithTracing(t =&gt; t.AddAspNetCoreInstrumentation())</code></td></tr>
<tr><td>Go</td><td>No runtime agent: wrap with <code>otelhttp.NewHandler(mux, "api")</code> / otelgrpc, or eBPF-based instrumentation (OBI)</td></tr>
</table>
<pre># Kubernetes: the OpenTelemetry Operator injects the agent for you
metadata:
  annotations:
    instrumentation.opentelemetry.io/inject-java: "true"     # or -python, -nodejs, -dotnet, -go
env:
  - { name: OTEL_SERVICE_NAME, value: checkout-api }
  - { name: OTEL_EXPORTER_OTLP_ENDPOINT, value: "http://otel-collector:4317" }
  - { name: OTEL_TRACES_SAMPLER, value: parentbased_traceidratio }
  - { name: OTEL_TRACES_SAMPLER_ARG, value: "0.1" }           # 10% head sampling</pre>
<p>Minimum dashboard per service: RED metrics (rate, errors, duration p50/p99) per route, saturation (CPU throttling, memory vs limit, pool waits, event-loop lag / thread-pool queue), and dependency latency.</p>`,
        he: `<ul>
<li><strong>JSON מובנה ל-stdout</strong>, שורה אחת לכל אירוע, אף פעם לא לקבצים מקומיים: ‏pino ‏(Node), ‏structlog או python-json-logger, ‏encoder של JSON ב-Logback או <code>logging.structured.format.console=ecs</code> ב-Spring Boot 3.4+, ‏Serilog או ה-JSON console המובנה (.NET), ‏<code>log/slog</code> ‏(Go 1.21+).</li>
<li><strong>Request ID</strong>: מקבלים <code>X-Request-ID</code> (או מייצרים UUID), שמים אותו בכל שורת לוג, מחזירים אותו בתשובה ומעבירים הלאה. עדיף: ה-header ‏<code>traceparent</code> של W3C מ-OpenTelemetry, כך שלוגים ו-traces מתחברים לפי <code>trace_id</code>.</li>
<li>אף פעם לא כותבים ללוג secrets, ‏tokens, מספרי כרטיס מלאים או bodies גולמיים עם PII — משתמשים ברשימות redaction.</li>
</ul>
<table>
<tr><th>שפה</th><th>Auto-instrumentation של OpenTelemetry</th></tr>
<tr><td>Java</td><td><code>-javaagent:/otel/opentelemetry-javaagent.jar</code> ‏(Spring MVC, ‏JDBC, ‏Kafka, ‏HTTP clients — בלי שורת קוד)</td></tr>
<tr><td>Python</td><td><code>opentelemetry-bootstrap -a install</code> ואז <code>opentelemetry-instrument uvicorn main:app</code></td></tr>
<tr><td>Node.js</td><td><code>node --require @opentelemetry/auto-instrumentations-node/register server.js</code></td></tr>
<tr><td>.NET</td><td>ה-automatic instrumentation של OpenTelemetry .NET, או <code>AddOpenTelemetry().WithTracing(t =&gt; t.AddAspNetCoreInstrumentation())</code></td></tr>
<tr><td>Go</td><td>אין agent בזמן ריצה: עוטפים עם <code>otelhttp.NewHandler(mux, "api")</code> או otelgrpc, או instrumentation מבוסס eBPF ‏(OBI)</td></tr>
</table>
<pre># Kubernetes: the OpenTelemetry Operator injects the agent for you
metadata:
  annotations:
    instrumentation.opentelemetry.io/inject-java: "true"     # or -python, -nodejs, -dotnet, -go
env:
  - { name: OTEL_SERVICE_NAME, value: checkout-api }
  - { name: OTEL_EXPORTER_OTLP_ENDPOINT, value: "http://otel-collector:4317" }
  - { name: OTEL_TRACES_SAMPLER, value: parentbased_traceidratio }
  - { name: OTEL_TRACES_SAMPLER_ARG, value: "0.1" }           # 10% head sampling</pre>
<p>דשבורד מינימלי לכל שירות: ‏RED metrics ‏(rate, ‏errors, ‏duration p50/p99) לכל route, רוויה (CPU throttling, זיכרון מול limit, המתנה ל-pool, ‏lag של event loop או תור של thread pool), ו-latency של dependencies.</p>`
      }
    },
    {
      h: { en: "4. Config, secrets, limits and safe errors", he: "4. קונפיגורציה, ‏secrets, מגבלות ושגיאות בטוחות" },
      body: {
        en: `<ul>
<li><strong>Config via environment (12-factor)</strong>: the same image runs in dev, staging and prod; only env vars / mounted files differ. Validate config at startup and crash early on a missing value (pydantic-settings, <code>@ConfigurationProperties</code> + <code>@Validated</code>, zod on <code>process.env</code>, <code>IOptions</code> with <code>ValidateOnStart()</code>).</li>
<li><strong>Secrets</strong>: from a secret manager (External Secrets / CSI driver / cloud SDK), never baked into the image, never in Git, never logged. Prefer workload identity (IRSA, Workload Identity) over static cloud keys.</li>
<li><strong>Rate limits</strong> at the edge (gateway/WAF) per client/API key, plus app-level protection for expensive routes: express-rate-limit, slowapi, Bucket4j, ASP.NET Core <code>AddRateLimiter</code> (.NET 7+), <code>golang.org/x/time/rate</code>. Return 429 with <code>Retry-After</code>.</li>
<li><strong>Security headers &amp; CORS</strong>: HSTS, <code>X-Content-Type-Options: nosniff</code>, a CSP (<code>default-src 'none'; frame-ancestors 'none'</code> for pure APIs). helmet / @fastify/helmet, Django <code>SecurityMiddleware</code>, Spring Security defaults, <code>app.UseHsts()</code>. CORS: allowlist exact origins; never reflect any Origin with credentials.</li>
<li><strong>Errors</strong>: users get a stable shape (RFC 9457 problem+json) and a request ID; stack traces go to logs only. Turn off <code>DEBUG=True</code> (Django), Flask debug, <code>UseDeveloperExceptionPage</code>; run Node with <code>NODE_ENV=production</code>.</li>
</ul>
<table>
<tr><th>Stack</th><th>Default max request body</th></tr>
<tr><td>Express <code>express.json()</code></td><td>100 KB</td></tr>
<tr><td>Fastify</td><td>1 MiB (<code>bodyLimit</code>)</td></tr>
<tr><td>Django</td><td>2.5 MB (<code>DATA_UPLOAD_MAX_MEMORY_SIZE</code>, non-file data)</td></tr>
<tr><td>Flask / FastAPI</td><td>No limit by default (set <code>MAX_CONTENT_LENGTH</code> / at the proxy)</td></tr>
<tr><td>Spring Boot multipart</td><td>1 MB per file, 10 MB per request</td></tr>
<tr><td>Kestrel</td><td>30,000,000 bytes (~28.6 MB)</td></tr>
<tr><td>Go net/http</td><td>No limit (wrap with <code>http.MaxBytesReader</code>)</td></tr>
<tr><td>Axum</td><td>2 MB</td></tr>
<tr><td>nginx <code>client_max_body_size</code></td><td>1 MB (413 above it)</td></tr>
</table>`,
        he: `<ul>
<li><strong>קונפיגורציה דרך environment ‏(12-factor)</strong>: אותו image רץ ב-dev, ב-staging וב-prod; רק משתני הסביבה או הקבצים המותקנים משתנים. בודקים את הקונפיגורציה בעלייה וקורסים מוקדם כשחסר ערך (pydantic-settings, ‏<code>@ConfigurationProperties</code> עם <code>@Validated</code>, ‏zod על <code>process.env</code>, ‏<code>IOptions</code> עם <code>ValidateOnStart()</code>).</li>
<li><strong>Secrets</strong>: מ-secret manager ‏(External Secrets, ‏CSI driver או SDK של הענן), אף פעם לא אפויים ב-image, אף פעם לא ב-Git, אף פעם לא בלוג. עדיף workload identity ‏(IRSA, ‏Workload Identity) על פני מפתחות ענן סטטיים.</li>
<li><strong>Rate limits</strong> ב-edge ‏(gateway/WAF) לכל לקוח או API key, ועוד הגנה ברמת האפליקציה ל-routes יקרים: ‏express-rate-limit, ‏slowapi, ‏Bucket4j, ‏<code>AddRateLimiter</code> של ASP.NET Core ‏(.NET 7+), ‏<code>golang.org/x/time/rate</code>. מחזירים 429 עם <code>Retry-After</code>.</li>
<li><strong>Security headers ו-CORS</strong>: ‏HSTS, ‏<code>X-Content-Type-Options: nosniff</code>, ‏CSP ‏(<code>default-src 'none'; frame-ancestors 'none'</code> ל-API נקי). ‏helmet או @fastify/helmet, ‏<code>SecurityMiddleware</code> של Django, ברירות המחדל של Spring Security, ‏<code>app.UseHsts()</code>. ‏CORS: רשימת origins מדויקת; אף פעם לא לשקף כל Origin יחד עם credentials.</li>
<li><strong>שגיאות</strong>: המשתמש מקבל מבנה קבוע (problem+json לפי RFC 9457) ו-request ID; ‏stack traces הולכים רק ללוגים. מכבים <code>DEBUG=True</code> ‏(Django), את ה-debug של Flask ואת <code>UseDeveloperExceptionPage</code>; מריצים Node עם <code>NODE_ENV=production</code>.</li>
</ul>
<table>
<tr><th>Stack</th><th>גודל body מקסימלי כברירת מחדל</th></tr>
<tr><td>Express <code>express.json()</code></td><td>100 KB</td></tr>
<tr><td>Fastify</td><td>1 MiB ‏(<code>bodyLimit</code>)</td></tr>
<tr><td>Django</td><td>2.5 MB ‏(<code>DATA_UPLOAD_MAX_MEMORY_SIZE</code>, נתונים שאינם קבצים)</td></tr>
<tr><td>Flask / FastAPI</td><td>אין הגבלה כברירת מחדל (מגדירים <code>MAX_CONTENT_LENGTH</code> או ב-proxy)</td></tr>
<tr><td>Spring Boot multipart</td><td>1 MB לקובץ, 10 MB לבקשה</td></tr>
<tr><td>Kestrel</td><td>30,000,000 bytes (בערך 28.6 MB)</td></tr>
<tr><td>Go net/http</td><td>אין הגבלה (עוטפים עם <code>http.MaxBytesReader</code>)</td></tr>
<tr><td>Axum</td><td>2 MB</td></tr>
<tr><td>nginx <code>client_max_body_size</code></td><td>1 MB ‏(413 מעל זה)</td></tr>
</table>`
      }
    },
    {
      h: { en: "5. Static files, migrations, images and load tests", he: "5. קבצים סטטיים, ‏migrations, ‏images ו-load tests" },
      body: {
        en: `<ul>
<li><strong>Static files via CDN</strong>: build hashed assets (<code>app.3f9a1c.js</code>), upload to object storage, serve through a CDN with <code>Cache-Control: public, max-age=31536000, immutable</code>. Your app workers should never spend a request slot streaming a 2 MB bundle.</li>
<li><strong>Migrations are a deploy step</strong>, run once, before the new version: a Kubernetes Job, Helm <code>pre-upgrade</code> hook or Argo CD <code>PreSync</code> hook, using Flyway/Liquibase, Alembic, Django migrate, EF Core migration bundles, Prisma <code>migrate deploy</code> or golang-migrate. Use expand → migrate → contract so old and new pods both work during the rollout; set <code>lock_timeout</code> so DDL can't queue behind a long transaction and block every query.</li>
<li><strong>Container image</strong>: multi-stage build, slim or distroless base, pinned by digest, non-root <code>USER</code>, read-only root filesystem, <code>.dockerignore</code>, no secrets in layers, exec-form <code>CMD</code>, one process per container, CVE scan in CI.</li>
</ul>
<pre>// k6 load test — run against staging before launch: k6 run load.js
import http from "k6/http";
import { check } from "k6";
export const options = {
  stages: [ { duration: "2m", target: 200 }, { duration: "10m", target: 200 }, { duration: "2m", target: 0 } ],
  thresholds: { http_req_failed: ["rate&lt;0.001"], http_req_duration: ["p(99)&lt;500"] },
};
export default function () {
  const r = http.get("https://staging.api.shop.com/products?page=1");
  check(r, { "status 200": (res) =&gt; res.status === 200 });
}</pre>
<p>Load test goals: find the first saturated resource (CPU throttling? pool waits? event-loop lag? DB CPU?), verify autoscaling reacts in time, run a soak test (hours) for leaks, and kill Pods mid-test to prove graceful shutdown drops zero requests.</p>
<blockquote>💡 Real world: the launch-day outages teams remember are rarely "the framework was slow". They're a DB pool of 10, a missing timeout on a payment API, a migration that locked a table, or debug mode left on. Every item on this list is one of those incidents.</blockquote>`,
        he: `<ul>
<li><strong>קבצים סטטיים דרך CDN</strong>: בונים assets עם hash ‏(<code>app.3f9a1c.js</code>), מעלים ל-object storage, ומגישים דרך CDN עם <code>Cache-Control: public, max-age=31536000, immutable</code>. ה-workers של האפליקציה לא צריכים לבזבז slot של בקשה על stream של bundle של 2 MB.</li>
<li><strong>Migrations הם שלב ב-deploy</strong>, רצים פעם אחת לפני הגרסה החדשה: ‏Job של Kubernetes, ‏hook מסוג <code>pre-upgrade</code> של Helm או <code>PreSync</code> של Argo CD, עם Flyway/Liquibase, ‏Alembic, ‏Django migrate, ‏migration bundles של EF Core, ‏<code>migrate deploy</code> של Prisma או golang-migrate. עובדים ב-expand → migrate → contract כדי שגם ה-Pod-ים הישנים וגם החדשים יעבדו בזמן ה-rollout; מגדירים <code>lock_timeout</code> כדי ש-DDL לא ייתקע בתור מאחורי טרנזקציה ארוכה ויחסום כל שאילתה.</li>
<li><strong>Container image</strong>: ‏multi-stage build, ‏base רזה או distroless, נעוץ לפי digest, ‏<code>USER</code> שאינו root, ‏root filesystem לקריאה בלבד, ‏<code>.dockerignore</code>, בלי secrets ב-layers, ‏<code>CMD</code> ב-exec form, ‏process אחד לכל container, וסריקת CVE ב-CI.</li>
</ul>
<pre>// k6 load test — run against staging before launch: k6 run load.js
import http from "k6/http";
import { check } from "k6";
export const options = {
  stages: [ { duration: "2m", target: 200 }, { duration: "10m", target: 200 }, { duration: "2m", target: 0 } ],
  thresholds: { http_req_failed: ["rate&lt;0.001"], http_req_duration: ["p(99)&lt;500"] },
};
export default function () {
  const r = http.get("https://staging.api.shop.com/products?page=1");
  check(r, { "status 200": (res) =&gt; res.status === 200 });
}</pre>
<p>המטרות של load test: למצוא את המשאב הראשון שנחנק (CPU throttling? המתנה ל-pool? ‏lag של event loop? ‏CPU של ה-DB?), לוודא שה-autoscaling מגיב בזמן, להריץ soak test (שעות) כדי לתפוס דליפות, ולהרוג Pod-ים באמצע הבדיקה כדי להוכיח שה-graceful shutdown לא מפיל אף בקשה.</p>
<blockquote>💡 Real world: התקלות של יום ההשקה שצוותים זוכרים הן כמעט אף פעם לא "ה-framework היה איטי". הן pool של DB בגודל 10, ‏timeout חסר מול API של תשלומים, ‏migration שנעל טבלה, או debug mode שנשאר דלוק. כל סעיף ברשימה הזו הוא אחת מהתקלות האלה.</blockquote>`
      }
    }
  ],
  diagram: "CDN (static, immutable) --+\nclient (15 s) -> WAF/rate limit -> ALB (idle 60 s) -> Pod\n                                                     |- /healthz /readyz, SIGTERM drain\n                                                     |- request budget 10 s, keep-alive 65 s\n                                                     |- JSON logs + trace_id -> OTel Collector\n                                                     |- DB pool (acquire 1 s, statement 2 s)\n deploy: CI build image -> migration Job (expand) -> rollout -> contract later",
  handsOn: [
    { cmd: "kubectl rollout restart deploy/api & k6 run --vus 50 --duration 2m load.js", what: { en: "Restart Pods during a load test: any failed requests mean your drain/readiness path is broken.", he: "לאתחל Pod-ים באמצע load test: כל בקשה שנכשלת אומרת שמסלול ה-drain או ה-readiness שבור." } },
    { cmd: "curl -sI https://api.shop.com/healthz | grep -iE 'strict-transport|x-content-type|content-security|x-request-id'", what: { en: "Check security headers and that a request ID comes back.", he: "לבדוק security headers ושחוזר request ID." } },
    { cmd: "head -c 20000000 /dev/zero | curl -s -o /dev/null -w '%{http_code}\\n' -X POST -H 'Content-Type: application/json' --data-binary @- https://staging.api.shop.com/users", what: { en: "Send a 20 MB body: you want a fast 413, not a worker busy parsing it.", he: "לשלוח body של 20 MB: אתה רוצה 413 מהיר, לא worker שעסוק בלפרסר אותו." } },
    { cmd: "kubectl get deploy api -o yaml | grep -nE 'terminationGracePeriodSeconds|preStop|readinessProbe|livenessProbe|resources' ", what: { en: "Audit the k8s side of the checklist in one glance.", he: "לעבור על הצד של k8s ב-checklist במבט אחד." } }
  ],
  mnemonic: {
    en: "\"H-T-P-L-C-L-M-I-L\": Health, Timeouts, Pools, Logs/traces, Config/secrets, Limits, Migrations, Image, Load test.",
    he: "\"H-T-P-L-C-L-M-I-L\": ‏Health, ‏Timeouts, ‏Pools, ‏Logs/traces, ‏Config/secrets, ‏Limits, ‏Migrations, ‏Image, ‏Load test."
  },
  pitfalls: [
    { en: "Setting the app's request timeout longer than the LB's — the LB returns a bare 504 while the app keeps burning DB time for nobody.", he: "לקבוע request timeout באפליקציה ארוך מזה של ה-LB — ה-LB מחזיר 504 ריק בזמן שהאפליקציה ממשיכה לשרוף זמן DB בשביל אף אחד." },
    { en: "Retrying at every layer — 3 layers × 3 retries = 27× load on a struggling dependency (retry storm).", he: "לעשות retry בכל שכבה — 3 שכבות × 3 retries = פי 27 עומס על dependency שכבר מתקשה (retry storm)." },
    { en: "Creating an HTTP or DB client per request — no connection reuse, TLS handshakes on every call, thousands of sockets in TIME_WAIT.", he: "ליצור HTTP client או DB client לכל בקשה — בלי שימוש חוזר בחיבורים, ‏TLS handshake בכל קריאה, ואלפי sockets ב-TIME_WAIT." },
    { en: "Running migrations from every Pod on startup — concurrent DDL, long locks, and a rollout that blocks the database.", he: "להריץ migrations מכל Pod בעלייה — ‏DDL במקביל, ‏locks ארוכים, ו-rollout שחוסם את ה-DB." }
  ],
  interview: [
    { q: { en: "Give me your production-readiness review for a new service in two minutes.", he: "תן לי סקירת production-readiness לשירות חדש בשתי דקות." },
      a: { en: "Health: separate liveness and readiness, startup probe if slow. Shutdown: SIGTERM drain with preStop, PID 1 handles signals. Timeouts: nested request budgets, idle keep-alive above the LB, outbound clients with timeouts and one retry layer. Pools sized against DB max_connections. Observability: JSON logs with trace IDs, OTel traces, RED + saturation dashboards and SLO alerts. Config from env, secrets from a manager. Limits: body size, rate limits, CORS allowlist, security headers, no stack traces. Delivery: migrations as a Job with expand/contract, slim non-root image. Then a load and kill test in staging.", he: "‏Health: ‏liveness ו-readiness נפרדים, ‏startup probe אם עולה לאט. ‏Shutdown: ‏drain על SIGTERM עם preStop, ‏PID 1 שמטפל ב-signals. ‏Timeouts: תקציבי בקשה מקוננים, ‏keep-alive idle מעל ה-LB, ‏clients יוצאים עם timeouts ושכבת retry אחת. ‏Pools בגודל שמתאים ל-max_connections של ה-DB. ‏Observability: לוגי JSON עם trace IDs, ‏traces של OTel, דשבורדים של RED ורוויה והתראות SLO. קונפיגורציה מ-env, ‏secrets מ-manager. מגבלות: גודל body, ‏rate limits, רשימת CORS, ‏security headers, בלי stack traces. ‏Delivery: ‏migrations כ-Job עם expand/contract, ‏image רזה בלי root. ואז load test ו-kill test ב-staging." } },
    { q: { en: "How should timeouts relate between client, LB, app and DB?", he: "איך ה-timeouts צריכים להתייחס זה לזה בין client, ‏LB, אפליקציה ו-DB?" },
      a: { en: "Request timeouts shrink inward: client > LB > app request budget > outbound calls > DB statement timeout, so the innermost failure is reported with context and work stops early; propagate the remaining deadline downstream. Idle keep-alive timeouts grow inward: the app server's idle timeout must exceed the LB's (e.g. 65 s vs 60 s) so the LB always closes idle connections first.", he: "‏Request timeouts מתקצרים פנימה: ‏client > ‏LB > תקציב הבקשה של האפליקציה > קריאות יוצאות > ‏statement timeout של ה-DB, כך שהכישלון הפנימי מדווח עם הקשר והעבודה נעצרת מוקדם; ומעבירים את ה-deadline שנשאר הלאה. ‏Idle keep-alive timeouts מתארכים פנימה: ה-idle timeout של שרת האפליקציה חייב להיות גדול מזה של ה-LB (למשל 65 s מול 60 s), כדי שה-LB תמיד יסגור חיבורים idle ראשון." } }
  ],
  quiz: [
    { q: { en: "Which belongs in a liveness probe?", he: "מה שייך ל-liveness probe?" },
      options: [
        { en: "A query to the primary database", he: "שאילתה ל-DB הראשי" },
        { en: "A call to the payment provider", he: "קריאה לספק התשלומים" },
        { en: "Only proof that the process can answer (no dependencies)", he: "רק הוכחה שה-process מסוגל לענות (בלי תלויות)" },
        { en: "A full end-to-end checkout", he: "‏checkout מלא מקצה לקצה" }
      ], answer: 2,
      explain: { en: "If liveness checks dependencies, a DB blip restarts every Pod at once. Dependencies belong (carefully) in readiness.", he: "אם liveness בודק תלויות, תקלה קטנה ב-DB מאתחלת את כל ה-Pod-ים בבת אחת. תלויות שייכות (בזהירות) ל-readiness." } },
    { q: { en: "ALB idle timeout is 60 s. What should the app server's keep-alive idle timeout be?", he: "ה-idle timeout של ה-ALB הוא 60 s. מה צריך להיות ה-keep-alive idle timeout של שרת האפליקציה?" },
      options: [
        { en: "5 s, to free sockets quickly", he: "‏5 s, כדי לשחרר sockets מהר" },
        { en: "Exactly 60 s", he: "בדיוק 60 s" },
        { en: "Longer than 60 s, e.g. 65-75 s", he: "יותר מ-60 s, למשל 65-75 s" },
        { en: "It doesn't matter", he: "זה לא משנה" }
      ], answer: 2,
      explain: { en: "The proxy must close idle connections first. If the server closes first, the proxy can send a request into a closing socket and return 502.", he: "ה-proxy צריך לסגור חיבורים idle ראשון. אם השרת סוגר ראשון, ה-proxy יכול לשלוח בקשה לתוך socket שנסגר ולהחזיר 502." } },
    { q: { en: "Where should database migrations run in a Kubernetes deploy?", he: "איפה צריכים לרוץ migrations של DB ב-deploy על Kubernetes?" },
      options: [
        { en: "In every Pod's entrypoint, before the server starts", he: "ב-entrypoint של כל Pod, לפני שהשרת עולה" },
        { en: "Once, as a Job / pre-upgrade hook before the rollout, with expand/contract changes", he: "פעם אחת, כ-Job או pre-upgrade hook לפני ה-rollout, עם שינויים בשיטת expand/contract" },
        { en: "Manually from a laptop after the rollout", he: "ידנית מהלפטופ אחרי ה-rollout" },
        { en: "In the liveness probe", he: "ב-liveness probe" }
      ], answer: 1,
      explain: { en: "One controlled run avoids concurrent DDL; expand/contract keeps both old and new versions working during the rollout.", he: "הרצה אחת מבוקרת מונעת DDL במקביל; ‏expand/contract שומר על כך שגם הגרסה הישנה וגם החדשה עובדות בזמן ה-rollout." } },
    { q: { en: "Three service layers each retry failed calls 3 times. Worst case, how many calls reach the bottom service per user request?", he: "שלוש שכבות שירות, וכל אחת עושה 3 retries לקריאות שנכשלו. במקרה הגרוע, כמה קריאות מגיעות לשירות התחתון לכל בקשת משתמש?" },
      options: [
        { en: "3", he: "3" },
        { en: "9", he: "9" },
        { en: "27 (or 64 counting the original attempts)", he: "‏27 (או 64 אם סופרים גם את הניסיונות המקוריים)" },
        { en: "1", he: "1" }
      ], answer: 2,
      explain: { en: "Retries multiply per layer: 3×3×3 = 27 retried attempts (4×4×4 = 64 total with originals). Retry at one layer, with backoff, jitter and a retry budget.", he: "‏retries מוכפלים בכל שכבה: ‏3×3×3 = ‏27 ניסיונות חוזרים (4×4×4 = ‏64 כולל המקוריים). עושים retry בשכבה אחת, עם backoff, ‏jitter ו-retry budget." } }
  ],
  playground: "scaling",
  related: ["k8s-probes", "processes-linux", "arch-resilience", "obs-otel-collector", "cloud-secrets-management", "container-slim-images", "staff-zero-downtime-migrations", "pr-rate-limiters", "net-proxies-cdn", "pr-security-owasp", "db-operations", "python-web-frameworks", "node-web-frameworks", "jvm-dotnet-go-web"]
});

INFRA.glossary.push(
  { term: "Twelve-Factor App", track: "architecture", def: { en: "A methodology for cloud services: config in environment variables, stateless processes, backing services as attached resources, logs as event streams to stdout, disposability (fast start, graceful SIGTERM), dev/prod parity.", he: "מתודולוגיה לשירותי ענן: קונפיגורציה במשתני סביבה, ‏processes בלי state, שירותי גיבוי כמשאבים מחוברים, לוגים כזרם אירועים ל-stdout, ‏disposability (עלייה מהירה, ‏SIGTERM מסודר) ודמיון בין dev ל-prod." }, lesson: "web-service-production-checklist" },
  { term: "Request ID", track: "architecture", def: { en: "A unique ID (X-Request-ID or the W3C traceparent trace ID) attached to every log line, returned to the caller and propagated downstream, so one request can be followed across services.", he: "מזהה ייחודי (X-Request-ID או ה-trace ID של traceparent לפי W3C) שמוצמד לכל שורת לוג, מוחזר ללקוח ומועבר הלאה, כדי שאפשר יהיה לעקוב אחרי בקשה אחת בין שירותים." }, lesson: "web-service-production-checklist" },
  { term: "Graceful shutdown", track: "architecture", def: { en: "On SIGTERM: fail readiness, wait for the LB to stop sending traffic, stop accepting connections, finish in-flight requests, close pools and exit before the grace period ends — so deploys drop zero requests.", he: "על SIGTERM: מכשילים readiness, מחכים שה-LB יפסיק לשלוח תעבורה, מפסיקים לקבל חיבורים, מסיימים בקשות פתוחות, סוגרים pools ויוצאים לפני שתקופת החסד נגמרת — כדי ש-deploys לא יפילו אף בקשה." }, lesson: "web-service-production-checklist" }
);

INFRA.scenarios.push({
  id: "node-keepalive-502s",
  icon: "🔌",
  title: { en: "Intermittent 502s behind the ALB — and the app says everything is fine", he: "‏502 לסירוגין מאחורי ה-ALB — והאפליקציה טוענת שהכול בסדר" },
  start: "s1",
  steps: {
    s1: {
      text: { en: "Tuesday 14:10. Support forwards complaints: \"checkout randomly fails, retry works\". The SLO dashboard shows a 0.3% error rate on the Node.js checkout-api behind an AWS ALB — all 502s. No deploy in 3 days, CPU 25%, memory flat, app error logs are empty. What do you do first?", he: "יום שלישי, 14:10. התמיכה מעבירה תלונות: \"ה-checkout נכשל באקראי, ניסיון חוזר עובד\". דשבורד ה-SLO מראה 0.3% שגיאות ב-checkout-api ‏(Node.js) מאחורי AWS ALB — כולן 502. אין deploy כבר 3 ימים, ‏CPU על 25%, זיכרון שטוח, הלוגים של שגיאות באפליקציה ריקים. מה אתה עושה קודם?" },
      data: "CloudWatch (5 min):  RequestCount 182,400   HTTPCode_ELB_502_Count 547\n                     HTTPCode_Target_5XX_Count 0   TargetResponseTime p99 180 ms\nkubectl get pods -l app=checkout-api  ->  6/6 Running, 0 restarts",
      choices: [
        { label: { en: "Check whether the 502s come from the ALB or from the targets, and pull ALB access logs", he: "לבדוק אם ה-502 מגיעים מה-ALB או מה-targets, ולשלוף את ה-access logs של ה-ALB" }, next: "s2", score: 10, feedback: { en: "Right split: ELB_502 > 0 while Target_5XX = 0 means the ALB generated them — the app never answered with an error.", he: "החלוקה הנכונה: ‏ELB_502 גדול מאפס בזמן ש-Target_5XX = ‏0 אומר שה-ALB ייצר אותן — האפליקציה אף פעם לא ענתה בשגיאה." } },
        { label: { en: "Scale checkout-api from 6 to 12 replicas", he: "להגדיל את checkout-api מ-6 ל-12 replicas" }, next: "s1b", score: 0, feedback: { en: "CPU is 25% and latency is fine — this isn't a capacity problem. More Pods can even mean more idle connections and more 502s.", he: "ה-CPU על 25% וה-latency תקין — זו לא בעיית קיבולת. יותר Pod-ים יכולים אפילו להוביל ליותר חיבורים idle ויותר 502." } },
        { label: { en: "Roll back to last week's image", he: "לעשות rollback ל-image של שבוע שעבר" }, next: "s1b", score: 0, feedback: { en: "Nothing changed for 3 days and the error existed before. Rolling back blind costs time and risk.", he: "שום דבר לא השתנה 3 ימים והשגיאה הייתה גם קודם. ‏rollback עיוור עולה זמן וסיכון." } }
      ]
    },
    s1b: {
      text: { en: "30 minutes later the 502 rate is unchanged (0.28%). Your manager asks what the data actually says. You go back and look at where the 502s originate.", he: "אחרי 30 דקות קצב ה-502 לא השתנה (0.28%). המנהל שלך שואל מה הנתונים באמת אומרים. אתה חוזר לבדוק מאיפה ה-502 מגיעים." },
      choices: [
        { label: { en: "Compare ELB vs target metrics and open the ALB access logs", he: "להשוות metrics של ELB מול target ולפתוח את ה-access logs של ה-ALB" }, next: "s2", score: 5, feedback: { en: "Better late than never — always split LB-generated from target-generated errors first.", he: "עדיף מאוחר מאשר אף פעם — תמיד מפרידים קודם בין שגיאות שה-LB ייצר לשגיאות שה-target ייצר." } }
      ]
    },
    s2: {
      text: { en: "You query the ALB access logs in Athena for the 502 lines. What stands out?", he: "אתה מריץ שאילתה ב-Athena על ה-access logs של ה-ALB עבור שורות ה-502. מה בולט?" },
      data: "type time                        elb  client:port        target:port       req_t  target_t  resp_t  elb_status target_status\nhttps 2026-11-10T14:12:07.913Z app/prod 203.0.113.7:51544 10.0.42.17:3000  0.000  -1        -1      502        -\nhttps 2026-11-10T14:12:31.004Z app/prod 198.51.100.9:6021 10.0.43.88:3000  0.001  -1        -1      502        -\nhttps 2026-11-10T14:13:02.551Z app/prod 192.0.2.44:40210  10.0.41.5:3000   0.000  -1        -1      502        -\n-- 502s spread evenly across all 6 targets; 0 rows with target_status_code = 5xx",
      choices: [
        { label: { en: "target_status '-' and -1 processing times: the target closed the connection before answering. Check connection timeouts on both sides", he: "‏target_status '-' וזמני עיבוד של -1: ה-target סגר את החיבור לפני שענה. לבדוק את ה-timeouts של החיבור בשני הצדדים" }, next: "s3", score: 10, feedback: { en: "Exactly. AWS documents this pattern as the target closing (FIN/RST) a connection the ALB had an outstanding request on.", he: "בדיוק. ‏AWS מתעדים את הדפוס הזה כ-target שסוגר (FIN/RST) חיבור שעליו ל-ALB הייתה בקשה פתוחה." } },
        { label: { en: "One target must be bad — drain 10.0.42.17", he: "‏target אחד כנראה תקול — לעשות drain ל-10.0.42.17" }, next: "s3", score: 0, feedback: { en: "You drain it and 502s continue on the other five at the same rate — they were spread evenly across all targets. It's systemic: the connection fails, not one Pod.", he: "עשית drain וה-502 ממשיכים על החמישה האחרים באותו קצב — הם היו מפוזרים באופן שווה על כל ה-targets. זה מערכתי: החיבור נכשל, לא Pod אחד." } }
      ]
    },
    s3: {
      text: { en: "You compare timeouts. The ALB's idle timeout and the Node server's settings:", he: "אתה משווה timeouts. ה-idle timeout של ה-ALB וההגדרות של שרת ה-Node:" },
      data: "$ aws elbv2 describe-load-balancer-attributes --load-balancer-arn $ALB \\\n    --query \"Attributes[?Key=='idle_timeout.timeout_seconds']\"\n[ { \"Key\": \"idle_timeout.timeout_seconds\", \"Value\": \"60\" } ]\n\n$ kubectl exec deploy/checkout-api -- node -e \"const s=require('http').createServer();console.log(s.keepAliveTimeout)\"\n5000\n\n$ grep -n keepAlive src/server.ts\n(no results)   # Express 5 app.listen(3000), Node defaults",
      choices: [
        { label: { en: "Node closes idle connections after 5 s, the ALB reuses them for up to 60 s → race. Raise keepAliveTimeout to 65 s and headersTimeout to 66 s", he: "‏Node סוגר חיבורים idle אחרי 5 s, וה-ALB משתמש בהם עד 60 s → מרוץ. להעלות keepAliveTimeout ל-65 s ו-headersTimeout ל-66 s" }, next: "s4", score: 10, feedback: { en: "That's the root cause: the upstream must keep idle connections longer than the proxy.", he: "זה ה-root cause: ה-upstream חייב להחזיק חיבורים idle יותר זמן מה-proxy." } },
        { label: { en: "Lower the ALB idle timeout to 4 s so the ALB always closes first", he: "להוריד את ה-idle timeout של ה-ALB ל-4 s כדי שה-ALB תמיד יסגור ראשון" }, next: "s4", score: 5, feedback: { en: "It technically fixes the race, but also cuts client keep-alive and kills long requests/WebSockets idle > 4 s. Fix the server instead.", he: "טכנית זה פותר את המרוץ, אבל גם מקצר את ה-keep-alive מול הלקוחות והורג בקשות ארוכות או WebSockets שהם idle יותר מ-4 s. עדיף לתקן את השרת." } },
        { label: { en: "Add client-side retries on 502 and close the ticket", he: "להוסיף retries בצד הלקוח על 502 ולסגור את הטיקט" }, next: "lose", score: 0, feedback: { en: "Retrying a non-idempotent checkout POST can double-charge, and the root cause stays.", he: "‏retry ל-POST של checkout שאינו אידמפוטנטי יכול לחייב פעמיים, וה-root cause נשאר." } }
      ]
    },
    s4: {
      text: { en: "You ship the fix behind a normal rollout. During the rollout itself you notice a short burst of 502s again. Why, and what do you check?", he: "אתה מעלה את התיקון ב-rollout רגיל. בזמן ה-rollout עצמו אתה רואה שוב פרץ קצר של 502. למה, ומה אתה בודק?" },
      data: "server.keepAliveTimeout = 65_000;\nserver.headersTimeout   = 66_000;\n\nrollout 14:52-14:55: HTTPCode_ELB_502_Count  31 (all at Pod terminations)\nDockerfile: CMD [\"npm\", \"start\"]",
      choices: [
        { label: { en: "Pods die without draining: npm doesn't forward SIGTERM. Switch to CMD [\"node\",\"dist/server.js\"], add a SIGTERM handler (fail readiness, wait, server.close) and a preStop sleep", he: "ה-Pod-ים מתים בלי drain: ‏npm לא מעביר SIGTERM. לעבור ל-CMD [\"node\",\"dist/server.js\"], להוסיף handler ל-SIGTERM (להכשיל readiness, לחכות, ‏server.close) ו-preStop sleep" }, next: "win", score: 10, feedback: { en: "Now both 502 sources are gone: idle-close races and connections cut during termination.", he: "עכשיו שני מקורות ה-502 נעלמו: מרוצי סגירת idle וחיבורים שנחתכים בזמן termination." } },
        { label: { en: "Ignore it — rollouts always drop a few requests", he: "להתעלם — ‏rollouts תמיד מפילים כמה בקשות" }, next: "lose", score: 0, feedback: { en: "They don't have to. Every deploy will keep paging someone for a fixable reason.", he: "זה לא חייב להיות ככה. כל deploy ימשיך להעיר מישהו בגלל סיבה שאפשר לתקן." } }
      ]
    },
    win: {
      text: { en: "24 hours later: HTTPCode_ELB_502_Count = 0, including through two deploys. You write the postmortem: root cause = Node's 5 s keepAliveTimeout below the ALB's 60 s idle timeout; contributing = npm as PID 1 swallowing SIGTERM. Action items: a shared server bootstrap that sets keep-alive and shutdown for every Node service, an alert on ELB_502 vs Target_5XX divergence, and a checklist item for uvicorn/gunicorn services too.", he: "אחרי 24 שעות: ‏HTTPCode_ELB_502_Count = ‏0, כולל במהלך שני deploys. אתה כותב postmortem: ‏root cause = ה-keepAliveTimeout של 5 s ב-Node מתחת ל-idle timeout של 60 s ב-ALB; גורם תורם = ‏npm כ-PID 1 שבולע את ה-SIGTERM. משימות המשך: ‏bootstrap משותף לשרת שמגדיר keep-alive ו-shutdown לכל שירותי ה-Node, התראה על פער בין ELB_502 ל-Target_5XX, וסעיף ב-checklist גם לשירותי uvicorn ו-gunicorn." },
      end: "win"
    },
    lose: {
      text: { en: "A week later the 502s are still there, a few customers were double-charged by retried POSTs, and the incident is reopened. The lesson: when the LB generates errors the app never saw, compare connection timeouts on both sides — the upstream must outlive the proxy's idle timeout — and make shutdown graceful.", he: "שבוע אחרי, ה-502 עדיין שם, כמה לקוחות חויבו פעמיים בגלל POSTs שנשלחו שוב, והאירוע נפתח מחדש. הלקח: כשה-LB מייצר שגיאות שהאפליקציה אף פעם לא ראתה, משווים timeouts של חיבור בשני הצדדים — ה-upstream חייב לחיות יותר מה-idle timeout של ה-proxy — ודואגים ל-shutdown מסודר." },
      end: "lose"
    }
  },
  lessons: ["node-web-frameworks", "web-service-production-checklist", "k8s-probes", "processes-linux"]
});
