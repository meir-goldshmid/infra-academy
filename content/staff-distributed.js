// Staff track — distributed systems depth: consistency, time, delivery semantics, Kafka, queueing,
// overload, cells, multi-region data. Level 3, aimed at Senior/Staff/Principal interviews and real work.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. Consistency models, quorums & consensus
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-consensus-consistency",
  track: "staff",
  order: 1,
  icon: "🗳️",
  level: 3,
  minutes: 18,
  title: {
    en: "Consistency Models, Quorums & Consensus (Raft, etcd, ZooKeeper, Fencing)",
    he: "מודלי עקביות, Quorums ו-Consensus (Raft, etcd, ZooKeeper, Fencing)"
  },
  tldr: {
    en: "Every replicated system picks a promise about what readers can see (linearizable, sequential, causal, read-your-writes, eventual); quorums and consensus (Raft/ZAB) are how you keep the strong promises, and fencing tokens are how you keep a deposed leader from corrupting data.",
    he: "כל מערכת משוכפלת בוחרת הבטחה לגבי מה קורא יכול לראות (linearizable, sequential, causal, read-your-writes, eventual). Quorums ו-consensus (Raft/ZAB) הם הדרך לקיים את ההבטחות החזקות, ו-fencing tokens הם מה שמונע מ-leader שהודח להשחית את הדאטה."
  },
  analogy: {
    en: "A linearizable system is a single whiteboard in a room: the moment someone writes, everyone who looks sees it. Eventual consistency is five whiteboards in five offices that a courier syncs every few minutes. Raft is the rule that only the person holding this term's marker may write, the marker is handed out by majority vote, and every note is stamped with the term number so a stale marker from last term is rejected at the door.",
    he: "מערכת linearizable היא לוח מחיק אחד בחדר: ברגע שמישהו כותב, כל מי שמסתכל רואה. Eventual consistency זה חמישה לוחות בחמישה משרדים ושליח שמסנכרן ביניהם כל כמה דקות. Raft הוא הכלל שרק מי שמחזיק את הטוש של הקדנציה הנוכחית רשאי לכתוב, הטוש מחולק בהצבעת רוב, וכל פתק מוחתם במספר הקדנציה – כך שטוש ישן מקדנציה קודמת נדחה בכניסה."
  },
  sections: [
    {
      h: { en: "The consistency ladder: what can a reader observe?", he: "סולם העקביות: מה קורא יכול לראות?" },
      body: {
        en: `<p>A <strong>consistency model</strong> is a contract between a replicated store and its clients about which histories are legal. From strongest to weakest:</p>
<table>
<tr><th>Model</th><th>Promise</th><th>Real examples</th></tr>
<tr><td><strong>Linearizable</strong> (atomic)</td><td>Every op appears to take effect at one instant between its call and return, in real-time order. Once a write is acked, every later read (from anyone) sees it.</td><td>etcd (default reads), ZooKeeper writes, Spanner, DynamoDB strongly-consistent reads (single item)</td></tr>
<tr><td><strong>Sequential</strong></td><td>One global order that respects each client's program order, but not real time. A read can be "behind" wall-clock.</td><td>ZooKeeper reads (served locally by a follower), CPU memory models</td></tr>
<tr><td><strong>Causal</strong></td><td>If A happened-before B (I read your post, then I comment), everyone sees A before B. Concurrent ops may be seen in different orders.</td><td>MongoDB causal sessions, COPS, many CRDT systems</td></tr>
<tr><td><strong>Read-your-writes</strong> (session)</td><td>You see your own writes; others may not yet.</td><td>Sticky sessions, Cosmos DB "Session" level, reading from primary after write</td></tr>
<tr><td><strong>Monotonic reads</strong></td><td>You never see time go backwards (no newer value followed by an older one).</td><td>Pinning a client to one replica</td></tr>
<tr><td><strong>Eventual</strong></td><td>If writes stop, replicas converge. No promise about when, or about what you see meanwhile.</td><td>DNS, Cassandra ONE/ONE, S3 cross-region replication, async read replicas</td></tr>
</table>
<p>Do not confuse with the <strong>C in ACID</strong> (invariants) or with <strong>serializability</strong> (a property of multi-object transactions). <strong>Strict serializability</strong> = serializable + linearizable: what Spanner and FoundationDB offer.</p>
<blockquote>💡 Real world: the classic bug is a user updates their profile, the page reloads from an async replica 200 ms behind, and the old value shows up. The fix is rarely "make everything linearizable": it is read-your-writes (route the author's reads to the primary for N seconds, or pass a write LSN/token and wait until the replica has replayed it).</blockquote>`,
        he: `<p><strong>מודל עקביות</strong> הוא חוזה בין store משוכפל ללקוחות שלו: אילו היסטוריות חוקיות. מהחזק לחלש:</p>
<table>
<tr><th>מודל</th><th>ההבטחה</th><th>דוגמאות אמיתיות</th></tr>
<tr><td><strong>Linearizable</strong> (atomic)</td><td>כל פעולה נראית כאילו קרתה ברגע אחד בין הקריאה לחזרה, לפי סדר הזמן האמיתי. ברגע ש-write קיבל ack, כל read מאוחר יותר (של כל אחד) רואה אותו.</td><td>etcd (reads ברירת מחדל), writes של ZooKeeper, Spanner, strongly-consistent reads של DynamoDB (item בודד)</td></tr>
<tr><td><strong>Sequential</strong></td><td>סדר גלובלי אחד שמכבד את סדר הפעולות של כל לקוח, אבל לא את הזמן האמיתי. read יכול "לפגר" אחרי השעון.</td><td>reads ב-ZooKeeper (מוגשים מקומית מ-follower), memory models של CPU</td></tr>
<tr><td><strong>Causal</strong></td><td>אם A קרה לפני B (קראתי את הפוסט שלך ואז הגבתי), כולם רואים את A לפני B. פעולות מקבילות יכולות להיראות בסדר שונה.</td><td>causal sessions ב-MongoDB, COPS, הרבה מערכות CRDT</td></tr>
<tr><td><strong>Read-your-writes</strong> (session)</td><td>אתה רואה את ה-writes של עצמך; אחרים אולי עוד לא.</td><td>Sticky sessions, רמת "Session" ב-Cosmos DB, קריאה מה-primary אחרי write</td></tr>
<tr><td><strong>Monotonic reads</strong></td><td>הזמן אף פעם לא הולך אחורה בשבילך (לא תראה ערך חדש ואחריו ערך ישן).</td><td>הצמדת לקוח ל-replica אחת</td></tr>
<tr><td><strong>Eventual</strong></td><td>אם ה-writes נעצרים, ה-replicas מתכנסות. אין הבטחה מתי, ואין הבטחה מה תראה בינתיים.</td><td>DNS, Cassandra ב-ONE/ONE, S3 cross-region replication, read replicas אסינכרוניות</td></tr>
</table>
<p>לא לבלבל עם ה-<strong>C של ACID</strong> (אינווריאנטים) או עם <strong>serializability</strong> (תכונה של טרנזקציות על כמה אובייקטים). <strong>Strict serializability</strong> = serializable + linearizable: מה ש-Spanner ו-FoundationDB נותנים.</p>
<blockquote>💡 מהשטח: הבאג הקלאסי – משתמש מעדכן פרופיל, הדף נטען מחדש מ-replica אסינכרונית שמפגרת ב-200 ms, והערך הישן מופיע. התיקון כמעט אף פעם לא "נעשה הכול linearizable": זה read-your-writes (לנתב את ה-reads של הכותב ל-primary ל-N שניות, או להעביר write LSN/token ולחכות שה-replica תגיע אליו).</blockquote>`
      }
    },
    {
      h: { en: "Quorums: R + W > N and why it is not enough", he: "Quorums: R + W > N ולמה זה לא מספיק" },
      body: {
        en: `<p>In leaderless (Dynamo-style) stores you write to <strong>W</strong> of <strong>N</strong> replicas and read from <strong>R</strong>. If <code>R + W &gt; N</code>, every read set overlaps every write set in at least one replica, so the read <em>can</em> see the latest acked write.</p>
<pre>N=3, W=2, R=2  -&gt; overlap 1   tolerate 1 node down for reads AND writes
N=3, W=3, R=1  -&gt; fast reads, any single failure blocks writes
N=3, W=1, R=1  -&gt; eventual; fastest, may read stale
N=5, W=3, R=3  -&gt; tolerate 2 failures

-- Cassandra, per query:
CONSISTENCY LOCAL_QUORUM;   -- floor(RF_local/2)+1 in the local DC only
SELECT balance FROM accounts WHERE id = 42;</pre>
<p>Why quorum overlap is <strong>not</strong> linearizability:</p>
<ul>
<li><strong>Sloppy quorums &amp; hinted handoff:</strong> when home replicas are down, writes land on stand-ins; the overlap guarantee is gone.</li>
<li><strong>Concurrent writes</strong> resolved by last-write-wins with skewed clocks silently drop data.</li>
<li><strong>Partial writes:</strong> a write that reached 1 of 3 replicas then "failed" is not rolled back; a later read may or may not see it (the read is not monotonic) unless the reader performs <em>read repair</em> synchronously before returning.</li>
</ul>
<p>Rule of thumb for interviews: quorums give you <em>probabilistic freshness and availability</em>; for compare-and-set, uniqueness or leader election you need <strong>consensus</strong>.</p>`,
        he: `<p>ב-stores בלי leader (בסגנון Dynamo) כותבים ל-<strong>W</strong> מתוך <strong>N</strong> replicas וקוראים מ-<strong>R</strong>. אם <code>R + W &gt; N</code>, כל קבוצת קריאה חותכת כל קבוצת כתיבה בלפחות replica אחת, כך שה-read <em>יכול</em> לראות את ה-write האחרון שקיבל ack.</p>
<pre>N=3, W=2, R=2  -&gt; overlap 1   tolerate 1 node down for reads AND writes
N=3, W=3, R=1  -&gt; fast reads, any single failure blocks writes
N=3, W=1, R=1  -&gt; eventual; fastest, may read stale
N=5, W=3, R=3  -&gt; tolerate 2 failures

-- Cassandra, per query:
CONSISTENCY LOCAL_QUORUM;   -- floor(RF_local/2)+1 in the local DC only
SELECT balance FROM accounts WHERE id = 42;</pre>
<p>למה חפיפת quorum היא <strong>לא</strong> linearizability:</p>
<ul>
<li><strong>Sloppy quorums ו-hinted handoff:</strong> כשה-replicas הקבועות למטה, ה-writes נוחתים על מחליפים – והבטחת החפיפה נעלמת.</li>
<li><strong>Writes מקבילים</strong> שנפתרים ב-last-write-wins עם שעונים לא מסונכרנים מאבדים דאטה בשקט.</li>
<li><strong>Writes חלקיים:</strong> write שהגיע ל-1 מתוך 3 ואז "נכשל" לא מתגלגל אחורה. read מאוחר יותר אולי יראה אותו ואולי לא (ה-read לא monotonic), אלא אם הקורא עושה <em>read repair</em> סינכרוני לפני שהוא מחזיר תשובה.</li>
</ul>
<p>כלל אצבע לראיון: quorums נותנים <em>טריות הסתברותית וזמינות</em>. בשביל compare-and-set, ייחודיות או leader election צריך <strong>consensus</strong>.</p>`
      }
    },
    {
      h: { en: "Raft in five minutes: terms, elections, the log", he: "Raft בחמש דקות: terms, בחירות, ה-log" },
      body: {
        en: `<p><strong>Raft</strong> (etcd, Consul, CockroachDB ranges, TiKV, Kafka KRaft) replicates a log across 2f+1 nodes and tolerates f failures: 3 nodes survive 1, 5 survive 2. Even sizes buy nothing: 4 nodes still need 3 for a majority and survive only 1.</p>
<ul>
<li><strong>Term:</strong> a monotonically increasing epoch number. Each term has at most one leader. Every RPC carries the term; a node seeing a higher term steps down immediately.</li>
<li><strong>Election:</strong> a follower that hears no heartbeat within a <em>randomized</em> election timeout (etcd: heartbeat 100 ms, election 1000 ms) becomes candidate, increments the term, votes for itself and asks for votes. A node votes once per term and only for a candidate whose log is at least as up to date. Randomization avoids split votes.</li>
<li><strong>Commit:</strong> the leader appends an entry, replicates it with <code>AppendEntries</code>; once a <em>majority</em> has it on disk (fsync), it is committed and applied. That is why etcd is fsync-latency-bound: put it on SSD and watch <code>wal_fsync_duration_seconds</code> p99 (should be under 10 ms).</li>
<li><strong>Linearizable reads:</strong> the leader must confirm it is still leader before answering (etcd <em>ReadIndex</em>: a heartbeat round to a majority), otherwise a partitioned old leader serves stale data. <code>--consistency=s</code> (serializable) skips this and reads local state.</li>
</ul>
<pre>etcdctl --endpoints=$EP endpoint status -w table   # leader, raft term, raft index per member
etcdctl --endpoints=$EP endpoint health
etcdctl get /config/flag                    # linearizable (default)
etcdctl get /config/flag --consistency=s    # serializable, may be stale
etcdctl lease grant 10                      # 10 s lease, used for locks / leader election
etcdctl elect my-service node-a             # campaign for leadership</pre>
<p><strong>ZooKeeper</strong> uses ZAB (similar idea, "epoch" instead of term). Writes go through the leader and are linearizable; reads are served locally by any server, so they are only sequentially consistent: call <code>sync</code> before a read when you need the latest value. Ephemeral + sequential znodes give you locks and leader election; session timeout (typically 6-40 s) decides how fast a dead holder's lock is freed.</p>`,
        he: `<p><strong>Raft</strong> (etcd, Consul, ה-ranges של CockroachDB, TiKV, Kafka KRaft) משכפל log על 2f+1 nodes ושורד f כשלים: 3 nodes שורדים 1, 5 שורדים 2. מספר זוגי לא קונה כלום: 4 nodes עדיין צריכים 3 לרוב ושורדים רק 1.</p>
<ul>
<li><strong>Term:</strong> מספר epoch שרק עולה. בכל term יש לכל היותר leader אחד. כל RPC נושא את ה-term, ו-node שרואה term גבוה יותר יורד מיד מהתפקיד.</li>
<li><strong>בחירות:</strong> follower שלא שומע heartbeat בתוך election timeout <em>אקראי</em> (ב-etcd: heartbeat של 100 ms, election של 1000 ms) הופך ל-candidate, מעלה את ה-term, מצביע לעצמו ומבקש קולות. node מצביע פעם אחת בכל term, ורק ל-candidate שה-log שלו מעודכן לפחות כמו שלו. האקראיות מונעת פיצול קולות.</li>
<li><strong>Commit:</strong> ה-leader מוסיף entry ומשכפל אותו ב-<code>AppendEntries</code>. ברגע ש<em>רוב</em> ה-nodes כתבו אותו לדיסק (fsync), הוא committed ומיושם. בגלל זה etcd חסום ע״י latency של fsync: שמים אותו על SSD ומסתכלים על p99 של <code>wal_fsync_duration_seconds</code> (צריך להיות מתחת ל-10 ms).</li>
<li><strong>Reads שהם linearizable:</strong> ה-leader חייב לוודא שהוא עדיין leader לפני שהוא עונה (ב-etcd זה <em>ReadIndex</em>: סבב heartbeat לרוב), אחרת leader ישן שנמצא בצד המנותק של partition יגיש דאטה ישן. <code>--consistency=s</code> (serializable) מדלג על זה וקורא state מקומי.</li>
</ul>
<pre>etcdctl --endpoints=$EP endpoint status -w table   # leader, raft term, raft index per member
etcdctl --endpoints=$EP endpoint health
etcdctl get /config/flag                    # linearizable (default)
etcdctl get /config/flag --consistency=s    # serializable, may be stale
etcdctl lease grant 10                      # 10 s lease, used for locks / leader election
etcdctl elect my-service node-a             # campaign for leadership</pre>
<p><strong>ZooKeeper</strong> משתמש ב-ZAB (רעיון דומה, "epoch" במקום term). ה-writes עוברים דרך ה-leader והם linearizable. ה-reads מוגשים מקומית מכל שרת, ולכן הם רק sequentially consistent: קוראים ל-<code>sync</code> לפני read כשצריך את הערך האחרון. znodes שהם ephemeral + sequential נותנים locks ו-leader election, וה-session timeout (בדרך כלל 6-40 שניות) קובע כמה מהר lock של מחזיק מת משתחרר.</p>`
      }
    },
    {
      h: { en: "Split brain, leases and fencing tokens", he: "Split brain, leases ו-fencing tokens" },
      body: {
        en: `<p><strong>Split brain</strong> = two nodes both believe they are leader and both accept writes. Consensus prevents two leaders <em>in the same term</em>, but it cannot stop an old leader that does not yet know it was deposed: a 30 s GC pause, a VM live-migration freeze, or a network partition is enough.</p>
<p>The classic failure (Kleppmann's lock example):</p>
<pre>t=0   client A acquires lock (lease 10 s)
t=1   A enters a 15 s stop-the-world GC pause
t=11  lease expires; client B acquires lock, writes file
t=16  A wakes up, still "holds the lock" in its mind, writes file  -&gt; corruption</pre>
<p><strong>Fix: fencing tokens.</strong> The lock service returns a monotonically increasing number with every grant (etcd: the key's <code>mod_revision</code> or the lease/revision of the election key; ZooKeeper: the <code>zxid</code> or sequential znode number; Raft: the term). Every write to the protected resource carries the token, and the <strong>resource itself</strong> rejects any token lower than the highest it has seen.</p>
<pre>A: lock -&gt; token 33     B: lock -&gt; token 34
B: write(token=34) ok   storage remembers max=34
A: write(token=33)      -&gt; REJECTED (33 &lt; 34)

-- in SQL, fencing as a conditional write:
UPDATE jobs SET owner='B', epoch=34 WHERE id=7 AND epoch &lt; 34;</pre>
<p>Other split-brain defenses: <strong>STONITH</strong> (shoot the other node in the head: power-fence via IPMI or cloud API), quorum witnesses (a third tie-breaker in another AZ), and refusing writes when you cannot see a majority (minority side goes read-only).</p>
<blockquote>⚠️ Production tip: Redis-based locks (including Redlock) do not give you fencing tokens out of the box. Fine for "avoid doing the same work twice" (efficiency), not for "two writers will corrupt data" (correctness). For correctness use etcd/ZooKeeper/a DB row with an epoch column.</blockquote>`,
        he: `<p><strong>Split brain</strong> = שני nodes שכל אחד חושב שהוא ה-leader ושניהם מקבלים writes. Consensus מונע שני leaders <em>באותו term</em>, אבל הוא לא יכול לעצור leader ישן שעוד לא יודע שהודח: GC pause של 30 שניות, הקפאה בזמן live migration של VM, או network partition – זה מספיק.</p>
<p>הכשל הקלאסי (הדוגמה של Kleppmann עם lock):</p>
<pre>t=0   client A acquires lock (lease 10 s)
t=1   A enters a 15 s stop-the-world GC pause
t=11  lease expires; client B acquires lock, writes file
t=16  A wakes up, still "holds the lock" in its mind, writes file  -&gt; corruption</pre>
<p><strong>התיקון: fencing tokens.</strong> שירות ה-lock מחזיר מספר שרק עולה עם כל הענקה (ב-etcd: ה-<code>mod_revision</code> של ה-key או ה-revision של מפתח ה-election; ב-ZooKeeper: ה-<code>zxid</code> או מספר ה-znode הסדרתי; ב-Raft: ה-term). כל write למשאב המוגן נושא את ה-token, ו<strong>המשאב עצמו</strong> דוחה כל token נמוך מהגבוה ביותר שכבר ראה.</p>
<pre>A: lock -&gt; token 33     B: lock -&gt; token 34
B: write(token=34) ok   storage remembers max=34
A: write(token=33)      -&gt; REJECTED (33 &lt; 34)

-- in SQL, fencing as a conditional write:
UPDATE jobs SET owner='B', epoch=34 WHERE id=7 AND epoch &lt; 34;</pre>
<p>הגנות נוספות מ-split brain: <strong>STONITH</strong> (לירות ל-node השני בראש: לכבות אותו דרך IPMI או API של הענן), quorum witness (שובר שוויון שלישי ב-AZ אחר), וסירוב לקבל writes כשלא רואים רוב (הצד של המיעוט עובר ל-read-only).</p>
<blockquote>⚠️ טיפ לפרודקשן: locks מבוססי Redis (כולל Redlock) לא נותנים fencing tokens מהקופסה. זה בסדר בשביל "לא לעשות את אותה עבודה פעמיים" (יעילות), לא בשביל "שני כותבים ישחיתו דאטה" (נכונות). בשביל נכונות – etcd/ZooKeeper או שורה ב-DB עם עמודת epoch.</blockquote>`
      }
    },
    {
      h: { en: "Choosing: cost of strong consistency", he: "איך בוחרים: המחיר של עקביות חזקה" },
      body: {
        en: `<p>Strong consistency costs <strong>latency</strong> (at least one majority round trip per write, and per linearizable read unless you use leader leases) and <strong>availability</strong> during partitions (the minority side must stop). PACELC makes this explicit: even with no partition you trade latency for consistency.</p>
<ul>
<li>Within one region (3 AZs, ~1-2 ms RTT) a Raft commit costs ~2-5 ms with fsync: cheap. Across regions (us-east-1 to eu-west-1 ~70-80 ms RTT) every write pays it: expensive.</li>
<li>Keep consensus for <strong>small, critical metadata</strong>: leader election, config, locks, membership, shard maps, schema. etcd's default size limit is 2 GiB (<code>--quota-backend-bytes</code>, max recommended 8 GiB) and 1.5 MiB per request; it is not a database for your business data.</li>
<li>Use weaker, cheaper models for the bulk: session consistency for user-facing reads, eventual for feeds, counters, analytics.</li>
</ul>
<blockquote>💡 Real world: Kubernetes itself is the canonical example. All cluster state lives in etcd (Raft, linearizable). Controllers read from <em>informer caches</em> (eventually consistent) and reconcile, and they use <code>resourceVersion</code> for optimistic concurrency (a CAS). The control loop design tolerates stale reads because every write is conditional.</blockquote>`,
        he: `<p>עקביות חזקה עולה ב-<strong>latency</strong> (לפחות round trip אחד לרוב בכל write, ובכל read שהוא linearizable אלא אם משתמשים ב-leader leases) וב-<strong>זמינות</strong> בזמן partition (הצד של המיעוט חייב לעצור). PACELC אומר את זה במפורש: גם בלי partition אתה סוחר ב-latency מול consistency.</p>
<ul>
<li>בתוך region אחד (3 AZs, RTT של 1-2 ms) commit של Raft עולה בערך 2-5 ms כולל fsync: זול. בין regions (מ-us-east-1 ל-eu-west-1 בערך 70-80 ms RTT) כל write משלם את זה: יקר.</li>
<li>שומרים את ה-consensus ל<strong>מטא-דאטה קטן וקריטי</strong>: leader election, קונפיגורציה, locks, membership, מפות shards, schema. ה-limit ברירת המחדל של etcd הוא 2 GiB (<code>--quota-backend-bytes</code>, מקסימום מומלץ 8 GiB) ו-1.5 MiB לבקשה – זה לא DB לדאטה העסקי שלך.</li>
<li>לרוב הדאטה משתמשים במודלים חלשים וזולים יותר: session consistency ל-reads של משתמשים, eventual ל-feeds, counters ואנליטיקס.</li>
</ul>
<blockquote>💡 מהשטח: Kubernetes עצמו הוא הדוגמה הקנונית. כל ה-state של ה-cluster יושב ב-etcd (Raft, linearizable). ה-controllers קוראים מ-<em>informer caches</em> (eventually consistent) ועושים reconcile, ומשתמשים ב-<code>resourceVersion</code> ל-optimistic concurrency (בעצם CAS). העיצוב של control loop סובל reads ישנים כי כל write הוא מותנה.</blockquote>`
      }
    }
  ],
  diagram: `Raft, 5 nodes, term 7                      Fencing
                                            lock svc --token 33--> A (paused by GC)
   [L]  leader term 7                       lock svc --token 34--> B
  / | \\ \\  AppendEntries(term=7, idx=120)    B --write(34)--> storage (max=34)
 F  F  F  F                                 A --write(33)--> storage: REJECT
 ack ack .  .   -> 3/5 durable = COMMITTED

 partition:  {L, F1} | {F2, F3, F4}
   old L cannot commit (2/5)    F2 times out -> term 8 -> elected (3/5)
   old L sees term 8 on heal -> steps down

 Quorum overlap: N=3  W=2  R=2   R+W=4 > 3  => every read set meets every write set`,
  handsOn: [
    { cmd: "etcdctl --endpoints=https://10.0.1.10:2379,https://10.0.2.10:2379,https://10.0.3.10:2379 endpoint status -w table", what: { en: "Show every member's ID, version, DB size, IS LEADER, RAFT TERM and RAFT INDEX. A term that keeps climbing means repeated elections: check disk fsync latency and network.", he: "מציג לכל member את ה-ID, הגרסה, גודל ה-DB, IS LEADER, RAFT TERM ו-RAFT INDEX. term שממשיך לטפס = בחירות חוזרות: לבדוק latency של fsync בדיסק ואת הרשת." } },
    { cmd: "etcdctl put /demo/x 1 && etcdctl get /demo/x -w json | jq '.header.revision, .kvs[0].mod_revision'", what: { en: "Write a key and read its revision. mod_revision is a cluster-wide monotonic number you can use as a fencing token or for CAS.", he: "לכתוב key ולקרוא את ה-revision שלו. mod_revision הוא מספר מונוטוני בכל ה-cluster שאפשר להשתמש בו כ-fencing token או ל-CAS." } },
    { cmd: "etcdctl txn --interactive  # compare: mod(\"/demo/x\") = 5  success: put /demo/x 2  failure: get /demo/x", what: { en: "Run a compare-and-swap transaction: only write if nobody changed the key since revision 5. This is how Kubernetes resourceVersion conflicts work.", he: "להריץ טרנזקציית compare-and-swap: לכתוב רק אם אף אחד לא שינה את ה-key מאז revision 5. ככה בדיוק עובדים conflicts של resourceVersion ב-Kubernetes." } },
    { cmd: "curl -s http://127.0.0.1:2381/metrics | grep -E 'etcd_disk_wal_fsync_duration_seconds_bucket|etcd_server_leader_changes_seen_total|etcd_server_proposals_failed_total'", what: { en: "Read the three etcd health signals that matter: WAL fsync latency (p99 should be under 10 ms), leader changes, failed proposals.", he: "לקרוא את שלושת סימני הבריאות של etcd שבאמת חשובים: latency של fsync ל-WAL (p99 מתחת ל-10 ms), החלפות leader, ו-proposals שנכשלו." } },
    { cmd: "echo stat | nc zk1 2181; echo mntr | nc zk1 2181 | grep -E 'zk_server_state|zk_avg_latency|zk_outstanding_requests'", what: { en: "ZooKeeper four-letter-word commands: see whether this server is leader or follower, latency and the request backlog (mntr must be whitelisted with 4lw.commands.whitelist).", he: "פקודות four-letter-word של ZooKeeper: לראות אם השרת leader או follower, את ה-latency ואת תור הבקשות (צריך לאשר את mntr ב-4lw.commands.whitelist)." } }
  ],
  mnemonic: {
    en: "\"L-S-C-R-E: Lines Seldom Cross, Reads Eventually\" (Linearizable, Sequential, Causal, Read-your-writes, Eventual). And for leaders: \"Majority elects, Term protects, Token rejects\".",
    he: "\"L-S-C-R-E\" מהחזק לחלש: Linearizable, Sequential, Causal, Read-your-writes, Eventual. ולגבי leaders: \"הרוב בוחר, ה-term מגן, ה-token דוחה\"."
  },
  pitfalls: [
    { en: "Running etcd or ZooKeeper with 2 or 4 members. Even counts add a failure point without adding tolerance; 4 nodes still need 3 for quorum. Use 3 (or 5 for large control planes), spread across 3 AZs.", he: "להריץ etcd או ZooKeeper עם 2 או 4 members. מספר זוגי מוסיף נקודת כשל בלי להוסיף עמידות: 4 nodes עדיין צריכים 3 ל-quorum. משתמשים ב-3 (או 5 ל-control planes גדולים) על פני 3 AZs." },
    { en: "Believing a distributed lock with a TTL gives mutual exclusion. A GC pause or clock jump outlives the lease; without a fencing token checked by the resource, two holders will write.", he: "להאמין ש-distributed lock עם TTL נותן mutual exclusion. GC pause או קפיצת שעון ארוכים מה-lease; בלי fencing token שהמשאב עצמו בודק, שני מחזיקים יכתבו." },
    { en: "Calling R+W greater than N 'strong consistency'. Sloppy quorums, LWW with skewed clocks and partial writes break linearizability; you still need consensus or CAS for uniqueness and counters.", he: "לקרוא ל-R+W שגדול מ-N 'עקביות חזקה'. sloppy quorums, LWW עם שעונים לא מסונכרנים ו-writes חלקיים שוברים linearizability; בשביל ייחודיות ו-counters עדיין צריך consensus או CAS." },
    { en: "Putting etcd on slow network disks (or sharing the disk with noisy workloads). Every commit waits for fsync; a 50 ms p99 fsync causes missed heartbeats, leader flapping and an unstable Kubernetes API.", he: "לשים etcd על דיסקי רשת איטיים (או לחלוק דיסק עם workloads רועשים). כל commit מחכה ל-fsync; p99 של 50 ms ל-fsync גורם ל-heartbeats שמתפספסים, leader שמתחלף כל הזמן ו-API של Kubernetes לא יציב." }
  ],
  interview: [
    {
      q: { en: "Design a leader election for a singleton cron-scheduler that runs on 3 instances. How do you guarantee two leaders never both run the job?", he: "תתכנן leader election ל-cron scheduler שחייב לרוץ כ-singleton על 3 instances. איך מבטיחים ששני leaders לעולם לא יריצו את ה-job ביחד?" },
      a: { en: "You can't guarantee that two processes never <em>think</em> they're leader, so make it safe when they do. Use etcd/ZooKeeper (or a K8s Lease object) for election with a lease of ~10-15 s renewed every ~2-5 s. The election returns a fencing token (etcd revision / ZK zxid / Lease generation). Every side effect carries it: the job table uses a conditional update (WHERE epoch less than token), downstream APIs take an idempotency key of job-id + scheduled-time. The leader also stops work proactively when its lease is near expiry (check before every step, with margin for clock drift). Result: brief double-leadership is harmless, and failover time is about one lease TTL.", he: "אי אפשר להבטיח ששני תהליכים לעולם לא <em>יחשבו</em> שהם leader, אז דואגים שזה יהיה בטוח כשזה קורה. משתמשים ב-etcd/ZooKeeper (או אובייקט Lease ב-K8s) ל-election עם lease של 10-15 שניות שמתחדש כל 2-5 שניות. ה-election מחזיר fencing token (revision ב-etcd / zxid ב-ZK / generation של ה-Lease). כל side effect נושא אותו: טבלת ה-jobs מתעדכנת בתנאי (WHERE epoch קטן מה-token), ו-APIs במורד הזרם מקבלים idempotency key של job-id + זמן מתוזמן. בנוסף ה-leader עוצר עבודה ביוזמתו כשה-lease קרוב לפקוע (בודק לפני כל שלב, עם מרווח ל-clock drift). התוצאה: double-leadership קצר לא מזיק, וזמן ה-failover הוא בערך TTL אחד של lease." }
    },
    {
      q: { en: "Your product team wants 'strong consistency everywhere' for a global app in 3 regions. How do you respond?", he: "צוות המוצר רוצה 'strong consistency בכל מקום' לאפליקציה גלובלית ב-3 regions. מה אתה עונה?" },
      a: { en: "Translate it into user-visible invariants. Usually they need: no double-spend / unique usernames (needs linearizable CAS on a small key space), users seeing their own edits (read-your-writes, cheap), and comments not appearing before posts (causal). Global linearizable writes cost one cross-region quorum per write, 70-150 ms, and the minority region can't write during a partition. So: linearizable only for the narrow critical set (often via a single home region per entity or Spanner-style DB), session consistency for user reads, eventual for feeds and counters. Put numbers on it: p99 write latency and availability under a region partition for each option.", he: "לתרגם את זה לאינווריאנטים שהמשתמש רואה. בדרך כלל מה שצריך זה: אין double-spend / שמות משתמש ייחודיים (דורש CAS שהוא linearizable על מרחב מפתחות קטן), משתמשים רואים את העריכות של עצמם (read-your-writes, זול), ותגובות לא מופיעות לפני הפוסט (causal). writes גלובליים שהם linearizable עולים quorum בין regions בכל write, 70-150 ms, וה-region שבמיעוט לא יכול לכתוב בזמן partition. אז: linearizable רק לסט הקריטי הצר (לרוב דרך home region אחד לכל entity או DB בסגנון Spanner), session consistency ל-reads של משתמשים, eventual ל-feeds ו-counters. ולשים מספרים: p99 של latency ל-write וזמינות בזמן partition של region לכל אופציה." }
    },
    {
      q: { en: "Why does a 5-node etcd cluster sometimes have worse write latency than a 3-node one, and when would you still choose 5?", he: "למה ל-etcd עם 5 nodes לפעמים יש latency גרוע יותר ל-writes מאשר ל-3 nodes, ומתי בכל זאת תבחר 5?" },
      a: { en: "Commit needs a majority to fsync: 3 of 5 instead of 2 of 3, and the leader fans out to 4 followers, so p99 is governed by a slower order statistic and more network/CPU on the leader. You choose 5 when you must survive 2 simultaneous failures, e.g. one AZ down for maintenance while another node fails, or for 5-AZ / multi-region quorums. Never 7+ for etcd; scale reads with serializable reads or caches, not members.", he: "commit צריך שרוב יעשה fsync: 3 מתוך 5 במקום 2 מתוך 3, וה-leader שולח ל-4 followers, אז ה-p99 נקבע ע״י order statistic איטי יותר ויש יותר עומס רשת/CPU על ה-leader. בוחרים 5 כשחייבים לשרוד 2 כשלים בו-זמנית, למשל AZ אחד בתחזוקה ועוד node נופל, או ל-quorum על 5 AZs / multi-region. אף פעם לא 7+ ב-etcd; את ה-reads מגדילים עם serializable reads או caches, לא עם עוד members." }
    }
  ],
  quiz: [
    {
      q: { en: "N=3 replicas, W=2. What is the smallest R that guarantees read and write sets overlap?", he: "N=3 replicas, W=2. מה ה-R הקטן ביותר שמבטיח חפיפה בין קבוצות קריאה וכתיבה?" },
      options: [
        { en: "1", he: "1" },
        { en: "2", he: "2" },
        { en: "3", he: "3" },
        { en: "Overlap is impossible with N=3", he: "חפיפה בלתי אפשרית עם N=3" }
      ],
      answer: 1,
      explain: { en: "R + W must exceed N: 2 + 2 = 4, which is more than 3. With R=1, the single replica read might be the one that missed the write.", he: "R + W צריך להיות גדול מ-N: 2 + 2 = 4, יותר מ-3. עם R=1, ה-replica היחידה שנקראה עלולה להיות בדיוק זו שפספסה את ה-write." }
    },
    {
      q: { en: "A ZooKeeper client writes a znode and immediately reads it through a different server, getting the old value. Why?", he: "לקוח ZooKeeper כותב znode ומיד קורא אותו דרך שרת אחר, ומקבל את הערך הישן. למה?" },
      options: [
        { en: "ZooKeeper is eventually consistent for writes", he: "ZooKeeper הוא eventually consistent ב-writes" },
        { en: "Reads are served locally by each server, so they are sequentially consistent, not linearizable; call sync first", he: "Reads מוגשים מקומית ע״י כל שרת, אז הם sequentially consistent ולא linearizable; צריך לקרוא ל-sync קודם" },
        { en: "The session expired", he: "ה-session פג" },
        { en: "The write was not committed", he: "ה-write לא עשה commit" }
      ],
      answer: 1,
      explain: { en: "ZK writes are linearizable via the leader, but a follower may not have applied the latest commit yet. sync() makes the server catch up with the leader before the read. (Within one session, ZK does guarantee you see your own writes; this case involves a different server/session.)", he: "ה-writes ב-ZK הם linearizable דרך ה-leader, אבל follower אולי עוד לא יישם את ה-commit האחרון. sync() גורם לשרת להשלים פער מול ה-leader לפני ה-read. (בתוך אותו session, ZK כן מבטיח שתראה את ה-writes שלך; כאן מדובר בשרת/session אחר.)" }
    },
    {
      q: { en: "What makes a fencing token actually protect against a paused old lock holder?", he: "מה גורם ל-fencing token באמת להגן מפני מחזיק lock ישן שהיה בהקפאה?" },
      options: [
        { en: "The lock service revokes the old holder's TCP connection", he: "שירות ה-lock מנתק את חיבור ה-TCP של המחזיק הישן" },
        { en: "The client checks its lease before every write", he: "הלקוח בודק את ה-lease שלו לפני כל write" },
        { en: "The protected resource rejects writes carrying a token lower than the highest it has seen", he: "המשאב המוגן דוחה writes עם token נמוך מהגבוה ביותר שכבר ראה" },
        { en: "Tokens are signed with a private key", he: "ה-tokens חתומים במפתח פרטי" }
      ],
      answer: 2,
      explain: { en: "The client can be paused between its check and its write, so client-side checks are not enough. Safety comes from the resource enforcing monotonicity.", he: "הלקוח יכול לקפוא בין הבדיקה לבין ה-write, אז בדיקה בצד הלקוח לא מספיקה. הבטיחות מגיעה מזה שהמשאב אוכף מונוטוניות." }
    },
    {
      q: { en: "In Raft, what does a leader do when it receives an RPC with a higher term?", he: "ב-Raft, מה leader עושה כשהוא מקבל RPC עם term גבוה יותר?" },
      options: [
        { en: "Rejects it and keeps leading", he: "דוחה אותו וממשיך להוביל" },
        { en: "Immediately steps down to follower and adopts the higher term", he: "יורד מיד ל-follower ומאמץ את ה-term הגבוה" },
        { en: "Starts a new election with term + 1", he: "מתחיל בחירות חדשות עם term + 1" },
        { en: "Forces the sender to truncate its log", he: "מכריח את השולח לקצר את ה-log שלו" }
      ],
      answer: 1,
      explain: { en: "A higher term proves a newer election happened. Stepping down is how a deposed leader stops (though it may still act until it hears that term, which is why fencing exists).", he: "term גבוה יותר מוכיח שהתקיימו בחירות חדשות. ירידה מהתפקיד היא הדרך שבה leader מודח נעצר (אבל עד ששמע על ה-term הוא עדיין עלול לפעול – ובגלל זה צריך fencing)." }
    }
  ],
  related: ["db-cap", "db-replication", "rel-ha", "k8s-architecture", "staff-time-ordering"]
});

// ---------------------------------------------------------------------------
// 2. Time, clocks & ordering
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-time-ordering",
  track: "staff",
  order: 2,
  icon: "⏱️",
  level: 3,
  minutes: 16,
  title: {
    en: "Time & Ordering: Clock Skew, Lamport/Vector Clocks, HLC, TrueTime, Leases",
    he: "זמן וסדר: Clock Skew, שעוני Lamport/Vector, HLC, TrueTime ו-Leases"
  },
  tldr: {
    en: "Wall clocks on different machines disagree by milliseconds and can jump backwards, so never order events or expire locks by comparing timestamps from different hosts; use logical clocks for causality, HLC for 'causal plus close to real time', and bounded uncertainty (TrueTime) when you truly need real-time order.",
    he: "שעוני קיר במכונות שונות לא מסכימים ביניהם במילישניות ויכולים לקפוץ אחורה, אז אף פעם לא מסדרים אירועים או מפקיעים locks לפי השוואת timestamps ממכונות שונות. משתמשים בשעונים לוגיים בשביל סיבתיות, ב-HLC בשביל 'סיבתי וגם קרוב לזמן אמיתי', ובאי-ודאות חסומה (TrueTime) כשבאמת צריך סדר של זמן אמיתי."
  },
  analogy: {
    en: "Ten people with ten cheap wristwatches each write the time on the notes they pass around. You cannot sort the notes by those times: one watch is 3 minutes fast. A Lamport clock is a rule: 'write a number one higher than any number you have seen'. That ordering never contradicts who-saw-what. TrueTime is everyone carrying an atomic watch that says 'it is 12:00:00, plus or minus 4 ms' and politely waiting 4 ms before announcing anything.",
    he: "עשרה אנשים עם עשרה שעוני יד זולים כותבים את השעה על פתקים שהם מעבירים. אי אפשר למיין את הפתקים לפי השעות האלה: שעון אחד ממהר ב-3 דקות. שעון Lamport הוא כלל: 'תכתוב מספר אחד יותר גבוה מכל מספר שראית'. הסדר הזה אף פעם לא סותר את מי-ראה-מה. TrueTime זה שכל אחד מחזיק שעון אטומי שאומר 'השעה 12:00:00, פלוס-מינוס 4 ms' ומחכה בנימוס 4 ms לפני שהוא מכריז על משהו."
  },
  sections: [
    {
      h: { en: "Why wall clocks lie", he: "למה שעוני קיר משקרים" },
      body: {
        en: `<p>Every server has a quartz oscillator that drifts ~10-200 ppm: 200 ppm is up to <strong>17 seconds per day</strong>. NTP disciplines it, but:</p>
<ul>
<li><strong>Skew:</strong> NTP over the public internet keeps hosts within ~1-50 ms; inside a cloud with a local time source (AWS Time Sync at 169.254.169.123, GCP metadata NTP, Azure host time) typically under 1 ms; AWS now offers microsecond-accurate PTP on supported instances.</li>
<li><strong>Steps and jumps:</strong> if the offset is large (chrony <code>makestep</code>, or a VM resumed from pause/snapshot), the clock <em>jumps</em>, possibly backwards. <code>time.Now()</code> called twice can go down.</li>
<li><strong>Leap seconds:</strong> the 2012 leap second livelocked Linux kernels (hrtimer bug) and took down Reddit, Mozilla and Cassandra clusters; the 2016 one broke Cloudflare DNS (negative duration). Clouds now <em>smear</em> the leap second over 24 h.</li>
<li><strong>Pauses:</strong> a process can be frozen for seconds (GC, swap, VM steal, SIGSTOP) between reading the clock and acting on it.</li>
</ul>
<p>Two clocks, two jobs:</p>
<table>
<tr><th>Clock</th><th>Linux</th><th>Use it for</th><th>Never for</th></tr>
<tr><td>Wall / real-time</td><td><code>CLOCK_REALTIME</code></td><td>Showing a timestamp to humans, log lines, cross-host approximate correlation</td><td>Measuring durations, ordering events across hosts</td></tr>
<tr><td>Monotonic</td><td><code>CLOCK_MONOTONIC</code></td><td>Timeouts, latency measurement, lease countdown on one host</td><td>Comparing between hosts (arbitrary origin)</td></tr>
</table>
<blockquote>⚠️ Production tip: alert on clock offset. With chrony: <code>chronyc tracking</code> shows "System time: 0.000012 seconds fast". Export it (node_exporter <code>node_timex_offset_seconds</code>) and page if any host exceeds ~100 ms; Cassandra, Kerberos (5 min), TLS validation and JWT <code>nbf/exp</code> all break with skew.</blockquote>`,
        he: `<p>לכל שרת יש מתנד quartz שזז ב-10-200 ppm בערך: 200 ppm זה עד <strong>17 שניות ביום</strong>. NTP מתקן אותו, אבל:</p>
<ul>
<li><strong>Skew:</strong> NTP דרך האינטרנט הציבורי מחזיק hosts בטווח של 1-50 ms בערך. בתוך ענן עם מקור זמן מקומי (AWS Time Sync ב-169.254.169.123, NTP של ה-metadata ב-GCP, host time ב-Azure) בדרך כלל מתחת ל-1 ms; ו-AWS מציעה היום PTP ברמת מיקרו-שניות על instances נתמכים.</li>
<li><strong>קפיצות:</strong> אם ה-offset גדול (<code>makestep</code> של chrony, או VM שחזר מ-pause/snapshot), השעון <em>קופץ</em>, ואולי אחורה. <code>time.Now()</code> שנקרא פעמיים יכול לרדת.</li>
<li><strong>Leap seconds:</strong> ה-leap second של 2012 הכניס kernels של Linux ל-livelock (באג ב-hrtimer) והפיל את Reddit, Mozilla וקלאסטרים של Cassandra; זה של 2016 שבר את ה-DNS של Cloudflare (duration שלילי). העננים היום <em>מורחים</em> (smear) את ה-leap second על 24 שעות.</li>
<li><strong>הקפאות:</strong> תהליך יכול לקפוא לשניות (GC, swap, VM steal, SIGSTOP) בין קריאת השעון לבין הפעולה.</li>
</ul>
<p>שני שעונים, שני תפקידים:</p>
<table>
<tr><th>שעון</th><th>Linux</th><th>משתמשים בו ל-</th><th>אף פעם לא ל-</th></tr>
<tr><td>Wall / real-time</td><td><code>CLOCK_REALTIME</code></td><td>להציג timestamp לבני אדם, שורות לוג, קורלציה מקורבת בין hosts</td><td>מדידת משכי זמן, סידור אירועים בין hosts</td></tr>
<tr><td>Monotonic</td><td><code>CLOCK_MONOTONIC</code></td><td>Timeouts, מדידת latency, ספירה לאחור של lease על host אחד</td><td>השוואה בין hosts (נקודת התחלה שרירותית)</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: תעשו alert על clock offset. עם chrony: <code>chronyc tracking</code> מראה "System time: 0.000012 seconds fast". מייצאים את זה (ב-node_exporter זה <code>node_timex_offset_seconds</code>) ומקפיצים page אם host כלשהו עובר ~100 ms. Cassandra, Kerberos (5 דקות), אימות TLS ו-<code>nbf/exp</code> של JWT נשברים כולם עם skew.</blockquote>`
      }
    },
    {
      h: { en: "Logical clocks: Lamport and vector clocks", he: "שעונים לוגיים: Lamport ו-vector clocks" },
      body: {
        en: `<p>Lamport (1978) defined <strong>happened-before</strong> (→): a→b if they are on the same process in order, or a is a send and b the matching receive, or transitively. Otherwise the events are <strong>concurrent</strong>.</p>
<p><strong>Lamport clock:</strong> each node keeps a counter <code>L</code>. On local event or send: <code>L = L + 1</code>. On receive of message stamped <code>m</code>: <code>L = max(L, m) + 1</code>. Guarantee: if a→b then L(a) &lt; L(b). Ties broken by node id give a total order consistent with causality (used for total-order broadcast, mutual exclusion). But the converse is false: L(a) &lt; L(b) does <em>not</em> tell you a caused b.</p>
<p><strong>Vector clock:</strong> each node keeps a vector with one counter per node. Increment your own slot on each event; on receive take the element-wise max, then increment. Now you can detect concurrency exactly:</p>
<pre>A: [2,0,0]   B: [2,1,0]  -&gt; A &lt;= B element-wise: A happened-before B
C: [1,0,1]   B: [2,1,0]  -&gt; neither dominates: CONCURRENT -&gt; conflict!

Dynamo / Riak: two siblings with concurrent vectors are both returned
to the client, which must merge (e.g. union of shopping carts).</pre>
<p>Cost: O(N) per value where N = number of writers. Riak bounded it with "dotted version vectors" keyed by replica, not client. Use vector clocks when you need to <em>detect</em> conflicts instead of silently picking a winner.</p>`,
        he: `<p>Lamport (1978) הגדיר <strong>happened-before</strong> (→): a→b אם הם באותו תהליך ובסדר הזה, או ש-a הוא שליחה ו-b הקבלה המתאימה, או בטרנזיטיביות. אחרת האירועים <strong>מקבילים</strong> (concurrent).</p>
<p><strong>שעון Lamport:</strong> כל node מחזיק counter <code>L</code>. באירוע מקומי או בשליחה: <code>L = L + 1</code>. בקבלת הודעה עם חותמת <code>m</code>: <code>L = max(L, m) + 1</code>. ההבטחה: אם a→b אז L(a) &lt; L(b). שבירת שוויון לפי node id נותנת סדר מלא שעקבי עם סיבתיות (משמש ל-total-order broadcast, mutual exclusion). אבל הכיוון ההפוך לא נכון: L(a) &lt; L(b) <em>לא</em> אומר ש-a גרם ל-b.</p>
<p><strong>Vector clock:</strong> כל node מחזיק וקטור עם counter לכל node. מעלים את התא שלך בכל אירוע; בקבלה לוקחים max לפי איברים ואז מעלים. עכשיו אפשר לזהות מקביליות בדיוק:</p>
<pre>A: [2,0,0]   B: [2,1,0]  -&gt; A &lt;= B element-wise: A happened-before B
C: [1,0,1]   B: [2,1,0]  -&gt; neither dominates: CONCURRENT -&gt; conflict!

Dynamo / Riak: two siblings with concurrent vectors are both returned
to the client, which must merge (e.g. union of shopping carts).</pre>
<p>המחיר: O(N) לכל ערך, כש-N = מספר הכותבים. Riak הגבילה את זה עם "dotted version vectors" לפי replica ולא לפי לקוח. משתמשים ב-vector clocks כשצריך <em>לזהות</em> קונפליקטים במקום לבחור מנצח בשקט.</p>`
      }
    },
    {
      h: { en: "Hybrid Logical Clocks and TrueTime", he: "Hybrid Logical Clocks ו-TrueTime" },
      body: {
        en: `<p><strong>HLC</strong> (Kulkarni et al., 2014; used by CockroachDB, YugabyteDB, MongoDB cluster time) is a 64-bit-ish timestamp <code>(physical, logical)</code>: the physical part tracks the max wall-clock seen, the logical counter breaks ties and absorbs skew. It gives you Lamport's causality guarantee <em>and</em> timestamps that stay within the clock skew bound of real time, so they are human-meaningful and usable for MVCC snapshots.</p>
<pre>on send/local:   pt = now(); l' = max(l, pt);  c = (l' == l) ? c+1 : 0;  l = l'
on receive (lm,cm): l' = max(l, lm, now()); c = tie-break on which max won</pre>
<p>CockroachDB assumes a <strong>max clock offset</strong> (default 500 ms, <code>--max-offset</code>). Reads use an <em>uncertainty interval</em> <code>[ts, ts + max_offset]</code>: if it sees a value in that window it cannot know whether it is in the past or future, so it restarts the read at a higher timestamp ("ReadWithinUncertaintyIntervalError"). A node whose clock drifts beyond 80% of max-offset relative to peers <strong>kills itself</strong> rather than risk violating serializability.</p>
<p><strong>Google TrueTime</strong> (Spanner) exposes <code>TT.now() = [earliest, latest]</code> backed by GPS receivers and atomic clocks in every datacenter; the uncertainty ε is typically 1-7 ms. Spanner's <strong>commit wait</strong>: pick commit timestamp <code>s = TT.now().latest</code>, then wait until <code>TT.now().earliest &gt; s</code> (about 2ε) before releasing locks and acknowledging. Now any transaction that starts after this one commits is guaranteed a larger timestamp: <strong>external consistency</strong> (strict serializability) without coordination on reads. Your write latency includes ~2ε; that is why investing in better clocks directly buys lower latency.</p>
<blockquote>💡 Real world: AWS published (2023) the Amazon Time Sync Service with microsecond accuracy and ClockBound, an open-source daemon that exposes TrueTime-style <code>[earliest, latest]</code> to your app. Aurora DSQL and DynamoDB global tables use these bounded clocks internally.</blockquote>`,
        he: `<p><strong>HLC</strong> (Kulkarni ואחרים, 2014; בשימוש ב-CockroachDB, YugabyteDB, ה-cluster time של MongoDB) הוא timestamp בערך של 64 ביט מהצורה <code>(physical, logical)</code>: החלק הפיזי עוקב אחרי שעון הקיר המקסימלי שנראה, וה-counter הלוגי שובר שוויון וסופג skew. הוא נותן את הבטחת הסיבתיות של Lamport <em>וגם</em> timestamps שנשארים בטווח ה-skew מהזמן האמיתי, אז יש להם משמעות לבני אדם ואפשר להשתמש בהם ל-snapshots של MVCC.</p>
<pre>on send/local:   pt = now(); l' = max(l, pt);  c = (l' == l) ? c+1 : 0;  l = l'
on receive (lm,cm): l' = max(l, lm, now()); c = tie-break on which max won</pre>
<p>CockroachDB מניח <strong>max clock offset</strong> (ברירת מחדל 500 ms, <code>--max-offset</code>). Reads משתמשים ב-<em>uncertainty interval</em> של <code>[ts, ts + max_offset]</code>: אם הוא רואה ערך בחלון הזה הוא לא יכול לדעת אם זה בעבר או בעתיד, אז הוא מתחיל את ה-read מחדש ב-timestamp גבוה יותר ("ReadWithinUncertaintyIntervalError"). node שהשעון שלו זז מעבר ל-80% מה-max-offset ביחס לשכנים <strong>מתאבד</strong> במקום להסתכן בשבירת serializability.</p>
<p><strong>Google TrueTime</strong> (Spanner) חושף <code>TT.now() = [earliest, latest]</code>, מגובה ע״י מקלטי GPS ושעונים אטומיים בכל דאטה-סנטר; אי-הוודאות ε היא בדרך כלל 1-7 ms. ה-<strong>commit wait</strong> של Spanner: בוחרים commit timestamp <code>s = TT.now().latest</code>, ואז מחכים עד ש-<code>TT.now().earliest &gt; s</code> (בערך 2ε) לפני ששחררים locks ומחזירים ack. עכשיו כל טרנזקציה שמתחילה אחרי שזו עשתה commit מקבלת בוודאות timestamp גדול יותר: <strong>external consistency</strong> (strict serializability) בלי תיאום ב-reads. ה-latency של ה-write כולל בערך 2ε – ולכן השקעה בשעונים טובים יותר קונה ישירות latency נמוך יותר.</p>
<blockquote>💡 מהשטח: AWS פרסמה (2023) את Amazon Time Sync Service עם דיוק של מיקרו-שניות ואת ClockBound, daemon בקוד פתוח שחושף לאפליקציה שלך <code>[earliest, latest]</code> בסגנון TrueTime. Aurora DSQL ו-DynamoDB global tables משתמשים בשעונים החסומים האלה בפנים.</blockquote>`
      }
    },
    {
      h: { en: "Leases: time-bounded authority", he: "Leases: סמכות מוגבלת בזמן" },
      body: {
        en: `<p>A <strong>lease</strong> is a lock that expires on its own, so a crashed holder does not block the system forever. Used for leader election (Kubernetes <code>coordination.k8s.io/v1 Lease</code>, etcd leases), read leases (a Raft leader serving reads locally while its lease is valid), and cache invalidation.</p>
<p>Leases are safe only under assumptions about <em>clock rate</em>, not absolute time:</p>
<ul>
<li>Holder and grantor measure the lease with <strong>monotonic</strong> clocks starting from a known event. The holder starts its countdown <em>before</em> sending the request; the grantor starts after granting, so the holder always believes it expires first.</li>
<li>Subtract a safety margin for max drift rate (e.g. lease 10 s, holder treats it as 9 s).</li>
<li>Still assume the holder can pause past expiry: combine with fencing tokens for anything that mutates shared state.</li>
</ul>
<pre>apiVersion: coordination.k8s.io/v1
kind: Lease
metadata: { name: kube-controller-manager, namespace: kube-system }
spec:
  holderIdentity: cp-node-2_7f1c...
  leaseDurationSeconds: 15     # --leader-elect-lease-duration
  renewTime: "2026-11-12T09:14:03.120000Z"
  leaseTransitions: 4          # how many times leadership moved
# client-go defaults: lease 15s, renew deadline 10s, retry period 2s</pre>
<blockquote>💡 Real world: <code>kubectl get lease -n kube-system</code> shows which control-plane node is the active controller-manager and scheduler. A rising <code>leaseTransitions</code> is an early sign of etcd latency or API server overload.</blockquote>`,
        he: `<p><strong>Lease</strong> הוא lock שפג מעצמו, כך שמחזיק שקרס לא חוסם את המערכת לנצח. משתמשים בו ל-leader election (<code>coordination.k8s.io/v1 Lease</code> ב-Kubernetes, leases ב-etcd), ל-read leases (leader של Raft שמגיש reads מקומית כל עוד ה-lease שלו בתוקף), ול-cache invalidation.</p>
<p>Leases בטוחים רק תחת הנחות על <em>קצב</em> השעון, לא על זמן מוחלט:</p>
<ul>
<li>המחזיק והמעניק מודדים את ה-lease עם שעונים <strong>monotonic</strong> מאירוע ידוע. המחזיק מתחיל לספור <em>לפני</em> שהוא שולח את הבקשה; המעניק מתחיל אחרי שהעניק – כך שהמחזיק תמיד חושב שהוא פג קודם.</li>
<li>מורידים מרווח ביטחון לקצב drift מקסימלי (למשל lease של 10 שניות, המחזיק מתייחס אליו כאל 9).</li>
<li>ועדיין מניחים שהמחזיק יכול לקפוא אחרי שזה פג: משלבים fencing tokens לכל דבר שמשנה state משותף.</li>
</ul>
<pre>apiVersion: coordination.k8s.io/v1
kind: Lease
metadata: { name: kube-controller-manager, namespace: kube-system }
spec:
  holderIdentity: cp-node-2_7f1c...
  leaseDurationSeconds: 15     # --leader-elect-lease-duration
  renewTime: "2026-11-12T09:14:03.120000Z"
  leaseTransitions: 4          # how many times leadership moved
# client-go defaults: lease 15s, renew deadline 10s, retry period 2s</pre>
<blockquote>💡 מהשטח: <code>kubectl get lease -n kube-system</code> מראה איזה node ב-control plane הוא ה-controller-manager וה-scheduler הפעילים. <code>leaseTransitions</code> שעולה הוא סימן מוקדם ל-latency ב-etcd או לעומס על ה-API server.</blockquote>`
      }
    },
    {
      h: { en: "Practical ordering patterns", he: "דפוסי סידור פרקטיים" },
      body: {
        en: `<ul>
<li><strong>Single writer per key → use its sequence.</strong> A Kafka partition offset, a Postgres LSN, a Raft index or a DB sequence gives a total order for free. Most "ordering" problems disappear when you route all updates for an entity to one partition/leader.</li>
<li><strong>Version numbers, not timestamps, for concurrency control.</strong> <code>UPDATE ... SET v = v + 1 WHERE id = ? AND v = ?</code>. Elasticsearch <code>if_seq_no/if_primary_term</code>, DynamoDB conditional writes, K8s resourceVersion, HTTP <code>If-Match: ETag</code>.</li>
<li><strong>Last-write-wins needs a trustworthy clock.</strong> Cassandra LWW uses client/coordinator microsecond timestamps: a node 2 s fast wins every conflict for 2 s, silently dropping newer writes. If you must use LWW, use HLC timestamps or a single sequencer.</li>
<li><strong>Snowflake-style IDs</strong> (41-bit ms timestamp + 10-bit worker + 12-bit sequence = 4096 IDs/ms/worker) are roughly time-sortable but only k-sorted: across workers, order is only as good as clock sync. Must refuse to generate when the clock goes backwards.</li>
<li><strong>Distributed tracing</strong> span timestamps from different hosts can show a child starting before its parent; trace UIs clamp this. Do not debug causality by comparing log timestamps from two hosts at sub-10 ms precision.</li>
</ul>`,
        he: `<ul>
<li><strong>כותב יחיד לכל key ← משתמשים ברצף שלו.</strong> offset של partition ב-Kafka, LSN של Postgres, index של Raft או sequence ב-DB נותנים סדר מלא בחינם. רוב בעיות ה"סידור" נעלמות כשמנתבים את כל העדכונים של entity ל-partition/leader אחד.</li>
<li><strong>מספרי גרסה, לא timestamps, ל-concurrency control.</strong> <code>UPDATE ... SET v = v + 1 WHERE id = ? AND v = ?</code>. ב-Elasticsearch זה <code>if_seq_no/if_primary_term</code>, ב-DynamoDB conditional writes, ב-K8s ה-resourceVersion, וב-HTTP <code>If-Match: ETag</code>.</li>
<li><strong>Last-write-wins צריך שעון אמין.</strong> LWW ב-Cassandra משתמש ב-timestamps של מיקרו-שניות מהלקוח/coordinator: node שממהר ב-2 שניות מנצח כל קונפליקט במשך 2 שניות ומעיף בשקט writes חדשים יותר. אם חייבים LWW – timestamps של HLC או sequencer יחיד.</li>
<li><strong>IDs בסגנון Snowflake</strong> (41 ביט timestamp במילישניות + 10 ביט worker + 12 ביט sequence = 4096 IDs למילישנייה ל-worker) ניתנים למיון לפי זמן רק בערך (k-sorted): בין workers הסדר טוב רק כמו סנכרון השעונים. חייבים לסרב לייצר כשהשעון זז אחורה.</li>
<li><strong>Distributed tracing:</strong> timestamps של spans מ-hosts שונים יכולים להראות child שמתחיל לפני ה-parent שלו; ממשקי tracing מתקנים את זה. לא מדבגים סיבתיות ע״י השוואת timestamps בלוגים משני hosts ברזולוציה של פחות מ-10 ms.</li>
</ul>`
      }
    }
  ],
  diagram: `Lamport:   P1  a(1) ----send(2)----------------------->
           P2               \\-> recv max(0,2)+1 = 3 --> b(4)
           a -> b  =>  L(a)=1 < L(b)=4   (converse NOT guaranteed)

Vector:    [2,0,0] vs [2,1,0]  -> ordered      [1,0,1] vs [2,1,0] -> CONCURRENT

TrueTime commit wait (eps = 4 ms):
  TT.now() = [t-4, t+4]  pick s = t+4
  |----wait until earliest > s (~8 ms)----| ack, release locks
  any later txn gets ts > s  => external consistency`,
  handsOn: [
    { cmd: "chronyc tracking && chronyc sources -v", what: { en: "See current offset ('System time ... fast/slow'), frequency error in ppm, and which upstream sources chrony trusts. On EC2 you should see 169.254.169.123 selected (marked with *).", he: "לראות את ה-offset הנוכחי ('System time ... fast/slow'), שגיאת התדר ב-ppm ואילו מקורות chrony סומך עליהם. ב-EC2 אמורים לראות את 169.254.169.123 נבחר (מסומן ב-*)." } },
    { cmd: "timedatectl timesync-status 2>/dev/null || timedatectl status", what: { en: "Check whether the host is NTP-synchronized at all (systemd-timesyncd) and its poll interval. 'System clock synchronized: no' on a database node is an incident waiting to happen.", he: "לבדוק אם ה-host בכלל מסונכרן ל-NTP (systemd-timesyncd) ומה ה-poll interval. 'System clock synchronized: no' על node של DB זה תקלה שמחכה לקרות." } },
    { cmd: "kubectl get lease -n kube-system -o custom-columns=NAME:.metadata.name,HOLDER:.spec.holderIdentity,RENEW:.spec.renewTime,TRANSITIONS:.spec.leaseTransitions", what: { en: "See which control-plane instance holds each leader lease and how many times leadership moved.", he: "לראות איזה instance ב-control plane מחזיק כל leader lease וכמה פעמים ההובלה עברה." } },
    { cmd: "for h in db1 db2 db3; do ssh $h 'date +%s.%N'; done", what: { en: "Quick and dirty skew check across hosts. The SSH round trip adds a few ms of noise, which itself demonstrates why you can't compare cross-host timestamps naively.", he: "בדיקת skew מהירה ומלוכלכת בין hosts. ה-round trip של SSH מוסיף כמה ms של רעש – וזה בעצמו מדגים למה אי אפשר להשוות timestamps בין hosts בצורה נאיבית." } },
    { cmd: "cockroach node status --certs-dir=certs --host=crdb-0 --format=table | head; # and check clock-offset.meannanos in DB Console", what: { en: "In CockroachDB, watch the clock offset metric per node; a node approaching 80% of --max-offset will shut itself down to protect consistency.", he: "ב-CockroachDB עוקבים אחרי מדד ה-clock offset לכל node; node שמתקרב ל-80% מה---max-offset יכבה את עצמו כדי להגן על העקביות." } }
  ],
  mnemonic: {
    en: "\"Wall clocks for humans, monotonic for durations, logical for order, bounded for truth.\" Lamport: max plus one.",
    he: "\"שעון קיר לבני אדם, monotonic למשכי זמן, לוגי לסדר, חסום בשביל האמת.\" Lamport: מקסימום ועוד אחד."
  },
  pitfalls: [
    { en: "Measuring timeouts or latency with the wall clock (Date.now(), time.time()). An NTP step makes durations negative or huge; use the monotonic clock (performance.now(), time.monotonic(), Go's time.Since uses monotonic automatically).", he: "למדוד timeouts או latency עם שעון הקיר (Date.now(), time.time()). step של NTP הופך משכי זמן לשליליים או ענקיים; משתמשים בשעון monotonic (performance.now(), time.monotonic(), ו-time.Since ב-Go משתמש ב-monotonic אוטומטית)." },
    { en: "Using LWW conflict resolution with unsynchronized clocks. The node with the fastest clock silently wins, and acknowledged writes disappear without any error.", he: "להשתמש ב-LWW לפתרון קונפליקטים עם שעונים לא מסונכרנים. ה-node עם השעון המהיר ביותר מנצח בשקט, ו-writes שקיבלו ack נעלמים בלי שום שגיאה." },
    { en: "Ordering events from different services by their log timestamps during an incident. With 5-20 ms skew the 'cause' can appear after the 'effect'; correlate by trace ID and causal links instead.", he: "לסדר אירועים משירותים שונים לפי timestamps בלוגים בזמן תקלה. עם skew של 5-20 ms ה'סיבה' יכולה להופיע אחרי ה'תוצאה'; עושים קורלציה לפי trace ID וקשרים סיבתיים." },
    { en: "Not monitoring clock offset. Kerberos fails at 5 min, Cassandra LWW corrupts at milliseconds, CockroachDB nodes self-terminate: all silently until they don't.", he: "לא לנטר clock offset. Kerberos נכשל ב-5 דקות, LWW ב-Cassandra משחית דאטה כבר במילישניות, nodes של CockroachDB מתאבדים – הכול בשקט עד שלא." }
  ],
  interview: [
    {
      q: { en: "Why does Spanner need atomic clocks and commit wait, while CockroachDB runs on ordinary NTP? What does each give up?", he: "למה Spanner צריך שעונים אטומיים ו-commit wait, בזמן ש-CockroachDB רץ על NTP רגיל? על מה כל אחד מוותר?" },
      a: { en: "Spanner wants external consistency (strict serializability) with lock-free snapshot reads. It gets it by waiting out the clock uncertainty ε on every commit, so ε must be tiny (few ms), hence GPS/atomic clocks. CockroachDB cannot assume a small ε (default max-offset 500 ms), so it can't commit-wait. Instead it uses HLC plus uncertainty intervals: reads that hit a value in [ts, ts+max_offset] restart at a higher timestamp. It provides serializability and linearizability per key, but not strict serializability across unrelated keys (the 'causal reverse' anomaly is possible), and pays with occasional read restarts. Both rely on clocks for correctness, and CRDB nodes self-terminate if their offset gets too large.", he: "Spanner רוצה external consistency (strict serializability) עם snapshot reads בלי locks. הוא משיג את זה ע״י המתנה לאי-הוודאות ε של השעון בכל commit, אז ε חייב להיות זעיר (כמה ms) – ומכאן GPS ושעונים אטומיים. CockroachDB לא יכול להניח ε קטן (ה-max-offset ברירת המחדל הוא 500 ms), אז הוא לא יכול לעשות commit wait. במקום זה הוא משתמש ב-HLC ו-uncertainty intervals: read שנתקל בערך בטווח [ts, ts+max_offset] מתחיל מחדש ב-timestamp גבוה יותר. הוא נותן serializability ו-linearizability לכל key, אבל לא strict serializability בין keys לא קשורים (האנומליה 'causal reverse' אפשרית), ומשלם ב-read restarts מדי פעם. שניהם תלויים בשעונים לנכונות, ו-nodes של CRDB מתאבדים אם ה-offset שלהם גדל מדי." }
    },
    {
      q: { en: "Two microservices each append to a shared audit log with their own timestamps. Auditors complain the order is sometimes wrong. How do you fix it?", he: "שני מיקרו-שירותים כותבים ל-audit log משותף, כל אחד עם ה-timestamps שלו. המבקרים מתלוננים שהסדר לפעמים שגוי. איך מתקנים?" },
      a: { en: "First define which order matters: usually causal order per entity, not a global real-time order. Options: (1) route every event for an entity through one Kafka partition keyed by entity id, and use the offset as the order; (2) propagate a Lamport/HLC timestamp in request headers so a downstream event always sorts after its cause; (3) if a global total order is needed, a single sequencer (DB sequence) at the cost of a hop and a bottleneck. Keep the wall-clock timestamp only as a display field, and document the skew bound.", he: "קודם להגדיר איזה סדר חשוב: בדרך כלל סדר סיבתי לכל entity, לא סדר גלובלי בזמן אמיתי. אפשרויות: (1) לנתב כל אירוע של entity דרך partition אחד ב-Kafka עם key של entity id, ולהשתמש ב-offset כסדר; (2) להעביר timestamp של Lamport/HLC ב-headers של הבקשות כך שאירוע במורד הזרם תמיד ימוין אחרי הסיבה שלו; (3) אם באמת צריך סדר מלא גלובלי – sequencer יחיד (sequence ב-DB) במחיר של hop נוסף ו-bottleneck. את ה-timestamp של שעון הקיר משאירים רק כשדה לתצוגה, ומתעדים את גבול ה-skew." }
    },
    {
      q: { en: "How long should a leader lease be? Walk through the trade-off.", he: "כמה ארוך צריך להיות leader lease? תעבור על ה-trade-off." },
      a: { en: "Short leases (2-5 s) give fast failover but risk false failovers from GC pauses, API latency spikes or a slow etcd fsync, causing leadership flapping and duplicated work. Long leases (30-60 s) are stable but mean up to a minute of unavailability when the leader really dies. Typical: 10-15 s lease, renew every 2-3 s, renew deadline ~2/3 of the lease, and fencing tokens so a too-short lease is a liveness bug, not a correctness bug. Tune from data: measure p99.9 of the renew latency and pause times, and set the lease well above it.", he: "Leases קצרים (2-5 שניות) נותנים failover מהיר אבל מסתכנים ב-failovers שווא בגלל GC pauses, קפיצות latency ב-API או fsync איטי ב-etcd – מה שגורם ל-leadership flapping ועבודה כפולה. Leases ארוכים (30-60 שניות) יציבים, אבל אומרים עד דקה של חוסר זמינות כשה-leader באמת מת. מקובל: lease של 10-15 שניות, חידוש כל 2-3 שניות, renew deadline של בערך 2/3 מה-lease, ו-fencing tokens כך ש-lease קצר מדי הוא באג של liveness ולא של נכונות. מכווננים לפי דאטה: מודדים p99.9 של latency החידוש ושל ה-pauses, וקובעים lease הרבה מעל זה." }
    }
  ],
  quiz: [
    {
      q: { en: "Which clock should you use to implement a 5-second request timeout?", he: "באיזה שעון צריך להשתמש כדי לממש timeout של 5 שניות לבקשה?" },
      options: [
        { en: "CLOCK_REALTIME synced by NTP", he: "CLOCK_REALTIME שמסונכרן ע״י NTP" },
        { en: "CLOCK_MONOTONIC", he: "CLOCK_MONOTONIC" },
        { en: "A Lamport clock", he: "שעון Lamport" },
        { en: "The database server's NOW()", he: "ה-NOW() של שרת ה-DB" }
      ],
      answer: 1,
      explain: { en: "Durations need a clock that never jumps. The real-time clock can be stepped by NTP; a Lamport clock has no relation to seconds.", he: "משכי זמן צריכים שעון שלעולם לא קופץ. שעון ה-real-time יכול לזוז ב-step של NTP; לשעון Lamport אין קשר לשניות." }
    },
    {
      q: { en: "Vector clocks [3,1,0] and [2,2,0]. What is the relationship?", he: "Vector clocks של [3,1,0] ו-[2,2,0]. מה הקשר ביניהם?" },
      options: [
        { en: "The first happened before the second", he: "הראשון קרה לפני השני" },
        { en: "The second happened before the first", he: "השני קרה לפני הראשון" },
        { en: "They are concurrent", he: "הם מקבילים (concurrent)" },
        { en: "They are equal", he: "הם שווים" }
      ],
      answer: 2,
      explain: { en: "Neither vector is less-or-equal in every position (3 greater than 2 in slot 1, 1 less than 2 in slot 2), so neither causally precedes the other.", he: "אף וקטור לא קטן-או-שווה בכל המקומות (3 גדול מ-2 בתא הראשון, 1 קטן מ-2 בתא השני), אז אף אחד לא קודם סיבתית לשני." }
    },
    {
      q: { en: "What does Spanner's commit wait achieve?", he: "מה ה-commit wait של Spanner משיג?" },
      options: [
        { en: "It batches commits for throughput", he: "הוא אוסף commits ל-batch בשביל throughput" },
        { en: "It waits for all replicas worldwide to apply the write", he: "הוא מחכה שכל ה-replicas בעולם ייישמו את ה-write" },
        { en: "It ensures the commit timestamp is definitely in the past before acknowledging, giving external consistency", he: "הוא מבטיח שה-commit timestamp בוודאות בעבר לפני ה-ack, וכך נותן external consistency" },
        { en: "It synchronizes NTP before each transaction", he: "הוא מסנכרן NTP לפני כל טרנזקציה" }
      ],
      answer: 2,
      explain: { en: "Waiting ~2ε guarantees that any transaction starting after the ack sees a strictly larger TrueTime, so timestamp order matches real-time order.", he: "המתנה של בערך 2ε מבטיחה שכל טרנזקציה שמתחילה אחרי ה-ack תראה TrueTime גדול ממש, כך שסדר ה-timestamps תואם לסדר הזמן האמיתי." }
    }
  ],
  related: ["staff-consensus-consistency", "db-replication", "db-transactions", "obs-traces", "staff-multi-region-data"]
});

// ---------------------------------------------------------------------------
// 3. Delivery semantics, idempotency, outbox, CDC, sagas
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-exactly-once",
  track: "staff",
  order: 3,
  icon: "🎯",
  level: 3,
  minutes: 18,
  title: {
    en: "Exactly-Once in Practice: Idempotency, Outbox, CDC, Sagas vs 2PC",
    he: "Exactly-Once בפועל: Idempotency, Outbox, CDC, Sagas מול 2PC"
  },
  tldr: {
    en: "Networks only give you at-most-once or at-least-once delivery; 'exactly-once' is at-least-once delivery plus idempotent (or transactional) processing, and the transactional outbox + CDC is how you update a database and publish an event without losing or inventing either.",
    he: "רשתות נותנות רק at-most-once או at-least-once. 'Exactly-once' זה בעצם at-least-once delivery ועוד עיבוד idempotent (או טרנזקציוני), וה-transactional outbox עם CDC הוא הדרך לעדכן DB ולפרסם event בלי לאבד אף אחד מהם ובלי להמציא אחד."
  },
  analogy: {
    en: "You mail a cheque and never hear back. Mail it again and you might pay twice; don't and you might not pay at all. The fix is not a better post office: it is writing a cheque number on it, so the bank cashes cheque #1047 once no matter how many copies arrive. That number is the idempotency key, and the bank's 'already cashed' ledger is the dedup store.",
    he: "שלחת צ'ק בדואר ולא שמעת כלום. תשלח שוב – אולי תשלם פעמיים; לא תשלח – אולי לא שילמת בכלל. הפתרון הוא לא דואר טוב יותר: זה לכתוב מספר צ'ק, כך שהבנק פורע את צ'ק 1047 פעם אחת לא משנה כמה עותקים הגיעו. המספר הזה הוא ה-idempotency key, וספר ה'כבר נפרע' של הבנק הוא ה-dedup store."
  },
  sections: [
    {
      h: { en: "The three semantics and the Two Generals", he: "שלוש הסמנטיקות ושני הגנרלים" },
      body: {
        en: `<p>When a request times out, the sender cannot know whether it was <em>lost before</em> processing, <em>processed</em> with the reply lost, or is <em>still running</em>. This is the Two Generals problem: no finite number of acks fixes it. So the sender must choose:</p>
<table>
<tr><th>Semantics</th><th>Sender behaviour</th><th>Failure outcome</th><th>Typical use</th></tr>
<tr><td><strong>At-most-once</strong></td><td>Send once, never retry (or ack/commit offset <em>before</em> processing)</td><td>Loss</td><td>Metrics, UDP telemetry, some notifications</td></tr>
<tr><td><strong>At-least-once</strong></td><td>Retry until acked (commit offset <em>after</em> processing)</td><td>Duplicates</td><td>Default for SQS, Kafka consumers, webhooks, payments APIs</td></tr>
<tr><td><strong>Exactly-once (effect)</strong></td><td>At-least-once + dedup/idempotent apply, or atomic commit of output + progress</td><td>Neither, within a boundary</td><td>Kafka EOS (read-process-write inside Kafka), Flink checkpoints + 2PC sinks, payments with idempotency keys</td></tr>
</table>
<p>Key phrase for interviews: <strong>"exactly-once processing, not exactly-once delivery"</strong>. The message may be delivered three times; the <em>effect</em> is applied once. And the guarantee only holds inside a boundary you control: once you call an external email API without an idempotency key, all bets are off.</p>`,
        he: `<p>כשבקשה עושה timeout, השולח לא יכול לדעת אם היא <em>אבדה לפני</em> העיבוד, <em>עובדה</em> והתשובה אבדה, או ש<em>היא עדיין רצה</em>. זו בעיית שני הגנרלים: שום מספר סופי של acks לא פותר אותה. אז השולח חייב לבחור:</p>
<table>
<tr><th>סמנטיקה</th><th>התנהגות השולח</th><th>מה קורה בכשל</th><th>שימוש טיפוסי</th></tr>
<tr><td><strong>At-most-once</strong></td><td>שולח פעם אחת, לא עושה retry (או עושה ack/commit ל-offset <em>לפני</em> העיבוד)</td><td>אובדן</td><td>Metrics, טלמטריה ב-UDP, חלק מההתראות</td></tr>
<tr><td><strong>At-least-once</strong></td><td>retry עד שיש ack (commit ל-offset <em>אחרי</em> העיבוד)</td><td>כפילויות</td><td>ברירת המחדל ב-SQS, ב-consumers של Kafka, webhooks, APIs של תשלומים</td></tr>
<tr><td><strong>Exactly-once (effect)</strong></td><td>At-least-once ועוד dedup/apply שהוא idempotent, או commit אטומי של הפלט וההתקדמות ביחד</td><td>אף אחד מהם, בתוך גבול מוגדר</td><td>Kafka EOS (read-process-write בתוך Kafka), checkpoints של Flink עם 2PC sinks, תשלומים עם idempotency keys</td></tr>
</table>
<p>משפט המפתח לראיון: <strong>"exactly-once processing, לא exactly-once delivery"</strong>. ההודעה יכולה להגיע שלוש פעמים; ה<em>אפקט</em> מיושם פעם אחת. וההבטחה מחזיקה רק בתוך גבול שאתה שולט בו: ברגע שקראת ל-API חיצוני של אימייל בלי idempotency key – אין הבטחות.</p>`
      }
    },
    {
      h: { en: "Idempotency keys and dedup windows", he: "Idempotency keys ו-dedup windows" },
      body: {
        en: `<p>Some operations are naturally idempotent (<code>SET status='shipped'</code>, <code>PUT</code>, <code>DELETE</code>). Others are not (<code>balance = balance - 100</code>, <code>POST /charges</code>, "send email"). For those, the client generates a unique key per <em>logical</em> operation (UUIDv4/v7) and reuses it on every retry; the server records it atomically with the effect.</p>
<pre>POST /v1/charges
Idempotency-Key: 7c0e1b2a-5d0f-4b6e-9a51-2f3c8e1d0a77

-- server, in ONE transaction:
INSERT INTO idempotency (key, request_hash, status, response, created_at)
  VALUES ($1, $2, 'in_progress', NULL, now())
  ON CONFLICT (key) DO NOTHING;      -- 0 rows -&gt; seen before: return stored response
UPDATE accounts SET balance = balance - 100 WHERE id = 42;
UPDATE idempotency SET status='done', response=$3 WHERE key=$1;
COMMIT;</pre>
<p>Design details that separate seniors from staff:</p>
<ul>
<li><strong>Same key, different payload</strong> → reject with 422 (store a request hash). Stripe does exactly this.</li>
<li><strong>Concurrent retries</strong> while the first is still in progress → return 409 / "retry later", do not run twice.</li>
<li><strong>Dedup window / TTL:</strong> you can't keep keys forever. Stripe keeps them 24 h; SQS FIFO dedups for 5 min (<code>MessageDeduplicationId</code>); Kafka idempotent producer dedups by (producerId, epoch, sequence) per partition, within the last 5 in-flight batches. Your window must exceed the maximum retry horizon (client retries + queue redelivery + DLQ replay), or replays from a DLQ a day later will double-apply.</li>
<li><strong>Consumer-side dedup:</strong> store processed message ids in the same DB transaction as the side effect (<code>processed_messages(consumer, msg_id) PK</code>). A Redis SETNX with TTL is cheaper but not atomic with your DB write.</li>
<li>Prefer <strong>natural keys</strong> when they exist: order_id + "charge", (account, statement_month). They survive client bugs that regenerate UUIDs.</li>
</ul>`,
        he: `<p>חלק מהפעולות idempotent מטבען (<code>SET status='shipped'</code>, <code>PUT</code>, <code>DELETE</code>). אחרות לא (<code>balance = balance - 100</code>, <code>POST /charges</code>, "שלח מייל"). בשבילן, הלקוח מייצר key ייחודי לכל פעולה <em>לוגית</em> (UUIDv4/v7) ומשתמש בו שוב בכל retry; השרת שומר אותו באופן אטומי יחד עם האפקט.</p>
<pre>POST /v1/charges
Idempotency-Key: 7c0e1b2a-5d0f-4b6e-9a51-2f3c8e1d0a77

-- server, in ONE transaction:
INSERT INTO idempotency (key, request_hash, status, response, created_at)
  VALUES ($1, $2, 'in_progress', NULL, now())
  ON CONFLICT (key) DO NOTHING;      -- 0 rows -&gt; seen before: return stored response
UPDATE accounts SET balance = balance - 100 WHERE id = 42;
UPDATE idempotency SET status='done', response=$3 WHERE key=$1;
COMMIT;</pre>
<p>פרטי עיצוב שמבדילים בין senior ל-staff:</p>
<ul>
<li><strong>אותו key, payload שונה</strong> ← דוחים עם 422 (שומרים hash של הבקשה). Stripe עושים בדיוק את זה.</li>
<li><strong>Retries מקבילים</strong> כשהראשון עוד in progress ← מחזירים 409 / "נסה שוב אחר כך", לא מריצים פעמיים.</li>
<li><strong>Dedup window / TTL:</strong> אי אפשר לשמור keys לנצח. Stripe שומרים 24 שעות; SQS FIFO עושה dedup ל-5 דקות (<code>MessageDeduplicationId</code>); ה-idempotent producer של Kafka עושה dedup לפי (producerId, epoch, sequence) לכל partition, על 5 ה-batches האחרונים שבדרך. החלון שלך חייב להיות ארוך מאופק ה-retry המקסימלי (retries של הלקוח + redelivery של התור + replay מ-DLQ), אחרת replay מ-DLQ יום אחרי יחיל את הפעולה פעמיים.</li>
<li><strong>Dedup בצד ה-consumer:</strong> שומרים את ה-ids של ההודעות שעובדו באותה טרנזקציית DB של ה-side effect (<code>processed_messages(consumer, msg_id) PK</code>). SETNX ב-Redis עם TTL זול יותר, אבל לא אטומי עם ה-write ל-DB.</li>
<li>עדיפים <strong>keys טבעיים</strong> כשיש: order_id + "charge", (account, statement_month). הם שורדים באגים בלקוח שמייצר UUID חדש בכל retry.</li>
</ul>`
      }
    },
    {
      h: { en: "The dual-write problem, transactional outbox and CDC", he: "בעיית ה-dual write, transactional outbox ו-CDC" },
      body: {
        en: `<p>Service saves an order to Postgres and publishes <code>OrderCreated</code> to Kafka. Whatever order you do it in, a crash between the two leaves them inconsistent: an order nobody hears about, or an event for an order that doesn't exist. There is no shared transaction between Postgres and Kafka.</p>
<p><strong>Transactional outbox:</strong> write the event into an <code>outbox</code> table <em>in the same DB transaction</em> as the business change. A separate relay publishes outbox rows to the broker (at-least-once), and consumers dedup by event id.</p>
<pre>BEGIN;
INSERT INTO orders (id, customer_id, total) VALUES ('o-981', 'c-12', 249.00);
INSERT INTO outbox (id, aggregate_type, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), 'order', 'o-981', 'OrderCreated', '{"total":249.00}');
COMMIT;</pre>
<p><strong>Relay options:</strong> (1) a poller (<code>SELECT ... FOR UPDATE SKIP LOCKED LIMIT 500</code>, publish, mark sent): simple, adds DB load and 100 ms-1 s latency; (2) <strong>CDC</strong>: tail the DB's replication log. <strong>Debezium</strong> reads the Postgres WAL via a logical replication slot (pgoutput) or the MySQL binlog, and its <em>Outbox Event Router</em> SMT turns outbox inserts into topic records keyed by aggregate_id.</p>
<pre>{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "plugin.name": "pgoutput",
  "slot.name": "orders_outbox",
  "publication.name": "outbox_pub",
  "table.include.list": "public.outbox",
  "transforms": "outbox",
  "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
  "transforms.outbox.route.by.field": "aggregate_type",
  "transforms.outbox.table.field.event.key": "aggregate_id",
  "heartbeat.interval.ms": "10000"
}</pre>
<blockquote>⚠️ Production tip: a Postgres replication slot whose consumer is down <strong>retains WAL forever</strong> and will fill the disk and take the primary down. Alert on <code>pg_replication_slots</code> retained bytes and set <code>max_slot_wal_keep_size</code> (PG13+, e.g. 50GB) as a circuit breaker. Also: slots don't fail over to a replica before PG17 (failover slots), so plan Debezium re-snapshots after a primary failover.</blockquote>`,
        he: `<p>שירות שומר הזמנה ב-Postgres ומפרסם <code>OrderCreated</code> ל-Kafka. לא משנה באיזה סדר עושים את זה, קריסה בין השניים משאירה אותם לא עקביים: הזמנה שאף אחד לא שומע עליה, או event על הזמנה שלא קיימת. אין טרנזקציה משותפת ל-Postgres ול-Kafka.</p>
<p><strong>Transactional outbox:</strong> כותבים את ה-event לטבלת <code>outbox</code> <em>באותה טרנזקציית DB</em> של השינוי העסקי. relay נפרד מפרסם את השורות מה-outbox ל-broker (at-least-once), וה-consumers עושים dedup לפי event id.</p>
<pre>BEGIN;
INSERT INTO orders (id, customer_id, total) VALUES ('o-981', 'c-12', 249.00);
INSERT INTO outbox (id, aggregate_type, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), 'order', 'o-981', 'OrderCreated', '{"total":249.00}');
COMMIT;</pre>
<p><strong>אפשרויות ל-relay:</strong> (1) poller (<code>SELECT ... FOR UPDATE SKIP LOCKED LIMIT 500</code>, לפרסם, לסמן כנשלח): פשוט, מוסיף עומס על ה-DB ו-latency של 100 ms עד שנייה; (2) <strong>CDC</strong>: לעקוב אחרי ה-replication log של ה-DB. <strong>Debezium</strong> קורא את ה-WAL של Postgres דרך logical replication slot (pgoutput) או את ה-binlog של MySQL, וה-SMT שנקרא <em>Outbox Event Router</em> הופך inserts ל-outbox לרשומות ב-topic עם key של aggregate_id.</p>
<pre>{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "plugin.name": "pgoutput",
  "slot.name": "orders_outbox",
  "publication.name": "outbox_pub",
  "table.include.list": "public.outbox",
  "transforms": "outbox",
  "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
  "transforms.outbox.route.by.field": "aggregate_type",
  "transforms.outbox.table.field.event.key": "aggregate_id",
  "heartbeat.interval.ms": "10000"
}</pre>
<blockquote>⚠️ טיפ לפרודקשן: replication slot של Postgres שה-consumer שלו למטה <strong>מחזיק WAL לנצח</strong>, ימלא את הדיסק ויפיל את ה-primary. עושים alert על ה-bytes שנשמרים ב-<code>pg_replication_slots</code> ומגדירים <code>max_slot_wal_keep_size</code> (PG13+, למשל 50GB) כ-circuit breaker. ועוד: לפני PG17 (failover slots) ה-slots לא עוברים ל-replica ב-failover, אז מתכננים re-snapshot של Debezium אחרי failover של ה-primary.</blockquote>`
      }
    },
    {
      h: { en: "Kafka exactly-once semantics (EOS)", he: "Exactly-once semantics ב-Kafka (EOS)" },
      body: {
        en: `<p>Kafka gives true exactly-once for <strong>read-from-Kafka → process → write-to-Kafka</strong> pipelines:</p>
<ul>
<li><code>enable.idempotence=true</code> (default since Kafka 3.0, requires <code>acks=all</code>): broker dedups producer retries per partition by sequence number. No duplicates from producer retries.</li>
<li><code>transactional.id</code>: the producer writes output records <em>and</em> the consumer offsets (<code>sendOffsetsToTransaction</code>) in one atomic transaction. A zombie producer with the same transactional.id is fenced by an epoch bump.</li>
<li>Downstream consumers set <code>isolation.level=read_committed</code> so they skip aborted records.</li>
<li>Kafka Streams: <code>processing.guarantee=exactly_once_v2</code>.</li>
</ul>
<p>It does <strong>not</strong> cover side effects outside Kafka (DB writes, HTTP calls, emails). For a Kafka → Postgres sink, store the consumed offset in the same DB transaction as the data (and seek to it on startup), or make the write an idempotent upsert keyed by a business id.</p>`,
        he: `<p>Kafka נותן exactly-once אמיתי לפייפליינים של <strong>קריאה מ-Kafka ← עיבוד ← כתיבה ל-Kafka</strong>:</p>
<ul>
<li><code>enable.idempotence=true</code> (ברירת מחדל מאז Kafka 3.0, דורש <code>acks=all</code>): ה-broker עושה dedup ל-retries של ה-producer לכל partition לפי sequence number. אין כפילויות מ-retries של ה-producer.</li>
<li><code>transactional.id</code>: ה-producer כותב את רשומות הפלט <em>וגם</em> את ה-offsets של ה-consumer (<code>sendOffsetsToTransaction</code>) בטרנזקציה אטומית אחת. producer זומבי עם אותו transactional.id נחסם (fenced) ע״י העלאת epoch.</li>
<li>Consumers במורד הזרם מגדירים <code>isolation.level=read_committed</code> כדי לדלג על רשומות של טרנזקציות שבוטלו.</li>
<li>ב-Kafka Streams: <code>processing.guarantee=exactly_once_v2</code>.</li>
</ul>
<p>זה <strong>לא</strong> מכסה side effects מחוץ ל-Kafka (writes ל-DB, קריאות HTTP, מיילים). ל-sink של Kafka ← Postgres, שומרים את ה-offset שנצרך באותה טרנזקציה של הדאטה (ועושים seek אליו בעלייה), או הופכים את ה-write ל-upsert שהוא idempotent לפי business id.</p>`
      }
    },
    {
      h: { en: "Sagas vs 2PC, and compensation", he: "Sagas מול 2PC, ופעולות מפצות" },
      body: {
        en: `<p><strong>Two-phase commit (2PC / XA):</strong> a coordinator asks all participants to <em>prepare</em> (lock + durably promise), then tells them to <em>commit</em>. Atomic, but blocking: if the coordinator dies after prepare, participants hold locks until it returns. Latency = 2 round trips + fsyncs, and availability is the product of all participants'. It works inside one vendor's system (Spanner, CockroachDB, Postgres <code>PREPARE TRANSACTION</code> for a few nodes) but is a poor fit across microservices owned by different teams.</p>
<p><strong>Saga:</strong> a sequence of local transactions, each publishing an event or replying; on failure, run <strong>compensating</strong> transactions in reverse. No global isolation: other requests can see intermediate state.</p>
<pre>Order saga (orchestrated):
  1 CreateOrder(PENDING)         comp: CancelOrder
  2 ReserveInventory             comp: ReleaseInventory
  3 AuthorizePayment             comp: VoidAuthorization
  4 ConfirmOrder(APPROVED)       -- pivot: after this, only forward recovery
  5 ShipOrder (retry until ok)</pre>
<ul>
<li><strong>Orchestration</strong> (a central state machine: Temporal, AWS Step Functions, Camunda) vs <strong>choreography</strong> (services react to each other's events). Orchestration is easier to reason about and observe once you have more than ~3-4 steps.</li>
<li>Compensations are <em>semantic</em>, not rollbacks: you can't unsend an email; you send a correction. Each step and each compensation must be idempotent and retryable.</li>
<li>Order steps so that the riskiest/most likely to fail run first, and irreversible ones after the <em>pivot</em>.</li>
<li>Countermeasures for the lack of isolation: semantic locks (status PENDING), commutative updates, re-reading values before acting.</li>
</ul>`,
        he: `<p><strong>Two-phase commit (2PC / XA):</strong> coordinator מבקש מכל המשתתפים לעשות <em>prepare</em> (לנעול ולהבטיח באופן durable), ואז אומר להם לעשות <em>commit</em>. אטומי, אבל חוסם: אם ה-coordinator מת אחרי ה-prepare, המשתתפים מחזיקים locks עד שהוא חוזר. Latency = 2 round trips + fsyncs, והזמינות היא המכפלה של הזמינות של כל המשתתפים. זה עובד בתוך מערכת של vendor אחד (Spanner, CockroachDB, <code>PREPARE TRANSACTION</code> של Postgres לכמה nodes), אבל מתאים רע בין מיקרו-שירותים של צוותים שונים.</p>
<p><strong>Saga:</strong> רצף של טרנזקציות מקומיות, כל אחת מפרסמת event או עונה; בכשל, מריצים טרנזקציות <strong>מפצות</strong> (compensating) בסדר הפוך. אין isolation גלובלי: בקשות אחרות יכולות לראות state ביניים.</p>
<pre>Order saga (orchestrated):
  1 CreateOrder(PENDING)         comp: CancelOrder
  2 ReserveInventory             comp: ReleaseInventory
  3 AuthorizePayment             comp: VoidAuthorization
  4 ConfirmOrder(APPROVED)       -- pivot: after this, only forward recovery
  5 ShipOrder (retry until ok)</pre>
<ul>
<li><strong>Orchestration</strong> (state machine מרכזי: Temporal, AWS Step Functions, Camunda) מול <strong>choreography</strong> (שירותים מגיבים ל-events אחד של השני). Orchestration הרבה יותר קל להבנה ולניטור ברגע שיש יותר מ-3-4 שלבים.</li>
<li>פעולות מפצות הן <em>סמנטיות</em>, לא rollback: אי אפשר "לבטל שליחה" של מייל; שולחים תיקון. כל שלב וכל פעולה מפצה חייבים להיות idempotent וניתנים ל-retry.</li>
<li>מסדרים את השלבים כך שהמסוכנים/הכי סבירים להיכשל רצים ראשונים, והבלתי הפיכים אחרי ה-<em>pivot</em>.</li>
<li>תחליפים להעדר ה-isolation: semantic locks (סטטוס PENDING), עדכונים קומוטטיביים, קריאה מחדש של ערכים לפני פעולה.</li>
</ul>`
      }
    }
  ],
  diagram: `Dual write (broken):       app --1--> Postgres     app --2--> Kafka   crash between 1 and 2 = lost event

Outbox + CDC:
  app --BEGIN; INSERT orders; INSERT outbox; COMMIT--> Postgres
                                                        | WAL (logical slot)
                                                        v
                                                 Debezium (Kafka Connect)
                                                        | at-least-once
                                                        v
                                     Kafka topic "order" (key = aggregate_id)
                                                        |
                                 consumer: dedup by event_id in same txn as effect

Exactly-once effect = at-least-once delivery + idempotent apply`,
  handsOn: [
    { cmd: "curl -s -X POST https://api.example.com/v1/charges -H 'Idempotency-Key: 7c0e1b2a-5d0f-4b6e-9a51-2f3c8e1d0a77' -d amount=100 -d currency=usd; # run twice", what: { en: "Send the same request twice with the same key. A correct API returns the identical response (often with a header like Idempotent-Replayed: true) and charges once.", he: "לשלוח את אותה בקשה פעמיים עם אותו key. API תקין מחזיר תשובה זהה (לרוב עם header כמו Idempotent-Replayed: true) ומחייב פעם אחת." } },
    { cmd: "psql -c \"SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained FROM pg_replication_slots;\"", what: { en: "See how much WAL each replication slot (e.g. Debezium's) is holding. A large and growing number with active = f means the CDC consumer is down and the disk is filling.", he: "לראות כמה WAL כל replication slot (למשל של Debezium) מחזיק. מספר גדול ועולה עם active = f אומר שה-consumer של ה-CDC למטה והדיסק מתמלא." } },
    { cmd: "curl -s localhost:8083/connectors/orders-outbox/status | jq '.connector.state, .tasks[].state'", what: { en: "Check the Kafka Connect / Debezium connector and task state (RUNNING / FAILED). A FAILED task includes a stack trace in .tasks[].trace.", he: "לבדוק את ה-state של ה-connector וה-tasks ב-Kafka Connect / Debezium (RUNNING / FAILED). task ב-FAILED כולל stack trace ב-.tasks[].trace." } },
    { cmd: "kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic payments --isolation-level read_committed --from-beginning --property print.key=true", what: { en: "Consume only committed transactional records; compare with the default read_uncommitted to see records from aborted transactions.", he: "לצרוך רק רשומות של טרנזקציות שעשו commit; להשוות לברירת המחדל read_uncommitted כדי לראות רשומות מטרנזקציות שבוטלו." } }
  ],
  mnemonic: {
    en: "\"Deliver at least once, apply exactly once.\" Outbox rule: \"one transaction, one truth, publish later\". Saga: \"forward with retries, backward with compensations, pivot in the middle\".",
    he: "\"מוסרים לפחות פעם אחת, מיישמים בדיוק פעם אחת.\" כלל ה-outbox: \"טרנזקציה אחת, אמת אחת, מפרסמים אחר כך\". Saga: \"קדימה עם retries, אחורה עם פיצויים, pivot באמצע\"."
  },
  pitfalls: [
    { en: "Writing to the DB and then publishing to Kafka in application code ('dual write'). Any crash, timeout or deploy between the two loses or fabricates an event; use an outbox or CDC.", he: "לכתוב ל-DB ואז לפרסם ל-Kafka בקוד האפליקציה ('dual write'). כל קריסה, timeout או deploy בין השניים מאבדים event או ממציאים אחד; משתמשים ב-outbox או CDC." },
    { en: "A dedup window shorter than the replay horizon. Replaying a 3-day-old DLQ into a consumer that remembers ids for 1 hour double-charges everyone.", he: "Dedup window קצר מאופק ה-replay. replay של DLQ בן 3 ימים ל-consumer שזוכר ids לשעה אחת יחייב את כולם פעמיים." },
    { en: "Assuming Kafka EOS makes your database writes exactly-once. Transactions cover Kafka topics and offsets only; external effects still need idempotent upserts or offsets stored with the data.", he: "להניח ש-Kafka EOS הופך את ה-writes ל-DB ל-exactly-once. הטרנזקציות מכסות רק topics ו-offsets ב-Kafka; אפקטים חיצוניים עדיין צריכים upserts שהם idempotent או offsets שנשמרים יחד עם הדאטה." },
    { en: "Compensations that are not idempotent or can fail permanently. A saga stuck between 'payment captured' and 'refund failed' needs alerting, retries with backoff and a manual repair path.", he: "פעולות מפצות שאינן idempotent או שיכולות להיכשל לתמיד. saga שתקועה בין 'התשלום נגבה' ל'ההחזר נכשל' צריכה alerting, retries עם backoff ונתיב תיקון ידני." }
  ],
  interview: [
    {
      q: { en: "Design the payment-capture step of checkout so a customer is never charged twice, even with client retries, load balancer retries and consumer redelivery.", he: "תתכנן את שלב ה-capture של התשלום ב-checkout כך שלקוח לעולם לא יחויב פעמיים, גם עם retries של הלקוח, של ה-load balancer ו-redelivery של ה-consumer." },
      a: { en: "Use a natural idempotency key: (order_id, 'capture'). The payments service has a table with a unique constraint on it and stores status + PSP response in the same transaction as the ledger entry. Flow: insert key as IN_PROGRESS (conflict → return stored result or 409 if still in progress), call the PSP with the same key as its idempotency key (Stripe/Adyen support it), record the result, commit. Emit PaymentCaptured via outbox. Consumers dedup by event id. For the crash-after-PSP-call case, a reconciler queries the PSP by key for IN_PROGRESS rows older than N minutes. Key TTL longer than any retry/replay horizon (days, not minutes). Also make LB/gateway retries only on idempotent methods or when the key header is present.", he: "משתמשים ב-idempotency key טבעי: (order_id, 'capture'). לשירות התשלומים יש טבלה עם unique constraint עליו, והוא שומר status ותשובת ה-PSP באותה טרנזקציה של רשומת ה-ledger. הזרימה: insert ל-key כ-IN_PROGRESS (conflict ← מחזירים תוצאה שמורה, או 409 אם עדיין in progress), קוראים ל-PSP עם אותו key כ-idempotency key שלו (Stripe/Adyen תומכים), שומרים את התוצאה, commit. מפיצים PaymentCaptured דרך outbox, וה-consumers עושים dedup לפי event id. למקרה של קריסה אחרי הקריאה ל-PSP, reconciler שואל את ה-PSP לפי key על שורות IN_PROGRESS שישנות מ-N דקות. TTL ל-keys ארוך מכל אופק retry/replay (ימים, לא דקות). ובנוסף, retries ב-LB/gateway רק על methods שהם idempotent או כשה-header של ה-key קיים." }
    },
    {
      q: { en: "When would you choose 2PC over a saga, and vice versa?", he: "מתי תבחר ב-2PC על פני saga, ולהפך?" },
      a: { en: "2PC when all participants are inside one system you trust to run it well (a distributed SQL DB, or a couple of Postgres nodes), the transaction is short, you need isolation (no one may observe half-done state, e.g. ledger debits/credits), and you accept blocking on coordinator failure. Saga when steps cross service/team/vendor boundaries, run long (seconds to days, human approval), involve external APIs that don't support prepare, or need independent availability. Often the best answer is to redraw boundaries so the invariant lives in one service's DB (one local transaction) and only notifications cross boundaries.", he: "2PC כשכל המשתתפים בתוך מערכת אחת שאתה סומך עליה שתריץ את זה טוב (distributed SQL DB, או כמה nodes של Postgres), הטרנזקציה קצרה, צריך isolation (אסור שמישהו יראה state חצי גמור, למשל חיובים/זיכויים ב-ledger), ומוכנים לחסימה בכשל של ה-coordinator. Saga כשהשלבים חוצים גבולות של שירותים/צוותים/vendors, רצים הרבה זמן (שניות עד ימים, אישור אנושי), כוללים APIs חיצוניים שלא תומכים ב-prepare, או צריכים זמינות עצמאית. הרבה פעמים התשובה הכי טובה היא לשרטט מחדש את הגבולות כך שהאינווריאנט יחיה ב-DB של שירות אחד (טרנזקציה מקומית אחת) ורק התראות חוצות גבולות." }
    },
    {
      q: { en: "Outbox poller vs Debezium CDC: what trade-offs would you present?", he: "Outbox poller מול Debezium CDC: אילו trade-offs תציג?" },
      a: { en: "Poller: no new infra, easy to reason about, but adds query load, polling latency (100 ms-1 s), needs SKIP LOCKED for parallelism, ordering per aggregate needs care, and the outbox table needs cleanup. CDC: low latency, no extra queries, preserves commit order, can also stream all table changes, but needs Kafka Connect ops, logical replication slots (WAL retention risk), slot handling on failover, schema evolution handling and re-snapshot procedures. For a single team with modest volume, poller first; for a platform used by many services, CDC with a standard outbox schema.", he: "Poller: אין תשתית חדשה, קל להבין, אבל מוסיף עומס queries, latency של polling (100 ms עד שנייה), צריך SKIP LOCKED למקביליות, סדר לכל aggregate דורש תשומת לב, וצריך לנקות את טבלת ה-outbox. CDC: latency נמוך, בלי queries נוספים, שומר על סדר ה-commits, ויכול להזרים גם את כל השינויים בטבלאות – אבל דורש תפעול של Kafka Connect, logical replication slots (סיכון של WAL retention), טיפול ב-slots ב-failover, טיפול ב-schema evolution ונהלי re-snapshot. לצוות יחיד עם volume צנוע – poller קודם; לפלטפורמה שמשרתת הרבה שירותים – CDC עם סכמת outbox סטנדרטית." }
    }
  ],
  quiz: [
    {
      q: { en: "A consumer commits its Kafka offset before processing each message. Which semantics does it have?", he: "consumer עושה commit ל-offset ב-Kafka לפני שהוא מעבד כל הודעה. איזו סמנטיקה יש לו?" },
      options: [
        { en: "At-least-once", he: "At-least-once" },
        { en: "At-most-once", he: "At-most-once" },
        { en: "Exactly-once", he: "Exactly-once" },
        { en: "It depends on acks=all", he: "תלוי ב-acks=all" }
      ],
      answer: 1,
      explain: { en: "If it crashes after committing but before finishing processing, that message is skipped on restart: loss, never duplicates.", he: "אם הוא קורס אחרי ה-commit ולפני שסיים לעבד, ההודעה מדולגת כשהוא עולה מחדש: אובדן, אף פעם לא כפילויות." }
    },
    {
      q: { en: "What problem does the transactional outbox solve?", he: "איזו בעיה ה-transactional outbox פותר?" },
      options: [
        { en: "Slow consumers", he: "Consumers איטיים" },
        { en: "Atomically changing the database and publishing an event without a distributed transaction", he: "לשנות את ה-DB ולפרסם event באופן אטומי בלי טרנזקציה מבוזרת" },
        { en: "Message ordering across partitions", he: "סדר הודעות בין partitions" },
        { en: "Schema evolution", he: "Schema evolution" }
      ],
      answer: 1,
      explain: { en: "The event is stored in the same local transaction as the state change, and published later at-least-once, so the two can never disagree.", he: "ה-event נשמר באותה טרנזקציה מקומית של שינוי ה-state ומפורסם אחר כך at-least-once, כך שהשניים לא יכולים לסתור אחד את השני." }
    },
    {
      q: { en: "A client retries POST /charges with the same Idempotency-Key but a different amount. Best server behaviour?", he: "לקוח עושה retry ל-POST /charges עם אותו Idempotency-Key אבל סכום שונה. מה ההתנהגות הנכונה של השרת?" },
      options: [
        { en: "Process the new amount", he: "לעבד את הסכום החדש" },
        { en: "Return the original response silently", he: "להחזיר בשקט את התשובה המקורית" },
        { en: "Reject with an error because the payload does not match the stored request hash", he: "לדחות עם שגיאה כי ה-payload לא תואם ל-hash של הבקשה השמורה" },
        { en: "Delete the old key and start over", he: "למחוק את ה-key הישן ולהתחיל מחדש" }
      ],
      answer: 2,
      explain: { en: "Reusing a key with a different payload is a client bug; returning the old result would hide it and processing would break idempotency. Stripe returns an error for this.", he: "שימוש חוזר ב-key עם payload שונה הוא באג בלקוח; להחזיר את התוצאה הישנה יסתיר אותו, ולעבד ישבור את ה-idempotency. Stripe מחזירים שגיאה במקרה הזה." }
    },
    {
      q: { en: "In a saga, what is the 'pivot' transaction?", he: "ב-saga, מה זו טרנזקציית ה-'pivot'?" },
      options: [
        { en: "The first step", he: "השלב הראשון" },
        { en: "The step after which the saga can only move forward (retry), never compensate", he: "השלב שאחריו ה-saga יכולה רק להתקדם (retry), אף פעם לא לפצות" },
        { en: "The coordinator's prepare phase", he: "שלב ה-prepare של ה-coordinator" },
        { en: "A step that runs in parallel", he: "שלב שרץ במקביל" }
      ],
      answer: 1,
      explain: { en: "Before the pivot, failures are compensated; after it, remaining steps must be retryable until they succeed (forward recovery).", he: "לפני ה-pivot, כשלים מפוצים; אחריו, השלבים שנשארו חייבים להיות ניתנים ל-retry עד שיצליחו (forward recovery)." }
    }
  ],
  playground: "queue",
  related: ["arch-queues", "arch-event-driven", "db-transactions", "staff-kafka-deep", "arch-brokers"]
});

// ---------------------------------------------------------------------------
// 4. Kafka deep dive
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-kafka-deep",
  track: "staff",
  order: 4,
  icon: "🪵",
  level: 3,
  minutes: 20,
  title: {
    en: "Kafka Deep Dive: Partitions, Rebalancing, ISR & acks, Compaction, Lag, KRaft",
    he: "Kafka לעומק: Partitions, Rebalancing, ISR ו-acks, Compaction, Lag ו-KRaft"
  },
  tldr: {
    en: "Kafka is a replicated, partitioned append-only log: the key picks the partition and therefore the ordering and the hot spots; acks=all plus min.insync.replicas=2 on RF=3 is what makes a write durable; consumer groups scale only up to the partition count; and most outages are rebalances, lag and one hot partition.",
    he: "Kafka הוא log משוכפל ומחולק ל-partitions שרק מוסיפים לו: ה-key בוחר את ה-partition ולכן גם את הסדר ואת ה-hot spots; acks=all עם min.insync.replicas=2 על RF=3 זה מה שהופך write ל-durable; consumer groups גדלים רק עד מספר ה-partitions; ורוב התקלות הן rebalances, lag ו-partition חם אחד."
  },
  analogy: {
    en: "Kafka is a set of numbered conveyor belts (partitions). Each parcel's address label (key) decides its belt, so all parcels for one address stay in order on one belt. A team of packers (consumer group) splits the belts between them; you can't have more busy packers than belts. Each belt has a live copy on two other floors (replicas); a parcel counts as 'received' only when enough floors have it.",
    he: "Kafka הוא סט של מסועים ממוספרים (partitions). תווית הכתובת של כל חבילה (key) קובעת על איזה מסוע היא עולה, כך שכל החבילות לאותה כתובת נשארות בסדר על מסוע אחד. צוות אורזים (consumer group) מחלק ביניהם את המסועים; אי אפשר שיהיו יותר אורזים עסוקים ממסועים. לכל מסוע יש עותק חי בשתי קומות נוספות (replicas), וחבילה נחשבת 'התקבלה' רק כשמספיק קומות מחזיקות אותה."
  },
  sections: [
    {
      h: { en: "Partitions, keys and ordering", he: "Partitions, keys וסדר" },
      body: {
        en: `<p>A topic is split into <strong>partitions</strong>; each is an ordered, immutable log with offsets 0,1,2... Ordering is guaranteed <strong>only within a partition</strong>. The default partitioner maps <code>murmur2(key) % numPartitions</code>; records with a null key use the <em>sticky partitioner</em> (fill a batch for one partition, then switch), which is great for throughput and gives no ordering.</p>
<ul>
<li><strong>Choose the key = the entity whose events must stay ordered</strong>: account_id, order_id, device_id. Not timestamp, not a constant, not something with 3 values.</li>
<li><strong>Adding partitions remaps keys</strong> (the modulo changes). Existing keys move to new partitions and per-key order breaks across the cutover; compacted topics end up with the same key in two partitions. Over-provision up front (e.g. 2-3x expected consumer parallelism) or create a new topic and migrate.</li>
<li><strong>Ordering + retries:</strong> with the idempotent producer (default since 3.0) you can keep <code>max.in.flight.requests.per.connection</code> up to 5 and still preserve order. Without idempotence, in-flight greater than 1 plus retries can reorder.</li>
<li><strong>How many partitions?</strong> target throughput / per-partition throughput (a partition comfortably does ~5-10 MB/s writes; a consumer often less, depending on processing). More partitions = more parallelism, but more open files, longer leader elections, more memory in clients. KRaft clusters support millions of partitions, but per-broker, keep it in the low thousands.</li>
</ul>
<pre>kafka-topics.sh --bootstrap-server $BS --create --topic orders \
  --partitions 48 --replication-factor 3 \
  --config min.insync.replicas=2 --config retention.ms=604800000</pre>`,
        he: `<p>topic מחולק ל-<strong>partitions</strong>; כל אחד הוא log מסודר שלא משתנה, עם offsets של 0,1,2... הסדר מובטח <strong>רק בתוך partition</strong>. ה-partitioner ברירת המחדל עושה <code>murmur2(key) % numPartitions</code>; רשומות עם key ריק משתמשות ב-<em>sticky partitioner</em> (ממלא batch ל-partition אחד ואז מחליף) – מצוין ל-throughput ולא נותן שום סדר.</p>
<ul>
<li><strong>בוחרים key = ה-entity שה-events שלו חייבים להישאר בסדר</strong>: account_id, order_id, device_id. לא timestamp, לא קבוע, ולא משהו עם 3 ערכים.</li>
<li><strong>הוספת partitions ממפה keys מחדש</strong> (המודולו משתנה). keys קיימים עוברים ל-partitions חדשים והסדר לכל key נשבר סביב המעבר; ב-topics עם compaction אותו key נגמר בשני partitions. מקצים מראש עם עודף (למשל פי 2-3 מהמקביליות הצפויה של ה-consumers) או יוצרים topic חדש ומהגרים.</li>
<li><strong>סדר + retries:</strong> עם idempotent producer (ברירת מחדל מאז 3.0) אפשר להשאיר <code>max.in.flight.requests.per.connection</code> עד 5 ועדיין לשמור על סדר. בלי idempotence, in-flight גדול מ-1 יחד עם retries יכול לשנות סדר.</li>
<li><strong>כמה partitions?</strong> throughput יעד / throughput לכל partition (partition עושה בנוחות 5-10 MB/s של writes; consumer לרוב פחות, תלוי בעיבוד). יותר partitions = יותר מקביליות, אבל יותר קבצים פתוחים, leader elections ארוכים יותר, יותר זיכרון בלקוחות. קלאסטרים של KRaft תומכים במיליוני partitions, אבל לכל broker שומרים על אלפים בודדים.</li>
</ul>
<pre>kafka-topics.sh --bootstrap-server $BS --create --topic orders \
  --partitions 48 --replication-factor 3 \
  --config min.insync.replicas=2 --config retention.ms=604800000</pre>`
      }
    },
    {
      h: { en: "Durability: replication, ISR, acks, min.insync.replicas", he: "Durability: replication, ISR, acks ו-min.insync.replicas" },
      body: {
        en: `<p>Each partition has one <strong>leader</strong> and RF-1 followers that fetch from it. The <strong>ISR</strong> (in-sync replicas) is the set of replicas caught up within <code>replica.lag.time.max.ms</code> (default 30 s). The <em>high watermark</em> is the offset replicated to all ISR members; consumers only read up to it.</p>
<table>
<tr><th>Producer acks</th><th>Ack when</th><th>Can lose acked data?</th></tr>
<tr><td><code>acks=0</code></td><td>Sent on the socket</td><td>Yes, freely</td></tr>
<tr><td><code>acks=1</code></td><td>Leader wrote it (page cache, not fsync)</td><td>Yes: leader dies before followers fetch</td></tr>
<tr><td><code>acks=all</code> (default since 3.0)</td><td>All <em>current</em> ISR members have it</td><td>Only if ISR had shrunk to 1 → hence min.insync.replicas</td></tr>
</table>
<p><code>min.insync.replicas=2</code> with RF=3: if the ISR shrinks below 2, <code>acks=all</code> producers get <code>NotEnoughReplicasException</code> instead of silently writing to a single copy. You tolerate 1 broker down with writes still flowing; 2 down → writes stop (consistency over availability).</p>
<ul>
<li><code>unclean.leader.election.enable=false</code> (default): never elect an out-of-sync replica as leader. Setting it true trades data loss for availability.</li>
<li>Kafka relies on replication, not fsync, for durability (<code>flush.messages</code> defaults to infinite). Correlated failure of all replicas (same rack, same AZ power loss) can lose the page cache: set <code>broker.rack</code> so replicas spread across AZs.</li>
<li><code>UnderReplicatedPartitions</code> greater than 0 and <code>UnderMinIsrPartitionCount</code> greater than 0 are the two broker metrics to page on.</li>
</ul>`,
        he: `<p>לכל partition יש <strong>leader</strong> אחד ו-RF-1 followers שמושכים ממנו. ה-<strong>ISR</strong> (in-sync replicas) הוא סט ה-replicas שמעודכנות בטווח של <code>replica.lag.time.max.ms</code> (ברירת מחדל 30 שניות). ה-<em>high watermark</em> הוא ה-offset ששוכפל לכל חברי ה-ISR, ו-consumers קוראים רק עד אליו.</p>
<table>
<tr><th>acks של ה-producer</th><th>ack מתי</th><th>אפשר לאבד דאטה שקיבל ack?</th></tr>
<tr><td><code>acks=0</code></td><td>נשלח על ה-socket</td><td>כן, בקלות</td></tr>
<tr><td><code>acks=1</code></td><td>ה-leader כתב (ל-page cache, לא fsync)</td><td>כן: ה-leader מת לפני שה-followers משכו</td></tr>
<tr><td><code>acks=all</code> (ברירת מחדל מאז 3.0)</td><td>כל חברי ה-ISR <em>הנוכחיים</em> מחזיקים</td><td>רק אם ה-ISR התכווץ ל-1 ← ומכאן min.insync.replicas</td></tr>
</table>
<p><code>min.insync.replicas=2</code> עם RF=3: אם ה-ISR קטן מ-2, producers עם <code>acks=all</code> מקבלים <code>NotEnoughReplicasException</code> במקום לכתוב בשקט לעותק יחיד. שורדים broker אחד למטה וה-writes ממשיכים; 2 למטה ← ה-writes נעצרים (עקביות על פני זמינות).</p>
<ul>
<li><code>unclean.leader.election.enable=false</code> (ברירת מחדל): אף פעם לא לבחור replica שלא מסונכרנת כ-leader. true = מחליפים אובדן דאטה בזמינות.</li>
<li>Kafka סומך על replication, לא על fsync, בשביל durability (<code>flush.messages</code> הוא אינסוף כברירת מחדל). כשל מתואם של כל ה-replicas (אותו rack, הפסקת חשמל באותו AZ) יכול לאבד את ה-page cache: מגדירים <code>broker.rack</code> כדי שה-replicas יתפזרו בין AZs.</li>
<li><code>UnderReplicatedPartitions</code> גדול מ-0 ו-<code>UnderMinIsrPartitionCount</code> גדול מ-0 הם שני מדדי ה-broker שמקפיצים עליהם page.</li>
</ul>`
      }
    },
    {
      h: { en: "Consumer groups and rebalancing", he: "Consumer groups ו-rebalancing" },
      body: {
        en: `<p>Each partition is assigned to exactly one consumer in a group; a consumer can own many partitions. Max useful parallelism = number of partitions; extra consumers sit idle. Progress is stored as committed offsets in <code>__consumer_offsets</code>.</p>
<p>A <strong>rebalance</strong> reassigns partitions when a member joins, leaves, or is considered dead. Triggers you will meet:</p>
<ul>
<li><code>session.timeout.ms</code> (default 45 s): no heartbeat → member evicted.</li>
<li><code>max.poll.interval.ms</code> (default 300 s): the app did not call <code>poll()</code> in time (slow processing of a big batch) → member leaves. Fix with smaller <code>max.poll.records</code> (default 500) or faster processing, not just bigger timeouts.</li>
<li>Rolling deploys: every pod restart = leave + join = 2 rebalances.</li>
</ul>
<p><strong>Eager</strong> rebalancing (old default) revokes <em>all</em> partitions from everyone, then reassigns: a stop-the-world pause of seconds to minutes in a big group. Fixes:</p>
<ul>
<li><code>partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor</code>: <strong>incremental cooperative</strong> rebalancing; only partitions that actually move are revoked.</li>
<li><strong>Static membership</strong>: <code>group.instance.id=orders-consumer-3</code> (e.g. the StatefulSet pod name) so a restart within session.timeout does not trigger a rebalance at all.</li>
<li>The new consumer protocol (KIP-848, GA in Kafka 4.0, <code>group.protocol=consumer</code>) moves assignment to the broker and makes rebalances incremental by default.</li>
</ul>
<pre>kafka-consumer-groups.sh --bootstrap-server $BS --describe --group orders-svc
GROUP      TOPIC  PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG    CONSUMER-ID       HOST
orders-svc orders 0         1840112        1840190        78     consumer-3-a1b... /10.0.4.17
orders-svc orders 7         902114         1311902        409788 consumer-1-9f2... /10.0.2.9   &lt;- hot/stuck
kafka-consumer-groups.sh --bootstrap-server $BS --describe --group orders-svc --state   # Stable / PreparingRebalance</pre>`,
        he: `<p>כל partition משויך ל-consumer אחד בדיוק ב-group; consumer יכול להחזיק הרבה partitions. המקביליות המקסימלית השימושית = מספר ה-partitions; consumers עודפים יושבים בטל. ההתקדמות נשמרת כ-committed offsets ב-<code>__consumer_offsets</code>.</p>
<p><strong>Rebalance</strong> משייך מחדש partitions כש-member מצטרף, עוזב או נחשב מת. טריגרים שתפגוש:</p>
<ul>
<li><code>session.timeout.ms</code> (ברירת מחדל 45 שניות): אין heartbeat ← ה-member מועף.</li>
<li><code>max.poll.interval.ms</code> (ברירת מחדל 300 שניות): האפליקציה לא קראה ל-<code>poll()</code> בזמן (עיבוד איטי של batch גדול) ← ה-member עוזב. מתקנים עם <code>max.poll.records</code> קטן יותר (ברירת מחדל 500) או עיבוד מהיר יותר, לא רק עם timeouts גדולים יותר.</li>
<li>Rolling deploys: כל restart של pod = עזיבה + הצטרפות = 2 rebalances.</li>
</ul>
<p>Rebalancing <strong>eager</strong> (ברירת המחדל הישנה) לוקח את <em>כל</em> ה-partitions מכולם ואז משייך מחדש: עצירה מוחלטת של שניות עד דקות ב-group גדול. תיקונים:</p>
<ul>
<li><code>partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor</code>: rebalancing <strong>incremental cooperative</strong>; רק partitions שבאמת זזים נלקחים.</li>
<li><strong>Static membership</strong>: <code>group.instance.id=orders-consumer-3</code> (למשל שם ה-pod ב-StatefulSet) כך ש-restart בתוך ה-session.timeout לא מפעיל rebalance בכלל.</li>
<li>הפרוטוקול החדש ל-consumers (KIP-848, GA ב-Kafka 4.0, <code>group.protocol=consumer</code>) מעביר את השיוך ל-broker והופך rebalances ל-incremental כברירת מחדל.</li>
</ul>
<pre>kafka-consumer-groups.sh --bootstrap-server $BS --describe --group orders-svc
GROUP      TOPIC  PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG    CONSUMER-ID       HOST
orders-svc orders 0         1840112        1840190        78     consumer-3-a1b... /10.0.4.17
orders-svc orders 7         902114         1311902        409788 consumer-1-9f2... /10.0.2.9   &lt;- hot/stuck
kafka-consumer-groups.sh --bootstrap-server $BS --describe --group orders-svc --state   # Stable / PreparingRebalance</pre>`
      }
    },
    {
      h: { en: "Retention vs compaction, lag and hot partitions", he: "Retention מול compaction, lag ו-hot partitions" },
      body: {
        en: `<p><strong>Retention</strong> (<code>cleanup.policy=delete</code>): whole segments are deleted after <code>retention.ms</code> (default 7 days) or <code>retention.bytes</code> per partition. Good for event streams.</p>
<p><strong>Compaction</strong> (<code>cleanup.policy=compact</code>): keeps at least the <em>latest value per key</em>; a record with a null value is a <strong>tombstone</strong> that deletes the key after <code>delete.retention.ms</code> (default 24 h). Good for changelogs, state stores, CDC tables, config: a new consumer can rebuild current state by reading from the start. <code>compact,delete</code> combines both. Compaction runs only on closed segments (<code>segment.ms</code>, <code>min.cleanable.dirty.ratio</code> 0.5), so duplicates of a key are normal for a while.</p>
<p><strong>Lag</strong> = log-end-offset − committed offset, per partition. Alert on <em>time</em> lag (how old is the oldest unprocessed record) rather than raw message counts, because 100k messages is 1 s on one topic and 3 hours on another. Tools: Burrow, kafka-lag-exporter / kminion, or KEDA's Kafka scaler that scales consumers on lag (capped at partition count).</p>
<p><strong>Hot partitions</strong>: one key carries a big share of traffic (a celebrity user, a tenant 100x bigger than others, a null-ish default like "unknown"). Symptoms: lag on one partition, one consumer at 100% CPU, the leader broker's network saturated. Remedies:</p>
<ul>
<li>Salt the key for hot entities (<code>tenantId + "#" + (hash(eventId) % 8)</code>) and accept per-sub-key order, or re-aggregate downstream.</li>
<li>Separate topic for the whale tenant with its own consumers.</li>
<li>Within a consumer, process a partition with parallelism per key (Confluent parallel-consumer) to keep key order but use more threads.</li>
</ul>`,
        he: `<p><strong>Retention</strong> (<code>cleanup.policy=delete</code>): segments שלמים נמחקים אחרי <code>retention.ms</code> (ברירת מחדל 7 ימים) או <code>retention.bytes</code> לכל partition. טוב ל-event streams.</p>
<p><strong>Compaction</strong> (<code>cleanup.policy=compact</code>): שומר לפחות את <em>הערך האחרון לכל key</em>; רשומה עם value ריק היא <strong>tombstone</strong> שמוחקת את ה-key אחרי <code>delete.retention.ms</code> (ברירת מחדל 24 שעות). טוב ל-changelogs, state stores, טבלאות CDC וקונפיג: consumer חדש יכול לבנות את ה-state הנוכחי ע״י קריאה מההתחלה. <code>compact,delete</code> משלב את שניהם. Compaction רץ רק על segments סגורים (<code>segment.ms</code>, <code>min.cleanable.dirty.ratio</code> של 0.5), אז כפילויות של key הן נורמליות לזמן מה.</p>
<p><strong>Lag</strong> = log-end-offset פחות committed offset, לכל partition. עושים alert על lag ב<em>זמן</em> (בן כמה הרשומה הכי ישנה שלא עובדה) ולא על מספר הודעות גולמי, כי 100 אלף הודעות זה שנייה ב-topic אחד ו-3 שעות באחר. כלים: Burrow, kafka-lag-exporter / kminion, או ה-scaler של KEDA ל-Kafka שמגדיל consumers לפי lag (עד מספר ה-partitions).</p>
<p><strong>Hot partitions</strong>: key אחד נושא נתח גדול מהתנועה (משתמש סלב, tenant גדול פי 100 מהשאר, ערך דיפולטי כמו "unknown"). סימפטומים: lag על partition אחד, consumer אחד ב-100% CPU, הרשת של ה-broker שהוא ה-leader רוויה. פתרונות:</p>
<ul>
<li>להוסיף salt ל-key של entities חמים (<code>tenantId + "#" + (hash(eventId) % 8)</code>) ולקבל סדר רק לכל sub-key, או לאחד מחדש במורד הזרם.</li>
<li>topic נפרד ל-tenant הלוויתן עם consumers משלו.</li>
<li>בתוך ה-consumer, לעבד partition במקביליות לפי key (Confluent parallel-consumer) כדי לשמור על סדר לכל key אבל להשתמש ביותר threads.</li>
</ul>`
      }
    },
    {
      h: { en: "KRaft: Kafka without ZooKeeper", he: "KRaft: Kafka בלי ZooKeeper" },
      body: {
        en: `<p>Since Kafka 3.3 KRaft is production-ready, and <strong>Kafka 4.0 (2025) removed ZooKeeper entirely</strong>. Cluster metadata (topics, partitions, ISR, configs, ACLs) lives in an internal Raft-replicated log <code>__cluster_metadata</code> managed by a quorum of <strong>controllers</strong> (typically 3, or 5 for very large clusters), one of which is the active controller.</p>
<ul>
<li>Brokers replicate the metadata log and keep it in memory → controller failover in milliseconds-seconds instead of reloading all state from ZooKeeper, which made partition counts above ~200k painful.</li>
<li>Run controllers as dedicated nodes (<code>process.roles=controller</code>) in production; combined mode is for dev.</li>
<li>Migration from ZK mode needs a 3.x bridge release (3.9 is the last) with the ZK→KRaft migration; you cannot jump straight to 4.0 from a ZK cluster.</li>
</ul>
<pre>process.roles=controller
node.id=3001
controller.quorum.bootstrap.servers=ctl-a:9093,ctl-b:9093,ctl-c:9093

kafka-metadata-quorum.sh --bootstrap-server $BS describe --status
ClusterId: q1Sh-9_ISia_zwGINzRvyQ   LeaderId: 3002   LeaderEpoch: 15
HighWatermark: 4813   MaxFollowerLag: 0   CurrentVoters: [3001,3002,3003]</pre>`,
        he: `<p>מאז Kafka 3.3 KRaft מוכן לפרודקשן, ו-<strong>Kafka 4.0 (2025) הסיר את ZooKeeper לגמרי</strong>. המטא-דאטה של ה-cluster (topics, partitions, ISR, configs, ACLs) יושב ב-log פנימי שמשוכפל ב-Raft בשם <code>__cluster_metadata</code>, ומנוהל ע״י quorum של <strong>controllers</strong> (בדרך כלל 3, או 5 לקלאסטרים ענקיים), שאחד מהם הוא ה-controller הפעיל.</p>
<ul>
<li>ה-brokers משכפלים את ה-log של המטא-דאטה ומחזיקים אותו בזיכרון ← failover של controller במילישניות-שניות במקום לטעון את כל ה-state מחדש מ-ZooKeeper, מה שהפך מספרי partitions מעל ~200 אלף לכואבים.</li>
<li>בפרודקשן מריצים controllers כ-nodes ייעודיים (<code>process.roles=controller</code>); combined mode זה ל-dev.</li>
<li>מיגרציה ממצב ZK דורשת גרסת גשר 3.x (3.9 היא האחרונה) עם מיגרציית ZK→KRaft; אי אפשר לקפוץ ישר ל-4.0 מ-cluster על ZK.</li>
</ul>
<pre>process.roles=controller
node.id=3001
controller.quorum.bootstrap.servers=ctl-a:9093,ctl-b:9093,ctl-c:9093

kafka-metadata-quorum.sh --bootstrap-server $BS describe --status
ClusterId: q1Sh-9_ISia_zwGINzRvyQ   LeaderId: 3002   LeaderEpoch: 15
HighWatermark: 4813   MaxFollowerLag: 0   CurrentVoters: [3001,3002,3003]</pre>`
      }
    }
  ],
  diagram: `topic "orders" RF=3 min.insync.replicas=2           consumer group "orders-svc"
 P0: [L b1] f b2  f b3   ISR={1,2,3}                  c1 <- P0, P3
 P1: [L b2] f b3  f b1   ISR={2,3}   (b1 lagging)     c2 <- P1, P4
 P2: [L b3] f b1  f b2   ISR={3,1,2}                  c3 <- P2, P5
 ...                                                  c4    (idle if partitions < consumers)

producer acks=all -> leader appends -> followers fetch -> HW advances -> ack
                     if |ISR| < 2 -> NotEnoughReplicas (no silent single-copy writes)

key "acct-42" -> murmur2 % 48 = P17  (always, until partition count changes)`,
  handsOn: [
    { cmd: "kafka-consumer-groups.sh --bootstrap-server $BS --describe --group orders-svc", what: { en: "Per-partition CURRENT-OFFSET, LOG-END-OFFSET and LAG, plus which consumer owns it. One partition with huge lag while others are near zero = hot key or a stuck consumer.", he: "CURRENT-OFFSET, LOG-END-OFFSET ו-LAG לכל partition, ואיזה consumer מחזיק אותו. partition אחד עם lag ענק כשהשאר קרובים לאפס = key חם או consumer תקוע." } },
    { cmd: "kafka-topics.sh --bootstrap-server $BS --describe --under-replicated-partitions; kafka-topics.sh --bootstrap-server $BS --describe --under-min-isr-partitions", what: { en: "List partitions whose ISR is smaller than RF, and those below min.insync.replicas (where acks=all producers are already failing).", he: "רשימת partitions שה-ISR שלהם קטן מ-RF, ואלה שמתחת ל-min.insync.replicas (שם producers עם acks=all כבר נכשלים)." } },
    { cmd: "kafka-consumer-groups.sh --bootstrap-server $BS --group orders-svc --topic orders --reset-offsets --to-datetime 2026-11-12T08:00:00.000 --dry-run", what: { en: "Plan a replay from a point in time (group must be inactive). Replace --dry-run with --execute only after confirming consumers are idempotent.", he: "לתכנן replay מנקודת זמן (ה-group חייב להיות לא פעיל). מחליפים את --dry-run ב---execute רק אחרי שמוודאים שה-consumers הם idempotent." } },
    { cmd: "kafka-configs.sh --bootstrap-server $BS --entity-type topics --entity-name customer-profile --alter --add-config cleanup.policy=compact,min.compaction.lag.ms=3600000", what: { en: "Turn a topic into a compacted changelog that keeps the latest value per key, waiting at least 1 h before compacting new records.", he: "להפוך topic ל-changelog עם compaction ששומר את הערך האחרון לכל key, ומחכה לפחות שעה לפני compaction של רשומות חדשות." } },
    { cmd: "kafka-metadata-quorum.sh --bootstrap-server $BS describe --replication", what: { en: "On KRaft, see each controller/broker's metadata log end offset and lag behind the leader controller.", he: "ב-KRaft, לראות לכל controller/broker את ה-end offset של log המטא-דאטה ואת הפיגור שלו אחרי ה-controller המוביל." } }
  ],
  mnemonic: {
    en: "\"Key picks the lane, lane keeps the order, partitions cap the crew.\" Durability formula: \"3-2-all\" = RF 3, min ISR 2, acks all.",
    he: "\"ה-key בוחר נתיב, הנתיב שומר על הסדר, ה-partitions מגבילים את הצוות.\" נוסחת ה-durability: \"3-2-all\" = RF 3, min ISR 2, acks all."
  },
  pitfalls: [
    { en: "acks=all with min.insync.replicas=1 (the broker default). If the ISR shrinks to the leader alone, writes are acked with one copy and a single disk loss loses them. Set min.insync.replicas=2 for RF=3.", he: "acks=all עם min.insync.replicas=1 (ברירת המחדל של ה-broker). אם ה-ISR מתכווץ ל-leader לבד, writes מקבלים ack עם עותק אחד, ואובדן דיסק אחד מאבד אותם. מגדירים min.insync.replicas=2 ל-RF=3." },
    { en: "Increasing partitions on a keyed topic in place. Keys move, per-key order breaks during the transition and compacted state splits across partitions.", he: "להגדיל partitions על topic עם keys במקום. keys זזים, הסדר לכל key נשבר במעבר, וה-state ב-compaction מתפצל בין partitions." },
    { en: "Doing slow work (HTTP calls, big DB writes) inside the poll loop with default max.poll.records=500. Exceeding max.poll.interval.ms causes rebalance storms where nobody makes progress.", he: "לעשות עבודה איטית (קריאות HTTP, writes גדולים ל-DB) בתוך לולאת ה-poll עם max.poll.records=500 כברירת מחדל. חריגה מ-max.poll.interval.ms גורמת לסופות rebalance שבהן אף אחד לא מתקדם." },
    { en: "Scaling consumers beyond the partition count (e.g. HPA to 60 pods on a 24-partition topic). The extra pods are idle and every scale event triggers a rebalance that hurts throughput.", he: "להגדיל consumers מעבר למספר ה-partitions (למשל HPA ל-60 pods על topic עם 24 partitions). ה-pods העודפים בטלים, וכל אירוע scaling מפעיל rebalance שפוגע ב-throughput." }
  ],
  interview: [
    {
      q: { en: "Consumer lag on one topic jumps to 2 hours, but only on partition 7. Walk me through the investigation and fixes.", he: "ה-lag על topic אחד קופץ לשעתיים, אבל רק ב-partition 7. תעביר אותי בחקירה ובתיקונים." },
      a: { en: "Single-partition lag means either a hot key or a stuck consumer. 1) describe the group: who owns P7, is its offset moving at all? Not moving → poison message or stuck thread: check consumer logs/exceptions, thread dumps; skip-and-DLQ the bad record. Moving slowly → 2) compare P7's produce rate to others (broker BytesInPerSec per partition, or kafka-log-dirs sizes) and sample keys (kcat -p 7) to find a whale key. Short term: give that consumer more resources, or temporarily move the hot entity to a dedicated topic. Long term: salt the hot key or use per-key parallel processing within the partition, and alert on time-lag per partition, not total lag.", he: "lag על partition בודד אומר key חם או consumer תקוע. 1) describe ל-group: מי מחזיק את P7, וה-offset שלו זז בכלל? לא זז ← poison message או thread תקוע: לבדוק לוגים/exceptions של ה-consumer, thread dumps; לדלג על הרשומה הרעה ולשלוח ל-DLQ. זז לאט ← 2) להשוות את קצב ה-produce של P7 לאחרים (BytesInPerSec של ה-broker לכל partition, או גדלים ב-kafka-log-dirs) ולדגום keys (kcat -p 7) כדי למצוא key לוויתן. לטווח קצר: לתת ל-consumer הזה יותר משאבים, או להעביר זמנית את ה-entity החם ל-topic ייעודי. לטווח ארוך: salt ל-key החם או עיבוד מקבילי לפי key בתוך ה-partition, ו-alert על time-lag לכל partition ולא על lag כולל." }
    },
    {
      q: { en: "What producer and topic settings would you mandate for a payments event stream, and what do they cost?", he: "אילו הגדרות producer ו-topic תחייב ל-stream של events של תשלומים, ומה הן עולות?" },
      a: { en: "RF=3 across 3 AZs (broker.rack), min.insync.replicas=2, acks=all, enable.idempotence=true, unclean.leader.election.enable=false, key = account or payment id for ordering, retention long enough to replay (e.g. 14-30 days or tiered storage), and transactions if it's a read-process-write pipeline. Costs: write latency includes a cross-AZ replication round trip (a few ms), cross-AZ traffic charges (on AWS ~$0.01/GB each way per replica, often the biggest Kafka bill item; mitigate with follower fetching for consumers via client.rack), and writes stop when 2 of 3 brokers for a partition are down. That is the right trade for money.", he: "RF=3 על 3 AZs (broker.rack), min.insync.replicas=2, acks=all, enable.idempotence=true, unclean.leader.election.enable=false, key = account או payment id בשביל סדר, retention ארוך מספיק ל-replay (למשל 14-30 ימים או tiered storage), וטרנזקציות אם זה pipeline של read-process-write. המחיר: latency של write כולל round trip של replication בין AZs (כמה ms), חיובי תעבורה בין AZs (ב-AWS בערך $0.01 ל-GB לכל כיוון לכל replica, לרוב הסעיף הכי גדול בחשבון של Kafka; מקטינים עם follower fetching ל-consumers דרך client.rack), וה-writes נעצרים כש-2 מתוך 3 brokers של partition למטה. זה ה-trade הנכון כשמדובר בכסף." }
    },
    {
      q: { en: "Rolling deploys of a 40-pod consumer group cause 10 minutes of throughput collapse. Why, and how do you fix it?", he: "Rolling deploys של consumer group עם 40 pods גורמים ל-10 דקות של קריסת throughput. למה, ואיך מתקנים?" },
      a: { en: "Each pod restart is a leave plus a join; with eager rebalancing every rebalance revokes all partitions from all 40 members, so 80 stop-the-world rebalances happen in sequence, each waiting for the slowest member to rejoin. Fixes: CooperativeStickyAssignor (or the KIP-848 consumer protocol on Kafka 4.x) so only moved partitions pause; static membership with group.instance.id = pod name and session.timeout above the restart time, so a quick restart causes no rebalance; graceful shutdown that commits offsets; maxUnavailable tuned so fewer pods bounce at once.", he: "כל restart של pod זה עזיבה ועוד הצטרפות; עם rebalancing מסוג eager כל rebalance לוקח את כל ה-partitions מכל 40 ה-members, אז מתרחשים 80 rebalances של stop-the-world ברצף, וכל אחד מחכה ל-member האיטי ביותר שיחזור. תיקונים: CooperativeStickyAssignor (או פרוטוקול ה-consumer של KIP-848 ב-Kafka 4.x) כך שרק partitions שזזים נעצרים; static membership עם group.instance.id = שם ה-pod ו-session.timeout גבוה מזמן ה-restart, כך ש-restart מהיר לא גורם ל-rebalance בכלל; graceful shutdown שעושה commit ל-offsets; ו-maxUnavailable מכוונן כך שפחות pods קופצים בבת אחת." }
    }
  ],
  quiz: [
    {
      q: { en: "RF=3, min.insync.replicas=2, acks=all. Two of the three replicas for a partition go down. What happens to producers?", he: "RF=3, min.insync.replicas=2, acks=all. שתיים מתוך שלוש ה-replicas של partition נופלות. מה קורה ל-producers?" },
      options: [
        { en: "Writes continue to the remaining leader", he: "ה-writes ממשיכים ל-leader שנשאר" },
        { en: "Writes fail with NotEnoughReplicas until the ISR is back to 2", he: "ה-writes נכשלים עם NotEnoughReplicas עד שה-ISR חוזר ל-2" },
        { en: "Kafka switches to acks=1 automatically", he: "Kafka עובר אוטומטית ל-acks=1" },
        { en: "Consumers also stop reading", he: "גם ה-consumers מפסיקים לקרוא" }
      ],
      answer: 1,
      explain: { en: "With ISR = 1, fewer than min.insync.replicas, acks=all writes are rejected. Consumers can still read already-committed data from the leader.", he: "כש-ISR = 1, פחות מ-min.insync.replicas, writes עם acks=all נדחים. ה-consumers עדיין יכולים לקרוא דאטה שכבר committed מה-leader." }
    },
    {
      q: { en: "A topic has 12 partitions and the consumer group has 20 consumers. How many are actively consuming?", he: "ל-topic יש 12 partitions ול-consumer group יש 20 consumers. כמה צורכים בפועל?" },
      options: [
        { en: "20", he: "20" },
        { en: "12", he: "12" },
        { en: "10", he: "10" },
        { en: "Depends on the assignor", he: "תלוי ב-assignor" }
      ],
      answer: 1,
      explain: { en: "Each partition goes to at most one consumer in a group, so 8 consumers are idle regardless of assignor.", he: "כל partition הולך לכל היותר ל-consumer אחד ב-group, אז 8 consumers בטלים, לא משנה איזה assignor." }
    },
    {
      q: { en: "Which cleanup policy lets a brand-new consumer rebuild the latest state per key from the beginning of the topic?", he: "איזו cleanup policy מאפשרת ל-consumer חדש לגמרי לבנות את ה-state האחרון לכל key מתחילת ה-topic?" },
      options: [
        { en: "delete with retention.ms=7d", he: "delete עם retention.ms=7d" },
        { en: "compact", he: "compact" },
        { en: "Tiered storage", he: "Tiered storage" },
        { en: "acks=all", he: "acks=all" }
      ],
      answer: 1,
      explain: { en: "Compaction retains the most recent record for every key indefinitely (until a tombstone), so the full current state is always replayable.", he: "Compaction שומר את הרשומה האחרונה לכל key ללא הגבלת זמן (עד tombstone), כך שה-state הנוכחי המלא תמיד ניתן ל-replay." }
    },
    {
      q: { en: "What does static membership (group.instance.id) prevent?", he: "מה static membership (group.instance.id) מונע?" },
      options: [
        { en: "Duplicate messages", he: "הודעות כפולות" },
        { en: "A rebalance when a consumer restarts and rejoins within session.timeout.ms", he: "rebalance כש-consumer עושה restart וחוזר בתוך session.timeout.ms" },
        { en: "Hot partitions", he: "Hot partitions" },
        { en: "Under-replicated partitions", he: "Under-replicated partitions" }
      ],
      answer: 1,
      explain: { en: "The broker keeps the member's assignment for its static id; a fast restart reclaims the same partitions without a group-wide rebalance.", he: "ה-broker שומר את השיוך של ה-member לפי ה-id הסטטי; restart מהיר מקבל בחזרה את אותם partitions בלי rebalance לכל ה-group." }
    }
  ],
  playground: "queue",
  related: ["arch-brokers", "arch-queues", "k8s-keda", "staff-exactly-once", "arch-event-driven"]
});

// ---------------------------------------------------------------------------
// 5. Queueing theory & tail latency
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-queueing-tail-latency",
  track: "staff",
  order: 5,
  icon: "📈",
  level: 3,
  minutes: 17,
  title: {
    en: "Queueing & Tail Latency: Little's Law, the Utilization Cliff, Fan-out, Hedging",
    he: "Queueing ו-Tail Latency: חוק Little, צוק הניצולת, Fan-out ו-Hedging"
  },
  tldr: {
    en: "Latency explodes non-linearly as utilization approaches 100% (wait time grows like 1/(1-ρ)), fan-out turns rare slow responses into common slow requests, and averages hide all of it: size with Little's law, run hot paths well below saturation, measure p99/p99.9 correctly (no coordinated omission), and cut the tail with hedging, timeouts and load balancing that avoids slow nodes.",
    he: "ה-latency מתפוצץ באופן לא לינארי כשהניצולת מתקרבת ל-100% (זמן ההמתנה גדל כמו 1/(1-ρ)), fan-out הופך תגובות איטיות נדירות לבקשות איטיות נפוצות, וממוצעים מסתירים את כל זה. מתכננים גודל עם חוק Little, מריצים נתיבים חמים הרחק מרוויה, מודדים p99/p99.9 נכון (בלי coordinated omission), וחותכים את הזנב עם hedging, timeouts ו-load balancing שנמנע מ-nodes איטיים."
  },
  analogy: {
    en: "A supermarket checkout at 50% busy: you rarely wait. At 90%: queues appear from nowhere when three big carts arrive together. At 99%: one coupon dispute and the line reaches the bakery. Now imagine a recipe that needs one item from each of 100 shops: even if each shop is slow only 1% of the time, you are stuck behind someone in at least one shop on most trips.",
    he: "קופה בסופר שעמוסה ב-50%: כמעט לא מחכים. ב-90%: תורים צצים משום מקום כששלוש עגלות גדולות מגיעות ביחד. ב-99%: ויכוח אחד על קופון והתור מגיע עד המאפייה. עכשיו תדמיין מתכון שצריך מוצר אחד מכל אחת מ-100 חנויות: גם אם כל חנות איטית רק ב-1% מהזמן, ברוב הסיבובים תיתקע מאחורי מישהו לפחות בחנות אחת."
  },
  sections: [
    {
      h: { en: "Little's law: the one formula you always need", he: "חוק Little: הנוסחה היחידה שתמיד צריך" },
      body: {
        en: `<p><strong>L = λ × W</strong>: average number of items in a system = arrival rate × average time each spends inside. It holds for any stable system regardless of distribution, so it is perfect for back-of-envelope sizing.</p>
<pre>Service: 2,000 req/s, average latency 50 ms
  in-flight requests L = 2000 × 0.050 = 100   -&gt; need at least 100 concurrent workers/connections

Same service when a dependency slows to 400 ms:
  L = 2000 × 0.400 = 800 in-flight            -&gt; a 200-thread pool saturates, queue builds, latency climbs further

DB pool: 20 pods × 10 conns = 200 conns; query time 5 ms -&gt; max ~40,000 q/s
         query time 50 ms (lock contention)           -&gt; max ~4,000 q/s</pre>
<p>Staff-level uses: sizing thread pools, connection pools and Kafka consumer concurrency; explaining why "the DB got slower" becomes "the API ran out of threads"; and estimating queue drain time (backlog / (service rate - arrival rate)).</p>`,
        he: `<p><strong>L = λ × W</strong>: מספר הפריטים הממוצע במערכת = קצב ההגעה × הזמן הממוצע שכל אחד מבלה בפנים. זה נכון לכל מערכת יציבה בלי קשר להתפלגות, ולכן מושלם לחישובי מעטפה.</p>
<pre>Service: 2,000 req/s, average latency 50 ms
  in-flight requests L = 2000 × 0.050 = 100   -&gt; need at least 100 concurrent workers/connections

Same service when a dependency slows to 400 ms:
  L = 2000 × 0.400 = 800 in-flight            -&gt; a 200-thread pool saturates, queue builds, latency climbs further

DB pool: 20 pods × 10 conns = 200 conns; query time 5 ms -&gt; max ~40,000 q/s
         query time 50 ms (lock contention)           -&gt; max ~4,000 q/s</pre>
<p>שימושים ברמת staff: לקבוע גודל ל-thread pools, connection pools ולמקביליות של consumers ב-Kafka; להסביר איך "ה-DB נהיה איטי" הופך ל"ל-API נגמרו ה-threads"; ולהעריך זמן ריקון של תור (backlog / (קצב שירות פחות קצב הגעה)).</p>`
      }
    },
    {
      h: { en: "The utilization cliff: why 80% is where it bends", he: "צוק הניצולת: למה ב-80% זה מתעקם" },
      body: {
        en: `<p>For the simplest queue (M/M/1: random arrivals, random service times, one server) with utilization ρ = λ/μ, the average time in system is <code>W = S / (1 - ρ)</code> where S is the service time:</p>
<table>
<tr><th>Utilization ρ</th><th>Avg latency (× service time)</th><th>Avg queue length</th></tr>
<tr><td>50%</td><td>2×</td><td>0.5</td></tr>
<tr><td>70%</td><td>3.3×</td><td>1.6</td></tr>
<tr><td>80%</td><td>5×</td><td>3.2</td></tr>
<tr><td>90%</td><td>10×</td><td>8.1</td></tr>
<tr><td>95%</td><td>20×</td><td>18</td></tr>
<tr><td>99%</td><td>100×</td><td>98</td></tr>
</table>
<p>Going from 80% to 90% <em>doubles</em> latency; 90% to 99% multiplies it by 10. Tail percentiles bend even earlier, because they are driven by bursts. Real systems are often worse than M/M/1: higher variance in service time (GC pauses, cache misses, a few huge requests) increases waiting time; the Pollaczek-Khinchine formula shows waiting time grows with <code>(1 + C²)/2</code>, where C is the coefficient of variation of service time.</p>
<ul>
<li><strong>Multiple servers help</strong> (M/M/c): with 16 cores or many pods behind one queue, you can run at higher utilization (75-85%) before the knee, because one slow job doesn't block everyone. Pooling queues beats separate per-server queues.</li>
<li><strong>Headroom is not waste.</strong> Targeting 50-65% CPU on latency-sensitive services is standard (HPA <code>averageUtilization: 60</code>). Batch and async workers can run at 90%+ because nobody waits on them interactively.</li>
<li>Capacity planning must include failure: with 3 AZs, if you lose one, the other two take 1.5× load. 60% becomes 90%, right on the cliff.</li>
</ul>`,
        he: `<p>בתור הכי פשוט (M/M/1: הגעות אקראיות, זמני שירות אקראיים, שרת אחד) עם ניצולת ρ = λ/μ, הזמן הממוצע במערכת הוא <code>W = S / (1 - ρ)</code>, כש-S הוא זמן השירות:</p>
<table>
<tr><th>ניצולת ρ</th><th>latency ממוצע (× זמן שירות)</th><th>אורך תור ממוצע</th></tr>
<tr><td>50%</td><td>2×</td><td>0.5</td></tr>
<tr><td>70%</td><td>3.3×</td><td>1.6</td></tr>
<tr><td>80%</td><td>5×</td><td>3.2</td></tr>
<tr><td>90%</td><td>10×</td><td>8.1</td></tr>
<tr><td>95%</td><td>20×</td><td>18</td></tr>
<tr><td>99%</td><td>100×</td><td>98</td></tr>
</table>
<p>מעבר מ-80% ל-90% <em>מכפיל</em> את ה-latency; מ-90% ל-99% מכפיל אותו פי 10. אחוזוני הזנב מתעקמים אפילו מוקדם יותר, כי הם מונעים ע״י bursts. מערכות אמיתיות לרוב גרועות מ-M/M/1: שונות גבוהה יותר בזמן השירות (GC pauses, cache misses, כמה בקשות ענקיות) מגדילה את זמן ההמתנה; נוסחת Pollaczek-Khinchine מראה שזמן ההמתנה גדל עם <code>(1 + C²)/2</code>, כש-C הוא מקדם השונות של זמן השירות.</p>
<ul>
<li><strong>כמה שרתים עוזרים</strong> (M/M/c): עם 16 cores או הרבה pods מאחורי תור אחד אפשר לרוץ בניצולת גבוהה יותר (75-85%) לפני הברך, כי job איטי אחד לא חוסם את כולם. תור משותף עדיף על תורים נפרדים לכל שרת.</li>
<li><strong>Headroom זה לא בזבוז.</strong> יעד של 50-65% CPU לשירותים רגישים ל-latency הוא סטנדרטי (ב-HPA <code>averageUtilization: 60</code>). workers של batch ו-async יכולים לרוץ ב-90%+ כי אף אחד לא מחכה להם באופן אינטראקטיבי.</li>
<li>תכנון קיבולת חייב לכלול כשל: עם 3 AZs, אם אחד נופל, השניים האחרים לוקחים פי 1.5 עומס. 60% הופך ל-90%, בדיוק על הצוק.</li>
</ul>`
      }
    },
    {
      h: { en: "Tail latency amplification with fan-out", he: "הגברת tail latency עם fan-out" },
      body: {
        en: `<p>If a request fans out to N backends in parallel and waits for all of them, its latency is the <em>max</em> of N samples. If each backend is slow (above its p99) 1% of the time:</p>
<pre>P(request is slow) = 1 - 0.99^N
  N=1    -&gt; 1%
  N=10   -&gt; 9.6%
  N=100  -&gt; 63%      &lt;- the backend's p99 is now the request's MEDIAN experience
  N=1000 -&gt; 99.996%</pre>
<p>This is the core of Dean &amp; Barroso's <em>The Tail at Scale</em> (2013). Same effect in microservice call chains: a page that makes 30 sequential/parallel calls, a search scatter-gather over 200 shards, a GraphQL resolver fan-out. Mitigations:</p>
<ul>
<li><strong>Hedged requests:</strong> send to one replica; if no reply by ~p95, send a second copy to another replica and take the first answer. Google reported p99.9 for a BigTable 1,000-key read dropping from 1,800 ms to 74 ms for just 2% extra requests. Only for idempotent reads; cap the hedge rate (e.g. max 5% extra) so you don't double load during an incident.</li>
<li><strong>Tied requests:</strong> send to two replicas, each tagged with the other; whichever starts first cancels the other. Cuts queueing delay with almost no extra work.</li>
<li><strong>Good-enough responses:</strong> return after 95% of shards answer (search, recommendations) instead of waiting for the slowest.</li>
<li><strong>Load balancing that sees latency:</strong> least-outstanding-requests / power-of-two-choices (Envoy <code>LEAST_REQUEST</code>) and outlier ejection avoid sending to the replica that is in a GC pause.</li>
<li><strong>Reduce variance at the source:</strong> smaller, uniform shards, background work throttled, GC tuning, separate queues for big vs small requests.</li>
</ul>`,
        he: `<p>אם בקשה מתפצלת ל-N backends במקביל ומחכה לכולם, ה-latency שלה הוא ה-<em>מקסימום</em> מתוך N דגימות. אם כל backend איטי (מעל ה-p99 שלו) ב-1% מהזמן:</p>
<pre>P(request is slow) = 1 - 0.99^N
  N=1    -&gt; 1%
  N=10   -&gt; 9.6%
  N=100  -&gt; 63%      &lt;- the backend's p99 is now the request's MEDIAN experience
  N=1000 -&gt; 99.996%</pre>
<p>זה הלב של <em>The Tail at Scale</em> של Dean ו-Barroso (2013). אותו אפקט בשרשראות קריאות של מיקרו-שירותים: דף שעושה 30 קריאות טוריות/מקבילות, חיפוש scatter-gather על 200 shards, fan-out של resolvers ב-GraphQL. דרכי התמודדות:</p>
<ul>
<li><strong>Hedged requests:</strong> שולחים ל-replica אחת; אם אין תשובה עד בערך ה-p95, שולחים עותק שני ל-replica אחרת ולוקחים את התשובה הראשונה. Google דיווחו שה-p99.9 של קריאת 1,000 keys מ-BigTable ירד מ-1,800 ms ל-74 ms במחיר של 2% בקשות נוספות בלבד. רק ל-reads שהם idempotent; מגבילים את קצב ה-hedging (למשל עד 5% תוספת) כדי לא להכפיל עומס באמצע תקלה.</li>
<li><strong>Tied requests:</strong> שולחים לשתי replicas, כל אחת מסומנת עם השנייה; מי שמתחילה לעבד ראשונה מבטלת את השנייה. חותך זמן המתנה בתור כמעט בלי עבודה נוספת.</li>
<li><strong>תשובות מספיק טובות:</strong> מחזירים אחרי ש-95% מה-shards ענו (חיפוש, המלצות) במקום לחכות לאיטי ביותר.</li>
<li><strong>Load balancing שרואה latency:</strong> least-outstanding-requests / power-of-two-choices (ב-Envoy זה <code>LEAST_REQUEST</code>) ו-outlier ejection נמנעים משליחה ל-replica שנמצאת באמצע GC pause.</li>
<li><strong>להקטין שונות במקור:</strong> shards קטנים ואחידים, עבודת רקע מוגבלת, כיוונון GC, תורים נפרדים לבקשות גדולות וקטנות.</li>
</ul>`
      }
    },
    {
      h: { en: "Measuring it right: percentiles and coordinated omission", he: "למדוד נכון: אחוזונים ו-coordinated omission" },
      body: {
        en: `<ul>
<li><strong>Averages lie.</strong> 99 requests at 10 ms + 1 at 5 s = mean 60 ms, which no user ever experienced. Report p50, p99, p99.9 and max. SLOs should be written on percentiles or as "fraction of requests under X ms".</li>
<li><strong>You can't average percentiles.</strong> The mean of 10 pods' p99 is not the service's p99. Aggregate histograms, then compute: in Prometheus, <code>histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))</code>, and choose bucket boundaries around your SLO threshold (e.g. 0.1, 0.25, 0.3, 0.5, 1). Native histograms remove most of that pain.</li>
<li><strong>Coordinated omission</strong> (Gil Tene): a closed-loop load tester sends a request, waits for the reply, then sends the next. When the server stalls for 2 s, the tester also stops sending, so it records <em>one</em> slow sample instead of the ~200 requests real users would have sent during the stall. Result: reported p99 can be 10-100× too optimistic.</li>
</ul>
<pre># closed loop, suffers from coordinated omission:
wrk -t4 -c64 -d60s https://api.internal/search
# constant-throughput, corrects for it (HdrHistogram):
wrk2 -t4 -c64 -d60s -R 2000 --latency https://api.internal/search
# k6: open model with constant arrival rate
executor: 'constant-arrival-rate', rate: 2000, timeUnit: '1s', preAllocatedVUs: 200</pre>
<blockquote>💡 Real world: client-side latency is what users feel. Server histograms miss time spent in the load balancer queue, TCP accept backlog, and retries. Measure at the edge (LB/ingress metrics) and from synthetic probes in addition to app metrics.</blockquote>`,
        he: `<ul>
<li><strong>ממוצעים משקרים.</strong> 99 בקשות של 10 ms ועוד אחת של 5 שניות = ממוצע של 60 ms, שאף משתמש לא חווה. מדווחים p50, p99, p99.9 ו-max. SLOs נכתבים על אחוזונים או כ"שיעור הבקשות מתחת ל-X ms".</li>
<li><strong>אי אפשר למצע אחוזונים.</strong> הממוצע של ה-p99 של 10 pods הוא לא ה-p99 של השירות. מאחדים histograms ואז מחשבים: ב-Prometheus, <code>histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))</code>, ובוחרים גבולות buckets סביב סף ה-SLO (למשל 0.1, 0.25, 0.3, 0.5, 1). Native histograms מורידים את רוב הכאב הזה.</li>
<li><strong>Coordinated omission</strong> (Gil Tene): כלי עומס בלולאה סגורה שולח בקשה, מחכה לתשובה, ואז שולח את הבאה. כשהשרת נתקע ל-2 שניות, גם הכלי מפסיק לשלוח, אז הוא רושם דגימה איטית <em>אחת</em> במקום ~200 הבקשות שמשתמשים אמיתיים היו שולחים בזמן התקיעה. התוצאה: ה-p99 המדווח יכול להיות אופטימי פי 10-100.</li>
</ul>
<pre># closed loop, suffers from coordinated omission:
wrk -t4 -c64 -d60s https://api.internal/search
# constant-throughput, corrects for it (HdrHistogram):
wrk2 -t4 -c64 -d60s -R 2000 --latency https://api.internal/search
# k6: open model with constant arrival rate
executor: 'constant-arrival-rate', rate: 2000, timeUnit: '1s', preAllocatedVUs: 200</pre>
<blockquote>💡 מהשטח: ה-latency בצד הלקוח הוא מה שמשתמשים מרגישים. histograms בשרת מפספסים זמן בתור של ה-load balancer, ב-accept backlog של TCP וב-retries. מודדים בקצה (metrics של LB/ingress) ומ-synthetic probes בנוסף ל-metrics של האפליקציה.</blockquote>`
      }
    }
  ],
  diagram: `latency
  (x S)
  100 |                                              *  (99%)
   20 |                                        *        (95%)
   10 |                                   *             (90%)
    5 |                          *                      (80%)  <- knee
    2 |             *                                   (50%)
    1 +---------------------------------------------------- utilization
      0%           50%          80%   90%  95%  99%

fan-out:  user -> [agg] -> 100 leaves, each slow 1%  => 63% of requests slow
hedge:    send A; no reply by p95 -> send B; first wins, cancel other`,
  handsOn: [
    { cmd: "wrk2 -t4 -c100 -d120s -R 3000 --latency http://svc.internal:8080/api/items", what: { en: "Constant-rate load test (3,000 req/s) with an HdrHistogram that corrects coordinated omission. Repeat at increasing -R to find the knee where p99 bends upward.", he: "בדיקת עומס בקצב קבוע (3,000 בקשות לשנייה) עם HdrHistogram שמתקן coordinated omission. חוזרים עם -R עולה כדי למצוא את הברך שבה ה-p99 מתחיל לעלות." } },
    { cmd: "histogram_quantile(0.99, sum by (le, route) (rate(http_server_request_duration_seconds_bucket{service=\"checkout\"}[5m])))", what: { en: "PromQL: the true p99 per route, computed from summed histogram buckets across all pods (never average per-pod p99s).", he: "PromQL: ה-p99 האמיתי לכל route, מחושב מסכום ה-buckets של ה-histogram על כל ה-pods (אף פעם לא ממצעים p99 של כל pod)." } },
    { cmd: "sum(rate(http_server_requests_total[1m])) * histogram_quantile(0.5, sum by (le) (rate(http_server_request_duration_seconds_bucket[1m])))", what: { en: "Rough Little's law in PromQL (rate × typical latency) to estimate in-flight concurrency; compare with your thread or connection pool size.", he: "חוק Little בערך ב-PromQL (קצב × latency טיפוסי) כדי להעריך את המקביליות בפועל; להשוות לגודל ה-thread pool או ה-connection pool." } },
    { cmd: "kubectl top pods -l app=search --containers && kubectl get hpa search -o jsonpath='{.spec.metrics[0].resource.target}'", what: { en: "Check how hot the pods run versus the HPA target. If steady-state CPU is 85% on a latency-sensitive service, you are already past the knee.", he: "לבדוק כמה חם ה-pods רצים מול יעד ה-HPA. אם ה-CPU במצב יציב הוא 85% בשירות רגיש ל-latency, אתה כבר אחרי הברך." } }
  ],
  mnemonic: {
    en: "\"L equals lambda W\" for sizing; \"one over one minus rho\" for the cliff; \"one minus 0.99 to the N\" for fan-out; \"open loop or it's a lie\" for load tests.",
    he: "\"L שווה למדא כפול W\" לתכנון גודל; \"אחד חלקי אחד פחות רו\" לצוק; \"אחד פחות 0.99 בחזקת N\" ל-fan-out; \"open loop או שזה שקר\" לבדיקות עומס."
  },
  pitfalls: [
    { en: "Setting HPA CPU targets at 85-90% to save money on a latency-sensitive service. You are on the steep part of the curve, and losing one AZ pushes you past 100%.", he: "לקבוע יעד CPU של 85-90% ב-HPA כדי לחסוך כסף בשירות רגיש ל-latency. אתה בחלק התלול של העקומה, ואובדן AZ אחד דוחף אותך מעבר ל-100%." },
    { en: "Averaging per-instance p99s or reporting mean latency in SLO dashboards. Both hide the tail users feel; aggregate histograms and compute quantiles once.", he: "למצע p99 של כל instance או לדווח latency ממוצע בדשבורדים של SLO. שניהם מסתירים את הזנב שהמשתמשים מרגישים; מאחדים histograms ומחשבים quantiles פעם אחת." },
    { en: "Benchmarking with closed-loop tools (ab, wrk, JMeter default thread groups) and trusting the p99. Coordinated omission hides stalls; use wrk2, k6 arrival-rate executors or Gatling open models.", he: "לעשות benchmark עם כלים בלולאה סגורה (ab, wrk, thread groups ברירת מחדל ב-JMeter) ולסמוך על ה-p99. Coordinated omission מסתיר תקיעות; משתמשים ב-wrk2, ב-executors של arrival-rate ב-k6 או ב-open models של Gatling." },
    { en: "Hedging non-idempotent requests or hedging without a cap. During an incident every request is slow, so uncapped hedging doubles load exactly when you can't afford it.", he: "לעשות hedging לבקשות שאינן idempotent או בלי תקרה. בזמן תקלה כל בקשה איטית, אז hedging בלי הגבלה מכפיל את העומס בדיוק כשאין לך מקום לזה." }
  ],
  interview: [
    {
      q: { en: "A search page queries 50 shards in parallel. Each shard's p99 is 40 ms but the page p99 is 300 ms. Explain and propose fixes.", he: "דף חיפוש שולח שאילתה ל-50 shards במקביל. ה-p99 של כל shard הוא 40 ms אבל ה-p99 של הדף הוא 300 ms. תסביר ותציע תיקונים." },
      a: { en: "The page waits for the slowest of 50, so the chance at least one shard exceeds its p99 is 1 - 0.99^50 ≈ 40%. The page p99 is therefore driven by the shards' p99.9+ (GC pauses, compactions, cold caches). Fixes: hedge after the shard p95 with a 5% hedge budget, tied requests across replicas, return partial results after ~95% of shards respond or after a deadline, least-request LB with outlier ejection, and reduce per-shard variance (smaller shards, throttle background merges). Verify with per-shard histograms and an open-loop load test.", he: "הדף מחכה לאיטי מבין 50, אז הסיכוי שלפחות shard אחד יעבור את ה-p99 שלו הוא 1 - 0.99^50 ≈ 40%. לכן ה-p99 של הדף נקבע ע״י ה-p99.9 ומעלה של ה-shards (GC pauses, compactions, caches קרים). תיקונים: hedging אחרי ה-p95 של ה-shard עם תקציב hedging של 5%, tied requests בין replicas, להחזיר תוצאות חלקיות אחרי ש-95% מה-shards ענו או אחרי deadline, LB מסוג least-request עם outlier ejection, ולהקטין שונות לכל shard (shards קטנים יותר, להגביל merges ברקע). מאמתים עם histograms לכל shard ובדיקת עומס open-loop." }
    },
    {
      q: { en: "Finance asks why the checkout service runs at 45% CPU. Defend or change it.", he: "הכספים שואלים למה שירות ה-checkout רץ ב-45% CPU. תגן על זה או תשנה." },
      a: { en: "Show the curve: measure p99 vs utilization with a constant-rate test; typically p99 starts bending at 60-70% for a single-threaded-ish service. Then add failure math: 3 AZs at 45% become 67.5% after losing one AZ, still under the knee; at 60% they'd become 90% during an AZ outage, which is when you need checkout most. Also show spikes: peak-to-average ratio and HPA reaction time (~1-3 min) require buffer. Then offer savings that don't cost latency: right-size requests, scale down off-peak, move async work to batch workers that run at 85%+, spot for workers, and better LB to reduce variance so the knee moves right.", he: "להראות את העקומה: למדוד p99 מול ניצולת עם בדיקת עומס בקצב קבוע; בדרך כלל ה-p99 מתחיל להתעקם ב-60-70%. ואז להוסיף מתמטיקה של כשל: 3 AZs ב-45% הופכים ל-67.5% אחרי אובדן AZ, עדיין מתחת לברך; ב-60% הם היו הופכים ל-90% בזמן השבתה של AZ, בדיוק כשהכי צריך את ה-checkout. בנוסף להראות קפיצות: היחס בין peak לממוצע וזמן התגובה של HPA (1-3 דקות) מחייבים buffer. ואז להציע חיסכון שלא עולה ב-latency: right-size ל-requests, scale down בשעות שקטות, להעביר עבודה אסינכרונית ל-workers של batch שרצים ב-85%+, spot ל-workers, ו-LB טוב יותר שמקטין שונות כך שהברך זזה ימינה." }
    }
  ],
  quiz: [
    {
      q: { en: "A service handles 500 req/s with 200 ms average latency. How many requests are in flight on average?", he: "שירות מטפל ב-500 בקשות לשנייה עם latency ממוצע של 200 ms. כמה בקשות נמצאות בממוצע בטיפול?" },
      options: [
        { en: "2.5", he: "2.5" },
        { en: "100", he: "100" },
        { en: "250", he: "250" },
        { en: "2,500", he: "2,500" }
      ],
      answer: 1,
      explain: { en: "Little's law: L = λW = 500 × 0.2 = 100.", he: "חוק Little: L = λW = 500 × 0.2 = 100." }
    },
    {
      q: { en: "In an M/M/1 queue, going from 80% to 90% utilization changes average latency by roughly…", he: "בתור M/M/1, מעבר מניצולת של 80% ל-90% משנה את ה-latency הממוצע בערך ב…" },
      options: [
        { en: "+12%", he: "עלייה של 12%" },
        { en: "×2", he: "פי 2" },
        { en: "×10", he: "פי 10" },
        { en: "No change", he: "אין שינוי" }
      ],
      answer: 1,
      explain: { en: "W = S/(1-ρ): 1/0.2 = 5S becomes 1/0.1 = 10S, double.", he: "W = S/(1-ρ): מ-1/0.2 = 5S ל-1/0.1 = 10S, פי 2." }
    },
    {
      q: { en: "What is coordinated omission?", he: "מה זה coordinated omission?" },
      options: [
        { en: "Dropping metrics during high load", he: "השמטת metrics בזמן עומס גבוה" },
        { en: "A load generator that waits for responses and therefore stops sending during stalls, under-reporting latency", he: "מחולל עומס שמחכה לתשובות ולכן מפסיק לשלוח בזמן תקיעות, ומדווח latency נמוך מהאמת" },
        { en: "Retries that are coordinated across clients", he: "Retries שמתואמים בין לקוחות" },
        { en: "Sampling only successful traces", he: "דגימה של traces מוצלחים בלבד" }
      ],
      answer: 1,
      explain: { en: "Closed-loop testers 'coordinate' with the server: the slower it gets, the fewer requests they send, so the slow period is under-sampled.", he: "כלים בלולאה סגורה 'מתאמים' עם השרת: ככל שהוא מאט, הם שולחים פחות בקשות, כך שהתקופה האיטית נדגמת פחות מדי." }
    },
    {
      q: { en: "A request fans out to 100 backends, each above its p99 1% of the time. Probability the request hits at least one slow backend?", he: "בקשה מתפצלת ל-100 backends, שכל אחד מהם מעל ה-p99 שלו ב-1% מהזמן. מה הסיכוי שהבקשה תפגוש לפחות backend איטי אחד?" },
      options: [
        { en: "1%", he: "1%" },
        { en: "10%", he: "10%" },
        { en: "About 63%", he: "בערך 63%" },
        { en: "100%", he: "100%" }
      ],
      answer: 2,
      explain: { en: "1 - 0.99^100 ≈ 0.634.", he: "1 - 0.99^100 ≈ 0.634." }
    }
  ],
  playground: "queue",
  related: ["rel-capacity-planning", "obs-metrics", "latency-numbers", "staff-overload-metastable", "net-load-balancing"]
});

// ---------------------------------------------------------------------------
// 6. Overload, retries & metastable failures
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-overload-metastable",
  track: "staff",
  order: 6,
  icon: "🌊",
  level: 3,
  minutes: 19,
  title: {
    en: "Overload & Metastable Failures: Load Shedding, Backpressure, Retry Budgets, Breakers",
    he: "עומס יתר ו-Metastable Failures: Load Shedding, Backpressure, Retry Budgets ו-Circuit Breakers"
  },
  tldr: {
    en: "Systems rarely die from the initial spike; they die because retries, cold caches and queued work keep them overloaded after the trigger is gone (a metastable failure). Defend in layers: bounded queues and backpressure, load shedding by priority, retry budgets with jittered backoff, circuit breakers, and admission control that keeps goodput flat when load exceeds capacity.",
    he: "מערכות כמעט אף פעם לא מתות מהקפיצה הראשונית; הן מתות כי retries, caches קרים ועבודה שמחכה בתור משאירים אותן בעומס יתר גם אחרי שהטריגר נעלם (metastable failure). מתגוננים בשכבות: תורים חסומים ו-backpressure, load shedding לפי עדיפות, retry budgets עם backoff ו-jitter, circuit breakers, ו-admission control ששומר על goodput שטוח כשהעומס עובר את הקיבולת."
  },
  analogy: {
    en: "A highway at rush hour: an accident blocks one lane for ten minutes, but the jam lasts two hours, because the queue itself keeps the road at capacity long after the wreck is towed. Retries are drivers who, when stuck, call three friends to also drive the same route. Load shedding is the on-ramp traffic light that holds cars back so the highway keeps moving at full speed instead of grinding to a halt.",
    he: "כביש מהיר בשעת עומס: תאונה חוסמת נתיב אחד לעשר דקות, אבל הפקק נמשך שעתיים, כי התור עצמו משאיר את הכביש בקיבולת מלאה הרבה אחרי שגררו את הרכב. Retries הם נהגים שכשהם תקועים מתקשרים לשלושה חברים שייסעו באותו מסלול. Load shedding זה הרמזור בכניסה לכביש שעוצר מכוניות כדי שהכביש ימשיך לזרום במהירות מלאה במקום להיתקע לגמרי."
  },
  sections: [
    {
      h: { en: "Goodput collapse and metastable failures", he: "קריסת goodput ו-metastable failures" },
      body: {
        en: `<p>Plot <em>goodput</em> (successful, useful responses per second) against offered load. A healthy system rises to capacity and stays flat. An unprotected one rises, then <strong>collapses</strong>: requests time out after consuming resources, clients retry, queues fill with work whose callers already gave up, and goodput falls to near zero while CPU sits at 100%.</p>
<p>A <strong>metastable failure</strong> (Bronson et al., HotOS 2021; Huang et al., OSDI 2022) is when a system has two stable states at the same load: healthy, and a degraded state that a <em>trigger</em> (deploy, traffic spike, a dependency blip, cache flush) pushes it into, and that a <em>sustaining effect</em> keeps it in after the trigger is removed. Common sustaining loops:</p>
<ul>
<li><strong>Retry amplification:</strong> slow → timeouts → retries → more load → slower. 3 layers each doing 3 attempts = 3³ = <strong>27× load</strong> on the bottom service.</li>
<li><strong>Cache collapse:</strong> cache hit ratio falls 95% → 50% after a flush or a restart; DB load goes 10× and the DB is too slow to repopulate the cache.</li>
<li><strong>Queue of dead work:</strong> a backlog of requests whose clients timed out; the server processes them in FIFO order and every response is too late.</li>
<li><strong>GC / memory pressure:</strong> more in-flight requests → more heap → longer GC pauses → slower → even more in-flight.</li>
</ul>
<p>Recovery from a metastable state requires <strong>removing load below the healthy threshold</strong> (not just back to the pre-trigger level): shed traffic, disable retries, block a client, scale far above normal, then ramp up gradually.</p>
<blockquote>💡 Real world: the AWS us-east-1 outage of December 2021 had exactly this shape: an automated scaling event triggered a surge of connection activity on the internal network, retries and backoff-less clients kept the network devices congested for hours, and internal monitoring itself was impaired.</blockquote>`,
        he: `<p>תשרטטו <em>goodput</em> (תשובות מוצלחות ושימושיות לשנייה) מול העומס המוצע. מערכת בריאה עולה עד הקיבולת ונשארת שטוחה. מערכת לא מוגנת עולה ואז <strong>קורסת</strong>: בקשות עושות timeout אחרי שכבר צרכו משאבים, לקוחות עושים retry, התורים מתמלאים בעבודה שמי ששלח אותה כבר ויתר, וה-goodput צונח לכמעט אפס כשה-CPU ב-100%.</p>
<p><strong>Metastable failure</strong> (Bronson ואחרים, HotOS 2021; Huang ואחרים, OSDI 2022) זה מצב שבו למערכת יש שני מצבים יציבים באותו עומס: בריא, ומצב מושפל ש<em>טריגר</em> (deploy, קפיצת תנועה, תקלה רגעית בתלות, ניקוי cache) דוחף אותה אליו, ו<em>אפקט מקיים</em> משאיר אותה בו גם אחרי שהטריגר הוסר. לולאות מקיימות נפוצות:</p>
<ul>
<li><strong>הגברת retries:</strong> איטי ← timeouts ← retries ← עוד עומס ← יותר איטי. 3 שכבות שכל אחת עושה 3 ניסיונות = 3³ = <strong>פי 27 עומס</strong> על השירות התחתון.</li>
<li><strong>קריסת cache:</strong> ה-hit ratio יורד מ-95% ל-50% אחרי flush או restart; העומס על ה-DB קופץ פי 10, וה-DB איטי מדי כדי למלא את ה-cache מחדש.</li>
<li><strong>תור של עבודה מתה:</strong> backlog של בקשות שהלקוחות שלהן כבר עשו timeout; השרת מעבד אותן ב-FIFO וכל תשובה מגיעה מאוחר מדי.</li>
<li><strong>לחץ GC / זיכרון:</strong> יותר בקשות בטיפול ← יותר heap ← GC pauses ארוכים יותר ← יותר איטי ← עוד יותר בקשות בטיפול.</li>
</ul>
<p>יציאה ממצב metastable דורשת <strong>להוריד את העומס מתחת לסף הבריא</strong> (לא רק חזרה לרמה שלפני הטריגר): לזרוק תנועה, לכבות retries, לחסום לקוח, לעשות scale הרבה מעל הרגיל, ואז להעלות בהדרגה.</p>
<blockquote>💡 מהשטח: ההשבתה של AWS ב-us-east-1 בדצמבר 2021 הייתה בדיוק בצורה הזו: אירוע scaling אוטומטי הפעיל גל של פעילות חיבורים ברשת הפנימית, retries ולקוחות בלי backoff השאירו את רכיבי הרשת עמוסים לשעות, וגם הניטור הפנימי עצמו נפגע.</blockquote>`
      }
    },
    {
      h: { en: "Retries done right: backoff, jitter, budgets", he: "Retries נכון: backoff, jitter ו-budgets" },
      body: {
        en: `<ul>
<li><strong>Retry at one layer only</strong>, usually the one closest to the user or the one that knows the operation is idempotent. Inner layers fail fast.</li>
<li><strong>Exponential backoff with full jitter</strong> (AWS Architecture Blog): <code>sleep = random(0, min(cap, base × 2^attempt))</code>. Without jitter, all clients that failed together retry together, in synchronized waves.</li>
<li><strong>Retry budget:</strong> cap retries as a fraction of traffic, e.g. retries may add at most 10% to the request rate. When the budget is exhausted, fail immediately. This turns 27× amplification into at most 1.1×.</li>
<li><strong>Don't retry</strong> 4xx (except 408/429), non-idempotent calls without a key, or when the deadline has passed. Propagate deadlines (gRPC <code>grpc-timeout</code>) so servers drop work nobody waits for.</li>
<li>Honor <code>Retry-After</code> and 429/503 as backpressure signals.</li>
</ul>
<pre># gRPC service config: retries + retry throttling (a token-bucket retry budget)
{
  "methodConfig": [{
    "name": [{ "service": "inventory.v1.Inventory" }],
    "timeout": "0.8s",
    "retryPolicy": {
      "maxAttempts": 3, "initialBackoff": "0.05s", "maxBackoff": "1s",
      "backoffMultiplier": 2, "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }],
  "retryThrottling": { "maxTokens": 10, "tokenRatio": 0.1 }
}
# Envoy route: retry budget instead of a fixed max_retries
retry_policy: { retry_on: "5xx,reset,connect-failure", num_retries: 2,
                retry_back_off: { base_interval: 0.025s, max_interval: 0.25s } }
circuit_breakers:
  thresholds: [{ retry_budget: { budget_percent: { value: 10.0 }, min_retry_concurrency: 3 } }]</pre>
<p>AWS SDKs ship this built in: "standard" retry mode = 3 attempts, jittered exponential backoff, and a client-side retry quota (500 tokens, 5 per retry, 10 per timeout retry) that stops retrying when a dependency is clearly down.</p>`,
        he: `<ul>
<li><strong>Retry רק בשכבה אחת</strong>, בדרך כלל הקרובה ביותר למשתמש או זו שיודעת שהפעולה idempotent. שכבות פנימיות נכשלות מהר.</li>
<li><strong>Exponential backoff עם full jitter</strong> (מהבלוג של AWS Architecture): <code>sleep = random(0, min(cap, base × 2^attempt))</code>. בלי jitter, כל הלקוחות שנכשלו ביחד עושים retry ביחד, בגלים מסונכרנים.</li>
<li><strong>Retry budget:</strong> מגבילים retries כאחוז מהתנועה, למשל retries יכולים להוסיף לכל היותר 10% לקצב הבקשות. כשהתקציב נגמר, נכשלים מיד. זה הופך הגברה של פי 27 ללכל היותר פי 1.1.</li>
<li><strong>לא עושים retry</strong> על 4xx (חוץ מ-408/429), על קריאות שאינן idempotent בלי key, או כשה-deadline עבר. מעבירים deadlines הלאה (<code>grpc-timeout</code> ב-gRPC) כדי שהשרתים יזרקו עבודה שאף אחד לא מחכה לה.</li>
<li>מכבדים <code>Retry-After</code> ומתייחסים ל-429/503 כאותות backpressure.</li>
</ul>
<pre># gRPC service config: retries + retry throttling (a token-bucket retry budget)
{
  "methodConfig": [{
    "name": [{ "service": "inventory.v1.Inventory" }],
    "timeout": "0.8s",
    "retryPolicy": {
      "maxAttempts": 3, "initialBackoff": "0.05s", "maxBackoff": "1s",
      "backoffMultiplier": 2, "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }],
  "retryThrottling": { "maxTokens": 10, "tokenRatio": 0.1 }
}
# Envoy route: retry budget instead of a fixed max_retries
retry_policy: { retry_on: "5xx,reset,connect-failure", num_retries: 2,
                retry_back_off: { base_interval: 0.025s, max_interval: 0.25s } }
circuit_breakers:
  thresholds: [{ retry_budget: { budget_percent: { value: 10.0 }, min_retry_concurrency: 3 } }]</pre>
<p>ה-SDKs של AWS כוללים את זה מובנה: מצב retry "standard" = 3 ניסיונות, exponential backoff עם jitter, ו-retry quota בצד הלקוח (500 tokens, 5 לכל retry, 10 ל-retry אחרי timeout) שמפסיק לעשות retries כשתלות ברור שלמטה.</p>`
      }
    },
    {
      h: { en: "Backpressure, load shedding and admission control", he: "Backpressure, load shedding ו-admission control" },
      body: {
        en: `<p><strong>Backpressure</strong> = a slow consumer can make a fast producer slow down, instead of letting buffers grow without bound. Mechanisms: bounded queues that block or reject when full, TCP flow control, gRPC/HTTP2 flow-control windows, Reactive Streams <code>request(n)</code>, Kafka consumers that simply pull slower (the log is the buffer), 429 + Retry-After at the edge.</p>
<p><strong>Every queue must be bounded.</strong> An unbounded queue converts overload into latency and then into OOM. Size it from Little's law: if the latency SLO is 500 ms and the server processes 200 req/s, more than ~100 queued requests can never meet the SLO, so reject the 101st.</p>
<p><strong>Load shedding</strong> = deliberately rejecting some work early and cheaply to protect the rest:</p>
<ul>
<li><strong>Shed early and cheaply</strong>: at the LB/gateway or before deserializing the body, not after doing 80% of the work.</li>
<li><strong>By priority/criticality</strong>: Google tags requests CRITICAL_PLUS / CRITICAL / SHEDDABLE_PLUS / SHEDDABLE; under pressure, batch and prefetch traffic is dropped first, checkout last.</li>
<li><strong>By age</strong>: drop requests whose deadline already passed; use <strong>adaptive LIFO</strong> under overload (Facebook): serve newest first so at least some users get fast answers instead of everyone getting slow ones; CoDel-style queue delay targets.</li>
<li><strong>Per-tenant fairness</strong>: quotas/rate limits per customer so one noisy tenant can't consume the whole capacity.</li>
</ul>
<p><strong>Admission control / adaptive concurrency</strong>: instead of a fixed limit, measure latency and adjust the allowed in-flight count like TCP congestion control (Netflix <code>concurrency-limits</code> with Vegas/Gradient algorithms; Envoy <code>adaptive_concurrency</code> filter; Envoy <code>admission_control</code> filter that rejects probabilistically based on recent success rate).</p>`,
        he: `<p><strong>Backpressure</strong> = consumer איטי יכול לגרום ל-producer מהיר להאט, במקום לתת ל-buffers לגדול בלי סוף. מנגנונים: תורים חסומים שחוסמים או דוחים כשהם מלאים, flow control של TCP, חלונות flow-control ב-gRPC/HTTP2, <code>request(n)</code> של Reactive Streams, consumers של Kafka שפשוט מושכים לאט יותר (ה-log הוא ה-buffer), 429 + Retry-After בקצה.</p>
<p><strong>כל תור חייב להיות חסום.</strong> תור בלי גבול הופך עומס יתר ל-latency ואחר כך ל-OOM. קובעים גודל לפי חוק Little: אם ה-SLO ל-latency הוא 500 ms והשרת מעבד 200 בקשות לשנייה, יותר מ-~100 בקשות בתור לעולם לא יעמדו ב-SLO, אז דוחים את ה-101.</p>
<p><strong>Load shedding</strong> = לדחות בכוונה חלק מהעבודה מוקדם ובזול כדי להגן על השאר:</p>
<ul>
<li><strong>לזרוק מוקדם ובזול</strong>: ב-LB/gateway או לפני deserialize של ה-body, לא אחרי שעשית 80% מהעבודה.</li>
<li><strong>לפי עדיפות/קריטיות</strong>: ב-Google מתייגים בקשות CRITICAL_PLUS / CRITICAL / SHEDDABLE_PLUS / SHEDDABLE; תחת לחץ, תנועת batch ו-prefetch נזרקת ראשונה, checkout אחרון.</li>
<li><strong>לפי גיל</strong>: זורקים בקשות שה-deadline שלהן כבר עבר; משתמשים ב-<strong>adaptive LIFO</strong> בעומס יתר (Facebook): משרתים את החדשות קודם, כך שלפחות חלק מהמשתמשים מקבלים תשובות מהירות במקום שכולם יקבלו תשובות איטיות; יעדי queue delay בסגנון CoDel.</li>
<li><strong>הוגנות לכל tenant</strong>: quotas/rate limits לכל לקוח כדי ש-tenant רועש אחד לא יאכל את כל הקיבולת.</li>
</ul>
<p><strong>Admission control / adaptive concurrency</strong>: במקום limit קבוע, מודדים latency ומכווננים את מספר הבקשות המותר בטיפול כמו congestion control של TCP (<code>concurrency-limits</code> של Netflix עם אלגוריתמי Vegas/Gradient; filter של <code>adaptive_concurrency</code> ב-Envoy; filter של <code>admission_control</code> ב-Envoy שדוחה באופן הסתברותי לפי שיעור ההצלחה האחרון).</p>`
      }
    },
    {
      h: { en: "Circuit breakers and outlier ejection", he: "Circuit breakers ו-outlier ejection" },
      body: {
        en: `<p>A <strong>circuit breaker</strong> wraps calls to a dependency. <em>Closed</em>: calls flow, failures are counted. When the error rate over a window crosses a threshold (e.g. 50% of at least 20 calls in 10 s) it <em>opens</em>: calls fail instantly (or use a fallback) without touching the dependency. After a cool-down (e.g. 30 s) it goes <em>half-open</em> and lets a few probe calls through; success closes it, failure re-opens it.</p>
<pre># resilience4j (Java)
resilience4j.circuitbreaker.instances.inventory:
  slidingWindowType: TIME_BASED
  slidingWindowSize: 10
  minimumNumberOfCalls: 20
  failureRateThreshold: 50
  slowCallDurationThreshold: 800ms
  slowCallRateThreshold: 80
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 5

# Envoy / Istio: outlier ejection = per-host breaker
outlierDetection:
  consecutive5xxErrors: 5
  interval: 10s
  baseEjectionTime: 30s
  maxEjectionPercent: 50     # never eject more than half the pool</pre>
<p>Note Envoy's <code>circuit_breakers</code> are actually <em>concurrency limits</em> (max_connections, max_pending_requests, max_requests, all default 1024; max_retries default 3), and <code>outlier_detection</code> is the per-host "stop sending to the broken one" mechanism. Breakers protect the <em>caller</em> (no threads stuck waiting) and give the callee room to recover. They must be paired with a meaningful fallback: cached data, a default, a degraded feature, or a fast clear error.</p>`,
        he: `<p><strong>Circuit breaker</strong> עוטף קריאות לתלות. <em>Closed</em>: הקריאות זורמות, וכשלים נספרים. כששיעור השגיאות בחלון זמן עובר סף (למשל 50% מתוך לפחות 20 קריאות ב-10 שניות) הוא <em>נפתח</em>: קריאות נכשלות מיד (או עוברות ל-fallback) בלי לגעת בתלות. אחרי זמן צינון (למשל 30 שניות) הוא עובר ל-<em>half-open</em> ומעביר כמה קריאות בדיקה; הצלחה סוגרת אותו, כשל פותח שוב.</p>
<pre># resilience4j (Java)
resilience4j.circuitbreaker.instances.inventory:
  slidingWindowType: TIME_BASED
  slidingWindowSize: 10
  minimumNumberOfCalls: 20
  failureRateThreshold: 50
  slowCallDurationThreshold: 800ms
  slowCallRateThreshold: 80
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 5

# Envoy / Istio: outlier ejection = per-host breaker
outlierDetection:
  consecutive5xxErrors: 5
  interval: 10s
  baseEjectionTime: 30s
  maxEjectionPercent: 50     # never eject more than half the pool</pre>
<p>שימו לב שה-<code>circuit_breakers</code> של Envoy הם בעצם <em>concurrency limits</em> (max_connections, max_pending_requests, max_requests, כולם 1024 כברירת מחדל; max_retries ברירת מחדל 3), ו-<code>outlier_detection</code> הוא המנגנון לכל host של "תפסיק לשלוח לזה שמקולקל". Breakers מגינים על <em>הקורא</em> (אין threads תקועים בהמתנה) ונותנים לנקרא מקום להתאושש. חייבים לשלב אותם עם fallback בעל משמעות: דאטה מה-cache, ערך ברירת מחדל, פיצ'ר מוחלש, או שגיאה מהירה וברורה.</p>`
      }
    },
    {
      h: { en: "Thundering herds and cold starts", he: "Thundering herds ו-cold starts" },
      body: {
        en: `<ul>
<li><strong>Cache stampede:</strong> a hot key expires and 5,000 requests miss at once and all hit the DB. Fix: request coalescing / single-flight (one fetch per key per instance, others wait), probabilistic early expiration (refresh before TTL with rising probability), serve-stale-while-revalidate, and TTL jitter (±10%) so keys don't expire together.</li>
<li><strong>Cold cache after restart or failover:</strong> a new cache cluster at 0% hit ratio forwards everything to the DB. Warm it before shifting traffic, shift traffic gradually (10% → 50% → 100%), and keep the DB provisioned for the realistic miss rate during recovery, not steady state.</li>
<li><strong>Synchronized clients:</strong> cron jobs at :00, mobile apps reconnecting after an outage, every pod's sidecar refreshing a token at the same second. Add jitter to schedules and reconnects; spread with <code>H(...)</code>-style hashing of instance id.</li>
<li><strong>Autoscaling lag:</strong> HPA reacts in 1-3 minutes, node provisioning 1-5 minutes; a 5× spike in 10 s must be absorbed by headroom and shedding, not by scaling. And new pods start cold (JIT, connection pools, caches): use startup probes, warm-up requests, and slow-start in the LB (Envoy <code>slow_start_config</code>).</li>
</ul>
<blockquote>⚠️ Production tip: after an outage, don't open the floodgates. Re-enable traffic in steps with rate limits at the edge, and watch DB and cache hit ratio. "It came back up and immediately fell over again" is the signature of a metastable failure.</blockquote>`,
        he: `<ul>
<li><strong>Cache stampede:</strong> key חם פג ו-5,000 בקשות מפספסות בבת אחת וכולן פוגעות ב-DB. פתרון: request coalescing / single-flight (fetch אחד לכל key בכל instance, השאר מחכים), probabilistic early expiration (רענון לפני ה-TTL בהסתברות עולה), serve-stale-while-revalidate, ו-jitter ל-TTL (±10%) כדי ש-keys לא יפוגו ביחד.</li>
<li><strong>Cache קר אחרי restart או failover:</strong> cluster cache חדש עם hit ratio של 0% מעביר הכול ל-DB. מחממים אותו לפני העברת תנועה, מעבירים תנועה בהדרגה (10% ← 50% ← 100%), ומחזיקים את ה-DB בגודל שמתאים לשיעור ה-miss הריאלי בזמן התאוששות, לא במצב יציב.</li>
<li><strong>לקוחות מסונכרנים:</strong> cron jobs ב-:00, אפליקציות מובייל שמתחברות מחדש אחרי השבתה, ה-sidecar של כל pod שמרענן token באותה שנייה. מוסיפים jitter ללוחות זמנים ולחיבורים מחדש; מפזרים עם hashing של ה-instance id בסגנון <code>H(...)</code>.</li>
<li><strong>עיכוב ב-autoscaling:</strong> HPA מגיב תוך 1-3 דקות, provisioning של nodes 1-5 דקות; קפיצה של פי 5 תוך 10 שניות צריכה להיספג ב-headroom וב-shedding, לא ב-scaling. ו-pods חדשים עולים קרים (JIT, connection pools, caches): משתמשים ב-startup probes, בבקשות חימום וב-slow-start ב-LB (<code>slow_start_config</code> ב-Envoy).</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: אחרי השבתה, לא פותחים את הסכר בבת אחת. מחזירים תנועה בשלבים עם rate limits בקצה, ומסתכלים על ה-DB ועל ה-hit ratio של ה-cache. "זה עלה ומיד נפל שוב" זו החתימה של metastable failure.</blockquote>`
      }
    }
  ],
  diagram: `goodput
   ^          healthy (with shedding/admission control)
   |        ____________________________
   |       /
   |      /   \\  unprotected: retries + timeouts + dead work
   |     /     \\____
   |    /           \\______________  goodput ~0, CPU 100%
   +------------------------------------> offered load
            capacity

metastable loop:  trigger -> slow -> timeouts -> retries x27 -> slower
                                ^------------------------------|
breaker:  CLOSED --(50% errors)--> OPEN --(30s)--> HALF-OPEN --ok--> CLOSED`,
  handsOn: [
    { cmd: "istioctl proxy-config cluster deploy/checkout -n shop --fqdn inventory.shop.svc.cluster.local -o json | jq '.[0].circuitBreakers, .[0].outlierDetection'", what: { en: "See the effective Envoy concurrency limits and outlier ejection settings the checkout sidecar applies to calls to inventory.", he: "לראות את ה-concurrency limits וה-outlier ejection בפועל שה-sidecar של checkout מפעיל על קריאות ל-inventory." } },
    { cmd: "kubectl exec deploy/checkout -c istio-proxy -- pilot-agent request GET stats | grep -E 'upstream_rq_retry|upstream_rq_pending_overflow|outlier_detection.ejections_active|upstream_rq_retry_overflow'", what: { en: "Envoy counters: how many retries happened, how many were refused by the retry budget (retry_overflow), requests rejected by concurrency limits (pending_overflow), and hosts currently ejected.", he: "Counters של Envoy: כמה retries היו, כמה נדחו ע״י ה-retry budget (retry_overflow), בקשות שנדחו ע״י concurrency limits (pending_overflow), ו-hosts שמוצאים כרגע." } },
    { cmd: "sum(rate(http_client_requests_total{attempt!=\"1\"}[5m])) / sum(rate(http_client_requests_total{attempt=\"1\"}[5m]))", what: { en: "PromQL retry ratio (if your client exports an attempt label). Alert when it exceeds your budget (e.g. 0.1): a rising retry ratio is the early warning of a retry storm.", he: "יחס retries ב-PromQL (אם ה-client מייצא label של attempt). עושים alert כשהוא עובר את התקציב (למשל 0.1): יחס retries שעולה הוא האזהרה המוקדמת לסופת retries." } },
    { cmd: "for i in 1 2 3 4 5 6; do b=$((100 * 2**i)); echo \"attempt $i: sleep $((RANDOM % (b < 5000 ? b : 5000))) ms\"; done", what: { en: "Bash demo of full-jitter exponential backoff (base 100 ms, cap 5 s): each attempt sleeps a random time between 0 and the growing ceiling.", he: "דמו ב-Bash של exponential backoff עם full jitter (בסיס 100 ms, תקרה 5 שניות): כל ניסיון ישן זמן אקראי בין 0 לתקרה שגדלה." } }
  ],
  mnemonic: {
    en: "\"Bound it, shed it, budget it, break it, jitter it.\" Queues bounded, load shed early, retries budgeted, breakers break, everything jittered.",
    he: "\"לחסום, לזרוק, לתקצב, לנתק, לפזר.\" תורים חסומים, load נזרק מוקדם, retries בתקציב, breakers מנתקים, והכול עם jitter."
  },
  pitfalls: [
    { en: "Retrying at every layer (client SDK, API gateway, service mesh, application code). Amplification multiplies: 4 layers × 3 attempts = 81 requests for one user click during an outage.", he: "לעשות retry בכל שכבה (SDK של הלקוח, API gateway, service mesh, קוד האפליקציה). ההגברה מוכפלת: 4 שכבות × 3 ניסיונות = 81 בקשות ללחיצה אחת של משתמש בזמן השבתה." },
    { en: "Unbounded in-memory queues or thread pools 'so we never drop requests'. You drop them anyway, later, after wasting work, and often via OOM that takes healthy requests down too.", he: "תורים או thread pools בזיכרון בלי גבול 'כדי שלא נזרוק בקשות לעולם'. אתה זורק אותן בכל מקרה, מאוחר יותר, אחרי שבזבזת עבודה, והרבה פעמים דרך OOM שמפיל גם בקשות בריאות." },
    { en: "Timeouts longer downstream than upstream (gateway 5 s, service 10 s, DB 30 s). Inner work continues long after the caller gave up; deadlines must shrink as you go deeper.", he: "Timeouts ארוכים יותר במורד הזרם מאשר במעלה (gateway 5 שניות, שירות 10, DB 30). העבודה הפנימית ממשיכה הרבה אחרי שהקורא ויתר; deadlines חייבים להצטמצם ככל שיורדים לעומק." },
    { en: "Recovering from an outage by restoring 100% of traffic at once onto cold caches and freshly started pods, which re-triggers the collapse.", he: "להתאושש מהשבתה ע״י החזרה של 100% מהתנועה בבת אחת על caches קרים ו-pods שרק עלו, מה שמפעיל שוב את הקריסה." }
  ],
  interview: [
    {
      q: { en: "After a 2-minute database failover, your API stays down for 45 minutes even though the database is healthy. What is happening and how do you get out?", he: "אחרי failover של 2 דקות ב-DB, ה-API נשאר למטה 45 דקות למרות שה-DB תקין. מה קורה ואיך יוצאים מזה?" },
      a: { en: "Classic metastable failure. The failover (trigger) caused timeouts; clients and intermediate layers retried; connection pools reconnected all at once (thundering herd on the new primary); caches expired during the outage so miss rate spiked; queues filled with requests whose callers already timed out. Sustained load now exceeds what the healthy DB can handle. Immediate: shed load at the edge (rate limit to ~50% normal, block batch clients), disable or cap retries, drain queues of expired work, scale API and warm caches, then ramp traffic back in steps. Long term: retry budgets and single retry layer, jittered reconnects with connection pool warmup, bounded queues with deadline-aware dropping, adaptive concurrency limits, and a game day that rehearses failover under load.", he: "Metastable failure קלאסי. ה-failover (הטריגר) גרם ל-timeouts; לקוחות ושכבות ביניים עשו retries; ה-connection pools התחברו מחדש בבת אחת (thundering herd על ה-primary החדש); caches פגו בזמן ההשבתה אז שיעור ה-miss קפץ; התורים התמלאו בבקשות שהלקוחות שלהן כבר עשו timeout. העומס המתמשך עכשיו גדול ממה שה-DB הבריא יכול לשאת. מיידית: לזרוק עומס בקצה (rate limit לכ-50% מהרגיל, לחסום לקוחות batch), לכבות או להגביל retries, לרוקן תורים מעבודה שפג תוקפה, לעשות scale ל-API ולחמם caches, ואז להחזיר תנועה בשלבים. לטווח ארוך: retry budgets ושכבת retry אחת, חיבורים מחדש עם jitter וחימום connection pool, תורים חסומים שזורקים לפי deadline, adaptive concurrency limits, ו-game day שמתרגל failover תחת עומס." }
    },
    {
      q: { en: "How would you design load shedding for a multi-tenant API so that one customer's spike doesn't hurt others?", he: "איך תתכנן load shedding ל-API עם הרבה tenants כך ש-spike של לקוח אחד לא יפגע באחרים?" },
      a: { en: "Layered: (1) at the edge, per-tenant token-bucket rate limits sized from their plan, returning 429 with Retry-After; (2) per-tenant concurrency limits in the service so a tenant with slow queries can't take all workers (a bulkhead per tenant tier); (3) request criticality headers so interactive traffic beats batch/export when global capacity is short; (4) adaptive global concurrency limit that rejects early when latency rises; (5) deadline propagation so expired work is dropped. Fair queuing (per-tenant queues served round-robin/weighted) instead of one FIFO. Measure goodput per tenant and alert on 429 rate per tenant; offer whales a dedicated cell.", he: "בשכבות: (1) בקצה, rate limits בשיטת token bucket לכל tenant לפי התוכנית שלו, שמחזירים 429 עם Retry-After; (2) concurrency limits לכל tenant בשירות, כך ש-tenant עם queries איטיים לא יכול לתפוס את כל ה-workers (bulkhead לכל שכבת tenants); (3) headers של קריטיות לבקשה, כך שתנועה אינטראקטיבית מנצחת batch/export כשהקיבולת הגלובלית קצרה; (4) concurrency limit גלובלי אדפטיבי שדוחה מוקדם כשה-latency עולה; (5) העברת deadlines כדי שעבודה שפג תוקפה תיזרק. Fair queuing (תור לכל tenant שמשורת ב-round-robin משוקלל) במקום FIFO אחד. מודדים goodput לכל tenant ועושים alert על שיעור 429 לכל tenant; ללקוחות לוויתנים מציעים cell ייעודי." }
    },
    {
      q: { en: "Circuit breaker or retry budget: which do you need, and where?", he: "Circuit breaker או retry budget: מה צריך, ואיפה?" },
      a: { en: "Both, they solve different problems. Retry budgets limit the extra load your retries add (protects the callee from amplification) and live where retries happen, ideally one layer. Circuit breakers stop calling a dependency that is clearly failing (protects the caller's threads and latency and gives the callee a quiet period) and live in the client/mesh per dependency, plus outlier ejection per host. A breaker without a fallback just converts slow errors into fast errors, which is still an improvement, but design what the user sees when it's open.", he: "שניהם, הם פותרים בעיות שונות. Retry budgets מגבילים את העומס הנוסף שה-retries שלך מוסיפים (מגן על הנקרא מהגברה), ויושבים איפה שה-retries קורים, אידיאלית בשכבה אחת. Circuit breakers מפסיקים לקרוא לתלות שבבירור נכשלת (מגן על ה-threads וה-latency של הקורא ונותן לנקרא תקופה שקטה), ויושבים בלקוח/ב-mesh לכל תלות, ועוד outlier ejection לכל host. Breaker בלי fallback רק הופך שגיאות איטיות לשגיאות מהירות – זה עדיין שיפור, אבל צריך לתכנן מה המשתמש רואה כשהוא פתוח." }
    }
  ],
  quiz: [
    {
      q: { en: "Three service layers each make up to 3 attempts. How many requests can one user call generate on the bottom service during an outage?", he: "שלוש שכבות שירות, כל אחת עושה עד 3 ניסיונות. כמה בקשות קריאה אחת של משתמש יכולה לייצר על השירות התחתון בזמן השבתה?" },
      options: [
        { en: "3", he: "3" },
        { en: "9", he: "9" },
        { en: "27", he: "27" },
        { en: "81", he: "81" }
      ],
      answer: 2,
      explain: { en: "Amplification multiplies across layers: 3 × 3 × 3 = 27.", he: "ההגברה מוכפלת בין השכבות: 3 × 3 × 3 = 27." }
    },
    {
      q: { en: "What defines a metastable failure?", he: "מה מגדיר metastable failure?" },
      options: [
        { en: "A failure that only happens under exactly reproducible conditions", he: "כשל שקורה רק בתנאים שניתנים לשחזור מדויק" },
        { en: "The system stays degraded after the trigger is removed because a feedback loop (retries, cold cache) sustains the overload", he: "המערכת נשארת מושפלת אחרי שהטריגר הוסר, כי לולאת משוב (retries, cache קר) מקיימת את העומס" },
        { en: "A hardware failure that corrupts memory", he: "כשל חומרה שמשחית זיכרון" },
        { en: "Split brain between two leaders", he: "Split brain בין שני leaders" }
      ],
      answer: 1,
      explain: { en: "The key is the sustaining effect: the system won't heal itself at the same load; you must cut load below the healthy threshold.", he: "המפתח הוא האפקט המקיים: המערכת לא תחלים בעצמה באותו עומס; חייבים להוריד את העומס מתחת לסף הבריא." }
    },
    {
      q: { en: "Why add jitter to exponential backoff?", he: "למה להוסיף jitter ל-exponential backoff?" },
      options: [
        { en: "To make retries faster", he: "כדי שה-retries יהיו מהירים יותר" },
        { en: "To desynchronize clients that failed together so their retries don't arrive in waves", he: "כדי לבטל סנכרון בין לקוחות שנכשלו ביחד, כך שה-retries שלהם לא יגיעו בגלים" },
        { en: "To satisfy the circuit breaker's half-open state", he: "כדי לספק את מצב ה-half-open של ה-circuit breaker" },
        { en: "To reduce the number of retries", he: "כדי להקטין את מספר ה-retries" }
      ],
      answer: 1,
      explain: { en: "Without jitter, clients that failed at the same moment retry at 100 ms, 200 ms, 400 ms… in lockstep, creating synchronized spikes.", he: "בלי jitter, לקוחות שנכשלו באותו רגע עושים retry ב-100 ms, 200 ms, 400 ms… בצעד אחיד, ויוצרים קפיצות מסונכרנות." }
    },
    {
      q: { en: "Under severe overload with a FIFO queue, why can serving newest requests first (adaptive LIFO) improve goodput?", he: "בעומס יתר קשה עם תור FIFO, למה שירות הבקשות החדשות קודם (adaptive LIFO) יכול לשפר goodput?" },
      options: [
        { en: "Newer requests are smaller", he: "בקשות חדשות קטנות יותר" },
        { en: "Old requests' clients have likely timed out; serving fresh ones yields responses someone is still waiting for", he: "הלקוחות של הבקשות הישנות כנראה כבר עשו timeout; שירות החדשות מייצר תשובות שמישהו עדיין מחכה להן" },
        { en: "LIFO uses less memory", he: "LIFO משתמש בפחות זיכרון" },
        { en: "It enables hedged requests", he: "זה מאפשר hedged requests" }
      ],
      answer: 1,
      explain: { en: "FIFO under overload means every response arrives after its deadline. LIFO lets some requests succeed quickly while the oldest are dropped.", he: "FIFO בעומס יתר אומר שכל תשובה מגיעה אחרי ה-deadline שלה. LIFO מאפשר לחלק מהבקשות להצליח מהר, בזמן שהישנות ביותר נזרקות." }
    }
  ],
  playground: "scaling",
  related: ["arch-resilience", "arch-caching", "staff-queueing-tail-latency", "rel-incident-management", "staff-cells-blast-radius"]
});

// ---------------------------------------------------------------------------
// 7. Cells, shuffle sharding & blast radius
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-cells-blast-radius",
  track: "staff",
  order: 7,
  icon: "🧱",
  level: 3,
  minutes: 17,
  title: {
    en: "Blast Radius Engineering: Cells, Shuffle Sharding, Static Stability, Control vs Data Plane",
    he: "הנדסת Blast Radius: Cells, Shuffle Sharding, Static Stability, Control Plane מול Data Plane"
  },
  tldr: {
    en: "You can't prevent every failure, so cap how many customers each failure can touch: split the system into independent cells behind a thin router, give each customer a random subset of resources (shuffle sharding), keep the data plane working when the control plane is down (static stability), and contain failures to one AZ.",
    he: "אי אפשר למנוע כל כשל, אז מגבילים כמה לקוחות כל כשל יכול לפגוע בהם: מחלקים את המערכת ל-cells עצמאיים מאחורי router דק, נותנים לכל לקוח תת-קבוצה אקראית של משאבים (shuffle sharding), דואגים שה-data plane ימשיך לעבוד כשה-control plane למטה (static stability), ומכילים כשלים ל-AZ אחד."
  },
  analogy: {
    en: "A ship is built with watertight compartments: a hole floods one compartment, not the whole hull. Cells are compartments for your service. Shuffle sharding is giving each passenger a different random pair of lifeboats, so even if two lifeboats sink, almost nobody lost both. Static stability is a lighthouse that keeps shining when the harbour office (control plane) burns down: it just can't change its pattern until the office is rebuilt.",
    he: "ספינה בנויה עם תאים אטומים למים: חור מציף תא אחד, לא את כל הגוף. Cells הם תאים כאלה לשירות שלך. Shuffle sharding זה לתת לכל נוסע זוג סירות הצלה אקראי שונה, כך שגם אם שתי סירות טובעות, כמעט לאף אחד לא טבעו שתיהן. Static stability זה מגדלור שממשיך להאיר גם כשמשרד הנמל (ה-control plane) נשרף: הוא פשוט לא יכול לשנות את התבנית שלו עד שהמשרד ייבנה מחדש."
  },
  sections: [
    {
      h: { en: "Blast radius as a design metric", he: "Blast radius כמדד עיצובי" },
      body: {
        en: `<p>At scale, something is always broken: a bad deploy, a poison request, a noisy tenant, a corrupted config, an AZ power event. Redundancy (N+1, multi-AZ) protects against <em>independent</em> hardware failures, but most big outages are <strong>correlated</strong>: the same bad config pushed everywhere, the same query of death hitting every replica, the same global dependency failing. Staff-level architecture asks: <strong>"When (not if) X fails, what percentage of customers is affected, and for how long?"</strong></p>
<p>Tools to shrink that number, from coarse to fine:</p>
<ul>
<li><strong>Regions</strong> fully independent (no cross-region dependencies on the request path).</li>
<li><strong>Availability zones</strong> as isolation units: zonal deployments, zonal shift.</li>
<li><strong>Cells</strong>: many independent copies of the full stack, each serving a fraction of customers.</li>
<li><strong>Shuffle sharding</strong> inside shared fleets.</li>
<li><strong>Bulkheads</strong> inside a process: separate thread/connection pools per dependency or tenant class, so one slow dependency can't exhaust all threads.</li>
<li><strong>Progressive delivery</strong>: deploy to one cell / one AZ / one region at a time with bake time, so a bad change has a small radius by construction (AWS deploys region by region in "waves", starting with a single box, then one AZ).</li>
</ul>`,
        he: `<p>בסקייל, תמיד משהו שבור: deploy רע, בקשה רעילה, tenant רועש, קונפיג משובש, אירוע חשמל ב-AZ. יתירות (N+1, multi-AZ) מגינה מפני כשלי חומרה <em>בלתי תלויים</em>, אבל רוב ההשבתות הגדולות הן <strong>מתואמות</strong>: אותו קונפיג רע שנדחף לכל מקום, אותה query of death שפוגעת בכל replica, אותה תלות גלובלית שנופלת. ארכיטקטורה ברמת staff שואלת: <strong>"כש-X נכשל (לא אם), כמה אחוז מהלקוחות נפגעים, ולכמה זמן?"</strong></p>
<p>כלים להקטין את המספר הזה, מגס לעדין:</p>
<ul>
<li><strong>Regions</strong> עצמאיים לגמרי (בלי תלויות בין regions בנתיב הבקשה).</li>
<li><strong>Availability zones</strong> כיחידות בידוד: deployments לפי zone, zonal shift.</li>
<li><strong>Cells</strong>: הרבה עותקים עצמאיים של כל ה-stack, שכל אחד משרת חלק מהלקוחות.</li>
<li><strong>Shuffle sharding</strong> בתוך fleets משותפים.</li>
<li><strong>Bulkheads</strong> בתוך תהליך: thread/connection pools נפרדים לכל תלות או סוג tenant, כך שתלות איטית אחת לא יכולה לגמור את כל ה-threads.</li>
<li><strong>Progressive delivery</strong>: deploy ל-cell אחד / AZ אחד / region אחד בכל פעם עם זמן bake, כך שלשינוי רע יש רדיוס קטן מעצם המבנה (AWS עושים deploy region אחרי region ב"גלים", מתחילים ב-box בודד ואז AZ אחד).</li>
</ul>`
      }
    },
    {
      h: { en: "Cell-based architecture", he: "ארכיטקטורה מבוססת cells" },
      body: {
        en: `<p>A <strong>cell</strong> is a complete, independent instance of your service (compute, data store, queues, caches) sized for a bounded number of customers. A thin <strong>cell router</strong> maps each request's partition key (customer/tenant/account id) to a cell. Cells share nothing on the request path.</p>
<pre>             ┌──────── cell router (thin, highly available, mostly static) ────────┐
 request ──▶ │ lookup tenant_id -&gt; cell  (cached mapping, DynamoDB/Route 53/config)│
             └──────┬──────────────────────┬──────────────────────┬────────────────┘
                    ▼                      ▼                      ▼
             cell-01 (3 AZ)         cell-02 (3 AZ)         cell-03 (3 AZ) ...
             API + workers          API + workers          API + workers
             own DB, own queue      own DB, own queue      own DB, own queue</pre>
<ul>
<li><strong>Blast radius</strong> = 1/N of customers for any cell-local failure (bad deploy to one cell, DB corruption, poison tenant).</li>
<li><strong>Fixed maximum size</strong>: a cell never grows beyond a tested size (e.g. 5,000 tenants or 50k req/s). You scale by adding cells, so you always operate at a scale you have load-tested. No "we've never been this big" surprises.</li>
<li><strong>Router must be the simplest, most robust component</strong>: minimal logic, cached mapping, no dependency on cells being healthy. If the router fails, everything fails.</li>
<li><strong>Cell placement</strong>: hash, or an explicit mapping table so you can move a whale tenant to its own cell or rebalance. Moving tenants between cells requires a data migration story (dual-write or export/import with a short freeze).</li>
<li><strong>Costs</strong>: duplicated fixed overhead per cell, cross-cell features are hard (global search, cross-tenant analytics need a separate aggregation plane), and you need fleet-wide tooling for deploys, observability and migrations.</li>
</ul>
<blockquote>💡 Real world: AWS builds many services this way (Lambda, DynamoDB's storage nodes, Route 53, EC2 control planes), and Slack moved to cellular, AZ-aligned architecture after AZ-related incidents in 2021-2022. Salesforce "pods" and Atlassian's per-region shards are the same idea.</blockquote>`,
        he: `<p><strong>Cell</strong> הוא מופע מלא ועצמאי של השירות שלך (compute, data store, תורים, caches) בגודל שמתאים למספר חסום של לקוחות. <strong>Cell router</strong> דק ממפה את ה-partition key של כל בקשה (customer/tenant/account id) ל-cell. ל-cells אין שום דבר משותף בנתיב הבקשה.</p>
<pre>             ┌──────── cell router (thin, highly available, mostly static) ────────┐
 request ──▶ │ lookup tenant_id -&gt; cell  (cached mapping, DynamoDB/Route 53/config)│
             └──────┬──────────────────────┬──────────────────────┬────────────────┘
                    ▼                      ▼                      ▼
             cell-01 (3 AZ)         cell-02 (3 AZ)         cell-03 (3 AZ) ...
             API + workers          API + workers          API + workers
             own DB, own queue      own DB, own queue      own DB, own queue</pre>
<ul>
<li><strong>Blast radius</strong> = 1/N מהלקוחות לכל כשל מקומי ל-cell (deploy רע ל-cell אחד, השחתת DB, tenant רעיל).</li>
<li><strong>גודל מקסימלי קבוע</strong>: cell אף פעם לא גדל מעבר לגודל שנבדק (למשל 5,000 tenants או 50 אלף בקשות לשנייה). גדלים ע״י הוספת cells, כך שתמיד עובדים בסקייל שעשית לו load test. אין הפתעות של "אף פעם לא היינו כל כך גדולים".</li>
<li><strong>ה-router חייב להיות הרכיב הכי פשוט והכי עמיד</strong>: מינימום לוגיקה, mapping ב-cache, בלי תלות בכך שה-cells בריאים. אם ה-router נופל, הכול נופל.</li>
<li><strong>שיבוץ cells</strong>: hash, או טבלת mapping מפורשת כדי שאפשר יהיה להעביר tenant לוויתן ל-cell משלו או לאזן מחדש. העברת tenants בין cells דורשת סיפור של מיגרציית דאטה (dual-write או export/import עם הקפאה קצרה).</li>
<li><strong>מחירים</strong>: overhead קבוע משוכפל לכל cell, פיצ'רים שחוצים cells קשים (חיפוש גלובלי ואנליטיקס בין tenants צריכים מישור אגרגציה נפרד), וצריך tooling לכל הצי ל-deploys, observability ומיגרציות.</li>
</ul>
<blockquote>💡 מהשטח: AWS בונים הרבה שירותים ככה (Lambda, ה-storage nodes של DynamoDB, Route 53, control planes של EC2), ו-Slack עברו לארכיטקטורה תאית שמיושרת ל-AZs אחרי תקלות שקשורות ל-AZ ב-2021-2022. ה-"pods" של Salesforce וה-shards לפי region של Atlassian הם אותו רעיון.</blockquote>`
      }
    },
    {
      h: { en: "Shuffle sharding: combinatorial isolation", he: "Shuffle sharding: בידוד קומבינטורי" },
      body: {
        en: `<p>Plain sharding: 8 workers in 4 shards of 2. A poison customer kills their shard → 1/4 of all customers down. <strong>Shuffle sharding</strong>: assign each customer a random combination of 2 out of 8 workers. Number of combinations: C(8,2) = <strong>28</strong>. A poison customer kills only its own 2 workers; another customer is fully down only if it got the <em>exact same pair</em> (1/28 ≈ 3.6%), and most customers lose at most one worker and keep serving from the other (with client retry to the other worker).</p>
<pre>workers = 8, shard size k = 2  -&gt; C(8,2) = 28 shuffle shards
workers = 100, k = 5           -&gt; C(100,5) = 75,287,520
Route 53: 2,048 name servers, 4 per hosted zone -&gt; ~730 billion combinations

def shard_for(customer_id, workers, k):
    rnd = random.Random(hash64(customer_id))   # deterministic per customer
    return sorted(rnd.sample(workers, k))</pre>
<p>Requirements for it to work: clients must <strong>retry/fail over across the k members</strong> of their shard (otherwise losing 1 of 2 still hurts), and the poison must be confined to the attacker's workers (e.g. resource limits so a bad request can only kill its own worker). Combine with cells: shuffle-shard tenants across cells or across nodes within a cell. Used by Route 53, CloudFront, Lambda workers, and in Kubernetes-land, by spreading tenants across node pools.</p>`,
        he: `<p>Sharding רגיל: 8 workers ב-4 shards של 2. לקוח רעיל הורג את ה-shard שלו ← רבע מכל הלקוחות למטה. <strong>Shuffle sharding</strong>: לכל לקוח משבצים צירוף אקראי של 2 מתוך 8 workers. מספר הצירופים: C(8,2) = <strong>28</strong>. לקוח רעיל הורג רק את ה-2 workers שלו; לקוח אחר נופל לגמרי רק אם קיבל <em>בדיוק את אותו זוג</em> (1/28 ≈ 3.6%), ורוב הלקוחות מאבדים לכל היותר worker אחד וממשיכים לקבל שירות מהשני (עם retry של הלקוח ל-worker השני).</p>
<pre>workers = 8, shard size k = 2  -&gt; C(8,2) = 28 shuffle shards
workers = 100, k = 5           -&gt; C(100,5) = 75,287,520
Route 53: 2,048 name servers, 4 per hosted zone -&gt; ~730 billion combinations

def shard_for(customer_id, workers, k):
    rnd = random.Random(hash64(customer_id))   # deterministic per customer
    return sorted(rnd.sample(workers, k))</pre>
<p>תנאים כדי שזה יעבוד: הלקוחות חייבים <strong>לעשות retry/failover בין k החברים</strong> של ה-shard שלהם (אחרת אובדן של 1 מתוך 2 עדיין כואב), והרעל חייב להיות מוגבל ל-workers של התוקף (למשל resource limits כך שבקשה רעה יכולה להרוג רק את ה-worker שלה). משלבים עם cells: shuffle-shard ל-tenants בין cells או בין nodes בתוך cell. בשימוש ב-Route 53, CloudFront, workers של Lambda, ובעולם של Kubernetes – פיזור tenants בין node pools.</p>`
      }
    },
    {
      h: { en: "Control plane vs data plane, and static stability", he: "Control plane מול data plane, ו-static stability" },
      body: {
        en: `<p>The <strong>data plane</strong> does the real-time work (route packets, serve requests, store bytes). The <strong>control plane</strong> changes configuration (create, scale, update, deploy). Control planes are more complex, change more often and fail more often; data planes must be simpler and far more available.</p>
<table>
<tr><th>System</th><th>Control plane</th><th>Data plane</th></tr>
<tr><td>Kubernetes</td><td>API server, etcd, scheduler, controllers</td><td>kubelet, running containers, kube-proxy/CNI rules</td></tr>
<tr><td>AWS ELB</td><td>Create/modify LB, register targets</td><td>Forwarding traffic</td></tr>
<tr><td>Route 53</td><td>Changing records (single region, us-east-1)</td><td>DNS answers (global, 100% SLA)</td></tr>
<tr><td>Service mesh</td><td>istiod pushing xDS config</td><td>Envoy sidecars forwarding requests</td></tr>
</table>
<p><strong>Static stability</strong>: the data plane keeps working, with its last known good configuration, when the control plane is impaired. And the system keeps working through an expected failure <em>without needing to make changes</em> (no scaling, no provisioning) because changes are exactly what may be unavailable during the failure.</p>
<ul>
<li>Pre-provision for AZ loss: with 3 AZs, run each at ≤66% so the remaining two absorb the load without launching anything (or provision 150% of need across 3 AZs).</li>
<li>Data plane caches config locally and does not call the control plane on the request path. If the K8s API server is down, existing Pods keep serving; Envoy keeps its last xDS config.</li>
<li>Failover that depends on a control-plane action in the failing region (e.g. updating DNS through an API in the region that is down) is not statically stable. Prefer health-check-driven data-plane failover (Route 53 health checks, anycast), or AWS Route 53 ARC routing controls whose data plane is spread across 5 regions.</li>
<li>Avoid modal behaviour: code paths that only run during failure are the least tested. "Constant work" designs (always push the full config every N seconds, whether changed or not) remove the surprise mode.</li>
</ul>`,
        he: `<p>ה-<strong>data plane</strong> עושה את העבודה בזמן אמת (לנתב packets, לשרת בקשות, לאחסן bytes). ה-<strong>control plane</strong> משנה קונפיגורציה (ליצור, לעשות scale, לעדכן, deploy). control planes מורכבים יותר, משתנים יותר ונכשלים יותר; data planes חייבים להיות פשוטים יותר וזמינים הרבה יותר.</p>
<table>
<tr><th>מערכת</th><th>Control plane</th><th>Data plane</th></tr>
<tr><td>Kubernetes</td><td>API server, etcd, scheduler, controllers</td><td>kubelet, הקונטיינרים שרצים, חוקי kube-proxy/CNI</td></tr>
<tr><td>AWS ELB</td><td>ליצור/לשנות LB, לרשום targets</td><td>העברת תנועה</td></tr>
<tr><td>Route 53</td><td>שינוי רשומות (region יחיד, us-east-1)</td><td>תשובות DNS (גלובלי, SLA של 100%)</td></tr>
<tr><td>Service mesh</td><td>istiod שדוחף קונפיג xDS</td><td>sidecars של Envoy שמעבירים בקשות</td></tr>
</table>
<p><strong>Static stability</strong>: ה-data plane ממשיך לעבוד, עם הקונפיגורציה התקינה האחרונה שהוא מכיר, כשה-control plane פגוע. והמערכת ממשיכה לעבוד דרך כשל צפוי <em>בלי צורך לבצע שינויים</em> (בלי scaling, בלי provisioning), כי שינויים הם בדיוק מה שעלול להיות לא זמין בזמן הכשל.</p>
<ul>
<li>מקצים מראש לאובדן AZ: עם 3 AZs, מריצים כל אחד ב-66% לכל היותר כדי ששני הנותרים יספגו את העומס בלי להרים כלום (או מקצים 150% מהצורך על פני 3 AZs).</li>
<li>ה-data plane שומר קונפיג מקומית ולא קורא ל-control plane בנתיב הבקשה. אם ה-API server של K8s למטה, Pods קיימים ממשיכים לשרת; Envoy שומר את קונפיג ה-xDS האחרון שלו.</li>
<li>Failover שתלוי בפעולת control plane ב-region שנכשל (למשל עדכון DNS דרך API ב-region שלמטה) הוא לא statically stable. עדיף failover מבוסס health checks ב-data plane (health checks של Route 53, anycast), או routing controls של AWS Route 53 ARC שה-data plane שלהם מפוזר על 5 regions.</li>
<li>להימנע מהתנהגות מודאלית: נתיבי קוד שרצים רק בזמן כשל הם הכי פחות נבדקים. עיצובים של "constant work" (תמיד לדחוף את כל הקונפיג כל N שניות, בין אם השתנה ובין אם לא) מעלימים את מצב ההפתעה.</li>
</ul>`
      }
    },
    {
      h: { en: "Zonal isolation", he: "בידוד לפי zone" },
      body: {
        en: `<p>Multi-AZ is not automatically AZ-<em>independent</em>. If service A in AZ-a calls service B through a regional load balancer that sends to all AZs, a gray failure in AZ-c (packet loss, slow disks) degrades requests from <em>every</em> AZ. <strong>AZ affinity</strong> keeps a request inside the AZ where it entered:</p>
<ul>
<li>Zonal endpoints / topology-aware routing: K8s <code>service.kubernetes.io/topology-mode: Auto</code> (or <code>trafficDistribution: PreferClose</code> since 1.31), Istio locality load balancing, disabling cross-zone LB on NLB.</li>
<li>Bonus: cross-AZ data transfer costs ~$0.01/GB each way on AWS; AZ affinity often saves real money.</li>
<li><strong>Zonal shift</strong>: when one AZ is unhealthy, evacuate it by shifting traffic away instead of debugging under fire. AWS Route 53 ARC zonal shift / zonal autoshift for ALB/NLB/EKS; equivalent: drain the AZ's nodes and set its LB targets' weight to 0.</li>
<li>Stateful tiers still need cross-AZ replication (DB synchronous standby, Kafka RF=3 over 3 racks); isolate the <em>stateless request path</em>, replicate the <em>state</em>.</li>
</ul>
<pre># Kubernetes: keep traffic in-zone when possible (1.31+)
apiVersion: v1
kind: Service
metadata: { name: inventory }
spec:
  selector: { app: inventory }
  ports: [{ port: 80, targetPort: 8080 }]
  trafficDistribution: PreferClose

# AWS: evacuate a sick AZ from an ALB for 2 hours
aws arc-zonal-shift start-zonal-shift --resource-identifier $ALB_ARN \
  --away-from use1-az4 --expires-in 2h --comment "gray failure: elevated p99 in az4"</pre>`,
        he: `<p>Multi-AZ זה לא אוטומטית <em>עצמאות</em> בין AZs. אם שירות A ב-AZ-a קורא לשירות B דרך load balancer אזורי ששולח לכל ה-AZs, gray failure ב-AZ-c (packet loss, דיסקים איטיים) פוגע בבקשות מ<em>כל</em> ה-AZs. <strong>AZ affinity</strong> שומר בקשה בתוך ה-AZ שבו היא נכנסה:</p>
<ul>
<li>Endpoints לפי zone / topology-aware routing: ב-K8s <code>service.kubernetes.io/topology-mode: Auto</code> (או <code>trafficDistribution: PreferClose</code> מאז 1.31), locality load balancing ב-Istio, ביטול cross-zone LB ב-NLB.</li>
<li>בונוס: העברת דאטה בין AZs עולה בערך $0.01 ל-GB לכל כיוון ב-AWS; AZ affinity הרבה פעמים חוסך כסף אמיתי.</li>
<li><strong>Zonal shift</strong>: כש-AZ אחד לא בריא, מפנים אותו ע״י הסטת תנועה במקום לדבג תחת אש. zonal shift / zonal autoshift של AWS Route 53 ARC ל-ALB/NLB/EKS; המקבילה: לעשות drain ל-nodes של ה-AZ ולתת ל-targets שלו ב-LB משקל 0.</li>
<li>שכבות stateful עדיין צריכות replication בין AZs (standby סינכרוני ל-DB, Kafka עם RF=3 על 3 racks); מבודדים את <em>נתיב הבקשה ה-stateless</em>, ומשכפלים את <em>ה-state</em>.</li>
</ul>
<pre># Kubernetes: keep traffic in-zone when possible (1.31+)
apiVersion: v1
kind: Service
metadata: { name: inventory }
spec:
  selector: { app: inventory }
  ports: [{ port: 80, targetPort: 8080 }]
  trafficDistribution: PreferClose

# AWS: evacuate a sick AZ from an ALB for 2 hours
aws arc-zonal-shift start-zonal-shift --resource-identifier $ALB_ARN \
  --away-from use1-az4 --expires-in 2h --comment "gray failure: elevated p99 in az4"</pre>`
      }
    }
  ],
  diagram: `Plain sharding (8 workers, 4 shards)      Shuffle sharding (8 workers, k=2, 28 combos)
 [w1 w2][w3 w4][w5 w6][w7 w8]              cust A -> {w1,w6}   cust B -> {w2,w6}
 poison in shard 1 -> 25% customers down    poison A kills w1,w6 -> B still has w2 (degraded, up)
                                            fully down only if same pair: 1/28

Cells:  router --> cell-1 | cell-2 | cell-3 | ... cell-N    failure in a cell = 1/N customers
Static stability: 3 AZ x 66% load  --AZ loss-->  2 AZ x 100%  (no scaling needed)`,
  handsOn: [
    { cmd: "python3 -c \"import math; print(math.comb(8,2), math.comb(100,5), math.comb(2048,4))\"", what: { en: "Compute shuffle-shard combination counts: 28 for 8 choose 2, ~75M for 100 choose 5, ~730 billion for Route 53's 2048 choose 4.", he: "לחשב את מספר הצירופים של shuffle sharding: 28 ל-8 בחר 2, בערך 75 מיליון ל-100 בחר 5, ובערך 730 מיליארד ל-2048 בחר 4 של Route 53." } },
    { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=inventory -o yaml | grep -A3 hints", what: { en: "Verify topology-aware routing is active: each endpoint should carry hints.forZones so kube-proxy prefers same-zone endpoints.", he: "לוודא ש-topology-aware routing פעיל: לכל endpoint צריך להיות hints.forZones כדי ש-kube-proxy יעדיף endpoints באותו zone." } },
    { cmd: "kubectl get pods -l app=checkout -o custom-columns=POD:.metadata.name,NODE:.spec.nodeName --no-headers | while read p n; do kubectl get node $n -L topology.kubernetes.io/zone --no-headers | awk -v p=$p '{print p, $NF}'; done | awk '{print $2}' | sort | uniq -c", what: { en: "Count replicas per AZ. If one zone holds most replicas, losing it is not statically stable; add topologySpreadConstraints with maxSkew 1.", he: "לספור replicas לכל AZ. אם zone אחד מחזיק את רוב ה-replicas, אובדן שלו הוא לא statically stable; מוסיפים topologySpreadConstraints עם maxSkew 1." } },
    { cmd: "aws arc-zonal-shift list-zonal-shifts --status ACTIVE && aws arc-zonal-shift list-managed-resources", what: { en: "List active zonal shifts and the load balancers/EKS clusters registered for zonal shift, to rehearse evacuating an AZ.", he: "רשימת zonal shifts פעילים וה-load balancers / קלאסטרי EKS שרשומים ל-zonal shift, כדי לתרגל פינוי של AZ." } }
  ],
  mnemonic: {
    en: "\"Cells cap, shuffles scatter, statics stand.\" Cells cap the radius, shuffle sharding scatters the overlap, statically stable systems stand without changes.",
    he: "\"Cells מגבילים, shuffle מפזר, static עומד.\" Cells מגבילים את הרדיוס, shuffle sharding מפזר את החפיפה, ומערכות statically stable עומדות בלי שינויים."
  },
  pitfalls: [
    { en: "A 'thin' cell router that slowly accumulates business logic, auth calls and a database dependency. It becomes the single global failure point that cells were meant to eliminate.", he: "Cell router 'דק' שלאט לאט צובר לוגיקה עסקית, קריאות auth ותלות ב-DB. הוא הופך לנקודת כשל גלובלית יחידה – בדיוק מה שה-cells היו אמורים לבטל." },
    { en: "Deploying to all cells at once. Cells limit blast radius only if changes (code, config, feature flags) roll out cell by cell with bake time and automatic rollback.", he: "לעשות deploy לכל ה-cells בבת אחת. Cells מגבילים blast radius רק אם שינויים (קוד, קונפיג, feature flags) מתגלגלים cell אחרי cell עם זמן bake ו-rollback אוטומטי." },
    { en: "Relying on autoscaling for AZ failure. During a large AZ event, every customer in the region scales into the same remaining AZs and instance capacity or the control plane may be constrained; pre-provision instead.", he: "לסמוך על autoscaling לכשל של AZ. באירוע AZ גדול, כל הלקוחות ב-region עושים scale לאותם AZs שנשארו, ו-capacity של instances או ה-control plane עלולים להיות מוגבלים; מקצים מראש." },
    { en: "Failover runbooks that require control-plane API calls in the impaired region (update DNS, modify ASG, change LB). Those APIs are often the first thing to degrade.", he: "Runbooks של failover שדורשים קריאות API ל-control plane ב-region הפגוע (לעדכן DNS, לשנות ASG, לשנות LB). ה-APIs האלה לרוב הדבר הראשון שנפגע." }
  ],
  interview: [
    {
      q: { en: "You run a multi-tenant SaaS on one big regional deployment. A single tenant's malformed import job took everyone down twice this quarter. What do you propose?", he: "אתה מריץ SaaS מרובה tenants על deployment אזורי גדול אחד. job של import פגום של tenant אחד הפיל את כולם פעמיים ברבעון. מה אתה מציע?" },
      a: { en: "Short term: bulkheads and limits: separate worker pools for import/batch vs interactive traffic, per-tenant concurrency and rate limits, input validation and resource limits so one job can only kill its own worker. Medium term: shuffle-shard tenants across worker pools so a poison tenant affects a few percent at most. Long term: cell-based architecture: N cells with a fixed max size, a thin router keyed by tenant_id, cell-by-cell deploys, and the ability to move whales to dedicated cells. Present it with numbers: current blast radius 100%, after cells of ~5% each, and the cost: extra fixed overhead per cell and investment in tooling for fleet deploys, cross-cell reporting and tenant migration.", he: "לטווח קצר: bulkheads ו-limits: pools נפרדים של workers ל-import/batch מול תנועה אינטראקטיבית, concurrency ו-rate limits לכל tenant, ולידציה של קלט ו-resource limits כך ש-job אחד יכול להרוג רק את ה-worker שלו. לטווח בינוני: shuffle-shard ל-tenants בין pools של workers, כך ש-tenant רעיל משפיע על אחוזים בודדים לכל היותר. לטווח ארוך: ארכיטקטורת cells: N cells עם גודל מקסימלי קבוע, router דק לפי tenant_id, deploys cell אחרי cell, ויכולת להעביר לוויתנים ל-cells ייעודיים. מציגים עם מספרים: blast radius נוכחי 100%, אחרי cells בערך 5% כל אחד, והמחיר: overhead קבוע נוסף לכל cell והשקעה ב-tooling ל-deploys של צי, דיווח בין cells ומיגרציית tenants." }
    },
    {
      q: { en: "Explain static stability with a Kubernetes example, and one way a typical setup violates it.", he: "תסביר static stability עם דוגמה מ-Kubernetes, ודרך אחת שבה setup טיפוסי מפר אותו." },
      a: { en: "If the control plane (API server/etcd) goes down, running Pods, Services and kube-proxy rules keep serving traffic: the data plane is statically stable. Violations: (1) relying on HPA/Karpenter to replace capacity when an AZ dies, since scaling is a control-plane action that may be slow or blocked; instead spread replicas across 3 zones with headroom so 2 zones can carry 100%. (2) Apps that call the K8s API on the request path (e.g. reading a ConfigMap per request, or service discovery via the API) fail when the API server is down; use mounted config and DNS/endpoints cached in the data plane. (3) Short-lived credentials that can only be refreshed through a regional control plane, so they expire mid-outage; cache them with long enough validity.", he: "אם ה-control plane (API server/etcd) נופל, Pods שרצים, Services וחוקי kube-proxy ממשיכים לשרת תנועה: ה-data plane הוא statically stable. הפרות: (1) לסמוך על HPA/Karpenter שיחליפו קיבולת כש-AZ מת, כי scaling זו פעולת control plane שעלולה להיות איטית או חסומה; במקום זה מפזרים replicas על 3 zones עם headroom כך ש-2 zones יכולים לשאת 100%. (2) אפליקציות שקוראות ל-API של K8s בנתיב הבקשה (למשל קריאת ConfigMap בכל בקשה, או service discovery דרך ה-API) נכשלות כשה-API server למטה; משתמשים בקונפיג שמוצמד כ-volume וב-DNS/endpoints שנשמרים ב-data plane. (3) credentials קצרי חיים שאפשר לרענן רק דרך control plane אזורי, ולכן פגים באמצע השבתה; שומרים אותם ב-cache עם תוקף ארוך מספיק." }
    },
    {
      q: { en: "How do you pick the size of a cell?", he: "איך בוחרים את הגודל של cell?" },
      a: { en: "Balance blast radius against overhead and operability. Smaller cells: smaller blast radius, but more fixed cost (per-cell DB, LBs, monitoring), more deploy waves, and big tenants may not fit. Larger cells: efficient, but closer to unknown scaling limits. Practical approach: find the largest size you can load-test with confidence (and that a single DB cluster comfortably handles at 2x peak), make that the hard maximum, size the largest tenant to fit with headroom, and aim for at least ~10-20 cells so a single cell is 5-10% of customers. Revisit when the largest tenant grows.", he: "מאזנים בין blast radius ל-overhead ותפעוליות. cells קטנים: blast radius קטן, אבל יותר עלות קבועה (DB, LBs וניטור לכל cell), יותר גלי deploy, ו-tenants גדולים אולי לא ייכנסו. cells גדולים: יעילים, אבל קרובים יותר לגבולות scaling לא ידועים. גישה פרקטית: למצוא את הגודל הכי גדול שאפשר לעשות לו load test בביטחון (ושאשכול DB אחד מחזיק בנוחות בפי 2 מה-peak), להפוך אותו למקסימום קשיח, לוודא שה-tenant הגדול ביותר נכנס עם מרווח, ולשאוף ללפחות 10-20 cells כך ש-cell בודד הוא 5-10% מהלקוחות. לבחון מחדש כשה-tenant הגדול גדל." }
    }
  ],
  quiz: [
    {
      q: { en: "With 8 workers and each customer assigned a shuffle shard of 2, how many distinct shards exist?", he: "עם 8 workers וכל לקוח מקבל shuffle shard של 2, כמה shards שונים קיימים?" },
      options: [
        { en: "4", he: "4" },
        { en: "16", he: "16" },
        { en: "28", he: "28" },
        { en: "64", he: "64" }
      ],
      answer: 2,
      explain: { en: "C(8,2) = 8×7/2 = 28. Plain sharding would give only 4 shards.", he: "C(8,2) = 8×7/2 = 28. Sharding רגיל היה נותן רק 4 shards." }
    },
    {
      q: { en: "Which statement best describes static stability?", he: "איזה משפט הכי מתאר static stability?" },
      options: [
        { en: "The system never changes configuration", he: "המערכת אף פעם לא משנה קונפיגורציה" },
        { en: "The data plane keeps working through expected failures without needing control-plane actions like scaling or reconfiguration", he: "ה-data plane ממשיך לעבוד דרך כשלים צפויים בלי צורך בפעולות control plane כמו scaling או קונפיגורציה מחדש" },
        { en: "Static IP addresses are used everywhere", he: "משתמשים בכתובות IP סטטיות בכל מקום" },
        { en: "Autoscaling is configured with fixed min and max", he: "Autoscaling מוגדר עם min ו-max קבועים" }
      ],
      answer: 1,
      explain: { en: "Control-plane actions are the most likely to be impaired during a failure, so the steady state must already survive it.", he: "פעולות control plane הן הכי סבירות להיפגע בזמן כשל, אז המצב היציב חייב כבר לשרוד אותו." }
    },
    {
      q: { en: "3 AZs, each running at 70% CPU. One AZ fails and nothing scales. What load do the survivors carry?", he: "3 AZs, כל אחד רץ ב-70% CPU. AZ אחד נופל ושום דבר לא עושה scale. איזה עומס נושאים השורדים?" },
      options: [
        { en: "70%", he: "70%" },
        { en: "93%", he: "93%" },
        { en: "105%: overloaded", he: "105%: עומס יתר" },
        { en: "140%", he: "140%" }
      ],
      answer: 2,
      explain: { en: "Total load 3 × 70 = 210 spread over 2 AZs = 105% each. To be statically stable for AZ loss, run at or below ~66%.", he: "עומס כולל 3 × 70 = 210 מחולק על 2 AZs = 105% לכל אחד. כדי להיות statically stable לאובדן AZ, רצים ב-66% בערך או פחות." }
    },
    {
      q: { en: "What is the main job of a cell router?", he: "מה התפקיד המרכזי של cell router?" },
      options: [
        { en: "Run business logic shared by all cells", he: "להריץ לוגיקה עסקית משותפת לכל ה-cells" },
        { en: "Map each request's partition key to its cell, as simply and reliably as possible", he: "למפות את ה-partition key של כל בקשה ל-cell שלה, בצורה הכי פשוטה ואמינה שאפשר" },
        { en: "Replicate data between cells", he: "לשכפל דאטה בין cells" },
        { en: "Autoscale cells", he: "לעשות autoscale ל-cells" }
      ],
      answer: 1,
      explain: { en: "The router is shared by everyone, so it must be the thinnest, most robust layer; anything more in it re-creates a global blast radius.", he: "ה-router משותף לכולם, אז הוא חייב להיות השכבה הכי דקה ועמידה; כל דבר נוסף בו יוצר מחדש blast radius גלובלי." }
    }
  ],
  playground: "lb",
  related: ["rel-ha", "cloud-regions-azs", "arch-resilience", "staff-overload-metastable", "staff-multi-region-data"]
});

// ---------------------------------------------------------------------------
// 8. Multi-region data
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "staff-multi-region-data",
  track: "staff",
  order: 8,
  icon: "🌍",
  level: 3,
  minutes: 19,
  title: {
    en: "Multi-Region Data: Active-Active vs Active-Passive, LWW & CRDTs, Global Databases, Residency",
    he: "דאטה ב-Multi-Region: Active-Active מול Active-Passive, LWW ו-CRDTs, DBs גלובליים, Data Residency"
  },
  tldr: {
    en: "Multi-region compute is easy; multi-region data is where physics (70-200 ms between regions) forces a choice: async replication with non-zero RPO and conflicts to resolve, or synchronous consensus with higher write latency. Pick per data type, keep a 'home region' per entity where you can, and prove failover with drills, not diagrams.",
    he: "Compute ב-multi-region זה קל; דאטה ב-multi-region זה המקום שבו הפיזיקה (70-200 ms בין regions) מכריחה לבחור: replication אסינכרוני עם RPO שאינו אפס וקונפליקטים לפתור, או consensus סינכרוני עם latency גבוה יותר ל-writes. בוחרים לכל סוג דאטה, שומרים 'home region' לכל entity איפה שאפשר, ומוכיחים failover עם תרגילים, לא עם דיאגרמות."
  },
  analogy: {
    en: "Two branches of a bank in Tel Aviv and New York sharing customer accounts. Active-passive: New York only keeps a copy and opens the doors if Tel Aviv burns down, possibly missing the last few minutes of deposits. Active-active: both branches take deposits and phone each other to reconcile; a customer who withdraws in both cities in the same minute is a conflict someone has to resolve. Spanner is both branches agreeing by phone before every transaction: always right, a bit slower.",
    he: "שני סניפים של בנק בתל אביב ובניו יורק שחולקים חשבונות לקוחות. Active-passive: ניו יורק רק מחזיק עותק ופותח את הדלתות אם תל אביב נשרף, אולי בלי ההפקדות של הדקות האחרונות. Active-active: שני הסניפים מקבלים הפקדות ומתקשרים זה לזה כדי להתיישר; לקוח שמושך כסף בשתי הערים באותה דקה הוא קונפליקט שמישהו צריך לפתור. Spanner זה ששני הסניפים מסכימים בטלפון לפני כל טרנזקציה: תמיד צודק, קצת יותר איטי."
  },
  sections: [
    {
      h: { en: "Topologies and what they cost", he: "טופולוגיות ומה הן עולות" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>Writes</th><th>RPO on region loss</th><th>RTO</th><th>Main cost / risk</th></tr>
<tr><td><strong>Backup &amp; restore</strong> to another region</td><td>1 region</td><td>Hours (last backup / PITR shipping)</td><td>Hours</td><td>Cheap; slow restore, untested restores</td></tr>
<tr><td><strong>Active-passive (warm standby)</strong>, async replica</td><td>1 region</td><td>Seconds (= replication lag)</td><td>Minutes</td><td>Idle capacity, failover runbook rot, lag spikes</td></tr>
<tr><td><strong>Active-active, home region per entity</strong></td><td>Every region, but each record has one owner</td><td>Seconds for the failed region's entities</td><td>Minutes (re-home)</td><td>Routing, re-homing logic, cross-region reads</td></tr>
<tr><td><strong>Active-active multi-writer</strong> (async, conflict resolution)</td><td>Every region, any record</td><td>Seconds</td><td>~0 (just route away)</td><td>Conflicts, LWW data loss, invariants hard</td></tr>
<tr><td><strong>Synchronous consensus</strong> (Spanner, CockroachDB, DynamoDB MRSC)</td><td>Every region</td><td>0</td><td>~0 for reads/writes in surviving majority</td><td>Write latency = cross-region quorum; 3+ regions needed</td></tr>
</table>
<p>Typical inter-region RTTs: us-east-1 ↔ us-west-2 ~60-70 ms, us-east-1 ↔ eu-west-1 ~70-80 ms, eu-west-1 ↔ ap-southeast-1 ~150-170 ms, Tel Aviv (il-central-1) ↔ Frankfurt ~45-55 ms. Synchronous replication to a far region adds at least one RTT to every commit.</p>
<blockquote>💡 Real world: most companies that say "active-active" mean active-active <em>compute</em> with a single primary database region, plus read replicas elsewhere. That is fine and much simpler, just say it explicitly and know your RPO.</blockquote>`,
        he: `<table>
<tr><th>תבנית</th><th>Writes</th><th>RPO באובדן region</th><th>RTO</th><th>המחיר / הסיכון העיקרי</th></tr>
<tr><td><strong>Backup &amp; restore</strong> ל-region אחר</td><td>region אחד</td><td>שעות (גיבוי אחרון / שילוח PITR)</td><td>שעות</td><td>זול; שחזור איטי, שחזורים שלא נבדקו</td></tr>
<tr><td><strong>Active-passive (warm standby)</strong>, replica אסינכרונית</td><td>region אחד</td><td>שניות (= replication lag)</td><td>דקות</td><td>קיבולת בטלה, runbook של failover שמתיישן, קפיצות lag</td></tr>
<tr><td><strong>Active-active, home region לכל entity</strong></td><td>כל region, אבל לכל רשומה יש בעלים אחד</td><td>שניות ל-entities של ה-region שנפל</td><td>דקות (re-home)</td><td>ניתוב, לוגיקת re-homing, reads בין regions</td></tr>
<tr><td><strong>Active-active multi-writer</strong> (אסינכרוני, פתרון קונפליקטים)</td><td>כל region, כל רשומה</td><td>שניות</td><td>בערך 0 (רק לנתב החוצה)</td><td>קונפליקטים, אובדן דאטה ב-LWW, אינווריאנטים קשים</td></tr>
<tr><td><strong>Consensus סינכרוני</strong> (Spanner, CockroachDB, DynamoDB MRSC)</td><td>כל region</td><td>0</td><td>בערך 0 ל-reads/writes ברוב ששרד</td><td>latency של write = quorum בין regions; צריך 3+ regions</td></tr>
</table>
<p>RTTs טיפוסיים בין regions: us-east-1 ↔ us-west-2 בערך 60-70 ms, us-east-1 ↔ eu-west-1 בערך 70-80 ms, eu-west-1 ↔ ap-southeast-1 בערך 150-170 ms, תל אביב (il-central-1) ↔ פרנקפורט בערך 45-55 ms. replication סינכרוני ל-region רחוק מוסיף לפחות RTT אחד לכל commit.</p>
<blockquote>💡 מהשטח: רוב החברות שאומרות "active-active" מתכוונות ל-active-active ב-<em>compute</em> עם region אחד ל-DB הראשי, ועוד read replicas במקומות אחרים. זה בסדר והרבה יותר פשוט – רק תגידו את זה במפורש ותדעו מה ה-RPO שלכם.</blockquote>`
      }
    },
    {
      h: { en: "Conflict resolution: LWW, CRDTs and avoiding conflicts", he: "פתרון קונפליקטים: LWW, CRDTs והימנעות מקונפליקטים" },
      body: {
        en: `<p>With multiple writers and async replication, two regions can update the same record concurrently. Options, from crude to precise:</p>
<ul>
<li><strong>Last-writer-wins (LWW)</strong>: highest timestamp wins (DynamoDB global tables MREC, Cassandra, Cosmos DB default on <code>_ts</code>). Simple and convergent, but <strong>silently discards</strong> the losing write, and "latest" depends on clock quality. Fine for user preferences, last-seen, caches; dangerous for counters, balances, inventory, sets.</li>
<li><strong>Custom merge</strong>: application-defined resolver (Cosmos DB stored-procedure conflict resolution, CouchDB revisions surfaced to the app, Dynamo-style siblings).</li>
<li><strong>CRDTs</strong> (Conflict-free Replicated Data Types): data structures whose merge is commutative, associative and idempotent, so replicas converge regardless of order or duplicates.
<ul>
<li><em>G-Counter</em>: one counter per region, value = sum; merge = per-region max. <em>PN-Counter</em>: two G-Counters (increments, decrements).</li>
<li><em>OR-Set</em> (observed-remove): add-wins set; a remove only deletes the adds it has seen.</li>
<li><em>LWW-Register</em>, <em>MV-Register</em> (keeps all concurrent values), sequence CRDTs for collaborative text (Automerge, Yjs).</li>
<li>Used by Redis Enterprise Active-Active, Riak, Azure Cosmos DB (some types), Figma/Linear-style collaborative apps.</li>
</ul></li>
<li><strong>Avoid conflicts by design</strong> (usually best): give each entity a <strong>home region</strong> that owns writes (user's region, tenant's region); other regions forward writes or read async copies. Conflicts become impossible except during re-homing. Use append-only events instead of in-place updates where you can.</li>
</ul>
<pre>G-Counter "likes" (3 regions)
  us: {us:5, eu:2, ap:0}    eu: {us:4, eu:3, ap:1}
  merge = per-key max -&gt; {us:5, eu:3, ap:1}  value = 9   (order/duplicates don't matter)

CRDTs can't enforce invariants like "balance &gt;= 0" or "username unique": those need
coordination (a single owner region or consensus).</pre>`,
        he: `<p>עם כמה כותבים ו-replication אסינכרוני, שני regions יכולים לעדכן את אותה רשומה במקביל. אפשרויות, מגס למדויק:</p>
<ul>
<li><strong>Last-writer-wins (LWW)</strong>: ה-timestamp הגבוה מנצח (DynamoDB global tables במצב MREC, Cassandra, ברירת המחדל של Cosmos DB לפי <code>_ts</code>). פשוט ומתכנס, אבל <strong>זורק בשקט</strong> את ה-write שהפסיד, ו"אחרון" תלוי באיכות השעונים. בסדר להעדפות משתמש, last-seen, caches; מסוכן ל-counters, יתרות, מלאי, sets.</li>
<li><strong>Merge מותאם</strong>: resolver שהאפליקציה מגדירה (פתרון קונפליקטים ב-stored procedure ב-Cosmos DB, revisions של CouchDB שעולות לאפליקציה, siblings בסגנון Dynamo).</li>
<li><strong>CRDTs</strong> (Conflict-free Replicated Data Types): מבני נתונים שה-merge שלהם קומוטטיבי, אסוציאטיבי ו-idempotent, כך שה-replicas מתכנסות בלי קשר לסדר או לכפילויות.
<ul>
<li><em>G-Counter</em>: counter לכל region, הערך = הסכום; merge = max לכל region. <em>PN-Counter</em>: שני G-Counters (הוספות, הורדות).</li>
<li><em>OR-Set</em> (observed-remove): set שבו add מנצח; remove מוחק רק את ה-adds שהוא ראה.</li>
<li><em>LWW-Register</em>, <em>MV-Register</em> (שומר את כל הערכים המקבילים), sequence CRDTs לטקסט שיתופי (Automerge, Yjs).</li>
<li>בשימוש ב-Redis Enterprise Active-Active, Riak, Azure Cosmos DB (חלק מהסוגים), ואפליקציות שיתופיות בסגנון Figma/Linear.</li>
</ul></li>
<li><strong>להימנע מקונפליקטים מראש</strong> (בדרך כלל הכי טוב): לתת לכל entity <strong>home region</strong> שהוא הבעלים של ה-writes (ה-region של המשתמש, של ה-tenant); regions אחרים מעבירים אליו writes או קוראים עותקים אסינכרוניים. קונפליקטים הופכים לבלתי אפשריים חוץ מבזמן re-homing. איפה שאפשר, events שרק מתווספים במקום עדכונים במקום.</li>
</ul>
<pre>G-Counter "likes" (3 regions)
  us: {us:5, eu:2, ap:0}    eu: {us:4, eu:3, ap:1}
  merge = per-key max -&gt; {us:5, eu:3, ap:1}  value = 9   (order/duplicates don't matter)

CRDTs can't enforce invariants like "balance &gt;= 0" or "username unique": those need
coordination (a single owner region or consensus).</pre>`
      }
    },
    {
      h: { en: "Global databases compared", he: "השוואת DBs גלובליים" },
      body: {
        en: `<table>
<tr><th>Database</th><th>Model</th><th>Writes</th><th>Notes</th></tr>
<tr><td><strong>Google Spanner</strong></td><td>Synchronous Paxos + TrueTime, strict serializability</td><td>Multi-region configs (e.g. nam-eur-asia1) with a leader region; writes pay a quorum across voting regions (tens of ms)</td><td>99.999% SLA for multi-region; stale reads (<code>max_staleness</code>) served locally and fast</td></tr>
<tr><td><strong>CockroachDB</strong></td><td>Raft per range + HLC, serializable</td><td>Table localities: <code>REGIONAL BY ROW</code> (row homed by a <code>crdb_region</code> column), <code>GLOBAL</code> tables (fast reads everywhere, slow writes)</td><td><code>SURVIVE REGION FAILURE</code> needs 3+ regions, RPO 0</td></tr>
<tr><td><strong>Aurora Global Database</strong></td><td>Single writer region, storage-level async replication</td><td>One primary region; up to 10 secondary read regions (originally 5); write forwarding optional</td><td>Lag typically under 1 s; managed switchover RPO 0; unplanned failover RPO = lag, RTO ~1-2 min</td></tr>
<tr><td><strong>DynamoDB global tables</strong></td><td>MREC: async multi-writer, LWW. MRSC (2025): strongly consistent across 3 regions</td><td>Every replica region writable</td><td>MREC replication usually under 1 s; conditional writes are only checked in the local region under MREC</td></tr>
<tr><td><strong>Azure Cosmos DB</strong></td><td>5 consistency levels: Strong, Bounded Staleness, Session (default), Consistent Prefix, Eventual</td><td>Single-write or multi-region writes (LWW or custom resolver)</td><td>Strong is not available with multi-region writes; Session gives read-your-writes per client token</td></tr>
</table>
<pre>-- CockroachDB: rows live in the user's region, survive a full region loss
ALTER DATABASE shop SET PRIMARY REGION "eu-west-1";
ALTER DATABASE shop ADD REGION "us-east-1";
ALTER DATABASE shop ADD REGION "ap-southeast-1";
ALTER DATABASE shop SURVIVE REGION FAILURE;
ALTER TABLE users SET LOCALITY REGIONAL BY ROW;      -- hidden crdb_region column
ALTER TABLE currencies SET LOCALITY GLOBAL;           -- read-mostly reference data</pre>`,
        he: `<table>
<tr><th>Database</th><th>מודל</th><th>Writes</th><th>הערות</th></tr>
<tr><td><strong>Google Spanner</strong></td><td>Paxos סינכרוני + TrueTime, strict serializability</td><td>קונפיגורציות multi-region (למשל nam-eur-asia1) עם leader region; writes משלמים quorum בין ה-regions המצביעים (עשרות ms)</td><td>SLA של 99.999% ל-multi-region; stale reads (<code>max_staleness</code>) מוגשים מקומית ומהר</td></tr>
<tr><td><strong>CockroachDB</strong></td><td>Raft לכל range + HLC, serializable</td><td>localities לטבלאות: <code>REGIONAL BY ROW</code> (שורה שייכת ל-region לפי עמודת <code>crdb_region</code>), טבלאות <code>GLOBAL</code> (reads מהירים בכל מקום, writes איטיים)</td><td><code>SURVIVE REGION FAILURE</code> דורש 3+ regions, RPO 0</td></tr>
<tr><td><strong>Aurora Global Database</strong></td><td>region כותב יחיד, replication אסינכרוני ברמת ה-storage</td><td>primary region אחד; עד 10 regions משניים לקריאה (במקור 5); write forwarding אופציונלי</td><td>lag בדרך כלל מתחת לשנייה; managed switchover עם RPO 0; failover לא מתוכנן RPO = lag, RTO בערך 1-2 דקות</td></tr>
<tr><td><strong>DynamoDB global tables</strong></td><td>MREC: multi-writer אסינכרוני, LWW. MRSC (2025): strongly consistent על 3 regions</td><td>כל region עם replica ניתן לכתיבה</td><td>replication ב-MREC בדרך כלל מתחת לשנייה; conditional writes נבדקים רק ב-region המקומי ב-MREC</td></tr>
<tr><td><strong>Azure Cosmos DB</strong></td><td>5 רמות עקביות: Strong, Bounded Staleness, Session (ברירת מחדל), Consistent Prefix, Eventual</td><td>single-write או multi-region writes (LWW או resolver מותאם)</td><td>Strong לא זמין עם multi-region writes; Session נותן read-your-writes לכל לקוח לפי token</td></tr>
</table>
<pre>-- CockroachDB: rows live in the user's region, survive a full region loss
ALTER DATABASE shop SET PRIMARY REGION "eu-west-1";
ALTER DATABASE shop ADD REGION "us-east-1";
ALTER DATABASE shop ADD REGION "ap-southeast-1";
ALTER DATABASE shop SURVIVE REGION FAILURE;
ALTER TABLE users SET LOCALITY REGIONAL BY ROW;      -- hidden crdb_region column
ALTER TABLE currencies SET LOCALITY GLOBAL;           -- read-mostly reference data</pre>`
      }
    },
    {
      h: { en: "Data residency and sovereignty", he: "Data residency וריבונות" },
      body: {
        en: `<p>Regulation often decides topology before latency does. GDPR (and Schrems II for EU→US transfers), Israel's Privacy Protection regulations and financial/health rules in many countries can require that personal data of residents is <strong>stored and/or processed</strong> in a given jurisdiction.</p>
<ul>
<li>Model it as <strong>regional cells / home regions</strong>: EU tenants' data lives only in EU cells; the global layer holds only non-personal routing metadata (tenant_id → region).</li>
<li><strong>Everything</strong> counts: backups, logs, traces, analytics copies, search indexes, support tooling, LLM prompts. The usual leak is not the primary DB but the logging pipeline shipping PII to a US-hosted SaaS.</li>
<li>Global features (cross-region search, global admin views) must be designed as federated queries or aggregates without personal data.</li>
<li>Disaster recovery must stay inside the boundary: EU primary in Frankfurt, DR in Ireland or Paris, not in Virginia.</li>
<li>Encryption with region-scoped keys (KMS per region, customer-managed keys) gives a technical control and an audit story: data copied elsewhere is unreadable.</li>
</ul>`,
        he: `<p>רגולציה הרבה פעמים מחליטה על הטופולוגיה לפני שה-latency מחליט. GDPR (ו-Schrems II להעברות מה-EU לארה״ב), תקנות הגנת הפרטיות בישראל, וחוקים פיננסיים ורפואיים בהרבה מדינות יכולים לחייב שהמידע האישי של תושבים <strong>יאוחסן ו/או יעובד</strong> בתחום שיפוט מסוים.</p>
<ul>
<li>ממדלים את זה כ-<strong>cells אזוריים / home regions</strong>: הדאטה של tenants מה-EU חי רק ב-cells ב-EU; השכבה הגלובלית מחזיקה רק מטא-דאטה של ניתוב בלי מידע אישי (tenant_id → region).</li>
<li><strong>הכול</strong> נחשב: גיבויים, לוגים, traces, עותקים לאנליטיקס, אינדקסים של חיפוש, כלי support, prompts ל-LLM. הדליפה הרגילה היא לא ה-DB הראשי אלא ה-pipeline של הלוגים ששולח PII ל-SaaS שמתארח בארה״ב.</li>
<li>פיצ'רים גלובליים (חיפוש בין regions, תצוגות אדמין גלובליות) חייבים להיות מתוכננים כ-federated queries או אגרגטים בלי מידע אישי.</li>
<li>DR חייב להישאר בתוך הגבול: primary ב-EU בפרנקפורט, DR באירלנד או בפריז, לא בווירג'יניה.</li>
<li>הצפנה עם מפתחות לפי region (KMS לכל region, customer-managed keys) נותנת בקרה טכנית וסיפור ל-audit: דאטה שהועתק למקום אחר לא קריא.</li>
</ul>`
      }
    },
    {
      h: { en: "RPO trade-offs and failover drills", he: "Trade-offs של RPO ותרגילי failover" },
      body: {
        en: `<p><strong>RPO is a business decision expressed in seconds of lost acknowledged writes.</strong> Async replication's RPO equals replication lag <em>at the moment of failure</em>, which is worst exactly when the primary is struggling (lag spikes under load). Make it visible:</p>
<pre># Aurora Global DB: replication lag to each secondary (ms)
aws cloudwatch get-metric-statistics --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag --dimensions Name=DBClusterIdentifier,Value=shop-eu \
  --start-time 2026-11-12T00:00:00Z --end-time 2026-11-12T12:00:00Z --period 300 --statistics Maximum

# Postgres: lag per replica, in bytes and time
SELECT application_name, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_behind, replay_lag
FROM pg_stat_replication;

# Planned (RPO 0) vs unplanned (RPO = lag) on Aurora Global:
aws rds switchover-global-cluster --global-cluster-identifier shop-global \
  --target-db-cluster-identifier arn:aws:rds:us-east-1:111122223333:cluster:shop-us
aws rds failover-global-cluster --global-cluster-identifier shop-global \
  --target-db-cluster-identifier arn:...:cluster:shop-us --allow-data-loss</pre>
<p><strong>Failover drills</strong> are the only proof that a DR design works:</p>
<ul>
<li>Run them on a schedule (quarterly at least) in production or a production-identical environment, with real traffic, and measure actual RTO/RPO against targets.</li>
<li>Test the hard parts: DNS/routing changes when the primary region's control plane is down; secrets, certificates, IAM and quotas in the DR region; capacity (can the DR region absorb 100%, and do you have quota reserved?); the re-sync and <strong>failback</strong> path; split-brain prevention (fence the old primary so it cannot accept writes when it returns).</li>
<li>Write down what happens to the writes in the lag window: are they lost, reconciled from logs/Kafka, or replayed by clients with idempotency keys?</li>
<li>Track "time since last successful drill" as a reliability metric; an untested failover is a hope, not a plan.</li>
</ul>`,
        he: `<p><strong>RPO הוא החלטה עסקית שמבוטאת בשניות של writes שקיבלו ack ואבדו.</strong> ה-RPO של replication אסינכרוני שווה ל-replication lag <em>ברגע הכשל</em>, והוא הכי גרוע בדיוק כשה-primary מתקשה (ה-lag קופץ תחת עומס). הופכים אותו לגלוי:</p>
<pre># Aurora Global DB: replication lag to each secondary (ms)
aws cloudwatch get-metric-statistics --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag --dimensions Name=DBClusterIdentifier,Value=shop-eu \
  --start-time 2026-11-12T00:00:00Z --end-time 2026-11-12T12:00:00Z --period 300 --statistics Maximum

# Postgres: lag per replica, in bytes and time
SELECT application_name, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_behind, replay_lag
FROM pg_stat_replication;

# Planned (RPO 0) vs unplanned (RPO = lag) on Aurora Global:
aws rds switchover-global-cluster --global-cluster-identifier shop-global \
  --target-db-cluster-identifier arn:aws:rds:us-east-1:111122223333:cluster:shop-us
aws rds failover-global-cluster --global-cluster-identifier shop-global \
  --target-db-cluster-identifier arn:...:cluster:shop-us --allow-data-loss</pre>
<p><strong>תרגילי failover</strong> הם ההוכחה היחידה שתכנון DR עובד:</p>
<ul>
<li>מריצים אותם לפי לוח זמנים (לפחות פעם ברבעון) בפרודקשן או בסביבה זהה לפרודקשן, עם תנועה אמיתית, ומודדים RTO/RPO בפועל מול היעדים.</li>
<li>בודקים את החלקים הקשים: שינויי DNS/ניתוב כשה-control plane של ה-region הראשי למטה; secrets, תעודות, IAM ו-quotas ב-region של ה-DR; קיבולת (האם ה-region של ה-DR יכול לספוג 100%, ויש לך quota שמור?); מסלול ה-re-sync וה-<strong>failback</strong>; מניעת split brain (לעשות fencing ל-primary הישן כדי שלא יוכל לקבל writes כשהוא חוזר).</li>
<li>לכתוב מה קורה ל-writes בחלון ה-lag: הם אובדים, מתיישרים מלוגים/Kafka, או נשלחים שוב ע״י הלקוחות עם idempotency keys?</li>
<li>עוקבים אחרי "זמן מאז התרגיל המוצלח האחרון" כמדד אמינות; failover שלא נבדק הוא תקווה, לא תוכנית.</li>
</ul>`
      }
    }
  ],
  diagram: `Active-passive (async)                    Active-active, home region per entity
 users -> [eu-west-1 PRIMARY] ==lag==> [us-east-1 standby]    EU users -> eu (owns EU rows) <-async-> us (owns US rows) <- US users
 region loss: promote standby, lose 'lag' seconds             region loss: re-home EU rows to us, RPO = lag

Synchronous consensus (Spanner / CockroachDB, 3 regions)
   eu-west-1  <--quorum (2 of 3)-->  us-east-1  <-->  ap-southeast-1
   commit latency ~ RTT to nearest other voter (~70 ms);  RPO 0, survives 1 region

Conflict (multi-writer, LWW):  eu: qty=5 @t1   us: qty=3 @t2 (t2>t1)  => qty=3, eu write silently lost`,
  handsOn: [
    { cmd: "aws dynamodb describe-table --table-name orders --query 'Table.{Replicas:Replicas[].{Region:RegionName,Status:ReplicaStatus},MultiRegionConsistency:MultiRegionConsistency}'", what: { en: "See a DynamoDB global table's replica regions and whether it uses eventual (MREC) or strong (MRSC) multi-region consistency.", he: "לראות את ה-regions של ה-replicas ב-DynamoDB global table והאם הוא משתמש בעקביות multi-region מסוג eventual (MREC) או strong (MRSC)." } },
    { cmd: "psql -h replica-us -c \"SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay, pg_is_in_recovery();\"", what: { en: "On a Postgres cross-region replica: how far behind is it in time? This is your current RPO if the primary region vanished now.", he: "על replica של Postgres ב-region אחר: בכמה זמן היא מפגרת? זה ה-RPO הנוכחי שלך אם ה-region הראשי היה נעלם עכשיו." } },
    { cmd: "cockroach sql --url $CRDB_URL -e \"SHOW REGIONS FROM DATABASE shop; SHOW SURVIVAL GOAL FROM DATABASE shop; SHOW CREATE TABLE users;\"", what: { en: "Check a CockroachDB database's regions, survival goal (ZONE vs REGION) and the table's locality.", he: "לבדוק את ה-regions של DB ב-CockroachDB, את ה-survival goal (ZONE מול REGION) ואת ה-locality של הטבלה." } },
    { cmd: "az cosmosdb show -n shop-cosmos -g rg-prod --query '{consistency:consistencyPolicy.defaultConsistencyLevel, multiWrite:enableMultipleWriteLocations, regions:locations[].locationName}'", what: { en: "See an Azure Cosmos DB account's default consistency level, whether multi-region writes are on, and its regions.", he: "לראות ב-Azure Cosmos DB את רמת העקביות ברירת המחדל, האם multi-region writes פעיל, ואת ה-regions." } }
  ],
  mnemonic: {
    en: "\"Async = RPO greater than zero, sync = latency greater than RTT, multi-writer = conflicts greater than zero.\" Pick two of: low latency writes, zero RPO, every region writable for every record.",
    he: "\"אסינכרוני = RPO גדול מאפס, סינכרוני = latency גדול מ-RTT, multi-writer = קונפליקטים גדולים מאפס.\" בוחרים שניים מתוך: writes עם latency נמוך, RPO אפס, כל region כותב לכל רשומה."
  },
  pitfalls: [
    { en: "Using LWW multi-writer replication for counters, balances or inventory. Concurrent decrements in two regions overwrite each other and acknowledged updates vanish with no error.", he: "להשתמש ב-replication של multi-writer עם LWW ל-counters, יתרות או מלאי. הורדות מקבילות בשני regions דורסות אחת את השנייה, ועדכונים שקיבלו ack נעלמים בלי שגיאה." },
    { en: "Quoting RPO from average replication lag. RPO is the lag at the moment of failure, which spikes during exactly the load or incident that causes failover; alert on max lag.", he: "לצטט RPO לפי replication lag ממוצע. RPO הוא ה-lag ברגע הכשל, והוא קופץ בדיוק בזמן העומס או התקלה שגורמים ל-failover; עושים alert על lag מקסימלי." },
    { en: "A DR region that has never carried production traffic: missing quotas, expired certificates, secrets not replicated, IAM differences, or not enough capacity. Drill it, ideally with real traffic.", he: "Region של DR שאף פעם לא נשא תנועת פרודקשן: quotas חסרים, תעודות שפגו, secrets שלא שוכפלו, הבדלי IAM, או חוסר קיבולת. מתרגלים אותו, אידיאלית עם תנועה אמיתית." },
    { en: "Data residency handled for the database but not for logs, traces, backups and analytics exports, which quietly replicate personal data to another jurisdiction.", he: "Data residency שמטופל ל-DB אבל לא ללוגים, traces, גיבויים וייצואים לאנליטיקס, שמשכפלים בשקט מידע אישי לתחום שיפוט אחר." }
  ],
  interview: [
    {
      q: { en: "Design the data layer for a global e-commerce platform in US, EU and APAC with EU data residency. Users must see their own orders instantly; inventory must never oversell.", he: "תתכנן את שכבת הדאטה לפלטפורמת e-commerce גלובלית ב-US, EU ו-APAC עם data residency ל-EU. משתמשים חייבים לראות את ההזמנות שלהם מיד; ובמלאי אסור לעולם למכור יותר ממה שיש." },
      a: { en: "Separate by data type. User profile and orders: home region per user (EU users homed in EU, enforced for residency), writes go to the home region, reads are local there → read-your-writes for free; other regions get no personal data or only pseudonymized aggregates. Catalog: single writer, replicated globally and cached/CDN'ed (eventual is fine). Inventory: the oversell invariant needs coordination, so each SKU's stock is owned by one region (the warehouse's region) with linearizable decrements there, or use a consensus DB for the inventory table only; reduce cross-region latency with reservations/allocations (each region pre-allocated a quota of stock it can sell locally, re-balanced async, like escrow). Global routing table tenant/user → home region in a small replicated store. DR: each home region has an in-jurisdiction standby; drill quarterly. State the RPO per data type.", he: "מפרידים לפי סוג דאטה. פרופיל משתמש והזמנות: home region לכל משתמש (משתמשי EU שייכים ל-EU, נאכף בשביל residency), ה-writes הולכים ל-home region וה-reads שם מקומיים ← read-your-writes בחינם; regions אחרים לא מקבלים מידע אישי או רק אגרגטים בפסאודונימיזציה. קטלוג: כותב יחיד, משוכפל גלובלית ונשמר ב-cache/CDN (eventual זה בסדר). מלאי: האינווריאנט של 'לא למכור יותר' דורש תיאום, אז ה-stock של כל SKU שייך ל-region אחד (ה-region של המחסן) עם הורדות linearizable שם, או DB מבוסס consensus רק לטבלת המלאי; מקטינים latency בין regions עם הקצאות (כל region מקבל מראש quota של מלאי שהוא יכול למכור מקומית, ומאזנים אסינכרונית, כמו escrow). טבלת ניתוב גלובלית של tenant/user ← home region ב-store קטן ומשוכפל. DR: לכל home region יש standby בתוך אותו תחום שיפוט; תרגיל כל רבעון. ומציינים RPO לכל סוג דאטה." }
    },
    {
      q: { en: "Leadership wants RPO 0 and RTO under 1 minute for a region failure, on Postgres. What do you tell them?", he: "ההנהלה רוצה RPO 0 ו-RTO מתחת לדקה בכשל region, על Postgres. מה אתה אומר להם?" },
      a: { en: "RPO 0 across regions requires synchronous replication: every commit waits for a remote region (+70 ms per write in US-EU, and if the remote is down, writes block unless you allow degrading to async, which breaks RPO 0). With plain Postgres that means synchronous_standby_names with ANY 1 across two remote regions, paying latency and adding a quorum. Alternatives: a consensus-based DB (CockroachDB/Spanner/Aurora DSQL/DynamoDB MRSC) with 3 regions; or accept RPO of seconds with async plus recovery of the lag window from an outbox/Kafka log mirrored cross-region and idempotent replay. Then quantify: cost of 1 minute of lost orders vs latency impact on conversion and infra cost. RTO under 1 minute also requires automated, data-plane-driven failover and drills; manual runbooks are 15-60 minutes in practice.", he: "RPO 0 בין regions דורש replication סינכרוני: כל commit מחכה ל-region מרוחק (+70 ms לכל write בין US ל-EU, ואם ה-region המרוחק למטה, ה-writes נחסמים אלא אם מרשים ירידה לאסינכרוני, מה ששובר את ה-RPO 0). ב-Postgres רגיל זה אומר synchronous_standby_names עם ANY 1 על שני regions מרוחקים, תשלום ב-latency והוספת quorum. חלופות: DB מבוסס consensus (CockroachDB/Spanner/Aurora DSQL/DynamoDB MRSC) עם 3 regions; או לקבל RPO של שניות עם אסינכרוני, ועוד שחזור של חלון ה-lag מ-outbox/log של Kafka ששוכפל בין regions ו-replay שהוא idempotent. ואז לכמת: העלות של דקה של הזמנות אבודות מול ההשפעה של ה-latency על המרה ועל עלות התשתית. RTO מתחת לדקה דורש גם failover אוטומטי שמונע ע״י ה-data plane ותרגילים; runbooks ידניים לוקחים בפועל 15-60 דקות." }
    },
    {
      q: { en: "When are CRDTs the right tool, and when are they not?", he: "מתי CRDTs הם הכלי הנכון, ומתי לא?" },
      a: { en: "Right: data where concurrent updates should merge rather than conflict, and no global invariant must hold: counters (likes, views), sets (tags, cart items with add-wins), presence, collaborative documents, offline-first mobile apps. They give availability under partition and local-latency writes. Not right: invariants that need coordination (balance never negative, unique usernames, stock not below zero), since merges can't reject operations. Also watch metadata growth (tombstones, per-replica state) and the semantics users expect (add-wins vs remove-wins). Often combine: CRDT for the convergent part, a coordinated owner for the invariant.", he: "נכון: דאטה שבו עדכונים מקבילים צריכים להתמזג ולא להתנגש, ואין אינווריאנט גלובלי שחייב להתקיים: counters (לייקים, צפיות), sets (תגיות, פריטים בעגלה עם add-wins), presence, מסמכים שיתופיים, אפליקציות מובייל offline-first. הם נותנים זמינות תחת partition ו-writes ב-latency מקומי. לא נכון: אינווריאנטים שדורשים תיאום (יתרה לעולם לא שלילית, שמות משתמש ייחודיים, מלאי לא מתחת לאפס), כי merge לא יכול לדחות פעולות. וגם לשים לב לגדילת מטא-דאטה (tombstones, state לכל replica) ולסמנטיקה שמשתמשים מצפים לה (add-wins מול remove-wins). הרבה פעמים משלבים: CRDT לחלק המתכנס, ובעלים מתואם לאינווריאנט." }
    }
  ],
  quiz: [
    {
      q: { en: "Async cross-region replication with average lag 200 ms. What is the RPO if the primary region is lost?", he: "Replication אסינכרוני בין regions עם lag ממוצע של 200 ms. מה ה-RPO אם ה-region הראשי אובד?" },
      options: [
        { en: "Exactly 200 ms", he: "בדיוק 200 ms" },
        { en: "Zero, because writes are acknowledged", he: "אפס, כי ה-writes קיבלו ack" },
        { en: "Whatever the lag is at the moment of failure, which may be much higher than average", he: "מה שה-lag יהיה ברגע הכשל, שיכול להיות הרבה יותר גבוה מהממוצע" },
        { en: "The backup interval", he: "המרווח בין הגיבויים" }
      ],
      answer: 2,
      explain: { en: "Acknowledged writes not yet replicated are lost; lag tends to spike under the stress that precedes a failure.", he: "writes שקיבלו ack ועוד לא שוכפלו אובדים; ה-lag נוטה לקפוץ תחת הלחץ שקודם לכשל." }
    },
    {
      q: { en: "Two regions concurrently increment a G-Counter: region A's state {A:3, B:1}, region B's state {A:2, B:4}. Merged value?", he: "שני regions מעלים G-Counter במקביל: ה-state של region A הוא {A:3, B:1}, של region B הוא {A:2, B:4}. מה הערך אחרי merge?" },
      options: [
        { en: "4", he: "4" },
        { en: "7", he: "7" },
        { en: "10", he: "10" },
        { en: "5", he: "5" }
      ],
      answer: 1,
      explain: { en: "Merge = per-region max: {A:3, B:4}, value = 3 + 4 = 7.", he: "Merge = max לכל region: {A:3, B:4}, הערך = 3 + 4 = 7." }
    },
    {
      q: { en: "Which design most simply avoids write conflicts in an active-active multi-region app?", he: "איזה עיצוב הכי פשוט נמנע מקונפליקטים של writes באפליקציית active-active ב-multi-region?" },
      options: [
        { en: "Last-writer-wins with NTP", he: "Last-writer-wins עם NTP" },
        { en: "Giving each entity a home region that owns its writes", he: "לתת לכל entity home region שהוא הבעלים של ה-writes שלו" },
        { en: "Increasing replication speed", he: "להגביר את מהירות ה-replication" },
        { en: "Using read replicas in every region", he: "להשתמש ב-read replicas בכל region" }
      ],
      answer: 1,
      explain: { en: "With a single owner per record, concurrent writes to the same record from two regions can't happen (except during re-homing).", he: "עם בעלים יחיד לכל רשומה, writes מקבילים לאותה רשומה משני regions לא יכולים לקרות (חוץ מבזמן re-homing)." }
    },
    {
      q: { en: "Why does CockroachDB's SURVIVE REGION FAILURE require at least 3 regions?", he: "למה SURVIVE REGION FAILURE ב-CockroachDB דורש לפחות 3 regions?" },
      options: [
        { en: "Licensing", he: "רישוי" },
        { en: "Raft needs a majority of replicas to survive; with 2 regions, losing one loses the majority", he: "Raft צריך שרוב ה-replicas ישרדו; עם 2 regions, אובדן אחד מאבד את הרוב" },
        { en: "To store 3 backups", he: "כדי לשמור 3 גיבויים" },
        { en: "For data residency", he: "בשביל data residency" }
      ],
      answer: 1,
      explain: { en: "Consensus tolerates f failures with 2f+1 voters; surviving a whole region means replicas spread so no single region holds a majority.", he: "Consensus שורד f כשלים עם 2f+1 מצביעים; לשרוד region שלם אומר לפזר replicas כך שאף region לא מחזיק רוב." }
    }
  ],
  playground: "dr",
  related: ["rel-bcdr", "db-replication", "db-cap", "cloud-regions-azs", "staff-consensus-consistency", "staff-time-ordering"]
});

// ---------------------------------------------------------------------------
// Glossary — staff distributed systems
// ---------------------------------------------------------------------------
[
  ["Linearizability", "The strongest single-object consistency model: every operation appears to take effect atomically at one instant between its start and end, so once a write is acknowledged every later read sees it.", "מודל העקביות החזק ביותר לאובייקט בודד: כל פעולה נראית כאילו קרתה ברגע אחד בין ההתחלה לסוף, כך שברגע ש-write קיבל ack כל read מאוחר יותר רואה אותו.", "staff-consensus-consistency"],
  ["Raft", "A consensus algorithm (etcd, Consul, KRaft, CockroachDB) that elects a leader per term and commits log entries once a majority has persisted them; 2f+1 nodes tolerate f failures.", "אלגוריתם consensus (etcd, Consul, KRaft, CockroachDB) שבוחר leader לכל term ועושה commit ל-entries ב-log ברגע שרוב ה-nodes שמרו אותם; 2f+1 nodes שורדים f כשלים.", "staff-consensus-consistency"],
  ["Fencing token", "A monotonically increasing number issued with each lock or leadership grant; the protected resource rejects any write carrying a token lower than the highest it has seen, neutralizing paused or deposed holders.", "מספר שרק עולה שמונפק עם כל הענקת lock או הובלה; המשאב המוגן דוחה כל write עם token נמוך מהגבוה ביותר שכבר ראה, וכך מנטרל מחזיקים שקפאו או הודחו.", "staff-consensus-consistency"],
  ["Hybrid Logical Clock (HLC)", "A timestamp combining physical time with a logical counter: preserves happened-before like a Lamport clock while staying close to wall-clock time; used by CockroachDB, YugabyteDB and MongoDB.", "timestamp שמשלב זמן פיזי עם counter לוגי: שומר על happened-before כמו שעון Lamport ונשאר קרוב לשעון הקיר; בשימוש ב-CockroachDB, YugabyteDB ו-MongoDB.", "staff-time-ordering"],
  ["TrueTime", "Google's clock API returning an interval [earliest, latest] with bounded uncertainty (a few ms) backed by GPS and atomic clocks; Spanner waits out the uncertainty on commit to get external consistency.", "ה-API של שעון ב-Google שמחזיר טווח [earliest, latest] עם אי-ודאות חסומה (כמה ms), מגובה ב-GPS ושעונים אטומיים; Spanner מחכה לאי-הוודאות ב-commit כדי לקבל external consistency.", "staff-time-ordering"],
  ["Change Data Capture (CDC)", "Streaming row-level changes from a database's replication log (Postgres WAL, MySQL binlog) to consumers such as Kafka, e.g. with Debezium; the reliable relay for a transactional outbox.", "הזרמה של שינויים ברמת שורה מה-replication log של DB (WAL של Postgres, binlog של MySQL) ל-consumers כמו Kafka, למשל עם Debezium; ה-relay האמין ל-transactional outbox.", "staff-exactly-once"],
  ["In-sync replicas (ISR)", "In Kafka, the set of partition replicas caught up with the leader; acks=all waits for all ISR members, and min.insync.replicas sets how small the ISR may get before writes are rejected.", "ב-Kafka, סט ה-replicas של partition שמעודכנות מול ה-leader; acks=all מחכה לכל חברי ה-ISR, ו-min.insync.replicas קובע עד כמה ה-ISR יכול להתכווץ לפני שה-writes נדחים.", "staff-kafka-deep"],
  ["Tail latency amplification", "When a request fans out to many backends and waits for all, rare slow responses become common: with 100 backends each slow 1% of the time, 63% of requests are slow.", "כשבקשה מתפצלת להרבה backends ומחכה לכולם, תגובות איטיות נדירות הופכות לנפוצות: עם 100 backends שכל אחד איטי ב-1% מהזמן, 63% מהבקשות איטיות.", "staff-queueing-tail-latency"],
  ["Hedged request", "Sending a duplicate of a slow idempotent request to another replica after a delay (e.g. the p95) and using whichever answers first, to cut tail latency at a small extra load.", "שליחת עותק של בקשה idempotent איטית ל-replica אחרת אחרי השהיה (למשל ה-p95) ושימוש במה שעונה ראשון, כדי לחתוך tail latency במחיר עומס נוסף קטן.", "staff-queueing-tail-latency"],
  ["Coordinated omission", "A load-testing measurement error where a closed-loop client stops sending while the server stalls, so slow periods are under-sampled and reported percentiles look far better than reality.", "שגיאת מדידה בבדיקות עומס שבה לקוח בלולאה סגורה מפסיק לשלוח כשהשרת נתקע, כך שתקופות איטיות נדגמות פחות מדי והאחוזונים המדווחים נראים הרבה יותר טוב מהמציאות.", "staff-queueing-tail-latency"],
  ["Metastable failure", "A failure where a system stays degraded after the trigger is gone because a feedback loop (retries, cold caches, queued dead work) sustains the overload; recovery requires cutting load well below normal.", "כשל שבו מערכת נשארת מושפלת אחרי שהטריגר נעלם, כי לולאת משוב (retries, caches קרים, עבודה מתה בתור) מקיימת את העומס; ההתאוששות דורשת להוריד עומס הרבה מתחת לרגיל.", "staff-overload-metastable"],
  ["Retry budget", "A cap on retries as a fraction of normal traffic (e.g. 10%), enforced per client or proxy, so retries can never multiply load during an outage.", "תקרה על retries כאחוז מהתנועה הרגילה (למשל 10%), שנאכפת לכל לקוח או proxy, כך ש-retries לעולם לא יכפילו את העומס בזמן השבתה.", "staff-overload-metastable"],
  ["Shuffle sharding", "Assigning each customer a random combination of k resources out of n, so a failure caused by one customer affects only customers with the exact same combination.", "שיבוץ של כל לקוח לצירוף אקראי של k משאבים מתוך n, כך שכשל שנגרם ע״י לקוח אחד פוגע רק בלקוחות עם בדיוק אותו צירוף.", "staff-cells-blast-radius"],
  ["Cell-based architecture", "Splitting a service into many independent full-stack copies (cells), each serving a bounded set of customers behind a thin router, so any failure or bad deploy affects only one cell.", "פיצול שירות להרבה עותקים עצמאיים של כל ה-stack (cells), שכל אחד משרת קבוצה חסומה של לקוחות מאחורי router דק, כך שכל כשל או deploy רע פוגע רק ב-cell אחד.", "staff-cells-blast-radius"],
  ["Static stability", "The property that a system keeps working through an expected failure (e.g. losing an AZ or the control plane) without needing to make changes such as scaling or reconfiguration.", "התכונה שמערכת ממשיכה לעבוד דרך כשל צפוי (למשל אובדן AZ או ה-control plane) בלי צורך לבצע שינויים כמו scaling או קונפיגורציה מחדש.", "staff-cells-blast-radius"],
  ["CRDT", "Conflict-free Replicated Data Type: a data structure (counter, set, register, text) whose merge is commutative, associative and idempotent, so replicas updated independently always converge.", "Conflict-free Replicated Data Type: מבנה נתונים (counter, set, register, טקסט) שה-merge שלו קומוטטיבי, אסוציאטיבי ו-idempotent, כך ש-replicas שמתעדכנות בנפרד תמיד מתכנסות.", "staff-multi-region-data"],
].forEach(([term, en, he, lesson]) => window.INFRA.glossary.push({ term, track: "staff", def: { en, he }, lesson }));
