window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// Compilers, transpilers & linking: how source code becomes something a CPU (or a browser) runs,
// and why that matters for containers, cold starts, CPU limits and "not found" crashes.

INFRA.lessons.push({
  id: "compilers-how-code-runs",
  track: "foundations",
  order: 40,
  icon: "⚙️",
  level: 2,
  minutes: 16,
  title: { en: "Compilers, Interpreters & JITs: How Code Actually Runs", he: "Compilers, ‏Interpreters ו-JIT: איך קוד באמת רץ" },
  tldr: {
    en: "Source code goes lexer → parser → AST → semantic checks → IR → optimizer → machine code; the only question is WHEN the last steps happen — ahead of time (Go, Rust, C), at run time by an interpreter (CPython), or at run time by a JIT that watches hot code (JVM, V8, .NET). That timing decides your startup, warm-up, memory and how you size CPU limits.",
    he: "קוד מקור עובר lexer ← parser ← AST ← בדיקות סמנטיות ← IR ← optimizer ← קוד מכונה; השאלה היחידה היא מתי השלבים האחרונים קורים — מראש (Go, ‏Rust, ‏C), בזמן ריצה על ידי interpreter ‏(CPython), או בזמן ריצה על ידי JIT שמזהה קוד חם (JVM, ‏V8, ‏.NET). התזמון הזה קובע את ה-startup, ה-warm-up, הזיכרון ואיך אתה מגדיר CPU limits."
  },
  analogy: {
    en: "A book in Japanese. A compiler is a translator who translates the whole book into Hebrew before you read it — slow to prepare, fast to read. An interpreter is a live interpreter standing next to you translating sentence by sentence, every time you reread. A JIT is a live interpreter who notices you reread chapter 3 every day, so he writes down a polished translation of chapter 3 and hands you that from now on. The first days are slow (warm-up); after that it's as fast as the book translator.",
    he: "ספר ביפנית. compiler זה מתרגם שמתרגם את כל הספר לעברית לפני שאתה קורא — הכנה איטית, קריאה מהירה. interpreter זה מתורגמן שעומד לידך ומתרגם משפט אחרי משפט, כל פעם מחדש. JIT זה מתורגמן ששם לב שאתה קורא את פרק 3 כל יום, אז הוא כותב תרגום מלוטש של פרק 3 ומעכשיו נותן לך אותו. בימים הראשונים זה איטי (warm-up); אחר כך זה מהיר כמו המתרגם של הספר."
  },
  sections: [
    {
      h: { en: "The pipeline, on one line of code", he: "ה-pipeline, על שורת קוד אחת" },
      body: {
        en: `<p>Every language implementation — gcc, javac, V8, CPython — runs some version of the same pipeline. Take <code>x = 2 + 3 * y</code>:</p>
<ol><li><strong>Lexer (tokenizer)</strong> turns characters into tokens: <code>IDENT(x) ASSIGN NUM(2) PLUS NUM(3) STAR IDENT(y)</code>. Whitespace and comments disappear here.</li>
<li><strong>Parser</strong> applies the grammar (including precedence: <code>*</code> binds tighter than <code>+</code>) and builds an <strong>AST</strong> — a tree, not text.</li>
<li><strong>Semantic analysis</strong>: is <code>y</code> declared? What type is it? Can you add an int to it? This is where "cannot find symbol" and type errors come from.</li>
<li><strong>IR (intermediate representation)</strong>: a simpler, lower-level form that is easy to optimize — bytecode, LLVM IR, SSA graphs.</li>
<li><strong>Optimizer</strong>: constant folding, inlining, dead code elimination, loop opts, register allocation.</li>
<li><strong>Codegen</strong>: emit machine code for a specific CPU (x86-64, arm64) — or bytecode for a VM.</li></ol>
<pre>Assign
├── Name x
└── BinOp +
    ├── Num 2
    └── BinOp *        &lt;- deeper = evaluated first (precedence lives in the tree shape)
        ├── Num 3
        └── Name y</pre>
<p>You can see a real AST in 1 second with Python (3.12 output):</p>
<pre>$ python -c "import ast;print(ast.dump(ast.parse('x = 2 + 3 * y'), indent=2))"
Module(
  body=[
    Assign(
      targets=[
        Name(id='x', ctx=Store())],
      value=BinOp(
        left=Constant(value=2),
        op=Add(),
        right=BinOp(
          left=Constant(value=3),
          op=Mult(),
          right=Name(id='y', ctx=Load()))))],
  type_ignores=[])</pre>
<p>And what an optimizing native compiler finally emits for <code>int f(int y){ return 2 + 3*y; }</code> with <code>clang -O2</code> on x86-64 — the multiply and add are folded into one address-computation instruction:</p>
<pre>f:
        lea     eax, [rdi + 2*rdi + 2]
        ret</pre>
<blockquote>💡 Real world: the same front half (lexer/parser/AST) powers your linters, formatters, IDE autocomplete, Terraform/HCL parsers, SQL engines and even <code>jq</code>. Once you see "text → tokens → tree → evaluate", every config language and query planner looks familiar.</blockquote>`,
        he: `<p>כל מימוש של שפה — gcc, ‏javac, ‏V8, ‏CPython — מריץ גרסה כלשהי של אותו pipeline. ניקח את <code>x = 2 + 3 * y</code>:</p>
<ol><li><strong>Lexer ‏(tokenizer)</strong> הופך תווים ל-tokens: <code>IDENT(x) ASSIGN NUM(2) PLUS NUM(3) STAR IDENT(y)</code>. רווחים והערות נעלמים כאן.</li>
<li><strong>Parser</strong> מפעיל את הדקדוק (כולל קדימות: <code>*</code> קושר חזק יותר מ-<code>+</code>) ובונה <strong>AST</strong> — עץ, לא טקסט.</li>
<li><strong>ניתוח סמנטי</strong>: האם <code>y</code> הוגדר? מה הטיפוס שלו? אפשר לחבר אליו int? מכאן מגיעות שגיאות "cannot find symbol" ושגיאות טיפוסים.</li>
<li><strong>IR ‏(intermediate representation)</strong>: צורה פשוטה ונמוכה יותר שקל לעשות לה אופטימיזציה — bytecode, ‏LLVM IR, גרפי SSA.</li>
<li><strong>Optimizer</strong>: constant folding, ‏inlining, הסרת קוד מת, אופטימיזציות לולאה, הקצאת registers.</li>
<li><strong>Codegen</strong>: פולט קוד מכונה ל-CPU מסוים (x86-64, ‏arm64) — או bytecode ל-VM.</li></ol>
<pre>Assign
├── Name x
└── BinOp +
    ├── Num 2
    └── BinOp *        &lt;- deeper = evaluated first (precedence lives in the tree shape)
        ├── Num 3
        └── Name y</pre>
<p>אפשר לראות AST אמיתי תוך שנייה עם Python (פלט של 3.12):</p>
<pre>$ python -c "import ast;print(ast.dump(ast.parse('x = 2 + 3 * y'), indent=2))"
Module(
  body=[
    Assign(
      targets=[
        Name(id='x', ctx=Store())],
      value=BinOp(
        left=Constant(value=2),
        op=Add(),
        right=BinOp(
          left=Constant(value=3),
          op=Mult(),
          right=Name(id='y', ctx=Load()))))],
  type_ignores=[])</pre>
<p>וזה מה ש-compiler native עם אופטימיזציות פולט בסוף עבור <code>int f(int y){ return 2 + 3*y; }</code> עם <code>clang -O2</code> על x86-64 — הכפל והחיבור מקופלים לפקודת חישוב כתובת אחת:</p>
<pre>f:
        lea     eax, [rdi + 2*rdi + 2]
        ret</pre>
<blockquote>💡 מהשטח: אותו חצי קדמי (lexer/parser/AST) מפעיל את ה-linters, ה-formatters, ה-autocomplete ב-IDE, ה-parsers של Terraform/HCL, מנועי SQL ואפילו את <code>jq</code>. ברגע שאתה רואה "טקסט ← tokens ← עץ ← הרצה", כל שפת קונפיגורציה וכל query planner נראים מוכרים.</blockquote>`
      }
    },
    {
      h: { en: "Compiler vs interpreter vs JIT vs AOT", he: "Compiler מול interpreter מול JIT מול AOT" },
      body: {
        en: `<p>These are not properties of a language but of an <em>implementation</em> (Python has CPython and PyPy; Java has HotSpot and GraalVM native image). The real axis is <strong>when machine code is produced</strong>:</p>
<table><tr><th>Model</th><th>When code becomes machine code</th><th>Examples</th><th>Startup</th><th>Peak speed</th></tr>
<tr><td><strong>AOT compiler</strong></td><td>At build time, once</td><td>C, C++, Go, Rust, Swift, GraalVM native image, .NET Native AOT</td><td>Instant (ms)</td><td>High, fixed at build</td></tr>
<tr><td><strong>Interpreter</strong></td><td>Never — a loop executes AST/bytecode op by op</td><td>CPython (mostly), Ruby MRI (without YJIT), Bash</td><td>Fast</td><td>Low (10-100x slower than native on tight loops)</td></tr>
<tr><td><strong>Bytecode VM + JIT</strong></td><td>At run time, only for hot code</td><td>JVM HotSpot, V8 (Node/Chrome), .NET CLR, PyPy, LuaJIT</td><td>Slower; needs warm-up</td><td>High, can beat AOT using runtime profiles</td></tr></table>
<p>A JIT's superpower is <strong>speculation</strong>: it has seen that <code>y</code> was always a small integer, so it compiles a version that assumes that, guarded by a cheap check. If the assumption breaks, it <strong>deoptimizes</strong> back to the interpreter. AOT compilers can't know runtime types and call patterns (unless you feed them a profile: PGO).</p>
<pre># real V8 output (Node 22): the function gets hot, TurboFan compiles it
$ node --trace-opt app.js
[marking 0x008cbb229931 &lt;JSFunction f ...&gt; for optimization to TURBOFAN, ConcurrencyMode::kConcurrent, reason: hot and stable]
[completed compiling 0x008cbb229931 &lt;JSFunction f ...&gt; (target TURBOFAN) - took 0.021, 0.886, 0.017 ms]</pre>
<blockquote>⚠️ Production tip: "Python is slow" usually means "CPython interprets bytecode and has no JIT on by default". The fix is rarely a rewrite — it's pushing hot loops into C-backed libraries (NumPy, Polars), or picking a runtime with a JIT.</blockquote>`,
        he: `<p>אלה לא תכונות של שפה אלא של <em>מימוש</em> (ל-Python יש CPython ו-PyPy; ל-Java יש HotSpot ו-GraalVM native image). הציר האמיתי הוא <strong>מתי נוצר קוד מכונה</strong>:</p>
<table><tr><th>מודל</th><th>מתי הקוד הופך לקוד מכונה</th><th>דוגמאות</th><th>Startup</th><th>מהירות שיא</th></tr>
<tr><td><strong>AOT compiler</strong></td><td>בזמן build, פעם אחת</td><td>C, ‏C++, ‏Go, ‏Rust, ‏Swift, ‏GraalVM native image, ‏.NET Native AOT</td><td>מיידי (ms)</td><td>גבוהה, נקבעת ב-build</td></tr>
<tr><td><strong>Interpreter</strong></td><td>אף פעם — לולאה מריצה AST או bytecode פקודה אחרי פקודה</td><td>CPython (ברובו), ‏Ruby MRI ‏(בלי YJIT), ‏Bash</td><td>מהיר</td><td>נמוכה (פי 10-100 איטי מ-native בלולאות צפופות)</td></tr>
<tr><td><strong>Bytecode VM + JIT</strong></td><td>בזמן ריצה, רק לקוד חם</td><td>JVM HotSpot, ‏V8 ‏(Node/Chrome), ‏.NET CLR, ‏PyPy, ‏LuaJIT</td><td>איטי יותר; צריך warm-up</td><td>גבוהה, יכולה לנצח AOT בזכות profiles מזמן ריצה</td></tr></table>
<p>כוח העל של JIT הוא <strong>ספקולציה</strong>: הוא ראה ש-<code>y</code> תמיד היה מספר שלם קטן, אז הוא מקמפל גרסה שמניחה את זה, עם בדיקה זולה שמגינה עליה. אם ההנחה נשברת, הוא עושה <strong>deoptimization</strong> וחוזר ל-interpreter. AOT compiler לא יכול לדעת טיפוסים ודפוסי קריאות בזמן ריצה (אלא אם אתה מזין לו profile: ‏PGO).</p>
<pre># real V8 output (Node 22): the function gets hot, TurboFan compiles it
$ node --trace-opt app.js
[marking 0x008cbb229931 &lt;JSFunction f ...&gt; for optimization to TURBOFAN, ConcurrencyMode::kConcurrent, reason: hot and stable]
[completed compiling 0x008cbb229931 &lt;JSFunction f ...&gt; (target TURBOFAN) - took 0.021, 0.886, 0.017 ms]</pre>
<blockquote>⚠️ טיפ לפרודקשן: "Python איטי" בדרך כלל אומר "CPython מריץ bytecode ב-interpreter ואין JIT דלוק כברירת מחדל". הפתרון כמעט אף פעם לא שכתוב — מעבירים לולאות חמות לספריות שכתובות ב-C ‏(NumPy, ‏Polars), או בוחרים runtime עם JIT.</blockquote>`
      }
    },
    {
      h: { en: "Bytecode VMs up close: JVM, CPython, V8, .NET", he: "Bytecode VMs מקרוב: JVM, ‏CPython, ‏V8, ‏.NET" },
      body: {
        en: `<p>Most "interpreted" languages first compile to <strong>bytecode</strong> — compact instructions for a virtual stack/register machine. Same function in three VMs: <code>f(y) { x = 2 + 3 * y; return x }</code></p>
<pre># JVM — javac emits .class bytecode; inspect with javap
$ javap -c F.class
  static int f(int);
    Code:
       0: iconst_2
       1: iconst_3
       2: iload_0
       3: imul
       4: iadd
       5: istore_1
       6: iload_1
       7: ireturn

# CPython 3.12 — cached in __pycache__/*.pyc
$ python -m dis f.py
  2           2 LOAD_CONST               1 (2)
              4 LOAD_CONST               2 (3)
              6 LOAD_FAST                0 (y)
              8 BINARY_OP                5 (*)
             12 BINARY_OP                0 (+)
             16 STORE_FAST               1 (x)
  3          18 LOAD_FAST                1 (x)
             20 RETURN_VALUE

# V8 Ignition bytecode (Node 22)
$ node --print-bytecode --print-bytecode-filter=f f.js
   0 : 0d 02             LdaSmi [2]
   2 : c8                Star1
   3 : 0b 03             Ldar a0
   5 : 49 03 01          MulSmi [3], [1]
   8 : 3b f8 00          Add r1, [0]
  11 : c9                Star0
  12 : ae                Return</pre>
<table><tr><th>Runtime</th><th>Tiers (cold → hot)</th><th>Notes</th></tr>
<tr><td><strong>JVM HotSpot</strong></td><td>Interpreter → C1 (quick, with profiling) → C2 (aggressive optimizing)</td><td>Tiered compilation; C2 kicks in after thousands of invocations/loop iterations. Graal JIT can replace C2.</td></tr>
<tr><td><strong>V8</strong></td><td>Ignition (interpreter) → Sparkplug (baseline, no opts) → Maglev (mid-tier) → TurboFan (top)</td><td>Speculates on object "shapes" (hidden classes); deopts if types change.</td></tr>
<tr><td><strong>.NET CLR</strong></td><td>C# → IL (in the .dll) → RyuJIT tier-0 → tier-1 with Dynamic PGO</td><td>Dynamic PGO on by default since .NET 8. ReadyToRun ships precompiled code inside the DLL.</td></tr>
<tr><td><strong>CPython</strong></td><td>Bytecode interpreter; specializing adaptive interpreter since 3.11 (PEP 659)</td><td>Experimental copy-and-patch JIT since 3.13 (build-time opt-in); free-threaded build removes the GIL.</td></tr></table>
<p><strong>LLVM</strong> is the reusable back half of a compiler: a frontend lowers your language to LLVM IR, and LLVM handles optimization and codegen for x86-64, arm64, WebAssembly, RISC-V... Clang (C/C++/Objective-C), rustc, swiftc, Julia and many others are LLVM frontends — which is why Rust and C++ often produce nearly identical machine code.</p>
<pre>; LLVM IR for f (clang -O2 -S -emit-llvm)
define i32 @f(i32 %y) {
  %mul = mul nsw i32 %y, 3
  %add = add nsw i32 %mul, 2
  ret i32 %add
}</pre>
<p>Go is the notable exception: its own compiler and linker (no LLVM), tuned for fast builds rather than maximum optimization.</p>`,
        he: `<p>רוב השפות ה"מפורשות" מתקמפלות קודם ל-<strong>bytecode</strong> — פקודות קומפקטיות למכונה וירטואלית מבוססת stack או registers. אותה פונקציה בשלושה VMs: <code>f(y) { x = 2 + 3 * y; return x }</code></p>
<pre># JVM — javac emits .class bytecode; inspect with javap
$ javap -c F.class
  static int f(int);
    Code:
       0: iconst_2
       1: iconst_3
       2: iload_0
       3: imul
       4: iadd
       5: istore_1
       6: iload_1
       7: ireturn

# CPython 3.12 — cached in __pycache__/*.pyc
$ python -m dis f.py
  2           2 LOAD_CONST               1 (2)
              4 LOAD_CONST               2 (3)
              6 LOAD_FAST                0 (y)
              8 BINARY_OP                5 (*)
             12 BINARY_OP                0 (+)
             16 STORE_FAST               1 (x)
  3          18 LOAD_FAST                1 (x)
             20 RETURN_VALUE

# V8 Ignition bytecode (Node 22)
$ node --print-bytecode --print-bytecode-filter=f f.js
   0 : 0d 02             LdaSmi [2]
   2 : c8                Star1
   3 : 0b 03             Ldar a0
   5 : 49 03 01          MulSmi [3], [1]
   8 : 3b f8 00          Add r1, [0]
  11 : c9                Star0
  12 : ae                Return</pre>
<table><tr><th>Runtime</th><th>שכבות (קר ← חם)</th><th>הערות</th></tr>
<tr><td><strong>JVM HotSpot</strong></td><td>Interpreter ← C1 (מהיר, עם profiling) ← C2 (אופטימיזציות אגרסיביות)</td><td>Tiered compilation; ‏C2 נכנס לפעולה אחרי אלפי קריאות או איטרציות לולאה. ‏Graal JIT יכול להחליף את C2.</td></tr>
<tr><td><strong>V8</strong></td><td>Ignition ‏(interpreter) ← Sparkplug ‏(baseline, בלי אופטימיזציות) ← Maglev ‏(שכבת ביניים) ← TurboFan ‏(העליון)</td><td>מהמר על "צורות" של אובייקטים (hidden classes); עושה deopt אם הטיפוסים משתנים.</td></tr>
<tr><td><strong>.NET CLR</strong></td><td>C# ← IL ‏(בתוך ה-dll) ← RyuJIT tier-0 ← tier-1 עם Dynamic PGO</td><td>Dynamic PGO דלוק כברירת מחדל מאז .NET 8. ‏ReadyToRun שולח קוד מקומפל מראש בתוך ה-DLL.</td></tr>
<tr><td><strong>CPython</strong></td><td>Interpreter של bytecode; ‏specializing adaptive interpreter מאז 3.11 ‏(PEP 659)</td><td>JIT ניסיוני מסוג copy-and-patch מאז 3.13 (הפעלה בזמן build); ה-build ה-free-threaded מוריד את ה-GIL.</td></tr></table>
<p><strong>LLVM</strong> הוא החצי האחורי של compiler, לשימוש חוזר: frontend מוריד את השפה שלך ל-LLVM IR, ו-LLVM מטפל באופטימיזציה וב-codegen ל-x86-64, ‏arm64, ‏WebAssembly, ‏RISC-V... ‏Clang ‏(C/C++/Objective-C), ‏rustc, ‏swiftc, ‏Julia ועוד הרבה הם frontends של LLVM — ולכן Rust ו-C++ מייצרים לעיתים קרובות קוד מכונה כמעט זהה.</p>
<pre>; LLVM IR for f (clang -O2 -S -emit-llvm)
define i32 @f(i32 %y) {
  %mul = mul nsw i32 %y, 3
  %add = add nsw i32 %mul, 2
  ret i32 %add
}</pre>
<p>Go הוא היוצא מן הכלל הבולט: compiler ו-linker משלו (בלי LLVM), מכוונים ל-build מהיר ולא לאופטימיזציה מקסימלית.</p>`
      }
    },
    {
      h: { en: "Warm-up: why a JIT service shouldn't take full traffic at second 1", he: "Warm-up: למה שירות עם JIT לא צריך לקבל את כל התעבורה בשנייה הראשונה" },
      body: {
        en: `<p>A freshly started JVM/.NET/Node process runs your code in the interpreter or baseline tier. For the first seconds to minutes: p99 latency is several times higher, the JIT compiler threads burn CPU in the background, classes are still loading, connection pools and caches are cold. If the load balancer sends it 1/N of production traffic immediately, you get a latency spike on <em>every</em> deploy and every autoscale event.</p>
<pre>typical Spring Boot pod after start (same request, same pod):
  request #1        480 ms   (class loading, interpreter, cold pools)
  request #100       45 ms   (C1 compiled)
  request #10,000     9 ms   (C2 compiled, caches warm)</pre>
<p>What teams actually do:</p>
<ul><li><strong>Warm-up before readiness</strong>: on startup, replay a few hundred representative requests against localhost, then flip the readiness probe to OK. Kubernetes only routes to Ready pods.</li>
<li><strong>Slow start at the load balancer</strong>: AWS ALB target group <code>slow_start.duration_seconds</code>, Envoy <code>slow_start_config</code>, NGINX Plus <code>slow_start</code> ramp a new target's share of traffic over 30-900 s.</li>
<li><strong>Don't starve the JIT</strong>: under a tight CPU limit the C2/TurboFan threads get CFS-throttled, so warm-up takes far longer and the liveness probe may kill the pod mid-warm-up (a classic CrashLoop). Give startup headroom: higher limit (or none, with a request), a <code>startupProbe</code>, or Kubernetes in-place resize / "startup CPU boost" to raise CPU only during start.</li>
<li><strong>Size the runtime to the container</strong>: modern JVMs read cgroup limits and size GC/compiler threads from the visible CPU count; <code>-XX:ActiveProcessorCount</code> overrides it. A JVM that thinks it has 1 CPU picks SerialGC and few compiler threads.</li></ul>
<pre># Kubernetes: give a JIT service time and CPU to warm up
startupProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
  failureThreshold: 30        # up to 150 s before liveness takes over
resources:
  requests: { cpu: "1",  memory: 1Gi }
  limits:   { memory: 1Gi }    # no CPU limit -&gt; JIT threads not throttled at start</pre>
<blockquote>💡 Real world: a team saw 5xx spikes on every deploy of a Java service. Nothing was "broken": new pods passed readiness after 8 s, took 1/6 of traffic in the interpreter and timed out upstream. A 40 s warm-up script before readiness plus ALB slow start made deploys invisible on the dashboards.</blockquote>`,
        he: `<p>תהליך JVM, ‏.NET או Node שעלה עכשיו מריץ את הקוד שלך ב-interpreter או בשכבת ה-baseline. בשניות עד דקות הראשונות: ה-latency של p99 גבוה פי כמה, threads של ה-JIT compiler שורפים CPU ברקע, classes עדיין נטענות, ו-connection pools ו-caches קרים. אם ה-load balancer שולח לו מיד 1/N מתעבורת הפרודקשן, אתה מקבל קפיצת latency <em>בכל</em> deploy ובכל אירוע autoscale.</p>
<pre>typical Spring Boot pod after start (same request, same pod):
  request #1        480 ms   (class loading, interpreter, cold pools)
  request #100       45 ms   (C1 compiled)
  request #10,000     9 ms   (C2 compiled, caches warm)</pre>
<p>מה צוותים עושים בפועל:</p>
<ul><li><strong>Warm-up לפני readiness</strong>: בעלייה, משמיעים כמה מאות בקשות מייצגות מול localhost, ורק אז מעבירים את ה-readiness probe ל-OK. ‏Kubernetes מנתב רק ל-Pods במצב Ready.</li>
<li><strong>Slow start ב-load balancer</strong>: ‏<code>slow_start.duration_seconds</code> ב-target group של AWS ALB, ‏<code>slow_start_config</code> ב-Envoy, ‏<code>slow_start</code> ב-NGINX Plus — מעלים בהדרגה את חלק התעבורה של target חדש לאורך 30-900 שניות.</li>
<li><strong>לא להרעיב את ה-JIT</strong>: תחת CPU limit צפוף ה-threads של C2 או TurboFan חוטפים CFS throttling, אז ה-warm-up לוקח הרבה יותר זמן וה-liveness probe עלול להרוג את ה-Pod באמצע (CrashLoop קלאסי). תן מרווח בעלייה: limit גבוה יותר (או בלי limit, עם request), ‏<code>startupProbe</code>, או in-place resize ב-Kubernetes או "startup CPU boost" כדי להעלות CPU רק בזמן העלייה.</li>
<li><strong>להתאים את ה-runtime לקונטיינר</strong>: JVMs מודרניים קוראים את ה-limits של ה-cgroup ומגדירים threads של GC ושל ה-compiler לפי מספר ה-CPUs שהם רואים; ‏<code>-XX:ActiveProcessorCount</code> דורס את זה. JVM שחושב שיש לו CPU אחד בוחר SerialGC ומעט threads ל-compiler.</li></ul>
<pre># Kubernetes: give a JIT service time and CPU to warm up
startupProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
  failureThreshold: 30        # up to 150 s before liveness takes over
resources:
  requests: { cpu: "1",  memory: 1Gi }
  limits:   { memory: 1Gi }    # no CPU limit -&gt; JIT threads not throttled at start</pre>
<blockquote>💡 מהשטח: צוות ראה קפיצות 5xx בכל deploy של שירות Java. שום דבר לא היה "שבור": Pods חדשים עברו readiness אחרי 8 שניות, קיבלו 1/6 מהתעבורה כשהם עדיין ב-interpreter וחטפו timeouts מה-upstream. סקריפט warm-up של 40 שניות לפני readiness ועוד slow start ב-ALB הפכו את ה-deploys לבלתי נראים בדשבורדים.</blockquote>`
      }
    },
    {
      h: { en: "AOT for the cloud: native image, ReadyToRun, SnapStart — and the trade-offs", he: "AOT לענן: native image, ‏ReadyToRun, ‏SnapStart — והמחירים" },
      body: {
        en: `<p>Serverless and scale-to-zero punish warm-up: a Lambda cold start pays JVM boot + class loading + interpreter on the user's request. Options, from most to least invasive:</p>
<table><tr><th>Technique</th><th>What it does</th><th>Startup</th><th>Cost</th></tr>
<tr><td><strong>GraalVM native image</strong> (Spring Boot / Quarkus / Micronaut)</td><td>Closed-world AOT: whole app + JDK parts into one native binary</td><td>2-6 s → ~50-100 ms; RSS often 3-5x lower</td><td>Build takes minutes and GBs of RAM; reflection/proxies need config; peak throughput can be lower than C2 without PGO</td></tr>
<tr><td><strong>.NET Native AOT</strong> (<code>&lt;PublishAot&gt;true&lt;/PublishAot&gt;</code>)</td><td>Native binary, no JIT at run time</td><td>Tens of ms</td><td>No runtime codegen: limited reflection, trimming warnings to fix</td></tr>
<tr><td><strong>.NET ReadyToRun</strong></td><td>Precompiled code in the DLL, JIT still re-optimizes hot paths</td><td>Noticeably faster</td><td>Bigger DLLs; easy win</td></tr>
<tr><td><strong>JVM CDS / AOT cache</strong> (AppCDS, Project Leyden JEP 483 in JDK 24, JEP 515 in JDK 25)</td><td>Cache loaded/linked classes and method profiles from a training run</td><td>Often 30-40% faster start</td><td>Keep the cache in sync with the build</td></tr>
<tr><td><strong>Snapshot/restore</strong> (Lambda SnapStart, CRaC)</td><td>Snapshot an initialized, even warmed process; restore instead of booting</td><td>Sub-second</td><td>Uniqueness (random seeds, connections) must be re-initialized after restore</td></tr></table>
<pre># GraalVM native image with Spring Boot 3
$ ./mvnw -Pnative native:compile
$ ls -lh target/app &amp;&amp; ./target/app
-rwxr-xr-x 1 dev dev 78M  target/app
... Started App in 0.061 seconds (process running for 0.067)</pre>
<p><strong>What it means for containers:</strong></p>
<ul><li>AOT languages (Go, Rust) and native images give tiny images, instant start and steady memory — ideal for scale-to-zero, CLIs, sidecars and Lambdas.</li>
<li>JIT runtimes shine on long-running, high-throughput services where warm-up is amortized over days. Their CPU request should cover steady state; their startup needs headroom.</li>
<li>A native binary is built for one OS + CPU architecture: arm64 nodes (Graviton) need an arm64 build. A JVM .jar runs anywhere a JVM exists.</li></ul>
<blockquote>⚠️ Production tip: AOT moves cost from run time to build time. A native-image build that takes 6 minutes and 8 GB RAM will blow up a default CI runner — budget runner size and cache before you promise "50 ms startup".</blockquote>`,
        he: `<p>Serverless ו-scale-to-zero מענישים warm-up: ‏cold start של Lambda משלם על עליית JVM, טעינת classes ו-interpreter — על הבקשה של המשתמש. האפשרויות, מהכי פולשנית להכי פחות:</p>
<table><tr><th>טכניקה</th><th>מה היא עושה</th><th>Startup</th><th>מחיר</th></tr>
<tr><td><strong>GraalVM native image</strong> ‏(Spring Boot, ‏Quarkus, ‏Micronaut)</td><td>AOT בעולם סגור: כל האפליקציה וחלקים מה-JDK לתוך בינארי native אחד</td><td>2-6 שניות ← בערך 50-100 ms; ‏RSS לרוב נמוך פי 3-5</td><td>ה-build לוקח דקות ו-GBs של RAM; ‏reflection ו-proxies צריכים קונפיגורציה; מהירות שיא יכולה להיות נמוכה מ-C2 בלי PGO</td></tr>
<tr><td><strong>.NET Native AOT</strong> ‏(<code>&lt;PublishAot&gt;true&lt;/PublishAot&gt;</code>)</td><td>בינארי native, בלי JIT בזמן ריצה</td><td>עשרות ms</td><td>אין יצירת קוד בזמן ריצה: ‏reflection מוגבל, אזהרות trimming לתקן</td></tr>
<tr><td><strong>.NET ReadyToRun</strong></td><td>קוד מקומפל מראש בתוך ה-DLL, וה-JIT עדיין משפר נתיבים חמים</td><td>מהיר יותר בצורה מורגשת</td><td>DLLs גדולים יותר; רווח קל</td></tr>
<tr><td><strong>JVM CDS או AOT cache</strong> ‏(AppCDS, ‏Project Leyden: ‏JEP 483 ב-JDK 24, ‏JEP 515 ב-JDK 25)</td><td>שומר classes טעונות ומקושרות ו-profiles של מתודות מריצת אימון</td><td>לרוב startup מהיר ב-30-40%</td><td>צריך לשמור את ה-cache מסונכרן עם ה-build</td></tr>
<tr><td><strong>Snapshot/restore</strong> ‏(Lambda SnapStart, ‏CRaC)</td><td>מצלם תהליך מאותחל, אפילו חם, ומשחזר במקום לעלות מאפס</td><td>פחות משנייה</td><td>דברים ייחודיים (random seeds, חיבורים) צריך לאתחל מחדש אחרי restore</td></tr></table>
<pre># GraalVM native image with Spring Boot 3
$ ./mvnw -Pnative native:compile
$ ls -lh target/app &amp;&amp; ./target/app
-rwxr-xr-x 1 dev dev 78M  target/app
... Started App in 0.061 seconds (process running for 0.067)</pre>
<p><strong>מה זה אומר לקונטיינרים:</strong></p>
<ul><li>שפות AOT ‏(Go, ‏Rust) ו-native images נותנים images קטנטנים, עלייה מיידית וזיכרון יציב — אידיאלי ל-scale-to-zero, ל-CLIs, ל-sidecars ול-Lambdas.</li>
<li>Runtimes עם JIT זורחים בשירותים ארוכי חיים עם throughput גבוה, שבהם ה-warm-up מתחלק על פני ימים. ה-CPU request שלהם צריך לכסות מצב יציב; העלייה שלהם צריכה מרווח.</li>
<li>בינארי native נבנה למערכת הפעלה אחת וארכיטקטורת CPU אחת: ‏nodes של arm64 ‏(Graviton) צריכים build של arm64. קובץ jar של JVM רץ בכל מקום שיש בו JVM.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: AOT מעביר עלות מזמן ריצה לזמן build. ‏build של native image שלוקח 6 דקות ו-8 GB RAM יפיל runner ברירת מחדל ב-CI — תתכנן גודל runner ו-cache לפני שאתה מבטיח "startup של 50 ms".</blockquote>`
      }
    }
  ],
  diagram: `source ─► lexer ─► tokens ─► parser ─► AST ─► semantic analysis ─► IR ─► optimizer ─► codegen
                                                                          │
   AOT (Go, Rust, C, native image):  at build time ──────────────────────┴─► machine code in the binary
   Interpreter (CPython):            bytecode ─► eval loop, op by op, every time
   JIT (JVM, V8, .NET):              bytecode ─► interpreter ─► profile ─► hot? ─► optimized machine code
                                                     ▲                                   │
                                                     └──────── deopt (assumption broke) ◄┘`,
  handsOn: [
    { cmd: "python -c \"import ast;print(ast.dump(ast.parse('x = 2 + 3 * y'), indent=2))\"", what: { en: "Print the real AST CPython builds for one line — precedence is visible in the tree shape.", he: "מדפיס את ה-AST האמיתי ש-CPython בונה לשורה אחת — הקדימות רואים בצורת העץ." } },
    { cmd: "python -m dis -c \"x = 2 + 3 * y\"", what: { en: "Disassemble to CPython bytecode (3.13+ accepts -c; on older versions run dis on a file).", he: "מפרק ל-bytecode של CPython ‏(‏3.13 ומעלה מקבל ‎-c; בגרסאות ישנות מריצים dis על קובץ)." } },
    { cmd: "node --trace-opt --trace-deopt app.js 2>&1 | grep -E 'TURBOFAN|MAGLEV|deoptimiz'", what: { en: "Watch V8 promote hot functions to Maglev/TurboFan and deoptimize them when types change.", he: "צופה ב-V8 מקדם פונקציות חמות ל-Maglev או TurboFan ועושה להן deopt כשהטיפוסים משתנים." } },
    { cmd: "javap -c -p target/classes/com/acme/F.class", what: { en: "Read the JVM bytecode javac produced (iload, imul, invokevirtual...).", he: "קורא את ה-bytecode של JVM ש-javac ייצר (iload, ‏imul, ‏invokevirtual...)." } },
    { cmd: "java -Xlog:os+container=info -XX:+PrintFlagsFinal -version | grep -E 'ActiveProcessorCount|CICompilerCount|UseSerialGC|UseG1GC'", what: { en: "See how the JVM sized itself to the container: CPU count, JIT compiler threads, chosen GC.", he: "רואה איך ה-JVM התאים את עצמו לקונטיינר: מספר CPUs, ‏threads של ה-JIT compiler, ה-GC שנבחר." } }
  ],
  mnemonic: {
    en: "\"Translate the book, hire an interpreter, or hire one who learns your favorite chapters.\" AOT pays at build, interpreters pay every time, JITs pay at warm-up.",
    he: "\"לתרגם את הספר, לשכור מתורגמן, או לשכור מתורגמן שלומד את הפרקים האהובים עליך.\" AOT משלם ב-build, ‏interpreter משלם כל פעם, ‏JIT משלם ב-warm-up."
  },
  pitfalls: [
    { en: "Judging a JIT service by its first minute: load tests and benchmarks that don't warm up measure the interpreter, not your code. Discard the warm-up window (JMH does this for you).", he: "לשפוט שירות עם JIT לפי הדקה הראשונה שלו: בדיקות עומס ו-benchmarks בלי warm-up מודדים את ה-interpreter, לא את הקוד שלך. תזרוק את חלון ה-warm-up ‏(JMH עושה את זה בשבילך)." },
    { en: "A tight CPU limit on a JVM/.NET pod: JIT and GC threads get throttled at startup, warm-up stretches, liveness kills the pod, and you get a CrashLoop that 'only happens in prod'.", he: "CPU limit צפוף על Pod של JVM או .NET: ה-threads של ה-JIT וה-GC חוטפים throttling בעלייה, ה-warm-up נמתח, ה-liveness הורג את ה-Pod, ומקבלים CrashLoop ש'קורה רק בפרודקשן'." },
    { en: "Adopting native image without testing reflection-heavy code paths: missing reflection config fails at run time (ClassNotFoundException / NoSuchMethod) only on the code path that uses it.", he: "לאמץ native image בלי לבדוק נתיבי קוד עם הרבה reflection: קונפיגורציית reflection חסרה נכשלת רק בזמן ריצה (ClassNotFoundException או NoSuchMethod) ורק בנתיב שמשתמש בה." },
    { en: "Thinking 'compiled vs interpreted' is a property of the language. It's the implementation — PyPy JITs Python, GraalVM AOTs Java, and every 'interpreted' language compiles to bytecode first.", he: "לחשוב ש'מקומפל מול מפורש' זו תכונה של השפה. זה המימוש — PyPy עושה JIT ל-Python, ‏GraalVM עושה AOT ל-Java, וכל שפה 'מפורשת' מתקמפלת קודם ל-bytecode." }
  ],
  interview: [
    { q: { en: "Why can a JIT sometimes beat an AOT compiler, and what does it cost?", he: "למה JIT יכול לפעמים לנצח AOT compiler, ומה המחיר?" },
      a: { en: "It optimizes with real runtime data: actual types, hot branches, call targets — so it can inline virtual calls and specialize on observed types, with guards and deoptimization as the safety net. The cost is warm-up time, CPU for compiler threads, memory for the code cache and profiles, and less predictable latency early on. AOT can close part of the gap with PGO.", he: "הוא עושה אופטימיזציה עם נתונים אמיתיים מזמן ריצה: טיפוסים בפועל, branches חמים, יעדי קריאות — אז הוא יכול לעשות inline לקריאות וירטואליות ולהתמחות בטיפוסים שנצפו, עם guards ו-deoptimization כרשת ביטחון. המחיר הוא זמן warm-up, ‏CPU ל-threads של ה-compiler, זיכרון ל-code cache ול-profiles, ו-latency פחות צפוי בהתחלה. ‏AOT יכול לסגור חלק מהפער עם PGO." } },
    { q: { en: "New pods of a Java service cause a p99 spike on every deploy. What's happening and how do you fix it?", he: "Pods חדשים של שירות Java גורמים לקפיצת p99 בכל deploy. מה קורה ואיך מתקנים?" },
      a: { en: "They become Ready before they're warm: code still interpreted, classes loading, pools empty, maybe CPU-throttled JIT threads. Fix: warm-up traffic before readiness, a startupProbe, LB slow start, enough CPU at startup (no tight limit or a startup boost), and consider AppCDS/Leyden AOT cache or CRaC to cut startup work.", he: "הם הופכים ל-Ready לפני שהם חמים: הקוד עדיין ב-interpreter, ‏classes נטענות, ה-pools ריקים, ואולי threads של ה-JIT חוטפים throttling. תיקון: תעבורת warm-up לפני readiness, ‏startupProbe, ‏slow start ב-LB, מספיק CPU בעלייה (בלי limit צפוף או עם startup boost), ולשקול AppCDS, ‏AOT cache של Leyden או CRaC כדי לקצץ עבודת עלייה." } },
    { q: { en: "What is LLVM and why do so many languages use it?", he: "מה זה LLVM ולמה כל כך הרבה שפות משתמשות בו?" },
      a: { en: "A reusable compiler back end: frontends (Clang, rustc, swiftc) lower code to LLVM IR, and LLVM does optimization and machine code generation for many targets. A new language gets decades of optimizer work and support for x86-64, arm64, WebAssembly etc. without writing its own back end.", he: "Back end של compiler לשימוש חוזר: ‏frontends ‏(Clang, ‏rustc, ‏swiftc) מורידים קוד ל-LLVM IR, ו-LLVM עושה אופטימיזציה ויצירת קוד מכונה להרבה targets. שפה חדשה מקבלת עשרות שנים של עבודה על optimizer ותמיכה ב-x86-64, ‏arm64, ‏WebAssembly וכו' בלי לכתוב back end משלה." } }
  ],
  quiz: [
    { q: { en: "In the AST for x = 2 + 3 * y, which node is deepest (evaluated first)?", he: "ב-AST של x = 2 + 3 * y, איזה צומת הכי עמוק (מחושב ראשון)?" },
      options: [ { en: "The + node", he: "הצומת +" }, { en: "The * node (3 * y)", he: "הצומת * ‏(3 * y)" }, { en: "The assignment", he: "ההשמה" }, { en: "They're all at the same depth", he: "כולם באותו עומק" } ],
      answer: 1, explain: { en: "Precedence is encoded in the tree shape: * binds tighter, so BinOp(*) is a child of BinOp(+) and gets evaluated first.", he: "הקדימות מקודדת בצורת העץ: * קושר חזק יותר, אז BinOp(*) הוא ילד של BinOp(+) ומחושב ראשון." } },
    { q: { en: "Which runtime pipeline is correct for V8 (Node.js) from cold to hot?", he: "איזה pipeline נכון ל-V8 ‏(Node.js) מקר לחם?" },
      options: [ { en: "C1 → C2", he: "C1 ← C2" }, { en: "Ignition → Sparkplug → Maglev → TurboFan", he: "Ignition ← Sparkplug ← Maglev ← TurboFan" }, { en: "IL → RyuJIT", he: "IL ← RyuJIT" }, { en: "LLVM IR → Clang", he: "LLVM IR ← Clang" } ],
      answer: 1, explain: { en: "V8 interprets with Ignition, then baseline-compiles with Sparkplug, mid-tier optimizes with Maglev and fully optimizes with TurboFan. C1/C2 are HotSpot's, RyuJIT is .NET's.", he: "V8 מריץ ב-Ignition, אחר כך מקמפל baseline עם Sparkplug, אופטימיזציית ביניים עם Maglev ואופטימיזציה מלאה עם TurboFan. ‏C1/C2 שייכים ל-HotSpot, ו-RyuJIT ל-.NET." } },
    { q: { en: "A Java Lambda has 4 s cold starts. Which change attacks the root cause without rewriting the service?", he: "ל-Lambda ב-Java יש cold starts של 4 שניות. איזה שינוי תוקף את שורש הבעיה בלי לשכתב את השירות?" },
      options: [ { en: "Double the memory and hope", he: "להכפיל זיכרון ולקוות" }, { en: "Add a CPU limit", he: "להוסיף CPU limit" }, { en: "SnapStart (restore an initialized snapshot) or a GraalVM native image", he: "SnapStart (שחזור snapshot מאותחל) או GraalVM native image" }, { en: "Switch the log level to DEBUG", he: "להעביר את ה-log level ל-DEBUG" } ],
      answer: 2, explain: { en: "The cost is JVM boot + class loading + interpreter. Snapshot/restore skips the init; native image removes the JVM start entirely. More memory gives more CPU on Lambda but doesn't remove the work.", he: "המחיר הוא עליית JVM, טעינת classes ו-interpreter. ‏Snapshot/restore מדלג על האתחול; ‏native image מוריד לגמרי את עליית ה-JVM. יותר זיכרון נותן יותר CPU ב-Lambda אבל לא מוריד את העבודה." } },
    { q: { en: "Why does a tight CPU limit hurt a JVM pod mostly at startup?", he: "למה CPU limit צפוף פוגע ב-Pod של JVM בעיקר בעלייה?" },
      options: [ { en: "Bytecode needs more CPU than machine code forever", he: "Bytecode צריך יותר CPU מקוד מכונה לתמיד" }, { en: "JIT compiler threads, class loading and the interpreter all compete for CPU at once and get CFS-throttled", he: "Threads של ה-JIT compiler, טעינת classes וה-interpreter מתחרים על CPU בבת אחת וחוטפים CFS throttling" }, { en: "The limit disables the GC", he: "ה-limit מכבה את ה-GC" }, { en: "Kubernetes doesn't apply limits after startup", he: "Kubernetes לא מפעיל limits אחרי העלייה" } ],
      answer: 1, explain: { en: "Startup is the CPU-heaviest phase of a JIT runtime. Once hot code is compiled, CPU per request drops sharply; throttling during warm-up stretches it and can trip liveness probes.", he: "העלייה היא השלב הכי כבד ב-CPU של runtime עם JIT. אחרי שהקוד החם מקומפל, ה-CPU לבקשה יורד חזק; ‏throttling בזמן warm-up מותח אותו ויכול להפיל liveness probes." } }
  ],
  playground: "terminal",
  related: ["pr-platforms", "pr-garbage-collection", "pr-event-loop", "cpu", "linux-cgroups-v2", "cloud-serverless", "transpilers-bundlers", "linking-binaries"]
});

INFRA.lessons.push({
  id: "transpilers-bundlers",
  track: "foundations",
  order: 41,
  icon: "🧰",
  level: 2,
  minutes: 15,
  title: { en: "Transpilers, Bundlers & Build Tooling", he: "Transpilers, ‏Bundlers וכלי Build" },
  tldr: {
    en: "A transpiler is a compiler whose output is another high-level language (TypeScript → JavaScript, Sass → CSS); a bundler stitches hundreds of modules into a few optimized, cacheable files. Type-check with tsc, transpile with something fast (esbuild/SWC), lower syntax for your targets, polyfill missing APIs, tree-shake, split, minify — and keep source maps private.",
    he: "Transpiler הוא compiler שהפלט שלו הוא שפה עילית אחרת (TypeScript ← JavaScript, ‏Sass ← CSS); ‏bundler תופר מאות מודולים לכמה קבצים אופטימליים שאפשר לשמור ב-cache. בודקים טיפוסים עם tsc, עושים transpile עם משהו מהיר (esbuild או SWC), מורידים syntax לפי ה-targets שלך, עושים polyfill ל-APIs חסרים, ‏tree shaking, פיצול, ‏minify — ושומרים את ה-source maps פרטיים."
  },
  analogy: {
    en: "A transpiler is a translator from British English to American English: same level of language, different dialect the audience understands (old browsers, Node). A bundler is the publisher: it takes 400 loose manuscript pages, removes chapters nobody references (tree shaking), splits the book into volumes you buy only when needed (code splitting), and prints it in tiny font to save paper (minification). The source map is the editor's annotated copy — you keep it in the office, not on the shelf.",
    he: "Transpiler זה מתרגם מאנגלית בריטית לאנגלית אמריקאית: אותה רמת שפה, ניב אחר שהקהל מבין (דפדפנים ישנים, ‏Node). ‏Bundler זה ההוצאה לאור: לוקחת 400 דפי כתב יד, מורידה פרקים שאף אחד לא מפנה אליהם (tree shaking), מחלקת את הספר לכרכים שקונים רק כשצריך (code splitting), ומדפיסה בפונט קטנטן כדי לחסוך נייר (minification). ה-source map הוא העותק עם ההערות של העורך — שומרים אותו במשרד, לא על המדף."
  },
  sections: [
    {
      h: { en: "Transpiler vs compiler — and the TypeScript split", he: "Transpiler מול compiler — והפיצול של TypeScript" },
      body: {
        en: `<p>A <strong>transpiler</strong> (source-to-source compiler) runs the same front half as any compiler — lexer, parser, AST — but its codegen emits another high-level language. Nothing special happens at run time; the output is just JavaScript (or CSS) that some engine then compiles again.</p>
<p>TypeScript does two independent jobs, and modern toolchains split them:</p>
<table><tr><th>Job</th><th>Tool</th><th>Speed</th><th>Notes</th></tr>
<tr><td><strong>Type-check</strong></td><td><code>tsc --noEmit</code> (or the Go-based native compiler <code>tsgo</code>, planned as TypeScript 7)</td><td>Slow — needs the whole program</td><td>The only thing that catches type errors. Run in CI and the editor.</td></tr>
<tr><td><strong>Emit JS (strip types)</strong></td><td>esbuild, SWC, Babel, Node itself</td><td>10-100x faster — file by file, no type info</td><td>Requires <code>isolatedModules: true</code>; never reports type errors</td></tr></table>
<pre>// src/price.ts
export function total(items: { price: number }[], vat = 0.18): number {
  return items.reduce((s, i) =&gt; s + i.price, 0) * (1 + vat);
}
// after type stripping — same code, types erased:
export function total(items, vat = 0.18) {
  return items.reduce((s, i) =&gt; s + i.price, 0) * (1 + vat);
}</pre>
<p><strong>Node runs TypeScript directly</strong> by type stripping (unflagged since Node 23.6 and 22.18): <code>node app.ts</code> replaces type annotations with whitespace (so line/column stay correct — no source map needed). It only handles <em>erasable</em> syntax: <code>enum</code>, <code>namespace</code> with runtime code and constructor parameter properties need real code generation, so they fail (or need <code>--experimental-transform-types</code>). TypeScript 5.8's <code>--erasableSyntaxOnly</code> flag makes tsc reject them up front.</p>
<pre>$ node app.ts
(node:4121) ExperimentalWarning: Type Stripping is an experimental feature ...   # older 22.x/23.x
$ tsc --noEmit
src/price.ts:8:7 - error TS2322: Type 'string' is not assignable to type 'number'.</pre>
<blockquote>⚠️ Production tip: a build that uses esbuild/SWC/Vite <em>without</em> a separate <code>tsc --noEmit</code> step ships type errors to prod happily. Make type-check its own CI job.</blockquote>`,
        he: `<p><strong>Transpiler</strong> ‏(source-to-source compiler) מריץ את אותו חצי קדמי כמו כל compiler — lexer, ‏parser, ‏AST — אבל ה-codegen שלו פולט שפה עילית אחרת. שום דבר מיוחד לא קורה בזמן ריצה; הפלט הוא פשוט JavaScript (או CSS) שמנוע כלשהו מקמפל שוב אחר כך.</p>
<p>TypeScript עושה שתי עבודות נפרדות, ו-toolchains מודרניים מפצלים אותן:</p>
<table><tr><th>עבודה</th><th>כלי</th><th>מהירות</th><th>הערות</th></tr>
<tr><td><strong>בדיקת טיפוסים</strong></td><td><code>tsc --noEmit</code> (או ה-compiler ה-native שכתוב ב-Go, ‏<code>tsgo</code>, שמתוכנן כ-TypeScript 7)</td><td>איטי — צריך את כל התוכנית</td><td>הדבר היחיד שתופס שגיאות טיפוסים. מריצים ב-CI ובעורך.</td></tr>
<tr><td><strong>פליטת JS (הסרת טיפוסים)</strong></td><td>esbuild, ‏SWC, ‏Babel, ‏Node עצמו</td><td>מהיר פי 10-100 — קובץ אחרי קובץ, בלי מידע על טיפוסים</td><td>דורש <code>isolatedModules: true</code>; אף פעם לא מדווח על שגיאות טיפוסים</td></tr></table>
<pre>// src/price.ts
export function total(items: { price: number }[], vat = 0.18): number {
  return items.reduce((s, i) =&gt; s + i.price, 0) * (1 + vat);
}
// after type stripping — same code, types erased:
export function total(items, vat = 0.18) {
  return items.reduce((s, i) =&gt; s + i.price, 0) * (1 + vat);
}</pre>
<p><strong>Node מריץ TypeScript ישירות</strong> בעזרת type stripping (בלי flag מאז Node 23.6 ו-22.18): ‏<code>node app.ts</code> מחליף את ה-type annotations ברווחים (כך ששורה ועמודה נשארות נכונות — לא צריך source map). הוא מטפל רק ב-syntax <em>שאפשר למחוק</em>: ‏<code>enum</code>, ‏<code>namespace</code> עם קוד בזמן ריצה ו-parameter properties בבנאי צריכים יצירת קוד אמיתית, אז הם נכשלים (או צריכים <code>--experimental-transform-types</code>). ה-flag ‏<code>--erasableSyntaxOnly</code> של TypeScript 5.8 גורם ל-tsc לדחות אותם מראש.</p>
<pre>$ node app.ts
(node:4121) ExperimentalWarning: Type Stripping is an experimental feature ...   # older 22.x/23.x
$ tsc --noEmit
src/price.ts:8:7 - error TS2322: Type 'string' is not assignable to type 'number'.</pre>
<blockquote>⚠️ טיפ לפרודקשן: build שמשתמש ב-esbuild, ‏SWC או Vite <em>בלי</em> שלב נפרד של <code>tsc --noEmit</code> ישלח שגיאות טיפוסים לפרודקשן בשמחה. תעשה מבדיקת הטיפוסים job נפרד ב-CI.</blockquote>`
      }
    },
    {
      h: { en: "Targets, syntax lowering vs polyfills", he: "Targets, ‏syntax lowering מול polyfills" },
      body: {
        en: `<p>Your code says <code>a?.b ?? 0</code>; an old Safari doesn't parse it. Two very different fixes:</p>
<table><tr><th></th><th>Syntax lowering (transpile)</th><th>Polyfill</th></tr>
<tr><td>Fixes</td><td>New <em>syntax</em>: <code>?.</code>, <code>??</code>, classes, async/await, JSX</td><td>Missing <em>runtime APIs</em>: <code>Array.prototype.at</code>, <code>Promise.withResolvers</code>, <code>structuredClone</code></td></tr>
<tr><td>How</td><td>Rewrite the code at build time</td><td>Ship JS that adds the missing function at run time (core-js)</td></tr>
<tr><td>Tool</td><td>Babel preset-env, esbuild <code>--target</code>, SWC <code>env</code></td><td>core-js via Babel <code>useBuiltIns: "usage"</code>, or a polyfill service</td></tr></table>
<pre>$ echo 'export const v = a?.b ?? 0' | npx esbuild --target=es2019     # ?. and ?? arrived in ES2020
var _a;
export const v = (_a = a == null ? void 0 : a.b) != null ? _a : 0;</pre>
<p>esbuild lowers syntax but never adds polyfills: <code>[1,2,3].at(-1)</code> passes through untouched and throws <code>TypeError: ... .at is not a function</code> on an old browser. You decide targets once with <strong>browserslist</strong>, and Babel, Autoprefixer and others read it:</p>
<pre># package.json
"browserslist": ["&gt; 0.5%", "last 2 versions", "not dead"]

$ npx browserslist "&gt; 0.5%, last 2 versions, not dead" | head -4
and_chr 131
chrome 131
chrome 130
edge 131</pre>
<blockquote>💡 Real world: over-broad targets (IE11-era defaults left in a config) can add 30-40% to bundle size in lowered async/await state machines and polyfills nobody needs. Re-checking targets is one of the cheapest frontend performance wins.</blockquote>`,
        he: `<p>הקוד שלך כותב <code>a?.b ?? 0</code>; ‏Safari ישן לא מצליח לפרסר את זה. שני תיקונים שונים מאוד:</p>
<table><tr><th></th><th>Syntax lowering ‏(transpile)</th><th>Polyfill</th></tr>
<tr><td>מתקן</td><td><em>Syntax</em> חדש: ‏<code>?.</code>, ‏<code>??</code>, ‏classes, ‏async/await, ‏JSX</td><td><em>APIs</em> חסרים בזמן ריצה: ‏<code>Array.prototype.at</code>, ‏<code>Promise.withResolvers</code>, ‏<code>structuredClone</code></td></tr>
<tr><td>איך</td><td>משכתב את הקוד בזמן build</td><td>שולח JS שמוסיף את הפונקציה החסרה בזמן ריצה (core-js)</td></tr>
<tr><td>כלי</td><td>Babel preset-env, ‏esbuild עם <code>--target</code>, ‏SWC עם <code>env</code></td><td>core-js דרך <code>useBuiltIns: "usage"</code> של Babel, או שירות polyfill</td></tr></table>
<pre>$ echo 'export const v = a?.b ?? 0' | npx esbuild --target=es2019     # ?. and ?? arrived in ES2020
var _a;
export const v = (_a = a == null ? void 0 : a.b) != null ? _a : 0;</pre>
<p>esbuild מוריד syntax אבל אף פעם לא מוסיף polyfills: ‏<code>[1,2,3].at(-1)</code> עובר בלי שינוי וזורק <code>TypeError: ... .at is not a function</code> בדפדפן ישן. מחליטים על targets פעם אחת עם <strong>browserslist</strong>, ו-Babel, ‏Autoprefixer ואחרים קוראים אותו:</p>
<pre># package.json
"browserslist": ["&gt; 0.5%", "last 2 versions", "not dead"]

$ npx browserslist "&gt; 0.5%, last 2 versions, not dead" | head -4
and_chr 131
chrome 131
chrome 130
edge 131</pre>
<blockquote>💡 מהשטח: targets רחבים מדי (ברירות מחדל מתקופת IE11 שנשארו בקונפיג) יכולים להוסיף 30-40% לגודל ה-bundle ב-state machines של async/await שהורדו וב-polyfills שאף אחד לא צריך. לבדוק מחדש את ה-targets זה אחד מהרווחים הכי זולים בביצועי frontend.</blockquote>`
      }
    },
    {
      h: { en: "Bundlers: tree shaking, code splitting, minification", he: "Bundlers: ‏tree shaking, ‏code splitting, ‏minification" },
      body: {
        en: `<p>A bundler builds a <strong>module graph</strong> from your entry point, follows every <code>import</code>, then emits a few files optimized for the network.</p>
<table><tr><th>Tool</th><th>Written in</th><th>Sweet spot</th></tr>
<tr><td><strong>webpack</strong></td><td>JS</td><td>Huge plugin/loader ecosystem, legacy apps, Module Federation</td></tr>
<tr><td><strong>Rollup</strong></td><td>JS (Rust parser)</td><td>Libraries; clean ESM output; Vite's production bundler</td></tr>
<tr><td><strong>esbuild</strong></td><td>Go</td><td>Extremely fast bundling/transpiling; CLIs, Lambdas, Vite dev pre-bundling</td></tr>
<tr><td><strong>Vite</strong></td><td>JS + esbuild + Rollup (moving to Rust-based Rolldown)</td><td>Default for new SPAs: native-ESM dev server, Rollup build</td></tr>
<tr><td><strong>Rspack / Turbopack</strong></td><td>Rust</td><td>Rspack: webpack-compatible drop-in, 5-10x faster. Turbopack: Next.js bundler (default in Next.js 16)</td></tr></table>
<ul><li><strong>Tree shaking</strong>: drop exports nobody imports. Works only on static ES modules (<code>import { debounce } from "lodash-es"</code>), not CommonJS <code>require</code>. Mark side-effect-free packages with <code>"sideEffects": false</code> in package.json, or the bundler must keep module top-level code "just in case".</li>
<li><strong>Code splitting</strong>: dynamic <code>import("./admin")</code> becomes a separate chunk loaded on demand. Output files carry content hashes (<code>admin.3f9a1c2b.js</code>) so they can be cached with <code>Cache-Control: max-age=31536000, immutable</code> — only <code>index.html</code> must be short-cached.</li>
<li><strong>Minification</strong>: remove whitespace/comments, mangle local names, fold constants, drop dead branches (<code>if (process.env.NODE_ENV !== "production")</code>). Terser, esbuild and SWC minifiers are the common choices.</li></ul>
<pre>$ npx esbuild src/index.ts --bundle --minify --sourcemap --target=es2020 --outfile=dist/app.js

  dist/app.js      48.2kb
  dist/app.js.map  156.3kb

⚡ Done in 12ms

$ npx vite build
vite v6.0.7 building for production...
✓ 412 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-DiwrgTda.css    4.12 kB │ gzip:  1.41 kB
dist/assets/admin-B1o2xY7Q.js    21.37 kB │ gzip:  7.02 kB
dist/assets/index-C8kq3Yp1.js   143.65 kB │ gzip: 46.11 kB
✓ built in 1.84s</pre>
<blockquote>💡 Real world: one <code>import _ from "lodash"</code> (CommonJS, whole library) adds ~70 kB minified. Switching to <code>lodash-es</code> named imports or native methods is a classic 5-minute bundle win. Check with <code>npx vite-bundle-visualizer</code> or webpack-bundle-analyzer.</blockquote>`,
        he: `<p>Bundler בונה <strong>גרף מודולים</strong> מנקודת הכניסה שלך, עוקב אחרי כל <code>import</code>, ואז פולט כמה קבצים שמותאמים לרשת.</p>
<table><tr><th>כלי</th><th>כתוב ב-</th><th>איפה הוא מצטיין</th></tr>
<tr><td><strong>webpack</strong></td><td>JS</td><td>אקוסיסטם ענק של plugins ו-loaders, אפליקציות legacy, ‏Module Federation</td></tr>
<tr><td><strong>Rollup</strong></td><td>JS ‏(parser ב-Rust)</td><td>ספריות; פלט ESM נקי; ה-bundler של Vite לפרודקשן</td></tr>
<tr><td><strong>esbuild</strong></td><td>Go</td><td>bundling ו-transpiling מהירים בטירוף; ‏CLIs, ‏Lambdas, ‏pre-bundling בזמן פיתוח ב-Vite</td></tr>
<tr><td><strong>Vite</strong></td><td>JS + esbuild + Rollup (עובר ל-Rolldown שכתוב ב-Rust)</td><td>ברירת המחדל ל-SPAs חדשים: dev server עם ESM native, ‏build עם Rollup</td></tr>
<tr><td><strong>Rspack / Turbopack</strong></td><td>Rust</td><td>Rspack: תחליף תואם webpack, מהיר פי 5-10. ‏Turbopack: ה-bundler של Next.js ‏(ברירת מחדל ב-Next.js 16)</td></tr></table>
<ul><li><strong>Tree shaking</strong>: מוריד exports שאף אחד לא מייבא. עובד רק על ES modules סטטיים (<code>import { debounce } from "lodash-es"</code>), לא על <code>require</code> של CommonJS. תסמן חבילות בלי side effects עם <code>"sideEffects": false</code> ב-package.json, אחרת ה-bundler חייב להשאיר קוד top-level של מודול "ליתר ביטחון".</li>
<li><strong>Code splitting</strong>: ‏<code>import("./admin")</code> דינמי הופך ל-chunk נפרד שנטען לפי דרישה. לקבצי הפלט יש content hash ‏(<code>admin.3f9a1c2b.js</code>) כך שאפשר לשמור אותם ב-cache עם <code>Cache-Control: max-age=31536000, immutable</code> — רק <code>index.html</code> צריך cache קצר.</li>
<li><strong>Minification</strong>: מוריד רווחים והערות, מקצר שמות מקומיים, מקפל קבועים, מוחק branches מתים (<code>if (process.env.NODE_ENV !== "production")</code>). ה-minifiers של Terser, ‏esbuild ו-SWC הם הבחירות הנפוצות.</li></ul>
<pre>$ npx esbuild src/index.ts --bundle --minify --sourcemap --target=es2020 --outfile=dist/app.js

  dist/app.js      48.2kb
  dist/app.js.map  156.3kb

⚡ Done in 12ms

$ npx vite build
vite v6.0.7 building for production...
✓ 412 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-DiwrgTda.css    4.12 kB │ gzip:  1.41 kB
dist/assets/admin-B1o2xY7Q.js    21.37 kB │ gzip:  7.02 kB
dist/assets/index-C8kq3Yp1.js   143.65 kB │ gzip: 46.11 kB
✓ built in 1.84s</pre>
<blockquote>💡 מהשטח: ‏<code>import _ from "lodash"</code> אחד (CommonJS, כל הספרייה) מוסיף בערך 70 kB אחרי minify. מעבר ל-named imports מ-<code>lodash-es</code> או למתודות native זה רווח bundle קלאסי של 5 דקות. בודקים עם <code>npx vite-bundle-visualizer</code> או webpack-bundle-analyzer.</blockquote>`
      }
    },
    {
      h: { en: "Source maps: upload them, don't serve them", he: "Source maps: להעלות, לא להגיש" },
      body: {
        en: `<p>A minified stack trace says <code>at e.t (index-C8kq3Yp1.js:1:48213)</code>. A <strong>source map</strong> (JSON, "version 3", VLQ-encoded mappings) maps every generated line:column back to the original file, line and name — so it says <code>at calculateTotal (src/cart/price.ts:42:17)</code>.</p>
<p>The trap: maps usually contain <code>sourcesContent</code> — your <em>entire original source</em>, comments included. A public <code>.map</code> file is a free download of your frontend code (and sometimes of internal URLs, feature flags and secrets people "temporarily" hard-coded).</p>
<pre># Vite: generate maps but don't reference them from the JS
export default { build: { sourcemap: "hidden" } }      // webpack: devtool: "hidden-source-map"

# upload to error tracking in CI, then delete them from the deploy artifact
$ npx @sentry/cli sourcemaps inject ./dist
$ npx @sentry/cli sourcemaps upload --release "$GIT_SHA" ./dist
&gt; Found 6 files
&gt; Uploaded files to Sentry
$ find dist -name '*.map' -delete</pre>
<p>Error tracking (Sentry, Datadog RUM, Bugsnag, Rollbar) then symbolicates crashes server-side using the uploaded maps matched by release / debug ID. Same idea exists for native code (debug symbols, dSYM) and for Android (ProGuard/R8 mapping files).</p>
<blockquote>⚠️ Production tip: grep your CDN, not just your repo — <code>curl -sI https://app.example.com/assets/index-C8kq3Yp1.js.map</code> returning 200 means anyone can read your source. Several well-known leaks of unreleased product code started exactly like that.</blockquote>`,
        he: `<p>Stack trace אחרי minify אומר <code>at e.t (index-C8kq3Yp1.js:1:48213)</code>. ‏<strong>Source map</strong> ‏(JSON, ‏"version 3", מיפויים בקידוד VLQ) ממפה כל שורה:עמודה בקוד שנוצר בחזרה לקובץ, לשורה ולשם המקוריים — ואז כתוב <code>at calculateTotal (src/cart/price.ts:42:17)</code>.</p>
<p>המלכודת: maps בדרך כלל מכילים <code>sourcesContent</code> — <em>את כל קוד המקור שלך</em>, כולל הערות. קובץ <code>.map</code> ציבורי הוא הורדה חינמית של קוד ה-frontend שלך (ולפעמים גם של URLs פנימיים, ‏feature flags ו-secrets שמישהו הכניס "זמנית").</p>
<pre># Vite: generate maps but don't reference them from the JS
export default { build: { sourcemap: "hidden" } }      // webpack: devtool: "hidden-source-map"

# upload to error tracking in CI, then delete them from the deploy artifact
$ npx @sentry/cli sourcemaps inject ./dist
$ npx @sentry/cli sourcemaps upload --release "$GIT_SHA" ./dist
&gt; Found 6 files
&gt; Uploaded files to Sentry
$ find dist -name '*.map' -delete</pre>
<p>כלי error tracking ‏(Sentry, ‏Datadog RUM, ‏Bugsnag, ‏Rollbar) עושים אז symbolication לקריסות בצד השרת עם ה-maps שהועלו, לפי release או debug ID. אותו רעיון קיים לקוד native ‏(debug symbols, ‏dSYM) ול-Android ‏(קבצי mapping של ProGuard/R8).</p>
<blockquote>⚠️ טיפ לפרודקשן: תבדוק את ה-CDN, לא רק את ה-repo — אם <code>curl -sI https://app.example.com/assets/index-C8kq3Yp1.js.map</code> מחזיר 200, כל אחד יכול לקרוא את הקוד שלך. כמה דליפות מפורסמות של קוד מוצר שעוד לא יצא התחילו בדיוק ככה.</blockquote>`
      }
    },
    {
      h: { en: "Other transpilers, CI caching and reproducible builds", he: "Transpilers נוספים, ‏cache ב-CI ו-builds שחוזרים על עצמם" },
      body: {
        en: `<p>Transpilers are everywhere once you look:</p>
<ul><li><strong>JSX</strong> → <code>_jsx("div", {...})</code> calls (React 17+ automatic runtime) — via Babel, SWC, esbuild or tsc.</li>
<li><strong>Sass/SCSS, Less</strong> → CSS (<code>sass src/main.scss dist/main.css</code>); <strong>PostCSS</strong> + Autoprefixer adds vendor prefixes from browserslist.</li>
<li><strong>CoffeeScript</strong> (2009) → JS — mostly history now, but its arrow functions and classes inspired ES2015. Babel itself began as "6to5": ES2015 → ES5.</li>
<li><strong>Kotlin/JS, Dart, Elm, ReScript, Scala.js</strong> → JS; <strong>Emscripten</strong> and Rust → WebAssembly (that's compilation, not transpiling).</li>
<li>Infra too: CDK and Pulumi "synthesize" TypeScript/Python into CloudFormation/Terraform-like plans; Jsonnet/CUE/Helm templates generate YAML.</li></ul>
<p><strong>Build caching in CI</strong> — most frontend build time is <code>npm install</code> and re-transpiling unchanged packages:</p>
<pre># GitHub Actions
- uses: actions/setup-node@v4
  with: { node-version-file: .nvmrc, cache: npm }   # caches ~/.npm keyed on package-lock.json
- run: npm ci                                        # exact lockfile, fails if it drifts
- run: npx tsc --noEmit                              # type-check job
- run: npx turbo run build --cache-dir=.turbo        # task cache; remote cache shares hits across runners</pre>
<p><strong>Reproducible builds</strong> — same commit ⇒ byte-identical output — make caching safe and supply-chain verification possible:</p>
<ul><li>Lockfile committed; <code>npm ci</code> / <code>pnpm install --frozen-lockfile</code>, never <code>npm install</code> in CI.</li>
<li>Pin the toolchain: Node version (<code>.nvmrc</code>, <code>packageManager</code> field + Corepack), bundler version.</li>
<li>No timestamps, absolute paths or random IDs in output; tools honor <code>SOURCE_DATE_EPOCH</code>. Content hashes in file names should change only when content changes.</li></ul>
<blockquote>💡 Real world: if two CI runs of the same commit produce different chunk hashes, every deploy invalidates every user's cache. Diffing the two <code>dist/</code> folders usually finds an embedded build timestamp or a non-deterministic plugin.</blockquote>`,
        he: `<p>ברגע שאתה מחפש, transpilers נמצאים בכל מקום:</p>
<ul><li><strong>JSX</strong> ← קריאות <code>_jsx("div", {...})</code> ‏(ה-automatic runtime של React 17 ומעלה) — דרך Babel, ‏SWC, ‏esbuild או tsc.</li>
<li><strong>Sass/SCSS, ‏Less</strong> ← CSS ‏(<code>sass src/main.scss dist/main.css</code>); ‏<strong>PostCSS</strong> עם Autoprefixer מוסיף vendor prefixes לפי browserslist.</li>
<li><strong>CoffeeScript</strong> ‏(2009) ← JS — היום בעיקר היסטוריה, אבל ה-arrow functions וה-classes שלו השפיעו על ES2015. ‏Babel עצמו התחיל בתור "6to5": ‏ES2015 ← ES5.</li>
<li><strong>Kotlin/JS, ‏Dart, ‏Elm, ‏ReScript, ‏Scala.js</strong> ← JS; ‏<strong>Emscripten</strong> ו-Rust ← WebAssembly (זה קומפילציה, לא transpiling).</li>
<li>גם בתשתיות: CDK ו-Pulumi עושים "synthesize" מ-TypeScript או Python לתוכניות בסגנון CloudFormation או Terraform; ‏templates של Jsonnet, ‏CUE ו-Helm מייצרים YAML.</li></ul>
<p><strong>Cache של build ב-CI</strong> — רוב זמן ה-build ב-frontend הולך על <code>npm install</code> ועל transpile מחדש של חבילות שלא השתנו:</p>
<pre># GitHub Actions
- uses: actions/setup-node@v4
  with: { node-version-file: .nvmrc, cache: npm }   # caches ~/.npm keyed on package-lock.json
- run: npm ci                                        # exact lockfile, fails if it drifts
- run: npx tsc --noEmit                              # type-check job
- run: npx turbo run build --cache-dir=.turbo        # task cache; remote cache shares hits across runners</pre>
<p><strong>Builds שחוזרים על עצמם (reproducible)</strong> — אותו commit ⇐ פלט זהה עד הבייט — הופכים cache לבטוח ומאפשרים אימות של שרשרת האספקה:</p>
<ul><li>Lockfile ב-repo; ‏<code>npm ci</code> או <code>pnpm install --frozen-lockfile</code>, אף פעם לא <code>npm install</code> ב-CI.</li>
<li>לנעול את ה-toolchain: גרסת Node ‏(<code>.nvmrc</code>, השדה <code>packageManager</code> עם Corepack), גרסת ה-bundler.</li>
<li>בלי timestamps, נתיבים מוחלטים או IDs אקראיים בפלט; כלים מכבדים את <code>SOURCE_DATE_EPOCH</code>. ה-content hash בשמות קבצים צריך להשתנות רק כשהתוכן משתנה.</li></ul>
<blockquote>💡 מהשטח: אם שתי ריצות CI של אותו commit מייצרות hashes שונים ל-chunks, כל deploy מבטל את ה-cache של כל המשתמשים. ‏diff בין שתי תיקיות <code>dist/</code> בדרך כלל מוצא timestamp של build שהוטמע או plugin לא דטרמיניסטי.</blockquote>`
      }
    }
  ],
  diagram: `src/*.ts, *.tsx, *.scss
   │
   ├─► tsc --noEmit ............ type errors? fail CI   (no output)
   │
   └─► transpile (esbuild / SWC / Babel)  strip types, JSX -> calls, lower syntax to targets (browserslist)
          │
          ▼
       bundler (Vite/Rollup, webpack, Rspack, Turbopack)
          module graph ─► tree shaking ─► code splitting ─► minify ─► content-hashed files
          │
          ├─► dist/index.html            (short cache)
          ├─► dist/assets/*.[hash].js    (immutable, 1 year)
          └─► *.map ─► upload to Sentry ─► delete before deploy`,
  handsOn: [
    { cmd: "echo 'export const v = a?.b ?? 0' | npx esbuild --target=es2019", what: { en: "Watch syntax lowering: modern operators rewritten into older JavaScript.", he: "צופה ב-syntax lowering: אופרטורים מודרניים משוכתבים ל-JavaScript ישן יותר." } },
    { cmd: "npx tsc --noEmit --pretty", what: { en: "Type-check the whole project without emitting files — the CI gate fast transpilers skip.", he: "בודק טיפוסים בכל הפרויקט בלי לפלוט קבצים — השער ב-CI ש-transpilers מהירים מדלגים עליו." } },
    { cmd: "npx browserslist", what: { en: "List the exact browsers your current config targets.", he: "מציג את הדפדפנים המדויקים שהקונפיג הנוכחי שלך מכוון אליהם." } },
    { cmd: "npx esbuild src/index.ts --bundle --minify --metafile=meta.json --outfile=dist/app.js && npx esbuild-visualizer --metadata meta.json", what: { en: "Bundle, then see which modules eat your bundle size.", he: "עושה bundle, ואז רואה אילו מודולים אוכלים את גודל ה-bundle." } },
    { cmd: "curl -s -o /dev/null -w '%{http_code}\\n' https://your-app.example.com/assets/index.js.map", what: { en: "Check whether production publicly serves source maps (should be 403/404).", he: "בודק אם הפרודקשן מגיש source maps לכולם (צריך להיות 403 או 404)." } }
  ],
  mnemonic: {
    en: "\"Check, Strip, Lower, Fill, Shake, Split, Squeeze — and keep the Map in the office.\" (tsc, transpile, target, polyfill, tree shake, code split, minify, private source maps)",
    he: "\"בודקים, מורידים, מנמיכים, ממלאים, מנערים, מפצלים, דוחסים — ואת המפה משאירים במשרד.\" (tsc, ‏transpile, ‏target, ‏polyfill, ‏tree shaking, ‏code splitting, ‏minify, ‏source maps פרטיים)"
  },
  pitfalls: [
    { en: "Relying on esbuild/SWC/Vite for type safety. They strip types without checking them; without tsc --noEmit in CI, type errors reach production.", he: "לסמוך על esbuild, ‏SWC או Vite לבטיחות טיפוסים. הם מורידים טיפוסים בלי לבדוק אותם; בלי tsc --noEmit ב-CI, שגיאות טיפוסים מגיעות לפרודקשן." },
    { en: "Assuming a lower target fixes missing APIs. Transpilers lower syntax only; Array.prototype.at or structuredClone still need a polyfill or a higher minimum browser.", he: "להניח ש-target נמוך מתקן APIs חסרים. ‏Transpilers מורידים רק syntax; ‏Array.prototype.at או structuredClone עדיין צריכים polyfill או דפדפן מינימלי גבוה יותר." },
    { en: "Serving .map files publicly with sourcesContent — you just published your source code. Use hidden source maps, upload to error tracking, delete before deploy.", he: "להגיש קבצי ‎.map לכולם עם sourcesContent — בדיוק פרסמת את קוד המקור שלך. תשתמש ב-hidden source maps, תעלה ל-error tracking ותמחק לפני deploy." },
    { en: "Caching index.html for a year. Hashed assets can be immutable; the HTML that points to them must be revalidated or users stay on the old release.", he: "לשמור את index.html ב-cache לשנה. ‏Assets עם hash יכולים להיות immutable; ה-HTML שמפנה אליהם חייב revalidation, אחרת המשתמשים נשארים על ה-release הישן." }
  ],
  interview: [
    { q: { en: "What's the difference between syntax lowering and polyfilling?", he: "מה ההבדל בין syntax lowering ל-polyfill?" },
      a: { en: "Lowering rewrites new syntax (optional chaining, async/await, classes) into equivalent older syntax at build time — old engines can't even parse the new syntax, so it can't be fixed at run time. Polyfills add missing runtime APIs (functions/objects) by shipping JS that defines them if absent. Transpilers do the first; core-js and friends do the second.", he: "Lowering משכתב syntax חדש (optional chaining, ‏async/await, ‏classes) ל-syntax ישן שקול בזמן build — מנועים ישנים בכלל לא מצליחים לפרסר את ה-syntax החדש, אז אי אפשר לתקן את זה בזמן ריצה. ‏Polyfills מוסיפים APIs חסרים בזמן ריצה (פונקציות או אובייקטים) על ידי שליחת JS שמגדיר אותם אם הם לא קיימים. ‏Transpilers עושים את הראשון; ‏core-js וחברים עושים את השני." } },
    { q: { en: "Why doesn't tree shaking remove an unused function from my bundle?", he: "למה tree shaking לא מוריד פונקציה שלא בשימוש מה-bundle שלי?" },
      a: { en: "Common causes: the package is CommonJS (dynamic require/exports can't be statically analyzed), the module has top-level side effects and isn't marked sideEffects:false, you import a namespace/default object and access properties dynamically, or the code is in a barrel file that re-exports something with side effects. Check the bundle analyzer and the package's module/exports fields.", he: "סיבות נפוצות: החבילה היא CommonJS ‏(require ו-exports דינמיים אי אפשר לנתח סטטית), למודול יש side effects ב-top-level והוא לא מסומן sideEffects:false, אתה מייבא אובייקט namespace או default וניגש לשדות דינמית, או שהקוד נמצא ב-barrel file שעושה re-export למשהו עם side effects. תבדוק ב-bundle analyzer ובשדות module/exports של החבילה." } },
    { q: { en: "How do you get readable production stack traces without exposing your source?", he: "איך מקבלים stack traces קריאים בפרודקשן בלי לחשוף את הקוד?" },
      a: { en: "Generate hidden source maps (no sourceMappingURL comment), upload them in CI to the error tracker tagged with the release or debug ID, then delete the .map files from the deploy artifact. The tracker symbolicates server-side; browsers never get the maps.", he: "מייצרים hidden source maps (בלי הערת sourceMappingURL), מעלים אותם ב-CI ל-error tracker עם תגית של release או debug ID, ואז מוחקים את קבצי ה-‎.map מה-artifact של ה-deploy. ה-tracker עושה symbolication בצד השרת; הדפדפנים אף פעם לא מקבלים את ה-maps." } }
  ],
  quiz: [
    { q: { en: "Your Vite build passes, but production shows a bug a type check would have caught. Why?", he: "ה-build של Vite עובר, אבל בפרודקשן יש באג שבדיקת טיפוסים הייתה תופסת. למה?" },
      options: [ { en: "Vite type-checks only in dev mode", he: "Vite בודק טיפוסים רק במצב dev" }, { en: "Vite/esbuild strip types without checking; tsc --noEmit must run separately", he: "Vite ו-esbuild מורידים טיפוסים בלי לבדוק; צריך להריץ tsc --noEmit בנפרד" }, { en: "Minification removed the types", he: "ה-minification הוריד את הטיפוסים" }, { en: "Source maps were disabled", he: "ה-source maps היו כבויים" } ],
      answer: 1, explain: { en: "Fast transpilers work file by file with no type information. Type-checking is tsc's job — make it a CI step.", he: "Transpilers מהירים עובדים קובץ אחרי קובץ בלי מידע על טיפוסים. בדיקת טיפוסים היא העבודה של tsc — תעשה ממנה שלב ב-CI." } },
    { q: { en: "An old browser throws 'arr.at is not a function' even though you set an old esbuild target. What's missing?", he: "דפדפן ישן זורק 'arr.at is not a function' למרות שהגדרת target ישן ב-esbuild. מה חסר?" },
      options: [ { en: "A source map", he: "Source map" }, { en: "A polyfill — targets only lower syntax, not runtime APIs", he: "Polyfill — ‏targets מורידים רק syntax, לא APIs של זמן ריצה" }, { en: "Code splitting", he: "Code splitting" }, { en: "Tree shaking", he: "Tree shaking" } ],
      answer: 1, explain: { en: "Array.prototype.at is a runtime method, not syntax. You need core-js (or similar) or a higher minimum browser.", he: "Array.prototype.at היא מתודה של זמן ריצה, לא syntax. צריך core-js (או דומה) או דפדפן מינימלי גבוה יותר." } },
    { q: { en: "Which import style lets the bundler tree-shake best?", he: "איזה סגנון import מאפשר ל-bundler לעשות tree shaking הכי טוב?" },
      options: [ { en: "const _ = require('lodash')", he: "const _ = require('lodash')" }, { en: "import _ from 'lodash'", he: "import _ from 'lodash'" }, { en: "import { debounce } from 'lodash-es'", he: "import { debounce } from 'lodash-es'" }, { en: "Loading lodash from a script tag", he: "לטעון את lodash מתגית script" } ],
      answer: 2, explain: { en: "Named imports from an ES-module package are statically analyzable, so unused exports can be dropped. CommonJS and whole-object imports defeat it.", he: "Named imports מחבילת ES modules ניתנים לניתוח סטטי, אז אפשר להוריד exports שלא בשימוש. ‏CommonJS וייבוא של כל האובייקט מבטלים את זה." } },
    { q: { en: "What's the right way to handle production source maps?", he: "מה הדרך הנכונה לטפל ב-source maps בפרודקשן?" },
      options: [ { en: "Serve them next to the JS so DevTools works for everyone", he: "להגיש אותם ליד ה-JS כדי ש-DevTools יעבוד לכולם" }, { en: "Never generate them", he: "אף פעם לא לייצר אותם" }, { en: "Generate hidden maps, upload to the error tracker per release, delete from the deploy", he: "לייצר hidden maps, להעלות ל-error tracker לכל release, ולמחוק מה-deploy" }, { en: "Commit them to the repo", he: "לעשות להם commit ל-repo" } ],
      answer: 2, explain: { en: "You keep readable stack traces in Sentry/Datadog while the public never downloads your original source (sourcesContent).", he: "שומרים stack traces קריאים ב-Sentry או Datadog, והציבור אף פעם לא מוריד את קוד המקור המקורי שלך (sourcesContent)." } }
  ],
  related: ["pr-frontend-frameworks", "compilers-how-code-runs", "cicd-github-actions", "cloud-cicd", "staff-supply-chain", "pr-third-party-deps", "linking-binaries"]
});

INFRA.lessons.push({
  id: "linking-binaries",
  track: "foundations",
  order: 42,
  icon: "🔗",
  level: 3,
  minutes: 17,
  title: { en: "Linking, Libraries & Binaries: Why 'not found' Means Missing Loader", he: "Linking, ספריות ובינאריים: למה 'not found' אומר שחסר loader" },
  tldr: {
    en: "The compiler makes object files; the linker glues them with libraries — either copying the code in (static) or leaving a note for the runtime loader to find .so files at start (dynamic). A dynamically linked binary depends on the exact libc and loader of the machine it runs on, which is why an Ubuntu-built binary dies on Alpine with 'not found' and an old distro says 'GLIBC_2.34 not found'.",
    he: "ה-compiler מייצר object files; ה-linker מדביק אותם עם ספריות — או מעתיק את הקוד פנימה (static) או משאיר פתק ל-loader בזמן ריצה שימצא קבצי so בעלייה (dynamic). בינארי עם linking דינמי תלוי ב-libc וב-loader המדויקים של המכונה שהוא רץ עליה, ולכן בינארי שנבנה על Ubuntu מת על Alpine עם 'not found' ו-distro ישן אומר 'GLIBC_2.34 not found'."
  },
  analogy: {
    en: "Static linking is a self-contained camping kit: tent, stove, food all packed in your backpack — heavy, but works anywhere. Dynamic linking is a hotel reservation: you travel light and expect the hotel (the OS) to provide the bed and towels (shared libraries). Arrive at a hotel chain that uses different towel sizes (musl instead of glibc) or an older hotel missing the new wing (older glibc), and your reservation is worthless — even though you, the traveler, are perfectly fine.",
    he: "Static linking זה ערכת קמפינג עצמאית: אוהל, גזייה ואוכל, הכל בתיק — כבד, אבל עובד בכל מקום. ‏Dynamic linking זה הזמנה במלון: נוסעים קל ומצפים שהמלון (מערכת ההפעלה) יספק מיטה ומגבות (shared libraries). תגיע לרשת מלונות עם מגבות בגודל אחר (musl במקום glibc) או למלון ישן שאין בו את האגף החדש (glibc ישן), וההזמנה שלך שווה אפס — למרות שאתה, הנוסע, בסדר גמור."
  },
  sections: [
    {
      h: { en: "From object files to an executable: what the linker does", he: "מ-object files לקובץ הרצה: מה ה-linker עושה" },
      body: {
        en: `<p>Compiling <code>main.c</code> and <code>util.c</code> gives two <strong>object files</strong> (<code>.o</code>): machine code with holes. <code>main.o</code> calls <code>add</code> and <code>printf</code> but doesn't know where they live — those are <strong>undefined symbols</strong>. The <strong>linker</strong> (<code>ld</code>, <code>lld</code>, <code>gold</code>, <code>mold</code>) resolves every undefined symbol against other objects and libraries, then lays out the final file.</p>
<pre>$ gcc -c main.c util.c          # compile only -&gt; main.o util.o
$ nm main.o
                 U add          # U = undefined: needed, not here
0000000000000000 T main         # T = defined in .text (code)
                 U printf
$ nm util.o
0000000000000000 T add
$ gcc main.o util.o -o app      # link
$ ./app
5</pre>
<p>Two ways to satisfy <code>printf</code>:</p>
<table><tr><th></th><th>Static linking</th><th>Dynamic linking</th></tr>
<tr><td>What happens</td><td>Library code is <strong>copied</strong> into the binary from <code>.a</code> archives</td><td>Binary records "I need <code>libc.so.6</code>"; the loader maps the <code>.so</code> at start</td></tr>
<tr><td>Size</td><td>Bigger</td><td>Smaller; one copy in RAM shared by all processes</td></tr>
<tr><td>Portability</td><td>Runs on any Linux kernel of that arch</td><td>Needs compatible libs + loader on the target</td></tr>
<tr><td>Security patches</td><td>Must <strong>rebuild</strong> to pick up a fixed lib</td><td>Update the OS package, restart</td></tr>
<tr><td>Typical</td><td>Go (pure), Rust + musl, BusyBox</td><td>Almost every distro package, Python/Node/JVM runtimes</td></tr></table>
<p>The same idea on Windows: executables and libraries are <strong>PE</strong> files, shared libraries are <strong>DLLs</strong>, <code>dumpbin /dependents app.exe</code> plays the role of <code>ldd</code>, and the classic failure is "The code execution cannot proceed because VCRUNTIME140.dll was not found" — a missing Visual C++ runtime. macOS uses <strong>Mach-O</strong> and <code>.dylib</code> (<code>otool -L</code>).</p>`,
        he: `<p>קומפילציה של <code>main.c</code> ו-<code>util.c</code> נותנת שני <strong>object files</strong> ‏(<code>.o</code>): קוד מכונה עם חורים. ‏<code>main.o</code> קורא ל-<code>add</code> ול-<code>printf</code> אבל לא יודע איפה הם יושבים — אלה <strong>undefined symbols</strong>. ה-<strong>linker</strong> ‏(<code>ld</code>, ‏<code>lld</code>, ‏<code>gold</code>, ‏<code>mold</code>) פותר כל symbol לא מוגדר מול objects וספריות אחרים, ואז פורס את הקובץ הסופי.</p>
<pre>$ gcc -c main.c util.c          # compile only -&gt; main.o util.o
$ nm main.o
                 U add          # U = undefined: needed, not here
0000000000000000 T main         # T = defined in .text (code)
                 U printf
$ nm util.o
0000000000000000 T add
$ gcc main.o util.o -o app      # link
$ ./app
5</pre>
<p>שתי דרכים לספק את <code>printf</code>:</p>
<table><tr><th></th><th>Static linking</th><th>Dynamic linking</th></tr>
<tr><td>מה קורה</td><td>קוד הספרייה <strong>מועתק</strong> לתוך הבינארי מארכיוני <code>.a</code></td><td>הבינארי רושם "אני צריך <code>libc.so.6</code>"; ה-loader ממפה את ה-<code>.so</code> בעלייה</td></tr>
<tr><td>גודל</td><td>גדול יותר</td><td>קטן יותר; עותק אחד ב-RAM שמשותף לכל התהליכים</td></tr>
<tr><td>ניידות</td><td>רץ על כל kernel של Linux באותה ארכיטקטורה</td><td>צריך ספריות ו-loader תואמים ביעד</td></tr>
<tr><td>תיקוני אבטחה</td><td>חייבים <strong>לבנות מחדש</strong> כדי לקבל ספרייה מתוקנת</td><td>מעדכנים את חבילת ה-OS ועושים restart</td></tr>
<tr><td>טיפוסי</td><td>Go ‏(טהור), ‏Rust עם musl, ‏BusyBox</td><td>כמעט כל חבילת distro, ה-runtimes של Python, ‏Node ו-JVM</td></tr></table>
<p>אותו רעיון ב-Windows: קבצי הרצה וספריות הם קבצי <strong>PE</strong>, ספריות משותפות הן <strong>DLLs</strong>, ‏<code>dumpbin /dependents app.exe</code> ממלא את התפקיד של <code>ldd</code>, והכישלון הקלאסי הוא "The code execution cannot proceed because VCRUNTIME140.dll was not found" — חסר Visual C++ runtime. ‏macOS משתמש ב-<strong>Mach-O</strong> וב-<code>.dylib</code> ‏(<code>otool -L</code>).</p>`
      }
    },
    {
      h: { en: "ELF anatomy and the dynamic loader", he: "האנטומיה של ELF וה-loader הדינמי" },
      body: {
        en: `<p>Linux binaries are <strong>ELF</strong> files: a header (magic <code>7f 45 4c 46</code> = "\\x7fELF", class, arch), <strong>program headers</strong> (segments the kernel maps: code, data, and <code>PT_INTERP</code> — the path of the loader), and <strong>sections</strong> (<code>.text</code>, <code>.data</code>, <code>.dynsym</code>, <code>.dynamic</code>...). <code>file</code>, <code>readelf</code> and <code>objdump</code> read them:</p>
<pre>$ file ./api
./api: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked,
interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=9c1e..., for GNU/Linux 3.2.0, not stripped

$ readelf -l ./api | grep interpreter
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]

$ readelf -d ./api | grep -E 'NEEDED|RUNPATH'
 0x0000000000000001 (NEEDED)             Shared library: [libssl.so.3]
 0x0000000000000001 (NEEDED)             Shared library: [libcrypto.so.3]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 0x000000000000001d (RUNPATH)            Library runpath: [$ORIGIN/../lib]

$ ldd ./api
        linux-vdso.so.1 (0x00007ffd5a9f2000)
        libssl.so.3 =&gt; /lib/x86_64-linux-gnu/libssl.so.3 (0x00007f3c2a600000)
        libcrypto.so.3 =&gt; /lib/x86_64-linux-gnu/libcrypto.so.3 (0x00007f3c2a000000)
        libc.so.6 =&gt; /lib/x86_64-linux-gnu/libc.so.6 (0x00007f3c29c00000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f3c2a8a0000)</pre>
<p>When you <code>exec</code> a dynamic binary, the kernel actually starts the <strong>interpreter</strong> (<code>ld-linux-x86-64.so.2</code> on glibc, <code>ld-musl-x86_64.so.1</code> on musl). The loader finds each NEEDED library in this order: <code>DT_RPATH</code> (legacy) → <code>LD_LIBRARY_PATH</code> → <code>DT_RUNPATH</code> → <code>/etc/ld.so.cache</code> (built by <code>ldconfig</code>) → <code>/lib</code>, <code>/usr/lib</code>. Then it resolves symbols and jumps to <code>main</code>.</p>
<blockquote>⚠️ Production tip: the cryptic <code>exec /app/api: no such file or directory</code> (or <code>sh: ./api: not found</code>) when the file clearly exists means the <em>interpreter</em> path from <code>PT_INTERP</code> is missing — not your binary. And <code>ldd</code> may execute code from the binary: never run it on untrusted files; use <code>readelf -d</code> / <code>objdump -p</code> instead.</blockquote>
<p><code>LD_LIBRARY_PATH</code> is a debugging tool, not a deployment strategy — it leaks into every child process and can load the wrong version of a library for unrelated programs. Prefer <code>rpath</code>/<code>$ORIGIN</code> for app-bundled libs, or a proper package.</p>`,
        he: `<p>בינאריים ב-Linux הם קבצי <strong>ELF</strong>: ‏header ‏(magic ‏<code>7f 45 4c 46</code> = ‏"\\x7fELF", ‏class, ארכיטקטורה), ‏<strong>program headers</strong> (segments שה-kernel ממפה: קוד, data, ו-<code>PT_INTERP</code> — הנתיב של ה-loader), ו-<strong>sections</strong> ‏(<code>.text</code>, ‏<code>.data</code>, ‏<code>.dynsym</code>, ‏<code>.dynamic</code>...). ‏<code>file</code>, ‏<code>readelf</code> ו-<code>objdump</code> קוראים אותם:</p>
<pre>$ file ./api
./api: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked,
interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=9c1e..., for GNU/Linux 3.2.0, not stripped

$ readelf -l ./api | grep interpreter
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]

$ readelf -d ./api | grep -E 'NEEDED|RUNPATH'
 0x0000000000000001 (NEEDED)             Shared library: [libssl.so.3]
 0x0000000000000001 (NEEDED)             Shared library: [libcrypto.so.3]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 0x000000000000001d (RUNPATH)            Library runpath: [$ORIGIN/../lib]

$ ldd ./api
        linux-vdso.so.1 (0x00007ffd5a9f2000)
        libssl.so.3 =&gt; /lib/x86_64-linux-gnu/libssl.so.3 (0x00007f3c2a600000)
        libcrypto.so.3 =&gt; /lib/x86_64-linux-gnu/libcrypto.so.3 (0x00007f3c2a000000)
        libc.so.6 =&gt; /lib/x86_64-linux-gnu/libc.so.6 (0x00007f3c29c00000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f3c2a8a0000)</pre>
<p>כשאתה עושה <code>exec</code> לבינארי דינמי, ה-kernel בעצם מפעיל את ה-<strong>interpreter</strong> ‏(<code>ld-linux-x86-64.so.2</code> ב-glibc, ‏<code>ld-musl-x86_64.so.1</code> ב-musl). ה-loader מוצא כל ספריית NEEDED בסדר הזה: ‏<code>DT_RPATH</code> ‏(legacy) ← <code>LD_LIBRARY_PATH</code> ← <code>DT_RUNPATH</code> ← <code>/etc/ld.so.cache</code> ‏(נבנה על ידי <code>ldconfig</code>) ← <code>/lib</code>, ‏<code>/usr/lib</code>. אחר כך הוא פותר symbols וקופץ ל-<code>main</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: ההודעה המבלבלת <code>exec /app/api: no such file or directory</code> (או <code>sh: ./api: not found</code>) כשהקובץ בבירור קיים אומרת שנתיב ה-<em>interpreter</em> מ-<code>PT_INTERP</code> חסר — לא הבינארי שלך. ו-<code>ldd</code> עלול להריץ קוד מהבינארי: אף פעם אל תריץ אותו על קבצים לא מהימנים; תשתמש ב-<code>readelf -d</code> או <code>objdump -p</code> במקום.</blockquote>
<p><code>LD_LIBRARY_PATH</code> הוא כלי debugging, לא אסטרטגיית deploy — הוא דולף לכל תהליך בן ויכול לטעון גרסה שגויה של ספרייה לתוכניות שלא קשורות. עדיף <code>rpath</code> או <code>$ORIGIN</code> לספריות שמגיעות עם האפליקציה, או חבילה מסודרת.</p>`
      }
    },
    {
      h: { en: "glibc vs musl, symbol versions and ABI compatibility", he: "glibc מול musl, גרסאות symbols ותאימות ABI" },
      body: {
        en: `<p>Almost every binary links against a C library. Two dominate Linux:</p>
<table><tr><th></th><th>glibc</th><th>musl</th></tr>
<tr><td>Used by</td><td>Debian, Ubuntu, RHEL, Amazon Linux, distroless, Wolfi</td><td>Alpine</td></tr>
<tr><td>Loader</td><td><code>/lib64/ld-linux-x86-64.so.2</code></td><td><code>/lib/ld-musl-x86_64.so.1</code></td></tr>
<tr><td>Symbol versioning</td><td>Yes (<code>memcpy@GLIBC_2.14</code>)</td><td>No</td></tr>
<tr><td>Static linking</td><td>Discouraged (NSS/DNS, <code>dlopen</code> issues)</td><td>Designed for it</td></tr></table>
<p><strong>Failure 1 — glibc binary on Alpine.</strong> The loader path doesn't exist, so the kernel can't even start it:</p>
<pre>/app # ./api
sh: ./api: not found
/app # ls -l /lib64/ld-linux-x86-64.so.2
ls: /lib64/ld-linux-x86-64.so.2: No such file or directory
/app # ldd ./api                 # Alpine's ldd is musl's loader
        /lib64/ld-linux-x86-64.so.2 (0x7f1e4c0b4000)
Error loading shared library libc.so.6: No such file or directory (needed by ./api)</pre>
<p><code>apk add gcompat</code> provides a shim loader and gets <em>some</em> simple binaries running — anything using glibc-only internals then fails with <code>Error relocating ./api: __res_init: symbol not found</code>-style errors. It's a crutch, not a fix.</p>
<p><strong>Failure 2 — new glibc binary on an older distro.</strong> glibc is backward compatible (old binaries run on new glibc) but not forward: a binary linked on Ubuntu 24.04 (glibc 2.39) references symbols versioned for that glibc.</p>
<pre>$ ./api                                    # on Debian 11 (glibc 2.31) or Amazon Linux 2 (2.26)
./api: /lib/x86_64-linux-gnu/libc.so.6: version \`GLIBC_2.34' not found (required by ./api)
$ objdump -T ./api | grep -o 'GLIBC_[0-9.]*' | sort -Vu | tail -3
GLIBC_2.32
GLIBC_2.33
GLIBC_2.34
$ ldd --version | head -1
ldd (Debian GLIBC 2.31-13+deb11u11) 2.31</pre>
<p>Rule: <strong>build on the oldest glibc you must support</strong> (that's what Python <code>manylinux2014</code> = glibc 2.17 and <code>manylinux_2_28</code> wheels encode), or make the build and runtime base images the same distro release. The <strong>ABI</strong> — calling convention, struct layouts, symbol names/versions — is the contract that must match; source compatibility is not enough. C++ adds its own ABI layer (libstdc++ versions, <code>GLIBCXX_3.4.30 not found</code>).</p>
<blockquote>💡 Real world: the Linux <em>kernel</em> syscall ABI is famously stable ("we don't break userspace"), which is exactly why a fully static binary runs on any distro — and why containers work at all: the image brings its own userspace (libc, loader) and only shares the kernel.</blockquote>`,
        he: `<p>כמעט כל בינארי מקושר מול ספריית C. שתיים שולטות ב-Linux:</p>
<table><tr><th></th><th>glibc</th><th>musl</th></tr>
<tr><td>בשימוש ב-</td><td>Debian, ‏Ubuntu, ‏RHEL, ‏Amazon Linux, ‏distroless, ‏Wolfi</td><td>Alpine</td></tr>
<tr><td>Loader</td><td><code>/lib64/ld-linux-x86-64.so.2</code></td><td><code>/lib/ld-musl-x86_64.so.1</code></td></tr>
<tr><td>Symbol versioning</td><td>כן (<code>memcpy@GLIBC_2.14</code>)</td><td>לא</td></tr>
<tr><td>Static linking</td><td>לא מומלץ (בעיות NSS/DNS ו-<code>dlopen</code>)</td><td>מתוכנן בשביל זה</td></tr></table>
<p><strong>כישלון 1 — בינארי glibc על Alpine.</strong> נתיב ה-loader לא קיים, אז ה-kernel בכלל לא מצליח להפעיל אותו:</p>
<pre>/app # ./api
sh: ./api: not found
/app # ls -l /lib64/ld-linux-x86-64.so.2
ls: /lib64/ld-linux-x86-64.so.2: No such file or directory
/app # ldd ./api                 # Alpine's ldd is musl's loader
        /lib64/ld-linux-x86-64.so.2 (0x7f1e4c0b4000)
Error loading shared library libc.so.6: No such file or directory (needed by ./api)</pre>
<p><code>apk add gcompat</code> מספק loader מתווך ומריץ <em>חלק</em> מהבינאריים הפשוטים — כל דבר שמשתמש בפנימיות שקיימות רק ב-glibc נכשל אחר כך עם שגיאות בסגנון <code>Error relocating ./api: __res_init: symbol not found</code>. זה קב, לא תיקון.</p>
<p><strong>כישלון 2 — בינארי עם glibc חדש על distro ישן.</strong> ‏glibc תואם לאחור (בינאריים ישנים רצים על glibc חדש) אבל לא קדימה: בינארי שקושר על Ubuntu 24.04 ‏(glibc 2.39) מפנה ל-symbols עם גרסאות של ה-glibc הזה.</p>
<pre>$ ./api                                    # on Debian 11 (glibc 2.31) or Amazon Linux 2 (2.26)
./api: /lib/x86_64-linux-gnu/libc.so.6: version \`GLIBC_2.34' not found (required by ./api)
$ objdump -T ./api | grep -o 'GLIBC_[0-9.]*' | sort -Vu | tail -3
GLIBC_2.32
GLIBC_2.33
GLIBC_2.34
$ ldd --version | head -1
ldd (Debian GLIBC 2.31-13+deb11u11) 2.31</pre>
<p>הכלל: <strong>בונים על ה-glibc הכי ישן שאתה חייב לתמוך בו</strong> (זה מה ש-wheels של Python מסוג <code>manylinux2014</code> = ‏glibc 2.17 ו-<code>manylinux_2_28</code> מקודדים), או שה-base images של ה-build ושל זמן הריצה הם אותה גרסת distro. ה-<strong>ABI</strong> — מוסכמת קריאה, פריסת structs, שמות וגרסאות של symbols — הוא החוזה שחייב להתאים; תאימות ברמת קוד המקור לא מספיקה. ‏C++ מוסיף שכבת ABI משלו (גרסאות libstdc++, ‏<code>GLIBCXX_3.4.30 not found</code>).</p>
<blockquote>💡 מהשטח: ה-ABI של ה-syscalls ב-<em>kernel</em> של Linux יציב באופן מפורסם ("we don't break userspace"), ובדיוק בגלל זה בינארי סטטי לגמרי רץ על כל distro — ובגלל זה קונטיינרים עובדים בכלל: ה-image מביא userspace משלו (libc, ‏loader) ומשתף רק את ה-kernel.</blockquote>`
      }
    },
    {
      h: { en: "Static Go & Rust binaries, scratch images and multi-arch", he: "בינאריים סטטיים של Go ו-Rust, ‏images של scratch ו-multi-arch" },
      body: {
        en: `<p><strong>Go</strong> links its own runtime statically. It only goes dynamic when cgo is involved (the <code>net</code>/<code>os/user</code> packages may use libc's resolver, or you import a C library like librdkafka/sqlite). <code>CGO_ENABLED=0</code> forces pure-Go and a fully static binary:</p>
<pre>$ CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o api ./cmd/api
$ file api
api: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=Xk3..., stripped
$ ldd api
        not a dynamic executable

# cross-compile for Graviton / Apple silicon servers — no toolchain needed in pure Go
$ CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o api-arm64 ./cmd/api
$ file api-arm64
api-arm64: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, ..., stripped</pre>
<p><strong>Rust</strong> links Rust code statically but uses the system libc dynamically by default (<code>x86_64-unknown-linux-gnu</code>). For a static binary target musl:</p>
<pre>$ rustup target add x86_64-unknown-linux-musl
$ cargo build --release --target x86_64-unknown-linux-musl
$ file target/x86_64-unknown-linux-musl/release/api
... ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), static-pie linked, ...</pre>
<p>A static binary can run <code>FROM scratch</code> (empty image) or distroless/static — just remember what an empty image lacks: CA certificates (TLS fails with <code>x509: certificate signed by unknown authority</code>), <code>/etc/passwd</code> for a non-root user, timezone data.</p>
<pre># multi-arch: build natively on the build platform, cross-compile per target
FROM --platform=$BUILDPLATFORM golang:1.23 AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot     # CA certs + passwd + tzdata, no shell
COPY --from=build /out/api /api
ENTRYPOINT ["/api"]

$ docker buildx build --platform linux/amd64,linux/arm64 -t registry.example.com/api:1.4.0 --push .</pre>
<p>Run an amd64-only binary on an arm64 node and you get <code>exec /api: exec format error</code> — the multi-arch manifest exists to prevent exactly that.</p>
<blockquote>💡 Real world: <code>-ldflags="-s -w"</code> drops the symbol table and DWARF debug info — typically 25-35% smaller (e.g. 18 MB → 12 MB). <code>strip</code> does the same for C/C++/Rust binaries. Keep an unstripped copy (or upload debug symbols) if you want readable profiles and core dumps.</blockquote>`,
        he: `<p><strong>Go</strong> מקשר את ה-runtime שלו סטטית. הוא הופך לדינמי רק כשמעורב cgo (החבילות <code>net</code> ו-<code>os/user</code> עלולות להשתמש ב-resolver של libc, או שאתה מייבא ספריית C כמו librdkafka או sqlite). ‏<code>CGO_ENABLED=0</code> מכריח Go טהור ובינארי סטטי לגמרי:</p>
<pre>$ CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o api ./cmd/api
$ file api
api: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=Xk3..., stripped
$ ldd api
        not a dynamic executable

# cross-compile for Graviton / Apple silicon servers — no toolchain needed in pure Go
$ CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o api-arm64 ./cmd/api
$ file api-arm64
api-arm64: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, ..., stripped</pre>
<p><strong>Rust</strong> מקשר קוד Rust סטטית אבל משתמש ב-libc של המערכת דינמית כברירת מחדל (<code>x86_64-unknown-linux-gnu</code>). לבינארי סטטי מכוונים ל-musl:</p>
<pre>$ rustup target add x86_64-unknown-linux-musl
$ cargo build --release --target x86_64-unknown-linux-musl
$ file target/x86_64-unknown-linux-musl/release/api
... ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), static-pie linked, ...</pre>
<p>בינארי סטטי יכול לרוץ <code>FROM scratch</code> ‏(image ריק) או על distroless/static — רק תזכור מה חסר ב-image ריק: תעודות CA ‏(TLS נכשל עם <code>x509: certificate signed by unknown authority</code>), ‏<code>/etc/passwd</code> בשביל משתמש לא root, ונתוני timezone.</p>
<pre># multi-arch: build natively on the build platform, cross-compile per target
FROM --platform=$BUILDPLATFORM golang:1.23 AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot     # CA certs + passwd + tzdata, no shell
COPY --from=build /out/api /api
ENTRYPOINT ["/api"]

$ docker buildx build --platform linux/amd64,linux/arm64 -t registry.example.com/api:1.4.0 --push .</pre>
<p>תריץ בינארי של amd64 בלבד על node של arm64 ותקבל <code>exec /api: exec format error</code> — ה-manifest של multi-arch קיים בדיוק כדי למנוע את זה.</p>
<blockquote>💡 מהשטח: ‏<code>-ldflags="-s -w"</code> מוריד את טבלת ה-symbols ואת מידע ה-debug של DWARF — בדרך כלל קטן ב-25-35% (למשל 18 MB ← 12 MB). ‏<code>strip</code> עושה אותו דבר לבינאריים של C/C++/Rust. תשמור עותק לא מופשט (או תעלה debug symbols) אם אתה רוצה profiles ו-core dumps קריאים.</blockquote>`
      }
    },
    {
      h: { en: "The hidden cost of static: vendored vulnerabilities", he: "המחיר הנסתר של static: חולשות שהוטמעו בפנים" },
      body: {
        en: `<p>With dynamic linking, <code>apt upgrade openssl</code> + restart patches every program on the host. With static linking (or a library vendored into your repo), the vulnerable code is <strong>inside your binary</strong>: the OS package scanner sees nothing, and the only fix is to rebuild and redeploy every affected service.</p>
<ul><li><strong>Know what's inside</strong>: Go embeds module info — <code>go version -m ./api</code> lists every dependency and version; <code>govulncheck</code> reports only vulnerabilities in code you actually call. Rust: build with <code>cargo auditable</code> so scanners can read the dependency list from the binary; <code>cargo audit</code> in CI.</li>
<li><strong>Scan binaries, not just lockfiles</strong>: Trivy, Grype and Syft understand Go/Rust binaries and produce an SBOM per image.</li>
<li><strong>Statically linked C libs</strong> (zlib, OpenSSL, libxml2 inside a Rust/C++ binary or a Python wheel) are the blind spot — record them in the SBOM explicitly.</li>
<li><strong>Have a rebuild pipeline</strong>: when a CVE drops, you must be able to rebuild and roll out every image within hours. Base-image digests pinned + automated bump PRs (Renovate/Dependabot) make that routine.</li></ul>
<pre>$ go version -m ./api | head -6
./api: go1.23.4
        path    example.com/payments/cmd/api
        mod     example.com/payments    (devel)
        dep     github.com/jackc/pgx/v5 v5.7.1  h1:x7SYsPBYDkHDksogeSmZZ5xzThcTgRz++I5E+ePFUcs=
        dep     golang.org/x/crypto     v0.28.0 h1:GBDwsMXVQi34v5CCYUm2jkJvu4cbtru2U4TN2PSyQnw=
        build   CGO_ENABLED=0

$ trivy image --scanners vuln registry.example.com/api:1.4.0
api (gobinary)
Total: 1 (HIGH: 1)
│ golang.org/x/crypto │ CVE-2024-45337 │ HIGH │ v0.28.0 │ 0.31.0 │ ...</pre>
<blockquote>⚠️ Production tip: "distroless + static Go = zero CVEs" is only true for the <em>OS</em> layer. The Go stdlib version itself carries CVEs too (crypto/tls, net/http) — bumping the Go toolchain is a security update.</blockquote>`,
        he: `<p>עם dynamic linking, ‏<code>apt upgrade openssl</code> ועוד restart מתקנים כל תוכנית על ה-host. עם static linking (או ספרייה שהוטמעה ב-repo שלך), הקוד הפגיע נמצא <strong>בתוך הבינארי שלך</strong>: סורק החבילות של ה-OS לא רואה כלום, והתיקון היחיד הוא לבנות מחדש ולעשות deploy מחדש לכל שירות שנפגע.</p>
<ul><li><strong>לדעת מה יש בפנים</strong>: Go מטמיע מידע על מודולים — <code>go version -m ./api</code> מציג כל תלות וגרסה; ‏<code>govulncheck</code> מדווח רק על חולשות בקוד שאתה באמת קורא לו. ‏Rust: בונים עם <code>cargo auditable</code> כדי שסורקים יוכלו לקרוא את רשימת התלויות מהבינארי; ‏<code>cargo audit</code> ב-CI.</li>
<li><strong>לסרוק בינאריים, לא רק lockfiles</strong>: ‏Trivy, ‏Grype ו-Syft מבינים בינאריים של Go ו-Rust ומייצרים SBOM לכל image.</li>
<li><strong>ספריות C עם linking סטטי</strong> ‏(zlib, ‏OpenSSL, ‏libxml2 בתוך בינארי של Rust או C++ או בתוך wheel של Python) הן הנקודה העיוורת — תרשום אותן ב-SBOM במפורש.</li>
<li><strong>שיהיה pipeline לבנייה מחדש</strong>: כשיוצא CVE, אתה חייב להיות מסוגל לבנות מחדש ולפרוס כל image תוך שעות. ‏digests נעולים של base images ועוד PRs אוטומטיים לעדכון (Renovate או Dependabot) הופכים את זה לשגרה.</li></ul>
<pre>$ go version -m ./api | head -6
./api: go1.23.4
        path    example.com/payments/cmd/api
        mod     example.com/payments    (devel)
        dep     github.com/jackc/pgx/v5 v5.7.1  h1:x7SYsPBYDkHDksogeSmZZ5xzThcTgRz++I5E+ePFUcs=
        dep     golang.org/x/crypto     v0.28.0 h1:GBDwsMXVQi34v5CCYUm2jkJvu4cbtru2U4TN2PSyQnw=
        build   CGO_ENABLED=0

$ trivy image --scanners vuln registry.example.com/api:1.4.0
api (gobinary)
Total: 1 (HIGH: 1)
│ golang.org/x/crypto │ CVE-2024-45337 │ HIGH │ v0.28.0 │ 0.31.0 │ ...</pre>
<blockquote>⚠️ טיפ לפרודקשן: "distroless ועוד Go סטטי = אפס CVEs" נכון רק לשכבת ה-<em>OS</em>. גם לגרסת ה-stdlib של Go עצמה יש CVEs ‏(crypto/tls, ‏net/http) — עדכון של ה-toolchain של Go הוא עדכון אבטחה.</blockquote>`
      }
    }
  ],
  diagram: `main.c ─► compiler ─► main.o  (U printf, U add)
util.c ─► compiler ─► util.o  (T add)
                         │
                       linker
            ┌────────────┴─────────────┐
     static (.a copied in)       dynamic (NEEDED: libc.so.6, PT_INTERP: /lib64/ld-linux-x86-64.so.2)
            │                            │
      runs on any Linux          exec ─► kernel starts the loader ─► finds .so (RUNPATH, LD_LIBRARY_PATH,
      kernel of that arch                 ld.so.cache, /lib) ─► resolves symbols (GLIBC_2.34?) ─► main()
                                         │
                       Alpine: loader missing ─► "not found" / "no such file or directory"
                       old glibc:              ─► "version GLIBC_2.34 not found"`,
  handsOn: [
    { cmd: "file $(which ls) && readelf -l $(which ls) | grep interpreter", what: { en: "See that even ls is dynamically linked and which loader it requests.", he: "רואה שאפילו ls מקושר דינמית ואיזה loader הוא מבקש." } },
    { cmd: "readelf -d /usr/bin/curl | grep NEEDED", what: { en: "List the shared libraries a binary needs — safe on untrusted files, unlike ldd.", he: "מציג את הספריות המשותפות שבינארי צריך — בטוח לקבצים לא מהימנים, בניגוד ל-ldd." } },
    { cmd: "objdump -T ./api | grep -o 'GLIBC_[0-9.]*' | sort -Vu | tail -1", what: { en: "Find the newest glibc version a binary requires — compare with ldd --version on the target.", he: "מוצא את גרסת ה-glibc הכי חדשה שבינארי דורש — משווים ל-ldd --version ביעד." } },
    { cmd: "docker run --rm -v \"$PWD\":/b alpine:3.20 /b/api", what: { en: "Reproduce the classic 'not found' by running a glibc binary on Alpine.", he: "משחזר את ה-'not found' הקלאסי בהרצה של בינארי glibc על Alpine." } },
    { cmd: "CGO_ENABLED=0 go build -ldflags='-s -w' -o api . && file api && ls -lh api", what: { en: "Build a static, stripped Go binary and confirm 'statically linked'.", he: "בונה בינארי Go סטטי ומופשט ומוודא 'statically linked'." } }
  ],
  mnemonic: {
    en: "\"File, Read, Dump, Then Decide\": file says static or dynamic, readelf shows the loader and NEEDED libs, objdump shows the GLIBC versions — then build static or match the base image.",
    he: "\"file, ‏readelf, ‏objdump — ואז מחליטים\": ‏file אומר סטטי או דינמי, ‏readelf מראה את ה-loader ואת ספריות ה-NEEDED, ‏objdump מראה את גרסאות ה-GLIBC — ואז בונים סטטי או מתאימים את ה-base image."
  },
  pitfalls: [
    { en: "Building in golang:1.23 (Debian, glibc) and copying the binary into alpine with cgo still enabled — it links against glibc and dies with 'not found'. Use CGO_ENABLED=0 or a glibc runtime base.", he: "לבנות ב-golang:1.23 ‏(Debian, ‏glibc) ולהעתיק את הבינארי ל-alpine כש-cgo עדיין דלוק — הוא מקושר מול glibc ומת עם 'not found'. תשתמש ב-CGO_ENABLED=0 או ב-base של זמן ריצה עם glibc." },
    { en: "Building on a newer distro than you run on. glibc is backward- not forward-compatible; build on the oldest supported glibc or use the same distro release for build and runtime.", he: "לבנות על distro חדש יותר מזה שאתה רץ עליו. ‏glibc תואם לאחור ולא קדימה; תבנה על ה-glibc הכי ישן שנתמך או תשתמש באותה גרסת distro ל-build ולזמן ריצה." },
    { en: "Fixing library errors with a global LD_LIBRARY_PATH in production. It leaks into every child process and can load mismatched libraries elsewhere; use rpath/$ORIGIN or proper packaging.", he: "לתקן שגיאות ספריות עם LD_LIBRARY_PATH גלובלי בפרודקשן. הוא דולף לכל תהליך בן ויכול לטעון ספריות לא תואמות במקומות אחרים; תשתמש ב-rpath או $ORIGIN או באריזה מסודרת." },
    { en: "Assuming a static binary is patched by OS updates. Vendored/static libraries only get fixed by rebuilding — scan binaries (Trivy/govulncheck) and keep a fast rebuild pipeline.", he: "להניח שבינארי סטטי מתעדכן עם עדכוני OS. ספריות סטטיות או מוטמעות מתוקנות רק בבנייה מחדש — תסרוק בינאריים (Trivy או govulncheck) ותחזיק pipeline מהיר לבנייה מחדש." }
  ],
  interview: [
    { q: { en: "A container logs 'exec /app/api: no such file or directory' but ls shows the file. Explain.", he: "קונטיינר מדפיס 'exec /app/api: no such file or directory' אבל ls מראה את הקובץ. תסביר." },
      a: { en: "The binary is dynamically linked and its PT_INTERP points to a loader that doesn't exist in the image — typically /lib64/ld-linux-x86-64.so.2 (glibc) on Alpine (musl). The kernel fails to open the interpreter and reports ENOENT. Confirm with file/readelf -l; fix by building statically (CGO_ENABLED=0, musl target) or using a glibc base (distroless/base, debian-slim). Wrong CPU arch would instead say 'exec format error'.", he: "הבינארי מקושר דינמית וה-PT_INTERP שלו מצביע על loader שלא קיים ב-image — בדרך כלל ‎/lib64/ld-linux-x86-64.so.2 ‏(glibc) על Alpine ‏(musl). ה-kernel לא מצליח לפתוח את ה-interpreter ומדווח ENOENT. מאשרים עם file או readelf -l; מתקנים עם build סטטי (CGO_ENABLED=0, ‏target של musl) או base עם glibc ‏(distroless/base, ‏debian-slim). ארכיטקטורת CPU שגויה הייתה אומרת 'exec format error'." } },
    { q: { en: "Static vs dynamic linking for a fleet of microservices — what would you choose?", he: "Static מול dynamic linking לצי של microservices — מה היית בוחר?" },
      a: { en: "In containers the 'shared library saves RAM/disk' benefit mostly disappears (each image has its own copy anyway), so static binaries win on portability, tiny images and no libc mismatches. The trade: security fixes need rebuilds, so you need SBOMs, binary scanning and an automated rebuild/redeploy pipeline. Use dynamic when you need glibc features (NSS, dlopen plugins) or rely on OS-patched libs like OpenSSL with FIPS.", he: "בקונטיינרים היתרון של 'ספרייה משותפת חוסכת RAM ודיסק' כמעט נעלם (לכל image יש ממילא עותק משלו), אז בינאריים סטטיים מנצחים בניידות, ב-images קטנטנים ובלי אי-התאמות של libc. המחיר: תיקוני אבטחה דורשים בנייה מחדש, אז צריך SBOMs, סריקת בינאריים ו-pipeline אוטומטי לבנייה ו-deploy מחדש. בוחרים dynamic כשצריך יכולות של glibc ‏(NSS, ‏plugins עם dlopen) או כשמסתמכים על ספריות שה-OS מתקן כמו OpenSSL עם FIPS." } },
    { q: { en: "What does 'GLIBC_2.34 not found' tell you and how do you fix it durably?", he: "מה 'GLIBC_2.34 not found' אומר לך ואיך מתקנים את זה לטווח ארוך?" },
      a: { en: "The binary was linked against glibc 2.34+ and references symbols with that version tag (e.g. __libc_start_main@GLIBC_2.34), but the runtime has an older glibc. Durable fixes: build in an image whose glibc is no newer than the oldest runtime (same distro release for build and run), use manylinux-style old build roots, or go fully static. Never try to copy a newer libc.so into the old system.", he: "הבינארי קושר מול glibc 2.34 ומעלה ומפנה ל-symbols עם תגית הגרסה הזו (למשל __libc_start_main@GLIBC_2.34), אבל בזמן ריצה יש glibc ישן יותר. תיקונים לטווח ארוך: לבנות ב-image שה-glibc שלו לא חדש יותר מה-runtime הכי ישן (אותה גרסת distro ל-build ולהרצה), להשתמש בסביבות build ישנות בסגנון manylinux, או ללכת לסטטי לגמרי. אף פעם לא לנסות להעתיק libc.so חדש למערכת הישנה." } }
  ],
  quiz: [
    { q: { en: "nm main.o shows 'U printf'. What does U mean?", he: "nm main.o מראה 'U printf'. מה המשמעות של U?" },
      options: [ { en: "Unused — the linker will drop it", he: "Unused — ה-linker יוריד אותו" }, { en: "Undefined — referenced here, must be resolved by the linker from another object or library", he: "Undefined — יש אליו הפניה כאן, וה-linker חייב לפתור אותו מ-object או ספרייה אחרים" }, { en: "Unsigned integer", he: "מספר שלם בלי סימן" }, { en: "User-space symbol", he: "Symbol של user-space" } ],
      answer: 1, explain: { en: "U = undefined symbol. T marks a symbol defined in the code (.text) section.", he: "U = ‏undefined symbol. ‏T מסמן symbol שמוגדר ב-section של הקוד (.text)." } },
    { q: { en: "A binary built on Ubuntu runs fine there, but on Alpine says 'sh: ./api: not found' although the file exists. Most likely cause?", he: "בינארי שנבנה על Ubuntu רץ שם מצוין, אבל על Alpine אומר 'sh: ./api: not found' למרות שהקובץ קיים. מה הסיבה הסבירה?" },
      options: [ { en: "Missing execute permission", he: "חסרה הרשאת הרצה" }, { en: "The glibc loader /lib64/ld-linux-x86-64.so.2 named in PT_INTERP doesn't exist on musl-based Alpine", he: "ה-loader של glibc ‏‎/lib64/ld-linux-x86-64.so.2 שמופיע ב-PT_INTERP לא קיים ב-Alpine שמבוסס musl" }, { en: "Wrong CPU architecture", he: "ארכיטקטורת CPU שגויה" }, { en: "The PATH variable is wrong", he: "משתנה PATH שגוי" } ],
      answer: 1, explain: { en: "Permission problems say 'Permission denied' and wrong arch says 'exec format error'. 'not found' for an existing file = the interpreter (loader) is missing.", he: "בעיות הרשאה אומרות 'Permission denied' וארכיטקטורה שגויה אומרת 'exec format error'. ‏'not found' לקובץ שקיים = ה-interpreter ‏(loader) חסר." } },
    { q: { en: "Which build gives a Go binary that runs FROM scratch?", he: "איזה build נותן בינארי Go שרץ FROM scratch?" },
      options: [ { en: "go build with default settings and cgo-using packages", he: "go build עם הגדרות ברירת מחדל וחבילות שמשתמשות ב-cgo" }, { en: "CGO_ENABLED=0 go build", he: "CGO_ENABLED=0 go build" }, { en: "go build -race", he: "go build -race" }, { en: "Setting LD_LIBRARY_PATH in the Dockerfile", he: "להגדיר LD_LIBRARY_PATH ב-Dockerfile" } ],
      answer: 1, explain: { en: "Disabling cgo forces the pure-Go net/user implementations and produces a statically linked binary with no libc or loader dependency. Still add CA certs if it calls HTTPS.", he: "כיבוי cgo מכריח את המימושים ב-Go טהור של net ו-user ומייצר בינארי מקושר סטטית בלי תלות ב-libc או ב-loader. עדיין צריך להוסיף תעודות CA אם הוא קורא ל-HTTPS." } },
    { q: { en: "OpenSSL gets a critical CVE. Which services stay vulnerable after you patch the host OS packages and restart?", he: "יוצא CVE קריטי ב-OpenSSL. אילו שירותים נשארים פגיעים אחרי שעדכנת את חבילות ה-OS ב-host ועשית restart?" },
      options: [ { en: "Those dynamically linked to the system libssl", he: "אלה שמקושרים דינמית ל-libssl של המערכת" }, { en: "Those with OpenSSL statically linked or vendored, and every container image that bundles its own copy", he: "אלה שבהם OpenSSL מקושר סטטית או מוטמע, וכל image של קונטיינר שמביא עותק משלו" }, { en: "None — restart fixes everything", he: "אף אחד — restart מתקן הכל" }, { en: "Only Windows services", he: "רק שירותי Windows" } ],
      answer: 1, explain: { en: "Static/vendored code lives in the binary and container images carry their own userspace; both require rebuild + redeploy. That's why you scan binaries and images, not just hosts.", he: "קוד סטטי או מוטמע חי בתוך הבינארי, ו-images של קונטיינרים מביאים userspace משלהם; שניהם דורשים בנייה מחדש ו-deploy מחדש. בגלל זה סורקים בינאריים ו-images, לא רק hosts." } }
  ],
  playground: "terminal",
  related: ["container-slim-images", "docker-images", "container-builds-buildkit", "processes-linux", "staff-supply-chain", "compilers-how-code-runs", "transpilers-bundlers"]
});

[
  { term: "Bytecode", track: "foundations", def: { en: "Compact instructions for a virtual machine (JVM .class, CPython .pyc, V8 Ignition, .NET IL) that an interpreter runs and a JIT can turn into machine code.", he: "פקודות קומפקטיות למכונה וירטואלית (class של JVM, ‏pyc של CPython, ‏Ignition של V8, ‏IL של .NET) ש-interpreter מריץ ו-JIT יכול להפוך לקוד מכונה." }, lesson: "compilers-how-code-runs" },
  { term: "AOT compilation", track: "foundations", def: { en: "Ahead-of-time compilation to native machine code at build time (Go, Rust, GraalVM native image, .NET Native AOT): instant startup, no warm-up, but no runtime profiling and one binary per OS/arch.", he: "קומפילציה מראש לקוד מכונה native בזמן build ‏(Go, ‏Rust, ‏GraalVM native image, ‏.NET Native AOT): עלייה מיידית, בלי warm-up, אבל בלי profiling בזמן ריצה ובינארי אחד לכל OS וארכיטקטורה." }, lesson: "compilers-how-code-runs" },
  { term: "LLVM", track: "foundations", def: { en: "Reusable compiler back end: frontends like Clang, rustc and swiftc emit LLVM IR, and LLVM optimizes it and generates machine code for many CPU targets.", he: "Back end של compiler לשימוש חוזר: ‏frontends כמו Clang, ‏rustc ו-swiftc פולטים LLVM IR, ו-LLVM עושה לו אופטימיזציה ומייצר קוד מכונה להרבה סוגי CPU." }, lesson: "compilers-how-code-runs" },
  { term: "Tree shaking", track: "foundations", def: { en: "Bundler optimization that drops exports no one imports; needs static ES modules and side-effect-free packages (sideEffects: false).", he: "אופטימיזציה של bundler שמורידה exports שאף אחד לא מייבא; צריכה ES modules סטטיים וחבילות בלי side effects ‏(sideEffects: false)." }, lesson: "transpilers-bundlers" },
  { term: "Source map", track: "foundations", def: { en: "JSON file mapping minified/transpiled code positions back to original files and lines; upload to error tracking, don't serve publicly (it often embeds your full source).", he: "קובץ JSON שממפה מיקומים בקוד אחרי minify או transpile בחזרה לקבצים ולשורות המקוריים; מעלים ל-error tracking ולא מגישים לכולם (הוא לרוב מכיל את כל קוד המקור)." }, lesson: "transpilers-bundlers" },
  { term: "Polyfill", track: "foundations", def: { en: "Runtime code that adds a missing API (e.g. Array.prototype.at) to older engines; unlike syntax lowering, it can't fix new syntax.", he: "קוד בזמן ריצה שמוסיף API חסר (למשל Array.prototype.at) למנועים ישנים; בניגוד ל-syntax lowering, הוא לא יכול לתקן syntax חדש." }, lesson: "transpilers-bundlers" },
  { term: "Static linking", track: "foundations", def: { en: "Copying library code into the executable at link time, so it needs no shared libraries or loader at run time; portable, but security fixes require a rebuild.", he: "העתקת קוד ספריות לתוך קובץ ההרצה בזמן linking, כך שהוא לא צריך ספריות משותפות או loader בזמן ריצה; נייד, אבל תיקוני אבטחה דורשים בנייה מחדש." }, lesson: "linking-binaries" },
  { term: "ELF", track: "foundations", def: { en: "Executable and Linkable Format: the Linux file format for executables, .so libraries and .o object files; holds program headers (incl. PT_INTERP loader path), sections and dynamic symbols.", he: "Executable and Linkable Format: פורמט הקבצים של Linux לקבצי הרצה, ספריות so ו-object files; מכיל program headers (כולל נתיב ה-loader ב-PT_INTERP), ‏sections ו-symbols דינמיים." }, lesson: "linking-binaries" },
  { term: "ABI", track: "foundations", def: { en: "Application Binary Interface: the binary-level contract (calling convention, struct layout, symbol names and versions) that compiled code and libraries must share — e.g. GLIBC_2.34 symbol versions.", he: "Application Binary Interface: החוזה ברמה הבינארית (מוסכמת קריאה, פריסת structs, שמות וגרסאות של symbols) שקוד מקומפל וספריות חייבים לחלוק — למשל גרסאות symbols כמו GLIBC_2.34." }, lesson: "linking-binaries" }
].forEach(function (g) { INFRA.glossary.push(g); });

INFRA.scenarios.push({
  id: "glibc-not-found-alpine",
  icon: "🧩",
  title: { en: "The binary that 'doesn't exist': payments-api on a new Alpine image", he: "הבינארי ש'לא קיים': ‏payments-api על image חדש של Alpine" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "14:05. A platform PR switched payments-api's runtime image from debian:12-slim to alpine:3.20 to 'cut 60 MB and CVEs'. The canary rollout is stuck: new pods are in CrashLoopBackOff, old pods still serve. What first?",
        he: "14:05. ‏PR של צוות הפלטפורמה החליף את ה-image של זמן הריצה של payments-api מ-debian:12-slim ל-alpine:3.20 כדי 'לחסוך 60 MB ו-CVEs'. ה-canary תקוע: ה-Pods החדשים ב-CrashLoopBackOff, הישנים עדיין משרתים. מה קודם?"
      },
      data: "$ kubectl get pods -l app=payments-api\nNAME                            READY   STATUS             RESTARTS      AGE\npayments-api-7d9f8c6b5-2xkqp    1/1     Running            0             3d\npayments-api-6c4b9d7f8-h8vzn    0/1     CrashLoopBackOff   5 (40s ago)   4m\n\n$ kubectl logs payments-api-6c4b9d7f8-h8vzn\nexec /app/payments-api: no such file or directory",
      choices: [
        { label: { en: "Pause the rollout so it can't progress, then investigate the new image", he: "לעצור את ה-rollout כדי שלא יתקדם, ואז לחקור את ה-image החדש" }, next: "s2", score: 10,
          feedback: { en: "Right: old pods are healthy, so freeze the blast radius first. No customer impact while you debug.", he: "נכון: ה-Pods הישנים בריאים, אז קודם מקפיאים את טווח הפגיעה. אין השפעה על לקוחות בזמן שאתה עושה debug." } },
        { label: { en: "The COPY must have failed — rebuild the image with --no-cache and redeploy", he: "ה-COPY בטח נכשל — לבנות את ה-image מחדש עם ‎--no-cache ולעשות deploy שוב" }, next: "s2", score: 0,
          feedback: { en: "Twenty minutes later the same error. The file was copied fine — 'no such file' is about something else.", he: "עשרים דקות אחר כך אותה שגיאה. הקובץ הועתק בסדר — ה-'no such file' מדבר על משהו אחר." } },
        { label: { en: "Raise memory limits — crash loops are usually OOM", he: "להעלות memory limits — crash loops זה בדרך כלל OOM" }, next: "s2", score: 0,
          feedback: { en: "An OOMKill shows reason OOMKilled and exit code 137, not an exec error. Read the log you already have.", he: "OOMKill מופיע עם reason ‏OOMKilled ו-exit code ‏137, לא עם שגיאת exec. תקרא את הלוג שכבר יש לך." } }
      ]
    },
    s2: {
      text: {
        en: "You run the new image locally with a shell. The file is there and executable — yet running it says 'not found'. Next step?",
        he: "אתה מריץ את ה-image החדש מקומית עם shell. הקובץ שם ויש לו הרשאת הרצה — ובכל זאת ההרצה אומרת 'not found'. מה הצעד הבא?"
      },
      data: "$ docker run --rm -it --entrypoint sh registry.example.com/payments-api:2.8.0\n/app # ls -l /app/payments-api\n-rwxr-xr-x    1 root     root      24117432 Nov 14 13:52 /app/payments-api\n/app # /app/payments-api\nsh: /app/payments-api: not found",
      choices: [
        { label: { en: "Inspect the binary: file and readelf -l to see how it's linked and which loader it wants", he: "לבדוק את הבינארי: ‏file ו-readelf -l כדי לראות איך הוא מקושר ואיזה loader הוא רוצה" }, next: "s3", score: 10,
          feedback: { en: "Exactly — 'not found' for an existing file almost always means the ELF interpreter is missing.", he: "בדיוק — 'not found' לקובץ שקיים כמעט תמיד אומר שה-interpreter של ה-ELF חסר." } },
        { label: { en: "chmod 777 the binary", he: "לעשות chmod 777 לבינארי" }, next: "s3", score: 0,
          feedback: { en: "Permissions were already rwx; a permission problem says 'Permission denied'. You lost time, then went back to inspecting the binary.", he: "ההרשאות כבר היו rwx; בעיית הרשאות אומרת 'Permission denied'. איבדת זמן, ואז חזרת לבדוק את הבינארי." } }
      ]
    },
    s3: {
      text: {
        en: "The build stage is golang:1.23 (Debian, glibc) and the service imports confluent-kafka-go, which uses cgo + librdkafka. The binary is dynamically linked against glibc. Options?",
        he: "שלב ה-build הוא golang:1.23 ‏(Debian, ‏glibc) והשירות מייבא את confluent-kafka-go, שמשתמש ב-cgo וב-librdkafka. הבינארי מקושר דינמית מול glibc. מה האפשרויות?"
      },
      data: "/app # file /app/payments-api\n/app/payments-api: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked,\ninterpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=4be1..., for GNU/Linux 3.2.0, not stripped\n/app # ls /lib64/ld-linux-x86-64.so.2\nls: /lib64/ld-linux-x86-64.so.2: No such file or directory\n/app # ldd /app/payments-api\n        /lib64/ld-linux-x86-64.so.2 (0x7f02a1c4a000)\nError loading shared library libc.so.6: No such file or directory (needed by /app/payments-api)",
      choices: [
        { label: { en: "Run the runtime on a glibc base that matches the build: gcr.io/distroless/base-debian12 (still small, few CVEs)", he: "להריץ על base עם glibc שתואם ל-build: ‏gcr.io/distroless/base-debian12 (עדיין קטן, מעט CVEs)" }, next: "s5", score: 10,
          feedback: { en: "Same Debian 12 glibc as the build stage, no shell, small. Keeps cgo/librdkafka working.", he: "אותו glibc של Debian 12 כמו בשלב ה-build, בלי shell, קטן. ‏cgo ו-librdkafka ממשיכים לעבוד." } },
        { label: { en: "Rebuild on golang:1.23-alpine with CGO enabled and confluent-kafka-go's -tags musl, so it links against musl", he: "לבנות מחדש על golang:1.23-alpine עם CGO דלוק ועם ‎-tags musl של confluent-kafka-go, כך שהוא יקושר מול musl" }, next: "s5", score: 8,
          feedback: { en: "Works: build and runtime now share musl. Watch for musl DNS/malloc differences under load.", he: "עובד: ה-build וזמן הריצה חולקים עכשיו musl. שים לב להבדלים של musl ב-DNS וב-malloc תחת עומס." } },
        { label: { en: "apk add gcompat in the runtime image and ship it", he: "apk add gcompat ב-image של זמן הריצה ולשלוח" }, next: "s4", score: 3,
          feedback: { en: "It starts... sometimes. gcompat is a shim, not glibc.", he: "זה עולה... לפעמים. ‏gcompat זה shim, לא glibc." } },
        { label: { en: "Symlink /lib/ld-musl-x86_64.so.1 to /lib64/ld-linux-x86-64.so.2", he: "ליצור symlink מ-‎/lib/ld-musl-x86_64.so.1 ל-‎/lib64/ld-linux-x86-64.so.2" }, next: "lose", score: 0,
          feedback: { en: "Pretending musl is glibc: the loader starts, then symbol resolution and struct layouts mismatch.", he: "להעמיד פנים ש-musl הוא glibc: ה-loader עולה, ואז פתרון ה-symbols ופריסות ה-structs לא מתאימים." } }
      ]
    },
    s4: {
      text: {
        en: "With gcompat the process starts, but crashes as soon as the Kafka client initializes. Now what?",
        he: "עם gcompat התהליך עולה, אבל קורס ברגע שה-client של Kafka מאותחל. מה עכשיו?"
      },
      data: "/app # /app/payments-api\n{\"level\":\"info\",\"msg\":\"starting payments-api\",\"version\":\"2.8.0\"}\nError relocating /app/payments-api: __res_nquery: symbol not found\nError relocating /app/payments-api: gnu_get_libc_version: symbol not found",
      choices: [
        { label: { en: "Stop patching: use a glibc runtime base matching the build (distroless/base-debian12)", he: "להפסיק לטלאי: להשתמש ב-base של זמן ריצה עם glibc שתואם ל-build ‏(distroless/base-debian12)" }, next: "s5", score: 8,
          feedback: { en: "Good recovery. Match the libc instead of emulating it.", he: "התאוששות טובה. מתאימים את ה-libc במקום לחקות אותו." } },
        { label: { en: "Copy libc.so.6 and ld-linux from the build stage into the Alpine image", he: "להעתיק את libc.so.6 ואת ld-linux משלב ה-build לתוך ה-image של Alpine" }, next: "lose", score: 0,
          feedback: { en: "Now you maintain a half-glibc Alpine by hand: NSS modules, librdkafka deps and every future glibc CVE are on you.", he: "עכשיו אתה מתחזק ידנית Alpine עם חצי glibc: מודולי NSS, תלויות של librdkafka וכל CVE עתידי של glibc הם עליך." } }
      ]
    },
    s5: {
      text: {
        en: "The new image runs locally. Before resuming the rollout, a teammate asks: 'How do we make sure this never reaches a cluster again?'",
        he: "ה-image החדש רץ מקומית. לפני שממשיכים את ה-rollout, חבר צוות שואל: 'איך מוודאים שזה לא מגיע שוב ל-cluster?'"
      },
      data: "$ docker run --rm registry.example.com/payments-api:2.8.1 --version\npayments-api 2.8.1 (go1.23.4, librdkafka 2.6.1)\n$ docker run --rm --entrypoint=\"\" registry.example.com/payments-api:2.8.1-debug ldd /app/payments-api | grep -c 'not found'\n0",
      choices: [
        { label: { en: "Add a CI smoke test that runs the final image (--version / health check) and fails on exec/loader errors; resume the canary", he: "להוסיף ל-CI בדיקת smoke שמריצה את ה-image הסופי (‎--version או health check) ונכשלת על שגיאות exec או loader; להמשיך את ה-canary" }, next: "s6", score: 10,
          feedback: { en: "The cheapest guard: actually execute the artifact you ship, on the base you ship it on.", he: "השמירה הכי זולה: להריץ בפועל את ה-artifact שאתה שולח, על ה-base שאתה שולח אותו עליו." } },
        { label: { en: "Write a wiki page: 'don't use Alpine'", he: "לכתוב דף wiki: 'לא להשתמש ב-Alpine'" }, next: "s6", score: 3,
          feedback: { en: "Docs help, but nothing enforces them. The next base-image bump will repeat this.", he: "תיעוד עוזר, אבל שום דבר לא אוכף אותו. העדכון הבא של base image יחזור על זה." } }
      ]
    },
    s6: {
      text: {
        en: "Canary at 10%, error rate flat, p99 normal. One more decision: the image is now debian-based distroless. How do you keep the 'fewer CVEs' goal of the original PR?",
        he: "Canary על 10%, אחוז השגיאות שטוח, p99 תקין. עוד החלטה אחת: ה-image מבוסס עכשיו על distroless של Debian. איך שומרים על המטרה של 'פחות CVEs' מה-PR המקורי?"
      },
      data: "$ trivy image --severity HIGH,CRITICAL registry.example.com/payments-api:2.8.1\ngcr.io/distroless/base-debian12 (debian 12.8)\nTotal: 0 (HIGH: 0, CRITICAL: 0)\napp/payments-api (gobinary)\nTotal: 0 (HIGH: 0, CRITICAL: 0)",
      choices: [
        { label: { en: "Pin the base by digest, let Renovate bump it, scan OS + Go binary in CI, and document why this service needs glibc", he: "לנעול את ה-base לפי digest, לתת ל-Renovate לעדכן, לסרוק OS וגם את הבינארי של Go ב-CI, ולתעד למה השירות צריך glibc" }, next: "win", score: 10,
          feedback: { en: "Small, glibc-compatible, continuously patched and verified — the PR's goal without the outage risk.", he: "קטן, תואם glibc, מתעדכן ונבדק כל הזמן — המטרה של ה-PR בלי הסיכון לתקלה." } },
        { label: { en: "Switch back to Alpine next sprint, this time with gcompat preinstalled", he: "לחזור ל-Alpine בספרינט הבא, הפעם עם gcompat מותקן מראש" }, next: "lose", score: 0,
          feedback: { en: "You'd reintroduce the exact ABI mismatch you just debugged.", he: "היית מחזיר בדיוק את אי-ההתאמה ב-ABI שעכשיו עשית לה debug." } }
      ]
    },
    win: {
      text: {
        en: "Rollout complete with zero customer impact. You identified the missing ELF interpreter from the logs, matched the runtime libc to the build, and added a smoke test that executes the shipped image. Lesson: an image that builds isn't an image that runs — 'not found' for an existing file means the loader is missing.",
        he: "ה-rollout הושלם בלי שום השפעה על לקוחות. זיהית מהלוגים שה-interpreter של ה-ELF חסר, התאמת את ה-libc של זמן הריצה ל-build, והוספת בדיקת smoke שמריצה את ה-image שנשלח. הלקח: ‏image שנבנה הוא לא image שרץ — 'not found' לקובץ שקיים אומר שה-loader חסר."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The workaround 'works' in staging, then production pods segfault intermittently in DNS and Kafka code paths under load. A long incident and a rollback later, the fix is the boring one: build and run on the same libc (or build statically), and test the real image in CI.",
        he: "ה-workaround 'עובד' ב-staging, ואז Pods בפרודקשן חוטפים segfault לסירוגין בנתיבי קוד של DNS ו-Kafka תחת עומס. אחרי incident ארוך ו-rollback, התיקון הוא המשעמם: לבנות ולהריץ על אותו libc (או לבנות סטטי), ולבדוק את ה-image האמיתי ב-CI."
      },
      end: "lose"
    }
  },
  lessons: ["linking-binaries", "container-slim-images", "docker-images", "compilers-how-code-runs"]
});
