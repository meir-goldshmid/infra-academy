window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ============================================================
   End-to-end flows (platform): commit to prod, kubectl apply to traffic,
   analytics event to dashboard, SaaS tenant onboarding, alert to postmortem.
   Each lesson carries a `flow` that the app renders as a hop-by-hop stepper.
   ============================================================ */

INFRA.lessons.push({
  id: "flow-commit-to-prod",
  track: "flows",
  order: 11,
  icon: "🚢",
  level: 3,
  minutes: 18,
  title: { en: "Commit to Production: the Secure Delivery Pipeline, Hop by Hop", he: "מ-commit לפרודקשן: צינור ה-delivery המאובטח, קפיצה אחר קפיצה" },
  tldr: {
    en: "A commit earns its way to production through gates: fast local checks, PR checks (tests, SAST, secrets, SCA), review, a reproducible signed image with an SBOM, a GitOps change, admission that verifies the signature, and a canary that promotes itself only if the metrics say so — with a one-click rollback at every step.",
    he: "commit מרוויח את הדרך שלו לפרודקשן דרך שערים: בדיקות מקומיות מהירות, בדיקות PR (טסטים, SAST, סודות, SCA), review, image חתום ו-reproducible עם SBOM, שינוי GitOps, admission שמאמת את החתימה, ו-canary שמקדם את עצמו רק אם המטריקות מסכימות — עם rollback בלחיצה בכל שלב."
  },
  analogy: {
    en: "Think of an airport. Pre-commit hooks are you checking your own bag at home. PR checks are the security scanner — every bag, every time, automated. Code review is the passport officer: a human who can ask 'why?'. The signed image is the boarding pass with a hologram: the gate (admission controller) refuses anyone whose pass wasn't issued by the airline. The canary is the first few passengers boarding while ground crew watch for trouble — and the rollback is the gate agent who can stop boarding instantly.",
    he: "תחשבו על שדה תעופה. pre-commit hooks זה אתם בודקים את המזוודה בבית. בדיקות ה-PR הן מכונת השיקוף — כל תיק, כל פעם, אוטומטית. Code review הוא פקיד הדרכונים: בן אדם שיכול לשאול 'למה?'. ה-image החתום הוא כרטיס העלייה עם הולוגרמה: השער (admission controller) לא מכניס מי שהכרטיס שלו לא הונפק ע\"י חברת התעופה. ה-canary הם הנוסעים הראשונים שעולים בזמן שצוות הקרקע מסתכל אם יש בעיה — וה-rollback הוא נציג השער שיכול לעצור את העלייה מיד."
  },
  sections: [
    {
      h: { en: "The big picture: gates, not hope", he: "התמונה הגדולה: שערים, לא תקווה" },
      body: {
        en: `<p>A principal designs the delivery pipeline as a <strong>sequence of gates</strong>, each cheap where it's early and strict where it's late. Two properties matter more than any single tool:</p>
<ul>
<li><strong>Build once, promote the same artifact.</strong> The exact image digest that passed tests in staging is the one that runs in prod. Never rebuild per environment.</li>
<li><strong>Provenance end to end.</strong> You can prove which commit, which pipeline run and which dependencies produced the bytes running in prod (SLSA levels, signatures, SBOM).</li>
</ul>
<table><tr><th>Gate</th><th>Catches</th><th>Typical time</th></tr>
<tr><td>pre-commit</td><td>format, lint, obvious secrets</td><td>2–10 s</td></tr>
<tr><td>PR checks</td><td>unit tests, SAST, SCA, secret scan, IaC policy</td><td>3–10 min</td></tr>
<tr><td>Review</td><td>design, intent, risk</td><td>minutes–hours</td></tr>
<tr><td>Build + sign</td><td>reproducibility, provenance</td><td>2–6 min</td></tr>
<tr><td>Admission</td><td>unsigned / unapproved images, bad config</td><td>&lt; 1 s</td></tr>
<tr><td>Canary + analysis</td><td>real-traffic regressions</td><td>10–60 min</td></tr></table>
<blockquote>💡 Real world: DORA metrics (deploy frequency, lead time, change failure rate, time to restore) are how you know the pipeline is healthy. Elite teams have lead time under a day and change failure rate under 15% — speed and safety come from the same automation.</blockquote>`,
        he: `<p>Principal מתכנן את צינור ה-delivery כ<strong>רצף של שערים</strong>, כל אחד זול כשהוא מוקדם וקפדני כשהוא מאוחר. שתי תכונות חשובות יותר מכל כלי בודד:</p>
<ul>
<li><strong>בונים פעם אחת, מקדמים את אותו artifact.</strong> אותו image digest בדיוק שעבר טסטים ב-staging הוא זה שרץ בפרודקשן. אף פעם לא בונים מחדש לכל סביבה.</li>
<li><strong>Provenance מקצה לקצה.</strong> אפשר להוכיח איזה commit, איזו ריצת pipeline ואילו dependencies ייצרו את הבייטים שרצים בפרודקשן (רמות SLSA, חתימות, SBOM).</li>
</ul>
<table><tr><th>שער</th><th>תופס</th><th>זמן טיפוסי</th></tr>
<tr><td>pre-commit</td><td>פורמט, lint, סודות ברורים</td><td>2–10 שניות</td></tr>
<tr><td>בדיקות PR</td><td>unit tests, SAST, SCA, סריקת סודות, policy ל-IaC</td><td>3–10 דקות</td></tr>
<tr><td>Review</td><td>design, כוונה, סיכון</td><td>דקות–שעות</td></tr>
<tr><td>Build + חתימה</td><td>reproducibility, provenance</td><td>2–6 דקות</td></tr>
<tr><td>Admission</td><td>images לא חתומים/לא מאושרים, קונפיג שגוי</td><td>&lt; 1 שנייה</td></tr>
<tr><td>Canary + analysis</td><td>רגרסיות על תעבורה אמיתית</td><td>10–60 דקות</td></tr></table>
<blockquote>💡 מהשטח: מדדי DORA (תדירות deploy, lead time, change failure rate, זמן התאוששות) הם הדרך לדעת שהצינור בריא. צוותי elite מגיעים ל-lead time של פחות מיום ול-change failure rate מתחת ל-15% — מהירות ובטיחות באות מאותה אוטומציה.</blockquote>`
      }
    },
    {
      h: { en: "Security checkpoints along the way", he: "נקודות בדיקת אבטחה לאורך הדרך" },
      body: {
        en: `<ul>
<li><strong>Source</strong>: branch protection, required reviews (CODEOWNERS), signed commits, no direct pushes to main.</li>
<li><strong>CI identity</strong>: the runner authenticates to the cloud and registry with short-lived <strong>OIDC</strong> tokens — no long-lived keys in CI secrets.</li>
<li><strong>Dependencies</strong>: SCA (Dependabot/Renovate/Snyk/Trivy), lockfiles, pinned base images by digest.</li>
<li><strong>Artifact</strong>: SBOM (Syft, CycloneDX/SPDX), keyless signature + provenance attestation (cosign, SLSA generator).</li>
<li><strong>Deploy</strong>: GitOps (the cluster pulls; CI has no cluster credentials), admission policy that rejects unsigned images and <code>:latest</code> tags.</li>
<li><strong>Runtime</strong>: least-privilege service accounts, NetworkPolicy, runtime detection (Falco/Tetragon).</li>
</ul>
<pre># Kyverno: only signed images from our registry may run
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: verify-signed-images }
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify-cosign
    match: { any: [ { resources: { kinds: [Pod] } } ] }
    verifyImages:
    - imageReferences: ["ghcr.io/acme/*"]
      attestors:
      - entries:
        - keyless:
            issuer: https://token.actions.githubusercontent.com
            subject: https://github.com/acme/*</pre>`,
        he: `<ul>
<li><strong>קוד מקור</strong>: branch protection, reviews חובה (CODEOWNERS), commits חתומים, אין push ישיר ל-main.</li>
<li><strong>זהות ה-CI</strong>: ה-runner מזדהה מול הענן וה-registry עם טוקני <strong>OIDC</strong> קצרי-חיים — בלי מפתחות ארוכי-טווח בסודות של ה-CI.</li>
<li><strong>Dependencies</strong>: SCA (Dependabot/Renovate/Snyk/Trivy), lockfiles, base images מוצמדים לפי digest.</li>
<li><strong>Artifact</strong>: SBOM (Syft, CycloneDX/SPDX), חתימה keyless + provenance attestation (cosign, SLSA generator).</li>
<li><strong>Deploy</strong>: GitOps (הקלאסטר מושך; ל-CI אין credentials לקלאסטר), admission policy שדוחה images לא חתומים ותגיות <code>:latest</code>.</li>
<li><strong>Runtime</strong>: service accounts עם הרשאות מינימליות, NetworkPolicy, זיהוי בזמן ריצה (Falco/Tetragon).</li>
</ul>
<pre># Kyverno: only signed images from our registry may run
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: verify-signed-images }
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify-cosign
    match: { any: [ { resources: { kinds: [Pod] } } ] }
    verifyImages:
    - imageReferences: ["ghcr.io/acme/*"]
      attestors:
      - entries:
        - keyless:
            issuer: https://token.actions.githubusercontent.com
            subject: https://github.com/acme/*</pre>`
      }
    },
    {
      h: { en: "What to monitor end to end", he: "מה לנטר מקצה לקצה" },
      body: {
        en: `<ul>
<li><strong>Pipeline health</strong>: lead time (commit → prod), queue time for runners, flaky-test rate, p95 CI duration, % of builds red on main.</li>
<li><strong>Deploy events as annotations</strong> on every service dashboard (Grafana annotations from Argo CD notifications) — the first question in any incident is "what changed?".</li>
<li><strong>Canary analysis inputs</strong>: error rate and p99 latency of canary vs stable, plus saturation (CPU throttling, memory).</li>
<li><strong>Drift</strong>: Argo CD <code>OutOfSync</code> duration; anything changed by hand in the cluster.</li>
<li><strong>Supply chain</strong>: count of running images without a valid signature (should be 0), age of base images, open critical CVEs in running images.</li>
</ul>
<blockquote>⚠️ Production tip: Keep main always deployable. If main is red, fixing it is the team's top priority — otherwise every later commit inherits the breakage and rollbacks become archaeology.</blockquote>`,
        he: `<ul>
<li><strong>בריאות ה-pipeline</strong>: lead time (commit → prod), זמן המתנה ל-runners, שיעור טסטים flaky, p95 של משך ה-CI, אחוז ה-builds האדומים על main.</li>
<li><strong>אירועי deploy כ-annotations</strong> על כל דשבורד של שירות (Grafana annotations מתוך Argo CD notifications) — השאלה הראשונה בכל תקלה היא "מה השתנה?".</li>
<li><strong>קלט ל-canary analysis</strong>: שיעור שגיאות ו-p99 latency של ה-canary מול ה-stable, וגם saturation (CPU throttling, זיכרון).</li>
<li><strong>Drift</strong>: כמה זמן Argo CD ב-<code>OutOfSync</code>; כל דבר ששונה ידנית בקלאסטר.</li>
<li><strong>Supply chain</strong>: מספר images רצים בלי חתימה תקפה (צריך להיות 0), גיל ה-base images, CVEs קריטיים פתוחים ב-images רצים.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: main תמיד צריך להיות deployable. אם main אדום, לתקן אותו זה העדיפות הראשונה של הצוות — אחרת כל commit אחריו יורש את השבירה ו-rollbacks הופכים לארכיאולוגיה.</blockquote>`
      }
    }
  ],
  flow: {
    actors: ["Developer", "Git host", "CI runner", "Registry", "GitOps repo", "Argo CD", "K8s API", "Argo Rollouts", "Prometheus"],
    steps: [
      { from: 0, to: 0, ms: 5000,
        label: { en: "pre-commit hooks run locally", he: "pre-commit hooks רצים מקומית" },
        detail: { en: `<p>Formatter, linter, a fast secret scanner (gitleaks) and type check run on staged files only. Fast feedback: seconds, not minutes.</p><pre>$ git commit -m "feat: add retry to payments client"
gitleaks.........................Passed
ruff.............................Passed
mypy.............................Passed</pre>`, he: `<p>formatter, linter, סורק סודות מהיר (gitleaks) ובדיקת טיפוסים רצים רק על הקבצים ב-stage. פידבק מהיר: שניות, לא דקות.</p><pre>$ git commit -m "feat: add retry to payments client"
gitleaks.........................Passed
ruff.............................Passed
mypy.............................Passed</pre>` },
        fail: { en: "Hooks are optional (anyone can <code>--no-verify</code>), so they're a convenience, never the control. Every hook check must also run in CI.", he: "hooks הם אופציונליים (כל אחד יכול <code>--no-verify</code>), אז הם נוחות, אף פעם לא הבקרה. כל בדיקה ב-hook חייבת לרוץ גם ב-CI." } },
      { from: 0, to: 1, ms: 2000,
        label: { en: "Push branch and open a PR", he: "push ל-branch ופתיחת PR" },
        detail: { en: "<p>Branch protection on <code>main</code>: no direct pushes, required status checks, required CODEOWNERS review, linear history. The PR description links the ticket and the rollout/rollback plan for risky changes.</p>", he: "<p>Branch protection על <code>main</code>: אין push ישיר, status checks חובה, review חובה מ-CODEOWNERS, היסטוריה לינארית. תיאור ה-PR מקשר לטיקט ולתוכנית rollout/rollback לשינויים מסוכנים.</p>" },
        fail: { en: "A leaked token pushed directly to main bypasses everything. Detect with audit logs on branch-protection changes; mitigate by requiring signed commits and disallowing admins to bypass.", he: "טוקן שדלף ועשה push ישיר ל-main עוקף הכול. מזהים עם audit logs על שינויים ב-branch protection; ממתנים ע\"י דרישת commits חתומים ואיסור על admins לעקוף." } },
      { from: 1, to: 2, ms: 30000,
        label: { en: "CI picks up the job", he: "ה-CI מרים את ה-job" },
        detail: { en: "<p>A webhook triggers the workflow; an ephemeral runner starts (fresh VM or pod per job). The runner gets a short-lived <strong>OIDC token</strong> to talk to the cloud — no static keys.</p><pre>permissions:\n  id-token: write   # OIDC for cloud + cosign\n  contents: read</pre>", he: "<p>webhook מפעיל את ה-workflow; runner ארעי עולה (VM או pod חדש לכל job). ה-runner מקבל <strong>טוקן OIDC</strong> קצר-חיים לדבר עם הענן — בלי מפתחות סטטיים.</p><pre>permissions:\n  id-token: write   # OIDC for cloud + cosign\n  contents: read</pre>" },
        fail: { en: "Runner queue time explodes on a busy day (30 s becomes 20 min). Monitor queue time and autoscale runners (ARC on Kubernetes); persistent self-hosted runners are also a security risk (state leaks between jobs).", he: "זמן ההמתנה ל-runner מתפוצץ ביום עמוס (30 שניות הופכות ל-20 דקות). מנטרים queue time ועושים autoscale ל-runners (ARC על Kubernetes); runners קבועים self-hosted הם גם סיכון אבטחה (state דולף בין jobs)." } },
      { from: 2, to: 2, ms: 240000,
        label: { en: "PR checks: tests, SAST, secrets, SCA, IaC policy", he: "בדיקות PR: טסטים, SAST, סודות, SCA, policy ל-IaC" },
        detail: { en: "<p>Run in parallel: unit tests + coverage diff, integration tests with Testcontainers, SAST (CodeQL/Semgrep), secret scan of the full diff, SCA on the lockfile, and policy-as-code on Terraform/K8s YAML (Conftest/Checkov). Results post back as required checks.</p><pre>jobs: [unit, integration, codeql, semgrep,\n       gitleaks, trivy-fs, conftest]   # all required</pre>", he: "<p>רצים במקביל: unit tests + diff של coverage, integration tests עם Testcontainers, SAST (CodeQL/Semgrep), סריקת סודות על כל ה-diff, SCA על ה-lockfile, ו-policy-as-code על Terraform/K8s YAML (Conftest/Checkov). התוצאות חוזרות כ-required checks.</p><pre>jobs: [unit, integration, codeql, semgrep,\n       gitleaks, trivy-fs, conftest]   # all required</pre>" },
        fail: { en: "Flaky tests teach people to click 're-run' until green — the gate becomes noise. Track flake rate per test, quarantine flaky tests with an owner and a deadline, and keep total PR time under ~10 minutes or people batch changes.", he: "טסטים flaky מלמדים אנשים ללחוץ 're-run' עד שזה ירוק — השער הופך לרעש. עוקבים אחרי flake rate לכל טסט, שמים בהסגר טסטים flaky עם בעלים ודדליין, ושומרים על זמן PR כולל מתחת ל-~10 דקות אחרת אנשים מאגדים שינויים." } },
      { from: 0, to: 1, ms: 1800000,
        label: { en: "Human code review", he: "Code review אנושי" },
        detail: { en: "<p>The reviewer checks intent and risk, not formatting (machines did that): is this the right change, is it backward compatible, is there a rollback, are there metrics/logs for the new path, is it behind a feature flag?</p>", he: "<p>ה-reviewer בודק כוונה וסיכון, לא פורמט (המכונות עשו את זה): האם זה השינוי הנכון, האם הוא תואם לאחור, יש rollback, יש metrics/logs לנתיב החדש, האם הוא מאחורי feature flag?</p>" },
        fail: { en: "Rubber-stamp reviews on 2,000-line PRs. Keep PRs small (&lt; 400 lines), and require a second reviewer for risky paths (auth, payments, migrations) via CODEOWNERS.", he: "reviews של חותמת גומי על PRs של 2,000 שורות. שומרים PRs קטנים (&lt; 400 שורות), ודורשים reviewer שני לנתיבים מסוכנים (auth, תשלומים, מיגרציות) דרך CODEOWNERS." } },
      { from: 1, to: 2, ms: 20000,
        label: { en: "Merge to main triggers the release build", he: "merge ל-main מפעיל את ה-build לשחרור" },
        detail: { en: "<p>Merge queue (GitHub merge queue / Bors) re-tests the PR rebased on the latest main so two individually-green PRs can't break main together.</p>", he: "<p>Merge queue (GitHub merge queue / Bors) מריץ שוב טסטים על ה-PR אחרי rebase על ה-main העדכני, כדי ששני PRs שכל אחד ירוק לא ישברו את main ביחד.</p>" },
        fail: { en: "Without a merge queue, semantic conflicts land on main ('works on my branch'). Symptom: main red right after two merges. Mitigation: merge queue + fast revert policy.", he: "בלי merge queue, קונפליקטים סמנטיים נוחתים על main ('אצלי ב-branch זה עובד'). סימפטום: main אדום מיד אחרי שני merges. פתרון: merge queue + מדיניות revert מהירה." } },
      { from: 2, to: 2, ms: 180000,
        label: { en: "Build a reproducible image + SBOM", he: "בניית image רפרודוקבילי + SBOM" },
        detail: { en: "<p>Multi-stage Dockerfile, base image pinned by digest, dependencies from the lockfile, non-root user. Generate an SBOM and scan it.</p><pre>docker buildx build --provenance=true --sbom=true \\\n  -t ghcr.io/acme/payments:${GIT_SHA} --push .\nsyft ghcr.io/acme/payments:${GIT_SHA} -o cyclonedx-json\ntrivy image --severity CRITICAL --exit-code 1 \\\n  ghcr.io/acme/payments:${GIT_SHA}</pre>", he: "<p>Dockerfile רב-שלבי, base image מוצמד לפי digest, dependencies מה-lockfile, משתמש לא-root. מייצרים SBOM וסורקים אותו.</p><pre>docker buildx build --provenance=true --sbom=true \\\n  -t ghcr.io/acme/payments:${GIT_SHA} --push .\nsyft ghcr.io/acme/payments:${GIT_SHA} -o cyclonedx-json\ntrivy image --severity CRITICAL --exit-code 1 \\\n  ghcr.io/acme/payments:${GIT_SHA}</pre>" },
        fail: { en: "<code>FROM node:20</code> without a digest means two builds of the same commit produce different images. A new critical CVE in the base image fails the build — have a documented exception process with an expiry date, not a silent override.", he: "<code>FROM node:20</code> בלי digest אומר ששני builds של אותו commit מייצרים images שונים. CVE קריטי חדש ב-base image מכשיל את ה-build — צריך תהליך חריגה מתועד עם תאריך תפוגה, לא override שקט." } },
      { from: 2, to: 3, ms: 15000,
        label: { en: "Sign the image and attach provenance", he: "חתימה על ה-image וצירוף provenance" },
        detail: { en: "<p>Keyless signing with Sigstore: the CI's OIDC identity gets a short-lived certificate from Fulcio; the signature is logged in the Rekor transparency log. Attach SBOM and SLSA provenance as attestations.</p><pre>cosign sign --yes ghcr.io/acme/payments@sha256:9f2c...\ncosign attest --yes --type cyclonedx \\\n  --predicate sbom.json ghcr.io/acme/payments@sha256:9f2c...</pre>", he: "<p>חתימה keyless עם Sigstore: זהות ה-OIDC של ה-CI מקבלת certificate קצר-חיים מ-Fulcio; החתימה נרשמת ב-transparency log של Rekor. מצרפים SBOM ו-SLSA provenance כ-attestations.</p><pre>cosign sign --yes ghcr.io/acme/payments@sha256:9f2c...\ncosign attest --yes --type cyclonedx \\\n  --predicate sbom.json ghcr.io/acme/payments@sha256:9f2c...</pre>" },
        fail: { en: "Signing by tag instead of digest: someone re-pushes the tag and the signature now 'covers' different bytes. Always sign and deploy by <code>@sha256:</code> digest.", he: "חתימה לפי tag במקום digest: מישהו עושה push מחדש ל-tag ועכשיו החתימה 'מכסה' בייטים אחרים. תמיד חותמים ועושים deploy לפי digest של <code>@sha256:</code>." } },
      { from: 2, to: 4, ms: 10000,
        label: { en: "Bump the image digest in the GitOps repo", he: "עדכון ה-image digest בריפו ה-GitOps" },
        detail: { en: "<p>CI opens a PR (or commits, for dev) to the environment repo changing one line. CI never holds cluster credentials — the change is just Git.</p><pre>images:\n- name: ghcr.io/acme/payments\n  digest: sha256:9f2c4e...   # was sha256:71ab09...</pre>", he: "<p>ה-CI פותח PR (או עושה commit, ל-dev) לריפו הסביבה ומשנה שורה אחת. ל-CI אין אף פעם credentials לקלאסטר — השינוי הוא רק Git.</p><pre>images:\n- name: ghcr.io/acme/payments\n  digest: sha256:9f2c4e...   # was sha256:71ab09...</pre>" },
        fail: { en: "Two pipelines bump the same file and one overwrites the other. Use per-service files (Kustomize overlays / Argo CD Image Updater) and let Git conflicts fail loudly.", he: "שני pipelines מעדכנים את אותו קובץ ואחד דורס את השני. משתמשים בקבצים לכל שירות (Kustomize overlays / Argo CD Image Updater) ונותנים לקונפליקטים ב-Git להיכשל ברעש." } },
      { from: 5, to: 4, ms: 60000,
        label: { en: "Argo CD detects the change and syncs", he: "Argo CD מזהה את השינוי ועושה sync" },
        detail: { en: "<p>Argo CD polls (default 3 min) or gets a webhook, renders manifests (Helm/Kustomize), diffs against live state and applies. Sync waves order dependencies (CRDs and migrations before Deployments).</p><pre>argocd app get payments-prod\nSync Status: OutOfSync -&gt; Synced (9f2c4e)\nHealth:      Progressing</pre>", he: "<p>Argo CD עושה polling (ברירת מחדל 3 דקות) או מקבל webhook, מרנדר manifests (Helm/Kustomize), משווה מול המצב החי ומחיל. Sync waves קובעים סדר תלויות (CRDs ומיגרציות לפני Deployments).</p><pre>argocd app get payments-prod\nSync Status: OutOfSync -&gt; Synced (9f2c4e)\nHealth:      Progressing</pre>" },
        fail: { en: "Sync stuck OutOfSync because a field is mutated by a controller (e.g. HPA changing replicas). Symptom: endless diffs. Fix with <code>ignoreDifferences</code> for that field; alert on OutOfSync &gt; 15 min.", he: "sync תקוע ב-OutOfSync כי controller משנה שדה (למשל HPA שמשנה replicas). סימפטום: diffs אינסופיים. מתקנים עם <code>ignoreDifferences</code> לשדה הזה; מתריעים על OutOfSync מעל 15 דקות." } },
      { from: 5, to: 6, ms: 500,
        label: { en: "Admission control verifies signature and policy", he: "Admission control מאמת חתימה ו-policy" },
        detail: { en: "<p>The API server calls admission webhooks: Kyverno verifies the cosign signature against the expected CI identity, and policies reject <code>:latest</code>, privileged pods, missing resource limits or missing probes.</p>", he: "<p>ה-API server קורא ל-admission webhooks: Kyverno מאמת את חתימת ה-cosign מול זהות ה-CI הצפויה, ו-policies דוחים <code>:latest</code>, pods עם privileged, חוסר ב-resource limits או חוסר ב-probes.</p>" },
        fail: { en: "If the policy webhook is down and <code>failurePolicy: Fail</code>, nothing can deploy (including the fix). Run the webhook HA (3 replicas, PDB), exclude kube-system, and alert on webhook latency/errors.", he: "אם ה-webhook של ה-policy נפל ו-<code>failurePolicy: Fail</code>, שום דבר לא יכול לעלות (כולל התיקון). מריצים את ה-webhook ב-HA (3 replicas, PDB), מחריגים את kube-system, ומתריעים על latency/שגיאות של ה-webhook." } },
      { from: 6, to: 7, ms: 60000,
        label: { en: "Canary starts at 5% of traffic", he: "Canary מתחיל ב-5% מהתעבורה" },
        detail: { en: "<p>Argo Rollouts creates the canary ReplicaSet and shifts weight via the ingress/mesh. Steps are declared, not improvised.</p><pre>strategy:\n  canary:\n    steps:\n    - setWeight: 5\n    - analysis: { templates: [ { templateName: slo-check } ] }\n    - setWeight: 25\n    - pause: { duration: 10m }\n    - setWeight: 50\n    - analysis: { templates: [ { templateName: slo-check } ] }</pre>", he: "<p>Argo Rollouts יוצר את ה-ReplicaSet של ה-canary ומעביר משקל דרך ה-ingress/mesh. השלבים מוצהרים, לא מאולתרים.</p><pre>strategy:\n  canary:\n    steps:\n    - setWeight: 5\n    - analysis: { templates: [ { templateName: slo-check } ] }\n    - setWeight: 25\n    - pause: { duration: 10m }\n    - setWeight: 50\n    - analysis: { templates: [ { templateName: slo-check } ] }</pre>" },
        fail: { en: "At low traffic, 5% is 3 requests a minute — statistically meaningless. Use minimum request counts in the analysis, or a longer bake time, or synthetic traffic against the canary.", he: "בתעבורה נמוכה, 5% זה 3 בקשות בדקה — חסר משמעות סטטיסטית. משתמשים במינימום בקשות ב-analysis, או בזמן אפייה ארוך יותר, או בתעבורה סינתטית מול ה-canary." } },
      { from: 7, to: 8, ms: 300000,
        label: { en: "Automated analysis queries Prometheus", he: "Analysis אוטומטי שואל את Prometheus" },
        detail: { en: "<p>The AnalysisTemplate compares the canary's error ratio and p99 against thresholds every minute; 2 failures abort the rollout.</p><pre>successCondition: result[0] &lt; 0.01\nquery: |\n  sum(rate(http_requests_total{app=\"payments\",\n    rollouts_pod_template_hash=\"{{args.hash}}\",code=~\"5..\"}[2m]))\n  / sum(rate(http_requests_total{app=\"payments\",\n    rollouts_pod_template_hash=\"{{args.hash}}\"}[2m]))</pre>", he: "<p>ה-AnalysisTemplate משווה כל דקה את יחס השגיאות וה-p99 של ה-canary מול ספים; 2 כישלונות מבטלים את ה-rollout.</p><pre>successCondition: result[0] &lt; 0.01\nquery: |\n  sum(rate(http_requests_total{app=\"payments\",\n    rollouts_pod_template_hash=\"{{args.hash}}\",code=~\"5..\"}[2m]))\n  / sum(rate(http_requests_total{app=\"payments\",\n    rollouts_pod_template_hash=\"{{args.hash}}\"}[2m]))</pre>" },
        fail: { en: "Prometheus unreachable → the query returns nothing. Decide explicitly: <code>inconclusive</code> should pause, not promote. Also compare canary vs stable, not vs a fixed number, so a global incident doesn't blame the canary.", he: "Prometheus לא נגיש ← ה-query לא מחזיר כלום. מחליטים במפורש: <code>inconclusive</code> צריך לעצור, לא לקדם. וגם משווים canary מול stable, לא מול מספר קבוע, כדי שתקלה גלובלית לא תואשם ב-canary." } },
      { from: 7, to: 6, ms: 1200000,
        label: { en: "Promote step by step to 100%", he: "קידום הדרגתי ל-100%" },
        detail: { en: "<p>Weights move 5 → 25 → 50 → 100 with analysis between. The old ReplicaSet is scaled down after <code>scaleDownDelaySeconds</code>, so an instant rollback is still possible for a few minutes.</p>", he: "<p>המשקלים זזים 5 ← 25 ← 50 ← 100 עם analysis ביניהם. ה-ReplicaSet הישן מוקטן אחרי <code>scaleDownDelaySeconds</code>, כך ש-rollback מיידי עדיין אפשרי כמה דקות.</p>" },
        fail: { en: "Database schema changes don't roll back with pods. Use expand/contract migrations so the old and new versions both work with the schema during the whole rollout.", he: "שינויי schema בדאטהבייס לא חוזרים אחורה עם ה-pods. משתמשים במיגרציות expand/contract כך שגם הגרסה הישנה וגם החדשה עובדות עם ה-schema לאורך כל ה-rollout." } },
      { from: 8, to: 0, ms: 600000,
        label: { en: "Post-deploy verification and notification", he: "אימות אחרי deploy והודעה" },
        detail: { en: "<p>Synthetic checks run against prod, the deploy is annotated on dashboards, the team channel gets 'payments 9f2c4e live in prod-eu', and DORA lead time is recorded.</p>", he: "<p>בדיקות סינתטיות רצות מול פרודקשן, ה-deploy מסומן על הדשבורדים, ערוץ הצוות מקבל 'payments 9f2c4e live in prod-eu', ו-lead time של DORA נרשם.</p>" },
        fail: { en: "Slow-burn bugs (memory leak, nightly job failure) appear hours later, after the canary finished. Keep SLO burn-rate alerts and correlate them with deploy annotations.", he: "באגים שבוערים לאט (memory leak, כישלון של job לילי) מופיעים שעות אחר כך, אחרי שה-canary הסתיים. משאירים התראות SLO burn-rate ומצליבים אותן עם annotations של deploy." } },
      { from: 0, to: 4, ms: 120000,
        label: { en: "Rollback path: revert the GitOps commit", he: "נתיב rollback: revert ל-commit ב-GitOps" },
        detail: { en: "<p>Rollback is just another commit: <code>git revert</code> in the environment repo puts the previous digest back and Argo CD syncs it. During a canary, <code>kubectl argo rollouts abort payments</code> shifts 100% back to stable in seconds.</p>", he: "<p>Rollback הוא סתם עוד commit: <code>git revert</code> בריפו הסביבה מחזיר את ה-digest הקודם ו-Argo CD עושה לו sync. בזמן canary, <code>kubectl argo rollouts abort payments</code> מחזיר 100% ל-stable בתוך שניות.</p>" },
        fail: { en: "Rolling back by <code>kubectl set image</code> by hand creates drift; Argo CD immediately re-applies the bad version. Always roll back through Git (or disable auto-sync explicitly, then re-enable).", he: "rollback ידני עם <code>kubectl set image</code> יוצר drift; Argo CD מיד מחיל שוב את הגרסה הרעה. תמיד עושים rollback דרך Git (או מכבים auto-sync במפורש ואז מדליקים מחדש)." } }
    ]
  },
  diagram: `Dev     Git     CI          Registry  GitOps   ArgoCD   K8s API   Rollouts  Prom
 |push-->|       |              |        |        |         |         |        |
 |       |--job->| test/SAST    |        |        |         |         |        |
 |       |       |--build+sign->|        |        |         |         |        |
 |       |       |--bump digest--------->|        |         |         |        |
 |       |       |              |        |<-poll--|         |         |        |
 |       |       |              |        |        |--apply->| admit   |        |
 |       |       |              |        |        |         |--canary>|        |
 |       |       |              |        |        |         |         |--query>|
 |       |       |              |        |        |         |<-promote|        |`,
  handsOn: [
    { cmd: "cosign verify ghcr.io/sigstore/cosign/cosign:v2.4.1 --certificate-identity-regexp '.*' --certificate-oidc-issuer-regexp '.*' | head -c 400", what: { en: "Verify a real keyless signature and see the certificate identity embedded in it.", he: "לאמת חתימה keyless אמיתית ולראות את זהות ה-certificate שמוטמעת בה." } },
    { cmd: "syft alpine:3.20 -o table | head -20", what: { en: "Generate an SBOM for an image: every package and version inside it.", he: "לייצר SBOM ל-image: כל חבילה וגרסה שבתוכו." } },
    { cmd: "trivy image --severity HIGH,CRITICAL python:3.12-slim", what: { en: "Scan a base image for known CVEs — the same gate CI uses.", he: "לסרוק base image ל-CVEs ידועים — אותו שער שה-CI משתמש בו." } },
    { cmd: "kubectl argo rollouts get rollout payments --watch", what: { en: "Watch a canary move through its steps and analysis runs live.", he: "לצפות ב-canary עובר את השלבים וריצות ה-analysis בזמן אמת." } },
    { cmd: "git log --oneline -5 -- envs/prod/payments && git revert --no-edit HEAD", what: { en: "Rollback the GitOps way: revert the digest bump and let Argo CD sync.", he: "rollback בדרך של GitOps: revert לעדכון ה-digest ולתת ל-Argo CD לעשות sync." } }
  ],
  mnemonic: {
    en: "Check, Review, Build-once, Sign, Pull, Admit, Canary, Revert — 'Careful Robots Build Safe Pipelines And Can Revert'.",
    he: "Check, Review, Build-once, Sign, Pull, Admit, Canary, Revert — 'רובוטים זהירים בונים צינורות בטוחים שיודעים לחזור אחורה'."
  },
  pitfalls: [
    { en: "Rebuilding the image per environment — what you tested is not what you shipped. Build once, promote the digest.", he: "לבנות image מחדש לכל סביבה — מה שבדקתם הוא לא מה ששלחתם. בונים פעם אחת ומקדמים את ה-digest." },
    { en: "Giving CI cluster-admin credentials 'to deploy' — a compromised CI then owns prod. With GitOps the cluster pulls and CI only writes to Git.", he: "לתת ל-CI credentials של cluster-admin 'בשביל deploy' — CI פרוץ שולט אז בפרודקשן. ב-GitOps הקלאסטר מושך וה-CI רק כותב ל-Git." },
    { en: "Canary analysis with no minimum sample size promotes on silence. Require N requests and treat 'no data' as failure.", he: "canary analysis בלי גודל מדגם מינימלי מקדם על שקט. דורשים N בקשות ומתייחסים ל'אין נתונים' ככישלון." },
    { en: "Non-backward-compatible DB migration in the same release as the code — rollback then breaks. Expand, deploy, contract in separate releases.", he: "מיגרציית DB לא תואמת לאחור באותו release עם הקוד — ואז rollback שובר. expand, deploy, contract ב-releases נפרדים." }
  ],
  interview: [
    { q: { en: "How do you prove the container running in prod came from reviewed code?", he: "איך מוכיחים שהקונטיינר שרץ בפרודקשן הגיע מקוד שעבר review?" },
      a: { en: "Branch protection + required review on main; CI builds only from main with an OIDC identity; keyless cosign signature + SLSA provenance attestation naming the repo, commit and workflow; deploy by digest via GitOps; an admission policy verifies the signature and the expected identity before any pod starts. Audit with Rekor and the provenance.", he: "Branch protection + review חובה על main; ה-CI בונה רק מ-main עם זהות OIDC; חתימת cosign keyless + SLSA provenance attestation שמציינת ריפו, commit ו-workflow; deploy לפי digest דרך GitOps; admission policy מאמתת את החתימה והזהות הצפויה לפני שכל pod עולה. בודקים ב-audit עם Rekor וה-provenance." } },
    { q: { en: "Your canary passed but errors rose an hour after 100%. What failed in the design?", he: "ה-canary עבר אבל השגיאות עלו שעה אחרי 100%. מה נכשל בתכנון?" },
      a: { en: "The analysis didn't cover the failure mode: load-dependent issues (connection pool exhaustion at full traffic), time-dependent ones (cache TTL expiry, cron jobs), or low canary sample size. Add saturation metrics, longer bake at 50%, compare against stable, keep burn-rate alerts tied to deploy annotations, and keep the old ReplicaSet around longer for a fast abort.", he: "ה-analysis לא כיסה את סוג הכשל: בעיות תלויות עומס (מיצוי connection pool בתעבורה מלאה), תלויות זמן (פקיעת TTL ב-cache, cron jobs), או מדגם קטן מדי ב-canary. מוסיפים מטריקות saturation, אפייה ארוכה ב-50%, השוואה מול stable, התראות burn-rate שקשורות ל-annotations של deploy, ומשאירים את ה-ReplicaSet הישן יותר זמן ל-abort מהיר." } }
  ],
  quiz: [
    { q: { en: "Why deploy by image digest rather than tag?", he: "למה עושים deploy לפי digest של image ולא לפי tag?" },
      options: [ { en: "Digests are shorter", he: "digests קצרים יותר" }, { en: "A digest is immutable; a tag can be re-pointed to different bytes", he: "digest הוא immutable; tag אפשר להפנות לבייטים אחרים" }, { en: "Kubernetes can't pull tags", he: "Kubernetes לא יודע למשוך tags" }, { en: "Tags can't be signed at all", he: "אי אפשר לחתום על tags בכלל" } ],
      answer: 1, explain: { en: "Signatures, scans and approvals apply to specific bytes. Only the digest guarantees those are the bytes that run.", he: "חתימות, סריקות ואישורים חלים על בייטים ספציפיים. רק ה-digest מבטיח שאלה הבייטים שרצים." } },
    { q: { en: "In GitOps, who applies changes to the cluster?", he: "ב-GitOps, מי מחיל שינויים על הקלאסטר?" },
      options: [ { en: "The CI runner with kubectl", he: "ה-CI runner עם kubectl" }, { en: "Developers from their laptops", he: "מפתחים מהלפטופ" }, { en: "An in-cluster agent (Argo CD/Flux) that pulls from Git", he: "agent בתוך הקלאסטר (Argo CD/Flux) שמושך מ-Git" }, { en: "The container registry", he: "ה-container registry" } ],
      answer: 2, explain: { en: "Pull-based: CI never needs cluster credentials, and Git is the audit log and the rollback mechanism.", he: "מבוסס pull: ל-CI אף פעם לא צריך credentials לקלאסטר, ו-Git הוא ה-audit log ומנגנון ה-rollback." } },
    { q: { en: "The Prometheus query in canary analysis returns no data. Safest behavior?", he: "ה-query ל-Prometheus ב-canary analysis לא מחזיר נתונים. ההתנהגות הבטוחה ביותר?" },
      options: [ { en: "Promote — no errors seen", he: "לקדם — לא נראו שגיאות" }, { en: "Treat as inconclusive/failed and pause or abort", he: "להתייחס כ-inconclusive/כישלון ולעצור או לבטל" }, { en: "Restart Prometheus automatically", he: "לאתחל את Prometheus אוטומטית" }, { en: "Skip analysis for this release", he: "לדלג על ה-analysis ל-release הזה" } ],
      answer: 1, explain: { en: "Absence of evidence isn't evidence of health. Promotion must require positive proof.", he: "היעדר ראיות הוא לא ראיה לבריאות. קידום חייב לדרוש הוכחה חיובית." } },
    { q: { en: "Which control stops an unsigned image even if someone has kubectl access?", he: "איזו בקרה עוצרת image לא חתום גם אם למישהו יש גישת kubectl?" },
      options: [ { en: "pre-commit hook", he: "pre-commit hook" }, { en: "SAST in CI", he: "SAST ב-CI" }, { en: "Admission policy verifying signatures", he: "admission policy שמאמתת חתימות" }, { en: "Code review", he: "Code review" } ],
      answer: 2, explain: { en: "Admission runs inside the API server path for every pod, regardless of who or what created it.", he: "Admission רץ בתוך הנתיב של ה-API server לכל pod, לא משנה מי או מה יצר אותו." } }
  ],
  related: ["cloud-cicd", "k8s-argocd", "k8s-argo-rollouts", "staff-supply-chain", "rel-deployments", "pr-code-review-quality", "flow-k8s-pod-lifecycle"]
});

INFRA.lessons.push({
  id: "flow-k8s-pod-lifecycle",
  track: "flows",
  order: 12,
  icon: "☸️",
  level: 3,
  minutes: 18,
  title: { en: "kubectl apply to First Request: a Pod's Life, Hop by Hop", he: "מ-kubectl apply עד הבקשה הראשונה: חיי Pod, קפיצה אחר קפיצה" },
  tldr: {
    en: "kubectl apply only writes desired state to etcd; a chain of independent controllers (Deployment, ReplicaSet, scheduler, kubelet, CNI, EndpointSlice, kube-proxy) each reacts to the previous one's write until traffic finally reaches a ready Pod — and termination runs the same chain in reverse.",
    he: "kubectl apply רק כותב מצב רצוי ל-etcd; שרשרת של controllers עצמאיים (Deployment, ReplicaSet, scheduler, kubelet, CNI, EndpointSlice, kube-proxy) — כל אחד מגיב לכתיבה של הקודם — עד שתעבורה מגיעה סוף סוף ל-Pod מוכן. וסיום (termination) מריץ את אותה שרשרת הפוך."
  },
  analogy: {
    en: "It's a restaurant with no manager shouting orders. You drop an order slip in the box (API server writes to etcd). The head chef sees 'need 3 burgers' and writes 3 tickets (ReplicaSet → Pods). The host looks at tickets with no table and assigns tables (scheduler). Each table's waiter sees a ticket assigned to them and actually cooks (kubelet). Only when the plate is ready (readiness probe) does the host add the table to the 'serving' board (EndpointSlice), and only then do customers get sent there (kube-proxy). Nobody calls anybody — everyone just watches the board.",
    he: "זו מסעדה בלי מנהל שצועק פקודות. אתה זורק פתק הזמנה לקופסה (ה-API server כותב ל-etcd). השף הראשי רואה 'צריך 3 המבורגרים' וכותב 3 כרטיסים (ReplicaSet ← Pods). המארחת מסתכלת על כרטיסים בלי שולחן ומשבצת שולחנות (scheduler). המלצר של כל שולחן רואה כרטיס ששובץ אליו ובאמת מבשל (kubelet). רק כשהצלחת מוכנה (readiness probe) המארחת מוסיפה את השולחן ללוח 'מגישים' (EndpointSlice), ורק אז שולחים לשם לקוחות (kube-proxy). אף אחד לא מתקשר לאף אחד — כולם רק מסתכלים על הלוח."
  },
  sections: [
    {
      h: { en: "Level-triggered controllers, not a pipeline", he: "Controllers מבוססי מצב, לא pipeline" },
      body: {
        en: `<p>The key mental model: Kubernetes has <strong>no orchestrator that calls step 2 after step 1</strong>. Every component <em>watches</em> the API server for objects it cares about and reconciles actual state toward desired state. That's why it self-heals (a deleted Pod is just a diff), and why debugging means asking "which controller hasn't acted yet, and why?".</p>
<table><tr><th>Component</th><th>Watches</th><th>Writes</th></tr>
<tr><td>Deployment controller</td><td>Deployments</td><td>ReplicaSets</td></tr>
<tr><td>ReplicaSet controller</td><td>ReplicaSets</td><td>Pods (no node yet)</td></tr>
<tr><td>Scheduler</td><td>Pods with empty <code>nodeName</code></td><td>Binding (sets nodeName)</td></tr>
<tr><td>kubelet</td><td>Pods bound to its node</td><td>Pod status, conditions</td></tr>
<tr><td>EndpointSlice controller</td><td>Services + ready Pods</td><td>EndpointSlices</td></tr>
<tr><td>kube-proxy / Cilium</td><td>Services + EndpointSlices</td><td>iptables / IPVS / eBPF maps</td></tr></table>`,
        he: `<p>המודל המנטלי המרכזי: ב-Kubernetes <strong>אין orchestrator שקורא לשלב 2 אחרי שלב 1</strong>. כל רכיב <em>עושה watch</em> על ה-API server לאובייקטים שמעניינים אותו ועושה reconcile מהמצב בפועל למצב הרצוי. בגלל זה הוא מרפא את עצמו (Pod שנמחק הוא סתם diff), ובגלל זה דיבאג פירושו לשאול "איזה controller עוד לא פעל, ולמה?".</p>
<table><tr><th>רכיב</th><th>עושה watch על</th><th>כותב</th></tr>
<tr><td>Deployment controller</td><td>Deployments</td><td>ReplicaSets</td></tr>
<tr><td>ReplicaSet controller</td><td>ReplicaSets</td><td>Pods (עדיין בלי node)</td></tr>
<tr><td>Scheduler</td><td>Pods עם <code>nodeName</code> ריק</td><td>Binding (קובע nodeName)</td></tr>
<tr><td>kubelet</td><td>Pods ששובצו ל-node שלו</td><td>status ו-conditions של ה-Pod</td></tr>
<tr><td>EndpointSlice controller</td><td>Services + Pods מוכנים</td><td>EndpointSlices</td></tr>
<tr><td>kube-proxy / Cilium</td><td>Services + EndpointSlices</td><td>iptables / IPVS / eBPF maps</td></tr></table>`
      }
    },
    {
      h: { en: "Timing budget: where the seconds go", he: "תקציב זמן: לאן הולכות השניות" },
      body: {
        en: `<table><tr><th>Phase</th><th>Typical</th><th>Bad day</th></tr>
<tr><td>API write + admission</td><td>20–100 ms</td><td>seconds (slow webhook)</td></tr>
<tr><td>Controllers create Pods</td><td>&lt; 1 s</td><td>seconds (API throttling)</td></tr>
<tr><td>Scheduling</td><td>10–100 ms</td><td>minutes (Pending → node autoscaling 60–120 s)</td></tr>
<tr><td>Image pull</td><td>2–30 s</td><td>minutes (1 GB image, registry rate limit)</td></tr>
<tr><td>Container start + app boot</td><td>1–5 s</td><td>60 s (JVM warmup, migrations at boot)</td></tr>
<tr><td>Readiness</td><td>5–15 s</td><td>never (probe misconfigured)</td></tr>
<tr><td>Endpoints → proxy rules</td><td>&lt; 1 s</td><td>seconds in huge clusters</td></tr></table>
<blockquote>💡 Real world: Most "slow scale-up" incidents are image pull and app boot, not Kubernetes. Small images, pre-pulled base layers, and fast startup paths beat any HPA tuning.</blockquote>`,
        he: `<table><tr><th>שלב</th><th>טיפוסי</th><th>ביום רע</th></tr>
<tr><td>כתיבה ל-API + admission</td><td>20–100ms</td><td>שניות (webhook איטי)</td></tr>
<tr><td>Controllers יוצרים Pods</td><td>&lt; 1 שנייה</td><td>שניות (throttling ב-API)</td></tr>
<tr><td>Scheduling</td><td>10–100ms</td><td>דקות (Pending ← node autoscaling של 60–120 שניות)</td></tr>
<tr><td>משיכת image</td><td>2–30 שניות</td><td>דקות (image של 1GB, rate limit ב-registry)</td></tr>
<tr><td>עליית container + boot של האפליקציה</td><td>1–5 שניות</td><td>60 שניות (warmup של JVM, מיגרציות ב-boot)</td></tr>
<tr><td>Readiness</td><td>5–15 שניות</td><td>אף פעם (probe מוגדר לא נכון)</td></tr>
<tr><td>Endpoints ← חוקי proxy</td><td>&lt; 1 שנייה</td><td>שניות בקלאסטרים ענקיים</td></tr></table>
<blockquote>💡 מהשטח: רוב תקלות ה-"scale-up איטי" הן משיכת image ו-boot של האפליקציה, לא Kubernetes. images קטנים, שכבות בסיס שנמשכו מראש, ומסלולי startup מהירים מנצחים כל כוונון של HPA.</blockquote>`
      }
    },
    {
      h: { en: "Graceful termination: the race nobody draws", he: "Graceful termination: המרוץ שאף אחד לא מצייר" },
      body: {
        en: `<p>When a Pod is deleted, two things start <em>in parallel</em>: kubelet sends SIGTERM to the container, and the EndpointSlice controller removes the Pod from endpoints — which then has to propagate to every node's kube-proxy and every ingress controller. If your app exits on SIGTERM immediately, in-flight and still-routed requests get connection refused.</p>
<pre>lifecycle:
  preStop:
    exec: { command: ["sleep", "10"] }   # let endpoints propagate
terminationGracePeriodSeconds: 45        # preStop + drain + margin</pre>
<p>Then the app should stop accepting new connections, finish in-flight requests, close DB pools and exit. Monitor 5xx spikes during deploys — they are almost always this race.</p>`,
        he: `<p>כש-Pod נמחק, שני דברים מתחילים <em>במקביל</em>: ה-kubelet שולח SIGTERM לקונטיינר, וה-EndpointSlice controller מוציא את ה-Pod מה-endpoints — וזה צריך להתפשט לכל kube-proxy בכל node ולכל ingress controller. אם האפליקציה יוצאת מיד על SIGTERM, בקשות באוויר ובקשות שעדיין מנותבות אליה מקבלות connection refused.</p>
<pre>lifecycle:
  preStop:
    exec: { command: ["sleep", "10"] }   # let endpoints propagate
terminationGracePeriodSeconds: 45        # preStop + drain + margin</pre>
<p>אחר כך האפליקציה צריכה להפסיק לקבל חיבורים חדשים, לסיים בקשות באוויר, לסגור DB pools ולצאת. מנטרים קפיצות 5xx בזמן deploys — זה כמעט תמיד המרוץ הזה.</p>`
      }
    }
  ],
  flow: {
    actors: ["kubectl", "API server", "etcd", "Controllers", "Scheduler", "kubelet", "Runtime+CNI", "kube-proxy", "Ingress", "Client"],
    steps: [
      { from: 0, to: 1, ms: 50,
        label: { en: "kubectl apply sends the manifest", he: "kubectl apply שולח את ה-manifest" },
        detail: { en: "<p>kubectl reads your kubeconfig, does a server-side apply (PATCH) over HTTPS. Authentication: client cert, OIDC token or cloud IAM (aws eks get-token).</p><pre>kubectl apply -f web.yaml --server-side -v=6\nPATCH https://10.0.0.1:443/apis/apps/v1/namespaces/shop/\n  deployments/web?fieldManager=kubectl 200 OK in 48 ms</pre>", he: "<p>kubectl קורא את ה-kubeconfig ועושה server-side apply (PATCH) ב-HTTPS. אימות: client cert, טוקן OIDC או IAM של הענן (aws eks get-token).</p><pre>kubectl apply -f web.yaml --server-side -v=6\nPATCH https://10.0.0.1:443/apis/apps/v1/namespaces/shop/\n  deployments/web?fieldManager=kubectl 200 OK in 48 ms</pre>" },
        fail: { en: "401 = authentication (expired token); 403 = RBAC. <code>kubectl auth can-i patch deployments -n shop</code> answers which.", he: "401 = אימות (טוקן שפג); 403 = RBAC. <code>kubectl auth can-i patch deployments -n shop</code> עונה מה מהשניים." } },
      { from: 1, to: 1, ms: 30,
        label: { en: "AuthN → AuthZ (RBAC) → admission", he: "AuthN ← AuthZ (RBAC) ← admission" },
        detail: { en: "<p>Order matters: authenticate the caller, authorize the verb/resource with RBAC, then mutating admission (inject sidecars, defaults), schema validation, then validating admission (Kyverno/Gatekeeper/ValidatingAdmissionPolicy).</p>", he: "<p>הסדר חשוב: מאמתים את הקורא, מאשרים את ה-verb/resource עם RBAC, אחר כך mutating admission (הזרקת sidecars, ברירות מחדל), בדיקת schema, ואז validating admission (Kyverno/Gatekeeper/ValidatingAdmissionPolicy).</p>" },
        fail: { en: "A slow or dead webhook blocks every write it matches. Symptom: <code>context deadline exceeded ... calling webhook</code>. Set timeouts (≤ 5 s), HA webhooks and exclude system namespaces.", he: "webhook איטי או מת חוסם כל כתיבה שהוא תופס. סימפטום: <code>context deadline exceeded ... calling webhook</code>. קובעים timeouts (≤ 5 שניות), webhooks ב-HA ומחריגים namespaces של המערכת." } },
      { from: 1, to: 2, ms: 10,
        label: { en: "Persist desired state in etcd", he: "שמירת המצב הרצוי ב-etcd" },
        detail: { en: "<p>The object is written to etcd via Raft (quorum of 3 or 5 members) and gets a new <code>resourceVersion</code>. Watchers are notified. That's all <code>apply</code> does — nothing is running yet.</p>", he: "<p>האובייקט נכתב ל-etcd דרך Raft (quorum של 3 או 5 חברים) ומקבל <code>resourceVersion</code> חדש. ה-watchers מקבלים הודעה. זה כל מה ש-<code>apply</code> עושה — עוד שום דבר לא רץ.</p>" },
        fail: { en: "etcd slow disk (fsync &gt; 10 ms) makes the whole control plane slow. Watch <code>etcd_disk_wal_fsync_duration_seconds</code> p99 and DB size vs quota (default 2 GB → read-only on overflow).", he: "דיסק איטי ב-etcd (fsync מעל 10ms) מאט את כל ה-control plane. עוקבים אחרי p99 של <code>etcd_disk_wal_fsync_duration_seconds</code> וגודל ה-DB מול המכסה (ברירת מחדל 2GB ← read-only כשעוברים)." } },
      { from: 3, to: 1, ms: 200,
        label: { en: "Deployment → ReplicaSet → Pods", he: "Deployment ← ReplicaSet ← Pods" },
        detail: { en: "<p>The Deployment controller sees a new pod template hash and creates a ReplicaSet; the ReplicaSet controller creates Pod objects with no node. Rolling update math: <code>maxSurge: 25%</code>, <code>maxUnavailable: 0</code> means new Pods first, old ones removed only when new are Ready.</p>", he: "<p>ה-Deployment controller רואה pod template hash חדש ויוצר ReplicaSet; ה-ReplicaSet controller יוצר אובייקטי Pod בלי node. החשבון של rolling update: <code>maxSurge: 25%</code>, <code>maxUnavailable: 0</code> אומר Pods חדשים קודם, וישנים יורדים רק כשהחדשים Ready.</p>" },
        fail: { en: "ResourceQuota exceeded: the ReplicaSet can't create Pods and nothing shows on <code>get pods</code>. Look at <code>kubectl describe rs</code> events: <code>exceeded quota</code>.", he: "חריגה מ-ResourceQuota: ה-ReplicaSet לא יכול ליצור Pods ושום דבר לא מופיע ב-<code>get pods</code>. מסתכלים על ה-events ב-<code>kubectl describe rs</code>: <code>exceeded quota</code>." } },
      { from: 4, to: 1, ms: 50,
        label: { en: "Scheduler filters and scores nodes, then binds", he: "ה-Scheduler מסנן ומדרג nodes, ואז עושה bind" },
        detail: { en: "<p><strong>Filter</strong>: enough allocatable CPU/memory for <em>requests</em>, taints/tolerations, node affinity, topology spread, volume zone. <strong>Score</strong>: spread, image locality, balanced allocation. Then it writes a Binding (sets <code>spec.nodeName</code>).</p>", he: "<p><strong>סינון</strong>: מספיק CPU/זיכרון allocatable ל-<em>requests</em>, taints/tolerations, node affinity, topology spread, zone של ה-volume. <strong>דירוג</strong>: פיזור, image locality, הקצאה מאוזנת. ואז כותב Binding (קובע <code>spec.nodeName</code>).</p>" },
        fail: { en: "Pod stays <code>Pending</code>: <code>0/12 nodes are available: 4 Insufficient cpu, 8 node(s) had untolerated taint</code>. Karpenter/Cluster Autoscaler may add a node (60–120 s); otherwise fix requests or taints.", he: "Pod נשאר <code>Pending</code>: <code>0/12 nodes are available: 4 Insufficient cpu, 8 node(s) had untolerated taint</code>. Karpenter/Cluster Autoscaler עשויים להוסיף node (60–120 שניות); אחרת מתקנים requests או taints." } },
      { from: 5, to: 1, ms: 100,
        label: { en: "kubelet sees a Pod bound to its node", he: "ה-kubelet רואה Pod ששובץ ל-node שלו" },
        detail: { en: "<p>The kubelet's watch delivers the Pod. It sets up volumes (mount secrets/configmaps, attach PVs via CSI) and asks the container runtime (containerd via CRI) to create the Pod sandbox.</p>", he: "<p>ה-watch של ה-kubelet מביא את ה-Pod. הוא מכין volumes (mount ל-secrets/configmaps, attach ל-PVs דרך CSI) ומבקש מה-container runtime (containerd דרך CRI) ליצור את ה-sandbox של ה-Pod.</p>" },
        fail: { en: "PV in another AZ: <code>volume node affinity conflict</code>. Use <code>WaitForFirstConsumer</code> storage classes so volumes are created where the Pod lands.", he: "PV ב-AZ אחר: <code>volume node affinity conflict</code>. משתמשים ב-storage classes עם <code>WaitForFirstConsumer</code> כדי שה-volumes ייווצרו איפה שה-Pod נוחת." } },
      { from: 5, to: 6, ms: 300,
        label: { en: "Sandbox + CNI: the Pod gets an IP", he: "Sandbox + CNI: ה-Pod מקבל IP" },
        detail: { en: "<p>containerd creates the pause container (network namespace) and calls the CNI plugin (AWS VPC CNI, Cilium, Calico) which allocates a Pod IP, creates the veth pair and routes.</p><pre>kubectl get pod web-7d9f-abc -o wide\nNAME          READY  STATUS             IP          NODE\nweb-7d9f-abc  0/1    ContainerCreating  10.42.3.17  ip-10-0-2-31</pre>", he: "<p>containerd יוצר את ה-pause container (network namespace) וקורא ל-plugin של ה-CNI (AWS VPC CNI, Cilium, Calico) שמקצה IP ל-Pod, יוצר את זוג ה-veth ואת ה-routes.</p><pre>kubectl get pod web-7d9f-abc -o wide\nNAME          READY  STATUS             IP          NODE\nweb-7d9f-abc  0/1    ContainerCreating  10.42.3.17  ip-10-0-2-31</pre>" },
        fail: { en: "IP exhaustion (VPC CNI: subnet out of IPs, or ENI limit per instance): <code>failed to assign an IP address to container</code>. Plan bigger Pod subnets or prefix delegation.", he: "מיצוי כתובות IP (VPC CNI: נגמרו IPs ב-subnet, או מגבלת ENI לאינסטנס): <code>failed to assign an IP address to container</code>. מתכננים subnets גדולים יותר ל-Pods או prefix delegation." } },
      { from: 6, to: 6, ms: 8000,
        label: { en: "Pull the image (by digest)", he: "משיכת ה-image (לפי digest)" },
        detail: { en: "<p>Layers already on the node are reused. <code>imagePullPolicy: IfNotPresent</code> with a digest is the fastest and safest. Private registries need <code>imagePullSecrets</code> or node IAM.</p>", he: "<p>שכבות שכבר נמצאות על ה-node נעשה בהן שימוש חוזר. <code>imagePullPolicy: IfNotPresent</code> עם digest זה הכי מהיר והכי בטוח. registries פרטיים צריכים <code>imagePullSecrets</code> או IAM של ה-node.</p>" },
        fail: { en: "<code>ErrImagePull</code> / <code>ImagePullBackOff</code>: wrong tag, missing credentials, Docker Hub rate limit (100 pulls/6 h anonymous). Mirror images to your own registry.", he: "<code>ErrImagePull</code> / <code>ImagePullBackOff</code>: tag שגוי, חסרים credentials, rate limit של Docker Hub (100 משיכות ל-6 שעות באנונימי). עושים mirror ל-images ל-registry שלכם." } },
      { from: 6, to: 5, ms: 3000,
        label: { en: "Init containers, then app containers start", he: "Init containers, ואז קונטיינרי האפליקציה עולים" },
        detail: { en: "<p>Init containers run sequentially to completion (wait for DB, run migrations — careful). Native sidecars (<code>restartPolicy: Always</code> init containers, K8s 1.29+) start before the app and stop after it.</p>", he: "<p>Init containers רצים לפי הסדר עד שהם מסתיימים (מחכים ל-DB, מריצים מיגרציות — בזהירות). native sidecars (init containers עם <code>restartPolicy: Always</code>, K8s 1.29+) עולים לפני האפליקציה ויורדים אחריה.</p>" },
        fail: { en: "<code>CrashLoopBackOff</code>: the process exits. <code>kubectl logs --previous</code> shows why; exit code 137 = OOMKilled (memory limit), 1 = app error, 127 = command not found.", he: "<code>CrashLoopBackOff</code>: ה-process יוצא. <code>kubectl logs --previous</code> מראה למה; exit code 137 = OOMKilled (memory limit), 1 = שגיאת אפליקציה, 127 = הפקודה לא נמצאה." } },
      { from: 5, to: 5, ms: 10000,
        label: { en: "Startup and readiness probes pass", he: "Startup ו-readiness probes עוברים" },
        detail: { en: "<p>startupProbe protects slow boots from liveness kills; readinessProbe decides if the Pod receives traffic. Readiness checks the app's own ability to serve (not deep dependency checks that cascade).</p><pre>readinessProbe:\n  httpGet: { path: /ready, port: 8080 }\n  periodSeconds: 5\n  failureThreshold: 3</pre>", he: "<p>startupProbe מגן על boots איטיים מפני liveness kills; readinessProbe מחליט אם ה-Pod מקבל תעבורה. readiness בודק את היכולת של האפליקציה עצמה לשרת (לא בדיקות עומק של dependencies שמתגלגלות למפל).</p><pre>readinessProbe:\n  httpGet: { path: /ready, port: 8080 }\n  periodSeconds: 5\n  failureThreshold: 3</pre>" },
        fail: { en: "Readiness that checks the DB: DB blips → every Pod unready at once → total outage instead of degraded. Liveness that checks dependencies → restart storms.", he: "readiness שבודק את ה-DB: ה-DB מגמגם ← כל ה-Pods לא מוכנים בבת אחת ← השבתה מלאה במקום שירות חלקי. liveness שבודק dependencies ← סערת restarts." } },
      { from: 3, to: 7, ms: 500,
        label: { en: "EndpointSlice updated → proxy rules programmed", he: "EndpointSlice מתעדכן ← חוקי proxy מתוכנתים" },
        detail: { en: "<p>The Pod's Ready condition flips; the EndpointSlice controller adds its IP to the Service's slices; kube-proxy on every node (or Cilium eBPF) updates its rules so the ClusterIP load-balances to the new Pod.</p><pre>kubectl get endpointslices -l kubernetes.io/service-name=web\nNAME       ADDRESSTYPE  PORTS  ENDPOINTS\nweb-x7k2p  IPv4         8080   10.42.3.17,10.42.1.9</pre>", he: "<p>ה-condition של Ready ב-Pod מתהפך; ה-EndpointSlice controller מוסיף את ה-IP שלו ל-slices של ה-Service; kube-proxy בכל node (או Cilium eBPF) מעדכן את החוקים כך שה-ClusterIP מאזן עומס גם ל-Pod החדש.</p><pre>kubectl get endpointslices -l kubernetes.io/service-name=web\nNAME       ADDRESSTYPE  PORTS  ENDPOINTS\nweb-x7k2p  IPv4         8080   10.42.3.17,10.42.1.9</pre>" },
        fail: { en: "Service selector doesn't match Pod labels → empty endpoints → 503 from the ingress. Always check endpoints when a Service 'doesn't work'.", he: "ה-selector של ה-Service לא תואם ל-labels של ה-Pod ← endpoints ריקים ← 503 מה-ingress. תמיד בודקים endpoints כש-Service 'לא עובד'." } },
      { from: 8, to: 7, ms: 1000,
        label: { en: "Ingress controller picks up the new upstream", he: "ה-Ingress controller קולט את ה-upstream החדש" },
        detail: { en: "<p>NGINX Ingress / Envoy Gateway watch EndpointSlices too and route directly to Pod IPs (bypassing ClusterIP). Cloud LBs in IP mode (AWS LB Controller) register the Pod IP as a target and wait for their own health check.</p>", he: "<p>NGINX Ingress / Envoy Gateway גם עושים watch על EndpointSlices ומנתבים ישירות ל-IPs של Pods (בלי ClusterIP). Load balancers של הענן במצב IP (AWS LB Controller) רושמים את ה-IP של ה-Pod כ-target ומחכים ל-health check משלהם.</p>" },
        fail: { en: "Cloud LB health check slower than the rollout: old Pods removed before new targets are healthy → brief 502s. Use pod readiness gates (<code>elbv2.k8s.aws/pod-readiness-gate-inject</code>).", he: "health check של ה-LB בענן איטי יותר מה-rollout: Pods ישנים יורדים לפני שה-targets החדשים בריאים ← 502 לרגע. משתמשים ב-pod readiness gates (<code>elbv2.k8s.aws/pod-readiness-gate-inject</code>)." } },
      { from: 9, to: 8, ms: 40,
        label: { en: "First real request reaches the Pod", he: "הבקשה האמיתית הראשונה מגיעה ל-Pod" },
        detail: { en: "<p>Client → DNS → cloud LB → ingress → Pod IP. The first requests are often slow (cold caches, JIT, connection pools) — warm up in the startup path or ramp traffic slowly.</p>", he: "<p>לקוח ← DNS ← LB של הענן ← ingress ← IP של ה-Pod. הבקשות הראשונות הרבה פעמים איטיות (caches קרים, JIT, connection pools) — עושים warmup במסלול ה-startup או מעלים תעבורה בהדרגה.</p>" },
        fail: { en: "p99 spike right after each deploy = cold start. Add warmup, readiness that waits for caches, or a slow-start setting on the LB.", he: "קפיצה ב-p99 מיד אחרי כל deploy = cold start. מוסיפים warmup, readiness שמחכה ל-caches, או slow-start ב-LB." } },
      { from: 0, to: 1, ms: 50,
        label: { en: "Later: the Pod is deleted (rollout / scale-in)", he: "בהמשך: ה-Pod נמחק (rollout / scale-in)" },
        detail: { en: "<p>The API server sets <code>deletionTimestamp</code>. In parallel: endpoints controller removes the Pod from EndpointSlices, and the kubelet starts termination.</p>", he: "<p>ה-API server קובע <code>deletionTimestamp</code>. במקביל: ה-endpoints controller מוציא את ה-Pod מה-EndpointSlices, וה-kubelet מתחיל termination.</p>" },
        fail: { en: "Without a PodDisruptionBudget, a node drain can remove all replicas at once. Set <code>minAvailable</code> or <code>maxUnavailable</code>.", he: "בלי PodDisruptionBudget, drain של node יכול להוריד את כל ה-replicas בבת אחת. קובעים <code>minAvailable</code> או <code>maxUnavailable</code>." } },
      { from: 5, to: 6, ms: 10000,
        label: { en: "preStop, then SIGTERM, drain, exit", he: "preStop, ואז SIGTERM, ריקון, יציאה" },
        detail: { en: "<p>kubelet runs <code>preStop</code> (e.g. sleep 10 so endpoint removal propagates), then sends SIGTERM to PID 1. The app stops accepting, drains in-flight work, exits 0. After <code>terminationGracePeriodSeconds</code> (default 30) it gets SIGKILL.</p>", he: "<p>ה-kubelet מריץ <code>preStop</code> (למשל sleep 10 כדי שההסרה מה-endpoints תתפשט), ואז שולח SIGTERM ל-PID 1. האפליקציה מפסיקה לקבל, מרוקנת עבודה באוויר ויוצאת עם 0. אחרי <code>terminationGracePeriodSeconds</code> (ברירת מחדל 30) היא מקבלת SIGKILL.</p>" },
        fail: { en: "PID 1 is a shell script that doesn't forward signals → the app never sees SIGTERM and is killed after 30 s. Use <code>exec</code> in entrypoints or tini/dumb-init.", he: "PID 1 הוא סקריפט shell שלא מעביר signals ← האפליקציה לא רואה SIGTERM ונהרגת אחרי 30 שניות. משתמשים ב-<code>exec</code> ב-entrypoints או ב-tini/dumb-init." } }
    ]
  },
  diagram: `kubectl  API    etcd   ctrl-mgr  sched  kubelet  runtime/CNI  proxy  ingress
  |apply->|       |        |        |       |         |          |       |
  |       |authz+admission  |        |       |         |          |       |
  |       |-write>|        |        |       |         |          |       |
  |       |<-watch---------|        |       |         |          |       |
  |       |<-create Pods---|        |       |         |          |       |
  |       |<-bind nodeName---------|        |         |          |       |
  |       |-------watch------------------->|          |          |       |
  |       |                         |       |-sandbox,IP,pull,start>|    |
  |       |<-status Ready-------------------|         |          |       |
  |       |-EndpointSlice watch-------------------------------->|------>|
  client ------------------------------------------------------------>Pod`,
  handsOn: [
    { cmd: "kubectl apply -f web.yaml && kubectl get events -n shop --sort-by=.lastTimestamp -w", what: { en: "Watch the controller chain in real time: ScalingReplicaSet → Scheduled → Pulling → Pulled → Created → Started.", he: "לצפות בשרשרת ה-controllers בזמן אמת: ScalingReplicaSet ← Scheduled ← Pulling ← Pulled ← Created ← Started." } },
    { cmd: "kubectl get pod web-7d9f-abc -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.lastTransitionTime}{\"\\n\"}{end}'", what: { en: "See PodScheduled, Initialized, ContainersReady, Ready transition times — your per-phase timing budget.", he: "לראות את זמני המעבר של PodScheduled, Initialized, ContainersReady, Ready — תקציב הזמן לכל שלב." } },
    { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=web -o wide", what: { en: "Confirm which Pod IPs actually receive traffic.", he: "לוודא אילו IPs של Pods באמת מקבלים תעבורה." } },
    { cmd: "kubectl auth can-i create deployments -n shop --as=system:serviceaccount:ci:deployer", what: { en: "Check RBAC for a service account before blaming the pipeline.", he: "לבדוק RBAC של service account לפני שמאשימים את ה-pipeline." } }
  ],
  mnemonic: {
    en: "Write, Watch, Schedule, Start, Ready, Route — and on the way out: Unroute before you Stop.",
    he: "Write, Watch, Schedule, Start, Ready, Route — וביציאה: קודם מוציאים מהניתוב, אחר כך עוצרים."
  },
  pitfalls: [
    { en: "Assuming <code>kubectl apply</code> succeeded means the app is running. It only means etcd accepted desired state — use <code>kubectl rollout status</code>.", he: "להניח ש-<code>kubectl apply</code> שהצליח אומר שהאפליקציה רצה. זה רק אומר ש-etcd קיבל מצב רצוי — משתמשים ב-<code>kubectl rollout status</code>." },
    { en: "No requests set: the scheduler packs Pods onto nodes that can't actually hold them, then OOM kills and CPU throttling follow.", he: "בלי requests: ה-scheduler דוחס Pods ל-nodes שלא באמת יכולים להכיל אותם, ואחר כך באים OOM kills ו-CPU throttling." },
    { en: "Exiting immediately on SIGTERM without preStop — 5xx on every deploy because endpoint removal hasn't propagated yet.", he: "לצאת מיד על SIGTERM בלי preStop — 5xx בכל deploy כי ההסרה מה-endpoints עוד לא התפשטה." }
  ],
  interview: [
    { q: { en: "Walk me through what happens after kubectl apply until a request hits the new Pod.", he: "תסביר מה קורה אחרי kubectl apply עד שבקשה מגיעה ל-Pod החדש." },
      a: { en: "API server authenticates, authorizes (RBAC), runs mutating and validating admission, persists to etcd. Deployment controller creates a ReplicaSet, which creates Pods. Scheduler filters/scores nodes and binds. kubelet sets up volumes, CRI creates the sandbox, CNI assigns an IP, image is pulled, init then app containers start, probes pass, the Pod becomes Ready. EndpointSlice controller adds the IP; kube-proxy/eBPF and the ingress controller update routing; traffic flows. Each step is an independent controller reacting to a watch.", he: "ה-API server מאמת, מאשר (RBAC), מריץ mutating ו-validating admission, ושומר ב-etcd. ה-Deployment controller יוצר ReplicaSet, שיוצר Pods. ה-scheduler מסנן/מדרג nodes ועושה bind. ה-kubelet מכין volumes, ה-CRI יוצר sandbox, ה-CNI מקצה IP, ה-image נמשך, init ואז קונטיינרי האפליקציה עולים, ה-probes עוברים, וה-Pod הופך Ready. ה-EndpointSlice controller מוסיף את ה-IP; kube-proxy/eBPF וה-ingress controller מעדכנים ניתוב; התעבורה זורמת. כל שלב הוא controller עצמאי שמגיב ל-watch." } },
    { q: { en: "Every deploy causes a few seconds of 502s. Where do you look?", he: "כל deploy גורם לכמה שניות של 502. איפה מחפשים?" },
      a: { en: "Termination race: Pods exit before endpoint removal propagates to proxies/ingress/cloud LB. Add preStop sleep, handle SIGTERM by draining, make sure PID 1 receives signals, use readiness gates for cloud LBs, and maxUnavailable 0 with readiness that reflects real readiness. Verify by correlating 502 timestamps with Pod termination events.", he: "מרוץ ב-termination: Pods יוצאים לפני שההסרה מה-endpoints מתפשטת ל-proxies/ingress/LB של הענן. מוסיפים preStop sleep, מטפלים ב-SIGTERM ע\"י ריקון, מוודאים ש-PID 1 מקבל signals, משתמשים ב-readiness gates ל-LBs בענן, ו-maxUnavailable 0 עם readiness שמשקף מוכנות אמיתית. מאמתים ע\"י הצלבת זמני ה-502 עם events של termination." } }
  ],
  quiz: [
    { q: { en: "Which component sets a Pod's nodeName?", he: "איזה רכיב קובע את ה-nodeName של Pod?" },
      options: [ { en: "kubelet", he: "kubelet" }, { en: "The scheduler, via a Binding", he: "ה-scheduler, דרך Binding" }, { en: "The ReplicaSet controller", he: "ה-ReplicaSet controller" }, { en: "etcd", he: "etcd" } ],
      answer: 1, explain: { en: "Pods are created unscheduled; the scheduler watches for empty nodeName and binds.", he: "Pods נוצרים בלי שיבוץ; ה-scheduler עושה watch על nodeName ריק ועושה bind." } },
    { q: { en: "A Service returns 503 and its EndpointSlice is empty. Most likely cause?", he: "Service מחזיר 503 וה-EndpointSlice שלו ריק. הסיבה הסבירה ביותר?" },
      options: [ { en: "etcd is down", he: "etcd נפל" }, { en: "Selector/label mismatch or no Ready Pods", he: "אי-התאמה בין selector ל-labels או שאין Pods במצב Ready" }, { en: "The image is too big", he: "ה-image גדול מדי" }, { en: "DNS TTL too high", he: "TTL ב-DNS גבוה מדי" } ],
      answer: 1, explain: { en: "Endpoints only include Pods that match the selector AND are Ready.", he: "Endpoints כוללים רק Pods שתואמים ל-selector וגם במצב Ready." } },
    { q: { en: "Exit code 137 in a CrashLoopBackOff usually means:", he: "Exit code 137 ב-CrashLoopBackOff בדרך כלל אומר:" },
      options: [ { en: "Command not found", he: "הפקודה לא נמצאה" }, { en: "Killed by SIGKILL — commonly OOMKilled", he: "נהרג ב-SIGKILL — בדרך כלל OOMKilled" }, { en: "Graceful exit", he: "יציאה מסודרת" }, { en: "Image pull failed", he: "משיכת ה-image נכשלה" } ],
      answer: 1, explain: { en: "137 = 128 + 9 (SIGKILL). Check <code>lastState.terminated.reason: OOMKilled</code>.", he: "137 = 128 + 9 (SIGKILL). בודקים <code>lastState.terminated.reason: OOMKilled</code>." } },
    { q: { en: "Why add a preStop sleep before shutdown?", he: "למה להוסיף preStop sleep לפני כיבוי?" },
      options: [ { en: "To save CPU", he: "כדי לחסוך CPU" }, { en: "To let endpoint removal propagate so no new requests arrive after exit", he: "כדי לתת להסרה מה-endpoints להתפשט, כך שלא יגיעו בקשות חדשות אחרי היציאה" }, { en: "Kubernetes requires it", he: "Kubernetes דורש את זה" }, { en: "To flush logs to disk", he: "כדי לשטוף logs לדיסק" } ],
      answer: 1, explain: { en: "SIGTERM and endpoint removal start in parallel; the sleep covers the propagation gap.", he: "SIGTERM וההסרה מה-endpoints מתחילים במקביל; ה-sleep מכסה את פער ההתפשטות." } }
  ],
  related: ["k8s-architecture", "k8s-pods", "k8s-scheduling", "k8s-probes", "k8s-services", "k8s-troubleshooting-playbook", "flow-commit-to-prod"]
});

INFRA.lessons.push({
  id: "flow-event-pipeline",
  track: "flows",
  order: 13,
  icon: "📈",
  level: 3,
  minutes: 17,
  title: { en: "From Click to Dashboard: an Analytics Event Pipeline, Hop by Hop", he: "מקליק לדשבורד: pipeline של אירועי אנליטיקה, קפיצה אחר קפיצה" },
  tldr: {
    en: "An event is batched on the client, accepted at the edge, durably logged in Kafka by a chosen key, validated against a schema, deduplicated and windowed by event time in a stream processor, landed in a lake table and an OLAP store, modeled with dbt, and finally read by a dashboard — and the whole thing must survive late data, replays and backfills.",
    he: "אירוע נאסף ב-batch אצל הלקוח, מתקבל ב-edge, נרשם באופן עמיד ב-Kafka לפי key שנבחר, נבדק מול schema, עובר dedupe ו-windowing לפי event time ב-stream processor, נוחת בטבלת lake וב-OLAP store, ממודל עם dbt, ולבסוף נקרא ע\"י דשבורד — וכל זה חייב לשרוד late data, replays ו-backfills."
  },
  analogy: {
    en: "It's the postal system for millions of postcards. People drop postcards in the local mailbox in bundles (SDK batching). The sorting center stamps and logs every one in an append-only ledger (Kafka). An inspector rejects postcards with the wrong form (schema registry). A clerk removes duplicates, groups cards by the date written on them — not the date they arrived — and waits a bit for stragglers (watermarks). Cards go to the archive (data lake) and to a fast lookup desk (OLAP). Analysts write the official report from that (dbt), and the boss reads the summary on the wall (dashboard).",
    he: "זו מערכת הדואר למיליוני גלויות. אנשים זורקים גלויות לתיבה השכונתית בחבילות (batching ב-SDK). מרכז המיון מחתים ורושם כל אחת בפנקס שרק מוסיפים אליו (Kafka). מפקח דוחה גלויות עם טופס שגוי (schema registry). פקיד מוציא כפולות, מקבץ גלויות לפי התאריך שכתוב עליהן — לא התאריך שבו הגיעו — ומחכה קצת למאחרות (watermarks). הגלויות הולכות לארכיון (data lake) ולדלפק שליפה מהיר (OLAP). אנליסטים כותבים מזה את הדוח הרשמי (dbt), והבוס קורא את הסיכום על הקיר (דשבורד)."
  },
  sections: [
    {
      h: { en: "The design decisions that matter", he: "החלטות התכנון שבאמת משנות" },
      body: {
        en: `<ul>
<li><strong>Event time vs processing time.</strong> Mobile clients go offline; an event from 09:58 may arrive at 11:30. Aggregate by event time, use watermarks to decide when a window is 'done', and route very late events to a correction path.</li>
<li><strong>Delivery semantics.</strong> The SDK retries → duplicates. Give every event a client-generated <code>event_id</code> (UUIDv7) and dedupe downstream. End to end you get <em>effectively once</em>, not exactly once.</li>
<li><strong>Partition key.</strong> Key by <code>user_id</code> or <code>session_id</code> to keep per-user order; avoid keys with skew (one giant tenant = one hot partition).</li>
<li><strong>Schema contract.</strong> Events are a public API between product teams and data teams. A registry with compatibility rules prevents a mobile release from breaking every dashboard.</li>
<li><strong>Replayability.</strong> Keep raw events (Kafka retention days + raw lake table forever). Every derived table must be rebuildable from raw.</li>
</ul>`,
        he: `<ul>
<li><strong>Event time מול processing time.</strong> לקוחות מובייל יוצאים מכיסוי; אירוע מ-09:58 יכול להגיע ב-11:30. מצברים לפי event time, משתמשים ב-watermarks כדי להחליט מתי חלון 'נסגר', ומנתבים אירועים מאוד מאוחרים לנתיב תיקון.</li>
<li><strong>סמנטיקת מסירה.</strong> ה-SDK עושה retry ← כפילויות. נותנים לכל אירוע <code>event_id</code> שנוצר אצל הלקוח (UUIDv7) ועושים dedupe בהמשך. מקצה לקצה מקבלים <em>effectively once</em>, לא exactly once.</li>
<li><strong>Partition key.</strong> מפתחים לפי <code>user_id</code> או <code>session_id</code> כדי לשמור סדר לכל משתמש; נמנעים מ-keys עם skew (tenant ענק אחד = partition חם אחד).</li>
<li><strong>חוזה schema.</strong> אירועים הם API ציבורי בין צוותי מוצר לצוותי דאטה. registry עם כללי תאימות מונע מ-release של מובייל לשבור כל דשבורד.</li>
<li><strong>יכולת replay.</strong> שומרים אירועים גולמיים (retention של ימים ב-Kafka + טבלת raw ב-lake לתמיד). כל טבלה נגזרת חייבת להיות ניתנת לבנייה מחדש מה-raw.</li>
</ul>`
      }
    },
    {
      h: { en: "Latency and freshness budget", he: "תקציב latency ו-freshness" },
      body: {
        en: `<table><tr><th>Hop</th><th>Typical added delay</th></tr>
<tr><td>SDK batch (every 10 s or 50 events)</td><td>0–10 s</td></tr>
<tr><td>Edge collector → Kafka (acks=all)</td><td>10–50 ms</td></tr>
<tr><td>Stream processing (1-min tumbling window + 2-min watermark)</td><td>~3 min</td></tr>
<tr><td>ClickHouse insert (batched)</td><td>1–5 s</td></tr>
<tr><td>Iceberg commit (every 5 min)</td><td>≤ 5 min</td></tr>
<tr><td>dbt hourly models</td><td>≤ 60 min</td></tr></table>
<p>So "real-time" dashboards from ClickHouse are ~3–4 minutes fresh, while finance-grade numbers from dbt are hourly. Say that explicitly in the dashboard — <strong>freshness is a feature with an SLO</strong> (e.g. "99% of minutes, data is &lt; 5 min old").</p>`,
        he: `<table><tr><th>קפיצה</th><th>עיכוב טיפוסי שנוסף</th></tr>
<tr><td>batch ב-SDK (כל 10 שניות או 50 אירועים)</td><td>0–10 שניות</td></tr>
<tr><td>Edge collector ← Kafka (acks=all)</td><td>10–50ms</td></tr>
<tr><td>Stream processing (חלון tumbling של דקה + watermark של 2 דקות)</td><td>~3 דקות</td></tr>
<tr><td>insert ל-ClickHouse (ב-batch)</td><td>1–5 שניות</td></tr>
<tr><td>commit ל-Iceberg (כל 5 דקות)</td><td>≤ 5 דקות</td></tr>
<tr><td>מודלים שעתיים ב-dbt</td><td>≤ 60 דקות</td></tr></table>
<p>אז דשבורדים "בזמן אמת" מ-ClickHouse טריים בערך ל-3–4 דקות, בזמן שמספרים ברמת finance מ-dbt הם שעתיים. אומרים את זה במפורש בדשבורד — <strong>freshness הוא feature עם SLO</strong> (למשל "ב-99% מהדקות, הדאטה בן פחות מ-5 דקות").</p>`
      }
    },
    {
      h: { en: "Privacy and security checkpoints", he: "נקודות בדיקה של פרטיות ואבטחה" },
      body: {
        en: `<ul>
<li>Consent check in the SDK before sending (no consent → no event, or anonymous-only).</li>
<li>Strip or hash PII at the edge (IP → coarse geo, then drop the IP). Never put emails in event properties.</li>
<li>Authenticate producers (per-app write keys, rate limits per key) — the collector is a public endpoint.</li>
<li>Per-topic ACLs in Kafka; column-level access in the warehouse; retention per data class.</li>
<li>Right-to-erasure: keep a <code>user_id</code> → deletion job across lake (Iceberg row-level deletes) and OLAP (ClickHouse lightweight deletes / TTL).</li>
</ul>`,
        he: `<ul>
<li>בדיקת consent ב-SDK לפני שליחה (אין consent ← אין אירוע, או רק אנונימי).</li>
<li>מסירים או עושים hash ל-PII ב-edge (IP ← geo גס, ואז זורקים את ה-IP). אף פעם לא שמים אימיילים ב-properties של אירוע.</li>
<li>מאמתים producers (write keys לכל אפליקציה, rate limits לכל key) — ה-collector הוא endpoint ציבורי.</li>
<li>ACLs לכל topic ב-Kafka; גישה ברמת עמודה ב-warehouse; retention לפי סוג דאטה.</li>
<li>זכות למחיקה: מחזיקים job מחיקה לפי <code>user_id</code> לאורך ה-lake (row-level deletes ב-Iceberg) וה-OLAP (lightweight deletes / TTL ב-ClickHouse).</li>
</ul>`
      }
    }
  ],
  flow: {
    actors: ["App SDK", "Edge collector", "Kafka", "Schema registry", "Flink", "ClickHouse", "Iceberg lake", "dbt", "Dashboard"],
    steps: [
      { from: 0, to: 0, ms: 10000,
        label: { en: "Track the click and batch locally", he: "רישום הקליק ואיסוף ב-batch מקומי" },
        detail: { en: "<p>The SDK builds the event with a UUIDv7 <code>event_id</code>, client <code>event_time</code>, anonymous/user id, and queues it on disk. It flushes every 10 s or 50 events, gzip-compressed.</p><pre>{ \"event_id\": \"0193a6f2-...\", \"type\": \"checkout_click\",\n  \"event_time\": \"2026-11-13T09:58:02.114Z\",\n  \"user_id\": \"u_8812\", \"props\": { \"cart_items\": 3 } }</pre>", he: "<p>ה-SDK בונה את האירוע עם <code>event_id</code> מסוג UUIDv7, <code>event_time</code> של הלקוח, מזהה אנונימי/משתמש, ושם אותו בתור על הדיסק. הוא שולח כל 10 שניות או 50 אירועים, דחוס ב-gzip.</p><pre>{ \"event_id\": \"0193a6f2-...\", \"type\": \"checkout_click\",\n  \"event_time\": \"2026-11-13T09:58:02.114Z\",\n  \"user_id\": \"u_8812\", \"props\": { \"cart_items\": 3 } }</pre>" },
        fail: { en: "App killed before flush → lost events; device clock wrong → events from 1970 or the future. Persist the queue, and also stamp server receive time to clamp absurd client times.", he: "האפליקציה נהרגת לפני ה-flush ← אירועים אבודים; שעון המכשיר שגוי ← אירועים מ-1970 או מהעתיד. שומרים את התור על דיסק, וגם מוסיפים חותמת זמן קבלה בשרת כדי לתקן זמני לקוח מופרכים." } },
      { from: 0, to: 1, ms: 120,
        label: { en: "HTTPS POST to the collector", he: "HTTPS POST ל-collector" },
        detail: { en: "<p>The collector (behind a CDN/LB) authenticates the write key, enforces size limits (1 MB batch, 32 KB event), rate-limits per key, adds <code>received_at</code> and geo from IP, then drops the IP.</p>", he: "<p>ה-collector (מאחורי CDN/LB) מאמת את ה-write key, אוכף מגבלות גודל (batch של 1MB, אירוע של 32KB), עושה rate limit לכל key, מוסיף <code>received_at</code> ו-geo מה-IP, ואז זורק את ה-IP.</p>" },
        fail: { en: "Collector returns 5xx during a spike → SDKs retry in sync → retry storm. SDKs need exponential backoff with jitter and a max queue; the collector should shed load with 429 + Retry-After.", he: "ה-collector מחזיר 5xx בזמן קפיצה ← ה-SDKs עושים retry בסנכרון ← סערת retries. ה-SDKs צריכים exponential backoff עם jitter ותור מקסימלי; ה-collector צריך לעשות load shedding עם 429 + Retry-After." } },
      { from: 1, to: 3, ms: 5,
        label: { en: "Validate against the registered schema", he: "בדיקה מול ה-schema הרשום" },
        detail: { en: "<p>Each event type has a schema (Avro/Protobuf/JSON Schema) in the registry with <code>BACKWARD</code> compatibility. Valid events are serialized with the schema id; invalid ones go to a quarantine topic with the reason.</p>", he: "<p>לכל סוג אירוע יש schema (Avro/Protobuf/JSON Schema) ב-registry עם תאימות <code>BACKWARD</code>. אירועים תקינים עוברים serialization עם ה-schema id; לא תקינים הולכים ל-topic הסגר עם הסיבה.</p>" },
        fail: { en: "A mobile release renames a field: thousands of events quarantined per minute. Alert on quarantine rate per app version; fix forward with a new schema version — never drop silently.", he: "release במובייל משנה שם של שדה: אלפי אירועים בהסגר בכל דקה. מתריעים על קצב ההסגר לפי גרסת אפליקציה; מתקנים קדימה עם גרסת schema חדשה — אף פעם לא זורקים בשקט." } },
      { from: 1, to: 2, ms: 30,
        label: { en: "Produce to Kafka with a partition key", he: "Produce ל-Kafka עם partition key" },
        detail: { en: "<p>Key = <code>user_id</code> (per-user ordering). Producer settings for durability: <code>acks=all</code>, <code>enable.idempotence=true</code>, topic with replication 3 and <code>min.insync.replicas=2</code>. Only then the collector answers 200.</p>", he: "<p>Key = <code>user_id</code> (סדר לכל משתמש). הגדרות producer לעמידות: <code>acks=all</code>, <code>enable.idempotence=true</code>, topic עם replication 3 ו-<code>min.insync.replicas=2</code>. רק אז ה-collector עונה 200.</p>" },
        fail: { en: "Hot partition: a bot user produces 40% of events → one partition lags. Detect via per-partition lag; salt the key for known heavy keys or rate-limit them at the edge.", he: "partition חם: משתמש בוט מייצר 40% מהאירועים ← partition אחד מפגר. מזהים דרך lag לכל partition; מוסיפים salt ל-key של keys כבדים ידועים או עושים להם rate limit ב-edge." } },
      { from: 4, to: 2, ms: 200,
        label: { en: "Flink consumes and deduplicates by event_id", he: "Flink צורך ועושה dedupe לפי event_id" },
        detail: { en: "<p>Flink keeps a keyed state of seen <code>event_id</code>s with a TTL (e.g. 24 h, RocksDB state backend). Checkpoints every 60 s to S3 make state and Kafka offsets consistent.</p>", he: "<p>Flink מחזיק keyed state של <code>event_id</code>s שכבר נראו עם TTL (למשל 24 שעות, state backend של RocksDB). Checkpoints כל 60 שניות ל-S3 שומרים על עקביות בין ה-state ל-offsets ב-Kafka.</p>" },
        fail: { en: "State grows without TTL → checkpoint takes 10 minutes → backpressure → consumer lag climbs. Monitor checkpoint duration/size and consumer lag; set state TTL.", he: "ה-state גדל בלי TTL ← checkpoint לוקח 10 דקות ← backpressure ← ה-consumer lag מטפס. מנטרים משך וגודל checkpoint ו-consumer lag; קובעים TTL ל-state." } },
      { from: 4, to: 4, ms: 100,
        label: { en: "Enrich with reference data", he: "העשרה בנתוני ייחוס" },
        detail: { en: "<p>Join with slowly-changing dimensions (user plan, country, experiment variant) from a compacted Kafka topic or broadcast state — not a per-event DB call.</p>", he: "<p>join עם dimensions שמשתנים לאט (תוכנית משתמש, מדינה, וריאנט של ניסוי) מתוך Kafka topic דחוס (compacted) או broadcast state — לא קריאה ל-DB לכל אירוע.</p>" },
        fail: { en: "Calling an HTTP service per event: the service melts at 50k events/s and the job backpressures. Use async I/O with caching, or stream the reference data in.", he: "קריאה לשירות HTTP לכל אירוע: השירות נמס ב-50k אירועים לשנייה וה-job נכנס ל-backpressure. משתמשים ב-async I/O עם cache, או מזרימים את נתוני הייחוס פנימה." } },
      { from: 4, to: 4, ms: 180000,
        label: { en: "Window by event time with a watermark", he: "חלונות לפי event time עם watermark" },
        detail: { en: "<p>1-minute tumbling windows on <code>event_time</code>, watermark = max seen time − 2 min. A window fires when the watermark passes its end; events later than allowed lateness go to a side output for correction.</p><pre>WatermarkStrategy\n  .forBoundedOutOfOrderness(Duration.ofMinutes(2))\n  .withIdleness(Duration.ofMinutes(1))</pre>", he: "<p>חלונות tumbling של דקה על <code>event_time</code>, watermark = הזמן המקסימלי שנראה פחות 2 דקות. חלון נורה כשה-watermark עובר את הסוף שלו; אירועים שמאחרים יותר מהמותר הולכים ל-side output לתיקון.</p><pre>WatermarkStrategy\n  .forBoundedOutOfOrderness(Duration.ofMinutes(2))\n  .withIdleness(Duration.ofMinutes(1))</pre>" },
        fail: { en: "An idle partition holds the watermark back → windows never close → dashboard frozen. <code>withIdleness</code> fixes it; monitor watermark lag (now − watermark).", he: "partition רדום מעכב את ה-watermark ← חלונות לא נסגרים ← הדשבורד קפוא. <code>withIdleness</code> מתקן; מנטרים watermark lag (עכשיו פחות ה-watermark)." } },
      { from: 4, to: 5, ms: 3000,
        label: { en: "Sink aggregates and raw events to ClickHouse", he: "Sink של אגרגציות ואירועים גולמיים ל-ClickHouse" },
        detail: { en: "<p>Batched inserts (thousands of rows, every 1–5 s) into a <code>ReplacingMergeTree</code> keyed by event_id, so a replay doesn't double count after merges.</p><pre>CREATE TABLE events (\n  event_id UUID, event_time DateTime64(3),\n  type LowCardinality(String), user_id String )\nENGINE = ReplacingMergeTree\nPARTITION BY toDate(event_time)\nORDER BY (type, event_time, event_id);</pre>", he: "<p>inserts ב-batch (אלפי שורות, כל 1–5 שניות) לטבלת <code>ReplacingMergeTree</code> לפי event_id, כך ש-replay לא סופר כפול אחרי merges.</p><pre>CREATE TABLE events (\n  event_id UUID, event_time DateTime64(3),\n  type LowCardinality(String), user_id String )\nENGINE = ReplacingMergeTree\nPARTITION BY toDate(event_time)\nORDER BY (type, event_time, event_id);</pre>" },
        fail: { en: "Row-by-row inserts → 'Too many parts' error and ClickHouse rejects writes. Always batch (or use async_insert).", he: "inserts שורה-שורה ← שגיאת 'Too many parts' ו-ClickHouse דוחה כתיבות. תמיד ב-batch (או async_insert)." } },
      { from: 4, to: 6, ms: 300000,
        label: { en: "Commit raw events to the Iceberg lake", he: "Commit של אירועים גולמיים ל-lake ב-Iceberg" },
        detail: { en: "<p>Every 5 minutes Flink commits Parquet files to an Iceberg table partitioned by day. Iceberg gives atomic commits, schema evolution, time travel and row-level deletes for GDPR.</p>", he: "<p>כל 5 דקות Flink עושה commit לקבצי Parquet בטבלת Iceberg עם partition לפי יום. Iceberg נותן commits אטומיים, schema evolution, time travel ו-row-level deletes בשביל GDPR.</p>" },
        fail: { en: "Too-frequent commits create thousands of tiny files → queries slow to a crawl. Schedule compaction (rewrite_data_files) and expire snapshots.", he: "commits תכופים מדי יוצרים אלפי קבצים קטנים ← שאילתות מזדחלות. מתזמנים compaction (rewrite_data_files) ו-expire ל-snapshots." } },
      { from: 7, to: 6, ms: 900000,
        label: { en: "dbt builds tested models hourly", he: "dbt בונה מודלים עם טסטים כל שעה" },
        detail: { en: "<p>Orchestrated by Airflow/Dagster: staging → intermediate → marts (<code>fct_checkouts</code>, <code>dim_users</code>). Incremental models process only new partitions. dbt tests (<code>unique</code>, <code>not_null</code>, accepted values, freshness) gate publishing.</p><pre>models:\n  - name: fct_checkouts\n    columns:\n      - name: event_id\n        tests: [unique, not_null]</pre>", he: "<p>מתוזמר ע\"י Airflow/Dagster: staging ← intermediate ← marts (<code>fct_checkouts</code>, <code>dim_users</code>). מודלים incremental מעבדים רק partitions חדשים. טסטים של dbt (<code>unique</code>, <code>not_null</code>, accepted values, freshness) חוסמים פרסום.</p><pre>models:\n  - name: fct_checkouts\n    columns:\n      - name: event_id\n        tests: [unique, not_null]</pre>" },
        fail: { en: "A failed upstream model silently leaves yesterday's numbers in the mart. Use freshness tests and show 'data as of' on dashboards.", he: "מודל upstream שנכשל משאיר בשקט את המספרים של אתמול ב-mart. משתמשים בטסטי freshness ומציגים 'נכון ל-' בדשבורדים." } },
      { from: 8, to: 5, ms: 400,
        label: { en: "Dashboard queries ClickHouse (live) and the marts (official)", he: "הדשבורד שואל את ClickHouse (חי) ואת ה-marts (רשמי)" },
        detail: { en: "<p>Live tiles hit ClickHouse materialized views (sub-second over billions of rows). Business KPIs read dbt marts so every team uses one definition of 'active user'.</p>", he: "<p>אריחים חיים פונים ל-materialized views ב-ClickHouse (פחות משנייה על מיליארדי שורות). KPIs עסקיים קוראים מה-marts של dbt כך שכל צוות משתמש בהגדרה אחת של 'משתמש פעיל'.</p>" },
        fail: { en: "Live and official numbers disagree by 3% and execs lose trust. Document the difference (late data, dedupe timing) and reconcile daily with a check.", he: "המספרים החיים והרשמיים שונים ב-3% וההנהלה מאבדת אמון. מתעדים את ההבדל (late data, תזמון dedupe) ועושים התאמה יומית עם בדיקה." } },
      { from: 6, to: 4, ms: 3600000,
        label: { en: "Replay / backfill after a bug", he: "Replay / backfill אחרי באג" },
        detail: { en: "<p>A bug in enrichment ran for 2 days. Fix the job, then reprocess: from Kafka (if within retention) by resetting a new consumer group's offsets, or from the raw Iceberg table in batch mode. Idempotent sinks (ReplacingMergeTree, Iceberg overwrite per partition) make reruns safe.</p><pre>kafka-consumer-groups --group enrich-v2 --topic events \\\n  --reset-offsets --to-datetime 2026-11-11T00:00:00.000 --execute</pre>", he: "<p>באג בהעשרה רץ יומיים. מתקנים את ה-job ואז מעבדים מחדש: מ-Kafka (אם בתוך ה-retention) ע\"י איפוס offsets של consumer group חדש, או מטבלת ה-raw ב-Iceberg במצב batch. sinks אידמפוטנטיים (ReplacingMergeTree, overwrite לכל partition ב-Iceberg) הופכים הרצה חוזרת לבטוחה.</p><pre>kafka-consumer-groups --group enrich-v2 --topic events \\\n  --reset-offsets --to-datetime 2026-11-11T00:00:00.000 --execute</pre>" },
        fail: { en: "Non-idempotent sinks (append-only counters) double count after the replay. Design every sink for rerun from day one.", he: "sinks לא אידמפוטנטיים (מונים של append בלבד) סופרים כפול אחרי ה-replay. מתכננים כל sink להרצה חוזרת מהיום הראשון." } }
    ]
  },
  diagram: `SDK     Collector   Registry   Kafka    Flink         ClickHouse  Iceberg  dbt   BI
 |-batch->|           |          |        |               |          |       |     |
 |        |-validate->|          |        |               |          |       |     |
 |        |-produce(key=user)--->|        |               |          |       |     |
 |        |           |          |<-poll--| dedupe,enrich |          |       |     |
 |        |           |          |        | window+wm     |          |       |     |
 |        |           |          |        |--insert------>|          |       |     |
 |        |           |          |        |--commit(5m)------------->|       |     |
 |        |           |          |        |               |          |<-run--|     |
 |        |           |          |        |               |<-------------query-----|`,
  handsOn: [
    { cmd: "kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group flink-events", what: { en: "Read per-partition lag — the first freshness signal in any streaming pipeline.", he: "לקרוא lag לכל partition — סימן ה-freshness הראשון בכל pipeline של streaming." } },
    { cmd: "curl -s localhost:8081/subjects/checkout_click-value/versions/latest | jq .schema", what: { en: "Fetch the latest registered schema for an event type from the schema registry.", he: "למשוך את ה-schema הרשום האחרון לסוג אירוע מה-schema registry." } },
    { cmd: "clickhouse-client -q \"SELECT toStartOfMinute(event_time) m, count() FROM events WHERE type='checkout_click' AND event_time > now() - INTERVAL 15 MINUTE GROUP BY m ORDER BY m\"", what: { en: "See per-minute counts — and notice the last 2–3 minutes are still filling (late data).", he: "לראות ספירות לדקה — ולשים לב שה-2–3 דקות האחרונות עדיין מתמלאות (late data)." } },
    { cmd: "dbt build --select fct_checkouts+ && dbt source freshness", what: { en: "Build and test a model and everything downstream, then check source freshness.", he: "לבנות ולבדוק מודל וכל מה שתלוי בו, ואז לבדוק freshness של המקורות." } }
  ],
  mnemonic: {
    en: "ID it, Key it, Check it, Dedupe it, Window it, Land it, Model it — and keep the Raw to Replay it.",
    he: "תן ID, בחר Key, בדוק schema, עשה Dedupe, פתח חלון, תנחית, תמדל — ושמור את ה-Raw כדי לעשות Replay."
  },
  pitfalls: [
    { en: "Aggregating by arrival time: offline mobile users shift revenue into the wrong hour. Use event time + watermarks.", he: "לצבור לפי זמן הגעה: משתמשי מובייל שהיו offline מזיזים הכנסות לשעה הלא נכונה. משתמשים ב-event time + watermarks." },
    { en: "No event_id → retries double count and nothing downstream can dedupe.", he: "בלי event_id ← retries סופרים כפול ושום דבר בהמשך לא יכול לעשות dedupe." },
    { en: "Throwing away raw events after aggregation — then a logic bug can never be fixed retroactively.", he: "לזרוק אירועים גולמיים אחרי אגרגציה — ואז אי אפשר אף פעם לתקן באג לוגי רטרואקטיבית." },
    { en: "Unbounded Flink state without TTL — checkpoints balloon until the job can't keep up.", he: "state ב-Flink בלי TTL — ה-checkpoints מתנפחים עד שה-job לא עומד בקצב." }
  ],
  interview: [
    { q: { en: "How do you get correct per-minute counts when mobile events arrive up to hours late?", he: "איך מקבלים ספירות נכונות לדקה כשאירועי מובייל מגיעים באיחור של עד כמה שעות?" },
      a: { en: "Window on event time with a watermark (bounded out-of-orderness, e.g. 2 min) for the fast path; allowed lateness or a side output for late events that update/correct results; idempotent sinks keyed by window so updates replace instead of add; a daily batch reconciliation from the raw lake for the official numbers.", he: "חלונות על event time עם watermark (bounded out-of-orderness, למשל 2 דקות) לנתיב המהיר; allowed lateness או side output לאירועים מאוחרים שמעדכנים/מתקנים תוצאות; sinks אידמפוטנטיים לפי חלון כך שעדכון מחליף ולא מוסיף; ו-reconciliation יומי ב-batch מה-raw lake למספרים הרשמיים." } },
    { q: { en: "What would you monitor to know the pipeline is healthy end to end?", he: "מה היית מנטר כדי לדעת שה-pipeline בריא מקצה לקצה?" },
      a: { en: "Collector 2xx/4xx/5xx and accepted events/s per app version; quarantine rate; Kafka consumer lag per partition; Flink checkpoint duration, backpressure and watermark lag; sink insert errors; freshness SLO (max event_time in ClickHouse vs now); dbt test failures and source freshness; and a daily reconciliation count between raw and marts.", he: "2xx/4xx/5xx של ה-collector ואירועים שהתקבלו לשנייה לפי גרסת אפליקציה; קצב הסגר; consumer lag לכל partition ב-Kafka; משך checkpoint, backpressure ו-watermark lag ב-Flink; שגיאות insert ב-sinks; SLO של freshness (ה-event_time המקסימלי ב-ClickHouse מול עכשיו); כישלונות טסטים ו-source freshness ב-dbt; וספירת התאמה יומית בין ה-raw ל-marts." } }
  ],
  quiz: [
    { q: { en: "Why does every event carry a client-generated event_id?", he: "למה כל אירוע נושא event_id שנוצר אצל הלקוח?" },
      options: [ { en: "For Kafka partitioning", he: "בשביל partitioning ב-Kafka" }, { en: "So retries and replays can be deduplicated downstream", he: "כדי שאפשר יהיה לעשות dedupe ל-retries ול-replays בהמשך" }, { en: "To encrypt the event", he: "כדי להצפין את האירוע" }, { en: "Schema registry requires it", he: "ה-schema registry דורש את זה" } ],
      answer: 1, explain: { en: "At-least-once delivery + a stable id + idempotent processing = effectively once.", he: "מסירת at-least-once + מזהה יציב + עיבוד אידמפוטנטי = effectively once." } },
    { q: { en: "What does a watermark tell the stream processor?", he: "מה watermark אומר ל-stream processor?" },
      options: [ { en: "How much memory it may use", he: "כמה זיכרון מותר לו להשתמש" }, { en: "That events older than this time are (mostly) done arriving, so windows can close", he: "שאירועים ישנים יותר מהזמן הזה (ברובם) סיימו להגיע, אז אפשר לסגור חלונות" }, { en: "The Kafka offset to commit", he: "את ה-offset ב-Kafka שצריך לעשות לו commit" }, { en: "The schema version", he: "את גרסת ה-schema" } ],
      answer: 1, explain: { en: "It trades completeness for latency; late events beyond it need a correction path.", he: "הוא מחליף שלמות ב-latency; אירועים שמאחרים מעבר לו צריכים נתיב תיקון." } },
    { q: { en: "Dashboards froze but Kafka lag is zero. A likely cause?", he: "הדשבורדים קפאו אבל ה-lag ב-Kafka הוא אפס. סיבה סבירה?" },
      options: [ { en: "An idle partition is holding the watermark back", he: "partition רדום מעכב את ה-watermark" }, { en: "Too many consumers", he: "יותר מדי consumers" }, { en: "TLS expired on the dashboard", he: "TLS פג בדשבורד" }, { en: "dbt ran too often", he: "dbt רץ יותר מדי פעמים" } ],
      answer: 0, explain: { en: "Events are consumed, but windows never fire because the watermark is the min across partitions. Configure idleness.", he: "האירועים נצרכים, אבל חלונות לא נורים כי ה-watermark הוא המינימום על פני ה-partitions. מגדירים idleness." } },
    { q: { en: "Which property makes a backfill safe to run twice?", he: "איזו תכונה הופכת backfill לבטוח להרצה פעמיים?" },
      options: [ { en: "Higher Kafka retention", he: "retention גבוה יותר ב-Kafka" }, { en: "Idempotent sinks (replace by key/partition instead of append)", he: "sinks אידמפוטנטיים (החלפה לפי key/partition במקום append)" }, { en: "More Flink parallelism", he: "יותר parallelism ב-Flink" }, { en: "Smaller windows", he: "חלונות קטנים יותר" } ],
      answer: 1, explain: { en: "If writing the same input again yields the same table, reruns can't corrupt data.", he: "אם כתיבה חוזרת של אותו קלט נותנת אותה טבלה, הרצות חוזרות לא יכולות להשחית דאטה." } }
  ],
  related: ["pr-big-data", "staff-kafka-deep", "staff-exactly-once", "pr-privacy", "pr-idempotency", "staff-time-ordering", "pr-db-landscape"]
});

INFRA.lessons.push({
  id: "flow-tenant-onboarding",
  track: "flows",
  order: 14,
  icon: "🏢",
  level: 3,
  minutes: 17,
  title: { en: "SaaS Tenant Onboarding (and Offboarding), Hop by Hop", he: "Onboarding (ו-offboarding) של tenant ב-SaaS, קפיצה אחר קפיצה" },
  tldr: {
    en: "A new customer is not a row in a table — it's a durable, idempotent provisioning workflow that creates identity, billing, data isolation (schema/RLS, KMS key, bucket prefix), DNS and SSO, then starts metering; offboarding is the same workflow in reverse, ending in provable deletion.",
    he: "לקוח חדש הוא לא שורה בטבלה — זה workflow של provisioning עמיד ואידמפוטנטי שיוצר זהות, חיוב, בידוד דאטה (schema/RLS, מפתח KMS, prefix ב-bucket), DNS ו-SSO, ואז מתחיל metering; offboarding הוא אותו workflow הפוך, שמסתיים במחיקה שאפשר להוכיח."
  },
  analogy: {
    en: "Moving a new company into a shared office building. Reception checks who they are (signup + email verify), the leasing office opens an account and a payment plan (Stripe), facilities then do a checklist: a locked floor (DB schema + RLS), their own key safe (KMS key), a mailbox with their name (bucket prefix), a sign on the building directory (DNS subdomain + cert), badges linked to their HR system (SSO/SCIM). The checklist is done by a foreman who writes down every completed item, so if he's interrupted he resumes, not restarts (Temporal). When they move out, everything is reversed — and someone signs that the floor was emptied.",
    he: "להכניס חברה חדשה לבניין משרדים משותף. הקבלה בודקת מי הם (הרשמה + אימות אימייל), משרד ההשכרה פותח חשבון ותוכנית תשלום (Stripe), ואז אחזקה עוברת על צ'קליסט: קומה נעולה (DB schema + RLS), כספת מפתחות משלהם (מפתח KMS), תיבת דואר עם השם שלהם (prefix ב-bucket), שלט בלוח הדיירים (subdomain ב-DNS + cert), כרטיסי כניסה שמחוברים למערכת ה-HR שלהם (SSO/SCIM). את הצ'קליסט עושה מנהל עבודה שרושם כל פריט שהושלם, כך שאם מפריעים לו הוא ממשיך, לא מתחיל מחדש (Temporal). כשהם עוזבים, הכול מתהפך — ומישהו חותם שהקומה התרוקנה."
  },
  sections: [
    {
      h: { en: "Why a workflow engine, not a signup handler", he: "למה workflow engine ולא signup handler" },
      body: {
        en: `<p>Provisioning touches 6–10 systems (DB, KMS, object storage, DNS, cert manager, IdP, billing, CRM, email). Any of them can fail or time out. A single request handler that does them in sequence leaves half-created tenants behind. A durable workflow (Temporal, Step Functions) gives you:</p>
<ul>
<li><strong>Durable progress</strong>: each completed activity is recorded; a crash resumes from the next step.</li>
<li><strong>Retries with backoff</strong> per activity, with timeouts per step.</li>
<li><strong>Idempotent activities</strong> keyed by <code>tenant_id</code> ("create bucket prefix if not exists"), so retries are safe.</li>
<li><strong>Compensation</strong>: if SSO setup permanently fails, mark the tenant <code>provisioning_failed</code> and alert — or roll back created resources (saga).</li>
<li><strong>Visibility</strong>: support can see exactly which step a stuck tenant is in.</li>
</ul>
<pre>tenant.status: PENDING_VERIFY -&gt; PROVISIONING -&gt; ACTIVE
               -&gt; SUSPENDED (unpaid) -&gt; OFFBOARDING -&gt; DELETED</pre>`,
        he: `<p>Provisioning נוגע ב-6–10 מערכות (DB, KMS, object storage, DNS, cert manager, IdP, חיוב, CRM, אימייל). כל אחת מהן יכולה להיכשל או לעשות timeout. handler אחד שעושה אותן ברצף משאיר אחריו tenants חצי-נוצרים. workflow עמיד (Temporal, Step Functions) נותן:</p>
<ul>
<li><strong>התקדמות עמידה</strong>: כל activity שהושלמה נרשמת; קריסה ממשיכה מהשלב הבא.</li>
<li><strong>Retries עם backoff</strong> לכל activity, עם timeout לכל שלב.</li>
<li><strong>Activities אידמפוטנטיות</strong> לפי <code>tenant_id</code> ("צור prefix ב-bucket אם לא קיים"), כך ש-retries בטוחים.</li>
<li><strong>Compensation</strong>: אם הגדרת SSO נכשלת סופית, מסמנים את ה-tenant כ-<code>provisioning_failed</code> ומתריעים — או מגלגלים אחורה משאבים שנוצרו (saga).</li>
<li><strong>שקיפות</strong>: התמיכה רואה בדיוק באיזה שלב tenant תקוע.</li>
</ul>
<pre>tenant.status: PENDING_VERIFY -&gt; PROVISIONING -&gt; ACTIVE
               -&gt; SUSPENDED (unpaid) -&gt; OFFBOARDING -&gt; DELETED</pre>`
      }
    },
    {
      h: { en: "Isolation decisions made at onboarding", he: "החלטות בידוד שמתקבלות ב-onboarding" },
      body: {
        en: `<table><tr><th>Tier</th><th>Data</th><th>Compute</th><th>Keys</th></tr>
<tr><td>Free / Pro (pool)</td><td>shared tables + <code>tenant_id</code> + RLS</td><td>shared</td><td>shared key, per-tenant data key</td></tr>
<tr><td>Business (bridge)</td><td>schema per tenant</td><td>shared, per-tenant quotas</td><td>KMS key per tenant</td></tr>
<tr><td>Enterprise (silo)</td><td>dedicated DB / cell</td><td>dedicated namespace or cluster</td><td>customer-managed key (BYOK)</td></tr></table>
<p>The tier is a provisioning parameter: the same workflow with different activities. Put the tenant's <strong>cell/shard assignment</strong> in a routing table at onboarding — it's very hard to move later.</p>
<blockquote>⚠️ Production tip: Write a cross-tenant isolation test that runs in CI and in prod (synthetic tenants A and B): A's token must get 404 on every B resource. It's the cheapest insurance against the worst SaaS incident.</blockquote>`,
        he: `<table><tr><th>Tier</th><th>דאטה</th><th>Compute</th><th>מפתחות</th></tr>
<tr><td>Free / Pro (pool)</td><td>טבלאות משותפות + <code>tenant_id</code> + RLS</td><td>משותף</td><td>מפתח משותף, data key לכל tenant</td></tr>
<tr><td>Business (bridge)</td><td>schema לכל tenant</td><td>משותף, quotas לכל tenant</td><td>מפתח KMS לכל tenant</td></tr>
<tr><td>Enterprise (silo)</td><td>DB / cell ייעודי</td><td>namespace או cluster ייעודי</td><td>מפתח שבשליטת הלקוח (BYOK)</td></tr></table>
<p>ה-tier הוא פרמטר של ה-provisioning: אותו workflow עם activities שונות. רושמים את <strong>השיוך ל-cell/shard</strong> של ה-tenant בטבלת ניתוב כבר ב-onboarding — מאוד קשה להעביר את זה אחר כך.</p>
<blockquote>⚠️ טיפ לפרודקשן: כתוב טסט בידוד בין tenants שרץ ב-CI ובפרודקשן (tenants סינתטיים A ו-B): הטוקן של A חייב לקבל 404 על כל משאב של B. זה הביטוח הכי זול נגד התקלה הכי גרועה ב-SaaS.</blockquote>`
      }
    },
    {
      h: { en: "Offboarding and provable deletion", he: "Offboarding ומחיקה שאפשר להוכיח" },
      body: {
        en: `<ol>
<li>Cancel subscription; status <code>OFFBOARDING</code>; block logins and API keys.</li>
<li>Export: give the customer their data (contractual, often 30 days).</li>
<li>Grace period, then delete: drop schema / delete rows, delete bucket prefix, delete DNS record and cert, remove IdP config.</li>
<li><strong>Crypto-shredding</strong>: schedule deletion of the tenant's KMS key (7–30 day window) — data in backups becomes unreadable without restoring and scrubbing every backup.</li>
<li>Write a deletion certificate (what, when, by which workflow run) to the audit log.</li>
</ol>`,
        he: `<ol>
<li>מבטלים מנוי; status <code>OFFBOARDING</code>; חוסמים התחברויות ו-API keys.</li>
<li>Export: נותנים ללקוח את הדאטה שלו (לפי חוזה, בדרך כלל 30 יום).</li>
<li>תקופת חסד, ואז מחיקה: drop ל-schema / מחיקת שורות, מחיקת ה-prefix ב-bucket, מחיקת רשומת DNS ו-cert, הסרת קונפיג ה-IdP.</li>
<li><strong>Crypto-shredding</strong>: מתזמנים מחיקה של מפתח ה-KMS של ה-tenant (חלון של 7–30 יום) — הדאטה בגיבויים הופך לבלתי קריא בלי לשחזר ולנקות כל גיבוי.</li>
<li>כותבים תעודת מחיקה (מה, מתי, ע\"י איזו ריצת workflow) ל-audit log.</li>
</ol>`
      }
    }
  ],
  flow: {
    actors: ["User", "Web app", "Auth/IdP", "Billing API", "Temporal", "Postgres", "KMS", "Object store", "DNS+certs", "Metering"],
    steps: [
      { from: 0, to: 1, ms: 300,
        label: { en: "Sign up with email (or Google/Microsoft)", he: "הרשמה עם אימייל (או Google/Microsoft)" },
        detail: { en: "<p>Bot protection (Turnstile/reCAPTCHA), rate limit per IP and per email domain, password policy or social login via OIDC. Create a <code>user</code> and a pending <code>signup</code> record — not a tenant yet.</p>", he: "<p>הגנה מבוטים (Turnstile/reCAPTCHA), rate limit לכל IP ולכל דומיין אימייל, מדיניות סיסמאות או social login דרך OIDC. יוצרים <code>user</code> ורשומת <code>signup</code> ממתינה — עוד לא tenant.</p>" },
        fail: { en: "Signup abuse (fake accounts for free compute or SMS pumping). Detect with signup rate per ASN/domain; require verification before any costly resource is created.", he: "ניצול הרשמה לרעה (חשבונות מזויפים בשביל compute חינמי או SMS pumping). מזהים עם קצב הרשמות לפי ASN/דומיין; דורשים אימות לפני שנוצר משאב יקר כלשהו." } },
      { from: 1, to: 0, ms: 30000,
        label: { en: "Email verification link", he: "קישור לאימות אימייל" },
        detail: { en: "<p>Single-use, short-lived (e.g. 30 min) signed token, sent through the transactional email provider with SPF/DKIM/DMARC aligned.</p>", he: "<p>טוקן חתום חד-פעמי וקצר-חיים (למשל 30 דקות), שנשלח דרך ספק אימייל טרנזקציוני עם SPF/DKIM/DMARC מיושרים.</p>" },
        fail: { en: "Emails land in spam → signups stall. Monitor verification completion rate; it's a deliverability SLI.", he: "מיילים נוחתים בספאם ← הרשמות נתקעות. מנטרים את שיעור השלמת האימות; זה SLI של deliverability." } },
      { from: 0, to: 1, ms: 500,
        label: { en: "Create organization, choose plan and region", he: "יצירת ארגון, בחירת תוכנית ו-region" },
        detail: { en: "<p>The user names the org, picks a slug (<code>acme</code>) and a data region (EU/US — data residency). Validate the slug: allowlist charset, reserved words (<code>admin</code>, <code>api</code>, <code>www</code>), uniqueness.</p>", he: "<p>המשתמש נותן שם לארגון, בוחר slug (<code>acme</code>) ו-region לדאטה (EU/US — data residency). מאמתים את ה-slug: allowlist של תווים, מילים שמורות (<code>admin</code>, <code>api</code>, <code>www</code>), ייחודיות.</p>" },
        fail: { en: "Slug like <code>login</code> or <code>status</code> enables subdomain phishing. Keep a reserved-words list and validate server-side.", he: "slug כמו <code>login</code> או <code>status</code> מאפשר phishing דרך subdomain. מחזיקים רשימת מילים שמורות ומאמתים בצד השרת." } },
      { from: 1, to: 3, ms: 800,
        label: { en: "Create billing customer and subscription", he: "יצירת לקוח ומנוי בחיוב" },
        detail: { en: "<p>Create the Stripe customer and subscription (trial or paid) with an <code>Idempotency-Key</code> = signup id. Store <code>stripe_customer_id</code> on the tenant. Payment confirmation and later changes arrive via signed webhooks.</p><pre>POST /v1/customers\nIdempotency-Key: signup_0193a7...\nmetadata[tenant_id]=t_4f2a</pre>", he: "<p>יוצרים את הלקוח והמנוי ב-Stripe (trial או בתשלום) עם <code>Idempotency-Key</code> = מזהה ההרשמה. שומרים את <code>stripe_customer_id</code> על ה-tenant. אישור תשלום ושינויים בהמשך מגיעים דרך webhooks חתומים.</p><pre>POST /v1/customers\nIdempotency-Key: signup_0193a7...\nmetadata[tenant_id]=t_4f2a</pre>" },
        fail: { en: "Retry without an idempotency key creates two customers and double-bills. Also never trust the client's 'payment succeeded' — wait for the verified webhook.", he: "retry בלי idempotency key יוצר שני לקוחות ומחייב כפול. וגם אף פעם לא סומכים על 'התשלום הצליח' מהלקוח — מחכים ל-webhook מאומת." } },
      { from: 1, to: 4, ms: 50,
        label: { en: "Start the provisioning workflow", he: "הפעלת workflow ה-provisioning" },
        detail: { en: "<p>Start a Temporal workflow with <code>workflowId = provision-t_4f2a</code> (starting twice is a no-op). The UI shows 'Setting up your workspace…' and polls status.</p><pre>client.start_workflow(ProvisionTenant.run, args,\n  id=f\"provision-{tenant_id}\", task_queue=\"provisioning\")</pre>", he: "<p>מפעילים workflow ב-Temporal עם <code>workflowId = provision-t_4f2a</code> (הפעלה כפולה לא עושה כלום). ה-UI מציג 'מכינים לך את ה-workspace…' ועושה polling לסטטוס.</p><pre>client.start_workflow(ProvisionTenant.run, args,\n  id=f\"provision-{tenant_id}\", task_queue=\"provisioning\")</pre>" },
        fail: { en: "Workers down → workflows queue but nothing progresses. Alert on schedule-to-start latency of the provisioning task queue.", he: "ה-workers למטה ← workflows נכנסים לתור אבל שום דבר לא מתקדם. מתריעים על schedule-to-start latency של ה-task queue של ה-provisioning." } },
      { from: 4, to: 5, ms: 2000,
        label: { en: "Create tenant record, schema / RLS and default roles", he: "יצירת רשומת tenant, schema / RLS ותפקידי ברירת מחדל" },
        detail: { en: "<p>Pool tier: insert the tenant row; RLS policies already enforce <code>tenant_id = current_setting('app.tenant_id')</code>. Bridge tier: <code>CREATE SCHEMA t_4f2a</code> and run migrations into it. Create the owner role and default RBAC roles (owner, admin, member).</p><pre>ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;\nCREATE POLICY tenant_isolation ON invoices\n  USING (tenant_id = current_setting('app.tenant_id')::uuid);</pre>", he: "<p>Tier של pool: מוסיפים שורת tenant; מדיניות RLS כבר אוכפת <code>tenant_id = current_setting('app.tenant_id')</code>. Tier של bridge: <code>CREATE SCHEMA t_4f2a</code> ומריצים לתוכו מיגרציות. יוצרים את תפקיד הבעלים ותפקידי RBAC ברירת מחדל (owner, admin, member).</p><pre>ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;\nCREATE POLICY tenant_isolation ON invoices\n  USING (tenant_id = current_setting('app.tenant_id')::uuid);</pre>" },
        fail: { en: "Schema-per-tenant at 10,000 tenants: migrations take hours and catalog bloat hurts. Decide the model by expected tenant count, not by today's first customer.", he: "schema לכל tenant ב-10,000 tenants: מיגרציות לוקחות שעות וה-catalog מתנפח. מחליטים על המודל לפי מספר ה-tenants הצפוי, לא לפי הלקוח הראשון של היום." } },
      { from: 4, to: 6, ms: 500,
        label: { en: "Create the tenant's encryption key", he: "יצירת מפתח ההצפנה של ה-tenant" },
        detail: { en: "<p>Create a KMS key (or a data key wrapped by a tier key) tagged <code>tenant=t_4f2a</code>, alias <code>alias/tenant/t_4f2a</code>. Envelope encryption: data is encrypted with data keys; only KMS can unwrap them. Enterprise BYOK: reference the customer's key ARN and verify access.</p>", he: "<p>יוצרים מפתח KMS (או data key שעטוף ע\"י מפתח של ה-tier) עם תגית <code>tenant=t_4f2a</code>, alias <code>alias/tenant/t_4f2a</code>. Envelope encryption: הדאטה מוצפן עם data keys; רק KMS יכול לפתוח אותם. BYOK לארגונים: מפנים ל-ARN של המפתח של הלקוח ומוודאים גישה.</p>" },
        fail: { en: "KMS has per-account limits (keys per region, requests/s). At thousands of tenants use per-tenant data keys under a few KMS keys, cached locally.", he: "ל-KMS יש מגבלות לחשבון (מפתחות ל-region, בקשות לשנייה). באלפי tenants משתמשים ב-data keys לכל tenant תחת כמה מפתחות KMS, עם cache מקומי." } },
      { from: 4, to: 7, ms: 400,
        label: { en: "Object storage prefix and scoped access", he: "Prefix ב-object storage וגישה מוגבלת" },
        detail: { en: "<p>Files live under <code>s3://acme-data-eu/tenants/t_4f2a/</code>. App code never builds paths from user input alone; it gets scoped credentials or presigned URLs limited to the tenant prefix.</p>", he: "<p>קבצים יושבים תחת <code>s3://acme-data-eu/tenants/t_4f2a/</code>. הקוד אף פעם לא בונה paths רק מקלט של המשתמש; הוא מקבל credentials מוגבלים או presigned URLs שמוגבלים ל-prefix של ה-tenant.</p>" },
        fail: { en: "Path traversal (<code>../t_9b11/</code>) or a missing tenant check on download = cross-tenant data leak. Enforce prefix in IAM session policies, not only in code.", he: "Path traversal (<code>../t_9b11/</code>) או חוסר בדיקת tenant בהורדה = דליפת דאטה בין tenants. אוכפים prefix ב-IAM session policies, לא רק בקוד." } },
      { from: 4, to: 8, ms: 60000,
        label: { en: "Subdomain DNS record and TLS certificate", he: "רשומת DNS ל-subdomain ו-certificate ל-TLS" },
        detail: { en: "<p>With a wildcard cert (<code>*.app.example.com</code>) only a DNS record (or nothing, with wildcard DNS) is needed. Custom domains (<code>app.acme.com</code>) need the customer's CNAME plus an ACME HTTP-01/DNS-01 certificate — asynchronous, minutes.</p>", he: "<p>עם wildcard cert (<code>*.app.example.com</code>) צריך רק רשומת DNS (או כלום, עם wildcard DNS). דומיינים מותאמים (<code>app.acme.com</code>) צריכים CNAME מהלקוח וגם certificate ב-ACME HTTP-01/DNS-01 — אסינכרוני, דקות.</p>" },
        fail: { en: "Let's Encrypt rate limits (50 certs per registered domain per week) bite during a signup spike. Use wildcards for subdomains, and alert on certificate issuance failures.", he: "ה-rate limits של Let's Encrypt (50 certs לדומיין רשום בשבוע) נושכים בקפיצת הרשמות. משתמשים ב-wildcards ל-subdomains, ומתריעים על כישלונות בהנפקת certificates." } },
      { from: 4, to: 2, ms: 1000,
        label: { en: "SSO / SCIM configuration (enterprise)", he: "קונפיגורציית SSO / SCIM (ארגונים)" },
        detail: { en: "<p>Create an IdP connection placeholder (SAML/OIDC) the customer completes in the admin UI; enable SCIM so their HR system creates/deactivates users automatically. Map IdP groups to app roles.</p>", he: "<p>יוצרים placeholder לחיבור IdP (SAML/OIDC) שהלקוח משלים ב-UI הניהול; מפעילים SCIM כך שמערכת ה-HR שלהם יוצרת/משביתה משתמשים אוטומטית. ממפים קבוצות ב-IdP לתפקידים באפליקציה.</p>" },
        fail: { en: "Without SCIM, people who left the customer company keep access. Enterprise security reviews will ask for SCIM and SSO enforcement.", he: "בלי SCIM, אנשים שעזבו את חברת הלקוח שומרים על גישה. סקירות אבטחה של ארגונים ישאלו על SCIM ועל אכיפת SSO." } },
      { from: 4, to: 1, ms: 200,
        label: { en: "Mark ACTIVE, send welcome, seed sample data", he: "סימון ACTIVE, שליחת welcome, זריעת דאטה לדוגמה" },
        detail: { en: "<p>Flip status to <code>ACTIVE</code> in one transaction with an outbox event <code>TenantActivated</code>; downstream: welcome email, CRM record, analytics. Time-to-first-value is a product metric — seed a sample project.</p>", he: "<p>מעבירים status ל-<code>ACTIVE</code> בטרנזקציה אחת עם outbox event של <code>TenantActivated</code>; בהמשך: מייל welcome, רשומה ב-CRM, אנליטיקה. Time-to-first-value הוא מדד מוצר — זורעים פרויקט לדוגמה.</p>" },
        fail: { en: "Workflow failed at step 7 and the tenant is stuck in PROVISIONING forever. Alert on tenants in PROVISIONING &gt; 10 min and show support the failed step.", he: "ה-workflow נכשל בשלב 7 וה-tenant תקוע ב-PROVISIONING לתמיד. מתריעים על tenants ב-PROVISIONING מעל 10 דקות ומראים לתמיכה את השלב שנכשל." } },
      { from: 1, to: 9, ms: 60000,
        label: { en: "Usage metering starts", he: "Usage metering מתחיל" },
        detail: { en: "<p>Every billable action emits a usage event (<code>tenant_id</code>, meter, quantity, idempotency id). Aggregate per hour and report to billing (Stripe meter events / Metronome). Per-tenant quotas and rate limits read from the plan.</p>", he: "<p>כל פעולה שמחויבת מוציאה usage event (<code>tenant_id</code>, meter, כמות, idempotency id). מצברים לשעה ומדווחים לחיוב (Stripe meter events / Metronome). quotas ו-rate limits לכל tenant נקראים מהתוכנית.</p>" },
        fail: { en: "Lost or duplicated usage events = revenue leakage or overbilling (worse). Reconcile metered totals against source-of-truth counts daily.", he: "usage events אבודים או כפולים = דליפת הכנסות או חיוב יתר (גרוע יותר). עושים התאמה יומית בין סכומי ה-metering לספירות ממקור האמת." } },
      { from: 3, to: 1, ms: 2000,
        label: { en: "Later: cancellation webhook starts offboarding", he: "בהמשך: webhook של ביטול מתחיל offboarding" },
        detail: { en: "<p><code>customer.subscription.deleted</code> arrives (verify the signature). Start <code>offboard-t_4f2a</code>: disable logins and API keys immediately, open a data export window.</p>", he: "<p><code>customer.subscription.deleted</code> מגיע (מאמתים את החתימה). מפעילים <code>offboard-t_4f2a</code>: חוסמים התחברויות ו-API keys מיד, פותחים חלון ל-export של הדאטה.</p>" },
        fail: { en: "Unverified webhooks let anyone cancel any tenant. Verify the HMAC signature and timestamp tolerance on every webhook.", he: "webhooks לא מאומתים מאפשרים לכל אחד לבטל כל tenant. מאמתים חתימת HMAC וסבילות timestamp על כל webhook." } },
      { from: 4, to: 6,
        label: { en: "Grace period, delete data, schedule key deletion", he: "תקופת חסד, מחיקת דאטה, תזמון מחיקת מפתח" },
        detail: { en: "<p>After 30 days: delete rows/schema, bucket prefix, DNS, IdP config; schedule KMS key deletion (crypto-shredding covers backups and replicas); write a deletion certificate to the audit log.</p><pre>aws kms schedule-key-deletion --key-id alias/tenant/t_4f2a \\\n  --pending-window-in-days 7</pre>", he: "<p>אחרי 30 יום: מוחקים שורות/schema, prefix ב-bucket, DNS, קונפיג IdP; מתזמנים מחיקת מפתח KMS (crypto-shredding מכסה גיבויים ורפליקות); כותבים תעודת מחיקה ל-audit log.</p><pre>aws kms schedule-key-deletion --key-id alias/tenant/t_4f2a \\\n  --pending-window-in-days 7</pre>" },
        fail: { en: "Forgotten copies: analytics lake, logs, search index, caches, support tickets. Keep a data map of every store holding tenant data; offboarding must touch all of them.", he: "עותקים שנשכחו: analytics lake, logs, search index, caches, טיקטים של תמיכה. מחזיקים מפת דאטה של כל store שמחזיק דאטה של tenant; ה-offboarding חייב לגעת בכולם." } }
    ]
  },
  diagram: `User   WebApp   IdP   Billing   Temporal   Postgres   KMS   S3   DNS   Meter
 |signup>|       |       |         |          |         |     |     |     |
 |<verify|       |       |         |          |         |     |     |     |
 |-org-->|--customer+sub->|        |          |         |     |     |     |
 |       |--start provision(t_4f2a)>|         |         |     |     |     |
 |       |       |       |         |-schema/RLS>|        |     |     |     |
 |       |       |       |         |-------create key--->|     |     |     |
 |       |       |       |         |------------prefix-------->|     |     |
 |       |       |       |         |-----------------DNS+cert------>|     |
 |       |       |<--SSO/SCIM------|          |         |     |     |     |
 |<welcome-------|       |         |  ACTIVE  |         |     |     |     |
 |       |--------------usage events-------------------------------------->|`,
  handsOn: [
    { cmd: "temporal workflow describe --workflow-id provision-t_4f2a", what: { en: "See exactly which activity a stuck tenant's provisioning is on, with retries and last failure.", he: "לראות בדיוק באיזו activity נמצא ה-provisioning של tenant תקוע, עם retries והכישלון האחרון." } },
    { cmd: "psql -c \"SET app.tenant_id='00000000-0000-0000-0000-00000000000a'; SELECT count(*) FROM invoices;\"", what: { en: "Test RLS: with tenant A's context you must only ever see A's rows (connect as a non-owner, non-BYPASSRLS role).", he: "לבדוק RLS: עם ה-context של tenant A חייבים לראות רק את השורות של A (מתחברים כ-role שאינו owner ואין לו BYPASSRLS)." } },
    { cmd: "aws kms list-aliases --query \"Aliases[?starts_with(AliasName,'alias/tenant/')].AliasName\" | head", what: { en: "List per-tenant keys — the inventory you'll need for crypto-shredding.", he: "לרשום את המפתחות לכל tenant — המלאי שתצטרך בשביל crypto-shredding." } },
    { cmd: "stripe trigger customer.subscription.deleted", what: { en: "Fire a test cancellation webhook locally (Stripe CLI) to exercise the offboarding path.", he: "לירות webhook ביטול לבדיקה מקומית (Stripe CLI) כדי לתרגל את נתיב ה-offboarding." } }
  ],
  mnemonic: {
    en: "Verify → Org → Bill → Provision (schema, key, storage, DNS, SSO) → Activate → Meter. To leave, run it backwards and shred the key.",
    he: "אמת, ארגון, חיוב, provisioning (schema, מפתח, אחסון, DNS, הזדהות), הפעלה, metering — ולעזוב מריצים את זה אחורה."
  },
  pitfalls: [
    { en: "Doing provisioning inside the signup HTTP request — any timeout leaves a half-built tenant with no record of what exists.", he: "לעשות provisioning בתוך בקשת ה-HTTP של ההרשמה — כל timeout משאיר tenant חצי-בנוי בלי תיעוד של מה קיים." },
    { en: "Non-idempotent activities (\"create bucket\" that fails if it exists) turn every retry into an error.", he: "activities לא אידמפוטנטיות (\"צור bucket\" שנכשל אם הוא קיים) הופכות כל retry לשגיאה." },
    { en: "Choosing tenant isolation model per customer ad hoc — you end up with 4 architectures to operate. Define tiers up front.", he: "לבחור מודל בידוד ל-tenant לפי לקוח באופן אד-הוק — מסיימים עם 4 ארכיטקטורות לתפעל. מגדירים tiers מראש." },
    { en: "Offboarding that deletes the main DB but forgets logs, lake, search and backups — a compliance finding waiting to happen.", he: "offboarding שמוחק את ה-DB הראשי אבל שוכח logs, lake, search וגיבויים — ממצא compliance שמחכה לקרות." }
  ],
  interview: [
    { q: { en: "Design tenant provisioning so it never leaves a half-created tenant.", he: "תכנן provisioning של tenants כך שלעולם לא יישאר tenant חצי-נוצר." },
      a: { en: "A durable workflow keyed by tenant_id (Temporal/Step Functions) with idempotent activities (create-if-not-exists, natural keys), per-activity retries and timeouts, explicit state machine on the tenant row, compensation or a clear failed state with alerting, and a reconciler that compares desired tenant resources with actual ones and fixes drift.", he: "workflow עמיד לפי tenant_id (Temporal/Step Functions) עם activities אידמפוטנטיות (create-if-not-exists, מפתחות טבעיים), retries ו-timeouts לכל activity, state machine מפורש על שורת ה-tenant, compensation או מצב כישלון ברור עם התראה, ו-reconciler שמשווה משאבי tenant רצויים לקיימים ומתקן drift." } },
    { q: { en: "How do you prove a tenant's data was deleted, including backups?", he: "איך מוכיחים שהדאטה של tenant נמחק, כולל גיבויים?" },
      a: { en: "Per-tenant encryption keys (envelope encryption) so destroying the key renders all copies unreadable (crypto-shredding); a data map listing every store; an offboarding workflow that deletes from each and records evidence; backup retention shorter than the deletion SLA or key destruction; and a deletion certificate in an immutable audit log.", he: "מפתחות הצפנה לכל tenant (envelope encryption) כך שהשמדת המפתח הופכת את כל העותקים לבלתי קריאים (crypto-shredding); מפת דאטה של כל store; workflow של offboarding שמוחק מכל אחד ורושם ראיות; retention של גיבויים קצר מה-SLA של המחיקה או השמדת מפתח; ותעודת מחיקה ב-audit log שאי אפשר לשנות." } }
  ],
  quiz: [
    { q: { en: "Why start the provisioning workflow with workflowId = provision-{tenant_id}?", he: "למה להפעיל את ה-workflow עם workflowId = provision-{tenant_id}?" },
      options: [ { en: "It's faster", he: "זה מהיר יותר" }, { en: "Starting it twice becomes a no-op — the start itself is idempotent", he: "הפעלה כפולה הופכת ל-no-op — ההפעלה עצמה אידמפוטנטית" }, { en: "Temporal requires readable ids", he: "Temporal דורש מזהים קריאים" }, { en: "For encryption", he: "בשביל הצפנה" } ],
      answer: 1, explain: { en: "A double click or a retried request can't create two provisioning runs for the same tenant.", he: "לחיצה כפולה או בקשה שעשתה retry לא יכולות ליצור שתי ריצות provisioning לאותו tenant." } },
    { q: { en: "What makes crypto-shredding effective for deletion?", he: "מה הופך את crypto-shredding ליעיל למחיקה?" },
      options: [ { en: "It overwrites disks with zeros", he: "הוא דורס דיסקים באפסים" }, { en: "Destroying the tenant's key makes every encrypted copy, including backups, unreadable", he: "השמדת המפתח של ה-tenant הופכת כל עותק מוצפן, כולל גיבויים, לבלתי קריא" }, { en: "It deletes DNS records", he: "הוא מוחק רשומות DNS" }, { en: "It compresses data", he: "הוא דוחס דאטה" } ],
      answer: 1, explain: { en: "You can't practically scrub every backup, but you can destroy one key.", he: "אי אפשר באמת לנקות כל גיבוי, אבל אפשר להשמיד מפתח אחד." } },
    { q: { en: "Billing says 'payment succeeded' in the browser. When do you activate paid features?", he: "החיוב אומר 'התשלום הצליח' בדפדפן. מתי מפעילים פיצ'רים בתשלום?" },
      options: [ { en: "Immediately, from the browser callback", he: "מיד, מה-callback בדפדפן" }, { en: "After a verified (signed) webhook from the billing provider", he: "אחרי webhook מאומת (חתום) מספק החיוב" }, { en: "After the next deploy", he: "אחרי ה-deploy הבא" }, { en: "When the user logs in again", he: "כשהמשתמש מתחבר שוב" } ],
      answer: 1, explain: { en: "Client-side signals can be forged; the server-to-server signed webhook is the source of truth.", he: "אפשר לזייף אותות מצד הלקוח; ה-webhook החתום בין שרתים הוא מקור האמת." } },
    { q: { en: "Best way to catch a cross-tenant data leak before customers do?", he: "הדרך הטובה ביותר לתפוס דליפת דאטה בין tenants לפני שלקוחות יתפסו?" },
      options: [ { en: "Manual QA before each release", he: "QA ידני לפני כל release" }, { en: "Automated tests with two synthetic tenants asserting 404 on each other's resources, in CI and prod", he: "טסטים אוטומטיים עם שני tenants סינתטיים שמוודאים 404 על המשאבים של השני, ב-CI ובפרודקשן" }, { en: "Bigger RLS indexes", he: "אינדקסים גדולים יותר ל-RLS" }, { en: "Longer KMS key rotation", he: "רוטציה ארוכה יותר למפתח KMS" } ],
      answer: 1, explain: { en: "Isolation is a property you test continuously, not something you assume.", he: "בידוד הוא תכונה שבודקים כל הזמן, לא משהו שמניחים." } }
  ],
  related: ["pr-multi-tenancy", "pr-tenant-isolation-deep", "arch-durable-execution", "pr-idempotency", "pr-privacy", "pr-auth", "flow-login-sso"]
});

INFRA.lessons.push({
  id: "flow-alert-to-postmortem",
  track: "flows",
  order: 15,
  icon: "🚨",
  level: 3,
  minutes: 16,
  title: { en: "Alert to Postmortem: an Incident End to End", he: "מהתראה ל-postmortem: תקלה מקצה לקצה" },
  tldr: {
    en: "A good incident runs on rails: a symptom-based burn-rate alert routes to the right on-call, who acks, triages from dashboards to traces to logs, declares an incident with clear roles, mitigates first (rollback / flag) and diagnoses later, communicates on a schedule, and closes with a blameless postmortem whose action items actually get done.",
    he: "תקלה טובה רצה על פסים: התראת burn-rate מבוססת סימפטום מנותבת ל-on-call הנכון, שעושה ack, עושה triage מדשבורדים ל-traces ל-logs, מכריז על incident עם תפקידים ברורים, ממתן קודם (rollback / flag) ומאבחן אחר כך, מתקשר לפי לוח זמנים, וסוגר עם postmortem ללא האשמה שה-action items שלו באמת מתבצעים."
  },
  analogy: {
    en: "A fire department call. The smoke detector (burn-rate alert) only goes off for real smoke, not for toast. Dispatch (Alertmanager + PagerDuty) sends the right station. The first crew on scene puts the fire out before investigating the cause (mitigate first). The incident commander directs and doesn't hold a hose; a liaison talks to the residents (status page). Afterwards the fire investigator writes a report about wiring and building codes — not about which resident is to blame — and the city actually fixes the codes (action items).",
    he: "קריאה לכבאות. גלאי העשן (התראת burn-rate) מצפצף רק על עשן אמיתי, לא על טוסט. המוקד (Alertmanager + PagerDuty) שולח את התחנה הנכונה. הצוות הראשון בזירה מכבה את האש לפני שהוא חוקר את הסיבה (קודם ממתנים). מפקד האירוע מכוון ולא מחזיק זרנוק; איש קשר מדבר עם הדיירים (status page). אחר כך חוקר השריפות כותב דוח על החיווט ותקני הבנייה — לא על איזה דייר אשם — והעירייה באמת מתקנת את התקנים (action items)."
  },
  sections: [
    {
      h: { en: "Time budget: MTTA, MTTM, MTTR", he: "תקציב זמן: MTTA, MTTM, MTTR" },
      body: {
        en: `<table><tr><th>Phase</th><th>Target (SEV1)</th><th>What drives it</th></tr>
<tr><td>Detect (impact → alert)</td><td>&lt; 5 min</td><td>burn-rate windows, synthetic checks</td></tr>
<tr><td>Acknowledge (MTTA)</td><td>&lt; 5 min</td><td>paging policy, escalation, phone not email</td></tr>
<tr><td>Mitigate (MTTM)</td><td>&lt; 30 min</td><td>rollback button, feature flags, runbooks</td></tr>
<tr><td>Resolve</td><td>hours</td><td>root-cause fix, data repair</td></tr>
<tr><td>Postmortem</td><td>within 5 business days</td><td>template, owner, review meeting</td></tr></table>
<p>The single biggest lever is <strong>mitigation speed</strong>: most incidents are caused by a change, so "what changed in the last 2 hours?" plus a safe rollback beats any clever debugging.</p>`,
        he: `<table><tr><th>שלב</th><th>יעד (SEV1)</th><th>מה קובע אותו</th></tr>
<tr><td>זיהוי (פגיעה ← התראה)</td><td>&lt; 5 דקות</td><td>חלונות burn-rate, בדיקות סינתטיות</td></tr>
<tr><td>Acknowledge (MTTA)</td><td>&lt; 5 דקות</td><td>מדיניות paging, escalation, טלפון ולא אימייל</td></tr>
<tr><td>Mitigate (MTTM)</td><td>&lt; 30 דקות</td><td>כפתור rollback, feature flags, runbooks</td></tr>
<tr><td>Resolve</td><td>שעות</td><td>תיקון שורש, תיקון דאטה</td></tr>
<tr><td>Postmortem</td><td>תוך 5 ימי עבודה</td><td>תבנית, בעלים, פגישת סקירה</td></tr></table>
<p>המנוף הכי גדול הוא <strong>מהירות המיתון</strong>: רוב התקלות נגרמות משינוי, אז "מה השתנה בשעתיים האחרונות?" ועוד rollback בטוח מנצחים כל דיבאג מתוחכם.</p>`
      }
    },
    {
      h: { en: "Roles and severity", he: "תפקידים וחומרה" },
      body: {
        en: `<ul>
<li><strong>Incident Commander (IC)</strong>: owns decisions and coordination, not the keyboard.</li>
<li><strong>Ops / subject-matter lead</strong>: hands on the systems, proposes and executes mitigations.</li>
<li><strong>Comms lead</strong>: status page and stakeholder updates every 30 min (SEV1), even if "no news".</li>
<li><strong>Scribe</strong>: timestamps every decision in the incident channel — the postmortem timeline writes itself.</li>
</ul>
<table><tr><th>SEV</th><th>Definition example</th></tr>
<tr><td>SEV1</td><td>Core flow down or data loss for many customers</td></tr>
<tr><td>SEV2</td><td>Major degradation or a key feature down</td></tr>
<tr><td>SEV3</td><td>Minor impact, workaround exists</td></tr></table>
<blockquote>💡 Real world: Declare early and downgrade later. An incident that was "not quite an incident" for 40 minutes is the classic postmortem finding.</blockquote>`,
        he: `<ul>
<li><strong>Incident Commander (IC)</strong>: אחראי על החלטות ותיאום, לא על המקלדת.</li>
<li><strong>Ops / מוביל מקצועי</strong>: הידיים על המערכות, מציע ומבצע מיתונים.</li>
<li><strong>Comms lead</strong>: status page ועדכונים לבעלי עניין כל 30 דקות (SEV1), גם אם "אין חדש".</li>
<li><strong>Scribe</strong>: מתעד עם חותמת זמן כל החלטה בערוץ התקלה — ה-timeline של ה-postmortem נכתב לבד.</li>
</ul>
<table><tr><th>SEV</th><th>דוגמה להגדרה</th></tr>
<tr><td>SEV1</td><td>זרימה מרכזית למטה או אובדן דאטה להרבה לקוחות</td></tr>
<tr><td>SEV2</td><td>הידרדרות משמעותית או feature מרכזי למטה</td></tr>
<tr><td>SEV3</td><td>פגיעה קטנה, יש עקיפה</td></tr></table>
<blockquote>💡 מהשטח: מכריזים מוקדם ומורידים חומרה אחר כך. תקלה שהייתה "לא בדיוק תקלה" במשך 40 דקות היא הממצא הקלאסי ב-postmortems.</blockquote>`
      }
    },
    {
      h: { en: "Postmortems that change things", he: "Postmortems שמשנים דברים" },
      body: {
        en: `<p>Blameless means you examine <em>systems and decisions in context</em> ("the deploy tool allowed a config push to all regions at once"), not people ("Dana pushed bad config"). Prefer <strong>contributing factors</strong> over a single root cause — real incidents are a chain: a bug, plus a missing test, plus an alert that fired late, plus a rollback that took 20 minutes.</p>
<pre>Postmortem template
- Summary, impact (users, duration, SLO budget burned)
- Timeline (UTC) from the scribe log
- Contributing factors / what went well / where we got lucky
- Action items: owner, priority, due date, ticket link
  (prevent, detect faster, mitigate faster)</pre>
<p>Track action-item completion rate. A postmortem whose items sit open for months is just a story.</p>`,
        he: `<p>Blameless אומר שבוחנים <em>מערכות והחלטות בהקשר שלהן</em> ("כלי ה-deploy איפשר לדחוף קונפיג לכל ה-regions בבת אחת"), לא אנשים ("דנה דחפה קונפיג רע"). מעדיפים <strong>גורמים תורמים</strong> על פני root cause יחיד — תקלות אמיתיות הן שרשרת: באג, ועוד טסט חסר, ועוד התראה שנורתה מאוחר, ועוד rollback שלקח 20 דקות.</p>
<pre>Postmortem template
- Summary, impact (users, duration, SLO budget burned)
- Timeline (UTC) from the scribe log
- Contributing factors / what went well / where we got lucky
- Action items: owner, priority, due date, ticket link
  (prevent, detect faster, mitigate faster)</pre>
<p>עוקבים אחרי שיעור הביצוע של action items. postmortem שה-items שלו פתוחים חודשים הוא סתם סיפור.</p>`
      }
    }
  ],
  flow: {
    actors: ["Users", "Prometheus", "Alertmanager", "PagerDuty", "On-call", "Grafana/Tempo", "Incident chan", "Argo/flags", "Status page", "Tracker"],
    steps: [
      { from: 0, to: 1, ms: 120000,
        label: { en: "Users hit errors; SLIs start burning budget", he: "משתמשים נתקלים בשגיאות; ה-SLIs מתחילים לשרוף budget" },
        detail: { en: "<p>A deploy introduced a bug: 4% of checkout requests return 500. Recording rules compute the error ratio over 5 m and 1 h windows.</p>", he: "<p>deploy הכניס באג: 4% מבקשות ה-checkout מחזירות 500. recording rules מחשבים את יחס השגיאות בחלונות של 5 דקות ושעה.</p>" },
        fail: { en: "No SLI on the user-facing flow (only CPU alerts) → users report it on Twitter first. Alert on symptoms users feel.", he: "אין SLI על הזרימה שהמשתמשים רואים (רק התראות CPU) ← המשתמשים מדווחים על זה בטוויטר קודם. מתריעים על סימפטומים שמשתמשים מרגישים." } },
      { from: 1, to: 2, ms: 60000,
        label: { en: "Multi-window burn-rate alert fires", he: "התראת burn-rate רב-חלונית נורית" },
        detail: { en: "<p>For a 99.9% SLO, burn rate 14.4 over 1 h (and 5 m to confirm it's still happening) means 2% of the 30-day budget gone in an hour → page.</p><pre>expr: (job:slo_errors:ratio_rate1h &gt; 14.4 * 0.001)\n  and (job:slo_errors:ratio_rate5m &gt; 14.4 * 0.001)\nlabels: { severity: page, service: checkout }</pre>", he: "<p>ל-SLO של 99.9%, burn rate של 14.4 על שעה (ו-5 דקות כדי לוודא שזה עדיין קורה) אומר ש-2% מה-budget של 30 יום נשרף בשעה ← page.</p><pre>expr: (job:slo_errors:ratio_rate1h &gt; 14.4 * 0.001)\n  and (job:slo_errors:ratio_rate5m &gt; 14.4 * 0.001)\nlabels: { severity: page, service: checkout }</pre>" },
        fail: { en: "Static thresholds (errors &gt; 1%) page at 3 a.m. for a 2-minute blip, or never page for a slow burn. Burn-rate alerts fix both.", he: "ספים סטטיים (שגיאות מעל 1%) מעירים ב-3 בלילה על גמגום של 2 דקות, או אף פעם לא מעירים על שריפה איטית. התראות burn-rate מתקנות את שניהם." } },
      { from: 2, to: 3, ms: 30000,
        label: { en: "Alertmanager groups, dedupes and routes", he: "Alertmanager מקבץ, עושה dedupe ומנתב" },
        detail: { en: "<p>Grouped by <code>service</code>, inhibited if a parent alert (region down) fires, routed by label to the checkout team's PagerDuty service. Annotations carry the runbook and dashboard links.</p><pre>route:\n  group_by: [service]\n  routes:\n  - matchers: [ team=\"payments\", severity=\"page\" ]\n    receiver: pd-payments</pre>", he: "<p>מקובץ לפי <code>service</code>, מושתק אם התראת אב (region למטה) נורית, ומנותב לפי label לשירות ה-PagerDuty של צוות ה-checkout. ה-annotations נושאים קישורים ל-runbook ולדשבורד.</p><pre>route:\n  group_by: [service]\n  routes:\n  - matchers: [ team=\"payments\", severity=\"page\" ]\n    receiver: pd-payments</pre>" },
        fail: { en: "Alertmanager itself down = silent outage. Run it HA and add a dead-man's-switch (Watchdog alert that must always fire to an external heartbeat).", he: "Alertmanager עצמו למטה = השבתה שקטה. מריצים אותו ב-HA ומוסיפים dead-man's-switch (התראת Watchdog שחייבת תמיד לירות ל-heartbeat חיצוני)." } },
      { from: 3, to: 4, ms: 180000,
        label: { en: "Page the primary on-call; escalate if no ack", he: "Page ל-on-call הראשי; escalation אם אין ack" },
        detail: { en: "<p>Push + SMS + phone call. No ack in 5 min → secondary; 15 min → engineering manager. The on-call acks from the phone and opens the alert's runbook link.</p>", he: "<p>Push + SMS + שיחת טלפון. אין ack תוך 5 דקות ← משני; 15 דקות ← מנהל ההנדסה. ה-on-call עושה ack מהטלפון ופותח את הקישור ל-runbook שבהתראה.</p>" },
        fail: { en: "Alert fatigue: 30 pages a week and people mute. Track pages per on-call shift; every page must be actionable or deleted.", he: "שחיקת התראות: 30 pages בשבוע ואנשים משתיקים. עוקבים אחרי מספר pages למשמרת on-call; כל page חייב להיות actionable או להימחק." } },
      { from: 4, to: 5, ms: 300000,
        label: { en: "Triage: dashboard → traces → logs", he: "Triage: דשבורד ← traces ← logs" },
        detail: { en: "<p>RED dashboard shows errors started at 09:42 — deploy annotation at 09:41. Exemplars jump to a failing trace; the span shows <code>NullPointerException</code> in the new tax calculation; logs filtered by <code>trace_id</code> confirm.</p>", he: "<p>דשבורד RED מראה שהשגיאות התחילו ב-09:42 — annotation של deploy ב-09:41. Exemplars קופצים ל-trace שנכשל; ה-span מראה <code>NullPointerException</code> בחישוב המס החדש; logs מסוננים לפי <code>trace_id</code> מאשרים.</p>" },
        fail: { en: "No deploy annotations, no trace-log correlation → 40 minutes of grepping. Wire the deploy pipeline into dashboards and propagate trace ids into logs.", he: "אין annotations של deploy, אין קישור בין traces ל-logs ← 40 דקות של grep. מחברים את ה-pipeline של ה-deploy לדשבורדים ומעבירים trace ids לתוך ה-logs." } },
      { from: 4, to: 6, ms: 60000,
        label: { en: "Declare the incident and assign roles", he: "הכרזה על incident ושיבוץ תפקידים" },
        detail: { en: "<p><code>/incident declare sev2 checkout errors after deploy</code> creates a channel, a Zoom bridge, a timeline doc and pages an IC. Roles are named explicitly in the channel.</p>", he: "<p><code>/incident declare sev2 checkout errors after deploy</code> יוצר ערוץ, Zoom, מסמך timeline ועושה page ל-IC. התפקידים נקבעים במפורש בערוץ.</p>" },
        fail: { en: "Everyone debugging, nobody coordinating: three people roll back three different things. One IC, one decision log.", he: "כולם מדבגים, אף אחד לא מתאם: שלושה אנשים עושים rollback לשלושה דברים שונים. IC אחד, יומן החלטות אחד." } },
      { from: 4, to: 7, ms: 240000,
        label: { en: "Mitigate first: roll back or flip the flag", he: "קודם ממתנים: rollback או היפוך flag" },
        detail: { en: "<p>The IC decides: disable the <code>new-tax-calc</code> feature flag (seconds) — or revert the GitOps commit (minutes). Mitigation before root cause.</p><pre>kubectl argo rollouts undo checkout   # or\nflagctl set new-tax-calc=false --env prod</pre>", he: "<p>ה-IC מחליט: לכבות את ה-feature flag של <code>new-tax-calc</code> (שניות) — או revert ל-commit ב-GitOps (דקות). מיתון לפני root cause.</p><pre>kubectl argo rollouts undo checkout   # or\nflagctl set new-tax-calc=false --env prod</pre>" },
        fail: { en: "Rollback blocked by a non-backward-compatible migration. That's why expand/contract and flags exist — the postmortem will say so.", he: "rollback חסום בגלל מיגרציה לא תואמת לאחור. בשביל זה קיימים expand/contract ו-flags — ה-postmortem יגיד את זה." } },
      { from: 6, to: 8, ms: 600000,
        label: { en: "Communicate: status page and stakeholders", he: "תקשורת: status page ובעלי עניין" },
        detail: { en: "<p>Comms lead posts 'Investigating — some checkouts failing' within 10 minutes, updates every 30 minutes, and support gets a macro. Internal updates follow a template: impact, current action, next update time.</p>", he: "<p>ה-comms lead מפרסם 'בבדיקה — חלק מה-checkouts נכשלים' תוך 10 דקות, מעדכן כל 30 דקות, והתמיכה מקבלת תשובה מוכנה. עדכונים פנימיים לפי תבנית: פגיעה, פעולה נוכחית, זמן העדכון הבא.</p>" },
        fail: { en: "Silence for an hour: customers and execs assume the worst and flood the channel. Scheduled updates even with no news.", he: "שקט של שעה: לקוחות והנהלה מניחים את הגרוע ביותר ומציפים את הערוץ. עדכונים מתוזמנים גם כשאין חדש." } },
      { from: 1, to: 4, ms: 900000,
        label: { en: "Verify recovery, then resolve", he: "אימות התאוששות, ואז resolve" },
        detail: { en: "<p>Error ratio back under SLO for 15 minutes, synthetic checkout passes, burn-rate alert auto-resolves. Then check side effects: failed orders to retry, customers to email, data to repair.</p>", he: "<p>יחס השגיאות חזר מתחת ל-SLO במשך 15 דקות, ה-checkout הסינתטי עובר, התראת ה-burn-rate נסגרת אוטומטית. אחר כך בודקים תופעות לוואי: הזמנות שנכשלו ל-retry, לקוחות לשלוח להם מייל, דאטה לתקן.</p>" },
        fail: { en: "Declaring victory on a dashboard while a queue still holds 50,000 failed orders. Resolution includes data repair and backlog drain.", he: "להכריז ניצחון על דשבורד בזמן שבתור עדיין יושבות 50,000 הזמנות שנכשלו. resolution כולל תיקון דאטה וריקון backlog." } },
      { from: 8, to: 0,
        label: { en: "Customer follow-up: RCA summary and SLA credits", he: "מעקב מול לקוחות: סיכום RCA וזיכויי SLA" },
        detail: { en: "<p>Post a final status update with a plain-language summary, contact the most affected customers, and calculate SLA credits from the measured downtime (e.g. 99.9% monthly SLA missed → 10% credit). Enterprise contracts may require a written RCA within a set number of days.</p>", he: "<p>מפרסמים עדכון סטטוס סופי עם סיכום בשפה פשוטה, יוצרים קשר עם הלקוחות שנפגעו הכי הרבה, ומחשבים זיכויי SLA לפי ה-downtime שנמדד (למשל SLA חודשי של 99.9% שהוחמץ ← זיכוי של 10%). חוזים של ארגונים יכולים לדרוש RCA בכתב תוך מספר ימים קבוע.</p>" },
        fail: { en: "Measuring downtime from internal dashboards that disagree with what customers saw. Use the same SLI the SLA is defined on, and keep its raw data for disputes.", he: "למדוד downtime מדשבורדים פנימיים שלא מסכימים עם מה שהלקוחות ראו. משתמשים באותו SLI שעליו מוגדר ה-SLA, ושומרים את הדאטה הגולמי שלו למקרה של מחלוקת." } },
      { from: 6, to: 9,
        label: { en: "Blameless postmortem within 5 days", he: "Postmortem ללא האשמה תוך 5 ימים" },
        detail: { en: "<p>The IC or owner drafts from the scribe timeline; a review meeting walks contributing factors, what went well, where we got lucky. Impact quantified in SLO budget burned (e.g. 38% of monthly budget).</p>", he: "<p>ה-IC או הבעלים כותבים טיוטה מה-timeline של ה-scribe; פגישת סקירה עוברת על גורמים תורמים, מה עבד טוב, איפה היה לנו מזל. הפגיעה מכומתת ב-SLO budget שנשרף (למשל 38% מה-budget החודשי).</p>" },
        fail: { en: "Root cause = 'human error'. That's where analysis should start, not end: why did the system let that error reach prod?", he: "root cause = 'טעות אנוש'. משם הניתוח צריך להתחיל, לא להיגמר: למה המערכת נתנה לטעות הזו להגיע לפרודקשן?" } },
      { from: 9, to: 4,
        label: { en: "Action items tracked to done", he: "Action items נעקבים עד שהם נסגרים" },
        detail: { en: "<p>Each item: owner, priority, due date, ticket. Examples: unit test for tax rounding (prevent), canary analysis on checkout errors (detect), feature flag required for pricing changes (mitigate). Review open items weekly; report completion rate monthly.</p>", he: "<p>לכל item: בעלים, עדיפות, תאריך יעד, טיקט. דוגמאות: unit test לעיגול מס (מניעה), canary analysis על שגיאות checkout (זיהוי), feature flag חובה לשינויי תמחור (מיתון). סוקרים items פתוחים כל שבוע; מדווחים שיעור השלמה כל חודש.</p>" },
        fail: { en: "Action items with no owner or 'improve monitoring' as the item. Make them specific, testable, and prioritised against feature work with the error budget policy.", he: "action items בלי בעלים או 'לשפר ניטור' בתור item. עושים אותם ספציפיים, ניתנים לבדיקה, ומתועדפים מול עבודת features עם מדיניות ה-error budget." } }
    ]
  },
  diagram: `Users  Prometheus  Alertmgr  PagerDuty  On-call   Grafana  Channel  Argo/flags  Status
  |errors->|          |          |          |         |        |         |         |
  |        |-burn rate>|          |          |         |        |         |         |
  |        |          |--route--->|          |         |        |         |         |
  |        |          |          |--page---->|         |        |         |         |
  |        |          |          |<---ack----|         |        |         |         |
  |        |          |          |          |-triage->|        |         |         |
  |        |          |          |          |-declare--------->|         |         |
  |        |          |          |          |-rollback/flag------------->|         |
  |        |          |          |          |         |        |--update---------->|
  |        |<--------------------------- recovered ---|        |  postmortem, items |`,
  handsOn: [
    { cmd: "promtool check rules slo-burn-rate.yaml && promtool test rules slo-burn-rate-test.yaml", what: { en: "Lint and unit-test alerting rules — yes, alerts deserve tests.", he: "לעשות lint ו-unit test לחוקי התראה — כן, להתראות מגיעים טסטים." } },
    { cmd: "amtool config routes test --config.file=alertmanager.yml team=payments severity=page", what: { en: "Prove which receiver an alert with these labels will reach before you need it at 3 a.m.", he: "להוכיח לאיזה receiver תגיע התראה עם ה-labels האלה לפני שצריך את זה ב-3 בלילה." } },
    { cmd: "amtool silence add alertname=CheckoutBurnRate --duration=30m --comment='rollback in progress INC-412'", what: { en: "Silence with a reason and expiry during mitigation — never an open-ended silence.", he: "להשתיק עם סיבה ותפוגה בזמן מיתון — אף פעם לא השתקה בלי סוף." } },
    { cmd: "kubectl argo rollouts undo checkout && kubectl argo rollouts status checkout", what: { en: "The fastest mitigation for a bad deploy: roll back and watch it converge.", he: "המיתון הכי מהיר ל-deploy רע: rollback ולצפות בהתכנסות." } }
  ],
  mnemonic: {
    en: "Detect, Route, Ack, Triage, Declare, Mitigate, Communicate, Resolve, Learn — 'Stop the bleeding before the autopsy'.",
    he: "זיהוי, ניתוב, ack, triage, הכרזה, מיתון, תקשורת, resolve, למידה — 'עוצרים את הדימום לפני הנתיחה'."
  },
  pitfalls: [
    { en: "Debugging root cause while users are down instead of rolling back first.", he: "לדבג root cause בזמן שמשתמשים למטה במקום לעשות rollback קודם." },
    { en: "Alerts on causes (CPU 85%) instead of symptoms (errors, latency) — noisy pages that miss real outages.", he: "התראות על סיבות (CPU 85%) במקום על סימפטומים (שגיאות, latency) — pages רועשים שמפספסים השבתות אמיתיות." },
    { en: "No dead-man's-switch: the monitoring stack fails silently and you learn about it from customers.", he: "אין dead-man's-switch: מערכת הניטור נופלת בשקט ואתה לומד על זה מלקוחות." },
    { en: "Postmortem action items without owners and due dates — the same incident repeats next quarter.", he: "action items ב-postmortem בלי בעלים ותאריכי יעד — אותה תקלה חוזרת ברבעון הבא." }
  ],
  interview: [
    { q: { en: "You're paged at 3 a.m. for elevated checkout errors. Walk me through the first 15 minutes.", he: "קיבלת page ב-3 בלילה על עלייה בשגיאות checkout. תעבור איתי על 15 הדקות הראשונות." },
      a: { en: "Ack, open the runbook and RED dashboard, confirm user impact and scope (region, % of requests). Check what changed: deploy annotations, flag changes, config, dependency status. If impact is real and a recent change correlates, declare (SEV2+), get an IC, and mitigate via rollback/flag without waiting for root cause. Post a first status update within ~10 minutes. Then use traces/logs to confirm and verify recovery against the SLI.", he: "ack, פותחים את ה-runbook ואת דשבורד ה-RED, מאשרים פגיעה במשתמשים ואת ההיקף (region, אחוז בקשות). בודקים מה השתנה: annotations של deploy, שינויי flags, קונפיג, סטטוס dependencies. אם הפגיעה אמיתית ושינוי אחרון מתואם, מכריזים (SEV2+), מביאים IC, וממתנים עם rollback/flag בלי לחכות ל-root cause. מפרסמים עדכון סטטוס ראשון תוך ~10 דקות. אחר כך משתמשים ב-traces/logs כדי לאשר ומאמתים התאוששות מול ה-SLI." } },
    { q: { en: "How do you make postmortems actually reduce incidents?", he: "איך גורמים ל-postmortems באמת להפחית תקלות?" },
      a: { en: "Blameless culture so people share the real story; contributing-factor analysis across prevention, detection and mitigation; specific action items with owners and dates tracked in the normal backlog; error-budget policy that prioritises reliability work when the budget is burned; quarterly review of incident themes to fund systemic fixes (e.g. a safe-deploy platform).", he: "תרבות ללא האשמה כדי שאנשים ישתפו את הסיפור האמיתי; ניתוח גורמים תורמים לאורך מניעה, זיהוי ומיתון; action items ספציפיים עם בעלים ותאריכים שנעקבים ב-backlog הרגיל; מדיניות error budget שמתעדפת עבודת אמינות כשה-budget נשרף; וסקירה רבעונית של נושאי תקלות כדי לממן תיקונים מערכתיים (למשל פלטפורמת deploy בטוח)." } }
  ],
  quiz: [
    { q: { en: "Why use multi-window burn-rate alerts?", he: "למה להשתמש בהתראות burn-rate רב-חלוניות?" },
      options: [ { en: "They need less storage", he: "הן צריכות פחות אחסון" }, { en: "Fast detection of big burns and no paging on short blips, tied to the SLO", he: "זיהוי מהיר של שריפות גדולות ובלי page על גמגומים קצרים, קשור ל-SLO" }, { en: "They replace dashboards", he: "הן מחליפות דשבורדים" }, { en: "PagerDuty requires them", he: "PagerDuty דורש אותן" } ],
      answer: 1, explain: { en: "Long window = significant budget burned; short window = it's still happening now.", he: "חלון ארוך = budget משמעותי נשרף; חלון קצר = זה עדיין קורה עכשיו." } },
    { q: { en: "During a SEV1, the Incident Commander should mainly:", he: "בזמן SEV1, ה-Incident Commander צריך בעיקר:" },
      options: [ { en: "Write the fix", he: "לכתוב את התיקון" }, { en: "Coordinate, decide and keep roles clear", he: "לתאם, להחליט ולשמור על תפקידים ברורים" }, { en: "Update the status page personally", he: "לעדכן את ה-status page בעצמו" }, { en: "Find who caused it", he: "למצוא מי גרם לזה" } ],
      answer: 1, explain: { en: "The IC doesn't hold the hose; separate roles prevent chaos.", he: "ה-IC לא מחזיק את הזרנוק; הפרדת תפקידים מונעת כאוס." } },
    { q: { en: "Errors started one minute after a deploy. Best first action?", he: "השגיאות התחילו דקה אחרי deploy. הפעולה הראשונה הטובה ביותר?" },
      options: [ { en: "Read the diff line by line", he: "לקרוא את ה-diff שורה-שורה" }, { en: "Roll back / disable the flag, then investigate", he: "rollback / לכבות את ה-flag, ואז לחקור" }, { en: "Scale up the service", he: "להגדיל את השירות" }, { en: "Wait to see if it recovers", he: "לחכות ולראות אם זה מתאושש" } ],
      answer: 1, explain: { en: "Mitigation first; the diff will still be there after users are happy.", he: "קודם מיתון; ה-diff עדיין יהיה שם אחרי שהמשתמשים מרוצים." } },
    { q: { en: "What is a dead-man's-switch in alerting?", he: "מה זה dead-man's-switch בהתראות?" },
      options: [ { en: "An alert that always fires; if it stops arriving externally, the alerting pipeline is broken", he: "התראה שתמיד יורה; אם היא מפסיקה להגיע לגורם חיצוני, ה-pipeline של ההתראות שבור" }, { en: "A button that stops all alerts", he: "כפתור שעוצר את כל ההתראות" }, { en: "An alert for when on-call leaves", he: "התראה כשה-on-call עוזב" }, { en: "A kill switch for deploys", he: "kill switch ל-deploys" } ],
      answer: 0, explain: { en: "It's how you detect that the monitoring itself is down.", he: "ככה מזהים שהניטור עצמו למטה." } }
  ],
  related: ["rel-incident-management", "obs-alerting", "rel-error-budgets", "staff-large-incidents", "pr-observability-plan", "flow-commit-to-prod"]
});

INFRA.glossary.push(
  { term: "Admission controller", track: "flows", def: { en: "Kubernetes API-server plug-in (built-in or webhook) that mutates or validates objects after authz and before they are stored — e.g. Kyverno verifying image signatures.", he: "plug-in של ה-API server ב-Kubernetes (מובנה או webhook) שמשנה או מאמת אובייקטים אחרי authz ולפני שמירה — למשל Kyverno שמאמת חתימות של images." }, lesson: "flow-k8s-pod-lifecycle" },
  { term: "preStop hook", track: "flows", def: { en: "Container lifecycle hook run before SIGTERM; commonly a short sleep so endpoint removal propagates before the app stops accepting traffic.", he: "hook במחזור החיים של קונטיינר שרץ לפני SIGTERM; בדרך כלל sleep קצר כדי שההסרה מה-endpoints תתפשט לפני שהאפליקציה מפסיקה לקבל תעבורה." }, lesson: "flow-k8s-pod-lifecycle" },
  { term: "Progressive delivery", track: "flows", def: { en: "Releasing a new version to a growing slice of traffic (canary, blue-green, flags) with automated analysis deciding promote or rollback.", he: "שחרור גרסה חדשה לפלח הולך וגדל של תעבורה (canary, blue-green, flags) עם analysis אוטומטי שמחליט על קידום או rollback." }, lesson: "flow-commit-to-prod" },
  { term: "Merge queue", track: "flows", def: { en: "CI mechanism that re-tests each PR on top of the latest main (plus queued PRs) before merging, so main stays green.", he: "מנגנון CI שמריץ שוב טסטים לכל PR על גבי ה-main העדכני (ועוד PRs בתור) לפני merge, כדי ש-main יישאר ירוק." }, lesson: "flow-commit-to-prod" },
  { term: "Apache Iceberg", track: "flows", def: { en: "Open table format for data lakes (Parquet files + metadata) with atomic commits, schema evolution, time travel and row-level deletes.", he: "פורמט טבלה פתוח ל-data lakes (קבצי Parquet + metadata) עם commits אטומיים, schema evolution, time travel ו-row-level deletes." }, lesson: "flow-event-pipeline" },
  { term: "Late data", track: "flows", def: { en: "Events that arrive after the watermark passed their event-time window; handled with allowed lateness, side outputs or batch reconciliation.", he: "אירועים שמגיעים אחרי שה-watermark עבר את חלון ה-event-time שלהם; מטפלים בהם עם allowed lateness, side outputs או reconciliation ב-batch." }, lesson: "flow-event-pipeline" },
  { term: "Backfill", track: "flows", def: { en: "Reprocessing historical data (from Kafka or the raw lake) to fix or build derived tables; safe only with idempotent sinks.", he: "עיבוד מחדש של דאטה היסטורי (מ-Kafka או מה-raw lake) כדי לתקן או לבנות טבלאות נגזרות; בטוח רק עם sinks אידמפוטנטיים." }, lesson: "flow-event-pipeline" },
  { term: "Tenant provisioning", track: "flows", def: { en: "Durable, idempotent workflow that creates everything a new customer needs: records, isolation, keys, storage, DNS, SSO, billing and metering.", he: "workflow עמיד ואידמפוטנטי שיוצר כל מה שלקוח חדש צריך: רשומות, בידוד, מפתחות, אחסון, DNS, SSO, חיוב ו-metering." }, lesson: "flow-tenant-onboarding" },
  { term: "Usage metering", track: "flows", def: { en: "Recording billable usage events per tenant (with idempotency ids) and aggregating them for usage-based billing and quotas.", he: "רישום אירועי שימוש שמחויבים לכל tenant (עם idempotency ids) ואגרגציה שלהם לחיוב לפי שימוש ול-quotas." }, lesson: "flow-tenant-onboarding" },
  { term: "Dead man's switch", track: "flows", def: { en: "An always-firing heartbeat alert sent to an external service; if it stops arriving, the alerting pipeline itself is broken.", he: "התראת heartbeat שתמיד יורה לשירות חיצוני; אם היא מפסיקה להגיע, ה-pipeline של ההתראות עצמו שבור." }, lesson: "flow-alert-to-postmortem" }
);
