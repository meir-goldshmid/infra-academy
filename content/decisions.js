window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Design decision simulator (kind: "design", shown on #/decide).
   Same engine as the on-call scenarios: each step is a fork, each choice
   is scored on the quality of the trade-off, the end step summarizes the
   design a principal would recommend.
   ========================================================================= */
(function () {
  var S = window.INFRA.scenarios;
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  /* ---------------------------------------------------------------- 1 */
  S.push({
    id: "dd-global-db",
    kind: "design",
    icon: "🌍",
    title: t("Pick the database for a global, write-heavy product", "לבחור DB למוצר גלובלי עם הרבה כתיבות"),
    start: "s1",
    steps: {
      s1: {
        text: t("You're the principal on a new activity-feed product. The CTO wants your database recommendation by Friday. Start where a principal starts.",
                "אתה ה-Principal על מוצר activity feed חדש. ה-CTO רוצה המלצה על DB עד יום שישי. תתחיל מאיפה ש-Principal מתחיל."),
        data: `Requirements (draft)
- 10k writes/s steady, 40k/s peak (events, likes, comments)
- 60k reads/s, mostly "latest 50 items for user X"
- Users: 45% US, 35% EU, 20% APAC
- p99 read < 200 ms, p99 write < 300 ms (user-facing)
- Data: 2 TB/year, keep 3 years
- Team: 6 backend engineers, no DBA
- EU data must stay in EU (GDPR / customer contracts)`,
        choices: [
          c("Clarify the consistency needs per operation first", "קודם להבין את דרישות ה-consistency לכל פעולה", "s2", 10,
            "Exactly. 'A like counter' and 'a payment' need different guarantees. Most of this workload (feeds, likes) tolerates eventual consistency; only a few operations (account changes) need strong. That single answer decides between AP and CP stores.",
            "בדיוק. 'מונה לייקים' ו'תשלום' צריכים הבטחות שונות. רוב העומס כאן (feeds, לייקים) סובל eventual consistency; רק מעט פעולות (שינויי חשבון) צריכות strong. התשובה הזו לבד מכריעה בין AP ל-CP."),
          c("Postgres: it's what the team knows", "Postgres: זה מה שהצוות מכיר", "s2", 4,
            "Team familiarity is a real factor, but you skipped the requirements. A single-primary Postgres in one region can't give EU and APAC users a p99 write under 300 ms, and 40k writes/s at peak needs sharding you'd have to build yourself.",
            "היכרות של הצוות היא שיקול אמיתי, אבל דילגת על הדרישות. Postgres עם primary אחד באזור אחד לא ייתן למשתמשים ב-EU וב-APAC p99 כתיבה מתחת ל-300ms, ו-40k כתיבות בשנייה בשיא דורשות sharding שתצטרך לבנות בעצמך."),
          c("Spanner/CockroachDB everywhere: strong consistency is safest", "Spanner/CockroachDB בכל מקום: strong consistency הכי בטוח", "s2", 3,
            "Global strong consistency costs a cross-region consensus round trip on every write (often 100-200 ms+) and a big bill. You'd pay that for likes and feed items that don't need it. Decide per operation, not 'safest for everything'.",
            "Strong consistency גלובלי עולה round trip של consensus בין אזורים על כל כתיבה (לרוב 100-200ms ומעלה) וחשבון גדול. היית משלם את זה על לייקים ופריטי feed שלא צריכים את זה. מחליטים לכל פעולה, לא 'הכי בטוח לכולם'.")
        ]
      },
      s2: {
        text: t("Answer: feed items, likes and comments can be eventually consistent (seconds). Account/billing changes need strong consistency but are &lt; 50 writes/s. The access pattern is key-based: 'items for user X, newest first'. What's the data model direction?",
                "תשובה: פריטי feed, לייקים ותגובות יכולים להיות eventually consistent (שניות). שינויי חשבון/billing צריכים strong consistency אבל הם פחות מ-50 כתיבות בשנייה. דפוס הגישה מבוסס מפתח: 'פריטים של משתמש X, מהחדש לישן'. לאיזה כיוון הולך מודל הנתונים?"),
        choices: [
          c("Split: wide-column/KV store for the feed, small relational DB for accounts", "לפצל: wide-column/KV ל-feed, DB רלציוני קטן לחשבונות", "s3", 10,
            "Polyglot persistence done for the right reason: two workloads with different shapes and guarantees. A partition key of user_id with a clustering key of time serves 'latest 50' in one partition read.",
            "Polyglot persistence מהסיבה הנכונה: שני עומסים עם צורה והבטחות שונות. partition key של user_id עם clustering key של זמן מגיש 'אחרונים 50' בקריאה של partition אחד."),
          c("One relational schema with joins for everything", "Schema רלציוני אחד עם joins לכל דבר", "s3", 3,
            "Joins across feed, likes and comments at 60k reads/s will need heavy caching and denormalization anyway. You'd end up rebuilding a key-value access pattern on top of a database that makes multi-region writes hard.",
            "Joins בין feed, לייקים ותגובות ב-60k קריאות בשנייה ידרשו caching ו-denormalization כבדים בכל מקרה. תגיע לבנות דפוס key-value מעל DB שמקשה על כתיבות multi-region."),
          c("Store everything in a document DB, one document per user", "הכול ב-document DB, מסמך אחד לכל משתמש", "s3", 4,
            "A document per user grows without bound (16 MB limit in MongoDB) and turns every like into a rewrite of a hot document. Document stores can work here, but model items as separate documents keyed by user and time.",
            "מסמך לכל משתמש גדל בלי גבול (מגבלת 16MB ב-MongoDB) והופך כל לייק לכתיבה מחדש של מסמך חם. document store יכול לעבוד כאן, אבל צריך למדל פריטים כמסמכים נפרדים לפי משתמש וזמן.")
        ]
      },
      s3: {
        text: t("How do you place data across the three regions, given the EU residency rule?",
                "איך ממקמים את הנתונים בשלושת האזורים, בהתחשב בכלל ה-residency של EU?"),
        choices: [
          c("Home each user in a region (geo-partition); replicate only what must be global", "לשייך כל משתמש לאזור בית (geo-partition); לשכפל רק מה שחייב להיות גלובלי", "s4", 10,
            "This meets residency by construction, keeps writes local (fast), and limits cross-region traffic to what's truly shared. Cassandra/Scylla with per-region keyspaces, DynamoDB per region, or CockroachDB REGIONAL BY ROW all express it.",
            "זה עומד ב-residency מעצם התכנון, משאיר כתיבות מקומיות (מהירות), ומגביל תעבורה בין אזורים למה שבאמת משותף. Cassandra/Scylla עם keyspace לכל אזור, DynamoDB לכל אזור, או CockroachDB עם REGIONAL BY ROW, כולם מבטאים את זה."),
          c("Active-active multi-master: every region has all data", "Active-active multi-master: לכל אזור יש את כל הנתונים", "s4", 3,
            "Full replication everywhere breaks the EU residency requirement immediately, and multi-master conflict resolution (last-write-wins) silently drops concurrent edits. Fast reads, but legally and logically wrong here.",
            "שכפול מלא לכל מקום שובר מיד את דרישת ה-residency של EU, ופתרון קונפליקטים ב-multi-master (last-write-wins) מוחק בשקט עריכות מקבילות. קריאות מהירות, אבל שגוי משפטית ולוגית כאן."),
          c("One primary region in the US, read replicas elsewhere", "Primary אחד בארה\"ב, read replicas בשאר האזורים", "s4", 4,
            "Simple, but EU personal data now lives in the US primary (residency violation) and every EU/APAC write pays 100-250 ms of ocean round trips. It works for read-heavy, single-region-write products; this isn't one.",
            "פשוט, אבל מידע אישי של EU יושב עכשיו ב-primary בארה\"ב (הפרת residency) וכל כתיבה מ-EU/APAC משלמת 100-250ms של חציית אוקיינוס. זה עובד למוצרים עם הרבה קריאות וכתיבה מאזור אחד; זה לא המקרה כאן.")
        ]
      },
      s4: {
        text: t("Peak is 4x steady. The team has no DBA. How do you operate it?",
                "השיא הוא פי 4 מהרגיל. אין לצוות DBA. איך מתפעלים את זה?"),
        choices: [
          c("Managed service (DynamoDB / Keyspaces / Astra / Scylla Cloud) with autoscaling and load tests at 2x peak", "שירות מנוהל (DynamoDB / Keyspaces / Astra / Scylla Cloud) עם autoscaling ו-load tests ב-2x מהשיא", "s5", 10,
            "With 6 engineers and no DBA, operating a self-hosted distributed database is a full-time job you don't have. Pay the managed premium, and prove capacity with a load test at 80k writes/s before launch.",
            "עם 6 מהנדסים ובלי DBA, תפעול של DB מבוזר self-hosted הוא משרה מלאה שאין לך. משלמים את הפרמיה על managed, ומוכיחים capacity עם load test של 80k כתיבות בשנייה לפני ההשקה."),
          c("Self-host Cassandra on Kubernetes to save money", "Cassandra self-hosted על Kubernetes כדי לחסוך", "s5", 3,
            "Possible with an operator, but compaction tuning, repairs, node replacement and upgrades across 3 regions will land on 6 app engineers. The 'savings' usually disappear in the first incident.",
            "אפשרי עם operator, אבל כוונון compaction, repairs, החלפת nodes ושדרוגים ב-3 אזורים ייפלו על 6 מהנדסי אפליקציה. ה'חיסכון' בדרך כלל נעלם בתקלה הראשונה."),
          c("Over-provision for peak permanently", "להקצות קבוע לפי השיא", "s5", 5,
            "Safe for latency, but you pay for 4x capacity 24/7. Fine as a launch stop-gap; then move to autoscaling or on-demand capacity once you've measured real traffic.",
            "בטוח מבחינת latency, אבל משלמים על פי 4 קיבולת 24/7. סביר כפתרון זמני להשקה; אחר כך עוברים ל-autoscaling או on-demand אחרי שמודדים traffic אמיתי.")
        ]
      },
      s5: {
        text: t("Final review with the CTO: 'What happens when a whole region goes down?'",
                "סקירה אחרונה עם ה-CTO: 'מה קורה כשאזור שלם נופל?'"),
        choices: [
          c("Users homed there get a degraded read-only experience from a cached/replicated copy where residency allows; RPO/RTO are written in the design doc and drilled", "משתמשים ששויכו לאזור מקבלים חוויה מופחתת, read-only, מעותק cached/משוכפל איפה שה-residency מאפשר; RPO/RTO כתובים במסמך ה-design ומתורגלים", "win", 10,
            "A principal answer: an explicit, tested degradation mode instead of a promise of magic. You named the trade-off (residency vs availability) and wrote it down.",
            "תשובה של Principal: מצב degradation מפורש ובדוק, במקום הבטחה לקסם. ציינת את ה-trade-off (residency מול זמינות) ורשמת אותו."),
          c("'The database is multi-region, so nothing happens'", "'ה-DB הוא multi-region, אז לא קורה כלום'", "lose", 0,
            "Geo-partitioned data for that region is unavailable (or, worse, you quietly replicated EU data out of the EU). 'Nothing happens' is the answer that becomes a 6-hour outage with no plan.",
            "הנתונים של האזור הזה ב-geo-partition לא זמינים (או גרוע מזה, שכפלת בשקט מידע של EU אל מחוץ ל-EU). 'לא קורה כלום' היא התשובה שהופכת לתקלה של 6 שעות בלי תוכנית.")
        ]
      },
      win: {
        text: t("✅ Approved. The design: a geo-partitioned wide-column/KV store (managed) for feed, likes and comments, keyed by user and time, eventually consistent; a small strongly consistent relational DB for accounts and billing; users homed per region for latency and residency; load-tested at 2x peak; a documented region-failure mode with RPO/RTO.",
                "✅ אושר. ה-design: wide-column/KV מנוהל עם geo-partitioning ל-feed, לייקים ותגובות, לפי משתמש וזמן, eventually consistent; DB רלציוני קטן ו-strongly consistent לחשבונות ו-billing; כל משתמש משויך לאזור בית בשביל latency ו-residency; load test ב-2x מהשיא; ומצב כשל אזורי מתועד עם RPO/RTO."),
        end: "win"
      },
      lose: {
        text: t("💥 Three months after launch an AWS region has a 4-hour outage. Half the EU users can't log in, support is flooded, and legal discovers EU data was replicated to the US. The fix: decide consistency and residency per data type, and design the failure mode before you need it.",
                "💥 שלושה חודשים אחרי ההשקה אזור של AWS נופל ל-4 שעות. חצי ממשתמשי EU לא מצליחים להתחבר, התמיכה מוצפת, והמחלקה המשפטית מגלה שמידע של EU שוכפל לארה\"ב. התיקון: להחליט על consistency ו-residency לכל סוג נתונים, ולתכנן את מצב הכשל לפני שצריכים אותו."),
        end: "lose"
      }
    },
    lessons: ["pr-db-landscape", "pr-cap-pacelc", "staff-multi-region-data", "db-sharding", "pr-sizing"]
  });

  /* ---------------------------------------------------------------- 2 */
  S.push({
    id: "dd-monolith-split",
    kind: "design",
    icon: "🧱",
    title: t("The slow monolith: split it, modularize it, or fix the pipeline?", "המונוליט האיטי: לפצל, למדל למודולים, או לתקן את ה-pipeline?"),
    start: "s1",
    steps: {
      s1: {
        text: t("The VP Engineering says: 'We're moving to microservices next quarter.' You're asked to lead it. First move?",
                "ה-VP Engineering אומר: 'ברבעון הבא עוברים ל-microservices.' מבקשים ממך להוביל. מה הצעד הראשון?"),
        data: `Current state
- 1 Rails/Java monolith, 900k LOC, 1 Postgres
- 40 engineers in 6 teams, all deploy the same artifact
- Deploys: 2/week, each takes 3 h (90 min CI, manual QA)
- Change failure rate: 22%, MTTR 4 h
- Top complaint: "my change waits for everyone else's"
- Traffic: 3k RPS, fine on current infra`,
        choices: [
          c("Measure where the time and pain actually go before choosing a solution", "למדוד לאן הזמן והכאב באמת הולכים לפני שבוחרים פתרון", "s2", 10,
            "The stated goal is microservices; the actual problem is lead time and change failure rate. Measure CI duration, test flakiness, merge queue waits and which modules change together. The cure depends on the diagnosis.",
            "המטרה שהוצהרה היא microservices; הבעיה האמיתית היא lead time ו-change failure rate. מודדים את משך ה-CI, flakiness של בדיקות, המתנה בתור ה-merge ואילו מודולים משתנים יחד. התרופה תלויה באבחנה."),
          c("Start extracting the biggest module into a service right away", "להתחיל מיד לחלץ את המודול הגדול ביותר לשירות", "s2", 2,
            "Extracting without knowing the boundaries usually produces a distributed monolith: two services that must deploy together and share a database. You add network failures on top of the original coupling.",
            "חילוץ בלי לדעת את הגבולות מייצר בדרך כלל distributed monolith: שני שירותים שחייבים לעלות יחד וחולקים DB. מוסיפים כשלי רשת על הצימוד המקורי."),
          c("Rewrite from scratch as microservices in parallel", "לכתוב מחדש מאפס כ-microservices במקביל", "s2", 0,
            "The big-bang rewrite: two systems to maintain for years, feature parity that never arrives, and the old system keeps evolving. Strangle incrementally instead.",
            "השכתוב הגדול: שתי מערכות לתחזק במשך שנים, feature parity שלא מגיע אף פעם, והמערכת הישנה ממשיכה להשתנות. עדיף strangler הדרגתי.")
        ]
      },
      s2: {
        text: t("Findings: 55% of lead time is CI + manual QA; 30% of CI failures are flaky tests; 4 of 6 teams mostly touch their own folders, but everyone shares one 'models' package and the DB schema.",
                "ממצאים: 55% מה-lead time הוא CI ו-QA ידני; 30% מכשלי ה-CI הם בדיקות flaky; 4 מתוך 6 צוותים נוגעים בעיקר בתיקיות של עצמם, אבל כולם חולקים חבילת 'models' אחת ואת ה-schema של ה-DB."),
        choices: [
          c("Fix the pipeline first: parallel CI, quarantine flaky tests, automate QA, deploy daily", "לתקן קודם את ה-pipeline: CI מקבילי, הסגר לבדיקות flaky, אוטומציה ל-QA, deploy יומי", "s3", 10,
            "Cheapest, fastest win: this attacks 55% of the lead time and doesn't need any architecture change. Many teams discover they don't need microservices once deploys are fast and safe.",
            "הניצחון הכי זול ומהיר: זה תוקף 55% מה-lead time ולא דורש שום שינוי ארכיטקטורה. הרבה צוותים מגלים שהם לא צריכים microservices ברגע שה-deploys מהירים ובטוחים."),
          c("Skip the pipeline, go straight to services: they'll each have small CI", "לדלג על ה-pipeline, ישר לשירותים: לכל אחד יהיה CI קטן", "s3", 3,
            "Each new service still needs a good pipeline; if you can't build one for the monolith, you'll build 15 bad ones. And the flaky tests come with the code.",
            "כל שירות חדש עדיין צריך pipeline טוב; אם אי אפשר לבנות אחד למונוליט, תבנה 15 גרועים. וה-flaky tests מגיעים יחד עם הקוד."),
          c("Add more QA engineers to speed up manual testing", "להוסיף אנשי QA כדי להאיץ את הבדיקות הידניות", "s3", 3,
            "Throws people at a process problem. It scales linearly in cost and doesn't fix flakiness or the shared release train.",
            "זורק אנשים על בעיה של תהליך. העלות גדלה ליניארית וזה לא פותר flakiness או את רכבת הריליס המשותפת.")
        ]
      },
      s3: {
        text: t("Pipeline fixed: deploys are daily, 40 min. Teams still block each other on the shared models package and schema migrations. Next?",
                "ה-pipeline תוקן: deploys יומיים, 40 דקות. הצוותים עדיין חוסמים אחד את השני בגלל חבילת ה-models המשותפת ומיגרציות schema. מה הלאה?"),
        choices: [
          c("Modular monolith: enforce module boundaries (owned packages, public interfaces, schema ownership per module)", "Modular monolith: לאכוף גבולות מודולים (חבילות בבעלות, ממשקים ציבוריים, בעלות על ה-schema לכל מודול)", "s4", 10,
            "This creates the boundaries you'd need for services anyway, but keeps in-process calls and one deploy. Tools: Packwerk (Rails), ArchUnit (Java), import-linter (Python). If a boundary holds for months, it's a real candidate for extraction.",
            "זה יוצר את הגבולות שהיית צריך לשירותים בכל מקרה, אבל שומר על קריאות in-process ו-deploy אחד. כלים: Packwerk (Rails), ArchUnit (Java), import-linter (Python). אם גבול מחזיק חודשים, הוא מועמד אמיתי לחילוץ."),
          c("Split into 15 microservices along the current folder structure", "לפצל ל-15 microservices לפי מבנה התיקיות הנוכחי", "s4", 2,
            "Folders aren't domains. With a shared 'models' package and schema, you'd get 15 services coupled through the database: the worst of both worlds.",
            "תיקיות הן לא domains. עם חבילת 'models' ו-schema משותפים, תקבל 15 שירותים שמצומדים דרך ה-DB: הגרוע משני העולמות."),
          c("Leave it; daily deploys are enough", "להשאיר; deploys יומיים מספיקים", "s4", 5,
            "Not crazy, but the team-coupling pain will grow with headcount. Cheap boundary enforcement now avoids an expensive untangling later.",
            "לא מופרך, אבל כאב הצימוד בין הצוותים יגדל עם מספר האנשים. אכיפת גבולות זולה עכשיו חוסכת התרה יקרה אחר כך.")
        ]
      },
      s4: {
        text: t("Six months later the Payments module has a clean boundary, its own tables, a different scaling profile (spiky) and PCI requirements. Extract it?",
                "שישה חודשים אחר כך למודול Payments יש גבול נקי, טבלאות משלו, פרופיל סקייל שונה (קפיצות) ודרישות PCI. לחלץ אותו?"),
        choices: [
          c("Yes: strangler fig behind the existing interface, data migrated with dual-write verification, then cut over", "כן: strangler fig מאחורי הממשק הקיים, מעבירים נתונים עם אימות dual-write, ואז cut over", "s5", 10,
            "Now extraction has real reasons (compliance scope, independent scaling, ownership) and a proven boundary. Strangler + shadow verification makes it reversible.",
            "עכשיו לחילוץ יש סיבות אמיתיות (היקף compliance, סקייל עצמאי, בעלות) וגבול מוכח. Strangler עם shadow verification הופך את זה להפיך."),
          c("Yes, and let it keep reading the monolith's tables directly for now", "כן, ושימשיך לקרוא ישירות מהטבלאות של המונוליט בינתיים", "s5", 2,
            "Shared database access means you can't change either schema independently; 'for now' becomes forever. Data ownership is the hardest and most important part of the split.",
            "גישה משותפת ל-DB אומרת שאי אפשר לשנות אף schema באופן עצמאי; 'בינתיים' הופך ל'לתמיד'. בעלות על הנתונים היא החלק הכי קשה והכי חשוב בפיצול."),
          c("No, never extract anything", "לא, לא לחלץ שום דבר אף פעם", "s5", 4,
            "Dogma in the other direction. PCI scope reduction alone can justify one well-bounded service.",
            "דוגמה לכיוון השני. צמצום היקף PCI לבדו יכול להצדיק שירות אחד עם גבול טוב.")
        ]
      },
      s5: {
        text: t("The VP asks for a one-line summary for the board.", "ה-VP מבקש סיכום של שורה אחת להנהלה."),
        choices: [
          c("'Lead time 3 h → 40 min, change failure 22% → 8%; one service extracted where it paid off, the rest is a modular monolith.'", "'Lead time מ-3 שעות ל-40 דקות, change failure מ-22% ל-8%; שירות אחד חולץ איפה שזה השתלם, השאר הוא modular monolith.'", "win", 10,
            "Outcomes in DORA metrics, not architecture buzzwords. That's how principals report.",
            "תוצאות במדדי DORA, לא באזזוורדים של ארכיטקטורה. ככה Principal מדווח."),
          c("'We now have microservices.'", "'עכשיו יש לנו microservices.'", "lose", 0,
            "Architecture is a means. Nobody on the board cares; they care whether the company ships faster and breaks less.",
            "ארכיטקטורה היא אמצעי. להנהלה לא אכפת; אכפת להם אם החברה משחררת מהר יותר ושוברת פחות.")
        ]
      },
      win: {
        text: t("✅ The pragmatic path: measure, fix the delivery pipeline, enforce module boundaries inside the monolith, and extract only services with a real reason (compliance, scaling, ownership), using a strangler fig and owning their data.",
                "✅ הדרך הפרגמטית: למדוד, לתקן את ה-pipeline, לאכוף גבולות מודולים בתוך המונוליט, ולחלץ רק שירותים עם סיבה אמיתית (compliance, סקייל, בעלות), עם strangler fig ובעלות מלאה על הנתונים שלהם."),
        end: "win"
      },
      lose: {
        text: t("💥 A year later: 22 services, one shared database, deploys still coordinated in a weekly 'release train', and on-call doubled. The lesson: diagnose the bottleneck, fix delivery first, and treat services as a tool for specific problems.",
                "💥 שנה אחר כך: 22 שירותים, DB משותף אחד, deploys עדיין מתואמים ב'רכבת ריליס' שבועית, וה-on-call הוכפל. הלקח: לאבחן את צוואר הבקבוק, לתקן קודם את ה-delivery, ולהתייחס לשירותים ככלי לבעיות ספציפיות."),
        end: "lose"
      }
    },
    lessons: ["arch-monolith-vs-microservices", "pr-cloud-patterns", "staff-migrations-at-scale", "cloud-cicd", "pr-code-review-quality"]
  });

  /* ---------------------------------------------------------------- 3 */
  S.push({
    id: "dd-sync-vs-async",
    kind: "design",
    icon: "🔀",
    title: t("Order processing across 4 services: sync calls, queues or a saga?", "עיבוד הזמנה דרך 4 שירותים: קריאות sync, תורים או saga?"),
    start: "s1",
    steps: {
      s1: {
        text: t("Placing an order today calls 4 services synchronously, one after the other. During last Black Friday, the email provider slowed down and checkout failed for 40 minutes. You're redesigning the flow.",
                "ביצוע הזמנה היום קורא ל-4 שירותים בצורה סינכרונית, אחד אחרי השני. בבלאק פריידי האחרון ספק המייל הואט וה-checkout נכשל ל-40 דקות. אתה מתכנן מחדש את התהליך."),
        data: `POST /orders  (p99 today: 2.4 s, SLO: p99 < 800 ms)
  -> inventory.reserve   p99 120 ms, 99.95%
  -> payments.charge     p99 600 ms, 99.9%  (external PSP)
  -> loyalty.addPoints   p99 90 ms,  99.5%
  -> email.sendReceipt   p99 900 ms, 99.0%  (external)
Peak: 1,200 orders/s on Black Friday
Combined availability today: ~98.4%`,
        choices: [
          c("Separate what the user must wait for from what can happen after", "להפריד בין מה שהמשתמש חייב לחכות לו לבין מה שיכול לקרות אחר כך", "s2", 10,
            "The key question. The user needs to know the order is accepted and paid; points and the receipt can follow seconds later. That alone removes the two least reliable dependencies from the critical path.",
            "השאלה המרכזית. המשתמש צריך לדעת שההזמנה התקבלה ושולמה; נקודות וקבלה יכולים להגיע כמה שניות אחר כך. זה לבד מוציא את שתי התלויות הכי פחות אמינות מה-critical path."),
          c("Call all 4 in parallel instead of sequentially", "לקרוא לכל ה-4 במקביל במקום אחד אחרי השני", "s2", 5,
            "Latency improves (max instead of sum), but availability is still the product of all four: one flaky email provider still fails checkout.",
            "ה-latency משתפר (מקסימום במקום סכום), אבל הזמינות היא עדיין המכפלה של כל הארבעה: ספק מייל אחד לא יציב עדיין מפיל את ה-checkout."),
          c("Add retries with longer timeouts everywhere", "להוסיף retries עם timeouts ארוכים יותר בכל מקום", "s2", 2,
            "Longer timeouts make p99 worse and tie up threads; blind retries at 1,200 orders/s can create a retry storm against an already struggling provider.",
            "Timeouts ארוכים מחמירים את ה-p99 ותופסים threads; retries עיוורים ב-1,200 הזמנות בשנייה יכולים ליצור retry storm מול ספק שכבר מתקשה.")
        ]
      },
      s2: {
        text: t("Decision: inventory + payment stay in the request; loyalty + email become async. How do you publish the 'OrderPlaced' event reliably?",
                "החלטה: inventory ו-payment נשארים בבקשה; loyalty ו-email הופכים ל-async. איך מפרסמים את ה-event 'OrderPlaced' באמינות?"),
        choices: [
          c("Transactional outbox: write the order and the event in one DB transaction, relay to Kafka/SQS", "Transactional outbox: לכתוב את ההזמנה ואת ה-event בטרנזקציה אחת ב-DB, ו-relay ל-Kafka/SQS", "s3", 10,
            "Solves the dual-write problem: either both the order and the event exist or neither. Consumers must be idempotent because the relay is at-least-once.",
            "פותר את בעיית ה-dual-write: או שגם ההזמנה וגם ה-event קיימים, או שאף אחד. ה-consumers חייבים להיות אידמפוטנטיים כי ה-relay הוא at-least-once."),
          c("Save the order, then publish to the broker in the next line", "לשמור את ההזמנה, ואז לפרסם ל-broker בשורה הבאה", "s3", 2,
            "The classic dual-write bug: a crash between the two lines means a paid order with no receipt and no points, and nobody notices.",
            "באג ה-dual-write הקלאסי: קריסה בין שתי השורות אומרת הזמנה ששולמה בלי קבלה ובלי נקודות, ואף אחד לא שם לב."),
          c("Publish first, then save the order", "לפרסם קודם, ואז לשמור את ההזמנה", "s3", 1,
            "Now a failed DB write leaves a receipt email for an order that doesn't exist. Ordering the two calls differently doesn't fix a non-atomic write.",
            "עכשיו כתיבה כושלת ל-DB משאירה מייל קבלה להזמנה שלא קיימת. לשנות את הסדר של שתי הקריאות לא פותר כתיבה לא אטומית.")
        ]
      },
      s3: {
        text: t("Payment succeeds but inventory reservation then fails (oversold). What now?",
                "התשלום מצליח אבל שמירת המלאי נכשלת אחר כך (מכרנו יותר מדי). מה עכשיו?"),
        choices: [
          c("Reserve inventory first (short hold), then charge; on later failure run compensations (refund, release)", "לשמור מלאי קודם (החזקה קצרה), ואז לחייב; בכשל מאוחר להריץ compensations (החזר, שחרור)", "s4", 10,
            "Order the steps so the hardest-to-undo action (charging money) happens last, and give every earlier step a compensation. That's a saga.",
            "מסדרים את השלבים כך שהפעולה שהכי קשה לבטל (חיוב כסף) מגיעה אחרונה, ונותנים לכל שלב מוקדם compensation. זו saga."),
          c("Use a distributed transaction (2PC) across inventory and payments", "להשתמש בטרנזקציה מבוזרת (2PC) בין inventory ל-payments", "s4", 2,
            "The PSP won't join your 2PC, and 2PC blocks on coordinator failure. Across service and company boundaries, sagas with compensations are the practical answer.",
            "ה-PSP לא יצטרף ל-2PC שלך, ו-2PC נחסם כשה-coordinator נופל. מעבר לגבולות של שירותים וחברות, sagas עם compensations הם התשובה המעשית."),
          c("Let support handle it manually", "לתת לתמיכה לטפל בזה ידנית", "s4", 1,
            "At 1,200 orders/s, 'rare' still means hundreds of tickets per peak hour, plus chargebacks.",
            "ב-1,200 הזמנות בשנייה, 'נדיר' זה עדיין מאות פניות בשעת שיא, ועוד chargebacks.")
        ]
      },
      s4: {
        text: t("How do you run the saga: services reacting to each other's events, or a central orchestrator?",
                "איך מריצים את ה-saga: שירותים שמגיבים ל-events אחד של השני, או orchestrator מרכזי?"),
        choices: [
          c("Orchestration (Temporal / Step Functions) for the money path; choreography for side effects like email and loyalty", "Orchestration (Temporal / Step Functions) למסלול הכסף; choreography ל-side effects כמו מייל ו-loyalty", "s5", 10,
            "The critical multi-step flow becomes explicit, testable and observable, with retries and compensations in one place; simple fan-out reactions stay decoupled.",
            "התהליך הקריטי עם הרבה שלבים הופך למפורש, בדיק וניתן לצפייה, עם retries ו-compensations במקום אחד; תגובות fan-out פשוטות נשארות מנותקות."),
          c("Pure choreography for everything", "Choreography טהור לכל דבר", "s5", 5,
            "Fine for 2-3 steps, but the payment flow becomes implicit across services; debugging a stuck order means reading 4 services' logs.",
            "מצוין ל-2-3 שלבים, אבל תהליך התשלום הופך למובלע בין שירותים; דיבאג של הזמנה תקועה אומר לקרוא לוגים של 4 שירותים."),
          c("A cron job that scans for inconsistent orders every hour", "Cron שסורק הזמנות לא עקביות כל שעה", "s5", 3,
            "A useful reconciliation safety net, but not a workflow engine: users wait up to an hour for the fix.",
            "רשת ביטחון שימושית של reconciliation, אבל לא workflow engine: משתמשים מחכים עד שעה לתיקון.")
        ]
      },
      s5: {
        text: t("Load test at 1,500 orders/s. The email provider is throttling you at 300/s. What do you do?",
                "Load test ב-1,500 הזמנות בשנייה. ספק המייל מגביל אותך ל-300 בשנייה. מה עושים?"),
        choices: [
          c("Let the email queue absorb the backlog with a rate-limited consumer, monitor queue age, and alert on it", "לתת לתור המיילים לספוג את ה-backlog עם consumer מוגבל קצב, לנטר את גיל התור ולהתריע עליו", "win", 10,
            "Exactly why it's async: checkout stays fast while receipts drain over a few minutes. Queue age (not length) is the SLI that matters.",
            "בדיוק בשביל זה זה async: ה-checkout נשאר מהיר בזמן שהקבלות מתרוקנות תוך כמה דקות. גיל התור (לא האורך) הוא ה-SLI שחשוב."),
          c("Move email back into the checkout request so customers get receipts immediately", "להחזיר את המייל לבקשת ה-checkout כדי שלקוחות יקבלו קבלה מיד", "lose", 0,
            "You've just re-coupled checkout to a 300/s external limit: at 1,500 orders/s, 80% of checkouts fail.",
            "חיברת מחדש את ה-checkout למגבלה חיצונית של 300 בשנייה: ב-1,500 הזמנות בשנייה, 80% מה-checkouts נכשלים.")
        ]
      },
      win: {
        text: t("✅ The design: a synchronous critical path of only inventory-hold + payment (p99 ≈ 750 ms, availability ≈ 99.85%); OrderPlaced published via a transactional outbox; an orchestrated saga with compensations for the money path; email and loyalty as idempotent async consumers with DLQs and queue-age alerts.",
                "✅ ה-design: critical path סינכרוני של החזקת מלאי ותשלום בלבד (p99 בערך 750ms, זמינות בערך 99.85%); OrderPlaced מתפרסם דרך transactional outbox; saga עם orchestration ו-compensations למסלול הכסף; מייל ו-loyalty כ-consumers אסינכרוניים ואידמפוטנטיים עם DLQs והתראות על גיל התור."),
        end: "win"
      },
      lose: {
        text: t("💥 Black Friday: the email provider throttles, checkout success drops to 20% for an hour. The fix: keep only what the user must wait for in the request; everything else goes through an outbox and queues.",
                "💥 בלאק פריידי: ספק המייל מגביל, ההצלחה של ה-checkout יורדת ל-20% לשעה. התיקון: להשאיר בבקשה רק את מה שהמשתמש חייב לחכות לו; כל השאר עובר דרך outbox ותורים."),
        end: "lose"
      }
    },
    lessons: ["arch-sync-vs-async", "arch-event-driven", "arch-durable-execution", "pr-idempotency", "flow-checkout-payment", "pr-third-party-deps"]
  });

  /* ---------------------------------------------------------------- 4 */
  S.push({
    id: "dd-multi-tenant",
    kind: "design",
    icon: "🏢",
    title: t("2,000 small tenants and 3 enterprise giants: how do you isolate them?", "2,000 tenants קטנים ו-3 ענקים אנטרפרייז: איך מבודדים ביניהם?"),
    start: "s1",
    steps: {
      s1: {
        text: t("Your B2B SaaS just signed three enterprise customers. Their security teams sent questionnaires about isolation, and one of them is 30% of all traffic.",
                "ה-SaaS שלך חתם הרגע עם שלושה לקוחות אנטרפרייז. צוותי האבטחה שלהם שלחו שאלונים על בידוד, ואחד מהם הוא 30% מכל ה-traffic."),
        data: `Today: pooled model
- 1 Postgres (shared tables + tenant_id), 1 K8s cluster
- 2,000 SMB tenants, median 5 users, $50/month
- New: 3 enterprise tenants, $400k/year each
  - "BigBank": wants dedicated infra + own KMS key
  - "RetailCo": 30% of total traffic, spiky
  - "HealthOrg": HIPAA, data in us-east only
- Incidents last quarter: 2 noisy-neighbor slowdowns`,
        choices: [
          c("Tiered model: keep SMBs pooled, offer siloed/bridge tiers for enterprise, priced accordingly", "מודל שכבות: SMBs נשארים ב-pool, ו-tier מבודד/bridge לאנטרפרייז, עם תמחור בהתאם", "s2", 10,
            "One size doesn't fit both. Pooling is the only economical model at $50/month; enterprises pay enough to fund dedicated resources. Make isolation a product tier.",
            "מידה אחת לא מתאימה לשניהם. pool הוא המודל הכלכלי היחיד ב-50$ לחודש; אנטרפרייז משלמים מספיק כדי לממן משאבים ייעודיים. הופכים את הבידוד ל-tier במוצר."),
          c("Give every tenant a dedicated database and cluster", "לתת לכל tenant DB ו-cluster ייעודיים", "s2", 1,
            "2,000 clusters at $50/month revenue each is bankruptcy, plus 2,000 upgrades per release. Silo is for the few who pay for it.",
            "2,000 clusters כשההכנסה היא 50$ לחודש מכל אחד זה פשיטת רגל, ועוד 2,000 שדרוגים בכל ריליס. silo זה למעטים שמשלמים עליו."),
          c("Keep everyone pooled; tell enterprises it's secure", "להשאיר את כולם ב-pool; להגיד לאנטרפרייז שזה מאובטח", "s2", 3,
            "You'll fail BigBank's questionnaire and RetailCo will keep causing noisy-neighbor incidents for 2,000 others.",
            "תיכשל בשאלון של BigBank, ו-RetailCo ימשיך לגרום לתקלות noisy neighbor ל-2,000 אחרים.")
        ]
      },
      s2: {
        text: t("For the pooled tier: how do you guarantee one SMB tenant never reads another's data?",
                "ל-tier ה-pool: איך מבטיחים ש-tenant SMB אחד אף פעם לא קורא נתונים של אחר?"),
        choices: [
          c("Postgres Row-Level Security driven by a session variable set from the JWT, plus automated cross-tenant tests", "Row-Level Security ב-Postgres שמונע ממשתנה session מה-JWT, ועוד בדיקות cross-tenant אוטומטיות", "s3", 10,
            "Defense in depth: even if a developer forgets <code>WHERE tenant_id = ?</code>, the database refuses. Tests that try tenant A's token on tenant B's resources catch regressions in CI.",
            "Defense in depth: גם אם מפתח שוכח <code>WHERE tenant_id = ?</code>, ה-DB מסרב. בדיקות שמנסות token של tenant A על משאבים של tenant B תופסות רגרסיות ב-CI."),
          c("Code review to make sure every query has a tenant filter", "Code review שמוודא שלכל query יש פילטר tenant", "s3", 3,
            "Humans miss things across thousands of queries; one missed filter is a reportable data breach. Enforce it in the data layer.",
            "בני אדם מפספסים דברים באלפי queries; פילטר אחד שנשכח הוא דליפת מידע שחייבים לדווח עליה. אוכפים את זה בשכבת הנתונים."),
          c("Schema per tenant for all 2,000", "Schema לכל אחד מה-2,000", "s3", 5,
            "Better isolation than shared tables, but 2,000 schemas make migrations slow and connection pooling awkward. Viable, but RLS gives similar guarantees with less operational cost at this size.",
            "בידוד טוב יותר מטבלאות משותפות, אבל 2,000 schemas הופכים מיגרציות לאיטיות ו-connection pooling למסורבל. אפשרי, אבל RLS נותן הבטחות דומות בעלות תפעולית נמוכה יותר בגודל הזה.")
        ]
      },
      s3: {
        text: t("RetailCo's spikes slow everyone down. What's the fix?", "הקפיצות של RetailCo מאטות את כולם. מה הפתרון?"),
        choices: [
          c("Move RetailCo to its own cell (dedicated node pool + DB) and add per-tenant rate limits and quotas in the pool", "להעביר את RetailCo ל-cell משלו (node pool ו-DB ייעודיים) ולהוסיף rate limits ו-quotas לכל tenant ב-pool", "s4", 10,
            "The noisy neighbor gets its own blast radius, and fairness controls protect the pool from the next one. Cells also make capacity planning per customer possible.",
            "ה-noisy neighbor מקבל blast radius משלו, ומנגנוני הוגנות מגינים על ה-pool מהבא בתור. Cells גם מאפשרים תכנון capacity לכל לקוח."),
          c("Scale the shared cluster up 3x", "להגדיל את ה-cluster המשותף פי 3", "s4", 3,
            "Expensive and temporary: RetailCo's next spike is bigger, and you're paying for it across everyone.",
            "יקר וזמני: הקפיצה הבאה של RetailCo תהיה גדולה יותר, ואתה משלם על זה על חשבון כולם."),
          c("Ask RetailCo to send less traffic", "לבקש מ-RetailCo לשלוח פחות traffic", "s4", 1,
            "They pay $400k/year for an SLA. Capacity isolation is your job.",
            "הם משלמים 400 אלף דולר בשנה על SLA. בידוד capacity הוא התפקיד שלך.")
        ]
      },
      s4: {
        text: t("BigBank requires its own encryption key it can revoke. How?",
                "BigBank דורש מפתח הצפנה משלו שהוא יכול לבטל. איך?"),
        choices: [
          c("Envelope encryption with a per-tenant KMS key (BYOK / customer-managed in their account); revoking it makes their data unreadable", "Envelope encryption עם מפתח KMS לכל tenant (BYOK / מנוהל ע\"י הלקוח בחשבון שלו); ביטול המפתח הופך את הנתונים שלהם ללא קריאים", "s5", 10,
            "This is what 'own key' means in practice: data keys wrapped by their CMK. It also gives you crypto-shredding for offboarding.",
            "זה מה ש'מפתח משלהם' אומר בפועל: data keys עטופים ב-CMK שלהם. זה גם נותן crypto-shredding ביציאה של לקוח."),
          c("Encrypt the whole database with one key and give them a copy", "להצפין את כל ה-DB במפתח אחד ולתת להם עותק", "s5", 0,
            "Sharing your master key with a customer gives them access to everyone's data. Never.",
            "לשתף את ה-master key שלך עם לקוח נותן לו גישה לנתונים של כולם. אף פעם."),
          c("Rely on disk encryption from the cloud provider", "לסמוך על הצפנת הדיסקים של ספק הענן", "s5", 3,
            "Necessary but not what they asked for: they can't revoke it, and it protects only against stolen disks.",
            "הכרחי אבל לא מה שביקשו: הם לא יכולים לבטל אותו, והוא מגן רק מפני דיסקים גנובים.")
        ]
      },
      s5: {
        text: t("How do you keep 1 pool + 3 cells manageable for a 10-person platform team?",
                "איך שומרים על pool אחד ו-3 cells ניתנים לניהול לצוות פלטפורמה של 10 אנשים?"),
        choices: [
          c("Same code, same IaC module, same pipeline for every cell; tenant routing table decides where each tenant lives", "אותו קוד, אותו מודול IaC ואותו pipeline לכל cell; טבלת routing של tenants מחליטה איפה כל tenant יושב", "win", 10,
            "Cells must be cattle, not pets: deploy them in waves (pool canary first), and a tenant can be moved between tiers by changing its routing entry.",
            "Cells חייבים להיות cattle, לא pets: מעלים אותם בגלים (קודם canary ב-pool), ואפשר להעביר tenant בין tiers ע\"י שינוי של רשומת ה-routing שלו."),
          c("Let each enterprise cell have its own customized version", "לתת לכל cell אנטרפרייז גרסה מותאמת משלו", "lose", 0,
            "Forked code per customer: every release now needs 4 test matrices and 4 deploys, and fixes stop reaching everyone.",
            "קוד מפוצל לכל לקוח: כל ריליס צריך עכשיו 4 מטריצות בדיקה ו-4 deploys, ותיקונים מפסיקים להגיע לכולם.")
        ]
      },
      win: {
        text: t("✅ The design: a pooled tier for SMBs with RLS, per-tenant quotas and cross-tenant tests; dedicated cells for enterprises (own node pool, DB, region pinning for HealthOrg) with per-tenant KMS keys; one codebase, one IaC module, wave deploys, and a routing table that maps tenants to cells.",
                "✅ ה-design: tier של pool ל-SMBs עם RLS, quotas לכל tenant ובדיקות cross-tenant; cells ייעודיים לאנטרפרייז (node pool, DB, ונעילת אזור ל-HealthOrg) עם מפתחות KMS לכל tenant; codebase אחד, מודול IaC אחד, deploys בגלים, וטבלת routing שממפה tenants ל-cells."),
        end: "win"
      },
      lose: {
        text: t("💥 Nine months later: four forks of the product, releases slip by weeks, and a missed tenant filter in a new report exposes one SMB's invoices to another. Isolation must be enforced by the platform, and cells must be identical.",
                "💥 תשעה חודשים אחר כך: ארבעה forks של המוצר, ריליסים מתעכבים בשבועות, ופילטר tenant שנשכח בדוח חדש חושף חשבוניות של SMB אחד לאחר. את הבידוד חייבת לאכוף הפלטפורמה, וה-cells חייבים להיות זהים."),
        end: "lose"
      }
    },
    lessons: ["pr-multi-tenancy", "pr-tenant-isolation-deep", "staff-cells-blast-radius", "flow-tenant-onboarding", "pr-applied-crypto-pki", "pr-rate-limiters"]
  });

  /* ---------------------------------------------------------------- 5 */
  S.push({
    id: "dd-rag-assistant",
    kind: "design",
    icon: "🤖",
    title: t("An internal AI assistant over company docs", "עוזר AI פנימי מעל מסמכי החברה"),
    start: "s1",
    steps: {
      s1: {
        text: t("Leadership wants 'ChatGPT for our company knowledge' in one quarter. You own the architecture.",
                "ההנהלה רוצה 'ChatGPT על הידע של החברה' תוך רבעון. הארכיטקטורה באחריותך."),
        data: `Sources: Confluence (80k pages), Google Drive (1.2M files),
         Jira (2M issues), Slack (selected channels)
Users: 3,000 employees, ~20k questions/day
Permissions: per-space / per-file ACLs, HR + legal docs restricted
Freshness: docs change daily
Budget: ~$15k/month for inference
Must: cite sources, never leak restricted docs`,
        choices: [
          c("RAG: retrieve permitted chunks at question time and have the model answer with citations", "RAG: לשלוף chunks מורשים בזמן השאלה ולתת למודל לענות עם ציטוטים", "s2", 10,
            "Knowledge that changes daily and must be cited and permission-filtered is what RAG is for. Fine-tuning bakes knowledge into weights, where you can't cite it, update it daily or filter it per user.",
            "ידע שמשתנה כל יום וצריך ציטוט וסינון הרשאות, בשביל זה יש RAG. Fine-tuning אופה את הידע לתוך המשקולות, שם אי אפשר לצטט, לעדכן כל יום או לסנן לכל משתמש."),
          c("Fine-tune a model on all company documents", "Fine-tune למודל על כל מסמכי החברה", "s2", 2,
            "Every user could extract restricted HR/legal content from the weights, answers can't cite sources, and the model is stale the day after training.",
            "כל משתמש יוכל לחלץ תוכן מוגבל של HR ומשפטי מתוך המשקולות, התשובות לא יכולות לצטט מקורות, והמודל מתיישן כבר יום אחרי האימון."),
          c("Paste the most relevant documents into a huge context window every time", "להדביק את המסמכים הרלוונטיים לחלון context ענק בכל פעם", "s2", 4,
            "Large contexts help, but you still need retrieval to choose 'relevant', and 20k questions/day × 500k tokens blows the budget many times over.",
            "Context גדול עוזר, אבל עדיין צריך retrieval כדי לבחור מה 'רלוונטי', ו-20 אלף שאלות ביום כפול 500 אלף tokens מפוצץ את התקציב כמה פעמים.")
        ]
      },
      s2: {
        text: t("How do you enforce document permissions?", "איך אוכפים הרשאות על מסמכים?"),
        choices: [
          c("Store ACLs as metadata on every chunk, filter retrieval by the asking user's identity and groups, and sync ACL changes", "לשמור ACLs כ-metadata על כל chunk, לסנן את ה-retrieval לפי הזהות והקבוצות של המשתמש ששואל, ולסנכרן שינויי ACL", "s3", 10,
            "Permissions must be enforced before the model sees anything. Post-filtering the answer is too late: the model already read the restricted text.",
            "חייבים לאכוף הרשאות לפני שהמודל רואה משהו. לסנן את התשובה אחרי זה מאוחר מדי: המודל כבר קרא את הטקסט המוגבל."),
          c("Tell the model in the system prompt not to reveal restricted docs", "להגיד למודל ב-system prompt לא לחשוף מסמכים מוגבלים", "s3", 0,
            "Prompt instructions are not access control; prompt injection or a clever question bypasses them. This is OWASP LLM 'sensitive information disclosure'.",
            "הוראות ב-prompt הן לא access control; prompt injection או שאלה מתוחכמת עוקפים אותן. זה 'sensitive information disclosure' מ-OWASP LLM."),
          c("Only index public documents", "לאנדקס רק מסמכים ציבוריים", "s3", 5,
            "Safe, but most of the value lives in team spaces. Acceptable as phase 1 while ACL sync is built.",
            "בטוח, אבל רוב הערך נמצא ב-spaces של צוותים. סביר כשלב 1 בזמן שבונים סנכרון ACL.")
        ]
      },
      s3: {
        text: t("Where do vectors live?", "איפה יושבים הוקטורים?"),
        choices: [
          c("pgvector or OpenSearch next to existing infra, with hybrid search (BM25 + vectors) and a reranker", "pgvector או OpenSearch ליד התשתית הקיימת, עם hybrid search (BM25 ווקטורים) ו-reranker", "s4", 10,
            "A few million chunks fit comfortably in pgvector/OpenSearch with metadata filters; hybrid search catches exact terms (ticket IDs, product names) that pure embeddings miss.",
            "כמה מיליוני chunks נכנסים בנוחות ל-pgvector או OpenSearch עם פילטרים על metadata; hybrid search תופס מונחים מדויקים (מזהי טיקטים, שמות מוצרים) שהטמעות בלבד מפספסות."),
          c("A brand-new specialized vector DB cluster, self-hosted", "Cluster חדש של vector DB ייעודי, self-hosted", "s4", 4,
            "Can work, but it's another stateful system to run, and at this scale it adds little over options you already operate.",
            "יכול לעבוד, אבל זו עוד מערכת stateful לתפעל, ובסקייל הזה היא מוסיפה מעט מעבר לאפשרויות שכבר מתפעלים."),
          c("Embeddings only, no keyword search", "רק embeddings, בלי חיפוש מילות מפתח", "s4", 4,
            "Pure semantic search struggles with exact identifiers like 'INC-48213' or error codes; hybrid retrieval is the standard for enterprise search.",
            "חיפוש סמנטי בלבד מתקשה עם מזהים מדויקים כמו 'INC-48213' או קודי שגיאה; hybrid retrieval הוא הסטנדרט לחיפוש ארגוני.")
        ]
      },
      s4: {
        text: t("How do you know it's good enough to launch?", "איך יודעים שזה מספיק טוב להשקה?"),
        choices: [
          c("Build an eval set of ~300 real questions with expected sources; measure retrieval recall, answer faithfulness and citation accuracy on every change", "לבנות eval set של כ-300 שאלות אמיתיות עם המקורות הצפויים; למדוד retrieval recall, faithfulness של התשובה ודיוק הציטוטים בכל שינוי", "s5", 10,
            "Evals are the unit tests of LLM systems. Without them, every prompt or chunking change is a guess.",
            "Evals הם ה-unit tests של מערכות LLM. בלעדיהם, כל שינוי ב-prompt או ב-chunking הוא ניחוש."),
          c("A few people try it for a week and give a thumbs up", "כמה אנשים מנסים שבוע ונותנים אגודל", "s5", 3,
            "Useful for UX, but anecdotal; you can't tell whether the next change made it better or worse.",
            "שימושי ל-UX, אבל אנקדוטלי; אי אפשר לדעת אם השינוי הבא שיפר או הרע."),
          c("Trust the model vendor's benchmark scores", "לסמוך על ציוני ה-benchmark של ספק המודל", "s5", 1,
            "Public benchmarks say nothing about your documents, chunking or permissions.",
            "Benchmarks ציבוריים לא אומרים כלום על המסמכים, ה-chunking או ההרשאות שלך.")
        ]
      },
      s5: {
        text: t("Cost projection is $28k/month, almost 2x the budget. What do you do?",
                "תחזית העלות היא 28 אלף דולר בחודש, כמעט פי 2 מהתקציב. מה עושים?"),
        choices: [
          c("Route easy questions to a smaller model, cache frequent answers, trim context with reranking, and set per-user quotas", "לנתב שאלות קלות למודל קטן יותר, לעשות cache לתשובות נפוצות, לקצץ context עם reranking, ולהגדיר quotas לכל משתמש", "win", 10,
            "Model routing plus prompt/answer caching and tighter context typically cut cost 50-70% with little quality loss, measured by the eval set.",
            "Model routing יחד עם caching של prompts ותשובות ו-context מצומצם מורידים בדרך כלל 50-70% מהעלות עם ירידה קטנה באיכות, כשמודדים עם ה-eval set."),
          c("Launch anyway and ask for more budget later", "להשיק בכל זאת ולבקש תקציב נוסף אחר כך", "lose", 0,
            "Usage grows after launch, so the overrun grows too, and the project gets cancelled at the first budget review.",
            "השימוש גדל אחרי ההשקה, אז גם החריגה גדלה, והפרויקט נסגר בסקירת התקציב הראשונה.")
        ]
      },
      win: {
        text: t("✅ The design: connectors that sync content and ACLs; chunking with metadata; hybrid search (BM25 + vectors) in pgvector/OpenSearch with permission filters and a reranker; an LLM gateway with auth, quotas, model routing and caching; answers with citations; an eval set run in CI; prompt-injection screening on retrieved content.",
                "✅ ה-design: connectors שמסנכרנים תוכן ו-ACLs; chunking עם metadata; hybrid search (BM25 ווקטורים) ב-pgvector/OpenSearch עם פילטרי הרשאות ו-reranker; LLM gateway עם auth, quotas, model routing ו-caching; תשובות עם ציטוטים; eval set שרץ ב-CI; וסינון prompt injection על התוכן שנשלף."),
        end: "win"
      },
      lose: {
        text: t("💥 Two weeks after launch an intern asks 'what's the CEO's salary?' and gets an answer from an HR document. The project is paused. The fix: permission filtering at retrieval, evals before launch, and a cost model before the first invoice.",
                "💥 שבועיים אחרי ההשקה סטודנט שואל 'כמה מרוויח ה-CEO?' ומקבל תשובה ממסמך של HR. הפרויקט מוקפא. התיקון: סינון הרשאות ב-retrieval, evals לפני ההשקה, ומודל עלויות לפני החשבונית הראשונה."),
        end: "lose"
      }
    },
    lessons: ["flow-llm-request", "ai-agent-infra-mcp", "pr-owasp-api-llm", "pr-db-landscape", "pr-data-security"]
  });

  /* ---------------------------------------------------------------- 6 */
  S.push({
    id: "dd-build-vs-buy-auth",
    kind: "design",
    icon: "🔐",
    title: t("Auth & SSO: build it or buy it?", "Auth ו-SSO: לבנות או לקנות?"),
    start: "s1",
    steps: {
      s1: {
        text: t("Your homegrown login (bcrypt + sessions) worked for SMBs. Now sales has 12 enterprise deals blocked on 'SAML SSO, SCIM and SOC 2'. The team wants to extend the in-house system.",
                "ה-login שבנית בבית (bcrypt ו-sessions) עבד ל-SMBs. עכשיו למכירות יש 12 עסקאות אנטרפרייז שתקועות על 'SAML SSO, SCIM ו-SOC 2'. הצוות רוצה להרחיב את המערכת הפנימית."),
        data: `Users: 250k end users, 1,800 tenant orgs
Needs (next 2 quarters):
- SAML + OIDC SSO per tenant (Okta, Entra ID, Google)
- SCIM provisioning/deprovisioning
- MFA incl. passkeys, audit logs, SOC 2 evidence
Team: 2 engineers on "identity" part-time
Blocked pipeline: $2.4M ARR`,
        choices: [
          c("Frame it as build vs buy with TCO, risk and time-to-revenue, not preference", "למסגר את זה כ-build מול buy עם TCO, סיכון וזמן להכנסות, לא כהעדפה", "s2", 10,
            "The real cost of building identity is not v1; it's years of SAML edge cases, IdP quirks, security patches and compliance evidence, done by 2 part-time people. Put numbers on both sides.",
            "העלות האמיתית של לבנות identity היא לא גרסה 1; היא שנים של מקרי קצה ב-SAML, מוזרויות של IdPs, תיקוני אבטחה וראיות compliance, ע\"י 2 אנשים בחצי משרה. שמים מספרים על שני הצדדים."),
          c("Build SAML ourselves: it's just XML", "לבנות SAML בעצמנו: זה רק XML", "s2", 1,
            "SAML is where XML signature wrapping attacks live; hand-rolled SAML is a classic source of authentication bypasses. It's never 'just XML'.",
            "SAML זה המקום של מתקפות XML signature wrapping; SAML שנכתב ידנית הוא מקור קלאסי ל-authentication bypass. זה אף פעם לא 'רק XML'."),
          c("Tell sales enterprise SSO isn't a priority", "להגיד למכירות ש-SSO לאנטרפרייז לא בעדיפות", "s2", 2,
            "$2.4M ARR blocked is a business priority. A principal's job is to find the cheapest safe way to unblock it.",
            "2.4 מיליון דולר ARR תקועים זו עדיפות עסקית. התפקיד של Principal הוא למצוא את הדרך הבטוחה והזולה ביותר לשחרר את זה.")
        ]
      },
      s2: {
        text: t("Options on the table: Auth0/Okta CIC, AWS Cognito, WorkOS (SSO/SCIM add-on), self-hosted Keycloak. What decides it?",
                "האופציות על השולחן: Auth0/Okta CIC, AWS Cognito, WorkOS (תוסף SSO/SCIM), ו-Keycloak self-hosted. מה מכריע?"),
        choices: [
          c("Score them on enterprise SSO/SCIM depth, migration path for existing password hashes, pricing at 250k MAU, data residency and lock-in/exit cost", "לדרג אותם לפי עומק SSO/SCIM לאנטרפרייז, מסלול מיגרציה ל-password hashes קיימים, תמחור ב-250 אלף MAU, data residency, ועלות lock-in/יציאה", "s3", 10,
            "A decision matrix on the criteria that matter for this business. Notably: can you import bcrypt hashes so users don't reset passwords, and what's the price at your MAU, not the free tier?",
            "מטריצת החלטה על הקריטריונים שחשובים לעסק הזה. במיוחד: אפשר לייבא bcrypt hashes כדי שמשתמשים לא יאפסו סיסמאות, ומה המחיר ב-MAU שלך, לא ב-free tier?"),
          c("The cheapest per-user price", "המחיר הכי זול למשתמש", "s3", 4,
            "Price matters, but the cheapest option may lack SCIM or per-tenant SAML, forcing you to build the hard parts anyway.",
            "המחיר חשוב, אבל האופציה הכי זולה עלולה להיות בלי SCIM או SAML לכל tenant, וזה יכריח אותך לבנות את החלקים הקשים בכל מקרה."),
          c("Whatever the team finds most fun", "מה שהכי כיף לצוות", "s3", 0,
            "Resume-driven development, for the most security-critical component you own.",
            "Resume-driven development, ברכיב הכי קריטי לאבטחה שיש לך.")
        ]
      },
      s3: {
        text: t("You pick a vendor for enterprise SSO/SCIM. How do you avoid being locked in forever?",
                "בחרת ספק ל-SSO/SCIM לאנטרפרייז. איך נמנעים מלהיות נעול לתמיד?"),
        choices: [
          c("Keep your own user/tenant/role model in your DB; integrate via standard OIDC; wrap the vendor behind an internal identity interface", "לשמור את מודל המשתמשים/tenants/תפקידים שלך ב-DB שלך; להתחבר דרך OIDC סטנדרטי; לעטוף את הספק מאחורי ממשק identity פנימי", "s4", 10,
            "Authentication is outsourced; authorization and the user model stay yours. Standard protocols plus an anti-corruption layer keep the exit cost to weeks, not a rewrite.",
            "ה-authentication במיקור חוץ; ה-authorization ומודל המשתמשים נשארים שלך. פרוטוקולים סטנדרטיים יחד עם anti-corruption layer שומרים על עלות יציאה של שבועות, לא שכתוב."),
          c("Store roles and permissions in the vendor's metadata fields", "לשמור תפקידים והרשאות בשדות ה-metadata של הספק", "s4", 3,
            "Now your authorization model lives in someone else's system, with their limits and their API rate limits on every permission check.",
            "עכשיו מודל ה-authorization שלך חי במערכת של מישהו אחר, עם המגבלות שלו וה-rate limits של ה-API שלו על כל בדיקת הרשאה."),
          c("Don't worry about it; vendors are forever", "לא לדאוג; ספקים זה לתמיד", "s4", 2,
            "Pricing changes, acquisitions and outages happen. Plan the exit when it's cheap: at the start.",
            "שינויי מחיר, רכישות ותקלות קורים. מתכננים את היציאה כשהיא זולה: בהתחלה.")
        ]
      },
      s4: {
        text: t("The identity provider has an outage. What happens to your product?",
                "לספק ה-identity יש תקלה. מה קורה למוצר שלך?"),
        choices: [
          c("Existing sessions/tokens keep working until expiry (validated locally with cached JWKS); only new logins fail; status page and alert on login error rate", "Sessions ו-tokens קיימים ממשיכים לעבוד עד שפג תוקפם (מאומתים מקומית עם JWKS ב-cache); רק logins חדשים נכשלים; status page והתראה על שיעור שגיאות login", "s5", 10,
            "Validating tokens locally means the IdP isn't in the request path for every API call; an outage degrades logins, not the whole product.",
            "אימות tokens מקומי אומר שה-IdP לא נמצא ב-request path של כל קריאת API; תקלה פוגעת ב-logins, לא בכל המוצר."),
          c("Every API call introspects the token at the vendor, so everything is down", "כל קריאת API עושה introspection ל-token אצל הספק, אז הכול למטה", "s5", 2,
            "You've made a third party a hard dependency of every request. Use signed JWTs validated locally, with short expiry.",
            "הפכת צד שלישי לתלות קשה של כל בקשה. משתמשים ב-JWTs חתומים שמאומתים מקומית, עם תוקף קצר."),
          c("Fall back to the old password system automatically", "לחזור אוטומטית למערכת הסיסמאות הישנה", "s5", 3,
            "Keeping a second, unmaintained auth path alive doubles the attack surface and bypasses enterprise SSO policies (MFA, deprovisioning).",
            "להשאיר נתיב auth שני ולא מתוחזק מכפיל את שטח התקיפה ועוקף את מדיניות ה-SSO של האנטרפרייז (MFA, deprovisioning).")
        ]
      },
      s5: {
        text: t("An enterprise customer fires an employee. How fast must access be removed, and how?",
                "לקוח אנטרפרייז מפטר עובד. כמה מהר צריך להסיר את הגישה, ואיך?"),
        choices: [
          c("SCIM deprovisioning event revokes sessions and refresh tokens within minutes; short-lived access tokens (5-15 min) bound the rest; audit log records it", "Event של SCIM deprovisioning מבטל sessions ו-refresh tokens תוך דקות; access tokens קצרים (5-15 דקות) מגבילים את השאר; ה-audit log רושם את זה", "win", 10,
            "This is exactly what enterprises test during security review, and what SOC 2 auditors ask evidence for.",
            "זה בדיוק מה שאנטרפרייז בודקים בסקירת אבטחה, ומה שמבקרי SOC 2 מבקשים עליו ראיות."),
          c("The user's 30-day session expires naturally", "ה-session של 30 יום של המשתמש פג באופן טבעי", "lose", 0,
            "A fired employee keeps access to customer data for up to a month. That's a failed security review and a lost deal.",
            "עובד מפוטר שומר גישה לנתוני לקוח עד חודש. זו סקירת אבטחה שנכשלה ועסקה שאבדה.")
        ]
      },
      win: {
        text: t("✅ The decision: buy authentication (enterprise SSO, SCIM, MFA/passkeys) from a vendor chosen by a TCO + capability matrix, migrate password hashes without resets, keep users/tenants/roles and authorization in your own system behind an internal interface, validate JWTs locally, and wire SCIM to revoke access within minutes. Two engineers ship it in one quarter.",
                "✅ ההחלטה: לקנות authentication (SSO לאנטרפרייז, SCIM, MFA/passkeys) מספק שנבחר לפי מטריצת TCO ויכולות, להעביר password hashes בלי איפוס, להשאיר משתמשים, tenants, תפקידים ו-authorization במערכת שלך מאחורי ממשק פנימי, לאמת JWTs מקומית, ולחבר SCIM שמבטל גישה תוך דקות. שני מהנדסים משחררים את זה ברבעון אחד."),
        end: "win"
      },
      lose: {
        text: t("💥 The enterprise pilot fails security review: no timely deprovisioning, and the auth path depends on a single vendor call per request. Deals slip a quarter. Identity is where you buy the hard, standard parts and own the model and the failure modes.",
                "💥 הפיילוט האנטרפרייז נכשל בסקירת האבטחה: אין deprovisioning בזמן, ונתיב ה-auth תלוי בקריאה לספק אחד בכל בקשה. העסקאות נדחות ברבעון. ב-identity קונים את החלקים הקשים והסטנדרטיים, ומחזיקים בעצמך את המודל ואת מצבי הכשל."),
        end: "lose"
      }
    },
    lessons: ["pr-auth", "flow-login-sso", "pr-enterprise-integrations", "staff-tech-strategy", "pr-third-party-deps", "pr-owasp-2025"]
  });
})();
