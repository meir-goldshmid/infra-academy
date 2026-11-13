/* Principal Engineer Playbook — essentials: time, auth, IDs, tenancy, security, races, frontend, hashing, bits, encoding. */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-time-timestamps",
  track: "principal",
  order: 70,
  icon: "🕰️",
  level: 2,
  minutes: 13,
  title: { en: "Time & Timestamps: UTC, Time Zones, DST and Clocks", he: "זמן ו-Timestamps: UTC, אזורי זמן, שעון קיץ ושעונים" },
  tldr: {
    en: "Store instants in UTC, store future human events as local time + IANA zone, measure durations with a monotonic clock, and never trust two machines to agree on 'now'.",
    he: "שומרים רגעים ב-UTC, אירועים אנושיים עתידיים כשעה מקומית + אזור IANA, מודדים משכי זמן עם שעון מונוטוני, ולעולם לא סומכים ששתי מכונות מסכימות מה זה 'עכשיו'."
  },
  analogy: {
    en: "UTC is the single master clock at the train company's HQ; every station shows local time on its wall, but the timetable database is written in HQ time. A dentist appointment is different: 'Tuesday 10:00 in Tel Aviv' must stay 10:00 even if the government moves DST next year — so you store the wall-clock promise, not the HQ instant. And a stopwatch (monotonic clock) doesn't care what the wall clock says; if someone adjusts the wall clock mid-race, your stopwatch still measures the race correctly.",
    he: "UTC זה השעון הראשי במטה של רכבת ישראל; בכל תחנה תלוי שעון מקומי, אבל לוח הזמנים ב-DB כתוב בשעון המטה. תור לרופא שיניים זה סיפור אחר: 'שלישי 10:00 בתל אביב' חייב להישאר 10:00 גם אם הממשלה תזיז את שעון הקיץ בשנה הבאה — אז שומרים את ההבטחה בשעון הקיר, לא את הרגע במטה. ו-stopwatch (שעון מונוטוני) לא מתעניין מה שעון הקיר אומר; אם מישהו מכוון את שעון הקיר באמצע ריצה, ה-stopwatch עדיין מודד נכון."
  },
  sections: [
    {
      h: { en: "Instants vs wall-clock times", he: "רגעים (instants) מול שעון קיר" },
      body: {
        en: `<p>There are two different things people call "a time":</p>
<ul>
<li><strong>Instant</strong>: a point on the universal timeline. "The payment happened at <code>2026-11-13T08:15:02Z</code>." Same moment everywhere. Store as UTC (or epoch). Logs, events, created_at, expiry — all instants.</li>
<li><strong>Civil / wall-clock time</strong>: what a human reads on a clock in a place. "The meeting is every Monday at 09:00 Asia/Jerusalem." Its instant depends on the time-zone rules <em>at that future date</em>, which governments change.</li>
</ul>
<table>
<tr><th>Data</th><th>Store as</th></tr>
<tr><td>Log line, event, created_at</td><td>UTC instant (<code>timestamptz</code>)</td></tr>
<tr><td>Token expiry, TTL</td><td>UTC instant / epoch seconds</td></tr>
<tr><td>Future appointment</td><td>local datetime + IANA zone</td></tr>
<tr><td>Birthday, holiday</td><td>plain date (no time, no zone)</td></tr>
<tr><td>Store opening hours</td><td>local time + zone</td></tr>
</table>
<blockquote>💡 Real world: Israel changed its DST rules in 2013, and countries like Egypt, Mexico and Brazil changed theirs with weeks of notice. Every app that stored future meetings as UTC instants shifted them by an hour. The IANA tz database (<code>tzdata</code>) ships several releases a year because of this.</blockquote>`,
        he: `<p>יש שני דברים שונים שאנשים קוראים להם "זמן":</p>
<ul>
<li><strong>Instant (רגע)</strong>: נקודה על ציר הזמן האוניברסלי. "התשלום קרה ב-<code>2026-11-13T08:15:02Z</code>." אותו רגע בכל מקום. שומרים כ-UTC (או epoch). לוגים, events, created_at, expiry — כולם instants.</li>
<li><strong>שעון קיר (civil time)</strong>: מה שבן אדם קורא על שעון במקום מסוים. "הפגישה כל שני ב-09:00 Asia/Jerusalem." ה-instant שלה תלוי בחוקי אזור הזמן <em>בתאריך העתידי ההוא</em>, וממשלות משנות אותם.</li>
</ul>
<table>
<tr><th>מידע</th><th>שומרים כ-</th></tr>
<tr><td>שורת לוג, event, created_at</td><td>UTC instant (<code>timestamptz</code>)</td></tr>
<tr><td>תפוגת token, TTL</td><td>UTC instant / epoch seconds</td></tr>
<tr><td>תור עתידי</td><td>local datetime + IANA zone</td></tr>
<tr><td>יום הולדת, חג</td><td>תאריך בלבד (בלי שעה ובלי zone)</td></tr>
<tr><td>שעות פתיחה של חנות</td><td>שעה מקומית + zone</td></tr>
</table>
<blockquote>💡 מהשטח: ישראל שינתה את חוקי שעון הקיץ ב-2013, ומדינות כמו מצרים, מקסיקו וברזיל שינו עם התראה של שבועות. כל אפליקציה ששמרה פגישות עתידיות כ-UTC instants הזיזה אותן בשעה. ה-IANA tz database (<code>tzdata</code>) מוציא כמה גרסאות בשנה בגלל זה.</blockquote>`
      }
    },
    {
      h: { en: "Formats: ISO 8601, RFC 3339 and epoch", he: "פורמטים: ISO 8601, RFC 3339 ו-epoch" },
      body: {
        en: `<pre>RFC 3339 / ISO 8601   2026-11-13T08:15:02.123Z
with offset           2026-11-13T10:15:02.123+02:00
Unix epoch (s)        1794557702
Unix epoch (ms)       1794557702123   (JS Date.now())
Bad: ambiguous        11/03/2026 10:15   (Nov 3 or Mar 11?)</pre>
<ul>
<li><strong>Use RFC 3339 in APIs</strong> (a strict profile of ISO 8601): sortable as strings, unambiguous, with <code>Z</code> or an offset.</li>
<li><strong>An offset is not a zone.</strong> <code>+02:00</code> tells you this instant's offset, not that the user is in Jerusalem (Cairo and Johannesburg are also +02:00 sometimes). Store the IANA name (<code>Asia/Jerusalem</code>) if you need rules.</li>
<li><strong>Epoch seconds vs milliseconds</strong>: mixing them gives dates in 1970 or year 58,000. Name fields with units: <code>expires_at_ms</code>.</li>
<li><strong>Year 2038</strong>: a signed 32-bit <code>time_t</code> overflows at <code>2038-01-19T03:14:07Z</code> (2^31 − 1 seconds). 64-bit fixes it; check embedded devices, old MySQL <code>TIMESTAMP</code> columns and file formats.</li>
</ul>`,
        he: `<pre>RFC 3339 / ISO 8601   2026-11-13T08:15:02.123Z
with offset           2026-11-13T10:15:02.123+02:00
Unix epoch (s)        1794557702
Unix epoch (ms)       1794557702123   (JS Date.now())
Bad: ambiguous        11/03/2026 10:15   (Nov 3 or Mar 11?)</pre>
<ul>
<li><strong>ב-APIs משתמשים ב-RFC 3339</strong> (פרופיל קפדני של ISO 8601): ממוין כמחרוזת, חד-משמעי, עם <code>Z</code> או offset.</li>
<li><strong>Offset זה לא zone.</strong> <code>+02:00</code> אומר מה ה-offset של הרגע הזה, לא שהמשתמש בירושלים (גם קהיר ויוהנסבורג לפעמים +02:00). אם צריך את החוקים — שומרים שם IANA (<code>Asia/Jerusalem</code>).</li>
<li><strong>Epoch בשניות מול מילישניות</strong>: ערבוב נותן תאריכים ב-1970 או בשנת 58,000. שמות שדות עם יחידות: <code>expires_at_ms</code>.</li>
<li><strong>שנת 2038</strong>: <code>time_t</code> חתום של 32 ביט גולש ב-<code>2038-01-19T03:14:07Z</code> (2^31 − 1 שניות). 64 ביט פותר; בודקים מכשירים embedded, עמודות <code>TIMESTAMP</code> ישנות ב-MySQL ופורמטים של קבצים.</li>
</ul>`
      }
    },
    {
      h: { en: "Postgres: timestamp vs timestamptz", he: "Postgres: timestamp מול timestamptz" },
      body: {
        en: `<p><code>timestamptz</code> does <em>not</em> store a zone. It converts input to UTC and stores the instant; on output it renders in the session's <code>TimeZone</code>. <code>timestamp</code> (without time zone) stores the raw digits and has no idea which instant they mean.</p>
<pre>SET TimeZone = 'Asia/Jerusalem';
SELECT '2026-03-27 02:30'::timestamptz;
-- DST gap in Israel: 02:00 jumps to 03:00
-- result: 2026-03-27 03:30:00+03

CREATE TABLE events (
  id          bigint PRIMARY KEY,
  happened_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE appointments (
  id        bigint PRIMARY KEY,
  local_at  timestamp NOT NULL,     -- 2027-05-04 10:00
  tz        text NOT NULL           -- 'Asia/Jerusalem'
);
-- compute the instant at read time with current rules:
SELECT local_at AT TIME ZONE tz AS starts_at FROM appointments;</pre>
<blockquote>⚠️ Production tip: Set servers, containers and DB sessions to UTC (<code>TZ=UTC</code>). Convert to the user's zone only at the edge — in the UI or the email template. A server in local time will log a duplicated hour every autumn when DST ends.</blockquote>`,
        he: `<p><code>timestamptz</code> <em>לא</em> שומר zone. הוא ממיר את הקלט ל-UTC ושומר את ה-instant; בפלט הוא מציג לפי ה-<code>TimeZone</code> של ה-session. <code>timestamp</code> (בלי time zone) שומר את הספרות כמו שהן ואין לו מושג לאיזה רגע הן מתכוונות.</p>
<pre>SET TimeZone = 'Asia/Jerusalem';
SELECT '2026-03-27 02:30'::timestamptz;
-- DST gap in Israel: 02:00 jumps to 03:00
-- result: 2026-03-27 03:30:00+03

CREATE TABLE events (
  id          bigint PRIMARY KEY,
  happened_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE appointments (
  id        bigint PRIMARY KEY,
  local_at  timestamp NOT NULL,     -- 2027-05-04 10:00
  tz        text NOT NULL           -- 'Asia/Jerusalem'
);
-- compute the instant at read time with current rules:
SELECT local_at AT TIME ZONE tz AS starts_at FROM appointments;</pre>
<blockquote>⚠️ טיפ לפרודקשן: שרתים, קונטיינרים ו-sessions של DB על UTC (<code>TZ=UTC</code>). ממירים לאזור של המשתמש רק בקצה — ב-UI או בתבנית המייל. שרת בשעון מקומי ירשום שעה כפולה בלוגים כל סתיו כששעון הקיץ נגמר.</blockquote>`
      }
    },
    {
      h: { en: "Wall clock vs monotonic clock, NTP and skew", he: "שעון קיר מול שעון מונוטוני, NTP ו-skew" },
      body: {
        en: `<p>The <strong>wall clock</strong> (<code>CLOCK_REALTIME</code>, <code>Date.now()</code>, <code>time.time()</code>) can jump backwards or forwards when NTP corrects it or an admin changes it. The <strong>monotonic clock</strong> (<code>CLOCK_MONOTONIC</code>, <code>performance.now()</code>, <code>time.monotonic()</code>, Go's <code>time.Since</code>) only moves forward — use it for durations, timeouts and latency metrics.</p>
<pre># Python: measuring a request
start = time.monotonic()
call_service()
elapsed_ms = (time.monotonic() - start) * 1000

# WRONG: may be negative after an NTP step
start = time.time(); ...; time.time() - start</pre>
<ul>
<li><strong>NTP / chrony</strong> keep servers within ~1-10 ms in a good datacenter; cloud providers offer local time sources (AWS Time Sync 169.254.169.123, Google metadata NTP). Without it, a VM drifts seconds per day.</li>
<li><strong>Clock skew</strong> between machines means you cannot order events from different hosts by timestamp alone — two writes 2 ms apart on different nodes may be recorded in the wrong order. Use logical/hybrid clocks or a single sequencer (see <code>staff-time-ordering</code>).</li>
<li><strong>Leap seconds</strong>: Google/AWS "smear" the extra second over 24 h so clocks never show 23:59:60. Leap seconds are planned to be abolished by 2035.</li>
<li><strong>Client clocks lie</strong>: a phone can be hours off. Never trust client time for expiry, rate limiting or ordering; record server receive time too.</li>
</ul>`,
        he: `<p><strong>שעון הקיר</strong> (<code>CLOCK_REALTIME</code>, <code>Date.now()</code>, <code>time.time()</code>) יכול לקפוץ אחורה או קדימה כש-NTP מתקן אותו או כשאדמין משנה. <strong>השעון המונוטוני</strong> (<code>CLOCK_MONOTONIC</code>, <code>performance.now()</code>, <code>time.monotonic()</code>, <code>time.Since</code> ב-Go) רק מתקדם — משתמשים בו למשכי זמן, timeouts ומדדי latency.</p>
<pre># Python: measuring a request
start = time.monotonic()
call_service()
elapsed_ms = (time.monotonic() - start) * 1000

# WRONG: may be negative after an NTP step
start = time.time(); ...; time.time() - start</pre>
<ul>
<li><strong>NTP / chrony</strong> מחזיקים שרתים בטווח של ~1-10 ms בדאטה-סנטר טוב; ספקי ענן נותנים מקור זמן מקומי (AWS Time Sync 169.254.169.123, NTP של metadata ב-Google). בלי זה VM זוחל שניות ביום.</li>
<li><strong>Clock skew</strong> בין מכונות אומר שאי אפשר לסדר events מ-hosts שונים לפי timestamp בלבד — שתי כתיבות בהפרש 2 ms על nodes שונים עלולות להירשם בסדר הפוך. משתמשים ב-logical/hybrid clocks או ב-sequencer יחיד (ראו <code>staff-time-ordering</code>).</li>
<li><strong>Leap seconds</strong>: Google/AWS "מורחים" (smear) את השנייה הנוספת על 24 שעות כך שהשעון אף פעם לא מראה 23:59:60. מתוכנן לבטל leap seconds עד 2035.</li>
<li><strong>שעונים של לקוחות משקרים</strong>: טלפון יכול להיות בפער של שעות. לעולם לא סומכים על זמן הלקוח ל-expiry, rate limiting או סדר; רושמים גם את זמן הקבלה בשרת.</li>
</ul>`
      }
    },
    {
      h: { en: "Date bugs gallery", he: "גלריית באגים של תאריכים" },
      body: {
        en: `<table>
<tr><th>Bug</th><th>Cause</th><th>Fix</th></tr>
<tr><td>Nightly job ran twice / skipped</td><td>Cron at 02:30 local on DST change day</td><td>Schedule cron in UTC</td></tr>
<tr><td>"Today's" report missing 2 h</td><td>Day boundary computed in UTC, user in +02:00</td><td>Compute day range in the user's zone</td></tr>
<tr><td>Token valid until 1970</td><td>Seconds parsed as ms</td><td>Units in field names, validate ranges</td></tr>
<tr><td>Adding 1 day = 23 h</td><td>Adding 86400 s across DST</td><td>Use calendar arithmetic in a zone-aware lib</td></tr>
<tr><td>Month +1 from Jan 31</td><td>Feb 31 doesn't exist</td><td>Define clamping rule (Feb 28/29)</td></tr>
<tr><td>Events out of order</td><td>Clock skew across hosts</td><td>Sequence numbers / HLC</td></tr>
<tr><td>Wrong week number</td><td>ISO week vs US week</td><td>Be explicit: ISO 8601 weeks</td></tr>
</table>
<blockquote>💡 Real world: In JS prefer <code>Temporal</code> (now shipping in browsers) or <code>date-fns-tz</code>/<code>Luxon</code> over the legacy <code>Date</code>; in Java <code>java.time</code> (<code>Instant</code>, <code>ZonedDateTime</code>); in Python <code>datetime</code> with <code>zoneinfo</code>, never naive datetimes.</blockquote>`,
        he: `<table>
<tr><th>באג</th><th>סיבה</th><th>תיקון</th></tr>
<tr><td>Job לילי רץ פעמיים / דילג</td><td>Cron ב-02:30 שעון מקומי ביום מעבר שעון</td><td>מתזמנים cron ב-UTC</td></tr>
<tr><td>בדוח "של היום" חסרות שעתיים</td><td>גבולות היום חושבו ב-UTC, המשתמש ב-+02:00</td><td>מחשבים טווח יום באזור של המשתמש</td></tr>
<tr><td>Token בתוקף עד 1970</td><td>שניות פוענחו כמילישניות</td><td>יחידות בשם השדה, בדיקת טווחים</td></tr>
<tr><td>הוספת יום = 23 שעות</td><td>הוספת 86400 שניות על פני DST</td><td>חשבון קלנדרי בספרייה מודעת zone</td></tr>
<tr><td>חודש +1 מ-31 בינואר</td><td>אין 31 בפברואר</td><td>מגדירים כלל clamp (28/29 בפברואר)</td></tr>
<tr><td>Events לא בסדר</td><td>Clock skew בין hosts</td><td>מספרי sequence / HLC</td></tr>
<tr><td>מספר שבוע שגוי</td><td>שבוע ISO מול שבוע אמריקאי</td><td>מפורשים: שבועות ISO 8601</td></tr>
</table>
<blockquote>💡 מהשטח: ב-JS עדיף <code>Temporal</code> (כבר נתמך בדפדפנים) או <code>date-fns-tz</code>/<code>Luxon</code> על פני ה-<code>Date</code> הישן; ב-Java <code>java.time</code> (<code>Instant</code>, <code>ZonedDateTime</code>); ב-Python <code>datetime</code> עם <code>zoneinfo</code>, ואף פעם לא naive datetimes.</blockquote>`
      }
    }
  ],
  diagram: `user in Tel Aviv            server (TZ=UTC)            DB
 "Mon 09:00"  --local+zone-->  API  --UTC instant-->  timestamptz
     ^                          |
     +--- render in user zone --+

wall clock:  10:00:00 --NTP step back--> 09:59:58   (can jump!)
monotonic :  1500.000 ---------------->  1502.003   (only forward)`,
  handsOn: [
    { cmd: "date -u +%Y-%m-%dT%H:%M:%SZ && date +%s", what: { en: "Print the current UTC time in RFC 3339 and epoch seconds.", he: "מדפיס את הזמן הנוכחי ב-UTC בפורמט RFC 3339 וב-epoch seconds." } },
    { cmd: "TZ=Asia/Jerusalem date -d @2147483647", what: { en: "See the Year-2038 moment (max signed 32-bit epoch) in Israeli time.", he: "רואים את רגע 2038 (ה-epoch המקסימלי ב-32 ביט חתום) בשעון ישראל." } },
    { cmd: "chronyc tracking", what: { en: "Check how far this host's clock is from its NTP source (System time offset).", he: "בודקים כמה השעון של ה-host רחוק ממקור ה-NTP (System time offset)." } },
    { cmd: "psql -c \"SET TimeZone='Asia/Jerusalem'; SELECT now(), now() AT TIME ZONE 'UTC';\"", what: { en: "See how timestamptz renders in a session zone vs UTC.", he: "רואים איך timestamptz מוצג באזור ה-session מול UTC." } }
  ],
  mnemonic: {
    en: "\"Store UTC, show local, schedule with zone, time with monotonic.\"",
    he: "\"שומרים UTC, מציגים מקומי, מתזמנים עם zone, מודדים עם מונוטוני.\""
  },
  pitfalls: [
    { en: "Storing future appointments as UTC instants — a DST rule change silently moves them by an hour.", he: "שמירת תורים עתידיים כ-UTC instants — שינוי בחוקי שעון הקיץ מזיז אותם בשקט בשעה." },
    { en: "Measuring latency with Date.now()/time.time() — NTP adjustments produce negative or huge durations.", he: "מדידת latency עם Date.now()/time.time() — תיקוני NTP מייצרים משכים שליליים או ענקיים." },
    { en: "Running servers or cron in local time — duplicate/missing hours on DST transitions.", he: "שרתים או cron בשעון מקומי — שעות כפולות/חסרות במעברי שעון." },
    { en: "Ordering events from different hosts by timestamp and assuming it's the true order.", he: "סידור events ממכונות שונות לפי timestamp והנחה שזה הסדר האמיתי." }
  ],
  interview: [
    {
      q: { en: "How would you store a recurring weekly meeting at 09:00 for users in different countries?", he: "איך תשמור פגישה שבועית ב-09:00 למשתמשים במדינות שונות?" },
      a: { en: "Store the rule (RRULE: weekly on Monday), the local time 09:00 and the organizer's IANA zone. Expand occurrences to UTC instants at read/notify time with current tzdata, and render each attendee's view in their own zone. Never pre-store years of UTC instants — DST rule changes would break them.", he: "שומרים את החוק (RRULE: שבועי בשני), את השעה המקומית 09:00 ואת אזור ה-IANA של המארגן. פורשים מופעים ל-UTC instants בזמן קריאה/שליחת התראה עם tzdata עדכני, ומציגים לכל משתתף באזור שלו. לא שומרים מראש שנים של UTC instants — שינוי בחוקי DST ישבור אותם." }
    },
    {
      q: { en: "Why can't you rely on timestamps to order writes across nodes?", he: "למה אי אפשר לסמוך על timestamps לסדר כתיבות בין nodes?" },
      a: { en: "Clocks skew by milliseconds even with NTP, and can step backwards. Two causally related writes on different nodes can get inverted timestamps, and last-write-wins would drop the newer one. Use a single sequencer, Lamport/vector clocks, hybrid logical clocks (CockroachDB) or bounded-uncertainty clocks (Spanner TrueTime).", he: "שעונים זזים במילישניות גם עם NTP, ויכולים לקפוץ אחורה. שתי כתיבות תלויות על nodes שונים יכולות לקבל timestamps הפוכים, ו-last-write-wins יזרוק את החדשה. משתמשים ב-sequencer יחיד, Lamport/vector clocks, hybrid logical clocks (CockroachDB) או שעונים עם אי-ודאות חסומה (Spanner TrueTime)." }
    }
  ],
  quiz: [
    {
      q: { en: "What does Postgres timestamptz actually store?", he: "מה Postgres timestamptz שומר בפועל?" },
      options: [
        { en: "The value plus the original time zone name", he: "את הערך ואת שם אזור הזמן המקורי" },
        { en: "A UTC instant; zone is applied only on display", he: "UTC instant; ה-zone מוחל רק בתצוגה" },
        { en: "The local digits without any conversion", he: "את הספרות המקומיות בלי המרה" },
        { en: "Epoch milliseconds as text", he: "epoch במילישניות כטקסט" }
      ],
      answer: 1,
      explain: { en: "timestamptz normalizes to UTC on input and renders in the session TimeZone on output; it does not remember the input zone.", he: "timestamptz מנרמל ל-UTC בקלט ומציג לפי ה-TimeZone של ה-session בפלט; הוא לא זוכר את אזור הקלט." }
    },
    {
      q: { en: "Which clock should you use to measure a request's latency?", he: "באיזה שעון למדוד latency של בקשה?" },
      options: [
        { en: "Wall clock (Date.now)", he: "שעון קיר (Date.now)" },
        { en: "The client's clock", he: "השעון של הלקוח" },
        { en: "Monotonic clock", he: "שעון מונוטוני" },
        { en: "The DB server's now()", he: "now() של שרת ה-DB" }
      ],
      answer: 2,
      explain: { en: "Monotonic clocks never jump backwards, so durations are always correct.", he: "שעון מונוטוני לא קופץ אחורה, אז משכי הזמן תמיד נכונים." }
    },
    {
      q: { en: "Why is '+02:00' not enough to know a user's time zone?", he: "למה '+02:00' לא מספיק כדי לדעת את אזור הזמן של משתמש?" },
      options: [
        { en: "Offsets are not valid in ISO 8601", he: "Offsets לא חוקיים ב-ISO 8601" },
        { en: "Many zones share an offset, and the offset changes with DST", he: "הרבה אזורים חולקים offset, וה-offset משתנה עם DST" },
        { en: "Offsets are always in minutes", he: "Offsets תמיד בדקות" },
        { en: "Browsers can't parse offsets", he: "דפדפנים לא יודעים לפענח offsets" }
      ],
      answer: 1,
      explain: { en: "An offset describes one instant. The IANA zone (Asia/Jerusalem) carries the rules for all dates.", he: "Offset מתאר רגע אחד. אזור IANA (Asia/Jerusalem) נושא את החוקים לכל התאריכים." }
    },
    {
      q: { en: "When does a signed 32-bit Unix time overflow?", he: "מתי Unix time של 32 ביט חתום גולש?" },
      options: [
        { en: "2000-01-01", he: "2000-01-01" },
        { en: "2038-01-19", he: "2038-01-19" },
        { en: "2106-02-07", he: "2106-02-07" },
        { en: "Never", he: "אף פעם" }
      ],
      answer: 1,
      explain: { en: "2^31−1 seconds after 1970 is 2038-01-19T03:14:07Z. (2106 is the unsigned 32-bit limit.)", he: "2^31−1 שניות אחרי 1970 זה 2038-01-19T03:14:07Z. (2106 זה הגבול של 32 ביט לא חתום.)" }
    }
  ],
  related: ["staff-time-ordering", "pr-ids-pagination", "pr-observability-plan", "pr-encoding-serialization"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-auth",
  track: "principal",
  order: 71,
  icon: "🔐",
  level: 3,
  minutes: 15,
  title: { en: "Authentication & Authorization: Sessions, JWT, OAuth/OIDC, RBAC", he: "אימות והרשאות: Sessions, JWT, OAuth/OIDC, RBAC" },
  tldr: {
    en: "AuthN proves who you are, AuthZ decides what you may do; pick sessions or short-lived JWTs deliberately, delegate login to OIDC, hash passwords with argon2/bcrypt, and model permissions (RBAC/ABAC/ReBAC) before you need them.",
    he: "AuthN מוכיח מי אתה, AuthZ מחליט מה מותר לך; בוחרים במודע בין sessions ל-JWT קצרי חיים, מאצילים login ל-OIDC, עושים hash לסיסמאות עם argon2/bcrypt, וממדלים הרשאות (RBAC/ABAC/ReBAC) לפני שצריך."
  },
  analogy: {
    en: "At a hotel, the front desk checks your passport (authentication) and gives you a key card (session/token). The card opens your room and the gym but not the staff kitchen (authorization). A session cookie is a card the hotel can deactivate centrally at any moment; a JWT is a signed wristband at a festival — any gate can verify it without calling HQ, but you can't easily take it back until it expires. OAuth is a valet key: you let the parking service drive your car without giving them the house keys.",
    he: "במלון, הקבלה בודקת את הדרכון (אימות) ונותנת כרטיס-מפתח (session/token). הכרטיס פותח את החדר ואת חדר הכושר אבל לא את המטבח של הצוות (הרשאה). Session cookie זה כרטיס שהמלון יכול לבטל מרכזית בכל רגע; JWT זה צמיד חתום בפסטיבל — כל שער יכול לאמת אותו בלי להתקשר למטה, אבל קשה לקחת אותו בחזרה עד שהוא פג. OAuth זה מפתח ואלה: נותנים לשירות החניה לנהוג ברכב בלי לתת לו את מפתחות הבית."
  },
  sections: [
    {
      h: { en: "Sessions vs JWT", he: "Sessions מול JWT" },
      body: {
        en: `<table>
<tr><th></th><th>Server session + cookie</th><th>JWT (self-contained)</th></tr>
<tr><td>Where is state</td><td>Server store (Redis/DB)</td><td>Inside the token, signed</td></tr>
<tr><td>Verify cost</td><td>Lookup per request</td><td>Signature check, no lookup</td></tr>
<tr><td>Revoke now</td><td>Delete the session — easy</td><td>Hard: wait for expiry or keep a denylist</td></tr>
<tr><td>Size</td><td>~32-byte id</td><td>0.5–2 KB on every request</td></tr>
<tr><td>Best for</td><td>Browser apps, one domain</td><td>Service-to-service, APIs, federation</td></tr>
</table>
<p>A JWT is three Base64url parts: header, payload (claims), signature.</p>
<pre>header : {"alg":"RS256","kid":"2026-11"}
payload: {"sub":"u-42","iss":"https://id.acme.io",
          "aud":"orders-api","exp":1794558602,
          "scope":"orders:read"}
sig    : RSA-SHA256(header.payload, private_key)</pre>
<p>Verify: signature with the issuer's public key (JWKS endpoint, cached by <code>kid</code>), then <code>exp</code>, <code>iss</code>, <code>aud</code>. Keep access tokens short (5–15 min) and use a <strong>refresh token</strong> (long-lived, stored server-side, rotated on each use) to get new ones — that's how you get revocation back.</p>
<blockquote>⚠️ Production tip: Reject <code>alg: none</code> and never let the token choose HS256 vs RS256 (algorithm confusion attack). Pin the expected algorithm in the verifier. A JWT payload is only encoded, not encrypted — never put secrets or PII in it.</blockquote>`,
        he: `<table>
<tr><th></th><th>Session בשרת + cookie</th><th>JWT (עצמאי)</th></tr>
<tr><td>איפה ה-state</td><td>Store בשרת (Redis/DB)</td><td>בתוך ה-token, חתום</td></tr>
<tr><td>עלות אימות</td><td>Lookup לכל בקשה</td><td>בדיקת חתימה, בלי lookup</td></tr>
<tr><td>ביטול מיידי</td><td>מוחקים את ה-session — קל</td><td>קשה: מחכים לתפוגה או מחזיקים denylist</td></tr>
<tr><td>גודל</td><td>id של ~32 בתים</td><td>0.5–2 KB בכל בקשה</td></tr>
<tr><td>הכי מתאים ל-</td><td>אפליקציות דפדפן, domain אחד</td><td>Service-to-service, APIs, federation</td></tr>
</table>
<p>JWT הוא שלושה חלקים ב-Base64url: header, payload (claims), signature.</p>
<pre>header : {"alg":"RS256","kid":"2026-11"}
payload: {"sub":"u-42","iss":"https://id.acme.io",
          "aud":"orders-api","exp":1794558602,
          "scope":"orders:read"}
sig    : RSA-SHA256(header.payload, private_key)</pre>
<p>אימות: חתימה עם המפתח הציבורי של ה-issuer (endpoint של JWKS, ב-cache לפי <code>kid</code>), ואז <code>exp</code>, <code>iss</code>, <code>aud</code>. מחזיקים access tokens קצרים (5–15 דקות) ומשתמשים ב-<strong>refresh token</strong> (ארוך חיים, שמור בשרת, מתחלף בכל שימוש) כדי לקבל חדשים — ככה מחזירים את יכולת הביטול.</p>
<blockquote>⚠️ טיפ לפרודקשן: דוחים <code>alg: none</code> ולא נותנים ל-token לבחור בין HS256 ל-RS256 (algorithm confusion attack). מקבעים את האלגוריתם הצפוי ב-verifier. ה-payload של JWT רק מקודד, לא מוצפן — אף פעם לא שמים בו סודות או PII.</blockquote>`
      }
    },
    {
      h: { en: "OAuth 2.0 and OpenID Connect", he: "OAuth 2.0 ו-OpenID Connect" },
      body: {
        en: `<p><strong>OAuth 2.0</strong> is delegated <em>authorization</em>: an app gets an access token to call an API on a user's behalf. <strong>OIDC</strong> adds <em>authentication</em> on top: an <code>id_token</code> (JWT) saying who the user is. "Login with Google" = OIDC.</p>
<pre>Authorization Code + PKCE (browser/mobile apps)
1. app makes code_verifier (random), sends
   code_challenge = SHA256(verifier) to /authorize
2. user logs in at IdP, consents
3. IdP redirects back: ?code=abc
4. app POST /token {code, code_verifier}
5. IdP checks SHA256(verifier) == challenge
   -&gt; {access_token, id_token, refresh_token}

Client Credentials (service to service, no user)
POST /token grant_type=client_credentials
     client_id=billing&amp;client_secret=***
-&gt; {access_token, expires_in: 3600}</pre>
<ul>
<li><strong>Implicit flow and password grant are deprecated</strong> (OAuth 2.1). Use Auth Code + PKCE for every public client.</li>
<li><strong>SSO</strong>: enterprises use SAML 2.0 (XML assertions) or OIDC with an IdP (Okta, Entra ID, Google Workspace, Keycloak). Plus SCIM for user provisioning/deprovisioning.</li>
<li><strong>Service identity</strong>: mTLS (SPIFFE IDs in a mesh) or workload identity (IRSA on EKS, GKE Workload Identity) — no long-lived secrets.</li>
<li><strong>API keys</strong>: fine for server-to-server identification; store only a hash, show the key once, support rotation and prefixes (<code>sk_live_</code>) so secret scanners catch leaks.</li>
</ul>`,
        he: `<p><strong>OAuth 2.0</strong> זה <em>הרשאה</em> מואצלת: אפליקציה מקבלת access token כדי לקרוא ל-API בשם משתמש. <strong>OIDC</strong> מוסיף <em>אימות</em> מעליו: <code>id_token</code> (JWT) שאומר מי המשתמש. "Login with Google" = OIDC.</p>
<pre>Authorization Code + PKCE (browser/mobile apps)
1. app makes code_verifier (random), sends
   code_challenge = SHA256(verifier) to /authorize
2. user logs in at IdP, consents
3. IdP redirects back: ?code=abc
4. app POST /token {code, code_verifier}
5. IdP checks SHA256(verifier) == challenge
   -&gt; {access_token, id_token, refresh_token}

Client Credentials (service to service, no user)
POST /token grant_type=client_credentials
     client_id=billing&amp;client_secret=***
-&gt; {access_token, expires_in: 3600}</pre>
<ul>
<li><strong>Implicit flow ו-password grant הוצאו משימוש</strong> (OAuth 2.1). משתמשים ב-Auth Code + PKCE לכל public client.</li>
<li><strong>SSO</strong>: ארגונים משתמשים ב-SAML 2.0 (assertions ב-XML) או ב-OIDC מול IdP (Okta, Entra ID, Google Workspace, Keycloak). ועוד SCIM להקמה/הסרה אוטומטית של משתמשים.</li>
<li><strong>זהות של שירותים</strong>: mTLS (SPIFFE IDs ב-mesh) או workload identity (IRSA ב-EKS, GKE Workload Identity) — בלי סודות ארוכי חיים.</li>
<li><strong>API keys</strong>: בסדר לזיהוי server-to-server; שומרים רק hash, מציגים את המפתח פעם אחת, תומכים ב-rotation ובקידומות (<code>sk_live_</code>) כדי ש-secret scanners יתפסו דליפות.</li>
</ul>`
      }
    },
    {
      h: { en: "Passwords, MFA and passkeys", he: "סיסמאות, MFA ו-passkeys" },
      body: {
        en: `<p>Never store passwords; store a <strong>slow, salted hash</strong> designed for passwords: <strong>argon2id</strong> (first choice), bcrypt (cost 12+), or scrypt. SHA-256 is wrong here — it's fast, so a GPU tries ~10 billion guesses per second.</p>
<pre># Python, argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536)
h = ph.hash("correct horse")    # $argon2id$v=19$m=65536...
ph.verify(h, "correct horse")   # True or raises</pre>
<ul>
<li><strong>MFA</strong>: TOTP apps beat SMS (SIM swap); push with number matching beats plain push (MFA fatigue).</li>
<li><strong>Passkeys / WebAuthn</strong>: a key pair per site in the device's secure enclave; the server stores only the public key. Phishing-resistant because the browser binds the signature to the origin.</li>
<li><strong>Login hardening</strong>: rate-limit per account and per IP, check breached passwords (HIBP k-anonymity API), generic error messages ("invalid credentials") to avoid account enumeration.</li>
</ul>`,
        he: `<p>אף פעם לא שומרים סיסמאות; שומרים <strong>hash איטי עם salt</strong> שתוכנן לסיסמאות: <strong>argon2id</strong> (בחירה ראשונה), bcrypt (cost 12+), או scrypt. SHA-256 לא נכון כאן — הוא מהיר, אז GPU מנסה ~10 מיליארד ניחושים בשנייה.</p>
<pre># Python, argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536)
h = ph.hash("correct horse")    # $argon2id$v=19$m=65536...
ph.verify(h, "correct horse")   # True or raises</pre>
<ul>
<li><strong>MFA</strong>: אפליקציות TOTP עדיפות על SMS (SIM swap); push עם number matching עדיף על push רגיל (MFA fatigue).</li>
<li><strong>Passkeys / WebAuthn</strong>: זוג מפתחות לכל אתר ב-secure enclave של המכשיר; השרת שומר רק את המפתח הציבורי. עמיד ל-phishing כי הדפדפן קושר את החתימה ל-origin.</li>
<li><strong>הקשחת login</strong>: rate limit לפי חשבון ולפי IP, בדיקת סיסמאות שדלפו (HIBP k-anonymity API), הודעות שגיאה כלליות ("פרטים שגויים") כדי למנוע account enumeration.</li>
</ul>`
      }
    },
    {
      h: { en: "Authorization models: RBAC, ABAC, ReBAC", he: "מודלי הרשאות: RBAC, ABAC, ReBAC" },
      body: {
        en: `<table>
<tr><th>Model</th><th>Rule looks like</th><th>Good for</th></tr>
<tr><td>RBAC</td><td>role <code>admin</code> can <code>delete:invoice</code></td><td>Internal tools, simple SaaS</td></tr>
<tr><td>ABAC</td><td>allow if user.dept == doc.dept and time in office hours</td><td>Compliance, context rules</td></tr>
<tr><td>ReBAC</td><td>user can edit doc if user is editor of doc's folder</td><td>Google-Docs-like sharing, orgs/teams</td></tr>
</table>
<pre># OpenFGA / Zanzibar-style relation tuples
folder:plans#editor@user:dana
doc:q4-roadmap#parent@folder:plans
# model: doc.editor = editor from parent
check(user:dana, editor, doc:q4-roadmap) -&gt; true</pre>
<p>Always enforce authorization <strong>on the server, per object</strong> — "is this user allowed to read <em>this</em> invoice id?" — not just "is the user logged in". Centralize policy (OPA/Rego, Cedar, OpenFGA) when many services share it.</p>
<blockquote>💡 Real world: Google's Zanzibar handles trillions of ACL tuples for Drive, YouTube and Calendar; OpenFGA (CNCF), SpiceDB and AWS Verified Permissions (Cedar) bring the same ideas to everyone.</blockquote>`,
        he: `<table>
<tr><th>מודל</th><th>איך חוק נראה</th><th>מתאים ל-</th></tr>
<tr><td>RBAC</td><td>תפקיד <code>admin</code> יכול <code>delete:invoice</code></td><td>כלים פנימיים, SaaS פשוט</td></tr>
<tr><td>ABAC</td><td>מותר אם user.dept == doc.dept ובשעות עבודה</td><td>Compliance, חוקים לפי הקשר</td></tr>
<tr><td>ReBAC</td><td>משתמש יכול לערוך מסמך אם הוא editor בתיקייה של המסמך</td><td>שיתוף בסגנון Google Docs, ארגונים/צוותים</td></tr>
</table>
<pre># OpenFGA / Zanzibar-style relation tuples
folder:plans#editor@user:dana
doc:q4-roadmap#parent@folder:plans
# model: doc.editor = editor from parent
check(user:dana, editor, doc:q4-roadmap) -&gt; true</pre>
<p>תמיד אוכפים הרשאה <strong>בשרת, לכל אובייקט</strong> — "האם המשתמש הזה רשאי לקרוא את ה-invoice <em>הזה</em>?" — לא רק "האם המשתמש מחובר". מרכזים policy (OPA/Rego, Cedar, OpenFGA) כשהרבה שירותים חולקים אותה.</p>
<blockquote>💡 מהשטח: Zanzibar של Google מטפל בטריליוני tuples של ACL עבור Drive, YouTube ו-Calendar; OpenFGA (CNCF), SpiceDB ו-AWS Verified Permissions (Cedar) מביאים את אותם רעיונות לכולם.</blockquote>`
      }
    },
    {
      h: { en: "Cookies, CSRF and where to keep tokens", he: "Cookies, CSRF ואיפה לשמור tokens" },
      body: {
        en: `<pre>Set-Cookie: sid=9f2c...; Path=/; HttpOnly; Secure;
            SameSite=Lax; Max-Age=86400</pre>
<ul>
<li><strong>HttpOnly</strong>: JavaScript can't read it — an XSS can't steal the session.</li>
<li><strong>Secure</strong>: only over HTTPS. <strong>SameSite=Lax/Strict</strong>: not sent on cross-site POSTs — the main CSRF defense today.</li>
<li><strong>CSRF</strong>: a malicious site makes your browser send a request with your cookies. Defend with SameSite + CSRF tokens (synchronizer or double-submit) for state-changing requests.</li>
<li><strong>SPA tokens</strong>: <code>localStorage</code> is readable by any XSS. Prefer the BFF pattern: the backend holds tokens and the browser only has an HttpOnly session cookie.</li>
</ul>`,
        he: `<pre>Set-Cookie: sid=9f2c...; Path=/; HttpOnly; Secure;
            SameSite=Lax; Max-Age=86400</pre>
<ul>
<li><strong>HttpOnly</strong>: JavaScript לא יכול לקרוא אותו — XSS לא יכול לגנוב את ה-session.</li>
<li><strong>Secure</strong>: רק מעל HTTPS. <strong>SameSite=Lax/Strict</strong>: לא נשלח ב-POST חוצה אתרים — ההגנה העיקרית מ-CSRF היום.</li>
<li><strong>CSRF</strong>: אתר זדוני גורם לדפדפן שלך לשלוח בקשה עם ה-cookies שלך. מגינים עם SameSite + CSRF tokens (synchronizer או double-submit) לבקשות שמשנות state.</li>
<li><strong>Tokens ב-SPA</strong>: <code>localStorage</code> קריא לכל XSS. עדיף תבנית BFF: ה-backend מחזיק את ה-tokens והדפדפן מחזיק רק session cookie עם HttpOnly.</li>
</ul>`
      }
    }
  ],
  diagram: `browser --login--> IdP (OIDC) --code--> app backend (BFF)
   ^                                       | code+verifier
   | HttpOnly cookie                       v
   +----------------------------------- /token -> access(15m)+refresh
backend --Bearer access--> API gateway --verify JWKS--> orders-api
                                                 \\-> authz: OpenFGA check`,
  handsOn: [
    { cmd: "echo 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1LTQyIn0.x' | cut -d. -f2 | base64 -d 2>/dev/null; echo", what: { en: "Decode a JWT payload — proof that it's encoded, not encrypted.", he: "מפענחים payload של JWT — הוכחה שהוא מקודד, לא מוצפן." } },
    { cmd: "curl -s https://accounts.google.com/.well-known/openid-configuration | head -c 600", what: { en: "Look at a real OIDC discovery document: issuer, endpoints, jwks_uri.", he: "מסתכלים על discovery document אמיתי של OIDC: issuer, endpoints, jwks_uri." } },
    { cmd: "curl -sI https://github.com | grep -i set-cookie", what: { en: "Inspect real cookie flags (HttpOnly, Secure, SameSite).", he: "בודקים דגלים אמיתיים של cookies (HttpOnly, Secure, SameSite)." } },
    { cmd: "python -c \"import hashlib,os;print(hashlib.scrypt(b'pw',salt=os.urandom(16),n=2**14,r=8,p=1).hex()[:32])\"", what: { en: "Hash a password with a memory-hard KDF from the standard library.", he: "עושים hash לסיסמה עם KDF שדורש זיכרון, מהספרייה הסטנדרטית." } }
  ],
  mnemonic: {
    en: "\"N is for Name (who), Z is for Zone of access (what). Short tokens, rotating refresh, slow hashes, per-object checks.\"",
    he: "\"AuthN = מי אתה, AuthZ = מה מותר לך. Tokens קצרים, refresh מתחלף, hash איטי, בדיקה לכל אובייקט.\""
  },
  pitfalls: [
    { en: "Long-lived JWTs with no revocation path — a stolen token works for days.", he: "JWT ארוכי חיים בלי דרך ביטול — token גנוב עובד ימים." },
    { en: "Checking only 'is logged in' and not 'owns this object' — IDOR, the #1 web vuln.", he: "בדיקה רק של 'מחובר' ולא 'הבעלים של האובייקט' — IDOR, הפגיעות מספר 1 ב-web." },
    { en: "Hashing passwords with SHA-256/MD5 — fast hashes are cracked at billions per second.", he: "Hash לסיסמאות עם SHA-256/MD5 — hash מהיר נפרץ במיליארדים בשנייה." },
    { en: "Storing tokens in localStorage in an app that has any XSS risk.", he: "שמירת tokens ב-localStorage באפליקציה עם סיכון XSS כלשהו." }
  ],
  interview: [
    {
      q: { en: "How do you revoke a JWT before it expires?", he: "איך מבטלים JWT לפני שהוא פג?" },
      a: { en: "Keep access tokens short (5–15 min) so expiry is the main revocation; revoke the refresh token server-side so no new access tokens are issued; for urgent cases keep a small denylist of jti values (in Redis, TTL = remaining lifetime) or bump a per-user token version checked at the gateway.", he: "מחזיקים access tokens קצרים (5–15 דקות) כך שתפוגה היא מנגנון הביטול העיקרי; מבטלים את ה-refresh token בשרת כך שלא יונפקו חדשים; למקרים דחופים מחזיקים denylist קטן של ערכי jti (ב-Redis, TTL = זמן החיים שנותר) או מעלים token version למשתמש שנבדק ב-gateway." }
    },
    {
      q: { en: "Why does a mobile app need PKCE?", he: "למה אפליקציית מובייל צריכה PKCE?" },
      a: { en: "A public client can't keep a client secret, and another app could intercept the redirect with the code. PKCE binds the code to a random verifier only the real app knows, so a stolen code is useless.", he: "Public client לא יכול לשמור client secret, ואפליקציה אחרת יכולה ליירט את ה-redirect עם ה-code. PKCE קושר את ה-code ל-verifier אקראי שרק האפליקציה האמיתית יודעת, אז code גנוב חסר תועלת." }
    }
  ],
  quiz: [
    {
      q: { en: "What does OIDC add on top of OAuth 2.0?", he: "מה OIDC מוסיף מעל OAuth 2.0?" },
      options: [
        { en: "Encryption of access tokens", he: "הצפנת access tokens" },
        { en: "An id_token that authenticates the user", he: "id_token שמאמת את המשתמש" },
        { en: "Rate limiting", he: "Rate limiting" },
        { en: "Password storage", he: "שמירת סיסמאות" }
      ],
      answer: 1,
      explain: { en: "OAuth is authorization; OIDC adds identity via the id_token and userinfo endpoint.", he: "OAuth זה הרשאה; OIDC מוסיף זהות דרך id_token ו-endpoint של userinfo." }
    },
    {
      q: { en: "Best algorithm to store user passwords?", he: "האלגוריתם הכי טוב לשמירת סיסמאות?" },
      options: [
        { en: "SHA-256 with salt", he: "SHA-256 עם salt" },
        { en: "AES encryption", he: "הצפנת AES" },
        { en: "argon2id", he: "argon2id" },
        { en: "Base64", he: "Base64" }
      ],
      answer: 2,
      explain: { en: "argon2id is slow and memory-hard by design; encryption is reversible and SHA-256 is too fast.", he: "argon2id איטי ודורש זיכרון בכוונה; הצפנה הפיכה ו-SHA-256 מהיר מדי." }
    },
    {
      q: { en: "Which cookie flag prevents JavaScript from reading the session cookie?", he: "איזה דגל cookie מונע מ-JavaScript לקרוא את ה-session cookie?" },
      options: [
        { en: "Secure", he: "Secure" },
        { en: "SameSite", he: "SameSite" },
        { en: "HttpOnly", he: "HttpOnly" },
        { en: "Path", he: "Path" }
      ],
      answer: 2,
      explain: { en: "HttpOnly hides the cookie from document.cookie, blunting XSS session theft.", he: "HttpOnly מסתיר את ה-cookie מ-document.cookie ומקהה גניבת session דרך XSS." }
    },
    {
      q: { en: "'A user can edit a doc if they are an editor of its parent folder' is which model?", he: "'משתמש יכול לערוך מסמך אם הוא editor בתיקיית האב' — איזה מודל?" },
      options: [
        { en: "RBAC", he: "RBAC" },
        { en: "ReBAC", he: "ReBAC" },
        { en: "MAC", he: "MAC" },
        { en: "DAC with ACL only", he: "DAC עם ACL בלבד" }
      ],
      answer: 1,
      explain: { en: "Permissions derived from relationships between objects = relationship-based access control.", he: "הרשאות שנגזרות מיחסים בין אובייקטים = relationship-based access control." }
    }
  ],
  related: ["cloud-iam-security", "staff-zero-trust-secrets", "net-http-tls", "pr-security-owasp", "pr-multi-tenancy"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-ids-pagination",
  track: "principal",
  order: 72,
  icon: "🆔",
  level: 2,
  minutes: 12,
  title: { en: "IDs & Pagination: UUID v7, Snowflake, Cursors", he: "מזהים ו-Pagination: UUID v7, Snowflake, Cursors" },
  tldr: {
    en: "Choose IDs that are unique without coordination, sort by time for index locality (UUID v7/ULID/Snowflake), never leak counts with sequential public IDs, and paginate with keyset cursors instead of OFFSET.",
    he: "בוחרים מזהים ייחודיים בלי תיאום, ממוינים לפי זמן לטובת locality באינדקס (UUID v7/ULID/Snowflake), לא חושפים כמויות עם מזהים רציפים ציבוריים, ועושים pagination עם keyset cursors במקום OFFSET."
  },
  analogy: {
    en: "Auto-increment IDs are the deli ticket machine: perfectly ordered, but there's one machine everyone must queue at, and a competitor who takes ticket #4,812 today and #4,950 tomorrow knows how many customers you had. UUID v4 is everyone rolling their own random lottery number — no queue, but the numbers land all over the filing cabinet. UUID v7 is a lottery number prefixed with the time — no queue, and new tickets go at the back of the cabinet. OFFSET pagination is reading page 500 of a book by counting every line from page 1; a cursor is a bookmark.",
    he: "מזהי auto-increment זה מכונת המספרים בדלפק הגבינות: סדר מושלם, אבל יש מכונה אחת שכולם עומדים בתור אליה, ומתחרה שלוקח היום מספר 4,812 ומחר 4,950 יודע כמה לקוחות היו לך. UUID v4 זה כל אחד מגריל לעצמו מספר — אין תור, אבל המספרים נופלים בכל מקום בארון התיקים. UUID v7 זה מספר מוגרל עם קידומת של הזמן — אין תור, וכרטיסים חדשים הולכים לסוף הארון. OFFSET pagination זה לקרוא את עמוד 500 בספר ע\"י ספירת כל השורות מעמוד 1; cursor זה סימנייה."
  },
  sections: [
    {
      h: { en: "ID strategies compared", he: "השוואת אסטרטגיות מזהים" },
      body: {
        en: `<table>
<tr><th>ID</th><th>Size</th><th>Sortable</th><th>Coordination</th><th>Notes</th></tr>
<tr><td>BIGSERIAL</td><td>8 B</td><td>Yes</td><td>One DB sequence</td><td>Leaks volume; hard to merge/shard</td></tr>
<tr><td>UUID v4</td><td>16 B</td><td>No</td><td>None</td><td>Random → B-tree page splits</td></tr>
<tr><td>UUID v7</td><td>16 B</td><td>By ms</td><td>None</td><td>RFC 9562 (2024); best default</td></tr>
<tr><td>ULID</td><td>16 B</td><td>By ms</td><td>None</td><td>26-char Crockford Base32</td></tr>
<tr><td>Snowflake</td><td>8 B</td><td>By ms</td><td>Worker id</td><td>Fits bigint; Twitter, Discord</td></tr>
<tr><td>KSUID</td><td>20 B</td><td>By s</td><td>None</td><td>Segment; 128-bit random</td></tr>
<tr><td>Nano ID</td><td>~21 ch</td><td>No</td><td>None</td><td>URL-friendly short public IDs</td></tr>
</table>
<pre>UUID v4  9b2e4c1a-7f3d-4e8b-a1c2-5d6e7f8a9b0c  random
UUID v7  0193247e-8a3c-7b12-9f4d-2c8e1a6b5d3f
         |-48-bit ms time-| v |---- random ----|
Snowflake (64 bits)
 0 | 41 bits ms since epoch | 10 bits worker | 12 bits seq
   ~69 years               1024 nodes       4096/ms/node</pre>
<blockquote>💡 Real world: Random v4 keys as a clustered primary key (MySQL InnoDB, SQL Server) scatter inserts across the whole index; at 100M+ rows insert throughput can drop several-fold and the buffer pool thrashes. Time-ordered IDs append to the "right edge" of the B-tree like a sequence does.</blockquote>`,
        he: `<table>
<tr><th>ID</th><th>גודל</th><th>ממוין</th><th>תיאום</th><th>הערות</th></tr>
<tr><td>BIGSERIAL</td><td>8 B</td><td>כן</td><td>Sequence אחד ב-DB</td><td>חושף נפח; קשה למזג/לעשות shard</td></tr>
<tr><td>UUID v4</td><td>16 B</td><td>לא</td><td>אין</td><td>אקראי → page splits ב-B-tree</td></tr>
<tr><td>UUID v7</td><td>16 B</td><td>לפי ms</td><td>אין</td><td>RFC 9562 (2024); ברירת המחדל הכי טובה</td></tr>
<tr><td>ULID</td><td>16 B</td><td>לפי ms</td><td>אין</td><td>26 תווים ב-Crockford Base32</td></tr>
<tr><td>Snowflake</td><td>8 B</td><td>לפי ms</td><td>Worker id</td><td>נכנס ל-bigint; Twitter, Discord</td></tr>
<tr><td>KSUID</td><td>20 B</td><td>לפי s</td><td>אין</td><td>Segment; 128 ביט אקראי</td></tr>
<tr><td>Nano ID</td><td>~21 תווים</td><td>לא</td><td>אין</td><td>מזהים ציבוריים קצרים ל-URL</td></tr>
</table>
<pre>UUID v4  9b2e4c1a-7f3d-4e8b-a1c2-5d6e7f8a9b0c  random
UUID v7  0193247e-8a3c-7b12-9f4d-2c8e1a6b5d3f
         |-48-bit ms time-| v |---- random ----|
Snowflake (64 bits)
 0 | 41 bits ms since epoch | 10 bits worker | 12 bits seq
   ~69 years               1024 nodes       4096/ms/node</pre>
<blockquote>💡 מהשטח: מפתחות v4 אקראיים כ-clustered primary key (MySQL InnoDB, SQL Server) מפזרים הכנסות על כל האינדקס; ב-100M+ שורות קצב ההכנסה יכול לרדת פי כמה וה-buffer pool מתחבט. מזהים ממוינים בזמן נכנסים ל"קצה הימני" של ה-B-tree כמו sequence.</blockquote>`
      }
    },
    {
      h: { en: "Choosing: internal vs public IDs", he: "בחירה: מזהים פנימיים מול ציבוריים" },
      body: {
        en: `<ul>
<li><strong>Don't expose sequential IDs publicly</strong>: <code>/invoices/1043</code> invites enumeration (IDOR probing) and reveals business volume (the "German tank problem").</li>
<li>A common pattern: <code>bigint</code> internal PK for joins + a UUID v7 / prefixed public ID (<code>inv_01HZX...</code>) in URLs and APIs. Stripe-style prefixes make logs and support tickets self-describing.</li>
<li><strong>Generate IDs in the app</strong>, not the DB, when you need idempotent creates or must know the ID before the insert (outbox events, offline mobile).</li>
<li><strong>Snowflake needs unique worker ids</strong> — assign from a k8s StatefulSet ordinal, a lease in etcd/Redis, or ZooKeeper; two workers with the same id produce duplicates. A clock going backwards must block or bump the sequence.</li>
</ul>
<pre>-- Postgres 18 has uuidv7(); earlier: extension or app-side
CREATE TABLE orders (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id  text UNIQUE NOT NULL,  -- 'ord_01JC...'
  created_at timestamptz NOT NULL DEFAULT now()
);</pre>`,
        he: `<ul>
<li><strong>לא חושפים מזהים רציפים החוצה</strong>: <code>/invoices/1043</code> מזמין enumeration (בדיקות IDOR) וחושף נפח עסקי ("בעיית הטנקים הגרמניים").</li>
<li>תבנית נפוצה: PK פנימי מסוג <code>bigint</code> ל-joins + UUID v7 / מזהה ציבורי עם קידומת (<code>inv_01HZX...</code>) ב-URLs וב-APIs. קידומות בסגנון Stripe הופכות לוגים ופניות תמיכה למובנים מעצמם.</li>
<li><strong>מייצרים מזהים באפליקציה</strong>, לא ב-DB, כשצריך create אידמפוטנטי או לדעת את ה-ID לפני ה-insert (outbox events, מובייל offline).</li>
<li><strong>Snowflake צריך worker ids ייחודיים</strong> — מקצים מ-ordinal של StatefulSet ב-k8s, lease ב-etcd/Redis או ZooKeeper; שני workers עם אותו id מייצרים כפילויות. שעון שחוזר אחורה חייב לחסום או לקדם את ה-sequence.</li>
</ul>
<pre>-- Postgres 18 has uuidv7(); earlier: extension or app-side
CREATE TABLE orders (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id  text UNIQUE NOT NULL,  -- 'ord_01JC...'
  created_at timestamptz NOT NULL DEFAULT now()
);</pre>`
      }
    },
    {
      h: { en: "OFFSET vs keyset (cursor) pagination", he: "OFFSET מול keyset (cursor) pagination" },
      body: {
        en: `<pre>-- OFFSET: DB reads and throws away 100,000 rows
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;     -- ~400 ms, grows linearly

-- Keyset: jump straight via the index
SELECT * FROM orders
WHERE (created_at, id) &lt; (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;                   -- ~1 ms at any depth
-- index: (created_at DESC, id DESC)</pre>
<table>
<tr><th></th><th>OFFSET</th><th>Keyset / cursor</th></tr>
<tr><td>Deep pages</td><td>O(offset), slow</td><td>O(log n), constant</td></tr>
<tr><td>Inserts during paging</td><td>Duplicates / skipped rows</td><td>Stable</td></tr>
<tr><td>Jump to page 37</td><td>Yes</td><td>No (next/prev only)</td></tr>
<tr><td>Best for</td><td>Small admin tables</td><td>Feeds, APIs, infinite scroll, exports</td></tr>
</table>
<p>Always add a <strong>unique tie-breaker</strong> (<code>id</code>) to the sort — two rows with the same <code>created_at</code> would otherwise be skipped or repeated across pages.</p>`,
        he: `<pre>-- OFFSET: DB reads and throws away 100,000 rows
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;     -- ~400 ms, grows linearly

-- Keyset: jump straight via the index
SELECT * FROM orders
WHERE (created_at, id) &lt; (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;                   -- ~1 ms at any depth
-- index: (created_at DESC, id DESC)</pre>
<table>
<tr><th></th><th>OFFSET</th><th>Keyset / cursor</th></tr>
<tr><td>עמודים עמוקים</td><td>O(offset), איטי</td><td>O(log n), קבוע</td></tr>
<tr><td>הכנסות תוך כדי דפדוף</td><td>כפילויות / שורות שדולגו</td><td>יציב</td></tr>
<tr><td>קפיצה לעמוד 37</td><td>כן</td><td>לא (רק הבא/הקודם)</td></tr>
<tr><td>מתאים ל-</td><td>טבלאות admin קטנות</td><td>Feeds, APIs, infinite scroll, exports</td></tr>
</table>
<p>תמיד מוסיפים <strong>tie-breaker ייחודי</strong> (<code>id</code>) למיון — אחרת שתי שורות עם אותו <code>created_at</code> ידולגו או יחזרו בין עמודים.</p>`
      }
    },
    {
      h: { en: "Opaque cursors and total counts", he: "Cursors אטומים וספירה כוללת" },
      body: {
        en: `<pre>GET /v1/orders?limit=20
200 {
  "data": [ ... 20 items ... ],
  "next_cursor": "eyJjIjoiMjAyNi0xMS0xM1QwODox..."
}
GET /v1/orders?limit=20&amp;cursor=eyJjIjoi...

cursor = base64url(json({"c":"2026-11-13T08:15:02Z",
                         "i":"0193247e-..."}))  # + HMAC</pre>
<ul>
<li>Make cursors <strong>opaque</strong> (Base64url, optionally signed/encrypted) so clients don't build them by hand and you can change the internals later.</li>
<li><strong><code>COUNT(*)</code> on a big table is expensive</strong> in Postgres (MVCC visibility check per row). Show "1,000+" or an estimate from <code>pg_class.reltuples</code>, or return <code>has_more</code> instead of totals.</li>
<li>Cap <code>limit</code> (e.g. max 100) — an unbounded limit is a DoS vector.</li>
</ul>
<blockquote>⚠️ Production tip: For bulk exports, don't paginate an API at all — stream (COPY / server-side cursor) to a file in object storage and hand back a pre-signed URL.</blockquote>`,
        he: `<pre>GET /v1/orders?limit=20
200 {
  "data": [ ... 20 items ... ],
  "next_cursor": "eyJjIjoiMjAyNi0xMS0xM1QwODox..."
}
GET /v1/orders?limit=20&amp;cursor=eyJjIjoi...

cursor = base64url(json({"c":"2026-11-13T08:15:02Z",
                         "i":"0193247e-..."}))  # + HMAC</pre>
<ul>
<li>עושים cursors <strong>אטומים</strong> (Base64url, ואפשר חתום/מוצפן) כדי שלקוחות לא יבנו אותם ידנית ואפשר יהיה לשנות את הפנים בהמשך.</li>
<li><strong><code>COUNT(*)</code> על טבלה גדולה יקר</strong> ב-Postgres (בדיקת visibility של MVCC לכל שורה). מציגים "1,000+" או הערכה מ-<code>pg_class.reltuples</code>, או מחזירים <code>has_more</code> במקום סה"כ.</li>
<li>מגבילים את <code>limit</code> (למשל מקסימום 100) — limit בלי גבול זה וקטור DoS.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: לייצוא בכמויות לא עושים pagination על API בכלל — עושים stream (COPY / server-side cursor) לקובץ ב-object storage ומחזירים pre-signed URL.</blockquote>`
      }
    }
  ],
  diagram: `B-tree insert pattern
 UUID v4 : [..x....x..x...x.....x..]   random pages -> splits
 UUID v7 : [.......................xxxx] append at right edge

Keyset paging
 page1 -> last=(08:15:02, 0193..)
       -> WHERE (c,id) < last -> page2 -> ...`,
  handsOn: [
    { cmd: "python -c \"import uuid;print(uuid.uuid4())\"", what: { en: "Generate a random UUID v4 (Python 3.14 adds uuid.uuid7()).", he: "מייצרים UUID v4 אקראי (ב-Python 3.14 נוסף uuid.uuid7())." } },
    { cmd: "psql -c \"EXPLAIN ANALYZE SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000;\"", what: { en: "See how many rows OFFSET reads and discards; then compare with the keyset query.", he: "רואים כמה שורות OFFSET קורא וזורק; ואז משווים ל-query של keyset." } },
    { cmd: "node -e \"const ms=BigInt(Date.now()-1288834974657);console.log(((ms<<22n)|(5n<<12n)|7n).toString())\"", what: { en: "Build a Snowflake-style ID by bit-shifting time, worker 5, sequence 7.", he: "בונים ID בסגנון Snowflake ע\"י הזזת ביטים: זמן, worker 5, sequence 7." } }
  ],
  mnemonic: {
    en: "\"Time-first IDs, random tail; bookmarks, not page numbers.\"",
    he: "\"מזהים שמתחילים בזמן ונגמרים באקראי; סימנייה ולא מספר עמוד.\""
  },
  pitfalls: [
    { en: "UUID v4 as clustered primary key on a huge table — random inserts, page splits, bloated indexes.", he: "UUID v4 כ-clustered primary key בטבלה ענקית — הכנסות אקראיות, page splits, אינדקסים מנופחים." },
    { en: "OFFSET pagination on an API used for sync/exports — slower per page and skips rows when data changes.", he: "OFFSET pagination ב-API שמשמש ל-sync/export — מאט עם כל עמוד ומדלג על שורות כשהמידע משתנה." },
    { en: "Sorting by a non-unique column without a tie-breaker — rows appear twice or vanish between pages.", he: "מיון לפי עמודה לא ייחודית בלי tie-breaker — שורות מופיעות פעמיים או נעלמות בין עמודים." }
  ],
  interview: [
    {
      q: { en: "Design an ID generator for 1M IDs/sec across 200 nodes, sortable by time.", he: "תכנן מחולל IDs ל-1M מזהים בשנייה על 200 nodes, ממוין לפי זמן." },
      a: { en: "Snowflake-like 64-bit: 41 bits ms timestamp, 10 bits worker id (1024 workers, assigned via leases), 12 bits sequence (4096/ms/node ≈ 4M/s/node). No coordination on the hot path. Handle clock rollback by waiting or refusing; monitor sequence exhaustion. Alternatively UUID v7 if 128 bits is fine and you want no worker ids.", he: "64 ביט בסגנון Snowflake: 41 ביט ms, 10 ביט worker id (1024 workers, מוקצים ב-leases), 12 ביט sequence (4096 ל-ms ל-node ≈ 4M/s ל-node). אין תיאום בנתיב החם. מטפלים בשעון שחוזר אחורה ע\"י המתנה או סירוב; מנטרים מיצוי sequence. לחלופין UUID v7 אם 128 ביט בסדר ולא רוצים worker ids." }
    },
    {
      q: { en: "Why is deep OFFSET pagination slow, and what replaces it?", he: "למה OFFSET עמוק איטי ומה מחליף אותו?" },
      a: { en: "The DB must produce and discard all skipped rows, so cost grows with the offset. Keyset pagination uses WHERE (sort_key, id) &lt; last-seen values on a matching index, giving constant-time pages and stability under inserts.", he: "ה-DB חייב לייצר ולזרוק את כל השורות שמדלגים עליהן, אז העלות גדלה עם ה-offset. Keyset pagination משתמש ב-WHERE (sort_key, id) &lt; הערכים האחרונים שנראו, על אינדקס תואם — עמודים בזמן קבוע ויציבות מול הכנסות." }
    }
  ],
  quiz: [
    {
      q: { en: "Main advantage of UUID v7 over v4 as a primary key?", he: "היתרון העיקרי של UUID v7 על v4 כ-primary key?" },
      options: [
        { en: "Shorter", he: "קצר יותר" },
        { en: "Time-ordered, so inserts append to the index", he: "ממוין בזמן, אז הכנסות נוספות לסוף האינדקס" },
        { en: "Guaranteed sequential with no gaps", he: "רציף מובטח בלי חורים" },
        { en: "Encrypted", he: "מוצפן" }
      ],
      answer: 1,
      explain: { en: "The 48-bit millisecond prefix keeps new keys near each other in the B-tree.", he: "קידומת ה-48 ביט של מילישניות שומרת מפתחות חדשים קרובים זה לזה ב-B-tree." }
    },
    {
      q: { en: "In Snowflake, what limits IDs per node per millisecond?", he: "ב-Snowflake, מה מגביל את כמות ה-IDs ל-node למילישנייה?" },
      options: [
        { en: "The 41-bit timestamp", he: "ה-timestamp של 41 ביט" },
        { en: "The 10-bit worker id", he: "ה-worker id של 10 ביט" },
        { en: "The 12-bit sequence (4096)", he: "ה-sequence של 12 ביט (4096)" },
        { en: "The sign bit", he: "ביט הסימן" }
      ],
      answer: 2,
      explain: { en: "12 bits = 4096 values per ms per worker.", he: "12 ביט = 4096 ערכים ל-ms ל-worker." }
    },
    {
      q: { en: "Why add 'id' to ORDER BY created_at in keyset pagination?", he: "למה להוסיף 'id' ל-ORDER BY created_at ב-keyset pagination?" },
      options: [
        { en: "For security", he: "לאבטחה" },
        { en: "As a unique tie-breaker so equal timestamps aren't skipped or duplicated", he: "כ-tie-breaker ייחודי כדי ש-timestamps זהים לא ידולגו או יוכפלו" },
        { en: "To make COUNT faster", he: "כדי להאיץ COUNT" },
        { en: "SQL requires it", he: "SQL דורש את זה" }
      ],
      answer: 1,
      explain: { en: "The cursor must identify a unique position in a total order.", he: "ה-cursor חייב לזהות מיקום ייחודי בסדר מלא." }
    },
    {
      q: { en: "What's the risk of /invoices/1043 style public URLs?", he: "מה הסיכון ב-URLs ציבוריים כמו /invoices/1043?" },
      options: [
        { en: "URLs too long", he: "URLs ארוכים מדי" },
        { en: "Enumeration attacks and leaking business volume", he: "התקפות enumeration וחשיפת נפח עסקי" },
        { en: "Slower DB lookups", he: "חיפושים איטיים ב-DB" },
        { en: "Browser caching issues", he: "בעיות cache בדפדפן" }
      ],
      answer: 1,
      explain: { en: "Sequential IDs are guessable and reveal growth; use opaque public IDs plus per-object authz.", he: "מזהים רציפים ניתנים לניחוש וחושפים צמיחה; משתמשים במזהים ציבוריים אטומים + הרשאה לכל אובייקט." }
    }
  ],
  related: ["db-indexes", "pr-bitwise", "pr-time-timestamps", "pr-security-owasp", "pr-idempotency"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-multi-tenancy",
  track: "principal",
  order: 73,
  icon: "🏢",
  level: 3,
  minutes: 13,
  title: { en: "Multi-Tenancy: Silo, Pool, Bridge and Isolation", he: "Multi-Tenancy: Silo, Pool, Bridge ובידוד" },
  tldr: {
    en: "Decide per layer how much tenants share (silo / pool / bridge), enforce isolation in the data layer (RLS or separate DBs), cap every tenant's resources to stop noisy neighbors, and tag every cost and log with tenant_id.",
    he: "מחליטים לכל שכבה כמה ה-tenants חולקים (silo / pool / bridge), אוכפים בידוד בשכבת המידע (RLS או DBs נפרדים), מגבילים משאבים לכל tenant כדי לעצור noisy neighbors, ומתייגים כל עלות ולוג ב-tenant_id."
  },
  analogy: {
    en: "Silo is a row of private houses: each tenant has its own walls, plumbing and electricity — very isolated, very expensive. Pool is an apartment building: one structure, shared pipes, each family behind its own locked door — cheap, but one family's loud party (noisy neighbor) or a burst pipe affects everyone. Bridge is a building with a shared lobby and elevators but a private penthouse for the VIP client.",
    he: "Silo זה שורה של בתים פרטיים: לכל tenant קירות, צנרת וחשמל משלו — מבודד מאוד ויקר מאוד. Pool זה בניין דירות: מבנה אחד, צנרת משותפת, לכל משפחה דלת נעולה משלה — זול, אבל המסיבה הרועשת של משפחה אחת (noisy neighbor) או צינור שהתפוצץ משפיעים על כולם. Bridge זה בניין עם לובי ומעליות משותפים אבל פנטהאוז פרטי ללקוח ה-VIP."
  },
  sections: [
    {
      h: { en: "The three models", he: "שלושת המודלים" },
      body: {
        en: `<table>
<tr><th></th><th>Silo</th><th>Pool</th><th>Bridge (hybrid)</th></tr>
<tr><td>Infra</td><td>Stack per tenant</td><td>Shared stack</td><td>Shared compute, per-tenant data (or vice versa)</td></tr>
<tr><td>Isolation</td><td>Strongest</td><td>Logical only</td><td>Mixed</td></tr>
<tr><td>Cost / tenant</td><td>High (idle capacity)</td><td>Lowest</td><td>Medium</td></tr>
<tr><td>Ops</td><td>N deploys, N upgrades</td><td>One deploy</td><td>Tiered</td></tr>
<tr><td>Fits</td><td>Banks, gov, regulated, huge tenants</td><td>SMB SaaS, freemium</td><td>"Enterprise tier" on top of pool</td></tr>
</table>
<p>Most mature SaaS ends up <strong>tiered</strong>: free/pro tenants in the pool, enterprise tenants on dedicated databases or dedicated cells — same codebase, plus a tenant→placement routing table.</p>
<blockquote>💡 Real world: Slack, Atlassian and Salesforce all use cell/pod architectures: a tenant is pinned to one cell (a full copy of the stack), so a bad deploy or a noisy tenant hurts only that cell's customers.</blockquote>`,
        he: `<table>
<tr><th></th><th>Silo</th><th>Pool</th><th>Bridge (היברידי)</th></tr>
<tr><td>תשתית</td><td>Stack לכל tenant</td><td>Stack משותף</td><td>Compute משותף, מידע לכל tenant (או הפוך)</td></tr>
<tr><td>בידוד</td><td>הכי חזק</td><td>לוגי בלבד</td><td>מעורב</td></tr>
<tr><td>עלות ל-tenant</td><td>גבוהה (קיבולת מבוזבזת)</td><td>הכי נמוכה</td><td>בינונית</td></tr>
<tr><td>תפעול</td><td>N deploys, N שדרוגים</td><td>Deploy אחד</td><td>לפי שכבות</td></tr>
<tr><td>מתאים ל-</td><td>בנקים, ממשלה, רגולציה, tenants ענקיים</td><td>SaaS ל-SMB, freemium</td><td>"Enterprise tier" מעל pool</td></tr>
</table>
<p>רוב ה-SaaS הבוגרים מגיעים ל-<strong>מדרג</strong>: tenants של free/pro ב-pool, tenants של enterprise על DB ייעודי או cell ייעודי — אותו קוד, ועוד טבלת ניתוב tenant→placement.</p>
<blockquote>💡 מהשטח: Slack, Atlassian ו-Salesforce משתמשים כולם בארכיטקטורת cells/pods: tenant מוצמד ל-cell אחד (עותק מלא של ה-stack), אז deploy גרוע או tenant רועש פוגעים רק בלקוחות של אותו cell.</blockquote>`
      }
    },
    {
      h: { en: "Data isolation: DB, schema or row", he: "בידוד מידע: DB, schema או שורה" },
      body: {
        en: `<ul>
<li><strong>DB per tenant</strong>: easy backup/restore/delete per tenant, per-tenant encryption and region; painful at 10,000 tenants (connections, migrations ×10,000).</li>
<li><strong>Schema per tenant</strong>: middle ground; the Postgres catalog bloats beyond a few thousand schemas.</li>
<li><strong>Shared tables + <code>tenant_id</code></strong>: scales to millions of tenants; isolation relies on every query filtering by tenant — so enforce it in the database with <strong>Row-Level Security</strong>:</li>
</ul>
<pre>ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id =
    current_setting('app.tenant_id')::uuid);

-- per request, inside the transaction:
SET LOCAL app.tenant_id = '0193...';
SELECT * FROM invoices;  -- only this tenant's rows</pre>
<p>Put <code>tenant_id</code> first in composite indexes and in the primary key (<code>(tenant_id, id)</code>); it also becomes your natural shard key later (Citus distributes by it).</p>
<blockquote>⚠️ Production tip: The app's DB role must not be the table owner or a superuser — they bypass RLS. Add a CI test that runs a query as tenant A and asserts zero rows from tenant B.</blockquote>`,
        he: `<ul>
<li><strong>DB לכל tenant</strong>: קל לגבות/לשחזר/למחוק לכל tenant, הצפנה ו-region לכל tenant; כואב ב-10,000 tenants (connections, מיגרציות ×10,000).</li>
<li><strong>Schema לכל tenant</strong>: דרך ביניים; ה-catalog של Postgres מתנפח מעבר לכמה אלפי schemas.</li>
<li><strong>טבלאות משותפות + <code>tenant_id</code></strong>: מגיע למיליוני tenants; הבידוד תלוי בכך שכל query מסנן לפי tenant — לכן אוכפים את זה ב-DB עם <strong>Row-Level Security</strong>:</li>
</ul>
<pre>ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id =
    current_setting('app.tenant_id')::uuid);

-- per request, inside the transaction:
SET LOCAL app.tenant_id = '0193...';
SELECT * FROM invoices;  -- only this tenant's rows</pre>
<p>שמים את <code>tenant_id</code> ראשון באינדקסים מורכבים וב-primary key (<code>(tenant_id, id)</code>); הוא גם הופך בהמשך ל-shard key הטבעי (Citus מפזר לפיו).</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-role של האפליקציה ב-DB לא יכול להיות הבעלים של הטבלה או superuser — הם עוקפים RLS. מוסיפים בדיקה ב-CI שמריצה query כ-tenant A ומוודאת אפס שורות של tenant B.</blockquote>`
      }
    },
    {
      h: { en: "Noisy neighbors: quotas, limits and fairness", he: "Noisy neighbors: מכסות, מגבלות והוגנות" },
      body: {
        en: `<p>In a pool, one tenant running a 10M-row export can saturate the DB for everyone. Defenses at every layer:</p>
<ul>
<li><strong>API</strong>: per-tenant rate limits and concurrency limits (token bucket keyed by <code>tenant_id</code>), tiered by plan.</li>
<li><strong>Queues</strong>: per-tenant queues or fair scheduling (round-robin across tenants) so one tenant's 1M jobs don't starve others; cap in-flight jobs per tenant.</li>
<li><strong>DB</strong>: statement timeouts, per-tenant connection caps, move heavy tenants to their own shard.</li>
<li><strong>Storage</strong>: per-tenant quotas (rows, GB, seats) enforced at write time.</li>
<li><strong>Shuffle sharding</strong>: assign each tenant to a random subset of workers so one poison tenant can only take down a small, nearly unique combination.</li>
</ul>
<pre>workers=8, shard size=2 -&gt; C(8,2) = 28 combinations
A poison tenant kills its 2 workers; only tenants
on exactly that pair (~1/28) lose ALL capacity.
workers=100, size=5 -&gt; 75 million combinations.</pre>`,
        he: `<p>ב-pool, tenant אחד שמריץ export של 10M שורות יכול להרוות את ה-DB לכולם. הגנות בכל שכבה:</p>
<ul>
<li><strong>API</strong>: rate limits ו-concurrency limits לכל tenant (token bucket לפי <code>tenant_id</code>), מדורג לפי תוכנית.</li>
<li><strong>תורים</strong>: תור לכל tenant או תזמון הוגן (round-robin בין tenants) כדי שמיליון jobs של tenant אחד לא ירעיבו אחרים; מגבלת jobs בטיפול לכל tenant.</li>
<li><strong>DB</strong>: statement timeouts, מגבלת connections לכל tenant, העברת tenants כבדים ל-shard משלהם.</li>
<li><strong>אחסון</strong>: מכסות לכל tenant (שורות, GB, משתמשים) שנאכפות בזמן כתיבה.</li>
<li><strong>Shuffle sharding</strong>: משייכים כל tenant לתת-קבוצה אקראית של workers, כך ש-tenant רעיל יכול להפיל רק צירוף קטן וכמעט ייחודי.</li>
</ul>
<pre>workers=8, shard size=2 -&gt; C(8,2) = 28 combinations
A poison tenant kills its 2 workers; only tenants
on exactly that pair (~1/28) lose ALL capacity.
workers=100, size=5 -&gt; 75 million combinations.</pre>`
      }
    },
    {
      h: { en: "Routing, keys, lifecycle and cost", he: "ניתוב, מפתחות, מחזור חיים ועלות" },
      body: {
        en: `<ul>
<li><strong>Tenant resolution</strong>: from subdomain (<code>acme.app.com</code>), a token claim (<code>tid</code>) or the API key — resolve once at the edge, then propagate in context; never trust a tenant id from the request body.</li>
<li><strong>Placement directory</strong>: a small, highly available table <code>tenant_id → cell/shard/region</code>, cached at the router. It enables moving tenants between shards and data residency (EU tenants stay in the EU).</li>
<li><strong>Per-tenant keys (BYOK)</strong>: envelope encryption with a KMS key per tenant; deleting the key = crypto-shredding the tenant's data, even in backups.</li>
<li><strong>Onboarding/offboarding</strong>: automated provisioning (IaC for silo tenants) and a tested deletion pipeline with a grace period — it's a contract and GDPR obligation.</li>
<li><strong>Cost attribution</strong>: emit usage with <code>tenant_id</code> (requests, CPU-seconds, GB stored) to find unprofitable tenants. Beware: <code>tenant_id</code> as a Prometheus label is high-cardinality — send it to logs/usage pipelines instead.</li>
</ul>`,
        he: `<ul>
<li><strong>זיהוי ה-tenant</strong>: מתת-דומיין (<code>acme.app.com</code>), claim ב-token (<code>tid</code>) או מה-API key — מזהים פעם אחת בקצה ומעבירים הלאה ב-context; אף פעם לא סומכים על tenant id מגוף הבקשה.</li>
<li><strong>Placement directory</strong>: טבלה קטנה וזמינה מאוד <code>tenant_id → cell/shard/region</code>, ב-cache ב-router. היא מאפשרת להעביר tenants בין shards ולעמוד ב-data residency (tenants מאירופה נשארים באירופה).</li>
<li><strong>מפתחות לכל tenant (BYOK)</strong>: envelope encryption עם מפתח KMS לכל tenant; מחיקת המפתח = crypto-shredding של כל המידע שלו, גם בגיבויים.</li>
<li><strong>Onboarding/offboarding</strong>: הקמה אוטומטית (IaC ל-tenants ב-silo) ותהליך מחיקה בדוק עם תקופת חסד — זו התחייבות חוזית ו-GDPR.</li>
<li><strong>שיוך עלויות</strong>: מוציאים מדדי שימוש עם <code>tenant_id</code> (בקשות, CPU-seconds, GB) כדי למצוא tenants לא רווחיים. זהירות: <code>tenant_id</code> כ-label ב-Prometheus זה cardinality גבוה — שולחים אותו ללוגים/צינור usage.</li>
</ul>`
      }
    }
  ],
  diagram: `request (acme.app.com)
   |
 edge/router --lookup--> tenant directory: acme -> cell-2
   |
   +--> cell-1 [api|workers|db]  pool tenants A..M
   +--> cell-2 [api|workers|db]  pool tenants N..Z
   +--> silo   [api|workers|db]  BigBank only (own KMS key)`,
  handsOn: [
    { cmd: "psql -c \"SET app.tenant_id='00000000-0000-0000-0000-000000000001'; SELECT count(*) FROM invoices;\"", what: { en: "With RLS enabled (and a non-owner role), confirm you only see one tenant's rows.", he: "עם RLS פעיל (ו-role שאינו הבעלים), מוודאים שרואים רק שורות של tenant אחד." } },
    { cmd: "psql -c \"SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relrowsecurity;\"", what: { en: "List the tables that actually have RLS turned on — audit for gaps.", he: "מציגים אילו טבלאות באמת עם RLS — ביקורת על חורים." } },
    { cmd: "python -c \"from math import comb;print(comb(8,2), comb(100,5))\"", what: { en: "Count shuffle-shard combinations: 8 workers/2 per tenant vs 100 workers/5.", he: "סופרים צירופי shuffle-shard: 8 workers/2 לכל tenant מול 100 workers/5." } }
  ],
  mnemonic: {
    en: "\"House, apartment, penthouse — and every door is locked by the database, not by a developer's promise.\"",
    he: "\"בית, דירה, פנטהאוז — וכל דלת ננעלת ע\"י ה-DB, לא ע\"י הבטחה של מפתח.\""
  },
  pitfalls: [
    { en: "Relying on developers to remember WHERE tenant_id = ? — one missed query leaks data across customers.", he: "להסתמך על מפתחים שיזכרו WHERE tenant_id = ? — query אחד שנשכח מדליף מידע בין לקוחות." },
    { en: "Cache keys without tenant_id — tenant B gets tenant A's cached response.", he: "מפתחות cache בלי tenant_id — tenant B מקבל את התשובה של tenant A." },
    { en: "No per-tenant limits — the biggest customer's batch job becomes everyone's outage.", he: "אין מגבלות לכל tenant — ה-batch של הלקוח הכי גדול הופך לתקלה של כולם." }
  ],
  interview: [
    {
      q: { en: "A big enterprise customer wants isolation, but you run a pooled SaaS. What do you offer?", he: "לקוח enterprise גדול רוצה בידוד אבל אתם SaaS ב-pool. מה מציעים?" },
      a: { en: "A bridge/tier model: same code, but place them on a dedicated cell or database (optionally in their region with their own KMS key), driven by the tenant placement directory. Price the tier to cover the idle capacity. Keep one deploy pipeline so the silo never becomes a fork.", he: "מודל bridge/מדרג: אותו קוד, אבל ממקמים אותם על cell או DB ייעודי (אפשר גם ב-region שלהם ועם מפתח KMS משלהם), דרך ה-placement directory. מתמחרים את ה-tier כך שיכסה קיבולת לא מנוצלת. שומרים pipeline אחד כדי שה-silo לא יהפוך ל-fork." }
    },
    {
      q: { en: "How do you guarantee tenant A never sees tenant B's data in a shared DB?", he: "איך מבטיחים ש-tenant A לעולם לא יראה מידע של tenant B ב-DB משותף?" },
      a: { en: "Defense in depth: tenant resolved from the authenticated token, Postgres RLS with FORCE and a non-owner role, tenant_id in every cache key and object-storage prefix, per-object authz checks, automated cross-tenant tests in CI, and periodic audits.", he: "הגנה בשכבות: tenant מזוהה מה-token המאומת, RLS ב-Postgres עם FORCE ו-role שאינו בעלים, tenant_id בכל מפתח cache וב-prefix באחסון, בדיקות הרשאה לכל אובייקט, בדיקות חוצות-tenants אוטומטיות ב-CI, וביקורות תקופתיות." }
    }
  ],
  quiz: [
    {
      q: { en: "Which model has the lowest cost per tenant?", he: "לאיזה מודל העלות הכי נמוכה ל-tenant?" },
      options: [
        { en: "Silo", he: "Silo" },
        { en: "Pool", he: "Pool" },
        { en: "Bridge", he: "Bridge" },
        { en: "All equal", he: "כולם שווים" }
      ],
      answer: 1,
      explain: { en: "Pool shares all infrastructure, so idle capacity is amortized across tenants.", he: "Pool חולק את כל התשתית, אז קיבולת לא מנוצלת מתחלקת בין tenants." }
    },
    {
      q: { en: "Who bypasses Postgres RLS by default?", he: "מי עוקף RLS ב-Postgres כברירת מחדל?" },
      options: [
        { en: "Read-only users", he: "משתמשי קריאה בלבד" },
        { en: "Table owners and superusers", he: "בעלי הטבלה ו-superusers" },
        { en: "Users with SELECT", he: "משתמשים עם SELECT" },
        { en: "Nobody", he: "אף אחד" }
      ],
      answer: 1,
      explain: { en: "Owners skip policies unless FORCE ROW LEVEL SECURITY is set; superusers and BYPASSRLS roles always skip.", he: "בעלים מדלגים על policies אלא אם FORCE ROW LEVEL SECURITY; superusers ו-roles עם BYPASSRLS תמיד מדלגים." }
    },
    {
      q: { en: "What does shuffle sharding reduce?", he: "מה shuffle sharding מקטין?" },
      options: [
        { en: "Storage cost", he: "עלות אחסון" },
        { en: "The blast radius of a bad tenant", he: "את ה-blast radius של tenant רע" },
        { en: "DNS latency", he: "Latency של DNS" },
        { en: "The number of tenants", he: "מספר ה-tenants" }
      ],
      answer: 1,
      explain: { en: "Each tenant gets a nearly unique subset of workers, so few others share its full fate.", he: "כל tenant מקבל תת-קבוצה כמעט ייחודית של workers, אז מעטים חולקים את גורלו המלא." }
    },
    {
      q: { en: "Deleting a tenant's KMS key so their data is unreadable everywhere is called…", he: "מחיקת מפתח ה-KMS של tenant כדי שהמידע שלו לא יהיה קריא בשום מקום נקראת…" },
      options: [
        { en: "Sharding", he: "Sharding" },
        { en: "Crypto-shredding", he: "Crypto-shredding" },
        { en: "Tokenization", he: "Tokenization" },
        { en: "Hashing", he: "Hashing" }
      ],
      answer: 1,
      explain: { en: "Without the key, ciphertext in DBs and backups is useless — deletion by destroying the key.", he: "בלי המפתח, ה-ciphertext ב-DBs ובגיבויים חסר תועלת — מחיקה ע\"י השמדת המפתח." }
    }
  ],
  related: ["staff-cells-blast-radius", "pr-rate-limiters", "pr-auth", "pr-privacy", "db-sharding"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-security-owasp",
  track: "principal",
  order: 74,
  icon: "🛡️",
  level: 3,
  minutes: 15,
  title: { en: "Application Security: OWASP Top 10 with Fixes", he: "אבטחת אפליקציות: OWASP Top 10 עם תיקונים" },
  tldr: {
    en: "Most breaches are boring: missing per-object authorization, injection, SSRF, misconfiguration and old dependencies. Know each class, its one-line fix, and layer defenses so one mistake isn't a breach.",
    he: "רוב הפריצות משעממות: חוסר הרשאה לכל אובייקט, injection, SSRF, קונפיגורציה שגויה ותלויות ישנות. מכירים כל סוג, את התיקון שלו בשורה אחת, ובונים הגנה בשכבות כך שטעות אחת לא תהיה פריצה."
  },
  analogy: {
    en: "Securing an app is securing a castle. Injection is a messenger whose letter says 'and also open the gate' — and the guard obeys because he reads instructions and data from the same paper. IDOR is a cloakroom where any ticket number gets you any coat. SSRF is tricking the castle's own servant into fetching the treasury key for you, because the servant is trusted inside the walls. Defense in depth is moat + wall + gate + guard + locked vault: each one can fail; all of them failing together is unlikely.",
    he: "לאבטח אפליקציה זה לאבטח טירה. Injection זה שליח שהמכתב שלו אומר 'וגם תפתח את השער' — והשומר מציית כי הוא קורא הוראות ומידע מאותו דף. IDOR זה מלתחה שבה כל מספר כרטיס נותן לך כל מעיל. SSRF זה לעבוד על המשרת של הטירה עצמה שיביא לך את מפתח האוצר, כי סומכים עליו בתוך החומות. Defense in depth זה חפיר + חומה + שער + שומר + כספת נעולה: כל אחד יכול להיכשל; שכולם ייכשלו יחד — לא סביר."
  },
  sections: [
    {
      h: { en: "The Top 10 at a glance", he: "ה-Top 10 במבט אחד" },
      body: {
        en: `<table>
<tr><th>#</th><th>Class</th><th>One-line fix</th></tr>
<tr><td>A01</td><td>Broken access control (IDOR)</td><td>Check ownership of every object on the server</td></tr>
<tr><td>A02</td><td>Cryptographic failures</td><td>TLS everywhere, AES-GCM, KMS, argon2 for passwords</td></tr>
<tr><td>A03</td><td>Injection (SQL, command, XSS)</td><td>Parameterize; encode output; never concatenate</td></tr>
<tr><td>A04</td><td>Insecure design</td><td>Threat model before coding</td></tr>
<tr><td>A05</td><td>Security misconfiguration</td><td>Hardened defaults, IaC scanning, no debug in prod</td></tr>
<tr><td>A06</td><td>Vulnerable components</td><td>SBOM, Dependabot/Renovate, patch SLAs</td></tr>
<tr><td>A07</td><td>Auth failures</td><td>MFA, rate-limit login, OIDC, short sessions</td></tr>
<tr><td>A08</td><td>Software/data integrity</td><td>Signed artifacts, no unsafe deserialization</td></tr>
<tr><td>A09</td><td>Logging &amp; monitoring failures</td><td>Audit logs + alerts on auth anomalies</td></tr>
<tr><td>A10</td><td>SSRF</td><td>Allow-list egress, block metadata IPs, IMDSv2</td></tr>
</table>
<blockquote>💡 Real world: The 2019 Capital One breach (~100M customers) chained a WAF misconfiguration (A05) with SSRF (A10) to steal IAM credentials from the EC2 metadata service, then over-privileged S3 access (A01). Three "small" issues, one huge breach.</blockquote>`,
        he: `<table>
<tr><th>#</th><th>סוג</th><th>תיקון בשורה אחת</th></tr>
<tr><td>A01</td><td>Broken access control (IDOR)</td><td>בודקים בעלות על כל אובייקט בשרת</td></tr>
<tr><td>A02</td><td>כשלים קריפטוגרפיים</td><td>TLS בכל מקום, AES-GCM, KMS, argon2 לסיסמאות</td></tr>
<tr><td>A03</td><td>Injection (SQL, command, XSS)</td><td>פרמטרים; encoding בפלט; אף פעם לא שרשור</td></tr>
<tr><td>A04</td><td>Insecure design</td><td>Threat model לפני שכותבים קוד</td></tr>
<tr><td>A05</td><td>Security misconfiguration</td><td>ברירות מחדל מוקשחות, סריקת IaC, בלי debug בפרוד</td></tr>
<tr><td>A06</td><td>רכיבים פגיעים</td><td>SBOM, Dependabot/Renovate, SLA לטלאים</td></tr>
<tr><td>A07</td><td>כשלי אימות</td><td>MFA, rate limit על login, OIDC, sessions קצרים</td></tr>
<tr><td>A08</td><td>שלמות תוכנה/מידע</td><td>Artifacts חתומים, בלי deserialization לא בטוח</td></tr>
<tr><td>A09</td><td>כשלי לוגים וניטור</td><td>Audit logs + התראות על אנומליות באימות</td></tr>
<tr><td>A10</td><td>SSRF</td><td>Allow-list ליציאה, חסימת IPs של metadata, IMDSv2</td></tr>
</table>
<blockquote>💡 מהשטח: הפריצה ל-Capital One ב-2019 (~100M לקוחות) שרשרה קונפיגורציה שגויה של WAF (A05) עם SSRF (A10) כדי לגנוב IAM credentials משירות ה-metadata של EC2, ואז הרשאות S3 מופרזות (A01). שלוש בעיות "קטנות", פריצה ענקית אחת.</blockquote>`
      }
    },
    {
      h: { en: "Injection and XSS: code vs data", he: "Injection ו-XSS: קוד מול מידע" },
      body: {
        en: `<pre># SQL injection — VULNERABLE
q = "SELECT * FROM users WHERE email = '" + email + "'"
# email = "' OR '1'='1"  -&gt; returns every user

# FIXED — parameterized, driver sends data separately
cur.execute("SELECT * FROM users WHERE email = %s",
            (email,))

# Command injection — VULNERABLE
os.system("convert " + filename + " out.png")
# filename = "x.png; rm -rf /"
# FIXED
subprocess.run(["convert", filename, "out.png"])</pre>
<p><strong>XSS</strong> is injection into HTML: user input rendered as markup runs JavaScript in other users' browsers.</p>
<pre>// VULNERABLE
el.innerHTML = comment;   // "&lt;img src=x onerror=steal()&gt;"
// FIXED
el.textContent = comment; // rendered as text</pre>
<p>Frameworks (React, Vue, Angular) escape by default — XSS returns through the escape hatches: <code>dangerouslySetInnerHTML</code>, <code>v-html</code>, <code>bypassSecurityTrustHtml</code>. Sanitize with DOMPurify if you must render HTML, and add a <strong>Content-Security-Policy</strong> as the safety net.</p>`,
        he: `<pre># SQL injection — VULNERABLE
q = "SELECT * FROM users WHERE email = '" + email + "'"
# email = "' OR '1'='1"  -&gt; returns every user

# FIXED — parameterized, driver sends data separately
cur.execute("SELECT * FROM users WHERE email = %s",
            (email,))

# Command injection — VULNERABLE
os.system("convert " + filename + " out.png")
# filename = "x.png; rm -rf /"
# FIXED
subprocess.run(["convert", filename, "out.png"])</pre>
<p><strong>XSS</strong> זה injection לתוך HTML: קלט משתמש שמוצג כ-markup מריץ JavaScript בדפדפנים של משתמשים אחרים.</p>
<pre>// VULNERABLE
el.innerHTML = comment;   // "&lt;img src=x onerror=steal()&gt;"
// FIXED
el.textContent = comment; // rendered as text</pre>
<p>Frameworks (React, Vue, Angular) עושים escape כברירת מחדל — XSS חוזר דרך פתחי המילוט: <code>dangerouslySetInnerHTML</code>, <code>v-html</code>, <code>bypassSecurityTrustHtml</code>. אם חייבים להציג HTML עושים sanitize עם DOMPurify, ומוסיפים <strong>Content-Security-Policy</strong> כרשת ביטחון.</p>`
      }
    },
    {
      h: { en: "Broken access control and SSRF", he: "Broken access control ו-SSRF" },
      body: {
        en: `<pre># IDOR — VULNERABLE: any logged-in user reads any invoice
@app.get("/invoices/{id}")
def get_invoice(id, user=Depends(auth)):
    return db.get(Invoice, id)

# FIXED: scope by owner/tenant in the query itself
    inv = db.query(Invoice).filter_by(
        id=id, tenant_id=user.tenant_id).first()
    if not inv: raise HTTPException(404)  # not 403</pre>
<p><strong>SSRF</strong>: your server fetches a URL the attacker controls ("import from URL", webhooks, PDF renderers, image previews). The attacker points it inside your network:</p>
<pre>POST /import  {"url": "http://169.254.169.254/latest/
                       meta-data/iam/security-credentials/"}</pre>
<ul>
<li>Enforce <strong>IMDSv2</strong> on AWS (session token required, hop limit 1) — this alone blocks the classic metadata theft.</li>
<li>Resolve the hostname, then reject private/link-local ranges (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7) — and re-check after redirects (DNS rebinding).</li>
<li>Run fetchers in an isolated egress proxy/network with an allow-list.</li>
</ul>`,
        he: `<pre># IDOR — VULNERABLE: any logged-in user reads any invoice
@app.get("/invoices/{id}")
def get_invoice(id, user=Depends(auth)):
    return db.get(Invoice, id)

# FIXED: scope by owner/tenant in the query itself
    inv = db.query(Invoice).filter_by(
        id=id, tenant_id=user.tenant_id).first()
    if not inv: raise HTTPException(404)  # not 403</pre>
<p><strong>SSRF</strong>: השרת שלך מביא URL שהתוקף שולט בו ("ייבוא מ-URL", webhooks, יצירת PDF, תצוגה מקדימה של תמונות). התוקף מכוון אותו לתוך הרשת שלך:</p>
<pre>POST /import  {"url": "http://169.254.169.254/latest/
                       meta-data/iam/security-credentials/"}</pre>
<ul>
<li>אוכפים <strong>IMDSv2</strong> ב-AWS (נדרש session token, hop limit 1) — זה לבד חוסם את גניבת ה-metadata הקלאסית.</li>
<li>מפענחים את ה-hostname ואז דוחים טווחים פרטיים/link-local (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7) — ובודקים שוב אחרי redirects (DNS rebinding).</li>
<li>מריצים את ה-fetchers ב-proxy יציאה מבודד/רשת נפרדת עם allow-list.</li>
</ul>`
      }
    },
    {
      h: { en: "Deserialization, dependencies, secrets, logging", he: "Deserialization, תלויות, סודות ולוגים" },
      body: {
        en: `<ul>
<li><strong>Insecure deserialization</strong>: <code>pickle.loads</code>, Java native serialization, <code>yaml.load</code> (unsafe loader) and .NET BinaryFormatter can execute code from attacker bytes. Use JSON/Protobuf, <code>yaml.safe_load</code>, and never deserialize untrusted input into arbitrary types.</li>
<li><strong>Vulnerable dependencies</strong>: Log4Shell (Dec 2021, CVSS 10) was one JNDI lookup in a logging library used everywhere. Keep an SBOM, auto-PR updates, and a patch SLA (critical: 48 h).</li>
<li><strong>Secrets</strong>: never in git, images or env dumps; use a secret manager (Vault, AWS Secrets Manager) or workload identity, rotate, and scan commits (gitleaks, GitHub push protection).</li>
<li><strong>Logging failures</strong>: log auth events, permission denials and admin actions with user, IP and request id — but never passwords, tokens or full card numbers.</li>
</ul>
<pre># Security headers worth sending
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Frame-ancestors via CSP (replaces X-Frame-Options)</pre>`,
        he: `<ul>
<li><strong>Insecure deserialization</strong>: <code>pickle.loads</code>, serialization מובנה של Java, <code>yaml.load</code> (loader לא בטוח) ו-BinaryFormatter של .NET יכולים להריץ קוד מבתים של תוקף. משתמשים ב-JSON/Protobuf, <code>yaml.safe_load</code>, ולעולם לא עושים deserialize לקלט לא אמין לטיפוסים שרירותיים.</li>
<li><strong>תלויות פגיעות</strong>: Log4Shell (דצמבר 2021, CVSS 10) היה JNDI lookup אחד בספריית לוגים שבשימוש בכל מקום. מחזיקים SBOM, PRs אוטומטיים לעדכונים ו-SLA לטלאים (קריטי: 48 שעות).</li>
<li><strong>סודות</strong>: אף פעם לא ב-git, ב-images או ב-dump של env; משתמשים ב-secret manager (Vault, AWS Secrets Manager) או workload identity, מחליפים, וסורקים commits (gitleaks, GitHub push protection).</li>
<li><strong>כשלי לוגים</strong>: רושמים אירועי אימות, דחיות הרשאה ופעולות admin עם user, IP ו-request id — אבל לעולם לא סיסמאות, tokens או מספרי כרטיס מלאים.</li>
</ul>
<pre># Security headers worth sending
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Frame-ancestors via CSP (replaces X-Frame-Options)</pre>`
      }
    },
    {
      h: { en: "Principal habits: least privilege and defense in depth", he: "הרגלים של Principal: least privilege ו-defense in depth" },
      body: {
        en: `<ul>
<li><strong>Threat model every new design</strong> (STRIDE: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation) — 30 minutes in the design review catches what pen-tests find months later.</li>
<li><strong>Least privilege</strong>: each service gets its own identity with only the actions it needs; DB users can't DROP; CI can deploy only its own app.</li>
<li><strong>Defense in depth</strong>: WAF + input validation + parameterized queries + least-privilege DB user + egress control + monitoring. Assume each layer will fail sometime.</li>
<li><strong>Shift left, verify right</strong>: SAST/secret scanning in PRs, DAST against staging, bug bounty and pen-tests in prod.</li>
<li><strong>Fail closed</strong>: if the authz service is down, deny — don't allow.</li>
</ul>
<blockquote>⚠️ Production tip: Return 404 rather than 403 for objects the user can't access — 403 confirms the object exists, which helps enumeration.</blockquote>`,
        he: `<ul>
<li><strong>Threat model לכל design חדש</strong> (STRIDE: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation) — 30 דקות ב-design review תופסות את מה ש-pen-tests מוצאים חודשים אחר כך.</li>
<li><strong>Least privilege</strong>: לכל service זהות משלו עם רק הפעולות שהוא צריך; משתמשי DB לא יכולים DROP; CI יכול לעשות deploy רק לאפליקציה שלו.</li>
<li><strong>Defense in depth</strong>: WAF + ולידציה לקלט + queries עם פרמטרים + משתמש DB עם הרשאות מינימליות + בקרת יציאה + ניטור. מניחים שכל שכבה תיכשל מתישהו.</li>
<li><strong>Shift left, verify right</strong>: SAST וסריקת סודות ב-PRs, DAST מול staging, bug bounty ו-pen-tests בפרוד.</li>
<li><strong>Fail closed</strong>: אם שירות ההרשאות למטה — דוחים, לא מאשרים.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מחזירים 404 ולא 403 לאובייקטים שהמשתמש לא רשאי לגשת אליהם — 403 מאשר שהאובייקט קיים, וזה עוזר ל-enumeration.</blockquote>`
      }
    }
  ],
  diagram: `attacker
   | WAF / rate limit        (layer 1)
   v
 API: authN -> authZ per object   (layer 2)
   | validated, parameterized       (layer 3)
   v
 DB user: least privilege          (layer 4)
 egress proxy: allow-list, no 169.254.169.254 (layer 5)
 audit logs + alerts               (layer 6)`,
  handsOn: [
    { cmd: "curl -sI https://github.com | grep -iE 'strict-transport|content-security|x-content-type'", what: { en: "Inspect the security headers a mature site sends.", he: "בודקים את ה-security headers שאתר בוגר שולח." } },
    { cmd: "npm audit --omit=dev || pip-audit", what: { en: "List known-vulnerable dependencies in a Node or Python project.", he: "מציגים תלויות עם פגיעויות ידועות בפרויקט Node או Python." } },
    { cmd: "gitleaks detect --source . --no-banner", what: { en: "Scan a repo's history for committed secrets.", he: "סורקים את ההיסטוריה של repo לסודות שנכנסו ל-commits." } },
    { cmd: "aws ec2 modify-instance-metadata-options --instance-id i-0abc --http-tokens required --http-put-response-hop-limit 1", what: { en: "Enforce IMDSv2 on an EC2 instance to blunt SSRF credential theft.", he: "אוכפים IMDSv2 על instance ב-EC2 כדי לנטרל גניבת credentials דרך SSRF." } }
  ],
  mnemonic: {
    en: "\"Never mix code and data, check every object, block the metadata, patch the deps, log the denials.\"",
    he: "\"לא מערבבים קוד ומידע, בודקים כל אובייקט, חוסמים metadata, מעדכנים תלויות, רושמים דחיות.\""
  },
  pitfalls: [
    { en: "Trusting the frontend to hide buttons — the API must enforce authorization itself.", he: "לסמוך על ה-frontend שיסתיר כפתורים — ה-API חייב לאכוף הרשאה בעצמו." },
    { en: "Blocklisting 'bad' URLs for SSRF — attackers use decimal IPs, IPv6, redirects and DNS rebinding. Allow-list instead.", he: "Blocklist ל-URLs 'רעים' נגד SSRF — תוקפים משתמשים ב-IP עשרוני, IPv6, redirects ו-DNS rebinding. עושים allow-list." },
    { en: "Logging full request bodies — passwords and tokens end up in your log vendor.", he: "רישום גוף בקשה מלא — סיסמאות ו-tokens נוחתים אצל ספק הלוגים." }
  ],
  interview: [
    {
      q: { en: "You're adding 'import image from URL'. What security controls do you design in?", he: "מוסיפים 'ייבוא תמונה מ-URL'. אילו בקרות אבטחה תתכנן?" },
      a: { en: "SSRF controls: fetch from an isolated worker through an egress proxy; only http/https; resolve DNS and block private/link-local/metadata ranges, re-validate after each redirect, cap redirects, size and time; IMDSv2 on hosts; validate the content type by magic bytes; process images in a sandbox (ImageMagick has a CVE history); store in object storage with a random key; log and rate-limit per user.", he: "בקרות SSRF: מביאים מ-worker מבודד דרך egress proxy; רק http/https; מפענחים DNS וחוסמים טווחים פרטיים/link-local/metadata, בודקים שוב אחרי כל redirect, מגבילים redirects, גודל וזמן; IMDSv2 על ה-hosts; מוודאים סוג קובץ לפי magic bytes; מעבדים תמונות ב-sandbox (ל-ImageMagick היסטוריה של CVEs); שומרים ב-object storage עם מפתח אקראי; לוג ו-rate limit לכל משתמש." }
    },
    {
      q: { en: "What is IDOR and how do you prevent it systematically?", he: "מה זה IDOR ואיך מונעים אותו באופן שיטתי?" },
      a: { en: "Insecure Direct Object Reference: the API trusts an id from the request without checking the caller may access it. Prevent by scoping every query by owner/tenant (repository layer that requires a principal), central policy checks, RLS in the DB, non-guessable ids as a bonus, and automated tests that call each endpoint with another user's ids.", he: "Insecure Direct Object Reference: ה-API סומך על id מהבקשה בלי לבדוק שהקורא רשאי לגשת. מונעים ע\"י הגבלת כל query לבעלים/tenant (שכבת repository שמחייבת principal), בדיקות policy מרכזיות, RLS ב-DB, מזהים לא ניתנים לניחוש כבונוס, ובדיקות אוטומטיות שקוראות לכל endpoint עם מזהים של משתמש אחר." }
    }
  ],
  quiz: [
    {
      q: { en: "Correct fix for SQL injection?", he: "התיקון הנכון ל-SQL injection?" },
      options: [
        { en: "Escape quotes manually", he: "לעשות escape לגרשיים ידנית" },
        { en: "Parameterized queries / prepared statements", he: "Queries עם פרמטרים / prepared statements" },
        { en: "A WAF only", he: "רק WAF" },
        { en: "Hide error messages", he: "להסתיר הודעות שגיאה" }
      ],
      answer: 1,
      explain: { en: "Parameters keep data out of the SQL grammar entirely; the others are partial at best.", he: "פרמטרים מוציאים את המידע לגמרי מהדקדוק של SQL; השאר חלקיים במקרה הטוב." }
    },
    {
      q: { en: "Which IP is the classic SSRF target in the cloud?", he: "איזה IP הוא המטרה הקלאסית של SSRF בענן?" },
      options: [
        { en: "8.8.8.8", he: "8.8.8.8" },
        { en: "169.254.169.254", he: "169.254.169.254" },
        { en: "10.0.0.1", he: "10.0.0.1" },
        { en: "255.255.255.255", he: "255.255.255.255" }
      ],
      answer: 1,
      explain: { en: "The instance metadata service hands out temporary IAM credentials.", he: "שירות ה-metadata של ה-instance מחלק IAM credentials זמניים." }
    },
    {
      q: { en: "React escapes output by default. Where does XSS still sneak in?", he: "React עושה escape לפלט כברירת מחדל. איפה XSS עדיין מתגנב?" },
      options: [
        { en: "useState", he: "useState" },
        { en: "dangerouslySetInnerHTML", he: "dangerouslySetInnerHTML" },
        { en: "className", he: "className" },
        { en: "useEffect", he: "useEffect" }
      ],
      answer: 1,
      explain: { en: "It renders raw HTML; sanitize with DOMPurify and enforce CSP.", he: "הוא מציג HTML גולמי; עושים sanitize עם DOMPurify ואוכפים CSP." }
    },
    {
      q: { en: "Why return 404 instead of 403 for another user's object?", he: "למה להחזיר 404 ולא 403 לאובייקט של משתמש אחר?" },
      options: [
        { en: "404 is faster", he: "404 מהיר יותר" },
        { en: "It doesn't confirm the object exists", he: "הוא לא מאשר שהאובייקט קיים" },
        { en: "Browsers cache 403", he: "דפדפנים שומרים 403 ב-cache" },
        { en: "HTTP spec requires it", he: "ה-spec של HTTP מחייב" }
      ],
      answer: 1,
      explain: { en: "403 leaks existence and aids enumeration.", he: "403 חושף קיום ועוזר ל-enumeration." }
    }
  ],
  related: ["pr-auth", "staff-supply-chain", "staff-zero-trust-secrets", "cloud-iam-security", "pr-validate-yourself"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-race-deadlock",
  track: "principal",
  order: 75,
  icon: "🔒",
  level: 3,
  minutes: 16,
  title: { en: "Race Conditions & Deadlocks: in Code and in the Database", he: "Race Conditions ו-Deadlocks: בקוד וב-Database" },
  tldr: {
    en: "A race is two actors doing read-then-write on shared state; fix it with atomic operations, locks, or optimistic versions. A deadlock is two actors each holding what the other needs; fix it with consistent lock ordering, short transactions and retries.",
    he: "Race זה שני גורמים שעושים קריאה-ואז-כתיבה על state משותף; מתקנים עם פעולות אטומיות, נעילות או גרסאות אופטימיות. Deadlock זה שני גורמים שכל אחד מחזיק במה שהשני צריך; מתקנים עם סדר נעילה עקבי, טרנזקציות קצרות ו-retries."
  },
  analogy: {
    en: "A race condition: two people share one bank card; both check the ATM balance (₪100) at the same moment in different branches, both withdraw ₪100, and the bank lost ₪100 because each acted on a stale reading. A deadlock: two cars meet on a one-lane bridge from opposite sides — each waits for the other to back up, forever. The fix for the bridge is a rule ('northbound always yields') — that's lock ordering.",
    he: "Race condition: שני אנשים חולקים כרטיס בנק אחד; שניהם בודקים יתרה בכספומט (₪100) באותו רגע בסניפים שונים, שניהם מושכים ₪100, והבנק הפסיד ₪100 כי כל אחד פעל לפי קריאה ישנה. Deadlock: שתי מכוניות נפגשות על גשר חד-נתיבי משני הצדדים — כל אחת מחכה שהשנייה תיסוג, לנצח. התיקון לגשר הוא חוק ('מי שנוסע צפונה תמיד מפנה') — זה lock ordering."
  },
  sections: [
    {
      h: { en: "Races in code: check-then-act", he: "Races בקוד: check-then-act" },
      body: {
        en: `<pre># Python threads — counter race
count = 0
def work():
    global count
    for _ in range(100_000):
        count += 1      # read, add, write: 3 steps
# 4 threads -&gt; expected 400000, got 287413

# FIX: lock (or an atomic / per-thread sum)
lock = threading.Lock()
def work():
    global count
    for _ in range(100_000):
        with lock:
            count += 1</pre>
<pre>// Go — double booking (check-then-act)
if !seatTaken[s] {        // T1 and T2 both see false
    seatTaken[s] = true   // both "book" seat 14C
    book(user, s)
}
// FIX: mu.Lock(); defer mu.Unlock() around both,
// or an atomic CompareAndSwap on the seat state.
// Detect: go test -race ./...</pre>
<p>A race needs: <strong>shared mutable state + concurrency + a non-atomic read-modify-write</strong>. Remove any one: make state immutable or owned by one goroutine/actor (message passing), serialize access, or use an atomic primitive (CAS, <code>AtomicInteger</code>, <code>Interlocked</code>).</p>`,
        he: `<pre># Python threads — counter race
count = 0
def work():
    global count
    for _ in range(100_000):
        count += 1      # read, add, write: 3 steps
# 4 threads -&gt; expected 400000, got 287413

# FIX: lock (or an atomic / per-thread sum)
lock = threading.Lock()
def work():
    global count
    for _ in range(100_000):
        with lock:
            count += 1</pre>
<pre>// Go — double booking (check-then-act)
if !seatTaken[s] {        // T1 and T2 both see false
    seatTaken[s] = true   // both "book" seat 14C
    book(user, s)
}
// FIX: mu.Lock(); defer mu.Unlock() around both,
// or an atomic CompareAndSwap on the seat state.
// Detect: go test -race ./...</pre>
<p>Race צריך: <strong>state משותף שניתן לשינוי + מקביליות + read-modify-write לא אטומי</strong>. מורידים אחד מהם: state immutable או בבעלות goroutine/actor אחד (העברת הודעות), סריאליזציה של הגישה, או primitive אטומי (CAS, <code>AtomicInteger</code>, <code>Interlocked</code>).</p>`
      }
    },
    {
      h: { en: "Deadlocks in code", he: "Deadlocks בקוד" },
      body: {
        en: `<pre>// Java — transfer(a, b) and transfer(b, a) concurrently
void transfer(Account from, Account to, long amt) {
  synchronized (from) {        // T1 locks A, T2 locks B
    synchronized (to) {        // T1 waits B, T2 waits A
      from.debit(amt); to.credit(amt);
    }
  }
}

// FIX: global lock order (e.g. by account id)
Account first  = from.id &lt; to.id ? from : to;
Account second = from.id &lt; to.id ? to : from;
synchronized (first) { synchronized (second) { ... } }</pre>
<p>The four <strong>Coffman conditions</strong> must all hold for deadlock: mutual exclusion, hold-and-wait, no preemption, circular wait. Break one: ordered locking (circular wait), <code>tryLock(timeout)</code> and back off (no preemption), acquire all locks at once (hold-and-wait).</p>
<blockquote>💡 Real world: <code>jstack &lt;pid&gt;</code> prints "Found one Java-level deadlock" with both threads and the monitors they hold; Go's runtime panics with "all goroutines are asleep - deadlock!" when every goroutine is blocked.</blockquote>`,
        he: `<pre>// Java — transfer(a, b) and transfer(b, a) concurrently
void transfer(Account from, Account to, long amt) {
  synchronized (from) {        // T1 locks A, T2 locks B
    synchronized (to) {        // T1 waits B, T2 waits A
      from.debit(amt); to.credit(amt);
    }
  }
}

// FIX: global lock order (e.g. by account id)
Account first  = from.id &lt; to.id ? from : to;
Account second = from.id &lt; to.id ? to : from;
synchronized (first) { synchronized (second) { ... } }</pre>
<p>ארבעת <strong>תנאי Coffman</strong> חייבים להתקיים כולם ל-deadlock: mutual exclusion, hold-and-wait, no preemption, circular wait. שוברים אחד: נעילה בסדר קבוע (circular wait), <code>tryLock(timeout)</code> ונסיגה (no preemption), לקיחת כל הנעילות בבת אחת (hold-and-wait).</p>
<blockquote>💡 מהשטח: <code>jstack &lt;pid&gt;</code> מדפיס "Found one Java-level deadlock" עם שני ה-threads וה-monitors שהם מחזיקים; ה-runtime של Go עושה panic עם "all goroutines are asleep - deadlock!" כשכל ה-goroutines חסומים.</blockquote>`
      }
    },
    {
      h: { en: "Database races: the lost update and its 4 fixes", he: "Races ב-DB: lost update וארבעת התיקונים" },
      body: {
        en: `<pre>-- balance = 100. Two requests withdraw 80 at once.
T1: SELECT balance FROM acc WHERE id=1;  -- 100
T2: SELECT balance FROM acc WHERE id=1;  -- 100
T1: UPDATE acc SET balance=20 WHERE id=1; -- 100-80
T2: UPDATE acc SET balance=20 WHERE id=1; -- 100-80
-- both succeed: 160 paid out, balance 20. LOST UPDATE</pre>
<pre>-- Fix 1: atomic update + guard (best when possible)
UPDATE acc SET balance = balance - 80
 WHERE id = 1 AND balance &gt;= 80;   -- 0 rows = refuse

-- Fix 2: pessimistic lock
BEGIN;
SELECT balance FROM acc WHERE id=1 FOR UPDATE;
-- T2 blocks here until T1 commits
UPDATE acc SET balance = 20 WHERE id=1;
COMMIT;

-- Fix 3: optimistic locking (version column)
UPDATE acc SET balance=20, version=version+1
 WHERE id=1 AND version=7;  -- 0 rows -&gt; reload, retry

-- Fix 4: SERIALIZABLE isolation + retry on
-- ERROR: could not serialize access (SQLSTATE 40001)</pre>
<table>
<tr><th>Fix</th><th>Use when</th></tr>
<tr><td>Atomic UPDATE</td><td>Logic fits in one statement</td></tr>
<tr><td>FOR UPDATE</td><td>High contention, short transactions</td></tr>
<tr><td>Optimistic version</td><td>Low contention, long user edits (forms, ETag/If-Match)</td></tr>
<tr><td>SERIALIZABLE</td><td>Complex invariants across rows; you have retry logic</td></tr>
</table>`,
        he: `<pre>-- balance = 100. Two requests withdraw 80 at once.
T1: SELECT balance FROM acc WHERE id=1;  -- 100
T2: SELECT balance FROM acc WHERE id=1;  -- 100
T1: UPDATE acc SET balance=20 WHERE id=1; -- 100-80
T2: UPDATE acc SET balance=20 WHERE id=1; -- 100-80
-- both succeed: 160 paid out, balance 20. LOST UPDATE</pre>
<pre>-- Fix 1: atomic update + guard (best when possible)
UPDATE acc SET balance = balance - 80
 WHERE id = 1 AND balance &gt;= 80;   -- 0 rows = refuse

-- Fix 2: pessimistic lock
BEGIN;
SELECT balance FROM acc WHERE id=1 FOR UPDATE;
-- T2 blocks here until T1 commits
UPDATE acc SET balance = 20 WHERE id=1;
COMMIT;

-- Fix 3: optimistic locking (version column)
UPDATE acc SET balance=20, version=version+1
 WHERE id=1 AND version=7;  -- 0 rows -&gt; reload, retry

-- Fix 4: SERIALIZABLE isolation + retry on
-- ERROR: could not serialize access (SQLSTATE 40001)</pre>
<table>
<tr><th>תיקון</th><th>מתי</th></tr>
<tr><td>UPDATE אטומי</td><td>הלוגיקה נכנסת ב-statement אחד</td></tr>
<tr><td>FOR UPDATE</td><td>תחרות גבוהה, טרנזקציות קצרות</td></tr>
<tr><td>Version אופטימי</td><td>תחרות נמוכה, עריכות ארוכות של משתמש (טפסים, ETag/If-Match)</td></tr>
<tr><td>SERIALIZABLE</td><td>Invariants מורכבים על כמה שורות; יש לוגיקת retry</td></tr>
</table>`
      }
    },
    {
      h: { en: "Database deadlocks and write skew", he: "Deadlocks ב-DB ו-write skew" },
      body: {
        en: `<pre>T1: BEGIN; UPDATE acc SET b=b-10 WHERE id=1; -- locks row 1
T2: BEGIN; UPDATE acc SET b=b-10 WHERE id=2; -- locks row 2
T1: UPDATE acc SET b=b+10 WHERE id=2;  -- waits for T2
T2: UPDATE acc SET b=b+10 WHERE id=1;  -- waits for T1
-- after deadlock_timeout (1 s) Postgres picks a victim:
ERROR:  deadlock detected
DETAIL: Process 4211 waits for ShareLock on transaction
        9182; blocked by process 4207.
        Process 4207 waits for ShareLock on transaction
        9183; blocked by process 4211.
HINT:  See server log for query details.</pre>
<ul>
<li><strong>Fix</strong>: touch rows in a consistent order (<code>ORDER BY id</code> before updating, or <code>SELECT ... WHERE id IN (1,2) ORDER BY id FOR UPDATE</code>), keep transactions short (no HTTP calls inside!), and <strong>retry the victim</strong> (SQLSTATE 40P01) with backoff.</li>
<li><strong>Write skew</strong> (snapshot isolation anomaly): rule "at least one doctor on call". Alice and Bob each read "2 on call", each set themselves off-call on different rows — no row conflict, both commit, zero doctors. Fix: <code>SERIALIZABLE</code>, or lock the set with <code>SELECT ... FOR UPDATE</code> on all on-call rows, or materialize the constraint (a single counter row).</li>
</ul>
<blockquote>⚠️ Production tip: Set <code>log_lock_waits = on</code> and <code>lock_timeout</code>/<code>statement_timeout</code> per app role. A migration that takes an ACCESS EXCLUSIVE lock and waits behind a long query blocks every other query on that table — use <code>SET lock_timeout = '3s'</code> in migrations.</blockquote>`,
        he: `<pre>T1: BEGIN; UPDATE acc SET b=b-10 WHERE id=1; -- locks row 1
T2: BEGIN; UPDATE acc SET b=b-10 WHERE id=2; -- locks row 2
T1: UPDATE acc SET b=b+10 WHERE id=2;  -- waits for T2
T2: UPDATE acc SET b=b+10 WHERE id=1;  -- waits for T1
-- after deadlock_timeout (1 s) Postgres picks a victim:
ERROR:  deadlock detected
DETAIL: Process 4211 waits for ShareLock on transaction
        9182; blocked by process 4207.
        Process 4207 waits for ShareLock on transaction
        9183; blocked by process 4211.
HINT:  See server log for query details.</pre>
<ul>
<li><strong>תיקון</strong>: נוגעים בשורות בסדר עקבי (<code>ORDER BY id</code> לפני עדכון, או <code>SELECT ... WHERE id IN (1,2) ORDER BY id FOR UPDATE</code>), שומרים טרנזקציות קצרות (בלי קריאות HTTP בפנים!), ו-<strong>retry לקורבן</strong> (SQLSTATE 40P01) עם backoff.</li>
<li><strong>Write skew</strong> (אנומליה של snapshot isolation): חוק "לפחות רופא אחד בתורנות". אליס ובוב כל אחד קורא "2 בתורנות", כל אחד מוריד את עצמו בשורה אחרת — אין התנגשות שורות, שניהם עושים commit, אפס רופאים. תיקון: <code>SERIALIZABLE</code>, או נעילת הקבוצה עם <code>SELECT ... FOR UPDATE</code> על כל שורות התורנות, או מימוש האילוץ כשורת מונה אחת.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מגדירים <code>log_lock_waits = on</code> ו-<code>lock_timeout</code>/<code>statement_timeout</code> לכל role של אפליקציה. מיגרציה שלוקחת ACCESS EXCLUSIVE lock ומחכה מאחורי query ארוך חוסמת כל query אחר על הטבלה — משתמשים ב-<code>SET lock_timeout = '3s'</code> במיגרציות.</blockquote>`
      }
    },
    {
      h: { en: "Distributed races and TOCTOU", he: "Races מבוזרים ו-TOCTOU" },
      body: {
        en: `<p>With 10 pods, an in-process mutex protects nothing — each pod has its own. Options, best first:</p>
<ul>
<li><strong>Let the DB enforce it</strong>: unique index (<code>UNIQUE (flight_id, seat)</code>) — the second insert fails with 23505; the conditional UPDATE above; <code>INSERT ... ON CONFLICT DO NOTHING</code>.</li>
<li><strong>Advisory locks</strong>: <code>SELECT pg_try_advisory_xact_lock(hashtext('report:2026-11'))</code> — one runner per key.</li>
<li><strong>Distributed lock</strong> (Redis <code>SET key val NX PX 30000</code>, etcd lease) — but a paused process (GC, VM stall) can outlive its lease, so protect the resource with a <strong>fencing token</strong> (monotonic number the storage checks).</li>
<li><strong>Single writer</strong>: partition by key (Kafka partition per account) so only one consumer touches an entity.</li>
</ul>
<p><strong>TOCTOU</strong> (time-of-check to time-of-use) in filesystems: <code>if os.path.exists(p): open(p)</code> — the file can change in between (symlink attacks in /tmp). Use atomic operations: <code>open(p, O_CREAT|O_EXCL)</code>, write to temp + <code>rename()</code> (atomic on POSIX).</p>
<pre>-- see who blocks whom right now (Postgres)
SELECT pid, pg_blocking_pids(pid) AS blocked_by,
       wait_event_type, left(query, 60)
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) &gt; 0;</pre>`,
        he: `<p>עם 10 pods, mutex בתוך ה-process לא מגן על כלום — לכל pod יש אחד משלו. אפשרויות, מהטובה ביותר:</p>
<ul>
<li><strong>לתת ל-DB לאכוף</strong>: unique index (<code>UNIQUE (flight_id, seat)</code>) — ה-insert השני נכשל עם 23505; ה-UPDATE המותנה מלמעלה; <code>INSERT ... ON CONFLICT DO NOTHING</code>.</li>
<li><strong>Advisory locks</strong>: <code>SELECT pg_try_advisory_xact_lock(hashtext('report:2026-11'))</code> — מריץ אחד לכל מפתח.</li>
<li><strong>Distributed lock</strong> (Redis <code>SET key val NX PX 30000</code>, lease ב-etcd) — אבל process שנעצר (GC, VM תקוע) יכול לחיות אחרי שה-lease פג, אז מגינים על המשאב עם <strong>fencing token</strong> (מספר עולה שהאחסון בודק).</li>
<li><strong>כותב יחיד</strong>: partition לפי מפתח (partition ב-Kafka לכל חשבון) כך שרק consumer אחד נוגע בישות.</li>
</ul>
<p><strong>TOCTOU</strong> (time-of-check to time-of-use) במערכת קבצים: <code>if os.path.exists(p): open(p)</code> — הקובץ יכול להשתנות באמצע (התקפות symlink ב-/tmp). משתמשים בפעולות אטומיות: <code>open(p, O_CREAT|O_EXCL)</code>, כתיבה לקובץ זמני + <code>rename()</code> (אטומי ב-POSIX).</p>
<pre>-- see who blocks whom right now (Postgres)
SELECT pid, pg_blocking_pids(pid) AS blocked_by,
       wait_event_type, left(query, 60)
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) &gt; 0;</pre>`
      }
    }
  ],
  diagram: `RACE (lost update)            DEADLOCK (circular wait)
T1 read 100                    T1 holds A ---wants---> B
T2 read 100                       ^                    |
T1 write 20                       |                    v
T2 write 20   (T1 lost)        A <---wants--- T2 holds B
fix: atomic / lock / version   fix: same order A then B`,
  handsOn: [
    { cmd: "python -c \"import threading as t;c=[0]\ndef w():\n for _ in range(10**6):c[0]+=1\nts=[t.Thread(target=w) for _ in range(4)];[x.start() for x in ts];[x.join() for x in ts];print(c[0])\"", what: { en: "Run a 4-thread counter; on many Python versions the total is below 4,000,000 (lost updates).", he: "מריצים מונה עם 4 threads; בהרבה גרסאות Python הסכום נמוך מ-4,000,000 (עדכונים אבודים)." } },
    { cmd: "go test -race ./...", what: { en: "Go's race detector flags unsynchronized concurrent memory access in tests.", he: "ה-race detector של Go מסמן גישה מקבילית לא מסונכרנת לזיכרון בבדיקות." } },
    { cmd: "psql -c \"SELECT locktype, relation::regclass, mode, granted, pid FROM pg_locks WHERE NOT granted;\"", what: { en: "List locks that are waiting — the first step in a blocking investigation.", he: "מציגים נעילות שממתינות — הצעד הראשון בחקירת חסימה." } },
    { cmd: "jstack $(pgrep -f java | head -1) | grep -A 20 'deadlock'", what: { en: "Dump JVM threads and look for the 'Found one Java-level deadlock' report.", he: "עושים dump ל-threads של ה-JVM ומחפשים את הדיווח 'Found one Java-level deadlock'." } }
  ],
  mnemonic: {
    en: "\"Race = read-modify-write without a fence. Deadlock = a circle of waiting. Fence the write, break the circle.\"",
    he: "\"Race = קריאה-שינוי-כתיבה בלי גדר. Deadlock = מעגל של המתנה. גודרים את הכתיבה, שוברים את המעגל.\""
  },
  pitfalls: [
    { en: "Using an in-memory lock to protect a resource shared by multiple pods — it protects nothing.", he: "שימוש בנעילה בזיכרון כדי להגן על משאב שחולקים כמה pods — היא לא מגינה על כלום." },
    { en: "Making HTTP calls inside a DB transaction that holds row locks — lock duration becomes network latency.", he: "קריאות HTTP בתוך טרנזקציה שמחזיקה row locks — משך הנעילה הופך ל-latency של הרשת." },
    { en: "Using SERIALIZABLE without retry logic — serialization failures become user-facing errors.", he: "SERIALIZABLE בלי לוגיקת retry — כשלי serialization הופכים לשגיאות למשתמש." },
    { en: "Trusting a Redis lock alone for correctness — a GC pause can make two holders; use fencing tokens or DB constraints.", he: "להסתמך רק על נעילת Redis לנכונות — GC pause יכול ליצור שני מחזיקים; משתמשים ב-fencing tokens או אילוצי DB." }
  ],
  interview: [
    {
      q: { en: "Design seat booking so two users can never book the same seat.", he: "תכנן הזמנת מושבים כך ששני משתמשים לעולם לא יזמינו אותו מושב." },
      a: { en: "Make the database the arbiter: a seats table with status and a conditional UPDATE seats SET status='HELD', holder=?, held_until=now()+10min WHERE id=? AND status='FREE' (0 rows = taken), or a UNIQUE(flight, seat) on bookings. Holds expire via a sweeper. No app-level locks needed; idempotency key on the booking request handles retries.", he: "ה-DB הוא הבורר: טבלת seats עם status ו-UPDATE מותנה SET status='HELD', holder=?, held_until=now()+10min WHERE id=? AND status='FREE' (0 שורות = תפוס), או UNIQUE(flight, seat) על bookings. Holds פגים דרך sweeper. לא צריך נעילות באפליקציה; idempotency key על בקשת ההזמנה מטפל ב-retries." }
    },
    {
      q: { en: "Your service logs 'deadlock detected' a few times an hour. What do you do?", he: "השירות שלך רושם 'deadlock detected' כמה פעמים בשעה. מה עושים?" },
      a: { en: "Read the server log DETAIL to find both statements; usually two code paths update the same rows in different orders (or batch updates in unsorted order). Fix the ordering (sort keys before batch updates), shorten transactions, add retry on 40P01 with jitter, and add a metric/alert for deadlock count (pg_stat_database.deadlocks).", he: "קוראים את ה-DETAIL בלוג השרת כדי למצוא את שני ה-statements; בדרך כלל שני נתיבי קוד מעדכנים את אותן שורות בסדר שונה (או batch updates לא ממוינים). מתקנים את הסדר (ממיינים מפתחות לפני batch), מקצרים טרנזקציות, מוסיפים retry על 40P01 עם jitter, ומוסיפים מדד/התראה למספר deadlocks (pg_stat_database.deadlocks)." }
    }
  ],
  quiz: [
    {
      q: { en: "Which single statement prevents the lost-update on withdrawals?", he: "איזה statement יחיד מונע lost update במשיכות?" },
      options: [
        { en: "SELECT balance; then UPDATE balance = :new", he: "SELECT balance; ואז UPDATE balance = :new" },
        { en: "UPDATE acc SET balance = balance - 80 WHERE id=1 AND balance >= 80", he: "UPDATE acc SET balance = balance - 80 WHERE id=1 AND balance >= 80" },
        { en: "SELECT ... with READ UNCOMMITTED", he: "SELECT ... עם READ UNCOMMITTED" },
        { en: "Adding an index on balance", he: "הוספת אינדקס על balance" }
      ],
      answer: 1,
      explain: { en: "The read-modify-write happens atomically inside the DB, with the guard in the WHERE.", he: "ה-read-modify-write קורה אטומית בתוך ה-DB, עם השמירה ב-WHERE." }
    },
    {
      q: { en: "Which Coffman condition does 'always lock accounts in id order' break?", he: "איזה תנאי Coffman שובר 'תמיד לנעול חשבונות לפי סדר id'?" },
      options: [
        { en: "Mutual exclusion", he: "Mutual exclusion" },
        { en: "Hold and wait", he: "Hold and wait" },
        { en: "No preemption", he: "No preemption" },
        { en: "Circular wait", he: "Circular wait" }
      ],
      answer: 3,
      explain: { en: "A global order makes a cycle of waits impossible.", he: "סדר גלובלי הופך מעגל המתנות לבלתי אפשרי." }
    },
    {
      q: { en: "Two doctors each go off-call under snapshot isolation, leaving none. This anomaly is…", he: "שני רופאים יוצאים מתורנות תחת snapshot isolation ולא נשאר אף אחד. האנומליה הזו היא…" },
      options: [
        { en: "Dirty read", he: "Dirty read" },
        { en: "Write skew", he: "Write skew" },
        { en: "Phantom insert only", he: "רק Phantom insert" },
        { en: "Deadlock", he: "Deadlock" }
      ],
      answer: 1,
      explain: { en: "Each transaction writes a different row based on a shared read; only SERIALIZABLE or explicit locking prevents it.", he: "כל טרנזקציה כותבת שורה אחרת על סמך קריאה משותפת; רק SERIALIZABLE או נעילה מפורשת מונעים את זה." }
    },
    {
      q: { en: "Why add a fencing token to a Redis-based distributed lock?", he: "למה להוסיף fencing token לנעילה מבוזרת מבוססת Redis?" },
      options: [
        { en: "To make Redis faster", he: "כדי להאיץ את Redis" },
        { en: "So storage rejects writes from a holder whose lease already expired", he: "כדי שהאחסון ידחה כתיבות ממחזיק שה-lease שלו כבר פג" },
        { en: "To encrypt the lock", he: "כדי להצפין את הנעילה" },
        { en: "To avoid using TTLs", he: "כדי לא להשתמש ב-TTL" }
      ],
      answer: 1,
      explain: { en: "A paused process can wake up believing it still holds the lock; the monotonic token lets the resource detect stale holders.", he: "Process שנעצר יכול להתעורר ולחשוב שהוא עדיין מחזיק בנעילה; המספר העולה מאפשר למשאב לזהות מחזיקים ישנים." }
    }
  ],
  related: ["db-transactions", "pr-concurrency-parallelism", "staff-consensus-consistency", "pr-idempotency", "pr-cap-pacelc"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-frontend-frameworks",
  track: "principal",
  order: 76,
  icon: "🖼️",
  level: 2,
  minutes: 15,
  title: { en: "Frontend Frameworks: React vs Vue vs Angular (and Svelte)", he: "Frontend Frameworks: React מול Vue מול Angular (ו-Svelte)" },
  tldr: {
    en: "React is a UI library with a huge ecosystem you assemble yourself; Angular is a batteries-included enterprise framework; Vue sits in between with the gentlest curve; Svelte/Solid compile away the runtime. The rendering mode (CSR/SSR/SSG/ISR) often matters more than the framework.",
    he: "React זו ספריית UI עם אקוסיסטם ענק שמרכיבים לבד; Angular זה framework ארגוני עם הכול בפנים; Vue באמצע עם עקומת הלמידה הכי נוחה; Svelte/Solid מקמפלים את ה-runtime החוצה. מצב הרינדור (CSR/SSR/SSG/ISR) הרבה פעמים חשוב יותר מה-framework."
  },
  analogy: {
    en: "React is IKEA parts: excellent pieces, you pick the router, state store and form library and assemble your own kitchen. Angular is a fully built kitchen from one contractor: every cabinet, appliance and rule included and standardized — heavier, but every team's kitchen looks the same. Vue is a modular kitchen kit: official router and store in the box, easy instructions, still flexible. Svelte is a kitchen where the contractor pre-cut everything at the factory, so there's almost no tooling left in your house (no runtime).",
    he: "React זה חלקים של IKEA: חלקים מצוינים, בוחרים לבד router, state store וספריית טפסים ומרכיבים מטבח משלך. Angular זה מטבח שלם מקבלן אחד: כל ארון, מכשיר וחוק כלולים ואחידים — כבד יותר, אבל המטבח של כל צוות נראה אותו דבר. Vue זה ערכת מטבח מודולרית: router ו-store רשמיים בקופסה, הוראות קלות, ועדיין גמיש. Svelte זה מטבח שהקבלן חתך הכול מראש במפעל, אז כמעט לא נשארים כלים בבית (בלי runtime)."
  },
  sections: [
    {
      h: { en: "Philosophy and reactivity models", he: "פילוסופיה ומודלי reactivity" },
      body: {
        en: `<table>
<tr><th></th><th>React</th><th>Vue 3</th><th>Angular</th><th>Svelte 5 / Solid</th></tr>
<tr><td>Type</td><td>UI library</td><td>Progressive framework</td><td>Full framework</td><td>Compiler-first</td></tr>
<tr><td>Templates</td><td>JSX (JS-first)</td><td>HTML templates (SFC) or JSX</td><td>HTML templates + decorators</td><td>HTML-ish templates / JSX</td></tr>
<tr><td>Reactivity</td><td>Re-render + virtual DOM diff</td><td>Proxy-based refs, VDOM</td><td>Signals (zoneless since v18+)</td><td>Fine-grained signals, no VDOM</td></tr>
<tr><td>State</td><td>useState, Zustand, Redux Toolkit, TanStack Query</td><td>Pinia</td><td>Signals, NgRx, services + DI</td><td>Runes / stores</td></tr>
<tr><td>Meta-framework</td><td>Next.js, Remix/React Router</td><td>Nuxt</td><td>Angular SSR</td><td>SvelteKit, SolidStart</td></tr>
<tr><td>Backed by</td><td>Meta</td><td>Community (Evan You)</td><td>Google</td><td>Vercel / community</td></tr>
</table>
<p><strong>Virtual DOM</strong>: on state change, re-run the component to produce a new tree, diff it with the old one, patch the real DOM. Simple mental model; cost grows with tree size (hence <code>memo</code>, and the React Compiler that auto-memoizes). <strong>Signals</strong>: each value knows which DOM nodes depend on it and updates only those — no diffing. The industry is converging on signals (Angular, Vue's refs, Svelte runes, Solid, the TC39 signals proposal).</p>`,
        he: `<table>
<tr><th></th><th>React</th><th>Vue 3</th><th>Angular</th><th>Svelte 5 / Solid</th></tr>
<tr><td>סוג</td><td>ספריית UI</td><td>Framework פרוגרסיבי</td><td>Framework מלא</td><td>קודם כול קומפיילר</td></tr>
<tr><td>תבניות</td><td>JSX (JS קודם)</td><td>HTML templates (SFC) או JSX</td><td>HTML templates + decorators</td><td>תבניות דמויות HTML / JSX</td></tr>
<tr><td>Reactivity</td><td>Re-render + diff של virtual DOM</td><td>Refs מבוססי Proxy, VDOM</td><td>Signals (zoneless מ-v18+)</td><td>Signals מדויקים, בלי VDOM</td></tr>
<tr><td>State</td><td>useState, Zustand, Redux Toolkit, TanStack Query</td><td>Pinia</td><td>Signals, NgRx, services + DI</td><td>Runes / stores</td></tr>
<tr><td>Meta-framework</td><td>Next.js, Remix/React Router</td><td>Nuxt</td><td>Angular SSR</td><td>SvelteKit, SolidStart</td></tr>
<tr><td>מאחוריו</td><td>Meta</td><td>קהילה (Evan You)</td><td>Google</td><td>Vercel / קהילה</td></tr>
</table>
<p><strong>Virtual DOM</strong>: כשה-state משתנה, מריצים מחדש את הקומפוננטה כדי לקבל עץ חדש, עושים diff מול הישן ו-patch ל-DOM האמיתי. מודל מחשבתי פשוט; העלות גדלה עם גודל העץ (לכן <code>memo</code>, וה-React Compiler שעושה memo אוטומטית). <strong>Signals</strong>: כל ערך יודע אילו צמתי DOM תלויים בו ומעדכן רק אותם — בלי diff. התעשייה מתכנסת ל-signals (Angular, ה-refs של Vue, runes של Svelte, Solid, והצעת ה-signals ב-TC39).</p>`
      }
    },
    {
      h: { en: "The same counter in each", he: "אותו counter בכל אחד" },
      body: {
        en: `<pre>// React (JSX)
function Counter() {
  const [n, setN] = useState(0);
  return &lt;button onClick={() =&gt; setN(n + 1)}&gt;
    Clicked {n}
  &lt;/button&gt;;
}</pre>
<pre>&lt;!-- Vue 3 SFC --&gt;
&lt;script setup&gt;
import { ref } from 'vue'
const n = ref(0)
&lt;/script&gt;
&lt;template&gt;
  &lt;button @click="n++"&gt;Clicked {{ n }}&lt;/button&gt;
&lt;/template&gt;</pre>
<pre>// Angular (standalone + signals)
@Component({
  selector: 'app-counter',
  template: \`&lt;button (click)="inc()"&gt;
    Clicked {{ n() }}&lt;/button&gt;\`
})
export class Counter {
  n = signal(0);
  inc() { this.n.update(v =&gt; v + 1); }
}</pre>
<pre>&lt;!-- Svelte 5 --&gt;
&lt;script&gt; let n = $state(0); &lt;/script&gt;
&lt;button onclick={() =&gt; n++}&gt;Clicked {n}&lt;/button&gt;</pre>`,
        he: `<pre>// React (JSX)
function Counter() {
  const [n, setN] = useState(0);
  return &lt;button onClick={() =&gt; setN(n + 1)}&gt;
    Clicked {n}
  &lt;/button&gt;;
}</pre>
<pre>&lt;!-- Vue 3 SFC --&gt;
&lt;script setup&gt;
import { ref } from 'vue'
const n = ref(0)
&lt;/script&gt;
&lt;template&gt;
  &lt;button @click="n++"&gt;Clicked {{ n }}&lt;/button&gt;
&lt;/template&gt;</pre>
<pre>// Angular (standalone + signals)
@Component({
  selector: 'app-counter',
  template: \`&lt;button (click)="inc()"&gt;
    Clicked {{ n() }}&lt;/button&gt;\`
})
export class Counter {
  n = signal(0);
  inc() { this.n.update(v =&gt; v + 1); }
}</pre>
<pre>&lt;!-- Svelte 5 --&gt;
&lt;script&gt; let n = $state(0); &lt;/script&gt;
&lt;button onclick={() =&gt; n++}&gt;Clicked {n}&lt;/button&gt;</pre>`
      }
    },
    {
      h: { en: "Rendering modes: CSR, SSR, SSG, ISR, streaming", he: "מצבי רינדור: CSR, SSR, SSG, ISR, streaming" },
      body: {
        en: `<table>
<tr><th>Mode</th><th>HTML built</th><th>Good for</th><th>Cost</th></tr>
<tr><td>CSR (SPA)</td><td>In the browser</td><td>Dashboards behind login</td><td>Blank page until JS loads; weak SEO</td></tr>
<tr><td>SSR</td><td>Per request on server</td><td>Personalized, SEO pages</td><td>Server compute per request</td></tr>
<tr><td>SSG</td><td>At build time</td><td>Docs, blogs, marketing</td><td>Rebuild to update</td></tr>
<tr><td>ISR</td><td>Build + revalidate every N s</td><td>Large catalogs</td><td>Stale for up to N s</td></tr>
<tr><td>Streaming SSR / RSC</td><td>Server streams chunks</td><td>Fast first paint with slow data</td><td>Complexity</td></tr>
</table>
<p><strong>Hydration</strong>: after SSR the browser downloads JS and re-attaches event handlers to the server HTML — until then the page looks ready but doesn't respond. Islands (Astro), partial hydration and resumability (Qwik) reduce that cost; React Server Components ship zero JS for server-only components.</p>
<blockquote>💡 Real world: Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75) affect Google ranking and conversions. A 1 MB JS bundle on a mid-range phone can take 2–4 s just to parse and execute — SSR/SSG and code-splitting usually beat switching frameworks.</blockquote>`,
        he: `<table>
<tr><th>מצב</th><th>איפה ה-HTML נבנה</th><th>מתאים ל-</th><th>מחיר</th></tr>
<tr><td>CSR (SPA)</td><td>בדפדפן</td><td>דשבורדים מאחורי login</td><td>דף ריק עד שה-JS נטען; SEO חלש</td></tr>
<tr><td>SSR</td><td>לכל בקשה בשרת</td><td>דפים מותאמים אישית, SEO</td><td>Compute בשרת לכל בקשה</td></tr>
<tr><td>SSG</td><td>בזמן build</td><td>תיעוד, בלוגים, שיווק</td><td>צריך build מחדש לעדכון</td></tr>
<tr><td>ISR</td><td>Build + revalidate כל N שניות</td><td>קטלוגים גדולים</td><td>מיושן עד N שניות</td></tr>
<tr><td>Streaming SSR / RSC</td><td>השרת מזרים חלקים</td><td>Paint ראשון מהיר עם מידע איטי</td><td>מורכבות</td></tr>
</table>
<p><strong>Hydration</strong>: אחרי SSR הדפדפן מוריד JS ומחבר מחדש event handlers ל-HTML מהשרת — עד אז הדף נראה מוכן אבל לא מגיב. Islands (Astro), partial hydration ו-resumability (Qwik) מקטינים את העלות; React Server Components לא שולחים JS בכלל לקומפוננטות שרצות רק בשרת.</p>
<blockquote>💡 מהשטח: Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 ב-p75) משפיעים על הדירוג בגוגל ועל המרות. Bundle של 1 MB JS בטלפון בינוני יכול לקחת 2–4 שניות רק ל-parse והרצה — SSR/SSG ו-code-splitting בדרך כלל עדיפים על החלפת framework.</blockquote>`
      }
    },
    {
      h: { en: "The principal's decision table", he: "טבלת ההחלטה של Principal" },
      body: {
        en: `<table>
<tr><th>Situation</th><th>Lean towards</th><th>Why</th></tr>
<tr><td>Big enterprise, many teams, long-lived app</td><td>Angular</td><td>One way to do everything: DI, router, forms, HttpClient, testing built in</td></tr>
<tr><td>Hiring at scale, rich ecosystem, React Native for mobile</td><td>React + Next.js</td><td>Largest talent pool and library ecosystem</td></tr>
<tr><td>Small team, fast onboarding, existing server-rendered pages</td><td>Vue + Nuxt</td><td>Gentle curve, progressive adoption</td></tr>
<tr><td>Performance-critical widgets, small bundles</td><td>Svelte / Solid</td><td>No VDOM runtime, tiny output</td></tr>
<tr><td>Content site, SEO</td><td>Astro / SSG with any</td><td>Ship HTML, hydrate only islands</td></tr>
</table>
<ul>
<li><strong>Micro-frontends</strong> (Module Federation, single-spa) let teams deploy UI independently — but cost bundle duplication and UX consistency. Use when org structure demands it, not by default.</li>
<li>Framework choice is a <strong>10-year hiring and maintenance decision</strong>: weigh team skills, design system, testing story and upgrade cadence over micro-benchmarks.</li>
</ul>`,
        he: `<table>
<tr><th>מצב</th><th>נוטים ל-</th><th>למה</th></tr>
<tr><td>ארגון גדול, הרבה צוותים, אפליקציה ארוכת חיים</td><td>Angular</td><td>דרך אחת לכל דבר: DI, router, forms, HttpClient, בדיקות מובנות</td></tr>
<tr><td>גיוס בהיקף, אקוסיסטם עשיר, React Native למובייל</td><td>React + Next.js</td><td>מאגר המפתחים והספריות הכי גדול</td></tr>
<tr><td>צוות קטן, onboarding מהיר, דפים קיימים שמרונדרים בשרת</td><td>Vue + Nuxt</td><td>עקומה נוחה, אימוץ הדרגתי</td></tr>
<tr><td>ווידג'טים קריטיים לביצועים, bundles קטנים</td><td>Svelte / Solid</td><td>בלי runtime של VDOM, פלט זעיר</td></tr>
<tr><td>אתר תוכן, SEO</td><td>Astro / SSG עם כל אחד</td><td>שולחים HTML, hydrate רק ל-islands</td></tr>
</table>
<ul>
<li><strong>Micro-frontends</strong> (Module Federation, single-spa) מאפשרים לצוותים לעשות deploy ל-UI באופן עצמאי — אבל עולים בכפילות bundles ועקביות UX. משתמשים כשמבנה הארגון דורש, לא כברירת מחדל.</li>
<li>בחירת framework היא <strong>החלטת גיוס ותחזוקה ל-10 שנים</strong>: שוקלים כישורי הצוות, design system, סיפור הבדיקות וקצב השדרוגים — יותר מ-micro-benchmarks.</li>
</ul>`
      }
    }
  ],
  diagram: `VDOM (React/Vue)                Signals (Solid/Svelte/Angular)
state change                    signal.set(5)
  -> re-run component              -> notify subscribers
  -> new tree                      -> update exactly 1 text node
  -> diff old vs new
  -> patch DOM

SSR timeline: request -> HTML (visible) -> JS loads -> hydrate (interactive)`,
  handsOn: [
    { cmd: "npm create vite@latest demo -- --template react-ts", what: { en: "Scaffold a React+TS app (swap template for vue-ts or svelte-ts to compare).", he: "מקימים אפליקציית React+TS (מחליפים template ל-vue-ts או svelte-ts להשוואה)." } },
    { cmd: "npx @angular/cli new demo --ssr --style=css", what: { en: "Create an Angular app with SSR and look at how much structure you get out of the box.", he: "יוצרים אפליקציית Angular עם SSR ורואים כמה מבנה מקבלים מהקופסה." } },
    { cmd: "npx vite build && du -sh dist/assets/*.js", what: { en: "Compare production bundle sizes between frameworks for the same component.", he: "משווים גדלי bundle בפרודקשן בין frameworks לאותה קומפוננטה." } },
    { cmd: "npx lighthouse https://example.com --only-categories=performance --view", what: { en: "Measure LCP/INP/CLS — what users actually feel.", he: "מודדים LCP/INP/CLS — מה שמשתמשים באמת מרגישים." } }
  ],
  mnemonic: {
    en: "\"React = pick your parts, Angular = the whole kitchen, Vue = the friendly kit, Svelte = pre-cut at the factory. Rendering mode beats framework.\"",
    he: "\"React = בוחרים חלקים, Angular = המטבח כולו, Vue = הערכה הידידותית, Svelte = חתוך מראש במפעל. מצב רינדור מנצח framework.\""
  },
  pitfalls: [
    { en: "Choosing a CSR-only SPA for a public, SEO-driven site — blank HTML for crawlers and slow first paint on phones.", he: "בחירת SPA של CSR בלבד לאתר ציבורי שתלוי ב-SEO — HTML ריק לסורקים ו-paint ראשון איטי בטלפונים." },
    { en: "Putting all server data in a global store (Redux) instead of a server-cache library (TanStack Query/SWR) — manual cache invalidation bugs.", he: "לשים את כל המידע מהשרת ב-store גלובלי (Redux) במקום ספריית server-cache (TanStack Query/SWR) — באגים של invalidation ידני." },
    { en: "Rewriting in a new framework to fix performance that is really caused by bundle size, images and waterfalls.", he: "לשכתב ל-framework חדש כדי לתקן ביצועים שבאמת נגרמים מגודל bundle, תמונות ו-waterfalls." }
  ],
  interview: [
    {
      q: { en: "What is hydration and why can it hurt INP?", he: "מה זה hydration ולמה הוא יכול לפגוע ב-INP?" },
      a: { en: "After SSR, the client must download and execute the component JS to attach event handlers and rebuild state. During that time the main thread is busy, so taps are delayed (bad INP) even though the page looks ready. Mitigate with code-splitting, islands/partial hydration, server components, and deferring non-critical JS.", he: "אחרי SSR הלקוח חייב להוריד ולהריץ את ה-JS של הקומפוננטות כדי לחבר event handlers ולבנות state. בזמן הזה ה-main thread עסוק, אז לחיצות מתעכבות (INP רע) למרות שהדף נראה מוכן. מקלים עם code-splitting, islands/partial hydration, server components ודחיית JS לא קריטי." }
    },
    {
      q: { en: "Virtual DOM vs signals — what's the trade-off?", he: "Virtual DOM מול signals — מה ה-trade-off?" },
      a: { en: "VDOM re-renders a component subtree and diffs, which is simple and predictable but does work proportional to the subtree; you optimize with memoization. Signals track dependencies per value and update only affected nodes — less work, but a different mental model (reading inside tracking scopes, derived values).", he: "VDOM מרנדר מחדש תת-עץ של קומפוננטה ועושה diff — פשוט וצפוי אבל עושה עבודה ביחס לגודל התת-עץ; מייעלים עם memoization. Signals עוקבים אחרי תלויות לכל ערך ומעדכנים רק צמתים מושפעים — פחות עבודה, אבל מודל מחשבתי אחר (קריאה בתוך tracking scope, ערכים נגזרים)." }
    }
  ],
  quiz: [
    {
      q: { en: "Which is a full, batteries-included framework with built-in DI?", he: "איזה מהם framework מלא עם DI מובנה?" },
      options: [
        { en: "React", he: "React" },
        { en: "Angular", he: "Angular" },
        { en: "Svelte", he: "Svelte" },
        { en: "jQuery", he: "jQuery" }
      ],
      answer: 1,
      explain: { en: "Angular ships DI, router, forms, HTTP client and testing tools as one framework.", he: "Angular מגיע עם DI, router, forms, HTTP client וכלי בדיקות כ-framework אחד." }
    },
    {
      q: { en: "Best rendering mode for a marketing site that changes weekly?", he: "מצב הרינדור הכי מתאים לאתר שיווק שמשתנה פעם בשבוע?" },
      options: [
        { en: "CSR", he: "CSR" },
        { en: "SSG", he: "SSG" },
        { en: "SSR on every request", he: "SSR לכל בקשה" },
        { en: "WebSockets", he: "WebSockets" }
      ],
      answer: 1,
      explain: { en: "Static HTML from a CDN is fastest and cheapest; rebuild weekly.", he: "HTML סטטי מ-CDN הכי מהיר וזול; build מחדש פעם בשבוע." }
    },
    {
      q: { en: "What do signals avoid compared with a virtual DOM?", he: "ממה signals נמנעים לעומת virtual DOM?" },
      options: [
        { en: "Components", he: "קומפוננטות" },
        { en: "Diffing whole component trees on each change", he: "Diff של עצי קומפוננטות שלמים בכל שינוי" },
        { en: "Event handlers", he: "Event handlers" },
        { en: "TypeScript", he: "TypeScript" }
      ],
      answer: 1,
      explain: { en: "Signals update only the dependents of the changed value.", he: "Signals מעדכנים רק את מי שתלוי בערך שהשתנה." }
    },
    {
      q: { en: "Core Web Vitals 'good' threshold for LCP at p75?", he: "סף 'טוב' של LCP ב-p75 ב-Core Web Vitals?" },
      options: [
        { en: "≤ 0.5 s", he: "≤ 0.5 s" },
        { en: "≤ 2.5 s", he: "≤ 2.5 s" },
        { en: "≤ 5 s", he: "≤ 5 s" },
        { en: "≤ 10 s", he: "≤ 10 s" }
      ],
      answer: 1,
      explain: { en: "LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.", he: "LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1." }
    }
  ],
  related: ["net-proxies-cdn", "pr-http-versions", "pr-platforms", "pr-security-owasp", "pr-design-patterns"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-checksums-hashing",
  track: "principal",
  order: 77,
  icon: "🧾",
  level: 2,
  minutes: 14,
  title: { en: "Checksums, Hashes, HMACs and Signatures", he: "Checksums, Hashes, HMAC וחתימות" },
  tldr: {
    en: "A checksum catches accidents, a cryptographic hash fingerprints content, an HMAC proves the sender knows a shared secret, a signature proves who signed with a private key, and encryption hides content. Pick by threat: noise, tampering, or forgery.",
    he: "Checksum תופס תקלות, hash קריפטוגרפי הוא טביעת אצבע של תוכן, HMAC מוכיח שהשולח יודע סוד משותף, חתימה מוכיחה מי חתם עם מפתח פרטי, והצפנה מסתירה תוכן. בוחרים לפי האיום: רעש, שינוי זדוני או זיוף."
  },
  analogy: {
    en: "A checksum is counting the boxes when the delivery arrives — you'll notice one fell off the truck, but a thief could swap contents and keep the count. A cryptographic hash is a fingerprint: change one grain and it's a different fingerprint, and you can't rebuild the person from it. An HMAC is a wax seal pressed with a stamp only you and the recipient own. A digital signature is a notarized signature: anyone can verify it with the public registry, but only you can produce it.",
    he: "Checksum זה לספור את הקרטונים כשהמשלוח מגיע — תשים לב שאחד נפל מהמשאית, אבל גנב יכול להחליף תוכן ולשמור על הספירה. Hash קריפטוגרפי זה טביעת אצבע: משנים גרגר אחד וזו טביעה אחרת, ואי אפשר לשחזר את האדם ממנה. HMAC זה חותם שעווה עם חותמת שרק לך ולמקבל יש. חתימה דיגיטלית זה חתימה אצל נוטריון: כל אחד יכול לאמת מול המרשם הציבורי, אבל רק אתה יכול לייצר אותה."
  },
  sections: [
    {
      h: { en: "The comparison table", he: "טבלת ההשוואה" },
      body: {
        en: `<table>
<tr><th>Tool</th><th>Protects against</th><th>Key?</th><th>Examples</th></tr>
<tr><td>Parity / checksum / CRC</td><td>Random corruption</td><td>No</td><td>CRC32 in Ethernet, ZIP, PNG; TCP checksum</td></tr>
<tr><td>Fast non-crypto hash</td><td>Nothing adversarial; speed</td><td>No</td><td>xxHash, MurmurHash (hash tables, sharding)</td></tr>
<tr><td>Cryptographic hash</td><td>Tampering if the hash is trusted</td><td>No</td><td>SHA-256, SHA-3, BLAKE3</td></tr>
<tr><td>HMAC</td><td>Tampering + forgery (shared secret)</td><td>Symmetric</td><td>Webhook signatures, JWT HS256, AWS SigV4</td></tr>
<tr><td>Digital signature</td><td>Forgery, non-repudiation</td><td>Private/public</td><td>RSA, ECDSA, Ed25519, code signing, TLS certs</td></tr>
<tr><td>Password hash (KDF)</td><td>Offline guessing</td><td>Salt</td><td>argon2id, bcrypt, scrypt</td></tr>
<tr><td>Encryption</td><td>Disclosure (confidentiality)</td><td>Yes</td><td>AES-GCM, ChaCha20-Poly1305</td></tr>
</table>
<p>Hashing is one-way; encryption is two-way. "Hashing a password with SHA-256" is neither safe hashing (too fast) nor encryption.</p>`,
        he: `<table>
<tr><th>כלי</th><th>מגן מפני</th><th>מפתח?</th><th>דוגמאות</th></tr>
<tr><td>Parity / checksum / CRC</td><td>השחתה אקראית</td><td>לא</td><td>CRC32 ב-Ethernet, ZIP, PNG; TCP checksum</td></tr>
<tr><td>Hash מהיר לא קריפטוגרפי</td><td>שום דבר זדוני; מהירות</td><td>לא</td><td>xxHash, MurmurHash (hash tables, sharding)</td></tr>
<tr><td>Hash קריפטוגרפי</td><td>שינוי, אם ה-hash עצמו אמין</td><td>לא</td><td>SHA-256, SHA-3, BLAKE3</td></tr>
<tr><td>HMAC</td><td>שינוי + זיוף (סוד משותף)</td><td>סימטרי</td><td>חתימות webhook, JWT HS256, AWS SigV4</td></tr>
<tr><td>חתימה דיגיטלית</td><td>זיוף, אי-התכחשות</td><td>פרטי/ציבורי</td><td>RSA, ECDSA, Ed25519, code signing, תעודות TLS</td></tr>
<tr><td>Password hash (KDF)</td><td>ניחוש offline</td><td>Salt</td><td>argon2id, bcrypt, scrypt</td></tr>
<tr><td>הצפנה</td><td>חשיפה (סודיות)</td><td>כן</td><td>AES-GCM, ChaCha20-Poly1305</td></tr>
</table>
<p>Hashing חד-כיווני; הצפנה דו-כיוונית. "Hash לסיסמה עם SHA-256" זה לא hashing בטוח (מהיר מדי) וגם לא הצפנה.</p>`
      }
    },
    {
      h: { en: "Checksums and CRC: catching accidents", he: "Checksums ו-CRC: לתפוס תקלות" },
      body: {
        en: `<ul>
<li><strong>Parity bit</strong>: 1 bit, detects any single-bit flip (RAM parity, RAID 5 parity across disks).</li>
<li><strong>CRC32</strong>: polynomial division; detects all burst errors up to 32 bits — used in Ethernet frames, ZIP, PNG, gzip, Kafka record batches, S3 (CRC32C checksums).</li>
<li><strong>TCP/UDP checksum</strong>: a weak 16-bit ones'-complement sum — real networks still see corrupted data that passes it, which is why apps add their own (TLS MAC, Kafka CRC, S3 Content-MD5).</li>
<li><strong>ECC memory</strong> corrects single-bit errors; servers use it because cosmic rays and bit-rot are real at scale.</li>
</ul>
<pre># verify a download against the published digest
$ sha256sum kubectl
3f6b...a91c  kubectl
$ echo "3f6b...a91c  kubectl" | sha256sum --check
kubectl: OK

# S3 end-to-end integrity
aws s3api put-object --bucket b --key k --body f \
  --checksum-algorithm CRC32C</pre>
<blockquote>💡 Real world: ZFS and Btrfs checksum every block and detect silent disk corruption ("bit rot") that hardware RAID never notices; with redundancy they repair it automatically on read or scrub.</blockquote>`,
        he: `<ul>
<li><strong>Parity bit</strong>: ביט אחד, מזהה כל היפוך של ביט בודד (parity ב-RAM, parity של RAID 5 על פני דיסקים).</li>
<li><strong>CRC32</strong>: חילוק פולינומים; מזהה את כל שגיאות ה-burst עד 32 ביט — בשימוש ב-frames של Ethernet, ZIP, PNG, gzip, record batches של Kafka, S3 (checksums מסוג CRC32C).</li>
<li><strong>TCP/UDP checksum</strong>: סכום חלש של 16 ביט — ברשתות אמיתיות עדיין עובר מידע מושחת, ולכן אפליקציות מוסיפות משלהן (MAC של TLS, CRC של Kafka, Content-MD5 ב-S3).</li>
<li><strong>זיכרון ECC</strong> מתקן שגיאות של ביט בודד; שרתים משתמשים בו כי קרניים קוסמיות ו-bit rot אמיתיים בסקייל.</li>
</ul>
<pre># verify a download against the published digest
$ sha256sum kubectl
3f6b...a91c  kubectl
$ echo "3f6b...a91c  kubectl" | sha256sum --check
kubectl: OK

# S3 end-to-end integrity
aws s3api put-object --bucket b --key k --body f \
  --checksum-algorithm CRC32C</pre>
<blockquote>💡 מהשטח: ZFS ו-Btrfs עושים checksum לכל בלוק ומזהים השחתה שקטה בדיסק ("bit rot") ש-RAID בחומרה אף פעם לא מזהה; עם יתירות הם מתקנים אוטומטית בקריאה או ב-scrub.</blockquote>`
      }
    },
    {
      h: { en: "Cryptographic hashes and content addressing", he: "Hashes קריפטוגרפיים ו-content addressing" },
      body: {
        en: `<p>Properties: deterministic, fixed size, avalanche (1 bit in → ~50% of output bits flip), preimage resistance, collision resistance. <strong>MD5 and SHA-1 are broken for security</strong> (practical collisions: Flame malware 2012 forged a Microsoft cert with MD5; SHAttered 2017 for SHA-1). Fine as non-adversarial checksums, never for signatures or integrity against attackers.</p>
<ul>
<li><strong>Content addressing</strong>: the name <em>is</em> the hash. Git objects (SHA-1, moving to SHA-256), Docker image digests (<code>sha256:...</code> — pin these in prod, not tags), IPFS, Nix store, build caches (Bazel).</li>
<li><strong>Dedupe</strong>: backup tools (restic, borg) chunk files and store each chunk once by hash.</li>
<li><strong>ETags</strong>: hash of the response; <code>If-None-Match</code> → <code>304 Not Modified</code> saves bandwidth.</li>
<li><strong>Merkle trees</strong>: hash of hashes. Compare two replicas by comparing roots, then descend only into differing branches — Cassandra/Dynamo anti-entropy repair, Git, ZFS, Certificate Transparency, blockchains.</li>
</ul>
<pre>            root = H(H12 + H34)
           /                    \
     H12 = H(H1+H2)        H34 = H(H3+H4)
      /        \             /        \
   H1(blk1) H2(blk2)    H3(blk3)  H4(blk4)
replicas disagree? compare root -&gt; H34 -&gt; H4 -&gt; sync blk4 only</pre>`,
        he: `<p>תכונות: דטרמיניסטי, גודל קבוע, אפקט מפולת (ביט אחד בקלט → ~50% מהביטים בפלט מתהפכים), עמידות ל-preimage, עמידות להתנגשויות. <strong>MD5 ו-SHA-1 שבורים לאבטחה</strong> (התנגשויות מעשיות: הנוזקה Flame ב-2012 זייפה תעודה של Microsoft עם MD5; SHAttered ב-2017 ל-SHA-1). בסדר כ-checksums לא עוינים, אף פעם לא לחתימות או לשלמות מול תוקפים.</p>
<ul>
<li><strong>Content addressing</strong>: השם <em>הוא</em> ה-hash. אובייקטים ב-Git (SHA-1, במעבר ל-SHA-256), digests של Docker images (<code>sha256:...</code> — בפרוד מצמידים אותם, לא tags), IPFS, ה-store של Nix, build caches (Bazel).</li>
<li><strong>Dedupe</strong>: כלי גיבוי (restic, borg) מחלקים קבצים ל-chunks ושומרים כל chunk פעם אחת לפי hash.</li>
<li><strong>ETags</strong>: hash של התשובה; <code>If-None-Match</code> → <code>304 Not Modified</code> חוסך רוחב פס.</li>
<li><strong>Merkle trees</strong>: hash של hashes. משווים שני replicas לפי השורש, ויורדים רק לענפים ששונים — anti-entropy repair ב-Cassandra/Dynamo, Git, ZFS, Certificate Transparency, בלוקצ'יין.</li>
</ul>
<pre>            root = H(H12 + H34)
           /                    \
     H12 = H(H1+H2)        H34 = H(H3+H4)
      /        \             /        \
   H1(blk1) H2(blk2)    H3(blk3)  H4(blk4)
replicas disagree? compare root -&gt; H34 -&gt; H4 -&gt; sync blk4 only</pre>`
      }
    },
    {
      h: { en: "HMAC: signing webhooks the right way", he: "HMAC: לחתום webhooks נכון" },
      body: {
        en: `<pre># sender (e.g. Stripe/GitHub style)
ts  = str(int(time.time()))
sig = hmac.new(SECRET, f"{ts}.{body}".encode(),
               hashlib.sha256).hexdigest()
headers = {"X-Signature": f"t={ts},v1={sig}"}

# receiver
expected = hmac.new(SECRET, f"{ts}.{raw_body}".encode(),
                    hashlib.sha256).hexdigest()
if not hmac.compare_digest(expected, received_sig):
    return 401
if abs(time.time() - int(ts)) &gt; 300:   # replay window
    return 401</pre>
<ul>
<li>Sign the <strong>raw bytes</strong> you received, before JSON parsing (re-serialization changes whitespace/order).</li>
<li>Use <strong>constant-time comparison</strong> (<code>hmac.compare_digest</code>, <code>crypto.timingSafeEqual</code>) — <code>==</code> leaks timing.</li>
<li>Include a <strong>timestamp</strong> and reject old ones (replay attacks); support <strong>two active secrets</strong> during rotation.</li>
<li>Never build a MAC as <code>SHA256(secret + message)</code> — length-extension attack. That's why HMAC exists.</li>
</ul>`,
        he: `<pre># sender (e.g. Stripe/GitHub style)
ts  = str(int(time.time()))
sig = hmac.new(SECRET, f"{ts}.{body}".encode(),
               hashlib.sha256).hexdigest()
headers = {"X-Signature": f"t={ts},v1={sig}"}

# receiver
expected = hmac.new(SECRET, f"{ts}.{raw_body}".encode(),
                    hashlib.sha256).hexdigest()
if not hmac.compare_digest(expected, received_sig):
    return 401
if abs(time.time() - int(ts)) &gt; 300:   # replay window
    return 401</pre>
<ul>
<li>חותמים על <strong>הבתים הגולמיים</strong> שהתקבלו, לפני parse ל-JSON (serialization מחדש משנה רווחים/סדר).</li>
<li>משתמשים ב-<strong>השוואה בזמן קבוע</strong> (<code>hmac.compare_digest</code>, <code>crypto.timingSafeEqual</code>) — <code>==</code> מדליף זמן.</li>
<li>כוללים <strong>timestamp</strong> ודוחים ישנים (התקפות replay); תומכים ב-<strong>שני סודות פעילים</strong> בזמן rotation.</li>
<li>לעולם לא בונים MAC כ-<code>SHA256(secret + message)</code> — התקפת length-extension. בשביל זה HMAC קיים.</li>
</ul>`
      }
    },
    {
      h: { en: "Collisions and the birthday paradox", he: "התנגשויות ופרדוקס יום ההולדת" },
      body: {
        en: `<p>With an n-bit hash, you expect the first collision after about <strong>2^(n/2)</strong> random inputs, not 2^n. In a room of 23 people there's a 50% chance two share a birthday.</p>
<pre>p(collision) ≈ k² / (2 · 2^n)     k = number of items
32-bit  hash: 50% at ~77,000 items   (CRC32 as an ID = bad)
64-bit  hash: 50% at ~5.1 billion
128-bit (UUID v4, 122 random bits):
        1 billion IDs/sec for 85 years -&gt; ~50%
256-bit (SHA-256): 2^128 work -&gt; infeasible</pre>
<ul>
<li>That's why short hashes are fine for <em>sharding</em> (collisions are expected) but not for <em>identity</em>.</li>
<li><strong>Bloom filters</strong> use k hash functions over a bit array to answer "definitely not present / maybe present" — Cassandra and RocksDB skip disk reads with them; ~10 bits per item gives ~1% false positives.</li>
<li>Consistent hashing (see the coding problem) maps keys to nodes so adding a node moves only ~1/N of keys.</li>
</ul>`,
        he: `<p>עם hash של n ביט, מצפים להתנגשות הראשונה אחרי בערך <strong>2^(n/2)</strong> קלטים אקראיים, לא 2^n. בחדר עם 23 אנשים יש 50% סיכוי ששניים חולקים יום הולדת.</p>
<pre>p(collision) ≈ k² / (2 · 2^n)     k = number of items
32-bit  hash: 50% at ~77,000 items   (CRC32 as an ID = bad)
64-bit  hash: 50% at ~5.1 billion
128-bit (UUID v4, 122 random bits):
        1 billion IDs/sec for 85 years -&gt; ~50%
256-bit (SHA-256): 2^128 work -&gt; infeasible</pre>
<ul>
<li>לכן hashes קצרים בסדר ל-<em>sharding</em> (התנגשויות צפויות) אבל לא ל-<em>זהות</em>.</li>
<li><strong>Bloom filters</strong> משתמשים ב-k פונקציות hash על מערך ביטים כדי לענות "בטוח לא קיים / אולי קיים" — Cassandra ו-RocksDB חוסכים קריאות מדיסק איתם; ~10 ביט לפריט נותנים ~1% false positives.</li>
<li>Consistent hashing (ראו בעיית הקוד) ממפה מפתחות ל-nodes כך שהוספת node מזיזה רק ~1/N מהמפתחות.</li>
</ul>`
      }
    }
  ],
  diagram: `accident?  -> checksum / CRC32        (no key)
fingerprint? -> SHA-256 / BLAKE3        (no key, trusted digest)
who sent it (shared secret)? -> HMAC-SHA256
who signed it (anyone verifies)? -> Ed25519 / RSA signature
keep it secret? -> AES-GCM encryption
store a password? -> argon2id (slow + salt)`,
  handsOn: [
    { cmd: "echo -n hello | sha256sum; echo -n hellp | sha256sum", what: { en: "See the avalanche effect: one letter changes the entire digest.", he: "רואים את אפקט המפולת: אות אחת משנה את כל ה-digest." } },
    { cmd: "echo -n '1700000000.{\"id\":1}' | openssl dgst -sha256 -hmac 'whsec_test'", what: { en: "Compute an HMAC-SHA256 webhook signature by hand.", he: "מחשבים חתימת webhook של HMAC-SHA256 ידנית." } },
    { cmd: "docker buildx imagetools inspect nginx:1.27 | head -5", what: { en: "Get the immutable sha256 digest behind a mutable tag — pin that in production.", he: "מקבלים את ה-digest הבלתי משתנה מאחורי tag משתנה — אותו מצמידים בפרודקשן." } },
    { cmd: "git cat-file -p HEAD && git rev-parse HEAD^{tree}", what: { en: "Explore Git's content-addressed Merkle structure: commit → tree hashes.", he: "חוקרים את מבנה ה-Merkle של Git לפי תוכן: commit → hashes של tree." } }
  ],
  mnemonic: {
    en: "\"Count the boxes (checksum), fingerprint the goods (hash), seal with our stamp (HMAC), notarize (signature), lock the truck (encryption).\"",
    he: "\"סופרים קרטונים (checksum), טביעת אצבע לסחורה (hash), חותם משותף (HMAC), נוטריון (חתימה), נועלים את המשאית (הצפנה).\""
  },
  pitfalls: [
    { en: "Using MD5/SHA-1 or CRC32 where an attacker can craft input — collisions are cheap.", he: "שימוש ב-MD5/SHA-1 או CRC32 איפה שתוקף יכול לבנות קלט — התנגשויות זולות." },
    { en: "Comparing signatures with == — timing side channel; use constant-time compare.", he: "השוואת חתימות עם == — ערוץ צד של זמן; משתמשים בהשוואה בזמן קבוע." },
    { en: "Verifying a webhook HMAC over re-serialized JSON instead of the raw body — valid signatures fail randomly.", he: "אימות HMAC של webhook על JSON שעבר serialization מחדש במקום הגוף הגולמי — חתימות תקינות נכשלות אקראית." },
    { en: "Publishing the checksum on the same compromised server as the file — sign releases (cosign, GPG) instead.", he: "פרסום ה-checksum על אותו שרת פרוץ של הקובץ — חותמים על releases (cosign, GPG) במקום." }
  ],
  interview: [
    {
      q: { en: "How do two replicas with 1 billion keys find which keys differ without sending everything?", he: "איך שני replicas עם מיליארד מפתחות מוצאים אילו מפתחות שונים בלי לשלוח הכול?" },
      a: { en: "Build a Merkle tree over key ranges on each replica. Exchange root hashes; if equal, done. Otherwise recurse only into child ranges whose hashes differ, and finally stream just the differing leaves. Bandwidth is proportional to the differences × log(n). Cassandra repair and DynamoDB use this.", he: "בונים Merkle tree על טווחי מפתחות בכל replica. מחליפים hashes של השורש; אם שווים — סיימנו. אחרת יורדים רקורסיבית רק לטווחים שה-hashes שלהם שונים, ולבסוף מזרימים רק את העלים השונים. רוחב הפס פרופורציונלי להבדלים × log(n). Cassandra repair ו-DynamoDB משתמשים בזה." }
    },
    {
      q: { en: "HMAC vs digital signature for webhooks — when each?", he: "HMAC מול חתימה דיגיטלית ל-webhooks — מתי כל אחד?" },
      a: { en: "HMAC when sender and each receiver share a per-endpoint secret: fast and simple (Stripe, GitHub). Signatures (Ed25519) when many parties must verify without being able to forge, or when you don't want to distribute secrets — receivers fetch your public key (JWKS). Signatures also give non-repudiation.", he: "HMAC כשהשולח וכל מקבל חולקים סוד לכל endpoint: מהיר ופשוט (Stripe, GitHub). חתימות (Ed25519) כשהרבה צדדים צריכים לאמת בלי יכולת לזייף, או כשלא רוצים להפיץ סודות — המקבלים מושכים את המפתח הציבורי (JWKS). חתימות נותנות גם אי-התכחשות." }
    }
  ],
  quiz: [
    {
      q: { en: "Which detects accidental corruption but NOT deliberate tampering?", he: "מה מזהה השחתה מקרית אבל לא שינוי זדוני?" },
      options: [
        { en: "HMAC-SHA256", he: "HMAC-SHA256" },
        { en: "CRC32", he: "CRC32" },
        { en: "Ed25519 signature", he: "חתימת Ed25519" },
        { en: "AES-GCM", he: "AES-GCM" }
      ],
      answer: 1,
      explain: { en: "Anyone can recompute a CRC after modifying data.", he: "כל אחד יכול לחשב מחדש CRC אחרי שינוי המידע." }
    },
    {
      q: { en: "Roughly how many random 32-bit hashes before a 50% chance of collision?", he: "בערך כמה hashes אקראיים של 32 ביט עד סיכוי של 50% להתנגשות?" },
      options: [
        { en: "~77,000", he: "~77,000" },
        { en: "~4 billion", he: "~4 מיליארד" },
        { en: "~2 billion", he: "~2 מיליארד" },
        { en: "32", he: "32" }
      ],
      answer: 0,
      explain: { en: "Birthday bound ≈ 1.18 · 2^16 ≈ 77k.", he: "חסם יום ההולדת ≈ 1.18 · 2^16 ≈ 77 אלף." }
    },
    {
      q: { en: "Why use hmac.compare_digest instead of ==?", he: "למה hmac.compare_digest ולא ==?" },
      options: [
        { en: "It's faster", he: "הוא מהיר יותר" },
        { en: "Constant time, so no timing leak", he: "זמן קבוע, אז אין דליפת זמן" },
        { en: "It supports Unicode", he: "הוא תומך ב-Unicode" },
        { en: "It decrypts the signature", he: "הוא מפענח את החתימה" }
      ],
      answer: 1,
      explain: { en: "== returns early at the first mismatch, revealing how many bytes matched.", he: "== חוזר מוקדם באי-ההתאמה הראשונה וחושף כמה בתים תאמו." }
    },
    {
      q: { en: "What lets replicas find differences by comparing a single root hash?", he: "מה מאפשר ל-replicas למצוא הבדלים ע\"י השוואת hash שורש אחד?" },
      options: [
        { en: "Bloom filter", he: "Bloom filter" },
        { en: "Merkle tree", he: "Merkle tree" },
        { en: "CRC32", he: "CRC32" },
        { en: "Consistent hashing", he: "Consistent hashing" }
      ],
      answer: 1,
      explain: { en: "A Merkle tree's root summarizes all data; mismatches are localized by descending.", he: "השורש של Merkle tree מסכם את כל המידע; ההבדלים ממוקמים ע\"י ירידה בעץ." }
    }
  ],
  related: ["infra-data-structures", "staff-supply-chain", "pr-auth", "pr-integration-styles", "pr-bitwise"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-bitwise",
  track: "principal",
  order: 78,
  icon: "🔢",
  level: 2,
  minutes: 13,
  title: { en: "Bitwise Operations: Masks, Flags, CIDR and Bitmaps", he: "פעולות Bitwise: Masks, Flags, CIDR ו-Bitmaps" },
  tldr: {
    en: "AND keeps, OR sets, XOR flips, NOT inverts, shifts multiply/divide by 2. With those five you read Unix permissions, compute subnets, pack IDs, count daily active users in a few MB, and build Bloom filters.",
    he: "AND שומר, OR מדליק, XOR הופך, NOT מהפך הכול, shifts כופלים/מחלקים ב-2. עם החמישה האלה קוראים הרשאות Unix, מחשבים subnets, אורזים IDs, סופרים משתמשים פעילים ביום בכמה MB ובונים Bloom filters."
  },
  analogy: {
    en: "Think of a row of light switches. OR with a mask is 'turn these lights ON, leave the rest'; AND with a mask is a stencil — only lights under the holes stay as they are, everything else goes dark; XOR is 'flip these switches'. Shifting left is sliding the whole row one place to the left — every value doubles. A subnet mask is a stencil laid over an IP address that keeps only the 'street name' (network) and hides the 'house number' (host).",
    he: "תחשבו על שורה של מתגי אור. OR עם mask זה 'תדליק את האורות האלה, את השאר תשאיר'; AND עם mask זה שבלונה — רק אורות מתחת לחורים נשארים כמו שהם, כל השאר נכבים; XOR זה 'תהפוך את המתגים האלה'. Shift שמאלה זה להזיז את כל השורה מקום אחד שמאלה — כל ערך מוכפל. Subnet mask זה שבלונה על כתובת IP שמשאירה רק את 'שם הרחוב' (network) ומסתירה את 'מספר הבית' (host)."
  },
  sections: [
    {
      h: { en: "The operators", he: "האופרטורים" },
      body: {
        en: `<table>
<tr><th>a</th><th>b</th><th>a AND b</th><th>a OR b</th><th>a XOR b</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>0</td><td>1</td><td>0</td><td>1</td><td>1</td></tr>
<tr><td>1</td><td>0</td><td>0</td><td>1</td><td>1</td></tr>
<tr><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td></tr>
</table>
<pre>    1100 1010   (0xCA = 202)
AND 0000 1111   mask low nibble
  = 0000 1010   (10)        keep bits under mask
OR  0001 0000
  = 1101 1010               set bit 4
XOR 1111 1111
  = 0011 0101               flip all 8 bits
x &lt;&lt; 3  = x * 8      x &gt;&gt; 1 = x / 2 (floor)</pre>
<table>
<tr><th>Trick</th><th>Code</th></tr>
<tr><td>Set bit k</td><td><code>x | (1 &lt;&lt; k)</code></td></tr>
<tr><td>Clear bit k</td><td><code>x &amp; ~(1 &lt;&lt; k)</code></td></tr>
<tr><td>Toggle bit k</td><td><code>x ^ (1 &lt;&lt; k)</code></td></tr>
<tr><td>Test bit k</td><td><code>(x &gt;&gt; k) &amp; 1</code></td></tr>
<tr><td>Power of two?</td><td><code>x &gt; 0 &amp;&amp; (x &amp; (x - 1)) == 0</code></td></tr>
<tr><td>Lowest set bit</td><td><code>x &amp; -x</code></td></tr>
<tr><td>Count set bits</td><td><code>popcount(x)</code> / <code>bin(x).count("1")</code></td></tr>
<tr><td>x mod 2^k</td><td><code>x &amp; ((1 &lt;&lt; k) - 1)</code> (ring buffers, hash buckets)</td></tr>
</table>`,
        he: `<table>
<tr><th>a</th><th>b</th><th>a AND b</th><th>a OR b</th><th>a XOR b</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>0</td><td>1</td><td>0</td><td>1</td><td>1</td></tr>
<tr><td>1</td><td>0</td><td>0</td><td>1</td><td>1</td></tr>
<tr><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td></tr>
</table>
<pre>    1100 1010   (0xCA = 202)
AND 0000 1111   mask low nibble
  = 0000 1010   (10)        keep bits under mask
OR  0001 0000
  = 1101 1010               set bit 4
XOR 1111 1111
  = 0011 0101               flip all 8 bits
x &lt;&lt; 3  = x * 8      x &gt;&gt; 1 = x / 2 (floor)</pre>
<table>
<tr><th>טריק</th><th>קוד</th></tr>
<tr><td>הדלקת ביט k</td><td><code>x | (1 &lt;&lt; k)</code></td></tr>
<tr><td>כיבוי ביט k</td><td><code>x &amp; ~(1 &lt;&lt; k)</code></td></tr>
<tr><td>היפוך ביט k</td><td><code>x ^ (1 &lt;&lt; k)</code></td></tr>
<tr><td>בדיקת ביט k</td><td><code>(x &gt;&gt; k) &amp; 1</code></td></tr>
<tr><td>חזקה של 2?</td><td><code>x &gt; 0 &amp;&amp; (x &amp; (x - 1)) == 0</code></td></tr>
<tr><td>הביט הדולק הנמוך</td><td><code>x &amp; -x</code></td></tr>
<tr><td>ספירת ביטים דולקים</td><td><code>popcount(x)</code> / <code>bin(x).count("1")</code></td></tr>
<tr><td>x mod 2^k</td><td><code>x &amp; ((1 &lt;&lt; k) - 1)</code> (ring buffers, hash buckets)</td></tr>
</table>`
      }
    },
    {
      h: { en: "Flags and permissions", he: "Flags והרשאות" },
      body: {
        en: `<pre>Unix mode 0755 (octal: 3 bits per digit)
 owner  group  other
  rwx    r-x    r-x
  111    101    101   = 7 5 5
r=4 (100)  w=2 (010)  x=1 (001)

# can group write?   (mode &gt;&gt; 3) &amp; 2   -&gt; 0, no
# chmod g+w           mode | 0o020     -&gt; 0775
# umask 022 clears group/other write:
#   0666 &amp; ~0022 = 0644 for new files</pre>
<pre>// Feature/permission flags packed in one integer
const READ = 1 &lt;&lt; 0, WRITE = 1 &lt;&lt; 1,
      DELETE = 1 &lt;&lt; 2, ADMIN = 1 &lt;&lt; 3;
let perms = READ | WRITE;        // 0b0011 = 3
const canDelete = (perms &amp; DELETE) !== 0; // false
perms |= DELETE;                 // grant
perms &amp;= ~WRITE;                 // revoke</pre>
<p>Real uses: TCP flags (SYN=0x02, ACK=0x10 — <code>tcpdump 'tcp[13] &amp; 2 != 0'</code>), Linux <code>open()</code> flags (<code>O_CREAT|O_EXCL</code>), Discord permission integers, epoll event masks, CPU affinity masks (<code>taskset 0x3</code> = CPUs 0 and 1).</p>`,
        he: `<pre>Unix mode 0755 (octal: 3 bits per digit)
 owner  group  other
  rwx    r-x    r-x
  111    101    101   = 7 5 5
r=4 (100)  w=2 (010)  x=1 (001)

# can group write?   (mode &gt;&gt; 3) &amp; 2   -&gt; 0, no
# chmod g+w           mode | 0o020     -&gt; 0775
# umask 022 clears group/other write:
#   0666 &amp; ~0022 = 0644 for new files</pre>
<pre>// Feature/permission flags packed in one integer
const READ = 1 &lt;&lt; 0, WRITE = 1 &lt;&lt; 1,
      DELETE = 1 &lt;&lt; 2, ADMIN = 1 &lt;&lt; 3;
let perms = READ | WRITE;        // 0b0011 = 3
const canDelete = (perms &amp; DELETE) !== 0; // false
perms |= DELETE;                 // grant
perms &amp;= ~WRITE;                 // revoke</pre>
<p>שימושים אמיתיים: דגלי TCP (SYN=0x02, ACK=0x10 — <code>tcpdump 'tcp[13] &amp; 2 != 0'</code>), דגלי <code>open()</code> ב-Linux (<code>O_CREAT|O_EXCL</code>), מספרי הרשאות של Discord, event masks של epoll, CPU affinity masks (<code>taskset 0x3</code> = CPUs 0 ו-1).</p>`
      }
    },
    {
      h: { en: "Subnets with bits", he: "Subnets עם ביטים" },
      body: {
        en: `<pre>IP      10.20.37.130  = 00001010.00010100.00100101.10000010
/20 mask 255.255.240.0 = 11111111.11111111.11110000.00000000
network = IP AND mask  = 10.20.32.0
broadcast = network OR ~mask = 10.20.47.255
hosts = 2^(32-20) = 4096 addresses (AWS keeps 5 per subnet)

same subnet?  (ipA &amp; mask) == (ipB &amp; mask)</pre>
<pre># Python
import ipaddress
n = ipaddress.ip_network("10.20.37.130/20", strict=False)
print(n, n.num_addresses)   # 10.20.32.0/20 4096
# by hand
ip = int(ipaddress.IPv4Address("10.20.37.130"))
mask = (0xFFFFFFFF &lt;&lt; (32 - 20)) &amp; 0xFFFFFFFF
print(ipaddress.IPv4Address(ip &amp; mask))  # 10.20.32.0</pre>
<p>Longest-prefix match in routers and in the trie coding problem is exactly this: find the route whose (prefix, mask) matches the most leading bits.</p>`,
        he: `<pre>IP      10.20.37.130  = 00001010.00010100.00100101.10000010
/20 mask 255.255.240.0 = 11111111.11111111.11110000.00000000
network = IP AND mask  = 10.20.32.0
broadcast = network OR ~mask = 10.20.47.255
hosts = 2^(32-20) = 4096 addresses (AWS keeps 5 per subnet)

same subnet?  (ipA &amp; mask) == (ipB &amp; mask)</pre>
<pre># Python
import ipaddress
n = ipaddress.ip_network("10.20.37.130/20", strict=False)
print(n, n.num_addresses)   # 10.20.32.0/20 4096
# by hand
ip = int(ipaddress.IPv4Address("10.20.37.130"))
mask = (0xFFFFFFFF &lt;&lt; (32 - 20)) &amp; 0xFFFFFFFF
print(ipaddress.IPv4Address(ip &amp; mask))  # 10.20.32.0</pre>
<p>Longest-prefix match בנתבים ובבעיית ה-trie הוא בדיוק זה: מוצאים את ה-route שה-(prefix, mask) שלו תואם הכי הרבה ביטים מובילים.</p>`
      }
    },
    {
      h: { en: "Bitmaps, Bloom filters and packed IDs", he: "Bitmaps, Bloom filters ו-IDs ארוזים" },
      body: {
        en: `<pre># Daily active users with a Redis bitmap
SETBIT dau:2026-11-13 4815162 1     # user id = bit offset
BITCOUNT dau:2026-11-13             # -&gt; 1,204,331
# active on BOTH days:
BITOP AND both dau:2026-11-12 dau:2026-11-13
BITCOUNT both
# 100M users = 100M bits = 12.5 MB per day</pre>
<ul>
<li><strong>Bitmap indexes</strong> (ClickHouse, Druid, Roaring bitmaps in Elasticsearch/Lucene) answer "country=IL AND plan=pro" with a single AND over compressed bitsets.</li>
<li><strong>Bloom filter</strong>: m bits, k hashes; add = set k bits; check = all k bits set? 10 bits/item, k=7 ≈ 1% false positive, never a false negative.</li>
<li><strong>Packed IDs</strong>: Snowflake = <code>(ms &lt;&lt; 22) | (worker &lt;&lt; 12) | seq</code>; decode with shifts and masks: <code>worker = (id &gt;&gt; 12) &amp; 0x3FF</code>.</li>
<li><strong>XOR tricks</strong>: <code>a ^ a = 0</code>, <code>a ^ 0 = a</code> → XOR all numbers to find the one without a pair; RAID 5 parity = XOR of data blocks, so any one lost block = XOR of the rest.</li>
</ul>`,
        he: `<pre># Daily active users with a Redis bitmap
SETBIT dau:2026-11-13 4815162 1     # user id = bit offset
BITCOUNT dau:2026-11-13             # -&gt; 1,204,331
# active on BOTH days:
BITOP AND both dau:2026-11-12 dau:2026-11-13
BITCOUNT both
# 100M users = 100M bits = 12.5 MB per day</pre>
<ul>
<li><strong>Bitmap indexes</strong> (ClickHouse, Druid, Roaring bitmaps ב-Elasticsearch/Lucene) עונים על "country=IL AND plan=pro" עם AND אחד על bitsets דחוסים.</li>
<li><strong>Bloom filter</strong>: m ביטים, k hashes; הוספה = הדלקת k ביטים; בדיקה = כל k דולקים? 10 ביט לפריט, k=7 ≈ 1% false positive, אף פעם לא false negative.</li>
<li><strong>IDs ארוזים</strong>: Snowflake = <code>(ms &lt;&lt; 22) | (worker &lt;&lt; 12) | seq</code>; מפענחים עם shifts ו-masks: <code>worker = (id &gt;&gt; 12) &amp; 0x3FF</code>.</li>
<li><strong>טריקים של XOR</strong>: <code>a ^ a = 0</code>, <code>a ^ 0 = a</code> → XOR על כל המספרים מוצא את זה שאין לו זוג; parity של RAID 5 = XOR של בלוקי המידע, אז כל בלוק שאבד = XOR של השאר.</li>
</ul>`
      }
    },
    {
      h: { en: "Signed numbers, endianness and language gotchas", he: "מספרים עם סימן, endianness ו-gotchas בשפות" },
      body: {
        en: `<ul>
<li><strong>Two's complement</strong>: <code>-x = ~x + 1</code>. In 8 bits, 127 + 1 = -128 (overflow wraps). An int32 counter of bytes overflows at 2 GiB — a classic bug in file-size and metrics code.</li>
<li><strong>Endianness</strong>: x86 and ARM (usually) are little-endian; network byte order is big-endian. <code>0x12345678</code> is stored <code>78 56 34 12</code> on x86. Use <code>htonl/ntohl</code>, <code>struct.pack("!I")</code>, <code>DataView</code> with explicit endianness when reading binary protocols.</li>
<li><strong>JavaScript</strong>: bitwise ops convert to <strong>signed 32-bit</strong>: <code>2**32 | 0 === 0</code>, <code>0xFFFFFFFF | 0 === -1</code>. Use <code>&gt;&gt;&gt; 0</code> for unsigned, or <code>BigInt</code> (<code>1n &lt;&lt; 40n</code>) for 64-bit IDs.</li>
<li><strong>Python</strong> ints are unbounded — <code>~5 == -6</code> and you mask manually (<code>&amp; 0xFFFFFFFF</code>) to emulate fixed width.</li>
<li><strong>Arithmetic vs logical shift</strong>: <code>-8 &gt;&gt; 1 = -4</code> (sign kept); <code>-8 &gt;&gt;&gt; 1</code> in JS/Java = 2147483644.</li>
</ul>
<blockquote>⚠️ Production tip: A 64-bit Snowflake ID sent as a JSON number loses precision in JavaScript beyond 2^53 — Twitter's API returns <code>id_str</code> for exactly this reason. Send big IDs as strings.</blockquote>`,
        he: `<ul>
<li><strong>Two's complement</strong>: <code>-x = ~x + 1</code>. ב-8 ביט, 127 + 1 = -128 (overflow עוטף). מונה בתים ב-int32 גולש ב-2 GiB — באג קלאסי בקוד של גדלי קבצים ומדדים.</li>
<li><strong>Endianness</strong>: x86 ו-ARM (בדרך כלל) הם little-endian; network byte order הוא big-endian. <code>0x12345678</code> נשמר <code>78 56 34 12</code> ב-x86. משתמשים ב-<code>htonl/ntohl</code>, <code>struct.pack("!I")</code>, <code>DataView</code> עם endianness מפורש כשקוראים פרוטוקולים בינאריים.</li>
<li><strong>JavaScript</strong>: פעולות bitwise ממירות ל-<strong>32 ביט עם סימן</strong>: <code>2**32 | 0 === 0</code>, <code>0xFFFFFFFF | 0 === -1</code>. משתמשים ב-<code>&gt;&gt;&gt; 0</code> ל-unsigned, או ב-<code>BigInt</code> (<code>1n &lt;&lt; 40n</code>) ל-IDs של 64 ביט.</li>
<li><strong>Python</strong>: ints בלי גבול — <code>~5 == -6</code> ועושים mask ידני (<code>&amp; 0xFFFFFFFF</code>) כדי לדמות רוחב קבוע.</li>
<li><strong>Shift אריתמטי מול לוגי</strong>: <code>-8 &gt;&gt; 1 = -4</code> (הסימן נשמר); <code>-8 &gt;&gt;&gt; 1</code> ב-JS/Java = 2147483644.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: Snowflake ID של 64 ביט שנשלח כמספר ב-JSON מאבד דיוק ב-JavaScript מעבר ל-2^53 — ה-API של Twitter מחזיר <code>id_str</code> בדיוק בגלל זה. שולחים IDs גדולים כמחרוזות.</blockquote>`
      }
    }
  ],
  diagram: `IP    00001010.00010100.0010|0101.10000010   10.20.37.130
mask  11111111.11111111.1111|0000.00000000   /20
AND   00001010.00010100.0010|0000.00000000   10.20.32.0  (network)
      <------ network ------>|<-- host -->

Snowflake: [0][41 bits time][10 worker][12 seq]
           id >> 22 = time;  (id >> 12) & 0x3FF = worker`,
  handsOn: [
    { cmd: "python -c \"x=0b1100_1010;print(bin(x&0x0F),bin(x|0x10),bin(x^0xFF),x&(x-1)==0)\"", what: { en: "Try AND/OR/XOR masks and the power-of-two test.", he: "מנסים masks של AND/OR/XOR ואת בדיקת חזקת ה-2." } },
    { cmd: "python -c \"import ipaddress as i;n=i.ip_network('10.20.37.130/20',strict=False);print(n,n.netmask,n.broadcast_address,n.num_addresses)\"", what: { en: "Compute network, mask, broadcast and size of a CIDR block.", he: "מחשבים network, mask, broadcast וגודל של בלוק CIDR." } },
    { cmd: "redis-cli SETBIT dau:today 42 1 && redis-cli BITCOUNT dau:today", what: { en: "Track daily active users with one bit per user.", he: "עוקבים אחרי משתמשים פעילים ביום עם ביט אחד למשתמש." } },
    { cmd: "node -e \"console.log(2**32|0, 0xFFFFFFFF|0, -8>>>1, 2**53+1)\"", what: { en: "See JavaScript's 32-bit signed bitwise and 2^53 precision gotchas.", he: "רואים את ה-gotchas של JavaScript: bitwise של 32 ביט עם סימן ודיוק 2^53." } }
  ],
  mnemonic: {
    en: "\"AND = stencil, OR = switch on, XOR = flip, shift = ×2. Mask the IP, keep the street.\"",
    he: "\"AND = שבלונה, OR = הדלקה, XOR = היפוך, shift = ×2. עושים mask ל-IP, נשאר הרחוב.\""
  },
  pitfalls: [
    { en: "Using JS bitwise operators on numbers above 2^31 — silently truncated to signed 32-bit.", he: "שימוש באופרטורי bitwise של JS על מספרים מעל 2^31 — נחתכים בשקט ל-32 ביט עם סימן." },
    { en: "Reading binary protocols without specifying endianness — works on your laptop, garbage across platforms.", he: "קריאת פרוטוקולים בינאריים בלי לציין endianness — עובד על הלפטופ, זבל בין פלטפורמות." },
    { en: "Operator precedence: in C/JS/Python, x & 1 == 0 parses as x & (1 == 0) in C/JS — always parenthesize.", he: "קדימות אופרטורים: ב-C/JS, x & 1 == 0 מתפרש כ-x & (1 == 0) — תמיד שמים סוגריים." }
  ],
  interview: [
    {
      q: { en: "Count users active on 30 consecutive days among 200M users, cheaply.", he: "לספור משתמשים שפעילים 30 ימים ברצף מתוך 200M משתמשים, בזול." },
      a: { en: "One bitmap per day (200M bits = 25 MB, compressed much smaller with Roaring). AND the 30 bitmaps and popcount the result. Redis BITOP AND + BITCOUNT, or Roaring bitmaps in ClickHouse. O(N/64) word operations per day — milliseconds.", he: "Bitmap לכל יום (200M ביט = 25 MB, דחוס הרבה פחות עם Roaring). עושים AND ל-30 ה-bitmaps ו-popcount לתוצאה. Redis BITOP AND + BITCOUNT, או Roaring bitmaps ב-ClickHouse. O(N/64) פעולות מילה ליום — מילישניות." }
    },
    {
      q: { en: "How do you check whether two IPs are in the same subnet?", he: "איך בודקים אם שתי כתובות IP באותו subnet?" },
      a: { en: "Convert both to 32-bit integers, build the mask from the prefix length ((0xFFFFFFFF &lt;&lt; (32 - p)) & 0xFFFFFFFF), and compare (a & mask) == (b & mask).", he: "ממירים את שתיהן למספרים של 32 ביט, בונים mask מאורך ה-prefix ((0xFFFFFFFF &lt;&lt; (32 - p)) & 0xFFFFFFFF), ומשווים (a & mask) == (b & mask)." }
    }
  ],
  quiz: [
    {
      q: { en: "What does x & (x - 1) == 0 (with x > 0) test?", he: "מה בודק x & (x - 1) == 0 (עם x > 0)?" },
      options: [
        { en: "x is even", he: "x זוגי" },
        { en: "x is a power of two", he: "x חזקה של 2" },
        { en: "x is prime", he: "x ראשוני" },
        { en: "x is negative", he: "x שלילי" }
      ],
      answer: 1,
      explain: { en: "x-1 flips the single set bit and everything below it; AND is zero only if there was exactly one set bit.", he: "x-1 הופך את הביט הדולק היחיד ואת כל מה שמתחתיו; ה-AND יוצא אפס רק אם היה בדיוק ביט דולק אחד." }
    },
    {
      q: { en: "Network address of 10.20.37.130/20?", he: "כתובת ה-network של 10.20.37.130/20?" },
      options: [
        { en: "10.20.37.0", he: "10.20.37.0" },
        { en: "10.20.32.0", he: "10.20.32.0" },
        { en: "10.20.0.0", he: "10.20.0.0" },
        { en: "10.20.36.0", he: "10.20.36.0" }
      ],
      answer: 1,
      explain: { en: "37 = 0010 0101; the /20 mask keeps the top 4 bits of the 3rd octet: 0010 0000 = 32.", he: "37 = 0010 0101; mask של /20 שומר את 4 הביטים העליונים של האוקטט השלישי: 0010 0000 = 32." }
    },
    {
      q: { en: "Unix mode 0640 means…", he: "הרשאה 0640 ב-Unix פירושה…" },
      options: [
        { en: "owner rw, group r, other none", he: "owner rw, group r, other כלום" },
        { en: "owner rwx, group r, other none", he: "owner rwx, group r, other כלום" },
        { en: "owner r, group rw, other none", he: "owner r, group rw, other כלום" },
        { en: "everyone read", he: "כולם קוראים" }
      ],
      answer: 0,
      explain: { en: "6 = 4+2 = rw, 4 = r, 0 = nothing.", he: "6 = 4+2 = rw, 4 = r, 0 = כלום." }
    },
    {
      q: { en: "In JavaScript, what is 0xFFFFFFFF | 0?", he: "ב-JavaScript, מה זה 0xFFFFFFFF | 0?" },
      options: [
        { en: "4294967295", he: "4294967295" },
        { en: "-1", he: "-1" },
        { en: "0", he: "0" },
        { en: "NaN", he: "NaN" }
      ],
      answer: 1,
      explain: { en: "Bitwise ops coerce to signed 32-bit; all ones = -1 in two's complement.", he: "פעולות bitwise ממירות ל-32 ביט עם סימן; כל הביטים דולקים = -1 ב-two's complement." }
    }
  ],
  related: ["net-ip-cidr", "pr-ids-pagination", "pr-checksums-hashing", "linux-permissions-users", "infra-data-structures"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "pr-encoding-serialization",
  track: "principal",
  order: 79,
  icon: "🔤",
  level: 2,
  minutes: 14,
  title: { en: "Encoding & Serialization: UTF-8, Base64, JSON vs Protobuf, Floats", he: "Encoding ו-Serialization: UTF-8, Base64, JSON מול Protobuf, Floats" },
  tldr: {
    en: "Bytes are not text until you name the encoding (use UTF-8 everywhere); Base64 is for carrying bytes through text channels, not security; choose JSON for humans and Protobuf/Avro for schemas and speed; never store money in floats.",
    he: "בתים הם לא טקסט עד שקובעים encoding (UTF-8 בכל מקום); Base64 נועד להעביר בתים בערוצי טקסט, לא לאבטחה; JSON לבני אדם ו-Protobuf/Avro בשביל schemas ומהירות; לעולם לא שומרים כסף ב-float."
  },
  analogy: {
    en: "Unicode is a giant phone book giving every character on Earth a number (א = U+05D0, 😀 = U+1F600). UTF-8 is the packing method for shipping those numbers as bytes: small boxes for English letters (1 byte), medium for Hebrew (2), bigger for emoji (4). Mojibake is opening a Hebrew box with English instructions — you get gibberish. Base64 is shrink-wrapping a fragile object so it survives a conveyor belt built for paper (email, JSON, URLs): bigger, not safer. Serialization is choosing between writing a letter (JSON: anyone can read it) and filling a pre-printed form (Protobuf: compact, both sides must have the same form).",
    he: "Unicode זה ספר טלפונים ענק שנותן לכל תו בעולם מספר (א = U+05D0, 😀 = U+1F600). UTF-8 זו שיטת האריזה לשלוח את המספרים האלה כבתים: קופסה קטנה לאותיות באנגלית (בית אחד), בינונית לעברית (2), גדולה לאימוג'י (4). Mojibake זה לפתוח קופסה בעברית עם הוראות באנגלית — מקבלים ג'יבריש. Base64 זה לעטוף חפץ שביר בניילון כדי שישרוד מסוע שנבנה לנייר (מייל, JSON, URLs): גדול יותר, לא בטוח יותר. Serialization זה לבחור בין לכתוב מכתב (JSON: כל אחד יכול לקרוא) לבין למלא טופס מודפס מראש (Protobuf: קומפקטי, שני הצדדים חייבים אותו טופס)."
  },
  sections: [
    {
      h: { en: "Characters, code points and UTF-8", he: "תווים, code points ו-UTF-8" },
      body: {
        en: `<table>
<tr><th>Char</th><th>Code point</th><th>UTF-8 bytes</th><th>UTF-16 units</th></tr>
<tr><td>A</td><td>U+0041</td><td>41 (1)</td><td>1</td></tr>
<tr><td>é</td><td>U+00E9</td><td>C3 A9 (2)</td><td>1</td></tr>
<tr><td>ש</td><td>U+05E9</td><td>D7 A9 (2)</td><td>1</td></tr>
<tr><td>€</td><td>U+20AC</td><td>E2 82 AC (3)</td><td>1</td></tr>
<tr><td>😀</td><td>U+1F600</td><td>F0 9F 98 80 (4)</td><td>2 (surrogate pair)</td></tr>
</table>
<pre>"שלום".length          // JS: 4 (UTF-16 units)
new TextEncoder().encode("שלום").length   // 8 bytes
"😀".length            // 2 !  [..."😀"].length -&gt; 1
"👨‍👩‍👧".length         // 8 — 3 emoji + 2 zero-width joiners
len("שלום".encode())   # Python: 8 bytes, len("שלום") = 4</pre>
<ul>
<li><strong>UTF-8</strong> is ASCII-compatible, self-synchronizing and the web's default (~98% of pages). Use it for files, APIs, DBs (<code>utf8mb4</code> in MySQL — plain <code>utf8</code> there is 3-byte and drops emoji!).</li>
<li>Limits like "VARCHAR(255)", "160 chars per SMS" or "max 1 KB header" count different things: bytes, code units, code points or user-perceived characters (grapheme clusters). Decide which.</li>
<li><strong>Normalization</strong>: "é" can be one code point (NFC) or e + combining accent (NFD). Normalize to NFC before comparing usernames or hashing, or the same-looking strings won't match.</li>
</ul>`,
        he: `<table>
<tr><th>תו</th><th>Code point</th><th>בתים ב-UTF-8</th><th>יחידות UTF-16</th></tr>
<tr><td>A</td><td>U+0041</td><td>41 (1)</td><td>1</td></tr>
<tr><td>é</td><td>U+00E9</td><td>C3 A9 (2)</td><td>1</td></tr>
<tr><td>ש</td><td>U+05E9</td><td>D7 A9 (2)</td><td>1</td></tr>
<tr><td>€</td><td>U+20AC</td><td>E2 82 AC (3)</td><td>1</td></tr>
<tr><td>😀</td><td>U+1F600</td><td>F0 9F 98 80 (4)</td><td>2 (surrogate pair)</td></tr>
</table>
<pre>"שלום".length          // JS: 4 (UTF-16 units)
new TextEncoder().encode("שלום").length   // 8 bytes
"😀".length            // 2 !  [..."😀"].length -&gt; 1
"👨‍👩‍👧".length         // 8 — 3 emoji + 2 zero-width joiners
len("שלום".encode())   # Python: 8 bytes, len("שלום") = 4</pre>
<ul>
<li><strong>UTF-8</strong> תואם ASCII, מסתנכרן מעצמו וברירת המחדל של ה-web (~98% מהדפים). משתמשים בו לקבצים, APIs ו-DBs (<code>utf8mb4</code> ב-MySQL — <code>utf8</code> רגיל שם הוא 3 בתים וזורק אימוג'י!).</li>
<li>מגבלות כמו "VARCHAR(255)", "160 תווים ל-SMS" או "header עד 1 KB" סופרות דברים שונים: בתים, code units, code points או תווים כפי שהמשתמש רואה (grapheme clusters). מחליטים מה סופרים.</li>
<li><strong>נרמול</strong>: "é" יכול להיות code point אחד (NFC) או e + סימן מצטרף (NFD). מנרמלים ל-NFC לפני השוואת שמות משתמש או hash, אחרת מחרוזות שנראות זהות לא יתאימו.</li>
</ul>`
      }
    },
    {
      h: { en: "Mojibake, BOM and declaring encodings", he: "Mojibake, BOM והצהרה על encoding" },
      body: {
        en: `<pre>bytes D7 A9 D7 9C D7 95 D7 9D  ("שלום" in UTF-8)
decoded as UTF-8        -&gt; שלום
decoded as Windows-1252 -&gt; ×©×œ×•×   &lt;- mojibake
decoded as Windows-1255 -&gt; garbage again</pre>
<ul>
<li>Bytes carry no encoding label. Declare it everywhere: <code>Content-Type: application/json; charset=utf-8</code>, <code>&lt;meta charset="utf-8"&gt;</code>, DB/connection charset, <code>open(p, encoding="utf-8")</code> (Python on Windows still defaults to the locale code page before 3.15).</li>
<li><strong>BOM</strong> (<code>EF BB BF</code>) at the start of a UTF-8 file: Excel likes it for CSV with Hebrew; shells, JSON parsers and <code>#!</code> scripts break on it.</li>
<li>Hebrew legacy encodings: Windows-1255 and ISO-8859-8 (visual order!) still appear in old government/bank files — convert at the boundary with <code>iconv</code>.</li>
</ul>`,
        he: `<pre>bytes D7 A9 D7 9C D7 95 D7 9D  ("שלום" in UTF-8)
decoded as UTF-8        -&gt; שלום
decoded as Windows-1252 -&gt; ×©×œ×•×   &lt;- mojibake
decoded as Windows-1255 -&gt; garbage again</pre>
<ul>
<li>בתים לא נושאים תווית encoding. מצהירים בכל מקום: <code>Content-Type: application/json; charset=utf-8</code>, <code>&lt;meta charset="utf-8"&gt;</code>, charset של ה-DB/connection, <code>open(p, encoding="utf-8")</code> (Python ב-Windows עדיין משתמש ב-code page של ה-locale כברירת מחדל לפני 3.15).</li>
<li><strong>BOM</strong> (<code>EF BB BF</code>) בתחילת קובץ UTF-8: Excel אוהב אותו ל-CSV עם עברית; shells, JSON parsers וסקריפטים עם <code>#!</code> נשברים ממנו.</li>
<li>Encodings ישנים של עברית: Windows-1255 ו-ISO-8859-8 (סדר ויזואלי!) עדיין מופיעים בקבצים ישנים של ממשלה/בנקים — ממירים בגבול המערכת עם <code>iconv</code>.</li>
</ul>`
      }
    },
    {
      h: { en: "Base64, URL encoding and hex", he: "Base64, URL encoding ו-hex" },
      body: {
        en: `<table>
<tr><th>Encoding</th><th>Overhead</th><th>Used for</th></tr>
<tr><td>Hex</td><td>×2</td><td>Hashes, debugging bytes (<code>sha256sum</code>)</td></tr>
<tr><td>Base64</td><td>×4/3 (+33%)</td><td>Email attachments (MIME), data: URIs, binary in JSON, k8s Secrets</td></tr>
<tr><td>Base64url</td><td>+33%</td><td>JWT, URLs, filenames (<code>-</code> <code>_</code> instead of <code>+</code> <code>/</code>, no padding)</td></tr>
<tr><td>Percent (URL)</td><td>up to ×3</td><td>Query strings: space → <code>%20</code>, ש → <code>%D7%A9</code></td></tr>
</table>
<pre>$ echo -n 'hi!' | base64           # aGkh
$ echo -n 'secret' | base64        # c2VjcmV0
$ kubectl get secret db -o jsonpath='{.data.password}' \
    | base64 -d                    # anyone with read can decode</pre>
<blockquote>⚠️ Production tip: Kubernetes Secrets are Base64-encoded, <strong>not encrypted</strong>. Enable encryption at rest (KMS provider), restrict RBAC on secrets, or use External Secrets / Sealed Secrets.</blockquote>`,
        he: `<table>
<tr><th>Encoding</th><th>תוספת גודל</th><th>שימוש</th></tr>
<tr><td>Hex</td><td>×2</td><td>Hashes, דיבאג של בתים (<code>sha256sum</code>)</td></tr>
<tr><td>Base64</td><td>×4/3 (+33%)</td><td>קבצים מצורפים במייל (MIME), data: URIs, בינארי בתוך JSON, Secrets ב-k8s</td></tr>
<tr><td>Base64url</td><td>+33%</td><td>JWT, URLs, שמות קבצים (<code>-</code> <code>_</code> במקום <code>+</code> <code>/</code>, בלי padding)</td></tr>
<tr><td>Percent (URL)</td><td>עד ×3</td><td>Query strings: רווח → <code>%20</code>, ש → <code>%D7%A9</code></td></tr>
</table>
<pre>$ echo -n 'hi!' | base64           # aGkh
$ echo -n 'secret' | base64        # c2VjcmV0
$ kubectl get secret db -o jsonpath='{.data.password}' \
    | base64 -d                    # anyone with read can decode</pre>
<blockquote>⚠️ טיפ לפרודקשן: Secrets ב-Kubernetes מקודדים ב-Base64, <strong>לא מוצפנים</strong>. מפעילים encryption at rest (KMS provider), מגבילים RBAC על secrets, או משתמשים ב-External Secrets / Sealed Secrets.</blockquote>`
      }
    },
    {
      h: { en: "Serialization formats compared", he: "השוואת פורמטי serialization" },
      body: {
        en: `<table>
<tr><th>Format</th><th>Human-readable</th><th>Schema</th><th>Size*</th><th>Typical use</th></tr>
<tr><td>JSON</td><td>Yes</td><td>Optional (JSON Schema)</td><td>100%</td><td>Public REST APIs, config, logs</td></tr>
<tr><td>Protobuf</td><td>No</td><td>Required (.proto, field numbers)</td><td>~30-50%</td><td>gRPC, internal RPC, storage</td></tr>
<tr><td>Avro</td><td>No</td><td>Required, sent/registered with data</td><td>~30-50%</td><td>Kafka + schema registry, Hadoop</td></tr>
<tr><td>MessagePack / CBOR</td><td>No</td><td>No</td><td>~70-80%</td><td>Compact JSON-like, Redis, IoT</td></tr>
<tr><td>XML</td><td>Yes</td><td>XSD</td><td>~150%+</td><td>SOAP, banking, SAML, legacy</td></tr>
<tr><td>Parquet</td><td>No</td><td>Yes, columnar</td><td>Tiny w/ compression</td><td>Analytics files, data lakes</td></tr>
</table>
<p>*relative to the same record in JSON, before compression.</p>
<pre>// Protobuf: the field NUMBER is the contract
message Order {
  string id          = 1;
  int64  total_cents = 2;
  // reserved 3;  // deleted field: never reuse
  string currency    = 4;   // added later: old readers ignore
}</pre>
<p><strong>Schema evolution rules</strong>: add only optional fields with defaults; never change a field's type or number; never reuse deleted numbers (<code>reserved</code>); rename freely in Protobuf (wire uses numbers) but not in JSON/Avro (names). Check compatibility in CI (<code>buf breaking</code>, schema registry compatibility mode BACKWARD).</p>`,
        he: `<table>
<tr><th>פורמט</th><th>קריא לבני אדם</th><th>Schema</th><th>גודל*</th><th>שימוש נפוץ</th></tr>
<tr><td>JSON</td><td>כן</td><td>אופציונלי (JSON Schema)</td><td>100%</td><td>REST APIs ציבוריים, config, לוגים</td></tr>
<tr><td>Protobuf</td><td>לא</td><td>חובה (.proto, מספרי שדות)</td><td>~30-50%</td><td>gRPC, RPC פנימי, אחסון</td></tr>
<tr><td>Avro</td><td>לא</td><td>חובה, נשלח/רשום עם המידע</td><td>~30-50%</td><td>Kafka + schema registry, Hadoop</td></tr>
<tr><td>MessagePack / CBOR</td><td>לא</td><td>לא</td><td>~70-80%</td><td>דמוי JSON קומפקטי, Redis, IoT</td></tr>
<tr><td>XML</td><td>כן</td><td>XSD</td><td>~150%+</td><td>SOAP, בנקאות, SAML, legacy</td></tr>
<tr><td>Parquet</td><td>לא</td><td>כן, עמודתי</td><td>זעיר עם דחיסה</td><td>קבצי אנליטיקה, data lakes</td></tr>
</table>
<p>*יחסית לאותה רשומה ב-JSON, לפני דחיסה.</p>
<pre>// Protobuf: the field NUMBER is the contract
message Order {
  string id          = 1;
  int64  total_cents = 2;
  // reserved 3;  // deleted field: never reuse
  string currency    = 4;   // added later: old readers ignore
}</pre>
<p><strong>חוקי התפתחות schema</strong>: מוסיפים רק שדות אופציונליים עם ברירות מחדל; לא משנים טיפוס או מספר של שדה; לא ממחזרים מספרים שנמחקו (<code>reserved</code>); ב-Protobuf אפשר לשנות שמות (ה-wire משתמש במספרים) אבל לא ב-JSON/Avro (שמות). בודקים תאימות ב-CI (<code>buf breaking</code>, מצב תאימות BACKWARD ב-schema registry).</p>`
      }
    },
    {
      h: { en: "Numbers: floats, money and big integers", he: "מספרים: floats, כסף ומספרים גדולים" },
      body: {
        en: `<pre>0.1 + 0.2              // 0.30000000000000004
0.1 + 0.2 === 0.3      // false
Number.MAX_SAFE_INTEGER   // 9007199254740991 (2^53 - 1)
JSON.parse('{"id":1234567890123456789}').id
                       // 1234567890123456800  (corrupted!)</pre>
<ul>
<li>IEEE-754 doubles can't represent 0.1 exactly. <strong>Money</strong>: store integer minor units (<code>total_cents BIGINT</code>) or <code>NUMERIC(19,4)</code>/<code>decimal</code>; carry the currency; define rounding (banker's rounding) explicitly.</li>
<li><strong>Big integers in JSON</strong>: JSON itself has no limit, but JS parsers do. Send 64-bit IDs as strings (<code>"id_str"</code>), or use <code>BigInt</code>-aware parsers.</li>
<li><strong>Comparing floats</strong>: use a tolerance (<code>abs(a-b) &lt; 1e-9</code>), never <code>==</code>. NaN != NaN.</li>
<li><strong>Dates</strong> in JSON have no type — agree on RFC 3339 strings (see the time lesson).</li>
</ul>
<blockquote>💡 Real world: Stripe's API represents every amount as an integer in the smallest currency unit (<code>"amount": 1999</code> = $19.99), and zero-decimal currencies (JPY) have no cents at all — the currency defines the exponent.</blockquote>`,
        he: `<pre>0.1 + 0.2              // 0.30000000000000004
0.1 + 0.2 === 0.3      // false
Number.MAX_SAFE_INTEGER   // 9007199254740991 (2^53 - 1)
JSON.parse('{"id":1234567890123456789}').id
                       // 1234567890123456800  (corrupted!)</pre>
<ul>
<li>Doubles של IEEE-754 לא יכולים לייצג 0.1 בדיוק. <strong>כסף</strong>: שומרים יחידות מינימליות כמספר שלם (<code>total_cents BIGINT</code>) או <code>NUMERIC(19,4)</code>/<code>decimal</code>; שומרים את המטבע; מגדירים עיגול (banker's rounding) במפורש.</li>
<li><strong>מספרים גדולים ב-JSON</strong>: ל-JSON עצמו אין מגבלה, אבל ל-parsers של JS יש. שולחים IDs של 64 ביט כמחרוזות (<code>"id_str"</code>), או משתמשים ב-parsers שמכירים <code>BigInt</code>.</li>
<li><strong>השוואת floats</strong>: עם סבולת (<code>abs(a-b) &lt; 1e-9</code>), לעולם לא <code>==</code>. NaN != NaN.</li>
<li><strong>תאריכים</strong> ב-JSON הם בלי טיפוס — מסכימים על מחרוזות RFC 3339 (ראו את שיעור הזמן).</li>
</ul>
<blockquote>💡 מהשטח: ה-API של Stripe מייצג כל סכום כמספר שלם ביחידת המטבע הקטנה (<code>"amount": 1999</code> = $19.99), ולמטבעות בלי אגורות (JPY) אין בכלל סנטים — המטבע קובע את החזקה.</blockquote>`
      }
    }
  ],
  diagram: `text "ש😀"
  | Unicode code points: U+05E9, U+1F600
  v UTF-8 encode
bytes D7 A9 F0 9F 98 80   (6 bytes; JS .length = 3)
  | Base64 (for a text channel)
  v
"16nwn5iA"               (+33%, NOT encryption)

record {id, total_cents} -> JSON 41 B | Protobuf ~14 B | Avro ~12 B`,
  handsOn: [
    { cmd: "printf 'שלום' | xxd", what: { en: "See the raw UTF-8 bytes of a Hebrew word (2 bytes per letter).", he: "רואים את בתי ה-UTF-8 הגולמיים של מילה בעברית (2 בתים לאות)." } },
    { cmd: "printf 'שלום' | iconv -f utf-8 -t windows-1255 | xxd && printf 'שלום' | iconv -f windows-1252 -t utf-8", what: { en: "Convert to the legacy Hebrew code page, then produce mojibake on purpose.", he: "ממירים ל-code page הישן של עברית, ואז מייצרים mojibake בכוונה." } },
    { cmd: "node -e \"console.log(0.1+0.2, 2**53+1, '😀'.length, [...'😀'].length, Buffer.from('ש').toString('base64'))\"", what: { en: "Float error, 2^53 limit, UTF-16 length vs code points, and Base64 in one line.", he: "שגיאת float, גבול 2^53, אורך UTF-16 מול code points, ו-Base64 בשורה אחת." } },
    { cmd: "python -c \"import unicodedata as u;a='é';b='e\\u0301';print(a==b, u.normalize('NFC',a)==u.normalize('NFC',b))\"", what: { en: "Two identical-looking strings that differ until normalized to NFC.", he: "שתי מחרוזות שנראות זהות ושונות עד שמנרמלים ל-NFC." } }
  ],
  mnemonic: {
    en: "\"Name your bytes (UTF-8), wrap don't hide (Base64), numbers are the contract (Protobuf), cents not floats.\"",
    he: "\"נותנים שם לבתים (UTF-8), עוטפים ולא מסתירים (Base64), המספרים הם החוזה (Protobuf), אגורות ולא floats.\""
  },
  pitfalls: [
    { en: "MySQL 'utf8' (3-byte) instead of utf8mb4 — inserts with emoji fail or get truncated.", he: "'utf8' של MySQL (3 בתים) במקום utf8mb4 — הכנסות עם אימוג'י נכשלות או נחתכות." },
    { en: "Treating Base64 as encryption — Kubernetes Secrets, 'obfuscated' API keys in apps.", he: "להתייחס ל-Base64 כהצפנה — Secrets ב-Kubernetes, מפתחות API 'מוסתרים' באפליקציות." },
    { en: "Reusing a deleted Protobuf field number — old messages decode into the wrong field.", he: "שימוש חוזר במספר שדה Protobuf שנמחק — הודעות ישנות מתפענחות לשדה הלא נכון." },
    { en: "Storing prices as FLOAT/DOUBLE — rounding drift in totals and reconciliation failures.", he: "שמירת מחירים כ-FLOAT/DOUBLE — סטיות עיגול בסכומים וכשלי התאמה." }
  ],
  interview: [
    {
      q: { en: "Why might a username limit of 20 characters break for some users, and how do you define it?", he: "למה מגבלת שם משתמש של 20 תווים יכולה להישבר אצל חלק מהמשתמשים, ואיך מגדירים אותה?" },
      a: { en: "Bytes, UTF-16 units, code points and graphemes differ: an emoji family is 1 visible character but 8 UTF-16 units and 18 bytes. Define limits in grapheme clusters for UX, enforce a byte limit for storage, normalize to NFC first, and validate the same way on client and server.", he: "בתים, יחידות UTF-16, code points ו-graphemes שונים: אימוג'י של משפחה הוא תו נראה אחד אבל 8 יחידות UTF-16 ו-18 בתים. מגדירים מגבלה ב-grapheme clusters ל-UX, אוכפים מגבלת בתים לאחסון, מנרמלים ל-NFC קודם, ומאמתים אותו דבר בלקוח ובשרת." }
    },
    {
      q: { en: "JSON or Protobuf for a new internal service-to-service API?", he: "JSON או Protobuf ל-API פנימי חדש בין שירותים?" },
      a: { en: "Protobuf (with gRPC or Connect) for internal high-volume calls: enforced schema, codegen, 2-3× smaller and faster to parse, safe evolution via field numbers with buf breaking checks. JSON for public/partner APIs and debugging-friendliness; many teams expose JSON at the edge via a gateway transcoding from gRPC.", he: "Protobuf (עם gRPC או Connect) לקריאות פנימיות בנפח גבוה: schema נאכף, codegen, קטן ומהיר לפענוח פי 2-3, התפתחות בטוחה לפי מספרי שדות עם בדיקות buf breaking. JSON ל-APIs ציבוריים/שותפים ולנוחות דיבאג; הרבה צוותים חושפים JSON בקצה דרך gateway שמתרגם מ-gRPC." }
    }
  ],
  quiz: [
    {
      q: { en: "How many UTF-8 bytes is the Hebrew letter ש?", he: "כמה בתים ב-UTF-8 תופסת האות ש?" },
      options: [
        { en: "1", he: "1" },
        { en: "2", he: "2" },
        { en: "3", he: "3" },
        { en: "4", he: "4" }
      ],
      answer: 1,
      explain: { en: "Hebrew (U+0590–U+05FF) encodes in 2 bytes in UTF-8.", he: "עברית (U+0590–U+05FF) מקודדת ב-2 בתים ב-UTF-8." }
    },
    {
      q: { en: "Base64 increases size by about…", he: "Base64 מגדיל את הגודל בערך ב-…" },
      options: [
        { en: "10%", he: "10%" },
        { en: "33%", he: "33%" },
        { en: "100%", he: "100%" },
        { en: "0%", he: "0%" }
      ],
      answer: 1,
      explain: { en: "Every 3 bytes become 4 ASCII characters.", he: "כל 3 בתים הופכים ל-4 תווי ASCII." }
    },
    {
      q: { en: "In Protobuf, what must never change for an existing field?", he: "ב-Protobuf, מה אסור לשנות לשדה קיים?" },
      options: [
        { en: "Its name", he: "השם שלו" },
        { en: "Its field number", he: "מספר השדה" },
        { en: "Its comment", he: "ההערה שלו" },
        { en: "Its position in the file", he: "המיקום שלו בקובץ" }
      ],
      answer: 1,
      explain: { en: "The wire format identifies fields by number; names are only for code.", he: "פורמט ה-wire מזהה שדות לפי מספר; השמות רק בשביל הקוד." }
    },
    {
      q: { en: "Best way to store $19.99?", he: "הדרך הכי טובה לשמור $19.99?" },
      options: [
        { en: "FLOAT 19.99", he: "FLOAT 19.99" },
        { en: "Integer 1999 cents + currency USD", he: "מספר שלם 1999 סנט + מטבע USD" },
        { en: "String '$19.99'", he: "מחרוזת '$19.99'" },
        { en: "DOUBLE 19.99", he: "DOUBLE 19.99" }
      ],
      answer: 1,
      explain: { en: "Integers in minor units (or DECIMAL) avoid binary floating-point rounding errors.", he: "מספרים שלמים ביחידות קטנות (או DECIMAL) נמנעים משגיאות עיגול של נקודה צפה בינארית." }
    }
  ],
  related: ["pr-integration-styles", "pr-time-timestamps", "pr-bitwise", "pr-email-sms", "pr-checksums-hashing"]
});

/* ------------------------------------------------------------------ */
INFRA.glossary.push(
  { term: "RFC 3339", track: "principal", def: { en: "Strict ISO 8601 timestamp profile for APIs, e.g. 2026-11-13T08:15:02Z.", he: "פרופיל קפדני של ISO 8601 ל-APIs, למשל 2026-11-13T08:15:02Z." }, lesson: "pr-time-timestamps" },
  { term: "OIDC", track: "principal", def: { en: "OpenID Connect: identity layer on OAuth 2.0 that issues an id_token about the user.", he: "OpenID Connect: שכבת זהות מעל OAuth 2.0 שמנפיקה id_token על המשתמש." }, lesson: "pr-auth" },
  { term: "UUID v7", track: "principal", def: { en: "128-bit ID with a 48-bit millisecond timestamp prefix: unique without coordination and index-friendly.", he: "מזהה 128 ביט עם קידומת timestamp של 48 ביט במילישניות: ייחודי בלי תיאום וידידותי לאינדקס." }, lesson: "pr-ids-pagination" },
  { term: "Keyset pagination", track: "principal", def: { en: "Paging with WHERE (sort_key, id) < last-seen values instead of OFFSET; constant cost at any depth.", he: "Pagination עם WHERE (sort_key, id) < הערכים האחרונים במקום OFFSET; עלות קבועה בכל עומק." }, lesson: "pr-ids-pagination" },
  { term: "Row-Level Security", track: "principal", def: { en: "Database policies that filter rows per session (e.g. by tenant_id) regardless of the query.", he: "Policies ב-DB שמסננות שורות לכל session (למשל לפי tenant_id) בלי קשר ל-query." }, lesson: "pr-multi-tenancy" },
  { term: "SSRF", track: "principal", def: { en: "Server-Side Request Forgery: tricking a server into fetching internal URLs such as cloud metadata.", he: "Server-Side Request Forgery: לגרום לשרת להביא URLs פנימיים כמו metadata של הענן." }, lesson: "pr-security-owasp" },
  { term: "Lost update", track: "principal", def: { en: "Two concurrent read-modify-write transactions where the second overwrites the first's change.", he: "שתי טרנזקציות read-modify-write מקבילות שבהן השנייה דורסת את השינוי של הראשונה." }, lesson: "pr-race-deadlock" },
  { term: "Hydration", track: "principal", def: { en: "Attaching client-side JS and event handlers to server-rendered HTML.", he: "חיבור JS ו-event handlers בצד הלקוח ל-HTML שרונדר בשרת." }, lesson: "pr-frontend-frameworks" },
  { term: "HMAC", track: "principal", def: { en: "Keyed hash proving integrity and authenticity with a shared secret (e.g. webhook signatures).", he: "Hash עם מפתח שמוכיח שלמות ואותנטיות עם סוד משותף (למשל חתימות webhook)." }, lesson: "pr-checksums-hashing" },
  { term: "Bitmask", track: "principal", def: { en: "An integer whose bits are flags; combine with OR, test with AND, clear with AND NOT.", he: "מספר שלם שהביטים שלו הם דגלים; משלבים עם OR, בודקים עם AND, מכבים עם AND NOT." }, lesson: "pr-bitwise" },
  { term: "UTF-8", track: "principal", def: { en: "Variable-length (1-4 byte) Unicode encoding, ASCII-compatible; the default for the web.", he: "Encoding של Unicode באורך משתנה (1-4 בתים), תואם ASCII; ברירת המחדל של ה-web." }, lesson: "pr-encoding-serialization" },
  { term: "Mojibake", track: "principal", def: { en: "Garbled text from decoding bytes with the wrong character encoding.", he: "טקסט משובש שנוצר מפענוח בתים עם encoding שגוי." }, lesson: "pr-encoding-serialization" }
);
