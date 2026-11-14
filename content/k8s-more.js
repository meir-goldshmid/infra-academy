// Kubernetes track, part C: more production depth
// Lessons: k8s-kubectl-power-tips, k8s-events-audit, k8s-networking-cni,
//          k8s-jobs-cronjobs, k8s-multi-cluster  (+ glossary, scenario k8s-dns-ndots-latency)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.scenarios = window.INFRA.scenarios || [];

// ---------------------------------------------------------------------------
// 40. kubectl power tips
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-kubectl-power-tips",
  track: "kubernetes",
  order: 40,
  icon: "⌨️",
  level: 2,
  minutes: 15,
  title: { en: "kubectl Power Tips & Tricks", he: "kubectl ברמת Power User – טיפים וטריקים" },
  tldr: {
    en: "Know which cluster you're on, ask the API exactly the field you need (jsonpath / custom-columns / selectors), preview before you change (diff, --dry-run), and debug in place (kubectl debug, events --for) instead of guessing.",
    he: "תדע תמיד על איזה cluster אתה, תבקש מה-API בדיוק את השדה שאתה צריך (jsonpath / custom-columns / selectors), תראה מה ישתנה לפני שאתה משנה (diff, --dry-run), ותתחקר במקום (kubectl debug, events --for) במקום לנחש."
  },
  analogy: {
    en: "kubectl is like a professional chef's knife. Anyone can chop with it, but a pro knows the grip, keeps it sharp and never points it at a finger. The 'finger' here is the production context: the same <code>kubectl delete</code> that cleans up dev wipes out prod if your kubeconfig points at the wrong cluster. Power tips are 50% speed and 50% not cutting yourself.",
    he: "kubectl זה כמו סכין של שף מקצועי. כל אחד יכול לחתוך איתה, אבל מקצוען יודע איך לאחוז, שומר עליה חדה ואף פעם לא מכוון אותה לאצבע. ה'אצבע' כאן היא ה-context של פרודקשן: אותו <code>kubectl delete</code> שמנקה את dev מוחק את prod אם ה-kubeconfig מצביע על ה-cluster הלא נכון. טיפים של power user הם 50% מהירות ו-50% לא לחתוך את עצמך."
  },
  sections: [
    {
      h: { en: "Contexts, namespaces and not nuking prod", he: "Contexts, namespaces ואיך לא למחוק את prod" },
      body: {
        en: `<p>A kubeconfig holds <strong>clusters</strong>, <strong>users</strong> and <strong>contexts</strong> (cluster + user + default namespace). Every command runs against the <em>current context</em>:</p>
<pre>kubectl config get-contexts
CURRENT   NAME            CLUSTER         AUTHINFO        NAMESPACE
*         dev-eu          dev-eu          dev-admin       shop
          prod-eu         prod-eu         prod-sso        shop

kubectl config use-context prod-eu
kubectl config set-context --current --namespace=payments   # change default ns</pre>
<p><code>kubectx</code> / <code>kubens</code> (or <code>kubectl ctx</code> / <code>kubectl ns</code> via krew) make this one word with fuzzy search: <code>kubectx prod-eu</code>, <code>kubens payments</code>, <code>kubectx -</code> to jump back.</p>
<p>Safety habits that save careers:</p>
<ul>
<li>Show the context in your shell prompt (<code>kube-ps1</code>, starship) — red when it matches <code>prod</code>.</li>
<li>Keep prod in a <strong>separate kubeconfig file</strong> and opt in explicitly: <code>KUBECONFIG=~/.kube/prod kubectl ...</code>. Default file = non-prod only.</li>
<li>Give your daily identity <strong>read-only</strong> RBAC in prod; write access via a break-glass role or GitOps only.</li>
<li>Always pass <code>-n</code> and <code>--context</code> in scripts and runbooks — never rely on whatever is current.</li>
</ul>
<blockquote>💡 Real world: a classic outage story is "I ran <code>kubectl delete ns staging</code>... in the prod context, where a namespace with the same name held real customer jobs". The fix is not "be careful" — it's prompts, separate files and read-only defaults.</blockquote>`,
        he: `<p>ב-kubeconfig יש <strong>clusters</strong>, <strong>users</strong> ו-<strong>contexts</strong> (cluster + user + namespace ברירת מחדל). כל פקודה רצה מול ה-<em>current context</em>:</p>
<pre>kubectl config get-contexts
CURRENT   NAME            CLUSTER         AUTHINFO        NAMESPACE
*         dev-eu          dev-eu          dev-admin       shop
          prod-eu         prod-eu         prod-sso        shop

kubectl config use-context prod-eu
kubectl config set-context --current --namespace=payments   # change default ns</pre>
<p><code>kubectx</code> / <code>kubens</code> (או <code>kubectl ctx</code> / <code>kubectl ns</code> דרך krew) הופכים את זה למילה אחת עם fuzzy search: <code>kubectx prod-eu</code>, <code>kubens payments</code>, ו-<code>kubectx -</code> כדי לחזור אחורה.</p>
<p>הרגלי בטיחות שמצילים קריירות:</p>
<ul>
<li>תציג את ה-context ב-prompt של ה-shell (<code>kube-ps1</code>, starship) – באדום כשהוא מכיל <code>prod</code>.</li>
<li>תשמור את prod ב-<strong>קובץ kubeconfig נפרד</strong> ותבחר בו במפורש: <code>KUBECONFIG=~/.kube/prod kubectl ...</code>. הקובץ הדיפולטי = רק non-prod.</li>
<li>תן לזהות היומיומית שלך RBAC של <strong>read-only</strong> בפרודקשן; הרשאות כתיבה רק דרך break-glass role או GitOps.</li>
<li>בסקריפטים וב-runbooks תעביר תמיד <code>-n</code> ו-<code>--context</code> – אף פעם אל תסמוך על מה שבמקרה current.</li>
</ul>
<blockquote>💡 מהשטח: סיפור outage קלאסי הוא "הרצתי <code>kubectl delete ns staging</code>... ב-context של prod, שבו namespace עם אותו שם הריץ jobs של לקוחות אמיתיים". הפתרון הוא לא "להיזהר" – הוא prompt, קבצים נפרדים ו-read-only כברירת מחדל.</blockquote>`
      }
    },
    {
      h: { en: "Ask for exactly the field: jsonpath, custom-columns, jq, sort, selectors", he: "לבקש בדיוק את השדה: jsonpath, custom-columns, jq, sort, selectors" },
      body: {
        en: `<p>Stop scrolling through <code>-o yaml</code>. Pull the field directly:</p>
<pre># one value
kubectl get deploy web -n shop -o jsonpath='{.spec.template.spec.containers[0].image}'

# a table you design yourself
kubectl get pods -n shop -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,IP:.status.podIP,RESTARTS:.status.containerStatuses[0].restartCount

# iterate (note the range/end)
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.status.nodeInfo.kubeletVersion}{"\\n"}{end}'

# sort: most restarted pods last, newest events last
kubectl get pods -A --sort-by=.status.containerStatuses[0].restartCount
kubectl get events -n shop --sort-by=.lastTimestamp

# jq for anything jsonpath can't do (filters, math)
kubectl get pods -A -o json | jq -r '.items[] | select(.status.phase!="Running") | "\\(.metadata.namespace)/\\(.metadata.name) \\(.status.phase)"'</pre>
<p><strong>Label selectors</strong> filter on labels you own; <strong>field selectors</strong> filter on a small set of built-in fields:</p>
<pre>kubectl get pods -l 'app=checkout,tier in (web,api),!canary'
kubectl get pods -A --field-selector=status.phase!=Running
kubectl get pods -A --field-selector=spec.nodeName=ip-10-0-11-87.eu-west-1.compute.internal
kubectl get events -A --field-selector=type=Warning,reason=FailedScheduling</pre>
<p>Can't remember a field path? <code>kubectl explain</code> reads the live OpenAPI schema of <em>your</em> cluster version (CRDs included):</p>
<pre>kubectl explain pod.spec.topologySpreadConstraints
kubectl explain deployment.spec --recursive | less
kubectl explain certificate.spec --api-version=cert-manager.io/v1</pre>`,
        he: `<p>תפסיק לגלול בתוך <code>-o yaml</code>. תשלוף את השדה ישירות:</p>
<pre># one value
kubectl get deploy web -n shop -o jsonpath='{.spec.template.spec.containers[0].image}'

# a table you design yourself
kubectl get pods -n shop -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,IP:.status.podIP,RESTARTS:.status.containerStatuses[0].restartCount

# iterate (note the range/end)
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.status.nodeInfo.kubeletVersion}{"\\n"}{end}'

# sort: most restarted pods last, newest events last
kubectl get pods -A --sort-by=.status.containerStatuses[0].restartCount
kubectl get events -n shop --sort-by=.lastTimestamp

# jq for anything jsonpath can't do (filters, math)
kubectl get pods -A -o json | jq -r '.items[] | select(.status.phase!="Running") | "\\(.metadata.namespace)/\\(.metadata.name) \\(.status.phase)"'</pre>
<p><strong>Label selectors</strong> מסננים לפי labels שאתה הגדרת; <strong>field selectors</strong> מסננים לפי קבוצה קטנה של שדות מובנים:</p>
<pre>kubectl get pods -l 'app=checkout,tier in (web,api),!canary'
kubectl get pods -A --field-selector=status.phase!=Running
kubectl get pods -A --field-selector=spec.nodeName=ip-10-0-11-87.eu-west-1.compute.internal
kubectl get events -A --field-selector=type=Warning,reason=FailedScheduling</pre>
<p>לא זוכר path של שדה? <code>kubectl explain</code> קורא את ה-OpenAPI schema החי של גרסת ה-cluster <em>שלך</em> (כולל CRDs):</p>
<pre>kubectl explain pod.spec.topologySpreadConstraints
kubectl explain deployment.spec --recursive | less
kubectl explain certificate.spec --api-version=cert-manager.io/v1</pre>`
      }
    },
    {
      h: { en: "Preview before you change: generators, diff, wait, rollout", he: "לראות לפני שמשנים: generators, diff, wait, rollout" },
      body: {
        en: `<p>Never hand-write boilerplate YAML. Let kubectl generate it, then edit:</p>
<pre>kubectl create deployment web --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml &gt; web.yaml
kubectl create service clusterip web --tcp=80:8080 --dry-run=client -o yaml
kubectl create job smoke --image=curlimages/curl --dry-run=client -o yaml -- curl -sf http://web
kubectl create secret generic db --from-literal=PASSWORD=s3cr3t --dry-run=client -o yaml</pre>
<p><code>--dry-run=client</code> never contacts the server; <code>--dry-run=server</code> runs admission webhooks and validation without persisting — great for "will Kyverno reject this?".</p>
<p><code>kubectl diff</code> shows what <code>apply</code> <em>would</em> change against live state (exit code 1 = there's a diff, handy in CI):</p>
<pre>kubectl diff -f web.yaml
-  replicas: 3
+  replicas: 5
-        image: nginx:1.26
+        image: nginx:1.27</pre>
<p>Then apply and <strong>wait</strong> instead of polling:</p>
<pre>kubectl apply -f web.yaml
kubectl rollout status deploy/web -n shop --timeout=5m
kubectl wait --for=condition=Available deploy/web -n shop --timeout=120s
kubectl wait --for=condition=complete job/migrate -n shop --timeout=10m

kubectl rollout history deploy/web -n shop
REVISION  CHANGE-CAUSE
4         image 1.26 -&gt; 1.27 (PR #812)
5         bump replicas
kubectl rollout undo deploy/web -n shop --to-revision=4
kubectl rollout restart deploy/web -n shop     # new pods, same spec</pre>
<blockquote>⚠️ Production tip: if Argo CD/Flux manages the object, <code>rollout undo</code> and <code>kubectl edit</code> are reverted by the next sync (or flagged as drift). In GitOps clusters you roll back with <code>git revert</code>; kubectl is for reading and emergencies.</blockquote>`,
        he: `<p>אל תכתוב YAML של boilerplate ביד. תן ל-kubectl לייצר אותו ואז תערוך:</p>
<pre>kubectl create deployment web --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml &gt; web.yaml
kubectl create service clusterip web --tcp=80:8080 --dry-run=client -o yaml
kubectl create job smoke --image=curlimages/curl --dry-run=client -o yaml -- curl -sf http://web
kubectl create secret generic db --from-literal=PASSWORD=s3cr3t --dry-run=client -o yaml</pre>
<p><code>--dry-run=client</code> לא פונה לשרת בכלל; <code>--dry-run=server</code> מריץ admission webhooks ו-validation בלי לשמור – מצוין לשאלה "Kyverno ידחה את זה?".</p>
<p><code>kubectl diff</code> מראה מה <code>apply</code> <em>היה</em> משנה מול ה-state החי (exit code 1 = יש הבדל, שימושי ב-CI):</p>
<pre>kubectl diff -f web.yaml
-  replicas: 3
+  replicas: 5
-        image: nginx:1.26
+        image: nginx:1.27</pre>
<p>ואז apply ו-<strong>wait</strong> במקום polling:</p>
<pre>kubectl apply -f web.yaml
kubectl rollout status deploy/web -n shop --timeout=5m
kubectl wait --for=condition=Available deploy/web -n shop --timeout=120s
kubectl wait --for=condition=complete job/migrate -n shop --timeout=10m

kubectl rollout history deploy/web -n shop
REVISION  CHANGE-CAUSE
4         image 1.26 -&gt; 1.27 (PR #812)
5         bump replicas
kubectl rollout undo deploy/web -n shop --to-revision=4
kubectl rollout restart deploy/web -n shop     # new pods, same spec</pre>
<blockquote>⚠️ טיפ לפרודקשן: אם Argo CD/Flux מנהלים את האובייקט, <code>rollout undo</code> ו-<code>kubectl edit</code> יידרסו ב-sync הבא (או יסומנו כ-drift). ב-clusters של GitOps עושים rollback עם <code>git revert</code>; kubectl הוא לקריאה ולמקרי חירום.</blockquote>`
      }
    },
    {
      h: { en: "Debug in place: debug, events --for, port-forward, cp, top", he: "לתחקר במקום: debug, events --for, port-forward, cp, top" },
      body: {
        en: `<p>Distroless images have no shell. <strong>Ephemeral containers</strong> attach a debug container into the running pod, sharing its network (and with <code>--target</code>, its process namespace):</p>
<pre>kubectl debug -it pod/checkout-6b8f9d7c5-2xkqp -n shop --image=nicolaka/netshoot --target=app
# now: ss -tlnp, curl localhost:8080/healthz, dig payments.shop, ps aux (sees app's PIDs)

# copy a crashing pod with a different command, to poke around
kubectl debug pod/checkout-6b8f9d7c5-2xkqp -n shop -it --copy-to=checkout-dbg --container=app -- sh

# a privileged shell on a NODE (host fs mounted at /host)
kubectl debug node/ip-10-0-11-87.eu-west-1.compute.internal -it --image=ubuntu
chroot /host; journalctl -u kubelet --since "10 min ago"; crictl ps</pre>
<p>Other everyday tools:</p>
<pre>kubectl events -n shop --for pod/checkout-6b8f9d7c5-2xkqp --watch   # events of ONE object
kubectl port-forward svc/grafana 3000:80 -n monitoring              # reach a ClusterIP from your laptop
kubectl cp shop/checkout-6b8f9d7c5-2xkqp:/tmp/heap.hprof ./heap.hprof -c app  # needs tar in the image
kubectl top pods -n shop --sort-by=memory --containers
kubectl logs -n shop -l app=checkout --since=10m --prefix --max-log-requests=20
kubectl auth can-i delete deployments -n shop --as=system:serviceaccount:ci:deployer</pre>
<blockquote>💡 Real world: <code>kubectl debug node/...</code> creates a pod that stays after you exit (named <code>node-debugger-...</code>). Delete it — it's a privileged pod with the node's root filesystem mounted.</blockquote>`,
        he: `<p>ל-images של distroless אין shell. <strong>Ephemeral containers</strong> מצמידים container של debug לתוך ה-pod שרץ, חולקים איתו את הרשת (ועם <code>--target</code> גם את ה-process namespace):</p>
<pre>kubectl debug -it pod/checkout-6b8f9d7c5-2xkqp -n shop --image=nicolaka/netshoot --target=app
# now: ss -tlnp, curl localhost:8080/healthz, dig payments.shop, ps aux (sees app's PIDs)

# copy a crashing pod with a different command, to poke around
kubectl debug pod/checkout-6b8f9d7c5-2xkqp -n shop -it --copy-to=checkout-dbg --container=app -- sh

# a privileged shell on a NODE (host fs mounted at /host)
kubectl debug node/ip-10-0-11-87.eu-west-1.compute.internal -it --image=ubuntu
chroot /host; journalctl -u kubelet --since "10 min ago"; crictl ps</pre>
<p>עוד כלים יומיומיים:</p>
<pre>kubectl events -n shop --for pod/checkout-6b8f9d7c5-2xkqp --watch   # events of ONE object
kubectl port-forward svc/grafana 3000:80 -n monitoring              # reach a ClusterIP from your laptop
kubectl cp shop/checkout-6b8f9d7c5-2xkqp:/tmp/heap.hprof ./heap.hprof -c app  # needs tar in the image
kubectl top pods -n shop --sort-by=memory --containers
kubectl logs -n shop -l app=checkout --since=10m --prefix --max-log-requests=20
kubectl auth can-i delete deployments -n shop --as=system:serviceaccount:ci:deployer</pre>
<blockquote>💡 מהשטח: <code>kubectl debug node/...</code> יוצר pod שנשאר גם אחרי שיצאת (בשם <code>node-debugger-...</code>). תמחק אותו – זה pod privileged עם ה-root filesystem של ה-node מחובר אליו.</blockquote>`
      }
    },
    {
      h: { en: "Plugins, k9s, aliases and completion", he: "Plugins, k9s, aliases ו-completion" },
      body: {
        en: `<p><strong>krew</strong> is kubectl's plugin manager. A starter kit:</p>
<table>
<tr><th>Plugin</th><th>What it does</th></tr>
<tr><td><code>ctx</code> / <code>ns</code></td><td>kubectx / kubens as plugins</td></tr>
<tr><td><code>neat</code></td><td>strips managedFields, status, defaults: <code>kubectl get deploy web -o yaml | kubectl neat</code> → clean, re-appliable YAML</td></tr>
<tr><td><code>tree</code></td><td>ownership tree: Deployment → ReplicaSet → Pods (works for CRDs too)</td></tr>
<tr><td><code>stern</code></td><td>tail logs of many pods at once, color per pod, regex: <code>kubectl stern -n shop 'checkout-.*' --since 5m</code></td></tr>
<tr><td><code>who-can</code>, <code>rbac-tool</code></td><td>"who can delete secrets in prod?"</td></tr>
<tr><td><code>node-shell</code>, <code>resource-capacity</code></td><td>node shell; requests/limits per node at a glance</td></tr>
</table>
<pre>kubectl krew install ctx ns neat tree stern
kubectl tree deploy web -n shop
NAMESPACE  NAME                            READY  REASON  AGE
shop       Deployment/web                  -              41d
shop       └─ReplicaSet/web-7d9f8b6c4      -              2h
shop         ├─Pod/web-7d9f8b6c4-2xkqp     True           2h
shop         └─Pod/web-7d9f8b6c4-9wzlm     True           2h</pre>
<p><strong>k9s</strong> is a terminal UI on top of the same API: <code>:pods</code>, <code>/checkout</code> to filter, <code>l</code> logs, <code>d</code> describe, <code>s</code> shell, <code>Ctrl-d</code> delete. Run <code>k9s --readonly</code> against prod.</p>
<p>Shell setup (bash/zsh):</p>
<pre>source &lt;(kubectl completion bash)     # or zsh
alias k=kubectl
complete -o default -F __start_kubectl k
alias kgp='kubectl get pods'
alias kw='kubectl get pods -w'
export do='--dry-run=client -o yaml'   # k create deploy x --image=nginx $do</pre>`,
        he: `<p><strong>krew</strong> הוא ה-plugin manager של kubectl. ערכת פתיחה:</p>
<table>
<tr><th>Plugin</th><th>מה הוא עושה</th></tr>
<tr><td><code>ctx</code> / <code>ns</code></td><td>kubectx / kubens בתור plugins</td></tr>
<tr><td><code>neat</code></td><td>מוריד managedFields, status ודיפולטים: <code>kubectl get deploy web -o yaml | kubectl neat</code> → YAML נקי שאפשר לעשות לו apply מחדש</td></tr>
<tr><td><code>tree</code></td><td>עץ בעלות: Deployment → ReplicaSet → Pods (עובד גם על CRDs)</td></tr>
<tr><td><code>stern</code></td><td>tail ללוגים של הרבה pods ביחד, צבע לכל pod, regex: <code>kubectl stern -n shop 'checkout-.*' --since 5m</code></td></tr>
<tr><td><code>who-can</code>, <code>rbac-tool</code></td><td>"מי יכול למחוק secrets בפרודקשן?"</td></tr>
<tr><td><code>node-shell</code>, <code>resource-capacity</code></td><td>shell על node; requests/limits לכל node במבט אחד</td></tr>
</table>
<pre>kubectl krew install ctx ns neat tree stern
kubectl tree deploy web -n shop
NAMESPACE  NAME                            READY  REASON  AGE
shop       Deployment/web                  -              41d
shop       └─ReplicaSet/web-7d9f8b6c4      -              2h
shop         ├─Pod/web-7d9f8b6c4-2xkqp     True           2h
shop         └─Pod/web-7d9f8b6c4-9wzlm     True           2h</pre>
<p><strong>k9s</strong> הוא UI טרמינלי מעל אותו API: <code>:pods</code>, <code>/checkout</code> כדי לסנן, <code>l</code> ללוגים, <code>d</code> ל-describe, <code>s</code> ל-shell, <code>Ctrl-d</code> למחיקה. מול prod תריץ <code>k9s --readonly</code>.</p>
<p>הגדרות shell (bash/zsh):</p>
<pre>source &lt;(kubectl completion bash)     # or zsh
alias k=kubectl
complete -o default -F __start_kubectl k
alias kgp='kubectl get pods'
alias kw='kubectl get pods -w'
export do='--dry-run=client -o yaml'   # k create deploy x --image=nginx $do</pre>`
      }
    }
  ],
  handsOn: [
    { cmd: "kubectl get pods -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,NODE:.spec.nodeName --sort-by=.spec.nodeName", what: { en: "Build your own table: which pod runs on which node, grouped by node.", he: "תבנה טבלה משלך: איזה pod רץ על איזה node, מקובץ לפי node." } },
    { cmd: "kubectl create deployment web --image=nginx:1.27 --dry-run=client -o yaml > web.yaml && kubectl diff -f web.yaml", what: { en: "Generate YAML, then see exactly what apply would change.", he: "תייצר YAML ואז תראה בדיוק מה apply היה משנה." } },
    { cmd: "kubectl debug -it <pod> --image=nicolaka/netshoot --target=<container>", what: { en: "Attach an ephemeral debug container to a distroless pod and inspect its network and processes.", he: "תצמיד ephemeral container לתוך pod של distroless ותבדוק את הרשת וה-processes שלו." } },
    { cmd: "kubectl explain deployment.spec.strategy --recursive", what: { en: "Read the real schema of your cluster's API version instead of searching docs.", he: "תקרא את ה-schema האמיתי של גרסת ה-API ב-cluster שלך במקום לחפש בדוקומנטציה." } },
    { cmd: "kubectl krew install neat tree stern && kubectl tree deploy <name>", what: { en: "Install the three most useful plugins and see a Deployment's ownership tree.", he: "תתקין את שלושת ה-plugins הכי שימושיים ותראה את עץ הבעלות של Deployment." } }
  ],
  mnemonic: {
    en: "\"Where, What, Preview, Probe\": know WHERE you are (context), ask for WHAT you need (jsonpath), PREVIEW changes (diff/dry-run), PROBE in place (debug/events).",
    he: "\"איפה, מה, תצוגה, בדיקה\": תדע איפה אתה (context), תבקש מה שאתה צריך (jsonpath), תראה תצוגה מקדימה (diff/dry-run), תבדוק במקום (debug/events)."
  },
  pitfalls: [
    { en: "Relying on the current context in scripts — a script written for dev silently runs against prod after someone switched contexts. Always pass --context and -n.", he: "להסתמך על ה-current context בסקריפטים – סקריפט שנכתב ל-dev רץ בשקט מול prod אחרי שמישהו החליף context. תעביר תמיד --context ו-n-." },
    { en: "Using kubectl edit / rollout undo in a GitOps-managed cluster — the controller reverts it minutes later and you think the fix 'didn't work'.", he: "להשתמש ב-kubectl edit / rollout undo ב-cluster שמנוהל ב-GitOps – ה-controller דורס את זה אחרי כמה דקות ואתה חושב שהתיקון 'לא עבד'." },
    { en: "Leaving node-debugger pods behind — they are privileged with the host filesystem mounted, a juicy target.", he: "להשאיר pods של node-debugger – הם privileged עם ה-filesystem של ה-host מחובר, מטרה מושלמת לתוקף." },
    { en: "--field-selector only supports a few fields per resource (metadata.name, metadata.namespace, status.phase, spec.nodeName for pods...). For anything else use -l or jq.", he: "‏--field-selector תומך רק בכמה שדות לכל resource (metadata.name, metadata.namespace, status.phase, spec.nodeName ל-pods...). לכל השאר תשתמש ב-l- או ב-jq." }
  ],
  interview: [
    {
      q: { en: "How do you debug a crashing pod whose image has no shell?", he: "איך מתחקרים pod שקורס כשאין ב-image שלו shell?" },
      a: { en: "First logs --previous and describe (exit code, last state, events). Then kubectl debug: an ephemeral container with --target shares the process and network namespaces of the running container; if it crashes too fast, --copy-to creates a copy with a different command (e.g. sleep) so I can inspect files and config. For node-level issues, kubectl debug node/... gives a shell with the host fs at /host.", he: "קודם logs --previous ו-describe (exit code, last state, events). אחר כך kubectl debug: ephemeral container עם --target חולק את ה-process namespace וה-network namespace של ה-container שרץ; אם הוא קורס מהר מדי, --copy-to יוצר עותק עם פקודה אחרת (למשל sleep) כדי שאוכל לבדוק קבצים ו-config. לבעיות ברמת node, ‏kubectl debug node/... נותן shell עם ה-fs של ה-host ב-/host." }
    },
    {
      q: { en: "What's the difference between --dry-run=client and --dry-run=server?", he: "מה ההבדל בין --dry-run=client ל---dry-run=server?" },
      a: { en: "client renders the object locally and never talks to the API server — good for generating YAML. server sends the request through authentication, admission (mutating + validating webhooks like Kyverno/Gatekeeper) and schema validation but doesn't persist — it tells you whether the real apply would be accepted and what defaults/mutations would be added.", he: "client מרנדר את האובייקט מקומית ולא מדבר עם ה-API server בכלל – טוב לייצור YAML. server שולח את הבקשה דרך authentication, admission (mutating + validating webhooks כמו Kyverno/Gatekeeper) ו-schema validation אבל לא שומר – הוא אומר לך אם ה-apply האמיתי יתקבל ואילו defaults/mutations יתווספו." }
    }
  ],
  quiz: [
    {
      q: { en: "You need each pod's name and node in a table, without YAML noise. Best option?", he: "אתה צריך טבלה עם השם וה-node של כל pod, בלי רעש של YAML. מה האפשרות הכי טובה?" },
      options: [
        { en: "kubectl get pods -o yaml | grep nodeName", he: "kubectl get pods -o yaml | grep nodeName" },
        { en: "kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName", he: "kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName" },
        { en: "kubectl describe pods", he: "kubectl describe pods" },
        { en: "kubectl top pods", he: "kubectl top pods" }
      ],
      answer: 1,
      explain: { en: "custom-columns lets you define exactly the columns you want from any field path. (-o wide also shows NODE, but custom-columns works for any field.)", he: "custom-columns מאפשר להגדיר בדיוק את העמודות שאתה רוצה מכל field path. (גם -o wide מציג NODE, אבל custom-columns עובד על כל שדה.)" }
    },
    {
      q: { en: "Which command tells you whether Kyverno would reject a manifest, without creating anything?", he: "איזו פקודה תגיד לך אם Kyverno ידחה manifest, בלי ליצור כלום?" },
      options: [
        { en: "kubectl apply --dry-run=client -f x.yaml", he: "kubectl apply --dry-run=client -f x.yaml" },
        { en: "kubectl explain -f x.yaml", he: "kubectl explain -f x.yaml" },
        { en: "kubectl apply --dry-run=server -f x.yaml", he: "kubectl apply --dry-run=server -f x.yaml" },
        { en: "kubectl create -f x.yaml --validate=false", he: "kubectl create -f x.yaml --validate=false" }
      ],
      answer: 2,
      explain: { en: "Server-side dry run goes through admission webhooks (Kyverno, Gatekeeper) and validation, but the object isn't persisted. Client-side dry run never reaches the server.", he: "Server-side dry run עובר דרך admission webhooks (Kyverno, Gatekeeper) ו-validation, אבל האובייקט לא נשמר. Client-side dry run בכלל לא מגיע לשרת." }
    },
    {
      q: { en: "What does <code>kubectl debug -it pod/x --image=busybox --target=app</code> give you?", he: "מה נותן לך <code>kubectl debug -it pod/x --image=busybox --target=app</code>?" },
      options: [
        { en: "A new pod on another node", he: "pod חדש על node אחר" },
        { en: "A restart of container app with busybox", he: "restart ל-container ‏app עם busybox" },
        { en: "An ephemeral container inside pod x sharing app's process namespace and the pod network", he: "ephemeral container בתוך pod x שחולק את ה-process namespace של app ואת הרשת של ה-pod" },
        { en: "A shell on the node", he: "shell על ה-node" }
      ],
      answer: 2,
      explain: { en: "Ephemeral containers are added to the running pod (without restarting it). --target joins the target container's process namespace so you can see its processes.", he: "Ephemeral containers מתווספים ל-pod שרץ (בלי restart). ‏--target מצטרף ל-process namespace של ה-container המטרה כך שאתה רואה את ה-processes שלו." }
    },
    {
      q: { en: "Your team uses Argo CD with self-heal. You run <code>kubectl rollout undo deploy/api</code>. What happens?", he: "הצוות שלך משתמש ב-Argo CD עם self-heal. אתה מריץ <code>kubectl rollout undo deploy/api</code>. מה קורה?" },
      options: [
        { en: "The rollback sticks forever", he: "ה-rollback נשאר לתמיד" },
        { en: "Argo CD detects drift and re-applies the Git version shortly after", he: "Argo CD מזהה drift ומחיל מחדש את הגרסה מ-Git זמן קצר אחרי" },
        { en: "Argo CD deletes the Deployment", he: "Argo CD מוחק את ה-Deployment" },
        { en: "kubectl refuses to run", he: "kubectl מסרב לרוץ" }
      ],
      answer: 1,
      explain: { en: "Git is the source of truth; self-heal reverts manual changes. Roll back with git revert (or pause auto-sync deliberately during an emergency).", he: "Git הוא מקור האמת; self-heal דורס שינויים ידניים. עושים rollback עם git revert (או עוצרים auto-sync במכוון בזמן חירום)." }
    }
  ],
  playground: "terminal",
  related: ["k8s-debugging", "k8s-troubleshooting-playbook", "k8s-namespaces-rbac", "k8s-argocd"]
});

// ---------------------------------------------------------------------------
// 41. Events & audit logs
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-events-audit",
  track: "kubernetes",
  order: 41,
  icon: "📜",
  level: 3,
  minutes: 15,
  title: { en: "Kubernetes Events & Audit Logs", he: "Events ו-Audit Logs ב-Kubernetes" },
  tldr: {
    en: "Events tell you WHAT happened to an object (and vanish after ~1h unless you export them); audit logs tell you WHO did WHAT to the API, WHEN and FROM WHERE. You need both, shipped out of the cluster.",
    he: "Events מספרים לך מה קרה לאובייקט (ונעלמים אחרי בערך שעה אם לא מייצאים אותם); audit logs מספרים לך מי עשה מה ל-API, מתי ומאיפה. צריך את שניהם, משלוחים אל מחוץ ל-cluster."
  },
  analogy: {
    en: "Events are the building's intercom announcements: 'elevator 2 stuck', 'fire door opened on floor 3' — useful in the moment, gone once spoken. Audit logs are the security desk's visitor book plus CCTV: every badge swipe, who, when, which door. When something breaks you listen to the intercom; when something is deleted and nobody admits it, you pull the CCTV.",
    he: "Events הם הכריזה של הבניין: 'מעלית 2 תקועה', 'דלת אש נפתחה בקומה 3' – שימושי באותו רגע, נעלם ברגע שנאמר. Audit logs הם ספר המבקרים של הקבלה ביחד עם מצלמות האבטחה: כל העברת כרטיס, מי, מתי, איזו דלת. כשמשהו נשבר אתה מקשיב לכריזה; כשמשהו נמחק ואף אחד לא מודה – אתה מושך את המצלמות."
  },
  sections: [
    {
      h: { en: "What an Event is (and why it disappears)", he: "מה זה Event (ולמה הוא נעלם)" },
      body: {
        en: `<p>An Event is a regular API object written by controllers (scheduler, kubelet, Deployment controller, cert-manager, Karpenter...) about another object:</p>
<pre>kubectl get events -n shop --sort-by=.lastTimestamp
LAST SEEN   TYPE      REASON             OBJECT                         MESSAGE
2m          Normal    Scheduled          pod/checkout-6b8f9d7c5-2xkqp   Successfully assigned shop/checkout-... to ip-10-0-11-87
2m          Normal    Pulled             pod/checkout-6b8f9d7c5-2xkqp   Container image "registry/checkout:1.42" already present on machine
40s (x5)    Warning   BackOff            pod/checkout-6b8f9d7c5-2xkqp   Back-off restarting failed container app in pod checkout-...
12s (x14)   Warning   Unhealthy          pod/checkout-6b8f9d7c5-2xkqp   Readiness probe failed: HTTP probe failed with statuscode: 503</pre>
<p>Key fields: <strong>type</strong> (<code>Normal</code> / <code>Warning</code>), <strong>reason</strong> (machine-readable CamelCase), <strong>involvedObject</strong> (<code>regarding</code> in <code>events.k8s.io/v1</code>), <strong>message</strong>, <strong>source/reportingController</strong>, and <strong>count</strong> + first/last timestamp — repeated events are deduplicated, which is why you see <code>(x14)</code>.</p>
<p>Events are stored in etcd with a TTL set by kube-apiserver <code>--event-ttl</code>, <strong>default 1h</strong>. That keeps etcd small (a busy cluster produces thousands of events per minute) but means the 03:00 incident's evidence is gone by the 09:00 postmortem. On managed clusters you can't change the flag — so you <strong>export</strong> them:</p>
<ul>
<li><strong>kubernetes-event-exporter</strong> (maintained by Resmo, forked from Opsgenie): watches events and routes them by rules to Elasticsearch/OpenSearch, Loki, Kafka, Slack, webhooks, stdout.</li>
<li><strong>Eventrouter</strong> (older, Heptio): writes events to stdout so your log pipeline (Fluent Bit, Vector) ships them.</li>
<li>Managed options: GKE sends events to Cloud Logging automatically; on EKS/AKS use the exporter or your observability agent (Datadog, Grafana Alloy) event collection.</li>
</ul>
<pre># event-exporter config: all Warnings to Loki, the scary ones also to Slack
route:
  routes:
    - match: [{ type: "Warning", receiver: "loki" }]
    - match: [{ reason: "FailedScheduling|OOMKilling|Evicted", receiver: "slack" }]</pre>`,
        he: `<p>Event הוא אובייקט API רגיל שנכתב על ידי controllers (scheduler, kubelet, Deployment controller, cert-manager, Karpenter...) לגבי אובייקט אחר:</p>
<pre>kubectl get events -n shop --sort-by=.lastTimestamp
LAST SEEN   TYPE      REASON             OBJECT                         MESSAGE
2m          Normal    Scheduled          pod/checkout-6b8f9d7c5-2xkqp   Successfully assigned shop/checkout-... to ip-10-0-11-87
2m          Normal    Pulled             pod/checkout-6b8f9d7c5-2xkqp   Container image "registry/checkout:1.42" already present on machine
40s (x5)    Warning   BackOff            pod/checkout-6b8f9d7c5-2xkqp   Back-off restarting failed container app in pod checkout-...
12s (x14)   Warning   Unhealthy          pod/checkout-6b8f9d7c5-2xkqp   Readiness probe failed: HTTP probe failed with statuscode: 503</pre>
<p>השדות החשובים: <strong>type</strong> (<code>Normal</code> / <code>Warning</code>), <strong>reason</strong> (CamelCase שמכונה יכולה לקרוא), <strong>involvedObject</strong> (<code>regarding</code> ב-<code>events.k8s.io/v1</code>), <strong>message</strong>, <strong>source/reportingController</strong>, ו-<strong>count</strong> + timestamp ראשון/אחרון – events שחוזרים עוברים deduplication, ולכן אתה רואה <code>(x14)</code>.</p>
<p>Events נשמרים ב-etcd עם TTL שנקבע ב-kube-apiserver לפי <code>--event-ttl</code>, <strong>ברירת מחדל שעה</strong>. זה שומר על etcd קטן (cluster עמוס מייצר אלפי events בדקה) אבל אומר שהראיות מהאינסידנט של 03:00 כבר נעלמו עד ה-postmortem של 09:00. ב-clusters מנוהלים אי אפשר לשנות את הדגל – אז <strong>מייצאים</strong> אותם:</p>
<ul>
<li><strong>kubernetes-event-exporter</strong> (מתוחזק על ידי Resmo, fork של Opsgenie): עושה watch ל-events ומנתב אותם לפי חוקים ל-Elasticsearch/OpenSearch, ‏Loki, ‏Kafka, ‏Slack, webhooks, stdout.</li>
<li><strong>Eventrouter</strong> (ותיק יותר, של Heptio): כותב events ל-stdout כדי שה-log pipeline שלך (Fluent Bit, Vector) ישלח אותם.</li>
<li>אפשרויות מנוהלות: GKE שולח events ל-Cloud Logging אוטומטית; ב-EKS/AKS משתמשים ב-exporter או באיסוף events של ה-agent שלך (Datadog, Grafana Alloy).</li>
</ul>
<pre># event-exporter config: all Warnings to Loki, the scary ones also to Slack
route:
  routes:
    - match: [{ type: "Warning", receiver: "loki" }]
    - match: [{ reason: "FailedScheduling|OOMKilling|Evicted", receiver: "slack" }]</pre>`
      }
    },
    {
      h: { en: "The event reasons worth memorizing", he: "ה-reasons ששווה לזכור בעל פה" },
      body: {
        en: `<table>
<tr><th>Reason</th><th>Emitted by</th><th>What it means / typical message</th></tr>
<tr><td><code>FailedScheduling</code></td><td>scheduler</td><td>No node fits: <code>0/6 nodes are available: 2 Insufficient cpu, 1 node(s) had untolerated taint...</code> Read every clause.</td></tr>
<tr><td><code>BackOff</code></td><td>kubelet</td><td><code>Back-off restarting failed container</code> (CrashLoopBackOff) or <code>Back-off pulling image</code> (ImagePullBackOff). Delay doubles from 10s up to a 5m cap.</td></tr>
<tr><td><code>Unhealthy</code></td><td>kubelet</td><td>A probe failed: <code>Liveness probe failed: Get "http://10.0.3.17:8080/healthz": context deadline exceeded</code>. Liveness failures are followed by <code>Killing</code>.</td></tr>
<tr><td><code>FailedMount</code> / <code>FailedAttachVolume</code></td><td>kubelet / attach-detach controller</td><td><code>MountVolume.SetUp failed for volume "creds": secret "db" not found</code>; <code>Multi-Attach error for volume "pvc-..." Volume is already exclusively attached to one node</code> (RWO EBS disk still on the old node).</td></tr>
<tr><td><code>Evicted</code></td><td>kubelet</td><td>Node pressure eviction: <code>The node was low on resource: memory. Container app was using 1.9Gi, request is 512Mi</code>. Pods using above their request go first.</td></tr>
<tr><td><code>OOMKilling</code> / <code>SystemOOM</code></td><td>node-problem-detector / kubelet (on the Node)</td><td>The kernel OOM killer fired on the node. For a container hitting its own limit, look at <code>Last State: Terminated, Reason: OOMKilled, Exit Code: 137</code> in describe.</td></tr>
<tr><td><code>NodeNotReady</code></td><td>node controller</td><td>Kubelet stopped heartbeating (~40s grace). Pods then get the <code>node.kubernetes.io/unreachable</code> taint and are evicted after their default 300s toleration.</td></tr>
<tr><td><code>FailedCreatePodSandBox</code></td><td>kubelet</td><td>The CNI couldn't set up the pod network: <code>plugin type="aws-cni" ... failed to assign an IP address to container</code> → subnet/IP exhaustion or CNI down.</td></tr>
<tr><td><code>FailedCreate</code></td><td>ReplicaSet / Job controller</td><td>Couldn't create pods at all: <code>exceeded quota</code>, or <code>admission webhook "validate.kyverno.svc" denied the request</code>. The Deployment just shows fewer replicas.</td></tr>
</table>
<blockquote>💡 Real world: <code>FailedCreate</code> is the sneakiest one — it lives on the <strong>ReplicaSet</strong>, not on any pod (no pod was created!). If a Deployment is stuck at 2/5 with no Pending pods, run <code>kubectl describe rs -l app=web</code>.</blockquote>`,
        he: `<table>
<tr><th>Reason</th><th>מי פולט</th><th>מה זה אומר / הודעה טיפוסית</th></tr>
<tr><td><code>FailedScheduling</code></td><td>scheduler</td><td>אין node שמתאים: <code>0/6 nodes are available: 2 Insufficient cpu, 1 node(s) had untolerated taint...</code> תקרא כל סעיף.</td></tr>
<tr><td><code>BackOff</code></td><td>kubelet</td><td><code>Back-off restarting failed container</code> (CrashLoopBackOff) או <code>Back-off pulling image</code> (ImagePullBackOff). ההשהיה מוכפלת מ-10s עד תקרה של 5m.</td></tr>
<tr><td><code>Unhealthy</code></td><td>kubelet</td><td>probe נכשל: <code>Liveness probe failed: Get "http://10.0.3.17:8080/healthz": context deadline exceeded</code>. אחרי כישלונות liveness מגיע <code>Killing</code>.</td></tr>
<tr><td><code>FailedMount</code> / <code>FailedAttachVolume</code></td><td>kubelet / attach-detach controller</td><td><code>MountVolume.SetUp failed for volume "creds": secret "db" not found</code>; <code>Multi-Attach error for volume "pvc-..." Volume is already exclusively attached to one node</code> (דיסק EBS מסוג RWO עדיין מחובר ל-node הישן).</td></tr>
<tr><td><code>Evicted</code></td><td>kubelet</td><td>eviction בגלל לחץ על ה-node: <code>The node was low on resource: memory. Container app was using 1.9Gi, request is 512Mi</code>. Pods שצורכים מעל ה-request שלהם הולכים ראשונים.</td></tr>
<tr><td><code>OOMKilling</code> / <code>SystemOOM</code></td><td>node-problem-detector / kubelet (על ה-Node)</td><td>ה-OOM killer של ה-kernel הופעל על ה-node. ל-container שהגיע ל-limit שלו, תסתכל ב-describe על <code>Last State: Terminated, Reason: OOMKilled, Exit Code: 137</code>.</td></tr>
<tr><td><code>NodeNotReady</code></td><td>node controller</td><td>ה-kubelet הפסיק לשלוח heartbeat (grace של כ-40s). ה-pods מקבלים taint ‏<code>node.kubernetes.io/unreachable</code> ועוברים eviction אחרי ה-toleration הדיפולטי של 300s.</td></tr>
<tr><td><code>FailedCreatePodSandBox</code></td><td>kubelet</td><td>ה-CNI לא הצליח להקים את הרשת של ה-pod: <code>plugin type="aws-cni" ... failed to assign an IP address to container</code> → נגמרו IPs ב-subnet או שה-CNI למטה.</td></tr>
<tr><td><code>FailedCreate</code></td><td>ReplicaSet / Job controller</td><td>לא הצליח ליצור pods בכלל: <code>exceeded quota</code>, או <code>admission webhook "validate.kyverno.svc" denied the request</code>. ה-Deployment פשוט מראה פחות replicas.</td></tr>
</table>
<blockquote>💡 מהשטח: <code>FailedCreate</code> הוא הכי חמקמק – הוא יושב על ה-<strong>ReplicaSet</strong>, לא על אף pod (כי אף pod לא נוצר!). אם Deployment תקוע על 2/5 בלי pods ב-Pending, תריץ <code>kubectl describe rs -l app=web</code>.</blockquote>`
      }
    },
    {
      h: { en: "Audit logging: policy levels and stages", he: "Audit logging: רמות policy ו-stages" },
      body: {
        en: `<p>The API server can write an <strong>audit event</strong> for every request. What gets logged is decided by an <strong>audit policy</strong>: rules evaluated top to bottom, <strong>first match wins</strong>. Each rule sets a level:</p>
<table>
<tr><th>Level</th><th>Logs</th><th>Use for</th></tr>
<tr><td><code>None</code></td><td>nothing</td><td>noisy reads: health checks, <code>system:kube-proxy</code> watches, events</td></tr>
<tr><td><code>Metadata</code></td><td>user, groups, verb, resource, namespace/name, source IP, user agent, response code — no bodies</td><td>Secrets/ConfigMaps (never log their bodies!), the default catch-all</td></tr>
<tr><td><code>Request</code></td><td>metadata + request body</td><td>writes to workloads, RBAC changes</td></tr>
<tr><td><code>RequestResponse</code></td><td>+ response body</td><td>rare, high-value objects; very expensive in volume</td></tr>
</table>
<p>Stages: <code>RequestReceived</code>, <code>ResponseStarted</code> (long watches), <code>ResponseComplete</code>, <code>Panic</code>. Most policies omit <code>RequestReceived</code> to cut volume roughly in half.</p>
<pre>apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:
  - level: None                       # drop noise first
    users: ["system:kube-proxy"]
    verbs: ["watch"]
  - level: None
    resources: [{ group: "", resources: ["events"] }]
  - level: None
    nonResourceURLs: ["/healthz*", "/readyz*", "/livez*", "/version"]
  - level: Metadata                   # never log secret bodies
    resources: [{ group: "", resources: ["secrets", "configmaps"] }]
  - level: Request                    # who changed what
    verbs: ["create", "update", "patch", "delete", "deletecollection"]
    resources:
      - { group: "apps" }
      - { group: "rbac.authorization.k8s.io" }
  - level: Metadata                   # catch-all</pre>
<p>Self-managed: <code>--audit-policy-file</code>, plus <code>--audit-log-path</code> / <code>--audit-log-maxage=30</code> (file backend) or <code>--audit-webhook-config-file</code> (send to a collector / Falco).</p>
<blockquote>⚠️ Production tip: logging Secrets at <code>Request</code> level writes every secret value into your log system in plain text — now your SIEM is the most sensitive store in the company. Secrets are always <code>Metadata</code> or <code>None</code>.</blockquote>`,
        he: `<p>ה-API server יכול לכתוב <strong>audit event</strong> על כל בקשה. מה נרשם נקבע לפי <strong>audit policy</strong>: חוקים שנבדקים מלמעלה למטה, <strong>הראשון שמתאים מנצח</strong>. כל חוק קובע רמה:</p>
<table>
<tr><th>רמה</th><th>מה נרשם</th><th>מתי משתמשים</th></tr>
<tr><td><code>None</code></td><td>כלום</td><td>קריאות רועשות: health checks, ‏watches של <code>system:kube-proxy</code>, events</td></tr>
<tr><td><code>Metadata</code></td><td>user, groups, verb, resource, namespace/name, source IP, user agent, response code – בלי bodies</td><td>Secrets/ConfigMaps (אף פעם לא לרשום את התוכן שלהם!), ה-catch-all הדיפולטי</td></tr>
<tr><td><code>Request</code></td><td>metadata + request body</td><td>כתיבות ל-workloads, שינויי RBAC</td></tr>
<tr><td><code>RequestResponse</code></td><td>+ response body</td><td>אובייקטים נדירים ובעלי ערך גבוה; יקר מאוד בנפח</td></tr>
</table>
<p>Stages: <code>RequestReceived</code>, <code>ResponseStarted</code> (watches ארוכים), <code>ResponseComplete</code>, <code>Panic</code>. רוב ה-policies משמיטים את <code>RequestReceived</code> כדי לחתוך את הנפח בערך בחצי.</p>
<pre>apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:
  - level: None                       # drop noise first
    users: ["system:kube-proxy"]
    verbs: ["watch"]
  - level: None
    resources: [{ group: "", resources: ["events"] }]
  - level: None
    nonResourceURLs: ["/healthz*", "/readyz*", "/livez*", "/version"]
  - level: Metadata                   # never log secret bodies
    resources: [{ group: "", resources: ["secrets", "configmaps"] }]
  - level: Request                    # who changed what
    verbs: ["create", "update", "patch", "delete", "deletecollection"]
    resources:
      - { group: "apps" }
      - { group: "rbac.authorization.k8s.io" }
  - level: Metadata                   # catch-all</pre>
<p>ב-self-managed: <code>--audit-policy-file</code>, ועוד <code>--audit-log-path</code> / <code>--audit-log-maxage=30</code> (file backend) או <code>--audit-webhook-config-file</code> (שליחה ל-collector / Falco).</p>
<blockquote>⚠️ טיפ לפרודקשן: רישום Secrets ברמת <code>Request</code> כותב כל ערך סודי לתוך מערכת הלוגים שלך ב-plain text – ועכשיו ה-SIEM שלך הוא המאגר הכי רגיש בחברה. Secrets תמיד ב-<code>Metadata</code> או <code>None</code>.</blockquote>`
      }
    },
    {
      h: { en: "Managed clusters and \"who deleted my Deployment?\"", he: "Clusters מנוהלים ו\"מי מחק לי את ה-Deployment?\"" },
      body: {
        en: `<p>On managed Kubernetes you don't control the policy — you turn on the provider's audit stream:</p>
<table>
<tr><th>Provider</th><th>How</th><th>Where to query</th></tr>
<tr><td>EKS</td><td>Control plane logging → enable <code>audit</code> (off by default; billed as CloudWatch ingestion)</td><td>CloudWatch Logs group <code>/aws/eks/&lt;cluster&gt;/cluster</code>, stream <code>kube-apiserver-audit-*</code>, Logs Insights</td></tr>
<tr><td>AKS</td><td>Diagnostic setting → category <code>kube-audit-admin</code> (writes only, much cheaper) or <code>kube-audit</code> (everything)</td><td>Log Analytics, table <code>AKSAuditAdmin</code> / <code>AKSAudit</code> (resource-specific mode)</td></tr>
<tr><td>GKE</td><td>Admin Activity audit logs are always on and free; Data Access (reads) is opt-in</td><td>Cloud Logging, <code>resource.type="k8s_cluster"</code></td></tr>
</table>
<p>The deletion hunt on EKS (Logs Insights):</p>
<pre>fields @timestamp, user.username, sourceIPs.0, userAgent, responseStatus.code
| filter verb = "delete" and objectRef.resource = "deployments"
     and objectRef.namespace = "shop" and objectRef.name = "checkout"
| sort @timestamp desc

@timestamp               user.username                                                userAgent                 code
2026-11-12 03:14:07.221  system:serviceaccount:argocd:argocd-application-controller   argocd-controller/v2.13   200</pre>
<p>On GKE: <code>protoPayload.methodName="io.k8s.apps.v1.deployments.delete" protoPayload.resourceName:"namespaces/shop/deployments/checkout"</code>. On AKS (KQL): <code>AKSAuditAdmin | where Verb == "delete" and ObjectRef.resource == "deployments"</code>.</p>
<p>Reading the answer:</p>
<ul>
<li><strong>A human</strong> (<code>alice@corp.com</code>, an assumed-role ARN) → which role/SSO session; check <code>sourceIPs</code> and <code>userAgent</code> (<code>kubectl/v1.31</code> vs Lens vs Terraform).</li>
<li><strong>A service account</strong> → follow the chain: Argo CD pruned it (someone removed it from Git → <code>git log</code>), a Helm uninstall, a namespace deletion cascading (<code>system:serviceaccount:kube-system:namespace-controller</code>), or garbage collection because its owner was deleted (<code>generic-garbage-collector</code>).</li>
</ul>
<blockquote>💡 Real world: half of "who deleted it?" investigations end at a GitOps controller. The audit log names the robot; Git history names the human. Keep both for at least 90 days — compliance (SOC 2, ISO 27001) often requires a year.</blockquote>`,
        he: `<p>ב-Kubernetes מנוהל אתה לא שולט ב-policy – אתה מדליק את ה-audit stream של הספק:</p>
<table>
<tr><th>ספק</th><th>איך</th><th>איפה מחפשים</th></tr>
<tr><td>EKS</td><td>Control plane logging → להדליק <code>audit</code> (כבוי כברירת מחדל; מחויב כ-ingestion של CloudWatch)</td><td>CloudWatch Logs group ‏<code>/aws/eks/&lt;cluster&gt;/cluster</code>, stream ‏<code>kube-apiserver-audit-*</code>, ‏Logs Insights</td></tr>
<tr><td>AKS</td><td>Diagnostic setting → קטגוריה <code>kube-audit-admin</code> (רק כתיבות, הרבה יותר זול) או <code>kube-audit</code> (הכל)</td><td>Log Analytics, טבלה <code>AKSAuditAdmin</code> / <code>AKSAudit</code> (ב-resource-specific mode)</td></tr>
<tr><td>GKE</td><td>Admin Activity audit logs תמיד דולקים ובחינם; Data Access (קריאות) רק אם מדליקים</td><td>Cloud Logging, ‏<code>resource.type="k8s_cluster"</code></td></tr>
</table>
<p>הציד אחרי מחיקה ב-EKS (Logs Insights):</p>
<pre>fields @timestamp, user.username, sourceIPs.0, userAgent, responseStatus.code
| filter verb = "delete" and objectRef.resource = "deployments"
     and objectRef.namespace = "shop" and objectRef.name = "checkout"
| sort @timestamp desc

@timestamp               user.username                                                userAgent                 code
2026-11-12 03:14:07.221  system:serviceaccount:argocd:argocd-application-controller   argocd-controller/v2.13   200</pre>
<p>ב-GKE: ‏<code>protoPayload.methodName="io.k8s.apps.v1.deployments.delete" protoPayload.resourceName:"namespaces/shop/deployments/checkout"</code>. ב-AKS ‏(KQL): ‏<code>AKSAuditAdmin | where Verb == "delete" and ObjectRef.resource == "deployments"</code>.</p>
<p>איך לקרוא את התשובה:</p>
<ul>
<li><strong>בן אדם</strong> (<code>alice@corp.com</code>, ARN של assumed-role) → איזה role/SSO session; תבדוק <code>sourceIPs</code> ו-<code>userAgent</code> (<code>kubectl/v1.31</code> מול Lens מול Terraform).</li>
<li><strong>Service account</strong> → עוקבים אחרי השרשרת: Argo CD עשה לו prune (מישהו הוריד אותו מ-Git → <code>git log</code>), ‏helm uninstall, מחיקת namespace שהתגלגלה למטה (<code>system:serviceaccount:kube-system:namespace-controller</code>), או garbage collection כי ה-owner שלו נמחק (<code>generic-garbage-collector</code>).</li>
</ul>
<blockquote>💡 מהשטח: חצי מהחקירות של "מי מחק?" נגמרות ב-GitOps controller. ה-audit log מצביע על הרובוט; ההיסטוריה ב-Git מצביעה על הבן אדם. תשמור את שניהם לפחות 90 יום – compliance ‏(SOC 2, ISO 27001) דורש לא פעם שנה.</blockquote>`
      }
    }
  ],
  diagram: "controllers/kubelet --(Event)--> etcd (TTL 1h) --watch--> event-exporter --> Loki / ES / Slack\nkubectl / CI / Argo CD --> kube-apiserver --(audit policy: None|Metadata|Request|RequestResponse)--> log / webhook --> SIEM",
  handsOn: [
    { cmd: "kubectl get events -A --field-selector type=Warning --sort-by=.lastTimestamp", what: { en: "All warnings across the cluster, newest last — your first look in any incident.", he: "כל ה-warnings ב-cluster, החדשים בסוף – המבט הראשון שלך בכל אינסידנט." } },
    { cmd: "kubectl events -n shop --for deployment/web --watch", what: { en: "Follow the events of a single object live.", he: "לעקוב בזמן אמת אחרי ה-events של אובייקט אחד." } },
    { cmd: "kubectl get events -A -o json | jq -r '.items | group_by(.reason) | map(\"\\(length) \\(.[0].reason)\") | .[]' | sort -rn | head", what: { en: "Top event reasons right now — spot the noisy controller or the failing pattern.", he: "ה-reasons הכי נפוצים עכשיו – לזהות את ה-controller הרועש או את הדפוס שנכשל." } },
    { cmd: "aws eks update-cluster-config --name prod --logging '{\"clusterLogging\":[{\"types\":[\"audit\"],\"enabled\":true}]}'", what: { en: "Turn on EKS audit logs to CloudWatch (do it before you need them).", he: "להדליק audit logs ב-EKS ל-CloudWatch (תעשה את זה לפני שאתה צריך אותם)." } }
  ],
  mnemonic: {
    en: "Events = WHAT happened (1 hour memory). Audit = WHO did it (as long as you keep it). Export both or you'll have neither at 9 AM.",
    he: "Events = מה קרה (זיכרון של שעה). Audit = מי עשה את זה (כמה שתשמור). תייצא את שניהם, אחרת ב-9 בבוקר לא יהיה לך אף אחד מהם."
  },
  pitfalls: [
    { en: "Relying on kubectl get events in a postmortem hours later — the 1h TTL already deleted them. Deploy an event exporter on day one.", he: "להסתמך על kubectl get events ב-postmortem שעות אחרי – ה-TTL של שעה כבר מחק אותם. תפרוס event exporter מהיום הראשון." },
    { en: "Logging Secrets at Request/RequestResponse level — every secret value ends up in your log store.", he: "לרשום Secrets ברמת Request/RequestResponse – כל ערך סודי מגיע למאגר הלוגים שלך." },
    { en: "Enabling full kube-audit on a busy AKS/EKS cluster without filters — tens of GB per day of watch/list noise and a surprising monitoring bill. Start with writes only (kube-audit-admin).", he: "להדליק kube-audit מלא על cluster עמוס ב-AKS/EKS בלי סינון – עשרות GB ביום של רעש watch/list וחשבון monitoring מפתיע. תתחיל רק מכתיבות (kube-audit-admin)." },
    { en: "Looking for FailedCreate on pods — it's on the ReplicaSet/Job because no pod exists.", he: "לחפש FailedCreate על pods – הוא יושב על ה-ReplicaSet/Job כי אין שום pod." }
  ],
  interview: [
    {
      q: { en: "A Deployment disappeared from prod overnight. Walk me through finding out who did it.", he: "Deployment נעלם מפרודקשן בלילה. תסביר לי איך מגלים מי עשה את זה." },
      a: { en: "Query the API audit log (CloudWatch on EKS, Log Analytics on AKS, Cloud Logging on GKE) for verb=delete on that resource/namespace/name. It gives username, groups, source IP, user agent and timestamp. If it's a human, trace the SSO role; if it's a controller SA (Argo CD, namespace-controller, garbage collector), follow the chain — Git history, a Helm uninstall, a deleted namespace or owner. Then fix the process: least-privilege RBAC, Argo CD prune protection (Prune=false sync option on critical resources), and alerts on deletes in prod.", he: "מחפשים ב-audit log של ה-API ‏(CloudWatch ב-EKS, ‏Log Analytics ב-AKS, ‏Cloud Logging ב-GKE) את verb=delete על ה-resource/namespace/name האלה. מקבלים username, groups, source IP, user agent ו-timestamp. אם זה בן אדם – עוקבים אחרי ה-SSO role; אם זה SA של controller ‏(Argo CD, namespace-controller, garbage collector) – עוקבים אחרי השרשרת: היסטוריית Git, ‏helm uninstall, namespace או owner שנמחקו. ואז מתקנים את התהליך: RBAC עם least privilege, הגנת prune ב-Argo CD ‏(sync option של Prune=false על משאבים קריטיים), והתראות על מחיקות בפרודקשן." }
    },
    {
      q: { en: "Why not just raise --event-ttl to 7 days?", he: "למה לא פשוט להעלות את --event-ttl ל-7 ימים?" },
      a: { en: "Events live in etcd, a small, latency-sensitive consistent store (8 GB recommended max DB size). A busy cluster writes thousands of events per minute; keeping a week bloats etcd and slows list calls and compactions. On managed clusters you can't change it anyway. The right pattern is to stream events out to a log/analytics store built for retention and search.", he: "Events חיים ב-etcd, שהוא store קטן ורגיש ל-latency (גודל DB מקסימלי מומלץ של 8GB). cluster עמוס כותב אלפי events בדקה; לשמור שבוע מנפח את etcd ומאט קריאות list ו-compactions. ב-clusters מנוהלים בכלל אי אפשר לשנות את זה. הדפוס הנכון הוא להזרים events החוצה ל-log/analytics store שבנוי לשמירה וחיפוש." }
    }
  ],
  quiz: [
    {
      q: { en: "A Deployment shows 2/5 ready and there are no Pending pods. Where is the explanatory event most likely?", he: "Deployment מראה 2/5 ready, ואין pods ב-Pending. איפה סביר שנמצא ה-event שמסביר את זה?" },
      options: [
        { en: "On the Node", he: "על ה-Node" },
        { en: "On the ReplicaSet (FailedCreate: quota or admission webhook denial)", he: "על ה-ReplicaSet ‏(FailedCreate: quota או דחייה של admission webhook)" },
        { en: "On the Service", he: "על ה-Service" },
        { en: "In CoreDNS logs", he: "בלוגים של CoreDNS" }
      ],
      answer: 1,
      explain: { en: "If the ReplicaSet controller can't create pods (ResourceQuota exceeded, webhook denied), no pod object exists — the FailedCreate event is attached to the ReplicaSet.", he: "אם ה-ReplicaSet controller לא מצליח ליצור pods ‏(ResourceQuota חרג, webhook דחה), אין בכלל אובייקט pod – ה-event של FailedCreate מוצמד ל-ReplicaSet." }
    },
    {
      q: { en: "Which audit level should Secrets get?", he: "איזו רמת audit צריכים לקבל Secrets?" },
      options: [
        { en: "RequestResponse, for full forensics", he: "RequestResponse, בשביל forensics מלא" },
        { en: "Request", he: "Request" },
        { en: "Metadata (or None) — never bodies", he: "Metadata (או None) – אף פעם לא bodies" },
        { en: "It doesn't matter, audit logs are encrypted", he: "לא משנה, audit logs מוצפנים" }
      ],
      answer: 2,
      explain: { en: "Request/RequestResponse would copy secret values into the log pipeline. Metadata still records who read/changed which secret and when.", he: "Request/RequestResponse היו מעתיקים ערכים סודיים לתוך ה-log pipeline. Metadata עדיין רושם מי קרא/שינה איזה secret ומתי." }
    },
    {
      q: { en: "Pods fail with FailedCreatePodSandBox: 'failed to assign an IP address to container' on EKS. Most likely cause?", he: "Pods נכשלים עם FailedCreatePodSandBox: ‏'failed to assign an IP address to container' ב-EKS. מה הסיבה הכי סבירה?" },
      options: [
        { en: "The image doesn't exist", he: "ה-image לא קיים" },
        { en: "Liveness probe misconfigured", he: "liveness probe מוגדר לא נכון" },
        { en: "The VPC CNI ran out of IPs (subnet exhaustion or ENI/IP limit on the node)", he: "ל-VPC CNI נגמרו ה-IPs (ה-subnet התמלא או מגבלת ENI/IP על ה-node)" },
        { en: "The pod exceeded its memory limit", he: "ה-pod עבר את ה-memory limit שלו" }
      ],
      answer: 2,
      explain: { en: "Sandbox creation includes CNI network setup. With AWS VPC CNI every pod needs a real VPC IP; when the subnet or the node's ENI capacity is exhausted, sandbox creation fails.", he: "יצירת ה-sandbox כוללת הקמת רשת דרך ה-CNI. עם AWS VPC CNI כל pod צריך IP אמיתי מה-VPC; כשה-subnet או קיבולת ה-ENI של ה-node נגמרים, יצירת ה-sandbox נכשלת." }
    },
    {
      q: { en: "The audit log shows the delete came from system:serviceaccount:argocd:argocd-application-controller. Next step?", he: "ה-audit log מראה שהמחיקה הגיעה מ-system:serviceaccount:argocd:argocd-application-controller. מה הצעד הבא?" },
      options: [
        { en: "Uninstall Argo CD", he: "להסיר את Argo CD" },
        { en: "Check Git history / the Argo CD app for a prune: who removed the manifest", he: "לבדוק את ההיסטוריה ב-Git / את ה-app ב-Argo CD לחיפוש prune: מי הסיר את ה-manifest" },
        { en: "Close the investigation — it was a robot", he: "לסגור את החקירה – זה היה רובוט" },
        { en: "Raise the audit level to RequestResponse", he: "להעלות את רמת ה-audit ל-RequestResponse" }
      ],
      answer: 1,
      explain: { en: "Argo CD prunes resources that disappeared from the rendered manifests. The human cause is in Git (a removed file, a changed path, a values change) — git log tells you who.", he: "Argo CD עושה prune למשאבים שנעלמו מה-manifests המרונדרים. הסיבה האנושית נמצאת ב-Git (קובץ שהוסר, path שהשתנה, שינוי ב-values) – git log יגיד לך מי." }
    }
  ],
  related: ["k8s-troubleshooting-playbook", "k8s-cluster-observability", "k8s-security-policy", "k8s-argocd", "obs-logs"]
});

// ---------------------------------------------------------------------------
// 43. Jobs & CronJobs done right
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-jobs-cronjobs",
  track: "kubernetes",
  order: 43,
  icon: "⏱️",
  level: 2,
  minutes: 15,
  title: { en: "Jobs & CronJobs Done Right", he: "Jobs ו-CronJobs כמו שצריך" },
  tldr: {
    en: "A Job runs pods until N succeed; a CronJob creates Jobs on a schedule. Bound every Job (backoffLimit, activeDeadlineSeconds, ttlSecondsAfterFinished), make the work idempotent because runs can be duplicated or skipped, and alert on 'last success too old', not just on failure.",
    he: "Job מריץ pods עד ש-N מהם מצליחים; CronJob יוצר Jobs לפי לוח זמנים. תגביל כל Job ‏(backoffLimit, activeDeadlineSeconds, ttlSecondsAfterFinished), תעשה את העבודה idempotent כי ריצות יכולות להיות כפולות או לדלג, ותתריע על 'ההצלחה האחרונה ישנה מדי', לא רק על כישלון."
  },
  analogy: {
    en: "A Deployment is a shop that must stay open; a Job is a delivery that must be completed. The courier (pod) may get a flat tire and a new one is sent (backoffLimit), but there's a deadline after which you give up (activeDeadlineSeconds), and the paperwork is shredded after a week (ttlSecondsAfterFinished). A CronJob is the recurring delivery order — and because the dispatcher sometimes double-books or misses a slot, the package must be safe to deliver twice.",
    he: "Deployment זה חנות שחייבת להישאר פתוחה; Job זה משלוח שחייב להסתיים. השליח (pod) יכול לקבל פנצ'ר ואז שולחים שליח חדש (backoffLimit), אבל יש דדליין שאחריו מוותרים (activeDeadlineSeconds), והניירת נגרסת אחרי שבוע (ttlSecondsAfterFinished). CronJob זה הזמנת משלוח קבועה – ומכיוון שהסדרן לפעמים מזמין פעמיים או מפספס חלון, החבילה חייבת להיות בטוחה למסירה כפולה."
  },
  sections: [
    {
      h: { en: "Job anatomy: completions, parallelism and the three safety limits", he: "האנטומיה של Job: completions, parallelism ושלוש מגבלות הבטיחות" },
      body: {
        en: `<pre>apiVersion: batch/v1
kind: Job
metadata:
  name: reindex-2026-11-14
spec:
  completions: 10              # need 10 successful pods in total
  parallelism: 3               # at most 3 at a time
  backoffLimit: 4              # give up after 4 failed pods (default 6)
  activeDeadlineSeconds: 3600  # hard wall-clock cap for the whole Job
  ttlSecondsAfterFinished: 86400  # auto-delete Job + pods a day after it ends
  template:
    spec:
      restartPolicy: Never     # Never or OnFailure — Always is not allowed
      containers:
        - name: reindex
          image: registry/reindexer:3.2
          resources:
            requests: { cpu: "1", memory: 2Gi }
            limits:   { memory: 2Gi }</pre>
<table>
<tr><th>Field</th><th>What it does</th><th>Gotcha</th></tr>
<tr><td><code>backoffLimit</code></td><td>Failed pods (or container restarts with OnFailure) before the Job is marked Failed (<code>BackoffLimitExceeded</code>). Retries back off 10s, 20s, 40s… capped at 6 min.</td><td>Default 6 + exponential delay = a broken Job can take ~10+ min to fail.</td></tr>
<tr><td><code>activeDeadlineSeconds</code></td><td>Kills all pods and fails the Job (<code>DeadlineExceeded</code>) when the time is up</td><td>Takes precedence over backoffLimit. Without it a hung pod (stuck on a lock) runs forever.</td></tr>
<tr><td><code>ttlSecondsAfterFinished</code></td><td>TTL controller deletes the finished Job and its pods</td><td>Without it thousands of completed Jobs pile up in etcd. Ship logs out first — they go with the pods.</td></tr>
<tr><td><code>restartPolicy</code></td><td><code>Never</code>: new pod per failure (keeps failed pods for logs). <code>OnFailure</code>: restart in place.</td><td>With OnFailure the failed container's logs are only one restart deep.</td></tr>
</table>
<blockquote>⚠️ Production tip: always set resource requests and a memory limit on batch pods. A Job without requests gets scheduled onto a busy node, competes with your API pods, and is the first to be OOM-killed or evicted — then retried on another busy node.</blockquote>`,
        he: `<pre>apiVersion: batch/v1
kind: Job
metadata:
  name: reindex-2026-11-14
spec:
  completions: 10              # need 10 successful pods in total
  parallelism: 3               # at most 3 at a time
  backoffLimit: 4              # give up after 4 failed pods (default 6)
  activeDeadlineSeconds: 3600  # hard wall-clock cap for the whole Job
  ttlSecondsAfterFinished: 86400  # auto-delete Job + pods a day after it ends
  template:
    spec:
      restartPolicy: Never     # Never or OnFailure — Always is not allowed
      containers:
        - name: reindex
          image: registry/reindexer:3.2
          resources:
            requests: { cpu: "1", memory: 2Gi }
            limits:   { memory: 2Gi }</pre>
<table>
<tr><th>שדה</th><th>מה הוא עושה</th><th>מלכודת</th></tr>
<tr><td><code>backoffLimit</code></td><td>כמה pods שנכשלו (או restarts של container עם OnFailure) לפני שה-Job מסומן Failed ‏(<code>BackoffLimitExceeded</code>). הניסיונות החוזרים מחכים 10s, 20s, 40s… עם תקרה של 6 דקות.</td><td>דיפולט של 6 + השהיה אקספוננציאלית = Job שבור יכול לקחת 10+ דקות עד שהוא נכשל.</td></tr>
<tr><td><code>activeDeadlineSeconds</code></td><td>הורג את כל ה-pods ומכשיל את ה-Job ‏(<code>DeadlineExceeded</code>) כשהזמן נגמר</td><td>גובר על backoffLimit. בלעדיו pod תקוע (מחכה ל-lock) רץ לנצח.</td></tr>
<tr><td><code>ttlSecondsAfterFinished</code></td><td>ה-TTL controller מוחק את ה-Job שהסתיים ואת ה-pods שלו</td><td>בלעדיו אלפי Jobs שהסתיימו נערמים ב-etcd. תשלח את הלוגים החוצה קודם – הם נמחקים יחד עם ה-pods.</td></tr>
<tr><td><code>restartPolicy</code></td><td><code>Never</code>: pod חדש על כל כישלון (שומר pods שנכשלו בשביל הלוגים). <code>OnFailure</code>: restart במקום.</td><td>עם OnFailure הלוגים של ה-container שנכשל זמינים רק restart אחד אחורה.</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: תגדיר תמיד resource requests ו-memory limit ל-pods של batch. Job בלי requests מתוזמן על node עמוס, מתחרה ב-pods של ה-API שלך, והוא הראשון שיקבל OOM-kill או eviction – ואז ינוסה שוב על node עמוס אחר.</blockquote>`
      }
    },
    {
      h: { en: "Indexed Jobs and podFailurePolicy", he: "Indexed Jobs ו-podFailurePolicy" },
      body: {
        en: `<p><strong>Indexed Jobs</strong> (<code>completionMode: Indexed</code>) give each pod a stable index 0..completions-1 in the env var <code>JOB_COMPLETION_INDEX</code> (and in the hostname, e.g. <code>shard-job-3-xk2p9</code>). Perfect for static sharding: "process partition 3 of 10". With <code>backoffLimitPerIndex</code> one bad shard doesn't burn the retry budget of the others.</p>
<pre>spec:
  completionMode: Indexed
  completions: 10
  parallelism: 10
  backoffLimitPerIndex: 2      # each shard retried up to 2 times
  maxFailedIndexes: 1          # fail the Job if more than 1 shard is dead
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: worker
          image: registry/exporter:1.8
          command: ["python", "export.py", "--shard=$(JOB_COMPLETION_INDEX)", "--total=10"]</pre>
<p><strong>podFailurePolicy</strong> lets you say which failures are worth retrying (requires <code>restartPolicy: Never</code>):</p>
<pre>spec:
  backoffLimit: 6
  podFailurePolicy:
    rules:
      - action: FailJob            # bug / bad input: retrying won't help
        onExitCodes:
          containerName: main
          operator: In
          values: [42]
      - action: Ignore             # node drained / spot reclaimed / preempted:
        onPodConditions:           # retry without counting against backoffLimit
          - type: DisruptionTarget</pre>
<p>Actions: <code>FailJob</code>, <code>FailIndex</code> (with per-index backoff), <code>Ignore</code>, <code>Count</code> (the default behavior). This is what makes batch on <strong>spot instances</strong> sane: reclaims don't exhaust the retry budget, while real bugs fail fast instead of retrying 6 times.</p>`,
        he: `<p><strong>Indexed Jobs</strong> ‏(<code>completionMode: Indexed</code>) נותנים לכל pod אינדקס יציב 0..completions-1 במשתנה הסביבה <code>JOB_COMPLETION_INDEX</code> (וגם ב-hostname, למשל <code>shard-job-3-xk2p9</code>). מושלם ל-sharding סטטי: "תעבד את partition 3 מתוך 10". עם <code>backoffLimitPerIndex</code> shard אחד גרוע לא שורף את תקציב הניסיונות של האחרים.</p>
<pre>spec:
  completionMode: Indexed
  completions: 10
  parallelism: 10
  backoffLimitPerIndex: 2      # each shard retried up to 2 times
  maxFailedIndexes: 1          # fail the Job if more than 1 shard is dead
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: worker
          image: registry/exporter:1.8
          command: ["python", "export.py", "--shard=$(JOB_COMPLETION_INDEX)", "--total=10"]</pre>
<p><strong>podFailurePolicy</strong> מאפשר להגיד אילו כישלונות שווים ניסיון חוזר (דורש <code>restartPolicy: Never</code>):</p>
<pre>spec:
  backoffLimit: 6
  podFailurePolicy:
    rules:
      - action: FailJob            # bug / bad input: retrying won't help
        onExitCodes:
          containerName: main
          operator: In
          values: [42]
      - action: Ignore             # node drained / spot reclaimed / preempted:
        onPodConditions:           # retry without counting against backoffLimit
          - type: DisruptionTarget</pre>
<p>Actions: ‏<code>FailJob</code>, ‏<code>FailIndex</code> (עם backoff לכל אינדקס), ‏<code>Ignore</code>, ‏<code>Count</code> (ההתנהגות הדיפולטית). זה מה שהופך batch על <strong>spot instances</strong> לשפוי: reclaims לא מכלים את תקציב הניסיונות, ובאגים אמיתיים נכשלים מהר במקום לנסות 6 פעמים.</p>`
      }
    },
    {
      h: { en: "CronJobs: concurrency, missed schedules, time zones", he: "CronJobs: concurrency, לוחות זמנים שפוספסו, אזורי זמן" },
      body: {
        en: `<pre>apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-billing
spec:
  schedule: "30 2 * * *"            # 02:30 every day
  timeZone: "Asia/Jerusalem"        # GA since 1.27; without it = kube-controller-manager's TZ (usually UTC)
  concurrencyPolicy: Forbid         # Allow (default) | Forbid | Replace
  startingDeadlineSeconds: 600      # if we couldn't start within 10 min, skip this run
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  suspend: false
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 5400
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: billing
              image: registry/billing-batch:7.1</pre>
<ul>
<li><strong>concurrencyPolicy</strong>: <code>Allow</code> lets runs overlap (a slow 02:30 run + the next one = two jobs double-charging customers). <code>Forbid</code> skips the new run while the old one is active. <code>Replace</code> kills the old run and starts the new one — right for "latest data wins" syncs.</li>
<li><strong>startingDeadlineSeconds</strong>: how late a run may start (controller down, cluster upgrade, Forbid blocking). Late beyond that → counted as missed and skipped.</li>
<li><strong>Too many missed schedules</strong>: if the controller sees more than <strong>100</strong> missed start times, it stops and logs <code>Cannot determine if job needs to be started. Too many missed start times (&gt; 100)</code>. A <code>*/1</code> CronJob suspended for 2 hours hits this. Setting <code>startingDeadlineSeconds</code> limits how far back it counts.</li>
<li><strong>Time zones</strong>: without <code>timeZone</code>, "02:30" means the controller's time zone — and DST shifts can make a run happen twice or not at all in local time. Don't use <code>CRON_TZ=</code> inside the schedule — it's rejected; use the field.</li>
</ul>
<p>The CronJob controller guarantees "<em>about</em> once": the docs explicitly say a Job may be created twice, or not at all, in rare cases. So the work must be <strong>idempotent</strong>: upserts instead of inserts, a run key like <code>billing-2026-11-14</code> stored in the DB with a unique constraint, "process records where status = pending" instead of "process the last 24h".</p>`,
        he: `<pre>apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-billing
spec:
  schedule: "30 2 * * *"            # 02:30 every day
  timeZone: "Asia/Jerusalem"        # GA since 1.27; without it = kube-controller-manager's TZ (usually UTC)
  concurrencyPolicy: Forbid         # Allow (default) | Forbid | Replace
  startingDeadlineSeconds: 600      # if we couldn't start within 10 min, skip this run
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  suspend: false
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 5400
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: billing
              image: registry/billing-batch:7.1</pre>
<ul>
<li><strong>concurrencyPolicy</strong>: ‏<code>Allow</code> מאפשר לריצות לחפוף (ריצה איטית של 02:30 + הריצה הבאה = שני jobs שמחייבים לקוחות פעמיים). <code>Forbid</code> מדלג על הריצה החדשה כל עוד הישנה פעילה. <code>Replace</code> הורג את הריצה הישנה ומתחיל את החדשה – מתאים ל-syncs של "הנתון האחרון מנצח".</li>
<li><strong>startingDeadlineSeconds</strong>: כמה באיחור ריצה יכולה להתחיל (controller למטה, שדרוג cluster, ‏Forbid שחוסם). איחור מעבר לזה → נספר כפספוס ומדולג.</li>
<li><strong>יותר מדי פספוסים</strong>: אם ה-controller רואה יותר מ-<strong>100</strong> זמני התחלה שפוספסו, הוא עוצר וכותב <code>Cannot determine if job needs to be started. Too many missed start times (&gt; 100)</code>. CronJob של <code>*/1</code> שהיה ב-suspend שעתיים נתקל בזה. הגדרת <code>startingDeadlineSeconds</code> מגבילה כמה אחורה הוא סופר.</li>
<li><strong>אזורי זמן</strong>: בלי <code>timeZone</code>, ‏"02:30" זה לפי אזור הזמן של ה-controller – ומעברי שעון קיץ/חורף יכולים לגרום לריצה לקרות פעמיים או לא לקרות בכלל בשעון המקומי. אל תשתמש ב-<code>CRON_TZ=</code> בתוך ה-schedule – הוא נדחה; תשתמש בשדה.</li>
</ul>
<p>ה-CronJob controller מבטיח "<em>בערך</em> פעם אחת": הדוקומנטציה אומרת במפורש שבמקרים נדירים Job יכול להיווצר פעמיים, או לא להיווצר בכלל. לכן העבודה חייבת להיות <strong>idempotent</strong>: upserts במקום inserts, מפתח ריצה כמו <code>billing-2026-11-14</code> שנשמר ב-DB עם unique constraint, "תעבד רשומות שבהן status = pending" במקום "תעבד את 24 השעות האחרונות".</p>`
      }
    },
    {
      h: { en: "Sidecars that don't block completion", he: "Sidecars שלא חוסמים סיום" },
      body: {
        en: `<p>The old pain: a Job pod with an <code>istio-proxy</code> or log-shipper sidecar. The main container exits 0, the sidecar keeps running, the pod never completes, the Job hangs until <code>activeDeadlineSeconds</code>. Workarounds were ugly (<code>curl -X POST localhost:15020/quitquitquit</code> at the end of the script, shared-volume "done" files).</p>
<p><strong>Native sidecars</strong> (on by default since 1.29, GA in 1.33) fix it: declare the sidecar as an <strong>init container with <code>restartPolicy: Always</code></strong>. It starts before the main containers (and is waited on to be started/ready), keeps running alongside them, and is <strong>terminated automatically after all regular containers finish</strong> — so the pod reaches Succeeded.</p>
<pre>spec:
  template:
    spec:
      restartPolicy: Never
      initContainers:
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14
          restartPolicy: Always        # ← this makes it a native sidecar
          args: ["--port=5432", "proj:region:db"]
      containers:
        - name: migrate
          image: registry/migrator:5.0
          command: ["./migrate", "up"]</pre>
<p>Istio supports this (<code>ENABLE_NATIVE_SIDECARS=true</code>, default in recent releases), as do Linkerd and the Cloud SQL / Vault agent injectors.</p>`,
        he: `<p>הכאב הישן: pod של Job עם sidecar של <code>istio-proxy</code> או log-shipper. ה-container הראשי יוצא עם 0, ה-sidecar ממשיך לרוץ, ה-pod אף פעם לא מסתיים, וה-Job תקוע עד <code>activeDeadlineSeconds</code>. ה-workarounds היו מכוערים (<code>curl -X POST localhost:15020/quitquitquit</code> בסוף הסקריפט, קבצי "done" על volume משותף).</p>
<p><strong>Native sidecars</strong> (דלוק כברירת מחדל מ-1.29, ‏GA ב-1.33) פותרים את זה: מגדירים את ה-sidecar כ-<strong>init container עם <code>restartPolicy: Always</code></strong>. הוא עולה לפני ה-containers הראשיים (ומחכים שיעלה/יהיה ready), ממשיך לרוץ לצידם, ו-<strong>נסגר אוטומטית אחרי שכל ה-containers הרגילים מסתיימים</strong> – כך שה-pod מגיע ל-Succeeded.</p>
<pre>spec:
  template:
    spec:
      restartPolicy: Never
      initContainers:
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14
          restartPolicy: Always        # ← this makes it a native sidecar
          args: ["--port=5432", "proj:region:db"]
      containers:
        - name: migrate
          image: registry/migrator:5.0
          command: ["./migrate", "up"]</pre>
<p>Istio תומך בזה (<code>ENABLE_NATIVE_SIDECARS=true</code>, דיפולט בגרסאות האחרונות), וגם Linkerd וה-injectors של Cloud SQL / Vault agent.</p>`
      }
    },
    {
      h: { en: "Alerting on batch, and when to outgrow CronJobs", he: "התראות על batch, ומתי לצאת מ-CronJobs" },
      body: {
        en: `<p>A failed CronJob is silent by default — nobody is watching at 02:30. Alert on two things with kube-state-metrics:</p>
<pre># 1. a Job failed
kube_job_status_failed{namespace="billing"} &gt; 0

# 2. the CronJob hasn't SUCCEEDED recently (catches failures, skips, suspends, a dead controller)
time() - kube_cronjob_status_last_successful_time{cronjob="nightly-billing"} &gt; 26 * 3600</pre>
<p>Rule #2 is the important one: "failed" alerts don't fire when a run never starts. For critical jobs add a <strong>dead man's switch</strong> — the job pings Healthchecks.io / Cronitor / an Alertmanager heartbeat on success, and the external service pages you when the ping doesn't arrive.</p>
<p><strong>When CronJob + Job isn't enough:</strong></p>
<table>
<tr><th>Need</th><th>Use</th></tr>
<tr><td>Multi-step DAG (extract → transform ×50 in parallel → load), artifacts between steps, retries per step, UI</td><td><strong>Argo Workflows</strong> (K8s-native, each step a pod) — or Airflow for data teams</td></tr>
<tr><td>Long-running business processes with state, waits of days, human approvals, exactly-once-ish semantics in code</td><td><strong>Temporal</strong> (durable execution)</td></tr>
<tr><td>Queue-driven work that scales with backlog</td><td>A Deployment of workers + <strong>KEDA</strong> (or KEDA ScaledJob)</td></tr>
<tr><td>Thousands of batch Jobs competing for quota/GPUs</td><td><strong>Kueue</strong> (job queueing, fair sharing, quotas)</td></tr>
</table>
<blockquote>💡 Real world: a common smell is a 600-line bash script in a CronJob that does 8 steps and restarts from scratch on any failure. Once you need "resume from step 5", you've outgrown CronJobs.</blockquote>`,
        he: `<p>CronJob שנכשל שותק כברירת מחדל – אף אחד לא מסתכל ב-02:30. תתריע על שני דברים עם kube-state-metrics:</p>
<pre># 1. a Job failed
kube_job_status_failed{namespace="billing"} &gt; 0

# 2. the CronJob hasn't SUCCEEDED recently (catches failures, skips, suspends, a dead controller)
time() - kube_cronjob_status_last_successful_time{cronjob="nightly-billing"} &gt; 26 * 3600</pre>
<p>חוק מספר 2 הוא החשוב: התראות "failed" לא נורות כשריצה בכלל לא מתחילה. ל-jobs קריטיים תוסיף <strong>dead man's switch</strong> – ה-job שולח ping ל-Healthchecks.io / Cronitor / heartbeat של Alertmanager כשהוא מצליח, והשירות החיצוני מקפיץ לך page כשה-ping לא מגיע.</p>
<p><strong>מתי CronJob + Job לא מספיקים:</strong></p>
<table>
<tr><th>צורך</th><th>במה להשתמש</th></tr>
<tr><td>DAG רב-שלבי (extract → transform ×50 במקביל → load), artifacts בין שלבים, retries לכל שלב, UI</td><td><strong>Argo Workflows</strong> ‏(K8s-native, כל שלב pod) – או Airflow לצוותי דאטה</td></tr>
<tr><td>תהליכים עסקיים ארוכים עם state, המתנות של ימים, אישורים אנושיים, סמנטיקה של כמעט exactly-once בקוד</td><td><strong>Temporal</strong> ‏(durable execution)</td></tr>
<tr><td>עבודה מבוססת queue שגדלה עם ה-backlog</td><td>Deployment של workers + <strong>KEDA</strong> (או KEDA ScaledJob)</td></tr>
<tr><td>אלפי batch Jobs שמתחרים על quota/GPUs</td><td><strong>Kueue</strong> ‏(job queueing, fair sharing, quotas)</td></tr>
</table>
<blockquote>💡 מהשטח: ריח נפוץ הוא סקריפט bash של 600 שורות בתוך CronJob שעושה 8 שלבים ומתחיל מאפס בכל כישלון. ברגע שאתה צריך "להמשיך משלב 5", יצאת מהליגה של CronJobs.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: "kubectl create job pi --image=perl:5.40 --dry-run=client -o yaml -- perl -Mbignum=bpi -wle 'print bpi(2000)'", what: { en: "Generate a Job manifest, then add backoffLimit, activeDeadlineSeconds and ttlSecondsAfterFinished yourself.", he: "תייצר manifest של Job, ואז תוסיף בעצמך backoffLimit, ‏activeDeadlineSeconds ו-ttlSecondsAfterFinished." } },
    { cmd: "kubectl create job manual-billing-run --from=cronjob/nightly-billing -n billing", what: { en: "Trigger a CronJob now (e.g. to re-run a failed night) with the exact same template.", he: "להפעיל CronJob עכשיו (למשל להריץ מחדש לילה שנכשל) עם אותו template בדיוק." } },
    { cmd: "kubectl get cronjobs -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,SCHED:.spec.schedule,TZ:.spec.timeZone,LAST-OK:.status.lastSuccessfulTime", what: { en: "Audit all CronJobs: schedule, time zone and when each last succeeded.", he: "לעבור על כל ה-CronJobs: ‏schedule, אזור זמן ומתי כל אחד הצליח בפעם האחרונה." } },
    { cmd: "kubectl wait --for=condition=complete job/migrate -n shop --timeout=10m || kubectl logs job/migrate -n shop", what: { en: "Block a pipeline on Job completion and dump logs if it fails.", he: "לחסום pipeline עד שה-Job מסתיים ולהציג לוגים אם הוא נכשל." } }
  ],
  mnemonic: {
    en: "\"Bound it, Idempotent it, Watch the success\": every Job gets limits (backoff, deadline, TTL), every run is safe to repeat, and you alert on the absence of success.",
    he: "\"תגביל, תעשה idempotent, תשמור על ההצלחה\": לכל Job יש גבולות (backoff, deadline, TTL), כל ריצה בטוחה לחזרה, ומתריעים על היעדר הצלחה."
  },
  pitfalls: [
    { en: "Leaving concurrencyPolicy at Allow for non-idempotent jobs — a slow run overlaps the next one and work is done twice (double billing, duplicate emails).", he: "להשאיר concurrencyPolicy על Allow ב-jobs שאינם idempotent – ריצה איטית חופפת לבאה והעבודה נעשית פעמיים (חיוב כפול, מיילים כפולים)." },
    { en: "No timeZone field — the job runs at 02:30 UTC (04:30/05:30 in Israel depending on DST), and DST changes shift it twice a year.", he: "בלי שדה timeZone – ה-job רץ ב-02:30 UTC ‏(04:30/05:30 בישראל, תלוי בשעון קיץ), ומעברי שעון מזיזים אותו פעמיים בשנה." },
    { en: "Only alerting on failure — a suspended CronJob, a 'too many missed start times' controller error or a run that never started produce no failure at all.", he: "להתריע רק על כישלון – CronJob ב-suspend, שגיאת 'too many missed start times' של ה-controller או ריצה שלא התחילה לא מייצרים שום כישלון." },
    { en: "Running a Job with an old-style mesh sidecar — the pod never completes and the Job hangs until its deadline. Use native sidecars (init container with restartPolicy: Always).", he: "להריץ Job עם sidecar של mesh בסגנון הישן – ה-pod אף פעם לא מסתיים וה-Job תקוע עד ה-deadline. תשתמש ב-native sidecars ‏(init container עם restartPolicy: Always)." }
  ],
  interview: [
    {
      q: { en: "Your nightly CronJob sometimes runs twice and sometimes not at all. Why, and what do you do?", he: "ה-CronJob הלילי שלך לפעמים רץ פעמיים ולפעמים לא רץ בכלל. למה, ומה אתה עושה?" },
      a: { en: "CronJob is 'about once' by design: controller restarts, leader election or clock issues can create duplicates, and downtime beyond startingDeadlineSeconds (or >100 missed schedules) skips runs; DST without timeZone also shifts or doubles runs. I make the job idempotent (run key with a unique constraint, upserts, process-by-status), set concurrencyPolicy Forbid, timeZone, a sensible startingDeadlineSeconds, and alert on time since last success plus a dead man's switch.", he: "CronJob הוא 'בערך פעם אחת' מעצם התכנון: restarts של ה-controller, ‏leader election או בעיות שעון יכולים ליצור כפילויות, ו-downtime מעבר ל-startingDeadlineSeconds (או יותר מ-100 פספוסים) מדלג על ריצות; שעון קיץ בלי timeZone גם מזיז או מכפיל ריצות. אני עושה את ה-job ל-idempotent (מפתח ריצה עם unique constraint, ‏upserts, עיבוד לפי status), מגדיר concurrencyPolicy Forbid, ‏timeZone, ‏startingDeadlineSeconds הגיוני, ומתריע על הזמן מאז ההצלחה האחרונה ועל dead man's switch." }
    },
    {
      q: { en: "How do you run a batch on spot instances without spot reclaims failing the Job?", he: "איך מריצים batch על spot instances בלי ש-reclaims של spot יכשילו את ה-Job?" },
      a: { en: "podFailurePolicy with an Ignore rule on the DisruptionTarget pod condition, so evictions/preemptions retry without consuming backoffLimit, plus a FailJob rule for known non-retryable exit codes. Use Indexed Jobs with backoffLimitPerIndex so one shard's failures don't affect others, checkpoint progress so a retried shard resumes, and set activeDeadlineSeconds as the overall bound.", he: "podFailurePolicy עם חוק Ignore על ה-pod condition ‏DisruptionTarget, כך ש-evictions/preemptions מנסים שוב בלי לצרוך את backoffLimit, ועוד חוק FailJob ל-exit codes ידועים שלא שווה לנסות שוב. Indexed Jobs עם backoffLimitPerIndex כדי שכישלונות של shard אחד לא ישפיעו על האחרים, checkpoint להתקדמות כדי ש-shard שמנסה שוב ימשיך מאיפה שעצר, ו-activeDeadlineSeconds כגבול כללי." }
    }
  ],
  quiz: [
    {
      q: { en: "Which field guarantees a hung Job (stuck on a lock, never exits) is eventually stopped?", he: "איזה שדה מבטיח ש-Job תקוע (מחכה ל-lock, לא יוצא אף פעם) ייעצר בסוף?" },
      options: [
        { en: "backoffLimit", he: "backoffLimit" },
        { en: "ttlSecondsAfterFinished", he: "ttlSecondsAfterFinished" },
        { en: "activeDeadlineSeconds", he: "activeDeadlineSeconds" },
        { en: "parallelism", he: "parallelism" }
      ],
      answer: 2,
      explain: { en: "backoffLimit counts failures — a hung pod never fails. activeDeadlineSeconds is a wall-clock cap that terminates the pods and marks the Job DeadlineExceeded.", he: "backoffLimit סופר כישלונות – pod תקוע אף פעם לא נכשל. activeDeadlineSeconds הוא גבול זמן שעון שמסיים את ה-pods ומסמן את ה-Job כ-DeadlineExceeded." }
    },
    {
      q: { en: "A sync CronJob runs every 5 minutes; if a run is still going when the next is due, the newest data should win. Which concurrencyPolicy?", he: "CronJob של sync רץ כל 5 דקות; אם ריצה עדיין רצה כשהבאה אמורה להתחיל, הנתונים החדשים צריכים לנצח. איזה concurrencyPolicy?" },
      options: [
        { en: "Allow", he: "Allow" },
        { en: "Forbid", he: "Forbid" },
        { en: "Replace", he: "Replace" },
        { en: "Parallel", he: "Parallel" }
      ],
      answer: 2,
      explain: { en: "Replace cancels the running Job and starts the new one. Forbid would skip the new run; Allow would overlap them.", he: "Replace מבטל את ה-Job שרץ ומתחיל את החדש. Forbid היה מדלג על הריצה החדשה; Allow היה גורם להן לחפוף." }
    },
    {
      q: { en: "How do you make a log-shipper sidecar not block Job completion on a modern cluster?", he: "איך גורמים ל-sidecar של log-shipper לא לחסום את סיום ה-Job ב-cluster מודרני?" },
      options: [
        { en: "Set the Job's restartPolicy to Always", he: "להגדיר את ה-restartPolicy של ה-Job ל-Always" },
        { en: "Declare it as an init container with restartPolicy: Always (native sidecar)", he: "להגדיר אותו כ-init container עם restartPolicy: Always ‏(native sidecar)" },
        { en: "Give it a lower memory limit", he: "לתת לו memory limit נמוך יותר" },
        { en: "Set backoffLimit: 0", he: "להגדיר backoffLimit: 0" }
      ],
      answer: 1,
      explain: { en: "Native sidecars start before the main containers, run alongside them and are terminated automatically once all regular containers finish, so the pod can reach Succeeded.", he: "Native sidecars עולים לפני ה-containers הראשיים, רצים לצידם ונסגרים אוטומטית ברגע שכל ה-containers הרגילים מסתיימים, כך שה-pod יכול להגיע ל-Succeeded." }
    },
    {
      q: { en: "Best alert to catch a nightly CronJob that silently stopped running?", he: "מה ההתראה הכי טובה כדי לתפוס CronJob לילי שהפסיק לרוץ בשקט?" },
      options: [
        { en: "kube_job_status_failed > 0", he: "kube_job_status_failed > 0" },
        { en: "Pod restarts > 3", he: "Pod restarts > 3" },
        { en: "time() - kube_cronjob_status_last_successful_time > ~26h", he: "time() - kube_cronjob_status_last_successful_time > ~26h" },
        { en: "CPU usage of the CronJob controller", he: "שימוש ב-CPU של ה-CronJob controller" }
      ],
      answer: 2,
      explain: { en: "If runs never start (suspended, missed schedules, broken controller), nothing fails. Alerting on the age of the last success catches every way a job can stop producing results.", he: "אם ריצות לא מתחילות בכלל (suspend, פספוסים, controller שבור), שום דבר לא נכשל. התראה על הגיל של ההצלחה האחרונה תופסת כל דרך שבה job מפסיק לייצר תוצאות." }
    }
  ],
  related: ["k8s-pods", "k8s-keda", "arch-durable-execution", "obs-alerting", "k8s-resources"]
});

// ---------------------------------------------------------------------------
// 44. Multi-cluster Kubernetes
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-multi-cluster",
  track: "kubernetes",
  order: 44,
  icon: "🌐",
  level: 3,
  minutes: 16,
  title: { en: "Multi-Cluster Kubernetes", he: "Kubernetes ב-Multi-Cluster" },
  tldr: {
    en: "Run several clusters to shrink blast radius, serve regions, meet compliance and upgrade safely — then pay for it with fleet tooling (ApplicationSets, Cluster API, fleet managers), cross-cluster traffic (MCS, ClusterMesh, mesh, global LB), consistent policy, and per-cluster overhead.",
    he: "מריצים כמה clusters כדי לצמצם blast radius, לשרת regions, לעמוד ב-compliance ולשדרג בבטחה – ומשלמים על זה בכלים לניהול fleet ‏(ApplicationSets, Cluster API, fleet managers), תעבורה בין clusters ‏(MCS, ClusterMesh, mesh, global LB), policy אחיד, ו-overhead לכל cluster."
  },
  analogy: {
    en: "One giant cluster is a single huge cruise ship: efficient, but one fire or one engine upgrade affects everyone aboard. Multi-cluster is a fleet of smaller ships: a fire stays on one ship, you can refit ships one at a time, and you can station ships near different ports (regions). But now you need a fleet admiral (fleet management), radio between ships (cross-cluster networking), the same rulebook on every deck (policy) — and each ship needs its own captain and engine crew (control plane and add-on cost).",
    he: "cluster ענק אחד זה ספינת תענוגות אחת ענקית: יעילה, אבל שריפה אחת או שדרוג מנוע אחד משפיעים על כל מי שעל הסיפון. Multi-cluster זה צי של ספינות קטנות יותר: שריפה נשארת בספינה אחת, אפשר לשפץ ספינות אחת אחת, ואפשר להציב ספינות ליד נמלים שונים (regions). אבל עכשיו צריך אדמירל לצי (ניהול fleet), קשר רדיו בין הספינות (רשת בין clusters), אותו ספר חוקים בכל סיפון (policy) – ולכל ספינה צריך קפטן וצוות מכונות משלה (עלות של control plane ו-add-ons)."
  },
  sections: [
    {
      h: { en: "Why more than one cluster — and how to slice them", he: "למה יותר מ-cluster אחד – ואיך לחלק" },
      body: {
        en: `<p>Reasons that justify the overhead:</p>
<ul>
<li><strong>Blast radius</strong>: a bad CRD upgrade, a broken admission webhook, a CNI bug or an etcd problem takes down the whole cluster. Two clusters = half the outage.</li>
<li><strong>Regions / latency / DR</strong>: a cluster lives in one region; serving EU and US users (or surviving a regional outage) needs a cluster per region.</li>
<li><strong>Compliance and isolation</strong>: PCI or data-residency workloads (EU data stays in the EU), hard tenant isolation that namespaces can't give.</li>
<li><strong>Safe upgrades</strong>: upgrade a canary cluster first, or do blue/green cluster upgrades — build a new cluster on 1.34 and shift traffic.</li>
<li><strong>Scale limits</strong>: upstream tested limits are ~5,000 nodes / 150,000 pods per cluster; long before that, API server and etcd load hurt.</li>
</ul>
<table>
<tr><th>Model</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Per environment (dev / staging / prod)</td><td>The minimum everyone should have; prod changes are tested elsewhere first</td><td>Prod is still one big blast radius</td></tr>
<tr><td>Per region (prod-eu, prod-us)</td><td>Latency, residency, regional DR</td><td>Data replication and global routing become your problem</td></tr>
<tr><td>Per team / per tenant</td><td>Strong isolation, team autonomy, clean cost attribution</td><td>Cluster sprawl: 40 clusters, 40 upgrades, low utilization</td></tr>
<tr><td>Cell-based (N identical prod clusters, customers sharded across them)</td><td>Bounded blast radius at scale, scale by adding cells</td><td>Needs a routing layer and mature automation</td></tr>
</table>
<blockquote>💡 Real world: a common landing point for a mid-size company is env × region: <code>dev-eu</code>, <code>staging-eu</code>, <code>prod-eu</code>, <code>prod-us</code>, plus a small <code>mgmt</code> cluster running Argo CD, observability backends and Cluster API.</blockquote>`,
        he: `<p>סיבות שמצדיקות את ה-overhead:</p>
<ul>
<li><strong>Blast radius</strong>: שדרוג CRD גרוע, admission webhook שבור, באג ב-CNI או בעיה ב-etcd מפילים את כל ה-cluster. שני clusters = חצי outage.</li>
<li><strong>Regions / latency / DR</strong>: cluster חי ב-region אחד; לשרת משתמשים ב-EU וב-US (או לשרוד outage אזורי) דורש cluster לכל region.</li>
<li><strong>Compliance ובידוד</strong>: workloads של PCI או data-residency (דאטה של EU נשאר ב-EU), בידוד קשיח בין tenants ש-namespaces לא נותנים.</li>
<li><strong>שדרוגים בטוחים</strong>: לשדרג קודם cluster של canary, או לעשות שדרוג blue/green ל-cluster – לבנות cluster חדש על 1.34 ולהעביר אליו תעבורה.</li>
<li><strong>מגבלות סקייל</strong>: המגבלות שנבדקו upstream הן בערך 5,000 nodes / 150,000 pods ל-cluster; הרבה לפני זה העומס על ה-API server ו-etcd כואב.</li>
</ul>
<table>
<tr><th>מודל</th><th>יתרונות</th><th>חסרונות</th></tr>
<tr><td>לפי סביבה (dev / staging / prod)</td><td>המינימום שלכל אחד צריך להיות; שינויים ל-prod נבדקים קודם במקום אחר</td><td>prod עדיין blast radius אחד גדול</td></tr>
<tr><td>לפי region ‏(prod-eu, prod-us)</td><td>latency, residency, DR אזורי</td><td>רפליקציה של דאטה וניתוב גלובלי הופכים לבעיה שלך</td></tr>
<tr><td>לפי צוות / tenant</td><td>בידוד חזק, אוטונומיה לצוותים, ייחוס עלויות נקי</td><td>Cluster sprawl: ‏40 clusters, ‏40 שדרוגים, ניצולת נמוכה</td></tr>
<tr><td>Cell-based ‏(N clusters זהים בפרודקשן, לקוחות מחולקים ביניהם)</td><td>blast radius מוגבל בסקייל, גדלים על ידי הוספת cells</td><td>צריך שכבת ניתוב ואוטומציה בשלה</td></tr>
</table>
<blockquote>💡 מהשטח: נקודת נחיתה נפוצה לחברה בינונית היא סביבה × region: ‏<code>dev-eu</code>, ‏<code>staging-eu</code>, ‏<code>prod-eu</code>, ‏<code>prod-us</code>, ועוד cluster קטן של <code>mgmt</code> שמריץ Argo CD, את ה-backends של ה-observability ו-Cluster API.</blockquote>`
      }
    },
    {
      h: { en: "Fleet management: creating clusters and deploying to all of them", he: "ניהול fleet: ליצור clusters ולפרוס לכולם" },
      body: {
        en: `<p>Two separate problems: <strong>lifecycle</strong> (create/upgrade/delete clusters) and <strong>delivery</strong> (put the same add-ons and apps on each).</p>
<table>
<tr><th>Tool</th><th>What it does</th></tr>
<tr><td>Terraform / OpenTofu</td><td>Most common for cluster lifecycle on EKS/AKS/GKE — one module, one workspace per cluster</td></tr>
<tr><td><strong>Cluster API (CAPI)</strong></td><td>Clusters as Kubernetes objects (<code>Cluster</code>, <code>MachineDeployment</code>, <code>ClusterClass</code>) reconciled by a management cluster; providers for AWS, Azure, GCP, vSphere, bare metal. Upgrade = change <code>spec.topology.version</code>.</td></tr>
<tr><td>Rancher</td><td>UI + API to provision and import clusters, central auth/RBAC, Fleet for GitOps at scale; popular on-prem / hybrid</td></tr>
<tr><td>GKE Fleet</td><td>Groups GKE (and attached) clusters: Config Sync, Policy Controller, Multi-cluster Ingress/Gateway, multi-cluster Services, fleet-wide upgrades with rollout sequencing</td></tr>
<tr><td>Azure Kubernetes Fleet Manager</td><td>Update runs across AKS clusters in stages/groups with soak time; <code>ClusterResourcePlacement</code> to propagate resources to member clusters</td></tr>
<tr><td><strong>Argo CD ApplicationSet</strong></td><td>Template one Application per cluster (or per cluster × app) from generators: cluster labels, Git directories, matrix</td></tr>
</table>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: platform-addons, namespace: argocd }
spec:
  goTemplate: true
  generators:
    - clusters:
        selector:
          matchLabels: { tier: prod }          # every registered prod cluster
  template:
    metadata: { name: 'addons-{{.name}}' }
    spec:
      project: platform
      source:
        repoURL: https://github.com/acme/platform
        targetRevision: main
        path: 'addons/overlays/{{index .metadata.labels "region"}}'
      destination: { server: '{{.server}}', namespace: platform }
      syncPolicy: { automated: { prune: true, selfHeal: true } }</pre>
<p>Register a new cluster with the right labels and it gets the whole platform automatically — that's the goal: <strong>clusters are cattle</strong>, created from code in under an hour.</p>`,
        he: `<p>שתי בעיות נפרדות: <strong>lifecycle</strong> (ליצור/לשדרג/למחוק clusters) ו-<strong>delivery</strong> (לשים את אותם add-ons ואפליקציות על כל אחד).</p>
<table>
<tr><th>כלי</th><th>מה הוא עושה</th></tr>
<tr><td>Terraform / OpenTofu</td><td>הכי נפוץ ל-lifecycle של clusters ב-EKS/AKS/GKE – module אחד, ‏workspace לכל cluster</td></tr>
<tr><td><strong>Cluster API ‏(CAPI)</strong></td><td>Clusters כאובייקטים של Kubernetes ‏(<code>Cluster</code>, ‏<code>MachineDeployment</code>, ‏<code>ClusterClass</code>) שעוברים reconcile על ידי management cluster; providers ל-AWS, ‏Azure, ‏GCP, ‏vSphere, ‏bare metal. שדרוג = לשנות את <code>spec.topology.version</code>.</td></tr>
<tr><td>Rancher</td><td>UI + API להקמה ולייבוא של clusters, ‏auth/RBAC מרכזי, ‏Fleet בשביל GitOps בסקייל; פופולרי ב-on-prem / hybrid</td></tr>
<tr><td>GKE Fleet</td><td>מקבץ clusters של GKE (ו-attached): ‏Config Sync, ‏Policy Controller, ‏Multi-cluster Ingress/Gateway, ‏multi-cluster Services, שדרוגים לכל ה-fleet עם rollout sequencing</td></tr>
<tr><td>Azure Kubernetes Fleet Manager</td><td>Update runs על פני clusters של AKS ב-stages/groups עם זמן soak; ‏<code>ClusterResourcePlacement</code> להפצת resources ל-member clusters</td></tr>
<tr><td><strong>Argo CD ApplicationSet</strong></td><td>template שמייצר Application לכל cluster (או לכל cluster × app) מ-generators: ‏labels של clusters, תיקיות ב-Git, ‏matrix</td></tr>
</table>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: platform-addons, namespace: argocd }
spec:
  goTemplate: true
  generators:
    - clusters:
        selector:
          matchLabels: { tier: prod }          # every registered prod cluster
  template:
    metadata: { name: 'addons-{{.name}}' }
    spec:
      project: platform
      source:
        repoURL: https://github.com/acme/platform
        targetRevision: main
        path: 'addons/overlays/{{index .metadata.labels "region"}}'
      destination: { server: '{{.server}}', namespace: platform }
      syncPolicy: { automated: { prune: true, selfHeal: true } }</pre>
<p>רושמים cluster חדש עם ה-labels הנכונים והוא מקבל את כל הפלטפורמה אוטומטית – זו המטרה: <strong>clusters הם cattle</strong>, נוצרים מקוד בפחות משעה.</p>`
      }
    },
    {
      h: { en: "Cross-cluster traffic: MCS, ClusterMesh, Istio, global LB", he: "תעבורה בין clusters: ‏MCS, ‏ClusterMesh, ‏Istio, ‏global LB" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Option</th><th>How it works</th></tr>
<tr><td>North-south (users → cluster)</td><td><strong>Global load balancer</strong>: Route 53 latency/failover records, Azure Front Door, GCP global external LB / Multi-cluster Gateway, Cloudflare</td><td>Health-checks each cluster's ingress and routes users to the nearest healthy one. The simplest and most important piece.</td></tr>
<tr><td>East-west, K8s-native</td><td><strong>Multi-Cluster Services (MCS API)</strong></td><td>Export a Service with a <code>ServiceExport</code>; other clusters in the <em>ClusterSet</em> get a <code>ServiceImport</code> reachable at <code>payments.billing.svc.clusterset.local</code>. Implemented by GKE, Submariner, Cilium, AWS Cloud Map MCS controller.</td></tr>
<tr><td>East-west, CNI level</td><td><strong>Cilium ClusterMesh</strong></td><td>Clusters share service and identity state; a Service annotated <code>service.cilium.io/global: "true"</code> load-balances across clusters' endpoints, and NetworkPolicy works across clusters. Requires non-overlapping pod CIDRs.</td></tr>
<tr><td>East-west, mesh level</td><td><strong>Istio multi-primary</strong> (or primary-remote)</td><td>Each cluster runs its own istiod, all trust a <strong>shared root CA</strong>, and traffic crosses via east-west gateways with mTLS. Locality-aware failover: prefer same-zone, then same-region, then remote.</td></tr>
</table>
<pre># MCS: export from cluster A
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceExport
metadata: { name: payments, namespace: billing }

# from cluster B
curl http://payments.billing.svc.clusterset.local:8080/healthz</pre>
<blockquote>⚠️ Production tip: plan <strong>non-overlapping pod and service CIDRs</strong> for every cluster from day one (e.g. pods <code>10.100.0.0/16</code>, <code>10.101.0.0/16</code>, ...). Overlapping ranges make flat ClusterMesh/routed connectivity impossible later, and renumbering a live cluster means rebuilding it.</blockquote>
<p>Also remember the data: stateless services fail over easily; the database behind them doesn't. Multi-region active-active needs a data strategy (regional primaries, global DBs like Spanner/Cosmos DB/Aurora Global, or accepting a regional write leader).</p>`,
        he: `<table>
<tr><th>שכבה</th><th>אפשרות</th><th>איך זה עובד</th></tr>
<tr><td>North-south (משתמשים → cluster)</td><td><strong>Global load balancer</strong>: רשומות latency/failover ב-Route 53, ‏Azure Front Door, ‏GCP global external LB / Multi-cluster Gateway, ‏Cloudflare</td><td>עושה health-check ל-ingress של כל cluster ומנתב משתמשים לקרוב והבריא. החלק הכי פשוט והכי חשוב.</td></tr>
<tr><td>East-west, ‏K8s-native</td><td><strong>Multi-Cluster Services ‏(MCS API)</strong></td><td>מייצאים Service עם <code>ServiceExport</code>; ‏clusters אחרים ב-<em>ClusterSet</em> מקבלים <code>ServiceImport</code> שזמין ב-<code>payments.billing.svc.clusterset.local</code>. ממומש ב-GKE, ‏Submariner, ‏Cilium, וב-AWS Cloud Map MCS controller.</td></tr>
<tr><td>East-west, ברמת ה-CNI</td><td><strong>Cilium ClusterMesh</strong></td><td>ה-clusters חולקים state של services וזהויות; Service עם annotation ‏<code>service.cilium.io/global: "true"</code> עושה load-balancing על endpoints מכל ה-clusters, ו-NetworkPolicy עובד בין clusters. דורש pod CIDRs שלא חופפים.</td></tr>
<tr><td>East-west, ברמת ה-mesh</td><td><strong>Istio multi-primary</strong> (או primary-remote)</td><td>כל cluster מריץ istiod משלו, כולם סומכים על <strong>root CA משותף</strong>, והתעבורה עוברת דרך east-west gateways עם mTLS. ‏failover מודע-מיקום: קודם אותו zone, אחר כך אותו region, ואז remote.</td></tr>
</table>
<pre># MCS: export from cluster A
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceExport
metadata: { name: payments, namespace: billing }

# from cluster B
curl http://payments.billing.svc.clusterset.local:8080/healthz</pre>
<blockquote>⚠️ טיפ לפרודקשן: תתכנן <strong>pod CIDRs ו-service CIDRs שלא חופפים</strong> לכל cluster מהיום הראשון (למשל pods ב-<code>10.100.0.0/16</code>, ‏<code>10.101.0.0/16</code>, ...). טווחים חופפים הופכים קישוריות שטוחה של ClusterMesh/routing לבלתי אפשרית בהמשך, ולשנות מספור ל-cluster חי אומר לבנות אותו מחדש.</blockquote>
<p>ותזכור את הדאטה: שירותים stateless עושים failover בקלות; ה-database שמאחוריהם לא. Active-active ב-multi-region דורש אסטרטגיית דאטה (primaries אזוריים, ‏DBs גלובליים כמו Spanner/Cosmos DB/Aurora Global, או לקבל write leader אזורי).</p>`
      }
    },
    {
      h: { en: "Consistency, upgrade cohorts and the cost of each cluster", he: "אחידות, cohorts של שדרוגים והמחיר של כל cluster" },
      body: {
        en: `<p><strong>Config & policy consistency</strong>: drift between clusters is the silent killer ("it works in prod-eu but not prod-us"). Keep one Git source with base + per-cluster overlays (Kustomize / Helm values), apply via ApplicationSets, and enforce guardrails everywhere with the same Kyverno/Gatekeeper policies. Centralize identity (SSO → RBAC groups) and ship all clusters' metrics/logs to one backend with a <code>cluster</code> label on every series.</p>
<p><strong>Upgrades by cohorts</strong> (rings): never upgrade the fleet at once.</p>
<pre>Ring 0: dev-*            → soak 2-3 days
Ring 1: staging-*        → run e2e + load tests, soak 2 days
Ring 2: prod canary cell → 5% of customers, soak 24-72h, watch SLOs
Ring 3: prod-eu          → then prod-us (never both regions the same day)
Gate between rings: no SLO burn, no new Warning event types, add-on versions compatible (check deprecated APIs with pluto / kubent)</pre>
<p>Azure Fleet Manager update runs and GKE rollout sequencing implement exactly this; with EKS you build it with Terraform pipelines or CAPI.</p>
<p><strong>Cost overhead per cluster</strong> (rough, list prices):</p>
<table>
<tr><th>Item</th><th>Per cluster / month</th></tr>
<tr><td>Control plane: EKS $0.10/h, GKE $0.10/h (one free zonal/Autopilot cluster credit), AKS Standard tier $0.10/h</td><td>~$73</td></tr>
<tr><td>System nodes for add-ons (CoreDNS, ingress, Argo agent, monitoring agents, Karpenter...), e.g. 3 × m6i.large</td><td>~$210</td></tr>
<tr><td>Load balancers, NAT gateways per AZ (~$32 each + data), log/metric ingestion</td><td>$100–$1,000+</td></tr>
<tr><td>Lower bin-packing (idle headroom in every cluster)</td><td>10–30% of compute</td></tr>
<tr><td>People: upgrades, incidents, on-call per cluster</td><td>the biggest line</td></tr>
</table>
<blockquote>💡 Real world: teams that went "a cluster per team" often consolidate back to fewer, shared clusters with namespaces + policies once they count 30+ clusters at 15% utilization. Pick the fewest clusters that satisfy blast radius, region and compliance needs — then automate so adding one is cheap.</blockquote>`,
        he: `<p><strong>אחידות של config ו-policy</strong>: drift בין clusters הוא הרוצח השקט ("זה עובד ב-prod-eu אבל לא ב-prod-us"). תחזיק מקור אחד ב-Git עם base + overlays לכל cluster ‏(Kustomize / Helm values), תחיל דרך ApplicationSets, ותאכוף guardrails בכל מקום עם אותן policies של Kyverno/Gatekeeper. תרכז את הזהויות (SSO → קבוצות RBAC) ותשלח metrics/logs מכל ה-clusters ל-backend אחד עם label של <code>cluster</code> על כל סדרה.</p>
<p><strong>שדרוגים ב-cohorts</strong> (rings): אף פעם לא משדרגים את כל ה-fleet בבת אחת.</p>
<pre>Ring 0: dev-*            → soak 2-3 days
Ring 1: staging-*        → run e2e + load tests, soak 2 days
Ring 2: prod canary cell → 5% of customers, soak 24-72h, watch SLOs
Ring 3: prod-eu          → then prod-us (never both regions the same day)
Gate between rings: no SLO burn, no new Warning event types, add-on versions compatible (check deprecated APIs with pluto / kubent)</pre>
<p>Update runs של Azure Fleet Manager ו-rollout sequencing של GKE מממשים בדיוק את זה; ב-EKS בונים את זה עם pipelines של Terraform או עם CAPI.</p>
<p><strong>Overhead של עלות לכל cluster</strong> (בערך, מחירון):</p>
<table>
<tr><th>פריט</th><th>לכל cluster / חודש</th></tr>
<tr><td>Control plane: ‏EKS ‏$0.10/h, ‏GKE ‏$0.10/h (קרדיט ל-cluster zonal/Autopilot אחד בחינם), ‏AKS Standard tier ‏$0.10/h</td><td>~$73</td></tr>
<tr><td>System nodes ל-add-ons ‏(CoreDNS, ingress, Argo agent, monitoring agents, Karpenter...), למשל 3 × m6i.large</td><td>~$210</td></tr>
<tr><td>Load balancers, ‏NAT gateways לכל AZ (כ-$32 כל אחד + דאטה), ingestion של logs/metrics</td><td>$100–$1,000+</td></tr>
<tr><td>bin-packing פחות טוב (headroom ריק בכל cluster)</td><td>10–30% מה-compute</td></tr>
<tr><td>אנשים: שדרוגים, אינסידנטים, on-call לכל cluster</td><td>השורה הכי גדולה</td></tr>
</table>
<blockquote>💡 מהשטח: צוותים שהלכו על "cluster לכל צוות" הרבה פעמים מאחדים חזרה לפחות clusters משותפים עם namespaces + policies ברגע שהם סופרים 30+ clusters בניצולת של 15%. תבחר את המספר הכי קטן של clusters שעונה על צורכי blast radius, ‏region ו-compliance – ואז תעשה אוטומציה כך שהוספת cluster תהיה זולה.</blockquote>`
      }
    }
  ],
  diagram: "users --> global LB (latency/failover, health checks)\n   |--> prod-eu [ingress -> svc] <==MCS / ClusterMesh / Istio east-west==> prod-us [ingress -> svc]\nmgmt cluster: Argo CD ApplicationSets + Cluster API --> dev-eu, staging-eu, prod-eu, prod-us",
  handsOn: [
    { cmd: "argocd cluster list", what: { en: "See every cluster Argo CD manages — the targets your ApplicationSet cluster generator can select by label.", he: "תראה כל cluster ש-Argo CD מנהל – היעדים שה-cluster generator של ה-ApplicationSet יכול לבחור לפי label." } },
    { cmd: "for c in $(kubectl config get-contexts -o name); do echo \"== $c\"; kubectl --context $c version -o json | jq -r .serverVersion.gitVersion; done", what: { en: "Version drift report across all your contexts in one loop.", he: "דוח drift של גרסאות על פני כל ה-contexts שלך בלולאה אחת." } },
    { cmd: "kubectl get applicationsets -n argocd -o wide", what: { en: "Check which ApplicationSets fan out to the fleet and their status.", he: "לבדוק אילו ApplicationSets מתפרסים על ה-fleet ומה הסטטוס שלהם." } },
    { cmd: "clusterctl describe cluster prod-eu-2 -n fleet", what: { en: "With Cluster API: see the health of a cluster's control plane and machine deployments as Kubernetes objects.", he: "עם Cluster API: לראות את הבריאות של ה-control plane וה-machine deployments של cluster כאובייקטים של Kubernetes." } }
  ],
  mnemonic: {
    en: "\"BRUCe\" — Blast radius, Regions, Upgrades, Compliance: the four reasons to add a cluster. If none apply, add a namespace instead.",
    he: "\"BRUCe\" – ‏Blast radius, ‏Regions, ‏Upgrades, ‏Compliance: ארבע הסיבות להוסיף cluster. אם אף אחת לא מתקיימת – תוסיף namespace במקום."
  },
  pitfalls: [
    { en: "Overlapping pod/service CIDRs across clusters — blocks ClusterMesh and routed connectivity forever, short of rebuilding clusters.", he: "pod/service CIDRs חופפים בין clusters – חוסם ClusterMesh וקישוריות routed לתמיד, אלא אם בונים את ה-clusters מחדש." },
    { en: "Upgrading all prod clusters in the same window — you've turned multi-cluster back into one blast radius.", he: "לשדרג את כל ה-clusters של prod באותו חלון – הפכת את ה-multi-cluster בחזרה ל-blast radius אחד." },
    { en: "Hand-built 'pet' clusters with manual tweaks — the next cluster can't be reproduced and drift causes region-specific bugs.", he: "clusters מסוג 'pet' שנבנו ביד עם tweaks ידניים – אי אפשר לשחזר את ה-cluster הבא ו-drift גורם לבאגים שקורים רק ב-region אחד." },
    { en: "Planning stateless failover but forgetting the database — the app fails over to a region whose DB is a read-only replica.", he: "לתכנן failover ל-stateless ולשכוח את ה-database – האפליקציה עוברת ל-region שבו ה-DB הוא replica של read-only." }
  ],
  interview: [
    {
      q: { en: "How would you decide between one big shared cluster and many clusters?", he: "איך היית מחליט בין cluster משותף אחד גדול להרבה clusters?" },
      a: { en: "Start from requirements: blast radius tolerance, regions/residency, compliance isolation, upgrade risk, scale limits. Shared clusters win on utilization and ops cost; multiple clusters win on isolation and safer change. A typical answer is env × region plus a mgmt cluster, namespaces + policies for team isolation inside, and dedicated clusters only for PCI/residency or noisy-neighbor workloads like big GPU training — with everything automated (Terraform/CAPI + ApplicationSets) so cluster count is a choice, not a burden.", he: "מתחילים מהדרישות: סבילות ל-blast radius, ‏regions/residency, בידוד של compliance, סיכון בשדרוגים, מגבלות סקייל. clusters משותפים מנצחים בניצולת ובעלות תפעול; הרבה clusters מנצחים בבידוד ובשינויים בטוחים יותר. תשובה טיפוסית: סביבה × region ועוד mgmt cluster, ‏namespaces + policies לבידוד צוותים בתוכם, ו-clusters ייעודיים רק ל-PCI/residency או ל-workloads של noisy-neighbor כמו אימון GPU גדול – עם הכל באוטומציה (Terraform/CAPI + ApplicationSets) כך שמספר ה-clusters הוא בחירה ולא נטל." }
    },
    {
      q: { en: "Service A in cluster 1 must call service B in cluster 2. What are your options?", he: "Service A ב-cluster 1 צריך לקרוא ל-service B ב-cluster 2. מה האפשרויות שלך?" },
      a: { en: "Simplest: expose B through an internal load balancer / private DNS name and call it like any external dependency. K8s-native: MCS API (ServiceExport/ServiceImport, clusterset.local DNS). CNI: Cilium ClusterMesh global services with cross-cluster NetworkPolicy. Mesh: Istio multi-primary with shared root CA and east-west gateways, giving mTLS and locality failover. Choice depends on existing CNI/mesh, need for transparent failover, and non-overlapping CIDRs.", he: "הכי פשוט: לחשוף את B דרך internal load balancer / שם DNS פרטי ולקרוא לו כמו לכל dependency חיצוני. K8s-native: ‏MCS API ‏(ServiceExport/ServiceImport, DNS של clusterset.local). ‏CNI: ‏global services של Cilium ClusterMesh עם NetworkPolicy בין clusters. ‏Mesh: ‏Istio multi-primary עם root CA משותף ו-east-west gateways, שנותן mTLS ו-failover לפי מיקום. הבחירה תלויה ב-CNI/mesh הקיים, בצורך ב-failover שקוף וב-CIDRs שלא חופפים." }
    }
  ],
  quiz: [
    {
      q: { en: "Which Argo CD feature deploys the same add-ons to every cluster labeled tier=prod automatically?", he: "איזו יכולת של Argo CD פורסת את אותם add-ons לכל cluster עם label ‏tier=prod באופן אוטומטי?" },
      options: [
        { en: "Sync waves", he: "Sync waves" },
        { en: "ApplicationSet with a cluster generator", he: "ApplicationSet עם cluster generator" },
        { en: "Helm hooks", he: "Helm hooks" },
        { en: "Argo Rollouts", he: "Argo Rollouts" }
      ],
      answer: 1,
      explain: { en: "The cluster generator iterates over registered clusters matching a label selector and renders one Application per cluster.", he: "ה-cluster generator עובר על ה-clusters הרשומים שמתאימים ל-label selector ומרנדר Application אחד לכל cluster." }
    },
    {
      q: { en: "With the MCS API, what DNS name reaches an exported Service payments in namespace billing from another cluster in the ClusterSet?", he: "עם MCS API, איזה שם DNS מגיע ל-Service מיוצא בשם payments ב-namespace ‏billing מ-cluster אחר ב-ClusterSet?" },
      options: [
        { en: "payments.billing.svc.cluster.local", he: "payments.billing.svc.cluster.local" },
        { en: "payments.billing.svc.clusterset.local", he: "payments.billing.svc.clusterset.local" },
        { en: "payments.global", he: "payments.global" },
        { en: "billing.payments.mesh", he: "billing.payments.mesh" }
      ],
      answer: 1,
      explain: { en: "cluster.local stays local to each cluster; MCS defines clusterset.local for ServiceImports spanning the ClusterSet.", he: "cluster.local נשאר מקומי לכל cluster; ‏MCS מגדיר clusterset.local בשביל ServiceImports שמתפרסים על ה-ClusterSet." }
    },
    {
      q: { en: "What's the main risk of upgrading prod-eu and prod-us on the same evening?", he: "מה הסיכון המרכזי בשדרוג prod-eu ו-prod-us באותו ערב?" },
      options: [
        { en: "Higher control plane cost", he: "עלות control plane גבוהה יותר" },
        { en: "A regression hits both regions at once, defeating the blast-radius benefit", he: "רגרסיה פוגעת בשני ה-regions בבת אחת, וזה מבטל את היתרון של blast radius" },
        { en: "Argo CD can't sync two clusters", he: "Argo CD לא יכול לעשות sync לשני clusters" },
        { en: "DNS TTLs expire", he: "ה-TTLs של DNS פגים" }
      ],
      answer: 1,
      explain: { en: "Upgrade in rings with soak time; the other region is your fallback only if it hasn't received the same change.", he: "משדרגים ב-rings עם זמן soak; ה-region השני הוא ה-fallback שלך רק אם הוא עוד לא קיבל את אותו שינוי." }
    },
    {
      q: { en: "Which prerequisite is required to connect clusters with Cilium ClusterMesh?", he: "איזה תנאי מקדים נדרש כדי לחבר clusters עם Cilium ClusterMesh?" },
      options: [
        { en: "All clusters in the same region", he: "כל ה-clusters באותו region" },
        { en: "The same node instance types", he: "אותם סוגי instances ל-nodes" },
        { en: "Non-overlapping pod CIDRs (and network reachability between nodes)", he: "pod CIDRs שלא חופפים (וקישוריות רשת בין ה-nodes)" },
        { en: "Istio installed", he: "Istio מותקן" }
      ],
      answer: 2,
      explain: { en: "ClusterMesh routes pod-to-pod across clusters, so pod IPs must be unique across the mesh and nodes must reach each other (peering/VPN/same network).", he: "ClusterMesh מנתב pod-to-pod בין clusters, אז ה-IPs של ה-pods חייבים להיות ייחודיים בכל ה-mesh וה-nodes צריכים להגיע אחד לשני (peering/VPN/אותה רשת)." }
    }
  ],
  related: ["k8s-argocd", "k8s-day2-upgrades", "staff-platform-engineering", "staff-service-mesh", "rel-bcdr", "cloud-regions-azs"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  { term: "kubectx", track: "kubernetes", lesson: "k8s-kubectl-power-tips",
    def: { en: "CLI (with its sibling kubens) to switch kubeconfig contexts and default namespaces in one word, with fuzzy search.", he: "CLI (יחד עם האח שלו kubens) להחלפת contexts של kubeconfig ו-namespace דיפולטי במילה אחת, עם fuzzy search." } },
  { term: "krew", track: "kubernetes", lesson: "k8s-kubectl-power-tips",
    def: { en: "The kubectl plugin manager: kubectl krew install neat tree stern ctx ns.", he: "ה-plugin manager של kubectl: ‏kubectl krew install neat tree stern ctx ns." } },
  { term: "Kubernetes Event", track: "kubernetes", lesson: "k8s-events-audit",
    def: { en: "An API object recording something that happened to another object (reason, type Normal/Warning, count); kept only ~1h by default (--event-ttl), so export it.", he: "אובייקט API שמתעד משהו שקרה לאובייקט אחר (reason, סוג Normal/Warning, count); נשמר רק כשעה כברירת מחדל (--event-ttl), אז מייצאים אותו." } },
  { term: "Audit policy", track: "kubernetes", lesson: "k8s-events-audit",
    def: { en: "Ordered rules (first match wins) telling kube-apiserver what to record per request: None, Metadata, Request or RequestResponse.", he: "חוקים מסודרים (הראשון שמתאים מנצח) שאומרים ל-kube-apiserver מה לרשום על כל בקשה: None, ‏Metadata, ‏Request או RequestResponse." } },
  { term: "CNI", track: "kubernetes", lesson: "k8s-networking-cni",
    def: { en: "Container Network Interface: the plugin contract kubelet/runtime call to give each pod a network namespace, an IP and routes (AWS VPC CNI, Azure CNI, Calico, Cilium).", he: "Container Network Interface: החוזה של ה-plugin שה-kubelet/runtime קוראים לו כדי לתת לכל pod ‏network namespace, ‏IP ו-routes ‏(AWS VPC CNI, Azure CNI, Calico, Cilium)." } },
  { term: "NodeLocal DNSCache", track: "kubernetes", lesson: "k8s-networking-cni",
    def: { en: "A DaemonSet DNS cache on each node (169.254.20.10) that bypasses conntrack and uses TCP to CoreDNS, removing the 5s DNS timeout race and cutting CoreDNS load.", he: "DaemonSet של DNS cache על כל node ‏(169.254.20.10) שעוקף את conntrack ומשתמש ב-TCP מול CoreDNS, מעלים את ה-race של timeout של 5s ב-DNS ומוריד עומס מ-CoreDNS." } },
  { term: "Prefix delegation", track: "kubernetes", lesson: "k8s-networking-cni",
    def: { en: "AWS VPC CNI mode that assigns /28 prefixes (16 IPs) to ENI slots instead of single IPs, raising max pods per node (e.g. m5.large 29 → 110).", he: "מצב של AWS VPC CNI שמקצה prefixes של ‎/28 ‏(16 IPs) ל-slots של ENI במקום IPs בודדים, ומעלה את max pods לכל node (למשל m5.large מ-29 ל-110)." } },
  { term: "Indexed Job", track: "kubernetes", lesson: "k8s-jobs-cronjobs",
    def: { en: "A Job with completionMode: Indexed: each pod gets a stable JOB_COMPLETION_INDEX for static sharding, with optional per-index retry limits.", he: "Job עם completionMode: Indexed: כל pod מקבל JOB_COMPLETION_INDEX יציב בשביל sharding סטטי, עם אפשרות למגבלת ניסיונות לכל אינדקס." } },
  { term: "podFailurePolicy", track: "kubernetes", lesson: "k8s-jobs-cronjobs",
    def: { en: "Job rules that decide per failure (exit code or pod condition) whether to FailJob, FailIndex, Ignore or Count it against backoffLimit.", he: "חוקים ב-Job שמחליטים לכל כישלון (exit code או pod condition) אם לעשות FailJob, ‏FailIndex, ‏Ignore או לספור אותו מול backoffLimit." } },
  { term: "Native sidecar", track: "kubernetes", lesson: "k8s-jobs-cronjobs",
    def: { en: "An init container with restartPolicy: Always: starts before the app, runs alongside it, and is stopped after the main containers exit — so Jobs can complete.", he: "init container עם restartPolicy: Always: עולה לפני האפליקציה, רץ לצידה, ונעצר אחרי שה-containers הראשיים יוצאים – כך ש-Jobs יכולים להסתיים." } },
  { term: "Cluster API", track: "kubernetes", lesson: "k8s-multi-cluster",
    def: { en: "Kubernetes sub-project that manages cluster lifecycle declaratively: clusters and machines are CRDs reconciled by a management cluster.", he: "תת-פרויקט של Kubernetes שמנהל את ה-lifecycle של clusters באופן דקלרטיבי: clusters ו-machines הם CRDs שעוברים reconcile על ידי management cluster." } },
  { term: "Multi-Cluster Services (MCS)", track: "kubernetes", lesson: "k8s-multi-cluster",
    def: { en: "Kubernetes API (ServiceExport / ServiceImport) to share a Service across a ClusterSet, reachable at SERVICE.NAMESPACE.svc.clusterset.local.", he: "API של Kubernetes ‏(ServiceExport / ServiceImport) לשיתוף Service על פני ClusterSet, זמין ב-SERVICE.NAMESPACE.svc.clusterset.local." } },
  { term: "ClusterMesh", track: "kubernetes", lesson: "k8s-multi-cluster",
    def: { en: "Cilium feature connecting clusters' networks: global services load-balanced across clusters and NetworkPolicy by identity across them. Needs non-overlapping pod CIDRs.", he: "יכולת של Cilium שמחברת את הרשתות של clusters: ‏global services עם load-balancing בין clusters ו-NetworkPolicy לפי זהות ביניהם. דורש pod CIDRs שלא חופפים." } }
].forEach(function (g) { window.INFRA.glossary.push(g); });

// ---------------------------------------------------------------------------
// Scenario: DNS ndots + conntrack latency
// ---------------------------------------------------------------------------
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  window.INFRA.scenarios.push({
    id: "k8s-dns-ndots-latency",
    icon: "🐢",
    title: t("Random 5-second latency spikes on checkout", "קפיצות latency אקראיות של 5 שניות ב-checkout"),
    start: "s1",
    steps: {
      s1: {
        text: t("Black Friday week, 11:20. PagerDuty: 'checkout p99 latency 5.3s (SLO 800ms)'. p50 is a healthy 120ms. CPU and memory of the checkout pods look normal. Checkout calls the payment provider (api.payments-psp.com) and two internal services on every order.",
                "שבוע הבלאק פריידי, 11:20. PagerDuty: ‏'checkout p99 latency 5.3s (SLO 800ms)'. ה-p50 בריא – 120ms. ה-CPU וה-memory של ה-pods של checkout נראים תקינים. ‏checkout קורא לספק התשלומים (api.payments-psp.com) ולשני שירותים פנימיים בכל הזמנה."),
        data: `checkout latency (last 30m)        p50    p90    p99
11:00                              118ms  240ms  690ms
11:10                              121ms  310ms  5.1s
11:20                              124ms  5.0s   5.3s
$ kubectl top pods -n shop -l app=checkout | head -4
NAME                        CPU(cores)   MEMORY(bytes)
checkout-6b8f9d7c5-2xkqp    410m         702Mi
checkout-6b8f9d7c5-4mzxq    395m         688Mi
checkout-6b8f9d7c5-9wzlm    430m         715Mi`,
        choices: [
          c("Open a trace of a slow request and see where the time goes", "לפתוח trace של בקשה איטית ולראות לאן הזמן הולך", "s2", 20,
            "Right instinct: p99 stuck at ~5s with healthy p50 smells like a timeout somewhere, and a trace shows exactly which span waits.",
            "אינסטינקט נכון: p99 שתקוע על כ-5s עם p50 בריא מריח כמו timeout איפשהו, ו-trace מראה בדיוק איזה span מחכה."),
          c("Rolling-restart checkout — maybe some pods are stuck", "לעשות rolling restart ל-checkout – אולי חלק מה-pods תקועים", "s1b", 0,
            "A restart destroys evidence and changes nothing: the latency is back within two minutes.",
            "restart מוחק ראיות ולא משנה כלום: ה-latency חוזר תוך שתי דקות."),
          c("Scale checkout from 12 to 30 replicas", "להגדיל את checkout מ-12 ל-30 replicas", "s1b", 0,
            "CPU is at 40% — this isn't a capacity problem. More replicas means more DNS lookups, and it actually gets slightly worse.",
            "ה-CPU על 40% – זו לא בעיית קיבולת. יותר replicas זה יותר DNS lookups, וזה אפילו נהיה קצת יותר גרוע.")
        ]
      },
      s1b: {
        text: t("11:35. Nothing improved; p99 is now 5.4s and the payments team asks if you've 'looked at anything yet'. The incident commander asks for a hypothesis, not another restart.",
                "11:35. שום דבר לא השתפר; ה-p99 עכשיו 5.4s וצוות התשלומים שואל אם 'הסתכלת כבר על משהו'. ה-incident commander מבקש השערה, לא עוד restart."),
        choices: [
          c("OK — open a trace of a slow request", "בסדר – לפתוח trace של בקשה איטית", "s2", 10,
            "Better late than never. Data first.",
            "עדיף מאוחר מאשר אף פעם. קודם דאטה."),
          c("Blame the payment provider and open a ticket with them", "להאשים את ספק התשלומים ולפתוח להם טיקט", "lose", 0,
            "Their status page is green and their own latency metric (from the response headers) is 90ms. You burned an hour waiting on the wrong team.",
            "ה-status page שלהם ירוק וה-latency שלהם (מה-response headers) הוא 90ms. שרפת שעה בהמתנה לצוות הלא נכון.")
        ]
      },
      s2: {
        text: t("The trace is odd: the HTTP call to the payment provider takes 95ms, but there is a 5.0s gap BEFORE the connection is opened. Same pattern, occasionally, on calls to the internal inventory service. Exactly 5.0s every time.",
                "ה-trace מוזר: קריאת ה-HTTP לספק התשלומים לוקחת 95ms, אבל יש פער של 5.0s לפני שה-connection נפתח. אותו דפוס, מדי פעם, בקריאות לשירות ה-inventory הפנימי. בדיוק 5.0s בכל פעם."),
        data: `trace 7f3a9c... POST /checkout  5312ms
├─ db.query orders.insert                    14ms
├─ [gap — no span]                         5004ms
├─ http POST api.payments-psp.com/charges    95ms
│    net.connect 21ms  tls 38ms  ttfb 36ms
└─ kafka.produce order-created                6ms`,
        choices: [
          c("A gap before connect, exactly 5s — check DNS resolution", "פער לפני connect, בדיוק 5s – לבדוק DNS resolution", "s3", 20,
            "Yes. 5 seconds is the default resolver timeout in glibc (options timeout:5). Something before connect() = name resolution.",
            "כן. 5 שניות זה ה-timeout הדיפולטי של ה-resolver ב-glibc ‏(options timeout:5). משהו לפני connect() = פענוח שם."),
          c("Increase the HTTP client timeout to 10s", "להעלות את ה-timeout של ה-HTTP client ל-10s", "s1b", 0,
            "The requests don't fail, they're slow. A bigger timeout hides nothing and fixes nothing.",
            "הבקשות לא נכשלות, הן איטיות. timeout גדול יותר לא מסתיר כלום ולא מתקן כלום.")
        ]
      },
      s3: {
        text: t("You look at CoreDNS and at a checkout pod's resolv.conf. CoreDNS has 2 replicas and is answering a LOT of NXDOMAIN.",
                "אתה מסתכל על CoreDNS ועל ה-resolv.conf של pod של checkout. ל-CoreDNS יש 2 replicas והוא עונה המון NXDOMAIN."),
        data: `$ kubectl exec -n shop checkout-6b8f9d7c5-2xkqp -- cat /etc/resolv.conf
nameserver 172.20.0.10
search shop.svc.cluster.local svc.cluster.local cluster.local eu-west-1.compute.internal
options ndots:5

CoreDNS (rate, last 5m)
coredns_dns_requests_total                 41,200 req/s
coredns_dns_responses_total{rcode=NXDOMAIN}  32,900 /s
coredns_dns_responses_total{rcode=NOERROR}    8,300 /s
coredns pod CPU: 1.9 / 2 cores (limit)  ← throttled`,
        choices: [
          c("ndots:5 — every external lookup tries 4 search suffixes first. Also check conntrack on the nodes.", "ndots:5 – כל lookup חיצוני מנסה קודם 4 search suffixes. וגם לבדוק conntrack על ה-nodes.", "s4", 20,
            "Exactly: api.payments-psp.com has 2 dots < 5, so it generates 8 NXDOMAIN queries before the real 2. And the 5s pattern suggests dropped UDP packets.",
            "בדיוק: ל-api.payments-psp.com יש 2 נקודות < 5, אז הוא מייצר 8 שאילתות NXDOMAIN לפני ה-2 האמיתיות. ודפוס ה-5s מרמז על packets של UDP שנזרקים."),
          c("CoreDNS is broken — delete the CoreDNS pods", "CoreDNS שבור – למחוק את ה-pods של CoreDNS", "s3b", 0,
            "For ~20 seconds, DNS for the WHOLE cluster degrades while the new pods start. Errors spike everywhere, not just in checkout.",
            "בערך ל-20 שניות, ה-DNS של כל ה-cluster נפגע בזמן שה-pods החדשים עולים. שגיאות קופצות בכל מקום, לא רק ב-checkout.")
        ]
      },
      s3b: {
        text: t("11:50. The CoreDNS restart caused a cluster-wide error spike, and after it, the same 5s latency returns. The IC is not happy.",
                "11:50. ה-restart של CoreDNS גרם לקפיצת שגיאות בכל ה-cluster, ואחריו אותו latency של 5s חוזר. ה-IC לא מרוצה."),
        choices: [
          c("Go back to the data: resolv.conf, NXDOMAIN rate, conntrack", "לחזור לדאטה: resolv.conf, קצב NXDOMAIN, ‏conntrack", "s4", 5,
            "Recovering — now investigate instead of restarting.",
            "מתאושש – עכשיו לחקור במקום לעשות restart."),
          c("Restart the nodes one by one", "לעשות restart ל-nodes אחד אחד", "lose", 0,
            "Two hours of node rotation during Black Friday week, with evictions and cold caches. The root cause is untouched.",
            "שעתיים של החלפת nodes בשבוע הבלאק פריידי, עם evictions ו-caches קרים. שורש הבעיה לא נגע.")
        ]
      },
      s4: {
        text: t("On a node running checkout pods you check conntrack. insert_failed is climbing. The checkout image is based on Debian (glibc), which sends A and AAAA queries in parallel from the same socket.",
                "על node שמריץ pods של checkout אתה בודק conntrack. ‏insert_failed מטפס. ה-image של checkout מבוסס על Debian ‏(glibc), ששולח שאילתות A ו-AAAA במקביל מאותו socket."),
        data: `$ kubectl debug node/ip-10-0-11-87.eu-west-1.compute.internal -it --image=nicolaka/netshoot -- conntrack -S
cpu=0  found=0 invalid=412  insert=0 insert_failed=1873 drop=1873 early_drop=0 error=0
cpu=1  found=0 invalid=398  insert=0 insert_failed=1911 drop=1911 early_drop=0 error=0
...
(30s later: insert_failed +214)`,
        choices: [
          c("Mitigate now: set ndots:2 on checkout + scale CoreDNS; then roll out NodeLocal DNSCache", "למתן עכשיו: ndots:2 ל-checkout + להגדיל את CoreDNS; אחר כך לפרוס NodeLocal DNSCache", "s5", 25,
            "Correct layering: ndots cuts query volume ~5× immediately, more CoreDNS replicas remove throttling, and NodeLocal DNSCache removes the conntrack race for good (NOTRACK + TCP upstream).",
            "שכבות נכונות: ndots מוריד את נפח השאילתות בערך פי 5 מיד, יותר replicas של CoreDNS מורידים את ה-throttling, ו-NodeLocal DNSCache מעלים את ה-conntrack race לתמיד (NOTRACK + ‏TCP כלפי מעלה)."),
          c("Raise nf_conntrack_max on all nodes", "להעלות את nf_conntrack_max על כל ה-nodes", "s4b", 5,
            "The table isn't full (no 'table full' in dmesg) — insert_failed here is the A/AAAA race, not capacity. It doesn't help much.",
            "הטבלה לא מלאה (אין 'table full' ב-dmesg) – ה-insert_failed כאן הוא ה-race של A/AAAA, לא קיבולת. זה לא עוזר הרבה.")
        ]
      },
      s4b: {
        text: t("12:10. The p99 barely moved (5.2s). conntrack count is at 18% of max — capacity was never the issue.",
                "12:10. ה-p99 כמעט לא זז (5.2s). ה-conntrack count על 18% מהמקסימום – הקיבולת אף פעם לא הייתה הבעיה."),
        choices: [
          c("Cut the query volume and remove the race: ndots:2, scale CoreDNS, NodeLocal DNSCache", "להוריד את נפח השאילתות ולהעלים את ה-race: ‏ndots:2, להגדיל את CoreDNS, ‏NodeLocal DNSCache", "s5", 10,
            "Now you're fixing the cause.",
            "עכשיו אתה מתקן את הסיבה."),
          c("Switch the checkout image to Alpine to change the resolver", "להחליף את ה-image של checkout ל-Alpine כדי לשנות את ה-resolver", "lose", 0,
            "A risky rebuild mid-incident; musl has its own DNS quirks (no single-request-reopen, different search behavior), and the deploy pipeline takes 40 minutes. The incident drags on.",
            "rebuild מסוכן באמצע אינסידנט; ל-musl יש מוזרויות DNS משלו (בלי single-request-reopen, התנהגות search שונה), וה-deploy pipeline לוקח 40 דקות. האינסידנט נמרח.")
        ]
      },
      s5: {
        text: t("12:15. You patch checkout with dnsConfig ndots:2 and scale CoreDNS to 6 replicas. p99 drops to 640ms within 5 minutes; CoreDNS NXDOMAIN rate falls by 75%. NodeLocal DNSCache is rolled out to one node pool as a canary that afternoon. What do you put in the postmortem?",
                "12:15. אתה עושה patch ל-checkout עם dnsConfig של ndots:2 ומגדיל את CoreDNS ל-6 replicas. ה-p99 יורד ל-640ms תוך 5 דקות; קצב ה-NXDOMAIN ב-CoreDNS יורד ב-75%. ‏NodeLocal DNSCache נפרס על node pool אחד כ-canary באותו אחר צהריים. מה אתה כותב ב-postmortem?"),
        data: `spec:
  template:
    spec:
      dnsConfig:
        options:
          - name: ndots
            value: "2"
checkout p99: 5.3s → 640ms   CoreDNS NXDOMAIN: 32.9k/s → 8.1k/s`,
        choices: [
          c("Action items: NodeLocal DNSCache fleet-wide, CoreDNS autoscaling (proportional), default ndots:2 via a platform policy, alerts on CoreDNS NXDOMAIN ratio and conntrack insert_failed, DNS spans in traces", "Action items: ‏NodeLocal DNSCache בכל ה-fleet, ‏autoscaling ל-CoreDNS ‏(proportional), ‏ndots:2 דיפולטי דרך policy של הפלטפורמה, התראות על יחס NXDOMAIN ב-CoreDNS ועל conntrack insert_failed, ‏spans של DNS ב-traces", "win", 20,
            "Systemic fixes plus detection — the next team that adds an external API won't rediscover this.",
            "תיקונים מערכתיים ועוד זיהוי – הצוות הבא שיוסיף API חיצוני לא יגלה את זה מחדש."),
          c("'Root cause: DNS. Fixed.' and close it", "'Root cause: DNS. תוקן.' ולסגור", "lose", 0,
            "Only checkout got ndots:2. Three weeks later the search service hits the same wall, and nobody connects the dots.",
            "רק checkout קיבל ndots:2. שלושה שבועות אחרי, שירות ה-search נתקע באותו קיר, ואף אחד לא מחבר את הנקודות.")
        ]
      },
      win: {
        text: t("Resolved in under an hour with a clear causal chain: ndots:5 multiplied lookups, CoreDNS got CPU-throttled, and parallel A/AAAA UDP queries lost the conntrack insert race — each loss cost the 5s resolver timeout. You fixed it in layers and made it impossible to repeat.",
                "נפתר בפחות משעה עם שרשרת סיבתית ברורה: ‏ndots:5 הכפיל lookups, ‏CoreDNS קיבל CPU throttling, ושאילתות UDP מקבילות של A/AAAA הפסידו במרוץ ה-insert של conntrack – כל הפסד עלה timeout של 5s של ה-resolver. תיקנת בשכבות ודאגת שזה לא יחזור."),
        end: "win"
      },
      lose: {
        text: t("The incident ran for hours. The lesson: a p99 stuck at exactly 5s with a healthy p50 is a timeout fingerprint — and in Kubernetes the first suspect is DNS (ndots:5, CoreDNS throttling, the conntrack race). Trace first, then fix the cause, not the symptoms.",
                "האינסידנט נמשך שעות. הלקח: ‏p99 שתקוע על בדיוק 5s עם p50 בריא זו טביעת אצבע של timeout – וב-Kubernetes החשוד הראשון הוא DNS ‏(ndots:5, ‏throttling ב-CoreDNS, ה-conntrack race). קודם trace, אחר כך לתקן את הסיבה, לא את הסימפטומים."),
        end: "lose"
      }
    },
    lessons: ["k8s-networking-cni", "net-dns", "obs-traces", "k8s-troubleshooting-playbook"]
  });
})();

// ---------------------------------------------------------------------------
// 42. Pod networking & CNI
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-networking-cni",
  track: "kubernetes",
  order: 42,
  icon: "🕸️",
  level: 3,
  minutes: 18,
  title: { en: "Pod Networking & CNI", he: "רשת של Pods ו-CNI" },
  tldr: {
    en: "Every pod gets its own IP and can reach every other pod without NAT; the CNI plugin decides HOW (VPC IPs, overlay, BGP, eBPF). Most 'network' incidents are really IP exhaustion, DNS (ndots:5 + conntrack), MTU or a NetworkPolicy.",
    he: "כל pod מקבל IP משלו ויכול להגיע לכל pod אחר בלי NAT; ה-CNI plugin מחליט איך (IPs מה-VPC, overlay, BGP, eBPF). רוב אינסידנטי ה'רשת' הם בעצם IPs שנגמרו, DNS ‏(ndots:5 + conntrack), ‏MTU או NetworkPolicy."
  },
  analogy: {
    en: "Think of the cluster as an office campus. Kubernetes' rule: every employee (pod) has a direct phone extension and can dial anyone else directly — no switchboard operator rewriting numbers (no NAT). The CNI is the phone company that wires it: some give every desk a real city number (AWS VPC CNI), some run an internal PBX tunnelled over the city lines (overlay), some use smart routing at every desk (Cilium eBPF). And DNS is the company directory — if looking up a name takes 5 tries before the right one, every call starts with a long wait.",
    he: "תחשוב על ה-cluster כקמפוס משרדים. החוק של Kubernetes: לכל עובד (pod) יש שלוחה ישירה והוא יכול לחייג לכל אחד אחר ישירות – בלי מרכזנית שמשכתבת מספרים (בלי NAT). ה-CNI הוא חברת הטלפונים שמחווטת את זה: יש כאלה שנותנות לכל שולחן מספר עירוני אמיתי (AWS VPC CNI), יש כאלה שמריצות מרכזייה פנימית במנהרה מעל הקווים העירוניים (overlay), ויש כאלה עם ניתוב חכם בכל שולחן (Cilium eBPF). ו-DNS הוא ספר הטלפונים של החברה – אם חיפוש שם לוקח 5 ניסיונות עד שמגיעים לנכון, כל שיחה מתחילה בהמתנה ארוכה."
  },
  sections: [
    {
      h: { en: "The network model and what a CNI actually does", he: "מודל הרשת ומה CNI עושה בפועל" },
      body: {
        en: `<p>Kubernetes defines three rules and leaves the implementation to a plugin:</p>
<ol>
<li>Every pod gets its own IP (all containers in the pod share it and talk over <code>localhost</code>).</li>
<li>Pods can reach all other pods on any node <strong>without NAT</strong> — the source IP the receiver sees is the sender's pod IP.</li>
<li>Agents on a node (kubelet, system daemons) can reach all pods on that node.</li>
</ol>
<p>When kubelet creates a pod sandbox, the container runtime calls the <strong>CNI plugin</strong> binary (<code>/opt/cni/bin/</code>, config in <code>/etc/cni/net.d/</code>) with ADD: create a network namespace, a veth pair (one end is <code>eth0</code> in the pod, the other sits on the host), allocate an IP (IPAM), and program routes so other nodes can reach it. If that fails you get <code>FailedCreatePodSandBox</code> and the pod sits in <code>ContainerCreating</code>.</p>
<p><strong>Overlay vs native routing:</strong></p>
<table>
<tr><th></th><th>Overlay (VXLAN / Geneve / IPIP)</th><th>Native / routed (VPC IPs, BGP)</th></tr>
<tr><td>Pod IPs</td><td>From a private pod CIDR (e.g. <code>10.244.0.0/16</code>) the underlying network doesn't know</td><td>Routable on the underlying network</td></tr>
<tr><td>How packets cross nodes</td><td>Encapsulated in UDP between node IPs (VXLAN on port 8472/4789)</td><td>Sent as-is; VPC routes or BGP know where each pod lives</td></tr>
<tr><td>Cost</td><td>~50 bytes overhead per packet → lower MTU, some CPU</td><td>Consumes real network IPs, needs network cooperation</td></tr>
<tr><td>Reachability from outside the cluster</td><td>Pods not directly reachable (egress is SNATed to the node IP)</td><td>Pods directly reachable from the VPC / on-prem</td></tr>
</table>`,
        he: `<p>Kubernetes מגדיר שלושה חוקים ומשאיר את המימוש ל-plugin:</p>
<ol>
<li>כל pod מקבל IP משלו (כל ה-containers ב-pod חולקים אותו ומדברים דרך <code>localhost</code>).</li>
<li>Pods יכולים להגיע לכל pod אחר על כל node <strong>בלי NAT</strong> – ה-source IP שהצד המקבל רואה הוא ה-IP של ה-pod ששלח.</li>
<li>Agents על node (kubelet, system daemons) יכולים להגיע לכל ה-pods על אותו node.</li>
</ol>
<p>כשה-kubelet יוצר pod sandbox, ה-container runtime קורא לבינארי של ה-<strong>CNI plugin</strong> (<code>/opt/cni/bin/</code>, הקונפיג ב-<code>/etc/cni/net.d/</code>) עם ADD: יוצר network namespace, זוג veth (צד אחד הוא <code>eth0</code> בתוך ה-pod, השני יושב על ה-host), מקצה IP ‏(IPAM), ומתכנת routes כדי שה-nodes האחרים יגיעו אליו. אם זה נכשל אתה מקבל <code>FailedCreatePodSandBox</code> וה-pod תקוע ב-<code>ContainerCreating</code>.</p>
<p><strong>Overlay מול native routing:</strong></p>
<table>
<tr><th></th><th>Overlay ‏(VXLAN / Geneve / IPIP)</th><th>Native / routed ‏(IPs מה-VPC, ‏BGP)</th></tr>
<tr><td>IPs של Pods</td><td>מ-pod CIDR פרטי (למשל <code>10.244.0.0/16</code>) שהרשת שמתחת לא מכירה</td><td>ניתנים לניתוב ברשת שמתחת</td></tr>
<tr><td>איך packets עוברים בין nodes</td><td>עטופים ב-UDP בין ה-IPs של ה-nodes ‏(VXLAN בפורט 8472/4789)</td><td>נשלחים כמו שהם; routes ב-VPC או BGP יודעים איפה כל pod יושב</td></tr>
<tr><td>מחיר</td><td>כ-50 bytes של overhead לכל packet → MTU נמוך יותר, קצת CPU</td><td>צורך IPs אמיתיים מהרשת, דורש שיתוף פעולה מהרשת</td></tr>
<tr><td>גישה מחוץ ל-cluster</td><td>אי אפשר להגיע ל-pods ישירות (egress עובר SNAT ל-IP של ה-node)</td><td>אפשר להגיע ל-pods ישירות מה-VPC / מה-on-prem</td></tr>
</table>`
      }
    },
    {
      h: { en: "The CNIs you'll meet: AWS VPC CNI, Azure CNI Overlay, Calico, Cilium", he: "ה-CNIs שתפגוש: AWS VPC CNI, ‏Azure CNI Overlay, ‏Calico, ‏Cilium" },
      body: {
        en: `<p><strong>AWS VPC CNI</strong> (EKS default): each pod gets a real VPC IP, as a secondary IP on an ENI attached to the node. Max pods is bounded by ENIs × IPs per ENI:</p>
<pre>max pods = ENIs × (IPs per ENI − 1) + 2
m5.large:  3 × (10 − 1) + 2 = 29
m5.xlarge: 4 × (15 − 1) + 2 = 58</pre>
<p>Two classic problems: (1) <strong>subnet exhaustion</strong> — a /24 node subnet has 251 usable IPs, and the CNI also keeps warm IPs per node, so a handful of nodes can drain it; (2) small instances are capped at ~29 pods. Fixes: <strong>prefix delegation</strong> (<code>ENABLE_PREFIX_DELEGATION=true</code>: each ENI slot gets a /28 = 16 IPs, so an m5.large can host 110 pods — but the subnet needs free <em>contiguous</em> /28 blocks), <strong>custom networking</strong> with a secondary VPC CIDR from <code>100.64.0.0/10</code> just for pods, and tuning <code>WARM_IP_TARGET</code> / <code>MINIMUM_IP_TARGET</code>.</p>
<p><strong>Azure CNI</strong>: "flat" mode gives pods VNet IPs (same exhaustion problem). <strong>Azure CNI Overlay</strong> (the current recommendation) gives pods IPs from a private pod CIDR (e.g. <code>192.168.0.0/16</code>, a /24 per node) that doesn't consume VNet space; traffic leaving the cluster is SNATed to the node IP. Kubenet is being retired — migrate to overlay. Azure CNI Powered by Cilium adds the Cilium eBPF dataplane on top.</p>
<p><strong>Calico</strong>: native routing with BGP (peers with your top-of-rack routers on-prem) or IPIP/VXLAN overlay in clouds; famous for its rich NetworkPolicy (including global and deny policies). Often used only as the policy engine on top of the VPC CNI.</p>
<p><strong>Cilium</strong>: eBPF-based dataplane. Replaces kube-proxy, enforces L3–L7 NetworkPolicy (HTTP paths, DNS names), gives flow visibility with <strong>Hubble</strong> (<code>hubble observe --verdict DROPPED</code>), supports transparent encryption (WireGuard) and ClusterMesh. It's the engine behind GKE Dataplane V2.</p>
<blockquote>💡 Real world: "pods stuck in ContainerCreating only in eu-west-1b" on EKS almost always means the subnet in that AZ is out of IPs. Check: <code>aws ec2 describe-subnets --query 'Subnets[].[SubnetId,AvailabilityZone,AvailableIpAddressCount]'</code>.</blockquote>`,
        he: `<p><strong>AWS VPC CNI</strong> (הדיפולט ב-EKS): כל pod מקבל IP אמיתי מה-VPC, בתור secondary IP על ENI שמחובר ל-node. מספר ה-pods המקסימלי מוגבל לפי ENIs × IPs לכל ENI:</p>
<pre>max pods = ENIs × (IPs per ENI − 1) + 2
m5.large:  3 × (10 − 1) + 2 = 29
m5.xlarge: 4 × (15 − 1) + 2 = 58</pre>
<p>שתי בעיות קלאסיות: (1) <strong>subnet exhaustion</strong> – ב-subnet של ‎/24 יש 251 IPs שמישים, וה-CNI גם שומר IPs "חמים" לכל node, אז קומץ nodes יכול לרוקן אותו; (2) instances קטנים מוגבלים לכ-29 pods. פתרונות: <strong>prefix delegation</strong> ‏(<code>ENABLE_PREFIX_DELEGATION=true</code>: כל slot ב-ENI מקבל ‎/28 = 16 IPs, כך ש-m5.large יכול להריץ 110 pods – אבל ה-subnet צריך בלוקים פנויים <em>רציפים</em> של ‎/28), <strong>custom networking</strong> עם secondary CIDR ל-VPC מתוך <code>100.64.0.0/10</code> רק בשביל pods, וכיוונון של <code>WARM_IP_TARGET</code> / <code>MINIMUM_IP_TARGET</code>.</p>
<p><strong>Azure CNI</strong>: מצב "flat" נותן ל-pods IPs מה-VNet (אותה בעיית exhaustion). <strong>Azure CNI Overlay</strong> (ההמלצה הנוכחית) נותן ל-pods IPs מ-pod CIDR פרטי (למשל <code>192.168.0.0/16</code>, ‏‎/24 לכל node) שלא צורך מקום ב-VNet; תעבורה שיוצאת מה-cluster עוברת SNAT ל-IP של ה-node. ‏Kubenet בדרך לפרישה – תעבור ל-overlay. ‏Azure CNI Powered by Cilium מוסיף מעל את ה-dataplane של Cilium מבוסס eBPF.</p>
<p><strong>Calico</strong>: native routing עם BGP (עושה peering לראוטרים ב-on-prem) או overlay של IPIP/VXLAN בעננים; מפורסם בזכות NetworkPolicy עשיר (כולל global ו-deny policies). הרבה פעמים משתמשים בו רק כ-policy engine מעל ה-VPC CNI.</p>
<p><strong>Cilium</strong>: dataplane מבוסס eBPF. מחליף את kube-proxy, אוכף NetworkPolicy ב-L3–L7 ‏(HTTP paths, שמות DNS), נותן נראות של flows עם <strong>Hubble</strong> ‏(<code>hubble observe --verdict DROPPED</code>), תומך בהצפנה שקופה (WireGuard) וב-ClusterMesh. הוא המנוע שמאחורי GKE Dataplane V2.</p>
<blockquote>💡 מהשטח: "pods תקועים ב-ContainerCreating רק ב-eu-west-1b" ב-EKS כמעט תמיד אומר שנגמרו ה-IPs ב-subnet של אותו AZ. בדיקה: <code>aws ec2 describe-subnets --query 'Subnets[].[SubnetId,AvailabilityZone,AvailableIpAddressCount]'</code>.</blockquote>`
      }
    },
    {
      h: { en: "Services under the hood: kube-proxy iptables vs IPVS vs nftables vs eBPF", he: "Services מתחת למכסה: kube-proxy עם iptables מול IPVS מול nftables מול eBPF" },
      body: {
        en: `<p>A ClusterIP doesn't exist on any interface — it's a rule. kube-proxy (a DaemonSet) watches Services and EndpointSlices and programs every node:</p>
<table>
<tr><th>Mode</th><th>How</th><th>At scale</th></tr>
<tr><td><code>iptables</code> (default)</td><td>NAT chains: <code>KUBE-SERVICES</code> → <code>KUBE-SVC-*</code> → random pick via <code>--probability</code> → <code>KUBE-SEP-*</code> DNAT to a pod IP</td><td>Rules grow with services × endpoints; full-table rewrites get slow around 10k+ services, and per-packet matching is sequential.</td></tr>
<tr><td><code>ipvs</code></td><td>Kernel L4 load balancer with hash tables; rr, lc, sh algorithms</td><td>O(1) lookups, but it's being deprecated in favor of nftables</td></tr>
<tr><td><code>nftables</code></td><td>Modern successor to the iptables mode (GA in 1.33), uses verdict maps</td><td>Much faster updates and lookups than iptables</td></tr>
<tr><td>eBPF replacement (Cilium <code>kubeProxyReplacement=true</code>)</td><td>Socket-level load balancing: translates the ClusterIP at <code>connect()</code> time, no per-packet NAT</td><td>No kube-proxy at all; best performance and visibility</td></tr>
</table>
<pre># see what kube-proxy built for a service (iptables mode)
sudo iptables -t nat -L KUBE-SVC-ABCDEF123 -n
target          prot  source     destination
KUBE-SEP-AAA    all   0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.33333
KUBE-SEP-BBB    all   0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.50000
KUBE-SEP-CCC    all   0.0.0.0/0  0.0.0.0/0</pre>
<p>All NAT-based modes rely on <strong>conntrack</strong>: each connection takes a slot in the node's conntrack table (<code>nf_conntrack_max</code>, often 131072–262144). When it fills, the kernel drops new packets: <code>nf_conntrack: table full, dropping packet</code> in <code>dmesg</code>. Check <code>conntrack -S</code> for <code>insert_failed</code> and <code>drop</code>.</p>`,
        he: `<p>ClusterIP לא קיים על אף interface – הוא חוק. ‏kube-proxy ‏(DaemonSet) עושה watch ל-Services ול-EndpointSlices ומתכנת כל node:</p>
<table>
<tr><th>מצב</th><th>איך</th><th>בסקייל</th></tr>
<tr><td><code>iptables</code> (דיפולט)</td><td>שרשראות NAT: ‏<code>KUBE-SERVICES</code> → <code>KUBE-SVC-*</code> → בחירה אקראית עם <code>--probability</code> → <code>KUBE-SEP-*</code> עם DNAT ל-IP של pod</td><td>מספר החוקים גדל עם services × endpoints; שכתוב מלא של הטבלה נהיה איטי בסביבות 10k+ services, וההתאמה לכל packet היא סדרתית.</td></tr>
<tr><td><code>ipvs</code></td><td>load balancer של L4 בתוך ה-kernel עם hash tables; אלגוריתמים rr, lc, sh</td><td>lookup ב-O(1), אבל הוא בתהליך deprecation לטובת nftables</td></tr>
<tr><td><code>nftables</code></td><td>היורש המודרני של מצב iptables ‏(GA ב-1.33), משתמש ב-verdict maps</td><td>עדכונים ו-lookups הרבה יותר מהירים מ-iptables</td></tr>
<tr><td>החלפה ב-eBPF ‏(Cilium עם <code>kubeProxyReplacement=true</code>)</td><td>load balancing ברמת ה-socket: מתרגם את ה-ClusterIP בזמן <code>connect()</code>, בלי NAT לכל packet</td><td>בלי kube-proxy בכלל; הביצועים והנראות הכי טובים</td></tr>
</table>
<pre># see what kube-proxy built for a service (iptables mode)
sudo iptables -t nat -L KUBE-SVC-ABCDEF123 -n
target          prot  source     destination
KUBE-SEP-AAA    all   0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.33333
KUBE-SEP-BBB    all   0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.50000
KUBE-SEP-CCC    all   0.0.0.0/0  0.0.0.0/0</pre>
<p>כל המצבים מבוססי ה-NAT נשענים על <strong>conntrack</strong>: כל connection תופס slot בטבלת ה-conntrack של ה-node ‏(<code>nf_conntrack_max</code>, בדרך כלל 131072–262144). כשהיא מתמלאת, ה-kernel זורק packets חדשים: <code>nf_conntrack: table full, dropping packet</code> ב-<code>dmesg</code>. תבדוק <code>conntrack -S</code> לחיפוש <code>insert_failed</code> ו-<code>drop</code>.</p>`
      }
    },
    {
      h: { en: "CoreDNS, ndots:5 and NodeLocal DNSCache", he: "CoreDNS, ‏ndots:5 ו-NodeLocal DNSCache" },
      body: {
        en: `<p>Every pod's <code>/etc/resolv.conf</code> looks like this:</p>
<pre>nameserver 172.20.0.10          # the kube-dns Service (CoreDNS)
search shop.svc.cluster.local svc.cluster.local cluster.local eu-west-1.compute.internal
options ndots:5</pre>
<p><code>ndots:5</code> means: a name with <strong>fewer than 5 dots</strong> is first tried with every search suffix. So <code>api.stripe.com</code> (2 dots) becomes:</p>
<pre>api.stripe.com.shop.svc.cluster.local      A + AAAA  → NXDOMAIN
api.stripe.com.svc.cluster.local           A + AAAA  → NXDOMAIN
api.stripe.com.cluster.local               A + AAAA  → NXDOMAIN
api.stripe.com.eu-west-1.compute.internal  A + AAAA  → NXDOMAIN (forwarded upstream!)
api.stripe.com                             A + AAAA  → answer
= 10 queries instead of 2</pre>
<p>It exists so short names like <code>payments</code> or <code>payments.billing</code> resolve. But every external call pays 5× the DNS load, and CoreDNS forwards the junk queries it isn't authoritative for to the VPC resolver (AWS limits it to <strong>1024 packets/s per ENI</strong>). Fixes, from cheapest:</p>
<ul>
<li>Use FQDNs with a trailing dot for external hosts: <code>api.stripe.com.</code> — no search list at all.</li>
<li>Lower ndots per workload:
<pre>spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"</pre>
(internal names still work as <code>payments</code> or <code>payments.billing.svc.cluster.local</code>).</li>
<li>Scale CoreDNS (cluster-proportional-autoscaler) and keep its <code>cache</code> plugin on (30s default).</li>
<li><strong>NodeLocal DNSCache</strong>: a DaemonSet listening on a link-local IP (<code>169.254.20.10</code>) on every node; pods query the local cache and misses go to CoreDNS over <strong>TCP</strong>. It skips conntrack for DNS (NOTRACK rules) — which kills the infamous <strong>conntrack race</strong>: glibc sends A and AAAA in parallel from the same UDP socket, one conntrack insert loses the race, the packet is dropped and the resolver waits its <strong>5-second timeout</strong>. That's the classic "random 5s latency" signature. (A glibc-only workaround is <code>options single-request-reopen</code>; musl/Alpine ignores it.)</li>
</ul>
<blockquote>⚠️ Production tip: if p99 latency shows suspicious spikes at exactly +5s or +10s, think DNS timeouts before you think application. Check CoreDNS metrics: <code>coredns_dns_responses_total{rcode="NXDOMAIN"}</code> dwarfing NOERROR is the ndots fingerprint.</blockquote>`,
        he: `<p>ה-<code>/etc/resolv.conf</code> של כל pod נראה ככה:</p>
<pre>nameserver 172.20.0.10          # the kube-dns Service (CoreDNS)
search shop.svc.cluster.local svc.cluster.local cluster.local eu-west-1.compute.internal
options ndots:5</pre>
<p><code>ndots:5</code> אומר: שם עם <strong>פחות מ-5 נקודות</strong> ינוסה קודם עם כל suffix מה-search. אז <code>api.stripe.com</code> (2 נקודות) הופך ל:</p>
<pre>api.stripe.com.shop.svc.cluster.local      A + AAAA  → NXDOMAIN
api.stripe.com.svc.cluster.local           A + AAAA  → NXDOMAIN
api.stripe.com.cluster.local               A + AAAA  → NXDOMAIN
api.stripe.com.eu-west-1.compute.internal  A + AAAA  → NXDOMAIN (forwarded upstream!)
api.stripe.com                             A + AAAA  → answer
= 10 queries instead of 2</pre>
<p>זה קיים כדי ששמות קצרים כמו <code>payments</code> או <code>payments.billing</code> ייפתרו. אבל כל קריאה חיצונית משלמת פי 5 עומס DNS, ו-CoreDNS מעביר את שאילתות הזבל שהוא לא authoritative עליהן ל-resolver של ה-VPC ‏(AWS מגביל אותו ל-<strong>1024 packets/s לכל ENI</strong>). פתרונות, מהזול ליקר:</p>
<ul>
<li>להשתמש ב-FQDN עם נקודה בסוף להוסטים חיצוניים: <code>api.stripe.com.</code> – בלי search list בכלל.</li>
<li>להוריד את ndots לכל workload:
<pre>spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"</pre>
(שמות פנימיים עדיין עובדים כ-<code>payments</code> או <code>payments.billing.svc.cluster.local</code>).</li>
<li>להגדיל את CoreDNS ‏(cluster-proportional-autoscaler) ולהשאיר את ה-plugin של <code>cache</code> דלוק (דיפולט 30s).</li>
<li><strong>NodeLocal DNSCache</strong>: ‏DaemonSet שמאזין על IP מסוג link-local ‏(<code>169.254.20.10</code>) על כל node; ה-pods שואלים את ה-cache המקומי, ו-misses הולכים ל-CoreDNS ב-<strong>TCP</strong>. הוא עוקף את conntrack ל-DNS ‏(חוקי NOTRACK) – וזה הורג את ה-<strong>conntrack race</strong> הידוע: ‏glibc שולח A ו-AAAA במקביל מאותו UDP socket, אחד ה-inserts ל-conntrack מפסיד במרוץ, ה-packet נזרק וה-resolver מחכה ל-<strong>timeout של 5 שניות</strong>. זו החתימה הקלאסית של "latency אקראי של 5s". ‏(workaround שעובד רק ב-glibc הוא <code>options single-request-reopen</code>; ‏musl/Alpine מתעלם ממנו.)</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: אם ב-p99 latency יש קפיצות חשודות של בדיוק +5s או +10s – תחשוב על DNS timeouts לפני שאתה חושב על האפליקציה. תבדוק את המטריקות של CoreDNS: ‏<code>coredns_dns_responses_total{rcode="NXDOMAIN"}</code> שגדול בהרבה מ-NOERROR זו טביעת האצבע של ndots.</blockquote>`
      }
    },
    {
      h: { en: "MTU and debugging pod-to-pod connectivity step by step", he: "MTU ותחקור קישוריות בין pods צעד אחרי צעד" },
      body: {
        en: `<p><strong>MTU:</strong> VXLAN adds 50 bytes, so on a 1500-byte network the pod MTU must be 1450 (WireGuard: ~1420). If the CNI's MTU is wrong, small packets work and big ones silently die: health checks pass, <code>curl</code> of a small page works, but TLS handshakes with big certificate chains or large API responses hang. AWS supports 9001 (jumbo frames) inside a VPC, but paths over the internet, VPN or some peering are 1500. Test with "don't fragment":</p>
<pre>ping -M do -s 1422 10.0.42.17     # 1422 + 28 header = 1450
ping: local error: message too long, mtu=1450   # shows the real limit</pre>
<p><strong>The debugging ladder</strong> — start a toolbox pod (<code>nicolaka/netshoot</code> has dig, curl, tcpdump, mtr, iperf3) and climb one rung at a time:</p>
<pre>kubectl run tmp -n shop --rm -it --image=nicolaka/netshoot -- bash

# 1. DNS: does the name resolve to the ClusterIP?
dig +search payments.billing        # or: nslookup payments.billing
# 2. Service: does the ClusterIP answer?
curl -sv --max-time 3 http://payments.billing:8080/healthz
# 3. Endpoints: does the Service have ready pod IPs on the right port?
kubectl get endpointslices -n billing -l kubernetes.io/service-name=payments
# 4. Pod IP directly (bypasses kube-proxy): works? → the problem is Service/kube-proxy
curl -sv --max-time 3 http://10.0.42.17:8080/healthz
# 5. NetworkPolicy: is there a default-deny in either namespace?
kubectl get networkpolicy -n billing; kubectl get networkpolicy -n shop
# 6. Node level: do packets arrive? (Cilium: hubble observe --to-pod billing/payments-...)
kubectl debug node/ip-10-0-11-87... -it --image=nicolaka/netshoot -- tcpdump -ni any host 10.0.42.17 and port 8080
# 7. CNI health
kubectl get pods -n kube-system -l k8s-app=aws-node     # or cilium / calico-node</pre>
<blockquote>💡 Real world: "works from my pod, times out from theirs" is almost always a NetworkPolicy. Once ANY policy selects a pod for ingress, everything not explicitly allowed is denied — including traffic from the ingress controller and Prometheus.</blockquote>`,
        he: `<p><strong>MTU:</strong> ‏VXLAN מוסיף 50 bytes, אז ברשת של 1500 bytes ה-MTU של ה-pod חייב להיות 1450 ‏(WireGuard: בערך 1420). אם ה-MTU של ה-CNI לא נכון, packets קטנים עוברים וגדולים מתים בשקט: health checks עוברים, <code>curl</code> לעמוד קטן עובד, אבל TLS handshakes עם cert chains גדולים או תשובות API גדולות נתקעים. AWS תומך ב-9001 ‏(jumbo frames) בתוך VPC, אבל מסלולים דרך האינטרנט, VPN או חלק מה-peering הם 1500. בודקים עם "don't fragment":</p>
<pre>ping -M do -s 1422 10.0.42.17     # 1422 + 28 header = 1450
ping: local error: message too long, mtu=1450   # shows the real limit</pre>
<p><strong>סולם התחקור</strong> – תרים pod של ארגז כלים (<code>nicolaka/netshoot</code> כולל dig, curl, tcpdump, mtr, iperf3) ותטפס שלב אחד בכל פעם:</p>
<pre>kubectl run tmp -n shop --rm -it --image=nicolaka/netshoot -- bash

# 1. DNS: does the name resolve to the ClusterIP?
dig +search payments.billing        # or: nslookup payments.billing
# 2. Service: does the ClusterIP answer?
curl -sv --max-time 3 http://payments.billing:8080/healthz
# 3. Endpoints: does the Service have ready pod IPs on the right port?
kubectl get endpointslices -n billing -l kubernetes.io/service-name=payments
# 4. Pod IP directly (bypasses kube-proxy): works? → the problem is Service/kube-proxy
curl -sv --max-time 3 http://10.0.42.17:8080/healthz
# 5. NetworkPolicy: is there a default-deny in either namespace?
kubectl get networkpolicy -n billing; kubectl get networkpolicy -n shop
# 6. Node level: do packets arrive? (Cilium: hubble observe --to-pod billing/payments-...)
kubectl debug node/ip-10-0-11-87... -it --image=nicolaka/netshoot -- tcpdump -ni any host 10.0.42.17 and port 8080
# 7. CNI health
kubectl get pods -n kube-system -l k8s-app=aws-node     # or cilium / calico-node</pre>
<blockquote>💡 מהשטח: "עובד מה-pod שלי, timeout מה-pod שלהם" זה כמעט תמיד NetworkPolicy. ברגע ש-policy כלשהי בוחרת pod ל-ingress, כל מה שלא מותר במפורש נחסם – כולל תעבורה מה-ingress controller ומ-Prometheus.</blockquote>`
      }
    }
  ],
  diagram: "pod A (10.0.3.17) --veth--> node1 [kube-proxy/eBPF: ClusterIP -> pod IP, conntrack]\n   --(VPC route | VXLAN encap | BGP)--> node2 --veth--> pod B (10.0.42.17)\npod --DNS--> NodeLocal DNSCache 169.254.20.10 --TCP--> CoreDNS --> upstream (VPC resolver)",
  handsOn: [
    { cmd: "kubectl run tmp --rm -it --image=nicolaka/netshoot -- cat /etc/resolv.conf", what: { en: "See the search list and ndots:5 your pods really use.", he: "תראה את ה-search list ואת ndots:5 שה-pods שלך באמת משתמשים בהם." } },
    { cmd: "kubectl run tmp --rm -it --image=nicolaka/netshoot -- dig +search +showsearch google.com", what: { en: "Watch every search-suffix query fail before the real one succeeds.", he: "תראה כל שאילתה עם search suffix נכשלת לפני שהאמיתית מצליחה." } },
    { cmd: "kubectl get endpointslices -A -l kubernetes.io/service-name=<svc>", what: { en: "Confirm a Service has ready endpoints before blaming the network.", he: "תוודא של-Service יש endpoints מוכנים לפני שאתה מאשים את הרשת." } },
    { cmd: "kubectl get nodes -o custom-columns=NAME:.metadata.name,MAXPODS:.status.allocatable.pods", what: { en: "See max pods per node — on EKS without prefix delegation it's the ENI formula.", he: "תראה max pods לכל node – ב-EKS בלי prefix delegation זו נוסחת ה-ENI." } },
    { cmd: "kubectl -n kube-system get configmap coredns -o yaml", what: { en: "Read the Corefile: cache, forward, health and any stub domains.", he: "תקרא את ה-Corefile: ‏cache, ‏forward, ‏health ו-stub domains אם יש." } }
  ],
  mnemonic: {
    en: "\"IP, DNS, MTU, Policy\" — the four usual suspects, in that order: out of IPs, ndots/conntrack DNS, packets too big, a NetworkPolicy denying it.",
    he: "\"IP, DNS, MTU, Policy\" – ארבעת החשודים הקבועים, לפי הסדר: נגמרו IPs, ‏DNS עם ndots/conntrack, ‏packets גדולים מדי, NetworkPolicy שחוסם."
  },
  pitfalls: [
    { en: "Sizing EKS node subnets as /24 with the VPC CNI — you run out of IPs long before CPU. Plan /19 or larger per AZ for pods, or use prefix delegation / a 100.64.0.0/10 secondary CIDR.", he: "לתכנן subnets של nodes ב-EKS כ-‎/24 עם ה-VPC CNI – ה-IPs נגמרים הרבה לפני ה-CPU. תתכנן ‎/19 ומעלה לכל AZ בשביל pods, או תשתמש ב-prefix delegation / ב-secondary CIDR מתוך 100.64.0.0/10." },
    { en: "Ignoring ndots:5 for chatty services calling external APIs — 5× DNS load, NXDOMAIN storms and upstream resolver throttling.", he: "להתעלם מ-ndots:5 בשירותים פטפטנים שקוראים ל-APIs חיצוניים – פי 5 עומס DNS, סערות NXDOMAIN ו-throttling ב-resolver שמעל." },
    { en: "Using Alpine (musl) and expecting resolv.conf tweaks like single-request-reopen to work — musl ignores them; use NodeLocal DNSCache instead.", he: "להשתמש ב-Alpine ‏(musl) ולצפות ש-tweaks כמו single-request-reopen יעבדו – musl מתעלם מהם; תשתמש ב-NodeLocal DNSCache במקום." },
    { en: "Adding a default-deny NetworkPolicy without allowing DNS egress to kube-system on UDP/TCP 53 — every pod in the namespace instantly 'loses the network'.", he: "להוסיף NetworkPolicy של default-deny בלי לאפשר egress של DNS ל-kube-system על UDP/TCP 53 – כל pod ב-namespace 'מאבד את הרשת' מיד." }
  ],
  interview: [
    {
      q: { en: "Users see random +5s latency on calls to an external API from Kubernetes. What do you suspect and how do you prove it?", he: "משתמשים רואים latency אקראי של +5s בקריאות ל-API חיצוני מתוך Kubernetes. במה אתה חושד ואיך אתה מוכיח?" },
      a: { en: "DNS: ndots:5 turns each lookup into ~10 queries, and parallel A/AAAA queries over one UDP socket hit a conntrack insert race — a dropped packet means waiting out the resolver's 5s timeout. Proof: traces show the gap before connect; the CoreDNS NXDOMAIN rate is far above NOERROR; conntrack -S shows insert_failed rising on nodes. Fix: ndots 2 or trailing-dot FQDNs, NodeLocal DNSCache (no conntrack, TCP upstream), scale CoreDNS, and connection reuse in the client.", he: "DNS: ‏ndots:5 הופך כל lookup לכ-10 שאילתות, ושאילתות A/AAAA מקבילות על אותו UDP socket נתקלות ב-conntrack insert race – packet שנזרק אומר לחכות ל-timeout של 5s של ה-resolver. הוכחה: traces מראים את הפער לפני ה-connect; קצב ה-NXDOMAIN ב-CoreDNS הרבה מעל NOERROR; ‏conntrack -S מראה insert_failed עולה על ה-nodes. תיקון: ndots 2 או FQDN עם נקודה בסוף, ‏NodeLocal DNSCache ‏(בלי conntrack, ‏TCP כלפי מעלה), להגדיל את CoreDNS, ו-connection reuse בצד ה-client." }
    },
    {
      q: { en: "Overlay vs native routing — when would you pick each?", he: "Overlay מול native routing – מתי תבחר בכל אחד?" },
      a: { en: "Native (AWS VPC CNI, Azure CNI flat, Calico BGP) when pods must be reachable from the VPC/on-prem, for best performance and simple debugging — but it consumes routable IPs, so you need big subnets or prefix delegation. Overlay (Azure CNI Overlay, Cilium/Calico VXLAN) when IP space is scarce or the network team can't route pod CIDRs — the cost is ~50B of overhead (lower MTU) and SNAT on egress, so external systems see node IPs.", he: "Native ‏(AWS VPC CNI, Azure CNI flat, Calico BGP) כשצריך להגיע ל-pods מה-VPC/on-prem, בשביל הביצועים הכי טובים ו-debugging פשוט – אבל זה צורך IPs שניתנים לניתוב, אז צריך subnets גדולים או prefix delegation. ‏Overlay ‏(Azure CNI Overlay, Cilium/Calico VXLAN) כשמרחב ה-IPs דל או שצוות הרשת לא יכול לנתב pod CIDRs – המחיר הוא כ-50B של overhead ‏(MTU נמוך יותר) ו-SNAT ב-egress, כך שמערכות חיצוניות רואות IPs של nodes." }
    }
  ],
  quiz: [
    {
      q: { en: "With ndots:5 and 4 search domains, how many DNS queries can a single lookup of api.stripe.com cause (A + AAAA)?", he: "עם ndots:5 ו-4 search domains, כמה שאילתות DNS יכול לגרום lookup אחד של api.stripe.com ‏(A + AAAA)?" },
      options: [
        { en: "2", he: "2" },
        { en: "4", he: "4" },
        { en: "10", he: "10" },
        { en: "1", he: "1" }
      ],
      answer: 2,
      explain: { en: "2 dots < 5, so each of the 4 search suffixes is tried first (4 × 2 = 8 NXDOMAIN queries), then the absolute name (2 more) = 10.", he: "2 נקודות < 5, אז כל אחד מ-4 ה-search suffixes מנוסה קודם (4 × 2 = 8 שאילתות NXDOMAIN), ואז השם המוחלט (עוד 2) = 10." }
    },
    {
      q: { en: "On EKS with the default VPC CNI, how many pods can an m5.large (3 ENIs, 10 IPs each) run without prefix delegation?", he: "ב-EKS עם ה-VPC CNI הדיפולטי, כמה pods יכול להריץ m5.large ‏(3 ENIs, ‏10 IPs לכל אחד) בלי prefix delegation?" },
      options: [
        { en: "110", he: "110" },
        { en: "30", he: "30" },
        { en: "29", he: "29" },
        { en: "250", he: "250" }
      ],
      answer: 2,
      explain: { en: "3 × (10 − 1) + 2 = 29. Each ENI's primary IP isn't used for pods; the +2 accounts for host-network pods like aws-node and kube-proxy.", he: "3 × (10 − 1) + 2 = 29. ה-IP הראשי של כל ENI לא משמש pods; ה-+2 מתייחס ל-pods ב-host network כמו aws-node ו-kube-proxy." }
    },
    {
      q: { en: "Health checks pass and small requests work, but large responses and some TLS handshakes hang between pods on different nodes. Prime suspect?", he: "Health checks עוברים ובקשות קטנות עובדות, אבל תשובות גדולות וחלק מה-TLS handshakes נתקעים בין pods על nodes שונים. החשוד המרכזי?" },
      options: [
        { en: "CoreDNS is down", he: "CoreDNS למטה" },
        { en: "MTU mismatch (overlay overhead not accounted for)", he: "אי-התאמה ב-MTU (לא התחשבו ב-overhead של ה-overlay)" },
        { en: "Wrong readiness probe", he: "readiness probe לא נכון" },
        { en: "ResourceQuota exceeded", he: "חריגה מ-ResourceQuota" }
      ],
      answer: 1,
      explain: { en: "Packets bigger than the real path MTU are dropped when DF is set (and PMTUD is often blocked), so only large transfers fail. Check with ping -M do -s.", he: "Packets שגדולים מה-MTU האמיתי של המסלול נזרקים כש-DF דלוק (ו-PMTUD הרבה פעמים חסום), אז רק העברות גדולות נכשלות. בודקים עם ping -M do -s." }
    },
    {
      q: { en: "Why does NodeLocal DNSCache reduce the 'random 5s DNS timeout' problem?", he: "למה NodeLocal DNSCache מפחית את בעיית ה-'timeout אקראי של 5s ב-DNS'?" },
      options: [
        { en: "It sets ndots to 1 automatically", he: "הוא משנה אוטומטית את ndots ל-1" },
        { en: "It bypasses conntrack for pod DNS and uses TCP to CoreDNS, avoiding the UDP conntrack insert race", he: "הוא עוקף את conntrack ל-DNS של ה-pods ומשתמש ב-TCP מול CoreDNS, וכך נמנע מה-conntrack insert race של UDP" },
        { en: "It replaces CoreDNS entirely", he: "הוא מחליף את CoreDNS לגמרי" },
        { en: "It disables AAAA queries", he: "הוא מבטל שאילתות AAAA" }
      ],
      answer: 1,
      explain: { en: "Pods talk to a local IP covered by NOTRACK rules, so parallel A/AAAA packets don't race in conntrack; misses go upstream over TCP. It also caches, cutting CoreDNS load.", he: "ה-pods מדברים עם IP מקומי שמכוסה בחוקי NOTRACK, כך ש-packets מקבילים של A/AAAA לא מתחרים ב-conntrack; ‏misses הולכים למעלה ב-TCP. הוא גם עושה cache, מה שמוריד עומס מ-CoreDNS." }
    }
  ],
  related: ["k8s-services", "net-dns", "k8s-security-policy", "staff-ebpf-cilium", "net-troubleshooting", "net-vpc"]
});
