// Caching & Redis deep dives: Redis internals, caching algorithms & consistency, data structures inside infra.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// Lesson: Redis in depth
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "redis-deep",
  track: "data",
  order: 20,
  icon: "🟥",
  level: 3,
  minutes: 18,
  title: { en: "Redis in Depth: Internals, Data Structures, HA & Locks", he: "Redis לעומק: internals, מבני נתונים, HA ו-locks" },
  tldr: {
    en: "Redis is a single-threaded in-memory data-structure server: pick the right structure, bound memory with an eviction policy, choose persistence and HA deliberately, and never let one hot or big key block the event loop.",
    he: "Redis הוא שרת מבני נתונים in-memory עם thread יחיד שמריץ פקודות: בוחרים את המבנה הנכון, מגבילים זיכרון עם eviction policy, בוחרים persistence ו-HA בכוונה, ולא נותנים לאף hot key או big key לחסום את ה-event loop."
  },
  analogy: {
    en: "Redis is a single, extremely fast barista with a counter full of specialised tools — a scale (counters), a ranked display shelf (sorted sets), a ticket rail (streams). One barista means no two orders ever collide, so every order is atomic. But if one customer orders 'a coffee for each of my 2 million friends' (a big key, a KEYS *), the entire queue waits behind him.",
    he: "Redis זה בריסטה אחד, מהיר בטירוף, עם דלפק מלא כלים ייעודיים — משקל (counters), מדף מדורג (sorted sets), מסילת פתקים (streams). בריסטה אחד אומר ששתי הזמנות אף פעם לא מתנגשות, אז כל הזמנה היא atomic. אבל אם לקוח אחד מזמין 'קפה לכל 2 מיליון החברים שלי' (big key, או KEYS *), כל התור מחכה מאחוריו."
  },
  sections: [
    {
      h: { en: "The event loop: why single-threaded is fast (and where it hurts)", he: "ה-event loop: למה thread יחיד זה מהיר (ואיפה זה כואב)" },
      body: {
        en: `<p>Redis executes commands on <strong>one main thread</strong> driven by an event loop (<code>epoll</code> on Linux). Data lives in RAM, most commands are O(1) or O(log N), so a single core does roughly 100k-200k simple ops/s without locks, context switches or cache-line contention. A side effect you rely on every day: <strong>every single command is atomic</strong> — <code>INCR</code> never loses an update.</p>
<ul>
<li><strong>I/O threads</strong> (<code>io-threads 4</code>, since Redis 6): offload reading/parsing sockets and writing replies to extra threads. Command <em>execution</em> is still single-threaded. Helps when you're network-bound with many clients; Valkey 8 reworked this further for higher throughput per node.</li>
<li><strong>Background threads</strong> handle <code>UNLINK</code>/lazy free, AOF fsync and closing files, and <code>BGSAVE</code> uses a <code>fork()</code>ed child.</li>
<li><strong>The cost:</strong> any slow command stalls <em>everyone</em>. <code>KEYS *</code> on 50M keys, <code>HGETALL</code> on a 2M-field hash, <code>DEL</code> of a 1 GB set, or a long Lua script = seconds of p99 latency for all clients.</li>
</ul>
<pre>redis-cli SLOWLOG GET 10            # commands slower than slowlog-log-slower-than (default 10000 µs)
redis-cli CONFIG SET latency-monitor-threshold 100
redis-cli LATENCY DOCTOR            # human-readable analysis of latency spikes
redis-cli --latency -i 1            # live PING round-trip</pre>
<blockquote>⚠️ Production tip: Use <code>SCAN</code> (cursor-based, small batches) instead of <code>KEYS</code>, and <code>UNLINK</code> instead of <code>DEL</code> for big values — UNLINK frees memory in a background thread. Rename or ACL-deny <code>KEYS</code>, <code>FLUSHALL</code> and <code>DEBUG</code> in production.</blockquote>`,
        he: `<p>Redis מריץ פקודות על <strong>main thread אחד</strong> שמונע על ידי event loop (<code>epoll</code> ב-Linux). הדאטה ב-RAM, רוב הפקודות הן O(1) או O(log N), אז core יחיד עושה בערך 100k-200k פעולות פשוטות בשנייה בלי locks, בלי context switches ובלי מלחמות על cache lines. תופעת לוואי שאתם נשענים עליה כל יום: <strong>כל פקודה בודדת היא atomic</strong> — <code>INCR</code> אף פעם לא מאבד עדכון.</p>
<ul>
<li><strong>I/O threads</strong> (<code>io-threads 4</code>, מ-Redis 6): מעבירים קריאה ו-parsing מה-sockets וכתיבת תשובות ל-threads נוספים. ה-<em>execution</em> של הפקודות עדיין על thread אחד. עוזר כשאתם חסומים ברשת עם הרבה clients; ב-Valkey 8 שכתבו את זה שוב בשביל throughput גבוה יותר לכל node.</li>
<li><strong>Background threads</strong> מטפלים ב-<code>UNLINK</code>/lazy free, ב-fsync של AOF ובסגירת קבצים, ו-<code>BGSAVE</code> משתמש ב-child שנוצר עם <code>fork()</code>.</li>
<li><strong>המחיר:</strong> כל פקודה איטית תוקעת את <em>כולם</em>. <code>KEYS *</code> על 50M keys, <code>HGETALL</code> על hash עם 2M שדות, <code>DEL</code> של set בגודל 1 GB, או סקריפט Lua ארוך = שניות של p99 latency לכל ה-clients.</li>
</ul>
<pre>redis-cli SLOWLOG GET 10            # commands slower than slowlog-log-slower-than (default 10000 µs)
redis-cli CONFIG SET latency-monitor-threshold 100
redis-cli LATENCY DOCTOR            # human-readable analysis of latency spikes
redis-cli --latency -i 1            # live PING round-trip</pre>
<blockquote>⚠️ טיפ מפרודקשן: <code>SCAN</code> (מבוסס cursor, באצ'ים קטנים) במקום <code>KEYS</code>, ו-<code>UNLINK</code> במקום <code>DEL</code> לערכים גדולים — UNLINK משחרר זיכרון ב-background thread. בפרודקשן עושים rename או חוסמים ב-ACL את <code>KEYS</code>, <code>FLUSHALL</code> ו-<code>DEBUG</code>.</blockquote>`
      }
    },
    {
      h: { en: "Data structures and what they're really for", he: "מבני הנתונים ולמה הם באמת טובים" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Real use</th><th>Key commands</th></tr>
<tr><td>String</td><td>Cached blobs, counters, flags, locks</td><td><code>SET k v EX 60 NX</code>, <code>INCRBY</code>, <code>GETEX</code></td></tr>
<tr><td>Hash</td><td>An object with fields (session, user profile) — update one field without rewriting the blob</td><td><code>HSET</code>, <code>HINCRBY</code>, <code>HMGET</code></td></tr>
<tr><td>List</td><td>Simple queues, recent-N timelines</td><td><code>LPUSH</code>+<code>LTRIM</code>, <code>BLMOVE</code> (reliable queue)</td></tr>
<tr><td>Set</td><td>Unique membership, tags, "who's online"</td><td><code>SADD</code>, <code>SISMEMBER</code>, <code>SINTER</code></td></tr>
<tr><td>Sorted set</td><td>Leaderboards, priority queues, sliding-window rate limits, time indexes</td><td><code>ZADD</code>, <code>ZINCRBY</code>, <code>ZRANGE ... REV</code>, <code>ZREMRANGEBYSCORE</code></td></tr>
<tr><td>Stream</td><td>Durable append-only event log with consumer groups and acks</td><td><code>XADD</code>, <code>XREADGROUP</code>, <code>XACK</code>, <code>XAUTOCLAIM</code></td></tr>
<tr><td>HyperLogLog</td><td>Approximate count-distinct (unique visitors) in 12 KB, ~0.81% error</td><td><code>PFADD</code>, <code>PFCOUNT</code>, <code>PFMERGE</code></td></tr>
<tr><td>Bitmap</td><td>One bit per user id: daily actives, feature flags; 100M users = 12.5 MB</td><td><code>SETBIT</code>, <code>BITCOUNT</code>, <code>BITOP AND</code></td></tr>
<tr><td>Geo</td><td>"Drivers within 2 km" (a sorted set of geohashes underneath)</td><td><code>GEOADD</code>, <code>GEOSEARCH ... BYRADIUS</code></td></tr>
</table>
<p><strong>Streams vs Pub/Sub:</strong> Pub/Sub is fire-and-forget — if a subscriber is disconnected, the message is gone; there is no history. Streams persist entries, support consumer groups (like Kafka-lite), track a Pending Entries List of unacked messages, and let a crashed consumer's messages be claimed by another (<code>XAUTOCLAIM</code>). Use Pub/Sub for ephemeral fan-out (cache-invalidation pings, live dashboards), Streams when losing a message matters.</p>
<p><strong>Sliding-window rate limit with a sorted set</strong> (score = timestamp):</p>
<pre>MULTI
ZREMRANGEBYSCORE rl:user:42 0 (now_ms-60000)   # drop entries older than 60 s
ZADD rl:user:42 now_ms req-uuid
ZCARD rl:user:42                                # &gt; 100 ? reject
EXPIRE rl:user:42 60
EXEC</pre>
<blockquote>💡 Real world: Small hashes/sets/sorted sets are stored in a compact <strong>listpack</strong> encoding (e.g. <code>hash-max-listpack-entries 128</code>). Splitting 10M flat string keys into hashes of ~100 fields can cut memory by more than half — <code>OBJECT ENCODING key</code> shows which encoding you got.</blockquote>`,
        he: `<table>
<tr><th>Type</th><th>שימוש אמיתי</th><th>פקודות עיקריות</th></tr>
<tr><td>String</td><td>blobs ב-cache, counters, flags, locks</td><td><code>SET k v EX 60 NX</code>, <code>INCRBY</code>, <code>GETEX</code></td></tr>
<tr><td>Hash</td><td>אובייקט עם שדות (session, פרופיל משתמש) — מעדכנים שדה אחד בלי לכתוב מחדש את כל ה-blob</td><td><code>HSET</code>, <code>HINCRBY</code>, <code>HMGET</code></td></tr>
<tr><td>List</td><td>תורים פשוטים, timeline של N האחרונים</td><td><code>LPUSH</code>+<code>LTRIM</code>, <code>BLMOVE</code> (reliable queue)</td></tr>
<tr><td>Set</td><td>חברות ייחודית, tags, "מי online"</td><td><code>SADD</code>, <code>SISMEMBER</code>, <code>SINTER</code></td></tr>
<tr><td>Sorted set</td><td>Leaderboards, תורי עדיפויות, rate limit בחלון נע, אינדקסים לפי זמן</td><td><code>ZADD</code>, <code>ZINCRBY</code>, <code>ZRANGE ... REV</code>, <code>ZREMRANGEBYSCORE</code></td></tr>
<tr><td>Stream</td><td>Event log עמיד, append-only, עם consumer groups ו-acks</td><td><code>XADD</code>, <code>XREADGROUP</code>, <code>XACK</code>, <code>XAUTOCLAIM</code></td></tr>
<tr><td>HyperLogLog</td><td>ספירת ערכים ייחודיים בקירוב (unique visitors) ב-12 KB, שגיאה של ~0.81%</td><td><code>PFADD</code>, <code>PFCOUNT</code>, <code>PFMERGE</code></td></tr>
<tr><td>Bitmap</td><td>ביט אחד לכל user id: DAU, feature flags; 100M משתמשים = 12.5 MB</td><td><code>SETBIT</code>, <code>BITCOUNT</code>, <code>BITOP AND</code></td></tr>
<tr><td>Geo</td><td>"נהגים ברדיוס 2 ק"מ" (מתחת למכסה זה sorted set של geohashes)</td><td><code>GEOADD</code>, <code>GEOSEARCH ... BYRADIUS</code></td></tr>
</table>
<p><strong>Streams מול Pub/Sub:</strong> Pub/Sub זה fire-and-forget — אם subscriber מנותק, ההודעה הלכה; אין היסטוריה. Streams שומרים את ה-entries, תומכים ב-consumer groups (מעין Kafka-lite), מחזיקים Pending Entries List של הודעות שלא קיבלו ack, ומאפשרים ל-consumer אחר "לתפוס" הודעות של consumer שקרס (<code>XAUTOCLAIM</code>). Pub/Sub ל-fan-out חולף (פינג של cache invalidation, דשבורדים חיים), Streams כשאיבוד הודעה זה בעיה.</p>
<p><strong>Rate limit בחלון נע עם sorted set</strong> (score = timestamp):</p>
<pre>MULTI
ZREMRANGEBYSCORE rl:user:42 0 (now_ms-60000)   # drop entries older than 60 s
ZADD rl:user:42 now_ms req-uuid
ZCARD rl:user:42                                # &gt; 100 ? reject
EXPIRE rl:user:42 60
EXEC</pre>
<blockquote>💡 מהשטח: hashes/sets/sorted sets קטנים נשמרים ב-encoding קומפקטי שנקרא <strong>listpack</strong> (למשל <code>hash-max-listpack-entries 128</code>). פיצול של 10M string keys שטוחים ל-hashes של ~100 שדות יכול לחתוך את הזיכרון ביותר מחצי — <code>OBJECT ENCODING key</code> מראה איזה encoding קיבלתם.</blockquote>`
      }
    },
    {
      h: { en: "Memory: TTL expiry, maxmemory and eviction policies", he: "זיכרון: TTL expiry, maxmemory ו-eviction policies" },
      body: {
        en: `<p><strong>Expiry is two mechanisms:</strong></p>
<ul>
<li><strong>Lazy (passive):</strong> when a client touches a key, Redis checks its TTL and deletes it if expired.</li>
<li><strong>Active sampling:</strong> about 10 times a second (<code>hz 10</code>) Redis samples ~20 random keys <em>that have a TTL</em>, deletes the expired ones, and repeats immediately if more than ~25% were expired (with a CPU time cap). So expired-but-untouched keys can linger briefly — memory is reclaimed statistically, not at the exact second.</li>
</ul>
<p>When <code>used_memory</code> hits <code>maxmemory</code>, the <code>maxmemory-policy</code> decides what happens on the next write:</p>
<table>
<tr><th>Policy</th><th>Evicts</th><th>Use when</th></tr>
<tr><td><code>allkeys-lru</code></td><td>Least recently used, any key</td><td>Pure cache, recency matters — the safe default</td></tr>
<tr><td><code>allkeys-lfu</code></td><td>Least frequently used (with decay)</td><td>Pure cache with a stable hot set; resists one-off scans</td></tr>
<tr><td><code>volatile-lru</code> / <code>volatile-lfu</code> / <code>volatile-ttl</code></td><td>Only keys that have a TTL</td><td>Mixed cache + must-keep data in one instance (better: split instances)</td></tr>
<tr><td><code>noeviction</code></td><td>Nothing — writes return OOM errors</td><td>Redis as a primary store, queues, locks</td></tr>
</table>
<p><strong>LRU is approximated.</strong> Redis doesn't keep a global linked list (that would cost memory and pointer chasing). Each key stores a 24-bit clock; on eviction Redis samples <code>maxmemory-samples</code> keys (default 5) and evicts the best candidate from a small pool. Raising it to 10 gets closer to true LRU for some CPU. <strong>LFU</strong> reuses the same 24 bits as a logarithmic (Morris-style) 8-bit counter plus a decay timestamp, tuned with <code>lfu-log-factor</code> and <code>lfu-decay-time</code>.</p>
<pre>redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
redis-cli INFO stats  | grep -E "evicted_keys|expired_keys"
redis-cli MEMORY USAGE user:42           # bytes incl. overhead
redis-cli MEMORY DOCTOR</pre>
<blockquote>⚠️ Production tip: Set <code>maxmemory</code> to ~70-80% of the box/container memory. <code>BGSAVE</code> and AOF rewrite <code>fork()</code>, and copy-on-write can duplicate every page that changes during the snapshot — a write-heavy 10 GB instance with no headroom gets OOM-killed during a save. A <code>mem_fragmentation_ratio</code> well above 1.5 means fragmentation; <code>activedefrag yes</code> helps.</blockquote>`,
        he: `<p><strong>Expiry זה שני מנגנונים:</strong></p>
<ul>
<li><strong>Lazy (פסיבי):</strong> כש-client נוגע ב-key, Redis בודק את ה-TTL ומוחק אם פג.</li>
<li><strong>דגימה אקטיבית:</strong> בערך 10 פעמים בשנייה (<code>hz 10</code>) Redis דוגם ~20 keys אקראיים <em>שיש להם TTL</em>, מוחק את אלה שפגו, וחוזר מיד אם יותר מ-~25% מהם פגו (עם תקרת זמן CPU). כלומר keys שפגו ואף אחד לא נגע בהם יכולים להסתובב עוד קצת — הזיכרון מתפנה סטטיסטית, לא בשנייה המדויקת.</li>
</ul>
<p>כש-<code>used_memory</code> מגיע ל-<code>maxmemory</code>, ה-<code>maxmemory-policy</code> קובע מה קורה בכתיבה הבאה:</p>
<table>
<tr><th>Policy</th><th>מה נזרק</th><th>מתי</th></tr>
<tr><td><code>allkeys-lru</code></td><td>Least recently used, כל key</td><td>Cache טהור, recency חשוב — ברירת המחדל הבטוחה</td></tr>
<tr><td><code>allkeys-lfu</code></td><td>Least frequently used (עם decay)</td><td>Cache טהור עם hot set יציב; עמיד ל-scans חד-פעמיים</td></tr>
<tr><td><code>volatile-lru</code> / <code>volatile-lfu</code> / <code>volatile-ttl</code></td><td>רק keys עם TTL</td><td>Cache מעורב עם דאטה שחייב להישאר באותו instance (עדיף: לפצל instances)</td></tr>
<tr><td><code>noeviction</code></td><td>כלום — כתיבות מחזירות OOM error</td><td>Redis כ-primary store, תורים, locks</td></tr>
</table>
<p><strong>ה-LRU הוא קירוב.</strong> Redis לא מחזיק linked list גלובלית (זה עולה זיכרון ו-pointer chasing). כל key מחזיק שעון של 24 ביט; ב-eviction Redis דוגם <code>maxmemory-samples</code> keys (ברירת מחדל 5) ומפנה את המועמד הכי טוב מתוך pool קטן. העלאה ל-10 מתקרבת ל-LRU אמיתי במחיר CPU. <strong>LFU</strong> משתמש באותם 24 ביט בתור counter לוגריתמי (בסגנון Morris) של 8 ביט ועוד timestamp ל-decay, ומכווננים אותו עם <code>lfu-log-factor</code> ו-<code>lfu-decay-time</code>.</p>
<pre>redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
redis-cli INFO stats  | grep -E "evicted_keys|expired_keys"
redis-cli MEMORY USAGE user:42           # bytes incl. overhead
redis-cli MEMORY DOCTOR</pre>
<blockquote>⚠️ טיפ מפרודקשן: <code>maxmemory</code> על ~70-80% מהזיכרון של המכונה/ה-container. <code>BGSAVE</code> ו-AOF rewrite עושים <code>fork()</code>, ו-copy-on-write יכול לשכפל כל page שמשתנה בזמן ה-snapshot — instance של 10 GB עם הרבה כתיבות ובלי מרווח יחטוף OOM kill באמצע save. <code>mem_fragmentation_ratio</code> הרבה מעל 1.5 = פרגמנטציה; <code>activedefrag yes</code> עוזר.</blockquote>`
      }
    },
    {
      h: { en: "Persistence, replication, Sentinel vs Cluster", he: "Persistence, replication, Sentinel מול Cluster" },
      body: {
        en: `<p><strong>RDB</strong> = point-in-time snapshot via a forked child (<code>BGSAVE</code>). Compact, fast restarts, but you lose everything since the last snapshot. <strong>AOF</strong> = append every write command to a log; <code>appendfsync everysec</code> (the usual choice) loses at most ~1 s of writes, <code>always</code> fsyncs every write (slow), <code>no</code> leaves it to the OS. AOF is periodically rewritten/compacted; with <code>aof-use-rdb-preamble yes</code> the rewritten file starts with an RDB snapshot. For a pure cache, many teams turn persistence off entirely and accept a cold start.</p>
<p><strong>Replication is asynchronous.</strong> A replica does a full sync (RDB transfer) once, then streams commands; after a short disconnect it resumes via <code>PSYNC</code> if the gap still fits in <code>repl-backlog-size</code> — otherwise another expensive full sync. Because it's async, an acknowledged write can be lost on failover. <code>WAIT 1 100</code> blocks until 1 replica acked (reduces, does not eliminate, loss).</p>
<table>
<tr><th></th><th>Sentinel</th><th>Cluster</th></tr>
<tr><td>Solves</td><td>HA for one primary + replicas</td><td>HA <em>and</em> horizontal sharding</td></tr>
<tr><td>How</td><td>≥3 Sentinel processes monitor, agree by quorum, promote a replica; clients ask Sentinel "who is primary?"</td><td>Keyspace split into <strong>16384 hash slots</strong>: <code>slot = CRC16(key) mod 16384</code>; each primary owns a range; nodes gossip; replicas auto-promote</td></tr>
<tr><td>Client</td><td>Sentinel-aware client</td><td>Cluster-aware client follows <code>MOVED</code>/<code>ASK</code> redirects and caches the slot map</td></tr>
<tr><td>Limits</td><td>Write capacity = one node</td><td>Multi-key ops only within one slot; only DB 0</td></tr>
</table>
<p><strong>Hash tags</strong> force related keys into the same slot: only the part inside <code>{}</code> is hashed, so <code>cart:{user42}</code> and <code>orders:{user42}</code> land together and can be used in one <code>MULTI</code> or Lua script. Overuse it (<code>{global}</code>) and you've rebuilt a single hot shard.</p>
<pre>redis-cli -c -h node1 CLUSTER INFO | head -3        # cluster_state:ok, slots assigned
redis-cli -c CLUSTER KEYSLOT "cart:{user42}"        # same as KEYSLOT user42
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster</pre>`,
        he: `<p><strong>RDB</strong> = snapshot לנקודת זמן דרך child שעבר fork (<code>BGSAVE</code>). קומפקטי, restart מהיר, אבל מאבדים כל מה שנכתב מאז ה-snapshot האחרון. <strong>AOF</strong> = כל פקודת כתיבה נוספת ל-log; <code>appendfsync everysec</code> (הבחירה הנפוצה) מאבד לכל היותר ~שנייה של כתיבות, <code>always</code> עושה fsync לכל כתיבה (איטי), <code>no</code> משאיר את זה ל-OS. ה-AOF נכתב מחדש ומתכווץ מדי פעם; עם <code>aof-use-rdb-preamble yes</code> הקובץ החדש מתחיל ב-snapshot של RDB. ל-cache טהור הרבה צוותים מכבים persistence לגמרי ומקבלים cold start.</p>
<p><strong>Replication היא אסינכרונית.</strong> Replica עושה full sync (העברת RDB) פעם אחת ואז מקבלת stream של פקודות; אחרי ניתוק קצר היא ממשיכה עם <code>PSYNC</code> אם הפער עדיין נכנס ב-<code>repl-backlog-size</code> — אחרת עוד full sync יקר. בגלל שזה async, כתיבה שקיבלה ack יכולה ללכת לאיבוד ב-failover. <code>WAIT 1 100</code> חוסם עד ש-replica אחת אישרה (מקטין את הסיכון, לא מבטל).</p>
<table>
<tr><th></th><th>Sentinel</th><th>Cluster</th></tr>
<tr><td>פותר</td><td>HA ל-primary אחד + replicas</td><td>HA <em>וגם</em> sharding אופקי</td></tr>
<tr><td>איך</td><td>לפחות 3 תהליכי Sentinel מנטרים, מסכימים לפי quorum, מקדמים replica; ה-clients שואלים את Sentinel "מי ה-primary?"</td><td>ה-keyspace מחולק ל-<strong>16384 hash slots</strong>: <code>slot = CRC16(key) mod 16384</code>; כל primary מחזיק טווח; ה-nodes מדברים ב-gossip; replicas מקודמות אוטומטית</td></tr>
<tr><td>Client</td><td>Client שמכיר Sentinel</td><td>Client שמכיר Cluster, עוקב אחרי redirects של <code>MOVED</code>/<code>ASK</code> ושומר את מפת ה-slots</td></tr>
<tr><td>מגבלות</td><td>קיבולת כתיבה = node אחד</td><td>פעולות multi-key רק בתוך slot אחד; רק DB 0</td></tr>
</table>
<p><strong>Hash tags</strong> מכריחים keys קשורים לאותו slot: רק החלק שבתוך <code>{}</code> עובר hash, אז <code>cart:{user42}</code> ו-<code>orders:{user42}</code> נוחתים יחד ואפשר להשתמש בהם ב-<code>MULTI</code> או בסקריפט Lua אחד. תגזימו עם זה (<code>{global}</code>) ובניתם מחדש shard חם אחד.</p>
<pre>redis-cli -c -h node1 CLUSTER INFO | head -3        # cluster_state:ok, slots assigned
redis-cli -c CLUSTER KEYSLOT "cart:{user42}"        # same as KEYSLOT user42
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster</pre>`
      }
    },
    {
      h: { en: "Hot keys, big keys, atomicity and distributed locks", he: "Hot keys, big keys, אטומיות ו-distributed locks" },
      body: {
        en: `<ul>
<li><strong>Big key:</strong> a single value of many MB or millions of elements. Reading it saturates the NIC, deleting it blocks the loop, migrating its slot in Cluster stalls. Find with <code>redis-cli --bigkeys</code> / <code>--memkeys</code> (SCAN-based, safe-ish) and fix by splitting (<code>feed:42:page:3</code>) or capping (<code>LTRIM</code>).</li>
<li><strong>Hot key:</strong> one key getting 100k req/s pins one shard's single thread while the rest of the cluster idles — sharding doesn't help, a key lives in exactly one slot. Find with <code>redis-cli --hotkeys</code> (requires an LFU policy) or client-side metrics; fix with a local in-process L1 cache, read replicas, or splitting the key into N copies (<code>hot:{1..8}</code>).</li>
</ul>
<p><strong>Atomic multi-step logic:</strong> <code>MULTI/EXEC</code> queues commands and runs them back-to-back — but there is <em>no rollback</em>, and you can't branch on a value read inside it; add <code>WATCH</code> for optimistic check-and-set. <strong>Lua</strong> (<code>EVAL</code>, or Functions since Redis 7) runs a whole script atomically with logic — keep it to milliseconds, it blocks everything.</p>
<p><strong>Distributed lock, the honest version:</strong></p>
<pre>SET lock:invoice:77 &lt;random-token&gt; NX PX 30000     # acquire, auto-expire 30 s
# release ONLY if we still own it (Lua compare-and-delete):
EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:invoice:77 &lt;random-token&gt;</pre>
<p>The trap: a client gets the lock, then pauses (GC, VM stall) past 30 s; the lock expires, client B takes it, and A wakes up still believing it holds the lock. <strong>Redlock</strong> (acquire on a majority of N=5 independent masters) improves availability but Martin Kleppmann's 2016 critique showed it still depends on timing assumptions and cannot prevent this. The real fix is a <strong>fencing token</strong>: a monotonically increasing number issued with the lock (e.g. <code>INCR</code>), which the protected resource checks and rejects if stale. Locks for <em>efficiency</em> (avoid duplicate work) → Redis is fine. Locks for <em>correctness</em> (never double-charge) → use fencing, or etcd/ZooKeeper, or a DB constraint.</p>`,
        he: `<ul>
<li><strong>Big key:</strong> ערך בודד של הרבה MB או מיליוני אלמנטים. קריאה שלו חונקת את ה-NIC, מחיקה חוסמת את ה-loop, והעברת ה-slot שלו ב-Cluster נתקעת. מוצאים עם <code>redis-cli --bigkeys</code> / <code>--memkeys</code> (מבוסס SCAN, יחסית בטוח) ומתקנים בפיצול (<code>feed:42:page:3</code>) או בהגבלת גודל (<code>LTRIM</code>).</li>
<li><strong>Hot key:</strong> key אחד שמקבל 100k req/s תוקע את ה-thread היחיד של shard אחד בזמן ששאר ה-cluster משועמם — sharding לא עוזר, key חי בדיוק ב-slot אחד. מוצאים עם <code>redis-cli --hotkeys</code> (דורש LFU policy) או מטריקות בצד ה-client; מתקנים עם L1 cache מקומי בתוך התהליך, read replicas, או פיצול ה-key ל-N עותקים (<code>hot:{1..8}</code>).</li>
</ul>
<p><strong>לוגיקה אטומית של כמה צעדים:</strong> <code>MULTI/EXEC</code> שם פקודות בתור ומריץ אותן ברצף — אבל <em>אין rollback</em>, ואי אפשר להסתעף לפי ערך שנקרא בתוכו; מוסיפים <code>WATCH</code> בשביל check-and-set אופטימי. <strong>Lua</strong> (<code>EVAL</code>, או Functions מ-Redis 7) מריץ סקריפט שלם עם לוגיקה בצורה אטומית — שיהיה במילישניות, הוא חוסם הכול.</p>
<p><strong>Distributed lock, הגרסה הכנה:</strong></p>
<pre>SET lock:invoice:77 &lt;random-token&gt; NX PX 30000     # acquire, auto-expire 30 s
# release ONLY if we still own it (Lua compare-and-delete):
EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:invoice:77 &lt;random-token&gt;</pre>
<p>המלכודת: client לוקח את ה-lock ואז נתקע (GC, עצירת VM) מעבר ל-30 שניות; ה-lock פג, client B לוקח אותו, ו-A מתעורר עדיין בטוח שה-lock אצלו. <strong>Redlock</strong> (לקחת lock על רוב מתוך N=5 masters בלתי תלויים) משפר זמינות, אבל הביקורת של Martin Kleppmann מ-2016 הראתה שהוא עדיין תלוי בהנחות תזמון ולא מונע את התרחיש הזה. התיקון האמיתי הוא <strong>fencing token</strong>: מספר שעולה מונוטונית ומונפק יחד עם ה-lock (למשל <code>INCR</code>), והמשאב המוגן בודק אותו ודוחה token ישן. Lock בשביל <em>יעילות</em> (למנוע עבודה כפולה) → Redis מצוין. Lock בשביל <em>נכונות</em> (אסור לחייב פעמיים) → fencing, או etcd/ZooKeeper, או constraint ב-DB.</p>`
      }
    },
    {
      h: { en: "Managed Redis and the Valkey fork", he: "Redis מנוהל וה-fork של Valkey" },
      body: {
        en: `<p><strong>License history (short and careful):</strong> Redis was BSD-licensed for ~15 years. In March 2024 Redis Inc. moved new versions (7.4+) to a dual RSALv2/SSPLv1 source-available license. Within weeks, maintainers backed by AWS, Google, Oracle and others forked the last BSD release (7.2.4) as <strong>Valkey</strong> under the Linux Foundation. In 2025, with Redis 8, Redis added <strong>AGPLv3</strong> as an additional license option. Practically: Valkey and Redis remain protocol- and command-compatible for the vast majority of workloads (same clients, same <code>redis-cli</code>), but they are now diverging in new features — check the docs of the exact version you run.</p>
<table>
<tr><th>Cloud</th><th>Offerings</th><th>Notes</th></tr>
<tr><td>AWS</td><td>ElastiCache (Valkey, Redis OSS, Memcached; node-based or Serverless), MemoryDB</td><td>ElastiCache = cache, async replication. MemoryDB = durable primary store with a multi-AZ transaction log; writes are slower but acked writes survive failover. AWS prices Valkey lower than Redis OSS.</td></tr>
<tr><td>Azure</td><td>Azure Managed Redis (built on Redis Enterprise), Azure Cache for Redis</td><td>Microsoft positions Azure Managed Redis as the successor and has announced retirement timelines for Azure Cache for Redis — check current dates before starting new work.</td></tr>
<tr><td>GCP</td><td>Memorystore for Redis, Memorystore for Redis Cluster, Memorystore for Valkey</td><td>Cluster variants give sharding without running it yourself.</td></tr>
</table>
<blockquote>💡 Real world: "Managed" doesn't remove the physics. You still pick the eviction policy, still get a failover blip (seconds) with possible lost writes on non-durable tiers, still need clients with proper timeouts and reconnect logic, and still own hot keys and big keys.</blockquote>`,
        he: `<p><strong>היסטוריית הרישוי (בקצרה ובזהירות):</strong> Redis היה ברישיון BSD במשך ~15 שנה. במרץ 2024 Redis Inc. העבירה גרסאות חדשות (7.4 והלאה) לרישיון כפול RSALv2/SSPLv1 מסוג source-available. תוך שבועות, maintainers בגיבוי AWS, Google, Oracle ואחרים עשו fork לגרסת ה-BSD האחרונה (7.2.4) בשם <strong>Valkey</strong> תחת ה-Linux Foundation. ב-2025, עם Redis 8, Redis הוסיפה את <strong>AGPLv3</strong> כאופציית רישוי נוספת. בפועל: Valkey ו-Redis נשארים תואמים בפרוטוקול ובפקודות לרוב המוחלט של ה-workloads (אותם clients, אותו <code>redis-cli</code>), אבל הם כבר מתפצלים בפיצ'רים חדשים — תבדקו את ה-docs של הגרסה המדויקת שאתם מריצים.</p>
<table>
<tr><th>ענן</th><th>שירותים</th><th>הערות</th></tr>
<tr><td>AWS</td><td>ElastiCache (Valkey, Redis OSS, Memcached; מבוסס nodes או Serverless), MemoryDB</td><td>ElastiCache = cache, replication אסינכרוני. MemoryDB = primary store עמיד עם transaction log multi-AZ; כתיבות איטיות יותר, אבל כתיבה שקיבלה ack שורדת failover. ב-AWS ה-Valkey זול יותר מ-Redis OSS.</td></tr>
<tr><td>Azure</td><td>Azure Managed Redis (בנוי על Redis Enterprise), Azure Cache for Redis</td><td>Microsoft ממצבת את Azure Managed Redis כיורש והכריזה על לוחות זמנים ל-retirement של Azure Cache for Redis — תבדקו את התאריכים העדכניים לפני שמתחילים פרויקט חדש.</td></tr>
<tr><td>GCP</td><td>Memorystore for Redis, Memorystore for Redis Cluster, Memorystore for Valkey</td><td>גרסאות ה-Cluster נותנות sharding בלי להריץ אותו בעצמכם.</td></tr>
</table>
<blockquote>💡 מהשטח: "מנוהל" לא מבטל את הפיזיקה. עדיין בוחרים eviction policy, עדיין חוטפים קפיצה ב-failover (שניות) עם אפשרות לאיבוד כתיבות ב-tiers לא עמידים, עדיין צריך clients עם timeouts ולוגיקת reconnect נכונה, ועדיין ה-hot keys וה-big keys שלכם.</blockquote>`
      }
    }
  ],
  diagram: ` clients ──► [I/O threads: read/parse] ──► MAIN THREAD (event loop, executes ONE command at a time)
                                              │  ├─ keyspace in RAM (dict + listpack/skiplist/...)
                                              │  ├─ expiry: lazy on access + active sample 20 keys @10Hz
                                              │  └─ maxmemory hit → evict (sample 5 keys, approx LRU/LFU)
                                              ├─► AOF buffer ──fsync everysec──► appendonly.aof
                                              ├─► fork() child ──► dump.rdb   (copy-on-write!)
                                              └─► replication stream (async) ──► replica(s)

 Redis Cluster: CRC16(key) mod 16384
   slots 0-5460 ─► primary A (+replica A')     "cart:{u42}" & "orders:{u42}" → same slot
   slots 5461-10922 ─► primary B (+replica B')  wrong node? → -MOVED 3999 10.0.0.2:6379
   slots 10923-16383 ─► primary C (+replica C')`,
  handsOn: [
    { cmd: "docker run -d --name vk -p 6379:6379 valkey/valkey:8 && redis-cli INFO server | head -5", what: { en: "Start a local Valkey (any redis-cli works against it) and check the server version.", he: "מרימים Valkey מקומי (כל redis-cli עובד מולו) ובודקים את גרסת השרת." } },
    { cmd: "redis-cli ZADD lb 1500 alice 2300 bob 1800 carol && redis-cli ZRANGE lb 0 2 REV WITHSCORES", what: { en: "Build a leaderboard with a sorted set and read the top 3 in descending order.", he: "בונים leaderboard עם sorted set וקוראים את ה-top 3 בסדר יורד." } },
    { cmd: "redis-cli --bigkeys && redis-cli --memkeys", what: { en: "Scan the keyspace (via SCAN, non-blocking) for the largest keys per type and by memory.", he: "סורקים את ה-keyspace (דרך SCAN, בלי לחסום) ומוצאים את ה-keys הגדולים לפי type ולפי זיכרון." } },
    { cmd: "redis-cli CONFIG SET maxmemory-policy allkeys-lfu && redis-cli --hotkeys", what: { en: "Hot-key detection needs an LFU policy; this lists keys with the highest access frequency counters.", he: "זיהוי hot keys דורש LFU policy; זה מציג את ה-keys עם מוני הגישה הגבוהים ביותר." } },
    { cmd: "redis-cli INFO memory | grep -E 'used_memory_human|maxmemory_policy|mem_fragmentation_ratio' ; redis-cli SLOWLOG GET 5 ; redis-cli LATENCY DOCTOR", what: { en: "The 30-second health check: memory and policy, the slowest recent commands, and latency spike analysis.", he: "בדיקת בריאות של 30 שניות: זיכרון ו-policy, הפקודות האיטיות האחרונות, וניתוח קפיצות latency." } }
  ],
  mnemonic: {
    en: "\"One thread, nine shapes, four exits\": one thread (never block it), nine data structures (pick the right one), four ways keys leave — lazy expiry, active expiry, eviction, delete (use UNLINK).",
    he: "\"thread אחד, תשע צורות, ארבע יציאות\": thread אחד (לא חוסמים אותו), תשעה מבני נתונים (בוחרים את הנכון), ארבע דרכים ש-key יוצא — lazy expiry, active expiry, eviction, delete (עם UNLINK)."
  },
  pitfalls: [
    { en: "Running KEYS *, HGETALL/SMEMBERS on huge collections, or DEL on a multi-GB key in production — the single thread stalls and every client times out. Use SCAN/HSCAN, pagination and UNLINK.", he: "להריץ KEYS *, HGETALL/SMEMBERS על collections ענקיים, או DEL על key של כמה GB בפרודקשן — ה-thread היחיד נתקע וכל ה-clients נופלים על timeout. SCAN/HSCAN, pagination ו-UNLINK." },
    { en: "Leaving maxmemory unset (or equal to container memory) with persistence on: fork + copy-on-write during BGSAVE pushes RSS past the limit and the kernel OOM-kills Redis.", he: "להשאיר maxmemory לא מוגדר (או שווה לזיכרון ה-container) עם persistence דלוק: fork + copy-on-write בזמן BGSAVE דוחף את ה-RSS מעל הגבול וה-kernel הורג את Redis ב-OOM." },
    { en: "Using noeviction on a cache (writes start failing when full) or allkeys-lru on an instance that also holds queues/locks (your locks get evicted). Separate cache and state into different instances.", he: "noeviction על cache (כתיבות מתחילות להיכשל כשמתמלא) או allkeys-lru על instance שמחזיק גם תורים/locks (ה-locks שלכם נזרקים). מפרידים cache ו-state ל-instances שונים." },
    { en: "Treating a SET NX lock as a correctness guarantee for money or exactly-once work. Without fencing tokens, a paused client can act after its lock expired.", he: "להתייחס ל-lock של SET NX כאל הבטחת נכונות לכסף או לעבודת exactly-once. בלי fencing tokens, client שנתקע יכול לפעול אחרי שה-lock שלו כבר פג." }
  ],
  interview: [
    {
      q: { en: "Our Redis Cluster has 6 shards, but p99 latency spikes and only one shard is at 100% CPU. What's going on and how do you fix it?", he: "ל-Redis Cluster שלנו יש 6 shards, אבל ה-p99 latency קופץ ורק shard אחד ב-100% CPU. מה קורה ואיך מתקנים?" },
      a: { en: "Classic hot key (or hot hash tag): a key lives in exactly one slot, so one shard's single command thread is saturated no matter how many shards exist. Confirm with redis-cli --hotkeys (LFU policy) or MONITOR sampled briefly / client metrics, and check --bigkeys too — a big key read often also saturates the NIC. Fixes, cheapest first: an in-process L1 cache with a 1-5 s TTL in front of Redis (absorbs most reads); read from replicas for that key; split the key into N copies (key:{0..N-1}) and read a random one / write all; check for an overly broad hash tag like {global} that piles unrelated keys into one slot. Enabling io-threads helps only if the bottleneck is socket I/O, not command execution.", he: "Hot key קלאסי (או hash tag חם): key חי בדיוק ב-slot אחד, אז ה-thread היחיד של shard אחד רווי, לא משנה כמה shards יש. מאמתים עם redis-cli --hotkeys (עם LFU policy) או מטריקות client, ובודקים גם --bigkeys — קריאה של big key הרבה פעמים גם חונקת את ה-NIC. תיקונים, מהזול ליקר: L1 cache בתוך התהליך עם TTL של 1-5 שניות לפני Redis (סופג את רוב הקריאות); קריאה מ-replicas ל-key הזה; פיצול ה-key ל-N עותקים (key:{0..N-1}), קוראים אחד אקראי וכותבים לכולם; ולבדוק שאין hash tag רחב מדי כמו {global} שמערם keys לא קשורים על slot אחד. io-threads יעזור רק אם צוואר הבקבוק הוא socket I/O ולא ביצוע הפקודות." }
    },
    {
      q: { en: "Is Redis a good choice for a distributed lock that prevents charging a customer twice?", he: "האם Redis טוב בשביל distributed lock שמונע חיוב כפול של לקוח?" },
      a: { en: "Not on its own. SET key token NX PX gives a lease, but replication is async (a failover can lose the lock) and a client paused longer than the TTL can still act after another client acquired it. Redlock reduces the failover issue but still relies on bounded pauses and clock drift, as Kleppmann's critique argues. For correctness I'd make the side effect itself safe: an idempotency key with a unique constraint in the payment DB, or a fencing token the payment service checks (reject token &lt;= last seen). Redis locks remain great for efficiency — avoiding duplicate cron runs or cache rebuilds — where an occasional double execution is harmless.", he: "לא לבד. SET key token NX PX נותן lease, אבל ה-replication אסינכרוני (failover יכול לאבד את ה-lock) ו-client שנתקע יותר מה-TTL עדיין יכול לפעול אחרי ש-client אחר לקח את ה-lock. Redlock מקטין את בעיית ה-failover אבל עדיין נשען על עצירות חסומות בזמן ועל clock drift, כמו שהביקורת של Kleppmann טוענת. בשביל נכונות הייתי הופך את ה-side effect עצמו לבטוח: idempotency key עם unique constraint ב-DB של התשלומים, או fencing token שהשירות בודק (דוחה token &lt;= האחרון שראה). Locks של Redis מצוינים ליעילות — למנוע הרצה כפולה של cron או בנייה כפולה של cache — כשהרצה כפולה מדי פעם לא מזיקה." }
    },
    {
      q: { en: "When would you choose MemoryDB (or Redis with AOF always) over ElastiCache, and what do you pay?", he: "מתי תבחר ב-MemoryDB (או Redis עם AOF always) על פני ElastiCache, ומה המחיר?" },
      a: { en: "When Redis is the system of record — session state you can't rebuild, a leaderboard or counter that is the source of truth, a stream used as a queue — and losing acknowledged writes on failover is unacceptable. MemoryDB commits writes to a multi-AZ durable log before acking, so write latency rises from sub-ms to single-digit ms and cost is higher; reads stay in-memory fast. If the data can be rebuilt from a database, ElastiCache/Valkey with async replication (or no persistence at all) is cheaper and faster, and you design for a cold cache instead.", he: "כש-Redis הוא ה-system of record — session state שאי אפשר לבנות מחדש, leaderboard או counter שהם מקור האמת, stream שמשמש כתור — ואיבוד כתיבות שקיבלו ack ב-failover לא מקובל. MemoryDB מבצע commit לכתיבות ב-log עמיד multi-AZ לפני ה-ack, אז ה-write latency עולה מתת-מילישנייה לכמה מילישניות והעלות גבוהה יותר; הקריאות נשארות מהירות מהזיכרון. אם אפשר לבנות את הדאטה מחדש מ-DB, ElastiCache/Valkey עם replication אסינכרוני (או בלי persistence בכלל) זול ומהיר יותר, ומתכננים ל-cache קר במקום." }
    }
  ],
  quiz: [
    {
      q: { en: "How many hash slots does Redis Cluster use, and what does a hash tag do?", he: "כמה hash slots יש ב-Redis Cluster, ומה עושה hash tag?" },
      options: [
        { en: "1024 slots; a hash tag sets the key's TTL", he: "1024 slots; hash tag קובע את ה-TTL של ה-key" },
        { en: "16384 slots; only the substring inside {} is hashed, so related keys share a slot", he: "16384 slots; רק החלק שבתוך {} עובר hash, אז keys קשורים חולקים slot" },
        { en: "65536 slots; a hash tag pins a key to a replica", he: "65536 slots; hash tag מצמיד key ל-replica" },
        { en: "It uses a consistent hash ring, not slots", he: "הוא משתמש ב-consistent hash ring, לא ב-slots" }
      ],
      answer: 1,
      explain: { en: "slot = CRC16(key) mod 16384. With {user42} only 'user42' is hashed, enabling multi-key commands across those keys — at the risk of hot slots if overused.", he: "slot = CRC16(key) mod 16384. עם {user42} רק 'user42' עובר hash, מה שמאפשר פקודות multi-key על ה-keys האלה — עם סיכון ל-slots חמים אם מגזימים." }
    },
    {
      q: { en: "A pure-cache Redis hits maxmemory and writes start failing with OOM errors. Most likely cause?", he: "Redis שמשמש כ-cache טהור מגיע ל-maxmemory וכתיבות מתחילות להיכשל עם OOM. הסיבה הסבירה?" },
      options: [
        { en: "maxmemory-samples is too low", he: "maxmemory-samples נמוך מדי" },
        { en: "The policy is noeviction (or volatile-* while most keys have no TTL)", he: "ה-policy הוא noeviction (או volatile-* כשלרוב ה-keys אין TTL)" },
        { en: "AOF is set to everysec", he: "AOF מוגדר ל-everysec" },
        { en: "io-threads is disabled", he: "io-threads כבוי" }
      ],
      answer: 1,
      explain: { en: "noeviction refuses writes at the limit; volatile-* policies can only evict keys with a TTL, so with no candidates they behave like noeviction. A cache wants allkeys-lru or allkeys-lfu.", he: "noeviction מסרב לכתיבות בגבול; policies של volatile-* יכולים לזרוק רק keys עם TTL, אז כשאין מועמדים הם מתנהגים כמו noeviction. cache צריך allkeys-lru או allkeys-lfu." }
    },
    {
      q: { en: "Why is Redis's LRU called 'approximated'?", he: "למה ה-LRU של Redis נקרא 'מקורב'?" },
      options: [
        { en: "It evicts random keys", he: "הוא זורק keys אקראיים" },
        { en: "It samples a few keys (maxmemory-samples, default 5) and evicts the oldest among them instead of keeping a global list", he: "הוא דוגם כמה keys (maxmemory-samples, ברירת מחדל 5) וזורק את הישן מביניהם במקום להחזיק רשימה גלובלית" },
        { en: "Clocks across replicas drift", he: "השעונים בין replicas זזים" },
        { en: "It only tracks keys with a TTL", he: "הוא עוקב רק אחרי keys עם TTL" }
      ],
      answer: 1,
      explain: { en: "A global doubly-linked list costs memory and pointer updates on every access. Sampling with a small eviction pool gets very close to true LRU; raising samples to 10 gets closer at some CPU cost.", he: "רשימה מקושרת דו-כיוונית גלובלית עולה זיכרון ועדכוני pointers בכל גישה. דגימה עם pool קטן מתקרבת מאוד ל-LRU אמיתי; העלאה ל-10 מתקרבת עוד, במחיר CPU." }
    },
    {
      q: { en: "You need consumers to process every event even if one crashes mid-way. Which Redis feature fits?", he: "צריך שה-consumers יעבדו כל event גם אם אחד קורס באמצע. איזה פיצ'ר של Redis מתאים?" },
      options: [
        { en: "Pub/Sub", he: "Pub/Sub" },
        { en: "A HyperLogLog", he: "HyperLogLog" },
        { en: "Streams with consumer groups, XACK and XAUTOCLAIM", he: "Streams עם consumer groups, XACK ו-XAUTOCLAIM" },
        { en: "Keyspace notifications", he: "Keyspace notifications" }
      ],
      answer: 2,
      explain: { en: "Streams persist entries and track unacknowledged ones per consumer group; a crashed consumer's pending messages can be claimed by another. Pub/Sub and keyspace notifications are fire-and-forget.", he: "Streams שומרים entries ועוקבים אחרי אלה שלא קיבלו ack לכל consumer group; הודעות pending של consumer שקרס אפשר להעביר לאחר. Pub/Sub ו-keyspace notifications הם fire-and-forget." }
    }
  ],
  related: ["arch-caching", "caching-deep", "infra-data-structures", "db-replication", "db-sharding"]
});

// ---------------------------------------------------------------------------
// Lesson: Caching in depth
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "caching-deep",
  track: "architecture",
  order: 20,
  icon: "🧊",
  level: 3,
  minutes: 18,
  title: { en: "Caching in Depth: Algorithms, Invalidation & Consistency", he: "Caching לעומק: אלגוריתמים, invalidation ועקביות" },
  tldr: {
    en: "A senior cache design answers four questions — who loads it, what gets evicted, how it's invalidated, and what happens when a hot key expires — and proves the answer with hit-ratio math.",
    he: "תכנון cache ברמת senior עונה על ארבע שאלות — מי טוען, מה נזרק, איך עושים invalidation, ומה קורה כש-hot key פג — ומוכיח את התשובה עם המתמטיקה של hit ratio."
  },
  analogy: {
    en: "Think of a restaurant kitchen's prep station. Cache-aside is the chef fetching from the walk-in fridge only when an order needs it; write-through is restocking the station every time the fridge is restocked; refresh-ahead is the sous-chef topping up the tomatoes before they run out. The eviction algorithm is how the chef decides what leaves the tiny counter, and a stampede is twenty waiters all running to the fridge for the same sauce at once.",
    he: "תחשבו על עמדת ההכנה במטבח של מסעדה. Cache-aside זה השף שהולך למקרר הגדול רק כשהזמנה צריכה משהו; write-through זה למלא את העמדה בכל פעם שממלאים את המקרר; refresh-ahead זה הסו-שף שממלא עגבניות לפני שנגמרות. אלגוריתם ה-eviction זה איך השף מחליט מה יורד מהדלפק הקטן, ו-stampede זה עשרים מלצרים שרצים למקרר לאותו רוטב באותו רגע."
  },
  sections: [
    {
      h: { en: "Five loading patterns and when each wins", he: "חמש תבניות טעינה ומתי כל אחת מנצחת" },
      body: {
        en: `<p>The <em>Caching: Patterns, Eviction &amp; Stampedes</em> lesson covered cache-aside, write-through and write-back. Here's the full set, with the trade-off that actually decides:</p>
<table>
<tr><th>Pattern</th><th>Read path</th><th>Write path</th><th>Wins when</th><th>Bites when</th></tr>
<tr><td>Cache-aside</td><td>App checks cache, on miss loads DB &amp; fills</td><td>App writes DB, deletes key</td><td>General purpose; cache outage is survivable</td><td>Every miss pays full latency; race conditions (below)</td></tr>
<tr><td>Read-through</td><td>Cache library loads on miss (loader function)</td><td>Same as cache-aside</td><td>You want one place for loading + coalescing (Caffeine <code>LoadingCache</code>)</td><td>Loader becomes a hidden dependency</td></tr>
<tr><td>Write-through</td><td>Always warm</td><td>Write cache + DB synchronously</td><td>Read-after-write must be fresh, read-heavy</td><td>Slower writes; caches cold data nobody reads</td></tr>
<tr><td>Write-behind</td><td>Always warm</td><td>Write cache, flush DB async in batches</td><td>Counters, view counts, metrics — coalesce 1000 increments into 1 write</td><td>Cache node loss = data loss; ordering issues</td></tr>
<tr><td>Refresh-ahead</td><td>Serve cached, refresh in background before expiry</td><td>—</td><td>Hot keys with expensive loads (config, pricing tables)</td><td>Refreshes things nobody will ask for again</td></tr>
</table>
<p>Caffeine's <code>refreshAfterWrite(1m)</code> + <code>expireAfterWrite(10m)</code> is refresh-ahead done right: after 1 minute the next read returns the old value <em>and</em> triggers one async reload; after 10 minutes untouched, the entry is gone.</p>`,
        he: `<p>השיעור <em>Caching: Patterns, Eviction &amp; Stampedes</em> כיסה cache-aside, write-through ו-write-back. הנה הסט המלא, עם ה-trade-off שבאמת מכריע:</p>
<table>
<tr><th>תבנית</th><th>מסלול קריאה</th><th>מסלול כתיבה</th><th>מנצחת כש...</th><th>נושכת כש...</th></tr>
<tr><td>Cache-aside</td><td>האפליקציה בודקת cache, ב-miss טוענת מה-DB וממלאת</td><td>האפליקציה כותבת ל-DB ומוחקת את ה-key</td><td>שימוש כללי; אפשר לשרוד נפילה של ה-cache</td><td>כל miss משלם latency מלא; race conditions (בהמשך)</td></tr>
<tr><td>Read-through</td><td>ספריית ה-cache טוענת ב-miss (loader function)</td><td>כמו cache-aside</td><td>רוצים מקום אחד לטעינה ול-coalescing (Caffeine <code>LoadingCache</code>)</td><td>ה-loader הופך לתלות חבויה</td></tr>
<tr><td>Write-through</td><td>תמיד חם</td><td>כותבים ל-cache ול-DB בסנכרון</td><td>read-after-write חייב להיות טרי, הרבה קריאות</td><td>כתיבות איטיות; שומרים ב-cache דאטה קר שאף אחד לא קורא</td></tr>
<tr><td>Write-behind</td><td>תמיד חם</td><td>כותבים ל-cache, flush ל-DB אסינכרוני באצ'ים</td><td>Counters, צפיות, מטריקות — לאחד 1000 increments לכתיבה אחת</td><td>נפילת node של cache = איבוד דאטה; בעיות סדר</td></tr>
<tr><td>Refresh-ahead</td><td>מגישים מה-cache, מרעננים ברקע לפני expiry</td><td>—</td><td>Hot keys עם טעינה יקרה (config, טבלאות מחירים)</td><td>מרעננים דברים שאף אחד לא יבקש שוב</td></tr>
</table>
<p>ב-Caffeine, <code>refreshAfterWrite(1m)</code> + <code>expireAfterWrite(10m)</code> זה refresh-ahead כמו שצריך: אחרי דקה, הקריאה הבאה מחזירה את הערך הישן <em>וגם</em> מפעילה reload אסינכרוני אחד; אחרי 10 דקות בלי נגיעה, ה-entry נעלם.</p>`
      }
    },
    {
      h: { en: "Eviction algorithms compared: FIFO, LRU, LFU, ARC, W-TinyLFU", he: "השוואת אלגוריתמי eviction: FIFO, LRU, LFU, ARC, W-TinyLFU" },
      body: {
        en: `<table>
<tr><th>Algorithm</th><th>Keeps</th><th>Wins</th><th>Loses</th><th>Where</th></tr>
<tr><td>FIFO</td><td>Newest inserted</td><td>Trivial, lock-friendly, no per-hit bookkeeping</td><td>Evicts a hot item just because it's old</td><td>Simple CDN/hardware caches; modern variants (S3-FIFO, SIEVE) close much of the gap</td></tr>
<tr><td>LRU</td><td>Most recently used</td><td>Recency-driven workloads (sessions, "recently viewed")</td><td><strong>Scans</strong>: one batch job reading 1M cold keys flushes the whole hot set</td><td>Redis <code>allkeys-lru</code>, memcached, most libraries</td></tr>
<tr><td>LFU</td><td>Most frequently used</td><td>Stable popularity (Zipf: top products, top configs)</td><td>Slow to adapt — yesterday's viral item stays forever without aging</td><td>Redis <code>allkeys-lfu</code> (with decay)</td></tr>
<tr><td>ARC</td><td>Adaptive split between recency list and frequency list, plus "ghost" lists of recently evicted keys</td><td>Self-tunes between LRU-like and LFU-like; scan-resistant</td><td>More metadata, more complex</td><td>ZFS (the "ARC" in <code>arcstat</code>)</td></tr>
<tr><td>W-TinyLFU</td><td>Small LRU "window" (~1%) + main segmented LRU, with an <strong>admission filter</strong>: a new item only enters if its estimated frequency (Count-Min Sketch, periodically halved) beats the victim's</td><td>Near-optimal hit ratio across mixed workloads; scan-resistant; tiny metadata</td><td>Library-level (in-process) only</td><td>Caffeine (Java), Ristretto (Go), many proxies</td></tr>
</table>
<p>The key idea senior engineers miss: <strong>eviction</strong> asks "who leaves?", <strong>admission</strong> asks "should this newcomer even get in?". Most one-hit-wonders should never displace a proven hot item — that's why TinyLFU beats pure LRU on real traces.</p>
<blockquote>💡 Real world: Try the <strong>Eviction playground</strong> on this page: run the same Zipf workload with a periodic scan through LRU, LFU and FIFO and watch LRU's hit ratio crater during the scan while LFU barely moves.</blockquote>`,
        he: `<table>
<tr><th>אלגוריתם</th><th>שומר את</th><th>מנצח</th><th>מפסיד</th><th>איפה</th></tr>
<tr><td>FIFO</td><td>מה שנכנס אחרון</td><td>טריוויאלי, ידידותי ל-locks, אין הנהלת חשבונות בכל hit</td><td>זורק פריט חם רק כי הוא ותיק</td><td>Caches פשוטים ב-CDN/חומרה; וריאנטים מודרניים (S3-FIFO, SIEVE) סוגרים חלק גדול מהפער</td></tr>
<tr><td>LRU</td><td>מה שהשתמשו בו לאחרונה</td><td>Workloads של recency (sessions, "נצפו לאחרונה")</td><td><strong>Scans</strong>: batch job אחד שקורא 1M keys קרים מעיף את כל ה-hot set</td><td>Redis <code>allkeys-lru</code>, memcached, רוב הספריות</td></tr>
<tr><td>LFU</td><td>מה שהשתמשו בו הכי הרבה</td><td>פופולריות יציבה (Zipf: מוצרים מובילים, configs)</td><td>מסתגל לאט — הפריט הויראלי של אתמול נשאר לנצח בלי aging</td><td>Redis <code>allkeys-lfu</code> (עם decay)</td></tr>
<tr><td>ARC</td><td>חלוקה אדפטיבית בין רשימת recency לרשימת frequency, ועוד רשימות "רפאים" של keys שנזרקו לאחרונה</td><td>מכוונן את עצמו בין התנהגות LRU ל-LFU; עמיד ל-scans</td><td>יותר metadata, יותר מורכב</td><td>ZFS (ה-"ARC" ב-<code>arcstat</code>)</td></tr>
<tr><td>W-TinyLFU</td><td>"חלון" LRU קטן (~1%) + segmented LRU ראשי, עם <strong>admission filter</strong>: פריט חדש נכנס רק אם התדירות המשוערת שלו (Count-Min Sketch, שמתחלק בחצי מדי פעם) גבוהה מזו של הקורבן</td><td>Hit ratio כמעט אופטימלי על workloads מעורבים; עמיד ל-scans; metadata זעיר</td><td>רק ברמת ספרייה (in-process)</td><td>Caffeine (Java), Ristretto (Go), הרבה proxies</td></tr>
</table>
<p>הרעיון שהרבה מהנדסים מפספסים: <strong>eviction</strong> שואל "מי יוצא?", <strong>admission</strong> שואל "האם החדש בכלל צריך להיכנס?". רוב ה-one-hit-wonders לא אמורים לדחוק פריט חם מוכח — בגלל זה TinyLFU מנצח LRU טהור על traces אמיתיים.</p>
<blockquote>💡 מהשטח: נסו את ה-<strong>Eviction playground</strong> בעמוד הזה: מריצים אותו workload של Zipf עם scan תקופתי דרך LRU, LFU ו-FIFO ורואים את ה-hit ratio של LRU קורס בזמן ה-scan בזמן ש-LFU כמעט לא זז.</blockquote>`
      }
    },
    {
      h: { en: "Invalidation and the cache-aside race nobody tests", he: "Invalidation וה-race של cache-aside שאף אחד לא בודק" },
      body: {
        en: `<p>Three invalidation tools, usually combined: <strong>TTL</strong> (upper bound on staleness — always set one), <strong>explicit/event-driven</strong> (delete on write, or better: tail the DB's change log with CDC — Debezium reading the binlog/WAL — and delete keys from a consumer, so <em>every</em> write path invalidates, including manual SQL fixes and other services), and <strong>versioned keys</strong> (<code>product:v7:42</code>; bump the version and old entries age out — great for deploys that change the schema of cached values).</p>
<p><strong>The race</strong> (delete-after-write isn't enough):</p>
<pre>t1  Reader A: cache miss for user:42
t2  Reader A: SELECT ... → gets OLD row (v1)
t3  Writer B: UPDATE users ... (v2), COMMIT
t4  Writer B: DEL user:42
t5  Reader A: SET user:42 v1        ← stale value now cached until TTL</pre>
<p>It needs A's read to be slower than B's write+delete — rare per request, common at 50k req/s, and very common when the miss reads from a <strong>lagging read replica</strong>. Mitigations:</p>
<ul>
<li><strong>Short TTL</strong> as the safety net — the bug self-heals.</li>
<li><strong>Delayed double delete:</strong> delete, write DB, then delete again after ~(replica lag + typical read time), e.g. 500 ms via a delayed job.</li>
<li><strong>Versioned set:</strong> store a version/updated_at with the value and only overwrite if newer (Lua compare, or <code>SET</code> only when absent with leases as in Facebook's memcache).</li>
<li><strong>CDC-driven invalidation</strong> runs after commit and in commit order, which closes most of the window.</li>
</ul>
<p><strong>Negative caching:</strong> cache "not found" (a sentinel like <code>__NULL__</code>) for a short TTL (30-60 s) so a bot hammering non-existent IDs doesn't reach the DB (cache penetration). For huge ID spaces, put a <strong>Bloom filter</strong> of existing IDs in front.</p>`,
        he: `<p>שלושה כלים ל-invalidation, בדרך כלל ביחד: <strong>TTL</strong> (חסם עליון ל-staleness — תמיד מגדירים), <strong>מפורש/מבוסס events</strong> (מוחקים בכתיבה, או יותר טוב: עוקבים אחרי ה-change log של ה-DB עם CDC — Debezium שקורא את ה-binlog/WAL — ומוחקים keys מ-consumer, כך ש<em>כל</em> מסלול כתיבה עושה invalidation, כולל תיקוני SQL ידניים ושירותים אחרים), ו-<strong>versioned keys</strong> (<code>product:v7:42</code>; מעלים גרסה והישנים מתיישנים לבד — מעולה ל-deploys שמשנים את מבנה הערכים ב-cache).</p>
<p><strong>ה-race</strong> (delete-after-write לא מספיק):</p>
<pre>t1  Reader A: cache miss for user:42
t2  Reader A: SELECT ... → gets OLD row (v1)
t3  Writer B: UPDATE users ... (v2), COMMIT
t4  Writer B: DEL user:42
t5  Reader A: SET user:42 v1        ← stale value now cached until TTL</pre>
<p>זה דורש שהקריאה של A תהיה איטית יותר מהכתיבה+מחיקה של B — נדיר לבקשה בודדת, נפוץ ב-50k req/s, ונפוץ מאוד כשה-miss קורא מ-<strong>read replica עם lag</strong>. פתרונות:</p>
<ul>
<li><strong>TTL קצר</strong> כרשת ביטחון — הבאג מרפא את עצמו.</li>
<li><strong>Delayed double delete:</strong> מוחקים, כותבים ל-DB, ומוחקים שוב אחרי ~(replica lag + זמן קריאה טיפוסי), למשל 500 ms דרך delayed job.</li>
<li><strong>Versioned set:</strong> שומרים version/updated_at עם הערך ודורסים רק אם חדש יותר (השוואה ב-Lua, או <code>SET</code> רק כשאין ערך עם leases כמו ב-memcache של Facebook).</li>
<li><strong>Invalidation מבוסס CDC</strong> רץ אחרי ה-commit ובסדר ה-commits, מה שסוגר את רוב החלון.</li>
</ul>
<p><strong>Negative caching:</strong> שומרים ב-cache גם "לא נמצא" (sentinel כמו <code>__NULL__</code>) עם TTL קצר (30-60 שניות), כדי שבוט שמפציץ IDs שלא קיימים לא יגיע ל-DB (cache penetration). למרחבי IDs ענקיים, שמים <strong>Bloom filter</strong> של ה-IDs הקיימים לפני ה-cache.</p>`
      }
    },
    {
      h: { en: "Stampedes and hot keys: coalescing, XFetch, L1 + L2", he: "Stampedes ו-hot keys: coalescing, XFetch, L1 + L2" },
      body: {
        en: `<p>Building on the stampede basics in <em>Caching: Patterns, Eviction &amp; Stampedes</em>, here is how each defence actually behaves:</p>
<ul>
<li><strong>Request coalescing (singleflight):</strong> per process, concurrent misses for the same key share one in-flight load. 200 pods × 1 load each is still 200 DB queries — fine for most, not for a 2-second query.</li>
<li><strong>Distributed lock on refill:</strong> <code>SET rebuild:key 1 NX EX 10</code>; the winner rebuilds, losers serve stale (if you kept it) or sleep 50 ms and retry. Cluster-wide one-load, at the cost of a Redis round-trip.</li>
<li><strong>Probabilistic early expiration (XFetch):</strong> refresh early if <code>now - delta * beta * ln(rand()) &gt;= expiry</code>, where delta = how long the recompute took. Expensive keys refresh earlier, and only a few lucky readers do it — no coordination needed.</li>
<li><strong>TTL jitter:</strong> <code>ttl = base * (0.9 + 0.2*rand())</code> spreads keys written together (warm-up, deploy) so they don't expire together.</li>
<li><strong>Serve stale:</strong> keep a "soft TTL" inside the value and a longer hard TTL on the key; past soft TTL, return stale and refresh in background. Same idea as HTTP <code>stale-while-revalidate</code>.</li>
</ul>
<p><strong>Hot keys: two-tier caching.</strong> An in-process L1 (Caffeine/Ristretto, 1-5 s TTL, a few thousand entries) in front of Redis L2. A key read 100k times/s across 50 pods becomes ~50 Redis reads per TTL window. Consistency cost: pods may disagree for up to the L1 TTL. Tighten it with Redis <strong>client-side caching</strong> (<code>CLIENT TRACKING ON</code>, Redis 6+), where the server pushes invalidation messages for keys a client has cached, or with a Pub/Sub invalidation broadcast.</p>`,
        he: `<p>בהמשך ליסודות של stampede ב-<em>Caching: Patterns, Eviction &amp; Stampedes</em>, הנה איך כל הגנה באמת מתנהגת:</p>
<ul>
<li><strong>Request coalescing (singleflight):</strong> בתוך תהליך, misses מקבילים לאותו key חולקים טעינה אחת. 200 pods × טעינה אחת = עדיין 200 queries ל-DB — בסדר לרוב המקרים, לא ל-query של 2 שניות.</li>
<li><strong>Distributed lock על המילוי:</strong> <code>SET rebuild:key 1 NX EX 10</code>; המנצח בונה מחדש, המפסידים מגישים stale (אם שמרתם) או ישנים 50 ms ומנסים שוב. טעינה אחת לכל ה-cluster, במחיר round-trip ל-Redis.</li>
<li><strong>Probabilistic early expiration (XFetch):</strong> מרעננים מוקדם אם <code>now - delta * beta * ln(rand()) &gt;= expiry</code>, כש-delta = כמה זמן לקח החישוב. keys יקרים מתרעננים מוקדם יותר, ורק כמה קוראים "בני מזל" עושים את זה — בלי תיאום.</li>
<li><strong>TTL jitter:</strong> <code>ttl = base * (0.9 + 0.2*rand())</code> מפזר keys שנכתבו יחד (warm-up, deploy) כדי שלא יפוגו יחד.</li>
<li><strong>Serve stale:</strong> שומרים "soft TTL" בתוך הערך ו-hard TTL ארוך יותר על ה-key; אחרי ה-soft TTL מחזירים stale ומרעננים ברקע. אותו רעיון כמו <code>stale-while-revalidate</code> ב-HTTP.</li>
</ul>
<p><strong>Hot keys: caching בשתי שכבות.</strong> L1 בתוך התהליך (Caffeine/Ristretto, TTL של 1-5 שניות, כמה אלפי entries) לפני Redis כ-L2. key שנקרא 100k פעמים בשנייה על פני 50 pods הופך ל-~50 קריאות ל-Redis לכל חלון TTL. המחיר בעקביות: pods יכולים לא להסכים עד ה-TTL של ה-L1. מהדקים את זה עם <strong>client-side caching</strong> של Redis (<code>CLIENT TRACKING ON</code>, מ-Redis 6), שבו השרת דוחף הודעות invalidation על keys שה-client שמר, או עם broadcast של invalidation ב-Pub/Sub.</p>`
      }
    },
    {
      h: { en: "HTTP and CDN caching: the headers that matter", he: "Caching ב-HTTP וב-CDN: ה-headers שחשובים" },
      body: {
        en: `<table>
<tr><th>Directive / header</th><th>Meaning</th></tr>
<tr><td><code>max-age=60</code></td><td>Any cache (browser, CDN) may reuse for 60 s</td></tr>
<tr><td><code>s-maxage=600</code></td><td>Overrides max-age for <em>shared</em> caches (CDN, proxies) only — short in browser, long at edge</td></tr>
<tr><td><code>no-cache</code></td><td>May store, but must revalidate before every use (not "don't cache"!)</td></tr>
<tr><td><code>no-store</code></td><td>Never store — for truly sensitive responses</td></tr>
<tr><td><code>private</code></td><td>Browser only, never a CDN — anything personalised</td></tr>
<tr><td><code>stale-while-revalidate=30</code></td><td>Serve stale up to 30 s past expiry while refreshing in background</td></tr>
<tr><td><code>stale-if-error=86400</code></td><td>Serve stale if origin returns 5xx — free resilience</td></tr>
<tr><td><code>immutable</code></td><td>Never revalidate — for fingerprinted assets (<code>app.3f9a1c.js</code>)</td></tr>
<tr><td><code>ETag</code> + <code>If-None-Match</code></td><td>Conditional request; unchanged → <code>304 Not Modified</code>, no body</td></tr>
<tr><td><code>Vary: Accept-Encoding</code></td><td>Part of the cache key; <code>Vary: Cookie</code> or <code>User-Agent</code> destroys hit ratio</td></tr>
</table>
<pre>Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=30, stale-if-error=86400</pre>
<p>Typical recipe: hashed static assets <code>max-age=31536000, immutable</code>; HTML <code>no-cache</code> with ETag; public API GETs a short <code>s-maxage</code> with SWR; personalised responses <code>private</code>. Purge by tag (surrogate keys on Fastly, cache tags on Cloudflare) instead of by URL, or version the URL.</p>
<p><strong>Sizing with hit-ratio math.</strong> Popularity is usually Zipf-like, so a cache holding a small fraction of items gets most of the hits — but returns diminish. Think in <em>miss ratio</em>: DB load = request rate × miss ratio. 98% → 99% hit ratio halves DB load. Memory ≈ keys × (avg value + per-key overhead, roughly 50-100 bytes in Redis). Measure the curve: replay a day of keys through a simulator at several sizes, or watch <code>keyspace_misses</code> and <code>evicted_keys</code> as you grow <code>maxmemory</code>.</p>`,
        he: `<table>
<tr><th>Directive / header</th><th>משמעות</th></tr>
<tr><td><code>max-age=60</code></td><td>כל cache (דפדפן, CDN) יכול להשתמש מחדש 60 שניות</td></tr>
<tr><td><code>s-maxage=600</code></td><td>דורס את max-age רק ל-caches <em>משותפים</em> (CDN, proxies) — קצר בדפדפן, ארוך ב-edge</td></tr>
<tr><td><code>no-cache</code></td><td>מותר לשמור, אבל חובה לעשות revalidate לפני כל שימוש (לא "אל תעשה cache"!)</td></tr>
<tr><td><code>no-store</code></td><td>לעולם לא לשמור — לתשובות רגישות באמת</td></tr>
<tr><td><code>private</code></td><td>רק בדפדפן, אף פעם לא ב-CDN — כל דבר מותאם אישית</td></tr>
<tr><td><code>stale-while-revalidate=30</code></td><td>מגישים stale עד 30 שניות אחרי התפוגה ומרעננים ברקע</td></tr>
<tr><td><code>stale-if-error=86400</code></td><td>מגישים stale אם ה-origin מחזיר 5xx — חוסן בחינם</td></tr>
<tr><td><code>immutable</code></td><td>אף פעם לא לעשות revalidate — ל-assets עם fingerprint (<code>app.3f9a1c.js</code>)</td></tr>
<tr><td><code>ETag</code> + <code>If-None-Match</code></td><td>בקשה מותנית; לא השתנה → <code>304 Not Modified</code>, בלי body</td></tr>
<tr><td><code>Vary: Accept-Encoding</code></td><td>חלק מה-cache key; <code>Vary: Cookie</code> או <code>User-Agent</code> הורסים את ה-hit ratio</td></tr>
</table>
<pre>Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=30, stale-if-error=86400</pre>
<p>מתכון נפוץ: static assets עם hash ב-<code>max-age=31536000, immutable</code>; HTML ב-<code>no-cache</code> עם ETag; GET-ים של API ציבורי עם <code>s-maxage</code> קצר ו-SWR; תשובות אישיות ב-<code>private</code>. עושים purge לפי tag (surrogate keys ב-Fastly, cache tags ב-Cloudflare) במקום לפי URL, או משנים גרסה ב-URL.</p>
<p><strong>Sizing עם המתמטיקה של hit ratio.</strong> הפופולריות בדרך כלל בהתפלגות דמוית Zipf, אז cache שמחזיק אחוז קטן מהפריטים מקבל את רוב ה-hits — אבל עם תשואה פוחתת. תחשבו ב-<em>miss ratio</em>: עומס על ה-DB = קצב בקשות × miss ratio. מעבר מ-98% ל-99% hit ratio חוצה את העומס על ה-DB. זיכרון ≈ מספר keys × (גודל ערך ממוצע + overhead לכל key, בערך 50-100 bytes ב-Redis). מודדים את העקומה: מריצים יום של keys דרך סימולטור בכמה גדלים, או עוקבים אחרי <code>keyspace_misses</code> ו-<code>evicted_keys</code> תוך כדי הגדלת <code>maxmemory</code>.</p>`
      }
    }
  ],
  diagram: `          request
             │
   ┌─────────▼─────────┐  hit (~100 ns)
   │ L1 in-process     │──────────────► response      W-TinyLFU, TTL 1-5 s
   │ (Caffeine)        │
   └─────────┬─────────┘ miss
   ┌─────────▼─────────┐  hit (~0.5-1 ms)
   │ L2 Redis/Valkey   │──────────────► fill L1 → response
   └─────────┬─────────┘ miss
     singleflight / SET lock NX ── losers: serve stale or wait
   ┌─────────▼─────────┐  (~5-50 ms)
   │ Database          │──► SET key val EX ttl±jitter → fill L1
   └─────────┬─────────┘
             │ commit
   binlog/WAL ─► CDC (Debezium) ─► invalidator ─► DEL key (L2) + pub/sub "evict" (L1s)`,
  handsOn: [
    { cmd: "curl -sI https://www.cloudflare.com/ | grep -iE 'cache-control|age|etag|cf-cache-status|vary'", what: { en: "Inspect real CDN caching headers: Cache-Control, Age (seconds in cache) and the CDN's HIT/MISS status header.", he: "בודקים headers אמיתיים של CDN: Cache-Control, Age (כמה שניות ב-cache) ו-header ה-HIT/MISS של ה-CDN." } },
    { cmd: "ETAG=$(curl -sI https://developer.mozilla.org/en-US/ | grep -i '^etag' | cut -d' ' -f2 | tr -d '\\r'); curl -sI -H \"If-None-Match: $ETAG\" https://developer.mozilla.org/en-US/ | head -1", what: { en: "Revalidate with the ETag you just got; a 304 Not Modified means no body was sent (if the site doesn't return an ETag, try another URL).", he: "עושים revalidate עם ה-ETag שקיבלתם; 304 Not Modified אומר שלא נשלח body (אם האתר לא מחזיר ETag, נסו URL אחר)." } },
    { cmd: "redis-cli INFO stats | grep -E 'keyspace_(hits|misses)|evicted_keys|expired_keys'", what: { en: "Compute your real hit ratio = hits / (hits + misses), and check if evictions are eating the working set.", he: "מחשבים hit ratio אמיתי = hits / (hits + misses), ובודקים אם ה-evictions אוכלים את ה-working set." } },
    { cmd: "redis-cli SET rebuild:home 1 NX EX 10 ; redis-cli SET rebuild:home 1 NX EX 10", what: { en: "The stampede lock: the first call returns OK (you rebuild), the second returns (nil) (you serve stale or wait).", he: "ה-lock נגד stampede: הקריאה הראשונה מחזירה OK (אתם בונים מחדש), השנייה מחזירה (nil) (מגישים stale או מחכים)." } },
    { cmd: "redis-cli -3   # then type: CLIENT TRACKING ON, GET user:42  -- and in a 2nd shell: redis-cli SET user:42 x", what: { en: "RESP3 client-side caching: after tracking is on, modifying a key you read pushes an 'invalidate' message to your connection.", he: "Client-side caching עם RESP3: אחרי שמדליקים tracking, שינוי של key שקראתם דוחף הודעת 'invalidate' לחיבור שלכם." } }
  ],
  mnemonic: {
    en: "\"Load, Leave, Lie, Line\": who LOADS it (pattern), who LEAVES (eviction + admission), how long can it LIE (TTL/invalidation/race), and what happens when everyone LINES up on one key (stampede/hot key).",
    he: "\"טוען, יוצא, משקר, תור\": מי טוען (תבנית), מי יוצא (eviction + admission), כמה זמן מותר לו לשקר (TTL/invalidation/race), ומה קורה כשכולם עומדים בתור על key אחד (stampede/hot key)."
  },
  pitfalls: [
    { en: "Assuming 'delete the key after the DB write' guarantees freshness — a slow concurrent reader (especially reading a lagging replica) can re-populate the old value. Keep a TTL, consider delayed double delete or CDC.", he: "להניח ש'מוחקים את ה-key אחרי הכתיבה ל-DB' מבטיח טריות — קורא מקביל איטי (במיוחד מ-replica עם lag) יכול למלא מחדש את הערך הישן. תמיד TTL, ולשקול delayed double delete או CDC." },
    { en: "Using plain LRU in front of workloads with periodic scans (nightly exports, crawlers) — the scan evicts the entire hot set every night. Use LFU / W-TinyLFU or bypass the cache for batch reads.", he: "LRU פשוט מול workloads עם scans תקופתיים (exports לילי, crawlers) — ה-scan מעיף את כל ה-hot set כל לילה. LFU / W-TinyLFU או לעקוף את ה-cache בקריאות batch." },
    { en: "Writing Cache-Control: no-cache believing it disables caching (it means 'revalidate'), or forgetting private on personalised responses — a CDN then serves user A's page to user B.", he: "לכתוב Cache-Control: no-cache במחשבה שזה מבטל caching (זה אומר 'revalidate'), או לשכוח private בתשובות אישיות — ואז ה-CDN מגיש את הדף של משתמש A למשתמש B." },
    { en: "Adding an L1 cache with no invalidation story and a long TTL — 50 pods now disagree for minutes, and users see values flip between refreshes.", he: "להוסיף L1 cache בלי סיפור invalidation ועם TTL ארוך — 50 pods לא מסכימים ביניהם במשך דקות, והמשתמשים רואים ערכים מתהפכים בין רענון לרענון." }
  ],
  interview: [
    {
      q: { en: "A product price changes, but some users see the old price for up to an hour even though we delete the cache key on update. Walk me through possible causes and fixes.", he: "מחיר של מוצר משתנה, אבל חלק מהמשתמשים רואים את המחיר הישן עד שעה, למרות שאנחנו מוחקים את ה-key בעדכון. תעביר אותי על סיבות אפשריות ותיקונים." },
      a: { en: "One hour smells like the TTL, so something re-populated stale data after the delete. Candidates: (1) the cache-aside race — a reader loaded the old row before the commit and SET it after our DEL; very likely if misses read from a lagging replica. (2) Another write path (admin tool, batch job, other service) updates the DB without invalidating. (3) Layers beyond Redis: an in-process L1 or a CDN/browser caching the API response with max-age=3600. (4) Key mismatch — the writer deletes product:42 but readers use product:v2:42. Fixes: invalidate from CDC on the price table so every write path is covered; delayed double delete or version-checked SET for the race; read misses from the primary for price data; short TTL on price (60 s) and on L1; CDN purge by surrogate key or private/short s-maxage for prices. And add a metric: sample cached vs DB values to detect staleness.", he: "שעה מריחה כמו ה-TTL, אז משהו מילא מחדש דאטה ישן אחרי המחיקה. מועמדים: (1) ה-race של cache-aside — קורא טען את השורה הישנה לפני ה-commit ועשה SET אחרי ה-DEL שלנו; סביר מאוד אם ה-misses קוראים מ-replica עם lag. (2) מסלול כתיבה אחר (כלי admin, batch job, שירות אחר) מעדכן את ה-DB בלי invalidation. (3) שכבות מעבר ל-Redis: L1 בתוך התהליך, או CDN/דפדפן ששומרים את תשובת ה-API עם max-age=3600. (4) אי-התאמה ב-key — הכותב מוחק product:42 והקוראים משתמשים ב-product:v2:42. תיקונים: invalidation מ-CDC על טבלת המחירים כדי לכסות כל מסלול כתיבה; delayed double delete או SET עם בדיקת גרסה בשביל ה-race; misses של מחיר קוראים מה-primary; TTL קצר למחיר (60 שניות) ול-L1; purge ב-CDN לפי surrogate key או private/s-maxage קצר למחירים. ולהוסיף מטריקה: לדגום ערכים מה-cache מול ה-DB כדי לזהות staleness." }
    },
    {
      q: { en: "Why does Caffeine (W-TinyLFU) usually beat LRU, and when would LRU still be the better choice?", he: "למה Caffeine (W-TinyLFU) בדרך כלל מנצח LRU, ומתי LRU עדיין עדיף?" },
      a: { en: "LRU admits everything and evicts by recency, so one-hit-wonders and scans push out genuinely popular items. W-TinyLFU adds an admission decision: a newcomer only replaces the main-region victim if its estimated frequency (from a compact Count-Min Sketch with periodic halving for aging) is higher. The small LRU window still lets new bursts prove themselves. On real traces — databases, search, web — this gets close to optimal with a few bytes of metadata per entry. LRU is still fine or better when access is purely recency-driven (a user's last N items, session data where the newest is always the hottest), when you need the simplest possible distributed behaviour (Redis allkeys-lru), or when the cache is so large relative to the working set that the algorithm barely matters.", he: "LRU מכניס הכול וזורק לפי recency, אז one-hit-wonders ו-scans דוחקים החוצה פריטים פופולריים באמת. W-TinyLFU מוסיף החלטת admission: פריט חדש מחליף את הקורבן באזור הראשי רק אם התדירות המשוערת שלו (מ-Count-Min Sketch קומפקטי עם חלוקה בחצי מדי פעם בשביל aging) גבוהה יותר. ה-window הקטן של LRU עדיין נותן ל-bursts חדשים להוכיח את עצמם. על traces אמיתיים — DBs, חיפוש, web — זה מתקרב לאופטימום עם כמה bytes של metadata ל-entry. LRU עדיין בסדר או עדיף כשהגישה מונעת רק מ-recency (N הפריטים האחרונים של משתמש, sessions שבהם החדש הוא תמיד החם), כשצריך את ההתנהגות המבוזרת הכי פשוטה (Redis allkeys-lru), או כשה-cache כל כך גדול ביחס ל-working set שהאלגוריתם כמעט לא משנה." }
    }
  ],
  quiz: [
    {
      q: { en: "What does Cache-Control: no-cache actually mean?", he: "מה בעצם אומר Cache-Control: no-cache?" },
      options: [
        { en: "Never store the response anywhere", he: "לעולם לא לשמור את התשובה בשום מקום" },
        { en: "The response may be stored but must be revalidated with the origin before each use", he: "מותר לשמור את התשובה, אבל חובה לעשות revalidate מול ה-origin לפני כל שימוש" },
        { en: "Only CDNs may cache it", he: "רק CDNs יכולים לשמור אותה" },
        { en: "Cache for the default 60 seconds", he: "לשמור לברירת המחדל של 60 שניות" }
      ],
      answer: 1,
      explain: { en: "no-store means don't store. no-cache means store but revalidate (typically a cheap conditional request with ETag → 304).", he: "no-store אומר לא לשמור. no-cache אומר לשמור אבל לעשות revalidate (בדרך כלל בקשה מותנית זולה עם ETag → 304)." }
    },
    {
      q: { en: "A nightly job scans 5M cold records through the same cache as live traffic, and the hit ratio collapses every morning. Which change helps most?", he: "Job לילי סורק 5M רשומות קרות דרך אותו cache של התעבורה החיה, וה-hit ratio קורס כל בוקר. איזה שינוי יעזור הכי הרבה?" },
      options: [
        { en: "Switch from LFU to LRU", he: "לעבור מ-LFU ל-LRU" },
        { en: "Use an LFU / W-TinyLFU-style policy (or bypass the cache for the batch job)", he: "להשתמש ב-policy בסגנון LFU / W-TinyLFU (או לעקוף את ה-cache ב-batch job)" },
        { en: "Lower all TTLs", he: "להוריד את כל ה-TTLs" },
        { en: "Switch to write-through", he: "לעבור ל-write-through" }
      ],
      answer: 1,
      explain: { en: "This is the classic LRU scan problem. Frequency-aware admission/eviction keeps the proven hot set; skipping the cache for batch reads avoids polluting it at all.", he: "זו בעיית ה-scan הקלאסית של LRU. admission/eviction שמודעים לתדירות שומרים על ה-hot set המוכח; עקיפת ה-cache בקריאות batch מונעת זיהום מלכתחילה." }
    },
    {
      q: { en: "Your hit ratio goes from 98% to 99%. What happens to load on the database?", he: "ה-hit ratio עולה מ-98% ל-99%. מה קורה לעומס על ה-DB?" },
      options: [
        { en: "Drops by about 1%", he: "יורד בערך ב-1%" },
        { en: "Roughly halves, because the miss ratio goes from 2% to 1%", he: "יורד בערך בחצי, כי ה-miss ratio יורד מ-2% ל-1%" },
        { en: "Unchanged; only latency improves", he: "לא משתנה; רק ה-latency משתפר" },
        { en: "Increases due to more evictions", he: "עולה בגלל יותר evictions" }
      ],
      answer: 1,
      explain: { en: "DB load = requests × miss ratio. 2% → 1% misses is a 2x reduction — the reason the last percent of hit ratio is worth fighting for.", he: "עומס DB = בקשות × miss ratio. מעבר מ-2% ל-1% misses זה פי 2 פחות — בגלל זה שווה להילחם על האחוז האחרון של hit ratio." }
    },
    {
      q: { en: "Which stampede defence needs no coordination between servers?", he: "איזו הגנה מפני stampede לא דורשת תיאום בין שרתים?" },
      options: [
        { en: "A Redis SET NX rebuild lock", he: "Lock של SET NX ב-Redis לבנייה מחדש" },
        { en: "Probabilistic early expiration (XFetch)", he: "Probabilistic early expiration (XFetch)" },
        { en: "Memcache leases", he: "Leases של memcache" },
        { en: "A central refresh scheduler", he: "Scheduler מרכזי לרענון" }
      ],
      answer: 1,
      explain: { en: "Each reader independently decides, with probability rising as expiry approaches (weighted by recompute cost), to refresh early. A few readers refresh before expiry; no lock or server is involved.", he: "כל קורא מחליט בעצמו, בהסתברות שעולה ככל שמתקרבים ל-expiry (במשקל של עלות החישוב), אם לרענן מוקדם. כמה קוראים מרעננים לפני ה-expiry; בלי lock ובלי שרת מתאם." }
    }
  ],
  playground: "eviction",
  related: ["arch-caching", "redis-deep"]
});

// ---------------------------------------------------------------------------
// Lesson: Data structures inside real infrastructure
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "infra-data-structures",
  track: "data",
  order: 21,
  icon: "🧬",
  level: 3,
  minutes: 18,
  title: { en: "The Data Structures Inside Real Infrastructure", he: "מבני הנתונים שבתוך התשתית האמיתית" },
  tldr: {
    en: "Every database, cache, broker and router is a few classic data structures with a disk and a network attached — know which one, and you can predict its performance, failure modes and tuning knobs.",
    he: "כל database, cache, broker ו-router הם כמה מבני נתונים קלאסיים עם דיסק ורשת מחוברים — תדעו איזה מבנה יש בפנים, ותוכלו לחזות ביצועים, תקלות וכפתורי כיוונון."
  },
  analogy: {
    en: "A B-tree is a library with a strict shelf order — you walk straight to the book, but every new book means shuffling a shelf. An LSM tree is a mailroom: new letters go into an inbox (fast!), and at night clerks sort and merge the piles into the archive. A Bloom filter is the receptionist who can say 'definitely not here' instantly, but only 'probably here' otherwise.",
    he: "B-tree זה ספרייה עם סדר מדפים קפדני — הולכים ישר לספר, אבל כל ספר חדש אומר להזיז מדף. LSM tree זה חדר דואר: מכתבים חדשים נזרקים לתיבה (מהיר!), ובלילה פקידים ממיינים וממזגים את הערימות לארכיון. Bloom filter זה פקיד הקבלה שיכול להגיד מיד 'בטוח לא פה', אבל אחרת רק 'כנראה פה'."
  },
  sections: [
    {
      h: { en: "B-trees vs LSM trees: the storage engine split", he: "B-trees מול LSM trees: הפיצול הגדול של storage engines" },
      body: {
        en: `<p><strong>B+tree</strong> (Postgres indexes, MySQL InnoDB tables and indexes, SQLite, etcd's bbolt): fixed-size pages (8 KB in Postgres, 16 KB in InnoDB), high fan-out (hundreds of keys per page), so a billion rows is only 3-4 levels deep — 3-4 page reads per lookup, usually with the top levels cached in the buffer pool. Updates happen <em>in place</em>, which means random writes, page splits and a WAL to make it crash-safe.</p>
<p><strong>LSM tree</strong> (RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, the storage under many time-series and Kafka-adjacent systems): writes go to the WAL and an in-memory <em>memtable</em> (a skip list in RocksDB/LevelDB), which is flushed as an immutable sorted file (<strong>SSTable</strong>). Background <strong>compaction</strong> merges SSTables, drops overwritten values and expired <em>tombstones</em>.</p>
<table>
<tr><th></th><th>B-tree</th><th>LSM tree</th></tr>
<tr><td>Writes</td><td>Random, in place</td><td>Sequential appends — much higher ingest</td></tr>
<tr><td>Point reads</td><td>Predictable, few page reads</td><td>May check memtable + several SSTables (Bloom filters help)</td></tr>
<tr><td>Range scans</td><td>Excellent</td><td>Good after merge across levels</td></tr>
<tr><td>Hidden cost</td><td>Page splits, bloat, vacuum</td><td>Compaction CPU/IO, tombstones, stalls</td></tr>
</table>
<p><strong>The three amplifications</strong> (you can minimise at most two): <em>write amplification</em> (bytes written to disk ÷ bytes written by the app — leveled compaction can be 10-30x), <em>read amplification</em> (disk reads per query), <em>space amplification</em> (disk used ÷ live data — size-tiered compaction can temporarily need ~2x). Cassandra's <code>LeveledCompactionStrategy</code> favours reads and space; <code>SizeTieredCompactionStrategy</code> favours writes; <code>TimeWindowCompactionStrategy</code> is for TTL'd time-series.</p>
<blockquote>💡 Where you'll meet it: "Why is my Cassandra read latency spiking?" — too many SSTables per read (<code>nodetool tablehistograms</code>) or tombstone scans. Interview angle: "Design a write-heavy metrics store" → LSM; "OLTP with range queries and secondary indexes" → B-tree.</blockquote>`,
        he: `<p><strong>B+tree</strong> (indexes ב-Postgres, טבלאות ו-indexes ב-MySQL InnoDB, SQLite, bbolt של etcd): pages בגודל קבוע (8 KB ב-Postgres, 16 KB ב-InnoDB), fan-out גבוה (מאות keys ל-page), אז מיליארד שורות זה רק 3-4 רמות עומק — 3-4 קריאות page לחיפוש, ובדרך כלל הרמות העליונות כבר ב-buffer pool. העדכונים <em>במקום</em>, כלומר כתיבות אקראיות, page splits ו-WAL כדי לשרוד קריסה.</p>
<p><strong>LSM tree</strong> (RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, ה-storage מתחת להרבה מערכות time-series): כתיבות הולכות ל-WAL ול-<em>memtable</em> בזיכרון (skip list ב-RocksDB/LevelDB), שעושה flush לקובץ ממוין ובלתי ניתן לשינוי (<strong>SSTable</strong>). <strong>Compaction</strong> ברקע ממזג SSTables, זורק ערכים שנדרסו ו-<em>tombstones</em> שפג תוקפם.</p>
<table>
<tr><th></th><th>B-tree</th><th>LSM tree</th></tr>
<tr><td>כתיבות</td><td>אקראיות, במקום</td><td>Appends רציפים — ingest הרבה יותר גבוה</td></tr>
<tr><td>קריאת נקודה</td><td>צפויה, מעט קריאות page</td><td>אולי צריך לבדוק memtable + כמה SSTables (Bloom filters עוזרים)</td></tr>
<tr><td>Range scans</td><td>מצוין</td><td>טוב, אחרי merge בין הרמות</td></tr>
<tr><td>עלות חבויה</td><td>Page splits, bloat, vacuum</td><td>CPU/IO של compaction, tombstones, stalls</td></tr>
</table>
<p><strong>שלוש ההגברות</strong> (אפשר למזער לכל היותר שתיים): <em>write amplification</em> (bytes שנכתבו לדיסק ÷ bytes שהאפליקציה כתבה — leveled compaction יכול להגיע ל-10-30x), <em>read amplification</em> (קריאות דיסק לכל query), <em>space amplification</em> (דיסק בשימוש ÷ דאטה חי — size-tiered compaction יכול לדרוש זמנית ~2x). ב-Cassandra, <code>LeveledCompactionStrategy</code> מעדיף קריאות ומקום; <code>SizeTieredCompactionStrategy</code> מעדיף כתיבות; <code>TimeWindowCompactionStrategy</code> ל-time-series עם TTL.</p>
<blockquote>💡 איפה תפגשו את זה: "למה ה-read latency ב-Cassandra קופץ?" — יותר מדי SSTables לקריאה (<code>nodetool tablehistograms</code>) או סריקות של tombstones. בראיון: "תתכנן metrics store עם הרבה כתיבות" → LSM; "OLTP עם range queries ו-secondary indexes" → B-tree.</blockquote>`
      }
    },
    {
      h: { en: "Probabilistic structures: Bloom filter, HyperLogLog, Count-Min Sketch", he: "מבנים הסתברותיים: Bloom filter, HyperLogLog, Count-Min Sketch" },
      body: {
        en: `<p>Trade a tiny, <em>bounded</em> error for orders-of-magnitude less memory.</p>
<ul>
<li><strong>Bloom filter</strong> — "is X in the set?" Bit array of m bits, k hash functions; insert sets k bits, lookup checks them. <strong>No false negatives</strong>, false-positive rate ≈ <code>(1 - e^(-kn/m))^k</code>. Rule of thumb: ~10 bits per key with k≈7 → ~1% FPR; ~14.4 bits → 0.1%. Can't delete (use a counting Bloom or Cuckoo filter). <em>Where:</em> every Cassandra/HBase/RocksDB SSTable has one, so a point read skips files that definitely don't hold the key (Cassandra's <code>bloom_filter_fp_chance</code>); cache-penetration guards; Chrome's old Safe Browsing list; CDNs avoiding caching one-hit-wonders.</li>
<li><strong>HyperLogLog</strong> — "how many distinct?" Hash each item, track the maximum run of leading zeros per register; more distinct items → longer runs. Redis uses 16384 registers × 6 bits = 12 KB for ~0.81% standard error, for any cardinality. Mergeable: <code>PFMERGE</code> daily HLLs into a weekly one. <em>Where:</em> unique visitors, distinct IPs per minute, <code>approx_count_distinct</code> in BigQuery/Spark/Presto.</li>
<li><strong>Count-Min Sketch</strong> — "how often has X appeared?" A d × w grid of counters; each item increments one counter per row; estimate = the minimum across rows. <strong>Only overestimates</strong>; error ≤ εN with w = e/ε, confidence 1 - δ with d = ln(1/δ). Pair with a min-heap of size K for <strong>heavy hitters</strong> (top-K IPs, hot keys). <em>Where:</em> W-TinyLFU's frequency estimate in Caffeine, network telemetry, abuse detection.</li>
</ul>
<blockquote>💡 Interview angle: "Count unique users per day for 1B events" → HLL. "Find the top 100 IPs in a 10 Gbps stream" → Count-Min Sketch + heap (see the coding problem <em>Top K frequent IPs</em>). "Avoid disk reads for keys that don't exist" → Bloom filter. Always state the error bound and that the answer is approximate.</blockquote>`,
        he: `<p>מחליפים שגיאה זעירה ו<em>חסומה</em> בחיסכון של סדרי גודל בזיכרון.</p>
<ul>
<li><strong>Bloom filter</strong> — "האם X בקבוצה?" מערך של m ביטים ו-k פונקציות hash; הכנסה מדליקה k ביטים, בדיקה בודקת אותם. <strong>אין false negatives</strong>, שיעור false positives ≈ <code>(1 - e^(-kn/m))^k</code>. כלל אצבע: ~10 ביטים ל-key עם k≈7 → ~1% FPR; ~14.4 ביטים → 0.1%. אי אפשר למחוק (בשביל זה יש counting Bloom או Cuckoo filter). <em>איפה:</em> לכל SSTable ב-Cassandra/HBase/RocksDB יש אחד, כך שקריאת נקודה מדלגת על קבצים שבטוח לא מכילים את ה-key (<code>bloom_filter_fp_chance</code> ב-Cassandra); הגנה מ-cache penetration; רשימת ה-Safe Browsing הישנה של Chrome; CDNs שלא רוצים לשמור one-hit-wonders.</li>
<li><strong>HyperLogLog</strong> — "כמה ערכים שונים?" עושים hash לכל פריט ושומרים לכל register את הרצף הארוך ביותר של אפסים מובילים; יותר ערכים שונים → רצפים ארוכים יותר. Redis משתמש ב-16384 registers × 6 ביטים = 12 KB לשגיאת תקן של ~0.81%, לכל cardinality. אפשר למזג: <code>PFMERGE</code> של HLLs יומיים ל-HLL שבועי. <em>איפה:</em> unique visitors, כמות IPs שונים לדקה, <code>approx_count_distinct</code> ב-BigQuery/Spark/Presto.</li>
<li><strong>Count-Min Sketch</strong> — "כמה פעמים X הופיע?" טבלה של d × w counters; כל פריט מגדיל counter אחד בכל שורה; ההערכה = המינימום בין השורות. <strong>רק מעריך ביתר</strong>; שגיאה ≤ εN עם w = e/ε, ביטחון 1 - δ עם d = ln(1/δ). משלבים עם min-heap בגודל K בשביל <strong>heavy hitters</strong> (top-K IPs, hot keys). <em>איפה:</em> הערכת התדירות של W-TinyLFU ב-Caffeine, טלמטריית רשת, זיהוי abuse.</li>
</ul>
<blockquote>💡 בראיון: "לספור משתמשים ייחודיים ליום מתוך 1B events" → HLL. "למצוא את 100 ה-IPs המובילים ב-stream של 10 Gbps" → Count-Min Sketch + heap (ראו את בעיית הקוד <em>Top K frequent IPs</em>). "להימנע מקריאות דיסק ל-keys שלא קיימים" → Bloom filter. תמיד להגיד את חסם השגיאה ושהתשובה מקורבת.</blockquote>`
      }
    },
    {
      h: { en: "Skip lists and hash rings: ordering and placement", he: "Skip lists ו-hash rings: סדר ומיקום" },
      body: {
        en: `<p><strong>Skip list</strong> — a sorted linked list with "express lanes": each node is promoted to the next level with probability p (Redis uses 1/4, max 32 levels), giving O(log n) search, insert and delete <em>on average</em>, with simple code and cheap range iteration. <em>Where:</em> Redis sorted sets (skip list + hash table, so <code>ZSCORE</code> is O(1) and <code>ZRANGE</code> is O(log n + m)); memtables in LevelDB/RocksDB. Why not a balanced tree? Simpler to implement and reason about, easy rank/range queries, and concurrency-friendly variants exist.</p>
<p><strong>Hash ring (consistent hashing)</strong> — nodes and keys are hashed onto the same circle; a key belongs to the first node clockwise. Adding or removing a node moves only ~1/N of keys, versus nearly all of them with <code>hash(key) mod N</code>. <strong>Virtual nodes</strong> (many tokens per physical node) smooth out imbalance and let a bigger machine take more tokens. <em>Where:</em> the Dynamo paper, Cassandra (<code>num_tokens</code>), Riak, client-side memcached sharding (ketama), Envoy's <code>RING_HASH</code>/<code>MAGLEV</code> load balancing for sticky routing.</p>
<blockquote>⚠️ Contrast: Redis Cluster does <em>not</em> use a ring — it uses 16384 fixed hash slots assigned to nodes, which makes rebalancing explicit (move slots) and the routing table tiny. Interview angle: implement a ring with a sorted array of token hashes and binary search (the coding problem <em>Consistent hashing</em>), then discuss vnodes, replication to the next R distinct nodes, and hot-key limits.</blockquote>`,
        he: `<p><strong>Skip list</strong> — רשימה מקושרת ממוינת עם "נתיבים מהירים": כל node מקודם לרמה הבאה בהסתברות p (ב-Redis זה 1/4, מקסימום 32 רמות), מה שנותן חיפוש, הכנסה ומחיקה ב-O(log n) <em>בממוצע</em>, עם קוד פשוט ו-iteration זול על טווחים. <em>איפה:</em> sorted sets ב-Redis (skip list + hash table, אז <code>ZSCORE</code> הוא O(1) ו-<code>ZRANGE</code> הוא O(log n + m)); memtables ב-LevelDB/RocksDB. למה לא עץ מאוזן? פשוט יותר לממש ולהבין, קל לשאילתות rank/range, ויש גרסאות ידידותיות ל-concurrency.</p>
<p><strong>Hash ring (consistent hashing)</strong> — nodes ו-keys עוברים hash לאותו מעגל; key שייך ל-node הראשון בכיוון השעון. הוספה או הסרה של node מזיזה רק ~1/N מה-keys, לעומת כמעט את כולם עם <code>hash(key) mod N</code>. <strong>Virtual nodes</strong> (הרבה tokens לכל node פיזי) מחליקים חוסר איזון ומאפשרים למכונה גדולה לקחת יותר tokens. <em>איפה:</em> מאמר ה-Dynamo, Cassandra (<code>num_tokens</code>), Riak, sharding של memcached בצד ה-client (ketama), load balancing של <code>RING_HASH</code>/<code>MAGLEV</code> ב-Envoy לניתוב sticky.</p>
<blockquote>⚠️ הבדל חשוב: Redis Cluster <em>לא</em> משתמש ב-ring — הוא משתמש ב-16384 hash slots קבועים שמוקצים ל-nodes, מה שהופך rebalancing למפורש (מזיזים slots) ואת טבלת הניתוב לזעירה. בראיון: לממש ring עם מערך ממוין של hashes של tokens וחיפוש בינארי (בעיית הקוד <em>Consistent hashing</em>), ואז לדבר על vnodes, replication ל-R ה-nodes השונים הבאים, ומגבלות של hot keys.</blockquote>`
      }
    },
    {
      h: { en: "Merkle trees, tries and heaps", he: "Merkle trees, tries ו-heaps" },
      body: {
        en: `<ul>
<li><strong>Merkle tree</strong> — a tree of hashes: leaves hash data blocks, parents hash their children. Two replicas compare root hashes; if equal, they're identical; if not, descend only into differing subtrees — finding the divergent range in O(log n) comparisons instead of shipping all data. <em>Where:</em> anti-entropy repair in Cassandra (<code>nodetool repair</code> builds Merkle trees per token range) and Dynamo-style stores; git (commits → trees → blobs form a Merkle DAG, which is why a commit hash pins the whole snapshot); Certificate Transparency logs; ZFS block checksums; blockchains.</li>
<li><strong>Trie / radix tree</strong> — keys share prefixes along the path. The killer infra use is <strong>longest-prefix match</strong>: given 10.1.2.3, find the most specific route among 10.0.0.0/8, 10.1.0.0/16, 10.1.2.0/24. Linux's IPv4 FIB uses an LC-trie; routers use tries or TCAM hardware. Radix trees also index the Linux page cache (XArray) and Redis streams (<code>rax</code>). <em>Interview angle:</em> "Implement an IP allow-list / route lookup" → binary trie on address bits, O(32) for IPv4.</li>
<li><strong>Heap (priority queue)</strong> — O(1) peek at the min/max, O(log n) push/pop. <em>Where:</em> timers (Go's runtime uses a 4-ary heap of timers; the Kubernetes client-go delaying work queue keeps a heap ordered by ready time), schedulers picking the highest-priority job, Dijkstra in routing (OSPF SPF), merging K sorted log files, top-K with a size-K min-heap. Note: the Linux scheduler uses a red-black tree, not a heap — it also needs ordered removal of arbitrary tasks.</li>
</ul>
<pre>ip route get 10.1.2.3                   # kernel longest-prefix match in action
git cat-file -p HEAD^{tree} | head -5    # a Merkle tree node: entries with child hashes</pre>`,
        he: `<ul>
<li><strong>Merkle tree</strong> — עץ של hashes: העלים הם hash של בלוקי דאטה, ההורים hash של הילדים. שתי replicas משוות root hash; אם שווה, הן זהות; אם לא, יורדים רק לתתי-עצים שונים — מוצאים את הטווח השונה ב-O(log n) השוואות במקום לשלוח את כל הדאטה. <em>איפה:</em> anti-entropy repair ב-Cassandra (<code>nodetool repair</code> בונה Merkle trees לכל token range) ובמערכות בסגנון Dynamo; git (commits → trees → blobs יוצרים Merkle DAG, ובגלל זה hash של commit נועל את כל ה-snapshot); לוגים של Certificate Transparency; checksums של בלוקים ב-ZFS; blockchains.</li>
<li><strong>Trie / radix tree</strong> — keys חולקים prefixes לאורך המסלול. השימוש הקטלני בתשתית הוא <strong>longest-prefix match</strong>: בהינתן 10.1.2.3, למצוא את ה-route הכי ספציפי מבין 10.0.0.0/8, 10.1.0.0/16, 10.1.2.0/24. ה-FIB של IPv4 ב-Linux משתמש ב-LC-trie; routers משתמשים ב-tries או בחומרת TCAM. Radix trees גם מאנדקסים את ה-page cache של Linux (XArray) ואת ה-streams של Redis (<code>rax</code>). <em>בראיון:</em> "תממש IP allow-list / חיפוש route" → trie בינארי על ביטי הכתובת, O(32) ל-IPv4.</li>
<li><strong>Heap (priority queue)</strong> — הצצה למינימום/מקסימום ב-O(1), push/pop ב-O(log n). <em>איפה:</em> timers (ה-runtime של Go משתמש ב-heap 4-ארי של timers; ה-delaying work queue של client-go ב-Kubernetes מחזיק heap לפי זמן מוכנות), schedulers שבוחרים את ה-job עם העדיפות הגבוהה, Dijkstra בניתוב (SPF של OSPF), מיזוג K קבצי לוג ממוינים, top-K עם min-heap בגודל K. שימו לב: ה-scheduler של Linux משתמש ב-red-black tree, לא ב-heap — הוא צריך גם הסרה מסודרת של tasks שרירותיים.</li>
</ul>
<pre>ip route get 10.1.2.3                   # kernel longest-prefix match in action
git cat-file -p HEAD^{tree} | head -5    # a Merkle tree node: entries with child hashes</pre>`
      }
    },
    {
      h: { en: "The append-only log: the structure under everything", he: "ה-log מסוג append-only: המבנה שמתחת להכול" },
      body: {
        en: `<p>Sequential appends are the fastest thing a disk (and even an SSD) does, and an ordered log is the simplest source of truth to replicate. So almost every system has one:</p>
<table>
<tr><th>System</th><th>Log</th><th>Structure beside it</th></tr>
<tr><td>Postgres / MySQL</td><td>WAL / redo log — write here first, fsync, then change pages lazily</td><td>B-tree pages; replicas replay the WAL/binlog</td></tr>
<tr><td>Kafka</td><td>The log <em>is</em> the product: per-partition segment files (default 1 GB), retention by time/size or compaction by key</td><td>Sparse offset index + time index per segment → binary search to an offset</td></tr>
<tr><td>etcd</td><td>Raft log in the WAL, replicated to a quorum before commit</td><td>bbolt (a B+tree) holds the applied state; snapshots + <code>etcdctl defrag</code> keep it small</td></tr>
<tr><td>Redis</td><td>AOF</td><td>In-memory structures; AOF rewrite = compaction</td></tr>
<tr><td>LSM stores</td><td>WAL for the memtable</td><td>SSTables + compaction</td></tr>
</table>
<p>Pattern to recognise: <strong>log + materialised view + compaction</strong>. The log gives durability, ordering and replication; the view (B-tree, memtable, in-memory state) gives fast reads; compaction stops the log from growing forever. Event sourcing, CDC and Kafka Streams are the same idea at the application level.</p>
<blockquote>💡 Interview angle: "Design a durable key-value store" — start with an append-only log plus an in-memory hash index (Bitcask), then add segments and compaction, then sorted segments with a sparse index (that's an LSM tree), then Bloom filters. Walking that progression shows you understand why real engines look the way they do.</blockquote>`,
        he: `<p>Appends רציפים זה הדבר הכי מהיר שדיסק (ואפילו SSD) עושה, ו-log מסודר הוא מקור האמת הכי פשוט לשכפל. אז כמעט לכל מערכת יש אחד:</p>
<table>
<tr><th>מערכת</th><th>Log</th><th>המבנה שלידו</th></tr>
<tr><td>Postgres / MySQL</td><td>WAL / redo log — כותבים לשם קודם, fsync, ורק אחר כך משנים pages בעצלות</td><td>Pages של B-tree; replicas מריצים מחדש את ה-WAL/binlog</td></tr>
<tr><td>Kafka</td><td>ה-log <em>הוא</em> המוצר: קבצי segment לכל partition (ברירת מחדל 1 GB), retention לפי זמן/גודל או compaction לפי key</td><td>Offset index דליל + time index לכל segment → חיפוש בינארי ל-offset</td></tr>
<tr><td>etcd</td><td>Raft log ב-WAL, משוכפל ל-quorum לפני commit</td><td>bbolt (B+tree) מחזיק את ה-state שהוחל; snapshots + <code>etcdctl defrag</code> שומרים אותו קטן</td></tr>
<tr><td>Redis</td><td>AOF</td><td>מבנים בזיכרון; AOF rewrite = compaction</td></tr>
<tr><td>LSM stores</td><td>WAL ל-memtable</td><td>SSTables + compaction</td></tr>
</table>
<p>התבנית לזהות: <strong>log + materialised view + compaction</strong>. ה-log נותן עמידות, סדר ו-replication; ה-view (B-tree, memtable, state בזיכרון) נותן קריאות מהירות; compaction מונע מה-log לגדול לנצח. Event sourcing, CDC ו-Kafka Streams זה אותו רעיון ברמת האפליקציה.</p>
<blockquote>💡 בראיון: "תתכנן key-value store עמיד" — מתחילים עם append-only log ו-hash index בזיכרון (Bitcask), מוסיפים segments ו-compaction, אחר כך segments ממוינים עם sparse index (זה LSM tree), ואז Bloom filters. ללכת בהתקדמות הזאת מראה שאתם מבינים למה מנועים אמיתיים נראים כמו שהם נראים.</blockquote>`
      }
    }
  ],
  diagram: ` B+tree (Postgres/InnoDB)                LSM tree (RocksDB/Cassandra)
        [root]                           write ─► WAL (append) + memtable (skip list)
       /  |   \\                                         │ flush when full
   [..] [..] [..]   3-4 levels                  L0: [sst][sst][sst]   each SST has a Bloom filter
   / | \\        for 1B rows                     L1: [sst][sst][sst][sst]      ▲
 leaf pages ↔ leaf pages (range scan)            L2: [sst]...[sst]  ◄── compaction merges down
 update = rewrite page in place                  read = memtable → L0 → L1 … (skip via Bloom)

 Hash ring (Cassandra/Dynamo)      Merkle tree (repair / git)      Trie (route lookup)
     A(vnodes)                        root=H(h12,h34)               10/8 ─► 10.1/16 ─► 10.1.2/24
  D       B   key→next clockwise      /           \\                 longest match wins
     C                             h12=H(1,2)   h34=H(3,4)`,
  handsOn: [
    { cmd: "redis-cli PFADD visitors u1 u2 u3 u2 u1 && redis-cli PFCOUNT visitors && redis-cli MEMORY USAGE visitors", what: { en: "HyperLogLog: count distinct (3) in a structure that never grows past ~12 KB, however many items you add.", he: "HyperLogLog: סופרים ערכים שונים (3) במבנה שלא גדל מעבר ל-~12 KB, לא משנה כמה פריטים מוסיפים." } },
    { cmd: "redis-cli ZADD z 1 a 2 b 3 c && redis-cli OBJECT ENCODING z && redis-cli CONFIG SET zset-max-listpack-entries 0 && redis-cli ZADD z2 1 a && redis-cli OBJECT ENCODING z2", what: { en: "See a small sorted set stored as a compact listpack, then force the skiplist encoding by lowering the threshold.", he: "רואים sorted set קטן שנשמר כ-listpack קומפקטי, ואז מכריחים encoding של skiplist על ידי הורדת הסף." } },
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS pageinspect\" -c \"SELECT * FROM bt_metap('users_pkey')\"", what: { en: "Inspect a Postgres B-tree index: the 'level' column is the tree height above the leaves (typically 1-3 even for big tables).", he: "בודקים index של B-tree ב-Postgres: עמודת ה-'level' היא גובה העץ מעל העלים (בדרך כלל 1-3 גם בטבלאות גדולות)." } },
    { cmd: "nodetool tablehistograms my_keyspace my_table", what: { en: "Cassandra: the 'SSTables' column shows how many SSTables a read touches — read amplification of the LSM tree, before Bloom filters skip the rest.", he: "Cassandra: עמודת ה-'SSTables' מראה כמה SSTables קריאה נוגעת בהם — ה-read amplification של ה-LSM tree, אחרי שה-Bloom filters מדלגים על השאר." } },
    { cmd: "ip route get 10.1.2.3 ; git cat-file -p HEAD^{tree} | head -5", what: { en: "Two structures you use daily: the kernel's longest-prefix match (trie) and a git tree object (a Merkle tree node).", he: "שני מבנים שאתם משתמשים בהם כל יום: longest-prefix match של ה-kernel (trie) ו-tree object של git (צומת ב-Merkle tree)." } }
  ],
  mnemonic: {
    en: "\"Logs write, trees read, sketches guess\": append-only logs make writes durable and fast, trees (B-tree, LSM, trie, skip list) make reads fast, and probabilistic sketches (Bloom, HLL, Count-Min) answer in kilobytes by guessing within a known error.",
    he: "\"Logs כותבים, עצים קוראים, sketches מנחשים\": append-only logs הופכים כתיבות לעמידות ומהירות, עצים (B-tree, LSM, trie, skip list) הופכים קריאות למהירות, ו-sketches הסתברותיים (Bloom, HLL, Count-Min) עונים בקילובייטים בניחוש עם שגיאה ידועה."
  },
  pitfalls: [
    { en: "Picking an LSM store for a read-heavy, update-in-place workload and then fighting compaction stalls and tombstones — or a B-tree for 500k writes/s ingest and fighting page splits and WAL volume.", he: "לבחור LSM store ל-workload של הרבה קריאות ועדכונים במקום ואז להילחם ב-compaction stalls וב-tombstones — או B-tree ל-ingest של 500k כתיבות בשנייה ולהילחם ב-page splits ובנפח ה-WAL." },
    { en: "Treating a Bloom filter 'yes' as definite, or trying to delete from a plain Bloom filter (clearing bits creates false negatives).", he: "להתייחס ל'כן' של Bloom filter כוודאי, או לנסות למחוק מ-Bloom filter רגיל (איפוס ביטים יוצר false negatives)." },
    { en: "Using hash(key) mod N for sharding and then adding one node — almost every key moves, every cache misses at once. Use a ring with vnodes or fixed slots.", he: "להשתמש ב-hash(key) mod N ל-sharding ואז להוסיף node אחד — כמעט כל key זז, וכל ה-cache מחטיא בבת אחת. ring עם vnodes או slots קבועים." },
    { en: "Mass deletes in Cassandra without understanding tombstones: they live until gc_grace_seconds (10 days by default) and reads scanning thousands of them time out.", he: "מחיקות המוניות ב-Cassandra בלי להבין tombstones: הם חיים עד gc_grace_seconds (10 ימים כברירת מחדל) וקריאות שסורקות אלפים מהם נופלות על timeout." }
  ],
  interview: [
    {
      q: { en: "Explain why an LSM-based store can ingest far more writes than a B-tree store, and what you pay for it.", he: "תסביר למה store מבוסס LSM יכול לקלוט הרבה יותר כתיבות מ-store מבוסס B-tree, ומה משלמים על זה." },
      a: { en: "An LSM turns random writes into sequential ones: append to the WAL, insert into an in-memory memtable, flush full memtables as sorted immutable SSTables. No in-place page updates, no page splits, and writes batch naturally. The bill comes later: compaction rewrites data repeatedly (write amplification, 10x+ with leveled compaction) and competes with foreground IO; a point read may have to check the memtable and several SSTables (read amplification), mitigated by per-SSTable Bloom filters and block caches; deletes are tombstones that cost reads until compacted; and size-tiered compaction can temporarily need lots of free disk (space amplification). Choosing the compaction strategy is choosing which amplification you can afford.", he: "LSM הופך כתיבות אקראיות לרציפות: append ל-WAL, הכנסה ל-memtable בזיכרון, ו-flush של memtables מלאים כ-SSTables ממוינים ובלתי ניתנים לשינוי. אין עדכוני page במקום, אין page splits, והכתיבות מתאגדות באופן טבעי. החשבון מגיע אחר כך: compaction כותב את הדאטה שוב ושוב (write amplification, 10x ומעלה ב-leveled compaction) ומתחרה ב-IO של התעבורה; קריאת נקודה עלולה לבדוק את ה-memtable וכמה SSTables (read amplification), מה שמתמתן עם Bloom filters לכל SSTable ו-block caches; מחיקות הן tombstones שעולים בקריאות עד ה-compaction; ו-size-tiered compaction יכול לדרוש זמנית הרבה דיסק פנוי (space amplification). לבחור compaction strategy זה לבחור איזו הגברה אתם יכולים להרשות לעצמכם." }
    },
    {
      q: { en: "Two replicas of a 2 TB dataset may have drifted. How do you find and fix the differences without copying 2 TB over the network?", he: "שתי replicas של dataset בגודל 2 TB אולי התפצלו. איך מוצאים ומתקנים את ההבדלים בלי להעתיק 2 TB ברשת?" },
      a: { en: "Merkle trees. Each replica partitions the key range (e.g. by token range) and builds a hash tree: leaves are hashes of small key ranges, inner nodes hash their children. Exchange root hashes; if equal you're done. Otherwise recurse only into child hashes that differ, so you exchange O(differences × log n) hashes and then stream only the mismatched ranges. That's exactly Cassandra's anti-entropy repair and Dynamo's design. Trade-offs: building the tree means reading all data (CPU/IO heavy, so it's scheduled and throttled), leaf granularity trades tree size against how much data you re-stream per mismatch, and writes during the build cause some false mismatches — incremental repair narrows this by only checking unrepaired data.", he: "Merkle trees. כל replica מחלקת את טווח ה-keys (למשל לפי token range) ובונה עץ hashes: העלים הם hash של טווחי keys קטנים, צמתים פנימיים הם hash של הילדים. מחליפים root hashes; אם שווים — סיימנו. אחרת יורדים רק לילדים שה-hash שלהם שונה, אז מחליפים O(הבדלים × log n) hashes ואז משדרים רק את הטווחים שלא תואמים. זה בדיוק ה-anti-entropy repair של Cassandra והתכנון של Dynamo. Trade-offs: בניית העץ דורשת לקרוא את כל הדאטה (כבד ב-CPU/IO, אז מתזמנים ומגבילים), הגרנולריות של העלים היא trade-off בין גודל העץ לכמה דאטה משדרים מחדש לכל אי-התאמה, וכתיבות בזמן הבנייה יוצרות אי-התאמות מדומות — incremental repair מצמצם את זה כי הוא בודק רק דאטה שעוד לא תוקן." }
    }
  ],
  quiz: [
    {
      q: { en: "Which property is guaranteed by a Bloom filter?", he: "איזו תכונה מובטחת ב-Bloom filter?" },
      options: [
        { en: "No false positives", he: "אין false positives" },
        { en: "No false negatives — 'not present' is always correct", he: "אין false negatives — 'לא קיים' תמיד נכון" },
        { en: "Exact counts of each element", he: "ספירה מדויקת של כל אלמנט" },
        { en: "Elements can be deleted safely", he: "אפשר למחוק אלמנטים בבטחה" }
      ],
      answer: 1,
      explain: { en: "If any of the k bits is 0, the item was never inserted. All bits set only means 'probably' — other items' bits may overlap. That's why LSM stores can safely skip SSTables whose filter says no.", he: "אם אחד מ-k הביטים הוא 0, הפריט אף פעם לא הוכנס. כל הביטים דלוקים אומר רק 'כנראה' — ביטים של פריטים אחרים יכולים לחפוף. בגלל זה LSM stores יכולים לדלג בבטחה על SSTables שה-filter שלהם אומר לא." }
    },
    {
      q: { en: "Which data structure backs a Redis sorted set (beyond small sizes)?", he: "איזה מבנה נתונים עומד מאחורי sorted set ב-Redis (מעבר לגדלים קטנים)?" },
      options: [
        { en: "A B+tree", he: "B+tree" },
        { en: "A skip list plus a hash table", he: "Skip list ועוד hash table" },
        { en: "A binary heap", he: "Binary heap" },
        { en: "A Merkle tree", he: "Merkle tree" }
      ],
      answer: 1,
      explain: { en: "The skip list keeps members ordered by score for O(log n) inserts and range queries; the hash table maps member → score for O(1) ZSCORE. Small sets use a listpack.", he: "ה-skip list שומר את החברים ממוינים לפי score להכנסות ושאילתות טווח ב-O(log n); ה-hash table ממפה member → score בשביל ZSCORE ב-O(1). קבוצות קטנות משתמשות ב-listpack." }
    },
    {
      q: { en: "You add a 5th node to a cache cluster sharded with hash(key) mod N. Roughly what fraction of keys move?", he: "מוסיפים node חמישי ל-cache cluster שמחולק עם hash(key) mod N. בערך איזה חלק מה-keys זז?" },
      options: [
        { en: "About 1/5", he: "בערך 1/5" },
        { en: "About 4/5 — almost everything", he: "בערך 4/5 — כמעט הכול" },
        { en: "None", he: "אף אחד" },
        { en: "Exactly 1/4", he: "בדיוק 1/4" }
      ],
      answer: 1,
      explain: { en: "A key stays only if hash mod 4 == hash mod 5, which holds for ~1/5 of keys, so ~80% move. With consistent hashing only ~1/5 move (to the new node).", he: "key נשאר רק אם hash mod 4 == hash mod 5, מה שנכון לבערך 1/5 מה-keys, אז ~80% זזים. עם consistent hashing רק ~1/5 זזים (ל-node החדש)." }
    },
    {
      q: { en: "What is the main job of compaction in an LSM tree?", he: "מה התפקיד העיקרי של compaction ב-LSM tree?" },
      options: [
        { en: "Encrypting SSTables at rest", he: "להצפין SSTables at rest" },
        { en: "Merging SSTables to drop overwritten values and tombstones and bound read amplification", he: "למזג SSTables כדי לזרוק ערכים שנדרסו ו-tombstones ולהגביל את ה-read amplification" },
        { en: "Replicating data to other nodes", he: "לשכפל דאטה ל-nodes אחרים" },
        { en: "Building the WAL", he: "לבנות את ה-WAL" }
      ],
      answer: 1,
      explain: { en: "Without compaction, every flush adds another file to check on reads and dead data accumulates forever. Compaction trades write amplification for bounded read and space amplification.", he: "בלי compaction, כל flush מוסיף עוד קובץ לבדוק בקריאות ודאטה מת מצטבר לנצח. Compaction מחליף write amplification ב-read ו-space amplification חסומים." }
    }
  ],
  related: ["db-indexes", "db-sharding", "arch-caching", "redis-deep", "caching-deep", "db-replication"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Valkey", "data", "Linux Foundation fork of Redis 7.2.4 (2024), created after Redis moved to a source-available license; protocol-compatible with Redis.", "ה-fork של Redis 7.2.4 תחת ה-Linux Foundation (2024), שנוצר אחרי ש-Redis עבר לרישיון source-available; תואם ל-Redis בפרוטוקול.", "redis-deep"],
  ["Redis hash slot", "data", "One of 16384 buckets in Redis Cluster; slot = CRC16(key) mod 16384, and each primary owns a range of slots.", "אחד מ-16384 דליים ב-Redis Cluster; slot = CRC16(key) mod 16384, וכל primary מחזיק טווח של slots.", "redis-deep"],
  ["Hash tag (Redis)", "data", "The {…} part of a key; only it is hashed, forcing related keys into the same Cluster slot so multi-key commands work.", "החלק שבתוך {…} ב-key; רק הוא עובר hash, וכך keys קשורים נוחתים באותו slot ב-Cluster ופקודות multi-key עובדות.", "redis-deep"],
  ["Eviction policy", "architecture", "The rule a full cache uses to choose what to drop (LRU, LFU, FIFO, TTL-based) — in Redis, maxmemory-policy.", "הכלל שלפיו cache מלא בוחר מה לזרוק (LRU, LFU, FIFO, לפי TTL) — ב-Redis זה maxmemory-policy.", "caching-deep"],
  ["Hot key", "data", "A single key receiving a disproportionate share of traffic, saturating the one shard (and thread) that owns it.", "key בודד שמקבל חלק לא פרופורציונלי מהתעבורה ורווי את ה-shard (וה-thread) היחיד שמחזיק אותו.", "redis-deep"],
  ["Redlock", "data", "Redis's multi-master locking algorithm (majority of N independent nodes); criticised for relying on timing assumptions — use fencing tokens for correctness.", "אלגוריתם ה-locking של Redis על כמה masters (רוב מתוך N nodes בלתי תלויים); ספג ביקורת על הסתמכות על הנחות תזמון — לנכונות משתמשים ב-fencing tokens.", "redis-deep"],
  ["W-TinyLFU", "architecture", "Cache policy (Caffeine, Ristretto) combining a small LRU window, a segmented LRU main area and a frequency-based admission filter.", "Policy של cache (Caffeine, Ristretto) שמשלב window קטן של LRU, אזור ראשי של segmented LRU ו-admission filter מבוסס תדירות.", "caching-deep"],
  ["Stale-while-revalidate", "architecture", "Serve a slightly expired cached value immediately while refreshing it in the background; an HTTP Cache-Control directive and an app-level pattern.", "להגיש מיד ערך שפג תוקפו מעט ולרענן אותו ברקע; directive של Cache-Control ב-HTTP וגם תבנית ברמת האפליקציה.", "caching-deep"],
  ["Negative caching", "architecture", "Caching 'not found' results briefly so repeated lookups for missing keys don't hit the database (prevents cache penetration).", "לשמור ב-cache תוצאות 'לא נמצא' לזמן קצר כדי שחיפושים חוזרים של keys שלא קיימים לא יגיעו ל-DB (מונע cache penetration).", "caching-deep"],
  ["LSM tree", "data", "Log-structured merge tree: writes go to a memtable and immutable sorted SSTables merged by compaction (RocksDB, Cassandra).", "Log-structured merge tree: כתיבות הולכות ל-memtable ול-SSTables ממוינים ובלתי ניתנים לשינוי שממוזגים ב-compaction (RocksDB, Cassandra).", "infra-data-structures"],
  ["Bloom filter", "data", "Bit-array set membership test with no false negatives and a tunable false-positive rate (~1% at 10 bits per key).", "בדיקת שייכות לקבוצה על מערך ביטים, בלי false negatives ועם שיעור false positives שניתן לכוונן (~1% ב-10 ביטים ל-key).", "infra-data-structures"],
  ["HyperLogLog", "data", "Probabilistic count-distinct sketch; Redis's version uses 12 KB for ~0.81% standard error at any cardinality.", "Sketch הסתברותי לספירת ערכים שונים; הגרסה של Redis משתמשת ב-12 KB לשגיאת תקן של ~0.81% בכל cardinality.", "infra-data-structures"],
  ["Count-Min Sketch", "data", "Grid of counters that estimates item frequencies in fixed memory, only ever overestimating; used for heavy hitters and TinyLFU.", "טבלת counters שמעריכה תדירויות של פריטים בזיכרון קבוע, ותמיד רק מעריכה ביתר; משמשת ל-heavy hitters ול-TinyLFU.", "infra-data-structures"],
  ["Merkle tree", "data", "Tree of hashes where each parent hashes its children; lets replicas find differences in O(log n) (Cassandra repair, git).", "עץ של hashes שבו כל הורה הוא hash של הילדים; מאפשר ל-replicas למצוא הבדלים ב-O(log n) (repair ב-Cassandra, git).", "infra-data-structures"],
].forEach(([term, track, en, he, lesson]) => INFRA.glossary.push({ term, track, def: { en, he }, lesson }));
