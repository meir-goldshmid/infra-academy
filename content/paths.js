/* Learning paths: curated journeys across tracks. Each stage explains WHY it comes now; each step says what it unlocks. */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
INFRA.paths = INFRA.paths || [];
(function () {
  const s = (lesson, en, he) => ({ lesson, why: { en, he } });
  const st = (titleEn, titleHe, introEn, introHe, steps) => ({ title: { en: titleEn, he: titleHe }, intro: { en: introEn, he: introHe }, steps });

  // ------------------------------------------------------------------ 1. Zero to Ops
  INFRA.paths.push({
    id: "zero-to-ops", icon: "🌱", color: "#2f9e44",
    title: { en: "Zero to Ops: How It All Works", he: "מאפס ל-Ops: איך הכול עובד" },
    blurb: {
      en: "Understand what really happens inside a server, a Linux box, a network and a container, so you can read any architecture diagram and debug the basics on your own.",
      he: "להבין מה באמת קורה בתוך שרת, מכונת Linux, רשת וקונטיינר, כדי שתוכל לקרוא כל דיאגרמת ארכיטקטורה ולדבג את הבסיס לבד."
    },
    audience: {
      en: "Developers, juniors, career changers: anyone who can code a little but treats servers and networks as a black box.",
      he: "מפתחים, ג'וניורים ומי שעושה הסבה: כל מי שיודע לכתוב קצת קוד אבל מתייחס לשרתים ולרשתות כקופסה שחורה."
    },
    stages: [
      st("Stage 1 · The machine", "שלב 1 · המכונה",
        "Everything in the cloud eventually runs on a CPU, memory and a disk. Start with the physical resources, because every later problem (slowness, OOM, full disk) is one of these three running out.",
        "כל מה שרץ בענן רץ בסוף על CPU, זיכרון ודיסק. מתחילים מהמשאבים הפיזיים, כי כל בעיה בהמשך (איטיות, OOM, דיסק מלא) היא בעצם אחד מהשלושה שנגמר.",
        [
          s("bits-bytes-units", "Bits, bytes and GiB: the units behind every capacity number you'll read next.", "Bits, bytes ו-GiB: היחידות שמאחורי כל מספר קיבולת שתקרא מכאן והלאה."),
          s("cpu", "The first resource you'll see on every dashboard, and 'load' is not what you think.", "המשאב הראשון שתראו בכל דשבורד, ו-'load' הוא לא מה שחושבים."),
          s("memory", "RSS, page cache and the OOM killer explain most mysterious crashes.", "RSS, page cache וה-OOM killer מסבירים את רוב הקריסות המסתוריות."),
          s("storage-io", "Disks are the slowest part of the machine; IOPS and latency decide database speed.", "הדיסק הוא החלק הכי איטי במכונה; IOPS ו-latency קובעים את מהירות ה-DB."),
          s("latency-numbers", "Now put numbers on it: memory vs disk vs network, the cheat sheet for every design decision.", "עכשיו שמים מספרים: זיכרון מול דיסק מול רשת, השליף לכל החלטת design."),
          s("vms", "One physical server becomes many virtual ones, the base layer of every cloud.", "שרת פיזי אחד הופך להרבה וירטואליים, שכבת הבסיס של כל ענן.")
        ]),
      st("Stage 2 · Living in Linux", "שלב 2 · לחיות ב-Linux",
        "Almost every server you'll touch runs Linux. These lessons turn the terminal from scary into your main debugging tool. Processes and signals here are what Kubernetes builds on later.",
        "כמעט כל שרת שתיגעו בו מריץ Linux. השיעורים האלה הופכים את הטרמינל ממפחיד לכלי הדיבאג הראשי שלכם. תהליכים ו-signals כאן הם בדיוק מה ש-Kubernetes בונה עליו בהמשך.",
        [
          s("linux-files-navigation", "Know where configs, logs and binaries live before you change anything.", "לדעת איפה יושבים configs, לוגים ו-binaries לפני שמשנים משהו."),
          s("linux-permissions-users", "Most 'permission denied' errors become a 10-second fix.", "רוב שגיאות ה-'permission denied' הופכות לתיקון של 10 שניות."),
          s("linux-text-processing", "grep/awk/jq pipelines are how you read logs at 3 AM.", "צינורות grep/awk/jq הם הדרך לקרוא לוגים ב-3 בלילה."),
          s("processes-linux", "Processes and signals explain graceful shutdown, which every deploy depends on.", "תהליכים ו-signals מסבירים graceful shutdown, שכל deploy תלוי בו."),
          s("linux-systemd-logs", "Services, journald and cron: how things start, restart and log on a server.", "Services, journald ו-cron: איך דברים עולים, מתאוששים וכותבים לוגים בשרת."),
          s("linux-toolkit", "Put it together into a server checkup you can run on any box.", "מחברים הכול לבדיקה רפואית לשרת שאפשר להריץ על כל מכונה.")
        ]),
      st("Stage 3 · The network", "שלב 3 · הרשת",
        "Once one machine makes sense, connect machines. Most production incidents are network-shaped: DNS, TLS, firewalls. Learn the layers first, then the tools to see them.",
        "אחרי שמכונה אחת ברורה, מחברים מכונות. רוב התקלות בפרודקשן הן בצורת רשת: DNS, TLS, firewalls. לומדים קודם את השכבות, ואז את הכלים לראות אותן.",
        [
          s("net-osi-tcpip", "The layer cake gives you a map for 'where is it broken?'.", "עוגת השכבות נותנת מפה לשאלה 'איפה זה שבור?'."),
          s("net-ip-cidr", "Addresses and subnets, the vocabulary of every VPC and firewall rule.", "כתובות ו-subnets, אוצר המילים של כל VPC וכל חוק firewall."),
          s("net-dns", "It's always DNS: learn why, and how to prove it.", "זה תמיד DNS: ללמוד למה, ואיך מוכיחים את זה."),
          s("net-http-tls", "HTTP and TLS are what your users actually speak to your system.", "HTTP ו-TLS הם מה שהמשתמשים באמת מדברים עם המערכת שלכם."),
          s("linux-networking-commands", "ip, ss, dig, curl and tcpdump turn network theory into evidence.", "ip, ss, dig, curl ו-tcpdump הופכים תיאוריית רשת לראיות."),
          s("net-load-balancing", "How one address spreads traffic across many servers, the first step to scale.", "איך כתובת אחת מפזרת תעבורה על הרבה שרתים, הצעד הראשון לסקייל.")
        ]),
      st("Stage 4 · Containers and the cloud", "שלב 4 · קונטיינרים וענן",
        "Now package what you've learned: a container is just a Linux process with walls around it. With that, the cloud models make sense, and you're ready for Kubernetes or the SRE path.",
        "עכשיו אורזים את מה שלמדנו: קונטיינר הוא בסך הכול תהליך Linux עם קירות סביבו. עם זה, מודלי הענן מתחברים, ואתם מוכנים ל-Kubernetes או למסלול ה-SRE.",
        [
          s("docker-why", "Why containers won: the end of 'works on my machine'.", "למה קונטיינרים ניצחו: הסוף של 'אצלי זה עובד'."),
          s("docker-images", "Images and layers decide build speed, size and security.", "Images ושכבות קובעים מהירות build, גודל ואבטחה."),
          s("docker-run", "Ports, volumes and networks: run and debug a real container.", "Ports, volumes ורשתות: להריץ ולדבג קונטיינר אמיתי."),
          s("container-internals", "Namespaces and cgroups reveal there's no magic, only Linux.", "Namespaces ו-cgroups מגלים שאין קסם, יש רק Linux."),
          s("cloud-models", "IaaS, PaaS, SaaS and FaaS: who manages which layer.", "IaaS, PaaS, SaaS ו-FaaS: מי מנהל איזו שכבה."),
          s("cloud-regions-azs", "Regions and AZs are the building blocks of every highly available design you'll meet next.", "Regions ו-AZs הם אבני הבניין של כל design זמין שתפגשו מכאן והלאה.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 2. Backend -> Senior
  INFRA.paths.push({
    id: "backend-senior", icon: "🏗️", color: "#e8590c",
    title: { en: "Backend Engineer → Senior", he: "Backend Engineer → Senior" },
    blurb: {
      en: "Design and run a backend service end to end: APIs, data modeling, caching, queues, failure handling and the observability to prove it works.",
      he: "לתכנן ולהריץ שירות backend מקצה לקצה: APIs, מודל נתונים, caching, תורים, טיפול בכשלים וה-observability שמוכיח שזה עובד."
    },
    audience: {
      en: "Backend developers with 1-4 years of experience who ship features but want to own the design and the production behavior.",
      he: "מפתחי backend עם 1-4 שנות ניסיון שמוציאים פיצ'רים, אבל רוצים להיות הבעלים של ה-design ושל ההתנהגות בפרודקשן."
    },
    stages: [
      st("Stage 1 · Talking to the world", "שלב 1 · לדבר עם העולם",
        "A senior backend engineer starts from the contract: how clients reach you and what they expect. Get HTTP, the request lifecycle and API shape right, and everything downstream gets easier.",
        "Backend engineer בכיר מתחיל מהחוזה: איך לקוחות מגיעים אליך ומה הם מצפים לקבל. כשמבינים נכון HTTP, מחזור החיים של בקשה וצורת ה-API, כל מה שבהמשך נהיה קל יותר.",
        [
          s("net-http-tls", "Status codes, headers, keep-alive and TLS are the API's real wire format.", "Status codes, headers, keep-alive ו-TLS הם פורמט התקשורת האמיתי של ה-API."),
          s("pr-integration-styles", "REST vs gRPC vs webhooks vs events: pick the right way to connect.", "REST מול gRPC מול webhooks מול events: לבחור את הדרך הנכונה להתחבר."),
          s("pr-ids-pagination", "IDs and cursor pagination are API decisions you can't easily undo.", "IDs ו-cursor pagination הם החלטות API שקשה מאוד לבטל."),
          s("pr-time-timestamps", "Store and return time correctly before the first time-zone bug ships.", "לשמור ולהחזיר זמן נכון לפני שבאג ה-time zone הראשון יוצא."),
          s("pr-auth", "Every endpoint needs an answer to 'who are you and what may you do?'.", "כל endpoint צריך תשובה ל-'מי אתה ומה מותר לך?'."),
          s("arch-api-gateway", "Gateways and BFFs handle the cross-cutting concerns so services don't have to.", "Gateways ו-BFFs מטפלים בנושאים רוחביים כדי שהשירותים לא יצטרכו.")
        ]),
      st("Stage 2 · Data that doesn't lie", "שלב 2 · נתונים שלא משקרים",
        "Most backend bugs that hurt are data bugs: lost updates, slow queries, a wrong DB choice. Learn how databases really behave under concurrency before you scale them.",
        "רוב באגי ה-backend שבאמת כואבים הם באגי נתונים: עדכונים שהלכו לאיבוד, queries איטיים, בחירת DB לא נכונה. לומדים איך databases באמת מתנהגים תחת מקביליות לפני שמגדילים אותם.",
        [
          s("db-sql-vs-nosql", "The first fork in every design: relational or not, and why.", "הפיצול הראשון בכל design: רלציוני או לא, ולמה."),
          s("db-indexes", "Indexes turn a 3-second query into 3 ms, and explain why writes slow down.", "אינדקסים הופכים query של 3 שניות ל-3 מילישניות, ומסבירים למה כתיבות מאטות."),
          s("db-transactions", "Isolation levels decide which anomalies your users will see.", "רמות isolation קובעות אילו אנומליות המשתמשים שלכם יראו."),
          s("pr-race-deadlock", "Lost updates and deadlocks, in code and in SQL, with the fixes.", "Lost updates ו-deadlocks, בקוד וב-SQL, יחד עם התיקונים."),
          s("db-replication", "Replicas give read scale and HA, and introduce lag you must design for.", "Replicas נותנים סקייל קריאה ו-HA, ומכניסים lag שצריך לתכנן סביבו."),
          s("pr-db-landscape", "With the basics solid, see the whole map of database kinds.", "כשהבסיס יציב, רואים את המפה המלאה של סוגי ה-DB.")
        ]),
      st("Stage 3 · Fast and decoupled", "שלב 3 · מהיר ומנותק",
        "Once the data is correct, make it fast with caches and resilient with queues. Both trade simplicity for scale, so learn the failure modes together with the patterns.",
        "כשהנתונים נכונים, הופכים אותם למהירים עם caches ולעמידים עם תורים. שניהם מחליפים פשטות בסקייל, ולכן לומדים את מצבי הכשל יחד עם התבניות.",
        [
          s("arch-caching", "Cache-aside, TTLs and stampedes: the 80/20 of performance.", "Cache-aside, TTLs ו-stampedes: ה-80/20 של ביצועים."),
          s("redis-deep", "Redis is the cache, lock and rate limiter you'll use everywhere.", "Redis הוא ה-cache, המנעול וה-rate limiter שתשתמשו בהם בכל מקום."),
          s("arch-sync-vs-async", "When to answer now and when to hand work to a queue.", "מתי לענות מיד ומתי להעביר עבודה לתור."),
          s("arch-queues", "Acks, retries and DLQs: delivery guarantees in practice.", "Acks, retries ו-DLQs: הבטחות מסירה בפועל."),
          s("pr-idempotency", "Queues and retries deliver twice; idempotency makes that harmless.", "תורים ו-retries מוסרים פעמיים; אידמפוטנטיות הופכת את זה לבלתי מזיק."),
          s("arch-event-driven", "Outbox and sagas: keep data consistent across services.", "Outbox ו-sagas: לשמור על נתונים עקביים בין שירותים.")
        ]),
      st("Stage 4 · Surviving production", "שלב 4 · לשרוד בפרודקשן",
        "Seniority shows when things break. Here you learn to fail gracefully, protect yourself from dependencies and abusive clients, and design for the outage instead of reacting to it.",
        "ה-seniority מתגלה כשדברים נשברים. כאן לומדים להיכשל בחן, להגן על עצמך מתלויות ומלקוחות אגרסיביים, ולתכנן מראש לתקלה במקום להגיב אליה.",
        [
          s("arch-resilience", "Timeouts, retries, breakers and bulkheads: the core resilience kit.", "Timeouts, retries, breakers ו-bulkheads: ערכת החוסן הבסיסית."),
          s("pr-third-party-deps", "Your SLA is capped by the providers you call; design around them.", "ה-SLA שלכם מוגבל ע\"י הספקים שאתם קוראים להם; מתכננים סביבם."),
          s("pr-rate-limiters", "Protect your service and be fair to tenants.", "להגן על השירות ולהיות הוגנים כלפי tenants."),
          s("pr-security-owasp", "The ten ways backends get breached, each with a fix.", "עשר הדרכים שבהן backends נפרצים, כל אחת עם תיקון."),
          s("rel-deployments", "Ship safely: rolling, canary, blue-green and feature flags.", "לשחרר בבטחה: rolling, canary, blue-green ו-feature flags.")
        ]),
      st("Stage 5 · Seeing inside", "שלב 5 · לראות פנימה",
        "You can't own what you can't see. Finish by instrumenting the service: metrics, logs and traces tied to an SLO. That's the bridge to the SRE and Principal paths.",
        "אי אפשר להיות בעלים של מה שלא רואים. מסיימים בהוספת instrumentation לשירות: metrics, logs ו-traces שקשורים ל-SLO. זה הגשר למסלולי ה-SRE וה-Principal.",
        [
          s("obs-golden-signals", "Latency, traffic, errors and saturation: what to measure first.", "Latency, traffic, errors ו-saturation: מה מודדים קודם."),
          s("obs-logs", "Structured logs with correlation IDs make debugging a search, not a guess.", "לוגים מובנים עם correlation IDs הופכים דיבאג לחיפוש ולא לניחוש."),
          s("obs-traces", "Traces show where the time goes across services.", "Traces מראים לאן הולך הזמן בין השירותים."),
          s("rel-sli-slo-sla", "Turn 'is it working?' into a number you and the business agree on.", "להפוך את 'זה עובד?' למספר שאתם והביזנס מסכימים עליו."),
          s("pr-test-strategy", "Close the loop: a test strategy that catches bugs before users do.", "סוגרים את המעגל: אסטרטגיית בדיקות שתופסת באגים לפני המשתמשים.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 3. SRE / on-call
  INFRA.paths.push({
    id: "sre-oncall", icon: "🚒", color: "#c92a2a",
    title: { en: "SRE: On-Call Ready", he: "SRE: מוכנים לתורנות" },
    blurb: {
      en: "Carry the pager with confidence: know what to measure, when to wake someone up, how to debug a live incident, and how to recover from a disaster.",
      he: "להחזיק את הביפר בביטחון: לדעת מה למדוד, מתי להעיר מישהו, איך לדבג תקלה חיה ואיך להתאושש מאסון."
    },
    audience: {
      en: "Engineers joining an on-call rotation. Finish 'Zero to Ops' first, or be comfortable with Linux, networking and containers.",
      he: "מהנדסים שמצטרפים לרוטציית תורנות. כדאי לסיים קודם את 'מאפס ל-Ops', או להרגיש בנוח עם Linux, רשתות וקונטיינרים."
    },
    stages: [
      st("Stage 1 · Define 'healthy'", "שלב 1 · להגדיר 'תקין'",
        "On-call starts before the page: agree on what good looks like. SLIs and SLOs are the contract that tells you when to act and when to leave it alone.",
        "תורנות מתחילה לפני ההתראה: מסכימים איך נראה מצב תקין. SLIs ו-SLOs הם החוזה שאומר מתי לפעול ומתי לא לגעת.",
        [
          s("obs-intro", "Monitoring tells you something's wrong; observability tells you why.", "Monitoring אומר שמשהו לא בסדר; observability אומר למה."),
          s("rel-sli-slo-sla", "Pick the numbers that matter to users.", "לבחור את המספרים שחשובים למשתמשים."),
          s("rel-error-budgets", "Budgets and burn rate turn reliability into a decision, not a feeling.", "Budgets ו-burn rate הופכים אמינות להחלטה ולא לתחושה."),
          s("obs-golden-signals", "The four signals that cover almost every service.", "ארבעת הסיגנלים שמכסים כמעט כל שירות.")
        ]),
      st("Stage 2 · Signals you can trust", "שלב 2 · סיגנלים שאפשר לסמוך עליהם",
        "Now build the instruments: metrics that don't lie, logs that help, traces across services and alerts that only fire when a human must act.",
        "עכשיו בונים את מכשירי המדידה: metrics שלא משקרים, לוגים שעוזרים, traces בין שירותים, והתראות שקופצות רק כשבן אדם חייב לפעול.",
        [
          s("obs-metrics", "Percentiles, PromQL and why averages lie.", "אחוזונים, PromQL ולמה ממוצעים משקרים."),
          s("obs-logs", "Logs you can actually search at 3 AM.", "לוגים שאפשר באמת לחפש בהם ב-3 בלילה."),
          s("obs-traces", "Find the slow hop in a 12-service request.", "למצוא את הקפיצה האיטית בבקשה שעוברת 12 שירותים."),
          s("obs-alerting", "Symptom-based, burn-rate alerts that don't burn you out.", "התראות מבוססות סימפטום ו-burn rate שלא שוחקות אתכם."),
          s("obs-dashboards", "Dashboards that answer 'is it us?' in 10 seconds.", "דשבורדים שעונים על 'זה אצלנו?' תוך 10 שניות.")
        ]),
      st("Stage 3 · Debugging under pressure", "שלב 3 · לדבג תחת לחץ",
        "When the page fires, method beats genius. These lessons give you a repeatable checklist from the host up through the network to Kubernetes.",
        "כשההתראה קופצת, שיטה מנצחת גאונות. השיעורים האלה נותנים צ'קליסט שאפשר לחזור עליו: מה-host, דרך הרשת ועד Kubernetes.",
        [
          s("linux-performance-60s", "The first 60 seconds on a sick host.", "60 השניות הראשונות על שרת חולה."),
          s("net-errors-by-layer", "Read the error message first: it usually names the broken layer.", "קודם קוראים את הודעת השגיאה: בדרך כלל היא כבר מצביעה על השכבה השבורה."),
          s("net-troubleshooting", "Prove or rule out the network fast.", "להוכיח או לשלול את הרשת מהר."),
          s("k8s-resources", "Throttling and OOMKills are the most common pod pain.", "Throttling ו-OOMKills הם הכאב הכי נפוץ של pods."),
          s("k8s-probes", "Bad probes cause restarts and outages by themselves.", "Probes גרועים גורמים לבד ל-restarts ולתקלות."),
          s("k8s-debugging", "The kubectl playbook for any broken workload.", "ה-playbook של kubectl לכל workload שבור."),
          s("k8s-troubleshooting-playbook", "The deep version: nodes, networking, storage and the control plane.", "הגרסה המעמיקה: nodes, רשת, storage וה-control plane.")
        ]),
      st("Stage 4 · Running the incident", "שלב 4 · לנהל את התקלה",
        "Fixing is half the job; coordinating and learning is the other half. Practice the roles, then understand why systems collapse under retries and overload.",
        "לתקן זה חצי מהעבודה; לתאם וללמוד זה החצי השני. מתרגלים את התפקידים, ואז מבינים למה מערכות קורסות תחת retries ועומס.",
        [
          s("rel-incident-management", "Roles, comms and blameless postmortems.", "תפקידים, תקשורת ו-postmortems בלי האשמות."),
          s("rel-runbooks-oncall", "Runbooks turn one person's fix into the whole rotation's knowledge.", "Runbooks הופכים תיקון של אדם אחד לידע של כל הרוטציה."),
          s("staff-overload-metastable", "Retry storms and metastable failures: why 'just restart it' fails.", "סערות retries וכשלים metastable: למה 'פשוט תעשה restart' לא עובד."),
          s("staff-large-incidents", "Commanding big, multi-team incidents.", "לפקד על תקלות גדולות בין כמה צוותים."),
          s("rel-chaos-engineering", "Break things on purpose so the real outage isn't the first time.", "לשבור דברים בכוונה כדי שהתקלה האמיתית לא תהיה הפעם הראשונה.")
        ]),
      st("Stage 5 · When everything is down", "שלב 5 · כשהכול למטה",
        "The final layer is disaster: regions fail, data gets deleted, ransomware happens. Know your RPO/RTO and practice the restore before you need it.",
        "השכבה האחרונה היא אסון: regions נופלים, נתונים נמחקים, ransomware קורה. מכירים את ה-RPO/RTO ומתרגלים שחזור לפני שצריכים אותו.",
        [
          s("rel-ha", "Remove single points of failure before they find you.", "להסיר נקודות כשל בודדות לפני שהן מוצאות אתכם."),
          s("rel-bcdr", "RPO, RTO and choosing a DR strategy you can afford.", "RPO, RTO ובחירת אסטרטגיית DR שאפשר לממן."),
          s("pr-backups-strategy", "3-2-1-1-0 and restore drills: a backup you never restored doesn't exist.", "3-2-1-1-0 ותרגולי שחזור: גיבוי שלא שוחזר אף פעם לא קיים."),
          s("staff-production-readiness", "Wrap it up: production readiness reviews and healthy on-call.", "סוגרים: production readiness reviews ותורנות בריאה.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 4. Kubernetes platform engineer
  INFRA.paths.push({
    id: "k8s-platform", icon: "☸️", color: "#326ce5",
    title: { en: "Kubernetes Platform Engineer", he: "Kubernetes Platform Engineer" },
    blurb: {
      en: "Go from deploying a pod to running a multi-tenant Kubernetes platform: scheduling, autoscaling, GitOps, security, upgrades and cost.",
      he: "להתקדם מלהעלות pod להרצת פלטפורמת Kubernetes מרובת tenants: תזמון, autoscaling, GitOps, אבטחה, שדרוגים ועלויות."
    },
    audience: {
      en: "DevOps and backend engineers who know containers and want to own the cluster, not just deploy to it.",
      he: "מהנדסי DevOps ו-backend שמכירים קונטיינרים ורוצים להיות הבעלים של ה-cluster, לא רק לעשות אליו deploy."
    },
    stages: [
      st("Stage 1 · The core objects", "שלב 1 · האובייקטים הבסיסיים",
        "Kubernetes is a reconciliation machine: you declare state, controllers make it true. Learn the control plane and the core objects first; everything later is built from them.",
        "Kubernetes היא מכונת reconciliation: מצהירים על מצב, וה-controllers הופכים אותו לאמת. לומדים קודם את ה-control plane ואת האובייקטים הבסיסיים; כל מה שבא אחר כך בנוי מהם.",
        [
          s("k8s-architecture", "API server, etcd, scheduler and kubelet: who does what.", "API server, etcd, scheduler ו-kubelet: מי עושה מה."),
          s("k8s-pods", "The smallest unit, and the one you'll debug most.", "היחידה הקטנה ביותר, וזו שתדבגו הכי הרבה."),
          s("k8s-deployments", "Rolling updates and ReplicaSets: how apps change safely.", "Rolling updates ו-ReplicaSets: איך אפליקציות משתנות בבטחה."),
          s("k8s-services", "Stable names and load balancing for moving pods.", "שמות יציבים ו-load balancing ל-pods שזזים."),
          s("k8s-config", "ConfigMaps and Secrets keep images environment-agnostic.", "ConfigMaps ו-Secrets שומרים על images שלא תלויים בסביבה.")
        ]),
      st("Stage 2 · Resources and placement", "שלב 2 · משאבים ומיקום",
        "Most cluster pain is resource pain. Requests decide where pods land; limits decide how they die. Get this right before you turn on autoscaling.",
        "רוב הכאב ב-cluster הוא כאב של משאבים. Requests קובעים לאן pods נוחתים; limits קובעים איך הם מתים. מסדרים את זה לפני שמדליקים autoscaling.",
        [
          s("k8s-resources", "Requests, limits, throttling and OOMKills.", "Requests, limits, throttling ו-OOMKills."),
          s("k8s-scheduling", "Affinity, taints and topology spread decide placement.", "Affinity, taints ו-topology spread קובעים את המיקום."),
          s("k8s-probes", "Readiness, liveness and graceful shutdown for zero-downtime deploys.", "Readiness, liveness ו-graceful shutdown ל-deploys בלי downtime."),
          s("k8s-storage", "PVCs and StatefulSets for the workloads that remember.", "PVCs ו-StatefulSets ל-workloads שזוכרים.")
        ]),
      st("Stage 3 · Elastic clusters", "שלב 3 · Clusters גמישים",
        "With sane requests, you can scale safely: pods first (HPA/KEDA), then nodes (Karpenter/NAP). Then look at the bill, because elasticity without cost control is just waste.",
        "עם requests שפויים אפשר לגדול בבטחה: קודם pods (HPA/KEDA), ואז nodes (Karpenter/NAP). ואז מסתכלים על החשבון, כי גמישות בלי שליטה בעלויות היא סתם בזבוז.",
        [
          s("k8s-autoscaling", "The overview of every autoscaler and how they interact.", "סקירה של כל ה-autoscalers ואיך הם משפיעים זה על זה."),
          s("k8s-hpa-deep", "The HPA formula, custom metrics and behavior tuning.", "הנוסחה של HPA, custom metrics וכיוונון behavior."),
          s("k8s-keda", "Scale on queue depth and to zero.", "סקייל לפי עומק תור ועד אפס."),
          s("k8s-node-autoprovisioning", "Karpenter and friends: nodes that appear when pods need them.", "Karpenter וחברים: nodes שמופיעים כש-pods צריכים אותם."),
          s("k8s-cost", "Rightsizing and idle capacity: make the platform affordable.", "Rightsizing וקיבולת מבוזבזת: להפוך את הפלטפורמה למשתלמת.")
        ]),
      st("Stage 4 · Delivery and traffic", "שלב 4 · Delivery ותעבורה",
        "A platform is judged by how easily teams ship. GitOps makes the cluster match Git; progressive delivery makes releases boring; ingress and certs get traffic in safely.",
        "פלטפורמה נמדדת לפי כמה קל לצוותים לשחרר. GitOps גורם ל-cluster להתאים ל-Git; progressive delivery הופך שחרורים למשעממים; ingress ותעודות מכניסים תעבורה בבטחה.",
        [
          s("k8s-helm-deep", "Charts and templating, and how to debug a release.", "Charts ו-templating, ואיך לדבג release."),
          s("k8s-argocd", "Git as the source of truth for every cluster.", "Git כמקור האמת לכל cluster."),
          s("k8s-argo-rollouts", "Canary and blue-green with automated analysis.", "Canary ו-blue-green עם ניתוח אוטומטי."),
          s("k8s-ingress-certs-dns", "Gateway API, cert-manager and external-dns end to end.", "Gateway API, cert-manager ו-external-dns מקצה לקצה.")
        ]),
      st("Stage 5 · Owning the platform", "שלב 5 · להיות הבעלים של הפלטפורמה",
        "Finally, operate it like a product: secure multi-tenancy, observability for the cluster itself, upgrades without drama, and extending Kubernetes with operators.",
        "לסיום, מפעילים את זה כמו מוצר: multi-tenancy מאובטח, observability ל-cluster עצמו, שדרוגים בלי דרמות, והרחבת Kubernetes עם operators.",
        [
          s("k8s-namespaces-rbac", "Namespaces, RBAC and NetworkPolicy: the tenancy basics.", "Namespaces, RBAC ו-NetworkPolicy: יסודות ה-tenancy."),
          s("k8s-security-policy", "Pod security, admission policy and supply chain in production.", "Pod security, admission policy ו-supply chain בפרודקשן."),
          s("k8s-cluster-observability", "Watch the platform, not just the apps on it.", "לנטר את הפלטפורמה, לא רק את האפליקציות שעליה."),
          s("k8s-day2-upgrades", "Upgrades, PDBs, backups and DR for the cluster.", "שדרוגים, PDBs, גיבויים ו-DR ל-cluster."),
          s("k8s-operators-crds", "Teach Kubernetes new tricks with CRDs and operators.", "ללמד את Kubernetes טריקים חדשים עם CRDs ו-operators."),
          s("staff-platform-engineering", "Zoom out: golden paths and the internal developer platform.", "מתרחקים: golden paths ו-internal developer platform.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 5. Path to Principal
  INFRA.paths.push({
    id: "principal", icon: "👑", color: "#5f3dc4",
    title: { en: "Path to Principal", he: "הדרך ל-Principal" },
    blurb: {
      en: "Build the head knowledge of a principal engineer: ask the right questions, size and design systems, choose data stores and integration styles, know the runtime underneath, and lead decisions in writing.",
      he: "לבנות את הידע שבראש של Principal engineer: לשאול את השאלות הנכונות, לעשות sizing ולתכנן מערכות, לבחור data stores וסגנונות אינטגרציה, להכיר את ה-runtime מתחת, ולהוביל החלטות בכתב."
    },
    audience: {
      en: "Senior engineers aiming for Staff or Principal. You should already ship and run services; this path is about breadth, judgment and trade-offs.",
      he: "מהנדסים בכירים שמכוונים ל-Staff או Principal. כדאי שכבר תוציאו ותריצו שירותים; המסלול הזה עוסק ברוחב, שיקול דעת ו-trade-offs."
    },
    stages: [
      st("Stage 1 · Think before you draw", "שלב 1 · לחשוב לפני שמציירים",
        "A principal's first output is questions, not boxes. Learn to turn a vague ask into requirements, goals and non-goals, napkin numbers and a plan for proving yourself right. Every later stage plugs into this frame.",
        "התוצר הראשון של Principal הוא שאלות, לא קופסאות. לומדים להפוך בקשה מעורפלת לדרישות, goals ו-non-goals, מספרים על מפית ותוכנית להוכיח שצדקתם. כל שלב בהמשך מתחבר למסגרת הזאת.",
        [
          s("pr-architect-questions", "Start here: the questions, goals vs non-goals and must vs nice-to-have.", "מתחילים כאן: השאלות, goals מול non-goals ו-must מול nice-to-have."),
          s("latency-numbers", "The numbers you'll multiply in every estimate.", "המספרים שתכפילו בכל הערכה."),
          s("pr-architecture-styles", "Know the menu of architecture styles before choosing one.", "להכיר את התפריט של סגנונות הארכיטקטורה לפני שבוחרים."),
          s("pr-ddd", "Find service boundaries in the domain, not in the org chart.", "למצוא גבולות של שירותים בדומיין, לא במבנה הארגוני."),
          s("pr-sizing", "Turn requirements into QPS, storage, servers and cost.", "להפוך דרישות ל-QPS, אחסון, שרתים ועלות."),
          s("pr-validate-yourself", "Pre-mortems, threat models and spikes: attack your own design first.", "Pre-mortems, threat models ו-spikes: לתקוף את ה-design שלכם ראשונים."),
          s("pr-principal-playbook", "The end-to-end flow that ties the whole path together; revisit it at the end.", "הזרימה מקצה לקצה שקושרת את כל המסלול; כדאי לחזור אליה בסוף.")
        ]),
      st("Stage 2 · Data and scale", "שלב 2 · נתונים וסקייל",
        "Data is the hardest thing to change later, so choose it deliberately. Learn every kind of store, how systems scale and in what order, and which consistency each feature really needs.",
        "נתונים הם הדבר הכי קשה לשנות בהמשך, אז בוחרים אותם בכוונה. לומדים כל סוג של store, איך מערכות גדלות ובאיזה סדר, ואיזו עקביות כל פיצ'ר באמת צריך.",
        [
          s("pr-db-landscape", "Every kind of database and the job it was built for.", "כל סוג של database והעבודה שבשבילה הוא נבנה."),
          s("pr-data-modeling", "Design schemas from access patterns; they outlive every other decision.", "לתכנן schemas לפי access patterns; הם שורדים כל החלטה אחרת."),
          s("pr-scaling-kinds", "All the ways to scale, and the order to apply them.", "כל הדרכים לגדול, והסדר שבו מפעילים אותן."),
          s("db-sharding", "When one database isn't enough: partition keys and hot spots.", "כש-DB אחד לא מספיק: partition keys ו-hot spots."),
          s("pr-cap-pacelc", "Choose consistency per feature instead of per company.", "לבחור עקביות לפי פיצ'ר ולא לפי חברה."),
          s("pr-clusters", "Quorum, split brain and fencing: what a cluster really promises.", "Quorum, split brain ו-fencing: מה cluster באמת מבטיח."),
          s("caching-deep", "Caching as a consistency problem, not just a speed trick.", "Caching כבעיית עקביות, לא רק כטריק מהירות.")
        ]),
      st("Stage 3 · Connecting systems", "שלב 3 · לחבר מערכות",
        "Systems fail at the seams. This stage is about how services talk, how messages flow, and how to stay correct when everything retries and some dependencies are outside your control.",
        "מערכות נכשלות בתפרים. השלב הזה עוסק באיך שירותים מדברים, איך הודעות זורמות, ואיך נשארים נכונים כשהכול עושה retry וחלק מהתלויות לא בשליטתכם.",
        [
          s("pr-integration-styles", "Sync, async, webhooks, CDC: pick by coupling and failure mode.", "Sync, async, webhooks, CDC: בוחרים לפי צימוד ומצב כשל."),
          s("pr-queue-kinds", "Work queues, pub/sub and logs are different tools.", "Work queues, pub/sub ו-logs הם כלים שונים."),
          s("staff-kafka-deep", "The log that runs half the industry, in depth.", "ה-log שמריץ חצי מהתעשייה, לעומק."),
          s("pr-idempotency", "At-least-once plus idempotency equals effectively once.", "At-least-once ועוד אידמפוטנטיות שווה effectively once."),
          s("staff-exactly-once", "Outbox, CDC and sagas vs 2PC: the full correctness story.", "Outbox, CDC ו-sagas מול 2PC: כל סיפור הנכונות."),
          s("pr-rate-limiters", "Protect shared capacity with the right algorithm in the right place.", "להגן על קיבולת משותפת עם האלגוריתם הנכון במקום הנכון."),
          s("pr-ai-systems-design", "RAG, evals, guardrails and token cost: LLMs as a system component.", "RAG, evals, guardrails ועלות tokens: LLM כרכיב במערכת."),
          s("pr-third-party-deps", "Design for providers that will go down.", "לתכנן לספקים שייפלו.")
        ]),
      st("Stage 4 · Code craft", "שלב 4 · אומנות הקוד",
        "Principals review more code than they write, and they shape how teams structure it. SOLID and patterns are the shared vocabulary; cloud patterns are the same ideas at the system level.",
        "Principals עושים review להרבה יותר קוד ממה שהם כותבים, והם מעצבים את הדרך שבה צוותים בונים אותו. SOLID ו-patterns הם אוצר המילים המשותף; cloud patterns הם אותם רעיונות ברמת המערכת.",
        [
          s("pr-solid", "Code that survives change, and when SOLID is overkill.", "קוד ששורד שינויים, ומתי SOLID זה מוגזם."),
          s("pr-design-patterns", "The GoF patterns that matter and where they live in infra.", "ה-GoF patterns שבאמת חשובים ואיפה הם חיים בתשתיות."),
          s("pr-singletons", "From a lazy field to a cluster-wide leader: one idea, many scopes.", "משדה lazy ועד leader לכל ה-cluster: רעיון אחד, הרבה רמות."),
          s("pr-cloud-patterns", "Sidecar, strangler fig, CQRS, claim check: the distributed toolbox.", "Sidecar, strangler fig, CQRS, claim check: ארגז הכלים המבוזר."),
          s("pr-test-strategy", "A test strategy is part of the design, not an afterthought.", "אסטרטגיית בדיקות היא חלק מה-design, לא מחשבה שנייה.")
        ]),
      st("Stage 5 · The runtime underneath", "שלב 5 · ה-runtime שמתחת",
        "Many 'architecture' problems are really runtime problems: a blocked event loop, a GC pause, a thread pool that's too small. Know what your platform does with CPU and memory.",
        "הרבה בעיות 'ארכיטקטורה' הן בעצם בעיות runtime: event loop חסום, הפסקת GC, thread pool קטן מדי. מכירים מה הפלטפורמה שלכם עושה עם CPU וזיכרון.",
        [
          s("pr-concurrency-parallelism", "Concurrency vs parallelism vs multiprocessing, and which fits your workload.", "Concurrency מול parallelism מול multiprocessing, ומה מתאים ל-workload שלכם."),
          s("pr-event-loop", "How one thread serves 10,000 clients, and how to block it by accident.", "איך thread אחד משרת 10,000 לקוחות, ואיך חוסמים אותו בטעות."),
          s("pr-async-await", "async/await across languages and its traps.", "async/await בשפות שונות והמלכודות שלו."),
          s("pr-race-deadlock", "Races and deadlocks in code and in the database.", "Race conditions ו-deadlocks בקוד וב-database."),
          s("pr-garbage-collection", "GC pauses explain p99 spikes that dashboards can't.", "הפסקות GC מסבירות קפיצות p99 שדשבורדים לא מסבירים."),
          s("pr-platforms", "With the internals clear, compare Node, JVM, Go, .NET, Python and Rust fairly.", "כשהקרביים ברורים, משווים בהגינות בין Node, JVM, Go, .NET, Python ו-Rust.")
        ]),
      st("Stage 6 · Protocols and the edge", "שלב 6 · פרוטוקולים וה-edge",
        "Users reach you through protocols you didn't write. Know what HTTP/2 and HTTP/3 change, how to pick a real-time channel, and how email and SMS really get delivered.",
        "משתמשים מגיעים אליכם דרך פרוטוקולים שלא אתם כתבתם. מכירים מה HTTP/2 ו-HTTP/3 משנים, איך בוחרים ערוץ real-time, ואיך מייל ו-SMS באמת נמסרים.",
        [
          s("pr-http-versions", "Head-of-line blocking and why QUIC moved to UDP.", "Head-of-line blocking ולמה QUIC עבר ל-UDP."),
          s("pr-realtime-protocols", "SSE vs WebSockets vs gRPC streaming vs MQTT.", "SSE מול WebSockets מול gRPC streaming מול MQTT."),
          s("pr-email-sms", "SPF/DKIM/DMARC, SMS segments and OTP fraud.", "SPF/DKIM/DMARC, סגמנטים של SMS והונאות OTP."),
          s("pr-network-plan", "Plan the network of a new system before the first VPC exists.", "לתכנן את הרשת של מערכת חדשה לפני שה-VPC הראשון קיים."),
          s("pr-frontend-frameworks", "Know the client side well enough to make the call on React, Vue or Angular.", "להכיר את צד הלקוח מספיק כדי להכריע בין React, Vue ו-Angular.")
        ]),
      st("Stage 7 · Essentials nobody teaches", "שלב 7 · היסודות שאף אחד לא מלמד",
        "These are the topics behind the most embarrassing production bugs: time zones, encodings, auth, tenants, privacy. A principal knows them cold because they cut across every system.",
        "אלה הנושאים שמאחורי באגי הפרודקשן הכי מביכים: time zones, קידודים, auth, tenants, פרטיות. Principal מכיר אותם בעל פה, כי הם חוצים כל מערכת.",
        [
          s("pr-time-timestamps", "UTC, DST and monotonic clocks: the time bugs gallery.", "UTC, DST ושעונים מונוטוניים: גלריית באגי הזמן."),
          s("pr-encoding-serialization", "UTF-8, Base64, Protobuf and money as integers.", "UTF-8, Base64, Protobuf וכסף כמספר שלם."),
          s("pr-checksums-hashing", "Checksums vs hashes vs HMACs vs signatures.", "Checksums מול hashes מול HMACs מול חתימות."),
          s("pr-bitwise", "Masks, flags and bitmaps behind CIDR, permissions and IDs.", "Masks, flags ו-bitmaps שמאחורי CIDR, הרשאות ו-IDs."),
          s("pr-ids-pagination", "UUID v7, Snowflake and cursors.", "UUID v7, Snowflake ו-cursors."),
          s("pr-auth", "Sessions, JWT, OAuth/OIDC and authorization models.", "Sessions, JWT, OAuth/OIDC ומודלי הרשאות."),
          s("pr-security-owasp", "The OWASP Top 10 with fixes.", "ה-OWASP Top 10 עם תיקונים."),
          s("pr-multi-tenancy", "Silo, pool or bridge: isolate tenants on purpose.", "Silo, pool או bridge: לבודד tenants בכוונה."),
          s("pr-privacy", "Privacy by design, erasure and crypto-shredding.", "Privacy by design, מחיקה ו-crypto-shredding.")
        ]),
      st("Stage 8 · Distributed systems depth", "שלב 8 · עומק במערכות מבוזרות",
        "Now the deep end: consensus, time and ordering, tail latency, overload, blast radius, multi-region and big data. This is what separates a strong senior from a staff engineer in design reviews.",
        "עכשיו למים העמוקים: consensus, זמן וסדר, tail latency, עומס יתר, blast radius, multi-region ו-big data. זה מה שמבדיל senior חזק מ-staff engineer ב-design reviews.",
        [
          s("staff-consensus-consistency", "Raft, quorums and fencing tokens under the hood.", "Raft, quorums ו-fencing tokens מתחת למכסה המנוע."),
          s("staff-time-ordering", "Clock skew, Lamport/vector clocks and HLC.", "Clock skew, שעוני Lamport/vector ו-HLC."),
          s("staff-queueing-tail-latency", "Little's Law and the utilization cliff.", "חוק Little ומצוק הניצולת."),
          s("staff-overload-metastable", "Load shedding and retry budgets stop self-inflicted outages.", "Load shedding ו-retry budgets עוצרים תקלות שגורמים לעצמנו."),
          s("staff-cells-blast-radius", "Cells and shuffle sharding limit how much one failure can break.", "Cells ו-shuffle sharding מגבילים כמה כשל אחד יכול לשבור."),
          s("staff-multi-region-data", "Active-active, CRDTs and data residency.", "Active-active, CRDTs ו-data residency."),
          s("pr-big-data", "Batch, streaming and the lakehouse.", "Batch, streaming וה-lakehouse."),
          s("pr-backups-strategy", "Immutable backups and restore drills at principal level.", "גיבויים immutable ותרגולי שחזור ברמת Principal.")
        ]),
      st("Stage 9 · Security like a principal", "שלב 9 · אבטחה ברמת Principal",
        "Security is a design property, not a scan at the end. Start from the threat model, learn the OWASP 2025 list as a map of how systems really get broken, then build the walls: crypto, network and tenant isolation, data protection and the security operations that catch what slips through.",
        "אבטחה היא תכונה של ה-design, לא סריקה בסוף. מתחילים מ-threat model, לומדים את OWASP 2025 כמפה של איך מערכות באמת נפרצות, ואז בונים את החומות: קריפטוגרפיה, בידוד רשת ו-tenants, הגנה על מידע, ו-security operations שתופסים את מה שחמק.",
        [
          s("pr-threat-modeling", "Find the threats on the whiteboard, before they become CVEs.", "למצוא את האיומים על הלוח, לפני שהם הופכים ל-CVEs."),
          s("pr-owasp-2025", "The 10 ways web apps really get broken in 2025, with vulnerable and fixed code.", "10 הדרכים שבהן אפליקציות באמת נפרצות ב-2025, עם קוד פגיע וקוד מתוקן."),
          s("pr-owasp-api-llm", "APIs and LLM agents have their own top 10: BOLA, prompt injection, excessive agency.", "ל-APIs ול-LLM agents יש top 10 משלהם: BOLA, prompt injection, excessive agency."),
          s("pr-applied-crypto-pki", "Envelope encryption, certificates and mTLS without rolling your own crypto.", "Envelope encryption, תעודות ו-mTLS בלי להמציא קריפטוגרפיה בעצמך."),
          s("pr-network-isolation-deep", "Default-deny at every layer, and how to prove it works.", "Default-deny בכל שכבה, ואיך מוכיחים שזה עובד."),
          s("pr-tenant-isolation-deep", "Tenant A must never see tenant B: enforce it end to end and test it.", "Tenant A לעולם לא רואה את tenant B: לאכוף את זה מקצה לקצה ולבדוק את זה."),
          s("pr-data-security", "Classify, encrypt, tokenize and govern access to data.", "לסווג, להצפין, לעשות tokenization ולנהל גישה למידע."),
          s("pr-security-ops", "Vulnerability SLAs, detections and security incident response.", "SLAs לחולשות, detections ותגובה לאירועי אבטחה.")
        ]),
      st("Stage 10 · Quality you can prove", "שלב 10 · איכות שאפשר להוכיח",
        "A principal is trusted because their systems behave as promised. That trust is built from tests at the right level, validation at every boundary, deliberate error handling, APIs that don't break their callers and reviews that raise the bar.",
        "סומכים על Principal כי המערכות שלו מתנהגות כמו שהובטח. האמון הזה נבנה מבדיקות ברמה הנכונה, ולידציה בכל גבול, טיפול מכוון בשגיאות, APIs שלא שוברים את מי שקורא להם, ו-code review שמרים את הרף.",
        [
          s("pr-unit-testing-craft", "Fast, deterministic unit tests that catch real bugs, not just coverage.", "Unit tests מהירים ודטרמיניסטיים שתופסים באגים אמיתיים, לא רק coverage."),
          s("pr-integration-testing", "Testcontainers, contract tests and e2e: test the seams between systems.", "Testcontainers, contract tests ו-e2e: לבדוק את התפרים בין המערכות."),
          s("pr-performance-testing", "Turn sizing estimates into measured numbers with k6 and flame graphs.", "להפוך הערכות sizing למספרים מדודים עם k6 ו-flame graphs."),
          s("pr-input-validation", "Parse, don't validate: every boundary checks what comes in.", "Parse, don't validate: כל גבול בודק את מה שנכנס."),
          s("pr-error-handling", "Fail closed, retry only what's transient, never swallow errors.", "Fail closed, retry רק למה שזמני, ואף פעם לא לבלוע שגיאות."),
          s("pr-api-design", "API review: status codes, errors, versioning and compatibility.", "API review: status codes, שגיאות, versioning ותאימות לאחור."),
          s("pr-enterprise-integrations", "SSO, SCIM, payments and CRM sync with real customers' systems.", "SSO, SCIM, תשלומים וסנכרון CRM מול מערכות של לקוחות אמיתיים."),
          s("pr-code-review-quality", "Quality gates and code review that raise the bar without blocking.", "Quality gates ו-code review שמרימים את הרף בלי לחסום.")
        ]),
      st("Stage 11 · Follow the request end to end", "שלב 11 · לעקוב אחרי הבקשה מקצה לקצה",
        "Now connect everything: step through real flows hop by hop and watch each earlier lesson show up in its place, from DNS and TLS to sagas, Kubernetes and the incident that ends in a postmortem. A principal can narrate any of these from memory.",
        "עכשיו מחברים הכול: עוברים על תהליכים אמיתיים קפיצה אחר קפיצה ורואים כל שיעור קודם מופיע במקום שלו, מ-DNS ו-TLS ועד sagas, Kubernetes והתקלה שנגמרת ב-postmortem. Principal יכול לספר כל אחד מהם בעל פה.",
        [
          s("flow-url-to-page", "The classic: from typing a URL to pixels on screen.", "הקלאסיקה: מהקלדת URL ועד פיקסלים על המסך."),
          s("flow-login-sso", "OIDC, PKCE and MFA, hop by hop.", "OIDC, PKCE ו-MFA, קפיצה אחר קפיצה."),
          s("flow-checkout-payment", "Idempotency, sagas and webhooks working together for real money.", "Idempotency, sagas ו-webhooks עובדים יחד על כסף אמיתי."),
          s("flow-commit-to-prod", "From git push to a signed, canaried release.", "מ-git push ועד release חתום שעבר canary."),
          s("flow-alert-to-postmortem", "The incident lifecycle from the first page to the action items.", "מחזור החיים של תקלה, מה-page הראשון ועד ה-action items.")
        ]),
      st("Stage 12 · Operate and lead", "שלב 12 · להפעיל ולהוביל",
        "The last stage is what makes the title: making decisions in writing, setting strategy, running big migrations and influencing without authority. Finish by re-reading the Playbook from Stage 1, and it will read differently.",
        "השלב האחרון הוא מה שעושה את התואר: לקבל החלטות בכתב, לקבוע אסטרטגיה, להריץ מיגרציות גדולות ולהשפיע בלי סמכות. מסיימים בקריאה חוזרת של ה-Playbook משלב 1, והוא ייקרא אחרת.",
        [
          s("pr-observability-plan", "Every design ships with its day-1 monitoring plan.", "כל design יוצא עם תוכנית ה-monitoring של היום הראשון."),
          s("staff-production-readiness", "Readiness reviews and on-call health as a principal's responsibility.", "Readiness reviews ובריאות התורנות כאחריות של Principal."),
          s("staff-design-docs", "Design docs, RFCs and ADRs: deciding in writing.", "Design docs, RFCs ו-ADRs: לקבל החלטות בכתב."),
          s("staff-tech-strategy", "Build vs buy, TCO and one-way doors.", "Build vs buy, TCO ו-one-way doors."),
          s("staff-migrations-at-scale", "Moving 200 services without stopping the company.", "להעביר 200 שירותים בלי לעצור את החברה."),
          s("staff-influence", "Leading without authority.", "להוביל בלי סמכות."),
          s("staff-interview-loop", "How senior, staff and principal are actually scored.", "איך באמת מעריכים senior, staff ו-principal.")
        ])
    ]
  });
  // ------------------------------------------------------------------ 6. Security
  INFRA.paths.push({
    id: "security", icon: "🛡️", color: "#862e9c",
    title: { en: "Security for Senior & Principal Engineers", he: "אבטחה ל-Senior ו-Principal" },
    blurb: {
      en: "Design systems that are hard to break and quick to recover: threat models, OWASP 2025, identity, crypto, network and tenant isolation, secure delivery and incident response.",
      he: "לתכנן מערכות שקשה לפרוץ ומהר להתאושש מהן: threat models, OWASP 2025, זהות, קריפטוגרפיה, בידוד רשת ו-tenants, delivery מאובטח ותגובה לאירועים."
    },
    audience: {
      en: "Backend, platform and infra engineers who own production systems. You should know HTTP, basic networking and how your services are deployed.",
      he: "מהנדסי backend, פלטפורמה ותשתיות שאחראים על מערכות בפרודקשן. כדאי להכיר HTTP, רשתות בסיסיות ואיך השירותים שלך עולים לאוויר."
    },
    stages: [
      st("Stage 1 · Think like an attacker", "שלב 1 · לחשוב כמו תוקף",
        "Before any control, learn how systems are actually broken. The threat model gives you the map, and the OWASP lists tell you where attackers look first.",
        "לפני כל control, לומדים איך מערכות באמת נפרצות. ה-threat model נותן לך את המפה, ורשימות OWASP אומרות לך איפה תוקפים מחפשים קודם.",
        [
          s("pr-threat-modeling", "Draw the data flow, mark trust boundaries, apply STRIDE.", "מציירים את זרימת המידע, מסמנים trust boundaries ומפעילים STRIDE."),
          s("pr-owasp-2025", "The current top 10 web risks with vulnerable and fixed code.", "10 הסיכונים המובילים היום, עם קוד פגיע וקוד מתוקן."),
          s("pr-security-owasp", "The fundamentals behind the list: injection, XSS, SSRF, IDOR.", "היסודות שמאחורי הרשימה: injection, XSS, SSRF, IDOR."),
          s("pr-owasp-api-llm", "APIs and LLM agents: BOLA, prompt injection, excessive agency.", "APIs ו-LLM agents: BOLA, prompt injection, excessive agency.")
        ]),
      st("Stage 2 · Identity and secrets", "שלב 2 · זהות וסודות",
        "Most breaches start with stolen or over-powered identities. Get authentication, authorization, keys and certificates right and half of the top 10 disappears.",
        "רוב הפריצות מתחילות בזהות גנובה או עם יותר מדי הרשאות. אם עושים נכון authentication, authorization, מפתחות ותעודות, חצי מה-top 10 נעלם.",
        [
          s("pr-auth", "Sessions, JWT, OAuth/OIDC, passkeys and authorization models.", "Sessions, JWT, OAuth/OIDC, passkeys ומודלים של הרשאות."),
          s("flow-login-sso", "Watch a full OIDC + MFA login, hop by hop.", "לראות login מלא של OIDC + MFA, קפיצה אחר קפיצה."),
          s("cloud-iam-security", "Cloud IAM: least privilege for humans and workloads.", "IAM בענן: least privilege לאנשים ול-workloads."),
          s("staff-zero-trust-secrets", "Zero trust and secrets management at scale.", "Zero trust וניהול סודות בסקייל."),
          s("pr-applied-crypto-pki", "Envelope encryption, PKI, mTLS and signing.", "Envelope encryption, PKI, mTLS וחתימות.")
        ]),
      st("Stage 3 · Walls and blast radius", "שלב 3 · חומות ו-blast radius",
        "Assume something will be breached and make sure it can't spread: isolate networks, tenants and data, and validate everything that crosses a boundary.",
        "מניחים שמשהו ייפרץ ודואגים שזה לא יתפשט: מבודדים רשתות, tenants ומידע, ובודקים כל מה שחוצה גבול.",
        [
          s("pr-network-isolation-deep", "Default-deny from the VPC down to the Pod and the mesh.", "Default-deny מה-VPC ועד ה-Pod וה-mesh."),
          s("k8s-security-policy", "Pod security, RBAC and admission policies in Kubernetes.", "Pod security, RBAC ו-admission policies ב-Kubernetes."),
          s("pr-tenant-isolation-deep", "Enforce and test tenant isolation end to end.", "לאכוף ולבדוק בידוד tenants מקצה לקצה."),
          s("pr-input-validation", "Every boundary validates what comes in.", "כל גבול בודק את מה שנכנס."),
          s("pr-data-security", "Classify, encrypt and govern access to data.", "לסווג, להצפין ולנהל גישה למידע."),
          s("pr-privacy", "Privacy by design, GDPR and the right to erasure.", "Privacy by design, GDPR והזכות להימחק.")
        ]),
      st("Stage 4 · Secure delivery and operations", "שלב 4 · Delivery ותפעול מאובטחים",
        "Security has to survive every release and every 3 a.m. alert: sign what you ship, scan continuously, detect what slips through and practice the response.",
        "האבטחה צריכה לשרוד כל release וכל התראה ב-3 בלילה: חותמים על מה שמשחררים, סורקים כל הזמן, מזהים את מה שחמק ומתרגלים את התגובה.",
        [
          s("staff-supply-chain", "SBOMs, SLSA and signed artifacts.", "SBOMs, SLSA ו-artifacts חתומים."),
          s("flow-commit-to-prod", "Where each security gate sits in the pipeline.", "איפה כל security gate יושב ב-pipeline."),
          s("pr-error-handling", "Fail closed and never leak internals in errors.", "Fail closed ואף פעם לא לחשוף פרטים פנימיים בשגיאות."),
          s("pr-security-ops", "Vulnerability management, detections and incident response.", "ניהול חולשות, detections ותגובה לאירועים.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 7. End-to-end flows
  INFRA.paths.push({
    id: "e2e-flows", icon: "🔄", color: "#0b7285",
    title: { en: "End-to-End: Follow the Request", he: "מקצה לקצה: לעקוב אחרי הבקשה" },
    blurb: {
      en: "Step through ten real flows hop by hop, with latency, failure modes and what to monitor at each hop, until you can narrate any system from the first click to the database and back.",
      he: "עוברים על עשרה תהליכים אמיתיים קפיצה אחר קפיצה, עם latency, נקודות כשל ומה לנטר בכל קפיצה, עד שתוכל לספר כל מערכת מהקליק הראשון ועד ה-DB ובחזרה."
    },
    audience: {
      en: "Anyone preparing for system design interviews or joining a new team. Best after the Backend → Senior path, but each flow links to the lessons it uses.",
      he: "כל מי שמתכונן לראיונות system design או מצטרף לצוות חדש. הכי טוב אחרי המסלול Backend → Senior, אבל כל תהליך מקשר לשיעורים שהוא משתמש בהם."
    },
    stages: [
      st("Stage 1 · A user's request", "שלב 1 · הבקשה של המשתמש",
        "Start with what users touch: a page load, a login, a purchase, an upload and an AI answer. Each one reuses DNS, TLS, load balancers and databases in a different way.",
        "מתחילים במה שהמשתמש נוגע בו: טעינת עמוד, login, רכישה, העלאת קובץ ותשובה של AI. כל אחד משתמש מחדש ב-DNS, TLS, load balancers ו-databases בדרך אחרת.",
        [
          s("flow-url-to-page", "The base flow every other flow builds on.", "תהליך הבסיס שכל השאר נבנים עליו."),
          s("flow-login-sso", "Identity in motion: redirects, codes and tokens.", "זהות בתנועה: redirects, codes ו-tokens."),
          s("flow-checkout-payment", "Money needs idempotency, sagas and verified webhooks.", "כסף דורש idempotency, sagas ו-webhooks מאומתים."),
          s("flow-file-upload", "Big files go around your servers, not through them.", "קבצים גדולים עוקפים את השרתים שלך, לא עוברים דרכם."),
          s("flow-llm-request", "RAG, guardrails, streaming and cost per request.", "RAG, guardrails, streaming ועלות לכל בקשה.")
        ]),
      st("Stage 2 · The platform behind it", "שלב 2 · הפלטפורמה שמאחורה",
        "Now the flows users never see: how code reaches production, how a Pod starts serving, how events become dashboards, how a new customer is provisioned and how an outage becomes a postmortem.",
        "עכשיו התהליכים שהמשתמש לא רואה: איך קוד מגיע לפרודקשן, איך Pod מתחיל לקבל traffic, איך events הופכים לדשבורדים, איך לקוח חדש מוקם, ואיך תקלה הופכת ל-postmortem.",
        [
          s("flow-commit-to-prod", "CI, signing, GitOps and canary in one run.", "CI, חתימה, GitOps ו-canary בריצה אחת."),
          s("flow-k8s-pod-lifecycle", "From kubectl apply to the first request, and back down.", "מ-kubectl apply ועד הבקשה הראשונה, ובחזרה למטה."),
          s("flow-event-pipeline", "From a click to a chart: Kafka, Flink and the lakehouse.", "מקליק ועד גרף: Kafka, Flink וה-lakehouse."),
          s("flow-tenant-onboarding", "Provisioning a SaaS tenant with real isolation.", "הקמת tenant ב-SaaS עם בידוד אמיתי."),
          s("flow-alert-to-postmortem", "The incident from page to action items.", "התקלה מה-page ועד ה-action items.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 8. Git & Delivery
  INFRA.paths.push({
    id: "git-and-delivery", icon: "🌿", color: "#e67700",
    title: { en: "Git & Delivery: From Commit to Production", he: "Git ו-Delivery: מ-commit ועד פרודקשן" },
    blurb: {
      en: "Use Git like the people who wrote it, turn source into trusted artifacts, run pipelines and releases that make shipping boring, measure delivery with DORA and manage infrastructure as code.",
      he: "לעבוד עם Git כמו מי שכתב אותו, להפוך קוד מקור ל-artifacts שאפשר לסמוך עליהם, להריץ pipelines ו-releases שהופכים שחרור למשעמם, למדוד delivery עם DORA ולנהל תשתיות כקוד."
    },
    audience: {
      en: "Developers and DevOps engineers who use Git every day but panic at a detached HEAD, and anyone about to own a CI/CD pipeline or a release process.",
      he: "מפתחים ומהנדסי DevOps שעובדים עם Git כל יום אבל נלחצים מ-detached HEAD, וכל מי שעומד להיות אחראי על pipeline של CI/CD או על תהליך release."
    },
    stages: [
      st("Stage 1 · Git from the inside", "שלב 1 · Git מבפנים",
        "Every scary Git situation becomes simple once you see the objects and refs underneath. Learn the model first, then the daily workflow, then how to undo anything and how to use history as a debugging tool.",
        "כל מצב מפחיד ב-Git הופך לפשוט ברגע שרואים את ה-objects וה-refs שמתחת. לומדים קודם את המודל, אחר כך את ה-workflow היומיומי, ואז איך מבטלים כל דבר ואיך משתמשים בהיסטוריה ככלי דיבאג.",
        [
          s("git-internals", "Blobs, trees, commits and refs: the model that explains every other Git command.", "Blobs, trees, commits ו-refs: המודל שמסביר כל פקודת Git אחרת."),
          s("git-workflow", "With the model clear, merge vs rebase stops being religion and becomes a choice.", "כשהמודל ברור, merge מול rebase מפסיק להיות דת והופך לבחירה."),
          s("git-undo-rescue", "reset, revert and reflog mean almost nothing is truly lost, except a pushed secret.", "reset, revert ו-reflog אומרים שכמעט שום דבר לא באמת אבד, חוץ מ-secret שעשית לו push."),
          s("git-debugging", "bisect, blame and pickaxe turn history into the fastest way to find who broke what.", "bisect, blame ו-pickaxe הופכים את ההיסטוריה לדרך הכי מהירה למצוא מה נשבר ומתי.")
        ]),
      st("Stage 2 · Git at company scale", "שלב 2 · Git בסקייל של חברה",
        "One repo on a laptop is easy; hundreds of engineers on one server is not. Here you learn how big repos stay fast, how to choose a hosting platform, and how to lock down the place where all your code lives.",
        "Repo אחד על לפטופ זה קל; מאות מהנדסים על שרת אחד זה כבר סיפור אחר. כאן לומדים איך repos גדולים נשארים מהירים, איך בוחרים פלטפורמת hosting, ואיך נועלים את המקום שבו כל הקוד שלך יושב.",
        [
          s("git-large-repos", "Monorepos, sparse checkout and partial clone keep huge repos usable.", "Monorepos, sparse checkout ו-partial clone שומרים על repos ענקיים שמישים."),
          s("git-hosting-compare", "GitHub vs GitLab vs Bitbucket: pick the platform your pipelines will live on.", "GitHub מול GitLab מול Bitbucket: לבחור את הפלטפורמה שה-pipelines שלך יחיו עליה."),
          s("git-repo-security", "Branch protection, signed commits and secret scanning: the repo is the first link in the supply chain.", "Branch protection, commits חתומים ו-secret scanning: ה-repo הוא החוליה הראשונה ב-supply chain.")
        ]),
      st("Stage 3 · From source to artifact", "שלב 3 · מקוד מקור ל-artifact",
        "A pipeline is only as good as the thing it builds. Before automating, understand what a build actually produces, from compiled binaries and bundles to container images, and where those artifacts are stored and pulled from.",
        "Pipeline טוב רק כמו מה שהוא בונה. לפני שמבצעים אוטומציה, מבינים מה build באמת מייצר, מ-binaries מקומפלים ו-bundles ועד container images, ואיפה ה-artifacts האלה נשמרים ומאיפה מושכים אותם.",
        [
          s("compilers-how-code-runs", "Compiled, interpreted or JIT: what 'the build' really does to your code.", "Compiled, interpreted או JIT: מה 'ה-build' באמת עושה לקוד שלך."),
          s("linking-binaries", "Static vs dynamic linking explains 'works on CI, crashes in the container'.", "Static מול dynamic linking מסביר את 'עובד ב-CI, קורס בקונטיינר'."),
          s("transpilers-bundlers", "The frontend build: transpiling, bundling and why your JS artifact is a different file.", "ה-build של ה-frontend: transpiling, bundling ולמה ה-artifact של ה-JS הוא קובץ אחר לגמרי."),
          s("container-builds-buildkit", "BuildKit caching and rootless builds make the image step fast and safe.", "Caching של BuildKit ו-builds בלי root הופכים את שלב ה-image למהיר ובטוח."),
          s("container-registries", "Registries, tags vs digests and pull-through caches: where artifacts live.", "Registries, tags מול digests ו-pull-through caches: איפה ה-artifacts חיים.")
        ]),
      st("Stage 4 · Pipelines and releases", "שלב 4 · Pipelines ו-releases",
        "Now automate the road from commit to production. Start with the CI/CD concepts, go deep on GitHub Actions, then learn the release engineering and rollout techniques that make deploys small, reversible and boring.",
        "עכשיו הופכים לאוטומטית את הדרך מ-commit לפרודקשן. מתחילים מהמושגים של CI/CD, נכנסים לעומק של GitHub Actions, ואז לומדים release engineering וטכניקות rollout שהופכות deploys לקטנים, הפיכים ומשעממים.",
        [
          s("cloud-cicd", "The pipeline stages and GitOps, the shared vocabulary for everything after.", "שלבי ה-pipeline ו-GitOps, אוצר המילים המשותף לכל מה שבא אחר כך."),
          s("cicd-github-actions", "OIDC to the cloud, reusable workflows and runner security in a real setup.", "OIDC לענן, reusable workflows ואבטחת runners בהגדרה אמיתית."),
          s("release-engineering", "Versioning, changelogs and release trains: what happens after the build is green.", "Versioning, changelogs ו-release trains: מה קורה אחרי שה-build ירוק."),
          s("arch-feature-flags", "Flags separate deploy from release, so you can ship dark and turn on gradually.", "Flags מפרידים בין deploy ל-release, כך שאפשר לשחרר מוסתר ולהדליק בהדרגה."),
          s("rel-deployments", "Rolling, canary and blue-green: choose the rollout that fits the risk.", "Rolling, canary ו-blue-green: לבחור את ה-rollout שמתאים לסיכון."),
          s("flow-commit-to-prod", "Watch the whole stage run hop by hop, from git push to a signed canary.", "לראות את כל השלב רץ קפיצה אחר קפיצה, מ-git push ועד canary חתום.")
        ]),
      st("Stage 5 · Measure it and codify the platform", "שלב 5 · למדוד ולהפוך את הפלטפורמה לקוד",
        "A delivery process you can't measure won't improve, and infrastructure clicked in a console can't be reviewed. Finish with DORA metrics, then move the infrastructure itself into Git with the right IaC tool.",
        "תהליך delivery שאי אפשר למדוד לא ישתפר, ותשתית שנבנתה בקליקים ב-console אי אפשר לעשות לה review. מסיימים עם DORA metrics, ואז מעבירים את התשתית עצמה ל-Git עם כלי ה-IaC הנכון.",
        [
          s("dora-metrics", "Lead time, deploy frequency, change failure rate and MTTR show if all of the above works.", "Lead time, תדירות deploy, change failure rate ו-MTTR מראים אם כל מה שלמעלה עובד."),
          s("cloud-iac", "Terraform basics: plan, apply and state, the same review loop as application code.", "יסודות Terraform: plan, apply ו-state, אותה לולאת review כמו בקוד אפליקציה."),
          s("iac-landscape", "Terraform, OpenTofu, Pulumi, CDK, Crossplane: choose by team and lifecycle, not hype.", "Terraform, OpenTofu, Pulumi, CDK, Crossplane: לבחור לפי הצוות ומחזור החיים, לא לפי ה-hype."),
          s("staff-terraform-at-scale", "State splitting, modules, drift and policy when dozens of teams share the code.", "פיצול state, modules, drift ו-policy כשעשרות צוותים חולקים את הקוד."),
          s("k8s-helm-gitops", "Close the loop: Helm, Kustomize and Argo CD keep clusters in sync with Git.", "סוגרים את המעגל: Helm, Kustomize ו-Argo CD שומרים על ה-clusters מסונכרנים עם Git.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 9. Debugging & Errors
  INFRA.paths.push({
    id: "debugging-and-errors", icon: "🩺", color: "#a61e4d",
    title: { en: "Debugging & Errors: Read the Symptom, Find the Layer", he: "דיבאג ושגיאות: לקרוא את הסימפטום ולמצוא את השכבה" },
    blurb: {
      en: "Turn any error message into a location: which layer, which host, which process, which query. Read network, TLS and HTTP errors, trace a sick Linux box, hunt leaks and locks, and debug a cluster from its events.",
      he: "להפוך כל הודעת שגיאה למיקום: איזו שכבה, איזה host, איזה תהליך, איזה query. לקרוא שגיאות רשת, TLS ו-HTTP, לחקור מכונת Linux חולה, לצוד leaks ו-locks, ולדבג cluster לפי ה-events שלו."
    },
    audience: {
      en: "Engineers who get pulled into incidents and want a method instead of guessing. Comfortable with the terminal; 'Zero to Ops' is the ideal warm-up.",
      he: "מהנדסים שנגררים לתקלות ורוצים שיטה במקום ניחושים. מרגיש בנוח עם הטרמינל; 'מאפס ל-Ops' הוא חימום מצוין."
    },
    stages: [
      st("Stage 1 · Decode the error message", "שלב 1 · לפענח את הודעת השגיאה",
        "Most debugging time is lost before it starts, by misreading the error. 'Connection refused', 'timed out', 'certificate unknown' and '502' each point to a different layer. Learn to read them first, and half the incidents solve themselves.",
        "רוב זמן הדיבאג הולך לאיבוד עוד לפני שמתחילים, כי קוראים את השגיאה לא נכון. 'Connection refused', 'timed out', 'certificate unknown' ו-'502' מצביעים כל אחד על שכבה אחרת. לומדים לקרוא אותן קודם, וחצי מהתקלות פותרות את עצמן.",
        [
          s("net-errors-by-layer", "The map: which error belongs to which layer, and the one command that proves it.", "המפה: איזו שגיאה שייכת לאיזו שכבה, והפקודה האחת שמוכיחה את זה."),
          s("net-tcp-vs-udp", "Know which transport you're on, because UDP fails silently where TCP fails loudly.", "לדעת על איזה transport אתה, כי UDP נכשל בשקט איפה ש-TCP נכשל ברעש."),
          s("net-https-errors", "Expired, untrusted, wrong name or bad chain: every TLS error has a short checklist.", "פג תוקף, לא מהימן, שם לא נכון או chain שבור: לכל שגיאת TLS יש צ'קליסט קצר."),
          s("http-status-errors", "502 vs 503 vs 504 tells you exactly which hop gave up.", "502 מול 503 מול 504 אומר לך בדיוק איזו קפיצה ויתרה."),
          s("net-troubleshooting", "Put it together into a repeatable toolkit for proving or ruling out the network.", "מחברים הכול לארגז כלים קבוע שמוכיח או שולל את הרשת.")
        ]),
      st("Stage 2 · Deep in the network path", "שלב 2 · עמוק בתוך מסלול הרשת",
        "When the quick checks pass and it still fails, go one level down: TCP states and timeouts, the NAT table that silently drops connections, DNS behavior in production and the proxies that sit in every request.",
        "כשהבדיקות המהירות עוברות וזה עדיין נכשל, יורדים רמה: מצבי TCP ו-timeouts, טבלת ה-NAT שמפילה חיבורים בשקט, איך DNS מתנהג בפרודקשן וה-proxies שיושבים בכל בקשה.",
        [
          s("net-tcp-deep", "TIME_WAIT, retransmits and window sizes explain 'slow but not down'.", "TIME_WAIT, retransmits וגודלי window מסבירים את 'איטי אבל לא למטה'."),
          s("net-nat-conntrack", "A full conntrack table or exhausted SNAT ports drops packets with no error at all.", "טבלת conntrack מלאה או SNAT ports שנגמרו מפילים packets בלי שום שגיאה."),
          s("net-dns-operations", "TTLs, negative caching and ndots: the DNS problems that only show up in production.", "TTLs, negative caching ו-ndots: בעיות ה-DNS שמופיעות רק בפרודקשן."),
          s("net-proxies-hands-on", "Read nginx, HAProxy and Envoy logs and timeouts to find which proxy cut the request.", "לקרוא לוגים ו-timeouts של nginx, HAProxy ו-Envoy כדי למצוא איזה proxy חתך את הבקשה.")
        ]),
      st("Stage 3 · Inside the sick host", "שלב 3 · בתוך ה-host החולה",
        "If the network is clean, the problem is on the machine. Start with processes and the 60-second checkup, then use real profilers and tracers to see where CPU and memory actually go, including leaks and cgroup limits.",
        "אם הרשת נקייה, הבעיה על המכונה. מתחילים מתהליכים ומבדיקת 60 השניות, ואז משתמשים ב-profilers ו-tracers אמיתיים כדי לראות לאן CPU וזיכרון באמת הולכים, כולל leaks ומגבלות cgroup.",
        [
          s("linux-processes", "ps, /proc and strace show what a stuck process is really waiting for.", "ps, /proc ו-strace מראים למה תהליך תקוע באמת מחכה."),
          s("linux-performance-60s", "The first 60 seconds: rule out CPU, memory, disk and network in order.", "60 השניות הראשונות: לשלול CPU, זיכרון, דיסק ורשת לפי הסדר."),
          s("linux-perf-tracing", "perf and bpftrace answer 'where exactly is the time going?' with evidence.", "perf ו-bpftrace עונים על 'לאן בדיוק הולך הזמן?' עם ראיות."),
          s("linux-memory-leaks", "Tell a real leak from cache growth, then find the allocation that grows.", "להבדיל בין leak אמיתי לגדילה של cache, ואז למצוא את ההקצאה שגדלה."),
          s("linux-cgroups-v2", "Containers hit cgroup limits before the host does; read the counters that prove it.", "קונטיינרים נתקלים במגבלות cgroup לפני ה-host; לקרוא את המונים שמוכיחים את זה."),
          s("obs-profiling-synthetics", "Continuous profiling catches the regression after you've gone home.", "Continuous profiling תופס את הרגרסיה אחרי שכבר הלכת הביתה.")
        ]),
      st("Stage 4 · Databases and clusters", "שלב 4 · Databases ו-clusters",
        "The last two places most incidents end up: a slow query or a lock in the database, and a misbehaving workload in Kubernetes. Learn to read the evidence each one leaves behind, then write it down as a runbook.",
        "שני המקומות האחרונים שרוב התקלות מגיעות אליהם: query איטי או lock ב-database, ו-workload שמתנהג לא טוב ב-Kubernetes. לומדים לקרוא את הראיות שכל אחד משאיר, ואז כותבים אותן כ-runbook.",
        [
          s("db-query-debugging", "EXPLAIN ANALYZE and pg_locks find the slow query and the session blocking everyone.", "EXPLAIN ANALYZE ו-pg_locks מוצאים את ה-query האיטי ואת ה-session שחוסם את כולם."),
          s("k8s-events-audit", "Events say what Kubernetes did; audit logs say who asked it to.", "Events אומרים מה Kubernetes עשה; audit logs אומרים מי ביקש ממנו."),
          s("k8s-kubectl-power-tips", "jsonpath, debug containers and field selectors cut minutes off every investigation.", "jsonpath, debug containers ו-field selectors חוסכים דקות בכל חקירה."),
          s("k8s-troubleshooting-playbook", "The full playbook from Pod to node to control plane, using everything above.", "ה-playbook המלא מה-Pod ל-node ועד ה-control plane, עם כל מה שלמדת למעלה."),
          s("rel-runbooks-oncall", "Turn what you learned into runbooks so the next person debugs in minutes, not hours.", "להפוך את מה שלמדת ל-runbooks, כדי שהבא בתור ידבג בדקות ולא בשעות.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 10. Storage & Data from the metal up
  INFRA.paths.push({
    id: "storage-and-data", icon: "🗄️", color: "#8d6e3f",
    title: { en: "Storage & Data from the Metal Up", he: "Storage ונתונים מהברזל ומעלה" },
    blurb: {
      en: "Follow a byte from the disk platter to the lakehouse: hardware, filesystems and RAID, storage engines and indexes, replication and restores, search and analytics, and the streaming pipelines that move data between them.",
      he: "לעקוב אחרי byte מהדיסק ועד ה-lakehouse: חומרה, filesystems ו-RAID, storage engines ואינדקסים, replication ושחזורים, חיפוש ואנליטיקה, וה-pipelines של streaming שמזיזים נתונים ביניהם."
    },
    audience: {
      en: "Backend, data and platform engineers who pick and operate data stores, and anyone who wants to know why a database is fast or slow, not just that it is.",
      he: "מהנדסי backend, data ופלטפורמה שבוחרים ומפעילים data stores, וכל מי שרוצה לדעת למה database מהיר או איטי, ולא רק שהוא כזה."
    },
    stages: [
      st("Stage 1 · The metal", "שלב 1 · הברזל",
        "Every database promise ends at a physical device. Start with the units and the memory hierarchy, then learn how disks, filesystems and RAID really behave, because fsync latency and rebuild times show up later in every SLA.",
        "כל הבטחה של database נגמרת במכשיר פיזי. מתחילים מהיחידות ומהיררכיית הזיכרון, ואז לומדים איך דיסקים, filesystems ו-RAID באמת מתנהגים, כי latency של fsync וזמני rebuild צצים אחר כך בכל SLA.",
        [
          s("bits-bytes-units", "GB vs GiB and bits vs bytes: get the capacity math right before anything else.", "GB מול GiB ו-bits מול bytes: לסדר את חישובי הקיבולת לפני כל דבר אחר."),
          s("memory-hierarchy", "Caches, pages and the TLB explain why sequential access beats random by orders of magnitude.", "Caches, pages וה-TLB מסבירים למה גישה רציפה מנצחת גישה אקראית בסדרי גודל."),
          s("disks-hdd-ssd-nvme", "HDD vs SSD vs NVMe: seek time, write amplification and queue depth.", "HDD מול SSD מול NVMe: זמן seek, write amplification ו-queue depth."),
          s("filesystems-compared", "ext4, XFS, ZFS and friends: journaling and copy-on-write decide what survives a crash.", "ext4, XFS, ZFS והחברים: journaling ו-copy-on-write קובעים מה שורד קריסה."),
          s("fs-filesystems-raid", "LVM and RAID in practice: grow a volume and survive a dead disk.", "LVM ו-RAID בפועל: להגדיל volume ולשרוד דיסק מת."),
          s("raid-levels-deep", "The URE math shows why RAID 5 on big disks is a gamble.", "חישוב ה-URE מראה למה RAID 5 על דיסקים גדולים הוא הימור.")
        ]),
      st("Stage 2 · Inside the database engine", "שלב 2 · בתוך מנוע ה-database",
        "With the hardware understood, see how a database turns it into tables. B-trees vs LSM decide the read/write trade-off, the right index kind decides query speed, and partitioning keeps huge tables manageable.",
        "כשהחומרה מובנת, רואים איך database הופך אותה לטבלאות. B-tree מול LSM קובעים את ה-trade-off בין קריאה לכתיבה, סוג האינדקס הנכון קובע את מהירות ה-query, ו-partitioning שומר על טבלאות ענקיות ניתנות לניהול.",
        [
          s("db-storage-engines", "B-tree vs LSM: why Postgres and Cassandra make opposite trade-offs.", "B-tree מול LSM: למה Postgres ו-Cassandra עושים trade-offs הפוכים."),
          s("infra-data-structures", "Bloom filters, skip lists and WALs: the structures hiding inside every store.", "Bloom filters, skip lists ו-WALs: מבני הנתונים שמסתתרים בתוך כל store."),
          s("db-index-kinds", "B-tree, hash, GIN, BRIN and partial indexes, and when an index makes things worse.", "B-tree, hash, GIN, BRIN ואינדקסים חלקיים, ומתי אינדקס דווקא מזיק."),
          s("db-partitioning", "Partition a table inside one database before you reach for sharding.", "לעשות partitioning לטבלה בתוך DB אחד לפני שקופצים ל-sharding."),
          s("db-wide-column-kv", "DynamoDB and Cassandra: when the access pattern is the schema.", "DynamoDB ו-Cassandra: כש-access pattern הוא ה-schema.")
        ]),
      st("Stage 3 · Durable and available", "שלב 3 · עמיד וזמין",
        "Data that lives on one disk is data you'll lose. Learn object storage as the durable base layer, then replication and failover, and finally the backups and the restore runbook you will need on the worst day.",
        "נתונים שחיים על דיסק אחד הם נתונים שתאבד. לומדים object storage כשכבת בסיס עמידה, אחר כך replication ו-failover, ולבסוף את הגיבויים ואת ה-runbook של השחזור שתצטרך ביום הכי גרוע.",
        [
          s("s3-deep", "S3's object model, consistency and encryption: the durable layer under backups and lakehouses.", "מודל ה-objects של S3, עקביות והצפנה: השכבה העמידה שמתחת לגיבויים ול-lakehouses."),
          s("db-postgres-ha-patroni", "Patroni and etcd turn replicas into automatic failover without split brain.", "Patroni ו-etcd הופכים replicas ל-failover אוטומטי בלי split brain."),
          s("db-managed-cloud", "RDS, Aurora and Cloud SQL: what the provider handles and what's still on you.", "RDS, Aurora ו-Cloud SQL: מה הספק מטפל בו ומה עדיין עליך."),
          s("db-backups", "Full, incremental and PITR: choose backups by the RPO you promised.", "Full, incremental ו-PITR: בוחרים גיבויים לפי ה-RPO שהבטחת."),
          s("db-restore-runbook", "A backup is only real once you've restored it; practice the runbook now.", "גיבוי אמיתי רק אחרי ששחזרת אותו; מתרגלים את ה-runbook עכשיו.")
        ]),
      st("Stage 4 · Specialized stores and search", "שלב 4 · Stores ייעודיים וחיפוש",
        "General databases struggle with metrics, text search and analytics. Learn the purpose-built engines and the algorithms behind search, so you know when to add one and what it will cost to run.",
        "Databases כלליים מתקשים עם metrics, חיפוש טקסט ואנליטיקה. לומדים את המנועים הייעודיים ואת האלגוריתמים שמאחורי החיפוש, כדי לדעת מתי להוסיף אחד וכמה יעלה להפעיל אותו.",
        [
          s("db-time-series", "Time-series stores compress metrics and expire them by design.", "Time-series stores דוחסים metrics ומוחקים אותם לפי תכנון."),
          s("db-search-engines", "Inverted indexes, shards and mappings in Elasticsearch and OpenSearch.", "Inverted indexes, shards ו-mappings ב-Elasticsearch וב-OpenSearch."),
          s("algo-edit-distance", "Edit distance powers fuzzy matching and typo tolerance in every search box.", "Edit distance מפעיל fuzzy matching וסובלנות לשגיאות הקלדה בכל תיבת חיפוש."),
          s("algo-search-ranking", "Ranking algorithms like BM25 decide which result comes first, and why.", "אלגוריתמי ranking כמו BM25 קובעים איזו תוצאה מופיעה ראשונה, ולמה."),
          s("algo-similarity-dedup", "Similarity hashing finds near-duplicates across billions of documents.", "Similarity hashing מוצא מסמכים כמעט זהים בתוך מיליארדי מסמכים."),
          s("db-olap-columnar", "Columnar warehouses scan billions of rows in seconds; know when OLTP should hand off.", "Warehouses עמודתיים סורקים מיליארדי שורות בשניות; לדעת מתי ה-OLTP צריך להעביר את העבודה.")
        ]),
      st("Stage 5 · Data in motion", "שלב 5 · נתונים בתנועה",
        "Finally connect the stores: CDC pulls changes out of the operational database, stream processors transform them, open table formats land them in the lakehouse, and contracts and quality checks keep the whole chain trustworthy.",
        "לסיום מחברים את ה-stores: CDC שולף שינויים מה-database התפעולי, stream processors מעבדים אותם, open table formats מנחיתים אותם ב-lakehouse, ו-contracts ובדיקות איכות שומרים על כל השרשרת אמינה.",
        [
          s("data-cdc-debezium", "Debezium reads the WAL so changes flow out without dual writes.", "Debezium קורא את ה-WAL כך ששינויים יוצאים החוצה בלי dual writes."),
          s("data-stream-processing", "Flink and Kafka Streams: windows, state and exactly-once on moving data.", "Flink ו-Kafka Streams: windows, state ו-exactly-once על נתונים בתנועה."),
          s("data-lakehouse-formats", "Iceberg and Delta add transactions and time travel on top of S3.", "Iceberg ו-Delta מוסיפים transactions ו-time travel מעל S3."),
          s("data-contracts-schema-registry", "Schema registries stop one producer's change from breaking every consumer.", "Schema registries מונעים משינוי של producer אחד לשבור את כל ה-consumers."),
          s("data-quality-observability", "Freshness, volume and schema checks catch bad data before the dashboard lies.", "בדיקות freshness, נפח ו-schema תופסות נתונים רעים לפני שהדשבורד משקר.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 11. AI Infra 2026
  INFRA.paths.push({
    id: "ai-infra-2026", icon: "🤖", color: "#0ca678",
    title: { en: "AI Infra 2026", he: "תשתיות AI ב-2026" },
    blurb: {
      en: "Build and run AI features as real infrastructure: retrieval and vector search, model serving and GPUs, agents and MCP servers, AI security, LLMOps, and using AI to run your own engineering and on-call.",
      he: "לבנות ולהריץ פיצ'רים של AI כתשתית אמיתית: retrieval ו-vector search, serving של מודלים ו-GPUs, agents ו-MCP servers, אבטחת AI, LLMOps, ושימוש ב-AI כדי להריץ את ה-engineering וה-on-call שלך."
    },
    audience: {
      en: "Backend and platform engineers asked to 'add AI' or to own the platform behind it. You should know APIs, containers and basic Kubernetes; no ML background needed.",
      he: "מהנדסי backend ופלטפורמה שהתבקשו 'להוסיף AI' או להיות אחראים על הפלטפורמה שמאחוריו. כדאי להכיר APIs, קונטיינרים ו-Kubernetes בסיסי; לא צריך רקע ב-ML."
    },
    stages: [
      st("Stage 1 · Grounding models in your data", "שלב 1 · לחבר את המודל לנתונים שלך",
        "Most production AI is retrieval, not training. Start with embeddings and vector databases, go deep on RAG quality, then decide when fine-tuning is actually worth it and which managed platform to build on.",
        "רוב ה-AI בפרודקשן הוא retrieval, לא אימון. מתחילים מ-embeddings ו-vector databases, נכנסים לעומק של איכות RAG, ואז מחליטים מתי fine-tuning באמת שווה את זה ועל איזו פלטפורמה מנוהלת לבנות.",
        [
          s("db-vector", "Embeddings and ANN indexes: the storage layer of every RAG system.", "Embeddings ואינדקסי ANN: שכבת ה-storage של כל מערכת RAG."),
          s("ai-rag-deep", "Chunking, hybrid search and reranking decide whether answers are right.", "Chunking, hybrid search ו-reranking קובעים אם התשובות נכונות."),
          s("ai-finetune-vs-rag", "Prompting, RAG or fine-tuning: change the weights only when the cheaper options fail.", "Prompting, RAG או fine-tuning: לשנות את המשקלים רק כשהאפשרויות הזולות נכשלות."),
          s("cloud-ai-platforms", "Bedrock, Azure AI Foundry and Vertex AI: what you get and what you're locked into.", "Bedrock, Azure AI Foundry ו-Vertex AI: מה מקבלים ולמה ננעלים.")
        ]),
      st("Stage 2 · Running the models", "שלב 2 · להריץ את המודלים",
        "If you host models yourself, GPUs become your most expensive and fragile resource. Learn the serving math first, then how to run inference on Kubernetes, then what changes when you train across a cluster.",
        "אם אתה מארח מודלים בעצמך, GPUs הופכים למשאב הכי יקר והכי שביר שלך. לומדים קודם את המתמטיקה של serving, אחר כך איך מריצים inference על Kubernetes, ואז מה משתנה כשמאמנים על פני cluster.",
        [
          s("ai-llm-serving", "KV cache math, batching and quantization decide tokens per second and cost.", "חישובי KV cache, batching ו-quantization קובעים tokens לשנייה ועלות."),
          s("k8s-gpu-inference", "GPU nodes, device plugins and autoscaling inference servers on Kubernetes.", "GPU nodes, device plugins ו-autoscaling לשרתי inference על Kubernetes."),
          s("ai-gpu-clusters", "Parallelism, interconnects and failure handling when training spans hundreds of GPUs.", "Parallelism, interconnects וטיפול בכשלים כשאימון פרוש על מאות GPUs.")
        ]),
      st("Stage 3 · Agents and tools", "שלב 3 · Agents וכלים",
        "Agents turn a model into something that acts, and every tool you give it is a new attack surface. Learn the patterns that work, how to build and host MCP servers, and how to keep the whole thing from leaking data or running wild.",
        "Agents הופכים מודל למשהו שפועל, וכל כלי שנותנים לו הוא משטח תקיפה חדש. לומדים את התבניות שעובדות, איך בונים ומארחים MCP servers, ואיך מונעים מכל זה לדלוף נתונים או לצאת משליטה.",
        [
          s("ai-agents-patterns", "Router, planner and reflection patterns, with the limits that keep agents predictable.", "תבניות router, planner ו-reflection, עם המגבלות ששומרות על agents צפויים."),
          s("arch-durable-execution", "Long-running agent tasks need durable execution to survive crashes and retries.", "משימות agent ארוכות צריכות durable execution כדי לשרוד קריסות ו-retries."),
          s("ai-mcp-servers", "Build an MCP server with auth, scoped tools and audit logs.", "לבנות MCP server עם auth, כלים מוגבלים ו-audit logs."),
          s("ai-agent-infra-mcp", "Run agents and MCP as shared platform infrastructure for many teams.", "להריץ agents ו-MCP כתשתית פלטפורמה משותפת להרבה צוותים."),
          s("ai-security-practice", "Prompt injection, exfiltration and sandboxes: the controls that actually stop attacks.", "Prompt injection, exfiltration ו-sandboxes: ה-controls שבאמת עוצרים תקיפות.")
        ]),
      st("Stage 4 · Operating AI and AI for operations", "שלב 4 · לתפעל AI ו-AI לתפעול",
        "An AI feature you can't evaluate or price is a liability. Finish with LLMOps, follow a full request end to end, then turn AI on your own work: coding agents in the SDLC and AI in the on-call loop, both with guardrails.",
        "פיצ'ר AI שאי אפשר למדוד את האיכות או המחיר שלו הוא סיכון. מסיימים עם LLMOps, עוקבים אחרי בקשה מלאה מקצה לקצה, ואז מפנים את ה-AI לעבודה שלך: coding agents ב-SDLC ו-AI בלולאת ה-on-call, שניהם עם guardrails.",
        [
          s("ai-llmops", "Evals, tracing, cost tracking and AI gateways: production hygiene for LLM features.", "Evals, tracing, מעקב עלויות ו-AI gateways: היגיינת פרודקשן לפיצ'רים של LLM."),
          s("flow-llm-request", "See every earlier lesson in one request: gateway, guardrails, RAG, tools and evals.", "לראות כל שיעור קודם בבקשה אחת: gateway, guardrails, RAG, כלים ו-evals."),
          s("ai-assisted-engineering", "Coding agents in the SDLC without losing review, security or ownership.", "Coding agents ב-SDLC בלי לאבד review, אבטחה או ownership."),
          s("ai-aiops-oncall", "LLMs in triage and anomaly detection, with humans approving every risky action.", "LLMs ב-triage וב-anomaly detection, כשבן אדם מאשר כל פעולה מסוכנת.")
        ])
    ]
  });

  // ------------------------------------------------------------------ 12. Cloud Done Right: cost & security
  INFRA.paths.push({
    id: "cloud-cost-and-security", icon: "🔐", color: "#364fc7",
    title: { en: "Cloud Done Right: Security & Cost", he: "ענן כמו שצריך: אבטחה ועלויות" },
    blurb: {
      en: "Set up a cloud estate that is secure by default and cheap by design: landing zones, IAM, production access, secrets, encryption and certificates, compliance, and the pricing levers that cut the bill without cutting reliability.",
      he: "להקים סביבת ענן שמאובטחת כברירת מחדל וזולה מעצם התכנון: landing zones, IAM, גישה לפרודקשן, secrets, הצפנה ותעודות, compliance, והמנופים של התמחור שמורידים את החשבון בלי לפגוע באמינות."
    },
    audience: {
      en: "Cloud, platform and DevOps engineers who own accounts and the bill. You should know the basic cloud services; the 'Zero to Ops' cloud stage is enough.",
      he: "מהנדסי ענן, פלטפורמה ו-DevOps שאחראים על ה-accounts ועל החשבון. כדאי להכיר את שירותי הענן הבסיסיים; שלב הענן ב-'מאפס ל-Ops' מספיק."
    },
    stages: [
      st("Stage 1 · The foundation: accounts and identity", "שלב 1 · היסודות: accounts וזהות",
        "Security and cost both start from structure. A landing zone gives every team its own blast radius and bill, IAM decides who can do what inside it, and a proper access model removes standing admin rights from humans.",
        "גם אבטחה וגם עלויות מתחילות ממבנה. Landing zone נותן לכל צוות blast radius וחשבון משלו, IAM קובע מי יכול לעשות מה בתוכו, ומודל גישה נכון מוריד הרשאות admin קבועות מבני אדם.",
        [
          s("cloud-landing-zones", "Multi-account structure, SCPs and guardrails: decide this before the first workload lands.", "מבנה multi-account, SCPs ו-guardrails: מחליטים על זה לפני שה-workload הראשון נוחת."),
          s("cloud-aws-iam-deep", "How policy evaluation really works, so 'AccessDenied' becomes a 5-minute fix.", "איך policy evaluation באמת עובד, כדי ש-'AccessDenied' יהפוך לתיקון של 5 דקות."),
          s("cloud-engineer-access", "Bastion-less, just-in-time and audited access to production for humans.", "גישה לפרודקשן בלי bastion, just-in-time ועם audit, לבני אדם.")
        ]),
      st("Stage 2 · Secrets, crypto and certificates", "שלב 2 · Secrets, קריפטוגרפיה ותעודות",
        "With identities in place, protect what they guard. Keep secrets out of code and rotate them, use hashing and encryption correctly instead of approximately, and automate certificates so expiry never pages you again.",
        "כשהזהויות במקום, מגינים על מה שהן שומרות עליו. מוציאים secrets מהקוד ומבצעים להם rotation, משתמשים ב-hashing ובהצפנה נכון ולא בערך, והופכים תעודות לאוטומטיות כדי שפג תוקף לא יעיר אותך יותר.",
        [
          s("cloud-secrets-management", "Vault and cloud secret stores with rotation, not a .env file in the repo.", "Vault ו-secret stores בענן עם rotation, לא קובץ .env ב-repo."),
          s("crypto-hashing-practice", "Password hashing, HMACs and integrity checks, with the right algorithm for each.", "Hashing לסיסמאות, HMACs ובדיקות integrity, עם האלגוריתם הנכון לכל אחד."),
          s("crypto-encryption-practice", "KMS, envelope encryption and key rotation for data at rest and in transit.", "KMS, envelope encryption ו-key rotation לנתונים במנוחה ובתנועה."),
          s("rel-cert-operations", "Inventory, automate and monitor certificates so expiry is never an incident.", "לעשות inventory, אוטומציה ו-monitoring לתעודות כדי שפג תוקף לא יהיה תקלה אף פעם.")
        ]),
      st("Stage 3 · The bill", "שלב 3 · החשבון",
        "Now the money. First learn to read the bill, then apply the levers in order of safety: commitments for the steady base, spot for interruptible work, and the hidden costs of data transfer and forgotten storage.",
        "עכשיו הכסף. קודם לומדים לקרוא את החשבון, ואז מפעילים את המנופים לפי סדר הבטיחות: commitments לבסיס הקבוע, spot לעבודה שאפשר להפסיק, והעלויות הנסתרות של העברת נתונים ו-storage שנשכח.",
        [
          s("cloud-finops", "Tags, allocation and unit cost: see where the money goes before cutting.", "Tags, הקצאת עלויות ו-unit cost: לראות לאן הכסף הולך לפני שחותכים."),
          s("cloud-commitments", "Savings Plans, RIs, CUDs and ARM: the biggest discount for the steady baseline.", "Savings Plans, RIs, CUDs ו-ARM: ההנחה הגדולה ביותר לבסיס הקבוע."),
          s("cloud-spot-instances", "Spot saves up to 90% if your workload handles a two-minute warning.", "Spot חוסך עד 90% אם ה-workload שלך מתמודד עם התראה של שתי דקות."),
          s("cloud-data-transfer-costs", "Cross-AZ traffic, NAT gateways and egress: the line items nobody planned.", "תעבורה בין AZs, NAT gateways ו-egress: השורות בחשבון שאף אחד לא תכנן."),
          s("cloud-storage-lifecycle", "Storage classes, lifecycle rules and versioning stop object storage from growing forever.", "Storage classes, lifecycle rules ו-versioning מונעים מ-object storage לגדול לנצח.")
        ]),
      st("Stage 4 · Prove it and keep it right", "שלב 4 · להוכיח ולשמור על זה",
        "A good setup drifts unless someone checks it. Finish by mapping controls to compliance frameworks, running continuous security operations, and reviewing the whole estate against the Well-Architected pillars on a schedule.",
        "הגדרה טובה נשחקת אם אף אחד לא בודק אותה. מסיימים במיפוי controls ל-frameworks של compliance, בהפעלת security operations רציפים, ובבדיקה של כל הסביבה מול עמודי ה-Well-Architected באופן קבוע.",
        [
          s("compliance-for-engineers", "SOC 2, ISO 27001 and evidence: turn what you built into audit answers.", "SOC 2, ISO 27001 וראיות: להפוך את מה שבנית לתשובות ל-audit."),
          s("pr-security-ops", "Vulnerability SLAs, detections and response keep the controls honest.", "SLAs לחולשות, detections ותגובה שומרים על ה-controls כנים."),
          s("cloud-well-architected", "A recurring review across security, cost, reliability and performance ties the path together.", "Review קבוע על פני אבטחה, עלות, אמינות וביצועים קושר את כל המסלול.")
        ])
    ]
  });
})();
