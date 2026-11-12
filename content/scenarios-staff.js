// On-call scenarios: senior / staff-level distributed-systems incidents (choose-your-own-adventure)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.scenarios = window.INFRA.scenarios || [];

(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  /* ------------------------------------------------------------------ 1 */
  window.INFRA.scenarios.push({
    id: "retry-storm-metastable",
    icon: "🌪️",
    title: t("A 20-second DB blip that won't end: retry storm", "תקלת DB של 20 שניות שלא נגמרת: סערת retries"),
    start: "s1",
    steps: {
      s1: {
        text: t("11:42. At 11:25 the orders Postgres did a planned 20-second failover. The DB is back and healthy on paper — but 17 minutes later checkout still returns 40% errors. You are the incident commander.",
                "11:42. ב-11:25 ה-Postgres של orders עשה failover מתוכנן של 20 שניות. ה-DB חזר ובריא על הנייר — אבל 17 דקות אחרי, checkout עדיין מחזיר 40% שגיאות. אתה ה-incident commander."),
        data: `orders-db (new primary)   CPU 99%   active_connections 1,980 / 2,000   p99 query 4.8s (normal 25ms)
checkout-api              pods 60/60 Ready   5xx 41%   p99 9.9s (timeout 10s)
api-gateway               incoming RPS 31,400   (same hour yesterday: 10,900)
marketing                 "no campaign running"`,
        choices: [
          c("Break down the incoming 31k RPS: how much is new user traffic vs retries?", "לפרק את ה-31k RPS הנכנסים: כמה זו תעבורת משתמשים חדשה וכמה retries?", "s2", 15,
            "Exactly the right question. Traffic tripled with no campaign — that smells like the system generating its own load.",
            "בדיוק השאלה הנכונה. התעבורה שילשה את עצמה בלי קמפיין — זה מריח כמו מערכת שמייצרת לעצמה עומס."),
          c("Scale checkout-api from 60 to 150 pods", "להגדיל את checkout-api מ-60 ל-150 pods", "s1b", -10,
            "More pods means more connection pools and more concurrent retries against a DB that is already the bottleneck. You just added fuel.",
            "יותר pods זה יותר connection pools ויותר retries מקבילים מול DB שהוא כבר צוואר הבקבוק. הוספת דלק למדורה."),
          c("Fail over the DB again — the new primary must be broken", "לעשות שוב failover ל-DB — ה-primary החדש כנראה שבור", "s1b", -10,
            "The new primary is fine; it is drowning in work. Another failover adds another blip and another wave of retries.",
            "ה-primary החדש תקין; הוא טובע בעבודה. עוד failover מוסיף עוד הפסקה ועוד גל של retries.")
        ]
      },
      s1b: {
        text: t("Five minutes later it's worse: DB connections are pinned at 2,000, p99 hits the 10 s timeout, error rate 58%. A VP joins the bridge asking for an ETA.",
                "חמש דקות אחר כך זה גרוע יותר: ה-connections ל-DB תקועים על 2,000, ה-p99 נוגע ב-timeout של 10 שניות, error rate של 58%. VP מצטרף ל-bridge ושואל מתי זה נגמר."),
        choices: [
          c("Stop changing things and look at what the traffic actually is", "להפסיק לשנות דברים ולבדוק מה התעבורה בעצם", "s2", 5,
            "Good recovery. In metastable failures, every capacity-adding action without understanding the load loop tends to make it worse.",
            "התאוששות טובה. בתקלות metastable, כל פעולה שמוסיפה קיבולת בלי להבין את לולאת העומס נוטה להחמיר.")
        ]
      },
      s2: {
        text: t("The gateway logs and client headers tell the story: most requests are retries, multiplied at every layer.",
                "הלוגים של ה-gateway וה-headers מה-clients מספרים את הסיפור: רוב הבקשות הן retries, שמוכפלות בכל שכבה."),
        data: `$ gateway-stats --window 5m --group-by x-retry-attempt
attempt=0   10,600 rps
attempt=1    9,800 rps
attempt=2    8,900 rps
attempt=3    2,100 rps

retry config (per layer, no jitter, fixed 100ms delay):
  mobile app SDK       -> 3 retries on 5xx/timeout
  api-gateway          -> 2 retries on 502/503/504
  checkout-api -> orders-db client -> 3 retries on timeout
worst case amplification: 4 x 3 x 4 = 48 DB attempts per user click`,
        choices: [
          c("Shed load at the gateway: cap checkout to ~11k RPS and return fast 503 + Retry-After for the rest", "לעשות load shedding ב-gateway: להגביל checkout ל-~11k RPS ולהחזיר 503 מהיר עם Retry-After לשאר", "s3", 15,
            "Right. The system is stuck in a bad stable state: work arrives faster than it can complete because failed work comes back as more work. You must drop load below capacity to let queues drain.",
            "נכון. המערכת תקועה במצב יציב רע: עבודה מגיעה מהר יותר ממה שאפשר לסיים כי עבודה שנכשלה חוזרת כעוד עבודה. חייבים להוריד את העומס מתחת לקיבולת כדי שהתורים יתרוקנו."),
          c("Raise max_connections on the DB from 2,000 to 5,000", "להעלות max_connections ב-DB מ-2,000 ל-5,000", "s2b", -10,
            "More connections mean more concurrent queries fighting for the same CPU and locks — throughput drops, latency rises. Postgres does better with fewer, busier connections.",
            "יותר connections זה יותר queries מקבילים שנלחמים על אותו CPU ואותם locks — ה-throughput יורד וה-latency עולה. Postgres עובד טוב יותר עם פחות connections עמוסים."),
          c("Restart all checkout-api pods at once to clear stuck connections", "לעשות restart לכל ה-pods של checkout-api בבת אחת כדי לנקות connections תקועים", "lose", -20,
            "60 pods come up simultaneously with cold caches, each opening a full pool and replaying queued client retries. The thundering herd pins the DB at 100% and takes the order flow fully down.",
            "60 pods עולים בבת אחת עם caches קרים, כל אחד פותח pool מלא ומקבל את כל ה-retries שחיכו. ה-thundering herd נועץ את ה-DB על 100% ומפיל את flow ההזמנות לגמרי.")
        ]
      },
      s2b: {
        text: t("The DB now has 3,400 connections, memory pressure starts, and lock waits double. p99 is pinned at the timeout. Nothing improved.",
                "ל-DB יש עכשיו 3,400 connections, מתחיל memory pressure וה-lock waits מוכפלים. ה-p99 תקוע על ה-timeout. שום דבר לא השתפר."),
        data: `orders-db  connections 3,412   lock_wait_p99 2.1s   CPU 100%   freeable memory 1.2 GB (was 9 GB)`,
        choices: [
          c("Revert max_connections and shed load at the gateway instead", "להחזיר את max_connections ולעשות load shedding ב-gateway במקום", "s3", 5,
            "Yes. You cannot add capacity out of a retry storm; you must reduce offered load.",
            "כן. אי אפשר להוסיף קיבולת כדי לצאת מסערת retries; חייבים להוריד את העומס המוצע.")
        ]
      },
      s3: {
        text: t("Shedding is on. Within 3 minutes DB connections fall to 600, p99 query time drops to 40 ms, and checkout success for admitted requests is 99.6%. 30% of users are getting a fast 'try again in a few seconds'. How do you shed smarter?",
                "ה-shedding פעיל. תוך 3 דקות ה-connections ל-DB יורדים ל-600, ה-p99 של queries יורד ל-40 ms, וההצלחה של checkout לבקשות שהתקבלו היא 99.6%. 30% מהמשתמשים מקבלים 'נסה שוב בעוד כמה שניות' מהיר. איך עושים shedding חכם יותר?"),
        choices: [
          c("Prioritise: shed retries (x-retry-attempt > 0) and non-critical calls (recommendations, history) first; keep first-attempt checkouts", "לתעדף: לזרוק קודם retries (x-retry-attempt > 0) וקריאות לא קריטיות (המלצות, היסטוריה); לשמור על checkouts בניסיון ראשון", "s4", 15,
            "Excellent. Criticality-aware shedding keeps revenue flowing while removing exactly the self-generated load.",
            "מצוין. shedding שמודע לקריטיות שומר על ההכנסות ומסיר בדיוק את העומס שהמערכת ייצרה לעצמה."),
          c("Keep random shedding — it works, don't touch it", "להשאיר shedding רנדומלי — זה עובד, לא נוגעים", "s4", 5,
            "Acceptable while stabilising, but you're rejecting real buyers at the same rate as retry noise.",
            "סביר בזמן ייצוב, אבל אתה דוחה קונים אמיתיים באותו קצב כמו רעש של retries.")
        ]
      },
      s4: {
        text: t("12:05. The DB is calm, error rate under 1%. The shedding limit is still 11k RPS. Traffic outside is now ~12k RPS of mostly real users. How do you remove the limit?",
                "12:05. ה-DB רגוע, error rate מתחת ל-1%. מגבלת ה-shedding עדיין על 11k RPS. התעבורה בחוץ עכשיו ~12k RPS, רובה משתמשים אמיתיים. איך מסירים את המגבלה?"),
        choices: [
          c("Raise the limit in steps (+10% every 2 minutes) while watching DB p99 and connection count", "להעלות את המגבלה במדרגות (+10% כל 2 דקות) תוך מעקב אחרי p99 של ה-DB ומספר ה-connections", "s5", 15,
            "Right. Recovery must be gradual; caches are still warming and the retry backlog in clients needs to drain without re-triggering the loop.",
            "נכון. ההתאוששות צריכה להיות הדרגתית; ה-caches עדיין מתחממים וה-backlog של retries ב-clients צריך להתרוקן בלי להפעיל שוב את הלולאה."),
          c("Remove the limit entirely — we're healthy", "להסיר את המגבלה לגמרי — אנחנו בריאים", "s4b", -10,
            "Every client that was told 'retry later' comes back at once. Classic re-entry into the metastable state.",
            "כל client שקיבל 'נסה מאוחר יותר' חוזר בבת אחת. כניסה חוזרת קלאסית למצב ה-metastable.")
        ]
      },
      s4b: {
        text: t("Within 90 seconds the gateway sees 26k RPS, DB p99 climbs to 3 s and errors return. You re-apply the limit and the system recovers again in 4 minutes.",
                "תוך 90 שניות ה-gateway רואה 26k RPS, ה-p99 של ה-DB מטפס ל-3 שניות והשגיאות חוזרות. אתה מחזיר את המגבלה והמערכת מתאוששת שוב תוך 4 דקות."),
        choices: [
          c("Ramp up gradually this time", "הפעם להעלות בהדרגה", "s5", 5,
            "Lesson learned the hard way: the trigger is gone, but the amplifier (retries) is still there.",
            "שיעור שנלמד בדרך הקשה: הטריגר נעלם, אבל המגבר (retries) עדיין שם.")
        ]
      },
      s5: {
        text: t("Stable at full traffic by 12:20. In the postmortem, the team asks for the main corrective action. Which plan do you push?",
                "יציב בתעבורה מלאה ב-12:20. ב-postmortem הצוות שואל מה פעולת התיקון העיקרית. איזו תוכנית אתה דוחף?"),
        choices: [
          c("Retry only at one layer, exponential backoff with full jitter, a retry budget (retries ≤ 10% of requests), circuit breakers, and adaptive concurrency limits at the gateway", "retries רק בשכבה אחת, exponential backoff עם full jitter, retry budget (retries ≤ 10% מהבקשות), circuit breakers ו-adaptive concurrency limits ב-gateway", "win", 20,
            "That removes the amplification loop itself. A 20 s blip should cost 20 s plus a short tail, not 55 minutes.",
            "זה מסיר את לולאת ההגברה עצמה. הפסקה של 20 שניות צריכה לעלות 20 שניות ועוד זנב קצר, לא 55 דקות."),
          c("Add two more read replicas and a bigger DB instance", "להוסיף עוד שתי read replicas ו-instance גדול יותר ל-DB", "s5b", -5,
            "Extra capacity raises the threshold, but 48x amplification will overwhelm any instance size after the next blip.",
            "קיבולת נוספת מעלה את הסף, אבל הגברה של פי 48 תכריע כל גודל instance אחרי ההפסקה הבאה.")
        ]
      },
      s5b: {
        text: t("A staff engineer pushes back: 'The trigger was a 20 s blip. The outage was 55 minutes. What sustained it?' The team rewrites the action items around retry policy and load shedding.",
                "מהנדס staff מתעקש: 'הטריגר היה הפסקה של 20 שניות. ה-outage היה 55 דקות. מה החזיק אותו?' הצוות כותב מחדש את ה-action items סביב מדיניות retries ו-load shedding."),
        choices: [
          c("Agree and adopt retry budgets + backoff + shedding as the primary fix", "להסכים ולאמץ retry budgets, backoff ו-shedding כתיקון העיקרי", "win", 5,
            "Right — fix the sustaining effect, not just the trigger.",
            "נכון — מתקנים את האפקט שמחזיק את התקלה, לא רק את הטריגר.")
        ]
      },
      win: {
        text: t("Resolved. You recognised a metastable failure: the trigger was gone in 20 s, but retries kept offered load above capacity. You shed load by priority, recovered gradually, and fixed the amplifier with retry budgets, jittered backoff and admission control.",
                "נפתר. זיהית תקלה metastable: הטריגר נעלם אחרי 20 שניות, אבל ה-retries החזיקו את העומס המוצע מעל הקיבולת. עשית shedding לפי עדיפות, התאוששת בהדרגה ותיקנת את המגבר עם retry budgets, backoff עם jitter ו-admission control."),
        end: "win"
      },
      lose: {
        text: t("Full outage for 35 more minutes. The simultaneous restart created a thundering herd. Lesson: in an overload, never synchronise clients — shed load first, then recover gradually.",
                "outage מלא לעוד 35 דקות. ה-restart המקביל יצר thundering herd. השיעור: בעומס יתר אף פעם לא מסנכרנים clients — קודם shedding, ואז התאוששות הדרגתית."),
        end: "lose"
      }
    },
    lessons: ["staff-overload-metastable", "arch-resilience", "db-operations", "rel-incident-management", "staff-cells-blast-radius"]
  });

  /* ------------------------------------------------------------------ 2 */
  window.INFRA.scenarios.push({
    id: "split-brain-failover",
    icon: "🧠",
    title: t("Failover gone wrong: two Postgres primaries", "Failover שהשתבש: שני primaries של Postgres"),
    start: "s1",
    steps: {
      s1: {
        text: t("02:14. A network partition isolates AZ-a for ~2 minutes. The in-house failover script, running in AZ-b, couldn't reach the primary db-a and promoted the async replica db-b. Alerts fire, then the dashboards look… surprisingly calm.",
                "02:14. network partition מבודד את AZ-a לבערך 2 דקות. סקריפט ה-failover הפנימי, שרץ ב-AZ-b, לא הצליח להגיע ל-primary db-a ועשה promote ל-replica האסינכרוני db-b. alerts קופצים, ואז ה-dashboards נראים… רגועים באופן מפתיע."),
        data: `02:13:51  failover-monitor[az-b]  db-a health check FAILED x3
02:14:02  failover-monitor[az-b]  promoting db-b (replay lag at promotion: 41.8s)
02:14:03  failover-monitor[az-b]  DNS orders-db.internal -> db-b (TTL 60)
02:16:10  network                 AZ-a connectivity restored
02:20:00  orders-api 5xx rate 0.3%   (normal)`,
        choices: [
          c("Check whether db-a is still accepting writes", "לבדוק אם db-a עדיין מקבל כתיבות", "s2", 15,
            "Yes. A failover script that cannot reach the old primary has no idea whether it's dead or just unreachable. Assume split-brain until proven otherwise.",
            "כן. סקריפט failover שלא מגיע ל-primary הישן לא יודע אם הוא מת או רק לא נגיש. מניחים split-brain עד שמוכח אחרת."),
          c("Error rate is normal — acknowledge and go back to sleep", "ה-error rate תקין — לעשות ack ולחזור לישון", "s1b", -15,
            "A calm dashboard after a partition-triggered failover is exactly what split-brain looks like: both sides happily accept writes.",
            "dashboard רגוע אחרי failover שנגרם מ-partition זה בדיוק איך ש-split-brain נראה: שני הצדדים מקבלים כתיבות בשמחה.")
        ]
      },
      s1b: {
        text: t("03:05. Support escalates: customers see orders appear and disappear depending on which page they refresh. Some order IDs show different items to different agents.",
                "03:05. Support מסלימים: לקוחות רואים הזמנות שמופיעות ונעלמות תלוי איזה דף הם מרעננים. חלק מה-order IDs מציגים פריטים שונים לנציגים שונים."),
        choices: [
          c("Check both databases now", "לבדוק את שני ה-DBs עכשיו", "s2", 0,
            "50 extra minutes of divergence. Every minute of split-brain makes reconciliation harder.",
            "50 דקות נוספות של התפצלות. כל דקה של split-brain הופכת את ה-reconciliation לקשה יותר.")
        ]
      },
      s2: {
        text: t("Both nodes think they are the primary. Pods in AZ-a still hold pooled connections to db-a's IP and never re-resolved DNS.",
                "שני ה-nodes חושבים שהם ה-primary. pods ב-AZ-a עדיין מחזיקים connections ב-pool ל-IP של db-a ואף פעם לא עשו resolve מחדש ל-DNS."),
        data: `db-a=# SELECT pg_is_in_recovery(), pg_current_wal_lsn();
 f | 3A/9F12C4E8
db-a=# SELECT count(*) FROM orders WHERE created_at > '02:14:02';
 1,183

db-b=# SELECT pg_is_in_recovery(), timeline_id FROM pg_control_checkpoint();
 f | 8          -- promoted at LSN 3A/9C001A20 (timeline 7 -> 8)
db-b=# SELECT count(*) FROM orders WHERE created_at > '02:14:02';
 2,604

orders-api pods: 18 in AZ-a -> db-a   |   36 in AZ-b/c -> db-b`,
        choices: [
          c("Fence db-a now: block its port in the security group and set it read-only; keep db-b (the promoted, majority-serving node) as the single primary", "לגדר את db-a עכשיו: לחסום את ה-port שלו ב-security group ולהפוך אותו ל-read-only; להשאיר את db-b (ה-node שקודם ומשרת את הרוב) כ-primary יחיד", "s3", 15,
            "Correct priority: stop the divergence first, reconcile later. Pick the side that the automation, DNS and most traffic already agree on.",
            "סדר עדיפויות נכון: קודם עוצרים את ההתפצלות, אחר כך reconciliation. בוחרים בצד שהאוטומציה, ה-DNS ורוב התעבורה כבר מסכימים עליו."),
          c("Demote db-b and point everything back to db-a — it was the 'real' primary", "לעשות demote ל-db-b ולהחזיר הכל ל-db-a — הוא היה ה-primary 'האמיתי'", "s3", -5,
            "It stops the split, but you discard 2,604 orders' worth of writes from two thirds of traffic, and fight the automation and DNS. Possible, but the more expensive side to lose.",
            "זה עוצר את הפיצול, אבל אתה זורק כתיבות של 2,604 הזמנות משני שליש מהתעבורה, ונלחם באוטומציה וב-DNS. אפשרי, אבל זה הצד היקר יותר לאבד."),
          c("Leave both running while you write a merge script", "להשאיר את שניהם רצים בזמן שכותבים סקריפט merge", "s2b", -15,
            "Every minute adds more conflicting writes. Fencing is step one, always.",
            "כל דקה מוסיפה עוד כתיבות מתנגשות. גידור זה תמיד צעד ראשון.")
        ]
      },
      s2b: {
        text: t("20 minutes later: 600 more orders on db-a, including 40 with order IDs that collide with db-b (both nodes advanced the same sequence).",
                "20 דקות אחר כך: עוד 600 הזמנות ב-db-a, כולל 40 עם order IDs שמתנגשים ב-db-b (שני ה-nodes קידמו את אותו sequence)."),
        choices: [
          c("Fence db-a immediately", "לגדר את db-a מיד", "s3", 5,
            "Late, but correct. The conflict count just grew.",
            "מאוחר, אבל נכון. מספר ההתנגשויות רק גדל.")
        ]
      },
      s3: {
        text: t("db-a is fenced. But the 18 orders-api pods in AZ-a now throw connection errors — their pools still point at db-a's IP.",
                "db-a מגודר. אבל 18 ה-pods של orders-api ב-AZ-a זורקים עכשיו שגיאות connection — ה-pools שלהם עדיין מצביעים על ה-IP של db-a."),
        choices: [
          c("Rolling-restart orders-api in AZ-a so the pools re-resolve to db-b", "לעשות rolling restart ל-orders-api ב-AZ-a כדי שה-pools יעשו resolve מחדש ל-db-b", "s4", 15,
            "Right. Connection pools don't follow DNS changes on their own; a controlled restart (or a pool refresh) fixes it.",
            "נכון. connection pools לא עוקבים אחרי שינויי DNS לבד; restart מבוקר (או רענון pool) פותר את זה."),
          c("Wait for DNS TTL (60 s) to expire", "לחכות שה-DNS TTL (60 שניות) יפוג", "s3b", -5,
            "TTL only matters when a new connection resolves the name. Long-lived pooled connections never ask again.",
            "TTL רלוונטי רק כש-connection חדש עושה resolve לשם. connections ארוכי-חיים ב-pool אף פעם לא שואלים שוב.")
        ]
      },
      s3b: {
        text: t("Five minutes later the AZ-a pods still fail — they're retrying the fenced IP. A third of checkout requests are failing.",
                "חמש דקות אחר כך ה-pods ב-AZ-a עדיין נכשלים — הם עושים retry ל-IP המגודר. שליש מבקשות ה-checkout נכשלות."),
        choices: [
          c("Rolling-restart them now", "לעשות להם rolling restart עכשיו", "s4", 5,
            "Fixed. Add to the postmortem: clients must connect through something that follows the leader (proxy / pgbouncer / Patroni-aware endpoint).",
            "תוקן. מוסיפים ל-postmortem: clients צריכים להתחבר דרך משהו שעוקב אחרי ה-leader (proxy / pgbouncer / endpoint שמכיר את Patroni).")
        ]
      },
      s4: {
        text: t("Traffic is healthy on db-b. Now: what about the writes that only exist on db-a — the 41.8 s of replication lag before promotion plus everything written after?",
                "התעבורה בריאה על db-b. עכשיו: מה עם הכתיבות שקיימות רק ב-db-a — ה-41.8 שניות של replication lag לפני ה-promote ועוד כל מה שנכתב אחרי?"),
        choices: [
          c("Snapshot db-a, then export every row changed after the divergence LSN 3A/9C001A20 for reconciliation", "לעשות snapshot ל-db-a, ואז לייצא כל שורה שהשתנתה אחרי ה-LSN של ההתפצלות 3A/9C001A20 ל-reconciliation", "s5", 15,
            "Preserve the evidence first. The divergence point (where timeline 8 began) tells you exactly which writes are at risk.",
            "קודם משמרים את הראיות. נקודת ההתפצלות (איפה ש-timeline 8 התחיל) אומרת בדיוק אילו כתיבות בסיכון."),
          c("Run pg_rewind on db-a right away so it can rejoin as a replica", "להריץ pg_rewind על db-a מיד כדי שיחזור כ-replica", "lose", -20,
            "pg_rewind rolls db-a back to the divergence point — it deletes exactly the 1,183+ orders you needed to recover. Customers were charged for orders that no longer exist anywhere.",
            "pg_rewind מגלגל את db-a אחורה לנקודת ההתפצלות — הוא מוחק בדיוק את ה-1,183+ הזמנות שהיית צריך לשחזר. לקוחות חויבו על הזמנות שכבר לא קיימות בשום מקום.")
        ]
      },
      s5: {
        text: t("The export shows 1,290 orders only on db-a. 1,251 can be re-applied cleanly; 39 have order IDs that now belong to different orders on db-b.",
                "הייצוא מראה 1,290 הזמנות שקיימות רק ב-db-a. 1,251 אפשר להחיל מחדש בלי בעיה; ל-39 יש order IDs ששייכים עכשיו להזמנות אחרות ב-db-b."),
        data: `recon summary (db-a after LSN 3A/9C001A20 vs db-b)
  orders only on db-a ............ 1,290
    no id conflict ............... 1,251   -> re-insert via orders-api replay (idempotency_key preserved)
    id conflict .................. 39      -> manual: new id + customer comms
  payments captured, no order .... 0 (after replay)`,
        choices: [
          c("Replay the 1,251 through the API with their original idempotency keys; hand the 39 conflicts to support with new IDs and customer comms", "לעשות replay ל-1,251 דרך ה-API עם ה-idempotency keys המקוריים; להעביר את 39 ההתנגשויות ל-support עם IDs חדשים ותקשורת ללקוחות", "s6", 15,
            "Replaying through the application keeps invariants (inventory, payments, events) intact; idempotency keys make it safe to re-run.",
            "Replay דרך האפליקציה שומר על האינווריאנטים (מלאי, תשלומים, events); ה-idempotency keys הופכים את זה לבטוח להרצה חוזרת."),
          c("INSERT the rows directly into db-b with SQL", "לעשות INSERT לשורות ישירות ל-db-b עם SQL", "s6", -5,
            "It restores rows but skips side effects: inventory isn't decremented, events aren't published, and the 39 conflicts fail or overwrite. Messy, but recoverable.",
            "זה משחזר שורות אבל מדלג על side effects: המלאי לא יורד, events לא מתפרסמים, ו-39 ההתנגשויות נכשלות או דורסות. מבולגן, אבל אפשר לתקן.")
        ]
      },
      s6: {
        text: t("Postmortem. The root cause is a failover design that could promote without knowing the old primary was stopped, plus async replication nobody had priced as RPO. What's the main fix?",
                "Postmortem. ה-root cause הוא תכנון failover שיכול לעשות promote בלי לדעת שה-primary הישן נעצר, ועוד replication אסינכרוני שאף אחד לא תמחר כ-RPO. מה התיקון העיקרי?"),
        choices: [
          c("Consensus-based failover (Patroni + etcd leader lease, watchdog so the old primary demotes itself), fencing, clients via a leader-following proxy, and quorum sync replication (synchronous_standby_names = 'ANY 1 (db-b, db-c)') for orders", "Failover מבוסס consensus (Patroni עם leader lease ב-etcd ו-watchdog כך שה-primary הישן מוריד את עצמו), fencing, clients דרך proxy שעוקב אחרי ה-leader, ו-quorum sync replication (synchronous_standby_names = 'ANY 1 (db-b, db-c)') להזמנות", "win", 20,
            "That's the full set: only one node can hold the lease, a partitioned primary stops itself before a new one is promoted, and acknowledged orders exist on two nodes (RPO≈0) at the cost of ~1-2 ms per commit.",
            "זה הסט המלא: רק node אחד יכול להחזיק את ה-lease, primary מבודד עוצר את עצמו לפני ש-primary חדש עולה, והזמנות שאושרו קיימות על שני nodes (RPO≈0) במחיר של ~1-2 ms לכל commit."),
          c("Disable automatic failover; a human must approve every promotion", "לבטל failover אוטומטי; בן אדם צריך לאשר כל promote", "s6b", 0,
            "It prevents this specific split-brain, but trades it for a 15-30 minute RTO at 2 AM, and a human can still promote without fencing.",
            "זה מונע את ה-split-brain הספציפי הזה, אבל מחליף אותו ב-RTO של 15-30 דקות ב-2 בלילה, ובן אדם עדיין יכול לעשות promote בלי fencing.")
        ]
      },
      s6b: {
        text: t("The staff review asks you to state the trade-off explicitly: RPO (lost writes) vs availability (time to fail over). The team agrees on automatic failover with a leader lease and fencing, plus sync replication only for the orders cluster.",
                "ה-review של staff מבקש לנסח את ה-trade-off במפורש: RPO (כתיבות שאבדו) מול זמינות (זמן ל-failover). הצוות מסכים על failover אוטומטי עם leader lease ו-fencing, ו-sync replication רק ל-cluster של ההזמנות."),
        choices: [
          c("Adopt that plan", "לאמץ את התוכנית", "win", 5,
            "Good: safety comes from fencing and consensus, not from making failover slow.",
            "טוב: הבטיחות מגיעה מ-fencing ו-consensus, לא מלהפוך את ה-failover לאיטי.")
        ]
      },
      win: {
        text: t("Recovered with no permanently lost orders. You fenced first, kept the side most traffic agreed on, preserved evidence, replayed through the app with idempotency keys, and fixed the design: leases, fencing and an explicit RPO.",
                "התאוששת בלי הזמנות שאבדו לצמיתות. גידרת קודם, שמרת את הצד שרוב התעבורה הסכימה עליו, שימרת ראיות, עשית replay דרך האפליקציה עם idempotency keys ותיקנת את התכנון: leases, fencing ו-RPO מפורש."),
        end: "win"
      },
      lose: {
        text: t("pg_rewind erased the only copy of ~1,300 orders that customers were charged for. Finance spends weeks matching card captures to missing orders. Lesson: after split-brain, preserve and export the losing side before you rewind it.",
                "pg_rewind מחק את העותק היחיד של ~1,300 הזמנות שלקוחות חויבו עליהן. Finance מבלים שבועות בהתאמת חיובים להזמנות חסרות. השיעור: אחרי split-brain, משמרים ומייצאים את הצד המפסיד לפני שעושים לו rewind."),
        end: "lose"
      }
    },
    lessons: ["db-replication", "db-cap", "staff-consensus-consistency", "staff-multi-region-data", "rel-ha", "db-backups"]
  });

  /* ------------------------------------------------------------------ 3 */
  window.INFRA.scenarios.push({
    id: "kafka-rebalance-storm",
    icon: "🔄",
    title: t("Kafka consumer group stuck in a rebalance storm", "Consumer group של Kafka תקוע בסערת rebalances"),
    start: "s1",
    steps: {
      s1: {
        text: t("14:20. Alert: consumer lag for group 'order-enricher' on topic 'orders' (24 partitions) is 25 minutes and climbing. Downstream, order confirmation emails are delayed. A deploy of order-enricher went out at 13:40.",
                "14:20. Alert: ה-consumer lag של ה-group 'order-enricher' על ה-topic 'orders' (24 partitions) הוא 25 דקות ומטפס. בהמשך השרשרת, מיילי אישור הזמנה מתעכבים. deploy של order-enricher יצא ב-13:40."),
        data: `$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group order-enricher
Consumer group 'order-enricher' is rebalancing.

$ kafka-consumer-groups.sh ... --describe --group order-enricher --state
GROUP           COORDINATOR (ID)   ASSIGNMENT-STRATEGY  STATE                #MEMBERS
order-enricher  kafka-2:9092 (2)   range                PreparingRebalance   12

lag (sum) 1,940,000   |   rebalances last 30m: 23`,
        choices: [
          c("Read the consumer logs around the rebalances", "לקרוא את הלוגים של ה-consumers סביב ה-rebalances", "s2", 15,
            "Yes — 23 rebalances in 30 minutes means members keep leaving the group. The client log says why.",
            "כן — 23 rebalances ב-30 דקות אומר שחברים יוצאים מה-group שוב ושוב. הלוג של ה-client אומר למה."),
          c("Scale order-enricher from 12 to 48 replicas to burn the lag", "להגדיל את order-enricher מ-12 ל-48 replicas כדי לשרוף את ה-lag", "s1b", -10,
            "Only 24 partitions exist, so 24 members sit idle — and every joining pod triggers another rebalance. You made the storm bigger.",
            "יש רק 24 partitions, אז 24 חברים יושבים בטל — וכל pod שמצטרף מפעיל עוד rebalance. הגדלת את הסערה.")
        ]
      },
      s1b: {
        text: t("Now 48 members. Rebalances happen every 40 seconds, each one pausing the whole group (eager 'range' assignor). Lag is 2.6M.",
                "עכשיו 48 חברים. rebalance קורה כל 40 שניות, וכל אחד עוצר את כל ה-group (assignor מסוג 'range' שהוא eager). ה-lag על 2.6M."),
        choices: [
          c("Scale back to 12 and read the consumer logs", "להחזיר ל-12 ולקרוא את הלוגים של ה-consumers", "s2", 5,
            "Good. Diagnose before adding capacity.",
            "טוב. מאבחנים לפני שמוסיפים קיבולת.")
        ]
      },
      s2: {
        text: t("The logs are clear, and the 13:40 deploy added a synchronous call to the pricing service for every record.",
                "הלוגים ברורים, וה-deploy של 13:40 הוסיף קריאה סינכרונית לשירות ה-pricing על כל רשומה."),
        data: `WARN [Consumer clientId=order-enricher-7f9c, groupId=order-enricher] consumer poll timeout has expired.
This means the time between subsequent calls to poll() was longer than the configured
max.poll.interval.ms, which typically implies that the poll loop is spending too much time
processing messages. You can address this either by increasing max.poll.interval.ms or by
reducing the maximum size of batches returned in poll() with max.poll.records.
INFO  Member order-enricher-7f9c sending LeaveGroup request to coordinator kafka-2:9092

config:   max.poll.records=500   max.poll.interval.ms=300000   session.timeout.ms=45000
pricing-svc p50 180ms  p99 2.4s   (called sequentially per record since 13:40)
=> 500 records x ~0.6s avg = ~300s per batch`,
        choices: [
          c("Roll back the 13:40 deploy to stop the bleeding", "לעשות rollback ל-deploy של 13:40 כדי לעצור את הדימום", "s3", 15,
            "Fastest safe mitigation: the change that pushed batch time past max.poll.interval.ms goes away; the real fix can follow.",
            "המיטיגציה הבטוחה המהירה ביותר: השינוי שדחף את זמן ה-batch מעבר ל-max.poll.interval.ms נעלם; התיקון האמיתי יכול לבוא אחר כך."),
          c("Lower max.poll.records to 50 and hot-deploy the config", "להוריד max.poll.records ל-50 ולעשות deploy ל-config", "s3", 10,
            "Works: 50 × 0.6 s = 30 s per poll, far under 300 s. But the restart itself will trigger rebalances, and throughput is still bounded by the slow call.",
            "עובד: 50 × 0.6 שניות = 30 שניות ל-poll, הרבה מתחת ל-300. אבל ה-restart עצמו יפעיל rebalances, וה-throughput עדיין חסום ע\"י הקריאה האיטית."),
          c("Raise session.timeout.ms to 5 minutes", "להעלות session.timeout.ms ל-5 דקות", "s2b", -10,
            "Wrong timeout. Heartbeats come from a background thread and are fine; the member is kicked because poll() isn't called within max.poll.interval.ms.",
            "ה-timeout הלא נכון. ה-heartbeats מגיעים מ-thread ברקע והם תקינים; החבר נזרק כי poll() לא נקרא בתוך max.poll.interval.ms.")
        ]
      },
      s2b: {
        text: t("No change: same 'poll timeout has expired' warnings, same rebalance every 1-2 minutes. Worse, a genuinely crashed pod would now take 5 minutes to be detected.",
                "שום שינוי: אותן אזהרות 'poll timeout has expired', אותו rebalance כל 1-2 דקות. וגרוע מזה, pod שבאמת קרס ייקח עכשיו 5 דקות לזהות."),
        choices: [
          c("Revert it and roll back the 13:40 deploy", "להחזיר את זה ולעשות rollback ל-deploy של 13:40", "s3", 5,
            "Good. Read the exact error before turning knobs.",
            "טוב. קוראים את השגיאה המדויקת לפני שמסובבים כפתורים.")
        ]
      },
      s3: {
        text: t("14:38. Rebalances stopped. The group is Stable, processing ~2,000 msg/s, but lag is 2.1M (about 40 minutes behind) and growing slowly at peak. How do you catch up?",
                "14:38. ה-rebalances נעצרו. ה-group במצב Stable ומעבד ~2,000 הודעות בשנייה, אבל ה-lag הוא 2.1M (בערך 40 דקות אחורה) ועדיין גדל לאט ב-peak. איך משלימים?"),
        choices: [
          c("Scale to exactly 24 consumers (one per partition), after switching to cooperative-sticky assignment and static membership", "להגדיל ל-24 consumers בדיוק (אחד לכל partition), אחרי מעבר ל-assignment מסוג cooperative-sticky ו-static membership", "s4", 15,
            "Right: parallelism maxes out at the partition count, and cooperative rebalancing means adding pods only pauses the partitions that move.",
            "נכון: המקביליות מוגבלת למספר ה-partitions, ו-rebalancing קואופרטיבי אומר שהוספת pods עוצרת רק את ה-partitions שזזים."),
          c("Reset the group's offsets to latest so emails are current again", "לעשות reset ל-offsets של ה-group ל-latest כדי שהמיילים יהיו עדכניים שוב", "lose", -25,
            "You just skipped 2.1M orders. They never get enriched, invoiced or confirmed. Lag is a delay; skipping it is data loss.",
            "דילגת עכשיו על 2.1M הזמנות. הן לעולם לא יעברו enrichment, חשבונית או אישור. lag זה עיכוב; לדלג עליו זה אובדן דאטה.")
        ]
      },
      s4: {
        text: t("Catching up at 7,000 msg/s. Downstream reports duplicates: ~18,000 orders were enriched twice and some customers got two confirmation emails.",
                "משלימים בקצב של 7,000 הודעות בשנייה. בהמשך השרשרת מדווחים על כפילויות: ~18,000 הזמנות עברו enrichment פעמיים וחלק מהלקוחות קיבלו שני מיילי אישור."),
        data: `consumer offsets were committed every 5s (enable.auto.commit=true) after poll();
during each of 23 rebalances, in-flight batches were revoked before their offsets were committed
-> the new owner re-read from the last committed offset

email-svc: duplicate sends (same order_id within 1h): 17,912`,
        choices: [
          c("Make processing idempotent (upsert by order_id, email dedupe key = order_id + template) and commit offsets explicitly after processing and in onPartitionsRevoked", "להפוך את העיבוד לאידמפוטנטי (upsert לפי order_id, dedupe key למיילים = order_id + template) ולעשות commit ל-offsets במפורש אחרי עיבוד וב-onPartitionsRevoked", "s5", 15,
            "Right. Kafka consumers are at-least-once; rebalances guarantee some redelivery. Idempotent effects make duplicates harmless.",
            "נכון. consumers של Kafka הם at-least-once; rebalances מבטיחים מסירה חוזרת מסוימת. effects אידמפוטנטיים הופכים כפילויות לבלתי מזיקות."),
          c("Turn on Kafka exactly-once (transactions) — that will fix the duplicate emails", "להפעיל exactly-once של Kafka (טרנזקציות) — זה יתקן את המיילים הכפולים", "s4b", -5,
            "Kafka transactions cover read-process-write <em>within Kafka</em>. An email sent over HTTP is an external side effect; it still needs an idempotency key.",
            "טרנזקציות של Kafka מכסות read-process-write <em>בתוך Kafka</em>. מייל שנשלח ב-HTTP הוא side effect חיצוני; הוא עדיין צריך idempotency key.")
        ]
      },
      s4b: {
        text: t("The team spends a day wiring transactional producers, then the next rebalance sends 300 duplicate emails anyway — the email call isn't part of any Kafka transaction.",
                "הצוות מבזבז יום על חיבור producers טרנזקציוניים, ואז ה-rebalance הבא שולח בכל זאת 300 מיילים כפולים — הקריאה למייל לא חלק מאף טרנזקציה של Kafka."),
        choices: [
          c("Add dedupe keys on the email side and idempotent writes", "להוסיף dedupe keys בצד המייל וכתיבות אידמפוטנטיות", "s5", 5,
            "Exactly-once effects = at-least-once delivery + idempotent side effects.",
            "Exactly-once effects = at-least-once delivery ועוד side effects אידמפוטנטיים.")
        ]
      },
      s5: {
        text: t("Lag is zero at 15:25. Now the real fix for the pricing call must ship — via a rolling deploy of 24 pods. Last time a rollout caused a rebalance per pod. What do you change?",
                "ה-lag באפס ב-15:25. עכשיו צריך לשחרר את התיקון האמיתי לקריאת ה-pricing — דרך rolling deploy של 24 pods. בפעם הקודמת rollout גרם ל-rebalance על כל pod. מה משנים?"),
        data: `# consumer config being proposed
group.instance.id=\${POD_NAME}              # static membership (StatefulSet pod names are stable)
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
session.timeout.ms=45000                   # pod restart (~20s) fits inside -> no rebalance
max.poll.records=50
max.poll.interval.ms=300000`,
        choices: [
          c("Ship static membership + cooperative-sticky, run as a StatefulSet, and process pricing calls with a bounded worker pool + per-call timeout (pause/resume partitions while busy)", "לשחרר static membership ו-cooperative-sticky, להריץ כ-StatefulSet, ולעבד קריאות pricing עם worker pool חסום ו-timeout לכל קריאה (pause/resume ל-partitions כשעמוסים)", "s6", 15,
            "A restarted pod rejoins with the same instance id inside the session timeout — no rebalance. And slow downstream calls can no longer stall poll().",
            "pod שעשה restart מצטרף עם אותו instance id בתוך ה-session timeout — בלי rebalance. וקריאות איטיות בהמשך כבר לא יכולות לתקוע את poll()."),
          c("Just set max.poll.interval.ms to 1 hour and redeploy", "פשוט להגדיר max.poll.interval.ms לשעה ולעשות redeploy", "s6", -5,
            "It hides the symptom: a genuinely stuck consumer now holds its partitions for an hour with no one noticing.",
            "זה מסתיר את הסימפטום: consumer שבאמת תקוע מחזיק עכשיו את ה-partitions שלו שעה בלי שאף אחד ישים לב.")
        ]
      },
      s6: {
        text: t("The deploy goes out with zero rebalances. In the postmortem, what alerting do you add so this is caught in minutes next time?",
                "ה-deploy יוצא עם אפס rebalances. ב-postmortem, איזה alerting מוסיפים כדי שבפעם הבאה זה ייתפס תוך דקות?"),
        choices: [
          c("Alert on consumer lag in seconds (time behind), on rebalance rate per group, and on poll-interval headroom (time between polls vs max.poll.interval.ms); plus a canary consumer in deploys", "alert על consumer lag בשניות (כמה זמן מאחור), על קצב rebalances לכל group, ועל המרווח ב-poll interval (זמן בין polls מול max.poll.interval.ms); ועוד canary consumer ב-deploys", "win", 20,
            "Lag in time maps to the user impact; rebalance rate is the early signal that fired 40 minutes before the lag alert did.",
            "lag בזמן ממופה להשפעה על המשתמש; קצב ה-rebalances הוא האות המוקדם שקפץ 40 דקות לפני ה-alert של ה-lag."),
          c("Alert when lag exceeds 1,000,000 messages", "alert כשה-lag עובר 1,000,000 הודעות", "win", 0,
            "Better than nothing, but message counts mean different things at different throughputs, and it fires late. Prefer lag in seconds + rebalance rate.",
            "עדיף מכלום, אבל מספר הודעות אומר דברים שונים ב-throughputs שונים, והוא קופץ מאוחר. עדיף lag בשניות וקצב rebalances.")
        ]
      },
      win: {
        text: t("Resolved with no lost orders. You traced the storm to batch time exceeding max.poll.interval.ms, rolled back, caught up at partition-count parallelism, made side effects idempotent, and made deploys rebalance-free with static membership and cooperative assignment.",
                "נפתר בלי הזמנות שאבדו. איתרת שהסערה נבעה מזמן batch שעבר את max.poll.interval.ms, עשית rollback, השלמת עם מקביליות בגובה מספר ה-partitions, הפכת side effects לאידמפוטנטיים, והפכת deploys לנטולי rebalance עם static membership ו-assignment קואופרטיבי."),
        end: "win"
      },
      lose: {
        text: t("2.1M orders were skipped. Rebuilding them requires replaying from a timestamp into a separate group and de-duplicating by hand — two days of work and a customer-facing incident. Lesson: never 'fix' lag by moving offsets forward.",
                "דילגו על 2.1M הזמנות. לשחזר אותן דורש replay מ-timestamp ל-group נפרד ו-dedup ידני — יומיים של עבודה ותקלה מול לקוחות. השיעור: אף פעם לא 'מתקנים' lag ע\"י הזזת offsets קדימה."),
        end: "lose"
      }
    },
    lessons: ["staff-kafka-deep", "arch-brokers", "arch-queues", "staff-exactly-once", "arch-event-driven"]
  });
})();
