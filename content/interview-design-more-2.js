// Interview prep — more system design cases (part 3). Format: CONTENT_SCHEMA.md ("Interview prep — system design case").
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-typeahead", icon: "⌨️", level: 2,
  title: { en: "Design typeahead / search autocomplete", he: "תכנון typeahead ‏/ autocomplete לחיפוש" },
  prompt: {
    en: "Design the autocomplete box of a large search engine: as the user types, show the 10 most relevant completions for the current prefix in under 100 ms, reflecting trending queries within minutes and never suggesting offensive terms.",
    he: "תתכנן את תיבת ה-autocomplete של מנוע חיפוש גדול: תוך כדי הקלדה מציגים את 10 ההשלמות הכי רלוונטיות ל-prefix הנוכחי בפחות מ-100ms, משקפים שאילתות טרנדיות תוך דקות, ולעולם לא מציעים מונחים פוגעניים."
  },
  clarify: [
    { en: "Scale: how many searches per day and how many keystrokes become requests? (assume 1B searches/day, ~4 suggest requests per search after debouncing)",
      he: "Scale: כמה חיפושים ביום וכמה הקשות הופכות לבקשות? (נניח 1B חיפושים ביום, ‏~4 בקשות suggest לכל חיפוש אחרי debounce)" },
    { en: "What ranks a completion — global popularity only, or also recency, location, language and the user's own history?",
      he: "לפי מה מדרגים השלמה — רק פופולריות גלובלית, או גם עדכניות, מיקום, שפה וההיסטוריה של המשתמש עצמו?" },
    { en: "How fresh must it be? Is a daily rebuild OK, or must breaking news (\"earthquake tel aviv\") appear within minutes?",
      he: "כמה טרי זה צריך להיות? Rebuild יומי זה בסדר, או ש-breaking news (\"רעידת אדמה תל אביב\") צריך להופיע תוך דקות?" },
    { en: "Prefix match only, or also typo tolerance (\"amazn\" → \"amazon\") and mid-word matches?",
      he: "רק התאמת prefix, או גם סובלנות לשגיאות (\"amazn\" → \"amazon\") והתאמה באמצע מילה?" },
    { en: "Which languages and scripts? Hebrew + English mixed, right-to-left, keyboard-layout mistakes (\"ageu\" typed instead of \"שלום\")?",
      he: "אילו שפות וכתבים? עברית ואנגלית מעורבבות, RTL, טעויות של שפת מקלדת (הקלדה באנגלית כשהתכוונת לעברית)?" },
    { en: "Content policy: who owns the blocklist, and how fast must a takedown take effect?",
      he: "מדיניות תוכן: מי אחראי על ה-blocklist, וכמה מהר הסרה צריכה להיכנס לתוקף?" }
  ],
  functional: [
    { en: "Return up to 10 ranked completions for a prefix (from 1 character), per language/locale.",
      he: "להחזיר עד 10 השלמות מדורגות ל-prefix (מתו אחד), לפי שפה ו-locale." },
    { en: "Blend global popular queries, fresh trending queries and the user's recent searches.",
      he: "לשלב שאילתות פופולריות גלובליות, שאילתות טרנדיות טריות והחיפושים האחרונים של המשתמש." },
    { en: "Filter offensive, illegal or legally removed completions, with takedowns live in minutes.",
      he: "לסנן השלמות פוגעניות, לא חוקיות או כאלה שהוסרו משפטית, עם הסרה שנכנסת לתוקף תוך דקות." },
    { en: "Log impressions and selections to improve ranking.",
      he: "לתעד impressions ובחירות כדי לשפר את ה-ranking." }
  ],
  nonFunctional: [
    { en: "End-to-end p99 under 100 ms (server-side under 10 ms) — slower than typing speed is useless.",
      he: "p99 מקצה לקצה מתחת ל-100ms (בצד השרת מתחת ל-10ms) — אם זה איטי מקצב ההקלדה, זה חסר תועלת." },
    { en: "Very high read QPS (~150K peak), tiny responses, read-only path; writes are batch/stream rebuilds.",
      he: "QPS קריאה גבוה מאוד (~150K ב-peak), תשובות קטנטנות, נתיב read-only; הכתיבות הן rebuilds ב-batch או ב-stream." },
    { en: "Highly available but not critical: on failure show nothing rather than slow down the search box.",
      he: "Availability גבוה אבל לא קריטי: בתקלה עדיף לא להציג כלום מאשר להאט את תיבת החיפוש." },
    { en: "Eventual consistency is fine; trending freshness within ~5 minutes.",
      he: "Eventual consistency מקובל; טריות של טרנדים תוך ~5 דקות." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Request rate</strong>: 1B searches/day × ~4 suggest calls (debounce 50-100 ms, skip when the user types fast) = 4B/day ≈ <strong>46K QPS</strong> average, ~3× at peak ≈ <strong>150K QPS</strong>.</li>
<li><strong>Edge cache</strong>: prefixes of 1-3 characters are a few hundred thousand keys and take ~50% of traffic. With a 5-10 minute TTL at the CDN, ~60-70% of requests never reach origin → origin sees ~50K QPS peak.</li>
<li><strong>Corpus</strong>: ~100M distinct queries/day; keep the ~20M that appear at least N times (privacy + quality). Average query ~20 chars → with shared prefixes, ~<strong>150-200M distinct prefixes</strong> (capped at 30 chars).</li>
<li><strong>Precomputed top-K</strong>: per prefix store 10 suggestion IDs (4 B each) + scores ≈ 80 B + key + overhead ≈ <strong>~120 B</strong>. 200M × 120 B ≈ <strong>24 GB</strong> — fits in RAM on one memory-optimized node; shard 4 ways by prefix hash for headroom and replicate 3× per region.</li>
<li><strong>Origin capacity</strong>: an in-memory lookup is ~10-50 µs; with HTTP overhead one 16-vCPU node serves ~30-50K QPS → ~4 shards × 3 replicas per region is plenty.</li>
<li><strong>Logs</strong>: 4B events/day × ~200 B ≈ <strong>800 GB/day</strong> into Kafka → hourly batch aggregation + 1-minute streaming counts.</li>
</ul>`,
    he: `<ul>
<li><strong>קצב בקשות</strong>: ‏1B חיפושים ביום × ~4 קריאות suggest ‏(debounce של 50-100ms, מדלגים כשהמשתמש מקליד מהר) = ‏4B ביום ≈ <strong>46K QPS</strong> בממוצע, ‏~פי 3 ב-peak ≈ <strong>150K QPS</strong>.</li>
<li><strong>Edge cache</strong>: prefixes של 1-3 תווים הם כמה מאות אלפי מפתחות ומקבלים ~50% מהתנועה. עם TTL של 5-10 דקות ב-CDN, ‏~60-70% מהבקשות לא מגיעות ל-origin → ה-origin רואה ~50K QPS ב-peak.</li>
<li><strong>קורפוס</strong>: ‏~100M שאילתות שונות ביום; שומרים את ~20M שמופיעות לפחות N פעמים (פרטיות + איכות). שאילתה ממוצעת ~20 תווים → עם prefixes משותפים, ‏~<strong>150-200M prefixes שונים</strong> (חותכים ב-30 תווים).</li>
<li><strong>Top-K מחושב מראש</strong>: לכל prefix שומרים 10 מזהי הצעות (4B כל אחד) + scores ≈ ‏80B + מפתח + overhead ≈ <strong>~120B</strong>. ‏200M × 120B ≈ <strong>24GB</strong> — נכנס ל-RAM של node אחד memory-optimized; עושים 4 shards לפי hash של ה-prefix בשביל מרווח, ו-3 replicas בכל region.</li>
<li><strong>קיבולת origin</strong>: lookup בזיכרון לוקח ~10-50µs; עם ה-overhead של HTTP, ‏node של 16 vCPU מגיש ~30-50K QPS → ‏4 shards × 3 replicas בכל region זה יותר ממספיק.</li>
<li><strong>Logs</strong>: ‏4B אירועים ביום × ~200B ≈ <strong>800GB ביום</strong> ל-Kafka → אגרגציה שעתית ב-batch ועוד ספירות streaming של דקה.</li>
</ul>`
  },
  api: `GET /v1/suggest?q=how+to+ex&locale=he-IL&limit=10&session=s_9f2
  Cache-Control: public, max-age=300        (only for anonymous, non-personalized responses)
  -> 200 {
       prefix: "how to ex",
       suggestions: [
         {text: "how to exit vim", source: "global"},
         {text: "how to export csv from excel", source: "global"},
         {text: "how to exercise at home", source: "trending"},
         {text: "how to extend lvm", source: "history"}
       ],
       model_version: "2026-11-14T10:00Z"
     }

POST /v1/suggest/feedback {session, prefix, shown:[...], chosen_index: 0}    (async, fire-and-forget)

Admin:
  PUT    /v1/blocklist {pattern: "...", match: "exact|token|regex", locale: "*", reason: "legal"}
  DELETE /v1/history/me                                                     (user clears history)`,
  dataModel: `Query logs (Kafka): search.queries {ts, user_hash, locale, query, chosen_from_suggest}

Batch output (hourly, object storage -> loaded into serving nodes):
  queries(query_id, text, locale, score)               ~20M rows
  prefix_topk(locale, prefix PK, [query_id x10], [score x10])   ~200M rows, ~24 GB

Streaming (Flink, 1-min tumbling + 1h decay):
  trending(locale, prefix, [query x10], expires_at)   small, kept in Redis

Personal history (Redis / KV, TTL 30d):
  hist:{user_id} -> sorted set {query: last_used_ts}   max 100 entries

Blocklist (config DB -> pushed to all serving nodes in seconds):
  blocklist(id, pattern, match_type, locale, reason, created_by, created_at)`,
  diagram: `   Browser (debounce 80 ms, local cache of last prefixes)
       |
       v
   CDN / edge  -- cache hit for short anonymous prefixes (TTL 5 min) --> response
       | miss
       v
   Suggest API (stateless) ---- personal history ---> Redis (hist:{user})
       |   merge: global top-K + trending + history, filter blocklist, re-rank
       |-------------------------> Trending store (Redis, written by Flink)
       v
   Prefix serving nodes (in-memory map prefix -> top-K, sharded by prefix hash, 3 replicas)
       ^
       | load new snapshot hourly (atomic swap, versioned)
   Batch builder (Spark): count queries (time-decayed), drop rare/blocked,
                          build prefix -> top-K, write snapshot to S3
       ^
   Kafka: search.queries  ---->  Flink: 1-min counts per query -> trending`,
  deepDives: [
    {
      h: { en: "Trie vs prefix index: precompute top-K, don't search at query time", he: "Trie מול prefix index: מחשבים top-K מראש, לא מחפשים בזמן השאילתה" },
      body: {
        en: `<p>The textbook answer is a <strong>trie</strong>: walk down the characters of the prefix, then DFS the subtree to find the 10 most popular completions. Walking is O(prefix length), but the DFS on a short prefix like "a" touches millions of nodes — far too slow at 150K QPS.</p>
<ul>
<li><strong>Fix 1: cache top-K in every trie node.</strong> Each node stores its best 10 completions, computed bottom-up at build time. A lookup becomes O(prefix length) with no subtree walk. Memory grows (10 pointers per node), but it is still tens of GB.</li>
<li><strong>Fix 2: flatten it.</strong> Once every node holds its top-K, you don't need the tree at all at serving time: a plain <strong>hash map prefix → top-K</strong> (or a sorted key-value store like RocksDB) does the same job, shards trivially by prefix, and can live in Redis, a KV store or a custom in-memory service.</li>
<li><strong>Build offline</strong>: a Spark job counts queries with time decay (score = Σ count × 0.5^(age/7d)), drops queries below a minimum count, then for each query emits all its prefixes (<code>"vim" → "v","vi","vim"</code>), groups by prefix and keeps the top 10. Writes a versioned snapshot; serving nodes load it and swap atomically.</li>
<li><strong>Limit prefix length</strong> (e.g. 30 chars): long prefixes are rare; for them, fall back to a search-engine query (<code>search_as_you_type</code> in Elasticsearch) or return nothing.</li>
</ul>
<p>Typo tolerance doesn't fit a pure prefix map: handle it with a small fuzzy index (edit distance 1 on prefixes ≥ 4 chars) queried only when the exact prefix returns too few results.</p>`,
        he: `<p>התשובה מהספר היא <strong>trie</strong>: יורדים לפי התווים של ה-prefix, ואז עושים DFS על תת-העץ כדי למצוא את 10 ההשלמות הכי פופולריות. הירידה היא O(אורך ה-prefix), אבל DFS על prefix קצר כמו "a" נוגע במיליוני nodes — איטי מדי ב-150K QPS.</p>
<ul>
<li><strong>תיקון 1: לשמור top-K בכל node.</strong> כל node מחזיק את 10 ההשלמות הכי טובות שלו, שמחושבות מלמטה למעלה בזמן ה-build. Lookup הופך ל-O(אורך ה-prefix) בלי לעבור על תת-העץ. הזיכרון גדל (10 מצביעים לכל node), אבל זה עדיין עשרות GB.</li>
<li><strong>תיקון 2: לשטח.</strong> ברגע שכל node מחזיק top-K, בזמן serving בכלל לא צריך את העץ: <strong>hash map פשוט של prefix → top-K</strong> (או KV ממוין כמו RocksDB) עושה אותה עבודה, מתחלק ל-shards בקלות לפי prefix, ויכול לשבת ב-Redis, ב-KV store או בשירות in-memory ייעודי.</li>
<li><strong>Build מחוץ לנתיב</strong>: job של Spark סופר שאילתות עם דעיכה בזמן (score = Σ count × 0.5^(age/7d)), זורק שאילתות מתחת לסף מינימלי, ואז לכל שאילתה מוציא את כל ה-prefixes שלה (<code>"vim" → "v","vi","vim"</code>), מקבץ לפי prefix ושומר את ה-10 הטובים. כותב snapshot עם גרסה; ה-serving nodes טוענים אותו ומחליפים באופן אטומי.</li>
<li><strong>להגביל אורך prefix</strong> (למשל 30 תווים): prefixes ארוכים נדירים; עבורם עושים fallback לשאילתת search engine ‏(<code>search_as_you_type</code> ב-Elasticsearch) או לא מחזירים כלום.</li>
</ul>
<p>סובלנות לשגיאות לא מתאימה ל-map של prefixes: מטפלים בה עם אינדקס fuzzy קטן (edit distance של 1 על prefixes מ-4 תווים ומעלה) שנשאל רק כשה-prefix המדויק מחזיר מעט מדי תוצאות.</p>`
      }
    },
    {
      h: { en: "Freshness pipeline: hourly batch + streaming trending layer", he: "Pipeline של טריות: batch שעתי ועוד שכבת trending ב-streaming" },
      body: {
        en: `<p>Rebuilding 200M prefixes takes ~20-40 minutes of Spark, so the batch layer is hourly at best. Breaking news needs minutes. This is a classic <strong>lambda split</strong>:</p>
<ul>
<li><strong>Batch layer</strong> (hourly/daily): stable popularity with long decay; the bulk of suggestions.</li>
<li><strong>Speed layer</strong>: Flink consumes <code>search.queries</code>, counts per (locale, query) in 1-minute windows and compares against the query's baseline. A query whose rate jumps 10× above baseline and over a minimum absolute count is "trending"; Flink writes its prefixes' top-K to Redis with a 1-2 hour TTL.</li>
<li><strong>Merge at query time</strong>: the Suggest API fetches global top-K + trending top-K (two in-memory lookups, ~1 ms), interleaves them with a score boost for trending, dedups, filters, returns 10.</li>
<li><strong>Abuse</strong>: trending is the attack surface — bots search a phrase 100K times to push it into suggestions. Count distinct users (HyperLogLog per query), not raw searches, and require several regions/ASNs.</li>
</ul>`,
        he: `<p>Rebuild של 200M prefixes לוקח ~20-40 דקות של Spark, אז שכבת ה-batch היא שעתית במקרה הטוב. Breaking news צריך דקות. זה <strong>פיצול lambda</strong> קלאסי:</p>
<ul>
<li><strong>שכבת batch</strong> (שעתית או יומית): פופולריות יציבה עם דעיכה ארוכה; רוב ההצעות.</li>
<li><strong>שכבת speed</strong>: ‏Flink צורך את <code>search.queries</code>, סופר לכל (locale, query) בחלונות של דקה ומשווה ל-baseline של השאילתה. שאילתה שהקצב שלה קופץ פי 10 מעל ה-baseline ומעל סף מוחלט מינימלי היא "טרנדית"; ‏Flink כותב את ה-top-K של ה-prefixes שלה ל-Redis עם TTL של 1-2 שעות.</li>
<li><strong>מיזוג בזמן השאילתה</strong>: ה-Suggest API מביא top-K גלובלי + top-K טרנדי (שני lookups בזיכרון, ‏~1ms), משלב ביניהם עם boost ל-trending, מסיר כפילויות, מסנן ומחזיר 10.</li>
<li><strong>ניצול לרעה</strong>: ה-trending הוא משטח התקיפה — bots מחפשים ביטוי 100K פעמים כדי לדחוף אותו להצעות. סופרים משתמשים ייחודיים (HyperLogLog לכל שאילתה) ולא חיפושים גולמיים, ודורשים פיזור על כמה regions ו-ASNs.</li>
</ul>`
      }
    },
    {
      h: { en: "Hitting 100 ms: client, edge and server budget", he: "לעמוד ב-100ms: תקציב בצד הלקוח, ב-edge ובשרת" },
      body: {
        en: `<ul>
<li><strong>Client</strong>: debounce ~50-100 ms, cancel in-flight requests when a new keystroke arrives (AbortController), cache responses per prefix locally, and filter the cached list for "vim" when the user extends "vi" if the list is long enough.</li>
<li><strong>Edge</strong>: anonymous, non-personalized responses for short prefixes are identical for everyone in a locale → cache at the CDN with <code>Cache-Control: public, max-age=300</code> keyed by (locale, prefix). A CDN PoP is ~10-20 ms away versus 50-150 ms to a far region.</li>
<li><strong>Personalization without killing the cache</strong>: fetch the cacheable global list from the edge and the user's history separately (or keep the last 100 searches in the browser) and merge on the client.</li>
<li><strong>Server</strong>: keep it in-process memory; one network hop at most (Redis for trending/history in the same AZ, ~0.5 ms). Avoid fan-out across shards: shard by full prefix hash so one request touches one shard.</li>
<li><strong>Connection reuse</strong>: HTTP/2 or HTTP/3 to the edge so a keystroke doesn't pay TCP + TLS handshakes (that alone is 2-3 RTTs).</li>
</ul>`,
        he: `<ul>
<li><strong>Client</strong>: ‏debounce של ~50-100ms, ביטול בקשות שבדרך כשמגיעה הקשה חדשה (AbortController), ‏cache מקומי של תשובות לכל prefix, וכשהמשתמש ממשיך מ-"vi" ל-"vim" — סינון של הרשימה השמורה אם היא ארוכה מספיק.</li>
<li><strong>Edge</strong>: תשובות אנונימיות ולא מותאמות אישית ל-prefixes קצרים זהות לכולם באותו locale → שומרים אותן ב-CDN עם <code>Cache-Control: public, max-age=300</code> לפי (locale, prefix). PoP של CDN נמצא ~10-20ms ממך, לעומת 50-150ms ל-region רחוק.</li>
<li><strong>התאמה אישית בלי להרוג את ה-cache</strong>: מביאים את הרשימה הגלובלית מה-edge ואת ההיסטוריה של המשתמש בנפרד (או שומרים את 100 החיפושים האחרונים בדפדפן) וממזגים בצד הלקוח.</li>
<li><strong>Server</strong>: הכל בזיכרון של התהליך; לכל היותר hop רשת אחד (Redis ל-trending והיסטוריה באותו AZ, ‏~0.5ms). נמנעים מ-fan-out בין shards: מחלקים לפי hash של ה-prefix המלא כך שבקשה נוגעת ב-shard אחד.</li>
<li><strong>שימוש חוזר בחיבורים</strong>: HTTP/2 או HTTP/3 מול ה-edge כדי שהקשה לא תשלם על TCP ו-TLS handshakes (רק זה 2-3 RTTs).</li>
</ul>`
      }
    },
    {
      h: { en: "Offensive-term filtering and takedowns", he: "סינון מונחים פוגעניים והסרות" },
      body: {
        en: `<p>One bad suggestion next to a person's name is a headline. Filter in <strong>three places</strong>:</p>
<ul>
<li><strong>At build time</strong>: drop queries matching the blocklist (exact, token-level, and normalized forms: lowercase, Unicode NFKC, leetspeak "pr0n", Hebrew without niqqud) plus an ML toxicity classifier score above a threshold. Also drop queries searched by fewer than ~50 distinct users — this alone removes most personal data and harassment.</li>
<li><strong>At serve time</strong>: re-check every suggestion against the current blocklist, because a takedown can't wait for the next hourly rebuild. The blocklist is small (tens of thousands of patterns), compiled into an Aho-Corasick automaton, pushed to all nodes within seconds.</li>
<li><strong>Sensitive prefixes</strong>: for a person's name, return only allow-listed completion patterns, or none.</li>
</ul>
<p>Keep an audit log of who blocked what and why (legal requests per country differ — a "right to be forgotten" removal may apply only to EU locales).</p>`,
        he: `<p>הצעה רעה אחת ליד שם של אדם היא כותרת בעיתון. מסננים ב<strong>שלושה מקומות</strong>:</p>
<ul>
<li><strong>בזמן ה-build</strong>: זורקים שאילתות שתואמות ל-blocklist (התאמה מדויקת, ברמת מילה, ובצורות מנורמלות: lowercase, ‏Unicode NFKC, ‏leetspeak כמו "pr0n", עברית בלי ניקוד) ועוד score של classifier לרעילות מעל סף. בנוסף זורקים שאילתות שחיפשו פחות מ-~50 משתמשים ייחודיים — זה לבד מסיר את רוב המידע האישי וההטרדות.</li>
<li><strong>בזמן ה-serving</strong>: בודקים כל הצעה שוב מול ה-blocklist העדכני, כי הסרה לא יכולה לחכות ל-rebuild השעתי הבא. ה-blocklist קטן (עשרות אלפי תבניות), מקומפל ל-automaton של Aho-Corasick ונדחף לכל ה-nodes תוך שניות.</li>
<li><strong>Prefixes רגישים</strong>: לשם של אדם מחזירים רק תבניות השלמה מתוך allow-list, או כלום.</li>
</ul>
<p>שומרים audit log של מי חסם מה ולמה (בקשות משפטיות שונות בין מדינות — הסרה בגלל "הזכות להישכח" יכולה לחול רק על locales באיחוד האירופי).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Precomputed top-K per prefix: O(1) lookups and trivial sharding, but ~10× more memory than a bare trie and freshness limited by the rebuild.",
      he: "Top-K מחושב מראש לכל prefix: ‏lookups ב-O(1) ו-sharding פשוט, אבל פי ~10 יותר זיכרון מ-trie חשוף וטריות שמוגבלת על ידי ה-rebuild." },
    { en: "Edge caching cuts origin load by ~60-70% and latency by tens of ms, but delays takedowns by up to the TTL — keep TTL short (minutes) and purge on legal blocks.",
      he: "Cache ב-edge מוריד ~60-70% מהעומס על ה-origin ועשרות ms מה-latency, אבל מעכב הסרות עד אורך ה-TTL — שומרים TTL קצר (דקות) ועושים purge בחסימות משפטיות." },
    { en: "Personalization improves click-through but breaks shared caching and raises privacy questions; merging on the client keeps both.",
      he: "התאמה אישית משפרת click-through אבל שוברת cache משותף ומעלה שאלות פרטיות; מיזוג בצד הלקוח שומר על שניהם." },
    { en: "Higher minimum-count threshold = safer and smaller index, but long-tail and new queries never appear.",
      he: "סף ספירה מינימלי גבוה יותר = אינדקס בטוח וקטן יותר, אבל שאילתות long-tail וחדשות לעולם לא מופיעות." }
  ],
  followUps: [
    { q: { en: "How do you roll out a new snapshot without a latency spike or mixed results?",
           he: "איך מגלגלים snapshot חדש בלי קפיצת latency ובלי תוצאות מעורבבות?" },
      a: { en: "Serving nodes load the new snapshot into a second buffer in the background (memory-map the file, warm it), then swap a pointer atomically; the old buffer is freed after in-flight requests drain. Roll out node by node with a canary, compare CTR and empty-result rate, and keep the previous version for instant rollback. Responses carry model_version so mixed versions during rollout are visible and harmless.",
           he: "ה-serving nodes טוענים את ה-snapshot החדש ל-buffer שני ברקע (memory-map לקובץ, חימום), ואז מחליפים מצביע באופן אטומי; ה-buffer הישן משתחרר אחרי שהבקשות שבדרך מסתיימות. מגלגלים node אחרי node עם canary, משווים CTR ושיעור תשובות ריקות, ושומרים את הגרסה הקודמת ל-rollback מיידי. התשובות כוללות model_version, כך שגרסאות מעורבבות בזמן ה-rollout גלויות ולא מזיקות." } },
    { q: { en: "The single prefix \"a\" is a hot key — does it melt one shard?",
           he: "ה-prefix \"a\" לבדו הוא hot key — הוא ממיס shard אחד?" },
      a: { en: "Mostly no: 1-2 character prefixes are cached at the CDN and in each Suggest API instance's local LRU (seconds of TTL), so the shard sees a trickle. As extra protection, replicate the hottest few thousand prefixes to every shard and route them to any replica.",
           he: "בעיקר לא: prefixes של 1-2 תווים יושבים ב-cache של ה-CDN וב-LRU מקומי בכל instance של ה-Suggest API ‏(TTL של שניות), כך שה-shard רואה טפטוף. כהגנה נוספת, משכפלים את כמה אלפי ה-prefixes הכי חמים לכל ה-shards ומנתבים אותם לכל replica." } },
    { q: { en: "How would you handle Hebrew typed on an English keyboard layout?",
           he: "איך היית מטפל בעברית שהוקלדה במקלדת באנגלית?" },
      a: { en: "Map the prefix through the keyboard layout (\"ahk\" → \"שלו\") when it yields no or poor results in the typed script, and query both; rank the converted results slightly lower unless the user's locale is he-IL. It is cheap: a fixed 1:1 character table and one extra lookup.",
           he: "ממפים את ה-prefix דרך פריסת המקלדת (\"ahk\" → \"שלו\") כשבכתב שהוקלד אין תוצאות או שהן חלשות, ושואלים את שניהם; מדרגים את התוצאות המומרות קצת נמוך יותר, אלא אם ה-locale של המשתמש הוא he-IL. זה זול: טבלת תווים קבועה של 1:1 ו-lookup נוסף אחד." } }
  ],
  related: ["algo-search-ranking", "db-search-engines", "arch-caching", "net-proxies-cdn", "redis-deep", "algo-edit-distance"]
});

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-web-crawler", icon: "🕷️", level: 2,
  title: { en: "Design a web crawler", he: "תכנון web crawler" },
  prompt: {
    en: "Design a crawler that downloads 1 billion web pages per month for a search index: discover new URLs, respect robots.txt and per-site politeness, avoid duplicates and crawler traps, and recrawl pages based on how often they change.",
    he: "תתכנן crawler שמוריד מיליארד דפי web בחודש בשביל אינדקס חיפוש: מגלה URLs חדשים, מכבד robots.txt ו-politeness לכל אתר, נמנע מכפילויות וממלכודות crawler, ועושה recrawl לדפים לפי כמה הם משתנים."
  },
  clarify: [
    { en: "Purpose: search indexing, archiving, or a focused crawl (e.g. only news or product pages)? That decides prioritization.",
      he: "מטרה: אינדוקס לחיפוש, ארכוב, או crawl ממוקד (למשל רק חדשות או דפי מוצר)? זה קובע את סדר העדיפויות." },
    { en: "Volume: 1B pages/month fetched, of which how many new vs recrawls? Total known URLs? (assume 10B known URLs)",
      he: "נפח: ‏1B דפים בחודש, כמה מהם חדשים וכמה recrawl? כמה URLs ידועים בסך הכל? (נניח 10B URLs ידועים)" },
    { en: "Content types: HTML only, or also PDFs, images, JavaScript-rendered pages (needs a headless browser, ~10-50× costlier)?",
      he: "סוגי תוכן: רק HTML, או גם PDF, תמונות ודפים שמרונדרים ב-JavaScript (צריך headless browser, יקר פי ~10-50)?" },
    { en: "What do we store — raw HTML for re-processing, or only extracted text and links?",
      he: "מה שומרים — HTML גולמי לעיבוד מחדש, או רק טקסט ולינקים שחולצו?" },
    { en: "How fresh? News homepages every few minutes, the long tail every few months?",
      he: "כמה טרי? דפי בית של אתרי חדשות כל כמה דקות, וה-long tail כל כמה חודשים?" }
  ],
  functional: [
    { en: "Fetch pages starting from seed URLs, extract links, and add new URLs to the frontier.",
      he: "להוריד דפים החל מ-seed URLs, לחלץ לינקים ולהוסיף URLs חדשים ל-frontier." },
    { en: "Obey robots.txt (Disallow, Crawl-delay) and limit concurrency per host.",
      he: "לציית ל-robots.txt ‏(Disallow, ‏Crawl-delay) ולהגביל מקביליות לכל host." },
    { en: "Skip already-seen URLs and near-duplicate content.",
      he: "לדלג על URLs שכבר נראו ועל תוכן כמעט-כפול." },
    { en: "Store raw pages + metadata and publish them for the indexing pipeline; schedule recrawls by change rate and importance.",
      he: "לשמור דפים גולמיים + metadata ולפרסם אותם ל-pipeline של האינדוקס; לתזמן recrawls לפי קצב שינוי וחשיבות." }
  ],
  nonFunctional: [
    { en: "Throughput: ~400 pages/s sustained, ~1,000 pages/s peak, scaling horizontally.",
      he: "Throughput: ‏~400 דפים בשנייה באופן רציף, ‏~1,000 ב-peak, עם scale אופקי." },
    { en: "Politeness is a hard requirement: never more than ~1 request/s to a host by default — getting blocked or causing an outage at a small site is a failure.",
      he: "Politeness היא דרישה קשיחה: כברירת מחדל לא יותר מ-~1 בקשה בשנייה ל-host — להיחסם או להפיל אתר קטן זה כישלון." },
    { en: "Robust to bad input: malformed HTML, infinite URL spaces, slow servers, huge files.",
      he: "עמידות לקלט רע: HTML שבור, מרחבי URL אינסופיים, שרתים איטיים, קבצים ענקיים." },
    { en: "Fault tolerant: a worker crash must not lose the frontier or refetch everything.",
      he: "Fault tolerant: קריסה של worker לא מאבדת את ה-frontier ולא גורמת להוריד הכל מחדש." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Fetch rate</strong>: 1B pages ÷ (30 × 86,400 s) ≈ <strong>~400 pages/s</strong>; plan for 1,000/s peak.</li>
<li><strong>Bandwidth</strong>: average HTML page ~100 KB uncompressed (~30 KB on the wire with gzip/br). 400 × 100 KB = 40 MB/s ≈ <strong>320 Mbps</strong> decoded, ~100 Mbps on the wire. Cheap.</li>
<li><strong>Storage</strong>: 1B × 100 KB = <strong>100 TB/month</strong> raw; compressed (~4:1) ≈ <strong>25 TB/month</strong> in object storage. Keep the last 2-3 versions → ~75 TB.</li>
<li><strong>URL-seen set</strong>: 10B URLs. Exact set of 8-byte fingerprints = 80 GB; a Bloom filter at 1% false positives needs ~9.6 bits/URL ≈ <strong>12 GB</strong> — fits in RAM, sharded by host hash.</li>
<li><strong>Concurrency</strong>: each fetch takes ~0.5-2 s (DNS + TCP + TLS + slow servers). 1,000 pages/s × ~1.5 s ≈ <strong>1,500 connections in flight</strong>. With async I/O, one worker holds ~500 → a handful of fetchers; parsing (~5-10 ms CPU per page) needs ~10 vCPU. Run ~20 workers for headroom and isolation.</li>
<li><strong>Politeness limit</strong>: at 1 req/s per host, 1,000 pages/s needs ≥1,000 different hosts active at once — the frontier must interleave hosts, never drain one site.</li>
</ul>`,
    he: `<ul>
<li><strong>קצב הורדה</strong>: ‏1B דפים ÷ ‏(30 × 86,400 שניות) ≈ <strong>~400 דפים בשנייה</strong>; מתכננים ל-1,000 בשנייה ב-peak.</li>
<li><strong>רוחב פס</strong>: דף HTML ממוצע ~100KB לא דחוס (~30KB על הקו עם gzip או br). ‏400 × 100KB = ‏40MB/s ≈ <strong>320Mbps</strong> אחרי פענוח, ‏~100Mbps על הקו. זול.</li>
<li><strong>אחסון</strong>: ‏1B × 100KB = <strong>100TB בחודש</strong> גולמי; דחוס (~4:1) ≈ <strong>25TB בחודש</strong> ב-object storage. שומרים 2-3 גרסאות אחרונות → ‏~75TB.</li>
<li><strong>URL-seen set</strong>: ‏10B URLs. סט מדויק של fingerprints של 8 בייט = ‏80GB; ‏Bloom filter עם 1% false positives צריך ~9.6 ביט ל-URL ≈ <strong>12GB</strong> — נכנס ל-RAM, מחולק ל-shards לפי hash של ה-host.</li>
<li><strong>מקביליות</strong>: כל הורדה לוקחת ~0.5-2 שניות (DNS + TCP + TLS + שרתים איטיים). ‏1,000 דפים בשנייה × ~1.5 שניות ≈ <strong>1,500 חיבורים פתוחים במקביל</strong>. עם async I/O, ‏worker אחד מחזיק ~500 → מספיקים כמה fetchers; ‏parsing ‏(~5-10ms CPU לדף) צריך ~10 vCPU. מריצים ~20 workers בשביל מרווח ובידוד.</li>
<li><strong>מגבלת politeness</strong>: ב-1 בקשה בשנייה ל-host, ‏1,000 דפים בשנייה דורשים לפחות 1,000 hosts שונים פעילים בו-זמנית — ה-frontier חייב לשזור hosts ולעולם לא לרוקן אתר אחד.</li>
</ul>`
  },
  api: `Internal services, no public API:

Frontier service (gRPC):
  Enqueue(urls[], source_url, depth, priority_hint)          -> accepted_count
  Lease(worker_id, max=100) -> [{url, host, not_before_ms, lease_id}]   (lease 60 s)
  Complete(lease_id, status: OK|NOT_MODIFIED|ERROR|ROBOTS_DENIED, http_code, content_hash)

Fetcher HTTP behaviour:
  GET /path HTTP/1.1
  User-Agent: ExampleBot/1.0 (+https://example.com/bot)
  If-None-Match: "etag-from-last-crawl"     If-Modified-Since: <last fetch date>
  Accept-Encoding: gzip, br
  -> 200 (store) | 304 (just reschedule) | 429/503 (back off this host, honor Retry-After)

Output: Kafka topic crawl.pages {url, fetched_at, http_code, s3_key, simhash, outlinks_count}`,
  dataModel: `url_state (Bigtable/Cassandra, row key = reversed host + path, e.g. "com.example.www/a/b"):
  {url, last_fetch, last_change, http_code, etag, content_hash, simhash,
   change_rate_estimate, importance (PageRank-ish), next_fetch_at, fail_count}

host_state (in frontier memory, persisted):
  {host, robots_txt, robots_fetched_at, crawl_delay_s, next_allowed_at,
   ip, dns_expires_at, error_rate, max_concurrency}

URL-seen filter: sharded Bloom filters (~12 GB total) + url_state as the exact fallback
Content fingerprints: simhash index (64-bit, split into 4 x 16-bit bands for lookup)
Raw pages: s3://crawl/2026/11/14/<shard>/<warc-file>.warc.gz   (WARC format, ~1 GB files)`,
  diagram: `   Seeds + sitemaps + recrawl scheduler
                 |
                 v
   +----------------------------- URL Frontier -----------------------------+
   |  Front queues (by priority: 1..N)  -->  router  -->  Back queues       |
   |                                          (one queue per host,          |
   |                                           min-heap on next_allowed_at)  |
   +----------------------------------+-------------------------------------+
                                      | Lease(url) when host is due
                                      v
   Fetcher workers (async I/O, ~500 conns each)
      | DNS cache (local resolver, TTL-respecting)   | robots.txt cache (24 h)
      v
   Internet  -->  response  --> size/time limits, decompress
                                      |
                                      v
   Parser: extract text + links, canonicalize URLs, compute SimHash
      |                       |                                   |
      | raw page              | new links                         | page event
      v                       v                                   v
   S3 (WARC)          URL filter: normalize -> Bloom "seen?"    Kafka crawl.pages
                      -> trap rules -> Enqueue to frontier       -> indexer, link graph`,
  deepDives: [
    {
      h: { en: "The URL frontier: priority and politeness together", he: "ה-URL frontier: עדיפות ו-politeness ביחד" },
      body: {
        en: `<p>A single FIFO queue fails twice: it crawls in discovery order (spam before Wikipedia) and it hammers one host because links cluster by site. The classic <strong>Mercator design</strong> splits the frontier in two:</p>
<ul>
<li><strong>Front queues = priority.</strong> A prioritizer assigns each URL to one of N queues by importance (PageRank estimate, domain quality, change rate, depth). Workers pull from higher-priority queues more often (weighted random).</li>
<li><strong>Back queues = politeness.</strong> Each back queue holds URLs of exactly <em>one host</em>. A min-heap keyed by <code>next_allowed_at</code> tells you which host may be fetched next. After a fetch, set <code>next_allowed_at = now + max(crawl_delay, 10 × last_fetch_time)</code> — slow servers automatically get fewer requests.</li>
<li><strong>Distribute by host</strong>: partition the frontier by <code>hash(host)</code> so a host's politeness state lives on exactly one frontier shard; no cross-node coordination is needed for rate limiting. Consider grouping by IP too — thousands of hosts on one shared server should share a budget.</li>
<li><strong>Persistence</strong>: the frontier holds billions of URLs; keep only the head of each queue in memory and spill the rest to disk/KV. Workers <strong>lease</strong> URLs (60 s); an unacknowledged lease returns to the queue, so a crashed worker loses nothing.</li>
</ul>`,
        he: `<p>Queue ‏FIFO אחד נכשל פעמיים: הוא עושה crawl לפי סדר הגילוי (ספאם לפני ויקיפדיה) והוא מפציץ host אחד, כי לינקים מתקבצים לפי אתר. <strong>תכנון Mercator</strong> הקלאסי מפצל את ה-frontier לשניים:</p>
<ul>
<li><strong>Front queues = עדיפות.</strong> Prioritizer משייך כל URL לאחד מ-N queues לפי חשיבות (הערכת PageRank, איכות הדומיין, קצב שינוי, עומק). ה-workers מושכים מ-queues בעדיפות גבוהה לעתים קרובות יותר (רנדומלי משוקלל).</li>
<li><strong>Back queues = politeness.</strong> כל back queue מחזיק URLs של <em>host אחד בדיוק</em>. Min-heap לפי <code>next_allowed_at</code> אומר איזה host מותר להוריד הבא. אחרי הורדה קובעים <code>next_allowed_at = now + max(crawl_delay, 10 × last_fetch_time)</code> — שרתים איטיים מקבלים אוטומטית פחות בקשות.</li>
<li><strong>פיזור לפי host</strong>: מחלקים את ה-frontier לפי <code>hash(host)</code> כך שה-state של politeness של host יושב ב-shard אחד בדיוק; לא צריך תיאום בין nodes בשביל rate limiting. כדאי לקבץ גם לפי IP — אלפי hosts על שרת משותף אחד צריכים לחלוק תקציב.</li>
<li><strong>שמירה</strong>: ה-frontier מחזיק מיליארדי URLs; שומרים בזיכרון רק את הראש של כל queue ואת השאר מעבירים לדיסק או ל-KV. ה-workers מקבלים <strong>lease</strong> על URLs ‏(60 שניות); ‏lease שלא אושר חוזר ל-queue, כך ש-worker שקרס לא מאבד כלום.</li>
</ul>`
      }
    },
    {
      h: { en: "Dedup: Bloom filter for URLs, SimHash for content", he: "Dedup: ‏Bloom filter ל-URLs, ‏SimHash לתוכן" },
      body: {
        en: `<ul>
<li><strong>Normalize first</strong>: lowercase scheme and host, drop default ports and <code>#fragments</code>, resolve <code>../</code>, sort query params, strip tracking params (<code>utm_*</code>, <code>fbclid</code>), honor <code>&lt;link rel="canonical"&gt;</code>. Without this, one page appears under dozens of URLs.</li>
<li><strong>URL-seen test</strong>: a Bloom filter answers "definitely new" or "probably seen" with no false negatives. A 1% false-positive rate means 1% of genuinely new URLs are skipped — acceptable for a search crawl (they'll likely be discovered again via other links); for an archive, confirm positives against <code>url_state</code>.</li>
<li><strong>Exact content dup</strong>: hash the normalized body (SHA-256 or a 64-bit xxHash); identical mirrors are collapsed to one canonical URL.</li>
<li><strong>Near-dup</strong>: pages that differ only by a date, ad block or session ID. <strong>SimHash</strong> turns the page's shingles into a 64-bit fingerprint where similar documents differ in few bits; Google's classic threshold is <strong>Hamming distance ≤ 3</strong>. To find candidates fast, split the 64 bits into 4 bands of 16: two fingerprints within distance 3 must match exactly on at least one band (pigeonhole), so index each band.</li>
<li>304 Not Modified via <code>ETag</code>/<code>If-Modified-Since</code> saves the download entirely for unchanged pages.</li>
</ul>`,
        he: `<ul>
<li><strong>קודם לנרמל</strong>: lowercase ל-scheme ול-host, הסרת ports ברירת מחדל ו-<code>#fragments</code>, פתרון של <code>../</code>, מיון query params, הסרת פרמטרי מעקב (<code>utm_*</code>, ‏<code>fbclid</code>), וכיבוד של <code>&lt;link rel="canonical"&gt;</code>. בלי זה, דף אחד מופיע תחת עשרות URLs.</li>
<li><strong>בדיקת URL-seen</strong>: ‏Bloom filter עונה "בטוח חדש" או "כנראה נראה" בלי false negatives. שיעור false positive של 1% אומר ש-1% מה-URLs החדשים באמת ידולגו — מקובל ל-crawl של חיפוש (כנראה יתגלו שוב דרך לינקים אחרים); לארכיון, מאמתים positives מול <code>url_state</code>.</li>
<li><strong>כפילות תוכן מדויקת</strong>: עושים hash ל-body המנורמל (SHA-256 או xxHash של 64 ביט); mirrors זהים מתאחדים ל-URL קנוני אחד.</li>
<li><strong>כמעט-כפילות</strong>: דפים שנבדלים רק בתאריך, בבלוק פרסומות או ב-session ID. <strong>SimHash</strong> הופך את ה-shingles של הדף ל-fingerprint של 64 ביט שבו מסמכים דומים נבדלים במעט ביטים; הסף הקלאסי של Google הוא <strong>Hamming distance של עד 3</strong>. כדי למצוא מועמדים מהר מחלקים את 64 הביטים ל-4 רצועות של 16: שני fingerprints במרחק עד 3 חייבים להיות זהים לפחות ברצועה אחת (עקרון שובך היונים), אז מאנדקסים כל רצועה.</li>
<li>‏304 Not Modified בעזרת <code>ETag</code> או <code>If-Modified-Since</code> חוסך את כל ההורדה לדפים שלא השתנו.</li>
</ul>`
      }
    },
    {
      h: { en: "robots.txt, DNS and the fetcher's survival kit", he: "robots.txt, ‏DNS וערכת ההישרדות של ה-fetcher" },
      body: {
        en: `<ul>
<li><strong>robots.txt</strong>: fetch once per host, cache ~24 h, match the most specific User-agent group. A 4xx means "no restrictions"; a 5xx or timeout means "assume full disallow" for a while (RFC 9309). Respect <code>Crawl-delay</code> and sitemaps as URL sources.</li>
<li><strong>DNS is a hidden bottleneck</strong>: 1,000 fetches/s across many hosts means hundreds of lookups/s; public resolvers rate-limit you and each lookup adds 20-200 ms. Run a local caching resolver (Unbound) per worker node, respect TTLs with a floor (~5 min), and resolve ahead for hosts whose queue will become due.</li>
<li><strong>Timeouts and limits</strong>: connect 5 s, total 30 s, max body 10 MB (truncate), max redirects 5, only accept <code>text/html</code> and allowed types. One slow host must never hold a worker thread — async I/O everywhere.</li>
<li><strong>Back off on signals</strong>: 429/503 → exponential backoff for that host and honor <code>Retry-After</code>; rising error rate → halve its concurrency.</li>
<li><strong>Identify yourself</strong>: a clear User-Agent with a contact URL, published IP ranges, and a reverse-DNS name so admins can verify you instead of blocking you.</li>
</ul>`,
        he: `<ul>
<li><strong>robots.txt</strong>: מורידים פעם אחת לכל host, שומרים ב-cache ל-~24 שעות, ומתאימים לקבוצת User-agent הכי ספציפית. 4xx אומר "אין הגבלות"; ‏5xx או timeout אומר "להניח Disallow מלא" לזמן מה (RFC 9309). מכבדים את <code>Crawl-delay</code> ומשתמשים ב-sitemaps כמקור ל-URLs.</li>
<li><strong>DNS הוא צוואר בקבוק נסתר</strong>: ‏1,000 הורדות בשנייה על הרבה hosts זה מאות lookups בשנייה; resolvers ציבוריים יגבילו אותך וכל lookup מוסיף 20-200ms. מריצים caching resolver מקומי (Unbound) בכל worker node, מכבדים TTLs עם רצפה (~5 דקות), ועושים resolve מראש ל-hosts שה-queue שלהם עומד להגיע לתורו.</li>
<li><strong>Timeouts ומגבלות</strong>: connect של 5 שניות, סה"כ 30 שניות, ‏body מקסימלי 10MB (חותכים), עד 5 redirects, ומקבלים רק <code>text/html</code> וסוגים מאושרים. ‏host איטי אחד לעולם לא מחזיק thread של worker — ‏async I/O בכל מקום.</li>
<li><strong>Backoff לפי סימנים</strong>: ‏429 או 503 → exponential backoff ל-host הזה וכיבוד של <code>Retry-After</code>; שיעור שגיאות עולה → חוצים את המקביליות שלו.</li>
<li><strong>להזדהות</strong>: ‏User-Agent ברור עם URL ליצירת קשר, טווחי IP מפורסמים ושם reverse-DNS, כדי שאדמינים יוכלו לאמת אותך במקום לחסום.</li>
</ul>`
      }
    },
    {
      h: { en: "Recrawl scheduling and crawler traps", he: "תזמון recrawl ומלכודות crawler" },
      body: {
        en: `<p><strong>Recrawl</strong>: with 10B known URLs and 1B fetches/month you can only revisit 10% per month, so spend the budget where it matters. Estimate each page's change rate λ from history (changed k of the last n visits — a Poisson model), and set the next interval ≈ 1/λ, clamped between 5 minutes (news homepages) and 6 months, weighted by importance. Sitemaps with <code>lastmod</code> and push signals (IndexNow, RSS/WebSub) beat guessing.</p>
<p><strong>Traps</strong> are infinite URL spaces, accidental or malicious:</p>
<ul>
<li>Calendars (<code>/calendar?month=2026-12</code> → next → next… forever), faceted search combinations, session IDs in paths, <code>/a/b/a/b/a/b/</code> loops from relative links.</li>
<li><strong>Defenses</strong>: max URL length (~2,000 chars), max path depth (~15), repeated path segments rule, per-host page budget scaled by host importance (e.g. 1,000 pages for an unknown domain), and stop expanding a host whose new pages are mostly near-duplicates by SimHash.</li>
</ul>`,
        he: `<p><strong>Recrawl</strong>: עם 10B URLs ידועים ו-1B הורדות בחודש אפשר לבקר מחדש רק ב-10% בחודש, אז משקיעים את התקציב איפה שזה חשוב. מעריכים לכל דף קצב שינוי λ מההיסטוריה (השתנה k מתוך n הביקורים האחרונים — מודל Poisson), וקובעים את המרווח הבא ≈ ‏1/λ, חתוך בין 5 דקות (דפי בית של חדשות) ל-6 חודשים, ומשוקלל לפי חשיבות. ‏Sitemaps עם <code>lastmod</code> ו-push signals ‏(IndexNow, ‏RSS או WebSub) עדיפים על ניחוש.</p>
<p><strong>מלכודות</strong> הן מרחבי URL אינסופיים, בטעות או בכוונה:</p>
<ul>
<li>לוחות שנה (<code>/calendar?month=2026-12</code> → הבא → הבא… לנצח), צירופים של faceted search, ‏session IDs בתוך ה-path, ולולאות <code>/a/b/a/b/a/b/</code> מלינקים יחסיים.</li>
<li><strong>הגנות</strong>: אורך URL מקסימלי (~2,000 תווים), עומק path מקסימלי (~15), חוק נגד segments חוזרים ב-path, תקציב דפים לכל host לפי חשיבות ה-host (למשל 1,000 דפים לדומיין לא מוכר), ועצירת התרחבות ב-host שרוב הדפים החדשים שלו הם כמעט-כפילויות לפי SimHash.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Bloom filter vs exact URL store: 12 GB in RAM vs 80+ GB on disk lookups, at the cost of skipping ~1% of new URLs.",
      he: "Bloom filter מול אחסון URLs מדויק: ‏12GB ב-RAM מול 80GB ומעלה עם lookups בדיסק, במחיר דילוג על ~1% מה-URLs החדשים." },
    { en: "Breadth (discover new sites) vs freshness (recrawl known important pages): one fixed fetch budget split between the two.",
      he: "רוחב (לגלות אתרים חדשים) מול טריות (recrawl לדפים חשובים ידועים): תקציב הורדות קבוע אחד שמתחלק בין השניים." },
    { en: "Rendering JavaScript gets SPA content but costs ~10-50× more CPU per page; render only hosts whose raw HTML is near-empty.",
      he: "רינדור JavaScript מביא תוכן של SPA אבל עולה פי ~10-50 יותר CPU לדף; מרנדרים רק hosts שה-HTML הגולמי שלהם כמעט ריק." },
    { en: "Partition by host keeps politeness local and simple, but a few giant hosts (wikipedia.org) create hot shards — split their queues by path prefix with a shared rate budget.",
      he: "חלוקה לפי host שומרת על politeness מקומי ופשוט, אבל כמה hosts ענקיים (wikipedia.org) יוצרים shards חמים — מפצלים את ה-queues שלהם לפי prefix של path עם תקציב קצב משותף." }
  ],
  followUps: [
    { q: { en: "A site owner complains you're overloading their server. What happened and what do you change?",
           he: "בעל אתר מתלונן שאתה מעמיס על השרת שלו. מה קרה ומה משנים?" },
      a: { en: "Usually many hostnames (shop.example.com, img.example.com, thousands of customer subdomains) resolve to the same IP, and politeness was enforced per hostname only. Enforce a second budget per IP / per registered domain (eTLD+1), adapt to response time (slower responses → longer delay), and offer a self-service crawl-rate setting. Short term: pause the domain immediately.",
           he: "בדרך כלל הרבה hostnames ‏(shop.example.com, ‏img.example.com, אלפי subdomains של לקוחות) מצביעים לאותו IP, וה-politeness נאכף רק לפי hostname. אוכפים תקציב שני לכל IP או לכל דומיין רשום (eTLD+1), מתאימים לזמן התגובה (תגובות איטיות → השהיה ארוכה יותר), ומציעים הגדרת קצב crawl בשירות עצמי. בטווח הקצר: עוצרים מיד את הדומיין." } },
    { q: { en: "How do you scale the URL-seen Bloom filter past one machine and survive restarts?",
           he: "איך מגדילים את ה-Bloom filter של URL-seen מעבר למכונה אחת ושורדים restarts?" },
      a: { en: "Shard it by hash(host) together with the frontier, so the check is local to the frontier node that will enqueue the URL. Snapshot each shard to disk periodically and replay URLs enqueued since the snapshot from the frontier log. When a shard nears its design capacity (false-positive rate climbing), add a new, larger filter layer (scalable Bloom filter) rather than rebuilding.",
           he: "מחלקים אותו ל-shards לפי hash(host) יחד עם ה-frontier, כך שהבדיקה מקומית ל-frontier node שיכניס את ה-URL. שומרים snapshot של כל shard לדיסק מדי פעם, ועושים replay מה-log של ה-frontier ל-URLs שנכנסו מאז ה-snapshot. כש-shard מתקרב לקיבולת שתוכננה (שיעור ה-false positives מטפס), מוסיפים שכבת filter חדשה וגדולה יותר (scalable Bloom filter) במקום לבנות מחדש." } },
    { q: { en: "How would you prioritize which never-seen URLs to crawl first?",
           he: "איך היית מתעדף אילו URLs שעוד לא נראו להוריד קודם?" },
      a: { en: "Score at enqueue time with cheap signals: importance of the linking page and its host, number of distinct inlinks seen so far, URL shape (short, no query string), whether it's in a sitemap, and host-level quality from past crawls. Periodically recompute PageRank on the link graph offline and feed it back into priorities.",
           he: "נותנים score בזמן ההכנסה ל-queue עם signals זולים: חשיבות הדף המקשר וה-host שלו, מספר inlinks שונים שנראו עד עכשיו, צורת ה-URL (קצר, בלי query string), האם הוא מופיע ב-sitemap, ואיכות ברמת host מ-crawls קודמים. מדי פעם מחשבים מחדש PageRank על גרף הלינקים offline ומזינים אותו חזרה לעדיפויות." } }
  ],
  related: ["algo-similarity-dedup", "pr-checksums-hashing", "net-dns", "net-dns-operations", "pr-rate-limiters", "arch-queues"]
});

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-ticket-booking", icon: "🎟️", level: 3,
  title: { en: "Design a ticket booking system (Ticketmaster)", he: "תכנון מערכת הזמנת כרטיסים (Ticketmaster)" },
  prompt: {
    en: "Design ticket sales for big events: a stadium show with 50,000 reserved seats goes on sale at 10:00 and 2 million fans arrive in the first minutes. Users pick specific seats, hold them while paying, and no seat may ever be sold twice.",
    he: "תתכנן מכירת כרטיסים לאירועים גדולים: הופעה באצטדיון עם 50,000 מקומות מסומנים נפתחת למכירה ב-10:00 ו-2 מיליון מעריצים מגיעים בדקות הראשונות. המשתמשים בוחרים מקומות ספציפיים, מחזיקים אותם בזמן התשלום, ואף מקום לא יכול להימכר פעמיים."
  },
  clarify: [
    { en: "Reserved seating (pick seat 14 in row F) or general admission (just a count per section)? It changes the contention model completely.",
      he: "מקומות מסומנים (בוחרים כיסא 14 בשורה F) או כניסה כללית (רק כמות לכל אזור)? זה משנה לגמרי את מודל ה-contention." },
    { en: "Peak: how many users at on-sale and how many seats? (assume 2M users in 10 minutes, 50K seats, max 6 tickets per order)",
      he: "Peak: כמה משתמשים בפתיחת המכירה וכמה מקומות? (נניח 2M משתמשים ב-10 דקות, ‏50K מקומות, עד 6 כרטיסים להזמנה)" },
    { en: "How long may a user hold seats while paying? (assume 8 minutes, then they're released)",
      he: "כמה זמן משתמש יכול להחזיק מקומות בזמן התשלום? (נניח 8 דקות, ואז הם משתחררים)" },
    { en: "Fairness: first-come-first-served, randomized queue for everyone who arrived before 10:00, presale codes, verified fans?",
      he: "הוגנות: מי שבא ראשון, תור אקראי לכל מי שהגיע לפני 10:00, קודי presale, ‏verified fans?" },
    { en: "Payment provider: external (Stripe/Adyen) with its own latency and failure modes? 3-D Secure redirects?",
      he: "ספק תשלומים: חיצוני (Stripe או Adyen) עם latency ומצבי כשל משלו? ‏redirects של 3-D Secure?" },
    { en: "Resale and dynamic pricing in scope, or only primary sales?",
      he: "Resale ו-dynamic pricing בתוך ה-scope, או רק מכירה ראשונית?" }
  ],
  functional: [
    { en: "Browse events and see a live seat map with availability.",
      he: "לעיין באירועים ולראות מפת מקומות חיה עם זמינות." },
    { en: "Hold up to 6 seats for 8 minutes; holds expire automatically if payment doesn't complete.",
      he: "להחזיק עד 6 מקומות ל-8 דקות; ההחזקות פגות אוטומטית אם התשלום לא הושלם." },
    { en: "Pay and confirm the order exactly once, then issue tickets (QR / mobile wallet).",
      he: "לשלם ולאשר את ההזמנה בדיוק פעם אחת, ואז להנפיק כרטיסים (QR או mobile wallet)." },
    { en: "Virtual waiting room that admits users at a controlled rate during on-sales.",
      he: "חדר המתנה וירטואלי שמכניס משתמשים בקצב מבוקר בזמן פתיחת מכירות." }
  ],
  nonFunctional: [
    { en: "Zero overselling: seat inventory is strongly consistent; availability on the map may be seconds stale.",
      he: "אפס overselling: מלאי המקומות strongly consistent; הזמינות במפה יכולה להיות כמה שניות מאחור." },
    { en: "Survive a 100× flash crowd without the core booking path falling over — shed load at the edge, not in the database.",
      he: "לשרוד flash crowd של פי 100 בלי שנתיב ההזמנה המרכזי יקרוס — מורידים עומס ב-edge, לא ב-database." },
    { en: "Hold/confirm p99 under 500 ms (excluding the payment provider).",
      he: "Hold ו-confirm ב-p99 מתחת ל-500ms (לא כולל ספק התשלומים)." },
    { en: "Fair and bot-resistant; every payment idempotent and auditable.",
      he: "הוגן ועמיד ל-bots; כל תשלום אידמפוטנטי וניתן לביקורת." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Arrival</strong>: 2M users in ~10 minutes ≈ <strong>3,300 new users/s</strong>, with the first minute much higher (~20K/s as everyone refreshes at 10:00:00).</li>
<li><strong>Demand vs supply</strong>: 50K seats ÷ ~3.5 tickets/order ≈ <strong>~14K orders</strong> can ever succeed. 2M users chasing 14K orders → >99% will leave empty-handed; the system's job is to say so quickly and fairly, not to let 2M people hammer the seat DB.</li>
<li><strong>Admission rate</strong>: a checkout takes ~3-5 minutes. To keep ~5K users in the "picking seats" stage at once, admit ~<strong>1,000-2,000 users/minute</strong>. The event sells out in roughly 15-30 minutes; the queue tells everyone else their position and estimated wait.</li>
<li><strong>Seat map reads</strong>: 5K admitted users refreshing every ~3 s ≈ 1.7K req/s for the map — trivial if served from a cached availability bitmap: 50K seats × 2 bits (free/held/sold) ≈ <strong>12.5 KB per event</strong>.</li>
<li><strong>Hold writes</strong>: ~14K successful holds + several times as many conflicts ≈ <strong>~100-300 hold attempts/s</strong> at peak, concentrated on the best sections — the hot spot is a few thousand rows.</li>
<li><strong>Queue state</strong>: 2M entries × ~100 B ≈ 200 MB — fits in a Redis sorted set; the waiting-room page itself is static and served from the CDN.</li>
</ul>`,
    he: `<ul>
<li><strong>הגעה</strong>: ‏2M משתמשים ב-~10 דקות ≈ <strong>3,300 משתמשים חדשים בשנייה</strong>, ובדקה הראשונה הרבה יותר (~20K בשנייה כשכולם עושים refresh ב-10:00:00).</li>
<li><strong>ביקוש מול היצע</strong>: ‏50K מקומות ÷ ‏~3.5 כרטיסים להזמנה ≈ <strong>~14K הזמנות</strong> בלבד יכולות להצליח. ‏2M משתמשים שרודפים אחרי 14K הזמנות → יותר מ-99% יצאו בידיים ריקות; התפקיד של המערכת הוא להגיד את זה מהר ובהוגנות, לא לתת ל-2M אנשים להפציץ את ה-DB של המקומות.</li>
<li><strong>קצב הכנסה</strong>: checkout לוקח ~3-5 דקות. כדי להחזיק ~5K משתמשים בשלב "בחירת מקומות" בו-זמנית, מכניסים ~<strong>1,000-2,000 משתמשים בדקה</strong>. האירוע נמכר בערך תוך 15-30 דקות; התור אומר לכל השאר את המיקום שלהם וזמן המתנה משוער.</li>
<li><strong>קריאות של מפת המקומות</strong>: ‏5K משתמשים שהוכנסו ועושים refresh כל ~3 שניות ≈ ‏1.7K בקשות בשנייה למפה — זניח אם מגישים מ-bitmap זמינות ב-cache: ‏50K מקומות × 2 ביט (פנוי, מוחזק, נמכר) ≈ <strong>12.5KB לאירוע</strong>.</li>
<li><strong>כתיבות hold</strong>: ‏~14K holds מוצלחים ועוד פי כמה התנגשויות ≈ <strong>~100-300 ניסיונות hold בשנייה</strong> ב-peak, מרוכזים באזורים הטובים — ה-hot spot הוא כמה אלפי שורות.</li>
<li><strong>State של התור</strong>: ‏2M רשומות × ~100B ≈ ‏200MB — נכנס ל-sorted set של Redis; דף חדר ההמתנה עצמו סטטי ומוגש מה-CDN.</li>
</ul>`
  },
  api: `Waiting room (edge):
  POST /v1/events/{event_id}/queue            -> 202 {queue_token, position: 183402, eta_s: 1260}
  GET  /v1/queue/{queue_token}                -> 200 {position, eta_s} | 200 {admitted: true, access_token (JWT, 15 min, event-scoped)}

Booking (requires access_token):
  GET  /v1/events/{event_id}/seatmap          -> 200 {version: 88123, bitmap: "base64...", prices_by_section}
  POST /v1/events/{event_id}/holds   {seat_ids: ["F-14","F-15"]}
       Idempotency-Key: 7b1e...
       -> 201 {hold_id, seat_ids, expires_at}   | 409 {unavailable: ["F-15"]}
  DELETE /v1/holds/{hold_id}                  -> 204   (user gives up, seats released immediately)
  POST /v1/holds/{hold_id}/checkout  {payment_method_token}
       Idempotency-Key: c4a9...
       -> 202 {order_id, status: "PAYMENT_PENDING", redirect_url?}   (3-D Secure)
  GET  /v1/orders/{order_id}                  -> 200 {status: CONFIRMED|FAILED|EXPIRED, tickets: [...]}

Webhook from payment provider:
  POST /v1/payments/webhook  {provider_payment_id, status: "succeeded", metadata: {order_id}}`,
  dataModel: `Postgres (inventory, one logical DB per event shard; strongly consistent):
  seats(event_id, seat_id, section, row, number, price_tier,
        status ENUM(available, held, sold), hold_id NULL, hold_expires_at NULL, order_id NULL,
        version INT, PRIMARY KEY (event_id, seat_id))
  holds(hold_id PK, event_id, user_id, seat_ids[], expires_at, status ENUM(active, converted, expired, released))
  orders(order_id PK, hold_id UNIQUE, user_id, amount, currency, status, idempotency_key UNIQUE, created_at)
  payments(payment_id PK, order_id, provider, provider_payment_id UNIQUE, status, raw_event JSONB)
  outbox(id, aggregate_id, type, payload, created_at, published_at)     -- tickets, emails, seat-map updates

Redis:
  queue:{event_id}       ZSET  queue_token -> random score (or arrival ts)
  admitted:{event_id}    counter + rate controller state
  seatmap:{event_id}     bitmap (2 bits/seat) + version, rebuilt from DB changes`,
  diagram: `   2M browsers
       |
       v
   CDN / WAF / bot management -----> static waiting-room page
       |
       v
   Queue service (Redis ZSET) -- admits N users/min --> signs access_token (JWT)
       |
       |  only admitted users pass the gateway (token checked at edge)
       v
   API gateway (rate limit per user/IP/token)
       |
       +--> Seat map service --> Redis bitmap (version) <-- CDC/outbox updates
       |
       +--> Booking service --(conditional UPDATE in one txn)--> Postgres (inventory,
       |         |                                              sharded by event_id)
       |         +--> Hold expiry worker (every 5 s: release expired holds)
       |
       +--> Checkout/Order service --> Payment provider (Stripe/Adyen)
                 |       ^                  | webhook
                 |       +------------------+
                 v
             outbox -> Kafka -> ticket issuer, email, analytics, seat-map updater`,
  deepDives: [
    {
      h: { en: "Overselling prevention: holds as conditional updates", he: "מניעת overselling: ‏holds כ-conditional updates" },
      body: {
        en: `<p>The core invariant: a seat moves <code>available → held → sold</code>, and only one hold can win. Do it in the <strong>database, atomically</strong>, not with a read-then-write in application code (two requests both read "available" and both write "held" — the classic race).</p>
<pre>BEGIN;
UPDATE seats
   SET status='held', hold_id=$hold, hold_expires_at=now()+interval '8 minutes', version=version+1
 WHERE event_id=$e AND seat_id = ANY($seats)
   AND (status='available' OR (status='held' AND hold_expires_at &lt; now()));
-- rows affected must equal the number of seats requested
-- if fewer: ROLLBACK and return 409 with the seats that weren't free
INSERT INTO holds(...) VALUES (...);
COMMIT;</pre>
<ul>
<li><strong>All-or-nothing</strong>: a group of 4 adjacent seats either all get held or none — the rollback guarantees it.</li>
<li><strong>Lazy expiry</strong> is built into the WHERE clause (an expired hold is as good as available), so correctness doesn't depend on the expiry worker; the worker just makes the seat map accurate sooner.</li>
<li><strong>Confirm</strong> is another conditional update: <code>SET status='sold', order_id=$o WHERE hold_id=$hold AND status='held'</code>. If the hold expired and someone else grabbed the seat, 0 rows → refund the payment automatically.</li>
<li><strong>Why not Redis locks only?</strong> <code>SET seat NX PX 480000</code> is fast and a good front filter, but Redis failover can lose recent writes; the DB conditional update stays the source of truth. Use Redis to reject obvious conflicts before they touch Postgres.</li>
<li><strong>Contention</strong>: ~300 hold attempts/s on one event is comfortable for a single Postgres primary (row locks are per seat, transactions take ~2-5 ms). Shard by <code>event_id</code> so one mega on-sale doesn't hurt other events.</li>
</ul>`,
        he: `<p>ה-invariant המרכזי: מקום עובר <code>available → held → sold</code>, ורק hold אחד יכול לנצח. עושים את זה <strong>ב-database, באופן אטומי</strong>, ולא עם קריאה-ואז-כתיבה בקוד האפליקציה (שתי בקשות קוראות "available" ושתיהן כותבות "held" — ה-race הקלאסי).</p>
<pre>BEGIN;
UPDATE seats
   SET status='held', hold_id=$hold, hold_expires_at=now()+interval '8 minutes', version=version+1
 WHERE event_id=$e AND seat_id = ANY($seats)
   AND (status='available' OR (status='held' AND hold_expires_at &lt; now()));
-- rows affected must equal the number of seats requested
-- if fewer: ROLLBACK and return 409 with the seats that weren't free
INSERT INTO holds(...) VALUES (...);
COMMIT;</pre>
<ul>
<li><strong>הכל או כלום</strong>: קבוצה של 4 מקומות צמודים או שכולם מוחזקים או שאף אחד — ה-rollback מבטיח את זה.</li>
<li><strong>תפוגה עצלה</strong> בנויה לתוך ה-WHERE (hold שפג שווה למקום פנוי), כך שהנכונות לא תלויה ב-worker של התפוגה; ה-worker רק מעדכן את מפת המקומות מהר יותר.</li>
<li><strong>אישור</strong> הוא עוד conditional update: <code>SET status='sold', order_id=$o WHERE hold_id=$hold AND status='held'</code>. אם ה-hold פג ומישהו אחר תפס את המקום, ‏0 שורות → מחזירים את הכסף אוטומטית.</li>
<li><strong>למה לא רק locks ב-Redis?</strong> <code>SET seat NX PX 480000</code> מהיר וטוב כמסנן קדמי, אבל failover של Redis יכול לאבד כתיבות אחרונות; ה-conditional update ב-DB נשאר ה-source of truth. משתמשים ב-Redis כדי לדחות התנגשויות ברורות לפני שהן נוגעות ב-Postgres.</li>
<li><strong>Contention</strong>: ‏~300 ניסיונות hold בשנייה על אירוע אחד זה נוח ל-primary יחיד של Postgres (ה-row locks הם לכל מקום, טרנזקציה לוקחת ~2-5ms). מחלקים לפי <code>event_id</code> כדי שמכירה ענקית אחת לא תפגע באירועים אחרים.</li>
</ul>`
      }
    },
    {
      h: { en: "Virtual waiting room: shed load before it reaches you", he: "חדר המתנה וירטואלי: להוריד עומס לפני שהוא מגיע אליך" },
      body: {
        en: `<p>You cannot scale the seat inventory to 2M concurrent users — and you don't need to, because only ~14K orders can succeed. The waiting room converts a spike into a controlled flow:</p>
<ul>
<li><strong>Before on-sale</strong>: users who arrive early get a queue token; at 10:00 all of them get a <strong>random position</strong> (fairer than "who refreshed at 09:59:59.9", and it kills the incentive to hammer refresh). Late arrivals go to the back in arrival order.</li>
<li><strong>The queue page is static</strong> (CDN), polling <code>GET /queue/{token}</code> every 15-30 s with jitter. 2M users ÷ 20 s ≈ 100K req/s of tiny Redis lookups — or push position updates via SSE to cut polling.</li>
<li><strong>Admission control</strong>: a controller admits N users per minute and adjusts N from downstream health (booking p99, DB CPU, active checkouts). Admitted users get a <strong>signed, event-scoped JWT</strong> valid ~15 minutes; the gateway rejects booking calls without it, so bypassing the queue is impossible.</li>
<li><strong>Stop early</strong>: when remaining inventory (including active holds that may still expire) reaches zero, tell the queue "sold out — held seats may free up" instead of keeping 1.5M people waiting for nothing.</li>
<li>Managed options exist: Cloudflare Waiting Room, Queue-it, AWS virtual waiting room solution.</li>
</ul>`,
        he: `<p>אי אפשר לעשות scale למלאי המקומות ל-2M משתמשים במקביל — וגם לא צריך, כי רק ~14K הזמנות יכולות להצליח. חדר ההמתנה הופך spike לזרימה מבוקרת:</p>
<ul>
<li><strong>לפני פתיחת המכירה</strong>: משתמשים שמגיעים מוקדם מקבלים queue token; ב-10:00 כולם מקבלים <strong>מיקום אקראי</strong> (הוגן יותר מ"מי עשה refresh ב-09:59:59.9", וזה מבטל את התמריץ להפציץ refresh). מאחרים נכנסים לסוף התור לפי סדר הגעה.</li>
<li><strong>דף התור סטטי</strong> ‏(CDN), ועושה polling ל-<code>GET /queue/{token}</code> כל 15-30 שניות עם jitter. ‏2M משתמשים ÷ 20 שניות ≈ ‏100K בקשות בשנייה של lookups זעירים ב-Redis — או דוחפים עדכוני מיקום דרך SSE כדי לחסוך polling.</li>
<li><strong>Admission control</strong>: controller מכניס N משתמשים בדקה ומתאים את N לפי הבריאות למטה (p99 של ההזמנות, CPU של ה-DB, ‏checkouts פעילים). משתמשים שהוכנסו מקבלים <strong>JWT חתום ומוגבל לאירוע</strong> לכ-15 דקות; ה-gateway דוחה קריאות הזמנה בלעדיו, כך שאי אפשר לעקוף את התור.</li>
<li><strong>לעצור מוקדם</strong>: כשהמלאי שנשאר (כולל holds פעילים שעוד עלולים לפוג) מגיע לאפס, אומרים לתור "sold out — מקומות מוחזקים עשויים להשתחרר" במקום להשאיר 1.5M אנשים לחכות לשום דבר.</li>
<li>קיימות אפשרויות managed: ‏Cloudflare Waiting Room, ‏Queue-it, ופתרון ה-virtual waiting room של AWS.</li>
</ul>`
      }
    },
    {
      h: { en: "Idempotent payment and the hold-expires-during-payment race", he: "תשלום אידמפוטנטי וה-race של hold שפג באמצע תשלום" },
      body: {
        en: `<ul>
<li><strong>Idempotency keys end to end</strong>: the client sends an <code>Idempotency-Key</code> on checkout; the order row has a UNIQUE constraint on it, and the same key is passed to Stripe/Adyen. A double click or a retry after timeout returns the same order and never charges twice.</li>
<li><strong>Authorize, then capture</strong>: authorize the card (reserves funds), confirm the seats with the conditional update, then capture. If the seat confirm fails (hold expired and seat taken), void the authorization — the user is never charged for a seat they didn't get.</li>
<li><strong>Extend the hold on payment start</strong>: when checkout begins, extend <code>hold_expires_at</code> by a few minutes (once) so a slow 3-D Secure flow doesn't lose the race. Hard cap it so holds can't be kept forever.</li>
<li><strong>Webhooks are the truth</strong>: the browser may close after paying. The provider's webhook (deduped by <code>provider_payment_id</code> UNIQUE) drives the order to CONFIRMED; a reconciliation job queries the provider for orders stuck in PAYMENT_PENDING for more than 15 minutes.</li>
<li><strong>Side effects via outbox</strong>: the confirm transaction writes an outbox row; a relay publishes "order confirmed" to Kafka for ticket issuance and email. No "DB committed but email lost" or "email sent but DB rolled back".</li>
</ul>`,
        he: `<ul>
<li><strong>Idempotency keys מקצה לקצה</strong>: ה-client שולח <code>Idempotency-Key</code> ב-checkout; לשורת ההזמנה יש עליו UNIQUE constraint, ואותו מפתח עובר ל-Stripe או Adyen. דאבל-קליק או retry אחרי timeout מחזירים את אותה הזמנה ולעולם לא מחייבים פעמיים.</li>
<li><strong>Authorize ואז capture</strong>: עושים authorize לכרטיס (שמירת הסכום), מאשרים את המקומות עם ה-conditional update, ואז capture. אם אישור המקום נכשל (ה-hold פג והמקום נתפס), מבטלים את ה-authorization — המשתמש לעולם לא מחויב על מקום שלא קיבל.</li>
<li><strong>להאריך את ה-hold בתחילת התשלום</strong>: כשה-checkout מתחיל, מאריכים את <code>hold_expires_at</code> בכמה דקות (פעם אחת) כדי ש-flow איטי של 3-D Secure לא יפסיד ב-race. שמים תקרה קשיחה כדי שאי אפשר יהיה להחזיק holds לנצח.</li>
<li><strong>ה-webhooks הם האמת</strong>: הדפדפן יכול להיסגר אחרי התשלום. ה-webhook של הספק (עם dedup לפי <code>provider_payment_id</code> UNIQUE) מקדם את ההזמנה ל-CONFIRMED; ‏job של reconciliation שואל את הספק על הזמנות שתקועות ב-PAYMENT_PENDING יותר מ-15 דקות.</li>
<li><strong>Side effects דרך outbox</strong>: טרנזקציית האישור כותבת שורת outbox; ‏relay מפרסם "order confirmed" ל-Kafka בשביל הנפקת כרטיסים ומייל. אין "ה-DB עשה commit אבל המייל אבד" או "המייל נשלח אבל ה-DB עשה rollback".</li>
</ul>`
      }
    },
    {
      h: { en: "Bots and scalpers", he: "Bots ו-scalpers" },
      body: {
        en: `<p>For hot events, the majority of early traffic can be bots. Layer defenses, cheapest first:</p>
<ul>
<li><strong>Edge</strong>: WAF + bot management (TLS/JA4 fingerprints, header order, IP reputation, datacenter ASNs), and a challenge (CAPTCHA/Turnstile) to enter the queue — not at checkout, where it hurts real users most.</li>
<li><strong>Identity</strong>: one queue token per verified account (phone-verified, account age, purchase history); "verified fan" presale registration days before, with lottery invites.</li>
<li><strong>Limits</strong>: max 6 tickets per account and per payment card per event; rate limits per account, device and card BIN; detect many accounts sharing one card or address.</li>
<li><strong>Make resale less profitable</strong>: non-transferable or rotating mobile tickets (QR changes every 15-30 s), official resale with price caps.</li>
</ul>`,
        he: `<p>באירועים חמים, רוב התנועה המוקדמת יכולה להיות bots. בונים שכבות הגנה, מהזולה ליקרה:</p>
<ul>
<li><strong>Edge</strong>: ‏WAF + bot management ‏(fingerprints של TLS או JA4, סדר headers, מוניטין IP, ‏ASNs של datacenters), ו-challenge ‏(CAPTCHA או Turnstile) בכניסה לתור — לא ב-checkout, שם הוא פוגע הכי הרבה במשתמשים אמיתיים.</li>
<li><strong>זהות</strong>: queue token אחד לכל חשבון מאומת (אימות טלפון, גיל החשבון, היסטוריית רכישות); הרשמת "verified fan" ל-presale ימים לפני, עם הזמנות בהגרלה.</li>
<li><strong>מגבלות</strong>: עד 6 כרטיסים לחשבון ולכרטיס אשראי לכל אירוע; ‏rate limits לכל חשבון, מכשיר ו-BIN של כרטיס; זיהוי הרבה חשבונות שחולקים כרטיס או כתובת.</li>
<li><strong>להפוך resale לפחות רווחי</strong>: כרטיסים לא ניתנים להעברה או כרטיסי מובייל מתחלפים (ה-QR משתנה כל 15-30 שניות), ו-resale רשמי עם תקרת מחיר.</li>
</ul>`
      }
    },
    {
      h: { en: "Seat map at scale and hot sections", he: "מפת מקומות ב-scale ואזורים חמים" },
      body: {
        en: `<ul>
<li><strong>Read path off the DB</strong>: keep a 2-bit-per-seat bitmap in Redis with a version number, updated from the outbox/CDC stream (~100 ms behind). Clients fetch the bitmap (12.5 KB, cacheable for 1-2 s) and apply deltas pushed over SSE/WebSocket. A stale map just means a hold returns 409 — correctness lives in the DB.</li>
<li><strong>Hot sections</strong>: everyone wants the front rows, so most holds collide there. Offer "best available" (the server picks seats in a section) instead of pure pick-your-seat during the first minutes — it spreads load and cuts 409 loops. Pick seats with <code>FOR UPDATE SKIP LOCKED</code> so concurrent requests take different seats instead of waiting on each other.</li>
<li><strong>General admission</strong> is easier: a counter per section, decremented with <code>UPDATE sections SET remaining = remaining - $n WHERE remaining &gt;= $n</code>, or pre-split the count into several sub-counters to avoid one hot row.</li>
</ul>`,
        he: `<ul>
<li><strong>להוריד את נתיב הקריאה מה-DB</strong>: מחזיקים ב-Redis ‏bitmap של 2 ביט למקום עם מספר גרסה, שמתעדכן מה-stream של outbox או CDC ‏(~100ms מאחור). ה-clients מביאים את ה-bitmap ‏(12.5KB, ניתן ל-cache לשנייה-שתיים) ומחילים deltas שנדחפים דרך SSE או WebSocket. מפה לא עדכנית רק אומרת ש-hold יחזיר 409 — הנכונות נמצאת ב-DB.</li>
<li><strong>אזורים חמים</strong>: כולם רוצים את השורות הראשונות, אז רוב ה-holds מתנגשים שם. בדקות הראשונות מציעים "best available" (השרת בוחר מקומות באזור) במקום בחירה חופשית — זה מפזר עומס ומקצר לולאות של 409. בוחרים מקומות עם <code>FOR UPDATE SKIP LOCKED</code> כדי שבקשות מקבילות ייקחו מקומות שונים במקום לחכות אחת לשנייה.</li>
<li><strong>כניסה כללית</strong> קלה יותר: counter לכל אזור, שיורד עם <code>UPDATE sections SET remaining = remaining - $n WHERE remaining &gt;= $n</code>, או מפצלים מראש את הכמות לכמה sub-counters כדי להימנע משורה חמה אחת.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Pick-your-seat is what fans want but maximizes contention on the same rows; best-available spreads load and sells out faster with fewer failed holds.",
      he: "בחירת מקום חופשית זה מה שמעריצים רוצים, אבל היא ממקסמת contention על אותן שורות; ‏best-available מפזר עומס ומוכר מהר יותר עם פחות holds שנכשלו." },
    { en: "Longer hold TTL = fewer users losing seats mid-payment, but more seats locked by abandoned carts and by bots; 8 minutes plus one extension is a common middle.",
      he: "TTL ארוך יותר ל-hold = פחות משתמשים שמאבדים מקומות באמצע תשלום, אבל יותר מקומות נעולים על ידי עגלות נטושות ו-bots; ‏8 דקות ועוד הארכה אחת זה אמצע נפוץ." },
    { en: "Random queue positions are fair and stop refresh storms, but feel arbitrary to people who 'came first'; communicate the rule up front.",
      he: "מיקומים אקראיים בתור הוגנים ועוצרים סערות refresh, אבל מרגישים שרירותיים למי ש'הגיע ראשון'; מסבירים את החוק מראש." },
    { en: "Postgres conditional updates give simple, strong correctness at a few hundred writes/s per event; Redis-first holds go faster but need the DB as a backstop anyway.",
      he: "Conditional updates ב-Postgres נותנים נכונות פשוטה וחזקה בכמה מאות כתיבות בשנייה לאירוע; ‏holds שמתחילים ב-Redis מהירים יותר אבל צריכים את ה-DB כגיבוי בכל מקרה." }
  ],
  followUps: [
    { q: { en: "The payment succeeded at the provider but your service crashed before marking the order paid. What now?",
           he: "התשלום הצליח אצל הספק אבל השירות שלך קרס לפני שסימן את ההזמנה כשולמה. מה עכשיו?" },
      a: { en: "The provider's webhook arrives (and is retried for days until you return 2xx), keyed by provider_payment_id. The handler runs the same idempotent confirm: if the hold is still valid or the seat is still ours, mark sold and issue tickets; if the seat was resold after the hold expired, refund automatically and notify the user. A reconciliation job also polls the provider for PAYMENT_PENDING orders older than 15 minutes, so you don't rely on webhooks alone.",
           he: "ה-webhook של הספק מגיע (ונשלח שוב במשך ימים עד שמחזירים 2xx), עם provider_payment_id כמפתח. ה-handler מריץ את אותו confirm אידמפוטנטי: אם ה-hold עדיין תקף או שהמקום עדיין שלנו, מסמנים sold ומנפיקים כרטיסים; אם המקום נמכר שוב אחרי שה-hold פג, מחזירים כסף אוטומטית ומודיעים למשתמש. בנוסף, ‏job של reconciliation שואל את הספק על הזמנות PAYMENT_PENDING ישנות מ-15 דקות, כך שלא סומכים רק על webhooks." } },
    { q: { en: "How do you load-test for an on-sale, and what do you watch during it?",
           he: "איך עושים load test לפתיחת מכירה, ומה מנטרים בזמן אמת?" },
      a: { en: "Replay a synthetic crowd (k6/Locust from many regions) against a staging copy with a real-size venue: 2M queue joins, admission at target rate, realistic seat-picking with collisions on hot rows, and a mocked payment provider with injected latency and failures. During the real on-sale watch admission rate vs booking p99, hold conflict rate, DB CPU and lock waits, active holds vs remaining seats, payment success rate, and queue polling QPS at the edge. The controller lowers admission automatically if booking p99 crosses its threshold.",
           he: "מריצים קהל סינתטי (k6 או Locust מהרבה regions) מול עותק staging עם אולם בגודל אמיתי: ‏2M הצטרפויות לתור, הכנסה בקצב היעד, בחירת מקומות ריאליסטית עם התנגשויות על שורות חמות, וספק תשלומים מדומה עם latency ותקלות מוזרקות. בזמן המכירה האמיתית מנטרים קצב הכנסה מול p99 של ההזמנות, שיעור התנגשויות hold, ‏CPU ו-lock waits ב-DB, ‏holds פעילים מול מקומות שנשארו, שיעור הצלחת תשלומים, ו-QPS של polling לתור ב-edge. ה-controller מוריד את קצב ההכנסה אוטומטית אם ה-p99 של ההזמנות חוצה את הסף." } },
    { q: { en: "How would this work across two regions for availability?",
           he: "איך זה יעבוד על פני שני regions בשביל availability?" },
      a: { en: "Keep each event's inventory single-writer: the event shard has one primary region (usually closest to the venue), with a synchronous or semi-sync replica in another AZ and async replica in the second region. Booking requests from anywhere route to that home region — 100 ms extra RTT is fine for a hold. Multi-master inventory would need conflict resolution that can't avoid double-selling. On regional failure, promote the replica (accepting a few seconds of possibly lost holds, which expire anyway) after verifying no orders were confirmed past the replication point.",
           he: "שומרים על כותב יחיד למלאי של כל אירוע: ל-shard של האירוע יש region ראשי אחד (בדרך כלל הכי קרוב לאולם), עם replica סינכרונית או semi-sync ב-AZ אחר ו-replica אסינכרונית ב-region השני. בקשות הזמנה מכל מקום מנותבות ל-home region הזה — ‏100ms RTT נוספים זה בסדר ל-hold. מלאי multi-master היה דורש conflict resolution שלא יכול למנוע מכירה כפולה. בכשל של region עושים promote ל-replica (ומקבלים כמה שניות של holds שאולי אבדו, שגם ככה פגים) אחרי שמוודאים שאף הזמנה לא אושרה אחרי נקודת השכפול." } },
    { q: { en: "Why not just use SELECT ... FOR UPDATE on the seat rows?",
           he: "למה לא פשוט להשתמש ב-SELECT ... FOR UPDATE על שורות המקומות?" },
      a: { en: "You can, but under heavy contention hundreds of transactions queue on the same hot rows, holding connections and causing lock-wait timeouts and connection-pool exhaustion. A single conditional UPDATE fails fast (0 rows → 409) with no waiting, and SKIP LOCKED for best-available picks free seats without queuing. Keep transactions short and never call the payment provider while holding a row lock.",
           he: "אפשר, אבל תחת contention כבד מאות טרנזקציות עומדות בתור על אותן שורות חמות, מחזיקות connections וגורמות ל-lock-wait timeouts ולמיצוי ה-connection pool. ‏UPDATE מותנה יחיד נכשל מהר (0 שורות → 409) בלי לחכות, ו-SKIP LOCKED ל-best-available בוחר מקומות פנויים בלי לעמוד בתור. שומרים על טרנזקציות קצרות ולעולם לא קוראים לספק התשלומים בזמן שמחזיקים row lock." } }
  ],
  related: ["pr-idempotency", "db-transactions", "pr-race-deadlock", "pr-rate-limiters", "net-ddos-edge", "staff-overload-metastable", "redis-deep"]
});

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-proximity-service", icon: "📍", level: 2,
  title: { en: "Design a proximity service (Yelp nearby + Uber driver matching)", he: "תכנון proximity service ‏(Yelp בסביבה + התאמת נהגים של Uber)" },
  prompt: {
    en: "Design two location features: (1) \"restaurants near me\" over 200M places, and (2) matching a rider to the nearest available driver among 1M online drivers who report their location every 4 seconds.",
    he: "תתכנן שני פיצ'רים מבוססי מיקום: (1) \"מסעדות לידי\" על 200M מקומות, ו-(2) התאמה של נוסע לנהג הזמין הקרוב ביותר מתוך 1M נהגים מחוברים שמדווחים מיקום כל 4 שניות."
  },
  clarify: [
    { en: "Search radius and result shape: fixed radius (500 m - 20 km) or \"k nearest\"? Ranked by distance only, or by rating and relevance too?",
      he: "רדיוס חיפוש וצורת תוצאה: רדיוס קבוע (500 מטר עד 20 ק\"מ) או \"k הקרובים\"? דירוג לפי מרחק בלבד, או גם לפי דירוג ורלוונטיות?" },
    { en: "How often do places change vs drivers move? (places: rarely, edits visible next day is fine; drivers: every 4 s, must be fresh)",
      he: "כמה מקומות משתנים לעומת כמה נהגים זזים? (מקומות: לעתים רחוקות, עדכון שמופיע מחר זה בסדר; נהגים: כל 4 שניות, חייב להיות טרי)" },
    { en: "Scale: place searches QPS and number of online drivers at peak? (assume 20K search QPS, 1M online drivers globally)",
      he: "Scale: כמה QPS של חיפוש מקומות וכמה נהגים מחוברים ב-peak? (נניח 20K QPS של חיפוש, ‏1M נהגים מחוברים בעולם)" },
    { en: "Is \"nearest\" straight-line distance or driving ETA? (for matching, ETA matters — a driver across a river is not close)",
      he: "\"הכי קרוב\" זה מרחק אווירי או ETA בנסיעה? (בהתאמה, ה-ETA קובע — נהג מעבר לנהר הוא לא קרוב)" },
    { en: "Global or per-city? Do trips cross region boundaries?",
      he: "גלובלי או לפי עיר? נסיעות חוצות גבולות בין regions?" }
  ],
  functional: [
    { en: "Search places by location + radius (+ filters: category, open now, price), sorted by distance or relevance.",
      he: "חיפוש מקומות לפי מיקום + רדיוס (+ filters: קטגוריה, פתוח עכשיו, מחיר), ממוין לפי מרחק או רלוונטיות." },
    { en: "Business owners add/update places; changes visible within hours.",
      he: "בעלי עסקים מוסיפים ומעדכנים מקומות; השינויים מופיעים תוך שעות." },
    { en: "Drivers stream location every 4 s; riders see nearby cars on the map.",
      he: "נהגים משדרים מיקום כל 4 שניות; נוסעים רואים מכוניות קרובות על המפה." },
    { en: "Match a ride request to the best available driver and make sure one driver never gets two trips at once.",
      he: "להתאים בקשת נסיעה לנהג הזמין הכי טוב ולוודא שנהג אחד לעולם לא מקבל שתי נסיעות בבת אחת." }
  ],
  nonFunctional: [
    { en: "Place search p99 under 200 ms; read-heavy, highly cacheable.",
      he: "חיפוש מקומות ב-p99 מתחת ל-200ms; ‏read-heavy, ניתן מאוד ל-cache." },
    { en: "Driver locations: ~250K writes/s, data at most a few seconds old; losing a few updates is fine (next one arrives in 4 s).",
      he: "מיקומי נהגים: ‏~250K כתיבות בשנייה, מידע בן כמה שניות לכל היותר; לאבד כמה עדכונים זה בסדר (הבא מגיע בעוד 4 שניות)." },
    { en: "Matching decision under ~1-2 s; strong consistency only for the driver's assignment, not for location.",
      he: "החלטת התאמה תוך ~1-2 שניות; ‏strong consistency רק לשיוך של הנהג, לא למיקום." },
    { en: "A failure in one city must not affect others.",
      he: "תקלה בעיר אחת לא משפיעה על ערים אחרות." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Places data</strong>: 200M places × ~1 KB (name, address, hours, category, rating) ≈ <strong>200 GB</strong> — in a regular DB.</li>
<li><strong>Places geo index</strong>: only (place_id 8 B, cell_id 8 B, lat/lng 8 B) ≈ 24 B + overhead ≈ 50 B × 200M ≈ <strong>10 GB</strong> — fits in RAM on every replica. No sharding needed for the index; replicate for QPS.</li>
<li><strong>Place search load</strong>: 100M DAU × 5 searches ≈ 500M/day ≈ 6K QPS average, <strong>~20K QPS</strong> peak. Each query checks ~9 cells and returns ~20-50 candidates — a few replicas handle it; cache popular areas (city centers) for 1-5 min.</li>
<li><strong>Driver updates</strong>: 1M online drivers ÷ 4 s = <strong>250K writes/s</strong>. Each update ~100 B → 25 MB/s ingest. Current state for all drivers: 1M × ~100 B ≈ <strong>100 MB</strong> — tiny. The challenge is write rate and churn of the index, not size.</li>
<li><strong>Per city</strong>: a large city peaks at ~30-50K online drivers → ~10K writes/s, comfortably one Redis shard (~100K ops/s).</li>
<li><strong>Ride requests</strong>: ~20M trips/day ≈ 230/s average, ~1-2K/s peak. Each triggers one nearby query + ETA calls for ~10-20 candidates.</li>
</ul>`,
    he: `<ul>
<li><strong>נתוני מקומות</strong>: ‏200M מקומות × ~1KB (שם, כתובת, שעות, קטגוריה, דירוג) ≈ <strong>200GB</strong> — ב-DB רגיל.</li>
<li><strong>Geo index של מקומות</strong>: רק (place_id של 8B, ‏cell_id של 8B, ‏lat/lng של 8B) ≈ ‏24B ‏+ overhead ≈ ‏50B × 200M ≈ <strong>10GB</strong> — נכנס ל-RAM בכל replica. לא צריך sharding לאינדקס; משכפלים בשביל QPS.</li>
<li><strong>עומס חיפוש מקומות</strong>: ‏100M DAU × 5 חיפושים ≈ ‏500M ביום ≈ ‏6K QPS בממוצע, <strong>~20K QPS</strong> ב-peak. כל שאילתה בודקת ~9 תאים ומחזירה ~20-50 מועמדים — כמה replicas מטפלים בזה; שומרים ב-cache אזורים פופולריים (מרכזי ערים) ל-1-5 דקות.</li>
<li><strong>עדכוני נהגים</strong>: ‏1M נהגים מחוברים ÷ 4 שניות = <strong>250K כתיבות בשנייה</strong>. כל עדכון ~100B → ‏25MB/s נכנסים. ה-state הנוכחי של כל הנהגים: ‏1M × ~100B ≈ <strong>100MB</strong> — זעיר. האתגר הוא קצב הכתיבה וה-churn של האינדקס, לא הגודל.</li>
<li><strong>לפי עיר</strong>: עיר גדולה מגיעה ב-peak ל-~30-50K נהגים מחוברים → ‏~10K כתיבות בשנייה, נכנס בנוחות ל-shard אחד של Redis ‏(~100K ops/s).</li>
<li><strong>בקשות נסיעה</strong>: ‏~20M נסיעות ביום ≈ ‏230 בשנייה בממוצע, ‏~1-2K בשנייה ב-peak. כל אחת מפעילה שאילתת קרבה אחת + קריאות ETA ל-~10-20 מועמדים.</li>
</ul>`
  },
  api: `Places:
  GET /v1/places/nearby?lat=32.0853&lng=34.7818&radius_m=1000&category=restaurant&open_now=true&limit=20
    -> 200 {results: [{place_id, name, lat, lng, distance_m: 240, rating: 4.6}], next_cursor}
  POST /v1/places            {name, lat, lng, category, hours}  -> 201 {place_id}
  PATCH /v1/places/{id}      {hours: ...}                        -> 200

Drivers (mobile app, every 4 s; batched over a persistent connection):
  WS  /v1/driver/stream   -> {type:"loc", lat, lng, heading, speed, ts, status:"available"}
                          <- {type:"offer", trip_id, pickup, expires_in_s: 15}

Riders:
  GET  /v1/drivers/nearby?lat=..&lng=..   -> 200 {drivers:[{id_hash, lat, lng, heading}]}   (approximate, for the map)
  POST /v1/trips  {pickup, dropoff}  Idempotency-Key: ...  -> 202 {trip_id, status:"MATCHING"}
  GET  /v1/trips/{trip_id}           -> 200 {status: MATCHED, driver, eta_s: 240}`,
  dataModel: `Places (Postgres/MySQL, sharded by place_id if needed; source of truth):
  places(place_id PK, name, lat, lng, category, price_level, hours JSONB, rating, updated_at)

Places geo index (read replicas, in memory; rebuilt nightly + incremental updates):
  cell_to_places: { geohash6 | H3 res 8 cell -> [place_id, lat, lng] }
  or Postgres+PostGIS: GIST index on geography(Point)  /  Elasticsearch geo_point

Driver locations (Redis, one cluster per region, key prefix per city):
  GEOADD drivers:{city}:available lng lat driver_id        (sorted set, geohash-encoded score)
  HSET  driver:{id} lat lng heading status ts  EX 30       (expires if the app goes silent)

Trips (Postgres/Spanner, strongly consistent):
  trips(trip_id PK, rider_id, driver_id NULL, status, pickup, dropoff, created_at)
  driver_assignment(driver_id PK, trip_id, lease_until)    -- one active trip per driver`,
  diagram: `                 PLACES (read-heavy)                              DRIVERS (write-heavy)

   Client --> CDN/cache --> Places API                Driver app --WS--> Location gateway
                              |                                             | (by city)
              +---------------+--------------+                              v
              v                              v                     Kafka: driver.locations
     Geo index replicas (RAM)        Places DB (truth)              (key = driver_id)
     cell -> [place_id]              Postgres + PostGIS               |          |
              ^                              |                        v          v
              |   nightly rebuild +          |                 Location service   analytics,
              +---- CDC updates <------------+                 -> Redis GEO per   ETA models,
                                                                  city (TTL 30 s) surge pricing
                                                                        ^
   Rider app --> Trip service --> Matching service ---- nearby(k-ring) --+
                    |                  |-- ETA service (routing engine, road graph)
                    v                  |-- offer to driver (15 s), lease in trips DB
               Trips DB (strong) <-----+`,
  deepDives: [
    {
      h: { en: "Geohash vs quadtree vs S2/H3", he: "Geohash מול quadtree מול S2 ו-H3" },
      body: {
        en: `<p>All of them turn 2-D "near me" into lookups over a 1-D key or a small set of cells.</p>
<ul>
<li><strong>Geohash</strong>: interleave latitude/longitude bits into a base-32 string; a shared prefix means nearby. 5 chars ≈ 4.9 × 4.9 km, 6 chars ≈ 1.2 × 0.6 km. Works with any sorted store (a B-tree range scan, Redis GEO uses a 52-bit geohash as the ZSET score). Pitfalls: two points 10 m apart across a cell boundary can share no prefix, so always query the cell <strong>plus its 8 neighbors</strong>; cells are distorted near the poles.</li>
<li><strong>Quadtree</strong>: recursively split a square into 4 until each leaf holds ≤ N places (e.g. 100). Adapts to density — Manhattan gets tiny leaves, the Sahara one big one. Great for an in-memory static index (places); awkward for 250K moves/s because points constantly change leaves.</li>
<li><strong>S2 (Google)</strong>: projects the sphere onto a cube and uses a Hilbert curve, giving 64-bit cell IDs at 30 levels with good locality and a "region coverer" that approximates any circle/polygon with a few cells. Used by Google Maps, Foursquare, MongoDB.</li>
<li><strong>H3 (Uber)</strong>: hexagonal grid at 16 resolutions (res 7 ≈ 5.2 km², res 8 ≈ 0.74 km², res 9 ≈ 0.1 km²). Hexagons have 6 equidistant neighbors, which makes "k-ring around me", smoothing and surge-pricing areas clean. Ideal for driver matching and per-area analytics.</li>
</ul>
<p>Interview default: <strong>geohash or PostGIS for places, H3/S2 or Redis GEO for drivers</strong> — and say why.</p>`,
        he: `<p>כולם הופכים "לידי" דו-ממדי ל-lookups על מפתח חד-ממדי או על קבוצה קטנה של תאים.</p>
<ul>
<li><strong>Geohash</strong>: משלבים את הביטים של קו רוחב וקו אורך למחרוזת base-32; ‏prefix משותף אומר קרוב. 5 תווים ≈ ‏4.9 × 4.9 ק"מ, 6 תווים ≈ ‏1.2 × 0.6 ק"מ. עובד עם כל store ממוין (range scan על B-tree; ‏Redis GEO משתמש ב-geohash של 52 ביט כ-score של ה-ZSET). מלכודות: שתי נקודות במרחק 10 מטר משני צדי גבול של תא יכולות לא לחלוק שום prefix, אז תמיד שואלים את התא <strong>ועוד 8 השכנים שלו</strong>; התאים מעוותים ליד הקטבים.</li>
<li><strong>Quadtree</strong>: מפצלים ריבוע ל-4 באופן רקורסיבי עד שכל עלה מחזיק עד N מקומות (למשל 100). מסתגל לצפיפות — מנהטן מקבלת עלים קטנטנים, הסהרה עלה אחד גדול. מצוין לאינדקס סטטי בזיכרון (מקומות); מסורבל ל-250K תזוזות בשנייה כי נקודות מחליפות עלים כל הזמן.</li>
<li><strong>S2 (Google)</strong>: מטיל את הכדור על קובייה ומשתמש ב-Hilbert curve, ונותן cell IDs של 64 ביט ב-30 רמות עם locality טוב ו-"region coverer" שמקרב כל עיגול או פוליגון עם כמה תאים. בשימוש ב-Google Maps, ב-Foursquare וב-MongoDB.</li>
<li><strong>H3 (Uber)</strong>: רשת משושים ב-16 רזולוציות (res 7 ≈ ‏5.2 קמ"ר, ‏res 8 ≈ ‏0.74 קמ"ר, ‏res 9 ≈ ‏0.1 קמ"ר). למשושה יש 6 שכנים במרחק שווה, מה שהופך "k-ring סביבי", החלקה ואזורי surge pricing לנקיים. אידיאלי להתאמת נהגים ולאנליטיקה לפי אזור.</li>
</ul>
<p>ברירת מחדל בראיון: <strong>geohash או PostGIS למקומות, ‏H3 או S2 או Redis GEO לנהגים</strong> — ולהסביר למה.</p>`
      }
    },
    {
      h: { en: "Places: a read-heavy static index", he: "מקומות: אינדקס סטטי ל-read-heavy" },
      body: {
        en: `<ul>
<li><strong>Query</strong>: compute the cell for (lat, lng) at a precision that matches the radius (1 km → geohash 6 / H3 res 8), fetch the cell + neighbors, then compute exact haversine distance on ~50-500 candidates and filter/sort. If too few results, widen to the next coarser level.</li>
<li><strong>Simple option first</strong>: 200M rows in Postgres with PostGIS and a GIST index, queried with <code>ST_DWithin(geog, ST_MakePoint(lng,lat)::geography, 1000)</code>, plus read replicas — handles thousands of QPS. Elasticsearch <code>geo_distance</code> if you also need text search and facets.</li>
<li><strong>Scaling reads</strong>: the index (~10 GB) fits in RAM, so <strong>replicate, don't shard</strong>: N identical stateless replicas behind a load balancer, each loading a nightly snapshot plus a CDC stream of edits.</li>
<li><strong>Cache</strong>: round the query to the cell (not the exact coordinate) so neighbors share cache entries: key = (cell, radius, category, open_now). Popular downtown cells hit ~80%+.</li>
<li><strong>Density</strong>: 1 km in central Tel Aviv may hold 2,000 restaurants and 0 in the Negev — cap candidates per cell and rank, and expand radius adaptively in sparse areas.</li>
</ul>`,
        he: `<ul>
<li><strong>שאילתה</strong>: מחשבים את התא של (lat, lng) ברזולוציה שמתאימה לרדיוס (1 ק"מ → geohash 6 או H3 res 8), מביאים את התא + השכנים, ואז מחשבים מרחק haversine מדויק על ~50-500 מועמדים ומסננים וממיינים. אם יש מעט מדי תוצאות, מרחיבים לרמה הגסה הבאה.</li>
<li><strong>קודם האפשרות הפשוטה</strong>: ‏200M שורות ב-Postgres עם PostGIS ואינדקס GIST, עם שאילתה <code>ST_DWithin(geog, ST_MakePoint(lng,lat)::geography, 1000)</code>, ועוד read replicas — מטפל באלפי QPS. ‏Elasticsearch עם <code>geo_distance</code> אם צריך גם חיפוש טקסט ו-facets.</li>
<li><strong>Scale לקריאות</strong>: האינדקס (~10GB) נכנס ל-RAM, אז <strong>משכפלים, לא עושים sharding</strong>: N replicas זהים ו-stateless מאחורי load balancer, כל אחד טוען snapshot לילי ועוד stream של CDC עם עריכות.</li>
<li><strong>Cache</strong>: מעגלים את השאילתה לתא (ולא לקואורדינטה המדויקת) כדי ששכנים יחלקו רשומות cache: מפתח = (cell, radius, category, open_now). תאים פופולריים במרכז העיר מגיעים ל-80% hit ומעלה.</li>
<li><strong>צפיפות</strong>: קילומטר אחד במרכז תל אביב יכול להכיל 2,000 מסעדות ובנגב אפס — מגבילים מועמדים לכל תא ומדרגים, ומרחיבים רדיוס באופן אדפטיבי באזורים דלילים.</li>
</ul>`
      }
    },
    {
      h: { en: "Drivers: 250K location writes per second", he: "נהגים: ‏250K כתיבות מיקום בשנייה" },
      body: {
        en: `<ul>
<li><strong>Ingest</strong>: drivers keep a WebSocket/gRPC stream to a location gateway (sticky by city). The gateway validates (speed sanity — 300 km/h jumps are GPS glitches or spoofing), then writes the latest location to the city's in-memory store and publishes to Kafka for analytics/ETA training.</li>
<li><strong>Latest-only store</strong>: we need current position, not history, on the hot path. Redis <code>GEOADD drivers:tlv:available</code> overwrites in place (O(log N)), and <code>GEOSEARCH ... BYRADIUS 2 km ASC COUNT 20</code> answers nearby queries. Status change (available → on trip) moves the driver between sets. A <code>driver:{id}</code> hash with a 30 s TTL catches drivers whose app died.</li>
<li><strong>Alternative</strong>: an in-memory service keyed by H3 cell (map cell → set of drivers); on update, if the cell changed, move the driver (~5% of updates). This is roughly what Uber built (Ringpop-sharded services).</li>
<li><strong>Shard by city/region</strong>, not by driver_id: a nearby query must hit one shard. Big cities split into sub-regions by H3 res 4-5 cells; queries near a boundary check two shards.</li>
<li><strong>Durability</strong>: none needed for current location — on a Redis failover you lose ≤ 4 s of state and it refills from the next updates.</li>
</ul>`,
        he: `<ul>
<li><strong>Ingest</strong>: נהגים מחזיקים stream של WebSocket או gRPC מול location gateway ‏(sticky לפי עיר). ה-gateway מוודא תקינות (סבירות מהירות — קפיצות של 300 קמ"ש הן תקלות GPS או זיוף), כותב את המיקום האחרון ל-store בזיכרון של העיר ומפרסם ל-Kafka בשביל אנליטיקה ואימון מודלי ETA.</li>
<li><strong>Store של אחרון בלבד</strong>: בנתיב החם צריך מיקום נוכחי, לא היסטוריה. ‏Redis <code>GEOADD drivers:tlv:available</code> דורס במקום (O(log N)), ו-<code>GEOSEARCH ... BYRADIUS 2 km ASC COUNT 20</code> עונה על שאילתות קרבה. שינוי סטטוס (פנוי → בנסיעה) מעביר את הנהג בין sets. ‏Hash של <code>driver:{id}</code> עם TTL של 30 שניות תופס נהגים שהאפליקציה שלהם מתה.</li>
<li><strong>אלטרנטיבה</strong>: שירות בזיכרון לפי תא H3 ‏(map של תא → set של נהגים); בעדכון, אם התא השתנה, מעבירים את הנהג (~5% מהעדכונים). בערך מה ש-Uber בנו (שירותים עם sharding של Ringpop).</li>
<li><strong>Sharding לפי עיר או region</strong>, לא לפי driver_id: שאילתת קרבה חייבת לפגוע ב-shard אחד. ערים גדולות מתפצלות לתתי-אזורים לפי תאי H3 ברזולוציה 4-5; שאילתות ליד גבול בודקות שני shards.</li>
<li><strong>Durability</strong>: לא צריך למיקום נוכחי — ב-failover של Redis מאבדים עד 4 שניות של state והוא מתמלא מהעדכונים הבאים.</li>
</ul>`
      }
    },
    {
      h: { en: "Matching: from nearest to best, without double dispatch", he: "Matching: מהקרוב ביותר לטוב ביותר, בלי שיבוץ כפול" },
      body: {
        en: `<ol>
<li><strong>Candidates</strong>: k-ring of H3 cells around the pickup (or GEOSEARCH 3 km), filter by status, vehicle type and rating → ~20 drivers.</li>
<li><strong>Rank by ETA, not distance</strong>: call the routing engine (road graph + live traffic) for the ~20 candidates in one batched request (~20-50 ms). Optionally batch-match: collect requests for ~2 s and solve an assignment problem across riders and drivers, which beats greedy at peak.</li>
<li><strong>Offer with a lease</strong>: atomically claim the driver: <code>INSERT INTO driver_assignment(driver_id, trip_id, lease_until) ... ON CONFLICT DO NOTHING</code> (or Redis <code>SET driver:lock:{id} trip NX EX 15</code> backed by the DB). Only the winner sends the offer; the driver has 15 s to accept, otherwise the lease expires and we try the next candidate.</li>
<li><strong>Idempotency</strong>: the trip request carries an Idempotency-Key, so a rider double-tap doesn't create two trips searching for two drivers.</li>
</ol>`,
        he: `<ol>
<li><strong>מועמדים</strong>: ‏k-ring של תאי H3 סביב נקודת האיסוף (או GEOSEARCH של 3 ק"מ), סינון לפי סטטוס, סוג רכב ודירוג → ‏~20 נהגים.</li>
<li><strong>דירוג לפי ETA, לא מרחק</strong>: קוראים ל-routing engine ‏(גרף כבישים + תנועה חיה) עבור ~20 המועמדים בבקשה אחת ב-batch ‏(~20-50ms). אפשר גם batch matching: אוספים בקשות במשך ~2 שניות ופותרים בעיית שיבוץ על פני נוסעים ונהגים, מה שעדיף על greedy ב-peak.</li>
<li><strong>הצעה עם lease</strong>: תופסים את הנהג באופן אטומי: <code>INSERT INTO driver_assignment(driver_id, trip_id, lease_until) ... ON CONFLICT DO NOTHING</code> (או Redis <code>SET driver:lock:{id} trip NX EX 15</code> עם DB מאחור). רק המנצח שולח את ההצעה; לנהג יש 15 שניות לאשר, אחרת ה-lease פג ומנסים את המועמד הבא.</li>
<li><strong>Idempotency</strong>: בקשת הנסיעה נושאת Idempotency-Key, כך שדאבל-טאפ של נוסע לא יוצר שתי נסיעות שמחפשות שני נהגים.</li>
</ol>`
      }
    }
  ],
  tradeoffs: [
    { en: "Geohash in a generic sorted store is simple and portable, but boundary effects force neighbor queries; H3/S2 give better geometry at the cost of a library dependency.",
      he: "Geohash ב-store ממוין גנרי פשוט ונייד, אבל אפקטי גבול מחייבים שאילתות שכנים; ‏H3 או S2 נותנים גיאומטריה טובה יותר במחיר תלות בספרייה." },
    { en: "Places: replicate a small in-memory index everywhere (cheap reads, nightly freshness) vs query the DB live (always fresh, more load).",
      he: "מקומות: לשכפל אינדקס קטן בזיכרון לכל מקום (קריאות זולות, טריות לילית) מול שאילתות חיות ל-DB (תמיד טרי, יותר עומס)." },
    { en: "Update interval: 4 s balances freshness vs battery and 250K writes/s; 1 s would quadruple write load for little matching gain.",
      he: "מרווח עדכון: 4 שניות מאזן בין טריות לבין סוללה ו-250K כתיבות בשנייה; שנייה אחת הייתה מכפילה פי 4 את עומס הכתיבה בשביל רווח קטן בהתאמה." },
    { en: "Greedy nearest-driver matching is simple and fast; batched global assignment lowers average pickup time but adds ~2 s of delay and complexity.",
      he: "התאמה greedy לנהג הקרוב פשוטה ומהירה; שיבוץ גלובלי ב-batch מוריד את זמן האיסוף הממוצע אבל מוסיף ~2 שניות עיכוב ומורכבות." }
  ],
  followUps: [
    { q: { en: "A stadium concert ends and 40K riders request in one H3 cell. What breaks?",
           he: "הופעה באצטדיון נגמרת ו-40K נוסעים מזמינים בתא H3 אחד. מה נשבר?" },
      a: { en: "The hot cell's shard and the matching loop: everyone queries the same few hundred nearby drivers and races for the same leases. Mitigate with batch matching per area (one solver assigns all drivers in the zone instead of 40K racing requests), surge pricing to dampen demand and pull drivers in, designated pickup zones, and rate-limited polling for 'nearby cars'. Pre-scale the city shard when big events are on the calendar.",
           he: "ה-shard של התא החם ולולאת ההתאמה: כולם שואלים את אותם כמה מאות נהגים קרובים ומתחרים על אותם leases. מקלים עם batch matching לפי אזור (solver אחד משבץ את כל הנהגים באזור במקום 40K בקשות מתחרות), ‏surge pricing כדי לרסן ביקוש ולמשוך נהגים, אזורי איסוף ייעודיים, ו-polling מוגבל קצב ל'מכוניות בסביבה'. עושים pre-scale ל-shard של העיר כשיש אירועים גדולים בלוח." } },
    { q: { en: "How do you return \"k nearest\" when the nearest place might be 30 km away?",
           he: "איך מחזירים \"k הקרובים\" כשהמקום הכי קרוב יכול להיות במרחק 30 ק\"מ?" },
      a: { en: "Expanding search: start at a fine level (cell + neighbors), and if fewer than k results, move one level coarser (or grow the H3 k-ring) until you have k candidates or hit a max radius. Then compute exact distances and return the top k — but only after covering a radius at least as large as the k-th distance, otherwise a closer point in an unvisited cell could be missed. PostGIS does this natively with ORDER BY geog &lt;-&gt; point LIMIT k (KNN on the GIST index).",
           he: "חיפוש מתרחב: מתחילים ברמה עדינה (תא + שכנים), ואם יש פחות מ-k תוצאות, עולים רמה אחת גסה יותר (או מגדילים את ה-k-ring של H3) עד שיש k מועמדים או שמגיעים לרדיוס מקסימלי. ואז מחשבים מרחקים מדויקים ומחזירים את ה-k הראשונים — אבל רק אחרי שכיסית רדיוס לפחות כמו המרחק ה-k, אחרת נקודה קרובה יותר בתא שלא ביקרת בו עלולה להתפספס. ‏PostGIS עושה את זה באופן מובנה עם ORDER BY geog &lt;-&gt; point LIMIT k ‏(KNN על אינדקס GIST)." } },
    { q: { en: "How do you protect driver privacy on the rider's 'cars nearby' map?",
           he: "איך מגינים על הפרטיות של נהגים במפת 'מכוניות בסביבה' של הנוסע?" },
      a: { en: "Never return driver IDs or exact positions before a match: return rotating anonymous IDs, positions snapped or jittered by ~100 m, a capped count, and rate-limit the endpoint per rider so it can't be used to track a specific driver over time. Exact location is shared only between matched rider and driver for the trip's duration.",
           he: "לעולם לא מחזירים מזהי נהגים או מיקומים מדויקים לפני התאמה: מחזירים מזהים אנונימיים מתחלפים, מיקומים מעוגלים או עם jitter של ~100 מטר, כמות מוגבלת, ועושים rate limit ל-endpoint לכל נוסע כדי שאי אפשר יהיה להשתמש בו כדי לעקוב אחרי נהג ספציפי לאורך זמן. מיקום מדויק משותף רק בין הנוסע לנהג שהותאמו, למשך הנסיעה." } }
  ],
  related: ["db-index-kinds", "redis-deep", "db-sharding", "db-partitioning", "staff-cells-blast-radius", "pr-realtime-protocols", "pr-idempotency"]
});

/* ------------------------------------------------------------------ */
INFRA.designs.push({
  id: "sd-collab-docs", icon: "📝", level: 3,
  title: { en: "Design collaborative document editing (Google Docs)", he: "תכנון עריכת מסמכים שיתופית (Google Docs)" },
  prompt: {
    en: "Design a Google Docs-style editor: many users edit the same document at the same time, see each other's cursors and changes within ~100-200 ms, keep working offline, and can browse and restore version history.",
    he: "תתכנן עורך בסגנון Google Docs: הרבה משתמשים עורכים את אותו מסמך בו-זמנית, רואים את הסמנים והשינויים של האחרים תוך ~100-200ms, ממשיכים לעבוד offline, ויכולים לעיין בהיסטוריית גרסאות ולשחזר."
  },
  clarify: [
    { en: "Rich text only, or also spreadsheets/slides/embedded objects? (assume rich text with formatting, tables and images)",
      he: "רק rich text, או גם spreadsheets, מצגות ואובייקטים מוטמעים? (נניח rich text עם עיצוב, טבלאות ותמונות)" },
    { en: "How many concurrent editors per document? (typical 1-5, hard cap ~100 editors, more as viewers)",
      he: "כמה עורכים במקביל למסמך? (בדרך כלל 1-5, תקרה קשיחה של ~100 עורכים, השאר כצופים)" },
    { en: "Scale: active users and documents open at peak? (assume 50M DAU, 3M concurrent editors, ~1M documents being edited at once)",
      he: "Scale: כמה משתמשים פעילים וכמה מסמכים פתוחים ב-peak? (נניח 50M DAU, ‏3M עורכים במקביל, ‏~1M מסמכים בעריכה בו-זמנית)" },
    { en: "Offline: minutes in a tunnel, or days on a plane with large divergent edits?",
      he: "Offline: כמה דקות במנהרה, או ימים בטיסה עם עריכות גדולות שמתפצלות?" },
    { en: "Permissions granularity: owner/editor/commenter/viewer per document? Link sharing? Enterprise data residency?",
      he: "רמת הרשאות: owner, ‏editor, ‏commenter, ‏viewer לכל מסמך? שיתוף לפי לינק? דרישות data residency של ארגונים?" }
  ],
  functional: [
    { en: "Real-time concurrent editing; all replicas converge to the same document, preserving each user's intent.",
      he: "עריכה מקבילה בזמן אמת; כל העותקים מתכנסים לאותו מסמך תוך שמירה על הכוונה של כל משתמש." },
    { en: "Presence: who's in the doc, live cursors and selections.",
      he: "Presence: מי במסמך, סמנים ובחירות בזמן אמת." },
    { en: "Offline editing that merges on reconnect.",
      he: "עריכה offline שמתמזגת בחיבור מחדש." },
    { en: "Version history (named versions, restore) and comments.",
      he: "היסטוריית גרסאות (גרסאות עם שם, שחזור) ותגובות." },
    { en: "Sharing and permissions enforced on every operation.",
      he: "שיתוף והרשאות שנאכפים על כל פעולה." }
  ],
  nonFunctional: [
    { en: "Local edits apply instantly (0 ms, optimistic); remote edits visible within ~200 ms p95 in the same region.",
      he: "עריכות מקומיות מוחלות מיד (0ms, אופטימי); עריכות של אחרים מופיעות תוך ~200ms ב-p95 באותו region." },
    { en: "Never lose an acknowledged edit (durable op log before ack).",
      he: "לעולם לא לאבד עריכה שאושרה (op log ‏durable לפני ack)." },
    { en: "Convergence guaranteed despite reordering, retries and offline divergence.",
      he: "התכנסות מובטחת למרות שינויי סדר, ‏retries והתפצלות offline." },
    { en: "Millions of long-lived connections; a server failure reconnects users in seconds without data loss.",
      he: "מיליוני חיבורים ארוכים; נפילת שרת מחברת משתמשים מחדש תוך שניות בלי איבוד מידע." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Connections</strong>: 3M concurrent editors + viewers ≈ 4M WebSockets. At ~50K connections per gateway node (memory ~20-40 KB each) → ~80 nodes; run <strong>~120</strong> across regions for headroom and failover.</li>
<li><strong>Operations</strong>: a typing user produces ~5 keystrokes/s, but clients batch into one op every ~100-200 ms, and most open sessions are idle → average ~0.3 ops/s per editor → <strong>~1M ops/s</strong> at peak across ~1M active docs (≈1 op/s per doc; a busy doc with 20 typists sees ~100 ops/s).</li>
<li><strong>Op size</strong>: ~100-300 B with metadata → ~200 MB/s into the op log at peak.</li>
<li><strong>Op storage</strong>: average ~300K ops/s × 86,400 ≈ 26B ops/day × 200 B ≈ <strong>5 TB/day</strong> raw. Snapshot every ~1,000 ops or 5 minutes; compact old fine-grained ops into coarser history checkpoints after 30 days → long-term growth well under 1 TB/day.</li>
<li><strong>Documents</strong>: ~5B documents × ~10 KB average compressed snapshot ≈ <strong>~50 TB</strong> of current snapshots (history and op logs add several times that) — in object storage, with metadata in a sharded DB. The hot set (docs opened this week) is a tiny fraction.</li>
<li><strong>Fan-out</strong>: each op goes to the other N-1 editors of that doc; with avg 2-3 per doc, outbound ≈ 2× inbound ≈ 2M messages/s.</li>
</ul>`,
    he: `<ul>
<li><strong>חיבורים</strong>: ‏3M עורכים במקביל + צופים ≈ ‏4M WebSockets. ב-~50K חיבורים ל-gateway node ‏(זיכרון של ~20-40KB לכל אחד) → ‏~80 nodes; מריצים <strong>~120</strong> על פני regions בשביל מרווח ו-failover.</li>
<li><strong>פעולות</strong>: משתמש שמקליד מייצר ~5 הקשות בשנייה, אבל ה-clients מקבצים לפעולה אחת כל ~100-200ms, ורוב הסשנים הפתוחים במנוחה → ממוצע של ~0.3 פעולות בשנייה לעורך → <strong>~1M פעולות בשנייה</strong> ב-peak על פני ~1M מסמכים פעילים (≈ פעולה אחת בשנייה למסמך; מסמך עמוס עם 20 מקלידים רואה ~100 פעולות בשנייה).</li>
<li><strong>גודל פעולה</strong>: ‏~100-300B עם metadata → ‏~200MB/s ל-op log ב-peak.</li>
<li><strong>אחסון פעולות</strong>: ממוצע של ~300K פעולות בשנייה × 86,400 ≈ ‏26B פעולות ביום × 200B ≈ <strong>5TB ביום</strong> גולמי. עושים snapshot כל ~1,000 פעולות או 5 דקות; אחרי 30 יום דוחסים פעולות עדינות ישנות ל-checkpoints גסים יותר של היסטוריה → הגדילה לטווח ארוך הרבה מתחת ל-1TB ביום.</li>
<li><strong>מסמכים</strong>: ‏~5B מסמכים × ~10KB בממוצע אחרי דחיסה ≈ <strong>~50TB</strong> של snapshots נוכחיים (היסטוריה ו-op logs מוסיפים פי כמה) — ב-object storage, עם metadata ב-DB מחולק ל-shards. ה-hot set (מסמכים שנפתחו השבוע) הוא חלק קטנטן.</li>
<li><strong>Fan-out</strong>: כל פעולה נשלחת ל-N-1 העורכים האחרים של המסמך; עם ממוצע של 2-3 למסמך, היוצא ≈ פי 2 מהנכנס ≈ ‏2M הודעות בשנייה.</li>
</ul>`
  },
  api: `REST:
  POST /v1/docs                         {title}            -> 201 {doc_id}
  GET  /v1/docs/{id}                    -> 200 {snapshot, revision: 18234, permissions}
  GET  /v1/docs/{id}/history?before=18234&limit=50  -> 200 {versions:[{revision, author, ts, name?}]}
  POST /v1/docs/{id}/restore            {revision: 17000}  -> 200 {new_revision: 18235}
  PUT  /v1/docs/{id}/acl                {principal, role: "editor|commenter|viewer"}

WebSocket  wss://collab.example.com/v1/docs/{id}/session   (auth: short-lived token, doc-scoped)
  client -> {type:"op", client_id, client_seq: 42, base_rev: 18234, ops:[{retain:120},{insert:"hello"},{retain:300}]}
  server -> {type:"ack", client_seq: 42, rev: 18235}
  server -> {type:"op", rev: 18236, author, ops:[...]}            (others' ops, already transformed)
  client -> {type:"presence", cursor:{anchor:..., head:...}}       (ephemeral, not persisted)
  server -> {type:"presence", users:[{user, color, cursor}]}
  client -> {type:"resync", from_rev: 18100}                       (after reconnect)`,
  dataModel: `Doc metadata (Spanner / sharded Postgres, by doc_id):
  docs(doc_id PK, owner_id, title, created_at, latest_rev, latest_snapshot_rev, region)
  acl(doc_id, principal, role, PRIMARY KEY(doc_id, principal))

Op log (Bigtable / Cassandra, row key = doc_id + rev, append-only):
  ops(doc_id, rev, author_id, client_id, client_seq, ops_blob, ts)
  UNIQUE (doc_id, client_id, client_seq)      -- dedup client retries

Snapshots (object storage):
  s3://docs/{doc_id}/snap/{rev}.bin.zst      every ~1,000 ops or 5 min
Named versions:
  versions(doc_id, rev, name, created_by, created_at)

Session routing (etcd / Redis with leases):
  doc_owner:{doc_id} -> {server_id, lease_until}     one authoritative doc server per active doc
Presence: in memory on the doc server only (lost on failover — that's fine)`,
  diagram: `   Browser A        Browser B        Browser C (offline queue)
       \\               |               /
        \\  WebSocket   |              /
         v             v             v
       Edge / L7 LB (TLS, routes by doc_id -> owning doc server)
                       |
         +-------------+--------------+
         |   Collab gateway nodes      |  hold sockets, auth, presence fan-out
         +-------------+--------------+
                       | (doc_id -> owner lookup, cached)
                       v
         Doc server (owner of doc 123, single writer, in-memory doc + pending ops)
           | 1. check ACL   2. transform op against concurrent ops (OT)
           | 3. assign rev  4. append to op log  5. ack sender + broadcast
           v
    Op log (Bigtable/Cassandra) ----> Snapshotter (every 1K ops) ----> S3 snapshots
           |
           +--> Kafka: doc.changes -> search indexing, notifications, audit, history UI

    Coordination: etcd leases "doc_owner:{id}" ; Metadata + ACLs: Spanner/Postgres`,
  deepDives: [
    {
      h: { en: "OT vs CRDT: how concurrent edits converge", he: "OT מול CRDT: איך עריכות מקבילות מתכנסות" },
      body: {
        en: `<p>Alice inserts "X" at position 5 while Bob deletes position 2. Applied naively in different orders, their copies diverge. Two families solve it:</p>
<ul>
<li><strong>Operational Transformation (OT)</strong> — Google Docs, Etherpad. Ops are position-based (<code>insert "X" @5</code>). A <strong>central server</strong> orders all ops; when an op arrives based on an older revision, the server <em>transforms</em> it against the ops it missed (Bob's delete shifts Alice's insert to position 4). Clients transform their pending local ops against incoming ones. Simple data, small ops, but correctness depends on the server serializing per document, and transform functions for rich text/tables are notoriously tricky.</li>
<li><strong>CRDTs</strong> — Figma (CRDT-inspired), Yjs, Automerge, Apple Notes. Every character gets a unique, ordered ID (e.g. (lamport, site_id)); inserts reference neighbors' IDs, deletes leave tombstones. Merges are commutative and idempotent, so <strong>any order, any path</strong> converges — no central sequencer required, which makes offline and peer-to-peer natural. Cost: metadata per character (modern CRDTs like Yjs compress to ~1-3 bytes/char overhead on typical text), tombstones that need garbage collection, and harder rich-text semantics.</li>
</ul>
<p>Interview answer: <strong>server-authoritative OT</strong> (or a CRDT used through a central server) is the pragmatic choice for a Docs-like product with a server always in the loop; pick a CRDT when offline-first or P2P is a core requirement. Either way the server still assigns a revision order for history and permissions.</p>`,
        he: `<p>אליס מכניסה "X" במיקום 5 בזמן שבוב מוחק את מיקום 2. אם מחילים בתמימות בסדרים שונים, העותקים מתפצלים. שתי משפחות פותרות את זה:</p>
<ul>
<li><strong>Operational Transformation ‏(OT)</strong> — ‏Google Docs, ‏Etherpad. הפעולות מבוססות מיקום (<code>insert "X" @5</code>). <strong>שרת מרכזי</strong> מסדר את כל הפעולות; כשמגיעה פעולה שמבוססת על revision ישן, השרת <em>מבצע לה transform</em> מול הפעולות שהיא פספסה (המחיקה של בוב מזיזה את ההכנסה של אליס למיקום 4). ה-clients עושים transform לפעולות המקומיות שלהם שממתינות מול אלה שנכנסות. מידע פשוט, פעולות קטנות, אבל הנכונות תלויה בכך שהשרת עושה serialization לכל מסמך, ופונקציות transform ל-rich text ולטבלאות ידועות כמסובכות.</li>
<li><strong>CRDTs</strong> — ‏Figma (בהשראת CRDT), ‏Yjs, ‏Automerge, ‏Apple Notes. כל תו מקבל מזהה ייחודי ומסודר (למשל (lamport, site_id)); הכנסות מפנות למזהים של השכנים, ומחיקות משאירות tombstones. המיזוגים קומוטטיביים ואידמפוטנטיים, אז <strong>כל סדר וכל מסלול</strong> מתכנסים — בלי צורך ב-sequencer מרכזי, מה שהופך offline ו-peer-to-peer לטבעיים. המחיר: metadata לכל תו (CRDTs מודרניים כמו Yjs דוחסים ל-~1-3 בייט overhead לתו בטקסט רגיל), ‏tombstones שצריכים garbage collection, וסמנטיקה קשה יותר ל-rich text.</li>
</ul>
<p>תשובה לראיון: <strong>OT עם שרת סמכותי</strong> (או CRDT שעובר דרך שרת מרכזי) זו הבחירה הפרגמטית למוצר בסגנון Docs שבו השרת תמיד בלולאה; בוחרים CRDT כש-offline-first או P2P הם דרישת ליבה. בכל מקרה השרת עדיין קובע סדר revisions בשביל היסטוריה והרשאות.</p>`
      }
    },
    {
      h: { en: "One owner per document: sessions, affinity and failover", he: "בעלים אחד לכל מסמך: סשנים, affinity ו-failover" },
      body: {
        en: `<ul>
<li><strong>Why affinity</strong>: OT needs a single sequencer per document. Route every session of doc 123 to the same <strong>doc server</strong>, which holds the document in memory, transforms and orders ops, and broadcasts. One doc's load (≤ ~100 ops/s) easily fits one core, and one server holds thousands of docs.</li>
<li><strong>Who owns a doc</strong>: the first session to open it acquires a lease in etcd/ZooKeeper (<code>doc_owner:123 → server-17, TTL 10 s</code>, renewed every 3 s); others look it up and route there. Consistent hashing on doc_id is a good default placement, with leases preventing two owners during rebalancing.</li>
<li><strong>Split-brain protection</strong>: the lease carries a fencing token (epoch). Appends to the op log are conditional on <code>(doc_id, rev)</code> not existing — a stale owner that lost its lease fails on the next write instead of forking history.</li>
<li><strong>Failover</strong>: if server-17 dies, its leases expire within ~10 s; the next client reconnect triggers a new owner, which loads the latest snapshot + ops after it from the log (~tens of ms for 1,000 ops). Clients resend unacked ops with <code>(client_id, client_seq)</code>; the unique constraint drops duplicates. Users see a brief "reconnecting…", no lost edits.</li>
<li><strong>Gateways vs doc servers</strong>: splitting socket-holding gateways from doc owners lets you deploy/restart doc logic without dropping 4M sockets, and lets viewers be served from gateway-side caches.</li>
</ul>`,
        he: `<ul>
<li><strong>למה affinity</strong>: ‏OT צריך sequencer יחיד לכל מסמך. מנתבים כל סשן של מסמך 123 לאותו <strong>doc server</strong>, שמחזיק את המסמך בזיכרון, עושה transform ומסדר פעולות, ומשדר. העומס של מסמך אחד (עד ~100 פעולות בשנייה) נכנס בקלות ל-core אחד, ושרת אחד מחזיק אלפי מסמכים.</li>
<li><strong>מי הבעלים של מסמך</strong>: הסשן הראשון שפותח אותו לוקח lease ב-etcd או ZooKeeper ‏(<code>doc_owner:123 → server-17, TTL 10 s</code>, מתחדש כל 3 שניות); האחרים מחפשים ומנתבים לשם. ‏Consistent hashing על doc_id זו ברירת מחדל טובה למיקום, וה-leases מונעים שני בעלים בזמן rebalancing.</li>
<li><strong>הגנה מ-split-brain</strong>: ה-lease נושא fencing token ‏(epoch). כתיבות ל-op log מותנות בכך ש-<code>(doc_id, rev)</code> לא קיים — בעלים ישן שאיבד את ה-lease שלו נכשל בכתיבה הבאה במקום לפצל את ההיסטוריה.</li>
<li><strong>Failover</strong>: אם server-17 מת, ה-leases שלו פגים תוך ~10 שניות; ה-reconnect הבא של client מעורר בעלים חדש, שטוען את ה-snapshot האחרון + הפעולות שאחריו מה-log ‏(~עשרות ms ל-1,000 פעולות). ה-clients שולחים מחדש פעולות שלא אושרו עם <code>(client_id, client_seq)</code>; ה-unique constraint זורק כפילויות. המשתמשים רואים "מתחבר מחדש…" קצר, בלי עריכות שאבדו.</li>
<li><strong>Gateways מול doc servers</strong>: הפרדה בין gateways שמחזיקים sockets לבין בעלי המסמכים מאפשרת לעשות deploy ו-restart ללוגיקת המסמך בלי להפיל 4M sockets, ומאפשרת להגיש צופים מ-cache בצד ה-gateway.</li>
</ul>`
      }
    },
    {
      h: { en: "Snapshots + op log, version history and offline", he: "Snapshots + op log, היסטוריית גרסאות ו-offline" },
      body: {
        en: `<ul>
<li><strong>Event sourcing</strong>: the op log is the source of truth; a document at revision R = snapshot(S) + ops (S, R]. Snapshot every ~1,000 ops or 5 minutes so opening a doc replays at most ~1,000 ops.</li>
<li><strong>Ack only after durable append</strong>: the doc server appends the op to a replicated log (quorum write, ~5-10 ms) before acking and broadcasting — otherwise a crash could lose an edit the user saw as saved.</li>
<li><strong>Version history UI</strong>: nobody wants 26B keystroke versions. Group ops into sessions (same author, gaps under ~5 min) and show those as versions; named versions are pointers to a revision. <strong>Restore</strong> doesn't rewrite history: it computes the inverse/diff and appends it as a new revision, so collaborators simply receive ops and history stays linear.</li>
<li><strong>Offline</strong>: the client keeps the doc + a queue of local ops in IndexedDB, applying them locally. On reconnect it sends <code>resync from_rev</code>; the server returns missed ops, the client transforms its queue against them (OT) or simply merges (CRDT), then submits. Long offline periods mean big transforms — warn above a limit, or fall back to a three-way merge with a conflict UI for structural edits (tables).</li>
<li><strong>Retention</strong>: after 30 days compact fine-grained ops into hourly checkpoints; keep named versions forever.</li>
</ul>`,
        he: `<ul>
<li><strong>Event sourcing</strong>: ה-op log הוא ה-source of truth; מסמך ב-revision R = ‏snapshot(S) + פעולות (S, R]. עושים snapshot כל ~1,000 פעולות או 5 דקות, כך שפתיחת מסמך מריצה replay של עד ~1,000 פעולות.</li>
<li><strong>Ack רק אחרי append עמיד</strong>: ה-doc server כותב את הפעולה ל-log משוכפל (כתיבת quorum, ‏~5-10ms) לפני ack ושידור — אחרת קריסה יכולה לאבד עריכה שהמשתמש ראה כשמורה.</li>
<li><strong>ממשק היסטוריית גרסאות</strong>: אף אחד לא רוצה 26B גרסאות של הקשות. מקבצים פעולות לסשנים (אותו כותב, הפסקות של פחות מ-~5 דקות) ומציגים אותם כגרסאות; גרסאות עם שם הן מצביעים ל-revision. <strong>שחזור</strong> לא משכתב היסטוריה: הוא מחשב את ההפך או את ה-diff ומוסיף אותו כ-revision חדש, כך שהשותפים פשוט מקבלים פעולות וההיסטוריה נשארת לינארית.</li>
<li><strong>Offline</strong>: ה-client שומר את המסמך + queue של פעולות מקומיות ב-IndexedDB ומחיל אותן מקומית. בחיבור מחדש הוא שולח <code>resync from_rev</code>; השרת מחזיר את הפעולות שפוספסו, ה-client עושה transform ל-queue שלו מולן (OT) או פשוט ממזג (CRDT), ואז שולח. תקופות offline ארוכות אומרות transforms גדולים — מזהירים מעל סף, או נופלים ל-three-way merge עם ממשק התנגשויות לעריכות מבניות (טבלאות).</li>
<li><strong>שמירה</strong>: אחרי 30 יום דוחסים פעולות עדינות ל-checkpoints שעתיים; גרסאות עם שם נשמרות לתמיד.</li>
</ul>`
      }
    },
    {
      h: { en: "Presence, cursors and permissions on the hot path", he: "Presence, סמנים והרשאות בנתיב החם" },
      body: {
        en: `<ul>
<li><strong>Presence is ephemeral</strong>: cursor positions are sent at most ~10/s per user, throttled and coalesced, never written to the op log or DB. They live in the doc server's memory and are broadcast to the doc's sessions; on failover they're simply rebuilt as clients reconnect.</li>
<li><strong>Cursors must survive edits</strong>: store a cursor as a position relative to the document (OT: transform it like an op; CRDT: anchor it to a character ID) so remote inserts don't make it jump.</li>
<li><strong>Large audiences</strong>: a company all-hands doc with 2,000 viewers — cap visible presence (show "+1,950 viewers"), fan out ops to viewers through gateway-level broadcast trees, and only allow ~100 concurrent editors.</li>
<li><strong>Permissions</strong>: check ACL on WebSocket connect (doc-scoped token) <em>and</em> on every op type (a commenter can send comment ops, not text ops). When access is revoked, publish an ACL-change event; the doc server immediately closes that user's sessions. Cache ACLs in the doc server and invalidate on change — don't query the ACL DB 1M times a second.</li>
</ul>`,
        he: `<ul>
<li><strong>Presence הוא זמני</strong>: מיקומי סמנים נשלחים לכל היותר ~10 פעמים בשנייה למשתמש, עם throttle ואיחוד, ולעולם לא נכתבים ל-op log או ל-DB. הם חיים בזיכרון של ה-doc server ומשודרים לסשנים של המסמך; ב-failover הם פשוט נבנים מחדש כשה-clients מתחברים שוב.</li>
<li><strong>סמנים חייבים לשרוד עריכות</strong>: שומרים סמן כמיקום יחסי למסמך (ב-OT: עושים לו transform כמו לפעולה; ב-CRDT: מעגנים אותו למזהה של תו) כדי שהכנסות של אחרים לא יגרמו לו לקפוץ.</li>
<li><strong>קהלים גדולים</strong>: מסמך all-hands של חברה עם 2,000 צופים — מגבילים את ה-presence הגלוי (מציגים "+1,950 צופים"), עושים fan-out של פעולות לצופים דרך עצי broadcast ברמת ה-gateway, ומאפשרים רק ~100 עורכים במקביל.</li>
<li><strong>הרשאות</strong>: בודקים ACL ב-connect של ה-WebSocket ‏(token מוגבל למסמך) <em>וגם</em> על כל סוג פעולה (commenter יכול לשלוח פעולות תגובה, לא פעולות טקסט). כשגישה נשללת, מפרסמים אירוע שינוי ACL; ה-doc server סוגר מיד את הסשנים של המשתמש. שומרים ACLs ב-cache של ה-doc server ומבטלים בשינוי — לא שואלים את ה-DB של ה-ACL מיליון פעמים בשנייה.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "OT: compact ops and a simple data model, but requires a central sequencer per document and hard transform logic; CRDT: decentralized and offline-friendly, but per-character metadata and tombstone GC.",
      he: "OT: פעולות קומפקטיות ומודל נתונים פשוט, אבל דורש sequencer מרכזי לכל מסמך ולוגיקת transform קשה; ‏CRDT: מבוזר וידידותי ל-offline, אבל metadata לכל תו ו-GC ל-tombstones." },
    { en: "Single owner per doc makes ordering trivial but adds routing, leases and a few seconds of unavailability on failover for that doc.",
      he: "בעלים יחיד לכל מסמך הופך את הסידור לטריוויאלי, אבל מוסיף ניתוב, ‏leases וכמה שניות של חוסר זמינות למסמך הזה ב-failover." },
    { en: "Frequent snapshots = fast loads and smaller replays, but more storage writes; rare snapshots = cheaper writes, slower opens.",
      he: "Snapshots תכופים = טעינה מהירה ו-replays קטנים יותר, אבל יותר כתיבות לאחסון; ‏snapshots נדירים = כתיבות זולות יותר, פתיחה איטית יותר." },
    { en: "Pinning a doc to one region keeps ordering local and simple, but remote collaborators pay ~100-200 ms extra RTT per ack (local echo hides most of it).",
      he: "הצמדת מסמך ל-region אחד שומרת על סידור מקומי ופשוט, אבל שותפים מרוחקים משלמים ~100-200ms RTT נוסף לכל ack (ה-local echo מסתיר את רובו)." }
  ],
  followUps: [
    { q: { en: "A user in Tokyo and one in Tel Aviv edit the same doc. Where does it live and what do they experience?",
           he: "משתמש בטוקיו ומשתמש בתל אביב עורכים את אותו מסמך. איפה הוא יושב ומה הם חווים?" },
      a: { en: "The doc's owner runs in one region (where it was opened first or its home region per data-residency rules). Both users apply their own edits locally instantly; the remote user's acks take one long RTT (~150-250 ms) and they see the other's changes after roughly that. If most activity moves to another region for a long time, migrate ownership: drain, hand off the lease, the new owner loads snapshot + tail. Multi-region active-active per doc is what CRDTs enable, at the cost of their complexity.",
           he: "הבעלים של המסמך רץ ב-region אחד (איפה שנפתח ראשון, או ה-home region שלו לפי כללי data residency). שני המשתמשים מחילים את העריכות שלהם מקומית מיד; ה-acks של המשתמש המרוחק לוקחים RTT ארוך אחד (~150-250ms) והוא רואה את השינויים של השני אחרי זמן דומה. אם רוב הפעילות עוברת ל-region אחר לאורך זמן, מעבירים בעלות: drain, העברת ה-lease, והבעלים החדש טוען snapshot + זנב. ‏Active-active ב-multi-region לכל מסמך זה מה ש-CRDTs מאפשרים, במחיר המורכבות שלהם." } },
    { q: { en: "How do you test that your transform functions are correct?",
           he: "איך בודקים שפונקציות ה-transform שלך נכונות?" },
      a: { en: "Property-based / fuzz testing: generate random documents and random concurrent op pairs and sequences, apply them in all orders through the transform, and assert the convergence properties (TP1: apply(a, T(b,a)) == apply(b, T(a,b))) and intent preservation. Run randomized multi-client simulations with network reordering and drops against the real server, and compare every replica's final document hash. Production: clients periodically send a checksum of their document at revision R; mismatches trigger a resync and an alert.",
           he: "Property-based ו-fuzz testing: מייצרים מסמכים אקראיים וזוגות ורצפים אקראיים של פעולות מקבילות, מחילים אותם בכל הסדרים דרך ה-transform, ומוודאים את תכונות ההתכנסות (TP1: ‏apply(a, T(b,a)) == apply(b, T(a,b))) ושמירת כוונה. מריצים סימולציות אקראיות של הרבה clients עם שינוי סדר ואיבוד הודעות ברשת מול השרת האמיתי, ומשווים את ה-hash של המסמך הסופי בכל עותק. ב-production: ה-clients שולחים מדי פעם checksum של המסמך שלהם ב-revision R; אי-התאמה מפעילה resync והתראה." } },
    { q: { en: "Someone pastes a 5 MB document into a doc with 30 active editors. What happens?",
           he: "מישהו מדביק מסמך של 5MB לתוך מסמך עם 30 עורכים פעילים. מה קורה?" },
      a: { en: "One huge op: it must be size-limited and chunked (e.g. max 256 KB per message), images uploaded separately to object storage and referenced by ID, and the op appended as several revisions. Every other editor must transform pending ops against it and re-render — fine for text, but enforce a doc size cap (Google Docs caps around 1.02M characters) and take a snapshot right after so new joiners don't replay it.",
           he: "פעולה ענקית אחת: חייבים להגביל את הגודל ולחלק לחתיכות (למשל עד 256KB להודעה), להעלות תמונות בנפרד ל-object storage ולהפנות אליהן לפי מזהה, ולהוסיף את הפעולה כמה revisions. כל עורך אחר צריך לעשות transform לפעולות הממתינות שלו מולה ולרנדר מחדש — בסדר לטקסט, אבל אוכפים תקרת גודל למסמך (ב-Google Docs התקרה בערך 1.02M תווים) ועושים snapshot מיד אחרי, כדי שמצטרפים חדשים לא יריצו replay עליה." } }
  ],
  related: ["pr-realtime-protocols", "staff-time-ordering", "staff-consensus-consistency", "staff-multi-region-data", "pr-auth", "arch-event-driven"]
});
