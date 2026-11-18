window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Series: Plan a product's infrastructure end to end (track: principal).
   Hub lesson (blueprint) + cloud choice, environments & namespaces,
   data stores, global traffic, failure & SLA, and a design simulator.
   ========================================================================= */

INFRA.lessons.push({
  id: "plan-product-infra-blueprint",
  track: "principal",
  order: 180,
  icon: "🗺️",
  level: 3,
  minutes: 22,
  title: {
    en: "Plan a Product's Infrastructure End to End: the Decision Blueprint",
    he: "לתכנן תשתית למוצר מקצה לקצה: מפת ההחלטות"
  },
  tldr: {
    en: "Infra planning is a sequence of about 12 decisions, each driven by numbers from the one before: requirements → cloud → accounts & environments → network & traffic → compute → data → observability → reliability & DR → security → cost. Make each one with explicit criteria, write it down as an ADR, and note what would make you change it.",
    he: "תכנון תשתית הוא רצף של בערך 12 החלטות, וכל אחת נשענת על המספרים של הקודמת: דרישות ← ענן ← accounts וסביבות ← רשת ו-traffic ← compute ← data ← observability ← reliability ו-DR ← security ← עלות. כל החלטה מקבלים עם קריטריונים מפורשים, כותבים אותה כ-ADR, ורושמים מה יגרום לך לשנות אותה."
  },
  analogy: {
    en: "Planning infra is like planning a new city before anyone moves in. You don't start by picking the brand of traffic lights. You first ask how many people will live there and where they commute (requirements), then pick the land (cloud and regions), zone it into districts (accounts, environments, namespaces), lay roads and highways (network, global traffic), build utilities (compute, databases), put in a fire department and backup power (monitoring, DR), and only then argue about the traffic lights. Every choice limits the next one, and some, like where the river runs (where your data lives), are almost impossible to move later.",
    he: "לתכנן תשתית זה כמו לתכנן עיר חדשה לפני שמישהו גר בה. לא מתחילים מבחירת המותג של הרמזורים. קודם שואלים כמה אנשים יגורו בה ולאן הם נוסעים (דרישות), בוחרים את הקרקע (ענן ו-region-ים), מחלקים לשכונות (accounts, סביבות, namespaces), סוללים כבישים ומחלפים (רשת, traffic גלובלי), בונים תשתיות מים וחשמל (compute, databases), מקימים מכבי אש וגנרטורים (monitoring, DR), ורק אז מתווכחים על הרמזורים. כל בחירה מגבילה את הבאה, ויש בחירות, כמו איפה עובר הנהר (איפה ה-data שלך יושב), שכמעט אי אפשר להזיז אחר כך."
  },
  sections: [
    {
      h: { en: "The method: how every infra decision is made", he: "השיטה: איך מקבלים כל החלטת תשתית" },
      body: {
        en: `<p>Whether the question is "Azure or GCP?", "Cassandra or Postgres?" or "one cluster or five?", the same seven steps apply. Once you have the habit, you don't need anyone to tell you the answer; you need the numbers.</p>
<ol>
<li><strong>Requirement</strong>: what must be true, in numbers? ("p99 send-message &lt; 300 ms for EU users", "lose at most 5 minutes of uploads".)</li>
<li><strong>Hard constraints</strong>: what rules options out before scoring? Data residency, compliance (SOC 2, ISO 27001, HIPAA, DORA), an existing contract, a deadline, team size. Constraints are filters, not weights.</li>
<li><strong>Options</strong>: 2-4 real candidates, always including "the boring default" and "do nothing / defer".</li>
<li><strong>Criteria with weights</strong>: 4-7 criteria, weights add to 100, agreed <em>before</em> scoring so nobody reverse-engineers the weights to fit a favourite.</li>
<li><strong>Evidence</strong>: a spike, a load test, a pricing quote, a reference customer. A one-week proof of concept beats a month of debate.</li>
<li><strong>Decision + ADR</strong>: write context, options, decision, consequences. One page.</li>
<li><strong>Reversibility and revisit trigger</strong>: is this a one-way door (data store, cloud, region, ID format) or a two-way door (monitoring vendor, CI tool, instance type)? Write the trigger that reopens it: "if writes exceed 20k/s", "if the Datadog bill passes $40k/month".</li>
</ol>
<pre>ADR-007: Message store
Status: accepted (2026-03-02)
Context: 2B messages/day, 23k writes/s avg, 70k peak; read = "last 50 in chat";
         EU data must stay in EU; team of 5 SREs, no DBA.
Options: (A) sharded Postgres  (B) ScyllaDB Cloud  (C) Cassandra self-hosted  (D) Bigtable
Criteria (weight): write scale 30, ops load 25, cost 20, residency 15, team skill 10
Decision: (B) ScyllaDB Cloud, keyed by (chat_id, bucket), RF=3 per region
Consequences: no cross-chat joins; search goes to a separate index;
              we accept vendor dependency for the managed control plane.
Revisit if: managed cost &gt; 2x self-hosted estimate, or we need cross-region strong consistency.</pre>
<blockquote>💡 Real world: Amazon calls this one-way vs two-way doors. Spend days on one-way doors and minutes on two-way doors. Most teams do the opposite: they argue for weeks about the log shipper and pick the database on a Friday afternoon.</blockquote>`,
        he: `<p>לא משנה אם השאלה היא "Azure או GCP?", "Cassandra או Postgres?" או "cluster אחד או חמישה?", אותם שבעה שלבים חלים. כשזה נהיה הרגל, אתה לא צריך שמישהו יגיד לך את התשובה; אתה צריך את המספרים.</p>
<ol>
<li><strong>דרישה</strong>: מה חייב להיות נכון, במספרים? ("p99 של שליחת הודעה מתחת ל-300 ms למשתמשים ב-EU", "לאבד לכל היותר 5 דקות של uploads".)</li>
<li><strong>אילוצים קשיחים</strong>: מה פוסל אפשרויות עוד לפני הניקוד? data residency, רגולציה (SOC 2, ISO 27001, HIPAA, DORA), חוזה קיים, deadline, גודל הצוות. אילוצים הם פילטרים, לא משקלות.</li>
<li><strong>אפשרויות</strong>: 2-4 מועמדים אמיתיים, ותמיד כולל "ברירת המחדל המשעממת" ו"לא לעשות כלום / לדחות".</li>
<li><strong>קריטריונים עם משקלות</strong>: 4-7 קריטריונים, המשקלות מסתכמים ב-100, ומסכימים עליהם <em>לפני</em> הניקוד, כדי שאף אחד לא יכוון את המשקלות לטובת המועמד שהוא אוהב.</li>
<li><strong>ראיות</strong>: spike, load test, הצעת מחיר, לקוח רפרנס. proof of concept של שבוע עדיף על חודש של ויכוחים.</li>
<li><strong>החלטה + ADR</strong>: כותבים הקשר, אפשרויות, החלטה, השלכות. עמוד אחד.</li>
<li><strong>הפיכות ו-trigger לבדיקה מחדש</strong>: זו דלת חד-כיוונית (data store, ענן, region, פורמט של ID) או דו-כיוונית (ספק monitoring, כלי CI, סוג instance)? כותבים מה יפתח את ההחלטה מחדש: "אם הכתיבות עוברות 20k/s", "אם החשבון של Datadog עובר 40k$ בחודש".</li>
</ol>
<pre>ADR-007: Message store
Status: accepted (2026-03-02)
Context: 2B messages/day, 23k writes/s avg, 70k peak; read = "last 50 in chat";
         EU data must stay in EU; team of 5 SREs, no DBA.
Options: (A) sharded Postgres  (B) ScyllaDB Cloud  (C) Cassandra self-hosted  (D) Bigtable
Criteria (weight): write scale 30, ops load 25, cost 20, residency 15, team skill 10
Decision: (B) ScyllaDB Cloud, keyed by (chat_id, bucket), RF=3 per region
Consequences: no cross-chat joins; search goes to a separate index;
              we accept vendor dependency for the managed control plane.
Revisit if: managed cost &gt; 2x self-hosted estimate, or we need cross-region strong consistency.</pre>
<blockquote>💡 מהשטח: ב-Amazon קוראים לזה דלתות חד-כיווניות מול דו-כיווניות. על דלת חד-כיוונית משקיעים ימים, על דו-כיוונית דקות. רוב הצוותים עושים הפוך: מתווכחים שבועות על ה-log shipper ובוחרים database ביום שישי אחר הצהריים.</blockquote>`
      }
    },
    {
      h: { en: "The 12 decisions, in order (and where each one is taught)", he: "12 ההחלטות, לפי הסדר (ואיפה כל אחת נלמדת)" },
      body: {
        en: `<p>The order matters because each decision consumes the outputs of the previous ones. Picking a database before you know your consistency needs, or a DR strategy before you know your tiers, is how plans get redone.</p>
<table>
<tr><th>#</th><th>Decision</th><th>Key question</th><th>Main output</th><th>Go deeper</th></tr>
<tr><td>1</td><td>Requirements &amp; numbers</td><td>Who, how many, how fast, how consistent, where?</td><td>QPS, storage/year, latency targets, residency map</td><td><a href="#/lesson/pr-architect-questions">questions</a>, <a href="#/lesson/rel-capacity-planning">capacity</a></td></tr>
<tr><td>2</td><td>SLOs &amp; tiers</td><td>Which user journeys matter most, and how reliable must each be?</td><td>SLO per journey, tier 0-3 per service</td><td><a href="#/lesson/plan-failure-sla">failure &amp; SLA</a></td></tr>
<tr><td>3</td><td>Cloud(s) &amp; regions</td><td>Which provider, which regions, single or multi-cloud?</td><td>Provider ADR, region list</td><td><a href="#/lesson/plan-cloud-selection">cloud choice</a></td></tr>
<tr><td>4</td><td>Accounts, environments, namespaces</td><td>Where are the isolation boundaries?</td><td>Org/account tree, env list, namespace scheme</td><td><a href="#/lesson/plan-environments-namespaces">environments</a></td></tr>
<tr><td>5</td><td>Network</td><td>CIDR plan, hub-spoke or not, private connectivity, egress</td><td>IP plan, VPC/VNet layout</td><td><a href="#/lesson/cloud-landing-zones">landing zones</a></td></tr>
<tr><td>6</td><td>Global traffic</td><td>How does a user reach the right region, and how do we fail over?</td><td>DNS/anycast/CDN design, health checks</td><td><a href="#/lesson/plan-global-traffic">global traffic</a></td></tr>
<tr><td>7</td><td>Compute</td><td>Kubernetes, serverless containers, functions, VMs?</td><td>Runtime per workload, cluster layout</td><td><a href="#/lesson/cloud-big3-services-compare">services compare</a></td></tr>
<tr><td>8</td><td>Data stores</td><td>Which store per entity, managed or self-hosted?</td><td>Store per access pattern, replication plan</td><td><a href="#/lesson/plan-data-store-selection">data stores</a></td></tr>
<tr><td>9</td><td>Async &amp; integration</td><td>Queues, streams, events, sync vs async</td><td>Kafka/PubSub/SQS choice, contracts</td><td><a href="#/lesson/staff-multi-region-data">multi-region data</a></td></tr>
<tr><td>10</td><td>Observability</td><td>What do we measure, alert on, and which stack?</td><td>Golden signals, alert policy, vendor ADR</td><td><a href="#/lesson/pr-observability-plan">day-1 plan</a>, <a href="#/lesson/obs-datadog-victoriametrics">stack choice</a></td></tr>
<tr><td>11</td><td>Reliability, DR, testing</td><td>What fails, what's the blast radius, how do we prove recovery?</td><td>FMEA, DR runbooks, test calendar</td><td><a href="#/lesson/rel-bcdr">BCDR</a>, <a href="#/lesson/staff-cells-blast-radius">cells</a></td></tr>
<tr><td>12</td><td>Security &amp; cost</td><td>Identity, secrets, encryption, budget and unit cost</td><td>Threat model, cost model per user</td><td><a href="#/lesson/staff-design-docs">design docs</a></td></tr>
</table>
<blockquote>⚠️ Production tip: decisions 1 and 2 are the ones people skip, and they are the ones that make every later debate short. "Do we need multi-region active-active?" is a 3-hour argument without an SLO and a 3-minute one with it.</blockquote>`,
        he: `<p>הסדר חשוב כי כל החלטה צורכת את התוצרים של הקודמות. לבחור database לפני שאתה יודע מה דרישות ה-consistency, או אסטרטגיית DR לפני שיש tiers, זו הדרך שבה תוכניות נכתבות פעמיים.</p>
<table>
<tr><th>#</th><th>החלטה</th><th>שאלת המפתח</th><th>תוצר עיקרי</th><th>להעמקה</th></tr>
<tr><td>1</td><td>דרישות ומספרים</td><td>מי, כמה, כמה מהר, כמה consistent, איפה?</td><td>QPS, storage לשנה, יעדי latency, מפת residency</td><td><a href="#/lesson/pr-architect-questions">שאלות</a>, <a href="#/lesson/rel-capacity-planning">capacity</a></td></tr>
<tr><td>2</td><td>SLO-ים ו-tiers</td><td>אילו user journeys הכי חשובים, וכמה אמין כל אחד צריך להיות?</td><td>SLO לכל journey, tier 0-3 לכל שירות</td><td><a href="#/lesson/plan-failure-sla">כשלים ו-SLA</a></td></tr>
<tr><td>3</td><td>ענן ו-regions</td><td>איזה ספק, אילו region-ים, ענן אחד או כמה?</td><td>ADR של ספק, רשימת region-ים</td><td><a href="#/lesson/plan-cloud-selection">בחירת ענן</a></td></tr>
<tr><td>4</td><td>Accounts, סביבות, namespaces</td><td>איפה גבולות הבידוד?</td><td>עץ org/accounts, רשימת סביבות, שיטת namespaces</td><td><a href="#/lesson/plan-environments-namespaces">סביבות</a></td></tr>
<tr><td>5</td><td>רשת</td><td>תוכנית CIDR, hub-spoke או לא, חיבור פרטי, egress</td><td>תוכנית IP, מבנה VPC/VNet</td><td><a href="#/lesson/cloud-landing-zones">landing zones</a></td></tr>
<tr><td>6</td><td>Traffic גלובלי</td><td>איך משתמש מגיע ל-region הנכון, ואיך עושים failover?</td><td>תכנון DNS/anycast/CDN, health checks</td><td><a href="#/lesson/plan-global-traffic">traffic גלובלי</a></td></tr>
<tr><td>7</td><td>Compute</td><td>Kubernetes, serverless containers, functions, VMs?</td><td>runtime לכל workload, מבנה cluster-ים</td><td><a href="#/lesson/cloud-big3-services-compare">השוואת שירותים</a></td></tr>
<tr><td>8</td><td>Data stores</td><td>איזה store לכל ישות, managed או self-hosted?</td><td>store לכל access pattern, תוכנית replication</td><td><a href="#/lesson/plan-data-store-selection">data stores</a></td></tr>
<tr><td>9</td><td>אסינכרוני ואינטגרציה</td><td>Queues, streams, events, sync מול async</td><td>בחירת Kafka/PubSub/SQS, חוזים</td><td><a href="#/lesson/staff-multi-region-data">data ב-multi-region</a></td></tr>
<tr><td>10</td><td>Observability</td><td>מה מודדים, על מה מתריעים, ובאיזה stack?</td><td>Golden signals, מדיניות alerts, ADR של ספק</td><td><a href="#/lesson/pr-observability-plan">תוכנית יום 1</a>, <a href="#/lesson/obs-datadog-victoriametrics">בחירת stack</a></td></tr>
<tr><td>11</td><td>Reliability, DR, בדיקות</td><td>מה נופל, מה ה-blast radius, ואיך מוכיחים שמתאוששים?</td><td>FMEA, runbooks ל-DR, לוח בדיקות</td><td><a href="#/lesson/rel-bcdr">BCDR</a>, <a href="#/lesson/staff-cells-blast-radius">cells</a></td></tr>
<tr><td>12</td><td>Security ועלות</td><td>Identity, secrets, הצפנה, תקציב ועלות ליחידה</td><td>Threat model, מודל עלות למשתמש</td><td><a href="#/lesson/staff-design-docs">design docs</a></td></tr>
</table>
<blockquote>⚠️ טיפ מה-production: החלטות 1 ו-2 הן אלה שמדלגים עליהן, והן בדיוק אלה שמקצרות כל ויכוח בהמשך. "צריך multi-region active-active?" זה ויכוח של 3 שעות בלי SLO, ושל 3 דקות איתו.</blockquote>`
      }
    },
    {
      h: { en: "Same questions, different answers: Drive vs WhatsApp vs Netflix", he: "אותן שאלות, תשובות שונות: Drive מול WhatsApp מול Netflix" },
      body: {
        en: `<p>The trick is to find what <em>dominates</em> each product. That one dimension drives most of the infra decisions; the rest can be boring defaults. The numbers below are planning-scale assumptions for a large product, not any company's real figures.</p>
<table>
<tr><th></th><th>Drive-like (files)</th><th>WhatsApp-like (messaging)</th><th>Netflix-like (video)</th></tr>
<tr><td>What dominates</td><td>Storage size &amp; durability, metadata consistency</td><td>Connections &amp; write rate, delivery latency</td><td>Egress bandwidth, read-heavy catalog</td></tr>
<tr><td>Planning numbers</td><td>100M users × 5 GB = 500 PB raw; metadata ~50k QPS</td><td>200M DAU, 2B msgs/day ≈ 23k/s avg, ~70k/s peak; 50M concurrent sockets</td><td>20M concurrent streams × 5 Mbps = 100 Tbps peak</td></tr>
<tr><td>Consistency</td><td>Strong for metadata (rename, share, ACL); blobs immutable</td><td>Per-chat ordering; eventual across devices is fine</td><td>Eventual almost everywhere; strong for billing</td></tr>
<tr><td>Data store core</td><td>Distributed SQL / sharded Postgres + object storage</td><td>Wide-column (Cassandra/Scylla) + Redis for presence</td><td>Cassandra + cache tier + object storage</td></tr>
<tr><td>Global traffic</td><td>Global L7 LB for API; direct resumable uploads to regional buckets</td><td>Anycast/GeoDNS to regional edge holding long-lived TCP/WebSocket</td><td>CDN serves ~95%+ of bytes; API via regional LB</td></tr>
<tr><td>Hard failure</td><td>Losing or corrupting a file (RPO≈0 for metadata)</td><td>Region loss drops millions of sockets → reconnect storm</td><td>Control plane down = nobody can press Play</td></tr>
<tr><td>Cost driver</td><td>Storage tiers (hot/cool/archive), dedup</td><td>Compute per connection, cross-region replication</td><td>CDN/egress; encoding compute</td></tr>
<tr><td>DR style</td><td>Multi-region metadata, geo-redundant objects</td><td>Active-active per region, users homed to region</td><td>Active-active across 3+ regions, evacuate a region in minutes</td></tr>
</table>
<blockquote>💡 Real world: the answer "it depends" is fine only if you immediately say <em>on what</em>. "For Drive I'd pay for strong metadata consistency because a lost share permission is a security incident; for WhatsApp I'd give that up for write throughput because per-chat ordering is enough."</blockquote>`,
        he: `<p>הטריק הוא למצוא מה <em>שולט</em> בכל מוצר. הממד הזה מכתיב את רוב החלטות התשתית; כל השאר יכול להיות ברירות מחדל משעממות. המספרים למטה הם הנחות תכנון למוצר גדול, לא נתונים אמיתיים של חברה מסוימת.</p>
<table>
<tr><th></th><th>דמוי Drive (קבצים)</th><th>דמוי WhatsApp (הודעות)</th><th>דמוי Netflix (וידאו)</th></tr>
<tr><td>מה שולט</td><td>נפח storage ו-durability, consistency של metadata</td><td>חיבורים וקצב כתיבה, latency של מסירה</td><td>רוחב פס ל-egress, catalog עם הרבה קריאות</td></tr>
<tr><td>מספרי תכנון</td><td>100M משתמשים × 5 GB = 500 PB גולמי; metadata בערך 50k QPS</td><td>200M DAU, 2B הודעות ביום ≈ 23k/s בממוצע, בערך 70k/s בשיא; 50M sockets במקביל</td><td>20M streams במקביל × 5 Mbps = 100 Tbps בשיא</td></tr>
<tr><td>Consistency</td><td>Strong ל-metadata (rename, share, ACL); ה-blobs immutable</td><td>סדר בתוך שיחה; eventual בין מכשירים זה בסדר</td><td>Eventual כמעט בכל מקום; strong ל-billing</td></tr>
<tr><td>ליבת ה-data</td><td>Distributed SQL או Postgres עם sharding + object storage</td><td>Wide-column (Cassandra/Scylla) + Redis ל-presence</td><td>Cassandra + שכבת cache + object storage</td></tr>
<tr><td>Traffic גלובלי</td><td>Global L7 LB ל-API; uploads ישירים ו-resumable ל-buckets אזוריים</td><td>Anycast או GeoDNS ל-edge אזורי שמחזיק TCP/WebSocket ארוכים</td><td>ה-CDN מגיש 95%+ מה-bytes; ה-API דרך LB אזורי</td></tr>
<tr><td>הכשל הקשה</td><td>לאבד או להשחית קובץ (RPO≈0 ל-metadata)</td><td>נפילת region מנתקת מיליוני sockets ← סערת reconnect</td><td>Control plane למטה = אף אחד לא יכול ללחוץ Play</td></tr>
<tr><td>מה מניע עלות</td><td>שכבות storage (hot/cool/archive), dedup</td><td>Compute לכל חיבור, replication בין region-ים</td><td>CDN ו-egress; compute ל-encoding</td></tr>
<tr><td>סגנון DR</td><td>Metadata ב-multi-region, objects גיאו-רדונדנטיים</td><td>Active-active לכל region, משתמשים "גרים" ב-region</td><td>Active-active על 3+ region-ים, לפנות region בדקות</td></tr>
</table>
<blockquote>💡 מהשטח: התשובה "תלוי" בסדר רק אם מיד אחריה אתה אומר <em>במה</em>. "ב-Drive הייתי משלם על strong consistency ל-metadata, כי הרשאת שיתוף שאבדה היא אירוע אבטחה; ב-WhatsApp הייתי מוותר על זה בשביל throughput של כתיבות, כי סדר בתוך שיחה מספיק."</blockquote>`
      }
    },
    {
      h: { en: "Worked mini-decisions: the debates you'll actually have", he: "מיני-החלטות לדוגמה: הוויכוחים שבאמת יהיו לך" },
      body: {
        en: `<p>Each row is a real debate with the criterion that usually settles it. Learn the deciding question, not the answer.</p>
<table>
<tr><th>Debate</th><th>The question that decides it</th><th>Typical outcome</th></tr>
<tr><td>Azure vs GCP vs AWS</td><td>Which managed services do we <em>need</em> that only one does well, and what does the enterprise agreement already pay for?</td><td>Default to where identity, contracts and skills are; switch only for a service gap that would cost more than the switching cost.</td></tr>
<tr><td>Multi-cloud?</td><td>Is there a regulator, customer or M&amp;A reason, or just fear?</td><td>Single cloud, multi-region, with portable building blocks. Multi-cloud for specific workloads only.</td></tr>
<tr><td>One cluster or many?</td><td>What's the blast radius of a bad upgrade or a noisy tenant?</td><td>One cluster per env per region; split prod further only for compliance or scale.</td></tr>
<tr><td>Namespace per team or per service?</td><td>Who owns quotas and on-call?</td><td>Per team-service (<code>payments-api</code>), labelled with team and tier.</td></tr>
<tr><td>Postgres or a NoSQL store?</td><td>Is the write rate or the data size beyond one well-tuned primary, and are queries known in advance?</td><td>Postgres until measured otherwise; wide-column for huge known-pattern writes.</td></tr>
<tr><td>Managed DB or self-hosted?</td><td>Do we have people who want to be paged for this DB at 3 AM?</td><td>Managed, unless cost at scale is 2-3x and you have a DB team.</td></tr>
<tr><td>DNS failover or anycast LB?</td><td>How fast must failover be, and do clients cache DNS badly?</td><td>Anycast L7 for HTTP APIs; DNS policies for non-HTTP or cross-cloud.</td></tr>
<tr><td>Datadog vs Prometheus/Grafana vs cloud-native?</td><td>Team size vs bill: who operates it, and what's the cost per host and per GB?</td><td>SaaS when small; self-hosted (VictoriaMetrics/Mimir + Grafana) when the bill outgrows a salary.</td></tr>
<tr><td>Active-active or warm standby?</td><td>What's the RTO in the SLO, and can the data model handle concurrent writers?</td><td>Tier 0 active-active; tier 1 warm standby; tier 2-3 backup &amp; restore.</td></tr>
</table>
<blockquote>⚠️ Production tip: "We switched from Azure to GCP after three months" is a fine story if it happened before production data existed. Data gravity is the real lock-in: moving 500 TB out costs egress (roughly $0.05-0.09/GB list price, so $25k-45k) plus weeks of dual-running. Decide cloud before the data lands.</blockquote>`,
        he: `<p>כל שורה היא ויכוח אמיתי, עם הקריטריון שבדרך כלל מכריע אותו. תלמד את השאלה שמכריעה, לא את התשובה.</p>
<table>
<tr><th>ויכוח</th><th>השאלה שמכריעה</th><th>התוצאה הנפוצה</th></tr>
<tr><td>Azure מול GCP מול AWS</td><td>אילו managed services אנחנו <em>צריכים</em> שרק אחד עושה טוב, ומה ה-enterprise agreement כבר משלם עליו?</td><td>ברירת מחדל: איפה שה-identity, החוזים והידע כבר נמצאים; עוברים רק בגלל פער בשירות שיעלה יותר מהמעבר עצמו.</td></tr>
<tr><td>Multi-cloud?</td><td>יש סיבה של רגולטור, לקוח או מיזוג, או שזה רק פחד?</td><td>ענן אחד, multi-region, עם אבני בניין ניידות. Multi-cloud רק ל-workloads ספציפיים.</td></tr>
<tr><td>Cluster אחד או הרבה?</td><td>מה ה-blast radius של upgrade גרוע או tenant רועש?</td><td>Cluster אחד לכל סביבה בכל region; מפצלים את prod רק בגלל רגולציה או scale.</td></tr>
<tr><td>Namespace לכל צוות או לכל שירות?</td><td>מי אחראי על quotas ועל on-call?</td><td>לפי צוות-שירות (<code>payments-api</code>), עם labels של צוות ו-tier.</td></tr>
<tr><td>Postgres או NoSQL?</td><td>קצב הכתיבה או נפח ה-data עוברים primary אחד מכויל היטב, והשאילתות ידועות מראש?</td><td>Postgres עד שמדדת אחרת; wide-column לכתיבות ענקיות עם patterns ידועים.</td></tr>
<tr><td>DB מנוהל או self-hosted?</td><td>יש לנו אנשים שרוצים לקבל page על ה-DB הזה ב-3 בלילה?</td><td>מנוהל, אלא אם העלות ב-scale היא פי 2-3 ויש לך צוות DB.</td></tr>
<tr><td>DNS failover או anycast LB?</td><td>כמה מהר ה-failover חייב להיות, והאם ה-clients עושים cache גרוע ל-DNS?</td><td>Anycast L7 ל-HTTP APIs; מדיניות DNS ל-non-HTTP או בין עננים.</td></tr>
<tr><td>Datadog מול Prometheus/Grafana מול cloud-native?</td><td>גודל צוות מול חשבון: מי מתפעל, ומה העלות ל-host ול-GB?</td><td>SaaS כשקטנים; self-hosted (VictoriaMetrics/Mimir + Grafana) כשהחשבון עובר משכורת.</td></tr>
<tr><td>Active-active או warm standby?</td><td>מה ה-RTO ב-SLO, והאם מודל ה-data מסתדר עם כמה כותבים במקביל?</td><td>Tier 0 ב-active-active; tier 1 ב-warm standby; tier 2-3 ב-backup ו-restore.</td></tr>
</table>
<blockquote>⚠️ טיפ מה-production: "עברנו מ-Azure ל-GCP אחרי שלושה חודשים" זה סיפור טוב אם זה קרה לפני שהיה data של production. Data gravity הוא ה-lock-in האמיתי: להוציא 500 TB עולה egress (בערך 0.05-0.09$ ל-GB במחירון, כלומר 25k-45k$) ועוד שבועות של הרצה כפולה. מחליטים על ענן לפני שה-data נוחת.</blockquote>`
      }
    },
    {
      h: { en: "The plan's deliverables: what 'done planning' looks like", he: "התוצרים של התוכנית: איך נראה 'סיימנו לתכנן'" },
      body: {
        en: `<p>A plan is finished when someone who wasn't in the room can build and operate the system from the documents. That's also exactly what replaces "asking someone": the reasoning is written down.</p>
<ul>
<li><strong>Requirements sheet</strong>: users per region, QPS avg/peak, storage growth, latency per journey, residency rules.</li>
<li><strong>SLO doc</strong>: 3-6 user journeys, SLI definitions, targets, error budget policy, tier per service.</li>
<li><strong>ADR log</strong>: one ADR per one-way door (cloud, regions, data stores, ID scheme, tenancy model, traffic design).</li>
<li><strong>Architecture diagram</strong>: per region and global, with the failure domains drawn (zones, regions, cells).</li>
<li><strong>Capacity &amp; cost model</strong>: a spreadsheet from users → QPS → nodes/storage → $/month and $ per 1k users. Recompute it when traffic doubles.</li>
<li><strong>FMEA + DR plan</strong>: failure modes, detection, mitigation, owner; RPO/RTO per tier; runbooks.</li>
<li><strong>Test calendar</strong>: load test before launch, monthly restore test, quarterly DR drill / game day.</li>
<li><strong>Production readiness review</strong>: checklist each service passes before taking traffic (alerts, dashboards, runbook, on-call, backups verified, limits, rollback tested).</li>
</ul>
<pre>Capacity model (Drive-like, first year)
users            10M  (40% EU, 35% US, 25% IL/APAC)
avg storage/user 2 GB      -&gt; 20 PB logical, 1.4x after dedup/EC overhead -&gt; 28 PB raw
metadata QPS     10M * 50 ops/day / 86400 = ~5.8k avg, x5 peak = ~29k
uploads          10M * 3 files/day * 4 MB / 86400 = ~1.4 GB/s avg ingress
egress           ~2x ingress (downloads, previews) = ~2.8 GB/s
object storage   28 PB * ~$0.01/GB-month (cool/archive mix) ~= $280k/month
cost per user    ~$0.035/month storage -&gt; pricing must cover it with margin</pre>`,
        he: `<p>תוכנית גמורה כשמי שלא היה בחדר יכול לבנות ולתפעל את המערכת מהמסמכים. זה גם בדיוק מה שמחליף את "לשאול מישהו": ההיגיון כתוב.</p>
<ul>
<li><strong>דף דרישות</strong>: משתמשים לכל region, QPS ממוצע ושיא, גידול ב-storage, latency לכל journey, חוקי residency.</li>
<li><strong>מסמך SLO</strong>: 3-6 user journeys, הגדרות SLI, יעדים, error budget policy, tier לכל שירות.</li>
<li><strong>יומן ADR</strong>: ADR לכל דלת חד-כיוונית (ענן, region-ים, data stores, שיטת ID, מודל tenancy, תכנון traffic).</li>
<li><strong>דיאגרמת ארכיטקטורה</strong>: לכל region וגלובלית, עם ה-failure domains מצוירים (zones, regions, cells).</li>
<li><strong>מודל capacity ועלות</strong>: גיליון ממשתמשים ← QPS ← nodes ו-storage ← $ לחודש ו-$ לכל 1k משתמשים. מחשבים מחדש כשה-traffic מכפיל את עצמו.</li>
<li><strong>FMEA + תוכנית DR</strong>: מצבי כשל, זיהוי, mitigation, בעלים; RPO/RTO לכל tier; runbooks.</li>
<li><strong>לוח בדיקות</strong>: load test לפני launch, בדיקת restore חודשית, DR drill או game day רבעוני.</li>
<li><strong>Production readiness review</strong>: checklist שכל שירות עובר לפני שהוא מקבל traffic (alerts, dashboards, runbook, on-call, backups שנבדקו, limits, rollback שנבדק).</li>
</ul>
<pre>Capacity model (Drive-like, first year)
users            10M  (40% EU, 35% US, 25% IL/APAC)
avg storage/user 2 GB      -&gt; 20 PB logical, 1.4x after dedup/EC overhead -&gt; 28 PB raw
metadata QPS     10M * 50 ops/day / 86400 = ~5.8k avg, x5 peak = ~29k
uploads          10M * 3 files/day * 4 MB / 86400 = ~1.4 GB/s avg ingress
egress           ~2x ingress (downloads, previews) = ~2.8 GB/s
object storage   28 PB * ~$0.01/GB-month (cool/archive mix) ~= $280k/month
cost per user    ~$0.035/month storage -&gt; pricing must cover it with margin</pre>`
      }
    }
  ],
  diagram: `                         users (EU / US / IL)
                                 |
                 Global traffic: DNS + anycast L7 LB + CDN + WAF
                 /                                         \\
       Region A (primary for EU)                   Region B (primary for US)
   +-----------------------------+            +-----------------------------+
   | prod account / project      |            | prod account / project      |
   |  K8s cluster (3 AZs)        |            |  K8s cluster (3 AZs)        |
   |   ns: api, upload, notify   |            |   ns: api, upload, notify   |
   |  Redis | Postgres/Spanner   | &lt;-repl-&gt;   |  Redis | Postgres/Spanner   |
   |  object storage (geo-red.)  |            |  object storage             |
   +-----------------------------+            +-----------------------------+
            |            observability (metrics/logs/traces) + SLO alerts
            +------ backups -> separate account, immutable, other region`,
  flow: {
    actors: ["Product", "Architect", "Cloud & network", "Platform", "Data", "SRE"],
    steps: [
      {
        from: 0, to: 1, ms: 3 * 86400e3,
        label: { en: "Turn the product ask into numbers", he: "להפוך את בקשת המוצר למספרים" },
        detail: {
          en: "<p>Users per region, DAU, actions per user per day, file/message sizes, growth. Output: avg/peak QPS, storage per year, bandwidth. Peak ≈ 3-5x average for consumer apps.</p>",
          he: "<p>משתמשים לכל region, DAU, פעולות למשתמש ביום, גודל קבצים או הודעות, גידול. התוצר: QPS ממוצע ושיא, storage לשנה, רוחב פס. באפליקציות צרכניות השיא הוא בערך פי 3-5 מהממוצע.</p>"
        },
        fail: {
          en: "Skipped: every later debate becomes opinion vs opinion, and you size for the wrong order of magnitude.",
          he: "אם מדלגים: כל ויכוח בהמשך הופך לדעה מול דעה, ואתה עושה sizing בסדר גודל לא נכון."
        }
      },
      {
        from: 1, to: 0, ms: 2 * 86400e3,
        label: { en: "Agree SLOs per user journey and tier services", he: "להסכים על SLO לכל user journey ולתת tier לשירותים" },
        detail: {
          en: "<p>e.g. send message 99.95%, p99 &lt; 300 ms; upload file 99.9%; search 99.5%. Tier 0: auth, messaging core. Tier 2: recommendations. The tier decides DR spend later.</p>",
          he: "<p>למשל שליחת הודעה 99.95% עם p99 מתחת ל-300 ms; העלאת קובץ 99.9%; חיפוש 99.5%. Tier 0: auth וליבת ההודעות. Tier 2: המלצות. ה-tier יקבע בהמשך כמה משקיעים ב-DR.</p>"
        },
        fail: {
          en: "Without tiers everything gets 'five nines', the DR budget explodes, and nothing is actually tested.",
          he: "בלי tiers הכול מקבל 'חמש תשיעיות', תקציב ה-DR מתפוצץ, ובפועל שום דבר לא נבדק."
        }
      },
      {
        from: 1, to: 2, ms: 5 * 86400e3,
        label: { en: "Choose cloud(s) and regions", he: "לבחור ענן (או כמה) ו-regions" },
        detail: {
          en: "<p>Filter by residency and compliance, score by managed-service fit, contracts, skills, cost and GPU/quota availability. Pick 2-3 regions near users with full AZ support. Write ADR. See <a href=\"#/lesson/plan-cloud-selection\">cloud choice</a>.</p>",
          he: "<p>מסננים לפי residency ורגולציה, ומנקדים לפי התאמת managed services, חוזים, ידע בצוות, עלות וזמינות GPU ו-quota. בוחרים 2-3 region-ים קרובים למשתמשים עם תמיכה מלאה ב-AZ. כותבים ADR. ראה <a href=\"#/lesson/plan-cloud-selection\">בחירת ענן</a>.</p>"
        },
        fail: {
          en: "Choosing after data lands: switching now costs egress plus months of dual-running.",
          he: "בחירה אחרי שה-data נחת: מעבר עכשיו עולה egress ועוד חודשים של הרצה כפולה."
        }
      },
      {
        from: 2, to: 3, ms: 5 * 86400e3,
        label: { en: "Accounts, environments, network plan", he: "Accounts, סביבות ותוכנית רשת" },
        detail: {
          en: "<p>Org tree (prod / non-prod / security / shared), account or project per env, non-overlapping CIDRs per region and env, private endpoints to managed services, central egress. See <a href=\"#/lesson/plan-environments-namespaces\">environments</a>.</p>",
          he: "<p>עץ ארגוני (prod / non-prod / security / shared), account או project לכל סביבה, CIDR-ים שלא חופפים לכל region וסביבה, private endpoints לשירותים מנוהלים, egress מרכזי. ראה <a href=\"#/lesson/plan-environments-namespaces\">סביבות</a>.</p>"
        },
        fail: {
          en: "Overlapping CIDRs block VPC peering later; dev and prod in one account means one leaked key reaches prod.",
          he: "CIDR-ים חופפים חוסמים peering בהמשך; dev ו-prod באותו account אומר שמפתח אחד שדלף מגיע ל-prod."
        }
      },
      {
        from: 3, to: 3, ms: 4 * 86400e3,
        label: { en: "Compute and cluster layout, namespaces", he: "Compute, מבנה cluster-ים ו-namespaces" },
        detail: {
          en: "<p>Managed Kubernetes (EKS/AKS/GKE) for long-running services, serverless containers for spiky jobs. One cluster per env per region, namespace per team-service with quotas, default-deny NetworkPolicy and RBAC.</p>",
          he: "<p>Kubernetes מנוהל (EKS/AKS/GKE) לשירותים שרצים כל הזמן, serverless containers ל-jobs קופצניים. Cluster אחד לכל סביבה בכל region, namespace לכל צוות-שירות עם quotas, NetworkPolicy של default-deny ו-RBAC.</p>"
        },
        fail: {
          en: "One giant shared cluster: a single bad upgrade or noisy namespace takes down every product.",
          he: "Cluster משותף ענק אחד: upgrade גרוע אחד או namespace רועש אחד מפילים את כל המוצרים."
        }
      },
      {
        from: 1, to: 4, ms: 7 * 86400e3,
        label: { en: "Choose data stores per access pattern", he: "לבחור data stores לפי access pattern" },
        detail: {
          en: "<p>List entities, their read/write shape and consistency. Default Postgres + object storage + Redis; add wide-column, search or analytics only for a measured need. Spike test the risky one. See <a href=\"#/lesson/plan-data-store-selection\">data stores</a>.</p>",
          he: "<p>רושמים ישויות, את צורת הקריאה והכתיבה שלהן ואת ה-consistency. ברירת המחדל: Postgres + object storage + Redis; מוסיפים wide-column, search או analytics רק כשיש צורך שנמדד. עושים spike test לבחירה המסוכנת. ראה <a href=\"#/lesson/plan-data-store-selection\">data stores</a>.</p>"
        },
        fail: {
          en: "Picking by hype: five engines, five backup systems, five on-call skills, for a team of six.",
          he: "בחירה לפי hype: חמישה מנועים, חמש מערכות backup, חמישה סוגי ידע ל-on-call, לצוות של שישה."
        }
      },
      {
        from: 2, to: 5, ms: 3 * 86400e3,
        label: { en: "Design global traffic and failover", he: "לתכנן traffic גלובלי ו-failover" },
        detail: {
          en: "<p>Anycast L7 LB or GeoDNS, CDN for static/media, WAF, health checks that test real dependencies, and a documented way to drain a region. See <a href=\"#/lesson/plan-global-traffic\">global traffic</a>.</p>",
          he: "<p>Anycast L7 LB או GeoDNS, CDN לסטטי ולמדיה, WAF, health checks שבודקים תלויות אמיתיות, ודרך מתועדת לרוקן region. ראה <a href=\"#/lesson/plan-global-traffic\">traffic גלובלי</a>.</p>"
        },
        fail: {
          en: "DNS TTL of 3600 s means a 'one-minute failover' actually takes an hour for many users.",
          he: "TTL של 3600 s ב-DNS אומר ש'failover של דקה' לוקח בפועל שעה להרבה משתמשים."
        }
      },
      {
        from: 5, to: 3, ms: 3 * 86400e3,
        label: { en: "Observability plan and stack choice", he: "תוכנית observability ובחירת stack" },
        detail: {
          en: "<p>OpenTelemetry instrumentation, golden signals per service, SLO burn-rate alerts, log retention by tier. Price SaaS vs self-hosted with real host and GB numbers.</p>",
          he: "<p>Instrumentation עם OpenTelemetry, golden signals לכל שירות, alerts של SLO burn-rate, retention ל-logs לפי tier. מתמחרים SaaS מול self-hosted עם מספרים אמיתיים של hosts ו-GB.</p>"
        },
        fail: {
          en: "Alert on CPU instead of user pain: pages at night for nothing, silence during real outages.",
          he: "Alerts על CPU במקום על כאב של משתמש: pages בלילה על כלום, ושקט בזמן outages אמיתיים."
        }
      },
      {
        from: 5, to: 1, ms: 5 * 86400e3,
        label: { en: "Failure-mode analysis and DR per tier", he: "ניתוח מצבי כשל ו-DR לכל tier" },
        detail: {
          en: "<p>FMEA for zone, region, DB, cache, deploy, config, cert, DNS, dependency and data-corruption failures. RPO/RTO per tier, immutable backups in a separate account. See <a href=\"#/lesson/plan-failure-sla\">failure &amp; SLA</a>.</p>",
          he: "<p>FMEA לכשלים של zone, region, DB, cache, deploy, config, cert, DNS, תלות חיצונית והשחתת data. RPO/RTO לכל tier, backups immutable ב-account נפרד. ראה <a href=\"#/lesson/plan-failure-sla\">כשלים ו-SLA</a>.</p>"
        },
        fail: {
          en: "Backups in the same account as prod: one compromised admin deletes both.",
          he: "Backups באותו account כמו prod: admin אחד שנפרץ מוחק את שניהם."
        }
      },
      {
        from: 1, to: 0, ms: 2 * 86400e3,
        label: { en: "Cost model and external SLA", he: "מודל עלות ו-SLA חיצוני" },
        detail: {
          en: "<p>Cost per 1k users from the capacity model; SLA set below the internal SLO (e.g. SLO 99.95%, SLA 99.9%) with credits. Product signs off on both.</p>",
          he: "<p>עלות לכל 1k משתמשים ממודל ה-capacity; ה-SLA נקבע מתחת ל-SLO הפנימי (למשל SLO של 99.95% ו-SLA של 99.9%) עם credits. המוצר מאשר את שניהם.</p>"
        },
        fail: {
          en: "Promising customers 99.99% on infra whose composite availability is 99.9%: you pay credits every month.",
          he: "להבטיח ללקוחות 99.99% על תשתית שהזמינות המורכבת שלה 99.9%: אתה משלם credits כל חודש."
        }
      },
      {
        from: 5, to: 3, ms: 10 * 86400e3,
        label: { en: "Load test, chaos, DR drill", he: "Load test, chaos ו-DR drill" },
        detail: {
          en: "<p>Load test to 2x expected peak, soak 24 h, kill pods and a zone, fail over a region in staging, restore a DB from backup and time it. Compare measured RTO/RPO to targets.</p>",
          he: "<p>Load test עד פי 2 מהשיא הצפוי, soak של 24 שעות, להרוג Pod-ים ו-zone, לעשות failover ל-region ב-staging, לשחזר DB מ-backup ולמדוד זמן. משווים RTO/RPO שנמדדו ליעדים.</p>"
        },
        fail: {
          en: "Untested DR is a hope, not a plan: the first real failover is when you learn the runbook is wrong.",
          he: "DR שלא נבדק הוא תקווה, לא תוכנית: ה-failover האמיתי הראשון הוא הרגע שבו מגלים שה-runbook שגוי."
        }
      },
      {
        from: 5, to: 0, ms: 2 * 86400e3,
        label: { en: "Production readiness review, then launch", he: "Production readiness review, ואז launch" },
        detail: {
          en: "<p>Every tier 0-1 service passes the checklist: dashboards, alerts, runbook, on-call rota, rollback tested, limits set, backups verified. Launch with a gradual traffic ramp (1% → 10% → 50% → 100%).</p>",
          he: "<p>כל שירות ב-tier 0-1 עובר את ה-checklist: dashboards, alerts, runbook, תורנות on-call, rollback שנבדק, limits מוגדרים, backups מאומתים. עושים launch עם עלייה הדרגתית ב-traffic (1% ← 10% ← 50% ← 100%).</p>"
        },
        fail: {
          en: "Big-bang launch to 100%: the first real peak is also the first load test.",
          he: "Launch של big-bang ל-100%: השיא האמיתי הראשון הוא גם ה-load test הראשון."
        }
      }
    ]
  },
  handsOn: [
    { cmd: "python3 -c \"u=10e6; ops=50; print('avg QPS', u*ops/86400, 'peak', 5*u*ops/86400)\"", what: { en: "Napkin math: turn users and actions per day into average and peak QPS.", he: "חישוב על מפית: להפוך משתמשים ופעולות ביום ל-QPS ממוצע ושיא." } },
    { cmd: "python3 -c \"print(0.9999*0.9995*0.9995*0.999)\"", what: { en: "Composite availability of four serial dependencies (≈0.9979, about 18 hours of downtime a year).", he: "זמינות מורכבת של ארבע תלויות בטור (≈0.9979, בערך 18 שעות downtime בשנה)." } },
    { cmd: "mkdir -p docs/adr && printf '# ADR-001: Cloud provider\\nStatus: proposed\\n## Context\\n## Options\\n## Decision\\n## Consequences\\n## Revisit if\\n' > docs/adr/001-cloud.md", what: { en: "Start the ADR log: one file per one-way-door decision.", he: "להתחיל יומן ADR: קובץ אחד לכל החלטה של דלת חד-כיוונית." } },
    { cmd: "infracost breakdown --path ./terraform --format table", what: { en: "Turn the Terraform plan into a monthly cost estimate before anything is deployed.", he: "להפוך את ה-plan של Terraform להערכת עלות חודשית לפני שמשהו נפרס." } }
  ],
  mnemonic: {
    en: "\"Numbers, Nines, Cloud, Fences, Roads, Engines, Stores, Eyes, Fire drills, Money\": requirements, SLOs, cloud, accounts/namespaces, traffic, compute, data, observability, DR, cost. And for each one: constraint → criteria → evidence → ADR → revisit trigger.",
    he: "\"מספרים, תשיעיות, ענן, גדרות, כבישים, מנועים, מחסנים, עיניים, תרגילי אש, כסף\": דרישות, SLO-ים, ענן, accounts ו-namespaces, traffic, compute, data, observability, DR, עלות. ולכל אחת: אילוץ ← קריטריונים ← ראיות ← ADR ← trigger לבדיקה מחדש."
  },
  pitfalls: [
    { en: "Starting from technology ('we'll use Kubernetes and Kafka') instead of numbers. You end up justifying tools instead of meeting requirements.", he: "להתחיל מטכנולוגיה ('נשתמש ב-Kubernetes וב-Kafka') במקום ממספרים. בסוף אתה מצדיק כלים במקום לעמוד בדרישות." },
    { en: "Treating every decision as equally important. Spend the time on one-way doors (cloud, data store, regions, tenancy) and decide two-way doors quickly.", he: "להתייחס לכל החלטה כחשובה באותה מידה. משקיעים זמן בדלתות חד-כיווניות (ענן, data store, region-ים, tenancy) ומחליטים מהר על דו-כיווניות." },
    { en: "No revisit trigger. A decision that was right at 1M users silently becomes wrong at 50M because nobody wrote down when to look again.", he: "אין trigger לבדיקה מחדש. החלטה שהייתה נכונה ב-1M משתמשים הופכת בשקט לשגויה ב-50M, כי אף אחד לא כתב מתי להסתכל שוב." },
    { en: "Copying the architecture of Netflix or WhatsApp at day one. They evolved into it over a decade; start with the simplest design that meets your numbers and leaves the next step open.", he: "להעתיק את הארכיטקטורה של Netflix או WhatsApp ביום הראשון. הם הגיעו אליה במשך עשור; מתחילים מהתכנון הכי פשוט שעומד במספרים ומשאיר פתוח את הצעד הבא." }
  ],
  interview: [
    {
      q: { en: "You're asked to plan the infrastructure for a new WhatsApp-like product. Where do you start?", he: "מבקשים ממך לתכנן תשתית למוצר חדש דמוי WhatsApp. מאיפה אתה מתחיל?" },
      a: {
        en: "With numbers and SLOs, not tools: users per region, messages per day, peak factor, message and media sizes, delivery latency target, ordering and residency needs. That tells me the dominant problem (millions of long-lived connections and a high write rate), so the big decisions follow: regional edge with anycast/GeoDNS, a wide-column store partitioned by chat, Redis for presence, users homed to a region, active-active per region. Then I write ADRs for the one-way doors and an FMEA with a test plan.",
        he: "ממספרים ו-SLO-ים, לא מכלים: משתמשים לכל region, הודעות ביום, מקדם שיא, גודל הודעות ומדיה, יעד latency למסירה, דרישות סדר ו-residency. זה אומר לי מה הבעיה השולטת (מיליוני חיבורים ארוכים וקצב כתיבה גבוה), ומשם ההחלטות הגדולות נגזרות: edge אזורי עם anycast או GeoDNS, wide-column store מחולק לפי שיחה, Redis ל-presence, משתמשים שגרים ב-region, active-active לכל region. אחר כך אני כותב ADR-ים לדלתות החד-כיווניות ו-FMEA עם תוכנית בדיקות."
      }
    },
    {
      q: { en: "How do you decide between two reasonable options when the team is split?", he: "איך אתה מכריע בין שתי אפשרויות סבירות כשהצוות חלוק?" },
      a: {
        en: "Agree the criteria and weights before scoring, apply hard constraints as filters, then get evidence: a one-week spike, a load test or a price quote on the riskiest criterion. Classify reversibility; if it's a two-way door, pick the cheaper-to-run option and set a revisit trigger. Record it in an ADR including the losing option's best argument so the decision doesn't get reopened without new information.",
        he: "מסכימים על הקריטריונים והמשקלות לפני הניקוד, מפעילים את האילוצים הקשיחים כפילטרים, ואז משיגים ראיות: spike של שבוע, load test או הצעת מחיר על הקריטריון הכי מסוכן. מסווגים הפיכות; אם זו דלת דו-כיוונית, בוחרים את האפשרות הזולה יותר לתפעול וקובעים trigger לבדיקה מחדש. רושמים ב-ADR, כולל הטיעון הכי טוב של האפשרות שהפסידה, כדי שלא יפתחו את ההחלטה מחדש בלי מידע חדש."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Which decision should come before choosing the DR strategy?", he: "איזו החלטה צריכה לבוא לפני בחירת אסטרטגיית ה-DR?" },
      options: [
        { en: "The monitoring vendor", he: "ספק ה-monitoring" },
        { en: "SLOs and criticality tiers per service", he: "SLO-ים ו-tiers של קריטיות לכל שירות" },
        { en: "The CI/CD tool", he: "כלי ה-CI/CD" },
        { en: "The Kubernetes ingress controller", he: "ה-ingress controller של Kubernetes" }
      ],
      answer: 1,
      explain: { en: "RPO/RTO per tier decide whether a service needs backup-restore, warm standby or active-active. Without tiers you either overspend everywhere or protect nothing well.", he: "RPO/RTO לכל tier קובעים אם שירות צריך backup-restore, warm standby או active-active. בלי tiers או שמבזבזים בכל מקום או שלא מגנים טוב על כלום." }
    },
    {
      q: { en: "Which of these is the clearest one-way door?", he: "מה מהבאים הוא הדלת החד-כיוונית הברורה ביותר?" },
      options: [
        { en: "Switching log shipper from Fluent Bit to Vector", he: "להחליף log shipper מ-Fluent Bit ל-Vector" },
        { en: "Changing the node instance type", he: "לשנות את סוג ה-instance של ה-nodes" },
        { en: "Choosing the primary data store and its partition key after launch", he: "לבחור את ה-data store הראשי ואת ה-partition key שלו אחרי launch" },
        { en: "Changing alert thresholds", he: "לשנות ספי alerts" }
      ],
      answer: 2,
      explain: { en: "Once production data lives in a store with a partition key, changing either means a migration with dual writes, backfill and verification. The others are configuration changes.", he: "ברגע שיש data של production ב-store עם partition key, לשנות אחד מהם אומר מיגרציה עם dual writes, backfill ואימות. השאר הם שינויי קונפיגורציה." }
    },
    {
      q: { en: "For a Netflix-like product, which dimension dominates infra cost and design?", he: "במוצר דמוי Netflix, איזה ממד שולט בעלות ובתכנון התשתית?" },
      options: [
        { en: "Write throughput to the database", he: "Throughput של כתיבות ל-database" },
        { en: "Strong consistency of the catalog", he: "Strong consistency של ה-catalog" },
        { en: "Egress bandwidth, served mostly through a CDN", he: "רוחב פס ל-egress, שמוגש בעיקר דרך CDN" },
        { en: "Number of Kubernetes namespaces", he: "מספר ה-namespaces ב-Kubernetes" }
      ],
      answer: 2,
      explain: { en: "Tens of Tbps of video at peak dwarfs everything else; that's why the CDN and edge caching design is the core decision.", he: "עשרות Tbps של וידאו בשיא מגמדים כל דבר אחר; לכן תכנון ה-CDN וה-caching ב-edge הוא ההחלטה המרכזית." }
    },
    {
      q: { en: "What makes a decision record useful a year later?", he: "מה הופך רשומת החלטה לשימושית שנה אחרי?" },
      options: [
        { en: "Listing only the chosen option to keep it short", he: "לרשום רק את האפשרות שנבחרה כדי שיהיה קצר" },
        { en: "Context with numbers, rejected options, consequences, and a revisit trigger", he: "הקשר עם מספרים, אפשרויות שנדחו, השלכות ו-trigger לבדיקה מחדש" },
        { en: "The names of everyone who voted", he: "השמות של כל מי שהצביע" },
        { en: "A link to the vendor's marketing page", he: "קישור לדף השיווק של הספק" }
      ],
      answer: 1,
      explain: { en: "The numbers tell you whether the context still holds; the trigger tells you when to look again; rejected options stop the same debate from restarting.", he: "המספרים אומרים לך אם ההקשר עדיין נכון; ה-trigger אומר מתי להסתכל שוב; האפשרויות שנדחו עוצרות את אותו ויכוח מלהתחיל מחדש." }
    }
  ],
  playground: "dr",
  related: ["plan-cloud-selection", "plan-environments-namespaces", "plan-data-store-selection", "plan-global-traffic", "plan-failure-sla", "staff-design-docs", "rel-capacity-planning", "pr-architect-questions"]
});

INFRA.glossary.push(
  { term: "Data gravity", track: "principal", def: { en: "The more data lives in one place, the more services, cost (egress) and time it takes to move it; the real cloud lock-in.", he: "ככל שיותר data יושב במקום אחד, כך יותר שירותים, עלות (egress) וזמן נדרשים כדי להזיז אותו; ה-lock-in האמיתי בענן." }, lesson: "plan-cloud-selection" },
  { term: "Weighted scoring matrix", track: "principal", def: { en: "Options scored against criteria whose weights were agreed before scoring; hard constraints are filters, not weights.", he: "ניקוד אפשרויות מול קריטריונים שהמשקלות שלהם סוכמו לפני הניקוד; אילוצים קשיחים הם פילטרים, לא משקלות." }, lesson: "plan-cloud-selection", aliases: ["decision matrix", "scoring matrix"] },
  { term: "Production readiness review", track: "reliability", def: { en: "Checklist a service passes before taking real traffic: alerts, dashboards, runbook, on-call, backups verified, rollback tested.", he: "Checklist ששירות עובר לפני שהוא מקבל traffic אמיתי: alerts, dashboards, runbook, on-call, backups מאומתים, rollback שנבדק." }, lesson: "plan-failure-sla", aliases: ["PRR"] }
);


// Series: Plan a product's infrastructure end to end
// plan-cloud-selection, plan-environments-namespaces

INFRA.lessons.push({
  id: "plan-cloud-selection",
  track: "principal",
  order: 181,
  icon: "🧭",
  level: 3,
  minutes: 22,
  title: {
    en: "Choosing the Cloud: AWS vs Azure vs GCP, and Single vs Multi-Cloud",
    he: "לבחור ענן: AWS מול Azure מול GCP, ענן אחד מול multi-cloud"
  },
  tldr: {
    en: "Choosing a cloud is a filter, then a score, then a reversibility check. First drop every provider that fails a hard constraint (region and data residency, compliance, identity and enterprise agreement, a managed service you cannot live without, GPU quota). Then score the survivors on weighted criteria with real quotes, not gut feelings. If a plausible change of weights flips the winner, it is a tie, and you break it on team skills and on how cheap it is to leave. Decide before customer data lands, because switching cost grows with data gravity. Default to one primary cloud; multi-cloud is a tax you pay only for a named reason.",
    he: "בחירת ענן היא סינון, אחר כך ניקוד, ואחר כך בדיקת הפיכות. קודם מוציאים כל ספק שנכשל בדרישה קשיחה: region ו-data residency, compliance, identity והסכם ארגוני קיים, שירות מנוהל שאי אפשר בלעדיו, quota של GPU. אחר כך מנקדים את מי שנשאר לפי קריטריונים עם משקלות והצעות מחיר אמיתיות, לא לפי תחושת בטן. אם שינוי סביר במשקלות הופך את המנצח, זה תיקו, ושוברים אותו לפי כישורי הצוות ולפי כמה זול לצאת. מחליטים לפני שדאטה של לקוחות נוחת, כי עלות המעבר גדלה עם ה-data gravity. ברירת המחדל היא ענן ראשי אחד. multi-cloud הוא מס שמשלמים רק כשיש לו סיבה עם שם."
  },
  analogy: {
    en: "Choosing a cloud is like choosing the city where your company opens its headquarters. First you cross out cities where you legally cannot operate or where your key customers will not visit. Then you compare the rest on rent, talent, transport and the one supplier you depend on. You can still change your mind while the plan is on paper; once the factory is built and the warehouses are full, moving costs years. Opening a second headquarters in another city is possible, but you now pay two rents, two teams and a truck between them every day.",
    he: "לבחור ענן זה כמו לבחור באיזו עיר החברה פותחת את המטה. קודם מוחקים ערים שאסור לך לפעול בהן או שהלקוחות החשובים לא יגיעו אליהן. אחר כך משווים את השאר לפי שכירות, כוח אדם, תחבורה והספק האחד שאתה תלוי בו. כל עוד התוכנית על נייר, אפשר להתחרט בזול. אחרי שהמפעל בנוי והמחסנים מלאים, מעבר עולה שנים. אפשר לפתוח מטה שני בעיר אחרת, אבל אז אתה משלם שתי שכירויות, שני צוותים ומשאית שנוסעת ביניהם כל יום."
  },
  sections: [
    {
      h: { en: "Step 1: hard constraints filter, they do not score", he: "שלב 1: דרישות קשיחות מסננות, הן לא מנקדות" },
      body: {
        en: `<p>The most common planning mistake is to put a hard constraint into a weighted score. If your largest customer contractually requires data to stay in Germany and a provider has no German region, that provider does not get "2 out of 5"; it is out. Run every candidate through this list <strong>before</strong> any scoring:</p>
<table>
<tr><th>Constraint</th><th>Question you must answer with evidence</th><th>How to check</th></tr>
<tr><td>Regions and data residency</td><td>Is there a region (ideally with 3 zones) in every jurisdiction where data must live? Is the service you need actually available in that region?</td><td>Regional product availability pages; <code>aws ec2 describe-regions</code>, <code>gcloud compute regions list</code>, <code>az account list-locations</code></td></tr>
<tr><td>Compliance</td><td>Does the provider hold the attestations your customers ask for (SOC 2, ISO 27001, PCI DSS, HIPAA BAA, FedRAMP, local government clouds) <em>for the specific services</em> you plan to use?</td><td>Services-in-scope lists per certification</td></tr>
<tr><td>Identity and enterprise agreement</td><td>Is the company already on Microsoft 365 and Entra ID with a committed spend agreement (MACC)? An existing EDP/PPA on AWS or a commit on GCP?</td><td>Ask procurement and IT, not engineering</td></tr>
<tr><td>Must-have managed services</td><td>Is there one service the architecture leans on that has no equivalent elsewhere (Spanner-style global consistency, BigQuery-scale analytics, Azure OpenAI models, a specific database engine)?</td><td>Architecture spike, not marketing pages</td></tr>
<tr><td>AI and GPU capacity</td><td>Can you get the accelerators you need (H100/H200/B200, TPUs, Trainium) in your regions, at the quota you need, this quarter?</td><td>File the quota request on day 1; a "pending" quota is a "no"</td></tr>
<tr><td>Egress and network pricing</td><td>How much data leaves the cloud each month (downloads, CDN origin, cross-cloud)?</td><td>Model it: 200 TB/month at roughly $0.05 to $0.09/GB is $10k to $18k a month</td></tr>
<tr><td>Support and partners</td><td>Response time on severity 1 at your support tier; is there a local partner or account team?</td><td>Support plan contract, references</td></tr>
</table>
<p>Credits and discounts belong in step 2, not here: startup credits (often $100k to $350k), committed-use discounts (CUD on GCP, Savings Plans and Reserved Instances on AWS, reservations and savings plans on Azure, typically 20% to 55% off compute for 1 or 3 years) are negotiable money, not physics.</p>
<blockquote>⚠️ Production tip: write the hard constraints in the design doc with the <em>source</em> of each one ("Customer X MSA clause 12.3", "Legal, 2026-03-02"). Half of "hard" constraints turn out to be someone's assumption, and the other half are what make the decision defensible a year later.</blockquote>`,
        he: `<p>הטעות הנפוצה ביותר בתכנון היא להכניס דרישה קשיחה לתוך ניקוד משוקלל. אם הלקוח הכי גדול שלך מחייב בחוזה שהדאטה יישאר בגרמניה, ולספק אין region בגרמניה, הספק הזה לא מקבל "2 מתוך 5". הוא בחוץ. העבר כל מועמד דרך הרשימה הזאת <strong>לפני</strong> כל ניקוד:</p>
<table>
<tr><th>דרישה</th><th>שאלה שצריך לענות עליה עם הוכחה</th><th>איך בודקים</th></tr>
<tr><td>Regions ו-data residency</td><td>יש region (רצוי עם 3 zones) בכל תחום שיפוט שבו הדאטה חייב לשבת? השירות שאתה צריך באמת זמין ב-region הזה?</td><td>דפי זמינות שירותים לפי region; <code>aws ec2 describe-regions</code>, <code>gcloud compute regions list</code>, <code>az account list-locations</code></td></tr>
<tr><td>Compliance</td><td>לספק יש את האישורים שהלקוחות שלך דורשים (SOC 2, ISO 27001, PCI DSS, HIPAA BAA, FedRAMP, עננים ממשלתיים מקומיים) <em>עבור השירותים הספציפיים</em> שאתה מתכנן להשתמש בהם?</td><td>רשימת services-in-scope לכל הסמכה</td></tr>
<tr><td>Identity והסכם ארגוני</td><td>החברה כבר על Microsoft 365 ו-Entra ID עם התחייבות הוצאה (MACC)? יש EDP/PPA קיים מול AWS או commit מול GCP?</td><td>שואלים את ה-procurement ואת ה-IT, לא את ה-engineering</td></tr>
<tr><td>שירותים מנוהלים שאין בלעדיהם</td><td>יש שירות אחד שהארכיטקטורה נשענת עליו ואין לו מקבילה אצל אחרים (consistency גלובלית בסגנון Spanner, analytics בקנה מידה של BigQuery, מודלים של Azure OpenAI, מנוע דאטאבייס מסוים)?</td><td>Spike ארכיטקטוני, לא דפי שיווק</td></tr>
<tr><td>AI וקיבולת GPU</td><td>אפשר לקבל את ה-accelerators שאתה צריך (H100/H200/B200, TPUs, Trainium) ב-regions שלך, ב-quota שאתה צריך, ברבעון הזה?</td><td>מגישים בקשת quota ביום הראשון; quota ב-"pending" זה "לא"</td></tr>
<tr><td>Egress ותמחור רשת</td><td>כמה דאטה יוצא מהענן כל חודש (הורדות, origin של CDN, תעבורה בין עננים)?</td><td>ממדלים: 200 TB בחודש בערך ב-$0.05 עד $0.09 ל-GB זה $10k עד $18k בחודש</td></tr>
<tr><td>Support ושותפים</td><td>מה זמן התגובה ל-severity 1 ברמת ה-support שלך? יש שותף מקומי או account team?</td><td>חוזה ה-support, ממליצים</td></tr>
</table>
<p>קרדיטים והנחות שייכים לשלב 2, לא לכאן: קרדיטים לסטארטאפים (לרוב $100k עד $350k) והנחות התחייבות (CUD ב-GCP, Savings Plans ו-Reserved Instances ב-AWS, reservations ו-savings plans ב-Azure, בדרך כלל 20% עד 55% הנחה על compute לשנה או לשלוש) הם כסף שאפשר לנהל עליו משא ומתן, לא חוקי פיזיקה.</p>
<blockquote>⚠️ טיפ מפרודקשן: כתוב את הדרישות הקשיחות ב-design doc עם <em>המקור</em> של כל אחת ("סעיף 12.3 ב-MSA של לקוח X", "Legal, 2026-03-02"). חצי מהדרישות ה"קשיחות" מתגלות כהנחה של מישהו, והחצי השני הוא מה שהופך את ההחלטה לניתנת להגנה גם שנה אחרי.</blockquote>`
      }
    },
    {
      h: { en: "Step 2: a weighted scoring matrix you can defend", he: "שלב 2: מטריצת ניקוד משוקללת שאפשר להגן עליה" },
      body: {
        en: `<p>Product: a Drive-like B2B file platform. EU and Israeli customers, a global metadata store (folders, permissions, sharing), heavy usage analytics, AI search over documents planned for year 2. All three big providers passed step 1. Weights are set <strong>before</strong> anyone looks at scores, by the people who own the outcome (CTO, platform lead, finance), and they sum to 100. Scores are 1 to 5 and each one has a one-line justification in the doc.</p>
<table>
<tr><th>Criterion</th><th>Weight</th><th>AWS</th><th>Azure</th><th>GCP</th><th>Why the scores differ</th></tr>
<tr><td>Regions and residency (EU + Israel)</td><td>15</td><td>5</td><td>5</td><td>5</td><td>All have Frankfurt-class EU regions and an Israel region; does not differentiate</td></tr>
<tr><td>Managed data fit (global metadata DB + analytics)</td><td>20</td><td>4</td><td>3</td><td>5</td><td>Spanner and BigQuery fit the shape directly; Aurora/DynamoDB and Cosmos DB need more design work</td></tr>
<tr><td>Team skills today</td><td>15</td><td>3</td><td>4</td><td>3</td><td>Team ran AKS at a previous product; two engineers know AWS; nobody knows GCP deeply</td></tr>
<tr><td>Identity and enterprise agreement</td><td>10</td><td>3</td><td>5</td><td>3</td><td>Company runs on Microsoft 365 and Entra ID; federation to AWS/GCP works, but is one more thing</td></tr>
<tr><td>AI / GPU capacity in our regions</td><td>10</td><td>4</td><td>3</td><td>4</td><td>Azure GPU quota request in West Europe pending for 3 weeks; AWS and GCP approved a starting quota</td></tr>
<tr><td>3-year cost incl. credits, commits, egress</td><td>15</td><td>3</td><td>4</td><td>5</td><td>Real quotes: GCP offered credits plus a CUD; Azure MACC already exists; AWS list price with Savings Plans</td></tr>
<tr><td>Managed Kubernetes maturity</td><td>10</td><td>3</td><td>4</td><td>5</td><td>GKE Autopilot and release channels reduce platform toil for a 4-person platform team</td></tr>
<tr><td>Support and partners</td><td>5</td><td>4</td><td>4</td><td>3</td><td>Local partners and account teams for all; AWS and Azure have more local partners</td></tr>
<tr><td><strong>Weighted total (÷100)</strong></td><td><strong>100</strong></td><td><strong>3.65</strong></td><td><strong>3.95</strong></td><td><strong>4.30</strong></td><td>Σ weight × score / 100</td></tr>
</table>
<p>Three rules make the matrix honest:</p>
<ul>
<li><strong>Drop non-differentiating rows from the discussion.</strong> Regions scored 5/5/5; it passed the filter and carries no information now. Do not let it inflate everyone's total and hide the real gap.</li>
<li><strong>Run a sensitivity check.</strong> Move 10 points from "managed data fit" to "team skills" (weights 10 and 25). Totals become AWS 3.55, Azure 4.05, GCP 4.10. The lead shrinks from 0.35 to 0.05, which is a tie. A winner that flips on one plausible weight change is not a decision, it is a coin toss with a spreadsheet.</li>
<li><strong>Break ties on reversibility and people.</strong> When it is close, choose the option that is cheaper to leave and that the team can operate at 3 AM. Then write down what new fact would make you choose otherwise.</li>
</ul>
<blockquote>💡 Real world: the matrix is not the decision, it is the <em>argument</em>. Its job is to make the disagreement visible ("you weigh team skills at 15, I weigh it at 30") so the discussion is about values and facts instead of brand loyalty.</blockquote>`,
        he: `<p>המוצר: פלטפורמת קבצים B2B בסגנון Drive. לקוחות באירופה ובישראל, metadata store גלובלי (תיקיות, הרשאות, שיתופים), analytics כבד על שימוש, וחיפוש AI על מסמכים מתוכנן לשנה השנייה. שלושת הספקים הגדולים עברו את שלב 1. את המשקלות קובעים <strong>לפני</strong> שמישהו מסתכל על ציונים, האנשים שאחראים על התוצאה (CTO, ראש ה-platform, כספים), והם מסתכמים ל-100. הציונים בין 1 ל-5, ולכל ציון יש שורת הצדקה אחת ב-doc.</p>
<table>
<tr><th>קריטריון</th><th>משקל</th><th>AWS</th><th>Azure</th><th>GCP</th><th>למה הציונים שונים</th></tr>
<tr><td>Regions ו-residency (אירופה וישראל)</td><td>15</td><td>5</td><td>5</td><td>5</td><td>לכולם יש regions באירופה ברמה של פרנקפורט ו-region בישראל; לא מבדיל</td></tr>
<tr><td>התאמת דאטה מנוהל (DB גלובלי ל-metadata ו-analytics)</td><td>20</td><td>4</td><td>3</td><td>5</td><td>Spanner ו-BigQuery מתאימים לצורה ישירות; Aurora/DynamoDB ו-Cosmos DB דורשים יותר עבודת תכנון</td></tr>
<tr><td>כישורי הצוות היום</td><td>15</td><td>3</td><td>4</td><td>3</td><td>הצוות הריץ AKS במוצר קודם; שני מהנדסים מכירים AWS; אף אחד לא מכיר GCP לעומק</td></tr>
<tr><td>Identity והסכם ארגוני</td><td>10</td><td>3</td><td>5</td><td>3</td><td>החברה רצה על Microsoft 365 ו-Entra ID; federation ל-AWS או ל-GCP עובד, אבל זה עוד דבר לתחזק</td></tr>
<tr><td>קיבולת AI ו-GPU ב-regions שלנו</td><td>10</td><td>4</td><td>3</td><td>4</td><td>בקשת quota ל-GPU ב-West Europe ב-Azure תקועה ב-pending שלושה שבועות; AWS ו-GCP אישרו quota התחלתי</td></tr>
<tr><td>עלות ל-3 שנים כולל קרדיטים, התחייבויות ו-egress</td><td>15</td><td>3</td><td>4</td><td>5</td><td>הצעות אמיתיות: GCP הציעו קרדיטים ו-CUD; ל-Azure כבר יש MACC; AWS במחירון עם Savings Plans</td></tr>
<tr><td>בגרות ה-Kubernetes המנוהל</td><td>10</td><td>3</td><td>4</td><td>5</td><td>GKE Autopilot ו-release channels מורידים toil לצוות platform של 4 אנשים</td></tr>
<tr><td>Support ושותפים</td><td>5</td><td>4</td><td>4</td><td>3</td><td>לכולם יש שותפים מקומיים ו-account team; ל-AWS ול-Azure יש יותר שותפים מקומיים</td></tr>
<tr><td><strong>סך משוקלל (חלקי 100)</strong></td><td><strong>100</strong></td><td><strong>3.65</strong></td><td><strong>3.95</strong></td><td><strong>4.30</strong></td><td>Σ משקל × ציון / 100</td></tr>
</table>
<p>שלושה כללים שומרים על המטריצה כנה:</p>
<ul>
<li><strong>מוציאים מהדיון שורות שלא מבדילות.</strong> Regions קיבל 5/5/5. הוא עבר את הסינון ואין בו יותר מידע. אל תיתן לו לנפח את הסך של כולם ולהסתיר את הפער האמיתי.</li>
<li><strong>מריצים בדיקת רגישות.</strong> העבר 10 נקודות מ"התאמת דאטה" ל"כישורי צוות" (משקלות 10 ו-25). הסכומים הופכים ל-AWS 3.55, Azure 4.05, GCP 4.10. הפער מתכווץ מ-0.35 ל-0.05, וזה תיקו. מנצח שמתהפך משינוי סביר אחד במשקלות הוא לא החלטה, הוא הטלת מטבע עם spreadsheet.</li>
<li><strong>שוברים תיקו לפי הפיכות ואנשים.</strong> כשזה צמוד, בחר באפשרות שזול יותר לצאת ממנה ושהצוות יודע להפעיל בשלוש בלילה. ואז כתוב איזו עובדה חדשה תגרום לך לבחור אחרת.</li>
</ul>
<blockquote>💡 מהעולם האמיתי: המטריצה היא לא ההחלטה, היא <em>הטיעון</em>. התפקיד שלה הוא להפוך את המחלוקת לגלויה ("אתה נותן לכישורי צוות 15, אני נותן 30"), כך שהדיון יהיה על ערכים ועובדות ולא על נאמנות למותג.</blockquote>`
      }
    },
    {
      h: { en: "Worked story: we planned Azure, we ended on GCP", he: "סיפור מהשטח: תכננו Azure, נחתנו ב-GCP" },
      body: {
        en: `<p>Week 0. The gut call was Azure: the company lives in Microsoft 365, the team knows AKS, and there is already a MACC commitment. The first draft of the matrix (with assumed numbers) put Azure at 4.10 and GCP at 3.85. Then three facts arrived, each one changing a score, not a weight:</p>
<ol>
<li><strong>Data fit spike (week 2).</strong> The metadata model is a tree with ACL inheritance, global sharing links and strong consistency on "who can see this file right now". A two-day spike modelled it on Cosmos DB (session consistency, partition key per tenant, cross-partition queries for shared folders) and on Spanner (interleaved tables, external consistency, one logical database across EU regions). Spanner removed a whole class of "eventually visible permission" bugs. Data fit for Azure dropped from 4 to 3, GCP rose to 5.</li>
<li><strong>GPU quota (week 3).</strong> The AI search roadmap needs a modest GPU pool for embeddings. The Azure quota request for West Europe stayed pending; GCP approved L4 and a small H100 quota in europe-west4. A pending quota is a "no" for planning purposes.</li>
<li><strong>Negotiation (week 4).</strong> With a real matrix in hand, procurement asked all three for a 3-year offer. GCP came back with credits plus a committed-use discount that beat the Azure MACC effective rate on the projected compute and storage. Cost for GCP rose to 5.</li>
</ol>
<p>The final matrix gave GCP 4.30. Identity stayed an Azure win, so the decision included its mitigation: Entra ID stays the identity provider, federated to Google Cloud via Workforce Identity Federation, so employees keep one login. The "team skills" gap was costed explicitly: two engineers on GCP training plus a 3-month partner engagement.</p>
<p><strong>Why the switch was cheap:</strong> no customer data existed yet, no proprietary service was wired into code, the IaC was 400 lines of Terraform. Cost of switching in week 4: about two engineer-weeks.</p>
<table>
<tr><th>When you switch</th><th>What you have built</th><th>Rough switching cost</th></tr>
<tr><td>Design phase</td><td>Docs, a spike, some Terraform</td><td>Days to two weeks</td></tr>
<tr><td>Pre-launch, test data only</td><td>CI/CD, clusters, a few managed services in code</td><td>1 to 2 months for a small team</td></tr>
<tr><td>Live, 50 TB, 2 proprietary services</td><td>Customer data, SLAs, compliance evidence on one provider</td><td>2 to 4 quarters, dual running, migration risk</td></tr>
<tr><td>Years in, 5 PB, deep integration (IAM, events, analytics)</td><td>Data gravity: every new service lands next to the data</td><td>A multi-year program; rarely done for cost alone</td></tr>
</table>
<p>Egress for leaving is now often waived: since 2024 AWS, Google Cloud and Azure all offer free data transfer out when you fully migrate away (by request, with conditions), and the EU Data Act pushes switching charges to zero by January 2027. But egress was never the biggest cost; re-engineering, dual running and re-certifying compliance are.</p>
<blockquote>💡 Real world: write the "what would make us choose otherwise" list into the decision record. Here it was: "Azure GPU quota approved within 2 weeks AND Spanner-equivalent consistency proven on Cosmos DB within the spike AND effective price within 5%". None of them happened, so the decision stood without a re-argument every quarter.</blockquote>`,
        he: `<p>שבוע 0. תחושת הבטן הייתה Azure: החברה חיה ב-Microsoft 365, הצוות מכיר AKS, וכבר קיימת התחייבות MACC. הטיוטה הראשונה של המטריצה (עם מספרים מונחים) נתנה ל-Azure ציון 4.10 ול-GCP ציון 3.85. ואז הגיעו שלוש עובדות, וכל אחת שינתה ציון, לא משקל:</p>
<ol>
<li><strong>Spike על התאמת הדאטה (שבוע 2).</strong> מודל ה-metadata הוא עץ עם ירושת ACL, לינקי שיתוף גלובליים, ו-consistency חזקה על השאלה "מי יכול לראות את הקובץ הזה עכשיו". Spike של יומיים מידל אותו על Cosmos DB (session consistency, partition key לכל tenant, שאילתות cross-partition לתיקיות משותפות) ועל Spanner (interleaved tables, external consistency, דאטאבייס לוגי אחד על כמה regions באירופה). Spanner העלים סוג שלם של באגים בסגנון "הרשאה שנראית בסוף". ציון התאמת הדאטה של Azure ירד מ-4 ל-3, ושל GCP עלה ל-5.</li>
<li><strong>Quota של GPU (שבוע 3).</strong> ה-roadmap של חיפוש ה-AI צריך pool צנוע של GPUs ל-embeddings. בקשת ה-quota ב-Azure ל-West Europe נשארה ב-pending. GCP אישרו L4 ו-quota קטן של H100 ב-europe-west4. לצורכי תכנון, quota ב-pending הוא "לא".</li>
<li><strong>משא ומתן (שבוע 4).</strong> עם מטריצה אמיתית ביד, ה-procurement ביקש משלושתם הצעה לשלוש שנים. GCP חזרו עם קרדיטים ועם committed-use discount שניצחו את המחיר האפקטיבי של ה-MACC של Azure על ה-compute וה-storage הצפויים. ציון העלות של GCP עלה ל-5.</li>
</ol>
<p>המטריצה הסופית נתנה ל-GCP ציון 4.30. ה-identity נשאר ניצחון של Azure, ולכן ההחלטה כללה את ההקלה: Entra ID נשאר ה-identity provider, עם federation ל-Google Cloud דרך Workforce Identity Federation, כך שלעובדים נשאר login אחד. הפער ב"כישורי צוות" תומחר במפורש: שני מהנדסים בהכשרת GCP ועוד שלושה חודשי ליווי של שותף.</p>
<p><strong>למה המעבר היה זול:</strong> עוד לא היה דאטה של לקוחות, אף שירות proprietary לא היה מחווט בקוד, וה-IaC היה 400 שורות Terraform. עלות המעבר בשבוע 4: בערך שבועיים של מהנדס.</p>
<table>
<tr><th>מתי עוברים</th><th>מה כבר בנית</th><th>עלות מעבר משוערת</th></tr>
<tr><td>שלב התכנון</td><td>מסמכים, spike, קצת Terraform</td><td>ימים עד שבועיים</td></tr>
<tr><td>לפני launch, רק דאטה של בדיקות</td><td>CI/CD, clusters, כמה שירותים מנוהלים בקוד</td><td>חודש-חודשיים לצוות קטן</td></tr>
<tr><td>באוויר, 50 TB, שני שירותים proprietary</td><td>דאטה של לקוחות, SLAs, ראיות compliance על ספק אחד</td><td>2 עד 4 רבעונים, הרצה כפולה, סיכון במיגרציה</td></tr>
<tr><td>אחרי שנים, 5 PB, אינטגרציה עמוקה (IAM, אירועים, analytics)</td><td>Data gravity: כל שירות חדש נוחת ליד הדאטה</td><td>תוכנית רב-שנתית; כמעט אף פעם לא עושים את זה רק בגלל עלות</td></tr>
</table>
<p>היום ה-egress ביציאה לרוב מבוטל: מאז 2024 גם AWS, גם Google Cloud וגם Azure מציעים העברת דאטה החוצה בחינם כשעוזבים לגמרי (לפי בקשה ובתנאים), וה-EU Data Act דוחף את עמלות המעבר לאפס עד ינואר 2027. אבל ה-egress אף פעם לא היה העלות הגדולה. הנדסה מחדש, הרצה כפולה והסמכת compliance מחדש הם העלות.</p>
<blockquote>💡 מהעולם האמיתי: כתוב את רשימת "מה יגרום לנו לבחור אחרת" לתוך ה-decision record. כאן היא הייתה: "quota ל-GPU ב-Azure מאושר תוך שבועיים, וגם consistency שקולה ל-Spanner מוכחת על Cosmos DB ב-spike, וגם מחיר אפקטיבי בטווח של 5%". אף אחד מהם לא קרה, אז ההחלטה החזיקה בלי ויכוח מחדש כל רבעון.</blockquote>`
      }
    },
    {
      h: { en: "Multi-cloud: four levels and their honest price", he: "Multi-cloud: ארבע רמות והמחיר האמיתי שלהן" },
      body: {
        en: `<p>"Multi-cloud" means four very different things. Name the level before you argue about it:</p>
<table>
<tr><th>Level</th><th>What it looks like</th><th>Extra cost</th><th>When it is justified</th></tr>
<tr><td>1. Accidental</td><td>Main product on AWS, an acquired team on Azure, data science in BigQuery, nobody decided</td><td>Two of everything (IAM, networking, on-call knowledge), surprise egress</td><td>Never by design; contain it with shared identity, shared observability and a landing zone per cloud</td></tr>
<tr><td>2. Best-of-breed per workload</td><td>Product on AWS, analytics on BigQuery, AI on Azure OpenAI. Each workload lives in one cloud</td><td>Second skill set, cross-cloud egress (analytics exports), two security baselines</td><td>When one service is clearly better <em>and</em> the data crossing the boundary is small or batch</td></tr>
<tr><td>3. DR to another cloud</td><td>Prod on cloud A, backups and a cold/pilot-light environment on cloud B</td><td>Portable stack required for the DR path, regular failover tests, 10% to 30% extra infra cost</td><td>Regulatory exit plans (DORA for EU financial entities requires documented exit strategies for critical ICT providers), concentration-risk concerns of a regulator or large customer</td></tr>
<tr><td>4. Active-active across clouds</td><td>Same service serving live traffic from two clouds with data replicated between them</td><td>Highest: lowest-common-denominator services, cross-cloud data consistency, double expertise, 1.5x to 2x cost</td><td>Rare: a product that sells "runs on your cloud" (database vendors, observability SaaS) or customer contracts that demand it</td></tr>
</table>
<p>The costs that do not show up on the invoice:</p>
<ul>
<li><strong>Portability tax:</strong> you give up the proprietary service that would have saved you months (DynamoDB streams, Spanner, Cosmos DB change feed) and build or run the portable equivalent yourself.</li>
<li><strong>Lowest common denominator:</strong> features are limited to what all clouds can do, so IAM, networking and eventing become the dullest shared subset.</li>
<li><strong>Double expertise:</strong> every on-call engineer must be fluent in two IAM models, two networking models and two sets of failure modes. Outages caused by confusion between them are real.</li>
<li><strong>Egress:</strong> replicating 20 TB a month between clouds at about $0.08/GB is about $1,600 a month forever, plus interconnect fees.</li>
</ul>
<p>Multi-region in <em>one</em> cloud protects against most real outages (a zone, a region, a bad deploy). Multi-cloud protects against the provider itself, its global control plane, its commercial terms or a regulator. Choose it for those reasons, by name.</p>
<blockquote>⚠️ Production tip: legitimate drivers for level 3 or 4 have a name and a document: "DORA exit plan", "acquired company with $2M/year committed on Azure until 2028", "top-3 customer requires deployment in their GCP organisation". "Avoid lock-in" alone is not a driver; it is a cost you have not priced.</blockquote>`,
        he: `<p>"Multi-cloud" זה ארבעה דברים שונים מאוד. תן שם לרמה לפני שאתה מתווכח עליה:</p>
<table>
<tr><th>רמה</th><th>איך זה נראה</th><th>עלות נוספת</th><th>מתי זה מוצדק</th></tr>
<tr><td>1. בטעות</td><td>המוצר הראשי על AWS, צוות שנרכש על Azure, ה-data science ב-BigQuery, ואף אחד לא החליט</td><td>שניים מכל דבר (IAM, רשת, ידע של on-call), egress מפתיע</td><td>אף פעם לא בתכנון; מכילים את זה עם identity משותף, observability משותף ו-landing zone לכל ענן</td></tr>
<tr><td>2. הכי טוב לכל workload</td><td>המוצר על AWS, ה-analytics ב-BigQuery, ה-AI על Azure OpenAI. כל workload חי בענן אחד</td><td>סט כישורים שני, egress בין עננים (יצוא ל-analytics), שני baselines של אבטחה</td><td>כשיש שירות אחד שעדיף בבירור, <em>וגם</em> הדאטה שחוצה את הגבול קטן או עובר ב-batch</td></tr>
<tr><td>3. DR לענן אחר</td><td>Prod על ענן A, גיבויים וסביבה קרה או pilot light על ענן B</td><td>חייבים stack נייד בנתיב ה-DR, בדיקות failover קבועות, 10% עד 30% עלות תשתית נוספת</td><td>תוכניות יציאה רגולטוריות (DORA מחייב גופים פיננסיים באירופה בתוכניות יציאה מתועדות מספקי ICT קריטיים), חשש של רגולטור או לקוח גדול מריכוז סיכון</td></tr>
<tr><td>4. Active-active בין עננים</td><td>אותו שירות מגיש תעבורה חיה משני עננים, עם דאטה שמשוכפל ביניהם</td><td>הכי גבוהה: שירותים במכנה המשותף הנמוך, consistency של דאטה בין עננים, מומחיות כפולה, פי 1.5 עד פי 2 בעלות</td><td>נדיר: מוצר שמוכר "רץ על הענן שלך" (ספקי דאטאבייס, SaaS של observability), או חוזים עם לקוחות שדורשים את זה</td></tr>
</table>
<p>העלויות שלא מופיעות בחשבונית:</p>
<ul>
<li><strong>מס הניידות:</strong> אתה מוותר על השירות ה-proprietary שהיה חוסך לך חודשים (DynamoDB streams, Spanner, change feed של Cosmos DB), ובונה או מריץ בעצמך את המקבילה הניידת.</li>
<li><strong>המכנה המשותף הנמוך:</strong> הפיצ'רים מוגבלים למה שכל העננים יודעים לעשות, אז IAM, רשת ואירועים הופכים לתת-הקבוצה המשותפת והמשעממת ביותר.</li>
<li><strong>מומחיות כפולה:</strong> כל מהנדס on-call חייב לשלוט בשני מודלים של IAM, בשני מודלים של רשת ובשני סטים של תקלות. השבתות שנגרמות מבלבול ביניהם הן אמיתיות.</li>
<li><strong>Egress:</strong> שכפול של 20 TB בחודש בין עננים בערך ב-$0.08 ל-GB הוא בערך $1,600 בחודש לתמיד, ועוד עלויות interconnect.</li>
</ul>
<p>Multi-region בענן <em>אחד</em> מגן מרוב ההשבתות האמיתיות (zone, region, deploy גרוע). Multi-cloud מגן מהספק עצמו: מה-control plane הגלובלי שלו, מהתנאים המסחריים שלו או מרגולטור. בחר בו בגלל הסיבות האלה, ותן להן שם.</p>
<blockquote>⚠️ טיפ מפרודקשן: למניעים לגיטימיים לרמה 3 או 4 יש שם ומסמך: "תוכנית יציאה לפי DORA", "חברה שנרכשה עם התחייבות של $2M בשנה ל-Azure עד 2028", "לקוח מה-top-3 דורש deployment בתוך ה-GCP organization שלו". "להימנע מ-lock-in" לבד הוא לא מניע. זו עלות שעוד לא תמחרת.</blockquote>`
      }
    },
    {
      h: { en: "Keeping the option open cheaply", he: "להשאיר את האופציה פתוחה בזול" },
      body: {
        en: `<p>You do not need multi-cloud to keep the <em>option</em> of moving. You need to know which choices are cheap insurance and which are expensive. A useful rule: <strong>be portable at the edges and in the data format; be proprietary where it saves you a team.</strong></p>
<table>
<tr><th>Layer</th><th>Cheap portable choice</th><th>Lock-in worth paying for when...</th></tr>
<tr><td>Infrastructure as code</td><td>Terraform/OpenTofu with modules per capability (network, cluster, database)</td><td>Rarely worth CloudFormation/Bicep-only if the team may move</td></tr>
<tr><td>Compute</td><td>Containers on managed Kubernetes (EKS/AKS/GKE), Helm or Kustomize, OCI images</td><td>Lambda/Cloud Run/Functions when glue code is small and the time saved is large</td></tr>
<tr><td>Relational data</td><td>PostgreSQL-compatible engines (RDS/Aurora PostgreSQL, Azure Database for PostgreSQL, Cloud SQL/AlloyDB)</td><td>Spanner, DynamoDB, Cosmos DB when their consistency or scale model is the product's core</td></tr>
<tr><td>Object storage</td><td>S3-compatible API in an internal client library; open formats (Parquet, Iceberg)</td><td>Native features (lifecycle, events) used behind your own interface</td></tr>
<tr><td>Observability</td><td>OpenTelemetry SDKs and Collector; vendor is a backend you can swap</td><td>Native tools for cloud control-plane logs (CloudTrail, Activity Log, Audit Logs) always</td></tr>
<tr><td>Messaging</td><td>Kafka protocol (MSK, Event Hubs Kafka endpoint, Managed Kafka) or a thin internal interface</td><td>SQS/Service Bus/Pub/Sub when ops simplicity beats portability</td></tr>
<tr><td>Identity</td><td>OIDC/SAML federation from one IdP; workload identity federation instead of static keys</td><td>Native IAM inside the cloud is unavoidable; keep policies in code</td></tr>
</table>
<p>Watch out for "proprietary glue": dozens of small Step Functions, Logic Apps, EventBridge rules and IAM-coupled triggers wired directly into business logic. Each one is cheap to add and together they are what makes a migration take a year. Keep that glue behind a small number of internal interfaces, or accept it consciously.</p>
<blockquote>💡 Real world: a quarterly "exit drill" costs a day: restore last night's Postgres backup and one bucket sample into a different cloud's free tier using your Terraform modules, and measure how long it takes. If it takes a day, your option is real. If nobody can make it work, your "we can always move" is a belief, not a plan.</blockquote>`,
        he: `<p>לא צריך multi-cloud כדי לשמור את <em>האופציה</em> לעבור. צריך לדעת אילו בחירות הן ביטוח זול ואילו יקרות. כלל שימושי: <strong>היה נייד בקצוות ובפורמט הדאטה; היה proprietary איפה שזה חוסך לך צוות.</strong></p>
<table>
<tr><th>שכבה</th><th>בחירה ניידת וזולה</th><th>Lock-in ששווה לשלם עליו כש...</th></tr>
<tr><td>Infrastructure as code</td><td>Terraform/OpenTofu עם modules לפי יכולת (רשת, cluster, דאטאבייס)</td><td>כמעט אף פעם לא שווה ללכת רק על CloudFormation/Bicep אם הצוות עשוי לעבור</td></tr>
<tr><td>Compute</td><td>Containers על Kubernetes מנוהל (EKS/AKS/GKE), Helm או Kustomize, OCI images</td><td>Lambda/Cloud Run/Functions כשקוד הדבק קטן והזמן שנחסך גדול</td></tr>
<tr><td>דאטה רלציוני</td><td>מנועים תואמי PostgreSQL (RDS/Aurora PostgreSQL, Azure Database for PostgreSQL, Cloud SQL/AlloyDB)</td><td>Spanner, DynamoDB, Cosmos DB כשמודל ה-consistency או ה-scale שלהם הוא לב המוצר</td></tr>
<tr><td>Object storage</td><td>API תואם S3 בתוך client library פנימית; פורמטים פתוחים (Parquet, Iceberg)</td><td>פיצ'רים native (lifecycle, אירועים) מאחורי interface משלך</td></tr>
<tr><td>Observability</td><td>SDKs ו-Collector של OpenTelemetry; הספק הוא backend שאפשר להחליף</td><td>תמיד כלים native ללוגים של ה-control plane (CloudTrail, Activity Log, Audit Logs)</td></tr>
<tr><td>Messaging</td><td>פרוטוקול Kafka (MSK, ה-endpoint התואם Kafka של Event Hubs, Managed Kafka) או interface פנימי דק</td><td>SQS/Service Bus/Pub/Sub כשפשטות תפעולית מנצחת ניידות</td></tr>
<tr><td>Identity</td><td>Federation ב-OIDC/SAML מ-IdP אחד; workload identity federation במקום keys סטטיים</td><td>IAM native בתוך הענן הוא בלתי נמנע; שמור את ה-policies בקוד</td></tr>
</table>
<p>היזהר מ"דבק proprietary": עשרות Step Functions קטנים, Logic Apps, חוקי EventBridge ו-triggers שצמודים ל-IAM, מחווטים ישר לתוך הלוגיקה העסקית. כל אחד זול להוסיף, וביחד הם מה שגורם למיגרציה לקחת שנה. החזק את הדבק הזה מאחורי מספר קטן של interfaces פנימיים, או קבל אותו במודע.</p>
<blockquote>💡 מהעולם האמיתי: "תרגיל יציאה" רבעוני עולה יום: משחזרים את גיבוי ה-Postgres של אתמול ודגימה של bucket אחד לתוך ה-free tier של ענן אחר עם ה-modules של Terraform שלך, ומודדים כמה זמן זה לקח. אם זה לוקח יום, האופציה שלך אמיתית. אם אף אחד לא מצליח להריץ את זה, ה-"תמיד נוכל לעבור" שלך הוא אמונה, לא תוכנית.</blockquote>`
      }
    },
    {
      h: { en: "The one-page decision record", he: "ה-decision record בעמוד אחד" },
      body: {
        en: `<p>The output of this process is an ADR (architecture decision record) that fits on one page and survives a new CTO:</p>
<pre>ADR-007: Primary cloud for Files platform
Status:    Accepted (2026-04-14)
Decision:  Google Cloud as the single primary cloud. Entra ID stays the IdP.
Filtered out:   none (all passed EU + IL residency, SOC 2 / ISO 27001 scope)
Scores:    GCP 4.30 / Azure 3.95 / AWS 3.65 (matrix in appendix A)
Sensitivity:    team-skills weight 25 -> GCP 4.10 vs Azure 4.05 (tie);
                tie broken on data fit (Spanner) and GPU quota in hand
Costs accepted: GCP training for 2 engineers + 3-month partner;
                Workforce Identity Federation to Entra ID
Portability:    Terraform modules, GKE + Helm, OpenTelemetry,
                Spanner is the one accepted lock-in (metadata only)
Revisit if:     egress &gt; $25k/month, OR a top-5 customer requires AWS,
                OR Spanner cost &gt; 20% of infra bill for 2 quarters</pre>
<p>The "revisit if" line is the part people skip and the part that matters most. It turns the decision from a belief into a hypothesis with a tripwire.</p>`,
        he: `<p>התוצר של התהליך הוא ADR (architecture decision record) שנכנס בעמוד אחד ושורד גם CTO חדש:</p>
<pre>ADR-007: Primary cloud for Files platform
Status:    Accepted (2026-04-14)
Decision:  Google Cloud as the single primary cloud. Entra ID stays the IdP.
Filtered out:   none (all passed EU + IL residency, SOC 2 / ISO 27001 scope)
Scores:    GCP 4.30 / Azure 3.95 / AWS 3.65 (matrix in appendix A)
Sensitivity:    team-skills weight 25 -> GCP 4.10 vs Azure 4.05 (tie);
                tie broken on data fit (Spanner) and GPU quota in hand
Costs accepted: GCP training for 2 engineers + 3-month partner;
                Workforce Identity Federation to Entra ID
Portability:    Terraform modules, GKE + Helm, OpenTelemetry,
                Spanner is the one accepted lock-in (metadata only)
Revisit if:     egress &gt; $25k/month, OR a top-5 customer requires AWS,
                OR Spanner cost &gt; 20% of infra bill for 2 quarters</pre>
<p>שורת ה-"Revisit if" היא החלק שאנשים מדלגים עליו, והיא החלק הכי חשוב. היא הופכת את ההחלטה מאמונה להשערה עם tripwire.</p>`
      }
    }
  ],
  diagram: `Candidates: AWS  Azure  GCP  OCI  Hetzner  on-prem
        |
        v
[1] HARD CONSTRAINTS (pass/fail, with source)
    residency+regions | compliance scope | IdP / enterprise deal
    must-have service | GPU quota approved | support tier
        |   (OCI, Hetzner, on-prem dropped: no managed X / no IL region / ops cost)
        v
[2] WEIGHTED MATRIX (weights fixed first, real quotes)
    AWS 3.65    Azure 3.95    GCP 4.30
        |
        v
[3] SENSITIVITY: +/-10 weight points -> does the winner flip?
        |-- flips  -> TIE: break on reversibility + team at 3 AM
        |-- stable -> decision
        v
[4] ADR: decision + costs accepted + accepted lock-in + "revisit if"
        v
[5] Decide BEFORE customer data lands (switch cost ~ data x proprietary glue)`,
  handsOn: [
    {
      cmd: "aws ec2 describe-regions --all-regions --query \"Regions[].[RegionName,OptInStatus]\" --output table",
      what: {
        en: "List every AWS region including opt-in ones (il-central-1, me-central-1). An opt-in region must be enabled per account before you can use it; check it before you promise residency.",
        he: "מציג את כל ה-regions של AWS, כולל אלה שדורשים opt-in (il-central-1, me-central-1). Region כזה צריך להפעיל לכל account לפני שאפשר להשתמש בו, אז בדוק את זה לפני שאתה מבטיח residency."
      }
    },
    {
      cmd: "aws service-quotas get-service-quota --service-code ec2 --quota-code L-DB2E81BA --region eu-central-1",
      what: {
        en: "Read your vCPU quota for running On-Demand G and VT instances (GPU) in Frankfurt. A default of 0 or a tiny number is common on new accounts; request an increase on day 1 of planning.",
        he: "קורא את ה-quota של vCPUs ל-instances מסוג G ו-VT (GPU) ב-On-Demand בפרנקפורט. ברירת מחדל של 0 או מספר זעום נפוצה ב-accounts חדשים, אז הגש בקשת הגדלה ביום הראשון של התכנון."
      }
    },
    {
      cmd: "gcloud compute regions describe europe-west4 --format=\"table(quotas.metric,quotas.limit,quotas.usage)\" | grep -i gpu",
      what: {
        en: "Show GPU quotas (NVIDIA_L4_GPUS, NVIDIA_H100_GPUS, PREEMPTIBLE_...) for a GCP region next to current usage. Pair it with gcloud compute accelerator-types list --filter=\"zone:europe-west4-a\" to see which GPU types the zones actually have.",
        he: "מציג quotas של GPU (NVIDIA_L4_GPUS, NVIDIA_H100_GPUS, PREEMPTIBLE_...) ב-region של GCP לצד השימוש הנוכחי. שלב את זה עם gcloud compute accelerator-types list --filter=\"zone:europe-west4-a\" כדי לראות אילו סוגי GPU באמת קיימים ב-zones."
      }
    },
    {
      cmd: "az vm list-usage --location westeurope -o table | grep -iE \"NC|ND|NV\"",
      what: {
        en: "Show Azure vCPU quota per VM family in West Europe; the NC/ND/NV families are the GPU ones. CurrentValue next to Limit tells you how much room you really have, and az quota or the portal handles increase requests.",
        he: "מציג את ה-quota של vCPUs לכל משפחת VMs ב-West Europe ב-Azure; המשפחות NC/ND/NV הן משפחות ה-GPU. ה-CurrentValue לצד ה-Limit מראה כמה מקום באמת יש לך, ובקשות הגדלה עוברות דרך az quota או הפורטל."
      }
    },
    {
      cmd: "infracost breakdown --path ./envs/prod --format table",
      what: {
        en: "Price a Terraform plan before anything is created: monthly cost per resource, with a usage file for variable items (egress GB, requests). Run it on the same architecture expressed for two providers to turn \"cheaper\" into a number.",
        he: "מתמחר תוכנית Terraform לפני שנוצר משהו: עלות חודשית לכל משאב, עם usage file לפריטים משתנים (GB של egress, בקשות). הרץ את זה על אותה ארכיטקטורה בשני ספקים כדי להפוך \"זול יותר\" למספר."
      }
    }
  ],
  mnemonic: {
    en: "Filter, Score, Flip, Freeze: filter on hard constraints, score with fixed weights, check whether a plausible weight change flips the winner, and freeze the decision before data lands (with a \"revisit if\" tripwire).",
    he: "סנן, נקד, הפוך, הקפא: סנן לפי דרישות קשיחות, נקד עם משקלות קבועים מראש, בדוק אם שינוי סביר במשקלות הופך את המנצח, והקפא את ההחלטה לפני שהדאטה נוחת (עם tripwire של \"revisit if\")."
  },
  pitfalls: [
    {
      en: "Scoring a hard constraint. Giving a provider without a German region \"2/5 on residency\" lets a big score elsewhere carry it to victory, and you discover the problem in the customer's security review.",
      he: "לנקד דרישה קשיחה. לתת לספק בלי region בגרמניה \"2/5 על residency\" מאפשר לציון גבוה במקום אחר לסחוב אותו לניצחון, ואתה מגלה את הבעיה ב-security review של הלקוח."
    },
    {
      en: "Setting weights after seeing scores. People unconsciously tune weights until their favourite wins. Fix weights first, with the people who own the outcome, and record them.",
      he: "לקבוע משקלות אחרי שרואים ציונים. אנשים מכווננים משקלות בלי לשים לב עד שהמועדף שלהם מנצח. קבע משקלות קודם, עם האנשים שאחראים על התוצאה, ותעד אותם."
    },
    {
      en: "Planning on list prices and assumed quotas. Real offers (credits, commits) move cost scores by 1 to 2 points, and a GPU quota stuck in \"pending\" can kill a roadmap. Get quotes and file quota requests during planning, not after.",
      he: "לתכנן לפי מחירון ו-quotas מונחים. הצעות אמיתיות (קרדיטים, התחייבויות) מזיזות את ציון העלות בנקודה-שתיים, ו-quota של GPU שתקוע ב-\"pending\" יכול להרוג roadmap. השג הצעות והגש בקשות quota בזמן התכנון, לא אחריו."
    },
    {
      en: "Going multi-cloud \"to avoid lock-in\" without a named driver. You pay the portability tax, double expertise and egress every month to insure against a risk you never priced; multi-region in one cloud covers most real outages.",
      he: "ללכת על multi-cloud \"כדי להימנע מ-lock-in\" בלי מניע עם שם. אתה משלם כל חודש מס ניידות, מומחיות כפולה ו-egress כדי לבטח סיכון שאף פעם לא תמחרת, ו-multi-region בענן אחד מכסה את רוב ההשבתות האמיתיות."
    }
  ],
  interview: [
    {
      q: {
        en: "You are the founding principal engineer. How do you choose the cloud for a new SaaS product?",
        he: "אתה ה-principal engineer הראשון בחברה. איך אתה בוחר ענן למוצר SaaS חדש?"
      },
      a: {
        en: "Three passes. First, hard constraints with sources: residency and regions, compliance scope for the specific services, existing identity and enterprise agreements, any must-have managed service, GPU quota actually approved, support tier. Anyone failing is out. Second, a weighted matrix with weights agreed before scoring (data fit, team skills, identity, AI capacity, 3-year cost with real quotes, Kubernetes maturity, support), each score justified in one line. Third, a sensitivity check: if a plausible weight change flips the winner, treat it as a tie and break it on reversibility and who can run it at 3 AM. I decide before customer data lands, default to one primary cloud, and write an ADR with the accepted lock-in and a \"revisit if\" tripwire.",
        he: "שלושה מעברים. קודם, דרישות קשיחות עם מקור: residency ו-regions, היקף ה-compliance לשירותים הספציפיים, identity והסכמים ארגוניים קיימים, שירות מנוהל שאין בלעדיו, quota של GPU שבאמת אושר, רמת support. מי שנכשל, בחוץ. שנית, מטריצה משוקללת עם משקלות שהוסכמו לפני הניקוד (התאמת דאטה, כישורי צוות, identity, קיבולת AI, עלות לשלוש שנים עם הצעות אמיתיות, בגרות Kubernetes, support), וכל ציון מוצדק בשורה. שלישית, בדיקת רגישות: אם שינוי סביר במשקלות הופך את המנצח, זה תיקו, ושוברים אותו לפי הפיכות ולפי מי יודע להפעיל את זה בשלוש בלילה. אני מחליט לפני שדאטה של לקוחות נוחת, ברירת המחדל היא ענן ראשי אחד, וכותב ADR עם ה-lock-in שהתקבל ועם tripwire של \"revisit if\"."
      }
    },
    {
      q: {
        en: "The CEO says: \"Let's be multi-cloud so we are never locked in.\" What do you answer?",
        he: "ה-CEO אומר: \"בוא נהיה multi-cloud כדי שלעולם לא נהיה נעולים.\" מה אתה עונה?"
      },
      a: {
        en: "I ask which level and which risk. Active-active across clouds costs roughly 1.5x to 2x, forces lowest-common-denominator services and double on-call expertise, and adds permanent cross-cloud egress. Most outages it protects against are already covered by multi-region in one cloud. If the real risk is commercial or regulatory (pricing leverage, a DORA exit plan, a customer requirement), the cheaper answers are: portable foundations (Terraform, Kubernetes, PostgreSQL-compatible data, OpenTelemetry), one accepted lock-in where it saves a team, a tested backup restore in a second cloud, and a quarterly exit drill. I would propose that, with the cost of each option side by side.",
        he: "אני שואל איזו רמה ואיזה סיכון. Active-active בין עננים עולה בערך פי 1.5 עד פי 2, מכריח שירותים במכנה המשותף הנמוך ומומחיות on-call כפולה, ומוסיף egress קבוע בין עננים. רוב ההשבתות שהוא מגן מפניהן כבר מכוסות על ידי multi-region בענן אחד. אם הסיכון האמיתי הוא מסחרי או רגולטורי (כוח מיקוח במחיר, תוכנית יציאה לפי DORA, דרישה של לקוח), התשובות הזולות יותר הן: יסודות ניידים (Terraform, Kubernetes, דאטה תואם PostgreSQL, OpenTelemetry), lock-in אחד מקובל איפה שהוא חוסך צוות, שחזור גיבוי שנבדק בענן שני, ותרגיל יציאה רבעוני. הייתי מציע את זה, עם העלות של כל אפשרות זו לצד זו."
      }
    },
    {
      q: {
        en: "Six months after launch, a better offer arrives from another cloud. How do you decide whether to move?",
        he: "חצי שנה אחרי ה-launch מגיעה הצעה טובה יותר מענן אחר. איך אתה מחליט אם לעבור?"
      },
      a: {
        en: "Compare the saving against the full switching cost, not against egress. Switching cost is roughly data volume times proprietary integration: re-engineering the services that have no equivalent, dual running for one to three quarters, re-certifying compliance, retraining on-call, and migration risk to SLAs. Egress for a full exit is often waived now. If the 3-year saving does not clearly exceed that cost with margin, use the offer as negotiation leverage with the current provider instead. Check the ADR's \"revisit if\" conditions; if none fired, the bar for moving is high by design.",
        he: "משווים את החיסכון לעלות המעבר המלאה, לא ל-egress. עלות המעבר היא בערך נפח הדאטה כפול עומק האינטגרציה ה-proprietary: הנדסה מחדש של שירותים בלי מקבילה, הרצה כפולה לרבעון עד שלושה, הסמכת compliance מחדש, הכשרה מחדש של ה-on-call, וסיכון ל-SLAs במהלך המיגרציה. ה-egress ביציאה מלאה לרוב מבוטל היום. אם החיסכון לשלוש שנים לא עולה בבירור על העלות הזאת עם מרווח, משתמשים בהצעה ככוח מיקוח מול הספק הנוכחי. בודקים את תנאי ה-\"revisit if\" ב-ADR: אם אף אחד לא נדלק, הרף למעבר גבוה בכוונה."
      }
    }
  ],
  quiz: [
    {
      q: {
        en: "A key customer contract requires all data to stay in Switzerland. One provider has no Swiss region but scores highest overall in your matrix. What do you do?",
        he: "חוזה עם לקוח מרכזי מחייב שכל הדאטה יישאר בשווייץ. לספק אחד אין region בשווייץ, אבל הוא מקבל את הציון הכולל הגבוה ביותר במטריצה. מה אתה עושה?"
      },
      options: [
        { en: "Keep it and lower its residency score to 1", he: "משאירים אותו ומורידים לו את ציון ה-residency ל-1" },
        { en: "Remove it before scoring: residency is a hard constraint, not a weighted criterion", he: "מוציאים אותו לפני הניקוד: residency היא דרישה קשיחה, לא קריטריון משוקלל" },
        { en: "Choose it and serve Swiss traffic through a CDN edge in Zurich", he: "בוחרים בו ומגישים את התעבורה השווייצרית דרך CDN edge בציריך" },
        { en: "Raise the residency weight to 40 and rescore", he: "מעלים את משקל ה-residency ל-40 ומנקדים מחדש" }
      ],
      answer: 1,
      explain: {
        en: "Hard constraints filter, they do not score. A CDN edge caches content but the data still lives elsewhere, and reweighting just lets another strong score compensate for an illegal option.",
        he: "דרישות קשיחות מסננות, הן לא מנקדות. CDN edge שומר cache, אבל הדאטה עדיין יושב במקום אחר, ושינוי משקלות רק מאפשר לציון חזק אחר לפצות על אפשרות שאסורה בכלל."
      }
    },
    {
      q: {
        en: "Your matrix gives GCP 4.30 and Azure 3.95. Moving 10 points of weight from data fit to team skills gives GCP 4.10 and Azure 4.05. How should you read this?",
        he: "המטריצה שלך נותנת ל-GCP ציון 4.30 ול-Azure ציון 3.95. העברה של 10 נקודות משקל מהתאמת דאטה לכישורי צוות נותנת GCP 4.10 ו-Azure 4.05. איך צריך לקרוא את זה?"
      },
      options: [
        { en: "GCP wins in both cases, so the decision is robust and needs no further discussion", he: "GCP מנצח בשני המקרים, אז ההחלטה יציבה ולא צריך דיון נוסף" },
        { en: "The matrix is broken and should be discarded", he: "המטריצה שבורה וצריך לזרוק אותה" },
        { en: "It is effectively a tie under plausible weights; break it explicitly on reversibility, team operability and the hard facts behind the scores", he: "בפועל זה תיקו תחת משקלות סבירים; שוברים אותו במפורש לפי הפיכות, יכולת הצוות להפעיל, והעובדות הקשות שמאחורי הציונים" },
        { en: "Azure should win because team skills always matter most", he: "Azure צריך לנצח כי כישורי צוות תמיד הכי חשובים" }
      ],
      answer: 2,
      explain: {
        en: "A 0.05 gap is noise. The sensitivity check tells you the matrix cannot decide on its own; you then decide consciously and record why, instead of pretending the spreadsheet chose.",
        he: "פער של 0.05 הוא רעש. בדיקת הרגישות אומרת לך שהמטריצה לא יכולה להכריע לבד. מכאן אתה מחליט במודע ומתעד למה, במקום להעמיד פנים שה-spreadsheet בחר."
      }
    },
    {
      q: {
        en: "When is switching the primary cloud cheapest?",
        he: "מתי הכי זול להחליף את הענן הראשי?"
      },
      options: [
        { en: "Right after launch, because providers waive egress for leaving customers", he: "מיד אחרי ה-launch, כי ספקים מוותרים על egress ללקוחות שעוזבים" },
        { en: "During design, before customer data and proprietary services are wired in", he: "בזמן התכנון, לפני שדאטה של לקוחות ושירותים proprietary מחווטים פנימה" },
        { en: "After you reach scale, because the discount is bigger", he: "אחרי שמגיעים ל-scale, כי ההנחה גדולה יותר" },
        { en: "It costs the same at any stage if you use Terraform", he: "זה עולה אותו דבר בכל שלב אם משתמשים ב-Terraform" }
      ],
      answer: 1,
      explain: {
        en: "Switching cost grows with data gravity and proprietary glue. Egress waivers help, but egress was never the main cost; re-engineering, dual running and re-certification are. Terraform makes infra portable, not your data or your integrations.",
        he: "עלות המעבר גדלה עם ה-data gravity ועם דבק ה-proprietary. ויתור על egress עוזר, אבל ה-egress אף פעם לא היה העלות העיקרית. הנדסה מחדש, הרצה כפולה והסמכה מחדש הם העלות. Terraform הופך את התשתית לניידת, לא את הדאטה ולא את האינטגרציות."
      }
    },
    {
      q: {
        en: "Which situation most clearly justifies running a DR environment in a second cloud?",
        he: "איזה מצב הכי מצדיק בבירור להריץ סביבת DR בענן שני?"
      },
      options: [
        { en: "The team wants experience with another provider", he: "הצוות רוצה ניסיון עם ספק נוסף" },
        { en: "Protecting against a single availability zone failure", he: "הגנה מפני נפילה של availability zone אחד" },
        { en: "An EU financial-services customer base whose regulator requires a documented, tested exit strategy from critical ICT providers (DORA)", he: "בסיס לקוחות של שירותים פיננסיים באירופה, שהרגולטור שלהם מחייב תוכנית יציאה מתועדת ונבדקת מספקי ICT קריטיים (DORA)" },
        { en: "General desire to avoid vendor lock-in", he: "רצון כללי להימנע מ-vendor lock-in" }
      ],
      answer: 2,
      explain: {
        en: "Multi-cloud DR is justified by a named driver such as a regulatory exit requirement. A zone failure is handled by multi-AZ in one cloud, and \"avoid lock-in\" or skill-building are not drivers worth a permanent 10% to 30% extra cost.",
        he: "DR בענן נוסף מוצדק כשיש מניע עם שם, כמו דרישת יציאה רגולטורית. נפילת zone מטופלת עם multi-AZ בענן אחד, ו-\"להימנע מ-lock-in\" או לבנות ניסיון הם לא מניעים ששווים עלות נוספת קבועה של 10% עד 30%."
      }
    }
  ],
  related: ["cloud-big3-services-compare", "cloud-provider-map", "cloud-regions-azs", "cloud-landing-zones", "staff-design-docs", "plan-product-infra-blueprint", "plan-environments-namespaces"]
});

INFRA.lessons.push({
  id: "plan-environments-namespaces",
  track: "principal",
  order: 182,
  icon: "🗂️",
  level: 3,
  minutes: 22,
  title: {
    en: "Environments, Accounts, Clusters and Namespaces: Planning the Isolation Layout",
    he: "סביבות, accounts, clusters ו-namespaces: לתכנן את מפת הבידוד"
  },
  tldr: {
    en: "Isolation is a ladder: organization, account/subscription/project, cluster, namespace, workload. Each rung is a harder wall with a higher cost. Put the strongest wall (separate accounts) between prod and everything else, because blast radius, IAM and billing all follow it. Share clusters inside non-prod, split prod clusters by region and only split further for a named reason (compliance, noisy neighbours, upgrade blast radius, size). Inside a cluster, a namespace is a policy unit: it always ships with quota, limits, RBAC, default-deny network policy and Pod Security labels. Build one artifact, promote it through environments by Git, and never let prod data into dev.",
    he: "בידוד הוא סולם: organization, account/subscription/project, cluster, namespace, workload. כל שלב הוא חומה קשיחה יותר עם עלות גבוהה יותר. שים את החומה הכי חזקה (accounts נפרדים) בין prod לכל השאר, כי ה-blast radius, ה-IAM וה-billing הולכים אחריה. שתף clusters בתוך ה-non-prod, פצל clusters של prod לפי region, ופצל עוד רק כשיש סיבה עם שם (compliance, noisy neighbours, blast radius של upgrade, גודל). בתוך cluster, namespace הוא יחידת policy: הוא תמיד מגיע עם quota, limits, RBAC, network policy של default-deny ו-labels של Pod Security. בונים artifact אחד, מקדמים אותו בין הסביבות דרך Git, ואף פעם לא נותנים לדאטה של prod להגיע ל-dev."
  },
  analogy: {
    en: "Think of a hospital campus. Separate buildings (accounts) for the operating theatres and the training wing, so a fire drill in training never closes surgery. Inside a building, floors (clusters) share plumbing and elevators. On each floor, rooms (namespaces) have a lock, a capacity sign, a list of who may enter and doors that are closed unless someone opens them on purpose. Patients move from the ward to surgery with the same chart; only the room and the staff change. And nobody brings real patient files to the training wing.",
    he: "תחשוב על קמפוס של בית חולים. בניינים נפרדים (accounts) לחדרי הניתוח ולאגף ההדרכה, כדי שתרגיל אש באגף ההדרכה לעולם לא יסגור את חדרי הניתוח. בתוך בניין, הקומות (clusters) חולקות צנרת ומעליות. בכל קומה, לחדרים (namespaces) יש מנעול, שלט תפוסה, רשימה של מי מורשה להיכנס ודלתות שסגורות אלא אם מישהו פותח אותן בכוונה. מטופל עובר מהמחלקה לניתוח עם אותו תיק; רק החדר והצוות מתחלפים. ואף אחד לא מביא תיקים רפואיים אמיתיים לאגף ההדרכה."
  },
  sections: [
    {
      h: { en: "Which environments, and why each one exists", he: "אילו סביבות, ולמה כל אחת קיימת" },
      body: {
        en: `<p>Every environment costs money, maintenance and drift. Each one must answer "what question does this environment answer that no other can?". If you cannot name it, do not build it.</p>
<table>
<tr><th>Environment</th><th>Question it answers</th><th>Data</th><th>Lifetime</th><th>Keep or skip?</th></tr>
<tr><td>Local</td><td>Does my change compile and pass unit/contract tests in seconds?</td><td>Fixtures, containers (kind, Tilt, docker compose)</td><td>Developer laptop</td><td>Always</td></tr>
<tr><td>Preview (per PR)</td><td>Does this branch work end to end, and can product/QA click it?</td><td>Seeded synthetic data</td><td>Created on PR open, deleted on merge or after 24-72h</td><td>Yes once more than ~10 engineers share dev</td></tr>
<tr><td>Dev (integration)</td><td>Does main integrate with the other services' main?</td><td>Synthetic, resettable</td><td>Long-lived, can break</td><td>Yes; may merge with preview at small scale</td></tr>
<tr><td>Staging</td><td>Will this exact artifact deploy and run on a prod-shaped topology (same IAM model, same network policies, same managed services, smaller size)?</td><td>Synthetic or masked; never raw prod</td><td>Long-lived, should be green</td><td>Yes; it is the last rehearsal</td></tr>
<tr><td>Perf / load</td><td>Does it meet latency and throughput targets at 1x to 3x peak?</td><td>Generated at prod-like volume</td><td>On demand, torn down after the run</td><td>Only when capacity risk is real; ephemeral beats permanent</td></tr>
<tr><td>Prod</td><td>Customers</td><td>Real</td><td>Forever</td><td>Obviously; one per region/jurisdiction</td></tr>
<tr><td>DR</td><td>Can we serve if the primary region is gone, within RTO/RPO?</td><td>Replicas/backups of prod (it <em>is</em> prod)</td><td>Warm or pilot light</td><td>Depends on RTO; treated with prod controls</td></tr>
</table>
<p>Two common anti-patterns: a long-lived <strong>QA</strong> environment that duplicates staging (merge them), and <strong>one staging per team</strong> (use preview environments instead). The more permanent environments you keep, the more they drift from prod, and drift is what makes staging lie.</p>
<blockquote>💡 Real world: the cheapest valuable upgrade for a 20 to 50 engineer company is usually preview environments, not another permanent environment. A namespace per PR in the shared non-prod cluster, created by CI and garbage-collected by TTL, costs a few dollars per PR-day.</blockquote>`,
        he: `<p>כל סביבה עולה כסף, תחזוקה ו-drift. כל אחת חייבת לענות על השאלה "על איזו שאלה הסביבה הזאת עונה שאף סביבה אחרת לא יכולה?". אם אתה לא יכול לנסח אותה, אל תבנה אותה.</p>
<table>
<tr><th>סביבה</th><th>על איזו שאלה היא עונה</th><th>דאטה</th><th>אורך חיים</th><th>להשאיר או לוותר?</th></tr>
<tr><td>Local</td><td>השינוי שלי מתקמפל ועובר unit/contract tests תוך שניות?</td><td>Fixtures, containers (kind, Tilt, docker compose)</td><td>המחשב של המפתח</td><td>תמיד</td></tr>
<tr><td>Preview (לכל PR)</td><td>ה-branch הזה עובד מקצה לקצה, ו-product או QA יכולים ללחוץ עליו?</td><td>דאטה סינתטי שנזרע מראש</td><td>נוצר כשנפתח PR, נמחק ב-merge או אחרי 24 עד 72 שעות</td><td>כן, ברגע שיותר מ-10 מהנדסים בערך חולקים את dev</td></tr>
<tr><td>Dev (אינטגרציה)</td><td>ה-main שלי משתלב עם ה-main של שאר השירותים?</td><td>סינתטי, ניתן לאיפוס</td><td>ארוך, מותר לו להישבר</td><td>כן; בקנה מידה קטן אפשר לאחד עם preview</td></tr>
<tr><td>Staging</td><td>ה-artifact המדויק הזה יעלה וירוץ על טופולוגיה בצורת prod (אותו מודל IAM, אותן network policies, אותם שירותים מנוהלים, גודל קטן יותר)?</td><td>סינתטי או ממוסך; אף פעם לא prod גולמי</td><td>ארוך, אמור להיות ירוק</td><td>כן; זו החזרה האחרונה</td></tr>
<tr><td>Perf / load</td><td>הוא עומד ביעדי latency ו-throughput בפי 1 עד פי 3 מה-peak?</td><td>נוצר בנפח דומה ל-prod</td><td>לפי דרישה, נהרס אחרי הריצה</td><td>רק כשסיכון הקיבולת אמיתי; זמני עדיף על קבוע</td></tr>
<tr><td>Prod</td><td>לקוחות</td><td>אמיתי</td><td>לתמיד</td><td>ברור; אחת לכל region או תחום שיפוט</td></tr>
<tr><td>DR</td><td>אפשר להגיש אם ה-region הראשי נעלם, בתוך ה-RTO/RPO?</td><td>Replicas או גיבויים של prod (זה <em>כן</em> prod)</td><td>Warm או pilot light</td><td>תלוי ב-RTO; מקבל את הבקרות של prod</td></tr>
</table>
<p>שני anti-patterns נפוצים: סביבת <strong>QA</strong> קבועה שמשכפלת את staging (תאחד אותן), ו-<strong>staging לכל צוות</strong> (תשתמש ב-preview environments במקום). ככל שיש יותר סביבות קבועות, הן נסחפות יותר מ-prod, וה-drift הוא מה שגורם ל-staging לשקר.</p>
<blockquote>💡 מהעולם האמיתי: השדרוג הזול והשווה ביותר לחברה של 20 עד 50 מהנדסים הוא לרוב preview environments, לא עוד סביבה קבועה. Namespace לכל PR ב-cluster המשותף של ה-non-prod, שנוצר ב-CI ונאסף אוטומטית לפי TTL, עולה כמה דולרים לכל יום-PR.</blockquote>`
      }
    },
    {
      h: { en: "Accounts, subscriptions, projects: the hard wall", he: "Accounts, subscriptions, projects: החומה הקשיחה" },
      body: {
        en: `<p>The cloud account boundary (AWS account, Azure subscription, GCP project) is the strongest wall you get cheaply. IAM policies, quotas, billing, audit logs and the blast radius of a leaked credential or a <code>terraform destroy</code> all stop there. So the rule is: <strong>at least one account per environment class, and prod never shares an account with anything that is not prod.</strong></p>
<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Grouping layer</td><td>Organizations OUs: Security, Infrastructure, Workloads/NonProd, Workloads/Prod, Sandbox, Suspended</td><td>Management groups (CAF): Platform (Identity, Management, Connectivity), Landing zones (Corp, Online), Sandbox, Decommissioned</td><td>Folders: platform, nonprod, prod, sandbox</td></tr>
<tr><td>Isolation unit</td><td>Account per env (and often per workload in prod)</td><td>Subscription per env per workload; resource groups inside for lifecycle</td><td>Project per env per workload</td></tr>
<tr><td>Guardrails at the group</td><td>SCPs (deny leaving allowed regions, deny disabling CloudTrail), RCPs</td><td>Azure Policy assigned at management group</td><td>Organization Policy constraints on folders</td></tr>
<tr><td>Shared networking</td><td>Network account with Transit Gateway or VPC sharing via RAM</td><td>Connectivity subscription with hub VNet</td><td>Shared VPC host project per env class</td></tr>
</table>
<p>Decide <em>how fine</em> to split with three questions:</p>
<ul>
<li><strong>Blast radius:</strong> if this account's admin credential leaks, what else burns? If the answer includes prod customer data, split.</li>
<li><strong>IAM simplicity:</strong> "the payments team is admin in payments-prod" is easier to audit than 40 resource-level conditions in one shared prod account.</li>
<li><strong>Billing and quotas:</strong> cost per product comes free with per-account billing; one noisy team cannot eat a shared vCPU quota.</li>
</ul>
<p>Typical sizes: a 30-engineer startup runs 6 to 10 accounts (management, security/log-archive, network, shared-services, dev, staging, prod-eu, prod-us, sandbox). A 500-engineer company runs hundreds, created by an account vending pipeline (Control Tower Account Factory, Azure subscription vending, GCP project factory in Terraform).</p>
<blockquote>⚠️ Production tip: CI deploys into prod with a role that exists only in the prod account and trusts only the prod deploy pipeline (OIDC from your CI, branch <code>main</code>, environment <code>production</code>). Humans get read-only in prod by default and break-glass access with approval and audit.</blockquote>`,
        he: `<p>הגבול של account בענן (AWS account, Azure subscription, GCP project) הוא החומה הכי חזקה שמקבלים בזול. IAM policies, quotas, billing, audit logs וה-blast radius של credential שדלף או של <code>terraform destroy</code>, כולם נעצרים שם. לכן הכלל: <strong>לפחות account אחד לכל סוג סביבה, ו-prod אף פעם לא חולק account עם משהו שהוא לא prod.</strong></p>
<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>שכבת הקיבוץ</td><td>OUs ב-Organizations: Security, Infrastructure, Workloads/NonProd, Workloads/Prod, Sandbox, Suspended</td><td>Management groups (CAF): Platform (Identity, Management, Connectivity), Landing zones (Corp, Online), Sandbox, Decommissioned</td><td>Folders: platform, nonprod, prod, sandbox</td></tr>
<tr><td>יחידת הבידוד</td><td>Account לכל סביבה (ובפרודקשן הרבה פעמים לכל workload)</td><td>Subscription לכל סביבה לכל workload; resource groups בפנים לניהול מחזור חיים</td><td>Project לכל סביבה לכל workload</td></tr>
<tr><td>Guardrails ברמת הקבוצה</td><td>SCPs (חסימת יציאה מה-regions המותרים, חסימת כיבוי CloudTrail), RCPs</td><td>Azure Policy שמוצמד ל-management group</td><td>Organization Policy constraints על folders</td></tr>
<tr><td>רשת משותפת</td><td>Network account עם Transit Gateway או VPC sharing דרך RAM</td><td>Connectivity subscription עם hub VNet</td><td>Host project של Shared VPC לכל סוג סביבה</td></tr>
</table>
<p>כמה <em>דק</em> לפצל, מחליטים עם שלוש שאלות:</p>
<ul>
<li><strong>Blast radius:</strong> אם ה-credential של ה-admin ב-account הזה דולף, מה עוד נשרף? אם התשובה כוללת דאטה של לקוחות ב-prod, פצל.</li>
<li><strong>פשטות IAM:</strong> "צוות ה-payments הוא admin ב-payments-prod" הרבה יותר קל ל-audit מ-40 תנאים ברמת משאב בתוך account אחד משותף של prod.</li>
<li><strong>Billing ו-quotas:</strong> עלות לכל מוצר מגיעה בחינם עם billing לכל account, וצוות רועש אחד לא יכול לאכול quota משותף של vCPUs.</li>
</ul>
<p>גדלים טיפוסיים: סטארטאפ של 30 מהנדסים מריץ 6 עד 10 accounts (management, security/log-archive, network, shared-services, dev, staging, prod-eu, prod-us, sandbox). חברה של 500 מהנדסים מריצה מאות, שנוצרים ב-pipeline של account vending (Control Tower Account Factory, subscription vending ב-Azure, project factory ב-Terraform ל-GCP).</p>
<blockquote>⚠️ טיפ מפרודקשן: ה-CI מבצע deploy ל-prod עם role שקיים רק ב-account של prod וסומך רק על ה-pipeline של ה-deploy ל-prod (OIDC מה-CI שלך, branch <code>main</code>, environment <code>production</code>). בני אדם מקבלים כברירת מחדל read-only ב-prod, וגישת break-glass עם אישור ו-audit.</blockquote>`
      }
    },
    {
      h: { en: "Clusters: how many, and when to split", he: "Clusters: כמה, ומתי לפצל" },
      body: {
        en: `<p>Start from the smallest number that respects the account wall: <strong>one non-prod cluster per region and one prod cluster per region</strong>, each in its own account. Then split only when a trigger fires:</p>
<table>
<tr><th>Split trigger</th><th>Signal</th><th>Typical split</th></tr>
<tr><td>Compliance scope</td><td>PCI, HIPAA or a government customer needs an auditable boundary; you do not want 200 services in PCI scope</td><td>Dedicated <code>prd-euw1-pci</code> cluster in its own account</td></tr>
<tr><td>Noisy neighbours</td><td>Batch, ML training or GPU jobs starve latency-critical APIs despite quotas and priority classes</td><td>Separate batch/GPU cluster, or dedicated node pools with taints first</td></tr>
<tr><td>Upgrade blast radius</td><td>A Kubernetes minor upgrade (every ~4 months) or CNI change would risk every customer at once</td><td>Two prod clusters per region (cells), upgrade one, soak, then the other</td></tr>
<tr><td>Size and control-plane load</td><td>Past roughly 500 to 1,000 nodes or 20k+ pods, upgrades take hours, etcd and API latency grow, and one bad controller hurts everyone</td><td>Split by domain or cell well before provider limits (GKE Standard up to 15k nodes, EKS and AKS lower in practice)</td></tr>
<tr><td>Tenant isolation</td><td>An enterprise customer pays for dedicated infrastructure, or runs untrusted code</td><td>Cluster (or account) per dedicated tenant</td></tr>
<tr><td>Different lifecycle</td><td>Platform tools (CI runners, observability) must not die with the workload cluster</td><td>Separate <code>mgmt</code>/tools cluster</td></tr>
</table>
<p>Each extra cluster costs a control plane (about $73/month on EKS and GKE Standard, free tier on AKS), duplicated add-ons (ingress, cert-manager, external-dns, observability agents, policy engine), another upgrade every few months and more on-call surface. If you cannot run upgrades with automation and GitOps, you cannot afford many clusters.</p>
<p>Cluster naming that survives growth: <code>&lt;env&gt;-&lt;region&gt;-&lt;purpose&gt;-&lt;nn&gt;</code>, for example <code>prd-euw1-core-01</code>, <code>stg-euw1-core-01</code>, <code>prd-use1-gpu-01</code>. The number lets you build <code>-02</code> next to it for a blue/green cluster upgrade.</p>
<blockquote>💡 Real world: "one giant shared cluster for all environments" saves a few hundred dollars a month and costs you a real outage the first time a staging load test fills the nodes or a dev CRD upgrade breaks a prod operator. The account wall between prod and non-prod is not optional.</blockquote>`,
        he: `<p>מתחילים מהמספר הקטן ביותר שמכבד את חומת ה-account: <strong>cluster אחד ל-non-prod בכל region ו-cluster אחד ל-prod בכל region</strong>, כל אחד ב-account משלו. ואז מפצלים רק כש-trigger נדלק:</p>
<table>
<tr><th>Trigger לפיצול</th><th>הסימן</th><th>פיצול טיפוסי</th></tr>
<tr><td>היקף compliance</td><td>PCI, HIPAA או לקוח ממשלתי צריכים גבול שאפשר לבקר; אתה לא רוצה 200 שירותים בתוך ה-scope של PCI</td><td>Cluster ייעודי <code>prd-euw1-pci</code> ב-account משלו</td></tr>
<tr><td>Noisy neighbours</td><td>Batch, אימון ML או jobs של GPU מרעיבים APIs רגישים ל-latency למרות quotas ו-priority classes</td><td>Cluster נפרד ל-batch או ל-GPU, או קודם node pools ייעודיים עם taints</td></tr>
<tr><td>Blast radius של upgrade</td><td>Upgrade של minor ב-Kubernetes (בערך כל 4 חודשים) או שינוי CNI יסכנו את כל הלקוחות בבת אחת</td><td>שני clusters של prod לכל region (cells): משדרגים אחד, מחכים, ואז את השני</td></tr>
<tr><td>גודל ועומס על ה-control plane</td><td>מעבר לבערך 500 עד 1,000 nodes או 20k+ Pods, upgrades לוקחים שעות, ה-latency של etcd ושל ה-API עולה, ו-controller גרוע אחד פוגע בכולם</td><td>פיצול לפי domain או cell הרבה לפני המגבלות של הספק (GKE Standard עד 15k nodes, EKS ו-AKS נמוך יותר בפועל)</td></tr>
<tr><td>בידוד tenants</td><td>לקוח enterprise משלם על תשתית ייעודית, או מריץ קוד לא מהימן</td><td>Cluster (או account) לכל tenant ייעודי</td></tr>
<tr><td>מחזור חיים שונה</td><td>כלי platform (CI runners, observability) לא אמורים למות יחד עם ה-cluster של ה-workloads</td><td>Cluster נפרד ל-<code>mgmt</code> או לכלים</td></tr>
</table>
<p>כל cluster נוסף עולה control plane (בערך $73 לחודש ב-EKS וב-GKE Standard, tier חינמי ב-AKS), add-ons משוכפלים (ingress, cert-manager, external-dns, agents של observability, policy engine), עוד upgrade כל כמה חודשים ועוד שטח ל-on-call. אם אתה לא מריץ upgrades עם אוטומציה ו-GitOps, אין לך תקציב להרבה clusters.</p>
<p>שמות ל-clusters ששורדים צמיחה: <code>&lt;env&gt;-&lt;region&gt;-&lt;purpose&gt;-&lt;nn&gt;</code>, למשל <code>prd-euw1-core-01</code>, <code>stg-euw1-core-01</code>, <code>prd-use1-gpu-01</code>. המספר מאפשר לבנות <code>-02</code> לידו בשביל upgrade של cluster בשיטת blue/green.</p>
<blockquote>💡 מהעולם האמיתי: "cluster ענק ומשותף לכל הסביבות" חוסך כמה מאות דולרים בחודש, ועולה לך השבתה אמיתית בפעם הראשונה ש-load test ב-staging ממלא את ה-nodes, או ש-upgrade של CRD ב-dev שובר operator של prod. החומה של ה-account בין prod ל-non-prod היא לא אופציונלית.</blockquote>`
      }
    },
    {
      h: { en: "Namespace strategy: choosing the unit", he: "אסטרטגיית namespaces: לבחור את היחידה" },
      body: {
        en: `<p>A namespace is where Kubernetes attaches RBAC, quotas, limit defaults, network policy and Pod Security. So choose the unit by asking: <strong>who owns the policy?</strong></p>
<table>
<tr><th>Strategy</th><th>Example</th><th>Pros</th><th>Cons</th><th>Choose when</th></tr>
<tr><td>Per team</td><td><code>team-sharing</code></td><td>Few namespaces; RBAC maps to org chart; one quota per team</td><td>Services of one team share a blast radius and network policy; reorgs mean migrations</td><td>Small orgs, teams with 2 to 4 tightly coupled services</td></tr>
<tr><td>Per service</td><td><code>files-api</code>, <code>thumbnailer</code></td><td>Precise network policy and quota per service; clear ownership via labels</td><td>Many namespaces (100+); RBAC must be templated</td><td>Default for microservices with a platform that templates namespaces</td></tr>
<tr><td>Per team per env (shared cluster)</td><td><code>sharing-dev</code>, <code>sharing-stg</code></td><td>One non-prod cluster serves several envs</td><td>Envs share nodes and control plane; tempting to do in prod (do not)</td><td>Non-prod only, small scale</td></tr>
<tr><td>Per tenant</td><td><code>tenant-acme</code></td><td>Per-customer quota, network isolation, easy deletion</td><td>Does not scale past a few hundred tenants; namespaces are a soft wall for untrusted code</td><td>A small number of large B2B tenants with dedicated deployments</td></tr>
<tr><td>Per PR (ephemeral)</td><td><code>pr-1423</code></td><td>Clean slate per preview, delete = cleanup</td><td>Needs TTL controller and seeded data</td><td>Preview environments</td></tr>
</table>
<p>The environment should usually <strong>not</strong> be in the namespace name in prod: <code>files-api</code> in <code>prd-euw1-core-01</code> and <code>files-api</code> in <code>stg-euw1-core-01</code>. Same manifests, different cluster. That is what makes promotion a config change, not a rename.</p>
<p>Labels carry the metadata that names cannot: <code>team</code>, <code>cost-center</code>, <code>data-classification</code>, <code>tier</code>. Cost allocation (Kubecost, OpenCost, GKE cost allocation) and policy engines (Kyverno, Gatekeeper) read them; make them required.</p>
<blockquote>⚠️ Production tip: namespaces share the kernel, the nodes and the control plane. For untrusted or customer-supplied code, a namespace is not a security boundary; use sandboxed runtimes (gVisor, Kata) and dedicated node pools at minimum, or a separate cluster or account (see <code>pr-multi-tenancy</code>).</blockquote>`,
        he: `<p>Namespace הוא המקום שאליו Kubernetes מצמיד RBAC, quotas, ברירות מחדל של limits, network policy ו-Pod Security. לכן בוחרים את היחידה לפי השאלה: <strong>למי שייך ה-policy?</strong></p>
<table>
<tr><th>אסטרטגיה</th><th>דוגמה</th><th>יתרונות</th><th>חסרונות</th><th>מתי לבחור</th></tr>
<tr><td>לפי צוות</td><td><code>team-sharing</code></td><td>מעט namespaces; ה-RBAC ממופה למבנה הארגוני; quota אחד לכל צוות</td><td>השירותים של צוות חולקים blast radius ו-network policy; ארגון מחדש אומר מיגרציה</td><td>ארגונים קטנים, צוותים עם 2 עד 4 שירותים צמודים</td></tr>
<tr><td>לפי שירות</td><td><code>files-api</code>, <code>thumbnailer</code></td><td>Network policy ו-quota מדויקים לכל שירות; בעלות ברורה דרך labels</td><td>הרבה namespaces (100+); חייבים לייצר RBAC מ-template</td><td>ברירת המחדל ל-microservices עם platform שמייצר namespaces מ-template</td></tr>
<tr><td>לפי צוות ולפי סביבה (cluster משותף)</td><td><code>sharing-dev</code>, <code>sharing-stg</code></td><td>Cluster אחד של non-prod משרת כמה סביבות</td><td>הסביבות חולקות nodes ו-control plane; מפתה לעשות את זה גם ב-prod (אל תעשה)</td><td>רק non-prod, בקנה מידה קטן</td></tr>
<tr><td>לפי tenant</td><td><code>tenant-acme</code></td><td>Quota לכל לקוח, בידוד רשת, מחיקה קלה</td><td>לא מתרחב מעבר לכמה מאות tenants; namespace הוא חומה רכה לקוד לא מהימן</td><td>מספר קטן של tenants גדולים ב-B2B עם deployments ייעודיים</td></tr>
<tr><td>לפי PR (זמני)</td><td><code>pr-1423</code></td><td>דף נקי לכל preview, מחיקה היא הניקוי</td><td>צריך TTL controller ודאטה שנזרע מראש</td><td>Preview environments</td></tr>
</table>
<p>ב-prod, הסביבה בדרך כלל <strong>לא</strong> צריכה להופיע בשם ה-namespace: <code>files-api</code> בתוך <code>prd-euw1-core-01</code> ו-<code>files-api</code> בתוך <code>stg-euw1-core-01</code>. אותם manifests, cluster אחר. זה מה שהופך promotion לשינוי config ולא לשינוי שם.</p>
<p>ה-labels נושאים את ה-metadata ששמות לא יכולים: <code>team</code>, <code>cost-center</code>, <code>data-classification</code>, <code>tier</code>. כלי הקצאת עלויות (Kubecost, OpenCost, GKE cost allocation) ו-policy engines (Kyverno, Gatekeeper) קוראים אותם, אז הפוך אותם לחובה.</p>
<blockquote>⚠️ טיפ מפרודקשן: namespaces חולקים את ה-kernel, את ה-nodes ואת ה-control plane. לקוד לא מהימן או לקוד שלקוחות מביאים, namespace הוא לא גבול אבטחה. מינימום תשתמש ב-runtimes מבודדים (gVisor, Kata) וב-node pools ייעודיים, או ב-cluster או account נפרד (ראה <code>pr-multi-tenancy</code>).</blockquote>`
      }
    },
    {
      h: { en: "The namespace kit: what every namespace ships with", he: "ערכת ה-namespace: מה כל namespace מקבל" },
      body: {
        en: `<p>A bare namespace is an empty room with no lock. A platform creates every namespace from one template (Helm chart, Kustomize base, or a Capsule/HNC/Kyverno generate rule) with these five pieces:</p>
<pre>apiVersion: v1
kind: Namespace
metadata:
  name: files-api
  labels:
    team: storage
    cost-center: cc-1042
    data-classification: confidential
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute
  namespace: files-api
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 80Gi
    limits.memory: 120Gi
    pods: "200"
    services.loadbalancers: "0"     # ingress only, no stray public LBs
    persistentvolumeclaims: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: files-api
spec:
  limits:
  - type: Container
    defaultRequest: { cpu: 100m, memory: 128Mi }
    default:        { memory: 512Mi }        # memory limit; no CPU limit by default
    max:            { cpu: "4", memory: 8Gi }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: storage-team-edit
  namespace: files-api
subjects:
- kind: Group
  name: storage-team@example.com            # from the IdP via OIDC
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit                                 # "view" in prod for humans
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: files-api
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: files-api
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: kube-system }
      podSelector:
        matchLabels: { k8s-app: kube-dns }
    ports:
    - { protocol: UDP, port: 53 }
    - { protocol: TCP, port: 53 }</pre>
<table>
<tr><th>Piece</th><th>What it prevents</th><th>Decision you must make</th></tr>
<tr><td>ResourceQuota</td><td>One namespace eating the cluster; surprise LoadBalancers</td><td>Size from current requests + 30% headroom; review quarterly</td></tr>
<tr><td>LimitRange</td><td>Pods without requests (BestEffort, first to be evicted, break scheduling)</td><td>Defaults small enough that teams set real values</td></tr>
<tr><td>RoleBinding</td><td>Everyone being cluster-admin</td><td>Groups from the IdP, never individual users; edit in non-prod, view in prod</td></tr>
<tr><td>NetworkPolicy default-deny</td><td>Lateral movement after one pod is compromised</td><td>Every allowed flow is explicit (ingress controller, DNS, the services it calls)</td></tr>
<tr><td>Pod Security labels</td><td>Privileged pods, hostPath, running as root</td><td><code>restricted</code> by default; <code>baseline</code> only with a documented exception</td></tr>
</table>
<p>NetworkPolicy only works if the CNI enforces it (Calico, Cilium, Azure NPM/Cilium, GKE Dataplane V2, VPC CNI with network policy enabled). Verify it once with a test pod; a policy that is silently ignored is worse than none.</p>`,
        he: `<p>Namespace ריק הוא חדר ריק בלי מנעול. Platform יוצר כל namespace מ-template אחד (Helm chart, Kustomize base, או חוק generate של Capsule/HNC/Kyverno) עם חמשת החלקים האלה:</p>
<pre>apiVersion: v1
kind: Namespace
metadata:
  name: files-api
  labels:
    team: storage
    cost-center: cc-1042
    data-classification: confidential
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute
  namespace: files-api
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 80Gi
    limits.memory: 120Gi
    pods: "200"
    services.loadbalancers: "0"     # ingress only, no stray public LBs
    persistentvolumeclaims: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: files-api
spec:
  limits:
  - type: Container
    defaultRequest: { cpu: 100m, memory: 128Mi }
    default:        { memory: 512Mi }        # memory limit; no CPU limit by default
    max:            { cpu: "4", memory: 8Gi }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: storage-team-edit
  namespace: files-api
subjects:
- kind: Group
  name: storage-team@example.com            # from the IdP via OIDC
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit                                 # "view" in prod for humans
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: files-api
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: files-api
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: kube-system }
      podSelector:
        matchLabels: { k8s-app: kube-dns }
    ports:
    - { protocol: UDP, port: 53 }
    - { protocol: TCP, port: 53 }</pre>
<table>
<tr><th>חלק</th><th>ממה הוא מונע</th><th>ההחלטה שאתה צריך לקבל</th></tr>
<tr><td>ResourceQuota</td><td>Namespace אחד שאוכל את ה-cluster; LoadBalancers מפתיעים</td><td>גודל לפי ה-requests הנוכחיים ועוד 30% מרווח; בדיקה כל רבעון</td></tr>
<tr><td>LimitRange</td><td>Pods בלי requests (BestEffort, ראשונים ל-eviction, שוברים את ה-scheduling)</td><td>ברירות מחדל קטנות מספיק כדי שצוותים יגדירו ערכים אמיתיים</td></tr>
<tr><td>RoleBinding</td><td>שכולם יהיו cluster-admin</td><td>Groups מה-IdP, אף פעם לא משתמשים בודדים; edit ב-non-prod, view ב-prod</td></tr>
<tr><td>NetworkPolicy של default-deny</td><td>תנועה רוחבית אחרי ש-Pod אחד נפרץ</td><td>כל זרימה מותרת היא מפורשת (ingress controller, DNS, השירותים שהוא קורא להם)</td></tr>
<tr><td>Labels של Pod Security</td><td>Pods עם privileged, hostPath, ריצה כ-root</td><td><code>restricted</code> כברירת מחדל; <code>baseline</code> רק עם חריגה מתועדת</td></tr>
</table>
<p>NetworkPolicy עובד רק אם ה-CNI אוכף אותו (Calico, Cilium, Azure NPM/Cilium, GKE Dataplane V2, VPC CNI עם network policy מופעל). תוודא את זה פעם אחת עם Pod בדיקה; policy שמתעלמים ממנו בשקט גרוע יותר מאף policy.</p>`
      }
    },
    {
      h: { en: "Promotion between environments, and keeping prod data out of dev", he: "Promotion בין סביבות, והרחקת דאטה של prod מ-dev" },
      body: {
        en: `<p><strong>Build once, promote the same artifact.</strong> CI builds an image once, tags it with the commit SHA and signs it. Every environment deploys the same digest; only configuration differs. Rebuilding per environment means staging tested something prod never runs.</p>
<pre>gitops/
  apps/files-api/
    base/                  # Deployment, Service, HPA, PDB
    overlays/
      dev/                 # replicas: 1, image: ...@sha256:9f1c...
      staging/             # replicas: 2, image: ...@sha256:9f1c...
      prod-euw1/           # replicas: 12, image: ...@sha256:7a40...
      prod-use1/           # replicas: 8,  image: ...@sha256:7a40...
  clusters/
    stg-euw1-core-01/      # Argo CD ApplicationSet -&gt; overlays/staging
    prd-euw1-core-01/      # Argo CD ApplicationSet -&gt; overlays/prod-euw1</pre>
<p>Promotion is a pull request that changes one digest from the staging overlay into the prod overlays, after automated gates pass (staging smoke tests green, error rate and latency SLOs fine for 30 minutes). Argo CD or Flux applies it; the Git history is the audit log of what ran where. Progressive delivery (Argo Rollouts, Flagger) then shifts traffic 5%, 25%, 100% inside prod with automatic rollback on SLO burn.</p>
<p><strong>What differs per environment, and where it lives:</strong></p>
<table>
<tr><th>Differs</th><th>Where</th><th>Never</th></tr>
<tr><td>Replicas, resources, HPA bounds</td><td>Overlay / Helm values</td><td>Different code paths with <code>if env == "prod"</code></td></tr>
<tr><td>Endpoints, feature flags</td><td>ConfigMap per overlay, flag service</td><td>Hardcoded in the image</td></tr>
<tr><td>Secrets</td><td>Secret manager per account (External Secrets Operator)</td><td>One secret shared by dev and prod</td></tr>
<tr><td>Data</td><td>Separate databases, separate KMS keys, per account</td><td>A prod snapshot restored to dev</td></tr>
</table>
<p><strong>Prod data never goes to dev</strong>, and the guardrail is technical, not a policy document: prod KMS keys have key policies that only prod roles can use, so a copied snapshot is unreadable elsewhere; SCPs/Org Policies deny cross-account snapshot sharing from the prod OU; dev uses synthetic data generators or a masked subset produced by a pipeline running <em>inside</em> prod (tokenise emails, drop file contents, keep shapes and volumes). This is what GDPR data minimisation and SOC 2 auditors will ask you to show.</p>
<blockquote>💡 Real world: when a bug only reproduces "with real data", the answer is a time-boxed, approved, audited access to a prod read replica from a prod bastion, not copying data down. The copy is what ends up in a breach report.</blockquote>`,
        he: `<p><strong>בונים פעם אחת, מקדמים את אותו artifact.</strong> ה-CI בונה image פעם אחת, מתייג אותו ב-SHA של ה-commit וחותם עליו. כל סביבה מבצעת deploy לאותו digest, ורק הקונפיגורציה שונה. בנייה מחדש לכל סביבה אומרת ש-staging בדק משהו ש-prod אף פעם לא מריץ.</p>
<pre>gitops/
  apps/files-api/
    base/                  # Deployment, Service, HPA, PDB
    overlays/
      dev/                 # replicas: 1, image: ...@sha256:9f1c...
      staging/             # replicas: 2, image: ...@sha256:9f1c...
      prod-euw1/           # replicas: 12, image: ...@sha256:7a40...
      prod-use1/           # replicas: 8,  image: ...@sha256:7a40...
  clusters/
    stg-euw1-core-01/      # Argo CD ApplicationSet -&gt; overlays/staging
    prd-euw1-core-01/      # Argo CD ApplicationSet -&gt; overlays/prod-euw1</pre>
<p>Promotion הוא pull request שמעביר digest אחד מה-overlay של staging ל-overlays של prod, אחרי ש-gates אוטומטיים עוברים (smoke tests ב-staging ירוקים, SLOs של error rate ו-latency תקינים במשך 30 דקות). Argo CD או Flux מחילים אותו, וההיסטוריה ב-Git היא ה-audit log של מה רץ איפה. אחר כך progressive delivery (Argo Rollouts, Flagger) מזיז תעבורה 5%, 25%, 100% בתוך prod, עם rollback אוטומטי כשה-SLO נשרף.</p>
<p><strong>מה שונה בין סביבות, ואיפה זה יושב:</strong></p>
<table>
<tr><th>מה שונה</th><th>איפה</th><th>אף פעם לא</th></tr>
<tr><td>Replicas, resources, גבולות HPA</td><td>Overlay או Helm values</td><td>נתיבי קוד שונים עם <code>if env == "prod"</code></td></tr>
<tr><td>Endpoints, feature flags</td><td>ConfigMap לכל overlay, שירות flags</td><td>Hardcoded בתוך ה-image</td></tr>
<tr><td>Secrets</td><td>Secret manager בכל account (External Secrets Operator)</td><td>Secret אחד שמשותף ל-dev ול-prod</td></tr>
<tr><td>דאטה</td><td>דאטאבייסים נפרדים, KMS keys נפרדים, לכל account</td><td>Snapshot של prod ששוחזר ב-dev</td></tr>
</table>
<p><strong>דאטה של prod אף פעם לא יורד ל-dev</strong>, וה-guardrail הוא טכני, לא מסמך מדיניות: ל-KMS keys של prod יש key policies שרק roles של prod יכולים להשתמש בהן, אז snapshot שהועתק לא קריא בשום מקום אחר; SCPs או Org Policies חוסמים שיתוף snapshots בין accounts מה-OU של prod; ו-dev משתמש במחוללי דאטה סינתטי או בתת-קבוצה ממוסכת שמיוצרת ב-pipeline שרץ <em>בתוך</em> prod (טוקניזציה של כתובות מייל, השמטת תוכן הקבצים, שמירה על הצורה והנפחים). זה מה שמבקרי GDPR (data minimisation) ו-SOC 2 יבקשו לראות.</p>
<blockquote>💡 מהעולם האמיתי: כשבאג משתחזר רק "עם דאטה אמיתי", התשובה היא גישה מוגבלת בזמן, מאושרת ומתועדת ל-read replica של prod מתוך bastion של prod, לא להעתיק דאטה למטה. העותק הוא מה שמגיע בסוף לדוח של דליפה.</blockquote>`
      }
    },
    {
      h: { en: "Worked example: the layout for a Drive-like product", he: "דוגמה מלאה: המפה למוצר בסגנון Drive" },
      body: {
        en: `<p>Product: Files, a Drive-like platform on GCP (see <code>plan-cloud-selection</code>). 40 engineers in 6 teams, about 25 services, customers in the EU and US, one enterprise customer who wants dedicated infrastructure, an AI-search GPU workload planned.</p>
<table>
<tr><th>Layer</th><th>Decision</th><th>Why</th></tr>
<tr><td>Environments</td><td>local, preview per PR, dev, staging, prod-eu, prod-us, DR for metadata (Spanner multi-region covers it), perf on demand monthly</td><td>No QA env (staging covers it); perf is ephemeral because peak is predictable</td></tr>
<tr><td>Folders / projects</td><td><code>platform/</code> (logging, security, network-host-nonprod, network-host-prod, artifact-registry), <code>nonprod/</code> (files-dev, files-staging), <code>prod/</code> (files-prod-eu, files-prod-us, files-prod-tenant-bigco), <code>sandbox/</code> (one project per engineer, $200/month budget cap)</td><td>Prod projects per jurisdiction: residency and blast radius; dedicated tenant gets its own project for billing and audit</td></tr>
<tr><td>Guardrails</td><td>Org Policy on <code>prod/</code>: allowed locations EU or US only per project, no service account keys, no external IPs on VMs, uniform bucket-level access</td><td>Make the wrong thing impossible, not just discouraged</td></tr>
<tr><td>Clusters</td><td><code>nonprod-euw1-core-01</code> (dev + staging + previews), <code>prd-euw1-core-01</code>, <code>prd-use1-core-01</code>, <code>prd-euw4-gpu-01</code> (GPU, separate for noisy-neighbour and cost), <code>prd-euw1-bigco-01</code></td><td>Minimum that respects prod/non-prod wall + residency + two named triggers</td></tr>
<tr><td>Namespaces</td><td>Per service (<code>files-api</code>, <code>sharing</code>, <code>thumbnailer</code>, <code>search-indexer</code>...) from one template; previews as <code>pr-&lt;number&gt;</code> with 48h TTL; dev and staging as <code>&lt;service&gt;-dev</code> / <code>&lt;service&gt;-stg</code> in the shared non-prod cluster</td><td>25 services is enough to need per-service policy; platform templates the kit</td></tr>
<tr><td>Access</td><td>Groups from Entra ID via Workforce Identity Federation; edit in non-prod, view in prod, break-glass with 1-hour approval</td><td>Humans never hold standing prod write</td></tr>
<tr><td>Promotion</td><td>Argo CD per cluster, ApplicationSets; digest PR from staging to prod-eu, then prod-us 24h later</td><td>Regions as deployment waves limit blast radius of a bad release</td></tr>
</table>
<p><strong>What would change the plan:</strong> a PCI-scoped payments feature (add a dedicated project and cluster, keep it out of the core cluster), more than ~5 dedicated tenants (move to a cell-based layout with a tenant-to-cell map), the core cluster passing ~600 nodes (split into two cells per region), or a regulator asking for data in a new country (new prod project and cluster, same templates).</p>`,
        he: `<p>המוצר: Files, פלטפורמה בסגנון Drive על GCP (ראה <code>plan-cloud-selection</code>). 40 מהנדסים ב-6 צוותים, בערך 25 שירותים, לקוחות באירופה ובארה"ב, לקוח enterprise אחד שרוצה תשתית ייעודית, ו-workload של GPU לחיפוש AI בתכנון.</p>
<table>
<tr><th>שכבה</th><th>החלטה</th><th>למה</th></tr>
<tr><td>סביבות</td><td>local, preview לכל PR, dev, staging, prod-eu, prod-us, DR ל-metadata (ה-multi-region של Spanner מכסה אותו), perf לפי דרישה פעם בחודש</td><td>אין סביבת QA (staging מכסה); perf זמני כי ה-peak צפוי</td></tr>
<tr><td>Folders ו-projects</td><td><code>platform/</code> (logging, security, network-host-nonprod, network-host-prod, artifact-registry), <code>nonprod/</code> (files-dev, files-staging), <code>prod/</code> (files-prod-eu, files-prod-us, files-prod-tenant-bigco), <code>sandbox/</code> (project לכל מהנדס עם תקרת תקציב של $200 בחודש)</td><td>Projects של prod לפי תחום שיפוט: residency ו-blast radius; ה-tenant הייעודי מקבל project משלו בשביל billing ו-audit</td></tr>
<tr><td>Guardrails</td><td>Org Policy על <code>prod/</code>: מיקומים מותרים רק EU או רק US לכל project, בלי keys ל-service accounts, בלי external IPs על VMs, uniform bucket-level access</td><td>להפוך את הדבר הלא נכון לבלתי אפשרי, לא רק ללא מומלץ</td></tr>
<tr><td>Clusters</td><td><code>nonprod-euw1-core-01</code> (dev, staging ו-previews), <code>prd-euw1-core-01</code>, <code>prd-use1-core-01</code>, <code>prd-euw4-gpu-01</code> (GPU, נפרד בגלל noisy neighbours ועלות), <code>prd-euw1-bigco-01</code></td><td>המינימום שמכבד את החומה בין prod ל-non-prod, את ה-residency ושני triggers עם שם</td></tr>
<tr><td>Namespaces</td><td>לפי שירות (<code>files-api</code>, <code>sharing</code>, <code>thumbnailer</code>, <code>search-indexer</code>...) מ-template אחד; previews בתור <code>pr-&lt;number&gt;</code> עם TTL של 48 שעות; dev ו-staging בתור <code>&lt;service&gt;-dev</code> / <code>&lt;service&gt;-stg</code> ב-cluster המשותף של ה-non-prod</td><td>25 שירותים זה מספיק כדי להצדיק policy לכל שירות; ה-platform מייצר את הערכה מ-template</td></tr>
<tr><td>גישה</td><td>Groups מ-Entra ID דרך Workforce Identity Federation; edit ב-non-prod, view ב-prod, break-glass עם אישור לשעה</td><td>לבני אדם אף פעם אין הרשאת כתיבה קבועה ב-prod</td></tr>
<tr><td>Promotion</td><td>Argo CD בכל cluster, ApplicationSets; PR של digest מ-staging ל-prod-eu, ואז ל-prod-us 24 שעות אחר כך</td><td>Regions כגלי deploy מגבילים את ה-blast radius של release גרוע</td></tr>
</table>
<p><strong>מה ישנה את התוכנית:</strong> פיצ'ר payments בתוך scope של PCI (מוסיפים project ו-cluster ייעודיים, ומשאירים אותו מחוץ ל-cluster המרכזי), יותר מ-5 tenants ייעודיים בערך (עוברים למבנה מבוסס cells עם מיפוי tenant ל-cell), cluster מרכזי שעובר בערך 600 nodes (פיצול לשני cells בכל region), או רגולטור שמבקש דאטה במדינה חדשה (project ו-cluster חדשים של prod, אותם templates).</p>`
      }
    }
  ],
  diagram: `GCP org (same shape: AWS Organization+OUs / Azure management groups)
|
+-- platform/   logging | security | net-host-nonprod | net-host-prod | registry
+-- nonprod/
|     files-dev, files-staging  --->  cluster nonprod-euw1-core-01
|                                       ns: files-api-dev, files-api-stg, pr-1423 (TTL 48h)
+-- prod/                       (Org Policy: locations, no SA keys, no ext IPs)
|     files-prod-eu   --->  prd-euw1-core-01   ns: files-api, sharing, thumbnailer ...
|     files-prod-us   --->  prd-use1-core-01   ns: (same manifests, other overlay)
|     files-prod-eu   --->  prd-euw4-gpu-01    ns: search-indexer   (noisy + cost)
|     files-prod-bigco -->  prd-euw1-bigco-01  (dedicated tenant)
+-- sandbox/    one project per engineer, budget cap

Every namespace = Quota + LimitRange + RoleBinding(IdP group) + default-deny NetPol + PSS restricted
Promotion: build once -> digest -> dev -> staging -> prod-eu -> (24h) -> prod-us   (Git PRs, Argo CD)
Prod data: stays in prod/ (KMS key policy + Org Policy). Dev gets synthetic or masked-in-prod data.`,
  handsOn: [
    {
      cmd: "aws organizations list-organizational-units-for-parent --parent-id r-ab12 && aws organizations list-accounts-for-parent --parent-id ou-ab12-prod0001 --query \"Accounts[].[Name,Id,Status]\" --output table",
      what: {
        en: "Walk the AWS org tree: list the OUs under the root, then the accounts in the prod OU. If you find a dev account in the prod OU (or prod workloads in a sandbox), your SCP guardrails are applied to the wrong things.",
        he: "עובר על עץ ה-organization ב-AWS: מציג את ה-OUs מתחת ל-root, ואז את ה-accounts ב-OU של prod. אם אתה מוצא account של dev בתוך ה-OU של prod (או workloads של prod ב-sandbox), ה-guardrails של ה-SCP שלך מוחלים על הדברים הלא נכונים."
      }
    },
    {
      cmd: "gcloud projects list --filter=\"parent.id=123456789012 AND parent.type=folder\" --format=\"table(projectId,labels.env,labels.team)\"",
      what: {
        en: "List the GCP projects under one folder (for example prod/) with their env and team labels. Missing labels mean cost allocation and policy targeting are already broken.",
        he: "מציג את ה-projects ב-GCP מתחת ל-folder אחד (למשל prod/) עם ה-labels של env ו-team. Labels חסרים אומרים שהקצאת העלויות והכוונת ה-policies כבר שבורות."
      }
    },
    {
      cmd: "kubectl label ns files-api pod-security.kubernetes.io/enforce=restricted --dry-run=server --overwrite",
      what: {
        en: "Server-side dry run of turning on Pod Security restricted: the API server prints a warning for every existing pod that would violate it, without changing anything. Run this before enforcing on an existing namespace.",
        he: "Dry run בצד השרת להפעלת Pod Security ברמת restricted: ה-API server מדפיס אזהרה על כל Pod קיים שיפר את הרמה, בלי לשנות כלום. הרץ את זה לפני אכיפה על namespace קיים."
      }
    },
    {
      cmd: "kubectl describe resourcequota -n files-api && kubectl auth can-i --list -n files-api --as=jane@example.com --as-group=storage-team@example.com",
      what: {
        en: "Check the namespace kit is real: quota usage versus hard limits, then exactly what a member of the team group can do in that namespace. In prod, verbs like create or delete on deployments should not appear for humans.",
        he: "בודק שערכת ה-namespace אמיתית: שימוש ב-quota מול הגבולות, ואז בדיוק מה חבר בקבוצה של הצוות יכול לעשות ב-namespace. ב-prod, פעלים כמו create או delete על deployments לא אמורים להופיע לבני אדם."
      }
    },
    {
      cmd: "kubectl run probe -n files-api --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- -T 3 http://sharing.sharing.svc.cluster.local:8080/healthz",
      what: {
        en: "Prove default-deny actually works: from a pod in files-api, call a service in another namespace that has not been explicitly allowed. A timeout is the correct result; a 200 means your CNI is not enforcing NetworkPolicy.",
        he: "מוכיח ש-default-deny באמת עובד: מתוך Pod ב-files-api, קורא לשירות ב-namespace אחר שלא הותר במפורש. Timeout הוא התוצאה הנכונה; 200 אומר שה-CNI שלך לא אוכף NetworkPolicy."
      }
    }
  ],
  mnemonic: {
    en: "Walls get cheaper as they get softer: Account for prod, Cluster per region, Namespace per owner. And every namespace gets its QLRNP kit: Quota, LimitRange, RoleBinding, NetworkPolicy, Pod Security.",
    he: "חומות זולות יותר ככל שהן רכות יותר: account ל-prod, cluster לכל region, namespace לכל בעלים. וכל namespace מקבל את ערכת QLRNP: Quota, LimitRange, RoleBinding, NetworkPolicy, Pod Security."
  },
  pitfalls: [
    {
      en: "Prod and non-prod in the same account or cluster \"to save money\". The first leaked dev credential, staging load test or CRD upgrade lands on customers, and every audit becomes a long explanation.",
      he: "Prod ו-non-prod באותו account או cluster \"כדי לחסוך\". ה-credential הראשון שדולף מ-dev, ה-load test הראשון ב-staging או ה-upgrade הראשון של CRD נוחתים על הלקוחות, וכל audit הופך להסבר ארוך."
    },
    {
      en: "Creating namespaces by hand with kubectl create ns. They end up without quota, limits, network policy or Pod Security, and the gap is found during an incident. Generate every namespace from one template in Git.",
      he: "ליצור namespaces ידנית עם kubectl create ns. הם נשארים בלי quota, בלי limits, בלי network policy ובלי Pod Security, והפער מתגלה באמצע תקלה. ייצר כל namespace מ-template אחד ב-Git."
    },
    {
      en: "Rebuilding the image per environment or branching code on env names. Staging then tests an artifact prod never runs; promote one signed digest and vary only config.",
      he: "לבנות image מחדש לכל סביבה, או לפצל קוד לפי שם הסביבה. אז staging בודק artifact ש-prod אף פעם לא מריץ. קדם digest חתום אחד ושנה רק config."
    },
    {
      en: "Copying a prod snapshot to dev to debug a bug. It bypasses every prod control and is a reportable data incident under GDPR; block it with KMS key policies and org guardrails, and give time-boxed audited access to prod instead.",
      he: "להעתיק snapshot של prod ל-dev כדי לדבג באג. זה עוקף את כל הבקרות של prod, ולפי GDPR זה אירוע דאטה שחייבים לדווח עליו. חסום את זה עם key policies של KMS ו-guardrails ברמת ה-organization, ותן במקום זה גישה מוגבלת בזמן ומתועדת ל-prod."
    }
  ],
  interview: [
    {
      q: {
        en: "Design the environment and isolation layout for a new SaaS product with 30 engineers on one cloud.",
        he: "תכנן את מפת הסביבות והבידוד למוצר SaaS חדש עם 30 מהנדסים על ענן אחד."
      },
      a: {
        en: "Environments: local, preview per PR, dev, staging, prod per region or jurisdiction, perf on demand; DR depends on RTO. Org: a landing zone with platform accounts (log archive, security, network, shared services), non-prod accounts and prod accounts per region, sandbox accounts with budget caps; guardrails at the OU/folder level (allowed regions, no disabling audit logs, no static keys). Clusters: one non-prod per region, one prod per region, split further only on named triggers like compliance scope, GPU noisy neighbours or upgrade blast radius. Namespaces per service from one template with quota, LimitRange, IdP-group RoleBindings, default-deny NetworkPolicy and Pod Security restricted. Promotion: one signed digest moved by Git PRs through Argo CD, regions as waves. Prod data stays in prod through KMS key policies; dev uses synthetic or masked data.",
        he: "סביבות: local, preview לכל PR, dev, staging, prod לכל region או תחום שיפוט, perf לפי דרישה; DR תלוי ב-RTO. Organization: landing zone עם accounts של platform (log archive, security, network, shared services), accounts של non-prod ו-accounts של prod לכל region, accounts של sandbox עם תקרת תקציב; guardrails ברמת ה-OU או ה-folder (regions מותרים, אסור לכבות audit logs, בלי keys סטטיים). Clusters: אחד ל-non-prod בכל region, אחד ל-prod בכל region, ופיצול נוסף רק לפי triggers עם שם כמו scope של compliance, noisy neighbours של GPU או blast radius של upgrade. Namespaces לפי שירות מ-template אחד, עם quota, LimitRange, RoleBindings לקבוצות מה-IdP, NetworkPolicy של default-deny ו-Pod Security ברמת restricted. Promotion: digest חתום אחד שעובר ב-PRs ב-Git דרך Argo CD, עם regions כגלים. דאטה של prod נשאר ב-prod בעזרת key policies של KMS, ו-dev משתמש בדאטה סינתטי או ממוסך."
      }
    },
    {
      q: {
        en: "A team asks for its own cluster. How do you decide?",
        he: "צוות מבקש cluster משלו. איך אתה מחליט?"
      },
      a: {
        en: "I ask which trigger they hit: compliance scope, a workload that starves others (GPU, batch), a different upgrade cadence or blast-radius requirement, size, or a dedicated tenant. Most requests are really about noisy neighbours or permissions, which a dedicated node pool with taints, a namespace quota, priority classes and proper RBAC solve at a fraction of the cost. A new cluster costs a control plane, duplicated add-ons, an upgrade every few months and on-call surface, so it is justified when the trigger is real and the platform can create it from the same templates and GitOps as every other cluster.",
        he: "אני שואל איזה trigger הם פגשו: scope של compliance, workload שמרעיב אחרים (GPU, batch), קצב upgrades שונה או דרישת blast radius, גודל, או tenant ייעודי. רוב הבקשות הן בעצם על noisy neighbours או על הרשאות, ו-node pool ייעודי עם taints, quota ל-namespace, priority classes ו-RBAC נכון פותרים את זה בשבריר מהעלות. Cluster חדש עולה control plane, add-ons משוכפלים, upgrade כל כמה חודשים ושטח נוסף ל-on-call. לכן הוא מוצדק כשה-trigger אמיתי, וה-platform יכול ליצור אותו מאותם templates ומאותו GitOps כמו כל cluster אחר."
      }
    }
  ],
  quiz: [
    {
      q: {
        en: "Where should the strongest isolation boundary between prod and non-prod sit?",
        he: "איפה צריך לשבת גבול הבידוד הכי חזק בין prod ל-non-prod?"
      },
      options: [
        { en: "Separate namespaces in one shared cluster", he: "Namespaces נפרדים ב-cluster משותף אחד" },
        { en: "Separate node pools with taints", he: "Node pools נפרדים עם taints" },
        { en: "Separate cloud accounts / subscriptions / projects, with guardrails at the OU or folder level", he: "Accounts, subscriptions או projects נפרדים בענן, עם guardrails ברמת ה-OU או ה-folder" },
        { en: "Different Kubernetes labels on the workloads", he: "Labels שונים של Kubernetes על ה-workloads" }
      ],
      answer: 2,
      explain: {
        en: "The account boundary is where IAM, quotas, billing, audit logs and the blast radius of a leaked credential stop. Namespaces and node pools share the control plane and often the network.",
        he: "גבול ה-account הוא המקום שבו IAM, quotas, billing, audit logs וה-blast radius של credential שדלף נעצרים. Namespaces ו-node pools חולקים את ה-control plane ולרוב גם את הרשת."
      }
    },
    {
      q: {
        en: "Your prod cluster runs latency-critical APIs, and the new ML team wants to add GPU training jobs that saturate nodes for hours. What is the most reasonable first decision?",
        he: "ה-cluster של prod מריץ APIs רגישים ל-latency, וצוות ה-ML החדש רוצה להוסיף jobs של אימון על GPU שמרווים nodes במשך שעות. מה ההחלטה הראשונה הכי סבירה?"
      },
      options: [
        { en: "Put the jobs in a new namespace with no other changes", he: "לשים את ה-jobs ב-namespace חדש בלי שינויים נוספים" },
        { en: "Isolate them: a dedicated GPU node pool with taints at minimum, and a separate GPU cluster if they also need a different upgrade cadence, cost tracking or blast radius", he: "לבודד אותם: לפחות node pool ייעודי של GPU עם taints, ו-cluster נפרד ל-GPU אם הם צריכים גם קצב upgrades אחר, מעקב עלויות או blast radius נפרד" },
        { en: "Move everything to a new account per team", he: "להעביר הכל ל-account חדש לכל צוות" },
        { en: "Run them in staging because it has spare capacity", he: "להריץ אותם ב-staging כי יש שם קיבולת פנויה" }
      ],
      answer: 1,
      explain: {
        en: "Noisy neighbours are a named split trigger. A namespace alone does not stop node saturation; taints and dedicated pools are the cheap first step, a separate cluster the next one. Running prod work in staging breaks the environment's purpose.",
        he: "Noisy neighbours הם trigger לפיצול עם שם. Namespace לבד לא מונע הרוויה של nodes; taints ו-pools ייעודיים הם הצעד הראשון והזול, ו-cluster נפרד הוא הצעד הבא. להריץ עבודה של prod ב-staging שובר את המטרה של הסביבה."
      }
    },
    {
      q: {
        en: "Which set of objects should every new namespace get from the platform template?",
        he: "איזה סט אובייקטים כל namespace חדש צריך לקבל מה-template של ה-platform?"
      },
      options: [
        { en: "Only a Namespace object with a team label", he: "רק אובייקט Namespace עם label של צוות" },
        { en: "ResourceQuota, LimitRange, RoleBinding to an IdP group, default-deny NetworkPolicy (plus DNS allow), Pod Security labels", he: "ResourceQuota, LimitRange, RoleBinding לקבוצה מה-IdP, NetworkPolicy של default-deny (ועוד הרשאה ל-DNS), labels של Pod Security" },
        { en: "A ClusterRoleBinding of cluster-admin for the owning team", he: "ClusterRoleBinding של cluster-admin לצוות הבעלים" },
        { en: "A dedicated node pool and a LoadBalancer Service", he: "Node pool ייעודי ו-Service מסוג LoadBalancer" }
      ],
      answer: 1,
      explain: {
        en: "A namespace is a policy unit; without the kit it has no capacity limits, no default requests, no scoped access, open lateral traffic and permissive pod security. cluster-admin defeats the namespace entirely.",
        he: "Namespace הוא יחידת policy. בלי הערכה אין לו גבולות קיבולת, אין requests ברירת מחדל, אין גישה מוגבלת, התעבורה הרוחבית פתוחה וה-Pod Security מתירני. cluster-admin מבטל את ה-namespace לגמרי."
      }
    },
    {
      q: {
        en: "What is the correct promotion model from staging to prod?",
        he: "מה מודל ה-promotion הנכון מ-staging ל-prod?"
      },
      options: [
        { en: "Rebuild the image from the release branch with prod build flags", he: "לבנות את ה-image מחדש מה-release branch עם build flags של prod" },
        { en: "Copy the staging database to prod so both match", he: "להעתיק את הדאטאבייס של staging ל-prod כדי ששניהם יתאימו" },
        { en: "Promote the same signed image digest via a Git change to the prod overlay; only config differs per environment", he: "לקדם את אותו image digest חתום דרך שינוי ב-Git ב-overlay של prod; רק ה-config שונה בין סביבות" },
        { en: "Have an engineer run kubectl apply in prod after a manual check", he: "שמהנדס יריץ kubectl apply ב-prod אחרי בדיקה ידנית" }
      ],
      answer: 2,
      explain: {
        en: "Build once, promote the digest. Rebuilding means prod runs something staging never tested; manual kubectl bypasses audit and drift detection; and databases never flow between environments.",
        he: "בונים פעם אחת ומקדמים את ה-digest. בנייה מחדש אומרת ש-prod מריץ משהו ש-staging אף פעם לא בדק; kubectl ידני עוקף audit וזיהוי drift; ודאטאבייסים אף פעם לא זורמים בין סביבות."
      }
    }
  ],
  related: ["k8s-namespaces-rbac", "cloud-landing-zones", "staff-platform-engineering", "pr-multi-tenancy", "plan-product-infra-blueprint", "plan-cloud-selection"]
});


INFRA.lessons.push({
  id: "plan-data-store-selection",
  track: "principal",
  order: 183,
  icon: "🗄️",
  level: 3,
  minutes: 18,
  title: { en: "Choosing Data Stores per Workload: Polyglot Persistence on Purpose", he: "בחירת data stores לכל workload: polyglot persistence בכוונה" },
  tldr: {
    en: "Never start from a brand. List every entity with its access pattern (read:write ratio, query shape, consistency, size and growth, latency, multi-region, retention), map each need to a store type, and add a new engine only when a measured need beats its permanent cost in on-call, backups and skills. The boring default is Postgres + object storage + Redis; everything else must earn its place.",
    he: "אף פעם לא מתחילים ממותג. רושמים כל ישות עם ה-access pattern שלה (יחס read:write, צורת השאילתה, consistency, גודל וקצב גדילה, latency, multi-region, retention), ממפים כל צורך לסוג store, ומוסיפים מנוע חדש רק כשצורך שנמדד שווה יותר מהמחיר הקבוע שלו ב-on-call, גיבויים וידע. ברירת המחדל המשעממת היא Postgres + object storage + Redis; כל השאר צריך להרוויח את המקום שלו."
  },
  analogy: {
    en: "Equipping a professional kitchen. You don't buy a pizza oven because a famous restaurant has one; you look at the menu first. Every dish has a cooking pattern (fast and hot, slow and long, cold storage, high volume). Most dishes are served fine by one good stove, a fridge and a pantry. You add the tandoor only when naan is half of your orders, because every extra machine needs a trained cook, cleaning, spare parts and floor space forever.",
    he: "לצייד מטבח מקצועי. לא קונים טאבון לפיצה כי למסעדה מפורסמת יש אחד; קודם מסתכלים על התפריט. לכל מנה יש דפוס בישול (מהיר וחם, איטי וארוך, אחסון בקירור, נפח גבוה). רוב המנות מסתדרות מצוין עם כיריים טובות, מקרר ומזווה. מוסיפים טנדור רק כשנאן זה חצי מההזמנות, כי כל מכונה נוספת דורשת טבח שיודע להפעיל אותה, ניקוי, חלפים ושטח רצפה, לתמיד."
  },
  sections: [
    {
      h: { en: "Step 1: the access-pattern worksheet (before any brand)", he: "שלב 1: גיליון ה-access patterns (לפני כל מותג)" },
      body: {
        en: `<p>The most common data-architecture mistake is choosing the database in the first meeting ("we're a Mongo shop", "let's use DynamoDB, it scales"). The decision is made <em>per entity</em>, from how the entity is read and written. Fill one row per entity before you name any product:</p>
<table><tr><th>Question</th><th>Why it decides</th><th>Example answers</th></tr>
<tr><td>Read:write ratio and peak QPS</td><td>Read-heavy → replicas + cache solve it; write-heavy → you need write scale-out (partitioning, LSM engines)</td><td>Profile 1000:1, 2k QPS; chat messages 1:1, 400k writes/s</td></tr>
<tr><td>Query shape</td><td>Point lookup by key, range in one partition, ad-hoc joins, full-text, aggregation over billions of rows: each favours a different engine</td><td>"messages of conversation X, newest 50" = range in one partition</td></tr>
<tr><td>Consistency need</td><td>Money, inventory, ACLs need transactions and read-your-writes; counters and feeds tolerate eventual</td><td>"a removed share must stop working now" = strong</td></tr>
<tr><td>Size and growth</td><td>200 GB fits one Postgres for years; 2 PB/year doesn't fit any single node</td><td>Metadata 5 TB, +2 TB/yr; blobs 40 PB, +15 PB/yr</td></tr>
<tr><td>Latency target (p99)</td><td>Sub-ms needs memory; 5-20 ms is any good OLTP store; seconds is fine for analytics</td><td>Presence lookup &lt; 1 ms; report 10 s</td></tr>
<tr><td>Multi-region</td><td>Read-local only? Write-local in every region? This is the expensive question (see <code>staff-multi-region-data</code>)</td><td>Users in EU and US, writes from both</td></tr>
<tr><td>Retention and deletion</td><td>TTL, legal hold, GDPR erase, cold tiering change the store and the cost</td><td>Logs 30 days; invoices 7 years; messages until user deletes</td></tr></table>
<p>Then answer three cross-cutting questions: <strong>who owns it</strong> (one team per store), <strong>what is the RPO/RTO</strong> (tier), and <strong>how will we query it in ways we don't know yet</strong> (that pushes toward SQL or toward a CDC feed into a warehouse).</p>
<blockquote>💡 Real world: the worksheet usually shows that 80% of entities are small, relational and read-heavy (users, orgs, billing, settings) and 1-3 entities are the real scale problem (messages, events, blobs). Spend the specialised-store budget only on those.</blockquote>`,
        he: `<p>הטעות הכי נפוצה בארכיטקטורת דאטה היא לבחור את ה-DB בפגישה הראשונה ("אנחנו shop של Mongo", "בוא ניקח DynamoDB, הוא עושה scale"). ההחלטה מתקבלת <em>לכל ישות</em>, לפי איך קוראים וכותבים אותה. ממלאים שורה לכל ישות לפני שמזכירים מוצר כלשהו:</p>
<table><tr><th>שאלה</th><th>למה היא מכריעה</th><th>תשובות לדוגמה</th></tr>
<tr><td>יחס read:write ו-QPS בשיא</td><td>הרבה קריאות ← replicas ו-cache פותרים; הרבה כתיבות ← צריך scale-out לכתיבה (partitioning, מנועי LSM)</td><td>פרופיל 1000:1, ‏2k QPS; הודעות צ'אט 1:1, ‏400k כתיבות בשנייה</td></tr>
<tr><td>צורת השאילתה</td><td>שליפה לפי key, טווח בתוך partition, joins אד-הוק, full-text, אגרגציה על מיליארדי שורות: כל אחד מתאים למנוע אחר</td><td>"50 ההודעות האחרונות בשיחה X" = טווח בתוך partition אחד</td></tr>
<tr><td>צורך ב-consistency</td><td>כסף, מלאי ו-ACLs צריכים טרנזקציות ו-read-your-writes; מונים ו-feeds סובלים eventual</td><td>"שיתוף שהוסר חייב להפסיק לעבוד עכשיו" = strong</td></tr>
<tr><td>גודל וקצב גדילה</td><td>‏200GB נכנס ל-Postgres אחד לשנים; ‏2PB בשנה לא נכנס לשום node בודד</td><td>מטא-דאטה 5TB, ‏+2TB בשנה; קבצים 40PB, ‏+15PB בשנה</td></tr>
<tr><td>יעד latency (p99)</td><td>פחות ממילישנייה דורש זיכרון; 5-20ms זה כל OLTP store טוב; שניות זה בסדר ל-analytics</td><td>בדיקת presence מתחת ל-1ms; דוח 10 שניות</td></tr>
<tr><td>Multi-region</td><td>קריאה מקומית בלבד? כתיבה מקומית בכל region? זו השאלה היקרה (ראה <code>staff-multi-region-data</code>)</td><td>משתמשים באירופה ובארה"ב, כתיבות משני הצדדים</td></tr>
<tr><td>Retention ומחיקה</td><td>TTL, legal hold, מחיקה לפי GDPR ו-tiering לאחסון קר משנים את ה-store ואת העלות</td><td>לוגים 30 יום; חשבוניות 7 שנים; הודעות עד שהמשתמש מוחק</td></tr></table>
<p>אחר כך עונים על שלוש שאלות רוחב: <strong>מי הבעלים</strong> (צוות אחד לכל store), <strong>מה ה-RPO/RTO</strong> (ה-tier), ו-<strong>איך נשאל עליו שאלות שעוד לא ידועות לנו</strong> (זה דוחף ל-SQL או ל-CDC שמזין warehouse).</p>
<blockquote>💡 מהשטח: הגיליון בדרך כלל מראה ש-80% מהישויות קטנות, רלציוניות ועתירות קריאה (users, orgs, billing, settings), ורק 1-3 ישויות הן בעיית ה-scale האמיתית (הודעות, events, קבצים). את תקציב ה-store המיוחד מוציאים רק עליהן.</blockquote>`
      }
    },
    {
      h: { en: "Step 2: map each need to a store type", he: "שלב 2: למפות כל צורך לסוג store" },
      body: {
        en: `<table><tr><th>Need (from the worksheet)</th><th>Store type</th><th>Examples</th><th>Choose otherwise when…</th></tr>
<tr><td>Transactions, joins, constraints, unknown future queries, up to a few TB and ~10-50k writes/s</td><td>Relational</td><td>Postgres, MySQL, Aurora, AlloyDB, Azure SQL</td><td>Writes exceed one primary, or you need multi-region writes with strong consistency</td></tr>
<tr><td>SQL + ACID but beyond one node, or strongly consistent multi-region writes</td><td>Distributed SQL (NewSQL)</td><td>Spanner, CockroachDB, YugabyteDB, Aurora DSQL</td><td>Single region is enough (higher write latency and cost for nothing); hot-row contention</td></tr>
<tr><td>Huge write volume, known queries by partition key + clustering order, always-on, multi-DC</td><td>Wide-column (LSM)</td><td>Cassandra, ScyllaDB, Bigtable, HBase</td><td>You need ad-hoc queries, joins, or transactions across partitions</td></tr>
<tr><td>Flexible per-record shape, aggregate-oriented reads ("load the whole order")</td><td>Document</td><td>MongoDB, Cosmos DB, Firestore, DocumentDB</td><td>Relationships are many-to-many and queried from both sides</td></tr>
<tr><td>Key lookups at sub-ms, sessions, rate limits, leaderboards</td><td>KV / cache</td><td>Redis/Valkey, Memcached, DynamoDB (durable KV)</td><td>It must be the source of truth with complex queries (Redis is memory-bound)</td></tr>
<tr><td>Large immutable blobs (photos, video, backups, files), cheap and durable</td><td>Object storage</td><td>S3, GCS, Azure Blob</td><td>Small, frequently mutated records, or you need POSIX semantics</td></tr>
<tr><td>Full-text, fuzzy, faceted, relevance ranking</td><td>Search index</td><td>OpenSearch, Elasticsearch, Postgres FTS for small cases</td><td>It's the source of truth (it shouldn't be; it's a derived index)</td></tr>
<tr><td>Append-mostly metrics with time windows, downsampling</td><td>Time-series</td><td>Prometheus/Mimir, TimescaleDB, InfluxDB</td><td>High-cardinality events: use columnar analytics</td></tr>
<tr><td>Scans and aggregations over TB-PB, BI, ML features</td><td>Analytics / columnar</td><td>BigQuery, Snowflake, ClickHouse, Redshift</td><td>Point lookups with ms latency from the product path</td></tr>
<tr><td>Ordered event log, fan-out to many consumers, replay, CDC</td><td>Log / queue</td><td>Kafka, Kinesis, Pub/Sub, Event Hubs</td><td>Simple task queue: SQS/RabbitMQ is cheaper to run</td></tr></table>
<p>Real limits that often decide the row: DynamoDB items max 400 KB and ~1000 WCU / 3000 RCU per partition; MongoDB documents max 16 MB; Cosmos DB logical partition max 20 GB; Firestore ~1 sustained write/s per document; Cassandra partitions should stay under ~100 MB (ideally &lt; 10 MB); S3 handles 3,500 PUT and 5,500 GET per second <em>per prefix</em>; RDS Postgres storage tops out at 64 TiB, Aurora at 128 TiB.</p>
<blockquote>⚠️ Production tip: "NoSQL scales, SQL doesn't" is a 2012 slogan. The honest framing is: NoSQL makes you <em>design the partition key up front</em> so it can scale; SQL lets you defer that decision and pays later with sharding work. Pick which pain you prefer, consciously.</blockquote>`,
        he: `<table><tr><th>צורך (מהגיליון)</th><th>סוג store</th><th>דוגמאות</th><th>בוחרים אחרת כש…</th></tr>
<tr><td>טרנזקציות, joins, constraints, שאילתות עתידיות לא ידועות, עד כמה TB ובערך 10-50k כתיבות בשנייה</td><td>רלציוני</td><td>Postgres, MySQL, Aurora, AlloyDB, Azure SQL</td><td>הכתיבות עוברות primary אחד, או שצריך כתיבות multi-region עם strong consistency</td></tr>
<tr><td>SQL ו-ACID אבל מעבר ל-node אחד, או כתיבות multi-region עקביות</td><td>Distributed SQL (NewSQL)</td><td>Spanner, CockroachDB, YugabyteDB, Aurora DSQL</td><td>region אחד מספיק (משלמים latency כתיבה ועלות בשביל כלום); contention על שורה חמה</td></tr>
<tr><td>נפח כתיבות עצום, שאילתות ידועות לפי partition key וסדר clustering, תמיד זמין, multi-DC</td><td>Wide-column (LSM)</td><td>Cassandra, ScyllaDB, Bigtable, HBase</td><td>צריך שאילתות אד-הוק, joins או טרנזקציות בין partitions</td></tr>
<tr><td>מבנה גמיש לכל רשומה, קריאות מוכוונות aggregate ("תטען את כל ההזמנה")</td><td>Document</td><td>MongoDB, Cosmos DB, Firestore, DocumentDB</td><td>הקשרים הם many-to-many ושואלים עליהם משני הכיוונים</td></tr>
<tr><td>שליפות לפי key מתחת למילישנייה, sessions, rate limits, leaderboards</td><td>KV / cache</td><td>Redis/Valkey, Memcached, DynamoDB (KV עמיד)</td><td>הוא חייב להיות מקור האמת עם שאילתות מורכבות (Redis מוגבל בזיכרון)</td></tr>
<tr><td>Blobs גדולים ו-immutable (תמונות, וידאו, גיבויים, קבצים), זול ועמיד</td><td>Object storage</td><td>S3, GCS, Azure Blob</td><td>רשומות קטנות שמשתנות הרבה, או שצריך סמנטיקה של POSIX</td></tr>
<tr><td>Full-text, fuzzy, facets, דירוג רלוונטיות</td><td>Search index</td><td>OpenSearch, Elasticsearch, ו-FTS של Postgres למקרים קטנים</td><td>הוא מקור האמת (הוא לא אמור להיות; זה אינדקס נגזר)</td></tr>
<tr><td>מטריקות שרובן append, חלונות זמן, downsampling</td><td>Time-series</td><td>Prometheus/Mimir, TimescaleDB, InfluxDB</td><td>events עם cardinality גבוה: עדיף analytics עמודתי</td></tr>
<tr><td>סריקות ואגרגציות על TB עד PB, BI, פיצ'רים ל-ML</td><td>Analytics / עמודתי</td><td>BigQuery, Snowflake, ClickHouse, Redshift</td><td>שליפה נקודתית ב-ms מתוך מסלול המוצר</td></tr>
<tr><td>לוג אירועים מסודר, fan-out להרבה צרכנים, replay, CDC</td><td>Log / queue</td><td>Kafka, Kinesis, Pub/Sub, Event Hubs</td><td>תור משימות פשוט: SQS או RabbitMQ זולים יותר לתפעול</td></tr></table>
<p>מגבלות אמיתיות שהרבה פעמים מכריעות את השורה: פריט ב-DynamoDB מוגבל ל-400KB, ובערך 1000 WCU ו-3000 RCU לכל partition; מסמך ב-MongoDB עד 16MB; logical partition ב-Cosmos DB עד 20GB; ב-Firestore בערך כתיבה אחת בשנייה לאורך זמן לכל מסמך; partition ב-Cassandra צריך להישאר מתחת ל-100MB בערך (ועדיף מתחת ל-10MB); S3 מחזיק 3,500 PUT ו-5,500 GET בשנייה <em>לכל prefix</em>; האחסון של RDS Postgres נגמר ב-64TiB, ושל Aurora ב-128TiB.</p>
<blockquote>⚠️ טיפ לפרודקשן: "NoSQL עושה scale ו-SQL לא" זה סלוגן מ-2012. הניסוח הכן הוא: NoSQL מכריח אותך <em>לתכנן את ה-partition key מראש</em> כדי שיוכל לגדול; SQL נותן לך לדחות את ההחלטה ומשלם אחר כך בעבודת sharding. תבחר איזה כאב אתה מעדיף, במודע.</blockquote>`
      }
    },
    {
      h: { en: "Three products, three data maps", he: "שלושה מוצרים, שלוש מפות דאטה" },
      body: {
        en: `<p>These maps are <em>illustrative</em>: they follow publicly described designs (Dropbox, Google, Discord, Netflix engineering blogs) and the reasoning you'd use, not anyone's exact internal setup.</p>
<p><strong>Drive-like (file sync &amp; share)</strong></p>
<table><tr><th>Entity</th><th>Pattern</th><th>Store</th><th>Why / what would change it</th></tr>
<tr><td>File &amp; folder metadata, versions</td><td>Read-heavy, tree queries, must be transactional (move = atomic)</td><td>Spanner, or Postgres/MySQL sharded by user/namespace (Dropbox ran sharded MySQL)</td><td>Strong consistency on rename/move; sharding by namespace keeps a user's tree on one shard. A shared folder spanning orgs is the hard case</td></tr>
<tr><td>File content</td><td>Write-once, huge (PB), read in ranges</td><td>Object storage, files split into chunks (e.g. 4 MB) addressed by SHA-256</td><td>Content-addressed chunks give dedup and resumable upload for free; small files get packed to avoid per-object overhead</td></tr>
<tr><td>Chunk index (hash → location, refcount)</td><td>Point lookups, very high volume</td><td>KV / wide-column (Bigtable, DynamoDB)</td><td>Only key access; refcounts drive garbage collection</td></tr>
<tr><td>ACLs / sharing</td><td>Checked on every request, must revoke instantly</td><td>Relational with the metadata (or a Zanzibar-style authz service) + short-TTL cache</td><td>Eventual consistency here is a security bug</td></tr>
<tr><td>Search (names, content)</td><td>Full-text, per-user filter</td><td>OpenSearch fed by CDC/events</td><td>Derived; can lag seconds; rebuildable</td></tr></table>
<p><strong>WhatsApp-like (messaging)</strong></p>
<table><tr><th>Entity</th><th>Pattern</th><th>Store</th><th>Why / what would change it</th></tr>
<tr><td>Messages</td><td>~1:1 read:write, append, "latest N of conversation"</td><td>Cassandra/ScyllaDB, partition key (conversation_id, time_bucket), clustering by message id desc</td><td>LSM absorbs writes; bucketing keeps partitions &lt; 100 MB (Discord publicly used exactly this shape, moving from Cassandra to ScyllaDB). If messages are deleted after delivery, the store is mostly a queue</td></tr>
<tr><td>Offline delivery queue</td><td>Per-device inbox, delete on ack</td><td>Wide-column per device, or Kafka + per-device pointer</td><td>Tombstones from deletes need compaction tuning (TWCS)</td></tr>
<tr><td>Presence, sessions, "which gateway holds user X"</td><td>Sub-ms, high churn, can be lost</td><td>Redis cluster with TTL heartbeats</td><td>Rebuilt from reconnects; not worth durability</td></tr>
<tr><td>Media (photos, voice)</td><td>Upload once, download a few times</td><td>Object storage + CDN, lifecycle to cold tier</td><td>E2E-encrypted blobs: server can't dedup across users</td></tr>
<tr><td>Users, contacts, groups</td><td>Relational-ish, moderate scale</td><td>Sharded MySQL/Postgres or the same wide-column store</td><td>Group membership with 1024 members fits one partition</td></tr></table>
<p><strong>Netflix-like (streaming)</strong></p>
<table><tr><th>Entity</th><th>Pattern</th><th>Store</th><th>Why / what would change it</th></tr>
<tr><td>Catalog / titles metadata</td><td>Read-extreme, written by internal tools</td><td>Source of truth in a relational/document store, served from in-memory caches and published snapshots</td><td>Read path never hits the DB directly</td></tr>
<tr><td>Viewing history, bookmarks</td><td>Massive write volume (heartbeats every few seconds of playback), per-member reads</td><td>Cassandra, multi-region, partitioned by member</td><td>Eventual consistency is fine; availability across regions is not negotiable</td></tr>
<tr><td>Hot lookups (personalisation results, sessions)</td><td>Millions of reads/s, ms latency</td><td>EVCache (Memcached-based, replicated across zones)</td><td>Cache as a first-class tier, not an afterthought</td></tr>
<tr><td>Video files</td><td>PB, read by CDN fill</td><td>S3 as master, Open Connect appliances in ISPs serve the bytes</td><td>The CDN, not the database, is the scale story</td></tr>
<tr><td>Events, analytics, ML</td><td>Trillions of events/day</td><td>Kafka → stream processing → data lake (S3 + Iceberg) → Spark/Trino</td><td>Decoupled from the product path; replayable</td></tr></table>`,
        he: `<p>המפות האלה <em>להמחשה</em>: הן הולכות לפי עיצובים שתוארו בפומבי (בלוגי ההנדסה של Dropbox, Google, Discord ו-Netflix) ולפי ההיגיון שהיית משתמש בו, לא לפי ה-setup הפנימי המדויק של אף אחד.</p>
<p><strong>בסגנון Drive (סנכרון ושיתוף קבצים)</strong></p>
<table><tr><th>ישות</th><th>דפוס</th><th>Store</th><th>למה / מה ישנה את ההחלטה</th></tr>
<tr><td>מטא-דאטה של קבצים ותיקיות, גרסאות</td><td>עתיר קריאות, שאילתות על עץ, חייב להיות טרנזקציוני (move = אטומי)</td><td>Spanner, או Postgres/MySQL עם sharding לפי user/namespace (ב-Dropbox רץ MySQL מפוצל)</td><td>Strong consistency ב-rename וב-move; sharding לפי namespace שומר את העץ של משתמש על shard אחד. תיקייה משותפת בין ארגונים היא המקרה הקשה</td></tr>
<tr><td>תוכן הקבצים</td><td>נכתב פעם אחת, עצום (PB), נקרא בטווחים</td><td>Object storage, הקבצים מחולקים ל-chunks (נגיד 4MB) שהכתובת שלהם היא SHA-256</td><td>Chunks לפי תוכן נותנים dedup ו-upload שאפשר לחדש בחינם; קבצים קטנים נארזים יחד כדי לחסוך overhead לכל אובייקט</td></tr>
<tr><td>אינדקס chunks (hash ← מיקום, refcount)</td><td>שליפות לפי key, נפח גבוה מאוד</td><td>KV / wide-column (Bigtable, DynamoDB)</td><td>רק גישה לפי key; ה-refcounts מניעים את ה-garbage collection</td></tr>
<tr><td>ACLs / שיתופים</td><td>נבדק בכל בקשה, ביטול חייב להיות מיידי</td><td>רלציוני יחד עם המטא-דאטה (או שירות authz בסגנון Zanzibar) + cache עם TTL קצר</td><td>Eventual consistency כאן זה באג אבטחה</td></tr>
<tr><td>חיפוש (שמות, תוכן)</td><td>Full-text, סינון לפי משתמש</td><td>OpenSearch שמוזן מ-CDC או events</td><td>נגזר; יכול לפגר בשניות; אפשר לבנות מחדש</td></tr></table>
<p><strong>בסגנון WhatsApp (הודעות)</strong></p>
<table><tr><th>ישות</th><th>דפוס</th><th>Store</th><th>למה / מה ישנה את ההחלטה</th></tr>
<tr><td>הודעות</td><td>יחס read:write של בערך 1:1, append, "N האחרונות בשיחה"</td><td>Cassandra/ScyllaDB, ‏partition key של (conversation_id, time_bucket), clustering לפי message id בסדר יורד</td><td>LSM בולע כתיבות; ה-bucketing שומר partitions מתחת ל-100MB (ב-Discord השתמשו בפומבי בדיוק בצורה הזו, ועברו מ-Cassandra ל-ScyllaDB). אם הודעות נמחקות אחרי מסירה, ה-store הוא בעיקר תור</td></tr>
<tr><td>תור מסירה ל-offline</td><td>Inbox לכל מכשיר, מחיקה ב-ack</td><td>Wide-column לכל מכשיר, או Kafka עם pointer לכל מכשיר</td><td>ה-tombstones מהמחיקות דורשים כיוונון compaction ‏(TWCS)</td></tr>
<tr><td>Presence, sessions, "איזה gateway מחזיק את משתמש X"</td><td>פחות ממילישנייה, churn גבוה, מותר לאבד</td><td>Redis cluster עם heartbeats ו-TTL</td><td>נבנה מחדש מ-reconnects; לא שווה לשלם על עמידות</td></tr>
<tr><td>מדיה (תמונות, הקלטות)</td><td>עולה פעם אחת, יורד כמה פעמים</td><td>Object storage + CDN, ‏lifecycle ל-tier קר</td><td>Blobs מוצפנים E2E: השרת לא יכול לעשות dedup בין משתמשים</td></tr>
<tr><td>משתמשים, אנשי קשר, קבוצות</td><td>די רלציוני, scale בינוני</td><td>MySQL/Postgres מפוצל, או אותו store של wide-column</td><td>חברות בקבוצה עם 1024 משתתפים נכנסת ל-partition אחד</td></tr></table>
<p><strong>בסגנון Netflix (סטרימינג)</strong></p>
<table><tr><th>ישות</th><th>דפוס</th><th>Store</th><th>למה / מה ישנה את ההחלטה</th></tr>
<tr><td>קטלוג / מטא-דאטה של תכנים</td><td>קריאה קיצונית, נכתב מכלים פנימיים</td><td>מקור האמת ב-store רלציוני או document, מוגש מ-caches בזיכרון ומ-snapshots שמתפרסמים</td><td>מסלול הקריאה אף פעם לא פוגע ב-DB ישירות</td></tr>
<tr><td>היסטוריית צפייה, bookmarks</td><td>נפח כתיבות עצום (heartbeat כל כמה שניות של צפייה), קריאות לפי מנוי</td><td>Cassandra, ‏multi-region, מחולק לפי מנוי</td><td>Eventual consistency בסדר; זמינות בין regions לא נתונה למשא ומתן</td></tr>
<tr><td>שליפות חמות (תוצאות פרסונליזציה, sessions)</td><td>מיליוני קריאות בשנייה, latency של ms</td><td>EVCache (מבוסס Memcached, משוכפל בין zones)</td><td>Cache כשכבה מדרגה ראשונה, לא מחשבה שנייה</td></tr>
<tr><td>קבצי וידאו</td><td>PB, נקראים במילוי ה-CDN</td><td>S3 כמקור, ושרתי Open Connect אצל ספקי האינטרנט מגישים את הבייטים</td><td>ה-CDN, לא ה-DB, הוא סיפור ה-scale</td></tr>
<tr><td>Events, analytics, ML</td><td>טריליוני events ביום</td><td>Kafka → stream processing → data lake ‏(S3 + Iceberg) → Spark/Trino</td><td>מנותק ממסלול המוצר; אפשר לעשות replay</td></tr></table>`
      }
    },
    {
      h: { en: "Managed vs self-hosted, and the real cost of every extra engine", he: "Managed מול self-hosted, והמחיר האמיתי של כל מנוע נוסף" },
      body: {
        en: `<p>Every engine you add is a permanent subscription, paid in people. Before adding one, price it:</p>
<ul><li><strong>On-call</strong>: someone must know how it fails (Cassandra repairs and tombstones, Elasticsearch split-brain and heap, Kafka ISR shrink). Without two people who know it, you have a single point of failure in the team.</li>
<li><strong>Backups and restore drills</strong>: each engine has its own tooling and its own "restore is slower than you think".</li>
<li><strong>Upgrades and security patches</strong>: majors every 1-2 years, CVEs, client library compatibility.</li>
<li><strong>Observability, IaC, access control, DR</strong>: dashboards, alerts, Terraform modules, IAM, encryption, cross-region replication, all again.</li>
<li><strong>Data consistency between stores</strong>: the moment data lives in two places you need CDC/outbox and reconciliation.</li></ul>
<p>A useful rule of thumb: a self-hosted stateful engine in production costs roughly 0.5-1 engineer of ongoing attention; a managed one roughly 0.1-0.3. That is often more than the infrastructure bill.</p>
<table><tr><th>Factor</th><th>Lean managed (RDS/Aurora, Cloud SQL, DynamoDB, Keyspaces, Atlas, MemoryDB, MSK/Confluent)</th><th>Lean self-hosted (on K8s or VMs)</th></tr>
<tr><td>Team size</td><td>No dedicated DB/platform team</td><td>A team that already runs this engine well</td></tr>
<tr><td>Scale and cost</td><td>Small-to-large; premium is cheaper than people</td><td>Very large steady fleets where 2-3x managed markup is millions/year</td></tr>
<tr><td>Features</td><td>The managed flavour has what you need</td><td>You need an extension, version, kernel/disk tuning or topology the service doesn't allow</td></tr>
<tr><td>Portability / sovereignty</td><td>Single cloud is acceptable</td><td>Multi-cloud, on-prem or air-gapped is a hard requirement</td></tr></table>
<blockquote>💡 The boring default: start with <strong>Postgres (managed) + object storage + Redis</strong>. Postgres also covers JSONB documents, full-text for small data, queues (<code>SELECT ... FOR UPDATE SKIP LOCKED</code>), time-series (TimescaleDB) and vectors (pgvector) until a measured need says otherwise. Add a specialised store when a metric proves it: write throughput, p99 latency, storage size, or a query the current store can't serve.</blockquote>`,
        he: `<p>כל מנוע שאתה מוסיף הוא מנוי קבוע, שמשלמים עליו באנשים. לפני שמוסיפים, מתמחרים:</p>
<ul><li><strong>On-call</strong>: מישהו חייב לדעת איך הוא נופל (repairs ו-tombstones ב-Cassandra, ‏split-brain ו-heap ב-Elasticsearch, ‏ISR שמתכווץ ב-Kafka). בלי שני אנשים שמכירים אותו, יש לך single point of failure בתוך הצוות.</li>
<li><strong>גיבויים ותרגילי שחזור</strong>: לכל מנוע יש כלים משלו ו-"שחזור שלוקח יותר זמן ממה שחשבת" משלו.</li>
<li><strong>שדרוגים ו-security patches</strong>: גרסת major כל שנה-שנתיים, CVEs, תאימות של client libraries.</li>
<li><strong>Observability, ‏IaC, הרשאות, DR</strong>: דשבורדים, alerts, מודולי Terraform, IAM, הצפנה, replication בין regions, הכול מחדש.</li>
<li><strong>עקביות בין stores</strong>: ברגע שדאטה חי בשני מקומות, צריך CDC או outbox ו-reconciliation.</li></ul>
<p>כלל אצבע שימושי: מנוע stateful בניהול עצמי בפרודקשן עולה בערך 0.5-1 מהנדס של תשומת לב שוטפת; מנוע managed בערך 0.1-0.3. זה הרבה פעמים יותר מחשבון התשתית.</p>
<table><tr><th>שיקול</th><th>נוטה ל-managed (RDS/Aurora, Cloud SQL, DynamoDB, Keyspaces, Atlas, MemoryDB, MSK/Confluent)</th><th>נוטה ל-self-hosted (על K8s או VMs)</th></tr>
<tr><td>גודל הצוות</td><td>אין צוות DB או platform ייעודי</td><td>יש צוות שכבר מריץ את המנוע הזה טוב</td></tr>
<tr><td>Scale ועלות</td><td>מקטן ועד גדול; הפרמיה זולה יותר מאנשים</td><td>ציים גדולים מאוד ויציבים, שבהם תוספת של פי 2-3 על managed היא מיליונים בשנה</td></tr>
<tr><td>פיצ'רים</td><td>לגרסה המנוהלת יש את מה שצריך</td><td>צריך extension, גרסה, כיוונון kernel או דיסקים, או טופולוגיה שהשירות לא מאפשר</td></tr>
<tr><td>ניידות / ריבונות</td><td>ענן אחד זה מקובל</td><td>Multi-cloud, ‏on-prem או air-gapped זו דרישה קשיחה</td></tr></table>
<blockquote>💡 ברירת המחדל המשעממת: מתחילים עם <strong>Postgres (managed) + object storage + Redis</strong>. Postgres מכסה גם מסמכי JSONB, ‏full-text לדאטה קטן, תורים (<code>SELECT ... FOR UPDATE SKIP LOCKED</code>), ‏time-series ‏(TimescaleDB) ווקטורים (pgvector), עד שצורך שנמדד אומר אחרת. מוסיפים store מיוחד כשמטריקה מוכיחה את זה: throughput של כתיבות, p99 latency, גודל אחסון, או שאילתה שה-store הנוכחי לא מסוגל להגיש.</blockquote>`
      }
    },
    {
      h: { en: "When you outgrow a store: the migration path", he: "כשגדלת מעבר ל-store: מסלול המיגרציה" },
      body: {
        en: `<p>Climb the cheap rungs first; each one buys months or years:</p>
<ol><li><strong>Fix the queries</strong>: indexes, <code>pg_stat_statements</code>, N+1s. Often 10x for free.</li>
<li><strong>Scale up</strong>: a bigger instance and faster storage (IOPS) is boring and works up to very large boxes.</li>
<li><strong>Read replicas + cache</strong>: offload reads; watch replica lag and stale-read bugs.</li>
<li><strong>Shrink the hot set</strong>: archive old rows to object storage, partition tables by time, move blobs out of the DB.</li>
<li><strong>Split by entity</strong>: move the one hot entity (events, messages) to a store built for it; everything else stays.</li>
<li><strong>Shard or go distributed</strong>: Citus/Vitess (keep the engine) or Spanner/CockroachDB (change the engine).</li></ol>
<p>Moving an entity between stores is always the same dance, and it takes months, not a sprint:</p>
<pre>1. Dual-write   app/CDC writes to old + new (old is still source of truth)
2. Backfill     copy history in batches, idempotent, throttled
3. Shadow-read  read both, compare, log mismatches (target: 0 for N days)
4. Cut reads    flip reads to new behind a flag, per tenant / percentage
5. Cut writes   new becomes source of truth; old fed by CDC for rollback
6. Decommission after a rollback window (weeks), then delete old data</pre>
<p><strong>Signals that you really outgrew it</strong> (measured, not felt): primary CPU &gt; 70% sustained after tuning, write IOPS at the volume ceiling, replica lag over your staleness budget, storage heading past ~10-20 TB on one node with restore times breaking the RTO, or vacuum/compaction never catching up.</p>
<blockquote>⚠️ The irreversible part is the <strong>partition key</strong>. In Cassandra, DynamoDB or a sharded SQL, changing it means rewriting all data. Spend a full design review on it; simulate the hottest tenant/conversation/celebrity before committing.</blockquote>`,
        he: `<p>קודם מטפסים על השלבים הזולים; כל אחד קונה חודשים או שנים:</p>
<ol><li><strong>לתקן את השאילתות</strong>: אינדקסים, <code>pg_stat_statements</code>, ‏N+1. הרבה פעמים פי 10 בחינם.</li>
<li><strong>Scale up</strong>: instance גדול יותר ואחסון מהיר יותר (IOPS) זה משעמם ועובד עד מכונות גדולות מאוד.</li>
<li><strong>Read replicas ו-cache</strong>: מורידים קריאות מה-primary; שמים עין על replica lag ועל באגים של קריאה ישנה.</li>
<li><strong>להקטין את ה-hot set</strong>: לארכב שורות ישנות ל-object storage, לחלק טבלאות לפי זמן, להוציא blobs מה-DB.</li>
<li><strong>לפצל לפי ישות</strong>: להעביר את הישות החמה האחת (events, הודעות) ל-store שנבנה בשבילה; כל השאר נשאר.</li>
<li><strong>Sharding או distributed</strong>: Citus/Vitess (שומרים על המנוע) או Spanner/CockroachDB (מחליפים מנוע).</li></ol>
<p>להעביר ישות בין stores זה תמיד אותו ריקוד, וזה לוקח חודשים, לא ספרינט:</p>
<pre>1. Dual-write   app/CDC writes to old + new (old is still source of truth)
2. Backfill     copy history in batches, idempotent, throttled
3. Shadow-read  read both, compare, log mismatches (target: 0 for N days)
4. Cut reads    flip reads to new behind a flag, per tenant / percentage
5. Cut writes   new becomes source of truth; old fed by CDC for rollback
6. Decommission after a rollback window (weeks), then delete old data</pre>
<p><strong>סימנים שבאמת גדלת מעבר לו</strong> (שנמדדו, לא שהרגשת): CPU של ה-primary מעל 70% לאורך זמן אחרי כיוונון, IOPS של כתיבה בתקרה של ה-volume, ‏replica lag מעבר לתקציב ה-staleness, אחסון שמתקרב ל-10-20TB על node אחד עם זמני שחזור ששוברים את ה-RTO, או vacuum/compaction שאף פעם לא מדביקים את הקצב.</p>
<blockquote>⚠️ החלק הבלתי הפיך הוא ה-<strong>partition key</strong>. ב-Cassandra, ב-DynamoDB או ב-SQL מפוצל, לשנות אותו זה לשכתב את כל הדאטה. תקדיש לו design review שלם; תסמלץ את ה-tenant, השיחה או הסלב הכי חמים לפני שמתחייבים.</blockquote>`
      }
    }
  ],
  diagram: `  For each ENTITY (not for the whole product):
  need ACID / joins / unknown queries? --yes--> fits 1 primary? --yes--> Postgres/MySQL (managed)
         |                                           \\--no--> sharded SQL (Citus/Vitess) or Spanner/Cockroach
         no
         v
  big immutable blobs? ----------------yes--> Object storage (S3/GCS/Blob) + CDN
  huge writes, known key/range? -------yes--> Cassandra/ScyllaDB/Bigtable/DynamoDB
  sub-ms key lookups, can rebuild? ----yes--> Redis/Memcached
  full-text / relevance? --------------yes--> OpenSearch (derived via CDC)
  scans over TB-PB? -------------------yes--> BigQuery/Snowflake/ClickHouse
  ordered events, many consumers? -----yes--> Kafka
  else ------------------------------------> stay on Postgres until a metric says otherwise`,
  handsOn: [
    {
      cmd: "pgbench -i -s 100 bench && pgbench -c 32 -j 8 -T 60 -P 10 bench",
      what: { en: "Initialise a ~1.5 GB pgbench dataset and run 32 clients for 60 s. The TPS and latency numbers are your baseline for 'does one Postgres primary handle our write rate?'.", he: "מאתחל dataset של pgbench בגודל של בערך 1.5GB ומריץ 32 clients למשך 60 שניות. ה-TPS וה-latency הם ה-baseline שלך לשאלה 'האם primary אחד של Postgres מחזיק את קצב הכתיבה שלנו?'." }
    },
    {
      cmd: "psql -c \"SELECT calls, round(mean_exec_time::numeric,2) AS ms, query FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;\"",
      what: { en: "Find the 10 queries consuming the most DB time. Fix these before concluding you need a new database.", he: "מוצא את 10 השאילתות שצורכות הכי הרבה זמן DB. מתקנים אותן לפני שמסיקים שצריך DB חדש." }
    },
    {
      cmd: "cqlsh -e \"DESCRIBE TABLE chat.messages;\" && nodetool tablestats chat.messages | grep -i 'partition'",
      what: { en: "See the partition and clustering keys of a wide-column table, then check max/mean partition size: anything near 100 MB means the bucketing is wrong.", he: "מציג את ה-partition key וה-clustering key של טבלת wide-column, ואז בודק גודל partition מקסימלי וממוצע: כל דבר שמתקרב ל-100MB אומר שה-bucketing שגוי." }
    },
    {
      cmd: "redis-cli -h cache.internal --latency-history -i 5",
      what: { en: "Measure round-trip latency to Redis in 5-second windows. Expect well under 1 ms in-zone; spikes point to slow commands (check SLOWLOG GET) or network.", he: "מודד latency הלוך-חזור ל-Redis בחלונות של 5 שניות. בתוך אותו zone מצפים להרבה פחות ממילישנייה; קפיצות מצביעות על פקודות איטיות (תבדוק SLOWLOG GET) או על הרשת." }
    },
    {
      cmd: "aws dynamodb describe-table --table-name Sessions --query 'Table.{keys:KeySchema,billing:BillingModeSummary,items:ItemCount,bytes:TableSizeBytes,gsi:GlobalSecondaryIndexes[].IndexName}'",
      what: { en: "Check a DynamoDB table's key schema, billing mode, size and GSIs. The key schema is the access pattern you committed to.", he: "בודק ב-DynamoDB את ה-key schema, ה-billing mode, הגודל וה-GSIs של טבלה. ה-key schema הוא ה-access pattern שהתחייבת אליו." }
    }
  ],
  mnemonic: {
    en: "\"Patterns before products, boring before bespoke.\" Worksheet columns: R-Q-C-S-L-M-R: Ratio, Query shape, Consistency, Size, Latency, Multi-region, Retention.",
    he: "\"דפוסים לפני מוצרים, משעמם לפני מיוחד.\" עמודות הגיליון: R-Q-C-S-L-M-R: ‏Ratio, ‏Query shape, ‏Consistency, ‏Size, ‏Latency, ‏Multi-region, ‏Retention."
  },
  pitfalls: [
    { en: "Choosing the store by brand or résumé ('we use Mongo for everything') instead of per-entity access patterns, then discovering the one query that needs a join across 40M documents.", he: "לבחור store לפי מותג או לפי קורות חיים ('אצלנו הכול Mongo') במקום לפי access patterns לכל ישות, ואז לגלות את השאילתה האחת שצריכה join על 40 מיליון מסמכים." },
    { en: "Adding a fifth database for a 5% gain. Each engine adds on-call, backups, upgrades, IAM and DR forever; a team of 6 cannot be experts in Postgres, Mongo, Cassandra, Elastic and Kafka at once.", he: "להוסיף DB חמישי בשביל שיפור של 5%. כל מנוע מוסיף on-call, גיבויים, שדרוגים, IAM ו-DR לתמיד; צוות של 6 אנשים לא יכול להיות מומחה ב-Postgres, ‏Mongo, ‏Cassandra, ‏Elastic ו-Kafka בבת אחת." },
    { en: "Making a derived store (search index, cache) the source of truth. When it loses data or needs a reindex, you have nothing to rebuild from.", he: "להפוך store נגזר (search index, ‏cache) למקור האמת. כשהוא מאבד דאטה או צריך reindex, אין לך ממה לבנות מחדש." },
    { en: "Picking a partition key without modelling the hot key: one celebrity, one huge group chat or one tenant concentrates traffic on one partition and caps the whole system.", he: "לבחור partition key בלי למדל את ה-hot key: סלב אחד, קבוצת צ'אט ענקית אחת או tenant אחד מרכזים טראפיק על partition אחד וחוסמים את כל המערכת." }
  ],
  interview: [
    {
      q: { en: "Design the data layer for a Google Drive clone. Which stores and why?", he: "תתכנן את שכבת הדאטה לשכפול של Google Drive. אילו stores ולמה?" },
      a: { en: "Split by entity. Metadata (tree, versions, ACLs) needs transactions and strong consistency, because a move or a revoked share must be atomic and immediate, so a relational store sharded by namespace, or Spanner if we need global strong consistency. Content goes to object storage as content-addressed chunks (~4 MB, SHA-256), which gives dedup and resumable uploads; a KV store maps hash to location and refcount for GC. Search is OpenSearch fed by CDC, explicitly derived. Redis caches hot metadata and ACL checks with short TTLs. I'd start with managed Postgres and only shard when one primary's write rate or size is measured as the limit.", he: "מפצלים לפי ישות. מטא-דאטה (עץ, גרסאות, ACLs) צריך טרנזקציות ו-strong consistency, כי move או ביטול שיתוף חייבים להיות אטומיים ומיידיים, אז store רלציוני עם sharding לפי namespace, או Spanner אם צריך strong consistency גלובלי. התוכן הולך ל-object storage כ-chunks לפי תוכן (בערך 4MB, ‏SHA-256), מה שנותן dedup ו-upload שאפשר לחדש; store של KV ממפה hash למיקום ול-refcount בשביל GC. חיפוש ב-OpenSearch שמוזן מ-CDC, ומוגדר במפורש כנגזר. Redis עושה cache למטא-דאטה חם ולבדיקות ACL עם TTL קצר. הייתי מתחיל עם Postgres מנוהל ועושה sharding רק כשנמדד שקצב הכתיבה או הגודל של primary אחד הם המגבלה." }
    },
    {
      q: { en: "Your team wants to add Cassandra next to Postgres. How do you decide?", he: "הצוות רוצה להוסיף Cassandra ליד Postgres. איך אתה מחליט?" },
      a: { en: "Ask for the measured need: which entity, what write rate, what growth, which query. If it's 50k writes/s of append-only events with 'latest N by key' reads and multi-region availability, Cassandra fits. Then price it: who is on-call, how are repairs, backups and restores done, can we use a managed flavour (Keyspaces, Astra) or ScyllaDB Cloud, and how do we keep it consistent with Postgres (outbox/CDC). Alternatives to rule out first: Postgres partitioning plus a bigger instance, DynamoDB if we're on AWS and want zero ops. Decide in a short design doc with the numbers and a rollback path.", he: "מבקש את הצורך שנמדד: איזו ישות, איזה קצב כתיבה, איזו גדילה, איזו שאילתה. אם זה 50k כתיבות בשנייה של events שרק מתווספים, עם קריאות של 'N האחרונים לפי key' וזמינות multi-region, ‏Cassandra מתאים. אחר כך מתמחר: מי ב-on-call, איך עושים repairs, גיבויים ושחזורים, אפשר לקחת גרסה מנוהלת (Keyspaces, ‏Astra) או ScyllaDB Cloud, ואיך שומרים עקביות מול Postgres (outbox או CDC). חלופות שצריך לפסול קודם: partitioning ב-Postgres ו-instance גדול יותר, או DynamoDB אם אנחנו על AWS ורוצים אפס תפעול. מחליטים ב-design doc קצר עם המספרים ועם מסלול rollback." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the FIRST step when choosing data stores for a new product?", he: "מה הצעד הראשון כשבוחרים data stores למוצר חדש?" },
      options: [
        { en: "Pick the database the team knows best and model everything in it", he: "לבחור את ה-DB שהצוות מכיר הכי טוב ולמדל בו הכול" },
        { en: "List each entity's access pattern: ratio, query shape, consistency, size, latency, multi-region, retention", he: "לרשום לכל ישות את ה-access pattern: יחס, צורת שאילתה, consistency, גודל, latency, ‏multi-region, ‏retention" },
        { en: "Benchmark five NoSQL databases on synthetic data", he: "להריץ benchmark על חמישה DBs של NoSQL עם דאטה סינתטי" },
        { en: "Choose the store that scales the most so you never need to migrate", he: "לבחור את ה-store שעושה הכי הרבה scale כדי שלא תצטרך מיגרציה אף פעם" }
      ],
      answer: 1,
      explain: { en: "Store choice is per entity and follows from how it's read and written. Familiarity matters later as a cost factor, and 'scales the most' usually buys complexity you don't need.", he: "הבחירה היא לכל ישות ונגזרת מאיך קוראים וכותבים אותה. ההיכרות של הצוות חשובה אחר כך כשיקול עלות, ו-'הכי הרבה scale' בדרך כלל קונה מורכבות שאין בה צורך." }
    },
    {
      q: { en: "A chat app stores messages read as 'latest 50 of conversation X' at 300k writes/s across 3 regions. Best fit?", he: "אפליקציית צ'אט שומרת הודעות שנקראות כ-'50 האחרונות בשיחה X', ב-300k כתיבות בשנייה על פני 3 regions. מה מתאים?" },
      options: [
        { en: "A single Postgres primary with read replicas", he: "Primary אחד של Postgres עם read replicas" },
        { en: "Elasticsearch as the primary store", he: "Elasticsearch כ-store הראשי" },
        { en: "Wide-column (Cassandra/ScyllaDB) with partition key (conversation_id, time_bucket)", he: "Wide-column ‏(Cassandra/ScyllaDB) עם partition key של (conversation_id, time_bucket)" },
        { en: "Object storage with one object per message", he: "Object storage עם אובייקט לכל הודעה" }
      ],
      answer: 2,
      explain: { en: "Huge append writes, a known range query inside one partition, and multi-region availability are the textbook wide-column case. Bucketing by time keeps partitions small. One Postgres primary can't take the writes; search indexes and object storage are wrong for this access shape.", he: "כתיבות append עצומות, שאילתת טווח ידועה בתוך partition אחד וזמינות multi-region הם המקרה הקלאסי של wide-column. ה-bucketing לפי זמן שומר partitions קטנים. Primary אחד של Postgres לא יחזיק את הכתיבות; search index ו-object storage לא מתאימים לצורת הגישה הזו." }
    },
    {
      q: { en: "Why is 'Postgres + object storage + Redis' called the boring default?", he: "למה 'Postgres + object storage + Redis' נקרא ברירת המחדל המשעממת?" },
      options: [
        { en: "Because they are the cheapest products on every cloud", he: "כי אלה המוצרים הכי זולים בכל ענן" },
        { en: "Because they cover most entity patterns with well-understood operations, so specialised stores are added only for measured needs", he: "כי הם מכסים את רוב דפוסי הישויות עם תפעול מוכר היטב, כך שמוסיפים stores מיוחדים רק לצורך שנמדד" },
        { en: "Because NoSQL databases are deprecated", he: "כי מסדי NoSQL כבר לא נתמכים" },
        { en: "Because they guarantee multi-region strong consistency", he: "כי הם מבטיחים strong consistency ב-multi-region" }
      ],
      answer: 1,
      explain: { en: "The point is operational cost: every extra engine costs on-call, backups, upgrades and skills. Start with a small, well-known set and earn each addition with a metric.", he: "העניין הוא עלות תפעול: כל מנוע נוסף עולה on-call, גיבויים, שדרוגים וידע. מתחילים עם סט קטן ומוכר, וכל תוספת צריכה להצדיק את עצמה במטריקה." }
    },
    {
      q: { en: "Moving the 'events' table from Postgres to a new store. Which order is safest?", he: "מעבירים את טבלת ה-'events' מ-Postgres ל-store חדש. איזה סדר הכי בטוח?" },
      options: [
        { en: "Stop writes, export, import, switch the connection string", he: "לעצור כתיבות, לייצא, לייבא, להחליף connection string" },
        { en: "Cut writes to the new store first, then backfill history", he: "להעביר קודם את הכתיבות ל-store החדש, ואז למלא היסטוריה" },
        { en: "Dual-write, backfill, shadow-read and compare, cut reads, cut writes, decommission after a rollback window", he: "Dual-write, ‏backfill, ‏shadow-read והשוואה, העברת קריאות, העברת כתיבות, פירוק אחרי חלון rollback" },
        { en: "Rewrite the service against the new store and deploy it in one release", he: "לשכתב את השירות מול ה-store החדש ולפרוס ב-release אחד" }
      ],
      answer: 2,
      explain: { en: "The old store stays the source of truth until shadow reads prove the new one matches, and reads move before writes so you can roll back at every step.", he: "ה-store הישן נשאר מקור האמת עד ש-shadow reads מוכיחים שהחדש תואם, והקריאות עוברות לפני הכתיבות כדי שאפשר יהיה לעשות rollback בכל שלב." }
    }
  ],
  playground: "lsm",
  related: ["plan-product-infra-blueprint", "pr-db-landscape", "pr-cap-pacelc", "pr-data-modeling", "db-sql-vs-nosql", "db-sharding", "db-wide-column-kv", "db-managed-cloud", "staff-multi-region-data", "staff-zero-downtime-migrations"]
});

INFRA.lessons.push({
  id: "plan-global-traffic",
  track: "principal",
  order: 184,
  icon: "🌍",
  level: 3,
  minutes: 18,
  title: { en: "Global Traffic Management: Reaching the Right Region and Failing Over", he: "ניהול טראפיק גלובלי: להגיע ל-region הנכון ולעשות failover" },
  tldr: {
    en: "Users reach your regions through layers: DNS (GeoDNS), an anycast edge (global L7 LB / accelerator), a CDN, then a regional LB and mesh. DNS steering is cheap and protocol-agnostic but fails over in minutes because resolvers cache; anycast edges fail over in seconds and add WAF and L7 features but cost more and are mostly HTTP. Pick per traffic type, prove health checks detect real failure, and drill the failover.",
    he: "משתמשים מגיעים ל-regions שלך דרך שכבות: DNS ‏(GeoDNS), ‏edge של anycast (L7 LB גלובלי או accelerator), ‏CDN, ואז LB אזורי ו-mesh. ניתוב ב-DNS זול ולא תלוי פרוטוקול, אבל ה-failover שלו לוקח דקות כי resolvers עושים cache; edge של anycast עושה failover בשניות ומוסיף WAF ופיצ'רים של L7, אבל עולה יותר ורובו HTTP. בוחרים לפי סוג הטראפיק, מוכיחים שה-health checks מזהים כשל אמיתי, ומתרגלים את ה-failover."
  },
  analogy: {
    en: "Getting fans to the right stadium gate. DNS is the printed map you mailed last week: cheap, works for everyone, but if a gate closes, people holding old maps still walk there. Anycast is a steward at every highway exit who points each car to an open gate right now. The CDN is selling drinks in the parking lot so most people never need to enter. And for season-ticket holders who sit all game (long-lived connections), closing a gate means politely moving them, not shoving everyone out at once.",
    he: "להביא אוהדים לשער הנכון באצטדיון. DNS זו המפה המודפסת ששלחת בדואר לפני שבוע: זולה ועובדת לכולם, אבל אם שער נסגר, מי שמחזיק מפה ישנה עדיין הולך אליו. Anycast זה סדרן בכל יציאה מהכביש שמפנה כל רכב לשער שפתוח עכשיו. ה-CDN זה דוכן שתייה בחניה, כך שרוב האנשים בכלל לא צריכים להיכנס. ולבעלי מנוי שיושבים כל המשחק (חיבורים ארוכים), לסגור שער פירושו להעביר אותם בנימוס, לא לדחוף את כולם החוצה בבת אחת."
  },
  sections: [
    {
      h: { en: "The layers, and what each one decides", he: "השכבות, ומה כל אחת מחליטה" },
      body: {
        en: `<table><tr><th>Layer</th><th>Decides</th><th>Granularity</th><th>Failover speed</th><th>Examples</th></tr>
<tr><td>DNS / GeoDNS</td><td>Which IP (region/edge) a client resolves to</td><td>Per resolver (not per user, unless ECS)</td><td>TTL + resolver caching: 1-10+ min in practice</td><td>Route 53, Azure Traffic Manager, Azure DNS, Cloud DNS, NS1, Cloudflare DNS</td></tr>
<tr><td>Anycast edge / global LB</td><td>Which healthy backend region gets each connection or request</td><td>Per connection / per request</td><td>Seconds</td><td>GCP global external ALB, Azure Front Door, AWS Global Accelerator, Cloudflare LB</td></tr>
<tr><td>CDN</td><td>Serve from cache, or fetch from which origin</td><td>Per object / request</td><td>Per request (origin failover)</td><td>CloudFront, Cloud CDN, Front Door, Akamai, Fastly, Cloudflare</td></tr>
<tr><td>Regional L7 LB / ingress</td><td>Which zone, cluster and service</td><td>Per request</td><td>Seconds (target health)</td><td>ALB, Application Gateway, regional GCP LB, NGINX/Envoy ingress, Gateway API</td></tr>
<tr><td>Service mesh</td><td>Which Pod/endpoint, retries, locality failover between zones</td><td>Per RPC</td><td>Sub-second (outlier detection)</td><td>Istio, Linkerd, Cilium</td></tr></table>
<p>The key mental model: <strong>the higher the layer, the coarser and slower the decision</strong>. DNS steers a whole ISP resolver for minutes; the mesh steers one RPC in milliseconds. Good designs make the coarse layers stable (rarely change) and let the fast layers absorb failures. Each layer must fail <em>independently</em>: if your DNS provider and your anycast edge are the same vendor, a vendor outage takes both.</p>
<blockquote>💡 Why DNS failover is slower than the TTL says: recursive resolvers cache for the TTL (some enforce a minimum like 30-300 s), browsers and OSes cache again, JVMs historically cached forever (<code>networkaddress.cache.ttl</code>), and long-lived connections never re-resolve at all. Plan for "most clients in 2-5 minutes, a tail for much longer" with a 60 s TTL.</blockquote>`,
        he: `<table><tr><th>שכבה</th><th>מחליטה</th><th>רזולוציה</th><th>מהירות failover</th><th>דוגמאות</th></tr>
<tr><td>DNS / GeoDNS</td><td>לאיזה IP ‏(region או edge) ה-client יגיע</td><td>לכל resolver (לא לכל משתמש, אלא אם יש ECS)</td><td>TTL ועוד caching של resolvers: בפועל 1-10 דקות ויותר</td><td>Route 53, Azure Traffic Manager, Azure DNS, Cloud DNS, NS1, Cloudflare DNS</td></tr>
<tr><td>Edge של anycast / LB גלובלי</td><td>איזה region בריא מקבל כל חיבור או בקשה</td><td>לכל חיבור / בקשה</td><td>שניות</td><td>GCP global external ALB, Azure Front Door, AWS Global Accelerator, Cloudflare LB</td></tr>
<tr><td>CDN</td><td>להגיש מה-cache, או מאיזה origin להביא</td><td>לכל אובייקט / בקשה</td><td>לכל בקשה (origin failover)</td><td>CloudFront, Cloud CDN, Front Door, Akamai, Fastly, Cloudflare</td></tr>
<tr><td>L7 LB אזורי / ingress</td><td>איזה zone, ‏cluster ושירות</td><td>לכל בקשה</td><td>שניות (בריאות ה-targets)</td><td>ALB, Application Gateway, LB אזורי של GCP, ‏ingress של NGINX/Envoy, ‏Gateway API</td></tr>
<tr><td>Service mesh</td><td>איזה Pod או endpoint, ‏retries, ‏locality failover בין zones</td><td>לכל RPC</td><td>פחות משנייה (outlier detection)</td><td>Istio, Linkerd, Cilium</td></tr></table>
<p>המודל המנטלי החשוב: <strong>ככל שהשכבה גבוהה יותר, ההחלטה גסה ואיטית יותר</strong>. DNS מנתב resolver שלם של ספק אינטרנט לדקות; ה-mesh מנתב RPC בודד במילישניות. בעיצוב טוב השכבות הגסות יציבות (משתנות לעיתים רחוקות), והשכבות המהירות בולעות את הכשלים. כל שכבה צריכה ליפול <em>בנפרד</em>: אם ספק ה-DNS וה-edge של ה-anycast הם אותו vendor, תקלה אצלו מפילה את שניהם.</p>
<blockquote>💡 למה failover ב-DNS איטי יותר ממה שה-TTL אומר: resolvers רקורסיביים שומרים ב-cache לפי ה-TTL (חלקם אוכפים מינימום, נגיד 30-300 שניות), דפדפנים ומערכות הפעלה שומרים שוב, JVMs היסטורית שמרו לתמיד (<code>networkaddress.cache.ttl</code>), וחיבורים ארוכים לא עושים resolve מחדש בכלל. עם TTL של 60 שניות, תתכנן ל-"רוב ה-clients תוך 2-5 דקות, וזנב שלוקח הרבה יותר".</blockquote>`
      }
    },
    {
      h: { en: "The options compared", he: "השוואת האפשרויות" },
      body: {
        en: `<table><tr><th>Service</th><th>Mechanism</th><th>Failover</th><th>L7 / WAF</th><th>Non-HTTP</th><th>Pick it when…</th></tr>
<tr><td>Route 53 routing policies</td><td>Authoritative DNS + health checks</td><td>Health check (10 or 30 s interval × threshold) + TTL + caching ≈ minutes</td><td>None</td><td>Yes, any protocol</td><td>Cheap, simple multi-region steering; non-HTTP; you accept minutes of RTO</td></tr>
<tr><td>Azure Traffic Manager</td><td>DNS (priority, weighted, performance, geographic, multivalue, subnet)</td><td>Probes (10 or 30 s) + DNS TTL ≈ minutes</td><td>None</td><td>Yes</td><td>Azure, non-HTTP endpoints, or as a cheap outer layer over Front Door / App Gateway</td></tr>
<tr><td>Azure Front Door (Std/Premium)</td><td>Anycast L7 edge, split TCP/TLS, CDN built in</td><td>Seconds (health probes per origin group, latency-based)</td><td>Full L7, rules engine, WAF (Premium: managed rules, bot), Private Link origins</td><td>HTTP(S) and WebSockets only</td><td>Public HTTP apps on Azure that need global failover + WAF + caching in one</td></tr>
<tr><td>GCP global external Application LB</td><td>One anycast IP on Google's edge (GFE), backends in many regions</td><td>Seconds; spills over by capacity (RATE/UTILIZATION) not only on failure</td><td>URL maps, Cloud Armor, Cloud CDN, IAP</td><td>HTTP(S)/gRPC/WebSockets; TCP via global proxy Network LB</td><td>Single global IP with true capacity-aware cross-region spillover</td></tr>
<tr><td>AWS Global Accelerator</td><td>2 static anycast IPs, L4 proxy over AWS backbone</td><td>Seconds (~30 s or less), traffic dials per region</td><td>None (L4)</td><td>TCP and UDP</td><td>Gaming, VoIP, MQTT, custom TCP; static IPs for allow-lists; fast failover without DNS</td></tr>
<tr><td>CloudFront</td><td>CDN with ~600 PoPs, origin groups</td><td>Per-request origin failover on 5xx/timeout (GET/HEAD)</td><td>Behaviors, Functions/Lambda@Edge, AWS WAF, Shield</td><td>HTTP(S), WebSockets</td><td>Static and cacheable content; front door for an API on AWS</td></tr>
<tr><td>Cloudflare / NS1 / Akamai</td><td>Anycast DNS + edge proxy (Cloudflare LB, Spectrum for TCP/UDP); NS1 DNS with filter chains and RUM steering</td><td>Seconds (proxied) or TTL (DNS-only)</td><td>Strong WAF, bot, DDoS</td><td>Cloudflare Spectrum: yes</td><td>Multi-cloud or hybrid: steering independent of any single cloud</td></tr></table>
<p><strong>Decision criteria, in the order to ask them:</strong></p>
<ol><li><strong>Protocol</strong>: plain HTTP(S)? Long-lived WebSockets? Raw TCP/UDP (XMPP, MQTT, game, VoIP)? Non-HTTP rules out most L7 edges, leaving DNS, Global Accelerator, GCP proxy NLB or Cloudflare Spectrum.</li>
<li><strong>Failover RTO</strong>: minutes OK → DNS. Seconds needed → anycast.</li>
<li><strong>L7 features at the edge</strong>: WAF, caching, header routing, TLS termination near the user (saves 1-2 RTTs, often 50-150 ms for intercontinental users).</li>
<li><strong>Cost</strong>: DNS is cents per million queries plus ~$0.50-0.75/health check/month; anycast edges charge per hour/rule plus per-GB (Global Accelerator adds a data-transfer premium on top of egress; Front Door Premium starts at a few hundred $/month base).</li>
<li><strong>Multi-cloud / vendor independence</strong>: a cloud-native global LB only steers to its own cloud (Front Door and Cloudflare can front any origin).</li></ol>`,
        he: `<table><tr><th>שירות</th><th>מנגנון</th><th>Failover</th><th>L7 / WAF</th><th>לא HTTP</th><th>בוחרים כש…</th></tr>
<tr><td>Route 53 routing policies</td><td>DNS אוטוריטטיבי + health checks</td><td>Health check (מרווח 10 או 30 שניות × סף) + TTL + caching ≈ דקות</td><td>אין</td><td>כן, כל פרוטוקול</td><td>ניתוב multi-region זול ופשוט; פרוטוקולים שאינם HTTP; מקבלים RTO של דקות</td></tr>
<tr><td>Azure Traffic Manager</td><td>DNS (priority, weighted, performance, geographic, multivalue, subnet)</td><td>Probes (10 או 30 שניות) + TTL ≈ דקות</td><td>אין</td><td>כן</td><td>Azure, ‏endpoints שאינם HTTP, או כשכבה חיצונית זולה מעל Front Door / App Gateway</td></tr>
<tr><td>Azure Front Door (Std/Premium)</td><td>Edge של anycast ב-L7, ‏split TCP/TLS, ‏CDN מובנה</td><td>שניות (health probes לכל origin group, לפי latency)</td><td>L7 מלא, rules engine, ‏WAF (ב-Premium: managed rules ו-bot), ‏origins דרך Private Link</td><td>רק HTTP(S) ו-WebSockets</td><td>אפליקציות HTTP ציבוריות על Azure שצריכות failover גלובלי + WAF + caching במקום אחד</td></tr>
<tr><td>GCP global external Application LB</td><td>IP אחד של anycast על ה-edge של Google ‏(GFE), ‏backends בהרבה regions</td><td>שניות; עושה spillover לפי קיבולת (RATE/UTILIZATION), לא רק בכשל</td><td>URL maps, Cloud Armor, Cloud CDN, IAP</td><td>HTTP(S), gRPC, WebSockets; ‏TCP דרך global proxy Network LB</td><td>IP גלובלי יחיד עם spillover אמיתי בין regions לפי קיבולת</td></tr>
<tr><td>AWS Global Accelerator</td><td>שני IPs סטטיים של anycast, ‏proxy ב-L4 על ה-backbone של AWS</td><td>שניות (בערך 30 שניות או פחות), ‏traffic dial לכל region</td><td>אין (L4)</td><td>TCP ו-UDP</td><td>גיימינג, VoIP, ‏MQTT, ‏TCP מותאם; IPs סטטיים ל-allow-lists; ‏failover מהיר בלי DNS</td></tr>
<tr><td>CloudFront</td><td>CDN עם בערך 600 PoPs, ‏origin groups</td><td>Origin failover לכל בקשה על 5xx או timeout (GET/HEAD)</td><td>Behaviors, Functions/Lambda@Edge, AWS WAF, Shield</td><td>HTTP(S), WebSockets</td><td>תוכן סטטי שאפשר לעשות לו cache; שער כניסה ל-API על AWS</td></tr>
<tr><td>Cloudflare / NS1 / Akamai</td><td>DNS של anycast + edge proxy ‏(Cloudflare LB, ו-Spectrum ל-TCP/UDP); ‏NS1 עם filter chains וניתוב לפי RUM</td><td>שניות (כשעובר דרך ה-proxy) או TTL ‏(DNS בלבד)</td><td>WAF, ‏bot ו-DDoS חזקים</td><td>Cloudflare Spectrum: כן</td><td>Multi-cloud או hybrid: ניתוב שלא תלוי בענן אחד</td></tr></table>
<p><strong>קריטריוני ההחלטה, בסדר שבו שואלים אותם:</strong></p>
<ol><li><strong>פרוטוקול</strong>: HTTP(S) רגיל? ‏WebSockets ארוכים? ‏TCP/UDP גולמי (XMPP, ‏MQTT, משחקים, VoIP)? פרוטוקול שאינו HTTP פוסל את רוב ה-edges של L7, ונשארים DNS, ‏Global Accelerator, ‏proxy NLB של GCP או Cloudflare Spectrum.</li>
<li><strong>RTO של failover</strong>: דקות זה בסדר ← DNS. צריך שניות ← anycast.</li>
<li><strong>פיצ'רים של L7 ב-edge</strong>: WAF, ‏caching, ניתוב לפי headers, סיום TLS קרוב למשתמש (חוסך 1-2 RTTs, לרוב 50-150ms למשתמשים מיבשת אחרת).</li>
<li><strong>עלות</strong>: DNS עולה סנטים למיליון שאילתות ועוד בערך 0.50-0.75 דולר ל-health check בחודש; ‏edges של anycast גובים לפי שעה או חוק ועוד לפי GB ‏(Global Accelerator מוסיף פרמיה על data transfer מעבר ל-egress; ‏Front Door Premium מתחיל מכמה מאות דולרים בחודש בסיס).</li>
<li><strong>Multi-cloud ועצמאות מ-vendor</strong>: LB גלובלי של ענן מנתב רק לענן שלו (Front Door ו-Cloudflare יכולים לעמוד מול כל origin).</li></ol>`
      }
    },
    {
      h: { en: "Routing policies: which one, when", he: "Routing policies: איזו, מתי" },
      body: {
        en: `<table><tr><th>Policy</th><th>Behaviour</th><th>Use when</th><th>Watch out</th></tr>
<tr><td>Latency / performance</td><td>Answer with the region with lowest measured latency from the resolver</td><td>Active-active, users everywhere, no data-residency constraint</td><td>Measured from the resolver, not the user (public resolvers without ECS can mis-steer)</td></tr>
<tr><td>Geolocation / geographic</td><td>By user's country/continent</td><td>Data residency (EU users must hit EU), legal, language</td><td>Needs a default record or unmapped locations get no answer</td></tr>
<tr><td>Geoproximity (with bias)</td><td>By distance, with a bias knob to grow/shrink a region's area</td><td>Shifting load between regions gradually</td><td>Route 53 traffic-flow feature; bias is coarse</td></tr>
<tr><td>Weighted</td><td>Split by weights (e.g. 90/10)</td><td>Canary of a new region, blue/green cutover, draining a region to 0</td><td>Clients cache, so the real split lags the weights</td></tr>
<tr><td>Failover (priority)</td><td>Primary while healthy, else secondary</td><td>Active-passive / warm standby DR</td><td>The secondary must be scaled and tested; untested passive = no DR</td></tr>
<tr><td>Multivalue</td><td>Up to 8 healthy IPs, client picks</td><td>Simple client-side spread without an LB</td><td>Not a load balancer; clients often pick the first</td></tr></table>
<p>Policies compose: a common Route 53 shape is <strong>geolocation at the top</strong> (EU vs rest of world, for residency) → <strong>latency</strong> between regions within each → <strong>failover</strong> to a designated backup, all as alias records pointing at regional LBs with "evaluate target health". The equivalent on GCP or Front Door is a single anycast endpoint whose backends are the regions, with routing by latency + health + capacity.</p>
<pre>{
  "Comment": "Primary/secondary failover for api.example.com",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com", "Type": "A",
      "SetIdentifier": "eu-west-1-primary", "Failover": "PRIMARY",
      "HealthCheckId": "abcd-1234-health",
      "AliasTarget": { "HostedZoneId": "Z32O12XQLNTSW2",
        "DNSName": "api-euw1-123.eu-west-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true }
    }
  }]
}
# aws route53 change-resource-record-sets --hosted-zone-id Z0123 --change-batch file://primary.json
# (repeat with "Failover": "SECONDARY" pointing at the us-east-1 ALB)</pre>
<pre>resource "aws_route53_health_check" "euw1" {
  fqdn              = "api-euw1.example.com"
  type              = "HTTPS"
  resource_path     = "/healthz/deep"
  request_interval  = 10      # fast checks
  failure_threshold = 3       # ~30 s to unhealthy
  regions           = ["eu-west-1", "us-east-1", "ap-southeast-1"]
}
resource "aws_route53_record" "api_primary" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "api.example.com"
  type            = "A"
  set_identifier  = "euw1"
  health_check_id = aws_route53_health_check.euw1.id
  failover_routing_policy { type = "PRIMARY" }
  alias {
    name                   = aws_lb.euw1.dns_name
    zone_id                = aws_lb.euw1.zone_id
    evaluate_target_health = true
  }
}</pre>`,
        he: `<table><tr><th>Policy</th><th>התנהגות</th><th>משתמשים כש…</th><th>לשים לב</th></tr>
<tr><td>Latency / performance</td><td>עונה עם ה-region שה-latency הנמדד אליו מה-resolver הכי נמוך</td><td>Active-active, משתמשים בכל העולם, בלי מגבלת data residency</td><td>נמדד מה-resolver, לא מהמשתמש (resolvers ציבוריים בלי ECS יכולים לנתב לא נכון)</td></tr>
<tr><td>Geolocation / geographic</td><td>לפי המדינה או היבשת של המשתמש</td><td>Data residency (משתמשי EU חייבים להגיע ל-EU), דרישות חוקיות, שפה</td><td>צריך רשומת default, אחרת מיקומים שלא מופו לא מקבלים תשובה</td></tr>
<tr><td>Geoproximity (עם bias)</td><td>לפי מרחק, עם כפתור bias שמגדיל או מקטין את השטח של region</td><td>להעביר עומס בין regions בהדרגה</td><td>פיצ'ר של traffic flow ב-Route 53; ה-bias גס</td></tr>
<tr><td>Weighted</td><td>חלוקה לפי משקלים (נגיד 90/10)</td><td>Canary ל-region חדש, מעבר blue/green, ריקון region עד 0</td><td>Clients עושים cache, אז החלוקה האמיתית מפגרת אחרי המשקלים</td></tr>
<tr><td>Failover (priority)</td><td>Primary כל עוד הוא בריא, אחרת secondary</td><td>DR של active-passive / warm standby</td><td>ה-secondary חייב להיות בגודל הנכון ונבדק; passive שלא נבדק = אין DR</td></tr>
<tr><td>Multivalue</td><td>עד 8 IPs בריאים, ה-client בוחר</td><td>פיזור פשוט בצד ה-client בלי LB</td><td>זה לא load balancer; clients הרבה פעמים בוחרים את הראשון</td></tr></table>
<p>Policies מתחברות זו לזו: צורה נפוצה ב-Route 53 היא <strong>geolocation למעלה</strong> (EU מול שאר העולם, בשביל residency) ← <strong>latency</strong> בין ה-regions בתוך כל קבוצה ← <strong>failover</strong> לגיבוי מוגדר, הכול כ-alias records שמצביעים על LBs אזוריים עם "evaluate target health". המקבילה ב-GCP או ב-Front Door היא endpoint אחד של anycast שה-backends שלו הם ה-regions, עם ניתוב לפי latency, בריאות וקיבולת.</p>
<pre>{
  "Comment": "Primary/secondary failover for api.example.com",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com", "Type": "A",
      "SetIdentifier": "eu-west-1-primary", "Failover": "PRIMARY",
      "HealthCheckId": "abcd-1234-health",
      "AliasTarget": { "HostedZoneId": "Z32O12XQLNTSW2",
        "DNSName": "api-euw1-123.eu-west-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true }
    }
  }]
}
# aws route53 change-resource-record-sets --hosted-zone-id Z0123 --change-batch file://primary.json
# (repeat with "Failover": "SECONDARY" pointing at the us-east-1 ALB)</pre>
<pre>resource "aws_route53_health_check" "euw1" {
  fqdn              = "api-euw1.example.com"
  type              = "HTTPS"
  resource_path     = "/healthz/deep"
  request_interval  = 10      # fast checks
  failure_threshold = 3       # ~30 s to unhealthy
  regions           = ["eu-west-1", "us-east-1", "ap-southeast-1"]
}
resource "aws_route53_record" "api_primary" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "api.example.com"
  type            = "A"
  set_identifier  = "euw1"
  health_check_id = aws_route53_health_check.euw1.id
  failover_routing_policy { type = "PRIMARY" }
  alias {
    name                   = aws_lb.euw1.dns_name
    zone_id                = aws_lb.euw1.zone_id
    evaluate_target_health = true
  }
}</pre>`
      }
    },
    {
      h: { en: "Health checks that detect real failure (and don't cause one)", he: "Health checks שמזהים כשל אמיתי (ולא גורמים לכשל)" },
      body: {
        en: `<p>Global failover is only as good as the signal that triggers it. Two failure modes:</p>
<ul><li><strong>Too shallow</strong>: <code>/healthz</code> returns 200 from the web process while the region's database is read-only. Traffic keeps flowing into a black hole. The global check must reflect "can this region serve a real user request".</li>
<li><strong>Too deep</strong>: every Pod's health check calls the DB and three dependencies. One slow dependency makes <em>every</em> region look unhealthy at once, and the global LB has nowhere to send traffic (a health-check cascade).</li></ul>
<table><tr><th>Check</th><th>Checks</th><th>Used by</th></tr>
<tr><td>Liveness (shallow)</td><td>Process is alive, no dependencies</td><td>Kubernetes restart decisions</td></tr>
<tr><td>Readiness (local)</td><td>This instance can serve: warmed up, own connection pool OK</td><td>Regional LB / Service endpoints</td></tr>
<tr><td>Region health (deep, aggregated)</td><td>A synthetic real request: login + read + write through the critical path, or "error rate &lt; X% and p99 &lt; Y over 1 min"</td><td>Global DNS / anycast failover</td></tr></table>
<p>Rules that keep it safe:</p>
<ul><li>Evaluate region health from <strong>multiple vantage points</strong> (Route 53 marks healthy if more than ~18% of its checkers agree; GCP and Front Door probe from many edge locations).</li>
<li><strong>Fail open</strong>: if <em>all</em> regions look unhealthy, keep routing to all (Route 53, GCP and Front Door do this). An outage of the checker must not become an outage of the product.</li>
<li><strong>Hysteresis</strong>: e.g. 3 failures to go unhealthy, more successes to come back, to avoid flapping.</li>
<li>Keep a <strong>manual override</strong>: a weight or a "force unhealthy" switch (Route 53 ARC routing controls, inverted health checks, Front Door origin disable) so a human can evacuate a region in one command when metrics are ambiguous.</li></ul>
<pre># Azure Front Door: origin group with a real probe and latency-based routing
az afd origin-group create -g rg-edge --profile-name fd-prod \\
  --origin-group-name api --probe-request-type GET --probe-protocol Https \\
  --probe-path /healthz/region --probe-interval-in-seconds 30 \\
  --sample-size 4 --successful-samples-required 3 \\
  --additional-latency-in-milliseconds 50

# GCP: global backend service across two regions, capacity-aware
gcloud compute backend-services create api-global --global \\
  --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTPS \\
  --health-checks=api-hc --enable-logging
gcloud compute backend-services add-backend api-global --global \\
  --network-endpoint-group=api-neg --network-endpoint-group-region=europe-west1 \\
  --balancing-mode=RATE --max-rate-per-endpoint=200</pre>
<p><strong>The failover drill</strong> (quarterly for tier-0): announce, evacuate one region via the manual switch, watch error rate and p99 in the surviving region, measure time until 95% of traffic moved (DNS shows the tail), verify long-lived connections reconnected, then fail back gradually (10% → 50% → 100%). The measured number is your real RTO.</p>`,
        he: `<p>Failover גלובלי טוב בדיוק כמו הסיגנל שמפעיל אותו. שני אופני כשל:</p>
<ul><li><strong>רדוד מדי</strong>: <code>/healthz</code> מחזיר 200 מתהליך ה-web בזמן שה-DB של ה-region ב-read-only. הטראפיק ממשיך לזרום לחור שחור. הבדיקה הגלובלית צריכה לשקף "האם ה-region הזה מסוגל להגיש בקשה אמיתית של משתמש".</li>
<li><strong>עמוק מדי</strong>: ה-health check של כל Pod קורא ל-DB ולשלוש תלויות. תלות איטית אחת גורמת ל-<em>כל</em> ה-regions להיראות לא בריאים בבת אחת, ול-LB הגלובלי אין לאן לשלוח טראפיק (health-check cascade).</li></ul>
<table><tr><th>בדיקה</th><th>מה בודקת</th><th>מי משתמש בה</th></tr>
<tr><td>Liveness (רדודה)</td><td>התהליך חי, בלי תלויות</td><td>ההחלטות של Kubernetes על restart</td></tr>
<tr><td>Readiness (מקומית)</td><td>ה-instance הזה יכול להגיש: עשה warm-up, ה-connection pool שלו תקין</td><td>LB אזורי / endpoints של Service</td></tr>
<tr><td>בריאות region (עמוקה, מצטברת)</td><td>בקשה סינתטית אמיתית: login, קריאה וכתיבה דרך המסלול הקריטי, או "error rate מתחת ל-X% ו-p99 מתחת ל-Y לאורך דקה"</td><td>Failover גלובלי ב-DNS או ב-anycast</td></tr></table>
<p>חוקים ששומרים על זה בטוח:</p>
<ul><li>מעריכים בריאות region <strong>מכמה נקודות מבט</strong> (Route 53 מסמן בריא אם יותר מבערך 18% מה-checkers מסכימים; GCP ו-Front Door בודקים מהרבה מיקומי edge).</li>
<li><strong>Fail open</strong>: אם <em>כל</em> ה-regions נראים לא בריאים, ממשיכים לנתב לכולם (Route 53, ‏GCP ו-Front Door עושים את זה). תקלה ב-checker לא יכולה להפוך לתקלה במוצר.</li>
<li><strong>Hysteresis</strong>: למשל 3 כשלונות כדי להפוך ל-unhealthy, ויותר הצלחות כדי לחזור, כדי למנוע flapping.</li>
<li>תשאיר <strong>override ידני</strong>: משקל או מתג "force unhealthy" ‏(routing controls של Route 53 ARC, ‏inverted health checks, ‏disable ל-origin ב-Front Door), כך שבן אדם יכול לפנות region בפקודה אחת כשהמטריקות לא חד-משמעיות.</li></ul>
<pre># Azure Front Door: origin group with a real probe and latency-based routing
az afd origin-group create -g rg-edge --profile-name fd-prod \\
  --origin-group-name api --probe-request-type GET --probe-protocol Https \\
  --probe-path /healthz/region --probe-interval-in-seconds 30 \\
  --sample-size 4 --successful-samples-required 3 \\
  --additional-latency-in-milliseconds 50

# GCP: global backend service across two regions, capacity-aware
gcloud compute backend-services create api-global --global \\
  --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTPS \\
  --health-checks=api-hc --enable-logging
gcloud compute backend-services add-backend api-global --global \\
  --network-endpoint-group=api-neg --network-endpoint-group-region=europe-west1 \\
  --balancing-mode=RATE --max-rate-per-endpoint=200</pre>
<p><strong>תרגיל ה-failover</strong> (כל רבעון ל-tier 0): מודיעים, מפנים region אחד דרך המתג הידני, מסתכלים על error rate ו-p99 ב-region ששורד, מודדים כמה זמן עד ש-95% מהטראפיק עבר (ה-DNS מראה את הזנב), מוודאים שחיבורים ארוכים התחברו מחדש, ואז חוזרים בהדרגה (10% ← 50% ← 100%). המספר שנמדד הוא ה-RTO האמיתי שלך.</p>`
      }
    },
    {
      h: { en: "Active-active vs active-passive, stickiness and long-lived connections", he: "Active-active מול active-passive, ‏stickiness וחיבורים ארוכים" },
      body: {
        en: `<table><tr><th></th><th>Active-active</th><th>Active-passive</th></tr>
<tr><td>Traffic shape</td><td>Every region serves its nearby users all the time</td><td>One region serves; the other is warm and idle (or serves read-only)</td></tr>
<tr><td>Capacity rule</td><td>Each region must absorb the failed region's load: with 2 regions run each at ≤ 50% of capacity, with 3 at ≤ 66%</td><td>Passive must scale to 100% quickly (quotas, warm pools)</td></tr>
<tr><td>Data</td><td>Hard: multi-region writes, home-region per user, or conflict handling</td><td>Easier: async replication, promote on failover (RPO = lag)</td></tr>
<tr><td>Confidence</td><td>High: both paths exercised daily</td><td>Low unless drilled: passive rots silently</td></tr>
<tr><td>Cost</td><td>~2x+ and cross-region replication egress</td><td>~1.2-1.6x depending on how warm</td></tr></table>
<p><strong>Stickiness</strong>: avoid needing it. Put session state in a token or a shared store so any region can serve any request. Where data has a home region (user's messages live in EU), route by user (a cookie or token claim read at the edge, or a "home region" lookup) rather than by latency, otherwise every request becomes a cross-region hop.</p>
<p><strong>Long-lived connections</strong> (WebSockets, MQTT, XMPP, gRPC streams) break the "failover in seconds" story: existing connections stay pinned to the old region until they drop. Plan for it:</p>
<ul><li><strong>Drain, don't cut</strong>: on evacuation, stop new connections first (weight → 0), then close existing ones gradually over minutes (ALB deregistration delay, Envoy drain, HTTP/2 GOAWAY, an app-level "reconnect" message).</li>
<li><strong>Jittered reconnect</strong> in clients (exponential backoff + random jitter). 10 M clients reconnecting in the same second is a self-inflicted DDoS on the surviving region (thundering herd).</li>
<li><strong>Resumable sessions</strong>: a reconnect presents a token and the last-seen message id, so no state is lost.</li>
<li><strong>Connection counts are capacity</strong>: a gateway may hold 500k-1M+ idle connections but the TLS handshakes during a reconnect storm are CPU-bound. Size for the storm, not the steady state.</li></ul>`,
        he: `<table><tr><th></th><th>Active-active</th><th>Active-passive</th></tr>
<tr><td>צורת הטראפיק</td><td>כל region מגיש למשתמשים הקרובים אליו כל הזמן</td><td>Region אחד מגיש; השני חם ומחכה (או מגיש רק קריאות)</td></tr>
<tr><td>כלל הקיבולת</td><td>כל region חייב לבלוע את העומס של region שנפל: עם 2 regions כל אחד רץ עד 50% מהקיבולת, עם 3 עד 66%</td><td>ה-passive חייב לעלות ל-100% מהר (quotas, ‏warm pools)</td></tr>
<tr><td>דאטה</td><td>קשה: כתיבות multi-region, ‏home region לכל משתמש, או טיפול בקונפליקטים</td><td>קל יותר: replication אסינכרוני, ‏promote ב-failover (RPO = ה-lag)</td></tr>
<tr><td>ביטחון</td><td>גבוה: שני המסלולים עובדים כל יום</td><td>נמוך אם לא מתרגלים: ה-passive נרקב בשקט</td></tr>
<tr><td>עלות</td><td>בערך פי 2 ומעלה, ועוד egress של replication בין regions</td><td>בערך פי 1.2-1.6, תלוי כמה הוא חם</td></tr></table>
<p><strong>Stickiness</strong>: עדיף לא להזדקק לה. שמים את ה-session state ב-token או ב-store משותף, כך שכל region יכול להגיש כל בקשה. כשלדאטה יש home region (ההודעות של המשתמש יושבות ב-EU), מנתבים לפי משתמש (cookie או claim ב-token שנקרא ב-edge, או lookup של "home region") ולא לפי latency, אחרת כל בקשה הופכת לקפיצה בין regions.</p>
<p><strong>חיבורים ארוכים</strong> (WebSockets, ‏MQTT, ‏XMPP, ‏gRPC streams) שוברים את הסיפור של "failover בשניות": חיבורים קיימים נשארים צמודים ל-region הישן עד שהם נופלים. מתכננים לזה:</p>
<ul><li><strong>מרוקנים, לא חותכים</strong>: בפינוי, קודם עוצרים חיבורים חדשים (weight ← 0), ואז סוגרים את הקיימים בהדרגה לאורך דקות (deregistration delay ב-ALB, ‏drain ב-Envoy, ‏GOAWAY של HTTP/2, הודעת "reconnect" ברמת האפליקציה).</li>
<li><strong>Reconnect עם jitter</strong> בצד ה-clients (exponential backoff ועוד jitter אקראי). 10 מיליון clients שמתחברים מחדש באותה שנייה זה DDoS שעשית לעצמך על ה-region ששורד (thundering herd).</li>
<li><strong>Sessions שאפשר לחדש</strong>: ב-reconnect ה-client מציג token ואת ה-id של ההודעה האחרונה שראה, כך ששום state לא הולך לאיבוד.</li>
<li><strong>מספר החיבורים הוא קיבולת</strong>: gateway יכול להחזיק 500k עד מיליון ויותר חיבורים שקטים, אבל ה-TLS handshakes בזמן סערת reconnect חוסמים על CPU. תתכנן את הגודל לסערה, לא למצב היציב.</li></ul>`
      }
    },
    {
      h: { en: "Worked decisions: WhatsApp-like, Netflix-like, Drive-like", he: "החלטות לדוגמה: בסגנון WhatsApp, ‏Netflix ו-Drive" },
      body: {
        en: `<table><tr><th>Product</th><th>Dominant traffic</th><th>Decision</th><th>Why / what would change it</th></tr>
<tr><td>WhatsApp-like</td><td>Hundreds of millions of persistent, mostly idle TCP/TLS connections (XMPP-derived or MQTT-like), small messages, plus media</td><td>Anycast or GeoDNS to <strong>regional edge gateways</strong> that terminate TCP/TLS close to users (L4: Global Accelerator, GCP proxy NLB, or own edge PoPs with BGP anycast); a "user → gateway" registry (Redis) routes messages between gateways; media via CDN + object storage</td><td>L7 HTTP edges don't fit raw long-lived TCP. If the client protocol were WebSockets over 443, Front Door/Cloudflare become options. Failover = clients reconnect with jitter to the next-nearest edge</td></tr>
<tr><td>Netflix-like</td><td>Video bytes: the CDN carries 95%+ of all bytes; control plane (browse, play authorisation, DRM licence) is small but critical</td><td>Video: own CDN appliances inside ISPs (Open Connect), steered per play request by the control plane, which picks the best appliance for that client. Control plane: multiple cloud regions active-active, DNS-steered, with region evacuation as a routine operation</td><td>At that byte volume a commercial CDN bill justifies building your own; a smaller service uses CloudFront/Akamai/Fastly. The control plane is where global failover matters</td></tr>
<tr><td>Drive-like</td><td>API calls (list, metadata, share) + large uploads/downloads</td><td>API through a <strong>global L7 LB</strong> (anycast, WAF, TLS at the edge) to the user's home region; uploads go <strong>directly to regional object storage</strong> with resumable, chunked signed URLs (S3 multipart, GCS resumable); downloads via signed URLs behind a CDN</td><td>Keeping GBs of upload off the API tier saves cost and compute. Data residency (EU tenants) turns latency routing into geo or home-region routing</td></tr></table>
<blockquote>⚠️ Production tip: write down, per traffic class, <em>what steers it, what detects failure, how long failover takes and who can trigger it manually</em>. If you can't fill those four cells, you don't have global failover yet, you have multiple regions.</blockquote>`,
        he: `<table><tr><th>מוצר</th><th>הטראפיק הדומיננטי</th><th>החלטה</th><th>למה / מה ישנה את ההחלטה</th></tr>
<tr><td>בסגנון WhatsApp</td><td>מאות מיליוני חיבורי TCP/TLS קבועים ושקטים ברובם (נגזר מ-XMPP או דמוי MQTT), הודעות קטנות, ועוד מדיה</td><td>Anycast או GeoDNS ל-<strong>gateways אזוריים ב-edge</strong> שמסיימים TCP/TLS קרוב למשתמשים (L4: ‏Global Accelerator, ‏proxy NLB של GCP, או PoPs משלך עם BGP anycast); ‏registry של "משתמש ← gateway" ‏(Redis) מנתב הודעות בין gateways; מדיה דרך CDN ו-object storage</td><td>Edges של HTTP ב-L7 לא מתאימים ל-TCP גולמי וארוך. אם פרוטוקול ה-client היה WebSockets על 443, אז Front Door או Cloudflare נכנסים לתמונה. Failover = ה-clients מתחברים מחדש עם jitter ל-edge הקרוב הבא</td></tr>
<tr><td>בסגנון Netflix</td><td>בייטים של וידאו: ה-CDN נושא יותר מ-95% מכל הבייטים; ה-control plane (גלישה, אישור ניגון, רישיון DRM) קטן אבל קריטי</td><td>וידאו: שרתי CDN משלך בתוך ספקי האינטרנט (Open Connect), שה-control plane בוחר לכל בקשת ניגון את השרת הכי טוב ל-client הזה. Control plane: כמה regions בענן ב-active-active, עם ניתוב ב-DNS ופינוי region כפעולה שגרתית</td><td>בנפח בייטים כזה החשבון של CDN מסחרי מצדיק לבנות אחד משלך; שירות קטן יותר לוקח CloudFront, ‏Akamai או Fastly. ה-control plane הוא המקום שבו failover גלובלי חשוב</td></tr>
<tr><td>בסגנון Drive</td><td>קריאות API (רשימה, מטא-דאטה, שיתוף) ועוד uploads ו-downloads גדולים</td><td>ה-API עובר דרך <strong>LB גלובלי ב-L7</strong> ‏(anycast, ‏WAF, ‏TLS ב-edge) ל-home region של המשתמש; ה-uploads הולכים <strong>ישר ל-object storage האזורי</strong> עם signed URLs מחולקים ל-chunks שאפשר לחדש (S3 multipart, ‏GCS resumable); ה-downloads דרך signed URLs מאחורי CDN</td><td>להוריד ג'יגות של upload משכבת ה-API חוסך עלות ו-compute. Data residency (tenants ב-EU) הופך ניתוב לפי latency לניתוב לפי geo או home region</td></tr></table>
<blockquote>⚠️ טיפ לפרודקשן: תכתוב, לכל סוג טראפיק, <em>מה מנתב אותו, מה מזהה כשל, כמה זמן לוקח ה-failover ומי יכול להפעיל אותו ידנית</em>. אם אתה לא מצליח למלא את ארבעת התאים האלה, עדיין אין לך failover גלובלי, יש לך כמה regions.</blockquote>`
      }
    }
  ],
  diagram: `   user
    |  1. DNS: api.example.com -> ?   (GeoDNS / latency / failover; TTL 60s, cached)
    v
 [ anycast edge / global L7 LB / CDN ]   <- same IP everywhere, BGP picks nearest PoP
    |  TLS terminated near user; WAF; cache hit? -> answer, done
    |  health + capacity + latency -> pick region   (failover: seconds)
    +-----------------------+-----------------------+
    v                       v                       v
 [ region eu-west ]     [ region us-east ]     [ region ap-se ]
  regional LB/ingress    regional LB/ingress    regional LB/ingress
  mesh (zone failover)   mesh                   mesh
  /healthz/region  <---- deep synthetic check from many vantage points

 DNS-only path:  failover = health-check (~30s) + TTL (60s) + resolver/app caches (minutes)
 Anycast path:   failover = probe interval x threshold (seconds); long-lived conns must drain`,
  handsOn: [
    {
      cmd: "dig +short api.example.com @1.1.1.1 && dig +short api.example.com @8.8.8.8",
      what: { en: "Resolve the same name via two public resolvers. Different answers = GeoDNS/latency steering at work (resolver location matters, not yours).", he: "עושה resolve לאותו שם דרך שני resolvers ציבוריים. תשובות שונות = ניתוב GeoDNS או latency בפעולה (המיקום של ה-resolver קובע, לא שלך)." }
    },
    {
      cmd: "dig +noall +answer api.example.com; dig +noall +answer +norecurse api.example.com @ns-123.awsdns-15.com",
      what: { en: "The first shows the TTL counting down in your resolver's cache; the second asks the authoritative server directly for the configured TTL. That gap is your DNS failover tail.", he: "הראשונה מראה את ה-TTL יורד ב-cache של ה-resolver שלך; השנייה שואלת ישירות את השרת האוטוריטטיבי ומראה את ה-TTL המוגדר. הפער הזה הוא הזנב של ה-failover ב-DNS." }
    },
    {
      cmd: "curl -so /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} ip=%{remote_ip}\\n' https://api.example.com/healthz",
      what: { en: "Break a request into DNS, TCP, TLS and first-byte time and see which IP you hit. Compare a direct regional endpoint vs the anycast edge: edge TLS termination usually cuts tls/ttfb for far users.", he: "מפרק בקשה לזמני DNS, ‏TCP, ‏TLS ו-first byte ומראה לאיזה IP הגעת. תשווה endpoint אזורי ישיר מול ה-edge של ה-anycast: סיום TLS ב-edge בדרך כלל מקצר את tls ואת ttfb למשתמשים רחוקים." }
    },
    {
      cmd: "aws route53 get-health-check-status --health-check-id abcd-1234-health --query 'HealthCheckObservations[].[Region,StatusReport.Status]' --output table",
      what: { en: "See what each Route 53 checker region currently observes. Disagreement between regions often means a network path problem, not a dead backend.", he: "מציג מה כל region של checkers ב-Route 53 רואה עכשיו. חוסר הסכמה בין regions הרבה פעמים מעיד על בעיית מסלול רשת, לא על backend מת." }
    },
    {
      cmd: "gcloud compute backend-services get-health api-global --global   # Azure: az afd origin list -g rg-edge --profile-name fd-prod --origin-group-name api -o table",
      what: { en: "List the health state of every backend/origin behind the global LB. Run it during a failover drill to watch a region drop out and come back.", he: "מציג את מצב הבריאות של כל backend או origin מאחורי ה-LB הגלובלי. תריץ את זה בזמן תרגיל failover כדי לראות region יוצא וחוזר." }
    }
  ],
  mnemonic: {
    en: "\"DNS is a map, anycast is a steward.\" Maps are cheap and slow to reprint; stewards redirect in seconds. And: Protocol → RTO → L7 needs → Cost → Vendor independence (PRL-CV).",
    he: "\"DNS זו מפה, anycast זה סדרן.\" מפות זולות ולוקח זמן להדפיס אותן מחדש; סדרנים מפנים בשניות. והסדר: Protocol ← RTO ← צורכי L7 ← Cost ← עצמאות מ-Vendor ‏(PRL-CV)."
  },
  pitfalls: [
    { en: "Promising 'failover in 60 seconds' because the TTL is 60. Resolver minimums, OS/JVM caches and long-lived connections mean minutes, with a tail of clients that never re-resolve until restart.", he: "להבטיח 'failover תוך 60 שניות' כי ה-TTL הוא 60. מינימום של resolvers, ‏caches של מערכת הפעלה ו-JVM, וחיבורים ארוכים אומרים דקות, עם זנב של clients שלא עושים resolve מחדש עד restart." },
    { en: "Using one deep health check everywhere: a shared dependency hiccup marks every region unhealthy at once. Separate liveness, readiness and region health, and make the global layer fail open.", he: "להשתמש ב-health check עמוק אחד בכל מקום: גמגום בתלות משותפת מסמן את כל ה-regions כלא בריאים בבת אחת. תפריד בין liveness, ‏readiness ובריאות region, ותגרום לשכבה הגלובלית לעשות fail open." },
    { en: "Active-active with each region at 80% utilisation. When one fails, the survivor gets 160% and falls over too: run N regions at most at (N-1)/N of capacity.", he: "Active-active כשכל region ב-80% ניצולת. כשאחד נופל, השורד מקבל 160% ונופל גם הוא: N regions צריכים לרוץ לכל היותר ב-(N-1)/N מהקיבולת." },
    { en: "Evacuating a region with millions of WebSocket/MQTT clients by cutting connections at once. Without drain and jittered reconnect, the reconnect storm takes down the healthy region.", he: "לפנות region עם מיליוני clients של WebSocket או MQTT על ידי חיתוך כל החיבורים בבת אחת. בלי drain ו-reconnect עם jitter, סערת ה-reconnect מפילה את ה-region הבריא." }
  ],
  interview: [
    {
      q: { en: "We run in two AWS regions with Route 53 failover. Leadership asks for sub-minute regional failover. What do you change?", he: "אנחנו רצים בשני regions של AWS עם failover ב-Route 53. ההנהלה מבקשת failover אזורי של פחות מדקה. מה אתה משנה?" },
      a: { en: "DNS can't reliably give sub-minute because of resolver and client caching, so I'd move the steering to anycast: Global Accelerator if we have non-HTTP or need static IPs, or CloudFront in front of regional ALBs for HTTP. Health checks become a region-level synthetic check with hysteresis, plus a manual evacuation switch (traffic dial to 0, or ARC routing controls). Then capacity: both regions must carry 100% alone, so each runs at ≤ 50%. Data: decide RPO for the secondary's DB promotion; sub-minute traffic failover is pointless if DB promotion takes 10 minutes. Prove it with a drill and report the measured RTO.", he: "DNS לא יכול לתת בצורה אמינה פחות מדקה בגלל caching של resolvers ו-clients, אז הייתי מעביר את הניתוב ל-anycast: ‏Global Accelerator אם יש פרוטוקולים שאינם HTTP או שצריך IPs סטטיים, או CloudFront מול ALBs אזוריים ל-HTTP. ה-health checks הופכים לבדיקה סינתטית ברמת region עם hysteresis, ועוד מתג פינוי ידני (traffic dial ל-0, או routing controls של ARC). אחר כך קיבולת: כל region חייב לשאת 100% לבד, אז כל אחד רץ עד 50%. דאטה: להחליט על RPO ל-promotion של ה-DB ב-secondary; ‏failover טראפיק של פחות מדקה לא שווה כלום אם ה-promotion של ה-DB לוקח 10 דקות. מוכיחים בתרגיל ומדווחים את ה-RTO שנמדד." }
    },
    {
      q: { en: "How would you route traffic for a chat app with 50M concurrent persistent connections across 4 regions?", he: "איך היית מנתב טראפיק לאפליקציית צ'אט עם 50 מיליון חיבורים קבועים במקביל על פני 4 regions?" },
      a: { en: "It's L4 long-lived traffic, so not an HTTP edge: GeoDNS or anycast (Global Accelerator / own BGP anycast PoPs) to regional gateway fleets that terminate TLS. A Redis registry maps user to gateway so messages route between gateways. Each region sized so 3 can absorb the 4th (≤ 75% steady, and CPU headroom for TLS handshakes in a reconnect storm). Failover is client-driven: on disconnect, reconnect with exponential backoff and jitter to the next endpoint, resuming with a token and last message id. Evacuation is a drain: stop new connections, then close existing ones over 10-15 minutes.", he: "זה טראפיק L4 ארוך, אז לא edge של HTTP: ‏GeoDNS או anycast ‏(Global Accelerator או PoPs משלך עם BGP anycast) לציי gateways אזוריים שמסיימים TLS. ‏Registry ב-Redis ממפה משתמש ל-gateway כדי לנתב הודעות בין gateways. כל region בגודל כזה ש-3 יכולים לבלוע את הרביעי (עד 75% במצב יציב, ועוד מרווח CPU ל-TLS handshakes בסערת reconnect). ה-failover מונע מה-client: בניתוק, מתחבר מחדש עם exponential backoff ו-jitter ל-endpoint הבא, וממשיך עם token ו-id של ההודעה האחרונה. פינוי הוא drain: עוצרים חיבורים חדשים, ואז סוגרים את הקיימים לאורך 10-15 דקות." }
    }
  ],
  quiz: [
    {
      q: { en: "Route 53 failover record with TTL 60 s and a 10 s × 3 health check. Why do many users still hit the dead region 5 minutes later?", he: "רשומת failover ב-Route 53 עם TTL של 60 שניות ו-health check של 10 שניות × 3. למה הרבה משתמשים עדיין מגיעים ל-region המת אחרי 5 דקות?" },
      options: [
        { en: "Route 53 only updates records once every 5 minutes", he: "Route 53 מעדכן רשומות רק פעם ב-5 דקות" },
        { en: "Resolver minimum TTLs, OS/JVM DNS caches and existing long-lived connections that never re-resolve", he: "מינימום TTL של resolvers, ‏caches של DNS במערכת ההפעלה וב-JVM, וחיבורים ארוכים קיימים שלא עושים resolve מחדש" },
        { en: "Health checks only run from one AWS region", he: "Health checks רצים רק מ-region אחד של AWS" },
        { en: "Alias records ignore health checks", he: "Alias records מתעלמים מ-health checks" }
      ],
      answer: 1,
      explain: { en: "The authoritative answer flips in ~30-90 s, but caching outside your control and connections that never re-resolve create a long tail. That's why seconds-level failover needs anycast.", he: "התשובה האוטוריטטיבית מתהפכת תוך 30-90 שניות בערך, אבל caching שלא בשליטתך וחיבורים שלא עושים resolve מחדש יוצרים זנב ארוך. לכן failover ברמת שניות דורש anycast." }
    },
    {
      q: { en: "An IoT platform uses MQTT over TCP 8883 and needs static IPs for customer firewalls plus fast regional failover on AWS. Best fit?", he: "פלטפורמת IoT משתמשת ב-MQTT על TCP 8883 וצריכה IPs סטטיים בשביל ה-firewalls של הלקוחות, ועוד failover אזורי מהיר על AWS. מה מתאים?" },
      options: [
        { en: "CloudFront with origin failover", he: "CloudFront עם origin failover" },
        { en: "Azure Front Door", he: "Azure Front Door" },
        { en: "AWS Global Accelerator with endpoint groups per region", he: "AWS Global Accelerator עם endpoint groups לכל region" },
        { en: "Route 53 weighted records with TTL 300", he: "רשומות weighted ב-Route 53 עם TTL של 300" }
      ],
      answer: 2,
      explain: { en: "Global Accelerator is L4 (TCP/UDP), gives two static anycast IPs and fails over in seconds. CloudFront and Front Door are HTTP edges; DNS with TTL 300 is slow and has no static IPs.", he: "Global Accelerator עובד ב-L4 ‏(TCP/UDP), נותן שני IPs סטטיים של anycast ועושה failover בשניות. CloudFront ו-Front Door הם edges של HTTP; ‏DNS עם TTL של 300 איטי ואין בו IPs סטטיים." }
    },
    {
      q: { en: "Every region's global health check calls the shared auth service. Auth slows down. What happens, and what's the fix?", he: "ה-health check הגלובלי של כל region קורא לשירות ה-auth המשותף. ה-auth מאט. מה קורה, ומה התיקון?" },
      options: [
        { en: "Nothing, health checks are cached", he: "כלום, ה-health checks נשמרים ב-cache" },
        { en: "Only the closest region fails over; increase the TTL", he: "רק ה-region הקרוב עושה failover; להגדיל את ה-TTL" },
        { en: "All regions go unhealthy at once; separate local readiness from region health, avoid shared deps in checks, and fail open", he: "כל ה-regions הופכים ללא בריאים בבת אחת; להפריד readiness מקומי מבריאות region, להימנע מתלויות משותפות בבדיקות, ולעשות fail open" },
        { en: "The global LB automatically retries on the auth service", he: "ה-LB הגלובלי עושה retry אוטומטי מול שירות ה-auth" }
      ],
      answer: 2,
      explain: { en: "A shared dependency in every health check makes failures correlated: the cascade leaves the global layer with no healthy target. Checks must reflect the region's own ability to serve, and the global layer should keep routing if all look unhealthy.", he: "תלות משותפת בכל health check הופכת כשלים למתואמים: ה-cascade משאיר את השכבה הגלובלית בלי אף target בריא. הבדיקות צריכות לשקף את היכולת של ה-region עצמו להגיש, והשכבה הגלובלית צריכה להמשיך לנתב אם כולם נראים לא בריאים." }
    },
    {
      q: { en: "Three regions run active-active. What is the maximum safe steady-state utilisation per region to survive losing one?", he: "שלושה regions רצים ב-active-active. מה הניצולת המקסימלית הבטוחה לכל region במצב יציב כדי לשרוד נפילה של אחד?" },
      options: [
        { en: "About 33%", he: "בערך 33%" },
        { en: "About 66%", he: "בערך 66%" },
        { en: "About 90%", he: "בערך 90%" },
        { en: "100%, autoscaling will handle it", he: "100%, ה-autoscaling יטפל בזה" }
      ],
      answer: 1,
      explain: { en: "With N regions, each must stay at or below (N-1)/N: 3 regions → 2/3 ≈ 66%, so the two survivors can absorb the third's load. In practice leave extra headroom for reconnect storms and the time autoscaling takes.", he: "עם N regions, כל אחד צריך להישאר ב-(N-1)/N או פחות: 3 regions ← ‏2/3 ≈ 66%, כך ששני השורדים יכולים לבלוע את העומס של השלישי. בפועל משאירים עוד מרווח לסערות reconnect ולזמן שלוקח ל-autoscaling." }
    }
  ],
  playground: "lb",
  related: ["plan-product-infra-blueprint", "plan-failure-sla", "net-dns", "net-dns-operations", "net-load-balancing", "net-bgp-anycast", "net-proxies-cdn", "net-ddos-edge", "rel-ha", "rel-bcdr", "rel-dr-drills", "pr-realtime-protocols", "staff-multi-region-data"]
});


/* =========================================================================
   Series: Plan a product's infrastructure end to end (track: principal)
   Lesson: designing for failure (SLA math, FMEA, test plan)
   Scenario: dd-cloud-and-dr-plan (design decision simulator)
   ========================================================================= */

INFRA.lessons.push({
  id: "plan-failure-sla",
  track: "principal",
  order: 185,
  icon: "🧮",
  level: 3,
  minutes: 22,
  title: {
    en: "Designing for failure: SLA math, failure-mode analysis and a test plan",
    he: "לתכנן לכישלון: חשבון SLA, ניתוח מצבי כשל ותוכנית בדיקות"
  },
  tldr: {
    en: "Pick an SLO per user journey, multiply the availability of everything in the path to see what you can really promise, tier every service by criticality (that tier sets RPO/RTO, DR strategy and cost), list how each component fails and who owns the fix, and only believe the numbers after load tests, chaos experiments and a DR drill measured them.",
    he: "בוחרים SLO לכל user journey, מכפילים את הזמינות של כל מה שבמסלול כדי לראות מה באמת אפשר להבטיח, מסווגים כל שירות לפי קריטיות (ה-tier קובע RPO/RTO, אסטרטגיית DR ועלות), כותבים איך כל רכיב נכשל ומי אחראי לתיקון, ומאמינים למספרים רק אחרי ש-load test, ניסויי chaos ו-DR drill מדדו אותם."
  },
  analogy: {
    en: "Think of planning a wedding outdoors. You don't promise the couple 'it won't rain'; you check the forecast odds (SLA math), decide which parts can't fail (the ceremony is tier 0, the photo booth is tier 3), rent a tent only for what matters (DR per tier), write down what happens if the caterer is late or the generator dies and who handles it (FMEA), and do a rehearsal the day before (the test plan). The rehearsal is where you find out the tent doesn't fit the venue.",
    he: "תחשוב על תכנון חתונה בחוץ. אתה לא מבטיח לזוג 'לא ירד גשם'; אתה בודק את הסיכויים בתחזית (חשבון SLA), מחליט מה אסור שייכשל (החופה היא tier 0, עמדת הצילום היא tier 3), שוכר אוהל רק למה שחשוב (DR לפי tier), כותב מה קורה אם הקייטרינג מאחר או הגנרטור מת ומי מטפל בזה (FMEA), ועושה חזרה גנרלית יום לפני (תוכנית הבדיקות). בחזרה הגנרלית מגלים שהאוהל לא נכנס לאולם."
  },
  sections: [
    {
      h: { en: "1. SLOs per user journey, then the external SLA", he: "1. SLO לכל user journey, ורק אז ה-SLA החיצוני" },
      body: {
        en: `<p>Users don't experience "the auth service" or "the Kafka cluster". They experience <strong>journeys</strong>: "I sent a message and it got a double tick", "I opened the app and saw my chats", "I uploaded a photo". So you define SLIs and SLOs on journeys, measured as close to the user as you can (client telemetry, edge logs), and then derive per-service targets from them, not the other way round.</p>
<table><tr><th>Journey (WhatsApp-like)</th><th>SLI</th><th>Internal SLO (28 days)</th><th>Tier</th></tr>
<tr><td>Send message → delivered to server (single tick)</td><td>% of sends acked by the server within 1 s</td><td>99.95%</td><td>0</td></tr>
<tr><td>Message delivered to an online recipient</td><td>% delivered within 3 s (p99)</td><td>99.9%</td><td>0</td></tr>
<tr><td>Login / reconnect</td><td>% of connection attempts that succeed within 2 s</td><td>99.95%</td><td>0</td></tr>
<tr><td>Media upload (photo/video)</td><td>% of uploads that complete without a server error</td><td>99.5%</td><td>1</td></tr>
<tr><td>Search in chat history</td><td>% of searches answered under 1 s</td><td>99%</td><td>2</td></tr>
<tr><td>Admin / analytics dashboards</td><td>availability during business hours</td><td>95%</td><td>3</td></tr></table>
<p>The <strong>SLA</strong> is a contract: a number you put in writing to customers with a penalty (usually service credits) if you miss it. Rules a principal applies:</p>
<ul>
<li><strong>SLA &lt; SLO &lt; what you actually achieve.</strong> If your internal SLO is 99.95%, promise 99.9% externally. The gap is your safety margin for measurement disagreements and bad months.</li>
<li><strong>Measure it the way the contract says.</strong> Define "downtime" precisely: per minute, error rate above X%, measured at your edge, excluding scheduled maintenance announced 72 h ahead and customer-caused errors.</li>
<li><strong>Credits, not refunds.</strong> A typical ladder: below 99.9% → 10% credit of that month's fee, below 99% → 25%, below 95% → 50-100%. Credits are capped at the fee and usually must be claimed by the customer within 30 days.</li>
<li><strong>Consumer apps often have no formal SLA</strong>, but an enterprise tier (WhatsApp Business API, for example) will. Design for the strictest promise you'll sign.</li>
</ul>
<blockquote>💡 Real world: in the design review, the first question isn't "how many nines?" but "which journey, measured where, over what window, and what happens to the error budget when we miss?" A number without those four answers is decoration.</blockquote>`,
        he: `<p>משתמשים לא חווים "את שירות ה-auth" או "את ה-Kafka cluster". הם חווים <strong>journeys</strong>: "שלחתי הודעה וקיבלתי וי", "פתחתי את האפליקציה וראיתי את הצ'אטים", "העליתי תמונה". לכן מגדירים SLI ו-SLO על journeys, ומודדים כמה שיותר קרוב למשתמש (telemetry מהקליינט, לוגים של ה-edge), ורק משם גוזרים יעדים לכל שירות, לא להפך.</p>
<table><tr><th>Journey (מוצר דמוי WhatsApp)</th><th>SLI</th><th>SLO פנימי (28 יום)</th><th>Tier</th></tr>
<tr><td>שליחת הודעה עד אישור מהשרת (וי אחד)</td><td>אחוז השליחות שקיבלו ack מהשרת תוך שנייה</td><td>99.95%</td><td>0</td></tr>
<tr><td>הודעה שהגיעה לנמען מחובר</td><td>אחוז ההודעות שנמסרו תוך 3 שניות (p99)</td><td>99.9%</td><td>0</td></tr>
<tr><td>התחברות / reconnect</td><td>אחוז ניסיונות החיבור שהצליחו תוך 2 שניות</td><td>99.95%</td><td>0</td></tr>
<tr><td>העלאת מדיה (תמונה/וידאו)</td><td>אחוז ההעלאות שהסתיימו בלי שגיאת שרת</td><td>99.5%</td><td>1</td></tr>
<tr><td>חיפוש בהיסטוריית הצ'אט</td><td>אחוז החיפושים שנענו תוך פחות משנייה</td><td>99%</td><td>2</td></tr>
<tr><td>Dashboards של admin ו-analytics</td><td>זמינות בשעות העבודה</td><td>95%</td><td>3</td></tr></table>
<p>ה-<strong>SLA</strong> הוא חוזה: מספר שאתה מתחייב אליו בכתב מול לקוחות, עם קנס (בדרך כלל service credits) אם אתה מפספס. הכללים ש-Principal מפעיל:</p>
<ul>
<li><strong>SLA &lt; SLO &lt; מה שאתה משיג בפועל.</strong> אם ה-SLO הפנימי הוא 99.95%, מבטיחים בחוץ 99.9%. הפער הוא מרווח הביטחון שלך מול מחלוקות מדידה וחודשים רעים.</li>
<li><strong>מודדים כמו שהחוזה אומר.</strong> מגדירים "downtime" בדיוק: לפי דקה, error rate מעל X%, נמדד ב-edge שלך, לא כולל תחזוקה מתוכננת שהוכרזה 72 שעות מראש ולא כולל שגיאות שהלקוח גרם.</li>
<li><strong>Credits, לא החזר כספי.</strong> סולם טיפוסי: מתחת ל-99.9% מקבלים 10% מהתשלום החודשי, מתחת ל-99% מקבלים 25%, מתחת ל-95% בין 50% ל-100%. ה-credits מוגבלים לגובה התשלום, ובדרך כלל הלקוח צריך לתבוע אותם תוך 30 יום.</li>
<li><strong>לאפליקציות צרכניות לרוב אין SLA פורמלי</strong>, אבל ל-tier ארגוני (למשל WhatsApp Business API) יהיה. מתכננים לפי ההבטחה הכי מחמירה שתחתום עליה.</li>
</ul>
<blockquote>💡 Real world: ב-design review השאלה הראשונה היא לא "כמה תשיעיות?" אלא "איזה journey, איפה מודדים, באיזה חלון זמן, ומה קורה ל-error budget כשמפספסים?" מספר בלי ארבע התשובות האלה הוא קישוט.</blockquote>`
      }
    },
    {
      h: { en: "2. Composite availability: the math the SLA has to survive", he: "2. זמינות מורכבת: החשבון שה-SLA צריך לשרוד" },
      body: {
        en: `<p><strong>Serial dependencies multiply.</strong> If a request must pass through every component, availability is the product. For the "send message" path:</p>
<pre>Load balancer     99.99%
Kubernetes (AKS)  99.95%   (uptime SLA tier, zone-redundant)
Database          99.95%
3rd-party (push)  99.9%
-------------------------------------------
0.9999 x 0.9995 x 0.9995 x 0.999 = 0.99791  -&gt; ~99.79%
= ~18.3 hours of possible downtime per year</pre>
<p>Notice: <strong>the composite is worse than your weakest link</strong>. With those parts you cannot honestly promise 99.9% unless you take the 3rd party off the critical path (send the message, queue the push asynchronously) and add redundancy.</p>
<p><strong>Parallel (redundant) components combine as 1 - (1 - a)^n.</strong> Two independent replicas each at 99.9%: 1 - 0.001² = 99.9999%. Three at 99%: 1 - 0.01³ = 99.9999%. The big caveat is <em>independent</em>: two replicas in the same zone, with the same config, deployed by the same pipeline, fail together. Real-world redundancy buys far less than the formula says, which is why you spread across zones, regions and deploy waves.</p>
<pre>Two regions, each a serial stack at 99.79%, active-active with a
failover that itself works 99% of the time:
  P(both down)        = 0.0021^2          = 0.0000044
  P(failover breaks)  = 0.0021 x 0.01     = 0.000021
  availability        = 1 - 0.0000254     ~ 99.997%
The failover mechanism (DNS, health checks, runbook) becomes the weak link.</pre>
<p><strong>Downtime budgets</strong> (per 30-day month and per year):</p>
<table><tr><th>Availability</th><th>Per year</th><th>Per month</th><th>Per week</th><th>What it takes</th></tr>
<tr><td>99.9%</td><td>8 h 46 min</td><td>43 min</td><td>10 min</td><td>Multi-AZ, good on-call, manual failover OK</td></tr>
<tr><td>99.95%</td><td>4 h 23 min</td><td>21.6 min</td><td>5 min</td><td>Multi-AZ everything, automated rollback, tested runbooks</td></tr>
<tr><td>99.99%</td><td>52.6 min</td><td>4.3 min</td><td>1 min</td><td>Multi-region, automatic failover, progressive deploys, no human in the loop</td></tr>
<tr><td>99.999%</td><td>5.3 min</td><td>26 s</td><td>6 s</td><td>Cells, active-active, very few teams truly achieve it</td></tr></table>
<p><strong>What cloud SLAs actually promise</strong> (check the current documents; numbers change):</p>
<table><tr><th>Setup</th><th>Typical SLA</th></tr>
<tr><td>Single VM, premium SSD (Azure)</td><td>99.9%</td></tr>
<tr><td>VMs in an availability set (Azure) / single EC2 instance (AWS)</td><td>99.95% / 99.5%</td></tr>
<tr><td>VMs across 2+ availability zones (Azure, AWS region-level)</td><td>99.99%</td></tr>
<tr><td>AKS Standard tier with AZs / GKE regional control plane</td><td>99.95% (API server only, not your workloads)</td></tr>
<tr><td>Zonal GKE control plane / AKS Free tier</td><td>99.5% / no financially backed SLA</td></tr>
<tr><td>Managed SQL, zone-redundant (Azure SQL Business Critical)</td><td>99.995%</td></tr>
<tr><td>Cosmos DB multi-region writes</td><td>99.999%</td></tr></table>
<blockquote>⚠️ Production tip: <strong>SLA credits are not uptime</strong>. If Azure misses 99.99% on your VMs you get 10% off those VMs' bill, not compensation for your lost revenue. And the Kubernetes SLA covers the API server, not whether your Pods run. The cloud SLA is the input to your math, never the answer.</blockquote>`,
        he: `<p><strong>תלויות טוריות מוכפלות.</strong> אם בקשה חייבת לעבור דרך כל רכיב, הזמינות היא המכפלה. למסלול "שליחת הודעה":</p>
<pre>Load balancer     99.99%
Kubernetes (AKS)  99.95%   (uptime SLA tier, zone-redundant)
Database          99.95%
3rd-party (push)  99.9%
-------------------------------------------
0.9999 x 0.9995 x 0.9995 x 0.999 = 0.99791  -&gt; ~99.79%
= ~18.3 hours of possible downtime per year</pre>
<p>שים לב: <strong>הזמינות המורכבת גרועה מהחוליה הכי חלשה</strong>. עם הרכיבים האלה אי אפשר להבטיח ביושר 99.9%, אלא אם מוציאים את ה-3rd party מהמסלול הקריטי (שולחים את ההודעה, ושמים את ה-push בתור באופן אסינכרוני) ומוסיפים redundancy.</p>
<p><strong>רכיבים מקבילים (redundant) מתחברים לפי 1 - (1 - a)^n.</strong> שני replicas בלתי תלויים, כל אחד 99.9%: 1 - 0.001² = 99.9999%. שלושה של 99%: 1 - 0.01³ = 99.9999%. ההסתייגות הגדולה היא <em>בלתי תלויים</em>: שני replicas באותו zone, עם אותו config, שנפרסו מאותו pipeline, נופלים ביחד. redundancy בעולם האמיתי קונה הרבה פחות ממה שהנוסחה אומרת, ולכן מפזרים בין zones, בין region-ים ובין גלי deploy.</p>
<pre>Two regions, each a serial stack at 99.79%, active-active with a
failover that itself works 99% of the time:
  P(both down)        = 0.0021^2          = 0.0000044
  P(failover breaks)  = 0.0021 x 0.01     = 0.000021
  availability        = 1 - 0.0000254     ~ 99.997%
The failover mechanism (DNS, health checks, runbook) becomes the weak link.</pre>
<p><strong>תקציבי downtime</strong> (לחודש של 30 יום ולשנה):</p>
<table><tr><th>זמינות</th><th>לשנה</th><th>לחודש</th><th>לשבוע</th><th>מה זה דורש</th></tr>
<tr><td>99.9%</td><td>8 שעות ו-46 דקות</td><td>43 דקות</td><td>10 דקות</td><td>Multi-AZ, on-call טוב, failover ידני זה בסדר</td></tr>
<tr><td>99.95%</td><td>4 שעות ו-23 דקות</td><td>21.6 דקות</td><td>5 דקות</td><td>הכול multi-AZ, rollback אוטומטי, runbooks שנבדקו</td></tr>
<tr><td>99.99%</td><td>52.6 דקות</td><td>4.3 דקות</td><td>דקה</td><td>Multi-region, failover אוטומטי, deploy הדרגתי, בלי בן אדם בלולאה</td></tr>
<tr><td>99.999%</td><td>5.3 דקות</td><td>26 שניות</td><td>6 שניות</td><td>Cells ו-active-active; מעט מאוד צוותים באמת מגיעים לזה</td></tr></table>
<p><strong>מה ה-SLA של ספקי הענן באמת מבטיח</strong> (תבדוק את המסמכים העדכניים; המספרים משתנים):</p>
<table><tr><th>תצורה</th><th>SLA טיפוסי</th></tr>
<tr><td>VM בודד עם premium SSD (ב-Azure)</td><td>99.9%</td></tr>
<tr><td>VMs ב-availability set (ב-Azure) / EC2 instance בודד (ב-AWS)</td><td>99.95% / 99.5%</td></tr>
<tr><td>VMs על פני 2 availability zones או יותר (Azure, ו-AWS ברמת region)</td><td>99.99%</td></tr>
<tr><td>AKS ב-Standard tier עם AZs / GKE עם control plane אזורי (regional)</td><td>99.95% (רק ל-API server, לא ל-workloads שלך)</td></tr>
<tr><td>GKE עם control plane ב-zone אחד / AKS ב-Free tier</td><td>99.5% / אין SLA עם גיבוי כספי</td></tr>
<tr><td>SQL מנוהל zone-redundant (Azure SQL Business Critical)</td><td>99.995%</td></tr>
<tr><td>Cosmos DB עם multi-region writes</td><td>99.999%</td></tr></table>
<blockquote>⚠️ Production tip: <strong>SLA credits הם לא uptime</strong>. אם Azure מפספס 99.99% על ה-VMs שלך, אתה מקבל 10% הנחה על החשבון של אותם VMs, לא פיצוי על ההכנסות שהפסדת. וה-SLA של Kubernetes מכסה את ה-API server, לא את זה שה-Pods שלך רצים. ה-SLA של הענן הוא קלט לחשבון שלך, אף פעם לא התשובה.</blockquote>`
      }
    },
    {
      h: { en: "3. Criticality tiers: RPO/RTO, DR strategy and the cost of each", he: "3. Tiers של קריטיות: RPO/RTO, אסטרטגיית DR והמחיר של כל אחד" },
      body: {
        en: `<p>Not every service deserves active-active. Give every service (and every datastore) a <strong>tier</strong> in the service catalog. The tier is a decision, signed by product and engineering, that sets RPO, RTO, DR strategy, on-call level and budget in one shot.</p>
<table><tr><th>Tier</th><th>Examples (messaging)</th><th>RPO</th><th>RTO</th><th>DR strategy</th><th>Infra cost vs single region</th></tr>
<tr><td>0 — the product is down without it</td><td>Connection gateway, message send/store, identity/login, DNS, KMS</td><td>≈ 0 (seconds)</td><td>&lt; 5-15 min, automatic</td><td>Active-active multi-region (or per-region cells with failover)</td><td>x2 to x2.5</td></tr>
<tr><td>1 — core feature degraded</td><td>Media upload/download, push notifications, group management</td><td>&lt; 5 min</td><td>&lt; 1 h</td><td>Warm standby: scaled-down copy running, data replicated, scale up on failover</td><td>x1.3 to x1.6</td></tr>
<tr><td>2 — nice to have</td><td>Search, link previews, stickers, profile photos history</td><td>&lt; 1 h</td><td>&lt; 4-8 h</td><td>Pilot light: data replicated, compute defined in IaC but off</td><td>x1.1 to x1.2</td></tr>
<tr><td>3 — internal</td><td>BI, analytics pipeline, admin tools, CI</td><td>24 h</td><td>24-72 h</td><td>Backup &amp; restore from another region</td><td>x1.02 to x1.05</td></tr></table>
<p>How a tier is decided, in practice:</p>
<ol>
<li><strong>Cost of an hour down</strong>: revenue, contractual credits, support load, brand. If an hour of the service down costs more than a year of the extra DR spend, move it up a tier.</li>
<li><strong>Dependencies inherit the tier upward</strong>: a tier-0 service that synchronously calls a tier-2 service makes that dependency tier 0 (or forces you to make the call async/optional with a fallback).</li>
<li><strong>Data tier can differ from compute tier</strong>: search compute can be tier 2 because the index can be rebuilt, but the messages it indexes are tier 0.</li>
<li><strong>Write it in the catalog</strong> (Backstage annotation, a <code>tier</code> label on the namespace) so alerting, change freezes and DR drills key off it automatically.</li>
</ol>
<pre># namespace labels used by policy, alert routing and DR tooling
apiVersion: v1
kind: Namespace
metadata:
  name: msg-gateway
  labels:
    tier: "0"
    rpo-seconds: "5"
    rto-minutes: "15"
    dr-strategy: active-active
    owner: team-realtime</pre>
<blockquote>💡 Real world: when every team marks itself tier 0, ask for the budget line. Tier 0 means two regions of capacity, a 24/7 pager and quarterly drills. Most teams find they are tier 2 the moment they own that cost.</blockquote>`,
        he: `<p>לא כל שירות צריך active-active. נותנים לכל שירות (ולכל datastore) <strong>tier</strong> ב-service catalog. ה-tier הוא החלטה, חתומה על ידי product ו-engineering, שקובעת בבת אחת RPO, RTO, אסטרטגיית DR, רמת on-call ותקציב.</p>
<table><tr><th>Tier</th><th>דוגמאות (messaging)</th><th>RPO</th><th>RTO</th><th>אסטרטגיית DR</th><th>עלות תשתית מול region אחד</th></tr>
<tr><td>0 — בלעדיו המוצר למטה</td><td>Connection gateway, שליחה ושמירה של הודעות, identity/login, DNS, KMS</td><td>כמעט 0 (שניות)</td><td>פחות מ-5 עד 15 דקות, אוטומטי</td><td>Active-active multi-region (או cells לכל region עם failover)</td><td>x2 עד x2.5</td></tr>
<tr><td>1 — פיצ'ר מרכזי במצב מופחת</td><td>העלאה והורדה של מדיה, push notifications, ניהול קבוצות</td><td>פחות מ-5 דקות</td><td>פחות משעה</td><td>Warm standby: עותק מוקטן רץ, הנתונים משוכפלים, מגדילים ב-failover</td><td>x1.3 עד x1.6</td></tr>
<tr><td>2 — נחמד שיהיה</td><td>חיפוש, link previews, סטיקרים, היסטוריית תמונות פרופיל</td><td>פחות משעה</td><td>פחות מ-4 עד 8 שעות</td><td>Pilot light: הנתונים משוכפלים, ה-compute מוגדר ב-IaC אבל כבוי</td><td>x1.1 עד x1.2</td></tr>
<tr><td>3 — פנימי</td><td>BI, pipeline של analytics, כלי admin, CI</td><td>24 שעות</td><td>24 עד 72 שעות</td><td>Backup &amp; restore מ-region אחר</td><td>x1.02 עד x1.05</td></tr></table>
<p>איך מחליטים על tier בפועל:</p>
<ol>
<li><strong>כמה עולה שעה של השבתה</strong>: הכנסות, credits לפי חוזה, עומס על התמיכה, מוניטין. אם שעה שהשירות למטה עולה יותר משנה של הוצאה נוספת על DR, מעלים אותו tier.</li>
<li><strong>תלויות יורשות את ה-tier כלפי מעלה</strong>: שירות tier 0 שקורא באופן סינכרוני לשירות tier 2 הופך את התלות ל-tier 0 (או מכריח אותך להפוך את הקריאה לאסינכרונית או אופציונלית עם fallback).</li>
<li><strong>ה-tier של הנתונים יכול להיות שונה מה-tier של ה-compute</strong>: ה-compute של החיפוש יכול להיות tier 2 כי אפשר לבנות את האינדקס מחדש, אבל ההודעות שהוא מאנדקס הן tier 0.</li>
<li><strong>כותבים את זה ב-catalog</strong> (annotation ב-Backstage, label בשם <code>tier</code> על ה-namespace) כדי שה-alerting, ה-change freezes וה-DR drills יתבססו עליו אוטומטית.</li>
</ol>
<pre># namespace labels used by policy, alert routing and DR tooling
apiVersion: v1
kind: Namespace
metadata:
  name: msg-gateway
  labels:
    tier: "0"
    rpo-seconds: "5"
    rto-minutes: "15"
    dr-strategy: active-active
    owner: team-realtime</pre>
<blockquote>💡 Real world: כשכל צוות מסמן את עצמו tier 0, תבקש את שורת התקציב. Tier 0 אומר קיבולת של שני region-ים, pager מסביב לשעון ו-drill-ים כל רבעון. רוב הצוותים מגלים שהם tier 2 ברגע שהעלות הזו על השם שלהם.</blockquote>`
      }
    },
    {
      h: { en: "4. Failure-mode analysis (FMEA) for a messaging product", he: "4. ניתוח מצבי כשל (FMEA) למוצר messaging" },
      body: {
        en: `<p>FMEA is a table you build in the design review: for every component, <em>how</em> it fails, how far the damage spreads, how you'll know within minutes, what limits the damage, and which team owns it. Rows without an owner or without a detection signal are your action items.</p>
<table><tr><th>Component / event</th><th>Failure</th><th>Blast radius</th><th>Detection</th><th>Mitigation</th><th>Owner</th></tr>
<tr><td>Availability zone</td><td>Zone power/network loss</td><td>1/3 of nodes and DB replicas in a region</td><td>Node NotReady, LB health checks, zonal error rate</td><td>3 zones, topology spread, zone-redundant DB, 50% headroom so 2 zones carry the load</td><td>Platform</td></tr>
<tr><td>Region</td><td>Full region outage or control-plane failure</td><td>All users homed in that region</td><td>Synthetic probes from other regions, provider status</td><td>Tier 0 active in a second region; reconnect storm handled by jittered client backoff; runbook to drain the region at the edge</td><td>SRE</td></tr>
<tr><td>DB primary</td><td>Primary crash or failover</td><td>Writes for that shard/partition for 20-60 s</td><td>Write errors, replication role change event</td><td>Automatic failover, client retries with idempotency keys, connection pool reset</td><td>Data</td></tr>
<tr><td>Cache (Redis)</td><td>Flush, restart, eviction storm</td><td>All reads hit DB: thundering herd, DB at 10x load</td><td>Hit ratio drop, DB CPU, p99 latency</td><td>Request coalescing, jittered TTLs, warm-up before taking traffic, DB load shedding</td><td>Backend</td></tr>
<tr><td>Deploy</td><td>Bad release (crash loop, logic bug)</td><td>Whatever the rollout reached</td><td>Canary SLO analysis, error rate per version</td><td>Canary 1% → 10% → 50% per region, automatic rollback, one region at a time</td><td>Owning team</td></tr>
<tr><td>Config / feature flag</td><td>Bad config pushed globally in seconds</td><td>Everything, everywhere, instantly</td><td>Error spike right after a config change event</td><td>Config goes through the same staged rollout as code; validation; kill switch</td><td>Platform</td></tr>
<tr><td>TLS certificate</td><td>Expired cert on edge or mTLS</td><td>All clients (edge) or service-to-service</td><td>Expiry alert at 30/14/7 days, synthetic TLS check</td><td>cert-manager / Key Vault auto-rotation, inventory of every cert</td><td>Security + Platform</td></tr>
<tr><td>DNS</td><td>Provider outage, bad record, TTL too long for failover</td><td>All new connections</td><td>External resolution probes from many networks</td><td>Low TTL (60 s) on failover records, secondary provider for the apex, change review</td><td>Network</td></tr>
<tr><td>3rd-party dependency</td><td>Push provider (APNs/FCM) or SMS OTP down</td><td>Notifications delayed; new logins fail</td><td>Provider error rate, queue age</td><td>Async queue with retries, second SMS provider, circuit breaker, degrade (in-app only)</td><td>Backend</td></tr>
<tr><td>Quota / limits</td><td>vCPU quota, IP exhaustion in subnet, API rate limits</td><td>Scale-out fails exactly during a spike or failover</td><td>Quota usage alerts at 70%</td><td>Pre-approved quota for DR capacity, /16 subnets for Pods, quota checked in every drill</td><td>Platform</td></tr>
<tr><td>Data corruption / ransomware</td><td>Bad migration, buggy writer, attacker deletes or encrypts</td><td>Replicated instantly to every replica and region</td><td>Integrity checks, anomaly in delete rate, backup job failures</td><td>Point-in-time restore, <strong>immutable backups</strong> (WORM / locked vault) in a separate account with separate credentials, delayed replica</td><td>Data + Security</td></tr></table>
<blockquote>⚠️ Production tip: replication is not a backup. Multi-region replication faithfully copies a <code>DELETE FROM messages</code> to every region in under a second. Only backups that an attacker with admin rights in prod <em>cannot</em> delete (Azure Backup immutable vault, S3 Object Lock in compliance mode, GCS bucket lock) protect against ransomware and your own bugs.</blockquote>
<p>Score each row (likelihood x impact x 1/detectability) if you like the classic FMEA RPN, but the real value is the conversation: "who gets paged, and what is the first command they run?"</p>`,
        he: `<p>FMEA היא טבלה שבונים ב-design review: לכל רכיב, <em>איך</em> הוא נכשל, כמה רחוק הנזק מתפשט, איך תדע תוך דקות, מה מגביל את הנזק, ואיזה צוות אחראי. שורות בלי owner או בלי סיגנל detection הן ה-action items שלך.</p>
<table><tr><th>רכיב / אירוע</th><th>כשל</th><th>Blast radius</th><th>Detection</th><th>Mitigation</th><th>Owner</th></tr>
<tr><td>Availability zone</td><td>אובדן חשמל או רשת ב-zone</td><td>שליש מה-nodes ומה-replicas של ה-DB ב-region</td><td>Node במצב NotReady, health checks של ה-LB, error rate לפי zone</td><td>3 zones, topology spread, DB שהוא zone-redundant, מרווח של 50% כדי ששני zones יחזיקו את העומס</td><td>Platform</td></tr>
<tr><td>Region</td><td>נפילה של region שלם או כשל ב-control plane</td><td>כל המשתמשים שמשויכים ל-region הזה</td><td>Synthetic probes מ-region-ים אחרים, דף הסטטוס של הספק</td><td>Tier 0 פעיל ב-region שני; גל ה-reconnect נספג בזכות backoff עם jitter בקליינט; runbook לנקז את ה-region ב-edge</td><td>SRE</td></tr>
<tr><td>Primary של ה-DB</td><td>קריסה של ה-primary או failover</td><td>כתיבות ל-shard או partition הזה למשך 20 עד 60 שניות</td><td>שגיאות כתיבה, אירוע של החלפת role ברפליקציה</td><td>Failover אוטומטי, retries בקליינט עם idempotency keys, איפוס של connection pool</td><td>Data</td></tr>
<tr><td>Cache (Redis)</td><td>Flush, restart, סערת eviction</td><td>כל הקריאות נוחתות על ה-DB: thundering herd, ה-DB בעומס פי 10</td><td>ירידה ב-hit ratio, CPU של ה-DB, p99 latency</td><td>Request coalescing, TTL עם jitter, warm-up לפני שמקבלים traffic, load shedding ב-DB</td><td>Backend</td></tr>
<tr><td>Deploy</td><td>גרסה גרועה (crash loop, באג לוגי)</td><td>כל מה שה-rollout הספיק להגיע אליו</td><td>ניתוח SLO ב-canary, error rate לפי גרסה</td><td>Canary של 1% ואז 10% ואז 50% בכל region, rollback אוטומטי, region אחד בכל פעם</td><td>הצוות שמחזיק את השירות</td></tr>
<tr><td>Config / feature flag</td><td>Config גרוע שנדחף לכל העולם תוך שניות</td><td>הכול, בכל מקום, מיד</td><td>קפיצה בשגיאות מיד אחרי אירוע של שינוי config</td><td>Config עובר את אותו rollout מדורג כמו קוד; ולידציה; kill switch</td><td>Platform</td></tr>
<tr><td>תעודת TLS</td><td>תעודה שפגה ב-edge או ב-mTLS</td><td>כל הקליינטים (ב-edge) או התקשורת בין השירותים</td><td>Alert על תפוגה ב-30, 14 ו-7 ימים, בדיקת TLS סינתטית</td><td>רוטציה אוטומטית עם cert-manager או Key Vault, מלאי של כל התעודות</td><td>Security ו-Platform</td></tr>
<tr><td>DNS</td><td>נפילה של הספק, רשומה שגויה, TTL ארוך מדי בשביל failover</td><td>כל החיבורים החדשים</td><td>בדיקות resolution חיצוניות מהרבה רשתות</td><td>TTL נמוך (60 שניות) לרשומות failover, ספק משני ל-apex, review לשינויים</td><td>Network</td></tr>
<tr><td>תלות ב-3rd party</td><td>ספק ה-push (APNs/FCM) או ה-SMS ל-OTP למטה</td><td>התראות מתעכבות; התחברויות חדשות נכשלות</td><td>Error rate של הספק, הגיל של ההודעות בתור</td><td>תור אסינכרוני עם retries, ספק SMS שני, circuit breaker, מצב מופחת (רק התראות בתוך האפליקציה)</td><td>Backend</td></tr>
<tr><td>Quota / limits</td><td>Quota של vCPU, נגמרו כתובות IP ב-subnet, rate limits של API</td><td>ה-scale-out נכשל בדיוק בזמן spike או failover</td><td>Alerts על שימוש ב-quota ב-70%</td><td>Quota מאושרת מראש לקיבולת DR, subnets של /16 ל-Pods, בדיקת quota בכל drill</td><td>Platform</td></tr>
<tr><td>השחתת נתונים / ransomware</td><td>Migration גרוע, writer עם באג, תוקף שמוחק או מצפין</td><td>משוכפל מיד לכל replica ולכל region</td><td>בדיקות שלמות, חריגה בקצב המחיקות, כשלים ב-jobs של backup</td><td>Point-in-time restore, <strong>immutable backups</strong> (WORM / vault נעול) בחשבון נפרד עם credentials נפרדים, replica מושהית</td><td>Data ו-Security</td></tr></table>
<blockquote>⚠️ Production tip: רפליקציה היא לא backup. רפליקציה multi-region מעתיקה בנאמנות <code>DELETE FROM messages</code> לכל region תוך פחות משנייה. רק backups שתוקף עם הרשאות admin ב-prod <em>לא יכול</em> למחוק (immutable vault של Azure Backup, S3 Object Lock ב-compliance mode, bucket lock ב-GCS) מגנים מפני ransomware ומפני הבאגים של עצמך.</blockquote>
<p>אפשר לתת לכל שורה ציון (סבירות כפול השפעה כפול 1 חלקי יכולת הזיהוי) אם אתה אוהב את ה-RPN הקלאסי של FMEA, אבל הערך האמיתי הוא השיחה: "את מי מעירים, ומה הפקודה הראשונה שהוא מריץ?"</p>`
      }
    },
    {
      h: { en: "5. The test plan: prove the numbers before users do", he: "5. תוכנית הבדיקות: להוכיח את המספרים לפני שהמשתמשים יעשו את זה" },
      body: {
        en: `<p>Every number in the previous sections is a hypothesis until a test measured it. A launch test plan for a 20M-user messaging product:</p>
<table><tr><th>Test</th><th>What it proves</th><th>Pass criteria (example)</th><th>Cadence</th></tr>
<tr><td>Load test</td><td>Capacity model is right</td><td>2x expected peak (e.g. 400k msgs/s, 8M concurrent connections) with p99 send-ack &lt; 300 ms</td><td>Before launch, before each big event, after major changes</td></tr>
<tr><td>Soak test</td><td>No leaks, no slow degradation</td><td>Peak load for 12-24 h: memory flat, no connection drift, no GC creep</td><td>Before launch, quarterly</td></tr>
<tr><td>Spike / reconnect storm</td><td>The fleet survives everybody reconnecting at once</td><td>5M reconnects in 60 s after a gateway restart; no cascading failure</td><td>Before launch</td></tr>
<tr><td>Chaos: Pod kill</td><td>Replicas, PDBs and retries work</td><td>Kill 30% of a service's Pods: SLO holds</td><td>Continuous in staging, weekly in prod</td></tr>
<tr><td>Chaos: AZ blackhole</td><td>Zone redundancy and headroom</td><td>Drop all traffic to one zone for 30 min: SLO holds, no manual action</td><td>Monthly</td></tr>
<tr><td>Chaos: latency injection</td><td>Timeouts, circuit breakers, no retry storms</td><td>+500 ms to the DB or push provider: send path still meets SLO</td><td>Monthly</td></tr>
<tr><td>DR drill (region failover)</td><td>Measured RTO and RPO for tier 0/1</td><td>RTO ≤ 15 min, RPO ≤ 5 s, using only the runbook</td><td>Quarterly for tier 0, twice a year tier 1</td></tr>
<tr><td>Restore test</td><td>Backups actually restore, and how long it takes</td><td>Restore last night's backup of the largest DB to a scratch env; time it; row counts and checksums match</td><td>Monthly automated, quarterly with humans</td></tr>
<tr><td>Game day</td><td>People, paging, comms and runbooks under surprise</td><td>Unannounced scenario to on-call; time to detect &lt; 5 min, time to mitigate within the tier RTO</td><td>Quarterly</td></tr></table>
<p><strong>Production readiness review (PRR) checklist</strong>, signed before launch:</p>
<ul>
<li>SLOs per journey defined, dashboards and burn-rate alerts live, error budget policy agreed.</li>
<li>Every service has a tier, an owner, an on-call rotation and a runbook link in its alerts.</li>
<li>Capacity: load test at 2x peak passed; autoscaling limits and cloud quotas cover DR failover capacity.</li>
<li>Resilience: multi-AZ verified (not assumed), PDBs set, timeouts and retries with backoff and jitter, circuit breakers on 3rd parties.</li>
<li>Data: backups immutable and restore-tested with a measured time; PITR enabled; migration rollback plan.</li>
<li>Release: canary + automatic rollback; config and flags go through staged rollout; feature kill switches.</li>
<li>Security: secrets in a vault, certs auto-rotated and inventoried, least-privilege IAM, DDoS protection on the edge.</li>
<li>DR: one drill done with measured RTO/RPO, findings closed or accepted in writing.</li>
<li>Dependencies: list of 3rd parties with their SLAs, fallbacks and contacts.</li>
<li>Comms: status page, incident process, escalation contacts at the cloud provider (TAM / support plan).</li>
</ul>
<blockquote>💡 Real world: the most common drill findings are boring: a missing IAM role in the DR region, a quota nobody raised, a hardcoded endpoint, a DNS TTL of 3600 s, and a restore that takes 9 hours instead of the assumed 1. Each one would have doubled the RTO of a real outage.</blockquote>`,
        he: `<p>כל מספר בסעיפים הקודמים הוא השערה עד שבדיקה מדדה אותו. תוכנית בדיקות להשקה של מוצר messaging עם 20 מיליון משתמשים:</p>
<table><tr><th>בדיקה</th><th>מה היא מוכיחה</th><th>תנאי הצלחה (דוגמה)</th><th>תדירות</th></tr>
<tr><td>Load test</td><td>שמודל הקיבולת נכון</td><td>פי 2 מהשיא הצפוי (למשל 400k הודעות בשנייה, 8 מיליון חיבורים בו-זמנית) עם p99 של send-ack מתחת ל-300ms</td><td>לפני ההשקה, לפני כל אירוע גדול, אחרי שינויים משמעותיים</td></tr>
<tr><td>Soak test</td><td>שאין דליפות ואין התדרדרות איטית</td><td>עומס שיא במשך 12 עד 24 שעות: זיכרון יציב, בלי זליגה בחיבורים, בלי GC שהולך ומתארך</td><td>לפני ההשקה, כל רבעון</td></tr>
<tr><td>Spike / סערת reconnect</td><td>שה-fleet שורד מצב שבו כולם מתחברים מחדש בבת אחת</td><td>5 מיליון reconnects תוך 60 שניות אחרי restart של gateway; בלי כשל מתגלגל</td><td>לפני ההשקה</td></tr>
<tr><td>Chaos: הריגת Pods</td><td>ש-replicas, PDBs ו-retries עובדים</td><td>הורגים 30% מה-Pods של שירות: ה-SLO מחזיק</td><td>רציף ב-staging, שבועי ב-prod</td></tr>
<tr><td>Chaos: AZ blackhole</td><td>Zone redundancy ומרווח קיבולת</td><td>חוסמים את כל ה-traffic ל-zone אחד ל-30 דקות: ה-SLO מחזיק, בלי פעולה ידנית</td><td>חודשי</td></tr>
<tr><td>Chaos: הזרקת latency</td><td>Timeouts, circuit breakers, בלי retry storms</td><td>תוספת של 500ms ל-DB או לספק ה-push: מסלול השליחה עדיין עומד ב-SLO</td><td>חודשי</td></tr>
<tr><td>DR drill (region failover)</td><td>RTO ו-RPO מדודים ל-tier 0 ו-1</td><td>RTO של עד 15 דקות, RPO של עד 5 שניות, רק לפי ה-runbook</td><td>כל רבעון ל-tier 0, פעמיים בשנה ל-tier 1</td></tr>
<tr><td>בדיקת restore</td><td>שה-backups באמת משוחזרים, וכמה זמן זה לוקח</td><td>משחזרים את ה-backup של אתמול בלילה של ה-DB הכי גדול לסביבת scratch; מודדים זמן; מספר השורות וה-checksums תואמים</td><td>חודשי אוטומטי, רבעוני עם בני אדם</td></tr>
<tr><td>Game day</td><td>אנשים, paging, תקשורת ו-runbooks תחת הפתעה</td><td>תרחיש לא מוכרז ל-on-call; זמן לזיהוי מתחת ל-5 דקות, זמן ל-mitigation בתוך ה-RTO של ה-tier</td><td>כל רבעון</td></tr></table>
<p><strong>Checklist של Production Readiness Review (PRR)</strong>, שנחתם לפני ההשקה:</p>
<ul>
<li>SLO מוגדר לכל journey, dashboards ו-alerts על burn rate באוויר, מדיניות error budget מוסכמת.</li>
<li>לכל שירות יש tier, owner, rotation של on-call ולינק ל-runbook בתוך ה-alerts.</li>
<li>קיבולת: load test בפי 2 מהשיא עבר; גבולות ה-autoscaling וה-quotas בענן מכסים את קיבולת ה-failover של DR.</li>
<li>עמידות: multi-AZ נבדק (לא הונח), PDBs מוגדרים, timeouts ו-retries עם backoff ו-jitter, circuit breakers מול 3rd parties.</li>
<li>נתונים: backups שהם immutable ושנבדק להם restore עם זמן מדוד; PITR מופעל; תוכנית rollback ל-migrations.</li>
<li>Release: canary ו-rollback אוטומטי; config ו-flags עוברים rollout מדורג; kill switches לפיצ'רים.</li>
<li>אבטחה: secrets ב-vault, תעודות עם רוטציה אוטומטית ומלאי, IAM עם least privilege, הגנת DDoS ב-edge.</li>
<li>DR: drill אחד בוצע עם RTO ו-RPO מדודים, וה-findings נסגרו או התקבלו בכתב.</li>
<li>תלויות: רשימה של ה-3rd parties עם ה-SLA שלהם, fallbacks ואנשי קשר.</li>
<li>תקשורת: status page, תהליך incident, אנשי קשר ל-escalation אצל ספק הענן (TAM / תוכנית support).</li>
</ul>
<blockquote>💡 Real world: ה-findings הנפוצים ב-drill-ים משעממים: IAM role חסר ב-region של ה-DR, quota שאף אחד לא העלה, endpoint קשיח בקוד, TTL של 3600 שניות ב-DNS, ו-restore שלוקח 9 שעות במקום השעה שהניחו. כל אחד מהם היה מכפיל את ה-RTO של תקלה אמיתית.</blockquote>`
      }
    }
  ],
  diagram: `journey SLO (send msg 99.95%)  ->  external SLA 99.9% (+ credits)
        |
        v
serial path:  LB 99.99 x AKS 99.95 x DB 99.95 x push 99.9  = 99.79%
        |  remove 3rd party from sync path, add regions
        v
parallel:     1 - (1 - 0.9979)^2  (minus correlated failure, failover risk)
        |
        v
tiers:  T0 active-active | T1 warm standby | T2 pilot light | T3 backup/restore
        |
        v
FMEA rows (failure, blast radius, detection, mitigation, owner)
        |
        v
tests:  load 2x -> soak -> chaos (pod / AZ / latency) -> DR drill -> game day -> PRR`,
  handsOn: [
    {
      cmd: `k6 run --vus 2000 --duration 30m -e TARGET=wss://staging.example.com/ws send-message.js`,
      what: {
        en: "Load/soak test the send path with k6 (WebSocket script). Add thresholds in the script (e.g. p(99) of send_ack under 300 ms) so the run fails the pipeline when the SLO is missed.",
        he: "Load test או soak על מסלול השליחה עם k6 (סקריפט WebSocket). מוסיפים thresholds בסקריפט (למשל p(99) של send_ack מתחת ל-300ms) כדי שההרצה תכשיל את ה-pipeline כשמפספסים את ה-SLO."
      }
    },
    {
      cmd: `kubectl get nodes -L topology.kubernetes.io/zone && kubectl cordon -l topology.kubernetes.io/zone=westeurope-1 && kubectl drain -l topology.kubernetes.io/zone=westeurope-1 --ignore-daemonsets --delete-emptydir-data --timeout=10m`,
      what: {
        en: "Poor man's zone-loss test: cordon and drain every node in one zone and watch whether the remaining two zones absorb the Pods and the SLO holds. Run kubectl uncordon afterwards.",
        he: "בדיקת אובדן zone בגרסה הפשוטה: עושים cordon ו-drain לכל ה-nodes ב-zone אחד ובודקים אם שני ה-zones הנותרים קולטים את ה-Pods וה-SLO מחזיק. אחר כך מריצים kubectl uncordon."
      }
    },
    {
      cmd: `aws fis start-experiment --experiment-template-id EXT1a2b3c4d5e6f7  |  az rest --method post --url "https://management.azure.com/subscriptions/SUB/resourceGroups/rg-chaos/providers/Microsoft.Chaos/experiments/az-blackhole/start?api-version=2024-01-01"  |  kubectl apply -f pod-kill-30pct.yaml   # Chaos Mesh PodChaos`,
      what: {
        en: "Start a managed chaos experiment: AWS FIS (e.g. AZ power interruption scenario), Azure Chaos Studio (zone-down via NSG/VMSS faults), or Chaos Mesh PodChaos/NetworkChaos inside the cluster. Always define stop conditions tied to an SLO alarm.",
        he: "מפעילים ניסוי chaos מנוהל: AWS FIS (למשל תרחיש של הפסקת חשמל ב-AZ), Azure Chaos Studio (zone למטה דרך faults של NSG או VMSS), או PodChaos/NetworkChaos של Chaos Mesh בתוך ה-cluster. תמיד מגדירים stop conditions שקשורים ל-alarm של SLO."
      }
    },
    {
      cmd: `time pg_restore --jobs=8 --no-owner -d restore_test /backups/messages_2026-11-17.dump && psql -d restore_test -c "select count(*), max(created_at) from messages"`,
      what: {
        en: "Restore test with a stopwatch: the elapsed time is your real restore RTO for this DB, and max(created_at) versus the incident time is your RPO. Compare row counts with production.",
        he: "בדיקת restore עם סטופר: הזמן שעבר הוא ה-RTO האמיתי של restore ל-DB הזה, ו-max(created_at) מול זמן התקלה הוא ה-RPO. משווים את מספר השורות ל-production."
      }
    },
    {
      cmd: `node -e "const p=[0.9999,0.9995,0.9995,0.999].reduce((a,b)=>a*b); const two=1-Math.pow(1-p,2); console.log((p*100).toFixed(3)+'%', (8760*(1-p)).toFixed(1)+' h/yr', 'x2 regions:', (two*100).toFixed(5)+'%')"`,
      what: {
        en: "Composite availability calculator: serial product of the path, hours of downtime per year, and the theoretical two-region parallel figure (before correlated failures and failover risk).",
        he: "מחשבון זמינות מורכבת: המכפלה הטורית של המסלול, שעות downtime בשנה, והמספר התיאורטי של שני region-ים במקביל (לפני כשלים מתואמים והסיכון של ה-failover)."
      }
    }
  ],
  mnemonic: {
    en: "\"Journey, Multiply, Tier, Table, Test\": SLO per Journey, Multiply the path, Tier every service, Table the failures (FMEA), Test until the numbers are measured. And: credits are not uptime, replicas are not backups.",
    he: "\"Journey, Multiply, Tier, Table, Test\": SLO לכל journey, מכפילים את המסלול, tier לכל שירות, טבלת כשלים (FMEA), ובודקים עד שהמספרים מדודים. ובנוסף: credits הם לא uptime, ו-replicas הם לא backups."
  },
  pitfalls: [
    {
      en: "Promising the cloud's SLA as your own. Your users hit a chain of 10+ components; even if each is 99.95%, the product of the chain is closer to 99.5%. Compute the composite, then promise less than your internal SLO.",
      he: "להבטיח את ה-SLA של הענן כאילו הוא שלך. המשתמשים עוברים בשרשרת של יותר מ-10 רכיבים; גם אם כל אחד 99.95%, המכפלה של השרשרת קרובה יותר ל-99.5%. מחשבים את הזמינות המורכבת, ואז מבטיחים פחות מה-SLO הפנימי."
    },
    {
      en: "Treating redundancy as independent. Two zones fed by the same bad config push, or two regions running the same buggy release, fail together. The 1-(1-a)^n formula only holds when failures are uncorrelated: stagger deploys and config by zone and region.",
      he: "להתייחס ל-redundancy כאילו הוא בלתי תלוי. שני zones שמקבלים את אותו config גרוע, או שני region-ים שמריצים את אותה גרסה עם באג, נופלים ביחד. הנוסחה 1-(1-a)^n נכונה רק כשהכשלים לא מתואמים: מדרגים deploy ו-config לפי zone ולפי region."
    },
    {
      en: "Counting replication as backup. Corruption, a bad migration or ransomware replicate in seconds. Keep immutable, separately-credentialed backups and actually time a restore.",
      he: "לספור רפליקציה כ-backup. השחתת נתונים, migration גרוע או ransomware משתכפלים תוך שניות. מחזיקים backups שהם immutable, עם credentials נפרדים, ובאמת מודדים זמן של restore."
    },
    {
      en: "Making everything tier 0. Active-active for admin tools doubles cost and operational load for no user benefit. Tiers exist so you can spend the reliability budget where the journey needs it.",
      he: "להפוך הכול ל-tier 0. Active-active לכלי admin מכפיל את העלות ואת העומס התפעולי בלי שום תועלת למשתמש. Tiers קיימים כדי לשים את תקציב האמינות איפה שה-journey צריך אותו."
    }
  ],
  interview: [
    {
      q: {
        en: "Your path is LB 99.99%, Kubernetes 99.95%, DB 99.95% and a push provider 99.9%. Sales wants to sign a 99.95% SLA. What do you say?",
        he: "המסלול שלך הוא LB של 99.99%, Kubernetes של 99.95%, DB של 99.95% וספק push של 99.9%. ה-Sales רוצים לחתום על SLA של 99.95%. מה אתה אומר?"
      },
      a: {
        en: "The serial composite is about 99.79%, roughly 18 hours of allowed downtime a year, so 99.95% (4.4 h) is not supportable as-is. Options: take the push provider off the synchronous path (queue it; the SLA journey is 'message accepted', not 'push delivered'), run tier-0 components active-active in two regions, and set an internal SLO of 99.95-99.99% with the external SLA at 99.9% and a credit ladder. I'd also define the SLA measurement precisely (per-minute error rate at our edge, exclusions) so we aren't arguing about numbers later.",
        he: "המכפלה הטורית יוצאת בערך 99.79%, כלומר כ-18 שעות downtime מותרות בשנה, אז 99.95% (4.4 שעות) לא ניתן לעמוד בו במצב הנוכחי. האפשרויות: להוציא את ספק ה-push מהמסלול הסינכרוני (לשים בתור; ה-journey של ה-SLA הוא 'הודעה התקבלה', לא 'push נמסר'), להריץ את רכיבי tier 0 ב-active-active בשני region-ים, ולקבוע SLO פנימי של 99.95% עד 99.99% כשה-SLA החיצוני הוא 99.9% עם סולם credits. הייתי גם מגדיר בדיוק איך מודדים את ה-SLA (error rate לפי דקה ב-edge שלנו, החרגות) כדי שלא נתווכח על המספרים אחר כך."
      }
    },
    {
      q: {
        en: "How do you decide which services get active-active and which get backup-and-restore?",
        he: "איך אתה מחליט אילו שירותים מקבלים active-active ואילו backup-and-restore?"
      },
      a: {
        en: "By criticality tier, decided per user journey and cost of downtime. Tier 0 (message send, connection gateway, identity) gets active-active, RPO near zero, RTO minutes, about 2x cost. Tier 1 (media, push) warm standby. Tier 2 (search) pilot light because the index can be rebuilt. Tier 3 (BI, admin) backup-restore. Dependencies inherit tiers upward, so a tier-0 service can't synchronously depend on a tier-2 one. The tier is written in the catalog and drives alerts, drills and budget, and it's validated by a drill that measures the actual RTO/RPO.",
        he: "לפי tier של קריטיות, שנקבע לפי ה-user journey ולפי כמה עולה השבתה. Tier 0 (שליחת הודעות, connection gateway, identity) מקבל active-active, RPO קרוב לאפס, RTO של דקות, בערך פי 2 בעלות. Tier 1 (מדיה, push) מקבל warm standby. Tier 2 (חיפוש) מקבל pilot light כי אפשר לבנות את האינדקס מחדש. Tier 3 (BI, admin) מקבל backup-restore. תלויות יורשות tier כלפי מעלה, כך ששירות tier 0 לא יכול להיות תלוי באופן סינכרוני בשירות tier 2. ה-tier כתוב ב-catalog ומניע את ה-alerts, ה-drills והתקציב, ומאומת ב-drill שמודד את ה-RTO וה-RPO בפועל."
      }
    },
    {
      q: {
        en: "Name three failure modes that multi-region replication does not protect you from, and what does.",
        he: "תן שלושה מצבי כשל שרפליקציה multi-region לא מגינה מפניהם, ומה כן מגן."
      },
      a: {
        en: "1) Data corruption or a bad migration: it replicates instantly; you need point-in-time restore and a delayed replica. 2) Ransomware or a compromised admin deleting data: you need immutable backups in a separate account with separate credentials. 3) A bad global config push or release: it reaches every region; you need staged rollouts by region, automatic rollback and kill switches. Bonus: a cert expiry or DNS mistake hits all regions at once; you need inventory, auto-rotation and external probes.",
        he: "1) השחתת נתונים או migration גרוע: זה משתכפל מיד; צריך point-in-time restore ו-replica מושהית. 2) Ransomware או admin שנפרץ ומוחק נתונים: צריך immutable backups בחשבון נפרד עם credentials נפרדים. 3) Config או release גרוע שנדחף גלובלית: הוא מגיע לכל region; צריך rollout מדורג לפי region, rollback אוטומטי ו-kill switches. בונוס: תעודה שפגה או טעות ב-DNS פוגעות בכל ה-region-ים בבת אחת; צריך מלאי, רוטציה אוטומטית ובדיקות חיצוניות."
      }
    }
  ],
  quiz: [
    {
      q: {
        en: "A request passes serially through components at 99.99%, 99.95%, 99.95% and 99.9%. What is the approximate end-to-end availability?",
        he: "בקשה עוברת באופן טורי דרך רכיבים של 99.99%, 99.95%, 99.95% ו-99.9%. מה הזמינות מקצה לקצה, בערך?"
      },
      options: [
        { en: "99.9% (the weakest link)", he: "99.9% (החוליה הכי חלשה)" },
        { en: "About 99.79%", he: "בערך 99.79%" },
        { en: "99.95% (the average)", he: "99.95% (הממוצע)" },
        { en: "99.99% (the best component)", he: "99.99% (הרכיב הכי טוב)" }
      ],
      answer: 1,
      explain: {
        en: "Serial availability multiplies: 0.9999 x 0.9995 x 0.9995 x 0.999 ≈ 0.9979, about 18 hours of downtime a year. The composite is always worse than the weakest component.",
        he: "זמינות טורית מוכפלת: 0.9999 x 0.9995 x 0.9995 x 0.999 ≈ 0.9979, בערך 18 שעות downtime בשנה. הזמינות המורכבת תמיד גרועה מהרכיב הכי חלש."
      }
    },
    {
      q: {
        en: "Your internal SLO for 'send message' is 99.95%. What external SLA should you sign?",
        he: "ה-SLO הפנימי שלך ל'שליחת הודעה' הוא 99.95%. על איזה SLA חיצוני כדאי לחתום?"
      },
      options: [
        { en: "99.99%, to look better than competitors", he: "99.99%, כדי להיראות טוב יותר מהמתחרים" },
        { en: "99.95%, the same as the SLO", he: "99.95%, כמו ה-SLO" },
        { en: "99.9%, lower than the SLO, with defined measurement and credits", he: "99.9%, נמוך מה-SLO, עם מדידה מוגדרת ו-credits" },
        { en: "No number; just 'best effort' for all customers", he: "בלי מספר; 'best effort' לכל הלקוחות" }
      ],
      answer: 2,
      explain: {
        en: "SLA &lt; SLO: the external promise sits below the internal target so a bad month burns error budget and triggers action internally before it triggers credits externally.",
        he: "SLA &lt; SLO: ההבטחה החיצונית נמוכה מהיעד הפנימי, כך שחודש רע שורף error budget ומפעיל תגובה בפנים לפני שהוא מפעיל credits בחוץ."
      }
    },
    {
      q: {
        en: "Which DR strategy fits a tier-2 search service whose index can be rebuilt from the message store (RPO 1 h, RTO 6 h)?",
        he: "איזו אסטרטגיית DR מתאימה לשירות חיפוש ב-tier 2 שאפשר לבנות את האינדקס שלו מחדש ממאגר ההודעות (RPO של שעה, RTO של 6 שעות)?"
      },
      options: [
        { en: "Active-active in three regions", he: "Active-active בשלושה region-ים" },
        { en: "Pilot light: data replicated, compute defined in IaC but off", he: "Pilot light: הנתונים משוכפלים, ה-compute מוגדר ב-IaC אבל כבוי" },
        { en: "No DR at all", he: "בלי DR בכלל" },
        { en: "Warm standby at full production scale", he: "Warm standby בגודל מלא של production" }
      ],
      answer: 1,
      explain: {
        en: "Pilot light meets hours-level RTO at roughly 1.1-1.2x cost. Active-active or full-scale standby would buy minutes of RTO the journey doesn't need.",
        he: "Pilot light עומד ב-RTO של שעות בעלות של בערך פי 1.1 עד 1.2. Active-active או standby בגודל מלא היו קונים RTO של דקות שה-journey לא צריך."
      }
    },
    {
      q: {
        en: "An attacker with admin rights deletes the production message database. Which control actually lets you recover?",
        he: "תוקף עם הרשאות admin מוחק את ה-DB של ההודעות ב-production. איזה מנגנון באמת מאפשר לך להתאושש?"
      },
      options: [
        { en: "Synchronous replication to a second region", he: "רפליקציה סינכרונית ל-region שני" },
        { en: "Three replicas across availability zones", he: "שלושה replicas על פני availability zones" },
        { en: "Immutable (WORM / locked) backups in a separate account with separate credentials, restore-tested", he: "Backups שהם immutable (WORM / נעולים) בחשבון נפרד עם credentials נפרדים, עם restore שנבדק" },
        { en: "The cloud provider's SLA credits", he: "ה-SLA credits של ספק הענן" }
      ],
      answer: 2,
      explain: {
        en: "Replicas and other regions faithfully copy the deletion. Only backups the attacker can't delete or alter, and that you've proven you can restore in a known time, recover the data.",
        he: "Replicas ו-region-ים אחרים מעתיקים בנאמנות גם את המחיקה. רק backups שהתוקף לא יכול למחוק או לשנות, ושהוכחת שאפשר לשחזר אותם בזמן ידוע, מחזירים את הנתונים."
      }
    }
  ],
  playground: "slo",
  related: ["rel-sli-slo-sla", "rel-bcdr", "rel-dr-drills", "rel-chaos-engineering", "rel-capacity-planning", "staff-cells-blast-radius", "pr-third-party-deps", "plan-product-infra-blueprint", "plan-global-traffic"]
});

/* =========================================================================
   Design decision simulator: cloud choice, layout, data, traffic, DR,
   monitoring and validation for a WhatsApp-like product.
   ========================================================================= */
(function () {
  var S = window.INFRA.scenarios;
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  S.push({
    id: "dd-cloud-and-dr-plan",
    kind: "design",
    icon: "💬",
    title: t("Plan the cloud, DR and SLA for a WhatsApp-like product", "לתכנן ענן, DR ו-SLA למוצר דמוי WhatsApp"),
    start: "s1",
    steps: {
      s1: {
        text: t("You're the infra lead for a new messaging app: 1:1 and group chats, media, push notifications. Launch target is 9 months away. The company has a Microsoft Enterprise Agreement and the deck already says 'Azure'. The CEO asks for the infrastructure plan in two weeks. What do you do first?",
                "אתה ה-infra lead של אפליקציית messaging חדשה: צ'אטים אחד על אחד וקבוצות, מדיה, push notifications. ההשקה מתוכננת בעוד 9 חודשים. לחברה יש Enterprise Agreement עם Microsoft והמצגת כבר אומרת 'Azure'. ה-CEO מבקש את תוכנית התשתית בעוד שבועיים. מה אתה עושה קודם?"),
        data: `Draft numbers from product
- 20M registered users, 6M daily active, peak 3M concurrent connections
- Users: 55% EU, 25% Israel, 20% US
- ~2B messages/day  -> avg ~23k msg/s, peak ~150k msg/s
- Media: 15% of messages, avg 300 KB  -> ~90 TB/month new media
- Team: 5 platform/SRE engineers, 25 backend engineers
- Enterprise tier planned for year 2 (business messaging API)`,
        choices: [
          c("Clarify requirements: SLO per journey, data residency, retention, enterprise SLA plans, budget", "להבהיר דרישות: SLO לכל journey, data residency, retention, תוכניות SLA ל-enterprise, תקציב", "s2", 10,
            "Right start. Residency (is EU data allowed outside the EU? Israel?), message retention (stored on server or device-only?), the journey SLOs and whether you'll sign an enterprise SLA decide the region layout, the DR tier and the cost far more than the cloud logo does.",
            "התחלה נכונה. Residency (מותר למידע של EU לצאת מ-EU? ומה עם ישראל?), retention של הודעות (נשמרות בשרת או רק במכשיר?), ה-SLO של כל journey והאם תחתום על SLA ל-enterprise קובעים את פריסת ה-region-ים, את ה-tier של ה-DR ואת העלות הרבה יותר מהלוגו של הענן."),
          c("Start a Kubernetes cluster on Azure and build a prototype", "להרים cluster של Kubernetes ב-Azure ולבנות prototype", "s2", 3,
            "A prototype is useful later, but you'd be locking in region choice, network ranges and data placement before you know the residency rules or the SLO. Those are expensive to change after data exists.",
            "Prototype שימושי בהמשך, אבל היית נועל בחירת region, טווחי רשת ומיקום נתונים לפני שאתה יודע את כללי ה-residency או את ה-SLO. את הדברים האלה יקר לשנות אחרי שיש נתונים."),
          c("Run a 6-week RFP between AWS, Azure and GCP", "להריץ RFP של 6 שבועות בין AWS, Azure ו-GCP", "s2", 4,
            "Comparing clouds without requirements is comparing price lists. You'd also blow the two-week deadline. First get the requirements; the cloud comparison then has criteria to score against.",
            "להשוות עננים בלי דרישות זה להשוות מחירונים. גם היית מפספס את הדד-ליין של שבועיים. קודם הדרישות; אז להשוואה בין העננים יש קריטריונים לתת ציון לפיהם.")
        ]
      },
      s2: {
        text: t("Answers: messages are stored server-side for 30 days (then device-only), EU personal data must stay in the EU, Israeli data may be stored in the EU or Israel. Journey SLOs: send 99.95%, login 99.95%, media 99.5%. The enterprise SLA in year 2 will be 99.9%. Then a twist: Google Cloud offers $3M in credits over 3 years plus a dedicated team, and an engineer argues that Spanner would make a 'global message DB' trivial. Azure under the EA gives ~18% discount on committed spend. What do you decide?",
                "תשובות: הודעות נשמרות בשרת 30 יום (ואחר כך רק במכשיר), מידע אישי של EU חייב להישאר ב-EU, מידע ישראלי יכול להישמר ב-EU או בישראל. SLO לפי journey: שליחה 99.95%, login 99.95%, מדיה 99.5%. ה-SLA ל-enterprise בשנה השנייה יהיה 99.9%. ואז טוויסט: Google Cloud מציעים 3 מיליון דולר ב-credits על פני 3 שנים וצוות ייעודי, ומהנדס טוען ש-Spanner יהפוך 'DB גלובלי להודעות' לטריוויאלי. Azure במסגרת ה-EA נותן הנחה של כ-18% על התחייבות להוצאה. מה אתה מחליט?"),
        data: `Decision scorecard (1-5, weighted)
                         weight  Azure  GCP   Multi-cloud
Team skills (AKS, Entra)   25%     5      2       2
Time to launch (9 mo)      25%     5      3       1
Regions EU/IL/US           15%     5      4       5
Data services fit          15%     4      5       4
3-yr cost after discounts  10%     4      5       2
Exit cost (data gravity)   10%     4      4       3
-> weighted               4.75   3.50    2.40

Data gravity today: 0 TB (pre-launch). In 1 year: ~1 PB media + ~60 TB msgs
Egress if split across clouds: ~$0.05-0.08/GB -> 100 TB/month ~ $5-8k/month`,
        choices: [
          c("Stay on Azure as the single primary cloud; record the GCP option and the switch criteria in an ADR", "להישאר ב-Azure כענן ראשי יחיד; לרשום את האופציה של GCP ואת הקריטריונים למעבר ב-ADR", "s3", 10,
            "Pre-launch, data gravity is zero, so switching is as cheap as it will ever be; the deciding factors are time and skills. The team knows Azure, the EA is signed, Azure has regions in the EU, Israel Central and the US, and Cosmos DB covers the data needs without Spanner. Credits run out in 3 years; operational unfamiliarity doesn't. Writing the criteria down (e.g. 'revisit if we need X') keeps the decision honest.",
            "לפני השקה ה-data gravity הוא אפס, אז מעבר זול כמו שהוא לא יהיה אף פעם; מה שמכריע זה זמן וכישורים. הצוות מכיר Azure, ה-EA חתום, ל-Azure יש region-ים ב-EU, ב-Israel Central ובארה״ב, ו-Cosmos DB מכסה את צורכי הנתונים בלי Spanner. ה-credits נגמרים אחרי 3 שנים; חוסר ההיכרות התפעולית לא. לרשום את הקריטריונים (למשל 'בוחנים מחדש אם נצטרך X') שומר על ההחלטה כנה."),
          c("Switch everything to GCP: the credits are huge and Spanner is better", "לעבור הכול ל-GCP: ה-credits ענקיים ו-Spanner טוב יותר", "s3", 5,
            "Not crazy: before launch, moving costs little and the credits are real. But with 9 months, a team that knows Azure, and Entra ID and the EA already in place, you'd spend months on re-skilling, a new landing zone and IAM. And messaging doesn't need a globally consistent DB: users are homed per region. Decide on fit and time, not on the size of the credit check.",
            "לא מופרך: לפני השקה מעבר עולה מעט וה-credits אמיתיים. אבל עם 9 חודשים, צוות שמכיר Azure, ו-Entra ID וה-EA שכבר קיימים, היית מבזבז חודשים על הסבה מקצועית, landing zone חדש ו-IAM. ו-messaging לא צריך DB עקבי גלובלית: המשתמשים משויכים לפי region. מחליטים לפי התאמה וזמן, לא לפי גודל הצ'ק של ה-credits."),
          c("Go multi-cloud active-active: Azure for the EU, GCP for the US, to avoid lock-in", "Multi-cloud active-active: Azure ל-EU ו-GCP לארה״ב, כדי להימנע מ-lock-in", "s3", 1,
            "This doubles everything a 5-person platform team must build: two IAM models, two networks, two Kubernetes flavors, two monitoring integrations, plus cross-cloud egress on every EU-US message. Lock-in risk is better handled by portable layers (Kubernetes, Postgres/Cassandra APIs, OpenTelemetry, Terraform) than by running two clouds on day one.",
            "זה מכפיל כל דבר שצוות platform של 5 אנשים צריך לבנות: שני מודלים של IAM, שתי רשתות, שני סוגי Kubernetes, שתי אינטגרציות monitoring, ועוד egress בין עננים על כל הודעה בין EU לארה״ב. את הסיכון של lock-in עדיף לנהל עם שכבות ניידות (Kubernetes, APIs של Postgres/Cassandra, OpenTelemetry, Terraform) ולא עם הרצה של שני עננים מהיום הראשון."),
          c("Azure for the app, Spanner on GCP just for messages", "Azure לאפליקציה, Spanner ב-GCP רק בשביל ההודעות", "s3", 2,
            "The hot path (every message write) would cross clouds: 5-20 ms extra per call at best, egress charges on every byte, and two providers' outages in series. 99.95% x 99.99% across clouds, plus the interconnect, is worse than either alone.",
            "המסלול החם (כל כתיבה של הודעה) היה חוצה עננים: תוספת של 5 עד 20ms לכל קריאה במקרה הטוב, תשלום egress על כל byte, והתקלות של שני ספקים בטור. 99.95% כפול 99.99% בין עננים, ועוד ה-interconnect, גרוע מכל אחד מהם לבד.")
        ]
      },
      s3: {
        text: t("Azure it is. How do you lay out subscriptions, clusters and namespaces?",
                "הולכים על Azure. איך אתה מארגן subscriptions, clusters ו-namespaces?"),
        data: `mg-root
 ├─ mg-platform     sub-connectivity (hub VNets, DNS, Front Door)
 │                  sub-management   (monitoring, backup vaults - immutable)
 ├─ mg-nonprod      sub-dev, sub-staging          (1 AKS each)
 └─ mg-prod         sub-prod-weu, sub-prod-neu,
                    sub-prod-ilc, sub-prod-eus     (1 AKS per stamp)
namespaces: msg-gateway (tier 0), msg-store-api (tier 0), media (tier 1),
            push (tier 1), search (tier 2), admin (tier 3)`,
        choices: [
          c("Landing zone: management groups; separate subscriptions per env (dev, staging, prod) and per prod region stamp; one AKS cluster per region stamp; namespaces per service with tier labels", "Landing zone: management groups; subscriptions נפרדים לכל סביבה (dev, staging, prod) ולכל region stamp ב-prod; AKS cluster אחד לכל region stamp; namespace לכל שירות עם label של tier", "s4", 10,
            "Subscriptions are the blast-radius, quota and billing boundary in Azure; separating prod from non-prod and each region stamp keeps a quota exhaustion or a bad IAM change local. A cluster per stamp keeps upgrades and failures regional, and namespaces with tier labels drive policy, alerts and DR tooling.",
            "ב-Azure ה-subscription הוא הגבול של blast radius, quota ו-billing; הפרדה בין prod ל-non-prod ובין כל region stamp משאירה מקומיים quota שנגמרה או שינוי IAM גרוע. Cluster לכל stamp שומר על upgrades וכשלים ברמה האזורית, ו-namespaces עם labels של tier מניעים policy, alerts וכלי DR."),
          c("One subscription and one big AKS cluster; environments as namespaces", "Subscription אחד ו-AKS cluster אחד גדול; הסביבות הן namespaces", "s4", 2,
            "Cheapest to start, but dev and prod share quotas, the control plane, node pools and an upgrade schedule. One bad CRD, one quota hit or one admin mistake takes down production. And a single cluster can't be in three regions.",
            "הכי זול להתחלה, אבל dev ו-prod חולקים quotas, control plane, node pools ולוח זמנים של upgrades. CRD גרוע אחד, quota אחת שנגמרה או טעות admin אחת מפילים את production. וחוץ מזה cluster אחד לא יכול להיות בשלושה region-ים."),
          c("A separate cluster per microservice per environment", "Cluster נפרד לכל microservice בכל סביבה", "s4", 4,
            "Strong isolation, but with 30 services x 3 envs x 4 regions you'd run hundreds of clusters with a 5-person team: upgrades, add-ons and cost (a control plane and system node pool each) would eat the team alive. Isolate by subscription and region; use namespaces, quotas and NetworkPolicy inside.",
            "בידוד חזק, אבל עם 30 שירותים כפול 3 סביבות כפול 4 region-ים היית מריץ מאות clusters עם צוות של 5 אנשים: upgrades, add-ons ועלות (control plane ו-system node pool לכל אחד) היו אוכלים את הצוות. מבודדים לפי subscription ו-region; בפנים משתמשים ב-namespaces, quotas ו-NetworkPolicy.")
        ]
      },
      s4: {
        text: t("Where do messages live? Access pattern: append to a conversation, read 'last 50 messages of conversation X', 30-day TTL, ~150k writes/s at peak, users homed per region.",
                "איפה ההודעות חיות? דפוס הגישה: append לשיחה, קריאה של '50 ההודעות האחרונות בשיחה X', TTL של 30 יום, כ-150k כתיבות בשנייה בשיא, משתמשים משויכים לפי region."),
        data: `Rough sizing
2B msgs/day x 1 KB (with metadata) = 2 TB/day -> 60 TB live at 30-day TTL
x3 replication = 180 TB raw

Cosmos DB (NoSQL API): write 1 KB ~ 5-6 RU -> 150k/s x 6 = ~900k RU/s peak
   autoscale + reserved capacity; per-region accounts for residency
Azure Managed Instance for Apache Cassandra: ~30-40 nodes per big region
Self-hosted ScyllaDB on AKS: ~12-18 nodes per big region, you operate it
Azure SQL Hyperscale: single writer per database -> needs app-level sharding`,
        choices: [
          c("A managed wide-column/document store per region (Cosmos DB or Managed Cassandra), partitioned by conversation_id with time ordering and TTL; a small Azure SQL/Postgres for accounts", "Store מנוהל wide-column/document לכל region (Cosmos DB או Managed Cassandra), עם partition לפי conversation_id, סדר לפי זמן ו-TTL; ו-Azure SQL/Postgres קטן לחשבונות", "s5", 10,
            "Fits the access pattern exactly: one partition read for 'last 50', native TTL for 30-day retention, horizontal write scaling, and per-region deployment for residency. Price it carefully: at ~900k RU/s peak, Cosmos DB needs reserved capacity and autoscale, and Managed Cassandra may be cheaper at this scale. Accounts and billing stay in a strongly consistent relational DB.",
            "מתאים בדיוק לדפוס הגישה: קריאה של partition אחד בשביל '50 האחרונות', TTL מובנה ל-retention של 30 יום, scaling אופקי לכתיבות, ופריסה לכל region בשביל residency. צריך לתמחר בזהירות: ב-900k RU/s בשיא, Cosmos DB צריך reserved capacity ו-autoscale, ו-Managed Cassandra עשוי להיות זול יותר בסדר גודל הזה. חשבונות ו-billing נשארים ב-DB רלציוני עם strong consistency."),
          c("Self-hosted ScyllaDB on AKS: fastest and cheapest per node", "ScyllaDB שאתה מריץ בעצמך על AKS: הכי מהיר והכי זול לכל node", "s5", 6,
            "Technically excellent and often half the node count. But a 5-person platform team now owns repairs, upgrades, backups and 03:00 disk failures for a tier-0 datastore. A reasonable year-2 optimization once the workload is stable; risky as the launch choice.",
            "מצוין טכנית ולרוב חצי ממספר ה-nodes. אבל צוות platform של 5 אנשים הופך לבעלים של repairs, upgrades, backups ותקלות דיסק ב-03:00 של datastore ב-tier 0. אופטימיזציה סבירה לשנה השנייה כשהעומס יציב; מסוכן כבחירה להשקה."),
          c("Azure SQL Hyperscale for everything, the team knows SQL", "Azure SQL Hyperscale לכל דבר, הצוות מכיר SQL", "s5", 3,
            "A single writer per database won't take 150k writes/s; you'd hand-shard dozens of databases, build TTL deletion jobs that hammer the log, and fight hot conversations. Great for accounts, wrong shape for a message log.",
            "Writer יחיד לכל database לא יחזיק 150k כתיבות בשנייה; היית עושה sharding ידני לעשרות databases, בונה jobs למחיקת TTL שמעמיסים על ה-log, ונלחם בשיחות חמות. מעולה לחשבונות, צורה לא נכונה ל-log של הודעות."),
          c("Cosmos DB with multi-region writes replicating all data to all regions", "Cosmos DB עם multi-region writes שמשכפל את כל הנתונים לכל ה-region-ים", "s5", 2,
            "Breaks the EU residency rule (EU messages would sit in the US), and multiplies the RU bill by the number of write regions. Replicate within the allowed geography (e.g. West Europe + North Europe), not everywhere.",
            "שובר את כלל ה-residency של EU (הודעות של EU היו יושבות בארה״ב), ומכפיל את חשבון ה-RU במספר ה-region-ים שכותבים. משכפלים בתוך הגאוגרפיה המותרת (למשל West Europe ו-North Europe), לא לכל מקום.")
        ]
      },
      s5: {
        text: t("Global traffic: clients hold a persistent connection (WebSocket/MQTT over TLS) for hours; REST is used for login, contacts and media URLs; media goes through a CDN. How do you route users to their home region?",
                "Traffic גלובלי: הקליינטים מחזיקים חיבור קבוע (WebSocket/MQTT מעל TLS) לאורך שעות; REST משמש ל-login, אנשי קשר ו-URLs של מדיה; המדיה עוברת דרך CDN. איך אתה מנתב משתמשים ל-region הבית שלהם?"),
        choices: [
          c("Split by traffic type: Azure Front Door (CDN + WAF) for REST and media; persistent connections via a global L4 entry (Azure cross-region Load Balancer, anycast) or DNS (Traffic Manager) to regional L4 load balancers; the login response tells the client its home region", "לפצל לפי סוג traffic: Azure Front Door (עם CDN ו-WAF) ל-REST ולמדיה; את החיבורים הקבועים דרך כניסה גלובלית ב-L4 (Azure cross-region Load Balancer, anycast) או DNS (Traffic Manager) אל load balancers אזוריים ב-L4; תשובת ה-login אומרת לקליינט מה ה-region הבית שלו", "s6", 10,
            "Each path gets the tool built for it. An L7 proxy is ideal for short HTTP requests (WAF, caching, per-request routing) but adds a hop and idle/duration limits to millions of hours-long connections. An L4 anycast or DNS entry to regional gateways keeps connections cheap and lets you drain a region by changing one weight. Returning the home region at login avoids routing EU users to the US just because they're traveling.",
            "כל מסלול מקבל את הכלי שנבנה בשבילו. Proxy ב-L7 אידיאלי לבקשות HTTP קצרות (WAF, caching, routing לפי בקשה) אבל מוסיף hop ומגבלות idle ומשך למיליוני חיבורים שנמשכים שעות. כניסה ב-L4 עם anycast או DNS אל gateways אזוריים שומרת על חיבורים זולים ומאפשרת לנקז region בשינוי של משקל אחד. החזרת ה-region הבית ב-login מונעת ניתוב של משתמשי EU לארה״ב רק כי הם בחו״ל."),
          c("Everything through Azure Front Door", "הכול דרך Azure Front Door", "s6", 5,
            "One front door is simpler and WAF everywhere is nice, but you're pushing millions of long-lived connections through an L7 proxy priced and tuned for requests. Check its WebSocket support, connection limits and the cost per connection-hour before betting tier 0 on it.",
            "כניסה אחת פשוטה יותר ו-WAF בכל מקום זה נחמד, אבל אתה דוחף מיליוני חיבורים ארוכים דרך proxy ב-L7 שמתומחר ומכוונן לבקשות. תבדוק את התמיכה שלו ב-WebSocket, את מגבלות החיבורים ואת העלות לכל שעת חיבור לפני שאתה מהמר עליו עם tier 0."),
          c("DNS geo-routing (Traffic Manager) for everything, TTL 300 s", "DNS geo-routing (Traffic Manager) לכל דבר, TTL של 300 שניות", "s6", 5,
            "Works and is cheap, but no WAF or caching for REST, and failover depends on resolvers honoring TTL; with 300 s (and resolvers that cache longer) a regional failover takes 5-15 minutes for many users. Fine for the connection path with a 30-60 s TTL; weak as the whole answer.",
            "עובד וזול, אבל אין WAF או caching ל-REST, וה-failover תלוי בזה שה-resolvers מכבדים את ה-TTL; עם 300 שניות (ו-resolvers שמחזיקים יותר) failover אזורי לוקח 5 עד 15 דקות להרבה משתמשים. בסדר למסלול החיבורים עם TTL של 30 עד 60 שניות; חלש כתשובה לכל דבר."),
          c("Route every user to the nearest region regardless of home region", "לנתב כל משתמש ל-region הכי קרוב, בלי קשר ל-region הבית", "s6", 3,
            "Nearest isn't home: an EU user in New York lands in the US region, where their data isn't (residency), and every message becomes a cross-region call. Route by identity (home region); use proximity only for the edge.",
            "הכי קרוב זה לא הבית: משתמש EU בניו יורק נוחת ב-region בארה״ב, שבו הנתונים שלו לא נמצאים (residency), וכל הודעה הופכת לקריאה בין region-ים. מנתבים לפי זהות (region הבית), ומשתמשים בקרבה רק ל-edge.")
        ]
      },
      s6: {
        text: t("DR and the promise. Finance asks: 'Can we just go active-active everywhere and sell 99.99%?' Your composite math for the send path, after moving push off the synchronous path, is ~99.88% per region before cross-region redundancy. What's the plan?",
                "DR וההבטחה. ה-Finance שואלים: 'אפשר פשוט active-active בכל מקום ולמכור 99.99%?' החשבון שלך למסלול השליחה, אחרי שהוצאת את ה-push מהמסלול הסינכרוני, יוצא בערך 99.88% לכל region לפני redundancy בין region-ים. מה התוכנית?"),
        data: `Send path per region (serial):
  LB 99.99 x AKS 99.95 x Cosmos 99.99 x gateway svc 99.95 = ~99.88%
  push provider moved off the sync path (queued)

Tier plan                       RPO      RTO      cost vs 1 region
T0 gateway, send, identity      ~0-5 s   15 min   x2.0 (paired region)
T1 media, push, groups          5 min    1 h      x1.4 (warm standby)
T2 search, previews             1 h      6 h      x1.15 (pilot light)
T3 BI, admin                    24 h     48 h     x1.03 (backup/restore)

Region pairs: West Europe <-> North Europe (EU data stays in EU),
              Israel Central -> West Europe, East US <-> West US 3`,
        choices: [
          c("Tier the services as above; internal SLO 99.95% for send/login; sign a 99.9% enterprise SLA with credits; immutable backups in a separate subscription; quarterly DR drills", "לסווג את השירותים לפי tiers כמו למעלה; SLO פנימי של 99.95% לשליחה ול-login; לחתום על SLA של 99.9% ל-enterprise עם credits; immutable backups ב-subscription נפרד; DR drill-ים כל רבעון", "s7", 10,
            "This spends money where the journey needs it: tier 0 in region pairs within the allowed geography, cheaper strategies for the rest. SLA below SLO gives you margin, and immutable backups cover what replication can't (corruption, ransomware). The drill turns a 15-minute RTO from a wish into a number.",
            "ככה שמים כסף איפה שה-journey צריך: tier 0 בזוגות region-ים בתוך הגאוגרפיה המותרת, ואסטרטגיות זולות יותר לשאר. SLA מתחת ל-SLO נותן מרווח, ו-immutable backups מכסים את מה שרפליקציה לא מכסה (השחתה, ransomware). ה-drill הופך RTO של 15 דקות ממשאלה למספר."),
          c("Active-active for every service in every region and sell 99.99%", "Active-active לכל שירות בכל region ולמכור 99.99%", "s7", 3,
            "Roughly doubles the bill for BI and admin tools nobody needs at 3 a.m., and 99.99% means 4.3 minutes a month with no human in the loop, which you haven't proven. Correlated failures (bad config, bad release) hit all regions anyway.",
            "בערך מכפיל את החשבון בשביל BI וכלי admin שאף אחד לא צריך ב-3 בלילה, ו-99.99% אומר 4.3 דקות בחודש בלי בן אדם בלולאה, משהו שעוד לא הוכחת. כשלים מתואמים (config גרוע, release גרוע) פוגעים בכל ה-region-ים בכל מקרה."),
          c("Single region per geography with zone redundancy and nightly backups; promise 99.95% because Azure promises 99.99% on zonal VMs", "Region אחד לכל גאוגרפיה עם zone redundancy ו-backups כל לילה; להבטיח 99.95% כי Azure מבטיח 99.99% על VMs ב-zones", "s7", 2,
            "The cloud SLA is for one component and pays credits, not uptime. Your composite is ~99.88%, so 99.95% is missed on paper on day one, and a region outage means hours down with a 24 h RPO for messages.",
            "ה-SLA של הענן הוא לרכיב אחד ומשלם credits, לא uptime. הזמינות המורכבת שלך היא בערך 99.88%, אז 99.95% מפוספס על הנייר כבר ביום הראשון, ונפילה של region אומרת שעות למטה עם RPO של 24 שעות להודעות.")
        ]
      },
      s7: {
        text: t("Monitoring and observability. ~400 nodes across 4 prod clusters, ~30 services, ~6 TB/day of logs before filtering, 5 platform/SRE engineers. What stack?",
                "Monitoring ו-observability. כ-400 nodes על פני 4 clusters ב-prod, כ-30 שירותים, כ-6TB לוגים ביום לפני סינון, 5 מהנדסי platform/SRE. איזה stack?"),
        data: `Rough monthly list prices (check current pricing; discounts vary)
Datadog: infra ~$15-23/host + APM ~$31-40/host + logs ~$0.10/GB ingest
         + ~$1.70 per 1M indexed events (15-day)
   400 hosts infra+APM ~ $20k; 180 TB logs ingest ~ $18k; indexing extra
Azure Monitor: Log Analytics ~$2.3-2.8/GB (analytics), Basic/Aux logs much less
   managed Prometheus ~$0.16 per 10M samples; Managed Grafana per instance/user
   180 TB/month to Analytics logs ~ $400k+  -> must filter and tier
Self-hosted (Prometheus/VictoriaMetrics + Grafana + Loki on object storage):
   ~20-30 nodes + blob storage ~ $8-15k, plus 1-2 engineers' time`,
        choices: [
          c("OpenTelemetry everywhere; Azure Managed Prometheus + Managed Grafana for metrics; logs filtered at the collector and tiered (cheap logs tier or Loki/ADX on blob); traces sampled; revisit Datadog/self-hosted with real volumes in 6 months", "OpenTelemetry בכל מקום; Azure Managed Prometheus ו-Managed Grafana ל-metrics; לוגים מסוננים ב-collector ומחולקים ל-tiers (tier לוגים זול או Loki/ADX על blob); traces עם sampling; לבחון מחדש Datadog או self-hosted עם נפחים אמיתיים בעוד 6 חודשים", "s8", 10,
            "Managed metrics avoid running Prometheus HA yourself with 5 people, OTel keeps you portable between backends, and cutting logs at the source is the biggest cost lever (most of 6 TB/day is debug noise). You make the expensive decision later with measured volumes instead of guesses.",
            "Metrics מנוהלים חוסכים להריץ Prometheus ב-HA בעצמך עם 5 אנשים, OTel שומר אותך נייד בין backends, וחיתוך לוגים במקור הוא מנוף העלות הכי גדול (רוב ה-6TB ביום זה רעש debug). את ההחלטה היקרה מקבלים אחר כך, עם נפחים מדודים במקום ניחושים."),
          c("Datadog for everything: best UX, fastest to value", "Datadog לכל דבר: ה-UX הכי טוב, הכי מהר לערך", "s8", 6,
            "Genuinely fast and loved by engineers, and a fair choice for a small team. But at 400 hosts plus unfiltered logs, the bill can pass $40-60k/month and grows with every node and custom metric. If you pick it, budget it explicitly and filter logs from day one.",
            "באמת מהיר ומהנדסים אוהבים אותו, ובחירה הוגנת לצוות קטן. אבל ב-400 hosts ועם לוגים לא מסוננים, החשבון יכול לעבור 40 עד 60 אלף דולר בחודש ולגדול עם כל node וכל custom metric. אם בוחרים בו, מתקצבים במפורש ומסננים לוגים מהיום הראשון."),
          c("Self-host Prometheus, VictoriaMetrics, Grafana, Loki and Tempo: cheapest", "Self-hosted ל-Prometheus, VictoriaMetrics, Grafana, Loki ו-Tempo: הכי זול", "s8", 5,
            "Cheapest on the invoice and fully portable, but your monitoring is now a tier-0 system run by the same 5 people, and it must survive the outages it's supposed to show you. Worth it at bigger scale or with a dedicated observability team.",
            "הכי זול בחשבונית ונייד לגמרי, אבל עכשיו ה-monitoring שלך הוא מערכת tier 0 שאותם 5 אנשים מריצים, והיא צריכה לשרוד את התקלות שהיא אמורה להראות לך. משתלם בסדר גודל גדול יותר או עם צוות observability ייעודי."),
          c("Send all logs to the Log Analytics analytics tier with full retention", "לשלוח את כל הלוגים ל-tier ה-analytics של Log Analytics עם retention מלא", "s8", 1,
            "At ~180 TB/month that's on the order of $400k a month just to ingest logs nobody reads. Logs need filtering, sampling and a cheaper tier for bulk data.",
            "בסביבות 180TB בחודש, זה בסדר גודל של 400 אלף דולר בחודש רק כדי לקלוט לוגים שאף אחד לא קורא. לוגים צריכים סינון, sampling ו-tier זול יותר לנתונים בכמויות.")
        ]
      },
      s8: {
        text: t("Six weeks before launch. How do you prove the plan works?",
                "שישה שבועות לפני ההשקה. איך אתה מוכיח שהתוכנית עובדת?"),
        choices: [
          c("Load test at 2x peak plus a reconnect storm, 24 h soak, chaos (Pod kill, zone blackhole via Chaos Studio, latency to Cosmos/push), a region failover drill with measured RTO/RPO, a restore test, an unannounced game day, then a signed PRR", "Load test בפי 2 מהשיא ועוד סערת reconnect, soak של 24 שעות, chaos (הריגת Pods, zone blackhole דרך Chaos Studio, latency ל-Cosmos ול-push), drill של region failover עם RTO/RPO מדודים, בדיקת restore, game day לא מוכרז, ואז PRR חתום", "win", 10,
            "Every number in the plan gets measured once before users measure it for you. The drill will surface the missing quota or IAM role; that's the point.",
            "כל מספר בתוכנית נמדד פעם אחת לפני שהמשתמשים ימדדו אותו בשבילך. ה-drill יחשוף את ה-quota או ה-IAM role החסרים; זו כל המטרה."),
          c("Trust the cloud SLAs and the architecture review; launch and watch the dashboards", "לסמוך על ה-SLA של הענן ועל ה-architecture review; להשיק ולהסתכל על ה-dashboards", "lose", 0,
            "An architecture review checks the drawing, not the system. Untested failover, quota and restore paths are exactly what fails first in production.",
            "Architecture review בודק את הציור, לא את המערכת. מסלולי failover, quota ו-restore שלא נבדקו הם בדיוק מה שנכשל ראשון ב-production."),
          c("Only a load test at the expected peak", "רק load test בשיא הצפוי", "lose", 3,
            "Necessary but not sufficient: it says nothing about zone or region loss, restore time, reconnect storms or whether on-call can follow the runbook. And at 1x peak you have no evidence of headroom.",
            "הכרחי אבל לא מספיק: הוא לא אומר כלום על אובדן zone או region, זמן restore, סערות reconnect או האם ה-on-call מסוגל לעבוד לפי ה-runbook. ובפי 1 מהשיא אין לך שום הוכחה למרווח.")
        ]
      },
      win: {
        text: t("✅ Plan approved. Azure as the single primary cloud (decision and exit criteria in an ADR); a landing zone with subscriptions per env and per region stamp, one AKS cluster per stamp; messages in a managed per-region wide-column/document store with 30-day TTL, accounts in a small relational DB; Front Door for REST/media and an L4 global entry for persistent connections, users routed to their home region; services tiered 0-3 with matching DR, internal SLO 99.95% and a 99.9% enterprise SLA with credits; immutable backups; OTel with managed Prometheus/Grafana and tiered logs; and every RTO/RPO measured in a drill before launch.",
                "✅ התוכנית אושרה. Azure כענן ראשי יחיד (ההחלטה וקריטריוני היציאה ב-ADR); landing zone עם subscriptions לכל סביבה ולכל region stamp, ו-AKS cluster אחד לכל stamp; הודעות ב-store מנוהל wide-column/document לכל region עם TTL של 30 יום, חשבונות ב-DB רלציוני קטן; Front Door ל-REST ולמדיה וכניסה גלובלית ב-L4 לחיבורים הקבועים, כשכל משתמש מנותב ל-region הבית שלו; שירותים מסווגים ל-tiers 0 עד 3 עם DR תואם, SLO פנימי של 99.95% ו-SLA של 99.9% ל-enterprise עם credits; immutable backups; OTel עם Prometheus/Grafana מנוהלים ולוגים ב-tiers; וכל RTO ו-RPO נמדד ב-drill לפני ההשקה."),
        end: "win"
      },
      lose: {
        text: t("💥 Launch week: a zone in West Europe degrades. Failover to North Europe stalls for 50 minutes on a vCPU quota nobody raised, the reconnect storm overloads the remaining gateways, and the first restore attempt takes 7 hours. Lesson: the plan is only as real as the last drill that measured it.",
                "💥 שבוע ההשקה: zone ב-West Europe מתדרדר. ה-failover ל-North Europe נתקע ל-50 דקות על quota של vCPU שאף אחד לא העלה, סערת ה-reconnect מעמיסה את ה-gateways שנשארו, והניסיון הראשון ל-restore לוקח 7 שעות. הלקח: התוכנית אמיתית רק כמו ה-drill האחרון שמדד אותה."),
        end: "lose"
      }
    },
    lessons: ["plan-failure-sla", "plan-cloud-selection", "rel-sli-slo-sla", "rel-bcdr", "rel-dr-drills", "rel-chaos-engineering", "staff-cells-blast-radius", "pr-third-party-deps"]
  });
})();
