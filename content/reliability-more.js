window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================
   Track: reliability (more) + observability
   DR drills, certificate operations, incident comms,
   dependency analysis / SPOFs, profiling & synthetics
   ========================================================= */

INFRA.lessons.push({
  id: "rel-dr-drills",
  track: "reliability",
  order: 30,
  icon: "🧯",
  level: 3,
  minutes: 14,
  title: { en: "DR Drills & Game Days", he: "DR Drills ו-Game Days – לתרגל את היום הגרוע" },
  tldr: {
    en: "A DR plan you have never executed is a hypothesis, not a plan: drills turn RPO/RTO from slideware into measured numbers and surface the missing IAM role, the exhausted quota and the hardcoded endpoint before a real disaster does.",
    he: "תוכנית DR שאף פעם לא הרצת היא השערה, לא תוכנית: drill-ים הופכים את ה-RPO/RTO משקף במצגת למספר מדוד, ומוציאים לאור את ה-IAM role החסר, ה-quota שנגמרה וה-endpoint הקשיח לפני שאסון אמיתי עושה את זה."
  },
  analogy: {
    en: "A fire drill in an office building. Everyone 'knows' where the stairs are, until the drill reveals the emergency door is locked, the assembly point is a construction site and nobody knows who counts heads. Nobody blames the people; you fix the door. The drill is cheap; discovering the locked door during a real fire is not.",
    he: "תרגיל כיבוי אש בבניין משרדים. כולם 'יודעים' איפה המדרגות, עד שהתרגיל מגלה שדלת החירום נעולה, נקודת הכינוס היא אתר בנייה ואף אחד לא יודע מי סופר את האנשים. לא מאשימים אף אחד; מתקנים את הדלת. התרגיל זול; לגלות את הדלת הנעולה בשריפה אמיתית — לא."
  },
  sections: [
    {
      h: { en: "Planning a drill: scope, hypothesis, abort criteria, comms", he: "תכנון drill: scope, השערה, תנאי עצירה ותקשורת" },
      body: {
        en: `<p>A drill is an experiment, so write it down like one (one page is enough) and get it reviewed a week before:</p>
<table><tr><th>Field</th><th>Example</th></tr>
<tr><td>Scope</td><td>checkout + payments + their Aurora cluster, eu-west-1 → eu-central-1. Out of scope: analytics, internal tools.</td></tr>
<tr><td>Hypothesis</td><td>"We can serve checkout from eu-central-1 within RTO 30 min with RPO ≤ 5 s, using only the runbook."</td></tr>
<tr><td>Success metrics</td><td>RTO measured from T0 (declare) to SLO-good traffic in DR; RPO from heartbeat table; # runbook deviations.</td></tr>
<tr><td>Abort criteria</td><td>checkout success rate &lt; 97% for 5 min, or p99 &gt; 2 s for 10 min, or any data integrity alarm → roll back immediately.</td></tr>
<tr><td>Roles</td><td>Drill lead (IC), operator(s), scribe with timestamps, observer from another team, comms owner.</td></tr>
<tr><td>Comms</td><td>Announce in #eng + status page "scheduled maintenance" for customer-visible drills; tell support; tell the cloud TAM for big ones.</td></tr>
<tr><td>Rollback plan</td><td>Tested fail-back path. If you can't fail back, it's not a drill, it's a migration.</td></tr></table>
<p>The golden rule: <strong>operators follow only the written runbook</strong>. Every time someone says "oh, you also need to..." the scribe writes a finding. Tribal knowledge is exactly what a real disaster at 03:00 won't have.</p>
<blockquote>⚠️ Production tip: pick the operator who did <em>not</em> write the runbook — ideally the newest person on the rotation. If they can do it, the runbook works.</blockquote>`,
        he: `<p>Drill הוא ניסוי, אז כותבים אותו כמו ניסוי (עמוד אחד מספיק) ומעבירים review שבוע לפני:</p>
<table><tr><th>שדה</th><th>דוגמה</th></tr>
<tr><td>Scope</td><td>checkout ו-payments עם ה-Aurora cluster שלהם, מ-eu-west-1 ל-eu-central-1. מחוץ ל-scope: analytics, כלים פנימיים.</td></tr>
<tr><td>השערה</td><td>"אנחנו יכולים להגיש checkout מ-eu-central-1 תוך RTO של 30 דקות עם RPO של עד 5 שניות, רק לפי ה-runbook."</td></tr>
<tr><td>מדדי הצלחה</td><td>RTO נמדד מ-T0 (הכרזה) ועד traffic תקין לפי ה-SLO ב-DR; RPO מטבלת heartbeat; מספר הסטיות מה-runbook.</td></tr>
<tr><td>תנאי עצירה</td><td>success rate של checkout מתחת ל-97% במשך 5 דקות, או p99 מעל 2 שניות במשך 10 דקות, או כל alarm של שלמות נתונים — חוזרים אחורה מיד.</td></tr>
<tr><td>תפקידים</td><td>מוביל ה-drill (IC), operators, scribe שרושם זמנים, observer מצוות אחר, אחראי תקשורת.</td></tr>
<tr><td>תקשורת</td><td>הודעה ב-#eng ו-"scheduled maintenance" ב-status page כשהלקוחות עלולים להרגיש; עדכון ל-support; ל-drill-ים גדולים גם ל-TAM של ספק הענן.</td></tr>
<tr><td>תוכנית חזרה</td><td>מסלול fail-back שנבדק. אם אי אפשר לחזור, זה לא drill — זו מיגרציה.</td></tr></table>
<p>חוק הזהב: <strong>ה-operators עובדים רק לפי ה-runbook הכתוב</strong>. כל פעם שמישהו אומר "אה, צריך גם..." ה-scribe רושם finding. ידע שבטי זה בדיוק מה שלא יהיה זמין באסון אמיתי ב-03:00.</p>
<blockquote>⚠️ Production tip: תבחר operator שלא כתב את ה-runbook — עדיף את האדם הכי חדש ב-rotation. אם הוא מצליח, ה-runbook עובד.</blockquote>`
      }
    },
    {
      h: { en: "A region failover drill, step by step", he: "Drill של region failover, צעד אחר צעד" },
      body: {
        en: `<p>A typical warm-standby drill on AWS (same shape on GCP/Azure, different CLI):</p>
<ol>
<li><strong>T-60 min — pre-checks.</strong> DR replication lag healthy, DR capacity/quotas OK, on-call and DB owner present, abort dashboard open.</li>
<li><strong>T0 — declare.</strong> Scribe writes the timestamp. This is where RTO starts, not when the first command runs.</li>
<li><strong>Freeze writes in primary</strong> (feature flag / maintenance mode) for a planned drill, so you measure a clean RPO.</li>
<li><strong>Promote the database.</strong> Planned: switchover (no data loss). Real disaster simulation: failover with data loss allowed.</li>
<li><strong>Scale DR compute</strong> from pilot size to production size (this is where quotas bite).</li>
<li><strong>Shift traffic</strong> — DNS weights, Route 53 ARC routing control, or global LB backend change.</li>
<li><strong>Verify</strong> with synthetic checks + real traffic SLIs, not "the pods are Running".</li>
<li><strong>Soak</strong> 30-60 min in DR (catches cron jobs, batch, cache warmup, cert and secret issues).</li>
<li><strong>Fail back</strong> using the same discipline. Fail-back is often harder: the old primary must resync.</li>
</ol>
<pre># Aurora Global Database
# planned drill: no data loss, waits for replicas to catch up
aws rds switchover-global-cluster \\
  --global-cluster-identifier shop-global \\
  --target-db-cluster-identifier arn:aws:rds:eu-central-1:111122223333:cluster:shop-dr

# simulating a real regional loss: accept the replication lag as data loss
aws rds failover-global-cluster \\
  --global-cluster-identifier shop-global \\
  --target-db-cluster-identifier arn:aws:rds:eu-central-1:111122223333:cluster:shop-dr \\
  --allow-data-loss

# flip traffic with Route 53 Application Recovery Controller
aws route53-recovery-cluster update-routing-control-state \\
  --routing-control-arn arn:aws:route53-recovery-control::111122223333:controlpanel/abc/routingcontrol/eu-west-1 \\
  --routing-control-state Off --endpoint-url https://&lt;cluster-endpoint&gt;/v1 --region eu-central-1</pre>
<blockquote>💡 Real world: Route 53 ARC's data plane is spread over five regional endpoints precisely so you can flip traffic while the Route 53 control plane (homed in us-east-1) is impaired. Keep the cluster endpoints in the runbook — you won't be able to look them up in a console that's down.</blockquote>`,
        he: `<p>Drill טיפוסי של warm standby ב-AWS (אותו מבנה ב-GCP וב-Azure, CLI אחר):</p>
<ol>
<li><strong>T-60 דקות — בדיקות מקדימות.</strong> replication lag ל-DR תקין, capacity ו-quotas ב-DR בסדר, ה-on-call ובעל ה-DB זמינים, דשבורד העצירה פתוח.</li>
<li><strong>T0 — הכרזה.</strong> ה-scribe רושם את השעה. מכאן מתחיל ה-RTO, לא מהפקודה הראשונה.</li>
<li><strong>הקפאת כתיבות ב-primary</strong> (feature flag או maintenance mode) ב-drill מתוכנן, כדי למדוד RPO נקי.</li>
<li><strong>Promote ל-DB.</strong> מתוכנן: switchover (בלי איבוד מידע). סימולציה של אסון אמיתי: failover עם איבוד מידע מותר.</li>
<li><strong>Scale ל-compute ב-DR</strong> מגודל pilot לגודל production (פה ה-quotas נושכים).</li>
<li><strong>העברת traffic</strong> — משקלי DNS, routing control של Route 53 ARC, או שינוי backend ב-global LB.</li>
<li><strong>אימות</strong> עם synthetic checks ו-SLI-ים של traffic אמיתי, לא "ה-Pod-ים ב-Running".</li>
<li><strong>Soak</strong> של 30-60 דקות ב-DR (תופס cron jobs, batch, חימום cache, בעיות cert ו-secret).</li>
<li><strong>Fail back</strong> באותה משמעת. fail-back הוא לרוב קשה יותר: ה-primary הישן צריך להסתנכרן מחדש.</li>
</ol>
<pre># Aurora Global Database
# planned drill: no data loss, waits for replicas to catch up
aws rds switchover-global-cluster \\
  --global-cluster-identifier shop-global \\
  --target-db-cluster-identifier arn:aws:rds:eu-central-1:111122223333:cluster:shop-dr

# simulating a real regional loss: accept the replication lag as data loss
aws rds failover-global-cluster \\
  --global-cluster-identifier shop-global \\
  --target-db-cluster-identifier arn:aws:rds:eu-central-1:111122223333:cluster:shop-dr \\
  --allow-data-loss

# flip traffic with Route 53 Application Recovery Controller
aws route53-recovery-cluster update-routing-control-state \\
  --routing-control-arn arn:aws:route53-recovery-control::111122223333:controlpanel/abc/routingcontrol/eu-west-1 \\
  --routing-control-state Off --endpoint-url https://&lt;cluster-endpoint&gt;/v1 --region eu-central-1</pre>
<blockquote>💡 Real world: ה-data plane של Route 53 ARC פרוס על חמישה endpoints אזוריים בדיוק כדי שתוכל להעביר traffic גם כשה-control plane של Route 53 (שיושב ב-us-east-1) בבעיה. תשמור את ה-cluster endpoints בתוך ה-runbook — לא תוכל לחפש אותם בקונסולה שלא עובדת.</blockquote>`
      }
    },
    {
      h: { en: "Measuring real RPO and RTO", he: "למדוד RPO ו-RTO אמיתיים" },
      body: {
        en: `<p>"Aurora Global lag is usually under a second" is a vendor number. Your RPO is what <em>your</em> data shows after the drill. The trick is a <strong>heartbeat writer</strong>:</p>
<pre>-- primary: a tiny job writes one row per second
CREATE TABLE dr_heartbeat (id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now());
-- every 1s:  INSERT INTO dr_heartbeat DEFAULT VALUES;

-- after failover, in the promoted DR database:
SELECT max(ts) AS last_replicated FROM dr_heartbeat;
-- RPO = (time primary was cut off) - last_replicated</pre>
<p>RTO is a timeline from the scribe's log, broken into phases so you know what to optimize:</p>
<table><tr><th>Phase</th><th>Drill #1</th><th>Drill #3</th></tr>
<tr><td>Detect + decide to fail over</td><td>18 min</td><td>6 min</td></tr>
<tr><td>DB promotion</td><td>2 min</td><td>1.5 min</td></tr>
<tr><td>Scale compute (pilot → full)</td><td>21 min (quota request!)</td><td>7 min</td></tr>
<tr><td>Traffic shift + DNS convergence</td><td>14 min</td><td>4 min</td></tr>
<tr><td>Verification to SLO-good</td><td>9 min</td><td>5 min</td></tr>
<tr><td><strong>Total RTO</strong></td><td><strong>64 min</strong> (target 30)</td><td><strong>23.5 min</strong></td></tr></table>
<p>Notice the biggest chunk is usually <strong>the human decision</strong>, not the tech. Pre-agreed failover criteria ("if region X has &gt;50% errors for 15 min and AWS Health confirms, IC may fail over without VP approval") cut it dramatically.</p>
<blockquote>💡 Real world: also measure <em>RPO for every data store</em>, not just the main DB: S3 Cross-Region Replication (without RTC, most objects replicate in seconds but there is no SLA; with Replication Time Control, 99.99% within 15 min), Redis, Kafka MirrorMaker offsets, search indexes. The one nobody measured is the one that's 6 hours behind.</blockquote>`,
        he: `<p>"ה-lag של Aurora Global בדרך כלל מתחת לשנייה" זה מספר של הספק. ה-RPO שלך הוא מה שה-data <em>שלך</em> מראה אחרי ה-drill. הטריק הוא <strong>heartbeat writer</strong>:</p>
<pre>-- primary: a tiny job writes one row per second
CREATE TABLE dr_heartbeat (id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now());
-- every 1s:  INSERT INTO dr_heartbeat DEFAULT VALUES;

-- after failover, in the promoted DR database:
SELECT max(ts) AS last_replicated FROM dr_heartbeat;
-- RPO = (time primary was cut off) - last_replicated</pre>
<p>ה-RTO הוא ציר זמן מהלוג של ה-scribe, מפורק לשלבים כדי שתדע מה לשפר:</p>
<table><tr><th>שלב</th><th>Drill #1</th><th>Drill #3</th></tr>
<tr><td>זיהוי + החלטה לעשות failover</td><td>18 דק'</td><td>6 דק'</td></tr>
<tr><td>Promotion של ה-DB</td><td>2 דק'</td><td>1.5 דק'</td></tr>
<tr><td>Scale ל-compute (מ-pilot למלא)</td><td>21 דק' (בקשת quota!)</td><td>7 דק'</td></tr>
<tr><td>העברת traffic והתכנסות DNS</td><td>14 דק'</td><td>4 דק'</td></tr>
<tr><td>אימות עד מצב תקין לפי SLO</td><td>9 דק'</td><td>5 דק'</td></tr>
<tr><td><strong>RTO כולל</strong></td><td><strong>64 דק'</strong> (יעד 30)</td><td><strong>23.5 דק'</strong></td></tr></table>
<p>שים לב שהחתיכה הכי גדולה היא בדרך כלל <strong>ההחלטה האנושית</strong>, לא הטכנולוגיה. קריטריונים מוסכמים מראש ("אם ב-region X יש מעל 50% שגיאות במשך 15 דקות ו-AWS Health מאשר, ה-IC רשאי לעשות failover בלי אישור VP") מקצרים את זה דרמטית.</p>
<blockquote>💡 Real world: תמדוד <em>RPO לכל data store</em>, לא רק ל-DB הראשי: S3 Cross-Region Replication (בלי RTC רוב האובייקטים משוכפלים תוך שניות אבל אין SLA; עם Replication Time Control — 99.99% תוך 15 דקות), Redis, offsets של Kafka MirrorMaker, אינדקסים של search. זה שאף אחד לא מדד הוא זה שמפגר ב-6 שעות.</blockquote>`
      }
    },
    {
      h: { en: "Tabletop vs live, and what drills always find", he: "Tabletop מול live, ומה drill-ים תמיד מגלים" },
      body: {
        en: `<table><tr><th></th><th>Tabletop</th><th>Live (component)</th><th>Live (full region)</th></tr>
<tr><td>What</td><td>Walk through the runbook in a room: "region is gone, what do you do?"</td><td>Fail over one service or DB for real</td><td>Move production traffic to the DR region</td></tr>
<tr><td>Cost / risk</td><td>2 hours, zero risk</td><td>Low-medium</td><td>High, needs exec sign-off</td></tr>
<tr><td>Finds</td><td>Missing roles, unclear decisions, comms gaps</td><td>Technical gaps in one path</td><td>Everything, including the unknown unknowns</td></tr></table>
<p>The classic discoveries (every company finds at least three on its first live drill):</p>
<ul>
<li><strong>IAM in the DR region</strong> — the role, KMS key policy or secret exists only in the primary region. KMS keys are regional; a snapshot encrypted with a primary-region key can't be restored without a multi-Region key or re-encryption.</li>
<li><strong>Quotas</strong> — DR account has the default vCPU quota (e.g., a few hundred vCPUs for On-Demand Standard instances) while production needs 2,000. Quota increases can take hours to days.</li>
<li><strong>DNS TTL</strong> — the record's TTL is 300 s, but clients cache longer: JVMs with a security manager cache forever by default, some SDKs pin connections, and connection pools keep talking to the old IPs until they're recycled.</li>
<li><strong>Hardcoded endpoints</strong> — <code>eu-west-1</code> in a config map, an S3 bucket name, a third-party allow-list with only primary NAT IPs.</li>
<li><strong>Stale images and AMIs</strong> — the DR region's ECR replica or AMI copy is three months old.</li>
<li><strong>Certificates</strong> — the ACM certificate was issued only in the primary region (ACM certs are regional).</li>
<li><strong>Runbook rot</strong> — commands reference a tool that was replaced a year ago.</li>
</ul>
<blockquote>⚠️ Production tip: a finding without an owner and a date is a wish. Every drill ends with tickets, and the next drill's first checklist item is "verify all previous findings are closed".</blockquote>`,
        he: `<table><tr><th></th><th>Tabletop</th><th>Live (רכיב)</th><th>Live (region מלא)</th></tr>
<tr><td>מה</td><td>עוברים על ה-runbook בחדר: "ה-region נעלם, מה אתה עושה?"</td><td>failover אמיתי לשירות או DB אחד</td><td>מעבירים traffic של production ל-region ה-DR</td></tr>
<tr><td>עלות / סיכון</td><td>שעתיים, אפס סיכון</td><td>נמוך-בינוני</td><td>גבוה, צריך אישור הנהלה</td></tr>
<tr><td>מגלה</td><td>תפקידים חסרים, החלטות לא ברורות, חורים בתקשורת</td><td>פערים טכניים במסלול אחד</td><td>הכל, כולל ה-unknown unknowns</td></tr></table>
<p>הממצאים הקלאסיים (כל חברה מוצאת לפחות שלושה ב-live drill הראשון):</p>
<ul>
<li><strong>IAM ב-region ה-DR</strong> — ה-role, ה-key policy של KMS או ה-secret קיימים רק ב-region הראשי. מפתחות KMS הם אזוריים; snapshot שהוצפן עם מפתח של ה-region הראשי לא ישוחזר בלי multi-Region key או הצפנה מחדש.</li>
<li><strong>Quotas</strong> — לחשבון ה-DR יש quota ברירת מחדל של vCPU (למשל כמה מאות vCPU ל-On-Demand Standard) כש-production צריך 2,000. הגדלת quota יכולה לקחת שעות עד ימים.</li>
<li><strong>DNS TTL</strong> — ה-TTL של הרשומה הוא 300 שניות, אבל לקוחות שומרים יותר: JVM עם security manager שומר לנצח כברירת מחדל, חלק מה-SDK-ים מצמידים connections, ו-connection pools ממשיכים לדבר עם ה-IP-ים הישנים עד שממחזרים אותם.</li>
<li><strong>Endpoints קשיחים</strong> — <code>eu-west-1</code> בתוך config map, שם של S3 bucket, allow-list אצל צד שלישי עם רק כתובות ה-NAT של ה-primary.</li>
<li><strong>Images ו-AMI-ים ישנים</strong> — ה-replica של ECR או העותק של ה-AMI ב-region ה-DR בן שלושה חודשים.</li>
<li><strong>Certificates</strong> — ה-certificate של ACM הונפק רק ב-region הראשי (certificates של ACM הם אזוריים).</li>
<li><strong>Runbook rot</strong> — הפקודות מפנות לכלי שהוחלף לפני שנה.</li>
</ul>
<blockquote>⚠️ Production tip: finding בלי owner ותאריך הוא משאלה. כל drill נגמר עם tickets, והסעיף הראשון ב-checklist של ה-drill הבא הוא "לוודא שכל הממצאים הקודמים נסגרו".</blockquote>`
      }
    },
    {
      h: { en: "Cadence and reporting", he: "תדירות ודיווח" },
      body: {
        en: `<p>A sustainable program for a mid-size company:</p>
<ul>
<li><strong>Monthly</strong>: one component drill (restore a DB backup to a scratch instance and checksum it; fail over one Redis; rotate one secret).</li>
<li><strong>Quarterly</strong>: tabletop with a new scenario (ransomware, cloud account compromise, SaaS auth provider down) + one live service-level failover.</li>
<li><strong>Once or twice a year</strong>: full region failover, ideally running in DR for a day or more.</li>
<li><strong>After every major architecture change</strong>: re-drill the affected path.</li>
</ul>
<p>The drill report (one page, goes to engineering leadership and, for SOC 2 / ISO 27001 / DORA, to auditors):</p>
<pre>DR Drill 2026-Q4 — checkout, eu-west-1 → eu-central-1
Hypothesis: RTO ≤ 30 min, RPO ≤ 5 s            Result: PARTIAL
Measured:  RTO 41 min (target 30)   RPO 1.8 s
Aborted:   no
Findings:
  F1 [P1] DR vCPU quota 512, needed 1,800 → requested, owner: platform, due 11-28
  F2 [P1] payments-worker reads hardcoded sqs.eu-west-1 URL → owner: payments, due 12-05
  F3 [P2] runbook step 7 references retired 'flipper' CLI → owner: SRE, due 11-21
  F4 [P3] status page template missing for 'regional failover' → owner: support
Next drill: 2027-Q1 (re-verify F1-F3, add fail-back under load)</pre>
<blockquote>💡 Real world: Netflix's region evacuation exercises and Google's annual DiRT (Disaster Recovery Testing) program made drills routine rather than heroic. The cultural goal is that a failover is boring.</blockquote>`,
        he: `<p>תוכנית שאפשר להחזיק לאורך זמן בחברה בגודל בינוני:</p>
<ul>
<li><strong>כל חודש</strong>: drill לרכיב אחד (לשחזר backup של DB ל-instance זמני ולבדוק checksum; failover ל-Redis אחד; רוטציה ל-secret אחד).</li>
<li><strong>כל רבעון</strong>: tabletop עם תרחיש חדש (ransomware, פריצה לחשבון ענן, ספק ה-auth ב-SaaS נפל) ועוד failover אמיתי ברמת שירות.</li>
<li><strong>פעם-פעמיים בשנה</strong>: failover מלא ל-region, ועדיף להישאר ב-DR יום או יותר.</li>
<li><strong>אחרי כל שינוי ארכיטקטורה משמעותי</strong>: לתרגל שוב את המסלול שהשתנה.</li>
</ul>
<p>דו"ח ה-drill (עמוד אחד, הולך להנהלת ההנדסה, ובשביל SOC 2, ISO 27001 או DORA גם לאודיטורים):</p>
<pre>DR Drill 2026-Q4 — checkout, eu-west-1 → eu-central-1
Hypothesis: RTO ≤ 30 min, RPO ≤ 5 s            Result: PARTIAL
Measured:  RTO 41 min (target 30)   RPO 1.8 s
Aborted:   no
Findings:
  F1 [P1] DR vCPU quota 512, needed 1,800 → requested, owner: platform, due 11-28
  F2 [P1] payments-worker reads hardcoded sqs.eu-west-1 URL → owner: payments, due 12-05
  F3 [P2] runbook step 7 references retired 'flipper' CLI → owner: SRE, due 11-21
  F4 [P3] status page template missing for 'regional failover' → owner: support
Next drill: 2027-Q1 (re-verify F1-F3, add fail-back under load)</pre>
<blockquote>💡 Real world: תרגילי ה-region evacuation של Netflix ותוכנית ה-DiRT (Disaster Recovery Testing) השנתית של Google הפכו drill-ים לשגרה ולא למבצע הרואי. המטרה התרבותית היא ש-failover יהיה משעמם.</blockquote>`
      }
    }
  ],
  diagram: "plan (scope, hypothesis, abort) -> T0 declare -> freeze writes -> promote DB -> scale DR -> shift traffic -> verify SLIs -> soak -> fail back -> report + tickets",
  handsOn: [
    { cmd: "aws service-quotas get-service-quota --service-code ec2 --quota-code L-1216C47A --region eu-central-1", what: { en: "Check the Running On-Demand Standard instances vCPU quota in the DR region before the drill, not during it.", he: "לבדוק את ה-quota של vCPU ל-Running On-Demand Standard instances ב-region ה-DR לפני ה-drill, לא באמצעו." } },
    { cmd: "aws rds describe-global-clusters --global-cluster-identifier shop-global --query 'GlobalClusters[0].GlobalClusterMembers'", what: { en: "See which cluster is the writer and which are secondaries before you switch over.", he: "לראות איזה cluster הוא ה-writer ואילו secondaries לפני ה-switchover." } },
    { cmd: "grep -rnE 'eu-west-1|us-east-1' k8s/ helm/ config/ | grep -v test", what: { en: "Hunt for hardcoded region names — the cheapest drill finding you can get without a drill.", he: "לחפש שמות region קשיחים — ה-finding הכי זול שאפשר להשיג בלי drill בכלל." } },
    { cmd: "dig +noall +answer checkout.example.com; dig +noall +answer checkout.example.com @1.1.1.1", what: { en: "Watch the remaining TTL and the answer from different resolvers while traffic shifts.", he: "לעקוב אחרי ה-TTL שנשאר והתשובה מ-resolvers שונים בזמן העברת ה-traffic." } }
  ],
  mnemonic: {
    en: "\"Untested DR = no DR.\" Drill = Declare, Run the runbook only, Instrument RPO/RTO, Log findings, Loop back to fix.",
    he: "\"DR שלא נבדק = אין DR.\" DRILL: Declare, Run רק לפי ה-runbook, Instrument ל-RPO/RTO, Log ממצאים, Loop לתיקון."
  },
  pitfalls: [
    { en: "Starting the RTO clock at the first command instead of at detection/declaration — the decision time is often the biggest chunk.", he: "להתחיל את שעון ה-RTO מהפקודה הראשונה ולא מרגע הזיהוי או ההכרזה — זמן ההחלטה הוא לרוב החתיכה הכי גדולה." },
    { en: "Letting the runbook author run the drill: tribal knowledge fills every gap and the runbook looks perfect.", he: "לתת לכותב ה-runbook להריץ את ה-drill: ידע שבטי ממלא כל חור וה-runbook נראה מושלם." },
    { en: "Failing over without a tested fail-back path, then being stuck in a half-provisioned DR region for weeks.", he: "לעשות failover בלי מסלול fail-back שנבדק, ואז להיתקע שבועות ב-region DR שלא הוקם עד הסוף." },
    { en: "Only drilling in quiet hours with no load: capacity, cache warmup and connection limits only show up under real traffic.", he: "לתרגל רק בשעות שקטות בלי עומס: capacity, חימום cache ומגבלות connections מתגלים רק תחת traffic אמיתי." }
  ],
  interview: [
    { q: { en: "How would you prove to an auditor that your RTO of 1 hour is real?", he: "איך תוכיח לאודיטור שה-RTO של שעה שלך אמיתי?" },
      a: { en: "Show drill reports with measured, timestamped phases from declaration to SLO-good traffic in the DR site, run by an on-call engineer using only the runbook, repeated on a schedule, with findings tracked to closure. A design doc saying 'warm standby' proves nothing.", he: "להראות דו\"חות drill עם שלבים מדודים וחתומי זמן, מההכרזה ועד traffic תקין לפי SLO באתר ה-DR, שהריץ מהנדס on-call רק לפי ה-runbook, שחוזרים לפי לוח זמנים, עם ממצאים שנסגרו. design doc שכתוב בו 'warm standby' לא מוכיח כלום." } },
    { q: { en: "Your DNS TTL is 60 s, but after a failover 20% of traffic still hits the old region for 30 minutes. Why?", he: "ה-DNS TTL שלך הוא 60 שניות, אבל אחרי failover עדיין 20% מה-traffic מגיע ל-region הישן במשך 30 דקות. למה?" },
      a: { en: "Clients that ignore or extend TTL (JVM DNS cache, some resolvers), long-lived keep-alive / HTTP/2 / gRPC connections that never re-resolve, connection pools, and hardcoded IPs or regional endpoints in partner integrations. Fixes: max connection age on servers, client-side re-resolution, and actively draining the old region.", he: "לקוחות שמתעלמים מה-TTL או מאריכים אותו (DNS cache של JVM, חלק מה-resolvers), connections ארוכים של keep-alive, HTTP/2 או gRPC שלא עושים resolve מחדש, connection pools, ו-IP-ים או endpoints אזוריים קשיחים אצל שותפים. תיקונים: max connection age בשרתים, resolve מחדש בצד הלקוח, ו-drain אקטיבי של ה-region הישן." } }
  ],
  quiz: [
    { q: { en: "When does the RTO clock start in a drill?", he: "מתי מתחיל שעון ה-RTO ב-drill?" },
      options: [
        { en: "When the first failover command runs", he: "כשפקודת ה-failover הראשונה רצה" },
        { en: "At the moment of declaration/detection (T0)", he: "ברגע ההכרזה או הזיהוי (T0)" },
        { en: "When DNS has fully converged", he: "כשה-DNS התכנס לגמרי" },
        { en: "When the DB promotion completes", he: "כשה-promotion של ה-DB מסתיים" }
      ], answer: 1,
      explain: { en: "RTO is what the business experiences. Detection and the decision to fail over are part of it, and are often the largest phase.", he: "RTO הוא מה שהעסק חווה. הזיהוי וההחלטה לעשות failover הם חלק ממנו, ולרוב השלב הכי ארוך." } },
    { q: { en: "What is the most reliable way to measure the RPO you actually achieved?", he: "מה הדרך הכי אמינה למדוד את ה-RPO שהשגת בפועל?" },
      options: [
        { en: "Read the replication lag metric from the vendor dashboard before the drill", he: "לקרוא את מטריקת ה-replication lag בדשבורד של הספק לפני ה-drill" },
        { en: "Ask the DBA", he: "לשאול את ה-DBA" },
        { en: "Compare the last heartbeat row present in the promoted DR database with the time the primary was cut off", he: "להשוות את שורת ה-heartbeat האחרונה שקיימת ב-DB ה-DR אחרי promotion לזמן שבו ה-primary נותק" },
        { en: "Count rows in both databases a day later", he: "לספור שורות בשני ה-DB-ים יום אחרי" }
      ], answer: 2,
      explain: { en: "A heartbeat writer gives a precise, data-based answer per data store. Vendor lag metrics are averages from before the event.", he: "heartbeat writer נותן תשובה מדויקת ומבוססת data לכל data store. מטריקות lag של הספק הן ממוצעים מלפני האירוע." } },
    { q: { en: "A restore in the DR region fails with AccessDenied on a KMS key. What's the likely cause?", he: "שחזור ב-region ה-DR נכשל עם AccessDenied על מפתח KMS. מה הסיבה הסבירה?" },
      options: [
        { en: "KMS is a global service and was down", he: "KMS הוא שירות גלובלי והוא היה למטה" },
        { en: "The snapshot was encrypted with a primary-region key; KMS keys are regional, so DR needs a multi-Region key or re-encryption with a DR key", he: "ה-snapshot הוצפן עם מפתח של ה-region הראשי; מפתחות KMS אזוריים, אז ב-DR צריך multi-Region key או הצפנה מחדש עם מפתח DR" },
        { en: "The DNS TTL was too high", he: "ה-DNS TTL היה גבוה מדי" },
        { en: "The quota for snapshots was exceeded", he: "ה-quota של snapshots נגמרה" }
      ], answer: 1,
      explain: { en: "This is one of the most common first-drill findings: crypto and IAM dependencies that exist only in the primary region.", he: "זה אחד הממצאים הכי נפוצים ב-drill הראשון: תלויות הצפנה ו-IAM שקיימות רק ב-region הראשי." } },
    { q: { en: "What distinguishes a tabletop exercise from a live drill?", he: "מה מבדיל tabletop exercise מ-live drill?" },
      options: [
        { en: "Tabletops are only for executives", he: "tabletop מיועד רק להנהלה" },
        { en: "Tabletops walk through decisions and the runbook without touching systems — cheap and safe, but they can't find technical gaps like quotas", he: "tabletop עובר על ההחלטות וה-runbook בלי לגעת במערכות — זול ובטוח, אבל לא יכול למצוא פערים טכניים כמו quotas" },
        { en: "Live drills don't need a rollback plan", he: "live drill לא צריך תוכנית חזרה" },
        { en: "There is no difference", he: "אין הבדל" }
      ], answer: 1,
      explain: { en: "Use both: tabletops for decision-making and comms, live drills to prove the technology and the numbers.", he: "משתמשים בשניהם: tabletop לקבלת החלטות ותקשורת, live drill כדי להוכיח את הטכנולוגיה והמספרים." } }
  ],
  playground: "dr",
  related: ["rel-bcdr", "rel-chaos-engineering", "rel-incident-management", "rel-runbooks-oncall", "net-dns"]
});

INFRA.lessons.push({
  id: "rel-cert-operations",
  track: "reliability",
  order: 31,
  icon: "📜",
  level: 3,
  minutes: 14,
  title: { en: "Certificate Operations: Never Get Paged for Expiry Again", he: "Certificate Operations – לא לקבל עוד page על תפוגה" },
  tldr: {
    en: "Certificate expiry is a 100% predictable outage that still takes down big companies, because certs are scattered, owned by nobody and renewed by hand. Inventory everything, alert at 30/14/7 days, automate issuance (ACME, cert-manager) — and get ready for public certs that live only 47 days by 2029.",
    he: "תפוגת certificate היא תקלה צפויה ב-100% שעדיין מפילה חברות גדולות, כי ה-certs מפוזרים, אין להם owner ומחדשים אותם ידנית. עושים inventory לכל דבר, alert ב-30/14/7 ימים, אוטומציה להנפקה (ACME, cert-manager) — ומתכוננים ל-certs ציבוריים שחיים רק 47 יום עד 2029."
  },
  analogy: {
    en: "Certificates are like passports for your services. Everyone knows passports expire, the date is printed right on them, yet people still get turned away at the airport. Now imagine a family of 400 passports, each issued by a different office, kept in different drawers, with nobody responsible for checking dates. That's certificate sprawl. The fix isn't remembering harder; it's an automatic renewal office plus a calendar that nags.",
    he: "Certificates הם כמו דרכונים לשירותים שלך. כולם יודעים שדרכון פג, התאריך מודפס עליו, ובכל זאת אנשים נתקעים בשדה התעופה. עכשיו תדמיין משפחה עם 400 דרכונים, כל אחד הונפק במשרד אחר, שמורים במגירות שונות, ואף אחד לא אחראי לבדוק תאריכים. זה certificate sprawl. הפתרון הוא לא לזכור חזק יותר; הוא משרד שמחדש אוטומטית ויומן שמנדנד."
  },
  sections: [
    {
      h: { en: "Why expiry outages keep happening", he: "למה תקלות תפוגה ממשיכות לקרות" },
      body: {
        en: `<p>Some famous ones:</p>
<ul>
<li><strong>Ericsson / O2 (Dec 2018)</strong> — an expired certificate in Ericsson's SGSN-MME software knocked out data for ~32 million O2 customers in the UK (plus networks in other countries) for most of a day.</li>
<li><strong>Microsoft Teams (Feb 2020)</strong> — an authentication certificate expired; Teams was down for hours.</li>
<li><strong>Equifax (2017)</strong> — an expired certificate on a traffic-inspection device meant exfiltration went unnoticed for ~76 days. Expired certs break <em>security monitoring</em>, not just availability.</li>
<li><strong>Starlink (Apr 2023)</strong> — global outage attributed to an expired ground-station certificate.</li>
</ul>
<p>The root causes are always the same:</p>
<ol>
<li><strong>Long lifetimes</strong> — a 1-year cert is renewed so rarely that the person who did it last time has left.</li>
<li><strong>No inventory</strong> — certs live in load balancers, Kubernetes Secrets, JKS keystores, IoT firmware, SaaS consoles, CDN configs, VPN appliances, SAML IdP metadata.</li>
<li><strong>Alerts go to a person, not a rotation</strong> — the CA's reminder emails go to an ex-employee's mailbox. (Let's Encrypt stopped sending expiry emails altogether in 2025 — you must monitor yourself.)</li>
<li><strong>Renewal ≠ deployment</strong> — the new cert was issued but the process holding the old one in memory was never reloaded.</li>
</ol>
<blockquote>💡 Real world: internal certs are worse than public ones. Public certs show up in Certificate Transparency logs and every scanner sees them; the internal mTLS cert someone created with <code>openssl req</code> and a 365-day lifetime is invisible until it breaks.</blockquote>`,
        he: `<p>כמה מפורסמות:</p>
<ul>
<li><strong>Ericsson / O2 (דצמבר 2018)</strong> — certificate שפג בתוכנת ה-SGSN-MME של Ericsson הפיל את ה-data לכ-32 מיליון לקוחות של O2 בבריטניה (ועוד רשתות במדינות אחרות) לרוב היום.</li>
<li><strong>Microsoft Teams (פברואר 2020)</strong> — certificate של authentication פג; Teams היה למטה שעות.</li>
<li><strong>Equifax (2017)</strong> — certificate שפג על מכשיר traffic inspection גרם לכך שהזלגת המידע לא זוהתה כ-76 יום. certs שפגו שוברים <em>ניטור אבטחה</em>, לא רק זמינות.</li>
<li><strong>Starlink (אפריל 2023)</strong> — תקלה עולמית שיוחסה ל-certificate שפג בתחנת קרקע.</li>
</ul>
<p>שורש הבעיה תמיד אותו דבר:</p>
<ol>
<li><strong>תוקף ארוך</strong> — cert לשנה מחודש כל כך לעיתים רחוקות שמי שעשה את זה בפעם הקודמת כבר עזב.</li>
<li><strong>אין inventory</strong> — certs יושבים ב-load balancers, ב-Secrets של Kubernetes, ב-JKS keystores, בקושחת IoT, בקונסולות SaaS, בהגדרות CDN, ב-VPN appliances, ב-metadata של SAML IdP.</li>
<li><strong>ה-alerts הולכים לאדם, לא ל-rotation</strong> — מיילי התזכורת של ה-CA הולכים לתיבה של עובד לשעבר. (Let's Encrypt הפסיקו לשלוח מיילי תפוגה לגמרי ב-2025 — אתה חייב לנטר בעצמך.)</li>
<li><strong>חידוש ≠ פריסה</strong> — ה-cert החדש הונפק, אבל התהליך שמחזיק את הישן בזיכרון אף פעם לא עשה reload.</li>
</ol>
<blockquote>💡 Real world: certs פנימיים גרועים יותר מציבוריים. certs ציבוריים מופיעים ב-Certificate Transparency logs וכל סורק רואה אותם; ה-cert של mTLS פנימי שמישהו יצר עם <code>openssl req</code> ותוקף של 365 יום בלתי נראה עד שהוא נשבר.</blockquote>`
      }
    },
    {
      h: { en: "Inventory and expiry monitoring", he: "Inventory וניטור תפוגה" },
      body: {
        en: `<p>Check one endpoint by hand (note <code>-servername</code> for SNI — without it you may get the default cert):</p>
<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com &lt;/dev/null 2&gt;/dev/null \\
    | openssl x509 -noout -subject -issuer -dates
subject=CN = api.example.com
issuer=C = US, O = Let's Encrypt, CN = R11
notBefore=Oct 20 08:12:03 2026 GMT
notAfter=Jan 18 08:12:02 2027 GMT

# exit code 1 if the cert expires within 14 days (1209600 s) — perfect for scripts
$ openssl x509 -in tls.crt -noout -checkend 1209600 || echo "RENEW NOW"</pre>
<p>At scale, use the Prometheus <strong>blackbox exporter</strong> for endpoints and <strong>x509-certificate-exporter</strong> (or cert-manager's own metrics) for files and Kubernetes Secrets:</p>
<pre>groups:
- name: certificates
  rules:
  - alert: TLSCertExpiringSoon
    expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; 14
    for: 1h
    labels: { severity: ticket }
    annotations:
      summary: "{{ $labels.instance }} cert expires in {{ $value | humanize }} days"
  - alert: TLSCertExpiringCritical
    expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; 3
    labels: { severity: page }
  - alert: CertManagerCertNotReady
    expr: certmanager_certificate_ready_status{condition="False"} == 1
    for: 15m
    labels: { severity: ticket }
  - alert: SecretCertExpiring          # x509-certificate-exporter
    expr: (x509_cert_not_after - time()) / 86400 &lt; 14</pre>
<p><code>probe_ssl_earliest_cert_expiry</code> is the earliest <code>notAfter</code> in the <em>whole presented chain</em>, so it also catches an expiring intermediate. Alert thresholds should be relative to lifetime: for a 90-day cert renewed at 60 days, "less than 14 days left" already means automation has been broken for two weeks.</p>
<blockquote>⚠️ Production tip: also alert on "the cert being served is older than expected". If cert-manager renewed at day 60 but the endpoint still serves the old cert, renewal works and <em>reload</em> is broken — a common silent failure.</blockquote>`,
        he: `<p>בדיקה ידנית של endpoint אחד (שים לב ל-<code>-servername</code> בשביל SNI — בלעדיו אולי תקבל את ה-cert הדיפולטי):</p>
<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com &lt;/dev/null 2&gt;/dev/null \\
    | openssl x509 -noout -subject -issuer -dates
subject=CN = api.example.com
issuer=C = US, O = Let's Encrypt, CN = R11
notBefore=Oct 20 08:12:03 2026 GMT
notAfter=Jan 18 08:12:02 2027 GMT

# exit code 1 if the cert expires within 14 days (1209600 s) — perfect for scripts
$ openssl x509 -in tls.crt -noout -checkend 1209600 || echo "RENEW NOW"</pre>
<p>בקנה מידה, משתמשים ב-<strong>blackbox exporter</strong> של Prometheus בשביל endpoints וב-<strong>x509-certificate-exporter</strong> (או במטריקות של cert-manager עצמו) בשביל קבצים ו-Secrets של Kubernetes:</p>
<pre>groups:
- name: certificates
  rules:
  - alert: TLSCertExpiringSoon
    expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; 14
    for: 1h
    labels: { severity: ticket }
    annotations:
      summary: "{{ $labels.instance }} cert expires in {{ $value | humanize }} days"
  - alert: TLSCertExpiringCritical
    expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; 3
    labels: { severity: page }
  - alert: CertManagerCertNotReady
    expr: certmanager_certificate_ready_status{condition="False"} == 1
    for: 15m
    labels: { severity: ticket }
  - alert: SecretCertExpiring          # x509-certificate-exporter
    expr: (x509_cert_not_after - time()) / 86400 &lt; 14</pre>
<p><code>probe_ssl_earliest_cert_expiry</code> הוא ה-<code>notAfter</code> המוקדם ביותר <em>בכל ה-chain שהוצג</em>, אז הוא תופס גם intermediate שעומד לפוג. ספי ה-alert צריכים להיות יחסיים לתוקף: ל-cert של 90 יום שמתחדש ביום 60, "פחות מ-14 יום נשארו" אומר שהאוטומציה שבורה כבר שבועיים.</p>
<blockquote>⚠️ Production tip: תוסיף alert גם על "ה-cert שמוגש ישן מהצפוי". אם cert-manager חידש ביום 60 וה-endpoint עדיין מגיש את הישן, החידוש עובד וה-<em>reload</em> שבור — כשל שקט ונפוץ.</blockquote>`
      }
    },
    {
      h: { en: "ACME, cert-manager and the shrinking lifetime", he: "ACME, cert-manager והתוקף שהולך ומתקצר" },
      body: {
        en: `<p><strong>The lifetime schedule (CA/Browser Forum ballot SC-081, adopted April 2025)</strong> for publicly trusted TLS certificates:</p>
<table><tr><th>Issued on/after</th><th>Max validity</th><th>Domain validation reuse</th></tr>
<tr><td>before 15 Mar 2026</td><td>398 days</td><td>398 days</td></tr>
<tr><td>15 Mar 2026</td><td>200 days</td><td>200 days</td></tr>
<tr><td>15 Mar 2027</td><td>100 days</td><td>100 days</td></tr>
<tr><td>15 Mar 2029</td><td>47 days</td><td>10 days</td></tr></table>
<p>As of late 2026 the 200-day cap is already in force. Let's Encrypt already issues 90-day certs by default, offers an opt-in 6-day "short-lived" profile, and has announced a move toward 45-day certs over the coming years. The message is clear: <strong>manual renewal is dead</strong>; anything that can't do ACME (or an equivalent API) becomes an outage generator.</p>
<p>In Kubernetes, <strong>cert-manager</strong> is the standard. Defaults: <code>duration</code> 90 days (2160h), renewal at 2/3 of lifetime unless you set <code>renewBefore</code>:</p>
<pre>apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: api-tls, namespace: shop }
spec:
  secretName: api-tls
  dnsNames: [api.example.com]
  duration: 2160h      # 90d
  renewBefore: 720h    # renew 30d before expiry
  privateKey: { algorithm: ECDSA, size: 256, rotationPolicy: Always }
  issuerRef: { kind: ClusterIssuer, name: letsencrypt-prod }</pre>
<pre>$ kubectl get certificate -A
NAMESPACE  NAME      READY  SECRET    AGE
shop       api-tls   True   api-tls   41d
$ cmctl status certificate api-tls -n shop      # renewal time, last failure, Order/Challenge state
$ cmctl renew api-tls -n shop                   # force renewal now</pre>
<blockquote>💡 Real world: with ACME, the risky dependency moves from "a human remembering" to "the ACME path working": DNS-01 needs DNS API credentials, HTTP-01 needs <code>/.well-known/acme-challenge/</code> reachable through your WAF and redirects. A WAF rule change can silently break renewals 60 days before the outage.</blockquote>`,
        he: `<p><strong>לוח הזמנים לתוקף (ballot SC-081 של ה-CA/Browser Forum, אושר באפריל 2025)</strong> ל-certificates ציבוריים של TLS:</p>
<table><tr><th>הונפק מתאריך</th><th>תוקף מקסימלי</th><th>שימוש חוזר ב-domain validation</th></tr>
<tr><td>לפני 15 במרץ 2026</td><td>398 יום</td><td>398 יום</td></tr>
<tr><td>15 במרץ 2026</td><td>200 יום</td><td>200 יום</td></tr>
<tr><td>15 במרץ 2027</td><td>100 יום</td><td>100 יום</td></tr>
<tr><td>15 במרץ 2029</td><td>47 יום</td><td>10 ימים</td></tr></table>
<p>נכון לסוף 2026, תקרת ה-200 יום כבר בתוקף. Let's Encrypt כבר מנפיקים certs של 90 יום כברירת מחדל, מציעים profile אופציונלי "short-lived" של 6 ימים, והודיעו על מעבר הדרגתי ל-certs של 45 יום בשנים הקרובות. המסר ברור: <strong>חידוש ידני מת</strong>; כל דבר שלא יודע ACME (או API שקול) הופך למחולל תקלות.</p>
<p>ב-Kubernetes, <strong>cert-manager</strong> הוא הסטנדרט. ברירות מחדל: <code>duration</code> של 90 יום (2160h), וחידוש ב-2/3 מהתוקף אלא אם הגדרת <code>renewBefore</code>:</p>
<pre>apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: api-tls, namespace: shop }
spec:
  secretName: api-tls
  dnsNames: [api.example.com]
  duration: 2160h      # 90d
  renewBefore: 720h    # renew 30d before expiry
  privateKey: { algorithm: ECDSA, size: 256, rotationPolicy: Always }
  issuerRef: { kind: ClusterIssuer, name: letsencrypt-prod }</pre>
<pre>$ kubectl get certificate -A
NAMESPACE  NAME      READY  SECRET    AGE
shop       api-tls   True   api-tls   41d
$ cmctl status certificate api-tls -n shop      # renewal time, last failure, Order/Challenge state
$ cmctl renew api-tls -n shop                   # force renewal now</pre>
<blockquote>💡 Real world: עם ACME, התלות המסוכנת עוברת מ"בן אדם שזוכר" ל"מסלול ה-ACME עובד": DNS-01 צריך credentials ל-API של ה-DNS, HTTP-01 צריך ש-<code>/.well-known/acme-challenge/</code> יהיה נגיש דרך ה-WAF וה-redirects. שינוי חוק ב-WAF יכול לשבור חידושים בשקט 60 יום לפני התקלה.</blockquote>`
      }
    },
    {
      h: { en: "Internal CA and mTLS rotation", he: "CA פנימי ורוטציה של mTLS" },
      body: {
        en: `<p>Internal PKI has three layers, each with its own rotation story:</p>
<table><tr><th>Layer</th><th>Typical lifetime</th><th>Rotation</th></tr>
<tr><td>Root CA (trust anchor)</td><td>5-20 years, key offline/HSM</td><td>Rare, planned, needs <em>trust bundle overlap</em></td></tr>
<tr><td>Intermediate / issuing CA</td><td>1-3 years (mesh issuer often 1 year)</td><td>Yearly, the one teams forget</td></tr>
<tr><td>Workload (leaf) certs</td><td>Hours to days (Istio and Linkerd default ~24h)</td><td>Fully automatic</td></tr></table>
<p>Short leaf lifetimes are great — but they make you <em>totally dependent</em> on the issuer: if the mesh's issuing CA expires, every workload cert renewal fails and within ~24h every service-to-service call breaks at once.</p>
<p>Rotating a CA without an outage is a <strong>trust-bundle overlap</strong>:</p>
<ol>
<li>Create the new CA. Distribute a bundle containing <strong>old + new</strong> roots to every client (trust-manager <code>Bundle</code>, mesh root config, OS trust store).</li>
<li>Wait until every workload has picked up the bundle (verify! check pods restarted / files reloaded).</li>
<li>Switch the issuer to sign with the new CA. Leaves gradually rotate.</li>
<li>After the longest leaf lifetime has passed, remove the old root from the bundle.</li>
</ol>
<pre># who signed the cert this pod presents, and when does it expire?
$ istioctl proxy-config secret deploy/payments -n shop
RESOURCE NAME   TYPE         STATUS   VALID CERT   SERIAL NUMBER   NOT AFTER              NOT BEFORE
default         Cert Chain   ACTIVE   true         7c1e...         2026-11-15T09:02:11Z   2026-11-14T09:00:11Z
ROOTCA          CA           ACTIVE   true         a913...         2035-03-02T11:20:45Z   2025-03-04T11:20:45Z

$ linkerd check --proxy      # warns when the identity issuer / trust anchor nears expiry</pre>
<blockquote>⚠️ Production tip: the Linkerd and Istio "bring your own CA" setups are where the issuer cert is a plain Secret someone created during installation with a 1-year lifetime. Put it under cert-manager (and monitor it) on day one.</blockquote>`,
        he: `<p>ל-PKI פנימי יש שלוש שכבות, ולכל אחת סיפור רוטציה משלה:</p>
<table><tr><th>שכבה</th><th>תוקף טיפוסי</th><th>רוטציה</th></tr>
<tr><td>Root CA (trust anchor)</td><td>5-20 שנה, המפתח offline או ב-HSM</td><td>נדירה, מתוכננת, צריכה <em>חפיפה ב-trust bundle</em></td></tr>
<tr><td>Intermediate / issuing CA</td><td>1-3 שנים (ה-issuer של mesh לרוב שנה)</td><td>שנתית, זו שצוותים שוכחים</td></tr>
<tr><td>Workload (leaf) certs</td><td>שעות עד ימים (ב-Istio וב-Linkerd ברירת המחדל בערך 24 שעות)</td><td>אוטומטית לגמרי</td></tr></table>
<p>תוקף קצר ל-leaf זה מצוין — אבל זה הופך אותך <em>תלוי לגמרי</em> ב-issuer: אם ה-issuing CA של ה-mesh פג, כל חידוש של workload cert נכשל, ותוך כ-24 שעות כל הקריאות בין השירותים נשברות בבת אחת.</p>
<p>רוטציה של CA בלי תקלה היא <strong>חפיפה ב-trust bundle</strong>:</p>
<ol>
<li>יוצרים את ה-CA החדש. מפיצים bundle שמכיל root <strong>ישן + חדש</strong> לכל הלקוחות (Bundle של trust-manager, הגדרת root של ה-mesh, ה-trust store של מערכת ההפעלה).</li>
<li>מחכים שכל ה-workloads קלטו את ה-bundle (לוודא! לבדוק שה-Pod-ים עלו מחדש או שהקבצים נטענו).</li>
<li>מעבירים את ה-issuer לחתום עם ה-CA החדש. ה-leafs מתחלפים בהדרגה.</li>
<li>אחרי שעבר התוקף של ה-leaf הכי ארוך, מוציאים את ה-root הישן מה-bundle.</li>
</ol>
<pre># who signed the cert this pod presents, and when does it expire?
$ istioctl proxy-config secret deploy/payments -n shop
RESOURCE NAME   TYPE         STATUS   VALID CERT   SERIAL NUMBER   NOT AFTER              NOT BEFORE
default         Cert Chain   ACTIVE   true         7c1e...         2026-11-15T09:02:11Z   2026-11-14T09:00:11Z
ROOTCA          CA           ACTIVE   true         a913...         2035-03-02T11:20:45Z   2025-03-04T11:20:45Z

$ linkerd check --proxy      # warns when the identity issuer / trust anchor nears expiry</pre>
<blockquote>⚠️ Production tip: ההתקנות של Linkerd ו-Istio עם "bring your own CA" הן המקום שבו ה-issuer cert הוא Secret רגיל שמישהו יצר בהתקנה עם תוקף של שנה. תכניס אותו ל-cert-manager (ותנטר אותו) מהיום הראשון.</blockquote>`
      }
    },
    {
      h: { en: "Chains, intermediates and root expiry events", he: "Chains, intermediates ואירועי תפוגה של root" },
      body: {
        en: `<p><strong>Missing intermediate</strong> is the classic "works in my browser, fails in curl/Java/Python" bug. Browsers can fetch the missing intermediate via the AIA extension or have it cached; most TLS libraries don't. The server must send <code>leaf + intermediate(s)</code> (never the root):</p>
<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts &lt;/dev/null | grep -E '^ [0-9] s:|i:'
 0 s:CN = api.example.com
   i:C = US, O = Let's Encrypt, CN = R11
# only depth 0 → the intermediate is missing! Expect "1 s:... CN = R11"

$ curl https://api.example.com
curl: (60) SSL certificate problem: unable to get local issuer certificate

# fix for nginx: ssl_certificate must point to the FULL chain file
ssl_certificate     /etc/ssl/api/fullchain.pem;   # leaf first, then intermediate
ssl_certificate_key /etc/ssl/api/privkey.pem;</pre>
<p><strong>Root expiry events</strong> break <em>clients</em>, not servers, and especially old ones:</p>
<ul>
<li><strong>AddTrust External CA Root (30 May 2020)</strong> — Sectigo's old cross-sign root expired; servers still sending the expired cross-signed intermediate broke old OpenSSL/GnuTLS clients (Roku devices, payment integrations, curl on old distros) even though a valid path existed.</li>
<li><strong>Let's Encrypt DST Root CA X3 (30 Sep 2021)</strong> — the IdenTrust cross-sign expired. Clients with old trust stores or OpenSSL 1.0.2's path-building bug failed; Let's Encrypt kept old Android working with a cross-sign trick, but many IoT devices and old Java/Python containers broke.</li>
</ul>
<blockquote>💡 Real world: your container base image <em>is</em> a trust store (<code>ca-certificates</code> package). A distroless image built in 2019 and never rebuilt will fail against servers that moved to new roots. Rebuild images regularly, and treat root programs' distrust announcements (e.g., Chrome distrusting a CA) as change notices for your clients.</blockquote>`,
        he: `<p><strong>Intermediate חסר</strong> הוא הבאג הקלאסי של "עובד אצלי בדפדפן, נכשל ב-curl, Java או Python". דפדפנים יודעים להביא את ה-intermediate החסר דרך ה-extension של AIA או שהוא כבר שמור אצלם; רוב ספריות ה-TLS לא. השרת חייב לשלוח <code>leaf + intermediate(s)</code> (אף פעם לא את ה-root):</p>
<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts &lt;/dev/null | grep -E '^ [0-9] s:|i:'
 0 s:CN = api.example.com
   i:C = US, O = Let's Encrypt, CN = R11
# only depth 0 → the intermediate is missing! Expect "1 s:... CN = R11"

$ curl https://api.example.com
curl: (60) SSL certificate problem: unable to get local issuer certificate

# fix for nginx: ssl_certificate must point to the FULL chain file
ssl_certificate     /etc/ssl/api/fullchain.pem;   # leaf first, then intermediate
ssl_certificate_key /etc/ssl/api/privkey.pem;</pre>
<p><strong>אירועי תפוגה של root</strong> שוברים <em>לקוחות</em>, לא שרתים, ובמיוחד ישנים:</p>
<ul>
<li><strong>AddTrust External CA Root (30 במאי 2020)</strong> — ה-root הישן של Sectigo ל-cross-sign פג; שרתים שעדיין שלחו את ה-intermediate החתום-בהצלבה שפג שברו לקוחות OpenSSL ו-GnuTLS ישנים (מכשירי Roku, אינטגרציות תשלומים, curl בהפצות ישנות) למרות שהיה מסלול תקין.</li>
<li><strong>DST Root CA X3 של Let's Encrypt (30 בספטמבר 2021)</strong> — ה-cross-sign של IdenTrust פג. לקוחות עם trust store ישן או עם באג בניית המסלול של OpenSSL 1.0.2 נכשלו; Let's Encrypt השאירו Android ישן עובד בעזרת טריק של cross-sign, אבל הרבה מכשירי IoT וקונטיינרים ישנים של Java ו-Python נשברו.</li>
</ul>
<blockquote>💡 Real world: ה-base image של הקונטיינר שלך <em>הוא</em> trust store (החבילה <code>ca-certificates</code>). image של distroless שנבנה ב-2019 ולא נבנה מחדש ייכשל מול שרתים שעברו ל-roots חדשים. תבנה images מחדש באופן קבוע, ותתייחס להודעות distrust של root programs (למשל Chrome שמפסיק לסמוך על CA) כהודעות שינוי ללקוחות שלך.</blockquote>`
      }
    },
    {
      h: { en: "The expired-cert runbook", he: "ה-runbook ל-cert שפג" },
      body: {
        en: `<pre>1. CONFIRM   openssl s_client ... | openssl x509 -noout -dates -issuer
             Errors look like: "x509: certificate has expired or is not yet valid",
             "CERT_HAS_EXPIRED", "PKIX path validation failed", "SSL routines::certificate expired"
             Check WHICH cert: leaf? intermediate? client cert (mTLS)? And check the clock (NTP)!
2. FIND      Where is it stored and who issues it? (cert-manager Certificate, ACM, Secret, keystore, LB)
3. RENEW     cert-manager:   cmctl renew &lt;cert&gt; -n &lt;ns&gt;
             ACM imported:   re-import; ACM-issued renews itself (if validation records still exist)
             internal CA:    issue from the CA with the same SANs, correct chain
4. DEPLOY    Make the process load it: rollout restart, nginx -s reload, envoy SDS, LB listener update
5. VERIFY    From a CLIENT's point of view (curl -v, openssl s_client), and SLIs recover
6. SWEEP     Query inventory for anything else expiring in the next 30 days — expiries cluster
             (everything created by the same person on the same day expires on the same day)
7. FOLLOW-UP Automate this cert, add it to monitoring, postmortem</pre>
<blockquote>⚠️ Production tip: never "fix" an expired internal cert by disabling verification (<code>InsecureSkipVerify</code>, <code>verify=False</code>, <code>-k</code>). It always outlives the incident and turns mTLS into encryption-without-authentication.</blockquote>`,
        he: `<pre>1. CONFIRM   openssl s_client ... | openssl x509 -noout -dates -issuer
             Errors look like: "x509: certificate has expired or is not yet valid",
             "CERT_HAS_EXPIRED", "PKIX path validation failed", "SSL routines::certificate expired"
             Check WHICH cert: leaf? intermediate? client cert (mTLS)? And check the clock (NTP)!
2. FIND      Where is it stored and who issues it? (cert-manager Certificate, ACM, Secret, keystore, LB)
3. RENEW     cert-manager:   cmctl renew &lt;cert&gt; -n &lt;ns&gt;
             ACM imported:   re-import; ACM-issued renews itself (if validation records still exist)
             internal CA:    issue from the CA with the same SANs, correct chain
4. DEPLOY    Make the process load it: rollout restart, nginx -s reload, envoy SDS, LB listener update
5. VERIFY    From a CLIENT's point of view (curl -v, openssl s_client), and SLIs recover
6. SWEEP     Query inventory for anything else expiring in the next 30 days — expiries cluster
             (everything created by the same person on the same day expires on the same day)
7. FOLLOW-UP Automate this cert, add it to monitoring, postmortem</pre>
<blockquote>⚠️ Production tip: אף פעם לא "לתקן" cert פנימי שפג על ידי ביטול האימות (<code>InsecureSkipVerify</code>, <code>verify=False</code>, <code>-k</code>). זה תמיד שורד את האינסידנט והופך mTLS להצפנה בלי אימות זהות.</blockquote>`
      }
    }
  ],
  diagram: "inventory (CT logs, scanners, k8s Secrets, LBs) -> monitor (blackbox probe_ssl_earliest_cert_expiry, x509 exporter) -> automate (ACME / cert-manager / internal CA) -> reload (restart, SDS) -> verify from client",
  handsOn: [
    { cmd: "echo | openssl s_client -connect github.com:443 -servername github.com 2>/dev/null | openssl x509 -noout -dates -issuer -subject", what: { en: "Read a real cert's validity window and issuer.", he: "לקרוא את חלון התוקף וה-issuer של cert אמיתי." } },
    { cmd: "echo | openssl s_client -connect github.com:443 -servername github.com -showcerts 2>/dev/null | grep -E '^ [0-9] s:'", what: { en: "Count the certs the server sends: you should see the leaf (0) and at least one intermediate (1).", he: "לספור את ה-certs שהשרת שולח: אתה אמור לראות את ה-leaf (0) ולפחות intermediate אחד (1)." } },
    { cmd: "kubectl get secrets -A --field-selector type=kubernetes.io/tls -o json | jq -r '.items[] | .metadata.namespace + \"/\" + .metadata.name' | head", what: { en: "Start an inventory: list every TLS Secret in the cluster, then check each with openssl x509 -enddate.", he: "להתחיל inventory: לרשום כל TLS Secret ב-cluster, ואז לבדוק כל אחד עם openssl x509 -enddate." } },
    { cmd: "curl -s 'https://crt.sh/?q=example.com&output=json' | jq -r '.[].not_after' | sort | head", what: { en: "Use Certificate Transparency logs to find public certs for your domain you didn't know existed.", he: "להשתמש ב-Certificate Transparency logs כדי למצוא certs ציבוריים לדומיין שלך שלא ידעת שקיימים." } }
  ],
  mnemonic: {
    en: "\"Find it, watch it, automate it, reload it.\" A renewed cert nobody loaded is still an expired cert.",
    he: "\"למצוא, לנטר, לאטמט, לטעון מחדש.\" cert שחודש ואף אחד לא טען אותו הוא עדיין cert שפג."
  },
  pitfalls: [
    { en: "Alerting only on the leaf: an expiring intermediate or mesh issuing CA takes everything down at once.", he: "alert רק על ה-leaf: intermediate או issuing CA של ה-mesh שפג מפיל הכל בבת אחת." },
    { en: "Renewing the cert but not reloading the process (Java keystores, nginx without reload, apps reading certs once at startup).", he: "לחדש את ה-cert אבל לא לטעון מחדש את התהליך (Java keystores, nginx בלי reload, אפליקציות שקוראות certs פעם אחת ב-startup)." },
    { en: "Serving only the leaf certificate: browsers cope via AIA, but curl, Java, Go and mobile clients fail.", he: "להגיש רק את ה-leaf: דפדפנים מסתדרים דרך AIA, אבל curl, Java, Go ולקוחות mobile נכשלים." },
    { en: "Disabling TLS verification as a 'temporary' fix — it's never temporary.", he: "לבטל אימות TLS כפתרון 'זמני' — זה אף פעם לא זמני." }
  ],
  interview: [
    { q: { en: "Public cert lifetimes drop to 47 days by 2029. What changes for an ops team?", he: "תוקף ה-certs הציבוריים יורד ל-47 יום עד 2029. מה משתנה לצוות ops?" },
      a: { en: "Renewals become roughly monthly, so every cert must be issued and deployed via automation (ACME, cloud-managed certs like ACM, cert-manager). Inventory and monitoring become mandatory, appliances and SaaS that need manual upload must be replaced or fronted by something automatable, and the ACME path itself (DNS API credentials, HTTP-01 reachability) becomes a monitored production dependency.", he: "חידושים הופכים לבערך חודשיים, אז כל cert חייב להיות מונפק ונפרס דרך אוטומציה (ACME, certs מנוהלים בענן כמו ACM, cert-manager). inventory וניטור הופכים לחובה, appliances ו-SaaS שדורשים העלאה ידנית צריך להחליף או לשים לפניהם משהו שאפשר לאטמט, ומסלול ה-ACME עצמו (credentials ל-API של ה-DNS, נגישות HTTP-01) הופך לתלות production שמנוטרת." } },
    { q: { en: "How do you rotate an internal root CA used for mTLS without downtime?", he: "איך מחליפים root CA פנימי של mTLS בלי downtime?" },
      a: { en: "Trust-bundle overlap: distribute old+new roots to all clients first, verify every workload loaded it, then switch issuance to the new CA, wait for the longest leaf lifetime so all leaves are re-signed, and only then remove the old root.", he: "חפיפה ב-trust bundle: קודם מפיצים root ישן + חדש לכל הלקוחות, מוודאים שכל workload טען אותו, ואז מעבירים את ההנפקה ל-CA החדש, מחכים את התוקף של ה-leaf הכי ארוך כדי שכל ה-leafs ייחתמו מחדש, ורק אז מוציאים את ה-root הישן." } }
  ],
  quiz: [
    { q: { en: "Your site works in Chrome but curl says 'unable to get local issuer certificate'. Most likely cause?", he: "האתר עובד ב-Chrome אבל curl אומר 'unable to get local issuer certificate'. מה הסיבה הסבירה?" },
      options: [
        { en: "The certificate has expired", he: "ה-certificate פג" },
        { en: "The server isn't sending the intermediate certificate; Chrome fetches it via AIA, curl doesn't", he: "השרת לא שולח את ה-intermediate; Chrome מביא אותו דרך AIA, ו-curl לא" },
        { en: "curl doesn't support TLS 1.3", he: "curl לא תומך ב-TLS 1.3" },
        { en: "DNS is misconfigured", he: "ה-DNS מוגדר לא נכון" }
      ], answer: 1,
      explain: { en: "Serve the full chain (leaf + intermediates). Check with openssl s_client -showcerts.", he: "מגישים את כל ה-chain (leaf + intermediates). בודקים עם openssl s_client -showcerts." } },
    { q: { en: "What does blackbox exporter's probe_ssl_earliest_cert_expiry report?", he: "מה מדווח probe_ssl_earliest_cert_expiry של blackbox exporter?" },
      options: [
        { en: "Days until the leaf expires", he: "ימים עד שה-leaf פג" },
        { en: "The Unix timestamp of the earliest notAfter among the certs in the presented chain", he: "ה-Unix timestamp של ה-notAfter המוקדם ביותר מבין ה-certs ב-chain שהוצג" },
        { en: "Whether OCSP stapling is enabled", he: "האם OCSP stapling מופעל" },
        { en: "The issue date of the root CA", he: "תאריך ההנפקה של ה-root CA" }
      ], answer: 1,
      explain: { en: "It's a timestamp in seconds, so you alert on (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; N days. It covers intermediates too.", he: "זה timestamp בשניות, אז עושים alert על (probe_ssl_earliest_cert_expiry - time()) / 86400 &lt; N ימים. זה מכסה גם intermediates." } },
    { q: { en: "Under CA/B Forum ballot SC-081, what is the maximum lifetime of a public TLS certificate issued after 15 March 2029?", he: "לפי ballot SC-081 של ה-CA/B Forum, מה התוקף המקסימלי של certificate ציבורי שהונפק אחרי 15 במרץ 2029?" },
      options: [
        { en: "398 days", he: "398 יום" },
        { en: "200 days", he: "200 יום" },
        { en: "90 days", he: "90 יום" },
        { en: "47 days", he: "47 יום" }
      ], answer: 3,
      explain: { en: "The schedule is 200 days (Mar 2026), 100 days (Mar 2027), 47 days (Mar 2029).", he: "לוח הזמנים: 200 יום (מרץ 2026), 100 יום (מרץ 2027), 47 יום (מרץ 2029)." } },
    { q: { en: "cert-manager shows the Certificate as Ready with a new expiry date, but clients still see the old cert. What's broken?", he: "cert-manager מראה שה-Certificate הוא Ready עם תאריך תפוגה חדש, אבל לקוחות עדיין רואים את ה-cert הישן. מה שבור?" },
      options: [
        { en: "The ACME challenge", he: "ה-ACME challenge" },
        { en: "The workload never reloaded the updated Secret (reads it once at startup, or a stale keystore copy)", he: "ה-workload אף פעם לא טען מחדש את ה-Secret המעודכן (קורא אותו פעם אחת ב-startup, או עותק ישן של keystore)" },
        { en: "The root CA expired", he: "ה-root CA פג" },
        { en: "Certificate Transparency rejected it", he: "Certificate Transparency דחה אותו" }
      ], answer: 1,
      explain: { en: "Renewal and deployment are separate steps. Use hot reload, Reloader-style restarts, or SDS, and monitor the cert actually being served.", he: "חידוש ופריסה הם שני שלבים נפרדים. משתמשים ב-hot reload, ב-restart בסגנון Reloader, או ב-SDS, ומנטרים את ה-cert שבאמת מוגש." } }
  ],
  related: ["pr-applied-crypto-pki", "k8s-ingress-certs-dns", "net-http-tls", "staff-service-mesh", "obs-alerting"]
});

INFRA.lessons.push({
  id: "rel-incident-comms",
  track: "reliability",
  order: 32,
  icon: "📣",
  level: 2,
  minutes: 12,
  title: { en: "Incident Communication", he: "תקשורת בזמן אינסידנט" },
  tldr: {
    en: "During an incident, silence is interpreted as incompetence: publish early, say what users experience (not your guesses about causes), commit to the next update time and keep it — and give communication its own owner so the people fixing things can keep fixing.",
    he: "בזמן אינסידנט, שתיקה נתפסת כחוסר שליטה: מפרסמים מוקדם, אומרים מה המשתמשים חווים (לא ניחושים על הסיבה), מתחייבים לשעת העדכון הבא ועומדים בה — ונותנים לתקשורת owner משלה כדי שמי שמתקן ימשיך לתקן."
  },
  analogy: {
    en: "A flight delay. The airline that announces 'technical issue, we'll update you at 14:30' and actually updates at 14:30 keeps passengers calm even if the delay grows to three hours. The airline that says nothing for 90 minutes has a riot at the gate, even if the delay ends up shorter. Passengers can tolerate bad news; they can't tolerate not knowing.",
    he: "עיכוב בטיסה. חברת התעופה שמודיעה 'תקלה טכנית, נעדכן ב-14:30' ובאמת מעדכנת ב-14:30 שומרת על הנוסעים רגועים גם אם העיכוב מתארך לשלוש שעות. חברה ששותקת 90 דקות מקבלת מהומה בשער, גם אם העיכוב בסוף קצר יותר. נוסעים יכולים לסבול חדשות רעות; הם לא יכולים לסבול לא לדעת."
  },
  sections: [
    {
      h: { en: "Who communicates, to whom, by severity", he: "מי מתקשר, למי, לפי חומרה" },
      body: {
        en: `<p>The Incident Commander owns the response; a separate <strong>Communications Lead</strong> owns updates. One person cannot debug and write customer-safe prose at the same time.</p>
<table><tr><th>Severity</th><th>Internal</th><th>Customers</th><th>Execs</th><th>Cadence</th></tr>
<tr><td>SEV1 (major outage, data risk)</td><td>#inc channel + eng-wide announce, support leads</td><td>Status page within 10-15 min, proactive email to affected enterprise accounts</td><td>Page the exec on-call; CEO informed within 30 min</td><td>Every 30 min (even "no change")</td></tr>
<tr><td>SEV2 (partial degradation)</td><td>#inc channel, owning teams, support</td><td>Status page if customer-visible</td><td>Summary to VP Eng</td><td>Every 60 min</td></tr>
<tr><td>SEV3 (minor, workaround exists)</td><td>Team channel</td><td>Usually none, support macro if asked</td><td>None</td><td>At resolution</td></tr></table>
<p>Pre-wire this in your incident tooling (incident.io, FireHydrant, PagerDuty, Rootly): declaring a SEV1 should automatically create the channel, page the Comms Lead and open a status-page draft.</p>
<blockquote>💡 Real world: "when in doubt, post" — a status-page notice for something that turns out minor costs almost nothing. A wave of customers discovering an outage on social media before you acknowledge it costs trust you rebuild over months.</blockquote>`,
        he: `<p>ה-Incident Commander אחראי על הטיפול; <strong>Communications Lead</strong> נפרד אחראי על העדכונים. אדם אחד לא יכול לדבג ובמקביל לכתוב טקסט שבטוח לשלוח ללקוחות.</p>
<table><tr><th>חומרה</th><th>פנימי</th><th>לקוחות</th><th>הנהלה</th><th>תדירות</th></tr>
<tr><td>SEV1 (השבתה, סיכון ל-data)</td><td>ערוץ #inc והודעה לכל ההנדסה, ראשי ה-support</td><td>Status page תוך 10-15 דקות, מייל יזום ללקוחות enterprise שנפגעו</td><td>page ל-exec on-call; ה-CEO מעודכן תוך 30 דקות</td><td>כל 30 דקות (גם "אין שינוי")</td></tr>
<tr><td>SEV2 (פגיעה חלקית)</td><td>ערוץ #inc, הצוותים הרלוונטיים, support</td><td>Status page אם הלקוחות מרגישים</td><td>סיכום ל-VP Eng</td><td>כל 60 דקות</td></tr>
<tr><td>SEV3 (קטן, יש workaround)</td><td>ערוץ הצוות</td><td>בדרך כלל כלום, macro ל-support אם שואלים</td><td>אין</td><td>בסגירה</td></tr></table>
<p>תחווט את זה מראש בכלי האינסידנטים (incident.io, FireHydrant, PagerDuty, Rootly): הכרזה על SEV1 צריכה ליצור אוטומטית את הערוץ, לעשות page ל-Comms Lead ולפתוח טיוטה ב-status page.</p>
<blockquote>💡 Real world: "בספק — מפרסמים". הודעה ב-status page על משהו שהתברר כקטן עולה כמעט כלום. גל של לקוחות שמגלים השבתה ברשתות החברתיות לפני שהודית בה עולה אמון שבונים מחדש חודשים.</blockquote>`
      }
    },
    {
      h: { en: "Status pages: what to say and how often", he: "Status pages: מה לכתוב וכל כמה זמן" },
      body: {
        en: `<p>The standard lifecycle (Atlassian Statuspage, instatus, Better Stack all use it): <strong>Investigating → Identified → Monitoring → Resolved</strong>, with component states <em>Operational / Degraded performance / Partial outage / Major outage</em>.</p>
<p>A good update answers four things: <strong>what's affected, who's affected, what we're doing, when the next update is</strong>.</p>
<pre>[Investigating] 14:07 UTC
We're seeing elevated errors when checking out with credit cards in Europe.
Some payments may fail; no charges are made for failed attempts.
PayPal and existing subscriptions are not affected.
Next update by 14:40 UTC.

[Identified] 14:38 UTC
We've identified the issue in a component that connects to our payment provider
and are rolling out a fix. About 30% of card checkouts in Europe are failing.
Next update by 15:10 UTC.

[Monitoring] 15:02 UTC
A fix has been deployed and card checkouts are succeeding again.
We're monitoring closely. If a payment failed between 13:52 and 14:58 UTC,
you can safely retry it.

[Resolved] 15:45 UTC
This incident is resolved. Card checkouts in Europe were degraded from
13:52 to 14:58 UTC. We'll publish a summary of what happened within 5 business days.</pre>
<p>Rules that make this work:</p>
<ul>
<li>Describe <strong>symptoms in user terms</strong> ("payments may fail"), not internals ("pgbouncer pool exhausted on shard 3").</li>
<li><strong>Always state the next update time</strong> and beat it. Missing your own deadline is worse than a long gap you announced.</li>
<li>Say what's <strong>not</strong> affected; it shrinks support load.</li>
<li>Tell people what to <strong>do</strong>: retry, wait, use a workaround.</li>
<li>Use UTC (or show the user's local time); "3pm" means nothing to a global customer base.</li>
</ul>
<blockquote>⚠️ Production tip: host the status page on infrastructure that doesn't share your failure domain. AWS's own status dashboard couldn't show the 2017 S3 outage properly because it depended on S3 — the canonical lesson.</blockquote>`,
        he: `<p>מחזור החיים הסטנדרטי (Atlassian Statuspage, instatus ו-Better Stack כולם משתמשים בו): <strong>Investigating → Identified → Monitoring → Resolved</strong>, עם מצבי רכיב <em>Operational / Degraded performance / Partial outage / Major outage</em>.</p>
<p>עדכון טוב עונה על ארבעה דברים: <strong>מה נפגע, מי נפגע, מה אנחנו עושים, מתי העדכון הבא</strong>.</p>
<pre>[Investigating] 14:07 UTC
We're seeing elevated errors when checking out with credit cards in Europe.
Some payments may fail; no charges are made for failed attempts.
PayPal and existing subscriptions are not affected.
Next update by 14:40 UTC.

[Identified] 14:38 UTC
We've identified the issue in a component that connects to our payment provider
and are rolling out a fix. About 30% of card checkouts in Europe are failing.
Next update by 15:10 UTC.

[Monitoring] 15:02 UTC
A fix has been deployed and card checkouts are succeeding again.
We're monitoring closely. If a payment failed between 13:52 and 14:58 UTC,
you can safely retry it.

[Resolved] 15:45 UTC
This incident is resolved. Card checkouts in Europe were degraded from
13:52 to 14:58 UTC. We'll publish a summary of what happened within 5 business days.</pre>
<p>החוקים שגורמים לזה לעבוד:</p>
<ul>
<li>מתארים <strong>סימפטומים במונחים של המשתמש</strong> ("תשלומים עלולים להיכשל"), לא פנימיות ("ה-pool של pgbouncer נגמר ב-shard 3").</li>
<li><strong>תמיד מציינים את שעת העדכון הבא</strong> ומקדימים אותה. לפספס דדליין שקבעת בעצמך גרוע יותר מפער ארוך שהודעת עליו.</li>
<li>אומרים מה <strong>לא</strong> נפגע; זה מוריד עומס מה-support.</li>
<li>אומרים לאנשים מה <strong>לעשות</strong>: retry, לחכות, להשתמש ב-workaround.</li>
<li>משתמשים ב-UTC (או מציגים את השעה המקומית של המשתמש); "בשלוש" לא אומר כלום ללקוחות בכל העולם.</li>
</ul>
<blockquote>⚠️ Production tip: תארח את ה-status page על תשתית שלא חולקת איתך failure domain. דשבורד הסטטוס של AWS עצמו לא הצליח להציג כמו שצריך את השבתת S3 ב-2017 כי הוא היה תלוי ב-S3 — זה השיעור הקלאסי.</blockquote>`
      }
    },
    {
      h: { en: "Internal and exec updates", he: "עדכונים פנימיים ולהנהלה" },
      body: {
        en: `<p>Internal updates are more technical but still structured, so people joining late can catch up without asking "what's going on?" in the channel:</p>
<pre>:rotating_light: SEV1 — EU card checkout failures — update #3 (14:40 UTC)
IC: @dana   Comms: @yossi   Ops: @avi, @maya   Bridge: meet.example/inc-4821
Impact:   ~30% of EU card checkouts failing since 13:52 (≈ 1,900 failed orders, ~€140k GMV at risk)
Status:   IDENTIFIED — payments-gateway connection pool to PSP exhausted after 13:45 deploy
Doing:    rollback of payments-gateway v2.31 → v2.30 in progress (ETA 14:50)
Next:     verify success rate &gt; 99%, then decide on retry job for failed orders
Need:     nobody else deploy payments-* until all-clear
Next update: 15:10 UTC</pre>
<p>Execs need a different shape: <strong>business impact, customer exposure, ETA confidence, and whether they need to do anything</strong> (call a big customer, approve a decision). Three to five lines, no jargon:</p>
<pre>Checkout for card payments in Europe is partly down since 13:52 (about 1 in 3 fail).
Cause found (today's release), rollback underway, expect recovery by ~15:00.
Money: ~€140k in orders delayed; customers can retry, nothing is double-charged.
No action needed from you. Two enterprise accounts informed by their CSMs.</pre>
<blockquote>💡 Real world: a common anti-pattern is execs joining the war-room bridge and asking for ETAs every five minutes. A reliable exec update cadence is the best defense: give them a predictable channel and they stay out of the responders' way.</blockquote>`,
        he: `<p>עדכונים פנימיים יותר טכניים אבל עדיין מובנים, כדי שמי שמצטרף מאוחר יוכל להשלים פערים בלי לשאול "מה קורה?" בערוץ:</p>
<pre>:rotating_light: SEV1 — EU card checkout failures — update #3 (14:40 UTC)
IC: @dana   Comms: @yossi   Ops: @avi, @maya   Bridge: meet.example/inc-4821
Impact:   ~30% of EU card checkouts failing since 13:52 (≈ 1,900 failed orders, ~€140k GMV at risk)
Status:   IDENTIFIED — payments-gateway connection pool to PSP exhausted after 13:45 deploy
Doing:    rollback of payments-gateway v2.31 → v2.30 in progress (ETA 14:50)
Next:     verify success rate &gt; 99%, then decide on retry job for failed orders
Need:     nobody else deploy payments-* until all-clear
Next update: 15:10 UTC</pre>
<p>הנהלה צריכה מבנה אחר: <strong>השפעה עסקית, חשיפה של לקוחות, כמה בטוחים ב-ETA, והאם הם צריכים לעשות משהו</strong> (להתקשר ללקוח גדול, לאשר החלטה). שלוש עד חמש שורות, בלי ז'רגון:</p>
<pre>Checkout for card payments in Europe is partly down since 13:52 (about 1 in 3 fail).
Cause found (today's release), rollback underway, expect recovery by ~15:00.
Money: ~€140k in orders delayed; customers can retry, nothing is double-charged.
No action needed from you. Two enterprise accounts informed by their CSMs.</pre>
<blockquote>💡 Real world: anti-pattern נפוץ הוא מנהלים שמצטרפים ל-bridge של ה-war room ושואלים על ETA כל חמש דקות. תדירות קבועה ואמינה של עדכוני הנהלה היא ההגנה הכי טובה: תן להם ערוץ צפוי והם לא יפריעו למי שמטפל.</blockquote>`
      }
    },
    {
      h: { en: "No blame, no speculation, no premature root cause", he: "בלי האשמות, בלי ספקולציות, בלי root cause מוקדם" },
      body: {
        en: `<table><tr><th>Don't write</th><th>Write instead</th><th>Why</th></tr>
<tr><td>"An engineer pushed a bad config"</td><td>"A configuration change caused..."</td><td>Blameless externally <em>and</em> internally; systems allowed it</td></tr>
<tr><td>"AWS is down"</td><td>"We're seeing errors from an upstream provider and are working with them"</td><td>Until the provider confirms, you might be wrong — and it reads as deflection</td></tr>
<tr><td>"Root cause: DNS"</td><td>"We've identified a likely cause and are applying a fix"</td><td>Early root-cause claims get retracted; retractions destroy credibility</td></tr>
<tr><td>"Fixed in 10 minutes"</td><td>"Next update by 14:40"</td><td>Commit to updates, not to ETAs you don't control</td></tr>
<tr><td>"No data was affected"</td><td>"We have no indication that data was accessed; investigation is ongoing"</td><td>Absolute statements become legal liabilities if later proven wrong</td></tr>
<tr><td>"We apologize for any inconvenience"</td><td>"We're sorry — we know checkout is critical for your business"</td><td>Specific, sincere, owns the impact</td></tr></table>
<blockquote>⚠️ Production tip: anything that might be a <strong>security incident</strong> (unauthorized access, data exposure) goes through security + legal before a single public word. Availability incidents: speed matters most. Security incidents: accuracy and legal privilege matter most.</blockquote>`,
        he: `<table><tr><th>לא לכתוב</th><th>לכתוב במקום</th><th>למה</th></tr>
<tr><td>"מהנדס דחף config שבור"</td><td>"שינוי configuration גרם ל..."</td><td>blameless גם החוצה <em>וגם</em> פנימה; המערכת אפשרה את זה</td></tr>
<tr><td>"AWS נפל"</td><td>"אנחנו רואים שגיאות מספק upstream ועובדים מולו"</td><td>עד שהספק מאשר, אתה עלול לטעות — וזה נשמע כמו התחמקות</td></tr>
<tr><td>"Root cause: DNS"</td><td>"זיהינו סיבה סבירה ומיישמים תיקון"</td><td>טענות root cause מוקדמות נחזרות; חזרות הורסות אמינות</td></tr>
<tr><td>"יתוקן תוך 10 דקות"</td><td>"העדכון הבא עד 14:40"</td><td>מתחייבים לעדכונים, לא ל-ETA שאתה לא שולט בו</td></tr>
<tr><td>"שום data לא נפגע"</td><td>"אין לנו אינדיקציה שהייתה גישה ל-data; החקירה נמשכת"</td><td>הצהרות מוחלטות הופכות לחבות משפטית אם יתברר שטעית</td></tr>
<tr><td>"אנו מתנצלים על אי הנוחות"</td><td>"אנחנו מצטערים — אנחנו יודעים ש-checkout קריטי לעסק שלך"</td><td>ספציפי, כן, לוקח אחריות על ההשפעה</td></tr></table>
<blockquote>⚠️ Production tip: כל דבר שעלול להיות <strong>אירוע אבטחה</strong> (גישה לא מורשית, חשיפת data) עובר דרך security ו-legal לפני מילה אחת בפומבי. באינסידנטים של זמינות — מהירות הכי חשובה. באירועי אבטחה — דיוק ו-legal privilege הכי חשובים.</blockquote>`
      }
    },
    {
      h: { en: "Customer post-incident reports and regulated disclosures", he: "דו\"חות אחרי אינסידנט ללקוחות ודיווחים רגולטוריים" },
      body: {
        en: `<p>A public post-incident report (a.k.a. RFO, "Reason for Outage") is <em>not</em> your internal postmortem. It's shorter, customer-focused and reviewed by legal. Structure:</p>
<ol>
<li><strong>Summary</strong> — what happened, when (UTC start/end), who was affected, in 3 sentences.</li>
<li><strong>Impact</strong> — concrete numbers: duration, % of requests, regions, data impact (or explicitly none).</li>
<li><strong>What happened</strong> — a factual timeline at the right altitude ("a configuration change to our load balancing layer...").</li>
<li><strong>What we're doing</strong> — specific, verifiable commitments ("we will stage this class of change by region, completed by Q1"), not "we'll be more careful".</li>
<li><strong>Apology</strong> — once, sincere, without hedging.</li>
</ol>
<p>Common targets: publish within 3-7 business days; enterprise customers often have contractual RFO deadlines and SLA credit processes.</p>
<p><strong>Regulated disclosures</strong> (always run by legal; deadlines are from awareness/determination and differ by regime):</p>
<table><tr><th>Regime</th><th>Trigger</th><th>Deadline</th></tr>
<tr><td>GDPR Art. 33</td><td>Personal data breach</td><td>Supervisory authority within 72 h of awareness; data subjects "without undue delay" if high risk</td></tr>
<tr><td>NIS2 (EU)</td><td>Significant incident at essential/important entities</td><td>Early warning 24 h, notification 72 h, final report within 1 month</td></tr>
<tr><td>DORA (EU financial)</td><td>Major ICT-related incident</td><td>Initial notification within hours of classification (4 h, max 24 h from awareness), intermediate and final reports follow</td></tr>
<tr><td>SEC Form 8-K Item 1.05 (US public cos.)</td><td>Material cybersecurity incident</td><td>4 business days after determining materiality</td></tr></table>
<blockquote>💡 Real world: the best public RFOs (Cloudflare's blog posts are the reference) are detailed enough that engineers trust them and plain enough that customers understand them. Transparency after an outage often <em>increases</em> customer trust.</blockquote>`,
        he: `<p>דו"ח אחרי אינסידנט פומבי (נקרא גם RFO, "Reason for Outage") הוא <em>לא</em> ה-postmortem הפנימי שלך. הוא קצר יותר, ממוקד לקוח ועובר review של legal. מבנה:</p>
<ol>
<li><strong>סיכום</strong> — מה קרה, מתי (התחלה וסוף ב-UTC), מי נפגע, בשלושה משפטים.</li>
<li><strong>השפעה</strong> — מספרים קונקרטיים: משך, אחוז בקשות, regions, השפעה על data (או במפורש — אין).</li>
<li><strong>מה קרה</strong> — timeline עובדתי בגובה הנכון ("שינוי configuration בשכבת ה-load balancing שלנו...").</li>
<li><strong>מה אנחנו עושים</strong> — התחייבויות ספציפיות שאפשר לבדוק ("נפרוס סוג שינויים כזה region אחרי region, עד Q1"), לא "נהיה זהירים יותר".</li>
<li><strong>התנצלות</strong> — פעם אחת, כנה, בלי הסתייגויות.</li>
</ol>
<p>יעדים נפוצים: לפרסם תוך 3-7 ימי עסקים; ללקוחות enterprise יש לרוב דדליין חוזי ל-RFO ותהליך של SLA credits.</p>
<p><strong>דיווחים רגולטוריים</strong> (תמיד דרך legal; הדדליינים נספרים מרגע המודעות או הקביעה ושונים בין משטרים):</p>
<table><tr><th>משטר</th><th>טריגר</th><th>דדליין</th></tr>
<tr><td>GDPR סעיף 33</td><td>דליפת מידע אישי</td><td>לרשות הפיקוח תוך 72 שעות מרגע המודעות; לנושאי המידע "ללא דיחוי מיותר" אם הסיכון גבוה</td></tr>
<tr><td>NIS2 (EU)</td><td>אירוע משמעותי בגופים חיוניים או חשובים</td><td>התרעה מוקדמת תוך 24 שעות, הודעה תוך 72 שעות, דו"ח סופי תוך חודש</td></tr>
<tr><td>DORA (פיננסים ב-EU)</td><td>אירוע ICT מהותי</td><td>הודעה ראשונית תוך שעות מהסיווג (4 שעות, ולכל היותר 24 מרגע המודעות), אחריה דו"ח ביניים וסופי</td></tr>
<tr><td>SEC Form 8-K Item 1.05 (חברות ציבוריות בארה"ב)</td><td>אירוע סייבר מהותי</td><td>4 ימי עסקים אחרי הקביעה שהוא מהותי</td></tr></table>
<blockquote>💡 Real world: ה-RFO-ים הפומביים הכי טובים (הפוסטים בבלוג של Cloudflare הם הרפרנס) מפורטים מספיק כדי שמהנדסים יסמכו עליהם, ופשוטים מספיק כדי שלקוחות יבינו. שקיפות אחרי השבתה לרוב <em>מגדילה</em> את אמון הלקוחות.</blockquote>`
      }
    }
  ],
  diagram: "declare SEV -> IC + Comms Lead -> status page (Investigating, next update time) -> internal update every 30m -> exec summary -> Identified -> Monitoring -> Resolved -> customer RFO (3-7 days) [+ legal: GDPR 72h / NIS2 24h / SEC 4 business days]",
  handsOn: [
    { cmd: "curl -s https://www.githubstatus.com/api/v2/summary.json | jq '.status, [.components[] | {name, status}][:5]'", what: { en: "Statuspage-hosted pages expose a public JSON API. See the component states real companies use.", he: "דפים שמתארחים ב-Statuspage חושפים API ציבורי ב-JSON. תראה את מצבי הרכיבים שחברות אמיתיות משתמשות בהם." } },
    { cmd: "curl -s https://www.githubstatus.com/api/v2/incidents.json | jq -r '.incidents[0].incident_updates[] | .status + \": \" + .body' | head -20", what: { en: "Read a real incident's update sequence and study the wording and cadence.", he: "לקרוא רצף עדכונים של אינסידנט אמיתי וללמוד את הניסוח והתדירות." } },
    { cmd: "date -u +'%H:%M UTC'; date -u -d '+30 min' +'Next update by %H:%M UTC'", what: { en: "Generate the timestamp and next-update line for your template — always in UTC.", he: "לייצר את השעה ואת שורת העדכון הבא לתבנית — תמיד ב-UTC." } }
  ],
  mnemonic: {
    en: "\"What, who, doing, next.\" Every update: what's affected, who's affected, what we're doing, when you'll hear from us again.",
    he: "\"מה, מי, עושים, הבא.\" כל עדכון: מה נפגע, מי נפגע, מה אנחנו עושים, ומתי תשמעו מאיתנו שוב."
  },
  pitfalls: [
    { en: "The IC writing the status page while also running the incident: both suffer.", he: "ה-IC כותב את ה-status page ובמקביל מנהל את האינסידנט: שניהם נפגעים." },
    { en: "Promising an ETA ('back in 10 minutes') instead of a next-update time, then missing it.", he: "להבטיח ETA ('חוזרים תוך 10 דקות') במקום שעת עדכון הבא, ואז לפספס אותו." },
    { en: "Naming a root cause or blaming a vendor publicly before it's confirmed.", he: "לציין root cause או להאשים ספק בפומבי לפני שזה אושר." },
    { en: "Hosting the status page on the same infrastructure that's down.", he: "לארח את ה-status page על אותה תשתית שנפלה." }
  ],
  interview: [
    { q: { en: "It's 20 minutes into an outage and you still don't know the cause. What do you post?", he: "עברו 20 דקות מתחילת השבתה ועדיין לא יודעים מה הסיבה. מה מפרסמים?" },
      a: { en: "Post anyway: the user-visible symptom and scope, that we're investigating, any workaround, and a specific next-update time (e.g., 30 minutes). Not knowing the cause is fine; silence is not.", he: "מפרסמים בכל זאת: הסימפטום שהמשתמשים רואים וההיקף, שאנחנו חוקרים, workaround אם יש, ושעה ספציפית לעדכון הבא (למשל 30 דקות). לא לדעת את הסיבה זה בסדר; שתיקה — לא." } },
    { q: { en: "How does a customer-facing RFO differ from an internal postmortem?", he: "במה RFO ללקוחות שונה מ-postmortem פנימי?" },
      a: { en: "The RFO is shorter, uses customer language, focuses on impact, high-level cause and concrete commitments, and is legally reviewed. The internal postmortem has full technical detail, contributing factors, timelines with names of systems (not people), and all action items.", he: "ה-RFO קצר יותר, בשפה של הלקוח, מתמקד בהשפעה, בסיבה ברמה גבוהה ובהתחייבויות קונקרטיות, ועובר review משפטי. ה-postmortem הפנימי כולל את כל הפירוט הטכני, הגורמים התורמים, timeline עם שמות מערכות (לא אנשים), וכל ה-action items." } }
  ],
  quiz: [
    { q: { en: "Which element is MOST important to include in every status page update?", he: "איזה רכיב הכי חשוב לכלול בכל עדכון ב-status page?" },
      options: [
        { en: "The internal root cause", he: "ה-root cause הפנימי" },
        { en: "The name of the on-call engineer", he: "השם של מהנדס ה-on-call" },
        { en: "When the next update will be posted", he: "מתי יפורסם העדכון הבא" },
        { en: "A guaranteed resolution ETA", he: "ETA מובטח לפתרון" }
      ], answer: 2,
      explain: { en: "A committed next-update time (that you keep) is what builds trust. ETAs and root causes are often wrong early on.", he: "שעת עדכון הבא שהתחייבת אליה (ועמדת בה) היא מה שבונה אמון. ETA ו-root cause לרוב שגויים בשלבים המוקדמים." } },
    { q: { en: "You suspect your cloud provider. What should the first public update say?", he: "אתה חושד בספק הענן. מה העדכון הפומבי הראשון צריך להגיד?" },
      options: [
        { en: "\"AWS is down, not our fault\"", he: "\"AWS נפל, זה לא אצלנו\"" },
        { en: "\"We're seeing errors from an upstream provider and are working to mitigate\"", he: "\"אנחנו רואים שגיאות מספק upstream ועובדים על mitigation\"" },
        { en: "Nothing until the provider confirms", he: "כלום עד שהספק מאשר" },
        { en: "\"Root cause: provider outage\"", he: "\"Root cause: השבתה אצל הספק\"" }
      ], answer: 1,
      explain: { en: "Acknowledge impact quickly without unconfirmed blame. Your customers' contract is with you, not your provider.", he: "מודים בהשפעה מהר בלי האשמה לא מאומתת. החוזה של הלקוחות הוא איתך, לא עם הספק שלך." } },
    { q: { en: "Under GDPR Article 33, how long do you have to notify the supervisory authority of a personal data breach?", he: "לפי סעיף 33 של GDPR, כמה זמן יש לך להודיע לרשות הפיקוח על דליפת מידע אישי?" },
      options: [
        { en: "24 hours from the incident start", he: "24 שעות מתחילת האירוע" },
        { en: "72 hours from becoming aware of it", he: "72 שעות מרגע שנודע לך" },
        { en: "4 business days", he: "4 ימי עסקים" },
        { en: "30 days", he: "30 יום" }
      ], answer: 1,
      explain: { en: "72 hours from awareness (with a documented reason if late). 4 business days is the SEC 8-K rule; 24 h is NIS2's early warning.", he: "72 שעות מרגע המודעות (עם נימוק מתועד אם מאחרים). 4 ימי עסקים זה כלל ה-8-K של ה-SEC; 24 שעות זו ההתרעה המוקדמת של NIS2." } }
  ],
  related: ["rel-incident-management", "rel-runbooks-oncall", "flow-alert-to-postmortem", "rel-sli-slo-sla"]
});

INFRA.lessons.push({
  id: "rel-dependency-analysis",
  track: "reliability",
  order: 33,
  icon: "🕸️",
  level: 3,
  minutes: 14,
  title: { en: "Finding SPOFs: Dependency Analysis & FMEA", he: "למצוא SPOF-ים: ניתוח תלויות ו-FMEA" },
  tldr: {
    en: "Your availability is capped by the product of everything you depend on in series — including the boring stuff nobody draws (DNS, IAM/STS, the auth provider, the container registry, NTP). Map dependencies, score failure modes with FMEA, and design each dependency's degrade mode so the data plane keeps working when the control plane doesn't.",
    he: "הזמינות שלך מוגבלת למכפלה של כל מה שאתה תלוי בו בטור — כולל הדברים המשעממים שאף אחד לא מצייר (DNS, IAM/STS, ספק ה-auth, ה-container registry, NTP). ממפים תלויות, מדרגים failure modes עם FMEA, ומתכננים degrade mode לכל תלות כך שה-data plane ימשיך לעבוד גם כשה-control plane לא."
  },
  analogy: {
    en: "A wedding. You planned two caterers and backup generators, but the whole thing still collapses because the only road to the venue is closed, or the one person with the hall keys is stuck abroad. SPOFs are rarely the things you thought about; they're the assumptions you didn't know you were making.",
    he: "חתונה. תכננת שני קייטרינגים וגנרטורים לגיבוי, אבל הכל עדיין קורס כי הכביש היחיד לאולם חסום, או שהבן אדם היחיד עם המפתחות לאולם תקוע בחו\"ל. SPOF-ים הם כמעט אף פעם לא הדברים שחשבת עליהם; הם ההנחות שלא ידעת שאתה מניח."
  },
  sections: [
    {
      h: { en: "Availability math: serial vs parallel", he: "מתמטיקת זמינות: בטור מול במקביל" },
      body: {
        en: `<p><strong>Serial</strong> (request needs A <em>and</em> B <em>and</em> C): multiply availabilities.</p>
<pre>A_total = A1 × A2 × ... × An

checkout → API GW (99.99) → auth (99.95) → payments (99.9) → Postgres (99.95) → PSP (99.9)
= 0.9999 × 0.9995 × 0.999 × 0.9995 × 0.999 ≈ 0.9969  → 99.69%  (~27 h downtime/year)
Five "three-nines-ish" hops ≈ two and a half nines.</pre>
<p><strong>Parallel / redundant</strong> (works if <em>any</em> replica works): multiply the unavailabilities.</p>
<pre>A_total = 1 − (1 − A)^n

two independent replicas at 99%:   1 − 0.01²  = 99.99%
three AZs at 99.9% each:           1 − 0.001³ = 99.9999999%  (on paper!)</pre>
<p>The "on paper" matters. Parallel math assumes <strong>independent failures</strong>. Replicas sharing a deploy pipeline, a config push, a DNS name, a region, a kernel bug or a certificate fail <em>together</em>. Real redundancy is usually limited by the common-mode failure, not the replica count.</p>
<table><tr><th>Availability</th><th>Downtime / year</th><th>Downtime / 30 days</th></tr>
<tr><td>99%</td><td>3.65 days</td><td>7.2 h</td></tr>
<tr><td>99.9%</td><td>8.76 h</td><td>43.2 min</td></tr>
<tr><td>99.95%</td><td>4.38 h</td><td>21.6 min</td></tr>
<tr><td>99.99%</td><td>52.6 min</td><td>4.3 min</td></tr></table>
<blockquote>💡 Real world: this is why a service can't promise a higher SLO than its critical serial dependencies allow. If your auth provider's SLA is 99.9%, a 99.99% SLO for login is fiction — unless you design login to survive the provider being down (cached sessions, offline token validation).</blockquote>`,
        he: `<p><strong>בטור</strong> (הבקשה צריכה את A <em>וגם</em> B <em>וגם</em> C): מכפילים את הזמינויות.</p>
<pre>A_total = A1 × A2 × ... × An

checkout → API GW (99.99) → auth (99.95) → payments (99.9) → Postgres (99.95) → PSP (99.9)
= 0.9999 × 0.9995 × 0.999 × 0.9995 × 0.999 ≈ 0.9969  → 99.69%  (~27 h downtime/year)
Five "three-nines-ish" hops ≈ two and a half nines.</pre>
<p><strong>במקביל / redundant</strong> (עובד אם <em>לפחות</em> replica אחת עובדת): מכפילים את אי-הזמינויות.</p>
<pre>A_total = 1 − (1 − A)^n

two independent replicas at 99%:   1 − 0.01²  = 99.99%
three AZs at 99.9% each:           1 − 0.001³ = 99.9999999%  (on paper!)</pre>
<p>ה"על הנייר" חשוב. המתמטיקה של מקביל מניחה <strong>כשלים בלתי תלויים</strong>. replicas שחולקות deploy pipeline, דחיפת config, שם DNS, region, באג ב-kernel או certificate נופלות <em>ביחד</em>. redundancy אמיתית מוגבלת בדרך כלל על ידי ה-common-mode failure, לא על ידי מספר ה-replicas.</p>
<table><tr><th>זמינות</th><th>Downtime בשנה</th><th>Downtime ב-30 יום</th></tr>
<tr><td>99%</td><td>3.65 ימים</td><td>7.2 שעות</td></tr>
<tr><td>99.9%</td><td>8.76 שעות</td><td>43.2 דקות</td></tr>
<tr><td>99.95%</td><td>4.38 שעות</td><td>21.6 דקות</td></tr>
<tr><td>99.99%</td><td>52.6 דקות</td><td>4.3 דקות</td></tr></table>
<blockquote>💡 Real world: בגלל זה שירות לא יכול להבטיח SLO גבוה ממה שהתלויות הקריטיות שלו בטור מאפשרות. אם ה-SLA של ספק ה-auth שלך הוא 99.9%, SLO של 99.99% ל-login הוא פנטזיה — אלא אם תתכנן את ה-login לשרוד נפילה של הספק (sessions ב-cache, אימות token בלי לפנות לספק).</blockquote>`
      }
    },
    {
      h: { en: "Dependency mapping: draw the real graph", he: "מיפוי תלויות: לצייר את הגרף האמיתי" },
      body: {
        en: `<p>Architecture diagrams show what people <em>intended</em>. Build the real graph from evidence:</p>
<ul>
<li><strong>Traces</strong>: Jaeger/Tempo service graphs, or the <code>servicegraph</code> connector in the OTel Collector, show actual call edges and error rates.</li>
<li><strong>Network flows</strong>: VPC Flow Logs, Cilium Hubble, Istio/Kiali — catch calls that aren't traced (legacy, third-party SDKs).</li>
<li><strong>DNS query logs</strong>: Route 53 Resolver query logs or CoreDNS logs list every hostname you resolve — the best way to find external dependencies nobody declared.</li>
<li><strong>Startup path</strong>: what must be reachable for a pod to <em>start</em>? (registry, secrets manager, config service, IAM/STS, license server). Often different from the request path.</li>
<li><strong>Humans and processes</strong>: deploys need CI + registry + Git host; incident response needs Slack, PagerDuty, SSO, VPN.</li>
</ul>
<p>Classify each edge: <strong>hard</strong> (request fails without it), <strong>soft</strong> (degraded but works), <strong>async</strong> (queue absorbs outages), <strong>startup-only</strong>, <strong>control-plane only</strong>.</p>
<pre>$ dig +short @169.254.169.253 ... # or, better, analyze resolver logs:
$ zcat resolver-query-logs/*.gz | jq -r '.query_name' | sort | uniq -c | sort -rn | head
 812331 payments-db.internal.example.
 402119 sts.eu-west-1.amazonaws.com.
 233871 secretsmanager.eu-west-1.amazonaws.com.
  91002 api.stripe.com.
  40511 hooks.slack.com.            ← in the request path?! (sync alert on every refund)
  12090 sts.amazonaws.com.          ← global STS endpoint = us-east-1 dependency</pre>
<blockquote>💡 Real world: Facebook's 4 October 2021 outage: a BGP withdrawal made their DNS unreachable — and the internal tools, remote access and even badge systems engineers needed to fix it depended on the same network. The recovery path shared the failure domain.</blockquote>`,
        he: `<p>דיאגרמות ארכיטקטורה מראות מה אנשים <em>התכוונו</em>. בונים את הגרף האמיתי מראיות:</p>
<ul>
<li><strong>Traces</strong>: ה-service graphs של Jaeger או Tempo, או ה-connector <code>servicegraph</code> ב-OTel Collector, מראים קשתות קריאה אמיתיות ואחוזי שגיאות.</li>
<li><strong>Network flows</strong>: VPC Flow Logs, Cilium Hubble, Istio עם Kiali — תופסים קריאות שאין להן traces (legacy, SDK-ים של צד שלישי).</li>
<li><strong>לוגים של שאילתות DNS</strong>: ה-query logs של Route 53 Resolver או לוגים של CoreDNS מראים כל hostname שאתה עושה לו resolve — הדרך הכי טובה למצוא תלויות חיצוניות שאף אחד לא הצהיר עליהן.</li>
<li><strong>מסלול ה-startup</strong>: מה חייב להיות נגיש כדי ש-Pod <em>יעלה</em>? (registry, secrets manager, שירות config, IAM/STS, שרת רישוי). לרוב שונה ממסלול הבקשה.</li>
<li><strong>אנשים ותהליכים</strong>: deploy צריך CI, registry ו-Git host; טיפול באינסידנט צריך Slack, PagerDuty, SSO, VPN.</li>
</ul>
<p>מסווגים כל קשת: <strong>hard</strong> (הבקשה נכשלת בלעדיה), <strong>soft</strong> (פגיעה, אבל עובד), <strong>async</strong> (תור סופג השבתות), <strong>startup-only</strong>, <strong>control-plane only</strong>.</p>
<pre>$ dig +short @169.254.169.253 ... # or, better, analyze resolver logs:
$ zcat resolver-query-logs/*.gz | jq -r '.query_name' | sort | uniq -c | sort -rn | head
 812331 payments-db.internal.example.
 402119 sts.eu-west-1.amazonaws.com.
 233871 secretsmanager.eu-west-1.amazonaws.com.
  91002 api.stripe.com.
  40511 hooks.slack.com.            ← in the request path?! (sync alert on every refund)
  12090 sts.amazonaws.com.          ← global STS endpoint = us-east-1 dependency</pre>
<blockquote>💡 Real world: ההשבתה של Facebook ב-4 באוקטובר 2021: withdrawal של BGP הפך את ה-DNS שלהם לבלתי נגיש — וגם הכלים הפנימיים, הגישה מרחוק ואפילו מערכות הכרטיסים שהמהנדסים היו צריכים כדי לתקן היו תלויים באותה רשת. מסלול ההתאוששות חלק את אותו failure domain.</blockquote>`
      }
    },
    {
      h: { en: "FMEA: a worked example", he: "FMEA: דוגמה מלאה" },
      body: {
        en: `<p><strong>Failure Mode and Effects Analysis</strong> comes from aerospace/automotive. For each component, list how it can fail, the effect, and score 1-10: <strong>Severity (S)</strong>, <strong>Occurrence (O)</strong> likelihood, <strong>Detection (D)</strong> (10 = we'd never notice). <strong>RPN = S × O × D</strong> ranks what to fix first.</p>
<table><tr><th>Component</th><th>Failure mode</th><th>Effect</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Mitigation</th></tr>
<tr><td>Internal mTLS CA</td><td>Issuer cert expires</td><td>All service-to-service calls fail within 24 h</td><td>10</td><td>3</td><td>8</td><td><strong>240</strong></td><td>cert-manager + expiry alert, yearly rotation drill</td></tr>
<tr><td>Container registry</td><td>Unavailable / rate-limited</td><td>No scale-out, no new nodes, deploys blocked</td><td>7</td><td>4</td><td>6</td><td><strong>168</strong></td><td>Pull-through cache in-region, pre-pulled images</td></tr>
<tr><td>Auth provider (SaaS IdP)</td><td>Outage</td><td>New logins fail; existing sessions OK</td><td>8</td><td>3</td><td>3</td><td>72</td><td>Longer session TTL, local JWKS cache</td></tr>
<tr><td>Postgres primary</td><td>Instance failure</td><td>~60 s writes fail during failover</td><td>8</td><td>3</td><td>2</td><td>48</td><td>Multi-AZ, client retries with backoff</td></tr>
<tr><td>Feature flag service</td><td>Timeout</td><td>Every request waits 2 s for flags</td><td>6</td><td>4</td><td>5</td><td>120</td><td>Local cache + defaults, 50 ms timeout</td></tr>
<tr><td>NTP</td><td>Clock drift on nodes</td><td>TLS "not yet valid", JWT rejects, SigV4 skew errors</td><td>7</td><td>2</td><td>8</td><td>112</td><td>chrony + Amazon Time Sync, alert on offset</td></tr></table>
<p>Notice how <strong>Detection</strong> pushes the "boring" items up: the Postgres failover is severe but well-detected and well-rehearsed; the CA expiry is rare but invisible until it detonates.</p>
<blockquote>⚠️ Production tip: don't argue over 6 vs 7. FMEA's value is the conversation — forcing a team to enumerate failure modes per dependency. Re-run it in design reviews for new dependencies and after every incident ("was this failure mode on our list?").</blockquote>`,
        he: `<p><strong>Failure Mode and Effects Analysis</strong> מגיע מתעשיית התעופה והרכב. לכל רכיב רושמים איך הוא יכול להיכשל, מה ההשפעה, ומדרגים 1-10: <strong>Severity (S)</strong> חומרה, <strong>Occurrence (O)</strong> סבירות, <strong>Detection (D)</strong> זיהוי (10 = לא היינו שמים לב). <strong>RPN = S × O × D</strong> מדרג מה לתקן קודם.</p>
<table><tr><th>רכיב</th><th>Failure mode</th><th>השפעה</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Mitigation</th></tr>
<tr><td>CA פנימי ל-mTLS</td><td>ה-issuer cert פג</td><td>כל הקריאות בין שירותים נכשלות תוך 24 שעות</td><td>10</td><td>3</td><td>8</td><td><strong>240</strong></td><td>cert-manager ו-alert על תפוגה, drill רוטציה שנתי</td></tr>
<tr><td>Container registry</td><td>לא זמין או rate-limited</td><td>אין scale-out, אין nodes חדשים, deploys חסומים</td><td>7</td><td>4</td><td>6</td><td><strong>168</strong></td><td>pull-through cache באותו region, images שנמשכו מראש</td></tr>
<tr><td>ספק auth (IdP ב-SaaS)</td><td>השבתה</td><td>logins חדשים נכשלים; sessions קיימים בסדר</td><td>8</td><td>3</td><td>3</td><td>72</td><td>TTL ארוך יותר ל-session, cache מקומי ל-JWKS</td></tr>
<tr><td>Postgres primary</td><td>כשל instance</td><td>כ-60 שניות של כתיבות שנכשלות בזמן failover</td><td>8</td><td>3</td><td>2</td><td>48</td><td>Multi-AZ, retries עם backoff בצד הלקוח</td></tr>
<tr><td>שירות feature flags</td><td>Timeout</td><td>כל בקשה מחכה 2 שניות ל-flags</td><td>6</td><td>4</td><td>5</td><td>120</td><td>cache מקומי וברירות מחדל, timeout של 50ms</td></tr>
<tr><td>NTP</td><td>סטיית שעון ב-nodes</td><td>TLS "not yet valid", דחיות JWT, שגיאות skew של SigV4</td><td>7</td><td>2</td><td>8</td><td>112</td><td>chrony ו-Amazon Time Sync, alert על offset</td></tr></table>
<p>שים לב איך ה-<strong>Detection</strong> דוחף את הפריטים ה"משעממים" למעלה: ה-failover של Postgres חמור אבל מזוהה היטב ומתורגל; התפוגה של ה-CA נדירה אבל בלתי נראית עד שהיא מתפוצצת.</p>
<blockquote>⚠️ Production tip: אל תתווכח על 6 מול 7. הערך של FMEA הוא השיחה — להכריח צוות למנות failure modes לכל תלות. תריץ את זה שוב ב-design reviews לתלויות חדשות ואחרי כל אינסידנט ("האם ה-failure mode הזה היה ברשימה שלנו?").</blockquote>`
      }
    },
    {
      h: { en: "Hidden dependencies everyone forgets", he: "תלויות נסתרות שכולם שוכחים" },
      body: {
        en: `<table><tr><th>Dependency</th><th>How it bites</th><th>Defense</th></tr>
<tr><td><strong>DNS</strong></td><td>Resolver overload, CoreDNS crash, provider outage; the October 2025 us-east-1 incident started with a DNS automation bug that emptied DynamoDB's regional endpoint record, and cascaded through services built on it</td><td>NodeLocal DNSCache, sane ndots, multiple providers for public zones, serve-stale</td></tr>
<tr><td><strong>IAM / STS</strong></td><td>Global endpoint <code>sts.amazonaws.com</code> is served from us-east-1; IAM <em>control plane</em> (create/modify roles) lives in us-east-1; credential refresh failing = pods lose access after token expiry</td><td>Regional STS endpoints (<code>AWS_STS_REGIONAL_ENDPOINTS=regional</code>, default in new SDKs), no IAM changes in the recovery path</td></tr>
<tr><td><strong>Auth provider</strong></td><td>Okta/Auth0/Entra outage blocks logins for customers <em>and</em> your engineers (SSO to AWS console, Grafana, Slack)</td><td>Cached JWKS, longer sessions, break-glass accounts outside SSO</td></tr>
<tr><td><strong>CI/CD + Git host</strong></td><td>GitHub Actions down = you can't ship the fix</td><td>Documented manual deploy path, tested quarterly</td></tr>
<tr><td><strong>Container registry</strong></td><td>Docker Hub rate limits, ECR regional issue — autoscaling launches nodes that can't pull images</td><td>Pull-through cache / mirror in-region, <code>imagePullPolicy: IfNotPresent</code>, pinned digests</td></tr>
<tr><td><strong>NTP / time</strong></td><td>Skew breaks TLS validity, JWT <code>exp</code>/<code>nbf</code>, Kerberos (5 min default tolerance), AWS SigV4 (requests rejected beyond ~15 min skew)</td><td>chrony with a reliable source (169.254.169.123 on AWS), alert on offset &gt; 100 ms</td></tr>
<tr><td><strong>Secrets manager / KMS</strong></td><td>Pods fetch secrets at startup: KMS throttling or outage = nothing new starts</td><td>Cache secrets, stagger restarts, quota headroom</td></tr></table>
<blockquote>💡 Real world: after big us-east-1 events, many teams discovered they were "multi-region" for their own services but single-region for the control planes, consoles, SSO and CI that their failover runbook needed.</blockquote>`,
        he: `<table><tr><th>תלות</th><th>איך זה נושך</th><th>הגנה</th></tr>
<tr><td><strong>DNS</strong></td><td>עומס על ה-resolver, CoreDNS קורס, השבתה אצל הספק; האירוע ב-us-east-1 באוקטובר 2025 התחיל בבאג באוטומציה של DNS שרוקן את הרשומה של ה-endpoint האזורי של DynamoDB, ומשם התגלגל לשירותים שבנויים עליו</td><td>NodeLocal DNSCache, ndots שפוי, כמה ספקים ל-zones ציבוריים, serve-stale</td></tr>
<tr><td><strong>IAM / STS</strong></td><td>ה-endpoint הגלובלי <code>sts.amazonaws.com</code> מוגש מ-us-east-1; ה-<em>control plane</em> של IAM (יצירה ושינוי של roles) יושב ב-us-east-1; כשל ברענון credentials = Pod-ים מאבדים גישה כשה-token פג</td><td>STS endpoints אזוריים (<code>AWS_STS_REGIONAL_ENDPOINTS=regional</code>, ברירת מחדל ב-SDK-ים חדשים), בלי שינויי IAM במסלול ההתאוששות</td></tr>
<tr><td><strong>ספק auth</strong></td><td>השבתה של Okta, Auth0 או Entra חוסמת logins ללקוחות <em>וגם</em> למהנדסים שלך (SSO לקונסולת AWS, ל-Grafana, ל-Slack)</td><td>JWKS ב-cache, sessions ארוכים יותר, חשבונות break-glass מחוץ ל-SSO</td></tr>
<tr><td><strong>CI/CD ו-Git host</strong></td><td>GitHub Actions למטה = אתה לא יכול לשחרר את התיקון</td><td>מסלול deploy ידני מתועד שנבדק כל רבעון</td></tr>
<tr><td><strong>Container registry</strong></td><td>rate limits של Docker Hub, בעיה אזורית ב-ECR — ה-autoscaling מעלה nodes שלא מצליחים למשוך images</td><td>pull-through cache או mirror באותו region, <code>imagePullPolicy: IfNotPresent</code>, digests נעוצים</td></tr>
<tr><td><strong>NTP / זמן</strong></td><td>skew שובר תוקף TLS, את <code>exp</code> ו-<code>nbf</code> של JWT, את Kerberos (סבילות ברירת מחדל של 5 דקות), את AWS SigV4 (בקשות נדחות מעבר ל-skew של כ-15 דקות)</td><td>chrony עם מקור אמין (169.254.169.123 ב-AWS), alert על offset מעל 100ms</td></tr>
<tr><td><strong>Secrets manager / KMS</strong></td><td>Pod-ים מושכים secrets ב-startup: throttling או השבתה של KMS = שום דבר חדש לא עולה</td><td>cache ל-secrets, restarts מדורגים, מרווח ב-quota</td></tr></table>
<blockquote>💡 Real world: אחרי אירועים גדולים ב-us-east-1, הרבה צוותים גילו שהם "multi-region" לשירותים של עצמם, אבל single-region ל-control planes, לקונסולות, ל-SSO ול-CI שה-runbook של ה-failover שלהם היה צריך.</blockquote>`
      }
    },
    {
      h: { en: "Static stability and degrade modes per dependency", he: "Static stability ו-degrade mode לכל תלות" },
      body: {
        en: `<p><strong>Static stability</strong> (the AWS Builders' Library term): a system is statically stable if it keeps working, <em>without making changes</em>, when a dependency fails. Concretely:</p>
<ul>
<li><strong>Pre-provision instead of react</strong>: run 3 AZs with enough capacity that losing one AZ needs no scaling (150% of peak spread over 3 AZs → 100% with 2 left). Autoscaling during an outage depends on the very control planes that are struggling.</li>
<li><strong>Data plane independent of control plane</strong>: EC2 instances keep running when the EC2 API is down; your service mesh should keep routing with the last-known config when istiod is down; pods should keep serving when the API server is unreachable.</li>
<li><strong>Push, don't pull at request time</strong>: config, flags and secrets cached locally with last-known-good fallback.</li>
</ul>
<p>Then write a <strong>degrade-mode table</strong> — for each dependency, what the product does when it's gone:</p>
<table><tr><th>Dependency down</th><th>Degrade mode</th><th>Mechanism</th></tr>
<tr><td>Recommendations</td><td>Show bestsellers list</td><td>Timeout 150 ms → static fallback</td></tr>
<tr><td>Feature flags</td><td>Last-known flags, else safe defaults</td><td>Local cache, SDK bootstrap file</td></tr>
<tr><td>Fraud scoring</td><td>Allow orders &lt; €100, queue the rest for review</td><td>Circuit breaker + policy</td></tr>
<tr><td>Email provider</td><td>Queue and send later</td><td>Async outbox</td></tr>
<tr><td>Search cluster</td><td>Category browsing only</td><td>UI hides search box via flag</td></tr>
<tr><td>Payment provider A</td><td>Fail over to provider B for card payments</td><td>Routing in payment gateway</td></tr></table>
<blockquote>⚠️ Production tip: a degrade mode that's never exercised doesn't work. Test each one in staging with fault injection (block the dependency with a NetworkPolicy or a Toxiproxy toxic) and, once confident, in production game days.</blockquote>`,
        he: `<p><strong>Static stability</strong> (המונח מה-Builders' Library של AWS): מערכת היא statically stable אם היא ממשיכה לעבוד, <em>בלי לבצע שינויים</em>, כשתלות נכשלת. בפועל:</p>
<ul>
<li><strong>להקצות מראש במקום להגיב</strong>: להריץ 3 AZs עם מספיק capacity כך שאיבוד AZ אחד לא דורש scaling (150% מה-peak על פני 3 AZs = 100% כשנשארו 2). autoscaling בזמן השבתה תלוי בדיוק ב-control planes שמתקשים.</li>
<li><strong>Data plane בלתי תלוי ב-control plane</strong>: instances של EC2 ממשיכים לרוץ כשה-API של EC2 למטה; ה-service mesh צריך להמשיך לנתב עם ה-config האחרון הידוע כש-istiod למטה; Pod-ים צריכים להמשיך לשרת כשה-API server לא נגיש.</li>
<li><strong>לדחוף, לא למשוך בזמן הבקשה</strong>: config, flags ו-secrets שמורים מקומית עם fallback ל-last-known-good.</li>
</ul>
<p>אחר כך כותבים <strong>טבלת degrade modes</strong> — לכל תלות, מה המוצר עושה כשהיא נעלמת:</p>
<table><tr><th>תלות למטה</th><th>Degrade mode</th><th>מנגנון</th></tr>
<tr><td>Recommendations</td><td>מציגים רשימת רבי-מכר</td><td>timeout של 150ms ואז fallback סטטי</td></tr>
<tr><td>Feature flags</td><td>ה-flags האחרונים הידועים, אחרת ברירות מחדל בטוחות</td><td>cache מקומי, קובץ bootstrap ל-SDK</td></tr>
<tr><td>Fraud scoring</td><td>מאשרים הזמנות מתחת ל-€100, את השאר שמים בתור לבדיקה</td><td>circuit breaker ומדיניות</td></tr>
<tr><td>ספק מיילים</td><td>שמים בתור ושולחים אחר כך</td><td>async outbox</td></tr>
<tr><td>Search cluster</td><td>רק דפדוף בקטגוריות</td><td>ה-UI מסתיר את תיבת החיפוש דרך flag</td></tr>
<tr><td>ספק תשלומים A</td><td>failover לספק B לתשלומי כרטיס</td><td>ניתוב ב-payment gateway</td></tr></table>
<blockquote>⚠️ Production tip: degrade mode שאף פעם לא הופעל לא עובד. תבדוק כל אחד ב-staging עם fault injection (לחסום את התלות עם NetworkPolicy או toxic של Toxiproxy) וכשאתה בטוח — גם ב-game days ב-production.</blockquote>`
      }
    }
  ],
  diagram: "user -> CDN -> LB -> API -> [auth*, payments -> PSP*, flags (soft), recs (soft)] -> Postgres\n  hidden: DNS, STS/IAM, registry (startup), secrets/KMS (startup), NTP, CI (deploy path)\n  serial A = product; parallel A = 1 - (1-A)^n (only if independent)",
  handsOn: [
    { cmd: "python3 -c \"import math; deps=[0.9999,0.9995,0.999,0.9995,0.999]; a=math.prod(deps); print(f'{a:.5f} -> {(1-a)*8760:.1f} h/yr')\"", what: { en: "Compute the serial availability of a request path and the yearly downtime it implies.", he: "לחשב את הזמינות בטור של מסלול בקשה ואת ה-downtime השנתי שנגזר ממנה." } },
    { cmd: "kubectl get pods -A -o jsonpath='{range .items[*]}{.spec.containers[*].image}{\"\\n\"}{end}' | cut -d/ -f1 | sort | uniq -c | sort -rn", what: { en: "List the registries your cluster pulls from — each one is a startup dependency.", he: "לרשום את ה-registries שה-cluster מושך מהם — כל אחד מהם הוא תלות של startup." } },
    { cmd: "chronyc tracking | grep -E 'Reference|System time|Leap'", what: { en: "Check the node's time source and current offset; alert if it drifts beyond ~100 ms.", he: "לבדוק את מקור הזמן של ה-node ואת ה-offset הנוכחי; alert אם הוא סוטה מעבר לכ-100ms." } },
    { cmd: "kubectl exec deploy/api -- env | grep -i AWS_STS_REGIONAL_ENDPOINTS", what: { en: "Verify workloads use regional STS endpoints rather than the global us-east-1 one.", he: "לוודא שה-workloads משתמשים ב-STS endpoints אזוריים ולא ב-endpoint הגלובלי של us-east-1." } }
  ],
  mnemonic: {
    en: "\"Series multiplies the risk, parallel divides it — only if they don't fail together.\" And: \"If recovery needs it, it's a dependency.\"",
    he: "\"בטור — הסיכון מוכפל, במקביל — הוא מתחלק, רק אם הם לא נופלים ביחד.\" ועוד: \"אם ההתאוששות צריכה את זה, זו תלות.\""
  },
  pitfalls: [
    { en: "Computing parallel availability as if replicas were independent while they share config, deploys, region or certificates.", he: "לחשב זמינות במקביל כאילו ה-replicas בלתי תלויות, כשהן חולקות config, deploys, region או certificates." },
    { en: "Mapping only the request path and forgetting the startup and deploy paths (registry, secrets, CI).", he: "למפות רק את מסלול הבקשה ולשכוח את מסלולי ה-startup וה-deploy (registry, secrets, CI)." },
    { en: "Relying on autoscaling or IAM changes to recover from an outage — those control planes are often impaired at the same time.", he: "לסמוך על autoscaling או שינויי IAM כדי להתאושש מהשבתה — ה-control planes האלה הרבה פעמים פגועים באותו זמן." },
    { en: "Defining degrade modes on paper and never injecting the failure to test them.", he: "להגדיר degrade modes על הנייר ואף פעם לא להזריק את הכשל כדי לבדוק אותם." }
  ],
  interview: [
    { q: { en: "Your service has 6 hard dependencies, each 99.95%. What's the best SLO you can honestly offer, and how would you raise it?", he: "לשירות שלך יש 6 תלויות hard, כל אחת 99.95%. מה ה-SLO הכי טוב שאפשר להציע ביושר, ואיך תעלה אותו?" },
      a: { en: "0.9995^6 ≈ 99.70% before counting your own failures, so ~99.7% at best. Raise it by turning hard dependencies into soft ones (caching, fallbacks, async queues), adding truly independent redundancy (multi-provider, multi-region) and removing dependencies from the request path.", he: "0.9995^6 ≈ 99.70% עוד לפני הכשלים של עצמך, אז בערך 99.7% במקרה הטוב. מעלים על ידי הפיכת תלויות hard ל-soft (caching, fallbacks, תורים אסינכרוניים), הוספת redundancy בלתי תלויה באמת (כמה ספקים, כמה regions) והוצאת תלויות ממסלול הבקשה." } },
    { q: { en: "What is static stability? Give an example.", he: "מה זה static stability? תן דוגמה." },
      a: { en: "The ability to keep operating through a dependency failure without needing to make changes. Example: provisioning 3 AZs at 150% so losing an AZ needs no scaling, or a service mesh data plane that keeps routing with last-known config when the control plane is down.", he: "היכולת להמשיך לפעול בזמן כשל של תלות בלי צורך לבצע שינויים. דוגמה: להקצות 3 AZs ב-150% כך שאיבוד AZ לא דורש scaling, או data plane של service mesh שממשיך לנתב עם ה-config האחרון הידוע כשה-control plane למטה." } }
  ],
  quiz: [
    { q: { en: "A request path has three serial dependencies at 99.9% each. What's the combined availability?", he: "למסלול בקשה יש שלוש תלויות בטור של 99.9% כל אחת. מה הזמינות המשולבת?" },
      options: [
        { en: "99.9%", he: "99.9%" },
        { en: "About 99.7%", he: "בערך 99.7%" },
        { en: "99.999%", he: "99.999%" },
        { en: "About 97%", he: "בערך 97%" }
      ], answer: 1,
      explain: { en: "0.999³ ≈ 0.997. Serial dependencies multiply, so each added hop lowers availability.", he: "0.999³ ≈ 0.997. תלויות בטור מוכפלות, אז כל hop נוסף מוריד את הזמינות." } },
    { q: { en: "In FMEA, what does a high Detection score mean?", he: "ב-FMEA, מה המשמעות של ציון Detection גבוה?" },
      options: [
        { en: "The failure is easy to detect", he: "קל לזהות את הכשל" },
        { en: "The failure is hard to detect before it causes impact", he: "קשה לזהות את הכשל לפני שהוא גורם נזק" },
        { en: "The failure happens often", he: "הכשל קורה הרבה" },
        { en: "The failure is severe", he: "הכשל חמור" }
      ], answer: 1,
      explain: { en: "Detection is scored so 10 = we'd never notice in time. That's why silent failures (like an expiring CA) rank high in RPN = S × O × D.", he: "Detection מדורג כך ש-10 = לא היינו שמים לב בזמן. בגלל זה כשלים שקטים (כמו CA שעומד לפוג) מדורגים גבוה ב-RPN = S × O × D." } },
    { q: { en: "Why can two replicas at 99% each fail to deliver the theoretical 99.99%?", he: "למה שתי replicas של 99% כל אחת עלולות לא לספק את ה-99.99% התיאורטי?" },
      options: [
        { en: "Because the formula is 99% + 99%", he: "כי הנוסחה היא 99% + 99%" },
        { en: "Because they share common-mode failures (same config push, region, certificate, deploy), so failures aren't independent", he: "כי הן חולקות common-mode failures (אותה דחיפת config, region, certificate, deploy), אז הכשלים לא בלתי תלויים" },
        { en: "Because load balancers add latency", he: "כי load balancers מוסיפים latency" },
        { en: "They always deliver 99.99%", he: "הן תמיד מספקות 99.99%" }
      ], answer: 1,
      explain: { en: "1 − (1 − A)^n holds only for independent failures. Correlated failures cap real-world redundancy.", he: "1 − (1 − A)^n נכון רק לכשלים בלתי תלויים. כשלים מתואמים מגבילים את ה-redundancy בעולם האמיתי." } },
    { q: { en: "Which design is statically stable when the AWS STS global endpoint is impaired?", he: "איזה תכנון הוא statically stable כשה-endpoint הגלובלי של AWS STS פגוע?" },
      options: [
        { en: "Workloads configured to use regional STS endpoints", he: "workloads שמוגדרים להשתמש ב-STS endpoints אזוריים" },
        { en: "Creating new IAM roles during the incident", he: "ליצור IAM roles חדשים בזמן האינסידנט" },
        { en: "Restarting all pods to refresh credentials", he: "לעשות restart לכל ה-Pod-ים כדי לרענן credentials" },
        { en: "Switching to long-lived IAM user access keys mid-incident", he: "לעבור באמצע האינסידנט ל-access keys ארוכי טווח של IAM user" }
      ], answer: 0,
      explain: { en: "Regional STS endpoints remove the us-east-1 dependency in advance. The other options need changes or the impaired control plane during the incident.", he: "STS endpoints אזוריים מסירים מראש את התלות ב-us-east-1. שאר האפשרויות דורשות שינויים או את ה-control plane הפגוע בזמן האינסידנט." } }
  ],
  related: ["rel-ha", "rel-bcdr", "rel-chaos-engineering", "staff-cells-blast-radius", "rel-sli-slo-sla", "net-dns"]
});

INFRA.lessons.push({
  id: "obs-profiling-synthetics",
  track: "observability",
  order: 30,
  icon: "🔬",
  level: 3,
  minutes: 14,
  title: { en: "Continuous Profiling, Synthetic Monitoring & RUM", he: "Continuous Profiling, Synthetic Monitoring ו-RUM" },
  tldr: {
    en: "Metrics, logs and traces tell you THAT something is slow; continuous profiling tells you WHICH line of code burns the CPU. Synthetics tell you the site is broken before users do (even at 3 a.m. with zero traffic), and RUM tells you what real users on real phones actually experienced.",
    he: "מטריקות, לוגים ו-traces אומרים לך ש-משהו איטי; continuous profiling אומר לך איזו שורת קוד שורפת את ה-CPU. Synthetics אומרים לך שהאתר שבור לפני שהמשתמשים מגלים (גם ב-3 בלילה בלי traffic), ו-RUM אומר לך מה משתמשים אמיתיים על טלפונים אמיתיים חוו בפועל."
  },
  analogy: {
    en: "Running a restaurant. Synthetic monitoring is a mystery shopper who orders the same dish every 5 minutes from three different branches: you know immediately if the kitchen is closed. RUM is reading every real customer's receipt timestamps: slow on Fridays, slow for delivery to the far suburbs. Profiling is a camera in the kitchen showing that 40% of the chef's time goes to peeling garlic by hand.",
    he: "מנהל מסעדה. Synthetic monitoring הוא לקוח סמוי שמזמין את אותה מנה כל 5 דקות משלושה סניפים שונים: אתה יודע מיד אם המטבח סגור. RUM זה לקרוא את חותמות הזמן על כל קבלה של לקוח אמיתי: איטי בימי שישי, איטי במשלוחים לפרברים הרחוקים. Profiling זו מצלמה במטבח שמראה ש-40% מהזמן של השף הולך על קילוף שום ביד."
  },
  sections: [
    {
      h: { en: "Continuous profiling in production", he: "Continuous profiling ב-production" },
      body: {
        en: `<p>A profiler samples stack traces (typically ~100 times per second per CPU for CPU profiles) and aggregates them. <strong>Continuous</strong> profiling does this all the time, in production, at ~1-3% overhead, and stores profiles like time series, so you can ask "what was the API doing at 14:05 when p99 spiked?" and diff before/after a deploy.</p>
<table><tr><th>Tool</th><th>How</th><th>Notes</th></tr>
<tr><td><strong>Go pprof</strong></td><td>Built-in; <code>net/http/pprof</code> exposes <code>/debug/pprof/</code></td><td>CPU, heap, goroutine, mutex, block profiles</td></tr>
<tr><td><strong>async-profiler</strong> (JVM)</td><td>Uses <code>perf_events</code> + AsyncGetCallTrace, no safepoint bias</td><td>CPU, alloc, lock, wall-clock; outputs HTML flame graphs / JFR</td></tr>
<tr><td><strong>py-spy</strong> (Python)</td><td>Reads process memory from outside, no code changes</td><td><code>py-spy top</code> / <code>record</code>; works on a live PID</td></tr>
<tr><td><strong>Grafana Pyroscope</strong></td><td>SDK push or Alloy agent (incl. eBPF); stores and queries profiles</td><td>Integrates with Grafana, trace-to-profile links</td></tr>
<tr><td><strong>Parca</strong></td><td>eBPF agent, whole-node, zero instrumentation</td><td>Samples at 19 Hz by default to keep overhead tiny</td></tr>
<tr><td><strong>OpenTelemetry eBPF profiler</strong></td><td>Donated by Elastic (2024); feeds OTel's new profiles signal</td><td>Profiles signal still maturing — check its status before relying on it</td></tr></table>
<pre># Go: grab a 30 s CPU profile from a running service and open the web UI
$ go tool pprof -http=:8080 'http://payments:6060/debug/pprof/profile?seconds=30'
$ go tool pprof -top 'http://payments:6060/debug/pprof/heap'     # who holds memory now

# JVM: 30 s CPU flame graph of PID 4242 (async-profiler 3.x)
$ asprof -d 30 -e cpu -f /tmp/cpu.html 4242
$ asprof -d 30 -e alloc -f /tmp/alloc.html 4242               # allocation hot spots → GC pressure

# Python: live top-like view, then a flame graph
$ py-spy top --pid 1234
$ py-spy record -o profile.svg --pid 1234 --duration 30</pre>
<blockquote>⚠️ Production tip: eBPF profilers need to unwind stacks. Binaries compiled without frame pointers (common for C/C++ and older runtimes) give broken stacks unless the profiler supports DWARF-based unwinding; interpreted/JIT languages need runtime-specific support for symbols. And never expose <code>/debug/pprof</code> on a public port — it leaks internals and can be used to burn CPU.</blockquote>`,
        he: `<p>Profiler דוגם stack traces (בדרך כלל בערך 100 פעמים בשנייה לכל CPU בפרופיל CPU) ומצרף אותם. <strong>Continuous</strong> profiling עושה את זה כל הזמן, ב-production, ב-overhead של בערך 1-3%, ושומר פרופילים כמו time series, כך שאפשר לשאול "מה ה-API עשה ב-14:05 כשה-p99 קפץ?" ולעשות diff לפני ואחרי deploy.</p>
<table><tr><th>כלי</th><th>איך</th><th>הערות</th></tr>
<tr><td><strong>Go pprof</strong></td><td>מובנה; <code>net/http/pprof</code> חושף את <code>/debug/pprof/</code></td><td>פרופילים של CPU, heap, goroutine, mutex, block</td></tr>
<tr><td><strong>async-profiler</strong> (JVM)</td><td>משתמש ב-<code>perf_events</code> וב-AsyncGetCallTrace, בלי safepoint bias</td><td>CPU, alloc, lock, wall-clock; מוציא flame graphs ב-HTML או JFR</td></tr>
<tr><td><strong>py-spy</strong> (Python)</td><td>קורא את זיכרון התהליך מבחוץ, בלי לשנות קוד</td><td><code>py-spy top</code> או <code>record</code>; עובד על PID חי</td></tr>
<tr><td><strong>Grafana Pyroscope</strong></td><td>push מ-SDK או agent של Alloy (כולל eBPF); שומר ומתשאל פרופילים</td><td>משתלב ב-Grafana, קישורים מ-trace לפרופיל</td></tr>
<tr><td><strong>Parca</strong></td><td>agent מבוסס eBPF, על כל ה-node, בלי אינסטרומנטציה</td><td>דוגם ב-19 Hz כברירת מחדל כדי לשמור על overhead זעיר</td></tr>
<tr><td><strong>OpenTelemetry eBPF profiler</strong></td><td>נתרם על ידי Elastic (2024); מזין את ה-profiles signal החדש של OTel</td><td>ה-profiles signal עדיין מתבגר — תבדוק את הסטטוס שלו לפני שאתה נשען עליו</td></tr></table>
<pre># Go: grab a 30 s CPU profile from a running service and open the web UI
$ go tool pprof -http=:8080 'http://payments:6060/debug/pprof/profile?seconds=30'
$ go tool pprof -top 'http://payments:6060/debug/pprof/heap'     # who holds memory now

# JVM: 30 s CPU flame graph of PID 4242 (async-profiler 3.x)
$ asprof -d 30 -e cpu -f /tmp/cpu.html 4242
$ asprof -d 30 -e alloc -f /tmp/alloc.html 4242               # allocation hot spots → GC pressure

# Python: live top-like view, then a flame graph
$ py-spy top --pid 1234
$ py-spy record -o profile.svg --pid 1234 --duration 30</pre>
<blockquote>⚠️ Production tip: profilers מבוססי eBPF צריכים לפרוש את ה-stack. בינאריים שקומפלו בלי frame pointers (נפוץ ב-C/C++ וב-runtimes ישנים) נותנים stacks שבורים, אלא אם ה-profiler תומך ב-unwinding מבוסס DWARF; שפות interpreted ו-JIT צריכות תמיכה ספציפית ל-runtime בשביל symbols. ואף פעם לא לחשוף את <code>/debug/pprof</code> על פורט ציבורי — זה מדליף פנימיות ואפשר לנצל את זה כדי לשרוף CPU.</blockquote>`
      }
    },
    {
      h: { en: "Reading a flame graph", he: "לקרוא flame graph" },
      body: {
        en: `<pre>|                    main.handleCheckout (100%)                               |
|   json.Marshal (38%)          |  db.Query (22%)   | tax.Calculate (31%) |gc|
| reflect.Value (29%) |encode..|  pgx.read..        | regexp.Compile (27%)|  |</pre>
<ul>
<li><strong>Y axis = stack depth</strong>: callers below, callees above (icicle graphs flip this).</li>
<li><strong>X axis is NOT time</strong>: frames are sorted alphabetically and merged; <strong>width = share of samples</strong> (time on CPU for a CPU profile, bytes for an alloc profile).</li>
<li>Look for <strong>wide plateaus at the top</strong> — functions that are themselves burning CPU ("self time"). Above: <code>regexp.Compile</code> at 27% inside <code>tax.Calculate</code> — someone compiles a regex on every request. Hoist it to a package-level variable and you save a quarter of the CPU.</li>
<li><code>json.Marshal</code> → <code>reflect</code> at 29%: reflection-heavy serialization; consider a code-generated encoder or smaller payloads.</li>
<li><strong>Differential flame graphs</strong> (Pyroscope "diff" view): red = grew after the deploy, green = shrank. The fastest way to answer "why did CPU go up 20% after v2.31?".</li>
</ul>
<p>Pick the right profile type for the question:</p>
<table><tr><th>Symptom</th><th>Profile</th></tr>
<tr><td>High CPU, throttling</td><td>CPU (on-CPU)</td></tr>
<tr><td>High latency but low CPU</td><td>Off-CPU / wall-clock (waiting on locks, I/O, network)</td></tr>
<tr><td>GC pauses, memory growth</td><td>Allocation + heap (in-use)</td></tr>
<tr><td>Goroutine/thread pileup</td><td>Goroutine dump / lock (mutex, block) profile</td></tr></table>
<blockquote>💡 Real world: teams routinely cut 20-40% of their compute bill after turning on continuous profiling fleet-wide, because the top few hot spots (JSON, regex, logging, compression, TLS handshakes without session reuse) are similar everywhere and were invisible in metrics.</blockquote>`,
        he: `<pre>|                    main.handleCheckout (100%)                               |
|   json.Marshal (38%)          |  db.Query (22%)   | tax.Calculate (31%) |gc|
| reflect.Value (29%) |encode..|  pgx.read..        | regexp.Compile (27%)|  |</pre>
<ul>
<li><strong>ציר Y = עומק ה-stack</strong>: הקוראים למטה, הנקראים למעלה (icicle graphs הופכים את זה).</li>
<li><strong>ציר X הוא לא זמן</strong>: ה-frames ממוינים לפי א"ב וממוזגים; <strong>רוחב = החלק מה-samples</strong> (זמן על ה-CPU בפרופיל CPU, bytes בפרופיל alloc).</li>
<li>מחפשים <strong>רמות רחבות בחלק העליון</strong> — פונקציות שבעצמן שורפות CPU ("self time"). למעלה: <code>regexp.Compile</code> ב-27% בתוך <code>tax.Calculate</code> — מישהו מקמפל regex בכל בקשה. תעביר את זה למשתנה ברמת ה-package ותחסוך רבע מה-CPU.</li>
<li><code>json.Marshal</code> → <code>reflect</code> ב-29%: serialization שנשען על reflection; כדאי לשקול encoder שנוצר בקוד או payloads קטנים יותר.</li>
<li><strong>Differential flame graphs</strong> (תצוגת ה-"diff" ב-Pyroscope): אדום = גדל אחרי ה-deploy, ירוק = קטן. הדרך הכי מהירה לענות על "למה ה-CPU עלה ב-20% אחרי v2.31?".</li>
</ul>
<p>בוחרים את סוג הפרופיל לפי השאלה:</p>
<table><tr><th>סימפטום</th><th>פרופיל</th></tr>
<tr><td>CPU גבוה, throttling</td><td>CPU (on-CPU)</td></tr>
<tr><td>latency גבוה אבל CPU נמוך</td><td>Off-CPU או wall-clock (המתנה ל-locks, I/O, רשת)</td></tr>
<tr><td>GC pauses, זיכרון שגדל</td><td>Allocation ו-heap (in-use)</td></tr>
<tr><td>הצטברות goroutines או threads</td><td>goroutine dump או פרופיל lock (mutex, block)</td></tr></table>
<blockquote>💡 Real world: צוותים מורידים באופן קבוע 20-40% מחשבון ה-compute אחרי שהם מדליקים continuous profiling על כל הצי, כי ה-hot spots המובילים (JSON, regex, logging, דחיסה, TLS handshakes בלי session reuse) דומים בכל מקום והיו בלתי נראים במטריקות.</blockquote>`
      }
    },
    {
      h: { en: "Synthetic monitoring: probes and browser journeys", he: "Synthetic monitoring: probes ומסעות בדפדפן" },
      body: {
        en: `<p>Synthetics run scripted checks from outside, on a schedule, from multiple locations. They work when there's <strong>no traffic</strong> (night, new region, a broken DNS record that sends users nowhere — your server-side metrics just go quiet).</p>
<p><strong>Level 1 — protocol probes</strong> with the Prometheus blackbox exporter:</p>
<pre># blackbox.yml
modules:
  http_2xx_json:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_body_not_matches_regexp: ['"status":"ok"']
      preferred_ip_protocol: ip4

# prometheus.yml scrape job (multi-target pattern)
- job_name: blackbox
  metrics_path: /probe
  params: { module: [http_2xx_json] }
  static_configs: [{ targets: ['https://api.example.com/healthz'] }]
  relabel_configs:
    - { source_labels: [__address__], target_label: __param_target }
    - { source_labels: [__param_target], target_label: instance }
    - { target_label: __address__, replacement: blackbox-exporter:9115 }

# alert: failing from at least 2 probe locations for 3 min (avoid one flaky location paging you)
- alert: EndpointDown
  expr: count by (instance) (probe_success == 0) &gt;= 2
  for: 3m</pre>
<p>Useful series: <code>probe_success</code>, <code>probe_duration_seconds</code>, <code>probe_http_status_code</code>, <code>probe_http_duration_seconds{phase="resolve|connect|tls|processing|transfer"}</code> (breaks latency down per phase), <code>probe_ssl_earliest_cert_expiry</code>.</p>
<p><strong>Level 2 — multi-step browser checks</strong>: a real headless browser runs a user journey (login → search → add to cart → checkout with a test card). Tools: Checkly (Playwright), Datadog Synthetics, Grafana Synthetic Monitoring (k6 browser), AWS CloudWatch Synthetics canaries, New Relic.</p>
<pre>// Playwright-style journey (Checkly / k6 browser are very similar)
test('checkout journey', async ({ page }) =&gt; {
  await page.goto('https://shop.example.com');
  await page.getByRole('searchbox').fill('coffee');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByText('Espresso Beans 1kg').click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('https://shop.example.com/checkout');
  await expect(page.getByText('Order summary')).toBeVisible({ timeout: 5000 });
});</pre>
<blockquote>⚠️ Production tip: synthetic users need care: tag their traffic (header or test accounts) so it's excluded from business analytics and fraud models, use a sandbox payment method, and don't let a 1-minute browser check from 10 locations quietly become your most expensive monitoring line item.</blockquote>`,
        he: `<p>Synthetics מריצים בדיקות מתוסרטות מבחוץ, לפי לוח זמנים, מכמה מיקומים. הם עובדים גם כש<strong>אין traffic</strong> (לילה, region חדש, רשומת DNS שבורה ששולחת משתמשים לשום מקום — המטריקות בצד השרת פשוט משתתקות).</p>
<p><strong>רמה 1 — probes ברמת הפרוטוקול</strong> עם blackbox exporter של Prometheus:</p>
<pre># blackbox.yml
modules:
  http_2xx_json:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_body_not_matches_regexp: ['"status":"ok"']
      preferred_ip_protocol: ip4

# prometheus.yml scrape job (multi-target pattern)
- job_name: blackbox
  metrics_path: /probe
  params: { module: [http_2xx_json] }
  static_configs: [{ targets: ['https://api.example.com/healthz'] }]
  relabel_configs:
    - { source_labels: [__address__], target_label: __param_target }
    - { source_labels: [__param_target], target_label: instance }
    - { target_label: __address__, replacement: blackbox-exporter:9115 }

# alert: failing from at least 2 probe locations for 3 min (avoid one flaky location paging you)
- alert: EndpointDown
  expr: count by (instance) (probe_success == 0) &gt;= 2
  for: 3m</pre>
<p>series שימושיים: <code>probe_success</code>, <code>probe_duration_seconds</code>, <code>probe_http_status_code</code>, <code>probe_http_duration_seconds{phase="resolve|connect|tls|processing|transfer"}</code> (מפרק את ה-latency לפי שלב), <code>probe_ssl_earliest_cert_expiry</code>.</p>
<p><strong>רמה 2 — בדיקות דפדפן מרובות שלבים</strong>: דפדפן headless אמיתי מריץ מסע משתמש (login ← חיפוש ← הוספה לעגלה ← checkout עם כרטיס בדיקה). כלים: Checkly (Playwright), Datadog Synthetics, Grafana Synthetic Monitoring (k6 browser), canaries של AWS CloudWatch Synthetics, New Relic.</p>
<pre>// Playwright-style journey (Checkly / k6 browser are very similar)
test('checkout journey', async ({ page }) =&gt; {
  await page.goto('https://shop.example.com');
  await page.getByRole('searchbox').fill('coffee');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByText('Espresso Beans 1kg').click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('https://shop.example.com/checkout');
  await expect(page.getByText('Order summary')).toBeVisible({ timeout: 5000 });
});</pre>
<blockquote>⚠️ Production tip: משתמשים סינתטיים צריכים טיפול: לתייג את ה-traffic שלהם (header או חשבונות בדיקה) כדי שלא ייכנס ל-analytics העסקי ולמודלים של fraud, להשתמש באמצעי תשלום של sandbox, ולא לתת לבדיקת דפדפן כל דקה מ-10 מיקומים להפוך בשקט לשורה הכי יקרה בחשבון המוניטורינג.</blockquote>`
      }
    },
    {
      h: { en: "RUM and Core Web Vitals", he: "RUM ו-Core Web Vitals" },
      body: {
        en: `<p><strong>Real User Monitoring</strong> is JavaScript (or a mobile SDK) in the real client that reports what each user experienced: page loads, errors, long tasks, slow API calls — sliced by country, device, browser, connection type and release.</p>
<p>Google's <strong>Core Web Vitals</strong> (assessed at the <strong>75th percentile</strong> of page loads, separately for mobile and desktop):</p>
<table><tr><th>Metric</th><th>Measures</th><th>Good</th><th>Poor</th></tr>
<tr><td><strong>LCP</strong> Largest Contentful Paint</td><td>Loading: when the main content appears</td><td>≤ 2.5 s</td><td>&gt; 4 s</td></tr>
<tr><td><strong>INP</strong> Interaction to Next Paint</td><td>Responsiveness to clicks/taps/keys (replaced FID in March 2024)</td><td>≤ 200 ms</td><td>&gt; 500 ms</td></tr>
<tr><td><strong>CLS</strong> Cumulative Layout Shift</td><td>Visual stability: content jumping around</td><td>≤ 0.1</td><td>&gt; 0.25</td></tr></table>
<pre>import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name, value: metric.value, rating: metric.rating,   // 'good' | 'needs-improvement' | 'poor'
    id: metric.id, page: location.pathname, release: window.APP_VERSION,
  });
  navigator.sendBeacon('/rum', body);   // survives page unload, unlike fetch() without keepalive
}
onLCP(send); onINP(send); onCLS(send); onTTFB(send);</pre>
<p>RUM also links the front end to the back end: propagate a <code>traceparent</code> header from the browser and a slow click becomes a distributed trace through your API. OpenTelemetry has browser instrumentation; commercial RUM (Datadog, Sentry, New Relic, Grafana Faro, Elastic) does this out of the box.</p>
<blockquote>💡 Real world: your server p99 can be a flat 120 ms while users in India on mid-range Android phones see an LCP of 5 s, because the problem is a 2 MB JavaScript bundle and a hero image without <code>fetchpriority="high"</code> — invisible to every server-side signal. Only RUM shows it.</blockquote>`,
        he: `<p><strong>Real User Monitoring</strong> הוא JavaScript (או SDK במובייל) בתוך הלקוח האמיתי שמדווח מה כל משתמש חווה: טעינות עמוד, שגיאות, long tasks, קריאות API איטיות — מפולח לפי מדינה, מכשיר, דפדפן, סוג חיבור וגרסה.</p>
<p>ה-<strong>Core Web Vitals</strong> של Google (נמדדים ב-<strong>אחוזון 75</strong> של טעינות העמוד, בנפרד ל-mobile ול-desktop):</p>
<table><tr><th>מטריקה</th><th>מודדת</th><th>טוב</th><th>גרוע</th></tr>
<tr><td><strong>LCP</strong> Largest Contentful Paint</td><td>טעינה: מתי התוכן המרכזי מופיע</td><td>≤ 2.5 s</td><td>&gt; 4 s</td></tr>
<tr><td><strong>INP</strong> Interaction to Next Paint</td><td>תגובתיות ללחיצות, נגיעות ומקשים (החליף את FID במרץ 2024)</td><td>≤ 200 ms</td><td>&gt; 500 ms</td></tr>
<tr><td><strong>CLS</strong> Cumulative Layout Shift</td><td>יציבות ויזואלית: תוכן שקופץ</td><td>≤ 0.1</td><td>&gt; 0.25</td></tr></table>
<pre>import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name, value: metric.value, rating: metric.rating,   // 'good' | 'needs-improvement' | 'poor'
    id: metric.id, page: location.pathname, release: window.APP_VERSION,
  });
  navigator.sendBeacon('/rum', body);   // survives page unload, unlike fetch() without keepalive
}
onLCP(send); onINP(send); onCLS(send); onTTFB(send);</pre>
<p>RUM גם מחבר את ה-front end ל-back end: מעבירים header של <code>traceparent</code> מהדפדפן, ולחיצה איטית הופכת ל-distributed trace שעובר דרך ה-API. ל-OpenTelemetry יש אינסטרומנטציה לדפדפן; RUM מסחרי (Datadog, Sentry, New Relic, Grafana Faro, Elastic) עושה את זה מהקופסה.</p>
<blockquote>💡 Real world: ה-p99 בשרת שלך יכול להיות 120ms יציב בזמן שמשתמשים בהודו עם טלפוני Android בינוניים רואים LCP של 5 שניות, כי הבעיה היא bundle של JavaScript במשקל 2MB ותמונת hero בלי <code>fetchpriority="high"</code> — בלתי נראה לכל אות בצד השרת. רק RUM מראה את זה.</blockquote>`
      }
    },
    {
      h: { en: "When each catches what", he: "מה כל כלי תופס ומתי" },
      body: {
        en: `<table><tr><th>Failure</th><th>Server metrics/traces</th><th>Synthetics</th><th>RUM</th><th>Profiling</th></tr>
<tr><td>DNS record deleted / CDN misrouted</td><td>❌ (traffic just drops)</td><td>✅ immediately</td><td>⚠️ only if beacons reach you</td><td>❌</td></tr>
<tr><td>Site down at 03:00, zero traffic</td><td>❌</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Expiring cert, broken login flow</td><td>⚠️</td><td>✅</td><td>⚠️ after users hit it</td><td>❌</td></tr>
<tr><td>Slow for mobile users in one country</td><td>❌</td><td>⚠️ if you probe from there</td><td>✅</td><td>❌</td></tr>
<tr><td>JS error breaking checkout button on Safari</td><td>❌</td><td>⚠️ if you test Safari</td><td>✅</td><td>❌</td></tr>
<tr><td>CPU up 30% after deploy, cost spike</td><td>✅ that it happened</td><td>❌</td><td>❌</td><td>✅ which function</td></tr>
<tr><td>p99 latency from lock contention</td><td>✅ trace shows the slow span</td><td>⚠️</td><td>⚠️</td><td>✅ off-CPU / mutex profile shows why</td></tr></table>
<p>A practical rollout order: <strong>1)</strong> blackbox probes for every public endpoint + cert expiry, <strong>2)</strong> 3-5 browser journeys for revenue-critical flows (login, checkout, signup), <strong>3)</strong> RUM with Core Web Vitals per release, <strong>4)</strong> continuous profiling on the top services by compute cost, then fleet-wide.</p>
<blockquote>💡 Real world: synthetics are your <em>availability SLI from the outside</em>, RUM is your <em>experience SLI</em>; they disagree often, and both are right. Synthetics run from clean data centers on fast networks, so they show best-case; RUM shows the real long tail.</blockquote>`,
        he: `<table><tr><th>כשל</th><th>מטריקות/traces בשרת</th><th>Synthetics</th><th>RUM</th><th>Profiling</th></tr>
<tr><td>רשומת DNS נמחקה / CDN מנתב לא נכון</td><td>❌ (ה-traffic פשוט יורד)</td><td>✅ מיד</td><td>⚠️ רק אם ה-beacons מגיעים אליך</td><td>❌</td></tr>
<tr><td>האתר למטה ב-03:00, אפס traffic</td><td>❌</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>cert שעומד לפוג, login flow שבור</td><td>⚠️</td><td>✅</td><td>⚠️ אחרי שמשתמשים נתקלים</td><td>❌</td></tr>
<tr><td>איטי למשתמשי mobile במדינה אחת</td><td>❌</td><td>⚠️ אם יש probe משם</td><td>✅</td><td>❌</td></tr>
<tr><td>שגיאת JS ששוברת את כפתור ה-checkout ב-Safari</td><td>❌</td><td>⚠️ אם בודקים ב-Safari</td><td>✅</td><td>❌</td></tr>
<tr><td>CPU עלה ב-30% אחרי deploy, קפיצה בעלות</td><td>✅ שזה קרה</td><td>❌</td><td>❌</td><td>✅ איזו פונקציה</td></tr>
<tr><td>p99 latency בגלל lock contention</td><td>✅ ה-trace מראה את ה-span האיטי</td><td>⚠️</td><td>⚠️</td><td>✅ פרופיל off-CPU או mutex מראה למה</td></tr></table>
<p>סדר rollout מעשי: <strong>1)</strong> blackbox probes לכל endpoint ציבורי ועל תפוגת certs, <strong>2)</strong> 3-5 מסעות דפדפן ל-flows שמכניסים כסף (login, checkout, signup), <strong>3)</strong> RUM עם Core Web Vitals לכל release, <strong>4)</strong> continuous profiling על השירותים המובילים בעלות compute, ואז על כל הצי.</p>
<blockquote>💡 Real world: synthetics הם ה-<em>availability SLI מבחוץ</em>, RUM הוא ה-<em>experience SLI</em>; הם לא מסכימים הרבה פעמים, ושניהם צודקים. synthetics רצים מ-data centers נקיים על רשתות מהירות, אז הם מראים את המקרה הטוב; RUM מראה את ה-long tail האמיתי.</blockquote>`
      }
    }
  ],
  diagram: "outside-in:  synthetics (probes, browser journeys) -> CDN -> app   [works with zero traffic]\nclient-side: RUM (web-vitals: LCP/INP/CLS, JS errors) -> beacon -> collector\ninside:      metrics/logs/traces -> WHAT is slow;  profiles (pprof, async-profiler, eBPF) -> WHICH code",
  handsOn: [
    { cmd: "curl -s 'http://localhost:9115/probe?target=https://example.com&module=http_2xx' | grep -E '^probe_(success|duration_seconds|http_status_code|ssl_earliest_cert_expiry)'", what: { en: "Run a blackbox exporter probe by hand and read the key series it produces.", he: "להריץ probe של blackbox exporter ידנית ולקרוא את ה-series המרכזיים שהוא מייצר." } },
    { cmd: "curl -s -o /dev/null -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://example.com", what: { en: "A one-line synthetic check that breaks latency into DNS, TCP, TLS and TTFB phases.", he: "בדיקה סינתטית בשורה אחת שמפרקת את ה-latency לשלבי DNS, TCP, TLS ו-TTFB." } },
    { cmd: "go tool pprof -top -nodecount=15 'http://localhost:6060/debug/pprof/profile?seconds=15'", what: { en: "Profile a Go service for 15 s and print the hottest functions (needs net/http/pprof imported).", he: "לעשות profile לשירות Go במשך 15 שניות ולהדפיס את הפונקציות הכי חמות (צריך import של net/http/pprof)." } },
    { cmd: "py-spy dump --pid $(pgrep -f gunicorn | head -1)", what: { en: "Dump the current stack of every thread in a live Python process — great for 'it's stuck'.", he: "להדפיס את ה-stack הנוכחי של כל thread בתהליך Python חי — מעולה למקרה של 'זה תקוע'." } }
  ],
  mnemonic: {
    en: "\"Synthetics: is it up? RUM: is it good? Profiling: why is it slow?\" Outside, client, inside.",
    he: "\"Synthetics: זה עובד? RUM: זה טוב? Profiling: למה זה איטי?\" מבחוץ, אצל הלקוח, מבפנים."
  },
  pitfalls: [
    { en: "Reading a flame graph's x-axis as time — it's alphabetical; width is what matters.", he: "לקרוא את ציר ה-X של flame graph כזמן — הוא לפי א\"ב; מה שחשוב זה הרוחב." },
    { en: "Paging on a single synthetic location failing — one flaky probe region will wake you up for nothing; require 2+ locations.", he: "page על כשל ממיקום סינתטי אחד — אזור probe לא יציב אחד יעיר אותך סתם; דורשים 2 מיקומים או יותר." },
    { en: "Using CPU profiles to debug latency that's actually waiting on locks or I/O — you need off-CPU/wall-clock profiles.", he: "להשתמש בפרופילי CPU כדי לדבג latency שבעצם הוא המתנה ל-locks או I/O — צריך פרופילי off-CPU או wall-clock." },
    { en: "Averaging Web Vitals instead of using p75 per device class — the average hides your slow mobile users.", he: "לעשות ממוצע ל-Web Vitals במקום p75 לכל סוג מכשיר — הממוצע מסתיר את משתמשי ה-mobile האיטיים." }
  ],
  interview: [
    { q: { en: "Your dashboards are green but customers say the site is slow. How do you investigate?", he: "הדשבורדים ירוקים אבל לקוחות אומרים שהאתר איטי. איך תחקור?" },
      a: { en: "Server metrics only cover the server. Check RUM: LCP/INP at p75 by country, device and release; look for front-end causes (bundle size, images, third-party scripts, long tasks) and CDN/DNS issues. Add synthetics from affected regions. If RUM points back to slow API calls, follow traceparent into traces, then profiles for the slow service.", he: "מטריקות בשרת מכסות רק את השרת. בודקים RUM: LCP ו-INP ב-p75 לפי מדינה, מכשיר ו-release; מחפשים סיבות ב-front end (גודל bundle, תמונות, סקריפטים של צד שלישי, long tasks) ובעיות CDN או DNS. מוסיפים synthetics מהאזורים שנפגעו. אם RUM מצביע על קריאות API איטיות, הולכים אחרי ה-traceparent ל-traces, ואז לפרופילים של השירות האיטי." } },
    { q: { en: "Why is continuous profiling safe to run in production, and what makes eBPF profilers attractive?", he: "למה זה בטוח להריץ continuous profiling ב-production, ומה מושך ב-profilers מבוססי eBPF?" },
      a: { en: "Sampling (e.g., 19-100 Hz) keeps overhead around 1-3%, with stacks aggregated before shipping. eBPF profilers run as one agent per node and profile every process without code changes or restarts, though they need frame pointers or DWARF unwinding and runtime-specific symbol support.", he: "דגימה (למשל 19-100 Hz) שומרת על overhead של בערך 1-3%, וה-stacks מצורפים לפני שליחה. profilers מבוססי eBPF רצים כ-agent אחד לכל node ועושים profile לכל תהליך בלי שינויי קוד או restarts, אבל הם צריכים frame pointers או DWARF unwinding ותמיכה ספציפית ל-runtime בשביל symbols." } }
  ],
  quiz: [
    { q: { en: "In a CPU flame graph, what does the width of a frame represent?", he: "ב-flame graph של CPU, מה מייצג הרוחב של frame?" },
      options: [
        { en: "The time at which the function ran", he: "הזמן שבו הפונקציה רצה" },
        { en: "The proportion of samples in which that function (and its callees) was on the stack", he: "החלק מה-samples שבהם הפונקציה (והפונקציות שהיא קוראת להן) הייתה על ה-stack" },
        { en: "The number of lines of code in the function", he: "מספר שורות הקוד בפונקציה" },
        { en: "Memory used by the function", he: "הזיכרון שהפונקציה משתמשת בו" }
      ], answer: 1,
      explain: { en: "The x-axis is sorted alphabetically, not by time; width = share of samples. Wide plateaus at the top are where CPU is actually spent.", he: "ציר ה-X ממוין לפי א\"ב, לא לפי זמן; רוחב = החלק מה-samples. רמות רחבות בחלק העליון הן איפה שה-CPU באמת נשרף." } },
    { q: { en: "Which tool detects that your site is unreachable at 03:00 when there is no user traffic?", he: "איזה כלי מזהה שהאתר לא נגיש ב-03:00 כשאין traffic של משתמשים?" },
      options: [
        { en: "RUM", he: "RUM" },
        { en: "Continuous profiling", he: "Continuous profiling" },
        { en: "Synthetic monitoring", he: "Synthetic monitoring" },
        { en: "Server-side error-rate alerts", he: "alerts על error rate בצד השרת" }
      ], answer: 2,
      explain: { en: "Synthetics generate their own traffic on a schedule. RUM and server-side error rates need real requests to exist.", he: "Synthetics מייצרים traffic משלהם לפי לוח זמנים. RUM ו-error rate בצד השרת צריכים שיהיו בקשות אמיתיות." } },
    { q: { en: "What is the 'good' threshold for INP, the Core Web Vital that replaced FID?", he: "מה הסף ה'טוב' ל-INP, ה-Core Web Vital שהחליף את FID?" },
      options: [
        { en: "≤ 100 ms", he: "≤ 100 ms" },
        { en: "≤ 200 ms at the 75th percentile", he: "≤ 200 ms באחוזון 75" },
        { en: "≤ 2.5 s", he: "≤ 2.5 s" },
        { en: "≤ 0.1", he: "≤ 0.1" }
      ], answer: 1,
      explain: { en: "INP good ≤ 200 ms, poor > 500 ms, assessed at p75. 2.5 s is LCP's threshold, 0.1 is CLS's.", he: "INP טוב ≤ 200 ms, גרוע מעל 500 ms, נמדד ב-p75. 2.5 s זה הסף של LCP, ו-0.1 של CLS." } },
    { q: { en: "p99 latency doubled but CPU usage is flat. Which profile is most likely to explain it?", he: "ה-p99 latency הוכפל אבל צריכת ה-CPU שטוחה. איזה פרופיל הכי סביר שיסביר את זה?" },
      options: [
        { en: "CPU (on-CPU) profile", he: "פרופיל CPU (on-CPU)" },
        { en: "Off-CPU / wall-clock or mutex/block profile", he: "פרופיל off-CPU או wall-clock, או פרופיל mutex/block" },
        { en: "Heap in-use profile", he: "פרופיל heap in-use" },
        { en: "No profile can help; only logs", he: "שום פרופיל לא יעזור; רק לוגים" }
      ], answer: 1,
      explain: { en: "Flat CPU with higher latency means threads are waiting (locks, I/O, network, pool exhaustion). On-CPU profiles don't see waiting time.", he: "CPU שטוח עם latency גבוה יותר אומר שה-threads מחכים (locks, I/O, רשת, pool שנגמר). פרופילי on-CPU לא רואים זמן המתנה." } }
  ],
  related: ["obs-traces", "obs-golden-signals", "obs-metrics", "obs-prometheus-deep", "staff-ebpf-cilium", "obs-alerting"]
});

/* ---------------------------------------------------------
   Glossary
   --------------------------------------------------------- */
INFRA.glossary.push(
  { term: "Abort criteria", track: "reliability", lesson: "rel-dr-drills",
    def: { en: "Pre-agreed, measurable conditions (e.g., success rate below 97% for 5 min) that immediately stop a drill or experiment and trigger rollback, decided before it starts.", he: "תנאים מדידים שהוסכמו מראש (למשל success rate מתחת ל-97% במשך 5 דקות) שעוצרים מיד drill או ניסוי ומפעילים rollback, ונקבעים לפני שמתחילים." } },
  { term: "Tabletop exercise", track: "reliability", lesson: "rel-dr-drills",
    def: { en: "A discussion-based drill: the team walks through a disaster scenario and the runbook without touching systems, to find gaps in decisions, roles and communication.", he: "Drill מבוסס דיון: הצוות עובר על תרחיש אסון ועל ה-runbook בלי לגעת במערכות, כדי למצוא פערים בהחלטות, בתפקידים ובתקשורת." } },
  { term: "Failback", track: "reliability", lesson: "rel-dr-drills",
    def: { en: "Returning production from the DR site to the original primary after a failover; often harder than the failover because the old primary must resync first.", he: "החזרת ה-production מאתר ה-DR ל-primary המקורי אחרי failover; לרוב קשה יותר מה-failover כי ה-primary הישן צריך קודם להסתנכרן מחדש." } },
  { term: "Trust bundle", track: "networking", lesson: "rel-cert-operations",
    def: { en: "The set of CA certificates a client trusts. Rotating a CA safely means shipping old + new roots in the bundle first, switching issuance, and removing the old root only after all leaves are re-signed.", he: "אוסף ה-certificates של CA-ים שלקוח סומך עליהם. רוטציה בטוחה של CA אומרת להפיץ קודם root ישן + חדש ב-bundle, להעביר את ההנפקה, ולהוציא את ה-root הישן רק אחרי שכל ה-leafs נחתמו מחדש." } },
  { term: "Intermediate certificate", track: "networking", lesson: "rel-cert-operations",
    def: { en: "A CA certificate between the root and the leaf. Servers must send it with the leaf; when it's missing, browsers often still work (AIA fetching) but curl, Java and Go clients fail.", he: "Certificate של CA שנמצא בין ה-root ל-leaf. השרת חייב לשלוח אותו יחד עם ה-leaf; כשהוא חסר, דפדפנים לרוב עדיין עובדים (AIA fetching) אבל לקוחות curl, Java ו-Go נכשלים." } },
  { term: "Certificate Transparency", track: "networking", lesson: "rel-cert-operations",
    def: { en: "Public append-only logs of every publicly trusted TLS certificate issued; searchable (e.g., crt.sh) to inventory your domains' certs and spot mis-issuance.", he: "לוגים ציבוריים מסוג append-only של כל certificate ציבורי שהונפק; אפשר לחפש בהם (למשל crt.sh) כדי לעשות inventory ל-certs של הדומיינים שלך ולזהות הנפקה לא מורשית." } },
  { term: "Status page", track: "reliability", lesson: "rel-incident-comms",
    def: { en: "A public page showing component health and incident updates (Investigating → Identified → Monitoring → Resolved); must be hosted outside your own failure domain.", he: "דף ציבורי שמציג את מצב הרכיבים ועדכוני אינסידנט (Investigating ← Identified ← Monitoring ← Resolved); חייב להתארח מחוץ ל-failure domain שלך." } },
  { term: "Communications Lead", track: "reliability", lesson: "rel-incident-comms",
    def: { en: "The incident role that owns status page, customer, internal and exec updates on a fixed cadence, so the Incident Commander and responders can focus on mitigation.", he: "התפקיד באינסידנט שאחראי על ה-status page ועל עדכונים ללקוחות, פנימה ולהנהלה בתדירות קבועה, כדי שה-Incident Commander והמטפלים יתמקדו ב-mitigation." } },
  { term: "RFO (Reason for Outage)", track: "reliability", lesson: "rel-incident-comms",
    def: { en: "A customer-facing post-incident report: summary, impact, high-level cause, concrete commitments and an apology; shorter and legally reviewed, unlike the internal postmortem.", he: "דו\"ח אחרי אינסידנט שמיועד ללקוחות: סיכום, השפעה, סיבה ברמה גבוהה, התחייבויות קונקרטיות והתנצלות; קצר יותר ועובר review משפטי, בניגוד ל-postmortem הפנימי." } },
  { term: "RPN (Risk Priority Number)", track: "reliability", lesson: "rel-dependency-analysis",
    def: { en: "FMEA score = Severity × Occurrence × Detection (each 1-10); ranks failure modes so silent, likely, severe ones get fixed first.", he: "הציון ב-FMEA = Severity × Occurrence × Detection (כל אחד 1-10); מדרג failure modes כך שכשלים שקטים, סבירים וחמורים מתוקנים קודם." } },
  { term: "FMEA", track: "reliability", lesson: "rel-dependency-analysis",
    def: { en: "Failure Mode and Effects Analysis: list each component's failure modes and score Severity × Occurrence × Detection (RPN) to prioritize mitigations.", he: "Failure Mode and Effects Analysis: רושמים את ה-failure modes של כל רכיב ומדרגים Severity × Occurrence × Detection (RPN) כדי לתעדף mitigations." } },
  { term: "Common-mode failure", track: "reliability", lesson: "rel-dependency-analysis",
    def: { en: "A single cause that takes down several 'redundant' components at once (shared config push, region, certificate, deploy pipeline), breaking the independence that parallel availability math assumes.", he: "סיבה אחת שמפילה כמה רכיבים 'redundant' בבת אחת (דחיפת config משותפת, region, certificate, deploy pipeline), ושוברת את חוסר התלות שהמתמטיקה של זמינות במקביל מניחה." } },
  { term: "Off-CPU profiling", track: "observability", lesson: "obs-profiling-synthetics",
    def: { en: "Profiling where threads spend time NOT running on a CPU (blocked on locks, I/O, network, sleeps); explains latency that CPU profiles can't see.", he: "Profiling של הזמן שבו threads לא רצים על CPU (חסומים על locks, I/O, רשת, sleep); מסביר latency שפרופילי CPU לא רואים." } },
  { term: "Synthetic monitoring", track: "observability", lesson: "obs-profiling-synthetics",
    def: { en: "Scripted checks (HTTP probes or headless-browser journeys) run on a schedule from multiple locations; detects outages even with zero real traffic.", he: "בדיקות מתוסרטות (HTTP probes או מסעות בדפדפן headless) שרצות לפי לוח זמנים מכמה מיקומים; מזהות השבתות גם כשאין traffic אמיתי." } },
  { term: "RUM (Real User Monitoring)", track: "observability", lesson: "obs-profiling-synthetics",
    def: { en: "Client-side instrumentation (browser JS or mobile SDK) that reports what real users experienced: Core Web Vitals, errors and slow requests, sliced by device, country and release.", he: "אינסטרומנטציה בצד הלקוח (JS בדפדפן או SDK במובייל) שמדווחת מה משתמשים אמיתיים חוו: Core Web Vitals, שגיאות ובקשות איטיות, מפולח לפי מכשיר, מדינה ו-release." } },
  { term: "INP (Interaction to Next Paint)", track: "observability", lesson: "obs-profiling-synthetics",
    def: { en: "Core Web Vital for responsiveness (replaced FID in March 2024): latency from a user interaction to the next frame; good ≤ 200 ms, poor > 500 ms at p75.", he: "Core Web Vital של תגובתיות (החליף את FID במרץ 2024): ה-latency מאינטראקציה של המשתמש ועד ה-frame הבא; טוב ≤ 200 ms, גרוע מעל 500 ms ב-p75." } }
);

/* ---------------------------------------------------------
   Scenario: internal mTLS cert expires on a Friday
   --------------------------------------------------------- */
INFRA.scenarios.push({
  id: "cert-expired-friday",
  icon: "📜",
  title: { en: "Friday 16:40: service-to-service calls start failing", he: "שישי 16:40: הקריאות בין השירותים מתחילות להיכשל" },
  start: "s1",
  steps: {
    s1: {
      text: { en: "Friday, 16:40. PagerDuty: 'checkout-api 5xx rate 64%'. No deploys since Wednesday. Grafana shows errors jumped from 0.1% to 64% in under a minute at 16:32 — a cliff, not a ramp.",
              he: "שישי, 16:40. PagerDuty: 'checkout-api 5xx rate 64%'. אין deploys מאז רביעי. ב-Grafana רואים שהשגיאות קפצו מ-0.1% ל-64% בפחות מדקה ב-16:32 — צוק, לא שיפוע." },
      data: "checkout-api   5xx: 64.2%   p99: 41ms   rps: 1,840\nupstream errors by target (last 5m):\n  ledger-svc        100.0%\n  inventory-svc       0.0%\n  pricing-svc         0.0%",
      choices: [
        { label: { en: "Check checkout-api logs for the calls to ledger-svc", he: "לבדוק בלוגים של checkout-api את הקריאות ל-ledger-svc" }, next: "s2", score: 15,
          feedback: { en: "Good: a sharp cliff, no deploy, one upstream at 100% — go straight to the error message on that edge.", he: "טוב: צוק חד, בלי deploy, upstream אחד ב-100% — הולכים ישר להודעת השגיאה על הקשת הזאת." } },
        { label: { en: "Roll back checkout-api to the previous release", he: "לעשות rollback ל-checkout-api לגרסה הקודמת" }, next: "s1b", score: -5,
          feedback: { en: "Nothing was deployed since Wednesday, and errors are concentrated on one upstream. A rollback burns 10 minutes and changes nothing.", he: "לא היה deploy מאז רביעי, והשגיאות מרוכזות ב-upstream אחד. rollback שורף 10 דקות ולא משנה כלום." } },
        { label: { en: "Scale ledger-svc from 6 to 20 replicas", he: "להגדיל את ledger-svc מ-6 ל-20 replicas" }, next: "s1b", score: -5,
          feedback: { en: "p99 is 41 ms and errors are instant — this isn't overload. More replicas will fail the same way.", he: "ה-p99 הוא 41ms והשגיאות מיידיות — זה לא עומס. עוד replicas ייכשלו באותה צורה." } }
      ]
    },
    s1b: {
      text: { en: "17:00. Nothing improved. The 5xx rate is still 64%, and support reports customers can't complete orders. Time to look at the actual error.",
              he: "17:00. שום דבר לא השתפר. ה-5xx עדיין 64%, וה-support מדווח שלקוחות לא מצליחים לסיים הזמנות. הגיע הזמן להסתכל על השגיאה עצמה." },
      choices: [
        { label: { en: "Read the checkout-api logs for ledger-svc calls", he: "לקרוא את הלוגים של checkout-api על הקריאות ל-ledger-svc" }, next: "s2", score: 5,
          feedback: { en: "Better late than never. Always read the error before acting on it.", he: "עדיף מאוחר מאשר אף פעם. תמיד קוראים את השגיאה לפני שפועלים." } }
      ]
    },
    s2: {
      text: { en: "The logs are unambiguous. The TLS handshake to ledger-svc fails during certificate verification.",
              he: "הלוגים חד משמעיים. ה-TLS handshake ל-ledger-svc נכשל באימות ה-certificate." },
      data: "level=error msg=\"ledger call failed\" err=\"Post https://ledger-svc.payments.svc:8443/v1/entries:\n  tls: failed to verify certificate: x509: certificate has expired or is not yet valid:\n  current time 2026-11-13T16:41:07Z is after 2026-11-13T16:32:00Z\"",
      choices: [
        { label: { en: "Check which cert expired: inspect what ledger-svc presents, and check node clocks", he: "לבדוק איזה cert פג: לבחון מה ledger-svc מציג, ולבדוק את השעון ב-nodes" }, next: "s3", score: 15,
          feedback: { en: "Exactly. Confirm which cert (leaf? CA? client?) and rule out clock skew before fixing anything.", he: "בדיוק. מוודאים איזה cert (leaf? CA? client?) ושוללים clock skew לפני שמתקנים משהו." } },
        { label: { en: "Set InsecureSkipVerify in checkout-api to restore service now", he: "להגדיר InsecureSkipVerify ב-checkout-api כדי להחזיר את השירות עכשיו" }, next: "s2b", score: -15,
          feedback: { en: "This turns mTLS into encryption without authentication on the payments path, needs a deploy anyway, and will never be reverted. Security will find it in the postmortem.", he: "זה הופך את ה-mTLS להצפנה בלי אימות זהות במסלול התשלומים, דורש deploy בכל מקרה, ואף פעם לא יוחזר. ה-security ימצאו את זה ב-postmortem." } }
      ]
    },
    s2b: {
      text: { en: "You open a PR to skip verification. Your team lead blocks it: 'This is the ledger. We're not sending money to an unauthenticated endpoint.' Back to finding the real cert.",
              he: "פתחת PR לדלג על האימות. ה-team lead חוסם: 'זה ה-ledger. אנחנו לא שולחים כסף ל-endpoint שלא אומת.' חוזרים למצוא את ה-cert האמיתי." },
      choices: [
        { label: { en: "Inspect the cert ledger-svc presents", he: "לבחון את ה-cert ש-ledger-svc מציג" }, next: "s3", score: 0,
          feedback: { en: "Right path — you lost 15 minutes and some credibility.", he: "המסלול הנכון — הפסדת 15 דקות וקצת אמינות." } }
      ]
    },
    s3: {
      text: { en: "Clocks are fine (chrony offset 0.4 ms). The leaf cert ledger-svc serves expired at 16:32. It lives in a Secret named ledger-tls that nobody manages: it was created by hand a year ago, signed by the internal CA. There's no cert-manager Certificate for it.",
              he: "השעונים בסדר (offset של chrony הוא 0.4ms). ה-leaf cert ש-ledger-svc מגיש פג ב-16:32. הוא יושב ב-Secret בשם ledger-tls שאף אחד לא מנהל: הוא נוצר ידנית לפני שנה, חתום על ידי ה-CA הפנימי. אין לו Certificate של cert-manager." },
      data: "$ kubectl -n payments get secret ledger-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d \\\n    | openssl x509 -noout -subject -issuer -enddate\nsubject=CN = ledger-svc.payments.svc\nissuer=CN = Acme Internal Issuing CA 2025\nnotAfter=Nov 13 16:32:00 2026 GMT\n\n$ kubectl -n payments get secret ledger-tls -o jsonpath='{.metadata.creationTimestamp}'\n2025-11-13T16:32:41Z\n\n$ kubectl get clusterissuer\nNAME               READY   AGE\ninternal-ca        True    210d",
      choices: [
        { label: { en: "Create a cert-manager Certificate for ledger-svc (same SANs, internal-ca ClusterIssuer, secretName ledger-tls)", he: "ליצור Certificate של cert-manager ל-ledger-svc (אותם SANs, ה-ClusterIssuer internal-ca, secretName ledger-tls)" }, next: "s4", score: 15,
          feedback: { en: "Fixes it now and permanently: the same Secret gets a fresh cert, and from now on it renews itself.", he: "מתקן גם עכשיו וגם לתמיד: אותו Secret מקבל cert חדש, ומעכשיו הוא מתחדש לבד." } },
        { label: { en: "Generate a new cert by hand with openssl from the CA key on your laptop, valid for 1 year", he: "לייצר cert חדש ידנית עם openssl מהמפתח של ה-CA שעל הלפטופ שלך, בתוקף לשנה" }, next: "s4", score: 0,
          feedback: { en: "It works tonight, but you just reset the same time bomb for Nov 2027 — and the CA private key on a laptop is its own incident.", he: "זה עובד הלילה, אבל בדיוק כיוונת מחדש את אותה פצצה לנובמבר 2027 — ומפתח פרטי של CA על לפטופ הוא אינסידנט בפני עצמו." } }
      ]
    },
    s4: {
      text: { en: "17:12. cert-manager issued a fresh cert into ledger-tls (READY=True, valid 90 days). But errors are still 64%. The ledger-svc pods still present the old cert.",
              he: "17:12. cert-manager הנפיק cert חדש לתוך ledger-tls (READY=True, בתוקף ל-90 יום). אבל השגיאות עדיין 64%. ה-Pod-ים של ledger-svc עדיין מציגים את ה-cert הישן." },
      data: "$ kubectl -n payments get certificate ledger-svc\nNAME         READY   SECRET       AGE\nledger-svc   True    ledger-tls   48s\n\n$ kubectl -n payments exec deploy/checkout-api -- sh -c \\\n  'echo | openssl s_client -connect ledger-svc.payments.svc:8443 2>/dev/null | openssl x509 -noout -enddate'\nnotAfter=Nov 13 16:32:00 2026 GMT",
      choices: [
        { label: { en: "kubectl rollout restart deploy/ledger-svc — the app reads its cert only at startup", he: "kubectl rollout restart deploy/ledger-svc — האפליקציה קוראת את ה-cert רק ב-startup" }, next: "s5", score: 15,
          feedback: { en: "Correct. Renewal and reload are separate steps. The rolling restart picks up the new Secret without downtime.", he: "נכון. חידוש ו-reload הם שני שלבים נפרדים. ה-rolling restart קולט את ה-Secret החדש בלי downtime." } },
        { label: { en: "Wait — the kubelet will sync the Secret into the pods soon", he: "לחכות — ה-kubelet יסנכרן את ה-Secret לתוך ה-Pod-ים בקרוב" }, next: "s4b", score: -5,
          feedback: { en: "The file on disk does update within a minute or two (unless mounted with subPath), but the process already loaded the old cert into memory and never re-reads it.", he: "הקובץ בדיסק אכן מתעדכן תוך דקה-שתיים (אלא אם הוא mounted עם subPath), אבל התהליך כבר טען את ה-cert הישן לזיכרון ולא קורא אותו מחדש." } }
      ]
    },
    s4b: {
      text: { en: "17:25. Still 64%. The mounted file has the new cert, but the process doesn't care.",
              he: "17:25. עדיין 64%. בקובץ ה-mounted יש את ה-cert החדש, אבל לתהליך זה לא משנה." },
      choices: [
        { label: { en: "Rollout restart ledger-svc", he: "לעשות rollout restart ל-ledger-svc" }, next: "s5", score: 5,
          feedback: { en: "There it is. Note for the postmortem: add hot reload or a Reloader annotation.", he: "הנה זה. הערה ל-postmortem: להוסיף hot reload או annotation של Reloader." } }
      ]
    },
    s5: {
      text: { en: "Errors drop to 0.1% within two minutes. The status page goes to Monitoring. It's 17:20 on a Friday and everyone wants to go home. One more question: was ledger-tls the only one?",
              he: "השגיאות יורדות ל-0.1% תוך שתי דקות. ה-status page עובר ל-Monitoring. השעה 17:20 ביום שישי וכולם רוצים הביתה. עוד שאלה אחת: האם ledger-tls היה היחיד?" },
      data: "$ x509 exporter query: (x509_cert_not_after - time()) / 86400 < 7\nNAMESPACE   SECRET            DAYS_LEFT   ISSUER\npayments    refunds-tls       0.9         Acme Internal Issuing CA 2025\npayments    settlement-tls    2.3         Acme Internal Issuing CA 2025",
      choices: [
        { label: { en: "Put refunds-tls and settlement-tls under cert-manager now, add an expiry alert, then hand over and write the postmortem Monday", he: "להכניס עכשיו את refunds-tls ו-settlement-tls ל-cert-manager, להוסיף alert על תפוגה, ואז handover ו-postmortem ביום שני" }, next: "win", score: 15,
          feedback: { en: "Expiries cluster: whoever created one cert by hand created its siblings the same day. Ten more minutes now saves you Saturday morning and Sunday.", he: "תפוגות מגיעות באשכולות: מי שיצר cert אחד ידנית יצר את האחים שלו באותו יום. עוד עשר דקות עכשיו חוסכות לך את שבת בבוקר ואת ראשון." } },
        { label: { en: "Close the incident and go home — it's resolved", he: "לסגור את האינסידנט וללכת הביתה — זה נפתר" }, next: "lose", score: -10,
          feedback: { en: "refunds-tls expires in 22 hours. Tomorrow afternoon, refunds will break the same way.", he: "refunds-tls פג בעוד 22 שעות. מחר אחר הצהריים ה-refunds יישברו בדיוק באותה צורה." } }
      ]
    },
    win: {
      text: { en: "Weekend saved. Postmortem actions: every TLS Secret managed by cert-manager, an x509 exporter alert at 14 days (ticket) and 3 days (page), Reloader on cert-consuming deployments, and a yearly drill for the internal issuing CA itself. Customer impact: 48 minutes of failed checkouts, communicated on the status page.",
              he: "סוף השבוע ניצל. Action items מה-postmortem: כל TLS Secret מנוהל על ידי cert-manager, alert של x509 exporter ב-14 יום (ticket) וב-3 ימים (page), Reloader על deployments שצורכים certs, ו-drill שנתי ל-issuing CA הפנימי עצמו. השפעה על לקוחות: 48 דקות של checkouts שנכשלו, עם עדכונים ב-status page." },
      end: "win"
    },
    lose: {
      text: { en: "Saturday, 15:10. PagerDuty again: refunds-svc 100% errors, same x509 message. Sunday, settlement batch fails. Three incidents with one root cause — and the postmortem's first question is 'why didn't we check for others on Friday?'",
              he: "שבת, 15:10. שוב PagerDuty: refunds-svc ב-100% שגיאות, אותה הודעת x509. ביום ראשון ה-batch של settlement נכשל. שלושה אינסידנטים עם root cause אחד — והשאלה הראשונה ב-postmortem היא 'למה לא בדקנו אם יש עוד ביום שישי?'" },
      end: "lose"
    }
  },
  lessons: ["rel-cert-operations", "pr-applied-crypto-pki", "k8s-ingress-certs-dns", "rel-incident-comms"]
});
