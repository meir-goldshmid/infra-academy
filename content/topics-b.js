window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. PostgreSQL HA with Patroni
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-postgres-ha-patroni",
  track: "data",
  order: 50,
  icon: "🐘",
  level: 3,
  minutes: 16,
  title: { en: "PostgreSQL HA with Patroni", he: "High Availability ל-PostgreSQL עם Patroni" },
  tldr: {
    en: "Patroni runs next to every Postgres node and races for a single leader key with a TTL in a consensus store (etcd, Consul or the Kubernetes API). Whoever holds the key is primary; whoever loses it must demote. Routing (HAProxy, pgBouncer) follows Patroni's REST health checks, and a watchdog reboots a node that can't prove it is still alive.",
    he: "Patroni רץ ליד כל node של Postgres ומתחרה על leader key יחיד עם TTL בתוך consensus store (etcd, Consul או ה-API של Kubernetes). מי שמחזיק את ה-key הוא ה-primary; מי שמאבד אותו חייב לעשות demote. ה-routing (HAProxy, pgBouncer) עוקב אחרי ה-health checks של ה-REST API של Patroni, ו-watchdog עושה reboot ל-node שלא מצליח להוכיח שהוא עדיין חי."
  },
  analogy: {
    en: "Think of a relay race with exactly one baton kept in a locked box at the referee's table (the DCS). The runner holding the baton must come back and tap the box every 10 seconds; if 30 seconds pass without a tap, the referee hands the baton to the fittest runner who is closest behind. A runner who realises he lost the baton must stop running immediately — and if he faints mid-track, a medic (the watchdog) drags him off before he can confuse anyone.",
    he: "תחשוב על מרוץ שליחים עם מקל אחד בלבד, שנמצא בקופסה נעולה ליד השופט (ה-DCS). הרץ שמחזיק את המקל חייב לחזור ולגעת בקופסה כל 10 שניות; אם עוברות 30 שניות בלי נגיעה, השופט מעביר את המקל לרץ הכי כשיר שהכי קרוב מאחור. רץ שמבין שאיבד את המקל חייב לעצור מיד — ואם הוא מתעלף באמצע המסלול, חובש (ה-watchdog) גורר אותו החוצה לפני שהוא מבלבל מישהו."
  },
  sections: [
    {
      h: { en: "Architecture: agents, DCS and the leader key", he: "ארכיטקטורה: agents, DCS וה-leader key" },
      body: {
        en: `<p><strong>Patroni</strong> is a Python daemon that runs on every Postgres host (or as PID 1 in the container, as in Zalando's Spilo image). It owns the Postgres process: it starts it, configures replication, promotes and demotes it. Patroni nodes never vote among themselves — they delegate the hard part (consensus) to a <strong>DCS</strong> (Distributed Configuration Store): etcd (v3 API), Consul, ZooKeeper, or the Kubernetes API (Endpoints/ConfigMaps, which is itself etcd underneath).</p>
<p>The core mechanism is a <strong>leader key</strong> with a TTL, written with compare-and-set:</p>
<pre>/service/pg-main/leader     = "pg-1"      (TTL 30s, renewed every loop)
/service/pg-main/members/   = one key per node: conn_url, api_url, xlog_location, timeline, tags
/service/pg-main/config     = cluster-wide dynamic config (patronictl edit-config)
/service/pg-main/sync       = which replica is currently synchronous
/service/pg-main/failover   = pending switchover/failover request</pre>
<p>Every <code>loop_wait</code> seconds (default 10) each node runs its HA loop. The leader updates its key (CAS on the previous value). Replicas check: is there a leader? If the key expired, every healthy replica checks it is not lagging more than <code>maximum_lag_on_failover</code> and asks the other members (via REST) whether anyone is ahead of it. Only the most advanced eligible node tries to create the key — and the DCS guarantees only one CAS succeeds.</p>
<pre># patroni.yml (essentials)
scope: pg-main
name: pg-1
restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.11:8008
etcd3:
  hosts: 10.0.0.5:2379,10.0.0.6:2379,10.0.0.7:2379
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576     # 1 MB, the default
    synchronous_mode: true
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        hot_standby: "on"
        wal_log_hints: "on"              # needed by pg_rewind (or data checksums)
        max_wal_senders: 10
postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.11:5432
  data_dir: /var/lib/postgresql/16/main
watchdog:
  mode: required
  device: /dev/watchdog
  safety_margin: 5
tags:
  nofailover: false
  noloadbalance: false</pre>
<p>The timing rule to remember: <code>loop_wait + 2 × retry_timeout ≤ ttl</code>. With 10 + 2×10 = 30 the leader gets two retries against a flaky DCS before its key could expire. Typical unplanned failover time is therefore ~30-40 s (TTL expiry + one loop + promotion), not "instant".</p>
<blockquote>💡 Real world: the DCS is the brain. A 3-node etcd on slow, shared disks is the most common root cause of "random" Patroni failovers: etcd misses heartbeats, the leader can't renew its key within <code>retry_timeout</code>, and Patroni demotes a perfectly healthy primary.</blockquote>`,
        he: `<p><strong>Patroni</strong> הוא daemon ב-Python שרץ על כל host של Postgres (או כ-PID 1 בקונטיינר, כמו ב-image של Spilo של Zalando). הוא הבעלים של תהליך ה-Postgres: מפעיל אותו, מגדיר replication, עושה לו promote ו-demote. ה-node-ים של Patroni לא מצביעים ביניהם — הם מעבירים את החלק הקשה (consensus) ל-<strong>DCS</strong> (Distributed Configuration Store): etcd (API גרסה 3), Consul, ZooKeeper, או ה-API של Kubernetes (Endpoints/ConfigMaps, שמתחת זה בעצמו etcd).</p>
<p>המנגנון המרכזי הוא <strong>leader key</strong> עם TTL, שנכתב עם compare-and-set:</p>
<pre>/service/pg-main/leader     = "pg-1"      (TTL 30s, renewed every loop)
/service/pg-main/members/   = one key per node: conn_url, api_url, xlog_location, timeline, tags
/service/pg-main/config     = cluster-wide dynamic config (patronictl edit-config)
/service/pg-main/sync       = which replica is currently synchronous
/service/pg-main/failover   = pending switchover/failover request</pre>
<p>כל <code>loop_wait</code> שניות (ברירת מחדל 10) כל node מריץ את ה-HA loop שלו. ה-leader מעדכן את ה-key שלו (CAS על הערך הקודם). ה-replica-ים בודקים: יש leader? אם ה-key פג, כל replica בריא מוודא שהוא לא בפיגור של יותר מ-<code>maximum_lag_on_failover</code> ושואל את שאר החברים (דרך REST) אם מישהו מתקדם ממנו. רק ה-node המתקדם ביותר שזכאי מנסה ליצור את ה-key — וה-DCS מבטיח שרק CAS אחד יצליח.</p>
<pre># patroni.yml (essentials)
scope: pg-main
name: pg-1
restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.11:8008
etcd3:
  hosts: 10.0.0.5:2379,10.0.0.6:2379,10.0.0.7:2379
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576     # 1 MB, the default
    synchronous_mode: true
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        hot_standby: "on"
        wal_log_hints: "on"              # needed by pg_rewind (or data checksums)
        max_wal_senders: 10
postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.11:5432
  data_dir: /var/lib/postgresql/16/main
watchdog:
  mode: required
  device: /dev/watchdog
  safety_margin: 5
tags:
  nofailover: false
  noloadbalance: false</pre>
<p>כלל התזמון שצריך לזכור: <code>loop_wait + 2 × retry_timeout ≤ ttl</code>. עם 10 + 2×10 = 30 ל-leader יש שני ניסיונות חוזרים מול DCS לא יציב לפני שה-key שלו יכול לפוג. לכן failover לא מתוכנן לוקח בדרך כלל ~30-40 שניות (פקיעת TTL + loop אחד + promotion), לא "מיידי".</p>
<blockquote>💡 Real world: ה-DCS הוא המוח. etcd של 3 node-ים על דיסקים איטיים ומשותפים הוא ה-root cause הכי נפוץ ל-failover-ים "אקראיים" של Patroni: etcd מפספס heartbeats, ה-leader לא מצליח לחדש את ה-key בתוך <code>retry_timeout</code>, ו-Patroni עושה demote ל-primary בריא לגמרי.</blockquote>`
      }
    },
    {
      h: { en: "Switchover vs failover with patronictl", he: "Switchover מול failover עם patronictl" },
      body: {
        en: `<p>A <strong>switchover</strong> is planned: the current leader is healthy, you choose when and to whom (patching, instance resize, AZ evacuation). Patroni checkpoints, stops the old primary cleanly, waits for the candidate to receive all WAL, promotes it — zero data loss, typically 5-15 s of write unavailability. A <strong>failover</strong> is the unplanned version (or a manual promotion when there is no healthy leader) and may lose the async tail.</p>
<pre>$ patronictl -c /etc/patroni/patroni.yml list
+ Cluster: pg-main (7301234567890123456) ---+----+-----------+
| Member | Host      | Role         | State     | TL | Lag in MB |
+--------+-----------+--------------+-----------+----+-----------+
| pg-1   | 10.0.1.11 | Leader       | running   |  5 |           |
| pg-2   | 10.0.1.12 | Sync Standby | streaming |  5 |         0 |
| pg-3   | 10.0.1.13 | Replica      | streaming |  5 |        12 |
+--------+-----------+--------------+-----------+----+-----------+

$ patronictl switchover pg-main --leader pg-1 --candidate pg-2 --scheduled now --force
Current cluster topology ...
2026-11-14 10:02:11.48 Successfully switched over to "pg-2"
+ Cluster: pg-main (7301234567890123456) ---+----+-----------+
| Member | Host      | Role         | State     | TL | Lag in MB |
| pg-1   | 10.0.1.11 | Replica      | stopped   |    |   unknown |
| pg-2   | 10.0.1.12 | Leader       | running   |  6 |           |
| pg-3   | 10.0.1.13 | Replica      | streaming |  6 |         0 |

$ patronictl failover pg-main --candidate pg-3 --force    # only when there is no healthy leader
$ patronictl pause pg-main      # maintenance mode: Patroni stops automatic actions
$ patronictl resume pg-main
$ patronictl reinit pg-main pg-1   # rebuild a broken replica from the leader (pg_basebackup)
$ patronictl edit-config pg-main   # change DCS-wide settings (ttl, postgresql.parameters)</pre>
<p>Note the <strong>TL</strong> (timeline) column: every promotion bumps the timeline from 5 to 6. The old primary must rejoin on the new timeline — with <code>use_pg_rewind: true</code> Patroni runs <code>pg_rewind</code> to discard the WAL it wrote after the fork; without it, the node needs a full re-clone (hours for a 2 TB database).</p>
<blockquote>⚠️ Production tip: always use <code>pause</code> before manual surgery (pg_upgrade, restoring a data dir, editing <code>pg_hba.conf</code> by hand). Without it, Patroni will "helpfully" restart or promote things underneath you. And never forget <code>resume</code> — a paused cluster does not fail over.</blockquote>`,
        he: `<p><strong>Switchover</strong> הוא מתוכנן: ה-leader הנוכחי בריא, ואתה בוחר מתי ולמי (patching, שינוי גודל instance, פינוי AZ). Patroni עושה checkpoint, עוצר את ה-primary הישן בצורה נקייה, מחכה שה-candidate יקבל את כל ה-WAL ועושה לו promote — אפס איבוד מידע, בדרך כלל 5-15 שניות בלי כתיבות. <strong>Failover</strong> הוא הגרסה הלא מתוכננת (או promotion ידני כשאין leader בריא) ויכול לאבד את הזנב האסינכרוני.</p>
<pre>$ patronictl -c /etc/patroni/patroni.yml list
+ Cluster: pg-main (7301234567890123456) ---+----+-----------+
| Member | Host      | Role         | State     | TL | Lag in MB |
+--------+-----------+--------------+-----------+----+-----------+
| pg-1   | 10.0.1.11 | Leader       | running   |  5 |           |
| pg-2   | 10.0.1.12 | Sync Standby | streaming |  5 |         0 |
| pg-3   | 10.0.1.13 | Replica      | streaming |  5 |        12 |
+--------+-----------+--------------+-----------+----+-----------+

$ patronictl switchover pg-main --leader pg-1 --candidate pg-2 --scheduled now --force
Current cluster topology ...
2026-11-14 10:02:11.48 Successfully switched over to "pg-2"
+ Cluster: pg-main (7301234567890123456) ---+----+-----------+
| Member | Host      | Role         | State     | TL | Lag in MB |
| pg-1   | 10.0.1.11 | Replica      | stopped   |    |   unknown |
| pg-2   | 10.0.1.12 | Leader       | running   |  6 |           |
| pg-3   | 10.0.1.13 | Replica      | streaming |  6 |         0 |

$ patronictl failover pg-main --candidate pg-3 --force    # only when there is no healthy leader
$ patronictl pause pg-main      # maintenance mode: Patroni stops automatic actions
$ patronictl resume pg-main
$ patronictl reinit pg-main pg-1   # rebuild a broken replica from the leader (pg_basebackup)
$ patronictl edit-config pg-main   # change DCS-wide settings (ttl, postgresql.parameters)</pre>
<p>שים לב לעמודה <strong>TL</strong> (timeline): כל promotion מעלה את ה-timeline מ-5 ל-6. ה-primary הישן חייב להצטרף מחדש על ה-timeline החדש — עם <code>use_pg_rewind: true</code> Patroni מריץ <code>pg_rewind</code> כדי לזרוק את ה-WAL שהוא כתב אחרי הפיצול; בלי זה, ה-node צריך clone מלא מחדש (שעות לדאטהבייס של 2 TB).</p>
<blockquote>⚠️ Production tip: תמיד תעשה <code>pause</code> לפני ניתוח ידני (pg_upgrade, שחזור data dir, עריכה ידנית של <code>pg_hba.conf</code>). בלי זה, Patroni "יעזור" לך ויעשה restart או promote מתחת לרגליים. ואל תשכח <code>resume</code> — קלאסטר במצב pause לא עושה failover.</blockquote>`
      }
    },
    {
      h: { en: "Sync vs async, maximum_lag_on_failover and the RPO you actually get", he: "Sync מול async, ‏maximum_lag_on_failover וה-RPO שבאמת מקבלים" },
      body: {
        en: `<p>By default Patroni replicas are <strong>asynchronous</strong>: the primary commits locally and returns. On failover, whatever WAL had not reached the promoted replica is <em>gone</em>. Patroni bounds that loss with <code>maximum_lag_on_failover</code> (bytes, default 1 MiB): a replica further behind than that refuses to become leader. That is an RPO knob, but it is in bytes, not seconds — 1 MiB on a busy OLTP system can be a few hundred transactions.</p>
<p><strong>synchronous_mode: true</strong> makes Patroni manage <code>synchronous_standby_names</code> for you: one replica (or N, via <code>synchronous_node_count</code>) must confirm each commit, and only a replica listed in the <code>/sync</code> key may be promoted automatically. That gives RPO = 0 for automatic failover.</p>
<table>
<tr><th>Setting</th><th>Behaviour if the sync replica dies</th><th>Trade-off</th></tr>
<tr><td><code>synchronous_mode: false</code></td><td>Nothing changes</td><td>Fastest commits; RPO up to max lag</td></tr>
<tr><td><code>synchronous_mode: true</code></td><td>Patroni picks another sync replica, or temporarily drops to async if none is healthy</td><td>RPO 0 most of the time, availability preserved</td></tr>
<tr><td><code>synchronous_mode_strict: true</code></td><td>Writes <strong>block</strong> until a sync replica is back</td><td>Never acknowledges a commit that exists on one node only; you must run ≥ 3 nodes</td></tr>
</table>
<p>Commit latency with sync replication = local fsync + one network round trip + remote WAL flush. In the same AZ that's ~0.5-1 ms extra; across AZs in one region 1-2 ms; cross-region (e.g. 60 ms RTT) is usually unacceptable for OLTP — keep the sync replica in-region and use async for the DR replica.</p>
<pre># check from SQL on the primary
SELECT application_name, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
 application_name |   state   | sync_state | replay_lag_bytes
------------------+-----------+------------+------------------
 pg-2             | streaming | sync       |                0
 pg-3             | streaming | async      |         12582912</pre>
<blockquote>💡 Real world: replication slots must survive failover, or CDC consumers and lagging replicas lose their position. Declare them as <code>slots:</code> (permanent slots) in the Patroni DCS config — Patroni then creates them on the new primary and (on PG 11+) advances them on replicas. On PG 17 you can also use native failover slots (<code>sync_replication_slots</code>).</blockquote>`,
        he: `<p>כברירת מחדל ה-replica-ים של Patroni הם <strong>אסינכרוניים</strong>: ה-primary עושה commit מקומי ומחזיר תשובה. ב-failover, כל WAL שלא הגיע ל-replica שקיבל promote — <em>אבד</em>. Patroni מגביל את האיבוד הזה עם <code>maximum_lag_on_failover</code> (בבתים, ברירת מחדל 1 MiB): replica שמפגר יותר מזה מסרב להיות leader. זה כפתור של RPO, אבל הוא בבתים ולא בשניות — 1 MiB במערכת OLTP עמוסה יכול להיות כמה מאות טרנזקציות.</p>
<p><strong>synchronous_mode: true</strong> גורם ל-Patroni לנהל בשבילך את <code>synchronous_standby_names</code>: replica אחד (או N, דרך <code>synchronous_node_count</code>) חייב לאשר כל commit, ורק replica שרשום ב-key של <code>/sync</code> מותר לקבל promote אוטומטי. זה נותן RPO = 0 ל-failover אוטומטי.</p>
<table>
<tr><th>הגדרה</th><th>מה קורה כשה-sync replica מת</th><th>Trade-off</th></tr>
<tr><td><code>synchronous_mode: false</code></td><td>שום דבר לא משתנה</td><td>commit-ים הכי מהירים; RPO עד ה-max lag</td></tr>
<tr><td><code>synchronous_mode: true</code></td><td>Patroni בוחר sync replica אחר, או יורד זמנית ל-async אם אין אף אחד בריא</td><td>RPO 0 רוב הזמן, הזמינות נשמרת</td></tr>
<tr><td><code>synchronous_mode_strict: true</code></td><td>כתיבות <strong>נחסמות</strong> עד שיש שוב sync replica</td><td>אף פעם לא מאשר commit שקיים רק על node אחד; חייבים להריץ לפחות 3 node-ים</td></tr>
</table>
<p>ה-latency של commit עם sync replication = fsync מקומי + round trip אחד ברשת + flush של ה-WAL בצד השני. באותו AZ זה בערך 0.5-1 ms נוסף; בין AZ-ים באותו region ‏1-2 ms; בין regions (למשל RTT של 60 ms) זה בדרך כלל לא קביל ל-OLTP — תשאיר את ה-sync replica באותו region ותשתמש ב-async ל-replica של DR.</p>
<pre># check from SQL on the primary
SELECT application_name, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
 application_name |   state   | sync_state | replay_lag_bytes
------------------+-----------+------------+------------------
 pg-2             | streaming | sync       |                0
 pg-3             | streaming | async      |         12582912</pre>
<blockquote>💡 Real world: replication slots חייבים לשרוד failover, אחרת צרכני CDC ו-replica-ים מפגרים מאבדים את המיקום שלהם. תגדיר אותם כ-<code>slots:</code> (permanent slots) בקונפיג ה-DCS של Patroni — ואז Patroni יוצר אותם על ה-primary החדש ו(מ-PG 11 ומעלה) מקדם אותם על ה-replica-ים. ב-PG 17 אפשר גם להשתמש ב-failover slots המובנים (<code>sync_replication_slots</code>).</blockquote>`
      }
    },
    {
      h: { en: "Split-brain prevention: demote, fencing and the watchdog", he: "מניעת split brain: ‏demote, ‏fencing וה-watchdog" },
      body: {
        en: `<p>Consensus guarantees only one node can <em>hold</em> the leader key. It does not stop an old primary that doesn't know it lost the key from accepting writes. Patroni closes that gap in layers:</p>
<ul>
<li><strong>Self-demotion:</strong> if the leader cannot renew its key for <code>retry_timeout</code>, it demotes Postgres to read-only <em>before</em> the TTL expires. A primary cut off from the DCS stops being a primary on its own.</li>
<li><strong>Watchdog:</strong> what if Patroni itself hangs (Python stuck, VM frozen, OOM) while Postgres keeps serving writes? With <code>watchdog: mode: required</code>, Patroni opens <code>/dev/watchdog</code> (kernel <code>softdog</code> module or a hardware watchdog) and pets it every loop. If it stops petting, the kernel <strong>reboots the machine</strong> <code>safety_margin</code> seconds before the leader key expires — so the old primary is dead before a new one can exist.</li>
<li><strong>Routing by role, not by address:</strong> HAProxy health checks the REST API; a demoted node stops answering 200 on <code>/primary</code> within one check interval, and <code>on-marked-down shutdown-sessions</code> kills its existing connections.</li>
<li><strong>pg_rewind on rejoin:</strong> the old primary's diverged WAL is discarded instead of being replayed somewhere.</li>
</ul>
<pre># enable the software watchdog (systemd host)
$ echo softdog | sudo tee /etc/modules-load.d/softdog.conf
$ sudo modprobe softdog
$ sudo chown postgres /dev/watchdog          # Patroni must be able to open it
$ journalctl -u patroni | grep -i watchdog
INFO: Software Watchdog activated with 25 second timeout, timing slack 15 seconds</pre>
<p><strong>DCS outage:</strong> if the whole etcd cluster is unreachable, by default every Patroni demotes its node — the cluster becomes read-only rather than risking two primaries. Patroni 3.0+ adds <code>failsafe_mode: true</code>: the leader keeps running as primary as long as it can reach <em>all</em> members over the REST API and they all acknowledge it. That turns "etcd maintenance took down our database" into a non-event.</p>
<blockquote>⚠️ Production tip: two-node Patroni with a DCS on one of the two DB hosts is not HA — losing that host loses quorum <em>and</em> the primary. Put etcd on 3 separate failure domains (3 AZs), on low-latency SSDs, and treat it as tier-0 infrastructure.</blockquote>`,
        he: `<p>Consensus מבטיח שרק node אחד יכול <em>להחזיק</em> את ה-leader key. הוא לא עוצר primary ישן שלא יודע שאיבד את ה-key מלקבל כתיבות. Patroni סוגר את הפער הזה בשכבות:</p>
<ul>
<li><strong>Demote עצמי:</strong> אם ה-leader לא מצליח לחדש את ה-key שלו במשך <code>retry_timeout</code>, הוא מוריד את Postgres ל-read-only <em>לפני</em> שה-TTL פג. primary שמנותק מה-DCS מפסיק להיות primary בעצמו.</li>
<li><strong>Watchdog:</strong> מה אם Patroni עצמו נתקע (Python תקוע, VM קפוא, OOM) בזמן ש-Postgres ממשיך לקבל כתיבות? עם <code>watchdog: mode: required</code>, ‏Patroni פותח את <code>/dev/watchdog</code> (מודול הקרנל <code>softdog</code> או watchdog בחומרה) ו"מלטף" אותו בכל loop. אם הוא מפסיק, הקרנל <strong>עושה reboot למכונה</strong> <code>safety_margin</code> שניות לפני שה-leader key פג — כך שה-primary הישן מת לפני שיכול להיות חדש.</li>
<li><strong>Routing לפי תפקיד, לא לפי כתובת:</strong> HAProxy בודק health מול ה-REST API; node שעשה demote מפסיק להחזיר 200 על <code>/primary</code> תוך interval בדיקה אחד, ו-<code>on-marked-down shutdown-sessions</code> הורג את ה-connections הקיימים שלו.</li>
<li><strong>pg_rewind בהצטרפות מחדש:</strong> ה-WAL שהתפצל ב-primary הישן נזרק במקום להיות משוחזר איפשהו.</li>
</ul>
<pre># enable the software watchdog (systemd host)
$ echo softdog | sudo tee /etc/modules-load.d/softdog.conf
$ sudo modprobe softdog
$ sudo chown postgres /dev/watchdog          # Patroni must be able to open it
$ journalctl -u patroni | grep -i watchdog
INFO: Software Watchdog activated with 25 second timeout, timing slack 15 seconds</pre>
<p><strong>DCS נופל:</strong> אם כל קלאסטר ה-etcd לא נגיש, כברירת מחדל כל Patroni עושה demote ל-node שלו — הקלאסטר עובר ל-read-only במקום להסתכן בשני primary-ים. Patroni 3.0 ומעלה מוסיף <code>failsafe_mode: true</code>: ה-leader ממשיך לרוץ כ-primary כל עוד הוא מגיע ל<em>כל</em> החברים דרך ה-REST API וכולם מאשרים אותו. זה הופך את "תחזוקה של etcd הפילה לנו את הדאטהבייס" ללא-אירוע.</p>
<blockquote>⚠️ Production tip: Patroni של שני node-ים עם DCS על אחד משני שרתי ה-DB זה לא HA — איבוד השרת הזה מאבד גם quorum <em>וגם</em> את ה-primary. תשים את etcd על 3 failure domains נפרדים (3 AZ-ים), על SSD עם latency נמוך, ותתייחס אליו כתשתית tier-0.</blockquote>`
      }
    },
    {
      h: { en: "Routing: HAProxy, pgBouncer and the REST health endpoints", he: "Routing: ‏HAProxy, ‏pgBouncer וה-REST health endpoints" },
      body: {
        en: `<p>Clients should never hard-code the primary's IP. Patroni's REST API (port 8008) answers role questions with HTTP status codes, which any L4/L7 load balancer can use:</p>
<table>
<tr><th>Endpoint</th><th>200 when…</th><th>Use</th></tr>
<tr><td><code>/primary</code> (old: <code>/master</code>, <code>/leader</code>)</td><td>node is the running leader</td><td>read-write pool</td></tr>
<tr><td><code>/replica</code></td><td>running replica, not tagged <code>noloadbalance</code></td><td>read-only pool</td></tr>
<tr><td><code>/replica?lag=10MB</code></td><td>replica lagging ≤ 10 MB</td><td>reads that tolerate only small staleness</td></tr>
<tr><td><code>/read-only</code></td><td>leader or replica</td><td>reads that may also hit the primary</td></tr>
<tr><td><code>/sync</code> / <code>/async</code></td><td>sync / async standby</td><td>route to the RPO-0 standby</td></tr>
<tr><td><code>/health</code></td><td>Postgres is up</td><td>liveness only</td></tr>
</table>
<pre># haproxy.cfg
listen pg_rw
  bind *:5000
  option httpchk OPTIONS /primary
  http-check expect status 200
  default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
  server pg-1 10.0.1.11:5432 maxconn 500 check port 8008
  server pg-2 10.0.1.12:5432 maxconn 500 check port 8008
  server pg-3 10.0.1.13:5432 maxconn 500 check port 8008

listen pg_ro
  bind *:5001
  balance leastconn
  option httpchk OPTIONS /replica?lag=10MB
  http-check expect status 200
  default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
  server pg-1 10.0.1.11:5432 check port 8008
  server pg-2 10.0.1.12:5432 check port 8008
  server pg-3 10.0.1.13:5432 check port 8008</pre>
<p>Typical layout: app → pgBouncer (transaction pooling) → HAProxy :5000 → current primary. After failover, HAProxy flips within <code>inter × fall</code> ≈ 9 s; pgBouncer's server connections to the old primary break and are re-opened through HAProxy. Alternatives: Patroni <strong>callbacks</strong> (<code>on_role_change</code>) that move a VIP or update DNS, <code>vip-manager</code> (VIP follows the leader key in etcd), or on Kubernetes a Service whose Endpoints Patroni manages directly (Spilo/Zalando does exactly this).</p>
<blockquote>💡 Real world: libpq can do client-side routing too: <code>host=pg-1,pg-2,pg-3 target_session_attrs=read-write</code> tries each host until it finds a writable one. Simple and no extra hop, but every client must reconnect on failover and stale DNS/connection pools can keep writing to a demoted node for a while (it will reject writes as read-only — which is the safe failure).</blockquote>`,
        he: `<p>קליינטים לעולם לא צריכים לקודד את ה-IP של ה-primary. ה-REST API של Patroni (פורט 8008) עונה על שאלות תפקיד עם קודי HTTP, שכל load balancer ב-L4/L7 יכול להשתמש בהם:</p>
<table>
<tr><th>Endpoint</th><th>200 כש…</th><th>שימוש</th></tr>
<tr><td><code>/primary</code> (ישן: <code>/master</code>, <code>/leader</code>)</td><td>ה-node הוא ה-leader שרץ</td><td>pool של read-write</td></tr>
<tr><td><code>/replica</code></td><td>replica רץ, בלי tag של <code>noloadbalance</code></td><td>pool של read-only</td></tr>
<tr><td><code>/replica?lag=10MB</code></td><td>replica עם פיגור של עד 10 MB</td><td>קריאות שסובלות רק מעט staleness</td></tr>
<tr><td><code>/read-only</code></td><td>leader או replica</td><td>קריאות שמותר להן להגיע גם ל-primary</td></tr>
<tr><td><code>/sync</code> / <code>/async</code></td><td>standby סינכרוני / אסינכרוני</td><td>routing ל-standby עם RPO 0</td></tr>
<tr><td><code>/health</code></td><td>Postgres למעלה</td><td>liveness בלבד</td></tr>
</table>
<pre># haproxy.cfg
listen pg_rw
  bind *:5000
  option httpchk OPTIONS /primary
  http-check expect status 200
  default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
  server pg-1 10.0.1.11:5432 maxconn 500 check port 8008
  server pg-2 10.0.1.12:5432 maxconn 500 check port 8008
  server pg-3 10.0.1.13:5432 maxconn 500 check port 8008

listen pg_ro
  bind *:5001
  balance leastconn
  option httpchk OPTIONS /replica?lag=10MB
  http-check expect status 200
  default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
  server pg-1 10.0.1.11:5432 check port 8008
  server pg-2 10.0.1.12:5432 check port 8008
  server pg-3 10.0.1.13:5432 check port 8008</pre>
<p>מבנה טיפוסי: אפליקציה ← pgBouncer (transaction pooling) ← HAProxy :5000 ← ה-primary הנוכחי. אחרי failover, ‏HAProxy מתהפך תוך <code>inter × fall</code> ≈ 9 שניות; ה-server connections של pgBouncer ל-primary הישן נשברים ונפתחים מחדש דרך HAProxy. חלופות: <strong>callbacks</strong> של Patroni ‏(<code>on_role_change</code>) שמזיזים VIP או מעדכנים DNS, ‏<code>vip-manager</code> (VIP שעוקב אחרי ה-leader key ב-etcd), או ב-Kubernetes ‏Service שה-Endpoints שלו מנוהלים ישירות על ידי Patroni (זה בדיוק מה ש-Spilo/Zalando עושה).</p>
<blockquote>💡 Real world: גם libpq יודע לעשות routing בצד הקליינט: <code>host=pg-1,pg-2,pg-3 target_session_attrs=read-write</code> מנסה כל host עד שהוא מוצא אחד שאפשר לכתוב אליו. פשוט ובלי hop נוסף, אבל כל קליינט חייב להתחבר מחדש ב-failover, ו-DNS ישן או connection pools יכולים להמשיך לכתוב ל-node שעשה demote לזמן מה (הוא ידחה כתיבות כ-read-only — וזה כשל בטוח).</blockquote>`
      }
    },
    {
      h: { en: "On Kubernetes: operators, and the failures you'll actually see", he: "על Kubernetes: ‏operators, והתקלות שבאמת תראה" },
      body: {
        en: `<table>
<tr><th>Operator</th><th>HA engine</th><th>Notes</th></tr>
<tr><td><strong>CloudNativePG</strong> (CNCF)</td><td>No Patroni: its own instance manager uses the Kubernetes API for leader election and fencing</td><td>Pods + PVCs directly (no StatefulSet), Barman Cloud backups to S3/GCS/Azure, <code>-rw</code>/<code>-ro</code>/<code>-r</code> Services, <code>kubectl cnpg</code> plugin</td></tr>
<tr><td><strong>Zalando postgres-operator</strong></td><td>Patroni inside the Spilo image, DCS = Kubernetes Endpoints/ConfigMaps</td><td>Battle-tested at Zalando scale, WAL-G backups, built-in pgBouncer pooler</td></tr>
<tr><td><strong>Crunchy PGO</strong></td><td>Patroni, DCS = Kubernetes</td><td>pgBackRest backups, strong enterprise/support story</td></tr>
<tr><td><strong>Percona Operator for PostgreSQL</strong></td><td>Patroni (based on PGO v5)</td><td>Fully open source, pgBackRest</td></tr>
</table>
<pre>$ kubectl cnpg status pg-main
Cluster Summary
Name:               pg-main
PostgreSQL Image:   ghcr.io/cloudnative-pg/postgresql:16.4
Primary instance:   pg-main-1
Status:             Cluster in healthy state
Instances:          3
Ready instances:    3
$ kubectl cnpg promote pg-main pg-main-2      # switchover</pre>
<p><strong>Failures you will actually hit:</strong></p>
<ul>
<li><strong>Flapping failovers</strong> every few days: DCS latency (etcd on noisy disks) or a TTL too tight for your network. Check <code>etcd_disk_wal_fsync_duration_seconds</code> and Patroni logs for <code>Failed to update leader lock</code>.</li>
<li><strong>"No failover candidate"</strong>: all replicas are beyond <code>maximum_lag_on_failover</code> (a big batch job, a replica paused by a long query with <code>max_standby_streaming_delay=-1</code>) or tagged <code>nofailover</code>. The cluster stays down until you choose to lose data with <code>patronictl failover</code>.</li>
<li><strong>Old primary can't rejoin</strong>: pg_rewind failed (no <code>wal_log_hints</code>/checksums, or the needed WAL was recycled) → <code>patronictl reinit</code>.</li>
<li><strong>Writes hang after a replica died</strong>: <code>synchronous_mode_strict</code> with only two nodes.</li>
<li><strong>Whole cluster read-only</strong> during an etcd upgrade: no <code>failsafe_mode</code>.</li>
<li><strong>App errors for minutes after a 30 s failover</strong>: connection pools with no validation and long TCP keepalives; set <code>tcp_keepalives_idle</code>, pool health checks and short <code>server_check_delay</code> in pgBouncer.</li>
</ul>
<blockquote>⚠️ Production tip: rehearse a failover monthly (<code>patronictl switchover</code> in business hours) and measure the real write-unavailability from the app's point of view. A failover path that has not run in a year is a hypothesis, not HA.</blockquote>`,
        he: `<table>
<tr><th>Operator</th><th>מנוע ה-HA</th><th>הערות</th></tr>
<tr><td><strong>CloudNativePG</strong> (CNCF)</td><td>בלי Patroni: ה-instance manager שלו משתמש ב-API של Kubernetes ל-leader election ול-fencing</td><td>Pods ו-PVCs ישירות (בלי StatefulSet), גיבויים עם Barman Cloud ל-S3/GCS/Azure, ‏Services של <code>-rw</code>/<code>-ro</code>/<code>-r</code>, ה-plugin ‏<code>kubectl cnpg</code></td></tr>
<tr><td><strong>Zalando postgres-operator</strong></td><td>Patroni בתוך ה-image של Spilo, ה-DCS הוא Endpoints/ConfigMaps של Kubernetes</td><td>נבדק בקרב בסקייל של Zalando, גיבויים עם WAL-G, ‏pgBouncer pooler מובנה</td></tr>
<tr><td><strong>Crunchy PGO</strong></td><td>Patroni, ה-DCS הוא Kubernetes</td><td>גיבויים עם pgBackRest, סיפור enterprise ותמיכה חזק</td></tr>
<tr><td><strong>Percona Operator for PostgreSQL</strong></td><td>Patroni (מבוסס על PGO v5)</td><td>קוד פתוח מלא, pgBackRest</td></tr>
</table>
<pre>$ kubectl cnpg status pg-main
Cluster Summary
Name:               pg-main
PostgreSQL Image:   ghcr.io/cloudnative-pg/postgresql:16.4
Primary instance:   pg-main-1
Status:             Cluster in healthy state
Instances:          3
Ready instances:    3
$ kubectl cnpg promote pg-main pg-main-2      # switchover</pre>
<p><strong>התקלות שבאמת תפגוש:</strong></p>
<ul>
<li><strong>Failover-ים מרצדים</strong> כל כמה ימים: latency של ה-DCS ‏(etcd על דיסקים רועשים) או TTL צפוף מדי לרשת שלך. תבדוק את <code>etcd_disk_wal_fsync_duration_seconds</code> ואת הלוגים של Patroni לחיפוש <code>Failed to update leader lock</code>.</li>
<li><strong>"אין candidate ל-failover"</strong>: כל ה-replica-ים מעבר ל-<code>maximum_lag_on_failover</code> (batch job גדול, replica שנעצר בגלל query ארוך עם <code>max_standby_streaming_delay=-1</code>) או מסומנים <code>nofailover</code>. הקלאסטר נשאר למטה עד שאתה בוחר לאבד מידע עם <code>patronictl failover</code>.</li>
<li><strong>ה-primary הישן לא מצליח להצטרף</strong>: pg_rewind נכשל (אין <code>wal_log_hints</code> או checksums, או שה-WAL הנדרש כבר מוחזר) ← <code>patronictl reinit</code>.</li>
<li><strong>כתיבות תקועות אחרי שמת replica</strong>: <code>synchronous_mode_strict</code> עם שני node-ים בלבד.</li>
<li><strong>כל הקלאסטר read-only</strong> בזמן upgrade של etcd: אין <code>failsafe_mode</code>.</li>
<li><strong>שגיאות באפליקציה דקות אחרי failover של 30 שניות</strong>: connection pools בלי validation ו-TCP keepalives ארוכים; תגדיר <code>tcp_keepalives_idle</code>, ‏health checks ל-pool ו-<code>server_check_delay</code> קצר ב-pgBouncer.</li>
</ul>
<blockquote>⚠️ Production tip: תתרגל failover פעם בחודש (<code>patronictl switchover</code> בשעות העבודה) ותמדוד את זמן חוסר הזמינות האמיתי לכתיבות מנקודת המבט של האפליקציה. מסלול failover שלא רץ שנה הוא השערה, לא HA.</blockquote>`
      }
    }
  ],
  diagram: "        app -> pgBouncer -> HAProxy :5000 (/primary)  :5001 (/replica)\n                               |   health checks :8008\n          +--------------------+--------------------+\n        pg-1 Leader          pg-2 Sync Standby    pg-3 Replica\n        [Patroni+PG]         [Patroni+PG]         [Patroni+PG]\n          |  renew leader key (TTL 30s) / watch\n          +---------> etcd x3 (3 AZs) <-------------+",
  handsOn: [
    { cmd: "patronictl -c /etc/patroni/patroni.yml list", what: { en: "See members, roles (Leader / Sync Standby / Replica), timeline and lag in MB.", he: "לראות את החברים, התפקידים (Leader / Sync Standby / Replica), ה-timeline והפיגור ב-MB." } },
    { cmd: "curl -s -o /dev/null -w '%{http_code}\\n' http://10.0.1.12:8008/primary", what: { en: "Ask a node's REST API whether it is primary: 200 on the leader, 503 elsewhere — exactly what HAProxy checks.", he: "לשאול את ה-REST API של node אם הוא primary: ‏200 על ה-leader, ‏503 על השאר — בדיוק מה ש-HAProxy בודק." } },
    { cmd: "patronictl switchover pg-main --leader pg-1 --candidate pg-2 --scheduled now --force", what: { en: "Planned, zero-data-loss role change. Watch the TL column bump by one.", he: "החלפת תפקיד מתוכננת בלי איבוד מידע. תראה איך עמודת ה-TL עולה באחת." } },
    { cmd: "etcdctl get --prefix /service/pg-main/ --keys-only && etcdctl get /service/pg-main/leader", what: { en: "Look at Patroni's state directly in the DCS: leader key, members, config, sync.", he: "להסתכל על ה-state של Patroni ישירות ב-DCS: ה-leader key, החברים, הקונפיג וה-sync." } },
    { cmd: "patronictl show-config pg-main", what: { en: "Print the dynamic DCS config (ttl, loop_wait, maximum_lag_on_failover, synchronous_mode).", he: "להדפיס את הקונפיג הדינמי ב-DCS ‏(ttl, ‏loop_wait, ‏maximum_lag_on_failover, ‏synchronous_mode)." } }
  ],
  mnemonic: {
    en: "One key, one king: hold the key or step down — and if you freeze, the watchdog shoots first.",
    he: "key אחד, מלך אחד: מחזיק את ה-key או יורד מהכס — ואם אתה קופא, ה-watchdog יורה ראשון."
  },
  pitfalls: [
    { en: "Running etcd for Patroni on the same overloaded disks as Postgres. WAL fsync stalls in etcd cause missed leader renewals and needless failovers.", he: "להריץ את ה-etcd של Patroni על אותם דיסקים עמוסים של Postgres. עיכובי fsync של ה-WAL ב-etcd גורמים לפספוס חידושי ה-leader ול-failover-ים מיותרים." },
    { en: "Two-node clusters with synchronous_mode_strict: one replica restart blocks every write.", he: "קלאסטר של שני node-ים עם synchronous_mode_strict: ‏restart של replica אחד חוסם כל כתיבה." },
    { en: "Forgetting `patronictl resume` after maintenance: a paused cluster silently won't fail over.", he: "לשכוח `patronictl resume` אחרי תחזוקה: קלאסטר ב-pause פשוט לא יעשה failover, בלי להודיע." },
    { en: "Leaving replication slots unmanaged: after failover, CDC connectors lose their slot and need a full re-snapshot. Declare permanent slots in Patroni.", he: "להשאיר replication slots בלי ניהול: אחרי failover, ‏CDC connectors מאבדים את ה-slot וצריכים snapshot מלא מחדש. תגדיר permanent slots ב-Patroni." }
  ],
  interview: [
    {
      q: { en: "How does Patroni prevent two primaries if the network partitions the old primary away from etcd?", he: "איך Patroni מונע שני primary-ים אם הרשת מנתקת את ה-primary הישן מ-etcd?" },
      a: {
        en: "The old primary can't renew its leader key, so after retry_timeout it demotes itself to read-only — before the 30 s TTL expires and someone else can win the CAS. If Patroni itself is hung, the watchdog reboots the host safety_margin seconds before the TTL. HAProxy only routes to whoever answers 200 on /primary, and pg_rewind discards any diverged WAL on rejoin. With failsafe_mode, a primary that lost etcd but can still reach every member keeps running.",
        he: "ה-primary הישן לא מצליח לחדש את ה-leader key, אז אחרי retry_timeout הוא עושה לעצמו demote ל-read-only — לפני שה-TTL של 30 שניות פג ומישהו אחר יכול לנצח ב-CAS. אם Patroni עצמו תקוע, ה-watchdog עושה reboot ל-host ‏safety_margin שניות לפני ה-TTL. ‏HAProxy שולח רק למי שעונה 200 על /primary, ו-pg_rewind זורק כל WAL שהתפצל כשה-node מצטרף מחדש. עם failsafe_mode, ‏primary שאיבד את etcd אבל עדיין מגיע לכל החברים ממשיך לרוץ."
      }
    },
    {
      q: { en: "What RPO does a default Patroni cluster give you, and how do you get to zero?", he: "איזה RPO נותן קלאסטר Patroni ברירת מחדל, ואיך מגיעים לאפס?" },
      a: {
        en: "Default is async: up to maximum_lag_on_failover bytes (1 MiB) of committed data can be lost. synchronous_mode: true makes Patroni manage synchronous_standby_names and only promote the sync standby, so automatic failover loses nothing; it may still fall back to async if no sync replica is healthy. synchronous_mode_strict refuses that fallback at the cost of blocking writes — so you need at least three nodes.",
        he: "ברירת המחדל היא async: עד maximum_lag_on_failover בתים (1 MiB) של מידע שעשה commit יכולים ללכת לאיבוד. synchronous_mode: true גורם ל-Patroni לנהל את synchronous_standby_names ולעשות promote רק ל-sync standby, כך ש-failover אוטומטי לא מאבד כלום; עדיין יכול להיות fallback ל-async אם אין sync replica בריא. synchronous_mode_strict מסרב ל-fallback הזה במחיר של חסימת כתיבות — ולכן צריך לפחות שלושה node-ים."
      }
    }
  ],
  quiz: [
    {
      q: { en: "With ttl: 30, loop_wait: 10, retry_timeout: 10, roughly how long does an unplanned failover take after the primary's host loses power?", he: "עם ttl: 30, ‏loop_wait: 10, ‏retry_timeout: 10, בערך כמה זמן לוקח failover לא מתוכנן אחרי שה-host של ה-primary מאבד חשמל?" },
      options: [
        { en: "Under 1 second", he: "פחות משנייה" },
        { en: "About 30-40 seconds", he: "בערך 30-40 שניות" },
        { en: "Exactly 10 seconds", he: "בדיוק 10 שניות" },
        { en: "5 minutes", he: "5 דקות" }
      ],
      answer: 1,
      explain: { en: "The leader key must expire (up to 30 s), then a replica notices on its next loop (up to 10 s) and promotes. Patroni failover is bounded by the TTL, not instant.", he: "ה-leader key צריך לפוג (עד 30 שניות), ואז replica שם לב ב-loop הבא שלו (עד 10 שניות) ועושה promote. ה-failover של Patroni חסום על ידי ה-TTL, הוא לא מיידי." }
    },
    {
      q: { en: "Which HAProxy health check should the read-write pool use?", he: "באיזה health check צריך להשתמש ה-pool של read-write ב-HAProxy?" },
      options: [
        { en: "TCP check on port 5432", he: "בדיקת TCP על פורט 5432" },
        { en: "HTTP check on :8008/health", he: "בדיקת HTTP על ‎:8008/health" },
        { en: "HTTP check on :8008/primary expecting 200", he: "בדיקת HTTP על ‎:8008/primary שמצפה ל-200" },
        { en: "HTTP check on :8008/replica expecting 503", he: "בדיקת HTTP על ‎:8008/replica שמצפה ל-503" }
      ],
      answer: 2,
      explain: { en: "Every node accepts TCP on 5432 and /health is 200 on replicas too. Only /primary returns 200 exclusively on the current leader.", he: "כל node מקבל TCP על 5432, ו-/health מחזיר 200 גם על replica-ים. רק /primary מחזיר 200 אך ורק על ה-leader הנוכחי." }
    },
    {
      q: { en: "What is the purpose of Patroni's watchdog?", he: "מה המטרה של ה-watchdog של Patroni?" },
      options: [
        { en: "To restart Postgres after it crashes", he: "לעשות restart ל-Postgres אחרי שהוא קורס" },
        { en: "To reboot the host if Patroni stops responding, before its leader key can expire", he: "לעשות reboot ל-host אם Patroni מפסיק להגיב, לפני שה-leader key שלו יכול לפוג" },
        { en: "To monitor etcd disk latency", he: "לנטר את ה-latency של הדיסק של etcd" },
        { en: "To alert the on-call when lag is high", he: "להתריע ל-on-call כשהפיגור גבוה" }
      ],
      answer: 1,
      explain: { en: "If Patroni hangs while Postgres keeps accepting writes, a new leader could be elected while the old one still writes. The watchdog fences the old node by rebooting it first.", he: "אם Patroni נתקע בזמן ש-Postgres ממשיך לקבל כתיבות, יכול להיבחר leader חדש בזמן שהישן עדיין כותב. ה-watchdog עושה fencing ל-node הישן בכך שהוא עושה לו reboot קודם." }
    },
    {
      q: { en: "After failover all replicas were 50 MB behind and maximum_lag_on_failover is 1 MB. What happens?", he: "אחרי שה-primary נפל, כל ה-replica-ים היו בפיגור של 50 MB ו-maximum_lag_on_failover הוא 1 MB. מה קורה?" },
      options: [
        { en: "The least-lagging replica is promoted anyway", he: "ה-replica עם הפיגור הכי קטן מקבל promote בכל מקרה" },
        { en: "No replica promotes itself; the cluster has no primary until a human runs patronictl failover", he: "אף replica לא עושה לעצמו promote; לקלאסטר אין primary עד שבן אדם מריץ patronictl failover" },
        { en: "Patroni waits for the old primary forever and then deletes the cluster", he: "Patroni מחכה ל-primary הישן לנצח ואז מוחק את הקלאסטר" },
        { en: "Patroni switches to synchronous mode automatically", he: "Patroni עובר אוטומטית ל-synchronous mode" }
      ],
      answer: 1,
      explain: { en: "maximum_lag_on_failover is a hard gate: Patroni prefers no primary over silently losing more than the allowed data. A human can force it with patronictl failover, accepting the loss.", he: "maximum_lag_on_failover הוא שער קשיח: ‏Patroni מעדיף בלי primary על פני איבוד שקט של יותר מידע ממה שמותר. בן אדם יכול לכפות את זה עם patronictl failover, ולקבל את האיבוד." }
    }
  ],
  playground: "dr",
  related: ["db-replication", "staff-postgres-at-scale", "staff-consensus-consistency", "rel-ha", "db-backups", "k8s-operators-crds"]
});

// ---------------------------------------------------------------------------
// 2. etcd Operations & API Server Protection
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-etcd-apf",
  track: "kubernetes",
  order: 60,
  icon: "🗄️",
  level: 3,
  minutes: 16,
  title: { en: "etcd Operations & API Server Protection (APF)", he: "תפעול etcd והגנה על ה-API server ‏(APF)" },
  tldr: {
    en: "etcd is a small, fsync-bound Raft database that holds every Kubernetes object: keep it on fast disks (WAL fsync p99 under 10 ms), on 3 or 5 members, under its space quota (2 GiB default, 8 GiB max suggested) via compaction and defrag, and back it up with snapshots. In front of it, API Priority and Fairness queues and sheds load so one noisy controller can't take the control plane down.",
    he: "etcd הוא דאטהבייס Raft קטן שחסום על ידי fsync ומחזיק כל אובייקט של Kubernetes: תשאיר אותו על דיסקים מהירים (fsync של ה-WAL ב-p99 מתחת ל-10 ms), על 3 או 5 members, מתחת ל-quota (‏2 GiB ברירת מחדל, 8 GiB מקסימום מומלץ) בעזרת compaction ו-defrag, ותגבה אותו עם snapshots. לפניו, API Priority and Fairness עושה queueing ו-load shedding כדי ש-controller רועש אחד לא יפיל את ה-control plane."
  },
  analogy: {
    en: "etcd is the notary's ledger of the whole city: every deed is written in ink, countersigned by a majority of notaries, and old pages are never torn out — only crossed off (compaction) and later physically removed when you rebind the book (defrag). The API server is the front desk; Priority and Fairness is the queue system with separate windows for ambulances (system), regular citizens and the one guy who always shows up with 10,000 forms.",
    he: "etcd הוא ספר הרישום של הנוטריון של כל העיר: כל שטר נכתב בדיו, נחתם על ידי רוב הנוטריונים, ודפים ישנים אף פעם לא נתלשים — רק נמחקים בקו (compaction) ומוסרים פיזית רק כשכורכים את הספר מחדש (defrag). ה-API server הוא דלפק הקבלה; Priority and Fairness היא מערכת התורים עם חלונות נפרדים לאמבולנסים (system), לאזרחים רגילים ולבחור האחד שתמיד מגיע עם 10,000 טפסים."
  },
  sections: [
    {
      h: { en: "What etcd does and how to size it", he: "מה etcd עושה ואיך עושים לו sizing" },
      body: {
        en: `<p>Only <code>kube-apiserver</code> talks to etcd. Every object lives under <code>/registry/&lt;resource&gt;/&lt;namespace&gt;/&lt;name&gt;</code>, stored as protobuf, each write creating a new <strong>revision</strong> (MVCC). Kubernetes <code>resourceVersion</code> is that etcd revision, and every <code>watch</code> in the cluster is ultimately an etcd watch from a revision.</p>
<p>etcd uses <strong>Raft</strong>: a write is committed once a majority has it in its WAL, fsynced to disk. That makes two things matter more than CPU:</p>
<table>
<tr><th>Members</th><th>Quorum</th><th>Tolerates</th><th>Notes</th></tr>
<tr><td>1</td><td>1</td><td>0</td><td>Dev only</td></tr>
<tr><td>3</td><td>2</td><td>1</td><td>Standard: one per AZ</td></tr>
<tr><td>4</td><td>3</td><td>1</td><td>Pointless: more voters, same tolerance</td></tr>
<tr><td>5</td><td>3</td><td>2</td><td>Large/critical clusters; writes get slightly slower</td></tr>
<tr><td>7+</td><td>4+</td><td>3+</td><td>Not recommended: every write waits for more fsyncs</td></tr>
</table>
<ul>
<li><strong>Disk:</strong> <code>etcd_disk_wal_fsync_duration_seconds</code> p99 &lt; 10 ms and <code>etcd_disk_backend_commit_duration_seconds</code> p99 &lt; 25 ms. Use local NVMe or provisioned-IOPS SSD (e.g. gp3 with 3000+ IOPS is the floor, io2 better). Network-attached HDD or burstable volumes cause leader elections under load.</li>
<li><strong>Network:</strong> defaults <code>--heartbeat-interval=100</code> ms and <code>--election-timeout=1000</code> ms assume a peer RTT of a few ms; keep members in one region.</li>
<li><strong>Request size:</strong> <code>--max-request-bytes</code> default 1.5 MiB — that is why a single Kubernetes object (ConfigMap, Secret, CRD instance) can't exceed ~1 MiB.</li>
</ul>
<pre># the standard disk test for etcd (mimics WAL writes: small, sequential, fdatasync each)
$ fio --rw=write --ioengine=sync --fdatasync=1 --directory=/var/lib/etcd-test \
      --size=22m --bs=2300 --name=etcd-disk
  fsync/fdatasync/sync_file_range:
    sync percentiles (usec):
     | 99.00th=[ 2442], 99.90th=[ 4113]      &lt;- 2.4 ms p99: good. Above 10000 = trouble</pre>
<blockquote>💡 Real world: a co-located noisy neighbour (a backup job, a log shipper, Prometheus TSDB compaction) on the etcd disk is enough to push fsync p99 to 50+ ms; you then see <code>etcd_server_leader_changes_seen_total</code> climbing and kubectl hanging for seconds. Give etcd a dedicated disk.</blockquote>`,
        he: `<p>רק <code>kube-apiserver</code> מדבר עם etcd. כל אובייקט נמצא תחת <code>/registry/&lt;resource&gt;/&lt;namespace&gt;/&lt;name&gt;</code>, נשמר כ-protobuf, וכל כתיבה יוצרת <strong>revision</strong> חדש (MVCC). ה-<code>resourceVersion</code> של Kubernetes הוא ה-revision הזה של etcd, וכל <code>watch</code> בקלאסטר הוא בסוף watch של etcd מ-revision מסוים.</p>
<p>etcd משתמש ב-<strong>Raft</strong>: כתיבה נחשבת committed כשרוב ה-members כתבו אותה ל-WAL שלהם, עם fsync לדיסק. לכן שני דברים חשובים יותר מ-CPU:</p>
<table>
<tr><th>Members</th><th>Quorum</th><th>שורד</th><th>הערות</th></tr>
<tr><td>1</td><td>1</td><td>0</td><td>רק לפיתוח</td></tr>
<tr><td>3</td><td>2</td><td>1</td><td>הסטנדרט: אחד בכל AZ</td></tr>
<tr><td>4</td><td>3</td><td>1</td><td>חסר טעם: יותר מצביעים, אותה עמידות</td></tr>
<tr><td>5</td><td>3</td><td>2</td><td>קלאסטרים גדולים או קריטיים; כתיבות קצת יותר איטיות</td></tr>
<tr><td>7+</td><td>4+</td><td>3+</td><td>לא מומלץ: כל כתיבה מחכה ליותר fsync-ים</td></tr>
</table>
<ul>
<li><strong>דיסק:</strong> <code>etcd_disk_wal_fsync_duration_seconds</code> ב-p99 מתחת ל-10 ms, ו-<code>etcd_disk_backend_commit_duration_seconds</code> ב-p99 מתחת ל-25 ms. תשתמש ב-NVMe מקומי או SSD עם provisioned IOPS (למשל gp3 עם 3000+ IOPS זה המינימום, io2 עדיף). HDD ברשת או volumes עם burst גורמים ל-leader elections תחת עומס.</li>
<li><strong>רשת:</strong> ברירות המחדל <code>--heartbeat-interval=100</code> ms ו-<code>--election-timeout=1000</code> ms מניחות RTT של כמה ms בין ה-peers; תשאיר את ה-members באותו region.</li>
<li><strong>גודל בקשה:</strong> <code>--max-request-bytes</code> ברירת מחדל 1.5 MiB — וזו הסיבה שאובייקט Kubernetes בודד (ConfigMap, ‏Secret, מופע של CRD) לא יכול לעבור ~1 MiB.</li>
</ul>
<pre># the standard disk test for etcd (mimics WAL writes: small, sequential, fdatasync each)
$ fio --rw=write --ioengine=sync --fdatasync=1 --directory=/var/lib/etcd-test \
      --size=22m --bs=2300 --name=etcd-disk
  fsync/fdatasync/sync_file_range:
    sync percentiles (usec):
     | 99.00th=[ 2442], 99.90th=[ 4113]      &lt;- 2.4 ms p99: good. Above 10000 = trouble</pre>
<blockquote>💡 Real world: שכן רועש על דיסק ה-etcd (job של גיבוי, log shipper, ‏compaction של ה-TSDB של Prometheus) מספיק כדי לדחוף את ה-fsync ב-p99 ל-50+ ms; ואז רואים את <code>etcd_server_leader_changes_seen_total</code> עולה ו-kubectl נתקע לשניות. תן ל-etcd דיסק ייעודי.</blockquote>`
      }
    },
    {
      h: { en: "Space quota, compaction and defrag", he: "Space quota, ‏compaction ו-defrag" },
      body: {
        en: `<p>Because etcd keeps old revisions, its bbolt database only grows until history is <strong>compacted</strong>. kube-apiserver compacts automatically every 5 minutes (<code>--etcd-compaction-interval=5m</code>), discarding revisions older than that. But compaction only marks pages free <em>inside</em> the file — the file on disk stays the same size. <strong>Defragmentation</strong> rewrites the file and returns the space to the filesystem.</p>
<p>The <code>--quota-backend-bytes</code> limit defaults to <strong>2 GiB</strong>; the etcd docs suggest a maximum of <strong>8 GiB</strong> (managed services like EKS run at 8 GiB). When the DB file exceeds the quota, etcd raises a cluster-wide <code>NOSPACE</code> alarm and becomes <strong>read-and-delete only</strong>: every create/update fails with <code>etcdserver: mvcc: database space exceeded</code>. Running Pods keep running, but nothing can be deployed, scaled, or even have its status updated.</p>
<pre>$ export ETCDCTL_API=3 ETCDCTL_ENDPOINTS=https://10.0.0.5:2379,https://10.0.0.6:2379,https://10.0.0.7:2379 \
    ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.crt \
    ETCDCTL_CERT=/etc/kubernetes/pki/etcd/server.crt ETCDCTL_KEY=/etc/kubernetes/pki/etcd/server.key

$ etcdctl endpoint status -w table
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
|        ENDPOINT         |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM | RAFT INDEX |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
| https://10.0.0.5:2379   | 8e9e05c52164694d |  3.5.16 |  2.1 GB |      true |        14 |   98712345 |
| https://10.0.0.6:2379   | 91bc3c398fb3c146 |  3.5.16 |  2.1 GB |     false |        14 |   98712345 |
| https://10.0.0.7:2379   | fd422379fda50e48 |  3.5.16 |  2.1 GB |     false |        14 |   98712345 |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
$ etcdctl alarm list
memberID:10276657743932975437 alarm:NOSPACE

# recovery: compact to the current revision, defrag each member, disarm
$ rev=$(etcdctl endpoint status --write-out=json | grep -o '"revision":[0-9]*' | head -1 | cut -d: -f2)
$ etcdctl compact "$rev"
$ etcdctl --endpoints=https://10.0.0.6:2379 defrag      # one member at a time, followers first
$ etcdctl --endpoints=https://10.0.0.7:2379 defrag
$ etcdctl --endpoints=https://10.0.0.5:2379 defrag      # leader last
$ etcdctl alarm disarm
$ etcdctl endpoint status -w table    # DB SIZE now e.g. 640 MB</pre>
<blockquote>⚠️ Production tip: defrag <strong>blocks</strong> the member (no reads or writes) while it runs — seconds for 1 GB, longer for 8 GB. Never use <code>defrag --cluster</code> on a busy production cluster: defrag members one by one and check health in between. Automate it (e.g. the <code>etcd-defrag</code> tool or a CronJob) when <code>etcd_mvcc_db_total_size_in_bytes</code> is much bigger than <code>etcd_mvcc_db_total_size_in_use_in_bytes</code>.</blockquote>
<p>Compacting only fixes <em>history</em>. If the live data itself is big, find what is big: <code>apiserver_storage_objects</code> (count per resource) and, since 1.28, <code>apiserver_storage_size_bytes</code>. Usual suspects: hundreds of thousands of Events with a long <code>--event-ttl</code>, Helm release Secrets (each up to ~1 MB, ×history), an operator writing huge CR status, or a runaway controller creating objects in a loop.</p>`,
        he: `<p>מכיוון ש-etcd שומר revisions ישנים, הדאטהבייס שלו (bbolt) רק גדל עד שההיסטוריה עוברת <strong>compaction</strong>. ה-kube-apiserver עושה compaction אוטומטית כל 5 דקות (<code>--etcd-compaction-interval=5m</code>) וזורק revisions ישנים מזה. אבל compaction רק מסמן דפים כפנויים <em>בתוך</em> הקובץ — הקובץ על הדיסק נשאר באותו גודל. <strong>Defragmentation</strong> משכתב את הקובץ ומחזיר את המקום ל-filesystem.</p>
<p>הגבול <code>--quota-backend-bytes</code> הוא כברירת מחדל <strong>2 GiB</strong>; התיעוד של etcd ממליץ על מקסימום <strong>8 GiB</strong> (שירותים מנוהלים כמו EKS רצים עם 8 GiB). כשקובץ ה-DB עובר את ה-quota, ‏etcd מרים alarm של <code>NOSPACE</code> לכל הקלאסטר ועובר למצב של <strong>קריאה ומחיקה בלבד</strong>: כל create/update נכשל עם <code>etcdserver: mvcc: database space exceeded</code>. Pods שרצים ממשיכים לרוץ, אבל אי אפשר לעשות deploy, ‏scale, ואפילו לא לעדכן status.</p>
<pre>$ export ETCDCTL_API=3 ETCDCTL_ENDPOINTS=https://10.0.0.5:2379,https://10.0.0.6:2379,https://10.0.0.7:2379 \
    ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.crt \
    ETCDCTL_CERT=/etc/kubernetes/pki/etcd/server.crt ETCDCTL_KEY=/etc/kubernetes/pki/etcd/server.key

$ etcdctl endpoint status -w table
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
|        ENDPOINT         |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM | RAFT INDEX |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
| https://10.0.0.5:2379   | 8e9e05c52164694d |  3.5.16 |  2.1 GB |      true |        14 |   98712345 |
| https://10.0.0.6:2379   | 91bc3c398fb3c146 |  3.5.16 |  2.1 GB |     false |        14 |   98712345 |
| https://10.0.0.7:2379   | fd422379fda50e48 |  3.5.16 |  2.1 GB |     false |        14 |   98712345 |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
$ etcdctl alarm list
memberID:10276657743932975437 alarm:NOSPACE

# recovery: compact to the current revision, defrag each member, disarm
$ rev=$(etcdctl endpoint status --write-out=json | grep -o '"revision":[0-9]*' | head -1 | cut -d: -f2)
$ etcdctl compact "$rev"
$ etcdctl --endpoints=https://10.0.0.6:2379 defrag      # one member at a time, followers first
$ etcdctl --endpoints=https://10.0.0.7:2379 defrag
$ etcdctl --endpoints=https://10.0.0.5:2379 defrag      # leader last
$ etcdctl alarm disarm
$ etcdctl endpoint status -w table    # DB SIZE now e.g. 640 MB</pre>
<blockquote>⚠️ Production tip: ‏defrag <strong>חוסם</strong> את ה-member (בלי קריאות וכתיבות) בזמן שהוא רץ — שניות ל-1 GB, יותר ל-8 GB. אף פעם אל תריץ <code>defrag --cluster</code> על קלאסטר production עמוס: תעשה defrag ל-members אחד אחד ותבדוק health ביניהם. תעשה לזה אוטומציה (למשל הכלי <code>etcd-defrag</code> או CronJob) כש-<code>etcd_mvcc_db_total_size_in_bytes</code> גדול בהרבה מ-<code>etcd_mvcc_db_total_size_in_use_in_bytes</code>.</blockquote>
<p>Compaction מתקן רק <em>היסטוריה</em>. אם המידע החי עצמו גדול, תמצא מה גדול: <code>apiserver_storage_objects</code> (כמות לכל resource) ומגרסה 1.28 גם <code>apiserver_storage_size_bytes</code>. החשודים הרגילים: מאות אלפי Events עם <code>--event-ttl</code> ארוך, ‏Secrets של Helm releases (כל אחד עד ~1 MB, כפול ההיסטוריה), operator שכותב status ענק ל-CR, או controller שיצא משליטה ויוצר אובייקטים בלולאה.</p>`
      }
    },
    {
      h: { en: "Backup and restore with snapshots", he: "גיבוי ושחזור עם snapshots" },
      body: {
        en: `<p>An etcd snapshot is a consistent point-in-time copy of the whole keyspace, taken from one healthy member over the network. It is the only backup that restores the cluster's <em>control-plane state</em> exactly (Velero backs up objects through the API, which is complementary — good for namespaces and PVs, not for rebuilding a dead control plane).</p>
<pre># backup (cron every 30-60 min, ship off-host to S3 with Object Lock)
$ etcdctl --endpoints=https://10.0.0.5:2379 snapshot save /backup/etcd-$(date +%F-%H%M).db
Snapshot saved at /backup/etcd-2026-11-14-0300.db
$ etcdutl snapshot status /backup/etcd-2026-11-14-0300.db -w table
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| 3e5a1c2f | 98712345 |      48211 |     640 MB |
+----------+----------+------------+------------+

# restore (disaster: quorum lost / data corrupted) - on EVERY member, from the SAME file
$ systemctl stop kubelet        # static pods: move manifests out of /etc/kubernetes/manifests
$ etcdutl snapshot restore /backup/etcd-2026-11-14-0300.db \
    --name m1 --data-dir /var/lib/etcd-restored \
    --initial-cluster m1=https://10.0.0.5:2380,m2=https://10.0.0.6:2380,m3=https://10.0.0.7:2380 \
    --initial-cluster-token etcd-restore-20261114 \
    --initial-advertise-peer-urls https://10.0.0.5:2380
# point etcd at the new data dir, start all members, then API servers, then restart
# controllers/kubelets so they drop caches with now-"future" resourceVersions</pre>
<p><code>etcdctl snapshot restore</code> was deprecated in 3.5 and removed in 3.6 in favour of <code>etcdutl</code> (an offline tool that works on files, no server needed). Restoring creates a <strong>new cluster</strong> (new cluster ID): you cannot restore one member into a running cluster — to replace a single dead member use <code>etcdctl member remove</code> + <code>member add</code> and let it sync.</p>
<blockquote>⚠️ Production tip: a snapshot contains every Secret in the cluster (base64, or encrypted only if you enabled KMS encryption at rest). Treat backup files as crown jewels: encrypt them, restrict the bucket, and test a restore into a scratch cluster quarterly — the restore path, with its certificate and flag details, is where teams fail at 03:00.</blockquote>`,
        he: `<p>Snapshot של etcd הוא עותק עקבי של כל ה-keyspace בנקודת זמן, שנלקח מ-member בריא אחד דרך הרשת. זה הגיבוי היחיד שמשחזר את <em>ה-state של ה-control plane</em> בדיוק (Velero מגבה אובייקטים דרך ה-API, וזה משלים — טוב ל-namespaces ול-PVs, לא לבנייה מחדש של control plane מת).</p>
<pre># backup (cron every 30-60 min, ship off-host to S3 with Object Lock)
$ etcdctl --endpoints=https://10.0.0.5:2379 snapshot save /backup/etcd-$(date +%F-%H%M).db
Snapshot saved at /backup/etcd-2026-11-14-0300.db
$ etcdutl snapshot status /backup/etcd-2026-11-14-0300.db -w table
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| 3e5a1c2f | 98712345 |      48211 |     640 MB |
+----------+----------+------------+------------+

# restore (disaster: quorum lost / data corrupted) - on EVERY member, from the SAME file
$ systemctl stop kubelet        # static pods: move manifests out of /etc/kubernetes/manifests
$ etcdutl snapshot restore /backup/etcd-2026-11-14-0300.db \
    --name m1 --data-dir /var/lib/etcd-restored \
    --initial-cluster m1=https://10.0.0.5:2380,m2=https://10.0.0.6:2380,m3=https://10.0.0.7:2380 \
    --initial-cluster-token etcd-restore-20261114 \
    --initial-advertise-peer-urls https://10.0.0.5:2380
# point etcd at the new data dir, start all members, then API servers, then restart
# controllers/kubelets so they drop caches with now-"future" resourceVersions</pre>
<p>‏<code>etcdctl snapshot restore</code> סומן deprecated בגרסה 3.5 והוסר ב-3.6 לטובת <code>etcdutl</code> (כלי offline שעובד על קבצים, בלי שרת). שחזור יוצר <strong>קלאסטר חדש</strong> (cluster ID חדש): אי אפשר לשחזר member אחד לתוך קלאסטר שרץ — כדי להחליף member בודד שמת משתמשים ב-<code>etcdctl member remove</code> ואז <code>member add</code>, ונותנים לו להסתנכרן.</p>
<blockquote>⚠️ Production tip: snapshot מכיל כל Secret בקלאסטר (ב-base64, או מוצפן רק אם הפעלת KMS encryption at rest). תתייחס לקבצי הגיבוי כאל תכשיטי הכתר: תצפין אותם, תגביל את ה-bucket, ותבדוק שחזור לקלאסטר זמני פעם ברבעון — מסלול השחזור, עם כל הפרטים של ה-certificates וה-flags, הוא המקום שבו צוותים נכשלים ב-03:00.</blockquote>`
      }
    },
    {
      h: { en: "The metrics that matter", he: "המטריקות שחשובות" },
      body: {
        en: `<table>
<tr><th>Metric</th><th>Healthy</th><th>Alert when</th></tr>
<tr><td><code>etcd_server_has_leader</code></td><td>1</td><td>0 for &gt; 1 min (no quorum: writes impossible)</td></tr>
<tr><td><code>increase(etcd_server_leader_changes_seen_total[1h])</code></td><td>0</td><td>&gt; 3 per hour (disk or network trouble)</td></tr>
<tr><td><code>histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket[5m]))</code></td><td>&lt; 10 ms</td><td>&gt; 10 ms sustained</td></tr>
<tr><td><code>histogram_quantile(0.99, rate(etcd_disk_backend_commit_duration_seconds_bucket[5m]))</code></td><td>&lt; 25 ms</td><td>&gt; 25 ms sustained</td></tr>
<tr><td><code>etcd_mvcc_db_total_size_in_bytes / etcd_server_quota_backend_bytes</code></td><td>&lt; 50%</td><td>&gt; 80% (page before NOSPACE)</td></tr>
<tr><td><code>etcd_network_peer_round_trip_time_seconds</code> p99</td><td>&lt; 50 ms</td><td>rising: cross-AZ network trouble</td></tr>
<tr><td><code>rate(etcd_server_proposals_failed_total[5m])</code></td><td>0</td><td>&gt; 0 (leader elections, lost quorum)</td></tr>
</table>
<pre># PrometheusRule snippet
- alert: EtcdDatabaseQuotaLowSpace
  expr: (etcd_mvcc_db_total_size_in_bytes / etcd_server_quota_backend_bytes) * 100 &gt; 80
  for: 10m
  labels: { severity: critical }
  annotations:
    summary: "etcd {{ $labels.instance }} DB is {{ $value | humanize }}% of quota - compact/defrag before NOSPACE"</pre>
<blockquote>💡 Real world: from the API server side, watch <code>apiserver_request_duration_seconds</code> by verb and <code>apiserver_storage_objects</code>. A sudden jump in, say, <code>events</code> or a CRD from 20k to 400k objects explains a growing DB long before the quota alarm.</blockquote>`,
        he: `<table>
<tr><th>Metric</th><th>תקין</th><th>להתריע כש</th></tr>
<tr><td><code>etcd_server_has_leader</code></td><td>1</td><td>0 ליותר מדקה (אין quorum: אי אפשר לכתוב)</td></tr>
<tr><td><code>increase(etcd_server_leader_changes_seen_total[1h])</code></td><td>0</td><td>יותר מ-3 בשעה (בעיית דיסק או רשת)</td></tr>
<tr><td><code>histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket[5m]))</code></td><td>מתחת ל-10 ms</td><td>מעל 10 ms לאורך זמן</td></tr>
<tr><td><code>histogram_quantile(0.99, rate(etcd_disk_backend_commit_duration_seconds_bucket[5m]))</code></td><td>מתחת ל-25 ms</td><td>מעל 25 ms לאורך זמן</td></tr>
<tr><td><code>etcd_mvcc_db_total_size_in_bytes / etcd_server_quota_backend_bytes</code></td><td>מתחת ל-50%</td><td>מעל 80% (להעיר מישהו לפני NOSPACE)</td></tr>
<tr><td><code>etcd_network_peer_round_trip_time_seconds</code> ב-p99</td><td>מתחת ל-50 ms</td><td>עולה: בעיית רשת בין AZ-ים</td></tr>
<tr><td><code>rate(etcd_server_proposals_failed_total[5m])</code></td><td>0</td><td>מעל 0 (leader elections, איבוד quorum)</td></tr>
</table>
<pre># PrometheusRule snippet
- alert: EtcdDatabaseQuotaLowSpace
  expr: (etcd_mvcc_db_total_size_in_bytes / etcd_server_quota_backend_bytes) * 100 &gt; 80
  for: 10m
  labels: { severity: critical }
  annotations:
    summary: "etcd {{ $labels.instance }} DB is {{ $value | humanize }}% of quota - compact/defrag before NOSPACE"</pre>
<blockquote>💡 Real world: מהצד של ה-API server, תסתכל על <code>apiserver_request_duration_seconds</code> לפי verb ועל <code>apiserver_storage_objects</code>. קפיצה פתאומית, נניח ב-<code>events</code> או ב-CRD מסוים מ-20k ל-400k אובייקטים, מסבירה DB שגדל הרבה לפני ה-alarm של ה-quota.</blockquote>`
      }
    },
    {
      h: { en: "API Priority and Fairness: queueing instead of collapse", he: "API Priority and Fairness: ‏queueing במקום קריסה" },
      body: {
        en: `<p>The API server has a fixed concurrency budget: <code>--max-requests-inflight</code> (400) + <code>--max-mutating-requests-inflight</code> (200) = 600 <em>seats</em> by default. Before APF, one controller in a tight loop could eat all of them and starve kubelets and leader election — and when leader-election renewals fail, controller-managers restart and pile on more load. <strong>API Priority and Fairness</strong> (GA in 1.29, <code>flowcontrol.apiserver.k8s.io/v1</code>) fixes that:</p>
<ul>
<li>Each request is classified by the first matching <strong>FlowSchema</strong> (lowest <code>matchingPrecedence</code> wins) by user/group/ServiceAccount, verb and resource.</li>
<li>The FlowSchema points to a <strong>PriorityLevelConfiguration</strong>, which gets a share of the 600 seats (<code>nominalConcurrencyShares</code>) and may lend/borrow unused seats.</li>
<li>Inside a priority level, requests are split into <strong>flows</strong> (by user or namespace) and queued with <em>shuffle sharding</em> + fair queuing, so one noisy user only fills its own queues.</li>
<li>When queues are full, the request is rejected with <strong>HTTP 429</strong> and <code>Retry-After</code>; client-go retries with backoff.</li>
</ul>
<p>Built-in levels: <code>exempt</code> (system:masters, never queued), <code>system</code> (nodes), <code>node-high</code>, <code>leader-election</code>, <code>workload-high</code> (controllers in kube-controller-manager), <code>workload-low</code> (all other ServiceAccounts), <code>global-default</code> (humans and everything else), <code>catch-all</code>. LIST requests cost more seats, estimated from object count.</p>
<pre># fence a noisy backup tool into its own small lane
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: PriorityLevelConfiguration
metadata:
  name: bulk-readers
spec:
  type: Limited
  limited:
    nominalConcurrencyShares: 10
    lendablePercent: 0
    limitResponse:
      type: Queue
      queuing: { queues: 16, handSize: 4, queueLengthLimit: 50 }
---
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: FlowSchema
metadata:
  name: velero-bulk
spec:
  priorityLevelConfiguration: { name: bulk-readers }
  matchingPrecedence: 900
  distinguisherMethod: { type: ByUser }
  rules:
  - subjects:
    - kind: ServiceAccount
      serviceAccount: { name: velero, namespace: velero }
    resourceRules:
    - verbs: ["get", "list", "watch"]
      apiGroups: ["*"]
      resources: ["*"]
      clusterScope: true
      namespaces: ["*"]</pre>
<pre>$ kubectl get flowschemas
NAME                 PRIORITYLEVEL     MATCHINGPRECEDENCE   DISTINGUISHERMETHOD
exempt               exempt            1                    &lt;none&gt;
system-leader-election leader-election 100                  ByUser
velero-bulk          bulk-readers      900                  ByUser
...
$ kubectl get --raw /metrics | grep apiserver_flowcontrol_rejected_requests_total
apiserver_flowcontrol_rejected_requests_total{flow_schema="velero-bulk",priority_level="bulk-readers",reason="queue-full"} 312
$ kubectl get --raw /debug/api_priority_and_fairness/dump_priority_levels</pre>
<p>Key metrics: <code>apiserver_flowcontrol_rejected_requests_total</code> (429s by reason: queue-full, time-out, concurrency-limit), <code>apiserver_flowcontrol_current_inqueue_requests</code>, <code>apiserver_flowcontrol_request_wait_duration_seconds</code>. Every response carries <code>X-Kubernetes-PF-FlowSchema-UID</code> / <code>X-Kubernetes-PF-PriorityLevel-UID</code> headers so you can see which lane a request used (<code>kubectl get pods -v=8</code>).</p>`,
        he: `<p>ל-API server יש תקציב concurrency קבוע: <code>--max-requests-inflight</code> ‏(400) ועוד <code>--max-mutating-requests-inflight</code> ‏(200) = 600 <em>seats</em> כברירת מחדל. לפני APF, ‏controller אחד בלולאה צפופה יכול היה לאכול את כולם ולהרעיב את ה-kubelets ואת ה-leader election — וכשחידושי ה-leader election נכשלים, ה-controller-managers עושים restart ומוסיפים עוד עומס. <strong>API Priority and Fairness</strong> (GA ב-1.29, ‏<code>flowcontrol.apiserver.k8s.io/v1</code>) פותר את זה:</p>
<ul>
<li>כל בקשה מסווגת לפי ה-<strong>FlowSchema</strong> הראשון שמתאים (ה-<code>matchingPrecedence</code> הנמוך מנצח) לפי user/group/ServiceAccount, ‏verb ו-resource.</li>
<li>ה-FlowSchema מצביע על <strong>PriorityLevelConfiguration</strong>, שמקבל נתח מ-600 ה-seats ‏(<code>nominalConcurrencyShares</code>) ויכול להשאיל או ללוות seats שלא בשימוש.</li>
<li>בתוך priority level, הבקשות מתחלקות ל-<strong>flows</strong> (לפי user או namespace) ונכנסות לתורים עם <em>shuffle sharding</em> ו-fair queuing, כך שמשתמש רועש אחד ממלא רק את התורים שלו.</li>
<li>כשהתורים מלאים, הבקשה נדחית עם <strong>HTTP 429</strong> ו-<code>Retry-After</code>; ‏client-go עושה retry עם backoff.</li>
</ul>
<p>הרמות המובנות: <code>exempt</code> ‏(system:masters, אף פעם לא בתור), <code>system</code> ‏(nodes), <code>node-high</code>, <code>leader-election</code>, <code>workload-high</code> (ה-controllers ב-kube-controller-manager), <code>workload-low</code> (כל שאר ה-ServiceAccounts), <code>global-default</code> (בני אדם וכל השאר), <code>catch-all</code>. בקשות LIST עולות יותר seats, לפי הערכה של כמות האובייקטים.</p>
<pre># fence a noisy backup tool into its own small lane
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: PriorityLevelConfiguration
metadata:
  name: bulk-readers
spec:
  type: Limited
  limited:
    nominalConcurrencyShares: 10
    lendablePercent: 0
    limitResponse:
      type: Queue
      queuing: { queues: 16, handSize: 4, queueLengthLimit: 50 }
---
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: FlowSchema
metadata:
  name: velero-bulk
spec:
  priorityLevelConfiguration: { name: bulk-readers }
  matchingPrecedence: 900
  distinguisherMethod: { type: ByUser }
  rules:
  - subjects:
    - kind: ServiceAccount
      serviceAccount: { name: velero, namespace: velero }
    resourceRules:
    - verbs: ["get", "list", "watch"]
      apiGroups: ["*"]
      resources: ["*"]
      clusterScope: true
      namespaces: ["*"]</pre>
<pre>$ kubectl get flowschemas
NAME                 PRIORITYLEVEL     MATCHINGPRECEDENCE   DISTINGUISHERMETHOD
exempt               exempt            1                    &lt;none&gt;
system-leader-election leader-election 100                  ByUser
velero-bulk          bulk-readers      900                  ByUser
...
$ kubectl get --raw /metrics | grep apiserver_flowcontrol_rejected_requests_total
apiserver_flowcontrol_rejected_requests_total{flow_schema="velero-bulk",priority_level="bulk-readers",reason="queue-full"} 312
$ kubectl get --raw /debug/api_priority_and_fairness/dump_priority_levels</pre>
<p>מטריקות מפתח: <code>apiserver_flowcontrol_rejected_requests_total</code> (ה-429-ים לפי סיבה: queue-full, ‏time-out, ‏concurrency-limit), <code>apiserver_flowcontrol_current_inqueue_requests</code>, <code>apiserver_flowcontrol_request_wait_duration_seconds</code>. כל תשובה מגיעה עם headers של <code>X-Kubernetes-PF-FlowSchema-UID</code> / <code>X-Kubernetes-PF-PriorityLevel-UID</code>, כך שאפשר לראות באיזה נתיב בקשה עברה (<code>kubectl get pods -v=8</code>).</p>`
      }
    },
    {
      h: { en: "LIST storms, the watch cache, and managed vs self-managed", he: "LIST storms, ה-watch cache, ומנוהל מול self-managed" },
      body: {
        en: `<p>The API server keeps a <strong>watch cache</strong> per resource in memory. Watches and LISTs with <code>resourceVersion=0</code> (or <code>resourceVersionMatch=NotOlderThan</code>) are served from it cheaply. A plain LIST with no resourceVersion is a <em>consistent read</em>: historically it went straight to etcd, which then had to read, decode and ship every object. (Since 1.31, consistent reads can be served from the cache after a quick revision check — <code>ConsistentListFromCache</code> — which helps a lot, but large LISTs still cost API server memory and CPU to serialize.)</p>
<p>Classic overloads:</p>
<ul>
<li><strong>DaemonSet agents listing cluster-wide:</strong> 1,000 nodes × an agent that LISTs all Pods on start = a storm on every rollout. Fix: informers with a <code>fieldSelector=spec.nodeName=$NODE</code>, staggered restarts.</li>
<li><strong>Operators without informers:</strong> code that polls <code>client.List()</code> every few seconds instead of watching. Fix: shared informers / controller-runtime cache, and paginate (<code>limit=500</code> + <code>continue</code>).</li>
<li><strong>Thundering reconnect:</strong> API server restart → every watcher re-LISTs at once. Fix: client-go's jittered backoff, and APF lanes so kubelets and leader election still get through.</li>
<li><strong>Write amplification:</strong> a controller updating <code>status</code> every reconcile even when nothing changed — every write is a new etcd revision and a watch event to every watcher.</li>
</ul>
<pre># who is hammering the API server? (audit logs or metrics)
$ kubectl get --raw /metrics | grep 'apiserver_request_total{.*verb="LIST"' | sort -t' ' -k2 -nr | head
# with audit logs in a log tool: group by user.username, verb, objectRef.resource; count over 5 min</pre>
<table>
<tr><th></th><th>Managed (EKS, GKE, AKS)</th><th>Self-managed (kubeadm, kops, on-prem)</th></tr>
<tr><td>etcd disks, sizing, quorum</td><td>Provider's job</td><td>Yours</td></tr>
<tr><td>Compaction/defrag, NOSPACE</td><td>Provider defrags; you still can fill it with objects (EKS quota 8 GiB)</td><td>Yours: alarms, runbook</td></tr>
<tr><td>etcd snapshots</td><td>Not accessible: back up objects with Velero/GitOps</td><td>Yours: cron + off-site + tested restore</td></tr>
<tr><td>APF tuning</td><td>You can add FlowSchemas; provider may protect its own</td><td>Full control</td></tr>
<tr><td>Visibility</td><td><code>apiserver_storage_size_bytes</code>, control-plane metrics (varies by provider)</td><td>All etcd metrics</td></tr>
</table>
<blockquote>⚠️ Production tip: "managed" does not mean "unbreakable". You can still take down a managed control plane with a runaway controller creating 500k objects or a LIST storm; you just can't defrag your way out of it yourself. The protections — object quotas (<code>ResourceQuota</code> on <code>count/configmaps</code> etc.), APF lanes, informer-based tooling — are your job either way.</blockquote>`,
        he: `<p>ה-API server מחזיק <strong>watch cache</strong> לכל resource בזיכרון. Watches ו-LISTs עם <code>resourceVersion=0</code> (או <code>resourceVersionMatch=NotOlderThan</code>) נענים ממנו בזול. LIST רגיל בלי resourceVersion הוא <em>consistent read</em>: היסטורית הוא הלך ישר ל-etcd, שהיה צריך לקרוא, לפענח ולשלוח כל אובייקט. (מגרסה 1.31, אפשר לענות על consistent reads מה-cache אחרי בדיקת revision מהירה — <code>ConsistentListFromCache</code> — וזה עוזר מאוד, אבל LISTs גדולים עדיין עולים זיכרון ו-CPU של ה-API server על serialization.)</p>
<p>העומסים הקלאסיים:</p>
<ul>
<li><strong>DaemonSet agents שעושים LIST על כל הקלאסטר:</strong> 1,000 nodes כפול agent שעושה LIST לכל ה-Pods בעלייה = סערה בכל rollout. הפתרון: informers עם <code>fieldSelector=spec.nodeName=$NODE</code>, ו-restarts מדורגים.</li>
<li><strong>Operators בלי informers:</strong> קוד שעושה polling עם <code>client.List()</code> כל כמה שניות במקום watch. הפתרון: shared informers או ה-cache של controller-runtime, ו-pagination ‏(<code>limit=500</code> + <code>continue</code>).</li>
<li><strong>Reconnect המוני:</strong> restart ל-API server ← כל ה-watchers עושים re-LIST בבת אחת. הפתרון: ה-backoff עם jitter של client-go, ונתיבי APF כדי ש-kubelets ו-leader election עדיין יעברו.</li>
<li><strong>Write amplification:</strong> controller שמעדכן <code>status</code> בכל reconcile גם כשכלום לא השתנה — כל כתיבה היא revision חדש ב-etcd ו-watch event לכל watcher.</li>
</ul>
<pre># who is hammering the API server? (audit logs or metrics)
$ kubectl get --raw /metrics | grep 'apiserver_request_total{.*verb="LIST"' | sort -t' ' -k2 -nr | head
# with audit logs in a log tool: group by user.username, verb, objectRef.resource; count over 5 min</pre>
<table>
<tr><th></th><th>מנוהל (EKS, ‏GKE, ‏AKS)</th><th>Self-managed (kubeadm, ‏kops, ‏on-prem)</th></tr>
<tr><td>דיסקים, sizing ו-quorum של etcd</td><td>האחריות של הספק</td><td>שלך</td></tr>
<tr><td>Compaction/defrag, ‏NOSPACE</td><td>הספק עושה defrag; עדיין אפשר למלא אותו באובייקטים (ב-EKS ה-quota הוא 8 GiB)</td><td>שלך: alarms ו-runbook</td></tr>
<tr><td>Snapshots של etcd</td><td>אין גישה: מגבים אובייקטים עם Velero או GitOps</td><td>שלך: cron, עותק off-site ושחזור שנבדק</td></tr>
<tr><td>כיוונון APF</td><td>אפשר להוסיף FlowSchemas; הספק עשוי להגן על שלו</td><td>שליטה מלאה</td></tr>
<tr><td>נראות</td><td><code>apiserver_storage_size_bytes</code>, מטריקות control plane (משתנה בין ספקים)</td><td>כל המטריקות של etcd</td></tr>
</table>
<blockquote>⚠️ Production tip: "מנוהל" לא אומר "בלתי שביר". עדיין אפשר להפיל control plane מנוהל עם controller שיצא משליטה ויצר 500k אובייקטים או עם LIST storm; פשוט אי אפשר לעשות לבד defrag כדי לצאת מזה. ההגנות — quotas על אובייקטים (<code>ResourceQuota</code> על <code>count/configmaps</code> וכו'), נתיבי APF, כלים מבוססי informers — הן באחריותך בכל מקרה.</blockquote>`
      }
    }
  ],
  diagram: "kubectl / controllers / kubelets\n        |  HTTP\n        v\n  kube-apiserver --[APF: FlowSchema -> PriorityLevel -> fair queues | 429]--\n        |  watch cache (serves watches, RV=0 lists)\n        v  gRPC (only the API server talks to etcd)\n  etcd m1 (leader) <--raft--> etcd m2 <--raft--> etcd m3\n  WAL fsync p99 < 10ms | DB < quota (2-8 GiB) | compact 5m + defrag | snapshot -> S3",
  handsOn: [
    { cmd: "etcdctl endpoint status -w table && etcdctl endpoint health --cluster", what: { en: "DB size, leader, raft term per member; health of all members (needs the ETCDCTL_* cert env vars).", he: "גודל ה-DB, ה-leader וה-raft term לכל member; ה-health של כל ה-members (צריך את משתני ה-ETCDCTL_* של ה-certificates)." } },
    { cmd: "etcdctl alarm list", what: { en: "Empty output = fine. 'alarm:NOSPACE' = the cluster is read/delete-only.", he: "פלט ריק = תקין. 'alarm:NOSPACE' = הקלאסטר במצב קריאה ומחיקה בלבד." } },
    { cmd: "etcdctl snapshot save /tmp/etcd.db && etcdutl snapshot status /tmp/etcd.db -w table", what: { en: "Take and verify a snapshot: revision, key count, size.", he: "לקחת snapshot ולאמת אותו: revision, כמות keys וגודל." } },
    { cmd: "kubectl get --raw /metrics | grep -E 'apiserver_storage_objects|apiserver_flowcontrol_rejected_requests_total' | sort -k2 -nr | head -20", what: { en: "Which resources fill etcd, and which flow schemas are getting 429s.", he: "אילו resources ממלאים את etcd, ואילו flow schemas מקבלים 429." } },
    { cmd: "kubectl get flowschemas,prioritylevelconfigurations", what: { en: "See the APF lanes your cluster ships with and their precedence.", he: "לראות את נתיבי ה-APF שמגיעים עם הקלאסטר ואת סדר העדיפויות שלהם." } }
  ],
  mnemonic: {
    en: "Fast disk, odd count, small DB: compact the history, defrag the file, snapshot the lot — and give the noisy neighbour its own queue.",
    he: "דיסק מהיר, מספר אי-זוגי, DB קטן: ‏compact להיסטוריה, ‏defrag לקובץ, snapshot להכול — ולשכן הרועש תן תור משלו."
  },
  pitfalls: [
    { en: "Running `etcdctl defrag --cluster` on busy production: every member blocks at once and the API server times out. Defrag one member at a time, leader last.", he: "להריץ `etcdctl defrag --cluster` על production עמוס: כל ה-members נחסמים בבת אחת וה-API server עושה timeout. תעשה defrag ל-member אחד בכל פעם, ה-leader אחרון." },
    { en: "Raising --quota-backend-bytes to 50 GB to 'fix' NOSPACE. Large DBs make snapshots, restarts, defrags and new-member syncs painfully slow; fix what is filling it.", he: "להעלות את --quota-backend-bytes ל-50 GB כדי 'לתקן' NOSPACE. ‏DB גדול הופך snapshots, ‏restarts, ‏defrags וסנכרון של members חדשים לאיטיים בטירוף; תתקן את מה שממלא אותו." },
    { en: "Running 2 or 4 etcd members 'for redundancy': an even count adds failure points without adding tolerance.", he: "להריץ 2 או 4 members של etcd 'בשביל יתירות': מספר זוגי מוסיף נקודות כשל בלי להוסיף עמידות." },
    { en: "Never testing restore: snapshot files exist but nobody knows the etcdutl flags, cert paths, or that every member must restore from the same file.", he: "לא לבדוק אף פעם שחזור: קבצי ה-snapshot קיימים, אבל אף אחד לא מכיר את ה-flags של etcdutl, את הנתיבים של ה-certificates, או את זה שכל member חייב לשחזר מאותו קובץ." }
  ],
  interview: [
    {
      q: { en: "kubectl apply fails with 'etcdserver: mvcc: database space exceeded'. Walk me through the fix.", he: "kubectl apply נכשל עם 'etcdserver: mvcc: database space exceeded'. תעביר אותי דרך התיקון." },
      a: {
        en: "etcd hit its backend quota and raised NOSPACE, so it only accepts reads and deletes. Confirm with `etcdctl endpoint status` and `alarm list`. Get the current revision and `etcdctl compact` it to drop history, then `defrag` each member one at a time (followers first) to return space, then `etcdctl alarm disarm`. Afterwards find the root cause via apiserver_storage_objects — events, Helm secrets, a runaway CRD — fix it, and add an alert at 80% of quota.",
        he: "etcd הגיע ל-quota של ה-backend והרים NOSPACE, אז הוא מקבל רק קריאות ומחיקות. מאמתים עם `etcdctl endpoint status` ו-`alarm list`. לוקחים את ה-revision הנוכחי ומריצים `etcdctl compact` כדי לזרוק היסטוריה, ואז `defrag` לכל member אחד אחד (followers קודם) כדי להחזיר מקום, ואז `etcdctl alarm disarm`. אחר כך מוצאים את ה-root cause דרך apiserver_storage_objects — events, ‏secrets של Helm, ‏CRD שיצא משליטה — מתקנים, ומוסיפים התראה ב-80% מה-quota."
      }
    },
    {
      q: { en: "Why does Kubernetes need API Priority and Fairness if it already has max-requests-inflight?", he: "למה Kubernetes צריך API Priority and Fairness אם כבר יש max-requests-inflight?" },
      a: {
        en: "max-requests-inflight is one global bucket: whoever grabs seats first wins, so a single runaway client can starve kubelet heartbeats and leader election, causing cascading restarts. APF splits the same budget into priority levels with guaranteed shares, and inside each level does fair queuing across flows with shuffle sharding. A noisy controller fills its own queues and gets 429s while system traffic keeps flowing.",
        he: "max-requests-inflight הוא דלי גלובלי אחד: מי שתופס seats ראשון מנצח, כך ש-client אחד שיצא משליטה יכול להרעיב את ה-heartbeats של ה-kubelets ואת ה-leader election, ולגרום ל-restarts בשרשרת. APF מחלק את אותו תקציב ל-priority levels עם נתחים מובטחים, ובתוך כל level עושה fair queuing בין flows עם shuffle sharding. controller רועש ממלא את התורים שלו ומקבל 429, בזמן שתעבורת המערכת ממשיכה לזרום."
      }
    }
  ],
  quiz: [
    {
      q: { en: "What is the default etcd backend quota, and what happens when it is exceeded?", he: "מה ה-quota ברירת המחדל של ה-backend של etcd, ומה קורה כשעוברים אותו?" },
      options: [
        { en: "8 GiB; etcd deletes the oldest keys automatically", he: "8 GiB; ‏etcd מוחק אוטומטית את ה-keys הכי ישנים" },
        { en: "2 GiB; a NOSPACE alarm makes etcd accept only reads and deletes", he: "2 GiB; ‏alarm של NOSPACE גורם ל-etcd לקבל רק קריאות ומחיקות" },
        { en: "2 GiB; etcd crashes and loses quorum", he: "2 GiB; ‏etcd קורס ומאבד quorum" },
        { en: "Unlimited; it grows until the disk is full", he: "בלי הגבלה; הוא גדל עד שהדיסק מתמלא" }
      ],
      answer: 1,
      explain: { en: "--quota-backend-bytes defaults to 2 GiB. Over it, etcd raises a cluster-wide NOSPACE alarm; writes fail with 'mvcc: database space exceeded' until you compact, defrag and disarm.", he: "--quota-backend-bytes הוא 2 GiB כברירת מחדל. מעבר לזה, ‏etcd מרים alarm של NOSPACE לכל הקלאסטר; כתיבות נכשלות עם 'mvcc: database space exceeded' עד שעושים compact, ‏defrag ו-disarm." }
    },
    {
      q: { en: "After `etcdctl compact`, the DB SIZE column hasn't changed. Why?", he: "אחרי `etcdctl compact`, עמודת DB SIZE לא השתנתה. למה?" },
      options: [
        { en: "Compaction failed silently", he: "ה-compaction נכשל בשקט" },
        { en: "Compaction only frees pages inside the file; defrag is needed to shrink it on disk", he: "Compaction רק משחרר דפים בתוך הקובץ; צריך defrag כדי לכווץ אותו על הדיסק" },
        { en: "The API server must be restarted first", he: "צריך קודם לעשות restart ל-API server" },
        { en: "DB SIZE only updates once a day", he: "DB SIZE מתעדכן רק פעם ביום" }
      ],
      answer: 1,
      explain: { en: "bbolt reuses freed pages internally but never shrinks the file. Defrag rewrites it compactly and returns the space — and blocks the member while it runs.", he: "bbolt משתמש מחדש בדפים פנויים בפנים אבל אף פעם לא מכווץ את הקובץ. ‏defrag משכתב אותו בצורה דחוסה ומחזיר את המקום — וחוסם את ה-member בזמן שהוא רץ." }
    },
    {
      q: { en: "Which metric best predicts etcd leader elections caused by storage?", he: "איזו מטריקה הכי טוב חוזה leader elections של etcd שנגרמים מהאחסון?" },
      options: [
        { en: "node_cpu_seconds_total", he: "node_cpu_seconds_total" },
        { en: "etcd_disk_wal_fsync_duration_seconds p99", he: "etcd_disk_wal_fsync_duration_seconds ב-p99" },
        { en: "apiserver_storage_objects", he: "apiserver_storage_objects" },
        { en: "kube_pod_status_ready", he: "kube_pod_status_ready" }
      ],
      answer: 1,
      explain: { en: "Every Raft write waits for a WAL fsync. When fsync p99 goes above ~10 ms, heartbeats and proposals lag, followers time out and call elections.", he: "כל כתיבת Raft מחכה ל-fsync של ה-WAL. כשה-fsync ב-p99 עולה מעל ~10 ms, ה-heartbeats וה-proposals מתעכבים, ה-followers עושים timeout וקוראים לבחירות." }
    },
    {
      q: { en: "A backup tool's ServiceAccount floods the API server with LISTs. What is the cleanest control-plane-side mitigation?", he: "ה-ServiceAccount של כלי גיבוי מציף את ה-API server ב-LISTs. מה הצעד הכי נקי בצד ה-control plane?" },
      options: [
        { en: "Increase --max-requests-inflight to 4000", he: "להעלות את --max-requests-inflight ל-4000" },
        { en: "Add a FlowSchema mapping that ServiceAccount to a small, non-lending PriorityLevelConfiguration", he: "להוסיף FlowSchema שממפה את ה-ServiceAccount הזה ל-PriorityLevelConfiguration קטן שלא משאיל" },
        { en: "Add a NetworkPolicy blocking the backup pod", he: "להוסיף NetworkPolicy שחוסם את ה-pod של הגיבוי" },
        { en: "Add a 5th etcd member", he: "להוסיף member חמישי ל-etcd" }
      ],
      answer: 1,
      explain: { en: "APF lets you fence a specific client into its own lane: it gets queued and 429s, everyone else keeps their share. Raising inflight limits just moves the overload to memory and etcd.", he: "APF מאפשר לגדר client מסוים בנתיב משלו: הוא נכנס לתור ומקבל 429, וכל השאר שומרים על הנתח שלהם. העלאת מגבלות ה-inflight רק מזיזה את העומס לזיכרון ול-etcd." }
    }
  ],
  related: ["k8s-architecture", "staff-consensus-consistency", "k8s-operators-crds", "k8s-cluster-observability", "k8s-day2-upgrades", "k8s-events-audit"]
});

// ---------------------------------------------------------------------------
// 3. AWS IAM Policy Evaluation in Depth
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "cloud-aws-iam-deep",
  track: "cloud",
  order: 81,
  icon: "🔐",
  level: 3,
  minutes: 17,
  title: { en: "AWS IAM Policy Evaluation in Depth", he: "הערכת policies ב-AWS IAM לעומק" },
  tldr: {
    en: "Every AWS request runs through the same pipeline: any explicit Deny ends it; RCPs and SCPs set the org's ceiling; then resource and identity policies grant, while permission boundaries and session policies can only shrink what was granted. Cross-account needs an Allow on both sides. Debug AccessDenied by reading which layer the error names, decoding the authorization message, and simulating — then right-size from CloudTrail.",
    he: "כל בקשה ל-AWS עוברת באותו צינור: כל Deny מפורש סוגר אותה; ‏RCPs ו-SCPs קובעים את התקרה של הארגון; ואז resource ו-identity policies נותנים הרשאה, בזמן ש-permission boundaries ו-session policies יכולים רק לצמצם את מה שניתן. ב-cross-account צריך Allow בשני הצדדים. מדבגים AccessDenied בקריאה של איזו שכבה השגיאה מציינת, פענוח ה-authorization message וסימולציה — ואז מצמצמים לפי CloudTrail."
  },
  analogy: {
    en: "Entering a secure building: the country's border law (SCP) and the building owner's house rules (RCP) cap everyone; the door's own guest list (resource policy) and your employee badge (identity policy) can let you in; your contractor contract (permission boundary) and today's visitor sticker (session policy) can only narrow where you may go. And one 'banned' notice anywhere (explicit deny) beats every badge.",
    he: "כניסה לבניין מאובטח: חוק הגבולות של המדינה (SCP) וכללי הבית של בעל הבניין (RCP) מגבילים את כולם; רשימת האורחים של הדלת עצמה (resource policy) והתג העובד שלך (identity policy) יכולים להכניס אותך; חוזה הקבלן שלך (permission boundary) ומדבקת המבקר של היום (session policy) יכולים רק לצמצם לאן מותר לך ללכת. ושלט 'אסור' אחד בכל מקום (explicit deny) מנצח כל תג."
  },
  sections: [
    {
      h: { en: "The evaluation pipeline", he: "צינור ההערכה" },
      body: {
        en: `<p>For each request AWS builds the <strong>request context</strong> (principal, action, resource, and every condition key: source IP, VPC endpoint, tags, MFA, TLS…), collects every applicable policy, and evaluates in this order:</p>
<ol>
<li><strong>Explicit Deny anywhere</strong> (any policy type) → <strong>Deny</strong>. Final.</li>
<li><strong>RCPs</strong> (Resource Control Policies, Organizations, Nov 2024): max permissions on <em>resources</em> in member accounts (S3, STS, KMS, SQS, Secrets Manager and a growing list). No Allow in the RCP chain → Deny.</li>
<li><strong>SCPs</strong>: max permissions for <em>principals</em> in member accounts. Must allow at every level from root OU down to the account. (They don't apply to the management account or service-linked roles.)</li>
<li><strong>Resource-based policy</strong> (bucket policy, KMS key policy, role trust policy, SQS/SNS/Lambda policy…): may Allow.</li>
<li><strong>Identity-based policy</strong> (attached to the user/role/group): may Allow.</li>
<li><strong>Permission boundary</strong> (if set on the user/role): must also Allow — it filters identity-policy grants.</li>
<li><strong>Session policy</strong> (passed on AssumeRole/federation): must also Allow — it filters the session.</li>
</ol>
<p>Default is <strong>implicit deny</strong>. So the effective permission is roughly:</p>
<pre>allowed = NOT any_explicit_deny
          AND rcp_allows AND scp_allows
          AND (identity_allows OR resource_allows*)
          AND boundary_allows   (if a boundary exists)
          AND session_allows    (if a session policy exists)

* same-account only: a resource policy that names the principal can grant on its own.
  Exceptions: KMS key policies and IAM role trust policies must ALWAYS allow
  explicitly - an identity policy alone is never enough for them.</pre>
<blockquote>💡 Real world: the same-account "OR" is subtle. A bucket policy granting <code>arn:aws:iam::111122223333:role/app</code> works even if the role's identity policy says nothing about S3. But if the role has a permission boundary, a resource policy that names the <em>role ARN</em> is still filtered by the boundary; one that names the specific <em>session ARN</em> isn't. When in doubt, grant on both sides.</blockquote>`,
        he: `<p>לכל בקשה AWS בונה את ה-<strong>request context</strong> (ה-principal, ה-action, ה-resource, וכל condition key: ‏IP מקור, ‏VPC endpoint, ‏tags, ‏MFA, ‏TLS…), אוסף כל policy רלוונטי, ומעריך בסדר הזה:</p>
<ol>
<li><strong>Deny מפורש בכל מקום</strong> (כל סוג policy) ← <strong>Deny</strong>. סופי.</li>
<li><strong>RCPs</strong> ‏(Resource Control Policies, ב-Organizations, מנובמבר 2024): הרשאות מקסימליות על <em>resources</em> בחשבונות החברים (S3, ‏STS, ‏KMS, ‏SQS, ‏Secrets Manager ורשימה שגדלה). אין Allow בשרשרת ה-RCP ← Deny.</li>
<li><strong>SCPs</strong>: הרשאות מקסימליות ל-<em>principals</em> בחשבונות החברים. חייב לאפשר בכל רמה מה-root OU ועד החשבון. (הם לא חלים על ה-management account ועל service-linked roles.)</li>
<li><strong>Resource-based policy</strong> ‏(bucket policy, ‏KMS key policy, ‏trust policy של role, ‏policy של SQS/SNS/Lambda…): יכול לתת Allow.</li>
<li><strong>Identity-based policy</strong> (מחובר ל-user/role/group): יכול לתת Allow.</li>
<li><strong>Permission boundary</strong> (אם מוגדר על ה-user/role): חייב גם הוא לאפשר — הוא מסנן את מה שה-identity policy נתן.</li>
<li><strong>Session policy</strong> (שמועבר ב-AssumeRole או federation): חייב גם הוא לאפשר — הוא מסנן את ה-session.</li>
</ol>
<p>ברירת המחדל היא <strong>implicit deny</strong>. אז ההרשאה האפקטיבית היא בערך:</p>
<pre>allowed = NOT any_explicit_deny
          AND rcp_allows AND scp_allows
          AND (identity_allows OR resource_allows*)
          AND boundary_allows   (if a boundary exists)
          AND session_allows    (if a session policy exists)

* same-account only: a resource policy that names the principal can grant on its own.
  Exceptions: KMS key policies and IAM role trust policies must ALWAYS allow
  explicitly - an identity policy alone is never enough for them.</pre>
<blockquote>💡 Real world: ה-"OR" באותו חשבון הוא עדין. ‏bucket policy שנותן הרשאה ל-<code>arn:aws:iam::111122223333:role/app</code> עובד גם אם ה-identity policy של ה-role לא אומר כלום על S3. אבל אם ל-role יש permission boundary, ‏resource policy שמציין את ה-<em>ARN של ה-role</em> עדיין מסונן על ידי ה-boundary; אחד שמציין את ה-<em>ARN של ה-session</em> הספציפי — לא. בספק, תן הרשאה בשני הצדדים.</blockquote>`
      }
    },
    {
      h: { en: "Cross-account access, roles and trust policies", he: "גישה cross-account, ‏roles ו-trust policies" },
      body: {
        en: `<p>Across accounts the rule is simple: <strong>both sides must Allow</strong>. The caller's account must grant the action in an identity policy (and its SCPs must permit it); the resource's account must grant it in a resource policy (and its RCPs must permit it). For services without resource policies (EC2, RDS APIs…), you cross accounts by <strong>assuming a role</strong> in the target account.</p>
<pre># Trust policy on role "deployer" in account 222222222222 (prod)
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111111111111:role/ci-runner" },
    "Action": ["sts:AssumeRole", "sts:TagSession"],
    "Condition": {
      "StringEquals": { "aws:PrincipalOrgID": "o-a1b2c3d4e5" }
    }
  }]
}
# Identity policy on ci-runner in 111111111111 (both sides!)
{ "Effect": "Allow", "Action": "sts:AssumeRole",
  "Resource": "arn:aws:iam::222222222222:role/deployer" }</pre>
<pre>$ aws sts assume-role --role-arn arn:aws:iam::222222222222:role/deployer \
    --role-session-name gh-run-8812 --duration-seconds 3600
{ "Credentials": { "AccessKeyId": "ASIA...", "SecretAccessKey": "...", "SessionToken": "...",
                   "Expiration": "2026-11-14T11:02:11Z" },
  "AssumedRoleUser": { "Arn": "arn:aws:sts::222222222222:assumed-role/deployer/gh-run-8812" } }
$ aws sts get-caller-identity      # always the first debugging command</pre>
<ul>
<li><strong>Role chaining</strong> (a role session assuming another role) caps the session at <strong>1 hour</strong>, regardless of the role's <code>MaxSessionDuration</code> (up to 12 h). Session tags marked transitive and <code>sts:SourceIdentity</code> survive the chain — useful to know which human is behind <code>assumed-role/deployer</code>.</li>
<li><strong>Third parties</strong> (a SaaS vendor assuming a role into your account) must require <code>sts:ExternalId</code> in the trust policy — that is the classic <em>confused deputy</em> defence. For AWS services acting on your behalf, use <code>aws:SourceArn</code> / <code>aws:SourceAccount</code>.</li>
<li><strong>Never</strong> trust <code>"Principal": {"AWS": "*"}</code> without a strong condition; Access Analyzer will flag it as public.</li>
</ul>
<blockquote>⚠️ Production tip: trusting an account root (<code>arn:aws:iam::111111111111:root</code>) means "any principal in that account <em>whose own identity policy allows it</em>" — not just the root user. It delegates the decision to that account's admins. Name the specific role ARN when you can.</blockquote>`,
        he: `<p>בין חשבונות הכלל פשוט: <strong>שני הצדדים חייבים לאפשר</strong>. החשבון של הקורא חייב לתת את ה-action ב-identity policy (וה-SCPs שלו חייבים להתיר); החשבון של ה-resource חייב לתת אותו ב-resource policy (וה-RCPs שלו חייבים להתיר). לשירותים בלי resource policies ‏(APIs של EC2, ‏RDS…), עוברים בין חשבונות בעזרת <strong>assume role</strong> לחשבון היעד.</p>
<pre># Trust policy on role "deployer" in account 222222222222 (prod)
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111111111111:role/ci-runner" },
    "Action": ["sts:AssumeRole", "sts:TagSession"],
    "Condition": {
      "StringEquals": { "aws:PrincipalOrgID": "o-a1b2c3d4e5" }
    }
  }]
}
# Identity policy on ci-runner in 111111111111 (both sides!)
{ "Effect": "Allow", "Action": "sts:AssumeRole",
  "Resource": "arn:aws:iam::222222222222:role/deployer" }</pre>
<pre>$ aws sts assume-role --role-arn arn:aws:iam::222222222222:role/deployer \
    --role-session-name gh-run-8812 --duration-seconds 3600
{ "Credentials": { "AccessKeyId": "ASIA...", "SecretAccessKey": "...", "SessionToken": "...",
                   "Expiration": "2026-11-14T11:02:11Z" },
  "AssumedRoleUser": { "Arn": "arn:aws:sts::222222222222:assumed-role/deployer/gh-run-8812" } }
$ aws sts get-caller-identity      # always the first debugging command</pre>
<ul>
<li><strong>Role chaining</strong> ‏(session של role שעושה assume ל-role אחר) מגביל את ה-session ל-<strong>שעה אחת</strong>, בלי קשר ל-<code>MaxSessionDuration</code> של ה-role (עד 12 שעות). Session tags שמסומנים כ-transitive ו-<code>sts:SourceIdentity</code> שורדים את השרשרת — שימושי כדי לדעת איזה בן אדם עומד מאחורי <code>assumed-role/deployer</code>.</li>
<li><strong>צד שלישי</strong> (ספק SaaS שעושה assume ל-role בחשבון שלך) חייב לדרוש <code>sts:ExternalId</code> ב-trust policy — זו ההגנה הקלאסית מפני <em>confused deputy</em>. לשירותי AWS שפועלים בשמך, משתמשים ב-<code>aws:SourceArn</code> / <code>aws:SourceAccount</code>.</li>
<li><strong>לעולם</strong> אל תסמוך על <code>"Principal": {"AWS": "*"}</code> בלי condition חזק; ‏Access Analyzer יסמן את זה כציבורי.</li>
</ul>
<blockquote>⚠️ Production tip: לסמוך על ה-root של חשבון (<code>arn:aws:iam::111111111111:root</code>) אומר "כל principal בחשבון הזה <em>שה-identity policy שלו מאפשר את זה</em>" — לא רק ה-root user. זה מעביר את ההחלטה לאדמינים של החשבון ההוא. תציין את ה-ARN של ה-role הספציפי כשאפשר.</blockquote>`
      }
    },
    {
      h: { en: "Conditions: org perimeter, network, TLS and ABAC", he: "Conditions: ‏perimeter ארגוני, רשת, TLS ו-ABAC" },
      body: {
        en: `<p>Conditions are where real security lives. The most useful global keys:</p>
<table>
<tr><th>Key</th><th>Use</th><th>Gotcha</th></tr>
<tr><td><code>aws:PrincipalOrgID</code></td><td>"Only principals from my org" in bucket/KMS/trust policies — a data perimeter in one line</td><td>Doesn't cover AWS service principals: pair with <code>aws:PrincipalIsAWSService</code></td></tr>
<tr><td><code>aws:SourceIp</code></td><td>Restrict to office/NAT IPs</td><td>Calls via a VPC endpoint carry a private IP: use <code>aws:SourceVpce</code> / <code>aws:SourceVpc</code>. Calls made by AWS services on your behalf fail it — add <code>aws:ViaAWSService</code></td></tr>
<tr><td><code>aws:SecureTransport</code></td><td>Deny plain HTTP to S3</td><td>Use a Deny with <code>"Bool": {"aws:SecureTransport": "false"}</code></td></tr>
<tr><td><code>aws:MultiFactorAuthPresent</code></td><td>Require MFA for sensitive actions</td><td>Absent for long-term keys: use <code>BoolIfExists</code> carefully</td></tr>
<tr><td><code>aws:RequestedRegion</code></td><td>Region allow-list in SCPs</td><td>Exempt global services (IAM, CloudFront, Route 53, STS global endpoint)</td></tr>
<tr><td><code>aws:PrincipalTag</code>, <code>aws:ResourceTag</code>, <code>aws:RequestTag</code>, <code>aws:TagKeys</code></td><td>ABAC</td><td>Whoever can change tags can change access: protect tag keys</td></tr>
</table>
<pre># Bucket policy: TLS-only and org-only (Deny statements, so they beat any Allow)
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "DenyInsecureTransport", "Effect": "Deny", "Principal": "*",
      "Action": "s3:*", "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } } },
    { "Sid": "DenyOutsideOrg", "Effect": "Deny", "Principal": "*",
      "Action": "s3:*", "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "StringNotEqualsIfExists": { "aws:PrincipalOrgID": "o-a1b2c3d4e5" },
                     "BoolIfExists": { "aws:PrincipalIsAWSService": "false" } } }
  ]
}</pre>
<p><strong>ABAC</strong> (attribute-based access control) replaces one policy per team with one policy for all teams: access is allowed when the principal's tag matches the resource's tag.</p>
<pre>{ "Effect": "Allow",
  "Action": ["ec2:StartInstances", "ec2:StopInstances", "ec2:RebootInstances"],
  "Resource": "*",
  "Condition": { "StringEquals": { "aws:ResourceTag/team": "\${aws:PrincipalTag/team}" } } }</pre>
<blockquote>💡 Real world: ABAC scales beautifully with IAM Identity Center (team tag comes from the IdP as a session tag), but it only works if teams cannot re-tag resources or themselves. Add a Deny on <code>ec2:CreateTags</code>/<code>DeleteTags</code> for the <code>team</code> key unless <code>aws:RequestTag/team</code> equals the caller's own tag, and deny <code>iam:TagRole</code> broadly.</blockquote>`,
        he: `<p>ב-conditions נמצאת האבטחה האמיתית. ה-keys הגלובליים הכי שימושיים:</p>
<table>
<tr><th>Key</th><th>שימוש</th><th>מלכודת</th></tr>
<tr><td><code>aws:PrincipalOrgID</code></td><td>"רק principals מהארגון שלי" ב-policies של bucket, ‏KMS או trust — ‏data perimeter בשורה אחת</td><td>לא מכסה service principals של AWS: לשלב עם <code>aws:PrincipalIsAWSService</code></td></tr>
<tr><td><code>aws:SourceIp</code></td><td>להגביל ל-IPs של המשרד או ה-NAT</td><td>קריאות דרך VPC endpoint מגיעות עם IP פרטי: להשתמש ב-<code>aws:SourceVpce</code> / <code>aws:SourceVpc</code>. קריאות ששירותי AWS עושים בשמך נכשלות בבדיקה הזו — להוסיף <code>aws:ViaAWSService</code></td></tr>
<tr><td><code>aws:SecureTransport</code></td><td>לחסום HTTP לא מוצפן ל-S3</td><td>להשתמש ב-Deny עם <code>"Bool": {"aws:SecureTransport": "false"}</code></td></tr>
<tr><td><code>aws:MultiFactorAuthPresent</code></td><td>לדרוש MFA לפעולות רגישות</td><td>לא קיים ב-long-term keys: להשתמש ב-<code>BoolIfExists</code> בזהירות</td></tr>
<tr><td><code>aws:RequestedRegion</code></td><td>allow-list של regions ב-SCPs</td><td>להחריג שירותים גלובליים (IAM, ‏CloudFront, ‏Route 53, ה-endpoint הגלובלי של STS)</td></tr>
<tr><td><code>aws:PrincipalTag</code>, <code>aws:ResourceTag</code>, <code>aws:RequestTag</code>, <code>aws:TagKeys</code></td><td>ABAC</td><td>מי שיכול לשנות tags יכול לשנות גישה: להגן על ה-tag keys</td></tr>
</table>
<pre># Bucket policy: TLS-only and org-only (Deny statements, so they beat any Allow)
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "DenyInsecureTransport", "Effect": "Deny", "Principal": "*",
      "Action": "s3:*", "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } } },
    { "Sid": "DenyOutsideOrg", "Effect": "Deny", "Principal": "*",
      "Action": "s3:*", "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "StringNotEqualsIfExists": { "aws:PrincipalOrgID": "o-a1b2c3d4e5" },
                     "BoolIfExists": { "aws:PrincipalIsAWSService": "false" } } }
  ]
}</pre>
<p><strong>ABAC</strong> ‏(attribute-based access control) מחליף policy לכל צוות ב-policy אחד לכל הצוותים: הגישה מותרת כשה-tag של ה-principal תואם ל-tag של ה-resource.</p>
<pre>{ "Effect": "Allow",
  "Action": ["ec2:StartInstances", "ec2:StopInstances", "ec2:RebootInstances"],
  "Resource": "*",
  "Condition": { "StringEquals": { "aws:ResourceTag/team": "\${aws:PrincipalTag/team}" } } }</pre>
<blockquote>💡 Real world: ‏ABAC עובד מעולה בסקייל עם IAM Identity Center (ה-tag של הצוות מגיע מה-IdP כ-session tag), אבל הוא עובד רק אם צוותים לא יכולים לתייג מחדש resources או את עצמם. תוסיף Deny על <code>ec2:CreateTags</code>/<code>DeleteTags</code> ל-key ‏<code>team</code> אלא אם <code>aws:RequestTag/team</code> שווה ל-tag של הקורא עצמו, ותחסום את <code>iam:TagRole</code> באופן רחב.</blockquote>`
      }
    },
    {
      h: { en: "Permission boundaries: delegating IAM safely", he: "Permission boundaries: להאציל IAM בבטחה" },
      body: {
        en: `<p>The problem: developers need to create roles for their Lambdas and pods, but <code>iam:CreateRole</code> + <code>iam:AttachRolePolicy</code> is a path to admin (create a role with <code>AdministratorAccess</code>, assume it). A <strong>permission boundary</strong> is a managed policy set as the <em>maximum</em> a user/role can ever have. You let developers create roles <em>only if</em> they attach your boundary:</p>
<pre># Developer policy: may create/modify roles only with the DevBoundary attached
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "CreateRolesWithBoundary", "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
                 "iam:DetachRolePolicy", "iam:DeleteRolePolicy"],
      "Resource": "arn:aws:iam::111122223333:role/app-*",
      "Condition": { "StringEquals": {
        "iam:PermissionsBoundary": "arn:aws:iam::111122223333:policy/DevBoundary" } } },
    { "Sid": "NoBoundaryTampering", "Effect": "Deny",
      "Action": ["iam:DeleteRolePermissionsBoundary", "iam:CreatePolicyVersion",
                 "iam:DeletePolicy", "iam:SetDefaultPolicyVersion"],
      "Resource": ["arn:aws:iam::111122223333:policy/DevBoundary", "arn:aws:iam::111122223333:role/*"] },
    { "Sid": "PassOnlyAppRoles", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::111122223333:role/app-*" }
  ]
}</pre>
<p>Now even if a developer attaches <code>AdministratorAccess</code> to <code>app-orders</code>, the effective permissions are the <em>intersection</em> with <code>DevBoundary</code> (say: S3/DynamoDB/SQS on <code>app-*</code> resources, no IAM, no Organizations). Boundaries never grant anything by themselves.</p>
<table>
<tr><th>Guardrail</th><th>Applies to</th><th>Set by</th><th>Grants?</th></tr>
<tr><td>SCP</td><td>All principals in an account/OU</td><td>Org admins</td><td>No — ceiling</td></tr>
<tr><td>RCP</td><td>Resources in an account/OU</td><td>Org admins</td><td>No — ceiling</td></tr>
<tr><td>Permission boundary</td><td>One user/role</td><td>Account admins (enforced via conditions)</td><td>No — ceiling</td></tr>
<tr><td>Session policy</td><td>One session</td><td>Whoever calls AssumeRole</td><td>No — ceiling</td></tr>
</table>
<blockquote>⚠️ Production tip: <code>iam:PassRole</code> is the quiet privilege escalation. Whoever can pass a powerful role to EC2/Lambda/ECS/Glue can run code with it. Always scope PassRole to specific role ARNs, and use <code>iam:PassedToService</code> to say which service may receive it.</blockquote>`,
        he: `<p>הבעיה: מפתחים צריכים ליצור roles ל-Lambdas ול-pods שלהם, אבל <code>iam:CreateRole</code> ועוד <code>iam:AttachRolePolicy</code> הם דרך לאדמין (יוצרים role עם <code>AdministratorAccess</code> ועושים לו assume). <strong>Permission boundary</strong> הוא managed policy שמוגדר כ-<em>מקסימום</em> שאי פעם יהיה ל-user או role. נותנים למפתחים ליצור roles <em>רק אם</em> הם מחברים את ה-boundary שלך:</p>
<pre># Developer policy: may create/modify roles only with the DevBoundary attached
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "CreateRolesWithBoundary", "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
                 "iam:DetachRolePolicy", "iam:DeleteRolePolicy"],
      "Resource": "arn:aws:iam::111122223333:role/app-*",
      "Condition": { "StringEquals": {
        "iam:PermissionsBoundary": "arn:aws:iam::111122223333:policy/DevBoundary" } } },
    { "Sid": "NoBoundaryTampering", "Effect": "Deny",
      "Action": ["iam:DeleteRolePermissionsBoundary", "iam:CreatePolicyVersion",
                 "iam:DeletePolicy", "iam:SetDefaultPolicyVersion"],
      "Resource": ["arn:aws:iam::111122223333:policy/DevBoundary", "arn:aws:iam::111122223333:role/*"] },
    { "Sid": "PassOnlyAppRoles", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::111122223333:role/app-*" }
  ]
}</pre>
<p>עכשיו גם אם מפתח מחבר <code>AdministratorAccess</code> ל-<code>app-orders</code>, ההרשאות האפקטיביות הן ה-<em>חיתוך</em> עם <code>DevBoundary</code> (נניח: S3/DynamoDB/SQS על resources של <code>app-*</code>, בלי IAM, בלי Organizations). Boundaries אף פעם לא נותנים כלום בעצמם.</p>
<table>
<tr><th>Guardrail</th><th>חל על</th><th>מי מגדיר</th><th>נותן הרשאה?</th></tr>
<tr><td>SCP</td><td>כל ה-principals בחשבון או OU</td><td>אדמינים של הארגון</td><td>לא — תקרה</td></tr>
<tr><td>RCP</td><td>Resources בחשבון או OU</td><td>אדמינים של הארגון</td><td>לא — תקרה</td></tr>
<tr><td>Permission boundary</td><td>user או role אחד</td><td>אדמינים של החשבון (נאכף דרך conditions)</td><td>לא — תקרה</td></tr>
<tr><td>Session policy</td><td>session אחד</td><td>מי שקורא ל-AssumeRole</td><td>לא — תקרה</td></tr>
</table>
<blockquote>⚠️ Production tip: ‏<code>iam:PassRole</code> הוא ה-privilege escalation השקט. מי שיכול להעביר role חזק ל-EC2/Lambda/ECS/Glue יכול להריץ קוד עם ההרשאות שלו. תמיד תגביל את PassRole ל-ARNs ספציפיים של roles, ותשתמש ב-<code>iam:PassedToService</code> כדי לקבוע איזה שירות מותר לקבל אותו.</blockquote>`
      }
    },
    {
      h: { en: "Debugging AccessDenied and right-sizing from evidence", he: "דיבאג של AccessDenied וצמצום הרשאות מתוך ראיות" },
      body: {
        en: `<p>Modern AccessDenied messages tell you <em>which layer</em> denied — read them carefully before touching any policy:</p>
<pre>An error occurred (AccessDenied) when calling the GetObject operation:
User: arn:aws:sts::111122223333:assumed-role/app-orders/i-0abc123 is not authorized to perform:
s3:GetObject on resource: "arn:aws:s3:::acme-data/2026/11/report.csv"
with an explicit deny in a service control policy        &lt;- SCP: go to the org admins

...because no identity-based policy allows the s3:GetObject action      &lt;- fix the role
...with an explicit deny in a resource-based policy                     &lt;- bucket policy
...because no permissions boundary allows the s3:GetObject action       &lt;- boundary
...with an explicit deny in a resource control policy                   &lt;- RCP</pre>
<p>EC2 and some other services return an <strong>encoded authorization message</strong> instead. Decode it (needs <code>sts:DecodeAuthorizationMessage</code>):</p>
<pre>$ aws sts decode-authorization-message --encoded-message "$MSG" \
    --query DecodedMessage --output text | jq '.context, .matchedStatements'
{ "principal": { "arn": "arn:aws:sts::111122223333:assumed-role/ci/run-42" },
  "action": "ec2:RunInstances",
  "resource": "arn:aws:ec2:eu-west-1:111122223333:volume/*",
  "conditions": { "items": [ { "key": "aws:RequestTag/team", "values": { "items": [] } } ] } }
# -&gt; the volume was created without the required 'team' tag</pre>
<p>Tools for the next step:</p>
<ul>
<li><strong>Policy simulator:</strong> <code>aws iam simulate-principal-policy --policy-source-arn &lt;role-arn&gt; --action-names s3:GetObject --resource-arns arn:aws:s3:::acme-data/x</code> → <code>"EvalDecision": "implicitDeny"</code> plus the matched statements. It covers identity policies and boundaries (and optionally a resource policy you pass in); it does <em>not</em> evaluate SCPs/RCPs of the real org.</li>
<li><strong>IAM Access Analyzer:</strong> <em>external access</em> findings (anything shared outside your zone of trust: org or account), <em>unused access</em> findings (unused roles, keys, permissions — paid), <code>validate-policy</code> (lint: 100+ checks), <em>custom policy checks</em> in CI (<code>check-no-new-access</code>, <code>check-access-not-granted</code>, e.g. "this PR must not grant <code>s3:DeleteBucket</code>"), and <strong>policy generation</strong> from up to 90 days of CloudTrail.</li>
<li><strong>Last accessed:</strong> <code>aws iam generate-service-last-accessed-details --arn &lt;role&gt; --granularity ACTION_LEVEL</code> then <code>get-service-last-accessed-details --job-id …</code> — services/actions the role never used in the tracking window (up to 400 days) are safe to remove.</li>
</ul>
<pre># least privilege loop in CI (Terraform plan -&gt; JSON policy -&gt; checks)
$ aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://policy.json
$ aws accessanalyzer check-no-new-access --policy-type IDENTITY_POLICY \
    --existing-policy-document file://main.json --new-policy-document file://pr.json
{ "result": "FAIL", "message": "The modified permissions grant new access compared to your existing policy." }</pre>
<p><strong>Other clouds, briefly:</strong> <em>Azure RBAC</em> = role assignment (principal + role definition + scope: management group → subscription → resource group → resource), additive and inherited down the scope; deny assignments exist but you can't author them freely (Deployment Stacks/managed apps create them); guardrails are <em>Azure Policy</em>; just-in-time elevation via Entra <em>PIM</em>. <em>GCP IAM</em> = allow policies bound on org/folder/project/resource and inherited downward, with IAM Conditions (CEL); <em>IAM deny policies</em> and <em>Principal Access Boundary</em> policies add ceilings, and <em>Organization Policy</em> constraints play the SCP-like role.</p>
<blockquote>💡 Real world: the fastest AccessDenied triage is three commands — <code>aws sts get-caller-identity</code> (am I who I think?), read the error's last clause (which layer?), then CloudTrail <code>errorCode=AccessDenied</code> for the exact request context. Most "IAM bugs" turn out to be the wrong profile, the wrong region, a missing KMS key policy grant, or an SCP.</blockquote>`,
        he: `<p>הודעות AccessDenied מודרניות אומרות לך <em>איזו שכבה</em> חסמה — תקרא אותן בעיון לפני שאתה נוגע ב-policy כלשהו:</p>
<pre>An error occurred (AccessDenied) when calling the GetObject operation:
User: arn:aws:sts::111122223333:assumed-role/app-orders/i-0abc123 is not authorized to perform:
s3:GetObject on resource: "arn:aws:s3:::acme-data/2026/11/report.csv"
with an explicit deny in a service control policy        &lt;- SCP: go to the org admins

...because no identity-based policy allows the s3:GetObject action      &lt;- fix the role
...with an explicit deny in a resource-based policy                     &lt;- bucket policy
...because no permissions boundary allows the s3:GetObject action       &lt;- boundary
...with an explicit deny in a resource control policy                   &lt;- RCP</pre>
<p>EC2 ועוד כמה שירותים מחזירים במקום זה <strong>encoded authorization message</strong>. מפענחים אותו (צריך <code>sts:DecodeAuthorizationMessage</code>):</p>
<pre>$ aws sts decode-authorization-message --encoded-message "$MSG" \
    --query DecodedMessage --output text | jq '.context, .matchedStatements'
{ "principal": { "arn": "arn:aws:sts::111122223333:assumed-role/ci/run-42" },
  "action": "ec2:RunInstances",
  "resource": "arn:aws:ec2:eu-west-1:111122223333:volume/*",
  "conditions": { "items": [ { "key": "aws:RequestTag/team", "values": { "items": [] } } ] } }
# -&gt; the volume was created without the required 'team' tag</pre>
<p>הכלים לשלב הבא:</p>
<ul>
<li><strong>Policy simulator:</strong> <code>aws iam simulate-principal-policy --policy-source-arn &lt;role-arn&gt; --action-names s3:GetObject --resource-arns arn:aws:s3:::acme-data/x</code> ← <code>"EvalDecision": "implicitDeny"</code> ועוד ה-statements שהתאימו. הוא מכסה identity policies ו-boundaries (ואופציונלית resource policy שאתה מעביר); הוא <em>לא</em> מעריך את ה-SCPs/RCPs של הארגון האמיתי.</li>
<li><strong>IAM Access Analyzer:</strong> ממצאי <em>external access</em> (כל מה שמשותף מחוץ ל-zone of trust שלך: הארגון או החשבון), ממצאי <em>unused access</em> ‏(roles, ‏keys והרשאות שלא בשימוש — בתשלום), <code>validate-policy</code> (lint עם 100+ בדיקות), <em>custom policy checks</em> ב-CI ‏(<code>check-no-new-access</code>, ‏<code>check-access-not-granted</code>, למשל "ה-PR הזה לא מורשה לתת <code>s3:DeleteBucket</code>"), ו-<strong>policy generation</strong> מתוך עד 90 ימים של CloudTrail.</li>
<li><strong>Last accessed:</strong> <code>aws iam generate-service-last-accessed-details --arn &lt;role&gt; --granularity ACTION_LEVEL</code> ואז <code>get-service-last-accessed-details --job-id …</code> — שירותים ו-actions שה-role אף פעם לא השתמש בהם בחלון המעקב (עד 400 ימים) בטוחים להסרה.</li>
</ul>
<pre># least privilege loop in CI (Terraform plan -&gt; JSON policy -&gt; checks)
$ aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://policy.json
$ aws accessanalyzer check-no-new-access --policy-type IDENTITY_POLICY \
    --existing-policy-document file://main.json --new-policy-document file://pr.json
{ "result": "FAIL", "message": "The modified permissions grant new access compared to your existing policy." }</pre>
<p><strong>עננים אחרים, בקצרה:</strong> <em>Azure RBAC</em> = ‏role assignment ‏(principal + role definition + scope: ‏management group ← subscription ← resource group ← resource), מצטבר ועובר בירושה כלפי מטה; deny assignments קיימים אבל אי אפשר לכתוב אותם באופן חופשי (Deployment Stacks או managed apps יוצרים אותם); ה-guardrails הם <em>Azure Policy</em>; הרשאות just-in-time דרך <em>PIM</em> של Entra. <em>GCP IAM</em> = ‏allow policies שמוצמדים ל-org/folder/project/resource ועוברים בירושה כלפי מטה, עם IAM Conditions ‏(CEL); ‏<em>IAM deny policies</em> ו-policies של <em>Principal Access Boundary</em> מוסיפים תקרות, ואילוצי <em>Organization Policy</em> ממלאים תפקיד דומה ל-SCP.</p>
<blockquote>💡 Real world: ה-triage הכי מהיר ל-AccessDenied הוא שלוש פקודות — <code>aws sts get-caller-identity</code> (אני מי שאני חושב שאני?), לקרוא את הסיפא של השגיאה (איזו שכבה?), ואז CloudTrail עם <code>errorCode=AccessDenied</code> בשביל ה-request context המדויק. רוב "באגי ה-IAM" מתבררים כ-profile לא נכון, ‏region לא נכון, הרשאה חסרה ב-KMS key policy, או SCP.</blockquote>`
      }
    }
  ],
  diagram: "request context (principal, action, resource, conditions)\n   |\n   v\n[any explicit Deny?] --yes--> DENY\n   | no\n[RCPs allow?] --no--> DENY      (resources, org ceiling)\n[SCPs allow?] --no--> DENY      (principals, org ceiling)\n   |\n[resource policy allows?] ---(same account)---> may ALLOW\n[identity policy allows?]\n   |\n[permission boundary allows?] --no--> DENY\n[session policy allows?]      --no--> DENY\n   |\n  ALLOW   (cross-account: identity side AND resource side must both allow)",
  handsOn: [
    { cmd: "aws sts get-caller-identity", what: { en: "Who am I right now (user, role session, account)? Always step one.", he: "מי אני עכשיו (user, ‏session של role, חשבון)? תמיד הצעד הראשון." } },
    { cmd: "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::111122223333:role/app-orders --action-names s3:GetObject --resource-arns arn:aws:s3:::acme-data/x", what: { en: "Ask IAM's evaluator directly: allowed, implicitDeny or explicitDeny, and which statement matched.", he: "לשאול ישירות את ה-evaluator של IAM: ‏allowed, ‏implicitDeny או explicitDeny, ואיזה statement התאים." } },
    { cmd: "aws sts decode-authorization-message --encoded-message \"$MSG\" --query DecodedMessage --output text | jq .", what: { en: "Turn EC2's opaque 'Encoded authorization failure message' into the full request context.", he: "להפוך את ה-'Encoded authorization failure message' האטום של EC2 ל-request context מלא." } },
    { cmd: "aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://policy.json", what: { en: "Lint a policy: errors, security warnings (PassRole with *), and suggestions.", he: "לעשות lint ל-policy: שגיאות, אזהרות אבטחה (PassRole עם *) והצעות." } },
    { cmd: "aws iam generate-service-last-accessed-details --arn arn:aws:iam::111122223333:role/app-orders --granularity ACTION_LEVEL", what: { en: "Start a job showing which services/actions the role actually used; fetch with get-service-last-accessed-details.", he: "להתחיל job שמראה באילו שירותים ו-actions ה-role באמת השתמש; לשלוף עם get-service-last-accessed-details." } }
  ],
  mnemonic: {
    en: "Deny kills, ceilings cap, grants open, filters shrink — and across accounts, both doors must open.",
    he: "Deny הורג, תקרות מגבילות, grants פותחים, פילטרים מצמצמים — ובין חשבונות, שתי הדלתות חייבות להיפתח."
  },
  pitfalls: [
    { en: "Thinking an SCP or permission boundary grants access. They are ceilings only; something else must still Allow.", he: "לחשוב ש-SCP או permission boundary נותנים גישה. הם רק תקרות; משהו אחר עדיין חייב לתת Allow." },
    { en: "Using aws:SourceIp on a bucket accessed through a VPC gateway endpoint: requests arrive with private IPs and get denied. Use aws:SourceVpce.", he: "להשתמש ב-aws:SourceIp על bucket שניגשים אליו דרך VPC gateway endpoint: הבקשות מגיעות עם IP-ים פרטיים ונחסמות. תשתמש ב-aws:SourceVpce." },
    { en: "Granting S3 access cross-account but forgetting the KMS key policy: objects encrypted with SSE-KMS still return AccessDenied.", he: "לתת גישת S3 בין חשבונות ולשכוח את ה-KMS key policy: אובייקטים שמוצפנים ב-SSE-KMS עדיין מחזירים AccessDenied." },
    { en: "iam:PassRole on Resource '*': lets anyone who can create a Lambda or EC2 instance run code as your most powerful role.", he: "iam:PassRole על Resource '*': מאפשר לכל מי שיכול ליצור Lambda או EC2 instance להריץ קוד בתור ה-role הכי חזק שלך." }
  ],
  interview: [
    {
      q: { en: "A role in account A can't read a bucket in account B even though the bucket policy allows it. What do you check?", he: "role בחשבון A לא מצליח לקרוא bucket בחשבון B, למרות שה-bucket policy מאפשר. מה אתה בודק?" },
      a: {
        en: "Cross-account needs both sides: does the role's identity policy in A allow s3:GetObject on that ARN? Do A's SCPs and B's RCPs permit it? Any explicit Deny in the bucket policy (TLS, PrincipalOrgID, SourceVpce)? Is the object SSE-KMS encrypted with a key whose key policy doesn't grant account A kms:Decrypt? Object ownership: with ACLs enabled, objects uploaded by a third account may not be readable. The error's last clause usually names the layer.",
        he: "Cross-account צריך את שני הצדדים: האם ה-identity policy של ה-role ב-A מאפשר s3:GetObject על ה-ARN הזה? האם ה-SCPs של A וה-RCPs של B מתירים? יש Deny מפורש ב-bucket policy ‏(TLS, ‏PrincipalOrgID, ‏SourceVpce)? האם האובייקט מוצפן ב-SSE-KMS עם key שה-key policy שלו לא נותן לחשבון A ‏kms:Decrypt? בעלות על אובייקטים: כש-ACLs מופעלים, אובייקטים שהועלו מחשבון שלישי אולי לא קריאים. הסיפא של השגיאה בדרך כלל מציינת את השכבה."
      }
    },
    {
      q: { en: "How do you let product teams create their own IAM roles without giving them a path to admin?", he: "איך נותנים לצוותי מוצר ליצור IAM roles בעצמם בלי לתת להם דרך לאדמין?" },
      a: {
        en: "Permission boundaries: allow iam:CreateRole/AttachRolePolicy only with a condition iam:PermissionsBoundary = the approved boundary ARN, restrict role names (app-*), deny editing/deleting the boundary or removing it from roles, and scope iam:PassRole to app-* roles with iam:PassedToService. SCPs keep the org-level ceiling, and Access Analyzer custom checks in CI catch new risky grants.",
        he: "Permission boundaries: מתירים iam:CreateRole/AttachRolePolicy רק עם condition של iam:PermissionsBoundary שווה ל-ARN של ה-boundary המאושר, מגבילים שמות roles ‏(app-*), חוסמים עריכה או מחיקה של ה-boundary או הסרה שלו מ-roles, ומגבילים את iam:PassRole ל-roles של app-* עם iam:PassedToService. ה-SCPs שומרים על התקרה ברמת הארגון, ו-custom checks של Access Analyzer ב-CI תופסים הרשאות מסוכנות חדשות."
      }
    }
  ],
  quiz: [
    {
      q: { en: "An identity policy allows s3:*, the SCP allows s3:*, and the bucket policy has a Deny for requests without TLS. A request over HTTP arrives. Result?", he: "identity policy מאפשר s3:*, ה-SCP מאפשר s3:*, ול-bucket policy יש Deny לבקשות בלי TLS. מגיעה בקשה על HTTP. התוצאה?" },
      options: [
        { en: "Allowed: two Allows beat one Deny", he: "מותר: שני Allow מנצחים Deny אחד" },
        { en: "Denied: an explicit Deny in any policy wins", he: "חסום: ‏Deny מפורש בכל policy מנצח" },
        { en: "Allowed, because identity policies are evaluated first", he: "מותר, כי identity policies מוערכים קודם" },
        { en: "Depends on which policy was attached last", he: "תלוי איזה policy חובר אחרון" }
      ],
      answer: 1,
      explain: { en: "Explicit Deny is checked first and is final, no matter how many Allows exist elsewhere.", he: "Deny מפורש נבדק ראשון והוא סופי, לא משנה כמה Allow יש במקומות אחרים." }
    },
    {
      q: { en: "A role has a permission boundary allowing only S3 and DynamoDB. Its identity policy is AdministratorAccess. Can it call ec2:RunInstances?", he: "ל-role יש permission boundary שמאפשר רק S3 ו-DynamoDB. ה-identity policy שלו הוא AdministratorAccess. הוא יכול לקרוא ל-ec2:RunInstances?" },
      options: [
        { en: "Yes, AdministratorAccess overrides boundaries", he: "כן, ‏AdministratorAccess דורס boundaries" },
        { en: "No: effective permissions are the intersection of identity policy and boundary", he: "לא: ההרשאות האפקטיביות הן החיתוך בין ה-identity policy ל-boundary" },
        { en: "Yes, if the SCP allows EC2", he: "כן, אם ה-SCP מאפשר EC2" },
        { en: "Only with MFA", he: "רק עם MFA" }
      ],
      answer: 1,
      explain: { en: "A boundary is a ceiling: only actions allowed by both the identity policy and the boundary are effective.", he: "Boundary הוא תקרה: רק actions שמותרים גם ב-identity policy וגם ב-boundary הם אפקטיביים." }
    },
    {
      q: { en: "Account A's role needs to read an SQS queue in account B. What is required?", he: "role בחשבון A צריך לקרוא מתור SQS בחשבון B. מה נדרש?" },
      options: [
        { en: "Only the queue policy in B allowing the role", he: "רק queue policy ב-B שמאפשר ל-role" },
        { en: "Only the identity policy in A", he: "רק ה-identity policy ב-A" },
        { en: "An Allow in A's identity policy AND in B's queue policy (and neither side's org policies denying)", he: "Allow ב-identity policy של A וגם ב-queue policy של B (ושה-policies הארגוניים של אף צד לא חוסמים)" },
        { en: "A VPC peering connection between the accounts", he: "VPC peering בין החשבונות" }
      ],
      answer: 2,
      explain: { en: "Cross-account access requires both the principal's account and the resource's account to grant it.", he: "גישה בין חשבונות דורשת ששני החשבונות — של ה-principal ושל ה-resource — יתנו אותה." }
    },
    {
      q: { en: "Which tool generates a least-privilege policy from what a role actually did?", he: "איזה כלי מייצר policy של least privilege מתוך מה שה-role באמת עשה?" },
      options: [
        { en: "AWS Trusted Advisor", he: "AWS Trusted Advisor" },
        { en: "IAM Access Analyzer policy generation (from CloudTrail)", he: "ה-policy generation של IAM Access Analyzer (מתוך CloudTrail)" },
        { en: "aws sts decode-authorization-message", he: "aws sts decode-authorization-message" },
        { en: "AWS Shield", he: "AWS Shield" }
      ],
      answer: 1,
      explain: { en: "Access Analyzer reads up to 90 days of CloudTrail for the role and drafts a policy with the services and actions used; you review and tighten resources.", he: "Access Analyzer קורא עד 90 ימים של CloudTrail עבור ה-role ומנסח policy עם השירותים וה-actions שבשימוש; אתה עובר עליו ומצמצם resources." }
    }
  ],
  related: ["cloud-iam-security", "cloud-landing-zones", "cloud-engineer-access", "cloud-secrets-management", "staff-zero-trust-secrets", "pr-security-ops"]
});

// ---------------------------------------------------------------------------
// 4. Compliance for Engineers
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "compliance-for-engineers",
  track: "staff",
  order: 60,
  icon: "📋",
  level: 3,
  minutes: 15,
  title: { en: "Compliance for Engineers", he: "Compliance למהנדסים" },
  tldr: {
    en: "SOC 2, ISO 27001, PCI DSS, HIPAA and GDPR ask the same core questions of infrastructure: who has access and who approved it, how changes reach production, is data encrypted, are logs kept, are backups restorable, are vulnerabilities fixed on time, and can you respond to incidents. Build those controls into pipelines and IaC, shrink scope aggressively, and let tools collect evidence continuously — then audits stop slowing engineering.",
    he: "SOC 2, ‏ISO 27001, ‏PCI DSS, ‏HIPAA ו-GDPR שואלים את התשתית את אותן שאלות ליבה: למי יש גישה ומי אישר אותה, איך שינויים מגיעים ל-production, האם המידע מוצפן, האם הלוגים נשמרים, האם אפשר לשחזר גיבויים, האם חולשות מתוקנות בזמן, והאם אתה יודע להגיב לאירועים. תבנה את ה-controls האלה לתוך ה-pipelines וה-IaC, תצמצם scope באגרסיביות, ותן לכלים לאסוף ראיות ברציפות — ואז ה-audits מפסיקים להאט את ההנדסה."
  },
  analogy: {
    en: "A restaurant health inspection. The inspector doesn't cook; he asks to see the fridge temperature log for the last six months, the cleaning schedule with signatures, and where the raw chicken is stored. A kitchen with a thermometer that logs automatically and a layout that keeps raw meat in one corner passes in an hour. A kitchen that 'always does it right' but wrote nothing down fails — and the one that stores raw chicken everywhere has to prove every shelf is safe.",
    he: "ביקורת של משרד הבריאות במסעדה. המבקר לא מבשל; הוא מבקש לראות את יומן הטמפרטורה של המקרר מחצי השנה האחרונה, את לוח הניקיון עם חתימות, ואיפה נשמר העוף הנא. מטבח עם מדחום שמתעד אוטומטית ועם מבנה ששומר את הבשר הנא בפינה אחת עובר בשעה. מטבח ש'תמיד עושה הכול נכון' אבל לא תיעד כלום — נכשל. ומי ששומר עוף נא בכל מקום צריך להוכיח שכל מדף בטוח."
  },
  sections: [
    {
      h: { en: "The frameworks, from the infra side", he: "ה-frameworks, מהצד של התשתית" },
      body: {
        en: `<table>
<tr><th>Framework</th><th>What it is</th><th>Output</th><th>What infra must show</th></tr>
<tr><td><strong>SOC 2</strong> (AICPA)</td><td>Attestation against the Trust Services Criteria: <em>Security</em> (required, "common criteria" CC1-CC9) + optional Availability, Processing Integrity, Confidentiality, Privacy. You choose the controls.</td><td>Report from a CPA firm. <strong>Type I</strong>: controls are designed well at a point in time. <strong>Type II</strong>: controls <em>operated</em> effectively over a period (3-12 months, usually 12 after the first).</td><td>Logical access (CC6), change management (CC8), monitoring & incident response (CC7), risk & vendor management</td></tr>
<tr><td><strong>ISO/IEC 27001:2022</strong></td><td>Certifiable management system (ISMS): risk assessment, Statement of Applicability, 93 Annex A controls in 4 themes (organizational 37, people 8, physical 14, technological 34)</td><td>Certificate, 3-year cycle with annual surveillance audits</td><td>Same core controls, plus documented risk treatment and internal audits</td></tr>
<tr><td><strong>PCI DSS v4.0.1</strong></td><td>12 requirements for anything that stores, processes or transmits cardholder data — the <strong>CDE</strong> and everything connected to it</td><td>ROC by a QSA (Level 1: over 6M card transactions/year) or a Self-Assessment Questionnaire (SAQ A, A-EP, D…)</td><td>Network segmentation, MFA into the CDE, 12-month log retention, quarterly ASV scans, annual pen tests, FIM</td></tr>
<tr><td><strong>HIPAA</strong> (US)</td><td>Security Rule: administrative, physical and technical safeguards for ePHI. No official certification.</td><td>Risk analysis; BAAs with every vendor touching PHI (AWS/Azure/GCP sign one, but only for listed eligible services)</td><td>Encryption, access control, audit logs, backup/DR, policy documentation kept 6 years</td></tr>
<tr><td><strong>GDPR</strong> (EU)</td><td>Law, not a certification. Art. 32 "appropriate technical and organisational measures"; Art. 33 breach notification to the authority within <strong>72 hours</strong></td><td>Records of processing, DPAs with processors, DPIAs</td><td>Data location & transfers (SCCs, EU-US Data Privacy Framework), encryption, access logs, deletion including backups, sub-processor list</td></tr>
</table>
<blockquote>💡 Real world: SOC 2 Type II is what B2B SaaS buyers ask for in the US; ISO 27001 is the equivalent ask in Europe and Israel. They overlap heavily: map your controls once to a common control set and reuse the same evidence for both. PCI and HIPAA are triggered by the data you touch, not by what customers ask for. For GDPR's data-handling side see <code>#/lesson/pr-privacy</code>.</blockquote>`,
        he: `<table>
<tr><th>Framework</th><th>מה זה</th><th>תוצר</th><th>מה התשתית צריכה להראות</th></tr>
<tr><td><strong>SOC 2</strong> ‏(AICPA)</td><td>Attestation מול ה-Trust Services Criteria: <em>Security</em> (חובה, ה-"common criteria" ‏CC1-CC9) ועוד Availability, ‏Processing Integrity, ‏Confidentiality, ‏Privacy כאופציה. אתה בוחר את ה-controls.</td><td>דוח של משרד CPA. <strong>Type I</strong>: ה-controls מתוכננים טוב בנקודת זמן. <strong>Type II</strong>: ה-controls <em>פעלו</em> בפועל לאורך תקופה (3-12 חודשים, בדרך כלל 12 אחרי הראשון).</td><td>גישה לוגית (CC6), ‏change management ‏(CC8), ניטור ו-incident response ‏(CC7), ניהול סיכונים וספקים</td></tr>
<tr><td><strong>ISO/IEC 27001:2022</strong></td><td>מערכת ניהול (ISMS) שניתן להסמיך: risk assessment, ‏Statement of Applicability, ‏93 controls ב-Annex A בארבע קטגוריות (ארגוניים 37, אנשים 8, פיזיים 14, טכנולוגיים 34)</td><td>תעודה, מחזור של 3 שנים עם surveillance audit שנתי</td><td>אותם controls בליבה, ועוד טיפול בסיכונים מתועד ו-internal audits</td></tr>
<tr><td><strong>PCI DSS v4.0.1</strong></td><td>12 דרישות לכל מה ששומר, מעבד או מעביר נתוני כרטיסי אשראי — ה-<strong>CDE</strong> וכל מה שמחובר אליו</td><td>ROC על ידי QSA ‏(Level 1: מעל 6 מיליון עסקאות כרטיס בשנה) או Self-Assessment Questionnaire ‏(SAQ A, ‏A-EP, ‏D…)</td><td>Network segmentation, ‏MFA לכניסה ל-CDE, שמירת לוגים 12 חודשים, סריקות ASV רבעוניות, pen test שנתי, ‏FIM</td></tr>
<tr><td><strong>HIPAA</strong> (ארה"ב)</td><td>ה-Security Rule: אמצעי הגנה מנהליים, פיזיים וטכניים ל-ePHI. אין הסמכה רשמית.</td><td>Risk analysis; ‏BAA עם כל ספק שנוגע ב-PHI ‏(AWS/Azure/GCP חותמים, אבל רק לשירותים שמופיעים ברשימת ה-eligible)</td><td>הצפנה, בקרת גישה, audit logs, גיבוי ו-DR, תיעוד policies שנשמר 6 שנים</td></tr>
<tr><td><strong>GDPR</strong> (האיחוד האירופי)</td><td>חוק, לא הסמכה. סעיף 32 "אמצעים טכניים וארגוניים מתאימים"; סעיף 33 דיווח על דליפה לרשות תוך <strong>72 שעות</strong></td><td>רישום פעולות עיבוד, ‏DPAs עם processors, ‏DPIAs</td><td>מיקום מידע והעברות (SCCs, ‏EU-US Data Privacy Framework), הצפנה, לוגי גישה, מחיקה כולל גיבויים, רשימת sub-processors</td></tr>
</table>
<blockquote>💡 Real world: ‏SOC 2 Type II הוא מה שקונים של B2B SaaS בארה"ב מבקשים; ‏ISO 27001 הוא הבקשה המקבילה באירופה ובישראל. יש ביניהם חפיפה גדולה: תמפה את ה-controls שלך פעם אחת ל-common control set ותשתמש באותן ראיות לשניהם. PCI ו-HIPAA מופעלים בגלל המידע שאתה נוגע בו, לא בגלל מה שלקוחות מבקשים. לצד הטיפול במידע של GDPR ראה <code>#/lesson/pr-privacy</code>.</blockquote>`
      }
    },
    {
      h: { en: "What auditors actually ask your infrastructure for", he: "מה המבקרים באמת מבקשים מהתשתית שלך" },
      body: {
        en: `<p>Auditors work by <strong>population and sample</strong>: "give me the full list of X during the audit period", then they pick 25-40 items and ask for evidence for each. Your job is to make every population exportable and every sample self-evident.</p>
<table>
<tr><th>Control area</th><th>Typical request</th><th>Good evidence</th></tr>
<tr><td>Access reviews</td><td>"Quarterly review of who has prod/cloud/DB access, with sign-off"</td><td>Export from IdP + AWS Identity Center assignments, reviewer decision per user, tickets for removals</td></tr>
<tr><td>Joiners/leavers</td><td>"All terminations in the period; show access removed within your SLA (e.g. 24 h)"</td><td>HRIS termination date vs IdP deactivation timestamp (SCIM-driven = automatic)</td></tr>
<tr><td>Change management</td><td>"All production changes; for 25 of them show approval, testing and who deployed"</td><td>PR with required review, green CI, deploy log from the pipeline, branch protection settings</td></tr>
<tr><td>Encryption</td><td>"Prove data at rest and in transit is encrypted"</td><td>AWS Config rules (<code>s3-bucket-server-side-encryption-enabled</code>, <code>rds-storage-encrypted</code>, <code>encrypted-volumes</code>), TLS policy on load balancers</td></tr>
<tr><td>Logging & retention</td><td>"Audit logs enabled, protected, retained (1 year; PCI: 12 months, 3 immediately available)"</td><td>Org CloudTrail to a log-archive account with Object Lock, lifecycle rules, SIEM retention settings</td></tr>
<tr><td>Backups</td><td>"Backups run and a restore was <em>tested</em>"</td><td>AWS Backup job reports + a dated restore test record with checksum/row-count verification</td></tr>
<tr><td>Vulnerability management</td><td>"Scan results and proof criticals were fixed within your SLA"</td><td>Scanner exports (Inspector, Trivy, Snyk), tickets with dates; typical SLA critical 15-30 days, high 30-60</td></tr>
<tr><td>Incident response</td><td>"IR plan, annual test, and records of real incidents"</td><td>Tabletop exercise notes, postmortems, on-call/escalation config</td></tr>
<tr><td>BCP/DR</td><td>"DR plan and annual test results vs RTO/RPO"</td><td>Game day report with measured RTO/RPO</td></tr>
</table>
<pre># evidence that change management is enforced, not just promised
$ gh api repos/acme/payments/branches/main/protection \
    --jq '{reviews: .required_pull_request_reviews.required_approving_review_count,
           codeowners: .required_pull_request_reviews.require_code_owner_reviews,
           checks: .required_status_checks.contexts, admins: .enforce_admins.enabled}'
{ "reviews": 1, "codeowners": true, "checks": ["ci/test", "security/scan"], "admins": true }

# population of IAM users and key ages for the access review
$ aws iam generate-credential-report &amp;&amp; aws iam get-credential-report \
    --query Content --output text | base64 -d | cut -d, -f1,4,9,11 | column -t -s,</pre>
<blockquote>⚠️ Production tip: the #1 Type II finding is an <em>exception</em> in the sample: one emergency hotfix pushed without review, one leaver whose AWS key stayed active 3 weeks. Design a documented break-glass path (who can bypass, how it's logged, retro-review within 1 business day) so emergencies produce evidence instead of exceptions.</blockquote>`,
        he: `<p>מבקרים עובדים לפי <strong>population ו-sample</strong>: "תן לי את הרשימה המלאה של X בתקופת ה-audit", ואז הם בוחרים 25-40 פריטים ומבקשים ראיות לכל אחד. התפקיד שלך הוא שכל population יהיה ניתן לייצוא וכל sample יסביר את עצמו.</p>
<table>
<tr><th>תחום</th><th>בקשה טיפוסית</th><th>ראיה טובה</th></tr>
<tr><td>Access reviews</td><td>"סקירה רבעונית של מי שיש לו גישה ל-prod, לענן ול-DB, עם חתימה"</td><td>ייצוא מה-IdP ומה-assignments של AWS Identity Center, החלטה של הסוקר לכל משתמש, tickets להסרות</td></tr>
<tr><td>Joiners/leavers</td><td>"כל העזיבות בתקופה; תראה שהגישה הוסרה בתוך ה-SLA (למשל 24 שעות)"</td><td>תאריך העזיבה ב-HRIS מול ה-timestamp של ההשבתה ב-IdP (כשזה מונע SCIM = אוטומטי)</td></tr>
<tr><td>Change management</td><td>"כל השינויים ב-production; ל-25 מהם תראה אישור, בדיקות ומי עשה deploy"</td><td>PR עם review חובה, ‏CI ירוק, לוג deploy מה-pipeline, הגדרות branch protection</td></tr>
<tr><td>הצפנה</td><td>"תוכיח שהמידע מוצפן at rest ו-in transit"</td><td>חוקי AWS Config ‏(<code>s3-bucket-server-side-encryption-enabled</code>, ‏<code>rds-storage-encrypted</code>, ‏<code>encrypted-volumes</code>), ‏TLS policy על ה-load balancers</td></tr>
<tr><td>לוגים ו-retention</td><td>"Audit logs מופעלים, מוגנים ונשמרים (שנה; ב-PCI ‏12 חודשים, 3 זמינים מיידית)"</td><td>CloudTrail ארגוני לחשבון log-archive עם Object Lock, ‏lifecycle rules, הגדרות retention ב-SIEM</td></tr>
<tr><td>גיבויים</td><td>"הגיבויים רצים ושחזור <em>נבדק</em>"</td><td>דוחות jobs של AWS Backup ועוד תיעוד מתוארך של בדיקת שחזור עם אימות checksum או ספירת שורות</td></tr>
<tr><td>Vulnerability management</td><td>"תוצאות סריקה והוכחה שקריטיות תוקנו בתוך ה-SLA"</td><td>ייצוא מהסורקים (Inspector, ‏Trivy, ‏Snyk), ‏tickets עם תאריכים; SLA טיפוסי: critical תוך 15-30 יום, high תוך 30-60</td></tr>
<tr><td>Incident response</td><td>"תוכנית IR, בדיקה שנתית ותיעוד של אירועים אמיתיים"</td><td>סיכומי tabletop exercise, ‏postmortems, הגדרות on-call ו-escalation</td></tr>
<tr><td>BCP/DR</td><td>"תוכנית DR ותוצאות בדיקה שנתית מול RTO/RPO"</td><td>דוח game day עם RTO/RPO שנמדדו</td></tr>
</table>
<pre># evidence that change management is enforced, not just promised
$ gh api repos/acme/payments/branches/main/protection \
    --jq '{reviews: .required_pull_request_reviews.required_approving_review_count,
           codeowners: .required_pull_request_reviews.require_code_owner_reviews,
           checks: .required_status_checks.contexts, admins: .enforce_admins.enabled}'
{ "reviews": 1, "codeowners": true, "checks": ["ci/test", "security/scan"], "admins": true }

# population of IAM users and key ages for the access review
$ aws iam generate-credential-report &amp;&amp; aws iam get-credential-report \
    --query Content --output text | base64 -d | cut -d, -f1,4,9,11 | column -t -s,</pre>
<blockquote>⚠️ Production tip: הממצא מספר 1 ב-Type II הוא <em>exception</em> ב-sample: hotfix חירום אחד שנדחף בלי review, עובד אחד שעזב וה-AWS key שלו נשאר פעיל 3 שבועות. תתכנן מסלול break-glass מתועד (מי יכול לעקוף, איך זה נרשם, retro-review תוך יום עבודה אחד) כך שמקרי חירום יפיקו ראיות במקום exceptions.</blockquote>`
      }
    },
    {
      h: { en: "PCI DSS: shrink the scope before you secure it", he: "PCI DSS: לצמצם את ה-scope לפני שמאבטחים אותו" },
      body: {
        en: `<p>Everything that stores, processes or transmits card data (PAN) is in the <strong>CDE</strong> — and so is everything that can connect to it: the bastion, the CI runner that deploys into it, the logging pipeline, the shared Kubernetes cluster. In-scope systems get all ~300 sub-requirements. The cheapest PCI control is to <strong>not touch card data</strong>.</p>
<table>
<tr><th>Architecture</th><th>Card data path</th><th>Typical validation</th></tr>
<tr><td>Hosted payment page / redirect (Stripe Checkout, Adyen HPP)</td><td>Never touches your servers</td><td>SAQ A (~30 requirements)</td></tr>
<tr><td>Hosted fields / JS that posts directly to the processor (Stripe Elements)</td><td>Browser → processor; your page loads the script</td><td>SAQ A (if fields are iframes from the processor) or SAQ A-EP; v4.0 adds script integrity requirements (6.4.3, 11.6.1) for the payment page</td></tr>
<tr><td>Your API receives PAN, then tokenizes</td><td>Through your LB, app, logs…</td><td>SAQ D / full ROC: whole path in scope</td></tr>
</table>
<p><strong>Tokenization</strong>: the processor (or a vault like VGS, Basis Theory) stores the PAN and gives you a token (<code>pm_1Q2w3E…</code>) that is useless outside that processor. Your DB, logs and analytics hold only tokens → out of scope. If you must hold PANs, isolate the CDE: separate AWS account(s), its own VPC with no peering to general workloads, dedicated cluster, egress allow-list, MFA for all access (req. 8.4.2), and <strong>segmentation testing</strong> that proves non-CDE networks can't reach it (annually for merchants, every 6 months for service providers).</p>
<pre># scope check you can automate: nothing outside the CDE account may reach it
$ aws ec2 describe-security-groups --filters Name=tag:pci,Values=cde \
    --query 'SecurityGroups[].IpPermissions[].IpRanges[].CidrIp' --output text | sort -u
10.40.0.0/16          &lt;- CDE VPC only. A 10.0.0.0/8 here would pull half the company into scope.</pre>
<blockquote>💡 Real world: a common way companies accidentally re-enter PCI scope is logging. One debug log line with the raw request body puts the log pipeline, the SIEM and everyone with log access in scope. Redact at the edge (WAF/LB logging config, app log filters for 13-19 digit Luhn-valid numbers) and scan logs for PANs.</blockquote>`,
        he: `<p>כל מה ששומר, מעבד או מעביר נתוני כרטיס (PAN) נמצא ב-<strong>CDE</strong> — וכך גם כל מה שיכול להתחבר אליו: ה-bastion, ה-CI runner שעושה deploy לתוכו, ה-pipeline של הלוגים, קלאסטר ה-Kubernetes המשותף. מערכות ב-scope מקבלות את כל ~300 תתי-הדרישות. ה-control הכי זול ב-PCI הוא <strong>לא לגעת בנתוני כרטיס</strong>.</p>
<table>
<tr><th>ארכיטקטורה</th><th>מסלול נתוני הכרטיס</th><th>Validation טיפוסי</th></tr>
<tr><td>Hosted payment page או redirect ‏(Stripe Checkout, ‏Adyen HPP)</td><td>אף פעם לא נוגע בשרתים שלך</td><td>SAQ A (~30 דרישות)</td></tr>
<tr><td>Hosted fields או JS ששולח ישירות ל-processor ‏(Stripe Elements)</td><td>דפדפן ← processor; הדף שלך טוען את הסקריפט</td><td>SAQ A (אם השדות הם iframes של ה-processor) או SAQ A-EP; גרסה 4.0 מוסיפה דרישות integrity לסקריפטים (6.4.3, ‏11.6.1) בדף התשלום</td></tr>
<tr><td>ה-API שלך מקבל PAN ואז עושה tokenization</td><td>עובר דרך ה-LB, האפליקציה, הלוגים…</td><td>SAQ D או ROC מלא: כל המסלול ב-scope</td></tr>
</table>
<p><strong>Tokenization</strong>: ה-processor (או vault כמו VGS, ‏Basis Theory) שומר את ה-PAN ונותן לך token ‏(<code>pm_1Q2w3E…</code>) שאין לו ערך מחוץ ל-processor הזה. ה-DB, הלוגים והאנליטיקה שלך מחזיקים רק tokens ← מחוץ ל-scope. אם אתה חייב להחזיק PANs, תבודד את ה-CDE: חשבון AWS נפרד (או כמה), ‏VPC משלו בלי peering ל-workloads כלליים, קלאסטר ייעודי, allow-list ל-egress, ‏MFA לכל גישה (דרישה 8.4.2), ו-<strong>segmentation testing</strong> שמוכיח שרשתות מחוץ ל-CDE לא מגיעות אליו (פעם בשנה ל-merchants, כל 6 חודשים ל-service providers).</p>
<pre># scope check you can automate: nothing outside the CDE account may reach it
$ aws ec2 describe-security-groups --filters Name=tag:pci,Values=cde \
    --query 'SecurityGroups[].IpPermissions[].IpRanges[].CidrIp' --output text | sort -u
10.40.0.0/16          &lt;- CDE VPC only. A 10.0.0.0/8 here would pull half the company into scope.</pre>
<blockquote>💡 Real world: דרך נפוצה שבה חברות חוזרות בטעות ל-scope של PCI היא לוגים. שורת debug אחת עם ה-body הגולמי של הבקשה מכניסה ל-scope את ה-pipeline של הלוגים, את ה-SIEM ואת כל מי שיש לו גישה ללוגים. תעשה redaction בקצה (הגדרות הלוגים של WAF/LB, פילטרים בלוגים של האפליקציה למספרים של 13-19 ספרות שעוברים Luhn) ותסרוק את הלוגים לחיפוש PANs.</blockquote>`
      }
    },
    {
      h: { en: "Compliance as code and continuous evidence", he: "Compliance as code וראיות רציפות" },
      body: {
        en: `<p>The old way: a month of screenshots before each audit. The modern way: controls are enforced by code, and evidence is collected continuously by APIs.</p>
<ul>
<li><strong>Prevent</strong> (guardrails): SCPs/RCPs (deny disabling CloudTrail, deny unencrypted storage, region allow-list), IaC policy checks in CI (Checkov, tfsec/Trivy, OPA/Conftest), Kubernetes admission (Kyverno/Gatekeeper).</li>
<li><strong>Detect</strong>: <strong>AWS Config</strong> rules and conformance packs (e.g. "Operational Best Practices for PCI DSS"), <strong>Security Hub</strong> standards (AWS Foundational Security Best Practices, CIS AWS Foundations Benchmark, PCI DSS, NIST SP 800-53) with findings aggregated across the org; Azure Policy + Defender for Cloud regulatory compliance; GCP Security Command Center.</li>
<li><strong>Collect</strong>: compliance automation platforms (Vanta, Drata, Secureframe, Sprinto…) connect read-only to AWS/GCP/Azure, GitHub/GitLab, the IdP, the HRIS, the MDM and the ticketing system, run hundreds of tests continuously ("all S3 buckets block public access", "MFA for all users", "offboarded within 24 h"), and give the auditor a portal. <strong>AWS Audit Manager</strong> does the AWS-side mapping natively.</li>
</ul>
<pre># CI: fail the PR if Terraform breaks a control (and the result is evidence)
$ checkov -d infra/ --framework terraform --compact --quiet
Check: CKV_AWS_19: "Ensure the S3 bucket has server-side-encryption enabled"
        FAILED for resource: aws_s3_bucket.exports
Check: CKV_AWS_67: "Ensure CloudTrail is enabled in all Regions"
        PASSED for resource: aws_cloudtrail.org

# detect: org-wide compliance at a glance
$ aws securityhub get-findings --filters \
    '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
    --query 'Findings[].[AwsAccountId,Title]' --output table
$ aws configservice get-compliance-summary-by-config-rule</pre>
<blockquote>⚠️ Production tip: a compliance tool is a mirror, not a fix. Teams that connect Vanta and then mark tests as "not applicable" to get green dashboards fail the Type II sample. Treat each failing test like a bug with an owner and SLA, and keep a documented exceptions register (risk accepted by whom, until when).</blockquote>`,
        he: `<p>הדרך הישנה: חודש של צילומי מסך לפני כל audit. הדרך המודרנית: ה-controls נאכפים על ידי קוד, והראיות נאספות ברציפות דרך APIs.</p>
<ul>
<li><strong>מניעה</strong> (guardrails): ‏SCPs/RCPs (חסימת כיבוי CloudTrail, חסימת אחסון לא מוצפן, allow-list של regions), בדיקות policy על IaC ב-CI ‏(Checkov, ‏tfsec/Trivy, ‏OPA/Conftest), ‏admission ב-Kubernetes ‏(Kyverno/Gatekeeper).</li>
<li><strong>זיהוי</strong>: חוקים ו-conformance packs של <strong>AWS Config</strong> (למשל "Operational Best Practices for PCI DSS"), ה-standards של <strong>Security Hub</strong> ‏(AWS Foundational Security Best Practices, ‏CIS AWS Foundations Benchmark, ‏PCI DSS, ‏NIST SP 800-53) עם ממצאים שמרוכזים מכל הארגון; Azure Policy ו-Defender for Cloud ל-regulatory compliance; ‏GCP Security Command Center.</li>
<li><strong>איסוף</strong>: פלטפורמות compliance automation ‏(Vanta, ‏Drata, ‏Secureframe, ‏Sprinto…) מתחברות read-only ל-AWS/GCP/Azure, ל-GitHub/GitLab, ל-IdP, ל-HRIS, ל-MDM ולמערכת ה-tickets, מריצות מאות בדיקות ברציפות ("כל ה-S3 buckets חוסמים גישה ציבורית", "MFA לכל המשתמשים", "offboarding תוך 24 שעות"), ונותנות למבקר portal. <strong>AWS Audit Manager</strong> עושה את המיפוי בצד של AWS באופן מובנה.</li>
</ul>
<pre># CI: fail the PR if Terraform breaks a control (and the result is evidence)
$ checkov -d infra/ --framework terraform --compact --quiet
Check: CKV_AWS_19: "Ensure the S3 bucket has server-side-encryption enabled"
        FAILED for resource: aws_s3_bucket.exports
Check: CKV_AWS_67: "Ensure CloudTrail is enabled in all Regions"
        PASSED for resource: aws_cloudtrail.org

# detect: org-wide compliance at a glance
$ aws securityhub get-findings --filters \
    '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
    --query 'Findings[].[AwsAccountId,Title]' --output table
$ aws configservice get-compliance-summary-by-config-rule</pre>
<blockquote>⚠️ Production tip: כלי compliance הוא מראה, לא תיקון. צוותים שמחברים Vanta ואז מסמנים בדיקות כ-"not applicable" כדי לקבל dashboard ירוק נכשלים ב-sample של Type II. תתייחס לכל בדיקה שנכשלת כמו לבאג עם owner ו-SLA, ותחזיק רישום exceptions מתועד (מי קיבל את הסיכון, ועד מתי).</blockquote>`
      }
    },
    {
      h: { en: "Keeping compliance from slowing engineering", he: "איך compliance לא מאט את ההנדסה" },
      body: {
        en: `<ul>
<li><strong>Make the paved road the compliant road.</strong> If the golden-path Terraform module creates encrypted, logged, tagged, backed-up resources by default, every team is compliant without reading the control list. Compliance becomes a platform feature.</li>
<li><strong>Use controls you already need.</strong> Branch protection + required CI = change management. SSO + SCIM = joiner/leaver. Org CloudTrail with Object Lock = audit logging. Don't invent a separate "CAB meeting" when the PR <em>is</em> the change record.</li>
<li><strong>Shrink scope.</strong> Separate accounts for regulated data, tokenization for cards, a small set of services that touch PHI. Ten in-scope services are auditable; three hundred are a year of pain.</li>
<li><strong>Automate evidence, not screenshots.</strong> Every control should have a query or API call that produces its evidence for any date range.</li>
<li><strong>Write the controls you actually do.</strong> Policies that promise "all access reviewed monthly" when you do it quarterly create findings. Auditors test what you wrote.</li>
<li><strong>Put security reviews where decisions are made.</strong> A threat model / data classification step in the design doc template costs 30 minutes; retrofitting encryption or data residency after launch costs a quarter.</li>
<li><strong>Have one owner.</strong> A compliance lead (or GRC engineer) owns the calendar, the auditor relationship and the control matrix; engineering owns the controls in their systems. Ambiguous ownership is how evidence goes missing in month 11.</li>
</ul>
<blockquote>💡 Real world: a mature SaaS company running SOC 2 + ISO 27001 + PCI SAQ A typically spends a few engineer-weeks per year on audits — not because the bar is low, but because 90% of controls are enforced in IaC and pipelines and evidence is pulled by tooling. The companies that suffer are those whose controls live in people's heads.</blockquote>`,
        he: `<ul>
<li><strong>תהפוך את הדרך הסלולה לדרך שעומדת ב-compliance.</strong> אם מודול ה-Terraform של ה-golden path יוצר כברירת מחדל resources מוצפנים, עם לוגים, tags וגיבוי, כל צוות עומד בדרישות בלי לקרוא את רשימת ה-controls. ה-compliance הופך לפיצ'ר של הפלטפורמה.</li>
<li><strong>תשתמש ב-controls שאתה ממילא צריך.</strong> Branch protection ועוד CI חובה = ‏change management. ‏SSO ועוד SCIM = ‏joiner/leaver. ‏CloudTrail ארגוני עם Object Lock = ‏audit logging. אל תמציא "ישיבת CAB" נפרדת כשה-PR <em>הוא</em> רשומת השינוי.</li>
<li><strong>תצמצם scope.</strong> חשבונות נפרדים למידע מפוקח, ‏tokenization לכרטיסים, קבוצה קטנה של שירותים שנוגעים ב-PHI. עשרה שירותים ב-scope אפשר לבקר; שלוש מאות הם שנה של כאב.</li>
<li><strong>תעשה אוטומציה לראיות, לא צילומי מסך.</strong> לכל control צריכה להיות שאילתה או קריאת API שמפיקה את הראיה לכל טווח תאריכים.</li>
<li><strong>תכתוב את ה-controls שאתה באמת עושה.</strong> Policies שמבטיחים "כל הגישות נסקרות כל חודש" כשאתה עושה את זה כל רבעון יוצרים ממצאים. מבקרים בודקים את מה שכתבת.</li>
<li><strong>תשים את ה-security reviews איפה שמקבלים החלטות.</strong> שלב של threat model וסיווג מידע בתבנית של ה-design doc עולה 30 דקות; להוסיף הצפנה או data residency בדיעבד אחרי launch עולה רבעון.</li>
<li><strong>שיהיה owner אחד.</strong> Compliance lead (או מהנדס GRC) אחראי על לוח הזמנים, על הקשר עם המבקר ועל ה-control matrix; ההנדסה אחראית על ה-controls במערכות שלה. בעלות לא ברורה היא הדרך שבה ראיות נעלמות בחודש ה-11.</li>
</ul>
<blockquote>💡 Real world: חברת SaaS בוגרת שמריצה SOC 2 ועוד ISO 27001 ועוד PCI SAQ A מוציאה בדרך כלל כמה שבועות-מהנדס בשנה על audits — לא כי הרף נמוך, אלא כי 90% מה-controls נאכפים ב-IaC וב-pipelines והראיות נשלפות על ידי כלים. החברות שסובלות הן אלה שה-controls שלהן חיים בראש של אנשים.</blockquote>`
      }
    }
  ],
  diagram: "  frameworks (SOC 2, ISO 27001, PCI, HIPAA, GDPR)\n            | map once\n            v\n     common control set  -->  owners + SLAs\n            |\n  prevent: SCP/RCP, IaC checks, admission\n  detect:  AWS Config, Security Hub, SIEM\n  collect: Vanta/Drata/Audit Manager <- cloud, git, IdP, HRIS, tickets\n            |\n            v\n   auditor: population -> sample (25-40) -> evidence per item",
  handsOn: [
    { cmd: "gh api repos/OWNER/REPO/branches/main/protection --jq '.required_pull_request_reviews, .required_status_checks.contexts'", what: { en: "Pull change-management evidence directly from branch protection settings.", he: "לשלוף ראיות של change management ישירות מהגדרות ה-branch protection." } },
    { cmd: "aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 -d | head", what: { en: "Population for an access review: every IAM user, password/MFA status, key ages and last use.", he: "Population ל-access review: כל IAM user, מצב סיסמה ו-MFA, גיל ה-keys ושימוש אחרון." } },
    { cmd: "aws configservice describe-compliance-by-config-rule --compliance-types NON_COMPLIANT", what: { en: "Which Config rules (encryption, logging, public access) currently fail.", he: "אילו חוקי Config ‏(הצפנה, לוגים, גישה ציבורית) נכשלים כרגע." } },
    { cmd: "checkov -d infra/ --framework terraform --compact", what: { en: "Run IaC policy checks locally the same way CI does; failures map to control IDs.", he: "להריץ בדיקות policy על ה-IaC מקומית, כמו ש-CI עושה; כישלונות ממופים ל-IDs של controls." } }
  ],
  mnemonic: {
    en: "Auditors ask 'show me', not 'tell me': access, change, crypto, logs, backups, vulns, incidents — enforced in code, evidenced by API, scope kept small.",
    he: "מבקרים אומרים 'תראה לי', לא 'תספר לי': גישה, שינויים, הצפנה, לוגים, גיבויים, חולשות, אירועים — נאכף בקוד, מוכח דרך API, וה-scope נשאר קטן."
  },
  pitfalls: [
    { en: "Writing aspirational policies ('monthly access reviews', '7-day critical patching') you don't follow. Type II tests what you wrote; every miss is a finding.", he: "לכתוב policies שאפתניים ('access reviews כל חודש', 'patching לקריטיות תוך 7 ימים') שאתה לא עומד בהם. ‏Type II בודק את מה שכתבת; כל פספוס הוא ממצא." },
    { en: "Letting card data or PHI leak into logs, analytics or a shared cluster, silently pulling those systems into scope.", he: "לתת לנתוני כרטיסים או ל-PHI לדלוף ללוגים, לאנליטיקה או לקלאסטר משותף, ובשקט להכניס את המערכות האלה ל-scope." },
    { en: "Treating 'backups enabled' as 'backups tested'. Auditors (and reality) want a dated restore with verification.", he: "להתייחס ל-'גיבויים מופעלים' כאילו זה 'גיבויים נבדקו'. מבקרים (והמציאות) רוצים שחזור מתוארך עם אימות." },
    { en: "Bypassing branch protection for emergencies with no logged break-glass process — every hotfix becomes an audit exception.", he: "לעקוף branch protection במקרי חירום בלי תהליך break-glass מתועד — כל hotfix הופך ל-exception ב-audit." }
  ],
  interview: [
    {
      q: { en: "What's the difference between SOC 2 Type I and Type II, and why does it matter to engineering?", he: "מה ההבדל בין SOC 2 Type I ל-Type II, ולמה זה משנה להנדסה?" },
      a: {
        en: "Type I says your controls are suitably designed at one date; Type II says they operated effectively over a period, usually 6-12 months, tested by sampling. For engineering, Type II means controls must run every single time — every prod change reviewed, every leaver offboarded within SLA — and leave evidence. That pushes you to enforce controls in code (branch protection, SCIM, IaC guardrails) rather than relying on people remembering.",
        he: "Type I אומר שה-controls שלך מתוכננים כראוי בתאריך אחד; Type II אומר שהם פעלו ביעילות לאורך תקופה, בדרך כלל 6-12 חודשים, ונבדקים בדגימה. להנדסה, Type II אומר שה-controls חייבים לרוץ כל פעם מחדש — כל שינוי ב-prod עבר review, כל עוזב עבר offboarding בתוך ה-SLA — ולהשאיר ראיות. זה דוחף לאכוף controls בקוד (branch protection, ‏SCIM, ‏guardrails ב-IaC) במקום לסמוך על זה שאנשים יזכרו."
      }
    },
    {
      q: { en: "Your company is about to start accepting card payments. How do you keep PCI from swallowing the platform?", he: "החברה שלך עומדת להתחיל לקבל תשלומים בכרטיס אשראי. איך מונעים מ-PCI לבלוע את הפלטפורמה?" },
      a: {
        en: "Never let PAN reach our systems: use the processor's hosted payment page or iframe-hosted fields so the browser sends card data straight to the processor and we only store tokens. That typically means SAQ A. Add payment-page script integrity controls for v4.0, scan logs for PANs, and if we ever must handle PAN, isolate it in a separate account/VPC/cluster with segmentation testing so the rest of the platform stays out of scope.",
        he: "לא לתת ל-PAN להגיע למערכות שלנו: להשתמש ב-hosted payment page של ה-processor או בשדות שמתארחים ב-iframe, כך שהדפדפן שולח את נתוני הכרטיס ישירות ל-processor ואנחנו שומרים רק tokens. זה בדרך כלל אומר SAQ A. להוסיף controls של integrity לסקריפטים בדף התשלום בשביל גרסה 4.0, לסרוק לוגים לחיפוש PANs, ואם אי פעם נצטרך לטפל ב-PAN, לבודד אותו בחשבון, ‏VPC וקלאסטר נפרדים עם segmentation testing כדי ששאר הפלטפורמה תישאר מחוץ ל-scope."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Which report shows that controls operated effectively over a period of months?", he: "איזה דוח מראה שה-controls פעלו ביעילות לאורך תקופה של חודשים?" },
      options: [
        { en: "SOC 2 Type I", he: "SOC 2 Type I" },
        { en: "SOC 2 Type II", he: "SOC 2 Type II" },
        { en: "A penetration test report", he: "דוח pen test" },
        { en: "A GDPR certificate", he: "תעודת GDPR" }
      ],
      answer: 1,
      explain: { en: "Type II covers operating effectiveness over a period (3-12 months). Type I is design at a point in time. GDPR has no general certificate.", he: "Type II מכסה יעילות תפעולית לאורך תקופה (3-12 חודשים). Type I הוא תכנון בנקודת זמן. ל-GDPR אין תעודה כללית." }
    },
    {
      q: { en: "What most effectively reduces PCI DSS scope for a web checkout?", he: "מה הכי מצמצם את ה-scope של PCI DSS ב-checkout באתר?" },
      options: [
        { en: "Encrypting the database that stores card numbers", he: "להצפין את הדאטהבייס ששומר את מספרי הכרטיסים" },
        { en: "Hosted payment fields/page plus tokenization so card data never touches your servers", he: "שדות או דף תשלום מתארחים ועוד tokenization, כך שנתוני הכרטיס אף פעם לא נוגעים בשרתים שלך" },
        { en: "Running the checkout on Kubernetes", he: "להריץ את ה-checkout על Kubernetes" },
        { en: "Adding a WAF", he: "להוסיף WAF" }
      ],
      answer: 1,
      explain: { en: "Encrypted PAN is still PAN in scope. If card data goes browser → processor and you store only tokens, most of your platform is out of scope (often SAQ A).", he: "PAN מוצפן הוא עדיין PAN ב-scope. אם נתוני הכרטיס הולכים מהדפדפן ישר ל-processor ואתה שומר רק tokens, רוב הפלטפורמה שלך מחוץ ל-scope (לרוב SAQ A)." }
    },
    {
      q: { en: "An auditor asks for evidence of change management. What is the strongest evidence?", he: "מבקר מבקש ראיות ל-change management. מה הראיה הכי חזקה?" },
      options: [
        { en: "A written policy saying all changes are reviewed", he: "policy כתוב שאומר שכל השינויים עוברים review" },
        { en: "Screenshots of a few PRs taken the week before the audit", he: "צילומי מסך של כמה PRs שצולמו שבוע לפני ה-audit" },
        { en: "Enforced branch protection plus, for sampled deploys, the PR approval, green CI and pipeline deploy log", he: "Branch protection שנאכף, ועבור ה-deploys שנדגמו: אישור ה-PR, ‏CI ירוק ולוג ה-deploy מה-pipeline" },
        { en: "A statement from the CTO", he: "הצהרה של ה-CTO" }
      ],
      answer: 2,
      explain: { en: "Auditors want proof the control operated for each sampled item, ideally enforced by the system so it couldn't be skipped.", he: "מבקרים רוצים הוכחה שה-control פעל לכל פריט שנדגם, ועדיף שהוא נאכף על ידי המערכת כך שאי אפשר היה לדלג עליו." }
    },
    {
      q: { en: "Under GDPR, how quickly must a personal-data breach generally be reported to the supervisory authority?", he: "לפי GDPR, תוך כמה זמן צריך בדרך כלל לדווח לרשות הפיקוח על דליפת מידע אישי?" },
      options: [
        { en: "Within 24 hours", he: "תוך 24 שעות" },
        { en: "Within 72 hours of becoming aware", he: "תוך 72 שעות מרגע שנודע" },
        { en: "Within 30 days", he: "תוך 30 יום" },
        { en: "Only at the next annual audit", he: "רק ב-audit השנתי הבא" }
      ],
      answer: 1,
      explain: { en: "Article 33: notify without undue delay and, where feasible, within 72 hours. Your logging and IR process must make that possible.", he: "סעיף 33: לדווח בלי עיכוב מיותר, ובמידת האפשר תוך 72 שעות. הלוגים ותהליך ה-IR שלך צריכים לאפשר את זה." }
    }
  ],
  related: ["pr-security-ops", "pr-privacy", "cloud-landing-zones", "cloud-iam-security", "pr-backups-strategy", "staff-supply-chain"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  { term: "Patroni", track: "data", def: { en: "HA manager for PostgreSQL: an agent on each node that uses a leader key with a TTL in etcd/Consul/Kubernetes to decide the single primary and drive promotion, demotion and rejoin.", he: "מנהל HA ל-PostgreSQL: ‏agent על כל node שמשתמש ב-leader key עם TTL ב-etcd/Consul/Kubernetes כדי לקבוע primary יחיד ולנהל promotion, ‏demote והצטרפות מחדש." }, lesson: "db-postgres-ha-patroni" },
  { term: "DCS (Distributed Configuration Store)", track: "data", def: { en: "The consensus-backed key-value store (etcd, Consul, ZooKeeper, Kubernetes API) where Patroni keeps the leader key, member list and cluster config.", he: "ה-key-value store מבוסס ה-consensus ‏(etcd, ‏Consul, ‏ZooKeeper, ה-API של Kubernetes) שבו Patroni שומר את ה-leader key, רשימת החברים וקונפיג הקלאסטר." }, lesson: "db-postgres-ha-patroni" },
  { term: "Switchover", track: "data", def: { en: "A planned, controlled change of primary to a healthy replica with no data loss — unlike a failover, which reacts to a failure.", he: "החלפה מתוכננת ומבוקרת של ה-primary ל-replica בריא בלי איבוד מידע — בניגוד ל-failover, שמגיב לכשל." }, lesson: "db-postgres-ha-patroni" },
  { term: "etcd defragmentation", track: "kubernetes", def: { en: "Rewriting etcd's bbolt file to return space freed by compaction to the filesystem; blocks the member while running, so done one member at a time.", he: "שכתוב קובץ ה-bbolt של etcd כדי להחזיר ל-filesystem את המקום שהתפנה ב-compaction; חוסם את ה-member בזמן הריצה, ולכן עושים את זה member אחד בכל פעם." }, lesson: "k8s-etcd-apf" },
  { term: "API Priority and Fairness (APF)", track: "kubernetes", def: { en: "kube-apiserver feature that classifies requests (FlowSchema) into priority levels with guaranteed concurrency shares and fair queues, returning 429 instead of letting one client starve the rest.", he: "פיצ'ר של kube-apiserver שמסווג בקשות (FlowSchema) ל-priority levels עם נתחי concurrency מובטחים ותורים הוגנים, ומחזיר 429 במקום לתת ל-client אחד להרעיב את כל השאר." }, lesson: "k8s-etcd-apf" },
  { term: "FlowSchema", track: "kubernetes", def: { en: "APF object that matches requests by user/group/ServiceAccount, verb and resource and assigns them to a PriorityLevelConfiguration.", he: "אובייקט של APF שמתאים בקשות לפי user/group/ServiceAccount, ‏verb ו-resource ומשייך אותן ל-PriorityLevelConfiguration." }, lesson: "k8s-etcd-apf" },
  { term: "Permission boundary", track: "cloud", def: { en: "An AWS managed policy attached to a user or role as the maximum permissions it can ever have; it never grants anything by itself and enables safe delegation of IAM.", he: "managed policy ב-AWS שמחובר ל-user או role כהרשאות המקסימליות שיהיו לו אי פעם; הוא אף פעם לא נותן הרשאה בעצמו ומאפשר האצלה בטוחה של IAM." }, lesson: "cloud-aws-iam-deep" },
  { term: "Trust policy", track: "cloud", def: { en: "The resource-based policy on an IAM role that says which principals may assume it (sts:AssumeRole), often with conditions like ExternalId or PrincipalOrgID.", he: "ה-resource-based policy על IAM role שקובע אילו principals יכולים לעשות לו assume ‏(sts:AssumeRole), לרוב עם conditions כמו ExternalId או PrincipalOrgID." }, lesson: "cloud-aws-iam-deep" },
  { term: "ABAC (Attribute-Based Access Control)", track: "cloud", def: { en: "Granting access by matching attributes (tags) of the principal and the resource, e.g. aws:ResourceTag/team equals aws:PrincipalTag/team, instead of one policy per team.", he: "מתן גישה לפי התאמה בין מאפיינים (tags) של ה-principal ושל ה-resource, למשל aws:ResourceTag/team שווה ל-aws:PrincipalTag/team, במקום policy לכל צוות." }, lesson: "cloud-aws-iam-deep" },
  { term: "SOC 2", track: "staff", def: { en: "AICPA attestation report on controls against the Trust Services Criteria (Security plus optional Availability, Confidentiality, Processing Integrity, Privacy); Type I = design at a date, Type II = operation over a period.", he: "דוח attestation של AICPA על controls מול ה-Trust Services Criteria ‏(Security ועוד Availability, ‏Confidentiality, ‏Processing Integrity, ‏Privacy כאופציה); ‏Type I = תכנון בתאריך, ‏Type II = תפעול לאורך תקופה." }, lesson: "compliance-for-engineers" },
  { term: "PCI DSS", track: "staff", def: { en: "Card industry security standard (v4.0.1) with 12 requirements for systems that store, process or transmit cardholder data and anything connected to them (the CDE).", he: "תקן האבטחה של תעשיית הכרטיסים (גרסה 4.0.1) עם 12 דרישות למערכות ששומרות, מעבדות או מעבירות נתוני כרטיס ולכל מה שמחובר אליהן (ה-CDE)." }, lesson: "compliance-for-engineers" },
  { term: "ISO 27001", track: "staff", def: { en: "International certifiable standard for an information security management system (ISMS): risk-based, with 93 Annex A controls in the 2022 version and a 3-year certification cycle.", he: "תקן בינלאומי שניתן להסמיך למערכת ניהול אבטחת מידע (ISMS): מבוסס סיכונים, עם 93 controls ב-Annex A בגרסת 2022 ומחזור הסמכה של 3 שנים." }, lesson: "compliance-for-engineers" }
);

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "etcd-db-space-exceeded",
  icon: "🗄️",
  title: { en: "etcd is full: 'mvcc: database space exceeded'", he: "ה-etcd מלא: 'mvcc: database space exceeded'" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "14:20. Deploys are failing across the company. Argo CD shows every sync as 'Failed'. HPAs aren't scaling. Running Pods are still serving traffic. You run a quick apply on the self-managed cluster (kubeadm, 3 control-plane nodes).",
        he: "14:20. ה-deploys נכשלים בכל החברה. Argo CD מראה כל sync כ-'Failed'. ה-HPAs לא עושים scale. ה-Pods שרצים עדיין משרתים תעבורה. אתה מריץ apply מהיר על הקלאסטר ה-self-managed ‏(kubeadm, ‏3 control-plane nodes)."
      },
      data: "$ kubectl apply -f configmap.yaml\nError from server: error when creating \"configmap.yaml\": etcdserver: mvcc: database space exceeded\n\n$ kubectl get pods -n checkout\nNAME                        READY   STATUS    RESTARTS   AGE\ncheckout-7d9f8b6c5-2xkqp    1/1     Running   0          3d",
      choices: [
        { label: { en: "Check etcd status and alarms on all members", he: "לבדוק את ה-status וה-alarms של etcd על כל ה-members" }, next: "s2", score: 10,
          feedback: { en: "Right: the error comes straight from etcd. Confirm DB size vs quota and whether a NOSPACE alarm is raised.", he: "נכון: השגיאה מגיעה ישירות מ-etcd. תאמת את גודל ה-DB מול ה-quota ואם יש alarm של NOSPACE." } },
        { label: { en: "Restart all kube-apiserver static pods", he: "לעשות restart לכל ה-static pods של kube-apiserver" }, next: "s2", score: -10,
          feedback: { en: "The API server is fine; etcd refuses writes. The restart caused every controller and kubelet to re-LIST at once, adding load to an already stuck etcd. You lost 10 minutes.", he: "ה-API server תקין; ‏etcd מסרב לכתיבות. ה-restart גרם לכל controller ו-kubelet לעשות re-LIST בבת אחת, והוסיף עומס ל-etcd שכבר תקוע. הפסדת 10 דקות." } },
        { label: { en: "Delete /var/lib/etcd/member/wal on one node to free space", he: "למחוק את /var/lib/etcd/member/wal על node אחד כדי לפנות מקום" }, next: "lose", score: -30,
          feedback: { en: "Deleting WAL files corrupts that member and is not even the problem — the quota is on the logical DB size, not free disk.", he: "מחיקת קבצי WAL משחיתה את ה-member הזה, וזו אפילו לא הבעיה — ה-quota הוא על הגודל הלוגי של ה-DB, לא על המקום הפנוי בדיסק." } }
      ]
    },
    s2: {
      text: {
        en: "All three members report the same DB size, right at the default quota, and a NOSPACE alarm. etcd is now read-and-delete only.",
        he: "כל שלושת ה-members מדווחים על אותו גודל DB, בדיוק ב-quota ברירת המחדל, ועל alarm של NOSPACE. ‏etcd עכשיו במצב קריאה ומחיקה בלבד."
      },
      data: "$ etcdctl endpoint status -w table\n| ENDPOINT              | DB SIZE | IS LEADER | RAFT TERM |\n| https://10.0.0.5:2379 |  2.1 GB |      true |        41 |\n| https://10.0.0.6:2379 |  2.1 GB |     false |        41 |\n| https://10.0.0.7:2379 |  2.1 GB |     false |        41 |\n\n$ etcdctl alarm list\nmemberID:10276657743932975437 alarm:NOSPACE\n\n# Prometheus, last 6h\netcd_mvcc_db_total_size_in_use_in_bytes   ~ 1.2 GB -> 2.0 GB",
      choices: [
        { label: { en: "Find what is filling etcd before cleaning up", he: "למצוא מה ממלא את etcd לפני שמנקים" }, next: "s3", score: 10,
          feedback: { en: "Good: 'in use' grew too, so it isn't only history. If you compact and defrag without stopping the source, you'll be back here in an hour.", he: "טוב: גם ה-'in use' גדל, אז זו לא רק היסטוריה. אם תעשה compact ו-defrag בלי לעצור את המקור, תחזור לפה בעוד שעה." } },
        { label: { en: "Raise --quota-backend-bytes to 64 GB and restart etcd", he: "להעלות את --quota-backend-bytes ל-64 GB ולעשות restart ל-etcd" }, next: "s3", score: -10,
          feedback: { en: "Way beyond the 8 GiB suggested max; restarts of a huge DB are slow and you haven't found the cause. A rolling restart with a modest bump (e.g. 4-8 GiB) can be a bridge, but not 64 GB, and not first.", he: "הרבה מעבר למקסימום המומלץ של 8 GiB; ‏restarts של DB ענק איטיים ועוד לא מצאת את הסיבה. ‏rolling restart עם הגדלה צנועה (למשל 4-8 GiB) יכול להיות גשר, אבל לא 64 GB, ולא כצעד ראשון." } },
        { label: { en: "Restore last night's etcd snapshot", he: "לשחזר את ה-snapshot של etcd מאתמול בלילה" }, next: "lose", score: -30,
          feedback: { en: "Restoring rolls the whole cluster back hours: deployments, secrets, leases, PVC bindings. It's a disaster-recovery tool, not a cleanup tool — and the culprit would refill it anyway.", he: "שחזור מחזיר את כל הקלאסטר אחורה בשעות: deployments, ‏secrets, ‏leases, קישורי PVC. זה כלי ל-disaster recovery, לא כלי ניקוי — והגורם היה ממלא אותו שוב בכל מקרה." } }
      ]
    },
    s3: {
      text: {
        en: "apiserver_storage_objects shows one CRD exploding. A new 'reportjobs' operator, deployed this morning, creates a ReportRun object every few seconds and never deletes them.",
        he: "apiserver_storage_objects מראה CRD אחד שמתפוצץ. ‏operator חדש של 'reportjobs', שעלה הבוקר, יוצר אובייקט ReportRun כל כמה שניות ואף פעם לא מוחק אותם."
      },
      data: "$ kubectl get --raw /metrics | grep apiserver_storage_objects | sort -k2 -nr | head -4\napiserver_storage_objects{resource=\"reportruns.reports.acme.io\"} 412883\napiserver_storage_objects{resource=\"events\"} 48211\napiserver_storage_objects{resource=\"pods\"} 6120\napiserver_storage_objects{resource=\"secrets\"} 3904",
      choices: [
        { label: { en: "Scale the reportjobs operator to 0, then bulk-delete old ReportRuns (deletes are allowed)", he: "לעשות scale ל-0 ל-operator של reportjobs, ואז מחיקה המונית של ReportRuns ישנים (מחיקות מותרות)" }, next: "s4", score: 15,
          feedback: { en: "Stop the bleeding first. Scale is a write and may fail under NOSPACE — if so, stop it at the source (remove its RBAC binding or kill the process on the node). Deletes work even with the alarm and free logical space.", he: "קודם עוצרים את הדימום. ‏scale הוא כתיבה ועלול להיכשל תחת NOSPACE — אם כן, תעצור אותו במקור (להסיר את ה-RBAC binding שלו או להרוג את התהליך על ה-node). מחיקות עובדות גם עם ה-alarm ומפנות מקום לוגי." } },
        { label: { en: "Delete the whole CRD to remove everything at once", he: "למחוק את כל ה-CRD כדי להסיר הכול בבת אחת" }, next: "s4", score: -5,
          feedback: { en: "It works, but you also deleted the operator's API and every legitimate report config, and the team now has to restore their CRs from Git. A sledgehammer when a scalpel was available.", he: "זה עובד, אבל מחקת גם את ה-API של ה-operator וכל קונפיג דוחות לגיטימי, והצוות צריך עכשיו לשחזר את ה-CRs שלו מ-Git. פטיש כשהיה זמין אזמל." } }
      ]
    },
    s4: {
      text: {
        en: "The operator is stopped and 400k ReportRuns are deleted. But etcd still reports 2.1 GB and the alarm is still active: deletes only add tombstones and free pages inside the file.",
        he: "ה-operator עצור ו-400k ‏ReportRuns נמחקו. אבל etcd עדיין מדווח 2.1 GB וה-alarm עדיין פעיל: מחיקות רק מוסיפות tombstones ומפנות דפים בתוך הקובץ."
      },
      data: "$ etcdctl endpoint status --write-out=json | grep -o '\"revision\":[0-9]*' | head -1\n\"revision\":184220931\n$ etcdctl alarm list\nmemberID:10276657743932975437 alarm:NOSPACE",
      choices: [
        { label: { en: "etcdctl compact 184220931, then defrag each member one at a time (followers first, leader last)", he: "etcdctl compact 184220931, ואז defrag לכל member אחד אחד (followers קודם, ה-leader אחרון)" }, next: "s5", score: 15,
          feedback: { en: "Compaction drops old revisions; defrag returns the space. One member at a time keeps quorum and the API responsive.", he: "Compaction זורק revisions ישנים; ‏defrag מחזיר את המקום. member אחד בכל פעם שומר על quorum ועל API שמגיב." } },
        { label: { en: "etcdctl defrag --cluster right away", he: "etcdctl defrag --cluster מיד" }, next: "s5", score: -10,
          feedback: { en: "Without compaction first, there's little to reclaim — and --cluster blocks all members at once. The API server timed out for 40 seconds and leader election in kube-controller-manager flapped.", he: "בלי compaction קודם, אין הרבה מה להחזיר — ו-‎--cluster חוסם את כל ה-members בבת אחת. ה-API server עשה timeout ל-40 שניות וה-leader election של kube-controller-manager התחיל לרצד." } }
      ]
    },
    s5: {
      text: {
        en: "DB size is down to 610 MB on all members. kubectl apply still fails with the same error.",
        he: "גודל ה-DB ירד ל-610 MB על כל ה-members. ‏kubectl apply עדיין נכשל עם אותה שגיאה."
      },
      data: "$ etcdctl endpoint status -w table\n| https://10.0.0.5:2379 | 610 MB | true  |\n| https://10.0.0.6:2379 | 608 MB | false |\n| https://10.0.0.7:2379 | 609 MB | false |\n$ kubectl apply -f configmap.yaml\nError from server: etcdserver: mvcc: database space exceeded",
      choices: [
        { label: { en: "etcdctl alarm disarm, then verify a write and watch Argo CD resync", he: "etcdctl alarm disarm, ואז לאמת כתיבה ולראות את Argo CD עושה resync" }, next: "s6", score: 15,
          feedback: { en: "The NOSPACE alarm is sticky: it stays until you explicitly disarm it, even after space is reclaimed.", he: "ה-alarm של NOSPACE דביק: הוא נשאר עד שעושים לו disarm במפורש, גם אחרי שהמקום חזר." } },
        { label: { en: "Defrag again; it must not have worked", he: "לעשות defrag שוב; כנראה זה לא עבד" }, next: "s5", score: -5,
          feedback: { en: "The size is clearly down. The alarm is what's still blocking writes.", he: "הגודל בבירור ירד. ה-alarm הוא מה שעדיין חוסם כתיבות." } }
      ]
    },
    s6: {
      text: {
        en: "Writes work, Argo CD is syncing, HPAs scale again. Time to make sure this never pages anyone again. What goes into the postmortem actions?",
        he: "כתיבות עובדות, Argo CD עושה sync, ה-HPAs עושים scale שוב. הגיע הזמן לוודא שזה לעולם לא יעיר אף אחד שוב. מה נכנס ל-action items של ה-postmortem?"
      },
      choices: [
        { label: { en: "Alert at 80% of quota, a ResourceQuota on count/reportruns.reports.acme.io, a TTL/cleanup in the operator, and an APF lane for it", he: "התראה ב-80% מה-quota, ‏ResourceQuota על count/reportruns.reports.acme.io, ‏TTL או ניקוי ב-operator, ונתיב APF משלו" }, next: "win", score: 15,
          feedback: { en: "Detect early, cap object counts per namespace, fix the leak at the source, and fence the controller so it can't overload the API server either.", he: "לזהות מוקדם, להגביל כמות אובייקטים ל-namespace, לתקן את הדליפה במקור, ולגדר את ה-controller כדי שגם לא יוכל להעמיס על ה-API server." } },
        { label: { en: "Set the quota to 8 GiB and move on", he: "לקבוע את ה-quota ל-8 GiB ולהמשיך הלאה" }, next: "lose", score: -10,
          feedback: { en: "A bigger tank with the same leak just means a bigger, slower outage next time — and no alert to warn you.", he: "מיכל גדול יותר עם אותה דליפה רק אומר תקלה גדולה ואיטית יותר בפעם הבאה — ובלי התראה שתזהיר אותך." } }
      ]
    },
    win: {
      text: {
        en: "Resolved in 48 minutes with no data loss and no rollback. The postmortem adds an etcd quota alert, object-count ResourceQuotas for CRDs, a weekly automated defrag, and an operator review checklist item: 'what deletes the objects you create?'",
        he: "נפתר תוך 48 דקות, בלי איבוד מידע ובלי rollback. ה-postmortem מוסיף התראה על ה-quota של etcd, ‏ResourceQuotas על כמות אובייקטים ל-CRDs, ‏defrag אוטומטי שבועי, ושאלה בצ'קליסט של review ל-operators: 'מה מוחק את האובייקטים שאתה יוצר?'"
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The cluster is worse than when you started: either a corrupted member, a control plane rolled back hours, or the same outage waiting to recur. Remember the sequence: find and stop the source → delete → compact → defrag one member at a time → alarm disarm → alert and quota.",
        he: "הקלאסטר במצב גרוע יותר ממה שהיה כשהתחלת: או member מושחת, או control plane שחזר שעות אחורה, או אותה תקלה שמחכה לחזור. תזכור את הסדר: למצוא ולעצור את המקור ← למחוק ← compact ← ‏defrag ל-member אחד בכל פעם ← alarm disarm ← התראה ו-quota."
      },
      end: "lose"
    }
  },
  lessons: ["k8s-etcd-apf", "k8s-operators-crds", "k8s-architecture"]
});
