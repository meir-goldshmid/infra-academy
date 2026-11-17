// Git & Code Hosting track, part 2: large repos, hosting platforms, repo security (+ glossary, 1 scenario)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ------------------------------------------------------------------ 1. Monorepos & large repos */
INFRA.lessons.push({
  id: "git-large-repos",
  track: "git",
  order: 5,
  icon: "🏗️",
  level: 3,
  minutes: 16,
  title: { en: "Monorepos & Large Repos", he: "Monorepos ו-repos ענקיים" },
  tldr: {
    en: "A monorepo trades repo-boundary pain for tooling pain: it only scales if CI builds just what changed (Bazel/Nx/Turborepo/Pants), developers check out just what they need (partial clone + sparse-checkout), binaries live outside Git history (LFS), and ownership is encoded in CODEOWNERS.",
    he: "Monorepo מחליף כאב של גבולות בין repos בכאב של tooling: הוא עובד בקנה מידה רק אם ה-CI בונה רק מה שהשתנה (Bazel/Nx/Turborepo/Pants), מפתחים מושכים רק מה שהם צריכים (partial clone + sparse-checkout), קבצים בינאריים יושבים מחוץ להיסטוריה של Git (LFS), והבעלות כתובה ב-CODEOWNERS."
  },
  analogy: {
    en: "A monorepo is one giant warehouse; a polyrepo setup is 200 small storage units around town. In the warehouse you can move a shelf and relabel every box in one afternoon (atomic refactor), but you need forklifts, aisle signs and a rule that you only walk the aisles you need. With storage units, each one is easy, but changing the label format means 200 car trips and 200 keys.",
    he: "Monorepo הוא מחסן ענק אחד; polyrepo הוא 200 מחסנים קטנים מפוזרים בעיר. במחסן הגדול אתה יכול להזיז מדף ולהחליף תווית על כל הקרטונים בצהריים אחד (refactor אטומי), אבל אתה צריך מלגזות, שלטים במעברים וחוק שהולכים רק במעברים שצריך. במחסנים הקטנים כל אחד פשוט, אבל לשנות את פורמט התווית זה 200 נסיעות ו-200 מפתחות."
  },
  sections: [
    {
      h: { en: "Monorepo vs polyrepo: the real tradeoffs", he: "Monorepo מול polyrepo: הטרייד-אופים האמיתיים" },
      body: {
        en: `<p>The choice is not about Git; it is about where you want coordination cost to live.</p>
<table>
<tr><th></th><th>Monorepo</th><th>Polyrepo</th></tr>
<tr><td>Cross-cutting change (rename an API, bump a lib)</td><td>One atomic PR, one CI run</td><td>N PRs, release ordering, version skew</td></tr>
<tr><td>Dependency versions</td><td>One version policy ("one version rule")</td><td>Every repo drifts on its own</td></tr>
<tr><td>CI</td><td>Must be <strong>affected-only</strong> or it explodes</td><td>Naturally scoped per repo</td></tr>
<tr><td>Access control</td><td>Coarse (repo-level read) + CODEOWNERS for write</td><td>Fine-grained per repo</td></tr>
<tr><td>Git performance</td><td>Needs partial clone, sparse-checkout, fsmonitor</td><td>Usually a non-issue</td></tr>
<tr><td>Discoverability / reuse</td><td>grep the whole company</td><td>Need an internal catalog</td></tr>
</table>
<p>Famous data points: Google's Piper monorepo held ~2 billion lines and 86 TB in 2015 (not Git); Microsoft moved Windows (~3.5M files, ~300 GB) to Git and built VFS for Git, later replaced by <strong>Scalar</strong>; Meta runs a monorepo on Sapling (its Mercurial descendant). Most companies sit in between: a few domain monorepos (frontend, backend, infra) instead of one or 400.</p>
<blockquote>💡 Real world: the most common monorepo failure is not Git speed — it is a CI pipeline that runs all 4,000 tests on every PR. Teams wait 45 minutes, then start bypassing CI. Affected-only builds are the entry ticket, not an optimization.</blockquote>`,
        he: `<p>הבחירה היא לא על Git; היא על איפה אתה רוצה שעלות התיאום תחיה.</p>
<table>
<tr><th></th><th>Monorepo</th><th>Polyrepo</th></tr>
<tr><td>שינוי רוחבי (שינוי שם של API, שדרוג lib)</td><td>PR אטומי אחד, ריצת CI אחת</td><td>N PR-ים, סדר releases, version skew</td></tr>
<tr><td>גרסאות תלויות</td><td>מדיניות גרסה אחת ("one version rule")</td><td>כל repo נסחף לבד</td></tr>
<tr><td>CI</td><td>חייב להיות <strong>affected-only</strong> אחרת הוא מתפוצץ</td><td>מוגבל באופן טבעי ל-repo</td></tr>
<tr><td>הרשאות</td><td>גס (read ברמת repo) + CODEOWNERS ל-write</td><td>מדויק לכל repo</td></tr>
<tr><td>ביצועי Git</td><td>צריך partial clone, sparse-checkout, fsmonitor</td><td>בדרך כלל לא בעיה</td></tr>
<tr><td>גילוי ושימוש חוזר</td><td>grep על כל הקוד של החברה</td><td>צריך קטלוג פנימי</td></tr>
</table>
<p>נקודות ידועות: ה-monorepo של Google (Piper) החזיק בערך 2 מיליארד שורות ו-86 TB ב-2015 (לא Git); Microsoft העבירה את Windows (בערך 3.5 מיליון קבצים, בערך 300 GB) ל-Git ובנתה את VFS for Git, שהוחלף אחר כך ב-<strong>Scalar</strong>; Meta מריצה monorepo על Sapling (צאצא של Mercurial). רוב החברות נמצאות באמצע: כמה monorepos לפי domain (frontend, backend, infra) במקום אחד או 400.</p>
<blockquote>💡 Real world: הכשל הכי נפוץ של monorepo הוא לא מהירות של Git — זה pipeline שמריץ את כל 4,000 הטסטים על כל PR. צוותים מחכים 45 דקות ואז מתחילים לעקוף את ה-CI. Build של affected-only הוא כרטיס הכניסה, לא אופטימיזציה.</blockquote>`
      }
    },
    {
      h: { en: "Build tools and affected-only CI", he: "כלי build ו-CI של affected-only" },
      body: {
        en: `<p>Monorepo build tools know the <strong>dependency graph</strong> between packages, so they can answer "given the files changed since <code>origin/main</code>, which projects are affected?" and cache everything else.</p>
<table>
<tr><th>Tool</th><th>Sweet spot</th><th>Affected / cache</th></tr>
<tr><td><strong>Bazel</strong></td><td>Polyglot, huge (Java, Go, C++, Python); hermetic builds</td><td>Content-hashed actions + remote cache &amp; remote execution</td></tr>
<tr><td><strong>Nx</strong></td><td>JS/TS (also Java/.NET plugins)</td><td><code>nx affected</code> + local/remote cache</td></tr>
<tr><td><strong>Turborepo</strong></td><td>JS/TS workspaces, simple to adopt</td><td><code>--filter=...[origin/main]</code> + remote cache</td></tr>
<tr><td><strong>Pants</strong></td><td>Python-heavy (also Go, Java, Shell)</td><td><code>--changed-since</code> with dependents</td></tr>
</table>
<pre>
# Nx: test only what the PR touches (needs history back to the merge-base!)
npx nx affected -t lint test build --base=origin/main --head=HEAD

# Turborepo: build changed packages AND their dependents
npx turbo run build --filter="...[origin/main]"

# Pants: changed targets plus everything that depends on them
pants --changed-since=origin/main --changed-dependents=transitive test

# Bazel: query reverse deps of a changed package, then test them
bazel query "rdeps(//..., //libs/auth/...)" --output=label | xargs bazel test
</pre>
<p>With a shared <strong>remote cache</strong>, a PR that touches one service can finish in 3 minutes instead of 40, because unchanged targets are downloaded, not rebuilt. The price: builds must be deterministic — an undeclared input (an env var, the current time, a file outside the graph) causes either stale cache hits or zero hits.</p>
<blockquote>⚠️ Production tip: always have a path that runs <em>everything</em> — on <code>main</code> nightly, or when root files change (<code>package-lock.json</code>, <code>WORKSPACE</code>, CI config). Affected detection only sees edges it knows about; a changed shared config file it doesn't model will let breakage slip.</blockquote>`,
        he: `<p>כלי build ל-monorepo מכירים את <strong>גרף התלויות</strong> בין ה-packages, ולכן יכולים לענות על "בהינתן הקבצים שהשתנו מאז <code>origin/main</code>, אילו פרויקטים מושפעים?" ולשלוף את כל השאר מ-cache.</p>
<table>
<tr><th>כלי</th><th>איפה הוא חזק</th><th>Affected ו-cache</th></tr>
<tr><td><strong>Bazel</strong></td><td>הרבה שפות, ענק (Java, Go, C++, Python); builds הרמטיים</td><td>Actions עם hash של התוכן + remote cache ו-remote execution</td></tr>
<tr><td><strong>Nx</strong></td><td>JS/TS (יש גם plugins ל-Java ו-.NET)</td><td><code>nx affected</code> + cache מקומי או מרוחק</td></tr>
<tr><td><strong>Turborepo</strong></td><td>JS/TS workspaces, קל לאמץ</td><td><code>--filter=...[origin/main]</code> + remote cache</td></tr>
<tr><td><strong>Pants</strong></td><td>בעיקר Python (גם Go, Java, Shell)</td><td><code>--changed-since</code> כולל dependents</td></tr>
</table>
<pre>
# Nx: test only what the PR touches (needs history back to the merge-base!)
npx nx affected -t lint test build --base=origin/main --head=HEAD

# Turborepo: build changed packages AND their dependents
npx turbo run build --filter="...[origin/main]"

# Pants: changed targets plus everything that depends on them
pants --changed-since=origin/main --changed-dependents=transitive test

# Bazel: query reverse deps of a changed package, then test them
bazel query "rdeps(//..., //libs/auth/...)" --output=label | xargs bazel test
</pre>
<p>עם <strong>remote cache</strong> משותף, PR שנוגע בשירות אחד יכול להסתיים ב-3 דקות במקום 40, כי targets שלא השתנו יורדים מה-cache ולא נבנים מחדש. המחיר: ה-builds חייבים להיות דטרמיניסטיים — input שלא הוצהר (משתנה סביבה, השעה הנוכחית, קובץ מחוץ לגרף) גורם או ל-cache hits ישנים או לאפס hits.</p>
<blockquote>⚠️ Production tip: תמיד תשאיר מסלול שמריץ <em>הכל</em> — על <code>main</code> כל לילה, או כשקבצי root משתנים (<code>package-lock.json</code>, <code>WORKSPACE</code>, הגדרות ה-CI). זיהוי affected רואה רק קשתות שהוא מכיר; קובץ config משותף שהוא לא ממדל יתן לשבירה לחמוק.</blockquote>`
      }
    },
    {
      h: { en: "Cloning less: partial clone, sparse-checkout, shallow clones", he: "לשכפל פחות: partial clone, sparse-checkout ו-shallow clone" },
      body: {
        en: `<p>Three independent knobs, often combined:</p>
<ul>
<li><strong>Partial clone</strong> (<code>--filter=blob:none</code>): download all commits and trees, but file contents (blobs) only on demand at checkout. Full <code>git log</code> works; <code>git blame</code> on an old file fetches its blobs lazily. <code>--filter=tree:0</code> (treeless) is even smaller but painful for humans — fine for throwaway CI.</li>
<li><strong>Sparse-checkout</strong> (cone mode): only materialize some directories in the working tree. The index stays small, so <code>git status</code> is fast.</li>
<li><strong>Shallow clone</strong> (<code>--depth=1</code>): truncate history. Great for "build this commit", bad for anything that needs history (merge-base, <code>git describe</code>, affected detection).</li>
</ul>
<pre>
# Developer on a big monorepo: full history, blobs on demand, only my dirs
git clone --filter=blob:none --sparse git@github.com:acme/mono.git
cd mono
git sparse-checkout set --cone services/payments libs/common
git sparse-checkout add tools/ci        # widen later

# Turn on the performance features for big repos
scalar register                 # enables fsmonitor, commit-graph, maintenance, etc.
git maintenance start           # background prefetch / commit-graph / incremental repack
</pre>
<p>In GitHub Actions, <code>actions/checkout</code> defaults to <code>fetch-depth: 1</code>. That breaks <code>nx affected --base=origin/main</code> (no merge-base). Fix it without paying for full history:</p>
<pre>
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # full history (simple, slower on huge repos)
    filter: blob:none       # ...but no old file contents: still fast
</pre>
<blockquote>💡 Real world: on a 15 GB repo, <code>--filter=blob:none</code> typically cuts clone time from ~20 minutes to 1-2, and <code>git status</code> on a sparse 5% of the tree goes from seconds to tens of milliseconds. Self-hosted runners that keep a warm clone and just <code>git fetch</code> beat any filter.</blockquote>`,
        he: `<p>שלושה כפתורים בלתי תלויים, שלרוב משלבים:</p>
<ul>
<li><strong>Partial clone</strong> (<code>--filter=blob:none</code>): מורידים את כל ה-commits וה-trees, אבל את תוכן הקבצים (blobs) רק לפי דרישה ב-checkout. <code>git log</code> מלא עובד; <code>git blame</code> על קובץ ישן מושך את ה-blobs שלו בעצלות. <code>--filter=tree:0</code> (treeless) קטן עוד יותר אבל כואב לבני אדם — מתאים ל-CI חד-פעמי.</li>
<li><strong>Sparse-checkout</strong> (cone mode): רק חלק מהתיקיות קיימות בפועל ב-working tree. ה-index נשאר קטן, אז <code>git status</code> מהיר.</li>
<li><strong>Shallow clone</strong> (<code>--depth=1</code>): חותכים את ההיסטוריה. מעולה ל-"תבנה את ה-commit הזה", גרוע לכל מה שצריך היסטוריה (merge-base, <code>git describe</code>, זיהוי affected).</li>
</ul>
<pre>
# Developer on a big monorepo: full history, blobs on demand, only my dirs
git clone --filter=blob:none --sparse git@github.com:acme/mono.git
cd mono
git sparse-checkout set --cone services/payments libs/common
git sparse-checkout add tools/ci        # widen later

# Turn on the performance features for big repos
scalar register                 # enables fsmonitor, commit-graph, maintenance, etc.
git maintenance start           # background prefetch / commit-graph / incremental repack
</pre>
<p>ב-GitHub Actions, ברירת המחדל של <code>actions/checkout</code> היא <code>fetch-depth: 1</code>. זה שובר את <code>nx affected --base=origin/main</code> (אין merge-base). אפשר לתקן בלי לשלם על כל ההיסטוריה:</p>
<pre>
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # full history (simple, slower on huge repos)
    filter: blob:none       # ...but no old file contents: still fast
</pre>
<blockquote>💡 Real world: על repo של 15 GB, <code>--filter=blob:none</code> מוריד בדרך כלל את זמן ה-clone מבערך 20 דקות ל-1-2, ו-<code>git status</code> על 5% sparse מה-tree יורד משניות לעשרות מילישניות. Runners בניהול עצמי שמחזיקים clone חם ורק עושים <code>git fetch</code> מנצחים כל filter.</blockquote>`
      }
    },
    {
      h: { en: "Big files: Git LFS and its costs", he: "קבצים גדולים: Git LFS והעלויות שלו" },
      body: {
        en: `<p>Git stores every version of every file forever, and every clone downloads that history. A 200 MB model file changed 50 times = 10 GB that every new clone pays for. GitHub warns at 50 MB and <strong>hard-rejects files over 100 MB</strong>.</p>
<p><strong>Git LFS</strong> replaces the file in Git with a tiny <strong>pointer</strong>; the real content goes to a separate LFS store over HTTPS. A clean/smudge filter swaps them on <code>add</code> and checkout:</p>
<pre>
git lfs install
git lfs track "*.onnx" "assets/**/*.psd"     # writes .gitattributes
git add .gitattributes model.onnx
git commit -m "Add model via LFS"

$ git show HEAD:model.onnx                   # what Git actually stores
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 209715200
</pre>
<p>Costs and limits to plan for:</p>
<ul>
<li><strong>Storage and bandwidth are metered</strong> on GitHub, GitLab and Bitbucket. Every CI job that checks out with <code>lfs: true</code> downloads the objects again — a 2 GB asset set × 300 CI runs/day is 600 GB/day of LFS egress. Cache <code>.git/lfs</code> or fetch only what the job needs (<code>git lfs pull --include="models/prod/*"</code>).</li>
<li><strong>Per-file max</strong> on GitHub LFS: 2 GB (Free/Pro), 4 GB (Team), 5 GB (Enterprise Cloud).</li>
<li><strong>Deleting is hard</strong>: removing the file from history doesn't free LFS storage; on GitHub you delete the repo or ask Support.</li>
<li>Converting an existing repo rewrites history: <code>git lfs migrate import --include="*.bin" --everything</code> — every clone must re-clone.</li>
</ul>
<blockquote>⚠️ Production tip: LFS is for assets that are versioned with code (game art, test fixtures). Build outputs, datasets and ML checkpoints belong in an artifact registry or object storage (S3 + a manifest/hash in Git), not in Git at all.</blockquote>`,
        he: `<p>Git שומר כל גרסה של כל קובץ לתמיד, וכל clone מוריד את ההיסטוריה הזו. קובץ מודל של 200 MB שהשתנה 50 פעם = 10 GB שכל clone חדש משלם עליהם. GitHub מזהיר ב-50 MB ו-<strong>דוחה לגמרי קבצים מעל 100 MB</strong>.</p>
<p><strong>Git LFS</strong> מחליף את הקובץ ב-Git ב-<strong>pointer</strong> קטנטן; התוכן האמיתי הולך ל-LFS store נפרד על HTTPS. Filter של clean/smudge מחליף ביניהם ב-<code>add</code> וב-checkout:</p>
<pre>
git lfs install
git lfs track "*.onnx" "assets/**/*.psd"     # writes .gitattributes
git add .gitattributes model.onnx
git commit -m "Add model via LFS"

$ git show HEAD:model.onnx                   # what Git actually stores
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 209715200
</pre>
<p>עלויות ומגבלות שצריך לתכנן:</p>
<ul>
<li><strong>Storage ו-bandwidth נמדדים ומחויבים</strong> ב-GitHub, GitLab ו-Bitbucket. כל job ב-CI שעושה checkout עם <code>lfs: true</code> מוריד את האובייקטים שוב — סט assets של 2 GB כפול 300 ריצות CI ביום זה 600 GB ביום של LFS egress. תעשה cache ל-<code>.git/lfs</code> או תמשוך רק מה שה-job צריך (<code>git lfs pull --include="models/prod/*"</code>).</li>
<li><strong>גודל מקסימלי לקובץ</strong> ב-GitHub LFS: 2 GB (Free/Pro), 4 GB (Team), 5 GB (Enterprise Cloud).</li>
<li><strong>מחיקה קשה</strong>: הסרת הקובץ מההיסטוריה לא משחררת LFS storage; ב-GitHub צריך למחוק את ה-repo או לפנות ל-Support.</li>
<li>המרה של repo קיים משכתבת היסטוריה: <code>git lfs migrate import --include="*.bin" --everything</code> — כל אחד צריך לעשות clone מחדש.</li>
</ul>
<blockquote>⚠️ Production tip: LFS מתאים ל-assets שמנוהלים יחד עם הקוד (גרפיקה למשחקים, test fixtures). תוצרי build, datasets ו-checkpoints של ML שייכים ל-artifact registry או ל-object storage (S3 + manifest או hash ב-Git), לא ל-Git בכלל.</blockquote>`
      }
    },
    {
      h: { en: "Submodules vs subtrees, and CODEOWNERS at scale", he: "Submodules מול subtrees, ו-CODEOWNERS בקנה מידה" },
      body: {
        en: `<p><strong>Submodule</strong>: the parent repo stores a <em>gitlink</em> (tree entry mode <code>160000</code>) pointing at one exact commit of another repo, plus a URL in <code>.gitmodules</code>. <strong>Subtree</strong>: the other repo's files are copied (optionally squashed) into a subdirectory as normal commits.</p>
<pre>
# Submodule: pinned pointer, separate repo
git submodule add git@github.com:acme/proto.git vendor/proto
git clone --recurse-submodules git@github.com:acme/app.git
git submodule update --init --recursive      # after pull, or CI shows an empty dir

# Subtree: real files, no extra clone step
git subtree add  --prefix=vendor/proto git@github.com:acme/proto.git main --squash
git subtree pull --prefix=vendor/proto git@github.com:acme/proto.git main --squash
</pre>
<table>
<tr><th></th><th>Submodule</th><th>Subtree</th></tr>
<tr><td>Consumers need to know?</td><td>Yes (<code>--recurse-submodules</code>, CI auth to the 2nd repo)</td><td>No — it's just files</td></tr>
<tr><td>Classic pitfalls</td><td>Detached HEAD inside, forgotten <code>update</code>, pointer to an unpushed commit, CI token can't read the private submodule</td><td>Noisy history, pushing changes back upstream is awkward (<code>subtree split</code>)</td></tr>
<tr><td>Good for</td><td>Large third-party code pinned rarely</td><td>Vendoring small shared code</td></tr>
</table>
<p><strong>CODEOWNERS</strong> (in <code>.github/</code>, the root, or <code>docs/</code>; GitLab also supports it) maps paths to required reviewers. The <strong>last matching pattern wins</strong>, owners need write access, and GitHub ignores the file above 3 MB.</p>
<pre>
# .github/CODEOWNERS  (last match wins: generic first, specific last)
*                         @acme/platform-reviewers
/services/payments/       @acme/payments
/libs/auth/               @acme/identity @acme/security
/.github/workflows/       @acme/platform-security
/infra/terraform/prod/    @acme/sre
</pre>
<blockquote>⚠️ Production tip: at 300+ engineers, CODEOWNERS with individuals rots within months (people leave, PRs block). Use teams only, give every directory a single owning team, and lint it in CI (GitHub shows syntax errors in the file view; tools like <code>codeowners-validator</code> catch unowned paths and missing teams).</blockquote>`,
        he: `<p><strong>Submodule</strong>: ה-repo האב שומר <em>gitlink</em> (רשומה ב-tree עם mode <code>160000</code>) שמצביע על commit מדויק אחד של repo אחר, ועוד URL ב-<code>.gitmodules</code>. <strong>Subtree</strong>: הקבצים של ה-repo השני מועתקים (אפשר עם squash) לתוך תת-תיקייה כ-commits רגילים.</p>
<pre>
# Submodule: pinned pointer, separate repo
git submodule add git@github.com:acme/proto.git vendor/proto
git clone --recurse-submodules git@github.com:acme/app.git
git submodule update --init --recursive      # after pull, or CI shows an empty dir

# Subtree: real files, no extra clone step
git subtree add  --prefix=vendor/proto git@github.com:acme/proto.git main --squash
git subtree pull --prefix=vendor/proto git@github.com:acme/proto.git main --squash
</pre>
<table>
<tr><th></th><th>Submodule</th><th>Subtree</th></tr>
<tr><td>הצרכנים צריכים לדעת?</td><td>כן (<code>--recurse-submodules</code>, הרשאת CI ל-repo השני)</td><td>לא — אלה סתם קבצים</td></tr>
<tr><td>פספוסים קלאסיים</td><td>Detached HEAD בפנים, <code>update</code> שנשכח, pointer ל-commit שלא נדחף, token של CI שלא יכול לקרוא את ה-submodule הפרטי</td><td>היסטוריה רועשת, להחזיר שינויים upstream זה מסורבל (<code>subtree split</code>)</td></tr>
<tr><td>מתאים ל-</td><td>קוד צד שלישי גדול שמעדכנים לעיתים רחוקות</td><td>Vendoring של קוד משותף קטן</td></tr>
</table>
<p><strong>CODEOWNERS</strong> (ב-<code>.github/</code>, ב-root או ב-<code>docs/</code>; גם GitLab תומך) ממפה נתיבים ל-reviewers חובה. <strong>ה-pattern האחרון שמתאים מנצח</strong>, ה-owners צריכים הרשאת write, ו-GitHub מתעלם מהקובץ מעל 3 MB.</p>
<pre>
# .github/CODEOWNERS  (last match wins: generic first, specific last)
*                         @acme/platform-reviewers
/services/payments/       @acme/payments
/libs/auth/               @acme/identity @acme/security
/.github/workflows/       @acme/platform-security
/infra/terraform/prod/    @acme/sre
</pre>
<blockquote>⚠️ Production tip: מעל 300 מהנדסים, CODEOWNERS עם אנשים בודדים נרקב תוך חודשים (אנשים עוזבים, PR-ים נתקעים). תשתמש רק ב-teams, תן לכל תיקייה team בעלים אחד, ותעשה לו lint ב-CI (GitHub מראה שגיאות syntax בתצוגת הקובץ; כלים כמו <code>codeowners-validator</code> תופסים נתיבים בלי בעלים ו-teams שלא קיימים).</blockquote>`
      }
    }
  ],
  diagram: "monorepo\n ├─ services/payments  ──┐\n ├─ services/orders     │  changed since origin/main\n ├─ libs/auth  ◄────────┘  -> affected = {libs/auth, payments, orders}\n └─ tools/ci\nclone: --filter=blob:none --sparse  -> trees now, blobs on demand, only cone dirs\nLFS:   git object = pointer (oid sha256 + size) -> real bytes in LFS store",
  handsOn: [
    { cmd: "git clone --filter=blob:none --sparse https://github.com/git/git.git && cd git && git sparse-checkout set --cone Documentation && git count-objects -vH",
      what: { en: "Partial + sparse clone of a real repo: compare size-pack and the working tree to a full clone.", he: "Clone חלקי ו-sparse של repo אמיתי: תשווה את size-pack ואת ה-working tree ל-clone מלא." } },
    { cmd: "git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n | tail -10",
      what: { en: "Find the 10 biggest blobs in history — candidates for LFS or for removal.", he: "למצוא את 10 ה-blobs הכי גדולים בהיסטוריה — מועמדים ל-LFS או למחיקה." } },
    { cmd: "git lfs track \"*.bin\" && cat .gitattributes && git lfs ls-files",
      what: { en: "Start tracking a pattern with LFS and see which files are pointers.", he: "להתחיל לעקוב אחרי pattern עם LFS ולראות אילו קבצים הם pointers." } },
    { cmd: "npx nx show projects --affected --base=origin/main",
      what: { en: "In an Nx workspace, list exactly which projects a branch affects.", he: "ב-workspace של Nx, לראות בדיוק אילו פרויקטים ה-branch משפיע עליהם." } }
  ],
  mnemonic: {
    en: "Big repo diet: Build only what's Affected, Clone only what's Needed, Store binaries Elsewhere, Own every path. (A-N-E-O)",
    he: "דיאטה ל-repo ענק: לבנות רק מה שהושפע, לשכפל רק מה שצריך, בינאריים במקום אחר, ולכל נתיב יש בעלים."
  },
  pitfalls: [
    { en: "Shallow checkout (fetch-depth: 1) in CI with affected-only tools: no merge-base, so the tool either fails or silently treats everything as changed (or nothing).",
      he: "Checkout רדוד (fetch-depth: 1) ב-CI עם כלי affected-only: אין merge-base, אז הכלי או נכשל או מתייחס בשקט לכל הקוד כמשתנה (או לשום דבר)." },
    { en: "Committing a 300 MB file, getting rejected, then deleting it in a new commit: the push still fails because the blob is in history. You must rewrite the commit (git filter-repo or amend before push).",
      he: "לעשות commit לקובץ של 300 MB, לקבל דחייה, ואז למחוק אותו ב-commit חדש: ה-push עדיין נכשל כי ה-blob בהיסטוריה. צריך לשכתב את ה-commit (git filter-repo או amend לפני push)." },
    { en: "Submodule pointing at a commit that only exists on a colleague's laptop: everyone else gets 'fatal: remote error: upload-pack: not our ref'.",
      he: "Submodule שמצביע על commit שקיים רק על הלפטופ של עמית: כל השאר מקבלים 'fatal: remote error: upload-pack: not our ref'." },
    { en: "Turning on LFS for CI checkouts by default and discovering a bandwidth bill — every ephemeral runner downloads all LFS objects on every job.",
      he: "להפעיל LFS ב-checkout של ה-CI כברירת מחדל ולגלות חשבון bandwidth — כל runner ephemeral מוריד את כל אובייקטי ה-LFS בכל job." }
  ],
  interview: [
    { q: { en: "Your monorepo CI takes 50 minutes per PR. What do you do?", he: "ה-CI של ה-monorepo שלך לוקח 50 דקות לכל PR. מה אתה עושה?" },
      a: { en: "Measure where time goes (checkout, install, build, test). Then: affected-only builds using the dependency graph (Nx/Turbo/Bazel/Pants), a shared remote cache, partial clone or warm self-hosted runners for checkout, test sharding, and a full build on main nightly plus when root config changes as the safety net. Target: p50 under 10 minutes.",
           he: "קודם מודד איפה הולך הזמן (checkout, install, build, test). אחר כך: build של affected-only לפי גרף התלויות (Nx/Turbo/Bazel/Pants), remote cache משותף, partial clone או runners חמים בניהול עצמי ל-checkout, sharding לטסטים, ו-build מלא על main כל לילה וכשמשתנה config ב-root כרשת ביטחון. היעד: p50 מתחת ל-10 דקות." } },
    { q: { en: "Partial clone vs shallow clone — when do you use which?", he: "Partial clone מול shallow clone — מתי משתמשים בכל אחד?" },
      a: { en: "Shallow (--depth) cuts history: fine for building one commit, breaks merge-base, describe and blame. Partial (--filter=blob:none) keeps all commits and trees but fetches file contents lazily: history-aware operations still work, so it's the better default for developers and for CI that needs a merge-base.",
           he: "Shallow (--depth) חותך היסטוריה: טוב לבנייה של commit אחד, שובר merge-base, describe ו-blame. Partial (--filter=blob:none) שומר את כל ה-commits וה-trees אבל מושך תוכן קבצים בעצלות: פעולות שתלויות בהיסטוריה עדיין עובדות, ולכן זו ברירת מחדל טובה יותר למפתחים ול-CI שצריך merge-base." } }
  ],
  quiz: [
    { q: { en: "What does Git actually store in the commit for a file tracked by Git LFS?", he: "מה Git באמת שומר ב-commit עבור קובץ שמנוהל ב-Git LFS?" },
      options: [
        { en: "A compressed copy of the file", he: "עותק דחוס של הקובץ" },
        { en: "A small text pointer with the spec version, a sha256 oid and the size", he: "Pointer טקסטואלי קטן עם גרסת ה-spec, oid של sha256 והגודל" },
        { en: "A symlink to the LFS server", he: "Symlink לשרת ה-LFS" },
        { en: "Nothing — the file is excluded via .gitignore", he: "כלום — הקובץ מוחרג דרך .gitignore" }
      ], answer: 1,
      explain: { en: "LFS's clean filter replaces the content with a ~130-byte pointer (version, oid sha256:…, size); the smudge filter downloads the real bytes from the LFS store on checkout.",
                 he: "ה-clean filter של LFS מחליף את התוכן ב-pointer של בערך 130 בתים (version, oid sha256:…, size); ה-smudge filter מוריד את הבתים האמיתיים מה-LFS store ב-checkout." } },
    { q: { en: "CI runs `nx affected --base=origin/main` after actions/checkout with default settings and fails to find a merge-base. Why?", he: "ה-CI מריץ `nx affected --base=origin/main` אחרי actions/checkout עם הגדרות ברירת מחדל ולא מוצא merge-base. למה?" },
      options: [
        { en: "Nx doesn't support GitHub Actions", he: "Nx לא תומך ב-GitHub Actions" },
        { en: "actions/checkout defaults to fetch-depth: 1, a shallow clone with no history to the merge-base", he: "ברירת המחדל של actions/checkout היא fetch-depth: 1, clone רדוד בלי היסטוריה עד ה-merge-base" },
        { en: "Sparse-checkout hid the .git directory", he: "Sparse-checkout הסתיר את תיקיית .git" },
        { en: "LFS pointers confuse the dependency graph", he: "Pointers של LFS מבלבלים את גרף התלויות" }
      ], answer: 1,
      explain: { en: "Use fetch-depth: 0 (optionally with filter: blob:none to keep it fast) so the commit graph back to origin/main exists.",
                 he: "צריך fetch-depth: 0 (אפשר עם filter: blob:none כדי שיישאר מהיר) כדי שגרף ה-commits עד origin/main יהיה קיים." } },
    { q: { en: "Two CODEOWNERS lines match /libs/auth/token.go: `*  @acme/platform` (line 1) and `/libs/auth/  @acme/identity` (line 9). Who is the required owner?", he: "שתי שורות ב-CODEOWNERS מתאימות ל-/libs/auth/token.go: `*  @acme/platform` (שורה 1) ו-`/libs/auth/  @acme/identity` (שורה 9). מי ה-owner החובה?" },
      options: [
        { en: "@acme/platform — first match wins", he: "@acme/platform — ההתאמה הראשונה מנצחת" },
        { en: "Both teams must approve", he: "שני ה-teams חייבים לאשר" },
        { en: "@acme/identity — the last matching pattern wins", he: "@acme/identity — ה-pattern האחרון שמתאים מנצח" },
        { en: "Nobody — overlapping rules cancel out", he: "אף אחד — חוקים חופפים מבטלים זה את זה" }
      ], answer: 2,
      explain: { en: "CODEOWNERS is evaluated top to bottom and the last match wins, so put broad defaults first and specific paths later.",
                 he: "CODEOWNERS נקרא מלמעלה למטה וההתאמה האחרונה מנצחת, ולכן שמים ברירות מחדל רחבות למעלה ונתיבים ספציפיים למטה." } },
    { q: { en: "Which is the main operational pitfall of Git submodules?", he: "מה הפספוס התפעולי המרכזי של Git submodules?" },
      options: [
        { en: "They copy the full history of the other repo into yours", he: "הם מעתיקים את כל ההיסטוריה של ה-repo השני לשלך" },
        { en: "They can't be pinned to a specific commit", he: "אי אפשר להצמיד אותם ל-commit ספציפי" },
        { en: "Every consumer and CI must init/update them and have access to the second repo, or they get an empty or stale directory", he: "כל צרכן וכל CI חייבים לעשות להם init/update ולהיות עם גישה ל-repo השני, אחרת מקבלים תיקייה ריקה או ישנה" },
        { en: "They only work with LFS", he: "הם עובדים רק עם LFS" }
      ], answer: 2,
      explain: { en: "A submodule is just a pinned gitlink; nothing is fetched unless you clone with --recurse-submodules or run git submodule update --init, with credentials for that repo.",
                 he: "Submodule הוא רק gitlink מוצמד; שום דבר לא נמשך אלא אם עושים clone עם --recurse-submodules או מריצים git submodule update --init, עם הרשאות ל-repo הזה." } }
  ],
  playground: "terminal",
  related: ["git-internals", "git-workflow", "cicd-github-actions", "pr-code-review-quality"]
});

/* ------------------------------------------------------------------ 2. GitHub vs GitLab vs Bitbucket */
INFRA.lessons.push({
  id: "git-hosting-compare",
  track: "git",
  order: 6,
  icon: "🏢",
  level: 2,
  minutes: 15,
  title: { en: "GitHub vs GitLab vs Bitbucket (and Azure DevOps)", he: "GitHub מול GitLab מול Bitbucket (ו-Azure DevOps)" },
  tldr: {
    en: "All four host Git the same way; they differ in the layer around it: review rules (branch protection/rulesets vs approval rules), merge queues, built-in CI (Actions vs GitLab CI vs Pipelines), registries, and whether you can self-host. Pick on CI, compliance and ecosystem, not on Git.",
    he: "כל הארבעה מארחים Git באותה צורה; ההבדל הוא בשכבה שמסביב: חוקי review (branch protection/rulesets מול approval rules), merge queues, CI מובנה (Actions מול GitLab CI מול Pipelines), registries, והאם אפשר להריץ בעצמך. בוחרים לפי CI, compliance ואקוסיסטם, לא לפי Git."
  },
  analogy: {
    en: "Git is the shipping container standard; the hosting platforms are ports. Any container fits any port, but the ports differ in cranes (CI), customs rules (branch protection, approvals), warehouses (package registries) and whether you can build a private port on your own land (self-managed). Moving ports is easy for the containers and hard for the paperwork.",
    he: "Git הוא התקן של מכולות השילוח; פלטפורמות ה-hosting הן נמלים. כל מכולה מתאימה לכל נמל, אבל הנמלים שונים במנופים (CI), בחוקי המכס (branch protection, אישורים), במחסנים (package registries) ובשאלה אם אפשר לבנות נמל פרטי על הקרקע שלך (self-managed). להעביר את המכולות בין נמלים קל; להעביר את הניירת קשה."
  },
  sections: [
    {
      h: { en: "Same idea, different names", he: "אותו רעיון, שמות שונים" },
      body: {
        en: `<table>
<tr><th>Concept</th><th>GitHub</th><th>GitLab</th><th>Bitbucket Cloud</th><th>Azure DevOps</th></tr>
<tr><td>Change proposal</td><td>Pull Request (PR)</td><td>Merge Request (MR)</td><td>Pull request</td><td>Pull request</td></tr>
<tr><td>Grouping</td><td>Organization / Enterprise</td><td>Group / subgroup (nested)</td><td>Workspace / project</td><td>Organization / project</td></tr>
<tr><td>Protecting main</td><td>Branch protection rules, <strong>rulesets</strong></td><td>Protected branches + MR approval rules</td><td>Branch restrictions + merge checks</td><td>Branch policies</td></tr>
<tr><td>Wait-for-green merging</td><td>Merge queue</td><td>Merge trains (Premium)</td><td>— (no native queue)</td><td>— (auto-complete only)</td></tr>
<tr><td>Built-in CI</td><td>GitHub Actions</td><td>GitLab CI/CD</td><td>Bitbucket Pipelines</td><td>Azure Pipelines</td></tr>
<tr><td>Packages / images</td><td>GitHub Packages, ghcr.io</td><td>Package + Container Registry</td><td>— (use JFrog/Nexus/cloud registry)</td><td>Azure Artifacts</td></tr>
<tr><td>Self-hosted edition</td><td>GitHub Enterprise Server (GHES)</td><td>Self-managed CE/EE, GitLab Dedicated</td><td>Bitbucket Data Center</td><td>Azure DevOps Server</td></tr>
</table>
<p>Merge strategies are configured per repo/project everywhere:</p>
<ul>
<li><strong>GitHub</strong>: allow any of merge commit / squash / rebase-and-merge; optional "require linear history".</li>
<li><strong>GitLab</strong>: merge commit, merge commit with semi-linear history, or fast-forward; squash can be off / allowed / encouraged / required.</li>
<li><strong>Bitbucket</strong>: merge commit, squash, fast-forward (plus rebase variants).</li>
<li><strong>Azure DevOps</strong>: basic merge (no-ff), squash, rebase + fast-forward, semi-linear merge — and branch policy can restrict which ones are allowed.</li>
</ul>
<blockquote>💡 Real world: in Israel the common pattern is GitHub (Team/Enterprise Cloud) for startups, GitLab self-managed in regulated companies (banks, defense, health) that need code on-prem, Bitbucket where Jira/Confluence already rule, and Azure DevOps in Microsoft-heavy enterprises.</blockquote>`,
        he: `<table>
<tr><th>מושג</th><th>GitHub</th><th>GitLab</th><th>Bitbucket Cloud</th><th>Azure DevOps</th></tr>
<tr><td>הצעת שינוי</td><td>Pull Request (PR)</td><td>Merge Request (MR)</td><td>Pull request</td><td>Pull request</td></tr>
<tr><td>קיבוץ</td><td>Organization / Enterprise</td><td>Group / subgroup (מקוננים)</td><td>Workspace / project</td><td>Organization / project</td></tr>
<tr><td>הגנה על main</td><td>Branch protection rules, <strong>rulesets</strong></td><td>Protected branches + MR approval rules</td><td>Branch restrictions + merge checks</td><td>Branch policies</td></tr>
<tr><td>Merge רק כשירוק</td><td>Merge queue</td><td>Merge trains (Premium)</td><td>— (אין תור מובנה)</td><td>— (רק auto-complete)</td></tr>
<tr><td>CI מובנה</td><td>GitHub Actions</td><td>GitLab CI/CD</td><td>Bitbucket Pipelines</td><td>Azure Pipelines</td></tr>
<tr><td>Packages ו-images</td><td>GitHub Packages, ghcr.io</td><td>Package + Container Registry</td><td>— (משתמשים ב-JFrog/Nexus/registry של הענן)</td><td>Azure Artifacts</td></tr>
<tr><td>גרסה בניהול עצמי</td><td>GitHub Enterprise Server (GHES)</td><td>Self-managed CE/EE, GitLab Dedicated</td><td>Bitbucket Data Center</td><td>Azure DevOps Server</td></tr>
</table>
<p>אסטרטגיות merge מוגדרות בכל הפלטפורמות לכל repo או project:</p>
<ul>
<li><strong>GitHub</strong>: מאפשרים כל אחד מ-merge commit / squash / rebase-and-merge; אפשר גם "require linear history".</li>
<li><strong>GitLab</strong>: merge commit, merge commit עם היסטוריה semi-linear, או fast-forward; squash יכול להיות כבוי / מותר / מומלץ / חובה.</li>
<li><strong>Bitbucket</strong>: merge commit, squash, fast-forward (ועוד וריאציות של rebase).</li>
<li><strong>Azure DevOps</strong>: basic merge (no-ff), squash, rebase + fast-forward, semi-linear merge — ו-branch policy יכולה להגביל אילו מהם מותרים.</li>
</ul>
<blockquote>💡 Real world: בארץ הדפוס הנפוץ הוא GitHub (Team או Enterprise Cloud) בסטארטאפים, GitLab בניהול עצמי בחברות מפוקחות (בנקים, ביטחון, בריאות) שצריכות את הקוד on-prem, Bitbucket איפה ש-Jira ו-Confluence כבר שולטים, ו-Azure DevOps בארגונים שחיים בעולם של Microsoft.</blockquote>`
      }
    },
    {
      h: { en: "Reviews, approvals, branch protection vs rulesets", he: "Reviews, אישורים, ו-branch protection מול rulesets" },
      body: {
        en: `<p>On GitHub, the classic <strong>branch protection rule</strong> applies one rule per branch pattern, per repo. <strong>Rulesets</strong> (GA 2023) are the newer model: several rulesets can apply to the same branch and <em>stack</em> (the strictest wins), they can target tags too, they can be defined at <strong>org level</strong> across hundreds of repos (Enterprise plan), have an explicit <strong>bypass list</strong> (roles, teams, GitHub Apps), and can run in <em>Evaluate</em> mode to see what would be blocked before enforcing. They're visible to anyone with read access, so devs can see why a push was rejected.</p>
<p>A typical ruleset for <code>main</code>:</p>
<ul>
<li>Restrict deletions, block force pushes</li>
<li>Require a pull request: 1-2 approvals, <strong>dismiss stale approvals on new commits</strong>, require review from Code Owners, <strong>require approval of the most recent reviewable push</strong> (so the author can't push after approval)</li>
<li>Require status checks: e.g. <code>build</code>, <code>test</code>, <code>security/codeql</code> — matched by check <em>name</em></li>
<li>Require linear history and/or signed commits; require merge queue</li>
</ul>
<pre>
# Inspect what actually protects main (rulesets + legacy protection)
gh api repos/acme/api/rules/branches/main | jq '.[].type'
"deletion"
"non_fast_forward"
"pull_request"
"required_status_checks"
"merge_queue"
</pre>
<p><strong>GitLab</strong> splits it into <em>protected branches</em> (who may push/merge, force push allowed or not) and <em>MR approval rules</em> (how many approvals from which groups; enforced rules and CODEOWNERS approvals are Premium). "Pipelines must succeed" is a project setting. <strong>Merge trains</strong> are GitLab's merge queue.</p>
<p><strong>Merge queue</strong> on GitHub: when a PR is queued, GitHub creates a temporary <code>gh-readonly-queue/main/...</code> branch with main + PRs ahead of it and runs CI there. Your workflows must listen to the <code>merge_group</code> event or the required checks never report and the queue stalls.</p>
<pre>
on:
  pull_request:
  merge_group:          # without this, queued PRs wait forever for "build"
</pre>
<blockquote>⚠️ Production tip: a required status check whose job is skipped by a <code>paths:</code> filter stays "Expected — Waiting for status to be reported" and blocks the PR forever. Either make the check always run (and exit early inside), or use a final aggregator job that is always required.</blockquote>`,
        he: `<p>ב-GitHub, ה-<strong>branch protection rule</strong> הקלאסי מפעיל חוק אחד לכל pattern של branch, לכל repo. <strong>Rulesets</strong> (GA ב-2023) הם המודל החדש: כמה rulesets יכולים לחול על אותו branch ו-<em>להצטבר</em> (המחמיר מנצח), הם יכולים לחול גם על tags, אפשר להגדיר אותם <strong>ברמת ה-org</strong> על מאות repos (בתוכנית Enterprise), יש להם <strong>bypass list</strong> מפורש (roles, teams, GitHub Apps), ואפשר להריץ אותם במצב <em>Evaluate</em> כדי לראות מה היה נחסם לפני האכיפה. כל מי שיש לו read רואה אותם, כך שמפתח יכול להבין למה ה-push שלו נדחה.</p>
<p>Ruleset טיפוסי ל-<code>main</code>:</p>
<ul>
<li>חסימת מחיקות, חסימת force push</li>
<li>חובת pull request: 1-2 אישורים, <strong>ביטול אישורים ישנים כשנכנס commit חדש</strong>, חובת review מ-Code Owners, <strong>חובת אישור של ה-push האחרון</strong> (כדי שה-author לא יוכל לדחוף אחרי האישור)</li>
<li>חובת status checks: למשל <code>build</code>, <code>test</code>, <code>security/codeql</code> — לפי <em>שם</em> ה-check</li>
<li>חובת היסטוריה לינארית ו/או commits חתומים; חובת merge queue</li>
</ul>
<pre>
# Inspect what actually protects main (rulesets + legacy protection)
gh api repos/acme/api/rules/branches/main | jq '.[].type'
"deletion"
"non_fast_forward"
"pull_request"
"required_status_checks"
"merge_queue"
</pre>
<p><strong>GitLab</strong> מפצל את זה ל-<em>protected branches</em> (מי מורשה לדחוף ולעשות merge, האם force push מותר) ול-<em>MR approval rules</em> (כמה אישורים מאילו groups; חוקים נאכפים ואישורי CODEOWNERS הם ב-Premium). "Pipelines must succeed" היא הגדרה של ה-project. <strong>Merge trains</strong> הם ה-merge queue של GitLab.</p>
<p><strong>Merge queue</strong> ב-GitHub: כש-PR נכנס לתור, GitHub יוצר branch זמני <code>gh-readonly-queue/main/...</code> עם main ועוד ה-PR-ים שלפניו ומריץ עליו CI. ה-workflows שלך חייבים להאזין ל-event של <code>merge_group</code>, אחרת ה-checks החובה אף פעם לא מדווחים והתור נתקע.</p>
<pre>
on:
  pull_request:
  merge_group:          # without this, queued PRs wait forever for "build"
</pre>
<blockquote>⚠️ Production tip: required status check שה-job שלו מדולג בגלל filter של <code>paths:</code> נשאר על "Expected — Waiting for status to be reported" וחוסם את ה-PR לנצח. או שתגרום ל-check לרוץ תמיד (ולצאת מוקדם בפנים), או שתשתמש ב-job מסכם בסוף שהוא תמיד ה-check החובה.</blockquote>`
      }
    },
    {
      h: { en: "CI side by side: Actions vs GitLab CI vs Pipelines", he: "CI זה מול זה: Actions מול GitLab CI מול Pipelines" },
      body: {
        en: `<p>The same "test on MR, deploy main" pipeline in GitLab CI (<code>.gitlab-ci.yml</code>). Jobs belong to <strong>stages</strong>; stages run in order, jobs in a stage in parallel; <code>needs:</code> builds a DAG that skips stage ordering.</p>
<pre>
stages: [test, build, deploy]

default:
  image: node:22-alpine
  cache:
    key: { files: [package-lock.json] }
    paths: [.npm/]

test:
  stage: test
  script:
    - npm ci --cache .npm --prefer-offline
    - npm test -- --ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build-image:
  stage: build
  image: docker:27
  services: [docker:27-dind]
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-prod:
  stage: deploy
  needs: [build-image]
  environment: production
  when: manual
  script: ["./deploy.sh $CI_COMMIT_SHORT_SHA"]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
</pre>
<table>
<tr><th></th><th>GitHub Actions</th><th>GitLab CI</th><th>Bitbucket Pipelines</th></tr>
<tr><td>File</td><td><code>.github/workflows/*.yml</code> (many)</td><td><code>.gitlab-ci.yml</code> (one, with <code>include:</code>)</td><td><code>bitbucket-pipelines.yml</code></td></tr>
<tr><td>Reuse</td><td>Marketplace actions, reusable workflows</td><td><code>include:</code> templates, CI/CD components catalog</td><td>Pipes</td></tr>
<tr><td>Self-hosted runners</td><td>Actions runner; ARC on Kubernetes</td><td><code>gitlab-runner</code> with shell/docker/kubernetes executors</td><td>Linux/Windows/macOS runners</td></tr>
<tr><td>Cloud auth</td><td>OIDC (<code>id-token: write</code>)</td><td>OIDC (<code>id_tokens:</code>)</td><td>OIDC</td></tr>
<tr><td>Built-in registry</td><td>ghcr.io</td><td><code>$CI_REGISTRY</code> per project</td><td>none</td></tr>
</table>
<pre>
# Register a GitLab runner on a k8s-capable VM (token from Settings &gt; CI/CD &gt; Runners)
gitlab-runner register --non-interactive \
  --url https://gitlab.example.com --token glrt-XXXXXXXX \
  --executor docker --docker-image alpine:3.20
</pre>
<blockquote>💡 Real world: GitLab's single-file pipeline with <code>rules:</code> is easy to reason about but turns into a 2,000-line monster; use <code>include:</code> and components early. GitHub's many-small-workflows model scales better per team but makes "what runs on this PR?" harder to answer.</blockquote>`,
        he: `<p>אותו pipeline של "טסטים על MR, deploy מ-main" ב-GitLab CI (<code>.gitlab-ci.yml</code>). Jobs שייכים ל-<strong>stages</strong>; ה-stages רצים לפי הסדר, jobs באותו stage רצים במקביל; <code>needs:</code> בונה DAG שעוקף את סדר ה-stages.</p>
<pre>
stages: [test, build, deploy]

default:
  image: node:22-alpine
  cache:
    key: { files: [package-lock.json] }
    paths: [.npm/]

test:
  stage: test
  script:
    - npm ci --cache .npm --prefer-offline
    - npm test -- --ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build-image:
  stage: build
  image: docker:27
  services: [docker:27-dind]
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-prod:
  stage: deploy
  needs: [build-image]
  environment: production
  when: manual
  script: ["./deploy.sh $CI_COMMIT_SHORT_SHA"]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
</pre>
<table>
<tr><th></th><th>GitHub Actions</th><th>GitLab CI</th><th>Bitbucket Pipelines</th></tr>
<tr><td>קובץ</td><td><code>.github/workflows/*.yml</code> (הרבה)</td><td><code>.gitlab-ci.yml</code> (אחד, עם <code>include:</code>)</td><td><code>bitbucket-pipelines.yml</code></td></tr>
<tr><td>שימוש חוזר</td><td>Actions מה-Marketplace, reusable workflows</td><td>Templates עם <code>include:</code>, קטלוג CI/CD components</td><td>Pipes</td></tr>
<tr><td>Runners בניהול עצמי</td><td>Actions runner; ARC על Kubernetes</td><td><code>gitlab-runner</code> עם executors של shell/docker/kubernetes</td><td>Runners ל-Linux/Windows/macOS</td></tr>
<tr><td>אימות מול הענן</td><td>OIDC (<code>id-token: write</code>)</td><td>OIDC (<code>id_tokens:</code>)</td><td>OIDC</td></tr>
<tr><td>Registry מובנה</td><td>ghcr.io</td><td><code>$CI_REGISTRY</code> לכל project</td><td>אין</td></tr>
</table>
<pre>
# Register a GitLab runner on a k8s-capable VM (token from Settings &gt; CI/CD &gt; Runners)
gitlab-runner register --non-interactive \
  --url https://gitlab.example.com --token glrt-XXXXXXXX \
  --executor docker --docker-image alpine:3.20
</pre>
<blockquote>💡 Real world: ה-pipeline של GitLab בקובץ אחד עם <code>rules:</code> קל להבנה אבל הופך למפלצת של 2,000 שורות; תתחיל עם <code>include:</code> ו-components מוקדם. המודל של GitHub עם הרבה workflows קטנים מתרחב טוב יותר לכל צוות, אבל מקשה לענות על "מה רץ על ה-PR הזה?".</blockquote>`
      }
    },
    {
      h: { en: "SaaS vs self-managed, and migrating between platforms", he: "SaaS מול ניהול עצמי, ומיגרציה בין פלטפורמות" },
      body: {
        en: `<p><strong>SaaS</strong> (github.com, gitlab.com, bitbucket.org, dev.azure.com): no upgrades, no backups to run, newest features first; you accept their uptime and data location (GitHub Enterprise Cloud now offers data residency on <code>GHE.com</code>, GitLab offers <strong>Dedicated</strong> single-tenant SaaS).</p>
<p><strong>Self-managed</strong> (GHES appliance VM, GitLab Omnibus or Helm chart, Bitbucket Data Center, Azure DevOps Server): code never leaves your network, but you own HA, backups, upgrades (GHES ships a feature release roughly quarterly and supports each for about a year; GitLab ships monthly) and runner fleets. Budget roughly one platform engineer per few thousand users just to keep it healthy and upgraded.</p>
<p><strong>Migration</strong>: the Git part is trivial; everything around it is not.</p>
<pre>
# 1) Git data: all branches, tags and refs
git clone --mirror https://gitlab.example.com/acme/api.git
cd api.git &amp;&amp; git push --mirror git@github.com:acme/api.git
#    (LFS objects are separate: git lfs fetch --all &amp;&amp; git lfs push --all origin)

# 2) PRs/issues/comments: use the platform importers
gh extension install github/gh-gei
gh gei migrate-repo --github-source-org old-org --source-repo api \
                    --github-target-org new-org --target-repo api
#    (GEI sources: GitHub.com, GHES, Azure DevOps, Bitbucket Server/DC;
#     GitLab has a built-in "Import from GitHub/Bitbucket" in the UI)

# 3) CI: convert pipelines, then fix by hand
gh actions-importer dry-run gitlab --project acme/api --output-dir out/
</pre>
<p>What does <em>not</em> move by itself: CI secrets (never exported — re-create them), webhooks and integrations, runners, branch protection/approval rules, user identity mapping (commit authors map by email; reviews map by account), and every hardcoded <code>git@gitlab...</code> URL in submodules, Terraform modules, Helm charts and Dockerfiles.</p>
<blockquote>⚠️ Production tip: migrate in waves, freeze writes on the source repo during its cutover (archive or read-only), and leave the old repo archived with a README pointing to the new location for at least a few months — scripts and bookmarks will hit it.</blockquote>`,
        he: `<p><strong>SaaS</strong> (github.com, gitlab.com, bitbucket.org, dev.azure.com): אין upgrades, אין backups להריץ, הפיצ'רים החדשים מגיעים קודם; אתה מקבל את ה-uptime ואת מיקום המידע שלהם (GitHub Enterprise Cloud מציע היום data residency ב-<code>GHE.com</code>, ו-GitLab מציע <strong>Dedicated</strong> — SaaS ייעודי ל-tenant אחד).</p>
<p><strong>ניהול עצמי</strong> (VM appliance של GHES, GitLab ב-Omnibus או Helm chart, Bitbucket Data Center, Azure DevOps Server): הקוד אף פעם לא יוצא מהרשת שלך, אבל ה-HA, ה-backups, ה-upgrades (GHES מוציא feature release בערך כל רבעון ותומך בכל אחד בערך שנה; GitLab מוציא גרסה כל חודש) וצי ה-runners — הכל עליך. תתקצב בערך מהנדס platform אחד לכל כמה אלפי משתמשים רק כדי לשמור אותו בריא ומעודכן.</p>
<p><strong>מיגרציה</strong>: החלק של Git טריוויאלי; כל מה שמסביב — לא.</p>
<pre>
# 1) Git data: all branches, tags and refs
git clone --mirror https://gitlab.example.com/acme/api.git
cd api.git &amp;&amp; git push --mirror git@github.com:acme/api.git
#    (LFS objects are separate: git lfs fetch --all &amp;&amp; git lfs push --all origin)

# 2) PRs/issues/comments: use the platform importers
gh extension install github/gh-gei
gh gei migrate-repo --github-source-org old-org --source-repo api \
                    --github-target-org new-org --target-repo api
#    (GEI sources: GitHub.com, GHES, Azure DevOps, Bitbucket Server/DC;
#     GitLab has a built-in "Import from GitHub/Bitbucket" in the UI)

# 3) CI: convert pipelines, then fix by hand
gh actions-importer dry-run gitlab --project acme/api --output-dir out/
</pre>
<p>מה <em>לא</em> עובר לבד: secrets של CI (אף פעם לא מיוצאים — יוצרים מחדש), webhooks ואינטגרציות, runners, חוקי branch protection ואישורים, מיפוי זהויות (authors של commits ממופים לפי email; reviews לפי חשבון), וכל URL קשיח של <code>git@gitlab...</code> ב-submodules, מודולים של Terraform, Helm charts ו-Dockerfiles.</p>
<blockquote>⚠️ Production tip: תעשה מיגרציה בגלים, תקפיא כתיבה ל-repo המקור בזמן המעבר שלו (archive או read-only), ותשאיר את ה-repo הישן ב-archive עם README שמפנה למיקום החדש לפחות כמה חודשים — סקריפטים ו-bookmarks עוד יגיעו אליו.</blockquote>`
      }
    }
  ],
  diagram: "dev ── push ──► [ Git hosting ]\n                 ├─ PR / MR  ──► rules: approvals, CODEOWNERS, required checks\n                 ├─ CI       ──► runners (SaaS or self-hosted) ──► registry\n                 └─ merge    ──► queue / train ──► main (protected)\nGitHub: rulesets + Actions + ghcr | GitLab: protected branches + approval rules + .gitlab-ci.yml + $CI_REGISTRY",
  handsOn: [
    { cmd: "gh api repos/OWNER/REPO/rules/branches/main | jq '.[] | {type, ruleset_id}'",
      what: { en: "See every rule (from all stacked rulesets) that applies to main in a GitHub repo.", he: "לראות כל חוק (מכל ה-rulesets המצטברים) שחל על main ב-repo של GitHub." } },
    { cmd: "gh pr merge 123 --squash --auto",
      what: { en: "Enable auto-merge (or enqueue, if the branch requires a merge queue) once checks and reviews pass.", he: "להפעיל auto-merge (או להכניס לתור, אם ה-branch דורש merge queue) ברגע שה-checks וה-reviews עוברים." } },
    { cmd: "glab mr create --fill --target-branch main && glab ci status",
      what: { en: "GitLab's CLI: open an MR from the current branch and watch its pipeline.", he: "ה-CLI של GitLab: לפתוח MR מה-branch הנוכחי ולעקוב אחרי ה-pipeline שלו." } },
    { cmd: "git clone --mirror SRC_URL repo.git && cd repo.git && git push --mirror DST_URL",
      what: { en: "Move all Git refs between platforms (PRs, issues and CI secrets do NOT come along).", he: "להעביר את כל ה-refs של Git בין פלטפורמות (PR-ים, issues ו-secrets של CI לא עוברים)." } }
  ],
  mnemonic: {
    en: "Git is the cargo, the platform is the port: compare the Cranes (CI), the Customs (rules & approvals), the Warehouse (registry) and the Land (SaaS or self-managed).",
    he: "Git הוא המטען, הפלטפורמה היא הנמל: משווים מנופים (CI), מכס (חוקים ואישורים), מחסן (registry) וקרקע (SaaS או ניהול עצמי)."
  },
  pitfalls: [
    { en: "Enabling a merge queue without adding the merge_group trigger to the workflows that produce required checks: every queued PR times out.",
      he: "להפעיל merge queue בלי להוסיף את ה-trigger של merge_group ל-workflows שמייצרים את ה-checks החובה: כל PR בתור נתקע עד timeout." },
    { en: "Required check names drift: rename a job from 'test' to 'unit-tests' and every PR blocks on a check that will never report.",
      he: "שמות של checks חובה זזים: משנים שם של job מ-'test' ל-'unit-tests' וכל PR נחסם על check שאף פעם לא ידווח." },
    { en: "Assuming git push --mirror migrates everything: PRs, review history, CI secrets, webhooks, LFS objects and protection rules all need separate steps.",
      he: "להניח ש-git push --mirror מעביר הכל: PR-ים, היסטוריית reviews, secrets של CI, webhooks, אובייקטי LFS וחוקי הגנה — כל אחד מהם צריך שלב נפרד." },
    { en: "Leaving admins out of enforcement ('include administrators' off, or a broad bypass list): the one person who force-pushes main at 2 AM is always an admin.",
      he: "להשאיר admins מחוץ לאכיפה ('include administrators' כבוי, או bypass list רחב): מי שעושה force push ל-main בשתיים בלילה הוא תמיד admin." }
  ],
  interview: [
    { q: { en: "What's the difference between GitHub branch protection rules and rulesets?", he: "מה ההבדל בין branch protection rules ל-rulesets ב-GitHub?" },
      a: { en: "Branch protection is one rule per branch pattern per repo, visible only to admins. Rulesets can stack (strictest wins), target branches and tags, be defined once at org level for many repos, have explicit bypass actors, support an evaluate (dry-run) mode, and are visible to everyone with read access.",
           he: "Branch protection הוא חוק אחד לכל pattern של branch לכל repo, וגלוי רק ל-admins. Rulesets יכולים להצטבר (המחמיר מנצח), לחול על branches ועל tags, להיות מוגדרים פעם אחת ברמת ה-org להרבה repos, עם bypass actors מפורשים, מצב evaluate (dry-run), והם גלויים לכל מי שיש לו read." } },
    { q: { en: "Why use a merge queue (or GitLab merge train) instead of 'require branches to be up to date'?", he: "למה להשתמש ב-merge queue (או merge train ב-GitLab) במקום 'require branches to be up to date'?" },
      a: { en: "'Up to date' forces each author to rebase and rerun CI after every merge — with 30 PRs a day it becomes a race nobody wins. A queue tests each PR on top of main plus the PRs ahead of it, batches them, and merges automatically, so main stays green without manual rebase loops.",
           he: "'Up to date' מכריח כל author לעשות rebase ולהריץ CI מחדש אחרי כל merge — עם 30 PR-ים ביום זה הופך למרוץ שאף אחד לא מנצח. התור בודק כל PR על גבי main ועוד ה-PR-ים שלפניו, מקבץ אותם ועושה merge אוטומטי, כך ש-main נשאר ירוק בלי לולאות rebase ידניות." } }
  ],
  quiz: [
    { q: { en: "GitLab's equivalent of a GitHub Pull Request is called…", he: "המקבילה ב-GitLab ל-Pull Request של GitHub נקראת…" },
      options: [
        { en: "Change List", he: "Change List" },
        { en: "Merge Request", he: "Merge Request" },
        { en: "Patch Set", he: "Patch Set" },
        { en: "Review Branch", he: "Review Branch" }
      ], answer: 1,
      explain: { en: "GitLab calls it a Merge Request (MR); Gerrit uses changes/patch sets, Perforce uses changelists.", he: "ב-GitLab זה Merge Request (MR); ב-Gerrit יש changes ו-patch sets, וב-Perforce יש changelists." } },
    { q: { en: "You enabled GitHub's merge queue and now every queued PR hangs waiting for the required 'build' check. Most likely cause?", he: "הפעלת merge queue ב-GitHub ועכשיו כל PR בתור תקוע ומחכה ל-check החובה 'build'. הסיבה הכי סבירה?" },
      options: [
        { en: "Merge queues require squash merging", he: "Merge queue דורש squash merge" },
        { en: "The workflow that runs 'build' doesn't trigger on the merge_group event", he: "ה-workflow שמריץ את 'build' לא מופעל על event של merge_group" },
        { en: "CODEOWNERS is missing", he: "חסר CODEOWNERS" },
        { en: "The runner is shallow-cloning", he: "ה-runner עושה shallow clone" }
      ], answer: 1,
      explain: { en: "The queue runs CI on a temporary gh-readonly-queue/... branch and fires merge_group; workflows must subscribe to it to report the required checks.", he: "התור מריץ CI על branch זמני gh-readonly-queue/... ומפעיל merge_group; ה-workflows חייבים להאזין לו כדי לדווח על ה-checks החובה." } },
    { q: { en: "In .gitlab-ci.yml, what does `needs:` do?", he: "ב-.gitlab-ci.yml, מה עושה `needs:`?" },
      options: [
        { en: "Declares required approvals for the MR", he: "מגדיר אישורים חובה ל-MR" },
        { en: "Lists packages to install in the image", he: "מפרט packages להתקנה ב-image" },
        { en: "Makes a job start as soon as the listed jobs finish, forming a DAG instead of waiting for the whole previous stage", he: "גורם ל-job להתחיל מיד כשה-jobs שברשימה מסתיימים, ויוצר DAG במקום לחכות לכל ה-stage הקודם" },
        { en: "Pins the runner version", he: "מצמיד את גרסת ה-runner" }
      ], answer: 2,
      explain: { en: "Without needs:, jobs wait for every job in all earlier stages; needs: lets independent chains run ahead.", he: "בלי needs:, jobs מחכים לכל ה-jobs בכל ה-stages הקודמים; needs: מאפשר לשרשראות בלתי תלויות להתקדם." } },
    { q: { en: "After `git push --mirror` from GitLab to GitHub, what has been migrated?", he: "אחרי `git push --mirror` מ-GitLab ל-GitHub, מה עבר?" },
      options: [
        { en: "Branches, tags and other refs — but not MRs, comments, CI secrets or protection rules", he: "Branches, tags ושאר ה-refs — אבל לא MR-ים, תגובות, secrets של CI או חוקי הגנה" },
        { en: "Everything including MRs and CI variables", he: "הכל, כולל MR-ים ומשתני CI" },
        { en: "Only the default branch", he: "רק ה-default branch" },
        { en: "Branches and CI secrets, but not tags", he: "Branches ו-secrets של CI, אבל לא tags" }
      ], answer: 0,
      explain: { en: "--mirror copies all refs; platform metadata needs importers (GEI, GitLab importers), LFS needs lfs push --all, and secrets are re-created by hand.", he: "--mirror מעתיק את כל ה-refs; metadata של הפלטפורמה צריך importers (GEI, ה-importers של GitLab), LFS צריך lfs push --all, ו-secrets יוצרים מחדש ידנית." } }
  ],
  related: ["git-workflow", "cicd-github-actions", "cloud-cicd", "pr-code-review-quality", "git-repo-security"]
});

/* ------------------------------------------------------------------ 3. Securing repos & the Git server */
INFRA.lessons.push({
  id: "git-repo-security",
  track: "git",
  order: 7,
  icon: "🔐",
  level: 3,
  minutes: 17,
  title: { en: "Securing Repos & the Git Server", he: "אבטחת repos ושרת ה-Git" },
  tldr: {
    en: "Your Git host is a production system holding your IP and the keys to deploy it: short-lived, scoped credentials (GitHub Apps, fine-grained PATs, SSO), protected main with no bypass, signed commits, secret scanning with push protection, automated dependency updates, audit logs streamed out, and backups you actually tested.",
    he: "שרת ה-Git שלך הוא מערכת production שמחזיקה את ה-IP שלך ואת המפתחות ל-deploy שלו: credentials קצרי חיים ומוגבלים (GitHub Apps, fine-grained PATs, SSO), main מוגן בלי עקיפות, commits חתומים, secret scanning עם push protection, עדכוני תלויות אוטומטיים, audit logs שיוצאים החוצה, ו-backups שבאמת בדקת."
  },
  analogy: {
    en: "The repo is a bank vault. SSH keys and tokens are the keys — prefer keys that open one door and expire tonight (GitHub App tokens) over a master key cut years ago (a classic PAT). Signed commits are signatures on every deposit slip. Push protection is the guard who stops you at the door with cash sticking out of your pocket. Audit logs are the CCTV — useless if nobody stores the tapes.",
    he: "ה-repo הוא כספת בנק. מפתחות SSH ו-tokens הם המפתחות — עדיף מפתח שפותח דלת אחת ופג הלילה (token של GitHub App) על מפתח מאסטר שהועתק לפני שנים (classic PAT). commits חתומים הם החתימה על כל טופס הפקדה. Push protection הוא השומר שעוצר אותך בדלת כשכסף מזדקר לך מהכיס. Audit logs הם המצלמות — חסרות ערך אם אף אחד לא שומר את ההקלטות."
  },
  sections: [
    {
      h: { en: "Who can push: SSH keys, PATs, deploy keys, GitHub Apps", he: "מי יכול לדחוף: SSH keys, PATs, deploy keys ו-GitHub Apps" },
      body: {
        en: `<table>
<tr><th>Credential</th><th>Scope</th><th>Lifetime</th><th>Use for</th></tr>
<tr><td>User SSH key</td><td>Everything the user can access</td><td>Until removed</td><td>Humans; prefer <code>ed25519-sk</code> (FIDO hardware key)</td></tr>
<tr><td>Classic PAT</td><td>Coarse scopes (<code>repo</code> = all repos you can see)</td><td>Optional expiry</td><td>Avoid; block at org level</td></tr>
<tr><td>Fine-grained PAT</td><td>Selected repos + specific permissions</td><td>Expiry required; org can cap it and require approval</td><td>Personal automation</td></tr>
<tr><td>Deploy key</td><td>One repo, read-only by default</td><td>Until removed</td><td>A server that pulls one repo</td></tr>
<tr><td>GitHub App</td><td>Installed repos + declared permissions; acts as a bot</td><td>Installation token: <strong>1 hour</strong></td><td>CI, bots, integrations</td></tr>
<tr><td>OAuth App</td><td>Acts <em>as the user</em> with granted scopes</td><td>Until revoked</td><td>"Sign in with GitHub" tools</td></tr>
</table>
<pre>
# Hardware-backed SSH key (touch required for every push)
ssh-keygen -t ed25519-sk -C "dana@acme laptop" -O resident
ssh -T git@github.com        # "Hi dana! You've successfully authenticated..."

# Org policy (Settings &gt; Personal access tokens): restrict classic PATs,
# require approval + max 90-day lifetime for fine-grained PATs.
</pre>
<p><strong>SSO + SCIM</strong>: SAML/OIDC SSO forces login through your IdP (Entra ID, Okta, Google), and PATs/SSH keys must be explicitly authorized for the SSO org. SCIM provisioning means removing a user in the IdP removes them from the org within minutes. GitHub <strong>Enterprise Managed Users</strong> goes further: accounts are created and owned by the IdP and can't contribute to public repos.</p>
<blockquote>💡 Real world: the top source of repo compromise is not Git itself but long-lived tokens in CI systems, laptops and third-party tools (the 2022 Heroku/Travis CI OAuth token theft let attackers clone private repos of dozens of orgs). Inventory them: <code>gh api orgs/ORG/personal-access-tokens</code> and the org's authorized OAuth apps list.</blockquote>`,
        he: `<table>
<tr><th>Credential</th><th>Scope</th><th>אורך חיים</th><th>שימוש</th></tr>
<tr><td>SSH key של משתמש</td><td>כל מה שהמשתמש רואה</td><td>עד שמוחקים</td><td>בני אדם; עדיף <code>ed25519-sk</code> (מפתח חומרה FIDO)</td></tr>
<tr><td>Classic PAT</td><td>Scopes גסים (<code>repo</code> = כל ה-repos שאתה רואה)</td><td>תפוגה אופציונלית</td><td>להימנע; לחסום ברמת ה-org</td></tr>
<tr><td>Fine-grained PAT</td><td>Repos נבחרים + הרשאות ספציפיות</td><td>תפוגה חובה; ה-org יכול להגביל ולדרוש אישור</td><td>אוטומציה אישית</td></tr>
<tr><td>Deploy key</td><td>Repo אחד, read-only כברירת מחדל</td><td>עד שמוחקים</td><td>שרת שמושך repo אחד</td></tr>
<tr><td>GitHub App</td><td>Repos שהותקן עליהם + הרשאות מוצהרות; פועל כ-bot</td><td>Installation token: <strong>שעה</strong></td><td>CI, bots, אינטגרציות</td></tr>
<tr><td>OAuth App</td><td>פועל <em>בשם המשתמש</em> עם ה-scopes שאושרו</td><td>עד ביטול</td><td>כלים עם "Sign in with GitHub"</td></tr>
</table>
<pre>
# Hardware-backed SSH key (touch required for every push)
ssh-keygen -t ed25519-sk -C "dana@acme laptop" -O resident
ssh -T git@github.com        # "Hi dana! You've successfully authenticated..."

# Org policy (Settings &gt; Personal access tokens): restrict classic PATs,
# require approval + max 90-day lifetime for fine-grained PATs.
</pre>
<p><strong>SSO + SCIM</strong>: SSO של SAML/OIDC מכריח התחברות דרך ה-IdP שלך (Entra ID, Okta, Google), ו-PATs ו-SSH keys חייבים אישור מפורש ל-org עם SSO. SCIM provisioning אומר שהסרת משתמש ב-IdP מוציאה אותו מה-org תוך דקות. <strong>Enterprise Managed Users</strong> של GitHub הולך רחוק יותר: החשבונות נוצרים ושייכים ל-IdP ולא יכולים לתרום ל-repos ציבוריים.</p>
<blockquote>💡 Real world: המקור המוביל לפריצה ל-repos הוא לא Git עצמו אלא tokens ארוכי חיים במערכות CI, בלפטופים ובכלים של צד שלישי (גניבת ה-OAuth tokens של Heroku ו-Travis CI ב-2022 אפשרה לתוקפים לעשות clone ל-repos פרטיים של עשרות ארגונים). תעשה להם מצאי: <code>gh api orgs/ORG/personal-access-tokens</code> ורשימת ה-OAuth apps המאושרים של ה-org.</blockquote>`
      }
    },
    {
      h: { en: "Signed commits and tags: GPG, SSH, gitsign", he: "Commits ו-tags חתומים: GPG, SSH ו-gitsign" },
      body: {
        en: `<p><code>user.name</code> and <code>user.email</code> are free text — anyone can commit as your CTO. A signature proves the commit was made by someone holding a key the platform links to that account, and that the content wasn't altered.</p>
<pre>
# SSH signing (Git 2.34+): reuse the key you already have
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
# upload the same public key on GitHub as a "Signing key" (separate from auth key)

# Verify locally (needs an allowed-signers file for SSH)
echo "dana@acme.com $(cat ~/.ssh/id_ed25519.pub)" &gt; ~/.config/git/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
git log --show-signature -1
git tag -s v2.4.0 -m "release" &amp;&amp; git tag -v v2.4.0

# Keyless with Sigstore: short-lived cert from your OIDC login, logged in Rekor
git config --local gpg.x509.program gitsign
git config --local gpg.format x509
</pre>
<table>
<tr><th></th><th>GPG</th><th>SSH</th><th>gitsign (Sigstore)</th></tr>
<tr><td>Key management</td><td>Painful (keyrings, expiry, subkeys)</td><td>Easy, often the same key</td><td>No long-lived key: ~10-minute Fulcio cert</td></tr>
<tr><td>Platform "Verified" badge</td><td>GitHub, GitLab, Bitbucket</td><td>GitHub, GitLab</td><td>Not natively on GitHub (verify with <code>gitsign verify</code> / policy)</td></tr>
</table>
<p><strong>Vigilant mode</strong> (GitHub profile setting) flips the default: any commit attributed to you that <em>isn't</em> signed shows as "Unverified", so impersonation becomes visible. Enforce with the ruleset rule <strong>Require signed commits</strong> (commits made in the web UI are signed by GitHub's key and pass).</p>
<blockquote>⚠️ Production tip: "require signed commits" plus rebase-merge breaks — GitHub can't re-sign your rebased commits with your key. Use squash or merge commits (GitHub signs those) when you enforce signatures.</blockquote>`,
        he: `<p><code>user.name</code> ו-<code>user.email</code> הם טקסט חופשי — כל אחד יכול לעשות commit בתור ה-CTO שלך. חתימה מוכיחה שה-commit נוצר ע"י מי שמחזיק מפתח שהפלטפורמה מקשרת לחשבון הזה, ושהתוכן לא שונה.</p>
<pre>
# SSH signing (Git 2.34+): reuse the key you already have
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
# upload the same public key on GitHub as a "Signing key" (separate from auth key)

# Verify locally (needs an allowed-signers file for SSH)
echo "dana@acme.com $(cat ~/.ssh/id_ed25519.pub)" &gt; ~/.config/git/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
git log --show-signature -1
git tag -s v2.4.0 -m "release" &amp;&amp; git tag -v v2.4.0

# Keyless with Sigstore: short-lived cert from your OIDC login, logged in Rekor
git config --local gpg.x509.program gitsign
git config --local gpg.format x509
</pre>
<table>
<tr><th></th><th>GPG</th><th>SSH</th><th>gitsign (Sigstore)</th></tr>
<tr><td>ניהול מפתחות</td><td>כואב (keyrings, תפוגה, subkeys)</td><td>קל, לרוב אותו מפתח</td><td>אין מפתח ארוך חיים: cert של Fulcio לבערך 10 דקות</td></tr>
<tr><td>תג "Verified" בפלטפורמה</td><td>GitHub, GitLab, Bitbucket</td><td>GitHub, GitLab</td><td>לא באופן מובנה ב-GitHub (מאמתים עם <code>gitsign verify</code> או policy)</td></tr>
</table>
<p><strong>Vigilant mode</strong> (הגדרה בפרופיל ב-GitHub) הופך את ברירת המחדל: כל commit שמשויך אליך ו-<em>לא</em> חתום מוצג כ-"Unverified", כך שהתחזות הופכת לגלויה. אוכפים עם החוק <strong>Require signed commits</strong> ב-ruleset (commits שנוצרו ב-web UI נחתמים במפתח של GitHub ועוברים).</p>
<blockquote>⚠️ Production tip: "require signed commits" ביחד עם rebase-merge נשבר — GitHub לא יכול לחתום מחדש על ה-commits אחרי rebase עם המפתח שלך. כשאוכפים חתימות, תשתמש ב-squash או ב-merge commits (את אלה GitHub חותם).</blockquote>`
      }
    },
    {
      h: { en: "Secrets and dependencies: push protection, Dependabot, Renovate", he: "סודות ותלויות: push protection, Dependabot ו-Renovate" },
      body: {
        en: `<p>Bots scan every public push to GitHub in near real time; an AWS key pushed to a public repo is typically tried within <strong>minutes</strong>. Defense in layers:</p>
<ol>
<li><strong>Pre-commit</strong> on the laptop: <code>gitleaks</code> or <code>trufflehog</code> as a hook — fastest feedback, but optional by nature.</li>
<li><strong>Push protection</strong> on the server: GitHub (and GitLab's secret push protection) rejects the push if it contains a recognized secret. Bypass requires a reason and is logged/alerted.</li>
<li><strong>Secret scanning</strong> of history + partner program: GitHub notifies providers (AWS, Slack, Stripe…) who may auto-revoke or quarantine the credential.</li>
</ol>
<pre>
$ git push origin feat/s3-upload
remote: error: GH013: Repository rule violations found for refs/heads/feat/s3-upload.
remote: - GITHUB PUSH PROTECTION
remote:   —— Amazon AWS Access Key ID ——————————————————
remote:     locations:
remote:       - commit: 8c1f2e7  path: config/settings.py:12
 ! [remote rejected] feat/s3-upload -&gt; feat/s3-upload (push declined due to repository rule violations)

# Scan history yourself
gitleaks git --redact -v .
trufflehog git file://. --only-verified
</pre>
<p><strong>Dependency updates</strong>: Dependabot (built into GitHub) or Renovate (any platform, far more configurable: grouping, schedules, automerge for patch, digest pinning).</p>
<pre>
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
    groups:
      minor-and-patch: { update-types: ["minor", "patch"] }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }

# renovate.json
{ "extends": ["config:recommended", "helpers:pinGitHubActionDigests"],
  "packageRules": [ { "matchUpdateTypes": ["patch"], "automerge": true } ] }
</pre>
<blockquote>⚠️ Production tip: a secret removed in a later commit is still in history, in every clone and fork, and in GitHub's cached views. <strong>Rotate first</strong>, clean history second — rewriting history never "un-leaks" a key.</blockquote>`,
        he: `<p>Bots סורקים כל push ציבורי ל-GitHub כמעט בזמן אמת; מפתח AWS שנדחף ל-repo ציבורי בדרך כלל נוסה תוך <strong>דקות</strong>. הגנה בשכבות:</p>
<ol>
<li><strong>Pre-commit</strong> על הלפטופ: <code>gitleaks</code> או <code>trufflehog</code> כ-hook — הפידבק הכי מהיר, אבל מטבעו אופציונלי.</li>
<li><strong>Push protection</strong> בשרת: GitHub (וגם ה-secret push protection של GitLab) דוחה את ה-push אם יש בו סוד מזוהה. עקיפה דורשת סיבה, ונרשמת ומתריעה.</li>
<li><strong>Secret scanning</strong> של ההיסטוריה + partner program: GitHub מודיע לספקים (AWS, Slack, Stripe…) שיכולים לבטל או להכניס להסגר את ה-credential אוטומטית.</li>
</ol>
<pre>
$ git push origin feat/s3-upload
remote: error: GH013: Repository rule violations found for refs/heads/feat/s3-upload.
remote: - GITHUB PUSH PROTECTION
remote:   —— Amazon AWS Access Key ID ——————————————————
remote:     locations:
remote:       - commit: 8c1f2e7  path: config/settings.py:12
 ! [remote rejected] feat/s3-upload -&gt; feat/s3-upload (push declined due to repository rule violations)

# Scan history yourself
gitleaks git --redact -v .
trufflehog git file://. --only-verified
</pre>
<p><strong>עדכוני תלויות</strong>: Dependabot (מובנה ב-GitHub) או Renovate (בכל פלטפורמה, הרבה יותר גמיש: קיבוץ, לוחות זמנים, automerge ל-patch, pinning לפי digest).</p>
<pre>
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
    groups:
      minor-and-patch: { update-types: ["minor", "patch"] }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }

# renovate.json
{ "extends": ["config:recommended", "helpers:pinGitHubActionDigests"],
  "packageRules": [ { "matchUpdateTypes": ["patch"], "automerge": true } ] }
</pre>
<blockquote>⚠️ Production tip: סוד שנמחק ב-commit מאוחר יותר עדיין נמצא בהיסטוריה, בכל clone ו-fork, וב-cache של התצוגות של GitHub. <strong>קודם rotate</strong>, אחר כך ניקוי היסטוריה — שכתוב היסטוריה אף פעם לא "מבטל דליפה" של מפתח.</blockquote>`
      }
    },
    {
      h: { en: "Protecting main, forks and public-repo risks", he: "הגנה על main, forks וסיכונים של repo ציבורי" },
      body: {
        en: `<p>Minimum ruleset for <code>main</code> (and release tags): no deletion, <strong>no force push</strong>, PR required with ≥1 approval from someone other than the last pusher, Code Owners review for sensitive paths (<code>.github/workflows/</code>, <code>infra/</code>), required status checks, and a bypass list that is empty or a single break-glass team whose use alerts.</p>
<p>Fork and public-repo risks people underestimate:</p>
<ul>
<li><strong>Commits never really disappear on GitHub</strong>: after a force push, the old commit is still reachable by SHA (<code>github.com/org/repo/commit/&lt;sha&gt;</code>) until GitHub garbage-collects it; forks share the object network, so data from a deleted fork or from a private repo before it was made public can be read by SHA (the "Cross Fork Object Reference" issue). Purging needs GitHub Support.</li>
<li><strong>Making a private repo public</strong> publishes its entire history, not just HEAD. Scan with gitleaks/trufflehog first; consider a fresh repo with squashed history.</li>
<li><strong>Fork PRs and CI</strong>: <code>pull_request_target</code> + checking out the PR head runs attacker code with your secrets. Require approval for first-time contributors' workflows.</li>
<li><strong>Private repo forks</strong>: disable "Allow forking" at org level, or forks of private repos live in personal accounts beyond your policies.</li>
</ul>
<p><strong>Audit logs</strong>: who changed a ruleset, added a deploy key, disabled push protection, or cloned 400 repos at 3 AM. The UI retains ~180 days (Git events far less), so stream to your SIEM (Enterprise: S3, Splunk, Datadog, Azure Event Hubs…).</p>
<pre>
gh api "orgs/acme/audit-log?phrase=action:repository_ruleset.update" --paginate
gh api "orgs/acme/audit-log?phrase=action:protected_branch.policy_override"
</pre>
<blockquote>💡 Real world: alert on <code>repo.access</code> (visibility changed to public), <code>repository_ruleset.destroy</code>, <code>secret_scanning_push_protection.bypass</code>, <code>org.add_member</code> outside SCIM, and <code>public_key.create</code> / <code>deploy_key.create</code> — those five catch most real incidents.</blockquote>`,
        he: `<p>Ruleset מינימלי ל-<code>main</code> (ול-tags של releases): בלי מחיקה, <strong>בלי force push</strong>, חובת PR עם אישור אחד לפחות ממישהו שהוא לא מי שדחף אחרון, review של Code Owners לנתיבים רגישים (<code>.github/workflows/</code>, <code>infra/</code>), status checks חובה, ו-bypass list ריק או עם team אחד של break-glass שכל שימוש בו מתריע.</p>
<p>סיכונים של forks ו-repos ציבוריים שמזלזלים בהם:</p>
<ul>
<li><strong>Commits אף פעם לא באמת נעלמים ב-GitHub</strong>: אחרי force push, ה-commit הישן עדיין נגיש לפי SHA (<code>github.com/org/repo/commit/&lt;sha&gt;</code>) עד ש-GitHub עושה לו garbage collection; forks חולקים את רשת האובייקטים, אז מידע מ-fork שנמחק או מ-repo פרטי לפני שהפך לציבורי אפשר לקרוא לפי SHA (בעיית ה-"Cross Fork Object Reference"). ניקוי דורש פנייה ל-GitHub Support.</li>
<li><strong>להפוך repo פרטי לציבורי</strong> מפרסם את כל ההיסטוריה שלו, לא רק את ה-HEAD. תסרוק קודם עם gitleaks/trufflehog; תשקול repo חדש עם היסטוריה מכווצת.</li>
<li><strong>PR-ים מ-forks ו-CI</strong>: <code>pull_request_target</code> + checkout של ה-head של ה-PR מריץ קוד של תוקף עם ה-secrets שלך. תדרוש אישור ל-workflows של תורמים בפעם הראשונה.</li>
<li><strong>Forks של repos פרטיים</strong>: תכבה "Allow forking" ברמת ה-org, אחרת forks של repos פרטיים חיים בחשבונות אישיים מחוץ למדיניות שלך.</li>
</ul>
<p><strong>Audit logs</strong>: מי שינה ruleset, הוסיף deploy key, כיבה push protection, או עשה clone ל-400 repos בשלוש לפנות בוקר. ה-UI שומר בערך 180 יום (אירועי Git הרבה פחות), אז תעשה streaming ל-SIEM שלך (ב-Enterprise: S3, Splunk, Datadog, Azure Event Hubs…).</p>
<pre>
gh api "orgs/acme/audit-log?phrase=action:repository_ruleset.update" --paginate
gh api "orgs/acme/audit-log?phrase=action:protected_branch.policy_override"
</pre>
<blockquote>💡 Real world: תתריע על <code>repo.access</code> (שינוי visibility לציבורי), <code>repository_ruleset.destroy</code>, <code>secret_scanning_push_protection.bypass</code>, <code>org.add_member</code> מחוץ ל-SCIM, ו-<code>public_key.create</code> / <code>deploy_key.create</code> — החמישה האלה תופסים את רוב האירועים האמיתיים.</blockquote>`
      }
    },
    {
      h: { en: "Offboarding and backups", he: "Offboarding ו-backups" },
      body: {
        en: `<p><strong>Offboarding</strong> checklist when an engineer leaves:</p>
<ul>
<li>Disable in the IdP → SCIM removes org membership; with SSO, their PATs and SSH keys lose access to SSO-protected orgs (with EMU the account itself is suspended).</li>
<li>Remove them as <strong>outside collaborator</strong> on any repo (not covered by SCIM).</li>
<li>Rotate secrets they could read: CI/CD secrets in repos they administered, deploy keys they created, shared bot tokens.</li>
<li>Transfer ownership of their GitHub Apps / OAuth apps / personal-account forks of company code; replace them in CODEOWNERS.</li>
</ul>
<p><strong>Backups</strong>: GitHub/GitLab SaaS are highly redundant, but shared responsibility means accidental deletion, a malicious admin or a ransomware'd account is <em>your</em> problem. A <code>git clone --mirror</code> covers code only — not issues, PRs, wikis (a separate <code>.wiki.git</code> repo), Actions secrets or settings.</p>
<pre>
# Nightly code mirror of every repo in the org (to immutable storage, e.g. S3 Object Lock)
gh repo list acme --limit 2000 --json nameWithOwner -q '.[].nameWithOwner' |
  while read r; do
    git clone --mirror "https://github.com/$r.git" "$r.git" 2&gt;/dev/null \
      || git -C "$r.git" remote update --prune
  done

# Metadata too: organization migration archive (repos + issues + PRs + comments)
gh api -X POST orgs/acme/migrations -f "repositories[]=api" -F exclude_attachments=false

# Self-managed
ghe-backup                          # GHES: backup-utils on a separate host
sudo gitlab-backup create           # GitLab: plus /etc/gitlab/gitlab-secrets.json!
</pre>
<blockquote>⚠️ Production tip: a GitLab backup without <code>gitlab-secrets.json</code> restores repos but not CI variables, 2FA or runner tokens — it's encrypted with keys that live only in that file. Back it up separately, and do a timed restore drill at least yearly.</blockquote>`,
        he: `<p>צ'קליסט <strong>Offboarding</strong> כשמהנדס עוזב:</p>
<ul>
<li>לנטרל ב-IdP ← SCIM מסיר את החברות ב-org; עם SSO, ה-PATs וה-SSH keys שלו מאבדים גישה ל-orgs שמוגנים ב-SSO (ב-EMU החשבון עצמו מושעה).</li>
<li>להסיר אותו כ-<strong>outside collaborator</strong> מכל repo (SCIM לא מכסה את זה).</li>
<li>לעשות rotate לסודות שהוא יכול היה לקרוא: secrets של CI/CD ב-repos שהוא ניהל, deploy keys שהוא יצר, tokens משותפים של bots.</li>
<li>להעביר בעלות על GitHub Apps / OAuth apps / forks של קוד החברה בחשבון האישי שלו; להחליף אותו ב-CODEOWNERS.</li>
</ul>
<p><strong>Backups</strong>: GitHub ו-GitLab כ-SaaS מאוד redundant, אבל במודל ה-shared responsibility מחיקה בטעות, admin זדוני או חשבון שנפגע מ-ransomware הם הבעיה <em>שלך</em>. <code>git clone --mirror</code> מכסה רק קוד — לא issues, PR-ים, wikis (repo נפרד של <code>.wiki.git</code>), secrets של Actions או הגדרות.</p>
<pre>
# Nightly code mirror of every repo in the org (to immutable storage, e.g. S3 Object Lock)
gh repo list acme --limit 2000 --json nameWithOwner -q '.[].nameWithOwner' |
  while read r; do
    git clone --mirror "https://github.com/$r.git" "$r.git" 2&gt;/dev/null \
      || git -C "$r.git" remote update --prune
  done

# Metadata too: organization migration archive (repos + issues + PRs + comments)
gh api -X POST orgs/acme/migrations -f "repositories[]=api" -F exclude_attachments=false

# Self-managed
ghe-backup                          # GHES: backup-utils on a separate host
sudo gitlab-backup create           # GitLab: plus /etc/gitlab/gitlab-secrets.json!
</pre>
<blockquote>⚠️ Production tip: backup של GitLab בלי <code>gitlab-secrets.json</code> משחזר repos אבל לא משתני CI, 2FA או tokens של runners — הם מוצפנים עם מפתחות שקיימים רק בקובץ הזה. תגבה אותו בנפרד, ותעשה תרגיל שחזור עם שעון לפחות פעם בשנה.</blockquote>`
      }
    }
  ],
  diagram: "laptop ─[pre-commit: gitleaks]─► push ─► [push protection] ─► [ruleset: PR, reviews, checks, signed]\n                                                                     │\nidentity: IdP ─SSO/SCIM─► org members      bots: GitHub App (1h token)  ▼\naudit log ──stream──► SIEM                 backups: mirror + metadata ─► immutable storage",
  handsOn: [
    { cmd: "git log --show-signature -3",
      what: { en: "See whether recent commits are signed and by whom (configure allowed_signers for SSH signatures).", he: "לראות אם ה-commits האחרונים חתומים ועל ידי מי (צריך להגדיר allowed_signers לחתימות SSH)." } },
    { cmd: "docker run --rm -v \"$PWD:/repo\" zricethezav/gitleaks:latest git /repo --redact -v",
      what: { en: "Scan the whole history of a repo for leaked secrets, without installing anything.", he: "לסרוק את כל ההיסטוריה של repo לסודות שדלפו, בלי להתקין כלום." } },
    { cmd: "gh api repos/OWNER/REPO --jq '.security_and_analysis'",
      what: { en: "Check whether secret scanning, push protection and Dependabot security updates are enabled.", he: "לבדוק אם secret scanning, push protection ו-Dependabot security updates מופעלים." } },
    { cmd: "gh api user/keys --jq '.[] | {id, title, created_at}'",
      what: { en: "Audit your own SSH keys on GitHub — delete the ones from laptops you no longer have.", he: "לעשות audit למפתחות ה-SSH שלך ב-GitHub — למחוק את אלה מלפטופים שכבר אין לך." } }
  ],
  mnemonic: {
    en: "S.S.S.P.A.B: Short-lived creds, Signed commits, Scanned pushes, Protected main, Audited actions, Backed-up everything.",
    he: "קצר, חתום, סרוק, מוגן, מתועד, מגובה: credentials קצרי חיים, commits חתומים, push-ים סרוקים, main מוגן, audit log, backups."
  },
  pitfalls: [
    { en: "Deleting a leaked key from the code in a new commit and calling it done: it's still in history and was likely scraped within minutes. Rotate first.",
      he: "למחוק מפתח שדלף מהקוד ב-commit חדש ולסגור את העניין: הוא עדיין בהיסטוריה וכנראה נאסף תוך דקות. קודם rotate." },
    { en: "Using a personal PAT of an engineer for CI/bots: it has all their access, breaks when they leave, and its actions look like theirs in the audit log. Use a GitHub App.",
      he: "להשתמש ב-PAT אישי של מהנדס ל-CI או ל-bots: יש לו את כל הגישה שלו, הוא נשבר כשהמהנדס עוזב, והפעולות שלו נראות כמו שלו ב-audit log. תשתמש ב-GitHub App." },
    { en: "Deploy keys with write access reused across servers: one compromised server can push to the repo. Keep them read-only and one per consumer.",
      he: "Deploy keys עם הרשאת write שמשותפים לכמה שרתים: שרת אחד שנפרץ יכול לדחוף ל-repo. תשאיר אותם read-only ואחד לכל צרכן." },
    { en: "Admins in the ruleset bypass list 'just in case': bypass becomes the normal path and protection is decorative. Use break-glass with alerting.",
      he: "Admins ב-bypass list של ה-ruleset 'ליתר ביטחון': העקיפה הופכת לדרך הרגילה וההגנה קישוטית. תשתמש ב-break-glass עם התרעה." }
  ],
  interview: [
    { q: { en: "GitHub App vs personal access token for a CI bot — which and why?", he: "GitHub App מול personal access token ל-bot של CI — מה ולמה?" },
      a: { en: "GitHub App: permissions are declared and scoped to installed repos, installation tokens expire after one hour, it's not tied to a human (survives offboarding), it has its own identity in the audit log, and it gets higher rate limits that scale with the org. A PAT inherits a human's access, lives long, and leaves with them.",
           he: "GitHub App: ההרשאות מוצהרות ומוגבלות ל-repos שהוא מותקן עליהם, ה-installation tokens פגים אחרי שעה, הוא לא קשור לבן אדם (שורד offboarding), יש לו זהות משלו ב-audit log, ומקבל rate limits גבוהים יותר שגדלים עם ה-org. PAT יורש את הגישה של בן אדם, חי הרבה זמן ועוזב יחד איתו." } },
    { q: { en: "A developer pushed a secret to a public repo. Walk through the response.", he: "מפתח דחף סוד ל-repo ציבורי. תעבור על התגובה." },
      a: { en: "1) Revoke/rotate the credential immediately — assume it's compromised. 2) Check the provider's logs (e.g. CloudTrail for the access key ID, all regions) for use since the push and remove any persistence. 3) Then clean history with git filter-repo, force-push, ask GitHub Support to purge cached views and check forks. 4) Post-mortem: push protection, pre-commit scanning, and replacing static keys with OIDC.",
           he: "1) לבטל ולעשות rotate ל-credential מיד — מניחים שהוא נפרץ. 2) לבדוק את הלוגים של הספק (למשל CloudTrail לפי ה-access key ID, בכל ה-regions) לשימוש מאז ה-push ולהסיר כל persistence. 3) רק אז לנקות היסטוריה עם git filter-repo, force push, לבקש מ-GitHub Support לנקות cached views ולבדוק forks. 4) Post-mortem: push protection, סריקה ב-pre-commit, והחלפת מפתחות סטטיים ב-OIDC." } }
  ],
  quiz: [
    { q: { en: "How long is a GitHub App installation access token valid?", he: "כמה זמן תקף installation access token של GitHub App?" },
      options: [
        { en: "1 hour", he: "שעה" },
        { en: "24 hours", he: "24 שעות" },
        { en: "90 days", he: "90 יום" },
        { en: "Until the app is uninstalled", he: "עד שה-app מוסר" }
      ], answer: 0,
      explain: { en: "Installation tokens expire after one hour; the app mints new ones with its private key, so nothing long-lived sits in CI.", he: "Installation tokens פגים אחרי שעה; ה-app מנפיק חדשים עם ה-private key שלו, כך ששום דבר ארוך חיים לא יושב ב-CI." } },
    { q: { en: "What does GitHub's vigilant mode do?", he: "מה עושה vigilant mode ב-GitHub?" },
      options: [
        { en: "Blocks all unsigned pushes to every repo", he: "חוסם כל push לא חתום לכל repo" },
        { en: "Marks unsigned commits attributed to you as 'Unverified', exposing impersonation", he: "מסמן commits לא חתומים שמשויכים אליך כ-'Unverified', וכך חושף התחזות" },
        { en: "Enables secret scanning for your account", he: "מפעיל secret scanning לחשבון שלך" },
        { en: "Requires 2FA on every push", he: "דורש 2FA על כל push" }
      ], answer: 1,
      explain: { en: "It changes display, not enforcement: enforcement is the 'Require signed commits' rule in a ruleset or branch protection.", he: "הוא משנה תצוגה, לא אכיפה: האכיפה היא החוק 'Require signed commits' ב-ruleset או ב-branch protection." } },
    { q: { en: "An AWS key was pushed to a public repo 10 minutes ago. What is the FIRST action?", he: "מפתח AWS נדחף ל-repo ציבורי לפני 10 דקות. מה הפעולה הראשונה?" },
      options: [
        { en: "Run git filter-repo and force-push", he: "להריץ git filter-repo ולעשות force push" },
        { en: "Make the repo private", he: "להפוך את ה-repo לפרטי" },
        { en: "Deactivate/rotate the key in IAM", he: "לנטרל ולעשות rotate למפתח ב-IAM" },
        { en: "Open a ticket with GitHub Support", he: "לפתוח ticket ב-GitHub Support" }
      ], answer: 2,
      explain: { en: "The key must be assumed stolen — scrapers find keys in minutes. History cleanup doesn't revoke anything; rotation does.", he: "צריך להניח שהמפתח נגנב — scrapers מוצאים מפתחות תוך דקות. ניקוי היסטוריה לא מבטל כלום; rotation כן." } },
    { q: { en: "Why is `git clone --mirror` alone not a complete GitHub backup?", he: "למה `git clone --mirror` לבד הוא לא backup מלא של GitHub?" },
      options: [
        { en: "It skips tags", he: "הוא מדלג על tags" },
        { en: "It only copies the default branch", he: "הוא מעתיק רק את ה-default branch" },
        { en: "It doesn't include issues, PRs and review comments, wikis, settings or secrets", he: "הוא לא כולל issues, PR-ים ותגובות review, wikis, הגדרות או secrets" },
        { en: "It can't be restored to another platform", he: "אי אפשר לשחזר אותו לפלטפורמה אחרת" }
      ], answer: 2,
      explain: { en: "--mirror copies all Git refs; platform metadata needs the migrations API or a backup product, and wikis are a separate .wiki.git repo.", he: "--mirror מעתיק את כל ה-refs של Git; metadata של הפלטפורמה צריך את ה-migrations API או מוצר backup, ו-wikis הם repo נפרד של .wiki.git." } }
  ],
  related: ["staff-supply-chain", "cicd-github-actions", "cloud-secrets-management", "cloud-iam-security", "git-undo-rescue", "git-hosting-compare"]
});

/* ------------------------------------------------------------------ glossary */
INFRA.glossary.push(
  { term: "Monorepo", track: "git", lesson: "git-large-repos",
    def: { en: "A single repository holding many projects/services, with atomic cross-project changes; needs affected-only builds and partial/sparse checkouts to scale.",
           he: "Repo אחד שמחזיק הרבה פרויקטים או שירותים, עם שינויים אטומיים ביניהם; צריך build של affected-only ו-checkout חלקי או sparse כדי להתרחב." } },
  { term: "Partial clone", track: "git", lesson: "git-large-repos",
    def: { en: "Clone with --filter (e.g. blob:none) that downloads commits and trees but fetches file contents lazily on demand.",
           he: "Clone עם --filter (למשל blob:none) שמוריד commits ו-trees אבל מושך את תוכן הקבצים בעצלות, לפי דרישה." } },
  { term: "Git LFS", track: "git", lesson: "git-large-repos",
    def: { en: "Git extension that stores large files in a separate store and keeps only a small pointer (oid + size) in Git history.",
           he: "הרחבה של Git ששומרת קבצים גדולים ב-store נפרד ומשאירה בהיסטוריה של Git רק pointer קטן (oid + גודל)." } },
  { term: "Merge Request (MR)", track: "git", lesson: "git-hosting-compare",
    def: { en: "GitLab's name for a pull request: a proposed change from one branch into another, with review, approvals and a pipeline.",
           he: "השם של GitLab ל-pull request: הצעה לשינוי מ-branch אחד לאחר, עם review, אישורים ו-pipeline." } },
  { term: "Repository ruleset", track: "git", lesson: "git-hosting-compare",
    def: { en: "GitHub's stackable, org- or repo-level rules for branches and tags (PRs, checks, no force push, signatures) with an explicit bypass list and evaluate mode.",
           he: "חוקים של GitHub ברמת org או repo ל-branches ו-tags (PR-ים, checks, בלי force push, חתימות) שמצטברים, עם bypass list מפורש ומצב evaluate." } },
  { term: "Required status check", track: "git", lesson: "git-hosting-compare",
    def: { en: "A CI check, matched by name, that must report success before a PR can merge into a protected branch.",
           he: "Check של CI, לפי שם, שחייב לדווח הצלחה לפני ש-PR יכול להיכנס ל-branch מוגן." } },
  { term: "Push protection", track: "git", lesson: "git-repo-security",
    def: { en: "Server-side secret scanning that rejects a git push containing a recognized credential before it lands in the repo.",
           he: "Secret scanning בצד השרת שדוחה git push שמכיל credential מזוהה לפני שהוא נכנס ל-repo." } },
  { term: "Deploy key", track: "git", lesson: "git-repo-security",
    def: { en: "An SSH key attached to a single repository (read-only by default) so a server can clone it without a user account.",
           he: "מפתח SSH שמשויך ל-repo יחיד (read-only כברירת מחדל) כדי ששרת יוכל לעשות clone בלי חשבון משתמש." } },
  { term: "Gitsign", track: "git", lesson: "git-repo-security",
    def: { en: "Sigstore tool for keyless commit signing: a short-lived certificate tied to your OIDC identity, recorded in the Rekor transparency log.",
           he: "כלי של Sigstore לחתימת commits בלי מפתח קבוע: certificate קצר חיים שקשור לזהות ה-OIDC שלך ונרשם ב-transparency log של Rekor." } }
);

/* ------------------------------------------------------------------ scenario */
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  INFRA.scenarios.push({
    id: "secret-pushed-to-main",
    icon: "🔑",
    title: t("AWS key pushed to a public repo", "מפתח AWS נדחף ל-repo ציבורי"),
    start: "s1",
    steps: {
      s1: {
        text: t("16:07, Thursday. A junior engineer pushed a 'quick fix' straight to main of your open-source SDK repo 9 minutes ago. Then three emails arrive at once.",
                "16:07, יום חמישי. מהנדס ג'וניור דחף 'תיקון מהיר' ישר ל-main של ה-repo הציבורי של ה-SDK שלך לפני 9 דקות. ואז מגיעים שלושה מיילים בבת אחת."),
        data: `16:01  github.com/acme/acme-sdk  main  a41c9e2  "fix upload retries"  (+3 -1)  config/test_settings.py
         +AWS_ACCESS_KEY_ID = "AKIA4XQ7EXAMPLE7KQ2Z"
         +AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
16:04  GitHub secret scanning: "Amazon AWS Access Key ID detected" (partner alert sent to AWS)
16:06  AWS Trust & Safety: "Your AWS access key AKIA4XQ7...KQ2Z is publicly exposed"
       IAM user: ci-integration   attached: AWSCompromisedKeyQuarantineV2 (auto)`,
        choices: [
          c("Deactivate the access key in IAM right now, then create a replacement", "לנטרל את ה-access key ב-IAM עכשיו, ואז ליצור מחליף", "s2", 20,
            "Correct order. The key is public — assume it's in an attacker's hands. Nothing else matters until it stops working.",
            "הסדר הנכון. המפתח ציבורי — מניחים שהוא אצל תוקף. שום דבר אחר לא משנה עד שהוא מפסיק לעבוד."),
          c("Rewrite history with git filter-repo and force-push main first, so nobody else sees it", "קודם לשכתב היסטוריה עם git filter-repo ולעשות force push ל-main, כדי שאף אחד אחר לא יראה", "s1b", -15,
            "Scrapers saw it within a minute or two. Every minute you spend on history the key still works.",
            "ה-scrapers ראו אותו תוך דקה-שתיים. כל דקה שאתה משקיע בהיסטוריה המפתח עדיין עובד."),
          c("Make the repo private", "להפוך את ה-repo לפרטי", "s1b", -10,
            "Doesn't revoke anything, breaks every user of the SDK, and forks and clones already have the commit.",
            "לא מבטל כלום, שובר את כל המשתמשים של ה-SDK, ול-forks ול-clones כבר יש את ה-commit.")
        ]
      },
      s1b: {
        text: t("16:31. History is rewritten and main force-pushed (the ruleset bypass was used — the security channel lights up). But the AWS billing alarm just fired, and the key is still Active.",
                "16:31. ההיסטוריה שוכתבה ו-main קיבל force push (השתמשו ב-bypass של ה-ruleset — ערוץ ה-security נדלק). אבל ה-billing alarm של AWS בדיוק קפץ, והמפתח עדיין Active."),
        data: `CloudWatch alarm  EstimatedCharges > $500   (normal daily: $140)
$ aws iam list-access-keys --user-name ci-integration
AccessKeyId: AKIA4XQ7EXAMPLE7KQ2Z   Status: Active   CreateDate: 2024-03-11`,
        choices: [
          c("Deactivate the key now and start the investigation", "לנטרל את המפתח עכשיו ולהתחיל בחקירה", "s2", 5,
            "Late but right. The 25 minutes cost real money and gave the attacker time — remember the order next time.",
            "מאוחר אבל נכון. 25 הדקות עלו כסף אמיתי ונתנו לתוקף זמן — תזכור את הסדר בפעם הבאה."),
          c("The quarantine policy is attached, so we're fine — close the incident", "ה-quarantine policy מחובר, אז אנחנו בסדר — לסגור את האירוע", "lose", -20,
            "The quarantine policy denies a list of risky actions, not everything, and the attacker may already have created their own credentials.",
            "ה-quarantine policy חוסם רשימה של פעולות מסוכנות, לא הכל, ויכול להיות שהתוקף כבר יצר לעצמו credentials משלו.")
        ]
      },
      s2: {
        text: t("Key deactivated, a new one is in Secrets Manager and CI is green again. Now: what did the key do while it was public?",
                "המפתח נוטרל, חדש נמצא ב-Secrets Manager וה-CI ירוק שוב. עכשיו: מה המפתח עשה בזמן שהוא היה ציבורי?"),
        data: `$ aws iam update-access-key --user-name ci-integration --access-key-id AKIA4XQ7EXAMPLE7KQ2Z --status Inactive
$ aws iam get-access-key-last-used --access-key-id AKIA4XQ7EXAMPLE7KQ2Z
LastUsedDate: 2026-11-12T16:12:44Z   ServiceName: ec2   Region: ap-southeast-1`,
        choices: [
          c("Query CloudTrail for this access key ID in every region since 16:01", "לחפש ב-CloudTrail לפי ה-access key ID הזה בכל ה-regions מאז 16:01", "s3", 20,
            "Yes. lookup-events is per region and attackers love regions you never use. Also check the organization trail if you have one.",
            "כן. lookup-events עובד לפי region ותוקפים אוהבים regions שאתה אף פעם לא משתמש בהם. תבדוק גם את ה-organization trail אם יש."),
          c("Check CloudTrail only in eu-west-1 — that's where all our stuff runs", "לבדוק CloudTrail רק ב-eu-west-1 — שם רץ כל מה שלנו", "s3", -5,
            "You'd have missed everything. The last-used region is ap-southeast-1 — you got lucky that the output pointed you there.",
            "היית מפספס הכל. ה-region של השימוש האחרון הוא ap-southeast-1 — יש לך מזל שהפלט הפנה אותך לשם."),
          c("The key is dead; nothing else to check", "המפתח מת; אין מה לבדוק עוד", "lose", -20,
            "Deactivating stops new calls with this key. It does nothing about instances, users or keys the attacker already created.",
            "הנטרול עוצר קריאות חדשות עם המפתח הזה. הוא לא עושה כלום ל-instances, משתמשים או מפתחות שהתוקף כבר יצר.")
        ]
      },
      s3: {
        text: t("CloudTrail shows the attacker's playbook: GPU instances in 4 regions — and IAM activity.",
                "ה-CloudTrail מראה את ה-playbook של התוקף: instances של GPU ב-4 regions — ופעילות IAM."),
        data: `$ for r in $(aws ec2 describe-regions --query 'Regions[].RegionName' --output text); do
    aws cloudtrail lookup-events --region $r --start-time 2026-11-12T16:01Z \\
      --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIA4XQ7EXAMPLE7KQ2Z \\
      --query 'Events[].[EventTime,EventName]' --output text; done
16:03:12  GetCallerIdentity        (us-east-1)   src 185.220.x.x
16:03:40  ListAttachedUserPolicies (us-east-1)
16:04:05  CreateUser  backup-svc   (us-east-1)
16:04:06  CreateAccessKey  backup-svc
16:05:30  RunInstances x8 p4d.24xlarge  (ap-southeast-1, sa-east-1, ap-south-1, eu-north-1)`,
        choices: [
          c("Terminate the instances in all 4 regions AND delete backup-svc and its access key; then sweep for other new IAM users, roles, keys and Lambda functions", "לעשות terminate ל-instances בכל 4 ה-regions וגם למחוק את backup-svc והמפתח שלו; ואז לסרוק משתמשים, roles, מפתחות ו-Lambda functions חדשים", "s4", 20,
            "That's containment. backup-svc was persistence — it would have kept the attacker in after your rotation. 8 p4d instances also burn about $260/hour.",
            "זה containment. backup-svc היה ה-persistence — הוא היה משאיר את התוקף בפנים אחרי ה-rotation שלך. 8 instances של p4d גם שורפים בערך 260 דולר לשעה."),
          c("Terminate the instances; the IAM user is probably harmless", "לעשות terminate ל-instances; משתמש ה-IAM כנראה לא מזיק", "s3b", -15,
            "The new user with its own access key is the attacker's way back in.",
            "המשתמש החדש עם access key משלו הוא הדרך של התוקף לחזור.")
        ]
      },
      s3b: {
        text: t("19:40. A second billing alarm. New p4d instances are running in me-south-1 — created by IAM user backup-svc.",
                "19:40. billing alarm שני. instances חדשים של p4d רצים ב-me-south-1 — נוצרו ע\"י משתמש ה-IAM backup-svc."),
        data: `19:12:03  RunInstances x8 p4d.24xlarge  (me-south-1)  userIdentity: IAMUser/backup-svc  src 185.220.x.x`,
        choices: [
          c("Delete backup-svc and its keys, terminate everything, and sweep IAM/Lambda/other regions properly this time", "למחוק את backup-svc והמפתחות שלו, לעשות terminate להכל, ולסרוק כמו שצריך IAM, Lambda ו-regions אחרים הפעם", "s4", 5,
            "Recovered, at the cost of 3.5 more hours of GPU spend. Persistence always comes before profit in an attacker's playbook.",
            "התאוששת, במחיר של עוד 3.5 שעות של GPU. ב-playbook של תוקף persistence תמיד מגיע לפני הרווח."),
          c("Just terminate the new instances again", "רק לעשות terminate שוב ל-instances החדשים", "lose", -20,
            "Whack-a-mole. Until the attacker's credentials are gone, they'll keep coming back.",
            "Whack-a-mole. כל עוד ה-credentials של התוקף קיימים, הוא ימשיך לחזור.")
        ]
      },
      s4: {
        text: t("AWS is contained. Now the repo: the secret is still in main's history, in forks, and in clones. What's the cleanup?",
                "AWS בשליטה. עכשיו ה-repo: הסוד עדיין בהיסטוריה של main, ב-forks וב-clones. מה הניקוי?"),
        data: `$ gh api repos/acme/acme-sdk --jq '.forks_count'
37
$ git log --oneline -3
a41c9e2 fix upload retries
9d0b1c4 Release v3.8.1
...`,
        choices: [
          c("git filter-repo --replace-text to scrub the key, force-push (break-glass, announced), ask GitHub Support to purge cached views, tell contributors to re-clone", "git filter-repo --replace-text כדי לנקות את המפתח, force push (break-glass, עם הודעה), לבקש מ-GitHub Support לנקות cached views, ולהגיד לתורמים לעשות clone מחדש", "s5", 15,
            "Right — and you accept that the 37 forks and old clones may keep it forever. That's fine, because the key is already dead.",
            "נכון — ואתה מקבל שה-37 forks וה-clones הישנים עלולים להחזיק אותו לנצח. זה בסדר, כי המפתח כבר מת."),
          c("git revert a41c9e2 — that removes the key", "git revert a41c9e2 — זה מסיר את המפתח", "s5", -5,
            "Revert adds a new commit; the key stays in a41c9e2 forever. Acceptable only because the key is revoked — but it will keep triggering every scanner.",
            "Revert מוסיף commit חדש; המפתח נשאר ב-a41c9e2 לתמיד. מקובל רק כי המפתח בוטל — אבל הוא ימשיך להקפיץ כל סורק.")
        ]
      },
      s5: {
        text: t("Post-incident review. Total damage: ~$1,900 of GPU time, no data access found. What goes into the action items?",
                "Post-incident review. הנזק הכולל: בערך 1,900 דולר של זמן GPU, לא נמצאה גישה למידע. מה נכנס ל-action items?"),
        choices: [
          c("Push protection + secret scanning on every repo, a gitleaks pre-commit hook, ruleset: no direct pushes to main, and replace the CI user's static key with GitHub Actions OIDC", "Push protection ו-secret scanning בכל repo, hook של gitleaks ב-pre-commit, ruleset: בלי push ישיר ל-main, והחלפת המפתח הסטטי של משתמש ה-CI ב-OIDC של GitHub Actions", "win", 20,
            "This removes the root cause (a long-lived key that could leak at all) and adds two independent nets that would have stopped this push.",
            "זה מסיר את שורש הבעיה (מפתח ארוך חיים שבכלל יכול לדלוף) ומוסיף שתי רשתות בלתי תלויות שהיו עוצרות את ה-push הזה."),
          c("Add test_settings.py to .gitignore and remind everyone to be careful", "להוסיף את test_settings.py ל-.gitignore ולהזכיר לכולם להיזהר", "lose", -15,
            "Hoping people are careful is not a control. The next key will leak from a different file.",
            "לקוות שאנשים יזהרו זו לא בקרה. המפתח הבא ידלוף מקובץ אחר.")
        ]
      },
      win: {
        text: t("Incident closed well. You rotated before anything else, hunted across all regions, removed the attacker's persistence, cleaned history knowing it doesn't un-leak anything, and killed the root cause with OIDC and push protection.",
                "האירוע נסגר טוב. עשית rotate לפני כל דבר אחר, חיפשת בכל ה-regions, הסרת את ה-persistence של התוקף, ניקית היסטוריה בידיעה שזה לא מבטל את הדליפה, והרגת את שורש הבעיה עם OIDC ו-push protection."),
        end: "win"
      },
      lose: {
        text: t("The attacker kept access (or will next time). Lesson: rotate first, then hunt for usage and persistence across every region, then clean history — and fix the system, not the person.",
                "התוקף שמר על גישה (או ישמור בפעם הבאה). השיעור: קודם rotate, אחר כך לחפש שימוש ו-persistence בכל ה-regions, ורק אז לנקות היסטוריה — ולתקן את המערכת, לא את האדם."),
        end: "lose"
      }
    },
    lessons: ["git-repo-security", "cloud-secrets-management", "cicd-github-actions", "cloud-iam-security"]
  });
})();
