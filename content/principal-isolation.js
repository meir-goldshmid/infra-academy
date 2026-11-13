/* Principal Engineer Playbook — v3: applied crypto & PKI, network isolation, tenant isolation, data security. */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-applied-crypto-pki",
  track: "principal",
  order: 90,
  icon: "🔐",
  level: 3,
  minutes: 18,
  title: { en: "Applied Cryptography & PKI for Engineers", he: "קריפטוגרפיה שימושית ו-PKI למהנדסים" },
  tldr: {
    en: "Use AEAD (AES-GCM / ChaCha20-Poly1305) for data, ECDHE for forward secrecy, envelope encryption with a KMS for keys, short-lived certificates issued by automation, and signatures for integrity — and never invent any of it yourself.",
    he: "משתמשים ב-AEAD (AES-GCM / ChaCha20-Poly1305) לנתונים, ב-ECDHE בשביל forward secrecy, ב-envelope encryption עם KMS למפתחות, בתעודות קצרות-חיים שמונפקות באוטומציה, ובחתימות לשלמות — ואף פעם לא ממציאים שום חלק מזה לבד."
  },
  analogy: {
    en: "Symmetric encryption is a safe with one key — fast, but you must somehow hand the key to the other person. Asymmetric is a mailbox: anyone can drop a letter through the slot (public key), only you open it (private key). ECDHE is two people mixing paint colors in public and both ending with the same secret color that nobody watching can reproduce — and they throw the brushes away after the call (forward secrecy). Envelope encryption is a hotel: each room has its own key (data key), and all room keys sit in the manager's safe (KMS) that never leaves the building. A certificate is a passport: a trusted government (CA) vouches that this face (public key) belongs to this name (domain), with an expiry date.",
    he: "הצפנה סימטרית היא כספת עם מפתח אחד — מהירה, אבל צריך איכשהו להעביר את המפתח לצד השני. א-סימטרית היא תיבת דואר: כל אחד יכול להכניס מכתב דרך החריץ (public key), ורק אתה פותח (private key). ECDHE זה שני אנשים שמערבבים צבעים בפומבי ושניהם מקבלים אותו צבע סודי שאף צופה לא יכול לשחזר — ובסוף השיחה זורקים את המכחולים (forward secrecy). Envelope encryption זה מלון: לכל חדר מפתח משלו (data key), וכל מפתחות החדרים יושבים בכספת של המנהל (KMS) שלא יוצאת מהבניין. תעודה היא דרכון: ממשלה מהימנה (CA) מאשרת שהפנים האלה (public key) שייכים לשם הזה (domain), עם תאריך תפוגה."
  },
  sections: [
    {
      h: { en: "Symmetric, asymmetric and AEAD", he: "סימטרי, א-סימטרי ו-AEAD" },
      body: {
        en: `<table>
<tr><th>Family</th><th>Algorithms</th><th>Speed</th><th>Used for</th></tr>
<tr><td>Symmetric AEAD</td><td>AES-256-GCM, ChaCha20-Poly1305</td><td>GB/s (AES-NI)</td><td>Bulk data, disks, TLS records, DB fields</td></tr>
<tr><td>Asymmetric encryption / KEM</td><td>RSA-OAEP, ECDH (X25519), ML-KEM</td><td>~1000x slower</td><td>Agreeing on / wrapping a symmetric key</td></tr>
<tr><td>Signatures</td><td>Ed25519, ECDSA P-256, RSA-PSS</td><td>fast verify</td><td>Certificates, JWTs, artifacts, git commits</td></tr>
<tr><td>Hash / MAC</td><td>SHA-256, HMAC-SHA256</td><td>very fast</td><td>Integrity, webhooks (see pr-checksums-hashing)</td></tr>
</table>
<p><strong>AEAD</strong> (Authenticated Encryption with Associated Data) encrypts <em>and</em> authenticates: if one bit of the ciphertext is flipped, decryption fails instead of returning garbage. "Associated data" is authenticated but not encrypted — bind the ciphertext to its context (tenant id, column name) so it can't be copy-pasted elsewhere.</p>
<pre># pip install cryptography
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)   # 32 bytes
aes = AESGCM(key)
nonce = os.urandom(12)                      # 96-bit, NEVER reuse
aad = b"tenant=t-42;col=ssn"                # context binding
ct = aes.encrypt(nonce, b"123-45-6789", aad)
stored = nonce + ct                         # nonce is not secret
pt = aes.decrypt(stored[:12], stored[12:], aad)</pre>
<blockquote>⚠️ Production tip: GCM nonce reuse with the same key is catastrophic — it leaks the XOR of plaintexts and lets an attacker forge messages. With random 96-bit nonces, rotate the key well before ~2^32 encryptions. If you can't guarantee unique nonces, use AES-GCM-SIV or XChaCha20-Poly1305 (192-bit nonce).</blockquote>`,
        he: `<table>
<tr><th>משפחה</th><th>אלגוריתמים</th><th>מהירות</th><th>משמש ל-</th></tr>
<tr><td>Symmetric AEAD</td><td>AES-256-GCM, ChaCha20-Poly1305</td><td>GB/s (AES-NI)</td><td>נתונים בכמות, דיסקים, רשומות TLS, שדות DB</td></tr>
<tr><td>Asymmetric encryption / KEM</td><td>RSA-OAEP, ECDH (X25519), ML-KEM</td><td>פי ~1000 יותר איטי</td><td>הסכמה על / עטיפה של מפתח סימטרי</td></tr>
<tr><td>חתימות</td><td>Ed25519, ECDSA P-256, RSA-PSS</td><td>אימות מהיר</td><td>תעודות, JWTs, artifacts, git commits</td></tr>
<tr><td>Hash / MAC</td><td>SHA-256, HMAC-SHA256</td><td>מהיר מאוד</td><td>שלמות, webhooks (ראו pr-checksums-hashing)</td></tr>
</table>
<p><strong>AEAD</strong> (Authenticated Encryption with Associated Data) מצפין <em>וגם</em> מאמת: אם הופך ביט אחד ב-ciphertext, הפענוח נכשל במקום להחזיר זבל. ה-"Associated data" מאומת אבל לא מוצפן — קושרים את ה-ciphertext להקשר שלו (tenant id, שם עמודה) כדי שאי אפשר יהיה להעתיק-להדביק אותו למקום אחר.</p>
<pre># pip install cryptography
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)   # 32 bytes
aes = AESGCM(key)
nonce = os.urandom(12)                      # 96-bit, NEVER reuse
aad = b"tenant=t-42;col=ssn"                # context binding
ct = aes.encrypt(nonce, b"123-45-6789", aad)
stored = nonce + ct                         # nonce is not secret
pt = aes.decrypt(stored[:12], stored[12:], aad)</pre>
<blockquote>⚠️ טיפ לפרודקשן: שימוש חוזר ב-nonce של GCM עם אותו מפתח הוא קטסטרופה — זה מדליף XOR של ה-plaintexts ומאפשר לתוקף לזייף הודעות. עם nonces אקראיים של 96 ביט, מחליפים מפתח הרבה לפני ~2^32 הצפנות. אם אי אפשר להבטיח nonces ייחודיים — AES-GCM-SIV או XChaCha20-Poly1305 (nonce של 192 ביט).</blockquote>`
      }
    },
    {
      h: { en: "Key exchange and forward secrecy", he: "החלפת מפתחות ו-forward secrecy" },
      body: {
        en: `<p>Old TLS (RSA key transport) encrypted the session key with the server's long-term RSA key. Anyone who recorded traffic and <em>later</em> stole that key could decrypt years of sessions. <strong>ECDHE</strong> (Ephemeral Elliptic-Curve Diffie-Hellman) creates a fresh key pair per connection; the session key is derived from both sides' ephemeral keys and discarded afterwards. Stealing the server's certificate key later reveals nothing about past sessions — that's <strong>forward secrecy</strong>. TLS 1.3 removed RSA key transport entirely: every handshake is ephemeral.</p>
<pre>TLS 1.3 handshake (1 RTT)
client -&gt; ClientHello  + key_share(X25519 pub_c)
server -&gt; ServerHello  + key_share(X25519 pub_s)
          {Certificate, CertificateVerify(sig), Finished}
both:     shared = ECDH(priv_mine, pub_theirs)
          keys   = HKDF(shared, transcript hash)
          -- ephemeral privs deleted after handshake --</pre>
<p>The certificate's key is used only to <em>sign</em> the handshake (prove identity), not to encrypt. That's why you can use an Ed25519/ECDSA cert with any cipher suite.</p>
<blockquote>💡 Real world: "Harvest now, decrypt later" is the reason post-quantum key exchange is rolling out first: Chrome, Firefox and Cloudflare already negotiate the hybrid <code>X25519MLKEM768</code> group by default — classical X25519 plus the NIST ML-KEM (FIPS 203) lattice KEM, so the session is safe if <em>either</em> holds. Signatures (ML-DSA) come later because forging needs a quantum computer at handshake time, not decades later.</blockquote>`,
        he: `<p>TLS ישן (RSA key transport) הצפין את מפתח הסשן עם מפתח ה-RSA ארוך-הטווח של השרת. מי שהקליט תעבורה ו<em>אחר כך</em> גנב את המפתח הזה יכול היה לפענח שנים של סשנים. <strong>ECDHE</strong> (Ephemeral Elliptic-Curve Diffie-Hellman) מייצר זוג מפתחות טרי לכל חיבור; מפתח הסשן נגזר מהמפתחות הזמניים של שני הצדדים ונזרק אחר כך. גניבת מפתח התעודה של השרת בעתיד לא חושפת כלום על סשנים קודמים — זה <strong>forward secrecy</strong>. TLS 1.3 הוריד לגמרי את RSA key transport: כל handshake הוא ephemeral.</p>
<pre>TLS 1.3 handshake (1 RTT)
client -&gt; ClientHello  + key_share(X25519 pub_c)
server -&gt; ServerHello  + key_share(X25519 pub_s)
          {Certificate, CertificateVerify(sig), Finished}
both:     shared = ECDH(priv_mine, pub_theirs)
          keys   = HKDF(shared, transcript hash)
          -- ephemeral privs deleted after handshake --</pre>
<p>המפתח של התעודה משמש רק כדי <em>לחתום</em> על ה-handshake (להוכיח זהות), לא כדי להצפין. לכן אפשר להשתמש בתעודת Ed25519/ECDSA עם כל cipher suite.</p>
<blockquote>💡 מהשטח: "Harvest now, decrypt later" זו הסיבה ש-key exchange פוסט-קוונטי מתגלגל ראשון: Chrome, Firefox ו-Cloudflare כבר מנהלים משא ומתן כברירת מחדל על הקבוצה ההיברידית <code>X25519MLKEM768</code> — X25519 קלאסי ועוד ה-lattice KEM של NIST, ML-KEM (FIPS 203), כך שהסשן בטוח אם <em>אחד מהם</em> מחזיק. חתימות (ML-DSA) יגיעו אחר כך, כי זיוף דורש מחשב קוונטי בזמן ה-handshake, לא עשורים אחרי.</blockquote>`
      }
    },
    {
      h: { en: "Envelope encryption, KMS, HSM and rotation", he: "Envelope encryption, KMS, HSM ו-rotation" },
      body: {
        en: `<p>You never send gigabytes to a KMS. Instead: ask the KMS for a fresh <strong>data key (DEK)</strong>; it returns the key in plaintext <em>and</em> encrypted under a <strong>key-encryption key (KEK)</strong> that never leaves the KMS/HSM. Encrypt locally with the DEK, store the <em>wrapped</em> DEK next to the ciphertext, wipe the plaintext DEK. To decrypt, send the wrapped DEK to KMS (an IAM-checked, audited call) and get it back.</p>
<pre>import boto3, os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
kms = boto3.client("kms")

def encrypt(blob: bytes, tenant: str) -&gt; dict:
    ctx = {"tenant": tenant}            # becomes AAD + audit
    dk = kms.generate_data_key(KeyId="alias/app-data",
            KeySpec="AES_256", EncryptionContext=ctx)
    n = os.urandom(12)
    ct = AESGCM(dk["Plaintext"]).encrypt(n, blob, None)
    return {"wrapped_key": dk["CiphertextBlob"],
            "nonce": n, "ct": ct}       # plaintext DEK dropped

def decrypt(rec: dict, tenant: str) -&gt; bytes:
    dk = kms.decrypt(CiphertextBlob=rec["wrapped_key"],
            EncryptionContext={"tenant": tenant})
    return AESGCM(dk["Plaintext"]).decrypt(
            rec["nonce"], rec["ct"], None)</pre>
<ul>
<li><strong>Rotation</strong>: KMS "automatic rotation" creates a new KEK <em>version</em> yearly (configurable 90 days–7 years on AWS); old versions stay to decrypt old wraps, new wraps use the new version. Data isn't re-encrypted — only re-wrap DEKs if you need to retire an old version.</li>
<li><strong>Key hierarchy</strong>: root (HSM) → KEK per environment/tenant → DEK per object/row batch. Per-tenant KEKs give you crypto-shredding: delete the tenant's KEK and all their data is unreadable, backups included.</li>
<li><strong>HSM</strong>: tamper-resistant hardware where keys are generated and used but can't be exported (FIPS 140-3 Level 3). Cloud KMS is HSM-backed; CloudHSM / Azure Dedicated HSM when you need single-tenant hardware or your own key ceremony.</li>
<li><strong>Caching</strong>: use a DEK cache (AWS Encryption SDK caching CMM) with limits (e.g. max 5 minutes / 10k messages) — otherwise KMS quotas (thousands of req/s per region) and latency (~5-10 ms) bite.</li>
</ul>`,
        he: `<p>אף פעם לא שולחים גיגה-בייטים ל-KMS. במקום זה: מבקשים מה-KMS <strong>data key (DEK)</strong> טרי; הוא מחזיר את המפתח ב-plaintext <em>וגם</em> מוצפן תחת <strong>key-encryption key (KEK)</strong> שאף פעם לא יוצא מה-KMS/HSM. מצפינים מקומית עם ה-DEK, שומרים את ה-DEK <em>העטוף</em> ליד ה-ciphertext, ומוחקים את ה-DEK הגלוי. כדי לפענח — שולחים את ה-DEK העטוף ל-KMS (קריאה שעוברת בדיקת IAM ונרשמת ב-audit) ומקבלים אותו חזרה.</p>
<pre>import boto3, os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
kms = boto3.client("kms")

def encrypt(blob: bytes, tenant: str) -&gt; dict:
    ctx = {"tenant": tenant}            # becomes AAD + audit
    dk = kms.generate_data_key(KeyId="alias/app-data",
            KeySpec="AES_256", EncryptionContext=ctx)
    n = os.urandom(12)
    ct = AESGCM(dk["Plaintext"]).encrypt(n, blob, None)
    return {"wrapped_key": dk["CiphertextBlob"],
            "nonce": n, "ct": ct}       # plaintext DEK dropped

def decrypt(rec: dict, tenant: str) -&gt; bytes:
    dk = kms.decrypt(CiphertextBlob=rec["wrapped_key"],
            EncryptionContext={"tenant": tenant})
    return AESGCM(dk["Plaintext"]).decrypt(
            rec["nonce"], rec["ct"], None)</pre>
<ul>
<li><strong>Rotation</strong>: ה-"automatic rotation" של KMS יוצר <em>גרסה</em> חדשה של ה-KEK כל שנה (ב-AWS אפשר להגדיר בין 90 יום ל-7 שנים); גרסאות ישנות נשארות כדי לפענח עטיפות ישנות, ועטיפות חדשות משתמשות בגרסה החדשה. הנתונים לא מוצפנים מחדש — עוטפים מחדש DEKs רק אם צריך להוציא גרסה ישנה משימוש.</li>
<li><strong>היררכיית מפתחות</strong>: root (HSM) → KEK לכל סביבה/tenant → DEK לכל אובייקט/אצוות שורות. KEK פר-tenant נותן crypto-shredding: מוחקים את ה-KEK של ה-tenant וכל הנתונים שלו בלתי קריאים, כולל גיבויים.</li>
<li><strong>HSM</strong>: חומרה עמידה לחבלה שבה מפתחות נוצרים ומשמשים אבל אי אפשר לייצא אותם (FIPS 140-3 Level 3). Cloud KMS מגובה HSM; CloudHSM / Azure Dedicated HSM כשצריך חומרה single-tenant או טקס מפתחות משלכם.</li>
<li><strong>Caching</strong>: משתמשים ב-DEK cache (ה-caching CMM של AWS Encryption SDK) עם מגבלות (למשל מקסימום 5 דקות / 10k הודעות) — אחרת ה-quotas של KMS (אלפי בקשות לשנייה ל-region) וה-latency (~5-10 ms) נושכים.</li>
</ul>`
      }
    },
    {
      h: { en: "PKI, certificate chains, ACME and mTLS", he: "PKI, שרשראות תעודות, ACME ו-mTLS" },
      body: {
        en: `<p>A <strong>certificate</strong> binds a public key to a name, signed by an issuer. Browsers trust ~150 <strong>root CAs</strong> (kept offline); roots sign <strong>intermediates</strong>; intermediates sign your <strong>leaf</strong>. Your server must send leaf + intermediates (the chain) — a missing intermediate is the classic "works in Chrome, fails in curl/Java" bug.</p>
<pre>$ openssl s_client -connect example.com:443 \\
    -servername example.com -showcerts &lt;/dev/null
 0 s:CN=example.com            i:CN=R11 (Let's Encrypt)
 1 s:CN=R11                    i:CN=ISRG Root X1
$ openssl x509 -in leaf.pem -noout -dates -ext subjectAltName
notBefore=Oct  1 00:00:00 2026 GMT
notAfter=Dec 30 23:59:59 2026 GMT
X509v3 Subject Alternative Name: DNS:example.com, DNS:www.example.com</pre>
<p><strong>Lifetimes are shrinking</strong>: the CA/Browser Forum approved a schedule from 398 days down to 200 (March 2026), 100 (March 2027) and <strong>47 days by March 2029</strong>. Manual renewal is dead — automate with <strong>ACME</strong> (Let's Encrypt, ZeroSSL, Google Trust Services) or your cloud's cert manager.</p>
<pre>apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: api-tls, namespace: prod }
spec:
  secretName: api-tls
  dnsNames: [api.example.com]
  duration: 2160h      # 90d
  renewBefore: 720h    # renew 30d early
  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }</pre>
<p><strong>mTLS</strong>: both sides present certificates, so service B knows <em>which workload</em> is calling. At scale you run an internal CA with very short certs (1–24 h). <strong>SPIFFE</strong> standardizes the identity (<code>spiffe://prod.acme.io/ns/payments/sa/api</code>) and <strong>SPIRE</strong> (or Istio/Linkerd's CA) attests the workload (k8s service account, AWS instance identity) and issues/rotates SVIDs automatically.</p>
<blockquote>💡 Real world: Expired certificates still cause big outages (Microsoft Teams 2020, Spotify 2020, many Let's Encrypt root-transition breaks in 2021). Monitor <code>notAfter</code> for every endpoint (blackbox exporter <code>probe_ssl_earliest_cert_expiry</code>) and alert at 14 days, not 1.</blockquote>`,
        he: `<p><strong>תעודה</strong> קושרת public key לשם, חתומה על ידי מנפיק. דפדפנים סומכים על ~150 <strong>root CAs</strong> (שמוחזקים offline); ה-roots חותמים על <strong>intermediates</strong>; ה-intermediates חותמים על ה-<strong>leaf</strong> שלכם. השרת חייב לשלוח leaf + intermediates (השרשרת) — intermediate חסר הוא הבאג הקלאסי של "עובד ב-Chrome, נכשל ב-curl/Java".</p>
<pre>$ openssl s_client -connect example.com:443 \\
    -servername example.com -showcerts &lt;/dev/null
 0 s:CN=example.com            i:CN=R11 (Let's Encrypt)
 1 s:CN=R11                    i:CN=ISRG Root X1
$ openssl x509 -in leaf.pem -noout -dates -ext subjectAltName
notBefore=Oct  1 00:00:00 2026 GMT
notAfter=Dec 30 23:59:59 2026 GMT
X509v3 Subject Alternative Name: DNS:example.com, DNS:www.example.com</pre>
<p><strong>אורך החיים מתקצר</strong>: ה-CA/Browser Forum אישר לוח זמנים מ-398 יום ל-200 (מרץ 2026), 100 (מרץ 2027) ו-<strong>47 יום עד מרץ 2029</strong>. חידוש ידני מת — מאטמטים עם <strong>ACME</strong> (Let's Encrypt, ZeroSSL, Google Trust Services) או ה-cert manager של הענן.</p>
<pre>apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: api-tls, namespace: prod }
spec:
  secretName: api-tls
  dnsNames: [api.example.com]
  duration: 2160h      # 90d
  renewBefore: 720h    # renew 30d early
  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }</pre>
<p><strong>mTLS</strong>: שני הצדדים מציגים תעודות, כך ששירות B יודע <em>איזה workload</em> קורא לו. בסקייל מריצים CA פנימי עם תעודות קצרות מאוד (1–24 שעות). <strong>SPIFFE</strong> מתקנן את הזהות (<code>spiffe://prod.acme.io/ns/payments/sa/api</code>) ו-<strong>SPIRE</strong> (או ה-CA של Istio/Linkerd) מאמת את ה-workload (service account ב-k8s, instance identity ב-AWS) ומנפיק/מחליף SVIDs אוטומטית.</p>
<blockquote>💡 מהשטח: תעודות שפג תוקפן עדיין גורמות לתקלות גדולות (Microsoft Teams 2020, Spotify 2020, הרבה שבירות במעבר ה-root של Let's Encrypt ב-2021). מנטרים <code>notAfter</code> לכל endpoint (ב-blackbox exporter: <code>probe_ssl_earliest_cert_expiry</code>) ומתריעים ב-14 יום, לא ביום אחד.</blockquote>`
      }
    },
    {
      h: { en: "Signatures, and the 'don't roll your own' list", he: "חתימות, ורשימת ה-'אל תמציאו לבד'" },
      body: {
        en: `<p>Signatures prove <em>who</em> produced something and that it wasn't changed: JWTs (JWS), container images (<strong>cosign</strong>/Sigstore — keyless signing with an OIDC identity, logged in the Rekor transparency log), git commits, SBOMs and release artifacts.</p>
<pre>cosign sign --yes ghcr.io/acme/api@sha256:4f1c...
cosign verify ghcr.io/acme/api@sha256:4f1c... \\
  --certificate-identity-regexp 'github.com/acme/.*' \\
  --certificate-oidc-issuer \\
     https://token.actions.githubusercontent.com</pre>
<p>Mistakes that keep showing up in real incidents and pen tests:</p>
<table>
<tr><th>Mistake</th><th>Why it breaks</th><th>Do instead</th></tr>
<tr><td>AES-ECB, or CBC without a MAC</td><td>ECB leaks patterns; CBC is malleable (padding oracles)</td><td>AES-GCM / ChaCha20-Poly1305</td></tr>
<tr><td>Reused or counter-reset nonces</td><td>Breaks GCM confidentiality + integrity</td><td>Random 96-bit nonce + key rotation, or GCM-SIV</td></tr>
<tr><td>JWT <code>alg: none</code> / HS256-RS256 confusion</td><td>Attacker signs with the public key as HMAC secret</td><td>Pin the expected algorithm and key per issuer</td></tr>
<tr><td><code>==</code> to compare MACs/tokens</td><td>Timing side channel</td><td><code>hmac.compare_digest</code> / constant-time compare</td></tr>
<tr><td><code>Math.random()</code> / <code>random</code> for tokens</td><td>Predictable PRNG</td><td><code>crypto.randomBytes</code>, <code>secrets.token_urlsafe(32)</code></td></tr>
<tr><td>SHA-256 for passwords</td><td>GPUs try billions/s</td><td>argon2id / bcrypt / scrypt</td></tr>
<tr><td>Keys in git / env dumps / logs</td><td>Leak is forever</td><td>KMS + secret manager, scanners in CI</td></tr>
<tr><td><code>verify=False</code> / InsecureSkipVerify</td><td>Silently disables TLS authentication (MITM)</td><td>Fix the trust store; pin the internal CA bundle</td></tr>
</table>
<blockquote>⚠️ Production tip: Use high-level, misuse-resistant libraries (libsodium/NaCl, Google Tink, AWS Encryption SDK, the language's TLS stack). If a code review shows someone choosing a block-cipher mode by hand, that's the finding.</blockquote>`,
        he: `<p>חתימות מוכיחות <em>מי</em> ייצר משהו ושהוא לא שונה: JWTs (JWS), container images (<strong>cosign</strong>/Sigstore — keyless signing עם זהות OIDC, שנרשם ב-transparency log של Rekor), git commits, SBOMs ו-release artifacts.</p>
<pre>cosign sign --yes ghcr.io/acme/api@sha256:4f1c...
cosign verify ghcr.io/acme/api@sha256:4f1c... \\
  --certificate-identity-regexp 'github.com/acme/.*' \\
  --certificate-oidc-issuer \\
     https://token.actions.githubusercontent.com</pre>
<p>טעויות שחוזרות שוב ושוב באירועים אמיתיים ובמבדקי חדירה:</p>
<table>
<tr><th>טעות</th><th>למה זה נשבר</th><th>מה עושים במקום</th></tr>
<tr><td>AES-ECB, או CBC בלי MAC</td><td>ECB מדליף דפוסים; CBC ניתן לשינוי (padding oracles)</td><td>AES-GCM / ChaCha20-Poly1305</td></tr>
<tr><td>nonces שחוזרים או counter שמתאפס</td><td>שובר ב-GCM גם סודיות וגם שלמות</td><td>nonce אקראי של 96 ביט + rotation למפתח, או GCM-SIV</td></tr>
<tr><td>JWT עם <code>alg: none</code> / בלבול HS256-RS256</td><td>התוקף חותם עם ה-public key בתור סוד HMAC</td><td>לנעול את האלגוריתם והמפתח הצפויים לכל issuer</td></tr>
<tr><td><code>==</code> להשוואת MACs/tokens</td><td>timing side channel</td><td><code>hmac.compare_digest</code> / השוואה ב-constant time</td></tr>
<tr><td><code>Math.random()</code> / <code>random</code> ל-tokens</td><td>PRNG צפוי</td><td><code>crypto.randomBytes</code>, <code>secrets.token_urlsafe(32)</code></td></tr>
<tr><td>SHA-256 לסיסמאות</td><td>GPUs מנסים מיליארדים בשנייה</td><td>argon2id / bcrypt / scrypt</td></tr>
<tr><td>מפתחות ב-git / ב-dumps של env / בלוגים</td><td>דליפה היא לנצח</td><td>KMS + secret manager, סורקים ב-CI</td></tr>
<tr><td><code>verify=False</code> / InsecureSkipVerify</td><td>מבטל בשקט את אימות ה-TLS (MITM)</td><td>לתקן את ה-trust store; לנעול את ה-CA bundle הפנימי</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: משתמשים בספריות high-level שקשה להשתמש בהן לא נכון (libsodium/NaCl, Google Tink, AWS Encryption SDK, מחסנית ה-TLS של השפה). אם ב-code review רואים מישהו שבוחר block-cipher mode ביד — זה הממצא.</blockquote>`
      }
    }
  ],
  diagram: `Envelope encryption + PKI at a glance

  app ---GenerateDataKey(ctx)---> KMS [KEK in HSM, never leaves]
   |  <-- DEK (plain) + DEK (wrapped by KEK) --
   |-- AES-GCM(DEK, nonce, data) --> ciphertext
   '-- store: {wrapped DEK, nonce, ciphertext}; wipe plain DEK

  Root CA (offline) --signs--> Intermediate --signs--> Leaf (47-90 d)
  server sends: leaf + intermediate     client trusts: root

  TLS 1.3: ECDHE (X25519 / X25519MLKEM768) -> session keys
           cert key only SIGNS the handshake -> forward secrecy`,
  handsOn: [
    { cmd: "openssl s_client -connect github.com:443 -servername github.com -showcerts </dev/null | grep -E ' s:| i:'", what: { en: "See the real chain: leaf → intermediate → root issuer. Count how many certs the server sends.", he: "רואים את השרשרת האמיתית: leaf → intermediate → root. סופרים כמה תעודות השרת שולח." } },
    { cmd: "echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates -issuer -ext subjectAltName", what: { en: "Read expiry dates, issuer and SANs of a live certificate — the three things that break in outages.", he: "קוראים תאריכי תפוגה, מנפיק ו-SANs של תעודה חיה — שלושת הדברים שנשברים בתקלות." } },
    { cmd: "curl -sv https://www.cloudflare.com -o /dev/null 2>&1 | grep -iE 'SSL connection|ALPN|subject:|expire'", what: { en: "See the negotiated TLS version and cipher. Then check pq.cloudflareresearch.com in a browser to see if your client used X25519MLKEM768.", he: "רואים את גרסת ה-TLS וה-cipher שנבחרו. אחר כך בודקים ב-pq.cloudflareresearch.com בדפדפן אם הלקוח השתמש ב-X25519MLKEM768." } },
    { cmd: "python3 -c \"import os;from cryptography.hazmat.primitives.ciphers.aead import AESGCM as A;k=A.generate_key(256);n=os.urandom(12);c=A(k).encrypt(n,b'hi',b'ctx');print(A(k).decrypt(n,c,b'ctx'));A(k).decrypt(n,c,b'other')\"", what: { en: "AEAD in action: decrypting with the wrong associated data raises InvalidTag — integrity, not just secrecy.", he: "AEAD בפעולה: פענוח עם associated data שגוי זורק InvalidTag — שלמות, לא רק סודיות." } },
    { cmd: "aws kms generate-data-key --key-id alias/app-data --key-spec AES_256 --encryption-context tenant=t-42 --query CiphertextBlob --output text | head -c 60", what: { en: "Get a wrapped data key from KMS (needs an AWS account and a key). Note the encryption context — it shows up in CloudTrail.", he: "מקבלים data key עטוף מ-KMS (צריך חשבון AWS ומפתח). שימו לב ל-encryption context — הוא מופיע ב-CloudTrail." } }
  ],
  mnemonic: {
    en: "\"AEAD for data, ECDHE for sessions, KMS for keys, ACME for certs, cosign for artifacts — and nonce means NOT-ONCE-again.\"",
    he: "\"AEAD לנתונים, ECDHE לסשנים, KMS למפתחות, ACME לתעודות, cosign ל-artifacts — ו-nonce זה פעם אחת בלבד.\""
  },
  pitfalls: [
    { en: "Encrypting at the disk/TDE layer and calling the data 'encrypted'. Disk encryption only protects a stolen disk; anyone with DB credentials (or SQL injection) reads plaintext. Sensitive fields need application-level or field-level encryption with separate key access.", he: "להצפין בשכבת הדיסק/TDE ולקרוא לנתונים 'מוצפנים'. הצפנת דיסק מגנה רק על דיסק שנגנב; כל מי שיש לו credentials ל-DB (או SQL injection) קורא plaintext. שדות רגישים צריכים הצפנה ברמת האפליקציה/השדה עם גישה נפרדת למפתחות." },
    { en: "Serving only the leaf certificate. Browsers often fill in the missing intermediate from cache (AIA fetching), so it 'works' in Chrome, but Java, Go, curl and mobile apps fail with 'unable to get local issuer certificate'.", he: "להגיש רק את תעודת ה-leaf. דפדפנים משלימים לא פעם את ה-intermediate החסר מה-cache (AIA fetching), אז זה 'עובד' ב-Chrome, אבל Java, Go, curl ואפליקציות מובייל נכשלים עם 'unable to get local issuer certificate'." },
    { en: "Rotating a KMS key and then deleting the old version 'to clean up'. Every object still wrapped with it becomes unrecoverable — including backups. Scheduled deletion has a 7–30 day waiting period for exactly this reason; alarm on ScheduleKeyDeletion.", he: "לעשות rotation למפתח KMS ואז למחוק את הגרסה הישנה 'בשביל הסדר'. כל אובייקט שעדיין עטוף בה הופך לבלתי ניתן לשחזור — כולל גיבויים. ל-scheduled deletion יש תקופת המתנה של 7–30 יום בדיוק בגלל זה; שימו alarm על ScheduleKeyDeletion." },
    { en: "Pinning a leaf certificate or public key in a mobile app. When the cert rotates (now every 47–90 days) old app versions break until users update. Pin the CA/intermediate set, or don't pin at all and rely on CT monitoring.", he: "לעשות pinning לתעודת leaf או ל-public key באפליקציית מובייל. כשהתעודה מתחלפת (היום כל 47–90 יום) גרסאות ישנות של האפליקציה נשברות עד שהמשתמשים מעדכנים. נועלים על סט ה-CA/intermediates, או לא עושים pinning בכלל ומסתמכים על ניטור CT." }
  ],
  interview: [
    { q: { en: "How would you encrypt a PII column so a DB dump alone is useless, and still support per-tenant deletion?", he: "איך תצפין עמודת PII כך ש-dump של ה-DB לבדו יהיה חסר ערך, ועדיין לתמוך במחיקה פר-tenant?" },
      a: { en: "Application-level envelope encryption: a KEK per tenant in KMS, DEKs cached briefly per tenant, AES-GCM per value with the tenant id and column name as associated data (so values can't be swapped between rows/tenants). Store wrapped DEK + nonce + ciphertext. Access to kms:Decrypt is limited to the service role and audited. Deleting a tenant = schedule deletion of its KEK (crypto-shredding), which also covers backups. If you need equality lookups, add a separate keyed HMAC 'blind index' column rather than deterministic encryption.", he: "Envelope encryption ברמת האפליקציה: KEK לכל tenant ב-KMS, DEKs עם cache קצר פר-tenant, AES-GCM לכל ערך עם ה-tenant id ושם העמודה כ-associated data (כך שאי אפשר להחליף ערכים בין שורות/tenants). שומרים DEK עטוף + nonce + ciphertext. הגישה ל-kms:Decrypt מוגבלת ל-role של השירות ונרשמת ב-audit. מחיקת tenant = scheduled deletion של ה-KEK שלו (crypto-shredding), וזה מכסה גם גיבויים. אם צריך חיפוש לפי שוויון — מוסיפים עמודת 'blind index' עם HMAC ממפתח נפרד, במקום הצפנה דטרמיניסטית." } },
    { q: { en: "What does forward secrecy protect against, and what doesn't it protect against?", he: "מפני מה forward secrecy מגן, ומפני מה הוא לא מגן?" },
      a: { en: "It protects recorded past traffic if the server's long-term private key is stolen later — session keys came from ephemeral ECDHE keys that no longer exist. It does not protect against a compromised endpoint during the session (malware, memory dump), a stolen key used for active MITM in the future, or 'harvest now, decrypt later' by a quantum computer breaking the ECDH itself — that's what hybrid ML-KEM key exchange addresses.", he: "הוא מגן על תעבורה שהוקלטה בעבר אם המפתח הפרטי ארוך-הטווח של השרת נגנב מאוחר יותר — מפתחות הסשן נגזרו ממפתחות ECDHE זמניים שכבר לא קיימים. הוא לא מגן מפני endpoint פרוץ בזמן הסשן (malware, memory dump), מפני מפתח גנוב שמשמש ל-MITM אקטיבי בעתיד, או מפני 'harvest now, decrypt later' של מחשב קוונטי ששובר את ה-ECDH עצמו — בזה מטפל key exchange היברידי עם ML-KEM." } },
    { q: { en: "Certificates will soon live 47 days. What has to change in a company with 3,000 endpoints?", he: "תעודות יחיו בקרוב 47 יום. מה צריך להשתנות בחברה עם 3,000 endpoints?" },
      a: { en: "Everything manual has to go: inventory every cert (CT logs + scanning), move issuance to ACME/cloud cert managers/cert-manager with renewal at ~2/3 of lifetime, remove certs baked into images and appliances, make reloads hot (no restarts), stop pinning leaves, alert on expiry at 14 and 7 days plus renewal failures, and run a game day where the CA is unavailable for 48 hours to prove the buffer is enough.", he: "כל מה שידני צריך לצאת: מלאי של כל התעודות (CT logs + סריקה), מעבר להנפקה ב-ACME / cert managers של הענן / cert-manager עם חידוש בערך ב-2/3 מאורך החיים, הוצאת תעודות שאפויות בתוך images ו-appliances, טעינה מחדש חמה (בלי restarts), הפסקת pinning ל-leaves, התראות על תפוגה ב-14 וב-7 ימים ועל כשלי חידוש, ו-game day שבו ה-CA לא זמין 48 שעות כדי להוכיח שהמרווח מספיק." } }
  ],
  quiz: [
    { q: { en: "Why do you send the wrapped DEK to KMS instead of the data itself?", he: "למה שולחים ל-KMS את ה-DEK העטוף ולא את הנתונים עצמם?" },
      options: [
        { en: "KMS can't encrypt data", he: "KMS לא יודע להצפין נתונים" },
        { en: "KMS calls are size-limited (~4 KB), slow and rate-limited; bulk crypto is done locally with the DEK", he: "קריאות ל-KMS מוגבלות בגודל (~4 KB), איטיות ומוגבלות בקצב; הקריפטו של הנתונים נעשה מקומית עם ה-DEK" },
        { en: "To make the data public", he: "כדי להפוך את הנתונים לציבוריים" },
        { en: "Because AES-GCM requires it", he: "כי AES-GCM דורש את זה" }
      ], answer: 1,
      explain: { en: "Envelope encryption keeps the KEK in the HSM while the heavy lifting happens locally; KMS only wraps/unwraps 32-byte keys.", he: "Envelope encryption משאיר את ה-KEK ב-HSM בזמן שהעבודה הכבדה נעשית מקומית; KMS רק עוטף ופותח מפתחות של 32 בייט." } },
    { q: { en: "What happens if you reuse a nonce with the same AES-GCM key?", he: "מה קורה אם משתמשים שוב ב-nonce עם אותו מפתח AES-GCM?" },
      options: [
        { en: "Nothing, nonces are public", he: "כלום, nonces הם ציבוריים" },
        { en: "Decryption gets slower", he: "הפענוח נהיה איטי יותר" },
        { en: "Confidentiality and integrity break: XOR of plaintexts leaks and forgeries become possible", he: "הסודיות והשלמות נשברות: XOR של ה-plaintexts דולף ואפשר לזייף" },
        { en: "The key is automatically rotated", he: "המפתח מתחלף אוטומטית" }
      ], answer: 2,
      explain: { en: "Nonces are public but must be unique per key. Reuse is one of the most damaging real-world crypto bugs.", he: "nonces הם ציבוריים אבל חייבים להיות ייחודיים לכל מפתח. שימוש חוזר הוא אחד מבאגי הקריפטו הכי הרסניים בעולם האמיתי." } },
    { q: { en: "A Java client fails with 'unable to find valid certification path' but Chrome works. Most likely cause?", he: "לקוח Java נכשל עם 'unable to find valid certification path' אבל Chrome עובד. הסיבה הסבירה ביותר?" },
      options: [
        { en: "The server isn't sending the intermediate certificate", he: "השרת לא שולח את תעודת ה-intermediate" },
        { en: "Java doesn't support TLS 1.3", he: "Java לא תומך ב-TLS 1.3" },
        { en: "The certificate uses ECDSA", he: "התעודה משתמשת ב-ECDSA" },
        { en: "DNS is down", he: "ה-DNS נפל" }
      ], answer: 0,
      explain: { en: "Browsers often patch a broken chain (cached intermediates / AIA); most non-browser clients don't. Always serve the full chain.", he: "דפדפנים לא פעם 'מתקנים' שרשרת שבורה (intermediates מה-cache / AIA); רוב הלקוחות שאינם דפדפנים לא. תמיד מגישים את השרשרת המלאה." } },
    { q: { en: "Which statement about post-quantum TLS today is correct?", he: "איזו טענה על TLS פוסט-קוונטי היום נכונה?" },
      options: [
        { en: "All certificates are already ML-DSA", he: "כל התעודות כבר ML-DSA" },
        { en: "Hybrid key exchange (X25519 + ML-KEM) is already widely negotiated to defeat harvest-now-decrypt-later", he: "key exchange היברידי (X25519 + ML-KEM) כבר נפוץ כדי להתגונן מפני harvest-now-decrypt-later" },
        { en: "Post-quantum means you must disable TLS 1.3", he: "פוסט-קוונטי אומר שצריך לכבות TLS 1.3" },
        { en: "AES-256 is broken by quantum computers", he: "AES-256 נשבר על ידי מחשבים קוונטיים" }
      ], answer: 1,
      explain: { en: "Key exchange moved first because recorded traffic can be decrypted later; symmetric AES-256 remains fine (Grover only halves effective strength).", he: "ה-key exchange זז ראשון כי תעבורה מוקלטת אפשר לפענח בעתיד; AES-256 סימטרי נשאר בסדר (Grover רק מחצית את החוזק האפקטיבי)." } }
  ],
  related: ["net-http-tls", "pr-checksums-hashing", "staff-zero-trust-secrets", "staff-supply-chain", "pr-data-security", "pr-auth", "k8s-ingress-certs-dns"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-network-isolation-deep",
  track: "principal",
  order: 91,
  icon: "🧱",
  level: 3,
  minutes: 18,
  title: { en: "Network Isolation in Depth: Layer by Layer, and How to Prove It", he: "בידוד רשת לעומק: שכבה אחרי שכבה, ואיך מוכיחים שזה עובד" },
  tldr: {
    en: "Isolation is a stack of independent walls — account, VPC, subnet, security group, egress filter, Kubernetes NetworkPolicy, mesh identity policy — so one misconfiguration never opens everything; and you only trust walls you test continuously.",
    he: "בידוד הוא ערימה של קירות בלתי תלויים — account, VPC, subnet, security group, סינון egress, NetworkPolicy ב-Kubernetes, מדיניות זהות ב-mesh — כך ששום טעות קונפיגורציה אחת לא פותחת הכול; וסומכים רק על קירות שבודקים כל הזמן."
  },
  analogy: {
    en: "A modern bank building: a fence around the campus (account/org boundary), a separate building per department (VPC per environment), floors you can only reach with the right badge (subnets + security groups), a guard checking what leaves the building, not only what enters (egress control), and inside the vault room, every drawer has its own lock that checks who you are, not which corridor you came from (identity-based mesh policy). A flat network is an office where one stolen visitor badge opens every door — that's how attackers move from a printer to the payment database.",
    he: "בניין בנק מודרני: גדר סביב הקמפוס (גבול account/org), בניין נפרד לכל מחלקה (VPC לכל סביבה), קומות שמגיעים אליהן רק עם התג הנכון (subnets + security groups), שומר שבודק מה יוצא מהבניין ולא רק מה נכנס (בקרת egress), ובתוך חדר הכספות לכל מגירה מנעול משלה שבודק מי אתה ולא מאיזה מסדרון הגעת (מדיניות mesh מבוססת זהות). רשת שטוחה היא משרד שבו תג אורח אחד שנגנב פותח כל דלת — ככה תוקפים עוברים ממדפסת ל-DB של התשלומים."
  },
  sections: [
    {
      h: { en: "The layers, from outside in", he: "השכבות, מבחוץ פנימה" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Control</th><th>Blast radius it limits</th></tr>
<tr><td>Org / account / subscription</td><td>Separate accounts per env + SCPs / Azure Policy</td><td>A leaked dev key can't touch prod at all</td></tr>
<tr><td>VPC / VNet</td><td>VPC per env (or per domain), no default peering</td><td>No route = no packet</td></tr>
<tr><td>Subnet tiers</td><td>public (LB only) / private app / data (no NAT)</td><td>DBs unreachable from the internet by design</td></tr>
<tr><td>Security group / NSG</td><td>Stateful allowlist by SG reference</td><td>Only the app tier talks to the DB port</td></tr>
<tr><td>NACL</td><td>Stateless subnet guardrail (deny lists)</td><td>Coarse backstop if an SG is wrong</td></tr>
<tr><td>Egress</td><td>NAT + FQDN allowlist proxy/firewall, VPC endpoints</td><td>Exfiltration and C2 callbacks</td></tr>
<tr><td>Kubernetes</td><td>Default-deny NetworkPolicy, L7 policy (Cilium)</td><td>Pod-to-pod lateral movement</td></tr>
<tr><td>Mesh / identity</td><td>mTLS + AuthorizationPolicy on SPIFFE identity</td><td>"Inside the network" no longer means trusted</td></tr>
</table>
<p>The account boundary is the strongest wall you have — IAM, quotas, networking and billing are all separate. A Service Control Policy enforces guardrails nobody inside the account can override:</p>
<pre>{ "Effect": "Deny",
  "Action": ["ec2:CreateInternetGateway",
             "ec2:AttachInternetGateway"],
  "Resource": "*",
  "Condition": { "StringNotEquals": {
     "aws:PrincipalArn":
       "arn:aws:iam::*:role/network-admin" } } }</pre>
<blockquote>💡 Real world: Landing zones (AWS Control Tower, Azure Landing Zones, GCP Cloud Foundation) start with dozens of accounts — prod, staging, dev, shared-network, logging, security tooling — precisely because an account is the cheapest hard boundary there is.</blockquote>`,
        he: `<table>
<tr><th>שכבה</th><th>בקרה</th><th>איזה blast radius היא מגבילה</th></tr>
<tr><td>Org / account / subscription</td><td>accounts נפרדים לכל סביבה + SCPs / Azure Policy</td><td>מפתח dev שדלף לא יכול לגעת ב-prod בכלל</td></tr>
<tr><td>VPC / VNet</td><td>VPC לכל סביבה (או לכל domain), בלי peering ברירת מחדל</td><td>אין route = אין packet</td></tr>
<tr><td>שכבות subnets</td><td>public (רק LB) / private לאפליקציה / data (בלי NAT)</td><td>ה-DBs לא נגישים מהאינטרנט by design</td></tr>
<tr><td>Security group / NSG</td><td>allowlist stateful לפי הפניה ל-SG</td><td>רק שכבת האפליקציה מדברת עם פורט ה-DB</td></tr>
<tr><td>NACL</td><td>מעקה stateless ברמת ה-subnet (deny lists)</td><td>גיבוי גס אם SG שגוי</td></tr>
<tr><td>Egress</td><td>NAT + proxy/firewall עם allowlist של FQDNs, VPC endpoints</td><td>הוצאת מידע (exfiltration) ו-C2 callbacks</td></tr>
<tr><td>Kubernetes</td><td>NetworkPolicy של default-deny, מדיניות L7 (Cilium)</td><td>תנועה רוחבית pod-to-pod</td></tr>
<tr><td>Mesh / זהות</td><td>mTLS + AuthorizationPolicy על זהות SPIFFE</td><td>"בתוך הרשת" כבר לא אומר מהימן</td></tr>
</table>
<p>גבול ה-account הוא הקיר הכי חזק שיש — IAM, quotas, רשת וחיוב נפרדים לגמרי. Service Control Policy אוכף מעקות שאף אחד בתוך ה-account לא יכול לעקוף:</p>
<pre>{ "Effect": "Deny",
  "Action": ["ec2:CreateInternetGateway",
             "ec2:AttachInternetGateway"],
  "Resource": "*",
  "Condition": { "StringNotEquals": {
     "aws:PrincipalArn":
       "arn:aws:iam::*:role/network-admin" } } }</pre>
<blockquote>💡 מהשטח: Landing zones (AWS Control Tower, Azure Landing Zones, GCP Cloud Foundation) מתחילים עם עשרות accounts — prod, staging, dev, shared-network, logging, כלי אבטחה — בדיוק כי account הוא הגבול הקשיח הכי זול שיש.</blockquote>`
      }
    },
    {
      h: { en: "Subnets, security groups vs NACLs", he: "Subnets, ו-security groups מול NACLs" },
      body: {
        en: `<p><strong>Security groups are stateful</strong>: allow inbound 5432 and the reply is automatically allowed. Reference other SGs instead of CIDRs — the rule follows the instances as they scale. <strong>NACLs are stateless</strong>: you must allow the return traffic on ephemeral ports (1024–65535) explicitly, and rules are evaluated in number order. Use SGs as the real policy and NACLs only as a coarse guardrail (e.g. deny the data subnet any route to 0.0.0.0/0).</p>
<pre>resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.db.id
  source_security_group_id = aws_security_group.app.id
}
# no rule from 0.0.0.0/0, no rule from the VPC CIDR</pre>
<pre>10.20.0.0/16  prod VPC
 10.20.0.0/22   public  a/b/c  -&gt; ALB, NAT GW only
 10.20.16.0/20  app     a/b/c  -&gt; EKS nodes / pods
 10.20.64.0/22  data    a/b/c  -&gt; RDS, Redis (no NAT route)</pre>
<blockquote>⚠️ Production tip: "Allow from the VPC CIDR" is the most common lazy rule — it turns the whole VPC into one flat zone. In audits, grep Terraform for <code>cidr_blocks = [var.vpc_cidr]</code> and <code>0.0.0.0/0</code> on non-LB security groups.</blockquote>`,
        he: `<p><strong>Security groups הם stateful</strong>: מאפשרים inbound ל-5432 והתשובה מותרת אוטומטית. מפנים ל-SGs אחרים במקום ל-CIDRs — החוק עוקב אחרי ה-instances כשהם עושים scale. <strong>NACLs הם stateless</strong>: צריך לאפשר במפורש את תעבורת החזרה על ה-ephemeral ports (1024–65535), והחוקים נבדקים לפי סדר המספרים. משתמשים ב-SGs כמדיניות האמיתית וב-NACLs רק כמעקה גס (למשל לחסום ל-subnet ה-data כל route ל-0.0.0.0/0).</p>
<pre>resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.db.id
  source_security_group_id = aws_security_group.app.id
}
# no rule from 0.0.0.0/0, no rule from the VPC CIDR</pre>
<pre>10.20.0.0/16  prod VPC
 10.20.0.0/22   public  a/b/c  -&gt; ALB, NAT GW only
 10.20.16.0/20  app     a/b/c  -&gt; EKS nodes / pods
 10.20.64.0/22  data    a/b/c  -&gt; RDS, Redis (no NAT route)</pre>
<blockquote>⚠️ טיפ לפרודקשן: "לאפשר מה-CIDR של ה-VPC" הוא החוק העצלן הכי נפוץ — הוא הופך את כל ה-VPC לאזור שטוח אחד. ב-audits עושים grep ב-Terraform על <code>cidr_blocks = [var.vpc_cidr]</code> ועל <code>0.0.0.0/0</code> ב-security groups שאינם של LB.</blockquote>`
      }
    },
    {
      h: { en: "Egress control, private endpoints and the metadata endpoint", he: "בקרת egress, private endpoints וה-metadata endpoint" },
      body: {
        en: `<p>Most teams filter inbound and leave outbound wide open. But attackers need egress: to download tools, call home (C2), and exfiltrate data. Layers that help:</p>
<ul>
<li><strong>Private endpoints</strong> (AWS PrivateLink / VPC endpoints, Azure Private Link, GCP PSC): reach S3, KMS, ECR, SaaS vendors without the internet. Add an <strong>endpoint policy</strong> so the S3 endpoint only reaches <em>your</em> buckets — otherwise stolen creds can copy data to an attacker's bucket through your own endpoint.</li>
<li><strong>FQDN allowlist</strong>: route NAT traffic through AWS Network Firewall / Azure Firewall / a Squid or Envoy egress proxy that only permits <code>api.stripe.com</code>, <code>*.github.com</code>, etc. Log every denied domain — it's a great detection signal.</li>
<li><strong>Cloud metadata</strong> (169.254.169.254): enforce IMDSv2 (session token via PUT) with hop limit 1 so a container or SSRF can't fetch node credentials.</li>
</ul>
<pre>{ "Statement": [{ "Effect": "Allow", "Principal": "*",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-prod-*/*" }] }
# ^ S3 gateway endpoint policy: only our buckets

aws ec2 modify-instance-metadata-options \\
  --instance-id i-0abc --http-tokens required \\
  --http-put-response-hop-limit 1</pre>
<blockquote>💡 Real world: In the 2019 Capital One breach, an SSRF in a misconfigured WAF reached the IMDSv1 endpoint, stole the instance role's credentials, and listed and synced 700+ S3 buckets — over the open internet. IMDSv2, a tight role and an S3 endpoint policy each would have broken the chain.</blockquote>`,
        he: `<p>רוב הצוותים מסננים inbound ומשאירים outbound פתוח לגמרי. אבל תוקפים צריכים egress: להוריד כלים, להתקשר הביתה (C2) ולהוציא מידע. שכבות שעוזרות:</p>
<ul>
<li><strong>Private endpoints</strong> (AWS PrivateLink / VPC endpoints, Azure Private Link, GCP PSC): מגיעים ל-S3, KMS, ECR וספקי SaaS בלי אינטרנט. מוסיפים <strong>endpoint policy</strong> כך שה-endpoint של S3 מגיע רק ל-buckets <em>שלכם</em> — אחרת credentials גנובים יכולים להעתיק נתונים ל-bucket של התוקף דרך ה-endpoint שלכם.</li>
<li><strong>Allowlist של FQDNs</strong>: מנתבים את תעבורת ה-NAT דרך AWS Network Firewall / Azure Firewall / egress proxy של Squid או Envoy שמרשה רק <code>api.stripe.com</code>, <code>*.github.com</code> וכו'. רושמים ללוג כל domain שנחסם — זה סיגנל זיהוי מצוין.</li>
<li><strong>Cloud metadata</strong> (169.254.169.254): אוכפים IMDSv2 (session token דרך PUT) עם hop limit 1 כדי שקונטיינר או SSRF לא יוכלו למשוך את ה-credentials של ה-node.</li>
</ul>
<pre>{ "Statement": [{ "Effect": "Allow", "Principal": "*",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-prod-*/*" }] }
# ^ S3 gateway endpoint policy: only our buckets

aws ec2 modify-instance-metadata-options \\
  --instance-id i-0abc --http-tokens required \\
  --http-put-response-hop-limit 1</pre>
<blockquote>💡 מהשטח: בפריצה ל-Capital One ב-2019, SSRF ב-WAF שהוגדר לא נכון הגיע ל-endpoint של IMDSv1, גנב את ה-credentials של ה-role של ה-instance, ועשה list ו-sync ל-700+ buckets של S3 — דרך האינטרנט הפתוח. IMDSv2, role הדוק ו-endpoint policy ל-S3 — כל אחד מהם היה שובר את השרשרת.</blockquote>`
      }
    },
    {
      h: { en: "Inside the cluster: NetworkPolicy, L7 policy and mesh identity", he: "בתוך ה-cluster: NetworkPolicy, מדיניות L7 וזהות ב-mesh" },
      body: {
        en: `<p>By default every pod can reach every pod in every namespace. Start each namespace with default-deny (ingress <em>and</em> egress), then allow DNS and the specific flows:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: payments }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns, namespace: payments }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector: { matchLabels: { k8s-app: kube-dns } }
    ports: [{ port: 53, protocol: UDP },
            { port: 53, protocol: TCP }]</pre>
<p>NetworkPolicy is L3/L4 (IPs and ports). <strong>Cilium</strong> adds L7 (HTTP method/path, DNS names) and FQDN egress:</p>
<pre>apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: api-read-only, namespace: payments }
spec:
  endpointSelector: { matchLabels: { app: ledger } }
  ingress:
  - fromEndpoints: [{ matchLabels: { app: reports } }]
    toPorts:
    - ports: [{ port: "8080", protocol: TCP }]
      rules:
        http: [{ method: GET, path: "/v1/balances/.*" }]</pre>
<p>A <strong>mesh</strong> (Istio/Linkerd) moves the decision from "which IP" to "which workload identity", enforced with mTLS:</p>
<pre>apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: ledger-allow, namespace: payments }
spec:
  selector: { matchLabels: { app: ledger } }
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/checkout/sa/api"]
    to:
    - operation: { methods: ["POST"], paths: ["/v1/entries"] }</pre>
<blockquote>⚠️ Production tip: Policies only work if the CNI enforces them — plain Flannel ignores NetworkPolicy silently. Verify with a test pod after every CNI change.</blockquote>`,
        he: `<p>כברירת מחדל כל pod מגיע לכל pod בכל namespace. מתחילים כל namespace עם default-deny (גם ingress <em>וגם</em> egress), ואז מאפשרים DNS ואת הזרימות הספציפיות:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: payments }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns, namespace: payments }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector: { matchLabels: { k8s-app: kube-dns } }
    ports: [{ port: 53, protocol: UDP },
            { port: 53, protocol: TCP }]</pre>
<p>NetworkPolicy היא L3/L4 (IPs ופורטים). <strong>Cilium</strong> מוסיף L7 (method/path של HTTP, שמות DNS) ו-egress לפי FQDN:</p>
<pre>apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: api-read-only, namespace: payments }
spec:
  endpointSelector: { matchLabels: { app: ledger } }
  ingress:
  - fromEndpoints: [{ matchLabels: { app: reports } }]
    toPorts:
    - ports: [{ port: "8080", protocol: TCP }]
      rules:
        http: [{ method: GET, path: "/v1/balances/.*" }]</pre>
<p><strong>Mesh</strong> (Istio/Linkerd) מעביר את ההחלטה מ"איזה IP" ל"איזו זהות workload", ואוכף אותה עם mTLS:</p>
<pre>apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: ledger-allow, namespace: payments }
spec:
  selector: { matchLabels: { app: ledger } }
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/checkout/sa/api"]
    to:
    - operation: { methods: ["POST"], paths: ["/v1/entries"] }</pre>
<blockquote>⚠️ טיפ לפרודקשן: מדיניות עובדת רק אם ה-CNI אוכף אותה — Flannel רגיל מתעלם מ-NetworkPolicy בשקט. מאמתים עם pod בדיקה אחרי כל שינוי CNI.</blockquote>`
      }
    },
    {
      h: { en: "Zero trust, lateral movement, and proving isolation", he: "Zero trust, תנועה רוחבית, ואיך מוכיחים בידוד" },
      body: {
        en: `<p><strong>Zero trust</strong> (Google BeyondCorp, NIST SP 800-207): no access because of network location. Every request is authenticated (user + device posture), authorized per resource, and encrypted — employees reach internal apps through an identity-aware proxy (Google IAP, Cloudflare Access, Zscaler ZPA), not a VPN that drops them into a flat network. <strong>Microsegmentation</strong> applies the same idea between workloads.</p>
<p><strong>Lateral movement</strong> is what flat networks enable. Target (2013): attackers got in through an HVAC vendor's credentials, moved from the vendor portal to point-of-sale systems, and stole 40 M cards. NotPetya (2017) spread across Maersk's flat Windows network in minutes. The lesson: assume one host <em>will</em> be compromised and size the walls so it stays one host.</p>
<p><strong>Prove it — isolation you don't test is a rumor:</strong></p>
<table>
<tr><th>From → To</th><th>Expected</th><th>Test</th></tr>
<tr><td>checkout pod → ledger:8080 POST</td><td>allow</td><td><code>curl -X POST ledger.payments:8080/v1/entries</code></td></tr>
<tr><td>reports pod → ledger:8080 POST</td><td>deny (403/drop)</td><td>same curl from reports</td></tr>
<tr><td>any pod → postgres:5432</td><td>deny except ledger</td><td><code>nc -zv -w2 pg.data 5432</code></td></tr>
<tr><td>any pod → 169.254.169.254</td><td>deny / timeout</td><td><code>curl -m2 169.254.169.254</code></td></tr>
<tr><td>any pod → example.org:443</td><td>deny (not on allowlist)</td><td><code>curl -m3 https://example.org</code></td></tr>
</table>
<p>Run this <strong>connectivity matrix</strong> as a CI/CD job after every network change (and nightly), using tools like AWS Reachability Analyzer / Network Access Analyzer, Azure Network Watcher, Cilium's <code>cilium connectivity test</code>, or a simple Job that runs the table and fails on any unexpected success.</p>`,
        he: `<p><strong>Zero trust</strong> (BeyondCorp של Google, NIST SP 800-207): אין גישה בגלל מיקום ברשת. כל בקשה מאומתת (משתמש + מצב המכשיר), מאושרת לכל משאב בנפרד ומוצפנת — עובדים מגיעים לאפליקציות פנימיות דרך identity-aware proxy (Google IAP, Cloudflare Access, Zscaler ZPA), לא דרך VPN שמפיל אותם לרשת שטוחה. <strong>Microsegmentation</strong> מיישם את אותו רעיון בין workloads.</p>
<p><strong>תנועה רוחבית</strong> (lateral movement) היא מה שרשתות שטוחות מאפשרות. Target ‏(2013): התוקפים נכנסו עם ה-credentials של ספק מיזוג אוויר, עברו מפורטל הספקים למערכות הקופות, וגנבו 40 מיליון כרטיסים. NotPetya ‏(2017) התפשט ברשת ה-Windows השטוחה של Maersk תוך דקות. הלקח: מניחים שמכונה אחת <em>תיפרץ</em> ובונים את הקירות כך שזה יישאר מכונה אחת.</p>
<p><strong>מוכיחים — בידוד שלא בודקים הוא שמועה:</strong></p>
<table>
<tr><th>מ → אל</th><th>צפוי</th><th>בדיקה</th></tr>
<tr><td>pod של checkout → ledger:8080 POST</td><td>מותר</td><td><code>curl -X POST ledger.payments:8080/v1/entries</code></td></tr>
<tr><td>pod של reports → ledger:8080 POST</td><td>חסום (403/drop)</td><td>אותו curl מ-reports</td></tr>
<tr><td>כל pod → postgres:5432</td><td>חסום חוץ מ-ledger</td><td><code>nc -zv -w2 pg.data 5432</code></td></tr>
<tr><td>כל pod → 169.254.169.254</td><td>חסום / timeout</td><td><code>curl -m2 169.254.169.254</code></td></tr>
<tr><td>כל pod → example.org:443</td><td>חסום (לא ב-allowlist)</td><td><code>curl -m3 https://example.org</code></td></tr>
</table>
<p>מריצים את <strong>מטריצת הקישוריות</strong> הזו כ-job ב-CI/CD אחרי כל שינוי רשת (וגם כל לילה), עם כלים כמו AWS Reachability Analyzer / Network Access Analyzer, Azure Network Watcher, <code>cilium connectivity test</code>, או Job פשוט שמריץ את הטבלה ונכשל על כל הצלחה לא צפויה.</p>`
      }
    }
  ],
  diagram: `Defense in depth (prod account)

 Internet
   |  WAF + ALB (public subnet)            <- only LB is public
   v
 [app subnet]  pods --NetworkPolicy/mesh--> pods
   |   default-deny, allow by identity (SPIFFE)
   |--> VPC endpoints (S3/KMS/ECR, endpoint policy)
   |--> NAT -> egress firewall (FQDN allowlist) -> SaaS
   v
 [data subnet]  RDS/Redis  SG: only from app SG, no NAT route

 Separate accounts: prod | staging | dev | security | logging
 SCPs: no IGW outside network account, IMDSv2 required
 CI job: connectivity matrix must match expected allow/deny`,
  handsOn: [
    { cmd: "kubectl run probe --rm -it --image=nicolaka/netshoot -n payments -- sh -c 'nc -zv -w2 postgres.data 5432; curl -m2 169.254.169.254; curl -m3 https://example.org'", what: { en: "Become the attacker inside a namespace: try the DB, the cloud metadata endpoint and a random internet site. All three should fail under a correct policy.", he: "להיות התוקף בתוך namespace: לנסות את ה-DB, את ה-metadata endpoint של הענן ואתר אינטרנט אקראי. עם מדיניות נכונה שלושתם צריכים להיכשל." } },
    { cmd: "kubectl get networkpolicy -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,TYPES:.spec.policyTypes", what: { en: "Find namespaces without a default-deny policy (no policy at all = everything open).", he: "מוצאים namespaces בלי מדיניות default-deny (אין מדיניות בכלל = הכול פתוח)." } },
    { cmd: "aws ec2 describe-security-groups --query \"SecurityGroups[?IpPermissions[?IpRanges[?CidrIp=='0.0.0.0/0']]].[GroupId,GroupName]\" --output table", what: { en: "List security groups open to the world — every hit that isn't a load balancer is a finding.", he: "רשימת security groups שפתוחים לכל העולם — כל תוצאה שאינה load balancer היא ממצא." } },
    { cmd: "cilium connectivity test", what: { en: "Cilium's built-in suite: deploys test pods and verifies pod-to-pod, egress, DNS and policy enforcement end to end.", he: "חבילת הבדיקות המובנית של Cilium: פורסת pods לבדיקה ומאמתת pod-to-pod, egress, DNS ואכיפת מדיניות מקצה לקצה." } },
    { cmd: "aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,MetadataOptions.HttpTokens,MetadataOptions.HttpPutResponseHopLimit]' --output table", what: { en: "Audit IMDS: anything with HttpTokens=optional (IMDSv1 allowed) or hop limit > 1 on container hosts is exposed to SSRF credential theft.", he: "ביקורת IMDS: כל מה שיש לו HttpTokens=optional (IMDSv1 מותר) או hop limit גדול מ-1 ב-hosts של קונטיינרים חשוף לגניבת credentials דרך SSRF." } }
  ],
  mnemonic: {
    en: "\"Accounts, VPCs, Subnets, Groups, Egress, Pods, Identity — A-V-S-G-E-P-I: 'A Very Strong Gate Every Packet Inspects'. And: untested isolation is a rumor.\"",
    he: "\"Accounts, VPCs, Subnets, Groups, Egress, Pods, Identity — שבע שכבות, וכל אחת עומדת לבד. ובידוד שלא נבדק הוא שמועה.\""
  },
  pitfalls: [
    { en: "Default-deny ingress but no egress policy. The compromised pod can't be reached, but it can reach everything else — including the DB and the internet. Always set both policyTypes.", he: "default-deny ל-ingress בלי מדיניות egress. אי אפשר להגיע ל-pod הפרוץ, אבל הוא יכול להגיע לכל השאר — כולל ה-DB והאינטרנט. תמיד מגדירים את שני ה-policyTypes." },
    { en: "Forgetting DNS when adding default-deny egress — every service breaks with confusing timeouts. Add the allow-dns policy in the same change.", he: "לשכוח DNS כשמוסיפים default-deny ל-egress — כל השירותים נשברים עם timeouts מבלבלים. מוסיפים את מדיניות allow-dns באותו שינוי." },
    { en: "Peering everything with everything (or one Transit Gateway route table for all VPCs) 'for convenience'. You rebuilt the flat network one level up. Use separate TGW route tables per environment and explicit allowed paths.", he: "לעשות peering לכולם עם כולם (או route table אחת ב-Transit Gateway לכל ה-VPCs) 'בשביל הנוחות'. בניתם מחדש את הרשת השטוחה רמה אחת למעלה. משתמשים ב-route tables נפרדות ב-TGW לכל סביבה ובמסלולים מותרים מפורשים." },
    { en: "Treating mesh mTLS as authorization. PeerAuthentication STRICT only proves who is calling; without AuthorizationPolicy every authenticated workload can still call every service.", he: "להתייחס ל-mTLS של ה-mesh כאל הרשאה. PeerAuthentication במצב STRICT רק מוכיח מי קורא; בלי AuthorizationPolicy כל workload מאומת עדיין יכול לקרוא לכל שירות." }
  ],
  interview: [
    { q: { en: "An attacker gets RCE in one public-facing pod. Walk me through what limits the damage in a well-designed platform.", he: "תוקף משיג RCE ב-pod אחד שפונה לציבור. תעביר אותי במה מגביל את הנזק בפלטפורמה מתוכננת היטב." },
      a: { en: "Pod runs as non-root with read-only FS and no service-account token unless needed (limits local escalation). Default-deny egress means it can't call arbitrary internet hosts or the metadata endpoint (IMDSv2, hop limit 1). NetworkPolicy/mesh policy lets it reach only its declared dependencies, and only with its own SPIFFE identity, so it can't call the ledger or the DB. Its IAM role (IRSA/Workload Identity) is scoped to its own resources. The account boundary keeps it out of other environments. Egress denials, unusual DNS and policy drops alert the SOC. Blast radius: one service's data, ideally one tenant's.", he: "ה-pod רץ כ-non-root עם FS לקריאה בלבד ובלי service-account token אם לא צריך (מגביל הסלמה מקומית). default-deny ל-egress אומר שהוא לא יכול לקרוא ל-hosts אקראיים באינטרנט או ל-metadata endpoint (IMDSv2, hop limit 1). NetworkPolicy/מדיניות mesh מרשים לו להגיע רק לתלויות המוצהרות שלו, ורק עם זהות ה-SPIFFE שלו, כך שהוא לא יכול לקרוא ל-ledger או ל-DB. ה-IAM role שלו (IRSA/Workload Identity) מוגבל למשאבים שלו. גבול ה-account משאיר אותו מחוץ לסביבות אחרות. חסימות egress, DNS חריג ו-drops של מדיניות מתריעים ל-SOC. ה-blast radius: הנתונים של שירות אחד, ובאידיאל של tenant אחד." } },
    { q: { en: "Security groups or NetworkPolicy or service mesh — which one do you need?", he: "Security groups או NetworkPolicy או service mesh — מה מהם צריך?" },
      a: { en: "They answer different questions at different layers, so for sensitive systems all three. SGs control which VMs/nodes and managed services (RDS, ElastiCache) can talk — pods on the same node share the node SG unless you use per-pod SGs. NetworkPolicy controls pod-to-pod by labels at L3/L4. A mesh adds cryptographic workload identity and L7 rules. For a small, low-risk system, SGs + default-deny NetworkPolicy is a solid baseline; add the mesh when you need identity-based authz, mTLS everywhere or L7 rules.", he: "הם עונים על שאלות שונות בשכבות שונות, אז במערכות רגישות — את שלושתם. SGs שולטים על אילו VMs/nodes ושירותים מנוהלים (RDS, ElastiCache) מדברים — pods על אותו node חולקים את ה-SG של ה-node אלא אם משתמשים ב-SGs פר-pod. NetworkPolicy שולטת על pod-to-pod לפי labels ב-L3/L4. Mesh מוסיף זהות workload קריפטוגרפית וחוקי L7. למערכת קטנה ובסיכון נמוך, SGs + NetworkPolicy של default-deny הם baseline טוב; מוסיפים mesh כשצריך authz מבוסס זהות, mTLS בכל מקום או חוקי L7." } }
  ],
  quiz: [
    { q: { en: "What is the key difference between a security group and a NACL?", he: "מה ההבדל המרכזי בין security group ל-NACL?" },
      options: [
        { en: "SGs are stateful and allow-only; NACLs are stateless, ordered, and need return-traffic rules", he: "SGs הם stateful ורק allow; NACLs הם stateless, מסודרים לפי סדר, וצריכים חוקים לתעבורת החזרה" },
        { en: "NACLs are attached to pods", he: "NACLs מוצמדים ל-pods" },
        { en: "SGs only work over IPv6", he: "SGs עובדים רק ב-IPv6" },
        { en: "There is no difference", he: "אין הבדל" }
      ], answer: 0,
      explain: { en: "Because NACLs are stateless you must allow ephemeral return ports explicitly; that's why they're used as coarse guardrails.", he: "בגלל ש-NACLs הם stateless צריך לאפשר במפורש את ה-ephemeral ports של החזרה; לכן משתמשים בהם כמעקות גסים." } },
    { q: { en: "You add a default-deny NetworkPolicy (Ingress+Egress) and every service starts timing out. The most likely missing rule?", he: "הוספת NetworkPolicy של default-deny (Ingress+Egress) וכל השירותים התחילו לעשות timeout. איזה חוק כנראה חסר?" },
      options: [
        { en: "An ingress rule for the API server", he: "חוק ingress ל-API server" },
        { en: "Egress to kube-dns on port 53", he: "Egress ל-kube-dns בפורט 53" },
        { en: "A rule for ICMP", he: "חוק ל-ICMP" },
        { en: "Nothing, the CNI is broken", he: "כלום, ה-CNI שבור" }
      ], answer: 1,
      explain: { en: "Name resolution is the first thing every client does; without DNS egress nothing resolves.", he: "רזולוציית שמות היא הדבר הראשון שכל לקוח עושה; בלי egress ל-DNS שום דבר לא נפתר." } },
    { q: { en: "Why add an endpoint policy to an S3 VPC endpoint?", he: "למה להוסיף endpoint policy ל-VPC endpoint של S3?" },
      options: [
        { en: "To make S3 faster", he: "כדי ש-S3 יהיה מהיר יותר" },
        { en: "Without it, stolen credentials can copy data to any bucket — including the attacker's — through your private path", he: "בלעדיה, credentials גנובים יכולים להעתיק נתונים לכל bucket — כולל של התוקף — דרך הנתיב הפרטי שלכם" },
        { en: "It is required for HTTPS", he: "זה נדרש ל-HTTPS" },
        { en: "To enable versioning", he: "כדי להפעיל versioning" }
      ], answer: 1,
      explain: { en: "Private endpoints remove the internet path; the endpoint policy restricts which buckets that path can reach.", he: "Private endpoints מורידים את הנתיב דרך האינטרנט; ה-endpoint policy מגביל לאילו buckets הנתיב הזה יכול להגיע." } },
    { q: { en: "Which control turns 'is the caller on the right network?' into 'is the caller the right workload?'", he: "איזו בקרה הופכת את 'האם הקורא ברשת הנכונה?' ל-'האם הקורא הוא ה-workload הנכון?'" },
      options: [
        { en: "NACL", he: "NACL" },
        { en: "Route table", he: "Route table" },
        { en: "Mesh mTLS + AuthorizationPolicy on SPIFFE identities", he: "mTLS של mesh + AuthorizationPolicy על זהויות SPIFFE" },
        { en: "NAT gateway", he: "NAT gateway" }
      ], answer: 2,
      explain: { en: "Identity-based authorization is the core of zero trust between services; IPs are just a hint.", he: "הרשאה מבוססת זהות היא הליבה של zero trust בין שירותים; IPs הם רק רמז." } }
  ],
  related: ["net-isolation", "net-firewalls", "net-vpc", "k8s-security-policy", "staff-service-mesh", "staff-zero-trust-secrets", "staff-ebpf-cilium", "pr-network-plan", "pr-tenant-isolation-deep"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-tenant-isolation-deep",
  track: "principal",
  order: 92,
  icon: "🏢",
  level: 3,
  minutes: 18,
  title: { en: "Tenant Isolation in Depth: Enforce It Everywhere, Then Try to Break It", he: "בידוד tenants לעומק: לאכוף בכל מקום, ואז לנסות לשבור" },
  tldr: {
    en: "Carry a verified tenant id from the token to every store (DB via RLS, cache keys, object prefixes, indexes, topics, keys), pick a compute isolation level per tier, and keep an automated test that tries tenant A's token on tenant B's data — forever.",
    he: "מעבירים tenant id מאומת מה-token לכל store (DB דרך RLS, מפתחות cache, prefixes של אובייקטים, אינדקסים, topics, מפתחות הצפנה), בוחרים רמת בידוד compute לכל tier, ומחזיקים בדיקה אוטומטית שמנסה את ה-token של tenant A על הנתונים של tenant B — לתמיד."
  },
  analogy: {
    en: "A storage-unit company. The pool model is one big warehouse with numbered cages — cheap, but every cage lock must be perfect, and one forklift operator who grabs the wrong cage leaks a customer's belongings. Silo is a separate building per customer — expensive, but a mistake in one building can't touch another. Row-level security is a lock on every cage that checks your badge, so even an employee who walks into the wrong aisle can't open it. The cross-tenant test is the mystery shopper who rents cage 17 and every night tries to open cage 18.",
    he: "חברת מחסני אחסון. מודל ה-pool הוא מחסן ענק אחד עם כלובים ממוספרים — זול, אבל כל מנעול כלוב חייב להיות מושלם, ומפעיל מלגזה אחד שלוקח את הכלוב הלא נכון מדליף חפצים של לקוח. Silo הוא בניין נפרד לכל לקוח — יקר, אבל טעות בבניין אחד לא נוגעת באחר. Row-level security הוא מנעול על כל כלוב שבודק את התג שלך, כך שגם עובד שנכנס למעבר הלא נכון לא יכול לפתוח. הבדיקה בין tenants היא הלקוח הסמוי ששוכר את כלוב 17 ובכל לילה מנסה לפתוח את כלוב 18."
  },
  sections: [
    {
      h: { en: "Tenant context: one source of truth, carried everywhere", he: "Tenant context: מקור אמת אחד, שעובר לכל מקום" },
      body: {
        en: `<p>The #1 cross-tenant bug is taking the tenant id from the wrong place — a URL parameter, a header or a request body the client controls. The tenant must come from the <strong>verified token</strong> (or the authenticated session), be set once at the edge, and flow implicitly everywhere.</p>
<pre>// Express + AsyncLocalStorage (Node)
import { AsyncLocalStorage } from "node:async_hooks";
export const ctx = new AsyncLocalStorage();

app.use(async (req, res, next) =&gt; {
  const claims = await verifyJwt(req.headers.authorization);
  const tenantId = claims["tenant_id"];   // NOT req.query
  if (!tenantId) return res.status(401).end();
  ctx.run({ tenantId, userId: claims.sub }, next);
});

export const tenant = () =&gt; ctx.getStore().tenantId;</pre>
<ul>
<li>If the URL also contains a tenant (<code>/t/acme/invoices</code>), <strong>compare</strong> it to the token's tenant and return 404 on mismatch — don't use it.</li>
<li>Propagate across async hops: put <code>tenant_id</code> in message headers/envelopes, trace baggage and job payloads, and re-verify in the consumer (the consumer re-establishes context from the message, not from a global).</li>
<li>Admin/support tools that act "as" a tenant need an explicit, audited impersonation flow — never a magic header.</li>
</ul>
<blockquote>💡 Real world: Most real SaaS cross-tenant leaks reported publicly come from IDOR-style bugs — an object fetched by id without checking it belongs to the caller's tenant — and from cached responses keyed without the tenant. Both are prevented by defaults, not by code review.</blockquote>`,
        he: `<p>באג ה-cross-tenant מספר 1 הוא לקחת את ה-tenant id מהמקום הלא נכון — פרמטר ב-URL, header או body שהלקוח שולט בהם. ה-tenant חייב להגיע מה-<strong>token המאומת</strong> (או מה-session המאומת), להיקבע פעם אחת ב-edge, ולזרום באופן מובלע לכל מקום.</p>
<pre>// Express + AsyncLocalStorage (Node)
import { AsyncLocalStorage } from "node:async_hooks";
export const ctx = new AsyncLocalStorage();

app.use(async (req, res, next) =&gt; {
  const claims = await verifyJwt(req.headers.authorization);
  const tenantId = claims["tenant_id"];   // NOT req.query
  if (!tenantId) return res.status(401).end();
  ctx.run({ tenantId, userId: claims.sub }, next);
});

export const tenant = () =&gt; ctx.getStore().tenantId;</pre>
<ul>
<li>אם גם ה-URL מכיל tenant (<code>/t/acme/invoices</code>), <strong>משווים</strong> אותו ל-tenant שב-token ומחזירים 404 אם אין התאמה — לא משתמשים בו.</li>
<li>מעבירים את ההקשר דרך קפיצות אסינכרוניות: שמים <code>tenant_id</code> ב-headers/מעטפות של הודעות, ב-baggage של ה-trace וב-payload של jobs, ומאמתים מחדש ב-consumer (ה-consumer בונה את ההקשר מחדש מתוך ההודעה, לא ממשתנה גלובלי).</li>
<li>כלי admin/support שפועלים "בתור" tenant צריכים תהליך impersonation מפורש שנרשם ב-audit — אף פעם לא header קסם.</li>
</ul>
<blockquote>💡 מהשטח: רוב הדליפות בין tenants ב-SaaS שדווחו בפומבי באות מבאגים בסגנון IDOR — אובייקט שנשלף לפי id בלי לבדוק שהוא שייך ל-tenant של הקורא — ומתשובות שנשמרו ב-cache בלי ה-tenant במפתח. את שניהם מונעים עם ברירות מחדל, לא עם code review.</blockquote>`
      }
    },
    {
      h: { en: "Postgres Row-Level Security, done right", he: "Row-Level Security ב-Postgres, כמו שצריך" },
      body: {
        en: `<p>RLS makes the database enforce <code>tenant_id = current tenant</code> on every query, so a forgotten <code>WHERE</code> returns zero rows instead of everyone's data.</p>
<pre>CREATE ROLE app_rw LOGIN NOBYPASSRLS;   -- app never owns tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;  -- owner too

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id =
         current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id =
         current_setting('app.tenant_id', true)::uuid);

-- per request, inside the transaction:
BEGIN;
SET LOCAL app.tenant_id = '6f1c2a9e-...';
SELECT * FROM invoices WHERE id = 42;  -- only this tenant
COMMIT;</pre>
<table>
<tr><th>Pitfall</th><th>What happens</th><th>Fix</th></tr>
<tr><td>App connects as superuser / table owner</td><td>Superusers and BYPASSRLS roles skip policies; owners skip unless FORCE</td><td>Dedicated NOBYPASSRLS role + FORCE RLS</td></tr>
<tr><td><code>SET</code> instead of <code>SET LOCAL</code> with a pool</td><td>The setting survives on the pooled connection → next request runs as the previous tenant</td><td><code>SET LOCAL</code> inside a transaction (or <code>set_config(..., true)</code>); reset on checkout</td></tr>
<tr><td>Missing setting</td><td><code>current_setting(..., true)</code> returns NULL → policy matches nothing (safe) — but errors if you omit <code>true</code></td><td>Keep the safe default; alert on queries with no tenant</td></tr>
<tr><td>Views / SECURITY DEFINER functions</td><td>Run with the owner's rights → can bypass RLS</td><td><code>security_invoker = true</code> on views (PG15+)</td></tr>
<tr><td>Migrations, analytics, backfills</td><td>Run as a privileged role and see everything</td><td>Separate audited role, never reachable from the app</td></tr>
</table>
<blockquote>⚠️ Production tip: PgBouncer in transaction mode + <code>SET LOCAL</code> is safe; session-level <code>SET</code> with transaction pooling is a cross-tenant leak waiting to happen. Put a test in CI that runs two tenants concurrently through the real pool.</blockquote>`,
        he: `<p>RLS גורם ל-database לאכוף <code>tenant_id = current tenant</code> על כל query, כך ש-<code>WHERE</code> שנשכח מחזיר אפס שורות במקום את הנתונים של כולם.</p>
<pre>CREATE ROLE app_rw LOGIN NOBYPASSRLS;   -- app never owns tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;  -- owner too

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id =
         current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id =
         current_setting('app.tenant_id', true)::uuid);

-- per request, inside the transaction:
BEGIN;
SET LOCAL app.tenant_id = '6f1c2a9e-...';
SELECT * FROM invoices WHERE id = 42;  -- only this tenant
COMMIT;</pre>
<table>
<tr><th>מלכודת</th><th>מה קורה</th><th>תיקון</th></tr>
<tr><td>האפליקציה מתחברת כ-superuser / בעלים של הטבלה</td><td>Superusers ו-roles עם BYPASSRLS מדלגים על policies; בעלים מדלגים אלא אם יש FORCE</td><td>role ייעודי עם NOBYPASSRLS + FORCE RLS</td></tr>
<tr><td><code>SET</code> במקום <code>SET LOCAL</code> עם pool</td><td>ההגדרה שורדת על ה-connection ב-pool ← הבקשה הבאה רצה בתור ה-tenant הקודם</td><td><code>SET LOCAL</code> בתוך טרנזקציה (או <code>set_config(..., true)</code>); איפוס ב-checkout</td></tr>
<tr><td>ההגדרה חסרה</td><td><code>current_setting(..., true)</code> מחזיר NULL ← ה-policy לא מתאים לכלום (בטוח) — אבל זורק שגיאה אם משמיטים את ה-<code>true</code></td><td>שומרים על ברירת המחדל הבטוחה; מתריעים על queries בלי tenant</td></tr>
<tr><td>Views / פונקציות SECURITY DEFINER</td><td>רצות עם ההרשאות של הבעלים ← יכולות לעקוף RLS</td><td><code>security_invoker = true</code> על views ‏(PG15+)</td></tr>
<tr><td>Migrations, אנליטיקה, backfills</td><td>רצים כ-role עם הרשאות ורואים הכול</td><td>role נפרד עם audit, שאף פעם לא נגיש מהאפליקציה</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: PgBouncer במצב transaction + <code>SET LOCAL</code> זה בטוח; <code>SET</code> ברמת session עם transaction pooling הוא דליפה בין tenants שמחכה לקרות. שים בדיקה ב-CI שמריצה שני tenants במקביל דרך ה-pool האמיתי.</blockquote>`
      }
    },
    {
      h: { en: "Every other store: cache, objects, search, queues, keys", he: "כל שאר ה-stores: cache, אובייקטים, חיפוש, תורים, מפתחות" },
      body: {
        en: `<table>
<tr><th>Store</th><th>Isolation technique</th><th>Example</th></tr>
<tr><td>Cache (Redis)</td><td>Tenant in every key (via a wrapper, not by hand); per-tenant memory limits for big tenants</td><td><code>t:6f1c:invoice:42</code></td></tr>
<tr><td>CDN / HTTP cache</td><td>Never cache authenticated responses publicly; <code>Cache-Control: private</code>, or tenant in the cache key</td><td><code>Vary: Authorization</code></td></tr>
<tr><td>Object storage</td><td>Prefix per tenant + IAM condition on session tag; or bucket per tenant for silo tier</td><td><code>s3://docs/tenant=6f1c/...</code></td></tr>
<tr><td>Search</td><td>Index per tenant (big) or shared index + mandatory filter via filtered alias</td><td>alias <code>t-6f1c</code> with <code>term: {tenant_id}</code></td></tr>
<tr><td>Queues / topics</td><td>tenant_id in envelope; topic per tier; ACLs; per-tenant consumer quotas</td><td>Kafka key = tenant_id for ordering</td></tr>
<tr><td>Encryption keys</td><td>KEK per tenant (or per tier) in KMS → crypto-shredding, BYOK for enterprise</td><td><code>alias/tenant-6f1c</code></td></tr>
</table>
<p>Object storage with attribute-based access — the service assumes a role with a session tag, and the policy only allows that tenant's prefix:</p>
<pre>{ "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource":
   "arn:aws:s3:::docs/tenant=\${aws:PrincipalTag/tenant}/*" }
# sts:AssumeRole ... --tags Key=tenant,Value=6f1c
# a bug that builds the wrong prefix gets AccessDenied</pre>
<blockquote>💡 Real world: AWS's SaaS Lens calls this "tenant isolation through scoped credentials": even if the application code is wrong, the credential it holds physically can't read another tenant's objects. It's the storage equivalent of RLS.</blockquote>`,
        he: `<table>
<tr><th>Store</th><th>טכניקת בידוד</th><th>דוגמה</th></tr>
<tr><td>Cache (Redis)</td><td>tenant בכל מפתח (דרך wrapper, לא ביד); מגבלות זיכרון פר-tenant ל-tenants גדולים</td><td><code>t:6f1c:invoice:42</code></td></tr>
<tr><td>CDN / HTTP cache</td><td>אף פעם לא שומרים תשובות מאומתות ב-cache ציבורי; <code>Cache-Control: private</code>, או tenant במפתח ה-cache</td><td><code>Vary: Authorization</code></td></tr>
<tr><td>Object storage</td><td>prefix לכל tenant + תנאי IAM על session tag; או bucket לכל tenant ב-tier של silo</td><td><code>s3://docs/tenant=6f1c/...</code></td></tr>
<tr><td>חיפוש</td><td>index לכל tenant (גדולים) או index משותף + פילטר חובה דרך filtered alias</td><td>alias <code>t-6f1c</code> עם <code>term: {tenant_id}</code></td></tr>
<tr><td>תורים / topics</td><td>tenant_id במעטפה; topic לכל tier; ACLs; quotas פר-tenant ל-consumers</td><td>ב-Kafka: key = tenant_id בשביל סדר</td></tr>
<tr><td>מפתחות הצפנה</td><td>KEK לכל tenant (או tier) ב-KMS ← crypto-shredding, BYOK ל-enterprise</td><td><code>alias/tenant-6f1c</code></td></tr>
</table>
<p>Object storage עם הרשאות מבוססות attributes — השירות עושה assume ל-role עם session tag, וה-policy מרשה רק את ה-prefix של אותו tenant:</p>
<pre>{ "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource":
   "arn:aws:s3:::docs/tenant=\${aws:PrincipalTag/tenant}/*" }
# sts:AssumeRole ... --tags Key=tenant,Value=6f1c
# a bug that builds the wrong prefix gets AccessDenied</pre>
<blockquote>💡 מהשטח: ה-SaaS Lens של AWS קורא לזה "tenant isolation through scoped credentials": גם אם קוד האפליקציה שגוי, ה-credential שהוא מחזיק פיזית לא יכול לקרוא אובייקטים של tenant אחר. זה המקבילה של RLS בעולם האחסון.</blockquote>`
      }
    },
    {
      h: { en: "Compute isolation spectrum and noisy neighbors", he: "ספקטרום בידוד ה-compute ושכנים רועשים" },
      body: {
        en: `<table>
<tr><th>Level</th><th>What's shared</th><th>Cost</th><th>Typical tier</th></tr>
<tr><td>Shared pods (pool)</td><td>Process, memory, node</td><td>$</td><td>Free / SMB</td></tr>
<tr><td>Namespace + ResourceQuota + NetworkPolicy</td><td>Nodes, kernel, control plane</td><td>$$</td><td>Pro</td></tr>
<tr><td>Dedicated node pool (taints/tolerations)</td><td>Kernel per node is theirs; control plane shared</td><td>$$$</td><td>Enterprise</td></tr>
<tr><td>Sandboxed runtime (gVisor, Kata, Firecracker)</td><td>Hardware only; separate guest kernel / user-space kernel</td><td>$$ + overhead</td><td>Untrusted code (CI runners, notebooks, plugins)</td></tr>
<tr><td>vCluster (virtual control plane)</td><td>Host nodes; own API server</td><td>$$$</td><td>Tenants that need their own CRDs/admin</td></tr>
<tr><td>Dedicated cluster / account (silo)</td><td>Nothing but the vendor</td><td>$$$$</td><td>Regulated / largest customers</td></tr>
</table>
<p>Running customer-supplied code (CI jobs, functions, AI agents executing tools) in shared kernels is the risky case: a container escape becomes a cross-tenant breach. AWS Lambda and Fargate run each tenant in Firecracker microVMs (~125 ms boot, ~5 MB overhead) for exactly this reason.</p>
<pre>apiVersion: v1
kind: ResourceQuota
metadata: { name: tenant-quota, namespace: t-6f1c }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 64Gi
    pods: "200"
---
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: gvisor }
handler: runsc     # pods set runtimeClassName: gvisor</pre>
<p><strong>Noisy neighbors</strong> are an isolation failure too — of performance. Controls: per-tenant rate limits and concurrency limits at the gateway, weighted fair queuing in workers (one tenant's 1 M-job import can't starve everyone), per-tenant DB statement timeouts, shard/cell placement that moves whales to their own cells, and per-tenant SLO dashboards so you see it before they call.</p>`,
        he: `<table>
<tr><th>רמה</th><th>מה משותף</th><th>עלות</th><th>tier טיפוסי</th></tr>
<tr><td>pods משותפים (pool)</td><td>Process, זיכרון, node</td><td>$</td><td>Free / SMB</td></tr>
<tr><td>Namespace + ResourceQuota + NetworkPolicy</td><td>Nodes, kernel, control plane</td><td>$$</td><td>Pro</td></tr>
<tr><td>Node pool ייעודי (taints/tolerations)</td><td>ה-kernel בכל node שלהם; ה-control plane משותף</td><td>$$$</td><td>Enterprise</td></tr>
<tr><td>Runtime מבודד (gVisor, Kata, Firecracker)</td><td>רק החומרה; guest kernel נפרד / kernel ב-user-space</td><td>$$ + overhead</td><td>קוד לא מהימן (CI runners, notebooks, plugins)</td></tr>
<tr><td>vCluster (control plane וירטואלי)</td><td>ה-nodes של ה-host; API server משלהם</td><td>$$$</td><td>tenants שצריכים CRDs/admin משלהם</td></tr>
<tr><td>Cluster / account ייעודי (silo)</td><td>שום דבר חוץ מהספק</td><td>$$$$</td><td>לקוחות רגולטוריים / הכי גדולים</td></tr>
</table>
<p>הרצת קוד שהלקוח מספק (CI jobs, functions, AI agents שמריצים tools) על kernels משותפים היא המקרה המסוכן: container escape הופך לפריצה בין tenants. AWS Lambda ו-Fargate מריצים כל tenant ב-microVMs של Firecracker (‏~125 ms לאתחול, ~5 MB overhead) בדיוק מהסיבה הזו.</p>
<pre>apiVersion: v1
kind: ResourceQuota
metadata: { name: tenant-quota, namespace: t-6f1c }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 64Gi
    pods: "200"
---
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata: { name: gvisor }
handler: runsc     # pods set runtimeClassName: gvisor</pre>
<p><strong>שכנים רועשים</strong> הם גם כשל בידוד — של ביצועים. בקרות: rate limits ו-concurrency limits פר-tenant ב-gateway, weighted fair queuing ב-workers (import של מיליון jobs של tenant אחד לא מרעיב את כולם), statement timeouts פר-tenant ב-DB, מיקום ב-shards/cells שמעביר את הלווייתנים ל-cells משלהם, ודשבורדים של SLO פר-tenant כדי לראות את זה לפני שהם מתקשרים.</p>`
      }
    },
    {
      h: { en: "Prove it: cross-tenant tests, canaries and audit", he: "להוכיח: בדיקות בין tenants, canaries ו-audit" },
      body: {
        en: `<p>Isolation regresses silently: a new endpoint, a new cache, a new background job. Make the attack part of the test suite:</p>
<pre># pytest — runs for EVERY route in the OpenAPI spec
@pytest.mark.parametrize("route", openapi_routes_with_ids())
def test_cross_tenant_denied(route, tenant_a, tenant_b):
    obj = create_resource(tenant_b, route.resource)
    url = route.path.format(id=obj.id)
    r = client.request(route.method, url,
                       headers=auth(tenant_a))
    # 404, not 403: don't confirm the id exists
    assert r.status_code == 404, f"{route} leaked B to A"

def test_list_never_mixes(tenant_a, tenant_b):
    seed(tenant_a, 3); seed(tenant_b, 5)
    items = client.get("/v1/invoices",
                       headers=auth(tenant_a)).json()
    assert {i["tenant_id"] for i in items} == {tenant_a.id}</pre>
<ul>
<li><strong>Generated coverage</strong>: enumerate routes from the OpenAPI spec so new endpoints are tested automatically; fail CI if a route has no isolation test.</li>
<li><strong>DB-level test</strong>: connect as the app role without setting <code>app.tenant_id</code> and assert every tenant table returns 0 rows; list tables lacking RLS (<code>relrowsecurity = false</code>) and fail.</li>
<li><strong>Canary tenants in prod</strong>: synthetic tenants with unique marker strings; a nightly job searches other tenants' exports, search results and caches for the markers.</li>
<li><strong>Audit</strong>: every log line and audit event carries <code>tenant_id</code> and <code>actor</code>; alert when one request touches more than one tenant id, and on any impersonation session.</li>
</ul>
<blockquote>⚠️ Production tip: Return 404 for another tenant's object, not 403 — 403 confirms the id exists, which leaks information and helps enumeration.</blockquote>`,
        he: `<p>בידוד נסוג בשקט: endpoint חדש, cache חדש, background job חדש. הופכים את המתקפה לחלק מחבילת הבדיקות:</p>
<pre># pytest — runs for EVERY route in the OpenAPI spec
@pytest.mark.parametrize("route", openapi_routes_with_ids())
def test_cross_tenant_denied(route, tenant_a, tenant_b):
    obj = create_resource(tenant_b, route.resource)
    url = route.path.format(id=obj.id)
    r = client.request(route.method, url,
                       headers=auth(tenant_a))
    # 404, not 403: don't confirm the id exists
    assert r.status_code == 404, f"{route} leaked B to A"

def test_list_never_mixes(tenant_a, tenant_b):
    seed(tenant_a, 3); seed(tenant_b, 5)
    items = client.get("/v1/invoices",
                       headers=auth(tenant_a)).json()
    assert {i["tenant_id"] for i in items} == {tenant_a.id}</pre>
<ul>
<li><strong>כיסוי שנוצר אוטומטית</strong>: עוברים על ה-routes מתוך ה-OpenAPI spec כך ש-endpoints חדשים נבדקים אוטומטית; ה-CI נכשל אם ל-route אין בדיקת בידוד.</li>
<li><strong>בדיקה ברמת ה-DB</strong>: מתחברים כ-role של האפליקציה בלי להגדיר <code>app.tenant_id</code> ומוודאים שכל טבלת tenant מחזירה 0 שורות; מוציאים רשימת טבלאות בלי RLS (<code>relrowsecurity = false</code>) ונכשלים.</li>
<li><strong>Canary tenants בפרודקשן</strong>: tenants סינתטיים עם מחרוזות סימון ייחודיות; job לילי מחפש את הסימונים ב-exports, בתוצאות חיפוש וב-caches של tenants אחרים.</li>
<li><strong>Audit</strong>: כל שורת לוג ו-audit event נושאים <code>tenant_id</code> ו-<code>actor</code>; מתריעים כשבקשה אחת נוגעת ביותר מ-tenant id אחד, ועל כל session של impersonation.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מחזירים 404 על אובייקט של tenant אחר, לא 403 — 403 מאשר שה-id קיים, וזה מדליף מידע ועוזר ל-enumeration.</blockquote>`
      }
    }
  ],
  diagram: `Tenant context, end to end

 JWT {sub, tenant_id}  --verify-->  edge middleware
        |  ctx.run({tenantId})   (never from URL/body)
        v
  service code ---------------------------------------
   | DB:     BEGIN; SET LOCAL app.tenant_id=...; (RLS)
   | Cache:  key "t:<tenant>:..."
   | S3:     role w/ session tag -> tenant=<id>/ prefix
   | Search: filtered alias per tenant
   | Queue:  envelope.tenant_id -> consumer re-sets ctx
   | KMS:    KEK alias/tenant-<id>
   ------------------------------------------------------
 CI: for each route: tenant A token on B's object -> 404
 Prod: canary tenants + alert if 1 request touches 2 tenants`,
  handsOn: [
    { cmd: "psql -c \"SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;\"", what: { en: "List tables without RLS enabled — every tenant-scoped table in this list is a gap.", he: "רשימת טבלאות בלי RLS — כל טבלה פר-tenant שמופיעה כאן היא חור." } },
    { cmd: "psql -c \"SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolcanlogin;\"", what: { en: "Check that the role your app logs in with is neither superuser nor BYPASSRLS.", he: "בודקים שה-role שהאפליקציה מתחברת איתו הוא לא superuser ולא BYPASSRLS." } },
    { cmd: "curl -s -o /dev/null -w '%{http_code}\\n' -H \"Authorization: Bearer $TOKEN_TENANT_A\" https://api.example.com/v1/invoices/$INVOICE_ID_OF_TENANT_B", what: { en: "The manual cross-tenant probe: tenant A's token on tenant B's invoice must return 404.", he: "הבדיקה הידנית בין tenants: ה-token של tenant A על חשבונית של tenant B חייב להחזיר 404." } },
    { cmd: "redis-cli --scan --pattern '*' | grep -v '^t:' | head", what: { en: "Find cache keys that don't start with the tenant prefix — each is a potential cross-tenant cache hit.", he: "מוצאים מפתחות cache שלא מתחילים ב-prefix של tenant — כל אחד מהם הוא פוטנציאל ל-cache hit בין tenants." } }
  ],
  mnemonic: {
    en: "\"Token → Context → Every store → Test the attack.\" The tenant comes from the token, never from the URL; and every night, tenant A tries to open tenant B's door.",
    he: "\"Token → Context → כל store → לבדוק את המתקפה.\" ה-tenant מגיע מה-token, אף פעם לא מה-URL; ובכל לילה tenant A מנסה לפתוח את הדלת של tenant B."
  },
  pitfalls: [
    { en: "Using session-level SET app.tenant_id with a connection pool. The value sticks to the connection and the next request — from another tenant — inherits it. Use SET LOCAL inside the transaction.", he: "להשתמש ב-SET app.tenant_id ברמת session עם connection pool. הערך נדבק ל-connection והבקשה הבאה — מ-tenant אחר — יורשת אותו. משתמשים ב-SET LOCAL בתוך הטרנזקציה." },
    { en: "Background jobs and consumers that run 'as the system' without tenant context, then write results to the wrong tenant. Every job payload carries tenant_id and the worker re-establishes context before touching data.", he: "Background jobs ו-consumers שרצים 'בתור המערכת' בלי tenant context, ואז כותבים תוצאות ל-tenant הלא נכון. כל payload של job נושא tenant_id וה-worker בונה מחדש את ההקשר לפני שהוא נוגע בנתונים." },
    { en: "Caching an authenticated API response at the CDN or in a shared in-memory cache keyed only by URL. The next tenant hitting the same URL gets the previous tenant's data.", he: "לשמור תשובת API מאומתת ב-cache של ה-CDN או ב-cache משותף בזיכרון עם מפתח רק לפי URL. ה-tenant הבא שמגיע לאותו URL מקבל את הנתונים של ה-tenant הקודם." },
    { en: "Analytics and ML pipelines that copy all tenants' data into one warehouse with broad access. Isolation in the product means little if a data scientist's notebook can join every customer.", he: "Pipelines של אנליטיקה ו-ML שמעתיקים את הנתונים של כל ה-tenants ל-warehouse אחד עם גישה רחבה. בידוד במוצר לא שווה הרבה אם notebook של data scientist יכול לעשות join על כל הלקוחות." }
  ],
  interview: [
    { q: { en: "You're moving a single-tenant app to a pooled multi-tenant SaaS. What are your isolation guardrails?", he: "אתה מעביר אפליקציה single-tenant ל-SaaS מרובה tenants במודל pool. מה מעקות הבידוד שלך?" },
      a: { en: "Tenant from the verified token only, set once in middleware and propagated via context (including queue envelopes). tenant_id column on every tenant table with Postgres RLS (FORCE, NOBYPASSRLS app role, SET LOCAL per transaction). Tenant prefix enforced by wrappers for cache keys, object paths with ABAC session-tagged roles, filtered search aliases. Per-tenant KEKs for crypto-shredding. Gateway rate limits per tenant and fair queuing in workers. A generated cross-tenant test per route, a DB test that fails on tables without RLS, canary tenants in prod, and tenant_id on every log/audit line. Offer silo (own DB/cluster) as a paid tier for regulated customers.", he: "Tenant רק מה-token המאומת, נקבע פעם אחת ב-middleware ומועבר דרך context (כולל מעטפות של תורים). עמודת tenant_id בכל טבלת tenant עם RLS ב-Postgres ‏(FORCE, role של האפליקציה עם NOBYPASSRLS, SET LOCAL בכל טרנזקציה). prefix של tenant נאכף ע\"י wrappers למפתחות cache, נתיבי אובייקטים עם roles מתויגים ב-ABAC, ו-filtered aliases בחיפוש. KEKs פר-tenant בשביל crypto-shredding. rate limits פר-tenant ב-gateway ו-fair queuing ב-workers. בדיקת cross-tenant שנוצרת לכל route, בדיקת DB שנכשלת על טבלאות בלי RLS, canary tenants בפרודקשן, ו-tenant_id על כל שורת לוג/audit. מציעים silo ‏(DB/cluster משלהם) כ-tier בתשלום ללקוחות רגולטוריים." } },
    { q: { en: "When would you choose gVisor or Firecracker over plain containers?", he: "מתי תבחר ב-gVisor או Firecracker על פני קונטיינרים רגילים?" },
      a: { en: "When the code running is not yours: customer-supplied functions, CI jobs, notebooks, plugins, LLM agents executing tools. Plain containers share the host kernel, so one kernel exploit is a cross-tenant breach. gVisor intercepts syscalls in a user-space kernel (some I/O overhead, easy RuntimeClass switch); Firecracker/Kata give each workload its own lightweight VM with a hardware boundary. For first-party, trusted services the overhead usually isn't worth it.", he: "כשהקוד שרץ הוא לא שלך: functions שהלקוח מספק, CI jobs, notebooks, plugins, LLM agents שמריצים tools. קונטיינרים רגילים חולקים את ה-kernel של ה-host, אז exploit אחד ב-kernel הוא פריצה בין tenants. gVisor מיירט syscalls ב-kernel שרץ ב-user-space (קצת overhead ב-I/O, החלפה קלה דרך RuntimeClass); Firecracker/Kata נותנים לכל workload VM קל משלו עם גבול חומרה. לשירותים פנימיים ומהימנים בדרך כלל ה-overhead לא שווה את זה." } }
  ],
  quiz: [
    { q: { en: "Where must the tenant id come from?", he: "מאיפה חייב להגיע ה-tenant id?" },
      options: [
        { en: "A query parameter, for flexibility", he: "מ-query parameter, בשביל גמישות" },
        { en: "The verified token or authenticated session", he: "מה-token המאומת או מה-session המאומת" },
        { en: "The X-Tenant header the client sends", he: "מה-header ‏X-Tenant שהלקוח שולח" },
        { en: "The request body", he: "מה-body של הבקשה" }
      ], answer: 1,
      explain: { en: "Anything the client controls can be changed by the client. The tenant is an authorization fact, so it comes from the credential.", he: "כל מה שהלקוח שולט בו הלקוח יכול לשנות. ה-tenant הוא עובדת הרשאה, אז הוא מגיע מה-credential." } },
    { q: { en: "Your app uses RLS, but a query returned another tenant's rows. Which is a likely cause?", he: "האפליקציה משתמשת ב-RLS, אבל query החזיר שורות של tenant אחר. מה סיבה סבירה?" },
      options: [
        { en: "The app connects as the table owner without FORCE ROW LEVEL SECURITY, or with a BYPASSRLS role", he: "האפליקציה מתחברת כבעלים של הטבלה בלי FORCE ROW LEVEL SECURITY, או עם role של BYPASSRLS" },
        { en: "RLS doesn't work with UUIDs", he: "RLS לא עובד עם UUIDs" },
        { en: "The table has an index", he: "לטבלה יש אינדקס" },
        { en: "The query used LIMIT", he: "ה-query השתמש ב-LIMIT" }
      ], answer: 0,
      explain: { en: "Owners skip policies unless FORCE is set, and superusers/BYPASSRLS always skip them. (A pooled session-level SET is the other classic.)", he: "בעלים מדלגים על policies אלא אם יש FORCE, ו-superusers/BYPASSRLS תמיד מדלגים. (SET ברמת session עם pool הוא הקלאסיקה השנייה.)" } },
    { q: { en: "What should the API return when tenant A requests tenant B's object by id?", he: "מה ה-API צריך להחזיר כש-tenant A מבקש אובייקט של tenant B לפי id?" },
      options: [
        { en: "200 with the object", he: "200 עם האובייקט" },
        { en: "403 Forbidden", he: "403 Forbidden" },
        { en: "404 Not Found", he: "404 Not Found" },
        { en: "500", he: "500" }
      ], answer: 2,
      explain: { en: "From tenant A's point of view the object doesn't exist; 403 would confirm it does.", he: "מנקודת המבט של tenant A האובייקט לא קיים; 403 היה מאשר שהוא קיים." } },
    { q: { en: "Which workload most needs a sandboxed runtime (gVisor/Firecracker)?", he: "לאיזה workload הכי צריך runtime מבודד (gVisor/Firecracker)?" },
      options: [
        { en: "Your own internal billing service", he: "שירות ה-billing הפנימי שלכם" },
        { en: "Customer-submitted code in a shared CI runner fleet", he: "קוד שלקוחות שולחים ב-fleet משותף של CI runners" },
        { en: "A static website", he: "אתר סטטי" },
        { en: "A Redis cache", he: "cache של Redis" }
      ], answer: 1,
      explain: { en: "Untrusted code + shared kernel = one exploit away from a cross-tenant breach.", he: "קוד לא מהימן + kernel משותף = exploit אחד מפריצה בין tenants." } }
  ],
  related: ["pr-multi-tenancy", "pr-auth", "pr-network-isolation-deep", "pr-data-security", "pr-applied-crypto-pki", "staff-cells-blast-radius", "pr-rate-limiters", "flow-tenant-onboarding"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-data-security",
  track: "principal",
  order: 93,
  icon: "🗝️",
  level: 3,
  minutes: 16,
  title: { en: "Data Security: Classify, Encrypt, Tokenize, Govern, Delete", he: "אבטחת מידע: לסווג, להצפין, לעשות טוקניזציה, לנהל גישה, למחוק" },
  tldr: {
    en: "Classify data first, because the class decides everything else: which encryption layer (disk is not enough), whether to tokenize it out of your systems, who may access it and for how long, how it's masked outside prod, and when it must be deleted — everywhere, including backups.",
    he: "קודם מסווגים את המידע, כי הסיווג קובע את כל השאר: איזו שכבת הצפנה (דיסק זה לא מספיק), האם להוציא אותו מהמערכות בעזרת טוקניזציה, מי מורשה לגשת ולכמה זמן, איך מסווים אותו מחוץ לפרודקשן, ומתי הוא חייב להימחק — בכל מקום, כולל גיבויים."
  },
  analogy: {
    en: "A hospital. Brochures in the lobby are public; staff schedules are internal; patient files are confidential; the narcotics cabinet is restricted. Each gets a different lock, a different list of who can open it, and a log. Tokenization is giving the pharmacy a numbered claim ticket instead of the patient's full file. JIT access is the nurse who gets the cabinet key for one shift and returns it, and break-glass is the red emergency box: anyone can open it in a crisis, but an alarm rings and someone reviews it in the morning.",
    he: "בית חולים. העלונים בלובי ציבוריים; לוחות המשמרות פנימיים; תיקי המטופלים חסויים; ארון הסמים מוגבל. לכל אחד מנעול אחר, רשימה אחרת של מי מורשה לפתוח, ולוג. טוקניזציה היא לתת לבית המרקחת כרטיס עם מספר במקום התיק המלא של המטופל. JIT access היא האחות שמקבלת את מפתח הארון למשמרת אחת ומחזירה אותו, ו-break-glass היא הקופסה האדומה לחירום: כל אחד יכול לפתוח במשבר, אבל אזעקה מצלצלת ומישהו בודק את זה בבוקר."
  },
  sections: [
    {
      h: { en: "Classification drives every other control", he: "הסיווג קובע את כל שאר הבקרות" },
      body: {
        en: `<table>
<tr><th>Class</th><th>Examples</th><th>Encryption</th><th>Access</th><th>Non-prod</th><th>Logs</th></tr>
<tr><td>Public</td><td>Docs, pricing</td><td>In transit</td><td>Anyone</td><td>OK</td><td>OK</td></tr>
<tr><td>Internal</td><td>Runbooks, metrics</td><td>At rest + transit</td><td>Employees (SSO)</td><td>OK</td><td>OK</td></tr>
<tr><td>Confidential</td><td>Customer data, emails, contracts</td><td>+ per-tenant keys</td><td>Role-based, need-to-know</td><td>Masked / synthetic</td><td>IDs only</td></tr>
<tr><td>Restricted</td><td>Card numbers, health, gov IDs, secrets</td><td>Field-level / tokenized</td><td>JIT, approved, recorded</td><td>Never</td><td>Never</td></tr>
</table>
<p>Make the class machine-readable so controls can be automated: tag columns in the schema (<code>COMMENT ON COLUMN users.ssn IS 'class=restricted'</code>, dbt meta, Atlan/DataHub tags), tag buckets and topics, and let scanners (Amazon Macie, Google DLP, Microsoft Purview) find restricted data where it shouldn't be.</p>
<blockquote>💡 Real world: The cheapest restricted data is the data you don't store. Card numbers handed to Stripe/Adyen via hosted fields never touch your servers — your PCI scope shrinks from hundreds of controls (SAQ D) to a short questionnaire (SAQ A).</blockquote>`,
        he: `<table>
<tr><th>סיווג</th><th>דוגמאות</th><th>הצפנה</th><th>גישה</th><th>מחוץ ל-prod</th><th>לוגים</th></tr>
<tr><td>Public</td><td>תיעוד, מחירון</td><td>In transit</td><td>כולם</td><td>בסדר</td><td>בסדר</td></tr>
<tr><td>Internal</td><td>Runbooks, metrics</td><td>At rest + transit</td><td>עובדים (SSO)</td><td>בסדר</td><td>בסדר</td></tr>
<tr><td>Confidential</td><td>נתוני לקוחות, מיילים, חוזים</td><td>+ מפתחות פר-tenant</td><td>לפי role, need-to-know</td><td>ממוסך / סינתטי</td><td>רק IDs</td></tr>
<tr><td>Restricted</td><td>מספרי כרטיס, מידע רפואי, ת"ז, סודות</td><td>ברמת שדה / טוקניזציה</td><td>JIT, באישור, מוקלט</td><td>אף פעם</td><td>אף פעם</td></tr>
</table>
<p>הופכים את הסיווג לקריא למכונה כדי שאפשר יהיה לאטמט בקרות: מתייגים עמודות בסכמה (<code>COMMENT ON COLUMN users.ssn IS 'class=restricted'</code>, dbt meta, תגיות ב-Atlan/DataHub), מתייגים buckets ו-topics, ונותנים לסורקים (Amazon Macie, Google DLP, Microsoft Purview) למצוא מידע restricted איפה שהוא לא אמור להיות.</p>
<blockquote>💡 מהשטח: המידע ה-restricted הכי זול הוא מידע שלא שומרים. מספרי כרטיסים שעוברים ל-Stripe/Adyen דרך hosted fields לא נוגעים בשרתים שלך — ה-PCI scope מתכווץ ממאות בקרות (SAQ D) לשאלון קצר (SAQ A).</blockquote>`
      }
    },
    {
      h: { en: "Encryption at rest, in transit, and in use", he: "הצפנה at rest, in transit ו-in use" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Protects against</th><th>Does NOT protect against</th></tr>
<tr><td>Disk / volume / TDE</td><td>Stolen disk, decommissioned hardware</td><td>Anyone with DB credentials, SQL injection, backups read by the DB</td></tr>
<tr><td>TLS in transit (mTLS inside)</td><td>Sniffing, MITM on the network</td><td>Compromised endpoint</td></tr>
<tr><td>Application / field-level</td><td>DBAs, DB dumps, SQLi on other columns, analytics copies</td><td>Compromised app process holding the key</td></tr>
<tr><td>Client-side / end-to-end</td><td>The service provider itself</td><td>Server-side search/processing (you can't query it)</td></tr>
<tr><td>Confidential computing (Nitro Enclaves, AMD SEV-SNP, Intel TDX)</td><td>Host operator, hypervisor, memory dumps</td><td>Bugs in the code inside the enclave</td></tr>
</table>
<p>Field-level encryption choices: <strong>randomized</strong> (AES-GCM, different ciphertext each time, can't query) vs <strong>deterministic</strong> (AES-SIV, same input → same output, allows equality lookups but leaks frequency). The common middle path is randomized encryption plus a separate <strong>blind index</strong> (HMAC of the normalized value with its own key) for lookups:</p>
<pre>email_ct    = aes_gcm(dek, nonce, "dana@acme.io")  # randomized
email_bidx  = hmac_sha256(bidx_key, "dana@acme.io")[:16]
-- lookup:  WHERE email_bidx = :hmac_of_input
-- MongoDB Queryable Encryption / AWS DB Encryption SDK
-- implement this pattern for you</pre>`,
        he: `<table>
<tr><th>שכבה</th><th>מגינה מפני</th><th>לא מגינה מפני</th></tr>
<tr><td>Disk / volume / TDE</td><td>דיסק גנוב, חומרה שהוצאה משימוש</td><td>כל מי שיש לו credentials ל-DB, SQL injection, גיבויים שה-DB קורא</td></tr>
<tr><td>TLS in transit (בפנים mTLS)</td><td>האזנה, MITM ברשת</td><td>endpoint פרוץ</td></tr>
<tr><td>Application / field-level</td><td>DBAs, dumps של DB, SQLi על עמודות אחרות, עותקים לאנליטיקה</td><td>process של אפליקציה פרוצה שמחזיק את המפתח</td></tr>
<tr><td>Client-side / end-to-end</td><td>ספק השירות עצמו</td><td>חיפוש/עיבוד בצד השרת (אי אפשר לעשות עליו query)</td></tr>
<tr><td>Confidential computing ‏(Nitro Enclaves, AMD SEV-SNP, Intel TDX)</td><td>מפעיל ה-host, ה-hypervisor, memory dumps</td><td>באגים בקוד שבתוך ה-enclave</td></tr>
</table>
<p>בחירות בהצפנה ברמת שדה: <strong>randomized</strong> ‏(AES-GCM, ciphertext שונה בכל פעם, אי אפשר לעשות query) מול <strong>deterministic</strong> ‏(AES-SIV, אותו קלט ← אותו פלט, מאפשר חיפוש לפי שוויון אבל מדליף תדירויות). הדרך האמצעית הנפוצה היא הצפנה randomized ועוד <strong>blind index</strong> נפרד (HMAC של הערך המנורמל עם מפתח משלו) לחיפושים:</p>
<pre>email_ct    = aes_gcm(dek, nonce, "dana@acme.io")  # randomized
email_bidx  = hmac_sha256(bidx_key, "dana@acme.io")[:16]
-- lookup:  WHERE email_bidx = :hmac_of_input
-- MongoDB Queryable Encryption / AWS DB Encryption SDK
-- implement this pattern for you</pre>`
      }
    },
    {
      h: { en: "Tokenization and masking", he: "טוקניזציה ומיסוך" },
      body: {
        en: `<p><strong>Tokenization</strong> replaces a sensitive value with a random surrogate; the real value lives only in a hardened <strong>vault</strong> (VGS, Skyflow, Basis Theory, your PSP, or an internal service). Unlike encryption, a token has no mathematical relation to the value, so systems holding only tokens are out of scope.</p>
<pre>POST /vault/tokenize  {"value":"4111111111111111","type":"pan"}
-&gt; {"token":"tok_9fK2...","last4":"1111","brand":"visa"}

orders(id, card_token, card_last4)   -- no PAN anywhere
-- only the payment service may call /vault/detokenize</pre>
<p><strong>Masking</strong> for non-production: the "copy prod to staging" habit is one of the most common causes of real breaches (staging has weaker access, more people, test keys in Slack). Options, from best to worst:</p>
<ol>
<li><strong>Synthetic data</strong> generated from the schema and realistic distributions (Faker, Tonic, Gretel).</li>
<li><strong>Masked subset</strong> of prod: irreversible substitution per class (names → fake names, emails → <code>user123@example.test</code>, card → tokens), referential integrity kept, run in a pipeline inside prod so raw data never leaves.</li>
<li><strong>Dynamic masking</strong> at query time for support/analyst roles:</li>
</ol>
<pre>CREATE VIEW support_users WITH (security_invoker = true) AS
SELECT id,
       left(email, 2) || '***@' || split_part(email,'@',2)
         AS email_masked,
       '***-**-' || right(ssn, 4) AS ssn_masked
FROM users;
GRANT SELECT ON support_users TO support_role;
REVOKE ALL ON users FROM support_role;</pre>`,
        he: `<p><strong>טוקניזציה</strong> מחליפה ערך רגיש בתחליף אקראי; הערך האמיתי חי רק ב-<strong>vault</strong> מוקשח (VGS, Skyflow, Basis Theory, ספק התשלומים, או שירות פנימי). בניגוד להצפנה, ל-token אין קשר מתמטי לערך, אז מערכות שמחזיקות רק tokens יוצאות מה-scope.</p>
<pre>POST /vault/tokenize  {"value":"4111111111111111","type":"pan"}
-&gt; {"token":"tok_9fK2...","last4":"1111","brand":"visa"}

orders(id, card_token, card_last4)   -- no PAN anywhere
-- only the payment service may call /vault/detokenize</pre>
<p><strong>מיסוך</strong> לסביבות שאינן פרודקשן: ההרגל של "להעתיק את prod ל-staging" הוא אחת הסיבות הנפוצות לפריצות אמיתיות (ב-staging הגישה חלשה יותר, יש יותר אנשים, מפתחות בדיקה ב-Slack). אפשרויות, מהטובה לגרועה:</p>
<ol>
<li><strong>נתונים סינתטיים</strong> שנוצרים מהסכמה ומהתפלגויות מציאותיות (Faker, Tonic, Gretel).</li>
<li><strong>תת-קבוצה ממוסכת</strong> של prod: החלפה בלתי הפיכה לפי סיווג (שמות ← שמות מזויפים, מיילים ← <code>user123@example.test</code>, כרטיס ← tokens), שומרים על שלמות ההפניות, ומריצים ב-pipeline בתוך prod כך שהנתונים הגולמיים אף פעם לא יוצאים.</li>
<li><strong>מיסוך דינמי</strong> בזמן ה-query ל-roles של support/אנליסטים:</li>
</ol>
<pre>CREATE VIEW support_users WITH (security_invoker = true) AS
SELECT id,
       left(email, 2) || '***@' || split_part(email,'@',2)
         AS email_masked,
       '***-**-' || right(ssn, 4) AS ssn_masked
FROM users;
GRANT SELECT ON support_users TO support_role;
REVOKE ALL ON users FROM support_role;</pre>`
      }
    },
    {
      h: { en: "Access governance: least privilege, JIT, break-glass, monitoring", he: "ניהול גישה: least privilege, ‏JIT, ‏break-glass, ניטור" },
      body: {
        en: `<ul>
<li><strong>No standing access to restricted data.</strong> Engineers get read access to prod data through <strong>just-in-time</strong> requests: ticket + reason → approval (peer or owner) → time-boxed grant (1–8 h) → auto-revoke → recorded session. Tools: AWS IAM Identity Center + TEAM, Azure PIM, GCP PAM, Teleport, StrongDM, Indent.</li>
<li><strong>Break-glass</strong>: a sealed emergency role usable without approval during a SEV1, which pages security the moment it's used, records everything and requires a review within 24 h.</li>
<li><strong>Database activity monitoring</strong>: log who read what. Postgres example:</li>
</ul>
<pre># postgresql.conf
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'read, write, ddl, role'
pgaudit.log_relation = on
pgaudit.role = 'auditor'   # object-level audit via grants
-- ship to SIEM; alert on: SELECT * FROM users by a human,
-- &gt;10k rows exported, access outside business hours</pre>
<ul>
<li><strong>DLP</strong> (data loss prevention): scan egress channels — email, Slack, uploads to unknown domains, S3 buckets made public — for card numbers, IDs and secrets; block or alert.</li>
<li><strong>Service access</strong>: each service has its own DB role with the minimum grants; only the payment service can detokenize; analytics reads a de-identified replica.</li>
</ul>
<blockquote>⚠️ Production tip: Review access quarterly with owners (SOC 2 / ISO 27001 will ask). Every grant should have an owner, a reason and an expiry — "temporary" admin rights granted in an incident two years ago are how many breaches escalate.</blockquote>`,
        he: `<ul>
<li><strong>אין גישה קבועה למידע restricted.</strong> מהנדסים מקבלים גישת קריאה לנתוני prod דרך בקשות <strong>just-in-time</strong>: טיקט + סיבה ← אישור (עמית או בעלים) ← הרשאה מוגבלת בזמן (1–8 שעות) ← שלילה אוטומטית ← session מוקלט. כלים: AWS IAM Identity Center + TEAM, ‏Azure PIM, ‏GCP PAM, ‏Teleport, ‏StrongDM, ‏Indent.</li>
<li><strong>Break-glass</strong>: role חירום חתום שאפשר להשתמש בו בלי אישור בזמן SEV1, שמקפיץ את צוות האבטחה ברגע השימוש, מקליט הכול ודורש review תוך 24 שעות.</li>
<li><strong>Database activity monitoring</strong>: רושמים מי קרא מה. דוגמה ל-Postgres:</li>
</ul>
<pre># postgresql.conf
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'read, write, ddl, role'
pgaudit.log_relation = on
pgaudit.role = 'auditor'   # object-level audit via grants
-- ship to SIEM; alert on: SELECT * FROM users by a human,
-- &gt;10k rows exported, access outside business hours</pre>
<ul>
<li><strong>DLP</strong> ‏(data loss prevention): סורקים ערוצי יציאה — מייל, Slack, העלאות ל-domains לא מוכרים, buckets ב-S3 שהפכו לציבוריים — בחיפוש אחרי מספרי כרטיס, תעודות זהות וסודות; חוסמים או מתריעים.</li>
<li><strong>גישת שירותים</strong>: לכל שירות role משלו ב-DB עם ההרשאות המינימליות; רק שירות התשלומים יכול לעשות detokenize; האנליטיקה קוראת מ-replica שהוסר ממנה מידע מזהה.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: עוברים על ההרשאות כל רבעון עם הבעלים (SOC 2 / ISO 27001 ישאלו). לכל הרשאה צריכים להיות בעלים, סיבה ותאריך תפוגה — הרשאות admin "זמניות" שניתנו בתקלה לפני שנתיים הן הדרך שבה הרבה פריצות מסלימות.</blockquote>`
      }
    },
    {
      h: { en: "Lifecycle: retention, deletion and backups", he: "מחזור חיים: שמירה, מחיקה וגיבויים" },
      body: {
        en: `<p>Data you keep forever is liability you keep forever. Write a retention policy per data type, then <em>enforce it in code</em>:</p>
<table>
<tr><th>Data</th><th>Retention</th><th>Mechanism</th></tr>
<tr><td>Raw access logs with IPs</td><td>30 days</td><td>Log index ILM / bucket lifecycle rule</td></tr>
<tr><td>Support tickets</td><td>2 years after close</td><td>Nightly job, deletes + audit record</td></tr>
<tr><td>Invoices</td><td>7 years (tax law)</td><td>WORM storage (Object Lock compliance mode)</td></tr>
<tr><td>Closed account PII</td><td>30 days, then erase</td><td>Erasure workflow + per-user/tenant key shredding</td></tr>
<tr><td>Backups</td><td>35 days PITR + 12 monthly</td><td>Encrypted, separate account, expire automatically</td></tr>
</table>
<p>Deletion must reach <strong>every copy</strong>: primary DB, replicas, caches, search indexes, data warehouse, event streams (compacted tombstones), logs, ML features, vendors (send erasure requests to subprocessors) and backups. Backups are usually handled by letting them expire within a documented window, or by crypto-shredding the per-user/tenant key so the copies in old backups are unreadable.</p>
<pre>-- S3 lifecycle: raw logs expire after 30 days
{ "Rules": [{ "ID": "raw-logs-30d", "Status": "Enabled",
  "Filter": { "Prefix": "raw/" },
  "Expiration": { "Days": 30 },
  "NoncurrentVersionExpiration": { "NoncurrentDays": 7 } }] }</pre>
<blockquote>💡 Real world: Regulators fine for keeping data too long, not only for leaking it. GDPR's storage-limitation principle and Israel's privacy rules both expect you to justify retention per purpose — "we might need it someday" isn't a purpose.</blockquote>`,
        he: `<p>מידע ששומרים לנצח הוא התחייבות ששומרים לנצח. כותבים מדיניות שמירה לכל סוג מידע, ואז <em>אוכפים אותה בקוד</em>:</p>
<table>
<tr><th>מידע</th><th>שמירה</th><th>מנגנון</th></tr>
<tr><td>Access logs גולמיים עם IPs</td><td>30 יום</td><td>ILM באינדקס הלוגים / lifecycle rule ב-bucket</td></tr>
<tr><td>טיקטים של support</td><td>שנתיים אחרי סגירה</td><td>job לילי, מוחק + רשומת audit</td></tr>
<tr><td>חשבוניות</td><td>7 שנים (חוק המס)</td><td>אחסון WORM ‏(Object Lock במצב compliance)</td></tr>
<tr><td>PII של חשבון סגור</td><td>30 יום, ואז מחיקה</td><td>workflow של מחיקה + shredding למפתח פר-משתמש/tenant</td></tr>
<tr><td>גיבויים</td><td>35 יום PITR + ‏12 חודשיים</td><td>מוצפנים, account נפרד, פג תוקף אוטומטית</td></tr>
</table>
<p>מחיקה חייבת להגיע ל<strong>כל עותק</strong>: ה-DB הראשי, replicas, caches, אינדקסי חיפוש, ה-data warehouse, event streams ‏(tombstones עם compaction), לוגים, ML features, ספקים (שולחים בקשות מחיקה ל-subprocessors) וגיבויים. בגיבויים בדרך כלל מטפלים בכך שנותנים להם לפוג בתוך חלון זמן מתועד, או ב-crypto-shredding של המפתח פר-משתמש/tenant כך שהעותקים בגיבויים ישנים לא קריאים.</p>
<pre>-- S3 lifecycle: raw logs expire after 30 days
{ "Rules": [{ "ID": "raw-logs-30d", "Status": "Enabled",
  "Filter": { "Prefix": "raw/" },
  "Expiration": { "Days": 30 },
  "NoncurrentVersionExpiration": { "NoncurrentDays": 7 } }] }</pre>
<blockquote>💡 מהשטח: רגולטורים קונסים גם על שמירת מידע זמן רב מדי, לא רק על דליפה. עקרון צמצום השמירה של GDPR וגם כללי הפרטיות בישראל מצפים שתצדיק את משך השמירה לכל מטרה — "אולי נצטרך את זה פעם" זו לא מטרה.</blockquote>`
      }
    }
  ],
  diagram: `Data security controls by class

  classify (schema tags, scanners)
        |
  Public   -> TLS
  Internal -> + at-rest encryption, SSO access
  Confid.  -> + per-tenant KEK, RBAC, masked in non-prod
  Restrict -> + field-level enc / tokenization (vault)
              + JIT access (approve -> 4h -> revoke)
              + pgaudit -> SIEM alerts, DLP on egress
        |
  lifecycle: retention rules -> delete everywhere
             (DB, cache, search, DWH, logs, vendors)
             backups: expire window or crypto-shred key`,
  handsOn: [
    { cmd: "psql -c \"SELECT table_name, column_name FROM information_schema.columns WHERE column_name ~* '(ssn|passport|card|iban|dob|phone|email)';\"", what: { en: "First pass at discovery: find columns whose names suggest personal or restricted data, then classify and tag them.", he: "מעבר ראשון של גילוי: מוצאים עמודות שהשמות שלהן מרמזים על מידע אישי או restricted, ואז מסווגים ומתייגים." } },
    { cmd: "aws s3api get-bucket-encryption --bucket my-bucket && aws s3api get-public-access-block --bucket my-bucket", what: { en: "Check default encryption (and whether it's SSE-KMS with your key) and that public access is blocked.", he: "בודקים הצפנת ברירת מחדל (והאם זה SSE-KMS עם המפתח שלך) ושגישה ציבורית חסומה." } },
    { cmd: "aws macie2 create-classification-job --job-type ONE_TIME --name pii-scan --s3-job-definition '{\"bucketDefinitions\":[{\"accountId\":\"111122223333\",\"buckets\":[\"my-bucket\"]}]}'", what: { en: "Run an automated PII scan over a bucket (Amazon Macie) — the fastest way to learn where restricted data actually lives.", he: "מריצים סריקת PII אוטומטית על bucket ‏(Amazon Macie) — הדרך המהירה ביותר ללמוד איפה מידע restricted באמת יושב." } },
    { cmd: "aws s3api get-bucket-lifecycle-configuration --bucket my-logs", what: { en: "Verify that the retention you wrote in the policy is actually enforced on the bucket.", he: "מוודאים שמדיניות השמירה שכתבת באמת נאכפת על ה-bucket." } }
  ],
  mnemonic: {
    en: "\"Classify → Minimize → Encrypt → Tokenize → Govern → Delete.\" C-M-E-T-G-D: 'Careful Minds Encrypt, Tokenize, Govern, Delete'. Disk encryption protects the disk, not the data.",
    he: "\"לסווג ← לצמצם ← להצפין ← לעשות טוקניזציה ← לנהל גישה ← למחוק.\" והצפנת דיסק מגינה על הדיסק, לא על המידע."
  },
  pitfalls: [
    { en: "Copying production into staging 'just for testing'. Staging has weaker controls and more access; it becomes the easiest place to steal prod data. Use synthetic or masked data produced inside prod.", he: "להעתיק את פרודקשן ל-staging 'רק לבדיקות'. ב-staging הבקרות חלשות יותר ויש יותר גישה; זה הופך למקום הכי קל לגנוב ממנו נתוני prod. משתמשים בנתונים סינתטיים או ממוסכים שמיוצרים בתוך prod." },
    { en: "Encrypting a field but logging it in plaintext on the way in (request logs, error messages, analytics events). Redact by class at the logger, and test it.", he: "להצפין שדה אבל לרשום אותו ב-plaintext בדרך פנימה (request logs, הודעות שגיאה, events של אנליטיקה). מסננים לפי סיווג ברמת ה-logger, ובודקים את זה." },
    { en: "A deletion job that cleans the primary DB but forgets the search index, warehouse and event topics. 'Deleted' users keep appearing in search and reports. Maintain a registry of every store holding each data class.", he: "job מחיקה שמנקה את ה-DB הראשי אבל שוכח את אינדקס החיפוש, ה-warehouse וה-topics. משתמשים 'מחוקים' ממשיכים להופיע בחיפוש ובדוחות. מחזיקים רשימה של כל store שמחזיק כל סוג מידע." },
    { en: "Standing admin access 'because on-call might need it'. Use JIT with fast approval and a break-glass path instead; standing access is what an attacker inherits when they phish an engineer.", he: "גישת admin קבועה 'כי ה-on-call אולי יצטרך'. משתמשים ב-JIT עם אישור מהיר ובנתיב break-glass במקום; גישה קבועה היא מה שהתוקף יורש כשהוא עושה phishing למהנדס." }
  ],
  interview: [
    { q: { en: "We store national ID numbers and need to search by them. How do you protect them?", he: "אנחנו שומרים מספרי תעודת זהות וצריכים לחפש לפיהם. איך אתה מגן עליהם?" },
      a: { en: "First question whether we need the full number at all (maybe last 4 + a verification step). If yes: classify as restricted, encrypt at the application layer with envelope encryption and AAD bound to the record, add a blind index (HMAC with a separate key, normalized input) for exact-match search, restrict detokenize/decrypt to one service role, keep it out of logs and non-prod, pgaudit + alerts on bulk reads, JIT for humans, and a per-user/tenant key so erasure can crypto-shred. Document retention.", he: "קודם שואלים אם בכלל צריך את המספר המלא (אולי 4 ספרות אחרונות + שלב אימות). אם כן: מסווגים כ-restricted, מצפינים ברמת האפליקציה עם envelope encryption ו-AAD שקשור לרשומה, מוסיפים blind index ‏(HMAC עם מפתח נפרד, קלט מנורמל) לחיפוש התאמה מדויקת, מגבילים פענוח ל-role של שירות אחד, מוציאים מלוגים ומסביבות שאינן prod, pgaudit + התראות על קריאות בכמות, JIT לבני אדם, ומפתח פר-משתמש/tenant כך שמחיקה יכולה לעשות crypto-shredding. מתעדים את משך השמירה." } },
    { q: { en: "Tokenization vs encryption — when do you choose which?", he: "טוקניזציה מול הצפנה — מתי בוחרים מה?" },
      a: { en: "Tokenize when most systems only need a reference to the value (orders, refunds, analytics on last4) and you want those systems out of compliance scope — PCI is the classic case. Encrypt when the owning service must use the value itself frequently, or when the vault would become a latency/availability bottleneck. Often both: the vault encrypts internally, and everything else holds tokens.", he: "עושים טוקניזציה כשרוב המערכות צריכות רק הפניה לערך (הזמנות, החזרים, אנליטיקה על 4 ספרות אחרונות) ורוצים להוציא אותן מה-scope של ה-compliance — PCI הוא המקרה הקלאסי. מצפינים כשהשירות שמחזיק את המידע חייב להשתמש בערך עצמו לעתים קרובות, או כשה-vault היה הופך לצוואר בקבוק של latency/זמינות. לעתים קרובות גם וגם: ה-vault מצפין בפנים, וכל השאר מחזיקים tokens." } }
  ],
  quiz: [
    { q: { en: "Your RDS instance uses storage encryption. An attacker gets the app's DB password. What protects the SSN column?", he: "ל-RDS שלך יש הצפנת אחסון. תוקף משיג את סיסמת ה-DB של האפליקציה. מה מגן על עמודת ה-SSN?" },
      options: [
        { en: "Storage encryption", he: "הצפנת האחסון" },
        { en: "Nothing, unless the column is encrypted at the application/field level with a key the DB doesn't hold", he: "כלום, אלא אם העמודה מוצפנת ברמת האפליקציה/השדה עם מפתח שה-DB לא מחזיק" },
        { en: "TLS", he: "TLS" },
        { en: "The VPC", he: "ה-VPC" }
      ], answer: 1,
      explain: { en: "Storage encryption is transparent to anyone who can log in; it only protects the physical media.", he: "הצפנת אחסון שקופה לכל מי שיכול להתחבר; היא מגינה רק על המדיה הפיזית." } },
    { q: { en: "What makes tokenization reduce PCI scope?", he: "מה גורם לטוקניזציה להקטין את ה-PCI scope?" },
      options: [
        { en: "Tokens are encrypted with AES-256", he: "ה-tokens מוצפנים ב-AES-256" },
        { en: "Tokens have no mathematical relation to the card number, so systems holding only tokens don't store cardholder data", he: "ל-tokens אין קשר מתמטי למספר הכרטיס, אז מערכות שמחזיקות רק tokens לא שומרות נתוני כרטיס" },
        { en: "Tokens expire after one use", he: "tokens פגים אחרי שימוש אחד" },
        { en: "PCI doesn't apply to databases", he: "PCI לא חל על databases" }
      ], answer: 1,
      explain: { en: "Only the vault (or the PSP) holds real PANs; everything else is out of the cardholder data environment.", he: "רק ה-vault (או ספק התשלומים) מחזיקים מספרי כרטיס אמיתיים; כל השאר מחוץ לסביבת נתוני הכרטיס." } },
    { q: { en: "A DBA needs prod data for 2 hours to debug an incident. Best practice?", he: "DBA צריך נתוני prod לשעתיים כדי לדבג תקלה. מה ה-best practice?" },
      options: [
        { en: "Give them permanent read access", he: "לתת לו גישת קריאה קבועה" },
        { en: "Share the app's DB password in Slack", he: "לשתף את סיסמת ה-DB של האפליקציה ב-Slack" },
        { en: "Just-in-time access: approved, time-boxed, recorded, auto-revoked", he: "גישת just-in-time: באישור, מוגבלת בזמן, מוקלטת, נשללת אוטומטית" },
        { en: "Copy the DB to their laptop", he: "להעתיק את ה-DB ללפטופ שלו" }
      ], answer: 2,
      explain: { en: "JIT gives access when needed without leaving standing privileges for attackers to inherit.", he: "JIT נותן גישה כשצריך בלי להשאיר הרשאות קבועות שתוקפים יירשו." } },
    { q: { en: "A user requests erasure. Which store is most often forgotten?", he: "משתמש מבקש מחיקה. איזה store הכי הרבה פעמים נשכח?" },
      options: [
        { en: "The primary OLTP database", he: "ה-database הראשי של ה-OLTP" },
        { en: "Secondary copies: search index, warehouse, event topics, logs, vendors and backups", he: "עותקים משניים: אינדקס חיפוש, warehouse, ‏event topics, לוגים, ספקים וגיבויים" },
        { en: "The user's browser", he: "הדפדפן של המשתמש" },
        { en: "DNS", he: "DNS" }
      ], answer: 1,
      explain: { en: "Erasure is a data-lineage problem: you need a registry of every place each data class flows to.", he: "מחיקה היא בעיית data lineage: צריך רשימה של כל מקום שכל סוג מידע זורם אליו." } }
  ],
  related: ["pr-privacy", "pr-applied-crypto-pki", "pr-backups-strategy", "pr-tenant-isolation-deep", "staff-zero-trust-secrets", "cloud-iam-security", "pr-security-owasp"]
});

/* ------------------------------------------------------------------ */
INFRA.glossary.push(
  { term: "Envelope encryption", track: "principal", lesson: "pr-applied-crypto-pki", def: { en: "Encrypt data locally with a per-object data key (DEK), and store that DEK wrapped by a key-encryption key (KEK) that never leaves the KMS/HSM.", he: "מצפינים נתונים מקומית עם data key ‏(DEK) לכל אובייקט, ושומרים את ה-DEK עטוף ב-key-encryption key ‏(KEK) שאף פעם לא יוצא מה-KMS/HSM." } },
  { term: "Forward secrecy", track: "principal", lesson: "pr-applied-crypto-pki", def: { en: "Session keys come from ephemeral key exchange (ECDHE), so stealing a server's long-term key later can't decrypt past recorded sessions.", he: "מפתחות הסשן נגזרים מ-key exchange זמני (ECDHE), כך שגניבת המפתח ארוך-הטווח של השרת בעתיד לא מאפשרת לפענח סשנים קודמים שהוקלטו." } },
  { term: "Certificate chain", track: "principal", lesson: "pr-applied-crypto-pki", def: { en: "Leaf certificate → intermediate CA(s) → trusted root. Servers must send the leaf plus intermediates; clients trust only roots.", he: "תעודת leaf ← CA ביניים ← root מהימן. שרתים חייבים לשלוח את ה-leaf ועוד ה-intermediates; לקוחות סומכים רק על roots." } },
  { term: "ACME", track: "principal", lesson: "pr-applied-crypto-pki", def: { en: "Automated Certificate Management Environment (RFC 8555): the protocol Let's Encrypt and cert-manager use to prove domain control and issue/renew certificates automatically.", he: "Automated Certificate Management Environment ‏(RFC 8555): הפרוטוקול ש-Let's Encrypt ו-cert-manager משתמשים בו כדי להוכיח שליטה ב-domain ולהנפיק/לחדש תעודות אוטומטית." } },
  { term: "IMDSv2", track: "principal", lesson: "pr-network-isolation-deep", def: { en: "AWS instance metadata service v2: requires a session token obtained by PUT, and with hop limit 1 blocks containers and SSRF from stealing instance credentials.", he: "גרסה 2 של שירות ה-metadata של AWS: דורשת session token שמתקבל ב-PUT, ועם hop limit 1 חוסמת מקונטיינרים ומ-SSRF לגנוב את ה-credentials של ה-instance." } },
  { term: "Lateral movement", track: "principal", lesson: "pr-network-isolation-deep", def: { en: "An attacker pivoting from the first compromised host to other systems inside the network; flat networks make it easy, segmentation and identity-based policy stop it.", he: "תוקף שקופץ מהמכונה הראשונה שנפרצה למערכות אחרות בתוך הרשת; רשתות שטוחות מקלות על זה, סגמנטציה ומדיניות מבוססת זהות עוצרות את זה." } },
  { term: "Microsegmentation", track: "principal", lesson: "pr-network-isolation-deep", def: { en: "Fine-grained, per-workload network policy (allow only declared flows between specific services) instead of broad trusted zones.", he: "מדיניות רשת מפורטת לכל workload (רק זרימות מוצהרות בין שירותים ספציפיים) במקום אזורים מהימנים רחבים." } },
  { term: "BYPASSRLS", track: "principal", lesson: "pr-tenant-isolation-deep", def: { en: "Postgres role attribute that skips row-level security policies (superusers have it implicitly); the app's login role must be NOBYPASSRLS.", he: "תכונה של role ב-Postgres שמדלגת על מדיניות row-level security (ל-superusers יש אותה במובלע); ה-role שהאפליקציה מתחברת איתו חייב להיות NOBYPASSRLS." } },
  { term: "Tokenization", track: "principal", lesson: "pr-data-security", def: { en: "Replacing a sensitive value with a random surrogate token; the real value lives only in a vault, taking token-holding systems out of compliance scope.", he: "החלפת ערך רגיש ב-token אקראי; הערך האמיתי חי רק ב-vault, וכך מערכות שמחזיקות tokens יוצאות מה-scope של ה-compliance." } },
  { term: "Break-glass access", track: "principal", lesson: "pr-data-security", def: { en: "A pre-approved emergency path to privileged access that works without normal approval but alerts security, records everything and requires review afterwards.", he: "נתיב חירום מאושר מראש לגישה מורשית שעובד בלי האישור הרגיל, אבל מתריע לצוות האבטחה, מקליט הכול ודורש review אחר כך." } }
);
