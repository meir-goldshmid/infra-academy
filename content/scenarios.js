window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   On-call simulator: incident scenarios (choose-your-own-adventure)
   ========================================================================= */
(function () {
  var S = window.INFRA.scenarios;
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  /* ---------------------------------------------------------------- 1 */
  S.push({
    id: "oom-crashloop",
    icon: "🔥",
    title: t("CrashLoopBackOff after the Friday release", "CrashLoopBackOff אחרי הריליס של יום שישי"),
    start: "s1",
    steps: {
      s1: {
        text: t("02:14. PagerDuty: 'checkout-api availability &lt; 95%'. A release went out 40 minutes ago. You open your laptop.",
                "02:14. PagerDuty: 'checkout-api availability &lt; 95%'. ריליס עלה לפני 40 דקות. אתה פותח את הלפטופ."),
        data: `$ kubectl get pods -n shop -l app=checkout-api
NAME                            READY   STATUS             RESTARTS      AGE
checkout-api-7d9f8b6c4-2xkqp    0/1     CrashLoopBackOff   7 (42s ago)   38m
checkout-api-7d9f8b6c4-9wzlm    0/1     CrashLoopBackOff   6 (1m ago)    38m
checkout-api-7d9f8b6c4-tq4rn    1/1     Running            5 (3m ago)    38m`,
        choices: [
          c("kubectl describe pod on one of the crashing pods", "kubectl describe pod על אחד הפודים שקורסים", "s2", 15,
            "Right move. describe shows Last State, exit code and events — the fastest way to learn WHY a container died.",
            "מהלך נכון. describe מראה Last State, exit code ו-events — הדרך הכי מהירה להבין למה קונטיינר מת."),
          c("kubectl logs on the crashing pod", "kubectl logs על הפוד שקורס", "s2b", 5,
            "Not bad, but the current container just restarted — its logs are nearly empty. You'd need --previous, and logs won't show a kernel kill anyway.",
            "לא רע, אבל הקונטיינר הנוכחי בדיוק עלה מחדש — הלוגים כמעט ריקים. צריך --previous, וממילא לוגים לא יראו kill של ה-kernel."),
          c("Delete all the pods so they restart fresh", "למחוק את כל הפודים כדי שיעלו נקיים", "s2b", -10,
            "Restarting pods that are already restarting changes nothing and destroys evidence (the previous container's state).",
            "לעשות ריסטרט לפודים שכבר עושים ריסטרט לא משנה כלום ומשמיד ראיות (ה-state של הקונטיינר הקודם).")
        ]
      },
      s2b: {
        text: t("Nothing useful yet — the app logs just stop mid-request, no stack trace. The pods keep dying.",
                "עדיין שום דבר שימושי — הלוגים של האפליקציה פשוט נקטעים באמצע בקשה, בלי stack trace. הפודים ממשיכים למות."),
        data: `$ kubectl logs checkout-api-7d9f8b6c4-2xkqp --previous | tail -3
INFO  loaded 182k products into in-memory price cache
INFO  warming recommendation model...
(no more output)`,
        choices: [
          c("Now run kubectl describe pod", "עכשיו להריץ kubectl describe pod", "s2", 10,
            "Logs ending abruptly with no error = the process was killed from outside. describe will tell you by whom.",
            "לוגים שנקטעים בלי שגיאה = התהליך נהרג מבחוץ. describe יגיד לך ע\"י מי.")
        ]
      },
      s2: {
        text: t("describe shows the smoking gun.", "describe מראה את האקדח המעשן."),
        data: `    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Fri, 12 Nov 2026 01:58:03
      Finished:     Fri, 12 Nov 2026 01:59:41
    Limits:
      cpu:     1
      memory:  512Mi
    Requests:
      cpu:     250m
      memory:  512Mi
Events:
  Warning  BackOff  kubelet  Back-off restarting failed container`,
        choices: [
          c("Exit 137 + OOMKilled: the container exceeded its 512Mi limit. Check what changed in the release.", "Exit 137 + OOMKilled: הקונטיינר עבר את ה-limit של 512Mi. לבדוק מה השתנה בריליס.", "s3", 15,
            "Exactly. 137 = 128 + 9 (SIGKILL). The kernel OOM killer enforced the cgroup memory limit.",
            "בדיוק. 137 = 128 + 9 (SIGKILL). ה-OOM killer של ה-kernel אכף את ה-memory limit של ה-cgroup."),
          c("Exit 137 means a segfault in the code", "Exit 137 אומר segfault בקוד", "s3", -5,
            "No — a segfault is 139 (128 + 11, SIGSEGV). 137 is SIGKILL; with Reason OOMKilled it's memory.",
            "לא — segfault זה 139 (128 + 11, SIGSEGV). 137 זה SIGKILL; עם Reason OOMKilled זה זיכרון."),
          c("The node is out of memory — add nodes", "ל-node נגמר הזיכרון — להוסיף nodes", "s3", -5,
            "Node pressure would show evictions, not OOMKilled at exactly the container limit. Adding nodes won't raise a per-container limit.",
            "לחץ על ה-node היה מתבטא ב-evictions, לא ב-OOMKilled בדיוק ב-limit של הקונטיינר. הוספת nodes לא מעלה limit של קונטיינר.")
        ]
      },
      s3: {
        text: t("The diff of the release: a new in-memory price cache and an ML recommendation model loaded at startup. Grafana shows memory per pod.",
                "ה-diff של הריליס: price cache חדש בזיכרון ומודל ML להמלצות שנטען בעלייה. Grafana מראה זיכרון לכל pod."),
        data: `container_memory_working_set_bytes{pod=~"checkout-api.*"}
  previous version (v41): ~310Mi steady
  current  version (v42): climbs 300Mi -> 505Mi in 90s -> killed
  node allocatable memory free: 11.2Gi`,
        choices: [
          c("Roll back to v41 now, then fix the limit in a follow-up PR", "rollback ל-v41 עכשיו, ואז לתקן את ה-limit ב-PR המשך", "s4", 20,
            "Mitigate first, root-cause second. Rollback is a known-good state and restores service in a minute.",
            "קודם מקטינים נזק, אחר כך root cause. Rollback זה מצב ידוע וטוב שמחזיר את השירות תוך דקה."),
          c("kubectl edit the Deployment and raise the limit to 1Gi", "kubectl edit ל-Deployment ולהעלות את ה-limit ל-1Gi", "s4", 5,
            "It will probably work, but it's a guess made at 2 AM, causes drift from git/Helm, and GitOps may revert it in minutes.",
            "זה כנראה יעבוד, אבל זה ניחוש של 2 בלילה, יוצר drift מ-git/Helm, ו-GitOps עלול להחזיר את זה תוך דקות."),
          c("Remove the memory limit entirely", "להסיר את ה-memory limit לגמרי", "lose", -15,
            "Now a memory leak can eat the whole node and the kubelet starts evicting OTHER services. You turned one outage into several.",
            "עכשיו memory leak יכול לאכול את כל ה-node וה-kubelet יתחיל לפנות שירותים אחרים. הפכת תקלה אחת לכמה.")
        ]
      },
      s4: {
        text: t("Service is green again. Next morning you prepare the proper fix for v42.",
                "השירות ירוק שוב. בבוקר אתה מכין את התיקון האמיתי ל-v42."),
        choices: [
          c("Load-test v42, set requests≈limit≈p99 usage + 25% headroom (~768Mi), add a memory alert at 85% of limit", "Load test ל-v42, לקבוע requests≈limit≈p99 של השימוש + 25% מרווח (~768Mi), ולהוסיף alert על 85% מה-limit", "win", 20,
            "Data-driven sizing plus an early-warning alert. Equal request and limit for memory avoids overcommit surprises.",
            "Sizing מבוסס data ועוד alert מוקדם. request ו-limit שווים לזיכרון מונעים הפתעות של overcommit."),
          c("Set the limit to 4Gi to be safe", "לקבוע limit של 4Gi ליתר ביטחון", "win", 0,
            "It works, but you're reserving (if requests follow) or overcommitting 5x the memory — wasteful and hides future leaks.",
            "זה עובד, אבל אתה שומר (אם ה-requests עוקבים) או עושה overcommit לפי 5 מהזיכרון — בזבזני ומסתיר leaks עתידיים.")
        ]
      },
      win: {
        text: t("Incident closed. Postmortem action items: memory budgets in PR review and a CI load test. Exit 137 will never scare you again.",
                "האינסידנט נסגר. Action items מה-postmortem: תקציב זיכרון ב-PR review ו-load test ב-CI. Exit 137 לא יפחיד אותך יותר."),
        end: "win"
      },
      lose: {
        text: t("At 03:10 three other services on the same nodes get evicted. The incident channel fills up. Lesson: limits protect neighbors — size them, don't delete them.",
                "ב-03:10 שלושה שירותים אחרים על אותם nodes מפונים. ערוץ האינסידנט מתמלא. הלקח: limits מגינים על השכנים — מגדירים אותם נכון, לא מוחקים."),
        end: "lose"
      }
    },
    lessons: ["k8s-resources", "k8s-debugging", "memory"]
  });

  /* ---------------------------------------------------------------- 2 */
  S.push({
    id: "dns-outage",
    icon: "🌐",
    title: t("It's always DNS", "זה תמיד DNS"),
    start: "s1",
    steps: {
      s1: {
        text: t("10:32. Error rate on orders-service jumps from 0.1% to 38%. All errors are calls to payments-api. payments-api's own dashboards look perfectly healthy.",
                "10:32. ה-error rate של orders-service קופץ מ-0.1% ל-38%. כל השגיאות הן קריאות ל-payments-api. ה-dashboards של payments-api עצמו נראים מושלמים."),
        data: `orders-service logs:
ERROR call payments-api failed: dial tcp 10.40.7.21:443: i/o timeout
ERROR call payments-api failed: dial tcp 10.40.7.21:443: i/o timeout
INFO  call payments-api ok (87ms) -> 10.40.9.14
payments-api: p99 92ms, 5xx 0.0%, RPS lower than usual`,
        choices: [
          c("Notice the two different IPs — check what DNS returns for payments-api", "לשים לב לשתי כתובות ה-IP השונות — לבדוק מה DNS מחזיר ל-payments-api", "s2", 15,
            "Sharp. Healthy server + failing clients + a mix of IPs smells like clients resolving to a stale address.",
            "חד. שרת בריא + clients שנכשלים + ערבוב של כתובות IP — זה מריח כמו clients שמגיעים לכתובת ישנה."),
          c("Restart payments-api", "ריסטרט ל-payments-api", "s1b", -10,
            "payments-api is healthy and getting LESS traffic than usual. Restarting it just adds a second outage.",
            "payments-api בריא ומקבל פחות תעבורה מהרגיל. ריסטרט רק מוסיף תקלה שנייה."),
          c("Scale orders-service up", "להגדיל את orders-service", "s1b", -5,
            "More replicas making the same bad calls won't help — the problem is where they connect to, not capacity.",
            "יותר replicas שעושים את אותן קריאות שגויות לא יעזרו — הבעיה היא לאן הם מתחברים, לא קיבולת.")
        ]
      },
      s1b: {
        text: t("Nothing improved, error rate now 41%. Someone in the channel asks: 'Did anything change in networking today?'",
                "שום דבר לא השתפר, ה-error rate עכשיו 41%. מישהו בערוץ שואל: \"השתנה משהו ברשת היום?\""),
        choices: [
          c("Check DNS for payments-api", "לבדוק DNS ל-payments-api", "s2", 5,
            "Better late than never.", "עדיף מאוחר מאשר אף פעם.")
        ]
      },
      s2: {
        text: t("You compare the authoritative answer with what the cluster resolver returns.",
                "אתה משווה את התשובה ה-authoritative למה שה-resolver של ה-cluster מחזיר."),
        data: `$ dig +short payments.internal.acme.io @ns-1203.awsdns-22.org
10.40.9.14

$ kubectl exec -it deploy/orders-service -- dig payments.internal.acme.io
;; ANSWER SECTION:
payments.internal.acme.io. 71580 IN A 10.40.7.21

$ git log -1 infra/dns
"migrate payments to new NLB" (2h ago)  old TTL: 86400`,
        choices: [
          c("The record moved to a new NLB 2h ago, but the old TTL was 24h — caches still hold the old IP. Verify the old target.", "הרשומה עברה ל-NLB חדש לפני שעתיים, אבל ה-TTL הישן היה 24 שעות — caches עדיין מחזיקים את ה-IP הישן. לבדוק את ה-target הישן.", "s3", 20,
            "Exactly. TTL 71580s remaining = ~20 more hours of stale answers. DNS changes are only as fast as the OLD TTL.",
            "בדיוק. נשארו 71580 שניות TTL = עוד ~20 שעות של תשובות ישנות. שינויי DNS מהירים רק כמו ה-TTL הישן."),
          c("DNS is fine since the authoritative server is correct", "ה-DNS בסדר כי השרת ה-authoritative נכון", "lose", -15,
            "Authoritative is correct, but resolvers cache by TTL. 'The record is right' is not 'everyone sees the right record'.",
            "ה-authoritative נכון, אבל resolvers שומרים ב-cache לפי TTL. \"הרשומה נכונה\" זה לא \"כולם רואים את הרשומה הנכונה\".")
        ]
      },
      s3: {
        text: t("The old NLB (10.40.7.21) was deleted as part of the migration. Clients still caching it time out. How do you mitigate fastest?",
                "ה-NLB הישן (10.40.7.21) נמחק כחלק מהמיגרציה. clients שעדיין שומרים אותו ב-cache מקבלים timeout. איך מקטינים נזק הכי מהר?"),
        choices: [
          c("Recreate a listener on the old address / point old target back to payments until caches expire, and flush CoreDNS/NodeLocal DNS caches", "להחזיר listener על הכתובת הישנה / להפנות את ה-target הישן ל-payments עד שה-caches יפוגו, ולנקות caches של CoreDNS/NodeLocal DNS", "s4", 20,
            "Serve both old and new until the old TTL expires — the standard safe migration. Flushing in-cluster caches speeds up recovery for pods.",
            "לשרת גם ישן וגם חדש עד שה-TTL הישן פג — זו מיגרציה בטוחה סטנדרטית. ניקוי caches בתוך ה-cluster מאיץ את ההתאוששות לפודים."),
          c("Lower the TTL to 60 now", "להוריד את ה-TTL ל-60 עכשיו", "s4", 0,
            "Good for the future, useless now: resolvers that already cached the 86400s answer won't ask again until it expires.",
            "טוב לעתיד, חסר תועלת עכשיו: resolvers ששמרו את התשובה עם 86400 שניות לא ישאלו שוב עד שהיא תפוג."),
          c("Wait 20 hours", "לחכות 20 שעות", "lose", -20,
            "38% of orders failing for 20 hours is not a plan.", "38% מההזמנות נכשלות במשך 20 שעות — זו לא תוכנית.")
        ]
      },
      s4: {
        text: t("Errors drop to 0.2% within minutes. What goes into the postmortem?", "השגיאות יורדות ל-0.2% תוך דקות. מה נכנס ל-postmortem?"),
        choices: [
          c("Runbook: lower TTL to 60s at least one old-TTL period before a migration, run old+new in parallel, delete old only after TTL passes, alert on per-dependency error rate", "Runbook: להוריד TTL ל-60 שניות לפחות תקופת TTL ישנה אחת לפני מיגרציה, להריץ ישן+חדש במקביל, למחוק את הישן רק אחרי שה-TTL עבר, ו-alert על error rate לכל dependency", "win", 20,
            "That's the textbook DNS migration recipe.", "זה המתכון מהספר למיגרציית DNS."),
          c("'Be more careful with DNS'", "\"להיזהר יותר עם DNS\"", "win", 0,
            "Not actionable. Postmortems need concrete, checkable changes.", "לא בר ביצוע. Postmortem צריך שינויים קונקרטיים שאפשר לבדוק.")
        ]
      },
      win: {
        text: t("Resolved in 25 minutes. The haiku is true: it's not DNS, there's no way it's DNS, it was DNS.",
                "נפתר תוך 25 דקות. ההייקו נכון: זה לא DNS, אין מצב שזה DNS, זה היה DNS."),
        end: "win"
      },
      lose: {
        text: t("The outage drags on for hours until someone runs dig inside a pod. Lesson: always check what the CLIENT resolves, and respect the old TTL.",
                "התקלה נמשכת שעות עד שמישהו מריץ dig בתוך pod. הלקח: תמיד בודקים מה ה-client מקבל ב-resolve, ומכבדים את ה-TTL הישן."),
        end: "lose"
      }
    },
    lessons: ["net-dns", "net-troubleshooting"]
  });

  /* ---------------------------------------------------------------- 3 */
  S.push({
    id: "queue-backlog",
    icon: "📬",
    title: t("The queue that never drains", "התור שלא מתרוקן"),
    start: "s1",
    steps: {
      s1: {
        text: t("Alert: 'invoice-events consumer lag > 50k'. Customers report invoices arriving hours late.",
                "Alert: 'invoice-events consumer lag > 50k'. לקוחות מדווחים שחשבוניות מגיעות באיחור של שעות."),
        data: `$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group invoice-workers
TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
invoice-events  0          1834201         1834219         18
invoice-events  1          992310          1061884         69574
invoice-events  2          1790044         1790051         7
invoice-events  3          1802113         1802120         7`,
        choices: [
          c("Lag is only on partition 1 — inspect the consumer that owns it", "ה-lag רק ב-partition 1 — לבדוק את ה-consumer שמחזיק אותו", "s2", 15,
            "Great read. Lag on one partition = a stuck consumer or a hot/poison message, not a global capacity problem.",
            "קריאה מעולה. lag ב-partition אחד = consumer תקוע או הודעה רעילה/חמה, לא בעיית קיבולת כללית."),
          c("Scale consumers from 4 to 20 pods", "להגדיל את ה-consumers מ-4 ל-20 pods", "s1b", -5,
            "With 4 partitions, at most 4 consumers in a group get work — 16 pods will sit idle. And it's one partition that's stuck.",
            "עם 4 partitions, לכל היותר 4 consumers בקבוצה מקבלים עבודה — 16 pods יישבו בטל. וזה partition אחד שתקוע."),
          c("Increase partitions to 32", "להגדיל partitions ל-32", "s1b", -5,
            "Doesn't move existing messages off partition 1 and changes key→partition mapping (ordering!). Wrong tool, wrong time.",
            "לא מזיז הודעות קיימות מ-partition 1 ומשנה את המיפוי key→partition (ordering!). כלי לא נכון, זמן לא נכון.")
        ]
      },
      s1b: {
        text: t("Lag on partition 1 keeps growing: 74k. The other partitions are fine.", "ה-lag ב-partition 1 ממשיך לגדול: 74k. ה-partitions האחרים בסדר."),
        choices: [
          c("Look at the consumer of partition 1", "להסתכל על ה-consumer של partition 1", "s2", 5, "Back on track.", "חזרת למסלול.")
        ]
      },
      s2: {
        text: t("The consumer for partition 1 is in a tight loop.", "ה-consumer של partition 1 נמצא בלולאה הדוקה."),
        data: `invoice-worker-2  ERROR offset=992310 InvoiceRenderError: currency 'XBT' not supported
invoice-worker-2  WARN  retrying offset=992310 (attempt 4113)
invoice-worker-2  ERROR offset=992310 InvoiceRenderError: currency 'XBT' not supported
invoice-worker-2  WARN  retrying offset=992310 (attempt 4114)`,
        choices: [
          c("Poison message: it fails deterministically and blocks the partition. Route it to a DLQ and move on.", "Poison message: נכשלת באופן דטרמיניסטי וחוסמת את ה-partition. להעביר ל-DLQ ולהמשיך.", "s3", 20,
            "Yes. Infinite retries on a non-retryable error = head-of-line blocking. Retries are for transient errors only.",
            "כן. retries אינסופיים על שגיאה שלא ניתנת ל-retry = head-of-line blocking. retries מיועדים רק לשגיאות זמניות."),
          c("Restart invoice-worker-2", "ריסטרט ל-invoice-worker-2", "s2", -5,
            "It restarts, reads offset 992310 again, and fails again. The message is still there.",
            "הוא עולה, קורא שוב את offset 992310, ונכשל שוב. ההודעה עדיין שם."),
          c("Skip it by manually committing offset 992311 and delete nothing", "לדלג ע\"י commit ידני ל-offset 992311 בלי לשמור כלום", "s3", 0,
            "Unblocks the queue, but you silently lost a customer's invoice. Better: park it in a DLQ so it can be fixed and replayed.",
            "משחרר את התור, אבל איבדת בשקט חשבונית של לקוח. עדיף: לשים ב-DLQ כדי שאפשר יהיה לתקן ולהריץ מחדש.")
        ]
      },
      s3: {
        text: t("The poison message is in invoice-events.dlq. Lag on partition 1 is draining at ~1,200 msg/s. Customers still wait. What now?",
                "ההודעה הרעילה נמצאת ב-invoice-events.dlq. ה-lag ב-partition 1 יורד בקצב ~1,200 הודעות בשנייה. לקוחות עדיין מחכים. מה עכשיו?"),
        choices: [
          c("Let it drain (~1 min), confirm lag back to baseline, then fix XBT support and replay the DLQ message", "לתת לו להתרוקן (~דקה), לוודא שה-lag חזר ל-baseline, ואז לתקן תמיכה ב-XBT ולהריץ מחדש את ההודעה מה-DLQ", "s4", 15,
            "69k / 1.2k per second ≈ 1 minute. No heroics needed. Then fix and replay.",
            "69k חלקי 1.2k בשנייה ≈ דקה. לא צריך גבורה. ואז מתקנים ומריצים מחדש."),
          c("Purge the whole topic to get to zero lag faster", "למחוק את כל ה-topic כדי להגיע ל-lag אפס מהר יותר", "lose", -20,
            "You just deleted 69,000 legitimate invoices to save one minute.", "מחקת 69,000 חשבוניות לגיטימיות כדי לחסוך דקה.")
        ]
      },
      s4: {
        text: t("Backlog cleared. What hardening goes in the postmortem?", "ה-backlog נוקה. איזה חיזוק נכנס ל-postmortem?"),
        choices: [
          c("Bounded retries with backoff → DLQ for non-retryable errors, alert on DLQ depth and per-partition lag, schema validation at the producer", "Retries מוגבלים עם backoff → DLQ לשגיאות שלא ניתנות ל-retry, alert על עומק ה-DLQ ועל lag לכל partition, ו-schema validation ב-producer", "win", 20,
            "Defense in depth: stop bad data early, isolate it if it gets through, and notice fast.",
            "הגנה בשכבות: עוצרים data רע מוקדם, מבודדים אותו אם עבר, ושמים לב מהר."),
          c("Increase consumer timeout", "להגדיל את ה-timeout של ה-consumer", "win", 0,
            "Unrelated to the failure mode — the message failed instantly, every time.", "לא קשור לסוג הכשל — ההודעה נכשלה מיד, כל פעם.")
        ]
      },
      win: {
        text: t("All invoices delivered, one parked and fixed. You now spot a poison message from a single lag table.",
                "כל החשבוניות נמסרו, אחת חנתה ב-DLQ ותוקנה. מעכשיו אתה מזהה poison message מטבלת lag אחת."),
        end: "win"
      },
      lose: {
        text: t("Finance discovers 69k missing invoices the next morning. Lesson: never purge to fix lag — isolate the poison message.",
                "הכספים מגלים 69k חשבוניות חסרות בבוקר שאחרי. הלקח: אף פעם לא מוחקים כדי לתקן lag — מבודדים את ההודעה הרעילה."),
        end: "lose"
      }
    },
    lessons: ["arch-queues", "arch-brokers"]
  });

  /* ---------------------------------------------------------------- 4 */
  S.push({
    id: "db-connections",
    icon: "🔌",
    title: t("Scaled up, fell over", "הגדלנו — ונפלנו"),
    start: "s1",
    steps: {
      s1: {
        text: t("Black Friday prep: HPA scaled api from 10 to 40 replicas as traffic ramped. Suddenly 30% of requests fail with 500s — and adding replicas makes it worse.",
                "הכנות ל-Black Friday: ה-HPA הגדיל את ה-api מ-10 ל-40 replicas כשהתעבורה עלתה. פתאום 30% מהבקשות נכשלות עם 500 — והוספת replicas רק מחמירה."),
        data: `api logs:
ERROR HikariPool-1 - Connection is not available, request timed out after 30000ms
ERROR org.postgresql.util.PSQLException: FATAL: sorry, too many clients already

postgres (db.r6g.xlarge): max_connections = 500, CPU 41%`,
        choices: [
          c("Do the math: replicas × pool size vs max_connections", "לעשות חשבון: replicas × גודל pool מול max_connections", "s2", 20,
            "Yes — connection exhaustion is arithmetic. 'Too many clients' with DB CPU at 41% means you're out of slots, not horsepower.",
            "כן — מיצוי חיבורים זה חשבון. \"too many clients\" כשה-CPU של ה-DB ב-41% אומר שנגמרו slots, לא כוח."),
          c("Scale the database to a bigger instance", "להגדיל את ה-DB ל-instance גדול יותר", "s1b", 0,
            "A bigger instance may allow more connections, but it takes a failover/restart and doesn't fix the multiplication problem.",
            "Instance גדול יותר אולי יאפשר יותר חיבורים, אבל זה דורש failover/restart ולא פותר את בעיית הכפל."),
          c("Let the HPA keep scaling — more pods, more capacity", "לתת ל-HPA להמשיך להגדיל — יותר pods, יותר קיבולת", "lose", -15,
            "Each new pod opens more connections to a DB that's already full. Autoscaling is amplifying the failure.",
            "כל pod חדש פותח עוד חיבורים ל-DB שכבר מלא. ה-autoscaling מגביר את הכשל.")
        ]
      },
      s1b: {
        text: t("The resize is scheduled for the maintenance window in 4 hours. Errors continue.", "ה-resize מתוזמן לחלון התחזוקה בעוד 4 שעות. השגיאות ממשיכות."),
        choices: [
          c("OK, do the connection math", "בסדר, לעשות את חשבון החיבורים", "s2", 5, "Good — understand before you buy.", "טוב — קודם מבינים, אחר כך קונים.")
        ]
      },
      s2: {
        text: t("You check the config.", "אתה בודק את הקונפיג."),
        data: `spring.datasource.hikari.maximum-pool-size: 20
HPA: minReplicas 10, maxReplicas 60 (current 40)
other clients: workers 6 x 10 = 60, admin/cron ~20

40 x 20 = 800 + 80 = 880 wanted  vs  max_connections 500
pg_stat_activity: 412 idle, 71 active`,
        choices: [
          c("Immediate: cap HPA maxReplicas at 20 and cut pool size to 10 per pod (20x10+80 = 280)", "מיידי: להגביל maxReplicas ל-20 ולהוריד את ה-pool ל-10 לכל pod (20x10+80 = 280)", "s3", 15,
            "Fits under 500 with headroom. 412 idle connections show pools were oversized anyway — 71 active is the real need.",
            "נכנס מתחת ל-500 עם מרווח. 412 חיבורים idle מראים שה-pools היו גדולים מדי ממילא — 71 פעילים זה הצורך האמיתי."),
          c("Raise max_connections to 2000", "להעלות את max_connections ל-2000", "s3", -5,
            "Each Postgres connection is a process with several MB of RAM; thousands of them cause context-switching and memory pressure. Requires a restart, too.",
            "כל חיבור ב-Postgres הוא process עם כמה MB של RAM; אלפים מהם גורמים ל-context switching ולחץ זיכרון. וגם דורש restart.")
        ]
      },
      s3: {
        text: t("Errors drop to 0.3%. Traffic will double tomorrow. What's the durable fix?", "השגיאות יורדות ל-0.3%. התעבורה תוכפל מחר. מה התיקון העמיד?"),
        choices: [
          c("Put a connection pooler (PgBouncer in transaction mode / RDS Proxy) between apps and DB, and alert on connections > 80% of max", "לשים connection pooler (PgBouncer ב-transaction mode / RDS Proxy) בין האפליקציות ל-DB, ו-alert על חיבורים > 80% מה-max", "s4", 20,
            "The pooler multiplexes thousands of client connections onto ~100 server connections. App scaling is decoupled from DB connection limits.",
            "ה-pooler ממקבץ אלפי חיבורי client על ~100 חיבורי שרת. ה-scaling של האפליקציה מנותק ממגבלות החיבורים של ה-DB."),
          c("Disable the HPA and run a fixed 20 replicas", "לבטל את ה-HPA ולהריץ 20 replicas קבוע", "s4", 0,
            "Safe for the DB, but tomorrow's doubled traffic will saturate the app tier. You traded one outage for another.",
            "בטוח ל-DB, אבל התעבורה הכפולה של מחר תרווה את שכבת האפליקציה. החלפת תקלה אחת באחרת.")
        ]
      },
      s4: {
        text: t("PgBouncer is in. Last question from your lead: why did adding pods make it worse instead of better?",
                "PgBouncer בפנים. שאלה אחרונה מה-lead: למה הוספת pods החמירה במקום לשפר?"),
        choices: [
          c("Because the bottleneck was a shared downstream resource; horizontal scaling multiplies demand on it. Autoscaling must respect downstream limits.", "כי צוואר הבקבוק היה משאב downstream משותף; scaling אופקי מכפיל את הדרישה ממנו. Autoscaling חייב לכבד מגבלות downstream.", "win", 15,
            "That's the lesson. Scaling a tier just moves the bottleneck — know where it moves to.",
            "זה הלקח. Scaling של שכבה רק מזיז את צוואר הבקבוק — צריך לדעת לאן."),
          c("Because Kubernetes is slow to start pods", "כי Kubernetes איטי בהעלאת pods", "win", -5,
            "Pod startup wasn't the issue; connection count was.", "זמן עליית ה-pods לא היה הבעיה; מספר החיבורים היה.")
        ]
      },
      win: {
        text: t("Black Friday goes smoothly: 120 pods, 90 DB connections. You now multiply pool size by maxReplicas in every review.",
                "Black Friday עובר חלק: 120 pods, 90 חיבורי DB. מעכשיו אתה מכפיל pool size ב-maxReplicas בכל review."),
        end: "win"
      },
      lose: {
        text: t("At 60 replicas the DB refuses everything; even the admin can't connect to fix it. Lesson: autoscaling can DDoS your own database.",
                "ב-60 replicas ה-DB מסרב לכולם; אפילו ה-admin לא מצליח להתחבר כדי לתקן. הלקח: autoscaling יכול לעשות DDoS ל-DB שלך."),
        end: "lose"
      }
    },
    lessons: ["db-operations", "k8s-autoscaling"]
  });

  /* ---------------------------------------------------------------- 5 */
  S.push({
    id: "bad-deploy",
    icon: "🐤",
    title: t("The canary is coughing", "ה-canary משתעל"),
    start: "s1",
    steps: {
      s1: {
        text: t("15:05. search-api v3.8 canary is serving 10% of traffic. Your SLO is 99.9% success over 30 days. Argo Rollouts analysis is running.",
                "15:05. ה-canary של search-api v3.8 מקבל 10% מהתעבורה. ה-SLO הוא 99.9% הצלחה על 30 יום. ה-analysis של Argo Rollouts רץ."),
        data: `                 stable v3.7     canary v3.8
error rate (5xx)   0.08%           4.1%
p99 latency        180ms           240ms
error budget remaining (30d): 61%  burn rate (last 1h): 14x`,
        choices: [
          c("Abort the canary — roll back to 100% stable now", "Abort ל-canary — rollback ל-100% stable עכשיו", "s2", 20,
            "Clear signal, cheap action. Canaries exist exactly so you can abort with 10% exposure instead of 100%.",
            "סיגנל ברור, פעולה זולה. Canaries קיימים בדיוק כדי לעשות abort בחשיפה של 10% במקום 100%."),
          c("Wait 30 more minutes to gather more data", "לחכות עוד 30 דקות לאסוף עוד data", "s1b", -5,
            "4.1% vs 0.08% is a 50x difference — the data is already conclusive. Every minute burns budget.",
            "4.1% מול 0.08% זה הבדל פי 50 — ה-data כבר חד-משמעי. כל דקה שורפת budget."),
          c("Promote to 100% — it's only 4%", "לקדם ל-100% — זה רק 4%", "lose", -20,
            "4% of ALL traffic is 50x your SLO error rate. You'd burn the remaining monthly budget in about 11 hours.",
            "4% מכל התעבורה זה פי 50 מה-error rate של ה-SLO. היית שורף את כל ה-budget החודשי שנשאר בערך תוך 11 שעות.")
        ]
      },
      s1b: {
        text: t("30 minutes later: canary still at 4.3% errors. Budget remaining: 58%.", "30 דקות אחר כך: ה-canary עדיין ב-4.3% שגיאות. ה-budget שנשאר: 58%."),
        choices: [
          c("Abort now", "Abort עכשיו", "s2", 5, "Right call, a bit late.", "החלטה נכונה, קצת מאוחר.")
        ]
      },
      s2: {
        text: t("Stable at 100%, errors back to 0.08%. The dev who wrote v3.8 pings you: 'I know the bug, it's a one-line fix. Can we just roll forward with v3.8.1?'",
                "Stable ב-100%, השגיאות חזרו ל-0.08%. המפתחת שכתבה את v3.8 שולחת: \"אני יודעת מה הבאג, זה תיקון של שורה. אפשר פשוט roll forward עם v3.8.1?\""),
        data: `v3.8.1 diff: 1 file changed, 1 insertion(+), 1 deletion(-)
CI: 412 tests passed, 6m runtime
error budget remaining: 60%`,
        choices: [
          c("Yes — ship v3.8.1 as a NEW canary through the normal pipeline", "כן — להעלות את v3.8.1 כ-canary חדש דרך ה-pipeline הרגיל", "s3", 20,
            "Roll-forward is fine once you're stable and the fix goes through the same safety net. Budget is healthy (60%).",
            "Roll-forward זה בסדר כשאתה יציב והתיקון עובר דרך אותה רשת ביטחון. ה-budget בריא (60%)."),
          c("Hotfix it directly to 100% — it's one line", "Hotfix ישר ל-100% — זו שורה אחת", "lose", -15,
            "'It's just one line' is the most famous last words in ops. Skipping the canary removes the protection that just saved you.",
            "\"זו רק שורה אחת\" אלה המילים האחרונות המפורסמות ביותר ב-ops. דילוג על ה-canary מסיר את ההגנה שבדיוק הצילה אותך."),
          c("Freeze all deploys for 2 weeks", "להקפיא את כל ה-deploys לשבועיים", "s3", 0,
            "Over-reaction: with 60% budget left, policy doesn't require a freeze. Freezes also batch changes, making the next deploy riskier.",
            "תגובת יתר: עם 60% budget, ה-policy לא דורש freeze. הקפאות גם מאגדות שינויים ועושות את ה-deploy הבא מסוכן יותר.")
        ]
      },
      s3: {
        text: t("v3.8.1 canary: 0.07% errors, p99 175ms after 20 minutes. Analysis passes.", "Canary של v3.8.1: 0.07% שגיאות, p99 175ms אחרי 20 דקות. ה-analysis עובר."),
        choices: [
          c("Let Rollouts progress 10% → 50% → 100% with analysis at each step", "לתת ל-Rollouts להתקדם 10% → 50% → 100% עם analysis בכל שלב", "s4", 15,
            "Progressive delivery all the way.", "Progressive delivery עד הסוף."),
          c("Jump to 100% to finish faster", "לקפוץ ל-100% כדי לסיים מהר", "s4", 0,
            "Probably fine, but some bugs only show at higher load. The steps are cheap insurance.",
            "כנראה בסדר, אבל יש באגים שמופיעים רק בעומס גבוה יותר. השלבים הם ביטוח זול.")
        ]
      },
      s4: {
        text: t("v3.8.1 at 100%, healthy. In the postmortem, someone asks: 'when should we NOT roll forward?'",
                "v3.8.1 ב-100%, בריא. ב-postmortem מישהו שואל: \"מתי לא לעשות roll forward?\""),
        choices: [
          c("When you're still in the incident, the cause is unclear, the fix is large, or the change includes a non-reversible DB migration. Rollback first, then think.", "כשעדיין באמצע האינסידנט, הסיבה לא ברורה, התיקון גדול, או שהשינוי כולל DB migration לא הפיך. קודם rollback, אחר כך חושבים.", "win", 15,
            "Rollback is the default mitigation; roll-forward is for small, understood fixes from a stable state.",
            "Rollback זו ברירת המחדל להקטנת נזק; roll-forward מיועד לתיקונים קטנים ומובנים ממצב יציב."),
          c("Never, always roll back", "אף פעם, תמיד rollback", "win", 0,
            "Too absolute: some changes (data migrations already applied) can't be rolled back, and forward is the only way.",
            "מוחלט מדי: יש שינויים (migrations שכבר רצו) שאי אפשר להחזיר, וקדימה זו הדרך היחידה.")
        ]
      },
      win: {
        text: t("Total customer impact: 10% of traffic for ~3 minutes. Budget spent: ~1%. That's what canaries are for.",
                "השפעה כוללת על לקוחות: 10% מהתעבורה למשך ~3 דקות. Budget שנוצל: ~1%. בשביל זה יש canaries."),
        end: "win"
      },
      lose: {
        text: t("Errors hit all users; the monthly error budget is gone by evening and the feature freeze starts tomorrow. Lesson: trust the canary, keep the pipeline.",
                "השגיאות פוגעות בכל המשתמשים; ה-error budget החודשי נגמר עד הערב וה-feature freeze מתחיל מחר. הלקח: סומכים על ה-canary, שומרים על ה-pipeline."),
        end: "lose"
      }
    },
    lessons: ["rel-deployments", "rel-error-budgets"]
  });

  /* ---------------------------------------------------------------- 6 */
  S.push({
    id: "region-down",
    icon: "🌪️",
    title: t("A region goes dark", "Region נכבה"),
    start: "s1",
    steps: {
      s1: {
        text: t("09:12. The status page of your cloud: 'Increased error rates for multiple services in eu-west-1'. Your primary region is eu-west-1. DR is warm standby in eu-central-1. Targets: RTO 30 min, RPO 5 min.",
                "09:12. דף הסטטוס של הענן: 'Increased error rates for multiple services in eu-west-1'. ה-region הראשי שלך הוא eu-west-1. ה-DR הוא warm standby ב-eu-central-1. יעדים: RTO 30 דקות, RPO 5 דקות."),
        data: `eu-west-1:  ALB 5xx 62%, EC2 API: throttled/errors, RDS primary: unreachable from 2 of 3 AZs
eu-central-1: all green, ASG at 25% capacity (warm standby)
Aurora Global DB replication lag (last seen): 1.2s`,
        choices: [
          c("Declare an incident, assign an incident commander, start the DR runbook decision clock", "להכריז על אינסידנט, למנות incident commander, ולהפעיל את שעון ההחלטה של ה-DR runbook", "s2", 15,
            "Structure first. A region failover is a business decision with a clock — RTO 30 min means you can't debate for 40.",
            "קודם מבנה. Failover של region זו החלטה עסקית עם שעון — RTO של 30 דקות אומר שאי אפשר להתווכח 40."),
          c("Wait for the provider to fix it — they usually do within an hour", "לחכות שהספק יתקן — בדרך כלל הם מתקנים תוך שעה", "s1b", -10,
            "'Usually' isn't a plan, and your RTO is 30 minutes. Some regional events last many hours.",
            "\"בדרך כלל\" זו לא תוכנית, וה-RTO שלך 30 דקות. יש אירועים אזוריים שנמשכים שעות רבות.")
        ]
      },
      s1b: {
        text: t("09:40. Still down. Provider ETA: 'investigating'. You've used most of your RTO.", "09:40. עדיין למטה. ה-ETA של הספק: 'investigating'. ניצלת את רוב ה-RTO."),
        choices: [
          c("Start the failover process now", "להתחיל את תהליך ה-failover עכשיו", "s2", 0, "Late, but moving.", "מאוחר, אבל זזים.")
        ]
      },
      s2: {
        text: t("The runbook's first step: promote the DR database. Aurora Global offers two options.", "הצעד הראשון ב-runbook: לקדם את ה-DB ב-DR. Aurora Global מציע שתי אפשרויות."),
        data: `Option A: managed switchover  -> requires healthy primary region (waits for full sync)
Option B: detach & promote secondary (failover) -> immediate, may lose un-replicated writes
last replicated: 09:11:58  primary unreachable since: 09:12:03`,
        choices: [
          c("Option B: promote eu-central-1 — the primary is unreachable; data loss is ~5s, within the 5-min RPO", "אפשרות B: לקדם את eu-central-1 — ה-primary לא זמין; איבוד ה-data הוא ~5 שניות, בתוך ה-RPO של 5 דקות", "s3", 20,
            "Correct. Switchover needs a healthy primary. Unplanned failover accepts a few seconds of loss — that's exactly what RPO quantifies.",
            "נכון. Switchover דורש primary בריא. failover לא מתוכנן מקבל איבוד של כמה שניות — בדיוק את זה ה-RPO מכמת."),
          c("Option A: switchover, to guarantee zero data loss", "אפשרות A: switchover, כדי להבטיח אפס איבוד data", "s2b", -10,
            "Switchover waits for the unreachable primary to sync. It will hang while your RTO burns.",
            "Switchover מחכה ל-primary שלא זמין כדי לסנכרן. הוא ייתקע בזמן שה-RTO נשרף.")
        ]
      },
      s2b: {
        text: t("The switchover is stuck 'pending' for 12 minutes.", "ה-switchover תקוע ב-'pending' כבר 12 דקות."),
        choices: [
          c("Cancel and do the detach-and-promote failover", "לבטל ולעשות failover של detach-and-promote", "s3", 0, "Recovered, minus 12 minutes.", "התאוששת, מינוס 12 דקות.")
        ]
      },
      s3: {
        text: t("DB promoted in eu-central-1. App tier there is at 25% capacity. Next?", "ה-DB קודם ב-eu-central-1. שכבת האפליקציה שם ב-25% קיבולת. מה הלאה?"),
        choices: [
          c("Scale the DR ASG/node pools to full capacity BEFORE shifting traffic, then flip DNS / global LB", "להגדיל את ה-ASG/node pools ב-DR לקיבולת מלאה לפני העברת התעבורה, ואז להעביר DNS / global LB", "s4", 20,
            "Shifting 100% of traffic onto 25% capacity just causes a second outage. Scale first. (Also: everyone else in the region is scaling too — capacity reservations help.)",
            "להעביר 100% מהתעבורה ל-25% קיבולת רק גורם לתקלה שנייה. קודם scale. (וגם: כולם ב-region עושים scale עכשיו — capacity reservations עוזרים.)"),
          c("Flip DNS immediately; autoscaling will catch up", "להעביר DNS מיד; ה-autoscaling יתעדכן", "s4", 0,
            "You'll have a few minutes of overload and errors while the ASG scales. It recovers, but you made users wait.",
            "יהיו כמה דקות של עומס יתר ושגיאות בזמן שה-ASG גדל. זה מתאושש, אבל גרמת למשתמשים לחכות.")
        ]
      },
      s4: {
        text: t("Traffic now served from eu-central-1. Users are back. Hours later, eu-west-1 recovers. Your manager says: 'Great, fail back right now!'",
                "התעבורה מוגשת עכשיו מ-eu-central-1. המשתמשים חזרו. כמה שעות אחר כך eu-west-1 מתאושש. המנהל אומר: \"מעולה, תחזירו עכשיו!\""),
        choices: [
          c("No rush: re-establish replication to eu-west-1, verify, reconcile the ~5s of orphaned writes, then fail back in a planned window", "בלי לחץ: להקים מחדש רפליקציה ל-eu-west-1, לאמת, ליישב את ~5 השניות של writes יתומים, ואז failback בחלון מתוכנן", "win", 20,
            "Failback is a planned, low-risk operation — never a second emergency. And those un-replicated writes need reconciliation.",
            "Failback זו פעולה מתוכננת ובסיכון נמוך — אף פעם לא מצב חירום שני. וה-writes שלא שוכפלו צריכים יישוב."),
          c("Fail back immediately to the old primary", "לחזור מיד ל-primary הישן", "lose", -15,
            "The old primary has stale data plus divergent writes; flipping back now risks split-brain and losing everything written in the last hours.",
            "ל-primary הישן יש data ישן ועוד writes מתפצלים; לחזור עכשיו מסכן split-brain ואיבוד כל מה שנכתב בשעות האחרונות.")
        ]
      },
      win: {
        text: t("Downtime: 24 minutes (RTO met). Data loss: 5 seconds (RPO met). The DR drills you hated paid off today.",
                "Downtime: 24 דקות (עמדת ב-RTO). איבוד data: 5 שניות (עמדת ב-RPO). תרגילי ה-DR ששנאת השתלמו היום."),
        end: "win"
      },
      lose: {
        text: t("Split-brain: two databases with different truths. The next two days are spent reconciling orders by hand. Lesson: failover fast, fail back slow.",
                "Split-brain: שני DBs עם אמיתות שונות. היומיים הבאים הולכים על יישוב הזמנות ידני. הלקח: failover מהר, failback לאט."),
        end: "lose"
      }
    },
    lessons: ["rel-bcdr", "rel-ha"]
  });

  /* ---------------------------------------------------------------- 7 */
  S.push({
    id: "cert-expired",
    icon: "📜",
    title: t("NET::ERR_CERT_DATE_INVALID", "NET::ERR_CERT_DATE_INVALID"),
    start: "s1",
    steps: {
      s1: {
        text: t("00:03 on Sunday. Support tickets flood in: 'Your site says it is not secure'. Mobile app login fails for everyone. Synthetic checks just turned red.",
                "00:03 במוצאי שבת. טיקטים מציפים את התמיכה: \"האתר שלכם אומר שהוא לא מאובטח\". ה-login באפליקציה נכשל לכולם. ה-synthetic checks בדיוק האדימו."),
        data: `$ curl -sv https://api.acme.io/health 2>&1 | grep -i -E "expire|error"
*  expire date: Nov 11 23:59:59 2026 GMT
* SSL certificate problem: certificate has expired
curl: (60) SSL certificate problem: certificate has expired`,
        choices: [
          c("Confirm which cert/where it's terminated (LB vs ingress) with openssl s_client", "לוודא איזו תעודה ואיפה היא מסתיימת (LB או ingress) עם openssl s_client", "s2", 15,
            "Know exactly what's serving the expired cert before changing anything — there might be several.",
            "צריך לדעת בדיוק מה מגיש את התעודה שפגה לפני שמשנים משהו — יכולות להיות כמה."),
          c("Restart the API pods", "ריסטרט לפודים של ה-API", "s1b", -10,
            "TLS is terminated before the pods. Restarting them doesn't touch the certificate.",
            "ה-TLS מסתיים לפני הפודים. ריסטרט להם לא נוגע בתעודה.")
        ]
      },
      s1b: {
        text: t("Pods restarted. Still expired. More tickets.", "הפודים עלו מחדש. עדיין פג תוקף. עוד טיקטים."),
        choices: [
          c("Inspect the cert with openssl", "לבדוק את התעודה עם openssl", "s2", 5, "Now we're debugging.", "עכשיו אנחנו מדבגים.")
        ]
      },
      s2: {
        text: t("The cert is on the cloud load balancer, and it was imported manually two years ago.", "התעודה יושבת על ה-load balancer בענן, והיא יובאה ידנית לפני שנתיים."),
        data: `$ openssl s_client -connect api.acme.io:443 -servername api.acme.io </dev/null 2>/dev/null | openssl x509 -noout -issuer -enddate
issuer=C=US, O=DigiCert Inc, CN=DigiCert Global G2 TLS RSA SHA256 2020 CA1
notAfter=Nov 11 23:59:59 2026 GMT

$ aws acm describe-certificate --certificate-arn arn:...:certificate/9f1c... --query 'Certificate.[Type,RenewalEligibility]'
["IMPORTED", "INELIGIBLE"]`,
        choices: [
          c("Fastest fix: request a free ACM-issued cert (DNS validation via Route 53) and swap it on the LB listener", "התיקון הכי מהיר: לבקש תעודת ACM בחינם (DNS validation דרך Route 53) ולהחליף אותה ב-listener של ה-LB", "s3", 20,
            "ACM with DNS validation issues in minutes when the zone is in Route 53, and it auto-renews forever after.",
            "ACM עם DNS validation מונפקת תוך דקות כשה-zone ב-Route 53, ומתחדשת אוטומטית לנצח אחר כך."),
          c("Wake up the security team lead to buy a new DigiCert certificate", "להעיר את ראש צוות האבטחה כדי לקנות תעודת DigiCert חדשה", "s3", 0,
            "Valid but slow — procurement plus validation at midnight on a weekend can take hours.",
            "תקין אבל איטי — רכש ו-validation בחצות בסופ\"ש יכולים לקחת שעות."),
          c("Tell users to click 'proceed anyway'", "להגיד למשתמשים ללחוץ 'proceed anyway'", "lose", -20,
            "Training users to ignore TLS warnings is a security disaster, and the mobile app can't 'proceed' anyway.",
            "לאמן משתמשים להתעלם מאזהרות TLS זה אסון אבטחה, וממילא האפליקציה לא יכולה \"להמשיך\".")
        ]
      },
      s3: {
        text: t("New cert issued and attached. curl is clean. But the mobile app still fails for some users.", "תעודה חדשה הונפקה וחוברה. curl נקי. אבל האפליקציה עדיין נכשלת לחלק מהמשתמשים."),
        data: `app crash log: CertificatePinningException: pin mismatch for api.acme.io
pinned: sha256/kR7x...(old DigiCert leaf key)`,
        choices: [
          c("The app pins the old leaf key. Ship an app config update / rely on backup pins; long-term pin to CA/intermediate keys or drop pinning", "האפליקציה עושה pinning למפתח ה-leaf הישן. להוציא עדכון config לאפליקציה / להסתמך על backup pins; לטווח ארוך pinning ל-CA/intermediate או לוותר על pinning", "s4", 15,
            "Leaf-key pinning breaks on every renewal unless the key is reused. Pin to something stable, always ship backup pins.",
            "Pinning למפתח leaf נשבר בכל חידוש אלא אם משתמשים באותו מפתח. עושים pin למשהו יציב, ותמיד שולחים backup pins."),
          c("It's a client problem, ignore it", "זו בעיה של ה-client, להתעלם", "s4", -5,
            "It's your client and your users. Pinning decisions are part of your cert lifecycle.",
            "זה ה-client שלך והמשתמשים שלך. החלטות pinning הן חלק ממחזור החיים של התעודה.")
        ]
      },
      s4: {
        text: t("All clients recovered by 01:10. How do you make sure this never happens again?", "כל ה-clients התאוששו עד 01:10. איך מוודאים שזה לא יקרה שוב?"),
        choices: [
          c("Auto-renewing certs everywhere (ACM / cert-manager + Let's Encrypt), plus alerts on expiry at 30/14/7 days from a blackbox exporter / synthetic check", "תעודות שמתחדשות אוטומטית בכל מקום (ACM / cert-manager + Let's Encrypt), ועוד alerts על פקיעה ב-30/14/7 ימים מ-blackbox exporter / synthetic check", "win", 20,
            "Automate renewal AND monitor from outside — automation fails silently sometimes (DNS validation record deleted, rate limits).",
            "אוטומציה לחידוש וגם ניטור מבחוץ — אוטומציה לפעמים נכשלת בשקט (רשומת DNS validation נמחקה, rate limits)."),
          c("A calendar reminder for the next expiry", "תזכורת ביומן לפקיעה הבאה", "win", 0,
            "That's how you got here: the person who set the reminder left the company. Humans are not a renewal system.",
            "ככה הגעתם לכאן: מי שקבע את התזכורת עזב את החברה. בני אדם הם לא מערכת חידוש.")
        ]
      },
      win: {
        text: t("Outage: 67 minutes. Alert added: probe_ssl_earliest_cert_expiry - time() &lt; 14 * 86400. Certificates are now boring — as they should be.",
                "Outage: 67 דקות. נוסף alert: probe_ssl_earliest_cert_expiry - time() &lt; 14 * 86400. תעודות עכשיו משעממות — כמו שצריך."),
        end: "win"
      },
      lose: {
        text: t("Security flags the 'proceed anyway' advice, the app stays broken, and the incident hits the news. Lesson: fix the cert, never the warning.",
                "צוות האבטחה מסמן את העצה של 'proceed anyway', האפליקציה נשארת שבורה, והאינסידנט מגיע לחדשות. הלקח: מתקנים את התעודה, אף פעם לא את האזהרה."),
        end: "lose"
      }
    },
    lessons: ["net-http-tls", "obs-alerting"]
  });

  /* ---------------------------------------------------------------- 8 */
  S.push({
    id: "cost-spike",
    icon: "💸",
    title: t("Who tripled the cloud bill?", "מי שילש את חשבון הענן?"),
    start: "s1",
    steps: {
      s1: {
        text: t("The CFO forwards an email: 'AWS month-to-date $41,800 — last month total was $19,500. It's the 12th.' You have read-only billing access.",
                "ה-CFO מעביר מייל: \"AWS month-to-date $41,800 — כל החודש הקודם היה $19,500. היום ה-12.\" יש לך גישת read-only ל-billing."),
        data: `Cost Explorer, daily, grouped by SERVICE (avg/day)
                     Oct      Nov 1-3    Nov 4-11
EC2-Other            $210     $215       $1,940
CloudWatch           $45      $48        $1,310
EC2-Instances        $290     $292       $298
RDS                  $95      $95        $95`,
        choices: [
          c("Drill into EC2-Other and CloudWatch by USAGE_TYPE, starting Nov 4", "לצלול ל-EC2-Other ול-CloudWatch לפי USAGE_TYPE, מ-4 בנובמבר", "s2", 15,
            "Good. Two lines jumped on the same day — find the usage types, then the change that happened on Nov 4.",
            "טוב. שתי שורות קפצו באותו יום — מוצאים את ה-usage types, ואז את השינוי שקרה ב-4 בנובמבר."),
          c("Buy a Savings Plan to cut costs by 30%", "לקנות Savings Plan כדי לחתוך 30%", "s1b", -10,
            "EC2-Instances didn't change. A commitment discount doesn't touch data processing or log ingestion — and you'd lock in before understanding.",
            "EC2-Instances לא השתנה. הנחת התחייבות לא נוגעת ב-data processing או ב-log ingestion — ואתה נועל לפני שהבנת.")
        ]
      },
      s1b: {
        text: t("Finance asks what you're buying and why. You don't have a good answer yet.", "הכספים שואלים מה אתה קונה ולמה. עדיין אין לך תשובה טובה."),
        choices: [
          c("Go back and analyze by usage type", "לחזור ולנתח לפי usage type", "s2", 5, "Diagnose before you prescribe.", "קודם אבחנה, אחר כך מרשם.")
        ]
      },
      s2: {
        text: t("Usage types tell the story.", "ה-usage types מספרים את הסיפור."),
        data: `EU-NatGateway-Bytes           38.1 TB   ($0.045/GB)  -> ~$1,715/day
EU-DataProcessing-Bytes (Logs) 2.5 TB/day ($0.50/GB)  -> ~$1,250/day
git log (Nov 4): "ml-indexer: pull model weights from S3 on every job start"
                 "checkout: LOG_LEVEL=debug to chase bug #4412"`,
        choices: [
          c("Two causes: S3 downloads going through the NAT gateway, and debug logging left on. Tackle both.", "שתי סיבות: הורדות מ-S3 שעוברות דרך ה-NAT gateway, ו-debug logging שנשאר דלוק. לטפל בשתיהן.", "s3", 20,
            "Exactly. Same-region S3 traffic is free — unless it hairpins through NAT, which charges $0.045/GB processed.",
            "בדיוק. תעבורת S3 באותו region בחינם — אלא אם היא עוברת דרך NAT, שגובה $0.045 לכל GB."),
          c("Delete the NAT gateway", "למחוק את ה-NAT gateway", "lose", -15,
            "Every private-subnet workload loses outbound internet: payment provider calls, OS updates, external APIs. Instant outage.",
            "כל workload ב-subnet פרטי מאבד יציאה לאינטרנט: קריאות לספק תשלומים, עדכוני OS, APIs חיצוניים. תקלה מיידית.")
        ]
      },
      s3: {
        text: t("First, the NAT traffic. What's the right fix?", "קודם, תעבורת ה-NAT. מה התיקון הנכון?"),
        choices: [
          c("Add an S3 gateway VPC endpoint to the private route tables (free), and cache the model weights on the node/PVC", "להוסיף S3 gateway VPC endpoint ל-route tables הפרטיים (בחינם), ולשמור את ה-model weights ב-cache על ה-node/PVC", "s4", 20,
            "The endpoint removes NAT from the S3 path at zero cost; caching avoids re-downloading 8 GB per job.",
            "ה-endpoint מוציא את ה-NAT מהמסלול ל-S3 בעלות אפס; ה-cache מונע הורדה מחדש של 8 GB לכל job."),
          c("Move the ml-indexer to public subnets with public IPs", "להעביר את ה-ml-indexer ל-subnets ציבוריים עם public IPs", "s4", -5,
            "Avoids NAT but exposes workloads and costs public IPv4 fees. The endpoint is free and safer.",
            "עוקף NAT אבל חושף workloads ועולה דמי public IPv4. ה-endpoint בחינם ובטוח יותר.")
        ]
      },
      s4: {
        text: t("NAT bytes dropped 95% within an hour. Now the logs: checkout is still at DEBUG. The dev says the bug isn't fixed yet.",
                "ה-NAT bytes ירדו ב-95% תוך שעה. עכשיו הלוגים: checkout עדיין ב-DEBUG. המפתח אומר שהבאג עוד לא תוקן."),
        choices: [
          c("Back to INFO; enable debug only for the sampled/flagged requests (dynamic log level or per-request flag) with an auto-expiry", "חזרה ל-INFO; להפעיל debug רק לבקשות מסומנות/בדגימה (log level דינמי או flag לבקשה) עם תפוגה אוטומטית", "s5", 15,
            "You keep the debugging ability without paying $1,250/day. Debug toggles must expire automatically.",
            "שומרים על יכולת הדיבוג בלי לשלם $1,250 ביום. מתגי debug חייבים לפוג אוטומטית."),
          c("Leave DEBUG on until the bug is fixed", "להשאיר DEBUG עד שהבאג יתוקן", "s5", -5,
            "That's ~$37k/month for one bug hunt. There are cheaper ways to debug.",
            "זה ~$37k בחודש בשביל ציד באג אחד. יש דרכים זולות יותר לדבג.")
        ]
      },
      s5: {
        text: t("Daily spend is back to ~$670. What prevents the next surprise?", "ההוצאה היומית חזרה ל-~$670. מה ימנע את ההפתעה הבאה?"),
        choices: [
          c("Cost Anomaly Detection + daily budget alerts per team, mandatory tags, log retention/ingestion quotas, VPC endpoints in the base VPC module", "Cost Anomaly Detection + budget alerts יומיים לכל צוות, tags חובה, מכסות retention/ingestion ללוגים, ו-VPC endpoints ב-module הבסיסי של ה-VPC", "win", 20,
            "Detection in a day instead of a month, plus guardrails that make the cheap path the default.",
            "זיהוי תוך יום במקום חודש, ועוד guardrails שהופכים את הדרך הזולה לברירת המחדל."),
          c("Monthly review of the invoice", "סקירה חודשית של החשבונית", "win", 0,
            "This incident ran 8 days before anyone noticed. Monthly review means up to 30.",
            "האינסידנט הזה רץ 8 ימים עד שמישהו שם לב. סקירה חודשית = עד 30.")
        ]
      },
      win: {
        text: t("Projected month: $24k instead of $95k. The CFO sends a thumbs-up emoji, the rarest reward in engineering.",
                "תחזית לחודש: $24k במקום $95k. ה-CFO שולח אגודל, הפרס הכי נדיר בהנדסה."),
        end: "win"
      },
      lose: {
        text: t("Payments, OS updates and webhooks all fail. You saved $1,700/day and caused a P1. Lesson: understand a cost before deleting the thing that incurs it.",
                "תשלומים, עדכוני OS ו-webhooks נכשלים. חסכת $1,700 ביום וגרמת ל-P1. הלקח: מבינים עלות לפני שמוחקים את מה שיוצר אותה."),
        end: "lose"
      }
    },
    lessons: ["cloud-finops", "obs-logs"]
  });
})();
