window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Cloud & architecture extras: secrets management, landing zones,
   feature flags, service discovery
   ========================================================================= */

window.INFRA.lessons.push({
  id: "cloud-secrets-management",
  track: "cloud",
  order: 20,
  icon: "🗝️",
  level: 2,
  minutes: 15,
  title: { en: "Secrets Management: Vault, Cloud Secret Stores & Rotation", he: "ניהול Secrets: Vault, secret stores בענן ו-rotation" },
  tldr: {
    en: "A secret in git, a Dockerfile or a CI log is already leaked. Keep secrets in one store (Vault / Secrets Manager / Key Vault / Secret Manager), let workloads authenticate with their identity, prefer dynamic short-lived credentials, rotate with two valid credentials overlapping, and scan every push.",
    he: "Secret שנמצא ב-git, ב-Dockerfile או בלוג של CI כבר דלף. שומרים secrets ב-store אחד (Vault / Secrets Manager / Key Vault / Secret Manager), נותנים ל-workloads להזדהות עם ה-identity שלהם, מעדיפים credentials דינמיים קצרי-חיים, עושים rotation עם שני credentials תקפים בחפיפה, וסורקים כל push."
  },
  analogy: {
    en: "Static passwords are copies of the office master key handed out on day one — after three years nobody knows how many copies exist. A secrets manager is a key desk with a camera: you show your badge (identity), you get a key that opens one door and self-destructs at 18:00 (dynamic credential with a TTL), and every handout is written in the log book. Rotation is changing the lock while the old key keeps working for one more hour, so nobody gets locked out mid-shift.",
    he: "סיסמאות סטטיות הן עותקים של מפתח המאסטר של המשרד שחילקו ביום הראשון — אחרי שלוש שנים אף אחד לא יודע כמה עותקים יש. Secrets manager הוא דלפק מפתחות עם מצלמה: אתה מראה תג (identity), מקבל מפתח שפותח דלת אחת ומשמיד את עצמו ב-18:00 (credential דינמי עם TTL), וכל חלוקה נרשמת ביומן. Rotation זה להחליף מנעול כשהמפתח הישן עובד עוד שעה, כדי שאף אחד לא יינעל בחוץ באמצע משמרת."
  },
  sections: [
    {
      h: { en: "Why env vars in git and CI are leaks", he: "למה env vars ב-git וב-CI הם דליפה" },
      body: {
        en: `<p>Environment variables are a fine <em>delivery</em> mechanism at runtime, but a terrible <em>storage</em> mechanism. The common leak paths:</p>
<ul>
<li><strong>Git history</strong>: <code>.env</code> committed once and "deleted" next commit is still in every clone, fork and CI cache forever.</li>
<li><strong>Docker image layers</strong>: <code>ENV AWS_SECRET_ACCESS_KEY=...</code> or a <code>COPY .env</code> lives in a layer; <code>docker history</code> or unpacking the tarball reveals it, even if a later layer removes the file.</li>
<li><strong>CI logs</strong>: <code>set -x</code>, a debug print, or a tool that echoes its config. Masking only catches exact matches — base64 or URL-encoded copies slip through.</li>
<li><strong>Process inspection</strong>: <code>/proc/&lt;pid&gt;/environ</code>, <code>kubectl describe pod</code> for literal env values, crash dumps and error trackers (Sentry) that capture the environment.</li>
</ul>
<p>Public GitHub is scraped by bots within <strong>seconds to minutes</strong> of a push. If a credential touched a public place, assume it's in someone's database already.</p>
<blockquote>💡 Real world: Kubernetes <code>Secret</code> objects are only base64-encoded, not encrypted. Turn on encryption at rest for etcd (KMS provider) and restrict <code>get/list secrets</code> in RBAC — <code>list</code> on secrets in a namespace means reading all of them.</blockquote>`,
        he: `<p>משתני סביבה הם מנגנון <em>העברה</em> סביר בזמן ריצה, אבל מנגנון <em>אחסון</em> גרוע. נתיבי הדליפה הנפוצים:</p>
<ul>
<li><strong>היסטוריית Git</strong>: קובץ <code>.env</code> שעשו לו commit פעם אחת ו"מחקו" ב-commit הבא עדיין נמצא בכל clone, fork ו-cache של CI לנצח.</li>
<li><strong>Layers של Docker image</strong>: <code>ENV AWS_SECRET_ACCESS_KEY=...</code> או <code>COPY .env</code> נשארים ב-layer; <code>docker history</code> או פתיחת ה-tarball חושפים אותם, גם אם layer מאוחר יותר מוחק את הקובץ.</li>
<li><strong>לוגים של CI</strong>: <code>set -x</code>, הדפסת debug, או כלי שמדפיס את ה-config שלו. Masking תופס רק התאמה מדויקת — עותק ב-base64 או ב-URL encoding עובר.</li>
<li><strong>בדיקת תהליכים</strong>: <code>/proc/&lt;pid&gt;/environ</code>, <code>kubectl describe pod</code> לערכי env מפורשים, crash dumps ו-error trackers (Sentry) שתופסים את הסביבה.</li>
</ul>
<p>GitHub הציבורי נסרק ע"י בוטים תוך <strong>שניות עד דקות</strong> מה-push. אם credential נגע במקום ציבורי, תניח שהוא כבר בדאטהבייס של מישהו.</p>
<blockquote>💡 Real world: אובייקטים של <code>Secret</code> ב-Kubernetes הם רק base64, לא מוצפנים. תפעיל encryption at rest ל-etcd (KMS provider) ותגביל <code>get/list secrets</code> ב-RBAC — <code>list</code> על secrets ב-namespace זה בעצם לקרוא את כולם.</blockquote>`
      }
    },
    {
      h: { en: "HashiCorp Vault: KV v2, dynamic secrets, leases, auth", he: "HashiCorp Vault: KV v2, dynamic secrets, leases ו-auth" },
      body: {
        en: `<p><strong>KV v2</strong> is the versioned static-secret engine. Note the hidden <code>data/</code> segment in policy paths:</p>
<pre>vault kv put secret/orders/stripe api_key=sk_live_...
vault kv get -version=3 secret/orders/stripe
vault kv rollback -version=2 secret/orders/stripe

# policy: orders.hcl
path "secret/data/orders/*" { capabilities = ["read"] }
path "database/creds/orders-app" { capabilities = ["read"] }</pre>
<p><strong>Dynamic secrets</strong> are the real superpower: Vault creates a unique DB user on demand and drops it when the lease expires.</p>
<pre>vault secrets enable database
vault write database/config/orders \\
  plugin_name=postgresql-database-plugin \\
  connection_url="postgresql://{{username}}:{{password}}@orders-db:5432/orders" \\
  allowed_roles=orders-app username=vault password=...
vault write database/roles/orders-app db_name=orders \\
  creation_statements="CREATE ROLE \\"{{name}}\\" LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \\"{{name}}\\";" \\
  default_ttl=1h max_ttl=24h

$ vault read database/creds/orders-app
Key                Value
lease_id           database/creds/orders-app/2fQx9...
lease_duration     1h
lease_renewable    true
password           A1a-8nWq...
username           v-kubernet-orders-a-x7Tq2</pre>
<p>Every dynamic secret has a <strong>lease</strong>: the app (or Vault Agent) renews it up to <code>max_ttl</code>, then must fetch a new one. Incident? <code>vault lease revoke -prefix database/creds/orders-app</code> kills every credential issued for that role in one command.</p>
<p><strong>Auth methods</strong> turn an existing identity into a Vault token: <code>kubernetes</code> (ServiceAccount JWT), <code>aws</code> (IAM signed request), <code>jwt/oidc</code> (CI runners, SSO for humans), <code>approle</code> (legacy machines). Kubernetes auth:</p>
<pre>vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443
vault write auth/kubernetes/role/orders \\
  bound_service_account_names=orders \\
  bound_service_account_namespaces=prod \\
  token_policies=orders token_ttl=1h</pre>
<p><strong>Seal/unseal</strong>: Vault starts sealed — its storage is encrypted with a root key it doesn't hold in plain text. <code>vault operator init</code> by default splits the unseal key into <strong>5 Shamir shares, threshold 3</strong>; every restart needs 3 humans. In production use <strong>auto-unseal</strong> (<code>seal "awskms"</code>, Azure Key Vault, GCP Cloud KMS, or an HSM) so pods can restart at 3 AM without a quorum of people — you then get recovery keys instead of unseal keys.</p>`,
        he: `<p><strong>KV v2</strong> הוא ה-engine לסודות סטטיים עם גרסאות. שים לב לסגמנט ה-<code>data/</code> הנסתר בנתיבי ה-policy:</p>
<pre>vault kv put secret/orders/stripe api_key=sk_live_...
vault kv get -version=3 secret/orders/stripe
vault kv rollback -version=2 secret/orders/stripe

# policy: orders.hcl
path "secret/data/orders/*" { capabilities = ["read"] }
path "database/creds/orders-app" { capabilities = ["read"] }</pre>
<p><strong>Dynamic secrets</strong> הם כוח העל האמיתי: Vault יוצר DB user ייחודי לפי דרישה ומוחק אותו כשה-lease פג.</p>
<pre>vault secrets enable database
vault write database/config/orders \\
  plugin_name=postgresql-database-plugin \\
  connection_url="postgresql://{{username}}:{{password}}@orders-db:5432/orders" \\
  allowed_roles=orders-app username=vault password=...
vault write database/roles/orders-app db_name=orders \\
  creation_statements="CREATE ROLE \\"{{name}}\\" LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \\"{{name}}\\";" \\
  default_ttl=1h max_ttl=24h

$ vault read database/creds/orders-app
Key                Value
lease_id           database/creds/orders-app/2fQx9...
lease_duration     1h
lease_renewable    true
password           A1a-8nWq...
username           v-kubernet-orders-a-x7Tq2</pre>
<p>לכל dynamic secret יש <strong>lease</strong>: האפליקציה (או Vault Agent) מחדשת אותו עד <code>max_ttl</code>, ואז חייבת להביא חדש. יש incident? <code>vault lease revoke -prefix database/creds/orders-app</code> הורג כל credential שהונפק ל-role הזה בפקודה אחת.</p>
<p><strong>Auth methods</strong> הופכים identity קיים ל-Vault token: <code>kubernetes</code> (JWT של ServiceAccount), <code>aws</code> (בקשה חתומה של IAM), <code>jwt/oidc</code> (CI runners, SSO לבני אדם), <code>approle</code> (מכונות legacy). Kubernetes auth:</p>
<pre>vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443
vault write auth/kubernetes/role/orders \\
  bound_service_account_names=orders \\
  bound_service_account_namespaces=prod \\
  token_policies=orders token_ttl=1h</pre>
<p><strong>Seal/unseal</strong>: Vault עולה במצב sealed — ה-storage שלו מוצפן עם root key שהוא לא מחזיק בטקסט גלוי. <code>vault operator init</code> כברירת מחדל מפצל את ה-unseal key ל-<strong>5 חלקי Shamir, עם סף של 3</strong>; כל restart דורש 3 בני אדם. בפרודקשן משתמשים ב-<strong>auto-unseal</strong> (<code>seal "awskms"</code>, Azure Key Vault, GCP Cloud KMS או HSM) כדי ש-pods יוכלו לעלות מחדש ב-3 בלילה בלי quorum של אנשים — ואז מקבלים recovery keys במקום unseal keys.</p>`
      }
    },
    {
      h: { en: "Cloud-native stores: AWS, Azure, GCP", he: "Stores מנוהלים: AWS, Azure, GCP" },
      body: {
        en: `<table>
<tr><th></th><th>AWS Secrets Manager</th><th>AWS SSM Parameter Store</th><th>Azure Key Vault</th><th>GCP Secret Manager</th></tr>
<tr><td>Price</td><td>$0.40/secret/month + $0.05 per 10K calls</td><td>Standard: free (10K params, 4 KB). Advanced: $0.05/param/month, 8 KB</td><td>Per 10K operations; Premium tier for HSM-backed keys</td><td>~$0.06 per active version/month + $0.03 per 10K accesses</td></tr>
<tr><td>Rotation</td><td>Built-in, Lambda-based, managed for RDS/Aurora/Redshift</td><td>None built-in</td><td>Rotation policies for keys; secrets via Event Grid "near expiry" events</td><td>Rotation <em>schedule</em> sends Pub/Sub notifications; you write the rotator</td></tr>
<tr><td>Notable</td><td>Cross-account resource policies, multi-region replicas, staging labels</td><td>Hierarchical paths, SecureString via KMS, great for non-secret config</td><td>Secrets + keys + certificates; soft-delete (7-90 days) and purge protection</td><td>Versions, IAM per secret, automatic or user-managed replication</td></tr>
</table>
<p>Rule of thumb on AWS: <strong>Secrets Manager</strong> for anything that needs rotation or cross-account sharing (DB passwords, third-party API keys); <strong>Parameter Store</strong> for config and low-value secrets where $0.40 × 3,000 parameters adds up.</p>
<pre>aws secretsmanager get-secret-value --secret-id prod/orders/db \\
  --query SecretString --output text
az keyvault secret show --vault-name kv-prod-weu --name orders-db --query value -o tsv
gcloud secrets versions access latest --secret=orders-db</pre>
<blockquote>⚠️ Production tip: Azure Key Vault purge protection cannot be turned off once enabled — good. Without it, a compromised admin can delete <em>and purge</em> your vault, and every app depending on it dies.</blockquote>`,
        he: `<table>
<tr><th></th><th>AWS Secrets Manager</th><th>AWS SSM Parameter Store</th><th>Azure Key Vault</th><th>GCP Secret Manager</th></tr>
<tr><td>מחיר</td><td>$0.40 ל-secret לחודש + $0.05 ל-10K קריאות</td><td>Standard: חינם (10K פרמטרים, 4 KB). Advanced: $0.05 לפרמטר לחודש, 8 KB</td><td>לפי 10K פעולות; Premium למפתחות מגובי HSM</td><td>בערך $0.06 לגרסה פעילה לחודש + $0.03 ל-10K גישות</td></tr>
<tr><td>Rotation</td><td>מובנה, מבוסס Lambda, מנוהל ל-RDS/Aurora/Redshift</td><td>אין מובנה</td><td>Rotation policies למפתחות; ל-secrets דרך אירועי Event Grid של "near expiry"</td><td><em>Schedule</em> של rotation שולח הודעות Pub/Sub; את ה-rotator אתה כותב</td></tr>
<tr><td>בולט</td><td>Resource policies בין accounts, replicas במספר regions, staging labels</td><td>נתיבים היררכיים, SecureString דרך KMS, מעולה ל-config שאינו סודי</td><td>Secrets + keys + certificates; soft-delete (7-90 יום) ו-purge protection</td><td>גרסאות, IAM לכל secret, replication אוטומטי או ידני</td></tr>
</table>
<p>כלל אצבע ב-AWS: <strong>Secrets Manager</strong> לכל מה שצריך rotation או שיתוף בין accounts (סיסמאות DB, API keys של צד שלישי); <strong>Parameter Store</strong> ל-config ולסודות פחות קריטיים, כי $0.40 כפול 3,000 פרמטרים מצטבר.</p>
<pre>aws secretsmanager get-secret-value --secret-id prod/orders/db \\
  --query SecretString --output text
az keyvault secret show --vault-name kv-prod-weu --name orders-db --query value -o tsv
gcloud secrets versions access latest --secret=orders-db</pre>
<blockquote>⚠️ Production tip: אי אפשר לכבות purge protection ב-Azure Key Vault אחרי שהפעלת אותו — וזה טוב. בלעדיו, admin שנפרץ יכול למחוק <em>וגם לעשות purge</em> ל-vault שלך, וכל אפליקציה שתלויה בו מתה.</blockquote>`
      }
    },
    {
      h: { en: "Getting secrets into Kubernetes: ESO vs CSI driver", he: "איך secrets מגיעים ל-Kubernetes: ESO מול CSI driver" },
      body: {
        en: `<p><strong>External Secrets Operator (ESO)</strong> reads from the external store and writes a normal Kubernetes <code>Secret</code>, refreshing it on an interval. Apps consume it as env or a volume — zero code changes.</p>
<pre>apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: aws-sm
spec:
  provider:
    aws:
      service: SecretsManager
      region: eu-central-1
      auth:
        jwt:
          serviceAccountRef: { name: external-secrets, namespace: external-secrets }
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: orders-db
  namespace: prod
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target:
    name: orders-db          # the k8s Secret ESO creates
  data:
    - secretKey: password
      remoteRef: { key: prod/orders/db, property: password }</pre>
<p><strong>Secrets Store CSI driver</strong> mounts secrets as files directly from the store into the pod at start (provider plugins for AWS, Azure, GCP, Vault). No etcd copy by default; optional sync to a k8s Secret if you need env vars.</p>
<pre>apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: orders-db
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "prod/orders/db"
        objectType: "secretsmanager"</pre>
<p>Trade-off: ESO is simpler and GitOps-friendly but the value lands in etcd; CSI keeps it out of etcd but the pod fails to start if the store is unreachable, and rotation needs the app to re-read the file. A third option: <strong>Vault Agent injector</strong> sidecar that renders templates and renews leases.</p>
<blockquote>⚠️ Production tip: env vars are read once at process start. If you rotate a secret consumed as an env var, nothing changes until the pod restarts. Use a mounted file and reload on change, or pair ESO with Reloader (stakater) to roll the Deployment.</blockquote>`,
        he: `<p><strong>External Secrets Operator (ESO)</strong> קורא מה-store החיצוני וכותב <code>Secret</code> רגיל של Kubernetes, ומרענן אותו כל פרק זמן. האפליקציות צורכות אותו כ-env או כ-volume — בלי שום שינוי קוד.</p>
<pre>apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: aws-sm
spec:
  provider:
    aws:
      service: SecretsManager
      region: eu-central-1
      auth:
        jwt:
          serviceAccountRef: { name: external-secrets, namespace: external-secrets }
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: orders-db
  namespace: prod
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target:
    name: orders-db          # the k8s Secret ESO creates
  data:
    - secretKey: password
      remoteRef: { key: prod/orders/db, property: password }</pre>
<p><strong>Secrets Store CSI driver</strong> מעלה secrets כקבצים ישירות מה-store לתוך ה-pod בזמן העלייה (provider plugins ל-AWS, Azure, GCP, Vault). כברירת מחדל אין עותק ב-etcd; אפשר לסנכרן ל-Secret של k8s אם צריך env vars.</p>
<pre>apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: orders-db
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "prod/orders/db"
        objectType: "secretsmanager"</pre>
<p>ה-trade-off: ESO פשוט יותר וידידותי ל-GitOps אבל הערך נוחת ב-etcd; CSI משאיר אותו מחוץ ל-etcd אבל ה-pod לא עולה אם ה-store לא זמין, ו-rotation דורש שהאפליקציה תקרא את הקובץ מחדש. אופציה שלישית: sidecar של <strong>Vault Agent injector</strong> שמרנדר templates ומחדש leases.</p>
<blockquote>⚠️ Production tip: env vars נקראים פעם אחת בעליית התהליך. אם עשית rotation ל-secret שנצרך כ-env var, שום דבר לא משתנה עד שה-pod עולה מחדש. תשתמש בקובץ mounted ותעשה reload בשינוי, או תחבר ל-ESO את Reloader (stakater) שיעשה rollout ל-Deployment.</blockquote>`
      }
    },
    {
      h: { en: "Rotation without downtime, scanning, and what to do after a leak", he: "Rotation בלי downtime, סריקה, ומה עושים אחרי דליפה" },
      body: {
        en: `<p><strong>The dual-credential pattern</strong>: never have a moment where only one credential exists and it's the wrong one.</p>
<ol>
<li>Create credential B while A is still valid (DB: second user, or <code>ALTER ROLE ... PASSWORD</code> on an alternate user; API: second key).</li>
<li>Publish B to the store. Consumers pick it up over the next refresh interval.</li>
<li>Verify B is in use (DB connections by user, API key last-used timestamp).</li>
<li>Revoke A. Next rotation, swap roles.</li>
</ol>
<p>AWS Secrets Manager models this with staging labels <code>AWSPENDING</code> → <code>AWSCURRENT</code> → <code>AWSPREVIOUS</code> and an "alternating users" rotation strategy for databases.</p>
<p><strong>Secret scanning</strong> at three layers:</p>
<pre># pre-commit / CI: scan the working tree and full history
gitleaks git -v --redact .
gitleaks dir ./build-output

# GitHub: secret scanning + push protection blocks the push
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
remote:   —— Amazon AWS Access Key ID ——</pre>
<p>Plus provider-side: GitHub's partner program notifies AWS, Slack, Stripe, etc. — AWS attaches an <code>AWSCompromisedKeyQuarantine</code> policy to a leaked key and opens a support case.</p>
<p><strong>After a leak, in this order:</strong></p>
<ol>
<li><strong>Revoke/rotate</strong> the credential first (deactivate AWS key, regenerate token). Minutes matter.</li>
<li><strong>Investigate</strong> what it was used for: CloudTrail by <code>AccessKeyId</code>, DB audit logs, provider dashboards. Look for persistence (new users, keys, roles, Lambdas).</li>
<li><strong>Fix the source</strong>: move to workload identity / the store, fix the pipeline that leaked it.</li>
<li><strong>Clean history</strong> (<code>git filter-repo</code>, rebuild images) — hygiene only; it never un-leaks anything.</li>
</ol>
<blockquote>💡 Real world: in 2022 a contractor's leaked token gave attackers access to Uber's internal systems after they found hard-coded admin credentials in a PowerShell script on a network share. One store + scanning would have broken that chain at two points.</blockquote>`,
        he: `<p><strong>תבנית ה-dual-credential</strong>: אף פעם לא להגיע לרגע שבו קיים רק credential אחד והוא הלא נכון.</p>
<ol>
<li>יוצרים credential B כש-A עדיין תקף (DB: user שני, או <code>ALTER ROLE ... PASSWORD</code> על user חלופי; API: מפתח שני).</li>
<li>מפרסמים את B ב-store. הצרכנים מרימים אותו במהלך ה-refresh interval הבא.</li>
<li>מוודאים ש-B בשימוש (חיבורי DB לפי user, last-used של ה-API key).</li>
<li>מבטלים את A. ב-rotation הבא מחליפים תפקידים.</li>
</ol>
<p>AWS Secrets Manager ממדל את זה עם staging labels <code>AWSPENDING</code> → <code>AWSCURRENT</code> → <code>AWSPREVIOUS</code> ועם אסטרטגיית rotation של "alternating users" לדאטהבייסים.</p>
<p><strong>Secret scanning</strong> בשלוש שכבות:</p>
<pre># pre-commit / CI: scan the working tree and full history
gitleaks git -v --redact .
gitleaks dir ./build-output

# GitHub: secret scanning + push protection blocks the push
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
remote:   —— Amazon AWS Access Key ID ——</pre>
<p>ובנוסף בצד הספק: תוכנית השותפים של GitHub מודיעה ל-AWS, Slack, Stripe וכו' — AWS מצמיד policy בשם <code>AWSCompromisedKeyQuarantine</code> למפתח שדלף ופותח support case.</p>
<p><strong>אחרי דליפה, בסדר הזה:</strong></p>
<ol>
<li><strong>Revoke/rotate</strong> ל-credential קודם כל (deactivate ל-AWS key, יצירת token מחדש). דקות קובעות.</li>
<li><strong>חקירה</strong> — במה השתמשו בו: CloudTrail לפי <code>AccessKeyId</code>, audit logs של ה-DB, דשבורדים של הספק. מחפשים persistence (users, keys, roles, Lambdas חדשים).</li>
<li><strong>תיקון המקור</strong>: מעבר ל-workload identity / ל-store, תיקון ה-pipeline שהדליף.</li>
<li><strong>ניקוי היסטוריה</strong> (<code>git filter-repo</code>, בנייה מחדש של images) — היגיינה בלבד; זה אף פעם לא מבטל דליפה.</li>
</ol>
<blockquote>💡 Real world: ב-2022 תוקפים נכנסו למערכות הפנימיות של Uber דרך חשבון של קבלן, ואז מצאו credentials של admin שהיו hard-coded בסקריפט PowerShell על network share. store אחד + סריקה היו שוברים את השרשרת הזו בשתי נקודות.</blockquote>`
      }
    }
  ],
  diagram: "Pod (ServiceAccount JWT)\n   |  login: auth/kubernetes/role/orders\n   v\nVault ---- verifies JWT via TokenReview ----> kube-apiserver\n   |  token (policy: orders, ttl 1h)\n   v\nread database/creds/orders-app\n   |  CREATE ROLE v-...-x7Tq2 VALID UNTIL +1h\n   v\nPostgres  <---- app connects with dynamic user\n   (lease expires -> Vault DROPs the role)",
  handsOn: [
    { cmd: "vault server -dev & export VAULT_ADDR=http://127.0.0.1:8200; vault kv put secret/demo pw=s3cr3t; vault kv get -format=json secret/demo", what: { en: "Run a throwaway dev Vault (in-memory, auto-unsealed) and write/read a KV v2 secret with versions.", he: "להריץ Vault זמני במצב dev (בזיכרון, unsealed אוטומטית) ולכתוב/לקרוא secret ב-KV v2 עם גרסאות." } },
    { cmd: "docker history --no-trunc myorg/api:1.4 | grep -iE 'key|secret|token|password'", what: { en: "Check whether a secret was baked into any image layer via ENV or ARG.", he: "לבדוק אם secret נאפה לתוך layer כלשהו של ה-image דרך ENV או ARG." } },
    { cmd: "gitleaks git -v --redact .", what: { en: "Scan the full git history of the current repo for secrets (values redacted in output).", he: "לסרוק את כל היסטוריית ה-git של הריפו הנוכחי ל-secrets (הערכים מוסתרים בפלט)." } },
    { cmd: "aws secretsmanager describe-secret --secret-id prod/orders/db --query '{Rotation:RotationEnabled,Last:LastRotatedDate,Versions:VersionIdsToStages}'", what: { en: "See whether rotation is on and which version carries AWSCURRENT / AWSPREVIOUS.", he: "לראות אם rotation פעיל ואיזו גרסה מחזיקה AWSCURRENT / AWSPREVIOUS." } },
    { cmd: "kubectl get externalsecrets -A -o wide", what: { en: "List ESO ExternalSecrets with their sync status (SecretSynced / SecretSyncedError).", he: "להציג את ה-ExternalSecrets של ESO עם סטטוס הסנכרון (SecretSynced / SecretSyncedError)." } }
  ],
  mnemonic: {
    en: "STORE, SHORT, SWAP, SCAN: one Store, Short-lived creds, Swap with overlap, Scan every push. Leaked? Revoke first, git-clean last.",
    he: "STORE, SHORT, SWAP, SCAN: store אחד, credentials קצרי-חיים, החלפה עם חפיפה, סריקה בכל push. דלף? קודם revoke, ניקוי git בסוף."
  },
  pitfalls: [
    { en: "Rewriting git history and calling the incident closed. The key was scraped in seconds; only revocation helps.", he: "לשכתב את היסטוריית ה-git ולסגור את האירוע. המפתח נאסף תוך שניות; רק revoke עוזר." },
    { en: "Single-credential rotation: changing the DB password in place breaks every pod still holding the old one until they restart.", he: "Rotation עם credential יחיד: שינוי סיסמת ה-DB במקום שובר כל pod שעדיין מחזיק את הישנה עד שהוא עולה מחדש." },
    { en: "Running Vault with manual Shamir unseal in Kubernetes: a node drain at night leaves Vault sealed and every dependent app failing to authenticate.", he: "להריץ Vault עם unseal ידני של Shamir ב-Kubernetes: drain של node בלילה משאיר את Vault ב-sealed וכל אפליקציה שתלויה בו נכשלת ב-authentication." },
    { en: "The 'secret zero' problem solved with another static secret (a Vault token in an env var). Use platform identity (k8s SA, IAM role, OIDC) to authenticate to the store.", he: "לפתור את בעיית ה-'secret zero' עם עוד secret סטטי (Vault token ב-env var). משתמשים ב-identity של הפלטפורמה (k8s SA, IAM role, OIDC) כדי להזדהות מול ה-store." }
  ],
  interview: [
    {
      q: { en: "Why are dynamic database credentials better than a rotated static password?", he: "למה credentials דינמיים לדאטהבייס עדיפים על סיסמה סטטית עם rotation?" },
      a: { en: "Each instance gets a unique user with a TTL, so a leak is time-boxed and attributable (DB logs show which pod), revocation is per-lease or per-role in one command, and there's no shared password that every replica and engineer knows. Cost: the DB must handle user churn, and the app must renew leases or reconnect.", he: "כל instance מקבל user ייחודי עם TTL, כך שדליפה מוגבלת בזמן וניתנת לייחוס (הלוגים של ה-DB מראים איזה pod), ה-revoke הוא לפי lease או לפי role בפקודה אחת, ואין סיסמה משותפת שכל replica וכל מהנדס מכירים. המחיר: ה-DB צריך לעמוד בתחלופת users, והאפליקציה צריכה לחדש leases או להתחבר מחדש." }
    },
    {
      q: { en: "ESO or Secrets Store CSI driver — how do you choose?", he: "ESO או Secrets Store CSI driver — איך בוחרים?" },
      a: { en: "ESO when apps expect env vars or k8s Secrets and you want GitOps-friendly manifests; accept the value in etcd (encrypted at rest). CSI when policy says secrets must not land in etcd, or you want the pod start to depend on fresh values; accept that pods won't start if the store is down and that apps must re-read files.", he: "ESO כשהאפליקציות מצפות ל-env vars או ל-Secrets של k8s ורוצים manifests ידידותיים ל-GitOps; מקבלים שהערך יושב ב-etcd (מוצפן at rest). CSI כשה-policy אומר ש-secrets אסור שינחתו ב-etcd, או כשרוצים שעליית ה-pod תלויה בערכים טריים; מקבלים ש-pods לא יעלו אם ה-store נפל ושהאפליקציות צריכות לקרוא קבצים מחדש." }
    }
  ],
  quiz: [
    {
      q: { en: "A developer committed an AWS key to a public repo 10 minutes ago and removed it in the next commit. What's the FIRST action?", he: "מפתח עשה commit ל-AWS key בריפו ציבורי לפני 10 דקות והסיר אותו ב-commit הבא. מה הפעולה הראשונה?" },
      options: [
        { en: "Rewrite history with git filter-repo and force-push", he: "לשכתב היסטוריה עם git filter-repo ולעשות force-push" },
        { en: "Deactivate the access key, then investigate CloudTrail for its usage", he: "לבטל (deactivate) את ה-access key, ואז לחקור ב-CloudTrail במה השתמשו בו" },
        { en: "Make the repository private", he: "להפוך את הריפו לפרטי" },
        { en: "Nothing — it was removed in the next commit", he: "כלום — הוא הוסר ב-commit הבא" }
      ],
      answer: 1,
      explain: { en: "Bots scrape public pushes within seconds. Only revoking the credential stops abuse; history cleanup is hygiene that comes last.", he: "בוטים סורקים pushes ציבוריים תוך שניות. רק ביטול ה-credential עוצר שימוש לרעה; ניקוי ההיסטוריה הוא היגיינה שבאה בסוף." }
    },
    {
      q: { en: "Why do production Vault clusters use auto-unseal?", he: "למה clusters של Vault בפרודקשן משתמשים ב-auto-unseal?" },
      options: [
        { en: "It encrypts secrets twice for extra safety", he: "הוא מצפין את הסודות פעמיים לביטחון נוסף" },
        { en: "It removes the need for policies", he: "הוא מבטל את הצורך ב-policies" },
        { en: "Restarts would otherwise need a quorum of humans entering Shamir key shares", he: "אחרת כל restart ידרוש quorum של בני אדם שמזינים חלקי מפתח של Shamir" },
        { en: "It makes Vault stateless", he: "הוא הופך את Vault ל-stateless" }
      ],
      answer: 2,
      explain: { en: "By default the unseal key is split into 5 shares, threshold 3. Auto-unseal delegates decrypting the root key to a cloud KMS/HSM so pods can restart unattended.", he: "כברירת מחדל ה-unseal key מפוצל ל-5 חלקים עם סף 3. Auto-unseal מעביר את פענוח ה-root key ל-KMS/HSM בענן כך ש-pods יכולים לעלות מחדש בלי התערבות." }
    },
    {
      q: { en: "You rotate a DB password that pods consume as an env var via ESO. What happens to running pods?", he: "עשית rotation לסיסמת DB ש-pods צורכים כ-env var דרך ESO. מה קורה ל-pods שרצים?" },
      options: [
        { en: "They get the new value immediately", he: "הם מקבלים את הערך החדש מיד" },
        { en: "They keep the old value until restarted — and break if the old password is revoked", he: "הם ממשיכים עם הערך הישן עד restart — ונשברים אם הסיסמה הישנה בוטלה" },
        { en: "Kubernetes restarts them automatically", he: "Kubernetes מפעיל אותם מחדש אוטומטית" },
        { en: "ESO patches the process memory", he: "ESO מעדכן את הזיכרון של התהליך" }
      ],
      answer: 1,
      explain: { en: "Env vars are fixed at process start. ESO updates the Secret object, but pods need a restart (e.g. Reloader) or file-based consumption — and dual credentials keep the old one valid meanwhile.", he: "Env vars נקבעים בעליית התהליך. ESO מעדכן את אובייקט ה-Secret, אבל ה-pods צריכים restart (למשל Reloader) או צריכה מקובץ — ו-dual credentials משאירים את הישן תקף בינתיים." }
    },
    {
      q: { en: "Which AWS option fits 3,000 non-sensitive config values with no rotation needs, at the lowest cost?", he: "איזו אופציה ב-AWS מתאימה ל-3,000 ערכי config לא רגישים בלי צורך ב-rotation, בעלות הכי נמוכה?" },
      options: [
        { en: "Secrets Manager", he: "Secrets Manager" },
        { en: "SSM Parameter Store, Standard tier", he: "SSM Parameter Store, שכבת Standard" },
        { en: "KMS custom key store", he: "KMS custom key store" },
        { en: "S3 bucket with public read", he: "S3 bucket עם קריאה ציבורית" }
      ],
      answer: 1,
      explain: { en: "Standard parameters are free (up to 10,000, 4 KB each). Secrets Manager would cost $0.40 × 3,000 = $1,200/month for features you don't need.", he: "פרמטרים ב-Standard הם חינם (עד 10,000, 4 KB כל אחד). Secrets Manager היה עולה $0.40 כפול 3,000 = $1,200 לחודש על פיצ'רים שלא צריך." }
    }
  ],
  related: ["staff-zero-trust-secrets", "cloud-iam-security", "k8s-config", "cloud-cicd", "staff-supply-chain"]
});

window.INFRA.lessons.push({
  id: "cloud-landing-zones",
  track: "cloud",
  order: 21,
  icon: "🏙️",
  level: 3,
  minutes: 15,
  title: { en: "Multi-Account Landing Zones", he: "Landing Zones עם הרבה accounts" },
  tldr: {
    en: "An account (subscription, project) is the strongest isolation boundary the cloud gives you. A landing zone is the pre-built city plan: an org hierarchy with guardrail policies, account vending, central logging and security accounts, a shared network hub, SSO and break-glass — so every new team starts safe by default.",
    he: "Account (subscription, project) הוא גבול הבידוד הכי חזק שהענן נותן. Landing zone הוא תוכנית העיר המוכנה מראש: היררכיית org עם guardrail policies, account vending, accounts מרכזיים ל-logging ואבטחה, network hub משותף, SSO ו-break-glass — כך שכל צוות חדש מתחיל בטוח כברירת מחדל."
  },
  analogy: {
    en: "One cloud account for everything is a shared apartment with one key and one electricity bill: someone's experiment floods the kitchen and you can't tell who ran up the bill. A landing zone is a planned neighborhood: every family gets its own house (account), the city sets building codes nobody can override (SCPs/policies), water and roads come from shared infrastructure (network hub), there's a central police station with cameras on every street (log archive + security account), and the fire department holds a master key in a sealed box (break-glass).",
    he: "Account אחד בענן לכל דבר זה דירת שותפים עם מפתח אחד וחשבון חשמל אחד: הניסוי של מישהו מציף את המטבח ואי אפשר לדעת מי העלה את החשבון. Landing zone הוא שכונה מתוכננת: לכל משפחה בית משלה (account), העירייה קובעת תקנות בנייה שאף אחד לא יכול לעקוף (SCPs/policies), מים וכבישים מגיעים מתשתית משותפת (network hub), יש תחנת משטרה מרכזית עם מצלמות בכל רחוב (log archive + security account), ולכבאים יש מפתח מאסטר בקופסה חתומה (break-glass)."
  },
  sections: [
    {
      h: { en: "Why one account is a trap", he: "למה account אחד הוא מלכודת" },
      body: {
        en: `<ul>
<li><strong>Blast radius</strong>: IAM is scoped per account. One over-privileged CI role or leaked admin key in a shared account reaches prod, dev and the data lake at once. A separate account is a hard wall — cross-account access must be granted explicitly on both sides.</li>
<li><strong>Quotas are per account per region</strong>: a load test in "dev" exhausts the shared vCPU quota, Lambda concurrency (default 1,000) or API rate limits — and prod can't scale.</li>
<li><strong>IAM sprawl and limits</strong>: default 1,000 roles per account (raise-able to 5,000), 10 managed policies per role, 6,144-character managed policy size. Hundreds of teams in one account means policies full of <code>Condition</code> tags that nobody can audit.</li>
<li><strong>Billing</strong>: account is the cleanest cost boundary. Tags are always incomplete; account-level cost is 100% accurate.</li>
<li><strong>Compliance scope</strong>: put PCI workloads in their own accounts and only those are in audit scope.</li>
</ul>
<p>The common layout: one account per <strong>workload × environment</strong> (<code>payments-prod</code>, <code>payments-staging</code>), plus shared platform accounts. Companies with 50 engineers often run 20-40 accounts; large enterprises run thousands.</p>
<blockquote>💡 Real world: AWS Organizations starts with a default quota of 10 accounts per org — request an increase on day one, account vending will hit it fast.</blockquote>`,
        he: `<ul>
<li><strong>Blast radius</strong>: IAM הוא per account. CI role אחד עם יותר מדי הרשאות או admin key שדלף ב-account משותף מגיע ל-prod, ל-dev ול-data lake בבת אחת. Account נפרד הוא קיר אמיתי — גישה בין accounts חייבת להינתן במפורש בשני הצדדים.</li>
<li><strong>Quotas הם per account per region</strong>: load test ב-"dev" מכלה את quota ה-vCPU המשותפת, את ה-concurrency של Lambda (ברירת מחדל 1,000) או rate limits של API — ו-prod לא יכול לעשות scale.</li>
<li><strong>IAM sprawl ומגבלות</strong>: ברירת מחדל 1,000 roles ל-account (אפשר להעלות ל-5,000), 10 managed policies ל-role, managed policy עד 6,144 תווים. מאות צוותים ב-account אחד זה policies מלאים ב-<code>Condition</code> על tags שאף אחד לא מסוגל לעשות להם audit.</li>
<li><strong>Billing</strong>: account הוא גבול העלות הכי נקי. Tags תמיד חסרים; עלות ברמת account מדויקת ב-100%.</li>
<li><strong>Compliance scope</strong>: שמים workloads של PCI ב-accounts משלהם ורק הם נכנסים ל-scope של ה-audit.</li>
</ul>
<p>המבנה הנפוץ: account לכל <strong>workload × environment</strong> (<code>payments-prod</code>, <code>payments-staging</code>), ועוד accounts משותפים של הפלטפורמה. חברות עם 50 מהנדסים מריצות לרוב 20-40 accounts; ארגונים גדולים מריצים אלפים.</p>
<blockquote>💡 Real world: AWS Organizations מתחיל עם quota ברירת מחדל של 10 accounts ל-org — תבקש הגדלה כבר ביום הראשון, account vending יגיע לזה מהר.</blockquote>`
      }
    },
    {
      h: { en: "AWS: Organizations, OUs, SCPs, Control Tower", he: "AWS: Organizations, OUs, SCPs, Control Tower" },
      body: {
        en: `<p>The <strong>management account</strong> owns the org and billing — run no workloads in it. Accounts are grouped into <strong>OUs</strong> (nesting up to 5 levels): typically <code>Security</code>, <code>Infrastructure</code>, <code>Workloads/Prod</code>, <code>Workloads/NonProd</code>, <code>Sandbox</code>, <code>Suspended</code>.</p>
<p><strong>SCPs</strong> are permission ceilings on every principal in member accounts, including the account root user. They grant nothing; they only cap. They do <em>not</em> apply to the management account or to service-linked roles. Max 5,120 characters per SCP, up to 5 attached per OU/account.</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyOutsideApprovedRegions",
      "Effect": "Deny",
      "NotAction": ["iam:*", "organizations:*", "sts:*", "route53:*",
                    "cloudfront:*", "support:*", "budgets:*", "ce:*"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:RequestedRegion": ["eu-central-1", "il-central-1"] },
        "ArnNotLike": { "aws:PrincipalARN": "arn:aws:iam::*:role/OrgBreakGlass" }
      }
    },
    {
      "Sid": "DenyLeaveOrgAndTamperLogs",
      "Effect": "Deny",
      "Action": ["organizations:LeaveOrganization",
                 "cloudtrail:StopLogging", "cloudtrail:DeleteTrail",
                 "guardduty:DeleteDetector", "config:StopConfigurationRecorder"],
      "Resource": "*"
    }
  ]
}</pre>
<p>Global services (IAM, STS, Route 53, CloudFront...) live in us-east-1 endpoints, hence the <code>NotAction</code> — forget it and the region deny breaks IAM. Newer: <strong>RCPs</strong> (resource control policies) cap what <em>resources</em> allow, e.g. "no S3 bucket in the org can be read by principals outside the org".</p>
<p><strong>Control Tower</strong> packages this: creates the org with a Security OU containing <strong>Log Archive</strong> and <strong>Audit</strong> accounts, an org CloudTrail, AWS Config, IAM Identity Center, and <em>controls</em> — preventive (SCPs), detective (Config rules), proactive (CloudFormation hooks). <strong>Account Factory</strong> (or <strong>AFT</strong>, Account Factory for Terraform) vends new accounts from a request.</p>`,
        he: `<p>ה-<strong>management account</strong> הוא הבעלים של ה-org וה-billing — לא מריצים בו workloads. Accounts מקובצים ל-<strong>OUs</strong> (קינון עד 5 רמות): בדרך כלל <code>Security</code>, <code>Infrastructure</code>, <code>Workloads/Prod</code>, <code>Workloads/NonProd</code>, <code>Sandbox</code>, <code>Suspended</code>.</p>
<p><strong>SCPs</strong> הם תקרת הרשאות על כל principal ב-member accounts, כולל ה-root user של ה-account. הם לא נותנים כלום; רק מגבילים. הם <em>לא</em> חלים על ה-management account ולא על service-linked roles. עד 5,120 תווים ל-SCP, עד 5 מחוברים ל-OU/account.</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyOutsideApprovedRegions",
      "Effect": "Deny",
      "NotAction": ["iam:*", "organizations:*", "sts:*", "route53:*",
                    "cloudfront:*", "support:*", "budgets:*", "ce:*"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:RequestedRegion": ["eu-central-1", "il-central-1"] },
        "ArnNotLike": { "aws:PrincipalARN": "arn:aws:iam::*:role/OrgBreakGlass" }
      }
    },
    {
      "Sid": "DenyLeaveOrgAndTamperLogs",
      "Effect": "Deny",
      "Action": ["organizations:LeaveOrganization",
                 "cloudtrail:StopLogging", "cloudtrail:DeleteTrail",
                 "guardduty:DeleteDetector", "config:StopConfigurationRecorder"],
      "Resource": "*"
    }
  ]
}</pre>
<p>שירותים גלובליים (IAM, STS, Route 53, CloudFront...) יושבים על endpoints ב-us-east-1, ולכן ה-<code>NotAction</code> — אם תשכח אותו, ה-deny על regions ישבור את IAM. חדש יותר: <strong>RCPs</strong> (resource control policies) מגבילים מה ה-<em>resources</em> מאפשרים, למשל "אף S3 bucket ב-org לא ניתן לקריאה ע"י principals מחוץ ל-org".</p>
<p><strong>Control Tower</strong> אורז את כל זה: יוצר את ה-org עם Security OU שמכיל accounts של <strong>Log Archive</strong> ו-<strong>Audit</strong>, CloudTrail ברמת ה-org, AWS Config, IAM Identity Center, ו-<em>controls</em> — preventive (SCPs), detective (Config rules), proactive (CloudFormation hooks). <strong>Account Factory</strong> (או <strong>AFT</strong>, Account Factory for Terraform) מנפיק accounts חדשים מבקשה.</p>`
      }
    },
    {
      h: { en: "Azure and GCP equivalents", he: "המקבילות ב-Azure וב-GCP" },
      body: {
        en: `<table>
<tr><th>Concept</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Top</td><td>Organization (management account)</td><td>Entra tenant, Tenant Root Group</td><td>Organization (tied to a domain)</td></tr>
<tr><td>Grouping</td><td>OUs (5 levels)</td><td>Management groups (6 levels below root)</td><td>Folders (up to 10 levels)</td></tr>
<tr><td>Isolation unit</td><td>Account</td><td>Subscription (then resource groups)</td><td>Project</td></tr>
<tr><td>Guardrails</td><td>SCPs, RCPs</td><td>Azure Policy (deny, audit, modify, deployIfNotExists)</td><td>Organization Policy constraints</td></tr>
<tr><td>Blueprint</td><td>Control Tower / LZA</td><td>Azure Landing Zones (CAF accelerator)</td><td>Cloud Foundation / Terraform example foundation</td></tr>
</table>
<p><strong>Azure Landing Zones</strong> hierarchy: <code>Platform</code> (Identity, Management, Connectivity subscriptions), <code>Landing Zones</code> (Corp = private, Online = internet-facing), <code>Sandbox</code>, <code>Decommissioned</code>. Azure Policy is more than deny: <code>deployIfNotExists</code> auto-remediates, e.g. "every VNet must send diagnostics to the central Log Analytics workspace".</p>
<pre># Azure: only allow two regions under the Landing Zones MG
az policy assignment create --name allowed-locations \\
  --scope /providers/Microsoft.Management/managementGroups/landingzones \\
  --policy e56962a6-4747-49cd-b67b-bf8b01975c4c \\
  --params '{"listOfAllowedLocations":{"value":["westeurope","israelcentral"]}}'

# GCP: org policies on a folder
gcloud resource-manager org-policies enable-enforce \\
  iam.disableServiceAccountKeyCreation --folder=123456789
gcloud org-policies set-policy restrict-locations.yaml   # constraints/gcp.resourceLocations</pre>
<blockquote>⚠️ Production tip: in GCP, <code>iam.disableServiceAccountKeyCreation</code> at the org level is one of the highest-value single settings — downloadable JSON SA keys are the GCP equivalent of leaked AWS access keys.</blockquote>`,
        he: `<table>
<tr><th>מושג</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>הקודקוד</td><td>Organization (management account)</td><td>Entra tenant, Tenant Root Group</td><td>Organization (קשור ל-domain)</td></tr>
<tr><td>קיבוץ</td><td>OUs (5 רמות)</td><td>Management groups (6 רמות מתחת ל-root)</td><td>Folders (עד 10 רמות)</td></tr>
<tr><td>יחידת בידוד</td><td>Account</td><td>Subscription (ואז resource groups)</td><td>Project</td></tr>
<tr><td>Guardrails</td><td>SCPs, RCPs</td><td>Azure Policy (deny, audit, modify, deployIfNotExists)</td><td>Organization Policy constraints</td></tr>
<tr><td>Blueprint</td><td>Control Tower / LZA</td><td>Azure Landing Zones (CAF accelerator)</td><td>Cloud Foundation / Terraform example foundation</td></tr>
</table>
<p>ההיררכיה של <strong>Azure Landing Zones</strong>: <code>Platform</code> (subscriptions של Identity, Management, Connectivity), <code>Landing Zones</code> (Corp = פרטי, Online = פונה לאינטרנט), <code>Sandbox</code>, <code>Decommissioned</code>. Azure Policy זה יותר מ-deny: <code>deployIfNotExists</code> מתקן אוטומטית, למשל "כל VNet חייב לשלוח diagnostics ל-Log Analytics workspace המרכזי".</p>
<pre># Azure: only allow two regions under the Landing Zones MG
az policy assignment create --name allowed-locations \\
  --scope /providers/Microsoft.Management/managementGroups/landingzones \\
  --policy e56962a6-4747-49cd-b67b-bf8b01975c4c \\
  --params '{"listOfAllowedLocations":{"value":["westeurope","israelcentral"]}}'

# GCP: org policies on a folder
gcloud resource-manager org-policies enable-enforce \\
  iam.disableServiceAccountKeyCreation --folder=123456789
gcloud org-policies set-policy restrict-locations.yaml   # constraints/gcp.resourceLocations</pre>
<blockquote>⚠️ Production tip: ב-GCP, <code>iam.disableServiceAccountKeyCreation</code> ברמת ה-org הוא אחת ההגדרות הבודדות עם הערך הכי גבוה — מפתחות JSON של SA שאפשר להוריד הם המקבילה ב-GCP ל-AWS access keys שדלפו.</blockquote>`
      }
    },
    {
      h: { en: "Account vending, shared accounts and the network hub", he: "Account vending, accounts משותפים וה-network hub" },
      body: {
        en: `<p><strong>Account vending</strong>: a team opens a PR (or a portal form) → pipeline creates the account in the right OU, sets the alternate contacts, applies a baseline (Terraform): budget alarm, default-VPC deletion, IAM Identity Center permission sets, GuardDuty/Security Hub enrollment, VPC attached to the hub, and DNS delegation. Target: <strong>new account in under an hour, zero tickets</strong>.</p>
<pre># AFT-style request (terraform)
module "payments_prod" {
  source = "./modules/aft-account-request"
  control_tower_parameters = {
    AccountEmail              = "aws+payments-prod@acme.io"
    AccountName               = "payments-prod"
    ManagedOrganizationalUnit = "Workloads/Prod"
    SSOUserEmail              = "platform@acme.io"
  }
  account_tags = { team = "payments", env = "prod", cost-center = "cc-4410" }
}</pre>
<p><strong>Shared platform accounts</strong>:</p>
<ul>
<li><strong>Log Archive</strong>: org CloudTrail, Config, VPC Flow Logs into S3 with Object Lock; almost nobody can log in.</li>
<li><strong>Security / Audit</strong>: delegated admin for GuardDuty, Security Hub, IAM Access Analyzer, Inspector — security sees every account without being org admin.</li>
<li><strong>Network</strong>: Transit Gateway (shared via RAM) or Cloud WAN, central egress with NAT + firewall, inspection VPC, Route 53 Resolver rules for hybrid DNS, Direct Connect / VPN to on-prem. Azure: hub-spoke or Virtual WAN in the Connectivity subscription. GCP: Shared VPC host project, service projects attach to it.</li>
<li><strong>Shared services</strong>: CI runners, artifact registry, central observability.</li>
</ul>
<blockquote>💡 Real world: plan a non-overlapping IP space (IPAM) <em>before</em> vending account #5. Two VPCs both on 10.0.0.0/16 can never be peered or attached to the same TGW route table without NAT gymnastics.</blockquote>`,
        he: `<p><strong>Account vending</strong>: צוות פותח PR (או טופס בפורטל) → pipeline יוצר את ה-account ב-OU הנכון, מגדיר alternate contacts, מחיל baseline (Terraform): budget alarm, מחיקת ה-default VPC, permission sets של IAM Identity Center, רישום ל-GuardDuty/Security Hub, חיבור VPC ל-hub, ו-DNS delegation. היעד: <strong>account חדש בפחות משעה, אפס tickets</strong>.</p>
<pre># AFT-style request (terraform)
module "payments_prod" {
  source = "./modules/aft-account-request"
  control_tower_parameters = {
    AccountEmail              = "aws+payments-prod@acme.io"
    AccountName               = "payments-prod"
    ManagedOrganizationalUnit = "Workloads/Prod"
    SSOUserEmail              = "platform@acme.io"
  }
  account_tags = { team = "payments", env = "prod", cost-center = "cc-4410" }
}</pre>
<p><strong>Accounts משותפים של הפלטפורמה</strong>:</p>
<ul>
<li><strong>Log Archive</strong>: CloudTrail של ה-org, Config, VPC Flow Logs לתוך S3 עם Object Lock; כמעט אף אחד לא יכול להתחבר אליו.</li>
<li><strong>Security / Audit</strong>: delegated admin ל-GuardDuty, Security Hub, IAM Access Analyzer, Inspector — צוות האבטחה רואה כל account בלי להיות admin של ה-org.</li>
<li><strong>Network</strong>: Transit Gateway (משותף דרך RAM) או Cloud WAN, egress מרכזי עם NAT + firewall, inspection VPC, Route 53 Resolver rules ל-DNS היברידי, Direct Connect / VPN ל-on-prem. ב-Azure: hub-spoke או Virtual WAN ב-subscription של Connectivity. ב-GCP: host project של Shared VPC, ו-service projects מתחברים אליו.</li>
<li><strong>Shared services</strong>: CI runners, artifact registry, observability מרכזי.</li>
</ul>
<blockquote>💡 Real world: תתכנן מרחב IP בלי חפיפות (IPAM) <em>לפני</em> שאתה מנפיק את account מספר 5. שני VPCs שניהם על 10.0.0.0/16 לא יוכלו אף פעם לעשות peering או להתחבר לאותה TGW route table בלי אקרובטיקות של NAT.</blockquote>`
      }
    },
    {
      h: { en: "Human access: SSO and break-glass", he: "גישה לבני אדם: SSO ו-break-glass" },
      body: {
        en: `<p><strong>IAM Identity Center</strong> (formerly AWS SSO) federates with your IdP (Entra ID, Okta, Google) via SAML + SCIM. You define <strong>permission sets</strong> (e.g. <code>ReadOnly</code>, <code>PowerUser</code>, <code>PaymentsAdmin</code>) and assign <em>group × permission set × account</em>. Each login yields 1-12 hour role credentials; no IAM users, no long-lived keys.</p>
<pre>$ aws configure sso   # once
$ aws sso login --profile payments-prod-ro
$ aws sts get-caller-identity --profile payments-prod-ro
{
  "Account": "210987654321",
  "Arn": "arn:aws:sts::210987654321:assumed-role/AWSReservedSSO_ReadOnly_3f2a.../dana@acme.io"
}</pre>
<p><strong>Break-glass</strong>: if the IdP is down or misconfigured, SSO is down too. Keep 2 emergency principals (IAM users with hardware MFA, or a dedicated role) in the management account, credentials split and sealed, excluded from the SCP region-deny via the <code>ArnNotLike</code> condition above. Alert on <em>every</em> use (EventBridge rule on <code>ConsoleLogin</code> for those identities → page security), and test them twice a year.</p>
<blockquote>⚠️ Production tip: secure the root user of every member account — Organizations now supports centrally managing root access (remove root credentials from member accounts and perform privileged root tasks from the management account). An unmonitored root password reset on a forgotten account is a classic takeover path.</blockquote>`,
        he: `<p><strong>IAM Identity Center</strong> (לשעבר AWS SSO) מתחבר ל-IdP שלך (Entra ID, Okta, Google) דרך SAML + SCIM. מגדירים <strong>permission sets</strong> (למשל <code>ReadOnly</code>, <code>PowerUser</code>, <code>PaymentsAdmin</code>) ומשייכים <em>group × permission set × account</em>. כל login נותן credentials של role ל-1 עד 12 שעות; בלי IAM users, בלי מפתחות ארוכי-חיים.</p>
<pre>$ aws configure sso   # once
$ aws sso login --profile payments-prod-ro
$ aws sts get-caller-identity --profile payments-prod-ro
{
  "Account": "210987654321",
  "Arn": "arn:aws:sts::210987654321:assumed-role/AWSReservedSSO_ReadOnly_3f2a.../dana@acme.io"
}</pre>
<p><strong>Break-glass</strong>: אם ה-IdP נפל או הוגדר לא נכון, גם ה-SSO נפל. שומרים 2 principals לחירום (IAM users עם MFA חומרתי, או role ייעודי) ב-management account, עם credentials מפוצלים וחתומים, ומוחרגים מה-deny על regions ב-SCP דרך תנאי ה-<code>ArnNotLike</code> שלמעלה. מתריעים על <em>כל</em> שימוש (EventBridge rule על <code>ConsoleLogin</code> לזהויות האלה → page לאבטחה), ובודקים אותם פעמיים בשנה.</p>
<blockquote>⚠️ Production tip: תאבטח את ה-root user של כל member account — Organizations תומך היום בניהול מרכזי של root access (הסרת root credentials מ-member accounts וביצוע פעולות root מוגנות מה-management account). איפוס סיסמת root בלי ניטור על account נשכח הוא נתיב השתלטות קלאסי.</blockquote>`
      }
    }
  ],
  diagram: "Organization (management account: billing, org, SSO — no workloads)\n├── OU Security ........ Log Archive | Audit/Security tooling\n├── OU Infrastructure .. Network (TGW, egress, DNS) | Shared services (CI, registry)\n├── OU Workloads\n│   ├── OU Prod ........ payments-prod | search-prod   <- strict SCPs\n│   └── OU NonProd ..... payments-stg  | search-dev\n├── OU Sandbox ......... dev-dana | dev-omer          <- budget caps, auto-nuke\n└── OU Suspended ....... closed accounts (deny-all SCP)",
  handsOn: [
    { cmd: "aws organizations list-roots && aws organizations list-organizational-units-for-parent --parent-id r-ab12", what: { en: "Explore your org structure: the root and the OUs under it.", he: "לחקור את מבנה ה-org: ה-root וה-OUs שמתחתיו." } },
    { cmd: "aws organizations list-policies-for-target --target-id 210987654321 --filter SERVICE_CONTROL_POLICY", what: { en: "See which SCPs directly apply to an account (remember OU-inherited ones too).", he: "לראות אילו SCPs חלים ישירות על account (ולזכור גם את אלה שעוברים בירושה מה-OU)." } },
    { cmd: "aws ec2 run-instances --region us-west-2 --image-id ami-0abc --instance-type t3.micro --dry-run", what: { en: "Verify the region-deny SCP: expect an explicit deny in a service control policy error.", he: "לאמת את ה-SCP של deny על regions: מצפים לשגיאה של explicit deny in a service control policy." } },
    { cmd: "az account management-group list -o table && gcloud resource-manager folders list --organization=ORG_ID", what: { en: "Same idea on Azure (management groups) and GCP (folders).", he: "אותו רעיון ב-Azure (management groups) וב-GCP (folders)." } }
  ],
  mnemonic: {
    en: "ORG-LOG-NET-SSO-GLASS: Org with guardrails, Log archive, Network hub, SSO for humans, Glass to break in emergencies.",
    he: "ORG-LOG-NET-SSO-GLASS: org עם guardrails, log archive, network hub, SSO לבני אדם, וזכוכית לשבור בחירום."
  },
  pitfalls: [
    { en: "Running workloads in the management account. SCPs don't apply there, so it's the one account your guardrails can't protect.", he: "להריץ workloads ב-management account. SCPs לא חלים עליו, אז זה בדיוק ה-account היחיד שה-guardrails לא מגנים עליו." },
    { en: "A region-deny SCP without NotAction for global services — IAM, STS and Route 53 calls start failing everywhere.", he: "SCP של deny על regions בלי NotAction לשירותים גלובליים — קריאות IAM, STS ו-Route 53 מתחילות להיכשל בכל מקום." },
    { en: "Attaching a brand-new SCP to the Prod OU first. Roll it out like code: Sandbox → NonProd → Prod, and check CloudTrail for denies in between.", he: "לחבר SCP חדש לגמרי קודם ל-OU של Prod. מגלגלים אותו כמו קוד: Sandbox → NonProd → Prod, ובודקים ב-CloudTrail שגיאות deny בין לבין." },
    { en: "Overlapping CIDRs across vended accounts. Fixing IP plans after 40 VPCs exist is a multi-quarter migration.", he: "CIDRs חופפים בין accounts שהונפקו. תיקון תוכנית IP אחרי ש-40 VPCs כבר קיימים זו מיגרציה של כמה רבעונים." }
  ],
  interview: [
    {
      q: { en: "An SCP allows s3:*, but the user's IAM policy has no S3 permissions. Can the user read S3?", he: "SCP מאפשר s3:*, אבל ל-IAM policy של המשתמש אין הרשאות S3. האם המשתמש יכול לקרוא מ-S3?" },
      a: { en: "No. SCPs never grant; they define the maximum. Effective permission is the intersection of SCP (and boundaries) with an explicit Allow in an identity or resource policy. An explicit Deny anywhere wins.", he: "לא. SCPs אף פעם לא נותנים הרשאה; הם מגדירים את המקסימום. ההרשאה בפועל היא החיתוך בין ה-SCP (וה-boundaries) לבין Allow מפורש ב-identity policy או resource policy. Deny מפורש בכל מקום מנצח." }
    },
    {
      q: { en: "Design the account structure for a 60-engineer startup moving to a landing zone.", he: "תתכנן את מבנה ה-accounts לסטארטאפ של 60 מהנדסים שעובר ל-landing zone." },
      a: { en: "Management (billing/SSO only), Security OU with Log Archive + Security tooling, Infrastructure OU with Network (TGW, egress) + Shared Services (CI, ECR), Workloads OU split Prod/NonProd with one account per product per env, Sandbox OU with budgets. IAM Identity Center with 3-4 permission sets mapped to IdP groups, SCPs for region lock and log protection, vending via Terraform/AFT, IPAM-planned CIDRs, break-glass in management.", he: "Management (רק billing/SSO), Security OU עם Log Archive + כלי אבטחה, Infrastructure OU עם Network (TGW, egress) + Shared Services (CI, ECR), Workloads OU מפוצל ל-Prod/NonProd עם account לכל מוצר לכל סביבה, Sandbox OU עם budgets. IAM Identity Center עם 3-4 permission sets ממופים לקבוצות ב-IdP, SCPs לנעילת regions והגנה על לוגים, vending דרך Terraform/AFT, CIDRs מתוכננים עם IPAM, ו-break-glass ב-management." }
    }
  ],
  quiz: [
    {
      q: { en: "Which statement about AWS SCPs is correct?", he: "איזו טענה על SCPs ב-AWS נכונה?" },
      options: [
        { en: "They grant permissions to all users in an OU", he: "הם נותנים הרשאות לכל המשתמשים ב-OU" },
        { en: "They cap permissions in member accounts, including the root user, but don't apply to the management account", he: "הם מגבילים הרשאות ב-member accounts, כולל ה-root user, אבל לא חלים על ה-management account" },
        { en: "They only apply to IAM users, not roles", he: "הם חלים רק על IAM users, לא על roles" },
        { en: "They can be overridden by an AdministratorAccess policy", he: "AdministratorAccess policy יכול לעקוף אותם" }
      ],
      answer: 1,
      explain: { en: "SCPs are ceilings: they never grant, they apply to every principal in member accounts (root included), and an admin policy can't exceed them. The management account is exempt — keep workloads out of it.", he: "SCPs הם תקרה: הם אף פעם לא נותנים הרשאה, חלים על כל principal ב-member accounts (כולל root), ו-policy של admin לא יכול לחרוג מהם. ה-management account פטור — אל תשים בו workloads." }
    },
    {
      q: { en: "Why does a region-deny SCP usually use NotAction for iam:*, sts:*, route53:*, cloudfront:*?", he: "למה SCP של deny על regions בדרך כלל משתמש ב-NotAction ל-iam:*, sts:*, route53:*, cloudfront:*?" },
      options: [
        { en: "Those services are free", he: "השירותים האלה בחינם" },
        { en: "They are global services whose calls resolve to us-east-1, so the deny would break them", he: "אלה שירותים גלובליים שהקריאות שלהם מגיעות ל-us-east-1, כך שה-deny היה שובר אותם" },
        { en: "SCPs can't reference them", he: "SCPs לא יכולים להתייחס אליהם" },
        { en: "To allow developers to create IAM users freely", he: "כדי לאפשר למפתחים ליצור IAM users בחופשיות" }
      ],
      answer: 1,
      explain: { en: "Global services are served from us-east-1 endpoints. Without the exemption, aws:RequestedRegion won't match your allowed list and IAM/STS calls get denied.", he: "שירותים גלובליים מוגשים מ-endpoints ב-us-east-1. בלי ההחרגה, aws:RequestedRegion לא יתאים לרשימה המותרת וקריאות IAM/STS ייחסמו." }
    },
    {
      q: { en: "What is the Azure equivalent of AWS OUs + SCPs?", he: "מה המקבילה ב-Azure ל-OUs + SCPs של AWS?" },
      options: [
        { en: "Resource groups + NSGs", he: "Resource groups + NSGs" },
        { en: "Management groups + Azure Policy", he: "Management groups + Azure Policy" },
        { en: "Subscriptions + Key Vault", he: "Subscriptions + Key Vault" },
        { en: "Entra ID groups + Conditional Access", he: "קבוצות Entra ID + Conditional Access" }
      ],
      answer: 1,
      explain: { en: "Management groups organize subscriptions hierarchically; Azure Policy assigned at a management group is inherited and can deny, audit or auto-remediate (deployIfNotExists).", he: "Management groups מארגנים subscriptions בהיררכיה; Azure Policy שמשויך ל-management group עובר בירושה ויכול לעשות deny, audit או תיקון אוטומטי (deployIfNotExists)." }
    },
    {
      q: { en: "Your IdP (Okta) is down and production is burning. How do engineers get into AWS?", he: "ה-IdP (Okta) נפל והפרודקשן בוער. איך המהנדסים נכנסים ל-AWS?" },
      options: [
        { en: "They can't until Okta recovers", he: "הם לא יכולים עד ש-Okta יחזור" },
        { en: "Through pre-provisioned, alarmed break-glass identities with hardware MFA", he: "דרך זהויות break-glass שהוכנו מראש, עם התראות ו-MFA חומרתי" },
        { en: "Using the root user of each workload account", he: "עם ה-root user של כל account של workload" },
        { en: "Create new IAM users from the CLI", he: "ליצור IAM users חדשים מה-CLI" }
      ],
      answer: 1,
      explain: { en: "Break-glass exists exactly for IdP failure. It's sealed, MFA-protected, alerted on every use, and tested regularly — not a daily login.", he: "Break-glass קיים בדיוק בשביל נפילה של ה-IdP. הוא חתום, מוגן ב-MFA, מתריע על כל שימוש ונבדק באופן קבוע — לא login יומיומי." }
    }
  ],
  related: ["cloud-iam-security", "cloud-finops", "net-vpc", "cloud-iac", "staff-cells-blast-radius", "staff-terraform-at-scale"]
});

window.INFRA.lessons.push({
  id: "arch-feature-flags",
  track: "architecture",
  order: 51,
  icon: "🚩",
  level: 2,
  minutes: 13,
  title: { en: "Feature Flags & Progressive Delivery", he: "Feature Flags ו-Progressive Delivery" },
  tldr: {
    en: "Deploy puts code on servers; release turns behavior on for users. Feature flags split the two, so you can ship dark, roll out 1% → 100% with consistent bucketing, kill a broken feature in seconds without a rollback — as long as you evaluate locally, default safely, and delete flags when they're done.",
    he: "Deploy שם קוד על השרתים; release מדליק התנהגות למשתמשים. Feature flags מפרידים בין השניים, כך שאפשר לשחרר קוד כבוי, לעשות rollout מ-1% ל-100% עם bucketing עקבי, ולכבות פיצ'ר שבור תוך שניות בלי rollback — כל עוד עושים evaluation מקומי, בוחרים default בטוח, ומוחקים flags כשסיימו איתם."
  },
  analogy: {
    en: "Deploying is wiring a new room into the house; the flag is the light switch on the wall. The electrician (deploy) can finish on Tuesday, and you flip the switch (release) on Thursday for one room, then the whole floor. If it sparks, you flip it off — no need to rip out the wiring. But a house with 400 unlabeled switches, half of them connected to nothing, is how someone flips the wrong one.",
    he: "Deploy זה לחווט חדר חדש בבית; ה-flag הוא מתג האור על הקיר. החשמלאי (deploy) יכול לסיים ביום שלישי, ואתה מדליק את המתג (release) ביום חמישי לחדר אחד, ואחר כך לכל הקומה. אם יש ניצוצות, מכבים — לא צריך לעקור את החיווט. אבל בית עם 400 מתגים בלי תווית, שחצי מהם לא מחוברים לכלום, זה בדיוק איך מישהו מדליק את הלא נכון."
  },
  sections: [
    {
      h: { en: "Release ≠ deploy, and the four flag types", he: "Release ≠ deploy, וארבעה סוגי flags" },
      body: {
        en: `<p>Without flags, every deploy is a release: the riskiest moment (new code under real traffic) is also the hardest to undo (rollback = another deploy, 5-30 minutes). With flags, code ships <strong>dark</strong> and exposure becomes a runtime config change measured in seconds.</p>
<table>
<tr><th>Type</th><th>Purpose</th><th>Lifetime</th><th>Example</th></tr>
<tr><td><strong>Release</strong></td><td>Hide unfinished work, progressive rollout</td><td>Days-weeks, then delete</td><td><code>new-checkout-flow</code></td></tr>
<tr><td><strong>Ops / kill switch</strong></td><td>Turn off expensive or risky paths under load or during incidents</td><td>Long-lived, intentionally</td><td><code>disable-recommendations</code></td></tr>
<tr><td><strong>Experiment</strong></td><td>A/B test with metrics per variant</td><td>Until statistical significance</td><td><code>pricing-page-v3</code> (A/B/C)</td></tr>
<tr><td><strong>Permission / entitlement</strong></td><td>Plan tiers, beta programs, per-tenant features</td><td>Long-lived (arguably product config)</td><td><code>sso-enabled</code> for Enterprise</td></tr>
</table>
<p>Name the type in the flag metadata. Release flags that live for a year are debt; kill switches that disappear are a missing safety net.</p>`,
        he: `<p>בלי flags, כל deploy הוא release: הרגע הכי מסוכן (קוד חדש מול traffic אמיתי) הוא גם הכי קשה לביטול (rollback = עוד deploy, 5-30 דקות). עם flags, הקוד יוצא <strong>כבוי</strong> (dark) והחשיפה הופכת לשינוי config בזמן ריצה שנמדד בשניות.</p>
<table>
<tr><th>סוג</th><th>מטרה</th><th>אורך חיים</th><th>דוגמה</th></tr>
<tr><td><strong>Release</strong></td><td>להסתיר עבודה לא גמורה, rollout הדרגתי</td><td>ימים-שבועות, ואז מוחקים</td><td><code>new-checkout-flow</code></td></tr>
<tr><td><strong>Ops / kill switch</strong></td><td>לכבות מסלולים יקרים או מסוכנים תחת עומס או בזמן incident</td><td>ארוך, בכוונה</td><td><code>disable-recommendations</code></td></tr>
<tr><td><strong>Experiment</strong></td><td>A/B test עם מטריקות לכל variant</td><td>עד מובהקות סטטיסטית</td><td><code>pricing-page-v3</code> (A/B/C)</td></tr>
<tr><td><strong>Permission / entitlement</strong></td><td>שכבות תמחור, תוכניות beta, פיצ'רים לפי tenant</td><td>ארוך (בעצם product config)</td><td><code>sso-enabled</code> ל-Enterprise</td></tr>
</table>
<p>תרשום את הסוג ב-metadata של ה-flag. Release flags שחיים שנה הם חוב; kill switches שנעלמים הם רשת ביטחון חסרה.</p>`
      }
    },
    {
      h: { en: "Evaluation: server vs client SDKs, local evaluation, streaming", he: "Evaluation: SDK בשרת מול לקוח, evaluation מקומי, streaming" },
      body: {
        en: `<p><strong>Server-side SDKs</strong> (backend services) download the full ruleset at startup and keep it in memory; a <strong>streaming</strong> connection (SSE/gRPC) pushes changes in ~100-500 ms. Every <code>isEnabled()</code> call is a local in-memory lookup — microseconds, no network hop, and it keeps working if the flag service goes down (last-known rules).</p>
<p><strong>Client-side SDKs</strong> (browser, mobile) must <em>not</em> receive the full ruleset — it would leak targeting rules ("users in segment acquisition-target-acme"). They send the user context to an edge/relay and receive only the evaluated values for that user.</p>
<pre># OpenFeature (vendor-neutral API), Python, provider = flagd / LaunchDarkly / Unleash...
from openfeature import api
from openfeature.evaluation_context import EvaluationContext

client = api.get_client("checkout")
ctx = EvaluationContext(targeting_key=user.id,
                        attributes={"country": "IL", "plan": "pro"})
if client.get_boolean_value("new-checkout-flow", False, ctx):   # False = safe default
    return new_checkout(cart)
return legacy_checkout(cart)</pre>
<p>flagd config (JSON, can live in git / a ConfigMap):</p>
<pre>{
  "flags": {
    "new-checkout-flow": {
      "state": "ENABLED",
      "variants": { "on": true, "off": false },
      "defaultVariant": "off",
      "targeting": { "fractional": [ ["on", 10], ["off", 90] ] }
    }
  }
}</pre>
<blockquote>⚠️ Production tip: the default value in code is what users get when the SDK can't initialize. For a release flag, default to the <em>old</em> behavior. For a kill switch named <code>disable-x</code>, default to "not disabled" — and decide deliberately.</blockquote>`,
        he: `<p><strong>SDKs בצד השרת</strong> (שירותי backend) מורידים את כל ה-ruleset בעלייה ומחזיקים אותו בזיכרון; חיבור <strong>streaming</strong> (SSE/gRPC) דוחף שינויים תוך בערך 100-500 ms. כל קריאה ל-<code>isEnabled()</code> היא lookup מקומי בזיכרון — מיקרו-שניות, בלי hop ברשת, וממשיכה לעבוד אם שירות ה-flags נפל (החוקים האחרונים הידועים).</p>
<p><strong>SDKs בצד הלקוח</strong> (דפדפן, מובייל) <em>לא</em> צריכים לקבל את כל ה-ruleset — זה היה מדליף חוקי targeting ("משתמשים ב-segment acquisition-target-acme"). הם שולחים את ה-context של המשתמש ל-edge/relay ומקבלים רק את הערכים המחושבים למשתמש הזה.</p>
<pre># OpenFeature (vendor-neutral API), Python, provider = flagd / LaunchDarkly / Unleash...
from openfeature import api
from openfeature.evaluation_context import EvaluationContext

client = api.get_client("checkout")
ctx = EvaluationContext(targeting_key=user.id,
                        attributes={"country": "IL", "plan": "pro"})
if client.get_boolean_value("new-checkout-flow", False, ctx):   # False = safe default
    return new_checkout(cart)
return legacy_checkout(cart)</pre>
<p>Config של flagd (JSON, יכול לשבת ב-git / ב-ConfigMap):</p>
<pre>{
  "flags": {
    "new-checkout-flow": {
      "state": "ENABLED",
      "variants": { "on": true, "off": false },
      "defaultVariant": "off",
      "targeting": { "fractional": [ ["on", 10], ["off", 90] ] }
    }
  }
}</pre>
<blockquote>⚠️ Production tip: ערך ה-default בקוד הוא מה שמשתמשים מקבלים כשה-SDK לא מצליח לעלות. ב-release flag, ה-default הוא ההתנהגות ה<em>ישנה</em>. ב-kill switch בשם <code>disable-x</code>, ה-default הוא "לא מכובה" — ותחליט על זה במודע.</blockquote>`
      }
    },
    {
      h: { en: "Percentage rollouts and consistent bucketing", he: "Rollout באחוזים ו-bucketing עקבי" },
      body: {
        en: `<p><code>random() &lt; 0.10</code> is wrong: the same user flips between old and new on every request (cart disappears, UI flickers), and you can't attribute metrics. Instead, hash a stable key:</p>
<pre>import hashlib

def bucket(flag_key: str, user_id: str) -&gt; int:
    h = hashlib.sha256(f"{flag_key}:{user_id}".encode()).hexdigest()
    return int(h[:8], 16) % 100          # 0..99, uniform, deterministic

def is_on(flag_key, user_id, percent):
    return bucket(flag_key, user_id) &lt; percent</pre>
<ul>
<li><strong>Deterministic</strong>: user 42 always lands in the same bucket — no flicker, every server agrees with no shared state.</li>
<li><strong>Monotonic ramp</strong>: going 10% → 25% keeps the first 10% in and adds buckets 10-24. Nobody who had the feature loses it.</li>
<li><strong>Salt with the flag key</strong>: otherwise the same 1% of users are guinea pigs for every flag.</li>
<li><strong>Choose the unit</strong>: <code>user_id</code> for UX, <code>tenant_id</code> for B2B (the whole company sees the same thing), <code>request_id</code> only for stateless backend changes.</li>
</ul>
<p>A typical progressive schedule: internal staff → 1% → 5% → 25% → 50% → 100%, holding each step long enough to see p99 latency, error rate and business KPIs per variant. Tools automate the gates: LaunchDarkly guarded releases, Unleash gradual rollout, Argo Rollouts / Flagger for traffic-level canaries.</p>`,
        he: `<p><code>random() &lt; 0.10</code> זה לא נכון: אותו משתמש קופץ בין ישן לחדש בכל בקשה (העגלה נעלמת, ה-UI מהבהב), ואי אפשר לשייך מטריקות. במקום זה עושים hash למפתח יציב:</p>
<pre>import hashlib

def bucket(flag_key: str, user_id: str) -&gt; int:
    h = hashlib.sha256(f"{flag_key}:{user_id}".encode()).hexdigest()
    return int(h[:8], 16) % 100          # 0..99, uniform, deterministic

def is_on(flag_key, user_id, percent):
    return bucket(flag_key, user_id) &lt; percent</pre>
<ul>
<li><strong>דטרמיניסטי</strong>: משתמש 42 תמיד נוחת באותו bucket — בלי הבהובים, וכל השרתים מסכימים בלי state משותף.</li>
<li><strong>Ramp מונוטוני</strong>: מעבר מ-10% ל-25% משאיר את ה-10% הראשונים בפנים ומוסיף את buckets 10-24. אף אחד שקיבל את הפיצ'ר לא מאבד אותו.</li>
<li><strong>Salt עם מפתח ה-flag</strong>: אחרת אותו 1% של משתמשים הם שפני ניסיון בכל flag.</li>
<li><strong>לבחור את היחידה</strong>: <code>user_id</code> ל-UX, <code>tenant_id</code> ל-B2B (כל החברה רואה אותו דבר), <code>request_id</code> רק לשינויי backend stateless.</li>
</ul>
<p>לוח זמנים הדרגתי טיפוסי: עובדים פנימיים → 1% → 5% → 25% → 50% → 100%, ומחזיקים כל שלב מספיק זמן כדי לראות p99 latency, error rate ו-KPIs עסקיים לכל variant. הכלים ממכנים את השערים: guarded releases ב-LaunchDarkly, gradual rollout ב-Unleash, Argo Rollouts / Flagger ל-canaries ברמת ה-traffic.</p>`
      }
    },
    {
      h: { en: "Tools, flags in incidents, and flag debt", he: "כלים, flags ב-incidents, וחוב של flags" },
      body: {
        en: `<ul>
<li><strong>LaunchDarkly</strong>: SaaS, streaming SDKs in ~30 languages, relay proxy for air-gapped/edge, experimentation, audit log, code references.</li>
<li><strong>Unleash</strong>: open source (self-host or cloud), strategies (gradual rollout, user IDs, IPs), Unleash Edge for scale.</li>
<li><strong>flagd + OpenFeature</strong>: CNCF; OpenFeature is the vendor-neutral SDK API, flagd a lightweight evaluator reading JSON from files, ConfigMaps or HTTP. Swap providers without touching call sites.</li>
<li>Cloud-native: AWS AppConfig feature flags, Azure App Configuration, Firebase Remote Config.</li>
</ul>
<p><strong>Flags as incident mitigation</strong>: the fastest mitigation in most runbooks is "turn off the flag" — seconds, no build, no deploy pipeline, no image pull. Put kill switches on every heavy dependency (recommendations, search suggestions, third-party fraud scoring) so you can <em>degrade gracefully</em> under load. Link the flag in the alert's runbook.</p>
<p><strong>Flag debt</strong>: every flag doubles the number of code paths. 10 independent booleans = 1,024 combinations; you'll never test them all. Hygiene:</p>
<ul>
<li>Each release flag gets an owner and an expiry date at creation; CI fails or a bot opens a cleanup PR after it passes.</li>
<li>Track "flags at 100% for &gt; 30 days" and "flags not evaluated in 7 days" (most tools expose this).</li>
<li>Test the two states that matter: all flags at their current prod values, and each new flag flipped. Avoid flags that depend on other flags.</li>
<li>Removing a flag is a deploy: delete the old branch of code, not just the flag in the UI.</li>
</ul>
<blockquote>💡 Real world: Knight Capital, 1 August 2012. A new order router reused an old flag that once enabled "Power Peg", a test algorithm dead since 2003. The deploy reached 7 of 8 servers; on the 8th, the flag switched on the dead code, which bought high and sold low in a loop. <strong>$440 million lost in 45 minutes</strong>; the firm was sold within months. Lessons: never repurpose a flag, delete dead code behind old flags, verify deploys across all hosts, and have a kill switch that actually stops trading.</blockquote>`,
        he: `<ul>
<li><strong>LaunchDarkly</strong>: SaaS, SDKs עם streaming בכ-30 שפות, relay proxy לסביבות air-gapped/edge, experimentation, audit log, code references.</li>
<li><strong>Unleash</strong>: קוד פתוח (self-host או cloud), אסטרטגיות (gradual rollout, user IDs, IPs), Unleash Edge ל-scale.</li>
<li><strong>flagd + OpenFeature</strong>: CNCF; OpenFeature הוא API ניטרלי ל-SDK, ו-flagd הוא evaluator קליל שקורא JSON מקבצים, ConfigMaps או HTTP. מחליפים provider בלי לגעת בקוד שקורא ל-flags.</li>
<li>מנוהל בענן: AWS AppConfig feature flags, Azure App Configuration, Firebase Remote Config.</li>
</ul>
<p><strong>Flags כ-mitigation ב-incident</strong>: ה-mitigation הכי מהיר ברוב ה-runbooks הוא "לכבות את ה-flag" — שניות, בלי build, בלי deploy pipeline, בלי image pull. שים kill switch על כל תלות כבדה (recommendations, search suggestions, fraud scoring של צד שלישי) כדי שתוכל <em>להתדרדר בחן</em> תחת עומס. תקשר את ה-flag ב-runbook של ההתראה.</p>
<p><strong>חוב של flags</strong>: כל flag מכפיל את מספר מסלולי הקוד. 10 booleans בלתי תלויים = 1,024 צירופים; לעולם לא תבדוק את כולם. היגיינה:</p>
<ul>
<li>לכל release flag יש owner ותאריך תפוגה כבר ביצירה; ה-CI נכשל או בוט פותח PR לניקוי אחרי שהתאריך עבר.</li>
<li>עוקבים אחרי "flags על 100% יותר מ-30 יום" ו-"flags שלא נקראו 7 ימים" (רוב הכלים חושפים את זה).</li>
<li>בודקים את שני המצבים שחשובים: כל ה-flags בערכי ה-prod הנוכחיים, וכל flag חדש הפוך. נמנעים מ-flags שתלויים ב-flags אחרים.</li>
<li>הסרת flag היא deploy: מוחקים את הענף הישן בקוד, לא רק את ה-flag ב-UI.</li>
</ul>
<blockquote>💡 Real world: Knight Capital, 1 באוגוסט 2012. order router חדש עשה שימוש חוזר ב-flag ישן שפעם הדליק את "Power Peg", אלגוריתם בדיקות מת מ-2003. ה-deploy הגיע ל-7 מתוך 8 שרתים; בשמיני, ה-flag הדליק את הקוד המת, שקנה ביוקר ומכר בזול בלולאה. <strong>440 מיליון דולר הפסד ב-45 דקות</strong>; החברה נמכרה תוך חודשים. הלקחים: לעולם לא למחזר flag, למחוק קוד מת מאחורי flags ישנים, לוודא deploy על כל השרתים, ולהחזיק kill switch שבאמת עוצר את המסחר.</blockquote>`
      }
    }
  ],
  diagram: "Flag service (UI/API, audit log)\n      |  streaming (SSE) ruleset updates, ~200 ms\n      v\n[svc A: SDK in-memory rules] [svc B: SDK in-memory rules]   <- evaluate locally, µs\n      ^\n      |  user context -> evaluated values only\n[Relay / Edge] <--- browser & mobile client SDKs\n\nbucket = hash(flag_key + ':' + user_id) mod 100 ; on if bucket < rollout%",
  handsOn: [
    { cmd: "docker run --rm -p 8013:8013 -v $PWD/flags.json:/flags.json ghcr.io/open-feature/flagd:latest start --uri file:/flags.json", what: { en: "Run flagd locally against a JSON flag file (edit the file, flagd hot-reloads it).", he: "להריץ flagd מקומית מול קובץ JSON של flags (עורכים את הקובץ, flagd טוען מחדש)." } },
    { cmd: "curl -s -X POST localhost:8013/flagd.evaluation.v1.Service/ResolveBoolean -H 'Content-Type: application/json' -d '{\"flagKey\":\"new-checkout-flow\",\"context\":{\"targetingKey\":\"user-42\"}}'", what: { en: "Evaluate a flag for a specific user and see the variant and reason (e.g. TARGETING_MATCH).", he: "לחשב flag למשתמש מסוים ולראות את ה-variant ואת ה-reason (למשל TARGETING_MATCH)." } },
    { cmd: "python3 -c \"import hashlib;print(sorted(int(hashlib.sha256(f'f:{u}'.encode()).hexdigest()[:8],16)%100<10 for u in range(10000)).count(True))\"", what: { en: "Check that hash bucketing gives ~10% of 10,000 users for a 10% rollout.", he: "לבדוק ש-bucketing עם hash נותן בערך 10% מתוך 10,000 משתמשים ב-rollout של 10%." } },
    { cmd: "git grep -nE \"isEnabled|get_boolean_value|variation\\(\" | wc -l", what: { en: "Roughly count flag call sites in your codebase — a quick flag-debt indicator.", he: "לספור בערך את נקודות הקריאה ל-flags בקוד — אינדיקטור מהיר לחוב של flags." } }
  ],
  mnemonic: {
    en: "Deploy = install, Release = switch on. Hash, don't random. Default to old. Every flag has an owner and a funeral date.",
    he: "Deploy = התקנה, Release = הדלקה. Hash, לא random. Default לישן. לכל flag יש owner ותאריך הלוויה."
  },
  pitfalls: [
    { en: "Random per-request rollout: users flip between variants, sessions break, and A/B metrics are meaningless.", he: "Rollout רנדומלי לכל בקשה: משתמשים קופצים בין variants, sessions נשברים, ומטריקות A/B חסרות משמעות." },
    { en: "Calling the flag service over the network on every request — adds latency and makes it a hard dependency. Use SDKs with local evaluation.", he: "לקרוא לשירות ה-flags ברשת בכל בקשה — מוסיף latency והופך אותו לתלות קשיחה. משתמשים ב-SDKs עם evaluation מקומי." },
    { en: "Reusing an old flag name for new behavior (Knight Capital). Flags are cheap; create a new one.", he: "למחזר שם של flag ישן להתנהגות חדשה (Knight Capital). Flags זולים; תיצור חדש." },
    { en: "Shipping the whole ruleset to browsers, leaking customer segments and unreleased feature names.", he: "לשלוח את כל ה-ruleset לדפדפנים, ולהדליף segments של לקוחות ושמות של פיצ'רים שעוד לא יצאו." }
  ],
  interview: [
    {
      q: { en: "How do you make a 10% rollout sticky per user across 50 stateless servers?", he: "איך הופכים rollout של 10% לקבוע לכל משתמש על פני 50 שרתים stateless?" },
      a: { en: "Deterministic hashing: bucket = hash(flag_key + user_id) mod 100, on if bucket < 10. Every server computes the same answer with no shared state; increasing the percentage only adds buckets, and salting with the flag key decorrelates flags.", he: "Hashing דטרמיניסטי: bucket = hash(flag_key + user_id) mod 100, דלוק אם bucket < 10. כל שרת מחשב אותה תשובה בלי state משותף; העלאת האחוז רק מוסיפה buckets, וה-salt עם מפתח ה-flag מנתק בין flags." }
    },
    {
      q: { en: "Feature flags vs canary deployments — what's the difference?", he: "Feature flags מול canary deployments — מה ההבדל?" },
      a: { en: "A canary routes a share of traffic to a new binary version (infra level, all changes in that version together). A flag toggles one behavior inside the same binary, targetable by user/tenant, and flips back in seconds without redeploying. They complement each other: canary the binary, then flag-roll each feature.", he: "Canary מנתב חלק מה-traffic לגרסת binary חדשה (ברמת התשתית, כל השינויים בגרסה ביחד). Flag מדליק/מכבה התנהגות אחת בתוך אותו binary, עם targeting לפי משתמש/tenant, וחוזר אחורה בשניות בלי deploy. הם משלימים: canary ל-binary, ואז rollout עם flag לכל פיצ'ר." }
    }
  ],
  quiz: [
    {
      q: { en: "Why is hash(flag_key + user_id) mod 100 preferred over random() for percentage rollouts?", he: "למה hash(flag_key + user_id) mod 100 עדיף על random() ב-rollout באחוזים?" },
      options: [
        { en: "It's faster to compute", he: "הוא מהיר יותר לחישוב" },
        { en: "Each user consistently gets the same variant on every server, and ramping up never removes users", he: "כל משתמש מקבל באופן עקבי את אותו variant בכל שרת, והגדלת האחוז אף פעם לא מוציאה משתמשים" },
        { en: "It encrypts the user ID", he: "הוא מצפין את ה-user ID" },
        { en: "It guarantees exactly 10% of requests", he: "הוא מבטיח בדיוק 10% מהבקשות" }
      ],
      answer: 1,
      explain: { en: "Determinism gives stickiness without shared state; monotonic buckets mean 10% → 25% only adds users. Salting with the flag key keeps flags independent.", he: "דטרמיניזם נותן קביעות בלי state משותף; buckets מונוטוניים אומרים ש-10% → 25% רק מוסיף משתמשים. ה-salt עם מפתח ה-flag שומר על flags בלתי תלויים." }
    },
    {
      q: { en: "The flag service has a full outage. What happens to backend services using server SDKs with local evaluation?", he: "לשירות ה-flags יש השבתה מלאה. מה קורה לשירותי backend שמשתמשים ב-server SDKs עם evaluation מקומי?" },
      options: [
        { en: "They all fail requests", he: "כולם מכשילים בקשות" },
        { en: "They keep evaluating with the last-known rules; new pods without a cache fall back to code defaults", he: "הם ממשיכים לחשב עם החוקים האחרונים הידועים; pods חדשים בלי cache נופלים ל-defaults בקוד" },
        { en: "Every flag turns on", he: "כל ה-flags נדלקים" },
        { en: "They switch to random rollout", he: "הם עוברים ל-rollout רנדומלי" }
      ],
      answer: 1,
      explain: { en: "Rules live in memory; only updates stop. That's why code defaults must be safe — a freshly started pod during the outage sees only them.", he: "החוקים בזיכרון; רק העדכונים נעצרים. בגלל זה ה-defaults בקוד חייבים להיות בטוחים — pod שעלה בזמן ההשבתה רואה רק אותם." }
    },
    {
      q: { en: "What was the core flag-related failure at Knight Capital in 2012?", he: "מה היה הכשל המרכזי שקשור ל-flags ב-Knight Capital ב-2012?" },
      options: [
        { en: "The flag service was down", he: "שירות ה-flags היה למטה" },
        { en: "An old flag was repurposed, and one server missed the deploy, so the flag activated dead code", he: "flag ישן מוחזר לשימוש, ושרת אחד פספס את ה-deploy, כך שה-flag הפעיל קוד מת" },
        { en: "A/B test bucketing was random", he: "ה-bucketing של A/B היה רנדומלי" },
        { en: "Too many kill switches", he: "יותר מדי kill switches" }
      ],
      answer: 1,
      explain: { en: "Reused flag + incomplete deploy (7 of 8 servers) + dead code left behind = $440M lost in 45 minutes.", he: "Flag ממוחזר + deploy חלקי (7 מתוך 8 שרתים) + קוד מת שנשאר = 440 מיליון דולר ב-45 דקות." }
    },
    {
      q: { en: "Which flag type is SUPPOSED to be long-lived?", he: "איזה סוג flag אמור לחיות לאורך זמן?" },
      options: [
        { en: "Release flag for a new checkout", he: "Release flag ל-checkout חדש" },
        { en: "Ops kill switch that disables recommendations under load", he: "Ops kill switch שמכבה recommendations תחת עומס" },
        { en: "Experiment flag after the A/B test concluded", he: "Experiment flag אחרי שה-A/B test הסתיים" },
        { en: "A flag at 100% for six months", he: "Flag על 100% כבר חצי שנה" }
      ],
      answer: 1,
      explain: { en: "Kill switches are permanent safety valves for graceful degradation. Release and experiment flags should be deleted once rolled out or decided.", he: "Kill switches הם שסתומי ביטחון קבועים להתדרדרות מבוקרת. Release ו-experiment flags צריכים להימחק אחרי שה-rollout הסתיים או שהתקבלה החלטה." }
    }
  ],
  related: ["rel-deployments", "k8s-argo-rollouts", "cloud-cicd", "rel-incident-management", "arch-resilience"]
});

window.INFRA.lessons.push({
  id: "arch-service-discovery",
  track: "architecture",
  order: 52,
  icon: "🧭",
  level: 2,
  minutes: 13,
  title: { en: "Service Discovery", he: "Service Discovery" },
  tldr: {
    en: "Instances come and go and IPs change, so callers need a live, health-aware registry: DNS (watch the TTL and client caches), Consul, Kubernetes Services/EndpointSlices, Eureka, or a mesh control plane pushing endpoints over xDS. Most outages here come from stale endpoints, not from the registry itself.",
    he: "Instances עולים ויורדים וכתובות IP משתנות, אז מי שקורא צריך registry חי שמודע ל-health: DNS (שים לב ל-TTL ול-caches בצד הלקוח), Consul, Services/EndpointSlices של Kubernetes, Eureka, או control plane של mesh שדוחף endpoints ב-xDS. רוב התקלות כאן באות מ-endpoints ישנים, לא מה-registry עצמו."
  },
  analogy: {
    en: "Service discovery is the hospital switchboard. You don't memorize which doctor sits in which room today — you call 'cardiology' and the operator connects you to whoever is on shift and not in surgery (healthy). The danger isn't the switchboard; it's the nurse who wrote yesterday's room number on her hand and keeps walking into an empty room (stale cache).",
    he: "Service discovery זה המרכזייה של בית החולים. אתה לא זוכר באיזה חדר יושב כל רופא היום — אתה מבקש 'קרדיולוגיה' והמרכזנית מחברת אותך למי שבמשמרת ולא בניתוח (healthy). הסכנה היא לא המרכזייה; היא האחות שרשמה על היד את מספר החדר של אתמול וממשיכה להיכנס לחדר ריק (cache ישן)."
  },
  sections: [
    {
      h: { en: "The problem, and client-side vs server-side discovery", he: "הבעיה, ו-discovery בצד הלקוח מול בצד השרת" },
      body: {
        en: `<p>In a static world you put <code>10.0.3.17:8080</code> in a config file. In autoscaling groups, Kubernetes, spot instances and rolling deploys, an instance lives minutes to days and its IP is recycled. Discovery needs three parts: <strong>registration</strong> (who exists), <strong>health</strong> (who can take traffic), <strong>lookup</strong> (how callers find them).</p>
<table>
<tr><th></th><th>Client-side discovery</th><th>Server-side discovery</th></tr>
<tr><td>How</td><td>Client queries the registry, picks an instance, connects directly</td><td>Client calls a stable address (LB / VIP / proxy); it picks the instance</td></tr>
<tr><td>Examples</td><td>Eureka + Spring Cloud LoadBalancer, gRPC xDS (proxyless), Consul API in the client</td><td>AWS ALB/NLB target groups, Kubernetes ClusterIP via kube-proxy, sidecar proxy (Envoy)</td></tr>
<tr><td>Pros</td><td>No extra hop, smart LB (least-request, zone-aware)</td><td>Language-agnostic, clients stay dumb</td></tr>
<tr><td>Cons</td><td>A library per language, logic drifts between versions</td><td>Extra hop / component to scale and monitor</td></tr>
</table>
<p>A service mesh is the hybrid: the logic is client-side, but lives in a sidecar (or node proxy) instead of your code.</p>`,
        he: `<p>בעולם סטטי שמים <code>10.0.3.17:8080</code> בקובץ config. ב-autoscaling groups, Kubernetes, spot instances ו-rolling deploys, instance חי מדקות עד ימים וה-IP שלו ממוחזר. Discovery צריך שלושה חלקים: <strong>registration</strong> (מי קיים), <strong>health</strong> (מי יכול לקבל traffic), <strong>lookup</strong> (איך מי שקורא מוצא אותם).</p>
<table>
<tr><th></th><th>Discovery בצד הלקוח</th><th>Discovery בצד השרת</th></tr>
<tr><td>איך</td><td>הלקוח שואל את ה-registry, בוחר instance, ומתחבר ישירות</td><td>הלקוח קורא לכתובת יציבה (LB / VIP / proxy); היא בוחרת את ה-instance</td></tr>
<tr><td>דוגמאות</td><td>Eureka + Spring Cloud LoadBalancer, gRPC xDS (proxyless), Consul API בתוך הלקוח</td><td>target groups של AWS ALB/NLB, ClusterIP של Kubernetes דרך kube-proxy, sidecar proxy (Envoy)</td></tr>
<tr><td>יתרונות</td><td>בלי hop נוסף, LB חכם (least-request, מודע ל-zone)</td><td>לא תלוי שפה, הלקוחות נשארים "טיפשים"</td></tr>
<tr><td>חסרונות</td><td>ספרייה לכל שפה, הלוגיקה מתפצלת בין גרסאות</td><td>hop / רכיב נוסף שצריך לעשות לו scale ומוניטורינג</td></tr>
</table>
<p>Service mesh הוא ההיברידי: הלוגיקה בצד הלקוח, אבל יושבת ב-sidecar (או proxy ב-node) במקום בקוד שלך.</p>`
      }
    },
    {
      h: { en: "DNS-based discovery and its caching traps", he: "Discovery מבוסס DNS ומלכודות ה-caching שלו" },
      body: {
        en: `<p>DNS is universal — every language can resolve a name. But DNS was built for records that change daily, not every 30 seconds:</p>
<ul>
<li><strong>TTL is a request, not a guarantee</strong>: resolvers, OS caches (nscd, systemd-resolved) and language runtimes may hold records longer.</li>
<li><strong>JVM</strong>: <code>networkaddress.cache.ttl</code> defaults to 30 s in modern JDKs, but <em>forever</em> when a security manager is installed (older app servers). Negative answers are cached 10 s (<code>networkaddress.cache.negative.ttl</code>). AWS recommends ≤ 60 s.</li>
<li><strong>Connection pools ignore DNS</strong>: once a keep-alive / gRPC HTTP/2 connection is open, the client never re-resolves. New instances get no traffic; removed instances keep getting it until the TCP connection breaks. Fix: max connection age (<code>MAX_CONNECTION_AGE</code> on gRPC servers, pool max-lifetime).</li>
<li><strong>No health in plain DNS</strong>: a record stays until someone removes it. Route 53 health checks / Consul DNS fill this gap.</li>
<li><strong>Response size</strong>: classic UDP DNS answers are limited to 512 bytes without EDNS0; large A-record sets get truncated, so clients see only a subset.</li>
</ul>
<pre># JVM: set once at startup (or in $JAVA_HOME/conf/security/java.security)
java.security.Security.setProperty("networkaddress.cache.ttl", "30");

$ dig +noall +answer orders.internal.acme.io
orders.internal.acme.io. 30 IN A 10.0.1.14
orders.internal.acme.io. 30 IN A 10.0.2.31</pre>
<blockquote>⚠️ Production tip: in Kubernetes, the default <code>ndots:5</code> means <code>api.stripe.com</code> is tried as <code>api.stripe.com.prod.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> first — 3+ wasted queries per lookup. Use FQDNs with a trailing dot or lower ndots for heavy external callers.</blockquote>`,
        he: `<p>DNS הוא אוניברסלי — כל שפה יודעת לעשות resolve לשם. אבל DNS נבנה לרשומות שמשתנות פעם ביום, לא כל 30 שניות:</p>
<ul>
<li><strong>TTL הוא בקשה, לא הבטחה</strong>: resolvers, caches של מערכת ההפעלה (nscd, systemd-resolved) ו-runtimes של שפות עלולים להחזיק רשומות יותר זמן.</li>
<li><strong>JVM</strong>: <code>networkaddress.cache.ttl</code> הוא 30 שניות כברירת מחדל ב-JDKs מודרניים, אבל <em>לנצח</em> כשמותקן security manager (app servers ישנים). תשובות שליליות נשמרות 10 שניות (<code>networkaddress.cache.negative.ttl</code>). AWS ממליצים על 60 שניות או פחות.</li>
<li><strong>Connection pools מתעלמים מ-DNS</strong>: ברגע שחיבור keep-alive / gRPC HTTP/2 פתוח, הלקוח לא עושה resolve מחדש. Instances חדשים לא מקבלים traffic; instances שהוסרו ממשיכים לקבל עד שחיבור ה-TCP נשבר. התיקון: גיל מקסימלי לחיבור (<code>MAX_CONNECTION_AGE</code> בשרתי gRPC, max-lifetime ב-pool).</li>
<li><strong>אין health ב-DNS רגיל</strong>: רשומה נשארת עד שמישהו מוחק אותה. health checks של Route 53 / Consul DNS ממלאים את הפער.</li>
<li><strong>גודל תשובה</strong>: תשובת DNS קלאסית ב-UDP מוגבלת ל-512 בתים בלי EDNS0; סט גדול של A records נחתך, והלקוחות רואים רק חלק.</li>
</ul>
<pre># JVM: set once at startup (or in $JAVA_HOME/conf/security/java.security)
java.security.Security.setProperty("networkaddress.cache.ttl", "30");

$ dig +noall +answer orders.internal.acme.io
orders.internal.acme.io. 30 IN A 10.0.1.14
orders.internal.acme.io. 30 IN A 10.0.2.31</pre>
<blockquote>⚠️ Production tip: ב-Kubernetes, ברירת המחדל <code>ndots:5</code> אומרת ש-<code>api.stripe.com</code> נבדק קודם כ-<code>api.stripe.com.prod.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> — 3 שאילתות מבוזבזות ויותר לכל lookup. תשתמש ב-FQDN עם נקודה בסוף או תוריד את ndots לשירותים שקוראים הרבה החוצה.</blockquote>`
      }
    },
    {
      h: { en: "Consul and Eureka", he: "Consul ו-Eureka" },
      body: {
        en: `<p><strong>Consul</strong>: a Raft cluster of 3 or 5 servers holds the <strong>catalog</strong>; an agent on every node registers local services and runs their <strong>health checks</strong> (HTTP, TCP, gRPC, TTL, script). Only passing instances are returned by queries. Lookup via HTTP API or the built-in <strong>DNS interface</strong> on port 8600.</p>
<pre>service {
  name = "orders"
  port = 8080
  tags = ["v2"]
  check {
    http     = "http://localhost:8080/healthz"
    interval = "10s"
    timeout  = "2s"
    deregister_critical_service_after = "1m"
  }
}

$ dig @127.0.0.1 -p 8600 orders.service.consul SRV +short
1 1 8080 0a000114.addr.dc1.consul.
1 1 8080 0a00021f.addr.dc1.consul.

$ curl -s 'localhost:8500/v1/health/service/orders?passing' | jq '.[].Service.Address'</pre>
<p>Consul DNS defaults to TTL 0 for service records (no caching), which is accurate but puts every lookup on the agent — tune <code>dns_config.service_ttl</code> for hot paths.</p>
<p><strong>Eureka</strong> (Netflix, Spring Cloud): instances register and send a heartbeat every <strong>30 s</strong>; the lease expires after <strong>90 s</strong> without one; clients cache the registry and refresh every 30 s. Worst case a dead instance is still handed out for ~2-3 minutes — your client needs retries on another instance. <strong>Self-preservation mode</strong>: if heartbeats drop sharply (more than ~15% missing, typical of a network partition), Eureka stops expiring instances rather than wiping the registry — it favors availability (AP) over accuracy.</p>`,
        he: `<p><strong>Consul</strong>: cluster של Raft עם 3 או 5 שרתים מחזיק את ה-<strong>catalog</strong>; agent על כל node רושם את השירותים המקומיים ומריץ את ה-<strong>health checks</strong> שלהם (HTTP, TCP, gRPC, TTL, script). שאילתות מחזירות רק instances שעוברים. ה-lookup דרך HTTP API או דרך ה-<strong>DNS interface</strong> המובנה בפורט 8600.</p>
<pre>service {
  name = "orders"
  port = 8080
  tags = ["v2"]
  check {
    http     = "http://localhost:8080/healthz"
    interval = "10s"
    timeout  = "2s"
    deregister_critical_service_after = "1m"
  }
}

$ dig @127.0.0.1 -p 8600 orders.service.consul SRV +short
1 1 8080 0a000114.addr.dc1.consul.
1 1 8080 0a00021f.addr.dc1.consul.

$ curl -s 'localhost:8500/v1/health/service/orders?passing' | jq '.[].Service.Address'</pre>
<p>Consul DNS מחזיר כברירת מחדל TTL 0 לרשומות שירות (בלי caching), שזה מדויק אבל שם כל lookup על ה-agent — תכוונן את <code>dns_config.service_ttl</code> למסלולים חמים.</p>
<p><strong>Eureka</strong> (Netflix, Spring Cloud): instances נרשמים ושולחים heartbeat כל <strong>30 שניות</strong>; ה-lease פג אחרי <strong>90 שניות</strong> בלי heartbeat; הלקוחות מחזיקים cache של ה-registry ומרעננים כל 30 שניות. במקרה הגרוע instance מת עדיין מחולק כ-2-3 דקות — הלקוח שלך צריך retries ל-instance אחר. <strong>Self-preservation mode</strong>: אם ה-heartbeats צונחים בחדות (יותר מ-15% חסרים בערך, טיפוסי ל-network partition), Eureka מפסיק להפקיע instances במקום למחוק את ה-registry — הוא מעדיף זמינות (AP) על פני דיוק.</p>`
      }
    },
    {
      h: { en: "Kubernetes: Services, EndpointSlices, headless", he: "Kubernetes: Services, EndpointSlices, headless" },
      body: {
        en: `<p>Registration is automatic: the EndpointSlice controller watches pods matching a Service selector and lists those whose <strong>readiness probe</strong> passes. kube-proxy (iptables / IPVS / nftables) or Cilium eBPF programs the ClusterIP → pod IP mapping on every node. CoreDNS answers <code>orders.prod.svc.cluster.local</code> with the ClusterIP.</p>
<pre>$ kubectl get endpointslices -n prod -l kubernetes.io/service-name=orders
NAME           ADDRESSTYPE   PORTS   ENDPOINTS                      AGE
orders-7xk2p   IPv4          8080    10.0.1.14,10.0.2.31,10.0.3.9   12d

$ kubectl get endpointslice orders-7xk2p -n prod -o yaml | grep -A3 conditions
  conditions:
    ready: false
    serving: true
    terminating: true      # pod is shutting down, draining</pre>
<p>EndpointSlices hold up to 100 endpoints each by default, so a 5,000-pod Service updates small slices instead of one giant Endpoints object pushed to every node.</p>
<p><strong>Headless Service</strong> (<code>clusterIP: None</code>): no VIP; DNS returns the pod IPs directly (A records per ready pod), and with a StatefulSet each pod gets a stable name — <code>kafka-0.kafka.prod.svc.cluster.local</code>. Used for databases, Kafka, Cassandra, and for client-side load balancing of gRPC (which otherwise pins to one pod through a ClusterIP).</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: kafka, namespace: prod }
spec:
  clusterIP: None
  selector: { app: kafka }
  ports: [{ name: broker, port: 9092 }]
  publishNotReadyAddresses: true   # peers must find each other before ready</pre>`,
        he: `<p>ה-registration אוטומטי: ה-EndpointSlice controller עוקב אחרי pods שתואמים ל-selector של ה-Service ומונה את אלה שה-<strong>readiness probe</strong> שלהם עובר. kube-proxy (iptables / IPVS / nftables) או תוכניות eBPF של Cilium מתכנתים את המיפוי ClusterIP → pod IP על כל node. CoreDNS עונה על <code>orders.prod.svc.cluster.local</code> עם ה-ClusterIP.</p>
<pre>$ kubectl get endpointslices -n prod -l kubernetes.io/service-name=orders
NAME           ADDRESSTYPE   PORTS   ENDPOINTS                      AGE
orders-7xk2p   IPv4          8080    10.0.1.14,10.0.2.31,10.0.3.9   12d

$ kubectl get endpointslice orders-7xk2p -n prod -o yaml | grep -A3 conditions
  conditions:
    ready: false
    serving: true
    terminating: true      # pod is shutting down, draining</pre>
<p>כל EndpointSlice מחזיק עד 100 endpoints כברירת מחדל, כך ש-Service עם 5,000 pods מעדכן slices קטנים במקום אובייקט Endpoints ענק שנדחף לכל node.</p>
<p><strong>Headless Service</strong> (<code>clusterIP: None</code>): בלי VIP; ה-DNS מחזיר ישירות את כתובות ה-pods (A record לכל pod שהוא ready), ועם StatefulSet כל pod מקבל שם יציב — <code>kafka-0.kafka.prod.svc.cluster.local</code>. משתמשים בזה לדאטהבייסים, Kafka, Cassandra, ול-load balancing בצד הלקוח של gRPC (שאחרת נצמד ל-pod אחד דרך ClusterIP).</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: kafka, namespace: prod }
spec:
  clusterIP: None
  selector: { app: kafka }
  ports: [{ name: broker, port: 9092 }]
  publishNotReadyAddresses: true   # peers must find each other before ready</pre>`
      }
    },
    {
      h: { en: "Mesh xDS, AWS Cloud Map, and stale-endpoint failures", he: "xDS של mesh, AWS Cloud Map, וכשלים של endpoints ישנים" },
      body: {
        en: `<p><strong>xDS</strong> is Envoy's discovery API family: LDS (listeners), RDS (routes), CDS (clusters), <strong>EDS</strong> (endpoints). Istiod (or Consul, Linkerd's destination service in its own protocol) watches Kubernetes/registries and <em>pushes</em> endpoint changes to every proxy over a long-lived gRPC stream — no polling, no DNS TTL. gRPC clients can speak xDS directly ("proxyless").</p>
<pre>$ istioctl proxy-config endpoints deploy/checkout -n prod --cluster "outbound|8080||orders.prod.svc.cluster.local"
ENDPOINT          STATUS      OUTLIER CHECK   CLUSTER
10.0.1.14:8080    HEALTHY     OK              outbound|8080||orders.prod...
10.0.2.31:8080    HEALTHY     EJECTED         outbound|8080||orders.prod...</pre>
<p><strong>AWS Cloud Map</strong>: a registry for ECS, EKS, EC2 and Lambda resources. Namespaces are DNS-public, DNS-private (Route 53 records) or HTTP-only (query via <code>DiscoverInstances</code> API, no DNS caching issues). ECS Service Connect builds on it. Health via Route 53 health checks (public) or custom health status reported by your code.</p>
<p><strong>Stale-endpoint failure modes</strong> (the real outages):</p>
<ul>
<li><strong>Termination race</strong>: pod gets SIGTERM and exits while kube-proxy on other nodes still routes to it → 502s on every deploy. Fix: <code>preStop: sleep 5-10</code>, keep serving during drain, honor <code>terminationGracePeriodSeconds</code>.</li>
<li><strong>Zombie registration</strong>: process deadlocked but the agent's TCP check passes. Health checks must exercise the app (HTTP <code>/healthz</code> hitting the request path), not just the port.</li>
<li><strong>Deregistration never happens</strong>: VM killed without cleanup → registry entry stays until TTL/lease expiry (Eureka 90 s; Consul <code>deregister_critical_service_after</code>).</li>
<li><strong>IP reuse</strong>: a stale cache points at an IP now owned by a <em>different</em> service. With mTLS + identity checks the call fails safely; without it, you may write to the wrong system.</li>
<li><strong>Registry outage</strong>: clients must keep their last-known list (Eureka client cache, Envoy keeps endpoints) rather than empty it — fail static, not fail closed.</li>
</ul>
<blockquote>💡 Real world: outlier detection (Envoy ejects an endpoint after N consecutive 5xx) plus retries to a different host covers the window between "instance died" and "registry noticed" — discovery is eventually consistent, so your clients must be resilient.</blockquote>`,
        he: `<p><strong>xDS</strong> היא משפחת ה-APIs של Envoy ל-discovery: LDS (listeners), RDS (routes), CDS (clusters), <strong>EDS</strong> (endpoints). Istiod (או Consul; ה-destination service של Linkerd בפרוטוקול משלו) עוקב אחרי Kubernetes/registries ו<em>דוחף</em> שינויי endpoints לכל proxy על stream של gRPC ארוך-חיים — בלי polling, בלי DNS TTL. לקוחות gRPC יכולים לדבר xDS ישירות ("proxyless").</p>
<pre>$ istioctl proxy-config endpoints deploy/checkout -n prod --cluster "outbound|8080||orders.prod.svc.cluster.local"
ENDPOINT          STATUS      OUTLIER CHECK   CLUSTER
10.0.1.14:8080    HEALTHY     OK              outbound|8080||orders.prod...
10.0.2.31:8080    HEALTHY     EJECTED         outbound|8080||orders.prod...</pre>
<p><strong>AWS Cloud Map</strong>: registry ל-resources של ECS, EKS, EC2 ו-Lambda. Namespaces הם DNS ציבורי, DNS פרטי (רשומות Route 53) או HTTP בלבד (שאילתה דרך ה-API <code>DiscoverInstances</code>, בלי בעיות של DNS caching). ECS Service Connect בנוי עליו. Health דרך health checks של Route 53 (ציבורי) או health status מותאם שהקוד שלך מדווח.</p>
<p><strong>כשלים של endpoints ישנים</strong> (התקלות האמיתיות):</p>
<ul>
<li><strong>מרוץ בסיום</strong>: pod מקבל SIGTERM ויוצא בזמן ש-kube-proxy על nodes אחרים עדיין מנתב אליו → 502 בכל deploy. התיקון: <code>preStop: sleep 5-10</code>, להמשיך לשרת בזמן ה-drain, לכבד את <code>terminationGracePeriodSeconds</code>.</li>
<li><strong>רישום זומבי</strong>: התהליך ב-deadlock אבל ה-TCP check של ה-agent עובר. Health checks צריכים להפעיל את האפליקציה (HTTP <code>/healthz</code> שעובר במסלול הבקשה), לא רק את הפורט.</li>
<li><strong>Deregistration שלא קורה</strong>: VM נהרג בלי ניקוי → הרשומה ב-registry נשארת עד שה-TTL/lease פג (Eureka 90 שניות; ב-Consul <code>deregister_critical_service_after</code>).</li>
<li><strong>מחזור IP</strong>: cache ישן מצביע על IP ששייך עכשיו לשירות <em>אחר</em>. עם mTLS + בדיקת identity הקריאה נכשלת בבטחה; בלי זה, אתה עלול לכתוב למערכת הלא נכונה.</li>
<li><strong>השבתה של ה-registry</strong>: הלקוחות צריכים לשמור את הרשימה האחרונה הידועה (cache של לקוח Eureka, Envoy שומר endpoints) ולא לרוקן אותה — fail static, לא fail closed.</li>
</ul>
<blockquote>💡 Real world: outlier detection (Envoy מוציא endpoint אחרי N שגיאות 5xx ברצף) יחד עם retries ל-host אחר מכסים את החלון שבין "ה-instance מת" לבין "ה-registry שם לב" — discovery הוא eventually consistent, אז הלקוחות שלך חייבים להיות עמידים.</blockquote>`
      }
    }
  ],
  diagram: "        register + health checks\n[orders pod/VM] ---------------------> [Registry: Consul / k8s API+EndpointSlices / Eureka / Cloud Map]\n                                               |                     |\n                              DNS (TTL!)  -----+                     +----- push (xDS EDS)\n                                  |                                         |\n[client A: resolves name, caches IPs]                    [Envoy sidecar: live endpoint list]\n                                                                            |\n                                                         [client B -> localhost -> healthy pod]",
  handsOn: [
    { cmd: "kubectl get endpointslices -A -l kubernetes.io/service-name=kube-dns -o wide", what: { en: "See the real pod IPs behind a Service and their readiness.", he: "לראות את כתובות ה-pods האמיתיות מאחורי Service ואת ה-readiness שלהן." } },
    { cmd: "kubectl run -it --rm dns --image=busybox:1.36 --restart=Never -- nslookup kafka.prod.svc.cluster.local", what: { en: "Compare a normal Service (one ClusterIP) with a headless one (one A record per pod).", he: "להשוות Service רגיל (ClusterIP אחד) ל-headless (A record לכל pod)." } },
    { cmd: "consul agent -dev & consul services register -name=web -port=8080 && dig @127.0.0.1 -p 8600 web.service.consul SRV", what: { en: "Run a dev Consul agent, register a service and query it via the DNS interface.", he: "להריץ Consul agent במצב dev, לרשום שירות ולשאול עליו דרך ה-DNS interface." } },
    { cmd: "java -XshowSettings:properties -version 2>&1 | grep -i security; grep -n networkaddress $JAVA_HOME/conf/security/java.security", what: { en: "Find your JVM's DNS cache TTL settings.", he: "למצוא את הגדרות ה-TTL של DNS cache ב-JVM שלך." } }
  ],
  mnemonic: {
    en: "Register, Check, Find — and never trust a cached IP: TTL lies, pools don't re-resolve, and dead pods still get traffic until someone drains them.",
    he: "Register, Check, Find — ואף פעם לא לסמוך על IP מה-cache: ה-TTL משקר, pools לא עושים resolve מחדש, ו-pods מתים עדיין מקבלים traffic עד שמישהו עושה להם drain."
  },
  pitfalls: [
    { en: "Health checks that only test the TCP port: deadlocked or dependency-broken instances stay registered and receive traffic.", he: "Health checks שבודקים רק את פורט ה-TCP: instances ב-deadlock או עם תלות שבורה נשארים רשומים ומקבלים traffic." },
    { en: "No preStop delay in Kubernetes: pods exit before every node's kube-proxy removes them, causing 502 spikes on each rollout.", he: "בלי השהיית preStop ב-Kubernetes: pods יוצאים לפני ש-kube-proxy בכל node מסיר אותם, וזה יוצר קפיצות של 502 בכל rollout." },
    { en: "gRPC through a ClusterIP: HTTP/2 multiplexes on one connection, so all requests go to one pod. Use a headless Service + client-side LB, or a mesh.", he: "gRPC דרך ClusterIP: HTTP/2 מרבב על חיבור אחד, אז כל הבקשות הולכות ל-pod אחד. משתמשים ב-headless Service + LB בצד הלקוח, או ב-mesh." },
    { en: "Assuming DNS TTL 30 means clients switch in 30 s — JVM caches, OS caches and long-lived connections can stretch it to hours.", he: "להניח ש-DNS TTL של 30 אומר שהלקוחות מתחלפים תוך 30 שניות — caches של JVM, של מערכת ההפעלה וחיבורים ארוכים יכולים למתוח את זה לשעות." }
  ],
  interview: [
    {
      q: { en: "Client-side vs server-side discovery — when would you choose each?", he: "Discovery בצד הלקוח מול בצד השרת — מתי תבחר בכל אחד?" },
      a: { en: "Server-side (LB, ClusterIP) for polyglot fleets and simple clients — the cost is an extra hop and an LB to scale. Client-side (or a mesh sidecar) when you need smarter balancing (least-request, zone-aware), long-lived gRPC connections spread across pods, or the lowest latency. A mesh gives client-side behavior without per-language libraries.", he: "בצד השרת (LB, ClusterIP) לצי רב-שפתי וללקוחות פשוטים — המחיר הוא hop נוסף ו-LB שצריך לעשות לו scale. בצד הלקוח (או sidecar של mesh) כשצריך איזון חכם יותר (least-request, מודע ל-zone), פיזור חיבורי gRPC ארוכים בין pods, או latency מינימלי. Mesh נותן התנהגות של צד לקוח בלי ספרייה לכל שפה." }
    },
    {
      q: { en: "Every deploy causes a short burst of 502s from the ingress. What's happening?", he: "כל deploy גורם לפרץ קצר של 502 מה-ingress. מה קורה?" },
      a: { en: "A termination race: on SIGTERM the pod exits immediately, but endpoint removal propagates asynchronously to ingress controllers and kube-proxy on every node. Requests still routed to the old IP fail. Add a preStop sleep (5-10 s), keep serving in-flight and new requests while draining, and make sure the readiness probe fails fast on shutdown.", he: "מרוץ בסיום: ב-SIGTERM ה-pod יוצא מיד, אבל ההסרה מה-endpoints מתפשטת אסינכרונית ל-ingress controllers ול-kube-proxy בכל node. בקשות שעדיין מנותבות ל-IP הישן נכשלות. מוסיפים preStop sleep (5-10 שניות), ממשיכים לשרת בקשות קיימות וחדשות בזמן ה-drain, ומוודאים שה-readiness probe נכשל מהר בכיבוי." }
    }
  ],
  quiz: [
    {
      q: { en: "What does a headless Kubernetes Service (clusterIP: None) return from DNS?", he: "מה Kubernetes Service מסוג headless (clusterIP: None) מחזיר ב-DNS?" },
      options: [
        { en: "A single virtual IP handled by kube-proxy", he: "IP וירטואלי אחד שמטופל ע\"י kube-proxy" },
        { en: "The IPs of the ready pods directly", he: "את כתובות ה-pods שהם ready ישירות" },
        { en: "The node IPs", he: "את כתובות ה-nodes" },
        { en: "An external load balancer hostname", he: "hostname של load balancer חיצוני" }
      ],
      answer: 1,
      explain: { en: "No VIP: DNS returns A records per ready pod (and stable per-pod names with StatefulSets) — useful for stateful peers and client-side gRPC balancing.", he: "בלי VIP: ה-DNS מחזיר A record לכל pod שהוא ready (ושמות יציבים לכל pod עם StatefulSets) — שימושי ל-peers עם state ול-balancing של gRPC בצד הלקוח." }
    },
    {
      q: { en: "You changed a DNS record with TTL 60, but a Java service keeps hitting the old IP for hours. Most likely reason?", he: "שינית רשומת DNS עם TTL 60, אבל שירות Java ממשיך לפנות ל-IP הישן שעות. מה הסיבה הסבירה?" },
      options: [
        { en: "DNS propagation always takes hours", he: "התפשטות DNS תמיד לוקחת שעות" },
        { en: "JVM DNS caching (forever with a security manager) and/or pooled keep-alive connections that never re-resolve", he: "DNS caching של ה-JVM (לנצח עם security manager) ו/או חיבורי keep-alive ב-pool שאף פעם לא עושים resolve מחדש" },
        { en: "The TTL is in minutes, not seconds", he: "ה-TTL הוא בדקות, לא בשניות" },
        { en: "CoreDNS is down", he: "CoreDNS למטה" }
      ],
      answer: 1,
      explain: { en: "Runtimes and connection pools can ignore TTL. Set networkaddress.cache.ttl and cap connection lifetime so clients re-resolve.", he: "Runtimes ו-connection pools יכולים להתעלם מה-TTL. מגדירים networkaddress.cache.ttl ומגבילים את חיי החיבור כדי שהלקוחות יעשו resolve מחדש." }
    },
    {
      q: { en: "Eureka suddenly sees 40% of heartbeats missing. What does self-preservation mode do?", he: "Eureka פתאום רואה ש-40% מה-heartbeats חסרים. מה עושה self-preservation mode?" },
      options: [
        { en: "Deregisters all missing instances immediately", he: "מוחק מיד את כל ה-instances החסרים" },
        { en: "Stops expiring instances, assuming a network problem rather than mass death", he: "מפסיק להפקיע instances, בהנחה שזו בעיית רשת ולא מוות המוני" },
        { en: "Shuts down the registry", he: "מכבה את ה-registry" },
        { en: "Switches clients to DNS", he: "מעביר את הלקוחות ל-DNS" }
      ],
      answer: 1,
      explain: { en: "Eureka is AP: wiping the registry during a partition would be worse than serving a few stale entries. Clients compensate with retries.", he: "Eureka הוא AP: למחוק את ה-registry בזמן partition היה גרוע יותר מלהגיש כמה רשומות ישנות. הלקוחות מפצים עם retries." }
    },
    {
      q: { en: "How do service mesh proxies learn about endpoint changes?", he: "איך ה-proxies של service mesh לומדים על שינויים ב-endpoints?" },
      options: [
        { en: "They poll DNS every TTL", he: "הם עושים polling ל-DNS כל TTL" },
        { en: "The control plane pushes updates over xDS (EDS) on a streaming gRPC connection", he: "ה-control plane דוחף עדכונים ב-xDS (EDS) על חיבור gRPC עם streaming" },
        { en: "They read /etc/hosts", he: "הם קוראים את /etc/hosts" },
        { en: "Each proxy scans the pod network", he: "כל proxy סורק את רשת ה-pods" }
      ],
      answer: 1,
      explain: { en: "Istiod/Consul watch the registry and push EDS updates to every Envoy, avoiding DNS TTL entirely; outlier detection covers the remaining gap.", he: "Istiod/Consul עוקבים אחרי ה-registry ודוחפים עדכוני EDS לכל Envoy, ועוקפים את ה-DNS TTL לגמרי; outlier detection מכסה את הפער שנשאר." }
    }
  ],
  playground: "lb",
  related: ["k8s-services", "net-dns", "net-load-balancing", "staff-service-mesh", "k8s-probes", "arch-resilience"]
});

/* ---------------- Glossary ---------------- */
[
  ["Auto-unseal", "cloud",
   "Vault mode where a cloud KMS or HSM decrypts the root key at startup, so Vault restarts without humans entering Shamir unseal key shares.",
   "מצב של Vault שבו KMS בענן או HSM מפענח את ה-root key בעלייה, כך ש-Vault עולה מחדש בלי שבני אדם יזינו חלקי unseal key של Shamir.",
   "cloud-secrets-management"],
  ["Secret zero", "cloud",
   "The bootstrap problem: the first credential a workload needs to fetch all other secrets. Solved with platform identity (k8s ServiceAccount, IAM role, OIDC), not another static secret.",
   "בעיית ה-bootstrap: ה-credential הראשון ש-workload צריך כדי להביא את כל שאר הסודות. פותרים אותה עם identity של הפלטפורמה (k8s ServiceAccount, IAM role, OIDC), לא עם עוד secret סטטי.",
   "cloud-secrets-management"],
  ["Secret scanning", "cloud",
   "Automated detection of credentials in code, history and artifacts (gitleaks, GitHub secret scanning); push protection blocks the push before it lands.",
   "זיהוי אוטומטי של credentials בקוד, בהיסטוריה וב-artifacts (gitleaks, GitHub secret scanning); push protection חוסם את ה-push לפני שהוא נכנס.",
   "cloud-secrets-management"],
  ["Landing zone", "cloud",
   "A pre-configured multi-account cloud foundation: org hierarchy, guardrail policies, central logging/security accounts, networking hub, SSO and account vending.",
   "תשתית ענן מוגדרת מראש עם הרבה accounts: היררכיית org, guardrail policies, accounts מרכזיים ל-logging ואבטחה, network hub, SSO ו-account vending.",
   "cloud-landing-zones"],
  ["SCP (Service Control Policy)", "cloud",
   "AWS Organizations policy that sets the maximum permissions for every principal in member accounts (root included). Never grants; only caps.",
   "Policy של AWS Organizations שקובע את ההרשאות המקסימליות לכל principal ב-member accounts (כולל root). אף פעם לא נותן הרשאה; רק מגביל.",
   "cloud-landing-zones"],
  ["Account vending", "cloud",
   "Automated creation of a new cloud account/subscription/project with the org baseline (guardrails, SSO, logging, network) applied, from a request or PR.",
   "יצירה אוטומטית של cloud account/subscription/project חדש עם ה-baseline של ה-org (guardrails, SSO, logging, רשת), מתוך בקשה או PR.",
   "cloud-landing-zones"],
  ["Kill switch", "architecture",
   "A long-lived ops flag that disables a risky or expensive feature instantly during incidents or overload, for graceful degradation.",
   "Ops flag ארוך-חיים שמכבה מיד פיצ'ר מסוכן או יקר בזמן incident או עומס, להתדרדרות מבוקרת.",
   "arch-feature-flags"],
  ["Consistent bucketing", "architecture",
   "Assigning users to rollout buckets with hash(flag_key + user_id) mod 100, so each user always gets the same variant and ramps only add users.",
   "שיוך משתמשים ל-buckets של rollout עם hash(flag_key + user_id) mod 100, כך שכל משתמש מקבל תמיד את אותו variant והגדלה רק מוסיפה משתמשים.",
   "arch-feature-flags"],
  ["xDS", "architecture",
   "Envoy's family of discovery APIs (LDS, RDS, CDS, EDS) through which a mesh control plane pushes listeners, routes, clusters and endpoints to proxies over gRPC streams.",
   "משפחת ה-APIs של Envoy ל-discovery (LDS, RDS, CDS, EDS) שדרכה ה-control plane של mesh דוחף listeners, routes, clusters ו-endpoints ל-proxies על streams של gRPC.",
   "arch-service-discovery"],
  ["Self-preservation mode", "architecture",
   "Eureka behavior: when heartbeats drop sharply (likely a network partition), it stops expiring instances instead of wiping the registry — availability over accuracy.",
   "התנהגות של Eureka: כשה-heartbeats צונחים בחדות (כנראה network partition), הוא מפסיק להפקיע instances במקום למחוק את ה-registry — זמינות על פני דיוק.",
   "arch-service-discovery"],
  ["Headless Service", "kubernetes",
   "A Kubernetes Service with clusterIP: None; DNS returns the ready pod IPs directly (stable per-pod names with StatefulSets) instead of a virtual IP.",
   "Service של Kubernetes עם clusterIP: None; ה-DNS מחזיר ישירות את כתובות ה-pods שהם ready (שמות יציבים לכל pod עם StatefulSets) במקום IP וירטואלי.",
   "arch-service-discovery"]
].forEach(([term, track, en, he, lesson]) => window.INFRA.glossary.push({ term, track, def: { en, he }, lesson }));

/* ---------------- Scenario ---------------- */
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  window.INFRA.scenarios.push({
    id: "leaked-aws-key",
    icon: "🕵️",
    title: t("A key baked into a public Docker image — and a quiet S3 download", "מפתח שנאפה לתוך Docker image ציבורי — והורדה שקטה מ-S3"),
    start: "s1",
    steps: {
      s1: {
        text: t("Tuesday 14:05. No cost spike, no outage. GuardDuty raises a finding on the analytics account, and almost at the same time a security researcher emails that your public Docker Hub image acme/report-worker contains AWS credentials.",
                "יום שלישי 14:05. אין קפיצה בעלויות, אין תקלה. GuardDuty מעלה finding על ה-account של analytics, וכמעט באותו זמן חוקר אבטחה שולח מייל שה-image הציבורי שלכם ב-Docker Hub, acme/report-worker, מכיל AWS credentials."),
        data: `GuardDuty finding  severity: HIGH
  type: Exfiltration:S3/AnomalousBehavior
  principal: IAMUser/report-worker   accessKeyId: AKIAEXAMPLEREPORT01
  api: GetObject x 1,240   bucket: acme-customer-exports
  remoteIp: 45.83.x.x (AS: hosting provider, NL)   first seen 13:31 UTC`,
        choices: [
          c("Deactivate access key AKIAEXAMPLEREPORT01 right now (don't delete it yet)", "לבטל (deactivate) את ה-access key AKIAEXAMPLEREPORT01 עכשיו (לא למחוק עדיין)", "s2", 15,
            "Right: stop the bleeding first and keep the key ID so you can query logs by it.",
            "נכון: קודם עוצרים את הדימום ושומרים את מזהה המפתח כדי לחפש לפיו בלוגים."),
          c("Delete the image from Docker Hub first so nobody else can pull it", "קודם למחוק את ה-image מ-Docker Hub כדי שאף אחד אחר לא יוכל למשוך אותו", "s1b", -5,
            "The attacker already has the key — they're using it right now. Removing the image revokes nothing.",
            "לתוקף כבר יש את המפתח — הוא משתמש בו ממש עכשיו. מחיקת ה-image לא מבטלת כלום."),
          c("Watch for an hour to learn what the attacker is after", "לצפות שעה כדי להבין מה התוקף מחפש", "lose", -20,
            "Every minute is more customer data leaving. 'Observe the attacker' is for a mature SOC with containment ready, not for an open admin-ish key.",
            "כל דקה זה עוד מידע של לקוחות שיוצא. 'לצפות בתוקף' מתאים ל-SOC בוגר עם containment מוכן, לא למפתח פתוח עם הרשאות רחבות.")
        ]
      },
      s1b: {
        text: t("The image is gone, but GuardDuty keeps updating: GetObject count is now 2,010. The key is still active.",
                "ה-image נמחק, אבל GuardDuty ממשיך להתעדכן: מספר ה-GetObject עלה ל-2,010. המפתח עדיין פעיל."),
        choices: [
          c("Deactivate the key now", "לבטל את המפתח עכשיו", "s2", 5,
            "Late, but correct. Revocation is always step one.",
            "מאוחר, אבל נכון. Revoke הוא תמיד הצעד הראשון.")
        ]
      },
      s2: {
        text: t("Key is inactive and the GetObject calls stop. You pull CloudTrail for the key. Before the S3 reads, the attacker did a few things. What do you do?",
                "המפתח מבוטל וקריאות ה-GetObject נעצרות. אתה מושך את CloudTrail לפי המפתח. לפני הקריאות מ-S3, התוקף עשה כמה דברים. מה אתה עושה?"),
        data: `$ aws cloudtrail lookup-events --lookup-attributes \\
    AttributeKey=AccessKeyId,AttributeValue=AKIAEXAMPLEREPORT01 \\
    --query 'Events[].[EventTime,EventName]' --output text
13:29:12  GetCallerIdentity
13:29:40  ListBuckets
13:30:05  ListAttachedUserPolicies   (report-worker: AmazonS3FullAccess, IAMFullAccess)
13:30:51  CreateRole  name=lambda-metrics-sync  trust: arn:aws:iam::999988887777:root
13:30:58  AttachRolePolicy  AdministratorAccess
13:31:20  GetObject ... (x 2,010)`,
        choices: [
          c("Delete the backdoor role lambda-metrics-sync, then sweep the whole account/org for other new users, keys, roles and trust policies created by this key", "למחוק את ה-role הדלת האחורית lambda-metrics-sync, ואז לסרוק את כל ה-account/org ל-users, keys, roles ו-trust policies חדשים שהמפתח הזה יצר", "s3", 15,
            "Yes. A cross-account trust to an unknown account (999988887777) is persistence that survives revoking the original key.",
            "כן. Trust לחשבון לא מוכר (999988887777) הוא persistence ששורד את ביטול המפתח המקורי."),
          c("The key is revoked, so the incident is contained — move to the root cause", "המפתח בוטל, אז האירוע בשליטה — עוברים ל-root cause", "lose", -20,
            "The attacker can now assume lambda-metrics-sync with AdministratorAccess from their own account. You closed the front door and left the back door open.",
            "התוקף יכול עכשיו לעשות assume ל-lambda-metrics-sync עם AdministratorAccess מה-account שלו. סגרת את הדלת הראשית והשארת את האחורית פתוחה.")
        ]
      },
      s3: {
        text: t("Backdoor role removed; an org-wide Access Analyzer sweep finds nothing else external. How did the key end up in a public image?",
                "ה-role הדלת האחורית הוסר; סריקה של Access Analyzer בכל ה-org לא מוצאת עוד גישה חיצונית. איך המפתח הגיע ל-image ציבורי?"),
        data: `$ docker history --no-trunc acme/report-worker:2.3 | grep -i aws
<missing>  ENV AWS_ACCESS_KEY_ID=AKIAEXAMPLEREPORT01
<missing>  ENV AWS_SECRET_ACCESS_KEY=wJalr...REDACTED
# Dockerfile line 7, added 2023 "temporary, for local testing"
# image pushed by CI to docker.io/acme (repo visibility: public)`,
        choices: [
          c("Kill the IAM user model: run report-worker with an IAM role (IRSA / task role), add gitleaks + image secret scanning to CI, make the registry private", "לבטל את מודל ה-IAM user: להריץ את report-worker עם IAM role (IRSA / task role), להוסיף gitleaks וסריקת secrets ל-images ב-CI, ולהפוך את ה-registry לפרטי", "s4", 15,
            "You removed the class of bug, not just this instance: there's no long-lived key left to bake into anything.",
            "הסרת את סוג הבאג, לא רק את המקרה הזה: לא נשאר מפתח ארוך-חיים לאפות לתוך שום דבר."),
          c("Create a new access key for report-worker and pass it as a build arg instead", "ליצור access key חדש ל-report-worker ולהעביר אותו כ-build arg במקום", "s3b", -10,
            "Build args are recorded in image history too. Same leak, next quarter.",
            "Build args נרשמים גם הם בהיסטוריה של ה-image. אותה דליפה, ברבעון הבא.")
        ]
      },
      s3b: {
        text: t("A reviewer runs docker history on the new image and finds the key again, this time in a build arg. Back to the drawing board.",
                "reviewer מריץ docker history על ה-image החדש ומוצא את המפתח שוב, הפעם ב-build arg. חוזרים לשולחן השרטוטים."),
        choices: [
          c("Switch to an IAM role for the workload and add secret scanning in CI", "לעבור ל-IAM role ל-workload ולהוסיף סריקת secrets ב-CI", "s4", 5,
            "Good — workload identity means there's nothing to leak.",
            "טוב — workload identity אומר שאין מה שידלוף.")
        ]
      },
      s4: {
        text: t("Now the hard question. acme-customer-exports holds CSV exports with customer names, emails and invoice totals for ~180 EU customers' end users. S3 data events were enabled, so you know exactly which 2,010 objects were read.",
                "עכשיו השאלה הקשה. acme-customer-exports מכיל קבצי CSV עם שמות, מיילים וסכומי חשבוניות של משתמשי הקצה של כ-180 לקוחות באירופה. S3 data events היו מופעלים, אז אתה יודע בדיוק אילו 2,010 אובייקטים נקראו."),
        data: `$ athena> SELECT count(DISTINCT requestparameters) FROM cloudtrail_logs
          WHERE useridentity.accesskeyid='AKIAEXAMPLEREPORT01' AND eventname='GetObject';
2010
-- objects map to 63 customer tenants, ~410,000 personal records`,
        choices: [
          c("Escalate to security leadership, legal and the DPO now: this is a personal-data breach with a GDPR 72-hour notification clock", "להסלים עכשיו להנהלת האבטחה, ל-legal ול-DPO: זו פריצה של מידע אישי עם שעון של 72 שעות להודעה לפי GDPR", "s5", 15,
            "Correct. Engineers scope the facts; legal decides notification. The 72-hour clock started when you became aware.",
            "נכון. המהנדסים ממפים את העובדות; legal מחליט על ההודעה. שעון ה-72 שעות התחיל ברגע שנודע לכם."),
          c("The files were only read, not deleted — no need to tell anyone outside engineering", "הקבצים רק נקראו, לא נמחקו — אין צורך לספר לאף אחד מחוץ להנדסה", "lose", -25,
            "Unauthorized access to personal data is a breach regardless of deletion. Hiding it turns an incident into a legal and trust catastrophe.",
            "גישה לא מורשית למידע אישי היא פריצה בלי קשר למחיקה. הסתרה הופכת incident לאסון משפטי ואסון אמון.")
        ]
      },
      s5: {
        text: t("Customers are notified with precise scope thanks to your data events. In the postmortem, which guardrail do you push org-wide first?",
                "הלקוחות מקבלים הודעה עם scope מדויק בזכות ה-data events. ב-postmortem, איזה guardrail אתה דוחף ראשון לכל ה-org?"),
        choices: [
          c("Eliminate IAM users with access keys (SCP denying iam:CreateAccessKey outside break-glass, SSO for humans, roles for workloads) plus push protection and registry scanning", "לחסל IAM users עם access keys (SCP שחוסם iam:CreateAccessKey מחוץ ל-break-glass, SSO לבני אדם, roles ל-workloads) ובנוסף push protection וסריקת registry", "win", 15,
            "This removes the whole category: no long-lived keys means nothing to bake into images, repos or logs.",
            "זה מעלים את כל הקטגוריה: בלי מפתחות ארוכי-חיים אין מה לאפות לתוך images, ריפואים או לוגים."),
          c("A wiki page reminding developers not to put keys in Dockerfiles", "דף wiki שמזכיר למפתחים לא לשים מפתחות ב-Dockerfiles", "win", 0,
            "Better than nothing, but policies enforced by machines beat reminders read by humans. The next leak is a matter of time.",
            "עדיף מכלום, אבל policies שנאכפות ע\"י מכונות מנצחות תזכורות שבני אדם קוראים. הדליפה הבאה היא רק עניין של זמן.")
        ]
      },
      win: {
        text: t("Contained in 22 minutes, persistence removed, root cause eliminated, breach handled transparently. The key that leaked no longer exists — and neither does the pattern that created it.",
                "בשליטה תוך 22 דקות, ה-persistence הוסר, ה-root cause חוסל, והפריצה טופלה בשקיפות. המפתח שדלף כבר לא קיים — וגם לא הדפוס שיצר אותו."),
        end: "win"
      },
      lose: {
        text: t("Weeks later, the attacker returns through the access you left open — or a regulator learns about the breach from someone else. Revoke first, hunt persistence, scope the data, escalate early.",
                "כמה שבועות אחר כך התוקף חוזר דרך הגישה שהשארת פתוחה — או ש-regulator שומע על הפריצה ממישהו אחר. קודם revoke, לצוד persistence, למפות את המידע, ולהסלים מוקדם."),
        end: "lose"
      }
    },
    lessons: ["cloud-secrets-management", "cloud-iam-security", "cloud-landing-zones", "staff-zero-trust-secrets"]
  });
})();
