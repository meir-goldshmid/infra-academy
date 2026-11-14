window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// Cloud track, part 2: managed eventing, managed Kubernetes compared, cloud AI platforms, Well-Architected reviews.

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cloud-event-services",
  track: "cloud",
  order: 30,
  icon: "📨",
  level: 2,
  minutes: 14,
  title: { en: "Cloud Eventing Services: SQS, SNS, EventBridge, Service Bus, Event Grid, Pub/Sub", he: "שירותי Eventing בענן: SQS, SNS, EventBridge, Service Bus, Event Grid, Pub/Sub" },
  tldr: {
    en: "Every cloud sells four shapes — queue, topic, stream, event bus — under confusing names. Pick by the question 'who consumes, how many times, in what order, and do I need replay?', then design for at-least-once: idempotent consumers, a DLQ on everything, and timeouts that match your processing time.",
    he: "כל ענן מוכר ארבע צורות — queue, topic, stream, event bus — תחת שמות מבלבלים. בוחרים לפי השאלה 'מי צורך, כמה פעמים, באיזה סדר, והאם צריך replay?', ואז מתכננים ל-at-least-once: consumers אידמפוטנטיים, DLQ על כל דבר, ו-timeouts שמתאימים לזמן העיבוד."
  },
  analogy: {
    en: "A queue is the deli ticket machine: each ticket is served by exactly one clerk. A topic is the PA system: everyone subscribed hears every announcement. A stream is the CCTV recording: anyone can rewind and watch from any point. An event bus is the building's mail room: it reads the envelope and routes each letter to whichever departments asked for that kind of mail.",
    he: "Queue זה מכונת המספרים בדלפק: כל מספר מקבל שירות מפקיד אחד בדיוק. Topic זה מערכת הכריזה: כל מי שמחובר שומע כל הודעה. Stream זה הקלטת מצלמות האבטחה: כל אחד יכול להריץ אחורה ולצפות מכל נקודה. Event bus זה חדר הדואר של הבניין: הוא קורא את המעטפה ומנתב כל מכתב למחלקות שביקשו סוג כזה של דואר."
  },
  sections: [
    {
      h: { en: "The four shapes and every cloud's name for them", he: "ארבע הצורות והשם שכל ענן נותן להן" },
      body: {
        en: `<p><code>arch-brokers</code> covers the theory of queue vs pub/sub vs log. Here is the managed-service map — the thing you actually click in the console:</p>
<table>
<tr><th>Shape</th><th>AWS</th><th>Azure</th><th>GCP</th><th>Use when</th></tr>
<tr><td>Queue (work distribution, 1 consumer per msg)</td><td>SQS (Standard / FIFO)</td><td>Service Bus queues (Storage Queues for the cheap/simple case)</td><td>Pub/Sub with one pull subscription (Cloud Tasks for HTTP task dispatch)</td><td>Background jobs, buffering spikes, decoupling a slow worker</td></tr>
<tr><td>Topic (fan-out, every subscriber gets a copy)</td><td>SNS (Standard / FIFO)</td><td>Service Bus topics + subscriptions</td><td>Pub/Sub topic + N subscriptions</td><td>"Order placed" must reach billing, email and analytics independently</td></tr>
<tr><td>Stream (ordered, retained, replayable log)</td><td>Kinesis Data Streams (or MSK = managed Kafka)</td><td>Event Hubs (Kafka-compatible endpoint)</td><td>Pub/Sub with seek, or Managed Service for Apache Kafka</td><td>Clickstream, telemetry, CDC, many readers at their own pace</td></tr>
<tr><td>Event bus (content-based routing of discrete events)</td><td>EventBridge</td><td>Event Grid</td><td>Eventarc</td><td>React to cloud/SaaS events, route by event content, cross-account integration</td></tr>
</table>
<p>Delivery guarantee across almost all of them: <strong>at-least-once</strong>. Duplicates will happen (a consumer crashes after doing the work but before acking). "Exactly-once" offerings (SQS FIFO dedup, Pub/Sub exactly-once, Service Bus duplicate detection) shrink the window — they do not remove the need for idempotent consumers once your side effects leave the broker (DB writes, emails, payments).</p>
<blockquote>💡 Real world: the most common production architecture on AWS is still the boring one — SNS topic fanned out to one SQS queue per consuming service, each with its own DLQ. Each team scales, pauses and replays its own queue without touching anyone else.</blockquote>`,
        he: `<p>את התאוריה של queue מול pub/sub מול log מכסה <code>arch-brokers</code>. כאן המפה של השירותים המנוהלים — מה שבאמת לוחצים עליו ב-console:</p>
<table>
<tr><th>צורה</th><th>AWS</th><th>Azure</th><th>GCP</th><th>מתי</th></tr>
<tr><td>Queue (חלוקת עבודה, consumer אחד להודעה)</td><td>SQS (Standard / FIFO)</td><td>Service Bus queues (ו-Storage Queues למקרה הזול והפשוט)</td><td>Pub/Sub עם pull subscription אחד (Cloud Tasks ל-dispatch של משימות HTTP)</td><td>Background jobs, ספיגת קפיצות עומס, ניתוק worker איטי</td></tr>
<tr><td>Topic (fan-out, כל subscriber מקבל עותק)</td><td>SNS (Standard / FIFO)</td><td>Service Bus topics + subscriptions</td><td>Pub/Sub topic + N subscriptions</td><td>"הזמנה בוצעה" צריך להגיע ל-billing, למיילים ול-analytics בנפרד</td></tr>
<tr><td>Stream (log מסודר, נשמר, אפשר replay)</td><td>Kinesis Data Streams (או MSK = Kafka מנוהל)</td><td>Event Hubs (עם endpoint תואם Kafka)</td><td>Pub/Sub עם seek, או Managed Service for Apache Kafka</td><td>Clickstream, טלמטריה, CDC, הרבה קוראים כל אחד בקצב שלו</td></tr>
<tr><td>Event bus (ניתוב לפי תוכן של events בודדים)</td><td>EventBridge</td><td>Event Grid</td><td>Eventarc</td><td>תגובה ל-events של הענן או של SaaS, ניתוב לפי תוכן ה-event, אינטגרציה בין accounts</td></tr>
</table>
<p>הבטחת המסירה כמעט בכולם: <strong>at-least-once</strong>. כפילויות יקרו (consumer קורס אחרי שעשה את העבודה ולפני ה-ack). ההצעות של "exactly-once" (dedup ב-SQS FIFO, exactly-once ב-Pub/Sub, duplicate detection ב-Service Bus) מקטינות את החלון — הן לא פוטרות אותך מ-consumers אידמפוטנטיים ברגע שה-side effects יוצאים מה-broker (כתיבה ל-DB, מיילים, תשלומים).</p>
<blockquote>💡 Real world: הארכיטקטורה הנפוצה ביותר ב-production על AWS היא עדיין המשעממת — SNS topic שעושה fan-out ל-SQS queue אחד לכל שירות צורך, לכל אחד DLQ משלו. כל צוות עושה scale, עוצר ועושה replay ל-queue שלו בלי לגעת באף אחד אחר.</blockquote>`
      }
    },
    {
      h: { en: "SQS and SNS: the knobs that decide your incidents", he: "SQS ו-SNS: הכפתורים שקובעים את התקלות שלך" },
      body: {
        en: `<table>
<tr><th></th><th>SQS Standard</th><th>SQS FIFO</th></tr>
<tr><td>Ordering</td><td>Best effort</td><td>Strict within a <code>MessageGroupId</code></td></tr>
<tr><td>Duplicates</td><td>Possible</td><td>Deduplicated for 5 min (<code>MessageDeduplicationId</code> or content-based)</td></tr>
<tr><td>Throughput</td><td>Nearly unlimited</td><td>300 API calls/s per action (3,000 msg/s with batches of 10); high-throughput mode goes far higher, per region — check current quotas</td></tr>
</table>
<p>The settings that matter:</p>
<ul>
<li><strong>Visibility timeout</strong> (default 30 s, max 12 h): after <code>ReceiveMessage</code> the message is hidden, not deleted. If you don't <code>DeleteMessage</code> in time, it reappears and another worker gets it. Rule: set it comfortably above your p99 processing time; for Lambda triggers AWS recommends ≥ 6x the function timeout.</li>
<li><strong>Long polling</strong>: <code>WaitTimeSeconds</code> up to 20 s. Short polling returns immediately (often empty) and you pay per request — long polling cuts empty receives and cost dramatically.</li>
<li><strong>Batch</strong>: up to 10 messages per receive/send/delete call. Pricing is per request (each 64 KB chunk counts as a request), so batching is a direct cost lever.</li>
<li><strong>Message size</strong>: the classic limit was 256 KiB; AWS raised SQS to 1 MiB in 2025, while SNS and EventBridge stay at 256 KB — check current quotas and remember the smallest hop wins. For larger payloads use the claim-check pattern: put the blob in S3 and send the key (the SQS Extended Client Library does this for you).</li>
<li><strong>Retention</strong>: default 4 days, max 14 days. <strong>Delay</strong>: up to 15 min per queue or per message (Standard).</li>
<li><strong>DLQ</strong> via a redrive policy: after <code>maxReceiveCount</code> receives, the message moves to the DLQ. Set the DLQ retention to the max — the age clock does not reset on Standard queues when a message moves.</li>
</ul>
<pre>aws sqs create-queue --queue-name orders-dlq --attributes MessageRetentionPeriod=1209600
aws sqs set-queue-attributes --queue-url $Q --attributes '{
  "VisibilityTimeout": "180",
  "ReceiveMessageWaitTimeSeconds": "20",
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:111122223333:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"
}'
# after fixing the bug, move messages back:
aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:111122223333:orders-dlq</pre>
<p><strong>SNS</strong> pushes each publish to every subscription (SQS, Lambda, HTTPS, email, SMS, Firehose). Use <strong>subscription filter policies</strong> so each queue only receives what it cares about, and enable <strong>raw message delivery</strong> to SQS so consumers don't have to unwrap the SNS JSON envelope. SNS FIFO topics fan out to SQS queues with ordering per message group.</p>
<blockquote>⚠️ Production tip: with Lambda + SQS, enable <code>ReportBatchItemFailures</code>. Without it, one bad message in a batch of 10 makes the whole batch fail and all 10 get retried — and the 9 good ones get processed again and again.</blockquote>`,
        he: `<table>
<tr><th></th><th>SQS Standard</th><th>SQS FIFO</th></tr>
<tr><td>סדר</td><td>Best effort</td><td>קפדני בתוך <code>MessageGroupId</code></td></tr>
<tr><td>כפילויות</td><td>אפשריות</td><td>Dedup לחלון של 5 דקות (<code>MessageDeduplicationId</code> או לפי תוכן)</td></tr>
<tr><td>Throughput</td><td>כמעט בלי גבול</td><td>300 קריאות API לשנייה לפעולה (3,000 הודעות לשנייה ב-batches של 10); high-throughput mode מגיע להרבה יותר, תלוי region — בדוק quotas עדכניים</td></tr>
</table>
<p>ההגדרות שחשובות:</p>
<ul>
<li><strong>Visibility timeout</strong> (ברירת מחדל 30 שניות, מקסימום 12 שעות): אחרי <code>ReceiveMessage</code> ההודעה מוסתרת, לא נמחקת. אם לא עשית <code>DeleteMessage</code> בזמן, היא חוזרת ו-worker אחר מקבל אותה. הכלל: לשים אותו בנוחות מעל ה-p99 של זמן העיבוד; ל-trigger של Lambda, AWS ממליצים על לפחות פי 6 מה-timeout של הפונקציה.</li>
<li><strong>Long polling</strong>: <code>WaitTimeSeconds</code> עד 20 שניות. Short polling חוזר מיד (הרבה פעמים ריק) ומשלמים לכל request — long polling מוריד דרמטית את ה-receives הריקים ואת העלות.</li>
<li><strong>Batch</strong>: עד 10 הודעות לקריאת receive/send/delete. התמחור הוא לפי request (כל 64 KB נספרים כ-request), אז batching הוא מנוף עלות ישיר.</li>
<li><strong>גודל הודעה</strong>: הגבול הקלאסי היה 256 KiB; ב-2025 AWS העלו את SQS ל-1 MiB, בעוד SNS ו-EventBridge נשארו על 256 KB — בדוק quotas עדכניים, ותזכור שה-hop הקטן ביותר קובע. ל-payloads גדולים משתמשים ב-claim-check pattern: שמים את ה-blob ב-S3 ושולחים את ה-key (ה-SQS Extended Client Library עושה את זה בשבילך).</li>
<li><strong>Retention</strong>: ברירת מחדל 4 ימים, מקסימום 14. <strong>Delay</strong>: עד 15 דקות לכל queue או לכל הודעה (ב-Standard).</li>
<li><strong>DLQ</strong> דרך redrive policy: אחרי <code>maxReceiveCount</code> קבלות, ההודעה עוברת ל-DLQ. שים ל-DLQ את ה-retention המקסימלי — בתורי Standard שעון הגיל של ההודעה לא מתאפס כשהיא עוברת.</li>
</ul>
<pre>aws sqs create-queue --queue-name orders-dlq --attributes MessageRetentionPeriod=1209600
aws sqs set-queue-attributes --queue-url $Q --attributes '{
  "VisibilityTimeout": "180",
  "ReceiveMessageWaitTimeSeconds": "20",
  "RedrivePolicy": "{\\"deadLetterTargetArn\\":\\"arn:aws:sqs:eu-west-1:111122223333:orders-dlq\\",\\"maxReceiveCount\\":\\"5\\"}"
}'
# after fixing the bug, move messages back:
aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:111122223333:orders-dlq</pre>
<p><strong>SNS</strong> דוחף כל publish לכל subscription (SQS, Lambda, HTTPS, מייל, SMS, Firehose). משתמשים ב-<strong>subscription filter policies</strong> כדי שכל queue יקבל רק מה שמעניין אותו, ומפעילים <strong>raw message delivery</strong> ל-SQS כדי שה-consumers לא יצטרכו לפרק את מעטפת ה-JSON של SNS. SNS FIFO topics עושים fan-out ל-SQS queues עם סדר לפי message group.</p>
<blockquote>⚠️ Production tip: עם Lambda + SQS, תפעיל <code>ReportBatchItemFailures</code>. בלי זה, הודעה רעה אחת ב-batch של 10 מכשילה את כל ה-batch וכל ה-10 חוזרים — וה-9 הטובות מעובדות שוב ושוב.</blockquote>`
      }
    },
    {
      h: { en: "EventBridge: buses, patterns, Scheduler, Pipes, archive & replay", he: "EventBridge: buses, patterns, Scheduler, Pipes, archive ו-replay" },
      body: {
        en: `<p>EventBridge is a router, not a queue. Events land on a <strong>bus</strong> (the <code>default</code> bus receives AWS service events; you create custom buses for your own domain events; partner buses receive SaaS events like Zendesk or Datadog). <strong>Rules</strong> match events with a JSON <strong>pattern</strong> and send them to up to 5 targets each (Lambda, SQS, Step Functions, API destinations, another bus, cross-account).</p>
<pre>{
  "source": ["shop.orders"],
  "detail-type": ["OrderPlaced"],
  "detail": {
    "total":   [{ "numeric": ["&gt;=", 1000] }],
    "country": [{ "anything-but": ["US"] }],
    "sku":     [{ "prefix": "GIFT-" }]
  }
}</pre>
<pre>aws events put-events --entries '[{
  "EventBusName": "shop",
  "Source": "shop.orders",
  "DetailType": "OrderPlaced",
  "Detail": "{\\"orderId\\":\\"o-981\\",\\"total\\":1250,\\"country\\":\\"IL\\",\\"sku\\":\\"GIFT-50\\"}"
}]'
aws events test-event-pattern --event file://event.json --event-pattern file://pattern.json</pre>
<ul>
<li><strong>Retries</strong>: failed target deliveries are retried with backoff for up to 24 h / 185 attempts by default (both configurable). Attach a <strong>DLQ (SQS) per target</strong>, or failed events are silently dropped after the retry window.</li>
<li><strong>Archive &amp; replay</strong>: archive all or a filtered subset of events on a bus (retention you choose), then replay a time range back onto the bus — great after fixing a consumer bug. Replayed events carry a <code>replay-name</code> field; make sure consumers are idempotent.</li>
<li><strong>EventBridge Scheduler</strong>: a separate service for one-off (<code>at(...)</code>), <code>rate(...)</code> and <code>cron(...)</code> schedules with time zones and flexible windows, scaling to millions of schedules — the modern replacement for scheduled rules.</li>
<li><strong>Pipes</strong>: point-to-point source → filter → optional enrichment (Lambda, Step Functions, API) → target. Sources include SQS, Kinesis, DynamoDB Streams, MSK. It replaces the "glue Lambda" that just reads from a queue and forwards.</li>
<li><strong>Schema registry</strong> can discover event shapes and generate code bindings.</li>
</ul>
<p>Limits to know: 256 KB per event; <code>PutEvents</code> throughput is a region-dependent soft quota; delivery latency is typically sub-second but not guaranteed — don't put EventBridge in a latency-critical synchronous path.</p>
<p><strong>Kinesis Data Streams</strong> is the stream option: each shard ingests 1 MB/s or 1,000 records/s and serves 2 MB/s of reads (shared, or 2 MB/s per consumer with enhanced fan-out). Ordering is per partition key/shard; retention 24 h by default, extendable to 365 days. On-demand mode autoscales shards; provisioned mode is cheaper when traffic is steady.</p>`,
        he: `<p>EventBridge הוא router, לא queue. Events נוחתים על <strong>bus</strong> (ה-bus ה-<code>default</code> מקבל events של שירותי AWS; יוצרים custom buses ל-domain events שלך; partner buses מקבלים events של SaaS כמו Zendesk או Datadog). <strong>Rules</strong> מתאימים events לפי <strong>pattern</strong> של JSON ושולחים אותם לעד 5 targets כל אחד (Lambda, SQS, Step Functions, API destinations, bus אחר, account אחר).</p>
<pre>{
  "source": ["shop.orders"],
  "detail-type": ["OrderPlaced"],
  "detail": {
    "total":   [{ "numeric": ["&gt;=", 1000] }],
    "country": [{ "anything-but": ["US"] }],
    "sku":     [{ "prefix": "GIFT-" }]
  }
}</pre>
<pre>aws events put-events --entries '[{
  "EventBusName": "shop",
  "Source": "shop.orders",
  "DetailType": "OrderPlaced",
  "Detail": "{\\"orderId\\":\\"o-981\\",\\"total\\":1250,\\"country\\":\\"IL\\",\\"sku\\":\\"GIFT-50\\"}"
}]'
aws events test-event-pattern --event file://event.json --event-pattern file://pattern.json</pre>
<ul>
<li><strong>Retries</strong>: מסירות שנכשלו ל-target מקבלות retry עם backoff עד 24 שעות / 185 ניסיונות כברירת מחדל (שניהם ניתנים להגדרה). תצמיד <strong>DLQ (SQS) לכל target</strong>, אחרת events שנכשלו נזרקים בשקט אחרי חלון ה-retry.</li>
<li><strong>Archive ו-replay</strong>: שומרים את כל ה-events על bus או תת-קבוצה מסוננת (עם retention שאתה בוחר), ואז עושים replay לטווח זמן בחזרה ל-bus — מצוין אחרי תיקון באג ב-consumer. ל-events שעברו replay יש שדה <code>replay-name</code>; תוודא שה-consumers אידמפוטנטיים.</li>
<li><strong>EventBridge Scheduler</strong>: שירות נפרד ל-schedules חד-פעמיים (<code>at(...)</code>), <code>rate(...)</code> ו-<code>cron(...)</code> עם time zones וחלונות גמישים, שמגיע למיליוני schedules — המחליף המודרני ל-scheduled rules.</li>
<li><strong>Pipes</strong>: חיבור נקודה-לנקודה source → filter → enrichment אופציונלי (Lambda, Step Functions, API) → target. ה-sources כוללים SQS, Kinesis, DynamoDB Streams, MSK. זה מחליף את ה-"Lambda דבק" שרק קורא מ-queue ומעביר הלאה.</li>
<li><strong>Schema registry</strong> יודע לגלות את מבנה ה-events ולייצר code bindings.</li>
</ul>
<p>גבולות שכדאי להכיר: 256 KB ל-event; ה-throughput של <code>PutEvents</code> הוא soft quota שתלוי ב-region; ה-latency של המסירה בדרך כלל מתחת לשנייה אבל לא מובטח — אל תשים את EventBridge במסלול סינכרוני קריטי ל-latency.</p>
<p><strong>Kinesis Data Streams</strong> הוא האופציה של stream: כל shard קולט 1 MB/s או 1,000 records לשנייה ומגיש 2 MB/s לקריאה (משותף, או 2 MB/s לכל consumer עם enhanced fan-out). הסדר הוא לפי partition key/shard; retention של 24 שעות כברירת מחדל, אפשר להאריך עד 365 ימים. On-demand mode עושה autoscale ל-shards; provisioned mode זול יותר כשהתעבורה יציבה.</p>`
      }
    },
    {
      h: { en: "Azure and GCP: Service Bus vs Event Grid vs Event Hubs, Pub/Sub & Eventarc", he: "Azure ו-GCP: Service Bus מול Event Grid מול Event Hubs, Pub/Sub ו-Eventarc" },
      body: {
        en: `<p>Azure splits by intent, and Microsoft's own guidance is "messages vs events vs event streams":</p>
<table>
<tr><th></th><th>Service Bus</th><th>Event Grid</th><th>Event Hubs</th></tr>
<tr><td>Shape</td><td>Queue + topics (enterprise broker)</td><td>Push-based event router</td><td>Partitioned stream (Kafka API)</td></tr>
<tr><td>Payload intent</td><td>"Do this" — a command someone must process</td><td>"This happened" — lightweight notification</td><td>Telemetry firehose</td></tr>
<tr><td>Key features</td><td>Peek-lock, sessions (FIFO per session), duplicate detection, scheduled messages, transactions, built-in DLQ, max delivery count (default 10)</td><td>Filters, CloudEvents 1.0 native, retries up to 24 h (default 30 attempts), dead-letter to Blob storage</td><td>Partitions, consumer groups, Capture to Storage/Data Lake, retention 1-7 days (Standard), longer on Premium/Dedicated</td></tr>
<tr><td>Size/scale</td><td>256 KB msgs on Standard, up to 100 MB on Premium</td><td>1 MB events (billed in 64 KB units)</td><td>1 throughput unit ≈ 1 MB/s in, 2 MB/s out</td></tr>
</table>
<p>A classic combo: Blob Storage emits <code>BlobCreated</code> → Event Grid → Service Bus queue → worker. Event Grid gives reach; Service Bus gives durability, retries and backpressure.</p>
<p><strong>GCP Pub/Sub</strong> is one service that covers queue and topic: a topic with one subscription is a queue; N subscriptions is fan-out. Subscription types: pull, push (HTTPS), BigQuery and Cloud Storage (write directly, no code). Knobs: ack deadline (default 10 s, max 600 s; client libraries extend it automatically), <strong>ordering keys</strong> (ordered per key, per region), <strong>exactly-once delivery</strong> (pull subscriptions only), <strong>dead-letter topic</strong> with max delivery attempts 5-100, retry policy with exponential backoff, message size up to 10 MB, subscription retention up to 7 days, and <strong>seek</strong> to a timestamp or snapshot for replay.</p>
<pre>gcloud pubsub topics create orders
gcloud pubsub topics create orders-dlq
gcloud pubsub subscriptions create billing-sub --topic=orders \\
  --ack-deadline=60 --enable-message-ordering \\
  --dead-letter-topic=orders-dlq --max-delivery-attempts=5 \\
  --min-retry-delay=10s --max-retry-delay=600s
gcloud pubsub subscriptions seek billing-sub --time=2026-11-14T08:00:00Z</pre>
<p><strong>Eventarc</strong> is GCP's event bus: it routes Google Cloud events (direct events like Cloud Storage object finalize, or almost anything via Cloud Audit Logs), Pub/Sub messages and third-party events to Cloud Run, GKE, Workflows or Cloud Functions — delivered as <strong>CloudEvents</strong>, over Pub/Sub under the hood. Eventarc Advanced adds a central message bus with filtering and transformation.</p>
<blockquote>⚠️ Production tip: Pub/Sub push subscriptions retry on any non-2xx (and on timeouts). A Cloud Run handler that returns 500 for a malformed message will be hammered until the delivery-attempt limit — only if you configured a dead-letter topic. Without one, it retries until retention expires.</blockquote>`,
        he: `<p>Azure מפצל לפי כוונה, וההנחיה של Microsoft עצמה היא "messages מול events מול event streams":</p>
<table>
<tr><th></th><th>Service Bus</th><th>Event Grid</th><th>Event Hubs</th></tr>
<tr><td>צורה</td><td>Queue + topics (broker ארגוני)</td><td>Event router מבוסס push</td><td>Stream מחולק ל-partitions (Kafka API)</td></tr>
<tr><td>כוונת ה-payload</td><td>"תעשה את זה" — command שמישהו חייב לעבד</td><td>"זה קרה" — התראה קלה</td><td>צינור טלמטריה</td></tr>
<tr><td>יכולות מפתח</td><td>Peek-lock, sessions (FIFO לכל session), duplicate detection, scheduled messages, transactions, DLQ מובנה, max delivery count (ברירת מחדל 10)</td><td>Filters, תמיכה native ב-CloudEvents 1.0, retries עד 24 שעות (ברירת מחדל 30 ניסיונות), dead-letter ל-Blob storage</td><td>Partitions, consumer groups, Capture ל-Storage/Data Lake, retention של 1-7 ימים (Standard), יותר ב-Premium/Dedicated</td></tr>
<tr><td>גודל/scale</td><td>הודעות של 256 KB ב-Standard, עד 100 MB ב-Premium</td><td>Events של 1 MB (חיוב ביחידות של 64 KB)</td><td>Throughput unit אחד ≈ 1 MB/s פנימה, 2 MB/s החוצה</td></tr>
</table>
<p>קומבינציה קלאסית: Blob Storage פולט <code>BlobCreated</code> → Event Grid → Service Bus queue → worker. Event Grid נותן טווח הגעה; Service Bus נותן עמידות, retries ו-backpressure.</p>
<p><strong>GCP Pub/Sub</strong> הוא שירות אחד שמכסה גם queue וגם topic: topic עם subscription אחד הוא queue; N subscriptions זה fan-out. סוגי subscription: pull, push (HTTPS), BigQuery ו-Cloud Storage (כותבים ישירות, בלי קוד). הכפתורים: ack deadline (ברירת מחדל 10 שניות, מקסימום 600; ה-client libraries מאריכים אוטומטית), <strong>ordering keys</strong> (סדר לפי key, לפי region), <strong>exactly-once delivery</strong> (רק ב-pull subscriptions), <strong>dead-letter topic</strong> עם max delivery attempts בין 5 ל-100, retry policy עם exponential backoff, הודעות עד 10 MB, retention ב-subscription עד 7 ימים, ו-<strong>seek</strong> ל-timestamp או snapshot בשביל replay.</p>
<pre>gcloud pubsub topics create orders
gcloud pubsub topics create orders-dlq
gcloud pubsub subscriptions create billing-sub --topic=orders \\
  --ack-deadline=60 --enable-message-ordering \\
  --dead-letter-topic=orders-dlq --max-delivery-attempts=5 \\
  --min-retry-delay=10s --max-retry-delay=600s
gcloud pubsub subscriptions seek billing-sub --time=2026-11-14T08:00:00Z</pre>
<p><strong>Eventarc</strong> הוא ה-event bus של GCP: הוא מנתב events של Google Cloud (direct events כמו object finalize ב-Cloud Storage, או כמעט כל דבר דרך Cloud Audit Logs), הודעות Pub/Sub ו-events של צד שלישי ל-Cloud Run, GKE, Workflows או Cloud Functions — בפורמט <strong>CloudEvents</strong>, ומתחת למכסה זה רץ על Pub/Sub. Eventarc Advanced מוסיף message bus מרכזי עם סינון וטרנספורמציה.</p>
<blockquote>⚠️ Production tip: Pub/Sub push subscriptions עושים retry על כל תשובה שאינה 2xx (וגם על timeouts). Handler ב-Cloud Run שמחזיר 500 על הודעה פגומה יופצץ עד לגבול ה-delivery attempts — רק אם הגדרת dead-letter topic. בלי זה, ה-retries ממשיכים עד שה-retention נגמר.</blockquote>`
      }
    },
    {
      h: { en: "CloudEvents and the decision table", he: "CloudEvents וטבלת ההחלטה" },
      body: {
        en: `<p><strong>CloudEvents</strong> (CNCF graduated) is a vendor-neutral envelope for event metadata. Required attributes: <code>specversion</code>, <code>id</code>, <code>source</code>, <code>type</code>; common optional ones: <code>subject</code>, <code>time</code>, <code>datacontenttype</code>, <code>dataschema</code>. Over HTTP it comes in <em>structured</em> mode (whole thing in a JSON body) or <em>binary</em> mode (attributes as <code>ce-*</code> headers, payload as body). Event Grid, Eventarc and Knative speak it natively; EventBridge uses its own envelope (<code>source</code>, <code>detail-type</code>, <code>detail</code>) but maps cleanly.</p>
<pre>{
  "specversion": "1.0",
  "id": "8f2c1a9e-0b7d-4c55-9a51-2f1f8d3b7c10",
  "source": "//shop/orders-service",
  "type": "com.shop.order.placed.v1",
  "subject": "orders/o-981",
  "time": "2026-11-14T09:12:44Z",
  "datacontenttype": "application/json",
  "data": { "orderId": "o-981", "total": 1250 }
}</pre>
<p>Use <code>id</code> + <code>source</code> as your dedup key, and version the <code>type</code> — it makes idempotency and schema evolution boring.</p>
<p><strong>The decision table</strong>:</p>
<table>
<tr><th>Requirement</th><th>Pick</th></tr>
<tr><td>One worker must do each job; absorb spikes; retries + DLQ</td><td>Queue (SQS, Service Bus queue, Pub/Sub pull sub)</td></tr>
<tr><td>Same message to N independent services</td><td>Topic → queue per consumer (SNS→SQS, Service Bus topic, Pub/Sub subs)</td></tr>
<tr><td>Ordered history, replay from a point, high throughput, many readers</td><td>Stream (Kinesis, Event Hubs, Kafka/MSK)</td></tr>
<tr><td>React to cloud/SaaS events, route by content, cross-account, low volume per type</td><td>Event bus (EventBridge, Event Grid, Eventarc)</td></tr>
<tr><td>Strict order per entity</td><td>FIFO with group IDs / sessions / ordering keys / partition key — and accept lower throughput per key</td></tr>
<tr><td>Run something at a time</td><td>EventBridge Scheduler, Cloud Scheduler, Service Bus scheduled messages</td></tr>
</table>
<p><strong>Non-negotiables on every option</strong>: a DLQ with an alarm on its depth; idempotent consumers (dedup table keyed by event id, or conditional writes); a retry policy with backoff and a cap; timeouts (visibility / lock / ack deadline) above p99 processing time; and a runbook for redrive.</p>`,
        he: `<p><strong>CloudEvents</strong> (CNCF graduated) הוא מעטפה ניטרלית-לספק ל-metadata של events. שדות חובה: <code>specversion</code>, <code>id</code>, <code>source</code>, <code>type</code>; אופציונליים נפוצים: <code>subject</code>, <code>time</code>, <code>datacontenttype</code>, <code>dataschema</code>. מעל HTTP זה מגיע ב-mode <em>structured</em> (הכל ב-body של JSON) או ב-mode <em>binary</em> (השדות כ-headers של <code>ce-*</code>, ה-payload כ-body). Event Grid, Eventarc ו-Knative מדברים את זה native; EventBridge משתמש במעטפה משלו (<code>source</code>, <code>detail-type</code>, <code>detail</code>) אבל המיפוי נקי.</p>
<pre>{
  "specversion": "1.0",
  "id": "8f2c1a9e-0b7d-4c55-9a51-2f1f8d3b7c10",
  "source": "//shop/orders-service",
  "type": "com.shop.order.placed.v1",
  "subject": "orders/o-981",
  "time": "2026-11-14T09:12:44Z",
  "datacontenttype": "application/json",
  "data": { "orderId": "o-981", "total": 1250 }
}</pre>
<p>תשתמש ב-<code>id</code> + <code>source</code> כמפתח ה-dedup, ותעשה versioning ל-<code>type</code> — זה הופך אידמפוטנטיות ואבולוציה של schema למשעממות.</p>
<p><strong>טבלת ההחלטה</strong>:</p>
<table>
<tr><th>דרישה</th><th>בחירה</th></tr>
<tr><td>Worker אחד חייב לבצע כל job; לספוג קפיצות; retries + DLQ</td><td>Queue (SQS, Service Bus queue, Pub/Sub pull sub)</td></tr>
<tr><td>אותה הודעה ל-N שירותים בלתי תלויים</td><td>Topic → queue לכל consumer (SNS→SQS, Service Bus topic, Pub/Sub subs)</td></tr>
<tr><td>היסטוריה מסודרת, replay מנקודה, throughput גבוה, הרבה קוראים</td><td>Stream (Kinesis, Event Hubs, Kafka/MSK)</td></tr>
<tr><td>תגובה ל-events של הענן/SaaS, ניתוב לפי תוכן, בין accounts, נפח נמוך לכל סוג</td><td>Event bus (EventBridge, Event Grid, Eventarc)</td></tr>
<tr><td>סדר קפדני לכל ישות</td><td>FIFO עם group IDs / sessions / ordering keys / partition key — ולקבל throughput נמוך יותר לכל key</td></tr>
<tr><td>להריץ משהו בזמן מסוים</td><td>EventBridge Scheduler, Cloud Scheduler, Service Bus scheduled messages</td></tr>
</table>
<p><strong>מה שלא מתפשרים עליו בשום אופציה</strong>: DLQ עם alarm על העומק שלו; consumers אידמפוטנטיים (טבלת dedup לפי event id, או conditional writes); retry policy עם backoff ותקרה; timeouts (visibility / lock / ack deadline) מעל ה-p99 של זמן העיבוד; ו-runbook ל-redrive.</p>`
      }
    }
  ],
  diagram: "producer -> SNS topic --filter--> SQS billing  (+DLQ) -> worker\n                      --filter--> SQS email    (+DLQ) -> Lambda\n                      --------->  SQS analytics (+DLQ) -> batch job\n\nAWS service event -> EventBridge bus --rule/pattern--> Step Functions | SQS | API destination\n                                       \\-- archive --> replay",
  handsOn: [
    { cmd: "aws sqs get-queue-attributes --queue-url $Q --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible VisibilityTimeout RedrivePolicy", what: { en: "Backlog (visible), in-flight (not visible) and the two settings that cause most incidents.", he: "Backlog (visible), in-flight (not visible) ושתי ההגדרות שגורמות לרוב התקלות." } },
    { cmd: "aws sqs receive-message --queue-url $Q --wait-time-seconds 20 --max-number-of-messages 10 --attribute-names ApproximateReceiveCount", what: { en: "Long-poll a batch and see how many times each message was already received — a high count smells like a poison message.", he: "Long polling ל-batch ולראות כמה פעמים כל הודעה כבר התקבלה — מספר גבוה מריח כמו poison message." } },
    { cmd: "aws events test-event-pattern --event file://event.json --event-pattern file://pattern.json", what: { en: "Unit-test an EventBridge rule pattern before deploying it.", he: "Unit test ל-pattern של EventBridge rule לפני שעושים לו deploy." } },
    { cmd: "gcloud pubsub subscriptions describe billing-sub --format='yaml(ackDeadlineSeconds,deadLetterPolicy,retryPolicy,enableExactlyOnceDelivery)'", what: { en: "Check the Pub/Sub subscription's delivery settings in one line.", he: "לבדוק את הגדרות המסירה של Pub/Sub subscription בשורה אחת." } }
  ],
  mnemonic: {
    en: "Queue = one eats. Topic = all hear. Stream = rewind. Bus = route by envelope. And everyone delivers twice.",
    he: "Queue = אחד אוכל. Topic = כולם שומעים. Stream = מריצים אחורה. Bus = מנתבים לפי המעטפה. וכולם מוסרים פעמיים."
  },
  pitfalls: [
    { en: "Visibility timeout shorter than processing time: the message reappears mid-processing, a second worker takes it, and you get duplicates plus a growing backlog that looks like 'not enough workers'.", he: "Visibility timeout קצר מזמן העיבוד: ההודעה חוזרת באמצע העיבוד, worker שני לוקח אותה, ומקבלים כפילויות ו-backlog שגדל ונראה כמו 'אין מספיק workers'." },
    { en: "No DLQ (or a DLQ nobody alarms on): one poison message retries forever, or failed EventBridge/Event Grid deliveries are dropped after the retry window with no trace.", he: "אין DLQ (או DLQ שאף אחד לא שם עליו alarm): poison message אחת עושה retry לנצח, או מסירות שנכשלו ב-EventBridge/Event Grid נזרקות אחרי חלון ה-retry בלי זכר." },
    { en: "Using an event bus as a high-throughput data pipe: per-event pricing and soft quotas make EventBridge/Event Grid the wrong tool for millions of telemetry records per second — use a stream.", he: "שימוש ב-event bus כצינור נתונים ב-throughput גבוה: תמחור לפי event ו-soft quotas הופכים את EventBridge/Event Grid לכלי הלא נכון למיליוני רשומות טלמטריה בשנייה — תשתמש ב-stream." },
    { en: "Choosing FIFO with a single group ID 'to be safe': you serialize the whole queue to one consumer at a time and cap throughput. Group by entity (orderId, accountId).", he: "בחירה ב-FIFO עם group ID אחד 'ליתר ביטחון': אתה הופך את כל ה-queue לסדרתי, consumer אחד בכל רגע, ומגביל את ה-throughput. תעשה group לפי ישות (orderId, accountId)." }
  ],
  interview: [
    {
      q: { en: "SNS+SQS, EventBridge or Kinesis for 'order placed' consumed by 5 services?", he: "SNS+SQS, EventBridge או Kinesis עבור 'order placed' שנצרך ע\"י 5 שירותים?" },
      a: { en: "If the volume is moderate and consumers need independent retries/backpressure: EventBridge (content routing, archive/replay, cross-account) or SNS→SQS per consumer — in both cases put an SQS queue in front of each consumer for buffering and DLQ. If it's high-volume, needs ordering per order and consumers want to replay history at their own pace: Kinesis/MSK. Deciding factors: volume, replay needs, ordering, routing complexity, cost per event.", he: "אם הנפח בינוני וה-consumers צריכים retries ו-backpressure עצמאיים: EventBridge (ניתוב לפי תוכן, archive/replay, בין accounts) או SNS→SQS לכל consumer — בשני המקרים שמים SQS queue לפני כל consumer בשביל buffering ו-DLQ. אם הנפח גבוה, צריך סדר לכל הזמנה וה-consumers רוצים replay של היסטוריה בקצב שלהם: Kinesis/MSK. השיקולים: נפח, צורך ב-replay, סדר, מורכבות הניתוב, עלות ל-event." }
    },
    {
      q: { en: "What's the difference between Event Grid and Service Bus?", he: "מה ההבדל בין Event Grid ל-Service Bus?" },
      a: { en: "Event Grid is a push router for lightweight 'something happened' notifications with filtering and fan-out; the publisher doesn't care what consumers do. Service Bus is a durable broker for commands that must be processed: peek-lock, sessions for ordering, transactions, duplicate detection, scheduled delivery. Common pattern: Event Grid routes into a Service Bus queue that a worker drains at its own pace.", he: "Event Grid הוא push router להתראות קלות של 'משהו קרה' עם סינון ו-fan-out; למפרסם לא אכפת מה ה-consumers עושים. Service Bus הוא broker עמיד ל-commands שחייבים להיות מעובדים: peek-lock, sessions לסדר, transactions, duplicate detection, מסירה מתוזמנת. תבנית נפוצה: Event Grid מנתב לתוך Service Bus queue ש-worker מרוקן בקצב שלו." }
    }
  ],
  quiz: [
    {
      q: { en: "A worker takes ~90 s per SQS message; the queue's visibility timeout is 30 s. What happens?", he: "Worker לוקח ~90 שניות להודעת SQS; ה-visibility timeout של ה-queue הוא 30 שניות. מה קורה?" },
      options: [
        { en: "SQS waits for the worker to finish because it's still connected", he: "SQS מחכה שה-worker יסיים כי הוא עדיין מחובר" },
        { en: "The message becomes visible again after 30 s and another worker processes it too — duplicates and inflated receive counts", he: "ההודעה חוזרת להיות visible אחרי 30 שניות ו-worker נוסף מעבד אותה גם — כפילויות ו-receive count מנופח" },
        { en: "The message is deleted after 30 s", he: "ההודעה נמחקת אחרי 30 שניות" },
        { en: "The message goes straight to the DLQ", he: "ההודעה עוברת ישר ל-DLQ" }
      ],
      answer: 1,
      explain: { en: "Receiving only hides the message. Unless it's deleted (or ChangeMessageVisibility extends it) before the timeout, it reappears. After maxReceiveCount such cycles it may even land in the DLQ although nothing was wrong with it.", he: "קבלה רק מסתירה את ההודעה. אם היא לא נמחקת (או מוארכת עם ChangeMessageVisibility) לפני ה-timeout, היא חוזרת. אחרי maxReceiveCount סבבים כאלה היא אפילו עלולה לנחות ב-DLQ למרות שלא היה בה שום דבר לא תקין." }
    },
    {
      q: { en: "You need ordered telemetry from 50k devices, 30-day retention, and three teams reading at their own pace. Which Azure service?", he: "צריך טלמטריה מסודרת מ-50 אלף מכשירים, retention של 30 יום, ושלושה צוותים שקוראים כל אחד בקצב שלו. איזה שירות Azure?" },
      options: [
        { en: "Event Grid", he: "Event Grid" },
        { en: "Service Bus Standard", he: "Service Bus Standard" },
        { en: "Event Hubs (Premium/Dedicated for 30-day retention), one consumer group per team", he: "Event Hubs (Premium/Dedicated בשביל retention של 30 יום), consumer group לכל צוות" },
        { en: "Storage Queues", he: "Storage Queues" }
      ],
      answer: 2,
      explain: { en: "This is a stream: partitioned, retained, replayable, multiple independent readers. Standard tier caps retention at 7 days, so 30 days needs Premium/Dedicated (or Capture to storage).", he: "זה stream: מחולק ל-partitions, נשמר, אפשר replay, כמה קוראים בלתי תלויים. ב-Standard ה-retention מוגבל ל-7 ימים, אז 30 יום דורשים Premium/Dedicated (או Capture ל-storage)." }
    },
    {
      q: { en: "An EventBridge target (an API destination) was down for 2 days. No DLQ was configured. What happened to the events?", he: "Target של EventBridge (API destination) היה למטה יומיים. לא הוגדר DLQ. מה קרה ל-events?" },
      options: [
        { en: "They're waiting on the bus until the target recovers", he: "הם מחכים על ה-bus עד שה-target יחזור" },
        { en: "EventBridge retried for up to 24 h (default) and then dropped them; recover from an archive via replay, if you had one", he: "EventBridge עשה retry עד 24 שעות (ברירת מחדל) ואז זרק אותם; משחזרים מ-archive עם replay, אם היה אחד" },
        { en: "They moved automatically to the default DLQ", he: "הם עברו אוטומטית ל-DLQ ברירת המחדל" },
        { en: "EventBridge disabled the rule", he: "EventBridge השבית את ה-rule" }
      ],
      answer: 1,
      explain: { en: "EventBridge is a router, not a store. After the retry window, undeliverable events are dropped unless a per-target DLQ exists. An archive on the bus is your safety net for replay.", he: "EventBridge הוא router, לא אחסון. אחרי חלון ה-retry, events שלא נמסרו נזרקים אלא אם יש DLQ ל-target. Archive על ה-bus הוא רשת הביטחון שלך ל-replay." }
    },
    {
      q: { en: "Which CloudEvents attributes are required?", he: "אילו שדות של CloudEvents הם חובה?" },
      options: [
        { en: "id, source, type, specversion", he: "id, source, type, specversion" },
        { en: "id, time, data", he: "id, time, data" },
        { en: "type, subject, datacontenttype", he: "type, subject, datacontenttype" },
        { en: "source, detail-type, detail", he: "source, detail-type, detail" }
      ],
      answer: 0,
      explain: { en: "specversion, id, source and type are required; time, subject, datacontenttype, dataschema are optional. source/detail-type/detail is EventBridge's own envelope.", he: "specversion, id, source ו-type הם חובה; time, subject, datacontenttype, dataschema אופציונליים. source/detail-type/detail זו המעטפה של EventBridge עצמו." }
    }
  ],
  playground: "queue",
  related: ["arch-brokers", "arch-queues", "arch-event-driven", "cloud-serverless", "cloud-provider-map", "pr-queue-kinds", "flow-event-pipeline"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cloud-managed-k8s-compare",
  track: "cloud",
  order: 31,
  icon: "☸️",
  level: 3,
  minutes: 14,
  title: { en: "EKS vs AKS vs GKE: Managed Kubernetes Compared", he: "EKS מול AKS מול GKE: השוואת Kubernetes מנוהל" },
  tldr: {
    en: "All three run the same upstream Kubernetes, but they differ where it hurts: what the control plane costs after a version ages out, how pods get IPs, how pods get cloud credentials, and how much of the node layer you still own. GKE is the most 'managed', EKS the most 'bring your own pieces', AKS sits between with the tightest Entra ID story.",
    he: "שלושתם מריצים אותו Kubernetes upstream, אבל הם שונים איפה שכואב: כמה עולה ה-control plane אחרי שגרסה מתיישנת, איך Pods מקבלים IPs, איך Pods מקבלים credentials לענן, וכמה משכבת ה-nodes עדיין שלך. GKE הוא ה'מנוהל' ביותר, EKS הוא 'תביא את החלקים בעצמך', ו-AKS באמצע עם האינטגרציה הכי הדוקה ל-Entra ID."
  },
  analogy: {
    en: "Three car leasing companies all give you the same engine (Kubernetes). One (GKE Autopilot) also drives, refuels and services the car. One (AKS) services it and hands you a company badge that opens every door in the office. One (EKS) gives you the engine, a catalogue of parts, and an invoice that quietly multiplies by six if you forget to bring it in for its scheduled service.",
    he: "שלוש חברות ליסינג נותנות לך את אותו מנוע (Kubernetes). אחת (GKE Autopilot) גם נוהגת, מתדלקת ומטפלת ברכב. אחת (AKS) מטפלת בו ונותנת לך תג עובד שפותח כל דלת במשרד. ואחת (EKS) נותנת לך את המנוע, קטלוג חלקים, וחשבונית שמוכפלת בשקט פי שש אם שכחת להביא את הרכב לטיפול התקופתי."
  },
  sections: [
    {
      h: { en: "Control plane: price, SLA, and the extended-support trap", he: "Control plane: מחיר, SLA, ומלכודת ה-extended support" },
      body: {
        en: `<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>Control plane fee</td><td>$0.10/h per cluster (~$73/month)</td><td>Free tier: $0 (no SLA). Standard tier: $0.10/h. Premium: $0.60/h (includes LTS)</td><td>$0.10/h per cluster (Standard and Autopilot); a monthly free-tier credit covers one zonal or Autopilot cluster per billing account</td></tr>
<tr><td>Control plane SLA</td><td>99.95%</td><td>99.95% with availability zones, 99.9% without (Standard/Premium only)</td><td>99.95% regional, 99.5% zonal; Autopilot also has a pod-level SLA</td></tr>
<tr><td>Version support</td><td>14 months standard + 12 months extended</td><td>~12 months per minor (N-2); LTS adds a second year on Premium</td><td>14 months standard; Extended channel up to 24 months</td></tr>
<tr><td>Cost when you fall behind</td><td>Extended support: $0.60/h per cluster — 6x, automatically</td><td>Must be on Premium tier for LTS</td><td>Extended period charged extra (check current pricing)</td></tr>
</table>
<p>The famous surprise: an EKS cluster left on an old version silently enters extended support and the control plane bill goes from ~$73 to ~$438 per month — per cluster. Fifty forgotten dev clusters is ~$18k/month for nothing. You can set the cluster's <code>upgradePolicy.supportType</code> to <code>STANDARD</code> so EKS auto-upgrades at end of standard support instead of charging you.</p>
<pre>aws eks describe-cluster --name prod --query 'cluster.{v:version,support:upgradePolicy.supportType}'
aws eks list-insights --cluster-name prod        # upgrade blockers: deprecated APIs, add-on versions
az aks get-upgrades -g rg-prod -n aks-prod -o table
gcloud container get-server-config --region europe-west1 --format='yaml(channels)'</pre>
<blockquote>💡 Real world: GKE upgrades you automatically (release channels + maintenance windows/exclusions); EKS never upgrades the control plane until end of support; AKS has opt-in auto-upgrade channels (patch, stable, rapid, node-image). The same "upgrade discipline" therefore looks very different per cloud — see <code>k8s-day2-upgrades</code>.</blockquote>`,
        he: `<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>עלות control plane</td><td>$0.10 לשעה ל-cluster (~$73 לחודש)</td><td>Free tier: $0 (בלי SLA). Standard tier: $0.10 לשעה. Premium: $0.60 לשעה (כולל LTS)</td><td>$0.10 לשעה ל-cluster (Standard ו-Autopilot); קרדיט free tier חודשי מכסה cluster zonal או Autopilot אחד לכל billing account</td></tr>
<tr><td>SLA ל-control plane</td><td>99.95%</td><td>99.95% עם availability zones, 99.9% בלי (רק Standard/Premium)</td><td>99.95% ב-regional, 99.5% ב-zonal; ל-Autopilot יש גם SLA ברמת ה-Pod</td></tr>
<tr><td>תמיכה בגרסה</td><td>14 חודשי standard + 12 חודשי extended</td><td>~12 חודשים לכל minor (N-2); LTS מוסיף שנה שנייה ב-Premium</td><td>14 חודשי standard; Extended channel עד 24 חודשים</td></tr>
<tr><td>מחיר כשנשארים מאחור</td><td>Extended support: $0.60 לשעה ל-cluster — פי 6, אוטומטית</td><td>צריך Premium tier בשביל LTS</td><td>תקופת ה-extended בתשלום נוסף (בדוק תמחור עדכני)</td></tr>
</table>
<p>ההפתעה המפורסמת: cluster של EKS שנשאר על גרסה ישנה נכנס בשקט ל-extended support וחשבון ה-control plane קופץ מ-~$73 ל-~$438 לחודש — לכל cluster. חמישים clusters של dev ששכחו מהם זה ~$18k לחודש על כלום. אפשר להגדיר ב-cluster את <code>upgradePolicy.supportType</code> ל-<code>STANDARD</code> כדי ש-EKS יעשה auto-upgrade בסוף ה-standard support במקום לחייב אותך.</p>
<pre>aws eks describe-cluster --name prod --query 'cluster.{v:version,support:upgradePolicy.supportType}'
aws eks list-insights --cluster-name prod        # upgrade blockers: deprecated APIs, add-on versions
az aks get-upgrades -g rg-prod -n aks-prod -o table
gcloud container get-server-config --region europe-west1 --format='yaml(channels)'</pre>
<blockquote>💡 Real world: GKE משדרג אותך אוטומטית (release channels + maintenance windows/exclusions); EKS אף פעם לא משדרג את ה-control plane עד סוף התמיכה; ל-AKS יש auto-upgrade channels שבוחרים בהם (patch, stable, rapid, node-image). לכן אותה "משמעת upgrades" נראית שונה מאוד בכל ענן — ראה <code>k8s-day2-upgrades</code>.</blockquote>`
      }
    },
    {
      h: { en: "Nodes: how much of the data plane do you still own?", he: "Nodes: כמה מה-data plane עדיין שלך?" },
      body: {
        en: `<table>
<tr><th>Level of management</th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>You manage VMs</td><td>Self-managed node groups (ASG)</td><td>—</td><td>—</td></tr>
<tr><td>Managed pools, you pick sizes</td><td>Managed node groups</td><td>Node pools (VMSS), system vs user pools</td><td>Standard node pools</td></tr>
<tr><td>Autoscaler picks instance types</td><td>Karpenter (you run it) or <strong>EKS Auto Mode</strong> (AWS runs Karpenter, core add-ons and node OS, for a per-instance management fee on top of EC2)</td><td><strong>NAP</strong> (Node Auto Provisioning, Karpenter-based); <strong>AKS Automatic</strong> bundles it with opinionated defaults</td><td>Node auto-provisioning / ComputeClasses</td></tr>
<tr><td>No nodes at all, pay per pod</td><td>Fargate (1 pod per micro-VM, no DaemonSets, no GPUs)</td><td>Virtual nodes (ACI)</td><td><strong>Autopilot</strong>: billed on pod requests; Google owns nodes, security posture, upgrades</td></tr>
</table>
<p>Autopilot and Fargate change your design: no privileged pods, no host access, requests are mandatory (Autopilot adjusts them up to minimums), DaemonSets are limited. Great for app teams; a problem if your security agent needs <code>hostPID</code>.</p>
<blockquote>⚠️ Production tip: on AKS, keep a dedicated <strong>system node pool</strong> (with the <code>CriticalAddonsOnly</code> taint) for CoreDNS, metrics-server and konnectivity. A user workload that starves the only pool takes cluster DNS down with it.</blockquote>`,
        he: `<table>
<tr><th>רמת ניהול</th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>אתה מנהל VMs</td><td>Self-managed node groups (ASG)</td><td>—</td><td>—</td></tr>
<tr><td>Pools מנוהלים, אתה בוחר גדלים</td><td>Managed node groups</td><td>Node pools (VMSS), system מול user pools</td><td>Standard node pools</td></tr>
<tr><td>ה-autoscaler בוחר instance types</td><td>Karpenter (אתה מריץ) או <strong>EKS Auto Mode</strong> (AWS מריצים את Karpenter, את ה-core add-ons ואת ה-OS של ה-nodes, תמורת management fee לכל instance מעל מחיר ה-EC2)</td><td><strong>NAP</strong> (Node Auto Provisioning, מבוסס Karpenter); <strong>AKS Automatic</strong> אורז את זה עם defaults דעתניים</td><td>Node auto-provisioning / ComputeClasses</td></tr>
<tr><td>בלי nodes בכלל, תשלום לפי Pod</td><td>Fargate (Pod אחד ל-micro-VM, בלי DaemonSets, בלי GPUs)</td><td>Virtual nodes (ACI)</td><td><strong>Autopilot</strong>: חיוב לפי ה-requests של ה-Pods; Google מחזיקים את ה-nodes, ה-security posture וה-upgrades</td></tr>
</table>
<p>Autopilot ו-Fargate משנים את התכנון: אין Pods privileged, אין גישה ל-host, requests הם חובה (Autopilot מעלה אותם למינימום), DaemonSets מוגבלים. מעולה לצוותי אפליקציה; בעיה אם ה-security agent שלך צריך <code>hostPID</code>.</p>
<blockquote>⚠️ Production tip: ב-AKS, תחזיק <strong>system node pool</strong> ייעודי (עם ה-taint <code>CriticalAddonsOnly</code>) ל-CoreDNS, metrics-server ו-konnectivity. Workload של משתמש שמרעיב את ה-pool היחיד מפיל איתו את ה-DNS של ה-cluster.</blockquote>`
      }
    },
    {
      h: { en: "Networking: who gives the pod its IP", he: "רשת: מי נותן ל-Pod את ה-IP" },
      body: {
        en: `<table>
<tr><th></th><th>EKS — Amazon VPC CNI</th><th>AKS — Azure CNI Overlay (default today)</th><th>GKE — VPC-native + Dataplane V2</th></tr>
<tr><td>Pod IP from</td><td>The VPC subnet itself (secondary IPs on ENIs)</td><td>A private overlay CIDR, separate from the VNet (flat VNet-IP mode also exists)</td><td>A secondary (alias) range on the subnet</td></tr>
<tr><td>Main risk</td><td>Subnet IP exhaustion; max pods per node limited by ENIs (e.g. ~29 on m5.large without prefix delegation)</td><td>Pods aren't directly routable from on-prem — traffic is SNATed to the node IP</td><td>Pod range sizing: by default a /24 per node (110 pods) — a /20 pod range only fits 16 nodes</td></tr>
<tr><td>Fixes</td><td>Prefix delegation (/28 per ENI slot), custom networking with 100.64.0.0/10 secondary CIDRs</td><td>Plan CIDRs; Azure CNI powered by Cilium for eBPF dataplane &amp; network policy</td><td>Lower max-pods-per-node, add secondary ranges (discontiguous multi-pod CIDR)</td></tr>
<tr><td>NetworkPolicy</td><td>Built into VPC CNI (enable it) or Calico/Cilium</td><td>Cilium, Azure NPM or Calico</td><td>Dataplane V2 (Cilium-based eBPF) enforces it natively</td></tr>
</table>
<pre># EKS: turn on prefix delegation (needs Nitro instances)
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
# AKS: overlay + Cilium
az aks create -g rg -n aks --network-plugin azure --network-plugin-mode overlay \\
  --pod-cidr 192.168.0.0/16 --network-dataplane cilium
# GKE: Dataplane V2, smaller per-node pod ranges
gcloud container clusters create prod --region europe-west1 \\
  --enable-dataplane-v2 --enable-ip-alias --default-max-pods-per-node 48</pre>
<blockquote>⚠️ Production tip: AKS <code>kubenet</code> is being retired (March 2028) — migrate to Azure CNI Overlay. On AKS, outbound traffic through the default load balancer can hit SNAT port exhaustion at scale; a NAT Gateway on the subnet is the usual fix.</blockquote>`,
        he: `<table>
<tr><th></th><th>EKS — Amazon VPC CNI</th><th>AKS — Azure CNI Overlay (ברירת המחדל היום)</th><th>GKE — VPC-native + Dataplane V2</th></tr>
<tr><td>מאיפה ה-IP של ה-Pod</td><td>מה-subnet של ה-VPC עצמו (secondary IPs על ENIs)</td><td>מ-CIDR overlay פרטי, נפרד מה-VNet (קיים גם mode של VNet IPs שטוח)</td><td>מ-range משני (alias) על ה-subnet</td></tr>
<tr><td>הסיכון העיקרי</td><td>מיצוי IPs ב-subnet; מספר Pods מקסימלי ל-node מוגבל לפי ENIs (למשל ~29 ב-m5.large בלי prefix delegation)</td><td>Pods לא ניתנים לניתוב ישיר מ-on-prem — התעבורה עוברת SNAT ל-IP של ה-node</td><td>גודל ה-pod range: כברירת מחדל /24 לכל node (110 Pods) — pod range של /20 מספיק רק ל-16 nodes</td></tr>
<tr><td>פתרונות</td><td>Prefix delegation (/28 לכל slot ב-ENI), custom networking עם secondary CIDRs מ-100.64.0.0/10</td><td>לתכנן CIDRs; Azure CNI powered by Cilium בשביל dataplane של eBPF ו-network policy</td><td>להוריד max-pods-per-node, להוסיף ranges משניים (discontiguous multi-pod CIDR)</td></tr>
<tr><td>NetworkPolicy</td><td>מובנה ב-VPC CNI (צריך להפעיל) או Calico/Cilium</td><td>Cilium, Azure NPM או Calico</td><td>Dataplane V2 (eBPF מבוסס Cilium) אוכף native</td></tr>
</table>
<pre># EKS: turn on prefix delegation (needs Nitro instances)
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
# AKS: overlay + Cilium
az aks create -g rg -n aks --network-plugin azure --network-plugin-mode overlay \\
  --pod-cidr 192.168.0.0/16 --network-dataplane cilium
# GKE: Dataplane V2, smaller per-node pod ranges
gcloud container clusters create prod --region europe-west1 \\
  --enable-dataplane-v2 --enable-ip-alias --default-max-pods-per-node 48</pre>
<blockquote>⚠️ Production tip: ה-<code>kubenet</code> של AKS יוצא משימוש (מרץ 2028) — תעבור ל-Azure CNI Overlay. ב-AKS, תעבורה יוצאת דרך ה-load balancer ברירת המחדל יכולה להגיע ל-SNAT port exhaustion ב-scale; NAT Gateway על ה-subnet הוא הפתרון הרגיל.</blockquote>`
      }
    },
    {
      h: { en: "Identity: pods talking to cloud APIs without keys", he: "Identity: Pods שמדברים עם APIs של הענן בלי keys" },
      body: {
        en: `<p>All three solve the same problem — "this ServiceAccount may read that bucket" — with no static keys in Secrets:</p>
<table>
<tr><th></th><th>EKS Pod Identity (or IRSA)</th><th>AKS — Microsoft Entra Workload ID</th><th>GKE — Workload Identity Federation for GKE</th></tr>
<tr><td>Mechanism</td><td>Pod Identity agent add-on + an association (cluster, namespace, SA → IAM role). IRSA: OIDC provider + role trust policy + SA annotation</td><td>OIDC issuer on the cluster + federated identity credential on a user-assigned managed identity</td><td>Cluster workload pool <code>PROJECT_ID.svc.id.goog</code>; grant IAM directly to the KSA principal</td></tr>
<tr><td>On the pod</td><td>Nothing (Pod Identity) / <code>eks.amazonaws.com/role-arn</code> annotation (IRSA)</td><td>SA annotation <code>azure.workload.identity/client-id</code> + pod label <code>azure.workload.identity/use: "true"</code></td><td>Nothing for direct grants (older pattern: annotate the KSA to impersonate a GSA)</td></tr>
</table>
<pre># EKS Pod Identity
aws eks create-pod-identity-association --cluster-name prod \\
  --namespace billing --service-account invoicer --role-arn arn:aws:iam::111122223333:role/invoicer
# AKS Workload ID
az identity federated-credential create --name invoicer --identity-name id-invoicer -g rg-prod \\
  --issuer "$(az aks show -g rg-prod -n aks-prod --query oidcIssuerProfile.issuerUrl -o tsv)" \\
  --subject system:serviceaccount:billing:invoicer
# GKE: grant a role straight to the Kubernetes SA
gcloud storage buckets add-iam-policy-binding gs://invoices \\
  --role roles/storage.objectViewer \\
  --member "principal://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/my-proj.svc.id.goog/subject/ns/billing/sa/invoicer"</pre>
<p>Why Pod Identity over IRSA on new EKS clusters: no per-cluster OIDC provider to manage (IAM limits how many an account can have), the role's trust policy doesn't hard-code a cluster, and one role is reusable across clusters. IRSA still matters for Fargate and some older SDKs. And who can call the Kubernetes API itself? EKS now uses <strong>access entries</strong> instead of editing the <code>aws-auth</code> ConfigMap; AKS integrates with Entra ID + Azure RBAC; GKE maps Google identities via IAM + RBAC.</p>`,
        he: `<p>שלושתם פותרים את אותה בעיה — "ה-ServiceAccount הזה רשאי לקרוא את ה-bucket הזה" — בלי keys סטטיים ב-Secrets:</p>
<table>
<tr><th></th><th>EKS Pod Identity (או IRSA)</th><th>AKS — Microsoft Entra Workload ID</th><th>GKE — Workload Identity Federation for GKE</th></tr>
<tr><td>מנגנון</td><td>Add-on של Pod Identity agent + association (cluster, namespace, SA → IAM role). IRSA: OIDC provider + trust policy על ה-role + annotation על ה-SA</td><td>OIDC issuer על ה-cluster + federated identity credential על user-assigned managed identity</td><td>Workload pool של ה-cluster <code>PROJECT_ID.svc.id.goog</code>; נותנים IAM ישירות ל-principal של ה-KSA</td></tr>
<tr><td>על ה-Pod</td><td>כלום (Pod Identity) / annotation <code>eks.amazonaws.com/role-arn</code> (IRSA)</td><td>Annotation על ה-SA <code>azure.workload.identity/client-id</code> + label על ה-Pod <code>azure.workload.identity/use: "true"</code></td><td>כלום ב-grant ישיר (התבנית הישנה: annotation על ה-KSA כדי לעשות impersonation ל-GSA)</td></tr>
</table>
<pre># EKS Pod Identity
aws eks create-pod-identity-association --cluster-name prod \\
  --namespace billing --service-account invoicer --role-arn arn:aws:iam::111122223333:role/invoicer
# AKS Workload ID
az identity federated-credential create --name invoicer --identity-name id-invoicer -g rg-prod \\
  --issuer "$(az aks show -g rg-prod -n aks-prod --query oidcIssuerProfile.issuerUrl -o tsv)" \\
  --subject system:serviceaccount:billing:invoicer
# GKE: grant a role straight to the Kubernetes SA
gcloud storage buckets add-iam-policy-binding gs://invoices \\
  --role roles/storage.objectViewer \\
  --member "principal://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/my-proj.svc.id.goog/subject/ns/billing/sa/invoicer"</pre>
<p>למה Pod Identity ולא IRSA ב-clusters חדשים של EKS: אין OIDC provider לכל cluster לנהל (ל-IAM יש גבול על כמה כאלה ב-account), ה-trust policy של ה-role לא מקודדת cluster ספציפי, ו-role אחד ניתן לשימוש בכמה clusters. IRSA עדיין רלוונטי ל-Fargate ולחלק מה-SDKs הישנים. ומי רשאי לקרוא ל-Kubernetes API עצמו? EKS משתמש היום ב-<strong>access entries</strong> במקום לערוך את ה-ConfigMap <code>aws-auth</code>; AKS משתלב עם Entra ID + Azure RBAC; GKE ממפה זהויות של Google דרך IAM + RBAC.</p>`
      }
    },
    {
      h: { en: "Add-ons, observability and the gotchas per provider", he: "Add-ons, observability והמוקשים של כל ספק" },
      body: {
        en: `<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>Managed add-ons</td><td>EKS add-ons: vpc-cni, coredns, kube-proxy, ebs-csi, pod-identity-agent, observability agents — <em>you</em> bump their versions (Auto Mode does it for you)</td><td>Extensions &amp; add-ons: KEDA, Istio-based service mesh, app routing (NGINX), Key Vault CSI, Flux GitOps</td><td>Most core components managed and upgraded with the cluster; Gateway API controller, Config Sync, Backup for GKE</td></tr>
<tr><td>Logs</td><td>Control plane logs (api, audit, authenticator, controllerManager, scheduler) are <strong>off by default</strong> → CloudWatch</td><td>Diagnostic settings → Log Analytics (audit logs cost real money at volume)</td><td>Cloud Logging on by default, system + workload logs</td></tr>
<tr><td>Metrics</td><td>CloudWatch Container Insights, Amazon Managed Prometheus/Grafana</td><td>Azure Monitor managed Prometheus + Managed Grafana, Container Insights</td><td>Cloud Monitoring, Managed Service for Prometheus (on by default in new clusters)</td></tr>
</table>
<p><strong>Gotchas that bite:</strong></p>
<ul>
<li><strong>EKS</strong>: extended-support billing; subnet IP exhaustion with VPC CNI; add-on versions drift because nobody owns them; manage cluster access explicitly with access entries (don't rely on whoever created the cluster); cross-AZ traffic between pods costs money.</li>
<li><strong>AKS</strong>: the auto-created <code>MC_*</code> node resource group — don't hand-edit it; Free tier has no SLA (don't run prod on it); SNAT exhaustion; upgrades with too-small <code>max-surge</code> are slow, too-big ones blow your VM quota.</li>
<li><strong>GKE</strong>: forced auto-upgrades at end of support — set maintenance windows and exclusions or a patch lands on Black Friday; pod CIDR sizing is hard to change later; Autopilot rejects privileged workloads and rewrites requests; zonal clusters have a lower SLA and a control plane that's unavailable during its own upgrade.</li>
</ul>
<blockquote>💡 Real world: the "right" choice is usually the cloud the rest of your estate is in — IAM, networking, data gravity and the committed-spend discount outweigh managed-K8s feature deltas. Multi-cloud Kubernetes is a portability tax paid every day for an exit you may never take.</blockquote>`,
        he: `<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th></tr>
<tr><td>Add-ons מנוהלים</td><td>EKS add-ons: vpc-cni, coredns, kube-proxy, ebs-csi, pod-identity-agent, agents של observability — <em>אתה</em> מעלה את הגרסאות שלהם (Auto Mode עושה את זה בשבילך)</td><td>Extensions ו-add-ons: KEDA, service mesh מבוסס Istio, app routing (NGINX), Key Vault CSI, Flux GitOps</td><td>רוב רכיבי הליבה מנוהלים ומשודרגים עם ה-cluster; Gateway API controller, Config Sync, Backup for GKE</td></tr>
<tr><td>Logs</td><td>הלוגים של ה-control plane (api, audit, authenticator, controllerManager, scheduler) <strong>כבויים כברירת מחדל</strong> → CloudWatch</td><td>Diagnostic settings → Log Analytics (audit logs עולים כסף אמיתי בנפח)</td><td>Cloud Logging פעיל כברירת מחדל, לוגים של המערכת ושל ה-workloads</td></tr>
<tr><td>Metrics</td><td>CloudWatch Container Insights, Amazon Managed Prometheus/Grafana</td><td>Azure Monitor managed Prometheus + Managed Grafana, Container Insights</td><td>Cloud Monitoring, Managed Service for Prometheus (פעיל כברירת מחדל ב-clusters חדשים)</td></tr>
</table>
<p><strong>מוקשים שנושכים:</strong></p>
<ul>
<li><strong>EKS</strong>: חיוב extended support; מיצוי IPs ב-subnet עם VPC CNI; גרסאות add-ons שזזות כי לאף אחד הן לא שייכות; לנהל גישה ל-cluster במפורש עם access entries (ולא לסמוך על מי שיצר את ה-cluster); תעבורה בין AZs בין Pods עולה כסף.</li>
<li><strong>AKS</strong>: ה-node resource group האוטומטי <code>MC_*</code> — לא עורכים אותו ידנית; ב-Free tier אין SLA (לא מריצים עליו prod); SNAT exhaustion; upgrades עם <code>max-surge</code> קטן מדי איטיים, וגדול מדי מפוצץ לך את ה-quota של ה-VMs.</li>
<li><strong>GKE</strong>: auto-upgrades כפויים בסוף התמיכה — תגדיר maintenance windows ו-exclusions, אחרת patch נוחת ב-Black Friday; קשה לשנות אחר כך את גודל ה-pod CIDR; Autopilot דוחה workloads privileged ומשכתב requests; ל-clusters zonal יש SLA נמוך יותר ו-control plane שלא זמין בזמן ה-upgrade שלו.</li>
</ul>
<blockquote>💡 Real world: הבחירה ה"נכונה" היא בדרך כלל הענן שבו נמצא שאר ה-estate שלך — IAM, רשת, data gravity וההנחה על committed spend שוקלים יותר מהבדלי פיצ'רים ב-K8s מנוהל. Kubernetes multi-cloud זה מס portability שמשלמים כל יום בשביל יציאה שאולי לעולם לא תקרה.</blockquote>`
      }
    }
  ],
  diagram: "      control plane            nodes                          pod IPs                 pod -> cloud creds\nEKS   $0.10/h (ext. $0.60)     MNG | Karpenter | Auto Mode    VPC subnet (ENI)        Pod Identity / IRSA\nAKS   free | $0.10 | $0.60     VMSS pools | NAP | Automatic   CNI Overlay (+Cilium)   Entra Workload ID\nGKE   $0.10/h (+free credit)   node pools | NAP | Autopilot   alias range (DPv2)      WIF for GKE",
  handsOn: [
    { cmd: "aws eks describe-addon-versions --kubernetes-version 1.33 --addon-name vpc-cni --query 'addons[0].addonVersions[0:3].addonVersion'", what: { en: "List compatible add-on versions before an EKS upgrade.", he: "להציג גרסאות add-on תואמות לפני upgrade ב-EKS." } },
    { cmd: "kubectl get node -o custom-columns=NAME:.metadata.name,PODS:.status.allocatable.pods", what: { en: "See the real max-pods per node — on EKS it reveals the ENI/IP limit.", he: "לראות את ה-max-pods האמיתי לכל node — ב-EKS זה חושף את מגבלת ה-ENI/IP." } },
    { cmd: "az aks show -g rg-prod -n aks-prod --query '{tier:sku.tier,net:networkProfile.networkPluginMode,oidc:oidcIssuerProfile.enabled,wi:securityProfile.workloadIdentity.enabled}'", what: { en: "One-line AKS posture check: tier (SLA), overlay mode, OIDC + Workload ID.", he: "בדיקת posture של AKS בשורה אחת: tier (SLA), overlay mode, OIDC + Workload ID." } },
    { cmd: "gcloud container clusters describe prod --region europe-west1 --format='yaml(releaseChannel,maintenancePolicy,workloadIdentityConfig,networkConfig.datapathProvider)'", what: { en: "GKE: release channel, maintenance windows, workload pool and dataplane.", he: "GKE: release channel, maintenance windows, workload pool ו-dataplane." } }
  ],
  mnemonic: {
    en: "Compare the five that bite — Price, Patching, Pods (nodes), Pod IPs, Pod identity — not the logos.",
    he: "משווים את החמישה שנושכים — Price, Patching, Pods (nodes), Pod IPs, Pod identity — לא את הלוגואים."
  },
  pitfalls: [
    { en: "Forgetting EKS extended support: old clusters cost 6x the control plane fee automatically. Track versions in a dashboard or set the support policy to STANDARD.", he: "לשכוח את ה-extended support של EKS: clusters ישנים עולים פי 6 על ה-control plane, אוטומטית. תעקוב אחרי גרסאות ב-dashboard או תגדיר את ה-support policy ל-STANDARD." },
    { en: "Sizing the subnet/pod range for today: VPC CNI eats a VPC IP per pod, GKE reserves a /24 per node by default. Running out of IPs blocks scale-out exactly at peak.", he: "לתכנן את ה-subnet/pod range לפי היום: VPC CNI אוכל IP של ה-VPC לכל Pod, GKE שומר /24 לכל node כברירת מחדל. כשנגמרים ה-IPs, ה-scale-out נחסם בדיוק בשיא." },
    { en: "Running production on AKS Free tier or a GKE zonal cluster and assuming a 99.95% control plane SLA.", he: "להריץ production על AKS Free tier או על cluster zonal ב-GKE ולהניח שיש SLA של 99.95% ל-control plane." },
    { en: "Still mounting cloud access keys as Kubernetes Secrets when Pod Identity / Workload ID / WIF exist — those keys leak through logs, backups and laptops.", he: "להמשיך להרכיב access keys של הענן כ-Kubernetes Secrets כשיש Pod Identity / Workload ID / WIF — ה-keys האלה דולפים דרך לוגים, גיבויים ולפטופים." }
  ],
  interview: [
    {
      q: { en: "How do pods get cloud credentials on EKS, AKS and GKE, and why not just use a Secret?", he: "איך Pods מקבלים credentials לענן ב-EKS, AKS ו-GKE, ולמה לא פשוט Secret?" },
      a: { en: "All three exchange the pod's projected ServiceAccount token for short-lived cloud credentials: EKS Pod Identity (agent + association) or IRSA (OIDC + AssumeRoleWithWebIdentity); AKS Entra Workload ID (federated credential on a managed identity); GKE Workload Identity Federation (IAM granted directly to the KSA principal). A static key in a Secret never expires, is readable by anyone with Secret access in the namespace, and ends up in backups — short-lived federated tokens remove the thing to steal.", he: "שלושתם מחליפים את ה-ServiceAccount token המוקרן של ה-Pod ב-credentials קצרי חיים לענן: EKS Pod Identity (agent + association) או IRSA (OIDC + AssumeRoleWithWebIdentity); AKS Entra Workload ID (federated credential על managed identity); GKE Workload Identity Federation (IAM ישירות ל-principal של ה-KSA). Key סטטי ב-Secret לא פג אף פעם, קריא לכל מי שיש לו גישה ל-Secrets ב-namespace, ונגמר בגיבויים — tokens קצרי חיים מעלימים את הדבר שאפשר לגנוב." }
    },
    {
      q: { en: "Your EKS bill jumped by ~$365/month per cluster for a dozen clusters. What happened?", he: "חשבון ה-EKS קפץ ב-~$365 לחודש לכל cluster, בתריסר clusters. מה קרה?" },
      a: { en: "Those clusters passed end of standard support (14 months after the version's EKS release) and entered extended support at $0.60/h instead of $0.10/h. Fix: upgrade them (check EKS upgrade insights for deprecated APIs and add-on compatibility first), delete the abandoned ones, and set the upgrade policy to STANDARD for non-prod so they auto-upgrade instead of billing.", he: "ה-clusters האלה עברו את סוף ה-standard support (14 חודשים אחרי שחרור הגרסה ב-EKS) ונכנסו ל-extended support ב-$0.60 לשעה במקום $0.10. התיקון: לשדרג אותם (קודם לבדוק ב-EKS upgrade insights APIs שהוצאו משימוש ותאימות add-ons), למחוק את הנטושים, ולהגדיר upgrade policy של STANDARD ל-non-prod כדי שישודרגו אוטומטית במקום לחייב." }
    }
  ],
  quiz: [
    {
      q: { en: "Which AKS tier has no financially backed control plane SLA?", he: "באיזה tier של AKS אין SLA מגובה כספית ל-control plane?" },
      options: [
        { en: "Premium", he: "Premium" },
        { en: "Standard", he: "Standard" },
        { en: "Free", he: "Free" },
        { en: "All tiers have the same SLA", he: "לכל ה-tiers יש אותו SLA" }
      ],
      answer: 2,
      explain: { en: "Free tier is fine for dev/test; Standard ($0.10/h) gives 99.95% with AZs (99.9% without); Premium adds LTS.", he: "Free tier בסדר ל-dev/test; Standard ($0.10 לשעה) נותן 99.95% עם AZs (99.9% בלי); Premium מוסיף LTS." }
    },
    {
      q: { en: "An EKS cluster can't start new pods even though nodes have free CPU/memory; pods fail with 'failed to assign an IP address'. Most likely cause?", he: "Cluster של EKS לא מצליח להפעיל Pods חדשים למרות שיש CPU/זיכרון פנויים; Pods נכשלים עם 'failed to assign an IP address'. הסיבה הסבירה?" },
      options: [
        { en: "CoreDNS is down", he: "CoreDNS למטה" },
        { en: "VPC CNI ran out of subnet IPs or ENI slots — enable prefix delegation or add subnets/secondary CIDRs", he: "ל-VPC CNI נגמרו IPs ב-subnet או slots ב-ENI — להפעיל prefix delegation או להוסיף subnets/secondary CIDRs" },
        { en: "The control plane is in extended support", he: "ה-control plane ב-extended support" },
        { en: "The Pod Identity agent is missing", he: "חסר Pod Identity agent" }
      ],
      answer: 1,
      explain: { en: "With VPC CNI every pod consumes a real VPC IP, and per-node capacity is bounded by ENIs × IPs per ENI. Prefix delegation hands out /28 blocks per slot, multiplying density.", he: "עם VPC CNI כל Pod צורך IP אמיתי של ה-VPC, והקיבולת לכל node חסומה ב-ENIs × IPs לכל ENI. Prefix delegation מחלק בלוקים של /28 לכל slot ומכפיל את הצפיפות." }
    },
    {
      q: { en: "What does GKE Autopilot bill you for?", he: "על מה GKE Autopilot מחייב אותך?" },
      options: [
        { en: "The VMs you choose, like Standard mode", he: "ה-VMs שאתה בוחר, כמו ב-Standard mode" },
        { en: "Pod resource requests (plus the cluster management fee), with Google managing the nodes", he: "ה-resource requests של ה-Pods (ועוד ה-cluster management fee), כש-Google מנהלים את ה-nodes" },
        { en: "Only network egress", he: "רק network egress" },
        { en: "Nothing — Autopilot is free", he: "כלום — Autopilot חינמי" }
      ],
      answer: 1,
      explain: { en: "Autopilot charges for what pods request (some compute classes bill by node), so oversized requests directly cost money — rightsizing matters even more than on Standard.", he: "Autopilot מחייב לפי מה שה-Pods מבקשים (חלק מה-compute classes מחויבים לפי node), אז requests מנופחים עולים כסף ישירות — rightsizing חשוב אפילו יותר מאשר ב-Standard." }
    },
    {
      q: { en: "Why do new EKS designs prefer Pod Identity over IRSA?", he: "למה תכנונים חדשים ב-EKS מעדיפים Pod Identity על פני IRSA?" },
      options: [
        { en: "IRSA doesn't work with IAM roles", he: "IRSA לא עובד עם IAM roles" },
        { en: "No per-cluster OIDC provider and no cluster-specific trust policy, so one role is reusable across clusters", he: "אין OIDC provider לכל cluster ואין trust policy ספציפית ל-cluster, אז role אחד ניתן לשימוש חוזר בין clusters" },
        { en: "Pod Identity gives pods permanent access keys", he: "Pod Identity נותן ל-Pods access keys קבועים" },
        { en: "IRSA is only for Windows nodes", he: "IRSA הוא רק ל-Windows nodes" }
      ],
      answer: 1,
      explain: { en: "Both issue short-lived credentials; Pod Identity simplifies operations at scale. IRSA is still needed in a few cases (e.g. Fargate).", he: "שניהם מנפיקים credentials קצרי חיים; Pod Identity מפשט את התפעול ב-scale. IRSA עדיין נדרש בכמה מקרים (למשל Fargate)." }
    }
  ],
  playground: "scheduler",
  related: ["k8s-architecture", "k8s-day2-upgrades", "k8s-node-autoprovisioning", "k8s-cost", "cloud-iam-security", "cloud-provider-map", "k8s-security-policy"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cloud-ai-platforms",
  track: "cloud",
  order: 32,
  icon: "🤖",
  level: 3,
  minutes: 15,
  title: { en: "Cloud AI Platforms: Bedrock, Azure AI Foundry / Azure OpenAI, Vertex AI", he: "פלטפורמות AI בענן: Bedrock, Azure AI Foundry / Azure OpenAI, Vertex AI" },
  tldr: {
    en: "The cloud AI platforms sell frontier models behind your cloud's IAM, network and bill. The infra work is the same on all three: get quota (TPM/RPM) before launch, choose on-demand vs provisioned vs batch per workload, keep traffic private, pin the data region, and add guardrails and cost alarms — the model call itself is the easy part.",
    he: "פלטפורמות ה-AI של העננים מוכרות מודלים מובילים מאחורי ה-IAM, הרשת והחשבונית של הענן שלך. העבודה התשתיתית זהה בשלושתם: להשיג quota (TPM/RPM) לפני ה-launch, לבחור on-demand מול provisioned מול batch לכל workload, לשמור על תעבורה פרטית, לקבע את ה-region של הנתונים, ולהוסיף guardrails ו-alarms על עלות — הקריאה למודל עצמה היא החלק הקל."
  },
  analogy: {
    en: "Calling a model provider directly is ordering from a restaurant's own website. A cloud AI platform is the same food through your company cafeteria contract: it's on the company card, it arrives through the staff entrance (private networking), legal already signed the contract, and there's a daily meal limit (quota) you must raise before the whole department shows up at once.",
    he: "לקרוא לספק מודל ישירות זה להזמין מהאתר של המסעדה עצמה. פלטפורמת AI בענן זה אותו אוכל דרך חוזה חדר האוכל של החברה: זה על הכרטיס של החברה, זה מגיע דרך כניסת העובדים (private networking), המחלקה המשפטית כבר חתמה, ויש מכסת ארוחות יומית (quota) שצריך להגדיל לפני שכל המחלקה מגיעה ביחד."
  },
  sections: [
    {
      h: { en: "The three platforms side by side", he: "שלוש הפלטפורמות זו לצד זו" },
      body: {
        en: `<table>
<tr><th></th><th>Amazon Bedrock</th><th>Azure AI Foundry + Azure OpenAI</th><th>Google Vertex AI</th></tr>
<tr><td>Flagship models</td><td>Anthropic Claude, Amazon Nova, Meta Llama, Mistral, Cohere, DeepSeek, OpenAI open-weight and more</td><td>OpenAI GPT and reasoning models (Azure OpenAI), plus a large Foundry catalog (Llama, Mistral, DeepSeek, Grok, and others)</td><td>Gemini, plus Model Garden (Claude, Llama, Mistral, open models you deploy on endpoints)</td></tr>
<tr><td>Unit of deployment</td><td>Call a model ID or an <em>inference profile</em> (cross-region: <code>us.</code>/<code>eu.</code>/<code>global.</code> prefixes)</td><td>You create a named <em>deployment</em> of a model in a resource, with a deployment type</td><td>Call a publisher model on a regional or global endpoint; self-deploy open models to an endpoint</td></tr>
<tr><td>Capacity options</td><td>On-demand, cross-region inference, Provisioned Throughput (model units), batch</td><td>Standard / Global Standard / Data Zone Standard, Provisioned (PTU: global, data zone, regional), Global/Data Zone Batch</td><td>Pay-as-you-go (dynamic shared quota for Gemini), Provisioned Throughput (GSUs), batch prediction</td></tr>
<tr><td>Managed RAG</td><td>Knowledge Bases (vector store: OpenSearch Serverless, Aurora pgvector, S3 Vectors, Pinecone…)</td><td>Azure AI Search ("on your data"), Foundry knowledge tools</td><td>Vertex AI RAG Engine, Vertex AI Search</td></tr>
<tr><td>Agents</td><td>Bedrock Agents, AgentCore (runtime, memory, gateway, identity)</td><td>Foundry Agent Service</td><td>Vertex AI Agent Engine, Agent Development Kit (ADK)</td></tr>
<tr><td>Safety layer</td><td>Guardrails (content filters, denied topics, PII redaction, contextual grounding checks)</td><td>Content filters (on by default), Prompt Shields, groundedness detection</td><td>Safety settings, Model Armor</td></tr>
</table>
<p>Names and catalogs change every quarter (Azure AI Foundry has been rebranded more than once). What doesn't change is the infra checklist below.</p>`,
        he: `<table>
<tr><th></th><th>Amazon Bedrock</th><th>Azure AI Foundry + Azure OpenAI</th><th>Google Vertex AI</th></tr>
<tr><td>מודלים מובילים</td><td>Anthropic Claude, Amazon Nova, Meta Llama, Mistral, Cohere, DeepSeek, מודלי open-weight של OpenAI ועוד</td><td>מודלי GPT ו-reasoning של OpenAI (Azure OpenAI), ועוד catalog גדול ב-Foundry (Llama, Mistral, DeepSeek, Grok ואחרים)</td><td>Gemini, ועוד Model Garden (Claude, Llama, Mistral, מודלים פתוחים שעושים להם deploy על endpoints)</td></tr>
<tr><td>יחידת ה-deployment</td><td>קוראים ל-model ID או ל-<em>inference profile</em> (cross-region: prefixes של <code>us.</code>/<code>eu.</code>/<code>global.</code>)</td><td>יוצרים <em>deployment</em> עם שם למודל בתוך resource, עם deployment type</td><td>קוראים למודל של publisher על endpoint אזורי או גלובלי; מודלים פתוחים מעלים ל-endpoint בעצמך</td></tr>
<tr><td>אפשרויות קיבולת</td><td>On-demand, cross-region inference, Provisioned Throughput (model units), batch</td><td>Standard / Global Standard / Data Zone Standard, Provisioned (PTU: global, data zone, regional), Global/Data Zone Batch</td><td>Pay-as-you-go (dynamic shared quota ל-Gemini), Provisioned Throughput (GSUs), batch prediction</td></tr>
<tr><td>RAG מנוהל</td><td>Knowledge Bases (vector store: OpenSearch Serverless, Aurora pgvector, S3 Vectors, Pinecone…)</td><td>Azure AI Search ("on your data"), כלי knowledge של Foundry</td><td>Vertex AI RAG Engine, Vertex AI Search</td></tr>
<tr><td>Agents</td><td>Bedrock Agents, AgentCore (runtime, memory, gateway, identity)</td><td>Foundry Agent Service</td><td>Vertex AI Agent Engine, Agent Development Kit (ADK)</td></tr>
<tr><td>שכבת בטיחות</td><td>Guardrails (content filters, denied topics, PII redaction, contextual grounding checks)</td><td>Content filters (פעילים כברירת מחדל), Prompt Shields, groundedness detection</td><td>Safety settings, Model Armor</td></tr>
</table>
<p>השמות וה-catalogs משתנים כל רבעון (Azure AI Foundry כבר עבר rebranding יותר מפעם אחת). מה שלא משתנה זה ה-checklist התשתיתי שבהמשך.</p>`
      }
    },
    {
      h: { en: "Quotas: TPM, RPM and how not to launch into a 429", he: "Quotas: TPM, RPM ואיך לא לעשות launch לתוך 429" },
      body: {
        en: `<p>Every platform meters <strong>TPM</strong> (tokens per minute — input + output, often counting <code>max_tokens</code> against the limit at request time) and <strong>RPM</strong> (requests per minute), per model, per region, per account/subscription/project. Exceed either and you get <code>429 ThrottlingException</code> / <code>429 Too Many Requests</code> / <code>RESOURCE_EXHAUSTED</code>.</p>
<ul>
<li><strong>Bedrock</strong>: quotas live in Service Quotas per model and region (separate ones for cross-region profiles). Request increases there or via support — new accounts often start low, and big increases can take days.</li>
<li><strong>Azure OpenAI</strong>: TPM is assigned per model, per region, per subscription, and you split it across deployments; RPM is derived from TPM (for many chat models ~6 RPM per 1,000 TPM). Increases via the quota request form.</li>
<li><strong>Vertex AI</strong>: newer Gemini models use <strong>dynamic shared quota</strong> — no per-project limit, but you can get 429s when the shared pool is busy; Provisioned Throughput is the guarantee. Other models still have per-project quotas in the console.</li>
</ul>
<pre># AWS: what can I actually use?
aws service-quotas list-service-quotas --service-code bedrock \\
  --query "Quotas[?contains(QuotaName,'tokens per minute')].[QuotaName,Value]" --output table
# Azure: how much quota is left per model in a region
az cognitiveservices usage list --location swedencentral -o table
# Size it: 40 req/s peak × (1,500 in + 500 out tokens) × 60 = 4.8M TPM  ← request this BEFORE launch</pre>
<blockquote>⚠️ Production tip: client retries with exponential backoff + jitter are mandatory, but they don't create capacity. For a launch, multiply peak RPS × tokens per request × 60, compare to quota, request the gap weeks ahead, and spread load with cross-region inference / Global deployments where your data-residency rules allow.</blockquote>`,
        he: `<p>כל פלטפורמה מודדת <strong>TPM</strong> (tokens per minute — input + output, ולפעמים <code>max_tokens</code> נספר מול הגבול כבר בזמן ה-request) ו-<strong>RPM</strong> (requests per minute), לכל מודל, לכל region, לכל account/subscription/project. חורגים מאחד מהם ומקבלים <code>429 ThrottlingException</code> / <code>429 Too Many Requests</code> / <code>RESOURCE_EXHAUSTED</code>.</p>
<ul>
<li><strong>Bedrock</strong>: ה-quotas נמצאים ב-Service Quotas לכל מודל ו-region (נפרדים ל-cross-region profiles). מבקשים הגדלה שם או דרך support — accounts חדשים מתחילים הרבה פעמים נמוך, והגדלות גדולות יכולות לקחת ימים.</li>
<li><strong>Azure OpenAI</strong>: ה-TPM מוקצה לכל מודל, region ו-subscription, ואתה מחלק אותו בין deployments; ה-RPM נגזר מה-TPM (בהרבה מודלי chat ~6 RPM לכל 1,000 TPM). הגדלה דרך טופס בקשת quota.</li>
<li><strong>Vertex AI</strong>: מודלי Gemini חדשים משתמשים ב-<strong>dynamic shared quota</strong> — אין גבול לכל project, אבל אפשר לקבל 429 כשה-pool המשותף עמוס; Provisioned Throughput הוא ההבטחה. למודלים אחרים עדיין יש quotas לכל project ב-console.</li>
</ul>
<pre># AWS: what can I actually use?
aws service-quotas list-service-quotas --service-code bedrock \\
  --query "Quotas[?contains(QuotaName,'tokens per minute')].[QuotaName,Value]" --output table
# Azure: how much quota is left per model in a region
az cognitiveservices usage list --location swedencentral -o table
# Size it: 40 req/s peak × (1,500 in + 500 out tokens) × 60 = 4.8M TPM  ← request this BEFORE launch</pre>
<blockquote>⚠️ Production tip: retries בצד ה-client עם exponential backoff + jitter הם חובה, אבל הם לא יוצרים קיבולת. לקראת launch, תכפיל peak RPS × tokens לבקשה × 60, תשווה ל-quota, תבקש את הפער שבועות מראש, ותפזר עומס עם cross-region inference / Global deployments איפה שחוקי ה-data residency שלך מאפשרים.</blockquote>`
      }
    },
    {
      h: { en: "Capacity and cost: on-demand vs provisioned vs batch, and GPUs", he: "קיבולת ועלות: on-demand מול provisioned מול batch, ו-GPUs" },
      body: {
        en: `<table>
<tr><th>Mode</th><th>You pay</th><th>Good for</th><th>Watch out</th></tr>
<tr><td>On-demand / pay-as-you-go</td><td>Per input/output token (output is typically several times pricier)</td><td>Spiky or unknown traffic, prototypes</td><td>Throttling at peak; no latency guarantee</td></tr>
<tr><td>Provisioned throughput (Bedrock model units, Azure PTUs, Vertex GSUs)</td><td>Per unit per hour, usually with a term commitment (Azure PTU reservations monthly/yearly; Bedrock 1 or 6 months; Vertex from 1 week up)</td><td>Steady high volume, predictable latency, custom/fine-tuned models</td><td>You pay when idle; sizing in units is model-specific — use the vendor's capacity calculator</td></tr>
<tr><td>Batch</td><td>Typically ~50% off on-demand</td><td>Evals, backfills, document enrichment, embeddings of a corpus</td><td>Async: results within a window (often up to 24 h), not for users waiting</td></tr>
<tr><td>Prompt caching</td><td>Cached input tokens billed at a steep discount</td><td>Long, repeated system prompts / documents</td><td>Needs a stable prefix; check per-model support</td></tr>
</table>
<p><strong>GPU capacity for self-hosted or fine-tuning work</strong> is its own market: AWS On-Demand Capacity Reservations, <strong>EC2 Capacity Blocks for ML</strong> (reserve GPU instances for a fixed future window), Savings Plans and Spot; Azure on-demand capacity reservations, reserved instances and Spot VMs; GCP reservations, committed use discounts, Spot VMs and the Dynamic Workload Scheduler (flex-start and calendar mode). Spot is great for batch and training with checkpoints, terrible for latency-sensitive inference. High-end GPUs are often capacity-constrained per region — reserve before you promise a date.</p>
<blockquote>💡 Real world: a common cost profile is "chat on on-demand with a small provisioned floor for the busiest model, nightly enrichment on batch at half price, and prompt caching on the 6k-token system prompt" — that mix routinely cuts the bill 40-60% versus everything on-demand.</blockquote>`,
        he: `<table>
<tr><th>Mode</th><th>משלמים</th><th>מתאים ל</th><th>להיזהר</th></tr>
<tr><td>On-demand / pay-as-you-go</td><td>לכל token של input/output (output בדרך כלל יקר כמה מונים)</td><td>תעבורה קופצנית או לא ידועה, prototypes</td><td>Throttling בשיא; אין הבטחת latency</td></tr>
<tr><td>Provisioned throughput (model units ב-Bedrock, PTUs ב-Azure, GSUs ב-Vertex)</td><td>לכל יחידה לשעה, בדרך כלל עם התחייבות לתקופה (reservations של PTU ב-Azure חודשיות/שנתיות; Bedrock חודש או 6 חודשים; Vertex משבוע ומעלה)</td><td>נפח גבוה ויציב, latency צפוי, מודלים custom/fine-tuned</td><td>משלמים גם כשזה idle; ה-sizing ביחידות תלוי מודל — תשתמש ב-capacity calculator של הספק</td></tr>
<tr><td>Batch</td><td>בדרך כלל ~50% הנחה מ-on-demand</td><td>Evals, backfills, העשרת מסמכים, embeddings ל-corpus</td><td>אסינכרוני: תוצאות בתוך חלון (הרבה פעמים עד 24 שעות), לא למשתמשים שמחכים</td></tr>
<tr><td>Prompt caching</td><td>Input tokens שב-cache מחויבים בהנחה גדולה</td><td>System prompts / מסמכים ארוכים שחוזרים</td><td>צריך prefix יציב; תבדוק תמיכה לכל מודל</td></tr>
</table>
<p><strong>קיבולת GPU ל-self-hosting או ל-fine-tuning</strong> היא שוק בפני עצמו: ב-AWS יש On-Demand Capacity Reservations, <strong>EC2 Capacity Blocks for ML</strong> (שריון GPU instances לחלון עתידי קבוע), Savings Plans ו-Spot; ב-Azure on-demand capacity reservations, reserved instances ו-Spot VMs; ב-GCP reservations, committed use discounts, Spot VMs וה-Dynamic Workload Scheduler (flex-start ו-calendar mode). Spot מעולה ל-batch ול-training עם checkpoints, נוראי ל-inference רגיש ל-latency. GPUs מהשורה הראשונה הרבה פעמים מוגבלים בקיבולת לכל region — תשריין לפני שאתה מבטיח תאריך.</p>
<blockquote>💡 Real world: פרופיל עלות נפוץ הוא "chat על on-demand עם רצפת provisioned קטנה למודל הכי עמוס, העשרה לילית על batch בחצי מחיר, ו-prompt caching על ה-system prompt של 6k tokens" — השילוב הזה מוריד שוב ושוב 40-60% מהחשבון לעומת הכל on-demand.</blockquote>`
      }
    },
    {
      h: { en: "Privacy, residency and private networking", he: "פרטיות, residency ו-private networking" },
      body: {
        en: `<p>The headline promise on all three: <strong>your prompts and completions aren't used to train the foundation models</strong>, and the model provider doesn't get your data. Read the details that matter for your compliance team:</p>
<ul>
<li><strong>Residency</strong>: a regional deployment keeps processing in-region; <em>global</em> routing (Bedrock <code>global.</code> profiles, Azure Global Standard, Vertex global endpoint) may process anywhere. Geographic options sit between (Bedrock <code>eu.</code>/<code>us.</code> profiles, Azure Data Zone). Pick per workload — PII in the EU usually means a geo-bounded option.</li>
<li><strong>Retention/abuse monitoring</strong>: Azure OpenAI may store prompts for abuse monitoring unless you're approved for modified abuse monitoring; Vertex AI zero-data-retention requires turning off specific caching/logging features. Bedrock doesn't store prompts by default, but <em>your</em> model invocation logging (to S3/CloudWatch) will — protect it like production data.</li>
<li><strong>Private networking</strong>: AWS interface VPC endpoint (PrivateLink) for <code>bedrock-runtime</code>; Azure private endpoint on the AI resource + <code>publicNetworkAccess: Disabled</code>; GCP Private Service Connect + VPC Service Controls perimeter to stop data exfiltration.</li>
<li><strong>Identity</strong>: use IAM roles / managed identities / service accounts, not API keys. Disable key-based auth where the platform allows it (Azure: <code>disableLocalAuth</code>).</li>
</ul>
<pre>resource "aws_vpc_endpoint" "bedrock_runtime" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.eu-central-1.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.bedrock_ep.id]
  private_dns_enabled = true
}
# IAM: allow only specific models + only via the endpoint
# "Condition": { "StringEquals": { "aws:sourceVpce": "vpce-0abc123" } }</pre>`,
        he: `<p>ההבטחה הראשית בשלושתם: <strong>ה-prompts וה-completions שלך לא משמשים לאימון ה-foundation models</strong>, וספק המודל לא מקבל את הנתונים שלך. תקרא את הפרטים שחשובים לצוות ה-compliance:</p>
<ul>
<li><strong>Residency</strong>: deployment אזורי שומר את העיבוד בתוך ה-region; ניתוב <em>global</em> (profiles של <code>global.</code> ב-Bedrock, Global Standard ב-Azure, global endpoint ב-Vertex) יכול לעבד בכל מקום. אפשרויות גיאוגרפיות באמצע (profiles של <code>eu.</code>/<code>us.</code> ב-Bedrock, Data Zone ב-Azure). בוחרים לכל workload — PII באירופה בדרך כלל אומר אופציה שתחומה גיאוגרפית.</li>
<li><strong>Retention ו-abuse monitoring</strong>: Azure OpenAI עשוי לשמור prompts ל-abuse monitoring אלא אם אושרת ל-modified abuse monitoring; zero data retention ב-Vertex AI דורש לכבות פיצ'רים מסוימים של caching/logging. Bedrock לא שומר prompts כברירת מחדל, אבל ה-model invocation logging <em>שלך</em> (ל-S3/CloudWatch) כן — תגן עליו כמו על נתוני production.</li>
<li><strong>Private networking</strong>: ב-AWS interface VPC endpoint (PrivateLink) ל-<code>bedrock-runtime</code>; ב-Azure private endpoint על ה-AI resource + <code>publicNetworkAccess: Disabled</code>; ב-GCP Private Service Connect + perimeter של VPC Service Controls כדי לעצור exfiltration של נתונים.</li>
<li><strong>Identity</strong>: משתמשים ב-IAM roles / managed identities / service accounts, לא ב-API keys. מבטלים auth מבוסס keys איפה שהפלטפורמה מאפשרת (Azure: <code>disableLocalAuth</code>).</li>
</ul>
<pre>resource "aws_vpc_endpoint" "bedrock_runtime" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.eu-central-1.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.bedrock_ep.id]
  private_dns_enabled = true
}
# IAM: allow only specific models + only via the endpoint
# "Condition": { "StringEquals": { "aws:sourceVpce": "vpce-0abc123" } }</pre>`
      }
    },
    {
      h: { en: "Platform vs direct model API vs self-hosting", he: "פלטפורמה מול API ישיר של ספק המודל מול self-hosting" },
      body: {
        en: `<table>
<tr><th></th><th>Cloud AI platform</th><th>Direct model-provider API</th><th>Self-host open models (vLLM on K8s/VMs)</th></tr>
<tr><td>Choose when</td><td>Enterprise controls: existing cloud IAM, private networking, residency, consolidated bill / committed-spend drawdown, multiple model vendors behind one API</td><td>You want the newest models and features first, the vendor's own SDK/tooling, simplest setup</td><td>Very high steady volume, strict air-gap/sovereignty, custom/fine-tuned open models, latency control</td></tr>
<tr><td>Trade-off</td><td>New models/features can lag; quotas per region; per-platform API differences</td><td>Another vendor contract, data leaves your cloud boundary over the internet (unless private connectivity is offered)</td><td>You own GPUs, scaling, upgrades, evals and on-call; idle GPUs burn money</td></tr>
</table>
<p>Many teams end up with a thin <strong>AI gateway</strong> in front of all of it (routing, retries/failover between regions or providers, per-team quotas, token metering, logging/redaction) so application code doesn't care which option serves a request.</p>
<blockquote>⚠️ Production tip: treat model IDs like dependencies. Pin exact versions, track deprecation dates (platforms retire model versions on a schedule), and keep an eval suite so swapping models is a measured change, not a vibe.</blockquote>`,
        he: `<table>
<tr><th></th><th>פלטפורמת AI בענן</th><th>API ישיר של ספק המודל</th><th>Self-host למודלים פתוחים (vLLM על K8s/VMs)</th></tr>
<tr><td>בוחרים כש</td><td>צריך בקרות ארגוניות: ה-IAM הקיים בענן, private networking, residency, חשבונית אחת / ניצול committed spend, כמה ספקי מודלים מאחורי API אחד</td><td>רוצים את המודלים והפיצ'רים הכי חדשים קודם, את ה-SDK והכלים של הספק עצמו, setup הכי פשוט</td><td>נפח יציב גבוה מאוד, air-gap/ריבונות קפדניים, מודלים פתוחים custom/fine-tuned, שליטה ב-latency</td></tr>
<tr><td>המחיר</td><td>מודלים ופיצ'רים חדשים יכולים לפגר; quotas לכל region; הבדלי API בין פלטפורמות</td><td>עוד חוזה ספק, הנתונים יוצאים מגבולות הענן שלך דרך האינטרנט (אלא אם מוצעת קישוריות פרטית)</td><td>ה-GPUs, ה-scaling, ה-upgrades, ה-evals וה-on-call שלך; GPUs ב-idle שורפים כסף</td></tr>
</table>
<p>הרבה צוותים מגיעים בסוף ל-<strong>AI gateway</strong> דק מול הכל (routing, retries/failover בין regions או ספקים, quotas לכל צוות, מדידת tokens, logging/redaction) כדי שלקוד האפליקציה לא יהיה אכפת איזו אופציה משרתת את ה-request.</p>
<blockquote>⚠️ Production tip: תתייחס ל-model IDs כמו ל-dependencies. תקבע גרסאות מדויקות, תעקוב אחרי תאריכי deprecation (הפלטפורמות מוציאות גרסאות מודל משימוש לפי לוח זמנים), ותחזיק eval suite כדי שהחלפת מודל תהיה שינוי מדוד, לא תחושת בטן.</blockquote>`
      }
    }
  ],
  diagram: "app (IAM role) -> AI gateway (quotas, retries, metering, redaction)\n                 |-> Bedrock      via VPC endpoint (PrivateLink)  [on-demand | provisioned | batch]\n                 |-> Azure OpenAI via private endpoint            [Standard | Data Zone | PTU | Batch]\n                 |-> Vertex AI    via PSC + VPC-SC                [PAYG/DSQ | Provisioned | batch]\n                 \\-> self-hosted vLLM on GPU nodes (reservations / capacity blocks / spot)",
  handsOn: [
    { cmd: "aws bedrock list-inference-profiles --query 'inferenceProfileSummaries[].inferenceProfileId' --output text", what: { en: "See which cross-region inference profiles (us./eu./global.) you can call.", he: "לראות לאילו cross-region inference profiles (us./eu./global.) אפשר לקרוא." } },
    { cmd: "aws service-quotas list-service-quotas --service-code bedrock --query \"Quotas[?contains(QuotaName,'tokens per minute')].[QuotaName,Value]\" --output table", what: { en: "Your real Bedrock TPM limits per model — compare to your peak math before launch.", he: "ה-TPM האמיתיים שלך ב-Bedrock לכל מודל — להשוות לחישוב השיא לפני launch." } },
    { cmd: "az cognitiveservices account deployment list -g rg-ai -n aoai-prod --query '[].{name:name,model:properties.model.name,sku:sku.name,cap:sku.capacity}' -o table", what: { en: "Azure OpenAI deployments with their type (Standard, GlobalStandard, ProvisionedManaged…) and capacity.", he: "ה-deployments של Azure OpenAI עם הסוג שלהם (Standard, GlobalStandard, ProvisionedManaged…) והקיבולת." } },
    { cmd: "gcloud ai models list --region=europe-west4", what: { en: "List models uploaded to Vertex AI in a region (your self-deployed or tuned ones).", he: "להציג מודלים שהועלו ל-Vertex AI ב-region (אלה שעשית להם deploy או tuning)." } }
  ],
  mnemonic: {
    en: "Q-C-P-R-G: Quota before launch, Capacity mode per workload, Private path, Region pinned, Guardrails on.",
    he: "Q-C-P-R-G: Quota לפני launch, Capacity mode לכל workload, Private path, Region מקובע, Guardrails דלוקים."
  },
  pitfalls: [
    { en: "Launching on default quotas: the first marketing email turns into a wall of 429s. Do the TPM math and request increases weeks ahead.", he: "לעשות launch על ה-quotas ברירת המחדל: המייל השיווקי הראשון הופך לקיר של 429. תעשה את חישוב ה-TPM ותבקש הגדלות שבועות מראש." },
    { en: "Using global routing for regulated data because it had more capacity — you may have just moved EU PII processing out of the EU.", he: "להשתמש בניתוב global לנתונים רגולטוריים כי היה בו יותר קיבולת — ייתכן שהרגע הוצאת עיבוד של PII אירופאי מאירופה." },
    { en: "Buying provisioned throughput for spiky traffic: you pay for the units 24/7 while they sit idle at night. Provision the floor, burst on-demand.", he: "לקנות provisioned throughput לתעבורה קופצנית: משלמים על היחידות 24/7 כשהן עומדות idle בלילה. תעשה provision לרצפה, ו-burst על on-demand." },
    { en: "Leaving invocation logs (full prompts and outputs) in a bucket with broad access — that's now your most sensitive dataset.", he: "להשאיר invocation logs (prompts ו-outputs מלאים) ב-bucket עם גישה רחבה — זה עכשיו ה-dataset הכי רגיש שלך." }
  ],
  interview: [
    {
      q: { en: "You're launching an LLM feature expected to peak at 30 req/s with ~2,500 tokens per request. Walk through the platform readiness.", he: "אתה עושה launch לפיצ'ר LLM שצפוי להגיע לשיא של 30 req/s עם ~2,500 tokens לבקשה. תעבור על המוכנות של הפלטפורמה." },
      a: { en: "TPM = 30 × 2,500 × 60 = 4.5M; RPM = 1,800. Compare to the per-region quota and request the gap early; decide residency (regional vs geo vs global profile) and use cross-region capacity if allowed. Consider a provisioned floor for latency, on-demand for burst, batch for offline jobs. Private endpoint + IAM roles, no keys. Guardrails and PII redaction, invocation logs in a locked-down bucket. Client backoff with jitter, a fallback model/region in the gateway, cost alarms per team, and load-test against the real endpoint.", he: "TPM = 30 × 2,500 × 60 = 4.5M; RPM = 1,800. משווים ל-quota לכל region ומבקשים את הפער מוקדם; מחליטים על residency (profile אזורי מול גיאוגרפי מול global) ומשתמשים בקיבולת cross-region אם מותר. שוקלים רצפת provisioned בשביל latency, on-demand ל-burst, batch ל-jobs אופליין. Private endpoint + IAM roles, בלי keys. Guardrails ו-PII redaction, invocation logs ב-bucket נעול. Backoff עם jitter בצד ה-client, מודל/region חלופי ב-gateway, alarms על עלות לכל צוות, ו-load test מול ה-endpoint האמיתי." }
    },
    {
      q: { en: "When would you self-host an open model instead of using Bedrock/Vertex/Azure?", he: "מתי תעשה self-host למודל פתוח במקום Bedrock/Vertex/Azure?" },
      a: { en: "When steady utilization is high enough that owned/reserved GPUs beat per-token pricing, when you need an air-gapped or sovereign deployment, when you run a fine-tuned open model with custom serving (LoRA adapters, speculative decoding), or need tight latency control. Otherwise the platform wins on ops cost: no GPU capacity hunting, no serving stack upgrades, no on-call for inference servers.", he: "כשהניצולת היציבה גבוהה מספיק ש-GPUs בבעלות/בשריון מנצחים תמחור לפי token, כשצריך deployment מנותק או ריבוני, כשמריצים מודל פתוח fine-tuned עם serving מותאם (LoRA adapters, speculative decoding), או כשצריך שליטה הדוקה ב-latency. אחרת הפלטפורמה מנצחת בעלות התפעול: בלי לצוד קיבולת GPU, בלי upgrades ל-serving stack, בלי on-call לשרתי inference." }
    }
  ],
  quiz: [
    {
      q: { en: "Your app gets 429s from Azure OpenAI at peak although average load is low. The first infra fix?", he: "האפליקציה מקבלת 429 מ-Azure OpenAI בשיא למרות שהעומס הממוצע נמוך. התיקון התשתיתי הראשון?" },
      options: [
        { en: "Increase the VM size of the app", he: "להגדיל את גודל ה-VM של האפליקציה" },
        { en: "Check TPM/RPM assigned to the deployment vs peak demand (including max_tokens), raise quota or add deployments/regions, and back off with jitter", he: "לבדוק TPM/RPM שהוקצו ל-deployment מול הביקוש בשיא (כולל max_tokens), להגדיל quota או להוסיף deployments/regions, ולעשות backoff עם jitter" },
        { en: "Disable content filters", he: "לכבות את ה-content filters" },
        { en: "Switch to batch for all traffic", he: "להעביר את כל התעבורה ל-batch" }
      ],
      answer: 1,
      explain: { en: "429 = rate limit on the deployment's quota, which is per minute — averages hide peaks. Batch is async and unsuitable for interactive traffic.", he: "429 = rate limit על ה-quota של ה-deployment, שהוא לדקה — ממוצעים מסתירים שיאים. Batch אסינכרוני ולא מתאים לתעבורה אינטראקטיבית." }
    },
    {
      q: { en: "Nightly enrichment of 2M documents, results needed by morning. Cheapest fitting mode?", he: "העשרה לילית של 2M מסמכים, התוצאות צריכות להיות מוכנות עד הבוקר. ה-mode הזול ביותר שמתאים?" },
      options: [
        { en: "Provisioned throughput with a 1-year term", he: "Provisioned throughput עם התחייבות לשנה" },
        { en: "On-demand with high concurrency", he: "On-demand עם concurrency גבוה" },
        { en: "Batch inference (~50% discount, async window)", he: "Batch inference (~50% הנחה, חלון אסינכרוני)" },
        { en: "Self-host on Spot GPUs without checkpoints", he: "Self-host על Spot GPUs בלי checkpoints" }
      ],
      answer: 2,
      explain: { en: "Batch is built for exactly this: large offline jobs with a completion window, at roughly half price, and it doesn't consume your interactive quota the same way.", he: "Batch נבנה בדיוק לזה: jobs אופליין גדולים עם חלון סיום, בערך בחצי מחיר, והוא לא צורך את ה-quota האינטראקטיבי שלך באותה צורה." }
    },
    {
      q: { en: "Which setup keeps Bedrock traffic off the public internet from your VPC?", he: "איזה setup מחזיק את תעבורת Bedrock מחוץ לאינטרנט הציבורי מתוך ה-VPC שלך?" },
      options: [
        { en: "A NAT Gateway", he: "NAT Gateway" },
        { en: "An interface VPC endpoint (PrivateLink) for bedrock-runtime with private DNS, plus IAM conditions on aws:sourceVpce", he: "Interface VPC endpoint (PrivateLink) ל-bedrock-runtime עם private DNS, ועוד IAM conditions על aws:sourceVpce" },
        { en: "A Global inference profile", he: "Global inference profile" },
        { en: "An API key stored in Secrets Manager", he: "API key ששמור ב-Secrets Manager" }
      ],
      answer: 1,
      explain: { en: "A NAT Gateway still exits to the public endpoint. The interface endpoint resolves the service name to private IPs in your subnets; IAM conditions can enforce that calls only come through it.", he: "NAT Gateway עדיין יוצא ל-endpoint הציבורי. ה-interface endpoint מתרגם את שם השירות ל-IPs פרטיים ב-subnets שלך; IAM conditions יכולים לאכוף שקריאות מגיעות רק דרכו." }
    },
    {
      q: { en: "What does 'global' routing (e.g., a global inference profile or Global Standard deployment) trade away?", he: "על מה מוותרים בניתוב 'global' (למשל global inference profile או Global Standard deployment)?" },
      options: [
        { en: "Model quality", he: "איכות המודל" },
        { en: "Encryption in transit", he: "הצפנה בתעבורה" },
        { en: "Guaranteed in-region/in-geo data processing — in exchange for more capacity and availability", he: "עיבוד נתונים מובטח בתוך ה-region/האזור הגיאוגרפי — בתמורה ליותר קיבולת וזמינות" },
        { en: "IAM authentication", he: "אימות IAM" }
      ],
      answer: 2,
      explain: { en: "Global routing can process requests in any region the provider chooses. Great for capacity, but check it against data-residency requirements; geo-bounded options (eu./us. profiles, Data Zone) are the middle ground.", he: "ניתוב global יכול לעבד בקשות בכל region שהספק בוחר. מעולה לקיבולת, אבל צריך לבדוק מול דרישות data residency; אופציות תחומות גיאוגרפית (profiles של eu./us., Data Zone) הן דרך האמצע." }
    }
  ],
  related: ["ai-agent-infra-mcp", "k8s-gpu-inference", "pr-ai-systems-design", "flow-llm-request", "cloud-finops", "cloud-iam-security", "cloud-airgapped"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cloud-well-architected",
  track: "cloud",
  order: 33,
  icon: "🏛️",
  level: 2,
  minutes: 13,
  title: { en: "Well-Architected Reviews: Pillars, Process, Findings", he: "Well-Architected Reviews: עמודי תווך, תהליך, ממצאים" },
  tldr: {
    en: "A Well-Architected review is a structured health check of a real workload against six pillars — operational excellence, security, reliability, performance efficiency, cost optimization, sustainability. The value isn't the questionnaire; it's a short, prioritized list of high-risk issues with owners and dates, re-checked every few months.",
    he: "Well-Architected review זה בדיקת בריאות מובנית של workload אמיתי מול שישה עמודי תווך — operational excellence, security, reliability, performance efficiency, cost optimization, sustainability. הערך הוא לא השאלון; הוא רשימה קצרה ומתועדפת של high-risk issues עם בעלים ותאריכים, שנבדקת מחדש כל כמה חודשים."
  },
  analogy: {
    en: "It's the annual vehicle inspection (טסט) for your system. The inspector doesn't redesign your car; they check brakes, lights, tires and emissions against a fixed list, flag what's dangerous today, and you come back next year. Nobody fails for an old radio — you fail for brakes. Same here: one untested backup outweighs ten 'nice-to-haves'.",
    he: "זה הטסט השנתי של המערכת שלך. הבוחן לא מתכנן לך את הרכב מחדש; הוא בודק בלמים, אורות, צמיגים ופליטה מול רשימה קבועה, מסמן מה מסוכן היום, וחוזרים בשנה הבאה. אף אחד לא נכשל בגלל רדיו ישן — נכשלים על בלמים. אותו דבר כאן: גיבוי אחד שלא נבדק שוקל יותר מעשרה 'nice-to-haves'."
  },
  sections: [
    {
      h: { en: "The pillars and each cloud's framework", he: "עמודי התווך וה-framework של כל ענן" },
      body: {
        en: `<table>
<tr><th>Pillar</th><th>Core question</th><th>Typical evidence</th></tr>
<tr><td>Operational excellence</td><td>Can we deploy, observe and recover safely and repeatably?</td><td>IaC, CI/CD with rollback, runbooks, SLOs and alerts, post-incident reviews</td></tr>
<tr><td>Security</td><td>Who can do what, and would we know if they did?</td><td>SSO + MFA, least-privilege roles, no long-lived keys, encryption, audit logs, patching, guardrail policies</td></tr>
<tr><td>Reliability</td><td>What happens when a component, AZ or region fails?</td><td>Multi-AZ, health checks, autoscaling, tested backups/restores, defined RPO/RTO, quotas monitored</td></tr>
<tr><td>Performance efficiency</td><td>Are we using the right resource types and scaling with demand?</td><td>Load tests, right instance families, caching, managed services where they fit</td></tr>
<tr><td>Cost optimization</td><td>Do we know what we spend, per team/feature, and is it justified?</td><td>Tags, budgets + anomaly alerts, rightsizing, commitments, lifecycle policies</td></tr>
<tr><td>Sustainability</td><td>Are we minimizing resources (and energy) per unit of work?</td><td>High utilization, Graviton/efficient instances, data lifecycle, region choice</td></tr>
</table>
<ul>
<li><strong>AWS Well-Architected Framework</strong>: all six pillars (sustainability added in 2021); free <strong>Well-Architected Tool</strong> in the console with lenses (Serverless, SaaS, Machine Learning, Generative AI, and more), records answers and flags <strong>HRIs</strong> (high-risk issues) and MRIs (medium).</li>
<li><strong>Azure Well-Architected Framework</strong>: five pillars (reliability, security, cost optimization, operational excellence, performance efficiency); sustainability is covered as separate guidance. Run the <strong>Well-Architected Review</strong> assessment; <strong>Azure Advisor</strong> scores live resources per pillar.</li>
<li><strong>Google Cloud Well-Architected Framework</strong> (formerly the Architecture Framework): operational excellence; security, privacy and compliance; reliability; cost optimization; performance optimization; sustainability. Active Assist / Recommender surfaces concrete findings.</li>
</ul>
<blockquote>💡 Real world: the automated advisors (Trusted Advisor, Azure Advisor, Recommender, Security Hub / Defender for Cloud / Security Command Center) find <em>resource-level</em> issues. The review finds <em>process-level</em> issues they can't see: "nobody has ever restored this DB", "only Dana knows how to deploy".</blockquote>`,
        he: `<table>
<tr><th>עמוד תווך</th><th>שאלת הליבה</th><th>ראיות טיפוסיות</th></tr>
<tr><td>Operational excellence</td><td>האם אפשר לעשות deploy, לצפות ולהתאושש בבטחה ובאופן חוזר?</td><td>IaC, CI/CD עם rollback, runbooks, SLOs ו-alerts, תחקירי incidents</td></tr>
<tr><td>Security</td><td>מי יכול לעשות מה, והאם נדע אם עשה?</td><td>SSO + MFA, roles עם least privilege, בלי keys ארוכי חיים, הצפנה, audit logs, patching, guardrail policies</td></tr>
<tr><td>Reliability</td><td>מה קורה כשרכיב, AZ או region נופלים?</td><td>Multi-AZ, health checks, autoscaling, גיבויים ושחזורים שנבדקו, RPO/RTO מוגדרים, ניטור quotas</td></tr>
<tr><td>Performance efficiency</td><td>האם משתמשים בסוגי משאבים נכונים ועושים scale לפי הביקוש?</td><td>Load tests, משפחות instances נכונות, caching, שירותים מנוהלים איפה שמתאים</td></tr>
<tr><td>Cost optimization</td><td>האם אנחנו יודעים כמה מוציאים, לכל צוות/פיצ'ר, והאם זה מוצדק?</td><td>Tags, budgets + anomaly alerts, rightsizing, commitments, lifecycle policies</td></tr>
<tr><td>Sustainability</td><td>האם אנחנו ממזערים משאבים (ואנרגיה) ליחידת עבודה?</td><td>ניצולת גבוהה, Graviton/instances יעילים, lifecycle לנתונים, בחירת region</td></tr>
</table>
<ul>
<li><strong>AWS Well-Architected Framework</strong>: כל ששת עמודי התווך (sustainability נוסף ב-2021); <strong>Well-Architected Tool</strong> חינמי ב-console עם lenses (Serverless, SaaS, Machine Learning, Generative AI ועוד), ששומר תשובות ומסמן <strong>HRIs</strong> (high-risk issues) ו-MRIs (medium).</li>
<li><strong>Azure Well-Architected Framework</strong>: חמישה עמודי תווך (reliability, security, cost optimization, operational excellence, performance efficiency); sustainability מכוסה כהנחיות נפרדות. מריצים את ה-assessment של <strong>Well-Architected Review</strong>; <strong>Azure Advisor</strong> נותן ציון למשאבים חיים לפי עמוד תווך.</li>
<li><strong>Google Cloud Well-Architected Framework</strong> (לשעבר Architecture Framework): operational excellence; security, privacy and compliance; reliability; cost optimization; performance optimization; sustainability. Active Assist / Recommender מציפים ממצאים קונקרטיים.</li>
</ul>
<blockquote>💡 Real world: ה-advisors האוטומטיים (Trusted Advisor, Azure Advisor, Recommender, Security Hub / Defender for Cloud / Security Command Center) מוצאים בעיות <em>ברמת המשאב</em>. ה-review מוצא בעיות <em>ברמת התהליך</em> שהם לא רואים: "אף אחד אף פעם לא שחזר את ה-DB הזה", "רק דנה יודעת לעשות deploy".</blockquote>`
      }
    },
    {
      h: { en: "How to run a review on a real system", he: "איך מריצים review על מערכת אמיתית" },
      body: {
        en: `<ol>
<li><strong>Scope one workload</strong> (e.g. "checkout API + its DB + queues"), not "our AWS". Name the business owner and the criticality (revenue per hour of downtime).</li>
<li><strong>Prep (1-2 days)</strong>: architecture diagram, IaC repo, SLOs, last 3 incident reports, cost per month, account/org structure. Pull automated findings first (Trusted Advisor / Advisor / Security Hub) so the meeting isn't spent discovering public buckets.</li>
<li><strong>Workshop (2-4 h)</strong> with the people who run it — dev lead, on-call, security, FinOps. Go pillar by pillar; ask for <em>evidence</em> ("show me the last restore test"), not opinions.</li>
<li><strong>Rate each finding</strong>: HRI (could cause major outage, breach or cost blow-up soon) / MRI / improvement. Estimate effort (S/M/L).</li>
<li><strong>Output</strong>: top 5-10 HRIs with an owner and date, as backlog tickets; set a milestone in the WA Tool; schedule the re-review (every 6-12 months or after a major change).</li>
</ol>
<p><strong>Questions that find real problems</strong> (a few per pillar):</p>
<ul>
<li>Ops: How do you roll back a bad deploy, and how long does it take? What alert would wake someone if checkout broke at 3 a.m.? Is anything changed by hand in the console?</li>
<li>Security: Who has admin, and with MFA? Any IAM user access keys older than 90 days? Is CloudTrail/Activity Log/Audit Log on in every account and region, stored where attackers can't delete it?</li>
<li>Reliability: What happens if one AZ disappears? When did you last restore a backup <em>and verify data</em>? What's the RPO/RTO, and who agreed to it? Which quotas would you hit at 3x traffic?</li>
<li>Performance: When was the last load test, and what broke first? What's p99 latency vs the SLO?</li>
<li>Cost: Is there a budget with alerts? What % of spend is untagged? What does a 2x traffic month cost?</li>
<li>Sustainability: What's the average CPU utilization of the fleet? Are old snapshots and logs expired?</li>
</ul>`,
        he: `<ol>
<li><strong>מגדירים workload אחד</strong> (למשל "ה-checkout API + ה-DB שלו + ה-queues"), לא "ה-AWS שלנו". קובעים בעלים עסקי ורמת קריטיות (הכנסה לשעת downtime).</li>
<li><strong>הכנה (1-2 ימים)</strong>: דיאגרמת ארכיטקטורה, repo של IaC, SLOs, 3 דוחות ה-incidents האחרונים, עלות חודשית, מבנה accounts/org. מושכים קודם ממצאים אוטומטיים (Trusted Advisor / Advisor / Security Hub) כדי שהפגישה לא תתבזבז על גילוי buckets ציבוריים.</li>
<li><strong>Workshop (2-4 שעות)</strong> עם האנשים שמתפעלים — ה-dev lead, ה-on-call, security, FinOps. עוברים עמוד תווך אחרי עמוד תווך; מבקשים <em>ראיות</em> ("תראה לי את בדיקת השחזור האחרונה"), לא דעות.</li>
<li><strong>מדרגים כל ממצא</strong>: HRI (עלול לגרום ל-outage גדול, לפריצה או לפיצוץ עלויות בקרוב) / MRI / שיפור. מעריכים מאמץ (S/M/L).</li>
<li><strong>תוצר</strong>: 5-10 ה-HRIs המובילים עם בעלים ותאריך, כ-tickets ב-backlog; קובעים milestone ב-WA Tool; קובעים re-review (כל 6-12 חודשים או אחרי שינוי גדול).</li>
</ol>
<p><strong>שאלות שמוצאות בעיות אמיתיות</strong> (כמה לכל עמוד תווך):</p>
<ul>
<li>Ops: איך עושים rollback ל-deploy רע, וכמה זמן זה לוקח? איזה alert יעיר מישהו אם ה-checkout נשבר ב-3 בלילה? משהו משתנה ידנית ב-console?</li>
<li>Security: למי יש admin, ועם MFA? יש access keys של IAM users שגילם מעל 90 יום? CloudTrail/Activity Log/Audit Log פעילים בכל account ו-region, ונשמרים במקום שתוקף לא יכול למחוק?</li>
<li>Reliability: מה קורה אם AZ אחד נעלם? מתי לאחרונה שחזרת גיבוי <em>ואימתת את הנתונים</em>? מה ה-RPO/RTO, ומי הסכים להם? באילו quotas תיתקל ב-3x תעבורה?</li>
<li>Performance: מתי היה ה-load test האחרון, ומה נשבר ראשון? מה ה-p99 latency מול ה-SLO?</li>
<li>Cost: יש budget עם alerts? כמה אחוז מההוצאה בלי tags? כמה עולה חודש עם פי 2 תעבורה?</li>
<li>Sustainability: מה ניצולת ה-CPU הממוצעת של ה-fleet? snapshots ולוגים ישנים פגים?</li>
</ul>`
      }
    },
    {
      h: { en: "Worked example: findings and prioritized fixes", he: "דוגמה מלאה: ממצאים ותיקונים מתועדפים" },
      body: {
        en: `<p>Workload: a B2B SaaS "orders" service on AWS — ALB → ECS Fargate → RDS PostgreSQL, SQS for async jobs, ~$38k/month, 99.9% SLO. Findings after a half-day workshop:</p>
<table>
<tr><th>#</th><th>Finding</th><th>Pillar</th><th>Risk</th><th>Fix</th><th>Effort</th></tr>
<tr><td>1</td><td>RDS is single-AZ; ECS tasks pinned to one subnet</td><td>Reliability</td><td>HRI</td><td>Enable Multi-AZ on RDS; spread tasks across 3 AZ subnets</td><td>S</td></tr>
<tr><td>2</td><td>Automated snapshots exist, but no restore was ever tested; RTO unknown</td><td>Reliability</td><td>HRI</td><td>Quarterly scripted restore to a scratch account with a data check; record actual RTO</td><td>M</td></tr>
<tr><td>3</td><td>CI uses an IAM user access key (2 years old) with AdministratorAccess</td><td>Security</td><td>HRI</td><td>OIDC federation from CI to a scoped deploy role; delete the key</td><td>S</td></tr>
<tr><td>4</td><td>No budget or cost anomaly alerts; 31% of spend untagged</td><td>Cost</td><td>HRI</td><td>AWS Budgets + Cost Anomaly Detection to the team channel; tag policy enforced in IaC</td><td>S</td></tr>
<tr><td>5</td><td>SQS queue has no DLQ; worker errors retry forever</td><td>Reliability / Ops</td><td>MRI</td><td>Redrive policy (maxReceiveCount 5) + alarm on DLQ depth</td><td>S</td></tr>
<tr><td>6</td><td>Alerts on CPU only, none on 5xx rate or latency SLO</td><td>Ops</td><td>MRI</td><td>SLO-based burn-rate alerts on ALB 5xx and p99</td><td>M</td></tr>
<tr><td>7</td><td>Fargate tasks average 12% CPU</td><td>Cost / Sustainability</td><td>Improve</td><td>Rightsize task sizes; consider Graviton (ARM) images</td><td>M</td></tr>
</table>
<p>Prioritize by <strong>risk × ease</strong>: items 1, 3, 4 are HRIs <em>and</em> small — do them this sprint. Item 2 is the most important finding (backups you can't restore aren't backups) but needs a plan; schedule the first restore drill within 30 days. Items 5-7 go into the regular backlog with dates.</p>
<pre>aws wellarchitected create-workload --workload-name orders-prod --environment PRODUCTION \\
  --aws-regions eu-west-1 --lenses wellarchitected --review-owner platform@example.com \\
  --description "Orders service review" --pillar-priorities reliability security costOptimization
aws wellarchitected create-milestone --workload-id $WID --milestone-name "2026-Q4 baseline"
aws wellarchitected get-lens-review --workload-id $WID --lens-alias wellarchitected \\
  --query 'LensReview.RiskCounts'      # {"HIGH": 4, "MEDIUM": 2, "NONE": ..., "UNANSWERED": ...}</pre>`,
        he: `<p>ה-workload: שירות "orders" של B2B SaaS על AWS — ALB → ECS Fargate → RDS PostgreSQL, SQS ל-jobs אסינכרוניים, ~$38k לחודש, SLO של 99.9%. הממצאים אחרי workshop של חצי יום:</p>
<table>
<tr><th>#</th><th>ממצא</th><th>עמוד תווך</th><th>סיכון</th><th>תיקון</th><th>מאמץ</th></tr>
<tr><td>1</td><td>RDS ב-AZ יחיד; ה-tasks של ECS מקובעים ל-subnet אחד</td><td>Reliability</td><td>HRI</td><td>להפעיל Multi-AZ ב-RDS; לפזר tasks על subnets ב-3 AZs</td><td>S</td></tr>
<tr><td>2</td><td>יש snapshots אוטומטיים, אבל אף פעם לא נבדק שחזור; ה-RTO לא ידוע</td><td>Reliability</td><td>HRI</td><td>שחזור רבעוני עם script ל-account נפרד עם בדיקת נתונים; לתעד RTO בפועל</td><td>M</td></tr>
<tr><td>3</td><td>ה-CI משתמש ב-access key של IAM user (בן שנתיים) עם AdministratorAccess</td><td>Security</td><td>HRI</td><td>OIDC federation מה-CI ל-deploy role מצומצם; למחוק את ה-key</td><td>S</td></tr>
<tr><td>4</td><td>אין budget ואין anomaly alerts על עלות; 31% מההוצאה בלי tags</td><td>Cost</td><td>HRI</td><td>AWS Budgets + Cost Anomaly Detection לערוץ של הצוות; tag policy שנאכפת ב-IaC</td><td>S</td></tr>
<tr><td>5</td><td>ל-SQS queue אין DLQ; שגיאות ב-worker עושות retry לנצח</td><td>Reliability / Ops</td><td>MRI</td><td>Redrive policy (maxReceiveCount 5) + alarm על עומק ה-DLQ</td><td>S</td></tr>
<tr><td>6</td><td>Alerts רק על CPU, אין על שיעור 5xx או על ה-SLO של latency</td><td>Ops</td><td>MRI</td><td>Burn-rate alerts מבוססי SLO על 5xx ב-ALB ועל p99</td><td>M</td></tr>
<tr><td>7</td><td>ה-tasks ב-Fargate בממוצע 12% CPU</td><td>Cost / Sustainability</td><td>שיפור</td><td>Rightsizing לגודל ה-tasks; לשקול images של Graviton (ARM)</td><td>M</td></tr>
</table>
<p>מתעדפים לפי <strong>סיכון × קלות</strong>: סעיפים 1, 3, 4 הם HRIs <em>וגם</em> קטנים — עושים אותם בספרינט הזה. סעיף 2 הוא הממצא הכי חשוב (גיבויים שאי אפשר לשחזר הם לא גיבויים) אבל צריך תוכנית; קובעים את תרגיל השחזור הראשון בתוך 30 יום. סעיפים 5-7 נכנסים ל-backlog הרגיל עם תאריכים.</p>
<pre>aws wellarchitected create-workload --workload-name orders-prod --environment PRODUCTION \\
  --aws-regions eu-west-1 --lenses wellarchitected --review-owner platform@example.com \\
  --description "Orders service review" --pillar-priorities reliability security costOptimization
aws wellarchitected create-milestone --workload-id $WID --milestone-name "2026-Q4 baseline"
aws wellarchitected get-lens-review --workload-id $WID --lens-alias wellarchitected \\
  --query 'LensReview.RiskCounts'      # {"HIGH": 4, "MEDIUM": 2, "NONE": ..., "UNANSWERED": ...}</pre>`
      }
    },
    {
      h: { en: "The high-risk issues you'll find almost every time", he: "ה-high-risk issues שתמצא כמעט כל פעם" },
      body: {
        en: `<ul>
<li><strong>Single AZ</strong> somewhere critical: the DB, a NAT Gateway shared by all AZs, a self-managed Redis, or "multi-AZ" ASG with a minimum of 1.</li>
<li><strong>Backups never restored</strong>: snapshots exist, restores were never tested, nobody knows the real RTO; or backups live in the same account an attacker (or a bad script) can wipe — no cross-account copy or immutability.</li>
<li><strong>Admin keys</strong>: long-lived access keys with admin, root account without MFA or with access keys, shared break-glass passwords in a wiki.</li>
<li><strong>No budgets/alerts</strong>: the first sign of a runaway cost is the invoice; no anomaly detection, no per-team visibility.</li>
<li><strong>Alerting on causes, not symptoms</strong>: CPU alerts everywhere, no alert on error rate or latency, no on-call rotation.</li>
<li><strong>Click-ops and drift</strong>: production changed in the console, IaC out of date, no way to rebuild the environment.</li>
<li><strong>Quotas ignored</strong>: service quotas (vCPU, IPs, Lambda concurrency, AI TPM) that would block a scale-out at 2-3x traffic.</li>
<li><strong>No DLQs / retries without limits</strong> on queues and event targets.</li>
</ul>
<blockquote>⚠️ Production tip: write the review output as tickets in the team's normal backlog with the WA pillar as a label — not a PDF. A PDF of findings has a half-life of about two weeks; a ticket with an owner and a due date gets done. Track "open HRIs per workload" as a platform KPI.</blockquote>`,
        he: `<ul>
<li><strong>AZ יחיד</strong> במקום קריטי: ה-DB, NAT Gateway אחד שכל ה-AZs משתמשים בו, Redis בניהול עצמי, או ASG "multi-AZ" עם מינימום של 1.</li>
<li><strong>גיבויים שאף פעם לא שוחזרו</strong>: יש snapshots, שחזורים אף פעם לא נבדקו, אף אחד לא יודע את ה-RTO האמיתי; או שהגיבויים יושבים באותו account שתוקף (או script רע) יכול למחוק — בלי עותק ב-account אחר ובלי immutability.</li>
<li><strong>Admin keys</strong>: access keys ארוכי חיים עם admin, root account בלי MFA או עם access keys, סיסמאות break-glass משותפות ב-wiki.</li>
<li><strong>אין budgets/alerts</strong>: הסימן הראשון לעלות שיצאה משליטה הוא החשבונית; אין anomaly detection, אין נראות לכל צוות.</li>
<li><strong>Alerts על סיבות, לא על סימפטומים</strong>: alerts על CPU בכל מקום, אין alert על שיעור שגיאות או על latency, אין on-call rotation.</li>
<li><strong>Click-ops ו-drift</strong>: production שונה ב-console, ה-IaC לא מעודכן, אין דרך לבנות את הסביבה מחדש.</li>
<li><strong>Quotas שאף אחד לא בודק</strong>: service quotas (vCPU, IPs, Lambda concurrency, TPM של AI) שיחסמו scale-out בפי 2-3 תעבורה.</li>
<li><strong>אין DLQs / retries בלי גבול</strong> על queues ועל event targets.</li>
</ul>
<blockquote>⚠️ Production tip: תכתוב את התוצר של ה-review כ-tickets ב-backlog הרגיל של הצוות, עם עמוד התווך כ-label — לא כ-PDF. ל-PDF של ממצאים יש זמן מחצית חיים של שבועיים בערך; ticket עם בעלים ותאריך יעד נסגר. תעקוב אחרי "HRIs פתוחים לכל workload" כ-KPI של ה-platform.</blockquote>`
      }
    }
  ],
  diagram: "scope workload -> prep (diagram, IaC, SLOs, incidents, advisor findings)\n   -> workshop (6 pillars, evidence not opinions)\n   -> rate: HRI | MRI | improvement  x  effort S/M/L\n   -> backlog tickets (owner + date) -> milestone -> re-review in 6-12 months",
  handsOn: [
    { cmd: "aws wellarchitected list-workloads --query 'WorkloadSummaries[].[WorkloadName,RiskCounts.HIGH,UpdatedAt]' --output table", what: { en: "See every reviewed workload and its open high-risk count.", he: "לראות כל workload שעבר review ואת מספר ה-high-risk הפתוחים שלו." } },
    { cmd: "aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 -d | cut -d, -f1,4,9,10,11", what: { en: "Find IAM users, MFA status and access-key age — the classic 'admin keys' HRI.", he: "למצוא IAM users, מצב MFA וגיל access keys — ה-HRI הקלאסי של 'admin keys'." } },
    { cmd: "aws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier,MultiAZ,BackupRetentionPeriod]' --output table", what: { en: "Spot single-AZ databases and missing backup retention in one table.", he: "לזהות מסדי נתונים ב-AZ יחיד ו-backup retention חסר בטבלה אחת." } },
    { cmd: "az advisor recommendation list --category HighAvailability -o table", what: { en: "Azure Advisor's reliability findings for the subscription.", he: "ממצאי ה-reliability של Azure Advisor ל-subscription." } }
  ],
  mnemonic: {
    en: "\"OSRPCS\" — Ops, Security, Reliability, Performance, Cost, Sustainability. Ask for evidence, rank by risk × ease, ship tickets not PDFs.",
    he: "\"OSRPCS\" — Ops, Security, Reliability, Performance, Cost, Sustainability. מבקשים ראיות, מדרגים לפי סיכון × קלות, מוציאים tickets ולא PDFs."
  },
  pitfalls: [
    { en: "Reviewing 'the whole cloud account' instead of one workload — the answers become 'it depends' and nothing actionable comes out.", he: "לעשות review ל'כל ה-account' במקום ל-workload אחד — התשובות הופכות ל'תלוי' ושום דבר שאפשר לבצע לא יוצא." },
    { en: "Accepting 'yes, we have backups' without asking for the last successful restore and its duration.", he: "לקבל 'כן, יש לנו גיבויים' בלי לבקש את השחזור המוצלח האחרון וכמה זמן הוא לקח." },
    { en: "Producing 80 findings with equal weight. Teams fix the easy cosmetic ones and the three HRIs stay open.", he: "להוציא 80 ממצאים באותו משקל. הצוותים מתקנים את הקלים והקוסמטיים ושלושת ה-HRIs נשארים פתוחים." },
    { en: "Treating it as an audit run by outsiders: the operating team must be in the room, or you get a theoretical architecture instead of the real one.", he: "להתייחס לזה כמו ל-audit שמריצים אנשים מבחוץ: הצוות המתפעל חייב להיות בחדר, אחרת מקבלים ארכיטקטורה תיאורטית במקום האמיתית." }
  ],
  interview: [
    {
      q: { en: "You have one week to assess a new team's production system. How do you approach it?", he: "יש לך שבוע להעריך מערכת production של צוות חדש. איך אתה ניגש?" },
      a: { en: "Scope one critical workload; collect the diagram, IaC, SLOs, recent incidents and cost; run automated advisors first. Then a workshop pillar by pillar asking for evidence: last restore, rollback time, who has admin, what alerts on user pain, quotas at 3x. Rate findings HRI/MRI with effort, and deliver the top 5-10 HRIs as tickets with owners, quick wins first (Multi-AZ, kill admin keys, budgets), the hard but critical ones (restore drill) scheduled, and a re-review date.", he: "מגדירים workload קריטי אחד; אוספים דיאגרמה, IaC, SLOs, incidents אחרונים ועלות; מריצים קודם advisors אוטומטיים. אחר כך workshop לפי עמודי תווך עם בקשת ראיות: השחזור האחרון, זמן rollback, למי יש admin, מה מתריע על כאב של משתמשים, quotas בפי 3. מדרגים ממצאים HRI/MRI עם מאמץ, ומוסרים את 5-10 ה-HRIs המובילים כ-tickets עם בעלים, quick wins קודם (Multi-AZ, להעיף admin keys, budgets), הקשים אבל הקריטיים (תרגיל שחזור) בלוח זמנים, ותאריך re-review." }
    },
    {
      q: { en: "How do Trusted Advisor / Azure Advisor differ from a Well-Architected review?", he: "במה Trusted Advisor / Azure Advisor שונים מ-Well-Architected review?" },
      a: { en: "Advisors scan live resources for configuration issues (open security groups, idle instances, single-AZ databases). A review covers process and design they can't see: tested restores, deploy/rollback practice, ownership, on-call, RPO/RTO agreement, threat model. Use advisors as input to the review, not as a replacement.", he: "ה-advisors סורקים משאבים חיים ומחפשים בעיות קונפיגורציה (security groups פתוחים, instances ב-idle, מסדי נתונים ב-AZ יחיד). Review מכסה תהליך ותכנון שהם לא רואים: שחזורים שנבדקו, נוהלי deploy/rollback, בעלות, on-call, הסכמה על RPO/RTO, threat model. משתמשים ב-advisors כקלט ל-review, לא כתחליף." }
    }
  ],
  quiz: [
    {
      q: { en: "Which pillar is in the AWS framework but not one of Azure's five core pillars?", he: "איזה עמוד תווך קיים ב-framework של AWS אבל לא בין חמשת עמודי הליבה של Azure?" },
      options: [
        { en: "Reliability", he: "Reliability" },
        { en: "Sustainability", he: "Sustainability" },
        { en: "Cost optimization", he: "Cost optimization" },
        { en: "Security", he: "Security" }
      ],
      answer: 1,
      explain: { en: "AWS added sustainability as a sixth pillar in 2021; Azure keeps five pillars and covers sustainability as separate workload guidance. Google's framework also includes sustainability.", he: "AWS הוסיפו sustainability כעמוד תווך שישי ב-2021; Azure נשארו עם חמישה וכיסו sustainability כהנחיות workload נפרדות. גם ה-framework של Google כולל sustainability." }
    },
    {
      q: { en: "A review finds 25 items. Which should be done first?", he: "Review מצא 25 פריטים. מה עושים קודם?" },
      options: [
        { en: "The ones the team finds most interesting", he: "אלה שהצוות מוצא הכי מעניינים" },
        { en: "Alphabetically by pillar", he: "לפי סדר אלפביתי של עמודי התווך" },
        { en: "High-risk issues that are also low effort (e.g., enable Multi-AZ, remove admin keys, add budgets), then critical-but-bigger HRIs with a date", he: "High-risk issues שהם גם במאמץ נמוך (למשל להפעיל Multi-AZ, להסיר admin keys, להוסיף budgets), ואז HRIs קריטיים וגדולים יותר עם תאריך" },
        { en: "All cost items, since they save money immediately", he: "כל פריטי העלות, כי הם חוסכים כסף מיד" }
      ],
      answer: 2,
      explain: { en: "Prioritize by risk × ease. Quick HRI wins reduce exposure in days; larger HRIs like restore drills get scheduled with owners rather than postponed indefinitely.", he: "מתעדפים לפי סיכון × קלות. Quick wins של HRI מורידים חשיפה בתוך ימים; HRIs גדולים כמו תרגילי שחזור נקבעים בלוח זמנים עם בעלים במקום להידחות לנצח." }
    },
    {
      q: { en: "'We have daily snapshots' — what's the reviewer's best follow-up?", he: "'יש לנו snapshots יומיים' — מה שאלת ההמשך הכי טובה של ה-reviewer?" },
      options: [
        { en: "Which storage class are they in?", he: "באיזה storage class הם?" },
        { en: "When did you last restore one, verify the data, and how long did it take?", he: "מתי לאחרונה שחזרתם אחד, אימתתם את הנתונים, וכמה זמן זה לקח?" },
        { en: "Are they encrypted with AES-128?", he: "האם הם מוצפנים ב-AES-128?" },
        { en: "How many snapshots do you keep?", he: "כמה snapshots אתם שומרים?" }
      ],
      answer: 1,
      explain: { en: "An untested backup is a hope, not a control. The restore test proves recoverability and gives you the real RTO; also ask whether a copy lives in a separate account/immutable store.", he: "גיבוי שלא נבדק הוא תקווה, לא בקרה. בדיקת השחזור מוכיחה שאפשר להתאושש ונותנת את ה-RTO האמיתי; כדאי לשאול גם אם יש עותק ב-account נפרד או באחסון immutable." }
    }
  ],
  playground: "dr",
  related: ["rel-ha", "rel-bcdr", "cloud-iam-security", "cloud-finops", "cloud-regions-azs", "db-backups", "cloud-iac"]
});

/* ------------------------------------------------------------------ */
[
  ["Long polling", "cloud",
   "A receive call that waits (SQS: up to 20 s via WaitTimeSeconds) until a message arrives instead of returning empty immediately — fewer empty responses, lower cost and latency.",
   "קריאת receive שמחכה (ב-SQS: עד 20 שניות עם WaitTimeSeconds) עד שמגיעה הודעה במקום לחזור ריקה מיד — פחות תשובות ריקות, עלות ו-latency נמוכים יותר.",
   "cloud-event-services"],
  ["CloudEvents", "cloud",
   "CNCF specification for a vendor-neutral event envelope: required attributes specversion, id, source and type; used natively by Event Grid, Eventarc and Knative.",
   "מפרט של CNCF למעטפת event ניטרלית-לספק: שדות החובה specversion, id, source ו-type; נתמך native ב-Event Grid, Eventarc ו-Knative.",
   "cloud-event-services"],
  ["Event bus", "cloud",
   "A managed router (EventBridge, Event Grid, Eventarc) that matches discrete events against rules/filters and delivers them to targets — routing by content, not a durable work queue.",
   "Router מנוהל (EventBridge, Event Grid, Eventarc) שמתאים events בודדים מול rules/filters ומוסר אותם ל-targets — ניתוב לפי תוכן, לא queue עמיד לעבודה.",
   "cloud-event-services"],
  ["EKS Pod Identity", "cloud",
   "EKS mechanism that maps a namespace/ServiceAccount to an IAM role via an association and a node agent, giving pods short-lived AWS credentials without per-cluster OIDC setup.",
   "מנגנון של EKS שממפה namespace/ServiceAccount ל-IAM role דרך association ו-agent על ה-node, ונותן ל-Pods credentials קצרי חיים ל-AWS בלי הגדרת OIDC לכל cluster.",
   "cloud-managed-k8s-compare"],
  ["Extended support (Kubernetes)", "cloud",
   "Paid support for a Kubernetes minor version after standard support ends — on EKS the control plane fee rises from $0.10/h to $0.60/h per cluster.",
   "תמיכה בתשלום לגרסת minor של Kubernetes אחרי שה-standard support נגמר — ב-EKS עלות ה-control plane עולה מ-$0.10 ל-$0.60 לשעה לכל cluster.",
   "cloud-managed-k8s-compare"],
  ["Azure CNI Overlay", "cloud",
   "AKS networking mode where pods get IPs from a private overlay CIDR separate from the VNet (traffic leaving the cluster is SNATed to the node IP), avoiding VNet IP exhaustion.",
   "Mode רשת ב-AKS שבו Pods מקבלים IPs מ-CIDR overlay פרטי נפרד מה-VNet (תעבורה שיוצאת מה-cluster עוברת SNAT ל-IP של ה-node), כדי להימנע ממיצוי IPs ב-VNet.",
   "cloud-managed-k8s-compare"],
  ["Provisioned throughput", "cloud",
   "Reserved model-inference capacity bought per unit per hour (Bedrock model units, Azure PTUs, Vertex GSUs), usually with a term commitment, for predictable throughput and latency.",
   "קיבולת inference שמורה למודל שנקנית לפי יחידה לשעה (model units ב-Bedrock, PTUs ב-Azure, GSUs ב-Vertex), בדרך כלל עם התחייבות לתקופה, בשביל throughput ו-latency צפויים.",
   "cloud-ai-platforms"],
  ["TPM / RPM", "cloud",
   "Tokens per minute and requests per minute — the per-model, per-region quotas on cloud AI platforms; exceeding either returns HTTP 429.",
   "Tokens per minute ו-requests per minute — ה-quotas לכל מודל ולכל region בפלטפורמות AI בענן; חריגה מאחד מהם מחזירה HTTP 429.",
   "cloud-ai-platforms"],
  ["Batch inference", "cloud",
   "Asynchronous submission of many model requests processed within a time window (often up to 24 h) at a discount (typically ~50%) — for evals, backfills and enrichment.",
   "שליחה אסינכרונית של הרבה בקשות למודל שמעובדות בתוך חלון זמן (הרבה פעמים עד 24 שעות) בהנחה (בדרך כלל ~50%) — ל-evals, backfills והעשרה.",
   "cloud-ai-platforms"],
  ["Well-Architected Framework", "cloud",
   "Cloud providers' best-practice framework for reviewing workloads against pillars: operational excellence, security, reliability, performance, cost and (AWS/GCP) sustainability.",
   "ה-framework של ספקי הענן ל-best practices לבחינת workloads מול עמודי תווך: operational excellence, security, reliability, performance, cost ו-(ב-AWS/GCP) sustainability.",
   "cloud-well-architected"],
  ["HRI (High-Risk Issue)", "cloud",
   "A Well-Architected review finding that could soon cause a major outage, breach or cost blow-up (e.g. single-AZ DB, untested backups, admin access keys) — fix first.",
   "ממצא של Well-Architected review שעלול לגרום בקרוב ל-outage גדול, לפריצה או לפיצוץ עלויות (למשל DB ב-AZ יחיד, גיבויים שלא נבדקו, admin access keys) — מתקנים קודם.",
   "cloud-well-architected"]
].forEach(([term, track, en, he, lesson]) => INFRA.glossary.push({ term, track, def: { en, he }, lesson }));

/* ------------------------------------------------------------------ */
INFRA.scenarios.push({
  id: "sqs-poison-message",
  icon: "☠️",
  title: { en: "SQS backlog exploding: the message that never dies", he: "Backlog ב-SQS מתפוצץ: ההודעה שלא מתה" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "02:40. PagerDuty: 'orders-jobs ApproximateAgeOfOldestMessage &gt; 900 s'. The invoice-worker Lambda consumes this SQS queue (batch size 10). Customers report invoices not arriving. Here's CloudWatch:",
        he: "02:40. PagerDuty: 'orders-jobs ApproximateAgeOfOldestMessage &gt; 900 s'. ה-Lambda של invoice-worker צורך את ה-SQS queue הזה (batch size 10). לקוחות מדווחים שחשבוניות לא מגיעות. הנה CloudWatch:"
      },
      data: "Queue: orders-jobs (Standard)  VisibilityTimeout=60s  RedrivePolicy=none\n\ntime   Visible  NotVisible  AgeOfOldest  NumberOfMessagesReceived  NumberOfMessagesDeleted\n02:00     120        40         35s           2,400                    2,380\n02:15   1,950       90        410s           6,900                    1,120\n02:30   8,700       90        880s          11,400                      310\n02:40  14,200       90      1,480s          12,100                      120\n\nLambda invoice-worker: Errors 98%  Duration p99 3.1s  ConcurrentExecutions 9",
      choices: [
        { label: { en: "Raise Lambda reserved concurrency to 200 to drain the backlog faster", he: "להעלות את ה-reserved concurrency של ה-Lambda ל-200 כדי לרוקן את ה-backlog מהר יותר" }, next: "s2bad", score: 0,
          feedback: { en: "98% errors means more workers just fail faster — and hammer downstream services. Received is high, Deleted near zero: it's a processing failure, not a capacity problem.", he: "98% שגיאות אומר שעוד workers פשוט ייכשלו מהר יותר — ויפציצו שירותים במורד הזרם. Received גבוה, Deleted כמעט אפס: זו בעיית עיבוד, לא בעיית קיבולת." } },
        { label: { en: "Look at the Lambda error logs and the ApproximateReceiveCount of messages", he: "להסתכל על לוגי השגיאות של ה-Lambda ועל ה-ApproximateReceiveCount של ההודעות" }, next: "s2", score: 10,
          feedback: { en: "Right: Received ≫ Deleted with 98% errors says messages are being retried, not processed. Find out why.", he: "נכון: Received ≫ Deleted עם 98% שגיאות אומר שהודעות חוזרות על עצמן, לא מעובדות. צריך להבין למה." } }
      ]
    },
    s2bad: {
      text: { en: "Concurrency jumps to 200. Errors stay at 98%, the billing API you call starts returning 429 to <em>other</em> services, and the backlog keeps growing. Your lead asks what the error actually is.", he: "ה-concurrency קופץ ל-200. השגיאות נשארות על 98%, ה-billing API שאתה קורא לו מתחיל להחזיר 429 לשירותים <em>אחרים</em>, וה-backlog ממשיך לגדול. ה-lead שלך שואל מה השגיאה בעצם." },
      choices: [
        { label: { en: "Roll concurrency back and read the logs", he: "להחזיר את ה-concurrency לאחור ולקרוא את הלוגים" }, next: "s2", score: 3,
          feedback: { en: "Good recovery — diagnose before scaling.", he: "התאוששות טובה — מאבחנים לפני שעושים scale." } }
      ]
    },
    s2: {
      text: { en: "Logs show the same error over and over. Sampling the queue shows a handful of messages with huge receive counts.", he: "הלוגים מראים את אותה שגיאה שוב ושוב. דגימה של ה-queue מראה כמה הודעות עם receive count עצום." },
      data: "[ERROR] KeyError: 'currency'  orderId=o-77812  (schema v3 message from new checkout release 01:55)\n[ERROR] Batch failed: 1 of 10 records raised; function returned error → whole batch returned to queue\n\n$ aws sqs receive-message --queue-url $Q --attribute-names ApproximateReceiveCount --max-number-of-messages 10\n  o-77812  ApproximateReceiveCount=214\n  o-77830  ApproximateReceiveCount=198\n  o-12001  ApproximateReceiveCount=37   (valid v2 message)\n  ...",
      choices: [
        { label: { en: "Purge the queue to stop the bleeding", he: "לעשות purge ל-queue כדי לעצור את הדימום" }, next: "lose", score: 0,
          feedback: { en: "Purge deletes ~14k valid orders' invoice jobs along with the bad ones. Irreversible data loss for a problem caused by a few messages.", he: "Purge מוחק ~14 אלף jobs של חשבוניות להזמנות תקינות יחד עם הרעות. אובדן נתונים בלתי הפיך בגלל בעיה שגרמו כמה הודעות." } },
        { label: { en: "Add a DLQ with a redrive policy (maxReceiveCount 5) and enable ReportBatchItemFailures on the event source mapping", he: "להוסיף DLQ עם redrive policy (maxReceiveCount 5) ולהפעיל ReportBatchItemFailures על ה-event source mapping" }, next: "s3", score: 10,
          feedback: { en: "Exactly. Poison messages get quarantined after 5 tries, and good messages in the same batch stop being retried with them.", he: "בדיוק. Poison messages מועברות להסגר אחרי 5 ניסיונות, והודעות טובות באותו batch מפסיקות לחזור יחד איתן." } },
        { label: { en: "Increase the visibility timeout to 12 hours so the bad messages stay hidden", he: "להגדיל את ה-visibility timeout ל-12 שעות כדי שההודעות הרעות יישארו מוסתרות" }, next: "s3meh", score: 2,
          feedback: { en: "It hides the symptom and also delays every legitimate retry by 12 h. The poison messages will be back.", he: "זה מסתיר את הסימפטום וגם מעכב כל retry לגיטימי ב-12 שעות. ה-poison messages יחזרו." } }
      ]
    },
    s3meh: {
      text: { en: "The backlog drains a bit, but the first transient DB error now delays those invoices by 12 hours, and at 14:40 the poison messages reappear. You need a real fix.", he: "ה-backlog מתרוקן קצת, אבל שגיאת DB חולפת ראשונה מעכבת עכשיו את החשבוניות האלה ב-12 שעות, וב-14:40 ה-poison messages חוזרות. צריך תיקון אמיתי." },
      choices: [
        { label: { en: "Revert the timeout; add a DLQ + ReportBatchItemFailures", he: "להחזיר את ה-timeout; להוסיף DLQ + ReportBatchItemFailures" }, next: "s3", score: 4,
          feedback: { en: "Now you're on the right path.", he: "עכשיו אתה בדרך הנכונה." } }
      ]
    },
    s3: {
      text: { en: "With the DLQ and partial batch responses in place, metrics recover within 20 minutes. The DLQ now holds 312 messages — all schema v3 from the new checkout release.", he: "עם ה-DLQ וה-partial batch responses, ה-metrics מתאוששים בתוך 20 דקות. ב-DLQ יש עכשיו 312 הודעות — כולן schema v3 מה-release החדש של ה-checkout." },
      data: "03:05  Visible 14,100  Deleted/min 3,900  Errors 2%\n03:25  Visible     40  AgeOfOldest 12s\norders-jobs-dlq: ApproximateNumberOfMessagesVisible = 312",
      choices: [
        { label: { en: "Redrive the DLQ back to the main queue right away", he: "לעשות redrive ל-DLQ בחזרה ל-queue הראשי מיד" }, next: "s4bad", score: 0,
          feedback: { en: "The worker still can't parse v3 — they'll fail 5 more times and come straight back to the DLQ.", he: "ה-worker עדיין לא יודע לפרסר v3 — הן ייכשלו עוד 5 פעמים ויחזרו ישר ל-DLQ." } },
        { label: { en: "Ship a worker fix that handles v3 (default currency from the order record), add a DLQ-depth alarm, then redrive", he: "לעשות deploy לתיקון ב-worker שמטפל ב-v3 (currency ברירת מחדל מרשומת ההזמנה), להוסיף alarm על עומק ה-DLQ, ואז redrive" }, next: "s4", score: 10,
          feedback: { en: "Fix first, then redrive — and make sure the next poison message pages someone.", he: "קודם תיקון, אחר כך redrive — ולוודא שה-poison message הבא יעיר מישהו." } }
      ]
    },
    s4bad: {
      text: { en: "312 messages bounce back to the DLQ within minutes. Nothing lost, but nothing gained either.", he: "312 הודעות חוזרות ל-DLQ בתוך דקות. שום דבר לא אבד, אבל גם לא הרווחת כלום." },
      choices: [
        { label: { en: "Fix the worker first, then redrive", he: "לתקן קודם את ה-worker, ואז redrive" }, next: "s4", score: 3,
          feedback: { en: "Correct order.", he: "הסדר הנכון." } }
      ]
    },
    s4: {
      text: { en: "The fix is deployed. You run the redrive and verify idempotency: invoice creation uses orderId as an idempotency key, so the messages that partially ran earlier won't double-bill.", he: "התיקון ב-deploy. אתה מריץ redrive ומוודא אידמפוטנטיות: יצירת חשבונית משתמשת ב-orderId כ-idempotency key, אז הודעות שרצו חלקית קודם לא יחייבו פעמיים." },
      data: "$ aws sqs start-message-move-task --source-arn arn:aws:sqs:eu-west-1:111122223333:orders-jobs-dlq\n{ \"TaskHandle\": \"eyJ0YXNr...\" }\n$ aws sqs list-message-move-tasks --source-arn arn:aws:sqs:eu-west-1:111122223333:orders-jobs-dlq\n  Status: COMPLETED  ApproximateNumberOfMessagesMoved: 312\norders-jobs-dlq visible: 0   invoice-worker Errors: 0%",
      choices: [
        { label: { en: "Close the incident and write the post-incident review: schema contract tests between checkout and worker, DLQ on every queue, DLQ alarms", he: "לסגור את ה-incident ולכתוב post-incident review: contract tests ל-schema בין ה-checkout ל-worker, DLQ על כל queue, alarms על DLQs" }, next: "win", score: 10,
          feedback: { en: "That closes the loop on the root cause (an unversioned schema change) and on the missing safety net.", he: "זה סוגר את המעגל גם על שורש הבעיה (שינוי schema בלי versioning) וגם על רשת הביטחון שחסרה." } },
        { label: { en: "Close the incident; it's fixed", he: "לסגור את ה-incident; זה תוקן" }, next: "win", score: 5,
          feedback: { en: "Fixed for now — but without contract tests the next schema change does it again.", he: "תוקן לעכשיו — אבל בלי contract tests שינוי ה-schema הבא יעשה את זה שוב." } }
      ]
    },
    win: {
      text: { en: "Invoices are flowing, no order was lost or double-billed, and every queue now has a DLQ with an alarm. A poison message is a quarantine problem, not a scaling problem.", he: "החשבוניות זורמות, אף הזמנה לא אבדה או חויבה פעמיים, ולכל queue יש עכשיו DLQ עם alarm. Poison message זו בעיית הסגר, לא בעיית scaling." },
      end: "win"
    },
    lose: {
      text: { en: "The purge wiped 14,200 jobs. Finance spends two days rebuilding invoices from the orders DB, and the poison messages return with the next checkout publish because nothing was fixed. Lesson: quarantine with a DLQ, never purge a queue holding valid work.", he: "ה-purge מחק 14,200 jobs. הכספים מבזבזים יומיים על בנייה מחדש של חשבוניות מה-DB של ההזמנות, וה-poison messages חוזרות עם ה-publish הבא של ה-checkout כי שום דבר לא תוקן. הלקח: להעביר להסגר עם DLQ, אף פעם לא לעשות purge ל-queue שמחזיק עבודה תקינה." },
      end: "lose"
    }
  },
  lessons: ["cloud-event-services", "arch-queues", "cloud-serverless"]
});
