window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — part 1: thinking, requirements, sizing, network, tests, validation, observability, capstone */

INFRA.lessons.push({
  id: "pr-architect-questions",
  track: "principal",
  order: 1,
  icon: "❓",
  level: 3,
  minutes: 16,
  title: { en: "The Questions a Principal Asks Before Drawing a Box", he: "השאלות ש-Principal שואל/ת לפני שמציירים קופסה אחת" },
  tldr: {
    en: "Architecture starts with questions, not boxes: who uses it, how much, how fast, how correct, how available, what it may cost — and, just as important, what we are explicitly NOT building.",
    he: "ארכיטקטורה מתחילה בשאלות, לא בקופסאות: מי משתמש, כמה, כמה מהר, כמה נכון, כמה זמין, כמה מותר לזה לעלות — ולא פחות חשוב, מה אנחנו במפורש לא בונים."
  },
  analogy: {
    en: "A good architect of houses doesn't start by drawing walls. They ask: how many people live here, do you work from home, are you planning kids, what's the budget, is this a flood zone, do you want to sell in 5 years? Two families asking for 'a house' can need a studio apartment or a 6-bedroom villa. Software is the same: 'build a notification service' could mean 100 emails a day or 2 billion pushes — and the right design differs by orders of magnitude.",
    he: "אדריכל טוב לא מתחיל לצייר קירות. הוא שואל: כמה אנשים יגורו פה, אתם עובדים מהבית, מתכננים ילדים, מה התקציב, זה אזור הצפות, אתם רוצים למכור בעוד 5 שנים? שתי משפחות שמבקשות 'בית' יכולות להצטרך דירת סטודיו או וילה עם 6 חדרים. בתוכנה זה אותו דבר: 'תבנה notification service' יכול להיות 100 מיילים ביום או 2 מיליארד pushes — והתכנון הנכון שונה בסדרי גודל."
  },
  sections: [
    {
      h: { en: "Functional: who, what, and the core flows", he: "פונקציונלי: מי, מה, והזרימות המרכזיות" },
      body: {
        en: `<p>Start with <strong>actors</strong> and <strong>use cases</strong>. Write each flow as one sentence: "A <em>customer</em> places an order and receives a confirmation within 2 seconds." Then ask the uncomfortable questions:</p>
<ul>
<li><strong>Who are the users?</strong> End users, internal operators, other services, partners via API, batch jobs? Each one is a different entry point with different auth, rate limits and SLOs.</li>
<li><strong>What are the 3 most important flows?</strong> Not 30. Design for the top 3; the rest must merely not break them.</li>
<li><strong>What's the read/write ratio?</strong> A feed is 100:1 reads; a metrics ingester is 1:100. This alone decides caching, replicas and storage engine.</li>
<li><strong>What's the data?</strong> Shape (relational, documents, blobs, time series), size per item, lifetime, who owns it, can it be deleted (GDPR)?</li>
<li><strong>What already exists?</strong> Existing auth, existing Postgres, existing Kafka, existing on-call team. Reusing boring infra beats introducing a shiny new one.</li>
<li><strong>What are the integrations?</strong> Payment provider, email/SMS vendor, legacy ERP, partner webhooks — each is a failure mode and a contract.</li>
</ul>
<blockquote>💡 Real world: At Amazon, many teams start with a "PR/FAQ" — the press release of the finished product and the FAQ a customer would ask. If you can't write the press release, you don't understand the functional requirements yet.</blockquote>`,
        he: `<p>מתחילים ב-<strong>actors</strong> וב-<strong>use cases</strong>. כותבים כל זרימה במשפט אחד: "<em>לקוח</em> מבצע הזמנה ומקבל אישור תוך 2 שניות." ואז שואלים את השאלות הלא נוחות:</p>
<ul>
<li><strong>מי המשתמשים?</strong> משתמשי קצה, אופרטורים פנימיים, שירותים אחרים, שותפים דרך API, batch jobs? כל אחד הוא נקודת כניסה אחרת עם auth, rate limits ו-SLOs שונים.</li>
<li><strong>מה 3 הזרימות הכי חשובות?</strong> לא 30. מתכננים בשביל ה-3 הראשונות; השאר רק צריכות לא לשבור אותן.</li>
<li><strong>מה יחס הקריאות לכתיבות?</strong> Feed זה 100:1 קריאות; ingester של metrics זה 1:100. רק זה כבר מכריע caching, replicas ומנוע אחסון.</li>
<li><strong>מה הדאטה?</strong> צורה (רלציוני, documents, blobs, time series), גודל לפריט, משך חיים, מי הבעלים, אפשר למחוק (GDPR)?</li>
<li><strong>מה כבר קיים?</strong> Auth קיים, Postgres קיים, Kafka קיים, צוות on-call קיים. שימוש חוזר בתשתית משעממת עדיף על להכניס משהו נוצץ.</li>
<li><strong>מה האינטגרציות?</strong> ספק תשלומים, ספק מייל/SMS, ERP ישן, webhooks של שותפים — כל אחד הוא failure mode וחוזה.</li>
</ul>
<blockquote>💡 מהשטח: ב-Amazon הרבה צוותים מתחילים ב-"PR/FAQ" — הודעה לעיתונות על המוצר הגמור וה-FAQ שלקוח היה שואל. אם אי אפשר לכתוב את ההודעה לעיתונות, עוד לא הבנתם את הדרישות הפונקציונליות.</blockquote>`
      }
    },
    {
      h: { en: "Non-functional requirements: the numbers that shape everything", he: "דרישות לא-פונקציונליות: המספרים שמעצבים הכול" },
      body: {
        en: `<p>NFRs are where architecture actually lives. Always get a <strong>number</strong>, never an adjective ("fast", "scalable", "secure").</p>
<table>
<tr><th>NFR</th><th>Question to ask</th><th>Example answer</th></tr>
<tr><td>Scale</td><td>DAU, peak QPS, growth in 12/36 months?</td><td>2M DAU, 3k QPS peak, x3 in 2 years</td></tr>
<tr><td>Latency</td><td>p50 / p99 for which call, measured where?</td><td>p99 &lt; 300 ms at the LB for GET /feed</td></tr>
<tr><td>Availability</td><td>What SLO? What's the cost of 1 hour down?</td><td>99.95% (~22 min/month); 1h = $40k</td></tr>
<tr><td>Durability</td><td>Can we ever lose acknowledged data?</td><td>Orders: never (RPO 0). Analytics: 1h ok</td></tr>
<tr><td>Consistency</td><td>Must a read see the latest write? Where?</td><td>Balance: strong. Like counter: eventual</td></tr>
<tr><td>Security / compliance</td><td>PII? PCI? HIPAA? SOC2? Who may see what?</td><td>PII + PCI scope only in payments service</td></tr>
<tr><td>Data residency</td><td>Must data stay in a country/region?</td><td>EU users' data stays in eu-west-1</td></tr>
<tr><td>Cost</td><td>Monthly budget? Cost per request/user?</td><td>&lt; $25k/month, &lt; $0.01 per order</td></tr>
<tr><td>Operability</td><td>Who is on-call? What's their skill set?</td><td>4 backend devs, no dedicated SRE</td></tr>
</table>
<p>Two hidden NFRs people forget: <strong>time-to-market</strong> (a 6-week deadline kills any design needing a new database) and <strong>team size</strong> (5 engineers cannot operate 30 microservices — Conway's law will punish you).</p>
<blockquote>⚠️ Production tip: "99.99%" is often said casually. Translate it immediately: 4.3 minutes of downtime per month, which means no manual failover, multi-AZ everything, and zero-downtime deploys. Ask: "Are you willing to pay ~3x for that last nine?" Most stakeholders downgrade to 99.9% on the spot.</blockquote>`,
        he: `<p>ה-NFRs הם המקום שבו הארכיטקטורה באמת חיה. תמיד מבקשים <strong>מספר</strong>, אף פעם לא תואר ("מהיר", "scalable", "מאובטח").</p>
<table>
<tr><th>NFR</th><th>שאלה לשאול</th><th>תשובה לדוגמה</th></tr>
<tr><td>סקייל</td><td>DAU, QPS בשיא, צמיחה ב-12/36 חודשים?</td><td>2M DAU, 3k QPS בשיא, x3 בשנתיים</td></tr>
<tr><td>Latency</td><td>p50 / p99 לאיזו קריאה, נמדד איפה?</td><td>p99 &lt; 300 ms ב-LB עבור GET /feed</td></tr>
<tr><td>זמינות</td><td>איזה SLO? כמה עולה שעת השבתה?</td><td>99.95% (~22 דק' בחודש); שעה = $40k</td></tr>
<tr><td>Durability</td><td>מותר אי פעם לאבד דאטה שאושר?</td><td>הזמנות: אף פעם (RPO 0). אנליטיקס: שעה בסדר</td></tr>
<tr><td>עקביות</td><td>קריאה חייבת לראות את הכתיבה האחרונה? איפה?</td><td>יתרה: strong. מונה לייקים: eventual</td></tr>
<tr><td>אבטחה / רגולציה</td><td>PII? PCI? HIPAA? SOC2? מי רשאי לראות מה?</td><td>PII + PCI רק בשירות התשלומים</td></tr>
<tr><td>Data residency</td><td>הדאטה חייב להישאר במדינה/אזור?</td><td>דאטה של משתמשי EU נשאר ב-eu-west-1</td></tr>
<tr><td>עלות</td><td>תקציב חודשי? עלות לבקשה/משתמש?</td><td>&lt; $25k לחודש, &lt; $0.01 להזמנה</td></tr>
<tr><td>תפעול</td><td>מי ב-on-call? מה הסקילים שלהם?</td><td>4 מפתחי backend, אין SRE ייעודי</td></tr>
</table>
<p>שתי NFRs נסתרות ששוכחים: <strong>time-to-market</strong> (דדליין של 6 שבועות הורג כל תכנון שדורש database חדש) ו-<strong>גודל הצוות</strong> (5 מהנדסים לא יכולים לתפעל 30 microservices — חוק Conway יעניש אתכם).</p>
<blockquote>⚠️ טיפ לפרודקשן: "99.99%" נאמר הרבה פעמים בקלות. תתרגמו מיד: 4.3 דקות השבתה בחודש, כלומר אין failover ידני, multi-AZ להכול, ו-deploys בלי downtime. תשאלו: "אתם מוכנים לשלם בערך פי 3 על התשעה האחרונה?" רוב בעלי העניין יורדים ל-99.9% במקום.</blockquote>`
      }
    },
    {
      h: { en: "Goals vs non-goals, MoSCoW, important vs nice-to-have", he: "Goals מול non-goals, MoSCoW, חשוב מול nice-to-have" },
      body: {
        en: `<p>The most powerful section of any design doc is <strong>Non-goals</strong>. It is a list of reasonable things a reader might expect — that you are deliberately not doing. It prevents scope creep, ends arguments early, and tells reviewers what not to critique.</p>
<pre>## Goals
- Customers can place an order and get a confirmation in &lt; 2 s (p99).
- No acknowledged order is ever lost (RPO = 0 for orders).
- Support 3k orders/min at peak (Black Friday x5 of normal).

## Non-goals
- Multi-currency pricing (v2, Q3).            &lt;- reasonable, but not now
- Active-active multi-region (single region, multi-AZ is enough for 99.95%).
- Replacing the legacy invoicing system (we integrate via its existing API).
- Real-time analytics dashboards (nightly export to the warehouse is fine).</pre>
<p><strong>MoSCoW</strong> prioritization for features:</p>
<ul>
<li><strong>Must</strong> — without it the launch is pointless or illegal (checkout, payment, audit log for PCI).</li>
<li><strong>Should</strong> — important, painful to skip, but there is a workaround (order cancellation via support ticket).</li>
<li><strong>Could</strong> — nice-to-have; ship only if it's cheap (saved carts, dark mode).</li>
<li><strong>Won't (this time)</strong> — explicitly out; becomes a non-goal.</li>
</ul>
<p>How to tell <em>important</em> from <em>nice-to-have</em>: ask "If we launch without it, what breaks, who complains, and how much does it cost?" If the answer is "a few people are mildly annoyed", it's nice-to-have. Also: "Is it hard to add later?" — data model, IDs, auth, multi-tenancy and audit trails are hard to retrofit, so they move up even if users don't ask for them.</p>
<blockquote>💡 Real world: A rule many principals use — "Must" items should be ≤ 60% of the estimated effort. If everything is a Must, nothing is, and the deadline will decide for you in the worst possible way.</blockquote>`,
        he: `<p>החלק הכי חזק בכל design doc הוא <strong>Non-goals</strong>. זו רשימה של דברים סבירים שקורא עשוי לצפות להם — ושאתם בכוונה לא עושים. זה מונע זחילת scope, סוגר ויכוחים מוקדם, ואומר ל-reviewers מה לא לבקר.</p>
<pre>## Goals
- Customers can place an order and get a confirmation in &lt; 2 s (p99).
- No acknowledged order is ever lost (RPO = 0 for orders).
- Support 3k orders/min at peak (Black Friday x5 of normal).

## Non-goals
- Multi-currency pricing (v2, Q3).            &lt;- reasonable, but not now
- Active-active multi-region (single region, multi-AZ is enough for 99.95%).
- Replacing the legacy invoicing system (we integrate via its existing API).
- Real-time analytics dashboards (nightly export to the warehouse is fine).</pre>
<p>תעדוף <strong>MoSCoW</strong> לפיצ'רים:</p>
<ul>
<li><strong>Must</strong> — בלעדיו ההשקה חסרת טעם או לא חוקית (checkout, תשלום, audit log בשביל PCI).</li>
<li><strong>Should</strong> — חשוב, כואב לוותר, אבל יש workaround (ביטול הזמנה דרך פנייה לתמיכה).</li>
<li><strong>Could</strong> — nice-to-have; משחררים רק אם זה זול (עגלות שמורות, dark mode).</li>
<li><strong>Won't (הפעם)</strong> — בחוץ במפורש; הופך ל-non-goal.</li>
</ul>
<p>איך מבדילים בין <em>חשוב</em> ל-<em>nice-to-have</em>: שואלים "אם נשיק בלי זה, מה נשבר, מי מתלונן, וכמה זה עולה?" אם התשובה היא "כמה אנשים קצת מתעצבנים" — זה nice-to-have. ועוד שאלה: "קשה להוסיף את זה אחר כך?" — מודל הדאטה, IDs, auth, multi-tenancy ו-audit trails קשים להוספה בדיעבד, אז הם עולים בעדיפות גם אם משתמשים לא מבקשים אותם.</p>
<blockquote>💡 מהשטח: כלל שהרבה principals משתמשים בו — פריטי Must צריכים להיות ≤ 60% מהמאמץ המוערך. אם הכול Must, אז כלום לא Must, והדדליין יחליט בשבילכם בדרך הכי גרועה.</blockquote>`
      }
    },
    {
      h: { en: "One-way vs two-way doors, and 'what would make this fail?'", he: "דלתות חד-כיווניות מול דו-כיווניות, ו'מה יגרום לזה להיכשל?'" },
      body: {
        en: `<p>Jeff Bezos' framing: a <strong>two-way door</strong> is a decision you can reverse cheaply (library choice inside a service, cache TTL, instance type). Decide fast, delegate it. A <strong>one-way door</strong> is expensive or impossible to reverse: the primary database, the public API contract, the ID format, the tenancy model, the cloud provider, event schemas others consume. Slow down, write it down, get review.</p>
<table>
<tr><th>Usually one-way</th><th>Usually two-way</th></tr>
<tr><td>Public API shape &amp; auth model</td><td>Internal function signatures</td></tr>
<tr><td>Primary data store &amp; partition key</td><td>Cache technology</td></tr>
<tr><td>ID format (UUIDv7 vs int), tenancy model</td><td>Log format, dashboard layout</td></tr>
<tr><td>Event schemas consumed by other teams</td><td>Instance sizes, autoscaling thresholds</td></tr>
<tr><td>Data residency / region choice</td><td>CI pipeline steps</td></tr>
</table>
<p>Then run the <strong>failure questions</strong> — the principal's favourite part:</p>
<ul>
<li>What happens when each dependency is slow (not down — slow)?</li>
<li>What happens at 10x traffic? At 0.1x (are we paying for idle)?</li>
<li>What happens if a message is delivered twice? Out of order? Never?</li>
<li>What happens if a region/AZ disappears? If the DB fails over mid-transaction?</li>
<li>What happens when a bad deploy goes out at 3 a.m.? Who notices, how fast, how do we roll back?</li>
<li>What happens when the main engineer leaves? Is it documented and boring enough for someone else?</li>
</ul>
<blockquote>⚠️ Production tip: Ask "who gets paged, and what will they see?" before the design is approved. If the answer is "uh, the dev team, and logs maybe", the design is not done.</blockquote>`,
        he: `<p>המסגור של Jeff Bezos: <strong>דלת דו-כיוונית</strong> היא החלטה שאפשר להפוך בזול (ספרייה בתוך service, TTL של cache, סוג instance). מחליטים מהר ומאצילים. <strong>דלת חד-כיוונית</strong> היא יקרה או בלתי אפשרית להפיכה: ה-database הראשי, חוזה ה-API הציבורי, פורמט ה-ID, מודל ה-tenancy, ספק הענן, schemas של events שאחרים צורכים. מאטים, כותבים, מקבלים review.</p>
<table>
<tr><th>בדרך כלל חד-כיוונית</th><th>בדרך כלל דו-כיוונית</th></tr>
<tr><td>צורת ה-API הציבורי ומודל ה-auth</td><td>חתימות של פונקציות פנימיות</td></tr>
<tr><td>Data store ראשי ו-partition key</td><td>טכנולוגיית ה-cache</td></tr>
<tr><td>פורמט ID (UUIDv7 מול int), מודל tenancy</td><td>פורמט לוגים, layout של דשבורד</td></tr>
<tr><td>Schemas של events שצוותים אחרים צורכים</td><td>גדלי instances, ספי autoscaling</td></tr>
<tr><td>Data residency / בחירת region</td><td>שלבים ב-CI pipeline</td></tr>
</table>
<p>ואז מריצים את <strong>שאלות הכישלון</strong> — החלק האהוב על principals:</p>
<ul>
<li>מה קורה כשכל dependency איטי (לא נפל — איטי)?</li>
<li>מה קורה ב-x10 תנועה? ב-x0.1 (אנחנו משלמים על idle)?</li>
<li>מה קורה אם הודעה נמסרת פעמיים? לא לפי הסדר? אף פעם?</li>
<li>מה קורה אם region/AZ נעלם? אם ה-DB עושה failover באמצע טרנזקציה?</li>
<li>מה קורה כש-deploy רע יוצא ב-3 בלילה? מי שם לב, כמה מהר, איך עושים rollback?</li>
<li>מה קורה כשהמהנדס/ת המרכזי/ת עוזב/ת? זה מתועד ומשעמם מספיק בשביל מישהו אחר?</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: תשאלו "מי מקבל page, ומה הוא יראה?" לפני שהתכנון מאושר. אם התשובה היא "אה, צוות הפיתוח, ואולי לוגים", התכנון לא גמור.</blockquote>`
      }
    },
    {
      h: { en: "The printable checklist", he: "הצ'קליסט להדפסה" },
      body: {
        en: `<table>
<tr><th>#</th><th>Area</th><th>Must-answer question</th></tr>
<tr><td>1</td><td>Problem</td><td>What problem, for whom, and how do we measure success?</td></tr>
<tr><td>2</td><td>Actors</td><td>Who/what calls us? Who do we call?</td></tr>
<tr><td>3</td><td>Top flows</td><td>The 3 critical flows, each in one sentence</td></tr>
<tr><td>4</td><td>Scale</td><td>DAU, avg &amp; peak QPS, data growth/year, 3-year horizon</td></tr>
<tr><td>5</td><td>Latency</td><td>p50/p99 per critical call</td></tr>
<tr><td>6</td><td>Availability</td><td>SLO, cost of downtime, maintenance windows allowed?</td></tr>
<tr><td>7</td><td>Data</td><td>Shape, size, retention, RPO/RTO, consistency needs</td></tr>
<tr><td>8</td><td>Security</td><td>PII/PCI, authn/authz, tenancy, encryption, audit</td></tr>
<tr><td>9</td><td>Compliance</td><td>Residency, GDPR delete, SOC2/ISO evidence</td></tr>
<tr><td>10</td><td>Constraints</td><td>Deadline, team, budget, mandated stack</td></tr>
<tr><td>11</td><td>Integrations</td><td>3rd parties, their SLAs, limits, sandboxes</td></tr>
<tr><td>12</td><td>Failure</td><td>Slow deps, duplicates, AZ loss, bad deploy, 10x spike</td></tr>
<tr><td>13</td><td>Operations</td><td>On-call owner, runbooks, dashboards, alerts</td></tr>
<tr><td>14</td><td>Scope</td><td>Goals, non-goals, MoSCoW</td></tr>
<tr><td>15</td><td>Doors</td><td>Which decisions are one-way?</td></tr>
</table>
<p><strong>Worked example</strong> — "Build us a notification service." Five questions flip the design:</p>
<ul>
<li>Volume? 500/day → a cron + SendGrid call. 50M/day → queue, fan-out workers, per-provider rate limiting.</li>
<li>Channels? Email only vs email+SMS+push → provider abstraction layer.</li>
<li>Latency? OTP codes need &lt; 10 s; marketing digests can wait hours → two priority queues.</li>
<li>Duplicates OK? A double "your order shipped" is annoying; a double SMS charge is money → idempotency keys.</li>
<li>User preferences/quiet hours/unsubscribe? → legal requirement (CAN-SPAM, GDPR), a Must.</li>
</ul>`,
        he: `<table>
<tr><th>#</th><th>תחום</th><th>שאלה שחייבים לענות עליה</th></tr>
<tr><td>1</td><td>הבעיה</td><td>איזו בעיה, למי, ואיך מודדים הצלחה?</td></tr>
<tr><td>2</td><td>Actors</td><td>מי/מה קורא לנו? למי אנחנו קוראים?</td></tr>
<tr><td>3</td><td>זרימות מרכזיות</td><td>3 הזרימות הקריטיות, כל אחת במשפט</td></tr>
<tr><td>4</td><td>סקייל</td><td>DAU, QPS ממוצע ובשיא, צמיחת דאטה בשנה, אופק 3 שנים</td></tr>
<tr><td>5</td><td>Latency</td><td>p50/p99 לכל קריאה קריטית</td></tr>
<tr><td>6</td><td>זמינות</td><td>SLO, עלות השבתה, חלונות תחזוקה מותרים?</td></tr>
<tr><td>7</td><td>דאטה</td><td>צורה, גודל, retention, RPO/RTO, צרכי עקביות</td></tr>
<tr><td>8</td><td>אבטחה</td><td>PII/PCI, authn/authz, tenancy, הצפנה, audit</td></tr>
<tr><td>9</td><td>רגולציה</td><td>Residency, מחיקה לפי GDPR, ראיות ל-SOC2/ISO</td></tr>
<tr><td>10</td><td>אילוצים</td><td>דדליין, צוות, תקציב, stack מחייב</td></tr>
<tr><td>11</td><td>אינטגרציות</td><td>צד שלישי, ה-SLAs שלהם, limits, sandboxes</td></tr>
<tr><td>12</td><td>כישלון</td><td>Deps איטיים, כפילויות, אובדן AZ, deploy רע, קפיצה של x10</td></tr>
<tr><td>13</td><td>תפעול</td><td>בעלים של on-call, runbooks, דשבורדים, התראות</td></tr>
<tr><td>14</td><td>Scope</td><td>Goals, non-goals, MoSCoW</td></tr>
<tr><td>15</td><td>דלתות</td><td>אילו החלטות הן חד-כיווניות?</td></tr>
</table>
<p><strong>דוגמה מלאה</strong> — "תבנו לנו notification service." חמש שאלות הופכות את התכנון:</p>
<ul>
<li>נפח? 500 ביום → cron + קריאה ל-SendGrid. 50M ביום → תור, workers של fan-out, rate limiting לכל ספק.</li>
<li>ערוצים? רק מייל מול מייל+SMS+push → שכבת אבסטרקציה לספקים.</li>
<li>Latency? קודי OTP צריכים &lt; 10 שניות; סיכומי שיווק יכולים לחכות שעות → שני תורים לפי עדיפות.</li>
<li>כפילויות בסדר? "ההזמנה נשלחה" כפול זה מעצבן; חיוב SMS כפול זה כסף → idempotency keys.</li>
<li>העדפות משתמש/שעות שקט/הסרה מרשימה? → דרישה חוקית (CAN-SPAM, GDPR), Must.</li>
</ul>`
      }
    }
  ],
  diagram: `   vague ask: "build X"
          |
          v
 +------------------+     +------------------------+
 | FUNCTIONAL       |     | NON-FUNCTIONAL (numbers)|
 | actors, top-3    |     | QPS, p99, SLO, RPO/RTO, |
 | flows, data,     |     | consistency, security,  |
 | integrations     |     | cost, residency, team   |
 +--------+---------+     +-----------+------------+
          \\                         /
           v                       v
        +------------------------------+
        | SCOPE: goals / NON-goals     |
        | MoSCoW: Must Should Could Won't|
        +--------------+---------------+
                       v
        +------------------------------+
        | DOORS: one-way? slow down    |
        | FAILURE: slow dep, dupes,    |
        | AZ loss, 10x, bad deploy     |
        +--------------+---------------+
                       v
                 now draw boxes`,
  handsOn: [
    { cmd: "printf '## Goals\\n- \\n\\n## Non-goals\\n- \\n\\n## NFRs\\n| NFR | Target |\\n|---|---|\\n| p99 latency | |\\n| SLO | |\\n| RPO/RTO | |\\n' > design-scope.md", what: { en: "Create a scope skeleton for your current project and fill in at least 3 non-goals. If you can't name any, the scope isn't understood yet.", he: "צרו שלד scope לפרויקט הנוכחי שלכם ומלאו לפחות 3 non-goals. אם אתם לא מצליחים לחשוב על אף אחד — עוד לא הבנתם את ה-scope." } },
    { cmd: "python -c \"slo=0.9995; print(round((1-slo)*30*24*60,1),'min/month')\"", what: { en: "Translate any availability target into minutes of downtime per month before you agree to it (99.95% = 21.6 min).", he: "תרגמו כל יעד זמינות לדקות השבתה בחודש לפני שאתם מסכימים לו (99.95% = 21.6 דקות)." } },
    { cmd: "grep -iE 'fast|scalable|secure|real-?time|robust' design-doc.md", what: { en: "Hunt adjectives in a design doc. Every hit should be replaced by a number (ms, QPS, SLO, RPO).", he: "צדו תארים ב-design doc. כל התאמה צריכה להיות מוחלפת במספר (ms, QPS, SLO, RPO)." } }
  ],
  mnemonic: {
    en: "\"Who, How much, How fast, How right, How up, How much $ — and What NOT.\" Numbers over adjectives; non-goals over wishlists.",
    he: "\"מי, כמה, כמה מהר, כמה נכון, כמה זמין, כמה $ — ומה לא.\" מספרים במקום תארים; non-goals במקום רשימת משאלות."
  },
  pitfalls: [
    { en: "Jumping to technology ('let's use Kafka') before knowing volumes and consistency needs — you end up defending a tool instead of solving a problem.", he: "לקפוץ לטכנולוגיה ('בואו נשים Kafka') לפני שיודעים נפחים וצרכי עקביות — בסוף מגינים על כלי במקום לפתור בעיה." },
    { en: "Accepting adjectives as requirements. 'Fast' and 'highly available' are not testable; p99 &lt; 300 ms and 99.95% are.", he: "לקבל תארים כדרישות. 'מהיר' ו-'זמין מאוד' לא ניתנים לבדיקה; p99 &lt; 300 ms ו-99.95% כן." },
    { en: "No non-goals section — every reviewer adds 'what about multi-region?' and scope silently doubles.", he: "אין סעיף non-goals — כל reviewer מוסיף 'ומה עם multi-region?' וה-scope מוכפל בשקט." },
    { en: "Treating one-way doors (public API, partition key, ID format) as casually as two-way ones.", he: "להתייחס לדלתות חד-כיווניות (API ציבורי, partition key, פורמט ID) באותה קלות כמו לדו-כיווניות." }
  ],
  interview: [
    { q: { en: "The interviewer says 'Design a URL shortener.' What do you do in the first 5 minutes?", he: "המראיין אומר 'תתכנן URL shortener'. מה עושים ב-5 הדקות הראשונות?" },
      a: { en: "Clarify: users and flows (create, redirect, analytics?, custom aliases?, expiry?), scale (new URLs/day, redirects/day → read/write ratio ~100:1), latency for redirect (p99 &lt; 50 ms), availability (redirects are critical, creation less), consistency (a new link must work immediately for its creator), retention, abuse/security (malware links, rate limits). State non-goals out loud (no user accounts UI, no real-time analytics). Then estimate and only then draw.", he: "מבהירים: משתמשים וזרימות (יצירה, redirect, אנליטיקס?, aliases מותאמים?, תפוגה?), סקייל (URLs חדשים ביום, redirects ביום → יחס קריאה/כתיבה ~100:1), latency ל-redirect (p99 &lt; 50 ms), זמינות (redirects קריטיים, יצירה פחות), עקביות (קישור חדש חייב לעבוד מיד למי שיצר אותו), retention, abuse/אבטחה (קישורי malware, rate limits). אומרים non-goals בקול (אין UI לחשבונות, אין אנליטיקס real-time). אחר כך מעריכים, ורק אז מציירים." } },
    { q: { en: "How do you decide whether a feature is a Must or a Could?", he: "איך מחליטים אם פיצ'ר הוא Must או Could?" },
      a: { en: "Ask what breaks without it, who complains, what it costs, and whether it's legally required. Then ask how hard it is to add later: things baked into the data model, IDs, auth or tenancy are expensive to retrofit and get promoted; UI conveniences can wait. Keep Musts under ~60% of capacity so the plan survives surprises.", he: "שואלים מה נשבר בלעדיו, מי מתלונן, כמה זה עולה, והאם זו דרישה חוקית. אחר כך שואלים כמה קשה להוסיף בהמשך: דברים שאפויים במודל הדאטה, IDs, auth או tenancy יקרים להוספה בדיעבד ועולים בעדיפות; נוחויות UI יכולות לחכות. שומרים את ה-Musts מתחת ל-~60% מהקיבולת כדי שהתוכנית תשרוד הפתעות." } },
    { q: { en: "What's a one-way door you've seen handled badly?", he: "מה דלת חד-כיוונית שראית שטופלה רע?" },
      a: { en: "A typical answer: choosing an auto-increment int as a public order ID — it leaked business volume, collided when sharding, and changing it required migrating every partner integration. A good answer explains the cost of reversal and what review/process would have caught it (an ADR + review for anything in a public contract).", he: "תשובה טיפוסית: לבחור int עם auto-increment כ-ID ציבורי להזמנה — זה הדליף נפח עסקי, התנגש כשעשו sharding, ושינוי דרש מיגרציה של כל אינטגרציה של שותף. תשובה טובה מסבירה את עלות ההפיכה ואיזה review/תהליך היה תופס את זה (ADR + review לכל דבר שנמצא בחוזה ציבורי)." } }
  ],
  quiz: [
    { q: { en: "Which is a well-formed non-functional requirement?", he: "איזו מהבאות היא דרישה לא-פונקציונלית מנוסחת היטב?" },
      options: [ { en: "The system must be fast", he: "המערכת חייבת להיות מהירה" }, { en: "p99 latency of POST /orders &lt; 400 ms at the load balancer", he: "p99 latency של POST /orders &lt; 400 ms ב-load balancer" }, { en: "Use Kafka for scalability", he: "להשתמש ב-Kafka בשביל scalability" }, { en: "Highly available and secure", he: "זמינה מאוד ומאובטחת" } ],
      answer: 1, explain: { en: "Measurable, scoped to a call, with a percentile and a measurement point.", he: "מדידה, ממוקדת בקריאה, עם percentile ונקודת מדידה." } },
    { q: { en: "What is the main purpose of a Non-goals section?", he: "מה המטרה העיקרית של סעיף Non-goals?" },
      options: [ { en: "List bugs we won't fix", he: "לרשום באגים שלא נתקן" }, { en: "Explicitly exclude reasonable expectations to control scope and focus review", he: "להוציא במפורש ציפיות סבירות כדי לשלוט ב-scope ולמקד את ה-review" }, { en: "Describe the team's weaknesses", he: "לתאר את החולשות של הצוות" }, { en: "Satisfy compliance auditors", he: "לרצות מבקרי רגולציה" } ],
      answer: 1, explain: { en: "Non-goals are reasonable things a reader might assume we're doing — written down so we don't.", he: "Non-goals הם דברים סבירים שקורא עשוי להניח שאנחנו עושים — כתובים כדי שלא נעשה אותם." } },
    { q: { en: "Which decision is most likely a one-way door?", he: "איזו החלטה היא כנראה דלת חד-כיוונית?" },
      options: [ { en: "Cache TTL of 60 s vs 120 s", he: "TTL של cache של 60 מול 120 שניות" }, { en: "Dashboard colors", he: "צבעי הדשבורד" }, { en: "The partition key of the primary database", he: "ה-partition key של ה-database הראשי" }, { en: "Autoscaling CPU threshold", he: "סף CPU ל-autoscaling" } ],
      answer: 2, explain: { en: "Changing a partition key means re-sharding all data — very expensive to reverse.", he: "שינוי partition key פירושו re-sharding של כל הדאטה — יקר מאוד להפוך." } },
    { q: { en: "A stakeholder asks for 99.99% availability. What's the best first response?", he: "בעל עניין מבקש 99.99% זמינות. מה התגובה הראשונה הכי טובה?" },
      options: [ { en: "Agree; it's the industry standard", he: "להסכים; זה הסטנדרט בתעשייה" }, { en: "Translate it (~4.3 min/month), explain what it requires and costs, and ask the cost of downtime", he: "לתרגם (~4.3 דק' בחודש), להסביר מה זה דורש וכמה עולה, ולשאול כמה עולה השבתה" }, { en: "Refuse; it's impossible", he: "לסרב; זה בלתי אפשרי" }, { en: "Promise 100%", he: "להבטיח 100%" } ],
      answer: 1, explain: { en: "Make the trade-off visible: each nine multiplies cost and complexity; the business decides with numbers.", he: "הופכים את ה-trade-off לגלוי: כל תשעה מכפילה עלות ומורכבות; הביזנס מחליט עם מספרים." } }
  ],
  related: ["pr-sizing", "pr-validate-yourself", "pr-principal-playbook", "staff-design-docs", "staff-interview-loop", "rel-sli-slo-sla"]
});

INFRA.lessons.push({
  id: "pr-sizing",
  track: "principal",
  order: 2,
  icon: "🧮",
  level: 3,
  minutes: 18,
  title: { en: "Sizing a System on a Napkin: QPS, Storage, Servers, Cost", he: "Sizing על מפית: QPS, אחסון, שרתים ועלות" },
  tldr: {
    en: "Turn users into requests/second, requests into cores, data into terabytes and all of it into dollars — with peak factors, replication and headroom — before anyone buys a single server.",
    he: "הופכים משתמשים לבקשות לשנייה, בקשות ל-cores, דאטה לטרהבייטים, והכול לדולרים — עם מקדם שיא, replication ו-headroom — לפני שמישהו קונה שרת אחד."
  },
  analogy: {
    en: "Planning a wedding: 400 guests (DAU), but they don't all arrive at once — 70% show up in the first 30 minutes (peak factor). Each eats ~600 g of food (payload), the caterer needs a cook per 50 guests (per-server throughput), you book a hall for 450 just in case (headroom), and you multiply it all by the price per plate (cost). Nobody plans a wedding by 'let's see how many people come and buy food then'. Sizing is that arithmetic for systems.",
    he: "מתכננים חתונה: 400 אורחים (DAU), אבל הם לא מגיעים כולם ביחד — 70% מגיעים בחצי השעה הראשונה (מקדם שיא). כל אחד אוכל ~600 גרם (payload), הקייטרינג צריך טבח לכל 50 אורחים (throughput לשרת), מזמינים אולם ל-450 ליתר ביטחון (headroom), ומכפילים הכול במחיר למנה (עלות). אף אחד לא מתכנן חתונה ב'נראה כמה יבואו ואז נקנה אוכל'. Sizing זה החשבון הזה למערכות."
  },
  sections: [
    {
      h: { en: "The cheat sheet: numbers to keep in your head", he: "השליף: המספרים שצריך להחזיק בראש" },
      body: {
        en: `<table>
<tr><th>Quantity</th><th>Value</th><th>Use it for</th></tr>
<tr><td>Seconds per day</td><td>86,400 ≈ <strong>10^5</strong></td><td>daily → per second (divide by 100k)</td></tr>
<tr><td>Seconds per month</td><td>~2.6M ≈ 2.5 × 10^6</td><td>monthly volumes, SLO budgets</td></tr>
<tr><td>1M req/day</td><td>≈ 12 req/s avg</td><td>quick conversion</td></tr>
<tr><td>2^10 / 2^20 / 2^30 / 2^40</td><td>KB / MB / GB / TB (≈10^3,10^6,10^9,10^12)</td><td>storage math</td></tr>
<tr><td>L1 / RAM / SSD read / same-DC RTT / cross-continent</td><td>1 ns / 100 ns / 100 µs / 0.5 ms / 150 ms</td><td>latency budgets</td></tr>
<tr><td>1 Gbps</td><td>≈ 125 MB/s</td><td>bandwidth</td></tr>
<tr><td>Simple API on 1 core</td><td>~500–2,000 req/s (Go/Java), ~100–300 (Python/Ruby)</td><td>server count</td></tr>
<tr><td>Postgres on a 16-vCPU box</td><td>~10–20k simple queries/s, ~2–5k writes/s</td><td>DB sizing</td></tr>
<tr><td>Redis single shard</td><td>~100k ops/s</td><td>cache sizing</td></tr>
<tr><td>Kafka partition</td><td>~5–10 MB/s write per partition</td><td>partition count</td></tr>
</table>
<blockquote>⚠️ Production tip: These are order-of-magnitude anchors, not benchmarks. The goal is to be within 2–3x, which is enough to tell "one Postgres" from "a sharded cluster". Validate with a load test before committing money (see pr-validate-yourself).</blockquote>`,
        he: `<table>
<tr><th>גודל</th><th>ערך</th><th>משתמשים בו ל-</th></tr>
<tr><td>שניות ביום</td><td>86,400 ≈ <strong>10^5</strong></td><td>מיומי לשנייה (מחלקים ב-100k)</td></tr>
<tr><td>שניות בחודש</td><td>~2.6M ≈ 2.5 × 10^6</td><td>נפחים חודשיים, תקציבי SLO</td></tr>
<tr><td>1M בקשות ביום</td><td>≈ 12 בקשות לשנייה בממוצע</td><td>המרה מהירה</td></tr>
<tr><td>2^10 / 2^20 / 2^30 / 2^40</td><td>KB / MB / GB / TB (≈10^3,10^6,10^9,10^12)</td><td>חישובי אחסון</td></tr>
<tr><td>L1 / RAM / קריאת SSD / RTT באותו DC / בין יבשות</td><td>1 ns / 100 ns / 100 µs / 0.5 ms / 150 ms</td><td>תקציבי latency</td></tr>
<tr><td>1 Gbps</td><td>≈ 125 MB/s</td><td>רוחב פס</td></tr>
<tr><td>API פשוט על core אחד</td><td>~500–2,000 req/s (Go/Java), ~100–300 (Python/Ruby)</td><td>מספר שרתים</td></tr>
<tr><td>Postgres על מכונה של 16 vCPU</td><td>~10–20k queries פשוטות/s, ~2–5k כתיבות/s</td><td>sizing ל-DB</td></tr>
<tr><td>Redis shard יחיד</td><td>~100k ops/s</td><td>sizing ל-cache</td></tr>
<tr><td>Kafka partition</td><td>~5–10 MB/s כתיבה לכל partition</td><td>מספר partitions</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: אלה עוגנים של סדר גודל, לא benchmarks. המטרה היא להיות בטווח של פי 2–3, וזה מספיק כדי להבדיל בין "Postgres אחד" ל-"cluster עם sharding". מאמתים עם load test לפני שמתחייבים לכסף (ראו pr-validate-yourself).</blockquote>`
      }
    },
    {
      h: { en: "Steps 1–3: users → QPS → peak", he: "שלבים 1–3: משתמשים → QPS → שיא" },
      body: {
        en: `<ol>
<li><strong>Actions per user per day.</strong> DAU × actions = daily requests. Split reads and writes.</li>
<li><strong>Average QPS</strong> = daily requests / 86,400 (≈ /10^5).</li>
<li><strong>Peak QPS</strong> = average × peak factor. Typical: 2–3x for global consumer apps (diurnal), 5–10x for single-timezone apps, 10–50x for flash sales, ticket drops, push-notification-triggered spikes.</li>
</ol>
<pre>Example: "Snapshot" photo-sharing app
DAU                 = 10M
uploads/user/day    = 2      -&gt; 20M uploads/day
feed views/user/day = 50     -&gt; 500M feed reads/day   (read:write = 25:1)

avg write QPS = 20M  / 86,400 ≈   230/s
avg read  QPS = 500M / 86,400 ≈ 5,800/s
peak factor   = 3 (evening in one main region)
peak write    ≈   700/s
peak read     ≈ 17,500/s</pre>
<p>Then <strong>Little's Law</strong> tells you concurrency: <code>L = λ × W</code>. At 17,500 req/s and 80 ms average latency, about <strong>1,400 requests are in flight</strong> at once — that's your thread/connection pool sizing input.</p>
<blockquote>💡 Real world: Peak factor is the number most often guessed wrong. If there's history, take the real p99 of per-minute traffic over the last 90 days divided by the daily average. If there's marketing, ask when the push notification goes out — a push to 5M users can create 50x for 2 minutes.</blockquote>`,
        he: `<ol>
<li><strong>פעולות למשתמש ביום.</strong> DAU × פעולות = בקשות ביום. מפרידים קריאות וכתיבות.</li>
<li><strong>QPS ממוצע</strong> = בקשות ביום / 86,400 (≈ /10^5).</li>
<li><strong>QPS בשיא</strong> = ממוצע × מקדם שיא. טיפוסי: 2–3x לאפליקציות צרכניות גלובליות (מחזור יומי), 5–10x לאפליקציה באזור זמן אחד, 10–50x ל-flash sales, פתיחת כרטיסים, קפיצות שנגרמות מ-push notification.</li>
</ol>
<pre>Example: "Snapshot" photo-sharing app
DAU                 = 10M
uploads/user/day    = 2      -&gt; 20M uploads/day
feed views/user/day = 50     -&gt; 500M feed reads/day   (read:write = 25:1)

avg write QPS = 20M  / 86,400 ≈   230/s
avg read  QPS = 500M / 86,400 ≈ 5,800/s
peak factor   = 3 (evening in one main region)
peak write    ≈   700/s
peak read     ≈ 17,500/s</pre>
<p>אחר כך <strong>Little's Law</strong> נותן concurrency: <code>L = λ × W</code>. ב-17,500 בקשות לשנייה ו-latency ממוצע של 80 ms, בערך <strong>1,400 בקשות נמצאות באוויר</strong> בו-זמנית — זה ה-input לגודל ה-thread/connection pool.</p>
<blockquote>💡 מהשטח: מקדם השיא הוא המספר שהכי הרבה טועים בו. אם יש היסטוריה, לוקחים את ה-p99 האמיתי של תנועה לדקה ב-90 הימים האחרונים חלקי הממוצע היומי. אם יש שיווק, שואלים מתי יוצא ה-push — push ל-5M משתמשים יכול לייצר x50 לשתי דקות.</blockquote>`
      }
    },
    {
      h: { en: "Steps 4–5: storage and bandwidth", he: "שלבים 4–5: אחסון ורוחב פס" },
      body: {
        en: `<pre>Photo: original 2 MB + 3 thumbnails (200 KB total) ≈ 2.2 MB
Metadata row: id, owner, caption, geo, timestamps ≈ 1 KB

Blob storage/day  = 20M × 2.2 MB  = 44 TB/day
Blob storage/year = 44 TB × 365   ≈ 16 PB/year   (object storage, not a DB!)
Metadata/day      = 20M × 1 KB    = 20 GB/day
Metadata/year     ≈ 7.3 TB raw
 × indexes (~1.5x) × replication (3 copies) ≈ 33 TB/year  -&gt; plan sharding by year 2

Bandwidth (egress, reads): each feed view loads ~10 thumbnails × 60 KB = 600 KB
peak egress = 17,500 × 600 KB ≈ 10.5 GB/s ≈ 84 Gbps  -&gt; this MUST come from a CDN
ingress (uploads) peak = 700 × 2.2 MB ≈ 1.5 GB/s ≈ 12 Gbps</pre>
<p>Rules of thumb for the multipliers:</p>
<ul>
<li><strong>Replication</strong>: ×3 for most DBs and object stores (object stores hide it in the price).</li>
<li><strong>Indexes</strong>: +30–100% of table size in OLTP databases.</li>
<li><strong>Free space</strong>: keep disks &lt; 70% full; Postgres needs room for VACUUM, Kafka for retention spikes, Elasticsearch stops writing at 95% (flood stage).</li>
<li><strong>Backups</strong>: full + incrementals ≈ 1.5–2x the DB size, often in another region.</li>
</ul>
<blockquote>💡 Real world: The storage number often decides the architecture more than QPS. 16 PB/year of photos means object storage with lifecycle tiers (hot → infrequent → archive) — moving 1-year-old photos to an archive tier can cut that line item 4–5x.</blockquote>`,
        he: `<pre>Photo: original 2 MB + 3 thumbnails (200 KB total) ≈ 2.2 MB
Metadata row: id, owner, caption, geo, timestamps ≈ 1 KB

Blob storage/day  = 20M × 2.2 MB  = 44 TB/day
Blob storage/year = 44 TB × 365   ≈ 16 PB/year   (object storage, not a DB!)
Metadata/day      = 20M × 1 KB    = 20 GB/day
Metadata/year     ≈ 7.3 TB raw
 × indexes (~1.5x) × replication (3 copies) ≈ 33 TB/year  -&gt; plan sharding by year 2

Bandwidth (egress, reads): each feed view loads ~10 thumbnails × 60 KB = 600 KB
peak egress = 17,500 × 600 KB ≈ 10.5 GB/s ≈ 84 Gbps  -&gt; this MUST come from a CDN
ingress (uploads) peak = 700 × 2.2 MB ≈ 1.5 GB/s ≈ 12 Gbps</pre>
<p>כללי אצבע למכפילים:</p>
<ul>
<li><strong>Replication</strong>: ×3 לרוב ה-DBs וה-object stores (ב-object stores זה מוחבא במחיר).</li>
<li><strong>Indexes</strong>: +30–100% מגודל הטבלה ב-DBs של OLTP.</li>
<li><strong>מקום פנוי</strong>: שומרים דיסקים מתחת ל-70% מלאים; Postgres צריך מקום ל-VACUUM, Kafka לקפיצות ב-retention, Elasticsearch מפסיק לכתוב ב-95% (flood stage).</li>
<li><strong>גיבויים</strong>: full + incrementals ≈ פי 1.5–2 מגודל ה-DB, לרוב ב-region אחר.</li>
</ul>
<blockquote>💡 מהשטח: מספר האחסון מכריע הרבה פעמים את הארכיטקטורה יותר מה-QPS. 16 PB בשנה של תמונות זה object storage עם lifecycle tiers (hot → infrequent → archive) — העברת תמונות בנות שנה ל-archive יכולה להוריד את השורה הזו בחשבון פי 4–5.</blockquote>`
      }
    },
    {
      h: { en: "Steps 6–8: cache, servers, DB connections, partitions", he: "שלבים 6–8: cache, שרתים, connections ל-DB, partitions" },
      body: {
        en: `<p><strong>Cache</strong> (80/20 rule: 20% of items get 80% of reads). Cache the hot feed entries and metadata, not the blobs (that's the CDN's job).</p>
<pre>hot metadata = 20% × (~50M distinct items read/day) × 1 KB ≈ 10 GB
+ precomputed feeds: 10M DAU × 200 ids × 8 B ≈ 16 GB
=&gt; ~30 GB working set -&gt; 3 Redis shards × 16 GB (+ replicas) = room to grow
cache ops at peak ≈ 17,500 × ~3 lookups ≈ 52k ops/s -&gt; fine for 3 shards</pre>
<p><strong>App servers</strong>: required cores = peak QPS / per-core throughput, then add headroom.</p>
<pre>feed API in Go: ~800 req/s per core (measured, includes cache + JSON)
17,500 / 800 ≈ 22 cores
target 60% CPU at peak (spikes + one AZ loss) -&gt; 22 / 0.6 ≈ 37 cores
=&gt; 10 × 4-vCPU pods over 3 AZs (losing one AZ still leaves ~27 cores)</pre>
<p><strong>DB connections</strong>: Little's Law again. If 700 writes/s take 5 ms of DB time each, only ~3.5 connections are busy on average — a pool of 20 per service is plenty. The classic mistake is 200 pods × 50 connections = 10,000 connections against a Postgres that's happy at ~300–500 → put PgBouncer in front.</p>
<p><strong>Queue partitions</strong>: thumbnail jobs at peak 700/s, 300 ms each → 700 × 0.3 = 210 concurrent jobs. If one consumer runs 10 in parallel, ~21 consumers → use ≥ 24–32 partitions (a partition is consumed by at most one consumer per group, so partitions cap parallelism).</p>
<blockquote>⚠️ Production tip: Size for <em>N+1</em>: the system must survive peak load with one AZ (or one node) gone. With 3 AZs, each AZ must be able to carry 50% of peak, not 33%.</blockquote>`,
        he: `<p><strong>Cache</strong> (כלל 80/20: 20% מהפריטים מקבלים 80% מהקריאות). שומרים ב-cache את רשומות ה-feed החמות וה-metadata, לא את ה-blobs (זה התפקיד של ה-CDN).</p>
<pre>hot metadata = 20% × (~50M distinct items read/day) × 1 KB ≈ 10 GB
+ precomputed feeds: 10M DAU × 200 ids × 8 B ≈ 16 GB
=&gt; ~30 GB working set -&gt; 3 Redis shards × 16 GB (+ replicas) = room to grow
cache ops at peak ≈ 17,500 × ~3 lookups ≈ 52k ops/s -&gt; fine for 3 shards</pre>
<p><strong>שרתי אפליקציה</strong>: cores נדרשים = QPS בשיא / throughput ל-core, ואז מוסיפים headroom.</p>
<pre>feed API in Go: ~800 req/s per core (measured, includes cache + JSON)
17,500 / 800 ≈ 22 cores
target 60% CPU at peak (spikes + one AZ loss) -&gt; 22 / 0.6 ≈ 37 cores
=&gt; 10 × 4-vCPU pods over 3 AZs (losing one AZ still leaves ~27 cores)</pre>
<p><strong>Connections ל-DB</strong>: שוב Little's Law. אם 700 כתיבות לשנייה לוקחות 5 ms של זמן DB כל אחת, רק ~3.5 connections עסוקים בממוצע — pool של 20 לכל service זה מספיק ויותר. הטעות הקלאסית היא 200 pods × 50 connections = 10,000 connections מול Postgres שמרגיש טוב ב-~300–500 → שמים PgBouncer לפניו.</p>
<p><strong>Partitions לתור</strong>: jobs של thumbnails בשיא 700/s, 300 ms כל אחד → 700 × 0.3 = 210 jobs במקביל. אם consumer אחד מריץ 10 במקביל, ~21 consumers → משתמשים ב-≥ 24–32 partitions (partition נצרך ע"י consumer אחד לכל היותר בכל group, אז ה-partitions מגבילים את המקביליות).</p>
<blockquote>⚠️ טיפ לפרודקשן: עושים sizing ל-<em>N+1</em>: המערכת חייבת לשרוד עומס שיא כשאחד ה-AZs (או node אחד) נעלם. עם 3 AZs, כל AZ חייב להחזיק 50% מהשיא, לא 33%.</blockquote>`
      }
    },
    {
      h: { en: "Step 9: turn it into money", he: "שלב 9: להפוך את זה לכסף" },
      body: {
        en: `<pre>Monthly cost sketch (list prices, order of magnitude)
compute: ~70 vCPU (app + workers) × ~$30/vCPU-month            ≈   $2,100
database: primary + replica, 16 vCPU each                       ≈   $3,000
redis: 3 shards + replicas                                      ≈   $1,500
object storage: avg ~8 PB in year 1 × ~$0.02/GB-month           ≈ $160,000
CDN egress: ~10 PB/month × ~$0.02/GB                            ≈ $200,000
-------------------------------------------------------------------------
total ≈ $370k/month; compute &lt; 2% -&gt; optimize STORAGE &amp; EGRESS, not pods</pre>
<p>This is the real power of sizing: it tells you <strong>where to spend engineering time</strong>. Here, shrinking thumbnails from 60 KB to 30 KB (WebP/AVIF) saves ~$100k/month; tuning the Go code saves ~$500.</p>
<p>Present the result as a table with assumptions explicit, so reviewers attack an assumption ("50 feed views/day is too high") instead of the conclusion.</p>
<blockquote>💡 Real world: Cost per unit is the metric executives understand: "$0.037 per DAU per month" or "$0.002 per order". Track it after launch — if it grows faster than usage, something is wrong (often logs, egress, or idle overprovisioning).</blockquote>`,
        he: `<pre>Monthly cost sketch (list prices, order of magnitude)
compute: ~70 vCPU (app + workers) × ~$30/vCPU-month            ≈   $2,100
database: primary + replica, 16 vCPU each                       ≈   $3,000
redis: 3 shards + replicas                                      ≈   $1,500
object storage: avg ~8 PB in year 1 × ~$0.02/GB-month           ≈ $160,000
CDN egress: ~10 PB/month × ~$0.02/GB                            ≈ $200,000
-------------------------------------------------------------------------
total ≈ $370k/month; compute &lt; 2% -&gt; optimize STORAGE &amp; EGRESS, not pods</pre>
<p>זה הכוח האמיתי של sizing: הוא אומר לכם <strong>איפה להשקיע את זמן ההנדסה</strong>. כאן, הקטנת thumbnails מ-60 KB ל-30 KB (WebP/AVIF) חוסכת ~$100k בחודש; כיוונון קוד ה-Go חוסך ~$500.</p>
<p>מציגים את התוצאה כטבלה עם הנחות מפורשות, כדי ש-reviewers יתקפו הנחה ("50 צפיות ב-feed ביום זה יותר מדי") ולא את המסקנה.</p>
<blockquote>💡 מהשטח: עלות ליחידה היא המטריקה שמנהלים מבינים: "$0.037 ל-DAU לחודש" או "$0.002 להזמנה". עוקבים אחריה אחרי ההשקה — אם היא גדלה מהר יותר מהשימוש, משהו לא בסדר (לרוב לוגים, egress, או overprovisioning שעומד idle).</blockquote>`
      }
    }
  ],
  diagram: `DAU x actions/day -> req/day -(/86,400)-> avg QPS -(x peak factor)-> PEAK QPS
                                                                     |
      +---------------------+--------------------+-------------------+
      v                     v                    v                   v
 cores = peak /       Little: L = lambda*W   cache = 20% hot    partitions >=
 per-core / 0.6       -> pools, DB conns     x item size        peak x job_time
                                                                / per-consumer
item size x writes/day -> storage/day x 365 x replication x indexes x free space
peak reads x response size -> egress Gbps -> CDN?
          everything x unit prices -> $/month -> $/user (track after launch)`,
  handsOn: [
    { cmd: "python -c \"dau=10e6; r=dau*50/86400; print('avg',round(r),'peak',round(r*3))\"", what: { en: "Compute average and peak read QPS for the worked example. Change DAU and peak factor and watch what moves.", he: "חשבו QPS ממוצע ובשיא לקריאות בדוגמה. שנו DAU ומקדם שיא ותראו מה זז." } },
    { cmd: "python -c \"print('in-flight =', 17500*0.080)\"", what: { en: "Little's Law: requests in flight = arrival rate × latency. Use it to size thread pools and DB connection pools.", he: "Little's Law: בקשות באוויר = קצב הגעה × latency. משתמשים בזה כדי לקבוע גודל של thread pools ו-connection pools ל-DB." } },
    { cmd: "psql -c \"SELECT pg_size_pretty(pg_total_relation_size('orders')) AS total, pg_size_pretty(pg_relation_size('orders')) AS heap;\"", what: { en: "Measure the real index overhead on an existing table (total vs heap) to calibrate your multipliers.", he: "מדדו את ה-overhead האמיתי של אינדקסים בטבלה קיימת (total מול heap) כדי לכייל את המכפילים." } },
    { cmd: "k6 run --vus 200 --duration 2m load.js", what: { en: "Measure the real per-core throughput of your service instead of trusting the cheat sheet; divide RPS by cores used.", he: "מדדו throughput אמיתי ל-core של השירות שלכם במקום לסמוך על השליף; מחלקים RPS במספר ה-cores שנוצלו." } }
  ],
  mnemonic: {
    en: "\"Users → Seconds → Peak → Bytes → Cores → Dollars.\" One day ≈ 10^5 seconds; 1M/day ≈ 12/s.",
    he: "\"משתמשים → שניות → שיא → בייטים → cores → דולרים.\" יום ≈ 10^5 שניות; 1M ביום ≈ 12 לשנייה."
  },
  pitfalls: [
    { en: "Sizing for average traffic. Systems die at peak; always apply a peak factor and N+1 (survive one AZ down).", he: "לעשות sizing לפי תנועה ממוצעת. מערכות מתות בשיא; תמיד מפעילים מקדם שיא ו-N+1 (לשרוד AZ אחד למטה)." },
    { en: "Forgetting replication, index and free-space multipliers — the 'raw' number can be 4–6x smaller than what you actually provision.", he: "לשכוח מכפילים של replication, אינדקסים ומקום פנוי — המספר ה'גולמי' יכול להיות קטן פי 4–6 ממה שבאמת צריך להקצות." },
    { en: "Optimizing compute when egress/storage dominate the bill. Always compute the cost breakdown before optimizing.", he: "לעשות אופטימיזציה ל-compute כש-egress/אחסון שולטים בחשבון. תמיד מחשבים את פירוק העלות לפני אופטימיזציה." },
    { en: "Hiding assumptions. Write 'assume 50 views/user/day' explicitly so it can be challenged and later checked against reality.", he: "להסתיר הנחות. כותבים במפורש 'נניח 50 צפיות למשתמש ביום' כדי שאפשר יהיה לערער עליה ולבדוק אותה מול המציאות." }
  ],
  interview: [
    { q: { en: "Estimate storage for a chat app with 50M DAU sending 40 messages/day.", he: "תעריך אחסון לאפליקציית צ'אט עם 50M DAU ששולחים 40 הודעות ביום." },
      a: { en: "2B messages/day ≈ 23k writes/s avg, ~70k peak. ~200 B per message with metadata → 400 GB/day raw ≈ 146 TB/year; ×3 replication ≈ 440 TB/year, plus indexes → ~0.6 PB/year. Conclusion: a horizontally scalable wide-column/KV store partitioned by conversation_id (Cassandra/ScyllaDB/DynamoDB), recent data cached, old data tiered; media stored separately in object storage. State the assumptions and which one matters most.", he: "2B הודעות ביום ≈ 23k כתיבות/s בממוצע, ~70k בשיא. ~200 B להודעה עם metadata → 400 GB ביום גולמי ≈ 146 TB בשנה; ×3 replication ≈ 440 TB בשנה, ועם אינדקסים → ~0.6 PB בשנה. מסקנה: store מסוג wide-column/KV שמתרחב אופקית עם partition לפי conversation_id (Cassandra/ScyllaDB/DynamoDB), דאטה עדכני ב-cache, ישן ב-tiering; מדיה נשמרת בנפרד ב-object storage. אומרים את ההנחות ואיזו מהן הכי משפיעה." } },
    { q: { en: "Why does Little's Law matter for a principal?", he: "למה Little's Law חשוב ל-Principal?" },
      a: { en: "It links throughput, latency and concurrency: L = λW. It sizes pools (threads, DB connections, workers) and explains incidents: when a dependency's latency doubles, in-flight requests double at the same QPS, pools exhaust and the service falls over even though traffic didn't change.", he: "הוא מקשר throughput, latency ו-concurrency: L = λW. הוא קובע גודל של pools (threads, connections ל-DB, workers) ומסביר תקלות: כש-latency של dependency מוכפל, הבקשות באוויר מוכפלות באותו QPS, ה-pools נגמרים והשירות קורס למרות שהתנועה לא השתנתה." } }
  ],
  quiz: [
    { q: { en: "100M requests/day is roughly how many requests per second on average?", he: "100M בקשות ביום זה בערך כמה בקשות לשנייה בממוצע?" },
      options: [ { en: "~100", he: "~100" }, { en: "~1,200", he: "~1,200" }, { en: "~12,000", he: "~12,000" }, { en: "~100,000", he: "~100,000" } ],
      answer: 1, explain: { en: "100M / 86,400 ≈ 1,157. Shortcut: divide by 10^5.", he: "100M / 86,400 ≈ 1,157. קיצור: מחלקים ב-10^5." } },
    { q: { en: "A service handles 2,000 req/s at 50 ms average latency. How many requests are in flight?", he: "שירות מטפל ב-2,000 req/s עם latency ממוצע של 50 ms. כמה בקשות באוויר?" },
      options: [ { en: "40", he: "40" }, { en: "100", he: "100" }, { en: "400", he: "400" }, { en: "2,000", he: "2,000" } ],
      answer: 1, explain: { en: "Little's Law: 2,000 × 0.05 = 100.", he: "Little's Law: 2,000 × 0.05 = 100." } },
    { q: { en: "You run in 3 AZs and must survive losing one at peak. Each AZ must be able to carry at least…", he: "אתם רצים ב-3 AZs וחייבים לשרוד אובדן של אחד בשיא. כל AZ צריך להיות מסוגל להחזיק לפחות…" },
      options: [ { en: "33% of peak", he: "33% מהשיא" }, { en: "50% of peak", he: "50% מהשיא" }, { en: "66% of peak", he: "66% מהשיא" }, { en: "100% of peak", he: "100% מהשיא" } ],
      answer: 1, explain: { en: "After losing one AZ, the remaining two share 100%, i.e. 50% each.", he: "אחרי אובדן AZ אחד, השניים הנותרים מתחלקים ב-100%, כלומר 50% כל אחד." } },
    { q: { en: "In the photo-app estimate, what dominated the monthly cost?", he: "בהערכה של אפליקציית התמונות, מה שלט בעלות החודשית?" },
      options: [ { en: "App servers", he: "שרתי אפליקציה" }, { en: "Redis", he: "Redis" }, { en: "Object storage and CDN egress", he: "Object storage ו-egress של CDN" }, { en: "The database", he: "ה-database" } ],
      answer: 2, explain: { en: "Blob storage and egress were ~98% of the bill — that's where optimization pays off.", he: "אחסון blobs ו-egress היו ~98% מהחשבון — שם אופטימיזציה משתלמת." } }
  ],
  playground: "scaling",
  related: ["pr-architect-questions", "rel-capacity-planning", "latency-numbers", "staff-queueing-tail-latency", "cloud-finops", "pr-scaling-kinds"]
});

INFRA.lessons.push({
  id: "pr-network-plan",
  track: "principal",
  order: 3,
  icon: "🗺️",
  level: 3,
  minutes: 16,
  title: { en: "Planning the Network for a New System", he: "תכנון הרשת למערכת חדשה" },
  tldr: {
    en: "Plan IP space for 5 years and every environment up front (no overlaps, ever), split public/private/data subnets per AZ, control egress, keep service traffic private, and choose peering vs transit hub before the third VPC exists.",
    he: "מתכננים מרחב IP ל-5 שנים ולכל הסביבות מראש (בלי חפיפות, אף פעם), מפרידים subnets ציבוריים/פרטיים/דאטה לכל AZ, שולטים ב-egress, שומרים תנועה בין שירותים פרטית, ובוחרים בין peering ל-transit hub לפני שקיים ה-VPC השלישי."
  },
  analogy: {
    en: "Planning a new city. You reserve land for future neighborhoods before anyone builds (CIDR plan); residential streets don't open directly onto the highway (private subnets); the bank vault is in a building with no street entrance at all (data subnets); there's one guarded city gate for trucks leaving (NAT/egress proxy); and you decide early whether cities connect by private roads between every pair (peering) or via one central interchange (transit gateway). Re-zoning a built city is ten times harder than planning it.",
    he: "מתכננים עיר חדשה. שומרים קרקע לשכונות עתידיות לפני שמישהו בונה (תכנון CIDR); רחובות המגורים לא נפתחים ישר לכביש המהיר (subnets פרטיים); הכספת של הבנק נמצאת בבניין בלי כניסה מהרחוב בכלל (subnets של דאטה); יש שער עיר אחד עם שומר למשאיות שיוצאות (NAT/egress proxy); ומחליטים מוקדם אם ערים מתחברות בכבישים פרטיים בין כל זוג (peering) או דרך מחלף מרכזי אחד (transit gateway). לשנות ייעוד של עיר בנויה קשה פי עשרה מלתכנן אותה."
  },
  sections: [
    {
      h: { en: "The IP address plan (the one-way door of networking)", he: "תוכנית כתובות ה-IP (הדלת החד-כיוונית של הרשת)" },
      body: {
        en: `<p>Overlapping CIDRs are the #1 networking regret: two VPCs with <code>10.0.0.0/16</code> can never be peered or routed together, and an acquisition or a VPN to on-prem will one day need exactly that. Rules:</p>
<ul>
<li>Reserve a big block per <strong>organization</strong> (e.g. <code>10.0.0.0/8</code>) and carve it hierarchically: region → environment → VPC.</li>
<li>Ask the on-prem/IT team which ranges are taken (offices, VPN pools, Docker's default <code>172.17.0.0/16</code>, Kubernetes service CIDRs).</li>
<li>Size generously: a <code>/16</code> per VPC (65k IPs) is cheap; running out of IPs in an EKS cluster (each pod takes a VPC IP with the AWS VPC CNI) is painful.</li>
<li>Write the plan in a single source of truth (IPAM: AWS VPC IPAM, NetBox, or a Terraform module) — not a wiki.</li>
</ul>
<pre>10.0.0.0/8  company
 ├─ 10.0.0.0/12   eu-west-1          (10.0.0.0 - 10.15.255.255)
 │   ├─ 10.0.0.0/16   prod-core
 │   ├─ 10.1.0.0/16   prod-data
 │   ├─ 10.4.0.0/16   staging
 │   └─ 10.8.0.0/16   dev
 ├─ 10.16.0.0/12  us-east-1          (same layout, +16)
 ├─ 10.32.0.0/12  reserved: future region
 └─ 10.200.0.0/14 on-prem + office + VPN pools (owned by IT)
k8s pod CIDR (overlay or secondary range): 100.64.0.0/10 (CGNAT space, non-routable outside)</pre>
<blockquote>💡 Real world: Many companies use <code>100.64.0.0/10</code> (CGNAT) as a secondary VPC CIDR just for Kubernetes pods, so pods don't burn the routable <code>10.x</code> space. EKS supports this with "custom networking".</blockquote>`,
        he: `<p>CIDRs חופפים הם החרטה מספר 1 ברשתות: שני VPCs עם <code>10.0.0.0/16</code> לעולם לא יוכלו לעשות peering או routing ביניהם, ורכישה של חברה או VPN ל-on-prem יצטרכו בדיוק את זה יום אחד. כללים:</p>
<ul>
<li>שומרים בלוק גדול לכל <strong>הארגון</strong> (למשל <code>10.0.0.0/8</code>) ומחלקים אותו היררכית: region → סביבה → VPC.</li>
<li>שואלים את צוות ה-on-prem/IT אילו טווחים תפוסים (משרדים, pools של VPN, ברירת המחדל של Docker <code>172.17.0.0/16</code>, CIDRs של services ב-Kubernetes).</li>
<li>עושים sizing נדיב: <code>/16</code> ל-VPC (65k כתובות) זה זול; להיגמר מ-IPs ב-cluster של EKS (כל pod לוקח IP מה-VPC עם AWS VPC CNI) זה כואב.</li>
<li>כותבים את התוכנית במקור אמת אחד (IPAM: AWS VPC IPAM, NetBox, או מודול Terraform) — לא בוויקי.</li>
</ul>
<pre>10.0.0.0/8  company
 ├─ 10.0.0.0/12   eu-west-1          (10.0.0.0 - 10.15.255.255)
 │   ├─ 10.0.0.0/16   prod-core
 │   ├─ 10.1.0.0/16   prod-data
 │   ├─ 10.4.0.0/16   staging
 │   └─ 10.8.0.0/16   dev
 ├─ 10.16.0.0/12  us-east-1          (same layout, +16)
 ├─ 10.32.0.0/12  reserved: future region
 └─ 10.200.0.0/14 on-prem + office + VPN pools (owned by IT)
k8s pod CIDR (overlay or secondary range): 100.64.0.0/10 (CGNAT space, non-routable outside)</pre>
<blockquote>💡 מהשטח: הרבה חברות משתמשות ב-<code>100.64.0.0/10</code> (CGNAT) כ-CIDR משני ל-VPC רק בשביל pods של Kubernetes, כדי שה-pods לא ישרפו את מרחב ה-<code>10.x</code> הניתן לניתוב. EKS תומך בזה עם "custom networking".</blockquote>`
      }
    },
    {
      h: { en: "Inside one VPC: three tiers × three AZs", he: "בתוך VPC אחד: שלוש שכבות × שלושה AZs" },
      body: {
        en: `<table>
<tr><th>Tier</th><th>What lives here</th><th>Route to internet</th><th>Example /20 per AZ (a, b, c)</th></tr>
<tr><td>Public</td><td>Load balancers, NAT gateways, bastion (ideally none)</td><td>Internet Gateway</td><td>10.0.0.0/22, 10.0.4.0/22, 10.0.8.0/22</td></tr>
<tr><td>Private (app)</td><td>K8s nodes/pods, VMs, Lambdas in VPC</td><td>via NAT (egress only)</td><td>10.0.16.0/20, 10.0.32.0/20, 10.0.48.0/20</td></tr>
<tr><td>Data</td><td>RDS, ElastiCache, Kafka, OpenSearch</td><td>none</td><td>10.0.64.0/22, 10.0.68.0/22, 10.0.72.0/22</td></tr>
<tr><td>Spare</td><td>Future tiers (e.g. firewall, endpoints)</td><td>—</td><td>10.0.128.0/17 left unallocated</td></tr>
</table>
<p>Public subnets are small (LBs need few IPs); app subnets are big (pods!); data subnets are medium. Security groups enforce tier-to-tier rules: <code>LB-sg → app-sg:8080</code>, <code>app-sg → db-sg:5432</code>, nothing else. The DB has no route to or from the internet at all.</p>
<p>One VPC per environment, ideally one <strong>account/subscription/project per environment</strong> too: it's the strongest blast-radius and IAM boundary you get for free. Dev must never be able to reach prod data by routing.</p>
<blockquote>⚠️ Production tip: NAT gateways are per-AZ resources. One NAT for all AZs = cross-AZ data charges and a single point of failure; one NAT per AZ costs ~$32/month each plus $0.045/GB processed — at high egress that per-GB line can be thousands per month, so send S3/DynamoDB traffic through free gateway endpoints instead.</blockquote>`,
        he: `<table>
<tr><th>שכבה</th><th>מה גר כאן</th><th>נתיב לאינטרנט</th><th>דוגמה ל-AZ (a, b, c)</th></tr>
<tr><td>Public</td><td>Load balancers, NAT gateways, bastion (עדיף שאין)</td><td>Internet Gateway</td><td>10.0.0.0/22, 10.0.4.0/22, 10.0.8.0/22</td></tr>
<tr><td>Private (app)</td><td>Nodes/pods של K8s, VMs, Lambdas בתוך VPC</td><td>דרך NAT (רק יציאה)</td><td>10.0.16.0/20, 10.0.32.0/20, 10.0.48.0/20</td></tr>
<tr><td>Data</td><td>RDS, ElastiCache, Kafka, OpenSearch</td><td>אין</td><td>10.0.64.0/22, 10.0.68.0/22, 10.0.72.0/22</td></tr>
<tr><td>Spare</td><td>שכבות עתידיות (firewall, endpoints)</td><td>—</td><td>10.0.128.0/17 לא מוקצה</td></tr>
</table>
<p>Subnets ציבוריים קטנים (ל-LBs צריך מעט IPs); subnets של אפליקציה גדולים (pods!); subnets של דאטה בינוניים. Security groups אוכפים חוקים בין שכבות: <code>LB-sg → app-sg:8080</code>, <code>app-sg → db-sg:5432</code>, ותו לא. ל-DB אין שום נתיב לאינטרנט או ממנו.</p>
<p>VPC אחד לכל סביבה, ועדיף גם <strong>account/subscription/project לכל סביבה</strong>: זה גבול ה-blast radius וה-IAM הכי חזק שמקבלים בחינם. Dev לעולם לא אמור להגיע לדאטה של prod דרך routing.</p>
<blockquote>⚠️ טיפ לפרודקשן: NAT gateways הם משאבים ברמת AZ. NAT אחד לכל ה-AZs = חיובי תעבורה בין AZs ו-single point of failure; NAT לכל AZ עולה ~$32 לחודש כל אחד ועוד $0.045 ל-GB שעובר — ב-egress גבוה השורה הזו יכולה להגיע לאלפים בחודש, אז מעבירים תנועה ל-S3/DynamoDB דרך gateway endpoints שהם בחינם.</blockquote>`
      }
    },
    {
      h: { en: "Ingress, egress and private endpoints", he: "Ingress, egress ו-private endpoints" },
      body: {
        en: `<p><strong>Ingress path</strong> for a public system: <code>DNS → CDN (cache, DDoS absorb) → WAF (OWASP rules, rate limits, bot control) → L7 load balancer (TLS termination) → service</code>. Only the LB is in a public subnet. Internal admin tools go behind an identity-aware proxy (Cloudflare Access, IAP, Pomerium) — not a public IP with a password.</p>
<p><strong>Egress control</strong> is where most designs are lazy. Default "allow all outbound via NAT" means a compromised pod can exfiltrate data anywhere. Better:</p>
<ul>
<li>Egress through a proxy/firewall with an <strong>allowlist of domains</strong> (Stripe, SendGrid, your registry): AWS Network Firewall, Squid, or Cilium FQDN policies.</li>
<li>Stable egress IPs (NAT EIPs) that partners can allowlist — ask the partners if they need them.</li>
<li><strong>Private endpoints</strong> (AWS PrivateLink/VPC endpoints, Azure Private Link, GCP Private Service Connect) for cloud APIs and SaaS: traffic to S3, KMS, ECR, Snowflake stays off the internet and off the NAT bill.</li>
</ul>
<p><strong>DNS</strong>: private hosted zones for internal names (<code>orders.internal.example.com</code>), split-horizon when the same name must resolve differently inside and outside, and Route 53 Resolver / conditional forwarders for hybrid on-prem name resolution. Decide the internal naming convention now: <code>&lt;service&gt;.&lt;env&gt;.&lt;region&gt;.internal</code>.</p>
<blockquote>💡 Real world: The Capital One 2019 breach combined an SSRF in a WAF with broad outbound access and a permissive IAM role. Egress allowlists + IMDSv2 + least-privilege roles would each have broken the chain.</blockquote>`,
        he: `<p><strong>מסלול ה-ingress</strong> למערכת ציבורית: <code>DNS → CDN (cache, ספיגת DDoS) → WAF (חוקי OWASP, rate limits, bot control) → L7 load balancer (סיום TLS) → service</code>. רק ה-LB נמצא ב-subnet ציבורי. כלי אדמין פנימיים עומדים מאחורי identity-aware proxy (Cloudflare Access, IAP, Pomerium) — לא IP ציבורי עם סיסמה.</p>
<p><strong>שליטה ב-egress</strong> זה המקום שבו רוב התכנונים עצלנים. ברירת מחדל של "הכול מותר החוצה דרך NAT" אומרת ש-pod שנפרץ יכול להוציא דאטה לכל מקום. עדיף:</p>
<ul>
<li>Egress דרך proxy/firewall עם <strong>allowlist של דומיינים</strong> (Stripe, SendGrid, ה-registry שלכם): AWS Network Firewall, Squid, או policies של FQDN ב-Cilium.</li>
<li>כתובות IP יציבות ליציאה (EIPs של NAT) ששותפים יכולים לשים ב-allowlist — שואלים את השותפים אם הם צריכים את זה.</li>
<li><strong>Private endpoints</strong> (AWS PrivateLink/VPC endpoints, Azure Private Link, GCP Private Service Connect) ל-APIs של הענן ול-SaaS: תנועה ל-S3, KMS, ECR, Snowflake נשארת מחוץ לאינטרנט ומחוץ לחשבון ה-NAT.</li>
</ul>
<p><strong>DNS</strong>: private hosted zones לשמות פנימיים (<code>orders.internal.example.com</code>), split-horizon כשאותו שם צריך להיפתר אחרת בפנים ובחוץ, ו-Route 53 Resolver / conditional forwarders לפתרון שמות היברידי מול on-prem. מחליטים על מוסכמת שמות פנימית עכשיו: <code>&lt;service&gt;.&lt;env&gt;.&lt;region&gt;.internal</code>.</p>
<blockquote>💡 מהשטח: הפריצה ל-Capital One ב-2019 שילבה SSRF ב-WAF עם גישה רחבה החוצה ו-IAM role מתירני. Allowlist ל-egress + IMDSv2 + roles עם least privilege — כל אחד מהם לבד היה שובר את השרשרת.</blockquote>`
      }
    },
    {
      h: { en: "Connecting VPCs, regions and on-prem", he: "חיבור VPCs, regions ו-on-prem" },
      body: {
        en: `<table>
<tr><th>Option</th><th>Good for</th><th>Watch out</th></tr>
<tr><td>VPC peering</td><td>2–3 VPCs, simple, no extra hop</td><td>Not transitive; N VPCs need N(N-1)/2 peerings (10 VPCs = 45)</td></tr>
<tr><td>Transit Gateway / Virtual WAN / NCC hub</td><td>Many VPCs + on-prem, central routing &amp; inspection</td><td>~$0.02/GB processing + attachment fees; a shared critical component</td></tr>
<tr><td>PrivateLink (service endpoint)</td><td>Expose ONE service to other VPCs/tenants, even with overlapping CIDRs</td><td>One-directional, per-service; TCP only</td></tr>
<tr><td>Site-to-site VPN</td><td>Hybrid start, backup link</td><td>~1.25 Gbps per tunnel, internet jitter</td></tr>
<tr><td>Direct Connect / ExpressRoute / Interconnect</td><td>Steady high-volume hybrid, predictable latency</td><td>Weeks to provision; buy two in different locations</td></tr>
</table>
<p><strong>Service-to-service</strong> inside the platform: decide early between plain SG/NetworkPolicy rules and a <strong>service mesh / mTLS</strong> (Istio, Linkerd, Cilium) that gives identity-based authz (<code>orders</code> may call <code>payments</code>, nobody else may). For a 5-service system, NetworkPolicies + TLS are often enough; at 50 services, identity-based policy pays off.</p>
<p><strong>IPv6</strong>: dual-stack is now cheap on all clouds and avoids IPv4 exhaustion in huge k8s clusters; AWS also charges for every public IPv4 (~$3.6/month each since 2024). Decide whether your edge is dual-stack on day 1.</p>
<blockquote>⚠️ Production tip: Draw the expected <em>traffic matrix</em> (who talks to whom, how many Gbps, same or cross AZ/region). Cross-AZ traffic costs ~$0.01–0.02/GB in each direction — a chatty service pair at 1 Gbps across AZs is ~$6k/month.</blockquote>`,
        he: `<table>
<tr><th>אפשרות</th><th>טובה ל-</th><th>לשים לב</th></tr>
<tr><td>VPC peering</td><td>2–3 VPCs, פשוט, בלי hop נוסף</td><td>לא טרנזיטיבי; N VPCs צריכים N(N-1)/2 peerings (10 VPCs = 45)</td></tr>
<tr><td>Transit Gateway / Virtual WAN / NCC hub</td><td>הרבה VPCs + on-prem, routing ו-inspection מרכזיים</td><td>~$0.02 ל-GB + עמלות attachment; רכיב קריטי משותף</td></tr>
<tr><td>PrivateLink (service endpoint)</td><td>לחשוף service <strong>אחד</strong> ל-VPCs/לקוחות אחרים, גם עם CIDRs חופפים</td><td>חד-כיווני, לכל service; רק TCP</td></tr>
<tr><td>Site-to-site VPN</td><td>התחלה היברידית, קו גיבוי</td><td>~1.25 Gbps ל-tunnel, jitter של אינטרנט</td></tr>
<tr><td>Direct Connect / ExpressRoute / Interconnect</td><td>היברידי יציב בנפח גבוה, latency צפוי</td><td>שבועות להקמה; קונים שניים במיקומים שונים</td></tr>
</table>
<p><strong>Service-to-service</strong> בתוך הפלטפורמה: מחליטים מוקדם בין חוקי SG/NetworkPolicy פשוטים לבין <strong>service mesh / mTLS</strong> (Istio, Linkerd, Cilium) שנותן authz מבוסס זהות (<code>orders</code> מותר לקרוא ל-<code>payments</code>, לאף אחד אחר לא). במערכת של 5 שירותים, NetworkPolicies + TLS הרבה פעמים מספיקים; ב-50 שירותים, policy מבוסס זהות משתלם.</p>
<p><strong>IPv6</strong>: dual-stack היום זול בכל העננים ומונע מיצוי IPv4 ב-clusters ענקיים של k8s; AWS גם גובה על כל IPv4 ציבורי (~$3.6 לחודש לכל אחד מאז 2024). מחליטים אם ה-edge שלכם dual-stack מהיום הראשון.</p>
<blockquote>⚠️ טיפ לפרודקשן: ציירו את <em>מטריצת התנועה</em> הצפויה (מי מדבר עם מי, כמה Gbps, באותו AZ/region או בין). תנועה בין AZs עולה ~$0.01–0.02 ל-GB לכל כיוון — זוג שירותים פטפטני ב-1 Gbps בין AZs זה ~$6k בחודש.</blockquote>`
      }
    },
    {
      h: { en: "Worked example: the network section of a design doc", he: "דוגמה מלאה: סעיף הרשת ב-design doc" },
      body: {
        en: `<pre>Network — "Orders platform", eu-west-1, prod
- Account: orders-prod (separate from orders-staging, shared-network)
- VPC: 10.0.0.0/16 (from IPAM pool eu-west-1/prod), secondary 100.64.0.0/16 for pods
- Subnets: public /22 ×3, app /20 ×3, data /22 ×3; 50% of space unallocated
- Ingress: CloudFront -&gt; WAF (managed rules + 2k req/5min/IP) -&gt; ALB (public) -&gt; EKS
- Egress: NAT GW per AZ -&gt; AWS Network Firewall allowlist:
          api.stripe.com, api.sendgrid.com, *.ecr.eu-west-1.amazonaws.com
- Endpoints: S3 + DynamoDB (gateway), ECR, KMS, STS, Secrets Manager (interface)
- DNS: private zone orders.prod.internal; Resolver rules -&gt; on-prem corp.local
- Connectivity: TGW attachment to shared-network (on-prem via 2× Direct Connect 10G)
- East-west: Cilium NetworkPolicies default-deny; mTLS via Linkerd for payments path
- Traffic matrix: app&lt;-&gt;db ~200 Mbps (same-AZ preferred), egress to Stripe &lt; 5 Mbps
- Non-goals: multi-region active-active; IPv6 internally (edge is dual-stack)</pre>
<p>Notice what it answers: where IPs come from, what's reachable from where, how data leaves, how cost is controlled, and what's explicitly out.</p>`,
        he: `<pre>Network — "Orders platform", eu-west-1, prod
- Account: orders-prod (separate from orders-staging, shared-network)
- VPC: 10.0.0.0/16 (from IPAM pool eu-west-1/prod), secondary 100.64.0.0/16 for pods
- Subnets: public /22 ×3, app /20 ×3, data /22 ×3; 50% of space unallocated
- Ingress: CloudFront -&gt; WAF (managed rules + 2k req/5min/IP) -&gt; ALB (public) -&gt; EKS
- Egress: NAT GW per AZ -&gt; AWS Network Firewall allowlist:
          api.stripe.com, api.sendgrid.com, *.ecr.eu-west-1.amazonaws.com
- Endpoints: S3 + DynamoDB (gateway), ECR, KMS, STS, Secrets Manager (interface)
- DNS: private zone orders.prod.internal; Resolver rules -&gt; on-prem corp.local
- Connectivity: TGW attachment to shared-network (on-prem via 2× Direct Connect 10G)
- East-west: Cilium NetworkPolicies default-deny; mTLS via Linkerd for payments path
- Traffic matrix: app&lt;-&gt;db ~200 Mbps (same-AZ preferred), egress to Stripe &lt; 5 Mbps
- Non-goals: multi-region active-active; IPv6 internally (edge is dual-stack)</pre>
<p>שימו לב על מה זה עונה: מאיפה מגיעים ה-IPs, מה נגיש ממה, איך דאטה יוצא, איך שולטים בעלות, ומה במפורש בחוץ.</p>`
      }
    }
  ],
  diagram: `             Internet
                |
        DNS -> CDN -> WAF
                |
 +--------------VPC 10.0.0.0/16 (prod account)-------------------+
 |  AZ-a            AZ-b            AZ-c                          |
 | [public]        [public]        [public]   ALB, NAT-GW per AZ  |
 |    |               |               |                           |
 | [app /20]       [app /20]       [app /20]  k8s nodes / pods    |
 |    |  SG: app->db:5432 only        |                           |
 | [data /22]      [data /22]      [data /22] RDS, Redis, Kafka   |
 |  (no internet route)                                          |
 |  VPC endpoints: S3, ECR, KMS  ---- egress firewall allowlist ->|-> Stripe, SendGrid
 +-----------------------------+----------------------------------+
                               | TGW
          +--------------------+-------------------+
       staging VPC        shared-services       on-prem (2x DX)`,
  handsOn: [
    { cmd: "python -c \"import ipaddress as i; print(list(i.ip_network('10.0.0.0/16').subnets(new_prefix=20))[:4])\"", what: { en: "Carve a /16 into /20 app subnets and check there's no overlap with your other ranges.", he: "חלקו /16 ל-subnets של /20 לאפליקציה ובדקו שאין חפיפה עם הטווחים האחרים שלכם." } },
    { cmd: "python -c \"import ipaddress as i; print(i.ip_network('10.0.0.0/16').overlaps(i.ip_network('10.0.128.0/17')))\"", what: { en: "Overlap check — run it for every new range against the IPAM list before creating a VPC.", he: "בדיקת חפיפה — מריצים לכל טווח חדש מול רשימת ה-IPAM לפני שיוצרים VPC." } },
    { cmd: "aws ec2 describe-subnets --query 'Subnets[].{AZ:AvailabilityZone,CIDR:CidrBlock,Free:AvailableIpAddressCount}' --output table", what: { en: "See free IPs per subnet — watch app subnets in EKS clusters before they run out.", he: "רואים IPs פנויים לכל subnet — עוקבים אחרי subnets של אפליקציה ב-clusters של EKS לפני שהם נגמרים." } },
    { cmd: "dig +short orders.prod.internal @169.254.169.253", what: { en: "Verify private DNS resolves from inside the VPC (AWS resolver address); from outside it should not.", he: "מוודאים ש-DNS פרטי נפתר מתוך ה-VPC (כתובת ה-resolver של AWS); מבחוץ זה לא אמור לעבוד." } }
  ],
  mnemonic: {
    en: "\"Plan big, never overlap; LB public, app private, data hidden; one gate out, private roads in.\"",
    he: "\"מתכננים גדול, אף פעם לא חופפים; LB ציבורי, אפליקציה פרטית, דאטה מוסתר; שער אחד החוצה, כבישים פרטיים פנימה.\""
  },
  pitfalls: [
    { en: "Every team picks 10.0.0.0/16 — later peering, VPN to on-prem or a merger becomes impossible without re-IPing.", he: "כל צוות בוחר 10.0.0.0/16 — אחר כך peering, VPN ל-on-prem או מיזוג הופכים לבלתי אפשריים בלי להחליף כתובות." },
    { en: "Tiny app subnets in EKS with the VPC CNI — pods take VPC IPs and the cluster stops scheduling at 3 a.m.", he: "Subnets קטנים לאפליקציה ב-EKS עם VPC CNI — pods לוקחים IPs מה-VPC וה-cluster מפסיק לתזמן ב-3 בלילה." },
    { en: "Unrestricted egress through NAT: a security hole and often the surprise line on the bill (S3 traffic via NAT instead of a free gateway endpoint).", he: "Egress בלי הגבלה דרך NAT: חור אבטחה והרבה פעמים השורה המפתיעה בחשבון (תנועה ל-S3 דרך NAT במקום gateway endpoint חינמי)." },
    { en: "Full-mesh VPC peering past ~5 VPCs — non-transitive routes become unmanageable; move to a transit hub.", he: "Full-mesh של VPC peering מעבר ל-~5 VPCs — נתיבים לא טרנזיטיביים הופכים לבלתי ניתנים לניהול; עוברים ל-transit hub." }
  ],
  interview: [
    { q: { en: "How would you lay out the network for a new production service on AWS?", he: "איך היית פורש את הרשת לשירות פרודקשן חדש ב-AWS?" },
      a: { en: "Dedicated prod account; VPC CIDR from a central IPAM, non-overlapping, /16 with room; three tiers (public/app/data) across 3 AZs; ALB in public, workloads in private, data with no internet route; SG chaining; NAT per AZ with egress allowlist; VPC endpoints for S3/ECR/KMS; private DNS zone; TGW to shared services/on-prem; CDN+WAF in front. Then mention cost (NAT, cross-AZ) and what you'd monitor (flow logs, free IPs).", he: "Account ייעודי ל-prod; CIDR ל-VPC מ-IPAM מרכזי, בלי חפיפה, /16 עם מקום; שלוש שכבות (public/app/data) על 3 AZs; ALB ב-public, workloads ב-private, דאטה בלי נתיב לאינטרנט; שרשור SGs; NAT לכל AZ עם allowlist ל-egress; VPC endpoints ל-S3/ECR/KMS; private DNS zone; TGW ל-shared services/on-prem; CDN+WAF מלפנים. אחר כך מזכירים עלות (NAT, cross-AZ) ומה מנטרים (flow logs, IPs פנויים)." } },
    { q: { en: "Peering vs Transit Gateway vs PrivateLink — when each?", he: "Peering מול Transit Gateway מול PrivateLink — מתי כל אחד?" },
      a: { en: "Peering for a few VPCs with full mutual reachability and lowest cost per GB. Transit Gateway when many VPCs and on-prem need routing and central inspection. PrivateLink when you want to expose one service (not a whole network), possibly to other tenants, even with overlapping CIDRs.", he: "Peering לכמה VPCs עם נגישות הדדית מלאה ועלות הכי נמוכה ל-GB. Transit Gateway כשהרבה VPCs ו-on-prem צריכים routing ו-inspection מרכזי. PrivateLink כשרוצים לחשוף service אחד (לא רשת שלמה), אולי ללקוחות אחרים, גם עם CIDRs חופפים." } }
  ],
  quiz: [
    { q: { en: "Why reserve non-overlapping CIDRs across all environments and on-prem from day 1?", he: "למה שומרים CIDRs לא חופפים בכל הסביבות וב-on-prem מהיום הראשון?" },
      options: [ { en: "Overlapping ranges are slower", he: "טווחים חופפים איטיים יותר" }, { en: "Overlapping networks can't be routed/peered together later without re-IPing", he: "רשתות חופפות לא יכולות לעבור routing/peering ביניהן בהמשך בלי החלפת כתובות" }, { en: "Clouds charge more for overlaps", he: "העננים גובים יותר על חפיפות" }, { en: "DNS requires it", he: "DNS דורש את זה" } ],
      answer: 1, explain: { en: "Routing needs unique destinations; re-IPing live systems is a huge migration.", he: "Routing צריך יעדים ייחודיים; החלפת כתובות למערכות חיות היא מיגרציה ענקית." } },
    { q: { en: "Where should the primary database live?", he: "איפה ה-database הראשי צריך לשבת?" },
      options: [ { en: "Public subnet with a strong password", he: "Subnet ציבורי עם סיסמה חזקה" }, { en: "Data subnet with no internet route, reachable only from the app security group", he: "Subnet של דאטה בלי נתיב לאינטרנט, נגיש רק מה-security group של האפליקציה" }, { en: "Same subnet as the load balancer", he: "אותו subnet כמו ה-load balancer" }, { en: "Any subnet; security groups don't matter", he: "כל subnet; security groups לא משנים" } ],
      answer: 1, explain: { en: "Defense in depth: no route plus SG chaining.", he: "Defense in depth: אין נתיב, ועוד שרשור SGs." } },
    { q: { en: "What's a cheap way to cut NAT gateway cost for heavy S3 traffic?", he: "מה דרך זולה להוריד עלות NAT gateway לתנועת S3 כבדה?" },
      options: [ { en: "Bigger NAT instance", he: "NAT instance גדול יותר" }, { en: "S3 gateway VPC endpoint", he: "S3 gateway VPC endpoint" }, { en: "Move S3 to a public subnet", he: "להעביר את S3 ל-subnet ציבורי" }, { en: "Use IPv4 only", he: "להשתמש רק ב-IPv4" } ],
      answer: 1, explain: { en: "Gateway endpoints for S3/DynamoDB are free and bypass NAT processing charges.", he: "Gateway endpoints ל-S3/DynamoDB בחינם ועוקפים את חיובי העיבוד של NAT." } },
    { q: { en: "You have 12 VPCs plus on-prem that all need connectivity. Best fit?", he: "יש 12 VPCs ועוד on-prem שכולם צריכים קישוריות. מה מתאים?" },
      options: [ { en: "Full-mesh VPC peering", he: "Full-mesh של VPC peering" }, { en: "A transit hub (Transit Gateway / Virtual WAN)", he: "Transit hub (Transit Gateway / Virtual WAN)" }, { en: "Public IPs everywhere", he: "IPs ציבוריים בכל מקום" }, { en: "One giant VPC for everything", he: "VPC ענק אחד לכול" } ],
      answer: 1, explain: { en: "12 VPCs would need 66 peerings and still no transitive routing to on-prem; a hub scales.", he: "12 VPCs היו צריכים 66 peerings ועדיין בלי routing טרנזיטיבי ל-on-prem; hub מתרחב." } }
  ],
  playground: "cidr",
  related: ["net-vpc", "net-ip-cidr", "net-firewalls", "net-isolation", "net-dns", "staff-service-mesh", "cloud-airgapped"]
});

INFRA.lessons.push({
  id: "pr-test-strategy",
  track: "principal",
  order: 4,
  icon: "🧪",
  level: 3,
  minutes: 17,
  title: { en: "Test Strategy: From Unit Tests to Testing in Production", he: "אסטרטגיית בדיקות: מ-Unit Tests ועד בדיקות בפרודקשן" },
  tldr: {
    en: "Tests are a portfolio: many fast unit tests for logic, real-dependency integration tests for wiring, contract tests between teams, few end-to-end tests for critical journeys, load tests for the numbers you promised, and canaries for everything you couldn't predict.",
    he: "בדיקות הן תיק השקעות: הרבה unit tests מהירים ללוגיקה, integration tests מול dependencies אמיתיים לחיווט, contract tests בין צוותים, מעט end-to-end לזרימות קריטיות, load tests למספרים שהבטחתם, ו-canaries לכל מה שלא יכולתם לחזות."
  },
  analogy: {
    en: "Building a car. You test each bolt and each spark plug on the bench (unit). You test that the engine starts when bolted to the real gearbox (integration). You check the tire matches the rim spec the supplier promised (contract). You do a few full test drives on a track (end-to-end). You put it on a dyno at 200 km/h for 10 hours (load/soak). You crash it into a wall on purpose (chaos). And after it ships, you still collect telemetry from the first 1,000 cars before shipping a million (canary). Skipping any layer doesn't save time — it moves the discovery to the customer.",
    he: "בונים מכונית. בודקים כל בורג וכל מצת על השולחן (unit). בודקים שהמנוע מניע כשהוא מחובר לתיבת ההילוכים האמיתית (integration). בודקים שהצמיג מתאים למפרט החישוק שהספק הבטיח (contract). עושים כמה נסיעות מבחן מלאות במסלול (end-to-end). שמים אותה על דינמומטר ב-200 קמ\"ש ל-10 שעות (load/soak). מתנגשים בקיר בכוונה (chaos). ואחרי שהיא יוצאת, עדיין אוספים טלמטריה מ-1,000 המכוניות הראשונות לפני ששולחים מיליון (canary). לדלג על שכבה לא חוסך זמן — זה רק מעביר את הגילוי ללקוח."
  },
  sections: [
    {
      h: { en: "The pyramid, the trophy, and what each layer buys", he: "הפירמידה, הגביע, ומה כל שכבה קונה" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Scope</th><th>Speed</th><th>Catches</th><th>Typical share</th></tr>
<tr><td>Static (types, lint, SAST)</td><td>source</td><td>seconds</td><td>typos, nulls, injection patterns</td><td>always on</td></tr>
<tr><td>Unit</td><td>one function/class, no I/O</td><td>ms</td><td>logic, edge cases</td><td>~60–70%</td></tr>
<tr><td>Integration</td><td>service + real DB/queue (containers)</td><td>seconds</td><td>SQL, serialization, config, migrations</td><td>~20–30%</td></tr>
<tr><td>Contract</td><td>consumer ↔ provider API shape</td><td>seconds</td><td>breaking API changes across teams</td><td>per integration</td></tr>
<tr><td>End-to-end</td><td>whole system via UI/API</td><td>minutes</td><td>wiring of critical journeys</td><td>~5–10 tests</td></tr>
<tr><td>Non-functional</td><td>load, stress, soak, spike, chaos, security</td><td>minutes–hours</td><td>capacity, leaks, resilience</td><td>before launch + regularly</td></tr>
</table>
<p>The <strong>pyramid</strong> (Mike Cohn) says: many cheap tests at the bottom, few expensive at the top. The <strong>testing trophy</strong> (Kent C. Dodds) argues that for modern services integration tests give the best confidence per minute, because most bugs live in the seams (SQL, JSON, config), not in pure logic. Principal answer: both — <em>pure logic</em> gets unit tests, <em>I/O-heavy glue code</em> gets integration tests, and you avoid the <strong>ice-cream cone</strong> anti-pattern (mostly manual + E2E, few units).</p>
<blockquote>💡 Real world: Google's guidance is ~70/20/10 (small/medium/large) and classifies tests by <em>resources</em> they use (small = single process, no network), not by name. That definition is easier to enforce in CI.</blockquote>`,
        he: `<table>
<tr><th>שכבה</th><th>היקף</th><th>מהירות</th><th>תופסת</th><th>חלק טיפוסי</th></tr>
<tr><td>Static (types, lint, SAST)</td><td>קוד מקור</td><td>שניות</td><td>טעויות הקלדה, nulls, דפוסי injection</td><td>תמיד פועל</td></tr>
<tr><td>Unit</td><td>פונקציה/מחלקה אחת, בלי I/O</td><td>ms</td><td>לוגיקה, edge cases</td><td>~60–70%</td></tr>
<tr><td>Integration</td><td>service + DB/תור אמיתי (containers)</td><td>שניות</td><td>SQL, סריאליזציה, קונפיג, migrations</td><td>~20–30%</td></tr>
<tr><td>Contract</td><td>צורת ה-API בין consumer ל-provider</td><td>שניות</td><td>שינויים שוברים ב-API בין צוותים</td><td>לכל אינטגרציה</td></tr>
<tr><td>End-to-end</td><td>כל המערכת דרך UI/API</td><td>דקות</td><td>חיווט של זרימות קריטיות</td><td>~5–10 בדיקות</td></tr>
<tr><td>Non-functional</td><td>load, stress, soak, spike, chaos, אבטחה</td><td>דקות–שעות</td><td>קיבולת, דליפות, חוסן</td><td>לפני השקה + באופן קבוע</td></tr>
</table>
<p>ה-<strong>פירמידה</strong> (Mike Cohn) אומרת: הרבה בדיקות זולות למטה, מעט יקרות למעלה. ה-<strong>testing trophy</strong> (Kent C. Dodds) טוען שבשירותים מודרניים integration tests נותנים הכי הרבה ביטחון לדקה, כי רוב הבאגים חיים בתפרים (SQL, JSON, קונפיג), לא בלוגיקה טהורה. תשובת Principal: שניהם — <em>לוגיקה טהורה</em> מקבלת unit tests, <em>קוד דבק עם הרבה I/O</em> מקבל integration tests, ונמנעים מה-anti-pattern של <strong>גביע גלידה</strong> (בעיקר ידני + E2E, מעט units).</p>
<blockquote>💡 מהשטח: ההנחיה של Google היא ~70/20/10 (small/medium/large) והם מסווגים בדיקות לפי <em>המשאבים</em> שהן משתמשות בהם (small = process יחיד, בלי רשת), לא לפי שם. קל יותר לאכוף את ההגדרה הזו ב-CI.</blockquote>`
      }
    },
    {
      h: { en: "Test doubles: dummy, stub, fake, spy, mock", he: "Test doubles: dummy, stub, fake, spy, mock" },
      body: {
        en: `<table>
<tr><th>Double</th><th>What it is</th><th>Example</th></tr>
<tr><td>Dummy</td><td>Passed but never used</td><td><code>new OrderService(null_logger)</code></td></tr>
<tr><td>Stub</td><td>Returns canned answers</td><td>FX rate client that always returns 3.7</td></tr>
<tr><td>Fake</td><td>A working lightweight implementation</td><td>In-memory repository, SQLite instead of Postgres, LocalStack</td></tr>
<tr><td>Spy</td><td>Stub that records how it was called</td><td>Email sender that stores sent messages for assertions</td></tr>
<tr><td>Mock</td><td>Pre-programmed with expectations; fails if not called as expected</td><td><code>payment.expect(charge(42, 1000)).once()</code></td></tr>
</table>
<pre># Python: unit test with a stub + spy, no network
class FakeEmail:                     # spy
    def __init__(self): self.sent = []
    def send(self, to, subject): self.sent.append((to, subject))

def test_order_confirmation_sent_once():
    email = FakeEmail()
    svc = OrderService(repo=InMemoryRepo(), email=email,
                       fx=lambda cur: 3.7)          # stub
    svc.place(order_id="o-1", user="dana@x.com", total=100)
    svc.place(order_id="o-1", user="dana@x.com", total=100)   # retry
    assert email.sent == [("dana@x.com", "Order o-1 confirmed")]  # idempotent!</pre>
<p>Rule: <strong>mock what you own, fake what you don't</strong> — and prefer fakes/state assertions over mocks/interaction assertions. Over-mocked tests verify the implementation, not the behavior, and break on every refactor while bugs still pass.</p>
<blockquote>⚠️ Production tip: Don't mock the database in tests of repository code. Use <strong>Testcontainers</strong> to start real Postgres/Kafka/Redis in Docker per test suite (~2–5 s). SQLite-instead-of-Postgres fakes hide real differences (JSONB, locking, isolation levels).</blockquote>`,
        he: `<table>
<tr><th>Double</th><th>מה זה</th><th>דוגמה</th></tr>
<tr><td>Dummy</td><td>מועבר אבל אף פעם לא בשימוש</td><td><code>new OrderService(null_logger)</code></td></tr>
<tr><td>Stub</td><td>מחזיר תשובות קבועות</td><td>Client של שערי מטבע שתמיד מחזיר 3.7</td></tr>
<tr><td>Fake</td><td>מימוש עובד וקליל</td><td>Repository בזיכרון, SQLite במקום Postgres, LocalStack</td></tr>
<tr><td>Spy</td><td>Stub שרושם איך קראו לו</td><td>שולח מיילים ששומר את ההודעות שנשלחו בשביל assertions</td></tr>
<tr><td>Mock</td><td>מתוכנת מראש עם ציפיות; נכשל אם לא קראו לו כמצופה</td><td><code>payment.expect(charge(42, 1000)).once()</code></td></tr>
</table>
<pre># Python: unit test with a stub + spy, no network
class FakeEmail:                     # spy
    def __init__(self): self.sent = []
    def send(self, to, subject): self.sent.append((to, subject))

def test_order_confirmation_sent_once():
    email = FakeEmail()
    svc = OrderService(repo=InMemoryRepo(), email=email,
                       fx=lambda cur: 3.7)          # stub
    svc.place(order_id="o-1", user="dana@x.com", total=100)
    svc.place(order_id="o-1", user="dana@x.com", total=100)   # retry
    assert email.sent == [("dana@x.com", "Order o-1 confirmed")]  # idempotent!</pre>
<p>כלל: <strong>עושים mock למה שבבעלותכם, fake למה שלא</strong> — ומעדיפים fakes/assertions על state על פני mocks/assertions על אינטראקציה. בדיקות עם יותר מדי mocks בודקות את המימוש, לא את ההתנהגות, ונשברות בכל refactor בזמן שבאגים עדיין עוברים.</p>
<blockquote>⚠️ טיפ לפרודקשן: לא עושים mock ל-database בבדיקות של קוד repository. משתמשים ב-<strong>Testcontainers</strong> כדי להרים Postgres/Kafka/Redis אמיתיים ב-Docker לכל suite (~2–5 שניות). Fakes של SQLite-במקום-Postgres מסתירים הבדלים אמיתיים (JSONB, נעילות, isolation levels).</blockquote>`
      }
    },
    {
      h: { en: "Contract, property-based and mutation testing", he: "Contract, property-based ו-mutation testing" },
      body: {
        en: `<p><strong>Contract tests (consumer-driven, e.g. Pact)</strong>: the consumer writes down what it needs from the provider ("GET /users/42 returns <code>id</code> and <code>email</code> as strings"). The provider's CI replays these contracts against its real code. A provider can then remove a field only when no consumer contract uses it. This replaces the slow, flaky "deploy everything to staging and run E2E" for cross-team APIs.</p>
<p><strong>Property-based testing</strong> (Hypothesis, fast-check, QuickCheck): instead of 5 hand-picked examples, state a property and let the tool generate thousands of inputs and shrink failures to the minimal case.</p>
<pre>from hypothesis import given, strategies as st
@given(st.lists(st.integers()))
def test_sort_properties(xs):
    out = my_sort(xs)
    assert len(out) == len(xs)                       # nothing lost
    assert all(a &lt;= b for a, b in zip(out, out[1:]))  # ordered
    assert sorted(xs) == out                          # same as oracle</pre>
<p>Great for serializers (<code>decode(encode(x)) == x</code>), parsers, money math, idempotency (<code>f(f(x)) == f(x)</code>).</p>
<p><strong>Mutation testing</strong> (Stryker, PIT, mutmut): the tool changes your code (<code>&gt;</code> to <code>&gt;=</code>, removes a line) and checks whether any test fails. Surviving mutants reveal tests that execute code without asserting on it. It's the honest answer to "is 85% coverage good?" — coverage measures lines <em>run</em>, not behavior <em>checked</em>.</p>`,
        he: `<p><strong>Contract tests (consumer-driven, למשל Pact)</strong>: ה-consumer כותב מה הוא צריך מה-provider ("GET /users/42 מחזיר <code>id</code> ו-<code>email</code> כמחרוזות"). ה-CI של ה-provider מריץ את החוזים האלה מול הקוד האמיתי שלו. ה-provider יכול להסיר שדה רק כשאף חוזה של consumer לא משתמש בו. זה מחליף את ה"נעשה deploy להכול ב-staging ונריץ E2E" האיטי וה-flaky עבור APIs בין צוותים.</p>
<p><strong>Property-based testing</strong> (Hypothesis, fast-check, QuickCheck): במקום 5 דוגמאות שנבחרו ביד, מגדירים תכונה ונותנים לכלי לייצר אלפי inputs ולכווץ כישלונות למקרה המינימלי.</p>
<pre>from hypothesis import given, strategies as st
@given(st.lists(st.integers()))
def test_sort_properties(xs):
    out = my_sort(xs)
    assert len(out) == len(xs)                       # nothing lost
    assert all(a &lt;= b for a, b in zip(out, out[1:]))  # ordered
    assert sorted(xs) == out                          # same as oracle</pre>
<p>מצוין ל-serializers (<code>decode(encode(x)) == x</code>), parsers, חישובי כסף, אידמפוטנטיות (<code>f(f(x)) == f(x)</code>).</p>
<p><strong>Mutation testing</strong> (Stryker, PIT, mutmut): הכלי משנה את הקוד (<code>&gt;</code> ל-<code>&gt;=</code>, מוחק שורה) ובודק אם בדיקה כלשהי נכשלת. Mutants ששורדים חושפים בדיקות שמריצות קוד בלי לבדוק אותו. זו התשובה הכנה ל"85% coverage זה טוב?" — coverage מודד שורות <em>שרצו</em>, לא התנהגות <em>שנבדקה</em>.</p>`
      }
    },
    {
      h: { en: "Performance tests: load, stress, soak, spike", he: "בדיקות ביצועים: load, stress, soak, spike" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Question</th><th>Shape</th></tr>
<tr><td>Load</td><td>Do we meet the SLO at expected peak?</td><td>ramp to 1x peak, hold 15–30 min</td></tr>
<tr><td>Stress</td><td>Where and how do we break? Gracefully?</td><td>ramp beyond peak until errors</td></tr>
<tr><td>Soak</td><td>Leaks, GC creep, connection exhaustion?</td><td>~70% peak for 8–24 h</td></tr>
<tr><td>Spike</td><td>Does autoscaling/queueing absorb a burst?</td><td>0 → 10x in 30 s</td></tr>
</table>
<pre>// k6: load test with SLO thresholds (CI fails if violated)
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  stages: [ { duration: '2m', target: 300 },    // ramp
            { duration: '20m', target: 300 },   // hold at expected peak
            { duration: '2m', target: 0 } ],
  thresholds: {
    http_req_duration: ['p(99)&lt;400'],          // our SLO
    http_req_failed:   ['rate&lt;0.001'],
  },
};
export default function () {
  const r = http.post('https://staging.api/orders',
    JSON.stringify({ sku: 'MUG-1', qty: 1 }),
    { headers: { 'Content-Type': 'application/json',
                 'Idempotency-Key': crypto.randomUUID() } });
  check(r, { '201': (x) =&gt; x.status === 201 });
}</pre>
<p>Load-test against production-like data volume (a 10-row table is always fast), from outside the cluster, and watch the <em>dependencies</em> — the DB usually breaks before your pods.</p>
<blockquote>⚠️ Production tip: <strong>Chaos experiments</strong> (kill a pod, add 300 ms latency to the DB, drop an AZ) are tests of your resilience <em>claims</em>. Run them in staging first, then in prod during business hours with a stop button (Gremlin, Litmus, AWS FIS, Chaos Mesh).</blockquote>`,
        he: `<table>
<tr><th>סוג</th><th>שאלה</th><th>צורה</th></tr>
<tr><td>Load</td><td>עומדים ב-SLO בשיא הצפוי?</td><td>ramp ל-1x שיא, להחזיק 15–30 דק'</td></tr>
<tr><td>Stress</td><td>איפה ואיך נשברים? בחן?</td><td>ramp מעבר לשיא עד שגיאות</td></tr>
<tr><td>Soak</td><td>דליפות, זחילת GC, מיצוי connections?</td><td>~70% מהשיא ל-8–24 שעות</td></tr>
<tr><td>Spike</td><td>Autoscaling/תורים סופגים פרץ?</td><td>0 → x10 תוך 30 שניות</td></tr>
</table>
<pre>// k6: load test with SLO thresholds (CI fails if violated)
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  stages: [ { duration: '2m', target: 300 },    // ramp
            { duration: '20m', target: 300 },   // hold at expected peak
            { duration: '2m', target: 0 } ],
  thresholds: {
    http_req_duration: ['p(99)&lt;400'],          // our SLO
    http_req_failed:   ['rate&lt;0.001'],
  },
};
export default function () {
  const r = http.post('https://staging.api/orders',
    JSON.stringify({ sku: 'MUG-1', qty: 1 }),
    { headers: { 'Content-Type': 'application/json',
                 'Idempotency-Key': crypto.randomUUID() } });
  check(r, { '201': (x) =&gt; x.status === 201 });
}</pre>
<p>מריצים load test מול נפח דאטה דמוי-פרודקשן (טבלה עם 10 שורות תמיד מהירה), מחוץ ל-cluster, ומסתכלים על ה-<em>dependencies</em> — ה-DB בדרך כלל נשבר לפני ה-pods שלכם.</p>
<blockquote>⚠️ טיפ לפרודקשן: <strong>ניסויי Chaos</strong> (להרוג pod, להוסיף 300 ms latency ל-DB, להפיל AZ) הם בדיקות של <em>הטענות</em> שלכם על חוסן. מריצים קודם ב-staging, אחר כך ב-prod בשעות עבודה עם כפתור עצירה (Gremlin, Litmus, AWS FIS, Chaos Mesh).</blockquote>`
      }
    },
    {
      h: { en: "Testing in production, flaky tests, and the plan for a new service", he: "בדיקות בפרודקשן, בדיקות flaky, והתוכנית לשירות חדש" },
      body: {
        en: `<p>Staging never equals production (data, traffic shape, scale, neighbors). So the last layer of testing happens in prod, <em>safely</em>:</p>
<ul>
<li><strong>Canary</strong>: 1% → 5% → 25% → 100% with automated analysis of error rate/latency vs baseline (Argo Rollouts, Flagger).</li>
<li><strong>Shadow / dark traffic</strong>: mirror real requests to the new version, discard its responses, diff results. Perfect for rewrites.</li>
<li><strong>Feature flags</strong>: deploy dark, enable for employees, then 1% of users; kill switch in seconds.</li>
<li><strong>Synthetic probes</strong>: a bot places a real test order every minute from 3 regions.</li>
</ul>
<p><strong>Flaky tests</strong> are a reliability problem, not an annoyance: once people learn to "just re-run", real failures get ignored. Quarantine within a day (tag + ticket + owner), fix root causes (time, ordering, shared state, sleeps instead of waits, port collisions), and track a flake rate.</p>
<p><strong>Test plan for a new "orders" service</strong> (what a principal writes in the design doc):</p>
<pre>Unit:        pricing, discounts, state machine transitions, idempotency logic (+ property tests for money)
Integration: repository vs Postgres (Testcontainers), outbox -&gt; Kafka, migrations up/down
Contract:    Pact with web/mobile consumers; provider verification vs payments API sandbox
E2E (5):     browse -&gt; cart -&gt; pay -&gt; confirm; refund; out-of-stock; 3DS challenge; retry-after-timeout
Load:        300 orders/s for 20 min, p99 &lt; 400 ms, DB CPU &lt; 60%
Soak:        12 h at 200/s, no memory growth &gt; 5%
Chaos:       kill 1 of 3 pods; payments +2 s latency -&gt; circuit opens, orders queue
Security:    SAST + dependency scan in CI, DAST weekly, authz tests per role
Prod:        canary 5% for 30 min with auto-rollback; synthetic order every 60 s</pre>`,
        he: `<p>Staging אף פעם לא שווה לפרודקשן (דאטה, צורת תנועה, סקייל, שכנים). לכן שכבת הבדיקות האחרונה קורית ב-prod, <em>בבטחה</em>:</p>
<ul>
<li><strong>Canary</strong>: 1% → 5% → 25% → 100% עם ניתוח אוטומטי של error rate/latency מול baseline (Argo Rollouts, Flagger).</li>
<li><strong>Shadow / dark traffic</strong>: משכפלים בקשות אמיתיות לגרסה החדשה, זורקים את התשובות שלה, ומשווים תוצאות. מושלם ל-rewrites.</li>
<li><strong>Feature flags</strong>: עושים deploy כבוי, מפעילים לעובדים, אחר כך ל-1% מהמשתמשים; kill switch תוך שניות.</li>
<li><strong>Synthetic probes</strong>: בוט מבצע הזמנת בדיקה אמיתית כל דקה מ-3 regions.</li>
</ul>
<p><strong>בדיקות flaky</strong> הן בעיית אמינות, לא מטרד: ברגע שאנשים לומדים "פשוט להריץ שוב", כישלונות אמיתיים מתעלמים מהם. מכניסים להסגר תוך יום (tag + טיקט + בעלים), מתקנים שורש (זמן, סדר, state משותף, sleeps במקום waits, התנגשויות פורטים), ועוקבים אחרי flake rate.</p>
<p><strong>תוכנית בדיקות לשירות "orders" חדש</strong> (מה ש-Principal כותב/ת ב-design doc):</p>
<pre>Unit:        pricing, discounts, state machine transitions, idempotency logic (+ property tests for money)
Integration: repository vs Postgres (Testcontainers), outbox -&gt; Kafka, migrations up/down
Contract:    Pact with web/mobile consumers; provider verification vs payments API sandbox
E2E (5):     browse -&gt; cart -&gt; pay -&gt; confirm; refund; out-of-stock; 3DS challenge; retry-after-timeout
Load:        300 orders/s for 20 min, p99 &lt; 400 ms, DB CPU &lt; 60%
Soak:        12 h at 200/s, no memory growth &gt; 5%
Chaos:       kill 1 of 3 pods; payments +2 s latency -&gt; circuit opens, orders queue
Security:    SAST + dependency scan in CI, DAST weekly, authz tests per role
Prod:        canary 5% for 30 min with auto-rollback; synthetic order every 60 s</pre>`
      }
    }
  ],
  diagram: `                 /\\        canary / shadow / flags   (prod)
                /  \\       chaos, load, soak, spike  (pre-prod)
               / E2E\\      5-10 critical journeys     minutes, flaky-prone
              /------\\
             /contract\\    consumer <-> provider shape (Pact)
            /----------\\
           / integration\\  real Postgres/Kafka via Testcontainers   seconds
          /--------------\\
         /      unit      \\  pure logic, property-based, mutation   ms
        /------------------\\
       static: types, lint, SAST, dependency scan          always on
  cost & slowness grows upward; confidence per test grows upward`,
  handsOn: [
    { cmd: "pytest -q -m 'not integration' --durations=10", what: { en: "Run only fast tests and list the 10 slowest — a 'unit' test taking 2 s is secretly an integration test.", he: "מריצים רק בדיקות מהירות ומציגים את 10 האיטיות — 'unit test' שלוקח 2 שניות הוא בסתר integration test." } },
    { cmd: "docker run --rm -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:16", what: { en: "What Testcontainers does under the hood: a real throwaway Postgres for integration tests.", he: "מה ש-Testcontainers עושה מתחת למכסה: Postgres אמיתי וחד-פעמי ל-integration tests." } },
    { cmd: "k6 run --summary-trend-stats='p(50),p(99),max' load.js", what: { en: "Run a load test with SLO thresholds; the exit code fails CI when the p99 threshold is broken.", he: "מריצים load test עם ספי SLO; ה-exit code מכשיל את ה-CI כשסף ה-p99 נשבר." } },
    { cmd: "mutmut run && mutmut results", what: { en: "Mutation testing in Python: surviving mutants show code that is executed but not really verified.", he: "Mutation testing ב-Python: mutants ששרדו מראים קוד שרץ אבל לא באמת נבדק." } }
  ],
  mnemonic: {
    en: "\"Units for logic, containers for seams, contracts for teams, E2E for journeys, load for promises, canaries for surprises.\"",
    he: "\"Units ללוגיקה, containers לתפרים, contracts לצוותים, E2E למסעות, load להבטחות, canaries להפתעות.\""
  },
  pitfalls: [
    { en: "Chasing a coverage number. 100% coverage with weak assertions catches nothing; mutation score tells the truth.", he: "לרדוף אחרי מספר coverage. 100% coverage עם assertions חלשים לא תופס כלום; mutation score אומר את האמת." },
    { en: "Mocking everything, including the database — tests pass, prod fails on SQL, locking or serialization.", he: "לעשות mock להכול, כולל ה-database — הבדיקות עוברות, prod נכשל על SQL, נעילות או סריאליזציה." },
    { en: "Hundreds of E2E tests as the main safety net: slow, flaky, and they point at 'something broke somewhere'.", he: "מאות בדיקות E2E כרשת הביטחון העיקרית: איטיות, flaky, ומצביעות על 'משהו נשבר איפשהו'." },
    { en: "Load testing with an empty database or from inside the same node — numbers look great and mean nothing.", he: "Load test עם database ריק או מתוך אותו node — המספרים נראים מעולה ולא אומרים כלום." }
  ],
  interview: [
    { q: { en: "How do you decide what to test with unit vs integration tests?", he: "איך מחליטים מה לבדוק ב-unit ומה ב-integration?" },
      a: { en: "Pure decision logic (pricing, state machines, parsing) → unit tests, many cases, property-based where possible. Code whose risk is in the interaction with something external (SQL, ORM mappings, Kafka serialization, HTTP clients, config) → integration tests against real dependencies via containers. If a unit test needs five mocks, the code is glue and belongs in an integration test — or needs refactoring to separate logic from I/O (functional core, imperative shell).", he: "לוגיקת החלטה טהורה (תמחור, state machines, parsing) → unit tests, הרבה מקרים, property-based כשאפשר. קוד שהסיכון שלו באינטראקציה עם משהו חיצוני (SQL, מיפויי ORM, סריאליזציה ל-Kafka, HTTP clients, קונפיג) → integration tests מול dependencies אמיתיים ב-containers. אם unit test צריך חמישה mocks, הקוד הוא דבק ושייך ל-integration test — או שצריך refactor שיפריד לוגיקה מ-I/O (functional core, imperative shell)." } },
    { q: { en: "Two teams keep breaking each other's APIs in staging. What do you introduce?", he: "שני צוותים שוברים אחד לשני את ה-APIs ב-staging כל הזמן. מה מכניסים?" },
      a: { en: "Consumer-driven contract tests (Pact + a broker): consumers publish expectations, the provider verifies them in CI before merge, and 'can-i-deploy' gates releases. Plus API versioning rules (additive changes only, deprecation window) and schema registry for events.", he: "Consumer-driven contract tests (Pact + broker): ה-consumers מפרסמים ציפיות, ה-provider מאמת אותן ב-CI לפני merge, ו-'can-i-deploy' חוסם releases. ובנוסף כללי versioning ל-API (רק שינויים מוסיפים, חלון deprecation) ו-schema registry ל-events." } }
  ],
  quiz: [
    { q: { en: "Which test double is a working lightweight implementation (e.g. an in-memory repository)?", he: "איזה test double הוא מימוש עובד וקליל (למשל repository בזיכרון)?" },
      options: [ { en: "Dummy", he: "Dummy" }, { en: "Stub", he: "Stub" }, { en: "Fake", he: "Fake" }, { en: "Mock", he: "Mock" } ],
      answer: 2, explain: { en: "Fakes really work, just not production-grade; stubs return canned values; mocks verify interactions.", he: "Fakes באמת עובדים, רק לא ברמת פרודקשן; stubs מחזירים ערכים קבועים; mocks מאמתים אינטראקציות." } },
    { q: { en: "Which test finds a memory leak that appears after 6 hours?", he: "איזו בדיקה תמצא דליפת זיכרון שמופיעה אחרי 6 שעות?" },
      options: [ { en: "Spike test", he: "Spike test" }, { en: "Soak test", he: "Soak test" }, { en: "Contract test", he: "Contract test" }, { en: "Unit test", he: "Unit test" } ],
      answer: 1, explain: { en: "Soak = sustained load for many hours to expose leaks and slow degradation.", he: "Soak = עומס מתמשך לשעות רבות כדי לחשוף דליפות והידרדרות איטית." } },
    { q: { en: "What does mutation testing measure that line coverage doesn't?", he: "מה mutation testing מודד ש-line coverage לא?" },
      options: [ { en: "Execution speed", he: "מהירות ריצה" }, { en: "Whether tests actually fail when the code's behavior changes", he: "האם הבדיקות באמת נכשלות כשהתנהגות הקוד משתנה" }, { en: "Number of tests", he: "מספר הבדיקות" }, { en: "Code style", he: "סגנון קוד" } ],
      answer: 1, explain: { en: "Coverage says code ran; surviving mutants show it wasn't checked.", he: "Coverage אומר שהקוד רץ; mutants ששרדו מראים שהוא לא נבדק." } },
    { q: { en: "Best way to validate a rewrite of a read API against real traffic with zero user impact?", he: "הדרך הכי טובה לאמת rewrite של API קריאה מול תנועה אמיתית בלי השפעה על משתמשים?" },
      options: [ { en: "Big-bang deploy on Friday", he: "Deploy בבת אחת ביום שישי" }, { en: "Shadow traffic with response diffing", he: "Shadow traffic עם השוואת תשובות" }, { en: "More unit tests", he: "יותר unit tests" }, { en: "Manual QA in staging", he: "QA ידני ב-staging" } ],
      answer: 1, explain: { en: "Mirror real requests to the new version, discard its output, compare — real coverage, no risk (for reads).", he: "משכפלים בקשות אמיתיות לגרסה החדשה, זורקים את הפלט, משווים — כיסוי אמיתי בלי סיכון (לקריאות)." } }
  ],
  related: ["pr-validate-yourself", "rel-deployments", "rel-chaos-engineering", "k8s-argo-rollouts", "cloud-cicd", "pr-idempotency"]
});

INFRA.lessons.push({
  id: "pr-validate-yourself",
  track: "principal",
  order: 5,
  icon: "🔍",
  level: 3,
  minutes: 16,
  title: { en: "Validating Your Own Design (Before Production Does It for You)", he: "לאמת את התכנון של עצמך (לפני שהפרודקשן יעשה את זה בשבילך)" },
  tldr: {
    en: "A principal assumes their design is wrong somewhere and goes hunting: write it down, run a pre-mortem, threat-model it, list failure modes, prototype the riskiest part, load-test the estimates, invite skeptics — and after launch, compare reality to the prediction.",
    he: "Principal מניח/ה שהתכנון שלו/ה שגוי איפשהו ויוצא/ת לצוד: כותבים אותו, עושים pre-mortem, threat model, רשימת failure modes, prototype לחלק הכי מסוכן, load test להערכות, מזמינים ספקנים — ואחרי ההשקה משווים את המציאות לתחזית."
  },
  analogy: {
    en: "A pilot doesn't trust their memory or their confidence — they run a checklist before every takeoff, brief 'what we'll do if an engine fails on the runway' before it happens, practice failures in a simulator, and after landing, the flight data is reviewed. Experienced pilots use checklists more, not less. Self-validation is the engineer's pre-flight checklist and simulator.",
    he: "טייס/ת לא סומך/ת על הזיכרון או על הביטחון העצמי — עוברים צ'קליסט לפני כל המראה, עושים תדריך 'מה נעשה אם מנוע ייכשל על המסלול' לפני שזה קורה, מתרגלים תקלות בסימולטור, ואחרי הנחיתה מנתחים את נתוני הטיסה. טייסים מנוסים משתמשים יותר בצ'קליסטים, לא פחות. אימות עצמי הוא הצ'קליסט והסימולטור של המהנדס/ת."
  },
  sections: [
    {
      h: { en: "Write it down: design doc and ADRs", he: "לכתוב: design doc ו-ADRs" },
      body: {
        en: `<p>Writing is the first validation step: vague thinking can't survive being written precisely. A design doc exposes gaps ("wait, what happens on retry?") before code does. For each significant decision, also write an <strong>ADR</strong> (Architecture Decision Record) — one page, immutable, numbered:</p>
<pre># ADR-014: Use Postgres (not DynamoDB) for the orders store
Status: Accepted (2026-11-10)   Deciders: orders team, platform, data
Context:
  Orders need multi-row transactions (order + items + outbox), ad-hoc
  queries from support, ~700 writes/s peak, 2 TB in 3 years.
Options:
  A) Postgres (Aurora) — ACID, SQL, team knows it; vertical limit ~20k w/s
  B) DynamoDB — infinite scale, single-digit ms; no ad-hoc queries,
     transactions limited to 100 items, team has no experience
Decision: A. Re-evaluate if sustained writes &gt; 5k/s or data &gt; 10 TB.
Consequences:
  + simple outbox in same transaction; + support can query read replica
  - must plan partitioning (by created_at) at ~2 TB
  - single-writer; failover ~30 s (acceptable per SLO 99.95%)</pre>
<p>The key line is the <strong>re-evaluation trigger</strong>: it turns "we might outgrow it" into a measurable alarm. Future readers learn <em>why</em>, not only <em>what</em> — which stops the "let's rewrite it, nobody knows why it's like this" cycle.</p>`,
        he: `<p>כתיבה היא שלב האימות הראשון: חשיבה מעורפלת לא שורדת כתיבה מדויקת. Design doc חושף פערים ("רגע, מה קורה ב-retry?") לפני שהקוד חושף אותם. לכל החלטה משמעותית כותבים גם <strong>ADR</strong> (Architecture Decision Record) — עמוד אחד, לא משתנה, ממוספר:</p>
<pre># ADR-014: Use Postgres (not DynamoDB) for the orders store
Status: Accepted (2026-11-10)   Deciders: orders team, platform, data
Context:
  Orders need multi-row transactions (order + items + outbox), ad-hoc
  queries from support, ~700 writes/s peak, 2 TB in 3 years.
Options:
  A) Postgres (Aurora) — ACID, SQL, team knows it; vertical limit ~20k w/s
  B) DynamoDB — infinite scale, single-digit ms; no ad-hoc queries,
     transactions limited to 100 items, team has no experience
Decision: A. Re-evaluate if sustained writes &gt; 5k/s or data &gt; 10 TB.
Consequences:
  + simple outbox in same transaction; + support can query read replica
  - must plan partitioning (by created_at) at ~2 TB
  - single-writer; failover ~30 s (acceptable per SLO 99.95%)</pre>
<p>השורה החשובה היא <strong>ה-trigger להערכה מחדש</strong>: היא הופכת "אולי נגדל מעבר לזה" לאזעקה מדידה. קוראים עתידיים לומדים <em>למה</em>, לא רק <em>מה</em> — וזה עוצר את מעגל ה"בואו נשכתב, אף אחד לא יודע למה זה ככה".</p>`
      }
    },
    {
      h: { en: "Pre-mortem, threat model, failure modes", he: "Pre-mortem, threat model, failure modes" },
      body: {
        en: `<p><strong>Pre-mortem</strong> (Gary Klein): gather the team and say "It's 6 months from now. This project failed badly. Write down why." Imagining failure as a fact unlocks concerns people are too polite to raise in a normal review. Typical outputs: "the vendor's rate limit was 10x lower than we assumed", "the migration took 4 months, not 4 weeks", "nobody owned on-call".</p>
<p><strong>Threat model (STRIDE)</strong> per data flow:</p>
<table>
<tr><th>Threat</th><th>Question</th><th>Typical mitigation</th></tr>
<tr><td><strong>S</strong>poofing</td><td>Can someone pretend to be a user/service?</td><td>OIDC, mTLS, signed webhooks</td></tr>
<tr><td><strong>T</strong>ampering</td><td>Can data be modified in transit/at rest?</td><td>TLS, checksums, immutable logs</td></tr>
<tr><td><strong>R</strong>epudiation</td><td>Can someone deny an action?</td><td>Audit log with actor + time</td></tr>
<tr><td><strong>I</strong>nfo disclosure</td><td>Can data leak?</td><td>Least privilege, encryption, PII redaction</td></tr>
<tr><td><strong>D</strong>enial of service</td><td>Can it be overwhelmed?</td><td>Rate limits, quotas, WAF, autoscaling caps</td></tr>
<tr><td><strong>E</strong>levation of privilege</td><td>Can a user become admin?</td><td>Authz checks server-side, tenant isolation tests</td></tr>
</table>
<p><strong>FMEA-lite</strong> (failure mode and effects): for each component, list how it fails, the effect, how you detect it, and the mitigation. Score Severity × Likelihood and fix the top ones.</p>
<pre>Component     Failure            Effect                 Detect              Mitigation             S×L
Payments API  +2 s latency       threads exhausted      p99, pool usage     timeout 800ms + breaker  9
Postgres      primary failover   30 s write errors      error rate          retry w/ idempotency     6
Kafka         consumer lag 1h    emails late            lag alert           scale consumers, DLQ     4
Redis         evicts hot keys    DB load x5             hit ratio drop      size +30%, TTL jitter    6
Deploy        bad config         100% errors            canary analysis     auto-rollback            8</pre>`,
        he: `<p><strong>Pre-mortem</strong> (Gary Klein): אוספים את הצוות ואומרים "אנחנו 6 חודשים קדימה. הפרויקט נכשל בגדול. תכתבו למה." לדמיין כישלון כעובדה משחרר חששות שאנשים מנומסים מכדי להעלות ב-review רגיל. תוצרים טיפוסיים: "ה-rate limit של הספק היה נמוך פי 10 ממה שהנחנו", "המיגרציה לקחה 4 חודשים, לא 4 שבועות", "לאף אחד לא היה ownership על ה-on-call".</p>
<p><strong>Threat model (STRIDE)</strong> לכל זרימת דאטה:</p>
<table>
<tr><th>איום</th><th>שאלה</th><th>מיטיגציה טיפוסית</th></tr>
<tr><td><strong>S</strong>poofing</td><td>מישהו יכול להתחזות למשתמש/שירות?</td><td>OIDC, mTLS, webhooks חתומים</td></tr>
<tr><td><strong>T</strong>ampering</td><td>אפשר לשנות דאטה בתעבורה/באחסון?</td><td>TLS, checksums, לוגים בלתי ניתנים לשינוי</td></tr>
<tr><td><strong>R</strong>epudiation</td><td>מישהו יכול להכחיש פעולה?</td><td>Audit log עם actor + זמן</td></tr>
<tr><td><strong>I</strong>nfo disclosure</td><td>דאטה יכול לדלוף?</td><td>Least privilege, הצפנה, השחרת PII</td></tr>
<tr><td><strong>D</strong>enial of service</td><td>אפשר להציף את זה?</td><td>Rate limits, quotas, WAF, תקרות ל-autoscaling</td></tr>
<tr><td><strong>E</strong>levation of privilege</td><td>משתמש יכול להפוך לאדמין?</td><td>בדיקות authz בצד השרת, בדיקות בידוד tenants</td></tr>
</table>
<p><strong>FMEA-lite</strong> (failure mode and effects): לכל רכיב רושמים איך הוא נכשל, מה ההשפעה, איך מזהים, ומה המיטיגציה. נותנים ציון חומרה × סבירות ומתקנים את העליונים.</p>
<pre>Component     Failure            Effect                 Detect              Mitigation             S×L
Payments API  +2 s latency       threads exhausted      p99, pool usage     timeout 800ms + breaker  9
Postgres      primary failover   30 s write errors      error rate          retry w/ idempotency     6
Kafka         consumer lag 1h    emails late            lag alert           scale consumers, DLQ     4
Redis         evicts hot keys    DB load x5             hit ratio drop      size +30%, TTL jitter    6
Deploy        bad config         100% errors            canary analysis     auto-rollback            8</pre>`
      }
    },
    {
      h: { en: "Prove the riskiest assumption first: spikes, prototypes, load tests", he: "להוכיח קודם את ההנחה הכי מסוכנת: spikes, prototypes, load tests" },
      body: {
        en: `<p>Rank your assumptions by <em>(probability it's wrong) × (cost if wrong)</em>. The top one gets a <strong>spike</strong> — a time-boxed (1–5 days) throwaway experiment that answers one question:</p>
<ul>
<li>"Can Postgres handle 3k inserts/s with our 4 indexes?" → pgbench with a realistic schema, 30 min.</li>
<li>"Does the vendor's API really support 50 req/s?" → hit their sandbox; read their rate-limit headers.</li>
<li>"Will p99 stay &lt; 300 ms with 3 sequential service calls?" → stub services with realistic latency distributions, measure.</li>
<li>"Can we migrate 2 TB online?" → dry-run the backfill on a snapshot, extrapolate time.</li>
</ul>
<p>Then compare <strong>measured vs estimated</strong>. If your napkin said 800 req/s/core and the prototype gives 150, the design changes now — cheaply. A principal is rarely right about every number; they're right about knowing which numbers matter and checking them early.</p>
<p><strong>Architecture fitness functions</strong> keep the design valid over time: automated checks in CI such as "p99 of the checkout benchmark &lt; 300 ms", "no service imports another service's DB package" (ArchUnit, dependency-cruiser), "container image &lt; 300 MB", "no public S3 buckets" (OPA/Conftest).</p>
<blockquote>💡 Real world: Amazon's "working backwards" and Google's design review both expect the riskiest assumption to be identified explicitly. A reviewer's favourite question is "what's the part you're least sure about, and how did you test it?"</blockquote>`,
        he: `<p>מדרגים את ההנחות לפי <em>(הסיכוי שהיא שגויה) × (המחיר אם היא שגויה)</em>. העליונה מקבלת <strong>spike</strong> — ניסוי חד-פעמי מוגבל בזמן (1–5 ימים) שעונה על שאלה אחת:</p>
<ul>
<li>"Postgres יחזיק 3k inserts/s עם 4 האינדקסים שלנו?" → pgbench עם schema מציאותי, 30 דקות.</li>
<li>"ה-API של הספק באמת תומך ב-50 req/s?" → פונים ל-sandbox שלהם; קוראים את ה-headers של rate limit.</li>
<li>"p99 יישאר מתחת ל-300 ms עם 3 קריאות סדרתיות לשירותים?" → stubs לשירותים עם התפלגויות latency מציאותיות, מודדים.</li>
<li>"אפשר להעביר 2 TB online?" → dry-run של ה-backfill על snapshot, מקרינים זמן.</li>
</ul>
<p>אחר כך משווים <strong>נמדד מול מוערך</strong>. אם המפית אמרה 800 req/s ל-core וה-prototype נותן 150, התכנון משתנה עכשיו — בזול. Principal לא צודק/ת כמעט אף פעם בכל מספר; הוא/היא צודק/ת בלדעת אילו מספרים חשובים ובלבדוק אותם מוקדם.</p>
<p><strong>Architecture fitness functions</strong> שומרות על תקפות התכנון לאורך זמן: בדיקות אוטומטיות ב-CI כמו "p99 של ה-benchmark של checkout &lt; 300 ms", "אף service לא מייבא את חבילת ה-DB של service אחר" (ArchUnit, dependency-cruiser), "image של container &lt; 300 MB", "אין S3 buckets ציבוריים" (OPA/Conftest).</p>
<blockquote>💡 מהשטח: ה-"working backwards" של Amazon וה-design review של Google מצפים שההנחה הכי מסוכנת תזוהה במפורש. השאלה האהובה על reviewers: "מה החלק שאתה הכי פחות בטוח בו, ואיך בדקת אותו?"</blockquote>`
      }
    },
    {
      h: { en: "Invite skeptics: review, red team, explain it to a junior", he: "להזמין ספקנים: review, red team, להסביר לג'וניור" },
      body: {
        en: `<ul>
<li><strong>Pick reviewers who will disagree</strong>: the SRE who'll be paged, the security engineer, the DBA, a principal from another org. Friendly reviewers give friendly reviews.</li>
<li><strong>Ask for specific attacks</strong>: "Please try to break the consistency story in section 4" gets better feedback than "LGTM?".</li>
<li><strong>Red team the design</strong>: one person's job for an hour is to argue for the rejected option. If they win, you learned something.</li>
<li><strong>Explain it to a junior in 5 minutes</strong> on a whiteboard. If you can't, it's either not understood or too complex. Complexity you can't explain will be operated badly at 3 a.m.</li>
<li><strong>Disagree and commit</strong>: record dissent in the doc ("X preferred DynamoDB because...") — it's valuable if the trigger fires later.</li>
</ul>
<p><strong>Design smells checklist</strong> — if you see these, look again:</p>
<table>
<tr><th>Smell</th><th>Usually means</th></tr>
<tr><td>Two services write the same table</td><td>Hidden coupling; unclear ownership</td></tr>
<tr><td>Synchronous chain of 5+ calls in a user request</td><td>Availability = product of all; latency adds up</td></tr>
<tr><td>"We'll add retries" without idempotency</td><td>Duplicate charges/emails</td></tr>
<tr><td>No timeout mentioned anywhere</td><td>One slow dependency takes everything down</td></tr>
<tr><td>A new technology nobody on the team has run</td><td>Operational risk &gt; benefit, unless that IS the bet</td></tr>
<tr><td>"Exactly once" claimed casually</td><td>Misunderstanding of delivery semantics</td></tr>
<tr><td>No rollback plan for the migration</td><td>One-way door taken blindly</td></tr>
<tr><td>Cost not estimated</td><td>Surprise bill in month 2</td></tr>
</table>`,
        he: `<ul>
<li><strong>בוחרים reviewers שיחלקו עליכם</strong>: ה-SRE שיקבל את ה-page, מהנדס/ת האבטחה, ה-DBA, principal מארגון אחר. reviewers ידידותיים נותנים reviews ידידותיים.</li>
<li><strong>מבקשים התקפות ספציפיות</strong>: "בבקשה תנסה לשבור את סיפור העקביות בסעיף 4" מקבל פידבק טוב יותר מ-"LGTM?".</li>
<li><strong>Red team לתכנון</strong>: התפקיד של מישהו לשעה הוא לטעון בעד האופציה שנדחתה. אם הוא ניצח — למדתם משהו.</li>
<li><strong>להסביר לג'וניור ב-5 דקות</strong> על לוח. אם אי אפשר, זה או לא מובן או מורכב מדי. מורכבות שאי אפשר להסביר תתופעל רע ב-3 בלילה.</li>
<li><strong>Disagree and commit</strong>: רושמים התנגדות ב-doc ("X העדיף DynamoDB כי...") — זה שווה זהב אם ה-trigger יופעל בהמשך.</li>
</ul>
<p><strong>צ'קליסט design smells</strong> — אם רואים את אלה, מסתכלים שוב:</p>
<table>
<tr><th>Smell</th><th>בדרך כלל אומר</th></tr>
<tr><td>שני שירותים כותבים לאותה טבלה</td><td>צימוד נסתר; ownership לא ברור</td></tr>
<tr><td>שרשרת סינכרונית של 5+ קריאות בבקשת משתמש</td><td>זמינות = מכפלה של כולם; latency מצטבר</td></tr>
<tr><td>"נוסיף retries" בלי אידמפוטנטיות</td><td>חיובים/מיילים כפולים</td></tr>
<tr><td>אין timeout מוזכר בשום מקום</td><td>dependency איטי אחד מפיל הכול</td></tr>
<tr><td>טכנולוגיה חדשה שאף אחד בצוות לא הריץ</td><td>סיכון תפעולי &gt; תועלת, אלא אם זה בדיוק ההימור</td></tr>
<tr><td>"Exactly once" נטען בקלות</td><td>אי-הבנה של סמנטיקת מסירה</td></tr>
<tr><td>אין תוכנית rollback למיגרציה</td><td>דלת חד-כיוונית שנלקחה בעיניים עצומות</td></tr>
<tr><td>עלות לא הוערכה</td><td>חשבון מפתיע בחודש 2</td></tr>
</table>`
      }
    },
    {
      h: { en: "After launch: did reality match the prediction?", he: "אחרי ההשקה: המציאות התאימה לתחזית?" },
      body: {
        en: `<p>The loop most engineers skip. 30 and 90 days after launch, put a table in the design doc:</p>
<pre>Metric               Predicted        Actual (day 30)   Delta  Action
peak QPS             3,000            4,100             +37%   peak factor was 4, not 3
p99 POST /orders     &lt; 400 ms         310 ms            ok
DB CPU at peak       &lt; 60%            72%               +12pt  add read replica for support queries
cost / month         $28k             $41k              +46%   NAT egress to vendor; add PrivateLink
pages / week         &lt; 2              6                 x3     4 were noisy lag alerts -&gt; burn-rate</pre>
<p>This is how your estimates get calibrated (you learn your systematic biases — most people underestimate peak factor and cost), and how the organization learns to trust your numbers. It also closes ADR re-evaluation triggers.</p>
<blockquote>⚠️ Production tip: Make "prediction vs actual" a standard section of your design-doc template. It costs 30 minutes per project and is one of the strongest signals of principal-level ownership.</blockquote>`,
        he: `<p>הלולאה שרוב המהנדסים מדלגים עליה. 30 ו-90 יום אחרי ההשקה, שמים טבלה ב-design doc:</p>
<pre>Metric               Predicted        Actual (day 30)   Delta  Action
peak QPS             3,000            4,100             +37%   peak factor was 4, not 3
p99 POST /orders     &lt; 400 ms         310 ms            ok
DB CPU at peak       &lt; 60%            72%               +12pt  add read replica for support queries
cost / month         $28k             $41k              +46%   NAT egress to vendor; add PrivateLink
pages / week         &lt; 2              6                 x3     4 were noisy lag alerts -&gt; burn-rate</pre>
<p>ככה ההערכות שלכם מתכיילות (לומדים את ההטיות השיטתיות שלכם — רוב האנשים מעריכים בחסר את מקדם השיא ואת העלות), וככה הארגון לומד לסמוך על המספרים שלכם. זה גם סוגר triggers להערכה מחדש ב-ADRs.</p>
<blockquote>⚠️ טיפ לפרודקשן: הפכו את "תחזית מול בפועל" לסעיף סטנדרטי בתבנית ה-design doc. זה עולה 30 דקות לפרויקט וזה אחד הסימנים הכי חזקים ל-ownership ברמת principal.</blockquote>`
      }
    }
  ],
  diagram: `  idea
   |
   v
 WRITE IT ---> design doc + ADRs (with re-evaluation triggers)
   |
   v
 ATTACK IT --> pre-mortem | STRIDE | FMEA table | design-smell checklist
   |
   v
 PROVE IT ---> spike the riskiest assumption -> measured vs estimated
   |              (load test, vendor sandbox, migration dry-run)
   v
 REVIEW IT --> skeptics, red team, explain to a junior, record dissent
   |
   v
 GUARD IT ---> fitness functions in CI (latency budget, deps, policy)
   |
   v
 CHECK IT ---> day 30/90: predicted vs actual -> calibrate yourself
   \\______________________ feedback into next design ___________/`,
  handsOn: [
    { cmd: "mkdir -p docs/adr && printf '# ADR-001: <title>\\nStatus: Proposed\\nContext:\\nOptions:\\nDecision:\\nRe-evaluate if:\\nConsequences:\\n' > docs/adr/0001-template.md", what: { en: "Start an ADR log in your repo with a 're-evaluate if' line in the template.", he: "פותחים ADR log ב-repo עם שורת 're-evaluate if' בתבנית." } },
    { cmd: "pgbench -i -s 50 && pgbench -c 32 -j 8 -T 300 -P 30", what: { en: "A 5-minute spike to check a DB throughput assumption before committing to the design.", he: "Spike של 5 דקות לבדוק הנחה על throughput של DB לפני שמתחייבים לתכנון." } },
    { cmd: "npx depcruise src --validate .dependency-cruiser.js", what: { en: "A fitness function: fail CI when a module imports something the architecture forbids.", he: "Fitness function: מכשילים את ה-CI כשמודול מייבא משהו שהארכיטקטורה אוסרת." } }
  ],
  mnemonic: {
    en: "\"Write it, Attack it, Prove it, Review it, Guard it, Check it.\" (WAPRGC — 'We Always Prove, Review, Guard, Check.')",
    he: "\"לכתוב, לתקוף, להוכיח, לעבור review, לשמור, לבדוק.\" — מניחים שאתם טועים איפשהו, ויוצאים לחפש איפה."
  },
  pitfalls: [
    { en: "Choosing friendly reviewers and asking 'any comments?' — you get approval, not validation.", he: "לבחור reviewers ידידותיים ולשאול 'יש הערות?' — מקבלים אישור, לא אימות." },
    { en: "Prototyping the easy parts (the UI, the happy path) instead of the riskiest assumption.", he: "לעשות prototype לחלקים הקלים (UI, ה-happy path) במקום להנחה הכי מסוכנת." },
    { en: "ADRs without context or rejected options — a decision without its 'why' gets reversed by the next person.", he: "ADRs בלי הקשר או בלי האופציות שנדחו — החלטה בלי ה'למה' שלה תתהפך ע\"י הבא בתור." },
    { en: "Never comparing launch metrics to the estimate — you never learn your biases and repeat them.", he: "אף פעם לא להשוות מדדי השקה להערכה — לא לומדים את ההטיות וחוזרים עליהן." }
  ],
  interview: [
    { q: { en: "How do you know your design is right before building it?", he: "איך יודעים שהתכנון נכון לפני שבונים אותו?" },
      a: { en: "You never fully know; you reduce risk systematically: write it down with explicit assumptions, identify the riskiest ones and spike them with measurements, run a pre-mortem and threat model, list failure modes with detection/mitigation, get adversarial review from the people who'll operate and secure it, add fitness functions so it stays valid, and after launch compare predictions to actuals.", he: "אף פעם לא יודעים לגמרי; מקטינים סיכון באופן שיטתי: כותבים עם הנחות מפורשות, מזהים את המסוכנות ועושים להן spike עם מדידות, מריצים pre-mortem ו-threat model, רושמים failure modes עם זיהוי/מיטיגציה, מקבלים review עוין מאלה שיתפעלו ויאבטחו, מוסיפים fitness functions כדי שהתכנון יישאר תקף, ואחרי ההשקה משווים תחזיות לבפועל." } },
    { q: { en: "Tell me about a time your estimate was wrong.", he: "ספר/י על פעם שההערכה שלך הייתה שגויה." },
      a: { en: "Strong answers own the miss, show detection ('our day-30 review showed peak was 4x not 3x'), the fix, and the systemic change ('we now derive peak factor from p99-per-minute history, not intuition'). The interviewer is testing calibration and learning, not perfection.", he: "תשובות חזקות לוקחות אחריות על הפספוס, מראות איך זוהה ('ה-review של יום 30 הראה שהשיא היה x4 ולא x3'), את התיקון, ואת השינוי המערכתי ('היום אנחנו גוזרים מקדם שיא מהיסטוריית p99 לדקה, לא מאינטואיציה'). המראיין בודק כיול ולמידה, לא שלמות." } }
  ],
  quiz: [
    { q: { en: "What's the purpose of a pre-mortem?", he: "מה המטרה של pre-mortem?" },
      options: [ { en: "Assign blame after an outage", he: "להאשים מישהו אחרי השבתה" }, { en: "Imagine the project already failed and list why, to surface hidden risks", he: "לדמיין שהפרויקט כבר נכשל ולרשום למה, כדי לחשוף סיכונים נסתרים" }, { en: "Estimate cost", he: "להעריך עלות" }, { en: "Write unit tests", he: "לכתוב unit tests" } ],
      answer: 1, explain: { en: "Treating failure as a given unlocks concerns people otherwise keep to themselves.", he: "להתייחס לכישלון כעובדה משחרר חששות שאנשים אחרת שומרים לעצמם." } },
    { q: { en: "In STRIDE, an audit log mainly mitigates…", he: "ב-STRIDE, audit log בעיקר מטפל ב-…" },
      options: [ { en: "Spoofing", he: "Spoofing" }, { en: "Repudiation", he: "Repudiation" }, { en: "Denial of service", he: "Denial of service" }, { en: "Tampering", he: "Tampering" } ],
      answer: 1, explain: { en: "Repudiation = denying you did something; an audit trail with actor and time proves it.", he: "Repudiation = להכחיש שעשית משהו; audit trail עם actor וזמן מוכיח את זה." } },
    { q: { en: "Which assumption should get the first spike/prototype?", he: "איזו הנחה צריכה לקבל את ה-spike הראשון?" },
      options: [ { en: "The easiest to test", he: "הכי קלה לבדיקה" }, { en: "The one with the highest (probability wrong × cost if wrong)", he: "זו עם (הסיכוי שהיא שגויה × המחיר אם שגויה) הכי גבוה" }, { en: "The UI layout", he: "ה-layout של ה-UI" }, { en: "Whatever the manager likes", he: "מה שהמנהל אוהב" } ],
      answer: 1, explain: { en: "Spend validation effort where being wrong is both likely and expensive.", he: "משקיעים מאמץ אימות איפה שלטעות זה גם סביר וגם יקר." } },
    { q: { en: "What makes an ADR especially useful years later?", he: "מה הופך ADR לשימושי במיוחד שנים אחר כך?" },
      options: [ { en: "Its length", he: "האורך שלו" }, { en: "Context, rejected options and an explicit re-evaluation trigger", he: "הקשר, אופציות שנדחו, ו-trigger מפורש להערכה מחדש" }, { en: "A nice diagram only", he: "רק דיאגרמה יפה" }, { en: "Being editable by anyone at any time", he: "שכל אחד יכול לערוך אותו בכל זמן" } ],
      answer: 1, explain: { en: "The 'why' and 'when to revisit' are what future engineers need.", he: "ה'למה' וה'מתי לחזור לזה' הם מה שמהנדסים עתידיים צריכים." } }
  ],
  related: ["pr-architect-questions", "pr-sizing", "pr-test-strategy", "staff-design-docs", "staff-production-readiness", "pr-principal-playbook"]
});

INFRA.lessons.push({
  id: "pr-observability-plan",
  track: "principal",
  order: 6,
  icon: "📡",
  level: 3,
  minutes: 17,
  title: { en: "The Day-1 Monitoring & Logging Plan for a New System", he: "תוכנית ה-Monitoring וה-Logging של היום הראשון למערכת חדשה" },
  tldr: {
    en: "Decide what 'healthy' means (SLIs/SLOs) before you instrument; then give every component its RED/USE metrics, emit structured logs with a trace ID, propagate context everywhere with OpenTelemetry, alert on user-facing symptoms via burn rate, and budget for cardinality and retention.",
    he: "מחליטים מה זה 'בריא' (SLIs/SLOs) לפני שמכשירים; אחר כך נותנים לכל רכיב metrics של RED/USE, מוציאים לוגים מובנים עם trace ID, מעבירים context לכל מקום עם OpenTelemetry, מתריעים על סימפטומים שהמשתמש מרגיש לפי burn rate, ומתקצבים cardinality ו-retention."
  },
  analogy: {
    en: "A hospital ward. Vital signs on a monitor for every bed (metrics: heart rate, blood pressure — cheap, continuous, numeric). The nurse's chart with timestamped notes (logs: detailed, per event). The patient's wristband ID that follows them from ER to X-ray to surgery so every department's notes can be joined (trace ID). And alarms that ring only for things that need a human now — 'heart stopped', not 'patient turned over' (symptom-based alerting). A ward with monitors but no wristbands can't tell you why a patient got worse.",
    he: "מחלקה בבית חולים. סימנים חיוניים על מוניטור לכל מיטה (metrics: דופק, לחץ דם — זול, רציף, מספרי). הגיליון של האחות עם הערות עם חותמת זמן (logs: מפורט, לכל אירוע). הצמיד עם ה-ID של המטופל שעובר איתו ממיון לרנטגן לניתוח כדי שאפשר לחבר את ההערות של כל מחלקה (trace ID). ואזעקות שמצלצלות רק על דברים שדורשים אדם עכשיו — 'הלב נעצר', לא 'המטופל הסתובב' (התראות מבוססות סימפטום). מחלקה עם מוניטורים אבל בלי צמידים לא יכולה להגיד למה מטופל הידרדר."
  },
  sections: [
    {
      h: { en: "Start from SLIs and SLOs, not from tools", he: "מתחילים מ-SLIs ו-SLOs, לא מכלים" },
      body: {
        en: `<p>Before choosing Prometheus or Datadog, write down what users experience and what "good" means. For each critical journey:</p>
<pre>Journey: place order
SLI  availability = good requests / valid requests
       good = HTTP status &lt; 500 AND not timed out, measured at the load balancer
SLI  latency      = requests with duration &lt; 400 ms / valid requests
SLO  99.9% availability, 99% under 400 ms, over a rolling 28 days
Error budget = 0.1% × ~26M requests/28d ≈ 26,000 failed orders allowed

Journey: order confirmation email
SLI  freshness = emails sent within 60 s of order / orders
SLO  99% within 60 s</pre>
<p>These SLIs dictate the instrumentation: you now know you need request counts by status at the LB, latency histograms (not averages!), and an "order created → email sent" timestamp delta. Everything else is supporting detail for debugging.</p>
<blockquote>💡 Real world: Measure SLIs as close to the user as possible (LB or edge, plus synthetic probes), because a service can report itself healthy while the LB in front of it returns 502s.</blockquote>`,
        he: `<p>לפני שבוחרים Prometheus או Datadog, כותבים מה המשתמשים חווים ומה זה "טוב". לכל מסע קריטי:</p>
<pre>Journey: place order
SLI  availability = good requests / valid requests
       good = HTTP status &lt; 500 AND not timed out, measured at the load balancer
SLI  latency      = requests with duration &lt; 400 ms / valid requests
SLO  99.9% availability, 99% under 400 ms, over a rolling 28 days
Error budget = 0.1% × ~26M requests/28d ≈ 26,000 failed orders allowed

Journey: order confirmation email
SLI  freshness = emails sent within 60 s of order / orders
SLO  99% within 60 s</pre>
<p>ה-SLIs האלה מכתיבים את ה-instrumentation: עכשיו ידוע שצריך ספירת בקשות לפי status ב-LB, היסטוגרמות של latency (לא ממוצעים!), והפרש זמנים "הזמנה נוצרה → מייל נשלח". כל השאר הוא פירוט תומך לדיבאג.</p>
<blockquote>💡 מהשטח: מודדים SLIs הכי קרוב למשתמש שאפשר (LB או edge, ועוד synthetic probes), כי service יכול לדווח על עצמו שהוא בריא בזמן שה-LB שלפניו מחזיר 502.</blockquote>`
      }
    },
    {
      h: { en: "Metrics per component: RED, USE and the specials", he: "Metrics לכל רכיב: RED, USE והמיוחדים" },
      body: {
        en: `<p><strong>RED</strong> for request-driven things (Rate, Errors, Duration). <strong>USE</strong> for resources (Utilization, Saturation, Errors). Then the component-specific metrics that actually predict incidents:</p>
<table>
<tr><th>Component</th><th>Must-have metrics</th><th>The one people forget</th></tr>
<tr><td>Load balancer</td><td>RPS, 4xx/5xx by target, latency histogram</td><td>Healthy host count; rejected connections</td></tr>
<tr><td>App service</td><td>RED per endpoint, in-flight requests, pool usage</td><td>Dependency call latency/errors per downstream</td></tr>
<tr><td>Runtime</td><td>CPU, memory, GC pause, threads/goroutines</td><td>CPU throttling (cgroup), event-loop lag (Node)</td></tr>
<tr><td>Database</td><td>QPS, latency, connections, replication lag</td><td>Lock waits, long transactions, disk free %, autovacuum</td></tr>
<tr><td>Queue/stream</td><td>Publish/consume rate, consumer lag</td><td>Age of oldest message; DLQ depth</td></tr>
<tr><td>Cache</td><td>Hit ratio, ops/s, latency</td><td>Evictions, memory fragmentation</td></tr>
<tr><td>Third-party</td><td>Call rate, errors, latency per vendor</td><td>Rate-limit headers remaining; circuit-breaker state</td></tr>
<tr><td>Business</td><td>Orders/min, payment success rate</td><td>Compare to same time last week (catches silent failures)</td></tr>
</table>
<pre># Prometheus: latency SLI and burn-rate building blocks
histogram_quantile(0.99, sum by (le, route) (rate(http_server_duration_seconds_bucket[5m])))
sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
max by (consumergroup) (kafka_consumergroup_lag)</pre>
<blockquote>⚠️ Production tip: Business metrics are your best detector of silent failures. "Orders/min dropped 60% vs last Tuesday" catches the bug where every request returns 200 but the checkout button is broken.</blockquote>`,
        he: `<p><strong>RED</strong> לדברים מבוססי בקשות (Rate, Errors, Duration). <strong>USE</strong> למשאבים (Utilization, Saturation, Errors). ואז ה-metrics הספציפיים לרכיב שבאמת חוזים תקלות:</p>
<table>
<tr><th>רכיב</th><th>Metrics חובה</th><th>זה ששוכחים</th></tr>
<tr><td>Load balancer</td><td>RPS, 4xx/5xx לפי target, היסטוגרמת latency</td><td>מספר hosts בריאים; connections שנדחו</td></tr>
<tr><td>App service</td><td>RED לכל endpoint, בקשות באוויר, ניצול pools</td><td>latency/שגיאות לכל downstream</td></tr>
<tr><td>Runtime</td><td>CPU, זיכרון, GC pause, threads/goroutines</td><td>CPU throttling (cgroup), event-loop lag (Node)</td></tr>
<tr><td>Database</td><td>QPS, latency, connections, replication lag</td><td>המתנות לנעילות, טרנזקציות ארוכות, % דיסק פנוי, autovacuum</td></tr>
<tr><td>תור/stream</td><td>קצב publish/consume, consumer lag</td><td>הגיל של ההודעה הכי ישנה; עומק DLQ</td></tr>
<tr><td>Cache</td><td>Hit ratio, ops/s, latency</td><td>Evictions, פרגמנטציה של זיכרון</td></tr>
<tr><td>צד שלישי</td><td>קצב קריאות, שגיאות, latency לכל ספק</td><td>Headers של rate-limit שנשאר; מצב ה-circuit breaker</td></tr>
<tr><td>ביזנס</td><td>הזמנות לדקה, אחוז הצלחת תשלום</td><td>השוואה לאותה שעה בשבוע שעבר (תופס כישלונות שקטים)</td></tr>
</table>
<pre># Prometheus: latency SLI and burn-rate building blocks
histogram_quantile(0.99, sum by (le, route) (rate(http_server_duration_seconds_bucket[5m])))
sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
max by (consumergroup) (kafka_consumergroup_lag)</pre>
<blockquote>⚠️ טיפ לפרודקשן: metrics עסקיים הם הגלאי הכי טוב לכישלונות שקטים. "הזמנות לדקה ירדו ב-60% לעומת שלישי שעבר" תופס את הבאג שבו כל בקשה מחזירה 200 אבל כפתור ה-checkout שבור.</blockquote>`
      }
    },
    {
      h: { en: "Logs: structured, correlated, leveled, redacted", he: "לוגים: מובנים, מקושרים, עם רמות, מושחרים" },
      body: {
        en: `<p>Log as <strong>JSON events</strong> with a fixed schema, not free text. Every log line carries the trace context so you can jump from a log to the full trace and back.</p>
<pre>{
  "ts": "2026-11-13T09:41:07.123Z", "level": "error",
  "service": "orders", "version": "1.42.0", "env": "prod", "region": "eu-west-1",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "00f067aa0ba902b7",
  "request_id": "req-77a", "tenant_id": "t-19", "user_id": "u-8812",
  "event": "payment_failed", "order_id": "o-81",
  "provider": "stripe", "provider_code": "card_declined", "duration_ms": 812,
  "msg": "payment declined by provider"
}</pre>
<p><strong>Level policy</strong> (write it down, enforce in review):</p>
<ul>
<li><code>ERROR</code> — a request/job failed and someone may need to act. Not for expected business outcomes (a declined card is <code>INFO</code>/<code>WARN</code>).</li>
<li><code>WARN</code> — degraded but handled: retry succeeded, fallback used, circuit opened.</li>
<li><code>INFO</code> — business events and state transitions (order placed, deploy started). One or two per request, max.</li>
<li><code>DEBUG</code> — off in prod by default; enable dynamically per service/tenant for 15 minutes.</li>
</ul>
<p><strong>PII and secrets</strong>: never log tokens, passwords, card numbers, full emails/phones. Redact at the logger (allowlist of fields) and again at the collector (OpenTelemetry Collector <code>transform</code>/<code>redaction</code> processors). Separate <strong>audit logs</strong> (who did what, immutable, retained years) from operational logs (retained days).</p>
<blockquote>💡 Real world: Logs are usually the biggest observability cost. At 3k req/s × 5 lines × 1 KB ≈ 1.3 TB/day; at ~$0.50/GB ingested that's ~$20k/month. Sample successful-request DEBUG/INFO lines, keep all errors, and push high-volume data into metrics instead.</blockquote>`,
        he: `<p>כותבים לוגים כ-<strong>events ב-JSON</strong> עם schema קבוע, לא טקסט חופשי. כל שורת לוג נושאת את ה-trace context כדי שאפשר לקפוץ מלוג ל-trace המלא ובחזרה.</p>
<pre>{
  "ts": "2026-11-13T09:41:07.123Z", "level": "error",
  "service": "orders", "version": "1.42.0", "env": "prod", "region": "eu-west-1",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "00f067aa0ba902b7",
  "request_id": "req-77a", "tenant_id": "t-19", "user_id": "u-8812",
  "event": "payment_failed", "order_id": "o-81",
  "provider": "stripe", "provider_code": "card_declined", "duration_ms": 812,
  "msg": "payment declined by provider"
}</pre>
<p><strong>מדיניות רמות</strong> (כותבים אותה, אוכפים ב-review):</p>
<ul>
<li><code>ERROR</code> — בקשה/job נכשלו ואולי מישהו צריך לפעול. לא לתוצאות עסקיות צפויות (כרטיס שנדחה זה <code>INFO</code>/<code>WARN</code>).</li>
<li><code>WARN</code> — ירידה בתפקוד אבל טופלה: retry הצליח, נעשה fallback, circuit נפתח.</li>
<li><code>INFO</code> — אירועים עסקיים ומעברי מצב (הזמנה בוצעה, deploy התחיל). אחד או שניים לבקשה, מקסימום.</li>
<li><code>DEBUG</code> — כבוי ב-prod כברירת מחדל; מפעילים דינמית לכל service/tenant ל-15 דקות.</li>
</ul>
<p><strong>PII וסודות</strong>: אף פעם לא כותבים ללוג tokens, סיסמאות, מספרי כרטיס, מיילים/טלפונים מלאים. משחירים ב-logger (allowlist של שדות) ושוב ב-collector (processors של <code>transform</code>/<code>redaction</code> ב-OpenTelemetry Collector). מפרידים <strong>audit logs</strong> (מי עשה מה, בלתי ניתן לשינוי, נשמר שנים) מלוגים תפעוליים (נשמרים ימים).</p>
<blockquote>💡 מהשטח: לוגים הם בדרך כלל העלות הכי גדולה ב-observability. ב-3k req/s × 5 שורות × 1 KB ≈ 1.3 TB ביום; ב-~$0.50 ל-GB שנקלט זה ~$20k בחודש. עושים sampling לשורות DEBUG/INFO של בקשות מוצלחות, שומרים את כל השגיאות, ודוחפים דאטה בנפח גבוה ל-metrics.</blockquote>`
      }
    },
    {
      h: { en: "Traces and context propagation with OpenTelemetry", he: "Traces והעברת context עם OpenTelemetry" },
      body: {
        en: `<p>A trace follows one request across services. The magic is <strong>context propagation</strong>: every hop forwards the W3C <code>traceparent</code> header, including through queues (as message headers).</p>
<pre>traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             ver  trace-id (16 bytes)              parent span-id   flags (sampled)

LB -&gt; orders (span) -&gt; payments (span) -&gt; Stripe (client span)
                    -&gt; Kafka publish (span, header carries traceparent)
                         -&gt; email-worker consume (span, same trace)</pre>
<p>Use <strong>OpenTelemetry</strong> SDKs/auto-instrumentation in every service and send everything to an <strong>OTel Collector</strong>, which batches, redacts, samples and exports to your backends (Prometheus/Mimir, Loki/Elastic, Tempo/Jaeger, or a vendor). This keeps you vendor-neutral — switching backends becomes a collector config change.</p>
<p><strong>Sampling</strong>: head sampling (decide at the start, e.g. 5%) is cheap but misses rare errors; <strong>tail sampling</strong> in the collector keeps 100% of errors and slow traces plus a small % of normal ones — the usual production choice.</p>
<p><strong>Cardinality trap</strong>: every unique label combination is a separate time series. <code>http_requests_total{route="/orders/{id}"}</code> is fine; <code>{path="/orders/o-81"}</code> or <code>{user_id=...}</code> creates millions of series and can take down Prometheus or 10x your bill. High-cardinality IDs belong in logs and traces, not metric labels.</p>`,
        he: `<p>Trace עוקב אחרי בקשה אחת על פני שירותים. הקסם הוא <strong>context propagation</strong>: כל hop מעביר את ה-header <code>traceparent</code> של W3C, כולל דרך תורים (כ-headers של הודעה).</p>
<pre>traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             ver  trace-id (16 bytes)              parent span-id   flags (sampled)

LB -&gt; orders (span) -&gt; payments (span) -&gt; Stripe (client span)
                    -&gt; Kafka publish (span, header carries traceparent)
                         -&gt; email-worker consume (span, same trace)</pre>
<p>משתמשים ב-SDKs/auto-instrumentation של <strong>OpenTelemetry</strong> בכל service ושולחים הכול ל-<strong>OTel Collector</strong>, שעושה batching, השחרה, sampling ומייצא ל-backends (Prometheus/Mimir, Loki/Elastic, Tempo/Jaeger, או ספק). זה שומר אתכם vendor-neutral — החלפת backend הופכת לשינוי קונפיג ב-collector.</p>
<p><strong>Sampling</strong>: head sampling (מחליטים בהתחלה, למשל 5%) זול אבל מפספס שגיאות נדירות; <strong>tail sampling</strong> ב-collector שומר 100% מהשגיאות וה-traces האיטיים ועוד אחוז קטן מהרגילים — הבחירה הרגילה בפרודקשן.</p>
<p><strong>מלכודת ה-cardinality</strong>: כל צירוף ייחודי של labels הוא time series נפרד. <code>http_requests_total{route="/orders/{id}"}</code> זה בסדר; <code>{path="/orders/o-81"}</code> או <code>{user_id=...}</code> יוצר מיליוני series ויכול להפיל את Prometheus או להכפיל את החשבון פי 10. IDs עם cardinality גבוה שייכים ללוגים ול-traces, לא ל-labels של metrics.</p>`
      }
    },
    {
      h: { en: "Alerts, dashboards, runbooks: the operational contract", he: "התראות, דשבורדים, runbooks: החוזה התפעולי" },
      body: {
        en: `<p><strong>Page on symptoms, ticket on causes.</strong> Users feel errors and latency, not "CPU 85%". Page with <strong>multi-window burn-rate</strong> alerts on the SLO; send cause-level signals (disk 80%, cert expires in 14 days, consumer lag rising) to a ticket queue.</p>
<pre># Page: burning 2% of the 28-day budget in 1 hour (14.4x burn), confirmed by 5m window
- alert: OrdersAvailabilityFastBurn
  expr: |
    (sum(rate(lb_requests_total{svc="orders",code=~"5.."}[1h])) / sum(rate(lb_requests_total{svc="orders"}[1h]))) &gt; (14.4 * 0.001)
    and
    (sum(rate(lb_requests_total{svc="orders",code=~"5.."}[5m])) / sum(rate(lb_requests_total{svc="orders"}[5m]))) &gt; (14.4 * 0.001)
  labels: { severity: page }
  annotations:
    runbook: https://runbooks.internal/orders/availability
    dashboard: https://grafana.internal/d/orders-overview</pre>
<p><strong>Dashboard layout</strong> (top to bottom, the order you debug): 1) SLO status + error budget left; 2) RED at the edge; 3) RED per endpoint; 4) dependencies (DB, cache, queue, vendors); 5) resources (USE, pods, GC); 6) recent deploys/flag changes as annotations. One overview dashboard per service, not 40 panels nobody reads.</p>
<p><strong>Every alert has a runbook</strong>: what it means, how to verify, the first 3 mitigation steps (roll back, shed load, fail over), and who to escalate to. If an alert fired and nobody needed to act, delete or demote it — alert fatigue is how real pages get missed.</p>
<blockquote>⚠️ Production tip: Retention budget is a design decision: metrics 13 months (year-over-year), traces 7–14 days, operational logs 14–30 days hot then archive, audit logs per compliance (often 1–7 years) in cheap immutable storage (S3 Object Lock).</blockquote>`,
        he: `<p><strong>Page על סימפטומים, טיקט על סיבות.</strong> משתמשים מרגישים שגיאות ו-latency, לא "CPU 85%". מקפיצים page עם התראות <strong>burn-rate רב-חלונות</strong> על ה-SLO; אותות ברמת סיבה (דיסק 80%, cert פג בעוד 14 יום, consumer lag עולה) הולכים לתור טיקטים.</p>
<pre># Page: burning 2% of the 28-day budget in 1 hour (14.4x burn), confirmed by 5m window
- alert: OrdersAvailabilityFastBurn
  expr: |
    (sum(rate(lb_requests_total{svc="orders",code=~"5.."}[1h])) / sum(rate(lb_requests_total{svc="orders"}[1h]))) &gt; (14.4 * 0.001)
    and
    (sum(rate(lb_requests_total{svc="orders",code=~"5.."}[5m])) / sum(rate(lb_requests_total{svc="orders"}[5m]))) &gt; (14.4 * 0.001)
  labels: { severity: page }
  annotations:
    runbook: https://runbooks.internal/orders/availability
    dashboard: https://grafana.internal/d/orders-overview</pre>
<p><strong>Layout של דשבורד</strong> (מלמעלה למטה, בסדר שבו מדבגים): 1) מצב SLO + error budget שנשאר; 2) RED ב-edge; 3) RED לכל endpoint; 4) dependencies (DB, cache, תור, ספקים); 5) משאבים (USE, pods, GC); 6) deploys/שינויי flags אחרונים כ-annotations. דשבורד overview אחד לכל service, לא 40 פאנלים שאף אחד לא קורא.</p>
<p><strong>לכל התראה יש runbook</strong>: מה היא אומרת, איך מאמתים, 3 צעדי המיטיגציה הראשונים (rollback, הורדת עומס, failover), ולמי מסלימים. אם התראה קפצה ואף אחד לא היה צריך לפעול — מוחקים או מורידים דרגה. עייפות מהתראות זה איך מפספסים pages אמיתיים.</p>
<blockquote>⚠️ טיפ לפרודקשן: תקציב retention הוא החלטת תכנון: metrics ל-13 חודשים (השוואה שנה מול שנה), traces ל-7–14 יום, לוגים תפעוליים 14–30 יום חמים ואז ארכיון, audit logs לפי רגולציה (לרוב 1–7 שנים) באחסון זול ובלתי ניתן לשינוי (S3 Object Lock).</blockquote>`
      }
    }
  ],
  diagram: `  users --> [synthetic probes]                SLO: 99.9% / p99 < 400ms
    |                                              ^
    v                                              | burn-rate alerts -> PAGE + runbook
  CDN/LB --(RED, 5xx, latency hist)-------+        |
    |  traceparent                        |        |
    v                                     v        |
  orders --(RED, pools, deps)--> OTel SDK --> OTel Collector --+--> metrics (Prometheus/Mimir) 13mo
    |  \\--(JSON logs w/ trace_id)----------^   (batch, redact,  +--> logs (Loki/Elastic) 14-30d
    v   traceparent in msg headers             tail-sample)    +--> traces (Tempo/Jaeger) 7-14d
  Kafka --(lag, oldest msg age, DLQ)                           +--> audit (immutable) years
    v
  email-worker (same trace)            dashboards: SLO -> edge RED -> endpoints -> deps -> USE`,
  handsOn: [
    { cmd: "curl -s localhost:9090/api/v1/status/tsdb | jq '.data.seriesCountByMetricName[:5]'", what: { en: "Find your top-cardinality metrics in Prometheus before they find your bill.", he: "מוצאים את ה-metrics עם ה-cardinality הכי גבוה ב-Prometheus לפני שהם מוצאים את החשבון שלכם." } },
    { cmd: "curl -s -H 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' https://staging.api/orders/o-81 -o /dev/null -w '%{http_code}\\n'", what: { en: "Send a request with a known trace ID, then search it in logs and the tracing UI to verify propagation end to end.", he: "שולחים בקשה עם trace ID ידוע, ואז מחפשים אותו בלוגים וב-UI של ה-tracing כדי לאמת propagation מקצה לקצה." } },
    { cmd: "kubectl logs deploy/orders --since=10m | jq -r 'select(.level==\"error\") | [.ts,.trace_id,.event] | @tsv' | head", what: { en: "Structured logs pay off: filter errors and pull trace IDs in one line.", he: "לוגים מובנים משתלמים: מסננים שגיאות ושולפים trace IDs בשורה אחת." } },
    { cmd: "promtool check rules alerts.yml", what: { en: "Validate alert rules in CI like any other code.", he: "מאמתים חוקי התראות ב-CI כמו כל קוד אחר." } }
  ],
  mnemonic: {
    en: "\"SLO first, RED/USE second, trace ID everywhere, page on pain, ticket on causes, runbook for every bell.\"",
    he: "\"SLO קודם, RED/USE אחר כך, trace ID בכל מקום, page על כאב, טיקט על סיבות, runbook לכל פעמון.\""
  },
  pitfalls: [
    { en: "Alerting on causes (CPU 80%, one pod restarted) → hundreds of pages, fatigue, and the real outage gets ignored.", he: "התראות על סיבות (CPU 80%, pod אחד עשה restart) → מאות pages, עייפות, וההשבתה האמיתית מתפספסת." },
    { en: "User IDs or raw URLs as metric labels — cardinality explosion that kills the metrics backend.", he: "User IDs או URLs גולמיים כ-labels של metrics — פיצוץ cardinality שהורג את ה-backend של ה-metrics." },
    { en: "Free-text logs without trace IDs: you can't join events across services during an incident.", he: "לוגים בטקסט חופשי בלי trace IDs: אי אפשר לחבר אירועים בין שירותים בזמן תקלה." },
    { en: "Logging PII/tokens 'temporarily for debugging' — now it's in 3 systems with 30-day retention and a compliance incident.", he: "לכתוב PII/tokens ללוג 'זמנית בשביל דיבאג' — עכשיו זה ב-3 מערכות עם retention של 30 יום ואירוע רגולציה." }
  ],
  interview: [
    { q: { en: "You're launching a new service next month. What observability do you require before launch?", he: "אתם משיקים service חדש בחודש הבא. איזה observability אתם דורשים לפני ההשקה?" },
      a: { en: "SLIs/SLOs for the top journeys measured at the edge; RED per endpoint and per dependency; USE and runtime metrics; structured JSON logs with trace_id and a level policy; OpenTelemetry tracing with propagation through queues; burn-rate paging alerts each with a runbook; one overview dashboard; business KPIs with week-over-week comparison; synthetic probes; PII redaction; retention and cost estimate. Verified in a game day before launch.", he: "SLIs/SLOs למסעות המרכזיים שנמדדים ב-edge; RED לכל endpoint ולכל dependency; USE ו-metrics של runtime; לוגי JSON מובנים עם trace_id ומדיניות רמות; tracing עם OpenTelemetry כולל propagation דרך תורים; התראות page לפי burn rate, כל אחת עם runbook; דשבורד overview אחד; KPIs עסקיים עם השוואה לשבוע שעבר; synthetic probes; השחרת PII; הערכת retention ועלות. מאומת ב-game day לפני ההשקה." } },
    { q: { en: "Why alert on burn rate instead of 'error rate > 1% for 5 minutes'?", he: "למה להתריע על burn rate במקום 'error rate > 1% במשך 5 דקות'?" },
      a: { en: "A fixed threshold ignores the SLO: it pages on short blips that don't threaten the budget and misses slow burns that do. Burn rate ties the alert to how fast you're consuming the error budget; multi-window (1h + 5m) gives fast detection for big outages and fast reset when they end, while a slower window pair (6h/30m) catches slow leaks as tickets.", he: "סף קבוע מתעלם מה-SLO: הוא מקפיץ על הבהובים קצרים שלא מאיימים על התקציב ומפספס שריפות איטיות שכן. Burn rate קושר את ההתראה לקצב שבו צורכים את ה-error budget; רב-חלונות (1h + 5m) נותן זיהוי מהיר להשבתות גדולות ואיפוס מהיר כשהן נגמרות, וזוג חלונות איטי (6h/30m) תופס דליפות איטיות כטיקטים." } }
  ],
  quiz: [
    { q: { en: "Which belongs in a metric label?", he: "מה שייך ל-label של metric?" },
      options: [ { en: "user_id", he: "user_id" }, { en: "Full request URL with IDs", he: "URL מלא של בקשה עם IDs" }, { en: "Route template like /orders/{id}", he: "תבנית route כמו /orders/{id}" }, { en: "trace_id", he: "trace_id" } ],
      answer: 2, explain: { en: "Bounded cardinality. IDs go to logs and traces.", he: "Cardinality חסום. IDs הולכים ללוגים ול-traces." } },
    { q: { en: "What should page a human at 3 a.m.?", he: "מה צריך להקפיץ בן אדם ב-3 בלילה?" },
      options: [ { en: "CPU at 85% on one node", he: "CPU ב-85% על node אחד" }, { en: "A fast burn of the availability error budget", he: "שריפה מהירה של ה-error budget של הזמינות" }, { en: "A pod restarted once", he: "Pod עשה restart פעם אחת" }, { en: "Disk at 60%", he: "דיסק ב-60%" } ],
      answer: 1, explain: { en: "Page on user-facing symptoms tied to the SLO; causes go to tickets.", he: "Page על סימפטומים שהמשתמש מרגיש וקשורים ל-SLO; סיבות הולכות לטיקטים." } },
    { q: { en: "How does a trace survive a hop through Kafka?", he: "איך trace שורד מעבר דרך Kafka?" },
      options: [ { en: "It can't; traces stop at queues", he: "הוא לא יכול; traces נעצרים בתורים" }, { en: "The producer puts traceparent in message headers and the consumer continues the trace", he: "ה-producer שם traceparent ב-headers של ההודעה וה-consumer ממשיך את ה-trace" }, { en: "Kafka generates trace IDs", he: "Kafka מייצר trace IDs" }, { en: "Through the DNS", he: "דרך ה-DNS" } ],
      answer: 1, explain: { en: "Context propagation via message headers; OTel instrumentations for Kafka do this.", he: "Context propagation דרך headers של ההודעה; ה-instrumentations של OTel ל-Kafka עושים את זה." } },
    { q: { en: "Which sampling keeps all error traces while storing only a few normal ones?", he: "איזה sampling שומר את כל ה-traces עם שגיאות ורק מעט רגילים?" },
      options: [ { en: "Head sampling at 1%", he: "Head sampling ב-1%" }, { en: "Tail sampling in the collector", he: "Tail sampling ב-collector" }, { en: "No sampling", he: "בלי sampling" }, { en: "Random log sampling", he: "Sampling אקראי של לוגים" } ],
      answer: 1, explain: { en: "Tail sampling decides after the trace completes, so it can keep errors/slow ones.", he: "Tail sampling מחליט אחרי שה-trace הסתיים, אז הוא יכול לשמור שגיאות/איטיים." } }
  ],
  playground: "slo",
  related: ["obs-golden-signals", "obs-alerting", "obs-traces", "obs-logs", "rel-error-budgets", "staff-production-readiness", "pr-validate-yourself"]
});

INFRA.lessons.push({
  id: "pr-principal-playbook",
  track: "principal",
  order: 7,
  icon: "👑",
  level: 3,
  minutes: 18,
  title: { en: "The Principal Playbook: From Idea to Production (Capstone)", he: "ה-Playbook של Principal: מרעיון לפרודקשן (פרק מסכם)" },
  tldr: {
    en: "A principal runs the same loop every time — discover, require, estimate, compare options, write, review, build with tests, instrument, roll out safely, operate, learn — and at every step thinks in trade-offs, blast radius, reversibility, simplicity, cost and people.",
    he: "Principal מריץ/ה את אותה לולאה בכל פעם — לגלות, לדרוש, להעריך, להשוות אופציות, לכתוב, לעבור review, לבנות עם בדיקות, להכשיר, להשיק בבטחה, לתפעל, ללמוד — ובכל שלב חושב/ת ב-trade-offs, blast radius, הפיכות, פשטות, עלות ואנשים."
  },
  analogy: {
    en: "A head chef opening a new restaurant doesn't just cook well. They ask who the diners are and what they'll pay (requirements), size the kitchen for Friday night (sizing), choose between a wood oven and a convection oven knowing what each costs and breaks (trade-offs), write the recipes so any cook can repeat them (design doc), taste every dish before service (tests), watch ticket times on the pass (observability), open with a soft launch for friends (canary), and change the menu based on what came back uneaten (retro). Great principals are head chefs: the cooking is necessary but the system is the job.",
    he: "שף ראשי שפותח מסעדה חדשה לא רק מבשל טוב. הוא שואל מי הסועדים וכמה ישלמו (דרישות), מתכנן מטבח לשישי בערב (sizing), בוחר בין תנור עצים לתנור הסעה כשהוא יודע כמה כל אחד עולה ואיך הוא מתקלקל (trade-offs), כותב מתכונים כך שכל טבח יוכל לחזור עליהם (design doc), טועם כל מנה לפני השירות (בדיקות), מסתכל על זמני ההזמנות בפס (observability), פותח ב-soft launch לחברים (canary), ומשנה את התפריט לפי מה שחזר לא אכול (retro). Principals מעולים הם שפים ראשיים: הבישול הכרחי, אבל המערכת היא העבודה."
  },
  sections: [
    {
      h: { en: "The loop: 11 steps from idea to production", he: "הלולאה: 11 צעדים מרעיון לפרודקשן" },
      body: {
        en: `<table>
<tr><th>#</th><th>Step</th><th>Output</th><th>Deep dive</th></tr>
<tr><td>1</td><td><strong>Discover</strong> — the problem, the users, why now</td><td>Problem statement + success metric</td><td>pr-architect-questions</td></tr>
<tr><td>2</td><td><strong>Require</strong> — functional + NFRs with numbers; goals/non-goals; MoSCoW</td><td>Requirements section</td><td>pr-architect-questions</td></tr>
<tr><td>3</td><td><strong>Estimate</strong> — QPS, storage, servers, cost</td><td>Sizing table with assumptions</td><td>pr-sizing</td></tr>
<tr><td>4</td><td><strong>Options</strong> — 2–3 real alternatives incl. "do nothing / buy"</td><td>Trade-off matrix</td><td>pr-db-landscape, pr-scaling-kinds, pr-cap-pacelc</td></tr>
<tr><td>5</td><td><strong>Design</strong> — data model, APIs, integration, failure handling, network, security</td><td>Design doc + ADRs</td><td>pr-integration-styles, pr-idempotency, pr-queue-kinds, pr-network-plan</td></tr>
<tr><td>6</td><td><strong>Validate</strong> — pre-mortem, STRIDE, FMEA, spike the riskiest assumption, skeptic review</td><td>Risk list, spike results</td><td>pr-validate-yourself</td></tr>
<tr><td>7</td><td><strong>Build</strong> — clean code, tests at every layer</td><td>Code + test plan</td><td>pr-solid, pr-design-patterns, pr-test-strategy</td></tr>
<tr><td>8</td><td><strong>Instrument</strong> — SLOs, RED/USE, logs, traces, alerts, runbooks</td><td>Dashboards + alerts + runbooks</td><td>pr-observability-plan</td></tr>
<tr><td>9</td><td><strong>Roll out</strong> — flags, canary, migration with rollback, load test, game day</td><td>Launch plan + PRR checklist</td><td>rel-deployments, staff-production-readiness</td></tr>
<tr><td>10</td><td><strong>Operate</strong> — on-call, error budgets, capacity, cost per unit</td><td>SLO reports, cost reports</td><td>rel-error-budgets, cloud-finops</td></tr>
<tr><td>11</td><td><strong>Learn</strong> — predicted vs actual, postmortems, ADR triggers</td><td>Day-30/90 review</td><td>pr-validate-yourself</td></tr>
</table>
<p>Junior engineers often start at step 7. Senior engineers start at step 4. Principals start at step 1 — and frequently the best outcome of step 1 is "we don't need a new system; we need a config change and a dashboard".</p>`,
        he: `<table>
<tr><th>#</th><th>צעד</th><th>תוצר</th><th>העמקה</th></tr>
<tr><td>1</td><td><strong>לגלות</strong> — הבעיה, המשתמשים, למה עכשיו</td><td>הגדרת בעיה + מדד הצלחה</td><td>pr-architect-questions</td></tr>
<tr><td>2</td><td><strong>לדרוש</strong> — פונקציונלי + NFRs עם מספרים; goals/non-goals; MoSCoW</td><td>סעיף דרישות</td><td>pr-architect-questions</td></tr>
<tr><td>3</td><td><strong>להעריך</strong> — QPS, אחסון, שרתים, עלות</td><td>טבלת sizing עם הנחות</td><td>pr-sizing</td></tr>
<tr><td>4</td><td><strong>אופציות</strong> — 2–3 חלופות אמיתיות כולל "לא לעשות כלום / לקנות"</td><td>מטריצת trade-offs</td><td>pr-db-landscape, pr-scaling-kinds, pr-cap-pacelc</td></tr>
<tr><td>5</td><td><strong>לתכנן</strong> — מודל דאטה, APIs, אינטגרציה, טיפול בכשלים, רשת, אבטחה</td><td>Design doc + ADRs</td><td>pr-integration-styles, pr-idempotency, pr-queue-kinds, pr-network-plan</td></tr>
<tr><td>6</td><td><strong>לאמת</strong> — pre-mortem, STRIDE, FMEA, spike להנחה המסוכנת, review של ספקנים</td><td>רשימת סיכונים, תוצאות spike</td><td>pr-validate-yourself</td></tr>
<tr><td>7</td><td><strong>לבנות</strong> — קוד נקי, בדיקות בכל שכבה</td><td>קוד + תוכנית בדיקות</td><td>pr-solid, pr-design-patterns, pr-test-strategy</td></tr>
<tr><td>8</td><td><strong>להכשיר</strong> — SLOs, RED/USE, לוגים, traces, התראות, runbooks</td><td>דשבורדים + התראות + runbooks</td><td>pr-observability-plan</td></tr>
<tr><td>9</td><td><strong>להשיק</strong> — flags, canary, מיגרציה עם rollback, load test, game day</td><td>תוכנית השקה + צ'קליסט PRR</td><td>rel-deployments, staff-production-readiness</td></tr>
<tr><td>10</td><td><strong>לתפעל</strong> — on-call, error budgets, קיבולת, עלות ליחידה</td><td>דוחות SLO, דוחות עלות</td><td>rel-error-budgets, cloud-finops</td></tr>
<tr><td>11</td><td><strong>ללמוד</strong> — תחזית מול בפועל, postmortems, triggers של ADRs</td><td>Review של יום 30/90</td><td>pr-validate-yourself</td></tr>
</table>
<p>מהנדסים ג'וניורים מתחילים הרבה פעמים בצעד 7. סניורים מתחילים בצעד 4. Principals מתחילים בצעד 1 — והרבה פעמים התוצאה הכי טובה של צעד 1 היא "אנחנו לא צריכים מערכת חדשה; אנחנו צריכים שינוי קונפיג ודשבורד".</p>`
      }
    },
    {
      h: { en: "The principal mindset: eight lenses", he: "ה-mindset של Principal: שמונה עדשות" },
      body: {
        en: `<ol>
<li><strong>Trade-offs, not answers.</strong> Every choice buys something and costs something. "Kafka gives replay and fan-out; it costs operational complexity and eventual consistency." If you can't name the cost, you don't understand the choice.</li>
<li><strong>Blast radius.</strong> When (not if) this fails, how many users/tenants/regions are hit? Cells, bulkheads, per-tenant limits and staged rollouts shrink it.</li>
<li><strong>Reversibility.</strong> One-way doors get slow, written, reviewed decisions; two-way doors get fast, delegated ones. Make doors two-way when you can (feature flags, expand/contract migrations, abstraction at the integration seam).</li>
<li><strong>Simplicity is a feature.</strong> The best design is the simplest one that meets the NFRs. Boring technology, fewer moving parts, fewer services. Complexity must be paid for by a requirement.</li>
<li><strong>Cost awareness.</strong> Know the cost per unit (per order, per user, per GB) and the biggest line items. A design that meets the SLO at 3x the budget is wrong.</li>
<li><strong>Operability.</strong> Who's paged, what they see, what they do. Design for the tired engineer at 3 a.m.</li>
<li><strong>Data outlives code.</strong> Schemas, IDs, events and contracts last for a decade; services are rewritten every 3–5 years. Spend design effort accordingly.</li>
<li><strong>People and org.</strong> Conway's law: the architecture will mirror the team structure. Ownership, skills, hiring and the migration path for other teams are part of the design.</li>
</ol>
<blockquote>💡 Real world: When principals disagree, the productive move is to make the disagreement concrete: "We differ on whether peak will exceed 5k writes/s within 18 months. If it will, DynamoDB wins; if not, Postgres wins. Let's look at the growth data." Arguments about tools become arguments about numbers.</blockquote>`,
        he: `<ol>
<li><strong>Trade-offs, לא תשובות.</strong> כל בחירה קונה משהו ועולה משהו. "Kafka נותן replay ו-fan-out; הוא עולה במורכבות תפעולית וב-eventual consistency." אם אתם לא יודעים לנקוב במחיר, לא הבנתם את הבחירה.</li>
<li><strong>Blast radius.</strong> כש(לא אם) זה נכשל, כמה משתמשים/tenants/regions נפגעים? Cells, bulkheads, limits לכל tenant ו-rollouts מדורגים מקטינים אותו.</li>
<li><strong>הפיכות.</strong> דלתות חד-כיווניות מקבלות החלטות איטיות, כתובות, עם review; דו-כיווניות מקבלות החלטות מהירות ומואצלות. הופכים דלתות לדו-כיווניות כשאפשר (feature flags, מיגרציות expand/contract, אבסטרקציה בתפר האינטגרציה).</li>
<li><strong>פשטות היא פיצ'ר.</strong> התכנון הכי טוב הוא הפשוט ביותר שעומד ב-NFRs. טכנולוגיה משעממת, פחות חלקים נעים, פחות שירותים. מורכבות צריכה להיות ממומנת ע"י דרישה.</li>
<li><strong>מודעות לעלות.</strong> יודעים את העלות ליחידה (להזמנה, למשתמש, ל-GB) ואת השורות הכי גדולות. תכנון שעומד ב-SLO בפי 3 מהתקציב — שגוי.</li>
<li><strong>תפעוליות.</strong> מי מקבל page, מה הוא רואה, מה הוא עושה. מתכננים בשביל המהנדס/ת העייף/ה ב-3 בלילה.</li>
<li><strong>דאטה חי יותר מקוד.</strong> Schemas, IDs, events וחוזים חיים עשור; שירותים נכתבים מחדש כל 3–5 שנים. מחלקים את מאמץ התכנון בהתאם.</li>
<li><strong>אנשים וארגון.</strong> חוק Conway: הארכיטקטורה תשקף את מבנה הצוותים. Ownership, סקילים, גיוס ומסלול המיגרציה לצוותים אחרים הם חלק מהתכנון.</li>
</ol>
<blockquote>💡 מהשטח: כש-principals חלוקים, המהלך הפרודוקטיבי הוא להפוך את המחלוקת לקונקרטית: "אנחנו חלוקים על האם השיא יעבור 5k כתיבות לשנייה תוך 18 חודשים. אם כן, DynamoDB מנצח; אם לא, Postgres מנצח. בואו נסתכל על נתוני הצמיחה." ויכוחים על כלים הופכים לוויכוחים על מספרים.</blockquote>`
      }
    },
    {
      h: { en: "Options and trade-off matrix: a worked example", he: "אופציות ומטריצת trade-offs: דוגמה מלאה" },
      body: {
        en: `<p>Problem: "Our nightly batch that sends 3M invoice emails takes 9 hours and sometimes double-sends." Three options, scored honestly:</p>
<table>
<tr><th>Criterion (weight)</th><th>A: Tune the batch (parallel threads + dedupe table)</th><th>B: Queue + workers (SQS, idempotency keys, rate limiter)</th><th>C: Buy (vendor bulk API)</th></tr>
<tr><td>Meets 2-hour window (5)</td><td>⚠️ maybe, 4–5 h</td><td>✅ ~1 h with 40 workers</td><td>✅ vendor does it</td></tr>
<tr><td>No duplicates (5)</td><td>✅ dedupe table</td><td>✅ idempotency key per invoice</td><td>⚠️ depends on vendor API</td></tr>
<tr><td>Effort (3)</td><td>✅ 1 week</td><td>⚠️ 4 weeks</td><td>⚠️ 3 weeks + procurement</td></tr>
<tr><td>Operability (3)</td><td>⚠️ still one big job, all-or-nothing</td><td>✅ retries, DLQ, per-message visibility</td><td>✅ vendor dashboards</td></tr>
<tr><td>Cost/month (2)</td><td>✅ ~$0</td><td>✅ ~$300</td><td>❌ ~$4,500</td></tr>
<tr><td>Reversibility (2)</td><td>✅</td><td>✅</td><td>⚠️ lock-in to template format</td></tr>
<tr><td><strong>Decision</strong></td><td colspan="3">B — meets both Musts, operable, cheap; A as a stop-gap this week (dedupe table) because double-sends hurt now.</td></tr>
</table>
<p>Notice the moves: a <strong>"do something small now"</strong> option alongside the real fix, a <strong>buy</strong> option considered seriously, weights tied to the requirements, and the decision explained in one sentence. This table, plus the sizing, is often 80% of a successful design review.</p>`,
        he: `<p>הבעיה: "ה-batch הלילי ששולח 3M מיילים של חשבוניות לוקח 9 שעות ולפעמים שולח כפול." שלוש אופציות, עם ציון כנה:</p>
<table>
<tr><th>קריטריון (משקל)</th><th>A: לכוונן את ה-batch (threads במקביל + טבלת dedupe)</th><th>B: תור + workers (SQS, idempotency keys, rate limiter)</th><th>C: לקנות (bulk API של ספק)</th></tr>
<tr><td>עומד בחלון של שעתיים (5)</td><td>⚠️ אולי, 4–5 שעות</td><td>✅ ~שעה עם 40 workers</td><td>✅ הספק עושה את זה</td></tr>
<tr><td>בלי כפילויות (5)</td><td>✅ טבלת dedupe</td><td>✅ idempotency key לכל חשבונית</td><td>⚠️ תלוי ב-API של הספק</td></tr>
<tr><td>מאמץ (3)</td><td>✅ שבוע</td><td>⚠️ 4 שבועות</td><td>⚠️ 3 שבועות + רכש</td></tr>
<tr><td>תפעוליות (3)</td><td>⚠️ עדיין job אחד גדול, הכול או כלום</td><td>✅ retries, DLQ, נראות לכל הודעה</td><td>✅ דשבורדים של הספק</td></tr>
<tr><td>עלות לחודש (2)</td><td>✅ ~$0</td><td>✅ ~$300</td><td>❌ ~$4,500</td></tr>
<tr><td>הפיכות (2)</td><td>✅</td><td>✅</td><td>⚠️ lock-in לפורמט התבניות</td></tr>
<tr><td><strong>החלטה</strong></td><td colspan="3">B — עומד בשני ה-Musts, תפעולי, זול; A כפתרון ביניים השבוע (טבלת dedupe) כי השליחות הכפולות כואבות עכשיו.</td></tr>
</table>
<p>שימו לב למהלכים: אופציה של <strong>"משהו קטן עכשיו"</strong> לצד התיקון האמיתי, אופציית <strong>קנייה</strong> שנשקלת ברצינות, משקלים שקשורים לדרישות, וההחלטה מוסברת במשפט אחד. הטבלה הזו, יחד עם ה-sizing, היא הרבה פעמים 80% מ-design review מוצלח.</p>`
      }
    },
    {
      h: { en: "The mega-checklist (the principal's head knowledge map)", he: "הצ'קליסט הגדול (מפת הידע שבראש של Principal)" },
      body: {
        en: `<table>
<tr><th>Area</th><th>You should be able to explain, with an example…</th><th>Lessons</th></tr>
<tr><td>Requirements</td><td>Questions to ask, NFR numbers, goals/non-goals, MoSCoW, one-way doors</td><td>pr-architect-questions</td></tr>
<tr><td>Estimation</td><td>QPS, peak, storage, Little's Law, servers, cost per unit</td><td>pr-sizing</td></tr>
<tr><td>Data</td><td>Relational/KV/document/wide-column/graph/time-series/search/vector/OLAP; CAP &amp; PACELC; replication, sharding</td><td>pr-db-landscape, pr-cap-pacelc, db-replication, db-sharding</td></tr>
<tr><td>Scale</td><td>Vertical/horizontal, scale cube, caching, read replicas, partitioning, cells, clusters</td><td>pr-scaling-kinds, pr-clusters, staff-cells-blast-radius</td></tr>
<tr><td>Integration</td><td>REST/gRPC/GraphQL/webhooks/events/CDC; idempotency; queues; rate limiters; 3rd-party deps</td><td>pr-integration-styles, pr-idempotency, pr-queue-kinds, pr-rate-limiters, pr-third-party-deps</td></tr>
<tr><td>Code</td><td>SOLID, GoF patterns, singleton variants, cloud patterns (sidecar, strangler, saga, outbox)</td><td>pr-solid, pr-design-patterns, pr-singletons, pr-cloud-patterns</td></tr>
<tr><td>Runtime</td><td>Concurrency vs parallelism vs multiprocessing, event loop, async/await, garbage collection</td><td>pr-concurrency-parallelism, pr-event-loop, pr-async-await, pr-garbage-collection</td></tr>
<tr><td>Protocols</td><td>HTTP/1.1 vs 2 vs 3, TLS, email (SMTP, SPF/DKIM/DMARC), SMS, push, WebSockets/SSE/MQTT</td><td>pr-http-versions, pr-email-sms, pr-realtime-protocols</td></tr>
<tr><td>Network</td><td>CIDR plan, subnets, egress, endpoints, DNS, hybrid</td><td>pr-network-plan</td></tr>
<tr><td>Quality</td><td>Test pyramid, doubles, contract/load/chaos, testing in prod</td><td>pr-test-strategy</td></tr>
<tr><td>Self-validation</td><td>ADRs, pre-mortem, STRIDE, FMEA, spikes, predicted vs actual</td><td>pr-validate-yourself</td></tr>
<tr><td>Operations</td><td>SLOs, RED/USE, logs, traces, burn-rate alerts, runbooks</td><td>pr-observability-plan, rel-sli-slo-sla</td></tr>
<tr><td>Leadership</td><td>Design docs, strategy, influence, migrations</td><td>staff-design-docs, staff-tech-strategy, staff-influence</td></tr>
</table>
<p>How to use it: pick a system you know (your current job's), and for each row write two sentences about how <em>that</em> system handles it. Every row you can't fill is your next study topic — and probably a risk in that system.</p>`,
        he: `<table>
<tr><th>תחום</th><th>צריך לדעת להסביר, עם דוגמה…</th><th>שיעורים</th></tr>
<tr><td>דרישות</td><td>אילו שאלות לשאול, מספרי NFR, goals/non-goals, MoSCoW, דלתות חד-כיווניות</td><td>pr-architect-questions</td></tr>
<tr><td>הערכה</td><td>QPS, שיא, אחסון, Little's Law, שרתים, עלות ליחידה</td><td>pr-sizing</td></tr>
<tr><td>דאטה</td><td>רלציוני/KV/document/wide-column/graph/time-series/search/vector/OLAP; CAP ו-PACELC; replication, sharding</td><td>pr-db-landscape, pr-cap-pacelc, db-replication, db-sharding</td></tr>
<tr><td>סקייל</td><td>אנכי/אופקי, scale cube, caching, read replicas, partitioning, cells, clusters</td><td>pr-scaling-kinds, pr-clusters, staff-cells-blast-radius</td></tr>
<tr><td>אינטגרציה</td><td>REST/gRPC/GraphQL/webhooks/events/CDC; אידמפוטנטיות; תורים; rate limiters; תלות בצד שלישי</td><td>pr-integration-styles, pr-idempotency, pr-queue-kinds, pr-rate-limiters, pr-third-party-deps</td></tr>
<tr><td>קוד</td><td>SOLID, patterns של GoF, וריאציות של singleton, cloud patterns (sidecar, strangler, saga, outbox)</td><td>pr-solid, pr-design-patterns, pr-singletons, pr-cloud-patterns</td></tr>
<tr><td>Runtime</td><td>Concurrency מול parallelism מול multiprocessing, event loop, async/await, garbage collection</td><td>pr-concurrency-parallelism, pr-event-loop, pr-async-await, pr-garbage-collection</td></tr>
<tr><td>פרוטוקולים</td><td>HTTP/1.1 מול 2 מול 3, TLS, מייל (SMTP, SPF/DKIM/DMARC), SMS, push, WebSockets/SSE/MQTT</td><td>pr-http-versions, pr-email-sms, pr-realtime-protocols</td></tr>
<tr><td>רשת</td><td>תוכנית CIDR, subnets, egress, endpoints, DNS, היברידי</td><td>pr-network-plan</td></tr>
<tr><td>איכות</td><td>פירמידת בדיקות, doubles, contract/load/chaos, בדיקות בפרודקשן</td><td>pr-test-strategy</td></tr>
<tr><td>אימות עצמי</td><td>ADRs, pre-mortem, STRIDE, FMEA, spikes, תחזית מול בפועל</td><td>pr-validate-yourself</td></tr>
<tr><td>תפעול</td><td>SLOs, RED/USE, לוגים, traces, התראות burn-rate, runbooks</td><td>pr-observability-plan, rel-sli-slo-sla</td></tr>
<tr><td>מנהיגות</td><td>Design docs, אסטרטגיה, השפעה, מיגרציות</td><td>staff-design-docs, staff-tech-strategy, staff-influence</td></tr>
</table>
<p>איך משתמשים: בוחרים מערכת שאתם מכירים (זו של העבודה הנוכחית), ולכל שורה כותבים שני משפטים על איך <em>המערכת הזו</em> מטפלת בזה. כל שורה שאתם לא מצליחים למלא היא נושא הלימוד הבא שלכם — וכנראה גם סיכון במערכת הזו.</p>`
      }
    },
    {
      h: { en: "Habits that make the difference", he: "ההרגלים שעושים את ההבדל" },
      body: {
        en: `<ul>
<li><strong>Read postmortems weekly</strong> (yours and public ones: Cloudflare, GitHub, AWS, Google). Most "new" failures are old ones in new clothes.</li>
<li><strong>Keep a numbers notebook</strong>: real throughput, latency and cost figures from your systems. Your estimates become sharp because they're grounded.</li>
<li><strong>Write more than you talk</strong>: a 2-page doc scales your thinking to 50 people; a meeting reaches 8.</li>
<li><strong>Delete things</strong>: a principal's best PRs often remove a service, a queue, a dashboard, an alert.</li>
<li><strong>Do on-call occasionally</strong>: nothing calibrates design judgment like being paged by your own design.</li>
<li><strong>Grow others</strong>: review designs by asking questions, not dictating answers. Your leverage is the quality of decisions you're not in the room for.</li>
</ul>
<blockquote>⚠️ Production tip: The fastest way to lose principal-level trust is a confident wrong answer. "I don't know — here's how I'd find out in a day" builds more trust than a guess dressed as certainty.</blockquote>`,
        he: `<ul>
<li><strong>קוראים postmortems כל שבוע</strong> (שלכם וציבוריים: Cloudflare, GitHub, AWS, Google). רוב הכישלונות ה"חדשים" הם ישנים בבגדים חדשים.</li>
<li><strong>מחזיקים מחברת מספרים</strong>: נתוני throughput, latency ועלות אמיתיים מהמערכות שלכם. ההערכות נהיות חדות כי הן מעוגנות.</li>
<li><strong>כותבים יותר ממדברים</strong>: מסמך של 2 עמודים מגיע ל-50 אנשים; פגישה מגיעה ל-8.</li>
<li><strong>מוחקים דברים</strong>: ה-PRs הכי טובים של principal מוחקים הרבה פעמים service, תור, דשבורד, התראה.</li>
<li><strong>עושים on-call מדי פעם</strong>: שום דבר לא מכייל שיקול דעת תכנוני כמו לקבל page מהתכנון של עצמך.</li>
<li><strong>מצמיחים אחרים</strong>: עושים review לתכנונים ע"י שאלות, לא הכתבת תשובות. המינוף שלכם הוא איכות ההחלטות שמתקבלות כשאתם לא בחדר.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: הדרך הכי מהירה לאבד אמון ברמת principal היא תשובה שגויה בביטחון. "אני לא יודע/ת — ככה הייתי בודק/ת את זה תוך יום" בונה יותר אמון מניחוש שמחופש לוודאות.</blockquote>`
      }
    }
  ],
  diagram: `   1 DISCOVER -> 2 REQUIRE -> 3 ESTIMATE -> 4 OPTIONS -> 5 DESIGN
        ^                                                    |
        |                                                    v
  11 LEARN                                              6 VALIDATE
  (predicted vs actual,                                     |
   postmortems, ADR triggers)                               v
        ^                                               7 BUILD (+tests)
        |                                                    |
   10 OPERATE <- 9 ROLL OUT (flags, canary) <- 8 INSTRUMENT <-+

  lenses at every step:
  [trade-offs] [blast radius] [reversibility] [simplicity]
  [cost/unit]  [operability]  [data outlives code] [people/Conway]`,
  handsOn: [
    { cmd: "printf '| Area | How does OUR system handle it? |\\n|---|---|\\n| Requirements | |\\n| Sizing | |\\n| Data/CAP | |\\n| Scaling | |\\n| Integration/idempotency | |\\n| Observability | |\\n| Rollout | |\\n' > my-system-map.md", what: { en: "Fill the mega-checklist for the system you work on today. Empty rows = study topics and probably risks.", he: "מלאו את הצ'קליסט הגדול עבור המערכת שאתם עובדים עליה היום. שורות ריקות = נושאי לימוד וכנראה סיכונים." } },
    { cmd: "curl -s https://api.github.com/repos/danluu/post-mortems | jq '.description'", what: { en: "A curated list of public postmortems — read one a week and write down the failure pattern.", he: "רשימה אוצרת של postmortems ציבוריים — קוראים אחד בשבוע ורושמים את דפוס הכישלון." } },
    { cmd: "printf 'Option | Must1 | Must2 | Effort | Ops | Cost | Reversible\\n' > tradeoffs.csv", what: { en: "Start a weighted trade-off matrix for your next decision, including a 'do something small now' and a 'buy' option.", he: "מתחילים מטריצת trade-offs ממושקלת להחלטה הבאה, כולל אופציית 'משהו קטן עכשיו' ואופציית 'לקנות'." } }
  ],
  mnemonic: {
    en: "\"Discover, Require, Estimate, Options, Design, Validate, Build, Instrument, Roll out, Operate, Learn\" — and the 8 lenses: Trade-off, Blast, Reverse, Simple, Cost, Operate, Data, People.",
    he: "\"לגלות, לדרוש, להעריך, אופציות, לתכנן, לאמת, לבנות, להכשיר, להשיק, לתפעל, ללמוד\" — ו-8 העדשות: Trade-off, Blast, הפיכות, פשטות, עלות, תפעול, דאטה, אנשים."
  },
  pitfalls: [
    { en: "Starting at 'build' because coding feels productive — the most expensive bugs are in requirements and estimates.", he: "להתחיל ב'לבנות' כי קוד מרגיש פרודוקטיבי — הבאגים הכי יקרים נמצאים בדרישות ובהערכות." },
    { en: "Presenting one option. Without alternatives (including 'buy' and 'do less'), reviewers can't see the trade-offs and won't trust the choice.", he: "להציג אופציה אחת. בלי חלופות (כולל 'לקנות' ו'לעשות פחות'), reviewers לא רואים את ה-trade-offs ולא יסמכו על הבחירה." },
    { en: "Optimizing for elegance over operability — a clever design that only its author can debug is a liability.", he: "לבצע אופטימיזציה לאלגנטיות על פני תפעוליות — תכנון מתוחכם שרק הכותב שלו יכול לדבג הוא נטל." },
    { en: "Ignoring the org: a design needing 3 teams to change in lockstep will stall regardless of its technical merit.", he: "להתעלם מהארגון: תכנון שדורש מ-3 צוותים לשנות בתיאום מלא ייתקע בלי קשר לאיכות הטכנית שלו." }
  ],
  interview: [
    { q: { en: "What distinguishes a principal engineer's design approach from a senior engineer's?", he: "מה מבדיל את גישת התכנון של Principal מזו של Senior?" },
      a: { en: "Scope and starting point: a senior designs a good solution to a given problem; a principal questions the problem, frames goals/non-goals, compares options including buying or not building, quantifies trade-offs (cost, risk, reversibility, blast radius), designs for operations and org structure, validates assumptions early, and closes the loop by comparing predictions to reality — and makes many other engineers' decisions better through docs and reviews.", he: "היקף ונקודת התחלה: Senior מתכנן/ת פתרון טוב לבעיה נתונה; Principal מערער/ת על הבעיה, ממסגר/ת goals/non-goals, משווה אופציות כולל לקנות או לא לבנות, מכמת/ת trade-offs (עלות, סיכון, הפיכות, blast radius), מתכנן/ת לתפעול ולמבנה הארגוני, מאמת/ת הנחות מוקדם, וסוגר/ת את הלולאה בהשוואת תחזיות למציאות — ומשפר/ת את ההחלטות של הרבה מהנדסים אחרים דרך מסמכים ו-reviews." } },
    { q: { en: "Walk me through how you'd approach 'our system is too slow' as a principal.", he: "תעביר/י אותי איך היית ניגש/ת ל'המערכת שלנו איטית מדי' כ-Principal." },
      a: { en: "Discover: slow for whom, which journey, since when, measured how (p50 vs p99)? Require: what target, what's the business cost? Measure: traces of slow requests, RED per dependency, USE on resources. Options: fix the hot query/index, add caching, remove a sync hop, scale a dependency, or accept and set expectations — with cost and risk for each. Validate with a spike/load test, roll out behind a flag/canary, add an SLO so regressions alert, and review predicted vs actual improvement.", he: "לגלות: איטי למי, איזה מסע, ממתי, נמדד איך (p50 מול p99)? לדרוש: מה היעד, מה העלות העסקית? למדוד: traces של בקשות איטיות, RED לכל dependency, USE על משאבים. אופציות: לתקן query/index חם, להוסיף caching, להוריד hop סינכרוני, להגדיל dependency, או לקבל ולתאם ציפיות — עם עלות וסיכון לכל אחת. לאמת עם spike/load test, להשיק מאחורי flag/canary, להוסיף SLO כדי שרגרסיות יתריעו, ולעשות review של שיפור צפוי מול בפועל." } },
    { q: { en: "How do you decide between building and buying?", he: "איך מחליטים בין לבנות ללקנות?" },
      a: { en: "Is it core to our differentiation? If not, lean buy. Compare total cost of ownership over 3 years (engineers × time + on-call + infra) vs license; check vendor SLA, limits, data residency, exit cost/lock-in, and whether integration is a two-way door (keep an abstraction at the seam). Often: buy now, abstract the interface, revisit when scale or needs change.", he: "זה ליבת הבידול שלנו? אם לא, נוטים לקנות. משווים עלות בעלות כוללת ל-3 שנים (מהנדסים × זמן + on-call + תשתית) מול רישיון; בודקים SLA של הספק, limits, data residency, עלות יציאה/lock-in, והאם האינטגרציה היא דלת דו-כיוונית (שומרים אבסטרקציה בתפר). הרבה פעמים: קונים עכשיו, עוטפים את הממשק, וחוזרים לזה כשהסקייל או הצרכים משתנים." } }
  ],
  quiz: [
    { q: { en: "Where does a principal typically start?", he: "איפה Principal בדרך כלל מתחיל/ה?" },
      options: [ { en: "Choosing the database", he: "בחירת ה-database" }, { en: "Writing code", he: "כתיבת קוד" }, { en: "Understanding the problem, users and success metric", he: "הבנת הבעיה, המשתמשים ומדד ההצלחה" }, { en: "Drawing the architecture diagram", he: "ציור דיאגרמת ארכיטקטורה" } ],
      answer: 2, explain: { en: "Step 1 is discovery — sometimes it shows no new system is needed.", he: "צעד 1 הוא גילוי — לפעמים הוא מראה שלא צריך מערכת חדשה." } },
    { q: { en: "Why include a 'buy' and a 'do something small now' option in a trade-off matrix?", he: "למה לכלול אופציית 'לקנות' ו'משהו קטן עכשיו' במטריצת trade-offs?" },
      options: [ { en: "To make the doc longer", he: "כדי להאריך את המסמך" }, { en: "They are often the cheapest way to meet the Musts and reveal what the real fix must justify", he: "הן הרבה פעמים הדרך הזולה ביותר לעמוד ב-Musts ומראות מה התיקון האמיתי צריך להצדיק" }, { en: "Vendors require it", he: "ספקים דורשים את זה" }, { en: "To avoid deciding", he: "כדי להימנע מהחלטה" } ],
      answer: 1, explain: { en: "Honest alternatives anchor the cost/benefit of the ambitious option.", he: "חלופות כנות מעגנות את העלות/תועלת של האופציה השאפתנית." } },
    { q: { en: "'Data outlives code' implies you should invest most design care in…", he: "'דאטה חי יותר מקוד' אומר שצריך להשקיע הכי הרבה תשומת לב ב-…" },
      options: [ { en: "Variable names", he: "שמות משתנים" }, { en: "Schemas, IDs, event formats and public contracts", he: "Schemas, IDs, פורמטים של events וחוזים ציבוריים" }, { en: "CI pipeline speed", he: "מהירות ה-CI pipeline" }, { en: "Dashboard colors", he: "צבעי דשבורד" } ],
      answer: 1, explain: { en: "They're the one-way doors that persist across rewrites.", he: "הן הדלתות החד-כיווניות ששורדות rewrites." } },
    { q: { en: "Conway's law says…", he: "חוק Conway אומר…" },
      options: [ { en: "Latency doubles every year", he: "Latency מוכפל כל שנה" }, { en: "Systems mirror the communication structure of the organization that builds them", he: "מערכות משקפות את מבנה התקשורת של הארגון שבונה אותן" }, { en: "Every system needs a cache", he: "כל מערכת צריכה cache" }, { en: "Tests should be 70% unit", he: "בדיקות צריכות להיות 70% unit" } ],
      answer: 1, explain: { en: "So team boundaries and ownership are architecture decisions too.", he: "לכן גבולות צוותים ו-ownership הם גם החלטות ארכיטקטורה." } }
  ],
  related: ["pr-architect-questions", "pr-sizing", "pr-validate-yourself", "pr-observability-plan", "staff-design-docs", "staff-tech-strategy", "staff-production-readiness", "staff-interview-loop"]
});

/* Glossary — principal track, part 1 */
INFRA.glossary.push({ term: "Non-goals", track: "principal", def: { en: "Reasonable expectations a design explicitly will NOT address, written down to control scope and focus reviews.", he: "ציפיות סבירות שהתכנון במפורש לא יטפל בהן, כתובות כדי לשלוט ב-scope ולמקד reviews." }, lesson: "pr-architect-questions" });
INFRA.glossary.push({ term: "One-way door", track: "principal", def: { en: "A decision that is expensive or impossible to reverse (public API, partition key, ID format) — decide slowly, in writing, with review.", he: "החלטה שיקר או בלתי אפשרי להפוך (API ציבורי, partition key, פורמט ID) — מחליטים לאט, בכתב, עם review." }, lesson: "pr-architect-questions" });
INFRA.glossary.push({ term: "Little's Law", track: "principal", def: { en: "L = λ × W: items in the system equal arrival rate times time in system; sizes pools and explains latency-driven overload.", he: "L = λ × W: מספר הפריטים במערכת שווה לקצב ההגעה כפול הזמן במערכת; קובע גודל pools ומסביר עומס שנגרם מ-latency." }, lesson: "pr-sizing" });
INFRA.glossary.push({ term: "IPAM", track: "principal", def: { en: "IP Address Management: the single source of truth that allocates non-overlapping CIDRs across VPCs, regions and on-prem.", he: "IP Address Management: מקור האמת היחיד שמקצה CIDRs לא חופפים בין VPCs, regions ו-on-prem." }, lesson: "pr-network-plan" });
INFRA.glossary.push({ term: "Contract test", track: "principal", def: { en: "A test where the consumer's expectations of an API are verified against the provider's real code (e.g. Pact), replacing fragile cross-team E2E tests.", he: "בדיקה שבה הציפיות של ה-consumer מ-API מאומתות מול הקוד האמיתי של ה-provider (למשל Pact), במקום E2E שבירים בין צוותים." }, lesson: "pr-test-strategy" });
INFRA.glossary.push({ term: "ADR", track: "principal", def: { en: "Architecture Decision Record: a short, immutable document of one decision — context, options, decision, consequences, re-evaluation trigger.", he: "Architecture Decision Record: מסמך קצר ובלתי משתנה של החלטה אחת — הקשר, אופציות, החלטה, השלכות, trigger להערכה מחדש." }, lesson: "pr-validate-yourself" });
INFRA.glossary.push({ term: "Pre-mortem", track: "principal", def: { en: "A review where the team assumes the project has already failed and lists why, to surface hidden risks early.", he: "Review שבו הצוות מניח שהפרויקט כבר נכשל ומפרט למה, כדי לחשוף סיכונים נסתרים מוקדם." }, lesson: "pr-validate-yourself" });
INFRA.glossary.push({ term: "traceparent", track: "principal", def: { en: "W3C Trace Context header (version-traceid-spanid-flags) that propagates a trace across services and message queues.", he: "Header של W3C Trace Context (version-traceid-spanid-flags) שמעביר trace בין שירותים ותורי הודעות." }, lesson: "pr-observability-plan" });
