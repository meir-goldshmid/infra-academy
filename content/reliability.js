window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================
   Track: reliability
   ========================================================= */

INFRA.lessons.push({
  id: "rel-sli-slo-sla",
  track: "reliability",
  order: 1,
  icon: "🎯",
  level: 1,
  minutes: 9,
  title: { en: "SLI vs SLO vs SLA", he: "SLI מול SLO מול SLA" },
  tldr: {
    en: "SLI is what you measure, SLO is the target you promise yourself, SLA is the contract you promise customers (with money attached) — and none of them should ever be 100%.",
    he: "SLI זה מה שמודדים, SLO זה היעד שאתה מבטיח לעצמך, SLA זה החוזה מול הלקוח (עם כסף על השולחן) — ואף אחד מהם לא אמור להיות 100%."
  },
  analogy: {
    en: "A pizza place. The SLI is the stopwatch: 'what % of pizzas arrived within 30 minutes?'. The SLO is the kitchen's internal goal: '95% within 30 minutes'. The SLA is the flyer on your fridge: 'late by more than 45 minutes — the pizza is free'. Notice the kitchen aims stricter than the flyer, so they never actually hand out free pizza.",
    he: "פיצרייה. ה-SLI הוא הסטופר: 'כמה אחוז מהפיצות הגיעו תוך 30 דקות?'. ה-SLO הוא היעד הפנימי של המטבח: '95% תוך 30 דקות'. ה-SLA הוא המגנט על המקרר: 'איחור של יותר מ-45 דקות — הפיצה עלינו'. שים לב שהמטבח מכוון יותר גבוה מהמגנט, כדי שבפועל אף פעם לא יצטרכו לחלק פיצות בחינם."
  },
  sections: [
    {
      h: { en: "The three letters, untangled", he: "שלוש האותיות, בלי בלבול" },
      body: {
        en: `<p><strong>SLI (Service Level Indicator)</strong> — a measurement. A number from your monitoring, e.g. "99.93% of HTTP requests in the last 30 days returned non-5xx".</p>
<p><strong>SLO (Service Level Objective)</strong> — a target for an SLI over a window: "99.9% of requests succeed, measured over a rolling 28 days". Internal, owned by engineering + product. Breaking it means "stop and fix reliability", not "pay money".</p>
<p><strong>SLA (Service Level Agreement)</strong> — a legal contract with customers, with consequences (usually service credits). Written by lawyers and sales, ideally looser than your SLO.</p>
<table><tr><th></th><th>Who cares</th><th>Example</th><th>If missed</th></tr>
<tr><td>SLI</td><td>Dashboards</td><td>99.93% success</td><td>Nothing — it's just a fact</td></tr>
<tr><td>SLO</td><td>Eng + product</td><td>≥ 99.9% / 28d</td><td>Freeze features, fix reliability</td></tr>
<tr><td>SLA</td><td>Customers + legal</td><td>≥ 99.5% / month</td><td>Refund / credits</td></tr></table>`,
        he: `<p><strong>SLI (Service Level Indicator)</strong> — מדידה. מספר שיוצא מהמוניטורינג, למשל "99.93% מבקשות ה-HTTP ב-30 הימים האחרונים לא החזירו 5xx".</p>
<p><strong>SLO (Service Level Objective)</strong> — יעד ל-SLI על פני חלון זמן: "99.9% מהבקשות מצליחות, על rolling window של 28 יום". פנימי, בבעלות ה-engineering וה-product. אם שוברים אותו, המשמעות היא "עוצרים ומתקנים אמינות", לא "משלמים כסף".</p>
<p><strong>SLA (Service Level Agreement)</strong> — חוזה משפטי מול לקוחות, עם השלכות (בדרך כלל service credits). כותבים אותו משפטנים ואנשי sales, ועדיף שיהיה רך יותר מה-SLO.</p>
<table><tr><th></th><th>למי אכפת</th><th>דוגמה</th><th>אם מפספסים</th></tr>
<tr><td>SLI</td><td>דשבורדים</td><td>99.93% הצלחה</td><td>כלום — זו סתם עובדה</td></tr>
<tr><td>SLO</td><td>הנדסה + מוצר</td><td>≥ 99.9% / 28 יום</td><td>מקפיאים פיצ'רים, מתקנים אמינות</td></tr>
<tr><td>SLA</td><td>לקוחות + legal</td><td>≥ 99.5% / חודש</td><td>החזר כספי / קרדיטים</td></tr></table>`
      }
    },
    {
      h: { en: "What makes a good SLI: the ratio of good events", he: "מה זה SLI טוב: יחס של אירועים טובים" },
      body: {
        en: `<p>The best SLIs are expressed as <code>good events / valid events</code>, giving a number between 0 and 100%. This makes them comparable, easy to aggregate and directly convertible into an error budget.</p>
<ul><li><strong>Availability:</strong> requests that didn't return 5xx / all requests.</li>
<li><strong>Latency:</strong> requests served in &lt; 300 ms / all requests (a threshold, not an average!).</li>
<li><strong>Freshness:</strong> reads returning data updated in the last 1 minute / all reads.</li>
<li><strong>Correctness / durability:</strong> pipeline records processed correctly / all records.</li></ul>
<p>Measure as close to the user as possible: the load balancer logs are better than the app's own metrics (a crashed app reports zero errors), and synthetic probes or real-user monitoring are even closer. Exclude what isn't your fault, like 4xx from bad client input.</p>
<blockquote>💡 Real world: "CPU &lt; 80%" is not an SLI. Users don't care about your CPU; they care whether the checkout page loaded. Pick SLIs a user would complain about.</blockquote>`,
        he: `<p>ה-SLIs הכי טובים מנוסחים כ-<code>good events / valid events</code>, מה שנותן מספר בין 0 ל-100%. ככה אפשר להשוות ביניהם, לאגרגט אותם בקלות ולהמיר אותם ישר ל-error budget.</p>
<ul><li><strong>Availability:</strong> בקשות שלא החזירו 5xx / כל הבקשות.</li>
<li><strong>Latency:</strong> בקשות שהוגשו תוך פחות מ-300ms / כל הבקשות (סף, לא ממוצע!).</li>
<li><strong>Freshness:</strong> קריאות שהחזירו דאטה שהתעדכן בדקה האחרונה / כל הקריאות.</li>
<li><strong>Correctness / durability:</strong> רשומות שעובדו נכון ב-pipeline / כל הרשומות.</li></ul>
<p>תמדוד הכי קרוב למשתמש שאפשר: לוגים של ה-Load Balancer עדיפים על מטריקות של האפליקציה עצמה (אפליקציה שקרסה מדווחת על אפס שגיאות), ו-synthetic probes או real-user monitoring קרובים עוד יותר. תוציא מהחישוב מה שלא באשמתך, כמו 4xx בגלל input גרוע של הלקוח.</p>
<blockquote>💡 מהשטח: "CPU מתחת ל-80%" זה לא SLI. למשתמשים לא אכפת מה-CPU שלך; אכפת להם אם עמוד ה-checkout נטען. תבחר SLIs שמשתמש היה מתלונן עליהם.</blockquote>`
      }
    },
    {
      h: { en: "The nines: how much downtime is that, really?", he: "ה-nines: כמה downtime זה בפועל?" },
      body: {
        en: `<p>Every extra nine cuts allowed downtime by 10× — and typically multiplies cost and engineering effort.</p>
<table><tr><th>Availability</th><th>Per year</th><th>Per month</th><th>Per week</th><th>Per day</th></tr>
<tr><td>99% ("two nines")</td><td>3.65 days</td><td>7.3 h</td><td>1.68 h</td><td>14.4 min</td></tr>
<tr><td>99.9%</td><td>8.77 h</td><td>43.8 min</td><td>10.1 min</td><td>1.44 min</td></tr>
<tr><td>99.95%</td><td>4.38 h</td><td>21.9 min</td><td>5.04 min</td><td>43.2 s</td></tr>
<tr><td>99.99%</td><td>52.6 min</td><td>4.38 min</td><td>1.01 min</td><td>8.64 s</td></tr>
<tr><td>99.999%</td><td>5.26 min</td><td>26.3 s</td><td>6.05 s</td><td>0.86 s</td></tr></table>
<p>Gut check: at 99.99% you get ~4 minutes a month. If your on-call takes 5 minutes to acknowledge a page and open a laptop, a single human-handled incident already blew the month. Four and five nines require <em>automated</em> detection and failover — humans are too slow.</p>`,
        he: `<p>כל nine נוסף מקטין את ה-downtime המותר פי 10 — ובדרך כלל מכפיל את העלות ואת המאמץ ההנדסי.</p>
<table><tr><th>Availability</th><th>בשנה</th><th>בחודש</th><th>בשבוע</th><th>ביום</th></tr>
<tr><td>99% ("two nines")</td><td>3.65 ימים</td><td>7.3 שעות</td><td>1.68 שעות</td><td>14.4 דקות</td></tr>
<tr><td>99.9%</td><td>8.77 שעות</td><td>43.8 דקות</td><td>10.1 דקות</td><td>1.44 דקות</td></tr>
<tr><td>99.95%</td><td>4.38 שעות</td><td>21.9 דקות</td><td>5.04 דקות</td><td>43.2 שניות</td></tr>
<tr><td>99.99%</td><td>52.6 דקות</td><td>4.38 דקות</td><td>1.01 דקות</td><td>8.64 שניות</td></tr>
<tr><td>99.999%</td><td>5.26 דקות</td><td>26.3 שניות</td><td>6.05 שניות</td><td>0.86 שניות</td></tr></table>
<p>בדיקת שפיות: ב-99.99% יש לך בערך 4 דקות בחודש. אם לתורן לוקח 5 דקות לעשות ack לפייג' ולפתוח לפטופ, אירוע אחד שמטופל ידנית כבר שרף את כל החודש. ארבע וחמש nines דורשים זיהוי ו-failover <em>אוטומטיים</em> — בני אדם פשוט איטיים מדי.</p>`
      }
    },
    {
      h: { en: "SLAs: penalties and service credits", he: "SLA: קנסות ו-service credits" },
      body: {
        en: `<p>Cloud SLAs almost never pay for your lost revenue. They give <strong>service credits</strong> — a percentage of that service's monthly bill, and only if you file a claim. A typical tiered example (similar to many cloud compute SLAs):</p>
<table><tr><th>Monthly uptime</th><th>Credit</th></tr>
<tr><td>&lt; 99.99% but ≥ 99.0%</td><td>10%</td></tr>
<tr><td>&lt; 99.0% but ≥ 95.0%</td><td>30%</td></tr>
<tr><td>&lt; 95.0%</td><td>100%</td></tr></table>
<p>So if your $500/month database is down for 3 hours, you might get $50 back while your business lost $200k. The SLA is a <em>signal</em> of how much the vendor trusts its system, not insurance.</p>
<blockquote>⚠️ Production tip: Read the exclusions. Many SLAs only apply if you run in multiple AZs, exclude "scheduled maintenance", and require you to claim within 30 days with request logs as evidence.</blockquote>`,
        he: `<p>SLA של ענן כמעט אף פעם לא מכסה את ההכנסות שהפסדת. הוא נותן <strong>service credits</strong> — אחוז מהחשבון החודשי של אותו שירות, ורק אם הגשת claim. דוגמה מדורגת טיפוסית (דומה להרבה SLAs של compute בענן):</p>
<table><tr><th>Uptime חודשי</th><th>קרדיט</th></tr>
<tr><td>מתחת ל-99.99% אבל ≥ 99.0%</td><td>10%</td></tr>
<tr><td>מתחת ל-99.0% אבל ≥ 95.0%</td><td>30%</td></tr>
<tr><td>מתחת ל-95.0%</td><td>100%</td></tr></table>
<p>כלומר אם ה-DB שעולה לך $500 בחודש נפל ל-3 שעות, אולי תקבל $50 בחזרה, בזמן שהביזנס הפסיד $200k. ה-SLA הוא <em>סיגנל</em> לכמה הספק סומך על המערכת שלו, לא ביטוח.</p>
<blockquote>⚠️ טיפ לפרודקשן: תקרא את ה-exclusions. הרבה SLAs חלים רק אם אתה רץ על כמה AZs, לא כוללים "תחזוקה מתוכננת", ודורשים להגיש claim תוך 30 יום עם לוגים כהוכחה.</blockquote>`
      }
    },
    {
      h: { en: "Why the SLO should never be 100%", he: "למה SLO אף פעם לא צריך להיות 100%" },
      body: {
        en: `<p><strong>1. It's impossible.</strong> The user's Wi-Fi, their ISP, their phone's battery and DNS resolvers are all less reliable than 99.999%. Beyond a point, your extra nines are invisible to users.</p>
<p><strong>2. It's infinitely expensive.</strong> Each nine roughly needs another layer of redundancy, automation and process.</p>
<p><strong>3. It freezes you.</strong> A 100% target means every deploy is a risk you can't afford, so you stop shipping. The gap between 100% and your SLO is the <em>error budget</em> — the room you have to take risks, deploy, and experiment.</p>
<p>Pick the SLO based on what users actually notice and what the business needs: an internal batch reporting tool might be fine at 99%, a payments API at 99.95%. Start with what you achieve today, then tighten.</p>
<blockquote>💡 Real world: Google's SRE book calls 100% "the wrong reliability target for basically everything". Even pacemakers aren't 100%.</blockquote>`,
        he: `<p><strong>1. זה בלתי אפשרי.</strong> ה-Wi-Fi של המשתמש, ספק האינטרנט שלו, הסוללה בטלפון וה-DNS resolvers — כולם פחות אמינים מ-99.999%. מעבר לנקודה מסוימת, ה-nines הנוספים שלך פשוט בלתי נראים למשתמש.</p>
<p><strong>2. זה יקר עד אינסוף.</strong> כל nine דורש בערך עוד שכבה של redundancy, אוטומציה ותהליכים.</p>
<p><strong>3. זה מקפיא אותך.</strong> יעד של 100% אומר שכל deploy הוא סיכון שאי אפשר להרשות לעצמך, אז מפסיקים לשחרר. הפער בין 100% ל-SLO שלך הוא ה-<em>error budget</em> — המרווח שיש לך לקחת סיכונים, לעשות deploy ולנסות דברים.</p>
<p>תבחר SLO לפי מה שמשתמשים באמת מרגישים ומה שהביזנס צריך: כלי דוחות batch פנימי יכול לחיות עם 99%, payments API צריך 99.95%. תתחיל ממה שאתה משיג היום, ואז תהדק.</p>
<blockquote>💡 מהשטח: בספר ה-SRE של גוגל קוראים ל-100% "יעד האמינות הלא נכון כמעט לכל דבר". אפילו קוצבי לב הם לא 100%.</blockquote>`
      }
    }
  ],
  diagram: `  SLI (measured)        SLO (internal target)     SLA (contract)
  99.93% success   -->   >= 99.9% / 28d      -->   >= 99.5% / month
  "what is"              "what we aim for"         "what we pay for"
                         |<-- safety margin -->|`,
  handsOn: [
    {
      cmd: `sum(rate(http_requests_total{code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))`,
      what: { en: "PromQL availability SLI: ratio of non-5xx requests over 30 days.", he: "SLI של availability ב-PromQL: יחס הבקשות שלא החזירו 5xx על פני 30 יום." }
    },
    {
      cmd: `sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))`,
      what: { en: "Latency SLI: fraction of requests served in under 300 ms (uses histogram buckets).", he: "SLI של latency: איזה חלק מהבקשות הוגש תוך פחות מ-300ms (מבוסס histogram buckets)." }
    },
    {
      cmd: `node -e "for (const a of [99,99.9,99.95,99.99,99.999]) console.log(a+'%', ((1-a/100)*30*24*60).toFixed(1)+' min/month')"`,
      what: { en: "Compute allowed downtime per 30-day month for each number of nines.", he: "חשב כמה downtime מותר בחודש של 30 יום לכל כמות nines." }
    }
  ],
  mnemonic: {
    en: "I-O-A: Indicator = what Is, Objective = what we Aim, Agreement = what we Answer for (in money). And the SLA is always the loosest: 'Lawyers Are Lenient'.",
    he: "I-O-A: Indicator = מה שיש (Is), Objective = למה שואפים (Aim), Agreement = על מה עונים בכסף (Answer). וה-SLA תמיד הכי רך — כי עורכי דין לא רוצים לשלם."
  },
  pitfalls: [
    { en: "Setting SLA = SLO. Then the first time you miss your internal goal, you're also paying customers. Keep a margin (e.g., SLO 99.9%, SLA 99.5%).", he: "לקבוע SLA = SLO. ככה בפעם הראשונה שמפספסים את היעד הפנימי, גם משלמים ללקוחות. תשאיר מרווח (למשל SLO 99.9%, SLA 99.5%)." },
    { en: "Using average latency as an SLI. An average of 200 ms can hide 5% of users waiting 4 seconds. Use 'requests under threshold' or percentiles (p95/p99).", he: "להשתמש ב-latency ממוצע כ-SLI. ממוצע של 200ms יכול להסתיר 5% משתמשים שמחכים 4 שניות. תשתמש ב-'בקשות מתחת לסף' או ב-percentiles (p95/p99)." },
    { en: "Measuring only from inside the app. If the process is dead, it reports 0 errors and 100% success. Measure at the LB or with synthetic probes.", he: "למדוד רק מתוך האפליקציה. אם התהליך מת, הוא מדווח 0 שגיאות ו-100% הצלחה. תמדוד ב-LB או עם synthetic probes." },
    { en: "Too many SLOs. 20 SLOs per service means nobody watches any. Start with 1-3 per user journey (availability + latency).", he: "יותר מדי SLOs. 20 SLOs לשירות זה אומר שאף אחד לא מסתכל על אף אחד. תתחיל עם 1-3 לכל user journey (availability + latency)." }
  ],
  interview: [
    {
      q: { en: "Explain the difference between SLI, SLO and SLA, and why the SLA should be looser than the SLO.", he: "תסביר את ההבדל בין SLI, SLO ו-SLA, ולמה ה-SLA צריך להיות רך יותר מה-SLO." },
      a: { en: "SLI is the measured metric (e.g., % successful requests). SLO is the internal target for it over a window (99.9%/28d). SLA is the external contract with financial penalties. The SLA is looser so the SLO acts as an early warning: you react to SLO breaches internally long before you owe customers anything.", he: "SLI הוא המטריקה הנמדדת (למשל % בקשות מוצלחות). SLO הוא היעד הפנימי עליה בחלון זמן (99.9%/28 יום). SLA הוא החוזה החיצוני עם קנסות כספיים. ה-SLA רך יותר כדי שה-SLO ישמש התרעה מוקדמת: מגיבים לשבירת SLO פנימית הרבה לפני שחייבים משהו ללקוחות." }
    },
    {
      q: { en: "How would you define an SLI for a checkout API?", he: "איך היית מגדיר SLI ל-checkout API?" },
      a: { en: "Two ratio SLIs measured at the load balancer: availability = non-5xx responses / valid requests (excluding 4xx from bad input), and latency = requests completed under, say, 500 ms / valid requests. Then set SLOs like 99.95% and 99% respectively over 28 days, and possibly add a synthetic end-to-end probe that places a test order.", he: "שני SLIs מבוססי יחס שנמדדים ב-Load Balancer: availability = תגובות שאינן 5xx / בקשות תקינות (בלי 4xx של input גרוע), ו-latency = בקשות שהסתיימו תוך, נגיד, 500ms / בקשות תקינות. ואז SLOs כמו 99.95% ו-99% בהתאמה על 28 יום, ואולי גם synthetic probe מקצה לקצה שמבצע הזמנת טסט." }
    }
  ],
  quiz: [
    {
      q: { en: "Approximately how much downtime per month does a 99.9% availability SLO allow?", he: "בערך כמה downtime בחודש מאפשר SLO של 99.9% availability?" },
      options: [
        { en: "4.4 minutes", he: "4.4 דקות" },
        { en: "43.8 minutes", he: "43.8 דקות" },
        { en: "7.3 hours", he: "7.3 שעות" },
        { en: "8.8 hours", he: "8.8 שעות" }
      ],
      answer: 1,
      explain: { en: "0.1% of ~730 hours ≈ 43.8 minutes. 4.4 min is 99.99%/month, 7.3 h is 99%/month, and 8.8 h is 99.9% per YEAR.", he: "0.1% מתוך ~730 שעות ≈ 43.8 דקות. 4.4 דקות זה 99.99% לחודש, 7.3 שעות זה 99% לחודש, ו-8.8 שעות זה 99.9% לשנה." }
    },
    {
      q: { en: "Which of these is the best SLI?", he: "איזה מהבאים הוא ה-SLI הכי טוב?" },
      options: [
        { en: "Average CPU utilization of the web servers", he: "ניצול CPU ממוצע של שרתי ה-web" },
        { en: "Average response time across all requests", he: "זמן תגובה ממוצע על כל הבקשות" },
        { en: "Fraction of valid requests served successfully in under 300 ms, measured at the load balancer", he: "החלק מהבקשות התקינות שהוגשו בהצלחה תוך פחות מ-300ms, נמדד ב-Load Balancer" },
        { en: "Number of pods in Running state", he: "מספר ה-pods במצב Running" }
      ],
      answer: 2,
      explain: { en: "A good SLI is a user-facing ratio of good/valid events measured close to the user. CPU and pod count are causes, not user experience; averages hide tail latency.", he: "SLI טוב הוא יחס good/valid שהמשתמש מרגיש, שנמדד קרוב למשתמש. CPU ומספר pods הם סיבות, לא חוויית משתמש; ממוצעים מסתירים את ה-tail latency." }
    },
    {
      q: { en: "Your cloud DB violated its 99.99% SLA for a month. What do you typically get?", he: "ה-DB שלך בענן הפר את ה-SLA של 99.99% בחודש מסוים. מה בדרך כלל מקבלים?" },
      options: [
        { en: "Compensation for the revenue you lost", he: "פיצוי על ההכנסות שהפסדת" },
        { en: "A service credit worth a percentage of that service's bill, if you claim it", he: "Service credit בשווי אחוז מהחשבון של אותו שירות, אם הגשת claim" },
        { en: "Automatic migration to a more reliable region", he: "מיגרציה אוטומטית ל-region אמין יותר" },
        { en: "Nothing — SLAs are not enforceable", he: "כלום — SLAs לא אכיפים" }
      ],
      answer: 1,
      explain: { en: "Cloud SLAs give tiered service credits (e.g., 10%/30%/100% of the monthly bill for that service), usually only on request. They never cover your business losses.", he: "SLAs של ענן נותנים service credits מדורגים (למשל 10%/30%/100% מהחשבון החודשי של השירות), בדרך כלל רק לפי בקשה. הם אף פעם לא מכסים את ההפסדים העסקיים שלך." }
    },
    {
      q: { en: "Why is 100% a bad SLO?", he: "למה 100% הוא SLO גרוע?" },
      options: [
        { en: "Because monitoring tools can't display 100%", he: "כי כלי מוניטורינג לא יודעים להציג 100%" },
        { en: "Because it leaves zero error budget, making every change unaffordable, and users can't perceive it anyway", he: "כי הוא משאיר אפס error budget, כך שכל שינוי הופך לסיכון שאי אפשר לספוג, וממילא המשתמשים לא מרגישים את זה" },
        { en: "Because SLAs legally forbid it", he: "כי SLAs אוסרים את זה מבחינה חוקית" },
        { en: "It's fine for critical systems like payments", he: "זה בסדר למערכות קריטיות כמו תשלומים" }
      ],
      answer: 1,
      explain: { en: "100% means no room for deploys or failures, infinite cost, and the user's own network is less reliable than your extra nines. Even payments use 99.95-99.99%.", he: "100% אומר שאין מקום ל-deploys או לכשלים, עלות אינסופית, והרשת של המשתמש עצמה פחות אמינה מה-nines הנוספים שלך. גם מערכות תשלומים עובדות עם 99.95-99.99%." }
    }
  ],
  playground: "slo",
  related: ["rel-error-budgets", "obs-golden-signals", "obs-alerting"]
});

INFRA.lessons.push({
  id: "rel-error-budgets",
  track: "reliability",
  order: 2,
  icon: "💸",
  level: 2,
  minutes: 9,
  title: { en: "Error Budgets & Burn Rate", he: "Error Budgets ו-Burn Rate" },
  tldr: {
    en: "Error budget = 1 − SLO: the amount of unreliability you're allowed to 'spend' on deploys and experiments; when it's gone, you stop shipping features and fix reliability.",
    he: "Error budget = 1 − SLO: כמות חוסר האמינות שמותר לך 'לבזבז' על deploys וניסויים; כשהוא נגמר, מפסיקים לשחרר פיצ'רים ומתקנים אמינות."
  },
  analogy: {
    en: "It's a monthly data plan for failure. With a 99.9% SLO you get 43 minutes of 'bad minutes' per month. Spend them on bold launches if you like — but if you burn the whole plan by the 10th, no more streaming (feature releases) until next cycle. Burn rate is how fast your phone is eating the plan.",
    he: "זה כמו חבילת גלישה חודשית של כישלונות. עם SLO של 99.9% יש לך 43 'דקות רעות' בחודש. אפשר לבזבז אותן על השקות נועזות — אבל אם גמרת את כל החבילה עד ה-10 בחודש, אין יותר סטרימינג (שחרורי פיצ'רים) עד המחזור הבא. Burn rate זה כמה מהר הטלפון אוכל לך את החבילה."
  },
  sections: [
    {
      h: { en: "Budget = 1 − SLO, in real numbers", he: "Budget = 1 − SLO, במספרים אמיתיים" },
      body: {
        en: `<p>If your SLO is 99.9% of requests succeed over 30 days, your error budget is 0.1%. Translate it into whichever unit is useful:</p>
<table><tr><th>SLO</th><th>Budget</th><th>Time (30d)</th><th>Failed requests if 100M req/month</th></tr>
<tr><td>99%</td><td>1%</td><td>7.2 h</td><td>1,000,000</td></tr>
<tr><td>99.9%</td><td>0.1%</td><td>43.2 min</td><td>100,000</td></tr>
<tr><td>99.95%</td><td>0.05%</td><td>21.6 min</td><td>50,000</td></tr>
<tr><td>99.99%</td><td>0.01%</td><td>4.3 min</td><td>10,000</td></tr></table>
<p>Request-based budgets are fairer than time-based ones: a 10-minute outage at 3 AM with little traffic burns far less than 10 minutes during Black Friday peak. A bad deploy that fails 2% of requests for 30 minutes burns 0.02 × 30 = 0.6 "full-outage minutes" — tiny. A total outage of 30 minutes burns 70% of a 99.9% budget.</p>`,
        he: `<p>אם ה-SLO שלך הוא ש-99.9% מהבקשות מצליחות על פני 30 יום, ה-error budget הוא 0.1%. תתרגם אותו לאיזו יחידה שנוחה לך:</p>
<table><tr><th>SLO</th><th>Budget</th><th>זמן (30 יום)</th><th>בקשות שנכשלו ב-100M בקשות לחודש</th></tr>
<tr><td>99%</td><td>1%</td><td>7.2 שעות</td><td>1,000,000</td></tr>
<tr><td>99.9%</td><td>0.1%</td><td>43.2 דקות</td><td>100,000</td></tr>
<tr><td>99.95%</td><td>0.05%</td><td>21.6 דקות</td><td>50,000</td></tr>
<tr><td>99.99%</td><td>0.01%</td><td>4.3 דקות</td><td>10,000</td></tr></table>
<p>Budget מבוסס בקשות הוגן יותר מאשר מבוסס זמן: השבתה של 10 דקות ב-3 בלילה עם מעט טראפיק שורפת הרבה פחות מ-10 דקות בשיא של Black Friday. Deploy גרוע שמכשיל 2% מהבקשות למשך 30 דקות שורף 0.02 × 30 = 0.6 "דקות השבתה מלאה" — כמעט כלום. השבתה מלאה של 30 דקות שורפת 70% מ-budget של 99.9%.</p>`
      }
    },
    {
      h: { en: "The error budget policy", he: "ה-Error budget policy" },
      body: {
        en: `<p>A budget without consequences is just a chart. An <strong>error budget policy</strong> is a short document, agreed in advance by engineering <em>and</em> product leadership, that says what happens at each level:</p>
<ul><li><strong>Budget healthy (&gt; 50% left):</strong> ship freely, run experiments, do risky migrations.</li>
<li><strong>Budget low (&lt; 25%):</strong> extra review for risky changes, prefer canaries, no Friday deploys.</li>
<li><strong>Budget exhausted:</strong> feature freeze. Only bug fixes, security patches and reliability work ship until the rolling window recovers.</li>
<li><strong>A single incident ate &gt; 20% of the budget:</strong> mandatory postmortem with a P0 action item.</li></ul>
<blockquote>💡 Real world: The magic of the policy is that it turns an emotional argument ("devs move too fast!" vs "ops is blocking us!") into arithmetic both sides agreed to on a calm day. Nobody has to be the bad guy.</blockquote>`,
        he: `<p>Budget בלי השלכות הוא סתם גרף. <strong>Error budget policy</strong> הוא מסמך קצר, שמוסכם מראש על ידי הנהלת ההנדסה <em>וגם</em> המוצר, ואומר מה קורה בכל רמה:</p>
<ul><li><strong>Budget בריא (נשאר מעל 50%):</strong> משחררים בחופשיות, מריצים ניסויים, עושים מיגרציות מסוכנות.</li>
<li><strong>Budget נמוך (מתחת ל-25%):</strong> review נוסף לשינויים מסוכנים, מעדיפים canary, אין deploys ביום שישי.</li>
<li><strong>Budget נגמר:</strong> feature freeze. רק באגים, security patches ועבודת אמינות עולים לפרודקשן עד שה-rolling window מתאושש.</li>
<li><strong>אירוע בודד אכל מעל 20% מה-budget:</strong> postmortem חובה עם action item ב-P0.</li></ul>
<blockquote>💡 מהשטח: הקסם של ה-policy הוא שהוא הופך ויכוח רגשי ("המפתחים רצים מהר מדי!" מול "ה-ops חוסמים אותנו!") לחשבון ששני הצדדים הסכימו עליו ביום רגוע. אף אחד לא צריך להיות האיש הרע.</blockquote>`
      }
    },
    {
      h: { en: "Burn rate and multi-window alerts", he: "Burn rate והתראות multi-window" },
      body: {
        en: `<p><strong>Burn rate</strong> = how fast you consume budget relative to "exactly on pace". Burn rate 1 means you'll use exactly 100% of the budget by the end of the window. Burn rate 10 means you'll exhaust a 30-day budget in 3 days.</p>
<p>Formula: <code>burn rate = observed error rate / (1 − SLO)</code>. With a 99.9% SLO and 1.44% errors, burn rate = 0.0144 / 0.001 = 14.4.</p>
<table><tr><th>Burn rate</th><th>Long window</th><th>Short window</th><th>Budget used</th><th>Action</th></tr>
<tr><td>14.4</td><td>1 h</td><td>5 min</td><td>2%</td><td>Page</td></tr>
<tr><td>6</td><td>6 h</td><td>30 min</td><td>5%</td><td>Page</td></tr>
<tr><td>1</td><td>3 days</td><td>6 h</td><td>10%</td><td>Ticket</td></tr></table>
<p>The short window makes the alert stop quickly once the problem is fixed. This (from the Google SRE Workbook) replaces noisy "error rate &gt; 1% for 5 min" alerts with ones that only fire when the budget is actually at risk.</p>`,
        he: `<p><strong>Burn rate</strong> = כמה מהר אתה צורך את ה-budget ביחס לקצב "בדיוק בזמן". Burn rate של 1 אומר שתגמור בדיוק 100% מה-budget בסוף החלון. Burn rate של 10 אומר שתגמור budget של 30 יום תוך 3 ימים.</p>
<p>נוסחה: <code>burn rate = observed error rate / (1 − SLO)</code>. עם SLO של 99.9% ו-1.44% שגיאות, burn rate = 0.0144 / 0.001 = 14.4.</p>
<table><tr><th>Burn rate</th><th>חלון ארוך</th><th>חלון קצר</th><th>Budget שנצרך</th><th>פעולה</th></tr>
<tr><td>14.4</td><td>שעה</td><td>5 דקות</td><td>2%</td><td>Page</td></tr>
<tr><td>6</td><td>6 שעות</td><td>30 דקות</td><td>5%</td><td>Page</td></tr>
<tr><td>1</td><td>3 ימים</td><td>6 שעות</td><td>10%</td><td>Ticket</td></tr></table>
<p>החלון הקצר גורם להתראה להיסגר מהר ברגע שהבעיה תוקנה. הגישה הזאת (מה-SRE Workbook של גוגל) מחליפה התראות רועשות כמו "error rate מעל 1% ל-5 דקות" בהתראות שקופצות רק כשה-budget באמת בסכנה.</p>`
      }
    },
    {
      h: { en: "Velocity vs reliability: spending the budget wisely", he: "מהירות מול אמינות: לבזבז את ה-budget בחוכמה" },
      body: {
        en: `<p>An unspent budget is also a signal. If you finish every month at 95% budget remaining, you're probably <em>too</em> cautious: you could deploy more often, skip some manual approvals, or run that chaos experiment. Budget is meant to be spent.</p>
<p>Conversely, if you're always out of budget, either the system needs real reliability investment, or the SLO is stricter than users actually need — renegotiate it with data.</p>
<blockquote>⚠️ Production tip: Planned maintenance counts against the budget too. If you need 30 minutes of DB downtime monthly with a 99.95% SLO (21.6 min budget), you can't afford it — you need online migrations, not a bigger maintenance window.</blockquote>`,
        he: `<p>Budget שלא נוצל הוא גם סיגנל. אם אתה מסיים כל חודש עם 95% budget שנשאר, כנראה שאתה זהיר <em>מדי</em>: אפשר לעשות deploy יותר בתדירות, לוותר על חלק מה-approvals הידניים, או להריץ את ניסוי ה-chaos ההוא. ה-budget נועד כדי לבזבז אותו.</p>
<p>מנגד, אם אתה תמיד בלי budget, או שהמערכת צריכה השקעה אמיתית באמינות, או שה-SLO מחמיר יותר ממה שהמשתמשים צריכים — תפתח אותו מחדש למשא ומתן, עם דאטה.</p>
<blockquote>⚠️ טיפ לפרודקשן: גם תחזוקה מתוכננת נספרת ב-budget. אם אתה צריך 30 דקות downtime ל-DB כל חודש עם SLO של 99.95% (budget של 21.6 דקות), אין לך את זה — אתה צריך online migrations, לא חלון תחזוקה גדול יותר.</blockquote>`
      }
    },
    {
      h: { en: "Composite availability: your dependencies eat your budget", he: "Composite availability: התלויות שלך אוכלות לך את ה-budget" },
      body: {
        en: `<p>If a request must go through several components <strong>in series</strong>, their availabilities multiply:</p>
<pre>LB (99.99%) × app (99.9%) × DB (99.9%) × auth API (99.9%)
= 0.9999 × 0.999 × 0.999 × 0.999 ≈ 0.9969  → 99.69%</pre>
<p>Three "three nines" dependencies give you barely more than two and a half nines. You <em>cannot</em> promise 99.9% on top of them without help. The fix is <strong>parallel redundancy</strong>: two independent replicas each at 99% give <code>1 − (0.01 × 0.01) = 99.99%</code> — if failures are truly independent (different AZs, no shared config push).</p>
<table><tr><th>Setup</th><th>Formula</th><th>Result</th></tr>
<tr><td>2 × 99.9% in series</td><td>0.999²</td><td>99.80%</td></tr>
<tr><td>5 × 99.9% in series</td><td>0.999⁵</td><td>99.50%</td></tr>
<tr><td>2 × 99% in parallel</td><td>1 − 0.01²</td><td>99.99%</td></tr>
<tr><td>3 × 99% in parallel</td><td>1 − 0.01³</td><td>99.9999%</td></tr></table>
<p>Other tricks: make dependencies soft (cache, fallback, degrade gracefully), call them asynchronously, or remove them from the critical path.</p>`,
        he: `<p>אם בקשה חייבת לעבור דרך כמה רכיבים <strong>בטור</strong>, ה-availability שלהם מוכפל:</p>
<pre>LB (99.99%) × app (99.9%) × DB (99.9%) × auth API (99.9%)
= 0.9999 × 0.999 × 0.999 × 0.999 ≈ 0.9969  → 99.69%</pre>
<p>שלוש תלויות של "three nines" נותנות לך בקושי שתיים וחצי nines. אתה <em>לא יכול</em> להבטיח 99.9% מעליהן בלי עזרה. הפתרון הוא <strong>redundancy במקביל</strong>: שני replicas בלתי תלויים, כל אחד 99%, נותנים <code>1 − (0.01 × 0.01) = 99.99%</code> — בתנאי שהכשלים באמת בלתי תלויים (AZs שונים, בלי config push משותף).</p>
<table><tr><th>מבנה</th><th>נוסחה</th><th>תוצאה</th></tr>
<tr><td>2 × 99.9% בטור</td><td>0.999²</td><td>99.80%</td></tr>
<tr><td>5 × 99.9% בטור</td><td>0.999⁵</td><td>99.50%</td></tr>
<tr><td>2 × 99% במקביל</td><td>1 − 0.01²</td><td>99.99%</td></tr>
<tr><td>3 × 99% במקביל</td><td>1 − 0.01³</td><td>99.9999%</td></tr></table>
<p>טריקים נוספים: להפוך תלויות ל-soft (cache, fallback, graceful degradation), לקרוא להן אסינכרונית, או להוציא אותן מה-critical path.</p>`
      }
    }
  ],
  diagram: `Error budget (99.9% SLO, 30 days = 43.2 min)
day 1  [##########################################] 100%
day 10 [#############################-------------]  70%  normal burn
day 12 [######------------------------------------]  14%  bad deploy! burn rate 14x
       -> policy: FEATURE FREEZE until budget recovers`,
  handsOn: [
    {
      cmd: `node -e "const slo=0.999, err=0.0144; console.log('burn rate', err/(1-slo), '-> budget gone in', (30/(err/(1-slo))).toFixed(1), 'days')"`,
      what: { en: "Compute burn rate and time-to-exhaustion for a given error rate.", he: "חשב burn rate וכמה זמן נשאר עד שה-budget נגמר, עבור error rate נתון." }
    },
    {
      cmd: `node -e "console.log((0.9999*0.999*0.999*0.999*100).toFixed(3)+'%', (100*(1-0.01**2)).toFixed(3)+'%')"`,
      what: { en: "Compare a serial dependency chain vs two redundant replicas in parallel.", he: "השווה שרשרת תלויות בטור מול שני replicas במקביל." }
    },
    {
      cmd: `(sum(rate(http_requests_total{code=~"5.."}[1h])) / sum(rate(http_requests_total[1h]))) / 0.001 > 14.4`,
      what: { en: "PromQL fast-burn alert condition for a 99.9% SLO (pair it with the same check over 5m).", he: "תנאי התראת fast-burn ב-PromQL עבור SLO של 99.9% (לשלב עם אותה בדיקה על 5m)." }
    }
  ],
  mnemonic: {
    en: "\"Budget is for Burning\" — 1 minus SLO is your allowance; burn rate 1 = on pace, 14.4 = page now; empty wallet = feature freeze.",
    he: "\"Budget נועד לשריפה\" — 1 פחות SLO זה דמי הכיס; burn rate 1 = בקצב, 14.4 = להעיר את התורן; ארנק ריק = feature freeze."
  },
  pitfalls: [
    { en: "No agreed policy. Without product leadership signing off in advance, the freeze never happens when the budget runs out.", he: "אין policy מוסכם. בלי שהנהלת המוצר חתמה מראש, ה-freeze אף פעם לא קורה כשה-budget נגמר." },
    { en: "Alerting on raw error rate thresholds instead of burn rate: noisy pages for blips, and silence for slow leaks that quietly eat the whole budget.", he: "התראות על סף error rate גולמי במקום על burn rate: פייג'ים רועשים על קפיצות קטנות, ושקט מוחלט על דליפה איטית שאוכלת את כל ה-budget." },
    { en: "Forgetting composite availability: promising 99.99% while depending synchronously on three 99.9% services.", he: "לשכוח את ה-composite availability: להבטיח 99.99% כשאתה תלוי סינכרונית בשלושה שירותים של 99.9%." },
    { en: "Assuming redundant replicas are independent when they share a region, a config system or a deploy pipeline — correlated failures break the parallel formula.", he: "להניח ש-replicas הם בלתי תלויים כשהם חולקים region, מערכת config או deploy pipeline — כשלים מתואמים שוברים את נוסחת המקביל." }
  ],
  interview: [
    {
      q: { en: "What is burn rate and why is it better for alerting than a static error threshold?", he: "מה זה burn rate ולמה הוא עדיף להתראות על פני סף שגיאות סטטי?" },
      a: { en: "Burn rate is the observed error rate divided by the allowed error rate (1 − SLO). It ties alerts directly to SLO impact: a 14.4x burn over 1 hour consumes 2% of a 30-day budget and deserves a page, while a short 0.5% blip doesn't. Using multiple windows (long + short) gives both good precision and fast reset.", he: "Burn rate הוא ה-error rate שנמדד חלקי ה-error rate המותר (1 − SLO). הוא קושר את ההתראות ישירות להשפעה על ה-SLO: burn של פי 14.4 לשעה צורך 2% מ-budget של 30 יום ומצדיק פייג', בעוד קפיצה קצרה של 0.5% לא. שימוש בכמה חלונות (ארוך + קצר) נותן גם דיוק טוב וגם איפוס מהיר." }
    },
    {
      q: { en: "Your service depends on 4 services, each 99.9%. What's your max availability and how do you improve it?", he: "השירות שלך תלוי ב-4 שירותים, כל אחד 99.9%. מה ה-availability המקסימלי ואיך משפרים אותו?" },
      a: { en: "In series: 0.999⁴ ≈ 99.6%, before your own failures. Improve by removing dependencies from the critical path (async, queues), caching and graceful fallbacks, adding independent redundancy, and setting timeouts/circuit breakers so a slow dependency doesn't take you down.", he: "בטור: 0.999⁴ ≈ 99.6%, עוד לפני הכשלים שלך. משפרים על ידי הוצאת תלויות מה-critical path (async, queues), caching ו-fallbacks, הוספת redundancy בלתי תלוי, ו-timeouts/circuit breakers כדי שתלות איטית לא תפיל אותך." }
    }
  ],
  quiz: [
    {
      q: { en: "SLO is 99.9% over 30 days. Current error rate is 0.6%. What is the burn rate?", he: "ה-SLO הוא 99.9% על 30 יום. ה-error rate הנוכחי הוא 0.6%. מה ה-burn rate?" },
      options: [
        { en: "0.6", he: "0.6" },
        { en: "6", he: "6" },
        { en: "60", he: "60" },
        { en: "0.06", he: "0.06" }
      ],
      answer: 1,
      explain: { en: "Burn rate = 0.006 / 0.001 = 6. At that pace the 30-day budget is gone in 5 days.", he: "Burn rate = 0.006 / 0.001 = 6. בקצב הזה ה-budget של 30 יום נגמר תוך 5 ימים." }
    },
    {
      q: { en: "A request passes through 3 components in series, each 99.9% available. Overall availability is about:", he: "בקשה עוברת דרך 3 רכיבים בטור, כל אחד 99.9% available. ה-availability הכולל הוא בערך:" },
      options: [
        { en: "99.9%", he: "99.9%" },
        { en: "99.97%", he: "99.97%" },
        { en: "99.7%", he: "99.7%" },
        { en: "97%", he: "97%" }
      ],
      answer: 2,
      explain: { en: "0.999³ ≈ 0.997. Serial availabilities multiply, so the chain is always worse than its weakest link.", he: "0.999³ ≈ 0.997. ב-availability בטור מכפילים, אז השרשרת תמיד גרועה מהחוליה החלשה שלה." }
    },
    {
      q: { en: "According to a typical error budget policy, what happens when the budget is exhausted?", he: "לפי error budget policy טיפוסי, מה קורה כשה-budget נגמר?" },
      options: [
        { en: "The SLO is lowered automatically", he: "ה-SLO יורד אוטומטית" },
        { en: "Customers receive service credits", he: "הלקוחות מקבלים service credits" },
        { en: "Feature releases freeze; only reliability fixes and security patches ship", he: "שחרורי פיצ'רים מוקפאים; עולים רק תיקוני אמינות ו-security patches" },
        { en: "The on-call engineer is replaced", he: "מחליפים את התורן" }
      ],
      answer: 2,
      explain: { en: "The point of the policy is a pre-agreed feature freeze to redirect effort into reliability. Credits are an SLA matter, and lowering the SLO isn't automatic.", he: "המטרה של ה-policy היא feature freeze מוסכם מראש שמסיט את המאמץ לאמינות. קרדיטים זה עניין של SLA, והורדת SLO היא לא אוטומטית." }
    },
    {
      q: { en: "You end every month with 97% of your error budget unused. What's the most reasonable conclusion?", he: "אתה מסיים כל חודש עם 97% מה-error budget לא מנוצל. מה המסקנה הכי סבירה?" },
      options: [
        { en: "Perfect — that's the goal", he: "מושלם — זו המטרה" },
        { en: "You may be over-cautious: ship faster, reduce manual gates, or run riskier experiments", he: "אולי אתה זהיר מדי: אפשר לשחרר מהר יותר, להוריד gates ידניים, או להריץ ניסויים נועזים יותר" },
        { en: "Raise the SLO to 100%", he: "להעלות את ה-SLO ל-100%" },
        { en: "Your SLI is broken", he: "ה-SLI שלך שבור" }
      ],
      answer: 1,
      explain: { en: "Unspent budget is wasted opportunity. It can also hint the SLI is miscalibrated, but the default reading is: you have room to move faster.", he: "Budget שלא נוצל הוא הזדמנות מבוזבזת. זה יכול גם לרמז שה-SLI לא מכויל, אבל הקריאה הדיפולטית היא: יש לך מקום לזוז מהר יותר." }
    }
  ],
  playground: "slo",
  related: ["rel-sli-slo-sla", "obs-alerting", "rel-deployments"]
});

INFRA.lessons.push({
  id: "rel-ha",
  track: "reliability",
  order: 3,
  icon: "🛡️",
  level: 2,
  minutes: 10,
  title: { en: "High Availability", he: "High Availability – זמינות גבוהה" },
  tldr: {
    en: "HA = no single point of failure: redundant copies of everything, spread across failure domains (AZs), with health checks that automatically route around the dead parts.",
    he: "HA = אין single point of failure: עותקים מיותרים של הכול, מפוזרים על פני failure domains (AZs), עם health checks שמנתבים אוטומטית מסביב לחלקים המתים."
  },
  analogy: {
    en: "A commercial airplane has two engines, two pilots, multiple hydraulic systems, and can land with one engine out. Nobody designs a plane assuming the engine won't fail — they design it so that when it fails, passengers barely notice. Also: the two pilots don't eat the same meal, so one bad fish doesn't take both out. That's 'independent failure domains'.",
    he: "למטוס נוסעים יש שני מנועים, שני טייסים, כמה מערכות הידראוליות, והוא יכול לנחות עם מנוע אחד. אף אחד לא מתכנן מטוס בהנחה שהמנוע לא יתקלקל — מתכננים כך שכשהוא מתקלקל, הנוסעים בקושי מרגישים. ועוד דבר: שני הטייסים לא אוכלים את אותה ארוחה, כדי שדג מקולקל אחד לא יוציא את שניהם מהמשחק. זה 'failure domains בלתי תלויים'."
  },
  sections: [
    {
      h: { en: "Redundancy and SPOF hunting", he: "Redundancy וציד SPOFs" },
      body: {
        en: `<p>A <strong>Single Point Of Failure (SPOF)</strong> is any component whose death takes the whole service down. HA work is basically a SPOF hunt. Draw the request path end to end and, for every box, ask: "if this dies right now, what happens?"</p>
<p>Usual suspects:</p>
<ul><li>The single primary database (no replica, or a replica nobody ever promoted).</li>
<li>A single NAT gateway in one AZ that all private subnets route through.</li>
<li>One Redis node holding sessions.</li>
<li>DNS hosted at a single provider; one TLS cert that expires on a Saturday.</li>
<li>A cron job that runs on "that one VM".</li>
<li>Humans: the only engineer who knows how billing deploys.</li></ul>
<blockquote>💡 Real world: Many big outages weren't a server dying, but a shared dependency — a config service, an IAM/auth system, a DNS change — that every "redundant" copy relied on. Redundancy only helps if the copies fail independently.</blockquote>`,
        he: `<p><strong>Single Point Of Failure (SPOF)</strong> הוא כל רכיב שהמוות שלו מפיל את כל השירות. עבודת HA היא בעצם ציד SPOFs. תצייר את מסלול הבקשה מקצה לקצה, ולכל קופסה תשאל: "אם זה מת עכשיו, מה קורה?"</p>
<p>החשודים הרגילים:</p>
<ul><li>DB primary יחיד (בלי replica, או עם replica שאף פעם לא עשו לו promote).</li>
<li>NAT gateway יחיד ב-AZ אחד שכל ה-private subnets עוברים דרכו.</li>
<li>Node אחד של Redis שמחזיק sessions.</li>
<li>DNS אצל ספק יחיד; תעודת TLS אחת שפגה ביום שבת.</li>
<li>Cron job שרץ על "ה-VM ההוא".</li>
<li>בני אדם: המהנדס היחיד שיודע איך עושים deploy ל-billing.</li></ul>
<blockquote>💡 מהשטח: הרבה השבתות גדולות לא נגרמו משרת שמת, אלא מתלות משותפת — שירות config, מערכת IAM/auth, שינוי DNS — שכל העותקים ה"מיותרים" נשענו עליה. Redundancy עוזר רק אם העותקים נופלים באופן בלתי תלוי.</blockquote>`
      }
    },
    {
      h: { en: "N+1, N+2 and capacity under failure", he: "N+1, N+2 וקיבולת בזמן כשל" },
      body: {
        en: `<p>If you need <strong>N</strong> instances to handle peak load, run <strong>N+1</strong> so one can die (or be deploying) without overload. Critical systems run N+2: one down for maintenance <em>and</em> one unexpected failure.</p>
<p>The trap is forgetting that redundancy must survive a whole <em>failure domain</em>. Example: peak needs 6 pods. You run 6 pods across 3 AZs (2 each). One AZ dies → 4 pods left → 150% load on survivors → they slow down, time out, and cascade. To survive an AZ loss you need 9 pods (3 per AZ), i.e. each AZ must be able to absorb its share: <code>needed / (AZs − 1) × AZs</code>.</p>
<table><tr><th>AZs</th><th>Overprovision to survive 1 AZ loss</th></tr>
<tr><td>2</td><td>+100% (each AZ carries everything)</td></tr>
<tr><td>3</td><td>+50%</td></tr>
<tr><td>4</td><td>+33%</td></tr></table>
<p>That's why 3 AZs is the sweet spot for most production workloads.</p>`,
        he: `<p>אם אתה צריך <strong>N</strong> instances כדי לעמוד בעומס השיא, תריץ <strong>N+1</strong> כדי שאחד יוכל למות (או להיות באמצע deploy) בלי עומס יתר. מערכות קריטיות רצות עם N+2: אחד בתחזוקה <em>וגם</em> כשל אחד לא צפוי.</p>
<p>המלכודת היא לשכוח שה-redundancy צריך לשרוד <em>failure domain</em> שלם. דוגמה: בשיא צריך 6 pods. אתה מריץ 6 pods על 3 AZs (2 בכל אחד). AZ אחד נופל → נשארו 4 pods → 150% עומס על השורדים → הם מאטים, נכנסים ל-timeouts, ומתחיל cascade. כדי לשרוד נפילת AZ צריך 9 pods (3 בכל AZ), כלומר כל AZ צריך לספוג את החלק שלו: <code>needed / (AZs − 1) × AZs</code>.</p>
<table><tr><th>AZs</th><th>כמה over-provisioning כדי לשרוד נפילת AZ</th></tr>
<tr><td>2</td><td>+100% (כל AZ נושא הכול)</td></tr>
<tr><td>3</td><td>+50%</td></tr>
<tr><td>4</td><td>+33%</td></tr></table>
<p>בגלל זה 3 AZs זה ה-sweet spot לרוב ה-workloads בפרודקשן.</p>`
      }
    },
    {
      h: { en: "Active-active vs active-passive", he: "Active-active מול active-passive" },
      body: {
        en: `<table><tr><th></th><th>Active-active</th><th>Active-passive</th></tr>
<tr><td>Traffic</td><td>All nodes serve</td><td>Only primary serves; standby waits</td></tr>
<tr><td>Failover time</td><td>~0 (LB just stops sending)</td><td>Seconds to minutes (detect + promote)</td></tr>
<tr><td>Cost efficiency</td><td>High — nothing idle</td><td>Standby is paid-for idle capacity</td></tr>
<tr><td>Complexity</td><td>Needs stateless or multi-writer data</td><td>Simpler for stateful systems (DBs)</td></tr>
<tr><td>Hidden risk</td><td>Capacity: survivors must absorb load</td><td>Standby rots: never tested, fails on promote</td></tr></table>
<p>Typical pattern: active-active for the stateless web/app tier behind a load balancer, active-passive for the database (primary + synchronous standby in another AZ, e.g. RDS Multi-AZ fails over in ~60-120 seconds).</p>
<blockquote>⚠️ Production tip: An active-passive standby that has never taken real traffic is a hope, not a plan. Fail over on purpose regularly (e.g., quarterly) so the switch is a boring, practiced move.</blockquote>`,
        he: `<table><tr><th></th><th>Active-active</th><th>Active-passive</th></tr>
<tr><td>טראפיק</td><td>כל ה-nodes מגישים</td><td>רק ה-primary מגיש; ה-standby מחכה</td></tr>
<tr><td>זמן failover</td><td>~0 (ה-LB פשוט מפסיק לשלוח)</td><td>שניות עד דקות (זיהוי + promote)</td></tr>
<tr><td>יעילות עלות</td><td>גבוהה — שום דבר לא מובטל</td><td>ה-standby זו קיבולת שמשלמים עליה ויושבת</td></tr>
<tr><td>מורכבות</td><td>דורש stateless או data עם multi-writer</td><td>פשוט יותר למערכות stateful (DBs)</td></tr>
<tr><td>סיכון חבוי</td><td>קיבולת: השורדים חייבים לספוג את העומס</td><td>ה-standby מרקיב: לא נבדק אף פעם, נופל ב-promote</td></tr></table>
<p>דפוס טיפוסי: active-active לשכבת ה-web/app ה-stateless מאחורי Load Balancer, ו-active-passive ל-DB (primary + standby סינכרוני ב-AZ אחר, למשל RDS Multi-AZ עושה failover תוך ~60-120 שניות).</p>
<blockquote>⚠️ טיפ לפרודקשן: standby ב-active-passive שאף פעם לא קיבל טראפיק אמיתי זו תקווה, לא תוכנית. תעשה failover בכוונה באופן קבוע (נגיד כל רבעון) כדי שהמעבר יהיה מהלך משעמם ומתורגל.</blockquote>`
      }
    },
    {
      h: { en: "AZ failures vs region failures", he: "נפילת AZ מול נפילת region" },
      body: {
        en: `<p>An <strong>Availability Zone</strong> is one or more data centers with independent power, cooling and network, a few km to tens of km from its siblings, with &lt; 2 ms latency between them. A <strong>region</strong> is a group of AZs in a metro area, hundreds of km from other regions.</p>
<ul><li><strong>Multi-AZ</strong> protects against: power/cooling failure, a fire, a fiber cut, a bad rack. It's cheap (low latency allows synchronous replication) and should be the default for production.</li>
<li><strong>Multi-region</strong> protects against: regional control-plane outages, natural disasters, a bad regional deploy by the cloud provider. It's expensive: 50-100 ms cross-region latency forces async replication (non-zero RPO), duplicate infra, and data residency questions.</li></ul>
<p>Rule of thumb: multi-AZ gets you to ~99.95-99.99% for the infrastructure layer; going multi-region is a business decision usually justified only for 99.99%+ targets or regulatory DR requirements.</p>`,
        he: `<p><strong>Availability Zone</strong> הוא data center אחד או יותר עם חשמל, קירור ורשת עצמאיים, במרחק של כמה עד עשרות ק"מ מהאחים שלו, עם latency מתחת ל-2ms ביניהם. <strong>Region</strong> הוא קבוצה של AZs באזור מטרופוליני אחד, מאות ק"מ מ-regions אחרים.</p>
<ul><li><strong>Multi-AZ</strong> מגן מפני: כשל חשמל/קירור, שריפה, חיתוך סיב, rack דפוק. זה זול (ה-latency הנמוך מאפשר replication סינכרוני) וזה צריך להיות הדיפולט בפרודקשן.</li>
<li><strong>Multi-region</strong> מגן מפני: השבתות של ה-control plane האזורי, אסונות טבע, deploy גרוע של ספק הענן ב-region. זה יקר: latency של 50-100ms בין regions מכריח replication אסינכרוני (RPO שאינו אפס), תשתית כפולה, ושאלות של data residency.</li></ul>
<p>כלל אצבע: multi-AZ מביא אותך ל-~99.95-99.99% בשכבת התשתית; מעבר ל-multi-region הוא החלטה עסקית, שבדרך כלל מוצדקת רק ליעדים של 99.99%+ או לדרישות DR רגולטוריות.</p>`
      }
    },
    {
      h: { en: "Health checks, failover, and stateless vs stateful", he: "Health checks, failover, ו-stateless מול stateful" },
      body: {
        en: `<p>Redundancy is useless if traffic keeps going to the dead copy. <strong>Health checks</strong> make it automatic:</p>
<ul><li><strong>Liveness</strong>: "is the process alive?" → restart if not.</li>
<li><strong>Readiness</strong>: "can it serve traffic now?" (DB connected, warm cache) → remove from LB if not.</li>
<li>Typical LB settings: check every 10 s, mark unhealthy after 2-3 failures, healthy after 2-5 successes. Detection ≈ interval × threshold, so ~20-30 s.</li></ul>
<p><strong>Stateless</strong> services are easy: any replica can serve any request, so HA = more replicas + LB. Push state out to a DB/cache/object store. <strong>Stateful</strong> systems (databases, queues, ZooKeeper/etcd) need replication, leader election and quorum — with 3 nodes you tolerate 1 failure, with 5 you tolerate 2 (majority must survive). That's also how you avoid <em>split brain</em>: two nodes both thinking they're primary and accepting conflicting writes.</p>
<blockquote>⚠️ Production tip: Don't make readiness checks call your downstream dependencies deeply. If the DB blips, every replica fails readiness at once and the LB has zero backends — you turned a partial outage into a total one.</blockquote>`,
        he: `<p>Redundancy לא שווה כלום אם הטראפיק ממשיך ללכת לעותק המת. <strong>Health checks</strong> הופכים את זה לאוטומטי:</p>
<ul><li><strong>Liveness</strong>: "התהליך חי?" → restart אם לא.</li>
<li><strong>Readiness</strong>: "הוא יכול להגיש טראפיק עכשיו?" (מחובר ל-DB, cache חם) → מוציאים מה-LB אם לא.</li>
<li>הגדרות LB טיפוסיות: בדיקה כל 10 שניות, unhealthy אחרי 2-3 כשלונות, healthy אחרי 2-5 הצלחות. זמן זיהוי ≈ interval × threshold, כלומר ~20-30 שניות.</li></ul>
<p>שירותי <strong>stateless</strong> קלים: כל replica יכול להגיש כל בקשה, אז HA = עוד replicas + LB. תוציא את ה-state החוצה ל-DB/cache/object store. מערכות <strong>stateful</strong> (DBs, queues, ZooKeeper/etcd) צריכות replication, leader election ו-quorum — עם 3 nodes אתה שורד כשל אחד, עם 5 אתה שורד שניים (רוב חייב לשרוד). ככה גם נמנעים מ-<em>split brain</em>: שני nodes שכל אחד חושב שהוא ה-primary ומקבל כתיבות סותרות.</p>
<blockquote>⚠️ טיפ לפרודקשן: אל תגרום ל-readiness checks לקרוא לעומק לתלויות downstream. אם ה-DB מגמגם, כל ה-replicas נכשלים ב-readiness בבת אחת וה-LB נשאר עם אפס backends — הפכת השבתה חלקית להשבתה מלאה.</blockquote>`
      }
    }
  ],
  diagram: `             Route53 / DNS (health-checked)
                        |
                 Load Balancer (multi-AZ)
          /             |              \\
     AZ-a             AZ-b             AZ-c
   [app][app]       [app][app]       [app][app]     <- stateless, active-active
        \\              |               /
     [DB primary] ==sync==> [DB standby]           <- stateful, active-passive
        AZ-a                    AZ-b`,
  handsOn: [
    {
      cmd: "kubectl get pods -o wide -l app=web",
      what: { en: "Check which nodes (and therefore AZs) your replicas landed on — all on one node is a hidden SPOF.", he: "תבדוק על אילו nodes (ולכן AZs) נחתו ה-replicas שלך — כולם על node אחד זה SPOF חבוי." }
    },
    {
      cmd: "kubectl get nodes -L topology.kubernetes.io/zone",
      what: { en: "Show the zone label of each node; use it with topologySpreadConstraints to spread pods across AZs.", he: "הצג את ה-zone label של כל node; משתמשים בו עם topologySpreadConstraints כדי לפזר pods על פני AZs." }
    },
    {
      cmd: "aws rds reboot-db-instance --db-instance-identifier mydb --force-failover",
      what: { en: "Force a Multi-AZ RDS failover in staging to measure real failover time and see if your app reconnects.", he: "תכריח failover של RDS Multi-AZ ב-staging כדי למדוד זמן failover אמיתי ולראות אם האפליקציה מתחברת מחדש." }
    },
    {
      cmd: "curl -s -o /dev/null -w '%{http_code} %{time_total}\\n' http://localhost:8080/healthz",
      what: { en: "Hit a health endpoint and check status code and latency — it should be fast and cheap.", he: "תפנה ל-health endpoint ותבדוק status code ו-latency — הוא צריך להיות מהיר וזול." }
    }
  ],
  mnemonic: {
    en: "\"Two is one, one is none\" — and two in the same AZ is still one.",
    he: "\"שניים זה אחד, אחד זה אף אחד\" — ושניים באותו AZ זה עדיין אחד."
  },
  pitfalls: [
    { en: "Redundant copies sharing a failure domain (same node, same AZ, same config push). They die together.", he: "עותקים מיותרים שחולקים failure domain (אותו node, אותו AZ, אותו config push). הם מתים ביחד." },
    { en: "Not provisioning for failure: 3 AZs at 90% utilization each can't absorb the loss of one AZ.", he: "לא לתכנן קיבולת לכשל: 3 AZs ב-90% ניצול כל אחד לא יכולים לספוג נפילה של AZ אחד." },
    { en: "Deep health checks that check dependencies, causing all replicas to go unready at once.", he: "Health checks עמוקים שבודקים תלויות, וגורמים לכל ה-replicas להפוך ל-unready בבת אחת." },
    { en: "An untested passive standby: replication broken for weeks, discovered only during the real failover.", he: "Standby פסיבי שלא נבדק: ה-replication שבור כבר שבועות, ומגלים את זה רק ב-failover האמיתי." }
  ],
  interview: [
    {
      q: { en: "How would you make a typical web app + Postgres highly available on a cloud provider?", he: "איך היית הופך אפליקציית web + Postgres טיפוסית ל-highly available בענן?" },
      a: { en: "Stateless app replicas across 3 AZs behind a multi-AZ load balancer with readiness checks, sized to survive an AZ loss. Sessions in Redis with replication (or signed tokens). Postgres as managed Multi-AZ with a synchronous standby and automatic failover; app uses the DNS endpoint and retries on reconnect. Remove SPOFs like single NAT gateways, and regularly test failover.", he: "Replicas stateless של האפליקציה על 3 AZs מאחורי Load Balancer multi-AZ עם readiness checks, עם קיבולת שתשרוד נפילת AZ. Sessions ב-Redis עם replication (או signed tokens). Postgres מנוהל ב-Multi-AZ עם standby סינכרוני ו-failover אוטומטי; האפליקציה משתמשת ב-DNS endpoint ועושה retry ב-reconnect. מסירים SPOFs כמו NAT gateway יחיד, ובודקים failover באופן קבוע." }
    },
    {
      q: { en: "Why do consensus clusters use 3 or 5 nodes rather than 2 or 4?", he: "למה clusters של consensus משתמשים ב-3 או 5 nodes ולא ב-2 או 4?" },
      a: { en: "They need a majority (quorum) to make progress and avoid split brain. 3 nodes tolerate 1 failure, 4 nodes still tolerate only 1 (majority of 4 is 3), and 5 tolerate 2. Even numbers add cost without adding fault tolerance.", he: "הם צריכים רוב (quorum) כדי להתקדם ולהימנע מ-split brain. 3 nodes שורדים כשל אחד, 4 nodes עדיין שורדים רק אחד (רוב של 4 זה 3), ו-5 שורדים שניים. מספר זוגי מוסיף עלות בלי להוסיף עמידות." }
    }
  ],
  quiz: [
    {
      q: { en: "Peak load needs 6 instances. You run in 3 AZs. How many instances do you need to survive losing a whole AZ at peak?", he: "בעומס שיא צריך 6 instances. אתה רץ על 3 AZs. כמה instances צריך כדי לשרוד נפילה של AZ שלם בזמן שיא?" },
      options: [
        { en: "6", he: "6" },
        { en: "7", he: "7" },
        { en: "9", he: "9" },
        { en: "12", he: "12" }
      ],
      answer: 2,
      explain: { en: "After losing 1 of 3 AZs, the remaining 2 must carry 6 → 3 per AZ → 9 total. 7 (N+1) survives one instance, not one AZ.", he: "אחרי נפילה של 1 מתוך 3 AZs, ה-2 שנשארו צריכים לשאת 6 → 3 בכל AZ → 9 בסך הכול. 7 (N+1) שורד instance אחד, לא AZ." }
    },
    {
      q: { en: "What is the main hidden risk of active-passive setups?", he: "מה הסיכון החבוי העיקרי ב-active-passive?" },
      options: [
        { en: "Higher latency for every request", he: "Latency גבוה יותר לכל בקשה" },
        { en: "The passive node is rarely exercised, so it may fail exactly when you promote it", he: "ה-node הפסיבי כמעט לא מופעל, אז הוא עלול להיכשל בדיוק כשעושים לו promote" },
        { en: "Split brain is impossible to prevent", he: "אי אפשר למנוע split brain" },
        { en: "It can't work across AZs", he: "זה לא עובד על פני AZs" }
      ],
      answer: 1,
      explain: { en: "Untested standbys rot: broken replication, missing config, stale certs. Regular planned failovers are the cure.", he: "Standbys שלא נבדקים מרקיבים: replication שבור, config חסר, תעודות ישנות. התרופה היא failovers מתוכננים באופן קבוע." }
    },
    {
      q: { en: "Your readiness probe queries the database. The DB has a 20-second blip. What happens?", he: "ה-readiness probe שלך מתשאל את ה-DB. ל-DB יש גמגום של 20 שניות. מה קורה?" },
      options: [
        { en: "Nothing, readiness only affects startup", he: "כלום, readiness משפיע רק על עלייה" },
        { en: "Pods get restarted", he: "ה-pods עוברים restart" },
        { en: "All pods become unready simultaneously and the service has zero endpoints", he: "כל ה-pods הופכים ל-unready בו זמנית ולשירות יש אפס endpoints" },
        { en: "Traffic shifts to another region automatically", he: "הטראפיק עובר אוטומטית ל-region אחר" }
      ],
      answer: 2,
      explain: { en: "Readiness failure removes pods from the endpoints (it doesn't restart them — that's liveness). A shared dependency failing makes every replica unready at once, turning a partial outage into a total one.", he: "כשל ב-readiness מוציא pods מה-endpoints (לא עושה להם restart — זה liveness). תלות משותפת שנופלת הופכת את כל ה-replicas ל-unready בבת אחת, והשבתה חלקית הופכת למלאה." }
    },
    {
      q: { en: "Why is synchronous DB replication common across AZs but rare across regions?", he: "למה replication סינכרוני של DB נפוץ בין AZs אבל נדיר בין regions?" },
      options: [
        { en: "Cloud providers forbid cross-region sync replication", he: "ספקי ענן אוסרים replication סינכרוני בין regions" },
        { en: "Cross-region latency (50-100 ms) would be added to every write", he: "ה-latency בין regions (50-100ms) היה מתווסף לכל כתיבה" },
        { en: "Regions don't have databases", he: "ל-regions אין databases" },
        { en: "AZs share the same disk", he: "AZs חולקים את אותו דיסק" }
      ],
      answer: 1,
      explain: { en: "Sync replication waits for the remote ack on each commit. ~1-2 ms between AZs is fine; 50-100 ms between regions kills write latency, so cross-region is usually async.", he: "Replication סינכרוני מחכה ל-ack מהצד השני בכל commit. ~1-2ms בין AZs זה בסדר; 50-100ms בין regions הורג את ה-latency של הכתיבה, אז בין regions זה בדרך כלל אסינכרוני." }
    }
  ],
  related: ["cloud-regions-azs", "net-load-balancing", "db-replication", "rel-bcdr"]
});

INFRA.lessons.push({
  id: "rel-bcdr",
  track: "reliability",
  order: 4,
  icon: "🌪️",
  level: 2,
  minutes: 11,
  title: { en: "BCDR: RPO, RTO & DR Strategies", he: "BCDR: RPO, RTO ואסטרטגיות DR" },
  tldr: {
    en: "RPO = how much data you can afford to lose, RTO = how long you can afford to be down; pick a DR strategy (backup → pilot light → warm standby → active-active) whose cost matches those numbers, and prove it with drills.",
    he: "RPO = כמה דאטה מותר לך לאבד, RTO = כמה זמן מותר לך להיות למטה; בוחרים אסטרטגיית DR (backup → pilot light → warm standby → active-active) שהעלות שלה מתאימה למספרים האלה, ומוכיחים אותה בתרגילים."
  },
  analogy: {
    en: "Writing a thesis. RPO is 'when did I last hit save?' — if your laptop dies, everything after that save is gone. RTO is 'how long until I'm typing again?' — borrow a laptop, download from Dropbox, reinstall Word. A USB stick in a drawer is backup & restore; a second laptop already synced and open on the desk is warm standby; two people co-editing in Google Docs is active-active.",
    he: "כתיבת תזה. RPO זה 'מתי בפעם האחרונה לחצתי save?' — אם הלפטופ מת, כל מה שאחרי ה-save הלך. RTO זה 'תוך כמה זמן אני חוזר להקליד?' — לשאול לפטופ, להוריד מ-Dropbox, להתקין Word מחדש. דיסק-און-קי במגירה זה backup & restore; לפטופ שני כבר מסונכרן ופתוח על השולחן זה warm standby; שני אנשים שעורכים ביחד ב-Google Docs זה active-active."
  },
  sections: [
    {
      h: { en: "BC vs DR: the business and the tech", he: "BC מול DR: הביזנס והטכנולוגיה" },
      body: {
        en: `<p><strong>Business Continuity (BC)</strong> is the broad plan to keep the <em>business</em> running during a disruption: who decides, how customers are told, manual workarounds, alternate offices, supplier contracts. <strong>Disaster Recovery (DR)</strong> is the IT subset: how you restore systems and data after a disaster (region loss, data corruption, ransomware, "someone ran <code>DROP TABLE</code> in prod").</p>
<p>The process starts with a <strong>Business Impact Analysis (BIA)</strong>: for each system, what does an hour of downtime cost, and what does losing an hour of data cost? Classify into tiers:</p>
<table><tr><th>Tier</th><th>Example</th><th>RTO</th><th>RPO</th></tr>
<tr><td>0 – mission critical</td><td>Payments, login</td><td>&lt; 15 min</td><td>~0-1 min</td></tr>
<tr><td>1 – business critical</td><td>Order management</td><td>&lt; 1-4 h</td><td>&lt; 15 min</td></tr>
<tr><td>2 – important</td><td>Internal reporting</td><td>&lt; 24 h</td><td>&lt; 24 h</td></tr>
<tr><td>3 – deferrable</td><td>Archive, wiki</td><td>days</td><td>24 h+</td></tr></table>`,
        he: `<p><strong>Business Continuity (BC)</strong> היא התוכנית הרחבה להמשיך להפעיל את ה<em>ביזנס</em> בזמן שיבוש: מי מחליט, איך מעדכנים לקוחות, עקיפות ידניות, משרדים חלופיים, חוזים עם ספקים. <strong>Disaster Recovery (DR)</strong> היא תת-הקבוצה של ה-IT: איך משחזרים מערכות ודאטה אחרי אסון (נפילת region, השחתת דאטה, ransomware, "מישהו הריץ <code>DROP TABLE</code> בפרודקשן").</p>
<p>התהליך מתחיל ב-<strong>Business Impact Analysis (BIA)</strong>: לכל מערכת, כמה עולה שעת השבתה, וכמה עולה לאבד שעה של דאטה? מסווגים ל-tiers:</p>
<table><tr><th>Tier</th><th>דוגמה</th><th>RTO</th><th>RPO</th></tr>
<tr><td>0 – mission critical</td><td>תשלומים, login</td><td>&lt; 15 דקות</td><td>~0-1 דקה</td></tr>
<tr><td>1 – business critical</td><td>ניהול הזמנות</td><td>&lt; 1-4 שעות</td><td>&lt; 15 דקות</td></tr>
<tr><td>2 – חשוב</td><td>דוחות פנימיים</td><td>&lt; 24 שעות</td><td>&lt; 24 שעות</td></tr>
<tr><td>3 – יכול לחכות</td><td>ארכיון, wiki</td><td>ימים</td><td>24 שעות+</td></tr></table>`
      }
    },
    {
      h: { en: "RPO vs RTO on a timeline", he: "RPO מול RTO על ציר הזמן" },
      body: {
        en: `<pre>  last good backup        DISASTER                     service restored
        |                     |                                |
  ------o=====================X================================o------&gt; time
        |&lt;------- RPO -------&gt;|&lt;------------- RTO -------------&gt;|
          data lost (looks back)    downtime (looks forward)</pre>
<p><strong>RPO (Recovery Point Objective)</strong> looks <em>backwards</em>: the max age of data you can lose. Nightly backups = up to 24 h RPO. Async replication with 5 s lag = ~5 s RPO. Synchronous replication = ~0.</p>
<p><strong>RTO (Recovery Time Objective)</strong> looks <em>forwards</em>: max time from disaster to service restored. It includes detection, the decision to fail over (often the slowest part — someone has to dare press the button), provisioning, restoring data, DNS propagation and verification.</p>
<blockquote>💡 Real world: Restoring a 2 TB database from snapshot isn't instant. Cloud snapshot restores lazy-load blocks from object storage, so the DB may be "up" in 15 minutes but painfully slow for hours. Measure your real restore time; don't guess.</blockquote>`,
        he: `<pre>  last good backup        DISASTER                     service restored
        |                     |                                |
  ------o=====================X================================o------&gt; time
        |&lt;------- RPO -------&gt;|&lt;------------- RTO -------------&gt;|
          data lost (looks back)    downtime (looks forward)</pre>
<p><strong>RPO (Recovery Point Objective)</strong> מסתכל <em>אחורה</em>: הגיל המקסימלי של דאטה שמותר לאבד. גיבוי לילי = עד 24 שעות RPO. Replication אסינכרוני עם lag של 5 שניות = RPO של ~5 שניות. Replication סינכרוני = ~0.</p>
<p><strong>RTO (Recovery Time Objective)</strong> מסתכל <em>קדימה</em>: הזמן המקסימלי מהאסון ועד שהשירות חזר. זה כולל זיהוי, ההחלטה לעשות failover (לרוב החלק הכי איטי — מישהו צריך להעז ללחוץ על הכפתור), provisioning, שחזור דאטה, התפשטות DNS ווידוא.</p>
<blockquote>💡 מהשטח: לשחזר DB של 2TB מ-snapshot זה לא מיידי. שחזור snapshot בענן טוען blocks בעצלות מה-object storage, אז ה-DB יכול להיות "למעלה" אחרי 15 דקות אבל איטי בטירוף במשך שעות. תמדוד את זמן השחזור האמיתי שלך; אל תנחש.</blockquote>`
      }
    },
    {
      h: { en: "The DR strategy ladder", he: "סולם אסטרטגיות ה-DR" },
      body: {
        en: `<table><tr><th>Strategy</th><th>What runs in the DR region</th><th>RPO</th><th>RTO</th><th>Cost</th></tr>
<tr><td>Backup &amp; restore</td><td>Nothing; just backups copied there</td><td>Hours (last backup)</td><td>Hours to a day+</td><td>$</td></tr>
<tr><td>Pilot light</td><td>Data replicated live; core infra defined but scaled to zero/off</td><td>Seconds-minutes</td><td>Tens of minutes</td><td>$$</td></tr>
<tr><td>Warm standby</td><td>Full stack running at reduced size</td><td>Seconds</td><td>Minutes (scale up + switch)</td><td>$$$</td></tr>
<tr><td>Multi-site active-active</td><td>Full stack serving live traffic</td><td>~0 (or seconds)</td><td>~0 to seconds</td><td>$$$$</td></tr></table>
<p><strong>Pilot light</strong>: like the small flame in a gas heater — the database replica is running and in sync, everything else (app servers, LBs) exists as Terraform and AMIs ready to launch. <strong>Warm standby</strong>: everything is running, but at say 10-20% capacity; on failover you scale up and shift DNS. <strong>Active-active</strong>: both regions take traffic all the time; the hardest part is data — multi-region writes need conflict handling or partitioning by user.</p>
<p>Each step up the ladder roughly halves your RTO and doubles your bill. Match the strategy to the tier — not everything deserves active-active.</p>`,
        he: `<table><tr><th>אסטרטגיה</th><th>מה רץ ב-region של ה-DR</th><th>RPO</th><th>RTO</th><th>עלות</th></tr>
<tr><td>Backup &amp; restore</td><td>כלום; רק גיבויים שהועתקו לשם</td><td>שעות (הגיבוי האחרון)</td><td>שעות עד יום+</td><td>$</td></tr>
<tr><td>Pilot light</td><td>הדאטה משוכפל live; תשתית הליבה מוגדרת אבל ב-scale אפס/כבויה</td><td>שניות-דקות</td><td>עשרות דקות</td><td>$$</td></tr>
<tr><td>Warm standby</td><td>כל ה-stack רץ בגודל מוקטן</td><td>שניות</td><td>דקות (scale up + מעבר)</td><td>$$$</td></tr>
<tr><td>Multi-site active-active</td><td>כל ה-stack מגיש טראפיק חי</td><td>~0 (או שניות)</td><td>~0 עד שניות</td><td>$$$$</td></tr></table>
<p><strong>Pilot light</strong>: כמו הלהבה הקטנה בדוד גז — ה-replica של ה-DB רצה ומסונכרנת, וכל השאר (שרתי אפליקציה, LBs) קיים כ-Terraform ו-AMIs מוכנים לעלייה. <strong>Warm standby</strong>: הכול רץ, אבל בנגיד 10-20% קיבולת; ב-failover עושים scale up ומעבירים DNS. <strong>Active-active</strong>: שני ה-regions מקבלים טראפיק כל הזמן; החלק הכי קשה הוא הדאטה — כתיבות multi-region צריכות טיפול בקונפליקטים או חלוקה לפי משתמש.</p>
<p>כל שלב בסולם בערך מוריד את ה-RTO בחצי ומכפיל את החשבון. תתאים את האסטרטגיה ל-tier — לא כל דבר מגיע לו active-active.</p>`
      }
    },
    {
      h: { en: "The dependencies people forget", he: "התלויות ששוכחים" },
      body: {
        en: `<p>Teams replicate the database perfectly, then discover during the drill that the DR region can't actually start. Checklist of the usual forgotten pieces:</p>
<ul><li><strong>DNS</strong>: is the TTL low enough (e.g., 60 s, not 86400)? Who has access to change it? Is the DNS provider itself in the failed region?</li>
<li><strong>IAM / identity</strong>: roles, SSO, break-glass accounts that work when your IdP is down.</li>
<li><strong>Secrets &amp; keys</strong>: Vault/Secrets Manager replicated? KMS keys are regional — backups encrypted with a key that only exists in the dead region are unreadable.</li>
<li><strong>Container images &amp; artifacts</strong>: is your registry replicated, or only in us-east-1?</li>
<li><strong>Quotas</strong>: the DR region's default vCPU limits may be too low to launch your fleet.</li>
<li><strong>Third parties</strong>: payment provider IP allow-lists, partner VPNs, certificates pinned to the old region's IPs.</li>
<li><strong>CI/CD and monitoring</strong>: if your deploy pipeline and dashboards lived in the failed region, you're flying blind.</li></ul>
<blockquote>⚠️ Production tip: Keep the runbook somewhere that survives the disaster — not only in the wiki hosted in the region that just burned down. A printed/PDF copy is not paranoid.</blockquote>`,
        he: `<p>צוותים משכפלים את ה-DB בצורה מושלמת, ואז מגלים בתרגיל שה-region של ה-DR בכלל לא מצליח לעלות. צ'קליסט של הדברים שבדרך כלל שוכחים:</p>
<ul><li><strong>DNS</strong>: ה-TTL מספיק נמוך (נגיד 60 שניות, לא 86400)? למי יש גישה לשנות? ספק ה-DNS עצמו נמצא ב-region שנפל?</li>
<li><strong>IAM / identity</strong>: roles, SSO, חשבונות break-glass שעובדים כשה-IdP שלך למטה.</li>
<li><strong>Secrets ומפתחות</strong>: ה-Vault/Secrets Manager משוכפל? מפתחות KMS הם אזוריים — גיבויים שהוצפנו עם מפתח שקיים רק ב-region המת לא ניתנים לקריאה.</li>
<li><strong>Container images וארטיפקטים</strong>: ה-registry משוכפל, או שהוא רק ב-us-east-1?</li>
<li><strong>Quotas</strong>: מגבלות ה-vCPU הדיפולטיות ב-region של ה-DR עלולות להיות נמוכות מדי בשביל להרים את הצי שלך.</li>
<li><strong>צד שלישי</strong>: IP allow-lists אצל ספק התשלומים, VPNs לשותפים, תעודות שקשורות ל-IPs של ה-region הישן.</li>
<li><strong>CI/CD ומוניטורינג</strong>: אם ה-deploy pipeline והדשבורדים חיו ב-region שנפל, אתה טס עיוור.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: תשמור את ה-runbook במקום ששורד את האסון — לא רק ב-wiki שמתארח ב-region שהרגע נשרף. עותק PDF/מודפס זו לא פרנויה.</blockquote>`
      }
    },
    {
      h: { en: "Drills, runbooks, ransomware and immutable backups", he: "תרגילים, runbooks, ransomware וגיבויים immutable" },
      body: {
        en: `<p><strong>A backup you haven't restored is a rumor.</strong> Run DR drills / game days: at least yearly for the full region failover, quarterly for restoring a DB from backup into a fresh environment. Time each step; the measured numbers are your <em>real</em> RTO/RPO. Write a <strong>runbook</strong>: who declares the disaster, exact commands, verification steps, and how to fail <em>back</em> afterwards (often forgotten and harder).</p>
<p><strong>Ransomware</strong> changes the threat model: the attacker has your admin credentials and will delete or encrypt backups first. Replication doesn't help — it faithfully replicates the encrypted data. Defenses:</p>
<ul><li><strong>Immutable backups</strong>: S3 Object Lock (compliance mode), Azure immutable blob storage, WORM tape — even root can't delete before retention ends.</li>
<li><strong>Logically air-gapped</strong> copy in a separate account with separate credentials.</li>
<li>The <strong>3-2-1 rule</strong> (3 copies, 2 media, 1 off-site), extended to 3-2-1-1-0: +1 immutable/offline, 0 errors on restore verification.</li>
<li>Long enough retention: attackers often sit quietly for weeks, so a 7-day retention may only contain already-compromised backups.</li></ul>`,
        he: `<p><strong>גיבוי שלא שחזרת ממנו הוא שמועה.</strong> תריץ תרגילי DR / game days: לפחות פעם בשנה failover מלא של region, וכל רבעון שחזור DB מגיבוי לסביבה חדשה. תתזמן כל שלב; המספרים שנמדדו הם ה-RTO/RPO <em>האמיתיים</em> שלך. תכתוב <strong>runbook</strong>: מי מכריז על אסון, פקודות מדויקות, שלבי וידוא, ואיך עושים fail <em>back</em> אחר כך (שבדרך כלל שוכחים, וזה קשה יותר).</p>
<p><strong>Ransomware</strong> משנה את מודל האיום: לתוקף יש את ה-credentials של האדמין והוא ימחק או יצפין קודם כל את הגיבויים. Replication לא עוזר — הוא משכפל בנאמנות את הדאטה המוצפן. הגנות:</p>
<ul><li><strong>גיבויים immutable</strong>: S3 Object Lock (compliance mode), Azure immutable blob storage, קלטות WORM — אפילו root לא יכול למחוק לפני שה-retention נגמר.</li>
<li>עותק <strong>מבודד לוגית (air-gapped)</strong> בחשבון נפרד עם credentials נפרדים.</li>
<li>חוק ה-<strong>3-2-1</strong> (3 עותקים, 2 סוגי מדיה, 1 off-site), ובגרסה המורחבת 3-2-1-1-0: +1 immutable/offline, 0 שגיאות בבדיקת שחזור.</li>
<li>Retention מספיק ארוך: תוקפים יושבים בשקט לפעמים שבועות, אז retention של 7 ימים עלול להכיל רק גיבויים שכבר נפרצו.</li></ul>`
      }
    }
  ],
  diagram: `  last backup         DISASTER                 back online
      |                    |                         |
 -----o====================X=========================o----> t
      |<------ RPO ------->|<--------- RTO --------->|
        (data you lose)        (time you're down)

 Ladder:  Backup&Restore -> Pilot Light -> Warm Standby -> Active-Active
 RTO:       hours+            10s of min      minutes        ~0
 Cost:        $                 $$              $$$          $$$$`,
  handsOn: [
    {
      cmd: "aws s3api put-object-lock-configuration --bucket my-backups --object-lock-configuration 'ObjectLockEnabled=Enabled,Rule={DefaultRetention={Mode=COMPLIANCE,Days=30}}'",
      what: { en: "Make backups immutable for 30 days with S3 Object Lock in compliance mode (bucket must be created with Object Lock enabled).", he: "הופך גיבויים ל-immutable ל-30 יום עם S3 Object Lock ב-compliance mode (ה-bucket חייב להיווצר עם Object Lock מופעל)." }
    },
    {
      cmd: "pg_dump -Fc mydb > mydb.dump && createdb restore_test && time pg_restore -d restore_test mydb.dump",
      what: { en: "Back up and actually restore a Postgres DB, timing the restore — that's a mini DR drill.", he: "גבה ושחזר בפועל DB של Postgres, עם מדידת זמן השחזור — זה מיני תרגיל DR." }
    },
    {
      cmd: "dig +noall +answer api.example.com",
      what: { en: "Check the TTL on your DNS record — a 1-day TTL means failover via DNS takes up to a day for some clients.", he: "תבדוק את ה-TTL של רשומת ה-DNS — TTL של יום אומר ש-failover דרך DNS ייקח עד יום אצל חלק מהלקוחות." }
    }
  ],
  mnemonic: {
    en: "RPO = Point = how far back (data). RTO = Time = how long forward (downtime). Ladder: \"Backups Prefer Warm Activities\" — Backup, Pilot light, Warm standby, Active-active.",
    he: "RPO = Point = כמה אחורה (דאטה). RTO = Time = כמה זמן קדימה (השבתה). הסולם: \"Backups Prefer Warm Activities\" — Backup, Pilot light, Warm standby, Active-active."
  },
  pitfalls: [
    { en: "Never testing restores. Backups silently failing for months (expired credentials, full disk) is extremely common.", he: "לא לבדוק שחזורים אף פעם. גיבויים שנכשלים בשקט במשך חודשים (credentials שפגו, דיסק מלא) זה דבר נפוץ מאוד." },
    { en: "Treating replication as backup. A DROP TABLE or ransomware encryption replicates to the replica in milliseconds.", he: "להתייחס ל-replication כאל גיבוי. DROP TABLE או הצפנה של ransomware משתכפלים ל-replica תוך מילישניות." },
    { en: "Forgetting regional dependencies: KMS keys, container registry, secrets, IAM, DNS, service quotas in the DR region.", he: "לשכוח תלויות אזוריות: מפתחות KMS, container registry, secrets, IAM, DNS, quotas ב-region של ה-DR." },
    { en: "No fail-back plan. After a failover you're running single-region in the DR site, often with reduced capacity — returning is a second migration.", he: "אין תוכנית fail-back. אחרי failover אתה רץ על region יחיד באתר ה-DR, לרוב עם קיבולת מוקטנת — החזרה היא מיגרציה שנייה." }
  ],
  interview: [
    {
      q: { en: "Explain RPO and RTO with an example, and how each one is reduced.", he: "תסביר RPO ו-RTO עם דוגמה, ואיך מקטינים כל אחד." },
      a: { en: "If backups run nightly at 02:00 and the DB is destroyed at 17:00, you lose 15 hours of data (RPO) and, if restore + verification takes 4 hours, RTO is 4 hours. RPO is reduced with more frequent backups, continuous WAL/binlog archiving (point-in-time recovery) or replication. RTO is reduced with pre-provisioned infra (pilot light, warm standby), automation, rehearsed runbooks and low DNS TTLs.", he: "אם גיבויים רצים כל לילה ב-02:00 וה-DB נהרס ב-17:00, מאבדים 15 שעות דאטה (RPO), ואם שחזור + וידוא לוקחים 4 שעות, ה-RTO הוא 4 שעות. RPO מקטינים עם גיבויים תכופים יותר, ארכוב רציף של WAL/binlog (point-in-time recovery) או replication. RTO מקטינים עם תשתית מוכנה מראש (pilot light, warm standby), אוטומציה, runbooks מתורגלים ו-TTL נמוך ב-DNS." }
    },
    {
      q: { en: "How do you protect backups against ransomware?", he: "איך מגינים על גיבויים מפני ransomware?" },
      a: { en: "Assume the attacker has admin access. Use immutable storage (S3 Object Lock compliance mode / WORM), store a copy in a separate account with separate credentials and MFA (logical air gap), keep retention long enough to predate a dormant intrusion, and regularly test restores. Replication alone is not protection.", he: "להניח שלתוקף יש גישת אדמין. להשתמש באחסון immutable (S3 Object Lock ב-compliance mode / WORM), לשמור עותק בחשבון נפרד עם credentials ו-MFA נפרדים (air gap לוגי), להחזיק retention מספיק ארוך כדי שיקדים חדירה רדומה, ולבדוק שחזורים באופן קבוע. Replication לבד הוא לא הגנה." }
    },
    {
      q: { en: "When would you choose pilot light over warm standby?", he: "מתי היית בוחר pilot light על פני warm standby?" },
      a: { en: "When the business accepts an RTO of tens of minutes to an hour but needs low RPO: keep data continuously replicated (cheap) while compute is off and defined in IaC. Warm standby costs more because compute runs 24/7, and is justified when RTO must be a few minutes.", he: "כשהביזנס מקבל RTO של עשרות דקות עד שעה אבל צריך RPO נמוך: הדאטה משוכפל ברציפות (זול) וה-compute כבוי ומוגדר ב-IaC. Warm standby עולה יותר כי ה-compute רץ 24/7, והוא מוצדק כשה-RTO חייב להיות כמה דקות." }
    }
  ],
  quiz: [
    {
      q: { en: "Backups run every 6 hours. Async replication to another region lags by ~10 seconds. A region is destroyed. What's your effective RPO (using the replica)?", he: "גיבויים רצים כל 6 שעות. Replication אסינכרוני ל-region אחר עם lag של ~10 שניות. ה-region נהרס. מה ה-RPO בפועל (עם ה-replica)?" },
      options: [
        { en: "~10 seconds", he: "~10 שניות" },
        { en: "6 hours", he: "6 שעות" },
        { en: "0", he: "0" },
        { en: "Equal to the RTO", he: "שווה ל-RTO" }
      ],
      answer: 0,
      explain: { en: "RPO is the data you lose: whatever hadn't replicated yet, ~10 s. Backups would matter for logical corruption, where the replica is also corrupted.", he: "RPO זה הדאטה שאתה מאבד: מה שעוד לא שוכפל, ~10 שניות. הגיבויים היו רלוונטיים להשחתה לוגית, שבה גם ה-replica מושחתת." }
    },
    {
      q: { en: "Which DR strategy keeps data replicated live but leaves application servers turned off until a disaster?", he: "איזו אסטרטגיית DR שומרת את הדאטה משוכפל live אבל משאירה את שרתי האפליקציה כבויים עד לאסון?" },
      options: [
        { en: "Backup & restore", he: "Backup & restore" },
        { en: "Pilot light", he: "Pilot light" },
        { en: "Warm standby", he: "Warm standby" },
        { en: "Active-active", he: "Active-active" }
      ],
      answer: 1,
      explain: { en: "Pilot light = the core (data) is 'lit', the rest is ready to ignite. Warm standby already runs a scaled-down full stack.", he: "Pilot light = הליבה (דאטה) 'דולקת', השאר מוכן להצתה. Warm standby כבר מריץ stack מלא בגודל מוקטן." }
    },
    {
      q: { en: "Why doesn't database replication protect against ransomware?", he: "למה replication של DB לא מגן מפני ransomware?" },
      options: [
        { en: "Replicas are always in the same AZ", he: "Replicas תמיד באותו AZ" },
        { en: "Ransomware can't reach replicas", he: "Ransomware לא מגיע ל-replicas" },
        { en: "Encrypted/deleted data is replicated faithfully to the replica", he: "דאטה מוצפן/נמחק משוכפל בנאמנות ל-replica" },
        { en: "Replication is too slow", he: "Replication איטי מדי" }
      ],
      answer: 2,
      explain: { en: "Replication copies every change, good or evil. You need point-in-time, immutable, isolated backups.", he: "Replication מעתיק כל שינוי, טוב או רע. צריך גיבויים point-in-time, immutable ומבודדים." }
    },
    {
      q: { en: "During a DR drill, the app in the DR region can't decrypt the restored database. Most likely cause?", he: "בתרגיל DR, האפליקציה ב-region של ה-DR לא מצליחה לפענח את ה-DB המשוחזר. הסיבה הכי סבירה?" },
      options: [
        { en: "DNS TTL too high", he: "TTL של DNS גבוה מדי" },
        { en: "The KMS key used for encryption exists only in the primary region", he: "מפתח ה-KMS ששימש להצפנה קיים רק ב-region הראשי" },
        { en: "The RTO was exceeded", he: "חרגו מה-RTO" },
        { en: "The load balancer health check failed", he: "ה-health check של ה-Load Balancer נכשל" }
      ],
      answer: 1,
      explain: { en: "KMS keys are regional. Use multi-region keys or re-encrypt copies with a key in the DR region — a classic forgotten dependency.", he: "מפתחות KMS הם אזוריים. צריך multi-region keys או להצפין מחדש את העותקים עם מפתח ב-region של ה-DR — תלות קלאסית ששוכחים." }
    }
  ],
  playground: "dr",
  related: ["db-backups", "db-replication", "cloud-regions-azs", "rel-ha"]
});

INFRA.lessons.push({
  id: "rel-incident-management",
  track: "reliability",
  order: 5,
  icon: "🚨",
  level: 2,
  minutes: 10,
  title: { en: "Incident Management & Postmortems", he: "ניהול אירועים ו-Postmortems" },
  tldr: {
    en: "When things break: declare early, assign an Incident Commander, mitigate first (rollback, failover) and find the root cause later, communicate on a clock, then write a blameless postmortem with real action items.",
    he: "כשמשהו נשבר: מכריזים מוקדם, ממנים Incident Commander, קודם mitigate (rollback, failover) ורק אחר כך מחפשים root cause, מתקשרים לפי שעון, ואז כותבים postmortem בלי האשמות עם action items אמיתיים."
  },
  analogy: {
    en: "A fire brigade. The commander on site doesn't hold a hose — they coordinate. Firefighters first put out the fire (mitigate) and only afterwards does the investigator figure out it was the toaster (root cause). Nobody fires the toaster's owner; they change building codes so toasters can't burn houses down again (blameless, systemic fixes).",
    he: "מכבי אש. המפקד בשטח לא מחזיק זרנוק — הוא מתאם. הכבאים קודם מכבים את השריפה (mitigate), ורק אחר כך החוקר מגלה שזה היה הטוסטר (root cause). אף אחד לא מפטר את בעל הטוסטר; משנים את תקנות הבנייה כדי שטוסטרים לא יוכלו לשרוף בתים שוב (blameless, תיקונים מערכתיים)."
  },
  sections: [
    {
      h: { en: "Severity levels: a shared language", he: "רמות חומרה: שפה משותפת" },
      body: {
        en: `<p>Severity decides who gets woken up and how loudly you communicate. Define it by <em>customer impact</em>, not by how scary the graph looks:</p>
<table><tr><th>Sev</th><th>Meaning</th><th>Example</th><th>Response</th></tr>
<tr><td>SEV1</td><td>Critical, broad customer impact</td><td>Checkout down for everyone; data loss; security breach</td><td>Page now, IC + war room, exec + status page updates every 30 min</td></tr>
<tr><td>SEV2</td><td>Major degradation or subset of users</td><td>EU users get 30% errors; search very slow</td><td>Page now, IC, status page</td></tr>
<tr><td>SEV3</td><td>Minor, workaround exists</td><td>Export to CSV broken</td><td>Business hours ticket</td></tr>
<tr><td>SEV4</td><td>Cosmetic / no customer impact</td><td>Internal dashboard typo</td><td>Backlog</td></tr></table>
<blockquote>💡 Real world: Declare early, downgrade later. Calling a SEV2 that turns out to be a SEV4 costs 15 minutes of a few people's time. Under-declaring a real SEV1 costs hours of disorganized firefighting and customer trust.</blockquote>`,
        he: `<p>ה-severity קובע את מי מעירים ובאיזו עוצמה מתקשרים. תגדיר אותו לפי <em>השפעה על לקוחות</em>, לא לפי כמה מפחיד הגרף נראה:</p>
<table><tr><th>Sev</th><th>משמעות</th><th>דוגמה</th><th>תגובה</th></tr>
<tr><td>SEV1</td><td>קריטי, השפעה רחבה על לקוחות</td><td>Checkout למטה לכולם; אובדן דאטה; פריצת אבטחה</td><td>Page מיידי, IC + war room, עדכוני הנהלה ו-status page כל 30 דקות</td></tr>
<tr><td>SEV2</td><td>פגיעה משמעותית או חלק מהמשתמשים</td><td>למשתמשים באירופה 30% שגיאות; החיפוש איטי מאוד</td><td>Page מיידי, IC, status page</td></tr>
<tr><td>SEV3</td><td>קטן, יש workaround</td><td>ייצוא ל-CSV שבור</td><td>טיקט בשעות העבודה</td></tr>
<tr><td>SEV4</td><td>קוסמטי / בלי השפעה על לקוחות</td><td>טעות כתיב בדשבורד פנימי</td><td>Backlog</td></tr></table>
<blockquote>💡 מהשטח: תכריז מוקדם, תוריד דרגה אחר כך. להכריז SEV2 שמתברר כ-SEV4 עולה רבע שעה של כמה אנשים. להכריז נמוך על SEV1 אמיתי עולה שעות של כיבוי שריפות לא מאורגן ואמון של לקוחות.</blockquote>`
      }
    },
    {
      h: { en: "Roles and the war room flow", he: "תפקידים ו-flow של ה-war room" },
      body: {
        en: `<ul><li><strong>Incident Commander (IC)</strong>: runs the incident, makes decisions, assigns tasks, keeps time. Does <em>not</em> debug. Can be anyone trained — not necessarily the most senior.</li>
<li><strong>Ops / subject-matter leads</strong>: the hands on keyboards — investigate and execute mitigations the IC approves.</li>
<li><strong>Communications lead</strong>: status page, customer support, execs. Shields responders from "any update??" pings.</li>
<li><strong>Scribe</strong>: timestamps every finding and action in the incident channel — gold for the postmortem.</li></ul>
<p>Flow: <strong>detect</strong> (alert/customer) → <strong>declare</strong> (sev, open #inc-1234 channel + bridge) → <strong>assess</strong> (what's the impact? what changed recently?) → <strong>mitigate</strong> → <strong>monitor</strong> (is it really recovered?) → <strong>resolve</strong> → <strong>postmortem</strong>. The IC runs short loops: "What do we know? What are we trying? Who's doing it? Next update in 15 minutes."</p>
<blockquote>⚠️ Production tip: The first question in every incident: "What changed?" Deploys, config pushes, feature flag flips, cert expiries, traffic spikes. Most incidents are caused by changes.</blockquote>`,
        he: `<ul><li><strong>Incident Commander (IC)</strong>: מנהל את האירוע, מקבל החלטות, מחלק משימות, שומר על הזמן. <em>לא</em> מדבג. יכול להיות כל מי שעבר הכשרה — לא בהכרח הכי בכיר.</li>
<li><strong>Ops / מובילים מקצועיים</strong>: הידיים על המקלדת — חוקרים ומבצעים את ה-mitigations שה-IC מאשר.</li>
<li><strong>Communications lead</strong>: status page, תמיכה, הנהלה. מגן על הצוות מפינגים של "יש עדכון??".</li>
<li><strong>Scribe</strong>: רושם עם timestamp כל ממצא וכל פעולה בערוץ האירוע — זהב בשביל ה-postmortem.</li></ul>
<p>ה-flow: <strong>detect</strong> (התראה/לקוח) → <strong>declare</strong> (sev, פותחים ערוץ #inc-1234 + bridge) → <strong>assess</strong> (מה ההשפעה? מה השתנה לאחרונה?) → <strong>mitigate</strong> → <strong>monitor</strong> (באמת התאושש?) → <strong>resolve</strong> → <strong>postmortem</strong>. ה-IC מריץ לולאות קצרות: "מה אנחנו יודעים? מה מנסים? מי עושה? עדכון הבא בעוד 15 דקות."</p>
<blockquote>⚠️ טיפ לפרודקשן: השאלה הראשונה בכל אירוע: "מה השתנה?" deploys, config pushes, הדלקת feature flag, תעודה שפגה, קפיצת טראפיק. רוב האירועים נגרמים משינויים.</blockquote>`
      }
    },
    {
      h: { en: "Mitigate first, fix later", he: "קודם mitigate, אחר כך fix" },
      body: {
        en: `<p>During an incident your job is to <strong>stop the bleeding</strong>, not to understand it. Root cause analysis while customers are down is a luxury. Standard mitigations, roughly in order of preference:</p>
<ol><li><strong>Roll back</strong> the last deploy or config change (even if you're "pretty sure it's not that").</li>
<li><strong>Turn off the feature flag</strong>.</li>
<li><strong>Fail over</strong> to another AZ/region/replica.</li>
<li><strong>Scale up / out</strong> to buy headroom.</li>
<li><strong>Shed load</strong>: rate-limit, disable non-critical features, serve stale cache.</li>
<li><strong>Restart</strong> (it's not elegant, but it works surprisingly often).</li></ol>
<p>Then keep the evidence: before restarting, grab a heap dump, logs, or <code>kubectl describe</code> output so the postmortem has data.</p>
<p><strong>Status page comms</strong>: post within ~10-15 minutes of declaring, even if you know little: "We're investigating elevated errors on checkout. Next update in 30 minutes." Acknowledge, give a next-update time, and keep that promise. Silence is what makes customers angry.</p>`,
        he: `<p>בזמן אירוע התפקיד שלך הוא <strong>לעצור את הדימום</strong>, לא להבין אותו. ניתוח root cause כשהלקוחות למטה זה מותרות. Mitigations סטנדרטיים, בערך לפי סדר עדיפות:</p>
<ol><li><strong>Rollback</strong> ל-deploy או לשינוי ה-config האחרון (גם אם אתה "די בטוח שזה לא זה").</li>
<li><strong>לכבות את ה-feature flag</strong>.</li>
<li><strong>Failover</strong> ל-AZ/region/replica אחר.</li>
<li><strong>Scale up / out</strong> כדי לקנות headroom.</li>
<li><strong>Load shedding</strong>: rate-limit, לכבות פיצ'רים לא קריטיים, להגיש cache ישן.</li>
<li><strong>Restart</strong> (לא אלגנטי, אבל עובד בתדירות מפתיעה).</li></ol>
<p>ותשמור ראיות: לפני restart, תשלוף heap dump, לוגים או פלט של <code>kubectl describe</code> כדי שלפוסטמורטם יהיה דאטה.</p>
<p><strong>תקשורת ב-status page</strong>: לפרסם תוך ~10-15 דקות מההכרזה, גם אם יודעים מעט: "We're investigating elevated errors on checkout. Next update in 30 minutes." להכיר בבעיה, לתת זמן לעדכון הבא, ולעמוד בהבטחה. השתיקה היא מה שמעצבן לקוחות.</p>`
      }
    },
    {
      h: { en: "Blameless postmortems", he: "Postmortems בלי האשמות (blameless)" },
      body: {
        en: `<p>"Blameless" doesn't mean "no accountability" — it means assuming people acted reasonably given the information and tools they had. If one engineer could delete prod with a typo, the bug is the system that allowed it. Blame makes people hide information, and hidden information repeats incidents.</p>
<p>Template:</p>
<ul><li><strong>Summary</strong>: 2-3 sentences.</li>
<li><strong>Impact</strong>: duration, % users affected, failed requests, revenue, error budget consumed.</li>
<li><strong>Timeline</strong> (UTC): first trigger, detection, declaration, mitigation, resolution.</li>
<li><strong>Root cause &amp; contributing factors</strong>: usually several — the bug, the missing test, the alert that didn't fire, the runbook that was outdated.</li>
<li><strong>5 whys</strong>: keep asking "why" to go from the trigger to systemic causes.</li>
<li><strong>What went well / what went poorly / where we got lucky</strong>.</li>
<li><strong>Action items</strong>: each with owner, priority and due date, tracked in the real backlog. Prefer "prevent/detect automatically" over "be more careful".</li></ul>
<blockquote>💡 Real world: 5 whys example — Checkout down. Why? DB connections exhausted. Why? New code opened a connection per request. Why? The pool config wasn't applied in the new service. Why? Service template has no default pool. Why? No standard library for DB access. → Action: shared DB client with pooling + a load test in CI.</blockquote>`,
        he: `<p>"Blameless" לא אומר "בלי אחריות" — זה אומר להניח שאנשים פעלו באופן סביר לפי המידע והכלים שהיו להם. אם מהנדס אחד יכול למחוק את הפרודקשן עם טעות הקלדה, הבאג הוא במערכת שאפשרה את זה. האשמות גורמות לאנשים להסתיר מידע, ומידע מוסתר גורם לאירועים לחזור.</p>
<p>תבנית:</p>
<ul><li><strong>Summary</strong>: 2-3 משפטים.</li>
<li><strong>Impact</strong>: משך, % משתמשים מושפעים, בקשות שנכשלו, הכנסות, כמה error budget נצרך.</li>
<li><strong>Timeline</strong> (UTC): הטריגר הראשון, זיהוי, הכרזה, mitigation, פתרון.</li>
<li><strong>Root cause ו-contributing factors</strong>: לרוב יש כמה — הבאג, הטסט שחסר, ההתראה שלא קפצה, ה-runbook שלא היה מעודכן.</li>
<li><strong>5 whys</strong>: ממשיכים לשאול "למה" כדי להגיע מהטריגר לסיבות מערכתיות.</li>
<li><strong>מה עבד טוב / מה עבד רע / איפה היה לנו מזל</strong>.</li>
<li><strong>Action items</strong>: לכל אחד owner, עדיפות ותאריך יעד, במעקב ב-backlog האמיתי. עדיף "למנוע/לזהות אוטומטית" על פני "להיות יותר זהירים".</li></ul>
<blockquote>💡 מהשטח: דוגמה ל-5 whys — ה-Checkout למטה. למה? נגמרו ה-connections ל-DB. למה? הקוד החדש פתח connection לכל בקשה. למה? הגדרות ה-pool לא הוחלו בשירות החדש. למה? לתבנית השירות אין pool דיפולטי. למה? אין ספרייה סטנדרטית לגישה ל-DB. → Action: DB client משותף עם pooling + load test ב-CI.</blockquote>`
      }
    },
    {
      h: { en: "The incident metrics: MTTD, MTTA, MTTR, MTBF", he: "מטריקות האירועים: MTTD, MTTA, MTTR, MTBF" },
      body: {
        en: `<table><tr><th>Metric</th><th>Measures</th><th>From → to</th><th>Improve with</th></tr>
<tr><td>MTTD – Mean Time To Detect</td><td>How fast you notice</td><td>Failure starts → alert fires</td><td>SLO/burn-rate alerts, synthetic probes</td></tr>
<tr><td>MTTA – Mean Time To Acknowledge</td><td>How fast a human engages</td><td>Alert → on-call acks</td><td>Sane paging, escalation policies, less alert noise</td></tr>
<tr><td>MTTR – Mean Time To Recover/Restore</td><td>How fast service is back</td><td>Failure starts → recovered</td><td>Fast rollback, runbooks, feature flags, automation</td></tr>
<tr><td>MTBF – Mean Time Between Failures</td><td>How often you break</td><td>Recovery → next failure</td><td>Testing, canaries, removing root causes</td></tr></table>
<p>Availability ≈ MTBF / (MTBF + MTTR). Something failing every 30 days (720 h) and taking 1 h to recover ≈ 99.86%. Cut MTTR to 6 minutes and you're at ~99.99% <em>without</em> failing less often. That's why modern reliability work obsesses over fast recovery rather than perfect prevention.</p>
<p>Caveat: "R" is ambiguous (repair / recover / resolve / respond). Define it in your org, and treat these as trend indicators, not targets to game.</p>`,
        he: `<table><tr><th>מטריקה</th><th>מה מודדת</th><th>מ → עד</th><th>משפרים עם</th></tr>
<tr><td>MTTD – Mean Time To Detect</td><td>כמה מהר שמים לב</td><td>תחילת הכשל → ההתראה קופצת</td><td>התראות SLO/burn-rate, synthetic probes</td></tr>
<tr><td>MTTA – Mean Time To Acknowledge</td><td>כמה מהר בן אדם נכנס לתמונה</td><td>התראה → התורן עושה ack</td><td>Paging שפוי, escalation policies, פחות רעש</td></tr>
<tr><td>MTTR – Mean Time To Recover/Restore</td><td>כמה מהר השירות חוזר</td><td>תחילת הכשל → התאוששות</td><td>Rollback מהיר, runbooks, feature flags, אוטומציה</td></tr>
<tr><td>MTBF – Mean Time Between Failures</td><td>כמה פעמים נשברים</td><td>התאוששות → הכשל הבא</td><td>טסטים, canaries, הסרת root causes</td></tr></table>
<p>Availability ≈ MTBF / (MTBF + MTTR). משהו שנופל כל 30 יום (720 שעות) ולוקח שעה להתאושש ≈ 99.86%. תוריד את ה-MTTR ל-6 דקות ואתה ב-~99.99% <em>בלי</em> ליפול פחות. בגלל זה עבודת אמינות מודרנית אובססיבית להתאוששות מהירה ולא למניעה מושלמת.</p>
<p>הסתייגות: ה-"R" דו-משמעי (repair / recover / resolve / respond). תגדירו אותו בארגון, ותתייחסו למטריקות האלה כאינדיקטורים למגמה, לא כיעדים שמנסים "לשחק" איתם.</p>`
      }
    }
  ],
  diagram: `failure   alert     ack       mitigated          resolved      postmortem
   |---------|---------|-------------|------------------|--------------|
   |<-MTTD-->|<-MTTA-->|
   |<---------- MTTR (customer-facing) ------>|
 IC: "What changed? -> rollback -> next update in 15 min"`,
  handsOn: [
    {
      cmd: "kubectl rollout undo deployment/checkout && kubectl rollout status deployment/checkout",
      what: { en: "The #1 mitigation: roll back the last deploy and wait until it's complete.", he: "ה-mitigation מספר 1: rollback ל-deploy האחרון ולחכות שיסתיים." }
    },
    {
      cmd: "kubectl rollout history deployment/checkout",
      what: { en: "Answer 'what changed?' — see recent revisions of a Deployment.", he: "לענות על 'מה השתנה?' — לראות את הגרסאות האחרונות של Deployment." }
    },
    {
      cmd: "git log --since='3 hours ago' --oneline --all",
      what: { en: "List recent changes across branches when hunting for the trigger.", he: "לרשום את השינויים האחרונים בכל ה-branches כשמחפשים את הטריגר." }
    },
    {
      cmd: "node -e \"const mtbf=720, mttr=1; console.log((100*mtbf/(mtbf+mttr)).toFixed(3)+'%')\"",
      what: { en: "Compute availability from MTBF and MTTR (hours); try mttr=0.1.", he: "לחשב availability מ-MTBF ו-MTTR (בשעות); נסה mttr=0.1." }
    }
  ],
  mnemonic: {
    en: "\"Declare, Command, Mitigate, Communicate, Learn\" — DCMCL: \"Don't Cry, Mitigate, Communicate, Learn.\"",
    he: "\"מכריזים, מפקדים, עוצרים דימום, מעדכנים, לומדים\" — או באנגלית: \"Don't Cry, Mitigate, Communicate, Learn.\""
  },
  pitfalls: [
    { en: "Everyone debugging, no one coordinating. Without an IC, three people restart three different things and nobody updates customers.", he: "כולם מדבגים, אף אחד לא מתאם. בלי IC, שלושה אנשים עושים restart לשלושה דברים שונים ואף אחד לא מעדכן לקוחות." },
    { en: "Hunting root cause before mitigating. Rollback first — you can investigate the bad version in staging afterwards.", he: "לחפש root cause לפני mitigation. קודם rollback — אפשר לחקור את הגרסה הרעה ב-staging אחר כך." },
    { en: "Postmortem action items like 'be more careful' or items with no owner/due date. They never get done and the incident repeats.", he: "Action items בפוסטמורטם כמו 'להיות יותר זהירים' או בלי owner/תאריך. הם אף פעם לא מתבצעים והאירוע חוזר." },
    { en: "Blame culture: naming and shaming makes engineers hide mistakes, so you lose the information needed to fix the system.", he: "תרבות של האשמה: להצביע על אשמים גורם למהנדסים להסתיר טעויות, ואז מאבדים את המידע שצריך כדי לתקן את המערכת." }
  ],
  interview: [
    {
      q: { en: "You're on call and checkout error rate jumps to 20% right after a deploy. Walk me through what you do.", he: "אתה תורן וה-error rate של ה-checkout קופץ ל-20% מיד אחרי deploy. תעביר אותי במה שאתה עושה." },
      a: { en: "Ack the page, declare a SEV1/2 and open an incident channel, take or assign IC. Immediately roll back the deploy since it's the most likely trigger — mitigation before diagnosis. Have someone post a status page update. Watch error rates recover, keep evidence (logs, the diff), then resolve and schedule a blameless postmortem with timeline, impact, contributing factors (e.g., why canary didn't catch it), and owned action items.", he: "Ack לפייג', להכריז SEV1/2 ולפתוח ערוץ אירוע, לקחת או למנות IC. מיד rollback ל-deploy כי הוא הטריגר הכי סביר — mitigation לפני אבחון. שמישהו יעדכן את ה-status page. לראות שה-error rate מתאושש, לשמור ראיות (לוגים, ה-diff), ואז לסגור ולקבוע postmortem blameless עם timeline, impact, contributing factors (למשל למה ה-canary לא תפס) ו-action items עם owners." }
    },
    {
      q: { en: "What does 'blameless' mean in a postmortem and why does it matter?", he: "מה המשמעות של 'blameless' בפוסטמורטם ולמה זה חשוב?" },
      a: { en: "It means focusing on systemic causes and assuming good intent: people made reasonable decisions with what they knew. It matters because blame causes people to hide details, and without honest details you can't find the real contributing factors (missing guardrails, bad tooling, unclear runbooks).", he: "זה אומר להתמקד בסיבות מערכתיות ולהניח כוונה טובה: אנשים קיבלו החלטות סבירות לפי מה שידעו. זה חשוב כי האשמה גורמת לאנשים להסתיר פרטים, ובלי פרטים כנים אי אפשר למצוא את ה-contributing factors האמיתיים (חוסר guardrails, כלים גרועים, runbooks לא ברורים)." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the Incident Commander's main job?", he: "מה התפקיד העיקרי של ה-Incident Commander?" },
      options: [
        { en: "Debug the issue personally because they're the most senior", he: "לדבג בעצמו כי הוא הכי בכיר" },
        { en: "Coordinate: make decisions, assign tasks, track time and ensure communication", he: "לתאם: לקבל החלטות, לחלק משימות, לעקוב אחרי הזמן ולוודא תקשורת" },
        { en: "Write the postmortem during the incident", he: "לכתוב את הפוסטמורטם תוך כדי האירוע" },
        { en: "Talk to customers directly on the phone", he: "לדבר עם לקוחות ישירות בטלפון" }
      ],
      answer: 1,
      explain: { en: "The IC coordinates and decides; they deliberately don't debug so someone keeps the big picture. Comms lead handles customers, the postmortem comes after.", he: "ה-IC מתאם ומחליט; הוא בכוונה לא מדבג כדי שמישהו ישמור על התמונה הגדולה. ה-comms lead מטפל בלקוחות, והפוסטמורטם בא אחרי." }
    },
    {
      q: { en: "A service fails every 30 days and takes 1 hour to recover. Which change improves availability the most?", he: "שירות נופל כל 30 יום ולוקח שעה להתאושש. איזה שינוי ישפר את ה-availability הכי הרבה?" },
      options: [
        { en: "Reduce MTTR to 6 minutes", he: "להוריד את ה-MTTR ל-6 דקות" },
        { en: "Increase MTBF to 45 days", he: "להעלות את ה-MTBF ל-45 יום" },
        { en: "Reduce MTTA from 5 to 3 minutes", he: "להוריד את ה-MTTA מ-5 ל-3 דקות" },
        { en: "Write longer postmortems", he: "לכתוב פוסטמורטמים ארוכים יותר" }
      ],
      answer: 0,
      explain: { en: "MTTR 6 min → ~99.99%. MTBF 45 days → ~99.91%. Cutting downtime 10× beats failing 1.5× less often.", he: "MTTR של 6 דקות → ~99.99%. MTBF של 45 יום → ~99.91%. לקצר השבתה פי 10 מנצח ליפול פי 1.5 פחות." }
    },
    {
      q: { en: "Which postmortem action item is best?", he: "איזה action item בפוסטמורטם הכי טוב?" },
      options: [
        { en: "Engineers should be more careful when editing configs", he: "מהנדסים צריכים להיות יותר זהירים כשהם עורכים configs" },
        { en: "Dana must review all future config changes", he: "דנה צריכה לעבור על כל שינויי ה-config בעתיד" },
        { en: "Add config schema validation in CI that blocks invalid values (owner: platform team, due: 2 weeks)", he: "להוסיף ולידציית schema ל-config ב-CI שחוסמת ערכים לא תקינים (owner: צוות platform, תוך שבועיים)" },
        { en: "Investigate further", he: "לחקור עוד" }
      ],
      answer: 2,
      explain: { en: "Good action items are systemic, automatic, specific, owned and dated. 'Be careful' and single-human gates don't scale.", he: "Action items טובים הם מערכתיים, אוטומטיים, ספציפיים, עם owner ותאריך. 'להיות זהירים' ו-gate של בן אדם יחיד לא מחזיקים." }
    },
    {
      q: { en: "Errors spike 5 minutes after a config change. You're 'pretty sure' the config isn't the cause. What should you do first?", he: "השגיאות קופצות 5 דקות אחרי שינוי config. אתה 'די בטוח' שה-config לא הסיבה. מה עושים קודם?" },
      options: [
        { en: "Dig into logs until you find the real root cause", he: "לחפור בלוגים עד שמוצאים את ה-root cause האמיתי" },
        { en: "Revert the config change anyway — it's cheap and fast mitigation", he: "להחזיר את שינוי ה-config בכל מקרה — זה mitigation זול ומהיר" },
        { en: "Wait 15 minutes to see if it self-heals", he: "לחכות רבע שעה ולראות אם זה מתרפא לבד" },
        { en: "Scale the database", he: "לעשות scale ל-DB" }
      ],
      answer: 1,
      explain: { en: "Recent changes are the most likely trigger, and reverting is low risk. If errors persist, you've eliminated a suspect in minutes.", he: "שינויים אחרונים הם הטריגר הכי סביר, ו-revert הוא סיכון נמוך. אם השגיאות נמשכות, פסלת חשוד תוך דקות." }
    }
  ],
  related: ["obs-alerting", "rel-error-budgets", "rel-deployments"]
});

INFRA.lessons.push({
  id: "rel-deployments",
  track: "reliability",
  order: 6,
  icon: "🚀",
  level: 2,
  minutes: 10,
  title: { en: "Safe Deployment Strategies", he: "אסטרטגיות Deployment בטוחות" },
  tldr: {
    en: "Most outages are caused by changes, so ship changes in a way that limits blast radius and makes undo instant: rolling, blue/green, canary with metric gates, and feature flags that decouple deploy from release.",
    he: "רוב ההשבתות נגרמות משינויים, אז משחררים שינויים בצורה שמגבילה את ה-blast radius והופכת undo למיידי: rolling, blue/green, canary עם metric gates, ו-feature flags שמפרידים בין deploy ל-release."
  },
  analogy: {
    en: "A restaurant changing its menu. Recreate = close the restaurant, swap the kitchen, reopen. Rolling = change one table's menu at a time. Blue/green = build a second identical restaurant next door and move the sign. Canary = give the new dish to 5% of diners and watch who reaches for water. Feature flag = the dish is already in the kitchen; the waiter decides who gets offered it.",
    he: "מסעדה שמחליפה תפריט. Recreate = סוגרים את המסעדה, מחליפים מטבח, פותחים מחדש. Rolling = מחליפים תפריט לשולחן אחד בכל פעם. Blue/green = בונים מסעדה זהה שנייה ליד ומזיזים את השלט. Canary = מגישים את המנה החדשה ל-5% מהסועדים ובודקים מי מחפש כוס מים. Feature flag = המנה כבר במטבח; המלצר מחליט למי להציע אותה."
  },
  sections: [
    {
      h: { en: "Recreate and rolling", he: "Recreate ו-rolling" },
      body: {
        en: `<p><strong>Recreate</strong>: stop all old instances, start new ones. Guaranteed downtime, but simple and the only option when two versions <em>cannot</em> run at the same time (e.g., exclusive lock on a resource, incompatible schema). Fine for dev, batch workers, or a scheduled maintenance window.</p>
<p><strong>Rolling update</strong>: replace instances a few at a time. Kubernetes' default: <code>maxSurge: 25%</code> (extra pods allowed above desired) and <code>maxUnavailable: 25%</code>. No downtime, no extra infra, but:</p>
<ul><li>Old and new versions serve traffic <em>simultaneously</em> for minutes — APIs and DB schema must be backward compatible.</li>
<li>Rollback is another rolling update, so it's not instant.</li>
<li>Without good readiness probes, broken pods receive traffic.</li></ul>
<pre>strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0   # never go below desired capacity</pre>`,
        he: `<p><strong>Recreate</strong>: עוצרים את כל ה-instances הישנים, מרימים חדשים. downtime מובטח, אבל פשוט, והאפשרות היחידה כששתי גרסאות <em>לא יכולות</em> לרוץ ביחד (למשל lock בלעדי על משאב, schema לא תואם). בסדר ל-dev, ל-batch workers או לחלון תחזוקה מתוכנן.</p>
<p><strong>Rolling update</strong>: מחליפים instances כמה בכל פעם. הדיפולט של Kubernetes: <code>maxSurge: 25%</code> (pods נוספים מעבר לרצוי) ו-<code>maxUnavailable: 25%</code>. בלי downtime, בלי תשתית נוספת, אבל:</p>
<ul><li>הגרסה הישנה והחדשה מגישות טראפיק <em>במקביל</em> במשך דקות — ה-APIs וה-schema של ה-DB חייבים להיות backward compatible.</li>
<li>Rollback הוא עוד rolling update, אז הוא לא מיידי.</li>
<li>בלי readiness probes טובים, pods שבורים מקבלים טראפיק.</li></ul>
<pre>strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0   # never go below desired capacity</pre>`
      }
    },
    {
      h: { en: "Blue/green", he: "Blue/green" },
      body: {
        en: `<p>Run two full environments. <strong>Blue</strong> serves production; deploy the new version to <strong>green</strong>, test it with real infra (smoke tests, internal traffic), then flip the router/LB/DNS to green. Rollback = flip back, in seconds.</p>
<ul><li><strong>Pros</strong>: instant cutover and rollback, full pre-production testing on prod infra, no mixed versions serving users.</li>
<li><strong>Cons</strong>: 2× capacity during the deploy; all users switch at once (big blast radius if tests missed something); shared database is still the hard part — both colors must work with the same schema.</li></ul>
<blockquote>⚠️ Production tip: If you flip via DNS, clients and resolvers cache records for the TTL (and some ignore it). Prefer flipping at the load balancer (e.g., swapping target groups or a Kubernetes Service selector), which is immediate.</blockquote>`,
        he: `<p>מריצים שתי סביבות מלאות. <strong>Blue</strong> מגישה פרודקשן; עושים deploy לגרסה החדשה ב-<strong>green</strong>, בודקים אותה על תשתית אמיתית (smoke tests, טראפיק פנימי), ואז מעבירים את ה-router/LB/DNS ל-green. Rollback = להעביר חזרה, תוך שניות.</p>
<ul><li><strong>יתרונות</strong>: מעבר ו-rollback מיידיים, טסטים מלאים על תשתית הפרודקשן לפני העלייה, אין גרסאות מעורבבות מול המשתמשים.</li>
<li><strong>חסרונות</strong>: פי 2 קיבולת בזמן ה-deploy; כל המשתמשים עוברים בבת אחת (blast radius גדול אם הטסטים פספסו משהו); ה-DB המשותף הוא עדיין החלק הקשה — שני הצבעים חייבים לעבוד עם אותו schema.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: אם עושים את המעבר דרך DNS, לקוחות ו-resolvers שומרים את הרשומות ב-cache לפי ה-TTL (וחלקם מתעלמים ממנו). עדיף להעביר ברמת ה-Load Balancer (למשל החלפת target groups או selector של Service ב-Kubernetes), שזה מיידי.</blockquote>`
      }
    },
    {
      h: { en: "Canary with metric gates", he: "Canary עם metric gates" },
      body: {
        en: `<p>Send a small slice of real traffic to the new version, compare it to the baseline, and expand only if it's healthy. Typical progression: <strong>1% → 5% → 25% → 50% → 100%</strong>, with 5-15 minute bake time per step.</p>
<p>Gates are automated checks comparing canary vs. stable:</p>
<table><tr><th>Metric</th><th>Example gate</th></tr>
<tr><td>Error rate</td><td>canary 5xx ≤ stable 5xx + 0.5%</td></tr>
<tr><td>Latency</td><td>canary p99 ≤ 1.2 × stable p99</td></tr>
<tr><td>Saturation</td><td>CPU / memory not trending to limits</td></tr>
<tr><td>Business</td><td>checkout conversion not down &gt; 2%</td></tr></table>
<p>Fail any gate → automatic rollback. Tools: Argo Rollouts, Flagger, Spinnaker (Kayenta), AWS CodeDeploy, service meshes like Istio for weighted routing.</p>
<blockquote>💡 Real world: With 1% of 1,000 req/s, the canary sees only 10 req/s. A 0.5% error difference is 1 failure every 20 seconds — you need enough bake time for statistical confidence. Low-traffic services need longer steps or a larger initial slice.</blockquote>`,
        he: `<p>שולחים פרוסה קטנה של טראפיק אמיתי לגרסה החדשה, משווים אותה ל-baseline, ומרחיבים רק אם היא בריאה. התקדמות טיפוסית: <strong>1% → 5% → 25% → 50% → 100%</strong>, עם bake time של 5-15 דקות בכל שלב.</p>
<p>Gates הם בדיקות אוטומטיות שמשוות canary מול stable:</p>
<table><tr><th>מטריקה</th><th>דוגמה ל-gate</th></tr>
<tr><td>Error rate</td><td>5xx ב-canary ≤ 5xx ב-stable + 0.5%</td></tr>
<tr><td>Latency</td><td>p99 ב-canary ≤ 1.2 × p99 ב-stable</td></tr>
<tr><td>Saturation</td><td>CPU / memory לא מטפסים לכיוון ה-limits</td></tr>
<tr><td>Business</td><td>ה-conversion ב-checkout לא יורד ביותר מ-2%</td></tr></table>
<p>נכשלים ב-gate כלשהו → rollback אוטומטי. כלים: Argo Rollouts, Flagger, Spinnaker (Kayenta), AWS CodeDeploy, ו-service mesh כמו Istio ל-weighted routing.</p>
<blockquote>💡 מהשטח: עם 1% מ-1,000 req/s, ה-canary רואה רק 10 req/s. הבדל של 0.5% בשגיאות זה כשל אחד כל 20 שניות — צריך מספיק bake time בשביל ביטחון סטטיסטי. שירותים עם מעט טראפיק צריכים שלבים ארוכים יותר או פרוסה התחלתית גדולה יותר.</blockquote>`
      }
    },
    {
      h: { en: "Feature flags and dark launches", he: "Feature flags ו-dark launches" },
      body: {
        en: `<p><strong>Feature flags</strong> decouple <em>deploy</em> (code is on servers) from <em>release</em> (users see it). Code ships dark behind <code>if (flags.isOn("new-checkout", user))</code>; you turn it on for employees, then 1% of users, then a country, then everyone. Killing a bad feature is a flag flip in seconds — no redeploy. Tools: LaunchDarkly, Unleash, Flagsmith, OpenFeature (standard API), or a simple config table.</p>
<p><strong>Dark launch</strong>: run the new code path on real production traffic without showing results to users — e.g., call the new search service in parallel, discard its answer, and compare outputs/latency with the old one ("shadow traffic"). Great for load-testing a rewrite with real patterns.</p>
<blockquote>⚠️ Production tip: Flags are tech debt with a timer. Give each one an owner and an expiry date and delete it after full rollout. Hundreds of stale flags create untested combinations — a misconfigured old flag being reused is a classic cause of very expensive incidents.</blockquote>`,
        he: `<p><strong>Feature flags</strong> מפרידים בין <em>deploy</em> (הקוד על השרתים) לבין <em>release</em> (המשתמשים רואים אותו). הקוד עולה "בחושך" מאחורי <code>if (flags.isOn("new-checkout", user))</code>; מדליקים לעובדים, אחר כך ל-1% מהמשתמשים, אחר כך למדינה, ואז לכולם. להרוג פיצ'ר גרוע זה הזזת flag תוך שניות — בלי redeploy. כלים: LaunchDarkly, Unleash, Flagsmith, OpenFeature (API סטנדרטי), או טבלת config פשוטה.</p>
<p><strong>Dark launch</strong>: מריצים את מסלול הקוד החדש על טראפיק פרודקשן אמיתי בלי להציג את התוצאות למשתמשים — למשל קוראים לשירות החיפוש החדש במקביל, זורקים את התשובה שלו, ומשווים פלט/latency מול הישן ("shadow traffic"). מעולה ל-load test של שכתוב עם דפוסים אמיתיים.</p>
<blockquote>⚠️ טיפ לפרודקשן: Flags הם חוב טכני עם טיימר. תן לכל אחד owner ותאריך תפוגה ותמחק אותו אחרי rollout מלא. מאות flags ישנים יוצרים קומבינציות שלא נבדקו — שימוש חוזר ב-flag ישן עם הגדרה שגויה הוא סיבה קלאסית לאירועים יקרים מאוד.</blockquote>`
      }
    },
    {
      h: { en: "Rollback vs roll-forward, and the database problem", he: "Rollback מול roll-forward, ובעיית ה-DB" },
      body: {
        en: `<p><strong>Rollback</strong> (go to the previous version) is the default mitigation: known-good, fast. <strong>Roll-forward</strong> (ship a fix) is OK only when the fix is tiny, well understood, and your pipeline is fast — or when rollback is impossible.</p>
<p>Rollback becomes impossible when code and schema are coupled. If v2 renames column <code>name</code> → <code>full_name</code> in the same deploy, v1 can't run anymore. Use <strong>expand / contract</strong> (parallel change):</p>
<ol><li><strong>Expand</strong>: add <code>full_name</code> (nullable). Deploy code that writes both columns, reads the old one.</li>
<li><strong>Migrate</strong>: backfill <code>full_name</code> in batches.</li>
<li>Deploy code that reads <code>full_name</code> (still writes both). Any step can roll back safely.</li>
<li><strong>Contract</strong>: once nothing reads <code>name</code>, stop writing it, then drop the column — weeks later.</li></ol>
<p>Rule: <strong>schema migrations ship separately from the code that needs them, and must be compatible with both N and N−1 versions of the app.</strong></p>`,
        he: `<p><strong>Rollback</strong> (חזרה לגרסה הקודמת) הוא ה-mitigation הדיפולטי: גרסה שידוע שעובדת, ומהיר. <strong>Roll-forward</strong> (לשחרר תיקון) בסדר רק כשהתיקון קטנטן, מובן היטב וה-pipeline מהיר — או כש-rollback בלתי אפשרי.</p>
<p>Rollback הופך לבלתי אפשרי כשהקוד וה-schema צמודים. אם v2 משנה את שם העמודה <code>name</code> → <code>full_name</code> באותו deploy, v1 כבר לא יכול לרוץ. משתמשים ב-<strong>expand / contract</strong> (parallel change):</p>
<ol><li><strong>Expand</strong>: מוסיפים <code>full_name</code> (nullable). עושים deploy לקוד שכותב לשתי העמודות וקורא מהישנה.</li>
<li><strong>Migrate</strong>: backfill ל-<code>full_name</code> ב-batches.</li>
<li>Deploy לקוד שקורא מ-<code>full_name</code> (ועדיין כותב לשתיהן). בכל שלב אפשר לעשות rollback בבטחה.</li>
<li><strong>Contract</strong>: כשאף אחד כבר לא קורא מ-<code>name</code>, מפסיקים לכתוב אליה, ואז מוחקים את העמודה — שבועות אחר כך.</li></ol>
<p>הכלל: <strong>migrations של schema יוצאים בנפרד מהקוד שצריך אותם, וחייבים להיות תואמים גם לגרסה N וגם ל-N−1 של האפליקציה.</strong></p>`
      }
    }
  ],
  diagram: `Rolling:    [v1][v1][v1][v1] -> [v2][v1][v1][v1] -> ... -> [v2][v2][v2][v2]
Blue/green: LB --> BLUE(v1)        flip!   LB --> GREEN(v2)   (blue kept for rollback)
Canary:     LB --99%--> stable(v1)
               \\--1%--> canary(v2)  -- gates OK? --> 5% -> 25% -> 100%
                                     -- gate FAIL --> auto rollback`,
  handsOn: [
    {
      cmd: "kubectl set image deployment/web web=myrepo/web:v2 && kubectl rollout status deployment/web",
      what: { en: "Trigger a rolling update and watch it progress.", he: "להפעיל rolling update ולצפות בהתקדמות." }
    },
    {
      cmd: "kubectl rollout pause deployment/web",
      what: { en: "Pause a rollout midway — a poor man's canary while you check metrics.", he: "לעצור rollout באמצע — canary של עניים בזמן שבודקים מטריקות." }
    },
    {
      cmd: "kubectl patch service web -p '{\"spec\":{\"selector\":{\"app\":\"web\",\"color\":\"green\"}}}'",
      what: { en: "Blue/green cutover by switching the Service selector from blue pods to green pods.", he: "מעבר blue/green על ידי החלפת ה-selector של ה-Service מ-pods כחולים לירוקים." }
    },
    {
      cmd: "kubectl argo rollouts get rollout web --watch",
      what: { en: "With Argo Rollouts installed, watch a canary progress through its weight steps and analysis gates.", he: "עם Argo Rollouts מותקן, לצפות ב-canary מתקדם בשלבי המשקל וב-analysis gates." }
    }
  ],
  mnemonic: {
    en: "\"Rolling waves, Blue-green switch, Canary sings, Flags hide\" — and for DBs: \"Expand before you Contract.\"",
    he: "\"Rolling = גלים, Blue-green = מתג, Canary = הכנרית שרה, Flags = מחביאים\" — ול-DB: \"קודם מרחיבים, אחר כך מכווצים\" (Expand → Contract)."
  },
  pitfalls: [
    { en: "Coupling a breaking schema migration with the code deploy — the old version can't run, so rollback is impossible.", he: "לצמד migration שובר של schema ל-deploy של הקוד — הגרסה הישנה לא יכולה לרוץ, אז אי אפשר לעשות rollback." },
    { en: "Canary without automated gates, where 'someone will look at the dashboard' — nobody does at 2 AM.", he: "Canary בלי gates אוטומטיים, כש'מישהו יסתכל על הדשבורד' — אף אחד לא מסתכל ב-2 בלילה." },
    { en: "Blue/green via DNS with a long TTL: clients keep hitting the old environment for hours, and 'instant rollback' isn't.", he: "Blue/green דרך DNS עם TTL ארוך: לקוחות ממשיכים לפגוע בסביבה הישנה שעות, וה-'rollback המיידי' לא באמת מיידי." },
    { en: "Never cleaning up feature flags, leading to a combinatorial explosion of untested code paths.", he: "לא לנקות feature flags אף פעם, מה שמוביל לפיצוץ קומבינטורי של מסלולי קוד שלא נבדקו." }
  ],
  interview: [
    {
      q: { en: "Compare blue/green and canary deployments. When would you pick each?", he: "תשווה בין blue/green ל-canary. מתי היית בוחר בכל אחד?" },
      a: { en: "Blue/green switches all traffic at once between two full environments: instant rollback, needs 2× capacity, big blast radius if something slips through. Canary shifts traffic gradually with metric comparison: small blast radius, catches issues that only real traffic reveals, but needs good observability and enough traffic. Use blue/green when you need a clean atomic switch (or can't run mixed versions behind one LB); canary for high-traffic services where you want risk limited to a small slice.", he: "Blue/green מעביר את כל הטראפיק בבת אחת בין שתי סביבות מלאות: rollback מיידי, דורש פי 2 קיבולת, blast radius גדול אם משהו מתפספס. Canary מעביר טראפיק בהדרגה עם השוואת מטריקות: blast radius קטן, תופס בעיות שרק טראפיק אמיתי חושף, אבל דורש observability טובה ומספיק טראפיק. Blue/green כשצריך מעבר אטומי נקי; canary לשירותים עם הרבה טראפיק כשרוצים להגביל את הסיכון לפרוסה קטנה." }
    },
    {
      q: { en: "How do you rename a database column with zero downtime?", he: "איך משנים שם של עמודה ב-DB בלי downtime?" },
      a: { en: "Expand/contract: add the new column, deploy code that dual-writes, backfill, switch reads to the new column, stop writing the old one, and finally drop it. Each step is backward compatible with the previous app version so rollback stays possible.", he: "Expand/contract: מוסיפים את העמודה החדשה, deploy לקוד שכותב לשתיהן, backfill, מעבירים את הקריאות לעמודה החדשה, מפסיקים לכתוב לישנה, ולבסוף מוחקים אותה. כל שלב backward compatible מול הגרסה הקודמת, אז rollback נשאר אפשרי." }
    }
  ],
  quiz: [
    {
      q: { en: "Which strategy necessarily causes downtime?", he: "איזו אסטרטגיה בהכרח גורמת ל-downtime?" },
      options: [
        { en: "Rolling update", he: "Rolling update" },
        { en: "Recreate", he: "Recreate" },
        { en: "Blue/green", he: "Blue/green" },
        { en: "Canary", he: "Canary" }
      ],
      answer: 1,
      explain: { en: "Recreate stops all old instances before starting new ones, so there's a gap. The others keep serving throughout.", he: "Recreate עוצר את כל ה-instances הישנים לפני שמרים חדשים, אז יש פער. האחרות ממשיכות להגיש לאורך כל הדרך." }
    },
    {
      q: { en: "What's the main benefit of feature flags over deployment strategies?", he: "מה היתרון העיקרי של feature flags על פני אסטרטגיות deployment?" },
      options: [
        { en: "They make the code faster", he: "הם הופכים את הקוד למהיר יותר" },
        { en: "They decouple deploy from release, so a feature can be disabled in seconds without a redeploy", he: "הם מפרידים בין deploy ל-release, כך שאפשר לכבות פיצ'ר תוך שניות בלי redeploy" },
        { en: "They remove the need for testing", he: "הם מבטלים את הצורך בטסטים" },
        { en: "They replace database migrations", he: "הם מחליפים migrations של DB" }
      ],
      answer: 1,
      explain: { en: "Flags let code sit in production dark and be released/killed per user segment instantly. They add complexity and don't replace testing.", he: "Flags מאפשרים לקוד לשבת בפרודקשן 'בחושך' ולהשתחרר/להיכבות לפי סגמנט משתמשים מיידית. הם מוסיפים מורכבות ולא מחליפים טסטים." }
    },
    {
      q: { en: "A canary at 5% shows p99 latency 40% higher than stable, error rate equal. Gate is p99 ≤ 1.2× stable. What should happen?", he: "Canary ב-5% מראה p99 latency גבוה ב-40% מה-stable, error rate זהה. ה-gate הוא p99 ≤ 1.2× stable. מה צריך לקרות?" },
      options: [
        { en: "Promote — errors are equal", he: "לקדם — השגיאות זהות" },
        { en: "Automatically roll back the canary", he: "לעשות rollback אוטומטי ל-canary" },
        { en: "Jump to 100% to get more data", he: "לקפוץ ל-100% כדי לקבל יותר דאטה" },
        { en: "Restart the stable pods", he: "לעשות restart ל-pods של ה-stable" }
      ],
      answer: 1,
      explain: { en: "1.4× > 1.2× fails the latency gate. Any failed gate should trigger rollback; latency regressions are real user pain even without errors.", he: "1.4× > 1.2× נכשל ב-gate של ה-latency. כל gate שנכשל צריך להפעיל rollback; רגרסיות latency הן כאב אמיתי למשתמש גם בלי שגיאות." }
    },
    {
      q: { en: "Why must a schema migration be compatible with both the new and the previous app version?", he: "למה migration של schema חייב להיות תואם גם לגרסה החדשה וגם לקודמת של האפליקציה?" },
      options: [
        { en: "Because ORMs require it", he: "כי ה-ORMs דורשים את זה" },
        { en: "During rolling deploys both versions run at once, and you need to be able to roll back", he: "בזמן rolling deploy שתי הגרסאות רצות ביחד, וצריך להיות אפשר לעשות rollback" },
        { en: "To make migrations faster", he: "כדי שה-migrations יהיו מהירים יותר" },
        { en: "It doesn't matter with blue/green", he: "זה לא משנה ב-blue/green" }
      ],
      answer: 1,
      explain: { en: "Mixed versions coexist during rollout, and rollback means the old version runs against the new schema. Blue/green shares the DB too, so it matters there as well.", he: "גרסאות מעורבבות חיות ביחד בזמן ה-rollout, ו-rollback אומר שהגרסה הישנה רצה מול ה-schema החדש. גם ב-blue/green ה-DB משותף, אז זה רלוונטי גם שם." }
    }
  ],
  related: ["k8s-deployments", "rel-error-budgets", "rel-incident-management", "net-load-balancing"]
});

INFRA.lessons.push({
  id: "rel-chaos-engineering",
  track: "reliability",
  order: 7,
  icon: "🐒",
  level: 3,
  minutes: 9,
  title: { en: "Chaos Engineering", he: "Chaos Engineering" },
  tldr: {
    en: "Break things on purpose, in a controlled way, with a hypothesis — so you find weaknesses on a Tuesday at 11:00 instead of on Saturday at 03:00.",
    he: "שוברים דברים בכוונה, בצורה מבוקרת ועם השערה — כדי למצוא חולשות ביום שלישי ב-11:00 במקום בשבת ב-03:00."
  },
  analogy: {
    en: "A vaccine. You expose the body to a small, controlled dose of the threat so it builds immunity before the real disease arrives. A fire drill is the same idea: nobody burns the building down, but you discover that the emergency exit is blocked by a pallet of printer paper.",
    he: "חיסון. חושפים את הגוף למנה קטנה ומבוקרת של האיום כדי שיפתח חסינות לפני שהמחלה האמיתית מגיעה. תרגיל אש זה אותו רעיון: אף אחד לא שורף את הבניין, אבל מגלים שיציאת החירום חסומה במשטח של נייר למדפסת."
  },
  sections: [
    {
      h: { en: "It's science, not vandalism", he: "זה מדע, לא ונדליזם" },
      body: {
        en: `<p>Chaos engineering (from the Principles of Chaos, born at Netflix) is a disciplined experiment:</p>
<ol><li><strong>Define steady state</strong> with a measurable, user-facing metric: "orders per minute ≈ 1,200, p99 &lt; 400 ms, error rate &lt; 0.1%".</li>
<li><strong>Hypothesize</strong> that steady state continues during the fault: "if one of three Redis replicas dies, p99 stays &lt; 400 ms and no errors appear".</li>
<li><strong>Inject a real-world fault</strong>: kill instances, add 300 ms latency, drop 5% of packets, fill a disk, expire a cert, throttle CPU, make DNS fail.</li>
<li><strong>Observe and compare</strong> against the control group / baseline.</li>
<li><strong>Learn and fix</strong>. If the hypothesis was disproved, you found a weakness cheaply. If it held, your confidence is now evidence-based.</li></ol>
<blockquote>💡 Real world: The most common finding of first chaos experiments isn't exotic — it's missing timeouts, retries without backoff, and alerts that didn't fire. The experiment often tests your observability as much as your system.</blockquote>`,
        he: `<p>Chaos engineering (מתוך ה-Principles of Chaos, שנולדו בנטפליקס) הוא ניסוי ממושמע:</p>
<ol><li><strong>מגדירים steady state</strong> עם מטריקה מדידה שהמשתמש מרגיש: "הזמנות לדקה ≈ 1,200, p99 מתחת ל-400ms, error rate מתחת ל-0.1%".</li>
<li><strong>משערים</strong> שה-steady state נשמר בזמן התקלה: "אם אחד משלושת ה-replicas של Redis מת, ה-p99 נשאר מתחת ל-400ms ואין שגיאות".</li>
<li><strong>מזריקים תקלה מהעולם האמיתי</strong>: להרוג instances, להוסיף 300ms latency, להפיל 5% מהפקטות, למלא דיסק, לגרום לתעודה לפוג, לחנוק CPU, להפיל DNS.</li>
<li><strong>צופים ומשווים</strong> מול קבוצת ביקורת / baseline.</li>
<li><strong>לומדים ומתקנים</strong>. אם ההשערה הופרכה, מצאת חולשה בזול. אם היא החזיקה, הביטחון שלך מבוסס עכשיו על ראיות.</li></ol>
<blockquote>💡 מהשטח: הממצא הכי נפוץ בניסויי chaos ראשונים הוא לא אקזוטי — זה timeouts חסרים, retries בלי backoff, והתראות שלא קפצו. הניסוי בודק לא פחות את ה-observability שלך מאשר את המערכת.</blockquote>`
      }
    },
    {
      h: { en: "Blast radius: start small, have an abort button", he: "Blast radius: מתחילים קטן, עם כפתור עצירה" },
      body: {
        en: `<p><strong>Blast radius</strong> is how much can be affected if the experiment goes wrong. Control it explicitly:</p>
<ul><li>Start in <strong>staging</strong>, then a <strong>single instance</strong> in prod, then one AZ, then (maybe, years later) a region.</li>
<li>Limit to a % of traffic or a set of internal/test users.</li>
<li>Run during business hours with the owning team watching — never at 3 AM, never during a launch or peak event.</li>
<li>Define <strong>stop conditions</strong> up front: "abort if error rate &gt; 1% or p99 &gt; 1 s" — and automate them (AWS FIS supports CloudWatch alarm stop conditions).</li>
<li>Have a one-command rollback for the fault itself.</li></ul>
<p>Don't inject a fault you already <em>know</em> will break things — fix that first. Chaos is for verifying resilience you <em>think</em> you have.</p>
<blockquote>⚠️ Production tip: Tell people. Announce experiments in the on-call channel and status calendar. A surprise chaos experiment that pages an unaware on-call engineer is just an incident with extra steps.</blockquote>`,
        he: `<p><strong>Blast radius</strong> זה כמה דברים יכולים להיפגע אם הניסוי משתבש. שולטים בו במפורש:</p>
<ul><li>מתחילים ב-<strong>staging</strong>, אחר כך <strong>instance יחיד</strong> בפרודקשן, אחר כך AZ אחד, ואז (אולי, שנים אחר כך) region.</li>
<li>מגבילים לאחוז מהטראפיק או לקבוצת משתמשים פנימיים/טסט.</li>
<li>מריצים בשעות העבודה כשהצוות האחראי צופה — אף פעם לא ב-3 לפנות בוקר, אף פעם לא בזמן השקה או שיא.</li>
<li>מגדירים <strong>stop conditions</strong> מראש: "לעצור אם error rate מעל 1% או p99 מעל שנייה" — ומאטמטים אותם (AWS FIS תומך ב-stop conditions מבוססי CloudWatch alarms).</li>
<li>שיהיה rollback בפקודה אחת לתקלה עצמה.</li></ul>
<p>אל תזריק תקלה שאתה כבר <em>יודע</em> שתשבור דברים — תתקן אותה קודם. Chaos נועד לאמת עמידות שאתה <em>חושב</em> שיש לך.</p>
<blockquote>⚠️ טיפ לפרודקשן: תגיד לאנשים. תכריז על ניסויים בערוץ ה-on-call וביומן. ניסוי chaos מפתיע שמעיר תורן שלא ידע עליו זה סתם אירוע עם צעדים נוספים.</blockquote>`
      }
    },
    {
      h: { en: "The tools", he: "הכלים" },
      body: {
        en: `<table><tr><th>Tool</th><th>Where</th><th>What it's good at</th></tr>
<tr><td>Chaos Monkey (Netflix)</td><td>VMs / Spinnaker</td><td>Randomly terminates instances during business hours; the original. Part of the "Simian Army" (Latency Monkey, Chaos Gorilla for whole AZs, Chaos Kong for regions).</td></tr>
<tr><td>LitmusChaos</td><td>Kubernetes (CNCF)</td><td>ChaosExperiment CRDs: pod-delete, node-drain, network latency/loss, CPU/memory hog; ChaosHub library.</td></tr>
<tr><td>Chaos Mesh</td><td>Kubernetes (CNCF)</td><td>Pod/network/IO/time/kernel faults with a dashboard and schedules.</td></tr>
<tr><td>AWS FIS</td><td>AWS managed</td><td>Stop EC2, fail over RDS, throttle APIs, disrupt AZ connectivity, inject EKS pod faults; stop conditions via CloudWatch alarms.</td></tr>
<tr><td>Azure Chaos Studio</td><td>Azure managed</td><td>Similar faults for Azure resources and AKS.</td></tr>
<tr><td>Gremlin</td><td>Commercial SaaS</td><td>Agent-based attacks (CPU, blackhole, latency, shutdown) with a polished UI, safety controls and reliability scoring.</td></tr>
<tr><td>Toxiproxy</td><td>Dev / CI</td><td>TCP proxy that adds latency, timeouts, bandwidth limits — great for testing a single service's resilience in CI.</td></tr></table>
<p>You don't need a tool to start: <code>kubectl delete pod</code>, <code>tc qdisc add ... netem delay 300ms</code> and <code>stress-ng</code> already cover a lot.</p>`,
        he: `<table><tr><th>כלי</th><th>איפה</th><th>במה הוא טוב</th></tr>
<tr><td>Chaos Monkey (Netflix)</td><td>VMs / Spinnaker</td><td>הורג instances באקראי בשעות העבודה; המקורי. חלק מה-"Simian Army" (Latency Monkey, Chaos Gorilla ל-AZs שלמים, Chaos Kong ל-regions).</td></tr>
<tr><td>LitmusChaos</td><td>Kubernetes (CNCF)</td><td>CRDs של ChaosExperiment: pod-delete, node-drain, network latency/loss, CPU/memory hog; ספריית ChaosHub.</td></tr>
<tr><td>Chaos Mesh</td><td>Kubernetes (CNCF)</td><td>תקלות pod/network/IO/time/kernel עם דשבורד ותזמונים.</td></tr>
<tr><td>AWS FIS</td><td>מנוהל ב-AWS</td><td>לעצור EC2, failover ל-RDS, throttle ל-APIs, לשבש קישוריות AZ, להזריק תקלות ל-pods ב-EKS; stop conditions דרך CloudWatch alarms.</td></tr>
<tr><td>Azure Chaos Studio</td><td>מנוהל ב-Azure</td><td>תקלות דומות למשאבי Azure ול-AKS.</td></tr>
<tr><td>Gremlin</td><td>SaaS מסחרי</td><td>התקפות מבוססות agent (CPU, blackhole, latency, shutdown) עם UI מלוטש, בקרות בטיחות ו-reliability scoring.</td></tr>
<tr><td>Toxiproxy</td><td>Dev / CI</td><td>TCP proxy שמוסיף latency, timeouts, הגבלת bandwidth — מעולה לבדיקת עמידות של שירות בודד ב-CI.</td></tr></table>
<p>לא צריך כלי כדי להתחיל: <code>kubectl delete pod</code>, <code>tc qdisc add ... netem delay 300ms</code> ו-<code>stress-ng</code> כבר מכסים הרבה.</p>`
      }
    },
    {
      h: { en: "Game days", he: "Game days" },
      body: {
        en: `<p>A <strong>game day</strong> is a scheduled, team-wide chaos session — part experiment, part incident-response rehearsal. A typical 2-3 hour agenda:</p>
<ol><li>Pick a scenario: "primary DB fails over", "payment provider returns 503 for 10 minutes", "us-east-1a disappears".</li>
<li>Write the hypothesis and stop conditions; pick a facilitator (the "game master") and an observer/scribe.</li>
<li>Inject the fault. The on-call team responds as if it were real: do alerts fire? Do runbooks work? Does the dashboard show the problem?</li>
<li>Roll back, then debrief: what surprised us? Which action items?</li></ol>
<p>Variants: <strong>tabletop exercises</strong> (talk through a scenario with no real fault — great for DR and security incidents) and <strong>"wheel of misfortune"</strong> (replay an old incident and have a new on-call engineer drive it).</p>
<blockquote>💡 Real world: Game days are the best on-call training there is. Engineers who handled a simulated DB failover at noon are dramatically calmer handling the real one at midnight.</blockquote>`,
        he: `<p><strong>Game day</strong> הוא סשן chaos מתוזמן לכל הצוות — חצי ניסוי, חצי חזרה גנרלית לטיפול באירוע. אג'נדה טיפוסית של 2-3 שעות:</p>
<ol><li>בוחרים תרחיש: "ה-DB הראשי עושה failover", "ספק התשלומים מחזיר 503 ל-10 דקות", "us-east-1a נעלם".</li>
<li>כותבים השערה ו-stop conditions; בוחרים מנחה ("game master") ומתעד/צופה.</li>
<li>מזריקים את התקלה. צוות ה-on-call מגיב כאילו זה אמיתי: ההתראות קופצות? ה-runbooks עובדים? הדשבורד מראה את הבעיה?</li>
<li>Rollback, ואז debrief: מה הפתיע אותנו? אילו action items?</li></ol>
<p>וריאציות: <strong>tabletop exercises</strong> (עוברים על תרחיש בדיבור בלי תקלה אמיתית — מעולה ל-DR ולאירועי אבטחה) ו-<strong>"wheel of misfortune"</strong> (משחזרים אירוע ישן ונותנים לתורן חדש להוביל אותו).</p>
<blockquote>💡 מהשטח: Game days הם האימון הכי טוב ל-on-call שיש. מהנדסים שטיפלו ב-failover מדומה של DB בצהריים רגועים בהרבה כשהם מטפלים באמיתי בחצות.</blockquote>`
      }
    }
  ],
  diagram: `steady state ──> hypothesis ──> inject fault (small blast radius)
      ^                                   |
      |                          observe vs baseline
      |                            /            \\
   fix & repeat  <── weakness found      hypothesis held -> expand radius
                     (cheap lesson!)       (confidence++)
   STOP CONDITION hit? -> abort & roll back immediately`,
  handsOn: [
    {
      cmd: "kubectl delete pod $(kubectl get pods -l app=web -o name | head -1 | cut -d/ -f2)",
      what: { en: "The simplest chaos experiment: kill one pod and watch whether users notice (error rate, latency).", he: "ניסוי ה-chaos הכי פשוט: להרוג pod אחד ולראות אם המשתמשים מרגישים (error rate, latency)." }
    },
    {
      cmd: "sudo tc qdisc add dev eth0 root netem delay 300ms 50ms loss 2%",
      what: { en: "On a test Linux box: add 300±50 ms latency and 2% packet loss. Remove with 'sudo tc qdisc del dev eth0 root'.", he: "על מכונת Linux לטסטים: להוסיף 300±50ms latency ו-2% packet loss. להסיר עם 'sudo tc qdisc del dev eth0 root'." }
    },
    {
      cmd: "stress-ng --cpu 4 --vm 2 --vm-bytes 1G --timeout 60s",
      what: { en: "Hog CPU and memory for 60 seconds to test autoscaling, throttling and alerts.", he: "לחנוק CPU וזיכרון ל-60 שניות כדי לבדוק autoscaling, throttling והתראות." }
    },
    {
      cmd: "aws fis start-experiment --experiment-template-id EXT123abc",
      what: { en: "Run a predefined AWS FIS experiment template (with CloudWatch stop conditions configured).", he: "להריץ תבנית ניסוי מוגדרת מראש ב-AWS FIS (עם stop conditions של CloudWatch)." }
    }
  ],
  mnemonic: {
    en: "\"SHIELD\": Steady state, Hypothesis, Inject, Evaluate, Learn, Do it again (bigger). And: \"Small blast, big lesson.\"",
    he: "\"SHIELD\": Steady state, Hypothesis, Inject, Evaluate, Learn, Do it again (בגדול יותר). וגם: \"פיצוץ קטן, שיעור גדול.\""
  },
  pitfalls: [
    { en: "Starting in production with a big blast radius and no stop conditions — that's not chaos engineering, it's an outage.", he: "להתחיל בפרודקשן עם blast radius גדול ובלי stop conditions — זה לא chaos engineering, זו השבתה." },
    { en: "Running experiments without a hypothesis or steady-state metric, so you can't tell if anything was learned.", he: "להריץ ניסויים בלי השערה או מטריקת steady state, ואז אי אפשר לדעת אם למדת משהו." },
    { en: "Not fixing the findings. Chaos experiments that produce a backlog nobody works on just prove you're fragile.", he: "לא לתקן את הממצאים. ניסויי chaos שמייצרים backlog שאף אחד לא עובד עליו רק מוכיחים שאתה שביר." },
    { en: "Surprising the on-call team or running during peak/launch events.", he: "להפתיע את צוות ה-on-call או להריץ בזמן שיא/השקה." }
  ],
  interview: [
    {
      q: { en: "How would you introduce chaos engineering to a team that has never done it?", he: "איך היית מכניס chaos engineering לצוות שאף פעם לא עשה את זה?" },
      a: { en: "Start with observability and a steady-state SLI. Pick a fault we believe we handle (e.g., killing one pod), write a hypothesis and stop conditions, run it in staging during business hours with the team watching. Fix findings, then run the same experiment on one prod instance. Grow through regular game days, then automate recurring experiments in CI/CD. Build trust by being transparent and starting small.", he: "מתחילים עם observability ו-SLI של steady state. בוחרים תקלה שאנחנו מאמינים שאנחנו מטפלים בה (למשל להרוג pod אחד), כותבים השערה ו-stop conditions, מריצים ב-staging בשעות העבודה כשהצוות צופה. מתקנים ממצאים, ואז מריצים את אותו ניסוי על instance אחד בפרודקשן. מתרחבים דרך game days קבועים, ואז מאטמטים ניסויים חוזרים ב-CI/CD. בונים אמון דרך שקיפות והתחלה קטנה." }
    },
    {
      q: { en: "What is a 'steady state hypothesis' and why base it on business metrics?", he: "מה זה 'steady state hypothesis' ולמה לבסס אותה על מטריקות עסקיות?" },
      a: { en: "It's a measurable statement of normal behavior that should hold during the fault, e.g. 'orders/min within 5% of baseline and p99 < 400 ms'. Business/user metrics capture what actually matters; CPU might spike during a failover and that's fine as long as users are unaffected.", he: "זו טענה מדידה על התנהגות נורמלית שאמורה להחזיק בזמן התקלה, למשל 'הזמנות לדקה בטווח 5% מה-baseline ו-p99 מתחת ל-400ms'. מטריקות עסקיות/משתמש תופסות את מה שבאמת חשוב; ה-CPU יכול לקפוץ בזמן failover וזה בסדר כל עוד המשתמשים לא נפגעים." }
    }
  ],
  quiz: [
    {
      q: { en: "What's the right first chaos experiment for a team new to it?", he: "מה ניסוי ה-chaos הראשון הנכון לצוות חדש בתחום?" },
      options: [
        { en: "Take down a full production region during peak traffic", he: "להפיל region שלם בפרודקשן בזמן שיא" },
        { en: "Kill a single pod/instance in staging with a hypothesis and stop conditions", he: "להרוג pod/instance בודד ב-staging עם השערה ו-stop conditions" },
        { en: "Randomly delete database tables to test backups", he: "למחוק טבלאות DB באקראי כדי לבדוק גיבויים" },
        { en: "Run Chaos Monkey in prod without telling anyone, for realism", he: "להריץ Chaos Monkey בפרודקשן בלי לספר לאף אחד, בשביל הריאליזם" }
      ],
      answer: 1,
      explain: { en: "Start small (low blast radius), in a safe environment, scientifically. Scale up only after you trust the basics.", he: "מתחילים קטן (blast radius נמוך), בסביבה בטוחה, בצורה מדעית. מגדילים רק אחרי שסומכים על הבסיס." }
    },
    {
      q: { en: "Which tool is a CNCF project for chaos experiments on Kubernetes using CRDs?", he: "איזה כלי הוא פרויקט CNCF לניסויי chaos על Kubernetes שמבוסס על CRDs?" },
      options: [
        { en: "Gremlin", he: "Gremlin" },
        { en: "AWS FIS", he: "AWS FIS" },
        { en: "LitmusChaos", he: "LitmusChaos" },
        { en: "JMeter", he: "JMeter" }
      ],
      answer: 2,
      explain: { en: "LitmusChaos (and Chaos Mesh) are CNCF Kubernetes-native tools. Gremlin is commercial SaaS, FIS is AWS-managed, JMeter is a load tester.", he: "LitmusChaos (וגם Chaos Mesh) הם כלי CNCF מותאמים ל-Kubernetes. Gremlin הוא SaaS מסחרי, FIS מנוהל ב-AWS, ו-JMeter הוא כלי load testing." }
    },
    {
      q: { en: "During an experiment the error rate crosses the predefined stop condition. What happens?", he: "באמצע ניסוי ה-error rate חוצה את ה-stop condition שהוגדר מראש. מה קורה?" },
      options: [
        { en: "Continue to see how bad it gets — more data", he: "ממשיכים לראות כמה גרוע זה נהיה — יותר דאטה" },
        { en: "Abort and roll back the fault immediately, then analyze", he: "עוצרים ומחזירים את התקלה מיד, ואז מנתחים" },
        { en: "Increase the blast radius", he: "מגדילים את ה-blast radius" },
        { en: "Page the CEO", he: "מעירים את המנכ\"ל" }
      ],
      answer: 1,
      explain: { en: "Stop conditions exist to protect users. Hitting one means the hypothesis is disproved — you already learned the lesson.", he: "Stop conditions קיימים כדי להגן על המשתמשים. אם הגעת לאחד, ההשערה הופרכה — כבר למדת את השיעור." }
    }
  ],
  related: ["rel-ha", "rel-incident-management", "rel-bcdr"]
});

INFRA.lessons.push({
  id: "rel-capacity-planning",
  track: "reliability",
  order: 8,
  icon: "📈",
  level: 3,
  minutes: 11,
  title: { en: "Capacity Planning & Load Testing", he: "Capacity Planning ו-Load Testing" },
  tldr: {
    en: "Know your limits before users find them: measure capacity with load tests, keep headroom (~30-50%), remember that latency explodes as utilization approaches 100%, and use Little's Law to size concurrency.",
    he: "תכיר את הגבולות שלך לפני שהמשתמשים ימצאו אותם: מודדים קיבולת עם load tests, שומרים headroom (~30-50%), זוכרים ש-latency מתפוצץ כשהניצול מתקרב ל-100%, ומשתמשים ב-Little's Law כדי לחשב concurrency."
  },
  analogy: {
    en: "A highway. At 50% capacity, cars cruise. At 85%, one driver taps the brakes and a phantom jam appears. At 95%, you're parked. The road's 'throughput' barely rose from 85% to 95%, but travel time tripled. Servers, databases and queues behave exactly the same — that's the hockey stick.",
    he: "כביש מהיר. ב-50% קיבולת, המכוניות שטות. ב-85%, נהג אחד נוגע בברקס ופקק רפאים מופיע. ב-95%, אתה עומד. ה-'throughput' של הכביש כמעט לא עלה בין 85% ל-95%, אבל זמן הנסיעה שולש. שרתים, DBs ו-queues מתנהגים בדיוק אותו דבר — זה ה-hockey stick."
  },
  sections: [
    {
      h: { en: "Headroom: why you never run at 90%", he: "Headroom: למה אף פעם לא רצים על 90%" },
      body: {
        en: `<p><strong>Headroom</strong> is the spare capacity between normal peak and the point where things break. You need it for:</p>
<ul><li><strong>Failure</strong>: losing 1 of 3 AZs puts +50% load on the rest (see N+1 in HA).</li>
<li><strong>Spikes</strong>: a push notification or a TV ad can 3-10× traffic in a minute — faster than autoscaling reacts (new nodes take 2-5 minutes, plus app warm-up).</li>
<li><strong>Deploys</strong>: a rolling update with maxUnavailable removes capacity temporarily.</li>
<li><strong>Latency</strong>: queuing delay grows non-linearly (next section).</li></ul>
<table><tr><th>Resource</th><th>Typical target at peak</th></tr>
<tr><td>Stateless app CPU (with autoscaling)</td><td>50-70%</td></tr>
<tr><td>Database CPU</td><td>&lt; 50-60% (hard to scale fast)</td></tr>
<tr><td>Disk space</td><td>&lt; 70-80%, alert on days-until-full</td></tr>
<tr><td>Connection pools / thread pools</td><td>&lt; 70%</td></tr>
<tr><td>Network links</td><td>&lt; 50-60% sustained</td></tr></table>`,
        he: `<p><strong>Headroom</strong> זו הקיבולת הפנויה בין השיא הרגיל לנקודה שבה דברים נשברים. צריך אותה בשביל:</p>
<ul><li><strong>כשלים</strong>: נפילה של 1 מתוך 3 AZs מוסיפה +50% עומס על השאר (ראה N+1 ב-HA).</li>
<li><strong>קפיצות</strong>: push notification או פרסומת בטלוויזיה יכולים להכפיל את הטראפיק פי 3-10 תוך דקה — מהר יותר ממה שה-autoscaling מגיב (nodes חדשים לוקחים 2-5 דקות, ועוד warm-up לאפליקציה).</li>
<li><strong>Deploys</strong>: rolling update עם maxUnavailable מוריד קיבולת זמנית.</li>
<li><strong>Latency</strong>: ה-queuing delay גדל באופן לא לינארי (בסעיף הבא).</li></ul>
<table><tr><th>משאב</th><th>יעד טיפוסי בשיא</th></tr>
<tr><td>CPU של אפליקציה stateless (עם autoscaling)</td><td>50-70%</td></tr>
<tr><td>CPU של DB</td><td>&lt; 50-60% (קשה לעשות לו scale מהר)</td></tr>
<tr><td>מקום בדיסק</td><td>&lt; 70-80%, התראה על ימים-עד-מלא</td></tr>
<tr><td>Connection pools / thread pools</td><td>&lt; 70%</td></tr>
<tr><td>קווי רשת</td><td>&lt; 50-60% לאורך זמן</td></tr></table>`
      }
    },
    {
      h: { en: "The hockey stick: utilization vs latency", he: "ה-hockey stick: ניצול מול latency" },
      body: {
        en: `<p>Queueing theory (the simple M/M/1 model) says average response time is <code>R = S / (1 − ρ)</code>, where <code>S</code> is service time and <code>ρ</code> is utilization. With S = 10 ms:</p>
<table><tr><th>Utilization ρ</th><th>Multiplier 1/(1−ρ)</th><th>Avg response</th></tr>
<tr><td>50%</td><td>2×</td><td>20 ms</td></tr>
<tr><td>70%</td><td>3.3×</td><td>33 ms</td></tr>
<tr><td>80%</td><td>5×</td><td>50 ms</td></tr>
<tr><td>90%</td><td>10×</td><td>100 ms</td></tr>
<tr><td>95%</td><td>20×</td><td>200 ms</td></tr>
<tr><td>99%</td><td>100×</td><td>1,000 ms</td></tr></table>
<p>Going from 50% to 90% utilization doesn't make you "40% busier" — it makes requests 5× slower. Tail latency (p99) is even worse than the average. Real systems with many workers (M/M/c) bend later and sharper, but the shape is the same: flat, then a wall.</p>
<blockquote>💡 Real world: "The DB is only at 85% CPU, we have room" is a famous last sentence. At 85% a small spike pushes it into the wall, queries pile up, connection pools exhaust, and app servers start timing out — a cascading failure that started with 'just' 15% more traffic.</blockquote>`,
        he: `<p>תורת התורים (מודל M/M/1 הפשוט) אומרת שזמן התגובה הממוצע הוא <code>R = S / (1 − ρ)</code>, כש-<code>S</code> הוא זמן השירות ו-<code>ρ</code> הוא הניצול. עם S = 10ms:</p>
<table><tr><th>ניצול ρ</th><th>מכפיל 1/(1−ρ)</th><th>זמן תגובה ממוצע</th></tr>
<tr><td>50%</td><td>2×</td><td>20ms</td></tr>
<tr><td>70%</td><td>3.3×</td><td>33ms</td></tr>
<tr><td>80%</td><td>5×</td><td>50ms</td></tr>
<tr><td>90%</td><td>10×</td><td>100ms</td></tr>
<tr><td>95%</td><td>20×</td><td>200ms</td></tr>
<tr><td>99%</td><td>100×</td><td>1,000ms</td></tr></table>
<p>מעבר מ-50% ל-90% ניצול לא הופך אותך ל"עסוק ב-40% יותר" — הוא הופך את הבקשות לאיטיות פי 5. ה-tail latency (p99) גרוע אפילו יותר מהממוצע. מערכות אמיתיות עם הרבה workers (M/M/c) מתעקמות מאוחר יותר ובחדות יותר, אבל הצורה זהה: שטוח, ואז קיר.</p>
<blockquote>💡 מהשטח: "ה-DB רק על 85% CPU, יש לנו מקום" זה משפט אחרון מפורסם. ב-85% קפיצה קטנה דוחפת אותו לקיר, השאילתות נערמות, ה-connection pools נגמרים, ושרתי האפליקציה מתחילים להיכנס ל-timeouts — cascading failure שהתחיל מ'רק' 15% יותר טראפיק.</blockquote>`
      }
    },
    {
      h: { en: "Little's Law: L = λW", he: "Little's Law: L = λW" },
      body: {
        en: `<p>For any stable system: <strong>average items in the system (L) = arrival rate (λ) × average time in the system (W)</strong>. No assumptions about distributions — it just works, which makes it the most useful formula in capacity planning.</p>
<ul><li><strong>Concurrency sizing</strong>: 2,000 req/s × 0.15 s latency = <strong>300 requests in flight</strong>. If each pod handles 50 concurrent requests, you need 6 pods — 9 with AZ-failure headroom.</li>
<li><strong>DB connection pool</strong>: 500 queries/s × 20 ms = 10 connections busy on average. A pool of 100 is massive overkill; a pool of 5 will queue.</li>
<li><strong>Why latency kills you</strong>: if the DB slows from 20 ms to 200 ms at the same 500 q/s, you suddenly need 100 connections. Slow dependency → pool exhaustion → outage.</li>
<li><strong>Queues</strong>: 1,000 msgs/s arriving and 30 s processing time per message means 30,000 messages in flight — size consumers accordingly.</li></ul>
<pre>L = λ × W
300 in-flight = 2000 req/s × 0.150 s</pre>`,
        he: `<p>בכל מערכת יציבה: <strong>מספר הפריטים הממוצע במערכת (L) = קצב ההגעה (λ) × הזמן הממוצע במערכת (W)</strong>. בלי הנחות על התפלגויות — זה פשוט עובד, וזה הופך אותה לנוסחה הכי שימושית ב-capacity planning.</p>
<ul><li><strong>חישוב concurrency</strong>: 2,000 req/s × 0.15 שניות latency = <strong>300 בקשות in flight</strong>. אם כל pod מטפל ב-50 בקשות במקביל, צריך 6 pods — 9 עם headroom לנפילת AZ.</li>
<li><strong>Connection pool ל-DB</strong>: 500 queries/s × 20ms = בממוצע 10 connections תפוסים. Pool של 100 זה overkill רציני; pool של 5 ייצור תור.</li>
<li><strong>למה latency הורג אותך</strong>: אם ה-DB מאט מ-20ms ל-200ms באותם 500 q/s, פתאום צריך 100 connections. תלות איטית → pool exhaustion → השבתה.</li>
<li><strong>Queues</strong>: 1,000 הודעות לשנייה שמגיעות ו-30 שניות עיבוד להודעה אומר 30,000 הודעות in flight — מגדירים consumers בהתאם.</li></ul>
<pre>L = λ × W
300 in-flight = 2000 req/s × 0.150 s</pre>`
      }
    },
    {
      h: { en: "Load testing: k6, JMeter, Locust", he: "Load testing: k6, JMeter, Locust" },
      body: {
        en: `<table><tr><th>Tool</th><th>Scripts in</th><th>Notes</th></tr>
<tr><td>k6 (Grafana)</td><td>JavaScript</td><td>CLI-first, efficient Go engine, thresholds that fail CI (e.g., p95 &lt; 300 ms)</td></tr>
<tr><td>JMeter (Apache)</td><td>GUI / XML</td><td>Veteran, protocols galore (JDBC, JMS, LDAP), heavier on resources</td></tr>
<tr><td>Locust</td><td>Python</td><td>User behavior as Python classes, distributed workers, web UI</td></tr>
<tr><td>Gatling</td><td>Scala/Java/Kotlin</td><td>High-performance, nice HTML reports</td></tr></table>
<p>Test types: <strong>load</strong> (expected peak), <strong>stress</strong> (ramp up until it breaks — find the knee), <strong>spike</strong> (0 → 10× in seconds), <strong>soak</strong> (normal load for 8-24 h — finds memory leaks and log/disk fill-ups).</p>
<blockquote>⚠️ Production tip: Load test with realistic data and traffic mix. 10,000 requests for the same cached product page proves your cache works, nothing else. Also make sure the load generator itself isn't the bottleneck (watch its CPU), and use open-model arrival rates — closed-loop tools that wait for responses hide latency problems ("coordinated omission").</blockquote>`,
        he: `<table><tr><th>כלי</th><th>כותבים ב-</th><th>הערות</th></tr>
<tr><td>k6 (Grafana)</td><td>JavaScript</td><td>CLI-first, מנוע Go יעיל, thresholds שמכשילים את ה-CI (למשל p95 מתחת ל-300ms)</td></tr>
<tr><td>JMeter (Apache)</td><td>GUI / XML</td><td>ותיק, המון פרוטוקולים (JDBC, JMS, LDAP), כבד יותר במשאבים</td></tr>
<tr><td>Locust</td><td>Python</td><td>התנהגות משתמש כ-classes בפייתון, workers מבוזרים, web UI</td></tr>
<tr><td>Gatling</td><td>Scala/Java/Kotlin</td><td>ביצועים גבוהים, דוחות HTML יפים</td></tr></table>
<p>סוגי טסטים: <strong>load</strong> (השיא הצפוי), <strong>stress</strong> (מעלים עד שנשבר — מוצאים את ה-knee), <strong>spike</strong> (0 → פי 10 תוך שניות), <strong>soak</strong> (עומס רגיל ל-8-24 שעות — מוצא memory leaks ודיסקים שמתמלאים בלוגים).</p>
<blockquote>⚠️ טיפ לפרודקשן: תעשה load test עם דאטה ותמהיל טראפיק ריאליסטיים. 10,000 בקשות לאותו עמוד מוצר שיושב ב-cache מוכיחות שה-cache עובד, ותו לא. תוודא גם שמחולל העומס עצמו הוא לא צוואר הבקבוק (תסתכל על ה-CPU שלו), ותשתמש ב-open-model arrival rates — כלים שמחכים לתשובה לפני הבקשה הבאה מסתירים בעיות latency ("coordinated omission").</blockquote>`
      }
    },
    {
      h: { en: "Forecasting and peak events", he: "תחזיות ואירועי שיא" },
      body: {
        en: `<p><strong>Organic forecasting</strong>: take 6-12 months of peak metrics (not averages!), fit a growth trend, and project when each resource hits its target utilization. Example: peak RPS grows 8% month over month; current peak 4,000 RPS, tested capacity 10,000 RPS at acceptable latency, target max 60% → 6,000 RPS. 4,000 × 1.08ⁿ = 6,000 → n ≈ 5.3 months. Order hardware/raise quotas/shard the DB <em>before</em> month 5.</p>
<p><strong>Inorganic / peak events</strong>: Black Friday, a product launch, a marketing campaign, the World Cup final, tax-filing deadline day. Treat them as projects:</p>
<ul><li>Get a traffic estimate from business (and multiply by 2 — marketing is optimistic, virality is not).</li>
<li>Load test to that number + headroom, weeks before.</li>
<li><strong>Pre-scale</strong> (autoscaling is too slow for a cliff), pre-warm caches and load balancers, raise cloud quotas.</li>
<li>Change freeze around the event; staffed war room on the day.</li>
<li>Prepare load-shedding switches: disable recommendations, serve static pages, queue checkouts.</li></ul>`,
        he: `<p><strong>תחזית אורגנית</strong>: לוקחים 6-12 חודשים של מטריקות שיא (לא ממוצעים!), מתאימים מגמת צמיחה, ומשליכים מתי כל משאב יגיע לניצול היעד שלו. דוגמה: ה-RPS בשיא גדל ב-8% מחודש לחודש; השיא הנוכחי 4,000 RPS, קיבולת שנבדקה 10,000 RPS ב-latency סביר, יעד מקסימלי 60% → 6,000 RPS. 4,000 × 1.08ⁿ = 6,000 → n ≈ 5.3 חודשים. מזמינים חומרה/מעלים quotas/עושים sharding ל-DB <em>לפני</em> חודש 5.</p>
<p><strong>אירועי שיא לא אורגניים</strong>: Black Friday, השקת מוצר, קמפיין שיווקי, גמר המונדיאל, היום האחרון להגשת דוחות למס הכנסה. מתייחסים אליהם כפרויקטים:</p>
<ul><li>מקבלים הערכת טראפיק מהביזנס (וכופלים ב-2 — השיווק אופטימי, ויראליות לא).</li>
<li>Load test למספר הזה + headroom, שבועות לפני.</li>
<li><strong>Pre-scale</strong> (autoscaling איטי מדי לצוק), pre-warm ל-caches ול-Load Balancers, העלאת quotas בענן.</li>
<li>Change freeze סביב האירוע; war room מאויש ביום עצמו.</li>
<li>מכינים מתגי load shedding: לכבות המלצות, להגיש עמודים סטטיים, לשים checkouts בתור.</li></ul>`
      }
    }
  ],
  diagram: `latency
  |                                        *
  |                                       *
  |                                     *
  |                                  *        <- the wall (~85-95%)
  |                            *
  |              *   *   *
  |  *   *   *
  +----+----+----+----+----+----+----+----+--> utilization
      10%  20%  30%  50%  60%  70%  80%  90% 100%

  Little's Law:  L (in flight) = lambda (req/s) x W (seconds)`,
  handsOn: [
    {
      cmd: "k6 run --vus 100 --duration 2m script.js",
      what: { en: "Run a k6 load test with 100 virtual users for 2 minutes; add thresholds like http_req_duration: ['p(95)<300'] in the script to fail CI on regressions.", he: "להריץ load test ב-k6 עם 100 virtual users ל-2 דקות; להוסיף thresholds כמו http_req_duration: ['p(95)<300'] בסקריפט כדי להכשיל את ה-CI ברגרסיות." }
    },
    {
      cmd: "locust -f locustfile.py --headless -u 500 -r 50 -t 10m --host https://staging.example.com",
      what: { en: "Locust headless: ramp to 500 users at 50 users/s for 10 minutes against staging.", he: "Locust בלי UI: עלייה ל-500 משתמשים בקצב 50 לשנייה למשך 10 דקות מול staging." }
    },
    {
      cmd: "node -e \"const lambda=2000, W=0.15; console.log('in flight:', lambda*W)\"",
      what: { en: "Little's Law in one line: change W to 1.5 s and see what a slow dependency does to concurrency.", he: "Little's Law בשורה אחת: תשנה את W ל-1.5 שניות ותראה מה תלות איטית עושה ל-concurrency." }
    },
    {
      cmd: "node -e \"for (const p of [0.5,0.7,0.8,0.9,0.95,0.99]) console.log(p*100+'%', (10/(1-p)).toFixed(0)+' ms')\"",
      what: { en: "Print the M/M/1 hockey stick for a 10 ms service time.", he: "להדפיס את ה-hockey stick של M/M/1 עבור זמן שירות של 10ms." }
    }
  ],
  mnemonic: {
    en: "\"Little's Law: Lines = Lambda × Wait\". And the hockey stick: \"80 is the new 100\" — plan as if 80% utilization is full.",
    he: "\"Little's Law: התור = קצב × המתנה\" (L = λW). וה-hockey stick: \"80 זה ה-100 החדש\" — מתכננים כאילו 80% ניצול זה מלא."
  },
  pitfalls: [
    { en: "Planning from averages. Daily average CPU of 30% can hide a 95% peak at 20:00 — always plan for peak (p95/p99 of load).", he: "לתכנן לפי ממוצעים. ממוצע יומי של 30% CPU יכול להסתיר שיא של 95% ב-20:00 — תמיד מתכננים לשיא (p95/p99 של העומס)." },
    { en: "Relying on autoscaling for sudden spikes. Scaling takes minutes; a flash crowd takes seconds. Pre-scale for known events.", he: "לסמוך על autoscaling בקפיצות פתאומיות. Scaling לוקח דקות; flash crowd לוקח שניות. עושים pre-scale לאירועים ידועים." },
    { en: "Load testing unrealistic traffic (one URL, cached, tiny dataset) or with a saturated load generator, producing beautiful but meaningless numbers.", he: "לעשות load test עם טראפיק לא ריאליסטי (URL אחד, ב-cache, dataset זעיר) או עם מחולל עומס חנוק, מה שמייצר מספרים יפים וחסרי משמעות." },
    { en: "Forgetting non-CPU limits: connection pools, file descriptors, cloud API quotas, NAT gateway ports, DB max_connections, licenses.", he: "לשכוח מגבלות שאינן CPU: connection pools, file descriptors, quotas של APIs בענן, ports ב-NAT gateway, max_connections ב-DB, רישיונות." }
  ],
  interview: [
    {
      q: { en: "Your service handles 3,000 req/s with 200 ms average latency. How many concurrent requests are in flight, and how many instances do you need if each handles 100 concurrently?", he: "השירות שלך מטפל ב-3,000 req/s עם latency ממוצע של 200ms. כמה בקשות in flight במקביל, וכמה instances צריך אם כל אחד מטפל ב-100 במקביל?" },
      a: { en: "Little's Law: L = 3,000 × 0.2 = 600 in flight → 6 instances at 100% of their concurrency. Targeting ~60-70% utilization → 9-10. To also survive losing one of three AZs at that target, go to 12-15 (4-5 per AZ); 9 (3 per AZ) only survives an AZ loss at full concurrency, with no headroom.", he: "Little's Law: L = 3,000 × 0.2 = 600 in flight → 6 instances ב-100% מה-concurrency שלהם. ביעד של ~60-70% ניצול → 9-10. כדי לשרוד גם נפילה של AZ אחד מתוך שלושה ביעד הזה, הולכים ל-12-15 (4-5 בכל AZ); 9 (3 בכל AZ) שורדים נפילת AZ רק בניצול מלא, בלי headroom." }
    },
    {
      q: { en: "Why does latency increase sharply as utilization approaches 100%?", he: "למה ה-latency עולה בחדות כשהניצול מתקרב ל-100%?" },
      a: { en: "Because of queueing: arrivals are bursty, so as the server gets busier, new requests increasingly find it occupied and wait. In M/M/1, response time is S/(1−ρ): 2× at 50%, 10× at 90%, 100× at 99%. That's why we keep headroom and alert on saturation well before 100%.", he: "בגלל תורים: הבקשות מגיעות בפרצים, אז ככל שהשרת עסוק יותר, יותר בקשות חדשות מוצאות אותו תפוס ומחכות. ב-M/M/1 זמן התגובה הוא S/(1−ρ): פי 2 ב-50%, פי 10 ב-90%, פי 100 ב-99%. בגלל זה שומרים headroom ומתריעים על saturation הרבה לפני 100%." }
    }
  ],
  quiz: [
    {
      q: { en: "An API receives 1,000 req/s and each request spends 50 ms in the service. On average, how many requests are in flight?", he: "API מקבל 1,000 req/s וכל בקשה מבלה 50ms בשירות. בממוצע, כמה בקשות in flight?" },
      options: [
        { en: "20", he: "20" },
        { en: "50", he: "50" },
        { en: "500", he: "500" },
        { en: "50,000", he: "50,000" }
      ],
      answer: 1,
      explain: { en: "L = λW = 1,000 × 0.05 = 50. (50,000 is the classic mistake of using 50 instead of 0.05 seconds.)", he: "L = λW = 1,000 × 0.05 = 50. (50,000 זו הטעות הקלאסית של להשתמש ב-50 במקום 0.05 שניות.)" }
    },
    {
      q: { en: "In a simple M/M/1 model, moving utilization from 50% to 90% changes average response time by:", he: "במודל M/M/1 פשוט, מעבר מ-50% ל-90% ניצול משנה את זמן התגובה הממוצע פי:" },
      options: [
        { en: "1.8× (proportional to load)", he: "פי 1.8 (פרופורציונלי לעומס)" },
        { en: "No change until 100%", he: "אין שינוי עד 100%" },
        { en: "5× (from 2× to 10× the service time)", he: "פי 5 (מפי 2 לפי 10 מזמן השירות)" },
        { en: "100×", he: "פי 100" }
      ],
      answer: 2,
      explain: { en: "1/(1−0.5) = 2 and 1/(1−0.9) = 10, so 5× slower. Latency is non-linear in utilization.", he: "1/(1−0.5) = 2 ו-1/(1−0.9) = 10, כלומר פי 5 יותר איטי. ה-latency לא לינארי ביחס לניצול." }
    },
    {
      q: { en: "Which test type is best for finding a slow memory leak?", he: "איזה סוג טסט הכי טוב למציאת memory leak איטי?" },
      options: [
        { en: "Spike test", he: "Spike test" },
        { en: "Stress test", he: "Stress test" },
        { en: "Soak test (normal load for many hours)", he: "Soak test (עומס רגיל להרבה שעות)" },
        { en: "Unit test", he: "Unit test" }
      ],
      answer: 2,
      explain: { en: "Leaks, unrotated logs and connection leaks only show up over time. Stress/spike tests are short and focus on limits and bursts.", he: "Leaks, לוגים שלא עוברים rotation ודליפות connections מופיעים רק לאורך זמן. Stress/spike tests קצרים ומתמקדים בגבולות ובפרצים." }
    },
    {
      q: { en: "Marketing announces a TV campaign expected to bring 5× traffic within one minute. Best preparation?", he: "השיווק מודיע על קמפיין טלוויזיה שצפוי להביא פי 5 טראפיק תוך דקה. מה ההכנה הכי טובה?" },
      options: [
        { en: "Rely on the HPA — that's what autoscaling is for", he: "לסמוך על ה-HPA — בשביל זה יש autoscaling" },
        { en: "Load test beforehand, pre-scale before air time, raise quotas, prepare load-shedding switches", he: "Load test מראש, pre-scale לפני השידור, להעלות quotas, להכין מתגי load shedding" },
        { en: "Deploy a big refactor the same morning so it's ready", he: "לעשות deploy לריפקטור גדול באותו בוקר כדי שיהיה מוכן" },
        { en: "Lower the SLO for that day and hope", he: "להוריד את ה-SLO לאותו יום ולקוות" }
      ],
      answer: 1,
      explain: { en: "Autoscaling reacts in minutes, the spike arrives in seconds. Known peaks need pre-scaling, testing, a change freeze and degradation plans.", he: "Autoscaling מגיב תוך דקות, הקפיצה מגיעה תוך שניות. שיאים ידועים דורשים pre-scale, טסטים, change freeze ותוכניות degradation." }
    }
  ],
  playground: "scaling",
  related: ["rel-ha", "obs-golden-signals", "rel-chaos-engineering"]
});

/* ---------------- Glossary ---------------- */
[
  ["SLI", "Service Level Indicator: a measured ratio of good events to valid events, e.g. % of requests under 300 ms.", "Service Level Indicator: יחס נמדד של אירועים טובים לאירועים תקינים, למשל % בקשות מתחת ל-300ms.", "rel-sli-slo-sla"],
  ["SLO", "Service Level Objective: an internal target for an SLI over a time window, e.g. 99.9% over 28 days.", "Service Level Objective: יעד פנימי ל-SLI על פני חלון זמן, למשל 99.9% על 28 יום.", "rel-sli-slo-sla"],
  ["SLA", "Service Level Agreement: a contract with customers that defines penalties (usually service credits) if availability falls below a threshold.", "Service Level Agreement: חוזה מול לקוחות שמגדיר קנסות (בדרך כלל service credits) אם ה-availability יורד מתחת לסף.", "rel-sli-slo-sla"],
  ["Nines", "Shorthand for availability: 'three nines' = 99.9% ≈ 43.8 min downtime per month; each extra nine is 10× less.", "קיצור ל-availability: 'three nines' = 99.9% ≈ 43.8 דקות downtime בחודש; כל nine נוסף זה פי 10 פחות.", "rel-sli-slo-sla"],
  ["Error budget", "1 − SLO: the amount of failure you can afford in a window, spent on deploys and experiments.", "1 − SLO: כמות הכשלים שמותר לך בחלון זמן, שמבזבזים על deploys וניסויים.", "rel-error-budgets"],
  ["Burn rate", "How fast the error budget is consumed relative to the SLO pace: observed error rate / (1 − SLO).", "כמה מהר נצרך ה-error budget ביחס לקצב ה-SLO: error rate נמדד / (1 − SLO).", "rel-error-budgets"],
  ["Error budget policy", "Pre-agreed rules for what happens as budget depletes, typically a feature freeze when it's exhausted.", "חוקים מוסכמים מראש למה שקורה כשה-budget מתרוקן, בדרך כלל feature freeze כשהוא נגמר.", "rel-error-budgets"],
  ["Composite availability", "Availability of a chain of dependencies: serial components multiply (0.999³ ≈ 99.7%).", "ה-availability של שרשרת תלויות: רכיבים בטור מוכפלים (0.999³ ≈ 99.7%).", "rel-error-budgets"],
  ["SPOF", "Single Point Of Failure: a component whose failure takes down the whole service.", "Single Point Of Failure: רכיב שהכשל שלו מפיל את כל השירות.", "rel-ha"],
  ["N+1", "Provisioning one more unit than needed for peak load, so one can fail without overload.", "להקצות יחידה אחת יותר ממה שצריך לשיא, כדי שאחת תוכל ליפול בלי עומס יתר.", "rel-ha"],
  ["Active-active", "All redundant nodes serve traffic simultaneously; failover is just removing the dead one.", "כל ה-nodes המיותרים מגישים טראפיק במקביל; failover זה פשוט להוציא את המת.", "rel-ha"],
  ["Active-passive", "A primary serves traffic while a standby waits to be promoted on failure.", "Primary מגיש טראפיק בזמן ש-standby מחכה ל-promote במקרה של כשל.", "rel-ha"],
  ["Failover", "Automatically or manually shifting traffic/role from a failed component to a healthy redundant one.", "העברה אוטומטית או ידנית של טראפיק/תפקיד מרכיב שנפל לרכיב מיותר בריא.", "rel-ha"],
  ["Split brain", "Two nodes both believe they're primary and accept conflicting writes; prevented with quorum.", "שני nodes שכל אחד מהם חושב שהוא ה-primary ומקבל כתיבות סותרות; מונעים עם quorum.", "rel-ha"],
  ["RPO", "Recovery Point Objective: maximum acceptable data loss, measured in time before the disaster.", "Recovery Point Objective: אובדן הדאטה המקסימלי המקובל, נמדד בזמן לפני האסון.", "rel-bcdr"],
  ["RTO", "Recovery Time Objective: maximum acceptable time from disaster until service is restored.", "Recovery Time Objective: הזמן המקסימלי המקובל מהאסון ועד שהשירות חוזר.", "rel-bcdr"],
  ["Pilot light", "DR strategy where data is replicated live but compute is off/minimal until a disaster.", "אסטרטגיית DR שבה הדאטה משוכפל live אבל ה-compute כבוי/מינימלי עד לאסון.", "rel-bcdr"],
  ["Warm standby", "DR strategy with a full but scaled-down copy of production running in another region.", "אסטרטגיית DR עם עותק מלא אבל מוקטן של הפרודקשן שרץ ב-region אחר.", "rel-bcdr"],
  ["Immutable backup", "A backup that cannot be modified or deleted until retention expires (e.g., S3 Object Lock), even by admins.", "גיבוי שאי אפשר לשנות או למחוק עד שה-retention נגמר (למשל S3 Object Lock), אפילו לא אדמין.", "rel-bcdr"],
  ["3-2-1 rule", "Keep 3 copies of data on 2 different media with 1 off-site (extended: +1 immutable, 0 restore errors).", "להחזיק 3 עותקים של הדאטה על 2 סוגי מדיה עם 1 מחוץ לאתר (בגרסה המורחבת: +1 immutable, 0 שגיאות שחזור).", "rel-bcdr"],
  ["Incident Commander", "The person who coordinates an incident: decisions, task assignment, communication — not hands-on debugging.", "האדם שמתאם את האירוע: החלטות, חלוקת משימות, תקשורת — לא מדבג בעצמו.", "rel-incident-management"],
  ["Blameless postmortem", "A post-incident review that focuses on systemic causes and action items, not on blaming individuals.", "תחקיר אחרי אירוע שמתמקד בסיבות מערכתיות וב-action items, לא בהאשמת אנשים.", "rel-incident-management"],
  ["MTTR", "Mean Time To Recover/Restore: average time from failure start until service is restored.", "Mean Time To Recover/Restore: הזמן הממוצע מתחילת הכשל ועד שהשירות חוזר.", "rel-incident-management"],
  ["MTBF", "Mean Time Between Failures: average uptime between incidents; availability ≈ MTBF / (MTBF + MTTR).", "Mean Time Between Failures: זמן תקינות ממוצע בין אירועים; availability ≈ MTBF / (MTBF + MTTR).", "rel-incident-management"],
  ["Canary deployment", "Releasing a new version to a small % of traffic and expanding only if metric gates pass.", "שחרור גרסה חדשה לאחוז קטן מהטראפיק והרחבה רק אם ה-metric gates עוברים.", "rel-deployments"],
  ["Blue/green deployment", "Two full environments; deploy to the idle one, then switch all traffic at once (instant rollback).", "שתי סביבות מלאות; עושים deploy לזו שלא פעילה ומעבירים את כל הטראפיק בבת אחת (rollback מיידי).", "rel-deployments"],
  ["Feature flag", "A runtime toggle that decouples deploying code from releasing a feature to users.", "מתג בזמן ריצה שמפריד בין deploy של קוד לבין שחרור פיצ'ר למשתמשים.", "rel-deployments"],
  ["Blast radius", "How much of the system or user base is affected if a change or experiment goes wrong.", "כמה מהמערכת או מהמשתמשים נפגעים אם שינוי או ניסוי משתבש.", "rel-chaos-engineering"],
  ["Game day", "A planned exercise where a team injects failures and practices response as if it were real.", "תרגיל מתוכנן שבו צוות מזריק כשלים ומתרגל תגובה כאילו זה אמיתי.", "rel-chaos-engineering"],
  ["Little's Law", "L = λW: items in a system = arrival rate × time each spends in it; used to size concurrency and pools.", "L = λW: פריטים במערכת = קצב הגעה × הזמן שכל אחד מבלה בה; משמש לחישוב concurrency ו-pools.", "rel-capacity-planning"]
].forEach(([term, en, he, lesson]) => INFRA.glossary.push({ term, track: "reliability", def: { en, he }, lesson }));
