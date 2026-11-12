// Staff track — the Staff/Principal skills that are not pure tech:
// design docs, tech strategy, production readiness, large incidents, migrations at scale, influence, the interview loop.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 20. Design docs, RFCs and ADRs
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-design-docs",
  track: "staff",
  order: 20,
  icon: "📝",
  level: 3,
  minutes: 14,
  title: {
    en: "Design Docs, RFCs & ADRs: Deciding in Writing",
    he: "Design Docs, RFCs ו-ADRs: לקבל החלטות בכתב"
  },
  tldr: {
    en: "A design doc is not paperwork — it is the cheapest place to find the mistake: write context, goals and non-goals, at least two real options, the decision, risks, rollout and rollback, get the right reviewers early, and freeze the outcome into a one-page ADR.",
    he: "Design doc זה לא בירוקרטיה — זה המקום הכי זול למצוא את הטעות: כותבים context, goals ו-non-goals, לפחות שתי אופציות אמיתיות, את ההחלטה, סיכונים, rollout ו-rollback, מביאים את ה-reviewers הנכונים מוקדם, ומקפיאים את התוצאה ב-ADR של עמוד אחד."
  },
  analogy: {
    en: "An architect draws blueprints before anyone pours concrete. Moving a wall on paper costs an eraser; moving it after the concrete set costs a jackhammer and a month. The design doc is your blueprint, and the ADR is the stamped permit filed at city hall so that in five years someone knows why the wall is exactly there.",
    he: "אדריכל משרטט תוכניות לפני שמישהו יוצק בטון. להזיז קיר על הנייר עולה מחק; להזיז אותו אחרי שהבטון התייבש עולה פטיש אוויר וחודש עבודה. ה-design doc הוא השרטוט שלך, וה-ADR הוא ההיתר החתום שמתויק בעירייה — כדי שבעוד חמש שנים מישהו ידע למה הקיר נמצא בדיוק שם."
  },
  sections: [
    {
      h: { en: "Design doc vs RFC vs ADR — which one, when", he: "Design doc מול RFC מול ADR — מה ומתי" },
      body: {
        en: `<p>Three artefacts, three jobs:</p>
<table><tr><th></th><th>Purpose</th><th>Length</th><th>Lifetime</th></tr>
<tr><td><strong>Design doc</strong></td><td>Think through a non-trivial change: problem, options, plan</td><td>3-10 pages</td><td>Living during design, then archived</td></tr>
<tr><td><strong>RFC</strong> (Request For Comments)</td><td>A design doc opened to a wide audience for formal review — usually cross-team or org-wide (e.g. "all services move to OpenTelemetry")</td><td>3-15 pages</td><td>Has a review window and an explicit accept/reject</td></tr>
<tr><td><strong>ADR</strong> (Architecture Decision Record)</td><td>Record <em>one</em> decision and its reasoning, immutable, next to the code</td><td>1 page</td><td>Forever; superseded by a newer ADR, never edited</td></tr></table>
<p>Rule of thumb for when a doc is required: the change takes more than ~2 engineer-weeks, touches more than one team, changes a data model or an external API, adds a new technology to the stack, or is hard to reverse. Upgrading a Helm chart minor version — no doc. Moving 40 services from self-hosted RabbitMQ to Kafka — definitely a doc, probably an RFC.</p>
<blockquote>💡 Real world: the doc's main value is to the <em>author</em>. Half the time, writing the "Options considered" section makes you realise your favourite option has a hole. That is a win, not a waste.</blockquote>`,
        he: `<p>שלושה ארטיפקטים, שלושה תפקידים:</p>
<table><tr><th></th><th>מטרה</th><th>אורך</th><th>אורך חיים</th></tr>
<tr><td><strong>Design doc</strong></td><td>לחשוב לעומק על שינוי לא טריוויאלי: בעיה, אופציות, תוכנית</td><td>3-10 עמודים</td><td>חי בזמן התכנון, אחר כך נכנס לארכיון</td></tr>
<tr><td><strong>RFC</strong> (Request For Comments)</td><td>Design doc שנפתח לקהל רחב ל-review פורמלי — בדרך כלל cross-team או ברמת הארגון (למשל "כל השירותים עוברים ל-OpenTelemetry")</td><td>3-15 עמודים</td><td>יש לו חלון review ו-accept/reject מפורש</td></tr>
<tr><td><strong>ADR</strong> (Architecture Decision Record)</td><td>מתעד החלטה <em>אחת</em> והנימוק שלה, immutable, ליד הקוד</td><td>עמוד אחד</td><td>לנצח; מוחלף ב-ADR חדש (superseded), לא עורכים אותו</td></tr></table>
<p>כלל אצבע מתי חייבים doc: השינוי לוקח יותר מ-~2 שבועות-מהנדס, נוגע ביותר מצוות אחד, משנה data model או API חיצוני, מכניס טכנולוגיה חדשה ל-stack, או קשה להחזיר אותו אחורה. שדרוג minor של Helm chart — בלי doc. להעביר 40 שירותים מ-RabbitMQ self-hosted ל-Kafka — בטוח doc, כנראה RFC.</p>
<blockquote>💡 מהשטח: הערך העיקרי של ה-doc הוא ל<em>כותב</em>. בחצי מהמקרים, כשאתה כותב את "Options considered" אתה מגלה שבאופציה האהובה עליך יש חור. זה ניצחון, לא בזבוז זמן.</blockquote>`
      }
    },
    {
      h: { en: "The structure that works", he: "המבנה שעובד" },
      body: {
        en: `<ol>
<li><strong>Context / problem</strong> — what hurts today, with numbers. "Our self-managed RabbitMQ cluster had 4 SEV2s in Q3; consumers can't replay; ops cost ~0.5 FTE."</li>
<li><strong>Goals</strong> — measurable outcomes. "Replay up to 7 days of events. p99 publish latency &lt; 20 ms. Zero message loss on single-broker failure."</li>
<li><strong>Non-goals</strong> — what you deliberately will <em>not</em> do. This is the section that prevents scope creep and endless review threads: "Not migrating the billing queue this quarter. Not introducing exactly-once semantics."</li>
<li><strong>Options considered</strong> — at least two real ones plus "do nothing". A comparison table on cost, effort, risk, operational load, fit to goals.</li>
<li><strong>Decision / proposed design</strong> — the chosen option in enough detail to build: diagrams, APIs, data flow, capacity math.</li>
<li><strong>Risks &amp; mitigations</strong> — what could go wrong and what you will do about it. Include failure modes ("broker loses a disk", "consumer lag explodes").</li>
<li><strong>Rollout plan</strong> — phases, who is first, success metrics per phase, dual-run period.</li>
<li><strong>Rollback plan</strong> — how to undo each phase and until when it is still cheap to undo. A design without a rollback is a bet, not a plan.</li>
<li><strong>Open questions</strong> — what you still don't know; reviewers love closing these.</li>
</ol>
<p>Optional but valuable: security/privacy review, cost estimate (monthly $), observability (which SLIs/dashboards prove it works), and an "Alternatives rejected and why" appendix.</p>`,
        he: `<ol>
<li><strong>Context / problem</strong> — מה כואב היום, עם מספרים. "ה-RabbitMQ שאנחנו מנהלים בעצמנו גרם ל-4 SEV2 ב-Q3; ה-consumers לא יכולים לעשות replay; התפעול עולה בערך חצי FTE."</li>
<li><strong>Goals</strong> — תוצאות מדידות. "Replay של עד 7 ימי events. p99 publish latency מתחת ל-20ms. אפס איבוד הודעות בנפילה של broker בודד."</li>
<li><strong>Non-goals</strong> — מה אתה בכוונה <em>לא</em> עושה. זה הסעיף שמונע scope creep ו-threads אינסופיים ב-review: "לא מעבירים את תור ה-billing ברבעון הזה. לא מכניסים exactly-once."</li>
<li><strong>Options considered</strong> — לפחות שתיים אמיתיות ועוד "לא לעשות כלום". טבלת השוואה של עלות, מאמץ, סיכון, עומס תפעולי והתאמה ל-goals.</li>
<li><strong>Decision / proposed design</strong> — האופציה שנבחרה, ברמת פירוט שאפשר לבנות ממנה: דיאגרמות, APIs, data flow, חישובי capacity.</li>
<li><strong>Risks &amp; mitigations</strong> — מה יכול להשתבש ומה תעשה עם זה. כולל failure modes ("broker מאבד דיסק", "ה-consumer lag מתפוצץ").</li>
<li><strong>Rollout plan</strong> — שלבים, מי ראשון, מדדי הצלחה לכל שלב, תקופת dual-run.</li>
<li><strong>Rollback plan</strong> — איך מבטלים כל שלב ועד מתי זה עדיין זול. תכנון בלי rollback זה הימור, לא תוכנית.</li>
<li><strong>Open questions</strong> — מה אתה עוד לא יודע; reviewers אוהבים לסגור את אלה.</li>
</ol>
<p>אופציונלי אבל שווה: security/privacy review, הערכת עלות (דולר לחודש), observability (אילו SLIs ודשבורדים יוכיחו שזה עובד), ונספח "Alternatives rejected and why".</p>`
      }
    },
    {
      h: { en: "A short template", he: "תבנית קצרה" },
      body: {
        en: `<pre># RFC-042: Move async events from RabbitMQ to Kafka (MSK)
Author: @dana   Reviewers: @platform-leads @payments-tl @sre-oncall
Status: In review (closes 2026-03-14)   Approver: Director, Infra

## Context          what hurts, with numbers + links to incidents
## Goals            measurable: replay 7d, p99 publish &lt; 20ms, RPO=0 on 1 broker loss
## Non-goals        billing queue, exactly-once, multi-region
## Options
| Option                  | Cost/mo | Eng effort | Ops load | Risk |
| Keep RabbitMQ + fix     | $3k     | 1 mo       | high     | med  |
| Self-hosted Kafka on K8s| $6k     | 4 mo       | high     | high |
| Amazon MSK              | $9k     | 2 mo       | low      | low  |
## Decision         MSK, 3 AZs, RF=3, min.insync.replicas=2
## Risks            consumer lag during cutover -&gt; dual-publish + lag alert
## Rollout          1) shadow publish  2) 2 low-risk consumers  3) rest  4) decommission
## Rollback         flip feature flag publish_target=rabbit (until phase 4)
## Open questions   schema registry: Glue vs Confluent?</pre>
<p>And the ADR that freezes the outcome (stored in <code>docs/adr/</code> in the repo):</p>
<pre># ADR-0007: Use Amazon MSK for async events
Status: Accepted (supersedes ADR-0002)   Date: 2026-03-15
Context: see RFC-042. Decision: MSK over self-hosted Kafka.
Consequences: +$6k/mo vs today; no broker on-call; vendor lock-in
on MSK-specific IAM auth (accepted, reversible within ~1 quarter).</pre>`,
        he: `<pre># RFC-042: Move async events from RabbitMQ to Kafka (MSK)
Author: @dana   Reviewers: @platform-leads @payments-tl @sre-oncall
Status: In review (closes 2026-03-14)   Approver: Director, Infra

## Context          what hurts, with numbers + links to incidents
## Goals            measurable: replay 7d, p99 publish &lt; 20ms, RPO=0 on 1 broker loss
## Non-goals        billing queue, exactly-once, multi-region
## Options
| Option                  | Cost/mo | Eng effort | Ops load | Risk |
| Keep RabbitMQ + fix     | $3k     | 1 mo       | high     | med  |
| Self-hosted Kafka on K8s| $6k     | 4 mo       | high     | high |
| Amazon MSK              | $9k     | 2 mo       | low      | low  |
## Decision         MSK, 3 AZs, RF=3, min.insync.replicas=2
## Risks            consumer lag during cutover -&gt; dual-publish + lag alert
## Rollout          1) shadow publish  2) 2 low-risk consumers  3) rest  4) decommission
## Rollback         flip feature flag publish_target=rabbit (until phase 4)
## Open questions   schema registry: Glue vs Confluent?</pre>
<p>וה-ADR שמקפיא את התוצאה (נשמר ב-<code>docs/adr/</code> בתוך ה-repo):</p>
<pre># ADR-0007: Use Amazon MSK for async events
Status: Accepted (supersedes ADR-0002)   Date: 2026-03-15
Context: see RFC-042. Decision: MSK over self-hosted Kafka.
Consequences: +$6k/mo vs today; no broker on-call; vendor lock-in
on MSK-specific IAM auth (accepted, reversible within ~1 quarter).</pre>
<p>שים לב שהתבנית עצמה באנגלית — ככה זה נראה ברוב החברות בארץ, גם כשהדיון סביבה בעברית.</p>`
      }
    },
    {
      h: { en: "Getting review without drowning in it", he: "לקבל review בלי לטבוע בו" },
      body: {
        en: `<ul>
<li><strong>Pre-wire before you publish.</strong> Walk the 2-3 people with veto power (the payments tech lead, the SRE who'll carry the pager, security) through a rough draft 1:1. A doc that surprises a key stakeholder in a 30-person thread gets torn apart; the same doc pre-discussed gets "+1, one comment".</li>
<li><strong>Name reviewers and roles explicitly:</strong> "@sre-oncall — please focus on rollback and alerting; @security — IAM section only". Generic "PTAL everyone" gets no reviews.</li>
<li><strong>Time-box it:</strong> a review window (e.g. 5 working days) and a named approver who makes the call when consensus doesn't come.</li>
<li><strong>Move long threads to a meeting.</strong> If a comment thread passes ~5 replies, it's a 30-minute conversation. Record the outcome back in the doc.</li>
<li><strong>Close the loop:</strong> mark the doc Accepted/Rejected, write the ADR, link it from the repo README and the ticket. Unresolved docs rot into "we never really decided".</li>
</ul>
<blockquote>⚠️ Production tip: a design review is not a vote. Seek consent ("can you live with this?"), not unanimity. Disagreements that remain go into the doc as "Dissent noted: @x prefers option B because..." — that's honest and lets the approver decide.</blockquote>`,
        he: `<ul>
<li><strong>Pre-wire לפני שמפרסמים.</strong> תעבור עם 2-3 האנשים שיש להם veto (ה-tech lead של payments, ה-SRE שיחזיק את הפייג'ר, security) על טיוטה גסה, אחד על אחד. Doc שמפתיע stakeholder מרכזי ב-thread של 30 איש נקרע לגזרים; אותו doc אחרי שיחה מוקדמת מקבל "+1, הערה אחת".</li>
<li><strong>תגדיר reviewers ותפקידים במפורש:</strong> "@sre-oncall — תתמקדו ב-rollback ו-alerting; @security — רק סעיף ה-IAM". "PTAL כולם" כללי לא מקבל אף review.</li>
<li><strong>Time-box:</strong> חלון review (למשל 5 ימי עבודה) ו-approver עם שם שמחליט כשאין הסכמה.</li>
<li><strong>Thread ארוך עובר לפגישה.</strong> אם thread של הערות עבר ~5 תגובות, זו שיחה של 30 דקות. את התוצאה כותבים בחזרה ב-doc.</li>
<li><strong>לסגור את המעגל:</strong> לסמן את ה-doc כ-Accepted/Rejected, לכתוב ADR, ולקשר אותו מה-README של ה-repo ומהטיקט. Docs שלא נסגרו נרקבים ל"אף פעם לא באמת החלטנו".</li>
</ul>
<blockquote>⚠️ טיפ מהפרודקשן: design review זה לא הצבעה. מחפשים consent ("אתה יכול לחיות עם זה?"), לא פה אחד. מחלוקות שנשארות נכנסות ל-doc כ-"Dissent noted: @x מעדיף את אופציה B כי..." — זה הוגן ומאפשר ל-approver להחליט.</blockquote>`
      }
    }
  ],
  diagram: "draft -> pre-wire (1:1 with veto holders) -> RFC review window (5d) -> decision meeting\n   -> Accepted -> ADR-0007 in docs/adr/ -> build -> rollout phases\n   -> Rejected -> ADR records 'why not' (still valuable)",
  handsOn: [
    { cmd: "cp docs/templates/adr.md docs/adr/0007-use-msk-for-events.md", what: { en: "Start an ADR from the team template, numbered sequentially and stored next to the code so it is reviewed in a PR like any other change.", he: "מתחילים ADR מתבנית הצוות, ממוספר ברצף ושמור ליד הקוד — כך שהוא עובר review ב-PR כמו כל שינוי אחר." } },
    { cmd: "gh pr create --title \"ADR-0007: Use MSK for async events\" --reviewer platform-leads,sre-oncall --label adr", what: { en: "Open the ADR as a pull request with explicit reviewers; the merge is the moment of decision and git history is the audit trail.", he: "פותחים את ה-ADR כ-pull request עם reviewers מפורשים; ה-merge הוא רגע ההחלטה, וה-git history הוא ה-audit trail." } },
    { cmd: "grep -l \"Status: Accepted\" docs/adr/*.md | xargs grep -h \"^# ADR\"", what: { en: "List every accepted decision — the first thing a new Staff engineer should read when joining a team.", he: "רשימה של כל ההחלטות שהתקבלו — הדבר הראשון ש-Staff engineer חדש צריך לקרוא כשהוא מצטרף לצוות." } }
  ],
  mnemonic: {
    en: "CG-NO-DRRR: Context, Goals, Non-goals, Options, Decision, Risks, Rollout, Rollback. If a doc has no Non-goals and no Rollback, it is not ready.",
    he: "CG-NO-DRRR: Context, Goals, Non-goals, Options, Decision, Risks, Rollout, Rollback. אם אין ב-doc Non-goals ואין Rollback — הוא לא מוכן."
  },
  pitfalls: [
    { en: "Writing the doc after the decision is made (a 'design doc' that is really a justification). Reviewers smell it, and you lose the main value: finding the flaw while it's cheap.", he: "לכתוב את ה-doc אחרי שההחלטה כבר התקבלה (design doc שהוא בעצם הצדקה). ה-reviewers מריחים את זה, ואתה מפסיד את הערך העיקרי: למצוא את הפגם כשזה עוד זול." },
    { en: "Strawman options — listing two obviously bad alternatives next to your favourite. Real options with honest trade-offs build trust; fake ones destroy it.", he: "אופציות קש — לשים שתי חלופות גרועות בעליל ליד האופציה האהובה עליך. אופציות אמיתיות עם trade-offs כנים בונות אמון; מזויפות הורסות אותו." },
    { en: "Editing an accepted ADR when you change your mind. ADRs are immutable: write ADR-0012 that supersedes ADR-0007, so the history of 'why' stays intact.", he: "לערוך ADR שהתקבל כשמשנים דעה. ADRs הם immutable: כותבים ADR-0012 שמחליף את ADR-0007, כדי שההיסטוריה של ה'למה' תישאר שלמה." },
    { en: "A 25-page doc nobody reads. Put a one-paragraph summary at the top and push details to appendices.", he: "Doc של 25 עמודים שאף אחד לא קורא. שים סיכום של פסקה אחת למעלה ותדחוף פרטים לנספחים." }
  ],
  interview: [
    {
      q: { en: "Tell me how you drive a design decision that spans several teams.", he: "ספר איך אתה מוביל החלטת design שחוצה כמה צוותים." },
      a: { en: "I start with a short problem statement and goals/non-goals and validate it with the affected leads 1:1 before writing the full doc. Then I write options with an honest comparison table, including 'do nothing', and propose one. I pre-wire the veto holders, publish an RFC with named reviewers and a 5-day window, move long threads to a meeting, and have a named approver break ties. The outcome is recorded as an ADR next to the code, dissent included. Example: our RabbitMQ to MSK RFC — the SRE review added a dual-publish phase that saved us during cutover.", he: "אני מתחיל מ-problem statement קצר ו-goals/non-goals, ומוודא אותו אחד על אחד עם ה-leads שמושפעים לפני שאני כותב את ה-doc המלא. אחר כך אני כותב אופציות עם טבלת השוואה כנה, כולל 'לא לעשות כלום', וממליץ על אחת. עושה pre-wire ל-veto holders, מפרסם RFC עם reviewers בשם וחלון של 5 ימים, מעביר threads ארוכים לפגישה, ויש approver עם שם שמכריע. התוצאה נרשמת כ-ADR ליד הקוד, כולל ה-dissent. דוגמה: ה-RFC של RabbitMQ ל-MSK — ה-review של ה-SRE הוסיף שלב dual-publish שהציל אותנו ב-cutover." }
    },
    {
      q: { en: "What's the difference between a design doc and an ADR, and why keep both?", he: "מה ההבדל בין design doc ל-ADR, ולמה צריך את שניהם?" },
      a: { en: "The design doc is the long thinking process — options, debate, rollout. It's living while you design and then goes stale. The ADR is a one-page immutable record of the final decision, its context and consequences, stored in the repo. Five years later nobody reads the 12-page doc, but 'why is it MSK and not self-hosted Kafka?' is answered in 30 seconds by ADR-0007.", he: "ה-design doc הוא תהליך החשיבה הארוך — אופציות, דיון, rollout. הוא חי בזמן התכנון ואחר כך מתיישן. ה-ADR הוא רשומה immutable בעמוד אחד של ההחלטה הסופית, ההקשר וההשלכות, שנשמרת ב-repo. בעוד חמש שנים אף אחד לא יקרא doc של 12 עמודים, אבל על 'למה MSK ולא Kafka self-hosted?' עונה ADR-0007 תוך 30 שניות." }
    }
  ],
  quiz: [
    {
      q: { en: "Which section most directly prevents scope creep during review?", he: "איזה סעיף הכי ישירות מונע scope creep בזמן ה-review?" },
      options: [
        { en: "Context", he: "Context" },
        { en: "Non-goals", he: "Non-goals" },
        { en: "Open questions", he: "Open questions" },
        { en: "Appendix", he: "נספח" }
      ],
      answer: 1,
      explain: { en: "Non-goals state explicitly what you will not do, so reviewers don't pull the project into adjacent problems ('while you're at it, also do multi-region').", he: "ה-Non-goals אומרים במפורש מה לא תעשה, כך ש-reviewers לא מושכים את הפרויקט לבעיות סמוכות ('כבר שאתם שם, תעשו גם multi-region')." }
    },
    {
      q: { en: "You changed your mind about an accepted decision. What do you do with ADR-0007?", he: "שינית דעה לגבי החלטה שהתקבלה. מה עושים עם ADR-0007?" },
      options: [
        { en: "Edit it in place with the new decision", he: "עורכים אותו עם ההחלטה החדשה" },
        { en: "Delete it from the repo", he: "מוחקים אותו מה-repo" },
        { en: "Write a new ADR that supersedes it and mark 0007 as Superseded", he: "כותבים ADR חדש שמחליף אותו ומסמנים את 0007 כ-Superseded" },
        { en: "Nothing, Slack is enough", he: "כלום, Slack מספיק" }
      ],
      answer: 2,
      explain: { en: "ADRs are append-only. The old record explains why the original decision made sense at the time; the new one explains what changed.", he: "ADRs הם append-only. הרשומה הישנה מסבירה למה ההחלטה המקורית הייתה הגיונית אז; החדשה מסבירה מה השתנה." }
    },
    {
      q: { en: "A comment thread on your RFC hits 14 replies between two senior engineers. Best move?", he: "Thread הערות על ה-RFC שלך הגיע ל-14 תגובות בין שני מהנדסים בכירים. מה הכי נכון?" },
      options: [
        { en: "Wait until they get tired", he: "לחכות שיתעייפו" },
        { en: "Resolve the thread silently", he: "לסגור את ה-thread בשקט" },
        { en: "Schedule a 30-minute discussion, then record the outcome in the doc", he: "לקבוע דיון של 30 דקות ואז לרשום את התוצאה ב-doc" },
        { en: "Escalate to the VP immediately", he: "להסלים מיד ל-VP" }
      ],
      answer: 2,
      explain: { en: "Long async threads rarely converge. A short synchronous conversation resolves it faster, and writing the outcome back keeps the doc the source of truth.", he: "Threads אסינכרוניים ארוכים כמעט אף פעם לא מתכנסים. שיחה קצרה סינכרונית פותרת מהר יותר, וכתיבת התוצאה בחזרה שומרת על ה-doc כ-source of truth." }
    },
    {
      q: { en: "What makes a rollout plan incomplete?", he: "מה הופך rollout plan ללא שלם?" },
      options: [
        { en: "It has more than three phases", he: "יש בו יותר משלושה שלבים" },
        { en: "It has no rollback path and no point after which rollback becomes expensive", he: "אין בו מסלול rollback ואין נקודה שאחריה rollback נהיה יקר" },
        { en: "It mentions feature flags", he: "הוא מזכיר feature flags" },
        { en: "It names the first team to migrate", he: "הוא מציין איזה צוות עובר ראשון" }
      ],
      answer: 1,
      explain: { en: "Every phase needs an undo, and the doc should say when the door closes (e.g. after decommissioning RabbitMQ). Without that, you are betting rather than planning.", he: "לכל שלב צריך undo, וה-doc צריך להגיד מתי הדלת נסגרת (למשל אחרי decommission של RabbitMQ). בלי זה אתה מהמר, לא מתכנן." }
    }
  ],
  related: ["staff-tech-strategy", "staff-influence", "arch-brokers", "rel-deployments"]
});

// ---------------------------------------------------------------------------
// 21. Technical strategy: build vs buy, TCO, one-way doors
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-tech-strategy",
  track: "staff",
  order: 21,
  icon: "🧭",
  level: 3,
  minutes: 15,
  title: {
    en: "Technical Strategy: Build vs Buy, TCO & One-Way Doors",
    he: "אסטרטגיה טכנית: Build vs Buy, TCO ו-One-Way Doors"
  },
  tldr: {
    en: "Strategy is choosing what not to do: compare total cost of ownership (people, on-call, upgrades — not just the invoice), buy what isn't your differentiator, keep a tech radar so choices are deliberate, move fast on two-way doors and slow down only on one-way doors.",
    he: "אסטרטגיה זה לבחור מה לא לעשות: משווים total cost of ownership (אנשים, on-call, שדרוגים — לא רק החשבונית), קונים את מה שלא מבדל אותך, מחזיקים tech radar כדי שהבחירות יהיו מכוונות, זזים מהר על two-way doors ומאטים רק על one-way doors."
  },
  analogy: {
    en: "Do you buy a car or build one in your garage? Building looks cheaper if you only count the steel. Then you add your weekends, the tools, the mechanic you have to become, and the night it breaks down on the highway with nobody to call. Unless you are a racing team whose whole edge is the engine, you buy the car and spend your weekends on what makes you special.",
    he: "קונים רכב או בונים אחד במוסך? לבנות נראה זול יותר אם סופרים רק את הפלדה. ואז מוסיפים את סופי השבוע שלך, הכלים, המכונאי שתצטרך להפוך להיות, והלילה שהוא נתקע באיילון ואין למי להתקשר. אלא אם כן אתה צוות מרוצים שכל היתרון שלו זה המנוע — קונים את הרכב ומשקיעים את סופי השבוע במה שעושה אותך מיוחד."
  },
  sections: [
    {
      h: { en: "Total cost of ownership: the invoice is the smallest line", he: "Total cost of ownership: החשבונית היא השורה הכי קטנה" },
      body: {
        en: `<p>The classic trap: "MSK costs $9k/month, three EC2 brokers cost $2.5k — self-host!" Now count everything over 3 years:</p>
<table><tr><th>Cost line (per year)</th><th>Self-hosted Kafka on EC2/K8s</th><th>Amazon MSK / Confluent Cloud</th></tr>
<tr><td>Infrastructure</td><td>$30k (brokers, EBS, cross-AZ traffic)</td><td>$110k</td></tr>
<tr><td>Engineers to run it</td><td>1.5 FTE × $200k = $300k</td><td>0.3 FTE = $60k</td></tr>
<tr><td>On-call burden</td><td>Broker pages, disk full, ISR shrinks — 24/7 rotation of Kafka experts</td><td>Vendor handles brokers; you watch consumer lag</td></tr>
<tr><td>Upgrades / ZooKeeper→KRaft migration</td><td>A quarter-long project</td><td>A maintenance window</td></tr>
<tr><td>Hiring / bus factor</td><td>Need people who know Kafka internals</td><td>Need people who know Kafka clients</td></tr>
<tr><td><strong>3-year TCO (approx.)</strong></td><td><strong>~$1M + risk</strong></td><td><strong>~$510k</strong></td></tr></table>
<p>Self-hosting starts to win at very large scale (hundreds of brokers, where vendor margin is millions/year and you can afford a dedicated team) or when you need something the vendor doesn't support. Also count <strong>opportunity cost</strong>: the 1.5 engineers running Kafka are not building the internal developer platform.</p>
<blockquote>💡 Real world: the honest TCO also includes <em>exit cost</em> — how hard is it to leave? MSK speaks plain Kafka protocol, so exit is moderate. A proprietary queue with its own SDK baked into 200 services is a much bigger lock-in.</blockquote>`,
        he: `<p>המלכודת הקלאסית: "MSK עולה $9k לחודש, שלושה brokers על EC2 עולים $2.5k — עושים self-host!" עכשיו תספור הכל על פני 3 שנים:</p>
<table><tr><th>שורת עלות (לשנה)</th><th>Kafka self-hosted על EC2/K8s</th><th>Amazon MSK / Confluent Cloud</th></tr>
<tr><td>תשתית</td><td>$30k (brokers, EBS, cross-AZ traffic)</td><td>$110k</td></tr>
<tr><td>מהנדסים שמתפעלים</td><td>1.5 FTE × $200k = $300k</td><td>0.3 FTE = $60k</td></tr>
<tr><td>עומס on-call</td><td>פייג'רים על brokers, דיסק מלא, ISR מתכווץ — רוטציה 24/7 של מומחי Kafka</td><td>הספק מטפל ב-brokers; אתה מסתכל על consumer lag</td></tr>
<tr><td>שדרוגים / מעבר מ-ZooKeeper ל-KRaft</td><td>פרויקט של רבעון</td><td>maintenance window</td></tr>
<tr><td>גיוס / bus factor</td><td>צריך אנשים שמכירים Kafka internals</td><td>צריך אנשים שמכירים Kafka clients</td></tr>
<tr><td><strong>TCO ל-3 שנים (בערך)</strong></td><td><strong>~$1M + סיכון</strong></td><td><strong>~$510k</strong></td></tr></table>
<p>Self-hosting מתחיל לנצח בסקייל מאוד גדול (מאות brokers, שם המרווח של הספק הוא מיליונים בשנה ויש לך תקציב לצוות ייעודי) או כשאתה צריך משהו שהספק לא תומך בו. תספור גם <strong>opportunity cost</strong>: ה-1.5 מהנדסים שמתפעלים Kafka לא בונים את ה-internal developer platform.</p>
<blockquote>💡 מהשטח: TCO כן כולל גם <em>exit cost</em> — כמה קשה לעזוב? MSK מדבר Kafka protocol רגיל, אז היציאה בינונית. תור proprietary עם SDK משלו שמוטמע ב-200 שירותים זה lock-in הרבה יותר גדול.</blockquote>`
      }
    },
    {
      h: { en: "Build vs buy: the differentiation test", he: "Build vs buy: מבחן הבידול" },
      body: {
        en: `<p>Ask three questions:</p>
<ol>
<li><strong>Is this our differentiator?</strong> Does a customer pick us because of it? Your payments risk engine — maybe build. Your log pipeline, CI runners, secrets manager, Kafka brokers — almost never.</li>
<li><strong>Is the market mature?</strong> If five vendors and two CNCF-graduated projects solve it, building is reinventing. If nothing fits your scale or constraints, building may be justified.</li>
<li><strong>Can we staff it for 5 years?</strong> Building is a lifetime commitment: security patches, upgrades, docs, on-call, the author leaving.</li>
</ol>
<p>The middle path is usually right: <strong>buy/adopt the engine, build the thin glue</strong>. Example: adopt Backstage + Argo CD + Crossplane, and build only your golden-path templates and the opinionated defaults. Or use managed EKS and build a thin platform layer on top, instead of rolling your own control plane with kubeadm.</p>
<blockquote>⚠️ Production tip: "We'll build it, it's just a small service" is how most companies end up with an unmaintained in-house deploy tool that one person understands. Before building, write down who owns it in year 3.</blockquote>`,
        he: `<p>שואלים שלוש שאלות:</p>
<ol>
<li><strong>זה ה-differentiator שלנו?</strong> לקוח בוחר בנו בגלל זה? מנוע הסיכונים של payments — אולי לבנות. Log pipeline, CI runners, secrets manager, Kafka brokers — כמעט אף פעם.</li>
<li><strong>השוק בשל?</strong> אם חמישה ספקים ושני פרויקטים graduated ב-CNCF פותרים את זה, לבנות זה להמציא את הגלגל. אם שום דבר לא מתאים לסקייל או לאילוצים שלך, אולי מוצדק לבנות.</li>
<li><strong>יש לנו את האנשים לתחזק את זה 5 שנים?</strong> לבנות זו התחייבות לכל החיים: security patches, שדרוגים, דוקומנטציה, on-call, והכותב שעוזב.</li>
</ol>
<p>הדרך האמצעית היא בדרך כלל הנכונה: <strong>קונים/מאמצים את המנוע, בונים glue דק</strong>. דוגמה: מאמצים Backstage + Argo CD + Crossplane, ובונים רק את ה-golden-path templates וה-defaults הדעתניים. או משתמשים ב-EKS מנוהל ובונים שכבת platform דקה מעליו, במקום להרים control plane לבד עם kubeadm.</p>
<blockquote>⚠️ טיפ מהפרודקשן: "נבנה את זה, זה סתם service קטן" — ככה רוב החברות מסיימות עם deploy tool פנימי שאף אחד לא מתחזק ורק בן אדם אחד מבין. לפני שבונים, תכתוב מי הבעלים שלו בשנה 3.</blockquote>`
      }
    },
    {
      h: { en: "One-way vs two-way doors", he: "One-way doors מול two-way doors" },
      body: {
        en: `<p>Coined in Amazon's shareholder letters: most decisions are <strong>two-way doors</strong> — cheap to reverse. Make them fast, by one person or a small team, with a short ADR. A few are <strong>one-way doors</strong> — expensive or impossible to undo. Slow down for those: full design doc, broad review, prototype, maybe a bake-off.</p>
<table><tr><th>Two-way door (move fast)</th><th>One-way door (slow down)</th></tr>
<tr><td>Which Helm chart for an internal tool</td><td>Primary database engine for the core product</td></tr>
<tr><td>Grafana dashboard layout</td><td>Public API shape that customers integrate against</td></tr>
<tr><td>Karpenter vs Cluster Autoscaler on one cluster</td><td>Multi-year committed-use / Savings Plan of $2M</td></tr>
<tr><td>Trying OpenTelemetry Collector in staging</td><td>Event schema/partition key that 60 consumers will depend on</td></tr>
<tr><td>Alert thresholds</td><td>Deleting the old data after a migration</td></tr></table>
<p>A key Staff skill is <strong>turning one-way doors into two-way doors</strong>: put an abstraction in front of the vendor, dual-write before you cut over, keep the old system read-only for 30 days before deletion, sign a 1-year instead of a 3-year commit for the first round.</p>`,
        he: `<p>המונח מגיע ממכתבי בעלי המניות של Amazon: רוב ההחלטות הן <strong>two-way doors</strong> — זול להחזיר אותן אחורה. מקבלים אותן מהר, אדם אחד או צוות קטן, עם ADR קצר. מעטות הן <strong>one-way doors</strong> — יקר או בלתי אפשרי לבטל אותן. עליהן מאטים: design doc מלא, review רחב, prototype, אולי bake-off.</p>
<table><tr><th>Two-way door (זזים מהר)</th><th>One-way door (מאטים)</th></tr>
<tr><td>איזה Helm chart לכלי פנימי</td><td>ה-database engine הראשי של מוצר הליבה</td></tr>
<tr><td>Layout של דשבורד ב-Grafana</td><td>מבנה ה-API הציבורי שלקוחות מתממשקים אליו</td></tr>
<tr><td>Karpenter מול Cluster Autoscaler על cluster אחד</td><td>Committed-use / Savings Plan רב-שנתי של $2M</td></tr>
<tr><td>לנסות OpenTelemetry Collector ב-staging</td><td>Event schema/partition key ש-60 consumers יהיו תלויים בו</td></tr>
<tr><td>ספי alerts</td><td>למחוק את הדאטה הישן אחרי מיגרציה</td></tr></table>
<p>מיומנות Staff מרכזית היא <strong>להפוך one-way doors ל-two-way doors</strong>: לשים abstraction מול הספק, לעשות dual-write לפני cutover, להשאיר את המערכת הישנה read-only ל-30 יום לפני מחיקה, לחתום על commit של שנה במקום שלוש בסבב הראשון.</p>`
      }
    },
    {
      h: { en: "Tech radar and the art of saying no", he: "Tech radar והאומנות של להגיד לא" },
      body: {
        en: `<p>A <strong>tech radar</strong> (popularised by Thoughtworks) puts every technology in one of four rings, per quadrant (languages, platforms, tools, techniques):</p>
<ul>
<li><strong>Adopt</strong> — the default; paved road, supported by the platform team (e.g. Go, PostgreSQL on RDS, Kafka/MSK, Argo CD).</li>
<li><strong>Trial</strong> — approved for real projects with an owner, being evaluated (e.g. Karpenter on two clusters).</li>
<li><strong>Assess</strong> — worth exploring in a spike, not in production yet.</li>
<li><strong>Hold</strong> — don't start new things with it (e.g. self-hosted RabbitMQ, Jenkins freestyle jobs).</li>
</ul>
<p>The radar makes "no" impersonal and cheap: "MongoDB for this new service? It's on Hold — use Postgres JSONB, or write a one-page exception request". Strategy is mostly saying no: every new technology adds on-call knowledge, security patching, and hiring constraints <em>forever</em>. A healthy org has a small number of boring, well-supported choices.</p>
<p>How to say no well: say what you're saying yes to ("we're investing in making Postgres excellent"), offer a path ("trial it in one service with an owner and an exit plan"), and revisit on a schedule (radar refresh every 6 months).</p>`,
        he: `<p><strong>Tech radar</strong> (ש-Thoughtworks הפכו לפופולרי) שם כל טכנולוגיה באחת מארבע טבעות, לכל רביע (languages, platforms, tools, techniques):</p>
<ul>
<li><strong>Adopt</strong> — ה-default; paved road, נתמך ע"י צוות ה-platform (למשל Go, PostgreSQL על RDS, Kafka/MSK, Argo CD).</li>
<li><strong>Trial</strong> — מאושר לפרויקטים אמיתיים עם owner, בהערכה (למשל Karpenter על שני clusters).</li>
<li><strong>Assess</strong> — שווה לבדוק ב-spike, עוד לא בפרודקשן.</li>
<li><strong>Hold</strong> — לא מתחילים איתו דברים חדשים (למשל RabbitMQ self-hosted, Jenkins freestyle jobs).</li>
</ul>
<p>הרדאר הופך את ה"לא" ללא-אישי וזול: "MongoDB לשירות החדש? הוא ב-Hold — תשתמש ב-Postgres JSONB, או תכתוב בקשת חריגה של עמוד אחד". אסטרטגיה זה בעיקר להגיד לא: כל טכנולוגיה חדשה מוסיפה ידע on-call, security patching ואילוצי גיוס — <em>לתמיד</em>. בארגון בריא יש מספר קטן של בחירות משעממות ונתמכות היטב.</p>
<p>איך להגיד לא טוב: תגיד למה אתה אומר כן ("אנחנו משקיעים בלהפוך את Postgres למצוין"), תציע מסלול ("תעשו trial בשירות אחד עם owner ו-exit plan"), ותחזור לזה לפי לוח זמנים (רענון רדאר כל 6 חודשים).</p>`
      }
    }
  ],
  diagram: "                 differentiator?\n                 /            \\\n               yes             no\n               |               |\n      mature market?       BUY / managed (MSK, RDS, EKS)\n        /       \\              + build thin glue\n      yes        no\n      |          |\n  adopt+extend   BUILD (with a 5-year owner)",
  handsOn: [
    { cmd: "aws kafka list-clusters-v2 --query 'ClusterInfoList[].{name:ClusterName,type:ClusterType,state:State}'", what: { en: "Inventory managed Kafka clusters before a build-vs-buy review — you can't compute TCO for things you haven't counted.", he: "מלאי של ה-Kafka clusters המנוהלים לפני review של build-vs-buy — אי אפשר לחשב TCO על דברים שלא ספרת." } },
    { cmd: "gh search code \"amqp://\" --owner my-org --limit 200 | cut -d: -f1 | sort -u | wc -l", what: { en: "Measure blast radius of a 'Hold' technology: how many repos still connect to RabbitMQ? This number goes into the strategy doc.", he: "מודדים blast radius של טכנולוגיה ב-Hold: כמה repos עדיין מתחברים ל-RabbitMQ? המספר הזה נכנס ל-strategy doc." } },
    { cmd: "cp docs/templates/tech-radar-entry.md docs/radar/2026-h1/karpenter-trial.md", what: { en: "Propose a radar move (Assess → Trial) with owner, success criteria and exit plan, reviewed as a PR by the architecture group.", he: "מציעים תזוזה ברדאר (Assess ל-Trial) עם owner, קריטריוני הצלחה ו-exit plan, שעוברת review כ-PR בקבוצת הארכיטקטורה." } }
  ],
  mnemonic: {
    en: "\"Buy the commodity, build the edge, and only slow down at one-way doors.\"",
    he: "\"קונים את ה-commodity, בונים את היתרון, ומאטים רק מול one-way doors.\""
  },
  pitfalls: [
    { en: "Comparing only infrastructure invoices. People, on-call and upgrades usually dominate TCO — 1 FTE costs more than most managed services.", he: "להשוות רק חשבוניות תשתית. אנשים, on-call ושדרוגים בדרך כלל שולטים ב-TCO — FTE אחד עולה יותר מרוב השירותים המנוהלים." },
    { en: "Treating every decision as a one-way door. Six weeks of debate over a dashboard tool is a failure of judgment; the slowness itself is a cost.", he: "להתייחס לכל החלטה כ-one-way door. שישה שבועות דיון על כלי דשבורדים זה כישלון שיקול דעת; האיטיות עצמה היא עלות." },
    { en: "Résumé-driven development — adopting a shiny technology because engineers want to learn it. Route that energy to Assess/Trial with an owner, not straight to production.", he: "Résumé-driven development — לאמץ טכנולוגיה נוצצת כי מהנדסים רוצים ללמוד אותה. תנתב את האנרגיה הזאת ל-Assess/Trial עם owner, לא ישר לפרודקשן." },
    { en: "A strategy doc that is a list of wishes. Real strategy names the trade-off: what you will stop doing to fund what you start.", he: "Strategy doc שהוא רשימת משאלות. אסטרטגיה אמיתית מציינת את ה-trade-off: מה תפסיקו לעשות כדי לממן את מה שמתחילים." }
  ],
  interview: [
    {
      q: { en: "Would you run Kafka yourself or use MSK/Confluent? Walk me through it.", he: "היית מריץ Kafka בעצמך או משתמש ב-MSK/Confluent? תסביר איך אתה חושב." },
      a: { en: "It depends on scale, team and differentiation, so I'd compute 3-year TCO: infra, the FTEs to run and upgrade it, on-call load, hiring, and exit cost. For most companies under ~50 brokers, managed wins because people dominate cost and Kafka brokers are not the differentiator. I'd self-host only at large scale with a dedicated streaming team, or for a hard requirement the vendor lacks. Either way I'd keep clients on the plain Kafka protocol to keep the door two-way.", he: "זה תלוי בסקייל, בצוות ובבידול, אז הייתי מחשב TCO ל-3 שנים: תשתית, ה-FTEs שמתפעלים ומשדרגים, עומס on-call, גיוס ו-exit cost. לרוב החברות מתחת ל-~50 brokers, managed מנצח כי אנשים הם רוב העלות ו-Kafka brokers זה לא ה-differentiator. הייתי עושה self-host רק בסקייל גדול עם צוות streaming ייעודי, או בגלל דרישה קשיחה שאין אצל הספק. בכל מקרה הייתי משאיר את ה-clients על Kafka protocol רגיל כדי שהדלת תישאר two-way." }
    },
    {
      q: { en: "A team wants to introduce a new database into the stack. How do you respond?", he: "צוות רוצה להכניס database חדש ל-stack. איך אתה מגיב?" },
      a: { en: "I ask what problem the existing 'Adopt' options fail to solve, with data. If there's a real gap, I propose a Trial: one service, a named owner, backup/restore and on-call plan, success criteria, and an exit plan, reviewed in 6 months. If there isn't, I say no clearly and help them make the paved road work — often Postgres with the right index or partitioning covers it.", he: "אני שואל איזו בעיה אופציות ה-Adopt הקיימות לא פותרות, עם דאטה. אם יש פער אמיתי, אני מציע Trial: שירות אחד, owner עם שם, תוכנית backup/restore ו-on-call, קריטריוני הצלחה ו-exit plan, עם בדיקה חוזרת בעוד 6 חודשים. אם אין, אני אומר לא בצורה ברורה ועוזר להם לגרום ל-paved road לעבוד — הרבה פעמים Postgres עם האינדקס או ה-partitioning הנכון מכסה את זה." }
    }
  ],
  quiz: [
    {
      q: { en: "Which item usually dominates the TCO of self-hosting Kafka at mid scale?", he: "איזה רכיב בדרך כלל שולט ב-TCO של Kafka self-hosted בסקייל בינוני?" },
      options: [
        { en: "EC2 instance cost", he: "עלות ה-EC2 instances" },
        { en: "Engineering time: operations, upgrades, on-call", he: "זמן הנדסי: תפעול, שדרוגים, on-call" },
        { en: "Software licence", he: "רישיון תוכנה" },
        { en: "DNS queries", he: "שאילתות DNS" }
      ],
      answer: 1,
      explain: { en: "A single FTE costs more per year than most mid-size managed clusters. People are the hidden majority of TCO.", he: "FTE אחד עולה בשנה יותר מרוב ה-clusters המנוהלים בגודל בינוני. אנשים הם הרוב הנסתר של ה-TCO." }
    },
    {
      q: { en: "Which is a one-way door?", he: "מה מהבאים הוא one-way door?" },
      options: [
        { en: "Changing an alert threshold", he: "לשנות סף של alert" },
        { en: "Trying a new Helm chart in staging", he: "לנסות Helm chart חדש ב-staging" },
        { en: "Choosing the partition key for an event stream 60 consumers will depend on", he: "לבחור partition key ל-event stream ש-60 consumers יהיו תלויים בו" },
        { en: "Reorganising a Grafana folder", he: "לסדר מחדש תיקייה ב-Grafana" }
      ],
      answer: 2,
      explain: { en: "Once dozens of consumers rely on a key's ordering semantics, changing it means a coordinated migration — expensive and slow to reverse.", he: "ברגע שעשרות consumers מסתמכים על סמנטיקת ה-ordering של ה-key, לשנות אותו זו מיגרציה מתואמת — יקר ואיטי להחזיר." }
    },
    {
      q: { en: "On a tech radar, a technology in 'Hold' means:", he: "בטכנולוגיה שנמצאת ב-'Hold' ב-tech radar, המשמעות היא:" },
      options: [
        { en: "Rip it out of production this week", he: "לעקור אותה מפרודקשן השבוע" },
        { en: "Don't start new work with it; existing usage migrates over time", he: "לא מתחילים איתה עבודה חדשה; שימוש קיים עובר בהדרגה" },
        { en: "It's under evaluation", he: "היא בהערכה" },
        { en: "It's the default choice", he: "זו בחירת ה-default" }
      ],
      answer: 1,
      explain: { en: "Hold stops the bleeding (no new adoption) without forcing a big-bang removal. Evaluation is Assess/Trial; default is Adopt.", he: "Hold עוצר את הדימום (אין אימוץ חדש) בלי לכפות הסרה ב-big bang. הערכה זה Assess/Trial; default זה Adopt." }
    }
  ],
  related: ["staff-design-docs", "cloud-finops", "arch-brokers", "staff-migrations-at-scale"]
});

// ---------------------------------------------------------------------------
// 22. Production readiness, toil and on-call health
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-production-readiness",
  track: "staff",
  order: 22,
  icon: "✅",
  level: 3,
  minutes: 15,
  title: {
    en: "Production Readiness, Toil & On-Call Health",
    he: "Production Readiness, Toil ובריאות ה-On-Call"
  },
  tldr: {
    en: "A Production Readiness Review (PRR) is the gate where a service proves it can be operated — SLOs, alerts, runbooks, capacity, rollback, dependencies — and after launch you keep it healthy by capping toil at 50%, measuring pages per shift, and rehearsing failure in game days.",
    he: "Production Readiness Review (PRR) זה השער שבו שירות מוכיח שאפשר לתפעל אותו — SLOs, alerts, runbooks, capacity, rollback, תלויות — ואחרי ה-launch שומרים עליו בריא: toil מוגבל ל-50%, מודדים pages per shift, ומתרגלים כשלים ב-game days."
  },
  analogy: {
    en: "Before a plane takes off, the pilots run a checklist — not because they're bad pilots, but because great pilots forget things under pressure. A PRR is the pre-flight checklist for a service. On-call health metrics are the pilots' duty-hour rules: an exhausted crew will eventually crash a perfectly good plane.",
    he: "לפני שמטוס ממריא, הטייסים עוברים על צ'קליסט — לא כי הם טייסים גרועים, אלא כי גם טייסים מעולים שוכחים דברים תחת לחץ. PRR הוא הצ'קליסט לפני הטיסה של שירות. מדדי בריאות ה-on-call הם חוקי שעות הטיסה של הצוות: צוות מותש יפיל בסוף גם מטוס תקין לגמרי."
  },
  sections: [
    {
      h: { en: "The PRR checklist", he: "הצ'קליסט של PRR" },
      body: {
        en: `<p>Google SRE popularised the PRR as the condition for SRE taking over the pager. Most companies use it as a launch gate for any tier-1 service. A practical checklist:</p>
<table><tr><th>Area</th><th>Must have before launch</th></tr>
<tr><td>SLOs</td><td>Defined SLIs (availability, latency) with SLO targets and an error-budget policy</td></tr>
<tr><td>Alerting</td><td>Burn-rate alerts on SLOs, routed to a real rotation; no alert without a runbook link</td></tr>
<tr><td>Observability</td><td>Golden-signal dashboard, structured logs, traces with request IDs</td></tr>
<tr><td>Capacity</td><td>Load test at 2× expected peak; HPA/limits set; known bottleneck documented</td></tr>
<tr><td>Deploy &amp; rollback</td><td>Automated CI/CD, canary or progressive rollout, rollback tested in the last 30 days</td></tr>
<tr><td>Dependencies</td><td>Listed with their SLOs; timeouts, retries with backoff, circuit breakers; graceful degradation</td></tr>
<tr><td>Data</td><td>Backups with a <em>tested</em> restore, RPO/RTO stated, migrations reversible</td></tr>
<tr><td>Security</td><td>Least-privilege IAM, secrets in a manager, image scanning, threat model for public endpoints</td></tr>
<tr><td>Ownership</td><td>Owning team in the service catalog, on-call rotation of ≥ 6 people, escalation path</td></tr></table>
<blockquote>💡 Real world: make the PRR a <em>conversation</em>, not a form. The most valuable question in any PRR is "walk me through what happens when your primary dependency is down for 20 minutes". Teams that haven't thought about it find out in the meeting, not at 3 AM.</blockquote>`,
        he: `<p>Google SRE הפכו את ה-PRR לפופולרי כתנאי לכך ש-SRE לוקחים את הפייג'ר. רוב החברות משתמשות בו כשער launch לכל שירות tier-1. צ'קליסט פרקטי:</p>
<table><tr><th>תחום</th><th>חובה לפני launch</th></tr>
<tr><td>SLOs</td><td>SLIs מוגדרים (availability, latency) עם יעדי SLO ו-error-budget policy</td></tr>
<tr><td>Alerting</td><td>Burn-rate alerts על ה-SLOs, מנותבים לרוטציה אמיתית; אין alert בלי לינק ל-runbook</td></tr>
<tr><td>Observability</td><td>דשבורד golden signals, לוגים מובנים, traces עם request IDs</td></tr>
<tr><td>Capacity</td><td>Load test על פי 2 מה-peak הצפוי; HPA/limits מוגדרים; צוואר הבקבוק הידוע מתועד</td></tr>
<tr><td>Deploy ו-rollback</td><td>CI/CD אוטומטי, canary או progressive rollout, rollback שנבדק ב-30 הימים האחרונים</td></tr>
<tr><td>תלויות</td><td>רשימה עם ה-SLOs שלהן; timeouts, retries עם backoff, circuit breakers; graceful degradation</td></tr>
<tr><td>Data</td><td>Backups עם restore <em>שנבדק</em>, RPO/RTO מוגדרים, migrations הפיכות</td></tr>
<tr><td>Security</td><td>IAM עם least privilege, secrets ב-secret manager, סריקת images, threat model ל-endpoints ציבוריים</td></tr>
<tr><td>Ownership</td><td>צוות בעלים ב-service catalog, רוטציית on-call של 6 אנשים לפחות, מסלול escalation</td></tr></table>
<blockquote>💡 מהשטח: תעשה מה-PRR <em>שיחה</em>, לא טופס. השאלה הכי שווה בכל PRR היא "תעבור איתי מה קורה כשה-dependency הראשי שלכם למטה ל-20 דקות". צוותים שלא חשבו על זה מגלים את זה בפגישה, לא ב-3 בלילה.</blockquote>`
      }
    },
    {
      h: { en: "Toil and the 50% rule", he: "Toil וכלל ה-50%" },
      body: {
        en: `<p><strong>Toil</strong> (Google SRE book definition) is work that is manual, repetitive, automatable, tactical, has no enduring value, and grows linearly with the service. Examples: manually resizing a Kafka topic's retention every week, approving the same IAM request, restarting a stuck consumer, rotating certificates by hand.</p>
<p>The rule: <strong>an SRE/platform team should spend at most 50% of its time on toil and ops work</strong>; the rest goes to engineering that removes future toil. Above 50%, the team is a ticket-processing department and the load grows with every new service until people burn out.</p>
<p>How to make it real:</p>
<ul>
<li>Measure it: tag tickets/interrupts as toil, or run a 2-week time survey every quarter.</li>
<li>Rank toil by <code>frequency × minutes × people</code> — automate the top 3 each quarter.</li>
<li>When toil &gt; 50%, the policy kicks in: push work back to service owners, pause onboarding new services, or get headcount — written down in advance, like an error-budget policy.</li>
</ul>
<blockquote>⚠️ Production tip: not all ops work is toil. Debugging a novel incident or doing a postmortem has enduring value. Toil is the <em>same</em> thing again and again.</blockquote>`,
        he: `<p><strong>Toil</strong> (לפי ההגדרה בספר של Google SRE) הוא עבודה ידנית, חוזרת, שאפשר לאטמט, טקטית, בלי ערך מתמשך, ושגדלה לינארית עם השירות. דוגמאות: לשנות ידנית retention של topic ב-Kafka כל שבוע, לאשר את אותה בקשת IAM, לעשות restart ל-consumer תקוע, לסובב certificates ביד.</p>
<p>הכלל: <strong>צוות SRE/platform צריך להשקיע לכל היותר 50% מהזמן ב-toil ובעבודת ops</strong>; השאר הולך להנדסה שמורידה toil עתידי. מעל 50%, הצוות הופך למחלקת טיפול בטיקטים, והעומס גדל עם כל שירות חדש עד שאנשים נשחקים.</p>
<p>איך הופכים את זה לאמיתי:</p>
<ul>
<li>מודדים: מתייגים טיקטים/הפרעות כ-toil, או מריצים סקר זמנים של שבועיים כל רבעון.</li>
<li>מדרגים toil לפי <code>frequency × minutes × people</code> — מאטמטים את ה-3 העליונים כל רבעון.</li>
<li>כש-toil עובר 50%, ה-policy נכנסת לפעולה: מחזירים עבודה לבעלי השירותים, עוצרים onboarding של שירותים חדשים, או מקבלים headcount — כתוב מראש, כמו error-budget policy.</li>
</ul>
<blockquote>⚠️ טיפ מהפרודקשן: לא כל עבודת ops היא toil. Debug של incident חדש או כתיבת postmortem יש להם ערך מתמשך. Toil זה <em>אותו</em> דבר שוב ושוב.</blockquote>`
      }
    },
    {
      h: { en: "On-call health metrics", he: "מדדי בריאות של on-call" },
      body: {
        en: `<p>You can't fix on-call by asking "how do you feel?". Track numbers per rotation, monthly:</p>
<table><tr><th>Metric</th><th>Healthy target</th><th>Red flag</th></tr>
<tr><td>Pages per 12h shift</td><td>≤ 2 (Google SRE guidance)</td><td>&gt; 5 — nobody can do follow-up work</td></tr>
<tr><td>After-hours pages per week</td><td>0-1</td><td>Several nights a week woken up</td></tr>
<tr><td>Actionable pages %</td><td>&gt; 90%</td><td>&lt; 50% — noise trains people to ignore pages</td></tr>
<tr><td>Time to acknowledge (p50)</td><td>&lt; 5 min</td><td>Rising — fatigue signal</td></tr>
<tr><td>Rotation size</td><td>6-8 people (a week on every 6-8 weeks)</td><td>3 people — on-call every third week</td></tr>
<tr><td>Repeat pages (same alert)</td><td>Rare</td><td>Same alert fires weekly with no fix</td></tr></table>
<p>Run a monthly <strong>on-call review</strong>: every page listed, each tagged actionable / noise / duplicate, and each noisy alert gets an owner to tune or delete. Compensate after-hours pages (time off or pay) — it's both fair and a forcing function for management to care.</p>`,
        he: `<p>אי אפשר לתקן on-call עם "איך אתם מרגישים?". עוקבים אחרי מספרים לכל רוטציה, כל חודש:</p>
<table><tr><th>מדד</th><th>יעד בריא</th><th>דגל אדום</th></tr>
<tr><td>Pages per 12h shift</td><td>עד 2 (ההנחיה של Google SRE)</td><td>מעל 5 — אף אחד לא מספיק follow-up</td></tr>
<tr><td>Pages מחוץ לשעות העבודה בשבוע</td><td>0-1</td><td>מתעוררים כמה לילות בשבוע</td></tr>
<tr><td>% pages שדורשים פעולה (actionable)</td><td>מעל 90%</td><td>מתחת ל-50% — רעש מלמד אנשים להתעלם מפייג'רים</td></tr>
<tr><td>Time to acknowledge (p50)</td><td>מתחת ל-5 דקות</td><td>עולה — סימן לעייפות</td></tr>
<tr><td>גודל רוטציה</td><td>6-8 אנשים (שבוע on-call כל 6-8 שבועות)</td><td>3 אנשים — on-call כל שבוע שלישי</td></tr>
<tr><td>Pages חוזרים (אותו alert)</td><td>נדיר</td><td>אותו alert קופץ כל שבוע בלי תיקון</td></tr></table>
<p>מריצים <strong>on-call review</strong> חודשי: כל page ברשימה, כל אחד מתויג actionable / noise / duplicate, ולכל alert רועש יש owner שמכוונן או מוחק אותו. מפצים על pages מחוץ לשעות (זמן חופש או כסף) — זה גם הוגן וגם forcing function שגורם להנהלה לשים לב.</p>`
      }
    },
    {
      h: { en: "Runbooks, game days and operational maturity", he: "Runbooks, game days ו-operational maturity" },
      body: {
        en: `<p>A good <strong>runbook</strong> is linked from the alert, starts with "what this alert means and the user impact", then gives copy-pasteable diagnosis commands, mitigation steps (the safe first move: roll back, fail over, scale out), and when to escalate. Test it: a new team member should be able to follow it at 3 AM.</p>
<p><strong>Game days</strong> rehearse failure on purpose: kill a Kafka broker in staging (then production, carefully), block a dependency with a NetworkPolicy, fail over the database. Measure time to detect and time to mitigate, and fix what broke — usually alerts that didn't fire and runbooks that were wrong.</p>
<p>A simple <strong>operational maturity</strong> ladder to track across services:</p>
<ol>
<li><strong>Ad hoc</strong> — no SLOs, the author is the on-call, deploys by hand.</li>
<li><strong>Repeatable</strong> — CI/CD, basic alerts, a rotation exists.</li>
<li><strong>Defined</strong> — SLOs + burn-rate alerts, runbooks, PRR passed.</li>
<li><strong>Measured</strong> — on-call metrics reviewed monthly, toil tracked, postmortem actions closed.</li>
<li><strong>Optimised</strong> — regular game days, automated remediation, error budgets drive roadmap.</li>
</ol>
<p>As a Staff engineer, publish this as a scorecard per service (Backstage scorecards, Cortex, OpsLevel, or a spreadsheet) — visible levels move teams more than mandates.</p>`,
        he: `<p><strong>Runbook</strong> טוב מקושר מה-alert, מתחיל ב"מה ה-alert הזה אומר ומה ה-impact על המשתמשים", ואחר כך נותן פקודות אבחון שאפשר להעתיק, צעדי mitigation (הצעד הראשון הבטוח: rollback, failover, scale out), ומתי להסלים. תבדוק אותו: חבר צוות חדש צריך להצליח לעקוב אחריו ב-3 בלילה.</p>
<p><strong>Game days</strong> מתרגלים כשל בכוונה: להרוג Kafka broker ב-staging (ואחר כך בפרודקשן, בזהירות), לחסום dependency עם NetworkPolicy, לעשות failover ל-database. מודדים time to detect ו-time to mitigate, ומתקנים מה שנשבר — בדרך כלל alerts שלא קפצו ו-runbooks שהיו שגויים.</p>
<p>סולם <strong>operational maturity</strong> פשוט לעקוב אחריו על פני השירותים:</p>
<ol>
<li><strong>Ad hoc</strong> — אין SLOs, הכותב הוא ה-on-call, deploy ביד.</li>
<li><strong>Repeatable</strong> — CI/CD, alerts בסיסיים, יש רוטציה.</li>
<li><strong>Defined</strong> — SLOs + burn-rate alerts, runbooks, עבר PRR.</li>
<li><strong>Measured</strong> — מדדי on-call נבדקים כל חודש, toil נמדד, action items מ-postmortems נסגרים.</li>
<li><strong>Optimised</strong> — game days קבועים, remediation אוטומטי, error budgets מכתיבים את ה-roadmap.</li>
</ol>
<p>כ-Staff engineer, תפרסם את זה כ-scorecard לכל שירות (Backstage scorecards, Cortex, OpsLevel, או גיליון) — רמות שכולם רואים מזיזות צוותים יותר מהוראות מלמעלה.</p>`
      }
    }
  ],
  diagram: "design doc -> build -> PRR gate (SLOs, alerts+runbooks, load test, rollback, deps, backups, owner)\n                        |  pass\n                        v\n                    launch -> monthly on-call review (pages/shift, actionable %, toil %)\n                        ^                                   |\n                        +-------- game days / fixes <-------+",
  handsOn: [
    { cmd: "kubectl get prometheusrules -A -o json | jq -r '.items[].spec.groups[].rules[] | select(.alert) | select(.annotations.runbook_url == null) | .alert'", what: { en: "PRR check: find every alert that has no runbook_url annotation. Each one is a 3 AM page with no instructions.", he: "בדיקת PRR: מוצאים כל alert שאין לו annotation של runbook_url. כל אחד כזה הוא page של 3 בלילה בלי הוראות." } },
    { cmd: "pd incident list --since=2026-10-01 --until=2026-11-01 --service-ids=PXXXXX --json | jq 'length'", what: { en: "Pull last month's incident/page count for a service (PagerDuty CLI) to compute pages per shift for the on-call review.", he: "מושכים את מספר ה-incidents/pages של החודש שעבר לשירות (PagerDuty CLI) כדי לחשב pages per shift ל-on-call review." } },
    { cmd: "cp docs/templates/prr-checklist.md services/checkout/PRR.md && gh pr create --title \"PRR: checkout v2\" --reviewer sre-leads", what: { en: "Run the PRR as a reviewed PR: the team fills the checklist, SRE leads comment, merge = launch approval.", he: "מריצים את ה-PRR כ-PR עם review: הצוות ממלא את הצ'קליסט, ה-SRE leads מעירים, merge = אישור launch." } },
    { cmd: "kubectl -n kafka delete pod kafka-broker-1 --wait=false   # game day, staging first", what: { en: "Simplest game day: kill one broker and watch — did under-replicated-partitions alert fire? Did producers retry cleanly? Did the runbook match reality?", he: "ה-game day הכי פשוט: להרוג broker אחד ולצפות — האם קפץ alert על under-replicated partitions? האם ה-producers עשו retry נקי? האם ה-runbook תאם את המציאות?" } }
  ],
  mnemonic: {
    en: "\"Checklist before launch, ≤2 pages per shift, ≤50% toil, and break it on purpose before it breaks on its own.\"",
    he: "\"צ'קליסט לפני launch, עד 2 pages למשמרת, עד 50% toil, ותשבור את זה בכוונה לפני שזה יישבר לבד.\""
  },
  pitfalls: [
    { en: "Turning the PRR into a 120-question bureaucratic form. Teams game it or avoid it. Keep 10-15 high-signal items and make the review a conversation.", he: "להפוך את ה-PRR לטופס בירוקרטי של 120 שאלות. צוותים יעקפו או ישחקו אותו. תשאיר 10-15 סעיפים עם signal גבוה ותעשה מה-review שיחה." },
    { en: "Measuring only MTTR and ignoring on-call load. A team can have great MTTR while being woken up four nights a week — and then quit.", he: "למדוד רק MTTR ולהתעלם מעומס ה-on-call. צוות יכול להיות עם MTTR מצוין ובמקביל להתעורר ארבעה לילות בשבוע — ואז להתפטר." },
    { en: "Writing runbooks once and never testing them. Commands rot with every refactor; game days are how you find out.", he: "לכתוב runbooks פעם אחת ולא לבדוק אותם אף פעם. פקודות נרקבות עם כל refactor; game days זו הדרך לגלות." }
  ],
  interview: [
    {
      q: { en: "What would you put in a production readiness review for a new tier-1 service?", he: "מה היית שם ב-production readiness review לשירות tier-1 חדש?" },
      a: { en: "SLOs with burn-rate alerts that link to runbooks; golden-signal dashboards and tracing; a load test at 2× peak; automated deploy with canary and a recently tested rollback; a dependency list with timeouts, retries and degradation behaviour; backups with a tested restore and stated RPO/RTO; least-privilege IAM and secrets management; and a named owning team with a 6+ person rotation. I'd run it as a conversation centred on failure scenarios, not a form.", he: "SLOs עם burn-rate alerts שמקושרים ל-runbooks; דשבורדים של golden signals ו-tracing; load test על פי 2 מה-peak; deploy אוטומטי עם canary ו-rollback שנבדק לאחרונה; רשימת תלויות עם timeouts, retries והתנהגות degradation; backups עם restore שנבדק ו-RPO/RTO מוגדרים; IAM עם least privilege וניהול secrets; וצוות בעלים עם שם ורוטציה של 6+ אנשים. הייתי מריץ את זה כשיחה סביב תרחישי כשל, לא כטופס." }
    },
    {
      q: { en: "Your platform team says they're drowning. How do you diagnose and fix it?", he: "צוות ה-platform שלך אומר שהם טובעים. איך מאבחנים ומתקנים?" },
      a: { en: "Measure first: a two-week interrupt log tagged by type, plus on-call metrics — pages per shift, after-hours pages, actionable %. If toil is above 50%, rank items by frequency × time and automate the top three (self-service IAM, cert rotation via cert-manager, auto-remediation of stuck consumers). Delete or tune noisy alerts in a monthly review. Then apply a policy: pause onboarding or hand work back to service owners until toil drops — agreed with management in writing.", he: "קודם מודדים: interrupt log של שבועיים מתויג לפי סוג, ועוד מדדי on-call — pages per shift, pages מחוץ לשעות, % actionable. אם toil מעל 50%, מדרגים לפי frequency × time ומאטמטים את ה-3 העליונים (IAM בשירות עצמי, סיבוב certs עם cert-manager, auto-remediation ל-consumers תקועים). מוחקים או מכווננים alerts רועשים ב-review חודשי. ואז מפעילים policy: עוצרים onboarding או מחזירים עבודה לבעלי השירותים עד שה-toil יורד — מוסכם בכתב עם ההנהלה." }
    }
  ],
  quiz: [
    {
      q: { en: "Which of these is toil?", he: "מה מהבאים הוא toil?" },
      options: [
        { en: "Writing a postmortem for a novel outage", he: "לכתוב postmortem ל-outage חדש" },
        { en: "Manually restarting the same stuck consumer every few days", he: "לעשות restart ידני לאותו consumer תקוע כל כמה ימים" },
        { en: "Designing a new autoscaling policy", he: "לתכנן autoscaling policy חדשה" },
        { en: "Running a game day", he: "להריץ game day" }
      ],
      answer: 1,
      explain: { en: "Manual, repetitive, automatable, no lasting value, and it scales with the number of consumers — textbook toil.", he: "ידני, חוזר, ניתן לאוטומציה, בלי ערך מתמשך, וגדל עם מספר ה-consumers — toil קלאסי." }
    },
    {
      q: { en: "A rotation averages 7 pages per 12h shift, 40% actionable. First move?", he: "רוטציה עם ממוצע של 7 pages למשמרת של 12 שעות, 40% actionable. מה הצעד הראשון?" },
      options: [
        { en: "Hire more on-call engineers", he: "לגייס עוד מהנדסי on-call" },
        { en: "Review every alert: delete or tune the noisy 60%, add runbooks to the rest", he: "לעבור על כל alert: למחוק או לכוונן את ה-60% הרועשים, להוסיף runbooks לשאר" },
        { en: "Lower the SLO", he: "להוריד את ה-SLO" },
        { en: "Move the rotation to follow-the-sun", he: "להעביר את הרוטציה ל-follow-the-sun" }
      ],
      answer: 1,
      explain: { en: "Most of the load is noise. Fixing alert quality cuts pages by more than half without adding people.", he: "רוב העומס הוא רעש. תיקון איכות ה-alerts מוריד pages ביותר מחצי בלי להוסיף אנשים." }
    },
    {
      q: { en: "What is the Google SRE cap on time spent on ops/toil?", he: "מה התקרה של Google SRE לזמן על ops/toil?" },
      options: [
        { en: "10%", he: "10%" },
        { en: "25%", he: "25%" },
        { en: "50%", he: "50%" },
        { en: "80%", he: "80%" }
      ],
      answer: 2,
      explain: { en: "At most 50% ops work; the remaining time must go to engineering that reduces future toil.", he: "לכל היותר 50% עבודת ops; שאר הזמן חייב ללכת להנדסה שמקטינה toil עתידי." }
    }
  ],
  related: ["rel-error-budgets", "obs-alerting", "rel-chaos-engineering", "rel-incident-management"]
});

// ---------------------------------------------------------------------------
// 23. Large incidents: command at scale, comms, postmortems that change things
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-large-incidents",
  track: "staff",
  order: 23,
  icon: "🚨",
  level: 3,
  minutes: 16,
  title: {
    en: "Large Incidents: Command at Scale & Postmortems That Change Things",
    he: "Incidents גדולים: פיקוד בסקייל ו-Postmortems שבאמת משנים משהו"
  },
  tldr: {
    en: "In a multi-team outage the bottleneck is coordination, not debugging: declare a SEV early, split roles (IC, ops lead, comms lead, scribe), communicate on a fixed cadence, mitigate before you diagnose, and afterwards run a blameless postmortem whose action items have owners, due dates and someone who chases them.",
    he: "ב-outage שחוצה כמה צוותים צוואר הבקבוק הוא תיאום, לא debug: מכריזים SEV מוקדם, מפצלים תפקידים (IC, ops lead, comms lead, scribe), מתקשרים בקצב קבוע, עושים mitigation לפני אבחון, ואחר כך מריצים blameless postmortem שה-action items שלו עם owner, תאריך יעד ומישהו שרודף אחריהם."
  },
  analogy: {
    en: "A big fire: the incident commander doesn't hold a hose. They stand back, see the whole building, assign crews to floors, tell the press what's happening every 30 minutes, and someone writes everything down. When the IC grabs a hose, nobody is watching the building — and that's when the second floor collapses unnoticed.",
    he: "שריפה גדולה: מפקד האירוע לא מחזיק זרנוק. הוא עומד מאחור, רואה את כל הבניין, משבץ צוותים לקומות, מעדכן את התקשורת כל 30 דקות, ומישהו כותב הכל. כשהמפקד תופס זרנוק, אף אחד לא מסתכל על הבניין — ובדיוק אז הקומה השנייה קורסת בלי שאף אחד שם לב."
  },
  sections: [
    {
      h: { en: "SEV levels: a shared language for 'how bad'", he: "רמות SEV: שפה משותפת ל'כמה זה רע'" },
      body: {
        en: `<p>Define severities in advance, based on <em>user impact</em>, not on how scary the graph looks:</p>
<table><tr><th>SEV</th><th>Definition (example)</th><th>Response</th></tr>
<tr><td>SEV1</td><td>Core flow down for many customers (checkout, login, API &gt; 5% errors), data loss, security breach</td><td>Page IC + all relevant on-calls now, status page within 15 min, exec notified, 24/7 until mitigated</td></tr>
<tr><td>SEV2</td><td>Significant degradation or a major feature down; workaround exists</td><td>Page owning team + IC, status page if customer-visible, business hours escalation</td></tr>
<tr><td>SEV3</td><td>Minor impact, single customer, internal tooling</td><td>Owning team handles during working hours</td></tr>
<tr><td>SEV4</td><td>No impact yet; near miss</td><td>Ticket, maybe a lightweight review</td></tr></table>
<p>Two rules that matter more than the table: <strong>declare early and downgrade later</strong> (a false SEV1 costs an hour of attention; a late SEV1 costs customers), and <strong>anyone can declare</strong> — the junior engineer who sees 30% errors on checkout must not need permission.</p>`,
        he: `<p>מגדירים חומרות מראש, לפי <em>impact על המשתמשים</em>, לא לפי כמה הגרף נראה מפחיד:</p>
<table><tr><th>SEV</th><th>הגדרה (דוגמה)</th><th>תגובה</th></tr>
<tr><td>SEV1</td><td>Flow מרכזי למטה להרבה לקוחות (checkout, login, API מעל 5% שגיאות), איבוד דאטה, פריצת אבטחה</td><td>Page ל-IC ולכל ה-on-calls הרלוונטיים עכשיו, status page תוך 15 דקות, עדכון הנהלה, 24/7 עד mitigation</td></tr>
<tr><td>SEV2</td><td>Degradation משמעותי או פיצ'ר מרכזי למטה; יש workaround</td><td>Page לצוות הבעלים + IC, status page אם הלקוחות רואים, escalation בשעות העבודה</td></tr>
<tr><td>SEV3</td><td>Impact קטן, לקוח בודד, tooling פנימי</td><td>הצוות הבעלים מטפל בשעות העבודה</td></tr>
<tr><td>SEV4</td><td>אין impact עדיין; near miss</td><td>טיקט, אולי review קליל</td></tr></table>
<p>שני כללים שחשובים יותר מהטבלה: <strong>מכריזים מוקדם ומורידים אחר כך</strong> (SEV1 מיותר עולה שעה של תשומת לב; SEV1 מאוחר עולה לקוחות), ו<strong>כל אחד יכול להכריז</strong> — הג'וניור שרואה 30% שגיאות ב-checkout לא צריך לבקש רשות.</p>`
      }
    },
    {
      h: { en: "Roles: IC, ops lead, comms lead, scribe", he: "תפקידים: IC, ops lead, comms lead, scribe" },
      body: {
        en: `<p>Based on the Incident Command System used by firefighters, adapted by Google, PagerDuty and others:</p>
<ul>
<li><strong>Incident Commander (IC)</strong> — owns the incident, not the fix. Sets priorities ("mitigate first: roll back the Kafka client upgrade"), assigns work, decides, keeps the timeline moving. Does <em>not</em> type commands. At Staff level, you are often the IC for cross-team SEV1s.</li>
<li><strong>Operations lead</strong> — coordinates the hands-on responders; with many teams, one ops lead per workstream (e.g. "database", "Kafka", "edge").</li>
<li><strong>Communications lead</strong> — status page, customer support, exec updates, on a fixed cadence (every 30 min for SEV1, even if "no change").</li>
<li><strong>Scribe</strong> — writes the timeline in the incident channel/doc: what was seen, what was tried, decisions and times. This becomes the postmortem's backbone.</li>
<li><strong>Subject-matter experts</strong> — pulled in by the ops lead, released when no longer needed (don't keep 40 people on a bridge).</li>
</ul>
<p>Mechanics at scale: one Slack channel per incident (<code>#inc-2026-11-03-checkout</code>), one video bridge, a pinned "current status" message, explicit handoff when the IC changes ("I am handing IC to @maya at 02:10"), and a shift plan if it runs longer than ~4 hours.</p>
<blockquote>💡 Real world: the most common failure in big incidents is not a wrong hypothesis — it's three teams investigating the same thing while nobody owns the rollback. Explicit assignments ("@dana: roll back payment-gateway. @lior: check MSK broker metrics. Report back in 10 minutes") fix this.</blockquote>`,
        he: `<p>מבוסס על Incident Command System של כבאים, בגרסה ש-Google, PagerDuty ואחרים אימצו:</p>
<ul>
<li><strong>Incident Commander (IC)</strong> — הבעלים של ה-incident, לא של התיקון. קובע עדיפויות ("mitigation קודם: rollback לשדרוג של ה-Kafka client"), משבץ עבודה, מחליט, ומזיז את ה-timeline קדימה. <em>לא</em> מקליד פקודות. ברמת Staff אתה הרבה פעמים ה-IC של SEV1 חוצי-צוותים.</li>
<li><strong>Operations lead</strong> — מתאם את מי שעובד hands-on; כשיש הרבה צוותים, ops lead אחד לכל workstream (למשל "database", "Kafka", "edge").</li>
<li><strong>Communications lead</strong> — status page, customer support, עדכוני הנהלה, בקצב קבוע (כל 30 דקות ב-SEV1, גם אם "אין שינוי").</li>
<li><strong>Scribe</strong> — כותב את ה-timeline בערוץ/doc של ה-incident: מה ראינו, מה ניסינו, החלטות ושעות. זה הופך לשלד של ה-postmortem.</li>
<li><strong>Subject-matter experts</strong> — ה-ops lead מביא אותם ומשחרר כשלא צריך (לא מחזיקים 40 איש על ה-bridge).</li>
</ul>
<p>המכניקה בסקייל: ערוץ Slack אחד ל-incident (<code>#inc-2026-11-03-checkout</code>), bridge וידאו אחד, הודעת "current status" נעוצה, handoff מפורש כשה-IC מתחלף ("אני מעביר IC ל-@maya ב-02:10"), ותוכנית משמרות אם זה נמשך יותר מ-~4 שעות.</p>
<blockquote>💡 מהשטח: הכשל הכי נפוץ ב-incidents גדולים הוא לא השערה שגויה — זה שלושה צוותים שחוקרים את אותו דבר בזמן שאף אחד לא אחראי על ה-rollback. שיבוץ מפורש ("@dana: rollback ל-payment-gateway. @lior: תבדוק metrics של ה-MSK brokers. עדכון בעוד 10 דקות") פותר את זה.</blockquote>`
      }
    },
    {
      h: { en: "Customer and exec communication", he: "תקשורת ללקוחות ולהנהלה" },
      body: {
        en: `<p>Status page updates follow a simple template: <strong>what's affected, since when, what we're doing, when the next update is</strong>. No root-cause speculation, no internal names.</p>
<pre>[Investigating] 14:07 UTC — Some customers are seeing failed payments
in EU checkout. We have identified elevated errors and are working on
mitigation. Next update by 14:40 UTC.

[Monitoring] 14:52 UTC — We rolled back a recent change and payment
success rates have returned to normal. We are monitoring.

[Resolved] 15:30 UTC — From 13:41 to 14:49 UTC, ~8% of EU payments
failed. Affected payments were not charged. A full report will follow.</pre>
<p>Exec updates are BLUF (bottom line up front): impact in business terms (% of orders, $/hour, which customers), current state, ETA confidence, what you need from them (e.g. "approve failover to us-east-1, cost ~$20k"). Execs hate silence more than bad news.</p>`,
        he: `<p>עדכוני status page הולכים לפי תבנית פשוטה: <strong>מה מושפע, ממתי, מה אנחנו עושים, מתי העדכון הבא</strong>. בלי ספקולציות על root cause, בלי שמות פנימיים.</p>
<pre>[Investigating] 14:07 UTC — Some customers are seeing failed payments
in EU checkout. We have identified elevated errors and are working on
mitigation. Next update by 14:40 UTC.

[Monitoring] 14:52 UTC — We rolled back a recent change and payment
success rates have returned to normal. We are monitoring.

[Resolved] 15:30 UTC — From 13:41 to 14:49 UTC, ~8% of EU payments
failed. Affected payments were not charged. A full report will follow.</pre>
<p>עדכוני הנהלה הם BLUF (bottom line up front): impact במונחים עסקיים (% מההזמנות, דולר לשעה, אילו לקוחות), מצב נוכחי, כמה אתה בטוח ב-ETA, ומה אתה צריך מהם (למשל "אשרו failover ל-us-east-1, עלות ~$20k"). הנהלה שונאת שקט יותר מאשר חדשות רעות.</p>`
      }
    },
    {
      h: { en: "Blameless postmortems that actually change things", he: "Blameless postmortems שבאמת משנים משהו" },
      body: {
        en: `<p><strong>Blameless</strong> means: we assume people acted reasonably given what they knew, and ask <em>why the system allowed it</em>. "Dana ran the wrong command" → "Why did a production-wide command have no confirmation and no dry-run? Why did the same CLI target staging and prod by default?" Blame makes people hide information, and hidden information means repeat incidents.</p>
<p>A postmortem that changes things has:</p>
<ul>
<li>A factual <strong>timeline</strong> (from the scribe) with detection, escalation, mitigation times.</li>
<li><strong>Contributing factors</strong>, plural — complex systems rarely have one root cause. Include the "why did detection take 25 minutes?" factor, not only the trigger.</li>
<li><strong>What went well</strong> — so you keep doing it.</li>
<li><strong>Few, strong action items</strong>: 3-7, each with an owner, a due date, a ticket, and a type (prevent / detect / mitigate). Prefer system fixes ("CI blocks deploys during freeze") over "be more careful" or "add training".</li>
</ul>
<p><strong>Follow-through</strong> is where most orgs fail. Staff-level fixes: track postmortem action items in one query/dashboard, review overdue ones in a weekly reliability meeting, report the closure rate to leadership (target: &gt; 80% of P1 items closed within 30 days), and give SEV1 actions priority over feature work by policy.</p>
<p><strong>Learning across the org</strong>: a monthly "incident review" where one interesting postmortem is presented to all of engineering; tag postmortems by contributing factor (config change, dependency, capacity, expired cert) and look for clusters each quarter — "40% of our SEV2s in H1 were config changes without canary" is a strategy input, not just an incident fact.</p>`,
        he: `<p><strong>Blameless</strong> זה: מניחים שאנשים פעלו באופן סביר לפי מה שידעו, ושואלים <em>למה המערכת אפשרה את זה</em>. "דנה הריצה פקודה לא נכונה" הופך ל"למה פקודה שמשפיעה על כל הפרודקשן לא דרשה אישור ולא היה לה dry-run? למה אותו CLI מכוון כברירת מחדל גם ל-staging וגם ל-prod?". האשמה גורמת לאנשים להסתיר מידע, ומידע מוסתר אומר incidents חוזרים.</p>
<p>Postmortem שמשנה משהו כולל:</p>
<ul>
<li><strong>Timeline</strong> עובדתי (מה-scribe) עם זמני detection, escalation ו-mitigation.</li>
<li><strong>Contributing factors</strong>, ברבים — במערכות מורכבות כמעט אף פעם אין root cause אחד. תכלול את הפקטור "למה ה-detection לקח 25 דקות?", לא רק את הטריגר.</li>
<li><strong>מה עבד טוב</strong> — כדי להמשיך לעשות את זה.</li>
<li><strong>מעט action items, חזקים</strong>: 3-7, לכל אחד owner, תאריך יעד, טיקט וסוג (prevent / detect / mitigate). עדיף תיקוני מערכת ("CI חוסם deploys בזמן freeze") על פני "להיות יותר זהירים" או "להוסיף הדרכה".</li>
</ul>
<p><strong>Follow-through</strong> זה המקום שבו רוב הארגונים נכשלים. תיקונים ברמת Staff: לעקוב אחרי action items מ-postmortems בשאילתה/דשבורד אחד, לעבור על אלה שבאיחור בפגישת reliability שבועית, לדווח להנהלה על אחוז הסגירה (יעד: מעל 80% מפריטי P1 נסגרים תוך 30 יום), ולתת ל-actions של SEV1 עדיפות על פני פיצ'רים לפי policy.</p>
<p><strong>ללמוד ברמת הארגון</strong>: "incident review" חודשי שבו postmortem מעניין אחד מוצג לכל ה-engineering; לתייג postmortems לפי contributing factor (שינוי config, dependency, capacity, cert שפג) ולחפש אשכולות כל רבעון — "40% מה-SEV2 שלנו ב-H1 היו שינויי config בלי canary" זה input לאסטרטגיה, לא רק עובדה על incident.</p>`
      }
    }
  ],
  diagram: "detect -> declare SEV (anyone) -> IC assigned\n   IC --+-- ops lead(s) --> SMEs per workstream (DB / Kafka / edge)\n        +-- comms lead --> status page (every 30m) + exec BLUF\n        +-- scribe --> timeline\n mitigate (rollback/failover) -> resolve -> postmortem (blameless)\n   -> 3-7 action items (owner+date) -> weekly follow-up -> monthly org review",
  handsOn: [
    { cmd: "gh issue list --label postmortem-action --state open --search \"created:<2026-10-13\" --json number,title,assignees", what: { en: "Find postmortem action items open for more than 30 days — the list you bring to the weekly reliability review.", he: "מוצאים action items מ-postmortems שפתוחים יותר מ-30 יום — הרשימה שמביאים ל-reliability review השבועי." } },
    { cmd: "cp docs/templates/postmortem.md postmortems/2026-11-03-eu-checkout-sev1.md", what: { en: "Start the postmortem from a standard template (summary, impact, timeline, contributing factors, what went well, action items) within 48 hours while memory is fresh.", he: "מתחילים את ה-postmortem מתבנית סטנדרטית (סיכום, impact, timeline, contributing factors, מה עבד טוב, action items) תוך 48 שעות, כשהזיכרון עוד טרי." } },
    { cmd: "kubectl rollout undo deployment/payment-gateway -n payments && kubectl rollout status deployment/payment-gateway -n payments", what: { en: "The IC's favourite instruction: mitigate first. Roll back the suspect change, confirm it's healthy, and only then dig into root cause.", he: "ההוראה האהובה על ה-IC: mitigation קודם. Rollback לשינוי החשוד, מוודאים שהוא בריא, ורק אז חופרים ב-root cause." } }
  ],
  mnemonic: {
    en: "\"IC commands, doesn't type. Mitigate, then diagnose. Update every 30 minutes. Fix systems, not people. Chase the action items.\"",
    he: "\"ה-IC מפקד, לא מקליד. קודם mitigation, אחר כך אבחון. עדכון כל 30 דקות. מתקנים מערכות, לא אנשים. רודפים אחרי ה-action items.\""
  },
  pitfalls: [
    { en: "The most senior engineer becomes IC and also debugs. Nobody coordinates, comms stop, and parallel work collides. Split the roles even if it feels slower.", he: "המהנדס הכי בכיר הופך ל-IC וגם עושה debug. אף אחד לא מתאם, התקשורת נעצרת, ועבודה מקבילה מתנגשת. מפצלים תפקידים גם אם זה מרגיש איטי יותר." },
    { en: "Hunting root cause while customers are still down. If a rollback or failover is likely to help, do it first; the evidence (logs, heap dumps) can usually be captured in parallel.", he: "לחפש root cause כשהלקוחות עדיין למטה. אם rollback או failover כנראה יעזרו, עושים אותם קודם; את הראיות (לוגים, heap dumps) בדרך כלל אפשר לאסוף במקביל." },
    { en: "Postmortems with 25 action items. None get done. Prioritise to 3-7 high-leverage items and track them like product work.", he: "Postmortems עם 25 action items. אף אחד מהם לא נעשה. מתעדפים ל-3-7 פריטים עם leverage גבוה ועוקבים אחריהם כמו אחרי עבודת מוצר." },
    { en: "'Human error' as the root cause. It ends the investigation exactly where it should start: why did the system make the error easy and its impact large?", he: "'Human error' כ-root cause. זה סוגר את החקירה בדיוק איפה שהיא צריכה להתחיל: למה המערכת הפכה את הטעות לקלה ואת ה-impact לגדול?" }
  ],
  interview: [
    {
      q: { en: "You join a SEV1 bridge with 35 people, three teams debugging in parallel and no status page update for 50 minutes. What do you do?", he: "אתה מצטרף ל-bridge של SEV1 עם 35 איש, שלושה צוותים עושים debug במקביל ואין עדכון status page כבר 50 דקות. מה אתה עושה?" },
      a: { en: "Ask who the IC is; if nobody, take IC explicitly and announce it. Get a 2-minute summary, name a comms lead to update the status page immediately and then every 30 minutes, and a scribe. Split work into workstreams with one ops lead each, release people who aren't needed, and push for the fastest mitigation available (rollback of the last change, failover) while diagnosis continues. Set a 10-minute check-in rhythm.", he: "שואל מי ה-IC; אם אין, לוקח IC במפורש ומכריז על זה. מבקש סיכום של 2 דקות, ממנה comms lead שיעדכן את ה-status page מיד ואחר כך כל 30 דקות, וממנה scribe. מפצל את העבודה ל-workstreams עם ops lead לכל אחד, משחרר אנשים שלא נחוצים, ודוחף ל-mitigation הכי מהיר שיש (rollback לשינוי האחרון, failover) בזמן שהאבחון ממשיך. קובע קצב check-in של 10 דקות." }
    },
    {
      q: { en: "How do you make sure postmortems lead to real change across the org?", he: "איך אתה מוודא ש-postmortems מובילים לשינוי אמיתי בארגון?" },
      a: { en: "Few, system-level action items with owners and dates, tracked in one place; weekly review of overdue items; closure rate reported to leadership; SEV1 actions prioritised over features by policy. Then aggregate: tag contributing factors and look for patterns quarterly — if config changes cause 40% of incidents, the fix is an org-wide investment like progressive config delivery, which I'd turn into a design doc and roadmap item.", he: "מעט action items ברמת המערכת עם owners ותאריכים, במקום אחד; review שבועי של מה שבאיחור; אחוז סגירה שמדווח להנהלה; actions של SEV1 מקבלים עדיפות על פיצ'רים לפי policy. ואז אגרגציה: מתייגים contributing factors ומחפשים דפוסים כל רבעון — אם שינויי config גורמים ל-40% מה-incidents, התיקון הוא השקעה ארגונית כמו progressive config delivery, שאותה הייתי הופך ל-design doc ולפריט ב-roadmap." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the Incident Commander's main job?", he: "מה התפקיד העיקרי של ה-Incident Commander?" },
      options: [
        { en: "Find the root cause personally", he: "למצוא את ה-root cause בעצמו" },
        { en: "Coordinate: set priorities, assign work, make decisions, keep comms flowing", he: "לתאם: לקבוע עדיפויות, לשבץ עבודה, לקבל החלטות, לשמור על זרימת תקשורת" },
        { en: "Write the status page", he: "לכתוב את ה-status page" },
        { en: "Assign blame", he: "למצוא אשמים" }
      ],
      answer: 1,
      explain: { en: "The IC owns the incident, not the fix. Hands-on debugging belongs to ops lead and SMEs; comms belong to the comms lead.", he: "ה-IC הוא הבעלים של ה-incident, לא של התיקון. Debug hands-on שייך ל-ops lead ול-SMEs; תקשורת שייכת ל-comms lead." }
    },
    {
      q: { en: "Which action item is strongest?", he: "איזה action item הכי חזק?" },
      options: [
        { en: "Engineers should be more careful with kubectl", he: "המהנדסים צריכים להיות יותר זהירים עם kubectl" },
        { en: "Add a training session on Kafka", he: "להוסיף הדרכה על Kafka" },
        { en: "Admission policy blocks deleting namespaces labelled tier=1; owner @lior; due Dec 1", he: "Admission policy שחוסמת מחיקת namespaces עם label tier=1; owner @lior; עד 1 בדצמבר" },
        { en: "Investigate further", he: "לחקור עוד" }
      ],
      answer: 2,
      explain: { en: "It's a system fix that prevents recurrence regardless of who's at the keyboard, with an owner and a date.", he: "זה תיקון מערכתי שמונע הישנות בלי קשר למי שליד המקלדת, עם owner ותאריך." }
    },
    {
      q: { en: "A junior engineer sees 25% checkout errors but isn't sure it's 'bad enough'. What should your process say?", he: "מהנדס ג'וניור רואה 25% שגיאות ב-checkout אבל לא בטוח שזה 'מספיק רע'. מה התהליך שלך צריך להגיד?" },
      options: [
        { en: "Wait 30 minutes to be sure", he: "לחכות 30 דקות כדי להיות בטוח" },
        { en: "Ask their manager for permission", he: "לבקש רשות מהמנהל" },
        { en: "Declare a SEV now; it can be downgraded later", he: "להכריז SEV עכשיו; אפשר להוריד אחר כך" },
        { en: "Post in a random channel", he: "לכתוב באיזה ערוץ כלשהו" }
      ],
      answer: 2,
      explain: { en: "Declare early, downgrade later. Anyone can declare; the cost of a false alarm is far lower than a late response.", he: "מכריזים מוקדם, מורידים אחר כך. כל אחד יכול להכריז; המחיר של אזעקת שווא נמוך בהרבה מתגובה מאוחרת." }
    }
  ],
  related: ["rel-incident-management", "staff-production-readiness", "rel-error-budgets", "staff-influence"]
});

// ---------------------------------------------------------------------------
// 24. Migrations at scale
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-migrations-at-scale",
  track: "staff",
  order: 24,
  icon: "🚚",
  level: 3,
  minutes: 16,
  title: {
    en: "Migrations at Scale: Moving 200 Services Without Stopping the Company",
    he: "מיגרציות בסקייל: להעביר 200 שירותים בלי לעצור את החברה"
  },
  tldr: {
    en: "Big migrations fail on the long tail, not the first service: strangle the old system incrementally, dual-run with a fast rollback, automate the change (codemods, bots, PRs you open for teams), make the new path cheaper than the old (carrots before sticks), publish progress as a burndown, and set a deprecation date you actually enforce.",
    he: "מיגרציות גדולות נכשלות ב-long tail, לא בשירות הראשון: חונקים את המערכת הישנה בהדרגה, מריצים במקביל עם rollback מהיר, מאטמטים את השינוי (codemods, בוטים, PRs שאתה פותח לצוותים), הופכים את הדרך החדשה לזולה מהישנה (קודם גזר, אחר כך מקל), מפרסמים התקדמות כ-burndown, וקובעים תאריך deprecation שבאמת אוכפים."
  },
  analogy: {
    en: "A strangler fig tree grows around an old tree, branch by branch, until one day the old trunk has rotted away and the fig stands on its own. Nobody chopped the old tree down in one go — and the forest never noticed a gap. Migrating 200 services is the same: wrap, redirect, grow, and only at the very end remove what's left inside.",
    he: "עץ התאנה החונקת (strangler fig) גדל סביב עץ ישן, ענף אחרי ענף, עד שיום אחד הגזע הישן נרקב והתאנה עומדת לבד. אף אחד לא כרת את העץ הישן במכה אחת — והיער אף פעם לא הרגיש חור. להעביר 200 שירותים זה אותו דבר: עוטפים, מסיטים, מגדלים, ורק בסוף מסירים את מה שנשאר בפנים."
  },
  sections: [
    {
      h: { en: "Strangler fig and dual-running", he: "Strangler fig ו-dual-running" },
      body: {
        en: `<p>The <strong>strangler fig pattern</strong> (Martin Fowler): put a routing layer in front of the old system, move one slice of functionality at a time to the new one, and keep the old one serving everything not yet moved. Never a big-bang cutover.</p>
<p>Infra examples:</p>
<ul>
<li><strong>Self-hosted K8s (kops) → EKS:</strong> new clusters behind the same ingress/DNS; move namespaces one by one with weighted DNS or a global LB (10% → 50% → 100%); old cluster keeps the rest.</li>
<li><strong>RabbitMQ → Kafka:</strong> producers <em>dual-publish</em> to both; consumers move one at a time to Kafka; compare counts/checksums; turn off RabbitMQ publishing only when the last consumer moved.</li>
<li><strong>Datadog → OpenTelemetry + Grafana stack:</strong> OTel Collector exports to both backends for a quarter; teams switch dashboards/alerts at their pace; then stop the old exporter.</li>
</ul>
<p><strong>Dual-running</strong> costs money (two systems for months), but it buys the most valuable thing in a migration: a rollback that is a config flip, not a project. Budget for it explicitly in the design doc and set an end date for it.</p>`,
        he: `<p><strong>Strangler fig pattern</strong> (של Martin Fowler): שמים routing layer מול המערכת הישנה, מעבירים פרוסה אחת של פונקציונליות בכל פעם לחדשה, והישנה ממשיכה לשרת כל מה שעוד לא עבר. אף פעם לא cutover ב-big bang.</p>
<p>דוגמאות מהתשתית:</p>
<ul>
<li><strong>K8s self-hosted (kops) ל-EKS:</strong> clusters חדשים מאחורי אותו ingress/DNS; מעבירים namespaces אחד אחד עם weighted DNS או global LB (10% ← 50% ← 100%); ה-cluster הישן ממשיך עם השאר.</li>
<li><strong>RabbitMQ ל-Kafka:</strong> ה-producers עושים <em>dual-publish</em> לשניהם; ה-consumers עוברים אחד אחד ל-Kafka; משווים counts/checksums; מכבים את ה-publish ל-RabbitMQ רק כשה-consumer האחרון עבר.</li>
<li><strong>Datadog ל-OpenTelemetry + Grafana stack:</strong> OTel Collector מייצא לשני ה-backends לרבעון; צוותים מעבירים דשבורדים/alerts בקצב שלהם; ואז עוצרים את ה-exporter הישן.</li>
</ul>
<p><strong>Dual-running</strong> עולה כסף (שתי מערכות למשך חודשים), אבל הוא קונה את הדבר הכי שווה במיגרציה: rollback שהוא שינוי config, לא פרויקט. מתקצבים את זה במפורש ב-design doc וקובעים לזה תאריך סיום.</p>`
      }
    },
    {
      h: { en: "Tracking 200 services: make progress visible", he: "מעקב אחרי 200 שירותים: להפוך את ההתקדמות לגלויה" },
      body: {
        en: `<p>You can't manage what you can't count. Build the tracker <em>before</em> starting:</p>
<ul>
<li><strong>Automated inventory</strong> — derived from reality, not a spreadsheet people update: a query over repos (who still imports the old client?), over clusters (which namespaces still run on the old cluster?), over metrics (who still publishes to RabbitMQ?).</li>
<li><strong>Per-service state</strong>: not started / in progress / migrated / old path removed. The last state matters — "migrated but still dual-writing" isn't done.</li>
<li><strong>A burndown chart</strong> shared weekly with all engineering leads: remaining services over time, with the target date drawn on it.</li>
<li><strong>Segmentation</strong>: by team, by tier, by complexity. Easy wins first to prove the path, but start conversations with the hardest 10% early.</li>
</ul>
<pre># weekly snapshot, generated by CI from code search + cluster API
team         total  migrated  in-progress  not-started
payments        18        12            4            2
search          11        11            0            0
data-platform   26         9            3           14   &lt;- talk to their lead
---
TOTAL          203       131           22           50   (65%)  target: 100% by 2027-03-31</pre>`,
        he: `<p>אי אפשר לנהל מה שאי אפשר לספור. בונים את ה-tracker <em>לפני</em> שמתחילים:</p>
<ul>
<li><strong>Inventory אוטומטי</strong> — נגזר מהמציאות, לא מגיליון שאנשים מעדכנים: שאילתה על ה-repos (מי עוד עושה import ל-client הישן?), על ה-clusters (אילו namespaces עוד רצים על ה-cluster הישן?), על המטריקות (מי עוד עושה publish ל-RabbitMQ?).</li>
<li><strong>State לכל שירות</strong>: not started / in progress / migrated / old path removed. ה-state האחרון קריטי — "migrated אבל עדיין עושה dual-write" זה לא done.</li>
<li><strong>Burndown chart</strong> שמשותף כל שבוע עם כל ה-engineering leads: כמה שירותים נשארו לאורך זמן, עם תאריך היעד מסומן.</li>
<li><strong>סגמנטציה</strong>: לפי צוות, לפי tier, לפי מורכבות. Easy wins קודם כדי להוכיח את הדרך, אבל מתחילים את השיחות עם ה-10% הכי קשים מוקדם.</li>
</ul>
<pre># weekly snapshot, generated by CI from code search + cluster API
team         total  migrated  in-progress  not-started
payments        18        12            4            2
search          11        11            0            0
data-platform   26         9            3           14   &lt;- talk to their lead
---
TOTAL          203       131           22           50   (65%)  target: 100% by 2027-03-31</pre>`
      }
    },
    {
      h: { en: "Automation, codemods, carrots and sticks", he: "אוטומציה, codemods, גזר ומקל" },
      body: {
        en: `<p>The biggest lever: <strong>make the migration nearly free for service teams</strong>. Every hour you ask of 200 teams is 200 hours of resentment.</p>
<ul>
<li><strong>Codemods / automated PRs</strong>: a script that rewrites the Helm values, swaps the client library, updates the CI template — and opens the PR for the team (<code>gh pr create</code> in a loop, or tools like Sourcegraph Batch Changes, Renovate, OpenRewrite). The team only reviews and merges.</li>
<li><strong>Migration office hours</strong> and a dedicated Slack channel, a "migration buddy" from the platform team for hard cases.</li>
<li><strong>Carrots first</strong>: the new path must be better — faster deploys, free dashboards, cheaper infra billed to the team, fewer pages. "Teams on the new EKS platform get Karpenter and their node costs drop 30%" moves people more than a mandate.</li>
<li><strong>Sticks later, announced early</strong>: no new services on the old path (radar: Hold), then old path is read-only, then cost of the old path is charged back to remaining teams, then hard shutdown. Each step communicated months in advance.</li>
</ul>
<blockquote>💡 Real world: Stripe, Google and others report the same pattern — a central team doing ~80% of the migration work via automation finishes in quarters; a central team that sends "please migrate" emails is still at 70% two years later.</blockquote>`,
        he: `<p>המנוף הכי גדול: <strong>להפוך את המיגרציה לכמעט חינמית לצוותי השירות</strong>. כל שעה שאתה מבקש מ-200 צוותים היא 200 שעות של טינה.</p>
<ul>
<li><strong>Codemods / PRs אוטומטיים</strong>: סקריפט שמשכתב את ה-Helm values, מחליף את ספריית ה-client, מעדכן את ה-CI template — ופותח PR לצוות (<code>gh pr create</code> בלולאה, או כלים כמו Sourcegraph Batch Changes, Renovate, OpenRewrite). הצוות רק עושה review ו-merge.</li>
<li><strong>Office hours למיגרציה</strong> וערוץ Slack ייעודי, "migration buddy" מצוות ה-platform למקרים הקשים.</li>
<li><strong>קודם גזר</strong>: הדרך החדשה חייבת להיות טובה יותר — deploys מהירים יותר, דשבורדים בחינם, תשתית זולה יותר שמחויבת לצוות, פחות pages. "צוותים על פלטפורמת ה-EKS החדשה מקבלים Karpenter ועלויות ה-nodes שלהם יורדות ב-30%" מזיז אנשים יותר מהוראה.</li>
<li><strong>מקל אחר כך, מוכרז מוקדם</strong>: אין שירותים חדשים על הדרך הישנה (radar: Hold), אחר כך הדרך הישנה read-only, אחר כך עלות הדרך הישנה מחויבת לצוותים שנשארו, ואז כיבוי סופי. כל שלב מתוקשר חודשים מראש.</li>
</ul>
<blockquote>💡 מהשטח: Stripe, Google ואחרים מדווחים על אותו דפוס — צוות מרכזי שעושה ~80% מעבודת המיגרציה דרך אוטומציה מסיים תוך רבעונים; צוות מרכזי ששולח מיילים של "נא לעבור" עדיין תקוע על 70% אחרי שנתיים.</blockquote>`
      }
    },
    {
      h: { en: "Deprecation policy and the long tail", he: "Deprecation policy וה-long tail" },
      body: {
        en: `<p>The first 70% takes 30% of the time; the last 10% takes the rest. The long tail is: the service nobody owns, the one with a weird protocol, the team that is mid-reorg, the batch job that runs once a quarter. Plan for it:</p>
<ul>
<li><strong>A written deprecation policy</strong>, agreed with engineering leadership: announcement ≥ 2 quarters ahead, dates for "no new usage", "read-only", "shutdown", and an exception process (exceptions need a VP sponsor and an end date).</li>
<li><strong>Find owners for orphans</strong> — via the service catalog, git blame, cost tags. If truly orphaned: the platform team migrates it or proposes deletion ("this cron has not succeeded since March — delete?").</li>
<li><strong>Do the hard ones yourself</strong>. The Staff engineer often personally migrates the 3 gnarliest services — it de-risks the plan and earns credibility.</li>
<li><strong>Brownouts</strong> before shutdown: turn the old system off for 1 hour, announced, to flush out unknown consumers. Then 1 day. Then off.</li>
<li><strong>Finish means deleted</strong>: old cluster destroyed, old client library removed from the dependency tree, old IAM roles gone, old docs archived. Celebrate the deletion, not the 90% mark.</li>
</ul>`,
        he: `<p>ה-70% הראשונים לוקחים 30% מהזמן; ה-10% האחרונים לוקחים את כל השאר. ה-long tail זה: השירות שאין לו בעלים, זה עם protocol מוזר, הצוות שבאמצע reorg, ה-batch job שרץ פעם ברבעון. מתכננים לזה:</p>
<ul>
<li><strong>Deprecation policy כתובה</strong>, מוסכמת עם הנהלת ה-engineering: הודעה לפחות 2 רבעונים מראש, תאריכים ל"אין שימוש חדש", "read-only", "shutdown", ותהליך חריגות (חריגה צריכה VP sponsor ותאריך סיום).</li>
<li><strong>למצוא בעלים ליתומים</strong> — דרך ה-service catalog, git blame, cost tags. אם באמת יתום: צוות ה-platform מעביר אותו או מציע למחוק ("ה-cron הזה לא הצליח מאז מרץ — למחוק?").</li>
<li><strong>את הקשים עושים בעצמך</strong>. ה-Staff engineer הרבה פעמים מעביר בעצמו את 3 השירותים הכי מסובכים — זה מוריד סיכון מהתוכנית וקונה אמינות.</li>
<li><strong>Brownouts</strong> לפני כיבוי: מכבים את המערכת הישנה לשעה, בהודעה מראש, כדי לחשוף consumers לא ידועים. אחר כך ליום. ואז כיבוי.</li>
<li><strong>סיום זה מחיקה</strong>: ה-cluster הישן הושמד, ספריית ה-client הישנה הוסרה מעץ התלויות, IAM roles ישנים נמחקו, דוקומנטציה ישנה בארכיון. חוגגים את המחיקה, לא את ה-90%.</li>
</ul>`
      }
    }
  ],
  diagram: "clients -> routing layer (DNS weights / ingress / dual-publish)\n               |                      |\n           OLD system  <-- shrinking   NEW system  <-- growing\n progress: 0% ==== 70% (30% of time) ======= 90% ======== 100% (deleted)\n                                    ^ long tail: orphans, weird protocols, brownouts",
  handsOn: [
    { cmd: "gh search code \"github.com/streadway/amqp\" --owner my-org --json repository --jq '.[].repository.nameWithOwner' | sort -u > remaining.txt && wc -l remaining.txt", what: { en: "Automated inventory: every repo still importing the old RabbitMQ client. Run it in CI weekly to feed the burndown.", he: "Inventory אוטומטי: כל repo שעדיין עושה import ל-client הישן של RabbitMQ. מריצים את זה ב-CI כל שבוע כדי להזין את ה-burndown." } },
    { cmd: "kubectl --context old-kops-prod get deploy -A --no-headers | awk '{print $1}' | sort | uniq -c | sort -rn", what: { en: "Which namespaces (and how many Deployments each) still live on the old cluster — the per-team view of what's left.", he: "אילו namespaces (וכמה Deployments בכל אחד) עדיין חיים על ה-cluster הישן — התצוגה לפי צוות של מה שנשאר." } },
    { cmd: "for r in $(cat remaining.txt); do gh workflow run codemod.yml -f repo=$r -f change=amqp-to-kafka; done", what: { en: "Run the codemod per repo: a workflow that rewrites the client, runs tests and opens a PR for the owning team to review.", he: "מריצים את ה-codemod לכל repo: workflow שמשכתב את ה-client, מריץ טסטים ופותח PR שהצוות הבעלים עושה לו review." } }
  ],
  mnemonic: {
    en: "\"Strangle, don't chop. Count it automatically. Open the PRs for them. Carrots, then sticks. Done means deleted.\"",
    he: "\"חונקים, לא כורתים. סופרים אוטומטית. פותחים להם את ה-PRs. קודם גזר, אחר כך מקל. Done זה מחוק.\""
  },
  pitfalls: [
    { en: "Big-bang cutover weekend. One unknown consumer and you're rolling back 200 services at 4 AM. Incremental moves with dual-run make each step reversible.", he: "סוף שבוע של cutover ב-big bang. Consumer לא ידוע אחד ואתה עושה rollback ל-200 שירותים ב-4 בבוקר. מעברים הדרגתיים עם dual-run הופכים כל שלב להפיך." },
    { en: "Asking every team to 'please migrate by Q3' with a wiki page. Without automation and incentives the migration stalls at 60-70% and both systems run forever.", he: "לבקש מכל צוות 'נא לעבור עד Q3' עם עמוד wiki. בלי אוטומציה ותמריצים המיגרציה נתקעת על 60-70% ושתי המערכות רצות לנצח." },
    { en: "Declaring victory at 95%. The last 5% keeps the old system's on-call, cost and security surface alive — it's not done until the old system is deleted.", he: "להכריז על ניצחון ב-95%. ה-5% האחרונים משאירים בחיים את ה-on-call, העלות ומשטח האבטחה של המערכת הישנה — זה לא נגמר עד שהמערכת הישנה נמחקה." },
    { en: "Starting migrations faster than you finish them. Two half-done migrations are worse than one done: three systems to run. Limit concurrent org-wide migrations.", he: "להתחיל מיגרציות מהר יותר מאשר מסיימים אותן. שתי מיגרציות חצי-גמורות גרועות מאחת גמורה: שלוש מערכות לתפעל. מגבילים מיגרציות ארגוניות במקביל." }
  ],
  interview: [
    {
      q: { en: "You need to move 200 services from a self-managed K8s cluster to EKS in a year. How do you run it?", he: "אתה צריך להעביר 200 שירותים מ-cluster K8s מנוהל עצמית ל-EKS תוך שנה. איך אתה מריץ את זה?" },
      a: { en: "Design doc first with goals, non-goals and rollback. Build the target platform and an automated inventory/burndown before migrating anything. Move 3-5 friendly services to prove the path, then automate: codemods for manifests/CI and PRs opened for teams, traffic shifted via weighted DNS so each move is reversible. Make EKS better (Karpenter savings, faster deploys), set a deprecation policy with dates and an exception process, run brownouts, personally take the hardest services, report the burndown weekly to leadership, and finish by destroying the old cluster.", he: "קודם design doc עם goals, non-goals ו-rollback. בונים את פלטפורמת היעד ו-inventory/burndown אוטומטי לפני שמעבירים משהו. מעבירים 3-5 שירותים ידידותיים כדי להוכיח את הדרך, ואז מאטמטים: codemods ל-manifests/CI ו-PRs שנפתחים לצוותים, תעבורה שמוסטת עם weighted DNS כך שכל מעבר הפיך. הופכים את EKS לטוב יותר (חיסכון מ-Karpenter, deploys מהירים), קובעים deprecation policy עם תאריכים ותהליך חריגות, מריצים brownouts, לוקח בעצמי את השירותים הכי קשים, מדווח burndown כל שבוע להנהלה, ומסיימים בהשמדת ה-cluster הישן." }
    },
    {
      q: { en: "The migration is stuck at 85% for two months. What do you do?", he: "המיגרציה תקועה על 85% כבר חודשיים. מה אתה עושה?" },
      a: { en: "Segment the remaining 15%: orphans, technically blocked, deprioritised by their team. Orphans get an owner or a deletion proposal; technical blockers get platform engineers or a feature in the new system; deprioritised teams get a conversation with their lead plus a stick on the published timeline (read-only date, chargeback of the old platform's cost). Then brownouts to flush out surprises.", he: "מפלח את ה-15% שנשארו: יתומים, חסומים טכנית, ומה שהצוות לא תיעדף. ליתומים מוצאים owner או מציעים מחיקה; לחסימות טכניות מביאים מהנדסי platform או פיצ'ר במערכת החדשה; לצוותים שלא תיעדפו יש שיחה עם ה-lead שלהם ועוד מקל לפי ה-timeline שפורסם (תאריך read-only, chargeback של עלות הפלטפורמה הישנה). ואז brownouts כדי לחשוף הפתעות." }
    }
  ],
  quiz: [
    {
      q: { en: "Why dual-run old and new systems during a migration?", he: "למה להריץ את המערכת הישנה והחדשה במקביל בזמן מיגרציה?" },
      options: [
        { en: "To double capacity permanently", he: "כדי להכפיל capacity לתמיד" },
        { en: "So rollback is a config flip and results can be compared", he: "כדי ש-rollback יהיה שינוי config ואפשר יהיה להשוות תוצאות" },
        { en: "Because vendors require it", he: "כי הספקים דורשים את זה" },
        { en: "To avoid writing a design doc", he: "כדי לא לכתוב design doc" }
      ],
      answer: 1,
      explain: { en: "Dual-running costs money but makes every step reversible and lets you verify parity (counts, checksums, latency) before switching.", he: "Dual-running עולה כסף אבל הופך כל שלב להפיך ומאפשר לוודא parity (counts, checksums, latency) לפני המעבר." }
    },
    {
      q: { en: "Most effective way to get 200 teams to migrate a client library?", he: "הדרך הכי אפקטיבית לגרום ל-200 צוותים להחליף ספריית client?" },
      options: [
        { en: "An email from the CTO", he: "מייל מה-CTO" },
        { en: "A wiki page with instructions", he: "עמוד wiki עם הוראות" },
        { en: "Automated PRs (codemods) opened for each team, plus a better new path", he: "PRs אוטומטיים (codemods) שנפתחים לכל צוות, ועוד דרך חדשה שהיא טובה יותר" },
        { en: "Blocking all their deploys immediately", he: "לחסום מיד את כל ה-deploys שלהם" }
      ],
      answer: 2,
      explain: { en: "Making it nearly free for teams removes the main objection (time). Incentives make them want it; sticks come later and are announced early.", he: "להפוך את זה לכמעט חינם לצוותים מוריד את ההתנגדות העיקרית (זמן). תמריצים גורמים להם לרצות; מקלות מגיעים אחר כך ומוכרזים מוקדם." }
    },
    {
      q: { en: "What is a 'brownout' in a deprecation?", he: "מה זה 'brownout' ב-deprecation?" },
      options: [
        { en: "A partial power outage in the data center", he: "הפסקת חשמל חלקית ב-data center" },
        { en: "A planned, announced temporary shutdown of the old system to discover unknown users", he: "כיבוי זמני מתוכנן ומוכרז של המערכת הישנה כדי לגלות משתמשים לא ידועים" },
        { en: "Reducing log verbosity", he: "הורדת רמת הלוגים" },
        { en: "A canary deployment", he: "Canary deployment" }
      ],
      answer: 1,
      explain: { en: "Short scheduled outages (1 hour, then 1 day) surface hidden consumers while you can still turn it back on — far better than discovering them at final shutdown.", he: "השבתות קצרות מתוכננות (שעה, אחר כך יום) חושפות consumers נסתרים כל עוד אפשר להדליק בחזרה — הרבה יותר טוב מלגלות אותם בכיבוי הסופי." }
    },
    {
      q: { en: "When is a migration 'done'?", he: "מתי מיגרציה 'גמורה'?" },
      options: [
        { en: "When 90% of services moved", he: "כש-90% מהשירותים עברו" },
        { en: "When the new system is launched", he: "כשהמערכת החדשה עלתה" },
        { en: "When the old system and its code paths, roles and costs are deleted", he: "כשהמערכת הישנה, ה-code paths, ה-roles והעלויות שלה נמחקו" },
        { en: "When the design doc is approved", he: "כשה-design doc אושר" }
      ],
      answer: 2,
      explain: { en: "Until deletion you still pay on-call, cost and security surface for the old system. Celebrate the deletion.", he: "עד המחיקה אתה עדיין משלם on-call, עלות ומשטח אבטחה על המערכת הישנה. חוגגים את המחיקה." }
    }
  ],
  related: ["staff-design-docs", "staff-tech-strategy", "rel-deployments", "k8s-day2-upgrades"]
});

// ---------------------------------------------------------------------------
// 25. Influence without authority
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-influence",
  track: "staff",
  order: 25,
  icon: "🤝",
  level: 3,
  minutes: 15,
  title: {
    en: "Leading Without Authority: Influence, Alignment & Managing Up",
    he: "להוביל בלי סמכות: השפעה, יישור קו וניהול כלפי מעלה"
  },
  tldr: {
    en: "Staff engineers have no direct reports and still need ten teams to change course: earn trust by solving real problems, align stakeholders 1:1 before the big meeting, write for executives bottom-line-first, disagree openly then commit fully, grow others through mentoring and sponsorship, and know which Staff archetype you're playing.",
    he: "ל-Staff engineers אין כפופים, ועדיין הם צריכים שעשרה צוותים ישנו כיוון: בונים אמון בכך שפותרים בעיות אמיתיות, מיישרים stakeholders אחד על אחד לפני הפגישה הגדולה, כותבים להנהלה עם השורה התחתונה קודם, חולקים בגלוי ואז מתחייבים עד הסוף, מצמיחים אחרים דרך mentoring ו-sponsorship, ויודעים איזה Staff archetype אתה משחק."
  },
  analogy: {
    en: "A Staff engineer is like the navigator on a ship, not the captain. The navigator can't order anyone to turn the wheel, but if they have been right about the reefs for two years, the captain turns when they speak. Influence is a bank account: every accurate call, every favour, every problem solved for another team is a deposit; every mandate you push is a withdrawal.",
    he: "Staff engineer הוא כמו הנווט בספינה, לא הקברניט. הנווט לא יכול לפקוד על אף אחד לסובב את ההגה, אבל אם הוא צדק לגבי השוניות שנתיים ברציפות, הקברניט מסובב כשהוא מדבר. השפעה היא חשבון בנק: כל הערכה מדויקת, כל טובה, כל בעיה שפתרת לצוות אחר זו הפקדה; כל הוראה שאתה דוחף זו משיכה."
  },
  sections: [
    {
      h: { en: "Staff archetypes: which job are you doing?", he: "Staff archetypes: איזו עבודה אתה עושה?" },
      body: {
        en: `<p>Will Larson's <em>Staff Engineer</em> describes four common shapes of the role. Most people lean on one or two:</p>
<table><tr><th>Archetype</th><th>What they do</th><th>Infra example</th></tr>
<tr><td><strong>Tech Lead</strong></td><td>Guides the approach and execution of one team or a cluster of teams</td><td>Leads the 3-team platform group building the internal EKS platform</td></tr>
<tr><td><strong>Architect</strong></td><td>Owns direction and quality across a critical area</td><td>Owns the org's data-streaming architecture: Kafka standards, schemas, multi-region strategy</td></tr>
<tr><td><strong>Solver</strong></td><td>Parachutes into the hardest, most ambiguous problems</td><td>Fixes the p99 latency regression nobody could crack, then moves on to the cost explosion</td></tr>
<tr><td><strong>Right Hand</strong></td><td>Extends an executive's attention; operates org-wide on their behalf</td><td>Works with the VP Infra on the reliability program across all of engineering</td></tr></table>
<p>Knowing your archetype tells you what "good" looks like and what to say no to. A Tech Lead who keeps parachuting into unrelated fires starves their own team; a Solver who tries to own every architecture decision becomes a bottleneck.</p>`,
        he: `<p>הספר <em>Staff Engineer</em> של Will Larson מתאר ארבע צורות נפוצות של התפקיד. רוב האנשים נשענים על אחת או שתיים:</p>
<table><tr><th>Archetype</th><th>מה עושים</th><th>דוגמה מהתשתית</th></tr>
<tr><td><strong>Tech Lead</strong></td><td>מכוון את הגישה והביצוע של צוות אחד או קבוצת צוותים</td><td>מוביל את קבוצת ה-platform של 3 צוותים שבונה את פלטפורמת ה-EKS הפנימית</td></tr>
<tr><td><strong>Architect</strong></td><td>אחראי על כיוון ואיכות בתחום קריטי</td><td>אחראי על ארכיטקטורת ה-data streaming של הארגון: סטנדרטים ל-Kafka, schemas, אסטרטגיית multi-region</td></tr>
<tr><td><strong>Solver</strong></td><td>צונח לבעיות הכי קשות ועמומות</td><td>מתקן את רגרסיית ה-p99 latency שאף אחד לא הצליח לפצח, ואז עובר לפיצוץ העלויות</td></tr>
<tr><td><strong>Right Hand</strong></td><td>מרחיב את תשומת הלב של מנהל בכיר; פועל ברמת הארגון בשמו</td><td>עובד עם ה-VP Infra על תוכנית ה-reliability של כל ה-engineering</td></tr></table>
<p>לדעת מה ה-archetype שלך אומר לך איך נראה "טוב" ולמה להגיד לא. Tech Lead שכל הזמן צונח לשריפות לא קשורות מרעיב את הצוות שלו; Solver שמנסה להחזיק כל החלטת ארכיטקטורה הופך לצוואר בקבוק.</p>`
      }
    },
    {
      h: { en: "Aligning stakeholders", he: "ליישר stakeholders" },
      body: {
        en: `<p>Say you want an SLO program across 30 services: every tier-1 service gets SLOs, burn-rate alerts, and an error-budget policy. Nobody reports to you. A playbook:</p>
<ol>
<li><strong>Map stakeholders</strong>: who decides (VP Eng), who does the work (service teams), who can block (product leads who fear feature freezes), who benefits (SRE, support).</li>
<li><strong>Find what each one wants</strong>. Product wants fewer customer escalations; team leads want fewer pages; the VP wants a reliability number for the board. Frame the program in <em>their</em> terms.</li>
<li><strong>Go 1:1 before the group meeting</strong> (the "nemawashi" / pre-wiring step). By the time you present, there should be no surprises — the meeting ratifies agreements.</li>
<li><strong>Start with a coalition of the willing</strong>: 3 teams that want it, make them visibly successful, then use them as the case study.</li>
<li><strong>Make it easy</strong>: an SLO template, a Terraform module for burn-rate alerts, a dashboard generated automatically. Influence scales with how little you ask of others.</li>
</ol>
<blockquote>💡 Real world: "Don't make it about you being right." The goal is the outcome. If a team lead proposes a slightly worse version they'll actually own, that often beats your perfect version they'll resist.</blockquote>`,
        he: `<p>נניח שאתה רוצה תוכנית SLO על 30 שירותים: לכל שירות tier-1 יהיו SLOs, burn-rate alerts ו-error-budget policy. אף אחד לא כפוף אליך. Playbook:</p>
<ol>
<li><strong>ממפים stakeholders</strong>: מי מחליט (VP Eng), מי עושה את העבודה (צוותי השירותים), מי יכול לחסום (product leads שחוששים מהקפאת פיצ'רים), מי מרוויח (SRE, support).</li>
<li><strong>מגלים מה כל אחד רוצה</strong>. Product רוצים פחות escalations מלקוחות; ראשי צוותים רוצים פחות pages; ה-VP רוצה מספר reliability לבורד. ממסגרים את התוכנית במונחים <em>שלהם</em>.</li>
<li><strong>הולכים אחד על אחד לפני הפגישה הקבוצתית</strong> (שלב ה-"nemawashi" / pre-wiring). כשאתה מציג, לא אמורות להיות הפתעות — הפגישה רק מאשררת הסכמות.</li>
<li><strong>מתחילים עם קואליציה של מי שרוצה</strong>: 3 צוותים שרוצים את זה, הופכים אותם להצלחה גלויה, ואז משתמשים בהם כ-case study.</li>
<li><strong>עושים את זה קל</strong>: SLO template, Terraform module ל-burn-rate alerts, דשבורד שנוצר אוטומטית. ההשפעה גדלה ככל שאתה מבקש פחות מאחרים.</li>
</ol>
<blockquote>💡 מהשטח: "זה לא עניין של מי צודק." המטרה היא התוצאה. אם ראש צוות מציע גרסה קצת פחות טובה שהוא באמת ייקח עליה בעלות, היא הרבה פעמים מנצחת את הגרסה המושלמת שלך שהוא יתנגד לה.</blockquote>`
      }
    },
    {
      h: { en: "Writing for executives: BLUF", he: "לכתוב להנהלה: BLUF" },
      body: {
        en: `<p>Executives read the first three lines. <strong>BLUF — Bottom Line Up Front</strong> (from military writing): the decision or ask first, then the why, then details for those who want them.</p>
<pre>Subject: Decision needed by Fri: move event bus to MSK (+$6k/mo)

BLUF: I recommend we replace RabbitMQ with Amazon MSK in Q2.
Ask: approve +$6k/month infra and 2 engineers for one quarter.

Why: RabbitMQ caused 4 SEV2s in Q3 (~11h customer-facing impact)
and costs ~0.5 FTE in toil. MSK removes broker on-call and gives
7-day replay, which unblocks the fraud team's backfill project.

Risk: cutover. Mitigated by dual-publish; rollback = flag flip.
If we don't: expect ~1 SEV2/month to continue; fraud project slips.

Details: RFC-042 (link)</pre>
<p>Rules: numbers over adjectives ("4 SEV2s, 11 hours" not "very unstable"); business impact over tech detail; always state the cost of doing nothing; one ask per message; offer options when you need a decision ("A: full migration Q2, B: payments only, C: defer — my recommendation is A because...").</p>`,
        he: `<p>הנהלה קוראת את שלוש השורות הראשונות. <strong>BLUF — Bottom Line Up Front</strong> (מהכתיבה הצבאית): ההחלטה או הבקשה קודם, אחר כך הלמה, ואחר כך פרטים למי שרוצה.</p>
<pre>Subject: Decision needed by Fri: move event bus to MSK (+$6k/mo)

BLUF: I recommend we replace RabbitMQ with Amazon MSK in Q2.
Ask: approve +$6k/month infra and 2 engineers for one quarter.

Why: RabbitMQ caused 4 SEV2s in Q3 (~11h customer-facing impact)
and costs ~0.5 FTE in toil. MSK removes broker on-call and gives
7-day replay, which unblocks the fraud team's backfill project.

Risk: cutover. Mitigated by dual-publish; rollback = flag flip.
If we don't: expect ~1 SEV2/month to continue; fraud project slips.

Details: RFC-042 (link)</pre>
<p>כללים: מספרים במקום שמות תואר ("4 SEV2, 11 שעות" ולא "מאוד לא יציב"); impact עסקי במקום פרטים טכניים; תמיד לציין מה המחיר של לא לעשות כלום; בקשה אחת בהודעה; להציע אופציות כשצריך החלטה ("A: מיגרציה מלאה ב-Q2, B: רק payments, C: לדחות — ההמלצה שלי היא A כי...").</p>`
      }
    },
    {
      h: { en: "Disagree & commit, mentoring vs sponsoring, managing up", he: "Disagree & commit, mentoring מול sponsoring, ניהול כלפי מעלה" },
      body: {
        en: `<p><strong>Disagree and commit</strong>: argue your position clearly, with data, while the decision is open. Once the decision-maker decides, commit fully — no quiet sabotage, no "I told you so" in the postmortem. If new data appears, reopen it explicitly. A Staff engineer who keeps relitigating closed decisions loses influence fast.</p>
<p><strong>Mentoring vs sponsoring</strong>: a mentor gives advice ("here's how I'd structure that design doc"). A sponsor spends their own credibility on someone: puts their name forward to lead the Kafka migration, gives them the stage in the architecture review, says "Noa should own this" in the room they're not in. Staff engineers are expected to do both; sponsorship is what actually grows the next Staff engineers.</p>
<p><strong>Managing up</strong>:</p>
<ul>
<li>Know your manager's and director's top 3 priorities and connect your work to them.</li>
<li>No surprises: bad news early, with a plan ("the EKS migration will slip 3 weeks; here's why and what I'm doing").</li>
<li>Bring options, not just problems.</li>
<li>Keep a brag doc / impact log: what you did, the outcome, the numbers. It feeds promotion packets and performance reviews — and your manager will thank you.</li>
</ul>`,
        he: `<p><strong>Disagree and commit</strong>: מציגים את העמדה שלך בבהירות, עם דאטה, כל עוד ההחלטה פתוחה. ברגע שמקבל ההחלטות החליט, מתחייבים עד הסוף — בלי סבוטאז' שקט, בלי "אמרתי לכם" ב-postmortem. אם מגיע דאטה חדש, פותחים את זה מחדש במפורש. Staff engineer שכל הזמן מתדיין מחדש על החלטות סגורות מאבד השפעה מהר.</p>
<p><strong>Mentoring מול sponsoring</strong>: mentor נותן עצות ("ככה הייתי בונה את ה-design doc הזה"). Sponsor מוציא את האמינות שלו על מישהו: מציע את השם שלו להוביל את מיגרציית ה-Kafka, נותן לו את הבמה ב-architecture review, אומר "נועה צריכה להחזיק את זה" בחדר שהיא לא נמצאת בו. מ-Staff engineers מצפים לשניהם; sponsorship זה מה שבאמת מצמיח את ה-Staff engineers הבאים.</p>
<p><strong>ניהול כלפי מעלה</strong>:</p>
<ul>
<li>לדעת את 3 העדיפויות העליונות של המנהל וה-director שלך ולחבר את העבודה שלך אליהן.</li>
<li>בלי הפתעות: חדשות רעות מוקדם, עם תוכנית ("מיגרציית ה-EKS תתעכב ב-3 שבועות; הנה למה ומה אני עושה").</li>
<li>להביא אופציות, לא רק בעיות.</li>
<li>להחזיק brag doc / impact log: מה עשית, התוצאה, המספרים. זה מזין את חבילות הקידום וה-performance reviews — והמנהל שלך יודה לך.</li>
</ul>`
      }
    }
  ],
  diagram: "trust bank:  solve real problems (+)  accurate calls (+)  help other teams (+)\n             mandates (-)  surprises (-)  relitigating decisions (-)\n\nalignment:   map stakeholders -> 1:1 pre-wire -> pilot w/ 3 willing teams -> group decision -> scale with templates",
  handsOn: [
    { cmd: "cp docs/templates/exec-brief.md briefs/2026-11-msk-decision.md", what: { en: "Draft the exec brief in BLUF form: decision/ask in the first two lines, cost of doing nothing, options, link to the RFC.", he: "מנסחים את ה-exec brief בפורמט BLUF: ההחלטה/הבקשה בשתי השורות הראשונות, המחיר של לא לעשות כלום, אופציות, לינק ל-RFC." } },
    { cmd: "gh search prs --reviewed-by @me --owner my-org --merged \">=2026-07-01\" --json repository --jq '.[].repository.name' | sort | uniq -c | sort -rn", what: { en: "Measure your cross-team footprint for the impact log: which repos and teams did you review for this half?", he: "מודדים את טביעת הרגל חוצת-הצוותים שלך ל-impact log: לאילו repos וצוותים עשית review בחצי הזה?" } },
    { cmd: "echo \"$(date +%F) | SLO program | 12/30 tier-1 services with burn-rate alerts | pages -38% for pilot teams\" >> ~/brag-doc.md", what: { en: "Keep a dated impact log with outcomes and numbers — five seconds a week, priceless at promotion time.", he: "מחזיקים impact log עם תאריכים, תוצאות ומספרים — חמש שניות בשבוע, לא יסולא בפז בזמן קידום." } }
  ],
  mnemonic: {
    en: "\"Pre-wire, BLUF, disagree-then-commit, sponsor someone.\"",
    he: "\"Pre-wire, BLUF, לחלוק ואז להתחייב, לעשות sponsor למישהו.\""
  },
  pitfalls: [
    { en: "Trying to win by being the smartest in the room. Being right without bringing people along produces a correct design nobody implements.", he: "לנסות לנצח בזה שאתה הכי חכם בחדר. לצדוק בלי להביא אנשים איתך מייצר design נכון שאף אחד לא מממש." },
    { en: "Surprising a stakeholder in a big meeting. Even a good proposal gets blocked when someone with veto power hears it first in public.", he: "להפתיע stakeholder בפגישה גדולה. גם הצעה טובה נחסמת כשמישהו עם veto שומע עליה לראשונה בפומבי." },
    { en: "Writing exec updates as a chronological story ('first we looked at..., then...'). Executives stop reading before the ask.", he: "לכתוב עדכוני הנהלה כסיפור כרונולוגי ('קודם בדקנו..., ואז...'). המנהלים מפסיקים לקרוא לפני שהגיעו לבקשה." },
    { en: "Doing only invisible glue work. Coordination is essential, but pair it with visible, measurable outcomes or it won't be recognised at Staff level.", he: "לעשות רק glue work שקוף. תיאום הוא קריטי, אבל צריך לשלב אותו עם תוצאות גלויות ומדידות, אחרת זה לא יוכר ברמת Staff." }
  ],
  interview: [
    {
      q: { en: "Tell me about a time you drove a change across teams you had no authority over.", he: "ספר על פעם שהובלת שינוי בין צוותים שלא הייתה לך סמכות עליהם." },
      a: { en: "STAR with scope: 'Our 30 tier-1 services had no SLOs and pages were mostly noise (Situation). I owned getting SLOs adopted org-wide (Task). I mapped stakeholders, pre-wired product leads by framing it as fewer escalations, piloted with 3 willing teams, built a Terraform module and dashboard generator so adoption took an hour, and got the VP to add SLO coverage to quarterly goals (Action). In two quarters 26/30 services had SLOs, pilot teams' pages dropped 38%, and error budgets now drive the reliability roadmap (Result).'", he: "STAR עם scope: 'ל-30 שירותי ה-tier-1 שלנו לא היו SLOs ורוב ה-pages היו רעש (Situation). לקחתי בעלות על אימוץ SLOs בכל הארגון (Task). מיפיתי stakeholders, עשיתי pre-wire ל-product leads כשמסגרתי את זה כפחות escalations, עשיתי pilot עם 3 צוותים שרצו, בניתי Terraform module ומחולל דשבורדים כך שאימוץ לקח שעה, ושכנעתי את ה-VP להכניס כיסוי SLO ליעדים הרבעוניים (Action). תוך שני רבעונים ל-26 מתוך 30 שירותים היו SLOs, ה-pages של צוותי ה-pilot ירדו ב-38%, ו-error budgets מכתיבים היום את ה-roadmap של ה-reliability (Result).'" }
    },
    {
      q: { en: "Tell me about a time you disagreed with a technical decision that went the other way.", he: "ספר על פעם שלא הסכמת עם החלטה טכנית שהלכה לכיוון השני." },
      a: { en: "Show disagree-and-commit: you argued with data during the open window, the decision-maker chose differently, you committed fully and made it succeed (e.g. helped harden the self-hosted Kafka they chose), and you set up a measurable checkpoint to revisit. Never tell a story where you were proven right and gloated, or quietly worked around the decision.", he: "מראים disagree-and-commit: טענת עם דאטה בזמן שההחלטה הייתה פתוחה, מקבל ההחלטה בחר אחרת, התחייבת עד הסוף ועזרת לזה להצליח (למשל עזרת לחזק את ה-Kafka ה-self-hosted שבחרו), וקבעת checkpoint מדיד לבחינה מחדש. אף פעם לא לספר סיפור שבו הוכחת שצדקת והתרברבת, או עקפת את ההחלטה בשקט." }
    }
  ],
  quiz: [
    {
      q: { en: "What's the difference between mentoring and sponsoring?", he: "מה ההבדל בין mentoring ל-sponsoring?" },
      options: [
        { en: "There is none", he: "אין הבדל" },
        { en: "Mentors give advice; sponsors spend their own credibility to create opportunities for someone", he: "Mentor נותן עצות; sponsor מוציא מהאמינות שלו כדי ליצור הזדמנויות למישהו" },
        { en: "Sponsors only work with executives", he: "Sponsors עובדים רק עם הנהלה" },
        { en: "Mentoring is paid, sponsoring is not", he: "Mentoring בתשלום, sponsoring לא" }
      ],
      answer: 1,
      explain: { en: "Sponsorship means advocating for someone in rooms they're not in and handing them high-visibility work — it's what accelerates careers.", he: "Sponsorship זה לקדם מישהו בחדרים שהוא לא נמצא בהם ולתת לו עבודה עם נראות גבוהה — זה מה שמאיץ קריירות." }
    },
    {
      q: { en: "Which opening line follows BLUF?", he: "איזו שורת פתיחה עומדת ב-BLUF?" },
      options: [
        { en: "Over the past quarter we have been investigating several queueing options...", he: "ברבעון האחרון בדקנו כמה אופציות של queueing..." },
        { en: "Kafka is a distributed log originally developed at LinkedIn...", he: "Kafka הוא distributed log שפותח במקור ב-LinkedIn..." },
        { en: "Recommend moving to MSK in Q2; need approval for +$6k/month and 2 engineers by Friday.", he: "ממליץ לעבור ל-MSK ב-Q2; צריך אישור ל-+$6k לחודש ו-2 מהנדסים עד שישי." },
        { en: "Hi all, hope you're well!", he: "היי לכולם, מקווה שאתם בטוב!" }
      ],
      answer: 2,
      explain: { en: "The recommendation and the ask come first, with numbers and a deadline. Background goes below.", he: "ההמלצה והבקשה באות קודם, עם מספרים ו-deadline. הרקע הולך למטה." }
    },
    {
      q: { en: "Your proposal was rejected; the team chose another approach. 'Disagree and commit' means:", he: "ההצעה שלך נדחתה; הצוות בחר גישה אחרת. 'Disagree and commit' אומר:" },
      options: [
        { en: "Keep raising it in every meeting until they agree", he: "להעלות את זה בכל פגישה עד שיסכימו" },
        { en: "Help the chosen approach succeed; reopen only with new data", he: "לעזור לגישה שנבחרה להצליח; לפתוח מחדש רק עם דאטה חדש" },
        { en: "Build your version quietly as a backup", he: "לבנות בשקט את הגרסה שלך כגיבוי" },
        { en: "Step away from the project", he: "לפרוש מהפרויקט" }
      ],
      answer: 1,
      explain: { en: "You voiced the dissent while it mattered; now the org needs one direction executed well.", he: "השמעת את ההתנגדות כשזה היה רלוונטי; עכשיו הארגון צריך כיוון אחד שמבוצע טוב." }
    }
  ],
  related: ["staff-design-docs", "staff-interview-loop", "rel-error-budgets", "rel-sli-slo-sla"]
});

// ---------------------------------------------------------------------------
// 26. The Senior / Staff / Principal interview loop
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-interview-loop",
  track: "staff",
  order: 26,
  icon: "🎤",
  level: 3,
  minutes: 17,
  title: {
    en: "The Staff+ Interview Loop: How Senior, Staff & Principal Are Scored",
    he: "לופ הראיונות של Staff+: איך מדרגים Senior, Staff ו-Principal"
  },
  tldr: {
    en: "The questions look the same at every level — what changes is the expected scope: Senior solves the problem given, Staff defines the right problem and drives trade-offs, failure modes, cost and migration across teams, Principal shapes multi-year direction for the org. Show scope explicitly or you get levelled down.",
    he: "השאלות נראות אותו דבר בכל רמה — מה שמשתנה זה ה-scope הצפוי: Senior פותר את הבעיה שנתנו לו, Staff מגדיר את הבעיה הנכונה ומוביל trade-offs, failure modes, עלות ומיגרציה בין צוותים, Principal מעצב כיוון רב-שנתי לארגון. תראה scope במפורש, אחרת תקבל level נמוך יותר."
  },
  analogy: {
    en: "Three chefs get the same request: 'dinner for 200'. The senior chef cooks an excellent meal. The staff chef first asks about allergies, budget, and the venue's kitchen, designs a menu the team can execute in parallel, and has a backup if the oven fails. The principal chef designs how the restaurant group runs catering at all, so every future event goes well. Same request — the interviewers are listening for which chef you are.",
    he: "שלושה שפים מקבלים את אותה בקשה: 'ארוחת ערב ל-200'. השף ה-senior מבשל ארוחה מצוינת. השף ה-staff קודם שואל על אלרגיות, תקציב והמטבח באולם, מתכנן תפריט שהצוות יכול לבצע במקביל, ויש לו גיבוי אם התנור מת. השף ה-principal מתכנן איך רשת המסעדות עושה קייטרינג בכלל, כך שכל אירוע עתידי יצליח. אותה בקשה — המראיינים מקשיבים איזה שף אתה."
  },
  sections: [
    {
      h: { en: "What changes between levels", he: "מה משתנה בין הרמות" },
      body: {
        en: `<table><tr><th>Signal</th><th>Senior</th><th>Staff</th><th>Principal</th></tr>
<tr><td>Scope</td><td>Own team / service</td><td>Several teams, an org-wide area (e.g. the K8s platform)</td><td>The whole engineering org or company, multi-year</td></tr>
<tr><td>Ambiguity</td><td>Clear problem, finds a good solution</td><td>Vague problem; finds the right problem and frames it</td><td>Identifies problems nobody has named yet</td></tr>
<tr><td>Technical depth</td><td>Deep in their stack</td><td>Deep in one area + broad across infra; knows where depth matters</td><td>Industry-level authority in an area; sets standards</td></tr>
<tr><td>Influence</td><td>Leads within the team</td><td>Aligns multiple teams without authority</td><td>Aligns executives; shapes org strategy</td></tr>
<tr><td>Typical story</td><td>"I built the autoscaling for our service"</td><td>"I led the migration of 200 services to EKS"</td><td>"I set the 3-year compute strategy and the build/buy calls behind it"</td></tr></table>
<p>A typical Staff infra loop (4-6 hours): 1-2 <strong>system design</strong> rounds, a <strong>past project deep dive</strong> (sometimes called "architecture review" or "technical retrospective"), 1-2 <strong>leadership/behavioral</strong> rounds, often a <strong>coding</strong> or practical round (troubleshooting, scripting, infra-as-code) with the same bar as Senior, and a hiring-manager conversation. Interviewers write feedback against a rubric; a hiring committee decides level, not just hire/no-hire.</p>`,
        he: `<table><tr><th>Signal</th><th>Senior</th><th>Staff</th><th>Principal</th></tr>
<tr><td>Scope</td><td>הצוות / השירות שלו</td><td>כמה צוותים, תחום ברמת הארגון (למשל פלטפורמת ה-K8s)</td><td>כל ה-engineering או החברה, רב-שנתי</td></tr>
<tr><td>עמימות</td><td>בעיה ברורה, מוצא פתרון טוב</td><td>בעיה עמומה; מוצא את הבעיה הנכונה וממסגר אותה</td><td>מזהה בעיות שאף אחד עוד לא קרא להן בשם</td></tr>
<tr><td>עומק טכני</td><td>עמוק ב-stack שלו</td><td>עמוק בתחום אחד + רחב על פני התשתית; יודע איפה עומק חשוב</td><td>סמכות ברמת התעשייה בתחום; קובע סטנדרטים</td></tr>
<tr><td>השפעה</td><td>מוביל בתוך הצוות</td><td>מיישר כמה צוותים בלי סמכות</td><td>מיישר הנהלה; מעצב אסטרטגיה ארגונית</td></tr>
<tr><td>סיפור טיפוסי</td><td>"בניתי את ה-autoscaling לשירות שלנו"</td><td>"הובלתי את המיגרציה של 200 שירותים ל-EKS"</td><td>"קבעתי את אסטרטגיית ה-compute ל-3 שנים ואת החלטות ה-build/buy מאחוריה"</td></tr></table>
<p>לופ Staff טיפוסי בתשתית (4-6 שעות): 1-2 סבבי <strong>system design</strong>, <strong>past project deep dive</strong> (לפעמים נקרא "architecture review" או "technical retrospective"), 1-2 סבבי <strong>leadership/behavioral</strong>, הרבה פעמים סבב <strong>coding</strong> או פרקטי (troubleshooting, scripting, infra-as-code) עם אותו רף כמו ל-Senior, ושיחה עם ה-hiring manager. המראיינים כותבים feedback מול rubric; hiring committee מחליט על ה-level, לא רק hire/no-hire.</p>`
      }
    },
    {
      h: { en: "System design at Staff level", he: "System design ברמת Staff" },
      body: {
        en: `<p>Same prompt ("design a multi-region metrics platform"), different bar. A Staff answer visibly does all of this:</p>
<ol>
<li><strong>Drives the ambiguity</strong>: asks who the users are, scale (series count, ingest rate), retention, query patterns, budget, team size — then <em>states assumptions</em> and moves on. You lead; the interviewer follows.</li>
<li><strong>Requirements with priorities</strong>: functional + non-functional (availability, latency, cost), and explicit non-goals.</li>
<li><strong>A simple end-to-end design first</strong>, then deep dives where the risk is (ingest hot spots, high-cardinality, cross-region replication).</li>
<li><strong>Trade-offs named and decided</strong>: "Mimir vs a managed service: managed wins below X series because of on-call cost; I'd choose..." Not "it depends" without a decision.</li>
<li><strong>Failure modes</strong>: region loss, a noisy tenant, a bad deploy of the ingester, the metrics system being down during an incident (who monitors the monitor?).</li>
<li><strong>Cost</strong>: back-of-envelope dollars per month, the main cost driver, and one lever to cut it.</li>
<li><strong>Migration path</strong>: how you get from today's Prometheus-per-cluster to this, in phases with dual-running.</li>
<li><strong>Org impact</strong>: who operates it, what teams need to change, how you'd roll it out and drive adoption.</li>
</ol>
<blockquote>⚠️ Production tip: points 6-8 are where Senior and Staff answers differ most. Many strong engineers design a beautiful target system and never mention cost, migration or who runs it — that reads as Senior. Practise with the cases in <code>#/interview</code> and add these three sections to every one.</blockquote>`,
        he: `<p>אותה שאלה ("תתכנן metrics platform רב-אזורי"), רף אחר. תשובת Staff עושה את כל זה באופן גלוי:</p>
<ol>
<li><strong>מובילה את העמימות</strong>: שואלת מי המשתמשים, סקייל (מספר series, קצב ingest), retention, דפוסי query, תקציב, גודל צוות — ואז <em>מצהירה על הנחות</em> וממשיכה. אתה מוביל; המראיין עוקב.</li>
<li><strong>דרישות עם עדיפויות</strong>: functional + non-functional (availability, latency, עלות), ו-non-goals מפורשים.</li>
<li><strong>Design פשוט מקצה לקצה קודם</strong>, ואז deep dives איפה שהסיכון (hot spots ב-ingest, high-cardinality, replication בין regions).</li>
<li><strong>Trade-offs עם שם והחלטה</strong>: "Mimir מול שירות מנוהל: מתחת ל-X series המנוהל מנצח בגלל עלות ה-on-call; הייתי בוחר..." לא "it depends" בלי החלטה.</li>
<li><strong>Failure modes</strong>: נפילת region, tenant רועש, deploy גרוע של ה-ingester, מערכת המטריקות למטה בזמן incident (מי מנטר את המנטר?).</li>
<li><strong>עלות</strong>: חישוב גס של דולרים לחודש, מה מניע את רוב העלות, ומנוף אחד להוריד אותה.</li>
<li><strong>Migration path</strong>: איך מגיעים מ-Prometheus לכל cluster של היום לזה, בשלבים עם dual-running.</li>
<li><strong>Org impact</strong>: מי מתפעל, מה צוותים צריכים לשנות, איך מגלגלים ומניעים אימוץ.</li>
</ol>
<blockquote>⚠️ טיפ: סעיפים 6-8 הם המקום שבו תשובות Senior ו-Staff הכי שונות. הרבה מהנדסים חזקים מתכננים מערכת יעד יפהפייה ולא מזכירים עלות, מיגרציה או מי מתפעל — וזה נקרא כ-Senior. תתרגל עם ה-cases ב-<code>#/interview</code> ותוסיף את שלושת הסעיפים האלה לכל אחד.</blockquote>`
      }
    },
    {
      h: { en: "Past project deep dive and behavioral rounds", he: "Past project deep dive וסבבי behavioral" },
      body: {
        en: `<p><strong>Past project deep dive</strong>: you present one project for ~45 minutes and get drilled. Pick one that shows Staff scope — multi-team, ambiguous start, real trade-offs, measurable result. Prepare:</p>
<ul>
<li>A 2-minute summary: problem, why it mattered (numbers), your role, outcome.</li>
<li>A diagram you can draw from memory, before and after.</li>
<li>The 2-3 hardest decisions, the options you rejected and why.</li>
<li>What went wrong and what you'd do differently — interviewers probe until they find the edge of your knowledge; "I don't know, here's how I'd find out" is fine.</li>
<li>Your personal contribution vs the team's. "We" for the team's work, "I" for your decisions — be precise.</li>
</ul>
<p><strong>Behavioral / leadership</strong>: answer in <strong>STAR</strong> (Situation, Task, Action, Result), but add <strong>scope signals</strong>: how many teams, how much money/traffic, how long, who you had to convince, what changed in the org afterwards. Prepare 6-8 stories that cover: conflict with a peer, influencing without authority, a failure/incident you owned, a hard trade-off, mentoring/sponsoring, saying no, driving a long project to completion, changing your mind.</p>`,
        he: `<p><strong>Past project deep dive</strong>: אתה מציג פרויקט אחד ל-~45 דקות ומקבל חקירה. תבחר אחד שמראה scope של Staff — כמה צוותים, התחלה עמומה, trade-offs אמיתיים, תוצאה מדידה. תכין:</p>
<ul>
<li>סיכום של 2 דקות: הבעיה, למה זה היה חשוב (מספרים), התפקיד שלך, התוצאה.</li>
<li>דיאגרמה שאתה יכול לצייר מהזיכרון, לפני ואחרי.</li>
<li>2-3 ההחלטות הכי קשות, האופציות שדחית ולמה.</li>
<li>מה השתבש ומה היית עושה אחרת — מראיינים חופרים עד שהם מוצאים את קצה הידע שלך; "אני לא יודע, ככה הייתי בודק" זה בסדר גמור.</li>
<li>התרומה האישית שלך מול של הצוות. "אנחנו" לעבודת הצוות, "אני" להחלטות שלך — תהיה מדויק.</li>
</ul>
<p><strong>Behavioral / leadership</strong>: עונים ב-<strong>STAR</strong> (Situation, Task, Action, Result), אבל מוסיפים <strong>scope signals</strong>: כמה צוותים, כמה כסף/תעבורה, כמה זמן, את מי היית צריך לשכנע, מה השתנה בארגון אחרי. תכין 6-8 סיפורים שמכסים: קונפליקט עם peer, השפעה בלי סמכות, כשל/incident שלקחת עליו בעלות, trade-off קשה, mentoring/sponsoring, להגיד לא, להוביל פרויקט ארוך עד הסוף, לשנות את דעתך.</p>`
      }
    },
    {
      h: { en: "Why strong candidates get levelled down", he: "למה מועמדים חזקים מקבלים level נמוך יותר" },
      body: {
        en: `<ul>
<li><strong>Waiting to be led</strong> in system design — asking "what should I do next?" instead of driving the agenda.</li>
<li><strong>No decisions</strong> — listing options and saying "it depends" without choosing and justifying.</li>
<li><strong>Target-state only</strong> — no cost, no migration path, no operations story.</li>
<li><strong>Team-sized stories</strong> — every example is within one team; no cross-team influence, no org-level outcome.</li>
<li><strong>"We" everywhere</strong> — the interviewer can't find what <em>you</em> did.</li>
<li><strong>No failure stories</strong> — or failures blamed on others. Staff candidates are expected to own mistakes and show what they changed.</li>
<li><strong>Depth gaps under drilling</strong> — hand-waving when asked "what exactly happens when the Kafka leader for that partition dies?"</li>
</ul>
<p><strong>A 2-week prep plan</strong> using this app:</p>
<table><tr><th>Days</th><th>Focus</th><th>Where</th></tr>
<tr><td>1-2</td><td>Re-read the Staff track; write your 8 STAR stories with scope numbers</td><td><code>#/track/staff</code></td></tr>
<tr><td>3-6</td><td>One system design case per day out loud, 45 min, adding cost + migration + org impact sections</td><td><code>#/interview</code></td></tr>
<tr><td>7</td><td>Prepare the past-project deep dive: summary, diagram, 3 decisions, what went wrong</td><td>this lesson + <code>#/lesson/staff-design-docs</code></td></tr>
<tr><td>8-9</td><td>Depth refresh on your claimed areas (K8s, networking, data, reliability)</td><td>Kubernetes, Networking, Data, Reliability tracks</td></tr>
<tr><td>10-11</td><td>Mock interviews with a peer: one design, one behavioral, one deep dive</td><td><code>#/interview</code></td></tr>
<tr><td>12</td><td>Coding/practical warm-up (keep the Senior bar)</td><td><code>#/interview</code> coding problems</td></tr>
<tr><td>13-14</td><td>Review notes, sleep, prepare questions for them (team scope, Staff expectations, on-call)</td><td>—</td></tr></table>`,
        he: `<ul>
<li><strong>מחכים שיובילו אותך</strong> ב-system design — שואלים "מה לעשות עכשיו?" במקום להוביל את סדר היום.</li>
<li><strong>אין החלטות</strong> — מונים אופציות ואומרים "it depends" בלי לבחור ולנמק.</li>
<li><strong>רק מצב יעד</strong> — בלי עלות, בלי migration path, בלי סיפור תפעולי.</li>
<li><strong>סיפורים בגודל צוות</strong> — כל דוגמה בתוך צוות אחד; אין השפעה חוצת-צוותים, אין תוצאה ברמת הארגון.</li>
<li><strong>"אנחנו" בכל מקום</strong> — המראיין לא מצליח למצוא מה <em>אתה</em> עשית.</li>
<li><strong>אין סיפורי כישלון</strong> — או כישלונות שמואשמים בהם אחרים. ממועמדי Staff מצפים לקחת בעלות על טעויות ולהראות מה שינו.</li>
<li><strong>פערי עומק תחת חקירה</strong> — נפנופי ידיים כשנשאלים "מה בדיוק קורה כשה-Kafka leader של ה-partition הזה מת?"</li>
</ul>
<p><strong>תוכנית הכנה של שבועיים</strong> עם האפליקציה הזאת:</p>
<table><tr><th>ימים</th><th>פוקוס</th><th>איפה</th></tr>
<tr><td>1-2</td><td>לקרוא שוב את מסלול ה-Staff; לכתוב את 8 סיפורי ה-STAR שלך עם מספרי scope</td><td><code>#/track/staff</code></td></tr>
<tr><td>3-6</td><td>Case אחד של system design ביום בקול רם, 45 דקות, עם סעיפי עלות + מיגרציה + org impact</td><td><code>#/interview</code></td></tr>
<tr><td>7</td><td>להכין את ה-past-project deep dive: סיכום, דיאגרמה, 3 החלטות, מה השתבש</td><td>השיעור הזה + <code>#/lesson/staff-design-docs</code></td></tr>
<tr><td>8-9</td><td>רענון עומק בתחומים שאתה טוען שאתה חזק בהם (K8s, networking, data, reliability)</td><td>מסלולי Kubernetes, Networking, Data, Reliability</td></tr>
<tr><td>10-11</td><td>Mock interviews עם חבר: design אחד, behavioral אחד, deep dive אחד</td><td><code>#/interview</code></td></tr>
<tr><td>12</td><td>חימום coding/פרקטי (שומרים על הרף של Senior)</td><td>בעיות ה-coding ב-<code>#/interview</code></td></tr>
<tr><td>13-14</td><td>לעבור על הסיכומים, לישון, להכין שאלות אליהם (scope של הצוות, ציפיות מ-Staff, on-call)</td><td>—</td></tr></table>`
      }
    }
  ],
  diagram: "Staff system design, 45 min:\n 0-7   clarify + state assumptions (YOU drive)\n 7-12  requirements + non-goals + rough numbers\n12-22  simple end-to-end design\n22-35  deep dives on the riskiest parts + trade-offs DECIDED\n35-42  failure modes, cost/month, migration path, who operates it\n42-45  what you'd do next / open risks",
  handsOn: [
    { cmd: "cp docs/templates/star-story.md interview-prep/stories/03-slo-program.md", what: { en: "Write each STAR story in a file with a 'Scope' line (teams, $, traffic, duration) and a 'Result' line with numbers — then practise saying it in under 3 minutes.", he: "כותבים כל סיפור STAR בקובץ עם שורת 'Scope' (צוותים, דולרים, תעבורה, משך) ושורת 'Result' עם מספרים — ואז מתרגלים להגיד אותו בפחות מ-3 דקות." } },
    { cmd: "git log --author=\"$(git config user.email)\" --since=\"2 years ago\" --pretty=format:'%ad %s' --date=short | grep -iE 'migrat|rfc|adr|slo|postmortem' | head -40", what: { en: "Mine your own history for Staff-scope evidence (migrations, RFCs, ADRs, SLO work) to pick the best deep-dive project and recall real dates and numbers.", he: "כורים את ההיסטוריה שלך כדי למצוא ראיות ל-scope של Staff (מיגרציות, RFCs, ADRs, עבודת SLO) — כדי לבחור את פרויקט ה-deep dive הכי טוב ולזכור תאריכים ומספרים אמיתיים." } },
    { cmd: "kubectl get ns --no-headers | wc -l; kubectl get deploy -A --no-headers | wc -l", what: { en: "Collect real scale numbers from a cluster you ran (namespaces, Deployments) so your stories say '140 services across 9 teams', not 'a lot of services'.", he: "אוספים מספרי סקייל אמיתיים מ-cluster שהרצת (namespaces, Deployments) כדי שהסיפורים שלך יגידו '140 שירותים ב-9 צוותים' ולא 'הרבה שירותים'." } }
  ],
  mnemonic: {
    en: "\"Drive, Decide, Fail, Cost, Migrate, Org\" — the six things a Staff system design must show. For stories: STAR + Scope.",
    he: "\"Drive, Decide, Fail, Cost, Migrate, Org\" — ששת הדברים ש-system design ברמת Staff חייב להראות. לסיפורים: STAR + Scope."
  },
  pitfalls: [
    { en: "Preparing only system design and coding. At Staff level the deep dive and behavioral rounds often decide the level.", he: "להתכונן רק ל-system design ו-coding. ברמת Staff ה-deep dive וסבבי ה-behavioral הרבה פעמים מכריעים את ה-level." },
    { en: "Choosing the most technically impressive project for the deep dive instead of the one with the widest scope and clearest personal role.", he: "לבחור ל-deep dive את הפרויקט הכי מרשים טכנית במקום את זה עם ה-scope הכי רחב והתפקיד האישי הכי ברור." },
    { en: "Over-rotating to leadership and getting soft on depth. Staff loops still drill into internals; 'my team handled that part' loses points.", he: "להגזים בצד ה-leadership ולהתרכך בעומק. לופים של Staff עדיין חופרים ב-internals; 'הצוות שלי טיפל בחלק הזה' מוריד נקודות." }
  ],
  interview: [
    {
      q: { en: "Design an internal Kubernetes platform for 150 service teams. (What would a Staff-level answer include that a Senior one might not?)", he: "תתכנן פלטפורמת Kubernetes פנימית ל-150 צוותי שירות. (מה תשובה ברמת Staff תכלול שתשובת Senior אולי לא?)" },
      a: { en: "Beyond clusters, networking, GitOps and autoscaling: clarifying the real problem (deploy speed? cost? reliability?), multi-tenancy model and its trade-offs, golden paths and what's self-service vs paved, failure modes (control-plane outage, bad platform release hitting 150 teams — so progressive platform rollouts), cost model and chargeback, a migration plan from today's state with dual-running, the platform team's size and on-call, adoption strategy (carrots first), and the success metrics (lead time, pages per team, cost per service).", he: "מעבר ל-clusters, networking, GitOps ו-autoscaling: הבהרת הבעיה האמיתית (מהירות deploy? עלות? reliability?), מודל multi-tenancy וה-trade-offs שלו, golden paths ומה self-service מול paved, failure modes (נפילת control plane, release גרוע של הפלטפורמה שפוגע ב-150 צוותים — ולכן progressive rollout לפלטפורמה), מודל עלויות ו-chargeback, תוכנית מיגרציה מהמצב הנוכחי עם dual-running, גודל צוות ה-platform וה-on-call שלו, אסטרטגיית אימוץ (קודם גזר), ומדדי הצלחה (lead time, pages per team, עלות לשירות)." }
    },
    {
      q: { en: "What's the biggest technical mistake you made, and what changed because of it?", he: "מה הטעות הטכנית הכי גדולה שעשית, ומה השתנה בעקבותיה?" },
      a: { en: "Pick a real, meaningful mistake with impact (e.g. approving a Kafka partition-key design that caused hot partitions at 10× scale). Own it without blaming others, explain how you detected and mitigated it, and — the Staff signal — the systemic change you drove afterwards (a schema/partition review step in the RFC template, a load-test gate in PRR) that prevented the class of problem for other teams.", he: "בוחרים טעות אמיתית ומשמעותית עם impact (למשל אישרת design של partition key ב-Kafka שגרם ל-hot partitions בסקייל פי 10). לוקחים בעלות בלי להאשים אחרים, מסבירים איך זיהית ועשית mitigation, ו — ה-signal של Staff — השינוי המערכתי שהובלת אחר כך (שלב review ל-schema/partition בתבנית ה-RFC, שער load-test ב-PRR) שמנע את סוג הבעיה הזה גם מצוותים אחרים." }
    }
  ],
  quiz: [
    {
      q: { en: "Which behaviour in a system design round most often signals Senior rather than Staff?", he: "איזו התנהגות בסבב system design הכי הרבה פעמים משדרת Senior ולא Staff?" },
      options: [
        { en: "Stating assumptions and moving on", he: "להצהיר על הנחות ולהמשיך" },
        { en: "Designing only the target state with no cost, migration or ownership story", he: "לתכנן רק את מצב היעד בלי עלות, מיגרציה או סיפור בעלות" },
        { en: "Choosing between trade-offs and justifying it", he: "לבחור בין trade-offs ולנמק" },
        { en: "Discussing failure modes", he: "לדון ב-failure modes" }
      ],
      answer: 1,
      explain: { en: "Cost, migration path and who operates it are the org-level dimensions that distinguish Staff answers.", he: "עלות, migration path ומי מתפעל הם הממדים הארגוניים שמבדילים תשובות Staff." }
    },
    {
      q: { en: "In a STAR answer for a Staff role, what should you add?", he: "מה כדאי להוסיף לתשובת STAR לתפקיד Staff?" },
      options: [
        { en: "More technical jargon", he: "יותר ז'רגון טכני" },
        { en: "Scope signals: number of teams, money/traffic, duration, who you influenced, what changed org-wide", he: "Scope signals: מספר צוותים, כסף/תעבורה, משך, את מי השפעת, מה השתנה בארגון" },
        { en: "Your full CV", he: "את קורות החיים המלאים" },
        { en: "Only the Result", he: "רק את ה-Result" }
      ],
      answer: 1,
      explain: { en: "Level is judged by scope and impact; make them explicit and quantified.", he: "ה-level נקבע לפי scope ו-impact; תהפוך אותם למפורשים ומכומתים." }
    },
    {
      q: { en: "What is the past project deep dive mainly testing?", he: "מה בעיקר בודק ה-past project deep dive?" },
      options: [
        { en: "Presentation design skills", he: "כישורי עיצוב מצגות" },
        { en: "Whether you can recite documentation", he: "אם אתה יכול לדקלם דוקומנטציה" },
        { en: "Real scope, your personal decisions and trade-offs, and depth under drilling", he: "Scope אמיתי, ההחלטות וה-trade-offs האישיים שלך, ועומק תחת חקירה" },
        { en: "How many tools you've used", he: "בכמה כלים השתמשת" }
      ],
      answer: 2,
      explain: { en: "Interviewers drill until they find the edge of your knowledge and separate your role from the team's.", he: "המראיינים חופרים עד שהם מוצאים את קצה הידע שלך ומפרידים בין התפקיד שלך לשל הצוות." }
    }
  ],
  related: ["staff-influence", "staff-design-docs", "staff-migrations-at-scale", "staff-large-incidents"]
});

/* ---------------- Glossary ---------------- */
[
  ["Design doc / RFC", "A written proposal for a non-trivial change (context, goals, non-goals, options, decision, risks, rollout, rollback); an RFC is one opened for broad formal review.", "הצעה כתובה לשינוי לא טריוויאלי (context, goals, non-goals, אופציות, החלטה, סיכונים, rollout, rollback); RFC הוא כזה שנפתח ל-review פורמלי רחב.", "staff-design-docs"],
  ["ADR", "Architecture Decision Record: a one-page, immutable record of one decision, its context and consequences, stored next to the code; superseded, never edited.", "Architecture Decision Record: רשומה של עמוד אחד, immutable, של החלטה אחת, ההקשר וההשלכות שלה, שנשמרת ליד הקוד; מחליפים אותה, לא עורכים.", "staff-design-docs"],
  ["TCO", "Total Cost of Ownership: infrastructure plus the people, on-call, upgrades, hiring and exit cost of running something over its lifetime.", "Total Cost of Ownership: תשתית ועוד האנשים, ה-on-call, השדרוגים, הגיוס וה-exit cost של להריץ משהו לאורך כל חייו.", "staff-tech-strategy"],
  ["One-way door", "A decision that is expensive or impossible to reverse (core database, public API, multi-year commit); deserves slow, broad review. Most decisions are two-way doors.", "החלטה שיקר או בלתי אפשרי להחזיר (database ליבה, API ציבורי, commit רב-שנתי); מגיע לה review איטי ורחב. רוב ההחלטות הן two-way doors.", "staff-tech-strategy"],
  ["Tech radar", "A map of technologies in rings Adopt / Trial / Assess / Hold that makes technology choices deliberate and makes saying no impersonal.", "מפה של טכנולוגיות בטבעות Adopt / Trial / Assess / Hold שהופכת בחירות טכנולוגיות למכוונות ואת ה'לא' ללא-אישי.", "staff-tech-strategy"],
  ["PRR", "Production Readiness Review: a launch gate verifying a service can be operated — SLOs, alerts with runbooks, capacity, rollback, dependencies, backups, ownership.", "Production Readiness Review: שער launch שמוודא שאפשר לתפעל שירות — SLOs, alerts עם runbooks, capacity, rollback, תלויות, backups, בעלות.", "staff-production-readiness"],
  ["Toil", "Manual, repetitive, automatable operational work with no enduring value that grows with the service; SRE practice caps it at 50% of a team's time.", "עבודה תפעולית ידנית, חוזרת, שאפשר לאטמט, בלי ערך מתמשך, שגדלה עם השירות; בפרקטיקת SRE מגבילים אותה ל-50% מזמן הצוות.", "staff-production-readiness"],
  ["SEV level", "A predefined incident severity (SEV1 = core flow down for many customers … SEV4 = near miss) based on user impact, which sets who is paged and how comms run.", "חומרת incident מוגדרת מראש (SEV1 = flow מרכזי למטה להרבה לקוחות … SEV4 = near miss) לפי impact על משתמשים, שקובעת את מי מעירים ואיך מתנהלת התקשורת.", "staff-large-incidents"],
  ["Strangler fig", "Migration pattern: route traffic through a layer in front of the old system and move functionality to the new one slice by slice until the old one can be deleted.", "דפוס מיגרציה: מנתבים תעבורה דרך שכבה מול המערכת הישנה ומעבירים פונקציונליות לחדשה פרוסה אחרי פרוסה, עד שאפשר למחוק את הישנה.", "staff-migrations-at-scale"],
  ["Codemod", "An automated code transformation (often opened as PRs for each team) used to migrate many repos at once — e.g. swapping a client library.", "טרנספורמציית קוד אוטומטית (לרוב נפתחת כ-PRs לכל צוות) שמשמשת להעביר הרבה repos בבת אחת — למשל החלפת ספריית client.", "staff-migrations-at-scale"],
  ["BLUF", "Bottom Line Up Front: writing style that puts the decision or ask in the first lines, then the why, then details — the default for executive communication.", "Bottom Line Up Front: סגנון כתיבה שבו ההחלטה או הבקשה בשורות הראשונות, אחר כך הלמה ואז הפרטים — ברירת המחדל לתקשורת עם הנהלה.", "staff-influence"],
  ["Disagree and commit", "Argue openly while a decision is open; once made, support it fully and reopen only with new data.", "חולקים בגלוי כל עוד ההחלטה פתוחה; ברגע שהתקבלה, תומכים בה עד הסוף ופותחים מחדש רק עם דאטה חדש.", "staff-influence"]
].forEach(([term, en, he, lesson]) => window.INFRA.glossary.push({ term, track: "staff", def: { en, he }, lesson }));
