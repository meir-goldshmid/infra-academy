// Interview prep — more system design cases (part 4). Format: CONTENT_SCHEMA.md ("Interview prep — system design case").
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-webhook-delivery", icon: "🪝", level: 2,
  title: { en: "Design a Webhook Delivery System (Stripe-like)", he: "תכנון מערכת Webhook Delivery (בסגנון Stripe)" },
  prompt: {
    en: "Our platform emits events (payment.succeeded, invoice.paid, ...). Customers register HTTPS endpoints and we must POST every event they subscribed to. Design the delivery system.",
    he: "הפלטפורמה שלנו מייצרת events (payment.succeeded, invoice.paid וכו'). לקוחות רושמים HTTPS endpoints ואנחנו צריכים לשלוח POST על כל event שהם נרשמו אליו. תתכנן את מערכת ה-delivery."
  },
  clarify: [
    { en: "How many events per day, how many customer endpoints, and how skewed is it? (A few huge merchants usually produce most of the traffic.)", he: "כמה events ביום, כמה endpoints של לקוחות, וכמה הפיזור עקום? (בדרך כלל כמה סוחרים ענקיים מייצרים את רוב התנועה.)" },
    { en: "What delivery guarantee do customers expect: at-least-once with retries, or do they assume exactly-once?", he: "איזו הבטחת delivery הלקוחות מצפים לה: at-least-once עם retries, או שהם מניחים exactly-once?" },
    { en: "Do we promise ordering per object (e.g. created before updated), or only best effort?", he: "אנחנו מבטיחים סדר לכל אובייקט (למשל created לפני updated), או רק best effort?" },
    { en: "How long do we keep retrying a failing endpoint, and when do we disable it?", he: "כמה זמן ממשיכים לעשות retry ל-endpoint שנכשל, ומתי מכבים אותו?" },
    { en: "Do customers need a dashboard to see attempts and replay events manually?", he: "הלקוחות צריכים dashboard כדי לראות ניסיונות שליחה ולעשות replay ידני ל-events?" },
    { en: "What latency from event creation to first delivery attempt is acceptable? (Usually seconds.)", he: "איזה latency מקובל מיצירת ה-event ועד ניסיון השליחה הראשון? (בדרך כלל שניות.)" }
  ],
  functional: [
    { en: "Customers register endpoints (URL + subscribed event types) and get a signing secret.", he: "לקוחות רושמים endpoints (URL + סוגי events שנרשמו אליהם) ומקבלים signing secret." },
    { en: "Every committed business event is delivered via signed HTTPS POST to all matching endpoints.", he: "כל event עסקי שעשה commit נשלח ב-HTTPS POST חתום לכל ה-endpoints המתאימים." },
    { en: "Failed deliveries are retried with exponential backoff and jitter for up to 3 days; persistently failing endpoints are disabled with an email to the owner.", he: "שליחות שנכשלו מקבלות retry עם exponential backoff ו-jitter עד 3 ימים; endpoints שנכשלים כל הזמן מושבתים, ובעל ה-endpoint מקבל מייל." },
    { en: "A dashboard and API show every attempt (status, latency, response body) and allow replaying a single event or a time range.", he: "Dashboard ו-API מציגים כל ניסיון (status, latency, response body) ומאפשרים replay ל-event בודד או לטווח זמן." }
  ],
  nonFunctional: [
    { en: "Scale: ~1B events/day (~12k/s average, ~35k/s peak), ~1M endpoints.", he: "סקייל: כ-1B events ביום (כ-12k לשנייה בממוצע, כ-35k בשיא), כ-1M endpoints." },
    { en: "Never lose an event that the business transaction committed: durability first.", he: "אסור לאבד event שהטרנזקציה העסקית עשתה לו commit: durability לפני הכול." },
    { en: "Isolation: one slow or dead customer endpoint must not delay delivery to anyone else.", he: "בידוד: endpoint איטי או מת של לקוח אחד לא יכול לעכב שליחה לאף אחד אחר." },
    { en: "First attempt p99 under 5s from commit; delivery pipeline availability 99.95%.", he: "ניסיון ראשון ב-p99 תוך פחות מ-5 שניות מה-commit; availability של ה-pipeline: 99.95%." },
    { en: "Security: receivers can verify authenticity and reject replays; we must not become an SSRF tool against internal networks.", he: "אבטחה: הצד המקבל יכול לאמת שה-event אמיתי ולדחות replays; ואסור שנהפוך לכלי SSRF נגד רשתות פנימיות." }
  ],
  estimates: {
    en: `<p><strong>Events:</strong> 1B/day ÷ 86,400 ≈ <strong>11.6k events/s</strong>; peak ~3× ≈ <strong>35k/s</strong>. Fan-out: average 1.2 endpoints per event → ~42k delivery attempts/s at peak before retries.</p>
<p><strong>In-flight HTTP:</strong> median receiver latency ~300 ms → 42k × 0.3 s ≈ <strong>12.6k concurrent requests</strong>. With async HTTP clients at ~250 concurrent connections per worker, that is ~50 workers — plus headroom, ~100.</p>
<p><strong>Slow endpoints:</strong> a merchant doing 1,000 events/s whose endpoint takes 10 s (our timeout) would need 10,000 concurrent connections <em>just for itself</em>. That is why per-endpoint concurrency must be capped (e.g. 50) and its backlog queued separately.</p>
<p><strong>Retries:</strong> ~5% of first attempts fail → ~2k retries/s scheduled; schedule of ~8 attempts over 3 days. Worst case a large endpoint is down for a day: 1,000/s × 86,400 = <strong>86M pending deliveries</strong> for one customer — must sit in storage, not in RAM.</p>
<p><strong>Storage:</strong> payload ~2 KB → 2 TB/day; keep 30 days for replay = 60 TB raw, ~15 TB compressed in object storage. Attempt log: 1.3B attempts/day × ~200 bytes ≈ 260 GB/day, 30 days ≈ <strong>8 TB</strong> in a columnar/wide-column store.</p>`,
    he: `<p><strong>Events:</strong> 1B ביום ÷ 86,400 ≈ <strong>11.6k events לשנייה</strong>; שיא בערך פי 3 ≈ <strong>35k לשנייה</strong>. Fan-out: בממוצע 1.2 endpoints ל-event → כ-42k ניסיונות שליחה לשנייה בשיא, לפני retries.</p>
<p><strong>HTTP באוויר:</strong> latency חציוני של הצד המקבל כ-300 ms → 42k × 0.3 s ≈ <strong>12.6k בקשות במקביל</strong>. עם HTTP client אסינכרוני וכ-250 connections ל-worker, זה כ-50 workers – עם מרווח, כ-100.</p>
<p><strong>Endpoints איטיים:</strong> סוחר שמייצר 1,000 events לשנייה וה-endpoint שלו לוקח 10 שניות (ה-timeout שלנו) יצטרך 10,000 connections במקביל <em>רק בשבילו</em>. בגלל זה חייבים תקרת concurrency לכל endpoint (למשל 50) ו-backlog נפרד בתור.</p>
<p><strong>Retries:</strong> כ-5% מהניסיונות הראשונים נכשלים → כ-2k retries לשנייה מתוזמנים; לוח זמנים של כ-8 ניסיונות לאורך 3 ימים. במקרה הגרוע endpoint גדול נופל ליום: 1,000 × 86,400 = <strong>86M שליחות ממתינות</strong> ללקוח אחד – זה חייב לשבת באחסון, לא ב-RAM.</p>
<p><strong>אחסון:</strong> payload של כ-2 KB → 2 TB ביום; שומרים 30 יום בשביל replay = 60 TB raw, כ-15 TB דחוס ב-object storage. לוג הניסיונות: 1.3B ניסיונות ביום × כ-200 בייט ≈ 260 GB ביום, ל-30 יום ≈ <strong>8 TB</strong> ב-store עמודתי או wide-column.</p>`
  },
  api: `# Endpoint management
POST   /v1/webhook_endpoints {url, enabled_events:["payment.*"], description}
       -> 201 {id:"we_123", secret:"whsec_...", status:"enabled"}
PATCH  /v1/webhook_endpoints/{id} {enabled_events | status:"enabled"}
POST   /v1/webhook_endpoints/{id}/rotate_secret {expire_old_in:"24h"}

# Observability & replay
GET    /v1/events/{evt_id}/attempts -> [{attempt, ts, http_status, latency_ms, error}]
POST   /v1/webhook_endpoints/{id}/replay {from, to, event_types?} -> 202 {job_id}
POST   /v1/events/{evt_id}/resend {endpoint_id}

# What we send to the customer
POST https://merchant.example.com/hooks
  Webhook-Id: evt_9f2c          (stable across retries -> receiver dedups on it)
  Webhook-Timestamp: 1763112000
  Webhook-Signature: v1=hex(HMAC_SHA256(secret, id + "." + ts + "." + body))
  body: {"id":"evt_9f2c","type":"payment.succeeded","created":...,"data":{...}}
  -> any 2xx within 10s = success; else retry`,
  dataModel: `endpoints(id PK, account_id, url, secret_current, secret_previous, secret_prev_expires,
          enabled_events[], status: enabled|disabled|paused, fail_streak, disabled_reason)

outbox(id PK, account_id, type, payload_json, created_at)   -- same DB txn as business write

events(evt_id PK, account_id, type, created_at, payload_ref -> S3)   -- 30-day retention

deliveries(endpoint_id, evt_id, PK(endpoint_id, evt_id),
           state: pending|in_flight|succeeded|failed_permanent,
           attempt, next_attempt_at, last_status, last_error)
  index: (next_attempt_at) for the retry scheduler

attempts(endpoint_id, evt_id, attempt_no, ts, http_status, latency_ms, resp_snippet)  -- wide-column, TTL 30d`,
  diagram: `  [Business services]  write row + outbox row in ONE transaction
         |
         v
  +-------------+   CDC / relay (Debezium or poller)
  |  Outbox tbl | ----------------------------------+
  +-------------+                                   v
                                          +------------------+
                                          | Kafka: events    |  (partition by account_id)
                                          +--------+---------+
                                                   |
                                          +--------v---------+     endpoints cache
                                          |  Fan-out router  |<--- (subscriptions)
                                          +--------+---------+
                                                   |  one delivery per matching endpoint
                                                   v
                     +--------------------------------------------------+
                     |  Per-endpoint queues (deliveries table / Redis   |
                     |  streams), fair scheduler, concurrency cap/ep     |
                     +---------+-----------------------+----------------+
                               |                       |
                      +--------v--------+     +--------v---------+
                      | Delivery workers|     | Retry scheduler  |  next_attempt_at
                      | sign, POST, 10s |     | backoff+jitter   |  1m,5m,30m,2h,8h,24h..
                      | timeout, egress |     +------------------+
                      | proxy (no SSRF) |
                      +--------+--------+
                               | result
                               v
                  [attempts log] -> Dashboard / replay API ; [circuit breaker -> disable + email]`,
  deepDives: [
    {
      h: { en: "Never lose an event: the transactional outbox", he: "לא מאבדים event: ה-transactional outbox" },
      body: {
        en: `<p>The classic bug: the payment service commits to Postgres and then publishes to Kafka. If the process dies between the two, the payment exists but the webhook never fires (or the reverse: event published, transaction rolled back). The fix is the <strong>outbox pattern</strong>: insert the event into an <code>outbox</code> table <em>in the same transaction</em> as the business row. A relay (CDC with Debezium reading the WAL, or a poller using <code>SELECT ... FOR UPDATE SKIP LOCKED</code>) publishes outbox rows to Kafka and marks them sent.</p>
<ul>
<li>The relay is at-least-once, so the same event may be published twice — every downstream step dedups on <code>evt_id</code>.</li>
<li>Partition Kafka by <code>account_id</code> so one account's events stay in order through the router.</li>
<li>Store large payloads in S3 and pass a reference; keep Kafka messages small.</li>
</ul>`,
        he: `<p>הבאג הקלאסי: ה-payment service עושה commit ל-Postgres ואז מפרסם ל-Kafka. אם התהליך מת בין השניים, התשלום קיים אבל ה-webhook אף פעם לא נשלח (או הפוך: ה-event פורסם והטרנזקציה עשתה rollback). הפתרון הוא <strong>outbox pattern</strong>: מכניסים את ה-event לטבלת <code>outbox</code> <em>באותה טרנזקציה</em> של השורה העסקית. Relay (CDC עם Debezium שקורא את ה-WAL, או poller עם <code>SELECT ... FOR UPDATE SKIP LOCKED</code>) מפרסם את השורות ל-Kafka ומסמן אותן כנשלחו.</p>
<ul>
<li>ה-relay הוא at-least-once, אז אותו event יכול להתפרסם פעמיים – כל שלב בהמשך עושה dedup לפי <code>evt_id</code>.</li>
<li>עושים partition ב-Kafka לפי <code>account_id</code> כדי שה-events של חשבון אחד יישארו בסדר דרך ה-router.</li>
<li>Payloads גדולים שומרים ב-S3 ומעבירים reference; הודעות Kafka נשארות קטנות.</li>
</ul>`
      }
    },
    {
      h: { en: "Endpoint isolation: one slow customer must not hurt others", he: "בידוד endpoints: לקוח איטי אחד לא פוגע באחרים" },
      body: {
        en: `<p>If all deliveries share one FIFO queue, a single endpoint that times out at 10 s fills every worker slot and the whole platform stalls — classic head-of-line blocking. Instead model <strong>a logical queue per endpoint</strong> and a fair scheduler on top:</p>
<ul>
<li><strong>Per-endpoint concurrency cap</strong> (e.g. 50 in flight) and optional rate limit. Extra events wait in that endpoint's backlog in durable storage.</li>
<li><strong>Weighted round-robin</strong> across endpoints with ready work, so a merchant with 86M pending items gets its fair share, not the whole fleet.</li>
<li><strong>Tiered pools:</strong> endpoints whose p95 latency exceeds ~2 s or that fail repeatedly move to a separate "slow lane" worker pool. Healthy endpoints never queue behind them.</li>
<li><strong>Short timeouts</strong> (connect 3 s, total 10 s) and a cap on response body read (e.g. 4 KB stored).</li>
</ul>
<blockquote>💡 Real world: Kafka partitions alone are not enough — one partition holds many endpoints, so a stuck endpoint blocks its partition. Kafka is the event log; the per-endpoint queue lives in a store that supports many small queues (Postgres/DynamoDB rows keyed by endpoint, or Redis streams).</blockquote>`,
        he: `<p>אם כל השליחות חולקות תור FIFO אחד, endpoint יחיד שעושה timeout אחרי 10 שניות ממלא את כל ה-workers וכל הפלטפורמה נתקעת – head-of-line blocking קלאסי. במקום זה בונים <strong>תור לוגי לכל endpoint</strong> ו-scheduler הוגן מעליו:</p>
<ul>
<li><strong>תקרת concurrency לכל endpoint</strong> (למשל 50 בקשות במקביל) ו-rate limit אופציונלי. ה-events העודפים מחכים ב-backlog של אותו endpoint באחסון durable.</li>
<li><strong>Weighted round-robin</strong> בין endpoints שיש להם עבודה מוכנה, כך שסוחר עם 86M פריטים ממתינים מקבל את החלק ההוגן שלו ולא את כל ה-fleet.</li>
<li><strong>Pools בשכבות:</strong> endpoints שה-p95 שלהם מעל כ-2 שניות או שנכשלים שוב ושוב עוברים ל-pool נפרד של "נתיב איטי". Endpoints בריאים אף פעם לא עומדים מאחוריהם בתור.</li>
<li><strong>Timeouts קצרים</strong> (connect של 3 שניות, סה"כ 10 שניות) ותקרה על קריאת ה-response body (למשל שומרים 4 KB).</li>
</ul>
<blockquote>💡 מהשטח: partitions של Kafka לבד לא מספיקים – partition אחד מחזיק הרבה endpoints, אז endpoint תקוע חוסם את כל ה-partition. Kafka הוא ה-event log; התור לכל endpoint חי ב-store שתומך בהמון תורים קטנים (שורות ב-Postgres/DynamoDB לפי endpoint, או Redis streams).</blockquote>`
      }
    },
    {
      h: { en: "Retries, backoff with jitter, and disabling dead endpoints", he: "Retries, backoff עם jitter, והשבתת endpoints מתים" },
      body: {
        en: `<p>Retry on network errors, timeouts, 429 and 5xx. Do not retry most 4xx except 408/409/429 (a 400 will fail forever). Schedule: <code>delay = min(cap, base × 2^attempt)</code> with <strong>full jitter</strong> (<code>random(0, delay)</code>), e.g. ~1m, 5m, 30m, 2h, 8h, 24h... up to 3 days. Jitter matters: when a big customer's endpoint comes back after an outage, 86M retries must not all fire in the same second and knock it over again. Honor <code>Retry-After</code> when the receiver sends it.</p>
<ul>
<li><strong>Circuit breaker per endpoint:</strong> after N consecutive failures, stop sending new events immediately (they wait in backlog) and send one probe per interval; on success, drain the backlog at a controlled rate.</li>
<li><strong>Disable</strong> after e.g. 3 days of continuous failure: mark <code>disabled</code>, email the account owner, keep events for replay. Re-enabling triggers an optional replay of the missed window.</li>
<li>After the final attempt, the delivery is <code>failed_permanent</code> — it remains visible and replayable in the dashboard.</li>
</ul>`,
        he: `<p>עושים retry על שגיאות רשת, timeouts, 429 ו-5xx. לא עושים retry לרוב ה-4xx חוץ מ-408/409/429 (שגיאת 400 תיכשל לנצח). לוח זמנים: <code>delay = min(cap, base × 2^attempt)</code> עם <strong>full jitter</strong> (<code>random(0, delay)</code>), למשל בערך 1 דקה, 5 דקות, 30 דקות, שעתיים, 8 שעות, 24 שעות... עד 3 ימים. ה-jitter קריטי: כש-endpoint של לקוח גדול חוזר אחרי השבתה, אסור ש-86M retries יירו באותה שנייה ויפילו אותו שוב. אם הצד המקבל שולח <code>Retry-After</code>, מכבדים אותו.</p>
<ul>
<li><strong>Circuit breaker לכל endpoint:</strong> אחרי N כישלונות רצופים מפסיקים מיד לשלוח events חדשים (הם מחכים ב-backlog) ושולחים probe אחד בכל מרווח; כשהוא מצליח, מרוקנים את ה-backlog בקצב מבוקר.</li>
<li><strong>השבתה</strong> אחרי למשל 3 ימים של כישלון רציף: מסמנים <code>disabled</code>, שולחים מייל לבעל החשבון, ושומרים את ה-events בשביל replay. הפעלה מחדש יכולה להריץ replay לחלון שפוספס.</li>
<li>אחרי הניסיון האחרון ה-delivery עובר ל-<code>failed_permanent</code> – הוא נשאר גלוי וזמין ל-replay ב-dashboard.</li>
</ul>`
      }
    },
    {
      h: { en: "Security: HMAC signatures, timestamps, secret rotation, SSRF", he: "אבטחה: חתימות HMAC, timestamps, רוטציית secrets ו-SSRF" },
      body: {
        en: `<p>Each endpoint has its own secret. We sign <code>HMAC-SHA256(secret, id + "." + timestamp + "." + raw_body)</code> and send the timestamp in a header. The receiver recomputes over the <em>raw</em> bytes (not re-serialized JSON), compares in constant time, and rejects timestamps older than ~5 minutes — that stops an attacker replaying a captured request later.</p>
<ul>
<li><strong>Rotation without downtime:</strong> during rotation we sign with both the new and old secret (<code>v1=sigNew,v1=sigOld</code>) for 24h, so the receiver can switch whenever ready.</li>
<li><strong>SSRF:</strong> customers control the URL. Resolve DNS ourselves, block private/link-local ranges (10/8, 172.16/12, 192.168/16, 169.254.169.254 metadata), re-check after each redirect (or do not follow redirects), and send from a dedicated egress proxy in an isolated network with static IPs customers can allowlist.</li>
<li>HTTPS only, verify certificates; never put secrets in the payload.</li>
</ul>`,
        he: `<p>לכל endpoint יש secret משלו. חותמים <code>HMAC-SHA256(secret, id + "." + timestamp + "." + raw_body)</code> ושולחים את ה-timestamp ב-header. הצד המקבל מחשב מחדש על הבייטים ה-<em>גולמיים</em> (לא על JSON שעבר serialization מחדש), משווה ב-constant time, ודוחה timestamps ישנים מכ-5 דקות – כך תוקף לא יכול לעשות replay לבקשה שהוא תפס.</p>
<ul>
<li><strong>רוטציה בלי השבתה:</strong> בזמן רוטציה חותמים גם עם ה-secret החדש וגם עם הישן (<code>v1=sigNew,v1=sigOld</code>) למשך 24 שעות, כך שהצד המקבל עובר מתי שנוח לו.</li>
<li><strong>SSRF:</strong> הלקוח שולט ב-URL. עושים DNS resolve בעצמנו, חוסמים טווחים פרטיים ו-link-local (10/8, 172.16/12, 192.168/16, ה-metadata ב-169.254.169.254), בודקים שוב אחרי כל redirect (או פשוט לא עוקבים אחרי redirects), ושולחים דרך egress proxy ייעודי ברשת מבודדת עם IPs קבועים שהלקוחות יכולים לשים ב-allowlist.</li>
<li>רק HTTPS, עם אימות certificates; אף פעם לא שמים secrets בתוך ה-payload.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "At-least-once vs exactly-once: exactly-once over HTTP to a third party is impossible (an ack can be lost after the receiver processed). We guarantee at-least-once with a stable event id and document that receivers must be idempotent.", he: "At-least-once מול exactly-once: exactly-once ב-HTTP מול צד שלישי בלתי אפשרי (ה-ack יכול ללכת לאיבוד אחרי שהצד המקבל כבר עיבד). מבטיחים at-least-once עם event id קבוע ומתעדים שהצד המקבל חייב להיות idempotent." },
    { en: "Strict ordering vs throughput: delivering one event at a time per endpoint preserves order but caps throughput at 1/latency and lets one failing event block everything after it. Most platforms (Stripe included) do not guarantee order and tell receivers to fetch the latest object state via API.", he: "סדר קפדני מול throughput: שליחה של event אחד בכל פעם לכל endpoint שומרת סדר, אבל מגבילה את ה-throughput ל-1/latency ונותנת ל-event אחד שנכשל לחסום את כל מה שאחריו. רוב הפלטפורמות (כולל Stripe) לא מבטיחות סדר ואומרות לצד המקבל למשוך את המצב העדכני של האובייקט דרך ה-API." },
    { en: "Fat vs thin payloads: full object in the webhook is convenient but can be stale on retry and leaks data if the endpoint is compromised; a thin event (id + type) forces a fetch but always returns fresh, authorized data.", he: "Payload שמן מול רזה: כל האובייקט בתוך ה-webhook נוח, אבל יכול להיות לא עדכני ב-retry ומדליף דאטה אם ה-endpoint נפרץ; event רזה (id + type) מכריח fetch, אבל תמיד מחזיר דאטה טרי ומורשה." },
    { en: "Build vs buy: managed webhook services (Svix, Hookdeck) solve signing, retries and a portal out of the box; building in-house pays off only at large scale or with strict data-residency needs.", he: "Build מול buy: שירותי webhook מנוהלים (Svix, Hookdeck) פותרים חתימות, retries ופורטל מהקופסה; בנייה פנימית משתלמת רק בסקייל גדול או עם דרישות data residency קשוחות." }
  ],
  followUps: [
    {
      q: { en: "A receiver says they got the same payment.succeeded event twice and shipped two orders. Whose bug is it and what do you change?", he: "לקוח טוען שקיבל את אותו payment.succeeded פעמיים ושלח שתי הזמנות. של מי הבאג ומה משנים?" },
      a: { en: "Duplicates are expected under at-least-once (e.g. their server processed the event but responded after our 10s timeout, so we retried). The receiver must dedup on Webhook-Id: insert the id into a processed_events table with a unique constraint in the same transaction as the side effect, and return 2xx quickly, doing heavy work async. On our side: keep the event id stable across retries, document it loudly, ship SDK helpers, and look at whether our timeout is too aggressive for that customer.", he: "כפילויות צפויות ב-at-least-once (למשל השרת שלהם עיבד את ה-event אבל ענה אחרי ה-timeout של 10 שניות, אז עשינו retry). הצד המקבל חייב לעשות dedup לפי Webhook-Id: להכניס את ה-id לטבלת processed_events עם unique constraint באותה טרנזקציה של ה-side effect, ולהחזיר 2xx מהר ולעשות את העבודה הכבדה async. בצד שלנו: שומרים event id קבוע בין retries, מתעדים את זה בבירור, נותנים helpers ב-SDK, ובודקים אם ה-timeout שלנו אגרסיבי מדי ללקוח הזה." }
    },
    {
      q: { en: "Your biggest customer's endpoint was down for 6 hours and is back. What happens in the next 10 minutes?", he: "ה-endpoint של הלקוח הכי גדול שלך היה למטה 6 שעות וחזר. מה קורה ב-10 הדקות הבאות?" },
      a: { en: "About 21M deliveries are pending (1,000/s × 6h). The circuit breaker's probe succeeds and the endpoint moves to half-open. We drain at a ramped rate — start at the endpoint's normal throughput and increase while latency and error rate stay healthy — never all at once. Backoff jitter already spread scheduled retries. Other customers are unaffected because the backlog sits in that endpoint's queue and the per-endpoint concurrency cap holds. Optionally deliver newest-first or let the customer choose to skip and replay later.", he: "בערך 21M שליחות ממתינות (1,000 לשנייה × 6 שעות). ה-probe של ה-circuit breaker מצליח וה-endpoint עובר ל-half-open. מרוקנים בקצב עולה – מתחילים מה-throughput הרגיל של ה-endpoint ומעלים כל עוד ה-latency ושיעור השגיאות תקינים – אף פעם לא הכול בבת אחת. ה-jitter כבר פיזר את ה-retries המתוזמנים. לקוחות אחרים לא מושפעים, כי ה-backlog יושב בתור של אותו endpoint ותקרת ה-concurrency מחזיקה. אפשר גם לשלוח מהחדש לישן או לתת ללקוח לבחור לדלג ולעשות replay אחר כך." }
    },
    {
      q: { en: "How do you make the delivery workers themselves not double-send when a worker crashes mid-request?", he: "איך מונעים מה-workers עצמם לשלוח פעמיים כש-worker קורס באמצע בקשה?" },
      a: { en: "You cannot fully — if it crashed after the POST but before recording success, a retry will resend, and that is fine under at-least-once. What you prevent is two workers sending concurrently: claim a delivery with a lease (state=in_flight, lease_until=now+30s, conditional update) so only one worker owns it; expired leases are reclaimed. Record the attempt result in the same update that clears the lease.", he: "אי אפשר לגמרי – אם הוא קרס אחרי ה-POST ולפני שרשם הצלחה, retry ישלח שוב, וזה בסדר ב-at-least-once. מה שמונעים זה שני workers ששולחים במקביל: תופסים delivery עם lease (state=in_flight, lease_until=now+30s, עדכון מותנה) כך שרק worker אחד הוא הבעלים; leases שפגו נלקחים מחדש. את תוצאת הניסיון רושמים באותו עדכון שמשחרר את ה-lease." }
    }
  ],
  related: ["pr-idempotency", "staff-exactly-once", "data-cdc-debezium", "arch-queues", "arch-resilience", "crypto-hashing-practice", "pr-rate-limiters", "arch-event-driven"]
});

/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-auth-sso", icon: "🔐", level: 3,
  title: { en: "Design an Authentication & SSO Service", he: "תכנון שירות Authentication ו-SSO" },
  prompt: {
    en: "Design the central identity service for our company: user login for our web and mobile apps, SSO across all our products, enterprise customers logging in with their own IdP, and tokens that our 300 microservices trust.",
    he: "תתכנן את שירות הזהות המרכזי של החברה: login של משתמשים באפליקציות web ו-mobile, SSO בין כל המוצרים שלנו, לקוחות enterprise שמתחברים עם ה-IdP שלהם, ו-tokens שכל 300 ה-microservices שלנו סומכים עליהם."
  },
  clarify: [
    { en: "How many users, daily logins and API requests per second need token verification?", he: "כמה משתמשים, כמה logins ביום, וכמה API requests לשנייה צריכים אימות token?" },
    { en: "Which login methods: password, social (Google/Apple), passkeys, MFA (TOTP/SMS/push), enterprise SAML/OIDC federation?", he: "אילו שיטות login: סיסמה, social (Google/Apple), passkeys, MFA (TOTP/SMS/push), federation של SAML/OIDC ל-enterprise?" },
    { en: "How fast must revocation take effect — logout, password change, fired employee: seconds or minutes?", he: "כמה מהר revocation צריך להשפיע – logout, החלפת סיסמה, עובד שפוטר: שניות או דקות?" },
    { en: "Is this also authorization (roles/permissions), or only authentication? (Scope: authN + coarse scopes; fine-grained authZ is a separate service.)", he: "זה גם authorization (roles/permissions), או רק authentication? (Scope: authN + scopes גסים; authZ מפורט הוא שירות נפרד.)" },
    { en: "Multi-region? Data-residency rules for user PII (EU users stay in EU)?", he: "Multi-region? יש כללי data residency ל-PII של משתמשים (משתמשי EU נשארים ב-EU)?" },
    { en: "Build on an existing product (Keycloak, Auth0, Okta, Cognito) or in-house?", he: "בונים על מוצר קיים (Keycloak, Auth0, Okta, Cognito) או פיתוח פנימי?" }
  ],
  functional: [
    { en: "Sign-up, login (password, social, passkeys), MFA, password reset and account recovery.", he: "Sign-up, login (סיסמה, social, passkeys), MFA, איפוס סיסמה ושחזור חשבון." },
    { en: "Act as an OIDC/OAuth2 provider: authorization code + PKCE for web/mobile, client credentials for service-to-service, SSO session across our products.", he: "לשמש OIDC/OAuth2 provider: authorization code + PKCE ל-web ו-mobile, client credentials בין services, ו-SSO session על פני כל המוצרים." },
    { en: "Federate enterprise customers via SAML 2.0 / OIDC to their IdP (Okta, Entra ID), with JIT provisioning and SCIM.", he: "Federation ללקוחות enterprise דרך SAML 2.0 או OIDC מול ה-IdP שלהם (Okta, Entra ID), עם JIT provisioning ו-SCIM." },
    { en: "Issue short-lived access tokens (JWT) and rotating refresh tokens; publish JWKS; support logout and revocation of sessions.", he: "הנפקת access tokens קצרי חיים (JWT) ו-refresh tokens מתחלפים; פרסום JWKS; תמיכה ב-logout וב-revocation של sessions." }
  ],
  nonFunctional: [
    { en: "Availability 99.99%+: auth down = every product down. Token verification must keep working even if the auth service is down.", he: "Availability של 99.99% ומעלה: auth למטה = כל המוצרים למטה. אימות tokens חייב להמשיך לעבוד גם כשהשירות עצמו למטה." },
    { en: "Scale: 100M users, ~20M DAU, ~5k logins/s peak, ~500k API requests/s verifying tokens.", he: "סקייל: 100M משתמשים, כ-20M DAU, כ-5k logins לשנייה בשיא, כ-500k API requests לשנייה שמאמתים tokens." },
    { en: "Login p99 under 500 ms (excluding user interaction); token verification under 1 ms (local).", he: "Login ב-p99 מתחת ל-500 ms (בלי זמן האינטראקציה של המשתמש); אימות token מתחת ל-1 ms (מקומי)." },
    { en: "Security: resist credential stuffing and brute force, no plaintext secrets, full audit log, revocation within 1 minute for high-risk events.", he: "אבטחה: עמידות ל-credential stuffing ו-brute force, אין secrets ב-plaintext, audit log מלא, ו-revocation תוך דקה באירועים בסיכון גבוה." }
  ],
  estimates: {
    en: `<p><strong>Logins:</strong> 20M DAU × ~2 logins/day = 40M/day ≈ 460/s average; morning peak ~10× → <strong>~5k/s</strong>. A credential-stuffing attack can add <strong>50k+ attempts/s</strong> — capacity must be designed for attack traffic, not just users.</p>
<p><strong>Password hashing CPU:</strong> argon2id/bcrypt tuned to ~100 ms of one core per hash. 5k/s × 0.1 core-s = <strong>500 cores</strong> just for legitimate logins; 50k/s attack traffic would need 5,000 cores. So rate limiting and bot detection must reject <em>before</em> hashing.</p>
<p><strong>Token verification:</strong> 500k API req/s. If each called the auth service (introspection), that is 500k/s on our most critical service. With JWTs verified locally (RS256/ES256 verify ~20-50 µs) it is ~0 network calls; services only fetch JWKS every few minutes.</p>
<p><strong>Refresh:</strong> access token TTL 15 min; ~5M concurrently active sessions ÷ 900 s ≈ <strong>5.5k refresh/s</strong> — each one a DB/Redis lookup + rotation write.</p>
<p><strong>Storage:</strong> users 100M × ~1 KB = 100 GB; refresh tokens/sessions 150M × ~300 B ≈ 45 GB; audit log 100M events/day × 500 B = 50 GB/day. Small data, very high availability.</p>`,
    he: `<p><strong>Logins:</strong> 20M DAU × כ-2 logins ביום = 40M ביום ≈ 460 לשנייה בממוצע; שיא בוקר בערך פי 10 → <strong>כ-5k לשנייה</strong>. מתקפת credential stuffing יכולה להוסיף <strong>50k ניסיונות לשנייה ויותר</strong> – צריך לתכנן קיבולת לתנועת מתקפה, לא רק למשתמשים.</p>
<p><strong>CPU של hashing לסיסמאות:</strong> argon2id/bcrypt מכוונים לכ-100 ms של core אחד ל-hash. 5k לשנייה × 0.1 core-s = <strong>500 cores</strong> רק ל-logins לגיטימיים; 50k לשנייה של מתקפה ידרשו 5,000 cores. לכן rate limiting וזיהוי bots חייבים לדחות <em>לפני</em> ה-hashing.</p>
<p><strong>אימות tokens:</strong> 500k API requests לשנייה. אם כל אחד היה פונה לשירות ה-auth (introspection), זה 500k לשנייה על השירות הכי קריטי שלנו. עם JWT שמאומת מקומית (verify של RS256/ES256 לוקח כ-20-50 µs) כמעט אין קריאות רשת; ה-services רק מושכים JWKS כל כמה דקות.</p>
<p><strong>Refresh:</strong> TTL של access token הוא 15 דקות; כ-5M sessions פעילים במקביל ÷ 900 שניות ≈ <strong>5.5k refresh לשנייה</strong> – כל אחד lookup ב-DB/Redis וכתיבה של רוטציה.</p>
<p><strong>אחסון:</strong> משתמשים 100M × כ-1 KB = 100 GB; refresh tokens ו-sessions 150M × כ-300 B ≈ 45 GB; audit log של 100M אירועים ביום × 500 B = 50 GB ביום. דאטה קטן, availability גבוה מאוד.</p>`
  },
  api: `# OIDC / OAuth2 (standard endpoints)
GET  /.well-known/openid-configuration
GET  /.well-known/jwks.json            -> {keys:[{kid:"2026-11-a", kty:"EC", crv:"P-256", ...}, {kid:"2026-10-b",...}]}
GET  /oauth2/authorize?response_type=code&client_id=..&redirect_uri=..&scope=openid profile
                      &state=..&code_challenge=..&code_challenge_method=S256
POST /oauth2/token  grant_type=authorization_code&code=..&code_verifier=..
     -> {access_token(JWT, 15m), id_token, refresh_token(opaque, rotating), expires_in:900}
POST /oauth2/token  grant_type=refresh_token&refresh_token=..   -> new access + NEW refresh
POST /oauth2/token  grant_type=client_credentials   (service-to-service)
POST /oauth2/revoke {token}
GET  /oauth2/userinfo

# Login UI backend
POST /login/password {email, password, device_fp}  -> {mfa_required, challenge_id} | session
POST /login/mfa      {challenge_id, totp | webauthn_assertion}
POST /webauthn/register/begin | /finish
GET  /saml/{tenant}/login  -> redirect to customer IdP ; POST /saml/{tenant}/acs (assertion)
POST /logout  (ends SSO session, revokes refresh family, front/back-channel logout)`,
  dataModel: `users(id PK, email UNIQUE, email_verified, password_hash(argon2id params+salt), status, region, created_at)
credentials(user_id, type: totp|webauthn|recovery_code, secret_enc | public_key, sign_count, created_at)
federations(tenant_id, protocol: saml|oidc, idp_metadata_url, idp_cert, domain_hints[], jit_provisioning)
clients(client_id PK, type: public|confidential, redirect_uris[], allowed_scopes[], secret_hash)

sso_sessions(session_id PK, user_id, auth_time, amr[pwd,mfa], device, ip, expires_at)   -- Redis + DB
refresh_tokens(token_hash PK, family_id, session_id, client_id, user_id, expires_at, used_at, revoked)

signing_keys(kid PK, alg, private_key -> KMS/HSM, status: next|active|retiring|retired, created_at)
revocations(jti | session_id | user_id "not_before", expires_at)   -- small, pushed to gateways
audit_log(ts, user_id, event: login_ok|login_fail|mfa|reset|revoke, ip, ua, risk_score)  -- append-only`,
  diagram: `  [Browser / Mobile]                                       [Enterprise IdP: Okta / Entra]
        |  1. /authorize (code + PKCE)                            ^  SAML / OIDC
        v                                                         |
  +--------------+   +-------------------+   +--------------------+---------+
  | Edge / WAF   |-->| Bot & risk engine |-->|   Auth service (stateless)    |
  | rate limits  |   | IP/device rep,    |   | login, MFA, passkeys, federat.|
  +--------------+   | velocity, captcha |   | token issue, refresh rotation |
                     +-------------------+   +----+-----------+----------+---+
                                                  |           |          |
                                     +------------v--+  +-----v-----+  +-v----------+
                                     | Users DB      |  | Sessions /|  | KMS / HSM  |
                                     | (Postgres,    |  | refresh   |  | signing    |
                                     |  per region)  |  | (Redis+DB)|  | keys       |
                                     +---------------+  +-----------+  +-----+------+
                                                                             | public keys
  [API Gateway / 300 services] <---- JWKS cached (refresh 5m) ---------------+
     verify JWT locally: sig + exp + aud + iss + kid ; check revocation list (pushed)
  Multi-region: active-active auth in each region; tokens valid everywhere (same JWKS).`,
  deepDives: [
    {
      h: { en: "Sessions vs JWT: short access tokens + rotating refresh tokens", he: "Sessions מול JWT: access tokens קצרים + refresh tokens מתחלפים" },
      body: {
        en: `<p>Server-side sessions (opaque id → lookup) give instant revocation but put the session store in every request's path: 500k lookups/s and a hard dependency. Pure long-lived JWTs scale perfectly but cannot be revoked. The standard compromise:</p>
<ul>
<li><strong>Access token:</strong> JWT signed with ES256, TTL 5-15 min, claims <code>sub, aud, iss, exp, scope, sid</code>. Every service verifies locally with cached JWKS — no call to auth.</li>
<li><strong>Refresh token:</strong> opaque random 256-bit value, stored hashed, TTL days-weeks, <strong>rotated on every use</strong>. If an already-used refresh token is presented again, that is theft: revoke the whole token family (session).</li>
<li><strong>Browser:</strong> keep tokens out of JavaScript. Use a BFF that holds tokens server-side and gives the browser an <code>HttpOnly; Secure; SameSite=Lax</code> cookie — XSS cannot steal what JS cannot read.</li>
<li>The SSO session at the IdP (cookie on <code>login.example.com</code>) is what makes "log in once, use all products" work: a second product's <code>/authorize</code> completes silently.</li>
</ul>`,
        he: `<p>Sessions בצד השרת (id אטום → lookup) נותנים revocation מיידי, אבל שמים את ה-session store בנתיב של כל בקשה: 500k lookups לשנייה ותלות קשיחה. JWT ארוכי חיים סקיילבילים לגמרי, אבל אי אפשר לבטל אותם. הפשרה הסטנדרטית:</p>
<ul>
<li><strong>Access token:</strong> JWT חתום ב-ES256, TTL של 5-15 דקות, עם claims <code>sub, aud, iss, exp, scope, sid</code>. כל service מאמת מקומית עם JWKS שמור ב-cache – בלי קריאה לשירות ה-auth.</li>
<li><strong>Refresh token:</strong> ערך רנדומלי אטום של 256 ביט, נשמר כ-hash, TTL של ימים עד שבועות, ו-<strong>מתחלף בכל שימוש</strong>. אם מישהו מציג refresh token שכבר נוצל, זו גניבה: מבטלים את כל ה-family (ה-session).</li>
<li><strong>Browser:</strong> מרחיקים tokens מ-JavaScript. משתמשים ב-BFF שמחזיק את ה-tokens בצד השרת ונותן לדפדפן cookie עם <code>HttpOnly; Secure; SameSite=Lax</code> – XSS לא יכול לגנוב מה ש-JS לא יכול לקרוא.</li>
<li>ה-SSO session ב-IdP (cookie על <code>login.example.com</code>) הוא מה שגורם ל"מתחבר פעם אחת, משתמש בכל המוצרים" לעבוד: ה-<code>/authorize</code> של מוצר שני מסתיים בשקט.</li>
</ul>`
      }
    },
    {
      h: { en: "Key rotation and JWKS without breaking 300 services", he: "רוטציית מפתחות ו-JWKS בלי לשבור 300 services" },
      body: {
        en: `<p>Private signing keys live in KMS/HSM; the service signs via the KMS API or holds a key unwrapped in memory only. Every token carries a <code>kid</code> header. Rotation is a 3-phase dance:</p>
<ol>
<li><strong>Publish next:</strong> add the new public key to JWKS <em>before</em> using it. Wait longer than the max JWKS cache TTL across all verifiers (e.g. 24h).</li>
<li><strong>Activate:</strong> start signing new tokens with the new key. Old tokens still verify with the old key.</li>
<li><strong>Retire:</strong> after the longest token lifetime passes (15 min for access; refresh tokens are opaque, not signed), remove the old key from JWKS.</li>
</ol>
<ul>
<li>Verifiers: cache JWKS, refresh every ~5 min, and on unknown <code>kid</code> refetch once (rate-limited) — handles emergency rotation.</li>
<li>Always validate <code>alg</code> against an allowlist (never accept <code>none</code> or HS256 with the public key as secret), plus <code>iss</code>, <code>aud</code>, <code>exp</code> with ≤60s clock skew.</li>
<li>Compromised key: remove it from JWKS immediately; every token signed with it dies at once and users re-authenticate via refresh.</li>
</ul>`,
        he: `<p>המפתחות הפרטיים לחתימה יושבים ב-KMS/HSM; השירות חותם דרך ה-API של ה-KMS או מחזיק מפתח פתוח רק בזיכרון. בכל token יש header של <code>kid</code>. רוטציה היא ריקוד של 3 שלבים:</p>
<ol>
<li><strong>פרסום הבא:</strong> מוסיפים את המפתח הציבורי החדש ל-JWKS <em>לפני</em> שמשתמשים בו. מחכים יותר מה-TTL המקסימלי של cache ה-JWKS אצל כל המאמתים (למשל 24 שעות).</li>
<li><strong>הפעלה:</strong> מתחילים לחתום tokens חדשים במפתח החדש. Tokens ישנים עדיין מאומתים עם המפתח הישן.</li>
<li><strong>פרישה:</strong> אחרי שעבר זמן החיים הארוך ביותר של token (15 דקות ל-access; refresh tokens אטומים ולא חתומים), מסירים את המפתח הישן מה-JWKS.</li>
</ol>
<ul>
<li>מאמתים: שומרים JWKS ב-cache, מרעננים כל כ-5 דקות, וכשמגיע <code>kid</code> לא מוכר מושכים שוב פעם אחת (עם rate limit) – זה מכסה רוטציית חירום.</li>
<li>תמיד מאמתים את <code>alg</code> מול allowlist (אף פעם לא מקבלים <code>none</code> או HS256 עם המפתח הציבורי בתור secret), וגם <code>iss</code>, <code>aud</code>, <code>exp</code> עם clock skew של עד 60 שניות.</li>
<li>מפתח שנפרץ: מסירים אותו מה-JWKS מיד; כל token שנחתם בו מת בבת אחת והמשתמשים עושים re-authentication דרך refresh.</li>
</ul>`
      }
    },
    {
      h: { en: "Credential stuffing, MFA and passkeys", he: "Credential stuffing, MFA ו-passkeys" },
      body: {
        en: `<p>Attackers replay billions of leaked email/password pairs from distributed residential proxies, so per-IP limits alone fail. Layered defense, cheapest checks first:</p>
<ul>
<li><strong>Edge:</strong> WAF + per-IP and per-ASN rate limits, TLS/JA4 and device fingerprints, bot score.</li>
<li><strong>Per-account:</strong> sliding-window limit on failures per account (e.g. 10/15 min) with progressive delays — not hard lockout, which lets attackers lock out victims.</li>
<li><strong>Risk engine:</strong> new device + new country + leaked-password hit (k-anonymity check against a breach corpus) → step-up MFA or CAPTCHA.</li>
<li><strong>Return the same error and timing</strong> for "no such user" and "wrong password" to avoid account enumeration.</li>
<li><strong>MFA:</strong> TOTP and push are good; SMS is weakest (SIM swap). <strong>Passkeys (WebAuthn)</strong> are phishing-resistant: the private key never leaves the device and the signature is bound to the origin, so a fake login page gets nothing usable. Store only the public key and sign counter.</li>
</ul>`,
        he: `<p>תוקפים מריצים מיליארדי זוגות email/סיסמה שדלפו דרך residential proxies מבוזרים, אז limits לפי IP לבד לא עובדים. הגנה בשכבות, הבדיקות הזולות קודם:</p>
<ul>
<li><strong>Edge:</strong> WAF + rate limits לפי IP ולפי ASN, fingerprints של TLS/JA4 ושל המכשיר, ו-bot score.</li>
<li><strong>לכל חשבון:</strong> limit ב-sliding window על כישלונות לחשבון (למשל 10 ב-15 דקות) עם השהיות הולכות וגדלות – לא lockout קשיח, שנותן לתוקפים לנעול קורבנות מחוץ לחשבון.</li>
<li><strong>Risk engine:</strong> מכשיר חדש + מדינה חדשה + סיסמה שמופיעה בדליפות (בדיקת k-anonymity מול מאגר breaches) → step-up ל-MFA או CAPTCHA.</li>
<li><strong>אותה שגיאה ואותו timing</strong> ל"אין משתמש כזה" ול"סיסמה שגויה", כדי למנוע account enumeration.</li>
<li><strong>MFA:</strong> TOTP ו-push טובים; SMS הכי חלש (SIM swap). <strong>Passkeys (WebAuthn)</strong> עמידים ל-phishing: המפתח הפרטי לא יוצא מהמכשיר והחתימה קשורה ל-origin, אז דף login מזויף לא מקבל שום דבר שמיש. שומרים רק את המפתח הציבורי ואת ה-sign counter.</li>
</ul>`
      }
    },
    {
      h: { en: "Auth down = everything down: multi-region and graceful degradation", he: "Auth למטה = הכול למטה: multi-region ו-degradation הדרגתי" },
      body: {
        en: `<p>Design so that an auth outage hurts as little as possible:</p>
<ul>
<li><strong>Verification is decoupled:</strong> already-logged-in users keep working for the access token TTL because services verify JWTs locally. Cache JWKS on disk too, so a restarted pod can verify without reaching auth.</li>
<li><strong>Active-active per region:</strong> stateless auth pods in every region, each with a regional users DB replica. Logins read locally; writes (sign-up, password change) go to the user's home region (data residency) — a user's home region outage only blocks writes for those users.</li>
<li><strong>Refresh path:</strong> refresh tokens are replicated cross-region asynchronously; to survive lag, accept a refresh token by family id and tolerate one reuse within a short grace window instead of nuking the session.</li>
<li><strong>Dependencies:</strong> no synchronous calls to non-critical systems (analytics, email) on the login path. KMS is critical: cache a data key or keep a regional KMS replica.</li>
<li>Run game days: kill auth in one region and verify that traffic shifts and existing sessions survive.</li>
</ul>`,
        he: `<p>מתכננים כך שהשבתה של auth תכאב כמה שפחות:</p>
<ul>
<li><strong>האימות מנותק:</strong> משתמשים שכבר מחוברים ממשיכים לעבוד לאורך ה-TTL של ה-access token, כי ה-services מאמתים JWT מקומית. שומרים את ה-JWKS גם על דיסק, כך ש-Pod שעלה מחדש יכול לאמת בלי להגיע לשירות ה-auth.</li>
<li><strong>Active-active בכל region:</strong> pods של auth בלי state בכל region, עם replica של DB המשתמשים בכל אחד. Logins קוראים מקומית; כתיבות (sign-up, החלפת סיסמה) הולכות ל-home region של המשתמש (data residency) – נפילה של ה-home region חוסמת רק כתיבות של אותם משתמשים.</li>
<li><strong>מסלול ה-refresh:</strong> refresh tokens משוכפלים בין regions באופן אסינכרוני; כדי לשרוד lag, מקבלים refresh token לפי ה-family id וסובלים שימוש חוזר אחד בתוך חלון חסד קצר, במקום להרוג את ה-session.</li>
<li><strong>תלויות:</strong> אין קריאות סינכרוניות למערכות לא קריטיות (analytics, email) בנתיב ה-login. KMS קריטי: שומרים data key ב-cache או מחזיקים replica אזורי של ה-KMS.</li>
<li>מריצים game days: מפילים את ה-auth ב-region אחד ובודקים שהתנועה עוברת ושה-sessions הקיימים שורדים.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Revocation latency vs scalability: a 15-minute access token means a fired employee keeps access up to 15 minutes. For high-risk events push a small revocation list (session ids / user not_before) to gateways, or shorten TTL to 5 min at the cost of 3× refresh load.", he: "Latency של revocation מול סקייל: access token של 15 דקות אומר שעובד שפוטר שומר גישה עד 15 דקות. באירועים בסיכון גבוה דוחפים revocation list קטן (session ids או not_before למשתמש) ל-gateways, או מקצרים TTL ל-5 דקות במחיר של פי 3 עומס refresh." },
    { en: "SAML vs OIDC for enterprise: OIDC is simpler (JSON, JWT, mobile-friendly); SAML (XML signatures) is what many enterprise IdPs and procurement checklists still require. Support both, normalize to one internal identity model.", he: "SAML מול OIDC ל-enterprise: OIDC פשוט יותר (JSON, JWT, מתאים ל-mobile); SAML (חתימות XML) הוא מה שהרבה IdPs ארגוניים ורשימות רכש עדיין דורשים. תומכים בשניהם ומנרמלים למודל זהות פנימי אחד." },
    { en: "Build vs buy: Auth0/Okta/Cognito give compliance, MFA and federation fast but charge per MAU (expensive at 100M users) and lock you in; Keycloak self-hosted is free but you own patching and 99.99% uptime; fully in-house only with a dedicated security team.", he: "Build מול buy: Auth0/Okta/Cognito נותנים compliance, MFA ו-federation מהר, אבל מחייבים לפי MAU (יקר ב-100M משתמשים) ונועלים אותך; Keycloak בהוסטינג עצמי חינמי אבל ה-patching וה-99.99% uptime עליך; פיתוח פנימי מלא רק עם צוות security ייעודי." },
    { en: "Password hash cost vs CPU bill: stronger argon2id parameters slow offline cracking but multiply login CPU — tune to ~100 ms and stop attack traffic before it reaches the hasher.", he: "עלות ה-hash לסיסמה מול חשבון ה-CPU: פרמטרים חזקים יותר של argon2id מאטים cracking אופליין אבל מכפילים את ה-CPU של login – מכוונים לכ-100 ms ועוצרים תנועת מתקפה לפני שהיא מגיעה ל-hasher." }
  ],
  followUps: [
    {
      q: { en: "An employee is terminated. How quickly do they lose access everywhere, and how?", he: "עובד פוטר. תוך כמה זמן הוא מאבד גישה בכל מקום, ואיך?" },
      a: { en: "The enterprise IdP disables the user and sends a SCIM deprovision call. We mark the user disabled, revoke all refresh token families and SSO sessions (so no new access tokens), and push a user not_before timestamp to the gateway revocation cache (Redis pub/sub or a small list polled every 10s). Gateways reject any token with iat earlier than not_before, so access dies within seconds instead of waiting up to 15 minutes. Back-channel logout notifies third-party apps that keep their own sessions.", he: "ה-IdP הארגוני משבית את המשתמש ושולח קריאת SCIM deprovision. מסמנים את המשתמש כמושבת, מבטלים את כל ה-refresh token families וה-SSO sessions (אז אין access tokens חדשים), ודוחפים timestamp של not_before למשתמש ל-cache של revocation ב-gateway (Redis pub/sub או רשימה קטנה שנמשכת כל 10 שניות). ה-gateways דוחים כל token עם iat מוקדם מ-not_before, אז הגישה מתה תוך שניות במקום לחכות עד 15 דקות. Back-channel logout מודיע לאפליקציות צד שלישי שמחזיקות sessions משלהן." }
    },
    {
      q: { en: "Login traffic jumps from 5k/s to 80k/s, 99% failures, from 200k IPs. What do you do?", he: "תנועת ה-login קופצת מ-5k ל-80k לשנייה, 99% כישלונות, מ-200k כתובות IP. מה עושים?" },
      a: { en: "This is credential stuffing. Protect the hasher first: the edge rejects by bot score, JA4/device fingerprint clusters and per-ASN limits; turn on CAPTCHA or proof-of-work for unrecognized devices; serve known devices (valid device cookie) normally so real users are barely affected. Per-account velocity limits stop targeted guessing. Afterwards: force resets for accounts that successfully logged in from the attack cluster, check hits against breach corpora, and push users to passkeys.", he: "זה credential stuffing. קודם מגינים על ה-hasher: ה-edge דוחה לפי bot score, קבוצות של JA4 ו-device fingerprint ו-limits לפי ASN; מפעילים CAPTCHA או proof-of-work למכשירים לא מוכרים; ממשיכים לשרת כרגיל מכשירים מוכרים (עם device cookie תקף) כך שמשתמשים אמיתיים כמעט לא מרגישים. Limits של velocity לכל חשבון עוצרים ניחוש ממוקד. אחר כך: מכריחים איפוס לחשבונות שהצליחו להתחבר מאשכול המתקפה, בודקים התאמות מול מאגרי breaches, ודוחפים משתמשים ל-passkeys." }
    },
    {
      q: { en: "Why PKCE for a mobile app, and why not the implicit flow?", he: "למה PKCE באפליקציית mobile, ולמה לא implicit flow?" },
      a: { en: "A mobile app is a public client — it cannot keep a client secret, and another app can register the same custom URL scheme and intercept the authorization code. PKCE makes the app generate a random code_verifier and send only its SHA-256 (code_challenge) in /authorize; the token endpoint requires the original verifier, so a stolen code is useless. The implicit flow returned tokens in the URL fragment (leaks via history, referrer, logs) and has no refresh — OAuth 2.1 removes it.", he: "אפליקציית mobile היא public client – היא לא יכולה לשמור client secret, ואפליקציה אחרת יכולה לרשום את אותו custom URL scheme וליירט את ה-authorization code. ב-PKCE האפליקציה מייצרת code_verifier רנדומלי ושולחת רק את ה-SHA-256 שלו (code_challenge) ב-/authorize; ה-token endpoint דורש את ה-verifier המקורי, אז code גנוב חסר ערך. ה-implicit flow החזיר tokens ב-URL fragment (דולף דרך history, referrer ו-logs) ובלי refresh – OAuth 2.1 מוריד אותו." }
    }
  ],
  related: ["pr-auth", "flow-login-sso", "pr-rate-limiters", "crypto-hashing-practice", "pr-applied-crypto-pki", "staff-zero-trust-secrets", "staff-multi-region-data", "pr-security-owasp"]
});

/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-ad-click-aggregation", icon: "🖱️", level: 3,
  title: { en: "Design an Ad Click Aggregation System", he: "תכנון מערכת Ad Click Aggregation" },
  prompt: {
    en: "Advertisers pay per click. Design the system that ingests ad click events and lets advertisers query click counts per ad per minute (with filters like country and device) in near real time. Billing depends on these numbers.",
    he: "מפרסמים משלמים לפי קליק. תתכנן את המערכת שקולטת click events של מודעות ומאפשרת למפרסמים לשאול כמות קליקים לכל מודעה לכל דקה (עם פילטרים כמו מדינה ו-device) כמעט בזמן אמת. ה-billing תלוי במספרים האלה."
  },
  clarify: [
    { en: "Event volume: clicks per day and peak per second? How many active ads?", he: "נפח events: כמה קליקים ביום וכמה בשיא לשנייה? כמה מודעות פעילות?" },
    { en: "How fresh must dashboards be (1 minute?) and how exact must billing be (reconciled daily?)", he: "כמה טריים ה-dashboards צריכים להיות (דקה?) וכמה מדויק ה-billing צריך להיות (reconciliation יומי?)" },
    { en: "Which dimensions for filtering: country, device, placement, campaign? (Cardinality drives storage.)", he: "לפי אילו dimensions מסננים: מדינה, device, placement, campaign? (ה-cardinality קובע את האחסון.)" },
    { en: "How late can events arrive (mobile offline buffering)? Do late clicks still count?", he: "כמה באיחור events יכולים להגיע (mobile ששומר buffer אופליין)? קליקים מאוחרים עדיין נספרים?" },
    { en: "Do we need to filter fraud/bot clicks before billing?", he: "צריך לסנן קליקים של fraud ו-bots לפני ה-billing?" },
    { en: "Query patterns and retention: last 24h by minute, last 90 days by hour, 2 years by day?", he: "דפוסי שאילתה ו-retention: 24 שעות אחרונות לפי דקה, 90 יום לפי שעה, שנתיים לפי יום?" }
  ],
  functional: [
    { en: "Ingest click events (click_id, ad_id, ts, user/device, country, ip) from ad servers via a redirect/click tracker.", he: "קליטת click events (click_id, ad_id, ts, user/device, country, ip) משרתי מודעות דרך redirect או click tracker." },
    { en: "Aggregate counts per ad per minute with dimensions; serve queries for the last N minutes within seconds.", he: "אגרגציה של ספירות לכל מודעה לכל דקה עם dimensions; מענה לשאילתות על N הדקות האחרונות תוך שניות." },
    { en: "Deduplicate clicks and filter invalid/fraudulent ones; billable counts must be accurate.", he: "Dedup לקליקים וסינון קליקים לא תקינים או fraud; הספירות לחיוב חייבות להיות מדויקות." },
    { en: "Provide daily reconciled numbers for billing and top-N ads by clicks.", he: "מספרים יומיים אחרי reconciliation ל-billing ו-top-N מודעות לפי קליקים." }
  ],
  nonFunctional: [
    { en: "Scale: ~1B clicks/day (~12k/s average, ~50k/s peak), ~2M active ads.", he: "סקייל: כ-1B קליקים ביום (כ-12k לשנייה בממוצע, כ-50k בשיא), כ-2M מודעות פעילות." },
    { en: "Correctness: no double counting, no loss — effectively exactly-once counting; billing discrepancies under 0.1%.", he: "נכונות: בלי ספירה כפולה ובלי איבוד – בפועל exactly-once בספירה; פערי billing מתחת ל-0.1%." },
    { en: "Freshness: aggregates visible within ~1-2 minutes; query p99 under 1s for dashboards.", he: "טריות: אגרגציות גלויות תוך כ-1-2 דקות; p99 של שאילתה מתחת לשנייה ל-dashboards." },
    { en: "Fault tolerant: a processing node crash must not lose or double-count; ability to replay and recompute.", he: "עמידות לתקלות: קריסה של node עיבוד לא מאבדת ולא סופרת כפול; אפשר לעשות replay ולחשב מחדש." }
  ],
  estimates: {
    en: `<p><strong>Ingest:</strong> 1B/day ÷ 86,400 ≈ <strong>11.6k clicks/s</strong>, peak ~4× ≈ <strong>50k/s</strong>. Event ~300 bytes (ids, ua, ip, geo) → 300 GB/day raw, ~60 GB compressed in Kafka. Kafka at 50k msg/s × 300 B = 15 MB/s — a small cluster; 7-day retention ≈ 2 TB × RF 3 = 6 TB.</p>
<p><strong>Aggregates:</strong> not every ad is clicked every minute: say 300k ads with ≥1 click per minute, and most of them see only 1-2 (country × device) combos per minute: ~600k rows/min ≈ <strong>860M rows/day</strong> at minute granularity, ~40 bytes each in columnar storage ≈ 35 GB/day. Keep minute data 30 days (~1 TB), hourly 1 year, daily forever.</p>
<p><strong>Dedup state:</strong> click ids for a 1-hour dedup window at peak: 50k × 3,600 = 180M ids. As exact keys in RocksDB (~32 B each) ≈ 6 GB spread across Flink tasks — fine. A Bloom filter at 1% FP would be ~9.6 bits × 180M ≈ 216 MB, but false positives would drop real clicks (billing loss), so use it only as a pre-filter.</p>
<p><strong>Queries:</strong> 100k advertisers, dashboards auto-refresh every 60 s, ~10% active → ~170 QPS, mostly last-24h on one advertiser: an easy OLAP workload.</p>`,
    he: `<p><strong>קליטה:</strong> 1B ביום ÷ 86,400 ≈ <strong>11.6k קליקים לשנייה</strong>, שיא בערך פי 4 ≈ <strong>50k לשנייה</strong>. Event של כ-300 בייט (ids, ua, ip, geo) → 300 GB ביום raw, כ-60 GB דחוס ב-Kafka. Kafka ב-50k הודעות לשנייה × 300 B = 15 MB/s – קלאסטר קטן; retention של 7 ימים ≈ 2 TB × RF 3 = 6 TB.</p>
<p><strong>אגרגציות:</strong> לא כל מודעה מקבלת קליק כל דקה: נניח 300k מודעות עם קליק אחד לפחות בדקה, ורוב המודעות מקבלות 1-2 צירופי dimensions בדקה: כ-600k שורות לדקה ≈ <strong>860M שורות ביום</strong> ברזולוציה של דקה, כ-40 בייט לשורה באחסון עמודתי ≈ 35 GB ביום. שומרים דקות ל-30 יום (כ-1 TB), שעות לשנה, ימים לתמיד.</p>
<p><strong>State של dedup:</strong> click ids לחלון dedup של שעה בשיא: 50k × 3,600 = 180M ids. כמפתחות מדויקים ב-RocksDB (כ-32 B לכל אחד) ≈ 6 GB שמפוזרים על ה-tasks של Flink – בסדר. Bloom filter עם 1% FP יהיה בערך 9.6 ביט × 180M ≈ 216 MB, אבל false positives יזרקו קליקים אמיתיים (הפסד ב-billing), אז משתמשים בו רק כ-pre-filter.</p>
<p><strong>שאילתות:</strong> 100k מפרסמים, dashboards שמתרעננים כל 60 שניות, כ-10% פעילים → כ-170 QPS, רובן 24 שעות אחרונות על מפרסם אחד: עומס OLAP קל.</p>`
  },
  api: `# Click tracking (ad server redirect)
GET /c/{signed_click_token}  -> 302 Location: advertiser landing page
    token = {click_id(UUIDv7), ad_id, impression_id, ts, sig}  -- signed, prevents forging
    -> event appended to Kafka "clicks-raw" (async, local buffer)

# Query API (advertiser dashboard)
GET /v1/ads/{ad_id}/clicks?from=2026-11-14T10:00Z&to=...&granularity=minute&group_by=country,device
    -> [{ts:"10:01", country:"IL", device:"mobile", clicks:132, billable:128}]
GET /v1/advertisers/{id}/top_ads?window=1h&k=10
GET /v1/billing/{advertiser_id}/daily?date=2026-11-13   -> reconciled, final`,
  dataModel: `Kafka topic clicks-raw   key=click_id (or ad_id)  partitions=64
  {click_id, ad_id, campaign_id, advertiser_id, event_ts, ingest_ts, ip, ua, device, country, impression_id}

Flink state (RocksDB, checkpointed to S3 every 60s):
  seen_click_ids: click_id -> expiry (TTL 1h)
  window_acc: (ad_id, country, device, minute) -> count, billable_count

OLAP (ClickHouse / Druid / Pinot):
  clicks_by_minute(ad_id, advertiser_id, minute, country, device, clicks, billable)
    ORDER BY (advertiser_id, ad_id, minute) ; PARTITION BY day ; TTL 30d
  clicks_by_hour (materialized rollup) TTL 1y ; clicks_by_day forever

Data lake (S3, Parquet): raw clicks by hour  -- source of truth for batch recompute
billing_daily(advertiser_id, ad_id, date, billable_clicks, amount, version)`,
  diagram: `  [Ad servers / click tracker]  302 redirect, sign check
            |
            v
   +------------------+         +-----------------------+
   | Kafka clicks-raw |-------->| S3 data lake (Parquet)|  (Kafka Connect, hourly)
   +--------+---------+         +-----------+-----------+
            |                               |
            v                               v
   +----------------------------+    +----------------------------+
   | Flink streaming job        |    | Batch (Spark), daily       |
   | 1. validate + fraud rules  |    | full dedup + fraud ML      |
   | 2. dedup click_id (TTL 1h) |    | recompute exact counts     |
   | 3. event-time 1-min windows|    +-------------+--------------+
   |    watermark = max_ts - 2m |                  |
   |    late data -> side output|                  | overwrite partitions
   | 4. two-phase commit sink   |                  v
   +-------------+--------------+    +----------------------------+
                 |                   |  OLAP store (ClickHouse)   |
                 +------------------>|  minute / hour / day tables|
                   upsert per window +-------------+--------------+
                                                   |
                    [Query API + cache] <----------+----> [Billing: reconciled daily]`,
  deepDives: [
    {
      h: { en: "Exactly-once-ish counting: dedup + checkpoints + idempotent sinks", he: "ספירה כמעט exactly-once: dedup + checkpoints + sinks אידמפוטנטיים" },
      body: {
        en: `<p>Duplicates come from two places: <strong>upstream</strong> (users double-clicking, client retries, the tracker re-sending) and <strong>inside the pipeline</strong> (a Flink task restarts and reprocesses from the last checkpoint). Handle them separately:</p>
<ul>
<li><strong>Upstream:</strong> every click gets a unique <code>click_id</code> when the signed redirect is generated. Flink keeps <code>click_id</code> in keyed state with a 1-hour TTL and drops repeats. Same user + same ad within N seconds can also be collapsed as a business rule.</li>
<li><strong>Internal:</strong> Flink checkpoints state and Kafka offsets together (Chandy-Lamport barriers). On failure it rewinds both, so counts in state are exactly-once.</li>
<li><strong>Output:</strong> the sink must not double-apply. Either a transactional sink (Kafka transactions / two-phase commit tied to checkpoints) or, simpler, <strong>idempotent upserts</strong>: write the full count for <code>(ad_id, minute, dims)</code> with a version, never "+= delta". Replaying a window overwrites the same row with the same value.</li>
</ul>
<blockquote>💡 Real world: "exactly-once" is really "effectively once" — at-least-once delivery plus deterministic dedup and idempotent writes. Say that sentence in the interview.</blockquote>`,
        he: `<p>כפילויות מגיעות משני מקומות: <strong>upstream</strong> (משתמשים שלוחצים פעמיים, retries של ה-client, ה-tracker ששולח שוב) ו-<strong>בתוך ה-pipeline</strong> (task של Flink עושה restart ומעבד שוב מה-checkpoint האחרון). מטפלים בהם בנפרד:</p>
<ul>
<li><strong>Upstream:</strong> כל קליק מקבל <code>click_id</code> ייחודי כשה-redirect החתום נוצר. Flink שומר את <code>click_id</code> ב-keyed state עם TTL של שעה וזורק חזרות. אפשר גם לכווץ אותו משתמש + אותה מודעה בתוך N שניות ככלל עסקי.</li>
<li><strong>פנימי:</strong> Flink עושה checkpoint ל-state ול-offsets של Kafka יחד (barriers בשיטת Chandy-Lamport). בכישלון הוא מחזיר את שניהם אחורה, אז הספירות ב-state הן exactly-once.</li>
<li><strong>פלט:</strong> ה-sink לא יכול להחיל פעמיים. או sink טרנזקציוני (Kafka transactions או two-phase commit שקשור ל-checkpoints), או פשוט יותר – <strong>upserts אידמפוטנטיים</strong>: כותבים את הספירה המלאה ל-<code>(ad_id, minute, dims)</code> עם version, אף פעם לא "+= delta". Replay של חלון דורס את אותה שורה עם אותו ערך.</li>
</ul>
<blockquote>💡 מהשטח: "exactly-once" זה בעצם "effectively once" – delivery של at-least-once ועוד dedup דטרמיניסטי וכתיבות אידמפוטנטיות. תגיד את המשפט הזה בראיון.</blockquote>`
      }
    },
    {
      h: { en: "Event time, watermarks and late clicks", he: "Event time, watermarks וקליקים מאוחרים" },
      body: {
        en: `<p>Aggregate by <strong>event time</strong> (when the user clicked), not processing time — otherwise a Kafka lag spike moves clicks into the wrong minute and a replay produces different numbers. A <strong>watermark</strong> says "I believe all events up to time T have arrived"; typical: <code>watermark = max_event_ts - 2 min</code>. When the watermark passes the end of a 1-minute tumbling window, the window fires and the result is emitted.</p>
<ul>
<li><strong>Allowed lateness</strong> (e.g. 10 min): late events re-fire the window with an updated count; because the sink upserts the full count, the OLAP row is simply corrected.</li>
<li>Events later than that go to a <strong>side output</strong> (late topic) and are picked up by the daily batch recompute — nothing is dropped from billing.</li>
<li>Tune: a bigger watermark delay = more complete first results but later dashboards. 2 minutes is a good default; measure the actual lateness distribution (p99.9) from mobile clients.</li>
<li>Idle partitions stall the watermark — configure idleness detection.</li>
</ul>`,
        he: `<p>עושים אגרגציה לפי <strong>event time</strong> (מתי המשתמש לחץ), לא לפי processing time – אחרת spike של lag ב-Kafka מעביר קליקים לדקה הלא נכונה ו-replay מייצר מספרים אחרים. <strong>Watermark</strong> אומר "אני מאמין שכל ה-events עד זמן T הגיעו"; ברירת מחדל נפוצה: <code>watermark = max_event_ts - 2 min</code>. כשה-watermark עובר את סוף חלון ה-tumbling של דקה, החלון נסגר והתוצאה נפלטת.</p>
<ul>
<li><strong>Allowed lateness</strong> (למשל 10 דקות): events מאוחרים מפעילים את החלון שוב עם ספירה מעודכנת; כיוון שה-sink עושה upsert לספירה המלאה, השורה ב-OLAP פשוט מתוקנת.</li>
<li>Events מאוחרים מזה הולכים ל-<strong>side output</strong> (topic של מאוחרים) ונאספים ב-batch היומי – שום דבר לא נזרק מה-billing.</li>
<li>כיוונון: השהיית watermark גדולה יותר = תוצאות ראשונות שלמות יותר אבל dashboards מאוחרים יותר. שתי דקות זו ברירת מחדל טובה; מודדים את התפלגות האיחור האמיתית (p99.9) מ-clients של mobile.</li>
<li>Partitions בלי תנועה תוקעים את ה-watermark – מגדירים idleness detection.</li>
</ul>`
      }
    },
    {
      h: { en: "Lambda vs kappa: reconciling stream and batch", he: "Lambda מול kappa: reconciliation בין stream ל-batch" },
      body: {
        en: `<p>Billing needs numbers you can defend in an audit. Two architectures:</p>
<ul>
<li><strong>Lambda:</strong> a streaming path gives fast, approximate numbers; a nightly batch job (Spark on raw Parquet in S3) recomputes exact counts with full dedup and heavier fraud models, and <strong>overwrites</strong> the day's partitions. Dashboards show "preliminary" until the batch marks the day final. Cost: two code paths that must agree.</li>
<li><strong>Kappa:</strong> one streaming codebase; to fix a bug or recompute, replay Kafka (or the S3 archive) through a new version of the job into a new table, then swap. Simpler, but needs long retention and a replay that is fast enough.</li>
</ul>
<p>A pragmatic design: kappa-style Flink for real time, plus a daily <strong>reconciliation job</strong> that compares stream totals to batch totals per advertiser; differences above 0.1% alert and the batch result wins for invoices.</p>`,
        he: `<p>ה-billing צריך מספרים שאפשר להגן עליהם ב-audit. שתי ארכיטקטורות:</p>
<ul>
<li><strong>Lambda:</strong> מסלול streaming נותן מספרים מהירים ומקורבים; job לילי של batch (Spark על Parquet גולמי ב-S3) מחשב מחדש ספירות מדויקות עם dedup מלא ומודלי fraud כבדים יותר, ו-<strong>דורס</strong> את ה-partitions של היום. ה-dashboards מציגים "ראשוני" עד שה-batch מסמן את היום כסופי. המחיר: שני מסלולי קוד שחייבים להסכים.</li>
<li><strong>Kappa:</strong> codebase אחד של streaming; כדי לתקן באג או לחשב מחדש, עושים replay ל-Kafka (או לארכיון ב-S3) דרך גרסה חדשה של ה-job לטבלה חדשה, ואז מחליפים. פשוט יותר, אבל דורש retention ארוך ו-replay מהיר מספיק.</li>
</ul>
<p>תכנון פרגמטי: Flink בסגנון kappa לזמן אמת, ועוד <strong>job של reconciliation</strong> יומי שמשווה סכומי stream לסכומי batch לכל מפרסם; פערים מעל 0.1% מתריעים, ותוצאת ה-batch קובעת בחשבוניות.</p>`
      }
    },
    {
      h: { en: "OLAP storage and fraud filtering", he: "אחסון OLAP וסינון fraud" },
      body: {
        en: `<p><strong>Storage:</strong> a columnar OLAP store (ClickHouse, Druid, Pinot) sorted by <code>(advertiser_id, ad_id, minute)</code> answers "this advertiser, last 24h, group by country" by reading a tiny slice. Materialized rollups (minute → hour → day) keep long-range queries fast and storage small. Use <code>ReplacingMergeTree</code>-style tables (or Pinot upserts) so re-emitted windows replace rows rather than add.</p>
<p><strong>Fraud:</strong> advertisers do not pay for bots, click farms or competitor clicking.</p>
<ul>
<li><strong>Real time (cheap rules in Flink):</strong> known bot UAs and data-center IP ranges, too many clicks per IP/device per minute, click with no matching impression, click faster than humanly possible after the impression.</li>
<li><strong>Batch (ML):</strong> device graphs, behavioral patterns, post-click conversion signals; results adjust billable counts before invoicing.</li>
<li>Keep both <code>clicks</code> and <code>billable</code> columns so advertisers see what was filtered.</li>
</ul>`,
        he: `<p><strong>אחסון:</strong> store עמודתי של OLAP (ClickHouse, Druid, Pinot) שממוין לפי <code>(advertiser_id, ad_id, minute)</code> עונה על "המפרסם הזה, 24 שעות אחרונות, group by country" בקריאה של פרוסה זעירה. Rollups ממומשים (דקה → שעה → יום) שומרים על שאילתות לטווח ארוך מהירות ועל אחסון קטן. משתמשים בטבלאות בסגנון <code>ReplacingMergeTree</code> (או upserts של Pinot) כך שחלונות שנפלטים שוב מחליפים שורות במקום להוסיף.</p>
<p><strong>Fraud:</strong> מפרסמים לא משלמים על bots, חוות קליקים או מתחרים שלוחצים.</p>
<ul>
<li><strong>בזמן אמת (rules זולים ב-Flink):</strong> UAs מוכרים של bots וטווחי IP של data centers, יותר מדי קליקים ל-IP או device בדקה, קליק בלי impression תואם, קליק מהר יותר ממה שאדם מסוגל אחרי ה-impression.</li>
<li><strong>Batch (ML):</strong> גרפים של מכשירים, דפוסי התנהגות, אותות conversion אחרי הקליק; התוצאות מתקנות את הספירות לחיוב לפני החשבונית.</li>
<li>שומרים גם עמודת <code>clicks</code> וגם <code>billable</code>, כדי שמפרסמים יראו מה סונן.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Freshness vs completeness: a short watermark delay gives fast dashboards but more late corrections; a long one gives stable numbers later. Show preliminary numbers fast and finalize later.", he: "טריות מול שלמות: השהיית watermark קצרה נותנת dashboards מהירים אבל יותר תיקונים מאוחרים; ארוכה נותנת מספרים יציבים אבל מאוחר. מציגים מספרים ראשוניים מהר ומסמנים כסופיים אחר כך." },
    { en: "Exact dedup state vs Bloom filter: exact keys cost GBs of state but never drop a real click; Bloom filters are tiny but false positives lose billable clicks — acceptable for analytics, not for billing.", he: "State מדויק ל-dedup מול Bloom filter: מפתחות מדויקים עולים GBs של state אבל אף פעם לא זורקים קליק אמיתי; Bloom filter זעיר, אבל false positives מאבדים קליקים לחיוב – מקובל ל-analytics, לא ל-billing." },
    { en: "Lambda vs kappa: lambda's batch path is the audit-grade truth but doubles logic; kappa is one codebase but needs long retention and fast replays.", he: "Lambda מול kappa: מסלול ה-batch של lambda הוא האמת ברמת audit אבל מכפיל את הלוגיקה; kappa הוא codebase אחד אבל דורש retention ארוך ו-replays מהירים." },
    { en: "Pre-aggregation vs raw storage: storing only minute aggregates is cheap and fast but cannot answer new dimensions later; keeping raw Parquet in S3 allows recompute at extra storage cost.", he: "Pre-aggregation מול אחסון raw: לשמור רק אגרגציות של דקה זול ומהיר, אבל לא יכול לענות על dimensions חדשים בהמשך; שמירת Parquet גולמי ב-S3 מאפשרת חישוב מחדש במחיר אחסון נוסף." }
  ],
  followUps: [
    {
      q: { en: "One celebrity ad gets 30% of all clicks. What breaks?", he: "מודעה אחת של סלב מקבלת 30% מכל הקליקים. מה נשבר?" },
      a: { en: "If you key the window by ad_id, one Flink subtask and one Kafka partition get 15k events/s — a hot key. Fix: two-stage aggregation. Stage 1 keys by (ad_id, random salt 0..15) or simply pre-aggregates locally per subtask for each minute; stage 2 keys by ad_id and sums 16 partial counts. Dedup still keys by click_id, which is uniformly distributed, so it is unaffected. In the OLAP store it is just one row per minute — no problem there.", he: "אם ה-key של החלון הוא ad_id, subtask אחד של Flink ו-partition אחד של Kafka מקבלים 15k events לשנייה – hot key. התיקון: אגרגציה בשני שלבים. שלב 1 עושה key לפי (ad_id, salt רנדומלי 0..15) או פשוט pre-aggregation מקומי לכל subtask לכל דקה; שלב 2 עושה key לפי ad_id וסוכם 16 ספירות חלקיות. ה-dedup עדיין לפי click_id שמפוזר אחיד, אז הוא לא מושפע. ב-OLAP זו רק שורה אחת לדקה – אין שם בעיה." }
    },
    {
      q: { en: "You found a bug in the fraud rule that ran for 3 days. How do you fix the numbers?", he: "מצאת באג ב-rule של fraud שרץ 3 ימים. איך מתקנים את המספרים?" },
      a: { en: "Raw events are in S3 (and Kafka for 7 days), so recompute: run the fixed job (batch Spark, or a Flink replay in kappa) over those 3 days into new partitions, diff against the current ones, and atomically swap partitions in the OLAP store. For already-invoiced days, issue credits/adjustments through billing with a version bump and an audit record — never silently rewrite an invoice.", he: "ה-events הגולמיים ב-S3 (וב-Kafka ל-7 ימים), אז מחשבים מחדש: מריצים את ה-job המתוקן (Spark ב-batch, או replay של Flink בגישת kappa) על 3 הימים האלה ל-partitions חדשים, עושים diff מול הקיימים, ומחליפים partitions באופן אטומי ב-OLAP. לימים שכבר חויבו מוציאים זיכויים או התאמות דרך ה-billing עם version חדש ורשומת audit – אף פעם לא משכתבים חשבונית בשקט." }
    },
    {
      q: { en: "Why not just INCR a counter in Redis per (ad, minute)?", he: "למה לא פשוט לעשות INCR ל-counter ב-Redis לכל (מודעה, דקה)?" },
      a: { en: "It works for a prototype, but INCR is not idempotent: any retry or consumer restart double-counts, and you cannot replay to fix a bug. No dedup, no event-time handling of late data, no fraud filtering, and Redis is not durable enough for money. It is a fine cache in front of the OLAP store for the very latest minute, not the system of record.", he: "זה עובד ל-prototype, אבל INCR לא אידמפוטנטי: כל retry או restart של consumer סופר כפול, ואי אפשר לעשות replay כדי לתקן באג. אין dedup, אין טיפול ב-event time לדאטה מאוחר, אין סינון fraud, ו-Redis לא durable מספיק בשביל כסף. הוא cache מצוין לפני ה-OLAP לדקה הכי אחרונה, לא ה-system of record." }
    }
  ],
  related: ["staff-exactly-once", "data-stream-processing", "db-olap-columnar", "staff-kafka-deep", "algo-similarity-dedup", "pr-idempotency", "flow-event-pipeline", "pr-big-data"]
});

/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-top-k-trending", icon: "🔥", level: 2,
  title: { en: "Design Top-K / Trending (most viewed videos, trending hashtags)", he: "תכנון Top-K / Trending (הסרטונים הנצפים ביותר, hashtags בטרנד)" },
  prompt: {
    en: "Show the top 100 most viewed videos in the last 1 hour, 24 hours and 7 days, globally and per country. Also display a live view and like count on every video page.",
    he: "תציג את 100 הסרטונים הנצפים ביותר בשעה האחרונה, ב-24 השעות האחרונות וב-7 הימים האחרונים, גלובלית ולפי מדינה. בנוסף, תציג ספירת צפיות ו-likes חיה בכל דף סרטון."
  },
  clarify: [
    { en: "How many view events per second, and how many distinct videos?", he: "כמה view events לשנייה, וכמה סרטונים שונים?" },
    { en: "Must the top-K be exact, or is approximate OK? (For trending, approximate is fine; for creator payouts it is not.)", he: "ה-top-K חייב להיות מדויק, או שקירוב מספיק? (ל-trending קירוב בסדר; לתשלום ליוצרים לא.)" },
    { en: "Sliding window (exactly last 60 min) or tumbling buckets refreshed every minute?", he: "Sliding window (בדיוק 60 הדקות האחרונות) או buckets של tumbling שמתרעננים כל דקה?" },
    { en: "How fresh: is a list updated every minute good enough?", he: "כמה טרי: רשימה שמתעדכנת כל דקה מספיק טובה?" },
    { en: "Is 'trending' raw count, or velocity (growth vs baseline)?", he: "'Trending' זה ספירה גולמית, או velocity (צמיחה ביחס ל-baseline)?" }
  ],
  functional: [
    { en: "Ingest view and like events; return top-K videos for windows 1h/24h/7d, globally and per country.", he: "קליטת view ו-like events; החזרת top-K סרטונים לחלונות של שעה, 24 שעות ו-7 ימים, גלובלית ולפי מדינה." },
    { en: "Show per-video view and like counters on the video page, near real time.", he: "הצגת ספירת צפיות ו-likes לכל סרטון בדף הסרטון, כמעט בזמן אמת." },
    { en: "Support a 'trending' list ranked by velocity, not only by absolute count.", he: "תמיכה ברשימת 'trending' שמדורגת לפי velocity, לא רק לפי ספירה מוחלטת." }
  ],
  nonFunctional: [
    { en: "Scale: ~5B views/day (~60k/s average, ~200k/s peak), ~1B videos, ~50M distinct videos viewed per hour.", he: "סקייל: כ-5B צפיות ביום (כ-60k לשנייה בממוצע, כ-200k בשיא), כ-1B סרטונים, כ-50M סרטונים שונים נצפים בשעה." },
    { en: "Top-K reads: very high QPS (home page), p99 under 50 ms — serve precomputed lists from cache.", he: "קריאות top-K: QPS גבוה מאוד (דף הבית), p99 מתחת ל-50 ms – מגישים רשימות מחושבות מראש מ-cache." },
    { en: "Freshness ~1 minute; small counting errors acceptable for trending (not for payouts).", he: "טריות של כדקה; טעויות ספירה קטנות מקובלות ל-trending (לא לתשלומים)." },
    { en: "Hot videos (viral, 100k likes/s) must not create a single hot row or partition.", he: "סרטונים חמים (ויראליים, 100k likes לשנייה) לא יכולים ליצור שורה או partition חמים יחידים." }
  ],
  estimates: {
    en: `<p><strong>Events:</strong> 5B/day ÷ 86,400 ≈ <strong>58k views/s</strong>, peak ~200k/s. Per hour: ~210M views across ~50M distinct videos.</p>
<p><strong>Exact counting per hour:</strong> hash map of 50M entries × ~50 bytes (key, count, overhead) ≈ <strong>2.5 GB</strong> per window per region — feasible on one big node, but × 3 windows × 200 countries × merging across shards gets expensive, and 7d exact = ~300M keys.</p>
<p><strong>Count-Min Sketch:</strong> error ε = 0.0001 → width w = e/ε ≈ 27,200; confidence δ = 0.1% → depth d = ln(1/δ) ≈ 7. Size 27,200 × 7 × 4 bytes ≈ <strong>760 KB</strong>. Overestimate ≤ ε × N = 0.0001 × 210M = <strong>21k views</strong> per hour — negligible for videos in the top 100, which have millions. A min-heap of K=100 alongside: trivial memory.</p>
<p><strong>Shards:</strong> 200k/s peak ÷ ~20k events/s per aggregator ≈ 10-16 aggregator shards, each producing a local top-K' (K'=1,000 for safety) every minute → merger handles 16 × 1,000 candidates/min.</p>
<p><strong>Like counters:</strong> viral video at 100k likes/s on one DB row is impossible (~1-5k updates/s per row with locking). 100 sharded counters × 1k/s each, or in-memory coalescing flushed every 1 s → 1 write/s per video per writer node.</p>`,
    he: `<p><strong>Events:</strong> 5B ביום ÷ 86,400 ≈ <strong>58k צפיות לשנייה</strong>, שיא כ-200k לשנייה. בשעה: כ-210M צפיות על פני כ-50M סרטונים שונים.</p>
<p><strong>ספירה מדויקת לשעה:</strong> hash map של 50M רשומות × כ-50 בייט (key, count, overhead) ≈ <strong>2.5 GB</strong> לחלון לכל region – אפשרי על node גדול אחד, אבל × 3 חלונות × 200 מדינות × מיזוג בין shards זה כבר יקר, ו-7 ימים מדויק = כ-300M keys.</p>
<p><strong>Count-Min Sketch:</strong> שגיאה ε = 0.0001 → רוחב w = e/ε ≈ 27,200; ביטחון δ = 0.1% → עומק d = ln(1/δ) ≈ 7. גודל 27,200 × 7 × 4 בייט ≈ <strong>760 KB</strong>. הערכת יתר ≤ ε × N = 0.0001 × 210M = <strong>21k צפיות</strong> לשעה – זניח לסרטונים ב-top 100, שיש להם מיליונים. לצידו min-heap של K=100: זיכרון זניח.</p>
<p><strong>Shards:</strong> 200k לשנייה בשיא ÷ כ-20k events לשנייה ל-aggregator ≈ 10-16 shards של aggregators, וכל אחד מייצר top-K' מקומי (K'=1,000 ליתר ביטחון) כל דקה → ה-merger מטפל ב-16 × 1,000 מועמדים לדקה.</p>
<p><strong>Counters של likes:</strong> סרטון ויראלי עם 100k likes לשנייה על שורה אחת ב-DB זה בלתי אפשרי (כ-1-5k עדכונים לשנייה לשורה עם locking). 100 sharded counters × 1k לשנייה כל אחד, או coalescing בזיכרון עם flush כל שנייה → כתיבה אחת לשנייה לסרטון לכל writer node.</p>`
  },
  api: `GET  /v1/trending?window=1h|24h|7d&region=IL&k=100
     -> {generated_at, window, items:[{video_id, views, rank, delta_rank}]}   (served from cache/CDN, TTL 60s)
GET  /v1/videos/{id}/stats -> {views: 1203391, likes: 88213}   (approximate, eventually consistent)
POST /v1/videos/{id}/like     -> 202   (idempotent per user: PUT /likes/{user_id})
# internal
Kafka topic views: key=video_id (or random for hot-key spreading) {video_id, user_id, country, ts}`,
  dataModel: `Aggregator shard state (per minute bucket, per region):
  cms[d=7][w=27200] uint32           -- Count-Min Sketch
  heap: min-heap of (est_count, video_id), size K'=1000
  ring of 60 minute-buckets for 1h; 24 hour-buckets for 24h; 7 day-buckets for 7d

Top-K results (Redis, replicated):
  trending:{window}:{region}  -> sorted set / JSON list, rebuilt every minute, TTL 5m

Counters:
  video_counts(video_id, shard 0..N-1, views, likes)   -- sharded counter rows
  total = SUM over shards (cached 5-10s)
  likes(user_id, video_id) PK  -- source of truth for "did I like it", dedup

Exact batch (data lake): views_daily(video_id, country, date, views)  -- payouts, corrections`,
  diagram: `  [Players / clients]  view & like events
          |
          v
  +---------------+      +------------------------------------------+
  | Kafka "views" |----->| Aggregator shards x16 (Flink/stream app) |
  | 64 partitions |      |  per minute: CMS + local top-K' heap     |
  +-------+-------+      +---------------------+--------------------+
          |                                    | local top-1000 every minute
          |                                    v
          |                        +-------------------------+
          |                        | Merger / reducer         |
          |                        |  merge candidates, sum   |
          |                        |  sliding buckets 1h/24h  |
          |                        +-----------+-------------+
          |                                    | top-100 per window x region
          v                                    v
  +-------------------+              +------------------+       +----------+
  | Counter service   |              | Redis / KV cache |<------| CDN 60s  |<-- home page
  | coalesce 1s,      |              | trending:1h:IL   |       +----------+
  | sharded counters  |              +------------------+
  +---------+---------+
            v
     [video_counts DB]   ;   [S3 lake -> daily exact batch for payouts]`,
  deepDives: [
    {
      h: { en: "Heavy hitters: Count-Min Sketch + min-heap", he: "Heavy hitters: Count-Min Sketch + min-heap" },
      body: {
        en: `<p>A <strong>Count-Min Sketch</strong> is a d × w array of counters with d independent hash functions. On each event, increment <code>cms[i][h_i(video)]</code> for every row i. To estimate a count, take the <strong>minimum</strong> across rows — collisions only ever add, so the estimate is never below the true count, and with high probability exceeds it by at most εN. Memory is fixed (760 KB) regardless of 50M distinct keys.</p>
<p>The sketch alone cannot list keys. Keep a <strong>min-heap of size K</strong> beside it: after incrementing, read the estimate; if the video is in the heap update it, else if estimate &gt; heap minimum, pop the minimum and push this video. Each event costs O(d + log K).</p>
<ul>
<li>Sketches are <strong>mergeable</strong>: element-wise addition of two sketches with the same hash functions = sketch of the union. That is what makes sharding and sliding windows cheap.</li>
<li>Alternatives: Space-Saving / Misra-Gries keep K' counters directly and give guaranteed heavy hitters; often slightly better for pure top-K.</li>
</ul>`,
        he: `<p><strong>Count-Min Sketch</strong> הוא מערך d × w של counters עם d פונקציות hash בלתי תלויות. בכל event מעלים את <code>cms[i][h_i(video)]</code> לכל שורה i. כדי להעריך ספירה לוקחים את ה-<strong>מינימום</strong> על פני השורות – התנגשויות רק מוסיפות, אז ההערכה אף פעם לא נמוכה מהספירה האמיתית, ובהסתברות גבוהה גבוהה ממנה לכל היותר ב-εN. הזיכרון קבוע (760 KB) לא משנה שיש 50M keys שונים.</p>
<p>ה-sketch לבד לא יודע לפרט keys. מחזיקים לידו <strong>min-heap בגודל K</strong>: אחרי ההגדלה קוראים את ההערכה; אם הסרטון ב-heap מעדכנים אותו, אחרת אם ההערכה &gt; המינימום של ה-heap, מוציאים את המינימום ומכניסים את הסרטון. כל event עולה O(d + log K).</p>
<ul>
<li>Sketches הם <strong>mergeable</strong>: חיבור איבר-איבר של שני sketches עם אותן פונקציות hash = sketch של האיחוד. זה מה שהופך sharding ו-sliding windows לזולים.</li>
<li>חלופות: Space-Saving או Misra-Gries מחזיקים K' counters ישירות ונותנים heavy hitters מובטחים; לרוב קצת יותר טובים ל-top-K טהור.</li>
</ul>`
      }
    },
    {
      h: { en: "Sliding windows with buckets", he: "Sliding windows עם buckets" },
      body: {
        en: `<p>A true sliding window over raw events needs every event stored to subtract it later. Instead, use <strong>bucketed windows</strong>: one sketch (or exact map) per minute. The 1-hour window = sum of the last 60 minute-buckets; every minute, add the new bucket and drop the oldest. Because sketches merge by addition, this is 60 × 760 KB = 45 MB and a cheap sum.</p>
<ul>
<li>24h: use 24 hour-buckets (each the merge of 60 minute-buckets); 7d: 7 day-buckets. Granularity of the window edge is the bucket size — fine for trending.</li>
<li>Heap candidates must be recomputed on each slide: keep a candidate set (union of per-bucket top-K' lists), re-estimate their counts from the merged sketch, and take top K.</li>
<li><strong>Trending by velocity:</strong> score = views_last_hour / (avg hourly views over last 7 days + smoothing). This surfaces a video jumping from 100 to 50k/hour over a perennial hit at 1M/hour. Add time decay (score × e^(-λ·age)) like Reddit/Twitter.</li>
</ul>`,
        he: `<p>Sliding window אמיתי על events גולמיים דורש לשמור כל event כדי להחסיר אותו אחר כך. במקום זה משתמשים ב-<strong>חלונות של buckets</strong>: sketch אחד (או map מדויק) לכל דקה. החלון של שעה = סכום 60 ה-buckets האחרונים של דקה; כל דקה מוסיפים bucket חדש וזורקים את הישן. כיוון ש-sketches מתמזגים בחיבור, זה 60 × 760 KB = 45 MB וסכום זול.</p>
<ul>
<li>24 שעות: 24 buckets של שעה (כל אחד מיזוג של 60 buckets של דקה); 7 ימים: 7 buckets של יום. הרזולוציה של קצה החלון היא גודל ה-bucket – בסדר גמור ל-trending.</li>
<li>את המועמדים ב-heap צריך לחשב מחדש בכל הזזה: מחזיקים קבוצת מועמדים (איחוד רשימות top-K' של כל bucket), מעריכים מחדש את הספירות מה-sketch הממוזג, ולוקחים את ה-top K.</li>
<li><strong>Trending לפי velocity:</strong> score = views_last_hour / (ממוצע צפיות שעתי ב-7 הימים האחרונים + smoothing). זה מקפיץ סרטון שעלה מ-100 ל-50k לשעה מעל להיט קבוע של 1M לשעה. מוסיפים time decay (score × e^(-λ·age)) כמו ב-Reddit/Twitter.</li>
</ul>`
      }
    },
    {
      h: { en: "Map-reduce across shards: why local top-K is not enough", he: "Map-reduce בין shards: למה top-K מקומי לא מספיק" },
      body: {
        en: `<p>Each aggregator shard sees a slice of traffic. Naively merging each shard's top-100 can miss the true global #50: a video that is #150 on every one of 16 shards might be #1 globally. Fixes:</p>
<ul>
<li><strong>Partition by video_id</strong> (Kafka key = video_id): each video's views land on exactly one shard, so local counts are global counts and merging local top-K lists is exact (for that window). Downside: viral videos create hot partitions.</li>
<li>If partitioned randomly (to spread hot keys), each shard sends its <strong>sketch + top-K' candidates (K' ≫ K, e.g. 1,000)</strong>. The merger sums the sketches (element-wise), unions candidates, re-estimates from the merged sketch and takes top K. Since every shard uses the same hash seeds, the merged sketch is exact as a sketch.</li>
<li>Hybrid: key by video_id, but pre-aggregate in the producer/edge (count views per video per second locally, send one message with count=N). This kills hot-partition pressure by 100-1,000×.</li>
</ul>`,
        he: `<p>כל shard של aggregator רואה פרוסה של התנועה. מיזוג נאיבי של top-100 מכל shard יכול לפספס את מקום 50 הגלובלי האמיתי: סרטון שהוא במקום 150 בכל אחד מ-16 ה-shards יכול להיות מקום 1 גלובלית. תיקונים:</p>
<ul>
<li><strong>Partition לפי video_id</strong> (ה-key ב-Kafka הוא video_id): כל הצפיות של סרטון נוחתות על shard אחד בדיוק, אז ספירות מקומיות הן ספירות גלובליות ומיזוג של רשימות top-K מקומיות מדויק (לאותו חלון). החיסרון: סרטונים ויראליים יוצרים partitions חמים.</li>
<li>אם עושים partition רנדומלי (כדי לפזר hot keys), כל shard שולח את <strong>ה-sketch + מועמדי top-K' (K' ≫ K, למשל 1,000)</strong>. ה-merger סוכם את ה-sketches (איבר-איבר), מאחד מועמדים, מעריך מחדש מה-sketch הממוזג ולוקח top K. כיוון שכל ה-shards משתמשים באותם hash seeds, ה-sketch הממוזג מדויק כ-sketch.</li>
<li>היברידי: key לפי video_id, אבל pre-aggregation ב-producer או ב-edge (סופרים צפיות לכל סרטון לכל שנייה מקומית ושולחים הודעה אחת עם count=N). זה מוריד את הלחץ על partitions חמים פי 100-1,000.</li>
</ul>`
      }
    },
    {
      h: { en: "View and like counters: sharded counters and write coalescing", he: "Counters של צפיות ו-likes: sharded counters ו-write coalescing" },
      body: {
        en: `<p><code>UPDATE videos SET likes = likes + 1 WHERE id = ?</code> serializes on one row lock: a few thousand updates/s at best, and a viral video does 100k/s.</p>
<ul>
<li><strong>Sharded counter:</strong> N rows per video (<code>video_id, shard</code>); each write picks a random shard; reads sum N rows (cache the sum for 5-10 s). Start with N=1 and grow N for hot videos only.</li>
<li><strong>Write coalescing:</strong> counter service nodes accumulate increments in memory (<code>map[video_id] += 1</code>) and flush every 1 s as one <code>+= N</code>. 100k likes/s across 20 nodes → 20 writes/s. Crash loses ≤1 s of counts — acceptable for views; for likes keep the per-user like record as source of truth and rebuild counts from it.</li>
<li><strong>Likes must dedup per user:</strong> <code>INSERT INTO likes(user_id, video_id)</code> with a PK; only a successful insert emits a +1 event. Unlike emits -1.</li>
<li>Display: "1.2M views" needs no exactness — eventual consistency is a feature here.</li>
</ul>`,
        he: `<p><code>UPDATE videos SET likes = likes + 1 WHERE id = ?</code> עושה serialization על lock של שורה אחת: כמה אלפי עדכונים לשנייה במקרה הטוב, וסרטון ויראלי עושה 100k לשנייה.</p>
<ul>
<li><strong>Sharded counter:</strong> N שורות לכל סרטון (<code>video_id, shard</code>); כל כתיבה בוחרת shard רנדומלי; קריאה סוכמת N שורות (את הסכום שומרים ב-cache ל-5-10 שניות). מתחילים עם N=1 ומגדילים את N רק לסרטונים חמים.</li>
<li><strong>Write coalescing:</strong> ה-nodes של שירות ה-counters צוברים הגדלות בזיכרון (<code>map[video_id] += 1</code>) ועושים flush כל שנייה כ-<code>+= N</code> אחד. 100k likes לשנייה על 20 nodes → 20 כתיבות לשנייה. קריסה מאבדת עד שנייה של ספירות – מקובל לצפיות; ל-likes שומרים את רשומת ה-like לכל משתמש כמקור האמת ובונים ממנה את הספירות מחדש.</li>
<li><strong>Likes חייבים dedup לכל משתמש:</strong> <code>INSERT INTO likes(user_id, video_id)</code> עם PK; רק insert מוצלח פולט event של +1. Unlike פולט -1.</li>
<li>תצוגה: "1.2M צפיות" לא צריך דיוק – eventual consistency הוא פיצ'ר כאן.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Approximate vs exact: CMS uses 760 KB instead of GBs and merges trivially, but overcounts rare items; fine for trending, while payouts use an exact daily batch over the data lake.", he: "קירוב מול דיוק: CMS משתמש ב-760 KB במקום GBs ומתמזג בקלות, אבל סופר יותר מדי פריטים נדירים; בסדר ל-trending, ותשלומים משתמשים ב-batch יומי מדויק על ה-data lake." },
    { en: "Partition by key vs random: key partitioning makes merging exact but creates hot partitions for viral items; random spreading balances load but requires sketch merging and K' ≫ K candidates.", he: "Partition לפי key מול רנדומלי: partition לפי key הופך מיזוג למדויק אבל יוצר partitions חמים לפריטים ויראליים; פיזור רנדומלי מאזן עומס אבל דורש מיזוג sketches ו-K' ≫ K מועמדים." },
    { en: "Bucketed vs true sliding window: buckets cost a little edge precision (up to one bucket) but make windows O(buckets) memory instead of storing every event.", he: "חלון של buckets מול sliding אמיתי: buckets עולים קצת דיוק בקצה (עד bucket אחד) אבל הופכים את החלון לזיכרון של O(buckets) במקום לשמור כל event." },
    { en: "Freshness vs cost: recomputing top-K every 10 s instead of 60 s multiplies merger work 6× for a difference users rarely notice; serve from CDN with 60 s TTL.", he: "טריות מול עלות: חישוב top-K כל 10 שניות במקום 60 מכפיל את עבודת ה-merger פי 6 בשביל הבדל שמשתמשים כמעט לא מרגישים; מגישים מ-CDN עם TTL של 60 שניות." }
  ],
  followUps: [
    {
      q: { en: "Bots inflate views on one video to make it trend. How do you defend?", he: "Bots מנפחים צפיות לסרטון אחד כדי שייכנס לטרנד. איך מתגוננים?" },
      a: { en: "Count only qualified views: minimum watch time (e.g. 30 s), one view per user/device per video per window (dedup with a per-video HyperLogLog of viewer ids, so trending ranks by distinct viewers, not raw hits), and drop known bot/data-center traffic before the aggregator. Velocity-based trending is extra sensitive, so require a minimum distinct-viewer count and diversity (many countries/ASNs). A delayed batch fraud pass can remove items from the list after the fact.", he: "סופרים רק צפיות מוסמכות: זמן צפייה מינימלי (למשל 30 שניות), צפייה אחת למשתמש או מכשיר לסרטון לחלון (dedup עם HyperLogLog של viewer ids לכל סרטון, כך שה-trending מדורג לפי צופים שונים ולא לפי hits גולמיים), וזורקים תנועת bots ו-data centers מוכרת לפני ה-aggregator. Trending לפי velocity רגיש במיוחד, אז דורשים מינימום צופים שונים וגיוון (הרבה מדינות ו-ASNs). Batch של fraud באיחור יכול להוציא פריטים מהרשימה בדיעבד." }
    },
    {
      q: { en: "How would you get top-K per country for 200 countries without 200× the cost?", he: "איך מקבלים top-K לכל מדינה ל-200 מדינות בלי פי 200 בעלות?" },
      a: { en: "Traffic is skewed: the top ~30 countries carry ~90% of views. Keep a dedicated sketch + heap only for countries above a traffic threshold; each event updates the global sketch and its country's sketch (2 updates, not 200). Small countries can use exact hash maps since their distinct counts are small. Memory: 200 × 760 KB ≈ 150 MB per minute-bucket — still fine — and the merger computes per-country lists in parallel.", he: "התנועה עקומה: כ-30 המדינות הגדולות מחזיקות כ-90% מהצפיות. מחזיקים sketch + heap ייעודיים רק למדינות מעל סף תנועה; כל event מעדכן את ה-sketch הגלובלי ואת ה-sketch של המדינה שלו (2 עדכונים, לא 200). מדינות קטנות יכולות להשתמש ב-hash maps מדויקים כי מספר ה-keys השונים אצלן קטן. זיכרון: 200 × 760 KB ≈ 150 MB ל-bucket של דקה – עדיין בסדר – וה-merger מחשב רשימות לכל מדינה במקביל." }
    },
    {
      q: { en: "Why is Count-Min Sketch always an overestimate, and when does that hurt?", he: "למה Count-Min Sketch תמיד מעריך יתר, ומתי זה כואב?" },
      a: { en: "Every cell a key hashes to also accumulates other keys that collide there; counts only add, so each cell ≥ true count and the min across rows is still ≥ true count. It hurts for low-frequency items: an item with 10 real views may show 2,000 if its cells are shared with popular items. That is why CMS is used for heavy hitters (top-K), not for showing exact per-video counts, and why candidates are compared against each other where the εN error is relatively tiny.", he: "כל תא ש-key ממופה אליו צובר גם keys אחרים שמתנגשים בו; ספירות רק מתווספות, אז כל תא ≥ הספירה האמיתית והמינימום על פני השורות עדיין ≥ הספירה האמיתית. זה כואב לפריטים בתדירות נמוכה: פריט עם 10 צפיות אמיתיות יכול להראות 2,000 אם התאים שלו משותפים עם פריטים פופולריים. בגלל זה CMS משמש ל-heavy hitters (top-K) ולא להצגת ספירה מדויקת לכל סרטון, ומשווים מועמדים אחד לשני רק כשהשגיאה εN קטנה יחסית." }
    }
  ],
  related: ["data-stream-processing", "algo-similarity-dedup", "redis-deep", "staff-kafka-deep", "db-sharding", "arch-caching", "pr-big-data"]
});

/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-leaderboard", icon: "🏆", level: 1,
  title: { en: "Design a Real-Time Game Leaderboard", he: "תכנון Leaderboard בזמן אמת למשחק" },
  prompt: {
    en: "Our mobile game needs a leaderboard: after each match, a player's score updates; players see the global top 100, their own rank, players around them, and a friends leaderboard. Seasons reset monthly.",
    he: "המשחק שלנו ב-mobile צריך leaderboard: אחרי כל משחק הניקוד של השחקן מתעדכן; שחקנים רואים את ה-top 100 הגלובלי, את הדירוג שלהם, את השחקנים סביבם, ו-leaderboard של חברים. עונות מתאפסות כל חודש."
  },
  clarify: [
    { en: "How many players total and daily, and how many score updates per second at peak?", he: "כמה שחקנים בסך הכול וביום, וכמה עדכוני ניקוד לשנייה בשיא?" },
    { en: "Is a score cumulative (add points) or best-score (keep max)?", he: "הניקוד מצטבר (מוסיפים נקודות) או best-score (שומרים את המקסימום)?" },
    { en: "Do ranks need to be exact for everyone, or is 'top 12%' fine for players far down the list?", he: "הדירוג צריך להיות מדויק לכולם, או ש-'top 12%' מספיק לשחקנים שרחוקים למטה?" },
    { en: "How are ties broken: whoever reached the score first?", he: "איך שוברים שוויון: מי שהגיע לניקוד קודם?" },
    { en: "Which boards: global, per region, per friends list, per season? Do we keep history of past seasons?", he: "אילו boards: גלובלי, לפי region, לפי רשימת חברים, לפי עונה? שומרים היסטוריה של עונות קודמות?" }
  ],
  functional: [
    { en: "Update a player's score after each match (validated by the game server, not the client).", he: "עדכון הניקוד של שחקן אחרי כל משחק (מאומת על ידי שרת המשחק, לא ה-client)." },
    { en: "Get top N, a player's rank and score, and the players ranked just above and below them.", he: "קבלת top N, הדירוג והניקוד של שחקן, והשחקנים שמדורגים מעליו ומתחתיו." },
    { en: "Friends leaderboard and per-region leaderboards.", he: "Leaderboard של חברים ו-leaderboards לפי region." },
    { en: "Monthly season reset with an archive of final standings and rewards for top players.", he: "איפוס עונה חודשי עם ארכיון של הדירוג הסופי ופרסים לשחקנים המובילים." }
  ],
  nonFunctional: [
    { en: "Scale: 50M players in a season, 5M DAU, ~10k score updates/s peak, ~50k leaderboard reads/s.", he: "סקייל: 50M שחקנים בעונה, 5M DAU, כ-10k עדכוני ניקוד לשנייה בשיא, כ-50k קריאות leaderboard לשנייה." },
    { en: "Real time: a player sees the new rank within ~1 s after a match.", he: "זמן אמת: שחקן רואה את הדירוג החדש תוך כשנייה אחרי משחק." },
    { en: "Reads p99 under 50 ms.", he: "קריאות ב-p99 מתחת ל-50 ms." },
    { en: "Durable: a Redis failure must not lose the season's scores.", he: "Durable: נפילה של Redis לא יכולה לאבד את הניקוד של העונה." }
  ],
  estimates: {
    en: `<p><strong>Writes:</strong> peak 500k concurrent players, one match every ~5 min → 500k ÷ 300 s ≈ 1.7k/s; with events and spikes plan for <strong>10k updates/s</strong>.</p>
<p><strong>Reads:</strong> every end-of-match screen shows rank + neighbors + top 100: ~3 reads per match → 5k-30k/s, plan <strong>50k/s</strong>. Top-100 is identical for everyone — cache it for 1 s and it costs ~1 Redis call/s per app server.</p>
<p><strong>Memory:</strong> a Redis sorted set entry costs ~80-100 bytes (skiplist node + hash entry + member string). 50M players × 100 B ≈ <strong>5 GB</strong> — fits on one Redis node. Per-region boards duplicate it (another ~5 GB total since each player is in one region).</p>
<p><strong>Throughput:</strong> <code>ZADD</code>/<code>ZINCRBY</code> and <code>ZREVRANK</code> are O(log N): log2(50M) ≈ 26 levels; a single Redis node handles ~100k+ such ops/s. 60k ops/s total → one primary + replicas is enough. Sharding becomes necessary only around 500M players or 200k+ ops/s.</p>
<p><strong>Durability:</strong> 10k updates/s × ~100 bytes = 1 MB/s into the AOF and into Postgres/DynamoDB as the source of truth — trivial.</p>`,
    he: `<p><strong>כתיבות:</strong> בשיא 500k שחקנים במקביל, משחק כל כ-5 דקות → 500k ÷ 300 שניות ≈ 1.7k לשנייה; עם אירועים ו-spikes מתכננים ל-<strong>10k עדכונים לשנייה</strong>.</p>
<p><strong>קריאות:</strong> כל מסך סוף משחק מציג דירוג + שכנים + top 100: כ-3 קריאות למשחק → 5k-30k לשנייה, מתכננים ל-<strong>50k לשנייה</strong>. ה-top 100 זהה לכולם – שומרים אותו ב-cache לשנייה, והוא עולה בערך קריאה אחת ל-Redis לשנייה לכל שרת אפליקציה.</p>
<p><strong>זיכרון:</strong> רשומה ב-sorted set של Redis עולה כ-80-100 בייט (node של skiplist + רשומת hash + המחרוזת של ה-member). 50M שחקנים × 100 B ≈ <strong>5 GB</strong> – נכנס ל-node אחד של Redis. Boards לפי region משכפלים אותו (עוד כ-5 GB בסך הכול, כי כל שחקן נמצא ב-region אחד).</p>
<p><strong>Throughput:</strong> <code>ZADD</code>/<code>ZINCRBY</code> ו-<code>ZREVRANK</code> הם O(log N): log2(50M) ≈ 26 רמות; node יחיד של Redis מטפל ב-100k ומעלה פעולות כאלה לשנייה. 60k פעולות לשנייה בסך הכול → primary אחד + replicas מספיקים. Sharding נהיה הכרחי רק סביב 500M שחקנים או 200k פעולות לשנייה ומעלה.</p>
<p><strong>Durability:</strong> 10k עדכונים לשנייה × כ-100 בייט = 1 MB/s ל-AOF ול-Postgres/DynamoDB כמקור האמת – זניח.</p>`
  },
  api: `POST /v1/matches/{match_id}/result   (game server only, signed)  {player_id, score_delta | score}
     -> 200 {score, rank}            (idempotent per match_id)
GET  /v1/leaderboards/{board}/top?n=100         board = season:2026-11 | season:2026-11:eu
GET  /v1/leaderboards/{board}/players/{id}       -> {score, rank, percentile}
GET  /v1/leaderboards/{board}/players/{id}/around?radius=5
GET  /v1/leaderboards/{board}/friends/{id}       -> friends ranked

# Redis commands underneath
ZINCRBY lb:season:2026-11 120 player:42           (cumulative)  | ZADD lb:... GT 9800 player:42 (best score)
ZREVRANK lb:season:2026-11 player:42   -> 1532 (0-based)
ZREVRANGE lb:season:2026-11 0 99 WITHSCORES
ZREVRANGE lb:season:2026-11 1527 1537 WITHSCORES   (players around)
ZSCORE / ZMSCORE lb:season:2026-11 player:1 player:7 ...   (friends)`,
  dataModel: `Source of truth (Postgres / DynamoDB):
  scores(season, player_id, score, reached_at, PK(season, player_id))
  match_results(match_id PK, player_id, delta, ts)   -- idempotency + audit
  season_archive(season, rank, player_id, score)      -- final standings

Redis (derived, rebuildable):
  lb:{season}            ZSET member=player_id  score=encoded(score, tie-break)
  lb:{season}:{region}   ZSET per region
  lb:top100:{season}     cached JSON, TTL 1s

Tie-break encoding in one double (53-bit mantissa):
  composite = score * 2^22 + (2^22 - 1 - seconds_since_season_start / 1)   -- earlier = higher
  (score up to ~2^31; seconds in a month ~2.6M < 2^22 = 4.19M)`,
  diagram: `  [Mobile client] --match--> [Game server]  validates result (anti-cheat)
                                   |
                                   v
                       +-----------------------+
                       | Leaderboard service   |  idempotent by match_id
                       | (stateless, N pods)   |
                       +----+-------------+----+
              write-through |             | read
                            v             v
          +------------------------+   +--------------------------------+
          | Postgres / DynamoDB    |   | Redis primary + 2 replicas     |
          | scores, match_results  |   | ZSET lb:season:2026-11          |
          | (source of truth)      |   | ZSET lb:season:2026-11:eu ...   |
          +-----------+------------+   | AOF everysec, RDB snapshots     |
                      |                +---------------+----------------+
                      | rebuild on loss                | replicas serve reads
                      +------------->------------------+ (rank, around, top)
  [Friends service] -> friend ids -> ZMSCORE on main board -> sort client-side
  [Season job, monthly] -> snapshot ZSET -> season_archive + rewards ; new key lb:season:2026-12`,
  deepDives: [
    {
      h: { en: "Why Redis sorted sets, and why not SQL ORDER BY", he: "למה Redis sorted sets, ולמה לא ORDER BY ב-SQL" },
      body: {
        en: `<p>"What is my rank?" in SQL is <code>SELECT COUNT(*) FROM scores WHERE season=? AND score &gt; ?</code> — with 50M rows that scans millions of index entries per call; at 20k/s it melts the DB. A B-tree index does not store "how many entries are before me".</p>
<p>A Redis <strong>sorted set</strong> is a skiplist where each forward link stores its span, plus a hash map member → score. That makes rank an O(log N) walk: <code>ZREVRANK</code> on 50M members is ~26 hops, microseconds. Same for <code>ZREVRANGE</code> by rank (top N, players around me) and <code>ZINCRBY</code>.</p>
<ul>
<li>Cumulative scores: <code>ZINCRBY</code>. Best score: <code>ZADD key GT score member</code> (only updates if higher, Redis 6.2+).</li>
<li>Use <code>ZREVRANGE ... WITHSCORES</code> for neighbors: get rank r, then range r-5..r+5.</li>
<li>Keep Redis as a <em>derived</em> index: the DB holds the truth and Redis can be rebuilt from it.</li>
</ul>`,
        he: `<p>"מה הדירוג שלי?" ב-SQL זה <code>SELECT COUNT(*) FROM scores WHERE season=? AND score &gt; ?</code> – עם 50M שורות זה סורק מיליוני רשומות אינדקס בכל קריאה; ב-20k לשנייה זה ממיס את ה-DB. אינדקס B-tree לא שומר "כמה רשומות לפניי".</p>
<p><strong>Sorted set</strong> של Redis הוא skiplist שבו כל קישור קדימה שומר את ה-span שלו, ועוד hash map של member → score. זה הופך דירוג להליכה של O(log N): <code>ZREVRANK</code> על 50M members זה כ-26 קפיצות, מיקרו-שניות. אותו דבר ל-<code>ZREVRANGE</code> לפי דירוג (top N, שחקנים סביבי) ול-<code>ZINCRBY</code>.</p>
<ul>
<li>ניקוד מצטבר: <code>ZINCRBY</code>. Best score: <code>ZADD key GT score member</code> (מעדכן רק אם גבוה יותר, מ-Redis 6.2).</li>
<li>לשכנים משתמשים ב-<code>ZREVRANGE ... WITHSCORES</code>: מקבלים דירוג r, ואז טווח r-5..r+5.</li>
<li>Redis הוא אינדקס <em>נגזר</em>: ה-DB מחזיק את האמת ואפשר לבנות את Redis ממנו מחדש.</li>
</ul>`
      }
    },
    {
      h: { en: "Ties: encode the tie-break into the score", he: "שוויון: מקודדים את שובר השוויון לתוך ה-score" },
      body: {
        en: `<p>Redis orders equal scores lexicographically by member — "player:9" beats "player:10", which is arbitrary and unfair. Typical rule: same score → whoever reached it <strong>first</strong> ranks higher. Encode it into the double:</p>
<pre>composite = score * 2^22 + (2^22 - 1 - t)
t = seconds since season start (a month ≈ 2.6M &lt; 2^22 ≈ 4.19M)</pre>
<ul>
<li>A double has a 53-bit mantissa, so <code>score</code> can go up to 2^31 ≈ 2.1B with exact integer precision. Check your max score before choosing bit widths.</li>
<li>With <code>ZINCRBY</code> you cannot just add points to a composite (the time part would be wrong) — compute the new composite in a Lua script or in the service from the stored raw score, then <code>ZADD</code>.</li>
<li>Display the raw score (<code>floor(composite / 2^22)</code>), never the composite.</li>
</ul>`,
        he: `<p>Redis מסדר scores שווים לקסיקוגרפית לפי ה-member – "player:9" מנצח את "player:10", שזה שרירותי ולא הוגן. הכלל הנפוץ: אותו ניקוד → מי שהגיע אליו <strong>קודם</strong> מדורג גבוה יותר. מקודדים את זה לתוך ה-double:</p>
<pre>composite = score * 2^22 + (2^22 - 1 - t)
t = seconds since season start (a month ≈ 2.6M &lt; 2^22 ≈ 4.19M)</pre>
<ul>
<li>ל-double יש mantissa של 53 ביט, אז <code>score</code> יכול להגיע עד 2^31 ≈ 2.1B בדיוק של מספר שלם. בודקים את הניקוד המקסימלי לפני שבוחרים רוחב ביטים.</li>
<li>עם <code>ZINCRBY</code> אי אפשר פשוט להוסיף נקודות ל-composite (חלק הזמן יהיה שגוי) – מחשבים את ה-composite החדש בסקריפט Lua או ב-service לפי הניקוד הגולמי השמור, ואז <code>ZADD</code>.</li>
<li>מציגים את הניקוד הגולמי (<code>floor(composite / 2^22)</code>), אף פעם לא את ה-composite.</li>
</ul>`
      }
    },
    {
      h: { en: "Beyond one node: sharding and score buckets", he: "מעבר ל-node אחד: sharding ו-score buckets" },
      body: {
        en: `<p>At 500M players or 200k+ ops/s one sorted set is too big or too hot. A sorted set cannot be split by member hash and still answer "global rank" cheaply — rank needs to know about everyone. Options:</p>
<ul>
<li><strong>Shard by score range:</strong> shard 0 holds scores 0-999, shard 1 1,000-4,999, etc. Global rank = rank inside my shard + total <code>ZCARD</code> of all higher shards (cache the counts, they change slowly). Top N comes from the top shard only. Ranges must be rebalanced as the score distribution shifts over a season.</li>
<li><strong>Hash-shard + scatter-gather:</strong> shard by player_id across S nodes; top N = query top N from each shard and merge (S × N items); rank = sum over shards of <code>ZCOUNT(score, +inf)</code> — S calls per rank lookup.</li>
<li><strong>Approximate rank for the long tail:</strong> keep exact sorted sets only for the top ~100k; for everyone else keep a histogram of score buckets (e.g. 10,000 buckets) and return "top 23%". Players far down the list do not care about #18,345,201 vs #18,345,207.</li>
</ul>`,
        he: `<p>ב-500M שחקנים או 200k פעולות לשנייה ומעלה, sorted set אחד גדול מדי או חם מדי. אי אפשר לפצל sorted set לפי hash של member ועדיין לענות בזול על "דירוג גלובלי" – דירוג צריך לדעת על כולם. אפשרויות:</p>
<ul>
<li><strong>Shard לפי טווח ניקוד:</strong> shard 0 מחזיק ניקוד 0-999, shard 1 מחזיק 1,000-4,999 וכן הלאה. דירוג גלובלי = הדירוג בתוך ה-shard שלי + סכום ה-<code>ZCARD</code> של כל ה-shards הגבוהים יותר (שומרים את הספירות ב-cache, הן משתנות לאט). Top N מגיע רק מה-shard העליון. צריך לאזן מחדש את הטווחים כשהתפלגות הניקוד זזה במהלך העונה.</li>
<li><strong>Hash-shard + scatter-gather:</strong> shard לפי player_id על S nodes; top N = מבקשים top N מכל shard וממזגים (S × N פריטים); דירוג = סכום על פני ה-shards של <code>ZCOUNT(score, +inf)</code> – S קריאות לכל בדיקת דירוג.</li>
<li><strong>דירוג מקורב לזנב הארוך:</strong> שומרים sorted sets מדויקים רק ל-100k המובילים; לכל השאר מחזיקים histogram של score buckets (למשל 10,000 buckets) ומחזירים "top 23%". לשחקנים רחוק למטה לא אכפת אם הם במקום 18,345,201 או 18,345,207.</li>
</ul>`
      }
    },
    {
      h: { en: "Friends boards, seasons, persistence and recovery", he: "Boards של חברים, עונות, persistence ושחזור" },
      body: {
        en: `<p><strong>Friends:</strong> a player has ~50-500 friends. Do not maintain a sorted set per player (fan-out of every score update to every friend's board). Instead, at read time fetch friend ids and run <code>ZMSCORE lb:season player:a player:b ...</code> — one O(F) call — then sort in the service. Cache for a few seconds.</p>
<p><strong>Seasons:</strong> use a new key per season (<code>lb:season:2026-12</code>) instead of deleting 50M members at midnight. The monthly job snapshots the old set (<code>ZREVRANGE</code> in pages or from the DB) into <code>season_archive</code>, grants rewards, then sets a TTL on the old key. Clients read the "current season" id from config.</p>
<p><strong>Persistence:</strong> the DB is the source of truth, written first (with <code>match_id</code> for idempotency); Redis is updated right after. Redis runs with replicas + Sentinel/Cluster failover, AOF <code>everysec</code>. If Redis is lost entirely, rebuild: stream <code>scores</code> rows for the season and <code>ZADD</code> in batches of 1,000 — 50M rows at ~500k ZADD/s with pipelining is under 2 minutes. During rebuild, serve the last cached top 100 and hide ranks.</p>`,
        he: `<p><strong>חברים:</strong> לשחקן יש כ-50-500 חברים. לא מחזיקים sorted set לכל שחקן (fan-out של כל עדכון ניקוד ל-board של כל חבר). במקום זה, בזמן קריאה מושכים את ה-ids של החברים ומריצים <code>ZMSCORE lb:season player:a player:b ...</code> – קריאה אחת של O(F) – וממיינים ב-service. שומרים ב-cache לכמה שניות.</p>
<p><strong>עונות:</strong> key חדש לכל עונה (<code>lb:season:2026-12</code>) במקום למחוק 50M members בחצות. ה-job החודשי עושה snapshot לסט הישן (<code>ZREVRANGE</code> בעמודים או מה-DB) לתוך <code>season_archive</code>, מחלק פרסים, ואז שם TTL על ה-key הישן. ה-clients קוראים את ה-id של "העונה הנוכחית" מ-config.</p>
<p><strong>Persistence:</strong> ה-DB הוא מקור האמת ונכתב קודם (עם <code>match_id</code> בשביל idempotency); Redis מתעדכן מיד אחריו. Redis רץ עם replicas ו-failover של Sentinel או Cluster, ו-AOF ב-<code>everysec</code>. אם Redis אבד לגמרי, בונים מחדש: מזרימים את שורות <code>scores</code> של העונה ועושים <code>ZADD</code> ב-batches של 1,000 – 50M שורות בכ-500k ZADD לשנייה עם pipelining זה פחות מ-2 דקות. בזמן הבנייה מגישים את ה-top 100 האחרון מה-cache ומסתירים דירוגים.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Exact vs approximate rank: exact sorted sets for everyone are simple up to ~100M players on one node; beyond that, exact for the top and percentile buckets for the tail is far cheaper.", he: "דירוג מדויק מול מקורב: sorted sets מדויקים לכולם פשוטים עד כ-100M שחקנים על node אחד; מעבר לזה, מדויק למובילים ו-buckets של percentile לזנב זול בהרבה." },
    { en: "Write-through to DB vs Redis-only: writing the DB first adds a few ms per update but makes Redis rebuildable; Redis-only is faster but one bad failover can lose minutes of scores and player trust.", he: "Write-through ל-DB מול רק Redis: כתיבה ל-DB קודם מוסיפה כמה ms לעדכון אבל הופכת את Redis לבר-שחזור; רק Redis מהיר יותר, אבל failover אחד גרוע יכול לאבד דקות של ניקוד ואת אמון השחקנים." },
    { en: "Friends boards: precomputed per-player sets give O(1) reads but O(friends) writes per score update; computing on read with ZMSCORE is cheap for ~500 friends.", he: "Boards של חברים: sets מחושבים מראש לכל שחקן נותנים קריאה של O(1) אבל כתיבה של O(friends) בכל עדכון ניקוד; חישוב בזמן קריאה עם ZMSCORE זול לכ-500 חברים." },
    { en: "Score-range sharding vs hash sharding: range sharding gives cheap global rank but needs rebalancing as scores drift; hash sharding balances perfectly but each rank lookup becomes a scatter-gather.", he: "Sharding לפי טווח ניקוד מול hash: sharding לפי טווח נותן דירוג גלובלי זול אבל דורש איזון מחדש כשהניקוד זז; hash sharding מאוזן לגמרי אבל כל בדיקת דירוג הופכת ל-scatter-gather." }
  ],
  followUps: [
    {
      q: { en: "A player sends a fake score of 999,999,999 from a modified client. How do you prevent it?", he: "שחקן שולח ניקוד מזויף של 999,999,999 מ-client ששונה. איך מונעים?" },
      a: { en: "Never accept scores from the client. The authoritative game server computes the match result and calls the leaderboard API with a service credential (mTLS or signed request). Add sanity checks (max points per match, max matches per hour), anomaly detection on score velocity, and a review queue before season rewards. Because match_results are stored, you can recompute or remove a cheater's score and their position fixes itself.", he: "אף פעם לא מקבלים ניקוד מה-client. שרת המשחק הסמכותי מחשב את תוצאת המשחק וקורא ל-API של ה-leaderboard עם credential של service (mTLS או בקשה חתומה). מוסיפים בדיקות שפיות (מקסימום נקודות למשחק, מקסימום משחקים לשעה), זיהוי חריגות ב-velocity של ניקוד, ותור בדיקה לפני פרסי העונה. כיוון ש-match_results נשמרים, אפשר לחשב מחדש או להסיר את הניקוד של רמאי והמיקום שלו מתקן את עצמו." }
    },
    {
      q: { en: "The game server retries a match result after a timeout. Does the player get double points?", he: "שרת המשחק עושה retry לתוצאת משחק אחרי timeout. השחקן מקבל נקודות כפולות?" },
      a: { en: "Not if the write is idempotent by match_id: insert into match_results with match_id as the primary key in the same transaction as the score update; a duplicate insert fails and the service returns the stored result without touching Redis. For best-score boards ZADD GT is naturally idempotent; for cumulative ZINCRBY it is not, which is exactly why the dedup must happen before Redis.", he: "לא, אם הכתיבה אידמפוטנטית לפי match_id: מכניסים ל-match_results עם match_id כ-primary key באותה טרנזקציה של עדכון הניקוד; insert כפול נכשל וה-service מחזיר את התוצאה השמורה בלי לגעת ב-Redis. ב-boards של best-score פקודת ZADD GT אידמפוטנטית מטבעה; ב-ZINCRBY מצטבר היא לא, ובדיוק בגלל זה ה-dedup חייב לקרות לפני Redis." }
    },
    {
      q: { en: "Product wants a 'last 7 days' rolling leaderboard. How?", he: "המוצר רוצה leaderboard מתגלגל של '7 הימים האחרונים'. איך?" },
      a: { en: "Keep one sorted set per day (lb:day:2026-11-14, TTL 8 days) and update today's on each match. Every few minutes compute ZUNIONSTORE lb:7d 7 lb:day:... (sum aggregate) into a new key and atomically RENAME it into place. ZUNIONSTORE over 7 sets of a few million members takes seconds, so run it on a replica-like dedicated node or limit the rolling board to active players of the week.", he: "מחזיקים sorted set לכל יום (lb:day:2026-11-14, עם TTL של 8 ימים) ומעדכנים את של היום בכל משחק. כל כמה דקות מחשבים ZUNIONSTORE lb:7d 7 lb:day:... (אגרגציית sum) ל-key חדש ועושים לו RENAME אטומי למקום. ZUNIONSTORE על 7 sets של כמה מיליוני members לוקח שניות, אז מריצים אותו על node ייעודי או מגבילים את ה-board המתגלגל לשחקנים הפעילים של השבוע." }
    }
  ],
  related: ["redis-deep", "arch-caching", "db-sharding", "pr-idempotency", "rel-ha", "pr-backups-strategy"]
});
