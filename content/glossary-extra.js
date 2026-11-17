/* Extra glossary terms and aliases.
   Aliases let the hover/tap glossary cards in lessons, on-call and decision pages catch the forms people actually write
   ("flakiness" → "Flaky test", "lead time" → "Lead time for changes"). Load this file after every other content file
   that defines glossary terms (see index.html). */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

INFRA.glossary.push(
  { term: "Deployment frequency", track: "cloud", aliases: ["deploy frequency"],
    def: { en: "How often a team successfully releases to production; one of the four DORA metrics. Elite teams deploy on demand, several times a day.",
           he: "כמה פעמים צוות עושה deploy מוצלח לפרודקשן; אחד מארבעת מדדי DORA. צוותים מובילים עושים deploy לפי הצורך, כמה פעמים ביום." },
    lesson: "dora-metrics" },
  { term: "Canary release", track: "reliability", aliases: ["canary", "canary deployment", "canaries"],
    def: { en: "Sending a small slice of traffic (1-5%) to the new version first and widening it only while its error rate and latency stay healthy.",
           he: "שולחים קודם נתח קטן מהתעבורה (1-5%) לגרסה החדשה, ומרחיבים רק כל עוד ה-error rate וה-latency שלה תקינים." },
    lesson: "k8s-argo-rollouts" },
  { term: "Rollback", track: "reliability", aliases: ["roll back", "rollbacks"],
    def: { en: "Returning production to the last known-good version. Fast when you deploy immutable artifacts by digest; hard when a schema migration already ran.",
           he: "החזרת הפרודקשן לגרסה האחרונה שעבדה. מהיר כשעושים deploy ל-artifacts קבועים לפי digest; קשה כשכבר רצה migration ל-schema." },
    lesson: "release-engineering" },
  { term: "Postmortem", track: "reliability", aliases: ["post-mortem", "postmortems"],
    def: { en: "A blameless write-up after an incident: timeline, impact, root causes and owned action items that prevent a repeat.",
           he: "סיכום אחרי תקלה, בלי האשמות: ציר זמן, השפעה, סיבות שורש ומשימות עם בעלים שמונעות הישנות." },
    lesson: "rel-incident-management" },
  { term: "On-call", track: "reliability", aliases: ["on call", "oncall"],
    def: { en: "The rotation of engineers who get paged for production alerts outside working hours and own the first response.",
           he: "סבב המהנדסים שמקבלים page על התראות פרודקשן גם מחוץ לשעות העבודה, ואחראים על התגובה הראשונה." },
    lesson: "rel-runbooks-oncall" },
  { term: "Tail latency", track: "observability", aliases: ["p99", "p99.9", "p95"],
    def: { en: "The slowest requests, measured by high percentiles (p95, p99, p99.9). Averages hide them, yet one slow call in a fan-out slows the whole page.",
           he: "הבקשות האיטיות ביותר, נמדדות באחוזונים גבוהים (p95, p99, p99.9). ממוצע מסתיר אותן, אבל קריאה איטית אחת ב-fan-out מאטה את כל הדף." },
    lesson: "obs-golden-signals" },
  { term: "Noisy neighbor", track: "kubernetes", aliases: ["noisy neighbour", "noisy neighbors"],
    def: { en: "A workload that hogs a shared resource (CPU, disk IO, network, cache) and slows everything else on the same host or cluster.",
           he: "Workload שמשתלט על משאב משותף (CPU, IO של דיסק, רשת, cache) ומאט את כל השאר על אותו host או cluster." },
    lesson: "k8s-resources" },
  { term: "Thundering herd", track: "architecture", aliases: ["cache stampede", "stampede"],
    def: { en: "Many clients retrying or refilling the same thing at the same moment, for example when a hot cache key expires, which overloads the backend.",
           he: "הרבה clients שמנסים שוב או ממלאים את אותו דבר באותו רגע, למשל כש-key חם ב-cache פג תוקף, ומעמיסים את ה-backend." },
    lesson: "arch-caching" }
);

// aliases for terms defined in other files
(function () {
  const aliases = {
    "Flaky test": ["flaky", "flakiness", "flaky tests"],
    "Lead time for changes": ["lead time"],
    "Change failure rate": ["CFR"],
    "MTTR": ["time to restore", "mean time to recovery"],
    "Golden path": ["golden paths"],
    "Blast radius": ["blast-radius"],
    "Error budget": ["error budgets"],
    "Feature flag": ["feature flags", "feature toggle"],
    "Idempotency": ["idempotent"],
    "Cold start": ["cold starts"],
    "Circuit breaker": ["circuit breakers"],
    "Runbook": ["runbooks"],
    "Dead letter queue (DLQ)": ["DLQ", "dead-letter queue", "dead letter queues"]
  };
  const byTerm = new Map(INFRA.glossary.map(g => [g.term.toLowerCase(), g]));
  Object.entries(aliases).forEach(([term, list]) => {
    const g = byTerm.get(term.toLowerCase());
    if (g) g.aliases = [...new Set([...(g.aliases || []), ...list])];
  });
})();
