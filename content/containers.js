// Track: containers — Docker & containers
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding so the file also runs in non-browser sandboxes (tools/validate.js)

/* ============================== WHY DOCKER ============================== */
INFRA.lessons.push({
  id: "docker-why",
  track: "containers",
  order: 1,
  icon: "🚢",
  level: 1,
  minutes: 7,
  title: { en: "Why containers? The end of 'works on my machine'", he: "למה קונטיינרים? הסוף של 'אצלי זה עובד'" },
  tldr: {
    en: "A container image packages your app with its exact runtime and libraries, so it runs identically on your laptop, in CI and in production — it's a process with a lunchbox, not a mini-VM.",
    he: "Container image אורז את האפליקציה יחד עם ה-runtime והספריות המדויקים שלה, כך שהיא רצה זהה על הלפטופ, ב-CI ובפרודקשן — זה תהליך עם קופסת אוכל, לא VM מוקטן."
  },
  analogy: {
    en: "Before the 1950s, ships were loaded by hand: barrels, sacks, pianos, each packed differently, each port doing it its own way. The standard shipping container changed everything: the crane doesn't care if it holds bananas or laptops — every box has the same size and the same corners. Docker did that for software: the server doesn't care if it's Python 3.12 or Java 21 inside; it just runs the box.",
    he: "לפני שנות ה-50, אוניות הועמסו ביד: חביות, שקים, פסנתרים, כל אחד ארוז אחרת, וכל נמל עושה את זה בדרך שלו. המכולה הסטנדרטית שינתה הכל: לעגורן לא אכפת אם יש בפנים בננות או לפטופים — לכל קופסה אותו גודל ואותן פינות. Docker עשה את זה לתוכנה: לשרת לא אכפת אם בפנים יש Python 3.12 או Java 21; הוא פשוט מריץ את הקופסה."
  },
  sections: [
    {
      h: { en: "The problem: 'works on my machine'", he: "הבעיה: 'אצלי זה עובד'" },
      body: {
        en: `<p>Your app doesn't just need your code. It needs a specific language runtime (Node 20, not 18), system libraries (<code>libssl</code>, <code>libpq</code>, ImageMagick), environment variables, the right timezone data, a particular locale. Your laptop has one combination, the CI runner another, the prod server a third — installed by hand 3 years ago by someone who left.</p>
<p>The result: bugs that exist only in one environment, deploys that are 40-step wiki pages, and "dependency hell" when two apps on the same server need different versions of the same library. Classic tools (VMs, config management like Ansible) tried to fix this by making servers identical. Containers flipped it: <strong>ship the environment with the app</strong>, so the server only needs to know how to run containers.</p>
<blockquote>💡 Real world: onboarding a new developer goes from "follow the 2-day setup doc" to <code>git clone &amp;&amp; docker compose up</code>. That alone sells containers to most teams.</blockquote>`,
        he: `<p>האפליקציה שלך צריכה יותר מהקוד. היא צריכה runtime ספציפי (Node 20, לא 18), ספריות מערכת (<code>libssl</code>, ‏<code>libpq</code>, ‏ImageMagick), משתני סביבה, timezone data נכון, locale מסוים. על הלפטופ שלך יש שילוב אחד, על ה-CI runner שילוב אחר, ועל שרת הפרודקשן שילוב שלישי — שמישהו התקין ביד לפני 3 שנים ומאז עזב.</p>
<p>התוצאה: באגים שקיימים רק בסביבה אחת, deploys שהם עמוד wiki של 40 צעדים, ו-"dependency hell" כששתי אפליקציות על אותו שרת צריכות גרסאות שונות של אותה ספרייה. כלים קלאסיים (VMs, ‏config management כמו Ansible) ניסו לפתור את זה ע"י זה שכל השרתים יהיו זהים. קונטיינרים הפכו את זה: <strong>שולחים את הסביבה יחד עם האפליקציה</strong>, והשרת רק צריך לדעת להריץ קונטיינרים.</p>
<blockquote>💡 מהשטח: קליטת מפתח חדש עוברת מ"תעקוב אחרי מסמך ה-setup של יומיים" ל-<code>git clone &amp;&amp; docker compose up</code>. רק זה כבר משכנע את רוב הצוותים.</blockquote>`
      }
    },
    {
      h: { en: "Image vs container", he: "Image מול קונטיינר" },
      body: {
        en: `<p>An <strong>image</strong> is a read-only template: a stack of filesystem layers (your app, its deps, a base OS userland like Debian or Alpine) plus metadata (default command, env vars, exposed ports). It's built once and stored in a <strong>registry</strong> (Docker Hub, ECR, GHCR) under a name and tag like <code>myorg/api:1.4.2</code>.</p>
<p>A <strong>container</strong> is a running (or stopped) instance of an image: the image layers + a thin writable layer on top + an isolated process. One image, many containers — like a class and its objects, or a recipe and the dishes.</p>
<pre>docker pull nginx:1.27          # download the image (the recipe)
docker run -d --name web1 nginx:1.27   # container #1 (a dish)
docker run -d --name web2 nginx:1.27   # container #2, same image
docker ps                       # running containers
docker images                   # local images</pre>
<p>Anything a container writes to its writable layer disappears when the container is removed. Containers are <strong>cattle, not pets</strong>: anything you want to keep goes to a volume or an external service (DB, S3).</p>`,
        he: `<p><strong>Image</strong> הוא תבנית לקריאה בלבד: ערימה של שכבות filesystem (האפליקציה, התלויות, userland של מערכת הפעלה כמו Debian או Alpine) ועוד metadata (פקודת ברירת מחדל, משתני סביבה, פורטים). בונים אותו פעם אחת ושומרים אותו ב-<strong>registry</strong> ‏(Docker Hub, ‏ECR, ‏GHCR) תחת שם ו-tag כמו <code>myorg/api:1.4.2</code>.</p>
<p><strong>קונטיינר</strong> הוא מופע רץ (או עצור) של image: שכבות ה-image + שכבה דקה שאפשר לכתוב אליה מעליהן + תהליך מבודד. image אחד, הרבה קונטיינרים — כמו class ו-objects, או מתכון והמנות.</p>
<pre>docker pull nginx:1.27          # download the image (the recipe)
docker run -d --name web1 nginx:1.27   # container #1 (a dish)
docker run -d --name web2 nginx:1.27   # container #2, same image
docker ps                       # running containers
docker images                   # local images</pre>
<p>כל מה שקונטיינר כותב לשכבה הכתיבה שלו נעלם כשמוחקים אותו. קונטיינרים הם <strong>cattle, not pets</strong> — בקר, לא חיות מחמד: כל מה שרוצים לשמור הולך ל-volume או לשירות חיצוני (DB, ‏S3).</p>`
      }
    },
    {
      h: { en: "Container vs VM, in one breath", he: "קונטיינר מול VM, בנשימה אחת" },
      body: {
        en: `<p>A VM emulates a whole machine and boots its own kernel — GBs, tens of seconds. A container is <strong>just a Linux process</strong> that the host kernel isolates with namespaces (what it can see) and cgroups (what it can use). No guest kernel, no boot: start time is the time your app takes to start, often &lt; 1 s, and the image is often 20–200 MB.</p>
<p>Consequences you'll actually feel:</p>
<ul><li><strong>Density</strong>: dozens to hundreds of containers per node instead of a handful of VMs.</li>
<li><strong>Speed</strong>: scaling from 3 to 30 replicas takes seconds, not minutes.</li>
<li><strong>Same kernel</strong>: a Linux container needs a Linux kernel — which is why Docker Desktop runs a hidden Linux VM on Mac/Windows.</li>
<li><strong>Weaker isolation</strong>: containers share the kernel, so security hardening matters (see <em>container-security</em>).</li></ul>
<blockquote>💡 Real world: in production you almost always have both — containers running on VM nodes. The VM isolates tenants; the container packages apps.</blockquote>`,
        he: `<p>VM מדמה מכונה שלמה ומעלה kernel משלה — GBs, עשרות שניות. קונטיינר הוא <strong>פשוט תהליך Linux</strong> שה-kernel של ה-host מבודד עם namespaces (מה הוא רואה) ו-cgroups (במה הוא יכול להשתמש). אין guest kernel, אין boot: זמן העלייה הוא הזמן שלוקח לאפליקציה שלך לעלות, לרוב פחות משנייה, וה-image לרוב 20–200 MB.</p>
<p>השלכות שתרגיש בפועל:</p>
<ul><li><strong>צפיפות</strong>: עשרות עד מאות קונטיינרים ל-node במקום קומץ VMs.</li>
<li><strong>מהירות</strong>: scaling מ-3 ל-30 רפליקות לוקח שניות, לא דקות.</li>
<li><strong>אותו kernel</strong>: קונטיינר של Linux צריך kernel של Linux — ובגלל זה Docker Desktop מריץ VM נסתר של Linux על Mac/Windows.</li>
<li><strong>בידוד חלש יותר</strong>: קונטיינרים חולקים kernel, אז הקשחת אבטחה חשובה (ראה <em>container-security</em>).</li></ul>
<blockquote>💡 מהשטח: בפרודקשן כמעט תמיד יש את שניהם — קונטיינרים שרצים על nodes שהם VMs. ה-VM מבודד בין לקוחות; הקונטיינר אורז אפליקציות.</blockquote>`
      }
    },
    {
      h: { en: "The ecosystem: Docker, OCI, containerd", he: "האקוסיסטם: Docker, ‏OCI, ‏containerd" },
      body: {
        en: `<p>"Docker" is a brand, a CLI and a daemon. Under the hood the industry standardized on <strong>OCI</strong> (Open Container Initiative) specs: an <em>image format</em> and a <em>runtime spec</em>. That means an image built with Docker runs with Podman, containerd, CRI-O or Kubernetes — no lock-in.</p>
<p>The stack: <code>docker</code> CLI → <code>dockerd</code> → <strong>containerd</strong> (manages images and container lifecycle) → <strong>runc</strong> (the low-level tool that actually calls the kernel to create namespaces and cgroups, then execs your process). Kubernetes talks to containerd directly through the CRI and skips dockerd entirely — that's what "Kubernetes removed Docker" (dockershim, v1.24) meant. Your Dockerfiles and images kept working unchanged.</p>
<p>Alternatives worth knowing: <strong>Podman</strong> (daemonless, rootless by default, CLI-compatible: <code>alias docker=podman</code>), <strong>Buildah/BuildKit/Kaniko</strong> for building images, sometimes inside CI without a Docker daemon.</p>
<blockquote>⚠️ Production tip: Docker Desktop requires a paid license for larger companies; Podman Desktop, Rancher Desktop, Colima or OrbStack are common alternatives.</blockquote>`,
        he: `<p>"Docker" זה מותג, CLI ו-daemon. מתחת למכסה התעשייה התיישרה על התקנים של <strong>OCI</strong> ‏(Open Container Initiative): <em>פורמט image</em> ו-<em>runtime spec</em>. כלומר image שנבנה עם Docker רץ עם Podman, ‏containerd, ‏CRI-O או Kubernetes — בלי lock-in.</p>
<p>ה-stack: ה-CLI ‏<code>docker</code> ← <code>dockerd</code> ← <strong>containerd</strong> (מנהל images ומחזור חיים של קונטיינרים) ← <strong>runc</strong> (הכלי הנמוך שבאמת קורא ל-kernel כדי ליצור namespaces ו-cgroups, ואז עושה exec לתהליך שלך). Kubernetes מדבר עם containerd ישירות דרך ה-CRI ומדלג על dockerd לגמרי — זה מה שהכותרת "Kubernetes הוריד את Docker" (dockershim, גרסה 1.24) אמרה בפועל. ה-Dockerfiles וה-images שלך המשיכו לעבוד בלי שינוי.</p>
<p>חלופות שכדאי להכיר: <strong>Podman</strong> (בלי daemon, ‏rootless כברירת מחדל, CLI תואם: <code>alias docker=podman</code>), <strong>Buildah/BuildKit/Kaniko</strong> לבניית images, לפעמים בתוך CI בלי Docker daemon.</p>
<blockquote>⚠️ טיפ לפרודקשן: Docker Desktop דורש רישיון בתשלום בחברות גדולות; Podman Desktop, ‏Rancher Desktop, ‏Colima או OrbStack הן חלופות נפוצות.</blockquote>`
      }
    }
  ],
  diagram: `  build once                     run anywhere
  Dockerfile --docker build--> IMAGE --push--> REGISTRY --pull--> laptop / CI / prod
                               (read-only layers)                     |
                                                                      v
                                                      CONTAINER = image + writable layer
                                                                  + isolated process

  docker CLI -> dockerd -> containerd -> runc -> kernel (namespaces + cgroups)`,
  handsOn: [
    { cmd: "docker run --rm hello-world", what: { en: "The 'hello world' of containers: pull, create, run, print, exit, remove.", he: "ה-hello world של קונטיינרים: pull, ‏create, ‏run, הדפסה, יציאה, מחיקה." } },
    { cmd: "docker run --rm -it python:3.12-slim python -c 'import sys; print(sys.version)'", what: { en: "Run a specific Python version without installing it on your machine.", he: "להריץ גרסת Python מסוימת בלי להתקין אותה על המחשב." } },
    { cmd: "docker run -d -p 8080:80 --name web nginx:1.27 && curl -s localhost:8080 | head -5", what: { en: "Start nginx in the background and hit it on localhost:8080.", he: "להרים nginx ברקע ולפנות אליו ב-localhost:8080." } },
    { cmd: "docker ps -a && docker images && docker rm -f web", what: { en: "List containers and images, then clean up.", he: "לראות קונטיינרים ו-images, ואז לנקות." } }
  ],
  mnemonic: {
    en: "\"Image = recipe, Container = dish, Registry = cookbook shelf.\" Build once, ship the box, run anywhere.",
    he: "\"Image = מתכון, קונטיינר = מנה, Registry = מדף ספרי מתכונים.\" בונים פעם אחת, שולחים את הקופסה, מריצים בכל מקום."
  },
  pitfalls: [
    { en: "Treating a container like a VM: SSHing in, installing packages by hand, storing data in its filesystem. It'll all vanish on the next deploy.", he: "להתייחס לקונטיינר כמו ל-VM: להיכנס ב-SSH, להתקין חבילות ביד, לשמור דאטה ב-filesystem שלו. הכל ייעלם ב-deploy הבא." },
    { en: "Assuming 'containerized' means 'secure'. Containers share the host kernel; they're isolation, not a sandbox.", he: "להניח ש'בקונטיינר' אומר 'מאובטח'. קונטיינרים חולקים את ה-kernel; זה בידוד, לא sandbox." },
    { en: "Building an image on an ARM Mac and deploying it to x86 servers: 'exec format error'. Use docker buildx --platform linux/amd64 or multi-arch builds.", he: "לבנות image על Mac עם ARM ולפרוס אותו לשרתי x86: ‏'exec format error'. תשתמש ב-docker buildx --platform linux/amd64 או ב-build רב-ארכיטקטורות." }
  ],
  interview: [
    {
      q: { en: "What's the difference between an image and a container?", he: "מה ההבדל בין image לקונטיינר?" },
      a: { en: "An image is an immutable, layered filesystem plus metadata — the template. A container is a runtime instance of an image: the image layers, a writable layer on top, and an isolated process with its own namespaces and cgroup limits. Many containers can run from one image.", he: "Image הוא filesystem בשכבות שלא משתנה, ועוד metadata — התבנית. קונטיינר הוא מופע ריצה של image: שכבות ה-image, שכבה כתיבה מעליהן, ותהליך מבודד עם namespaces ו-cgroup limits משלו. מ-image אחד אפשר להריץ הרבה קונטיינרים." }
    },
    {
      q: { en: "Kubernetes 'deprecated Docker'. Do I need to change my Dockerfiles?", he: "Kubernetes 'הוציא משימוש את Docker'. אני צריך לשנות את ה-Dockerfiles?" },
      a: { en: "No. Kubernetes removed dockershim and talks to containerd/CRI-O directly. Images built by Docker are standard OCI images and run unchanged. Only setups relying on the Docker daemon on nodes (e.g. mounting docker.sock) were affected.", he: "לא. Kubernetes הסיר את dockershim ומדבר ישירות עם containerd/CRI-O. Images שנבנו עם Docker הם images סטנדרטיים של OCI ורצים בלי שינוי. רק הגדרות שהסתמכו על Docker daemon על ה-nodes (למשל mount ל-docker.sock) הושפעו." }
    }
  ],
  quiz: [
    {
      q: { en: "Which statement about containers is correct?", he: "איזו טענה על קונטיינרים נכונה?" },
      options: [
        { en: "Each container boots its own Linux kernel", he: "כל קונטיינר מעלה kernel של Linux משלו" },
        { en: "A container is an isolated process sharing the host's kernel", he: "קונטיינר הוא תהליך מבודד שחולק את ה-kernel של ה-host" },
        { en: "Containers can run Windows apps natively on a Linux host", he: "קונטיינרים יכולים להריץ אפליקציות Windows באופן native על host של Linux" },
        { en: "Containers are a type of Type 2 hypervisor", he: "קונטיינרים הם סוג של hypervisor מסוג 2" }
      ],
      answer: 1,
      explain: { en: "No guest kernel — namespaces and cgroups isolate a normal process. That's why they start in milliseconds and need a matching kernel.", he: "אין guest kernel — ‏namespaces ו-cgroups מבודדים תהליך רגיל. בגלל זה הם עולים תוך מילישניות וצריכים kernel תואם." }
    },
    {
      q: { en: "You write a file inside a running container, then 'docker rm' it and start a new one from the same image. Where's the file?", he: "כתבת קובץ בתוך קונטיינר רץ, ואז עשית לו docker rm והרמת חדש מאותו image. איפה הקובץ?" },
      options: [
        { en: "In the image, since containers write back to it", he: "ב-image, כי קונטיינרים כותבים אליו בחזרה" },
        { en: "In the registry", he: "ב-registry" },
        { en: "Gone — it lived in the removed container's writable layer", he: "נעלם — הוא חי בשכבה הכתיבה של הקונטיינר שנמחק" },
        { en: "In /tmp on the host", he: "ב-‎/tmp על ה-host" }
      ],
      answer: 2,
      explain: { en: "Images are read-only. Each container gets its own writable layer that is deleted with it. Persist data in volumes.", he: "Images הם לקריאה בלבד. לכל קונטיינר יש שכבה כתיבה משלו שנמחקת יחד איתו. דאטה שרוצים לשמור — ב-volumes." }
    },
    {
      q: { en: "What actually creates the namespaces and cgroups when a container starts?", he: "מה בפועל יוצר את ה-namespaces וה-cgroups כשקונטיינר עולה?" },
      options: [
        { en: "The Docker CLI", he: "ה-CLI של Docker" },
        { en: "The registry", he: "ה-registry" },
        { en: "The Dockerfile", he: "ה-Dockerfile" },
        { en: "A low-level OCI runtime like runc, via kernel syscalls", he: "runtime נמוך של OCI כמו runc, דרך syscalls ל-kernel" }
      ],
      answer: 3,
      explain: { en: "CLI → dockerd → containerd → runc → kernel. runc calls clone()/unshare() and writes cgroup files, then execs your process.", he: "CLI ← dockerd ← containerd ← runc ← kernel. ‏runc קורא ל-clone()/unshare() וכותב לקבצי cgroup, ואז עושה exec לתהליך שלך." }
    }
  ],
  related: ["docker-images", "docker-run", "container-internals", "vms", "k8s-pods"]
});

/* ============================== IMAGES ============================== */
INFRA.lessons.push({
  id: "docker-images",
  track: "containers",
  order: 2,
  icon: "🧱",
  level: 2,
  minutes: 11,
  title: { en: "Dockerfiles, layers & multi-stage builds", he: "Dockerfiles, שכבות ו-multi-stage builds" },
  tldr: {
    en: "Every Dockerfile instruction makes a cached layer; order them from 'rarely changes' to 'changes every commit', and use multi-stage builds so compilers never ship to production.",
    he: "כל הוראה ב-Dockerfile יוצרת שכבה עם cache; מסדרים אותן מ'כמעט לא משתנה' ל'משתנה בכל commit', ומשתמשים ב-multi-stage builds כדי שקומפיילרים לא יגיעו לפרודקשן."
  },
  analogy: {
    en: "A Dockerfile is a lasagna recipe, and each instruction adds a layer. Docker remembers every layer it has already baked. Change the cheese on top and it reuses the pasta and sauce underneath; change the bottom layer and it must rebake everything above it. A multi-stage build is cooking in a messy test kitchen and then plating only the finished dish — the pots, flour and knives stay behind.",
    he: "Dockerfile זה מתכון ללזניה, וכל הוראה מוסיפה שכבה. Docker זוכר כל שכבה שכבר אפה. משנים את הגבינה למעלה — הוא משתמש שוב בפסטה וברוטב שמתחת; משנים את השכבה התחתונה — הוא חייב לאפות מחדש את כל מה שמעליה. Multi-stage build זה לבשל במטבח ניסויים מבולגן, ואז להגיש רק את המנה המוכנה — הסירים, הקמח והסכינים נשארים מאחור."
  },
  sections: [
    {
      h: { en: "Dockerfile instructions you'll actually use", he: "הוראות Dockerfile שבאמת תשתמש בהן" },
      body: {
        en: `<ul><li><code>FROM node:20-slim</code> — the base image. Always pin a version, never bare <code>latest</code>.</li>
<li><code>WORKDIR /app</code> — cd (and mkdir) for the following instructions.</li>
<li><code>COPY package*.json ./</code> — copy files from the build context into the image.</li>
<li><code>RUN npm ci</code> — execute a command at <em>build</em> time; its filesystem result becomes a layer.</li>
<li><code>ENV NODE_ENV=production</code> — env var baked into the image (never secrets!).</li>
<li><code>ARG VERSION</code> — build-time variable (<code>--build-arg</code>), not present at runtime.</li>
<li><code>EXPOSE 3000</code> — documentation only; it does <em>not</em> publish the port.</li>
<li><code>USER node</code> — run as a non-root user from here on.</li>
<li><code>HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1</code></li>
<li><code>ENTRYPOINT</code> / <code>CMD</code> — what runs when the container starts. Use the JSON (exec) form: <code>CMD ["node","server.js"]</code>. With both, CMD becomes default arguments to ENTRYPOINT.</li></ul>
<p><code>COPY</code> vs <code>ADD</code>: prefer COPY. ADD also extracts tarballs and fetches URLs — surprising magic you rarely want.</p>`,
        he: `<ul><li><code>FROM node:20-slim</code> — ה-base image. תמיד לנעוץ גרסה, אף פעם לא <code>latest</code> ערום.</li>
<li><code>WORKDIR /app</code> — ‏cd (ו-mkdir) להוראות הבאות.</li>
<li><code>COPY package*.json ./</code> — להעתיק קבצים מה-build context לתוך ה-image.</li>
<li><code>RUN npm ci</code> — להריץ פקודה בזמן <em>build</em>; התוצאה ב-filesystem הופכת לשכבה.</li>
<li><code>ENV NODE_ENV=production</code> — משתנה סביבה שנאפה לתוך ה-image (אף פעם לא secrets!).</li>
<li><code>ARG VERSION</code> — משתנה של זמן build ‏(<code>--build-arg</code>), לא קיים בזמן ריצה.</li>
<li><code>EXPOSE 3000</code> — תיעוד בלבד; הוא <em>לא</em> מפרסם את הפורט.</li>
<li><code>USER node</code> — מכאן והלאה לרוץ כמשתמש שאינו root.</li>
<li><code>HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1</code></li>
<li><code>ENTRYPOINT</code> / <code>CMD</code> — מה רץ כשהקונטיינר עולה. משתמשים בצורת JSON ‏(exec): ‏<code>CMD ["node","server.js"]</code>. כשיש את שניהם, CMD הופך לארגומנטים דיפולטיים של ENTRYPOINT.</li></ul>
<p><code>COPY</code> מול <code>ADD</code>: עדיף COPY. ‏ADD גם פותח tarballs ומוריד URLs — קסם מפתיע שכמעט אף פעם לא רוצים.</p>`
      }
    },
    {
      h: { en: "Layers and caching: order matters", he: "שכבות ו-cache: הסדר קובע" },
      body: {
        en: `<p>Each <code>RUN</code>, <code>COPY</code> and <code>ADD</code> creates a layer, identified by a hash of its inputs. On rebuild, Docker walks down the file: as long as an instruction and its inputs are unchanged, it reuses the cached layer. <strong>The first changed instruction invalidates the cache for everything after it.</strong></p>
<p>The bad version — any code change reinstalls all dependencies (minutes):</p>
<pre>COPY . .
RUN npm ci</pre>
<p>The good version — dependencies are reinstalled only when the lockfile changes (seconds for normal commits):</p>
<pre>COPY package.json package-lock.json ./
RUN npm ci
COPY . .</pre>
<p>Same trick for Python (<code>requirements.txt</code>), Go (<code>go.mod go.sum</code> then <code>go mod download</code>), Java (<code>pom.xml</code> then <code>mvn dependency:go-offline</code>). Also: layers are additive. <code>RUN apt-get install X</code> followed by <code>RUN rm -rf /var/lib/apt/lists/*</code> doesn't shrink the image — the files still exist in the earlier layer. Clean up in the <em>same</em> RUN with <code>&amp;&amp;</code>.</p>
<blockquote>💡 Real world: with BuildKit, cache mounts (<code>RUN --mount=type=cache,target=/root/.npm npm ci</code>) keep the package manager's cache between builds without bloating the image.</blockquote>`,
        he: `<p>כל <code>RUN</code>, ‏<code>COPY</code> ו-<code>ADD</code> יוצר שכבה, שמזוהה ע"י hash של הקלטים שלה. ב-rebuild, ‏Docker עובר על הקובץ מלמעלה: כל עוד הוראה והקלטים שלה לא השתנו, הוא משתמש שוב בשכבה מה-cache. <strong>ההוראה הראשונה שהשתנתה מבטלת את ה-cache לכל מה שאחריה.</strong></p>
<p>הגרסה הרעה — כל שינוי קוד מתקין מחדש את כל התלויות (דקות):</p>
<pre>COPY . .
RUN npm ci</pre>
<p>הגרסה הטובה — התלויות מותקנות מחדש רק כשה-lockfile משתנה (שניות ב-commits רגילים):</p>
<pre>COPY package.json package-lock.json ./
RUN npm ci
COPY . .</pre>
<p>אותו טריק לפייתון (<code>requirements.txt</code>), ל-Go ‏(<code>go.mod go.sum</code> ואז <code>go mod download</code>), ל-Java ‏(<code>pom.xml</code> ואז <code>mvn dependency:go-offline</code>). ועוד: שכבות רק מצטברות. <code>RUN apt-get install X</code> ואחריו <code>RUN rm -rf /var/lib/apt/lists/*</code> לא מקטין את ה-image — הקבצים עדיין קיימים בשכבה הקודמת. מנקים באותו RUN עם <code>&amp;&amp;</code>.</p>
<blockquote>💡 מהשטח: עם BuildKit, ‏cache mounts ‏(<code>RUN --mount=type=cache,target=/root/.npm npm ci</code>) שומרים את ה-cache של מנהל החבילות בין builds בלי לנפח את ה-image.</blockquote>`
      }
    },
    {
      h: { en: "Multi-stage builds: a real example", he: "Multi-stage builds: דוגמה אמיתית" },
      body: {
        en: `<p>Build tools (compilers, dev dependencies, TypeScript, Maven) are huge and useless at runtime — and every extra binary is attack surface. A multi-stage build uses one stage to build and copies only the artifacts into a slim final stage:</p>
<pre># syntax=docker/dockerfile:1
# ---- build stage ----
FROM node:20-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # includes devDependencies (tsc, etc.)
COPY . .
RUN npm run build \
 &amp;&amp; npm prune --omit=dev        # drop devDependencies

# ---- runtime stage ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]</pre>
<p>Typical result: ~1.1 GB build image → <strong>~200 MB</strong> runtime image. For Go it's even more dramatic: build with <code>golang:1.23</code>, then <code>COPY --from=build /out/app /app</code> into <code>gcr.io/distroless/static</code> or <code>scratch</code> — a <strong>~10–20 MB</strong> image containing a single static binary.</p>`,
        he: `<p>כלי build (קומפיילרים, devDependencies, ‏TypeScript, ‏Maven) הם ענקיים וחסרי תועלת בזמן ריצה — וכל binary מיותר זה עוד attack surface. ‏multi-stage build משתמש ב-stage אחד כדי לבנות ומעתיק רק את התוצרים ל-stage סופי רזה:</p>
<pre># syntax=docker/dockerfile:1
# ---- build stage ----
FROM node:20-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # includes devDependencies (tsc, etc.)
COPY . .
RUN npm run build \
 &amp;&amp; npm prune --omit=dev        # drop devDependencies

# ---- runtime stage ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]</pre>
<p>תוצאה טיפוסית: image של build ב-~1.1 GB ← image של runtime ב-<strong>~200 MB</strong>. ב-Go זה עוד יותר דרמטי: בונים עם <code>golang:1.23</code>, ואז <code>COPY --from=build /out/app /app</code> לתוך <code>gcr.io/distroless/static</code> או <code>scratch</code> — image של <strong>~10–20 MB</strong> עם binary סטטי אחד.</p>`
      }
    },
    {
      h: { en: "Small base images and .dockerignore", he: "Base images קטנים ו-.dockerignore" },
      body: {
        en: `<table><tr><th>Base</th><th>Approx size</th><th>Notes</th></tr>
<tr><td><code>node:20</code> (Debian full)</td><td>~1 GB</td><td>Has compilers, git, everything. Good for build stages.</td></tr>
<tr><td><code>node:20-slim</code></td><td>~200 MB</td><td>Debian minus extras. Safe default runtime.</td></tr>
<tr><td><code>node:20-alpine</code></td><td>~130 MB</td><td>musl libc instead of glibc — native modules / DNS quirks can bite.</td></tr>
<tr><td><code>distroless</code></td><td>~20 MB + runtime</td><td>No shell, no package manager. Great for prod, harder to debug.</td></tr>
<tr><td><code>scratch</code></td><td>0 MB</td><td>Empty. Only for static binaries (Go, Rust).</td></tr></table>
<p>The <strong>build context</strong> is everything sent to the builder (<code>docker build .</code> sends <code>.</code>). Without a <code>.dockerignore</code> you upload <code>node_modules</code>, <code>.git</code>, and maybe <code>.env</code> with secrets — slow builds, broken caches, leaked credentials.</p>
<pre># .dockerignore
.git
node_modules
dist
*.log
.env*
Dockerfile
docker-compose*.yml
coverage/</pre>
<blockquote>⚠️ Production tip: smaller images pull faster (faster autoscaling and node recovery) and have fewer CVEs. A 1.5 GB image across 50 new nodes is 75 GB of pulls during an incident.</blockquote>`,
        he: `<table><tr><th>Base</th><th>גודל בערך</th><th>הערות</th></tr>
<tr><td><code>node:20</code> (Debian מלא)</td><td>~1 GB</td><td>יש קומפיילרים, git, הכל. טוב ל-build stages.</td></tr>
<tr><td><code>node:20-slim</code></td><td>~200 MB</td><td>Debian בלי תוספות. ברירת מחדל בטוחה ל-runtime.</td></tr>
<tr><td><code>node:20-alpine</code></td><td>~130 MB</td><td>musl libc במקום glibc — מודולים native ומוזרויות DNS יכולים לנשוך.</td></tr>
<tr><td><code>distroless</code></td><td>~20 MB + runtime</td><td>בלי shell, בלי מנהל חבילות. מעולה לפרודקשן, קשה יותר לדבג.</td></tr>
<tr><td><code>scratch</code></td><td>0 MB</td><td>ריק. רק ל-binaries סטטיים (Go, ‏Rust).</td></tr></table>
<p>ה-<strong>build context</strong> הוא כל מה שנשלח ל-builder ‏(<code>docker build .</code> שולח את <code>.</code>). בלי <code>.dockerignore</code> אתה מעלה את <code>node_modules</code>, את <code>.git</code>, ואולי <code>.env</code> עם secrets — builds איטיים, cache שבור, credentials שדולפים.</p>
<pre># .dockerignore
.git
node_modules
dist
*.log
.env*
Dockerfile
docker-compose*.yml
coverage/</pre>
<blockquote>⚠️ טיפ לפרודקשן: images קטנים נמשכים מהר יותר (autoscaling ושחזור nodes מהירים יותר) ויש בהם פחות CVEs. image של 1.5 GB על 50 nodes חדשים זה 75 GB של pulls באמצע תקלה.</blockquote>`
      }
    }
  ],
  diagram: `  Dockerfile               layers (cached bottom-up)
  FROM node:20-slim   -->  [ base OS + node      ]  changes: rarely
  COPY package*.json  -->  [ manifests           ]  changes: on dep bump
  RUN npm ci          -->  [ node_modules        ]  (cache hit unless above changed)
  COPY . .            -->  [ your source code    ]  changes: every commit
  CMD [...]           -->  metadata

  multi-stage:  [ build: compilers + devDeps ] --COPY --from=build--> [ slim runtime ]`,
  handsOn: [
    { cmd: "docker build -t myapp:dev . && docker images myapp", what: { en: "Build your image and check its size.", he: "לבנות את ה-image ולבדוק את הגודל שלו." } },
    { cmd: "docker history myapp:dev", what: { en: "See every layer, the instruction that made it, and its size — find the fat ones.", he: "לראות כל שכבה, את ההוראה שיצרה אותה ואת הגודל — למצוא את השמנות." } },
    { cmd: "touch src/index.ts && docker build -t myapp:dev .", what: { en: "Change only code and watch 'CACHED' on the dependency step.", he: "לשנות רק קוד ולראות 'CACHED' בשלב של התלויות." } },
    { cmd: "docker build --target build -t myapp:build . && docker images | grep myapp", what: { en: "Build only the first stage and compare its size to the final image.", he: "לבנות רק את ה-stage הראשון ולהשוות את הגודל ל-image הסופי." } },
    { cmd: "docker run --rm -it wagoodman/dive myapp:dev", what: { en: "Explore layers interactively and find wasted space with dive.", he: "לחקור שכבות אינטראקטיבית ולמצוא מקום מבוזבז עם dive." } }
  ],
  mnemonic: {
    en: "\"Stable on top of the file, volatile at the bottom.\" Copy the lockfile, install, THEN copy the code. And: build fat, ship thin.",
    he: "\"היציב למעלה בקובץ, ההפכפך למטה.\" מעתיקים lockfile, מתקינים, ורק אז מעתיקים קוד. ובנוסף: בונים שמן, שולחים רזה."
  },
  pitfalls: [
    { en: "COPY . . before installing dependencies — every code change busts the cache and reinstalls everything.", he: "‏COPY . . לפני התקנת התלויות — כל שינוי קוד שובר את ה-cache ומתקין הכל מחדש." },
    { en: "Deleting files in a later RUN to 'shrink' the image. Earlier layers still contain them; clean up in the same RUN or use multi-stage.", he: "למחוק קבצים ב-RUN מאוחר יותר כדי 'להקטין' את ה-image. השכבות הקודמות עדיין מכילות אותם; מנקים באותו RUN או משתמשים ב-multi-stage." },
    { en: "Missing .dockerignore: huge contexts, broken caching, and .env secrets baked into images.", he: "בלי .dockerignore: ‏context ענק, cache שבור, ו-secrets מ-.env שנאפים לתוך images." },
    { en: "Using FROM image:latest — builds aren't reproducible and a base image update can break prod silently.", he: "להשתמש ב-FROM image:latest — ה-builds לא ניתנים לשחזור ועדכון של ה-base image יכול לשבור את הפרודקשן בשקט." }
  ],
  interview: [
    {
      q: { en: "How does Docker layer caching work, and how do you optimize a Dockerfile for it?", he: "איך עובד ה-layer caching של Docker, ואיך מבצעים אופטימיזציה ל-Dockerfile בשבילו?" },
      a: { en: "Each instruction produces a layer keyed by the instruction and its inputs (for COPY, the file checksums). Docker reuses layers until the first change, then rebuilds everything after. So put rarely-changing steps first: base image, system packages, dependency manifests + install, and copy source code last.", he: "כל הוראה מייצרת שכבה שהמפתח שלה הוא ההוראה והקלטים שלה (ב-COPY, ה-checksums של הקבצים). ‏Docker משתמש שוב בשכבות עד השינוי הראשון, ואז בונה מחדש את כל מה שאחריו. אז שמים קודם את מה שכמעט לא משתנה: base image, חבילות מערכת, קבצי התלויות + התקנה, ואת הקוד מעתיקים בסוף." }
    },
    {
      q: { en: "Why use multi-stage builds?", he: "למה להשתמש ב-multi-stage builds?" },
      a: { en: "To separate the build environment (compilers, dev deps, source) from the runtime image. The final image contains only the artifacts it needs, making it smaller, faster to pull, and with less attack surface — without maintaining separate Dockerfiles or build scripts.", he: "כדי להפריד בין סביבת ה-build (קומפיילרים, devDeps, קוד מקור) ל-image של זמן הריצה. ה-image הסופי מכיל רק את התוצרים שהוא צריך — קטן יותר, נמשך מהר יותר, ועם פחות attack surface — בלי לתחזק Dockerfiles או סקריפטי build נפרדים." }
    }
  ],
  quiz: [
    {
      q: { en: "Why does 'EXPOSE 8080' in a Dockerfile not make the app reachable from your laptop?", he: "למה 'EXPOSE 8080' ב-Dockerfile לא הופך את האפליקציה לנגישה מהלפטופ?" },
      options: [
        { en: "EXPOSE only works with docker compose", he: "EXPOSE עובד רק עם docker compose" },
        { en: "EXPOSE is documentation; you must publish with -p 8080:8080", he: "EXPOSE זה תיעוד; צריך לפרסם עם ‎-p 8080:8080" },
        { en: "Port 8080 is reserved by Docker", he: "פורט 8080 שמור ל-Docker" },
        { en: "EXPOSE requires a HEALTHCHECK", he: "EXPOSE דורש HEALTHCHECK" }
      ],
      answer: 1,
      explain: { en: "EXPOSE is metadata. Publishing a port on the host is a runtime decision: docker run -p HOST:CONTAINER.", he: "EXPOSE הוא metadata. פרסום פורט על ה-host זו החלטה של זמן ריצה: docker run -p HOST:CONTAINER." }
    },
    {
      q: { en: "Which Dockerfile ordering gives the best cache reuse for a Python app?", he: "איזה סדר ב-Dockerfile נותן את ה-cache reuse הכי טוב לאפליקציית Python?" },
      options: [
        { en: "COPY . . → RUN pip install -r requirements.txt", he: "COPY . . ← RUN pip install -r requirements.txt" },
        { en: "RUN pip install flask → COPY . .", he: "RUN pip install flask ← COPY . ." },
        { en: "COPY requirements.txt . → RUN pip install -r requirements.txt → COPY . .", he: "COPY requirements.txt . ← RUN pip install -r requirements.txt ← COPY . ." },
        { en: "Order doesn't matter, Docker caches each file separately", he: "הסדר לא משנה, Docker עושה cache לכל קובץ בנפרד" }
      ],
      answer: 2,
      explain: { en: "The install layer depends only on requirements.txt, so code changes don't invalidate it.", he: "שכבת ההתקנה תלויה רק ב-requirements.txt, אז שינויי קוד לא מבטלים אותה." }
    },
    {
      q: { en: "A Dockerfile has 'RUN apt-get install -y build-essential' then 'RUN apt-get remove -y build-essential'. Image size?", he: "ב-Dockerfile יש 'RUN apt-get install -y build-essential' ואחריו 'RUN apt-get remove -y build-essential'. מה גודל ה-image?" },
      options: [
        { en: "Still includes build-essential's size, because the earlier layer holds the files", he: "עדיין כולל את הגודל של build-essential, כי השכבה הקודמת מחזיקה את הקבצים" },
        { en: "Back to the original size — the files were removed", he: "חוזר לגודל המקורי — הקבצים נמחקו" },
        { en: "Smaller than the base image", he: "קטן מה-base image" },
        { en: "The build fails", he: "ה-build נכשל" }
      ],
      answer: 0,
      explain: { en: "Layers are append-only; a later delete adds a 'whiteout' but the bytes remain in history. Use one RUN with && or a multi-stage build.", he: "שכבות רק מצטברות; מחיקה מאוחרת מוסיפה 'whiteout' אבל הבייטים נשארים בהיסטוריה. משתמשים ב-RUN אחד עם && או ב-multi-stage." }
    },
    {
      q: { en: "What's the main downside of a distroless runtime image?", he: "מה החיסרון העיקרי של image ‏distroless ל-runtime?" },
      options: [
        { en: "It's larger than Debian slim", he: "הוא גדול יותר מ-Debian slim" },
        { en: "It can't run as non-root", he: "הוא לא יכול לרוץ כ-non-root" },
        { en: "It has more CVEs", he: "יש בו יותר CVEs" },
        { en: "No shell or tools, so 'docker exec sh' debugging doesn't work", he: "אין shell או כלים, אז דיבוג עם 'docker exec sh' לא עובד" }
      ],
      answer: 3,
      explain: { en: "That's the trade-off: tiny and secure, but you debug with ephemeral debug containers (kubectl debug) or :debug variants instead of a shell.", he: "זה ה-trade-off: קטנטן ומאובטח, אבל מדבגים עם debug containers זמניים (kubectl debug) או גרסאות ‎:debug במקום shell." }
    }
  ],
  related: ["docker-why", "docker-run", "container-security", "container-internals"]
});

/* ============================== DOCKER RUN ============================== */
INFRA.lessons.push({
  id: "docker-run",
  track: "containers",
  order: 3,
  icon: "▶️",
  level: 1,
  minutes: 10,
  title: { en: "docker run: ports, volumes, networks & debugging", he: "docker run: פורטים, volumes, רשתות ודיבוג" },
  tldr: {
    en: "docker run turns an image into a running container; -p opens a door from the host, -v gives it persistent storage, networks let containers find each other by name, and logs/exec/inspect are your debugging trio.",
    he: "docker run הופך image לקונטיינר רץ; ‎-p פותח דלת מה-host, ‎-v נותן אחסון קבוע, רשתות מאפשרות לקונטיינרים למצוא אחד את השני לפי שם, ו-logs/exec/inspect הם שלישיית הדיבוג."
  },
  analogy: {
    en: "A container is a hotel room. -p is the reception forwarding calls from the hotel's public number (host port) to your room's extension (container port). A volume is a safe-deposit box in the hotel basement: check out, check into another room, your stuff is still there. A bind mount is bringing your own suitcase from home. A Docker network is the hotel's internal phone directory — you dial 'db' and it rings the right room.",
    he: "קונטיינר זה חדר במלון. ‎-p זה הקבלה שמעבירה שיחות מהמספר הציבורי של המלון (פורט ב-host) לשלוחה של החדר שלך (פורט בקונטיינר). Volume זו כספת במרתף המלון: עושים check-out, נכנסים לחדר אחר, והדברים שלך עדיין שם. Bind mount זה להביא מזוודה מהבית. רשת של Docker זה ספר הטלפונים הפנימי של המלון — מחייגים 'db' וזה מצלצל בחדר הנכון."
  },
  sections: [
    {
      h: { en: "The flags you'll use daily", he: "הדגלים שתשתמש בהם כל יום" },
      body: {
        en: `<pre>docker run -d --rm --name api \
  -p 8080:3000 \
  -e DATABASE_URL=postgres://app:pw@db:5432/app \
  --env-file .env \
  -v api-data:/var/lib/api \
  --memory 512m --cpus 1.5 \
  --network appnet \
  --restart unless-stopped \
  myorg/api:1.4.2</pre>
<ul><li><code>-d</code> detached (background). Without it, you're attached to its stdout.</li>
<li><code>--rm</code> delete the container when it exits (great for one-offs; don't combine with <code>--restart</code>).</li>
<li><code>-it</code> interactive + TTY, for shells: <code>docker run -it --rm ubuntu bash</code>.</li>
<li><code>-e</code>/<code>--env-file</code> environment variables — how 12-factor apps get config.</li>
<li><code>--memory 512m</code> hard limit (exceed it → OOM kill, exit 137). <code>--cpus 1.5</code> CFS quota of 1.5 CPUs (exceed → throttling).</li>
<li><code>--restart</code> <code>no | on-failure | always | unless-stopped</code>.</li></ul>
<blockquote>⚠️ Production tip: never run without <code>--memory</code> on a shared host. One leaking container can push the whole host into the OOM killer, taking unrelated containers with it.</blockquote>`,
        he: `<pre>docker run -d --rm --name api \
  -p 8080:3000 \
  -e DATABASE_URL=postgres://app:pw@db:5432/app \
  --env-file .env \
  -v api-data:/var/lib/api \
  --memory 512m --cpus 1.5 \
  --network appnet \
  --restart unless-stopped \
  myorg/api:1.4.2</pre>
<ul><li><code>-d</code> ‏detached (ברקע). בלעדיו אתה מחובר ל-stdout שלו.</li>
<li><code>--rm</code> למחוק את הקונטיינר כשהוא יוצא (מעולה לפקודות חד-פעמיות; לא משלבים עם <code>--restart</code>).</li>
<li><code>-it</code> אינטראקטיבי + TTY, בשביל shells: ‏<code>docker run -it --rm ubuntu bash</code>.</li>
<li><code>-e</code>/<code>--env-file</code> משתני סביבה — ככה אפליקציות 12-factor מקבלות config.</li>
<li><code>--memory 512m</code> limit קשיח (עוברים אותו ← OOM kill, ‏exit 137). <code>--cpus 1.5</code> ‏CFS quota של 1.5 CPUs (עוברים ← throttling).</li>
<li><code>--restart</code> ‏<code>no | on-failure | always | unless-stopped</code>.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: לעולם אל תריץ בלי <code>--memory</code> על host משותף. קונטיינר אחד עם דליפה יכול לדחוף את כל ה-host ל-OOM killer ולקחת איתו קונטיינרים שאין להם שום קשר.</blockquote>`
      }
    },
    {
      h: { en: "Port mapping: -p HOST:CONTAINER", he: "Port mapping: ‏‎-p HOST:CONTAINER" },
      body: {
        en: `<p>A container has its own network namespace: its own IP (e.g. <code>172.17.0.5</code>) and its own <code>localhost</code>. <code>-p 8080:3000</code> tells Docker to forward the host's port 8080 to the container's port 3000 (via iptables/nftables NAT rules). Left = outside, right = inside — "<strong>host first, then container</strong>".</p>
<ul><li><code>-p 8080:3000</code> — binds on all host interfaces (0.0.0.0). Reachable from your LAN!</li>
<li><code>-p 127.0.0.1:8080:3000</code> — only from the host itself. Use this for local DBs.</li>
<li><code>-p 3000</code> — random host port; find it with <code>docker port api</code>.</li>
<li><code>-P</code> — publish every EXPOSEd port to random host ports.</li></ul>
<p>Two classic bugs: (1) the app inside listens on <code>127.0.0.1:3000</code> — forwarded traffic arrives on the container's eth0, so nothing answers. Bind to <code>0.0.0.0</code>. (2) <code>bind: address already in use</code> — something on the host already owns 8080; <code>lsof -i :8080</code>.</p>
<blockquote>⚠️ Production tip: Docker-published ports bypass UFW/firewalld rules on many Linux setups, because Docker inserts its own iptables rules first. A <code>-p 5432:5432</code> Postgres on a cloud VM can be exposed to the internet despite "the firewall".</blockquote>`,
        he: `<p>לקונטיינר יש network namespace משלו: IP משלו (למשל <code>172.17.0.5</code>) ו-<code>localhost</code> משלו. ‏<code>-p 8080:3000</code> אומר ל-Docker להעביר את פורט 8080 של ה-host לפורט 3000 של הקונטיינר (דרך חוקי NAT של iptables/nftables). שמאל = בחוץ, ימין = בפנים — "<strong>קודם host, אחר כך קונטיינר</strong>".</p>
<ul><li><code>-p 8080:3000</code> — מאזין על כל ה-interfaces של ה-host ‏(0.0.0.0). נגיש מכל הרשת המקומית!</li>
<li><code>-p 127.0.0.1:8080:3000</code> — רק מה-host עצמו. ככה מריצים DBs לוקאליים.</li>
<li><code>-p 3000</code> — פורט רנדומלי ב-host; מוצאים אותו עם <code>docker port api</code>.</li>
<li><code>-P</code> — לפרסם כל פורט שהוגדר ב-EXPOSE לפורטים רנדומליים ב-host.</li></ul>
<p>שני באגים קלאסיים: (1) האפליקציה בפנים מאזינה ל-<code>127.0.0.1:3000</code> — ה-traffic שמועבר מגיע ל-eth0 של הקונטיינר, ואף אחד לא עונה. צריך להאזין ל-<code>0.0.0.0</code>. ‏(2) <code>bind: address already in use</code> — משהו על ה-host כבר תופס את 8080; ‏<code>lsof -i :8080</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: פורטים ש-Docker מפרסם עוקפים חוקי UFW/firewalld בהרבה התקנות Linux, כי Docker מכניס חוקי iptables משלו לפני. Postgres עם <code>-p 5432:5432</code> על VM בענן יכול להיות חשוף לאינטרנט למרות "ה-firewall".</blockquote>`
      }
    },
    {
      h: { en: "Volumes vs bind mounts", he: "Volumes מול bind mounts" },
      body: {
        en: `<p><strong>Named volume</strong> — <code>-v pgdata:/var/lib/postgresql/data</code>. Docker manages the storage (under <code>/var/lib/docker/volumes/</code>). Survives container removal, portable, the right choice for <strong>database data</strong> and anything the app owns. <code>docker volume ls</code>, <code>docker volume rm</code>.</p>
<p><strong>Bind mount</strong> — <code>-v "$PWD/src":/app/src</code> (or <code>--mount type=bind,src=...,dst=...</code>). Maps a specific host path into the container. Perfect for <strong>local development</strong> (edit code on the host, hot-reload in the container) and for injecting config files (<code>-v ./nginx.conf:/etc/nginx/nginx.conf:ro</code>). Downsides: depends on host paths, permissions/UID mismatches, and slow on Mac/Windows (file sync through the VM).</p>
<p><strong>tmpfs</strong> — <code>--tmpfs /tmp</code>: in-memory scratch space, gone on stop.</p>
<p>Rule of thumb: <em>volumes for data, bind mounts for dev and config</em>. Add <code>:ro</code> whenever the container only needs to read.</p>
<blockquote>💡 Real world: <code>docker compose down -v</code> deletes named volumes too. Many developers have wiped their local DB with that one extra <code>-v</code>.</blockquote>`,
        he: `<p><strong>Named volume</strong> — ‏<code>-v pgdata:/var/lib/postgresql/data</code>. ‏Docker מנהל את האחסון (תחת <code>/var/lib/docker/volumes/</code>). שורד מחיקה של הקונטיינר, נייד, והבחירה הנכונה ל-<strong>דאטה של דאטאבייס</strong> ולכל מה שהאפליקציה מחזיקה. <code>docker volume ls</code>, ‏<code>docker volume rm</code>.</p>
<p><strong>Bind mount</strong> — ‏<code>-v "$PWD/src":/app/src</code> (או <code>--mount type=bind,src=...,dst=...</code>). ממפה נתיב ספציפי ב-host לתוך הקונטיינר. מושלם ל<strong>פיתוח לוקאלי</strong> (עורכים קוד ב-host, ‏hot-reload בקונטיינר) ולהזרקת קבצי config ‏(<code>-v ./nginx.conf:/etc/nginx/nginx.conf:ro</code>). חסרונות: תלוי בנתיבים של ה-host, אי-התאמות של הרשאות/UID, ואיטי על Mac/Windows (סנכרון קבצים דרך ה-VM).</p>
<p><strong>tmpfs</strong> — ‏<code>--tmpfs /tmp</code>: מקום עבודה בזיכרון, נעלם כשעוצרים.</p>
<p>כלל אצבע: <em>volumes לדאטה, bind mounts לפיתוח ול-config</em>. מוסיפים <code>:ro</code> בכל פעם שהקונטיינר רק צריך לקרוא.</p>
<blockquote>💡 מהשטח: <code>docker compose down -v</code> מוחק גם את ה-named volumes. הרבה מפתחים מחקו את ה-DB הלוקאלי שלהם עם ה-<code>-v</code> המיותר הזה.</blockquote>`
      }
    },
    {
      h: { en: "Networks, and the debugging trio", he: "רשתות, ושלישיית הדיבוג" },
      body: {
        en: `<p>On the default <code>bridge</code> network containers can reach each other only by IP. Create a <strong>user-defined network</strong> and Docker's embedded DNS (<code>127.0.0.11</code>) resolves <strong>container names</strong>:</p>
<pre>docker network create appnet
docker run -d --name db --network appnet -e POSTGRES_PASSWORD=pw postgres:16
docker run -d --name api --network appnet -e DB_HOST=db myorg/api:1.4.2
# inside api: "db" resolves to the postgres container</pre>
<p>Note: containers talk to each other on the <strong>container port</strong> (5432) — <code>-p</code> is only for traffic from outside. Other drivers: <code>host</code> (no isolation, uses host's network stack — fast, Linux only), <code>none</code>.</p>
<p>The debugging trio:</p>
<ul><li><code>docker logs -f --tail 100 api</code> — stdout/stderr. Log to stdout, not files, in containers.</li>
<li><code>docker exec -it api sh</code> — a shell inside the running container (if it has one). Check env, files, <code>wget -qO- localhost:3000/health</code>.</li>
<li><code>docker inspect api</code> — the full truth as JSON: IP, mounts, env, restart count, exit code, OOMKilled. E.g. <code>docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}}' api</code>.</li></ul>
<p>Plus <code>docker stats</code> for live CPU/memory per container.</p>`,
        he: `<p>על רשת ה-<code>bridge</code> הדיפולטית קונטיינרים יכולים להגיע אחד לשני רק לפי IP. יוצרים <strong>user-defined network</strong> וה-DNS המובנה של Docker ‏(<code>127.0.0.11</code>) מתרגם <strong>שמות של קונטיינרים</strong>:</p>
<pre>docker network create appnet
docker run -d --name db --network appnet -e POSTGRES_PASSWORD=pw postgres:16
docker run -d --name api --network appnet -e DB_HOST=db myorg/api:1.4.2
# inside api: "db" resolves to the postgres container</pre>
<p>שים לב: קונטיינרים מדברים אחד עם השני על <strong>הפורט של הקונטיינר</strong> (5432) — ‏<code>-p</code> רלוונטי רק ל-traffic מבחוץ. דרייברים אחרים: <code>host</code> (בלי בידוד, משתמש ב-network stack של ה-host — מהיר, רק ב-Linux), ‏<code>none</code>.</p>
<p>שלישיית הדיבוג:</p>
<ul><li><code>docker logs -f --tail 100 api</code> — ‏stdout/stderr. בקונטיינרים כותבים לוגים ל-stdout, לא לקבצים.</li>
<li><code>docker exec -it api sh</code> — ‏shell בתוך הקונטיינר הרץ (אם יש לו). בודקים env, קבצים, <code>wget -qO- localhost:3000/health</code>.</li>
<li><code>docker inspect api</code> — כל האמת ב-JSON: ‏IP, ‏mounts, ‏env, מספר restarts, ‏exit code, ‏OOMKilled. למשל <code>docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}}' api</code>.</li></ul>
<p>ועוד <code>docker stats</code> ל-CPU/זיכרון חי לכל קונטיינר.</p>`
      }
    }
  ],
  diagram: `  laptop :8080 --(-p 8080:3000, iptables DNAT)--> [ api  172.18.0.3:3000 ]
                                                       |  network "appnet"
                                                       |  DNS: db -> 172.18.0.2
                                                  [ db   172.18.0.2:5432 ]
                                                       |
                                       -v pgdata:/var/lib/postgresql/data  (named volume)`,
  handsOn: [
    { cmd: "docker run -d --name pg -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD=pw -v pgdata:/var/lib/postgresql/data postgres:16", what: { en: "A local Postgres bound to localhost only, with data in a named volume.", he: "Postgres לוקאלי שמאזין רק ל-localhost, עם דאטה ב-named volume." } },
    { cmd: "docker rm -f pg && docker run -d --name pg -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD=pw -v pgdata:/var/lib/postgresql/data postgres:16", what: { en: "Delete and recreate the container — your data survives in the volume.", he: "למחוק וליצור מחדש את הקונטיינר — הדאטה שורד ב-volume." } },
    { cmd: "docker network create appnet && docker run --rm --network appnet --name a -d nginx:1.27 && docker run --rm --network appnet busybox wget -qO- http://a", what: { en: "Containers on a user-defined network resolve each other by name.", he: "קונטיינרים על user-defined network מוצאים אחד את השני לפי שם." } },
    { cmd: "docker stats --no-stream && docker inspect -f '{{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}' pg", what: { en: "Live resource usage and the container's exit/OOM status.", he: "שימוש במשאבים בזמן אמת וסטטוס היציאה/OOM של הקונטיינר." } }
  ],
  mnemonic: {
    en: "\"-p is Outside:Inside\" — host on the left, container on the right. -v: Volumes Vault your data, Bind mounts Bring your own files.",
    he: "\"‎-p זה בחוץ:בפנים\" — host משמאל, קונטיינר מימין. ‎-v: ‏volume זה כספת לדאטה, bind mount זה להביא את הקבצים מהבית."
  },
  pitfalls: [
    { en: "Using 'localhost' to reach another container. Inside a container, localhost is itself — use the container/service name on a shared network.", he: "להשתמש ב-localhost כדי להגיע לקונטיינר אחר. בתוך קונטיינר localhost זה הוא עצמו — משתמשים בשם הקונטיינר/השירות על רשת משותפת." },
    { en: "Publishing databases with -p 5432:5432 on a server — exposed on every interface, possibly bypassing the host firewall.", he: "לפרסם דאטאבייס עם ‎-p 5432:5432 על שרת — חשוף על כל ה-interfaces, ואולי עוקף את ה-firewall של ה-host." },
    { en: "Storing DB data in the container's writable layer (no volume). docker rm = data gone.", he: "לשמור דאטה של DB בשכבה הכתיבה של הקונטיינר (בלי volume). ‏docker rm = הדאטה נעלם." },
    { en: "Writing logs to files inside the container instead of stdout: docker logs shows nothing and the disk slowly fills.", he: "לכתוב לוגים לקבצים בתוך הקונטיינר במקום ל-stdout: ‏docker logs לא מראה כלום והדיסק מתמלא לאט." }
  ],
  interview: [
    {
      q: { en: "What's the difference between a volume and a bind mount?", he: "מה ההבדל בין volume ל-bind mount?" },
      a: { en: "A named volume is storage managed by Docker, independent of host paths, ideal for persistent app data. A bind mount maps an arbitrary host path into the container, ideal for dev hot-reload and injecting config, but couples the container to the host's filesystem layout and permissions.", he: "Named volume הוא אחסון ש-Docker מנהל, בלי תלות בנתיבים של ה-host, אידיאלי לדאטה קבוע של אפליקציה. Bind mount ממפה נתיב שרירותי ב-host לתוך הקונטיינר, אידיאלי ל-hot-reload בפיתוח ולהזרקת config, אבל קושר את הקונטיינר למבנה ה-filesystem וההרשאות של ה-host." }
    },
    {
      q: { en: "Two containers need to talk. How do you set that up?", he: "שני קונטיינרים צריכים לדבר. איך מגדירים את זה?" },
      a: { en: "Put them on the same user-defined network (docker network create, or compose does it automatically). Docker's embedded DNS resolves container/service names, so one connects to the other at name:containerPort. No -p needed for internal traffic.", he: "שמים אותם על אותה user-defined network ‏(docker network create, או ש-compose עושה את זה אוטומטית). ה-DNS המובנה של Docker מתרגם שמות של קונטיינרים/שירותים, אז אחד מתחבר לשני ב-name:containerPort. לא צריך ‎-p ל-traffic פנימי." }
    }
  ],
  quiz: [
    {
      q: { en: "'docker run -p 9000:80 nginx' — which URL works from your laptop?", he: "'docker run -p 9000:80 nginx' — איזה URL עובד מהלפטופ?" },
      options: [
        { en: "http://localhost:80", he: "http://localhost:80" },
        { en: "http://localhost:9000", he: "http://localhost:9000" },
        { en: "http://nginx:9000", he: "http://nginx:9000" },
        { en: "http://localhost:9080", he: "http://localhost:9080" }
      ],
      answer: 1,
      explain: { en: "HOST:CONTAINER — host port 9000 forwards to container port 80.", he: "HOST:CONTAINER — פורט 9000 ב-host מועבר לפורט 80 בקונטיינר." }
    },
    {
      q: { en: "Your api container connects to 'localhost:5432' but Postgres runs in another container. What should it use?", he: "קונטיינר ה-api מתחבר ל-'localhost:5432' אבל Postgres רץ בקונטיינר אחר. במה הוא צריך להשתמש?" },
      options: [
        { en: "The host's public IP and the published port", he: "ה-IP הציבורי של ה-host והפורט המפורסם" },
        { en: "127.0.0.1:5432 with --privileged", he: "‏127.0.0.1:5432 עם ‎--privileged" },
        { en: "The postgres container's name on a shared user-defined network, port 5432", he: "שם הקונטיינר של postgres על user-defined network משותפת, פורט 5432" },
        { en: "It's impossible without Kubernetes", he: "זה בלתי אפשרי בלי Kubernetes" }
      ],
      answer: 2,
      explain: { en: "localhost inside the api container is the api container. Use Docker's DNS: db:5432 on the same network.", he: "localhost בתוך קונטיינר ה-api הוא קונטיינר ה-api. משתמשים ב-DNS של Docker: ‏db:5432 על אותה רשת." }
    },
    {
      q: { en: "Where should a production Postgres container keep its data?", he: "איפה קונטיינר Postgres בפרודקשן צריך לשמור את הדאטה?" },
      options: [
        { en: "In a named volume (or a managed DB service instead)", he: "ב-named volume (או בכלל בשירות DB מנוהל)" },
        { en: "In the container's writable layer", he: "בשכבה הכתיבה של הקונטיינר" },
        { en: "In a tmpfs mount for speed", he: "ב-tmpfs בשביל מהירות" },
        { en: "Baked into the image at build time", he: "אפוי לתוך ה-image בזמן ה-build" }
      ],
      answer: 0,
      explain: { en: "The writable layer and tmpfs die with the container; images are immutable. Volumes persist independently.", he: "השכבה הכתיבה ו-tmpfs מתים עם הקונטיינר; images לא משתנים. ‏Volumes שורדים באופן עצמאי." }
    }
  ],
  related: ["docker-images", "docker-compose", "container-internals", "memory"]
});

/* ============================== COMPOSE ============================== */
INFRA.lessons.push({
  id: "docker-compose",
  track: "containers",
  order: 4,
  icon: "🎼",
  level: 1,
  minutes: 9,
  title: { en: "Docker Compose: your whole stack in one file", he: "Docker Compose: כל ה-stack בקובץ אחד" },
  tldr: {
    en: "Compose describes a multi-container app (api + db + redis) declaratively in one YAML file and runs it with 'docker compose up' — perfect for dev and single hosts, not a replacement for Kubernetes.",
    he: "Compose מתאר אפליקציה מרובת קונטיינרים (api + db + redis) בצורה דקלרטיבית בקובץ YAML אחד ומריץ אותה עם 'docker compose up' — מושלם לפיתוח ול-host בודד, לא תחליף ל-Kubernetes."
  },
  analogy: {
    en: "If docker run is a single musician you instruct by shouting flags, Compose is the sheet music for the whole band: who plays (services), which instruments (images), who must be warmed up before whom (depends_on + healthchecks), and which room they play in (network). Hand the score to anyone and they get the same concert. Kubernetes is the touring company that also replaces sick musicians mid-show across many stages.",
    he: "אם docker run זה נגן בודד שאתה צועק עליו דגלים, Compose זה התווים של כל הלהקה: מי מנגן (services), על מה (images), מי חייב להתחמם לפני מי (depends_on + healthchecks), ובאיזה אולם (network). נותנים את התווים לכל אחד ומקבלים אותה הופעה. Kubernetes זו חברת ההפקות שגם מחליפה נגנים חולים באמצע ההופעה, על הרבה במות במקביל."
  },
  sections: [
    {
      h: { en: "A real compose.yaml: app + Postgres + Redis", he: "compose.yaml אמיתי: אפליקציה + Postgres + Redis" },
      body: {
        en: `<pre>services:
  api:
    build: .                       # build from ./Dockerfile
    ports:
      - "8080:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app       # dev only!
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]

volumes:
  pgdata:</pre>
<p><code>docker compose up -d --build</code> builds the api, creates a network named after the project, starts db, waits until <code>pg_isready</code> passes, then starts the api. Service names (<code>db</code>, <code>cache</code>) are DNS names on that network.</p>`,
        he: `<pre>services:
  api:
    build: .                       # build from ./Dockerfile
    ports:
      - "8080:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app       # dev only!
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]

volumes:
  pgdata:</pre>
<p><code>docker compose up -d --build</code> בונה את ה-api, יוצר רשת על שם הפרויקט, מרים את db, מחכה ש-<code>pg_isready</code> יעבור, ורק אז מרים את ה-api. שמות השירותים (<code>db</code>, ‏<code>cache</code>) הם שמות DNS על הרשת הזו.</p>`
      }
    },
    {
      h: { en: "depends_on and healthchecks: 'started' ≠ 'ready'", he: "depends_on ו-healthchecks: 'עלה' ≠ 'מוכן'" },
      body: {
        en: `<p>Plain <code>depends_on: [db]</code> only controls <strong>start order</strong>: Compose starts the db container, then immediately the api. But Postgres needs a few seconds to initialize — the api connects, gets <code>ECONNREFUSED</code>, and crashes. That's the #1 Compose bug.</p>
<p>The fix is the long form with <code>condition: service_healthy</code>, which waits for the dependency's <strong>healthcheck</strong> to pass. Good healthchecks test real readiness: <code>pg_isready</code> for Postgres, <code>redis-cli ping</code> for Redis, <code>curl -f http://localhost:3000/health</code> for HTTP apps (the tool must exist in the image!). Other conditions: <code>service_started</code> and <code>service_completed_successfully</code> (perfect for a one-shot <code>migrate</code> service that runs DB migrations before the api starts).</p>
<blockquote>⚠️ Production tip: healthchecks only help at startup. If the DB restarts later, your app must still <strong>retry connections with backoff</strong>. Never rely on startup ordering for resilience — Kubernetes doesn't even have depends_on.</blockquote>`,
        he: `<p><code>depends_on: [db]</code> הפשוט שולט רק ב<strong>סדר העלייה</strong>: ‏Compose מרים את קונטיינר ה-db, ומיד אחריו את ה-api. אבל Postgres צריך כמה שניות לאתחול — ה-api מתחבר, מקבל <code>ECONNREFUSED</code>, וקורס. זה הבאג מספר 1 ב-Compose.</p>
<p>הפתרון הוא הצורה המלאה עם <code>condition: service_healthy</code>, שמחכה שה-<strong>healthcheck</strong> של התלות יעבור. healthchecks טובים בודקים מוכנות אמיתית: <code>pg_isready</code> ל-Postgres, ‏<code>redis-cli ping</code> ל-Redis, ‏<code>curl -f http://localhost:3000/health</code> לאפליקציות HTTP (הכלי חייב להיות קיים ב-image!). תנאים נוספים: <code>service_started</code> ו-<code>service_completed_successfully</code> (מושלם לשירות <code>migrate</code> חד-פעמי שמריץ migrations ל-DB לפני שה-api עולה).</p>
<blockquote>⚠️ טיפ לפרודקשן: healthchecks עוזרים רק בעלייה. אם ה-DB עושה restart מאוחר יותר, האפליקציה עדיין חייבת <strong>לנסות להתחבר מחדש עם backoff</strong>. לעולם אל תסמוך על סדר עלייה בשביל חוסן — ב-Kubernetes אפילו אין depends_on.</blockquote>`
      }
    },
    {
      h: { en: "Daily commands, overrides and dev workflow", he: "פקודות יומיומיות, overrides ו-workflow של פיתוח" },
      body: {
        en: `<pre>docker compose up -d --build     # start/refresh everything
docker compose ps                # status + health
docker compose logs -f api       # follow one service
docker compose exec db psql -U app   # shell into a service
docker compose run --rm api npm test # one-off command
docker compose down              # stop + remove containers &amp; network
docker compose down -v           # ...AND delete volumes (bye, data)</pre>
<p>Compose automatically merges <code>compose.yaml</code> with <code>compose.override.yaml</code> — the classic pattern: base file = production-like, override = dev conveniences (bind-mount source code, debug ports, hot reload). Use <code>-f</code> for explicit stacks: <code>docker compose -f compose.yaml -f compose.ci.yaml up</code>.</p>
<p>Secrets and per-developer values go in a <code>.env</code> file next to the compose file (auto-loaded for variable substitution) — and <code>.env</code> goes in <code>.gitignore</code>. <strong>Profiles</strong> let you keep optional services (e.g. a Grafana or a mail catcher) in the file but only start them with <code>--profile tools</code>.</p>
<blockquote>💡 Real world: Compose is also great for integration tests in CI — spin up real Postgres and Redis per pipeline run, run tests, <code>down -v</code>. No shared test DB, no flaky mocks.</blockquote>`,
        he: `<pre>docker compose up -d --build     # start/refresh everything
docker compose ps                # status + health
docker compose logs -f api       # follow one service
docker compose exec db psql -U app   # shell into a service
docker compose run --rm api npm test # one-off command
docker compose down              # stop + remove containers &amp; network
docker compose down -v           # ...AND delete volumes (bye, data)</pre>
<p>Compose ממזג אוטומטית את <code>compose.yaml</code> עם <code>compose.override.yaml</code> — הדפוס הקלאסי: קובץ בסיס = דומה לפרודקשן, override = נוחות לפיתוח (bind mount לקוד, פורטים לדיבאגר, hot reload). משתמשים ב-<code>-f</code> כדי לבנות stack מפורש: <code>docker compose -f compose.yaml -f compose.ci.yaml up</code>.</p>
<p>Secrets וערכים אישיים של כל מפתח הולכים לקובץ <code>.env</code> ליד קובץ ה-compose (נטען אוטומטית להחלפת משתנים) — ו-<code>.env</code> נכנס ל-<code>.gitignore</code>. <strong>Profiles</strong> מאפשרים להשאיר שירותים אופציונליים (למשל Grafana או mail catcher) בקובץ, אבל להרים אותם רק עם <code>--profile tools</code>.</p>
<blockquote>💡 מהשטח: Compose מעולה גם לבדיקות אינטגרציה ב-CI — מרימים Postgres ו-Redis אמיתיים לכל ריצת pipeline, מריצים בדיקות, ‏<code>down -v</code>. בלי DB בדיקות משותף, בלי mocks שמתנהגים מוזר.</blockquote>`
      }
    },
    {
      h: { en: "Compose vs Kubernetes", he: "Compose מול Kubernetes" },
      body: {
        en: `<table><tr><th></th><th>Compose</th><th>Kubernetes</th></tr>
<tr><td>Scope</td><td>One host</td><td>A cluster of many nodes</td></tr>
<tr><td>Self-healing</td><td>restart policy on the same host</td><td>Reschedules Pods to healthy nodes</td></tr>
<tr><td>Scaling</td><td><code>--scale api=3</code>, manual</td><td>HPA, cluster autoscaler</td></tr>
<tr><td>Rolling updates</td><td>Basic / none</td><td>Built in, with readiness gates</td></tr>
<tr><td>Load balancing, ingress, secrets, RBAC</td><td>DIY</td><td>Built in</td></tr>
<tr><td>Learning curve</td><td>An afternoon</td><td>Weeks</td></tr></table>
<p>Use <strong>Compose</strong> for local development, CI integration tests, demos, and small production apps on a single VM where a few seconds of downtime on deploy is acceptable. Move to <strong>Kubernetes</strong> (or a managed container platform like ECS, Cloud Run, Azure Container Apps) when you need multiple nodes, zero-downtime deploys, autoscaling, or many teams sharing infrastructure.</p>
<blockquote>💡 Real world: plenty of profitable SaaS products run on one beefy VM with Compose + nightly backups. Don't adopt Kubernetes because it's cool — adopt it when the single host is the problem.</blockquote>`,
        he: `<table><tr><th></th><th>Compose</th><th>Kubernetes</th></tr>
<tr><td>היקף</td><td>host אחד</td><td>cluster של הרבה nodes</td></tr>
<tr><td>Self-healing</td><td>restart policy על אותו host</td><td>מתזמן Pods מחדש על nodes בריאים</td></tr>
<tr><td>Scaling</td><td><code>--scale api=3</code>, ידני</td><td>HPA, ‏cluster autoscaler</td></tr>
<tr><td>Rolling updates</td><td>בסיסי / אין</td><td>מובנה, עם readiness gates</td></tr>
<tr><td>Load balancing, ‏ingress, ‏secrets, ‏RBAC</td><td>תעשה לבד</td><td>מובנה</td></tr>
<tr><td>עקומת למידה</td><td>אחר צהריים</td><td>שבועות</td></tr></table>
<p><strong>Compose</strong> לפיתוח לוקאלי, בדיקות אינטגרציה ב-CI, דמואים, ואפליקציות פרודקשן קטנות על VM אחד שבהן כמה שניות downtime ב-deploy זה בסדר. עוברים ל-<strong>Kubernetes</strong> (או לפלטפורמת קונטיינרים מנוהלת כמו ECS, ‏Cloud Run, ‏Azure Container Apps) כשצריך כמה nodes, ‏deploys בלי downtime, ‏autoscaling, או הרבה צוותים שחולקים תשתית.</p>
<blockquote>💡 מהשטח: לא מעט מוצרי SaaS רווחיים רצים על VM אחד חזק עם Compose וגיבוי לילי. אל תאמץ Kubernetes כי זה מגניב — תאמץ אותו כשה-host הבודד הוא הבעיה.</blockquote>`
      }
    }
  ],
  diagram: `  docker compose up
        |
        v
  network "myapp_default"  (DNS: api, db, cache)
   [ db  postgres:16 ] --healthcheck pg_isready--> healthy
   [ cache redis:7  ]  started                        |
                                                       v
   [ api  build: . ]  starts only after db is healthy   -p 8080:3000 -> laptop
   volume pgdata --> db`,
  handsOn: [
    { cmd: "docker compose up -d --build && docker compose ps", what: { en: "Bring the stack up and watch db go from 'starting' to 'healthy' before api starts.", he: "להרים את ה-stack ולראות את db עובר מ-starting ל-healthy לפני שה-api עולה." } },
    { cmd: "docker compose exec cache redis-cli ping", what: { en: "Run a command inside a service by its name.", he: "להריץ פקודה בתוך שירות לפי השם שלו." } },
    { cmd: "docker compose config", what: { en: "Print the fully merged, variable-substituted config — great for debugging overrides and .env.", he: "להדפיס את ה-config הממוזג אחרי החלפת משתנים — מעולה לדיבוג overrides ו-.env." } },
    { cmd: "docker compose down && docker compose up -d && docker compose exec db psql -U app -c '\\dt'", what: { en: "Recreate containers and confirm data survived in the named volume.", he: "ליצור מחדש את הקונטיינרים ולוודא שהדאטה שרד ב-named volume." } }
  ],
  mnemonic: {
    en: "\"Started is not Ready.\" depends_on orders, healthcheck confirms. Compose = one host, one file, one command.",
    he: "\"עלה זה לא מוכן.\" depends_on קובע סדר, healthcheck מאשר. ‏Compose = ‏host אחד, קובץ אחד, פקודה אחת."
  },
  pitfalls: [
    { en: "Using short depends_on and expecting the DB to be ready. Use condition: service_healthy plus a real healthcheck, and retry in the app.", he: "להשתמש ב-depends_on הקצר ולצפות שה-DB יהיה מוכן. משתמשים ב-condition: service_healthy עם healthcheck אמיתי, ועושים retry באפליקציה." },
    { en: "Running 'docker compose down -v' out of habit and deleting your local database volume.", he: "להריץ 'docker compose down -v' מתוך הרגל ולמחוק את ה-volume של ה-DB הלוקאלי." },
    { en: "Committing real passwords in compose.yaml. Use .env (gitignored) or Docker secrets; keep 'app/app' strictly for local dev.", he: "לעשות commit לסיסמאות אמיתיות ב-compose.yaml. משתמשים ב-.env (ב-gitignore) או ב-Docker secrets; את 'app/app' משאירים רק לפיתוח לוקאלי." },
    { en: "Publishing ports for db and redis 'just in case' — internal services don't need -p; only expose what you must, and bind to 127.0.0.1.", he: "לפרסם פורטים ל-db ול-redis 'ליתר ביטחון' — שירותים פנימיים לא צריכים ‎-p; חושפים רק מה שחייבים, ועל 127.0.0.1." }
  ],
  interview: [
    {
      q: { en: "Your API container crashes on 'docker compose up' with connection refused to Postgres, but works on restart. Why and how to fix?", he: "קונטיינר ה-API קורס ב-'docker compose up' עם connection refused ל-Postgres, אבל עובד אחרי restart. למה ואיך מתקנים?" },
      a: { en: "depends_on only waits for the db container to start, not for Postgres to accept connections. Add a healthcheck (pg_isready) to db and depends_on with condition: service_healthy; additionally make the app retry DB connections with backoff.", he: "depends_on מחכה רק שהקונטיינר של ה-db יעלה, לא ש-Postgres יקבל חיבורים. מוסיפים healthcheck ‏(pg_isready) ל-db ו-depends_on עם condition: service_healthy; ובנוסף גורמים לאפליקציה לעשות retry לחיבור עם backoff." }
    },
    {
      q: { en: "When would you choose Compose over Kubernetes for production?", he: "מתי תבחר Compose על פני Kubernetes לפרודקשן?" },
      a: { en: "Small apps on a single host with modest availability needs: internal tools, early-stage products, edge boxes. Compose is simpler to operate and reason about. Once you need multi-node HA, zero-downtime rolling deploys, autoscaling or multi-team tenancy, Kubernetes or a managed container service is worth its complexity.", he: "אפליקציות קטנות על host בודד עם דרישות זמינות צנועות: כלים פנימיים, מוצרים בשלב מוקדם, קופסאות edge. ‏Compose פשוט יותר לתפעול ולהבנה. ברגע שצריך HA על כמה nodes, ‏rolling deploys בלי downtime, ‏autoscaling או כמה צוותים על אותה תשתית — Kubernetes או שירות קונטיינרים מנוהל שווים את המורכבות." }
    }
  ],
  quiz: [
    {
      q: { en: "In a compose file, how does the api service reach Redis defined as service 'cache'?", he: "בקובץ compose, איך שירות ה-api מגיע ל-Redis שמוגדר כשירות 'cache'?" },
      options: [
        { en: "redis://localhost:6379", he: "redis://localhost:6379" },
        { en: "redis://cache:6379", he: "redis://cache:6379" },
        { en: "Only via a published port on the host", he: "רק דרך פורט מפורסם על ה-host" },
        { en: "redis://172.17.0.1:6379", he: "redis://172.17.0.1:6379" }
      ],
      answer: 1,
      explain: { en: "Compose puts services on a shared network where each service name is a DNS name. localhost would be the api container itself.", he: "Compose שם את השירותים על רשת משותפת שבה כל שם שירות הוא שם DNS. ‏localhost זה קונטיינר ה-api עצמו." }
    },
    {
      q: { en: "What does 'depends_on: [db]' (short form) guarantee?", he: "מה 'depends_on: [db]' (הצורה הקצרה) מבטיח?" },
      options: [
        { en: "db accepts connections before api starts", he: "ש-db מקבל חיבורים לפני שה-api עולה" },
        { en: "api restarts if db crashes", he: "שה-api יעשה restart אם db קורס" },
        { en: "db's container is started before api's container", he: "שהקונטיינר של db מורם לפני הקונטיינר של api" },
        { en: "db and api run on the same CPU", he: "ש-db ו-api רצים על אותו CPU" }
      ],
      answer: 2,
      explain: { en: "Short form = start order only. Readiness needs condition: service_healthy with a healthcheck.", he: "הצורה הקצרה = רק סדר עלייה. מוכנות דורשת condition: service_healthy עם healthcheck." }
    },
    {
      q: { en: "Which command wipes your local Postgres data defined in a named volume?", he: "איזו פקודה מוחקת את הדאטה של Postgres הלוקאלי שמוגדר ב-named volume?" },
      options: [
        { en: "docker compose down -v", he: "docker compose down -v" },
        { en: "docker compose down", he: "docker compose down" },
        { en: "docker compose restart db", he: "docker compose restart db" },
        { en: "docker compose stop", he: "docker compose stop" }
      ],
      answer: 0,
      explain: { en: "-v removes named volumes declared in the file. Plain down removes containers and the network but keeps volumes.", he: "‎-v מוחק את ה-named volumes שהוגדרו בקובץ. ‏down רגיל מוחק קונטיינרים ורשת אבל משאיר volumes." }
    }
  ],
  related: ["docker-run", "docker-images", "k8s-pods", "k8s-architecture"]
});

/* ============================== INTERNALS ============================== */
INFRA.lessons.push({
  id: "container-internals",
  track: "containers",
  order: 5,
  icon: "🔬",
  level: 3,
  minutes: 11,
  title: { en: "Container internals: namespaces, cgroups, overlayfs", he: "מאחורי הקלעים: namespaces, ‏cgroups, ‏overlayfs" },
  tldr: {
    en: "A container is just a Linux process wearing three costumes: namespaces limit what it can SEE, cgroups limit what it can USE, and overlayfs gives it a layered filesystem — no magic, no VM.",
    he: "קונטיינר הוא פשוט תהליך Linux שלובש שלוש תחפושות: namespaces מגבילים מה הוא רואה, cgroups מגבילים במה הוא משתמש, ו-overlayfs נותן לו filesystem בשכבות — בלי קסמים, בלי VM."
  },
  analogy: {
    en: "Picture a process inside a VR headset. Namespaces are the headset: it sees its own little world — its own PID 1, its own network card, its own hostname, its own root folder — and has no idea 300 other processes share the room. Cgroups are the leash and the diet: it can only eat 512 MB and run 1.5 CPUs' worth. Overlayfs is a pile of transparent sheets: read-only drawings from the image underneath, and a fresh sheet on top where it can scribble.",
    he: "תדמיין תהליך עם משקפי VR. ‏Namespaces הם המשקפיים: הוא רואה עולם קטן משלו — PID 1 משלו, כרטיס רשת משלו, hostname משלו, תיקיית root משלו — ואין לו מושג ש-300 תהליכים אחרים חולקים איתו את החדר. ‏Cgroups הם הרצועה והדיאטה: מותר לו לאכול רק 512 MB ולרוץ על 1.5 CPUs. ‏Overlayfs זו ערימה של שקפים: ציורים לקריאה בלבד מה-image למטה, ודף חדש למעלה שעליו מותר לו לשרבט."
  },
  sections: [
    {
      h: { en: "\"A container is just a process\" — prove it", he: "\"קונטיינר הוא סתם תהליך\" — בוא נוכיח" },
      body: {
        en: `<p>Run a container and look at it from the <strong>host</strong>:</p>
<pre>$ docker run -d --name sleepy alpine sleep 9999
$ ps -ef | grep 'sleep 9999'
root   48211  48188  0 10:02 ?   00:00:00 sleep 9999
$ docker exec sleepy ps
PID   USER     COMMAND
    1 root     sleep 9999</pre>
<p>Same process, two identities: PID 48211 on the host, PID 1 inside. There's no hidden OS, no guest kernel. The host kernel schedules it like any other process, <code>top</code> on the host shows it, and <code>kill 48211</code> from the host kills the "container". What makes it feel like a separate machine is a handful of kernel features applied at creation time by the runtime (runc): <code>clone()</code> with namespace flags, writing limits into cgroup files, and <code>pivot_root</code> into an overlay filesystem.</p>
<blockquote>💡 Real world: this is why container start-up is milliseconds — creating namespaces and cgroups is just a few syscalls. It's also why a kernel bug can break isolation: everyone shares one kernel.</blockquote>`,
        he: `<p>תריץ קונטיינר ותסתכל עליו מה-<strong>host</strong>:</p>
<pre>$ docker run -d --name sleepy alpine sleep 9999
$ ps -ef | grep 'sleep 9999'
root   48211  48188  0 10:02 ?   00:00:00 sleep 9999
$ docker exec sleepy ps
PID   USER     COMMAND
    1 root     sleep 9999</pre>
<p>אותו תהליך, שתי זהויות: PID 48211 על ה-host, ‏PID 1 בפנים. אין מערכת הפעלה נסתרת, אין guest kernel. ה-kernel של ה-host מתזמן אותו כמו כל תהליך אחר, <code>top</code> על ה-host מראה אותו, ו-<code>kill 48211</code> מה-host הורג את ה"קונטיינר". מה שגורם לזה להרגיש כמו מכונה נפרדת זה קומץ פיצ'רים של ה-kernel שה-runtime ‏(runc) מפעיל ביצירה: <code>clone()</code> עם דגלי namespace, כתיבת limits לקבצי cgroup, ו-<code>pivot_root</code> לתוך overlay filesystem.</p>
<blockquote>💡 מהשטח: בגלל זה קונטיינר עולה תוך מילישניות — יצירת namespaces ו-cgroups זה כמה syscalls. ובגלל זה גם באג ב-kernel יכול לשבור את הבידוד: כולם חולקים kernel אחד.</blockquote>`
      }
    },
    {
      h: { en: "Namespaces: what a process can SEE", he: "Namespaces: מה תהליך יכול לראות" },
      body: {
        en: `<table><tr><th>Namespace</th><th>Isolates</th><th>Effect in a container</th></tr>
<tr><td><strong>pid</strong></td><td>Process IDs</td><td>Your app is PID 1 and sees only its own processes</td></tr>
<tr><td><strong>net</strong></td><td>Network stack</td><td>Own interfaces (eth0, lo), IPs, routing table, ports, iptables</td></tr>
<tr><td><strong>mnt</strong></td><td>Mount points</td><td>Own root filesystem (the image), own mounts</td></tr>
<tr><td><strong>uts</strong></td><td>Hostname</td><td><code>hostname</code> returns the container ID / Pod name</td></tr>
<tr><td><strong>ipc</strong></td><td>SysV IPC, POSIX message queues, shared memory</td><td>Can't touch other apps' shared memory</td></tr>
<tr><td><strong>user</strong></td><td>UIDs/GIDs</td><td>Root inside can map to an unprivileged UID outside (rootless containers)</td></tr>
<tr><td><strong>cgroup</strong></td><td>cgroup view</td><td>Sees its own cgroup as the root</td></tr></table>
<p>Namespaces can be <strong>shared</strong>. A Kubernetes Pod is exactly that: several containers sharing one net namespace (that's why they reach each other on <code>localhost</code>) and optionally IPC/PID. <code>docker run --network host</code> simply skips creating a net namespace. Try it raw, no Docker: <code>sudo unshare --pid --fork --mount-proc bash</code> then <code>ps</code> — you're PID 1 in a fresh PID namespace.</p>`,
        he: `<table><tr><th>Namespace</th><th>מה מבודד</th><th>האפקט בקונטיינר</th></tr>
<tr><td><strong>pid</strong></td><td>מזהי תהליכים</td><td>האפליקציה היא PID 1 ורואה רק את התהליכים שלה</td></tr>
<tr><td><strong>net</strong></td><td>ה-network stack</td><td>interfaces משלה (eth0, ‏lo), ‏IPs, טבלת ניתוב, פורטים, iptables</td></tr>
<tr><td><strong>mnt</strong></td><td>נקודות mount</td><td>root filesystem משלה (ה-image), ‏mounts משלה</td></tr>
<tr><td><strong>uts</strong></td><td>Hostname</td><td><code>hostname</code> מחזיר את ה-container ID / שם ה-Pod</td></tr>
<tr><td><strong>ipc</strong></td><td>SysV IPC, תורי הודעות POSIX, ‏shared memory</td><td>לא יכולה לגעת ב-shared memory של אפליקציות אחרות</td></tr>
<tr><td><strong>user</strong></td><td>UIDs/GIDs</td><td>root בפנים יכול להיות ממופה ל-UID לא מורשה בחוץ (rootless containers)</td></tr>
<tr><td><strong>cgroup</strong></td><td>התצוגה של cgroups</td><td>רואה את ה-cgroup שלה כשורש</td></tr></table>
<p>אפשר <strong>לשתף</strong> namespaces. ‏Pod ב-Kubernetes זה בדיוק זה: כמה קונטיינרים שחולקים net namespace אחד (בגלל זה הם מגיעים אחד לשני ב-<code>localhost</code>) ואופציונלית גם IPC/PID. ‏<code>docker run --network host</code> פשוט מדלג על יצירת net namespace. נסה את זה גולמי, בלי Docker: <code>sudo unshare --pid --fork --mount-proc bash</code> ואז <code>ps</code> — אתה PID 1 ב-PID namespace חדש.</p>`
      }
    },
    {
      h: { en: "cgroups: what a process can USE", he: "cgroups: במה תהליך יכול להשתמש" },
      body: {
        en: `<p><strong>Control groups</strong> put processes into a hierarchy and enforce resource accounting and limits. Modern distros use <strong>cgroup v2</strong>, a single tree under <code>/sys/fs/cgroup</code>. <code>docker run --memory 256m --cpus 0.5</code> literally writes into files:</p>
<pre>$ cat /sys/fs/cgroup/system.slice/docker-&lt;id&gt;.scope/memory.max
268435456                       # 256 MiB, hard limit -&gt; OOM kill
$ cat /sys/fs/cgroup/system.slice/docker-&lt;id&gt;.scope/cpu.max
50000 100000                    # 50 ms quota per 100 ms period = 0.5 CPU
$ cat .../cpu.stat
nr_periods 1200
nr_throttled 340                # throttled in 28% of periods!
throttled_usec 9120000</pre>
<p><strong>Memory</strong> is incompressible: exceed <code>memory.max</code> and the kernel OOM-kills a process in that cgroup (exit 137). <strong>CPU</strong> is compressible: exceed the quota and you're throttled until the next period. Kubernetes <code>requests</code> map to <code>cpu.weight</code> (relative share under contention) and <code>limits</code> map to <code>cpu.max</code> / <code>memory.max</code>. cgroups also limit PIDs (<code>pids.max</code>, fork-bomb protection) and block IO (<code>io.max</code>).</p>
<blockquote>⚠️ Production tip: apps that read <code>/proc/meminfo</code> or count CPUs naively see the <em>host's</em> resources, not the cgroup's. Use container-aware runtimes (JVM 10+, Go 1.25+ GOMAXPROCS, or set worker counts explicitly).</blockquote>`,
        he: `<p><strong>Control groups</strong> מכניסים תהליכים להיררכיה ואוכפים מדידת משאבים ו-limits. הפצות מודרניות משתמשות ב-<strong>cgroup v2</strong>, עץ אחד תחת <code>/sys/fs/cgroup</code>. ‏<code>docker run --memory 256m --cpus 0.5</code> ממש כותב לקבצים:</p>
<pre>$ cat /sys/fs/cgroup/system.slice/docker-&lt;id&gt;.scope/memory.max
268435456                       # 256 MiB, hard limit -&gt; OOM kill
$ cat /sys/fs/cgroup/system.slice/docker-&lt;id&gt;.scope/cpu.max
50000 100000                    # 50 ms quota per 100 ms period = 0.5 CPU
$ cat .../cpu.stat
nr_periods 1200
nr_throttled 340                # throttled in 28% of periods!
throttled_usec 9120000</pre>
<p><strong>זיכרון</strong> הוא משאב שאי אפשר "לדחוס": עוברים את <code>memory.max</code> וה-kernel עושה OOM kill לתהליך ב-cgroup הזה (exit 137). <strong>CPU</strong> אפשר לדחוס: עוברים את ה-quota ומקבלים throttling עד ה-period הבא. ב-Kubernetes, ‏<code>requests</code> ממופים ל-<code>cpu.weight</code> (חלק יחסי כשיש תחרות) ו-<code>limits</code> ממופים ל-<code>cpu.max</code> / <code>memory.max</code>. ‏cgroups מגבילים גם PIDs ‏(<code>pids.max</code>, הגנה מ-fork bomb) ו-IO לדיסק (<code>io.max</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: אפליקציות שקוראות את <code>/proc/meminfo</code> או סופרות CPUs בצורה נאיבית רואות את המשאבים של <em>ה-host</em>, לא של ה-cgroup. משתמשים ב-runtimes שמכירים קונטיינרים (JVM 10+, ‏GOMAXPROCS ב-Go 1.25+, או מגדירים מספר workers במפורש).</blockquote>`
      }
    },
    {
      h: { en: "overlayfs: the layered filesystem", he: "overlayfs: ה-filesystem בשכבות" },
      body: {
        en: `<p>Image layers are stored once on disk and shared by every container using them. <strong>OverlayFS</strong> stacks them into one view:</p>
<ul><li><strong>lowerdir</strong> — the image layers, read-only, stacked.</li>
<li><strong>upperdir</strong> — the container's private writable layer.</li>
<li><strong>merged</strong> — what the process sees as <code>/</code>.</li></ul>
<p>Reading a file: served from the topmost layer that has it. Writing to a file from the image: <strong>copy-up</strong> — the whole file is copied to upperdir first, then modified (so appending to a 2 GB file in the image copies 2 GB). Deleting: a "whiteout" marker in upperdir hides the lower file. That's why 50 containers from a 500 MB image use ~500 MB on disk plus their small diffs, and why heavy writes belong in volumes, which bypass overlayfs entirely.</p>
<pre>$ docker inspect -f '{{json .GraphDriver.Data}}' sleepy
{"LowerDir":"/var/lib/docker/overlay2/9c1.../diff:...",
 "UpperDir":"/var/lib/docker/overlay2/4fa.../diff",
 "MergedDir":"/var/lib/docker/overlay2/4fa.../merged"}</pre>
<blockquote>💡 Real world: the formula for a container is <strong>namespaces + cgroups + overlayfs root + (seccomp, capabilities, AppArmor/SELinux)</strong>. Those last ones are the security layer — next lesson.</blockquote>`,
        he: `<p>שכבות ה-image נשמרות פעם אחת בדיסק ומשותפות לכל הקונטיינרים שמשתמשים בהן. <strong>OverlayFS</strong> מערים אותן לתצוגה אחת:</p>
<ul><li><strong>lowerdir</strong> — שכבות ה-image, לקריאה בלבד, אחת על השנייה.</li>
<li><strong>upperdir</strong> — שכבת הכתיבה הפרטית של הקונטיינר.</li>
<li><strong>merged</strong> — מה שהתהליך רואה בתור <code>/</code>.</li></ul>
<p>קריאת קובץ: מוגש מהשכבה העליונה ביותר שיש בה אותו. כתיבה לקובץ שמגיע מה-image: <strong>copy-up</strong> — כל הקובץ מועתק קודם ל-upperdir ורק אז משתנה (אז append לקובץ של 2 GB מה-image מעתיק 2 GB). מחיקה: סמן "whiteout" ב-upperdir מסתיר את הקובץ שמתחת. בגלל זה 50 קונטיינרים מ-image של 500 MB תופסים ~500 MB בדיסק ועוד ההבדלים הקטנים שלהם, ובגלל זה כתיבות כבדות שייכות ל-volumes, שעוקפים את overlayfs לגמרי.</p>
<pre>$ docker inspect -f '{{json .GraphDriver.Data}}' sleepy
{"LowerDir":"/var/lib/docker/overlay2/9c1.../diff:...",
 "UpperDir":"/var/lib/docker/overlay2/4fa.../diff",
 "MergedDir":"/var/lib/docker/overlay2/4fa.../merged"}</pre>
<blockquote>💡 מהשטח: הנוסחה של קונטיינר היא <strong>namespaces + cgroups + root ב-overlayfs + ‏(seccomp, ‏capabilities, ‏AppArmor/SELinux)</strong>. האחרונים הם שכבת האבטחה — בשיעור הבא.</blockquote>`
      }
    }
  ],
  diagram: `                  HOST KERNEL (one, shared)
  +-----------------------------------------------------------+
  |  process 48211 "sleep 9999"                               |
  |   namespaces: pid(=1 inside) net mnt uts ipc user cgroup  |  -> what it SEES
  |   cgroup:     memory.max=256M  cpu.max=50000 100000       |  -> what it USES
  |   root fs:    overlayfs                                   |  -> what it STANDS ON
  |               merged  = upper (rw, container) + lower (ro, image layers)
  +-----------------------------------------------------------+`,
  handsOn: [
    { cmd: "docker run -d --name sleepy alpine sleep 9999 && docker inspect -f '{{.State.Pid}}' sleepy", what: { en: "Get the container's real PID on the host.", he: "לקבל את ה-PID האמיתי של הקונטיינר על ה-host." } },
    { cmd: "sudo ls -l /proc/$(docker inspect -f '{{.State.Pid}}' sleepy)/ns", what: { en: "See the namespace handles of the container process; compare with /proc/self/ns.", he: "לראות את ה-namespaces של תהליך הקונטיינר; להשוות ל-‎/proc/self/ns." } },
    { cmd: "sudo nsenter -t $(docker inspect -f '{{.State.Pid}}' sleepy) -n ip addr", what: { en: "Enter only the container's network namespace with a host tool — debugging without a shell in the image.", he: "להיכנס רק ל-network namespace של הקונטיינר עם כלי מה-host — דיבוג בלי shell ב-image." } },
    { cmd: "docker run --rm --memory 64m --cpus 0.25 alpine sh -c 'cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max'", what: { en: "Read your own cgroup limits from inside a container (cgroup v2).", he: "לקרוא את ה-cgroup limits מתוך הקונטיינר עצמו (cgroup v2)." } },
    { cmd: "sudo unshare --pid --fork --mount-proc --uts bash -c 'hostname box; hostname; ps'", what: { en: "Build a mini-container by hand: new PID + UTS namespaces, no Docker.", he: "לבנות מיני-קונטיינר ביד: ‏PID ו-UTS namespaces חדשים, בלי Docker." } }
  ],
  mnemonic: {
    en: "\"Namespaces = what you SEE, cgroups = what you USE, overlay = what you STAND on.\" Namespaces: \"PNMUIU\" — Please Never Mount Unknown IPC Users (pid, net, mnt, uts, ipc, user).",
    he: "\"Namespaces = מה רואים, cgroups = במה משתמשים, overlay = על מה עומדים.\" ושישת ה-namespaces באנגלית: \"Please Never Mount Unknown IPC Users\" — pid, ‏net, ‏mnt, ‏uts, ‏ipc, ‏user."
  },
  pitfalls: [
    { en: "Believing containers are lightweight VMs with their own kernel — leads to wrong security and kernel-tuning assumptions (sysctls are often host-wide).", he: "להאמין שקונטיינרים הם VMs קלים עם kernel משלהם — מוביל להנחות שגויות על אבטחה ועל כיוונון kernel (הרבה sysctls הם ברמת ה-host)." },
    { en: "Heavy writes into the container filesystem (databases, big logs): copy-up and overlay overhead. Use volumes.", he: "כתיבות כבדות ל-filesystem של הקונטיינר (דאטאבייסים, לוגים גדולים): copy-up ו-overhead של overlay. משתמשים ב-volumes." },
    { en: "Sizing thread pools or heap from host-wide /proc values inside a cgroup-limited container — instant OOM or throttling.", he: "לקבוע גודל thread pool או heap לפי ערכי ‎/proc של כל ה-host בתוך קונטיינר מוגבל ב-cgroup — OOM או throttling מיידי." }
  ],
  interview: [
    {
      q: { en: "What is a container, at the Linux level?", he: "מה זה קונטיינר, ברמת Linux?" },
      a: { en: "A normal process (or group) started with its own namespaces (pid, net, mnt, uts, ipc, user, cgroup) for isolation of what it sees, placed in a cgroup that limits CPU, memory, PIDs and IO, with an overlayfs root filesystem built from image layers, plus security filters like seccomp and dropped capabilities.", he: "תהליך רגיל (או קבוצה) שמופעל עם namespaces משלו (pid, ‏net, ‏mnt, ‏uts, ‏ipc, ‏user, ‏cgroup) לבידוד של מה שהוא רואה, בתוך cgroup שמגביל CPU, זיכרון, PIDs ו-IO, עם root filesystem ב-overlayfs שנבנה משכבות ה-image, ועוד מסנני אבטחה כמו seccomp ו-capabilities מוסרות." }
    },
    {
      q: { en: "How do containers in the same Kubernetes Pod talk over localhost?", he: "איך קונטיינרים באותו Pod ב-Kubernetes מדברים על localhost?" },
      a: { en: "They share a single network namespace (created by the pause/sandbox container), so they have the same interfaces, IP and loopback. They must use different ports. Their filesystems (mnt namespaces) remain separate unless they share volumes.", he: "הם חולקים network namespace אחד (שנוצר ע\"י קונטיינר ה-pause/sandbox), אז יש להם אותם interfaces, אותו IP ואותו loopback. הם חייבים להשתמש בפורטים שונים. ה-filesystems שלהם (mnt namespaces) נשארים נפרדים אלא אם הם חולקים volumes." }
    }
  ],
  quiz: [
    {
      q: { en: "Which kernel feature limits how much memory a container can use?", he: "איזה פיצ'ר של ה-kernel מגביל כמה זיכרון קונטיינר יכול לצרוך?" },
      options: [
        { en: "The mnt namespace", he: "ה-mnt namespace" },
        { en: "OverlayFS", he: "OverlayFS" },
        { en: "seccomp", he: "seccomp" },
        { en: "cgroups (memory.max)", he: "cgroups ‏(memory.max)" }
      ],
      answer: 3,
      explain: { en: "Namespaces control visibility, cgroups control consumption. memory.max is the cgroup v2 hard limit.", he: "Namespaces שולטים בנראות, cgroups שולטים בצריכה. ‏memory.max הוא ה-limit הקשיח ב-cgroup v2." }
    },
    {
      q: { en: "Two containers in one Pod reach each other on localhost because they share which namespace?", he: "שני קונטיינרים באותו Pod מגיעים אחד לשני ב-localhost כי הם חולקים איזה namespace?" },
      options: [
        { en: "pid", he: "pid" },
        { en: "net", he: "net" },
        { en: "mnt", he: "mnt" },
        { en: "uts", he: "uts" }
      ],
      answer: 1,
      explain: { en: "A shared net namespace means a shared IP, interfaces and loopback. pid sharing is optional; mnt stays separate.", he: "net namespace משותף אומר IP, ‏interfaces ו-loopback משותפים. שיתוף pid הוא אופציונלי; mnt נשאר נפרד." }
    },
    {
      q: { en: "A container appends 10 MB to a 3 GB file that came from the image. What happens on overlayfs?", he: "קונטיינר מוסיף 10 MB לקובץ של 3 GB שהגיע מה-image. מה קורה ב-overlayfs?" },
      options: [
        { en: "Only 10 MB is written to the upper layer", he: "רק 10 MB נכתבים לשכבה העליונה" },
        { en: "The image layer is modified in place", he: "שכבת ה-image משתנה במקום" },
        { en: "The whole 3 GB file is copied up to the writable layer, then modified", he: "כל הקובץ של 3 GB מועתק לשכבה הכתיבה, ואז משתנה" },
        { en: "The write fails, image files are read-only", he: "הכתיבה נכשלת, קבצי image הם לקריאה בלבד" }
      ],
      answer: 2,
      explain: { en: "Copy-up works at file granularity. That's why write-heavy data belongs in volumes.", he: "Copy-up עובד ברמת קובץ שלם. בגלל זה דאטה עם הרבה כתיבות שייך ל-volumes." }
    }
  ],
  playground: "resources",
  related: ["cpu", "memory", "processes-linux", "container-security", "k8s-resources", "k8s-pods"]
});

/* ============================== SECURITY ============================== */
INFRA.lessons.push({
  id: "container-security",
  track: "containers",
  order: 6,
  icon: "🛡️",
  level: 2,
  minutes: 10,
  title: { en: "Container security: images, users & secrets", he: "אבטחת קונטיינרים: images, ‏users ו-secrets" },
  tldr: {
    en: "Pin images by digest, scan them, ship minimal bases, run as non-root on a read-only filesystem with dropped capabilities, and keep secrets out of images — every layer is readable by anyone who can pull it.",
    he: "נועצים images לפי digest, סורקים אותם, שולחים base מינימלי, מריצים כ-non-root על filesystem לקריאה בלבד עם capabilities מוסרות, ומחזיקים secrets מחוץ ל-images — כל שכבה קריאה לכל מי שיכול לעשות pull."
  },
  analogy: {
    en: "An image is a sealed package you'll install in your house. A tag is the label on the box ('v1.4') — anyone with a marker can relabel a different box. A digest is the box's DNA test. Scanning is the X-ray at the airport. Running as root is handing the delivery guy your master key. A read-only filesystem is gluing the furniture to the floor so nobody can rearrange it. And a secret in an image is taping your house key to the outside of the package.",
    he: "Image זו חבילה סגורה שאתה עומד להתקין בבית. Tag זו התווית על הקופסה ('v1.4') — כל מי שיש לו טוש יכול להדביק אותה על קופסה אחרת. Digest זו בדיקת DNA של הקופסה. סריקה זה מכונת השיקוף בשדה התעופה. להריץ כ-root זה לתת לשליח את המפתח הראשי של הבית. filesystem לקריאה בלבד זה להדביק את הרהיטים לרצפה כדי שאף אחד לא יזיז אותם. ו-secret בתוך image זה להדביק את מפתח הבית מבחוץ על החבילה."
  },
  sections: [
    {
      h: { en: "Registries, tags vs digests", he: "Registries, ‏tags מול digests" },
      body: {
        en: `<p>A <strong>registry</strong> stores images: Docker Hub, GitHub Container Registry (ghcr.io), AWS ECR, Google Artifact Registry, Azure ACR, Harbor. Use a private registry for your images, and consider pull-through caches for public ones (Docker Hub rate-limits anonymous pulls).</p>
<p>A <strong>tag</strong> (<code>nginx:1.27</code>, <code>api:latest</code>) is a <strong>mutable pointer</strong>: the publisher can move it to a different image tomorrow. A <strong>digest</strong> (<code>nginx@sha256:4c0f...</code>) is the SHA-256 of the image manifest — <strong>immutable</strong>, content-addressed. Same digest = byte-for-byte same image.</p>
<pre>$ docker pull nginx:1.27
Digest: sha256:4c0fdaa8b6341bfdeca5f18f7837462c80cff90527ee35ef185571e1c327beac
# pin in production manifests:
image: nginx:1.27@sha256:4c0fdaa8b6341bfd...   # tag for humans, digest for machines</pre>
<p>In CI, tag your own images with something unique and traceable — the git SHA (<code>api:3f9a2c1</code>) — never deploy <code>latest</code>. Enable <strong>tag immutability</strong> in ECR/ACR so a tag can't be overwritten.</p>
<blockquote>⚠️ Production tip: "latest" in Kubernetes also defaults <code>imagePullPolicy: Always</code> and makes rollbacks meaningless — you can't roll back to a tag that now points to the broken image.</blockquote>`,
        he: `<p><strong>Registry</strong> מאחסן images: ‏Docker Hub, ‏GitHub Container Registry ‏(ghcr.io), ‏AWS ECR, ‏Google Artifact Registry, ‏Azure ACR, ‏Harbor. משתמשים ב-registry פרטי ל-images שלך, ושוקלים pull-through cache לציבוריים (Docker Hub מגביל קצב pulls אנונימיים).</p>
<p><strong>Tag</strong> ‏(<code>nginx:1.27</code>, ‏<code>api:latest</code>) הוא <strong>מצביע שאפשר להזיז</strong>: המפרסם יכול להעביר אותו מחר ל-image אחר. <strong>Digest</strong> ‏(<code>nginx@sha256:4c0f...</code>) הוא ה-SHA-256 של ה-manifest של ה-image — <strong>בלתי משתנה</strong>, מזוהה לפי התוכן. אותו digest = אותו image עד הבייט.</p>
<pre>$ docker pull nginx:1.27
Digest: sha256:4c0fdaa8b6341bfdeca5f18f7837462c80cff90527ee35ef185571e1c327beac
# pin in production manifests:
image: nginx:1.27@sha256:4c0fdaa8b6341bfd...   # tag for humans, digest for machines</pre>
<p>ב-CI, מתייגים images שלך במשהו ייחודי שאפשר לעקוב אחריו — ה-git SHA ‏(<code>api:3f9a2c1</code>) — ואף פעם לא עושים deploy ל-<code>latest</code>. מפעילים <strong>tag immutability</strong> ב-ECR/ACR כדי שאי אפשר יהיה לדרוס tag.</p>
<blockquote>⚠️ טיפ לפרודקשן: "latest" ב-Kubernetes גם מגדיר כברירת מחדל <code>imagePullPolicy: Always</code> והופך rollbacks לחסרי משמעות — אי אפשר לחזור ל-tag שעכשיו מצביע על ה-image השבור.</blockquote>`
      }
    },
    {
      h: { en: "Scanning and minimal images", he: "סריקה ו-images מינימליים" },
      body: {
        en: `<p>Every package in your image is potential vulnerable code. <strong>Image scanners</strong> (Trivy, Grype, Docker Scout, Snyk, ECR/ACR built-in scanning) compare installed OS packages and language dependencies against CVE databases:</p>
<pre>$ trivy image --severity HIGH,CRITICAL myorg/api:3f9a2c1
myorg/api:3f9a2c1 (debian 12.7)
Total: 3 (HIGH: 2, CRITICAL: 1)
| openssl | CVE-2024-XXXX | CRITICAL | 3.0.14-1 | 3.0.15-1 |</pre>
<p>Run scans in CI and fail the build on fixable CRITICALs; rescan regularly, because new CVEs appear for old images. Generate an <strong>SBOM</strong> (<code>syft</code>, <code>docker buildx --sbom</code>) so you can answer "are we affected by the next log4shell?" in minutes.</p>
<p>The best fix is fewer packages. A <code>node:20</code> full image may report hundreds of CVEs; <code>node:20-slim</code> a few dozen; a <strong>distroless</strong> image (no shell, no package manager, no coreutils) a handful. Fewer tools also means an attacker who gets code execution has no <code>curl</code>, <code>sh</code> or <code>apt</code> to work with.</p>
<blockquote>💡 Real world: Chainguard and Google distroless images, plus rebuilding weekly from patched bases, will cut your scanner noise by an order of magnitude.</blockquote>`,
        he: `<p>כל חבילה ב-image היא קוד פגיע פוטנציאלי. <strong>סורקי images</strong> ‏(Trivy, ‏Grype, ‏Docker Scout, ‏Snyk, הסריקה המובנית של ECR/ACR) משווים את חבילות מערכת ההפעלה והתלויות של השפה מול מאגרי CVE:</p>
<pre>$ trivy image --severity HIGH,CRITICAL myorg/api:3f9a2c1
myorg/api:3f9a2c1 (debian 12.7)
Total: 3 (HIGH: 2, CRITICAL: 1)
| openssl | CVE-2024-XXXX | CRITICAL | 3.0.14-1 | 3.0.15-1 |</pre>
<p>מריצים סריקות ב-CI ומכשילים את ה-build על CRITICAL שיש לו תיקון; סורקים שוב באופן קבוע, כי CVEs חדשים מתגלים ל-images ישנים. מייצרים <strong>SBOM</strong> ‏(<code>syft</code>, ‏<code>docker buildx --sbom</code>) כדי לענות על "אנחנו מושפעים מה-log4shell הבא?" תוך דקות.</p>
<p>התיקון הכי טוב הוא פחות חבילות. image מלא של <code>node:20</code> יכול להראות מאות CVEs; ‏<code>node:20-slim</code> כמה עשרות; image ‏<strong>distroless</strong> (בלי shell, בלי מנהל חבילות, בלי coreutils) קומץ. פחות כלים גם אומר שתוקף שהשיג הרצת קוד לא מוצא <code>curl</code>, ‏<code>sh</code> או <code>apt</code> לעבוד איתם.</p>
<blockquote>💡 מהשטח: images של Chainguard ו-distroless של Google, יחד עם build מחדש כל שבוע מ-base מעודכן, יורידו את הרעש מהסורק בסדר גודל.</blockquote>`
      }
    },
    {
      h: { en: "Non-root, read-only, least privilege", he: "Non-root, ‏read-only, הרשאות מינימליות" },
      body: {
        en: `<p>By default a container runs as <strong>root (UID 0)</strong> — the same UID 0 as the host kernel sees, just fenced by namespaces and capabilities. A container escape as root is game over; as UID 10001 it's a much smaller problem. Fix it in the image <em>and</em> enforce it at runtime:</p>
<pre># Dockerfile
RUN useradd --uid 10001 --no-create-home app
USER 10001

# Kubernetes Pod spec
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault</pre>
<p><strong>Read-only root filesystem</strong> stops attackers from dropping binaries or modifying your code; mount an <code>emptyDir</code>/<code>--tmpfs /tmp</code> for scratch space. <strong>Drop all capabilities</strong> (Linux splits root's powers into ~40 capabilities like NET_ADMIN, SYS_ADMIN); add back only what's needed, e.g. <code>NET_BIND_SERVICE</code> to bind port 80 — or just listen on 8080.</p>
<blockquote>⚠️ Production tip: <code>--privileged</code> and mounting <code>/var/run/docker.sock</code> into a container each equal <strong>root on the host</strong>. Treat them like handing out SSH root keys.</blockquote>`,
        he: `<p>כברירת מחדל קונטיינר רץ כ-<strong>root ‏(UID 0)</strong> — אותו UID 0 שה-kernel של ה-host רואה, רק מגודר ע"י namespaces ו-capabilities. בריחה מקונטיינר כ-root זה game over; כ-UID 10001 זו בעיה הרבה יותר קטנה. מתקנים ב-image <em>וגם</em> אוכפים בזמן ריצה:</p>
<pre># Dockerfile
RUN useradd --uid 10001 --no-create-home app
USER 10001

# Kubernetes Pod spec
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault</pre>
<p><strong>Root filesystem לקריאה בלבד</strong> מונע מתוקפים להוריד binaries או לשנות את הקוד שלך; עושים mount ל-<code>emptyDir</code>/<code>--tmpfs /tmp</code> בשביל מקום עבודה זמני. <strong>מורידים את כל ה-capabilities</strong> ‏(Linux מפצל את הכוחות של root לכ-40 capabilities כמו NET_ADMIN, ‏SYS_ADMIN); מחזירים רק את מה שצריך, למשל <code>NET_BIND_SERVICE</code> כדי להאזין לפורט 80 — או פשוט מאזינים ל-8080.</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>--privileged</code> ו-mount של <code>/var/run/docker.sock</code> לתוך קונטיינר — כל אחד מהם שווה <strong>root על ה-host</strong>. תתייחס אליהם כמו לחלוקת מפתחות SSH של root.</blockquote>`
      }
    },
    {
      h: { en: "Secrets never go in images", he: "Secrets אף פעם לא נכנסים ל-images" },
      body: {
        en: `<p>Anyone who can pull an image can read <strong>every layer</strong> of it: <code>docker history --no-trunc</code> shows <code>ENV</code> and <code>ARG</code> values, and <code>docker save</code> + untar exposes every file — including one you "deleted" in a later layer. So:</p>
<ul><li>No <code>COPY .env</code>, no <code>ENV API_KEY=...</code>, no <code>ARG NPM_TOKEN</code> used in a regular RUN.</li>
<li>Build-time secrets (private npm/pip registries): BuildKit secret mounts — <code>RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci</code> with <code>docker build --secret id=npmrc,src=$HOME/.npmrc .</code>. The secret is available only during that RUN and never written to a layer.</li>
<li>Runtime secrets: inject via env vars or mounted files from Kubernetes Secrets, ideally synced from a real secret manager (Vault, AWS Secrets Manager, Azure Key Vault) with External Secrets or a CSI driver. Prefer files over env vars — env vars leak into crash dumps, <code>/proc/PID/environ</code> and debug endpoints.</li></ul>
<p>Also sign what you ship (<strong>cosign</strong>/Sigstore) and have the cluster admit only signed images from your registry — so a stolen registry credential can't sneak in a malicious image.</p>
<blockquote>💡 Real world: secret scanners regularly find live AWS keys in public Docker Hub images. Assume any image may one day become public, and build accordingly.</blockquote>`,
        he: `<p>כל מי שיכול לעשות pull ל-image יכול לקרוא <strong>כל שכבה</strong> שלו: <code>docker history --no-trunc</code> מראה ערכי <code>ENV</code> ו-<code>ARG</code>, ו-<code>docker save</code> + פתיחת ה-tar חושפים כל קובץ — כולל קובץ ש"מחקת" בשכבה מאוחרת. לכן:</p>
<ul><li>בלי <code>COPY .env</code>, בלי <code>ENV API_KEY=...</code>, בלי <code>ARG NPM_TOKEN</code> שמשמש ב-RUN רגיל.</li>
<li>Secrets של זמן build ‏(registries פרטיים של npm/pip): ‏secret mounts של BuildKit — ‏<code>RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci</code> עם <code>docker build --secret id=npmrc,src=$HOME/.npmrc .</code>. ה-secret זמין רק בזמן ה-RUN הזה ואף פעם לא נכתב לשכבה.</li>
<li>Secrets של זמן ריצה: מזריקים דרך משתני סביבה או קבצים ממופים מ-Kubernetes Secrets, ועדיף שיסונכרנו מ-secret manager אמיתי (Vault, ‏AWS Secrets Manager, ‏Azure Key Vault) עם External Secrets או CSI driver. עדיף קבצים על פני משתני סביבה — משתני סביבה דולפים ל-crash dumps, ל-<code>/proc/PID/environ</code> ול-debug endpoints.</li></ul>
<p>וגם חותמים על מה ששולחים (<strong>cosign</strong>/Sigstore) ומגדירים שה-cluster יקבל רק images חתומים מה-registry שלך — כך ש-credential גנוב ל-registry לא יאפשר להשחיל image זדוני.</p>
<blockquote>💡 מהשטח: סורקי secrets מוצאים באופן קבוע מפתחות AWS פעילים ב-images ציבוריים ב-Docker Hub. תניח שכל image עלול יום אחד להיות ציבורי, ותבנה בהתאם.</blockquote>`
      }
    }
  ],
  diagram: `  build -----------> scan ---------> sign -----------> registry ---------> admit ----------> run
  multi-stage        trivy/grype     cosign             private,           policy:            non-root, ro rootfs,
  minimal base       SBOM            digest             tag-immutable      signed + digest    drop ALL caps, seccomp,
  no secrets in      fail on CRIT                                                             secrets from vault
  layers`,
  handsOn: [
    { cmd: "docker buildx imagetools inspect nginx:1.27", what: { en: "See the digest(s) behind a tag (one per architecture).", he: "לראות את ה-digest(s) שמאחורי tag (אחד לכל ארכיטקטורה)." } },
    { cmd: "docker run --rm aquasec/trivy:latest image --severity HIGH,CRITICAL python:3.12", what: { en: "Scan a public image for high and critical CVEs; then compare with python:3.12-slim.", he: "לסרוק image ציבורי ל-CVEs ברמת HIGH ו-CRITICAL; ואז להשוות ל-python:3.12-slim." } },
    { cmd: "docker run --rm --user 10001 --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges alpine sh -c 'id; touch /x || echo read-only works'", what: { en: "Run a hardened container: non-root, read-only rootfs, no capabilities.", he: "להריץ קונטיינר מוקשח: non-root, ‏rootfs לקריאה בלבד, בלי capabilities." } },
    { cmd: "docker history --no-trunc myorg/api:dev | grep -i -E 'key|token|secret|password'", what: { en: "Hunt for secrets leaked into image metadata/layers.", he: "לחפש secrets שדלפו ל-metadata או לשכבות של ה-image." } }
  ],
  mnemonic: {
    en: "\"PIN, SCAN, SHRINK, DROP, HIDE\": pin by digest, scan in CI, shrink the base, drop root & capabilities, hide secrets outside the image.",
    he: "\"נעץ, סרוק, כווץ, הורד, הסתר\": נועצים digest, סורקים ב-CI, מכווצים את ה-base, מורידים root ו-capabilities, מסתירים secrets מחוץ ל-image."
  },
  pitfalls: [
    { en: "Deploying ':latest' — not reproducible, rollbacks break, and you can't tell what's actually running.", he: "לעשות deploy ל-':latest' — לא ניתן לשחזור, rollbacks נשברים, ואי אפשר לדעת מה באמת רץ." },
    { en: "ENV or ARG with secrets in the Dockerfile — visible to anyone with docker history.", he: "ENV או ARG עם secrets ב-Dockerfile — גלוי לכל מי שמריץ docker history." },
    { en: "Running as root 'because the app needs to write files'. Make the needed paths writable for a non-root UID or mount a volume/tmpfs.", he: "לרוץ כ-root 'כי האפליקציה צריכה לכתוב קבצים'. נותנים הרשאות כתיבה לנתיבים הנדרשים ל-UID שאינו root או עושים mount ל-volume/tmpfs." },
    { en: "Mounting docker.sock into CI or monitoring containers — that's full root on the host if the container is compromised.", he: "לעשות mount ל-docker.sock בקונטיינרים של CI או ניטור — זה root מלא על ה-host אם הקונטיינר נפרץ." }
  ],
  interview: [
    {
      q: { en: "Tag vs digest — which do you deploy and why?", he: "Tag או digest — מה פורסים ולמה?" },
      a: { en: "A tag is a mutable pointer, a digest is the immutable content hash. For production, deploy by digest (or an immutable, unique tag like the git SHA with registry tag immutability) so what you tested is exactly what runs, rollbacks are deterministic, and nobody can swap the image under the same name.", he: "Tag הוא מצביע שאפשר להזיז, digest הוא hash בלתי משתנה של התוכן. בפרודקשן פורסים לפי digest (או tag ייחודי ובלתי משתנה כמו ה-git SHA, עם tag immutability ב-registry) — כדי שמה שנבדק הוא בדיוק מה שרץ, rollbacks יהיו דטרמיניסטיים, ואף אחד לא יוכל להחליף את ה-image תחת אותו שם." }
    },
    {
      q: { en: "How would you harden a container running in Kubernetes?", he: "איך תקשיח קונטיינר שרץ ב-Kubernetes?" },
      a: { en: "Minimal/distroless base, scanned in CI, signed and pulled by digest. securityContext: runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation false, drop ALL capabilities, seccomp RuntimeDefault. Resource limits. Secrets mounted from a secret manager, not baked in. NetworkPolicies to restrict traffic, and admission policies (Pod Security Standards 'restricted', Kyverno/Gatekeeper) to enforce it all.", he: "Base מינימלי/distroless, סרוק ב-CI, חתום ונמשך לפי digest. ‏securityContext: ‏runAsNonRoot, ‏readOnlyRootFilesystem, ‏allowPrivilegeEscalation false, הורדת כל ה-capabilities, ‏seccomp RuntimeDefault. ‏Resource limits. ‏Secrets שממופים מ-secret manager, לא אפויים פנימה. ‏NetworkPolicies להגבלת traffic, ו-admission policies ‏(Pod Security Standards ברמת restricted, ‏Kyverno/Gatekeeper) כדי לאכוף את כל זה." }
    }
  ],
  quiz: [
    {
      q: { en: "A Dockerfile has 'COPY .env .' then 'RUN rm .env'. Is the secret safe?", he: "ב-Dockerfile יש 'COPY .env .' ואחריו 'RUN rm .env'. ה-secret בטוח?" },
      options: [
        { en: "Yes, the file is deleted before the image is finished", he: "כן, הקובץ נמחק לפני שה-image מסתיים" },
        { en: "Yes, if the image is pushed to a private registry", he: "כן, אם ה-image נדחף ל-registry פרטי" },
        { en: "Only if you build with --no-cache", he: "רק אם בונים עם ‎--no-cache" },
        { en: "No — the COPY layer still contains .env and can be extracted", he: "לא — שכבת ה-COPY עדיין מכילה את .env ואפשר לחלץ אותו" }
      ],
      answer: 3,
      explain: { en: "Layers are immutable; the delete only hides it in a later layer. Use BuildKit secret mounts or runtime injection.", he: "שכבות לא משתנות; המחיקה רק מסתירה את הקובץ בשכבה מאוחרת. משתמשים ב-secret mounts של BuildKit או בהזרקה בזמן ריצה." }
    },
    {
      q: { en: "What does pinning 'image: api@sha256:...' guarantee?", he: "מה נעיצת 'image: api@sha256:...' מבטיחה?" },
      options: [
        { en: "The image has no vulnerabilities", he: "שאין ב-image חולשות" },
        { en: "Exactly the same image content every time it's pulled", he: "בדיוק אותו תוכן image בכל pull" },
        { en: "The image is signed by the publisher", he: "שה-image חתום ע\"י המפרסם" },
        { en: "The image runs as non-root", he: "שה-image רץ כ-non-root" }
      ],
      answer: 1,
      explain: { en: "A digest is a content hash: immutability, not safety. Signing, scanning and runtime settings are separate controls.", he: "Digest הוא hash של התוכן: אי-שינוי, לא בטיחות. חתימה, סריקה והגדרות runtime הם בקרות נפרדות." }
    },
    {
      q: { en: "Which runtime setting is effectively equivalent to giving the container root on the host?", he: "איזו הגדרת runtime שווה בפועל לתת לקונטיינר root על ה-host?" },
      options: [
        { en: "Mounting /var/run/docker.sock into it", he: "לעשות לו mount ל-‎/var/run/docker.sock" },
        { en: "--read-only", he: "‏--read-only" },
        { en: "--cap-drop ALL", he: "‏--cap-drop ALL" },
        { en: "--memory 512m", he: "‏--memory 512m" }
      ],
      answer: 0,
      explain: { en: "With the Docker socket, the container can start a new privileged container that mounts the host's / — full takeover. The others reduce privilege.", he: "עם ה-socket של Docker, הקונטיינר יכול להרים קונטיינר privileged חדש שעושה mount ל-/ של ה-host — השתלטות מלאה. האחרים מורידים הרשאות." }
    }
  ],
  related: ["docker-images", "container-internals", "vms", "k8s-pods"]
});

/* ============================== GLOSSARY ============================== */
[
  { term: "Container", def: { en: "An isolated Linux process (namespaces + cgroups + overlay root fs) running from an image.", he: "תהליך Linux מבודד (namespaces + ‏cgroups + ‏root fs ב-overlay) שרץ מתוך image." }, lesson: "docker-why" },
  { term: "Image", def: { en: "Read-only, layered filesystem plus metadata used as the template for containers.", he: "Filesystem בשכבות לקריאה בלבד ועוד metadata, שמשמש כתבנית לקונטיינרים." }, lesson: "docker-why" },
  { term: "OCI", def: { en: "Open Container Initiative: standard image and runtime specs, so images run on Docker, containerd, Podman, CRI-O.", he: "Open Container Initiative: תקנים ל-image ול-runtime, כך ש-images רצים על Docker, ‏containerd, ‏Podman, ‏CRI-O." }, lesson: "docker-why" },
  { term: "containerd", def: { en: "Container runtime daemon that manages images and container lifecycle; used directly by Kubernetes via CRI.", he: "Daemon של container runtime שמנהל images ומחזור חיים של קונטיינרים; ‏Kubernetes משתמש בו ישירות דרך CRI." }, lesson: "docker-why" },
  { term: "Dockerfile", def: { en: "Text recipe of instructions (FROM, RUN, COPY, CMD...) to build an image.", he: "מתכון טקסטואלי של הוראות (FROM, ‏RUN, ‏COPY, ‏CMD...) לבניית image." }, lesson: "docker-images" },
  { term: "Layer", def: { en: "A cached, immutable filesystem diff produced by a Dockerfile instruction.", he: "הפרש filesystem בלתי משתנה עם cache, שנוצר ע\"י הוראה ב-Dockerfile." }, lesson: "docker-images" },
  { term: "Multi-stage build", def: { en: "Dockerfile with several FROM stages; only artifacts are copied into the slim final image.", he: "Dockerfile עם כמה שלבי FROM; רק התוצרים מועתקים ל-image הסופי הרזה." }, lesson: "docker-images" },
  { term: ".dockerignore", def: { en: "List of paths excluded from the build context (node_modules, .git, .env).", he: "רשימת נתיבים שלא נשלחים ל-build context ‏(node_modules, ‏.git, ‏.env)." }, lesson: "docker-images" },
  { term: "Distroless", def: { en: "Minimal base images with only the runtime and app, no shell or package manager.", he: "Base images מינימליים עם runtime ואפליקציה בלבד, בלי shell ובלי מנהל חבילות." }, lesson: "docker-images" },
  { term: "Port mapping", def: { en: "-p HOST:CONTAINER forwards a host port into a container's network namespace.", he: "‎-p HOST:CONTAINER מעביר פורט מה-host לתוך ה-network namespace של הקונטיינר." }, lesson: "docker-run" },
  { term: "Volume", def: { en: "Docker-managed persistent storage that survives container removal.", he: "אחסון קבוע ש-Docker מנהל ושורד מחיקה של הקונטיינר." }, lesson: "docker-run" },
  { term: "Bind mount", def: { en: "Mounting a specific host path into a container; common for dev and config files.", he: "Mount של נתיב ספציפי ב-host לתוך קונטיינר; נפוץ לפיתוח ולקבצי config." }, lesson: "docker-run" },
  { term: "Docker Compose", def: { en: "Tool to define and run multi-container apps on one host from a YAML file.", he: "כלי להגדרה ולהרצה של אפליקציות מרובות קונטיינרים על host אחד מקובץ YAML." }, lesson: "docker-compose" },
  { term: "Healthcheck", def: { en: "Command run periodically to decide whether a container is healthy/ready.", he: "פקודה שרצה מחזורית כדי לקבוע אם קונטיינר בריא/מוכן." }, lesson: "docker-compose" },
  { term: "Namespace", def: { en: "Kernel feature isolating what a process sees: pid, net, mnt, uts, ipc, user, cgroup.", he: "פיצ'ר של ה-kernel שמבודד מה תהליך רואה: pid, ‏net, ‏mnt, ‏uts, ‏ipc, ‏user, ‏cgroup." }, lesson: "container-internals" },
  { term: "cgroup", def: { en: "Kernel control group limiting and accounting CPU, memory, PIDs and IO for processes.", he: "Control group של ה-kernel שמגביל ומודד CPU, זיכרון, PIDs ו-IO לתהליכים." }, lesson: "container-internals" },
  { term: "OverlayFS", def: { en: "Union filesystem stacking read-only image layers under a writable container layer (copy-on-write).", he: "Union filesystem שמערים שכבות image לקריאה בלבד מתחת לשכבת כתיבה של הקונטיינר (copy-on-write)." }, lesson: "container-internals" },
  { term: "Image digest", def: { en: "Immutable sha256 content hash identifying an exact image (name@sha256:...).", he: "Hash ‏sha256 בלתי משתנה של התוכן שמזהה image מדויק (name@sha256:...)." }, lesson: "container-security" },
  { term: "Registry", def: { en: "Server storing and distributing images (Docker Hub, ECR, GHCR, ACR, Harbor).", he: "שרת שמאחסן ומפיץ images ‏(Docker Hub, ‏ECR, ‏GHCR, ‏ACR, ‏Harbor)." }, lesson: "container-security" },
  { term: "Linux capabilities", def: { en: "Root's powers split into units (NET_ADMIN, SYS_ADMIN...); drop ALL and add back only what's needed.", he: "הכוחות של root מפוצלים ליחידות (NET_ADMIN, ‏SYS_ADMIN...); מורידים הכל ומחזירים רק מה שצריך." }, lesson: "container-security" }
].forEach(g => INFRA.glossary.push(Object.assign({ track: "containers" }, g)));
