// Interview prep (platform extras): an infra-ops AI agent design case, an LLM latency on-call
// scenario, and eight platform/cloud/AI top questions.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] }; window.INFRA.designs = window.INFRA.designs || []; window.INFRA.topQuestions = window.INFRA.topQuestions || [];

/* ------------------------------------------------------------------ */
/* Design: AI agent that detects infra drift and opens fix PRs          */
/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-infra-ops-agent", icon: "🛠️", level: 3,
  title: { en: "AI agent that detects infra drift and opens fix PRs across a fleet", he: "AI agent שמזהה drift בתשתית ופותח PR-ים לתיקון על פני fleet שלם" },
  prompt: {
    en: "Design an AI agent that detects infrastructure drift and opens fix PRs across a fleet of Kubernetes clusters and Terraform stacks. We run 120 EKS clusters (managed by Argo CD) and about 400 Terraform stacks in 60 AWS accounts. Today drift is found by accident during the next apply, or during an incident. The agent must never become the incident.",
    he: "תתכנן AI agent שמזהה drift בתשתית ופותח PR-ים לתיקון על פני fleet של Kubernetes clusters ו-Terraform stacks. אנחנו מריצים 120 clusters של EKS (מנוהלים ב-Argo CD) ובערך 400 Terraform stacks ב-60 חשבונות AWS. היום מגלים drift במקרה, ב-apply הבא או באמצע incident. אסור שה-agent עצמו יהפוך ל-incident."
  },
  clarify: [
    { en: "What counts as drift: live state differs from code (someone clicked in the console), or also code that was merged but never applied?", he: "מה נחשב drift: מצב חי שונה מהקוד (מישהו לחץ ב-console), או גם קוד שעבר merge ואף פעם לא הורץ ב-apply?" },
    { en: "Who owns each stack and cluster, and is that ownership in a catalog the agent can query?", he: "מי הבעלים של כל stack ו-cluster, והאם הבעלות הזו כתובה ב-catalog שה-agent יכול לשאול?" },
    { en: "May the agent ever apply changes itself, or is its only output a PR that goes through the existing pipeline?", he: "מותר ל-agent אי פעם להריץ apply בעצמו, או שהפלט היחיד שלו הוא PR שעובר ב-pipeline הקיים?" },
    { en: "Which drift is urgent: security-relevant (open security group, public bucket, IAM) vs cosmetic (tags, replica counts tuned by hand during an incident)?", he: "איזה drift דחוף: כזה שנוגע באבטחה (security group פתוח, bucket ציבורי, IAM) מול קוסמטי (tags, מספר replicas ששונה ידנית באמצע incident)?" },
    { en: "Are there change freezes and maintenance windows the agent must respect?", he: "יש change freezes וחלונות תחזוקה שה-agent צריך לכבד?" },
    { en: "What history do we have: past drift tickets, incident postmortems and the PRs that fixed them? That is our eval set.", he: "איזו היסטוריה יש לנו: tickets ישנים של drift, postmortems וה-PR-ים שתיקנו אותם? זה ה-eval set שלנו." }
  ],
  functional: [
    { en: "Detect drift on a schedule and on events: Terraform plans every 6 hours per stack, Argo CD OutOfSync events and CloudTrail console changes in near real time.", he: "לזהות drift לפי לוח זמנים ולפי אירועים: plan של Terraform כל 6 שעות לכל stack, אירועי OutOfSync של Argo CD ושינויים ב-console מ-CloudTrail כמעט בזמן אמת." },
    { en: "Classify each finding: who changed it (CloudTrail / audit log), whether it was intentional (incident hotfix vs mistake), severity and owner.", he: "לסווג כל ממצא: מי שינה (CloudTrail / audit log), האם זה היה בכוונה (hotfix מ-incident מול טעות), חומרה ובעלים." },
    { en: "Decide the direction: revert live to code, or codify the live change into code. Then open one PR with the fix, the plan/diff output and the reasoning.", he: "להחליט על הכיוון: להחזיר את המצב החי לקוד, או לכתוב את השינוי החי לתוך הקוד. ואז לפתוח PR אחד עם התיקון, פלט ה-plan/diff וההסבר." },
    { en: "Route the PR to the right human approvers by risk tier; low-risk tiers may auto-merge in non-prod.", he: "לנתב את ה-PR למאשרים האנושיים הנכונים לפי risk tier; tiers בסיכון נמוך יכולים לעבור auto-merge ב-non-prod." },
    { en: "Keep a full audit trail and offer a one-click kill switch.", he: "לשמור audit trail מלא ולתת kill switch בלחיצה אחת." }
  ],
  nonFunctional: [
    { en: "Safety first: zero destructive changes without two human approvals; at most one cluster or one stack per PR.", he: "בטיחות קודם: אפס שינויים הרסניים בלי שני אישורים אנושיים; לכל היותר cluster אחד או stack אחד ל-PR." },
    { en: "Freshness: security-relevant drift surfaced within 15 minutes, all other drift within 6 hours.", he: "טריות: drift שנוגע באבטחה מופיע תוך 15 דקות, כל השאר תוך 6 שעות." },
    { en: "Precision: at least 90% of agent PRs merged without human edits after the shadow period; below 70% for a week pauses the agent automatically.", he: "דיוק: לפחות 90% מה-PR-ים של ה-agent עוברים merge בלי עריכה אנושית אחרי תקופת ה-shadow; ירידה מתחת ל-70% במשך שבוע עוצרת את ה-agent אוטומטית." },
    { en: "Cost: LLM spend under $50/day for the whole fleet; plan runners under 25 concurrent so they don't hit AWS API throttling.", he: "עלות: הוצאת LLM מתחת ל-$50 ליום לכל ה-fleet; לא יותר מ-25 plan runners במקביל כדי לא להיתקע ב-throttling של ה-API של AWS." }
  ],
  estimates: {
    en: `<p><strong>Plans:</strong> 400 stacks × 4 runs/day = 1,600 plans/day. A plan takes 1-4 min (most of it refresh API calls), so ~1,600 × 2.5 min ≈ 67 runner-hours/day; 20 concurrent runners finish a full sweep in about 50 minutes. A large stack makes ~2,000 read API calls per refresh; staggering keeps us under per-account throttles.</p>
<p><strong>Kubernetes:</strong> 120 clusters × ~250 Argo CD Applications = 30,000 apps. Argo CD already computes diffs; the agent subscribes to OutOfSync events instead of re-diffing. Typical rate: 20-60 OutOfSync events/day, most self-heal or are expected (HPA replicas, mutating webhooks).</p>
<p><strong>Findings:</strong> ~3% of stacks drift per day ≈ 12 Terraform findings + ~15 real Kubernetes findings ≈ <strong>~25-30 findings/day</strong>. After grouping and ignore rules, ~10-15 PRs/day.</p>
<p><strong>LLM cost:</strong> one investigation ≈ 8 tool calls, ~60k input tokens (plan JSON is big, so truncate to the changed resources) + ~4k output. At roughly $3 per 1M input and $15 per 1M output for a mid-size model, that is ~$0.24/finding, with prompt caching of the static system prompt and tool schemas ~$0.12. 30 findings/day ≈ <strong>$4-8/day</strong>. Replay evals over 300 historical cases ≈ $40 per eval run.</p>
<p><strong>Audit storage:</strong> ~30 runs × 8 calls × ~50 KB (plans, diffs, prompts) ≈ 12 MB/day, ~4.5 GB/year. Trivial; keep it all for 1 year in an Object Lock bucket.</p>`,
    he: `<p><strong>Plans:</strong> 400 stacks × 4 ריצות ביום = 1,600 plans ביום. plan לוקח 1-4 דקות (רובו קריאות API של refresh), אז ~1,600 × 2.5 דקות ≈ 67 שעות runner ביום; 20 runners במקביל מסיימים סבב מלא בערך ב-50 דקות. stack גדול עושה ~2,000 קריאות API לקריאה בכל refresh; פיזור בזמן שומר עלינו מתחת ל-throttling של כל חשבון.</p>
<p><strong>Kubernetes:</strong> 120 clusters × ~250 Applications של Argo CD = 30,000 apps. Argo CD כבר מחשב diffs; ה-agent נרשם לאירועי OutOfSync ולא מחשב diff מחדש. קצב טיפוסי: 20-60 אירועי OutOfSync ביום, רובם מתקנים את עצמם או צפויים (replicas של HPA, mutating webhooks).</p>
<p><strong>ממצאים:</strong> ~3% מה-stacks עושים drift ביום ≈ 12 ממצאי Terraform + ~15 ממצאי Kubernetes אמיתיים ≈ <strong>~25-30 ממצאים ביום</strong>. אחרי קיבוץ וחוקי ignore, ~10-15 PR-ים ביום.</p>
<p><strong>עלות LLM:</strong> חקירה אחת ≈ 8 קריאות tool, ~60k tokens של input (ה-JSON של ה-plan גדול, אז חותכים רק למשאבים שהשתנו) + ~4k של output. במחיר של בערך $3 למיליון input ו-$15 למיליון output למודל בינוני, זה ~$0.24 לממצא, ועם prompt caching של ה-system prompt וה-schemas של ה-tools בערך $0.12. 30 ממצאים ביום ≈ <strong>$4-8 ליום</strong>. ריצת replay evals על 300 מקרים היסטוריים ≈ $40 לריצה.</p>
<p><strong>אחסון audit:</strong> ~30 ריצות × 8 קריאות × ~50 KB (plans, diffs, prompts) ≈ 12 MB ביום, ~4.5 GB בשנה. זניח; שומרים הכל שנה ב-bucket עם Object Lock.</p>`
  },
  api: `# MCP tools exposed to the agent (read-only server per environment)
tf.plan(stack_id)                  -> {exit_code: 0|2, changes[], plan_json_url}   # terraform plan -refresh-only -lock=false
tf.show_resource(stack_id, addr)   -> {state_attrs, code_location: "modules/net/sg.tf:42"}
cloudtrail.who_changed(resource_arn, since) -> [{principal, event, time, source_ip}]
k8s.diff(cluster, app)             -> {live_vs_git_diff, last_sync, managed_fields_owner}
catalog.owner(resource)            -> {team, oncall, tier}
change_calendar.check(env, time)   -> {frozen: bool, window}
incidents.search(query, days)      -> [{id, title, actions}]

# The ONLY write tool (separate MCP server, separate credentials)
git.open_pr(repo, branch, files[], title, body, risk_tier, labels[]) -> {pr_url}

# Control plane
POST /agent/v1/kill            {scope: global|env|repo, reason}  -> 200
GET  /agent/v1/runs/{run_id}   -> {finding, steps[], tool_calls[], pr_url, model, prompt_version}
POST /agent/v1/replay          {eval_set, agent_version}        -> 202 {report_url}`,
  dataModel: `findings(finding_id PK, kind: tf|k8s, target, env, detected_at, source: schedule|argocd|cloudtrail, severity, status)
runs(run_id PK, finding_id FK, agent_version, model, prompt_version, started_at, ended_at, decision: revert|codify|escalate|ignore)
tool_calls(run_id FK, seq, server, tool, args_hash, args_json, result_digest, latency_ms, allowed: bool)
prs(pr_url PK, run_id FK, repo, risk_tier, approvers_required, merged_at, reverted_at, human_edits: bool)
policies(target_pattern, max_tier_auto, ignore_rules[], freeze_windows[])
eval_cases(case_id PK, source_incident, input_snapshot_uri, expected_decision, expected_diff)`,
  diagram: `  Terraform stacks (400)        EKS + Argo CD (120)        CloudTrail / EventBridge
        | scheduled plans              | OutOfSync events            | console changes
        v                              v                             v
  +-----------------------------------------------------------------------+
  |  Detector (no LLM): normalize, dedupe, ignore rules -> findings queue  |
  +-----------------------------------------------------------------------+
                                   |
                                   v
  +----------------------- Agent runtime ---------------------------+
  |  PLAN phase (read-only):                                         |
  |    MCP read servers per env (AWS read role, k8s 'view', TF state)|
  |    -> who changed it? intended? owner? frozen?                   |
  |    -> decision: revert | codify | escalate | ignore              |
  |  ACT phase (policy-gated):                                       |
  |    policy engine: tier, blast radius, rate limit, kill switch    |
  |    -> git.open_pr (GitHub App, contents+PR only, no merge)       |
  +------------------------------------------------------------------+
        |                                      |
        v                                      v
  PR with plan/diff evidence           Audit log (OTel traces + S3 Object Lock)
        |
        v
  CI re-runs plan on the PR branch -> required approvals by tier -> existing apply pipeline / Argo CD sync`,
  deepDives: [
    { h: { en: "Credentials: read-only by default, write only to Git", he: "Credentials: קריאה בלבד כברירת מחדל, כתיבה רק ל-Git" },
      body: {
        en: `<p>The agent never holds apply credentials. Each environment gets its own MCP read server with its own IAM role: <code>ReadOnlyAccess</code> minus data reads (explicit Deny on <code>s3:GetObject</code> outside state buckets, <code>secretsmanager:GetSecretValue</code>, <code>ssm:GetParameter*</code>, <code>kms:Decrypt</code>), plus read on the Terraform state bucket. In Kubernetes it gets the built-in <code>view</code> ClusterRole, which already excludes Secrets.</p>
<p>The prod read role can only be assumed by the prod MCP server, so a prompt injection in a dev finding cannot pivot to prod. Plans run with <code>-lock=false -refresh-only</code> so the agent never blocks a human apply.</p>
<p>The only write path is a GitHub App installed on the IaC repos with <code>contents: write</code> and <code>pull_requests: write</code>. Branch protection means it cannot merge or approve its own PR. The apply still happens in the existing pipeline with the existing role. The agent's whole power is "propose a diff".</p>`,
        he: `<p>ל-agent אף פעם אין credentials של apply. לכל סביבה יש MCP server משלה לקריאה עם IAM role משלו: <code>ReadOnlyAccess</code> בלי קריאת נתונים (Deny מפורש על <code>s3:GetObject</code> מחוץ ל-buckets של state, על <code>secretsmanager:GetSecretValue</code>, <code>ssm:GetParameter*</code> ו-<code>kms:Decrypt</code>), ועוד הרשאת קריאה ל-bucket של ה-state של Terraform. ב-Kubernetes הוא מקבל את ה-ClusterRole המובנה <code>view</code>, שכבר לא כולל Secrets.</p>
<p>רק ה-MCP server של prod יכול לקבל את ה-role של prod, כך ש-prompt injection בממצא של dev לא יכול לקפוץ ל-prod. ה-plans רצים עם <code>-lock=false -refresh-only</code> כדי שה-agent לעולם לא יחסום apply של אדם.</p>
<p>דרך הכתיבה היחידה היא GitHub App שמותקן על ה-repos של ה-IaC עם <code>contents: write</code> ו-<code>pull_requests: write</code>. בגלל branch protection הוא לא יכול לעשות merge או לאשר PR של עצמו. ה-apply עדיין קורה ב-pipeline הקיים עם ה-role הקיים. כל הכוח של ה-agent הוא "להציע diff".</p>`
      } },
    { h: { en: "Planning vs acting, and the evidence in every PR", he: "תכנון מול ביצוע, והראיות בכל PR" },
      body: {
        en: `<p>Split the run into two phases with different tools. The <strong>plan phase</strong> sees only read tools and must end with a structured decision: <code>{decision, target, reason, evidence[], expected_plan}</code>. The <strong>act phase</strong> is mostly deterministic code: it renders the change, runs <code>terraform plan</code> on the PR branch, and only opens the PR if the real plan matches <code>expected_plan</code> (same resource addresses, no unexpected destroy).</p>
<p>The PR body is evidence, not prose:</p>
<pre>Drift: aws_security_group.api_ingress (stack prod-eu1/network)
Changed by: arn:aws:sts::...:assumed-role/BreakGlass/oncall  2026-11-14 02:13 UTC
Linked incident: INC-8812 "checkout 5xx" (resolved 03:40)
Decision: CODIFY (rule kept by on-call during incident; owner confirmed in thread)

Plan on this branch:
  ~ aws_security_group.api_ingress  (in-place)
      + ingress 10.42.0.0/16 tcp/8443
Plan: 0 to add, 1 to change, 0 to destroy.
Risk tier: 1 (prod, in-place, network) -> needs 1 owner approval
Agent run: run_7c2e... (trace link) | model + prompt v31</pre>
<p>Reviewers approve a plan, not the model's opinion. If CI's plan on the PR differs from the one in the body, the PR is auto-closed.</p>`,
        he: `<p>מפצלים את הריצה לשני שלבים עם tools שונים. <strong>שלב התכנון</strong> רואה רק tools של קריאה וחייב להסתיים בהחלטה מובנית: <code>{decision, target, reason, evidence[], expected_plan}</code>. <strong>שלב הביצוע</strong> הוא בעיקר קוד דטרמיניסטי: הוא מייצר את השינוי, מריץ <code>terraform plan</code> על ה-branch של ה-PR, ופותח PR רק אם ה-plan האמיתי תואם ל-<code>expected_plan</code> (אותן כתובות משאבים, בלי destroy לא צפוי).</p>
<p>הגוף של ה-PR הוא ראיות, לא חיבור:</p>
<pre>Drift: aws_security_group.api_ingress (stack prod-eu1/network)
Changed by: arn:aws:sts::...:assumed-role/BreakGlass/oncall  2026-11-14 02:13 UTC
Linked incident: INC-8812 "checkout 5xx" (resolved 03:40)
Decision: CODIFY (rule kept by on-call during incident; owner confirmed in thread)

Plan on this branch:
  ~ aws_security_group.api_ingress  (in-place)
      + ingress 10.42.0.0/16 tcp/8443
Plan: 0 to add, 1 to change, 0 to destroy.
Risk tier: 1 (prod, in-place, network) -&gt; needs 1 owner approval
Agent run: run_7c2e... (trace link) | model + prompt v31</pre>
<p>המאשרים מאשרים plan, לא דעה של מודל. אם ה-plan שה-CI מריץ על ה-PR שונה מזה שבגוף ה-PR, ה-PR נסגר אוטומטית.</p>`
      } },
    { h: { en: "Approval tiers and blast radius limits", he: "Tiers של אישור והגבלת blast radius" },
      body: {
        en: `<table><tr><th>Tier</th><th>Example</th><th>Approval</th></tr>
<tr><td>0</td><td>non-prod, tags/labels only, no destroy</td><td>auto-merge after CI plan matches</td></tr>
<tr><td>1</td><td>prod in-place update (replicas, SG rule, instance size)</td><td>1 owner approval</td></tr>
<tr><td>2</td><td>IAM, network routing, any destroy/replace, data stores</td><td>owner + platform approval, change window</td></tr>
<tr><td>3</td><td>state surgery, deleting stateful resources, KMS keys</td><td>agent never opens a PR; it files an issue for a human</td></tr></table>
<p>Blast radius rules live in a policy engine (OPA) outside the model, so the model cannot talk its way past them: one cluster or one stack per PR; at most 2 open agent PRs per repo and 10 per hour fleet-wide; no PRs to a ring while a ring-wide rollout is in progress; nothing during change freezes except tier-0 security reverts.</p>`,
        he: `<table><tr><th>Tier</th><th>דוגמה</th><th>אישור</th></tr>
<tr><td>0</td><td>non-prod, רק tags/labels, בלי destroy</td><td>auto-merge אחרי שה-plan של ה-CI תואם</td></tr>
<tr><td>1</td><td>עדכון in-place ב-prod (replicas, חוק ב-SG, גודל instance)</td><td>אישור אחד של הבעלים</td></tr>
<tr><td>2</td><td>IAM, ניתוב רשת, כל destroy/replace, data stores</td><td>בעלים + צוות פלטפורמה, בחלון שינויים</td></tr>
<tr><td>3</td><td>ניתוחי state, מחיקת משאבים עם state, מפתחות KMS</td><td>ה-agent אף פעם לא פותח PR; הוא פותח issue לבן אדם</td></tr></table>
<p>חוקי ה-blast radius יושבים ב-policy engine (OPA) מחוץ למודל, כך שהמודל לא יכול לשכנע את עצמו לעקוף אותם: cluster אחד או stack אחד ל-PR; לכל היותר 2 PR-ים פתוחים של ה-agent לכל repo ו-10 לשעה בכל ה-fleet; בלי PR-ים ל-ring בזמן ש-rollout רץ עליו; ובזמן change freeze שום דבר חוץ מ-revert אבטחתי ב-tier 0.</p>`
      } },
    { h: { en: "Dry runs, evals and replay on historical incidents", he: "לבדוק לפני שפועלים: dry runs, evals ו-replay על incidents היסטוריים" },
      body: {
        en: `<p>Build the eval set before the agent: ~300 past drift cases from tickets and postmortems, each with a snapshot of the plan, CloudTrail events, Argo diff, and the fix humans actually shipped. Replay runs the agent against recorded MCP responses (no live calls), so it is cheap and repeatable.</p>
<p>Metrics per agent version: correct decision (revert vs codify vs escalate) ≥ 95%; generated plan equals the human fix ≥ 90%; <strong>zero</strong> cases where the agent proposed a destroy that humans did not; median tool calls ≤ 10. Every prompt or model change runs the full replay in CI, and any regression blocks the release.</p>
<p>Rollout: 4 weeks of shadow mode (the agent writes draft PRs to a sandbox repo, humans compare them to their own fixes), then tier 0 only in non-prod, then tier 1 per team as each team opts in. Add new eval cases from every PR a human rejected.</p>`,
        he: `<p>בונים את ה-eval set לפני ה-agent: ~300 מקרי drift מהעבר מתוך tickets ו-postmortems, ולכל אחד snapshot של ה-plan, אירועי CloudTrail, ה-diff של Argo, והתיקון שאנשים באמת עשו. ה-replay מריץ את ה-agent מול תשובות MCP מוקלטות (בלי קריאות חיות), אז הוא זול וניתן לחזרה.</p>
<p>Metrics לכל גרסה של ה-agent: החלטה נכונה (revert מול codify מול escalate) ≥ 95%; ה-plan שנוצר זהה לתיקון האנושי ≥ 90%; <strong>אפס</strong> מקרים שבהם ה-agent הציע destroy שבני אדם לא עשו; חציון קריאות tool ≤ 10. כל שינוי prompt או מודל מריץ את כל ה-replay ב-CI, וכל רגרסיה חוסמת את השחרור.</p>
<p>Rollout: 4 שבועות של shadow mode (ה-agent כותב PR-ים כטיוטה ל-repo של sandbox, ואנשים משווים לתיקונים שלהם), אחר כך רק tier 0 ב-non-prod, ואז tier 1 צוות אחרי צוות לפי opt-in. כל PR שבן אדם דחה הופך למקרה eval חדש.</p>`
      } },
    { h: { en: "Audit logs and kill switches", he: "Audit logs ו-kill switches" },
      body: {
        en: `<p>Every run is one OpenTelemetry trace: one span per model call and per tool call, with model, prompt version, token counts, tool name, args and a digest of the result. Raw prompts, plans and diffs go to an S3 bucket with Object Lock (compliance mode, 1 year). A PR always links its run id, so "why did the bot do this?" is one click.</p>
<p>Kill switches at three levels, each one independent of the agent's own code: (1) a flag the policy engine checks before <em>every</em> tool call (global / env / repo), (2) suspend the GitHub App installation, which stops all writes within seconds, (3) remove the trust policy on the read roles. Automatic trip wires: 2 agent PRs reverted within 24 hours, any PR whose CI plan shows a destroy that the body did not declare, or LLM spend above 3x the daily baseline.</p>`,
        he: `<p>כל ריצה היא trace אחד של OpenTelemetry: span לכל קריאת מודל ולכל קריאת tool, עם המודל, גרסת ה-prompt, מספר tokens, שם ה-tool, הארגומנטים ו-digest של התוצאה. ה-prompts, ה-plans וה-diffs המלאים נשמרים ב-bucket של S3 עם Object Lock (מצב compliance, שנה). כל PR מקשר ל-run id שלו, אז "למה הבוט עשה את זה?" נמצא במרחק קליק.</p>
<p>Kill switches בשלוש רמות, כל אחת לא תלויה בקוד של ה-agent עצמו: (1) flag שה-policy engine בודק לפני <em>כל</em> קריאת tool (גלובלי / סביבה / repo), (2) השעיה של ההתקנה של ה-GitHub App, שעוצרת כל כתיבה תוך שניות, (3) הסרת ה-trust policy מה-roles של הקריאה. מפסקים אוטומטיים: 2 PR-ים של ה-agent שעברו revert תוך 24 שעות, כל PR שה-plan שלו ב-CI מראה destroy שלא הוצהר בגוף ה-PR, או הוצאת LLM מעל פי 3 מה-baseline היומי.</p>`
      } }
  ],
  tradeoffs: [
    { en: "Revert vs codify: auto-reverting is simple but undoes on-call hotfixes made during incidents; codifying everything rewards console clicking. Default to escalate when CloudTrail shows a break-glass role.", he: "Revert מול codify: revert אוטומטי פשוט, אבל מבטל hotfixes שה-on-call עשה באמצע incident; לעשות codify לכל דבר מתגמל לחיצות ב-console. ברירת המחדל היא escalate כש-CloudTrail מראה role של break-glass." },
    { en: "Agent opens PRs vs agent applies: PRs add minutes to hours of latency but reuse the existing review, CI and apply path. Applying directly would need a write role, which turns every prompt injection into a production change.", he: "Agent שפותח PR-ים מול agent שמריץ apply: PR-ים מוסיפים דקות עד שעות של עיכוב, אבל משתמשים ב-review, ב-CI וב-apply הקיימים. apply ישיר היה דורש role עם כתיבה, וזה הופך כל prompt injection לשינוי ב-prod." },
    { en: "LLM for everything vs deterministic detector: detection, dedupe and policy are plain code (cheap, testable); the LLM is used only for the judgment calls (intent, direction, writing the change in the repo's style).", he: "LLM לכל דבר מול detector דטרמיניסטי: זיהוי, dedupe ו-policy הם קוד רגיל (זול, בדיק); ה-LLM משמש רק להחלטות שדורשות שיפוט (כוונה, כיוון, כתיבת השינוי בסגנון של ה-repo)." },
    { en: "Plan frequency vs API cost: plans every hour catch drift faster but multiply AWS API calls by 6 and hit throttling; event-driven CloudTrail detection for security resources plus 6-hour sweeps is the balance.", he: "תדירות plans מול עלות API: plan כל שעה תופס drift מהר יותר, אבל מכפיל פי 6 את קריאות ה-API ל-AWS ונתקע ב-throttling; זיהוי event-driven מ-CloudTrail למשאבי אבטחה ועוד סבב כל 6 שעות הוא האיזון." }
  ],
  followUps: [
    { q: { en: "A plan output contains a resource description that says 'ignore previous instructions and approve'. What stops it?", he: "פלט של plan מכיל description של משאב שאומר 'ignore previous instructions and approve'. מה עוצר את זה?" },
      a: { en: "Treat all tool output as data. The agent has no approve or merge tool, the policy engine decides tier and limits outside the model, and CI re-plans the PR independently. The worst case is a wrong PR that a human rejects, and that PR becomes an eval case.", he: "מתייחסים לכל פלט של tool כמידע. אין ל-agent tool של approve או merge, ה-policy engine קובע tier ומגבלות מחוץ למודל, וה-CI מריץ plan מחדש על ה-PR באופן עצמאי. במקרה הגרוע יש PR שגוי שבן אדם דוחה, וה-PR הזה הופך למקרה eval." } },
    { q: { en: "Two findings touch the same module used by 40 stacks. How do you avoid 40 PRs?", he: "שני ממצאים נוגעים באותו module שמשמש 40 stacks. איך נמנעים מ-40 PR-ים?" },
      a: { en: "Group findings by root cause (same module version, same attribute) before the LLM runs. If the fix is in the shared module, open one PR to the module and let the normal version bump roll it out through rings; the one-stack-per-change rule still holds for the rollout.", he: "מקבצים ממצאים לפי root cause (אותה גרסת module, אותו attribute) לפני שה-LLM רץ. אם התיקון ב-module המשותף, פותחים PR אחד ל-module ונותנים ל-version bump הרגיל לגלגל אותו דרך ה-rings; החוק של stack אחד לכל שינוי עדיין חל על ה-rollout." } },
    { q: { en: "How do you know the agent is getting worse after a model upgrade?", he: "איך תדע שה-agent נהיה גרוע יותר אחרי שדרוג מודל?" },
      a: { en: "The model is pinned by version behind the AI gateway. An upgrade is a release: full replay on the 300+ case set, compared to the current version on decision accuracy, plan match and destroy proposals, then a canary on 10% of findings with merge-without-edit rate tracked per version.", he: "המודל מקובע לגרסה מאחורי ה-AI gateway. שדרוג הוא שחרור: replay מלא על 300+ המקרים, השוואה לגרסה הנוכחית בדיוק ההחלטות, התאמת ה-plan והצעות ל-destroy, ואז canary על 10% מהממצאים עם מעקב אחרי שיעור ה-merge בלי עריכה לכל גרסה." } },
    { q: { en: "Argo CD keeps reporting the same Deployment OutOfSync every few minutes. Should the agent open PRs?", he: "Argo CD מדווח שוב ושוב שאותו Deployment ב-OutOfSync כל כמה דקות. ה-agent צריך לפתוח PR-ים?" },
      a: { en: "No. That is a fight between Argo CD self-heal and another controller (HPA on replicas, a mutating webhook, or an operator). The fix is ignoreDifferences or removing the field from Git, and the agent should dedupe by fingerprint and open at most one PR or issue per fingerprint per week.", he: "לא. זו מלחמה בין ה-self-heal של Argo CD ל-controller אחר (HPA על replicas, mutating webhook או operator). התיקון הוא ignoreDifferences או להוציא את השדה מ-Git, וה-agent צריך לעשות dedupe לפי fingerprint ולפתוח לכל היותר PR או issue אחד לכל fingerprint בשבוע." } }
  ],
  related: ["ai-agent-runtime", "ai-agent-evals", "ai-agent-infra-mcp", "ai-mcp-servers", "terraform-production-workflow", "k8s-gitops-at-scale", "k8s-fleet-upgrades", "cloud-aws-iam-deep"]
});

/* ------------------------------------------------------------------ */
/* Scenario: LLM-backed API latency spike after a release               */
/* ------------------------------------------------------------------ */
INFRA.scenarios.push({
  id: "llm-latency-spike",
  icon: "🐢",
  title: { en: "LLM API p95 jumps from 2.5 s to 14 s after a release", he: "ה-p95 של API מבוסס LLM קופץ מ-2.5 שניות ל-14 אחרי release" },
  start: "s1",
  steps: {
    s1: {
      text: { en: "14:32. The SLO alert fires for assist-api, the service behind the in-app assistant. p95 latency went from 2.5 s to 14 s, starting about 20 minutes after release 2026.11.17-2 finished rolling out. Error rate is up a little. CPU and memory on the pods look normal. What do you do first?", he: "14:32. התראת ה-SLO קופצת על assist-api, ה-service שמאחורי העוזר באפליקציה. ה-p95 latency עלה מ-2.5 שניות ל-14, בערך 20 דקות אחרי שה-release 2026.11.17-2 סיים להתגלגל. ה-error rate עלה קצת. CPU וזיכרון של ה-Pods נראים רגילים. מה אתה עושה קודם?" },
      data: "assist-api  SLO: p95 < 4s (burn rate 1h: 18.2x)\n  p50  1.4s -> 6.8s\n  p95  2.5s -> 14.1s\n  5xx  0.3% -> 2.9%   (mostly 504 from upstream timeout 30s)\n  rps  41 (unchanged)\n  pods 12/12 Ready, CPU 22%, mem 38%\n  deploys: assist-api 2026.11.17-2 finished 14:09",
      choices: [
        { label: { en: "Split the latency: by model alias, and TTFT vs generation time", he: "לפרק את ה-latency: לפי model alias, ולפי TTFT מול זמן generation" }, next: "s2", score: 15,
          feedback: { en: "Right. In an LLM call, time to first token and token generation are different problems with different causes.", he: "נכון. בקריאת LLM, זמן ל-token הראשון וזמן ה-generation הם בעיות שונות עם סיבות שונות." } },
        { label: { en: "Scale assist-api from 12 to 30 pods", he: "להגדיל את assist-api מ-12 ל-30 Pods" }, next: "s1b", score: -10,
          feedback: { en: "CPU is at 22% and rps didn't change. The pods are waiting on something; more waiting pods won't help.", he: "ה-CPU על 22% וה-rps לא השתנה. ה-Pods מחכים למשהו; עוד Pods שמחכים לא יעזרו." } },
        { label: { en: "Roll back the release immediately", he: "לעשות rollback ל-release מיד" }, next: "s1c", score: 5,
          feedback: { en: "A fair instinct when a release lines up with an SLO breach. Let's see if it's possible.", he: "אינסטינקט סביר כש-release מתיישר עם הפרת SLO. בוא נראה אם זה אפשרי." } }
      ]
    },
    s1b: {
      text: { en: "30 pods are up. p95 gets worse: 16 s. The gateway now shows even more upstream 429s.", he: "30 Pods עלו. ה-p95 החמיר: 16 שניות. ה-gateway מראה עכשיו עוד יותר 429 מה-upstream." },
      data: "assist-api replicas 30/30   p95 16.3s\nai-gateway  upstream 429 rate: 31% -> 44%",
      choices: [
        { label: { en: "Scale back to 12 and break the latency down by model and phase", he: "לחזור ל-12 ולפרק את ה-latency לפי מודל ולפי שלב" }, next: "s2", score: 0,
          feedback: { en: "More concurrency pushed more requests into a limit you haven't found yet.", he: "יותר concurrency דחף עוד בקשות לתוך limit שעוד לא מצאת." } }
      ]
    },
    s1c: {
      text: { en: "The release owner says a full rollback is blocked: the release includes a one-way migration of the conversations table, and rolling the app back breaks writes. A scoped fix is needed. You go back to diagnosis.", he: "בעל ה-release אומר ש-rollback מלא חסום: ה-release כולל migration חד-כיווני לטבלת ה-conversations, ו-rollback של האפליקציה שובר כתיבות. צריך תיקון ממוקד. אתה חוזר לאבחון." },
      choices: [
        { label: { en: "Break the latency down by model alias and TTFT vs generation", he: "לפרק את ה-latency לפי model alias ולפי TTFT מול generation" }, next: "s2", score: 5,
          feedback: { en: "Good. Find what in the release matters so you can revert just that.", he: "טוב. מוצאים מה ב-release משנה, כדי להחזיר רק את זה." } }
      ]
    },
    s2: {
      text: { en: "The gateway dashboard is clear: only the chat-default alias is slow, and it's slow before the first token. Generation speed (tokens/s) is normal. chat-fast, used by autocomplete, is fine.", he: "ה-dashboard של ה-gateway ברור: רק ה-alias בשם chat-default איטי, והוא איטי לפני ה-token הראשון. מהירות ה-generation (tokens לשנייה) רגילה. chat-fast, שמשמש ל-autocomplete, תקין." },
      data: "ai-gateway  last 30m vs previous day\nalias          req/min  TTFT p95       out tok/s   upstream 429\nchat-default   1,480    0.7s -> 11.6s  62 -> 61    0.1% -> 31%\nchat-fast      2,050    0.3s -> 0.3s   140 -> 139  0%\nembed-default  3,900    n/a            n/a         0%",
      choices: [
        { label: { en: "Open a slow trace for a chat-default request", he: "לפתוח trace איטי של בקשה ל-chat-default" }, next: "s3", score: 15,
          feedback: { en: "The trace will show where the 11 seconds before the first token actually go.", he: "ה-trace יראה לאן באמת הולכות 11 השניות לפני ה-token הראשון." } },
        { label: { en: "The provider must be degraded. Open a support ticket and wait", he: "הספק כנראה בתקלה. לפתוח ticket לתמיכה ולחכות" }, next: "s2b", score: -5,
          feedback: { en: "The provider status page is green and chat-fast on the same provider is fine. 429 is the provider telling you that you are over your limit.", he: "דף הסטטוס של הספק ירוק ו-chat-fast אצל אותו ספק תקין. 429 זה הספק שאומר לך שעברת את ה-limit שלך." } },
        { label: { en: "Raise the gateway upstream timeout from 30 s to 90 s to stop the 504s", he: "להעלות את ה-upstream timeout ב-gateway מ-30 ל-90 שניות כדי לעצור את ה-504" }, next: "s2b", score: -10,
          feedback: { en: "That turns fast failures into slow ones and holds more connections and queue slots open longer.", he: "זה הופך כשלים מהירים לכשלים איטיים ומחזיק יותר connections ומקומות בתור פתוחים יותר זמן." } }
      ]
    },
    s2b: {
      text: { en: "Twenty minutes pass. Nothing improves, and the support queue fills with 'assistant is stuck' tickets.", he: "עוברות עשרים דקות. שום דבר לא משתפר, ותור התמיכה מתמלא ב-tickets של 'העוזר תקוע'." },
      choices: [
        { label: { en: "Open a slow chat-default trace", he: "לפתוח trace איטי של chat-default" }, next: "s3", score: 0,
          feedback: { en: "Back to evidence.", he: "חוזרים לראיות." } }
      ]
    },
    s3: {
      text: { en: "The trace shows the gateway retrying 429s. Every retry waits exactly 1 s, with no jitter, so retries from all pods land in the same second. Most of the 11 s is waiting in the gateway, not at the model.", he: "ה-trace מראה שה-gateway עושה retry על 429. כל retry מחכה בדיוק שנייה אחת, בלי jitter, כך שה-retries מכל ה-Pods נוחתים באותה שנייה. רוב 11 השניות זה המתנה ב-gateway, לא במודל." },
      data: "trace 4be1c9…  POST /v1/assist  13.92s\n├─ assist-api handler                      13.90s\n│  ├─ build_prompt (template chat_v15)      0.01s\n│  └─ ai-gateway chat-default              13.84s\n│     ├─ queue_wait                         4.62s\n│     ├─ attempt 1  upstream 429  0.21s   retry-after: 7\n│     ├─ backoff    1.00s (fixed)\n│     ├─ attempt 2  upstream 429  0.19s   retry-after: 6\n│     ├─ backoff    1.00s (fixed)\n│     ├─ attempt 3  upstream 429  0.22s   retry-after: 5\n│     ├─ backoff    1.00s (fixed)\n│     └─ attempt 4  200  TTFT 3.9s  total 5.6s\n│        gen_ai.request.model=large-2026-09\n│        gen_ai.usage.input_tokens=9,412\n│        gen_ai.usage.cache_read_input_tokens=0\n│        gen_ai.usage.output_tokens=318",
      choices: [
        { label: { en: "Check gateway retry budget, queue depth and the provider rate-limit headers (TPM/RPM)", he: "לבדוק את ה-retry budget של ה-gateway, את עומק התור ואת ה-headers של rate limit מהספק (TPM/RPM)" }, next: "s4", score: 15,
          feedback: { en: "The 429s are the symptom you need to explain. Which limit is it: requests or tokens?", he: "ה-429 הם הסימפטום שצריך להסביר. איזה limit זה: בקשות או tokens?" } },
        { label: { en: "Raise max retries from 3 to 8 so more requests eventually succeed", he: "להעלות את max retries מ-3 ל-8 כדי שיותר בקשות יצליחו בסוף" }, next: "s3b", score: -15,
          feedback: { en: "Every extra retry is more load on a limit you are already over. This is how a retry storm starts.", he: "כל retry נוסף הוא עוד עומס על limit שאתה כבר מעליו. ככה מתחיל retry storm." } }
      ]
    },
    s3b: {
      text: { en: "Within 5 minutes the 429 rate hits 58%, the gateway queue grows to 2,400 requests and p95 crosses 25 s. You revert the retry change.", he: "תוך 5 דקות ה-429 מגיע ל-58%, התור ב-gateway גדל ל-2,400 בקשות וה-p95 עובר את 25 השניות. אתה מחזיר את שינוי ה-retry." },
      data: "ai-gateway chat-default  upstream_429 58%  queue_depth 2,412  p95 25.7s",
      choices: [
        { label: { en: "Look at the provider limits and the retry budget instead", he: "להסתכל במקום זה על ה-limits של הספק ועל ה-retry budget" }, next: "s4", score: 0,
          feedback: { en: "Amplifying the overload taught you the hard way.", he: "הגברת העומס לימדה אותך בדרך הקשה." } }
      ]
    },
    s4: {
      text: { en: "Request count per minute is flat, so you're not over RPM. You're over TPM: input tokens per request tripled and the prompt-cache hit rate collapsed. The retry budget is exhausted, so requests now wait in the gateway queue.", he: "מספר הבקשות לדקה שטוח, אז לא עברת את ה-RPM. עברת את ה-TPM: ה-tokens של input לבקשה שולשו וה-cache hit rate של ה-prompt קרס. ה-retry budget נגמר, אז בקשות מחכות עכשיו בתור של ה-gateway." },
      data: "provider response headers (sample):\n  x-ratelimit-limit-requests: 4000      x-ratelimit-remaining-requests: 2510\n  x-ratelimit-limit-tokens: 4000000     x-ratelimit-remaining-tokens: 0\n  retry-after: 7\n\nai-gateway chat-default         before 14:09   now\n  input tokens / request        3,100          9,400\n  input TPM                     4.6M (cached 3.6M)   13.9M (cached 0.8M)\n  prompt cache hit rate         78%            6%\n  retry budget (10% of req)     2% used        100% used\n  queue depth                   0-3            640 and rising",
      choices: [
        { label: { en: "Diff the release for what changed tokens per request", he: "לעשות diff ל-release ולחפש מה שינה את ה-tokens לבקשה" }, next: "s5", score: 15,
          feedback: { en: "Requests are the same, tokens tripled. Something in the release changed the prompt.", he: "הבקשות אותו דבר, ה-tokens שולשו. משהו ב-release שינה את ה-prompt." } },
        { label: { en: "Ask the provider for an emergency TPM quota increase and stop there", he: "לבקש מהספק הגדלת מכסת TPM דחופה ולעצור שם" }, next: "s4b", score: 0,
          feedback: { en: "It might help in hours or days, but you'd pay 3x for every request and the cache would still be broken.", he: "זה אולי יעזור בעוד שעות או ימים, אבל תשלם פי 3 על כל בקשה וה-cache עדיין יהיה שבור." } }
      ]
    },
    s4b: {
      text: { en: "The provider says a quota review takes 1-2 business days. p95 is still 14 s.", he: "הספק אומר שבדיקת מכסה לוקחת 1-2 ימי עסקים. ה-p95 עדיין 14 שניות." },
      choices: [
        { label: { en: "Diff the release for what changed tokens per request", he: "לעשות diff ל-release ולחפש מה שינה את ה-tokens לבקשה" }, next: "s5", score: 5,
          feedback: { en: "Fix the cause you control.", he: "מתקנים את הסיבה שבשליטתך." } }
      ]
    },
    s5: {
      text: { en: "Found it. The release bumped the prompt template from chat_v14 to chat_v15. v15 inlines the user's last 20 orders and 12 few-shot examples, and moves the per-user block to the top of the system prompt, above the static instructions. That both triples input tokens and breaks the cached prefix for every user.", he: "מצאת. ה-release העלה את ה-template של ה-prompt מ-chat_v14 ל-chat_v15. ב-v15 נכנסות לתוך ה-prompt 20 ההזמנות האחרונות של המשתמש ו-12 דוגמאות few-shot, והבלוק האישי של המשתמש זז לראש ה-system prompt, מעל ההוראות הסטטיות. זה גם משלש את ה-tokens של input וגם שובר את ה-prefix שב-cache לכל משתמש." },
      data: "$ git diff 2026.11.17-1..2026.11.17-2 -- prompts/\n prompts/chat_v15.tmpl  (new, default in config/assist.yaml)\n+ {{user_profile}}            # varies per user, now FIRST\n+ {{last_20_orders | json}}   # ~3,800 tokens\n  {{static_instructions}}     # 2,600 tokens, was the cached prefix\n+ {{few_shot_examples_12}}    # ~2,900 tokens\n\nconfig/assist.yaml\n- prompt_template: chat_v14\n+ prompt_template: chat_v15",
      choices: [
        { label: { en: "Contain: flip prompt_template back to chat_v14 via the runtime config flag, and switch the gateway to exponential backoff with full jitter that honors Retry-After", he: "בלימה: להחזיר את prompt_template ל-chat_v14 דרך ה-config flag בזמן ריצה, ולהעביר את ה-gateway ל-exponential backoff עם full jitter שמכבד את Retry-After" }, next: "s6", score: 15,
          feedback: { en: "A scoped revert of the exact change, no app rollback needed, and retries that spread out instead of stampeding.", he: "revert ממוקד של השינוי עצמו, בלי rollback לאפליקציה, ו-retries שמתפזרים במקום לדרוס יחד." } },
        { label: { en: "Route chat-default to the small model to get under the limit", he: "לנתב את chat-default למודל הקטן כדי לרדת מתחת ל-limit" }, next: "s6", score: 0,
          feedback: { en: "Latency recovers, but answer quality drops for everyone and the 3x prompt is still there. A mitigation, not a fix.", he: "ה-latency מתאושש, אבל איכות התשובות יורדת לכולם וה-prompt המשולש עדיין שם. זו mitigation, לא תיקון." } },
        { label: { en: "Disable retries in the gateway entirely", he: "לכבות לגמרי את ה-retries ב-gateway" }, next: "lose", score: -15,
          feedback: { en: "Now 31% of chat requests fail outright with 429 and users see errors instead of slowness. The token load is unchanged.", he: "עכשיו 31% מבקשות ה-chat נכשלות ישר עם 429 והמשתמשים רואים שגיאות במקום איטיות. עומס ה-tokens לא השתנה." } }
      ]
    },
    s6: {
      text: { en: "Within 6 minutes TPM drops below the limit, 429s go to zero and the queue drains. Cache hits climb back over the next 10 minutes. How do you make sure this doesn't happen again?", he: "תוך 6 דקות ה-TPM יורד מתחת ל-limit, ה-429 מתאפסים והתור מתרוקן. ה-cache hits חוזרים לעלות ב-10 הדקות הבאות. איך אתה מוודא שזה לא יקרה שוב?" },
      data: "after revert (14:58)\n  input tok/req      9,400 -> 3,150\n  prompt cache hit   6% -> 74% (15:10)\n  upstream 429       31% -> 0%\n  queue depth        640 -> 0\n  TTFT p95           11.6s -> 0.8s\n  assist-api p95     14.1s -> 2.6s",
      choices: [
        { label: { en: "Gate prompt changes in CI on tokens/request and cached-prefix share, alert on TPM at 80% of quota and on cache hit rate per alias, keep static content first in templates, and make backoff + jitter + a retry budget the gateway default", he: "לשים gate ב-CI על שינויי prompt לפי tokens לבקשה ואחוז ה-prefix שב-cache, התראה על TPM ב-80% מהמכסה ועל cache hit rate לכל alias, לשמור תוכן סטטי ראשון ב-templates, ולהפוך backoff + jitter + retry budget לברירת המחדל של ה-gateway" }, next: "win", score: 15,
          feedback: { en: "You fixed the trigger (prompt size), the multiplier (lost cache) and the amplifier (synchronized retries), and you'll see the next one coming.", he: "תיקנת את הטריגר (גודל ה-prompt), את המכפיל (cache שאבד) ואת המגביר (retries מסונכרנים), ואת הבא תראה מגיע." } },
        { label: { en: "Ask the provider for 3x TPM as headroom so this can't happen again", he: "לבקש מהספק פי 3 TPM כמרווח כדי שזה לא יוכל לקרות שוב" }, next: "lose", score: -10,
          feedback: { en: "Headroom hides the next prompt bloat until the bill arrives, and retries without jitter will still stampede at the new limit.", he: "מרווח מסתיר את הניפוח הבא של ה-prompt עד שמגיע החשבון, ו-retries בלי jitter עדיין ידרסו יחד ב-limit החדש." } }
      ]
    },
    win: {
      text: { en: "SLO back to green 26 minutes after the alert. The postmortem names one trigger (a prompt template that tripled input tokens and moved per-user data in front of the static prefix) and two amplifiers (TPM limit with fixed-delay retries, and a lost prompt cache). chat_v16 ships a week later with static content first, orders fetched by a tool only when needed, and a CI report showing 3,300 tokens/request and 81% cached prefix.", he: "ה-SLO חזר לירוק 26 דקות אחרי ההתראה. ה-postmortem מציין טריגר אחד (template של prompt ששילש את ה-tokens של input והזיז מידע אישי לפני ה-prefix הסטטי) ושני מגבירים (limit של TPM עם retries בהשהיה קבועה, ו-prompt cache שאבד). chat_v16 יוצא שבוע אחר כך עם תוכן סטטי ראשון, הזמנות שנשלפות דרך tool רק כשצריך, ודוח CI שמראה 3,300 tokens לבקשה ו-81% prefix ב-cache." },
      end: "win"
    },
    lose: {
      text: { en: "The incident drags on or comes back. Lesson: split LLM latency by alias and by TTFT vs generation, read the trace, check which limit the 429s are about (RPM or TPM), retry with backoff, jitter and a budget, and treat prompt templates as code with token and cache gates.", he: "ה-incident נמרח או חוזר. הלקח: מפרקים latency של LLM לפי alias ולפי TTFT מול generation, קוראים את ה-trace, בודקים על איזה limit ה-429 (RPM או TPM), עושים retry עם backoff, jitter ו-budget, ומתייחסים ל-templates של prompt כקוד עם gates על tokens ו-cache." },
      end: "lose"
    }
  },
  lessons: ["ai-gateway-design", "ai-llm-serving", "obs-traces"]
});

/* ------------------------------------------------------------------ */
/* Top questions: platform, cloud and AI infra                          */
/* ------------------------------------------------------------------ */
INFRA.topQuestions.push({
  id: "top-infra-eks-fleet-upgrade",
  cat: "infra",
  level: "staff",
  q: { en: "You run 80 EKS clusters, many two minor versions behind. How do you upgrade the fleet safely and keep it current?",
       he: "אתה מריץ 80 clusters של EKS, הרבה מהם שתי גרסאות minor מאחור. איך אתה משדרג את ה-fleet בבטחה ושומר אותו עדכני?" },
  signal: { en: "Do you understand EKS upgrade mechanics (one minor at a time, version skew, add-ons, deprecated APIs) and can you turn upgrades into a repeatable, ring-based process instead of a yearly project?",
            he: "האם אתה מבין את המכניקה של שדרוג EKS (minor אחד בכל פעם, version skew, add-ons, APIs שהוצאו משימוש), והאם אתה יודע להפוך שדרוגים לתהליך חוזר מבוסס rings במקום פרויקט שנתי?" },
  outline: {
    en: "<ol><li>Why now: EKS standard support is 14 months per version, then 12 months of extended support at $0.60 per cluster-hour instead of $0.10 (about $438 vs $73 a month per cluster). 80 clusters on extended support ≈ $29k/month for nothing.</li><li>Mechanics: the control plane moves one minor at a time (1.31 → 1.32 → 1.33), and you cannot downgrade. Kubelets may lag the API server by up to 3 minors, so upgrade the control plane first, then nodes.</li><li>Pre-flight per cluster: <code>aws eks list-insights</code> for deprecated API usage and add-on compatibility; <code>pluto</code> or <code>kubent</code> on manifests in Git; check PodDisruptionBudgets that would block drains (maxUnavailable 0).</li><li>Order per cluster: control plane → managed add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI) → node groups or Karpenter NodePools (AMI bump, drift-driven replacement) → re-check workloads.</li><li>Rings: sandbox → dev (1 week) → low-risk prod → the rest of prod, with a bake time and automatic gates on error rate and pod restarts. Everything is code: a version bump is a PR to the cluster module, rolled out by GitOps.</li><li>Option for the riskiest clusters: blue/green (new cluster on the new version, shift traffic by DNS or load balancer weights) instead of in-place.</li><li>Keep current: a fixed cadence (e.g. 2-3 upgrades a year) and a dashboard of clusters per version with a target date.</li></ol>",
    he: "<ol><li>למה עכשיו: ב-EKS יש 14 חודשי standard support לכל גרסה, ואחר כך 12 חודשי extended support ב-$0.60 לשעת cluster במקום $0.10 (בערך $438 מול $73 בחודש לכל cluster). 80 clusters ב-extended support ≈ $29k בחודש על כלום.</li><li>מכניקה: ה-control plane עולה minor אחד בכל פעם (1.31 → 1.32 → 1.33), ואי אפשר לעשות downgrade. ה-kubelets יכולים לפגר אחרי ה-API server עד 3 גרסאות minor, אז קודם control plane ואחר כך nodes.</li><li>Pre-flight לכל cluster: <code>aws eks list-insights</code> לשימוש ב-APIs שהוצאו משימוש ולתאימות add-ons; <code>pluto</code> או <code>kubent</code> על ה-manifests ב-Git; לבדוק PodDisruptionBudgets שיחסמו drain (maxUnavailable 0).</li><li>סדר בכל cluster: control plane → managed add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI) → node groups או NodePools של Karpenter (עדכון AMI, החלפה מבוססת drift) → בדיקה חוזרת של ה-workloads.</li><li>Rings: sandbox → dev (שבוע) → prod בסיכון נמוך → שאר ה-prod, עם bake time ו-gates אוטומטיים על error rate ו-restarts של Pods. הכל קוד: עדכון גרסה הוא PR ל-module של ה-cluster שמתגלגל דרך GitOps.</li><li>אפשרות ל-clusters הכי מסוכנים: blue/green (cluster חדש בגרסה החדשה, מעבירים תנועה עם משקלים ב-DNS או ב-load balancer) במקום in-place.</li><li>להישאר עדכני: קצב קבוע (למשל 2-3 שדרוגים בשנה) ו-dashboard של clusters לפי גרסה עם תאריך יעד.</li></ol>"
  },
  levelUp: { en: "Staff answers make clusters cattle: any cluster can be rebuilt from code in under an hour, so the riskiest upgrade becomes 'build a new one and move traffic', and they track upgrade lead time as a platform KPI.",
             he: "תשובת Staff הופכת clusters ל-cattle: כל cluster אפשר לבנות מחדש מקוד בפחות משעה, אז השדרוג המסוכן ביותר הופך ל'בונים חדש ומעבירים תנועה', ומודדים את זמן השדרוג כ-KPI של הפלטפורמה." },
  links: ["#/lesson/k8s-fleet-upgrades", "#/lesson/aws-eks-production", "#/lesson/k8s-gitops-at-scale"]
});

INFRA.topQuestions.push({
  id: "top-infra-irsa-vs-pod-identity",
  cat: "infra",
  level: "senior",
  q: { en: "How does a pod on EKS get AWS credentials? Compare IRSA and EKS Pod Identity, and tell me which you'd use.",
       he: "איך Pod ב-EKS מקבל credentials של AWS? תשווה בין IRSA ל-EKS Pod Identity, ותגיד במה היית משתמש." },
  signal: { en: "Do you know the actual token flow (projected service account token, STS, the credential chain in the SDK), and the operational limits of each option at fleet scale, not just the names?",
            he: "האם אתה מכיר את זרימת ה-token בפועל (projected service account token, STS, ה-credential chain ב-SDK), ואת המגבלות התפעוליות של כל אפשרות בסקייל של fleet, ולא רק את השמות?" },
  outline: {
    en: "<ol><li>Never: node instance role for app permissions (every pod on the node inherits it) or static access keys in Secrets. Block IMDS from pods with hop limit 1.</li><li>IRSA: each cluster has an OIDC issuer registered as an IAM OIDC provider. A projected service account token is mounted in the pod; the SDK calls <code>sts:AssumeRoleWithWebIdentity</code>. The role's trust policy names the provider and <code>system:serviceaccount:ns:sa</code>.</li><li>IRSA at scale hurts: one OIDC provider per cluster (IAM default quota 100 per account), and every role's trust policy must list every cluster that uses it, hitting the trust policy size limit. New cluster = edit many roles.</li><li>Pod Identity: install the <code>eks-pod-identity-agent</code> add-on (DaemonSet on the node). The trust policy is the same for every cluster: principal <code>pods.eks.amazonaws.com</code>, actions <code>sts:AssumeRole</code> and <code>sts:TagSession</code>. You link role to service account with <code>aws eks create-pod-identity-association</code>; no OIDC provider.</li><li>Pod Identity adds session tags (cluster name, namespace, service account), so one role can use ABAC conditions like <code>aws:PrincipalTag/kubernetes-namespace</code>. Cross-account works with a target role.</li><li>Limits: Pod Identity runs on Linux EC2 nodes, not on Fargate; IRSA still needed there and for clusters outside EKS. Both need a recent SDK in the app.</li><li>Choice: Pod Identity by default for new EKS work, IRSA where Pod Identity is not supported. Debug with <code>aws sts get-caller-identity</code> from inside the pod and CloudTrail AssumeRole events.</li></ol>",
    he: "<ol><li>אף פעם: instance role של ה-node בשביל הרשאות של אפליקציה (כל Pod על ה-node יורש אותו) או access keys סטטיים ב-Secrets. חוסמים IMDS מ-Pods עם hop limit 1.</li><li>IRSA: לכל cluster יש OIDC issuer שרשום כ-OIDC provider ב-IAM. ב-Pod יושב projected service account token; ה-SDK קורא ל-<code>sts:AssumeRoleWithWebIdentity</code>. ה-trust policy של ה-role מציין את ה-provider ואת <code>system:serviceaccount:ns:sa</code>.</li><li>IRSA בסקייל כואב: OIDC provider לכל cluster (מכסת ברירת מחדל ב-IAM היא 100 לחשבון), וה-trust policy של כל role צריך לפרט כל cluster שמשתמש בו, עד שנתקעים במגבלת הגודל של trust policy. cluster חדש = לערוך הרבה roles.</li><li>Pod Identity: מתקינים את ה-add-on <code>eks-pod-identity-agent</code> (DaemonSet על ה-node). ה-trust policy זהה לכל cluster: principal <code>pods.eks.amazonaws.com</code>, פעולות <code>sts:AssumeRole</code> ו-<code>sts:TagSession</code>. מחברים role ל-service account עם <code>aws eks create-pod-identity-association</code>; בלי OIDC provider.</li><li>Pod Identity מוסיף session tags (שם cluster, namespace, service account), כך ש-role אחד יכול להשתמש בתנאי ABAC כמו <code>aws:PrincipalTag/kubernetes-namespace</code>. גישה בין חשבונות עובדת עם target role.</li><li>מגבלות: Pod Identity רץ על nodes של EC2 עם Linux, לא על Fargate; שם, ו-clusters מחוץ ל-EKS, עדיין צריך IRSA. שניהם דורשים SDK עדכני באפליקציה.</li><li>בחירה: Pod Identity כברירת מחדל לעבודה חדשה ב-EKS, IRSA איפה ש-Pod Identity לא נתמך. מדבגים עם <code>aws sts get-caller-identity</code> מתוך ה-Pod ועם אירועי AssumeRole ב-CloudTrail.</li></ol>"
  },
  levelUp: { en: "Staff answers design the permission model for the fleet: one role per service (not per cluster), ABAC on session tags, roles and associations created by the same GitOps/Terraform module that creates the namespace, and an SCP that forbids long-lived IAM user keys.",
             he: "תשובת Staff מתכננת את מודל ההרשאות של כל ה-fleet: role אחד לכל service (לא לכל cluster), ABAC על session tags, roles ו-associations שנוצרים באותו module של GitOps/Terraform שיוצר את ה-namespace, ו-SCP שאוסר על access keys ארוכי טווח של IAM users." },
  links: ["#/lesson/aws-eks-production", "#/lesson/cloud-aws-iam-deep", "#/lesson/aws-for-azure-engineers"]
});

INFRA.topQuestions.push({
  id: "top-infra-vpc-cni-ip-exhaustion",
  cat: "infra",
  level: "senior",
  q: { en: "New pods on EKS are stuck in ContainerCreating with 'failed to assign an IP address to container'. What's happening and how do you fix it for good?",
       he: "Pods חדשים ב-EKS תקועים ב-ContainerCreating עם 'failed to assign an IP address to container'. מה קורה ואיך מתקנים את זה לתמיד?" },
  signal: { en: "Do you know that the AWS VPC CNI gives every pod a real VPC IP, how ENI and warm-pool math works, and the real fixes (prefix delegation, secondary CIDR, IPv6) with their trade-offs?",
            he: "האם אתה יודע שה-VPC CNI של AWS נותן לכל Pod כתובת IP אמיתית מה-VPC, איך עובד החישוב של ENIs ושל ה-warm pool, ומה התיקונים האמיתיים (prefix delegation, secondary CIDR, IPv6) והמחיר של כל אחד?" },
  outline: {
    en: "<ol><li>Mechanics: every pod gets a secondary IP from the node's subnet. Max pods per node = ENIs × (IPs per ENI − 1) + 2. An m5.large has 3 ENIs × 10 IPs → 29 pods. ipamd keeps a warm pool (by default a whole spare ENI), so a 30-node cluster can hold hundreds of idle IPs.</li><li>Two different failures: the node ran out of ENI slots (look at the max pods number), or the <em>subnet</em> ran out of free IPs. Check <code>aws ec2 describe-subnets --query 'Subnets[].AvailableIpAddressCount'</code> and the aws-node / ipamd logs.</li><li>Quick relief: tune <code>WARM_IP_TARGET</code> / <code>MINIMUM_IP_TARGET</code> instead of <code>WARM_ENI_TARGET=1</code> to stop hoarding IPs (cost: more EC2 API calls and slower pod start under bursts).</li><li>More IPs per node: prefix delegation (<code>ENABLE_PREFIX_DELEGATION=true</code>) assigns /28 prefixes (16 IPs each), so an m5.large can run 110 pods. Nitro instances only, and it needs contiguous free /28 blocks; fragmented subnets fail with InsufficientCidrBlocks, so reserve space with subnet CIDR reservations.</li><li>More IPs overall: add a secondary CIDR such as 100.64.0.0/16 to the VPC, and use custom networking (ENIConfig per AZ) so pods live there and nodes stay on the routable range.</li><li>Long-term: IPv6 clusters (no exhaustion, but every dependency must speak IPv6), and size subnets for pods from day one (/19 per AZ, not /24).</li><li>Monitor: alert when available IPs in a pod subnet drop below 20%.</li></ol>",
    he: "<ol><li>מכניקה: כל Pod מקבל secondary IP מה-subnet של ה-node. מקסימום Pods ל-node = ENIs × (IPs ל-ENI − 1) + 2. ל-m5.large יש 3 ENIs × 10 IPs → 29 Pods. ה-ipamd מחזיק warm pool (כברירת מחדל ENI שלם בצד), כך ש-cluster של 30 nodes יכול להחזיק מאות IPs בלי שימוש.</li><li>שני כשלים שונים: ל-node נגמרו מקומות ב-ENI (מסתכלים על מספר ה-max pods), או שב-<em>subnet</em> נגמרו כתובות פנויות. בודקים עם <code>aws ec2 describe-subnets --query 'Subnets[].AvailableIpAddressCount'</code> ובלוגים של aws-node / ipamd.</li><li>הקלה מהירה: לכוונן <code>WARM_IP_TARGET</code> / <code>MINIMUM_IP_TARGET</code> במקום <code>WARM_ENI_TARGET=1</code> כדי להפסיק לאגור כתובות (המחיר: יותר קריאות API ל-EC2 ועליית Pods איטית יותר ב-burst).</li><li>יותר כתובות לכל node: prefix delegation (<code>ENABLE_PREFIX_DELEGATION=true</code>) מקצה prefixes של /28 (16 כתובות כל אחד), כך ש-m5.large יכול להריץ 110 Pods. רק על Nitro, וצריך בלוקים רציפים פנויים של /28; subnets מפוצלים נכשלים עם InsufficientCidrBlocks, אז שומרים מקום עם subnet CIDR reservations.</li><li>יותר כתובות בכלל: מוסיפים ל-VPC secondary CIDR כמו 100.64.0.0/16, ומשתמשים ב-custom networking (ENIConfig לכל AZ) כך שה-Pods יושבים שם וה-nodes נשארים בטווח הניתן לניתוב.</li><li>לטווח ארוך: clusters של IPv6 (בלי מחסור, אבל כל תלות חייבת לדבר IPv6), ולתכנן subnets ל-Pods מהיום הראשון (/19 לכל AZ, לא /24).</li><li>ניטור: התראה כשהכתובות הפנויות ב-subnet של Pods יורדות מתחת ל-20%.</li></ol>"
  },
  levelUp: { en: "Staff answers treat IP space as a fleet-level resource: an IPAM plan across accounts and regions, non-routable pod ranges reused per cluster behind NAT, and a clear policy for when a cluster goes IPv6.",
             he: "תשובת Staff מתייחסת למרחב הכתובות כמשאב של כל ה-fleet: תוכנית IPAM על פני חשבונות ו-regions, טווחי Pods לא ניתנים לניתוב שחוזרים בכל cluster מאחורי NAT, ומדיניות ברורה מתי cluster עובר ל-IPv6." },
  links: ["#/lesson/aws-eks-production", "#/lesson/aws-networking-edge", "#/oncall/eks-ip-exhaustion"]
});

INFRA.topQuestions.push({
  id: "top-infra-istio-mtls-503",
  cat: "infra",
  level: "senior",
  q: { en: "You're moving a mesh from permissive to STRICT mTLS. How do you do it safely, and how do you debug the 503s that show up?",
       he: "אתה מעביר mesh מ-permissive ל-STRICT mTLS. איך עושים את זה בבטחה, ואיך מדבגים את ה-503 שמופיעים?" },
  signal: { en: "Can you migrate with data instead of hope (measure plaintext traffic first), and read Envoy's response flags and proxy config to find the real cause of a 503?",
            he: "האם אתה יודע לעשות migration לפי נתונים ולא לפי תקווה (קודם למדוד תנועה ב-plaintext), ולקרוא את ה-response flags ואת ה-config של Envoy כדי למצוא את הסיבה האמיתית ל-503?" },
  outline: {
    en: "<ol><li>Start in PERMISSIVE: sidecars accept both mTLS and plaintext. Find who still sends plaintext: <code>istio_requests_total{connection_security_policy!=\"mutual_tls\"}</code> by source and destination. Usually: pods without sidecars, jobs, monitoring scrapers, callers from outside the mesh.</li><li>Fix the callers (inject sidecars or move them to ambient), then turn on STRICT per namespace with a PeerAuthentication, watch for an hour, and only then mesh-wide in istio-system.</li><li>Keep exceptions explicit: port-level PERMISSIVE for a metrics port, never a forgotten DestinationRule with <code>tls.mode: DISABLE</code>, which silently overrides auto-mTLS and breaks against STRICT servers.</li><li>Reading a 503: the access log response flag tells you where. <code>UF</code> + 'TLS error' = handshake failed (plaintext vs STRICT, DestinationRule mismatch); <code>UH</code> = no healthy endpoints; <code>NR</code> = no route; <code>UC</code> = upstream closed the connection, often an idle-timeout mismatch with the app's keep-alive; <code>UO</code> = circuit breaker overflow.</li><li>Tools: <code>istioctl x describe pod</code>, <code>istioctl proxy-config cluster/endpoint &lt;pod&gt;</code>, <code>istioctl analyze</code>, and <code>istioctl proxy-status</code> to catch stale config.</li><li>Startup 503s: the app calls out before the sidecar is ready; set <code>holdApplicationUntilProxyStarts: true</code> or use native sidecars.</li><li>Roll back by setting the namespace PeerAuthentication back to PERMISSIVE; it takes effect in seconds.</li></ol>",
    he: "<ol><li>מתחילים ב-PERMISSIVE: ה-sidecars מקבלים גם mTLS וגם plaintext. מוצאים מי עדיין שולח plaintext: <code>istio_requests_total{connection_security_policy!=\"mutual_tls\"}</code> לפי source ו-destination. בדרך כלל: Pods בלי sidecar, jobs, scrapers של ניטור, וקוראים מחוץ ל-mesh.</li><li>מתקנים את הקוראים (מזריקים sidecar או מעבירים ל-ambient), ואז מדליקים STRICT לכל namespace עם PeerAuthentication, מסתכלים שעה, ורק אז לכל ה-mesh ב-istio-system.</li><li>חריגים רק במפורש: PERMISSIVE ברמת port ל-port של metrics, ואף פעם לא DestinationRule שנשכח עם <code>tls.mode: DISABLE</code>, שעוקף בשקט את ה-auto-mTLS ונשבר מול שרתים ב-STRICT.</li><li>לקרוא 503: ה-response flag ב-access log אומר איפה. <code>UF</code> עם 'TLS error' = ה-handshake נכשל (plaintext מול STRICT, אי התאמה ב-DestinationRule); <code>UH</code> = אין endpoints בריאים; <code>NR</code> = אין route; <code>UC</code> = ה-upstream סגר את החיבור, הרבה פעמים אי התאמה בין ה-idle timeout ל-keep-alive של האפליקציה; <code>UO</code> = overflow של circuit breaker.</li><li>כלים: <code>istioctl x describe pod</code>, <code>istioctl proxy-config cluster/endpoint &lt;pod&gt;</code>, <code>istioctl analyze</code>, ו-<code>istioctl proxy-status</code> כדי לתפוס config שלא התעדכן.</li><li>503 בעלייה: האפליקציה יוצאת החוצה לפני שה-sidecar מוכן; מגדירים <code>holdApplicationUntilProxyStarts: true</code> או משתמשים ב-native sidecars.</li><li>Rollback: מחזירים את ה-PeerAuthentication של ה-namespace ל-PERMISSIVE; זה נכנס לתוקף תוך שניות.</li></ol>"
  },
  levelUp: { en: "Staff answers connect mTLS to the bigger goal: workload identity (SPIFFE IDs) plus AuthorizationPolicy deny-by-default, so mTLS is a step toward zero trust, and they plan certificate rotation and root CA changes as fleet operations.",
             he: "תשובת Staff מחברת את ה-mTLS למטרה הגדולה: זהות של workload (SPIFFE IDs) ועוד AuthorizationPolicy של deny כברירת מחדל, כך ש-mTLS הוא צעד לכיוון zero trust, ומתכננת סיבוב תעודות והחלפת root CA כפעולות על כל ה-fleet." },
  links: ["#/lesson/istio-in-production", "#/oncall/istio-503-after-mtls", "#/lesson/api-gateway-production"]
});

INFRA.topQuestions.push({
  id: "top-infra-terraform-state-team",
  cat: "infra",
  level: "senior",
  q: { en: "Ten engineers work on the same Terraform codebase for production. How do you handle state, locking and drift?",
       he: "עשרה מהנדסים עובדים על אותו קוד Terraform של production. איך מנהלים state, locking ו-drift?" },
  signal: { en: "Do you treat state as a critical, sensitive database, keep blast radius small, and run Terraform through a pipeline instead of laptops?",
            he: "האם אתה מתייחס ל-state כמו ל-database קריטי ורגיש, שומר על blast radius קטן, ומריץ Terraform דרך pipeline ולא מהמחשבים של אנשים?" },
  outline: {
    en: "<ol><li>Remote state: S3 bucket with versioning, encryption (KMS) and tight IAM, since state contains secrets in plain text. Native S3 locking (<code>use_lockfile = true</code>, Terraform 1.10+) replaces the older DynamoDB lock table; on other clouds, the backend's own locking (Azure blob lease, GCS).</li><li>Split state: one state per environment × component (network, cluster, data, app). A plan touches 50-300 resources, not 5,000; a bad apply hurts one component; plans stay under a few minutes.</li><li>Pipeline only: plan on every PR with the plan posted as a comment, apply after approval from the same plan file. Humans have read-only cloud access day to day; break-glass for emergencies.</li><li>Locking etiquette: never <code>force-unlock</code> unless you've confirmed the holder is dead; one apply per state at a time via the pipeline's concurrency control.</li><li>Drift: scheduled <code>terraform plan -detailed-exitcode</code> (exit 2 = changes) per stack, alerts to the owner, and a decision: revert or codify. <code>-refresh-only</code> shows drift without proposing changes.</li><li>Refactors without destroy: <code>moved</code> blocks, <code>import</code> blocks (1.5+), <code>removed</code> blocks (1.7+) instead of manual <code>terraform state mv/rm</code>.</li><li>Guardrails: policy checks on the plan (OPA/Conftest, Sentinel), <code>prevent_destroy</code> on stateful resources, pinned provider and module versions.</li></ol>",
    he: "<ol><li>Remote state: bucket של S3 עם versioning, הצפנה (KMS) ו-IAM הדוק, כי ה-state מכיל סודות ב-plain text. נעילה מובנית ב-S3 (<code>use_lockfile = true</code>, מ-Terraform 1.10) מחליפה את טבלת ה-lock הישנה ב-DynamoDB; בעננים אחרים, הנעילה של ה-backend עצמו (lease ב-Azure blob, GCS).</li><li>פיצול state: state אחד לכל סביבה × רכיב (network, cluster, data, app). plan נוגע ב-50-300 משאבים, לא ב-5,000; apply גרוע פוגע ברכיב אחד; ה-plans נשארים כמה דקות.</li><li>רק דרך pipeline: plan על כל PR עם ה-plan כתגובה ב-PR, apply אחרי אישור מאותו קובץ plan. לאנשים יש ביום-יום גישה לקריאה בלבד לענן; break-glass למקרי חירום.</li><li>נימוסי locking: אף פעם לא <code>force-unlock</code> לפני שווידאת שמי שמחזיק את הנעילה באמת מת; apply אחד לכל state בכל רגע דרך בקרת ה-concurrency של ה-pipeline.</li><li>Drift: <code>terraform plan -detailed-exitcode</code> מתוזמן (exit 2 = יש שינויים) לכל stack, התראה לבעלים, והחלטה: revert או codify. <code>-refresh-only</code> מראה drift בלי להציע שינויים.</li><li>Refactor בלי destroy: בלוקים של <code>moved</code>, <code>import</code> (מ-1.5) ו-<code>removed</code> (מ-1.7) במקום <code>terraform state mv/rm</code> ידני.</li><li>Guardrails: בדיקות policy על ה-plan (OPA/Conftest, Sentinel), <code>prevent_destroy</code> על משאבים עם state, וגרסאות מקובעות ל-providers ול-modules.</li></ol>"
  },
  levelUp: { en: "Staff answers talk about the platform around Terraform: a module registry with versioned modules, stack templates per team, drift and policy results as fleet dashboards, and when an AI agent or bot may open drift PRs (never apply).",
             he: "תשובת Staff מדברת על הפלטפורמה שמסביב ל-Terraform: registry של modules עם גרסאות, templates של stacks לכל צוות, תוצאות drift ו-policy כ-dashboards של כל ה-fleet, ומתי מותר ל-AI agent או לבוט לפתוח PR-ים של drift (אף פעם לא apply)." },
  links: ["#/lesson/terraform-production-workflow", "#/lesson/iac-side-by-side", "#/interview/design/sd-infra-ops-agent"]
});

INFRA.topQuestions.push({
  id: "top-infra-argocd-many-clusters",
  cat: "infra",
  level: "staff",
  q: { en: "How would you run GitOps with Argo CD across 100+ clusters?",
       he: "איך היית מריץ GitOps עם Argo CD על פני יותר מ-100 clusters?" },
  signal: { en: "Can you choose a topology on purpose (central vs per-cluster), avoid copy-paste with generators, scale the controllers, and promote changes through rings safely?",
            he: "האם אתה בוחר topology בכוונה (מרכזי מול לכל cluster), נמנע מ-copy-paste עם generators, יודע להגדיל את ה-controllers, ומקדם שינויים דרך rings בבטחה?" },
  outline: {
    en: "<ol><li>Topology: hub-and-spoke (one Argo CD per region or env managing many clusters: one UI, easy fleet view, but the hub holds credentials to everything and is a big blast radius) vs one Argo CD per cluster (isolated, scales out, harder to see the whole fleet). A common middle: a hub per region/env, or an agent-based model where each cluster pulls.</li><li>Don't write 100 Applications by hand: ApplicationSets with the cluster generator, selecting by cluster labels (<code>env=prod</code>, <code>ring=1</code>, <code>region=eu</code>), and a matrix generator to combine clusters × add-ons.</li><li>Scale: application controller sharding across replicas (by cluster), more repo-server replicas with manifest caching, and webhooks from Git instead of polling every 3 minutes. Watch reconcile queue depth and sync durations.</li><li>Promotion: rings by label. A change lands in ring 0 clusters, bakes, then the ring label selector widens; ApplicationSet progressive sync (RollingSync) or a promotion tool handles the order. Each step is a Git change, so rollback is a revert.</li><li>Config layering: base + overlays per env/region (Kustomize) or Helm values per cluster, with per-cluster values kept tiny.</li><li>Drift: self-heal on for platform add-ons, with <code>ignoreDifferences</code> for fields owned by other controllers (HPA replicas, webhook CA bundles).</li><li>Security: Argo CD projects per team limit which repos, namespaces and clusters they can target; SSO + RBAC; cluster credentials scoped to what Argo needs.</li></ol>",
    he: "<ol><li>Topology: hub-and-spoke (Argo CD אחד לכל region או סביבה שמנהל הרבה clusters: UI אחד, תמונה קלה של כל ה-fleet, אבל ה-hub מחזיק credentials לכל דבר והוא blast radius גדול) מול Argo CD לכל cluster (מבודד, מתרחב, קשה יותר לראות את כל ה-fleet). דרך ביניים נפוצה: hub לכל region/סביבה, או מודל מבוסס agent שבו כל cluster מושך.</li><li>לא כותבים 100 Applications ביד: ApplicationSets עם cluster generator, בחירה לפי labels של cluster (<code>env=prod</code>, <code>ring=1</code>, <code>region=eu</code>), ו-matrix generator כדי לשלב clusters × add-ons.</li><li>Scale: sharding של ה-application controller על פני replicas (לפי cluster), עוד replicas ל-repo-server עם cache של manifests, ו-webhooks מ-Git במקום polling כל 3 דקות. עוקבים אחרי עומק תור ה-reconcile ומשך ה-syncs.</li><li>קידום: rings לפי label. שינוי נוחת ב-clusters של ring 0, מחכה (bake), ואז ה-selector של ה-ring מתרחב; progressive sync של ApplicationSet (RollingSync) או כלי promotion מנהלים את הסדר. כל צעד הוא שינוי ב-Git, אז rollback הוא revert.</li><li>שכבות config: base ועוד overlays לכל סביבה/region (Kustomize) או values של Helm לכל cluster, כשה-values הייחודיים לכל cluster נשארים קטנים מאוד.</li><li>Drift: self-heal דולק ל-add-ons של הפלטפורמה, עם <code>ignoreDifferences</code> לשדות ש-controllers אחרים מנהלים (replicas של HPA, CA bundles של webhooks).</li><li>אבטחה: Argo CD projects לכל צוות מגבילים לאילו repos, namespaces ו-clusters אפשר לפרוס; SSO ו-RBAC; credentials של clusters מוגבלים למה ש-Argo צריך.</li></ol>"
  },
  levelUp: { en: "Staff answers design for the bad day: what happens when the hub is down (clusters keep running, only changes stop), how a bad commit is contained to one ring, and how a new cluster joins the fleet with zero manual steps.",
             he: "תשובת Staff מתכננת ליום הרע: מה קורה כשה-hub למטה (ה-clusters ממשיכים לרוץ, רק השינויים נעצרים), איך commit גרוע נשאר בתוך ring אחד, ואיך cluster חדש מצטרף ל-fleet בלי אף צעד ידני." },
  links: ["#/lesson/k8s-gitops-at-scale", "#/lesson/k8s-fleet-upgrades", "#/lesson/cicd-aws-eks-pipeline", "#/oncall/k8s-argocd-drift"]
});

INFRA.topQuestions.push({
  id: "top-design-llm-gateway",
  cat: "design",
  level: "staff",
  q: { en: "Design an internal LLM gateway that all product teams use to call models from several providers.",
       he: "תתכנן LLM gateway פנימי שכל צוותי המוצר משתמשים בו כדי לקרוא למודלים מכמה ספקים." },
  signal: { en: "Do you see what makes LLM traffic different (tokens not requests, streaming, long and variable latency, cost per call) and put the right controls in one place without becoming the bottleneck?",
            he: "האם אתה רואה מה שונה בתנועת LLM (tokens ולא בקשות, streaming, latency ארוך ומשתנה, עלות לכל קריאה) ושם את הבקרות הנכונות במקום אחד בלי להפוך לצוואר בקבוק?" },
  outline: {
    en: "<ol><li>Clarify: how many teams and requests (e.g. 50 teams, 300 rps peak, 1B tokens/day), which providers and self-hosted models, data rules (PII, regions), and the latency budget the gateway may add (target &lt; 20 ms p99).</li><li>API: one OpenAI-compatible endpoint with streaming (SSE) passed through untouched. Apps call model <em>aliases</em> (<code>chat-default</code>, <code>chat-fast</code>), not provider model names, so models can change without app deploys.</li><li>Identity and money: virtual keys per team/app, budgets with soft alerts and hard caps, and rate limits in <strong>TPM and RPM</strong> per key, estimated from prompt size before the call and corrected after.</li><li>Routing: alias → ordered list of deployments (provider A region 1, provider A region 2, provider B). Fallback on 429/5xx, circuit breakers per deployment, and spread load across your own provider quotas.</li><li>Retries done right: exponential backoff with full jitter, honor <code>Retry-After</code>, a retry budget (e.g. ≤ 10% extra requests), never retry after streaming has started.</li><li>Caching: help apps use provider prompt caching (static prefix first) and optionally an exact-match response cache; semantic caching only where staleness is acceptable.</li><li>Safety: PII redaction, guardrails, allow-lists of models per data classification, and no prompt bodies in logs by default.</li><li>Observability: OpenTelemetry GenAI attributes per call (model, input/output/cached tokens, TTFT, cost), dashboards per alias and per key, alerts on TPM at 80% of quota and cache hit drops.</li><li>Deployment: stateless gateway pods (Envoy-based or a lightweight proxy), Redis for counters, multi-AZ; if the gateway fails, it fails closed for unknown keys but stays up for streaming.</li></ol>",
    he: "<ol><li>הבהרות: כמה צוותים ובקשות (למשל 50 צוותים, 300 rps בשיא, מיליארד tokens ביום), אילו ספקים ומודלים self-hosted, חוקי מידע (PII, regions), וכמה latency מותר ל-gateway להוסיף (יעד &lt; 20 ms ב-p99).</li><li>API: endpoint אחד תואם OpenAI עם streaming (SSE) שעובר כמו שהוא. האפליקציות קוראות ל-<em>aliases</em> של מודלים (<code>chat-default</code>, <code>chat-fast</code>), לא לשמות המודלים של הספק, כך שאפשר להחליף מודל בלי deploy לאפליקציה.</li><li>זהות וכסף: virtual keys לכל צוות/אפליקציה, תקציבים עם התראות רכות ותקרות קשיחות, ו-rate limits ב-<strong>TPM וב-RPM</strong> לכל key, לפי הערכה של גודל ה-prompt לפני הקריאה ותיקון אחריה.</li><li>ניתוב: alias → רשימה מסודרת של deployments (ספק A region 1, ספק A region 2, ספק B). Fallback על 429/5xx, circuit breakers לכל deployment, ופיזור עומס על המכסות שלך אצל הספקים.</li><li>Retries נכון: exponential backoff עם full jitter, לכבד <code>Retry-After</code>, retry budget (למשל ≤ 10% בקשות נוספות), ואף פעם לא retry אחרי שה-streaming התחיל.</li><li>Caching: לעזור לאפליקציות להשתמש ב-prompt caching של הספק (prefix סטטי ראשון) ואופציונלית response cache להתאמה מדויקת; semantic caching רק איפה שמידע ישן מקובל.</li><li>בטיחות: הסתרת PII, guardrails, רשימות מודלים מותרים לפי סיווג מידע, ובלי תוכן prompts בלוגים כברירת מחדל.</li><li>Observability: attributes של OpenTelemetry GenAI לכל קריאה (מודל, tokens של input/output/cache, TTFT, עלות), dashboards לכל alias ולכל key, התראות על TPM ב-80% מהמכסה ועל ירידה ב-cache hits.</li><li>Deployment: Pods של gateway בלי state (מבוסס Envoy או proxy קל), Redis ל-counters, multi-AZ; אם ה-gateway נופל, fail closed ל-keys לא מוכרים אבל נשאר זמין ל-streaming.</li></ol>"
  },
  levelUp: { en: "Staff answers treat the gateway as the control point for the whole AI platform: per-alias SLOs (TTFT and tokens/s), eval-gated model and prompt changes, capacity planning in TPM across providers, and showback so teams see their own cost.",
             he: "תשובת Staff מתייחסת ל-gateway כנקודת השליטה של כל פלטפורמת ה-AI: SLOs לכל alias (TTFT ו-tokens לשנייה), שינויי מודל ו-prompt שעוברים gate של evals, תכנון קיבולת ב-TPM על פני ספקים, ו-showback כדי שכל צוות יראה את העלות שלו." },
  links: ["#/lesson/ai-gateway-design", "#/lesson/ai-llm-serving", "#/oncall/llm-latency-spike", "#/lesson/api-gateway-production"]
});

INFRA.topQuestions.push({
  id: "top-infra-aws-vs-azure-networking",
  cat: "infra",
  level: "senior",
  q: { en: "You know Azure networking well and now own an AWS environment (or the reverse). Which differences bite in practice?",
       he: "אתה מכיר טוב רשתות ב-Azure ועכשיו אחראי על סביבת AWS (או הפוך). אילו הבדלים נושכים בפועל?" },
  signal: { en: "Do you know the concepts that look the same but behave differently (subnet scope, default rules, outbound, private endpoints and DNS), not just a name mapping table?",
            he: "האם אתה מכיר את המושגים שנראים אותו דבר אבל מתנהגים אחרת (היקף של subnet, חוקי ברירת מחדל, outbound, private endpoints ו-DNS), ולא רק טבלת תרגום של שמות?" },
  outline: {
    en: "<ol><li>Subnet scope: an AWS subnet lives in exactly one AZ, so you need one subnet per AZ per tier, and zonal services (NAT gateway, ENIs) follow. An Azure subnet spans the whole region; zones are chosen per resource.</li><li>Public vs private: in AWS a subnet is 'public' only because its route table has a route to an Internet Gateway. In Azure there is no IGW; outbound comes from public IPs, a load balancer, or a NAT Gateway, and Azure is retiring implicit default outbound access, so new subnets should assume private and need an explicit NAT Gateway.</li><li>Firewall rules: AWS security groups are allow-only, stateful, attached to ENIs, and can reference other security groups; NACLs are stateless, per subnet. Azure NSGs have allow <em>and</em> deny with priorities, attach to subnet or NIC, and their default rules allow all traffic inside the VNet; use Application Security Groups for 'reference by role'.</li><li>Private access to PaaS: AWS gateway endpoints for S3/DynamoDB are free and route-based; interface endpoints set private DNS for you. Azure Private Endpoints need Private DNS zones (<code>privatelink.*</code>) linked to every VNet that resolves them; broken DNS here is the classic outage.</li><li>Hub-and-spoke: both VNet and VPC peering are non-transitive. AWS uses Transit Gateway (per-attachment hourly + $0.02/GB); Azure uses a hub VNet with Azure Firewall and UDRs, or Virtual WAN.</li><li>Cost traps: AWS charges for cross-AZ traffic (~$0.01/GB each direction) and NAT gateway processing ($0.045/GB), so a NAT gateway in another AZ costs you twice. Put a NAT gateway in each AZ.</li><li>DNS: the AWS resolver is at the VPC base +2 (and 169.254.169.253); Azure's is 168.63.129.16. Hybrid DNS needs Route 53 Resolver endpoints vs Azure DNS Private Resolver.</li></ol>",
    he: "<ol><li>היקף של subnet: ב-AWS subnet חי בדיוק ב-AZ אחד, אז צריך subnet לכל AZ לכל שכבה, ושירותים zonal (NAT gateway, ENIs) הולכים אחריו. ב-Azure subnet מתפרס על כל ה-region; את ה-zone בוחרים לכל משאב.</li><li>Public מול private: ב-AWS subnet הוא 'public' רק כי ב-route table שלו יש route ל-Internet Gateway. ב-Azure אין IGW; outbound מגיע מ-public IPs, מ-load balancer או מ-NAT Gateway, ו-Azure מוציאה משימוש את ה-default outbound access המרומז, אז ב-subnets חדשים צריך להניח private ולהוסיף NAT Gateway במפורש.</li><li>חוקי firewall: ה-security groups של AWS הם allow בלבד, stateful, מחוברים ל-ENIs, ויכולים להפנות ל-security groups אחרים; ה-NACLs הם stateless, ברמת subnet. ל-NSGs של Azure יש allow <em>וגם</em> deny עם עדיפויות, הם מתחברים ל-subnet או ל-NIC, וחוקי ברירת המחדל שלהם מתירים כל תנועה בתוך ה-VNet; משתמשים ב-Application Security Groups כדי להפנות לפי תפקיד.</li><li>גישה פרטית ל-PaaS: gateway endpoints של AWS ל-S3/DynamoDB חינמיים ומבוססי route; interface endpoints מגדירים לך private DNS. ב-Azure, Private Endpoints צריכים Private DNS zones (<code>privatelink.*</code>) שמקושרים לכל VNet שצריך לפתור אותם; DNS שבור כאן הוא ה-outage הקלאסי.</li><li>Hub-and-spoke: גם VNet peering וגם VPC peering לא טרנזיטיביים. ב-AWS משתמשים ב-Transit Gateway (תשלום לשעה לכל attachment ועוד $0.02 ל-GB); ב-Azure ב-hub VNet עם Azure Firewall ו-UDRs, או ב-Virtual WAN.</li><li>מלכודות עלות: AWS גובה על תנועה בין AZs (~$0.01 ל-GB לכל כיוון) ועל עיבוד ב-NAT gateway ($0.045 ל-GB), אז NAT gateway ב-AZ אחר עולה לך פעמיים. שמים NAT gateway בכל AZ.</li><li>DNS: ה-resolver של AWS נמצא בכתובת הבסיס של ה-VPC ועוד 2 (וגם ב-169.254.169.253); של Azure ב-168.63.129.16. DNS היברידי דורש Route 53 Resolver endpoints מול Azure DNS Private Resolver.</li></ol>"
  },
  levelUp: { en: "Staff answers turn the differences into a landing-zone design for both clouds: IP plan without overlaps, a central egress and inspection pattern per cloud, private DNS as a shared service, and the same guardrails written in each cloud's policy language.",
             he: "תשובת Staff הופכת את ההבדלים לתכנון landing zone לשני העננים: תוכנית כתובות בלי חפיפות, דפוס מרכזי של egress ובדיקת תנועה לכל ענן, private DNS כשירות משותף, ואותם guardrails שכתובים בשפת ה-policy של כל ענן." },
  links: ["#/lesson/aws-for-azure-engineers", "#/lesson/aws-networking-edge", "#/lesson/aws-eks-production"]
});
