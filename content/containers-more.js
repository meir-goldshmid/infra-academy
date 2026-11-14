// Track: containers — deeper: runtimes & OCI, registries, BuildKit builds, slim/hardened images
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding so the file also runs in non-browser sandboxes (tools/validate.js)

/* ============================== RUNTIMES & OCI ============================== */
INFRA.lessons.push({
  id: "container-runtimes-oci",
  track: "containers",
  order: 20,
  icon: "⚙️",
  level: 3,
  minutes: 12,
  title: { en: "Container runtimes & OCI: what actually runs your container", he: "Container runtimes ו-OCI: מה באמת מריץ את הקונטיינר שלך" },
  tldr: {
    en: "OCI defines three specs (image, runtime, distribution); Kubernetes talks CRI to a high-level runtime (containerd or CRI-O), which unpacks content-addressed layers and asks a low-level runtime (runc, crun, or a sandbox like gVisor/Kata) to create the process.",
    he: "OCI מגדיר שלושה תקנים (image, ‏runtime, ‏distribution); ‏Kubernetes מדבר CRI עם runtime ברמה גבוהה (containerd או CRI-O), שפורס שכבות שמזוהות לפי hash ומבקש מ-runtime נמוך (runc, ‏crun, או sandbox כמו gVisor/Kata) ליצור את התהליך."
  },
  analogy: {
    en: "Think of a restaurant. The OCI image spec is the standard recipe card format, the distribution spec is how the supplier delivers ingredients, and the runtime spec is the standard kitchen station. The kubelet is the head waiter taking orders (CRI), containerd/CRI-O is the kitchen manager who fetches ingredients and preps stations, and runc is the cook who actually fires the pan — then leaves. A sandboxed runtime is the same cook working inside a fireproof glass booth.",
    he: "תחשוב על מסעדה. ה-image spec של OCI הוא פורמט כרטיס מתכון סטנדרטי, ה-distribution spec הוא איך הספק מביא את חומרי הגלם, וה-runtime spec הוא עמדת מטבח סטנדרטית. ה-kubelet הוא המלצר הראשי שמקבל הזמנות (CRI), ‏containerd או CRI-O הוא מנהל המטבח שמביא חומרי גלם ומכין עמדות, ו-runc הוא הטבח שבאמת מדליק את המחבת — ואז הולך. runtime עם sandbox זה אותו טבח, רק שהוא עובד בתוך תא זכוכית חסין אש."
  },
  sections: [
    {
      h: { en: "The three OCI specs and content addressing", he: "שלושת התקנים של OCI ו-content addressing" },
      body: {
        en: `<p>The Open Container Initiative publishes three specs, and every tool in the ecosystem speaks them:</p>
<ul><li><strong>image-spec</strong> — what an image <em>is</em>: a <strong>manifest</strong> (JSON) pointing to a <strong>config</strong> blob (entrypoint, env, user, architecture) and an ordered list of <strong>layer</strong> blobs (tar archives, gzip or zstd compressed). Multi-arch images add an <strong>image index</strong> that points to one manifest per platform.</li>
<li><strong>runtime-spec</strong> — how to run an unpacked filesystem bundle: a <code>config.json</code> describing namespaces, cgroups, mounts, capabilities, seccomp, and the process to exec.</li>
<li><strong>distribution-spec</strong> — the HTTP API registries expose: <code>GET /v2/&lt;name&gt;/manifests/&lt;ref&gt;</code>, <code>GET /v2/&lt;name&gt;/blobs/&lt;digest&gt;</code>, chunked uploads.</li></ul>
<p>Everything is <strong>content-addressable</strong>: each blob is stored and fetched by its <code>sha256</code>. The manifest lists layer digests, so the manifest's own digest pins the whole image. Two images sharing a base layer share the exact same blob — pulled once, stored once on the node.</p>
<pre>$ crane manifest nginx:1.27 --platform linux/amd64 | jq '.layers[0], .config'
{ "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
  "digest": "sha256:a2318d6c47ec...", "size": 28232473 }
{ "mediaType": "application/vnd.oci.image.config.v1+json",
  "digest": "sha256:3b25b682ea82...", "size": 8591 }</pre>
<blockquote>💡 Real world: a layer has two hashes — the <em>digest</em> of the compressed blob (what the registry stores) and the <em>diffID</em> of the uncompressed tar (what goes in the config). That's why re-compressing the same layer with zstd gives a new digest but the same filesystem.</blockquote>`,
        he: `<p>ה-Open Container Initiative מפרסם שלושה תקנים, וכל כלי באקוסיסטם מדבר אותם:</p>
<ul><li><strong>image-spec</strong> — מה זה image: ‏<strong>manifest</strong> ‏(JSON) שמצביע על blob של <strong>config</strong> ‏(entrypoint, ‏env, ‏user, ארכיטקטורה) ועל רשימה מסודרת של blobs של <strong>layers</strong> ‏(קבצי tar, דחוסים ב-gzip או zstd). ‏images מרובי ארכיטקטורות מוסיפים <strong>image index</strong> שמצביע על manifest אחד לכל פלטפורמה.</li>
<li><strong>runtime-spec</strong> — איך מריצים bundle של filesystem פרוס: קובץ <code>config.json</code> שמתאר namespaces, ‏cgroups, ‏mounts, ‏capabilities, ‏seccomp ואת התהליך שעושים לו exec.</li>
<li><strong>distribution-spec</strong> — ה-API ב-HTTP ש-registries חושפים: <code>GET /v2/&lt;name&gt;/manifests/&lt;ref&gt;</code>, ‏<code>GET /v2/&lt;name&gt;/blobs/&lt;digest&gt;</code>, ‏uploads בחלקים.</li></ul>
<p>הכל <strong>content-addressable</strong>: כל blob נשמר ונשלף לפי ה-<code>sha256</code> שלו. ה-manifest מפרט את ה-digests של השכבות, אז ה-digest של ה-manifest עצמו נועל את כל ה-image. שני images שחולקים שכבת base חולקים בדיוק את אותו blob — נמשך פעם אחת ונשמר פעם אחת על ה-node.</p>
<pre>$ crane manifest nginx:1.27 --platform linux/amd64 | jq '.layers[0], .config'
{ "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
  "digest": "sha256:a2318d6c47ec...", "size": 28232473 }
{ "mediaType": "application/vnd.oci.image.config.v1+json",
  "digest": "sha256:3b25b682ea82...", "size": 8591 }</pre>
<blockquote>💡 מהשטח: לשכבה יש שני hash-ים — ה-<em>digest</em> של ה-blob הדחוס (מה שה-registry שומר) וה-<em>diffID</em> של ה-tar הלא דחוס (מה שנכנס ל-config). בגלל זה דחיסה מחדש של אותה שכבה ב-zstd נותנת digest חדש אבל אותו filesystem.</blockquote>`
      }
    },
    {
      h: { en: "High-level vs low-level runtimes", he: "Runtime ברמה גבוהה מול runtime ברמה נמוכה" },
      body: {
        en: `<p>"Container runtime" means two different layers:</p>
<table><tr><th>Layer</th><th>Examples</th><th>Job</th></tr>
<tr><td>High-level (CRI runtime)</td><td>containerd, CRI-O, (dockerd on top of containerd)</td><td>Pull &amp; verify images, unpack layers into snapshots (overlayfs), manage container lifecycle, networking hooks (CNI), logs, exec/attach</td></tr>
<tr><td>Low-level (OCI runtime)</td><td>runc (Go), crun (C), youki (Rust), runsc (gVisor), kata-runtime</td><td>Take an OCI bundle, create namespaces/cgroups, apply seccomp, exec the process — then exit</td></tr></table>
<p>The chain on a containerd node: <code>kubelet → (CRI gRPC) → containerd → containerd-shim-runc-v2 → runc → your process</code>. runc exits after start; the <strong>shim</strong> stays as the parent, holding stdio and reporting the exit code — that's why you can restart containerd without killing running containers.</p>
<p><strong>dockerd</strong> is not a CRI runtime; it is a developer-facing daemon (build, compose, volumes, networks) that itself uses containerd. <strong>CRI-O</strong> is a minimal CRI-only runtime used by OpenShift; it does nothing Kubernetes doesn't need. <strong>crun</strong> is a drop-in runc replacement in C with lower memory and faster start (default on Fedora/RHEL Podman).</p>
<pre>$ ps -ef --forest | grep -A2 containerd-shim
root  4121     1  containerd-shim-runc-v2 -namespace k8s.io -id 7f3a...
65532 4150  4121   \\_ /pause
65532 4402  4121   \\_ /app/server --port 8080</pre>`,
        he: `<p>"Container runtime" זה בעצם שתי שכבות שונות:</p>
<table><tr><th>שכבה</th><th>דוגמאות</th><th>תפקיד</th></tr>
<tr><td>רמה גבוהה (CRI runtime)</td><td>containerd, ‏CRI-O, ‏(dockerd מעל containerd)</td><td>pull ואימות של images, פריסת שכבות ל-snapshots ‏(overlayfs), ניהול מחזור חיים של קונטיינר, hooks לרשת (CNI), לוגים, exec/attach</td></tr>
<tr><td>רמה נמוכה (OCI runtime)</td><td>runc ‏(Go), ‏crun ‏(C), ‏youki ‏(Rust), ‏runsc ‏(gVisor), ‏kata-runtime</td><td>מקבל OCI bundle, יוצר namespaces ו-cgroups, מחיל seccomp, עושה exec לתהליך — ויוצא</td></tr></table>
<p>השרשרת על node עם containerd: <code>kubelet → (CRI gRPC) → containerd → containerd-shim-runc-v2 → runc → your process</code>. ‏runc יוצא אחרי ה-start; ה-<strong>shim</strong> נשאר כאבא, מחזיק את ה-stdio ומדווח את ה-exit code — ובגלל זה אפשר לעשות restart ל-containerd בלי להרוג קונטיינרים רצים.</p>
<p><strong>dockerd</strong> הוא לא CRI runtime; הוא daemon למפתחים (build, ‏compose, ‏volumes, רשתות) שבעצמו משתמש ב-containerd. ‏<strong>CRI-O</strong> הוא runtime מינימלי שמממש רק CRI, ו-OpenShift משתמש בו; הוא לא עושה שום דבר ש-Kubernetes לא צריך. ‏<strong>crun</strong> הוא תחליף ל-runc שכתוב ב-C, עם פחות זיכרון ו-start מהיר יותר (ברירת המחדל של Podman ב-Fedora/RHEL).</p>
<pre>$ ps -ef --forest | grep -A2 containerd-shim
root  4121     1  containerd-shim-runc-v2 -namespace k8s.io -id 7f3a...
65532 4150  4121   \\_ /pause
65532 4402  4121   \\_ /app/server --port 8080</pre>`
      }
    },
    {
      h: { en: "CRI, dockershim, and the node-side CLIs", he: "CRI, ‏dockershim, וכלי ה-CLI על ה-node" },
      body: {
        en: `<p>The <strong>Container Runtime Interface</strong> (CRI) is a gRPC API (<code>RuntimeService</code> + <code>ImageService</code>) that the kubelet calls: <code>RunPodSandbox</code>, <code>CreateContainer</code>, <code>PullImage</code>... Docker never implemented CRI, so Kubernetes carried an adapter inside the kubelet — <strong>dockershim</strong>. It was deprecated in 1.20 and removed in <strong>1.24</strong> (2022) because it was an extra hop, a maintenance burden, and Docker itself already ran on containerd. Images didn't change; only nodes that depended on <code>/var/run/docker.sock</code> (DinD builds, some log/monitoring agents) broke.</p>
<p>On a node there's no <code>docker</code> anymore. Know the three CLIs:</p>
<pre># crictl: talks CRI, sees what the kubelet sees (pods + containers) — your first tool
crictl pods --name api
crictl ps -a | grep api
crictl logs --tail 50 &lt;container-id&gt;
crictl inspecti registry.example.com/api:3f9a2c1
crictl rmi --prune                      # remove unused images (disk pressure)

# ctr: containerd's raw debug client; k8s images live in the k8s.io namespace
ctr -n k8s.io images ls | head
ctr -n k8s.io content ls | wc -l

# nerdctl: docker-compatible UX on containerd (run, build, compose)
nerdctl -n k8s.io ps</pre>
<blockquote>⚠️ Production tip: <code>ctr images pull</code> into the <code>default</code> namespace is invisible to the kubelet. If you pre-load images by hand, use <code>ctr -n k8s.io images import</code> or <code>crictl pull</code>.</blockquote>`,
        he: `<p><strong>Container Runtime Interface</strong> ‏(CRI) הוא API ב-gRPC ‏(<code>RuntimeService</code> + ‏<code>ImageService</code>) שה-kubelet קורא לו: <code>RunPodSandbox</code>, ‏<code>CreateContainer</code>, ‏<code>PullImage</code>... ‏Docker אף פעם לא מימש CRI, אז Kubernetes סחב מתאם בתוך ה-kubelet — <strong>dockershim</strong>. הוא סומן deprecated בגרסה 1.20 והוסר ב-<strong>1.24</strong> ‏(2022), כי הוא היה hop מיותר, נטל תחזוקה, ו-Docker עצמו כבר רץ מעל containerd. ה-images לא השתנו; נשברו רק nodes שהסתמכו על <code>/var/run/docker.sock</code> ‏(builds של DinD, כמה agents של לוגים ומוניטורינג).</p>
<p>על ה-node כבר אין <code>docker</code>. תכיר את שלושת ה-CLIs:</p>
<pre># crictl: talks CRI, sees what the kubelet sees (pods + containers) — your first tool
crictl pods --name api
crictl ps -a | grep api
crictl logs --tail 50 &lt;container-id&gt;
crictl inspecti registry.example.com/api:3f9a2c1
crictl rmi --prune                      # remove unused images (disk pressure)

# ctr: containerd's raw debug client; k8s images live in the k8s.io namespace
ctr -n k8s.io images ls | head
ctr -n k8s.io content ls | wc -l

# nerdctl: docker-compatible UX on containerd (run, build, compose)
nerdctl -n k8s.io ps</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>ctr images pull</code> ל-namespace ‏<code>default</code> לא נראה ל-kubelet. אם אתה טוען images ידנית, תשתמש ב-<code>ctr -n k8s.io images import</code> או ב-<code>crictl pull</code>.</blockquote>`
      }
    },
    {
      h: { en: "Sandboxed runtimes: gVisor, Kata, Firecracker", he: "Runtimes עם sandbox: ‏gVisor, ‏Kata, ‏Firecracker" },
      body: {
        en: `<p>runc containers share the host kernel: one kernel bug (Dirty Pipe, a runc escape like CVE-2024-21626 "Leaky Vessels") can cross the boundary. When you run <strong>untrusted code</strong> — customer plugins, CI jobs from forks, LLM-generated code — add a stronger boundary:</p>
<table><tr><th>Runtime</th><th>How</th><th>Cost</th><th>Seen in</th></tr>
<tr><td><strong>gVisor</strong> (runsc)</td><td>A user-space kernel (the Sentry, in Go) intercepts syscalls; the app never talks to the host kernel directly</td><td>Syscall-heavy and IO-heavy work slows noticeably; some syscalls unsupported</td><td>GKE Sandbox, Cloud Run (1st gen)</td></tr>
<tr><td><strong>Kata Containers</strong></td><td>Each pod gets a lightweight VM with its own guest kernel (QEMU, Cloud Hypervisor or Firecracker as VMM)</td><td>~100+ ms extra start, tens of MB memory per pod, needs nested virt or bare metal</td><td>Confidential/multi-tenant clusters</td></tr>
<tr><td><strong>Firecracker</strong></td><td>Minimal KVM microVM monitor (Rust); boots a microVM in ~125 ms with ~5 MB overhead</td><td>A VMM, not a CRI runtime by itself (use via Kata or firecracker-containerd)</td><td>AWS Lambda, Fargate</td></tr></table>
<p>Kubernetes selects the low-level runtime per pod with a <strong>RuntimeClass</strong>; the <code>handler</code> must match a runtime configured in containerd/CRI-O on the node:</p>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc            # [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runsc]
scheduling:
  nodeSelector:
    sandbox.gke.io/runtime: gvisor   # only schedule on nodes that have it
overhead:
  podFixed: { cpu: 250m, memory: 120Mi }   # added to requests for scheduling
---
apiVersion: v1
kind: Pod
metadata: { name: untrusted-job }
spec:
  runtimeClassName: gvisor
  containers:
  - name: job
    image: registry.example.com/sandbox-runner:1.8.0</pre>
<blockquote>💡 Real world: inside gVisor, <code>dmesg</code> prints a fake boot log from gVisor's own kernel ("Starting gVisor...") — a quick way to prove the pod really is sandboxed.</blockquote>`,
        he: `<p>קונטיינרים עם runc חולקים את ה-kernel של ה-host: באג אחד ב-kernel ‏(Dirty Pipe, או בריחה דרך runc כמו CVE-2024-21626 ‏"Leaky Vessels") יכול לחצות את הגבול. כשאתה מריץ <strong>קוד לא אמין</strong> — plugins של לקוחות, ג'ובים של CI מ-forks, קוד שנוצר ע"י LLM — תוסיף גבול חזק יותר:</p>
<table><tr><th>Runtime</th><th>איך</th><th>מחיר</th><th>איפה רואים</th></tr>
<tr><td><strong>gVisor</strong> ‏(runsc)</td><td>kernel ב-user space ‏(ה-Sentry, כתוב ב-Go) מיירט syscalls; האפליקציה אף פעם לא מדברת ישירות עם ה-kernel של ה-host</td><td>עבודה כבדה ב-syscalls וב-IO מואטת בצורה מורגשת; חלק מה-syscalls לא נתמכים</td><td>GKE Sandbox, ‏Cloud Run ‏(1st gen)</td></tr>
<tr><td><strong>Kata Containers</strong></td><td>כל pod מקבל VM קל עם guest kernel משלו (QEMU, ‏Cloud Hypervisor או Firecracker בתור VMM)</td><td>בערך 100+ ms תוספת ב-start, עשרות MB זיכרון לכל pod, צריך nested virtualization או bare metal</td><td>clusters מרובי לקוחות או confidential</td></tr>
<tr><td><strong>Firecracker</strong></td><td>VMM מינימלי מעל KVM ‏(Rust); מעלה microVM בערך ב-125 ms עם overhead של בערך 5 MB</td><td>זה VMM, לא CRI runtime בפני עצמו (משתמשים בו דרך Kata או firecracker-containerd)</td><td>AWS Lambda, ‏Fargate</td></tr></table>
<p>Kubernetes בוחר את ה-runtime הנמוך לכל pod בעזרת <strong>RuntimeClass</strong>; ה-<code>handler</code> חייב להתאים ל-runtime שמוגדר ב-containerd או ב-CRI-O על ה-node:</p>
<pre>apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc            # [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runsc]
scheduling:
  nodeSelector:
    sandbox.gke.io/runtime: gvisor   # only schedule on nodes that have it
overhead:
  podFixed: { cpu: 250m, memory: 120Mi }   # added to requests for scheduling
---
apiVersion: v1
kind: Pod
metadata: { name: untrusted-job }
spec:
  runtimeClassName: gvisor
  containers:
  - name: job
    image: registry.example.com/sandbox-runner:1.8.0</pre>
<blockquote>💡 מהשטח: בתוך gVisor, הפקודה <code>dmesg</code> מדפיסה boot log מזויף מה-kernel של gVisor עצמו ("Starting gVisor...") — דרך מהירה להוכיח שה-pod באמת ב-sandbox.</blockquote>`
      }
    },
    {
      h: { en: "Pull, unpack, snapshot: what happens before your process starts", he: "Pull, פריסה, snapshot: מה קורה לפני שהתהליך שלך עולה" },
      body: {
        en: `<p>When the kubelet asks containerd to start a container from a new image:</p>
<ol><li><strong>Resolve</strong> the tag → manifest (or index → pick the manifest for the node's <code>linux/amd64</code> or <code>linux/arm64</code>).</li>
<li><strong>Fetch</strong> missing blobs by digest into the content store (<code>/var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/</code>), verifying each hash. Layers already present are skipped.</li>
<li><strong>Unpack</strong> each layer into a snapshot (overlayfs lower dirs under <code>/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/</code>).</li>
<li><strong>Create</strong> a writable upper snapshot, generate the OCI <code>config.json</code> from the pod spec, hand the bundle to the shim → runc.</li></ol>
<p>That means a node holds images <strong>twice</strong> (compressed blobs + unpacked snapshots) — a 1 GB compressed image can use 3+ GB of disk. Kubelet image GC kicks in at <code>imageGCHighThresholdPercent</code> (default 85%) and deletes unused images down to the low threshold (80%).</p>
<blockquote>⚠️ Production tip: "Pulling" taking 90 s on every scale-up is usually a 2 GB image, not the network. Fix the image (see slim images), pre-pull with a DaemonSet, or use lazy pulling (stargz/SOCI) — see the registries lesson.</blockquote>`,
        he: `<p>כשה-kubelet מבקש מ-containerd להרים קונטיינר מ-image חדש:</p>
<ol><li><strong>Resolve</strong> של ה-tag ל-manifest (או index ← בוחרים את ה-manifest שמתאים ל-<code>linux/amd64</code> או <code>linux/arm64</code> של ה-node).</li>
<li><strong>Fetch</strong> של ה-blobs החסרים לפי digest לתוך ה-content store ‏(<code>/var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/</code>), עם אימות hash לכל אחד. שכבות שכבר קיימות מדולגות.</li>
<li><strong>Unpack</strong> של כל שכבה ל-snapshot ‏(lower dirs של overlayfs תחת <code>/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/</code>).</li>
<li><strong>Create</strong> של snapshot עליון לכתיבה, יצירת <code>config.json</code> של OCI מתוך ה-pod spec, והעברת ה-bundle ל-shim ומשם ל-runc.</li></ol>
<p>כלומר node מחזיק images <strong>פעמיים</strong> (blobs דחוסים + snapshots פרוסים) — image דחוס של 1 GB יכול לתפוס 3+ GB דיסק. ה-image GC של ה-kubelet נכנס לפעולה ב-<code>imageGCHighThresholdPercent</code> ‏(ברירת מחדל 85%) ומוחק images שלא בשימוש עד הסף התחתון (80%).</p>
<blockquote>⚠️ טיפ לפרודקשן: "Pulling" שלוקח 90 שניות בכל scale-up זה בדרך כלל image של 2 GB, לא הרשת. תתקן את ה-image (ראה את השיעור על images רזים), תעשה pre-pull עם DaemonSet, או תשתמש ב-lazy pulling ‏(stargz/SOCI) — ראה את השיעור על registries.</blockquote>`
      }
    }
  ],
  diagram: `  kubelet --CRI gRPC--> containerd / CRI-O --(pull by digest)--> registry (OCI distribution)
                              |  content store (blobs) -> snapshots (overlayfs)
                              v
                     containerd-shim-runc-v2  (stays: stdio, exit code)
                              |
             +----------------+-----------------+
             v                v                 v
           runc / crun     runsc (gVisor)     kata-runtime -> microVM (own kernel)
           host kernel     user-space kernel   guest kernel
         RuntimeClass.handler picks which one, per pod`,
  handsOn: [
    { cmd: "crictl ps -a && crictl images | head", what: { en: "On a k8s node: list containers and images exactly as the kubelet sees them.", he: "על node של k8s: לראות קונטיינרים ו-images בדיוק כמו שה-kubelet רואה אותם." } },
    { cmd: "docker buildx imagetools inspect nginx:1.27", what: { en: "See the image index: one manifest digest per platform (amd64, arm64, ...).", he: "לראות את ה-image index: ‏digest של manifest לכל פלטפורמה (amd64, ‏arm64, ...)." } },
    { cmd: "ps -ef --forest | grep -B1 -A3 containerd-shim", what: { en: "See the shim as the parent of the pause container and your app process.", he: "לראות את ה-shim כאבא של קונטיינר ה-pause ושל תהליך האפליקציה." } },
    { cmd: "kubectl get runtimeclass && kubectl get pod <pod> -o jsonpath='{.spec.runtimeClassName}'", what: { en: "Check which sandboxed runtimes the cluster offers and which one a pod uses.", he: "לבדוק אילו runtimes עם sandbox ה-cluster מציע ובאיזה pod מסוים משתמש." } }
  ],
  mnemonic: {
    en: "\"Kubelet orders, containerd preps, runc fires and leaves, the shim stays.\" Specs: Image, Runtime, Distribution = I.R.D.",
    he: "\"ה-kubelet מזמין, containerd מכין, runc מדליק והולך, ה-shim נשאר.\" התקנים: Image, ‏Runtime, ‏Distribution."
  },
  pitfalls: [
    { en: "Mounting /var/run/docker.sock into pods for builds or monitoring — on containerd nodes it doesn't exist, and where it does it's root on the host.", he: "לעשות mount ל-/var/run/docker.sock בתוך pods בשביל builds או מוניטורינג — על nodes עם containerd הוא לא קיים, ואיפה שכן, זה root על ה-host." },
    { en: "Pulling or importing images with ctr into the 'default' namespace and wondering why the kubelet still pulls them; k8s uses the 'k8s.io' namespace.", he: "לעשות pull או import עם ctr ל-namespace ‏'default' ולתהות למה ה-kubelet עדיין מושך אותם; ‏k8s משתמש ב-namespace ‏'k8s.io'." },
    { en: "Adding a RuntimeClass without nodeSelector/tolerations: pods land on nodes without runsc and fail with 'no runtime for \"runsc\" is configured'.", he: "להוסיף RuntimeClass בלי nodeSelector או tolerations: ה-pods נוחתים על nodes בלי runsc ונכשלים עם 'no runtime for \"runsc\" is configured'." },
    { en: "Assuming gVisor is free: syscall-heavy workloads (databases, high-QPS networking) can lose a large share of throughput. Benchmark before moving them.", he: "להניח ש-gVisor בחינם: עומסים כבדים ב-syscalls (מסדי נתונים, רשת עם QPS גבוה) יכולים לאבד חלק גדול מה-throughput. תמדוד לפני שאתה מעביר אותם." }
  ],
  interview: [
    {
      q: { en: "Walk me through what happens between 'kubectl apply' of a pod and the process running on the node.", he: "תעביר אותי במה שקורה בין kubectl apply של pod לבין תהליך שרץ על ה-node." },
      a: { en: "API server stores the pod, scheduler binds it to a node, the kubelet sees it and calls the CRI runtime: RunPodSandbox (pause container + network namespace via CNI), PullImage (resolve tag to manifest for the node's platform, fetch missing blobs by digest, unpack to overlayfs snapshots), CreateContainer/StartContainer. containerd starts a shim, the shim calls runc with an OCI bundle, runc sets up namespaces, cgroups, seccomp and execs the entrypoint, then exits; the shim stays as parent.", he: "ה-API server שומר את ה-pod, ה-scheduler משייך אותו ל-node, ה-kubelet רואה אותו וקורא ל-CRI runtime: ‏RunPodSandbox ‏(קונטיינר pause ו-network namespace דרך CNI), ‏PullImage ‏(resolve של tag ל-manifest של הפלטפורמה של ה-node, הורדת blobs חסרים לפי digest, פריסה ל-snapshots של overlayfs), ‏CreateContainer ו-StartContainer. ‏containerd מרים shim, ה-shim קורא ל-runc עם OCI bundle, ‏runc מגדיר namespaces, ‏cgroups ו-seccomp, עושה exec ל-entrypoint ויוצא; ה-shim נשאר כאבא." }
    },
    {
      q: { en: "When would you use gVisor or Kata instead of runc?", he: "מתי תשתמש ב-gVisor או ב-Kata במקום runc?" },
      a: { en: "When the code is untrusted or tenants are hostile: user-submitted code, CI for external PRs, AI agent sandboxes, multi-tenant SaaS plugins. gVisor for good density and quick start with a syscall-interception boundary; Kata/Firecracker for a hardware-virtualization boundary with its own kernel. Pay attention to the overhead (RuntimeClass.overhead), syscall compatibility and IO performance; keep trusted, performance-sensitive workloads on runc.", he: "כשהקוד לא אמין או שהלקוחות עוינים: קוד שמשתמשים מעלים, CI ל-PRs חיצוניים, sandboxes של AI agents, ‏plugins ב-SaaS מרובה לקוחות. ‏gVisor בשביל צפיפות טובה ו-start מהיר עם גבול של יירוט syscalls; ‏Kata או Firecracker בשביל גבול של וירטואליזציה בחומרה עם kernel משלו. צריך לשים לב ל-overhead ‏(RuntimeClass.overhead), לתאימות syscalls ולביצועי IO; עומסים אמינים ורגישים לביצועים נשארים על runc." }
    }
  ],
  quiz: [
    {
      q: { en: "What did removing dockershim in Kubernetes 1.24 break?", he: "מה נשבר כש-Kubernetes 1.24 הסיר את dockershim?" },
      options: [
        { en: "All images built with docker build", he: "כל ה-images שנבנו עם docker build" },
        { en: "Workloads that depended on the Docker daemon/socket on the node", he: "עומסים שהסתמכו על ה-daemon או ה-socket של Docker על ה-node" },
        { en: "Multi-stage Dockerfiles", he: "Dockerfiles עם multi-stage" },
        { en: "Pulling from Docker Hub", he: "Pull מ-Docker Hub" }
      ],
      answer: 1,
      explain: { en: "Docker builds standard OCI images, which containerd and CRI-O run unchanged. Only things that talked to dockerd on the node (docker.sock mounts, DinD) broke.", he: "Docker בונה images סטנדרטיים של OCI, ש-containerd ו-CRI-O מריצים בלי שינוי. נשבר רק מה שדיבר עם dockerd על ה-node ‏(mounts של docker.sock, ‏DinD)." }
    },
    {
      q: { en: "Which component stays running as the parent of your container process on a containerd node?", he: "איזה רכיב נשאר רץ כאבא של תהליך הקונטיינר על node עם containerd?" },
      options: [
        { en: "runc", he: "runc" },
        { en: "the kubelet", he: "ה-kubelet" },
        { en: "containerd-shim-runc-v2", he: "containerd-shim-runc-v2" },
        { en: "dockerd", he: "dockerd" }
      ],
      answer: 2,
      explain: { en: "runc creates the container and exits. The shim keeps stdio and the exit status, so containerd itself can restart without killing containers.", he: "runc יוצר את הקונטיינר ויוצא. ה-shim מחזיק את ה-stdio ואת ה-exit status, כך ש-containerd עצמו יכול לעשות restart בלי להרוג קונטיינרים." }
    },
    {
      q: { en: "Two different images on a node both use the same debian:12 base layer. How many copies of that layer are pulled and stored?", he: "שני images שונים על node משתמשים באותה שכבת base של debian:12. כמה עותקים של השכבה הזו נמשכים ונשמרים?" },
      options: [
        { en: "One — layers are content-addressed by digest and shared", he: "אחד — שכבות מזוהות לפי digest ומשותפות" },
        { en: "Two — each image owns its layers", he: "שניים — לכל image יש שכבות משלו" },
        { en: "Depends on the tag names", he: "תלוי בשמות ה-tags" },
        { en: "Zero — base layers come from the host OS", he: "אפס — שכבות base מגיעות ממערכת ההפעלה של ה-host" }
      ],
      answer: 0,
      explain: { en: "Same bytes → same sha256 → same blob. The content store dedupes by digest, which is also why good base-image hygiene speeds up pulls across services.", he: "אותם בייטים ← אותו sha256 ← אותו blob. ה-content store עושה dedup לפי digest, ובגלל זה גם סדר טוב ב-base images מאיץ pulls בין שירותים." }
    },
    {
      q: { en: "A RuntimeClass named 'gvisor' has handler 'runsc'. What must be true on the node?", he: "ל-RuntimeClass בשם 'gvisor' יש handler ‏'runsc'. מה חייב להתקיים על ה-node?" },
      options: [
        { en: "Docker must be installed", he: "Docker חייב להיות מותקן" },
        { en: "The node must be a bare-metal server", he: "ה-node חייב להיות שרת bare metal" },
        { en: "containerd/CRI-O must have a runtime named 'runsc' configured", he: "ב-containerd או ב-CRI-O חייב להיות מוגדר runtime בשם 'runsc'" },
        { en: "The pod must run as root", he: "ה-pod חייב לרוץ כ-root" }
      ],
      answer: 2,
      explain: { en: "The handler is just a name the CRI runtime maps to a binary. Use scheduling.nodeSelector so pods only land on nodes that have it.", he: "ה-handler הוא רק שם שה-CRI runtime ממפה לקובץ הרצה. משתמשים ב-scheduling.nodeSelector כדי שה-pods ינחתו רק על nodes שיש להם אותו." }
    }
  ],
  related: ["docker-why", "container-internals", "container-security", "k8s-architecture", "k8s-pods", "container-registries"]
});

/* ============================== REGISTRIES ============================== */
INFRA.lessons.push({
  id: "container-registries",
  track: "containers",
  order: 21,
  icon: "🏬",
  level: 2,
  minutes: 12,
  title: { en: "Registries & image distribution at scale", he: "Registries והפצת images בסקייל" },
  tldr: {
    en: "Deploy by digest, pull from a registry close to your nodes with node-level IAM, cache public images behind a pull-through mirror, and treat retention policies as code that can delete what production is still running.",
    he: "עושים deploy לפי digest, מושכים מ-registry קרוב ל-nodes עם IAM ברמת ה-node, שמים cache ל-images ציבוריים מאחורי pull-through mirror, ומתייחסים ל-retention policies כקוד שיכול למחוק מה שפרודקשן עדיין מריץ."
  },
  analogy: {
    en: "A registry is a central warehouse. Tags are shelf labels anyone with a marker can move; digests are the serial number stamped into the product. A pull-through cache is the local branch store that orders from the warehouse once and then serves the neighborhood. A retention policy is the warehouse clearing old stock — great, unless a customer still needs a spare part for the model they bought.",
    he: "Registry הוא מחסן מרכזי. Tags הם מדבקות על המדפים שכל מי שיש לו טוש יכול להזיז; digests הם המספר הסידורי שמוטבע במוצר. ‏pull-through cache הוא הסניף השכונתי שמזמין מהמחסן פעם אחת ואז משרת את כל השכונה. ‏retention policy זה המחסן שמפנה מלאי ישן — מעולה, אלא אם לקוח עדיין צריך חלק חילוף לדגם שהוא קנה."
  },
  sections: [
    {
      h: { en: "Choosing a registry and authenticating nodes", he: "בחירת registry ואימות של nodes" },
      body: {
        en: `<table><tr><th>Registry</th><th>Good at</th><th>Watch out</th></tr>
<tr><td><strong>AWS ECR</strong></td><td>Per-region, IAM-native, lifecycle policies, cross-region/cross-account replication, pull-through cache rules, tag immutability, Inspector scanning</td><td>Private clusters need VPC endpoints (<code>ecr.api</code>, <code>ecr.dkr</code>) <em>and</em> the S3 gateway endpoint — layers are served from S3</td></tr>
<tr><td><strong>Azure ACR</strong></td><td>Geo-replication (Premium SKU), <code>az aks update --attach-acr</code>, ACR Tasks builds, artifact cache</td><td>SKU limits (throughput, private link and geo-replication need Premium)</td></tr>
<tr><td><strong>Google Artifact Registry</strong></td><td>Multi-region locations (<code>us</code>, <code>europe</code>), remote repositories (pull-through), cleanup policies, GKE image streaming</td><td>Container Registry (gcr.io) is the legacy product — migrate</td></tr>
<tr><td><strong>Harbor</strong></td><td>Self-hosted, CNCF graduated: projects, RBAC, proxy-cache projects, replication, built-in Trivy, signing</td><td>You operate it — storage, HA, Postgres, Redis, upgrades</td></tr>
<tr><td><strong>GHCR</strong></td><td>Next to the code; CI pushes with <code>GITHUB_TOKEN</code></td><td>Not region-local to your clusters; mind egress and availability coupling to GitHub</td></tr></table>
<p><strong>Prefer node identity over pull secrets.</strong> On EKS the node IAM role gets <code>AmazonEC2ContainerRegistryReadOnly</code> (or the narrower pull-only policy) and the kubelet's ECR credential provider fetches tokens automatically (ECR tokens last 12 h). On GKE the node service account needs <code>roles/artifactregistry.reader</code>; on AKS the kubelet managed identity gets <code>AcrPull</code>. Use <code>imagePullSecrets</code> only for third-party registries:</p>
<pre>kubectl create secret docker-registry vendor-pull \
  --docker-server=registry.vendor.io --docker-username='robot$ci' \
  --docker-password="$TOKEN" -n payments
# then: spec.imagePullSecrets: [{ name: vendor-pull }]  — or attach it to the ServiceAccount
kubectl patch serviceaccount default -n payments \
  -p '{"imagePullSecrets":[{"name":"vendor-pull"}]}'</pre>
<blockquote>⚠️ Production tip: pull secrets are namespaced. The #1 "unauthorized" in a new namespace is a secret that exists only in the old one.</blockquote>`,
        he: `<table><tr><th>Registry</th><th>חזק ב-</th><th>שים לב</th></tr>
<tr><td><strong>AWS ECR</strong></td><td>לכל region, ‏IAM מובנה, ‏lifecycle policies, רפליקציה בין regions ובין accounts, חוקי pull-through cache, ‏tag immutability, סריקה עם Inspector</td><td>clusters פרטיים צריכים VPC endpoints ‏(<code>ecr.api</code>, ‏<code>ecr.dkr</code>) <em>וגם</em> את ה-gateway endpoint של S3 — השכבות מוגשות מ-S3</td></tr>
<tr><td><strong>Azure ACR</strong></td><td>Geo-replication ‏(SKU ‏Premium), ‏<code>az aks update --attach-acr</code>, ‏builds עם ACR Tasks, ‏artifact cache</td><td>מגבלות SKU ‏(throughput; ‏private link ו-geo-replication דורשים Premium)</td></tr>
<tr><td><strong>Google Artifact Registry</strong></td><td>מיקומים multi-region ‏(<code>us</code>, ‏<code>europe</code>), ‏remote repositories ‏(pull-through), ‏cleanup policies, ‏image streaming ב-GKE</td><td>Container Registry ‏(gcr.io) הוא המוצר הישן — תעבור</td></tr>
<tr><td><strong>Harbor</strong></td><td>Self-hosted, ‏CNCF graduated: פרויקטים, RBAC, פרויקטים של proxy cache, רפליקציה, Trivy מובנה, חתימות</td><td>אתה מתפעל אותו — storage, ‏HA, ‏Postgres, ‏Redis, שדרוגים</td></tr>
<tr><td><strong>GHCR</strong></td><td>ליד הקוד; ה-CI עושה push עם <code>GITHUB_TOKEN</code></td><td>לא נמצא באותו region כמו ה-clusters; שים לב ל-egress ולתלות בזמינות של GitHub</td></tr></table>
<p><strong>עדיף זהות של node על פני pull secrets.</strong> ב-EKS ה-IAM role של ה-node מקבל <code>AmazonEC2ContainerRegistryReadOnly</code> ‏(או את ה-policy המצומצם יותר שמאפשר רק pull), וה-credential provider של ECR ב-kubelet מביא tokens אוטומטית (token של ECR תקף ל-12 שעות). ב-GKE ה-service account של ה-node צריך <code>roles/artifactregistry.reader</code>; ב-AKS ה-managed identity של ה-kubelet מקבל <code>AcrPull</code>. משתמשים ב-<code>imagePullSecrets</code> רק ל-registries של צד שלישי:</p>
<pre>kubectl create secret docker-registry vendor-pull \
  --docker-server=registry.vendor.io --docker-username='robot$ci' \
  --docker-password="$TOKEN" -n payments
# then: spec.imagePullSecrets: [{ name: vendor-pull }]  — or attach it to the ServiceAccount
kubectl patch serviceaccount default -n payments \
  -p '{"imagePullSecrets":[{"name":"vendor-pull"}]}'</pre>
<blockquote>⚠️ טיפ לפרודקשן: pull secrets שייכים ל-namespace. ה-"unauthorized" הכי נפוץ ב-namespace חדש הוא secret שקיים רק בישן.</blockquote>`
      }
    },
    {
      h: { en: "Tags, digests and imagePullPolicy", he: "Tags, ‏digests ו-imagePullPolicy" },
      body: {
        en: `<p>Tags are mutable; digests are not (see <em>container-security</em>). The practical pattern: CI tags with the git SHA, and the deploy tool (Argo CD Image Updater, Kustomize, Helm values) writes <strong>tag@digest</strong> into the manifest, so humans read the tag and the kubelet pulls the digest.</p>
<pre>image: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/payments:3f9a2c1@sha256:9b2e...c41d
# If both are given, the digest wins; the tag is only a label.</pre>
<p><code>imagePullPolicy</code> decides when the kubelet contacts the registry:</p>
<table><tr><th>Policy</th><th>Default when</th><th>Behavior</th></tr>
<tr><td><code>IfNotPresent</code></td><td>Tag other than <code>:latest</code>, or a digest</td><td>Pull only if the image isn't on the node</td></tr>
<tr><td><code>Always</code></td><td>Tag is <code>:latest</code> or omitted</td><td>Resolve the tag on every container start (cheap if layers are cached — a manifest HEAD/GET — but fails if the registry is down)</td></tr>
<tr><td><code>Never</code></td><td>—</td><td>Only use a pre-loaded image (air-gapped, kind/minikube)</td></tr></table>
<blockquote>💡 Real world: with <code>Always</code>, a registry outage turns every pod restart into <code>ErrImagePull</code> even though the image is sitting on disk. Digests + <code>IfNotPresent</code> make restarts independent of the registry.</blockquote>`,
        he: `<p>Tags אפשר להזיז; ‏digests לא (ראה <em>container-security</em>). הדפוס הפרקטי: ה-CI מתייג לפי ה-git SHA, וכלי ה-deploy ‏(Argo CD Image Updater, ‏Kustomize, ‏Helm values) כותב <strong>tag@digest</strong> ל-manifest, כך שבני אדם קוראים את ה-tag וה-kubelet מושך את ה-digest.</p>
<pre>image: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/payments:3f9a2c1@sha256:9b2e...c41d
# If both are given, the digest wins; the tag is only a label.</pre>
<p><code>imagePullPolicy</code> קובע מתי ה-kubelet פונה ל-registry:</p>
<table><tr><th>Policy</th><th>ברירת מחדל כש-</th><th>התנהגות</th></tr>
<tr><td><code>IfNotPresent</code></td><td>tag שהוא לא <code>:latest</code>, או digest</td><td>pull רק אם ה-image לא נמצא על ה-node</td></tr>
<tr><td><code>Always</code></td><td>ה-tag הוא <code>:latest</code> או שאין tag</td><td>resolve ל-tag בכל start של קונטיינר (זול אם השכבות ב-cache — רק HEAD/GET ל-manifest — אבל נכשל אם ה-registry למטה)</td></tr>
<tr><td><code>Never</code></td><td>—</td><td>משתמש רק ב-image שנטען מראש (air-gapped, ‏kind/minikube)</td></tr></table>
<blockquote>💡 מהשטח: עם <code>Always</code>, נפילה של ה-registry הופכת כל restart של pod ל-<code>ErrImagePull</code> למרות שה-image יושב על הדיסק. ‏Digests יחד עם <code>IfNotPresent</code> הופכים את ה-restarts לבלתי תלויים ב-registry.</blockquote>`
      }
    },
    {
      h: { en: "Docker Hub limits, pull-through caches and mirrors", he: "המגבלות של Docker Hub, ‏pull-through caches ו-mirrors" },
      body: {
        en: `<p>Docker Hub rate-limits pulls. Since April 2025 the published limits are roughly <strong>10 pulls/hour per IP</strong> for anonymous users and <strong>100 pulls/hour</strong> for authenticated free accounts (paid plans are higher — check the current docs, they change). A NAT gateway makes your whole cluster <em>one IP</em>: one Karpenter scale-up of 40 nodes running 3 DaemonSets from Docker Hub is 120 pulls. The error looks like:</p>
<pre>Failed to pull image "fluent/fluent-bit:3.1": ... 429 Too Many Requests
toomanyrequests: You have reached your unauthenticated pull rate limit.</pre>
<p>Fix it structurally with a <strong>pull-through cache</strong>: your registry fetches from upstream once and serves everyone after.</p>
<pre># ECR pull-through cache rule (Docker Hub upstream needs a Secrets Manager credential)
aws ecr create-pull-through-cache-rule \
  --ecr-repository-prefix docker-hub \
  --upstream-registry-url registry-1.docker.io \
  --credential-arn arn:aws:secretsmanager:eu-west-1:123456789012:secret:ecr-pullthroughcache/dockerhub
# then use: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/docker-hub/fluent/fluent-bit:3.1</pre>
<p>Or make it transparent at the node level with a containerd <strong>mirror</strong>, so manifests that say <code>docker.io/...</code> still work:</p>
<pre># /etc/containerd/certs.d/docker.io/hosts.toml   (config_path = "/etc/containerd/certs.d")
server = "https://registry-1.docker.io"

[host."https://harbor.internal.example.com/v2/dockerhub-proxy"]
  capabilities = ["pull", "resolve"]
  override_path = true</pre>
<blockquote>⚠️ Production tip: a mirror falls back to upstream if it's down — good for availability, bad if you rely on it for rate limits. Monitor the mirror's hit ratio and upstream 429s.</blockquote>`,
        he: `<p>Docker Hub מגביל קצב pulls. מאז אפריל 2025 המגבלות שפורסמו הן בערך <strong>10 pulls לשעה לכל IP</strong> למשתמשים אנונימיים ו-<strong>100 pulls לשעה</strong> לחשבונות חינמיים מאומתים (בתוכניות בתשלום יותר — תבדוק את התיעוד העדכני, זה משתנה). ‏NAT gateway הופך את כל ה-cluster שלך ל-<em>IP אחד</em>: ‏scale-up אחד של Karpenter ל-40 nodes שמריצים 3 DaemonSets מ-Docker Hub זה 120 pulls. השגיאה נראית ככה:</p>
<pre>Failed to pull image "fluent/fluent-bit:3.1": ... 429 Too Many Requests
toomanyrequests: You have reached your unauthenticated pull rate limit.</pre>
<p>מתקנים את זה מבנית עם <strong>pull-through cache</strong>: ה-registry שלך מושך מה-upstream פעם אחת ומגיש לכולם אחר כך.</p>
<pre># ECR pull-through cache rule (Docker Hub upstream needs a Secrets Manager credential)
aws ecr create-pull-through-cache-rule \
  --ecr-repository-prefix docker-hub \
  --upstream-registry-url registry-1.docker.io \
  --credential-arn arn:aws:secretsmanager:eu-west-1:123456789012:secret:ecr-pullthroughcache/dockerhub
# then use: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/docker-hub/fluent/fluent-bit:3.1</pre>
<p>או שהופכים את זה לשקוף ברמת ה-node עם <strong>mirror</strong> של containerd, כך ש-manifests שכתוב בהם <code>docker.io/...</code> עדיין עובדים:</p>
<pre># /etc/containerd/certs.d/docker.io/hosts.toml   (config_path = "/etc/containerd/certs.d")
server = "https://registry-1.docker.io"

[host."https://harbor.internal.example.com/v2/dockerhub-proxy"]
  capabilities = ["pull", "resolve"]
  override_path = true</pre>
<blockquote>⚠️ טיפ לפרודקשן: mirror חוזר ל-upstream אם הוא למטה — טוב לזמינות, רע אם אתה סומך עליו בשביל ה-rate limits. תנטר את ה-hit ratio של ה-mirror ואת ה-429 מה-upstream.</blockquote>`
      }
    },
    {
      h: { en: "Retention, replication and lazy pulling", he: "Retention, רפליקציה ו-lazy pulling" },
      body: {
        en: `<p>Registries grow forever if you let them: a monorepo pushing 300 images/day × 400 MB is ~3.6 TB/month before dedup. <strong>Lifecycle policies</strong> clean up — and are the most common way teams delete an image production still runs.</p>
<pre>{ "rules": [
  { "rulePriority": 1, "description": "untagged after 7 days",
    "selection": { "tagStatus": "untagged", "countType": "sinceImagePushed",
                   "countUnit": "days", "countNumber": 7 },
    "action": { "type": "expire" } },
  { "rulePriority": 2, "description": "PR builds after 14 days",
    "selection": { "tagStatus": "tagged", "tagPrefixList": ["pr-"],
                   "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 14 },
    "action": { "type": "expire" } }
] }
# Release tags (v*, release-*) have NO rule => kept. Never "keep last N" on everything.</pre>
<p><strong>Replication</strong>: pull from the registry in the same region as the nodes — faster, no cross-region egress, and a regional outage elsewhere doesn't block scale-ups. ECR has replication rules (cross-region and cross-account), ACR geo-replication, Artifact Registry multi-region repos, Harbor push/pull replication. Gate deploys on "image present in target region" — replication is asynchronous (usually seconds to minutes).</p>
<p><strong>Lazy pulling</strong>: normally a container can't start until every layer is downloaded and unpacked, though studies show most containers read only a small fraction of their image at startup. <strong>eStargz</strong> (stargz-snapshotter), AWS <strong>SOCI</strong> (Seekable OCI, used by Fargate) and <strong>GKE image streaming</strong> mount the image remotely and fetch file chunks on demand. A 3 GB ML image can go from ~60 s to start to a few seconds; the trade-off is that later file reads hit the network.</p>
<blockquote>💡 Real world: before reaching for lazy pulling, check image size. Moving a Python service from a 2.1 GB image to 180 MB usually beats any snapshotter.</blockquote>`,
        he: `<p>Registries גדלים לנצח אם נותנים להם: ‏monorepo שדוחף 300 images ביום × 400 MB זה בערך 3.6 TB בחודש לפני dedup. <strong>Lifecycle policies</strong> מנקים — והם גם הדרך הכי נפוצה שבה צוותים מוחקים image שפרודקשן עדיין מריץ.</p>
<pre>{ "rules": [
  { "rulePriority": 1, "description": "untagged after 7 days",
    "selection": { "tagStatus": "untagged", "countType": "sinceImagePushed",
                   "countUnit": "days", "countNumber": 7 },
    "action": { "type": "expire" } },
  { "rulePriority": 2, "description": "PR builds after 14 days",
    "selection": { "tagStatus": "tagged", "tagPrefixList": ["pr-"],
                   "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 14 },
    "action": { "type": "expire" } }
] }
# Release tags (v*, release-*) have NO rule => kept. Never "keep last N" on everything.</pre>
<p><strong>רפליקציה</strong>: מושכים מה-registry שנמצא באותו region כמו ה-nodes — מהיר יותר, בלי egress בין regions, ונפילה של region אחר לא חוסמת scale-ups. ל-ECR יש replication rules ‏(בין regions ובין accounts), ל-ACR יש geo-replication, ל-Artifact Registry יש repos שהם multi-region, ול-Harbor יש רפליקציה של push/pull. תתנה deploys ב"image קיים ב-region היעד" — הרפליקציה אסינכרונית (בדרך כלל שניות עד דקות).</p>
<p><strong>Lazy pulling</strong>: בדרך כלל קונטיינר לא יכול לעלות עד שכל השכבות ירדו ונפרסו, למרות שמחקרים מראים שרוב הקונטיינרים קוראים רק חלק קטן מה-image שלהם בזמן העלייה. ‏<strong>eStargz</strong> ‏(stargz-snapshotter), ‏<strong>SOCI</strong> של AWS ‏(Seekable OCI, ‏Fargate משתמש בו) ו-<strong>image streaming של GKE</strong> עושים mount ל-image מרחוק ומביאים חלקים מקבצים לפי דרישה. image של ML בגודל 3 GB יכול לרדת מבערך 60 שניות עלייה לכמה שניות; המחיר הוא שקריאות קבצים מאוחרות יותר הולכות לרשת.</p>
<blockquote>💡 מהשטח: לפני שאתה מגיע ל-lazy pulling, תבדוק את גודל ה-image. העברה של שירות Python מ-image של 2.1 GB ל-180 MB בדרך כלל מנצחת כל snapshotter.</blockquote>`
      }
    },
    {
      h: { en: "ImagePullBackOff: the cause table", he: "ImagePullBackOff: טבלת הסיבות" },
      body: {
        en: `<p><code>ErrImagePull</code> is the failed attempt; <code>ImagePullBackOff</code> is the kubelet waiting before retrying (exponential back-off up to 5 minutes). The real reason is always in <code>kubectl describe pod</code> → Events:</p>
<table><tr><th>Event message contains</th><th>Cause</th><th>Fix</th></tr>
<tr><td><code>not found</code> / <code>manifest unknown</code></td><td>Typo, tag never pushed, or deleted by a lifecycle policy</td><td><code>aws ecr describe-images --image-ids imageTag=...</code>; rebuild/re-push; fix retention</td></tr>
<tr><td><code>unauthorized</code> / <code>403</code> / <code>no basic auth credentials</code></td><td>Missing pull secret in this namespace, node role lacks pull permission, cross-account repo policy</td><td>Fix IAM/repo policy or secret; check the ServiceAccount</td></tr>
<tr><td><code>429 Too Many Requests</code></td><td>Docker Hub (or other) rate limit</td><td>Pull-through cache / mirror, authenticate</td></tr>
<tr><td><code>no match for platform in manifest</code></td><td>arm64 node, amd64-only image (or vice versa)</td><td>Multi-arch build, or nodeSelector <code>kubernetes.io/arch</code></td></tr>
<tr><td><code>i/o timeout</code> / <code>dial tcp ... connect: connection refused</code></td><td>No route: missing VPC endpoint/NAT, firewall, DNS, proxy</td><td>Test from the node: <code>crictl pull</code>, <code>curl -v https://&lt;registry&gt;/v2/</code></td></tr>
<tr><td><code>context deadline exceeded</code> on a huge image</td><td>Slow pull of multi-GB layers</td><td>Smaller image, pre-pull, lazy pulling, raise <code>runtimeRequestTimeout</code> last</td></tr></table>
<blockquote>⚠️ Production tip: pods already running on old nodes keep working because the image is cached — the incident shows up only on <em>new</em> nodes or rescheduled pods, often hours after the real change.</blockquote>`,
        he: `<p><code>ErrImagePull</code> זה הניסיון שנכשל; ‏<code>ImagePullBackOff</code> זה ה-kubelet שמחכה לפני ניסיון חוזר (back-off אקספוננציאלי עד 5 דקות). הסיבה האמיתית תמיד נמצאת ב-<code>kubectl describe pod</code> תחת Events:</p>
<table><tr><th>הודעת ה-event מכילה</th><th>סיבה</th><th>תיקון</th></tr>
<tr><td><code>not found</code> / <code>manifest unknown</code></td><td>שגיאת הקלדה, tag שאף פעם לא נדחף, או שנמחק ע"י lifecycle policy</td><td><code>aws ecr describe-images --image-ids imageTag=...</code>; ‏build ו-push מחדש; לתקן את ה-retention</td></tr>
<tr><td><code>unauthorized</code> / <code>403</code> / <code>no basic auth credentials</code></td><td>חסר pull secret ב-namespace הזה, ל-role של ה-node אין הרשאת pull, ‏repo policy בין accounts</td><td>לתקן IAM, ‏repo policy או secret; לבדוק את ה-ServiceAccount</td></tr>
<tr><td><code>429 Too Many Requests</code></td><td>rate limit של Docker Hub (או אחר)</td><td>pull-through cache או mirror, לעשות אימות</td></tr>
<tr><td><code>no match for platform in manifest</code></td><td>node של arm64 ו-image רק ל-amd64 (או הפוך)</td><td>build מרובה ארכיטקטורות, או nodeSelector על <code>kubernetes.io/arch</code></td></tr>
<tr><td><code>i/o timeout</code> / <code>dial tcp ... connect: connection refused</code></td><td>אין route: חסר VPC endpoint או NAT, ‏firewall, ‏DNS, ‏proxy</td><td>לבדוק מה-node: <code>crictl pull</code>, ‏<code>curl -v https://&lt;registry&gt;/v2/</code></td></tr>
<tr><td><code>context deadline exceeded</code> על image ענק</td><td>pull איטי של שכבות של כמה GB</td><td>image קטן יותר, pre-pull, ‏lazy pulling, ורק בסוף להגדיל את <code>runtimeRequestTimeout</code></td></tr></table>
<blockquote>⚠️ טיפ לפרודקשן: pods שכבר רצים על nodes ישנים ממשיכים לעבוד כי ה-image ב-cache — התקלה מופיעה רק על nodes <em>חדשים</em> או ב-pods שעוברים reschedule, הרבה פעמים שעות אחרי השינוי האמיתי.</blockquote>`
      }
    }
  ],
  diagram: `  CI --push api:3f9a2c1--> ECR eu-west-1 --replication--> ECR us-east-1
                               |                                  |
               lifecycle policy (keep releases!)                  |
                               v                                  v
   nodes (IAM role, IfNotPresent, pull by digest)      nodes in us-east-1
        |
        +--docker.io/...--> containerd mirror --> pull-through cache --(once)--> Docker Hub
                                                                     (rate limited per IP)`,
  handsOn: [
    { cmd: "kubectl describe pod <pod> | sed -n '/Events/,$p'", what: { en: "Read the exact pull failure reason (not found / unauthorized / 429 / platform / timeout).", he: "לקרוא את הסיבה המדויקת לכישלון ה-pull ‏(not found / ‏unauthorized / ‏429 / פלטפורמה / timeout)." } },
    { cmd: "aws ecr describe-images --repository-name payments --image-ids imageTag=3f9a2c1", what: { en: "Check the tag still exists and get its digest and push date.", he: "לבדוק שה-tag עדיין קיים ולקבל את ה-digest ואת תאריך ה-push." } },
    { cmd: "aws ecr get-lifecycle-policy-preview --repository-name payments", what: { en: "Preview which images a lifecycle policy would expire before enabling it.", he: "לראות מראש אילו images ה-lifecycle policy ימחק לפני שמפעילים אותו." } },
    { cmd: "TOKEN=$(curl -s 'https://auth.docker.io/token?service=registry.docker.io&scope=repository:ratelimitpreview/test:pull' | jq -r .token); curl -sI -H \"Authorization: Bearer $TOKEN\" https://registry-1.docker.io/v2/ratelimitpreview/test/manifests/latest | grep -i ratelimit", what: { en: "See your current Docker Hub rate-limit headers from this IP.", he: "לראות את ה-headers של ה-rate limit של Docker Hub מה-IP הנוכחי." } }
  ],
  mnemonic: {
    en: "\"Tag to read, digest to run; cache the public, replicate the private; never let retention touch a release.\"",
    he: "\"Tag לקריאה, digest להרצה; cache לציבורי, רפליקציה לפרטי; ‏retention לא נוגע ב-release.\""
  },
  pitfalls: [
    { en: "A 'keep the last 20 images' lifecycle rule on a repo that also receives per-commit builds: a rarely deployed service's production image gets expired, and the next node scale-up hits 'not found'.", he: "חוק lifecycle של 'תשמור את 20 ה-images האחרונים' על repo שמקבל גם builds לכל commit: ה-image של פרודקשן של שירות שעושים לו deploy לעתים רחוקות נמחק, וה-scale-up הבא של nodes נתקל ב-'not found'." },
    { en: "Private EKS cluster with ecr.api and ecr.dkr endpoints but no S3 gateway endpoint: auth works, manifest works, layer download times out.", he: "Cluster פרטי של EKS עם endpoints ל-ecr.api ול-ecr.dkr אבל בלי gateway endpoint ל-S3: האימות עובד, ה-manifest עובד, הורדת השכבות נתקעת ב-timeout." },
    { en: "Pulling DaemonSet images from Docker Hub through a single NAT IP: every big scale-up burns the anonymous rate limit.", he: "למשוך images של DaemonSets מ-Docker Hub דרך IP אחד של NAT: כל scale-up גדול שורף את ה-rate limit האנונימי." },
    { en: "Using imagePullPolicy: Always for 'freshness' — it couples every pod start to registry availability.", he: "להשתמש ב-imagePullPolicy: Always בשביל 'טריות' — זה קושר כל עלייה של pod לזמינות של ה-registry." }
  ],
  interview: [
    {
      q: { en: "How do you make image pulls resilient for a multi-region Kubernetes platform?", he: "איך הופכים pulls של images לעמידים בפלטפורמת Kubernetes מרובת regions?" },
      a: { en: "Regional registry replicas (ECR replication / ACR geo-replication) so nodes pull in-region; deploy by digest with IfNotPresent so restarts don't depend on the registry; pull-through cache for all public images with node-level mirrors; node IAM instead of static secrets; retention that never expires release tags plus a check that running digests are protected; private endpoints for the registry; monitor pull latency and failures per region.", he: "רפליקות אזוריות של ה-registry ‏(ECR replication / ‏ACR geo-replication) כדי שה-nodes ימשכו באותו region; ‏deploy לפי digest עם IfNotPresent כדי ש-restarts לא יהיו תלויים ב-registry; ‏pull-through cache לכל ה-images הציבוריים עם mirrors ברמת ה-node; ‏IAM של node במקום secrets סטטיים; ‏retention שאף פעם לא מוחק release tags ועוד בדיקה שה-digests שרצים מוגנים; private endpoints ל-registry; ניטור של latency וכישלונות pull לכל region." }
    },
    {
      q: { en: "A pod is in ImagePullBackOff. What's your process?", he: "Pod נמצא ב-ImagePullBackOff. מה התהליך שלך?" },
      a: { en: "kubectl describe pod and read the Events message — it names the class: not found, unauthorized, 429, platform mismatch or network. Then verify from the source of truth: does the tag/digest exist in the registry, does the node role/secret have access in that namespace, can the node reach the registry (crictl pull on the node). Also check scope: only new nodes? one namespace? one registry? That points to retention, IAM or network changes.", he: "kubectl describe pod וקוראים את הודעת ה-Events — היא אומרת את סוג הבעיה: ‏not found, ‏unauthorized, ‏429, אי-התאמת פלטפורמה או רשת. אחר כך מאמתים מול מקור האמת: האם ה-tag או ה-digest קיים ב-registry, האם ל-role של ה-node או ל-secret יש גישה ב-namespace הזה, האם ה-node מגיע ל-registry ‏(crictl pull על ה-node). ובודקים היקף: רק nodes חדשים? ‏namespace אחד? ‏registry אחד? זה מצביע על שינוי ב-retention, ב-IAM או ברשת." }
    }
  ],
  quiz: [
    {
      q: { en: "A pod spec says image: api:latest with no imagePullPolicy. What policy applies?", he: "ב-pod spec כתוב image: api:latest בלי imagePullPolicy. איזה policy חל?" },
      options: [
        { en: "IfNotPresent", he: "IfNotPresent" },
        { en: "Always", he: "Always" },
        { en: "Never", he: "Never" },
        { en: "OnFailure", he: "OnFailure" }
      ],
      answer: 1,
      explain: { en: ":latest (or no tag) defaults to Always; any other tag or a digest defaults to IfNotPresent.", he: ":latest (או בלי tag) מקבל Always כברירת מחדל; כל tag אחר או digest מקבל IfNotPresent." }
    },
    {
      q: { en: "Only pods on newly launched nodes are in ImagePullBackOff with 'manifest unknown'; old pods run fine. Most likely?", he: "רק pods על nodes חדשים נמצאים ב-ImagePullBackOff עם 'manifest unknown'; ה-pods הישנים רצים בסדר. מה הכי סביר?" },
      options: [
        { en: "The registry is down", he: "ה-registry למטה" },
        { en: "The image was deleted (e.g. lifecycle policy); old nodes still have it cached", he: "ה-image נמחק (למשל ע\"י lifecycle policy); ל-nodes הישנים הוא עדיין ב-cache" },
        { en: "CPU limits are too low", he: "ה-CPU limits נמוכים מדי" },
        { en: "The Service selector is wrong", he: "ה-selector של ה-Service שגוי" }
      ],
      answer: 1,
      explain: { en: "'manifest unknown' means the registry answered but the tag/digest doesn't exist. Cached copies on old nodes hide the problem until new capacity arrives.", he: "'manifest unknown' אומר שה-registry ענה אבל ה-tag או ה-digest לא קיימים. העותקים ב-cache על ה-nodes הישנים מסתירים את הבעיה עד שמגיעה קיבולת חדשה." }
    },
    {
      q: { en: "Why does a NAT gateway make Docker Hub rate limits worse?", he: "למה NAT gateway מחמיר את בעיית ה-rate limits של Docker Hub?" },
      options: [
        { en: "NAT strips authentication headers", he: "NAT מוחק headers של אימות" },
        { en: "NAT adds latency that triggers retries", he: "NAT מוסיף latency שגורם ל-retries" },
        { en: "All nodes share one public IP, so they share one anonymous limit", he: "כל ה-nodes חולקים IP ציבורי אחד, אז הם חולקים מגבלה אנונימית אחת" },
        { en: "Docker Hub blocks cloud IP ranges", he: "Docker Hub חוסם טווחי IP של עננים" }
      ],
      answer: 2,
      explain: { en: "Anonymous limits are per source IP. Behind NAT, the whole cluster counts as one client — a pull-through cache fixes it.", he: "המגבלות האנונימיות הן לכל IP מקור. מאחורי NAT, כל ה-cluster נחשב כלקוח אחד — ‏pull-through cache פותר את זה." }
    },
    {
      q: { en: "A private EKS cluster can authenticate to ECR but layer downloads time out. What's missing?", he: "Cluster פרטי של EKS מצליח להתאמת מול ECR אבל הורדת השכבות נתקעת ב-timeout. מה חסר?" },
      options: [
        { en: "An S3 gateway VPC endpoint", he: "Gateway VPC endpoint ל-S3" },
        { en: "A bigger node instance type", he: "Instance type גדול יותר ל-nodes" },
        { en: "A Docker Hub account", he: "חשבון ב-Docker Hub" },
        { en: "imagePullPolicy: Never", he: "imagePullPolicy: Never" }
      ],
      answer: 0,
      explain: { en: "ECR serves layer blobs from S3. Without the S3 endpoint (or NAT), manifests resolve but blobs never arrive.", he: "ECR מגיש את ה-blobs של השכבות מ-S3. בלי endpoint ל-S3 (או NAT), ה-manifests נפתרים אבל ה-blobs לא מגיעים." }
    }
  ],
  related: ["container-security", "container-runtimes-oci", "k8s-debugging", "k8s-troubleshooting-playbook", "cloud-cicd", "cloud-airgapped"]
});

/* ============================== BUILDKIT BUILDS ============================== */
INFRA.lessons.push({
  id: "container-builds-buildkit",
  track: "containers",
  order: 22,
  icon: "🏗️",
  level: 3,
  minutes: 13,
  title: { en: "Fast & secure builds: BuildKit, buildx, rootless CI", he: "Builds מהירים ומאובטחים: BuildKit, ‏buildx ו-CI בלי root" },
  tldr: {
    en: "BuildKit gives you cache mounts, secret mounts and a registry-backed cache that survives ephemeral CI runners; order layers for cache hits, build multi-arch on native runners instead of QEMU when you can, and build rootless — no Docker socket in CI.",
    he: "BuildKit נותן לך cache mounts, ‏secret mounts ו-cache שיושב ב-registry ושורד CI runners זמניים; מסדרים שכבות בשביל cache hits, בונים multi-arch על runners native במקום QEMU כשאפשר, ובונים בלי root — בלי Docker socket ב-CI."
  },
  analogy: {
    en: "The classic builder is a cook who throws away the whole kitchen after every meal and re-buys spices each morning. BuildKit keeps a pantry (cache mounts), hands the cook the safe key only while cooking and takes it back (secret mounts), and keeps a photo of each finished prep step at the central warehouse so any new kitchen can skip straight to the steps that changed (registry cache).",
    he: "ה-builder הקלאסי הוא טבח שזורק את כל המטבח אחרי כל ארוחה וקונה תבלינים מחדש כל בוקר. ‏BuildKit שומר מזווה (cache mounts), נותן לטבח את המפתח לכספת רק בזמן הבישול ולוקח אותו בחזרה (secret mounts), ושומר תמונה של כל שלב הכנה גמור במחסן המרכזי, כך שכל מטבח חדש יכול לקפוץ ישר לשלבים שהשתנו (registry cache)."
  },
  sections: [
    {
      h: { en: "BuildKit: cache mounts and secret mounts", he: "BuildKit: ‏cache mounts ו-secret mounts" },
      body: {
        en: `<p>BuildKit has been the default builder since Docker Engine 23.0. It builds a DAG (independent stages run in parallel, unused stages are skipped) and adds <code>RUN --mount</code>:</p>
<pre># syntax=docker/dockerfile:1
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
# pip's download cache persists across builds on this builder, but is NOT in the image
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --prefix=/install -r requirements.txt

FROM node:22-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
# private registry token available only during this RUN; never written to a layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build</pre>
<pre>docker buildx build --secret id=npmrc,src=$HOME/.npmrc -t api:dev .</pre>
<p>Other useful mounts: <code>type=ssh</code> (forward your SSH agent for <code>git clone</code> of private repos), <code>type=bind</code> (read files from another stage or the context without a <code>COPY</code> layer). Cache mount targets per ecosystem: <code>/root/.cache/go-build</code> + <code>/go/pkg/mod</code> (Go), <code>/root/.m2</code> (Maven), <code>/var/cache/apt</code> (apt, with <code>sharing=locked</code>).</p>
<blockquote>⚠️ Production tip: <code>ARG NPM_TOKEN</code> or <code>ENV</code> leaks into image history (<code>docker history --no-trunc</code>) and build provenance. Secrets go in <code>--mount=type=secret</code>, full stop.</blockquote>`,
        he: `<p>BuildKit הוא ה-builder ברירת המחדל מאז Docker Engine 23.0. הוא בונה DAG (שלבים בלתי תלויים רצים במקביל, שלבים שלא בשימוש מדולגים) ומוסיף <code>RUN --mount</code>:</p>
<pre># syntax=docker/dockerfile:1
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
# pip's download cache persists across builds on this builder, but is NOT in the image
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --prefix=/install -r requirements.txt

FROM node:22-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
# private registry token available only during this RUN; never written to a layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build</pre>
<pre>docker buildx build --secret id=npmrc,src=$HOME/.npmrc -t api:dev .</pre>
<p>עוד mounts שימושיים: <code>type=ssh</code> ‏(מעביר את ה-SSH agent שלך בשביל <code>git clone</code> של repos פרטיים), ‏<code>type=bind</code> ‏(קורא קבצים מ-stage אחר או מה-context בלי שכבת <code>COPY</code>). יעדי cache mount לפי אקוסיסטם: <code>/root/.cache/go-build</code> + ‏<code>/go/pkg/mod</code> ‏(Go), ‏<code>/root/.m2</code> ‏(Maven), ‏<code>/var/cache/apt</code> ‏(apt, עם <code>sharing=locked</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>ARG NPM_TOKEN</code> או <code>ENV</code> דולפים להיסטוריה של ה-image ‏(<code>docker history --no-trunc</code>) ול-build provenance. ‏Secrets הולכים ל-<code>--mount=type=secret</code>, נקודה.</blockquote>`
      }
    },
    {
      h: { en: "Layer cache that survives ephemeral CI runners", he: "Cache של שכבות ששורד CI runners זמניים" },
      body: {
        en: `<p>On a hosted CI runner every job starts with an empty Docker cache, so the "order your layers" trick from <em>docker-images</em> buys nothing — unless you export the cache. BuildKit can push it to a registry and pull it back next run:</p>
<pre>docker buildx create --use --name ci --driver docker-container
docker buildx build \
  --cache-from type=registry,ref=$REG/api:buildcache \
  --cache-to   type=registry,ref=$REG/api:buildcache,mode=max \
  -t $REG/api:$GIT_SHA --push .
# GitHub Actions alternative: --cache-from type=gha --cache-to type=gha,mode=max</pre>
<p><code>mode=min</code> (default) exports only layers of the final image; <code>mode=max</code> also exports intermediate stages (the expensive <code>build</code> stage of a multi-stage file) — usually what you want. Note that cache <em>mounts</em> (<code>--mount=type=cache</code>) are <strong>not</strong> exported this way; on ephemeral runners, layer cache does the heavy lifting.</p>
<p>Real numbers from a typical Node + Go monorepo service on GitHub-hosted runners:</p>
<table><tr><th>Setup</th><th>Clean build</th><th>Code-only change</th><th>Dependency change</th></tr>
<tr><td>Classic, no cache export</td><td>9m 40s</td><td>9m 40s</td><td>9m 40s</td></tr>
<tr><td>Layer order fixed + registry cache (mode=max)</td><td>9m 40s</td><td>1m 50s</td><td>5m 10s</td></tr>
<tr><td>+ persistent builder with cache mounts (self-hosted)</td><td>9m 40s</td><td>1m 20s</td><td>2m 05s</td></tr></table>
<blockquote>💡 Real world: a single <code>COPY . .</code> before <code>npm ci</code>, or a <code>.git</code> directory missing from <code>.dockerignore</code>, invalidates everything below it on every commit. <code>docker buildx build --progress=plain</code> shows <code>CACHED</code> per step — read it.</blockquote>`,
        he: `<p>ב-CI runner מנוהל כל ג'וב מתחיל עם cache ריק של Docker, אז הטריק של "תסדר את השכבות" מ-<em>docker-images</em> לא נותן כלום — אלא אם מייצאים את ה-cache. ‏BuildKit יודע לדחוף אותו ל-registry ולמשוך אותו בחזרה בריצה הבאה:</p>
<pre>docker buildx create --use --name ci --driver docker-container
docker buildx build \
  --cache-from type=registry,ref=$REG/api:buildcache \
  --cache-to   type=registry,ref=$REG/api:buildcache,mode=max \
  -t $REG/api:$GIT_SHA --push .
# GitHub Actions alternative: --cache-from type=gha --cache-to type=gha,mode=max</pre>
<p><code>mode=min</code> ‏(ברירת מחדל) מייצא רק שכבות של ה-image הסופי; ‏<code>mode=max</code> מייצא גם stages ביניים (ה-stage היקר של ה-build בקובץ multi-stage) — בדרך כלל זה מה שאתה רוצה. שים לב ש-cache <em>mounts</em> ‏(<code>--mount=type=cache</code>) <strong>לא</strong> מיוצאים ככה; ב-runners זמניים, ה-cache של השכבות עושה את העבודה הכבדה.</p>
<p>מספרים אמיתיים משירות טיפוסי של Node ו-Go ב-monorepo על runners מנוהלים של GitHub:</p>
<table><tr><th>הגדרה</th><th>Build נקי</th><th>שינוי רק בקוד</th><th>שינוי בתלויות</th></tr>
<tr><td>קלאסי, בלי ייצוא cache</td><td>9m 40s</td><td>9m 40s</td><td>9m 40s</td></tr>
<tr><td>סדר שכבות מתוקן + registry cache ‏(mode=max)</td><td>9m 40s</td><td>1m 50s</td><td>5m 10s</td></tr>
<tr><td>+ builder קבוע עם cache mounts ‏(self-hosted)</td><td>9m 40s</td><td>1m 20s</td><td>2m 05s</td></tr></table>
<blockquote>💡 מהשטח: ‏<code>COPY . .</code> אחד לפני <code>npm ci</code>, או תיקיית <code>.git</code> שחסרה ב-<code>.dockerignore</code>, פוסלים את כל מה שמתחתם בכל commit. ‏<code>docker buildx build --progress=plain</code> מראה <code>CACHED</code> לכל שלב — תקרא אותו.</blockquote>`
      }
    },
    {
      h: { en: "Multi-arch: buildx + QEMU vs native ARM runners", he: "Multi-arch: ‏buildx עם QEMU מול runners native של ARM" },
      body: {
        en: `<p>Graviton/Ampere/Axion ARM nodes are often ~20% cheaper for similar performance, so you want images for both <code>linux/amd64</code> and <code>linux/arm64</code> behind one tag (an OCI image index).</p>
<pre># Easy path: emulate arm64 on an amd64 runner via QEMU binfmt
docker run --privileged --rm tonistiigi/binfmt --install arm64
docker buildx build --platform linux/amd64,linux/arm64 -t $REG/api:$GIT_SHA --push .</pre>
<p>QEMU works, but every <code>RUN</code> of the foreign arch is emulated: compiling (Go, Rust, C extensions, <code>npm</code> native modules) is commonly <strong>5-20× slower</strong>. A 4-minute native build becomes 40+ minutes. Better options:</p>
<ul><li><strong>Cross-compile</strong> in a native stage: <code>FROM --platform=$BUILDPLATFORM golang:1.23 AS build</code> + <code>GOOS=$TARGETOS GOARCH=$TARGETARCH go build</code> — the compiler runs native, only the output is arm64.</li>
<li><strong>Native runners per arch</strong>, then stitch: GitHub offers hosted ARM Linux runners (<code>ubuntu-24.04-arm</code>), or attach remote buildx nodes (<code>docker buildx create --append ssh://arm-builder</code>).</li></ul>
<pre># job matrix: build amd64 on x86 runner, arm64 on ARM runner, push by digest, then:
docker buildx imagetools create -t $REG/api:$GIT_SHA \
  $REG/api@sha256:aaa...(amd64)  $REG/api@sha256:bbb...(arm64)</pre>
<blockquote>⚠️ Production tip: verify the index before shipping: <code>docker buildx imagetools inspect $REG/api:$GIT_SHA</code> must list both platforms, or arm64 nodes fail with <code>no match for platform in manifest</code> (or worse, <code>exec format error</code> for a single-arch image mislabeled).</blockquote>`,
        he: `<p>nodes של ARM ‏(Graviton, ‏Ampere, ‏Axion) לרוב זולים בערך ב-20% לביצועים דומים, אז אתה רוצה images גם ל-<code>linux/amd64</code> וגם ל-<code>linux/arm64</code> מאחורי tag אחד (image index של OCI).</p>
<pre># Easy path: emulate arm64 on an amd64 runner via QEMU binfmt
docker run --privileged --rm tonistiigi/binfmt --install arm64
docker buildx build --platform linux/amd64,linux/arm64 -t $REG/api:$GIT_SHA --push .</pre>
<p>QEMU עובד, אבל כל <code>RUN</code> של הארכיטקטורה הזרה רץ באמולציה: קומפילציה (Go, ‏Rust, הרחבות C, מודולים native של <code>npm</code>) לרוב <strong>איטית פי 5-20</strong>. ‏build של 4 דקות native הופך ל-40+ דקות. אפשרויות טובות יותר:</p>
<ul><li><strong>Cross-compile</strong> ב-stage שרץ native: <code>FROM --platform=$BUILDPLATFORM golang:1.23 AS build</code> + ‏<code>GOOS=$TARGETOS GOARCH=$TARGETARCH go build</code> — הקומפיילר רץ native, ורק התוצר הוא arm64.</li>
<li><strong>Runners native לכל ארכיטקטורה</strong>, ואז מחברים: ל-GitHub יש runners מנוהלים של Linux על ARM ‏(<code>ubuntu-24.04-arm</code>), או שמחברים nodes מרוחקים ל-buildx ‏(<code>docker buildx create --append ssh://arm-builder</code>).</li></ul>
<pre># job matrix: build amd64 on x86 runner, arm64 on ARM runner, push by digest, then:
docker buildx imagetools create -t $REG/api:$GIT_SHA \
  $REG/api@sha256:aaa...(amd64)  $REG/api@sha256:bbb...(arm64)</pre>
<blockquote>⚠️ טיפ לפרודקשן: תאמת את ה-index לפני שמשחררים: <code>docker buildx imagetools inspect $REG/api:$GIT_SHA</code> חייב להראות את שתי הפלטפורמות, אחרת nodes של arm64 נכשלים עם <code>no match for platform in manifest</code> ‏(או גרוע יותר, <code>exec format error</code> כש-image של ארכיטקטורה אחת מתויג לא נכון).</blockquote>`
      }
    },
    {
      h: { en: "Rootless builds in CI: no Docker socket", he: "Builds בלי root ב-CI: בלי Docker socket" },
      body: {
        en: `<p>Mounting <code>/var/run/docker.sock</code> into a CI pod, or running Docker-in-Docker with <code>privileged: true</code>, gives every pipeline root on the node. On Kubernetes runners (and on containerd nodes there is no socket anyway), use a daemonless/rootless builder:</p>
<table><tr><th>Tool</th><th>Notes</th></tr>
<tr><td><strong>BuildKit rootless</strong> (<code>moby/buildkit:rootless</code>)</td><td>Same engine as <code>docker buildx</code>, same cache features. Runs as UID 1000 with user namespaces; on k8s typically needs seccomp/AppArmor <code>Unconfined</code>, or <code>--oci-worker-no-process-sandbox</code>. Or run a shared buildkitd Deployment and connect with <code>buildctl --addr tcp://...</code> (mTLS).</td></tr>
<tr><td><strong>Buildah</strong></td><td>Daemonless, Dockerfile-compatible (<code>buildah build</code>), the engine behind <code>podman build</code>. Rootless with <code>/etc/subuid</code> + fuse-overlayfs, or <code>--isolation chroot</code> inside an unprivileged pod.</td></tr>
<tr><td><strong>Kaniko</strong></td><td>Was the go-to for in-cluster builds without privileges. Google archived the upstream repo in 2025; a community/Chainguard-maintained fork continues. Fine to keep running, but evaluate BuildKit or Buildah for new pipelines.</td></tr>
<tr><td><strong>Podman</strong></td><td>Daemonless, rootless-by-default Docker-compatible CLI (<code>alias docker=podman</code>); great on dev machines and VM-based CI runners.</td></tr></table>
<pre># GitLab/any k8s runner: rootless BuildKit, daemonless, push with registry cache
buildctl-daemonless.sh build \
  --frontend dockerfile.v0 --local context=. --local dockerfile=. \
  --output type=image,name=$REG/api:$GIT_SHA,push=true \
  --export-cache type=registry,ref=$REG/api:buildcache,mode=max \
  --import-cache type=registry,ref=$REG/api:buildcache</pre>
<blockquote>💡 Real world: a common platform setup is one dedicated buildkitd pool (on its own nodes, with persistent cache volumes) shared by all pipelines over mTLS — fast warm caches and no privileged CI pods.</blockquote>`,
        he: `<p>Mount של <code>/var/run/docker.sock</code> לתוך pod של CI, או הרצת Docker-in-Docker עם <code>privileged: true</code>, נותן לכל pipeline הרשאות root על ה-node. ב-runners על Kubernetes ‏(וב-nodes עם containerd אין socket בכלל), משתמשים ב-builder בלי daemon ובלי root:</p>
<table><tr><th>כלי</th><th>הערות</th></tr>
<tr><td><strong>BuildKit rootless</strong> ‏(<code>moby/buildkit:rootless</code>)</td><td>אותו מנוע כמו <code>docker buildx</code>, אותן יכולות cache. רץ כ-UID 1000 עם user namespaces; ב-k8s בדרך כלל צריך seccomp או AppArmor במצב <code>Unconfined</code>, או <code>--oci-worker-no-process-sandbox</code>. אפשר גם להריץ Deployment משותף של buildkitd ולהתחבר עם <code>buildctl --addr tcp://...</code> ‏(mTLS).</td></tr>
<tr><td><strong>Buildah</strong></td><td>בלי daemon, תואם Dockerfile ‏(<code>buildah build</code>), המנוע שמאחורי <code>podman build</code>. בלי root עם <code>/etc/subuid</code> ו-fuse-overlayfs, או <code>--isolation chroot</code> בתוך pod בלי הרשאות.</td></tr>
<tr><td><strong>Kaniko</strong></td><td>היה הבחירה הקלאסית ל-builds בתוך ה-cluster בלי הרשאות. ‏Google העבירו את ה-repo המקורי לארכיון ב-2025; ‏fork שמתוחזק ע"י הקהילה ו-Chainguard ממשיך. אפשר להמשיך להריץ, אבל ל-pipelines חדשים כדאי לבחון BuildKit או Buildah.</td></tr>
<tr><td><strong>Podman</strong></td><td>CLI תואם Docker, בלי daemon ובלי root כברירת מחדל (<code>alias docker=podman</code>); מעולה על מחשבי פיתוח וב-CI runners שרצים על VMs.</td></tr></table>
<pre># GitLab/any k8s runner: rootless BuildKit, daemonless, push with registry cache
buildctl-daemonless.sh build \
  --frontend dockerfile.v0 --local context=. --local dockerfile=. \
  --output type=image,name=$REG/api:$GIT_SHA,push=true \
  --export-cache type=registry,ref=$REG/api:buildcache,mode=max \
  --import-cache type=registry,ref=$REG/api:buildcache</pre>
<blockquote>💡 מהשטח: setup נפוץ בפלטפורמות הוא pool ייעודי של buildkitd ‏(על nodes משלו, עם volumes קבועים ל-cache) שכל ה-pipelines חולקים דרך mTLS — ‏cache חם ומהיר ובלי pods של CI עם privileged.</blockquote>`
      }
    },
    {
      h: { en: "Reproducible builds and provenance", he: "Builds שאפשר לשחזר ו-provenance" },
      body: {
        en: `<p>Reproducible = same source → same image digest. It lets you verify that the image in prod really came from commit <code>3f9a2c1</code>, and it means a deleted image can be rebuilt bit-for-bit. The usual sources of drift and their fixes:</p>
<ul><li><strong>Floating base images</strong> → pin <code>FROM python:3.12-slim@sha256:...</code> and let Renovate/Dependabot bump the digest via PRs.</li>
<li><strong>Unpinned packages</strong> → lockfiles (<code>package-lock.json</code>, <code>poetry.lock</code>, <code>go.sum</code>); <code>npm ci</code> not <code>npm install</code>; avoid <code>apt-get upgrade</code> in the Dockerfile.</li>
<li><strong>Timestamps</strong> → set <code>SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)</code>; recent BuildKit can rewrite file timestamps in layers (<code>--output type=image,rewrite-timestamp=true</code>).</li></ul>
<p>Attach supply-chain metadata at build time — BuildKit generates SLSA <strong>provenance</strong> and an <strong>SBOM</strong> as attestations stored next to the image in the registry, and you can sign the digest with cosign:</p>
<pre>docker buildx build --provenance=mode=max --sbom=true -t $REG/api:$GIT_SHA --push .
cosign sign --yes $REG/api@sha256:9b2e...c41d       # keyless via OIDC in CI</pre>
<blockquote>⚠️ Production tip: <code>--provenance=mode=max</code> records build args. One more reason secrets never go in <code>ARG</code>.</blockquote>`,
        he: `<p>Reproducible = אותו מקור ← אותו digest של image. זה מאפשר לאמת שה-image בפרודקשן באמת הגיע מ-commit ‏<code>3f9a2c1</code>, וזה אומר ש-image שנמחק אפשר לבנות מחדש עד הביט. המקורות הנפוצים לסטייה והתיקונים שלהם:</p>
<ul><li><strong>Base images שזזים</strong> ← נועלים <code>FROM python:3.12-slim@sha256:...</code> ונותנים ל-Renovate או Dependabot לעדכן את ה-digest דרך PRs.</li>
<li><strong>חבילות לא נעולות</strong> ← lockfiles ‏(<code>package-lock.json</code>, ‏<code>poetry.lock</code>, ‏<code>go.sum</code>); ‏<code>npm ci</code> ולא <code>npm install</code>; להימנע מ-<code>apt-get upgrade</code> ב-Dockerfile.</li>
<li><strong>Timestamps</strong> ← מגדירים <code>SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)</code>; גרסאות חדשות של BuildKit יודעות לשכתב timestamps של קבצים בשכבות (<code>--output type=image,rewrite-timestamp=true</code>).</li></ul>
<p>מצרפים metadata של supply chain בזמן ה-build — ‏BuildKit מייצר <strong>provenance</strong> של SLSA ו-<strong>SBOM</strong> בתור attestations שנשמרים ליד ה-image ב-registry, ואפשר לחתום על ה-digest עם cosign:</p>
<pre>docker buildx build --provenance=mode=max --sbom=true -t $REG/api:$GIT_SHA --push .
cosign sign --yes $REG/api@sha256:9b2e...c41d       # keyless via OIDC in CI</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>--provenance=mode=max</code> מתעד את ה-build args. עוד סיבה לכך ש-secrets אף פעם לא נכנסים ל-<code>ARG</code>.</blockquote>`
      }
    }
  ],
  diagram: `  git push -> CI runner (ephemeral, no docker.sock)
                 |  buildkitd (rootless) / buildx
                 |   --cache-from registry:buildcache  <-- previous run's layers
                 |   RUN --mount=type=cache  (pip/npm/go caches)
                 |   RUN --mount=type=secret (token never in a layer)
                 v
     amd64 runner ---build---> api@sha256:aaa
     arm64 runner ---build---> api@sha256:bbb      (or QEMU: 5-20x slower)
                 \\______ imagetools create ______/
                              api:3f9a2c1 (index) + SBOM + provenance + cosign signature`,
  handsOn: [
    { cmd: "docker buildx build --progress=plain -t test . 2>&1 | grep -E 'CACHED|DONE'", what: { en: "See which steps hit the cache and which rebuilt — find the line that busts it.", he: "לראות אילו שלבים פגעו ב-cache ואילו נבנו מחדש — למצוא את השורה ששוברת אותו." } },
    { cmd: "docker buildx build --secret id=npmrc,src=$HOME/.npmrc -t test . && docker history --no-trunc test | grep -i npmrc", what: { en: "Prove the secret mount leaves no trace in image history.", he: "להוכיח שה-secret mount לא משאיר עקבות בהיסטוריה של ה-image." } },
    { cmd: "docker buildx build --platform linux/amd64,linux/arm64 -t $REG/test:multi --push . && docker buildx imagetools inspect $REG/test:multi", what: { en: "Build a multi-arch image and inspect the index for both platforms.", he: "לבנות image מרובה ארכיטקטורות ולבדוק שה-index מכיל את שתי הפלטפורמות." } },
    { cmd: "docker buildx du && docker buildx prune --filter until=72h", what: { en: "Check and trim the builder's cache usage on a self-hosted runner.", he: "לבדוק ולקצץ את השימוש ב-cache של ה-builder על runner שהוא self-hosted." } }
  ],
  mnemonic: {
    en: "\"Cache it, mount it, ship it from the registry.\" Secrets mount, never ARG; cross-compile, don't emulate; no socket in CI.",
    he: "\"Cache, ‏mount, ומה-registry.\" Secrets ב-mount, אף פעם לא ב-ARG; ‏cross-compile, לא אמולציה; בלי socket ב-CI."
  },
  pitfalls: [
    { en: "Expecting --mount=type=cache to speed up builds on ephemeral hosted runners — the cache mount lives on the builder and is gone next job; export layer cache to a registry or use a persistent builder.", he: "לצפות ש-‎--mount=type=cache יאיץ builds על runners מנוהלים זמניים — ה-cache mount חי על ה-builder ונעלם בג'וב הבא; תייצא cache של שכבות ל-registry או תשתמש ב-builder קבוע." },
    { en: "Passing tokens with ARG/ENV: they end up in image history and provenance attestations.", he: "להעביר tokens עם ARG או ENV: הם נגמרים בהיסטוריה של ה-image וב-attestations של provenance." },
    { en: "Building arm64 under QEMU for a compiled language and accepting 45-minute pipelines — cross-compile with $BUILDPLATFORM or use native ARM runners.", he: "לבנות arm64 תחת QEMU לשפה מקומפלת ולהשלים עם pipelines של 45 דקות — תעשה cross-compile עם ‎$BUILDPLATFORM או תשתמש ב-runners native של ARM." },
    { en: "Privileged Docker-in-Docker or docker.sock mounts in shared CI: any pipeline (or malicious PR) can take over the node.", he: "Docker-in-Docker עם privileged או mount ל-docker.sock ב-CI משותף: כל pipeline (או PR זדוני) יכול להשתלט על ה-node." }
  ],
  interview: [
    {
      q: { en: "Our Docker builds take 12 minutes in CI on every commit. How do you bring that down?", he: "ה-builds של Docker לוקחים אצלנו 12 דקות ב-CI בכל commit. איך מורידים את זה?" },
      a: { en: "Measure first with --progress=plain to see which step rebuilds. Fix layer order (copy lockfiles, install deps, then copy source), tighten .dockerignore, split into multi-stage so stages run in parallel. Export BuildKit cache to the registry (mode=max) or the CI cache backend so ephemeral runners start warm. Use cache mounts on a persistent builder pool. For multi-arch, stop emulating compile steps: cross-compile or use native runners. Typical result: code-only commits drop to 1-2 minutes.", he: "קודם מודדים עם ‎--progress=plain כדי לראות איזה שלב נבנה מחדש. מתקנים את סדר השכבות (להעתיק lockfiles, להתקין תלויות, ורק אז להעתיק קוד), מהדקים את .dockerignore, מפצלים ל-multi-stage כדי ש-stages ירוצו במקביל. מייצאים את ה-cache של BuildKit ל-registry ‏(mode=max) או ל-cache של ה-CI כדי ש-runners זמניים יתחילו חמים. משתמשים ב-cache mounts על pool קבוע של builders. ל-multi-arch, מפסיקים להריץ קומפילציה באמולציה: ‏cross-compile או runners native. תוצאה טיפוסית: commits של קוד בלבד יורדים ל-1-2 דקות." }
    },
    {
      q: { en: "How do you build images inside Kubernetes CI runners without privileged pods?", he: "איך בונים images בתוך CI runners על Kubernetes בלי pods עם privileged?" },
      a: { en: "Use a rootless, daemonless builder: BuildKit rootless (buildctl-daemonless or a shared buildkitd over mTLS), or Buildah with chroot isolation. Kaniko was the classic answer but its upstream was archived in 2025, so new setups lean to BuildKit/Buildah. Never mount docker.sock. Push with registry cache, and generate SBOM/provenance and sign by digest in the same pipeline.", he: "משתמשים ב-builder בלי root ובלי daemon: ‏BuildKit rootless ‏(buildctl-daemonless או buildkitd משותף דרך mTLS), או Buildah עם בידוד chroot. ‏Kaniko היה התשובה הקלאסית אבל ה-repo המקורי שלו עבר לארכיון ב-2025, אז setups חדשים נוטים ל-BuildKit או Buildah. אף פעם לא עושים mount ל-docker.sock. דוחפים עם registry cache, ובאותו pipeline מייצרים SBOM ו-provenance וחותמים לפי digest." }
    }
  ],
  quiz: [
    {
      q: { en: "Which is the right way to give 'npm ci' a private registry token during a build?", he: "מה הדרך הנכונה לתת ל-npm ci token של registry פרטי בזמן build?" },
      options: [
        { en: "ARG NPM_TOKEN and --build-arg", he: "ARG NPM_TOKEN ו-‎--build-arg" },
        { en: "COPY .npmrc then RUN rm .npmrc", he: "COPY .npmrc ואז RUN rm .npmrc" },
        { en: "RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci", he: "RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci" },
        { en: "ENV NPM_TOKEN in the Dockerfile", he: "ENV NPM_TOKEN ב-Dockerfile" }
      ],
      answer: 2,
      explain: { en: "Secret mounts exist only for that RUN and are never written to a layer. COPY+rm still leaves the file in the earlier layer; ARG/ENV show up in history/provenance.", he: "Secret mounts קיימים רק לאותו RUN ואף פעם לא נכתבים לשכבה. ‏COPY ואחריו rm עדיין משאיר את הקובץ בשכבה הקודמת; ‏ARG ו-ENV מופיעים בהיסטוריה וב-provenance." }
    },
    {
      q: { en: "On GitHub-hosted runners, builds never hit the cache even though the Dockerfile is well-ordered. Why?", he: "על runners מנוהלים של GitHub, ה-builds אף פעם לא פוגעים ב-cache למרות שה-Dockerfile מסודר טוב. למה?" },
      options: [
        { en: "BuildKit doesn't support caching", he: "BuildKit לא תומך ב-cache" },
        { en: "Each job starts on a fresh runner with an empty cache unless you use --cache-from/--cache-to", he: "כל ג'וב מתחיל על runner חדש עם cache ריק, אלא אם משתמשים ב-‎--cache-from/--cache-to" },
        { en: "Layer caching only works for multi-arch images", he: "Cache של שכבות עובד רק ל-images מרובי ארכיטקטורות" },
        { en: "The registry rejects cached layers", he: "ה-registry דוחה שכבות מה-cache" }
      ],
      answer: 1,
      explain: { en: "Ephemeral runners lose local state. Export cache to the registry (type=registry, mode=max) or the GHA backend (type=gha) and import it next run.", he: "Runners זמניים מאבדים state מקומי. מייצאים cache ל-registry ‏(type=registry, ‏mode=max) או ל-backend של GHA ‏(type=gha) ומייבאים אותו בריצה הבאה." }
    },
    {
      q: { en: "Your arm64 build of a Go service takes 40 minutes under QEMU. Best fix?", he: "ה-build של arm64 לשירות Go לוקח 40 דקות תחת QEMU. מה התיקון הכי טוב?" },
      options: [
        { en: "Give the runner more RAM", he: "לתת ל-runner יותר RAM" },
        { en: "Drop arm64 support", he: "לוותר על תמיכה ב-arm64" },
        { en: "Cross-compile in a $BUILDPLATFORM stage with GOARCH=$TARGETARCH, or build on a native ARM runner", he: "לעשות cross-compile ב-stage של ‎$BUILDPLATFORM עם GOARCH=$TARGETARCH, או לבנות על runner native של ARM" },
        { en: "Use imagePullPolicy: Always", he: "להשתמש ב-imagePullPolicy: Always" }
      ],
      answer: 2,
      explain: { en: "Go cross-compiles trivially: the compiler runs natively and only the binary targets arm64. For languages that can't, use native runners and merge with imagetools create.", he: "Go עושה cross-compile בקלות: הקומפיילר רץ native ורק הבינארי מכוון ל-arm64. לשפות שלא יכולות, משתמשים ב-runners native ומחברים עם imagetools create." }
    }
  ],
  related: ["docker-images", "container-slim-images", "container-registries", "cloud-cicd", "staff-supply-chain", "flow-commit-to-prod"]
});

/* ============================== SLIM & HARDENED IMAGES ============================== */
INFRA.lessons.push({
  id: "container-slim-images",
  track: "containers",
  order: 23,
  icon: "🪶",
  level: 2,
  minutes: 12,
  title: { en: "Slim & hardened images: distroless, Wolfi, scratch, and CVE triage", he: "Images רזים ומוקשחים: distroless, ‏Wolfi, ‏scratch וטריאז' של CVEs" },
  tldr: {
    en: "Ship only what the process needs: a static binary on scratch, a runtime on distroless/Chainguard/chiseled, or a slim Debian base — run as non-root with a read-only rootfs, debug with ephemeral containers instead of a shell, and triage scanner output by fixability and reachability, not raw count.",
    he: "שולחים רק מה שהתהליך צריך: בינארי סטטי על scratch, ‏runtime על distroless, ‏Chainguard או chiseled, או base רזה של Debian — מריצים כ-non-root עם rootfs לקריאה בלבד, מדבגים עם ephemeral containers במקום shell, ועושים טריאז' לפלט של הסורק לפי האם יש תיקון והאם הקוד נגיש, לא לפי המספר הגולמי."
  },
  analogy: {
    en: "A full base image is moving house with every drawer and junk box \"just in case\" — every box is something a burglar can use. A slim image is packing a carry-on: only what you'll actually use on this trip. And when you need a screwdriver at the destination, you don't pack one forever — you borrow one from the neighbor for ten minutes (kubectl debug).",
    he: "Base image מלא זה לעבור דירה עם כל מגירה וכל קופסת זבל \"ליתר ביטחון\" — כל קופסה היא משהו שפורץ יכול להשתמש בו. image רזה זה לארוז טרולי: רק מה שבאמת תשתמש בו בטיול הזה. וכשאתה צריך מברג ביעד, אתה לא סוחב אחד לתמיד — אתה שואל מהשכן לעשר דקות (kubectl debug)."
  },
  sections: [
    {
      h: { en: "The menu of minimal bases", he: "התפריט של base images מינימליים" },
      body: {
        en: `<table><tr><th>Base</th><th>What's inside</th><th>Typical size</th><th>Use for</th></tr>
<tr><td><code>scratch</code></td><td>Nothing — empty filesystem</td><td>= your binary (5-20 MB)</td><td>Static Go/Rust binaries</td></tr>
<tr><td><code>gcr.io/distroless/static-debian12</code></td><td>CA certs, tzdata, <code>/etc/passwd</code> with <code>nonroot</code> (65532)</td><td>~2 MB</td><td>Static binaries that need TLS/timezones</td></tr>
<tr><td><code>gcr.io/distroless/base-debian12</code>, <code>java21-debian12</code>, <code>nodejs22-debian12</code>, <code>python3-debian12</code></td><td>glibc (+ runtime), no shell, no package manager</td><td>~20-200 MB</td><td>Dynamically linked apps, JVM, Node, Python</td></tr>
<tr><td><strong>Chainguard images</strong> (<code>cgr.dev/chainguard/*</code>)</td><td>Built on <strong>Wolfi</strong> (glibc "undistro"), rebuilt daily, SBOM + signatures; <code>-dev</code> variants include a shell/apk</td><td>Small</td><td>Low-CVE production bases (free tier offers limited tags; pinned versions are commercial)</td></tr>
<tr><td><strong>Ubuntu chiseled</strong></td><td>Ubuntu packages sliced to only needed files with <code>chisel</code>; no shell</td><td>Small</td><td>.NET (Microsoft ships <code>-chiseled</code> tags), Ubuntu-standardized orgs</td></tr>
<tr><td><code>*-slim</code> (Debian)</td><td>Debian minus docs/extras; has shell + apt</td><td>~75-150 MB</td><td>Default pragmatic choice</td></tr>
<tr><td><code>alpine</code></td><td>BusyBox + apk + <strong>musl</strong> libc</td><td>~8 MB</td><td>Small tools; be careful with glibc-assuming apps</td></tr></table>
<p>Illustrative sizes for the same Node app: <code>node:22</code> ~1.1 GB, <code>node:22-slim</code> ~240 MB, distroless nodejs ~170 MB. Python: <code>python:3.12</code> ~1 GB vs <code>-slim</code> ~150 MB. Go on <code>scratch</code>: 12 MB.</p>
<pre># Go on scratch: static binary + certs + non-root user
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM scratch
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /out/api /api
USER 65532:65532
ENTRYPOINT ["/api"]</pre>
<blockquote>⚠️ Production tip: on <code>scratch</code> there are no CA certs (TLS fails with <code>x509: certificate signed by unknown authority</code>), no <code>/etc/passwd</code>, no tzdata (<code>time.LoadLocation</code> fails — embed with <code>import _ "time/tzdata"</code>). <code>distroless/static</code> solves all three.</blockquote>`,
        he: `<table><tr><th>Base</th><th>מה יש בפנים</th><th>גודל טיפוסי</th><th>מתאים ל-</th></tr>
<tr><td><code>scratch</code></td><td>כלום — filesystem ריק</td><td>= הבינארי שלך (5-20 MB)</td><td>בינאריים סטטיים של Go או Rust</td></tr>
<tr><td><code>gcr.io/distroless/static-debian12</code></td><td>CA certs, ‏tzdata, ‏<code>/etc/passwd</code> עם <code>nonroot</code> ‏(65532)</td><td>בערך 2 MB</td><td>בינאריים סטטיים שצריכים TLS או timezones</td></tr>
<tr><td><code>gcr.io/distroless/base-debian12</code>, ‏<code>java21-debian12</code>, ‏<code>nodejs22-debian12</code>, ‏<code>python3-debian12</code></td><td>glibc (+ runtime), בלי shell, בלי מנהל חבילות</td><td>בערך 20-200 MB</td><td>אפליקציות עם linking דינמי, ‏JVM, ‏Node, ‏Python</td></tr>
<tr><td><strong>Chainguard images</strong> ‏(<code>cgr.dev/chainguard/*</code>)</td><td>בנויים על <strong>Wolfi</strong> ‏("undistro" עם glibc), נבנים מחדש כל יום, עם SBOM וחתימות; גרסאות <code>-dev</code> כוללות shell ו-apk</td><td>קטן</td><td>bases לפרודקשן עם מעט CVEs ‏(ה-tier החינמי נותן tags מוגבלים; גרסאות נעולות הן מסחריות)</td></tr>
<tr><td><strong>Ubuntu chiseled</strong></td><td>חבילות Ubuntu שנחתכו רק לקבצים הנחוצים עם <code>chisel</code>; בלי shell</td><td>קטן</td><td>.NET ‏(Microsoft מפרסמים tags של <code>-chiseled</code>), ארגונים שמתוקננים על Ubuntu</td></tr>
<tr><td><code>*-slim</code> ‏(Debian)</td><td>Debian בלי docs ותוספות; יש shell ו-apt</td><td>בערך 75-150 MB</td><td>הבחירה הפרגמטית כברירת מחדל</td></tr>
<tr><td><code>alpine</code></td><td>BusyBox, ‏apk ו-libc של <strong>musl</strong></td><td>בערך 8 MB</td><td>כלים קטנים; זהירות עם אפליקציות שמניחות glibc</td></tr></table>
<p>גדלים להמחשה לאותה אפליקציית Node: ‏<code>node:22</code> בערך 1.1 GB, ‏<code>node:22-slim</code> בערך 240 MB, ‏distroless של nodejs בערך 170 MB. ב-Python: ‏<code>python:3.12</code> בערך 1 GB מול <code>-slim</code> בערך 150 MB. ‏Go על <code>scratch</code>: ‏12 MB.</p>
<pre># Go on scratch: static binary + certs + non-root user
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM scratch
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /out/api /api
USER 65532:65532
ENTRYPOINT ["/api"]</pre>
<blockquote>⚠️ טיפ לפרודקשן: ב-<code>scratch</code> אין CA certs ‏(TLS נכשל עם <code>x509: certificate signed by unknown authority</code>), אין <code>/etc/passwd</code>, ואין tzdata ‏(<code>time.LoadLocation</code> נכשל — מטמיעים עם <code>import _ "time/tzdata"</code>). ‏<code>distroless/static</code> פותר את שלושתם.</blockquote>`
      }
    },
    {
      h: { en: "Alpine and musl: the gotchas", he: "Alpine ו-musl: המלכודות" },
      body: {
        en: `<p>Alpine is tiny because it uses <strong>musl</strong> libc and BusyBox instead of glibc and GNU coreutils. That's fine for static tools, but bites real apps:</p>
<ul><li><strong>Prebuilt binaries/wheels</strong>: Python <code>manylinux</code> wheels target glibc. On Alpine pip falls back to <code>musllinux</code> wheels if they exist — otherwise it compiles from source (needs gcc, takes minutes, image grows). Same for Node native modules and some JDK builds.</li>
<li><strong>DNS</strong>: musl's resolver behaves differently from glibc — it queries all nameservers in parallel, and before musl 1.2.4 (Alpine 3.18) it had no TCP fallback, so DNS answers larger than 512 bytes (big SRV/TXT records, many A records) failed. Combined with Kubernetes <code>ndots:5</code> search domains it produces confusing intermittent lookup failures.</li>
<li><strong>Performance</strong>: musl's default malloc can be noticeably slower for allocation-heavy, multi-threaded workloads; teams sometimes swap in jemalloc/mimalloc or move to a glibc base.</li>
<li><strong>Locale/iconv</strong> and other glibc-specific behaviors differ subtly.</li></ul>
<pre>$ docker run --rm python:3.12-alpine pip install pandas 2>&amp;1 | tail -2
# without a musllinux wheel: "Building wheel for pandas (pyproject.toml) ..." for minutes
$ docker run --rm python:3.12-slim pip install pandas 2>&amp;1 | tail -1
Successfully installed numpy-... pandas-...     # seconds, prebuilt manylinux wheel</pre>
<blockquote>💡 Real world: if you want small and glibc, pick distroless, Chainguard (Wolfi is glibc-based) or Debian slim. Choose Alpine deliberately, not by default.</blockquote>`,
        he: `<p>Alpine קטן כי הוא משתמש ב-libc של <strong>musl</strong> וב-BusyBox במקום glibc ו-GNU coreutils. זה בסדר לכלים סטטיים, אבל נושך אפליקציות אמיתיות:</p>
<ul><li><strong>בינאריים ו-wheels מוכנים מראש</strong>: wheels של <code>manylinux</code> ב-Python מכוונים ל-glibc. על Alpine ה-pip נופל ל-wheels של <code>musllinux</code> אם הם קיימים — ואחרת הוא מקמפל מהמקור (צריך gcc, לוקח דקות, ה-image גדל). אותו דבר למודולים native של Node ולחלק מה-builds של JDK.</li>
<li><strong>DNS</strong>: ה-resolver של musl מתנהג אחרת מזה של glibc — הוא שואל את כל ה-nameservers במקביל, ולפני musl 1.2.4 ‏(Alpine 3.18) לא היה לו fallback ל-TCP, אז תשובות DNS גדולות מ-512 בייט (רשומות SRV/TXT גדולות, הרבה רשומות A) נכשלו. ביחד עם search domains ו-<code>ndots:5</code> של Kubernetes זה יוצר כישלוני lookup לסירוגין שקשה להבין.</li>
<li><strong>ביצועים</strong>: ה-malloc ברירת המחדל של musl יכול להיות איטי בצורה מורגשת לעומסים מרובי threads שמקצים הרבה זיכרון; צוותים לפעמים מחליפים ל-jemalloc או mimalloc או עוברים ל-base עם glibc.</li>
<li><strong>Locale ו-iconv</strong> והתנהגויות אחרות שספציפיות ל-glibc שונות בדקויות.</li></ul>
<pre>$ docker run --rm python:3.12-alpine pip install pandas 2>&amp;1 | tail -2
# without a musllinux wheel: "Building wheel for pandas (pyproject.toml) ..." for minutes
$ docker run --rm python:3.12-slim pip install pandas 2>&amp;1 | tail -1
Successfully installed numpy-... pandas-...     # seconds, prebuilt manylinux wheel</pre>
<blockquote>💡 מהשטח: אם אתה רוצה קטן וגם glibc, תבחר distroless, ‏Chainguard ‏(Wolfi מבוסס glibc) או Debian slim. בוחרים Alpine בכוונה, לא כברירת מחדל.</blockquote>`
      }
    },
    {
      h: { en: "Size vs attack surface: what the CVE count really says", he: "גודל מול שטח תקיפה: מה מספר ה-CVEs באמת אומר" },
      body: {
        en: `<p>An illustrative Trivy run against bases for the same app (numbers move weekly — run it yourself):</p>
<table><tr><th>Image</th><th>Packages</th><th>CVEs (all)</th><th>HIGH+CRITICAL</th></tr>
<tr><td><code>node:22</code> (Debian full)</td><td>~400+</td><td>hundreds</td><td>dozens</td></tr>
<tr><td><code>node:22-slim</code></td><td>~100</td><td>tens</td><td>a few</td></tr>
<tr><td>distroless nodejs22</td><td>~20</td><td>a handful</td><td>usually 0-2</td></tr>
<tr><td>Chainguard node</td><td>~15</td><td>often 0</td><td>often 0</td></tr></table>
<p>Fewer packages means fewer CVEs to triage and fewer tools for an attacker (no <code>sh</code>, <code>curl</code>, <code>apt</code>). But the count is not the risk: most CVEs in a full image are LOW, unfixed, or in packages your process never loads. Size also matters operationally: smaller images pull faster on every scale-up and node replacement.</p>
<p>Harden at runtime too — slim image + locked-down pod:</p>
<pre>securityContext:            # container level
  runAsNonRoot: true
  runAsUser: 65532
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
  seccompProfile: { type: RuntimeDefault }
volumeMounts:
- { name: tmp, mountPath: /tmp }    # apps that need scratch space get an emptyDir
volumes:
- { name: tmp, emptyDir: { sizeLimit: 256Mi } }</pre>
<blockquote>⚠️ Production tip: <code>runAsNonRoot: true</code> with an image whose <code>USER</code> is a name (not numeric) fails with <code>container has runAsNonRoot and image has non-numeric user</code>. Use <code>USER 65532</code> or set <code>runAsUser</code>.</blockquote>`,
        he: `<p>הרצה להמחשה של Trivy מול bases שונים לאותה אפליקציה (המספרים זזים כל שבוע — תריץ בעצמך):</p>
<table><tr><th>Image</th><th>חבילות</th><th>CVEs ‏(הכל)</th><th>HIGH+CRITICAL</th></tr>
<tr><td><code>node:22</code> ‏(Debian מלא)</td><td>בערך 400+</td><td>מאות</td><td>עשרות</td></tr>
<tr><td><code>node:22-slim</code></td><td>בערך 100</td><td>עשרות</td><td>כמה</td></tr>
<tr><td>distroless nodejs22</td><td>בערך 20</td><td>קומץ</td><td>בדרך כלל 0-2</td></tr>
<tr><td>Chainguard node</td><td>בערך 15</td><td>הרבה פעמים 0</td><td>הרבה פעמים 0</td></tr></table>
<p>פחות חבילות זה פחות CVEs לטריאז' ופחות כלים לתוקף (אין <code>sh</code>, ‏<code>curl</code>, ‏<code>apt</code>). אבל המספר הוא לא הסיכון: רוב ה-CVEs ב-image מלא הם LOW, בלי תיקון, או בחבילות שהתהליך שלך אף פעם לא טוען. גם לגודל יש משמעות תפעולית: images קטנים נמשכים מהר יותר בכל scale-up ובכל החלפת node.</p>
<p>מקשיחים גם ב-runtime — image רזה ו-pod נעול:</p>
<pre>securityContext:            # container level
  runAsNonRoot: true
  runAsUser: 65532
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
  seccompProfile: { type: RuntimeDefault }
volumeMounts:
- { name: tmp, mountPath: /tmp }    # apps that need scratch space get an emptyDir
volumes:
- { name: tmp, emptyDir: { sizeLimit: 256Mi } }</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>runAsNonRoot: true</code> עם image שה-<code>USER</code> שלו הוא שם (לא מספר) נכשל עם <code>container has runAsNonRoot and image has non-numeric user</code>. תשתמש ב-<code>USER 65532</code> או תגדיר <code>runAsUser</code>.</blockquote>`
      }
    },
    {
      h: { en: "Debugging an image with no shell", he: "לדבג image בלי shell" },
      body: {
        en: `<p>"But how do I debug it?" is the #1 objection to distroless. Answer: you don't put tools in the image; you <strong>attach</strong> them when needed with an <strong>ephemeral container</strong> (GA since Kubernetes 1.25) that shares the pod's namespaces:</p>
<pre>$ kubectl exec -it api-7d9f-x2k -- sh
error: ... exec: "sh": executable file not found in $PATH

# attach a debug container that targets the app container's process namespace
$ kubectl debug -it api-7d9f-x2k --image=busybox:1.36 --target=api -- sh
/ # ps aux                       # sees the app's processes
PID   USER     COMMAND
    1 65532    /api
/ # ls /proc/1/root/etc/ssl/certs   # browse the app's filesystem via /proc
/ # wget -qO- localhost:8080/healthz

# copy the pod with a different image/command (e.g. to start it without crashing)
$ kubectl debug api-7d9f-x2k -it --copy-to=api-debug --container=api --image=cgr.dev/chainguard/node:latest-dev -- sh

# debug the node itself (host fs mounted at /host)
$ kubectl debug node/ip-10-0-11-87 -it --image=ubuntu:24.04</pre>
<p>Other options: distroless <code>:debug</code> tags include a BusyBox shell (use in staging only); Chainguard <code>-dev</code> variants include a shell and apk; <code>nsenter</code> from the node for platform engineers.</p>
<blockquote>💡 Real world: ephemeral containers can't be removed until the pod is deleted, and they ignore resource limits by default — fine for debugging, but restrict <code>pods/ephemeralcontainers</code> in RBAC to the people who should do it.</blockquote>`,
        he: `<p>"אבל איך אני מדבג את זה?" היא ההתנגדות מספר 1 ל-distroless. התשובה: לא שמים כלים ב-image; <strong>מחברים</strong> אותם כשצריך עם <strong>ephemeral container</strong> ‏(GA מאז Kubernetes 1.25) שחולק את ה-namespaces של ה-pod:</p>
<pre>$ kubectl exec -it api-7d9f-x2k -- sh
error: ... exec: "sh": executable file not found in $PATH

# attach a debug container that targets the app container's process namespace
$ kubectl debug -it api-7d9f-x2k --image=busybox:1.36 --target=api -- sh
/ # ps aux                       # sees the app's processes
PID   USER     COMMAND
    1 65532    /api
/ # ls /proc/1/root/etc/ssl/certs   # browse the app's filesystem via /proc
/ # wget -qO- localhost:8080/healthz

# copy the pod with a different image/command (e.g. to start it without crashing)
$ kubectl debug api-7d9f-x2k -it --copy-to=api-debug --container=api --image=cgr.dev/chainguard/node:latest-dev -- sh

# debug the node itself (host fs mounted at /host)
$ kubectl debug node/ip-10-0-11-87 -it --image=ubuntu:24.04</pre>
<p>אפשרויות נוספות: ל-distroless יש tags של <code>:debug</code> עם shell של BusyBox (רק ב-staging); לגרסאות <code>-dev</code> של Chainguard יש shell ו-apk; ו-<code>nsenter</code> מה-node למהנדסי פלטפורמה.</p>
<blockquote>💡 מהשטח: אי אפשר להסיר ephemeral containers עד שה-pod נמחק, והם מתעלמים מ-resource limits כברירת מחדל — בסדר לדיבוג, אבל תגביל את <code>pods/ephemeralcontainers</code> ב-RBAC לאנשים שאמורים לעשות את זה.</blockquote>`
      }
    },
    {
      h: { en: "Scanning with Trivy/Grype and triaging CVEs", he: "סריקה עם Trivy או Grype וטריאז' של CVEs" },
      body: {
        en: `<pre>$ trivy image --severity HIGH,CRITICAL --ignore-unfixed $REG/api:3f9a2c1
$REG/api:3f9a2c1 (debian 12.8)
Total: 2 (HIGH: 1, CRITICAL: 1)
┌──────────┬────────────────┬──────────┬───────────────────┬───────────────┐
│ Library  │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │
├──────────┼────────────────┼──────────┼───────────────────┼───────────────┤
│ libssl3  │ CVE-2024-XXXXX │ CRITICAL │ 3.0.14-1~deb12u2  │ 3.0.15-1~deb12u1 │
│ zlib1g   │ CVE-2023-XXXXX │ HIGH     │ 1:1.2.13.dfsg-1   │ 1:1.2.13.dfsg-1+deb12u1 │
└──────────┴────────────────┴──────────┴───────────────────┴───────────────┘
$ grype $REG/api:3f9a2c1 --only-fixed --fail-on high      # alternative scanner, CI gate</pre>
<p>A triage flow that keeps the team sane:</p>
<ol><li><strong>Fixable?</strong> If a fixed version exists, the fix is usually "rebuild on the latest patched base" — automate weekly rebuilds and Renovate base-digest PRs. Gate CI on fixable HIGH/CRITICAL only (<code>--ignore-unfixed</code>, <code>--only-fixed</code>).</li>
<li><strong>Reachable/exploitable?</strong> A CVE in <code>perl</code> in an image that runs a Go binary isn't on your attack path. Check EPSS and the CISA KEV list to prioritize the ones actually exploited.</li>
<li><strong>Document "not affected"</strong> with a reason and expiry — <code>.trivyignore</code> entries or, better, <strong>VEX</strong> statements (OpenVEX) that scanners understand: <code>trivy image --vex ./api.openvex.json ...</code></li>
<li><strong>Rescan what's running</strong>, not just what you build: new CVEs land on old images every day (Trivy Operator, ECR enhanced scanning, Artifact Analysis).</li></ol>
<blockquote>⚠️ Production tip: a policy of "zero CVEs of any severity" on a Debian full base is unreachable and trains engineers to ignore the scanner. Shrink the base first, then enforce a strict gate on what's left.</blockquote>`,
        he: `<pre>$ trivy image --severity HIGH,CRITICAL --ignore-unfixed $REG/api:3f9a2c1
$REG/api:3f9a2c1 (debian 12.8)
Total: 2 (HIGH: 1, CRITICAL: 1)
┌──────────┬────────────────┬──────────┬───────────────────┬───────────────┐
│ Library  │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │
├──────────┼────────────────┼──────────┼───────────────────┼───────────────┤
│ libssl3  │ CVE-2024-XXXXX │ CRITICAL │ 3.0.14-1~deb12u2  │ 3.0.15-1~deb12u1 │
│ zlib1g   │ CVE-2023-XXXXX │ HIGH     │ 1:1.2.13.dfsg-1   │ 1:1.2.13.dfsg-1+deb12u1 │
└──────────┴────────────────┴──────────┴───────────────────┴───────────────┘
$ grype $REG/api:3f9a2c1 --only-fixed --fail-on high      # alternative scanner, CI gate</pre>
<p>תהליך טריאז' ששומר על השפיות של הצוות:</p>
<ol><li><strong>יש תיקון?</strong> אם קיימת גרסה מתוקנת, התיקון בדרך כלל הוא "build מחדש על ה-base המעודכן" — מבצעים אוטומציה ל-builds שבועיים ול-PRs של Renovate שמעדכנים את ה-digest של ה-base. מכשילים את ה-CI רק על HIGH או CRITICAL שיש להם תיקון (<code>--ignore-unfixed</code>, ‏<code>--only-fixed</code>).</li>
<li><strong>נגיש וניתן לניצול?</strong> CVE ב-<code>perl</code> בתוך image שמריץ בינארי של Go לא נמצא במסלול התקיפה שלך. בודקים EPSS ואת רשימת KEV של CISA כדי לתעדף את אלה שבאמת מנוצלים.</li>
<li><strong>מתעדים "לא מושפע"</strong> עם סיבה ותאריך תפוגה — רשומות ב-<code>.trivyignore</code> או, עדיף, הצהרות <strong>VEX</strong> ‏(OpenVEX) שהסורקים מבינים: <code>trivy image --vex ./api.openvex.json ...</code></li>
<li><strong>סורקים מחדש את מה שרץ</strong>, לא רק את מה שבונים: CVEs חדשים נוחתים על images ישנים כל יום (Trivy Operator, ‏ECR enhanced scanning, ‏Artifact Analysis).</li></ol>
<blockquote>⚠️ טיפ לפרודקשן: מדיניות של "אפס CVEs בכל חומרה" על base מלא של Debian היא בלתי אפשרית ומלמדת מהנדסים להתעלם מהסורק. קודם מקטינים את ה-base, ואז אוכפים gate קשוח על מה שנשאר.</blockquote>`
      }
    }
  ],
  diagram: `   attack surface / size / CVEs
   high |  ubuntu, node:22 (full)        ~1 GB, hundreds of CVEs
        |  *-slim (Debian)               ~150 MB, tens
        |  alpine (musl!)                ~8 MB base
        |  distroless / chiseled / Wolfi tens of MB, ~0-5
   low  |  scratch + static binary       = binary size
        +-------------------------------------------------
   + runtime: runAsNonRoot, readOnlyRootFilesystem, drop ALL caps
   + debug:   kubectl debug --target (ephemeral container), not a shell in the image`,
  handsOn: [
    { cmd: "docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep -E 'node|python|distroless'", what: { en: "Compare the sizes of full, slim and distroless bases you have locally.", he: "להשוות גדלים של bases מלאים, ‏slim ו-distroless שיש לך מקומית." } },
    { cmd: "trivy image --severity HIGH,CRITICAL --ignore-unfixed node:22 && trivy image --severity HIGH,CRITICAL --ignore-unfixed gcr.io/distroless/nodejs22-debian12", what: { en: "See the fixable HIGH/CRITICAL difference between a full and a distroless base.", he: "לראות את ההבדל ב-HIGH/CRITICAL שיש להם תיקון בין base מלא ל-distroless." } },
    { cmd: "kubectl debug -it <pod> --image=busybox:1.36 --target=<container> -- sh", what: { en: "Attach an ephemeral debug container to a shell-less pod and inspect /proc/1/root.", he: "לחבר ephemeral container לדיבוג ל-pod בלי shell ולבדוק את ‎/proc/1/root." } },
    { cmd: "docker run --rm --read-only --user 65532 --cap-drop ALL <image>", what: { en: "Test locally that your image works non-root with a read-only rootfs before production does it for you.", he: "לבדוק מקומית שה-image עובד כ-non-root עם rootfs לקריאה בלבד, לפני שפרודקשן יעשה את זה בשבילך." } }
  ],
  mnemonic: {
    en: "\"Pack a carry-on, borrow the screwdriver.\" Scratch for static, distroless for runtimes, alpine only on purpose; triage by Fixable → Reachable → Documented.",
    he: "\"אורזים טרולי, שואלים מברג מהשכן.\" Scratch לסטטי, ‏distroless ל-runtimes, ‏alpine רק בכוונה; טריאז' לפי: יש תיקון ← נגיש ← מתועד."
  },
  pitfalls: [
    { en: "Moving to scratch and getting 'x509: certificate signed by unknown authority' or timezone errors — copy CA certs and tzdata, or use distroless/static.", he: "לעבור ל-scratch ולקבל 'x509: certificate signed by unknown authority' או שגיאות timezone — תעתיק CA certs ו-tzdata, או תשתמש ב-distroless/static." },
    { en: "Switching a Python/Node service to Alpine for size and getting 10-minute builds compiling wheels, or intermittent DNS failures from musl's resolver.", he: "להעביר שירות Python או Node ל-Alpine בשביל הגודל ולקבל builds של 10 דקות שמקמפלים wheels, או כישלוני DNS לסירוגין בגלל ה-resolver של musl." },
    { en: "Adding curl and bash 'for debugging' back into the production image — use kubectl debug with an ephemeral container instead.", he: "להחזיר curl ו-bash ל-image של פרודקשן 'בשביל דיבוג' — תשתמש ב-kubectl debug עם ephemeral container במקום." },
    { en: "Turning on readOnlyRootFilesystem without giving the app a writable /tmp (emptyDir): crashes on first temp file or cache write.", he: "להפעיל readOnlyRootFilesystem בלי לתת לאפליקציה ‎/tmp לכתיבה (emptyDir): קריסה בקובץ הזמני הראשון או בכתיבה הראשונה ל-cache." }
  ],
  interview: [
    {
      q: { en: "The security team wants zero CVEs in all images. How do you respond?", he: "צוות האבטחה רוצה אפס CVEs בכל ה-images. מה אתה עונה?" },
      a: { en: "Agree on risk, not count. First shrink the attack surface: move to distroless/Chainguard/chiseled or slim bases and rebuild automatically on base updates — that removes most findings. Then gate CI on fixable HIGH/CRITICAL, prioritize by exploitability (KEV, EPSS) and reachability, and document not-affected findings with VEX and expiry dates. Continuously rescan running images, and enforce runtime hardening (non-root, read-only rootfs, dropped caps) so the remaining CVEs are harder to exploit.", he: "מסכימים על סיכון, לא על מספר. קודם מקטינים את שטח התקיפה: עוברים ל-bases של distroless, ‏Chainguard, ‏chiseled או slim ובונים מחדש אוטומטית כשה-base מתעדכן — זה מוריד את רוב הממצאים. אחר כך מכשילים CI רק על HIGH או CRITICAL שיש להם תיקון, מתעדפים לפי ניצול בפועל (KEV, ‏EPSS) ונגישות, ומתעדים ממצאים שלא משפיעים עם VEX ותאריכי תפוגה. סורקים כל הזמן את ה-images שרצים, ואוכפים הקשחה ב-runtime ‏(non-root, ‏rootfs לקריאה בלבד, ‏capabilities מורדות) כדי שה-CVEs שנשארו יהיו קשים יותר לניצול." }
    },
    {
      q: { en: "How do you debug a production pod running a distroless image?", he: "איך מדבגים pod בפרודקשן שמריץ image של distroless?" },
      a: { en: "kubectl debug with an ephemeral container (busybox or a -dev image) and --target=<container> to share the process namespace; inspect /proc/1/root for the filesystem, use localhost for network checks. If the pod crashes on start, use --copy-to with a different command/image. For node-level issues, kubectl debug node/<name>. Logs, metrics and traces should answer most questions before you need any of this.", he: "kubectl debug עם ephemeral container ‏(busybox או image של ‎-dev) ו-‎--target=<container> כדי לחלוק את ה-process namespace; בודקים את ה-filesystem דרך ‎/proc/1/root, ומשתמשים ב-localhost לבדיקות רשת. אם ה-pod קורס בעלייה, משתמשים ב-‎--copy-to עם פקודה או image אחרים. לבעיות ברמת ה-node, ‏kubectl debug node/<name>. לוגים, metrics ו-traces אמורים לענות על רוב השאלות לפני שצריך משהו מזה." }
    }
  ],
  quiz: [
    {
      q: { en: "A Go service on 'FROM scratch' fails HTTPS calls with 'x509: certificate signed by unknown authority'. Fix?", he: "שירות Go על FROM scratch נכשל בקריאות HTTPS עם 'x509: certificate signed by unknown authority'. התיקון?" },
      options: [
        { en: "Set CGO_ENABLED=1", he: "להגדיר CGO_ENABLED=1" },
        { en: "Copy ca-certificates.crt into the image, or use distroless/static", he: "להעתיק את ca-certificates.crt ל-image, או להשתמש ב-distroless/static" },
        { en: "Run the container as root", he: "להריץ את הקונטיינר כ-root" },
        { en: "Disable TLS verification", he: "לבטל את אימות ה-TLS" }
      ],
      answer: 1,
      explain: { en: "scratch is empty — no CA bundle. Copy it from the build stage or use distroless/static, which includes CA certs, tzdata and a nonroot user.", he: "scratch ריק — אין CA bundle. מעתיקים אותו מה-stage של ה-build או משתמשים ב-distroless/static, שכולל CA certs, ‏tzdata ומשתמש nonroot." }
    },
    {
      q: { en: "Which is a real Alpine/musl gotcha?", he: "מה מהבאים הוא מלכודת אמיתית של Alpine ו-musl?" },
      options: [
        { en: "Alpine images can't run as non-root", he: "Images של Alpine לא יכולים לרוץ כ-non-root" },
        { en: "manylinux Python wheels target glibc, so pip may compile from source", he: "Wheels של manylinux ב-Python מכוונים ל-glibc, אז pip עלול לקמפל מהמקור" },
        { en: "Alpine has no package manager", he: "ל-Alpine אין מנהל חבילות" },
        { en: "musl doesn't support TLS", he: "musl לא תומך ב-TLS" }
      ],
      answer: 1,
      explain: { en: "Prebuilt glibc binaries don't fit musl. Without a musllinux wheel pip builds from source — slow builds and bigger images. DNS resolver differences are the other classic.", he: "בינאריים מוכנים של glibc לא מתאימים ל-musl. בלי wheel של musllinux, ‏pip בונה מהמקור — builds איטיים ו-images גדולים יותר. ההבדלים ב-resolver של DNS הם הקלאסיקה השנייה." }
    },
    {
      q: { en: "kubectl exec into a distroless pod fails: 'sh: executable file not found'. Best way to inspect it?", he: "kubectl exec ל-pod של distroless נכשל: 'sh: executable file not found'. מה הדרך הכי טובה לבדוק אותו?" },
      options: [
        { en: "Rebuild the image with bash and redeploy", he: "לבנות מחדש את ה-image עם bash ולעשות deploy" },
        { en: "SSH into the pod", he: "להיכנס ל-pod ב-SSH" },
        { en: "kubectl debug -it <pod> --image=busybox --target=<container>", he: "kubectl debug -it <pod> --image=busybox --target=<container>" },
        { en: "docker exec on your laptop", he: "docker exec על הלפטופ שלך" }
      ],
      answer: 2,
      explain: { en: "An ephemeral container shares the pod's namespaces; with --target it sees the app's processes and filesystem via /proc/1/root — no change to the production image.", he: "Ephemeral container חולק את ה-namespaces של ה-pod; עם ‎--target הוא רואה את התהליכים של האפליקציה ואת ה-filesystem שלה דרך ‎/proc/1/root — בלי לשנות את ה-image של פרודקשן." }
    },
    {
      q: { en: "What's the most effective CI gate for CVEs?", he: "מה ה-gate הכי אפקטיבי ל-CVEs ב-CI?" },
      options: [
        { en: "Fail on any CVE of any severity", he: "להכשיל על כל CVE בכל חומרה" },
        { en: "Never fail, only report", he: "אף פעם לא להכשיל, רק לדווח" },
        { en: "Fail on fixable HIGH/CRITICAL, with documented (VEX) exceptions that expire", he: "להכשיל על HIGH או CRITICAL שיש להם תיקון, עם חריגות מתועדות (VEX) שפגות" },
        { en: "Fail only if the image is over 500 MB", he: "להכשיל רק אם ה-image גדול מ-500 MB" }
      ],
      answer: 2,
      explain: { en: "Actionable and enforceable: engineers can fix what has a fix (usually by rebuilding on a patched base), and justified exceptions don't block forever.", he: "בר-ביצוע ואכיף: מהנדסים יכולים לתקן מה שיש לו תיקון (בדרך כלל ב-build מחדש על base מעודכן), וחריגות מוצדקות לא חוסמות לנצח." }
    }
  ],
  related: ["container-security", "docker-images", "container-builds-buildkit", "k8s-debugging", "k8s-security-policy", "staff-supply-chain"]
});

/* ============================== GLOSSARY ============================== */
[
  { term: "CRI", track: "containers", def: { en: "Container Runtime Interface: the gRPC API the kubelet uses to talk to containerd or CRI-O (run pod sandboxes, pull images, start containers).", he: "Container Runtime Interface: ה-API ב-gRPC שה-kubelet משתמש בו כדי לדבר עם containerd או CRI-O ‏(להרים pod sandboxes, למשוך images, להפעיל קונטיינרים)." }, lesson: "container-runtimes-oci" },
  { term: "runc", track: "containers", def: { en: "The reference low-level OCI runtime: creates namespaces, cgroups and seccomp for a bundle, execs the process, then exits.", he: "ה-runtime הנמוך של OCI שמשמש כ-reference: יוצר namespaces, ‏cgroups ו-seccomp ל-bundle, עושה exec לתהליך ויוצא." }, lesson: "container-runtimes-oci" },
  { term: "RuntimeClass", track: "containers", def: { en: "Kubernetes object that selects the low-level runtime per pod (e.g. runc vs gVisor's runsc vs Kata) via a handler name.", he: "אובייקט של Kubernetes שבוחר את ה-runtime הנמוך לכל pod ‏(למשל runc מול runsc של gVisor מול Kata) לפי שם handler." }, lesson: "container-runtimes-oci" },
  { term: "Pull-through cache", track: "containers", def: { en: "A registry that fetches images from an upstream (e.g. Docker Hub) on first pull and serves later pulls locally — avoids rate limits and egress.", he: "Registry שמושך images מ-upstream ‏(למשל Docker Hub) ב-pull הראשון ומגיש את ה-pulls הבאים מקומית — חוסך rate limits ו-egress." }, lesson: "container-registries" },
  { term: "imagePullPolicy", track: "containers", def: { en: "When the kubelet contacts the registry: IfNotPresent (default for pinned tags/digests), Always (default for :latest), Never.", he: "מתי ה-kubelet פונה ל-registry: ‏IfNotPresent ‏(ברירת מחדל ל-tags נעולים ול-digests), ‏Always ‏(ברירת מחדל ל-‎:latest), ‏Never." }, lesson: "container-registries" },
  { term: "Lazy pulling", track: "containers", def: { en: "Starting a container before its image is fully downloaded by fetching file chunks on demand (eStargz, AWS SOCI, GKE image streaming).", he: "להרים קונטיינר לפני שה-image ירד במלואו, ע\"י הבאת חלקי קבצים לפי דרישה (eStargz, ‏SOCI של AWS, ‏image streaming של GKE)." }, lesson: "container-registries" },
  { term: "BuildKit", track: "containers", def: { en: "Docker's modern build engine: parallel DAG builds, RUN --mount cache/secret/ssh mounts, exportable cache, SBOM and provenance attestations.", he: "מנוע ה-build המודרני של Docker: ‏builds מקבילים כ-DAG, ‏mounts של cache, ‏secret ו-ssh ב-RUN --mount, ‏cache שאפשר לייצא, ‏attestations של SBOM ו-provenance." }, lesson: "container-builds-buildkit" },
  { term: "buildx", track: "containers", def: { en: "Docker CLI plugin that drives BuildKit: multi-platform builds, remote builders, cache import/export, imagetools for image indexes.", he: "Plugin של ה-CLI של Docker שמפעיל את BuildKit: ‏builds מרובי פלטפורמות, ‏builders מרוחקים, ייבוא וייצוא cache, ו-imagetools ל-image indexes." }, lesson: "container-builds-buildkit" },
  { term: "Cache mount", track: "containers", def: { en: "RUN --mount=type=cache: a persistent directory (pip/npm/go caches) reused across builds on a builder but never stored in the image.", he: "RUN --mount=type=cache: תיקייה קבועה (cache של pip, ‏npm או go) שנשמרת בין builds על אותו builder אבל אף פעם לא נכנסת ל-image." }, lesson: "container-builds-buildkit" },
  { term: "Wolfi", track: "containers", def: { en: "Chainguard's minimal glibc-based 'undistro' built for containers; the base of Chainguard images, rebuilt continuously for low CVE counts.", he: "ה-'undistro' המינימלי של Chainguard, מבוסס glibc ובנוי לקונטיינרים; הבסיס של Chainguard images, נבנה מחדש כל הזמן בשביל מעט CVEs." }, lesson: "container-slim-images" },
  { term: "musl", track: "containers", def: { en: "Lightweight C library used by Alpine instead of glibc; smaller, but breaks glibc-built binaries/wheels and resolves DNS differently.", he: "ספריית C קלה ש-Alpine משתמש בה במקום glibc; קטנה יותר, אבל שוברת בינאריים ו-wheels שנבנו ל-glibc ופותרת DNS אחרת." }, lesson: "container-slim-images" },
  { term: "Chainguard Images", track: "containers", def: { en: "Minimal, signed container base images built on Wolfi and rebuilt continuously to keep CVE counts near zero; -dev variants add a shell.", he: "Base images מינימליים וחתומים שבנויים על Wolfi ונבנים מחדש כל הזמן כדי לשמור על כמעט אפס CVEs; גרסאות ‎-dev מוסיפות shell." }, lesson: "container-slim-images" },
].forEach(function (g) { INFRA.glossary.push(g); });

/* ============================== SCENARIO ============================== */
INFRA.scenarios.push({
  id: "imagepullbackoff-outage",
  icon: "📦",
  title: { en: "Black Friday scale-up, new pods stuck in ImagePullBackOff", he: "Scale-up של Black Friday, ‏pods חדשים תקועים ב-ImagePullBackOff" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Black Friday, 09:12. Traffic is 3× normal. PagerDuty: 'payments p99 latency 2.4s, error rate 4%'. The HPA scaled payments from 10 to 30 replicas and Karpenter launched 12 new nodes 6 minutes ago — but only 10 payments pods are Ready.",
        he: "Black Friday, ‏09:12. התעבורה פי 3 מהרגיל. ‏PagerDuty: ‏'payments p99 latency 2.4s, error rate 4%'. ה-HPA הגדיל את payments מ-10 ל-30 replicas ו-Karpenter הרים 12 nodes חדשים לפני 6 דקות — אבל רק 10 pods של payments במצב Ready."
      },
      data: `$ kubectl get pods -n payments -o wide | awk 'NR==1 || /payments-api/' | head -6
NAME                            READY   STATUS             RESTARTS   AGE   NODE
payments-api-6c9d8f7b4-2hxkq    1/1     Running            0          9d    ip-10-0-3-17
payments-api-6c9d8f7b4-8mvz2    0/1     ImagePullBackOff   0          6m    ip-10-0-41-202
payments-api-6c9d8f7b4-c7tqw    0/1     ImagePullBackOff   0          6m    ip-10-0-44-9
payments-api-6c9d8f7b4-k2wnr    0/1     ErrImagePull       0          6m    ip-10-0-41-202
... (16 more not Ready, all on nodes younger than 7m)
$ kubectl get pods -A | grep -c -E 'ImagePullBackOff|ErrImagePull'
31`,
      choices: [
        { label: { en: "kubectl describe one of the failing payments pods and read the Events", he: "kubectl describe לאחד ה-pods של payments שנכשלים ולקרוא את ה-Events" }, next: "s2", score: 15,
          feedback: { en: "Right. ImagePullBackOff is a symptom; the Events message tells you which of ~6 causes it is.", he: "נכון. ‏ImagePullBackOff הוא סימפטום; הודעת ה-Events אומרת לך איזו מתוך בערך 6 סיבות זו." } },
        { label: { en: "kubectl rollout undo deployment/payments-api", he: "kubectl rollout undo deployment/payments-api" }, next: "s2", score: 0,
          feedback: { en: "Nothing was deployed today — the ReplicaSet is 9 days old. Undo would roll to an even older image and still not explain the pull failure. You lost 3 minutes; now you describe the pod.", he: "שום דבר לא עלה היום — ה-ReplicaSet בן 9 ימים. ‏Undo יחזיר ל-image עוד יותר ישן ועדיין לא יסביר את כישלון ה-pull. איבדת 3 דקות; עכשיו אתה עושה describe ל-pod." } },
        { label: { en: "Drain and recycle all 12 new nodes — they look broken", he: "לעשות drain ולמחזר את כל 12 ה-nodes החדשים — הם נראים שבורים" }, next: "lose", score: -20,
          feedback: { en: "New nodes will pull the same way and fail the same way, while you burn 10 minutes of peak traffic on node churn.", he: "Nodes חדשים ימשכו באותה דרך וייכשלו באותה דרך, ובינתיים אתה שורף 10 דקות של שיא תעבורה על החלפת nodes." } }
      ]
    },
    s2: {
      text: {
        en: "The events show two different failures. 22 pods (payments-api) say one thing; 9 pods (the fluent-bit DaemonSet on the new nodes) say another.",
        he: "ה-events מראים שני כישלונות שונים. ‏22 pods ‏(payments-api) אומרים דבר אחד; ‏9 pods ‏(ה-DaemonSet של fluent-bit על ה-nodes החדשים) אומרים דבר אחר."
      },
      data: `payments-api-6c9d8f7b4-8mvz2 Events:
  Warning  Failed   6m   kubelet  Failed to pull image "123456789012.dkr.ecr.eu-west-1.amazonaws.com/payments:7e41b9a":
           rpc error: code = NotFound desc = failed to pull and unpack image ...: not found
  Normal   BackOff  1m (x14)  kubelet  Back-off pulling image "...payments:7e41b9a"

fluent-bit-x8k2p Events:
  Warning  Failed   5m   kubelet  Failed to pull image "fluent/fluent-bit:3.1": ... 429 Too Many Requests
           toomanyrequests: You have reached your unauthenticated pull rate limit.`,
      choices: [
        { label: { en: "Payments first (revenue): check whether tag 7e41b9a still exists in ECR", he: "קודם payments (הכנסות): לבדוק אם ה-tag ‏7e41b9a עדיין קיים ב-ECR" }, next: "s3", score: 15,
          feedback: { en: "Correct priority. 'not found' means the registry answered — auth and network are fine — but the image isn't there.", he: "סדר עדיפויות נכון. ‏'not found' אומר שה-registry ענה — האימות והרשת בסדר — אבל ה-image לא שם." } },
        { label: { en: "Fix the Docker Hub rate limit first, it affects more nodes", he: "קודם לתקן את ה-rate limit של Docker Hub, זה משפיע על יותר nodes" }, next: "s3", score: 3,
          feedback: { en: "Logging gaps hurt, but checkout is failing right now. You fix it later; payments first.", he: "חורים בלוגים כואבים, אבל ה-checkout נכשל עכשיו. מתקנים את זה אחר כך; קודם payments." } },
        { label: { en: "Add an imagePullSecret for ECR to the payments namespace", he: "להוסיף imagePullSecret של ECR ל-namespace של payments" }, next: "s3", score: -5,
          feedback: { en: "This isn't 'unauthorized'. The node IAM role already pulls from ECR fine — the old pods proved it 9 days ago. Read the error class.", he: "זה לא 'unauthorized'. ה-IAM role של ה-node כבר מושך מ-ECR בלי בעיה — ה-pods הישנים הוכיחו את זה לפני 9 ימים. תקרא את סוג השגיאה." } }
      ]
    },
    s3: {
      text: {
        en: "The image is gone. Old pods still run because their nodes cached it 9 days ago. CloudTrail shows the deletions came from ECR's lifecycle policy at 03:00 last night.",
        he: "ה-image נעלם. ה-pods הישנים עדיין רצים כי ה-nodes שלהם שמרו אותו ב-cache לפני 9 ימים. ‏CloudTrail מראה שהמחיקות הגיעו מה-lifecycle policy של ECR ב-03:00 בלילה."
      },
      data: `$ aws ecr describe-images --repository-name payments --image-ids imageTag=7e41b9a
An error occurred (ImageNotFoundException): The image with imageId {imageTag:'7e41b9a'} does not exist

$ aws ecr get-lifecycle-policy --repository-name payments --query lifecyclePolicyText --output text | jq '.rules[0]'
{ "rulePriority": 1, "description": "keep last 30 images",
  "selection": { "tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 30 },
  "action": { "type": "expire" } }

$ aws ecr describe-images --repository-name payments --query 'length(imageDetails)'
30          # CI pushed 46 per-commit images for unreleased branches this week`,
      choices: [
        { label: { en: "Rebuild and push the exact commit 7e41b9a (pinned base digest + lockfiles), tagged 7e41b9a", he: "לבנות מחדש ולדחוף בדיוק את commit ‏7e41b9a (digest נעול של base + lockfiles), עם tag ‏7e41b9a" }, next: "s4", score: 15,
          feedback: { en: "Same code that's been in prod for 9 days — no new risk. With registry build cache the rebuild takes ~3 minutes.", he: "אותו קוד שנמצא בפרודקשן כבר 9 ימים — בלי סיכון חדש. עם build cache ב-registry ה-build מחדש לוקח בערך 3 דקות." } },
        { label: { en: "Point the Deployment at the newest image still in ECR", he: "להפנות את ה-Deployment ל-image הכי חדש שעדיין נמצא ב-ECR" }, next: "s4", score: -10,
          feedback: { en: "That's an untested build from an unreleased branch, deployed during peak. It happens to boot, but now you're debugging two problems if anything regresses.", he: "זה build שלא נבדק מ-branch שלא שוחרר, ב-deploy בשעת שיא. במקרה הוא עולה, אבל אם משהו נשבר אתה מדבג עכשיו שתי בעיות." } },
        { label: { en: "Copy the image from an old node's containerd store and push it back to ECR", he: "להעתיק את ה-image מה-store של containerd על node ישן ולדחוף אותו בחזרה ל-ECR" }, next: "s4", score: 8,
          feedback: { en: "Clever and it works (ctr -n k8s.io images export, then push) — it even restores the original digest. It's fiddly under pressure; a reproducible rebuild is the cleaner path. Both get payments back.", he: "מתוחכם וזה עובד (ctr -n k8s.io images export ואז push) — זה אפילו משחזר את ה-digest המקורי. זה מסורבל תחת לחץ; ‏build מחדש שניתן לשחזר הוא הדרך הנקייה יותר. שתי הדרכים מחזירות את payments." } }
      ]
    },
    s4: {
      text: {
        en: "09:24 — the image is back in ECR. The kubelet's back-off retries within a few minutes; payments pods go Ready, p99 drops to 180 ms. fluent-bit is still 429-ing on the new nodes, and logs from 14 nodes are missing. Karpenter will add more nodes at the 12:00 peak.",
        he: "09:24 — ה-image חזר ל-ECR. ה-back-off של ה-kubelet מנסה שוב תוך כמה דקות; ה-pods של payments עוברים ל-Ready, ה-p99 יורד ל-180 ms. ‏fluent-bit עדיין מקבל 429 על ה-nodes החדשים, וחסרים לוגים מ-14 nodes. ‏Karpenter יוסיף עוד nodes בשיא של 12:00."
      },
      data: `$ kubectl get pods -n payments | grep -c Running
30
$ kubectl get ds fluent-bit -n logging
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE
fluent-bit   24        24        10      24           10
# all nodes egress through 1 NAT gateway => one public IP for Docker Hub`,
      choices: [
        { label: { en: "Create an ECR pull-through cache rule for Docker Hub (with credentials) and point the DaemonSet at it", he: "ליצור חוק pull-through cache ב-ECR ל-Docker Hub (עם credentials) ולהפנות את ה-DaemonSet אליו" }, next: "s5", score: 15,
          feedback: { en: "Structural fix: one authenticated upstream pull, every node then pulls in-region from ECR via its IAM role.", he: "תיקון מבני: pull מאומת אחד מה-upstream, ואז כל node מושך מ-ECR באותו region דרך ה-IAM role שלו." } },
        { label: { en: "Wait for the hourly rate-limit window to reset", he: "לחכות שחלון ה-rate limit השעתי יתאפס" }, next: "s5", score: -5,
          feedback: { en: "It resets — and the 12:00 scale-up burns it again in seconds. 10 pulls/hour per IP doesn't cover 40 nodes.", he: "הוא מתאפס — וה-scale-up של 12:00 שורף אותו שוב תוך שניות. ‏10 pulls לשעה לכל IP לא מכסים 40 nodes." } },
        { label: { en: "Set imagePullPolicy: Always on fluent-bit so it keeps retrying", he: "להגדיר imagePullPolicy: Always ל-fluent-bit כדי שימשיך לנסות" }, next: "s5", score: -10,
          feedback: { en: "Always makes it worse: more registry calls on every restart. The kubelet already retries with back-off.", he: "Always מחמיר: יותר פניות ל-registry בכל restart. ה-kubelet כבר מנסה שוב עם back-off." } }
      ]
    },
    s5: {
      text: {
        en: "Everything is green by 09:40. In the postmortem, what's the most important action item to prevent a repeat?",
        he: "הכל ירוק עד 09:40. ב-postmortem, מה ה-action item הכי חשוב כדי שזה לא יחזור?"
      },
      data: `Timeline:
03:00  ECR lifecycle 'keep last 30 images' expires payments:7e41b9a (running in prod)
09:06  Karpenter adds 12 nodes; new pods: NotFound + Docker Hub 429
09:24  image rebuilt & pushed; payments recovered
09:38  fluent-bit via ECR pull-through cache; logs recovered
Impact: 18 min degraded checkout, ~4% errors at peak`,
      choices: [
        { label: { en: "Rewrite retention: never expire release/deployed tags (expire only pr-/untagged by age), preview policies before applying, alert when a running digest isn't in the registry, and route all public images through the pull-through cache", he: "לשכתב את ה-retention: אף פעם לא למחוק tags של release או כאלה שרצים (למחוק רק pr- ו-untagged לפי גיל), לעשות preview ל-policies לפני החלה, להתריע כש-digest שרץ לא נמצא ב-registry, ולנתב את כל ה-images הציבוריים דרך ה-pull-through cache" }, next: "win", score: 20,
          feedback: { en: "This fixes both root causes and adds detection that would have caught it at 03:00 instead of at peak.", he: "זה מתקן את שני שורשי הבעיה ומוסיף זיהוי שהיה תופס את זה ב-03:00 במקום בשעת השיא." } },
        { label: { en: "Disable lifecycle policies entirely", he: "לבטל לגמרי את ה-lifecycle policies" }, next: "lose", score: -10,
          feedback: { en: "Storage grows by terabytes a month and the Docker Hub problem remains. Retention isn't the enemy — a rule that ignores what's running is.", he: "ה-storage גדל בטרה-בייטים בחודש ובעיית Docker Hub נשארת. ‏retention הוא לא האויב — חוק שמתעלם ממה שרץ הוא האויב." } },
        { label: { en: "Pre-pull all images onto nodes with a DaemonSet", he: "לעשות pre-pull לכל ה-images על ה-nodes עם DaemonSet" }, next: "lose", score: -5,
          feedback: { en: "Pre-pulling speeds up starts, but a deleted image can't be pre-pulled either. It doesn't address the cause.", he: "Pre-pull מאיץ עליות, אבל גם image שנמחק אי אפשר למשוך מראש. זה לא מטפל בסיבה." } }
      ]
    },
    win: {
      text: {
        en: "Resolved in 18 minutes with a clean, reproducible rebuild, and the platform is now protected: deployed tags are never expired, public images come through a pull-through cache, and an alert compares running digests to the registry. You treated ImagePullBackOff as a symptom and read the cause.",
        he: "נפתר תוך 18 דקות עם build מחדש נקי שניתן לשחזר, והפלטפורמה מוגנת עכשיו: tags שרצים אף פעם לא נמחקים, images ציבוריים מגיעים דרך pull-through cache, והתראה משווה digests שרצים מול ה-registry. התייחסת ל-ImagePullBackOff כסימפטום וקראת את הסיבה."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The outage stretched or will recur: either you churned nodes that fail the same way, or the postmortem didn't fix the rule that deleted a running image. ImagePullBackOff always has a specific reason in the events — not found, unauthorized, 429, platform or network — and each has a specific fix.",
        he: "התקלה התארכה או שהיא תחזור: או שמחזרת nodes שנכשלים באותה דרך, או שה-postmortem לא תיקן את החוק שמחק image שרץ. ל-ImagePullBackOff תמיד יש סיבה ספציפית ב-events — ‏not found, ‏unauthorized, ‏429, פלטפורמה או רשת — ולכל אחת יש תיקון ספציפי."
      },
      end: "lose"
    }
  },
  lessons: ["container-registries", "container-builds-buildkit", "k8s-debugging", "container-runtimes-oci"]
});
