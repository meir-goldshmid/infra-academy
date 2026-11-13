window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — integration: idempotency, connecting systems, queue kinds, rate limiters, 3rd-party dependencies */

INFRA.lessons.push({
  id: "pr-idempotency",
  track: "principal",
  order: 20,
  icon: "🔁",
  level: 3,
  minutes: 15,
  title: { en: "Idempotency: Making Retries Safe", he: "אידמפוטנטיות: איך הופכים retries לבטוחים" },
  tldr: {
    en: "Networks force you to retry, and retries duplicate work — so every operation that changes state must be safe to run twice: same key, same effect, same answer.",
    he: "הרשת מכריחה אותך לעשות retry, ו-retry משכפל עבודה — לכן כל פעולה שמשנה state חייבת להיות בטוחה להרצה כפולה: אותו key, אותה השפעה, אותה תשובה."
  },
  analogy: {
    en: "An elevator button is idempotent: press it once or ten times, one elevator comes. A vending machine is not: press 'buy' twice and you get two cans and pay twice. Idempotency engineering is turning every vending machine in your system into an elevator button — usually by writing a receipt number on each request, so the machine says 'I already served receipt #8812, here's the same can again' instead of charging you twice.",
    he: "כפתור מעלית הוא אידמפוטנטי: לוחצים פעם אחת או עשר פעמים — מגיעה מעלית אחת. מכונת שתייה היא לא: לוחצים 'קנה' פעמיים ומקבלים שתי פחיות ומשלמים פעמיים. הנדסת אידמפוטנטיות זה להפוך כל מכונת שתייה במערכת לכפתור מעלית — בדרך כלל ע\"י מספר קבלה על כל בקשה, כך שהמכונה אומרת 'כבר טיפלתי בקבלה 8812, הנה אותה פחית שוב' במקום לחייב פעמיים."
  },
  sections: [
    {
      h: { en: "What idempotent really means (and why retries make it mandatory)", he: "מה זה באמת אידמפוטנטי (ולמה retries הופכים את זה לחובה)" },
      body: {
        en: `<p>Mathematically, <code>f</code> is idempotent if <code>f(f(x)) = f(x)</code>: <code>abs()</code>, <code>max(x, 5)</code>, "set to 7". Not idempotent: "add 1", "append", "send". In systems: <strong>executing a request N ≥ 1 times leaves the same server state as executing it once</strong>. (The response may differ — a second DELETE may return 404 — the <em>state</em> must not.)</p>
<table>
<tr><th>HTTP method</th><th>Safe (no state change)</th><th>Idempotent by spec</th><th>Example</th></tr>
<tr><td>GET / HEAD / OPTIONS</td><td>✅</td><td>✅</td><td>read an order</td></tr>
<tr><td>PUT</td><td>❌</td><td>✅</td><td>replace order 81 with this full body</td></tr>
<tr><td>DELETE</td><td>❌</td><td>✅</td><td>delete order 81</td></tr>
<tr><td>POST</td><td>❌</td><td>❌</td><td>create a payment</td></tr>
<tr><td>PATCH</td><td>❌</td><td>❌ (depends)</td><td><code>{"op":"increment"}</code> is not; <code>{"status":"PAID"}</code> is</td></tr>
</table>
<p>Why it's mandatory: a client sends <code>POST /payments</code>, the server charges the card, and the response is lost (timeout, LB reset, pod killed). The client <em>cannot know</em> whether it worked — the "two generals" problem. It has two options: give up (maybe lose money) or retry (maybe charge twice). Idempotency makes retry the safe answer. Every layer retries: browsers, SDKs, service meshes (Envoy retries 5xx), load balancers, Kafka consumers after a rebalance, Lambda on error, SQS after visibility timeout. If you didn't design for duplicates, you already have them.</p>
<blockquote>💡 Real world: at-least-once delivery + idempotent processing = <strong>effectively-once</strong>. That's how every serious payment, ledger and messaging system works — true exactly-once delivery across a network doesn't exist (see <code>#/lesson/staff-exactly-once</code>).</blockquote>`,
        he: `<p>מתמטית, <code>f</code> אידמפוטנטית אם <code>f(f(x)) = f(x)</code>: <code>abs()</code>, <code>max(x, 5)</code>, "קבע ל-7". לא אידמפוטנטי: "הוסף 1", "append", "שלח". במערכות: <strong>הרצת בקשה N ≥ 1 פעמים משאירה את השרת באותו state כמו הרצה אחת</strong>. (התשובה יכולה להיות שונה — DELETE שני יכול להחזיר 404 — ה-<em>state</em> לא.)</p>
<table>
<tr><th>HTTP method</th><th>Safe (בלי שינוי state)</th><th>אידמפוטנטי לפי ה-spec</th><th>דוגמה</th></tr>
<tr><td>GET / HEAD / OPTIONS</td><td>✅</td><td>✅</td><td>קריאת הזמנה</td></tr>
<tr><td>PUT</td><td>❌</td><td>✅</td><td>להחליף את הזמנה 81 בגוף המלא הזה</td></tr>
<tr><td>DELETE</td><td>❌</td><td>✅</td><td>למחוק את הזמנה 81</td></tr>
<tr><td>POST</td><td>❌</td><td>❌</td><td>ליצור תשלום</td></tr>
<tr><td>PATCH</td><td>❌</td><td>❌ (תלוי)</td><td><code>{"op":"increment"}</code> לא; <code>{"status":"PAID"}</code> כן</td></tr>
</table>
<p>למה זו חובה: client שולח <code>POST /payments</code>, השרת מחייב את הכרטיס, והתשובה הולכת לאיבוד (timeout, reset ב-LB, pod שנהרג). ה-client <em>לא יכול לדעת</em> אם זה הצליח — בעיית "שני הגנרלים". יש לו שתי אפשרויות: לוותר (אולי להפסיד כסף) או retry (אולי לחייב פעמיים). אידמפוטנטיות הופכת את ה-retry לתשובה הבטוחה. כל שכבה עושה retry: דפדפנים, SDKs, service mesh (Envoy עושה retry על 5xx), load balancers, Kafka consumers אחרי rebalance, Lambda בשגיאה, SQS אחרי visibility timeout. אם לא תכננתם לכפילויות — כבר יש לכם אותן.</p>
<blockquote>💡 מהשטח: at-least-once delivery + עיבוד אידמפוטנטי = <strong>effectively-once</strong>. ככה עובדת כל מערכת תשלומים, ledger או messaging רצינית — exactly-once delivery אמיתי על פני רשת לא קיים (ראו <code>#/lesson/staff-exactly-once</code>).</blockquote>`
      }
    },
    {
      h: { en: "Idempotency keys: the Stripe pattern, implemented end to end", he: "Idempotency keys: התבנית של Stripe, מימוש מקצה לקצה" },
      body: {
        en: `<p>For operations that are naturally non-idempotent (create payment, send SMS), the <strong>client</strong> generates a unique key (UUIDv4/v7) per <em>logical</em> operation and sends it on every retry: <code>Idempotency-Key: 7b3f...</code>. The server records the key and the outcome; a repeat returns the stored response instead of re-executing.</p>
<pre>CREATE TABLE idempotency_keys (
  account_id    bigint      NOT NULL,
  idem_key      text        NOT NULL,
  request_hash  text        NOT NULL,          -- sha256 of method+path+body
  status        text        NOT NULL,          -- 'in_progress' | 'completed'
  response_code int,
  response_body jsonb,
  locked_until  timestamptz,                   -- crash recovery for in_progress
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, idem_key)           -- scope keys per tenant!
);
CREATE INDEX ON idempotency_keys (created_at); -- for TTL cleanup (e.g. 24h)</pre>
<p>Server algorithm:</p>
<ol>
<li><code>INSERT ... (status='in_progress', locked_until=now()+30s) ON CONFLICT DO NOTHING RETURNING *</code>.</li>
<li>Inserted → you own it. Do the work; in the <em>same DB transaction</em> as the business write, update the row to <code>completed</code> with the response. Return it.</li>
<li>Conflict → read the existing row:
  <ul><li><code>request_hash</code> differs → <strong>422</strong> "key reused with a different body" (client bug).</li>
  <li><code>completed</code> → replay the stored code + body (add header <code>Idempotent-Replayed: true</code>).</li>
  <li><code>in_progress</code> and lock not expired → <strong>409 Conflict</strong> "request in flight, retry later" (concurrent duplicate — e.g. a double-click).</li>
  <li><code>in_progress</code> and lock expired → previous worker crashed; take over with <code>UPDATE ... WHERE locked_until &lt; now()</code>.</li></ul></li>
</ol>
<p>If the work calls an external system (card network), pass the key <em>downstream</em> too (Stripe, Adyen, PayPal all accept one) — your idempotency is only as strong as the weakest hop.</p>
<blockquote>⚠️ Production tip: store failures carefully. Cache <strong>4xx</strong> validation errors (deterministic), but do <em>not</em> cache <strong>5xx</strong>/timeouts as final — release the key so a retry can actually retry. Stripe keeps keys 24h; pick a TTL longer than your clients' max retry window.</blockquote>`,
        he: `<p>לפעולות שמטבען לא אידמפוטנטיות (יצירת תשלום, שליחת SMS), ה-<strong>client</strong> מייצר key ייחודי (UUIDv4/v7) לכל פעולה <em>לוגית</em> ושולח אותו בכל retry: <code>Idempotency-Key: 7b3f...</code>. השרת שומר את ה-key ואת התוצאה; בקשה חוזרת מקבלת את התשובה השמורה במקום הרצה מחדש.</p>
<pre>CREATE TABLE idempotency_keys (
  account_id    bigint      NOT NULL,
  idem_key      text        NOT NULL,
  request_hash  text        NOT NULL,          -- sha256 of method+path+body
  status        text        NOT NULL,          -- 'in_progress' | 'completed'
  response_code int,
  response_body jsonb,
  locked_until  timestamptz,                   -- crash recovery for in_progress
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, idem_key)           -- scope keys per tenant!
);
CREATE INDEX ON idempotency_keys (created_at); -- for TTL cleanup (e.g. 24h)</pre>
<p>האלגוריתם בשרת:</p>
<ol>
<li><code>INSERT ... (status='in_progress', locked_until=now()+30s) ON CONFLICT DO NOTHING RETURNING *</code>.</li>
<li>הוכנס → הוא שלך. מבצעים את העבודה; <em>באותה טרנזקציה</em> של הכתיבה העסקית מעדכנים את השורה ל-<code>completed</code> עם התשובה, ומחזירים.</li>
<li>Conflict → קוראים את השורה הקיימת:
  <ul><li><code>request_hash</code> שונה → <strong>422</strong> "key שומש עם body אחר" (באג אצל ה-client).</li>
  <li><code>completed</code> → מחזירים את הקוד וה-body השמורים (עם header <code>Idempotent-Replayed: true</code>).</li>
  <li><code>in_progress</code> וה-lock עוד בתוקף → <strong>409 Conflict</strong> "בקשה בטיפול, נסו שוב" (כפילות במקביל — למשל double-click).</li>
  <li><code>in_progress</code> וה-lock פג → ה-worker הקודם קרס; משתלטים עם <code>UPDATE ... WHERE locked_until &lt; now()</code>.</li></ul></li>
</ol>
<p>אם העבודה קוראת למערכת חיצונית (רשת כרטיסי אשראי), מעבירים את ה-key גם <em>הלאה</em> (Stripe, Adyen, PayPal כולם מקבלים כזה) — האידמפוטנטיות שלכם חזקה רק כמו ה-hop החלש ביותר.</p>
<blockquote>⚠️ טיפ לפרודקשן: תיזהרו בשמירת כשלונות. שומרים שגיאות <strong>4xx</strong> של ולידציה (דטרמיניסטיות), אבל <em>לא</em> שומרים <strong>5xx</strong>/timeouts כסופיים — משחררים את ה-key כדי ש-retry באמת ינסה שוב. Stripe שומרים keys ל-24 שעות; בחרו TTL ארוך מחלון ה-retry המקסימלי של ה-clients.</blockquote>`
      }
    },
    {
      h: { en: "Natural idempotency: design it in instead of bolting it on", he: "אידמפוטנטיות טבעית: לתכנן אותה מראש במקום להדביק אחר כך" },
      body: {
        en: `<p>The cheapest idempotency needs no key table — the operation itself is shaped to be repeatable:</p>
<ul>
<li><strong>Set, don't increment.</strong> <code>UPDATE accounts SET balance = 70</code> is idempotent; <code>balance = balance - 30</code> is not. For counters, record the <em>event</em> with a unique id and derive the sum.</li>
<li><strong>Upsert with a natural/business key.</strong> <code>INSERT INTO orders (order_ref, ...) VALUES ('web-2026-11-13-8812', ...) ON CONFLICT (order_ref) DO NOTHING</code>. Let the client choose the id (UUID) so a retry hits the same row.</li>
<li><strong>Conditional writes / optimistic concurrency.</strong> HTTP: <code>If-Match: "v7"</code> → <code>412 Precondition Failed</code> if changed. SQL: <code>UPDATE ... SET status='SHIPPED', version=8 WHERE id=81 AND version=7</code>. DynamoDB: <code>ConditionExpression</code>. S3: <code>If-None-Match: *</code> to create-only.</li>
<li><strong>State machines.</strong> Transitions are naturally idempotent if you check the current state: "mark PAID" when already PAID → no-op, return 200.</li>
<li><strong>Deterministic ids for side effects.</strong> Email id = <code>hash(user_id, "welcome")</code>; the mail queue dedupes on it. Kafka producer <code>enable.idempotence=true</code> dedupes broker-side per producer/partition/sequence.</li>
</ul>
<pre>-- consumer-side dedupe ("inbox"): side effect + dedupe in ONE transaction
BEGIN;
INSERT INTO processed_events (consumer, event_id) VALUES ('billing', '6f1c...')
  ON CONFLICT DO NOTHING;           -- 0 rows inserted =&gt; duplicate =&gt; ROLLBACK &amp; ack
UPDATE invoices SET status='PAID' WHERE id = 'inv-9';
COMMIT;                             -- then ack the message</pre>
<blockquote>💡 Real world: webhook receivers (Stripe, GitHub, Twilio) must assume duplicates — providers retry for up to 3 days. Store the provider's event id (<code>evt_1N...</code>) with a unique constraint and return 200 quickly on repeats.</blockquote>`,
        he: `<p>האידמפוטנטיות הכי זולה לא צריכה טבלת keys — הפעולה עצמה מעוצבת כך שאפשר לחזור עליה:</p>
<ul>
<li><strong>Set, לא increment.</strong> <code>UPDATE accounts SET balance = 70</code> אידמפוטנטי; <code>balance = balance - 30</code> לא. למונים — רושמים את ה-<em>event</em> עם id ייחודי וגוזרים את הסכום.</li>
<li><strong>Upsert עם business key.</strong> <code>INSERT INTO orders (order_ref, ...) VALUES ('web-2026-11-13-8812', ...) ON CONFLICT (order_ref) DO NOTHING</code>. נותנים ל-client לבחור את ה-id (UUID) כדי ש-retry יפגע באותה שורה.</li>
<li><strong>Conditional writes / optimistic concurrency.</strong> HTTP: <code>If-Match: "v7"</code> → <code>412 Precondition Failed</code> אם השתנה. SQL: <code>UPDATE ... SET status='SHIPPED', version=8 WHERE id=81 AND version=7</code>. DynamoDB: <code>ConditionExpression</code>. S3: <code>If-None-Match: *</code> ליצירה בלבד.</li>
<li><strong>State machines.</strong> מעברים אידמפוטנטיים באופן טבעי אם בודקים את המצב הנוכחי: "סמן PAID" כשכבר PAID → no-op, מחזירים 200.</li>
<li><strong>IDs דטרמיניסטיים ל-side effects.</strong> מזהה מייל = <code>hash(user_id, "welcome")</code>; תור המיילים עושה dedupe עליו. ב-Kafka, producer עם <code>enable.idempotence=true</code> עושה dedupe בצד ה-broker לפי producer/partition/sequence.</li>
</ul>
<pre>-- consumer-side dedupe ("inbox"): side effect + dedupe in ONE transaction
BEGIN;
INSERT INTO processed_events (consumer, event_id) VALUES ('billing', '6f1c...')
  ON CONFLICT DO NOTHING;           -- 0 rows inserted =&gt; duplicate =&gt; ROLLBACK &amp; ack
UPDATE invoices SET status='PAID' WHERE id = 'inv-9';
COMMIT;                             -- then ack the message</pre>
<blockquote>💡 מהשטח: מקבלי webhooks (Stripe, GitHub, Twilio) חייבים להניח כפילויות — הספקים עושים retry עד 3 ימים. שומרים את ה-event id של הספק (<code>evt_1N...</code>) עם unique constraint ומחזירים 200 מהר על חזרות.</blockquote>`
      }
    },
    {
      h: { en: "Retrying correctly: backoff, jitter, budgets", he: "לעשות retry נכון: backoff, jitter ו-budgets" },
      body: {
        en: `<p>Idempotency makes retries <em>safe</em>; backoff makes them <em>polite</em>. Naive immediate retries turn a 1-second blip into a self-inflicted DDoS (retry storm). Rules:</p>
<ul>
<li>Retry only <strong>transient</strong> errors: timeouts, connection reset, 429, 502/503/504. Never retry 400/401/403/404/422.</li>
<li><strong>Exponential backoff with full jitter</strong>: sleep = random(0, min(cap, base × 2^attempt)). Jitter spreads clients so they don't retry in lockstep.</li>
<li>Cap attempts (3–5) and total time (a deadline), and honor <code>Retry-After</code>.</li>
<li><strong>Retry in one layer only.</strong> 3 retries at each of 4 layers = 4^4 = 256 calls to the bottom service. Use a retry budget (e.g. Envoy/Finagle: retries ≤ 10–20% of requests).</li>
</ul>
<pre>import random, time, uuid, requests

def create_payment(body, max_attempts=5, base=0.2, cap=5.0):
    key = str(uuid.uuid4())                  # ONE key for all attempts of this logical op
    for attempt in range(max_attempts):
        try:
            r = requests.post("https://api.example.com/v1/payments", json=body,
                              headers={"Idempotency-Key": key}, timeout=(1, 5))
            if r.status_code &lt; 500 and r.status_code not in (409, 429):
                return r                     # success or permanent error
            retry_after = float(r.headers.get("Retry-After", 0))
        except (requests.ConnectionError, requests.Timeout):
            retry_after = 0
        sleep = max(retry_after, random.uniform(0, min(cap, base * 2 ** attempt)))
        time.sleep(sleep)
    raise RuntimeError("gave up; safe to retry later with key " + key)</pre>
<blockquote>⚠️ Production tip: the #1 idempotency bug is generating the key <em>inside</em> the retry loop (new key per attempt = no protection). Second: generating it on the server. The key must be born where the user intent is born — the client, or the upstream message id.</blockquote>`,
        he: `<p>אידמפוטנטיות הופכת retries ל<em>בטוחים</em>; backoff הופך אותם ל<em>מנומסים</em>. retries מיידיים ונאיביים הופכים תקלה של שנייה ל-DDoS עצמי (retry storm). כללים:</p>
<ul>
<li>עושים retry רק לשגיאות <strong>זמניות</strong>: timeouts, connection reset, 429, 502/503/504. אף פעם לא ל-400/401/403/404/422.</li>
<li><strong>Exponential backoff עם full jitter</strong>: sleep = random(0, min(cap, base × 2^attempt)). ה-jitter מפזר את ה-clients כדי שלא ינסו שוב באותו רגע.</li>
<li>מגבילים מספר ניסיונות (3–5) וזמן כולל (deadline), ומכבדים <code>Retry-After</code>.</li>
<li><strong>Retry בשכבה אחת בלבד.</strong> 3 retries בכל אחת מ-4 שכבות = 4^4 = 256 קריאות לשירות התחתון. משתמשים ב-retry budget (למשל Envoy/Finagle: retries ≤ 10–20% מהבקשות).</li>
</ul>
<pre>import random, time, uuid, requests

def create_payment(body, max_attempts=5, base=0.2, cap=5.0):
    key = str(uuid.uuid4())                  # ONE key for all attempts of this logical op
    for attempt in range(max_attempts):
        try:
            r = requests.post("https://api.example.com/v1/payments", json=body,
                              headers={"Idempotency-Key": key}, timeout=(1, 5))
            if r.status_code &lt; 500 and r.status_code not in (409, 429):
                return r                     # success or permanent error
            retry_after = float(r.headers.get("Retry-After", 0))
        except (requests.ConnectionError, requests.Timeout):
            retry_after = 0
        sleep = max(retry_after, random.uniform(0, min(cap, base * 2 ** attempt)))
        time.sleep(sleep)
    raise RuntimeError("gave up; safe to retry later with key " + key)</pre>
<blockquote>⚠️ טיפ לפרודקשן: באג האידמפוטנטיות מספר 1 הוא לייצר את ה-key <em>בתוך</em> לולאת ה-retry (key חדש בכל ניסיון = אפס הגנה). מספר 2: לייצר אותו בשרת. ה-key חייב להיוולד איפה שנולדת כוונת המשתמש — ב-client, או ב-message id של ה-upstream.</blockquote>`
      }
    },
    {
      h: { en: "Worked examples: payments, emails, jobs", he: "דוגמאות: תשלומים, מיילים, jobs" },
      body: {
        en: `<table>
<tr><th>Operation</th><th>Duplicate hurts how?</th><th>Idempotency technique</th></tr>
<tr><td>Charge a card</td><td>Double charge, chargebacks, angry users</td><td>Client Idempotency-Key + pass key to PSP + unique (order_id) on payments</td></tr>
<tr><td>Send welcome email</td><td>Annoying, spam complaints</td><td>Deterministic message id <code>welcome:{user_id}</code> + unique constraint in <code>sent_emails</code></td></tr>
<tr><td>Kafka consumer updates balance</td><td>Wrong money</td><td>Inbox table keyed by event id in the same transaction</td></tr>
<tr><td>Nightly report job</td><td>Two files, double cost</td><td>Job key <code>report:2026-11-13</code> + lock/lease; output path is deterministic (overwrite)</td></tr>
<tr><td>Provision a VM</td><td>Orphan VMs and cost</td><td>Client token (AWS <code>ClientToken</code> on RunInstances) + tag-based reconciliation</td></tr>
<tr><td>Terraform / k8s apply</td><td>—</td><td>Declarative desired state is idempotent by design: apply twice, nothing changes</td></tr>
</table>
<blockquote>💡 Real world: the deepest lesson of Kubernetes and Terraform is that <strong>declarative + reconcile loops are idempotent by construction</strong>. When you design a control plane, prefer "make it so" (desired state) over "do this" (imperative commands).</blockquote>`,
        he: `<table>
<tr><th>פעולה</th><th>מה כפילות עושה?</th><th>טכניקת אידמפוטנטיות</th></tr>
<tr><td>חיוב כרטיס</td><td>חיוב כפול, chargebacks, משתמשים כועסים</td><td>Idempotency-Key מה-client + העברת ה-key ל-PSP + unique (order_id) בטבלת payments</td></tr>
<tr><td>מייל ברוכים הבאים</td><td>מעצבן, תלונות spam</td><td>message id דטרמיניסטי <code>welcome:{user_id}</code> + unique constraint ב-<code>sent_emails</code></td></tr>
<tr><td>Kafka consumer מעדכן יתרה</td><td>כסף שגוי</td><td>טבלת inbox לפי event id באותה טרנזקציה</td></tr>
<tr><td>Job דוח לילי</td><td>שני קבצים, עלות כפולה</td><td>Job key <code>report:2026-11-13</code> + lock/lease; נתיב פלט דטרמיניסטי (overwrite)</td></tr>
<tr><td>הקמת VM</td><td>VMs יתומים ועלות</td><td>Client token (ב-AWS: <code>ClientToken</code> ב-RunInstances) + reconciliation לפי tags</td></tr>
<tr><td>Terraform / k8s apply</td><td>—</td><td>Desired state דקלרטיבי אידמפוטנטי מעצם הגדרתו: apply פעמיים, שום דבר לא משתנה</td></tr>
</table>
<blockquote>💡 מהשטח: השיעור הכי עמוק של Kubernetes ו-Terraform הוא ש-<strong>דקלרטיבי + reconcile loops = אידמפוטנטי מעצם המבנה</strong>. כשאתם מתכננים control plane, תעדיפו "תדאג שזה יהיה ככה" (desired state) על פני "תעשה את זה" (פקודות אימפרטיביות).</blockquote>`
      }
    }
  ],
  diagram: `client ──POST /payments  Idempotency-Key: K──▶ API
                                              │
                    INSERT key K (in_progress) ON CONFLICT?
                         │ new                      │ exists
                         ▼                          ▼
              charge PSP (pass K) ─▶ save    completed? ─▶ replay stored 201
              UPDATE K = completed+resp     in_progress? ─▶ 409 retry later
                         │                  body differs? ─▶ 422
                         ▼
                  201 {payment_id}   ✖ response lost ─▶ client retries with SAME K`,
  handsOn: [
    { cmd: `curl -X POST https://api.stripe.com/v1/payment_intents -u sk_test_xxx: -H "Idempotency-Key: 3f0c6e5a-2d7b-4f7e-9a51-1b2c3d4e5f60" -d amount=2000 -d currency=usd`,
      what: { en: "Run it twice with the same key against Stripe's test mode: the second response is identical (same id) and carries the header Idempotent-Replayed: true.", he: "הריצו פעמיים עם אותו key מול ה-test mode של Stripe: התשובה השנייה זהה (אותו id) ומגיעה עם header ‏Idempotent-Replayed: true." } },
    { cmd: `psql -c "INSERT INTO idempotency_keys(account_id,idem_key,request_hash,status) VALUES (1,'k1','h','in_progress') ON CONFLICT DO NOTHING RETURNING idem_key;"`,
      what: { en: "Run twice: first returns the row (you own it), second returns 0 rows (duplicate). That one line is the heart of the pattern.", he: "הריצו פעמיים: הראשונה מחזירה את השורה (היא שלכם), השנייה מחזירה 0 שורות (כפילות). השורה הזאת היא לב התבנית." } },
    { cmd: `redis-cli SET idem:acct1:k1 in_progress NX EX 86400`,
      what: { en: "Redis variant: SET NX returns OK only for the first caller, (nil) for duplicates; EX gives a 24h TTL. Good for dedupe, but not transactional with your DB write.", he: "גרסת Redis: ‏SET NX מחזיר OK רק לקורא הראשון, ו-(nil) לכפילויות; EX נותן TTL של 24 שעות. טוב ל-dedupe, אבל לא טרנזקציוני יחד עם הכתיבה ל-DB." } },
    { cmd: `curl -i -X PUT https://httpbin.org/put -H 'If-Match: "v7"' -d '{"status":"SHIPPED"}'`,
      what: { en: "Shape of a conditional write: real APIs (S3, GCS, Kubernetes resourceVersion, Azure Blob) return 412 if the ETag changed — optimistic concurrency.", he: "הצורה של conditional write: APIs אמיתיים (S3, GCS, ‏resourceVersion של Kubernetes, Azure Blob) מחזירים 412 אם ה-ETag השתנה — optimistic concurrency." } }
  ],
  mnemonic: { en: "\"Same key, same effect, same answer\" — and the key is born with the intent, not with the attempt.", he: "\"אותו key, אותה השפעה, אותה תשובה\" — וה-key נולד עם הכוונה, לא עם הניסיון." },
  pitfalls: [
    { en: "New idempotency key per retry attempt — generated inside the loop or by a middleware. Zero protection; the duplicates look like distinct requests.", he: "Idempotency key חדש בכל ניסיון — שנוצר בתוך הלולאה או ע\"י middleware. אפס הגנה; הכפילויות נראות כמו בקשות שונות." },
    { en: "Checking the dedupe table and doing the side effect in separate transactions (check-then-act race): two concurrent duplicates both see 'not found' and both charge. Use a unique constraint / INSERT ... ON CONFLICT as the lock.", he: "בדיקה בטבלת ה-dedupe וביצוע ה-side effect בטרנזקציות נפרדות (race של check-then-act): שתי כפילויות במקביל רואות 'לא נמצא' ושתיהן מחייבות. השתמשו ב-unique constraint / INSERT ... ON CONFLICT בתור ה-lock." },
    { en: "Caching a 500 or timeout as the final answer for the key — the client can never succeed again with that key.", he: "לשמור 500 או timeout כתשובה הסופית של ה-key — ה-client לא יוכל להצליח עם ה-key הזה לעולם." },
    { en: "Global (unscoped) keys: tenant A's key collides with tenant B's, and A gets B's stored response — a data leak. Scope keys by account.", he: "Keys גלובליים (לא מוגבלים ל-tenant): ה-key של לקוח A מתנגש בשל לקוח B, ו-A מקבל את התשובה השמורה של B — דליפת מידע. מגבילים keys לפי חשבון." }
  ],
  interview: [
    { q: { en: "Design the idempotency layer for a payments API.", he: "תכננו את שכבת האידמפוטנטיות ל-API של תשלומים." },
      a: { en: "Client sends Idempotency-Key per logical payment. Table keyed by (account_id, key) with request hash, status, stored response, lock expiry, 24h TTL. INSERT ON CONFLICT to claim; on conflict replay completed, 409 in-progress, 422 on body mismatch, take over expired locks. Business write + key completion in one transaction. Pass the key to the PSP. Don't persist 5xx as final. Plus a unique constraint on order_id as defense in depth, and reconciliation against the PSP's settlement file nightly.", he: "ה-client שולח Idempotency-Key לכל תשלום לוגי. טבלה לפי (account_id, key) עם hash של הבקשה, סטטוס, תשובה שמורה, תוקף lock ו-TTL של 24 שעות. ‏INSERT ON CONFLICT כדי לתפוס; ב-conflict — replay אם completed, ‏409 אם in-progress, ‏422 אם ה-body שונה, השתלטות על locks שפגו. הכתיבה העסקית וסגירת ה-key בטרנזקציה אחת. מעבירים את ה-key ל-PSP. לא שומרים 5xx כסופי. בנוסף unique constraint על order_id כהגנה נוספת, ו-reconciliation לילי מול קובץ ה-settlement של ה-PSP." } },
    { q: { en: "Is DELETE idempotent if the second call returns 404?", he: "האם DELETE אידמפוטנטי אם הקריאה השנייה מחזירה 404?" },
      a: { en: "Yes. Idempotency is about server state, not the response code. After one or many DELETEs, the resource is gone. Many APIs return 204 for both to make client logic simpler.", he: "כן. אידמפוטנטיות מתייחסת ל-state בשרת, לא לקוד התשובה. אחרי DELETE אחד או הרבה — המשאב לא קיים. הרבה APIs מחזירים 204 בשני המקרים כדי לפשט את הלוגיקה אצל ה-client." } },
    { q: { en: "Your Kafka consumer sends emails. How do you avoid duplicates after rebalances?", he: "ה-Kafka consumer שלכם שולח מיילים. איך נמנעים מכפילויות אחרי rebalance?" },
      a: { en: "Accept at-least-once. Derive a deterministic email id from the event id; record it with a unique constraint before/with sending (outbox to the mail provider) and pass it as the provider's idempotency key/message-id. Commit offsets after processing. Duplicates then become no-ops.", he: "מקבלים at-least-once. גוזרים email id דטרמיניסטי מה-event id; רושמים אותו עם unique constraint לפני/יחד עם השליחה (outbox לספק המייל) ומעבירים אותו כ-idempotency key/message-id לספק. עושים commit ל-offsets אחרי העיבוד. ככה כפילויות הופכות ל-no-ops." } }
  ],
  quiz: [
    { q: { en: "Which HTTP methods are idempotent by specification?", he: "אילו HTTP methods אידמפוטנטיים לפי ה-spec?" },
      options: [ { en: "POST and PATCH", he: "POST ו-PATCH" }, { en: "GET, PUT, DELETE (and HEAD/OPTIONS)", he: "GET, PUT, DELETE (ו-HEAD/OPTIONS)" }, { en: "Only GET", he: "רק GET" }, { en: "All of them", he: "כולם" } ],
      answer: 1, explain: { en: "GET/HEAD/OPTIONS are safe and idempotent; PUT and DELETE change state but are idempotent; POST and PATCH are not guaranteed.", he: "GET/HEAD/OPTIONS בטוחים ואידמפוטנטיים; PUT ו-DELETE משנים state אבל אידמפוטנטיים; POST ו-PATCH לא מובטחים." } },
    { q: { en: "Where should an idempotency key be generated?", he: "איפה צריך לייצר idempotency key?" },
      options: [ { en: "By the server on each request", he: "בשרת בכל בקשה" }, { en: "Inside the client's retry loop, per attempt", he: "בתוך לולאת ה-retry של ה-client, לכל ניסיון" }, { en: "By the client once per logical operation, reused for every retry", he: "ב-client פעם אחת לכל פעולה לוגית, ומשומש בכל retry" }, { en: "By the load balancer", he: "ב-load balancer" } ],
      answer: 2, explain: { en: "The key represents the user's intent; it must stay the same across retries or the server can't recognize duplicates.", he: "ה-key מייצג את כוונת המשתמש; הוא חייב להישאר זהה בין retries, אחרת השרת לא יזהה כפילויות." } },
    { q: { en: "Two identical requests with the same key arrive 5 ms apart while the first is still processing. Best response to the second?", he: "שתי בקשות זהות עם אותו key מגיעות בהפרש 5ms בזמן שהראשונה עוד בעיבוד. מה התשובה הטובה לשנייה?" },
      options: [ { en: "Process it too", he: "לעבד גם אותה" }, { en: "409 Conflict — in flight, retry later", he: "409 Conflict — בטיפול, נסו שוב אחר כך" }, { en: "200 with empty body", he: "200 עם body ריק" }, { en: "500", he: "500" } ],
      answer: 1, explain: { en: "The key row is in_progress with a valid lock; telling the client to retry later avoids double execution and gives it the real result shortly.", he: "שורת ה-key במצב in_progress עם lock בתוקף; להגיד ל-client לנסות שוב מונע ביצוע כפול ונותן לו את התוצאה האמיתית בקרוב." } },
    { q: { en: "Which update is naturally idempotent?", he: "איזה עדכון אידמפוטנטי באופן טבעי?" },
      options: [ { en: "UPDATE stock SET qty = qty - 1", he: "UPDATE stock SET qty = qty - 1" }, { en: "INSERT INTO log VALUES (...) without a key", he: "INSERT INTO log VALUES (...) בלי key" }, { en: "UPDATE orders SET status='PAID' WHERE id=81", he: "UPDATE orders SET status='PAID' WHERE id=81" }, { en: "Sending an SMS", he: "שליחת SMS" } ],
      answer: 2, explain: { en: "Setting an absolute value lands in the same state no matter how many times it runs; decrementing and appending accumulate.", he: "קביעת ערך מוחלט מגיעה לאותו state לא משנה כמה פעמים רצה; הורדה ו-append מצטברים." } }
  ],
  related: ["staff-exactly-once", "arch-resilience", "arch-event-driven", "pr-queue-kinds", "pr-third-party-deps", "pr-integration-styles"]
});

INFRA.lessons.push({
  id: "pr-integration-styles",
  track: "principal",
  order: 21,
  icon: "🔌",
  level: 3,
  minutes: 16,
  title: { en: "Connecting Systems: Integration Styles, Contracts & Versioning", he: "חיבור בין מערכות: סגנונות אינטגרציה, חוזים וגרסאות" },
  tldr: {
    en: "Every link between two systems is a choice of coupling: in time (sync vs async), in data (shared DB vs contract) and in change (who can deploy without asking whom) — pick it on purpose and write the contract down.",
    he: "כל קישור בין שתי מערכות הוא בחירה של צימוד: בזמן (sync מול async), בנתונים (DB משותף מול חוזה) ובשינוי (מי יכול לעשות deploy בלי לשאול את מי) — בוחרים בכוונה ורושמים את החוזה."
  },
  analogy: {
    en: "A phone call (REST/gRPC) needs both people available right now. A letter (queue) waits in the mailbox until you read it. A newsletter subscription (pub/sub, webhooks) arrives without you asking. Checking the mailbox every 5 minutes is polling. Letting your neighbor walk into your kitchen and take what they need is a shared database — convenient until you rearrange the kitchen and they can't find anything. A translator at the border who converts the old country's forms into yours is an anti-corruption layer.",
    he: "שיחת טלפון (REST/gRPC) דורשת ששני הצדדים יהיו זמינים עכשיו. מכתב (תור) מחכה בתיבה עד שתקראו. מנוי לניוזלטר (pub/sub, webhooks) מגיע בלי שתבקשו. לבדוק את תיבת הדואר כל 5 דקות זה polling. לתת לשכן להיכנס למטבח ולקחת מה שהוא צריך זה DB משותף — נוח עד שמסדרים מחדש את המטבח והוא לא מוצא כלום. מתורגמן בגבול שממיר את הטפסים של המדינה הישנה לשלכם זה anti-corruption layer."
  },
  sections: [
    {
      h: { en: "Synchronous request/response: REST vs gRPC vs GraphQL", he: "Request/response סינכרוני: REST מול gRPC מול GraphQL" },
      body: {
        en: `<table>
<tr><th></th><th>REST (JSON over HTTP)</th><th>gRPC (Protobuf over HTTP/2)</th><th>GraphQL</th></tr>
<tr><td>Best for</td><td>Public APIs, CRUD, broad compatibility</td><td>Internal service-to-service, low latency, streaming</td><td>UI clients aggregating many entities</td></tr>
<tr><td>Contract</td><td>OpenAPI (optional, often drifts)</td><td><code>.proto</code> (mandatory, codegen)</td><td>Schema SDL (mandatory, introspectable)</td></tr>
<tr><td>Payload</td><td>Text JSON, verbose</td><td>Binary, 3–10× smaller, faster parse</td><td>JSON, exactly the fields asked</td></tr>
<tr><td>Streaming</td><td>No (use SSE/WebSockets)</td><td>Client, server and bidi streams</td><td>Subscriptions (via WS)</td></tr>
<tr><td>Caching</td><td>Native HTTP caching / CDN</td><td>Hard</td><td>Hard (single POST endpoint)</td></tr>
<tr><td>Browser</td><td>Native</td><td>Needs gRPC-Web proxy</td><td>Native</td></tr>
<tr><td>Pitfalls</td><td>Over/under-fetching, chatty</td><td>Opaque on the wire, LB needs L7 (HTTP/2 multiplexing)</td><td>N+1 resolvers, expensive queries → need depth/cost limits</td></tr>
</table>
<p>Sync calls couple you <strong>in time</strong>: if the callee is down or slow, so are you. Availability multiplies: a request that synchronously touches 5 services at 99.9% each is at most 99.5% available. Latency adds (or is the max, if parallel). So: sync for queries where the user waits for an answer; async for commands whose effects can happen later.</p>
<blockquote>💡 Real world: a common sweet spot is REST/JSON at the edge (public API, partners), gRPC between internal services, GraphQL or a BFF for the web/mobile UI, and events for everything that "should happen after".</blockquote>`,
        he: `<table>
<tr><th></th><th>REST (JSON על HTTP)</th><th>gRPC (Protobuf על HTTP/2)</th><th>GraphQL</th></tr>
<tr><td>הכי טוב ל</td><td>APIs ציבוריים, CRUD, תאימות רחבה</td><td>service-to-service פנימי, latency נמוך, streaming</td><td>UI שמרכז הרבה ישויות</td></tr>
<tr><td>חוזה</td><td>OpenAPI (אופציונלי, לרוב מתיישן)</td><td><code>.proto</code> (חובה, codegen)</td><td>Schema SDL (חובה, introspectable)</td></tr>
<tr><td>Payload</td><td>JSON טקסטואלי, מנופח</td><td>בינארי, קטן פי 3–10, parse מהיר</td><td>JSON, בדיוק השדות שביקשו</td></tr>
<tr><td>Streaming</td><td>לא (משתמשים ב-SSE/WebSockets)</td><td>streams של client, server ו-bidi</td><td>Subscriptions (על WS)</td></tr>
<tr><td>Caching</td><td>HTTP caching / CDN מובנה</td><td>קשה</td><td>קשה (endpoint ‏POST יחיד)</td></tr>
<tr><td>דפדפן</td><td>מובנה</td><td>צריך proxy של gRPC-Web</td><td>מובנה</td></tr>
<tr><td>מלכודות</td><td>Over/under-fetching, הרבה קריאות</td><td>לא קריא על הרשת, LB חייב L7 (multiplexing של HTTP/2)</td><td>N+1 ב-resolvers, queries יקרות → צריך מגבלות depth/cost</td></tr>
</table>
<p>קריאות sync מצמידות אתכם <strong>בזמן</strong>: אם הצד השני למטה או איטי — גם אתם. זמינות מוכפלת: בקשה שנוגעת באופן סינכרוני ב-5 שירותים של 99.9% כל אחד היא לכל היותר 99.5% זמינה. Latency מצטבר (או המקסימום, אם במקביל). לכן: sync ל-queries שהמשתמש מחכה לתשובה שלהן; async ל-commands שההשפעה שלהם יכולה לקרות אחר כך.</p>
<blockquote>💡 מהשטח: נקודת איזון נפוצה היא REST/JSON בקצה (API ציבורי, שותפים), gRPC בין שירותים פנימיים, GraphQL או BFF ל-UI של web/mobile, ו-events לכל מה ש"צריך לקרות אחרי".</blockquote>`
      }
    },
    {
      h: { en: "Push styles: webhooks, polling, long polling", he: "סגנונות push: webhooks, polling ו-long polling" },
      body: {
        en: `<ul>
<li><strong>Polling</strong>: <code>GET /jobs/42</code> every 5 s. Simple, firewall-friendly, but 99% of calls return "nothing new" and latency = interval/2 on average. Use <code>ETag</code>/<code>If-None-Match</code> → <code>304</code> to make it cheap, and <code>?since=cursor</code> for change feeds.</li>
<li><strong>Long polling</strong>: the server holds the request open (e.g. 30 s) until there's data. Near-real-time over plain HTTP; used by SQS <code>WaitTimeSeconds=20</code>, Consul blocking queries, Kubernetes <code>watch</code>.</li>
<li><strong>Webhooks</strong>: the provider calls <em>your</em> URL when something happens (Stripe <code>payment_intent.succeeded</code>, GitHub <code>push</code>). Real-time and efficient, but you now run a public endpoint that must be secure, fast and idempotent.</li>
</ul>
<p>Webhook receiver checklist:</p>
<pre># verify an HMAC-SHA256 signature over "timestamp.body"
import hmac, hashlib, time
def verify(secret: bytes, body: bytes, header_sig: str, ts: int) -&gt; bool:
    if abs(time.time() - ts) &gt; 300:                 # reject replays older than 5 min
        return False
    signed = str(ts).encode() + b"." + body
    expected = "sha256=" + hmac.new(secret, signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig) # constant-time compare</pre>
<ol>
<li>Verify the signature on the <strong>raw</strong> body bytes (re-serialized JSON breaks it) + timestamp tolerance against replay.</li>
<li>Persist the event (dedupe on provider event id) and return <strong>2xx within ~1–3 s</strong>; process asynchronously from a queue.</li>
<li>Assume duplicates and out-of-order delivery; fetch the latest state from the provider API if order matters.</li>
<li>Run a reconciliation poll (e.g. hourly "list events since") — webhooks <em>will</em> be missed during your outages.</li>
</ol>
<blockquote>⚠️ Production tip: if <em>you</em> send webhooks, sign them, retry with exponential backoff for ~24–72 h, give each event an id, expose a "resend" button and a delivery log, and auto-disable endpoints that fail for days — exactly what Stripe and GitHub do.</blockquote>`,
        he: `<ul>
<li><strong>Polling</strong>: <code>GET /jobs/42</code> כל 5 שניות. פשוט, ידידותי ל-firewalls, אבל 99% מהקריאות מחזירות "אין חדש" וה-latency הוא בממוצע חצי מהאינטרוול. משתמשים ב-<code>ETag</code>/<code>If-None-Match</code> → <code>304</code> כדי שיהיה זול, וב-<code>?since=cursor</code> ל-change feeds.</li>
<li><strong>Long polling</strong>: השרת מחזיק את הבקשה פתוחה (למשל 30 שניות) עד שיש מידע. כמעט real-time על HTTP רגיל; משמש ב-SQS עם <code>WaitTimeSeconds=20</code>, ב-blocking queries של Consul וב-<code>watch</code> של Kubernetes.</li>
<li><strong>Webhooks</strong>: הספק קורא ל-URL <em>שלכם</em> כשמשהו קורה (Stripe ‏<code>payment_intent.succeeded</code>, GitHub ‏<code>push</code>). Real-time ויעיל, אבל עכשיו אתם מריצים endpoint ציבורי שחייב להיות מאובטח, מהיר ואידמפוטנטי.</li>
</ul>
<p>צ'קליסט למקבל webhooks:</p>
<pre># verify an HMAC-SHA256 signature over "timestamp.body"
import hmac, hashlib, time
def verify(secret: bytes, body: bytes, header_sig: str, ts: int) -&gt; bool:
    if abs(time.time() - ts) &gt; 300:                 # reject replays older than 5 min
        return False
    signed = str(ts).encode() + b"." + body
    expected = "sha256=" + hmac.new(secret, signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig) # constant-time compare</pre>
<ol>
<li>מאמתים את החתימה על ה-body ה<strong>גולמי</strong> (JSON שעבר serialize מחדש שובר אותה) + סבילות timestamp נגד replay.</li>
<li>שומרים את ה-event (dedupe לפי event id של הספק) ומחזירים <strong>2xx תוך 1–3 שניות</strong>; מעבדים async מתור.</li>
<li>מניחים כפילויות וסדר לא נכון; אם הסדר חשוב — מושכים את ה-state העדכני מה-API של הספק.</li>
<li>מריצים reconciliation poll (למשל כל שעה "list events since") — webhooks <em>יפוספסו</em> בזמן התקלות שלכם.</li>
</ol>
<blockquote>⚠️ טיפ לפרודקשן: אם <em>אתם</em> שולחים webhooks — חותמים, עושים retry עם exponential backoff במשך 24–72 שעות, נותנים id לכל event, חושפים כפתור "שלח שוב" ו-delivery log, ומנטרלים אוטומטית endpoints שנכשלים כמה ימים — בדיוק מה ש-Stripe ו-GitHub עושים.</blockquote>`
      }
    },
    {
      h: { en: "Data-level integration: shared DB, CDC, files", he: "אינטגרציה ברמת הנתונים: DB משותף, CDC וקבצים" },
      body: {
        en: `<p><strong>Shared database</strong> (service B reads service A's tables) is the fastest integration to build and the most expensive to own: A's schema becomes B's API without anyone agreeing to it. A renames a column → B breaks in production. A can't change indexes, partitioning or even DB engine. Locks and heavy queries from B hurt A. Rule: <em>one owner per table</em>; others go through an API, events, or a read replica/view explicitly published as a contract.</p>
<p><strong>Change Data Capture (CDC)</strong>: stream the owner's DB changes (from the WAL/binlog) to a bus without touching application code. Debezium reads Postgres logical replication and emits one Kafka event per row change — great for feeding search indexes, caches, data warehouses and for migrating off a monolith.</p>
<pre># Debezium Postgres connector (Kafka Connect), trimmed
{ "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "orders-db", "database.dbname": "orders",
    "plugin.name": "pgoutput", "slot.name": "debezium_orders",
    "table.include.list": "public.orders,public.outbox",
    "topic.prefix": "orders" } }</pre>
<p><strong>File/batch transfer</strong> (SFTP, S3 "drop zones", nightly CSV/Parquet) is still how banks, insurers, governments and many partners integrate. Do it properly: write to a temp name then atomic rename (or a <code>_SUCCESS</code> marker), include a manifest with row counts + checksums, make loads idempotent by file name, and alert on "file did not arrive by 06:00".</p>
<blockquote>⚠️ Production tip: raw CDC events expose your internal schema just like a shared DB. Prefer CDC of an <strong>outbox</strong> table (curated, versioned events) for consumers outside your team; raw-table CDC is fine for your own derived stores.</blockquote>`,
        he: `<p><strong>DB משותף</strong> (שירות B קורא טבלאות של שירות A) הוא האינטגרציה הכי מהירה לבנות והכי יקרה להחזיק: ה-schema של A הופך ל-API של B בלי שאף אחד הסכים לזה. A משנה שם של עמודה → B נשבר בפרודקשן. A לא יכול לשנות אינדקסים, partitioning או אפילו מנוע DB. locks ו-queries כבדות של B פוגעות ב-A. כלל: <em>בעלים אחד לכל טבלה</em>; כל השאר עוברים דרך API, events, או read replica/view שפורסמו במפורש כחוזה.</p>
<p><strong>Change Data Capture (CDC)</strong>: מזרימים את השינויים ב-DB של הבעלים (מה-WAL/binlog) ל-bus בלי לגעת בקוד האפליקציה. Debezium קורא logical replication של Postgres ומוציא event ל-Kafka על כל שינוי שורה — מעולה להזנת search indexes, caches, data warehouses ולמיגרציה מ-monolith.</p>
<pre># Debezium Postgres connector (Kafka Connect), trimmed
{ "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "orders-db", "database.dbname": "orders",
    "plugin.name": "pgoutput", "slot.name": "debezium_orders",
    "table.include.list": "public.orders,public.outbox",
    "topic.prefix": "orders" } }</pre>
<p><strong>העברת קבצים/batch</strong> (SFTP, ‏"drop zones" ב-S3, ‏CSV/Parquet לילי) זו עדיין הדרך שבה בנקים, חברות ביטוח, ממשלות והרבה שותפים מתממשקים. עושים את זה נכון: כותבים לשם זמני ואז rename אטומי (או סמן <code>_SUCCESS</code>), מצרפים manifest עם ספירת שורות + checksums, טעינה אידמפוטנטית לפי שם הקובץ, והתראה על "הקובץ לא הגיע עד 06:00".</p>
<blockquote>⚠️ טיפ לפרודקשן: events גולמיים של CDC חושפים את ה-schema הפנימי שלכם בדיוק כמו DB משותף. לצרכנים מחוץ לצוות — עדיף CDC של טבלת <strong>outbox</strong> (events מנוהלים עם גרסאות); CDC על טבלאות גולמיות מתאים ל-stores נגזרים שלכם.</blockquote>`
      }
    },
    {
      h: { en: "Contracts and versioning: change without breaking anyone", he: "חוזים וגרסאות: לשנות בלי לשבור אף אחד" },
      body: {
        en: `<p>An integration is a <strong>contract</strong>: OpenAPI, <code>.proto</code>, GraphQL SDL, Avro/JSON Schema for events. Write it first (contract-first), generate clients from it, and test it in CI (consumer-driven contract tests with Pact; <code>buf breaking</code> for protobuf; schema-registry compatibility checks for events).</p>
<p><strong>Backward-compatible (safe)</strong>: add an optional field, add an endpoint, add an enum value <em>if clients tolerate unknown values</em>, widen accepted input. <strong>Breaking</strong>: remove/rename a field, change a type or meaning, make an optional field required, change defaults, change error codes, tighten validation. Clients must be "tolerant readers": ignore unknown fields.</p>
<table>
<tr><th>Versioning style</th><th>Example</th><th>Notes</th></tr>
<tr><td>URL path</td><td><code>/v2/orders</code></td><td>Most visible, easy routing &amp; caching; most common for public APIs</td></tr>
<tr><td>Header / media type</td><td><code>Accept: application/vnd.acme.v2+json</code></td><td>Clean URLs, harder to test in a browser</td></tr>
<tr><td>Date-based</td><td><code>Stripe-Version: 2024-06-20</code></td><td>Account pinned to a version; server transforms responses — gold standard for public APIs</td></tr>
<tr><td>Protobuf</td><td>package <code>orders.v1</code></td><td>Never reuse field numbers; <code>reserved 4;</code> for removed fields</td></tr>
</table>
<p><strong>Deprecation</strong> is a process: announce, add <code>Deprecation</code>/<code>Sunset</code> headers, measure who still calls the old version (per-client metrics!), contact them, brown-out (fail 1% of calls for an hour) before turning it off. Expand → migrate → contract: ship the new field alongside the old, move consumers, then remove.</p>
<blockquote>💡 Real world: Google's API guide (AIP) and Stripe's versioning are the best public references. Internally, "you can't avoid breaking consumers you don't know about" — so every client must identify itself (service name header / mTLS identity).</blockquote>`,
        he: `<p>אינטגרציה היא <strong>חוזה</strong>: OpenAPI, ‏<code>.proto</code>, ‏GraphQL SDL, ‏Avro/JSON Schema ל-events. כותבים אותו קודם (contract-first), מייצרים ממנו clients, ובודקים אותו ב-CI (consumer-driven contract tests עם Pact; ‏<code>buf breaking</code> ל-protobuf; בדיקות תאימות ב-schema registry ל-events).</p>
<p><strong>תואם לאחור (בטוח)</strong>: להוסיף שדה אופציונלי, להוסיף endpoint, להוסיף ערך ל-enum <em>אם ה-clients סובלניים לערכים לא מוכרים</em>, להרחיב קלט מותר. <strong>שובר</strong>: להסיר/לשנות שם של שדה, לשנות טיפוס או משמעות, להפוך שדה אופציונלי לחובה, לשנות defaults, לשנות קודי שגיאה, להחמיר ולידציה. ה-clients חייבים להיות "tolerant readers": להתעלם משדות לא מוכרים.</p>
<table>
<tr><th>סגנון גרסאות</th><th>דוגמה</th><th>הערות</th></tr>
<tr><td>בנתיב ה-URL</td><td><code>/v2/orders</code></td><td>הכי גלוי, routing ו-caching קלים; הכי נפוץ ב-APIs ציבוריים</td></tr>
<tr><td>Header / media type</td><td><code>Accept: application/vnd.acme.v2+json</code></td><td>URLs נקיים, קשה יותר לבדוק בדפדפן</td></tr>
<tr><td>לפי תאריך</td><td><code>Stripe-Version: 2024-06-20</code></td><td>החשבון מקובע לגרסה; השרת ממיר תשובות — ה-gold standard ל-APIs ציבוריים</td></tr>
<tr><td>Protobuf</td><td>package <code>orders.v1</code></td><td>אף פעם לא ממחזרים מספרי שדות; <code>reserved 4;</code> לשדות שהוסרו</td></tr>
</table>
<p><strong>Deprecation</strong> הוא תהליך: מכריזים, מוסיפים headers של <code>Deprecation</code>/<code>Sunset</code>, מודדים מי עוד קורא לגרסה הישנה (metrics לפי client!), פונים אליהם, עושים brown-out (מכשילים 1% מהקריאות לשעה) לפני שמכבים. Expand → migrate → contract: משחררים את השדה החדש לצד הישן, מעבירים את הצרכנים, ואז מסירים.</p>
<blockquote>💡 מהשטח: מדריך ה-API של Google ‏(AIP) וה-versioning של Stripe הם המקורות הציבוריים הכי טובים. בפנים, "אי אפשר להימנע משבירת צרכנים שאתם לא מכירים" — לכן כל client חייב להזדהות (header עם שם השירות / זהות mTLS).</blockquote>`
      }
    },
    {
      h: { en: "Gateways, BFFs, anti-corruption layers — and how to choose", he: "Gateways, ‏BFFs, ‏anti-corruption layers — ואיך בוחרים" },
      body: {
        en: `<ul>
<li><strong>API gateway</strong>: one front door for auth, rate limits, routing, TLS, request ids (see <code>#/lesson/arch-api-gateway</code>).</li>
<li><strong>BFF (Backend for Frontend)</strong>: a thin service per client type (web, iOS, partner) that aggregates internal calls and shapes responses for that screen. Owned by the frontend team; keeps mobile from making 12 calls on a 3G link.</li>
<li><strong>Anti-corruption layer (ACL)</strong>: a translator between your clean model and a legacy/vendor model (SOAP, mainframe COBOL copybooks, SAP IDocs). Their weird concepts (<code>CUST_STAT_CD='Q'</code>) never leak into your domain — only the ACL knows them, so replacing the vendor touches one place.</li>
</ul>
<table>
<tr><th>Need</th><th>Pick</th><th>Coupling</th></tr>
<tr><td>User waits for an answer, &lt;300 ms</td><td>Sync REST/gRPC (+cache)</td><td>Time + contract</td></tr>
<tr><td>"Do this eventually", must not be lost</td><td>Queue (command)</td><td>Contract only</td></tr>
<tr><td>"This happened", many interested parties</td><td>Pub/sub event (+outbox)</td><td>Event schema only</td></tr>
<tr><td>External SaaS tells you about changes</td><td>Webhooks + reconciliation poll</td><td>Provider's schema</td></tr>
<tr><td>Keep a copy of another team's data fresh</td><td>CDC / outbox events</td><td>Event schema</td></tr>
<tr><td>Partner bank, millions of rows nightly</td><td>File transfer with manifest</td><td>File format + schedule</td></tr>
<tr><td>Legacy system you can't change</td><td>ACL in front of it</td><td>Isolated in the ACL</td></tr>
</table>
<blockquote>💡 Real world: the question a principal asks is not "REST or Kafka?" but "what happens to <em>my</em> system when <em>theirs</em> is down for an hour, slow for a day, or changes its schema next quarter?" — the answer picks the integration style for you.</blockquote>`,
        he: `<ul>
<li><strong>API gateway</strong>: דלת כניסה אחת ל-auth, ‏rate limits, ‏routing, ‏TLS ו-request ids (ראו <code>#/lesson/arch-api-gateway</code>).</li>
<li><strong>BFF (Backend for Frontend)</strong>: שירות דק לכל סוג client (web, iOS, שותף) שמרכז קריאות פנימיות ומעצב תשובות למסך הספציפי. בבעלות צוות ה-frontend; חוסך מהמובייל 12 קריאות על חיבור 3G.</li>
<li><strong>Anti-corruption layer (ACL)</strong>: מתורגמן בין המודל הנקי שלכם למודל legacy/של ספק (SOAP, ‏COBOL copybooks ב-mainframe, ‏IDocs של SAP). המושגים המוזרים שלהם (<code>CUST_STAT_CD='Q'</code>) לא דולפים לדומיין שלכם — רק ה-ACL מכיר אותם, כך שהחלפת ספק נוגעת במקום אחד.</li>
</ul>
<table>
<tr><th>צורך</th><th>בחירה</th><th>צימוד</th></tr>
<tr><td>משתמש מחכה לתשובה, &lt;300ms</td><td>Sync REST/gRPC (+cache)</td><td>זמן + חוזה</td></tr>
<tr><td>"תעשה את זה בסוף", אסור שילך לאיבוד</td><td>תור (command)</td><td>חוזה בלבד</td></tr>
<tr><td>"זה קרה", הרבה גורמים מתעניינים</td><td>Pub/sub event (+outbox)</td><td>Event schema בלבד</td></tr>
<tr><td>SaaS חיצוני מודיע על שינויים</td><td>Webhooks + reconciliation poll</td><td>ה-schema של הספק</td></tr>
<tr><td>להחזיק עותק טרי של נתונים של צוות אחר</td><td>CDC / outbox events</td><td>Event schema</td></tr>
<tr><td>בנק שותף, מיליוני שורות בלילה</td><td>העברת קבצים עם manifest</td><td>פורמט קובץ + לוח זמנים</td></tr>
<tr><td>מערכת legacy שאי אפשר לשנות</td><td>ACL לפניה</td><td>מבודד בתוך ה-ACL</td></tr>
</table>
<blockquote>💡 מהשטח: השאלה ש-principal שואל היא לא "REST או Kafka?" אלא "מה קורה למערכת <em>שלי</em> כשהמערכת <em>שלהם</em> למטה לשעה, איטית ליום, או משנה schema ברבעון הבא?" — התשובה בוחרת בשבילכם את סגנון האינטגרציה.</blockquote>`
      }
    }
  ],
  diagram: `              ┌──────── sync (REST/gRPC) ────────▶ Inventory API     coupled in TIME
  Orders ─────┼──────── command queue ───────────▶ Billing worker    coupled to CONTRACT
  service     ├──────── outbox ─▶ Kafka topic ───▶ Search, Email, BI decoupled (events)
              └──────── NEVER: SELECT * FROM billing.invoices ✖     coupled to SCHEMA
  Stripe ──webhook (HMAC)──▶ /hooks/stripe ─▶ queue ─▶ processor   (+ hourly reconcile poll)
  Legacy ERP ◀── ACL (translate CUST_STAT_CD) ◀── Orders           legacy stays outside
  Bank ──SFTP nightly csv + manifest──▶ loader (idempotent by filename)`,
  handsOn: [
    { cmd: "grpcurl -plaintext localhost:50051 list",
      what: { en: "Explore a gRPC server via reflection: list its services, then call a method with grpcurl -d '{...}' host service/Method.", he: "חקירת שרת gRPC דרך reflection: רשימת ה-services, ואז קריאה לשיטה עם grpcurl -d." } },
    { cmd: "curl -s -o /dev/null -D - https://api.github.com/repos/torvalds/linux | grep -i etag",
      what: { en: "Cheap polling: grab the ETag, then send it back with -H 'If-None-Match: \"...\"' and you get 304 Not Modified (on GitHub that doesn't count against your rate limit).", he: "Polling זול: לוקחים את ה-ETag, שולחים אותו חזרה עם If-None-Match ומקבלים 304 Not Modified (ב-GitHub זה לא נספר ב-rate limit)." } },
    { cmd: "stripe listen --forward-to localhost:8080/hooks/stripe",
      what: { en: "Develop a webhook receiver locally with real signed events; in another terminal run 'stripe trigger payment_intent.succeeded', then resend the same event to test your dedupe.", he: "פיתוח מקבל webhooks מקומית עם events חתומים אמיתיים; בטרמינל אחר מריצים stripe trigger, ואז שולחים שוב את אותו event כדי לבדוק dedupe." } },
    { cmd: "buf breaking --against '.git#branch=main'",
      what: { en: "Fail CI when a .proto change breaks wire/source compatibility (removed field, changed type, reused number).", he: "להכשיל את ה-CI כשהשינוי ב-.proto שובר תאימות (שדה שהוסר, טיפוס שהשתנה, מספר שמוחזר)." } }
  ],
  mnemonic: { en: "\"Coupled in TIME, DATA or CHANGE?\" — sync couples time, shared DB couples data, missing contracts couple change.", he: "\"צימוד בזמן, בנתונים או בשינוי?\" — sync מצמיד זמן, DB משותף מצמיד נתונים, היעדר חוזים מצמיד שינוי." },
  pitfalls: [
    { en: "Integrating through another team's database 'just for this report' — six months later five services depend on its schema and it can never change.", he: "להתממשק דרך ה-DB של צוות אחר 'רק בשביל הדוח הזה' — חצי שנה אחר כך חמישה שירותים תלויים ב-schema שלו והוא לא יכול להשתנות לעולם." },
    { en: "Webhook handlers that do the slow work inline: the provider times out at 10–30 s, retries, and you process the same event three times in parallel.", he: "Webhook handlers שעושים את העבודה האיטית inline: הספק מגיע ל-timeout אחרי 10–30 שניות, עושה retry, ואתם מעבדים את אותו event שלוש פעמים במקביל." },
    { en: "Adding a new enum value and calling it 'non-breaking' — strict clients with exhaustive switches crash on the unknown value.", he: "להוסיף ערך חדש ל-enum ולקרוא לזה 'לא שובר' — clients קשוחים עם switch מלא קורסים על הערך הלא מוכר." },
    { en: "Long synchronous call chains (A→B→C→D→E): latency adds up, availability multiplies down, and one slow leaf stalls everything.", he: "שרשראות קריאות סינכרוניות ארוכות (A→B→C→D→E): ה-latency מצטבר, הזמינות מוכפלת כלפי מטה, ועלה איטי אחד תוקע הכול." }
  ],
  interview: [
    { q: { en: "When would you choose gRPC over REST, and what infrastructure changes does it require?", he: "מתי תבחרו gRPC על פני REST, ואילו שינויי תשתית זה דורש?" },
      a: { en: "Internal, high-QPS, latency-sensitive service-to-service calls, polyglot codegen, streaming. Needs L7 load balancing that understands HTTP/2 (long-lived connections defeat L4 LBs — one pod gets all traffic), gRPC health checks, a proto registry with breaking-change checks, gRPC-Web or a REST transcoding gateway for browsers, and tooling like grpcurl for debugging.", he: "קריאות פנימיות service-to-service עם QPS גבוה ורגישות ל-latency, codegen לכמה שפות, streaming. דורש load balancing ב-L7 שמבין HTTP/2 (חיבורים ארוכים שוברים LB ב-L4 — pod אחד מקבל את כל התעבורה), health checks של gRPC, ‏proto registry עם בדיקות breaking-change, ‏gRPC-Web או gateway שמתרגם ל-REST לדפדפנים, וכלים כמו grpcurl לדיבאג." } },
    { q: { en: "A team wants to read your service's tables directly for analytics. What do you offer instead?", he: "צוות רוצה לקרוא ישירות את הטבלאות של השירות שלכם לאנליטיקה. מה תציעו במקום?" },
      a: { en: "A published data contract: CDC (Debezium) or outbox events into Kafka/the warehouse, or a versioned read-only view on a replica. They get fresh data, I keep the freedom to change my schema, and their heavy queries never touch my primary.", he: "חוזה נתונים מפורסם: CDC ‏(Debezium) או outbox events ל-Kafka/ל-warehouse, או view קריאה-בלבד עם גרסה על replica. הם מקבלים נתונים טריים, אני שומר על החופש לשנות את ה-schema, וה-queries הכבדות שלהם לא נוגעות ב-primary שלי." } },
    { q: { en: "How do you remove a field from a public API used by hundreds of customers?", he: "איך מסירים שדה מ-API ציבורי שמשמש מאות לקוחות?" },
      a: { en: "Expand-migrate-contract: introduce the replacement, mark the old field deprecated in docs and with Deprecation/Sunset headers, measure usage per API key, contact the remaining callers, brown-out, then remove it in a new version (or date-version) while old pinned versions keep working via response transformation.", he: "Expand-migrate-contract: מוסיפים תחליף, מסמנים את השדה הישן כ-deprecated בתיעוד וב-headers של Deprecation/Sunset, מודדים שימוש לפי API key, פונים למי שנשאר, עושים brown-out, ומסירים בגרסה חדשה (או גרסת תאריך) כשגרסאות ישנות מקובעות ממשיכות לעבוד דרך המרת התשובות." } }
  ],
  quiz: [
    { q: { en: "Why is integrating through a shared database considered an anti-pattern?", he: "למה אינטגרציה דרך DB משותף נחשבת anti-pattern?" },
      options: [ { en: "Databases are slow", he: "DBs איטיים" }, { en: "The owner's internal schema silently becomes a public contract it can no longer change", he: "ה-schema הפנימי של הבעלים הופך בשקט לחוזה ציבורי שאי אפשר לשנות" }, { en: "SQL can't join across services", he: "SQL לא יכול לעשות join בין שירותים" }, { en: "It requires Kafka", he: "זה דורש Kafka" } ],
      answer: 1, explain: { en: "Schema, indexes, engine and load are all coupled to consumers nobody tracks.", he: "ה-schema, האינדקסים, המנוע והעומס כולם מצומדים לצרכנים שאף אחד לא עוקב אחריהם." } },
    { q: { en: "Best first action of a webhook receiver after verifying the signature?", he: "מה הפעולה הראשונה הכי נכונה של מקבל webhook אחרי אימות החתימה?" },
      options: [ { en: "Do all the business processing, then return 200", he: "לבצע את כל העיבוד העסקי ואז להחזיר 200" }, { en: "Persist/enqueue the event (dedupe by id) and return 2xx fast", he: "לשמור/להכניס לתור את ה-event (dedupe לפי id) ולהחזיר 2xx מהר" }, { en: "Return 500 so the provider retries later", he: "להחזיר 500 כדי שהספק ינסה שוב" }, { en: "Call the provider back synchronously for every field", he: "לקרוא חזרה לספק באופן סינכרוני על כל שדה" } ],
      answer: 1, explain: { en: "Fast ack prevents provider timeouts and duplicate deliveries; processing happens asynchronously and idempotently.", he: "אישור מהיר מונע timeouts אצל הספק ומסירות כפולות; העיבוד קורה async ובאופן אידמפוטנטי." } },
    { q: { en: "Which change is backward-compatible for a JSON REST response?", he: "איזה שינוי תואם לאחור בתשובת REST ב-JSON?" },
      options: [ { en: "Renaming 'total' to 'amount'", he: "לשנות את 'total' ל-'amount'" }, { en: "Changing 'price' from number to string", he: "לשנות את 'price' ממספר למחרוזת" }, { en: "Adding a new optional field 'currency'", he: "להוסיף שדה אופציונלי חדש 'currency'" }, { en: "Making 'coupon' required in requests", he: "להפוך את 'coupon' לשדה חובה בבקשות" } ],
      answer: 2, explain: { en: "Additive optional fields are safe for tolerant readers; renames, type changes and new requirements break clients.", he: "שדות אופציונליים חדשים בטוחים ל-tolerant readers; שינויי שם, טיפוס ודרישות חדשות שוברים clients." } },
    { q: { en: "What's the main purpose of an anti-corruption layer?", he: "מה המטרה העיקרית של anti-corruption layer?" },
      options: [ { en: "Encrypting traffic to legacy systems", he: "הצפנת תעבורה למערכות legacy" }, { en: "Translating a legacy/vendor model so its concepts don't leak into your domain", he: "תרגום מודל legacy/ספק כדי שהמושגים שלו לא ידלפו לדומיין שלכם" }, { en: "Rate limiting partners", he: "Rate limiting לשותפים" }, { en: "Detecting data corruption on disk", he: "גילוי השחתת נתונים בדיסק" } ],
      answer: 1, explain: { en: "The ACL isolates foreign models in one place, so your model stays clean and the vendor is replaceable.", he: "ה-ACL מבודד מודלים זרים במקום אחד, כך שהמודל שלכם נשאר נקי ואפשר להחליף את הספק." } }
  ],
  related: ["arch-sync-vs-async", "arch-api-gateway", "arch-event-driven", "arch-monolith-vs-microservices", "pr-idempotency", "pr-queue-kinds", "pr-http-versions", "pr-realtime-protocols"]
});

INFRA.lessons.push({
  id: "pr-queue-kinds",
  track: "principal",
  order: 22,
  icon: "📬",
  level: 3,
  minutes: 16,
  title: { en: "Kinds of Queues: Work Queues, Pub/Sub, Logs, Priority, Delay, FIFO & DLQ", he: "סוגי תורים: work queues, ‏pub/sub, לוגים, עדיפות, השהיה, FIFO ו-DLQ" },
  tldr: {
    en: "\"Queue\" is six different tools: a to-do list (work queue), a megaphone (pub/sub), a tape recorder (log/stream), a triage desk (priority), an alarm clock (delay) and a hospital for sick messages (DLQ) — pick by delivery, ordering, replay and fan-out needs.",
    he: "\"תור\" זה שישה כלים שונים: רשימת משימות (work queue), רמקול (pub/sub), טייפ מקליט (log/stream), עמדת מיון (priority), שעון מעורר (delay) ובית חולים להודעות חולות (DLQ) — בוחרים לפי צורכי delivery, סדר, replay ו-fan-out."
  },
  analogy: {
    en: "A work queue is the ticket rail in a restaurant kitchen: each order is taken by exactly one cook, and once cooked the ticket is gone. Pub/sub is the PA system: one announcement, everyone who's listening hears it — if you weren't in the building, you missed it. A log (Kafka) is a security camera recording: anyone can rewind and watch from any point, and many people can watch the same tape at different speeds. A priority queue is the ER triage nurse. A delay queue is a 'remind me in 15 minutes' alarm. The DLQ is the shelf for orders the kitchen couldn't make — someone must look at it, or it just rots.",
    he: "Work queue זה המסילה של הפתקים במטבח מסעדה: כל הזמנה נלקחת ע\"י טבח אחד בדיוק, ואחרי שבושלה הפתק נעלם. Pub/sub זו מערכת הכריזה: הודעה אחת, כל מי שמקשיב שומע — מי שלא היה בבניין פספס. Log (Kafka) זו הקלטה של מצלמת אבטחה: כל אחד יכול להריץ אחורה ולצפות מכל נקודה, והרבה אנשים יכולים לצפות באותה הקלטה בקצבים שונים. Priority queue זו אחות המיון. Delay queue זה 'תזכיר לי בעוד רבע שעה'. DLQ זה המדף להזמנות שהמטבח לא הצליח להכין — מישהו חייב להסתכל עליו, אחרת הן פשוט נרקבות."
  },
  sections: [
    {
      h: { en: "The three fundamental shapes", he: "שלוש הצורות הבסיסיות" },
      body: {
        en: `<table>
<tr><th>Shape</th><th>Who gets a message</th><th>After consumption</th><th>Replay?</th><th>Examples</th></tr>
<tr><td><strong>Work queue</strong> (point-to-point)</td><td>Exactly one of N competing consumers</td><td>Deleted on ack</td><td>No</td><td>SQS, RabbitMQ queue, Celery, Sidekiq, Azure Service Bus queue</td></tr>
<tr><td><strong>Pub/sub</strong> (fan-out)</td><td>Every subscription gets a copy</td><td>Each subscription's copy deleted on ack</td><td>No (only from now on)</td><td>SNS, RabbitMQ fanout/topic exchange, Google Pub/Sub, Service Bus topics, Redis PUB/SUB (fire-and-forget!)</td></tr>
<tr><td><strong>Log / stream</strong></td><td>Every consumer <em>group</em> reads everything; inside a group, partitions split work</td><td>Kept by retention (7 days, forever)</td><td>Yes — reset offsets</td><td>Kafka, Kinesis, Redis Streams, Pulsar, Event Hubs, NATS JetStream</td></tr>
</table>
<p>Combinations are standard: <strong>SNS → N × SQS</strong> = durable fan-out, each subscriber with its own work queue, retries and DLQ. In Kafka, one topic + consumer groups gives both: fan-out between groups, work-sharing inside a group (max parallelism = partition count).</p>
<blockquote>💡 Real world: the deciding question is "do I need to <strong>re-read history</strong>?" — rebuilding a search index, onboarding a new consumer that needs the last 7 days, reprocessing after a bug fix. If yes → a log. If messages are tasks to be done once → a work queue. See <code>#/lesson/arch-brokers</code> for broker internals.</blockquote>`,
        he: `<table>
<tr><th>צורה</th><th>מי מקבל הודעה</th><th>אחרי צריכה</th><th>Replay?</th><th>דוגמאות</th></tr>
<tr><td><strong>Work queue</strong> (point-to-point)</td><td>בדיוק אחד מתוך N consumers מתחרים</td><td>נמחקת ב-ack</td><td>לא</td><td>SQS, תור RabbitMQ, ‏Celery, ‏Sidekiq, תור Azure Service Bus</td></tr>
<tr><td><strong>Pub/sub</strong> (fan-out)</td><td>כל subscription מקבלת עותק</td><td>העותק של כל subscription נמחק ב-ack</td><td>לא (רק מעכשיו)</td><td>SNS, ‏fanout/topic exchange ב-RabbitMQ, ‏Google Pub/Sub, ‏topics ב-Service Bus, ‏Redis PUB/SUB (שגר ושכח!)</td></tr>
<tr><td><strong>Log / stream</strong></td><td>כל consumer <em>group</em> קורא הכול; בתוך group, ה-partitions מחלקים את העבודה</td><td>נשמר לפי retention (7 ימים, לנצח)</td><td>כן — מאפסים offsets</td><td>Kafka, ‏Kinesis, ‏Redis Streams, ‏Pulsar, ‏Event Hubs, ‏NATS JetStream</td></tr>
</table>
<p>שילובים הם סטנדרט: <strong>SNS → N × SQS</strong> = fan-out עמיד, לכל subscriber תור עבודה משלו עם retries ו-DLQ. ב-Kafka, topic אחד + consumer groups נותן את שניהם: fan-out בין groups, חלוקת עבודה בתוך group (מקביליות מקסימלית = מספר ה-partitions).</p>
<blockquote>💡 מהשטח: השאלה המכריעה היא "האם אני צריך <strong>לקרוא שוב היסטוריה</strong>?" — בנייה מחדש של search index, ‏consumer חדש שצריך את 7 הימים האחרונים, עיבוד מחדש אחרי תיקון באג. אם כן → log. אם ההודעות הן משימות שצריך לבצע פעם אחת → work queue. ראו <code>#/lesson/arch-brokers</code> לפנים של ה-brokers.</blockquote>`
      }
    },
    {
      h: { en: "Special-purpose queues: priority, delay, FIFO, request-reply", he: "תורים לשימוש מיוחד: עדיפות, השהיה, FIFO ו-request-reply" },
      body: {
        en: `<ul>
<li><strong>Priority queue</strong>: higher-priority messages jump ahead. RabbitMQ supports <code>x-max-priority</code> (keep it ≤ 10 levels). SQS/Kafka don't — use <strong>separate queues per priority</strong> and give the high-priority queue more consumers or poll it first (watch for starvation of the low queue). Example: password-reset emails vs marketing newsletters.</li>
<li><strong>Delay / scheduled queue</strong>: deliver no earlier than T. SQS <code>DelaySeconds</code> (max 15 min) per message; RabbitMQ delayed-message plugin or TTL + dead-letter trick; Azure Service Bus <code>ScheduledEnqueueTimeUtc</code>; Redis sorted set with score = due timestamp (<code>ZADD</code> + poll <code>ZRANGEBYSCORE</code>). For hours/days, use a scheduler/durable timer (Temporal, EventBridge Scheduler) instead.</li>
<li><strong>FIFO vs standard</strong>: SQS standard = nearly unlimited throughput, at-least-once, best-effort order. SQS FIFO = strict order per <code>MessageGroupId</code>, 5-minute dedup window by <code>MessageDeduplicationId</code>, 300 msg/s (3,000 with batching; higher in high-throughput mode). Global strict order is a throughput killer — you almost always want order <em>per key</em> (per customer, per order id).</li>
<li><strong>Request-reply over queues</strong>: request carries <code>reply_to</code> + <code>correlation_id</code>; the responder publishes to that reply queue. Used for RPC over RabbitMQ or when crossing network zones; mind timeouts and orphaned replies.</li>
</ul>
<pre># per-key ordering in Kafka: same key -&gt; same partition -&gt; ordered
kafka-console-producer --bootstrap-server localhost:9092 --topic orders \
  --property parse.key=true --property key.separator=:
order-81:{"type":"Created"}
order-81:{"type":"Paid"}       # guaranteed after Created for order-81
order-99:{"type":"Created"}    # may interleave freely with order-81</pre>
<blockquote>⚠️ Production tip: ordering + retries fight each other. If message 2 for a key fails and you move on to message 3, you've broken order; if you block, one poison message stalls the whole partition. Decide per use-case: block-and-alert, or park the key's messages in a retry topic together.</blockquote>`,
        he: `<ul>
<li><strong>Priority queue</strong>: הודעות בעדיפות גבוהה עוקפות. RabbitMQ תומך ב-<code>x-max-priority</code> (תשאירו ≤ 10 רמות). SQS/Kafka לא — משתמשים ב-<strong>תורים נפרדים לכל עדיפות</strong> ונותנים לתור הדחוף יותר consumers או קוראים ממנו קודם (שימו לב ל-starvation של התור הנמוך). דוגמה: מיילים לאיפוס סיסמה מול ניוזלטר שיווקי.</li>
<li><strong>Delay / scheduled queue</strong>: למסור לא לפני T. ב-SQS ‏<code>DelaySeconds</code> (עד 15 דקות) להודעה; ב-RabbitMQ ה-delayed-message plugin או טריק TTL + dead-letter; ב-Azure Service Bus ‏<code>ScheduledEnqueueTimeUtc</code>; ב-Redis ‏sorted set עם score = זמן היעד (<code>ZADD</code> + poll עם <code>ZRANGEBYSCORE</code>). לשעות/ימים — scheduler/טיימר עמיד (Temporal, ‏EventBridge Scheduler).</li>
<li><strong>FIFO מול standard</strong>: SQS standard = throughput כמעט בלי הגבלה, at-least-once, סדר best-effort. SQS FIFO = סדר קשיח לכל <code>MessageGroupId</code>, חלון dedup של 5 דקות לפי <code>MessageDeduplicationId</code>, ‏300 הודעות/שנייה (3,000 עם batching; יותר ב-high-throughput mode). סדר גלובלי קשיח הורג throughput — כמעט תמיד רוצים סדר <em>לכל key</em> (לקוח, הזמנה).</li>
<li><strong>Request-reply על תורים</strong>: הבקשה נושאת <code>reply_to</code> + ‏<code>correlation_id</code>; המגיב מפרסם לתור התשובה. משמש ל-RPC על RabbitMQ או כשחוצים אזורי רשת; שימו לב ל-timeouts ולתשובות יתומות.</li>
</ul>
<pre># per-key ordering in Kafka: same key -&gt; same partition -&gt; ordered
kafka-console-producer --bootstrap-server localhost:9092 --topic orders \
  --property parse.key=true --property key.separator=:
order-81:{"type":"Created"}
order-81:{"type":"Paid"}       # guaranteed after Created for order-81
order-99:{"type":"Created"}    # may interleave freely with order-81</pre>
<blockquote>⚠️ טיפ לפרודקשן: סדר ו-retries נלחמים אחד בשני. אם הודעה 2 של key נכשלת וממשיכים להודעה 3 — שברתם את הסדר; אם חוסמים — הודעת poison אחת תוקעת את כל ה-partition. מחליטים לפי use-case: לחסום ולהתריע, או להעביר את כל ההודעות של ה-key יחד ל-retry topic.</blockquote>`
      }
    },
    {
      h: { en: "Delivery mechanics: ack modes, visibility timeout, push vs pull, DLQ", he: "מכניקת delivery: ‏ack modes, ‏visibility timeout, ‏push מול pull, ‏DLQ" },
      body: {
        en: `<ul>
<li><strong>Ack modes</strong>: auto-ack on receive = <em>at-most-once</em> (crash mid-processing loses it). Ack after processing = <em>at-least-once</em> (crash before ack redelivers → duplicates → be idempotent, see <code>#/lesson/pr-idempotency</code>). Kafka: commit offsets after processing.</li>
<li><strong>Visibility timeout / lease</strong> (SQS default 30 s, max 12 h): a received message is hidden from others; if not deleted in time, it reappears. Set it to ~6× your p99 processing time, and extend it (<code>ChangeMessageVisibility</code>) for long jobs, or you'll process the same message twice <em>concurrently</em>.</li>
<li><strong>Push vs pull</strong>: push (RabbitMQ basic.consume, Pub/Sub push to HTTPS) delivers fast but needs <code>prefetch</code>/flow control so consumers aren't flooded; pull (SQS, Kafka) lets consumers take what they can handle — natural backpressure.</li>
<li><strong>DLQ and poison messages</strong>: after N failed attempts (SQS <code>maxReceiveCount</code>, RabbitMQ <code>x-dead-letter-exchange</code>, Service Bus <code>MaxDeliveryCount</code>=10) move the message aside so it stops blocking/burning CPU. A DLQ without an alarm and a <strong>redrive</strong> procedure is a silent data-loss bin.</li>
</ul>
<pre># SQS: main queue with DLQ after 5 receives
aws sqs create-queue --queue-name orders-dlq
aws sqs create-queue --queue-name orders --attributes '{
  "VisibilityTimeout": "180",
  "ReceiveMessageWaitTimeSeconds": "20",
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:123456789012:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"
}'
# after fixing the bug: move messages back
aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:123456789012:orders-dlq</pre>
<p><strong>Backpressure</strong>: the queue absorbs bursts, but if consumers are slower than producers on average, the backlog grows forever. Watch <em>age of oldest message</em> (not just depth), autoscale consumers on lag (KEDA, <code>#/lesson/k8s-keda</code>), and cap the queue or shed load at the producer before it's hours behind.</p>`,
        he: `<ul>
<li><strong>Ack modes</strong>: auto-ack בקבלה = <em>at-most-once</em> (קריסה באמצע העיבוד מאבדת את ההודעה). ack אחרי עיבוד = <em>at-least-once</em> (קריסה לפני ack ← מסירה חוזרת ← כפילויות ← להיות אידמפוטנטיים, ראו <code>#/lesson/pr-idempotency</code>). ב-Kafka: commit ל-offsets אחרי העיבוד.</li>
<li><strong>Visibility timeout / lease</strong> (ב-SQS ברירת מחדל 30 שניות, מקסימום 12 שעות): הודעה שהתקבלה מוסתרת מאחרים; אם לא נמחקה בזמן — היא חוזרת. קובעים בערך פי 6 מזמן העיבוד ב-p99, ומאריכים (<code>ChangeMessageVisibility</code>) ל-jobs ארוכים, אחרת תעבדו את אותה הודעה פעמיים <em>במקביל</em>.</li>
<li><strong>Push מול pull</strong>: push (‏basic.consume ב-RabbitMQ, ‏Pub/Sub push ל-HTTPS) מוסר מהר אבל צריך <code>prefetch</code>/flow control כדי לא להציף consumers; pull (‏SQS, ‏Kafka) נותן ל-consumers לקחת כמה שהם מסוגלים — backpressure טבעי.</li>
<li><strong>DLQ והודעות poison</strong>: אחרי N ניסיונות כושלים (ב-SQS ‏<code>maxReceiveCount</code>, ב-RabbitMQ ‏<code>x-dead-letter-exchange</code>, ב-Service Bus ‏<code>MaxDeliveryCount</code>=10) מעבירים את ההודעה הצידה כדי שתפסיק לחסום/לשרוף CPU. DLQ בלי התראה ובלי נוהל <strong>redrive</strong> הוא פח שקט לאובדן נתונים.</li>
</ul>
<pre># SQS: main queue with DLQ after 5 receives
aws sqs create-queue --queue-name orders-dlq
aws sqs create-queue --queue-name orders --attributes '{
  "VisibilityTimeout": "180",
  "ReceiveMessageWaitTimeSeconds": "20",
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:123456789012:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"
}'
# after fixing the bug: move messages back
aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:123456789012:orders-dlq</pre>
<p><strong>Backpressure</strong>: התור סופג פיקים, אבל אם בממוצע ה-consumers איטיים מה-producers, ה-backlog גדל לנצח. עוקבים אחרי <em>הגיל של ההודעה הכי ישנה</em> (לא רק עומק), עושים autoscale ל-consumers לפי lag (KEDA, ‏<code>#/lesson/k8s-keda</code>), ומגבילים את התור או עושים load shedding אצל ה-producer לפני שמגיעים לפיגור של שעות.</p>`
      }
    },
    {
      h: { en: "Comparison table: which product for which job", he: "טבלת השוואה: איזה מוצר לאיזו עבודה" },
      body: {
        en: `<table>
<tr><th>Product</th><th>Model</th><th>Ordering</th><th>Replay</th><th>Sweet spot</th><th>Watch out</th></tr>
<tr><td>AWS SQS</td><td>Work queue (pull)</td><td>Standard: none; FIFO: per group</td><td>No</td><td>Zero-ops task queues on AWS</td><td>256 KB msg, 15 min max delay, no fan-out alone</td></tr>
<tr><td>AWS SNS</td><td>Pub/sub (push)</td><td>FIFO topics per group</td><td>No (archive in FIFO)</td><td>Fan-out to SQS/Lambda/HTTP/SMS/email</td><td>Not durable for slow subscribers → pair with SQS</td></tr>
<tr><td>RabbitMQ</td><td>Exchanges → queues (push), streams</td><td>Per queue</td><td>Streams only</td><td>Flexible routing, priorities, RPC, on-prem</td><td>Large backlogs hurt; use quorum queues for HA</td></tr>
<tr><td>Apache Kafka</td><td>Partitioned log (pull)</td><td>Per partition (key)</td><td>Yes, by retention</td><td>Event streaming, CDC, high throughput, many consumers</td><td>Ops-heavy; partitions cap parallelism; no per-message ack/delay</td></tr>
<tr><td>NATS / JetStream</td><td>Pub/sub core + persistent streams</td><td>Per stream/subject</td><td>JetStream yes</td><td>Low-latency, edge/IoT, lightweight, request-reply</td><td>Core NATS is at-most-once</td></tr>
<tr><td>Redis Streams</td><td>Log + consumer groups</td><td>Per stream</td><td>Yes (memory-bound)</td><td>Already have Redis, modest volume</td><td>Memory = retention; persistence/HA caveats</td></tr>
<tr><td>Google Pub/Sub</td><td>Pub/sub with subscriptions</td><td>Ordering keys (opt-in)</td><td>Seek to time/snapshot</td><td>Serverless global fan-out on GCP</td><td>At-least-once by default</td></tr>
<tr><td>Azure Service Bus</td><td>Queues + topics/subscriptions</td><td>Sessions (per key)</td><td>No</td><td>Enterprise messaging: sessions, scheduled, DLQ, transactions</td><td>Premium tier for predictable perf</td></tr>
</table>
<blockquote>💡 Real world: a principal's default on a cloud: managed work queue (SQS/Service Bus/Pub/Sub) for tasks, managed Kafka (MSK/Confluent/Event Hubs) only when you need replay, many consumer groups or CDC. Don't run Kafka for 50 messages per second of background jobs.</blockquote>`,
        he: `<table>
<tr><th>מוצר</th><th>מודל</th><th>סדר</th><th>Replay</th><th>הכי מתאים ל</th><th>שימו לב</th></tr>
<tr><td>AWS SQS</td><td>Work queue (pull)</td><td>Standard: אין; FIFO: לכל group</td><td>לא</td><td>תורי משימות בלי תפעול ב-AWS</td><td>הודעה עד 256KB, השהיה עד 15 דקות, אין fan-out לבד</td></tr>
<tr><td>AWS SNS</td><td>Pub/sub (push)</td><td>FIFO topics לכל group</td><td>לא (archive ב-FIFO)</td><td>Fan-out ל-SQS/Lambda/HTTP/SMS/email</td><td>לא עמיד ל-subscribers איטיים → לצרף SQS</td></tr>
<tr><td>RabbitMQ</td><td>Exchanges → queues ‏(push), ‏streams</td><td>לכל תור</td><td>רק streams</td><td>Routing גמיש, עדיפויות, RPC, ‏on-prem</td><td>Backlogs גדולים מזיקים; quorum queues ל-HA</td></tr>
<tr><td>Apache Kafka</td><td>Log עם partitions ‏(pull)</td><td>לכל partition ‏(key)</td><td>כן, לפי retention</td><td>Event streaming, ‏CDC, ‏throughput גבוה, הרבה consumers</td><td>כבד לתפעול; partitions מגבילים מקביליות; אין ack/delay להודעה בודדת</td></tr>
<tr><td>NATS / JetStream</td><td>Pub/sub בליבה + streams עמידים</td><td>לכל stream/subject</td><td>ב-JetStream כן</td><td>Latency נמוך, ‏edge/IoT, קל משקל, ‏request-reply</td><td>Core NATS הוא at-most-once</td></tr>
<tr><td>Redis Streams</td><td>Log + consumer groups</td><td>לכל stream</td><td>כן (מוגבל בזיכרון)</td><td>כבר יש Redis, נפח צנוע</td><td>זיכרון = retention; הסתייגויות persistence/HA</td></tr>
<tr><td>Google Pub/Sub</td><td>Pub/sub עם subscriptions</td><td>Ordering keys (opt-in)</td><td>Seek לזמן/snapshot</td><td>Fan-out גלובלי serverless ב-GCP</td><td>At-least-once כברירת מחדל</td></tr>
<tr><td>Azure Service Bus</td><td>Queues + topics/subscriptions</td><td>Sessions (לכל key)</td><td>לא</td><td>Messaging ארגוני: sessions, תזמון, DLQ, טרנזקציות</td><td>Premium tier לביצועים צפויים</td></tr>
</table>
<blockquote>💡 מהשטח: ברירת המחדל של principal בענן: work queue מנוהל (SQS/Service Bus/Pub/Sub) למשימות, ו-Kafka מנוהל (MSK/Confluent/Event Hubs) רק כשצריך replay, הרבה consumer groups או CDC. לא מריצים Kafka בשביל 50 הודעות בשנייה של background jobs.</blockquote>`
      }
    }
  ],
  diagram: `WORK QUEUE            PUB/SUB                    LOG / STREAM (Kafka)
producer              publisher                  producer ─▶ [p0|0 1 2 3 4 5 ...]
   │                      │                                  [p1|0 1 2 3 ...    ]
[ m3 m2 m1 ]          ( topic )                  group A (search):  offset p0=5 p1=3
  │   │   │          ╱    │    ╲                 group B (billing): offset p0=2 p1=1
  c1  c2  c3       subA  subB  subC              new group C: start from earliest ⟲
 each msg → ONE    each sub → a COPY             each group reads ALL, replayable
        ✖ fails 5x ──▶ [ DLQ ] ──alarm──▶ fix ──▶ redrive`,
  handsOn: [
    { cmd: "docker run -d --name rmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management",
      what: { en: "Start RabbitMQ with the management UI on :15672 (guest/guest); create a fanout exchange bound to two queues and watch one publish land in both.", he: "מריצים RabbitMQ עם ממשק ניהול ב-15672 (guest/guest); יוצרים fanout exchange שמחובר לשני תורים ורואים פרסום אחד נוחת בשניהם." } },
    { cmd: "kafka-consumer-groups --bootstrap-server localhost:9092 --group search --reset-offsets --to-datetime 2026-11-12T00:00:00.000 --topic orders --execute",
      what: { en: "Replay: rewind a consumer group to yesterday midnight — the superpower a work queue doesn't have (stop the group first).", he: "Replay: מחזירים consumer group לחצות של אתמול — כוח-על שאין ל-work queue (קודם עוצרים את ה-group)." } },
    { cmd: "aws sqs get-queue-attributes --queue-url $QURL --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible",
      what: { en: "Depth vs in-flight. Pair with the CloudWatch metric ApproximateAgeOfOldestMessage — the real SLO signal for a queue.", he: "עומק מול in-flight. משלבים עם ה-metric ‏ApproximateAgeOfOldestMessage ב-CloudWatch — סיגנל ה-SLO האמיתי של תור." } },
    { cmd: "redis-cli ZADD delayed 1763035200 job:42 && redis-cli ZRANGEBYSCORE delayed -inf $(date +%s) LIMIT 0 100",
      what: { en: "A delay queue in two commands: score = due time; a poller moves due items to the work queue (use a Lua script to pop atomically).", he: "Delay queue בשתי פקודות: score = זמן היעד; poller מעביר פריטים שהגיע זמנם לתור העבודה (Lua script כדי לשלוף אטומית)." } }
  ],
  mnemonic: { en: "\"One gets it, all get it, or all can rewind it\" — work queue, pub/sub, log. Then add: priority jumps, delay waits, FIFO orders per key, DLQ quarantines.", he: "\"אחד מקבל, כולם מקבלים, או כולם יכולים להריץ אחורה\" — work queue, ‏pub/sub, ‏log. ואז: priority עוקף, delay מחכה, FIFO מסדר לפי key, ‏DLQ מבודד." },
  pitfalls: [
    { en: "Using Redis PUB/SUB (or core NATS) for events that must not be lost — subscribers that are down or slow simply miss them.", he: "להשתמש ב-Redis PUB/SUB (או core NATS) ל-events שאסור לאבד — subscribers שלמטה או איטיים פשוט מפספסים אותם." },
    { en: "Visibility timeout shorter than processing time: the message reappears and a second worker processes it while the first is still running.", he: "Visibility timeout קצר מזמן העיבוד: ההודעה חוזרת ו-worker שני מעבד אותה בזמן שהראשון עוד רץ." },
    { en: "A DLQ nobody monitors — failed orders accumulate silently for weeks until a customer complains.", he: "DLQ שאף אחד לא מנטר — הזמנות שנכשלו מצטברות בשקט שבועות עד שלקוח מתלונן." },
    { en: "Demanding global FIFO 'to be safe' — throughput collapses to one consumer. You almost always need order per entity, not global.", he: "לדרוש FIFO גלובלי 'ליתר ביטחון' — ה-throughput קורס ל-consumer אחד. כמעט תמיד צריך סדר לכל ישות, לא גלובלי." }
  ],
  interview: [
    { q: { en: "SQS or Kafka for a new order-processing pipeline? Walk through the decision.", he: "SQS או Kafka ל-pipeline חדש של עיבוד הזמנות? תעברו על ההחלטה." },
      a: { en: "Ask: how many independent consumers now and later? Need replay/backfill? Throughput? Per-message delay/retry/DLQ? Team ops capacity? If it's tasks with 1–3 consumers, per-message retries and no replay → SNS+SQS (zero ops, DLQ built in). If many teams will consume the same order events, need replay for new projections/CDC, or 100k+ msg/s → Kafka (managed), keyed by order_id for per-order ordering, with retry topics and DLQ built by hand.", he: "שואלים: כמה consumers עצמאיים עכשיו ובעתיד? צריך replay/backfill? throughput? השהיה/retry/DLQ לכל הודעה? יכולת תפעול של הצוות? אם אלה משימות עם 1–3 consumers, retries לכל הודעה ובלי replay → SNS+SQS (בלי תפעול, DLQ מובנה). אם הרבה צוותים יצרכו את אותם events, צריך replay ל-projections חדשים/CDC, או 100k+ הודעות בשנייה → Kafka (מנוהל), עם key לפי order_id לסדר לכל הזמנה, ו-retry topics ו-DLQ שבונים לבד." } },
    { q: { en: "How do you implement retries with delay in Kafka, which has no per-message delay?", he: "איך מממשים retries עם השהיה ב-Kafka, שאין בו delay להודעה?" },
      a: { en: "Retry topics: on failure publish to orders.retry.1m (then .10m, .1h) with attempt count in headers; a consumer on each retry topic pauses until the message's due time before processing; after the last tier → orders.dlq. Commit the original offset so the main partition isn't blocked. (Spring Kafka and Uber's pattern work this way.) Note it breaks per-key ordering.", he: "Retry topics: בכשל מפרסמים ל-orders.retry.1m (ואחר כך ‎.10m, ‎.1h) עם מספר הניסיון ב-headers; consumer על כל retry topic ממתין עד זמן היעד של ההודעה לפני העיבוד; אחרי השלב האחרון → orders.dlq. עושים commit ל-offset המקורי כדי שה-partition הראשי לא ייחסם. (Spring Kafka והתבנית של Uber עובדים ככה.) שימו לב שזה שובר סדר לכל key." } }
  ],
  quiz: [
    { q: { en: "You need a new analytics service to process the last 7 days of order events. Which kind fits?", he: "צריך ששירות אנליטיקה חדש יעבד את 7 הימים האחרונים של events הזמנות. איזה סוג מתאים?" },
      options: [ { en: "Work queue (SQS standard)", he: "Work queue ‏(SQS standard)" }, { en: "Log/stream with retention (Kafka)", he: "Log/stream עם retention ‏(Kafka)" }, { en: "Redis PUB/SUB", he: "Redis PUB/SUB" }, { en: "Priority queue", he: "Priority queue" } ],
      answer: 1, explain: { en: "Only a retained log lets a new consumer group start from an older offset/time.", he: "רק log עם retention מאפשר ל-consumer group חדש להתחיל מ-offset/זמן ישן." } },
    { q: { en: "What happens if an SQS consumer takes longer than the visibility timeout?", he: "מה קורה אם consumer של SQS לוקח יותר זמן מה-visibility timeout?" },
      options: [ { en: "The message is deleted", he: "ההודעה נמחקת" }, { en: "The message becomes visible again and may be processed concurrently by another consumer", he: "ההודעה חוזרת להיות גלויה ועלולה להיות מעובדת במקביל ע\"י consumer אחר" }, { en: "SQS extends it automatically", he: "SQS מאריך אוטומטית" }, { en: "It goes straight to the DLQ", he: "היא עוברת ישר ל-DLQ" } ],
      answer: 1, explain: { en: "SQS doesn't know you're still working; extend visibility or size the timeout to ~6× p99.", he: "SQS לא יודע שאתם עוד עובדים; מאריכים את ה-visibility או קובעים timeout של בערך פי 6 מ-p99." } },
    { q: { en: "How do you get strict ordering for each customer while keeping high parallelism?", he: "איך מקבלים סדר קשיח לכל לקוח ועדיין מקביליות גבוהה?" },
      options: [ { en: "Single partition / single consumer", he: "Partition אחד / consumer אחד" }, { en: "Use customer_id as the partition key / MessageGroupId", he: "להשתמש ב-customer_id כ-partition key / ‏MessageGroupId" }, { en: "Random keys", he: "Keys אקראיים" }, { en: "Priority queue", he: "Priority queue" } ],
      answer: 1, explain: { en: "Same key → same partition/group → ordered; different customers spread across partitions in parallel.", he: "אותו key → אותו partition/group → מסודר; לקוחות שונים מתפזרים על partitions במקביל." } },
    { q: { en: "Which is the most important metric to alert on for a work queue?", he: "על איזה metric הכי חשוב להתריע בתור עבודה?" },
      options: [ { en: "Number of producers", he: "מספר ה-producers" }, { en: "Age of the oldest message (plus DLQ depth > 0)", he: "הגיל של ההודעה הכי ישנה (ועוד DLQ depth > 0)" }, { en: "Message size", he: "גודל ההודעה" }, { en: "Broker CPU only", he: "רק CPU של ה-broker" } ],
      answer: 1, explain: { en: "Age directly measures how late work is (user impact); depth alone depends on throughput.", he: "הגיל מודד ישירות כמה העבודה מאחרת (השפעה על המשתמש); עומק לבד תלוי ב-throughput." } }
  ],
  playground: "queue",
  related: ["arch-queues", "arch-brokers", "staff-kafka-deep", "k8s-keda", "pr-idempotency", "pr-integration-styles", "pr-rate-limiters"]
});

INFRA.lessons.push({
  id: "pr-rate-limiters",
  track: "principal",
  order: 23,
  icon: "🚦",
  level: 3,
  minutes: 16,
  title: { en: "Rate Limiters: Algorithms, Placement, Distributed Limits & Load Shedding", he: "Rate limiters: אלגוריתמים, מיקום, מגבלות מבוזרות ו-load shedding" },
  tldr: {
    en: "A rate limiter decides who gets served when demand exceeds what you're willing to give — token bucket for bursts, sliding window for fairness, concurrency limits for slow work — enforced at several layers and always answered with 429 + Retry-After.",
    he: "Rate limiter מחליט מי מקבל שירות כשהביקוש גדול ממה שאתם מוכנים לתת — token bucket לפיקים, sliding window להוגנות, concurrency limits לעבודה איטית — נאכף בכמה שכבות ותמיד עונה 429 + Retry-After."
  },
  analogy: {
    en: "A nightclub bouncer. Fixed window: 'max 100 people per hour, counter resets on the hour' — so 100 rush in at 9:59 and another 100 at 10:00. Token bucket: the bouncer gets one wristband every 36 seconds and can hold up to 20 — a group of 20 can enter at once if the bouncer saved wristbands, but the long-run rate is fixed. Leaky bucket: a turnstile that lets exactly one person through every 36 seconds, everyone else lines up. A concurrency limiter: 'max 300 people inside right now' — doesn't matter how fast they arrive, only how many are in. Load shedding: on a packed night, VIPs still get in and everyone else is turned away politely.",
    he: "סלקטור במועדון. Fixed window: 'מקסימום 100 איש לשעה, המונה מתאפס כל שעה עגולה' — אז 100 נכנסים ב-21:59 ועוד 100 ב-22:00. Token bucket: הסלקטור מקבל צמיד אחד כל 36 שניות ויכול להחזיק עד 20 — קבוצה של 20 יכולה להיכנס בבת אחת אם הוא חסך צמידים, אבל הקצב לטווח ארוך קבוע. Leaky bucket: קרוסלה שמכניסה בדיוק אדם אחד כל 36 שניות, כל השאר בתור. Concurrency limiter: 'מקסימום 300 איש בפנים כרגע' — לא משנה כמה מהר מגיעים, רק כמה בפנים. Load shedding: בערב עמוס, ה-VIPs עדיין נכנסים וכל השאר מקבלים סירוב מנומס."
  },
  sections: [
    {
      h: { en: "Why limit at all — and what exactly", he: "למה להגביל בכלל — ומה בדיוק" },
      body: {
        en: `<ul>
<li><strong>Protect capacity</strong>: your DB handles 5,000 QPS; one buggy client loop sending 50,000 shouldn't take everyone down.</li>
<li><strong>Fairness / noisy neighbors</strong>: in multi-tenant systems, tenant A's batch import must not starve tenant B's interactive traffic.</li>
<li><strong>Cost control</strong>: every LLM call, SMS (≈$0.008–0.05 each) or map lookup costs money; a limit is a budget.</li>
<li><strong>Abuse &amp; security</strong>: credential stuffing (limit login attempts per IP <em>and</em> per username), scraping, OTP/SMS pumping fraud, enumeration.</li>
<li><strong>Commercial tiers</strong>: free = 60 req/min, pro = 1,000 req/min — the limiter is part of the product.</li>
</ul>
<p>Decide the <strong>key</strong> (API key, user id, tenant, IP, IP+route, global), the <strong>unit</strong> (requests, tokens, bytes, cost points — GitHub GraphQL charges points per query complexity; LLM APIs limit tokens/min), and the <strong>window</strong>. Quota (10,000/day, billing) and throttle (20/s, protection) are different limits and usually both exist.</p>
<blockquote>💡 Real world: GitHub REST = 5,000 req/hour per token; Stripe ≈ 100 read + 100 write ops/s in live mode; OpenAI/Anthropic limit both requests/min and tokens/min per tier. Read your providers' limits before you design, and publish your own.</blockquote>`,
        he: `<ul>
<li><strong>הגנה על קיבולת</strong>: ה-DB מחזיק 5,000 QPS; לולאה באגית של client ששולחת 50,000 לא אמורה להפיל את כולם.</li>
<li><strong>הוגנות / noisy neighbors</strong>: במערכות multi-tenant, ה-import של לקוח A לא אמור להרעיב את התעבורה האינטראקטיבית של לקוח B.</li>
<li><strong>שליטה בעלויות</strong>: כל קריאה ל-LLM, ‏SMS (≈$0.008–0.05 כל אחד) או שאילתת מפות עולה כסף; מגבלה היא תקציב.</li>
<li><strong>ניצול לרעה ואבטחה</strong>: credential stuffing (הגבלת ניסיונות login לפי IP <em>וגם</em> לפי שם משתמש), scraping, הונאת OTP/SMS pumping, ‏enumeration.</li>
<li><strong>Tiers מסחריים</strong>: חינם = 60 בקשות לדקה, pro = 1,000 — ה-limiter הוא חלק מהמוצר.</li>
</ul>
<p>מחליטים על ה-<strong>key</strong> (API key, ‏user id, ‏tenant, ‏IP, ‏IP+route, גלובלי), על ה-<strong>יחידה</strong> (בקשות, tokens, bytes, נקודות עלות — GraphQL של GitHub גובה נקודות לפי מורכבות ה-query; ‏APIs של LLM מגבילים tokens לדקה), ועל ה-<strong>חלון</strong>. Quota (10,000 ליום, חיוב) ו-throttle (20 לשנייה, הגנה) הן מגבלות שונות ובדרך כלל יש את שתיהן.</p>
<blockquote>💡 מהשטח: GitHub REST = 5,000 בקשות לשעה ל-token; ‏Stripe ≈ 100 קריאה + 100 כתיבה בשנייה ב-live mode; ‏OpenAI/Anthropic מגבילים גם בקשות לדקה וגם tokens לדקה לכל tier. תקראו את המגבלות של הספקים לפני שאתם מתכננים, ותפרסמו את שלכם.</blockquote>`
      }
    },
    {
      h: { en: "The algorithms, side by side", he: "האלגוריתמים, זה לצד זה" },
      body: {
        en: `<table>
<tr><th>Algorithm</th><th>How</th><th>Memory/key</th><th>Bursts</th><th>Weakness</th></tr>
<tr><td><strong>Fixed window</strong></td><td><code>INCR rl:{key}:{minute}</code>, reject if &gt; N</td><td>1 counter</td><td>Up to 2N at window edges</td><td>Boundary spike</td></tr>
<tr><td><strong>Sliding log</strong></td><td>Store each request timestamp (sorted set), count those in last W</td><td>N timestamps</td><td>Exact</td><td>Memory-heavy at high limits</td></tr>
<tr><td><strong>Sliding window counter</strong></td><td><code>prev × (1 − elapsed/W) + curr</code></td><td>2 counters</td><td>Smoothed approximation</td><td>Assumes uniform prev window (≈0.003% error at Cloudflare)</td></tr>
<tr><td><strong>Token bucket</strong></td><td>Bucket of capacity B refills at r/s; each request takes 1 token</td><td>tokens + timestamp</td><td>Allows bursts up to B</td><td>Two knobs to tune</td></tr>
<tr><td><strong>Leaky bucket</strong></td><td>Queue drains at fixed r/s; overflow rejected</td><td>queue</td><td>Smooths to a constant rate</td><td>Adds latency (queuing)</td></tr>
<tr><td><strong>GCRA</strong></td><td>Store one "theoretical arrival time" TAT; allow if now ≥ TAT − burst</td><td>1 timestamp</td><td>Like token bucket</td><td>Less intuitive math</td></tr>
</table>
<pre># token bucket, lazily refilled (no background timer needed)
import time
class TokenBucket:
    def __init__(self, rate_per_s: float, capacity: int):
        self.rate, self.cap = rate_per_s, capacity
        self.tokens, self.ts = float(capacity), time.monotonic()
    def allow(self, cost: float = 1.0) -&gt; bool:
        now = time.monotonic()
        self.tokens = min(self.cap, self.tokens + (now - self.ts) * self.rate)
        self.ts = now
        if self.tokens &gt;= cost:
            self.tokens -= cost
            return True
        return False

# sliding window counter estimate
def sliding_allowed(prev_count, curr_count, elapsed_in_window, window, limit):
    est = prev_count * (1 - elapsed_in_window / window) + curr_count
    return est &lt; limit</pre>
<blockquote>💡 Real world: AWS API Gateway and most cloud APIs use token bucket ("rate" + "burst"); NGINX <code>limit_req</code> is a leaky bucket (with <code>burst=</code> and <code>nodelay</code> making it token-bucket-like); Redis-cell and Stripe's limiter use GCRA/token bucket; Cloudflare uses sliding window counters at the edge.</blockquote>`,
        he: `<table>
<tr><th>אלגוריתם</th><th>איך</th><th>זיכרון ל-key</th><th>פיקים</th><th>חולשה</th></tr>
<tr><td><strong>Fixed window</strong></td><td><code>INCR rl:{key}:{minute}</code>, דוחים אם &gt; N</td><td>מונה 1</td><td>עד 2N בקצוות החלון</td><td>קפיצה בגבול החלון</td></tr>
<tr><td><strong>Sliding log</strong></td><td>שומרים timestamp לכל בקשה (sorted set), סופרים את אלה שב-W האחרון</td><td>N timestamps</td><td>מדויק</td><td>כבד בזיכרון במגבלות גבוהות</td></tr>
<tr><td><strong>Sliding window counter</strong></td><td><code>prev × (1 − elapsed/W) + curr</code></td><td>2 מונים</td><td>קירוב מוחלק</td><td>מניח חלון קודם אחיד (≈0.003% שגיאה ב-Cloudflare)</td></tr>
<tr><td><strong>Token bucket</strong></td><td>דלי בקיבולת B שמתמלא ב-r לשנייה; כל בקשה לוקחת token</td><td>tokens + timestamp</td><td>מאפשר פיקים עד B</td><td>שני כפתורים לכוונון</td></tr>
<tr><td><strong>Leaky bucket</strong></td><td>תור שמתרוקן בקצב קבוע r; גלישה נדחית</td><td>תור</td><td>מחליק לקצב קבוע</td><td>מוסיף latency (המתנה בתור)</td></tr>
<tr><td><strong>GCRA</strong></td><td>שומרים "זמן הגעה תאורטי" TAT אחד; מאשרים אם now ≥ TAT − burst</td><td>timestamp אחד</td><td>כמו token bucket</td><td>מתמטיקה פחות אינטואיטיבית</td></tr>
</table>
<pre># token bucket, lazily refilled (no background timer needed)
import time
class TokenBucket:
    def __init__(self, rate_per_s: float, capacity: int):
        self.rate, self.cap = rate_per_s, capacity
        self.tokens, self.ts = float(capacity), time.monotonic()
    def allow(self, cost: float = 1.0) -&gt; bool:
        now = time.monotonic()
        self.tokens = min(self.cap, self.tokens + (now - self.ts) * self.rate)
        self.ts = now
        if self.tokens &gt;= cost:
            self.tokens -= cost
            return True
        return False

# sliding window counter estimate
def sliding_allowed(prev_count, curr_count, elapsed_in_window, window, limit):
    est = prev_count * (1 - elapsed_in_window / window) + curr_count
    return est &lt; limit</pre>
<blockquote>💡 מהשטח: AWS API Gateway ורוב ה-APIs בענן משתמשים ב-token bucket ‏("rate" + "burst"); ‏<code>limit_req</code> של NGINX הוא leaky bucket (ו-<code>burst=</code> עם <code>nodelay</code> הופכים אותו לדומה ל-token bucket); ‏Redis-cell וה-limiter של Stripe משתמשים ב-GCRA/token bucket; ‏Cloudflare משתמשים ב-sliding window counters בקצה.</blockquote>`
      }
    },
    {
      h: { en: "Distributed rate limiting with Redis + Lua", he: "Rate limiting מבוזר עם Redis + Lua" },
      body: {
        en: `<p>With 30 API pods, a per-pod in-memory limiter of 100/s means the real limit is 3,000/s and changes with autoscaling. Options: (1) <strong>central store</strong> — Redis, atomic via Lua (one round-trip, ~0.3 ms in-region); (2) <strong>local limiter with limit/N</strong> — cheap, approximate, rebalanced as pods scale; (3) <strong>hybrid</strong> — local token batches leased from a central service (Envoy global rate limit service, Lyft's ratelimit).</p>
<pre>-- token_bucket.lua  KEYS[1]=bucket  ARGV: rate_per_s, capacity, now_ms, cost
local rate, cap = tonumber(ARGV[1]), tonumber(ARGV[2])
local now, cost = tonumber(ARGV[3]), tonumber(ARGV[4])
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts     = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = 0
if tokens &gt;= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return { allowed, math.floor(tokens) }</pre>
<pre>redis-cli --eval token_bucket.lua rl:apikey:abc123 , 10 20 1763035200123 1
1) (integer) 1      # allowed
2) (integer) 19     # tokens left</pre>
<p>Design decisions: use the <strong>server's</strong> clock consistently (or Redis <code>TIME</code>), shard keys across a Redis Cluster (hash tags if one script touches several keys), and decide the <strong>failure mode</strong>: if Redis is down, fail-open (serve, risk overload) for normal APIs, fail-closed for login/SMS/payments where abuse is costly.</p>
<blockquote>⚠️ Production tip: a hot key (one giant tenant) can make a single Redis shard the bottleneck. Mitigate with local pre-filtering, splitting the key into sub-buckets, or a per-pod local cache of "this key is currently blocked until T".</blockquote>`,
        he: `<p>עם 30 pods של API, ‏limiter בזיכרון של כל pod עם 100 לשנייה אומר שהמגבלה האמיתית היא 3,000 לשנייה ומשתנה עם ה-autoscaling. אפשרויות: (1) <strong>store מרכזי</strong> — Redis, אטומי דרך Lua (סבב אחד, ~0.3ms באותו region); (2) <strong>limiter מקומי עם limit/N</strong> — זול, מקורב, מתעדכן כשה-pods משתנים; (3) <strong>היברידי</strong> — מנות tokens מקומיות שמוחכרות משירות מרכזי (Envoy global rate limit service, ה-ratelimit של Lyft).</p>
<pre>-- token_bucket.lua  KEYS[1]=bucket  ARGV: rate_per_s, capacity, now_ms, cost
local rate, cap = tonumber(ARGV[1]), tonumber(ARGV[2])
local now, cost = tonumber(ARGV[3]), tonumber(ARGV[4])
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts     = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = 0
if tokens &gt;= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return { allowed, math.floor(tokens) }</pre>
<pre>redis-cli --eval token_bucket.lua rl:apikey:abc123 , 10 20 1763035200123 1
1) (integer) 1      # allowed
2) (integer) 19     # tokens left</pre>
<p>החלטות תכנון: להשתמש בשעון של ה<strong>שרת</strong> באופן עקבי (או <code>TIME</code> של Redis), לפזר keys על Redis Cluster (hash tags אם script אחד נוגע בכמה keys), ולהחליט על <strong>מצב הכשל</strong>: אם Redis למטה — fail-open (משרתים, מסתכנים בעומס) ל-APIs רגילים, ו-fail-closed ל-login/SMS/תשלומים שבהם ניצול לרעה יקר.</p>
<blockquote>⚠️ טיפ לפרודקשן: hot key (tenant ענק אחד) יכול להפוך shard אחד של Redis לצוואר בקבוק. מתמודדים עם סינון מקומי מוקדם, פיצול ה-key ל-sub-buckets, או cache מקומי בכל pod של "ה-key הזה חסום עד T".</blockquote>`
      }
    },
    {
      h: { en: "Where to place limiters, and how to answer", he: "איפה למקם limiters, ואיך לענות" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Limits</th><th>Example</th></tr>
<tr><td>Edge / CDN / WAF</td><td>Per-IP floods, bots, L7 DDoS</td><td>Cloudflare rate limiting rules, AWS WAF rate-based rule (per 5 min)</td></tr>
<tr><td>API gateway / ingress</td><td>Per API key / tenant / plan</td><td>Kong, Apigee, AWS API Gateway usage plans, NGINX <code>limit_req</code></td></tr>
<tr><td>Service</td><td>Per-user business rules, expensive endpoints, concurrency</td><td>"5 password resets/hour", "max 2 concurrent exports per tenant"</td></tr>
<tr><td>Before each dependency</td><td>Protect DB / downstream / vendor quotas</td><td>Client-side limiter to stay under Twilio's 100 msg/s</td></tr>
</table>
<pre>HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=0;t=12
Content-Type: application/problem+json

{"type":"https://api.example.com/errors/rate-limited","title":"Too many requests",
 "detail":"Limit 100 requests per 60s for key ak_...c123. Retry in 12s."}</pre>
<p>(The IETF <code>RateLimit</code>/<code>RateLimit-Policy</code> headers replace the older de facto <code>X-RateLimit-Limit/Remaining/Reset</code> trio that GitHub and many others still send.) Use <strong>429</strong> for a client exceeding its limit; <strong>503</strong> + Retry-After when <em>you</em> are overloaded regardless of the client.</p>
<pre># NGINX: 10 r/s per IP, burst 20 served immediately, excess -&gt; 429
limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;
server {
  location /api/ {
    limit_req zone=perip burst=20 nodelay;
    limit_req_status 429;
  }
}</pre>`,
        he: `<table>
<tr><th>שכבה</th><th>מה מגבילים</th><th>דוגמה</th></tr>
<tr><td>Edge / CDN / WAF</td><td>הצפות לפי IP, בוטים, DDoS ב-L7</td><td>Cloudflare rate limiting rules, ‏AWS WAF rate-based rule (לכל 5 דקות)</td></tr>
<tr><td>API gateway / ingress</td><td>לפי API key / tenant / תוכנית</td><td>Kong, ‏Apigee, ‏usage plans ב-AWS API Gateway, ‏NGINX ‏<code>limit_req</code></td></tr>
<tr><td>Service</td><td>חוקים עסקיים למשתמש, endpoints יקרים, concurrency</td><td>"5 איפוסי סיסמה לשעה", "מקסימום 2 exports במקביל ל-tenant"</td></tr>
<tr><td>לפני כל תלות</td><td>הגנה על DB / downstream / quotas של ספקים</td><td>Limiter בצד ה-client כדי להישאר מתחת ל-100 הודעות לשנייה של Twilio</td></tr>
</table>
<pre>HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=0;t=12
Content-Type: application/problem+json

{"type":"https://api.example.com/errors/rate-limited","title":"Too many requests",
 "detail":"Limit 100 requests per 60s for key ak_...c123. Retry in 12s."}</pre>
<p>(ה-headers של IETF ‏<code>RateLimit</code>/<code>RateLimit-Policy</code> מחליפים את השלישייה הישנה <code>X-RateLimit-Limit/Remaining/Reset</code> ש-GitHub ורבים אחרים עדיין שולחים.) משתמשים ב-<strong>429</strong> כש-client חורג מהמגבלה שלו; ‏<strong>503</strong> + Retry-After כש<em>אתם</em> בעומס בלי קשר ל-client.</p>
<pre># NGINX: 10 r/s per IP, burst 20 served immediately, excess -&gt; 429
limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;
server {
  location /api/ {
    limit_req zone=perip burst=20 nodelay;
    limit_req_status 429;
  }
}</pre>`
      }
    },
    {
      h: { en: "Beyond fixed limits: concurrency limits, adaptive limits, load shedding", he: "מעבר למגבלות קבועות: concurrency limits, מגבלות אדפטיביות ו-load shedding" },
      body: {
        en: `<p>Rate (req/s) is the wrong unit when request cost varies: 100 req/s of 5 ms lookups is easy, 100 req/s of 3-second reports melts you. <strong>Concurrency limiting</strong> caps in-flight work (a semaphore / bulkhead): by Little's law, in-flight = throughput × latency, so if latency rises the limiter automatically admits fewer per second.</p>
<ul>
<li><strong>Adaptive concurrency</strong> (Netflix <code>concurrency-limits</code>, Envoy adaptive concurrency filter): measure latency, grow the limit while latency stays near the minimum (TCP-Vegas/AIMD style), shrink it when queues build. No hand-tuned magic number.</li>
<li><strong>Load shedding by priority</strong>: when overloaded, drop the least important traffic first — background sync &lt; prefetch &lt; browsing &lt; checkout &lt; health checks. Reject early (at the edge) and cheaply; a rejected request should cost ~1% of a served one.</li>
<li><strong>Deadline propagation</strong>: drop work whose caller already gave up (gRPC deadlines) — it's pure waste during overload.</li>
</ul>
<p><strong>Being a good client</strong> of someone else's limit: read their headers, pace yourself proactively with your own token bucket set slightly below their limit, back off with jitter on 429, honor Retry-After, batch requests, cache responses, and spread scheduled jobs (don't fire everything at :00).</p>
<blockquote>💡 Real world: Google SRE's "client-side throttling" has clients track their own accept ratio and locally reject with probability max(0, (requests − K×accepts)/(requests+1)) — overloaded backends stop receiving traffic that would be rejected anyway. See <code>#/lesson/staff-overload-metastable</code>.</blockquote>`,
        he: `<p>קצב (בקשות לשנייה) הוא יחידה שגויה כשעלות הבקשות משתנה: 100 בקשות לשנייה של lookups של 5ms זה קל, 100 לשנייה של דוחות של 3 שניות ממיס אתכם. <strong>Concurrency limiting</strong> מגביל עבודה in-flight (semaphore / bulkhead): לפי חוק Little, ‏in-flight = throughput × latency, כך שאם ה-latency עולה, ה-limiter אוטומטית מקבל פחות בקשות לשנייה.</p>
<ul>
<li><strong>Adaptive concurrency</strong> (‏<code>concurrency-limits</code> של Netflix, ה-adaptive concurrency filter של Envoy): מודדים latency, מגדילים את המגבלה כל עוד ה-latency קרוב למינימום (בסגנון TCP-Vegas/AIMD), ומקטינים כשתורים נבנים. בלי מספר קסם שמכוונים ידנית.</li>
<li><strong>Load shedding לפי עדיפות</strong>: בעומס, זורקים קודם את התעבורה הכי פחות חשובה — סנכרון ברקע &lt; prefetch &lt; גלישה &lt; checkout &lt; health checks. דוחים מוקדם (בקצה) ובזול; בקשה שנדחתה צריכה לעלות ~1% מבקשה שקיבלה שירות.</li>
<li><strong>Deadline propagation</strong>: זורקים עבודה שה-caller שלה כבר ויתר (gRPC deadlines) — זה בזבוז טהור בזמן עומס.</li>
</ul>
<p><strong>להיות client טוב</strong> של מגבלה של מישהו אחר: לקרוא את ה-headers שלהם, לווסת את עצמכם מראש עם token bucket משלכם מעט מתחת למגבלה שלהם, backoff עם jitter על 429, לכבד Retry-After, לאגד בקשות ל-batch, לעשות cache לתשובות, ולפזר jobs מתוזמנים (לא לירות הכול ב-:00).</p>
<blockquote>💡 מהשטח: ה-"client-side throttling" של Google SRE גורם ל-clients לעקוב אחרי יחס הקבלה שלהם ולדחות מקומית בהסתברות max(0, (requests − K×accepts)/(requests+1)) — backends בעומס מפסיקים לקבל תעבורה שממילא הייתה נדחית. ראו <code>#/lesson/staff-overload-metastable</code>.</blockquote>`
      }
    }
  ],
  diagram: `internet ─▶ [CDN/WAF: per-IP 2000/5min] ─▶ [Gateway: per API key, token bucket r=100/s b=200]
                                                 │  Redis+Lua shared state (fail-open)
                                                 ▼
                         [Service: concurrency limit 64 in-flight, priority shedding]
                                │                          │
                       [limiter 4000 QPS]          [client-side limiter 90/s]
                                ▼                          ▼
                             Postgres              Twilio (limit 100/s)
  reject = 429 + Retry-After (client over limit)   |  503 + Retry-After (we are overloaded)`,
  handsOn: [
    { cmd: "for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/; done",
      what: { en: "Hammer an NGINX endpoint with limit_req configured: watch 200s turn into 429s once the burst is used up.", he: "מפציצים endpoint של NGINX עם limit_req: רואים איך 200 הופכים ל-429 אחרי שה-burst נגמר." } },
    { cmd: "curl -sI https://api.github.com/rate_limit | grep -i ratelimit",
      what: { en: "See a real provider's limit headers: x-ratelimit-limit, -remaining, -used, -reset (epoch seconds).", he: "רואים את ה-headers של ספק אמיתי: x-ratelimit-limit, ‏-remaining, ‏-used, ‏-reset (שניות epoch)." } },
    { cmd: "redis-cli --eval token_bucket.lua rl:apikey:abc123 , 10 20 $(date +%s%3N) 1",
      what: { en: "Run the Lua token bucket repeatedly; tokens drop by 1 per call and refill at 10/s. Try cost=5 for an expensive endpoint.", he: "מריצים את ה-token bucket ב-Lua שוב ושוב; ה-tokens יורדים ב-1 בכל קריאה ומתמלאים ב-10 לשנייה. נסו cost=5 ל-endpoint יקר." } },
    { cmd: "hey -z 20s -q 50 -c 10 http://localhost:8080/api/orders",
      what: { en: "Load-test at a controlled rate (10 workers × 50 qps) and check the status-code distribution and latency histogram hey prints.", he: "בדיקת עומס בקצב מבוקר (10 workers × 50 qps) ובודקים את התפלגות קודי הסטטוס וה-histogram של ה-latency ש-hey מדפיס." } }
  ],
  mnemonic: { en: "\"Bucket for bursts, window for fairness, semaphore for slowness — answer 429 and say when.\"", he: "\"דלי לפיקים, חלון להוגנות, semaphore לאיטיות — עונים 429 ואומרים מתי.\"" },
  pitfalls: [
    { en: "Per-pod in-memory limits in an autoscaled fleet: the effective limit silently grows with replica count.", he: "מגבלות בזיכרון של כל pod בצי עם autoscaling: המגבלה האפקטיבית גדלה בשקט עם מספר ה-replicas." },
    { en: "Rate-limiting login only per IP: attackers rotate through thousands of residential IPs. Also limit per username/account and per device fingerprint.", he: "להגביל login רק לפי IP: תוקפים מחליפים אלפי IPs ביתיים. מגבילים גם לפי שם משתמש/חשבון ולפי טביעת מכשיר." },
    { en: "Returning 429 without Retry-After — clients guess, retry immediately, and you get a retry storm against an already-limited key.", he: "להחזיר 429 בלי Retry-After — ה-clients מנחשים, עושים retry מיד, ומקבלים retry storm על key שכבר מוגבל." },
    { en: "Limiting only requests/s for endpoints with wildly different cost (search vs export) — use cost-weighted tokens or concurrency limits.", he: "להגביל רק בקשות לשנייה ל-endpoints עם עלות שונה מאוד (חיפוש מול export) — משתמשים ב-tokens משוקללים לפי עלות או ב-concurrency limits." }
  ],
  interview: [
    { q: { en: "Design a rate limiter for a public API with free and paid tiers across 3 regions.", he: "תכננו rate limiter ל-API ציבורי עם tiers חינמי ובתשלום על פני 3 regions." },
      a: { en: "Key = API key; policy from the plan (cached config). Token bucket per key in a regional Redis cluster via Lua (sub-ms), enforced at the gateway. Per-region limits = global/3 or dynamic shares synced every few seconds — exact global counting across regions costs 50–150 ms per request, not worth it. Fail-open on Redis errors with a local fallback limiter. Return 429 + Retry-After + RateLimit headers. Separate daily quotas counted async for billing. Edge WAF per-IP limits against floods, and metrics on rejections per key to spot abuse or customers who need an upgrade.", he: "Key = API key; ה-policy מהתוכנית (config ב-cache). ‏Token bucket לכל key ב-Redis cluster אזורי דרך Lua (פחות ממילישנייה), נאכף ב-gateway. מגבלה לכל region = גלובלי/3 או נתחים דינמיים שמסונכרנים כל כמה שניות — ספירה גלובלית מדויקת בין regions עולה 50–150ms לבקשה, לא שווה. Fail-open בשגיאות Redis עם limiter מקומי כגיבוי. מחזירים 429 + Retry-After + RateLimit headers. Quotas יומיות נפרדות שנספרות async לחיוב. מגבלות WAF לפי IP בקצה נגד הצפות, ו-metrics על דחיות לפי key כדי לזהות ניצול לרעה או לקוחות שצריכים שדרוג." } },
    { q: { en: "Token bucket vs leaky bucket — when would you choose each?", he: "Token bucket מול leaky bucket — מתי תבחרו כל אחד?" },
      a: { en: "Token bucket when you want to allow short bursts but cap the average (APIs, user actions). Leaky bucket when the downstream needs a smooth constant rate and you'd rather queue than reject (sending to an SMS provider at exactly 100/s, network traffic shaping).", he: "Token bucket כשרוצים לאפשר פיקים קצרים אבל להגביל את הממוצע (APIs, פעולות משתמש). Leaky bucket כשה-downstream צריך קצב קבוע וחלק ועדיף להכניס לתור מאשר לדחות (שליחה לספק SMS בדיוק 100 לשנייה, traffic shaping ברשת)." } }
  ],
  quiz: [
    { q: { en: "A fixed window limiter allows 100 req/min. What's the worst-case burst?", he: "Fixed window limiter מאפשר 100 בקשות לדקה. מה הפיק הגרוע ביותר?" },
      options: [ { en: "100 in a minute", he: "100 בדקה" }, { en: "~200 within a couple of seconds around the window boundary", he: "~200 תוך כמה שניות סביב גבול החלון" }, { en: "50", he: "50" }, { en: "Unlimited", he: "בלי הגבלה" } ],
      answer: 1, explain: { en: "100 at 0:59 and 100 at 1:00 both pass — the classic boundary problem sliding windows fix.", he: "100 ב-0:59 ו-100 ב-1:00 עוברים שניהם — בעיית הגבול הקלאסית ש-sliding windows פותרים." } },
    { q: { en: "Which algorithm stores only one timestamp per key and behaves like a token bucket?", he: "איזה אלגוריתם שומר רק timestamp אחד ל-key ומתנהג כמו token bucket?" },
      options: [ { en: "Sliding log", he: "Sliding log" }, { en: "GCRA", he: "GCRA" }, { en: "Fixed window", he: "Fixed window" }, { en: "Leaky bucket queue", he: "Leaky bucket queue" } ],
      answer: 1, explain: { en: "GCRA tracks a theoretical arrival time — minimal state, token-bucket semantics.", he: "GCRA עוקב אחרי זמן הגעה תאורטי — state מינימלי, סמנטיקה של token bucket." } },
    { q: { en: "Your Redis used by the limiter is down. What should the login endpoint do?", he: "ה-Redis של ה-limiter נפל. מה ה-endpoint של login צריך לעשות?" },
      options: [ { en: "Fail-open: allow everything", he: "Fail-open: לאשר הכול" }, { en: "Fail-closed or use a strict local fallback limit — abuse here is costly", he: "Fail-closed או מגבלה מקומית קשוחה כגיבוי — ניצול לרעה כאן יקר" }, { en: "Restart the pods", he: "להפעיל מחדש את ה-pods" }, { en: "Disable TLS", he: "לבטל TLS" } ],
      answer: 1, explain: { en: "Security-sensitive endpoints (login, OTP/SMS, payments) should not become unlimited during a limiter outage.", he: "Endpoints רגישים לאבטחה (login, ‏OTP/SMS, תשלומים) לא אמורים להפוך לבלתי מוגבלים בזמן תקלה ב-limiter." } },
    { q: { en: "Why are concurrency limits better than rate limits for an endpoint whose latency varies from 10 ms to 10 s?", he: "למה concurrency limits עדיפים על rate limits ל-endpoint שה-latency שלו נע בין 10ms ל-10 שניות?" },
      options: [ { en: "They are easier to implement in CSS", he: "קל יותר לממש אותם ב-CSS" }, { en: "They cap in-flight work, so admitted throughput automatically drops when latency rises (Little's law)", he: "הם מגבילים עבודה in-flight, אז ה-throughput המתקבל יורד אוטומטית כשה-latency עולה (חוק Little)" }, { en: "They never reject requests", he: "הם אף פעם לא דוחים בקשות" }, { en: "They don't need any state", he: "הם לא צריכים state" } ],
      answer: 1, explain: { en: "In-flight = throughput × latency; capping in-flight bounds resource use regardless of per-request cost.", he: "In-flight = throughput × latency; הגבלת ה-in-flight חוסמת את צריכת המשאבים בלי קשר לעלות של כל בקשה." } }
  ],
  related: ["arch-api-gateway", "arch-resilience", "staff-overload-metastable", "redis-deep", "pr-third-party-deps", "pr-queue-kinds"]
});

INFRA.lessons.push({
  id: "pr-third-party-deps",
  track: "principal",
  order: 24,
  icon: "🧩",
  level: 3,
  minutes: 17,
  title: { en: "Depending on Third-Party Providers: Timeouts, Breakers, Fallbacks & SLA Math", he: "תלות בספקים חיצוניים: timeouts, ‏circuit breakers, ‏fallbacks וחשבון SLA" },
  tldr: {
    en: "Every external provider (payments, SMS, email, maps, LLMs, auth) is a part of your system you don't control: bound how long you wait, how much you retry and how far its failure spreads, decide in advance what you do without it, and do the availability math before you promise an SLA.",
    he: "כל ספק חיצוני (תשלומים, SMS, מייל, מפות, LLMs, ‏auth) הוא חלק מהמערכת שלכם שאתם לא שולטים בו: מגבילים כמה זמן מחכים, כמה עושים retry ועד כמה הכשל שלו מתפשט, מחליטים מראש מה עושים בלעדיו, ועושים את חשבון הזמינות לפני שמבטיחים SLA."
  },
  analogy: {
    en: "A restaurant that depends on suppliers. You don't wait at the door all night for the fish truck (timeout). If the fish supplier failed the last 5 deliveries, you stop calling them for a while and take fish off the menu (circuit breaker + graceful degradation). You keep two vegetable suppliers so one strike doesn't close you (multi-provider). Fish and vegetables come through separate doors, so a fish-truck jam doesn't block the vegetables (bulkhead). And before promising guests 'open every day', you check how reliable all your suppliers are together — because you're only as open as the weakest link.",
    he: "מסעדה שתלויה בספקים. לא מחכים בדלת כל הלילה למשאית הדגים (timeout). אם ספק הדגים פספס את 5 המשלוחים האחרונים, מפסיקים להתקשר אליו לזמן מה ומורידים דגים מהתפריט (circuit breaker + graceful degradation). מחזיקים שני ספקי ירקות כדי ששביתה אחת לא תסגור אתכם (multi-provider). דגים וירקות נכנסים בדלתות נפרדות, כך שפקק של משאית הדגים לא חוסם את הירקות (bulkhead). ולפני שמבטיחים לאורחים 'פתוח כל יום', בודקים כמה אמינים כל הספקים יחד — כי אתם פתוחים רק כמו החוליה החלשה."
  },
  sections: [
    {
      h: { en: "Availability math: you inherit your dependencies' failures", he: "חשבון זמינות: יורשים את הכשלים של התלויות" },
      body: {
        en: `<p><strong>In series</strong> (all must work): A = A₁ × A₂ × … × Aₙ. <strong>In parallel</strong> (any one is enough, independent failures): A = 1 − (1 − A₁)(1 − A₂)…</p>
<table>
<tr><th>Setup</th><th>Math</th><th>Availability</th><th>Downtime / month</th></tr>
<tr><td>Your service alone</td><td>0.9995</td><td>99.95%</td><td>~22 min</td></tr>
<tr><td>+ payment PSP (99.95%), SMS (99.9%), maps (99.9%) all synchronous in checkout</td><td>0.9995 × 0.9995 × 0.999 × 0.999</td><td>≈ 99.70%</td><td>~2.2 h</td></tr>
<tr><td>Same, but SMS &amp; maps made async/optional</td><td>0.9995 × 0.9995</td><td>≈ 99.90%</td><td>~43 min</td></tr>
<tr><td>Two PSPs with failover (99.95% each)</td><td>1 − 0.0005²</td><td>≈ 99.99997% (theory)</td><td>seconds — if failover works and failures are independent</td></tr>
</table>
<p>Lessons: (1) you cannot promise a higher SLA than your <em>synchronous critical path</em> allows; (2) the cheapest availability boost is <strong>removing dependencies from the critical path</strong> (async, cache, optional); (3) redundancy only helps if failures are independent — two "different" providers on the same cloud region, or both resold from the same SMS aggregator, fail together.</p>
<blockquote>💡 Real world: vendor SLAs are <em>refund policies</em>, not engineering guarantees: "99.9% or 10% service credit". Their status page is often green while your calls fail from your region. Measure the provider yourself (per-dependency SLIs) and design for the reality you observe.</blockquote>`,
        he: `<p><strong>בטור</strong> (כולם חייבים לעבוד): A = A₁ × A₂ × … × Aₙ. ‏<strong>במקביל</strong> (מספיק אחד, כשלים בלתי תלויים): A = 1 − (1 − A₁)(1 − A₂)…</p>
<table>
<tr><th>תצורה</th><th>חישוב</th><th>זמינות</th><th>Downtime לחודש</th></tr>
<tr><td>השירות שלכם לבד</td><td>0.9995</td><td>99.95%</td><td>~22 דק'</td></tr>
<tr><td>+ PSP לתשלומים (99.95%), ‏SMS ‏(99.9%), מפות (99.9%) כולם סינכרוניים ב-checkout</td><td>0.9995 × 0.9995 × 0.999 × 0.999</td><td>≈ 99.70%</td><td>~2.2 שעות</td></tr>
<tr><td>אותו דבר, אבל SMS ומפות async/אופציונליים</td><td>0.9995 × 0.9995</td><td>≈ 99.90%</td><td>~43 דק'</td></tr>
<tr><td>שני PSPs עם failover (99.95% כל אחד)</td><td>1 − 0.0005²</td><td>≈ 99.99997% (בתיאוריה)</td><td>שניות — אם ה-failover עובד והכשלים בלתי תלויים</td></tr>
</table>
<p>מסקנות: (1) אי אפשר להבטיח SLA גבוה ממה שה-<em>critical path הסינכרוני</em> מאפשר; (2) השיפור הכי זול בזמינות הוא <strong>להוציא תלויות מה-critical path</strong> (async, ‏cache, אופציונלי); (3) redundancy עוזר רק אם הכשלים בלתי תלויים — שני ספקים "שונים" על אותו region בענן, או ששניהם מוכרים מחדש את אותו SMS aggregator, נופלים יחד.</p>
<blockquote>💡 מהשטח: SLAs של ספקים הם <em>מדיניות החזרים</em>, לא הבטחה הנדסית: "99.9% או 10% זיכוי". דף הסטטוס שלהם לעתים קרובות ירוק בזמן שהקריאות שלכם נכשלות מה-region שלכם. מודדים את הספק בעצמכם (SLIs לכל תלות) ומתכננים לפי המציאות שרואים.</blockquote>`
      }
    },
    {
      h: { en: "Timeouts and retries: bound the waiting", he: "Timeouts ו-retries: להגביל את ההמתנה" },
      body: {
        en: `<p>The default timeout of many HTTP clients is <strong>infinite</strong> (Python <code>requests</code>, Go <code>http.Client{}</code>) or very long (Java's often 0 = forever). A provider that hangs without failing will exhaust your threads/connections and take you down — a slow dependency is worse than a dead one.</p>
<ul>
<li><strong>Connect timeout</strong> short (0.5–2 s): a healthy endpoint accepts TCP+TLS fast.</li>
<li><strong>Read/response timeout</strong> from the provider's measured p99 + margin (e.g. p99 = 800 ms → 2 s), not from hope.</li>
<li><strong>Overall deadline / budget</strong>: the user's request has 3 s total; if 2.5 s are spent, don't start a 2 s call — fail fast or degrade. Propagate deadlines downstream.</li>
<li><strong>Retries</strong>: only idempotent operations (or with an idempotency key — see <code>#/lesson/pr-idempotency</code>), max 2–3, exponential backoff + jitter, honor 429/Retry-After, and a retry budget. Hedged requests (send a 2nd copy after p95) only for idempotent reads.</li>
</ul>
<pre># Python (httpx): explicit, separate timeouts + a pooled, bounded client
import httpx
psp = httpx.Client(
    base_url="https://api.psp.example",
    timeout=httpx.Timeout(connect=1.0, read=2.5, write=2.0, pool=0.5),
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
)</pre>
<blockquote>⚠️ Production tip: payment authorizations are the exception to "short timeouts" — a timed-out charge is in an <em>unknown</em> state. Use a generous timeout, an idempotency key, and a status-check/reconciliation path ("GET payment by my reference") rather than blindly retrying or assuming failure.</blockquote>`,
        he: `<p>ה-timeout ברירת המחדל של הרבה HTTP clients הוא <strong>אינסופי</strong> (‏<code>requests</code> בפייתון, ‏<code>http.Client{}</code> ב-Go) או ארוך מאוד (ב-Java לרוב 0 = לנצח). ספק שנתקע בלי להיכשל ימצה את ה-threads/connections שלכם ויפיל אתכם — תלות איטית גרועה מתלות מתה.</p>
<ul>
<li><strong>Connect timeout</strong> קצר (0.5–2 שניות): endpoint בריא מקבל TCP+TLS מהר.</li>
<li><strong>Read/response timeout</strong> לפי ה-p99 שנמדד אצל הספק + מרווח (למשל p99 = 800ms → ‏2 שניות), לא לפי תקווה.</li>
<li><strong>Deadline / budget כולל</strong>: לבקשת המשתמש יש 3 שניות בסך הכול; אם עברו 2.5 — לא מתחילים קריאה של 2 שניות, נכשלים מהר או עושים degrade. מעבירים deadlines הלאה.</li>
<li><strong>Retries</strong>: רק לפעולות אידמפוטנטיות (או עם idempotency key — ראו <code>#/lesson/pr-idempotency</code>), מקסימום 2–3, exponential backoff + jitter, לכבד 429/Retry-After, ו-retry budget. Hedged requests (לשלוח עותק שני אחרי p95) רק לקריאות אידמפוטנטיות.</li>
</ul>
<pre># Python (httpx): explicit, separate timeouts + a pooled, bounded client
import httpx
psp = httpx.Client(
    base_url="https://api.psp.example",
    timeout=httpx.Timeout(connect=1.0, read=2.5, write=2.0, pool=0.5),
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
)</pre>
<blockquote>⚠️ טיפ לפרודקשן: אישורי תשלום הם היוצא מן הכלל ל-"timeouts קצרים" — חיוב שהגיע ל-timeout נמצא במצב <em>לא ידוע</em>. משתמשים ב-timeout נדיב, ‏idempotency key, ונתיב בדיקת סטטוס/reconciliation ‏("GET payment by my reference") במקום retry עיוור או הנחה שזה נכשל.</blockquote>`
      }
    },
    {
      h: { en: "Circuit breakers and bulkheads: stop the bleeding", he: "Circuit breakers ו-bulkheads: לעצור את הדימום" },
      body: {
        en: `<p>A <strong>circuit breaker</strong> watches calls to one dependency. <strong>Closed</strong>: calls flow, failures counted. When the failure rate (or slow-call rate) over a window crosses a threshold → <strong>Open</strong>: calls fail immediately (no waiting, no load on the sick provider) and you run the fallback. After a cool-down → <strong>Half-open</strong>: let a few trial calls through; success → Closed, failure → Open again.</p>
<pre># resilience4j (Spring Boot application.yml)
resilience4j:
  circuitbreaker:
    instances:
      smsProvider:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 50
        minimumNumberOfCalls: 20
        failureRateThreshold: 50          # % failures to open
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 60         # % slow calls to open
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 5
  bulkhead:
    instances:
      smsProvider:
        maxConcurrentCalls: 20            # never more than 20 threads stuck on SMS
        maxWaitDuration: 50ms</pre>
<pre>// .NET Polly v8 resilience pipeline
var pipeline = new ResiliencePipelineBuilder&lt;HttpResponseMessage&gt;()
    .AddRetry(new() { MaxRetryAttempts = 2, BackoffType = DelayBackoffType.Exponential, UseJitter = true })
    .AddCircuitBreaker(new() { FailureRatio = 0.5, MinimumThroughput = 20,
                               SamplingDuration = TimeSpan.FromSeconds(30),
                               BreakDuration = TimeSpan.FromSeconds(30) })
    .AddTimeout(TimeSpan.FromSeconds(2))
    .Build();</pre>
<p>A <strong>bulkhead</strong> gives each dependency its own bounded pool (threads, connections, semaphore), so a hung maps API can only consume its 20 slots — checkout's PSP calls still have theirs. In Kubernetes you can go further and run the integration in a separate deployment with its own resources.</p>
<blockquote>💡 Real world: Netflix Hystrix popularized breaker + bulkhead + fallback per dependency; today it lives in resilience4j (Java), Polly (.NET), Envoy/Istio outlier detection and circuit breaking (mesh level, language-agnostic). See <code>#/lesson/arch-resilience</code> and <code>#/lesson/staff-service-mesh</code>.</blockquote>`,
        he: `<p><strong>Circuit breaker</strong> מנטר קריאות לתלות אחת. <strong>Closed</strong>: הקריאות זורמות, הכשלים נספרים. כשאחוז הכשלים (או הקריאות האיטיות) בחלון עובר סף → <strong>Open</strong>: הקריאות נכשלות מיד (בלי המתנה, בלי עומס על הספק החולה) ומריצים את ה-fallback. אחרי זמן צינון → <strong>Half-open</strong>: מעבירים כמה קריאות ניסיון; הצלחה → Closed, כשל → שוב Open.</p>
<pre># resilience4j (Spring Boot application.yml)
resilience4j:
  circuitbreaker:
    instances:
      smsProvider:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 50
        minimumNumberOfCalls: 20
        failureRateThreshold: 50          # % failures to open
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 60         # % slow calls to open
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 5
  bulkhead:
    instances:
      smsProvider:
        maxConcurrentCalls: 20            # never more than 20 threads stuck on SMS
        maxWaitDuration: 50ms</pre>
<pre>// .NET Polly v8 resilience pipeline
var pipeline = new ResiliencePipelineBuilder&lt;HttpResponseMessage&gt;()
    .AddRetry(new() { MaxRetryAttempts = 2, BackoffType = DelayBackoffType.Exponential, UseJitter = true })
    .AddCircuitBreaker(new() { FailureRatio = 0.5, MinimumThroughput = 20,
                               SamplingDuration = TimeSpan.FromSeconds(30),
                               BreakDuration = TimeSpan.FromSeconds(30) })
    .AddTimeout(TimeSpan.FromSeconds(2))
    .Build();</pre>
<p><strong>Bulkhead</strong> נותן לכל תלות pool מוגבל משלה (threads, connections, semaphore), כך ש-API מפות תקוע יכול לצרוך רק את 20 המקומות שלו — לקריאות ה-PSP של ה-checkout עדיין יש את שלהן. ב-Kubernetes אפשר ללכת רחוק יותר ולהריץ את האינטגרציה ב-deployment נפרד עם משאבים משלו.</p>
<blockquote>💡 מהשטח: Hystrix של Netflix הפך breaker + bulkhead + fallback לכל תלות לפופולרי; היום זה חי ב-resilience4j ‏(Java), ‏Polly ‏(.NET), ו-outlier detection ו-circuit breaking של Envoy/Istio (ברמת ה-mesh, בלי תלות בשפה). ראו <code>#/lesson/arch-resilience</code> ו-<code>#/lesson/staff-service-mesh</code>.</blockquote>`
      }
    },
    {
      h: { en: "Fallbacks, degradation, async and multi-provider", he: "Fallbacks, ‏degradation, ‏async ו-multi-provider" },
      body: {
        en: `<p>Decide the fallback <strong>per dependency, at design time</strong>, with the product owner — it's a business decision:</p>
<table>
<tr><th>Dependency down</th><th>Graceful degradation</th></tr>
<tr><td>Recommendations / ML ranking</td><td>Show cached or static "popular items"</td></tr>
<tr><td>Maps / geocoding</td><td>Accept the address as typed, geocode later from a queue</td></tr>
<tr><td>SMS for notifications</td><td>Queue and send later, or fall back to email/push</td></tr>
<tr><td>SMS for OTP login</td><td>Second SMS provider, or voice call / authenticator app</td></tr>
<tr><td>Payment provider</td><td>Route to secondary PSP; or accept order as "pending payment" for trusted customers</td></tr>
<tr><td>LLM API</td><td>Fail over to another model/provider; smaller model; or turn the AI feature off with a banner</td></tr>
<tr><td>Identity provider (SSO)</td><td>Existing sessions keep working (long-lived tokens validated locally via cached JWKS)</td></tr>
</table>
<ul>
<li><strong>Go async</strong> whenever the user doesn't need the result now: put the call behind a queue; the provider's outage becomes a backlog instead of errors.</li>
<li><strong>Cache</strong> reference data (exchange rates, geocodes, feature catalogs) with stale-if-error: serve the last good value during an outage.</li>
<li><strong>Multi-provider</strong>: an abstraction (port/adapter) with two implementations, health-based routing and weights (e.g. 90/10 so the secondary stays warm and tested). Normalize their error codes and webhooks in an anti-corruption layer.</li>
</ul>
<blockquote>⚠️ Production tip: an untested fallback is a second outage waiting to happen. Exercise it: game days, chaos experiments that block the provider's hostname, and keep a slice of real traffic on the secondary provider.</blockquote>`,
        he: `<p>מחליטים על ה-fallback <strong>לכל תלות, בזמן התכנון</strong>, יחד עם ה-product owner — זו החלטה עסקית:</p>
<table>
<tr><th>התלות למטה</th><th>Graceful degradation</th></tr>
<tr><td>המלצות / דירוג ML</td><td>להציג "פריטים פופולריים" מ-cache או סטטיים</td></tr>
<tr><td>מפות / geocoding</td><td>לקבל את הכתובת כפי שהוקלדה ולעשות geocode אחר כך מתור</td></tr>
<tr><td>SMS להתראות</td><td>להכניס לתור ולשלוח אחר כך, או לעבור למייל/push</td></tr>
<tr><td>SMS ל-OTP בכניסה</td><td>ספק SMS שני, או שיחה קולית / אפליקציית authenticator</td></tr>
<tr><td>ספק תשלומים</td><td>ניתוב ל-PSP משני; או לקבל הזמנה כ-"ממתינה לתשלום" ללקוחות אמינים</td></tr>
<tr><td>LLM API</td><td>Failover למודל/ספק אחר; מודל קטן יותר; או לכבות את פיצ'ר ה-AI עם באנר</td></tr>
<tr><td>Identity provider (SSO)</td><td>Sessions קיימים ממשיכים לעבוד (tokens ארוכים שמאומתים מקומית מול JWKS ב-cache)</td></tr>
</table>
<ul>
<li><strong>לעבור ל-async</strong> בכל פעם שהמשתמש לא צריך את התוצאה עכשיו: שמים את הקריאה מאחורי תור; התקלה של הספק הופכת ל-backlog במקום לשגיאות.</li>
<li><strong>Cache</strong> לנתוני ייחוס (שערי מטבע, geocodes, קטלוגים) עם stale-if-error: מגישים את הערך הטוב האחרון בזמן תקלה.</li>
<li><strong>Multi-provider</strong>: הפשטה (port/adapter) עם שני מימושים, routing לפי בריאות ומשקלים (למשל 90/10 כדי שהמשני יישאר חם ונבדק). מנרמלים את קודי השגיאה וה-webhooks שלהם ב-anti-corruption layer.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: fallback שלא נבדק הוא תקלה שנייה שמחכה לקרות. מתרגלים אותו: game days, ניסויי chaos שחוסמים את ה-hostname של הספק, ומשאירים נתח מתעבורה אמיתית על הספק המשני.</blockquote>`
      }
    },
    {
      h: { en: "Operating a dependency: quotas, secrets, testing, monitoring, exit", he: "תפעול תלות: quotas, ‏secrets, בדיקות, ניטור ויציאה" },
      body: {
        en: `<ul>
<li><strong>Quotas &amp; limits</strong>: know them (req/s, tokens/min, daily caps, message size) and enforce a client-side limiter slightly below; alert at 70–80% of quota; request increases <em>before</em> Black Friday — they can take days.</li>
<li><strong>Secrets</strong>: API keys in a secret manager (Vault, AWS Secrets Manager, Key Vault), never in code or images; one key per environment and per service; support two active keys so you can <strong>rotate</strong> with zero downtime; restrict keys by IP/scope where the vendor allows.</li>
<li><strong>Testing</strong>: unit tests against a fake/adapter interface; contract tests (Pact, or recorded fixtures validated against the vendor's OpenAPI) to catch schema changes; integration tests against the vendor sandbox in CI (nightly — sandboxes are flaky); WireMock/Toxiproxy to inject latency, 500s and resets.</li>
<li><strong>Monitoring</strong>: per-dependency RED metrics (rate, errors by code, latency p50/p99) labeled by provider and endpoint; breaker state as a metric; synthetic checks from each region; subscribe to vendor status feeds into your incident channel; a dashboard row per dependency so on-call can say "it's Twilio" in 30 seconds.</li>
<li><strong>Lock-in &amp; exit strategy</strong>: keep vendor SDK calls behind your own interface, store your canonical data in your DB (not only in the vendor), know the export path and the contract's termination terms. Lock-in isn't evil — it's a price; know what you're paying.</li>
<li><strong>Build vs buy</strong>: buy what isn't your differentiator (email delivery, payments, auth) unless scale makes the bill bigger than a team, compliance forbids it, or the vendor's limits block your product.</li>
</ul>
<pre># Prometheus: error ratio per external dependency over 5m
sum by (dependency) (rate(http_client_requests_total{status=~"5..|timeout"}[5m]))
/
sum by (dependency) (rate(http_client_requests_total[5m]))</pre>
<blockquote>💡 Real world: when a major cloud or CDN provider has an outage, half the internet fails at once — those whose designs survived had decided "what do we do without X?" long before, and had practiced it.</blockquote>`,
        he: `<ul>
<li><strong>Quotas ומגבלות</strong>: להכיר אותן (בקשות לשנייה, tokens לדקה, תקרות יומיות, גודל הודעה) ולאכוף limiter בצד ה-client מעט מתחת; התראה ב-70–80% מה-quota; לבקש הגדלה <em>לפני</em> Black Friday — זה יכול לקחת ימים.</li>
<li><strong>Secrets</strong>: API keys ב-secret manager ‏(Vault, ‏AWS Secrets Manager, ‏Key Vault), אף פעם לא בקוד או ב-images; key אחד לכל סביבה ולכל שירות; תמיכה בשני keys פעילים כדי לעשות <strong>rotation</strong> בלי downtime; הגבלת keys לפי IP/scope כשהספק מאפשר.</li>
<li><strong>בדיקות</strong>: unit tests מול fake/ממשק adapter; ‏contract tests ‏(Pact, או fixtures מוקלטים שמאומתים מול ה-OpenAPI של הספק) כדי לתפוס שינויי schema; ‏integration tests מול ה-sandbox של הספק ב-CI (לילי — sandboxes לא יציבים); ‏WireMock/Toxiproxy כדי להזריק latency, ‏500s ו-resets.</li>
<li><strong>ניטור</strong>: RED metrics לכל תלות (קצב, שגיאות לפי קוד, latency ‏p50/p99) עם labels של ספק ו-endpoint; מצב ה-breaker כ-metric; ‏synthetic checks מכל region; הרשמה ל-status feeds של הספקים לערוץ התקלות; שורה בדשבורד לכל תלות כדי שה-on-call יוכל להגיד "זה Twilio" תוך 30 שניות.</li>
<li><strong>Lock-in ואסטרטגיית יציאה</strong>: להחזיק את קריאות ה-SDK של הספק מאחורי ממשק שלכם, לשמור את הנתונים הקנוניים ב-DB שלכם (לא רק אצל הספק), להכיר את נתיב ה-export ואת תנאי הסיום בחוזה. Lock-in הוא לא רע — הוא מחיר; תדעו מה אתם משלמים.</li>
<li><strong>Build מול buy</strong>: קונים את מה שלא מבדל אתכם (שליחת מיילים, תשלומים, auth), אלא אם בסקייל החשבון גדול מצוות, רגולציה אוסרת, או שהמגבלות של הספק חוסמות את המוצר.</li>
</ul>
<pre># Prometheus: error ratio per external dependency over 5m
sum by (dependency) (rate(http_client_requests_total{status=~"5..|timeout"}[5m]))
/
sum by (dependency) (rate(http_client_requests_total[5m]))</pre>
<blockquote>💡 מהשטח: כשספק ענן או CDN גדול נופל, חצי אינטרנט נופל איתו — מי שהעיצוב שלהם שרד החליטו "מה עושים בלי X?" הרבה לפני, ותרגלו את זה.</blockquote>`
      }
    }
  ],
  diagram: `checkout ──▶ [timeout 2.5s][retry x2 +jitter][breaker][bulkhead 50] ──▶ PSP primary (90%)
     │                                     │ open?                     └─▶ PSP secondary (10%, warm)
     │                                     └─▶ fallback: "pending payment" + reconcile
     ├──▶ queue ──▶ SMS worker ─[limiter 90/s]─▶ Twilio ✖ ─▶ fallback provider / email
     ├──▶ cache (stale-if-error) ◀── maps / FX rates
     └── metrics per dependency: rate · errors · p99 · breaker state · quota used %
  availability (sync path) = 0.9995 (you) × 0.9995 (PSP) ≈ 99.90%   ← async deps don't count`,
  handsOn: [
    { cmd: "python3 -c \"print(f'{0.9995*0.9995*0.999*0.999:.5f}', f'{1-(1-0.9995)**2:.7f}')\"",
      what: { en: "Do the series vs parallel availability math yourself: four sync dependencies vs two redundant providers.", he: "עושים בעצמכם את חשבון הזמינות בטור מול במקביל: ארבע תלויות סינכרוניות מול שני ספקים יתירים." } },
    { cmd: "curl -o /dev/null -s -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' --connect-timeout 1 --max-time 3 https://api.stripe.com/healthcheck",
      what: { en: "Measure where a provider's latency goes and practice explicit connect vs total timeouts.", he: "מודדים לאן הולך ה-latency של ספק ומתרגלים timeouts מפורשים ל-connect מול total." } },
    { cmd: "toxiproxy-cli toxic add -t latency -a latency=3000 psp_proxy",
      what: { en: "With Toxiproxy in front of a sandbox provider, inject 3 s latency and verify your timeout, breaker and fallback actually trigger.", he: "עם Toxiproxy לפני ספק ב-sandbox, מזריקים latency של 3 שניות ובודקים שה-timeout, ה-breaker וה-fallback באמת מופעלים." } },
    { cmd: "aws secretsmanager rotate-secret --secret-id prod/sms/api-key",
      what: { en: "Trigger rotation of a provider key (with a rotation Lambda that creates the new key at the vendor, then retires the old one after clients pick it up).", he: "מפעילים rotation ל-key של ספק (עם Lambda של rotation שיוצרת key חדש אצל הספק, ומבטלת את הישן אחרי שה-clients עברו)." } }
  ],
  mnemonic: { en: "\"TRBF-M\": Timeout, Retry (bounded), Breaker, Fallback — then Measure it yourself. And: you're only as available as your synchronous path.", he: "\"TRBF-M\": ‏Timeout, ‏Retry (מוגבל), ‏Breaker, ‏Fallback — ואז Measure בעצמכם. וגם: אתם זמינים רק כמו הנתיב הסינכרוני שלכם." },
  pitfalls: [
    { en: "Default (infinite) HTTP client timeouts: one hanging provider exhausts every worker thread and your whole service stops — not just the feature.", he: "Timeouts ברירת מחדל (אינסופיים) ב-HTTP client: ספק אחד שנתקע ממצה את כל ה-worker threads וכל השירות נעצר — לא רק הפיצ'ר." },
    { en: "Promising customers 99.99% while checkout synchronously calls four 99.9% vendors — the math caps you near 99.6%.", he: "להבטיח ללקוחות 99.99% כשה-checkout קורא באופן סינכרוני לארבעה ספקים של 99.9% — החשבון מגביל אתכם לסביבות 99.6%." },
    { en: "A 'backup provider' configured once and never sent traffic — when you fail over, the key is expired or the integration is broken.", he: "'ספק גיבוי' שהוגדר פעם אחת ומעולם לא קיבל תעבורה — כשעושים failover, ה-key פג או שהאינטגרציה שבורה." },
    { en: "Retrying non-idempotent provider calls (charge, send SMS) without an idempotency key — outages turn into double charges and duplicate texts.", he: "Retry לקריאות לא אידמפוטנטיות לספק (חיוב, שליחת SMS) בלי idempotency key — תקלות הופכות לחיובים כפולים ו-SMS כפולים." }
  ],
  interview: [
    { q: { en: "Your checkout depends on a payment provider that had three outages this quarter. What do you do?", he: "ה-checkout שלכם תלוי בספק תשלומים שהיו לו שלוש תקלות ברבעון. מה תעשו?" },
      a: { en: "First measure: our own SLI per dependency, failure modes (timeouts vs 5xx vs declines), duration, regions. Short term: correct timeouts, idempotency keys, breaker with clear fallback ('pending payment' + reconciliation), alerting on PSP error ratio. Medium term: a payment abstraction with a second PSP, routing 5–10% steadily to keep it warm, normalized webhooks via an ACL, and token portability (network tokens / vault) so cards work on both. Weigh cost (fees, engineering, PCI scope) against lost revenue per outage hour, and escalate with the vendor using our data.", he: "קודם מודדים: SLI משלנו לכל תלות, סוגי כשלים (timeouts מול 5xx מול declines), משך, regions. בטווח הקצר: timeouts נכונים, idempotency keys, ‏breaker עם fallback ברור ('ממתין לתשלום' + reconciliation), התראה על יחס השגיאות של ה-PSP. בטווח הבינוני: הפשטת תשלומים עם PSP שני, ניתוב קבוע של 5–10% כדי לשמור אותו חם, ‏webhooks מנורמלים דרך ACL, וניידות tokens ‏(network tokens / vault) כדי שכרטיסים יעבדו בשניהם. שוקלים עלות (עמלות, פיתוח, היקף PCI) מול הכנסה שאבדה בכל שעת תקלה, ומסלימים מול הספק עם הנתונים שלנו." } },
    { q: { en: "Explain the three circuit-breaker states and what you'd tune.", he: "הסבירו את שלושת המצבים של circuit breaker ומה הייתם מכוונים." },
      a: { en: "Closed (normal, counting failures), Open (fail fast + fallback for a cool-down), Half-open (a few probe calls decide). Tune: window size and minimum calls (avoid opening on 2 failures at night), failure-rate and slow-call thresholds, open duration, number of half-open probes, and what counts as failure (timeouts and 5xx yes; 4xx client errors no). Breakers are per dependency (and often per endpoint), and their state must be a metric.", he: "Closed (רגיל, סופר כשלים), ‏Open (נכשל מהר + fallback לזמן צינון), ‏Half-open (כמה קריאות בדיקה מכריעות). מכוונים: גודל החלון ומינימום קריאות (לא לפתוח על 2 כשלים בלילה), ספי כשל וקריאות איטיות, משך ה-open, מספר קריאות ה-half-open, ומה נחשב כשל (timeouts ו-5xx כן; שגיאות 4xx של ה-client לא). Breakers הם לכל תלות (ולרוב לכל endpoint), והמצב שלהם חייב להיות metric." } }
  ],
  quiz: [
    { q: { en: "Your service (99.95%) synchronously calls two providers at 99.9% each. Max availability?", he: "השירות שלכם (99.95%) קורא באופן סינכרוני לשני ספקים של 99.9% כל אחד. מה הזמינות המקסימלית?" },
      options: [ { en: "99.95%", he: "99.95%" }, { en: "≈ 99.75%", he: "≈ 99.75%" }, { en: "99.9%", he: "99.9%" }, { en: "99.99%", he: "99.99%" } ],
      answer: 1, explain: { en: "0.9995 × 0.999 × 0.999 ≈ 0.9975. Series dependencies multiply.", he: "0.9995 × 0.999 × 0.999 ≈ 0.9975. תלויות בטור מוכפלות." } },
    { q: { en: "A circuit breaker is Open. What happens to new calls?", he: "Circuit breaker במצב Open. מה קורה לקריאות חדשות?" },
      options: [ { en: "They wait for the provider", he: "הן מחכות לספק" }, { en: "They fail immediately and the fallback runs, until the cool-down allows half-open probes", he: "הן נכשלות מיד וה-fallback רץ, עד שזמן הצינון מאפשר קריאות בדיקה ב-half-open" }, { en: "They are retried 10 times", he: "עושים להן retry עשר פעמים" }, { en: "They go to a random provider", he: "הן הולכות לספק אקראי" } ],
      answer: 1, explain: { en: "Open = fail fast: protect your threads and give the provider room to recover.", he: "Open = להיכשל מהר: מגנים על ה-threads שלכם ונותנים לספק מקום להתאושש." } },
    { q: { en: "Which pattern prevents a hung maps API from consuming all your worker threads?", he: "איזו תבנית מונעת מ-API מפות תקוע לצרוך את כל ה-worker threads?" },
      options: [ { en: "Bulkhead (bounded pool per dependency)", he: "Bulkhead (pool מוגבל לכל תלות)" }, { en: "Sharding", he: "Sharding" }, { en: "CQRS", he: "CQRS" }, { en: "Blue/green deployment", he: "Blue/green deployment" } ],
      answer: 0, explain: { en: "Bulkheads isolate resources per dependency so one failure can't sink the whole ship.", he: "Bulkheads מבודדים משאבים לכל תלות כך שכשל אחד לא מטביע את כל הספינה." } },
    { q: { en: "Why route a small steady share of traffic (e.g. 10%) to a secondary provider?", he: "למה לנתב נתח קטן וקבוע מהתעבורה (למשל 10%) לספק משני?" },
      options: [ { en: "To get volume discounts", he: "כדי לקבל הנחת כמות" }, { en: "To keep the integration, credentials and capacity continuously verified so failover actually works", he: "כדי שהאינטגרציה, ה-credentials והקיבולת ייבדקו כל הזמן וה-failover באמת יעבוד" }, { en: "It's required by HTTP/2", he: "HTTP/2 דורש את זה" }, { en: "To slow down the primary", he: "כדי להאט את הראשי" } ],
      answer: 1, explain: { en: "A cold standby rots; live traffic is the only reliable test of a fallback path.", he: "גיבוי קר נרקב; תעבורה אמיתית היא הבדיקה האמינה היחידה לנתיב fallback." } }
  ],
  related: ["arch-resilience", "rel-sli-slo-sla", "rel-ha", "staff-service-mesh", "rel-chaos-engineering", "cloud-iam-security", "pr-idempotency", "pr-rate-limiters", "pr-integration-styles", "pr-email-sms"]
});

INFRA.glossary.push(
  { term: "Idempotency key", track: "principal", def: { en: "A client-generated unique id sent with a non-idempotent request (e.g. Idempotency-Key header) so the server executes it once and replays the stored result on retries.", he: "מזהה ייחודי שה-client מייצר ושולח עם בקשה לא אידמפוטנטית (למשל header ‏Idempotency-Key) כדי שהשרת יבצע אותה פעם אחת ויחזיר את התוצאה השמורה ב-retries." }, lesson: "pr-idempotency" },
  { term: "Effectively-once", track: "principal", def: { en: "At-least-once delivery combined with idempotent processing, so duplicates have no extra effect.", he: "מסירה at-least-once בשילוב עיבוד אידמפוטנטי, כך שלכפילויות אין השפעה נוספת." }, lesson: "pr-idempotency" },
  { term: "Full jitter", track: "principal", def: { en: "Backoff strategy that sleeps a random time between 0 and the exponential cap, spreading retries so clients don't retry in lockstep.", he: "אסטרטגיית backoff שישנה זמן אקראי בין 0 לתקרה האקספוננציאלית, כדי לפזר retries ושה-clients לא ינסו שוב באותו רגע." }, lesson: "pr-idempotency" },
  { term: "Webhook signature (HMAC)", track: "principal", def: { en: "A hash of the raw request body and timestamp keyed by a shared secret, letting a receiver verify a webhook's origin and reject replays.", he: "Hash של ה-body הגולמי וה-timestamp עם סוד משותף, שמאפשר למקבל לאמת את מקור ה-webhook ולדחות replays." }, lesson: "pr-integration-styles" },
  { term: "Anti-corruption layer", track: "principal", def: { en: "A translation layer that isolates your domain model from a legacy or vendor model so its concepts don't leak in.", he: "שכבת תרגום שמבודדת את מודל הדומיין שלכם ממודל legacy או של ספק כדי שהמושגים שלו לא ידלפו פנימה." }, lesson: "pr-integration-styles" },
  { term: "BFF (Backend for Frontend)", track: "principal", def: { en: "A thin backend per client type (web, mobile) that aggregates internal APIs and shapes responses for that UI.", he: "Backend דק לכל סוג client (web, מובייל) שמרכז APIs פנימיים ומעצב תשובות ל-UI הספציפי." }, lesson: "pr-integration-styles" },
  { term: "Visibility timeout", track: "principal", def: { en: "How long a received queue message stays hidden from other consumers; if not deleted in time, it is redelivered.", he: "כמה זמן הודעה שהתקבלה מתור נשארת מוסתרת מ-consumers אחרים; אם לא נמחקה בזמן — היא נמסרת שוב." }, lesson: "pr-queue-kinds" },
  { term: "Poison message", track: "principal", def: { en: "A message that fails processing every time; after N attempts it should go to a DLQ so it stops blocking or burning resources.", he: "הודעה שנכשלת בעיבוד בכל פעם; אחרי N ניסיונות היא צריכה לעבור ל-DLQ כדי שתפסיק לחסום או לשרוף משאבים." }, lesson: "pr-queue-kinds" },
  { term: "GCRA", track: "principal", def: { en: "Generic Cell Rate Algorithm: a rate limiter storing one theoretical arrival time per key, equivalent to a token bucket.", he: "Generic Cell Rate Algorithm: ‏rate limiter ששומר זמן הגעה תאורטי אחד לכל key, שקול ל-token bucket." }, lesson: "pr-rate-limiters" },
  { term: "Load shedding", track: "principal", def: { en: "Deliberately rejecting lower-priority work early and cheaply during overload so critical traffic still succeeds.", he: "דחייה מכוונת, מוקדמת וזולה של עבודה בעדיפות נמוכה בזמן עומס כדי שתעבורה קריטית עדיין תצליח." }, lesson: "pr-rate-limiters" },
  { term: "Bulkhead", track: "principal", def: { en: "Isolating resources (threads, connections, pods) per dependency so one failing dependency can't exhaust everything.", he: "בידוד משאבים (threads, ‏connections, ‏pods) לכל תלות כך שתלות אחת שנכשלת לא תמצה הכול." }, lesson: "pr-third-party-deps" }
);
