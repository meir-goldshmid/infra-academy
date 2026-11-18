window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// IDs & randomness: UUIDs/GUIDs in depth, and random numbers for engineers.
(function () {

// ---------- shared code blocks (identical in both languages) ----------
const UUID_LAYOUT = `<pre>  0193247e-8a3c-7b12-9f4d-2c8e1a6b5d3f
  xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
                ^    ^
                |    +-- N = variant: 8, 9, a, b  =&gt; binary 10xx = RFC 9562 UUID
                +------- M = version: 1..8 (the 13th hex digit)

  128 bits = 16 bytes = 32 hex digits + 4 dashes = 36 characters
  v4: 128 - 4 (version) - 2 (variant) = 122 random bits
  v7: 48-bit Unix ms | 4 ver | 12 rand_a | 2 var | 62 rand_b  =&gt; 74 random bits

  00000000-0000-0000-0000-000000000000   Nil UUID
  ffffffff-ffff-ffff-ffff-ffffffffffff   Max UUID (new in RFC 9562)</pre>`;

const UUID_DECODE = `<pre>&gt;&gt;&gt; import uuid
&gt;&gt;&gt; u = uuid.uuid4(); u, u.version
(UUID('d9fe5f6f-d920-4b1b-a17a-5a82b37b0c57'), 4)
&gt;&gt;&gt; a = uuid.uuid1(); a, hex(a.node)
(UUID('f17de24a-e06d-11f1-aab8-8cb87e24ae92'), '0x8cb87e24ae92')   # &lt;- the NIC's MAC address
&gt;&gt;&gt; uuid.uuid5(uuid.NAMESPACE_DNS, "example.com")
UUID('cfbff0d1-9375-5685-968c-48ce8b15ae17')   # same input =&gt; same UUID, on every machine, forever
&gt;&gt;&gt; uuid.uuid3(uuid.NAMESPACE_DNS, "example.com")
UUID('9073926b-929f-31c2-abc9-fad77ae3e8eb')   # MD5-based; prefer v5 (SHA-1)</pre>`;

const UUID7_CODE = `<pre># UUID v7 by hand (Python 3.14+ has uuid.uuid7() built in)
import os, time, uuid
def uuid7() -&gt; uuid.UUID:
    ms = time.time_ns() // 1_000_000
    b = bytearray(ms.to_bytes(6, "big") + os.urandom(10))
    b[6] = (b[6] &amp; 0x0F) | 0x70      # version 7
    b[8] = (b[8] &amp; 0x3F) | 0x80      # variant 10xx
    return uuid.UUID(bytes=bytes(b))

&gt;&gt;&gt; u = uuid7(); u
UUID('01a1dbd9-a4b8-75b4-830f-23f350965caf')
&gt;&gt;&gt; int.from_bytes(u.bytes[:6], "big")
1794689836216          # =&gt; 2026-11-14 20:57:16.216 UTC
&gt;&gt;&gt; ids = [uuid7() for _ in range(5)]; ids == sorted(ids)
False                  # 5 IDs in the same ms: the random tail isn't ordered!</pre>`;

const COLLISION_CODE = `<pre>import math
N = 2**122                                   # possible v4 values
n50 = math.sqrt(2 * math.log(2) * N)         # 50% chance of at least one collision
print(f"{n50:.3e}")                          # 2.715e+18
print(n50 / 1e9 / 86400 / 365.25)            # 86.0  -&gt; years at 1 billion IDs/second
p = lambda n: -math.expm1(-n*n / (2*N))      # p ~= n^2 / 2N
print(f"{p(1e12):.2e}")                      # 9.40e-14 -&gt; one trillion IDs
print(f"{math.sqrt(2*N*1e-9):.3e}")          # 1.031e+14 -&gt; IDs for a 1-in-a-billion chance</pre>`;

const GUID_BYTES = `<pre>// .NET: Guid.ToByteArray() is "mixed-endian" (first 3 groups little-endian)
new Guid("00112233-4455-6677-8899-aabbccddeeff").ToByteArray()
  =&gt; 33 22 11 00 | 55 44 | 77 66 | 88 99 | aa bb cc dd ee ff
// RFC / Postgres / Java / Go byte order (big-endian):
  =&gt; 00 11 22 33 | 44 55 | 66 77 | 88 99 | aa bb cc dd ee ff
# Python shows both:
&gt;&gt;&gt; u = uuid.UUID("00112233-4455-6677-8899-aabbccddeeff")
&gt;&gt;&gt; u.bytes.hex(), u.bytes_le.hex()
('00112233445566778899aabbccddeeff', '33221100554477668899aabbccddeeff')

-- SQL Server compares uniqueidentifier starting from the LAST 6 bytes:
--   bytes 10-15, then 8-9, then 6-7, then 4-5, then 0-3
-- =&gt; a v7 GUID (time in the FIRST bytes) is effectively random as a clustered key
-- Options: NEWSEQUENTIALID() default, or put the time in the last group, or BINARY(16)</pre>`;

const STORAGE_SQL = `<pre>-- PostgreSQL: native 16-byte type
CREATE TABLE orders (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),   -- PG 18; PG 13-17: gen_random_uuid() (v4)
  created_at timestamptz NOT NULL DEFAULT now()
);
SELECT uuid_extract_version(id), uuid_extract_timestamp(id) FROM orders LIMIT 1;  -- PG 17+
 uuid_extract_version |   uuid_extract_timestamp
----------------------+----------------------------
                    7 | 2026-11-14 20:57:16.216+00

-- MySQL 8: BINARY(16), convert at the edge
CREATE TABLE orders (id BINARY(16) PRIMARY KEY, ...);
INSERT INTO orders (id) VALUES (UUID_TO_BIN('01a1dbd9-a4b8-75b4-830f-23f350965caf'));
SELECT BIN_TO_UUID(id) FROM orders;
-- UUID() in MySQL is v1: UUID_TO_BIN(UUID(), 1) swaps the time fields so it sorts</pre>`;

const BENCH = `<pre># 2,000,000 inserts, 16-byte BLOB primary key, SQLite WITHOUT ROWID, 16 MB cache
import sqlite3, os, uuid
...
v4  83.3s  (random keys: every insert lands on a random leaf page)
v7  14.3s  (time-ordered: inserts append to the right-most leaf)   =&gt; ~5.8x faster</pre>`;

const GEN_CODE = `<pre># Python
import uuid
uuid.uuid4()                    # random
uuid.uuid7()                    # Python 3.14+; older: pip install uuid-utils / uuid6

// Node.js
const { randomUUID } = require('node:crypto');
randomUUID();                   // 'e39efc68-bcd0-4058-a64c-6228ff36b1b1' (v4, CSPRNG)
import { v7 as uuidv7 } from 'uuid';   // npm uuid v10+
uuidv7();
// Browser: crypto.randomUUID() (secure contexts / HTTPS only)

// Go — github.com/google/uuid
id := uuid.New()                // v4
id7, err := uuid.NewV7()

// .NET 9+
Guid.NewGuid();                 // v4
Guid.CreateVersion7();          // v7 (watch SQL Server sort order!)

-- PostgreSQL
SELECT gen_random_uuid();       -- v4, built in since PG 13
SELECT uuidv7();                -- PG 18 (sub-ms counter =&gt; monotonic within a session)</pre>`;

// ---------- random numbers ----------
const LCG_CODE = `<pre># A Linear Congruential Generator: state = (a*state + c) mod m
s = 42
def nxt():
    global s
    s = (1103515245 * s + 12345) % 2**31     # the classic ANSI C example constants
    return s
print([nxt() for _ in range(3)])            # [1250496027, 1116302264, 1000676753]

# The output IS the state. One leaked value =&gt; every future value:
t = 1250496027
print([(t := (1103515245 * t + 12345) % 2**31), (t := (1103515245 * t + 12345) % 2**31)])
# [1116302264, 1000676753]</pre>`;

const MT_CODE = `<pre># Python's random = Mersenne Twister (MT19937): 624 x 32-bit words of state.
# Observe 624 outputs, undo the "tempering" step, and you own the generator.
import random, os
def untemper(y):
    y ^= y &gt;&gt; 18
    y ^= (y &lt;&lt; 15) &amp; 0xEFC60000
    t = y
    for _ in range(5): t = y ^ ((t &lt;&lt; 7) &amp; 0x9D2C5680)
    y = t &amp; 0xFFFFFFFF
    t = y
    for _ in range(2): t = y ^ (t &gt;&gt; 11)
    return t &amp; 0xFFFFFFFF

victim = random.Random(os.urandom(16))          # seeded from the OS - doesn't help!
leaked = [victim.getrandbits(32) for _ in range(624)]
clone = random.Random()
clone.setstate((3, tuple(untemper(v) for v in leaked) + (624,), None))

print(victim.randint(100000, 999999))   # 269500   &lt;- the "random" 6-digit reset code
print(clone.randint(100000, 999999))    # 269500   &lt;- the attacker's prediction</pre>`;

const LINUX_RNG = `<pre>$ dmesg | grep -i 'crng init'
[    1.402117] random: crng init done          # from here on, getrandom() never blocks

$ cat /proc/sys/kernel/random/entropy_avail
256                                            # constant since Linux 5.18: no "running out"

$ head -c 32 /dev/urandom | base64
x2Q1m0k8b3m6S0Jm7l1d4XhPq2oYcJ9wVnB5tE1rZaA=

$ openssl rand -hex 32                         # same CSPRNG via OpenSSL
$ python3 -c 'import secrets; print(secrets.token_urlsafe(32))'   # 43 chars = 256 bits</pre>`;

const LANG_CODE = `<pre># Python
import secrets
secrets.token_urlsafe(32)        # reset tokens, API keys, session ids
secrets.randbelow(1_000_000)     # OTP code, uniform, no modulo bias
secrets.compare_digest(a, b)     # constant-time compare
# NOT: random.random(), random.randint(), uuid.uuid1()

// Node.js
const crypto = require('node:crypto');
crypto.randomBytes(32).toString('base64url');  // 43 chars
crypto.randomInt(100000, 1000000);             // 6-digit code, unbiased
crypto.randomUUID();
// NOT: Math.random() (V8: xorshift128+, recoverable from a few outputs)

// Java
SecureRandom rng = new SecureRandom();        // Linux: NativePRNG, /dev/urandom
byte[] key = new byte[32]; rng.nextBytes(key);
// NOT: new Random() (48-bit LCG), ThreadLocalRandom, Math.random()
// Careful: SecureRandom.getInstanceStrong() may block on old kernels/JDKs

// Go
import "crypto/rand"
b := make([]byte, 32); rand.Read(b)          // Go 1.24+: never returns an error
s := rand.Text()                             // Go 1.24+: 26 chars, base32, 128+ bits
// NOT: math/rand or math/rand/v2 (ChaCha8/PCG: fine for jitter, not for secrets)</pre>`;

const JITTER_CODE = `<pre># Full jitter (AWS Architecture Blog, "Exponential Backoff And Jitter")
import random, time
def backoff(attempt, base=0.1, cap=20.0):
    return random.uniform(0, min(cap, base * 2 ** attempt))   # non-crypto RNG is fine here

for attempt in range(6):
    try:
        return call()
    except Retryable:
        time.sleep(backoff(attempt))

# Power of two choices: pick 2 random backends, send to the less loaded one
a, b = random.sample(backends, 2)
target = a if a.in_flight &lt;= b.in_flight else b</pre>`;

const P2C_SIM = `<pre># 1,000,000 requests into 1,000,000 servers (Python simulation, seed=1)
pure random            : busiest server got 8   (theory ~ ln n / ln ln n)
power of two choices   : busiest server got 4   (theory ~ ln ln n / ln 2)</pre>`;

const SHUFFLE_CODE = `<pre># WRONG: swap each position with ANY position -&gt; n^n paths onto n! orders
for i in range(n): j = randrange(n); a[i], a[j] = a[j], a[i]
# 3 items: 27 paths, 6 permutations -&gt; 27/6 isn't whole, so it can't be fair:
# abc:4  acb:5  bac:5  bca:5  cab:4  cba:4

# RIGHT: Fisher-Yates (Knuth) - swap with a position not yet fixed
import secrets
def fisher_yates(a):
    for i in range(len(a) - 1, 0, -1):
        j = secrets.randbelow(i + 1)      # 0..i inclusive
        a[i], a[j] = a[j], a[i]
# 3 items: 3*2 = 6 paths -&gt; each permutation exactly once
# (Python's random.shuffle and secrets.SystemRandom().shuffle already do this)

# MODULO BIAS: one random byte % 10
# 256 = 25*10 + 6  -&gt; digits 0-5 appear 26/256, digits 6-9 appear 25/256 (4% more likely)
def unbiased_below(n):                    # rejection sampling
    limit = 256 - (256 % n)               # 250 for n=10
    while True:
        b = secrets.token_bytes(1)[0]
        if b &lt; limit:
            return b % n</pre>`;

const SEED_CODE = `<pre># Reproducible randomness: own your seed, log it, never share global state
import os, random
seed = int(os.environ.get("TEST_SEED", random.SystemRandom().randrange(2**32)))
print(f"TEST_SEED={seed}")                # re-run a flaky failure with the same seed
rng = random.Random(seed)                 # a private instance, not random.seed()

# Distributions for simulations / load tests
rng.uniform(0, 1)                         # uniform: jitter, sampling
rng.gauss(200, 30)                        # normal: "latency ~200ms +- 30" (careful: real latency has a long tail)
rng.expovariate(100)                      # exponential gaps =&gt; Poisson arrivals at 100 req/s
# mean gap 10 ms; P(gap &gt; 30 ms) = e^-3 = 4.98%</pre>`;

// ======================= Lesson 1 =======================
INFRA.lessons.push({
  id: "uuid-guid-deep",
  track: "foundations",
  order: 45,
  icon: "🆔",
  level: 3,
  minutes: 18,
  title: { en: "UUIDs, GUIDs & Unique IDs in Depth", he: "UUID, GUID ומזהים ייחודיים לעומק" },
  tldr: {
    en: "A UUID is 128 bits with a 4-bit version and a 2-bit variant; v4 gives 122 random bits (collisions are a math non-issue, bugs are not), v7 puts a millisecond timestamp first so B-tree indexes stay happy — store it as 16 bytes, never as CHAR(36).",
    he: "UUID הוא 128 bits עם 4 bits של version ו-2 bits של variant. ב-v4 יש 122 bits אקראיים (התנגשות היא לא בעיה מתמטית, באגים כן), ו-v7 שם timestamp של מילישניות בהתחלה כדי שאינדקס B-tree יישאר מאושר. שומרים אותו כ-16 bytes, אף פעם לא כ-CHAR(36)."
  },
  analogy: {
    en: "Think of license plates. A v4 UUID is a plate made by rolling dice for every character — no registry needed, and the plate space is so huge two cars will never match. A v7 UUID stamps the manufacturing date on the left of the plate and rolls dice for the rest, so a parking lot sorted by plate is also sorted by age. A v5 UUID is a plate computed from the VIN: the same car always gets the same plate, anywhere in the world.",
    he: "תחשוב על לוחיות רישוי. UUID v4 הוא לוחית שכל תו בה נקבע בהטלת קובייה: לא צריך משרד רישוי, והמרחב כל כך עצום ששתי מכוניות לא יקבלו אותה לוחית. UUID v7 מטביע את תאריך הייצור בצד שמאל של הלוחית ומגריל את השאר, כך שחניון שממוין לפי לוחית ממוין גם לפי גיל. UUID v5 הוא לוחית שמחושבת ממספר השלדה: אותה מכונית תמיד מקבלת אותה לוחית, בכל מקום בעולם."
  },
  sections: [
    {
      h: { en: "Anatomy: 128 bits, a version digit and a variant", he: "אנטומיה: 128 bits, ספרת version ו-variant" },
      body: {
        en: `<p>This goes deeper than <strong>IDs &amp; Pagination</strong> (pr-ids-pagination), which compared ID strategies; here we open the box. A UUID (RFC 9562, May 2024, which obsoleted RFC 4122) is 128 bits written as 32 hex digits in 8-4-4-4-12 groups. Two fields are fixed in every modern UUID, and you can read them by eye:</p>
${UUID_LAYOUT}
<table><tr><th>Look at</th><th>Value</th><th>Meaning</th></tr>
<tr><td>13th hex digit (first of group 3)</td><td>1-8</td><td>Version: how the other bits were produced</td></tr>
<tr><td>17th hex digit (first of group 4)</td><td>8, 9, a, b</td><td>RFC variant (bits <code>10xx</code>)</td></tr>
<tr><td></td><td>c, d</td><td>Microsoft legacy GUID variant (<code>110x</code>)</td></tr>
<tr><td></td><td>0-7</td><td>Ancient NCS variant — or a string that isn't a real UUID</td></tr></table>
<p>So <code>0193247e-8a3c-<strong>7</strong>b12-<strong>9</strong>f4d-…</code> is a v7, RFC variant. A "UUID" with a <code>4</code> in position 13 but a <code>c</code> in position 17 was likely made by a homegrown generator — a hint to go check how.</p>
${UUID_DECODE}`,
        he: `<p>השיעור הזה צולל עמוק יותר מ-<strong>IDs &amp; Pagination</strong> ‏(pr-ids-pagination), שהשווה בין אסטרטגיות של מזהים. כאן פותחים את הקופסה. UUID מוגדר ב-RFC 9562 (מאי 2024, החליף את RFC 4122): 128 bits שנכתבים כ-32 ספרות hex בקבוצות של 8-4-4-4-12. בכל UUID מודרני יש שני שדות קבועים, ואפשר לקרוא אותם בעין:</p>
${UUID_LAYOUT}
<table><tr><th>איפה להסתכל</th><th>ערך</th><th>משמעות</th></tr>
<tr><td>ספרת ה-hex ה-13 (ראשונה בקבוצה 3)</td><td>1-8</td><td>Version: איך נוצרו שאר ה-bits</td></tr>
<tr><td>ספרת ה-hex ה-17 (ראשונה בקבוצה 4)</td><td>8, 9, a, b</td><td>ה-variant של ה-RFC (bits <code>10xx</code>)</td></tr>
<tr><td></td><td>c, d</td><td>ה-variant הישן של GUID של Microsoft ‏(<code>110x</code>)</td></tr>
<tr><td></td><td>0-7</td><td>ה-variant העתיק של NCS, או מחרוזת שבכלל לא UUID אמיתי</td></tr></table>
<p>כלומר <code>0193247e-8a3c-<strong>7</strong>b12-<strong>9</strong>f4d-…</code> הוא v7 עם variant של RFC. אם אתה רואה "UUID" עם <code>4</code> במקום ה-13 אבל <code>c</code> במקום ה-17, כנראה מישהו כתב generator בעצמו. סימן ללכת לבדוק איך.</p>
${UUID_DECODE}`
      }
    },
    {
      h: { en: "Every version, and which ones to actually use", he: "כל ה-versions, ובאילו באמת להשתמש" },
      body: {
        en: `<table><tr><th>Ver</th><th>Built from</th><th>Sortable</th><th>Verdict</th></tr>
<tr><td>v1</td><td>60-bit timestamp (100 ns ticks since 1582-10-15) + 14-bit clock sequence + 48-bit node (MAC address)</td><td>No (time fields are stored low-first)</td><td>Avoid: leaks the machine's MAC and creation time</td></tr>
<tr><td>v2</td><td>DCE Security (POSIX UID/GID in the time field)</td><td>-</td><td>Practically never used</td></tr>
<tr><td>v3 / v5</td><td>Namespace UUID + name, hashed with MD5 (v3) or SHA-1 truncated to 122 bits (v5)</td><td>No</td><td>Use v5 when you need a <em>deterministic</em> ID</td></tr>
<tr><td>v4</td><td>122 random bits</td><td>No</td><td>Fine default when order doesn't matter</td></tr>
<tr><td>v6</td><td>v1 with the timestamp re-ordered high-first</td><td>Yes</td><td>Only for migrating v1 systems; RFC says prefer v7</td></tr>
<tr><td>v7</td><td>48-bit Unix ms + 74 random (or counter) bits</td><td>Yes, by ms</td><td>Best default for database keys</td></tr>
<tr><td>v8</td><td>Anything you want; only version and variant are fixed (122 custom bits)</td><td>Your call</td><td>Vendor-specific schemes, e.g. embedding a shard id</td></tr></table>
<p><strong>v1's privacy leak is real history:</strong> in 1999 the author of the Melissa virus was traced partly through the GUID inside the Word document, which contained his PC's MAC address. Anyone holding a v1 UUID can extract when and on which NIC it was made.</p>
<p><strong>v5 = deterministic IDs.</strong> Same namespace + same name ⇒ same UUID on every machine. That gives you idempotent imports ("the user row for <code>alice@corp.com</code> always has id X"), dedupe across services without coordination, and stable ids for things that only have a natural key (URLs, file paths, Kubernetes object names). The flip side: anyone who knows the name can compute the ID — never treat a v5 as a secret.</p>
<p><strong>v7 and monotonicity.</strong> v7 orders by millisecond only. Inside one ms the random tail is unordered:</p>
${UUID7_CODE}
<p>RFC 9562 allows using the 12-bit <code>rand_a</code> as a sub-millisecond fraction or counter to stay monotonic inside one generator. PostgreSQL 18's <code>uuidv7()</code> does exactly that within a session. Across many app servers there is no global order anyway — clocks drift, so treat v7 order as "roughly by creation time", not as an event log.</p>`,
        he: `<table><tr><th>Ver</th><th>ממה הוא בנוי</th><th>ניתן למיון</th><th>שורה תחתונה</th></tr>
<tr><td>v1</td><td>Timestamp של 60 bits (יחידות של 100 ns מאז 15.10.1582) + clock sequence של 14 bits + node של 48 bits (כתובת MAC)</td><td>לא (שדות הזמן נשמרים מהחלק הנמוך)</td><td>להימנע: חושף את ה-MAC של המכונה ואת זמן היצירה</td></tr>
<tr><td>v2</td><td>DCE Security ‏(UID/GID של POSIX בתוך שדה הזמן)</td><td>-</td><td>כמעט אף אחד לא משתמש</td></tr>
<tr><td>v3 / v5</td><td>UUID של namespace + שם, עם hash של MD5 ‏(v3) או SHA-1 שנחתך ל-122 bits ‏(v5)</td><td>לא</td><td>v5 כשצריך מזהה <em>דטרמיניסטי</em></td></tr>
<tr><td>v4</td><td>122 bits אקראיים</td><td>לא</td><td>ברירת מחדל טובה כשהסדר לא משנה</td></tr>
<tr><td>v6</td><td>v1 עם ה-timestamp מסודר מהחלק הגבוה</td><td>כן</td><td>רק להגירה ממערכות v1. ה-RFC ממליץ על v7</td></tr>
<tr><td>v7</td><td>Unix ms של 48 bits + 74 bits אקראיים (או counter)</td><td>כן, לפי ms</td><td>ברירת המחדל הכי טובה ל-keys בדאטהבייס</td></tr>
<tr><td>v8</td><td>מה שתרצה. רק version ו-variant קבועים (122 bits חופשיים)</td><td>תלוי בך</td><td>סכמות של vendor, למשל להטמיע shard id</td></tr></table>
<p><strong>דליפת הפרטיות של v1 היא היסטוריה אמיתית:</strong> ב-1999 איתרו את כותב וירוס Melissa בין היתר דרך ה-GUID שבתוך מסמך ה-Word, שהכיל את כתובת ה-MAC של המחשב שלו. מי שמחזיק UUID v1 יכול לחלץ ממנו מתי ועל איזה כרטיס רשת הוא נוצר.</p>
<p><strong>v5 = מזהים דטרמיניסטיים.</strong> אותו namespace ואותו שם ⇐ אותו UUID בכל מכונה. זה נותן לך imports אידמפוטנטיים ("לשורת המשתמש של <code>alice@corp.com</code> תמיד יש id X"), dedupe בין שירותים בלי תיאום, ומזהים יציבים לדברים שיש להם רק natural key (URLs, נתיבי קבצים, שמות של אובייקטים ב-Kubernetes). הצד השני: מי שיודע את השם יכול לחשב את המזהה, אז v5 הוא אף פעם לא סוד.</p>
<p><strong>v7 ו-monotonicity.</strong> v7 ממוין רק לפי מילישנייה. בתוך אותה ms הזנב האקראי לא מסודר:</p>
${UUID7_CODE}
<p>ה-RFC מאפשר להשתמש ב-12 ה-bits של <code>rand_a</code> כשבר של מילישנייה או כ-counter כדי לשמור על סדר בתוך generator אחד. ה-<code>uuidv7()</code> של PostgreSQL 18 עושה בדיוק את זה בתוך session. בין הרבה שרתי אפליקציה אין סדר גלובלי בכל מקרה (שעונים זזים), אז תתייחס לסדר של v7 כ"בערך לפי זמן יצירה", לא כ-event log.</p>`
      }
    },
    {
      h: { en: "Collision math: the birthday bound, worked out", he: "מתמטיקה של התנגשויות: חסם יום ההולדת, עם חישוב" },
      body: {
        en: `<p>With N possible values and n generated IDs, the chance of <em>any</em> collision is about <code>p ≈ 1 − e^(−n²/2N) ≈ n²/2N</code> (the birthday paradox: 23 people give a 50% chance of a shared birthday out of 365). For v4, N = 2<sup>122</sup> ≈ 5.3 × 10<sup>36</sup>:</p>
${COLLISION_CODE}
<table><tr><th>IDs generated</th><th>P(at least one collision)</th></tr>
<tr><td>1 trillion (10<sup>12</sup>)</td><td>9.4 × 10<sup>-14</sup></td></tr>
<tr><td>103 trillion (1.03 × 10<sup>14</sup>)</td><td>1 in a billion</td></tr>
<tr><td>1 billion/s for a year (3.2 × 10<sup>16</sup>)</td><td>9.4 × 10<sup>-5</sup></td></tr>
<tr><td>2.71 × 10<sup>18</sup> (1 billion/s for ~86 years)</td><td>50%</td></tr></table>
<p>For v7 only the 74 random bits inside the <em>same millisecond</em> compete: you'd need ~1.6 × 10<sup>11</sup> IDs in one ms for 50%; at 1 million IDs per ms the chance is 2.65 × 10<sup>-11</sup> per ms. Fine for any real system.</p>
<blockquote>💡 Real world: Every "UUID collision" postmortem I know of was a <strong>randomness bug</strong>, not math: a polyfill built on <code>Math.random()</code>, a VM image cloned with the userspace RNG state baked in, forked workers sharing one seeded PRNG, or someone "shortening" UUIDs to 8 hex chars (32 bits ⇒ 50% collision chance after only ~77,000 IDs). The math only holds if the 122 bits come from a CSPRNG — see <strong>random-numbers</strong>.</blockquote>`,
        he: `<p>עם N ערכים אפשריים ו-n מזהים שנוצרו, הסיכוי ל<em>התנגשות כלשהי</em> הוא בערך <code>p ≈ 1 − e^(−n²/2N) ≈ n²/2N</code> (פרדוקס יום ההולדת: 23 אנשים נותנים סיכוי של 50% ליום הולדת משותף מתוך 365). ל-v4 יש N = 2<sup>122</sup> ≈ 5.3 × 10<sup>36</sup>:</p>
${COLLISION_CODE}
<table><tr><th>מזהים שנוצרו</th><th>הסיכוי להתנגשות אחת לפחות</th></tr>
<tr><td>טריליון (10<sup>12</sup>)</td><td>9.4 × 10<sup>-14</sup></td></tr>
<tr><td>103 טריליון (1.03 × 10<sup>14</sup>)</td><td>אחד למיליארד</td></tr>
<tr><td>מיליארד בשנייה במשך שנה (3.2 × 10<sup>16</sup>)</td><td>9.4 × 10<sup>-5</sup></td></tr>
<tr><td>2.71 × 10<sup>18</sup> (מיליארד בשנייה במשך ~86 שנה)</td><td>50%</td></tr></table>
<p>ב-v7 מתחרים רק 74 ה-bits האקראיים בתוך <em>אותה מילישנייה</em>: צריך בערך 1.6 × 10<sup>11</sup> מזהים ב-ms אחת כדי להגיע ל-50%. במיליון מזהים ל-ms הסיכוי הוא 2.65 × 10<sup>-11</sup> לכל ms. מספיק לכל מערכת אמיתית.</p>
<blockquote>💡 מהשטח: כל postmortem של "התנגשות UUID" שאני מכיר היה <strong>באג באקראיות</strong>, לא מתמטיקה: polyfill שבנוי על <code>Math.random()</code>, image של VM ששוכפל עם מצב ה-RNG של userspace בפנים, workers אחרי fork שחולקים PRNG אחד עם אותו seed, או מישהו ש"קיצר" UUID-ים ל-8 תווי hex ‏(32 bits ⇐ סיכוי של 50% להתנגשות אחרי ~77,000 מזהים בלבד). המתמטיקה מחזיקה רק אם 122 ה-bits מגיעים מ-CSPRNG. ראה <strong>random-numbers</strong>.</blockquote>`
      }
    },
    {
      h: { en: "GUIDs, byte order and storage", he: "GUID, סדר bytes ואחסון" },
      body: {
        en: `<p><strong>GUID</strong> is Microsoft's name for the same 128-bit thing — the string format is identical. The trap is the <em>binary</em> form: Windows/.NET store the first three groups little-endian.</p>
${GUID_BYTES}
<p>Symptoms in production: a service in C# writes <code>ToByteArray()</code> into a <code>BINARY(16)</code> column, a Go or Java service reads it back and gets a "different" UUID; or a team switches to <code>Guid.CreateVersion7()</code> (.NET 9) expecting sequential inserts into a SQL Server clustered index and sees no improvement, because SQL Server sorts by the last group first.</p>
<p><strong>Storage: 16 bytes, not 36.</strong></p>
<table><tr><th>Column</th><th>Size per value</th><th>Notes</th></tr>
<tr><td>Postgres <code>uuid</code></td><td>16 B</td><td>Binary, fast memcmp compare, validates format</td></tr>
<tr><td>MySQL <code>BINARY(16)</code></td><td>16 B</td><td>Use <code>UUID_TO_BIN</code>/<code>BIN_TO_UUID</code></td></tr>
<tr><td>SQL Server <code>uniqueidentifier</code></td><td>16 B</td><td>Odd sort order (above)</td></tr>
<tr><td><code>CHAR(36)</code> / <code>text</code></td><td>36-37 B (InnoDB with utf8mb4 may reserve up to 144 B)</td><td>Collation-aware string compares; 2.25x+ bigger in every index</td></tr></table>
${STORAGE_SQL}
<p>In InnoDB the primary key is copied into <em>every secondary index</em>, so a <code>CHAR(36)</code> PK on a table with 5 secondary indexes pays the 20+ extra bytes six times per row. At 500M rows that's tens of GB of RAM your buffer pool now can't use for data.</p>`,
        he: `<p><strong>GUID</strong> הוא השם של Microsoft לאותו דבר של 128 bits, ופורמט המחרוזת זהה. המלכודת היא בייצוג ה<em>בינארי</em>: Windows ו-.NET שומרים את שלוש הקבוצות הראשונות ב-little-endian.</p>
${GUID_BYTES}
<p>איך זה נראה בפרודקשן: שירות ב-C# כותב <code>ToByteArray()</code> לעמודת <code>BINARY(16)</code>, שירות ב-Go או Java קורא אותה וקיבל UUID "אחר". או שצוות עובר ל-<code>Guid.CreateVersion7()</code> ‏(.NET 9) ומצפה ל-inserts רציפים ל-clustered index ב-SQL Server, ולא רואה שום שיפור, כי SQL Server ממיין קודם לפי הקבוצה האחרונה.</p>
<p><strong>אחסון: 16 bytes, לא 36.</strong></p>
<table><tr><th>עמודה</th><th>גודל לערך</th><th>הערות</th></tr>
<tr><td><code>uuid</code> ב-Postgres</td><td>16 B</td><td>בינארי, השוואת memcmp מהירה, בודק פורמט</td></tr>
<tr><td><code>BINARY(16)</code> ב-MySQL</td><td>16 B</td><td>עם <code>UUID_TO_BIN</code>/<code>BIN_TO_UUID</code></td></tr>
<tr><td><code>uniqueidentifier</code> ב-SQL Server</td><td>16 B</td><td>סדר מיון מוזר (למעלה)</td></tr>
<tr><td><code>CHAR(36)</code> / <code>text</code></td><td>36-37 B ‏(InnoDB עם utf8mb4 עלול לשריין עד 144 B)</td><td>השוואות מחרוזת לפי collation. פי 2.25 ויותר בכל אינדקס</td></tr></table>
${STORAGE_SQL}
<p>ב-InnoDB ה-primary key מועתק ל<em>כל secondary index</em>, אז PK מסוג <code>CHAR(36)</code> בטבלה עם 5 secondary indexes משלם את ה-20+ bytes העודפים שש פעמים לכל שורה. ב-500M שורות זה עשרות GB של RAM שה-buffer pool כבר לא יכול לנצל לדאטה.</p>`
      }
    },
    {
      h: { en: "Random keys vs the B-tree: page splits, fill factor, WAL", he: "מפתחות אקראיים מול ה-B-tree: page splits, fill factor ו-WAL" },
      body: {
        en: `<p>A B-tree keeps keys sorted in fixed-size pages (8 KB in Postgres, 16 KB in InnoDB). A time-ordered key always lands on the right-most leaf: one hot page in cache, splits only at the edge, pages left ~90-100% full. A v4 key lands on a <em>random</em> leaf: the whole index becomes the working set, full pages split in the middle, and steady-state fill drops to about <strong>69% (ln 2)</strong> — the classic result for random inserts into a B-tree. Measured on a laptop:</p>
${BENCH}
<p>What it costs in a real database:</p>
<ul>
<li><strong>Buffer pool / shared_buffers misses.</strong> With v7, only the last few leaf pages are hot. With v4, every insert needs a random page — once the index outgrows RAM, each insert becomes a disk read.</li>
<li><strong>More WAL in Postgres.</strong> The first change to a page after each checkpoint writes the whole 8 KB page image (<code>full_page_writes</code>). Random keys touch thousands of distinct pages per checkpoint, so WAL volume, replication lag and backup size grow — often more than the index itself.</li>
<li><strong>Bigger, emptier indexes</strong> (~30% wasted space), which also slow every scan and every <code>VACUUM</code>.</li>
</ul>
<blockquote>⚠️ Production tip: Moving an existing table from v4 to v7 helps only new inserts. The old part of the index stays fragmented until you rebuild it: <code>REINDEX INDEX CONCURRENTLY orders_pkey;</code> in Postgres, or <code>ALTER TABLE orders ENGINE=InnoDB;</code> / <code>OPTIMIZE TABLE</code> (online rebuild) in MySQL. Check before and after with <code>pgstattuple</code>'s <code>pgstatindex('orders_pkey')</code> → <code>avg_leaf_density</code>.</blockquote>
<p>Lesson db-index-kinds explains clustered (InnoDB) vs heap (Postgres) tables; the damage is biggest on clustered tables, where the random key reorders the <em>rows themselves</em>.</p>`,
        he: `<p>B-tree שומר keys ממוינים בדפים בגודל קבוע (8 KB ב-Postgres, ‏16 KB ב-InnoDB). מפתח שמסודר לפי זמן תמיד נוחת בעלה הימני ביותר: דף חם אחד ב-cache, פיצולים רק בקצה, ודפים שנשארים מלאים בערך 90-100%. מפתח v4 נוחת בעלה <em>אקראי</em>: כל האינדקס הופך ל-working set, דפים מלאים מתפצלים באמצע, וה-fill היציב יורד לבערך <strong>69% (ln 2)</strong>, התוצאה הקלאסית ל-inserts אקראיים ל-B-tree. מדידה על לפטופ:</p>
${BENCH}
<p>כמה זה עולה בדאטהבייס אמיתי:</p>
<ul>
<li><strong>Misses ב-buffer pool וב-shared_buffers.</strong> עם v7 רק כמה דפי עלים אחרונים חמים. עם v4 כל insert צריך דף אקראי, וברגע שהאינדקס גדול מה-RAM כל insert הופך לקריאה מהדיסק.</li>
<li><strong>יותר WAL ב-Postgres.</strong> השינוי הראשון בדף אחרי כל checkpoint כותב את כל תמונת הדף של 8 KB ‏(<code>full_page_writes</code>). מפתחות אקראיים נוגעים באלפי דפים שונים בכל checkpoint, אז נפח ה-WAL, ה-replication lag וגודל הגיבוי גדלים, לפעמים יותר מהאינדקס עצמו.</li>
<li><strong>אינדקסים גדולים וריקים יותר</strong> (~30% מקום מבוזבז), שמאטים גם כל scan וכל <code>VACUUM</code>.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מעבר של טבלה קיימת מ-v4 ל-v7 עוזר רק ל-inserts חדשים. החלק הישן של האינדקס נשאר מפוצל עד שבונים אותו מחדש: <code>REINDEX INDEX CONCURRENTLY orders_pkey;</code> ב-Postgres, או <code>ALTER TABLE orders ENGINE=InnoDB;</code> / <code>OPTIMIZE TABLE</code> (rebuild אונליין) ב-MySQL. תבדוק לפני ואחרי עם <code>pgstatindex('orders_pkey')</code> של <code>pgstattuple</code> ותסתכל על <code>avg_leaf_density</code>.</blockquote>
<p>השיעור db-index-kinds מסביר טבלאות clustered ‏(InnoDB) מול heap ‏(Postgres). הנזק הכי גדול בטבלאות clustered, שבהן המפתח האקראי מסדר מחדש את <em>השורות עצמן</em>.</p>`
      }
    },
    {
      h: { en: "Alternatives, public exposure, and generating them in code", he: "חלופות, חשיפה החוצה ויצירה בקוד" },
      body: {
        en: `<table><tr><th>Scheme</th><th>Bits / text</th><th>Layout</th><th>Sortable</th><th>Coordination</th><th>Good for</th></tr>
<tr><td>DB sequence (BIGSERIAL / IDENTITY)</td><td>64 / up to 19 digits</td><td>counter</td><td>Yes</td><td>The DB (one writer)</td><td>Internal PKs, smallest + fastest joins</td></tr>
<tr><td>UUID v4</td><td>128 / 36</td><td>122 random</td><td>No</td><td>None</td><td>Opaque public IDs, small tables</td></tr>
<tr><td>UUID v7</td><td>128 / 36</td><td>48 ms + 74 random</td><td>By ms</td><td>None</td><td>Default distributed PK</td></tr>
<tr><td>ULID</td><td>128 / 26 (Crockford Base32)</td><td>48 ms + 80 random</td><td>By ms (lasts to year 10889)</td><td>None</td><td>Same idea as v7, shorter text; not an RFC</td></tr>
<tr><td>KSUID</td><td>160 / 27 (Base62)</td><td>32-bit seconds (2014 epoch, ~136 years) + 128 random</td><td>By second</td><td>None</td><td>Huge random part; Segment's format</td></tr>
<tr><td>Snowflake</td><td>64 / up to 19 digits</td><td>41 ms (~69.7 years) + 10 worker + 12 seq</td><td>By ms</td><td>Unique worker ids</td><td>Fits BIGINT; X/Twitter, Discord, Instagram variant</td></tr>
<tr><td>TSID</td><td>64 / 13 (Crockford)</td><td>42 ms + 22 node/counter/random</td><td>By ms</td><td>Optional node id</td><td>Snowflake-like in a BIGINT, Java/Hibernate world</td></tr>
<tr><td>Nano ID</td><td>~126 / 21 (A-Za-z0-9_-)</td><td>all random</td><td>No</td><td>None</td><td>Short URL-safe public tokens</td></tr></table>
<p><strong>Exposing IDs publicly:</strong></p>
<ul>
<li><strong>Sequential IDs</strong> invite enumeration (<code>/invoices/1043</code> → try 1044: an IDOR if authorization is missing) and leak volume — two invoices a week apart reveal your weekly sales.</li>
<li><strong>v7 / ULID / Snowflake leak the creation time</strong> to the millisecond (<code>uuid_extract_timestamp()</code> above). Usually harmless; not OK when "when was this account/document created" is sensitive, e.g. medical records or whistleblower submissions.</li>
<li><strong>v1 leaks the MAC address</strong>; v5 can be recomputed by anyone who knows the name.</li>
<li><strong>An unguessable ID is not authorization.</strong> v4 has 122 bits of entropy, but IDs end up in logs, referrers and screenshots. Check access on every request; use a separate CSPRNG token (<code>secrets.token_urlsafe(32)</code>) for "anyone with the link" shares.</li>
</ul>
${GEN_CODE}`,
        he: `<table><tr><th>סכמה</th><th>Bits / טקסט</th><th>מבנה</th><th>ניתן למיון</th><th>תיאום</th><th>מתאים ל-</th></tr>
<tr><td>Sequence בדאטהבייס (BIGSERIAL / IDENTITY)</td><td>64 / עד 19 ספרות</td><td>counter</td><td>כן</td><td>הדאטהבייס (כותב אחד)</td><td>PK פנימי, הכי קטן ו-joins הכי מהירים</td></tr>
<tr><td>UUID v4</td><td>128 / 36</td><td>122 אקראיים</td><td>לא</td><td>אין</td><td>מזהים אטומים כלפי חוץ, טבלאות קטנות</td></tr>
<tr><td>UUID v7</td><td>128 / 36</td><td>48 ms + 74 אקראיים</td><td>לפי ms</td><td>אין</td><td>ברירת המחדל ל-PK מבוזר</td></tr>
<tr><td>ULID</td><td>128 / 26 ‏(Crockford Base32)</td><td>48 ms + 80 אקראיים</td><td>לפי ms (עד שנת 10889)</td><td>אין</td><td>אותו רעיון כמו v7 עם טקסט קצר יותר. לא RFC</td></tr>
<tr><td>KSUID</td><td>160 / 27 ‏(Base62)</td><td>32 bits של שניות (epoch של 2014, ~136 שנה) + 128 אקראיים</td><td>לפי שנייה</td><td>אין</td><td>חלק אקראי ענק. הפורמט של Segment</td></tr>
<tr><td>Snowflake</td><td>64 / עד 19 ספרות</td><td>41 ms (~69.7 שנים) + 10 worker + 12 seq</td><td>לפי ms</td><td>worker id ייחודי</td><td>נכנס ב-BIGINT. ‏X/Twitter, ‏Discord, וריאנט של Instagram</td></tr>
<tr><td>TSID</td><td>64 / 13 ‏(Crockford)</td><td>42 ms + 22 של node/counter/random</td><td>לפי ms</td><td>node id אופציונלי</td><td>כמו Snowflake ב-BIGINT, בעולם של Java/Hibernate</td></tr>
<tr><td>Nano ID</td><td>~126 / 21 ‏(A-Za-z0-9_-)</td><td>הכל אקראי</td><td>לא</td><td>אין</td><td>טוקנים קצרים ו-URL-safe כלפי חוץ</td></tr></table>
<p><strong>חשיפת מזהים החוצה:</strong></p>
<ul>
<li><strong>מזהים רציפים</strong> מזמינים enumeration ‏(<code>/invoices/1043</code> ← מנסים 1044: חולשת IDOR אם חסרה בדיקת הרשאה) וחושפים נפח. שתי חשבוניות בהפרש שבוע מגלות את המכירות השבועיות שלך.</li>
<li><strong>v7, ULID ו-Snowflake חושפים את זמן היצירה</strong> ברמת מילישנייה (<code>uuid_extract_timestamp()</code> למעלה). בדרך כלל לא מזיק, אבל לא בסדר כש"מתי נפתח החשבון או המסמך" זה מידע רגיש, למשל רשומות רפואיות או פניות של חושפי שחיתויות.</li>
<li><strong>v1 חושף את כתובת ה-MAC</strong>, ואת v5 יכול לחשב מחדש כל מי שיודע את השם.</li>
<li><strong>מזהה שאי אפשר לנחש הוא לא הרשאה.</strong> ל-v4 יש 122 bits של אנטרופיה, אבל מזהים מגיעים ללוגים, ל-referrers ולצילומי מסך. בודקים הרשאה בכל בקשה, ולשיתוף של "כל מי שיש לו את הלינק" משתמשים בטוקן CSPRNG נפרד (<code>secrets.token_urlsafe(32)</code>).</li>
</ul>
${GEN_CODE}`
      }
    }
  ],
  diagram: "UUID v4: [ 48 rand | ver=4 | 12 rand | var=10 | 62 rand ]   -> random leaf page on every INSERT\nUUID v7: [ 48-bit unix ms | ver=7 | 12 rand/counter | var=10 | 62 rand ] -> right-most leaf\n\nB-tree leaves:  [....][....][....][....][....][NEW]   <- v7 appends here\n                   ^        ^          ^               <- v4 lands anywhere (split, 69% fill)",
  handsOn: [
    { cmd: "python3 -c \"import uuid; u=uuid.uuid4(); print(u, u.version, u.variant)\"", what: { en: "Generate a v4 and read its version digit (13th hex char) and variant.", he: "צור v4 ותקרא את ספרת ה-version (תו ה-hex ה-13) ואת ה-variant." } },
    { cmd: "python3 -c \"import uuid; print(uuid.uuid5(uuid.NAMESPACE_DNS, 'example.com'))\"", what: { en: "Run it twice, or on two machines: same output (cfbff0d1-9375-5685-968c-48ce8b15ae17). That's a deterministic ID.", he: "תריץ פעמיים, או על שתי מכונות: אותה תוצאה (cfbff0d1-9375-5685-968c-48ce8b15ae17). זה מזהה דטרמיניסטי." } },
    { cmd: "psql -c \"SELECT uuidv7() AS id, uuid_extract_timestamp(uuidv7()) AS ts;\"", what: { en: "PostgreSQL 18: generate a v7 and pull the timestamp back out of it (the information leak, live).", he: "PostgreSQL 18: צור v7 ותחלץ ממנו את ה-timestamp בחזרה (דליפת המידע, בשידור חי)." } },
    { cmd: "node -e \"console.log(require('crypto').randomUUID())\"", what: { en: "Node's built-in v4 generator, backed by the OS CSPRNG.", he: "ה-generator המובנה של Node ל-v4, מגובה ב-CSPRNG של מערכת ההפעלה." } }
  ],
  mnemonic: {
    en: "\"13th digit = version, 17th = variant; v4 random, v5 repeatable, v7 sortable — and 16 bytes, never 36.\"",
    he: "\"ספרה 13 = version, ספרה 17 = variant. v4 אקראי, v5 חוזר על עצמו, v7 ממוין, ו-16 bytes, אף פעם לא 36.\""
  },
  pitfalls: [
    { en: "Storing UUIDs as CHAR(36)/VARCHAR: 2.25x+ bigger in every index (and copied into every InnoDB secondary index), slower collation-aware comparisons. Use uuid / BINARY(16).", he: "לשמור UUID כ-CHAR(36) או VARCHAR: פי 2.25 ויותר בכל אינדקס (ומועתק לכל secondary index ב-InnoDB), והשוואות לפי collation איטיות יותר. תשתמש ב-uuid או ב-BINARY(16)." },
    { en: "Using random v4 as the clustered primary key of a large, insert-heavy table: page splits, ~69% full pages, cache misses and WAL bloat. Use v7 (or a bigint) and keep v4 for opaque public tokens if needed.", he: "להשתמש ב-v4 אקראי כ-clustered primary key בטבלה גדולה עם הרבה inserts: page splits, דפים מלאים רק ~69%, cache misses ו-WAL מנופח. תשתמש ב-v7 (או bigint), ותשאיר v4 לטוקנים אטומים כלפי חוץ אם צריך." },
    { en: "Mixing .NET Guid.ToByteArray() with big-endian readers (Java, Go, Postgres): the first 3 groups come out byte-swapped. And SQL Server's uniqueidentifier sorts by the last 6 bytes first, so v7 doesn't help a clustered index there.", he: "לערבב Guid.ToByteArray() של .NET עם קוראים שעובדים ב-big-endian ‏(Java, Go, Postgres): שלוש הקבוצות הראשונות יוצאות עם bytes הפוכים. ו-uniqueidentifier של SQL Server ממיין קודם לפי 6 ה-bytes האחרונים, אז v7 לא עוזר שם ל-clustered index." },
    { en: "Treating a UUID as a secret or as authorization. v1/v5/v7 are partly or fully predictable, and even v4 leaks into logs. Authorize every request; use a dedicated CSPRNG token for capability links.", he: "להתייחס ל-UUID כסוד או כהרשאה. v1, v5 ו-v7 צפויים חלקית או לגמרי, וגם v4 דולף ללוגים. בודקים הרשאה בכל בקשה, ולינקים של capability מקבלים טוקן CSPRNG ייעודי." }
  ],
  interview: [
    {
      q: { en: "Your team wants UUIDs instead of BIGSERIAL for a 2-billion-row orders table. What do you recommend?", he: "הצוות רוצה UUID במקום BIGSERIAL לטבלת orders של 2 מיליארד שורות. מה אתה ממליץ?" },
      a: { en: "UUID v7 stored in a native 16-byte type (uuid / BINARY(16)), not v4 and not text. v7 keeps inserts at the right edge of the B-tree, so fill stays high, the hot set stays small and WAL doesn't explode; v4 would scatter inserts, drop leaf fill to ~69% and make every insert a random page once the index outgrows RAM. Generate in the app if you need the id before the insert (outbox, idempotency). If the IDs go public, accept that v7 leaks creation time — or keep a bigint/v7 internal key and a separate random public id. Collision risk is irrelevant (2.7e18 IDs for 50% with v4; v7 only competes within a ms) as long as the generator uses a CSPRNG.", he: "UUID v7 שנשמר בטיפוס native של 16 bytes ‏(uuid או BINARY(16)), לא v4 ולא טקסט. v7 שומר את ה-inserts בקצה הימני של ה-B-tree, כך שה-fill נשאר גבוה, ה-hot set קטן וה-WAL לא מתפוצץ. v4 היה מפזר inserts, מוריד את מילוי העלים ל-~69% והופך כל insert לדף אקראי ברגע שהאינדקס גדול מה-RAM. מייצרים באפליקציה אם צריך את ה-id לפני ה-insert (outbox, idempotency). אם המזהים נחשפים החוצה, צריך לקבל ש-v7 חושף זמן יצירה, או להחזיק key פנימי של bigint או v7 ומזהה ציבורי אקראי נפרד. סיכון ההתנגשות לא רלוונטי (2.7e18 מזהים ל-50% ב-v4, וב-v7 התחרות היא רק בתוך ms) כל עוד ה-generator משתמש ב-CSPRNG." }
    },
    {
      q: { en: "How do you tell a UUID's version from its string, and what does each tell an attacker?", he: "איך מזהים את ה-version של UUID מהמחרוזת, ומה כל אחד מספר לתוקף?" },
      a: { en: "The 13th hex digit (first of the third group) is the version; the 17th (8/9/a/b) marks the RFC variant. v1 reveals a 100-ns timestamp and the generating machine's MAC; v7 (and ULID/Snowflake) reveal creation time to the ms; v3/v5 can be recomputed by anyone who knows the namespace and name; v4 reveals nothing if it came from a CSPRNG. None of them replace an authorization check.", he: "ספרת ה-hex ה-13 (ראשונה בקבוצה השלישית) היא ה-version, וה-17 ‏(8/9/a/b) מסמנת את ה-variant של ה-RFC. v1 חושף timestamp ברזולוציה של 100 ns ואת ה-MAC של המכונה שיצרה אותו. v7 (וגם ULID ו-Snowflake) חושפים זמן יצירה ברמת ms. את v3/v5 יכול לחשב מחדש כל מי שיודע את ה-namespace ואת השם. v4 לא חושף כלום אם הגיע מ-CSPRNG. אף אחד מהם לא מחליף בדיקת הרשאה." }
    }
  ],
  quiz: [
    {
      q: { en: "What version and variant is 6ba7b810-9dad-11d1-80b4-00c04fd430c8?", he: "איזה version ו-variant יש ל-6ba7b810-9dad-11d1-80b4-00c04fd430c8?" },
      options: [
        { en: "v6, Microsoft variant", he: "v6, ה-variant של Microsoft" },
        { en: "v1, RFC variant", he: "v1, ה-variant של RFC" },
        { en: "v4, RFC variant", he: "v4, ה-variant של RFC" },
        { en: "v8, NCS variant", he: "v8, ה-variant של NCS" }
      ],
      answer: 1,
      explain: { en: "The 13th hex digit (first of group 3, '11d1') is 1 → time-based v1. The 17th ('80b4') is 8 → binary 10xx → RFC variant. This is the famous NAMESPACE_DNS UUID used as input for v3/v5.", he: "ספרת ה-hex ה-13 (ראשונה בקבוצה 3, ‏'11d1') היא 1 ← v1 מבוסס זמן. ה-17 ‏('80b4') היא 8 ← בינארי 10xx ← ה-variant של RFC. זה ה-UUID המפורסם NAMESPACE_DNS, שמשמש כקלט ל-v3/v5." }
    },
    {
      q: { en: "Roughly how many v4 UUIDs must you generate for a 50% chance of a single collision?", he: "בערך כמה UUID v4 צריך לייצר כדי להגיע לסיכוי של 50% להתנגשות אחת?" },
      options: [
        { en: "2^64 ≈ 1.8 × 10^19", he: "2^64 ≈ 1.8 × 10^19" },
        { en: "About 77,000", he: "בערך 77,000" },
        { en: "About 2.7 × 10^18 (1 billion/second for ~86 years)", he: "בערך 2.7 × 10^18 (מיליארד בשנייה במשך ~86 שנה)" },
        { en: "2^122 ≈ 5.3 × 10^36", he: "2^122 ≈ 5.3 × 10^36" }
      ],
      answer: 2,
      explain: { en: "Birthday bound: n ≈ sqrt(2 · ln2 · 2^122) ≈ 2.71 × 10^18. 77,000 is the 50% point for a 32-bit ID (e.g. a UUID cut to 8 hex chars); 2^122 is the size of the space, not the collision point.", he: "חסם יום ההולדת: n ≈ sqrt(2 · ln2 · 2^122) ≈ 2.71 × 10^18. ‏77,000 זו נקודת ה-50% למזהה של 32 bits (למשל UUID שנחתך ל-8 תווי hex), ו-2^122 הוא גודל המרחב, לא נקודת ההתנגשות." }
    },
    {
      q: { en: "Inserts into a large MySQL table with a UUID v4 primary key got 5x slower as it grew past RAM. The best fix for new rows?", he: "ה-inserts לטבלת MySQL גדולה עם primary key של UUID v4 נהיו איטיים פי 5 כשהיא עברה את גודל ה-RAM. מה התיקון הכי טוב לשורות חדשות?" },
      options: [
        { en: "Switch the key to UUID v7 in BINARY(16) so inserts append to the right edge of the B-tree", he: "להחליף את המפתח ל-UUID v7 ב-BINARY(16), כדי שה-inserts יתווספו בקצה הימני של ה-B-tree" },
        { en: "Convert the column to CHAR(36) so it's easier to read", he: "להמיר את העמודה ל-CHAR(36) כדי שיהיה קל יותר לקרוא" },
        { en: "Use UUID v5 of the row number", he: "להשתמש ב-UUID v5 של מספר השורה" },
        { en: "Add a secondary index on the UUID", he: "להוסיף secondary index על ה-UUID" }
      ],
      answer: 0,
      explain: { en: "Random keys hit a random leaf page per insert (page splits, ~69% fill, buffer pool misses). Time-ordered v7 appends to the hot right-most page. CHAR(36) makes it bigger, v5 output is hash-random too, and another index adds work.", he: "מפתחות אקראיים פוגעים בדף עלה אקראי בכל insert (page splits, ‏fill של ~69%, ‏misses ב-buffer pool). v7, שמסודר לפי זמן, מתווסף לדף הימני החם. CHAR(36) רק מגדיל, הפלט של v5 אקראי בדיוק כמו hash, ועוד אינדקס רק מוסיף עבודה." }
    },
    {
      q: { en: "A C# service writes Guid.ToByteArray() into a BINARY(16) column; a Go service reads 00112233-4455-... as 33221100-5544-.... Why?", he: "שירות ב-C# כותב Guid.ToByteArray() לעמודת BINARY(16), ושירות ב-Go קורא את 00112233-4455-... כ-33221100-5544-.... למה?" },
      options: [
        { en: "The Go uuid library has a bug", he: "יש באג בספריית ה-uuid של Go" },
        { en: ".NET stores the first three groups little-endian (mixed-endian); Go expects RFC big-endian bytes", he: ".NET שומר את שלוש הקבוצות הראשונות ב-little-endian ‏(mixed-endian), ו-Go מצפה ל-bytes ב-big-endian לפי ה-RFC" },
        { en: "MySQL reverses BINARY columns on read", he: "MySQL הופך עמודות BINARY בקריאה" },
        { en: "The GUID was version 2", he: "ה-GUID היה version 2" }
      ],
      answer: 1,
      explain: { en: "Microsoft's binary GUID layout byte-swaps the first 4-2-2 groups; the last 8 bytes are unchanged. Convert explicitly (e.g. new Guid(bytes, bigEndian: true) / TryWriteBytes(..., bigEndian: true) in .NET 8+), or exchange the string form.", he: "המבנה הבינארי של GUID אצל Microsoft הופך את סדר ה-bytes בקבוצות 4-2-2 הראשונות, ו-8 ה-bytes האחרונים לא משתנים. ממירים במפורש (למשל new Guid(bytes, bigEndian: true) או TryWriteBytes(..., bigEndian: true) ב-.NET 8 ומעלה), או מעבירים את המחרוזת." }
    }
  ],
  related: ["pr-ids-pagination", "db-index-kinds", "db-indexes", "random-numbers", "pr-time-timestamps", "pr-idempotency", "pr-security-owasp"]
});

// ======================= Lesson 2 =======================
INFRA.lessons.push({
  id: "random-numbers",
  track: "foundations",
  order: 46,
  icon: "🎲",
  level: 2,
  minutes: 17,
  title: { en: "Random Numbers for Engineers", he: "מספרים אקראיים למהנדסים" },
  tldr: {
    en: "Anything an attacker must not guess (tokens, keys, reset codes, session ids) comes from the OS CSPRNG via secrets / crypto.randomBytes / SecureRandom / crypto/rand; fast seeded PRNGs are for jitter, sampling, shuffling and tests — and they're fully predictable from their output.",
    he: "כל דבר שאסור לתוקף לנחש (טוקנים, מפתחות, קודי איפוס, session ids) מגיע מה-CSPRNG של מערכת ההפעלה דרך secrets, ‏crypto.randomBytes, ‏SecureRandom או crypto/rand. PRNG מהיר עם seed מתאים ל-jitter, ‏sampling, ערבוב ובדיקות, והוא צפוי לגמרי מתוך הפלט שלו."
  },
  analogy: {
    en: "A PRNG is a deck of cards shuffled once at the factory: it looks random, but anyone who sees enough cards can work out the factory order and call every next card. A CSPRNG is a dealer who keeps throwing fresh noise into the deck and never lets the cards you see reveal the order. True randomness is the dice themselves — physical noise — which the OS collects and uses to seed the dealer.",
    he: "PRNG הוא חפיסת קלפים שעורבבה פעם אחת במפעל: נראית אקראית, אבל מי שרואה מספיק קלפים יכול לשחזר את סדר המפעל ולנחש כל קלף הבא. CSPRNG הוא דילר שכל הזמן זורק לחפיסה רעש חדש, ולא מאפשר שהקלפים שראית יחשפו את הסדר. אקראיות אמיתית היא הקוביות עצמן, רעש פיזיקלי, שמערכת ההפעלה אוספת ומשתמשת בו כדי לתת לדילר seed."
  },
  sections: [
    {
      h: { en: "True random, PRNG, CSPRNG: three different tools", he: "אקראיות אמיתית, PRNG ו-CSPRNG: שלושה כלים שונים" },
      body: {
        en: `<p>Lessons crypto-hashing-practice and crypto-encryption-practice keep saying "random salt", "unique nonce", "fresh key". This lesson is about where those bytes come from.</p>
<table><tr><th></th><th>True RNG (TRNG)</th><th>PRNG</th><th>CSPRNG</th></tr>
<tr><td>Source</td><td>Physical noise: thermal/jitter, CPU <code>RDSEED</code>/<code>RDRAND</code>, TPM, Cloudflare's lava-lamp wall</td><td>Deterministic function of a seed</td><td>Deterministic, keyed by real entropy, constantly reseeded</td></tr>
<tr><td>Predictable from outputs?</td><td>No</td><td><strong>Yes</strong> (state recoverable)</td><td>No (computationally infeasible)</td></tr>
<tr><td>Reproducible with a seed?</td><td>No</td><td>Yes</td><td>Not by design</td></tr>
<tr><td>Speed</td><td>Slow, limited</td><td>Very fast (ns)</td><td>Fast (GB/s with ChaCha20 / AES-CTR)</td></tr>
<tr><td>Examples</td><td>Hardware, <code>/dev/hwrng</code></td><td>Mersenne Twister, LCG, xorshift128+, PCG, ChaCha8 (Go math/rand/v2)</td><td>Linux <code>getrandom()</code>, Windows <code>BCryptGenRandom</code>, macOS <code>arc4random</code></td></tr>
<tr><td>Use for</td><td>Seeding the CSPRNG (the OS does this)</td><td>Simulations, games, jitter, sampling, tests</td><td>Tokens, keys, nonces, salts, passwords, UUID v4</td></tr></table>
<p>Engineers almost never touch a TRNG directly. The rule is binary: <strong>does it matter if someone predicts it?</strong> Yes ⇒ CSPRNG. No ⇒ any fast PRNG is fine, and a seedable one is a feature.</p>`,
        he: `<p>השיעורים crypto-hashing-practice ו-crypto-encryption-practice חוזרים על "salt אקראי", "nonce ייחודי", "מפתח טרי". השיעור הזה עוסק בשאלה מאיפה ה-bytes האלה מגיעים.</p>
<table><tr><th></th><th>True RNG ‏(TRNG)</th><th>PRNG</th><th>CSPRNG</th></tr>
<tr><td>מקור</td><td>רעש פיזיקלי: רעש תרמי ו-jitter, ‏<code>RDSEED</code>/<code>RDRAND</code> של המעבד, TPM, קיר מנורות הלבה של Cloudflare</td><td>פונקציה דטרמיניסטית של seed</td><td>דטרמיניסטי, עם מפתח מאנטרופיה אמיתית ו-reseed קבוע</td></tr>
<tr><td>ניתן לחזות מהפלט?</td><td>לא</td><td><strong>כן</strong> (אפשר לשחזר את ה-state)</td><td>לא (בלתי אפשרי חישובית)</td></tr>
<tr><td>ניתן לשחזר עם seed?</td><td>לא</td><td>כן</td><td>לא, בכוונה</td></tr>
<tr><td>מהירות</td><td>איטי ומוגבל</td><td>מהיר מאוד (ננו-שניות)</td><td>מהיר (GB/s עם ChaCha20 או AES-CTR)</td></tr>
<tr><td>דוגמאות</td><td>חומרה, <code>/dev/hwrng</code></td><td>Mersenne Twister, ‏LCG, ‏xorshift128+, ‏PCG, ‏ChaCha8 ‏(math/rand/v2 של Go)</td><td><code>getrandom()</code> של Linux, ‏<code>BCryptGenRandom</code> של Windows, ‏<code>arc4random</code> של macOS</td></tr>
<tr><td>משמש ל-</td><td>Seed ל-CSPRNG (מערכת ההפעלה עושה את זה)</td><td>סימולציות, משחקים, jitter, ‏sampling, בדיקות</td><td>טוקנים, מפתחות, nonces, ‏salts, סיסמאות, UUID v4</td></tr></table>
<p>מהנדסים כמעט אף פעם לא נוגעים ב-TRNG ישירות. הכלל בינארי: <strong>האם משנה אם מישהו יחזה את זה?</strong> כן ⇐ CSPRNG. לא ⇐ כל PRNG מהיר בסדר, ו-PRNG שאפשר לתת לו seed הוא אפילו יתרון.</p>`
      }
    },
    {
      h: { en: "How a PRNG works, and why it's predictable", he: "איך PRNG עובד, ולמה הוא צפוי" },
      body: {
        en: `<p>Every PRNG is <code>seed → state → (next state, output)</code>. Same seed, same sequence — forever. The simplest is an LCG:</p>
${LCG_CODE}
<p><strong>Mersenne Twister</strong> (MT19937: Python <code>random</code>, PHP <code>mt_rand</code>, Ruby <code>rand</code>, C++ <code>std::mt19937</code>) has a period of 2<sup>19937</sup>−1 and passes statistical tests beautifully — and is still trivially predictable. Its output is a reversible "tempering" of one 32-bit state word, so 624 consecutive outputs give you the full state. Verified:</p>
${MT_CODE}
<p>Other common generators:</p>
<ul>
<li><strong>Java <code>java.util.Random</code></strong>: 48-bit LCG, outputs the top 32 bits. From two consecutive <code>nextInt()</code> values you brute-force the missing 16 bits (65,536 tries, milliseconds) and know every future value.</li>
<li><strong>V8 <code>Math.random()</code></strong> (Chrome, Node): xorshift128+ since 2015. A handful of outputs plus an SMT solver (z3) recovers the 128-bit state.</li>
<li><strong>Go <code>math/rand/v2</code></strong>: ChaCha8 and PCG. Much better designed, the top-level functions are seeded randomly — still, Go's own docs say use <code>crypto/rand</code> for anything security-sensitive.</li>
</ul>
<blockquote>💡 Real world: "I Forgot Your Password: Randomness Attacks Against PHP Applications" (USENIX Security 2012) took over accounts in real apps by recovering <code>mt_rand()</code> state from tokens the app showed publicly, then predicting the password-reset token generated for the victim. The seed itself was only 32 bits, so tools like <code>php_mt_seed</code> brute-force it in minutes on a CPU.</blockquote>`,
        he: `<p>כל PRNG הוא <code>seed → state → (next state, output)</code>. אותו seed, אותו רצף, לנצח. הכי פשוט הוא LCG:</p>
${LCG_CODE}
<p><strong>Mersenne Twister</strong> ‏(MT19937: ‏<code>random</code> של Python, ‏<code>mt_rand</code> של PHP, ‏<code>rand</code> של Ruby, ‏<code>std::mt19937</code> של C++) הוא בעל מחזור של 2<sup>19937</sup>−1 ועובר מבחנים סטטיסטיים בהצטיינות, ועדיין צפוי בקלות. הפלט שלו הוא "tempering" הפיך של מילת state אחת של 32 bits, אז 624 פלטים רצופים נותנים לך את כל ה-state. נבדק:</p>
${MT_CODE}
<p>עוד generators נפוצים:</p>
<ul>
<li><strong><code>java.util.Random</code> של Java</strong>: ‏LCG של 48 bits שמוציא את 32 ה-bits העליונים. משני ערכי <code>nextInt()</code> רצופים עושים brute-force ל-16 ה-bits החסרים (65,536 ניסיונות, מילישניות) ויודעים כל ערך עתידי.</li>
<li><strong><code>Math.random()</code> של V8</strong> ‏(Chrome, Node): ‏xorshift128+ מאז 2015. קומץ פלטים יחד עם SMT solver ‏(z3) משחזרים את ה-state של 128 bits.</li>
<li><strong><code>math/rand/v2</code> של Go</strong>: ‏ChaCha8 ו-PCG. מתוכנן הרבה יותר טוב, והפונקציות ברמה העליונה מקבלות seed אקראי. ובכל זאת, התיעוד של Go עצמו אומר להשתמש ב-<code>crypto/rand</code> לכל דבר רגיש אבטחתית.</li>
</ul>
<blockquote>💡 מהשטח: המחקר "I Forgot Your Password: Randomness Attacks Against PHP Applications" ‏(USENIX Security 2012) השתלט על חשבונות באפליקציות אמיתיות: שחזרו את ה-state של <code>mt_rand()</code> מטוקנים שהאפליקציה הציגה בפומבי, ואז חזו את טוקן איפוס הסיסמה שנוצר לקורבן. ה-seed עצמו היה רק 32 bits, אז כלים כמו <code>php_mt_seed</code> עושים לו brute-force בדקות על CPU.</blockquote>`
      }
    },
    {
      h: { en: "The OS CSPRNG: /dev/urandom, getrandom() and the blocking myth", he: "ה-CSPRNG של מערכת ההפעלה: /dev/urandom, getrandom() ומיתוס החסימה" },
      body: {
        en: `<p>Linux collects entropy from interrupt timing, disk and network events, CPU jitter and <code>RDRAND</code>/<code>RDSEED</code>, mixes it (BLAKE2s since 5.17), and uses it to key a ChaCha20-based generator (since 4.8). Userspace reads it through <code>getrandom(2)</code> (Linux 3.17+), <code>/dev/urandom</code> or <code>/dev/random</code>.</p>
${LINUX_RNG}
<p><strong>The blocking myth.</strong> For years, <code>/dev/random</code> "used up" an entropy estimate and blocked, and folklore said it was "more random". Wrong: once the CSPRNG is seeded with ~256 bits, its output doesn't run out. Linux 5.6 (2020) stopped <code>/dev/random</code> blocking after initialization, and 5.18 made both devices identical. The only real danger window is <strong>early boot before "crng init done"</strong>: <code>getrandom()</code> correctly blocks there, while old <code>/dev/urandom</code> reads returned weak bytes.</p>
<table><tr><th>Situation</th><th>Risk</th><th>What to do</th></tr>
<tr><td>Fresh VM / cloud instance at boot</td><td>Few entropy events; services generating SSH host keys or TLS keys in the first seconds</td><td>virtio-rng device (default on most clouds), CPU <code>RDRAND</code>, use <code>getrandom()</code></td></tr>
<tr><td>VM snapshot restored or cloned</td><td>Two VMs continue from the same RNG state ⇒ same "random" output</td><td>Hypervisor <strong>VM Generation ID</strong>; Linux 5.18+ reseeds on it. Userspace PRNGs inside apps must reseed too</td></tr>
<tr><td>Containers</td><td>None special: they share the host kernel's CSPRNG</td><td>Don't mount fake <code>/dev/random</code>; avoid baking seeds into images</td></tr>
<tr><td><code>fork()</code> with a userspace PRNG</td><td>Parent and child share state ⇒ identical sequences</td><td>Reseed after fork, or read from the kernel each time</td></tr></table>
<blockquote>💡 Real world: the classic fork bug — PyTorch <code>DataLoader</code> workers inherited the same NumPy random state, so every worker applied the <em>same</em> "random" augmentations for years in countless projects until it was widely publicized in 2021. Same class of bug as old OpenSSL child processes producing identical bytes.</blockquote>`,
        he: `<p>Linux אוסף אנטרופיה מתזמון של interrupts, אירועי דיסק ורשת, jitter של המעבד ו-<code>RDRAND</code>/<code>RDSEED</code>, מערבב אותה (BLAKE2s מאז 5.17), ומשתמש בה כמפתח ל-generator מבוסס ChaCha20 (מאז 4.8). ב-userspace קוראים ממנו דרך <code>getrandom(2)</code> ‏(Linux 3.17 ומעלה), ‏<code>/dev/urandom</code> או <code>/dev/random</code>.</p>
${LINUX_RNG}
<p><strong>מיתוס החסימה.</strong> במשך שנים <code>/dev/random</code> "צרך" הערכת אנטרופיה ונחסם, והפולקלור אמר שהוא "יותר אקראי". לא נכון: ברגע שה-CSPRNG קיבל seed של ~256 bits, הפלט שלו לא נגמר. ב-Linux 5.6 ‏(2020) ‏<code>/dev/random</code> הפסיק להיחסם אחרי האתחול, וב-5.18 שני ההתקנים נהיו זהים. חלון הסכנה האמיתי היחיד הוא <strong>תחילת ה-boot, לפני "crng init done"</strong>: שם <code>getrandom()</code> נחסם בצדק, בזמן שקריאות ישנות מ-<code>/dev/urandom</code> החזירו bytes חלשים.</p>
<table><tr><th>מצב</th><th>סיכון</th><th>מה עושים</th></tr>
<tr><td>VM או instance חדש בענן בזמן boot</td><td>מעט אירועי אנטרופיה, ושירותים שמייצרים SSH host keys או מפתחות TLS בשניות הראשונות</td><td>התקן virtio-rng (ברירת מחדל ברוב העננים), <code>RDRAND</code> של המעבד, ולהשתמש ב-<code>getrandom()</code></td></tr>
<tr><td>Snapshot של VM ששוחזר או שוכפל</td><td>שתי מכונות ממשיכות מאותו state של RNG ⇐ אותו פלט "אקראי"</td><td><strong>VM Generation ID</strong> של ה-hypervisor. ‏Linux 5.18 ומעלה עושה עליו reseed. גם PRNG-ים של userspace בתוך אפליקציות צריכים reseed</td></tr>
<tr><td>קונטיינרים</td><td>שום דבר מיוחד: הם חולקים את ה-CSPRNG של ה-kernel של ה-host</td><td>לא לעשות mount ל-<code>/dev/random</code> מזויף, ולא לאפות seeds לתוך images</td></tr>
<tr><td><code>fork()</code> עם PRNG של userspace</td><td>האב והבן חולקים state ⇐ רצפים זהים</td><td>Reseed אחרי fork, או לקרוא מה-kernel בכל פעם</td></tr></table>
<blockquote>💡 מהשטח: באג ה-fork הקלאסי: ה-workers של <code>DataLoader</code> ב-PyTorch ירשו את אותו random state של NumPy, אז כל worker הפעיל את <em>אותן</em> augmentations "אקראיות" במשך שנים באינספור פרויקטים, עד שזה התפרסם בהרחבה ב-2021. אותה משפחה של באגים כמו תהליכי בן ב-OpenSSL הישן שהוציאו bytes זהים.</blockquote>`
      }
    },
    {
      h: { en: "The right API per language, and failures that made history", he: "ה-API הנכון בכל שפה, וכשלים שנכנסו להיסטוריה" },
      body: {
        en: `${LANG_CODE}
<p>How big? 128 bits (16 bytes) is the floor for anything guessable online; 256 bits (32 bytes) is the usual choice for API keys and reset tokens. A 6-digit OTP has only 10<sup>6</sup> values, so it is safe <em>only</em> with a short expiry and a strict attempt limit (e.g. 5 tries, then invalidate).</p>
<table><tr><th>Incident</th><th>What went wrong</th><th>Lesson</th></tr>
<tr><td>Debian OpenSSL, CVE-2008-0166</td><td>A 2006 patch to silence a Valgrind warning removed the entropy mixing; the only seed left was the process ID (max 32,768). Every SSH/TLS key made on Debian/Ubuntu for ~2 years came from a set of ~32k per key type and size</td><td>Never "fix" crypto code you don't understand; mass key regeneration and blocklists followed</td></tr>
<tr><td>Predictable reset tokens (PHP research, 2012; many bug bounties since)</td><td>Tokens from <code>mt_rand()</code>, <code>Math.random()</code>, <code>random.randint()</code> or <code>md5(time())</code></td><td>Tokens from the CSPRNG, stored hashed, short TTL, single use</td></tr>
<tr><td>Android SecureRandom, 2013</td><td>The Java Cryptography Architecture's PRNG was not seeded properly; Bitcoin wallet apps reused ECDSA nonces and coins were stolen</td><td>A signature nonce must be unique and secret — or use deterministic signatures (RFC 6979, Ed25519)</td></tr>
<tr><td>Weak keys on the internet (2012 "Mining your Ps and Qs")</td><td>Routers and embedded devices generated RSA keys at first boot with almost no entropy; researchers factored ~0.5% of TLS hosts' keys via shared primes</td><td>Boot-time entropy is real; <code>getrandom()</code> blocks for a reason</td></tr></table>`,
        he: `${LANG_CODE}
<p>כמה גדול? 128 bits ‏(16 bytes) זה המינימום לכל דבר שאפשר לנחש אונליין, ו-256 bits ‏(32 bytes) זו הבחירה הרגילה ל-API keys ולטוקנים של איפוס. ל-OTP של 6 ספרות יש רק 10<sup>6</sup> ערכים, אז הוא בטוח <em>רק</em> עם תוקף קצר והגבלת ניסיונות קשוחה (למשל 5 ניסיונות ואז ביטול).</p>
<table><tr><th>אירוע</th><th>מה השתבש</th><th>הלקח</th></tr>
<tr><td>OpenSSL של Debian, ‏CVE-2008-0166</td><td>Patch מ-2006 שנועד להשתיק אזהרה של Valgrind הוריד את ערבוב האנטרופיה. ה-seed היחיד שנשאר היה ה-process ID (מקסימום 32,768). כל מפתח SSH או TLS שנוצר ב-Debian/Ubuntu במשך ~שנתיים הגיע מסט של ~32 אלף לכל סוג וגודל מפתח</td><td>לא "מתקנים" קוד קריפטו שלא מבינים. אחרי זה באו החלפת מפתחות המונית ו-blocklists</td></tr>
<tr><td>טוקני איפוס צפויים (מחקר PHP מ-2012, ואינספור bug bounties מאז)</td><td>טוקנים מ-<code>mt_rand()</code>, ‏<code>Math.random()</code>, ‏<code>random.randint()</code> או <code>md5(time())</code></td><td>טוקנים מה-CSPRNG, שמורים כ-hash, עם TTL קצר ושימוש חד-פעמי</td></tr>
<tr><td>SecureRandom באנדרואיד, 2013</td><td>ה-PRNG של Java Cryptography Architecture לא קיבל seed כמו שצריך. אפליקציות ארנק Bitcoin חזרו על nonces של ECDSA ומטבעות נגנבו</td><td>Nonce של חתימה חייב להיות ייחודי וסודי, או להשתמש בחתימות דטרמיניסטיות (RFC 6979, ‏Ed25519)</td></tr>
<tr><td>מפתחות חלשים באינטרנט (המחקר "Mining your Ps and Qs" מ-2012)</td><td>נתבים והתקנים משובצים ייצרו מפתחות RSA ב-boot הראשון כמעט בלי אנטרופיה. החוקרים פירקו את המפתחות של ~0.5% משרתי ה-TLS דרך ראשוניים משותפים</td><td>אנטרופיה בזמן boot היא בעיה אמיתית. <code>getrandom()</code> נחסם מסיבה טובה</td></tr></table>`
      }
    },
    {
      h: { en: "Randomness as an infrastructure tool", he: "אקראיות ככלי תשתיתי" },
      body: {
        en: `<p>Most randomness in infra is <em>not</em> security — it's breaking synchronization and spreading load. A fast PRNG is the right choice here.</p>
${JITTER_CODE}
<ul>
<li><strong>Jitter on retries, timers and cron.</strong> 10,000 clients that all retry at exactly 1s, 2s, 4s hit the recovering service in synchronized waves (retry-storm-metastable). Full jitter spreads them uniformly. Same for cache TTLs (<code>ttl = 300 + rand(0, 60)</code>) so keys don't expire together, and for fleet-wide cron (<code>RandomizedDelaySec=</code> in systemd timers).</li>
<li><strong>Power of two random choices.</strong> Picking one backend at random gives a surprisingly uneven max load; picking two and taking the less loaded one is exponentially better, without global state. Envoy's <code>LEAST_REQUEST</code> policy (P2C by default) and NGINX's <code>random two least_conn</code> use it.</li>
</ul>
${P2C_SIM}
<ul>
<li><strong>Sampling.</strong> At 50,000 req/s, keeping 1% of traces = 500 traces/s. Decide by <em>hashing the trace id</em> (OpenTelemetry <code>TraceIdRatioBased</code>), not by an independent coin flip per service, so all services keep or drop the same trace. Logs: sample the noisy INFO lines, never errors.</li>
<li><strong>Shuffle sharding.</strong> Give each tenant a random subset of workers: with 8 workers and 2 per tenant there are C(8,2) = 28 combinations; with 100 workers and 5 per tenant, 75,287,520. A poison tenant takes down only its own shard, and the chance another tenant shares all 5 is tiny (AWS Route 53 and many AWS services use this).</li>
<li><strong>Chaos engineering</strong> (rel-chaos-engineering): kill a random pod, add latency to a random 5% of requests — random selection finds the dependencies nobody wrote down.</li>
</ul>`,
        he: `<p>רוב האקראיות בתשתיות היא <em>לא</em> אבטחה. היא נועדה לשבור סנכרון ולפזר עומס, ופה PRNG מהיר הוא הבחירה הנכונה.</p>
${JITTER_CODE}
<ul>
<li><strong>Jitter ל-retries, ל-timers ול-cron.</strong> 10,000 לקוחות שכולם עושים retry בדיוק אחרי 1s, ‏2s, ‏4s פוגעים בשירות שמתאושש בגלים מסונכרנים (retry-storm-metastable). Full jitter מפזר אותם באופן אחיד. אותו דבר ל-TTL של cache ‏(<code>ttl = 300 + rand(0, 60)</code>) כדי שמפתחות לא יפוגו יחד, ול-cron על כל ה-fleet ‏(<code>RandomizedDelaySec=</code> ב-timers של systemd).</li>
<li><strong>Power of two random choices.</strong> בחירה של backend אחד אקראי נותנת עומס מקסימלי לא אחיד באופן מפתיע. בחירה של שניים ושליחה לפחות עמוס טובה יותר באופן אקספוננציאלי, בלי state גלובלי. ה-policy <code>LEAST_REQUEST</code> של Envoy (שעובד ב-P2C כברירת מחדל) וה-<code>random two least_conn</code> של NGINX משתמשים בזה.</li>
</ul>
${P2C_SIM}
<ul>
<li><strong>Sampling.</strong> ב-50,000 בקשות לשנייה, שמירה של 1% מה-traces = ‏500 traces לשנייה. מחליטים לפי <em>hash של ה-trace id</em> ‏(<code>TraceIdRatioBased</code> של OpenTelemetry), לא לפי הטלת מטבע נפרדת בכל שירות, כדי שכל השירותים ישמרו או יזרקו את אותו trace. בלוגים: עושים sampling לשורות INFO הרועשות, אף פעם לא לשגיאות.</li>
<li><strong>Shuffle sharding.</strong> כל tenant מקבל תת-קבוצה אקראית של workers: עם 8 workers ו-2 לכל tenant יש C(8,2) = 28 צירופים, ועם 100 workers ו-5 לכל tenant יש 75,287,520. Tenant רעיל מפיל רק את ה-shard שלו, והסיכוי שעוד tenant חולק איתו את כל ה-5 זעיר (Route 53 ועוד הרבה שירותים של AWS משתמשים בזה).</li>
<li><strong>Chaos engineering</strong> ‏(rel-chaos-engineering): להרוג pod אקראי, להוסיף latency ל-5% אקראיים מהבקשות. בחירה אקראית מוצאת את התלויות שאף אחד לא כתב.</li>
</ul>`
      }
    },
    {
      h: { en: "Shuffling, modulo bias, seeds and distributions", he: "ערבוב, modulo bias, ‏seeds והתפלגויות" },
      body: {
        en: `<p>Two classic bugs turn a perfect random source into a biased result:</p>
${SHUFFLE_CODE}
<p>Modulo bias matters most when the range is close to the source size (e.g. <code>rand16() % 50000</code> makes the low 15,536 values twice as likely as the rest) and when the output is security-relevant (OTP codes, password characters). <code>secrets.randbelow</code>, <code>crypto.randomInt</code>, Java <code>nextInt(bound)</code> and Go <code>rand.IntN</code> all do rejection sampling for you — prefer them over <code>% n</code>.</p>
<p><strong>Reproducible randomness</strong> is a feature in tests, simulations and load generators: a failing property-based test or chaos run is only debuggable if you can replay it.</p>
${SEED_CODE}
<table><tr><th>Distribution</th><th>Shape</th><th>Infra use</th></tr>
<tr><td>Uniform</td><td>Every value in [a, b] equally likely</td><td>Jitter, sampling, picking a backend</td></tr>
<tr><td>Normal (Gaussian)</td><td>Bell curve around a mean</td><td>Measurement noise; a poor model for latency (real latency is right-skewed with a long tail — use p99, not mean ± σ)</td></tr>
<tr><td>Exponential</td><td>Many short gaps, few long ones</td><td>Time between independent arrivals (Poisson process): realistic load tests, queueing models</td></tr></table>
<blockquote>⚠️ Production tip: load-test tools that send requests at fixed intervals ("closed model", one every 10 ms) hide queueing. Real traffic at 100 req/s has exponential gaps: about 5% of gaps are longer than 30 ms and many are under 1 ms, so bursts happen. Use an open, Poisson-arrival model (k6 <code>constant-arrival-rate</code>, wrk2, Gatling's open injection) to see real tail latency.</blockquote>`,
        he: `<p>שני באגים קלאסיים הופכים מקור אקראי מושלם לתוצאה מוטה:</p>
${SHUFFLE_CODE}
<p>Modulo bias משמעותי בעיקר כשהטווח קרוב לגודל המקור (למשל <code>rand16() % 50000</code> הופך את 15,536 הערכים הנמוכים לסבירים פי 2 משאר הערכים), וכשהפלט רגיש אבטחתית (קודי OTP, תווים של סיסמה). ‏<code>secrets.randbelow</code>, ‏<code>crypto.randomInt</code>, ‏<code>nextInt(bound)</code> של Java ו-<code>rand.IntN</code> של Go עושים rejection sampling בשבילך. תעדיף אותם על <code>% n</code>.</p>
<p><strong>אקראיות שאפשר לשחזר</strong> היא יתרון בבדיקות, בסימולציות וב-load generators: בדיקת property-based או ריצת chaos שנכשלה ניתנות לדיבאג רק אם אפשר להריץ אותן שוב בדיוק.</p>
${SEED_CODE}
<table><tr><th>התפלגות</th><th>צורה</th><th>שימוש בתשתיות</th></tr>
<tr><td>אחידה (Uniform)</td><td>כל ערך ב-[a, b] סביר באותה מידה</td><td>Jitter, ‏sampling, בחירת backend</td></tr>
<tr><td>נורמלית (Gaussian)</td><td>פעמון סביב ממוצע</td><td>רעש מדידה. מודל גרוע ל-latency (latency אמיתי מוטה ימינה עם זנב ארוך, אז מסתכלים על p99 ולא על ממוצע ± σ)</td></tr>
<tr><td>מעריכית (Exponential)</td><td>הרבה מרווחים קצרים, מעט ארוכים</td><td>הזמן בין הגעות בלתי תלויות (תהליך Poisson): load tests מציאותיים ומודלים של תורים</td></tr></table>
<blockquote>⚠️ טיפ לפרודקשן: כלי load test ששולחים בקשות במרווחים קבועים ("closed model", אחת כל 10 ms) מסתירים תורים. תעבורה אמיתית של 100 בקשות לשנייה מגיעה במרווחים מעריכיים: בערך 5% מהמרווחים ארוכים מ-30 ms והרבה קצרים מ-1 ms, אז נוצרים bursts. תשתמש במודל פתוח עם הגעות Poisson ‏(<code>constant-arrival-rate</code> של k6, ‏wrk2, ה-open injection של Gatling) כדי לראות את ה-tail latency האמיתי.</blockquote>`
      }
    }
  ],
  diagram: "physical noise (IRQ timing, RDSEED, virtio-rng) --> kernel entropy pool (BLAKE2s)\n        --> ChaCha20 CRNG --> getrandom() / /dev/urandom --> secrets, crypto.randomBytes, SecureRandom, crypto/rand\n\nseed --> PRNG state --> output, output, output ...   (624 MT outputs = full state = every future output)",
  handsOn: [
    { cmd: "python3 -c \"import secrets; print(secrets.token_urlsafe(32), secrets.randbelow(10**6))\"", what: { en: "A 256-bit URL-safe token (43 chars) and an unbiased 6-digit code from the OS CSPRNG.", he: "טוקן URL-safe של 256 bits ‏(43 תווים) וקוד של 6 ספרות בלי הטיה, מה-CSPRNG של מערכת ההפעלה." } },
    { cmd: "python3 -c \"import random; random.seed(7); print([random.randint(1,100) for _ in range(5)])\"", what: { en: "Run it twice: identical output. A seeded PRNG is perfectly reproducible — great for tests, fatal for tokens.", he: "תריץ פעמיים: פלט זהה. PRNG עם seed משתחזר בדיוק, מצוין לבדיקות וקטלני לטוקנים." } },
    { cmd: "dmesg | grep -i 'crng init'; cat /proc/sys/kernel/random/entropy_avail", what: { en: "See when the kernel CSPRNG finished seeding at boot, and the (constant 256 on 5.18+) entropy counter.", he: "תראה מתי ה-CSPRNG של ה-kernel סיים לקבל seed ב-boot, ואת מונה האנטרופיה (קבוע על 256 ב-5.18 ומעלה)." } },
    { cmd: "grep -rnE 'Math\\.random|random\\.(randint|random|choice)|new Random\\(|math/rand' --include='*.{js,ts,py,java,go}' src/ | grep -iE 'token|secret|password|reset|otp|key'", what: { en: "Audit a codebase for non-crypto randomness near security words (Bandit B311 and Semgrep rules do this in CI).", he: "סריקה של codebase לאקראיות לא קריפטוגרפית ליד מילים רגישות (הכללים B311 של Bandit ו-Semgrep עושים את זה ב-CI)." } }
  ],
  mnemonic: {
    en: "\"If guessing it hurts, ask the kernel. If replaying it helps, seed it.\"",
    he: "\"אם ניחוש יכאב, תבקש מה-kernel. אם שחזור יעזור, תן seed.\""
  },
  pitfalls: [
    { en: "Generating tokens, reset codes, invite links or API keys with Math.random / random.randint / java.util.Random. They pass every 'looks random' test and are predictable from a few outputs. Use secrets / crypto.randomBytes / SecureRandom / crypto/rand.", he: "לייצר טוקנים, קודי איפוס, לינקי הזמנה או API keys עם Math.random, ‏random.randint או java.util.Random. הם עוברים כל בדיקת 'נראה אקראי' וצפויים מתוך כמה פלטים. תשתמש ב-secrets, ‏crypto.randomBytes, ‏SecureRandom או crypto/rand." },
    { en: "Using rand() % n for security-relevant ranges (modulo bias) or a home-made shuffle (swap with any index). Use randbelow/randomInt and Fisher-Yates.", he: "להשתמש ב-rand() % n לטווחים רגישים אבטחתית (modulo bias) או בערבוב שכתבת לבד (החלפה עם כל אינדקס). תשתמש ב-randbelow או randomInt וב-Fisher-Yates." },
    { en: "Seeding a PRNG with time (seed(time.time())) or the PID: an attacker who knows roughly when it started brute-forces the seed in seconds.", he: "לתת ל-PRNG seed מהזמן (seed(time.time())) או מה-PID: תוקף שיודע בערך מתי הוא התחיל עושה brute-force ל-seed בשניות." },
    { en: "Forked workers or cloned VMs sharing one userspace RNG state, so 'random' IDs or nonces repeat. Reseed after fork, rely on the kernel CSPRNG, and use hypervisors that support VM Generation ID.", he: "Workers אחרי fork או VMs משוכפלים שחולקים state אחד של RNG ב-userspace, כך שמזהים או nonces 'אקראיים' חוזרים. Reseed אחרי fork, להסתמך על ה-CSPRNG של ה-kernel, ולהשתמש ב-hypervisors שתומכים ב-VM Generation ID." }
  ],
  interview: [
    {
      q: { en: "Is /dev/urandom safe for generating cryptographic keys, or do you need /dev/random?", he: "האם /dev/urandom בטוח לייצור מפתחות קריפטוגרפיים, או שצריך /dev/random?" },
      a: { en: "/dev/urandom (better: getrandom()) is the right source. Both feed from the same ChaCha20-based CSPRNG; once it's seeded with ~256 bits its output doesn't 'run out'. Since Linux 5.6 /dev/random no longer blocks after init, and since 5.18 they're identical. The one real risk is very early boot before 'crng init done' — getrandom() blocks until then, which is exactly what you want for SSH host keys on a fresh VM.", he: "‏/dev/urandom (ועדיף getrandom()) הוא המקור הנכון. שניהם ניזונים מאותו CSPRNG מבוסס ChaCha20, וברגע שקיבל seed של ~256 bits הפלט שלו לא 'נגמר'. מאז Linux 5.6 ‏/dev/random כבר לא נחסם אחרי האתחול, ומאז 5.18 הם זהים. הסיכון האמיתי היחיד הוא תחילת ה-boot לפני 'crng init done'. ‏getrandom() נחסם עד אז, וזה בדיוק מה שאתה רוצה בשביל SSH host keys על VM חדש." }
    },
    {
      q: { en: "Why add jitter to retries, and why is a non-crypto RNG fine there?", he: "למה מוסיפים jitter ל-retries, ולמה RNG לא קריפטוגרפי בסדר שם?" },
      a: { en: "Without jitter, clients that failed together retry together: exponential backoff only spaces the waves out, each wave still hits the recovering service at once and can keep it in a metastable failure. Full jitter (sleep = uniform(0, min(cap, base·2^n))) spreads the retries evenly across the window. Nobody gains anything by predicting your retry timing, so a fast PRNG is the right tool; what matters is that each client's generator is seeded differently (don't seed every pod with the same constant).", he: "בלי jitter, לקוחות שנכשלו יחד עושים retry יחד: exponential backoff רק מרווח בין הגלים, וכל גל עדיין פוגע בשירות שמתאושש בבת אחת ויכול להשאיר אותו בכשל metastable. ‏Full jitter ‏(sleep = uniform(0, min(cap, base·2^n))) מפזר את ה-retries באופן אחיד על פני החלון. אף אחד לא מרוויח כלום מלחזות את תזמון ה-retry שלך, אז PRNG מהיר הוא הכלי הנכון. מה שחשוב הוא שה-generator של כל לקוח יקבל seed שונה (לא לתת לכל pod אותו קבוע)." }
    },
    {
      q: { en: "Your test suite has a flaky property-based test that uses random inputs. How do you make failures debuggable without losing randomness?", he: "בחבילת הבדיקות יש בדיקת property-based לא יציבה שמשתמשת בקלטים אקראיים. איך הופכים כשלונות לניתנים לדיבאג בלי לוותר על אקראיות?" },
      a: { en: "Pick a fresh seed per run (from the OS), print it, and drive a private PRNG instance from it; allow overriding it via an env var. A failure in CI then comes with 'TEST_SEED=…', which replays the exact inputs locally. Hypothesis, QuickCheck and Go's testing/quick-style tools do this and also shrink the failing input.", he: "בוחרים seed חדש בכל ריצה (ממערכת ההפעלה), מדפיסים אותו, ומפעילים ממנו instance פרטי של PRNG, עם אפשרות לדרוס אותו דרך env var. כשל ב-CI מגיע אז עם 'TEST_SEED=…' שמשחזר מקומית את אותם קלטים בדיוק. ‏Hypothesis, ‏QuickCheck וכלים בסגנון testing/quick של Go עושים את זה וגם מקטינים את הקלט שנכשל." }
    }
  ],
  quiz: [
    {
      q: { en: "Which of these is appropriate for generating password-reset tokens?", he: "מה מתאים לייצור טוקנים לאיפוס סיסמה?" },
      options: [
        { en: "Python random.getrandbits(256) seeded from os.urandom", he: "random.getrandbits(256) של Python עם seed מ-os.urandom" },
        { en: "md5(user_id + time.time())", he: "md5(user_id + time.time())" },
        { en: "Node crypto.randomBytes(32).toString('base64url')", he: "crypto.randomBytes(32).toString('base64url') של Node" },
        { en: "Java new Random().nextLong()", he: "new Random().nextLong() של Java" }
      ],
      answer: 2,
      explain: { en: "Only crypto.randomBytes reads the OS CSPRNG. Seeding Mersenne Twister well doesn't help — 624 outputs reveal its state. md5 of guessable inputs is guessable, and java.util.Random is a 48-bit LCG.", he: "רק crypto.randomBytes קורא מה-CSPRNG של מערכת ההפעלה. seed טוב ל-Mersenne Twister לא עוזר, כי 624 פלטים חושפים את ה-state שלו. ‏md5 של קלטים שאפשר לנחש אפשר לנחש, ו-java.util.Random הוא LCG של 48 bits." }
    },
    {
      q: { en: "You take one random byte (0-255) and compute b % 10 for a digit. What's wrong?", he: "לוקחים byte אקראי אחד (0-255) ומחשבים b % 10 כדי לקבל ספרה. מה הבעיה?" },
      options: [
        { en: "Nothing, it's perfectly uniform", he: "אין בעיה, זה אחיד לגמרי" },
        { en: "Digits 0-5 come up 26/256 of the time and 6-9 only 25/256", he: "הספרות 0-5 יוצאות ב-26/256 מהמקרים, ו-6-9 רק ב-25/256" },
        { en: "Digit 0 can never appear", he: "הספרה 0 לא יכולה לצאת אף פעם" },
        { en: "Only even digits appear", he: "יוצאות רק ספרות זוגיות" }
      ],
      answer: 1,
      explain: { en: "256 = 25·10 + 6, so the first 6 residues get one extra source value: modulo bias. Fix with rejection sampling (discard b ≥ 250) or use secrets.randbelow / crypto.randomInt.", he: "256 = 25·10 + 6, אז 6 השאריות הראשונות מקבלות ערך מקור אחד נוסף: modulo bias. מתקנים עם rejection sampling (לזרוק b ≥ 250), או משתמשים ב-secrets.randbelow או crypto.randomInt." }
    },
    {
      q: { en: "Since Linux 5.6/5.18, what's true about /dev/random vs /dev/urandom?", he: "מאז Linux 5.6 ו-5.18, מה נכון לגבי /dev/random מול /dev/urandom?" },
      options: [
        { en: "/dev/random is truly random hardware noise; /dev/urandom is a weak PRNG", he: "‏/dev/random הוא רעש חומרה אקראי באמת, ו-/dev/urandom הוא PRNG חלש" },
        { en: "/dev/urandom blocks when entropy runs low", he: "‏/dev/urandom נחסם כשהאנטרופיה נגמרת" },
        { en: "Both come from the same CSPRNG and don't block once it's initialized at boot", he: "שניהם מגיעים מאותו CSPRNG ולא נחסמים אחרי שהוא אותחל ב-boot" },
        { en: "Containers get a separate entropy pool per container", he: "כל קונטיינר מקבל מאגר אנטרופיה נפרד" }
      ],
      answer: 2,
      explain: { en: "5.6 stopped /dev/random blocking after init and 5.18 made them identical (ChaCha20 CRNG keyed from a BLAKE2s-mixed pool). Containers share the host kernel's generator.", he: "‏5.6 הפסיק את החסימה של /dev/random אחרי האתחול, ו-5.18 הפך אותם לזהים (CRNG של ChaCha20 עם מפתח ממאגר שמעורבב ב-BLAKE2s). קונטיינרים חולקים את ה-generator של ה-kernel של ה-host." }
    },
    {
      q: { en: "Why does 'power of two random choices' beat picking one random backend?", he: "למה 'power of two random choices' עדיף על בחירה של backend אקראי אחד?" },
      options: [
        { en: "It sends each request to two backends and uses the faster reply", he: "הוא שולח כל בקשה לשני backends ומשתמש בתשובה המהירה" },
        { en: "Comparing two random candidates and choosing the less loaded one drops the max load from ~ln n/ln ln n to ~ln ln n — exponentially better, no global state", he: "השוואה בין שני מועמדים אקראיים ובחירת הפחות עמוס מורידה את העומס המקסימלי מ-~ln n/ln ln n ל-~ln ln n, טוב יותר באופן אקספוננציאלי ובלי state גלובלי" },
        { en: "It uses a CSPRNG so attackers can't target a backend", he: "הוא משתמש ב-CSPRNG כדי שתוקפים לא יוכלו לכוון ל-backend מסוים" },
        { en: "It's the same as round robin", he: "זה אותו דבר כמו round robin" }
      ],
      answer: 1,
      explain: { en: "In our simulation of 1M requests over 1M servers: busiest server 8 with one random choice, 4 with two choices. It avoids the herd effect of 'always pick the global least-loaded' when load info is stale.", he: "בסימולציה שלנו של מיליון בקשות על מיליון שרתים: השרת העמוס ביותר קיבל 8 בבחירה אקראית אחת, ו-4 בשתי בחירות. זה גם נמנע מאפקט העדר של 'תמיד לבחור את הפחות עמוס גלובלית' כשמידע העומס לא עדכני." }
    }
  ],
  related: ["crypto-hashing-practice", "crypto-encryption-practice", "pr-applied-crypto-pki", "uuid-guid-deep", "arch-resilience", "net-load-balancing", "obs-traces", "rel-chaos-engineering", "pr-auth"]
});

// ======================= Glossary =======================
INFRA.glossary.push(
  { term: "UUID v4", track: "foundations", def: { en: "A UUID with 122 random bits (plus 4 version and 2 variant bits); unordered, so it fragments B-tree indexes when used as a primary key. 50% collision chance only after ~2.7 × 10^18 IDs.", he: "UUID עם 122 bits אקראיים (ועוד 4 bits של version ו-2 של variant). לא ממוין, ולכן מפצל אינדקסים של B-tree כשמשתמשים בו כ-primary key. סיכוי של 50% להתנגשות רק אחרי ~2.7 × 10^18 מזהים." }, lesson: "uuid-guid-deep" },
  { term: "GUID", track: "foundations", def: { en: "Microsoft's name for a UUID. Same text format, but .NET's binary form stores the first three groups little-endian, and SQL Server sorts uniqueidentifier by the last 6 bytes first.", he: "השם של Microsoft ל-UUID. אותו פורמט טקסט, אבל הייצוג הבינארי של .NET שומר את שלוש הקבוצות הראשונות ב-little-endian, ו-SQL Server ממיין uniqueidentifier קודם לפי 6 ה-bytes האחרונים." }, lesson: "uuid-guid-deep" },
  { term: "ULID", track: "foundations", def: { en: "Universally Unique Lexicographically Sortable Identifier: 48-bit ms timestamp + 80 random bits, written as 26 Crockford Base32 chars. Same idea as UUID v7, not an RFC.", he: "Universally Unique Lexicographically Sortable Identifier: ‏timestamp של 48 bits במילישניות + 80 bits אקראיים, נכתב כ-26 תווי Crockford Base32. אותו רעיון כמו UUID v7, אבל לא RFC." }, lesson: "uuid-guid-deep" },
  { term: "CSPRNG", track: "foundations", def: { en: "Cryptographically Secure Pseudo-Random Number Generator: output can't be predicted even after seeing previous outputs. Use it (getrandom, secrets, crypto.randomBytes, SecureRandom, crypto/rand) for tokens, keys and nonces.", he: "Cryptographically Secure Pseudo-Random Number Generator: אי אפשר לחזות את הפלט גם אחרי שראית פלטים קודמים. משתמשים בו (getrandom, ‏secrets, ‏crypto.randomBytes, ‏SecureRandom, ‏crypto/rand) לטוקנים, מפתחות ו-nonces." }, lesson: "random-numbers" },
  { term: "Modulo bias", track: "foundations", def: { en: "The skew from mapping random numbers into a range with % n when the source range isn't a multiple of n (byte % 10 favors 0-5). Fixed by rejection sampling.", he: "ההטיה שנוצרת כשממפים מספרים אקראיים לטווח עם % n וטווח המקור לא מתחלק ב-n ‏(byte % 10 מעדיף את 0-5). מתקנים עם rejection sampling." }, lesson: "random-numbers" },
  { term: "Power of two choices", track: "foundations", def: { en: "Load-balancing trick: pick two random backends and send to the less loaded one. Max load drops exponentially compared with one random pick, with no global state (Envoy LEAST_REQUEST, NGINX random two).", he: "טריק של load balancing: בוחרים שני backends אקראיים ושולחים לפחות עמוס. העומס המקסימלי יורד באופן אקספוננציאלי לעומת בחירה אקראית אחת, בלי state גלובלי (LEAST_REQUEST של Envoy, ‏random two של NGINX)." }, lesson: "random-numbers" }
);

// ======================= Scenario =======================
INFRA.scenarios.push({
  id: "predictable-reset-tokens",
  icon: "🔑",
  title: { en: "Account takeovers through 'random' password-reset tokens", he: "השתלטות על חשבונות דרך טוקנים 'אקראיים' לאיפוס סיסמה" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Tuesday 09:40. Support escalates: 14 customers, including two enterprise admins, say their passwords were changed overnight and they never asked for a reset. The security dashboard shows reset completions spiking from a handful of IPs. Nobody clicked the reset emails — the access logs show the reset links used before the emails were even opened.",
        he: "יום שלישי 09:40. התמיכה מסלימה: 14 לקוחות, כולל שני אדמינים של לקוחות enterprise, אומרים שהסיסמה שלהם שונתה בלילה ושהם לא ביקשו איפוס. ב-dashboard של האבטחה רואים קפיצה בהשלמות איפוס מקומץ כתובות IP. אף אחד לא לחץ על המיילים: לפי ה-access logs, לינקי האיפוס נוצלו עוד לפני שהמיילים בכלל נפתחו."
      },
      data: `$ grep 'POST /password/reset/confirm' access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -3
   212 185.220.101.47
   198 185.220.101.52
    31 203.0.113.18

02:13:07 POST /password/forgot         user=ops-admin@bigcorp.example  ip=185.220.101.47
02:13:07 POST /password/forgot         user=attacker1@mailinator.example ip=185.220.101.47
02:13:09 POST /password/reset/confirm  token=482913  user=ops-admin@bigcorp.example  200 OK
-- email_opened events for ops-admin: none`,
      choices: [
        { label: { en: "Disable self-service reset behind the feature flag now, invalidate all outstanding reset tokens, then investigate", he: "לכבות עכשיו את האיפוס העצמי דרך ה-feature flag, לבטל את כל טוקני האיפוס הפתוחים, ואז לחקור" }, next: "s2", score: 15,
          feedback: { en: "Right call: an active account-takeover path. Stop the bleeding first; support can reset passwords manually for an hour.", he: "החלטה נכונה: זה נתיב פעיל להשתלטות על חשבונות. קודם עוצרים את הדימום. התמיכה יכולה לאפס סיסמאות ידנית לשעה." } },
        { label: { en: "Block the three IPs in the WAF and keep watching", he: "לחסום את שלוש כתובות ה-IP ב-WAF ולהמשיך לעקוב" }, next: "s1b", score: 0,
          feedback: { en: "Those are Tor exit nodes. The attacker will be back from new IPs within minutes; you haven't touched the root cause.", he: "אלה exit nodes של Tor. התוקף יחזור מכתובות חדשות תוך דקות, ולא נגעת בשורש הבעיה." } },
        { label: { en: "Assume credential stuffing and force-reset every user's password by email", he: "להניח שזה credential stuffing ולכפות איפוס סיסמה במייל על כל המשתמשים" }, next: "lose", score: -15,
          feedback: { en: "You just sent millions of fresh reset tokens through the exact mechanism being exploited. The attacker harvests them all.", he: "בדיוק שלחת מיליוני טוקני איפוס חדשים דרך המנגנון שמנוצל. התוקף קוצר את כולם." } }
      ]
    },
    s1b: {
      text: {
        en: "09:55. Seven more takeovers, now from a new set of IPs. The pattern is identical: one 'forgot password' for the victim, one for a throwaway account the attacker controls, then a successful confirm within two seconds.",
        he: "09:55. עוד שבע השתלטויות, הפעם מסט חדש של כתובות IP. הדפוס זהה: 'שכחתי סיסמה' אחד לקורבן, אחד לחשבון זמני שבשליטת התוקף, ואז confirm מוצלח תוך שתי שניות."
      },
      choices: [
        { label: { en: "Kill self-service reset now and invalidate all outstanding tokens", he: "לכבות עכשיו את האיפוס העצמי ולבטל את כל הטוקנים הפתוחים" }, next: "s2", score: 5,
          feedback: { en: "Late but correct. Containment before analysis.", he: "מאוחר אבל נכון. קודם בלימה, אחר כך ניתוח." } },
        { label: { en: "Add a CAPTCHA to the forgot-password form", he: "להוסיף CAPTCHA לטופס שכחתי סיסמה" }, next: "lose", score: -10,
          feedback: { en: "A CAPTCHA costs the attacker a few cents per request. The token is still guessable; takeovers continue.", he: "CAPTCHA עולה לתוקף כמה סנטים לבקשה. הטוקן עדיין ניתן לניחוש, וההשתלטויות ממשיכות." } }
      ]
    },
    s2: {
      text: {
        en: "10:05. Reset is off and the takeovers have stopped. Why does the attacker request a reset for their own throwaway account at the same second? You open the token code.",
        he: "10:05. האיפוס כבוי וההשתלטויות נעצרו. למה התוקף מבקש איפוס גם לחשבון הזמני שלו באותה שנייה? אתה פותח את הקוד שמייצר את הטוקן."
      },
      data: `# auth/reset.py  (git blame: 2019, "simple 6-digit codes, easier for mobile")
import random

def make_reset_token(user):
    token = str(random.randint(100000, 999999))
    db.execute("INSERT INTO reset_tokens (user_id, token, expires_at) "
               "VALUES (%s, %s, now() + interval '24 hours')", (user.id, token))
    return token

# gunicorn: 4 workers, preload_app = True`,
      choices: [
        { label: { en: "Python's random is Mersenne Twister: the attacker sees their own codes, recovers the PRNG state and predicts the victim's code generated right after", he: "random של Python הוא Mersenne Twister: התוקף רואה את הקודים של עצמו, משחזר את ה-state של ה-PRNG וחוזה את הקוד של הקורבן שנוצר מיד אחריו" }, next: "s3", score: 15,
          feedback: { en: "Exactly. Each throwaway reset leaks an output. And with preload_app, all 4 forked workers start with the same state, which makes it even easier.", he: "בדיוק. כל איפוס של חשבון זמני מדליף פלט. ועם preload_app, כל 4 ה-workers אחרי ה-fork מתחילים מאותו state, מה שמקל עוד יותר." } },
        { label: { en: "Someone must have access to the reset_tokens table — rotate the DB password", he: "למישהו יש גישה לטבלת reset_tokens. צריך להחליף את סיסמת הדאטהבייס" }, next: "s3", score: 0,
          feedback: { en: "Rotating credentials is cheap and not wrong, but the timing pattern (own reset + victim reset in one second, confirm 2s later) points to prediction, not a DB leak.", he: "החלפת credentials זולה ולא שגויה, אבל דפוס התזמון (איפוס לעצמו ואיפוס לקורבן באותה שנייה, confirm שתי שניות אחרי) מצביע על חיזוי, לא על דליפה מהדאטהבייס." } }
      ]
    },
    s3: {
      text: {
        en: "10:30. Root cause confirmed in staging: 624 observed outputs reproduce the generator exactly. Even without that, a 6-digit code valid for 24 hours with no attempt limit is brute-forceable (10^6 values). How do you fix token generation?",
        he: "10:30. שורש הבעיה אושר ב-staging: 624 פלטים שנצפו משחזרים את ה-generator במדויק. וגם בלי זה, קוד של 6 ספרות שתקף 24 שעות בלי הגבלת ניסיונות אפשר לפרוץ ב-brute-force ‏(10^6 ערכים). איך מתקנים את יצירת הטוקן?"
      },
      choices: [
        { label: { en: "secrets.token_urlsafe(32) in the link, store only its SHA-256, 15-minute TTL, single use, invalidate on password change, rate-limit confirm attempts", he: "secrets.token_urlsafe(32) בלינק, לשמור רק את ה-SHA-256 שלו, TTL של 15 דקות, שימוש חד-פעמי, ביטול בשינוי סיסמה, ו-rate limit לניסיונות confirm" }, next: "s4", score: 15,
          feedback: { en: "256 bits from the OS CSPRNG can't be predicted or brute-forced; hashing at rest means a DB dump doesn't yield live tokens.", he: "256 bits מה-CSPRNG של מערכת ההפעלה אי אפשר לחזות או לפרוץ ב-brute-force, ו-hash באחסון אומר ש-dump של הדאטהבייס לא מניב טוקנים חיים." } },
        { label: { en: "Keep random but call random.seed(time.time()) before each token", he: "להשאיר את random אבל לקרוא ל-random.seed(time.time()) לפני כל טוקן" }, next: "lose", score: -15,
          feedback: { en: "Now the seed is the request time, which the attacker knows to the second: a few thousand guesses recover every token.", he: "עכשיו ה-seed הוא זמן הבקשה, שהתוקף יודע ברמת שנייה: כמה אלפי ניחושים משחזרים כל טוקן." } },
        { label: { en: "Make it 12 digits with random.randint", he: "להגדיל ל-12 ספרות עם random.randint" }, next: "lose", score: -10,
          feedback: { en: "Longer output from a predictable generator is still predictable.", he: "פלט ארוך יותר מ-generator צפוי עדיין צפוי." } }
      ]
    },
    s4: {
      text: {
        en: "12:00. The fix is deployed and self-service reset is back on. What else has to happen before you close the incident?",
        he: "12:00. התיקון ב-deploy והאיפוס העצמי חזר לפעול. מה עוד צריך לקרות לפני שסוגרים את האירוע?"
      },
      data: `$ grep -rnE 'random\\.(randint|random|choice|getrandbits)' --include='*.py' . | grep -v tests/
auth/reset.py:14:        (fixed)
invites/links.py:9:    code = ''.join(random.choice(ALPHABET) for _ in range(10))
api/keys.py:22:    return 'sk_' + hex(random.getrandbits(128))[2:]`,
      choices: [
        { label: { en: "Fix invites and API keys too and rotate every API key made with random; revoke sessions of the 21 affected accounts, notify them; add Bandit B311 to CI; blameless postmortem", he: "לתקן גם את ההזמנות ואת ה-API keys ולסובב כל API key שנוצר עם random. לבטל את ה-sessions של 21 החשבונות שנפגעו ולהודיע להם. להוסיף את Bandit B311 ל-CI. ‏Postmortem בלי האשמות" }, next: "win", score: 15,
          feedback: { en: "Same bug class, same fix. Existing API keys are predictable forever until rotated, and a CI rule keeps the bug from coming back.", he: "אותה משפחת באגים, אותו תיקון. API keys קיימים נשארים צפויים לנצח עד שמסובבים אותם, וכלל ב-CI מונע מהבאג לחזור." } },
        { label: { en: "Close it: the reset flow is fixed", he: "לסגור: תהליך האיפוס תוקן" }, next: "lose", score: -10,
          feedback: { en: "API keys from the same Mersenne Twister are still live, and the victims' attacker sessions are still logged in.", he: "API keys מאותו Mersenne Twister עדיין חיים, וה-sessions של התוקף בחשבונות הקורבנות עדיין מחוברים." } }
      ]
    },
    win: {
      text: {
        en: "Contained in 20 minutes, root cause in an hour, every token type moved to the CSPRNG, attacker sessions revoked, affected customers notified, and a CI rule blocks the random module in security code. The postmortem's headline: 'random ≠ secret'.",
        he: "בלימה תוך 20 דקות, שורש הבעיה תוך שעה, כל סוגי הטוקנים עברו ל-CSPRNG, ה-sessions של התוקף בוטלו, הלקוחות שנפגעו קיבלו הודעה, וכלל ב-CI חוסם את מודול random בקוד אבטחה. הכותרת של ה-postmortem: 'random ≠ סוד'."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "Takeovers continue or come back through another predictable token. The lesson: anything an attacker must not guess comes from the OS CSPRNG (secrets, crypto.randomBytes, SecureRandom, crypto/rand), with enough bits, short TTLs, single use and attempt limits.",
        he: "ההשתלטויות ממשיכות או חוזרות דרך טוקן צפוי אחר. הלקח: כל דבר שאסור לתוקף לנחש מגיע מה-CSPRNG של מערכת ההפעלה (secrets, ‏crypto.randomBytes, ‏SecureRandom, ‏crypto/rand), עם מספיק bits, ‏TTL קצר, שימוש חד-פעמי והגבלת ניסיונות."
      },
      end: "lose"
    }
  },
  lessons: ["random-numbers", "crypto-hashing-practice", "pr-auth", "uuid-guid-deep"]
});

})();
