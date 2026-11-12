// Kubernetes track, part B: running Kubernetes for real (advanced, level 3)
// Lessons: k8s-troubleshooting-playbook, k8s-ingress-certs-dns, k8s-operators-crds,
//          k8s-security-policy, k8s-cluster-observability, k8s-day2-upgrades
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 30. The troubleshooting playbook
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-troubleshooting-playbook",
  track: "kubernetes",
  order: 30,
  icon: "🩺",
  level: 3,
  minutes: 18,
  title: { en: "The Kubernetes Troubleshooting Playbook", he: "ה-Playbook לתחקור תקלות ב-Kubernetes" },
  tldr: {
    en: "Debug by layer: pod → service → ingress → node → cluster. At every layer: describe, events, logs --previous, -o yaml — then match the symptom to the table.",
    he: "מתחקרים לפי שכבות: pod → service → ingress → node → cluster. בכל שכבה: describe, events, logs --previous, -o yaml – ואז מתאימים את הסימפטום לטבלה."
  },
  analogy: {
    en: "An ER doctor doesn't start with an MRI. Triage first: is the patient breathing (pod running?), is blood flowing (traffic reaching it?), is the hospital itself on fire (node / cluster)? Each layer has a few vital signs you check in the same order every time. The status column in <code>kubectl get pods</code> is the patient's chart — <code>CrashLoopBackOff</code>, <code>Pending</code>, <code>OOMKilled</code> each point to a short list of diagnoses, and you have a standard test for each.",
    he: "רופא במיון לא מתחיל מ-MRI. קודם triage: האם המטופל נושם (ה-pod רץ?), האם הדם זורם (התעבורה מגיעה אליו?), האם בית החולים עצמו בוער (node / cluster)? לכל שכבה יש כמה סימנים חיוניים שבודקים באותו סדר כל פעם. עמודת ה-STATUS ב-<code>kubectl get pods</code> היא הגיליון הרפואי – <code>CrashLoopBackOff</code>, <code>Pending</code>, <code>OOMKilled</code> – כל אחד מצביע על רשימה קצרה של אבחנות, ולכל אחת יש בדיקה סטנדרטית."
  },
  sections: [
    {
      h: { en: "The method: layers + four golden commands", he: "השיטה: שכבות + ארבע פקודות זהב" },
      body: {
        en: `<p>Most time lost in incidents is lost by jumping layers: restarting ingress controllers when the pod has no endpoints, or blaming DNS when the container never started. Walk the layers <strong>in order</strong> and stop at the first broken one:</p>
<ol>
<li><strong>Pod</strong> — is it Running and Ready? Restarts? Last exit code?</li>
<li><strong>Service</strong> — does it have ready endpoints on the right port?</li>
<li><strong>Ingress / Gateway</strong> — does the controller route to that Service, with a valid cert?</li>
<li><strong>Node</strong> — is the node Ready, without pressure conditions?</li>
<li><strong>Cluster</strong> — API server, CoreDNS, CNI, admission webhooks, quotas.</li>
</ol>
<p>At every layer the same four commands answer 80% of questions:</p>
<pre>kubectl describe pod web-7d9f8b6c4-2xkqp -n shop      # state, last state, exit code, events
kubectl events -n shop --for pod/web-7d9f8b6c4-2xkqp   # (or) get events --sort-by=.lastTimestamp
kubectl logs web-7d9f8b6c4-2xkqp -n shop --previous   # logs of the container that DIED
kubectl get pod web-7d9f8b6c4-2xkqp -n shop -o yaml   # the truth: spec + status + conditions</pre>
<p>For a whole namespace: <code>kubectl get events -n shop --sort-by=.lastTimestamp --field-selector type=Warning</code>. Events live only <strong>~1 hour</strong> by default (<code>--event-ttl=1h</code>), so capture them early or ship them with an events exporter.</p>
<blockquote>⚠️ Production tip: before you delete or restart anything, save evidence: <code>kubectl describe</code> and <code>logs --previous</code> into the incident channel. A restart destroys the previous container's state — the one piece of data that explains the crash.</blockquote>`,
        he: `<p>רוב הזמן שהולך לאיבוד באינסידנטים הולך על קפיצה בין שכבות: עושים restart ל-ingress controller כשבכלל אין ל-Service endpoints, או מאשימים DNS כשהקונטיינר אפילו לא עלה. עוברים על השכבות <strong>לפי הסדר</strong> ועוצרים בשכבה הראשונה שבורה:</p>
<ol>
<li><strong>Pod</strong> – הוא Running ו-Ready? יש restarts? מה ה-exit code האחרון?</li>
<li><strong>Service</strong> – יש לו endpoints מוכנים על הפורט הנכון?</li>
<li><strong>Ingress / Gateway</strong> – ה-controller מנתב ל-Service הזה, עם cert תקין?</li>
<li><strong>Node</strong> – ה-node במצב Ready, בלי pressure conditions?</li>
<li><strong>Cluster</strong> – API server, CoreDNS, CNI, admission webhooks, quotas.</li>
</ol>
<p>בכל שכבה אותן ארבע פקודות עונות על 80% מהשאלות:</p>
<pre>kubectl describe pod web-7d9f8b6c4-2xkqp -n shop      # state, last state, exit code, events
kubectl events -n shop --for pod/web-7d9f8b6c4-2xkqp   # (or) get events --sort-by=.lastTimestamp
kubectl logs web-7d9f8b6c4-2xkqp -n shop --previous   # logs of the container that DIED
kubectl get pod web-7d9f8b6c4-2xkqp -n shop -o yaml   # the truth: spec + status + conditions</pre>
<p>לכל ה-namespace: <code>kubectl get events -n shop --sort-by=.lastTimestamp --field-selector type=Warning</code>. Events חיים רק <strong>בערך שעה</strong> כברירת מחדל (<code>--event-ttl=1h</code>), אז תתפסו אותם מוקדם או תשלחו אותם החוצה עם events exporter.</p>
<blockquote>⚠️ טיפ לפרודקשן: לפני שמוחקים או עושים restart למשהו – שומרים ראיות: <code>kubectl describe</code> ו-<code>logs --previous</code> לתוך ערוץ האינסידנט. Restart מוחק את ה-state של הקונטיינר הקודם – בדיוק פיסת המידע שמסבירה למה הוא קרס.</blockquote>`
      }
    },
    {
      h: { en: "Symptom table — pod layer", he: "טבלת סימפטומים – שכבת ה-Pod" },
      body: {
        en: `<table>
<tr><th>Status / error</th><th>Likely causes</th><th>First commands</th><th>Fix</th></tr>
<tr><td><code>Pending</code></td><td><code>Insufficient cpu/memory</code>; untolerated taint; <code>pod has unbound immediate PersistentVolumeClaims</code>; <code>didn't match Pod's node affinity/selector</code></td><td><code>describe pod</code> (FailedScheduling event), <code>kubectl describe node | grep -A8 Allocated</code></td><td>Right-size requests, add nodes / fix autoscaler limits, add toleration, fix PVC/StorageClass, relax affinity</td></tr>
<tr><td><code>ErrImagePull</code> / <code>ImagePullBackOff</code></td><td>Tag doesn't exist (<code>not found</code>); private registry auth (<code>401</code>, <code>pull access denied</code>); Docker Hub <code>429 toomanyrequests</code></td><td><code>describe pod</code> → Events; <code>crane manifest img:tag</code> / <code>docker pull</code> locally</td><td>Fix tag/digest, add <code>imagePullSecrets</code> or node IAM (ECR), use a pull-through cache / mirror</td></tr>
<tr><td><code>CrashLoopBackOff</code></td><td>App exits: bad config, missing env, can't reach DB, failing liveness probe kills it</td><td><code>logs --previous</code>, <code>describe</code> → Last State / Exit Code</td><td>Fix config; exit 1 = app error, 137 = killed, 143 = SIGTERM; give liveness a <code>startupProbe</code></td></tr>
<tr><td><code>OOMKilled</code> (exit 137)</td><td>Memory limit too low, leak, JVM heap &gt; limit</td><td><code>describe</code> → <code>Reason: OOMKilled</code>; <code>kubectl top pod --containers</code></td><td>Raise limit to real peak +20%, set <code>-XX:MaxRAMPercentage=75</code>, fix the leak</td></tr>
<tr><td><code>CreateContainerConfigError</code></td><td><code>secret "db-creds" not found</code> / <code>couldn't find key DB_PASSWORD in Secret</code>; same for ConfigMap</td><td><code>describe pod</code>, <code>kubectl get secret db-creds -o jsonpath='{.data}'</code></td><td>Create the key (check ExternalSecret sync status), fix the key name, or mark <code>optional: true</code></td></tr>
<tr><td>Running but <code>0/1 READY</code></td><td>Readiness probe failing: wrong path/port, slow startup, dependency down</td><td><code>describe</code> → <code>Readiness probe failed: HTTP probe failed with statuscode: 404</code></td><td>Fix probe path/port (use named ports), tune <code>initialDelaySeconds</code>/<code>startupProbe</code></td></tr>
</table>
<p>Typical scheduler event to read <em>slowly</em> — every clause is a separate reason:</p>
<pre>Warning  FailedScheduling  default-scheduler  0/6 nodes are available:
  2 Insufficient cpu, 1 node(s) had untolerated taint {dedicated: gpu},
  3 node(s) didn't match Pod's node affinity/selector.
  preemption: 0/6 nodes are available: 6 No preemption victims found for incoming pod.</pre>`,
        he: `<table>
<tr><th>Status / שגיאה</th><th>סיבות סבירות</th><th>פקודות ראשונות</th><th>תיקון</th></tr>
<tr><td><code>Pending</code></td><td><code>Insufficient cpu/memory</code>; taint בלי toleration; <code>pod has unbound immediate PersistentVolumeClaims</code>; <code>didn't match Pod's node affinity/selector</code></td><td><code>describe pod</code> (event של FailedScheduling), <code>kubectl describe node | grep -A8 Allocated</code></td><td>להקטין requests, להוסיף nodes / לתקן limits של ה-autoscaler, להוסיף toleration, לתקן PVC/StorageClass, לרכך affinity</td></tr>
<tr><td><code>ErrImagePull</code> / <code>ImagePullBackOff</code></td><td>Tag לא קיים (<code>not found</code>); auth ל-registry פרטי (<code>401</code>, <code>pull access denied</code>); Docker Hub <code>429 toomanyrequests</code></td><td><code>describe pod</code> → Events; <code>crane manifest img:tag</code> / <code>docker pull</code> מקומית</td><td>לתקן tag/digest, להוסיף <code>imagePullSecrets</code> או IAM ל-node (ECR), pull-through cache / mirror</td></tr>
<tr><td><code>CrashLoopBackOff</code></td><td>האפליקציה יוצאת: config שגוי, env חסר, אין גישה ל-DB, liveness probe שהורג אותה</td><td><code>logs --previous</code>, <code>describe</code> → Last State / Exit Code</td><td>לתקן config; exit 1 = שגיאת אפליקציה, 137 = נהרג, 143 = SIGTERM; לתת ל-liveness <code>startupProbe</code></td></tr>
<tr><td><code>OOMKilled</code> (exit 137)</td><td>memory limit נמוך מדי, leak, heap של JVM גדול מה-limit</td><td><code>describe</code> → <code>Reason: OOMKilled</code>; <code>kubectl top pod --containers</code></td><td>להעלות limit לשיא האמיתי +20%, <code>-XX:MaxRAMPercentage=75</code>, לתקן את ה-leak</td></tr>
<tr><td><code>CreateContainerConfigError</code></td><td><code>secret "db-creds" not found</code> / <code>couldn't find key DB_PASSWORD in Secret</code>; אותו דבר ל-ConfigMap</td><td><code>describe pod</code>, <code>kubectl get secret db-creds -o jsonpath='{.data}'</code></td><td>ליצור את ה-key (לבדוק סטטוס sync של ה-ExternalSecret), לתקן שם key, או <code>optional: true</code></td></tr>
<tr><td>Running אבל <code>0/1 READY</code></td><td>Readiness probe נכשל: path/port שגוי, startup איטי, תלות שנפלה</td><td><code>describe</code> → <code>Readiness probe failed: HTTP probe failed with statuscode: 404</code></td><td>לתקן path/port של ה-probe (named ports), לכוונן <code>initialDelaySeconds</code>/<code>startupProbe</code></td></tr>
</table>
<p>Event טיפוסי של ה-scheduler שצריך לקרוא <em>לאט</em> – כל פסוקית היא סיבה נפרדת:</p>
<pre>Warning  FailedScheduling  default-scheduler  0/6 nodes are available:
  2 Insufficient cpu, 1 node(s) had untolerated taint {dedicated: gpu},
  3 node(s) didn't match Pod's node affinity/selector.
  preemption: 0/6 nodes are available: 6 No preemption victims found for incoming pod.</pre>`
      }
    },
    {
      h: { en: "Symptom table — service, DNS & ingress layer", he: "טבלת סימפטומים – שכבת Service, DNS ו-Ingress" },
      body: {
        en: `<table>
<tr><th>Symptom</th><th>Likely causes</th><th>First commands</th><th>Fix</th></tr>
<tr><td>Service has no endpoints</td><td>Selector doesn't match pod labels (typo, <code>app: web</code> vs <code>app.kubernetes.io/name: web</code>); pods not Ready</td><td><code>kubectl get endpointslices -l kubernetes.io/service-name=web</code>, <code>kubectl get pods -l app=web --show-labels</code></td><td>Align selector and labels; fix readiness</td></tr>
<tr><td>Connection refused via Service</td><td><code>targetPort</code> ≠ port the app listens on</td><td><code>kubectl get svc web -o yaml</code> vs <code>containerPort</code>; curl the pod IP from netshoot</td><td>Use named <code>targetPort: http</code></td></tr>
<tr><td>DNS: <code>could not resolve host</code>, 5s delays</td><td>CoreDNS down/overloaded; <code>ndots:5</code> makes <code>api.stripe.com</code> try 4 cluster suffixes first; conntrack races</td><td><code>kubectl -n kube-system logs -l k8s-app=kube-dns</code>; <code>dig</code> from netshoot; <code>cat /etc/resolv.conf</code></td><td>Scale CoreDNS, NodeLocal DNSCache, <code>dnsConfig</code> ndots:2 or trailing-dot FQDNs</td></tr>
<tr><td>Ingress <code>503</code></td><td>No ready endpoints behind the backend Service</td><td>endpointslices, controller logs</td><td>Fix readiness / selector</td></tr>
<tr><td>Ingress <code>502</code></td><td>Upstream refused/reset: wrong port, HTTP vs HTTPS backend, app closes keep-alive early, pod killed before removal from endpoints</td><td>Controller logs: <code>connect() failed (111: Connection refused)</code>, <code>upstream prematurely closed connection</code></td><td>Fix targetPort / <code>backend-protocol</code>; app keep-alive &gt; LB idle timeout; <code>preStop</code> sleep</td></tr>
<tr><td>Ingress <code>504</code></td><td>Upstream slower than <code>proxy-read-timeout</code> (60s default)</td><td><code>upstream timed out (110: Operation timed out)</code></td><td>Fix slowness, or raise timeout per Ingress — not globally</td></tr>
</table>
<p>The ndots trap in one picture — a pod's <code>/etc/resolv.conf</code>:</p>
<pre>search shop.svc.cluster.local svc.cluster.local cluster.local eu-west-1.compute.internal
nameserver 172.20.0.10
options ndots:5
# "api.stripe.com" has 2 dots (&lt; 5) → tried as api.stripe.com.shop.svc.cluster.local, ... first
# 4 NXDOMAIN round-trips (x2 for A + AAAA) before the real lookup</pre>
<pre>spec:
  dnsConfig:
    options:
    - name: ndots
      value: "2"</pre>
<blockquote>💡 Real world: 503 vs 502 is the fastest triage bit you have. 503 from ingress-nginx = "I have nobody to send it to". 502 = "I sent it and the pod answered badly or hung up". 504 = "I sent it and gave up waiting".</blockquote>`,
        he: `<table>
<tr><th>סימפטום</th><th>סיבות סבירות</th><th>פקודות ראשונות</th><th>תיקון</th></tr>
<tr><td>ל-Service אין endpoints</td><td>ה-selector לא תואם ל-labels של ה-pods (טעות הקלדה, <code>app: web</code> מול <code>app.kubernetes.io/name: web</code>); pods לא Ready</td><td><code>kubectl get endpointslices -l kubernetes.io/service-name=web</code>, <code>kubectl get pods -l app=web --show-labels</code></td><td>ליישר selector ו-labels; לתקן readiness</td></tr>
<tr><td>Connection refused דרך ה-Service</td><td><code>targetPort</code> שונה מהפורט שהאפליקציה מאזינה עליו</td><td><code>kubectl get svc web -o yaml</code> מול <code>containerPort</code>; curl ל-IP של ה-pod מתוך netshoot</td><td>להשתמש ב-<code>targetPort: http</code> בשם</td></tr>
<tr><td>DNS: <code>could not resolve host</code>, עיכובים של 5 שניות</td><td>CoreDNS נפל/עמוס; <code>ndots:5</code> גורם ל-<code>api.stripe.com</code> לנסות קודם 4 סיומות של ה-cluster; race ב-conntrack</td><td><code>kubectl -n kube-system logs -l k8s-app=kube-dns</code>; <code>dig</code> מתוך netshoot; <code>cat /etc/resolv.conf</code></td><td>להגדיל CoreDNS, NodeLocal DNSCache, <code>dnsConfig</code> עם ndots:2 או FQDN עם נקודה בסוף</td></tr>
<tr><td>Ingress מחזיר <code>503</code></td><td>אין endpoints מוכנים מאחורי ה-Service</td><td>endpointslices, לוגים של ה-controller</td><td>לתקן readiness / selector</td></tr>
<tr><td>Ingress מחזיר <code>502</code></td><td>ה-upstream סירב/ניתק: פורט שגוי, HTTP מול HTTPS ב-backend, האפליקציה סוגרת keep-alive מוקדם, pod נהרג לפני שהוצא מה-endpoints</td><td>לוגים של ה-controller: <code>connect() failed (111: Connection refused)</code>, <code>upstream prematurely closed connection</code></td><td>לתקן targetPort / <code>backend-protocol</code>; keep-alive של האפליקציה ארוך מה-idle timeout של ה-LB; sleep ב-<code>preStop</code></td></tr>
<tr><td>Ingress מחזיר <code>504</code></td><td>ה-upstream איטי יותר מ-<code>proxy-read-timeout</code> (60 שניות ברירת מחדל)</td><td><code>upstream timed out (110: Operation timed out)</code></td><td>לתקן את האיטיות, או להעלות timeout ל-Ingress ספציפי – לא גלובלית</td></tr>
</table>
<p>מלכודת ה-ndots בתמונה אחת – ה-<code>/etc/resolv.conf</code> של pod:</p>
<pre>search shop.svc.cluster.local svc.cluster.local cluster.local eu-west-1.compute.internal
nameserver 172.20.0.10
options ndots:5
# "api.stripe.com" has 2 dots (&lt; 5) → tried as api.stripe.com.shop.svc.cluster.local, ... first
# 4 NXDOMAIN round-trips (x2 for A + AAAA) before the real lookup</pre>
<pre>spec:
  dnsConfig:
    options:
    - name: ndots
      value: "2"</pre>
<blockquote>💡 מהשטח: 503 מול 502 זה ביט ה-triage הכי מהיר שיש לך. 503 מ-ingress-nginx = "אין לי למי לשלוח". 502 = "שלחתי וה-pod ענה לא טוב או ניתק". 504 = "שלחתי ונמאס לי לחכות".</blockquote>`
      }
    },
    {
      h: { en: "Symptom table — storage, node & cluster layer", he: "טבלת סימפטומים – שכבת storage, node ו-cluster" },
      body: {
        en: `<table>
<tr><th>Symptom</th><th>Likely causes</th><th>First commands</th><th>Fix</th></tr>
<tr><td>PVC <code>Pending</code></td><td>No default StorageClass; CSI driver missing / no IAM; <code>WaitForFirstConsumer</code> (normal until a pod uses it)</td><td><code>kubectl describe pvc</code>, <code>kubectl get sc</code>, CSI controller logs</td><td>Set StorageClass, install EBS/PD/Disk CSI add-on with its identity</td></tr>
<tr><td><code>Multi-Attach error for volume</code></td><td>RWO disk still attached to the old node: Deployment rolling update with a RWO PVC, or node died without detaching</td><td><code>kubectl get volumeattachments</code>, <code>describe pod</code></td><td><code>strategy: Recreate</code> or StatefulSet; for a dead node add taint <code>node.kubernetes.io/out-of-service=nodeshutdown:NoExecute</code></td></tr>
<tr><td>Node <code>NotReady</code></td><td>kubelet/containerd down, node out of memory, network to API lost</td><td><code>describe node</code> (Conditions), <code>kubectl debug node/…</code> → <code>journalctl -u kubelet</code></td><td>Restart kubelet, or cordon + replace the node</td></tr>
<tr><td><code>DiskPressure</code> / <code>MemoryPressure</code>, pods <code>Evicted</code></td><td>Hard eviction thresholds hit: <code>nodefs.available&lt;10%</code>, <code>imagefs.available&lt;15%</code>, <code>memory.available&lt;100Mi</code></td><td><code>describe node</code>, <code>df -h</code> / <code>du</code> on the node, <code>crictl images</code></td><td>Find the hog (logs written to the container layer, emptyDir, images); set <code>ephemeral-storage</code> requests/limits</td></tr>
<tr><td>Pod stuck <code>Terminating</code></td><td>Finalizer not removed; node unreachable; process ignores SIGTERM</td><td><code>-o jsonpath='{.metadata.finalizers}'</code>, node status</td><td>Fix the controller owning the finalizer; force delete only when you know the container is dead</td></tr>
<tr><td>Namespace stuck <code>Terminating</code></td><td>Remaining CRs whose operator is gone; unavailable APIService (<code>metrics.k8s.io False</code>)</td><td><code>kubectl get ns x -o yaml</code> (conditions), <code>kubectl get apiservice | grep False</code></td><td>Restore the operator/APIService or remove CR finalizers</td></tr>
<tr><td>HPA <code>&lt;unknown&gt;/70%</code></td><td>Missing CPU <em>requests</em> on any container; metrics-server down</td><td><code>describe hpa</code>: <code>missing request for cpu in container</code></td><td>Set requests on every container; fix metrics-server</td></tr>
<tr><td>Deploys fail: <code>failed calling webhook … context deadline exceeded</code></td><td>Webhook pods down + <code>failurePolicy: Fail</code>; firewall between control plane and nodes</td><td><code>kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations</code></td><td>Restore webhook; exclude kube-system with <code>namespaceSelector</code>; open the port</td></tr>
<tr><td><code>x509: certificate …</code></td><td>Expired kubeadm certs (1 year), private CA not trusted, wrong SAN, stale kubeconfig, webhook <code>caBundle</code> mismatch</td><td><code>kubeadm certs check-expiration</code>, <code>openssl s_client -connect host:443</code></td><td>Renew certs, mount CA bundle, regenerate kubeconfig, cert-manager cainjector</td></tr>
</table>
<pre>Warning  FailedAttachVolume  attachdetach-controller  Multi-Attach error for volume
"pvc-3f1c9a2e" Volume is already exclusively attached to one node and can't be attached to another

Error from server (InternalError): Internal error occurred: failed calling webhook
"validate.kyverno.svc-fail": failed to call webhook: Post
"https://kyverno-svc.kyverno.svc:443/validate/fail?timeout=10s": context deadline exceeded</pre>`,
        he: `<table>
<tr><th>סימפטום</th><th>סיבות סבירות</th><th>פקודות ראשונות</th><th>תיקון</th></tr>
<tr><td>PVC במצב <code>Pending</code></td><td>אין StorageClass ברירת מחדל; CSI driver חסר / בלי IAM; <code>WaitForFirstConsumer</code> (תקין עד ש-pod משתמש בו)</td><td><code>kubectl describe pvc</code>, <code>kubectl get sc</code>, לוגים של ה-CSI controller</td><td>להגדיר StorageClass, להתקין את ה-add-on של EBS/PD/Disk CSI עם ה-identity שלו</td></tr>
<tr><td><code>Multi-Attach error for volume</code></td><td>דיסק RWO עדיין מחובר ל-node הישן: rolling update של Deployment עם PVC מסוג RWO, או node שמת בלי לעשות detach</td><td><code>kubectl get volumeattachments</code>, <code>describe pod</code></td><td><code>strategy: Recreate</code> או StatefulSet; ל-node מת להוסיף taint <code>node.kubernetes.io/out-of-service=nodeshutdown:NoExecute</code></td></tr>
<tr><td>Node במצב <code>NotReady</code></td><td>kubelet/containerd נפלו, ל-node נגמר הזיכרון, אבד הקשר ל-API</td><td><code>describe node</code> (Conditions), <code>kubectl debug node/…</code> → <code>journalctl -u kubelet</code></td><td>restart ל-kubelet, או cordon + החלפת ה-node</td></tr>
<tr><td><code>DiskPressure</code> / <code>MemoryPressure</code>, pods ב-<code>Evicted</code></td><td>הגענו ל-hard eviction thresholds: <code>nodefs.available&lt;10%</code>, <code>imagefs.available&lt;15%</code>, <code>memory.available&lt;100Mi</code></td><td><code>describe node</code>, <code>df -h</code> / <code>du</code> על ה-node, <code>crictl images</code></td><td>למצוא את הזולל (לוגים שנכתבים לשכבת הקונטיינר, emptyDir, images); להגדיר requests/limits ל-<code>ephemeral-storage</code></td></tr>
<tr><td>Pod תקוע ב-<code>Terminating</code></td><td>Finalizer שלא הוסר; node לא זמין; תהליך שמתעלם מ-SIGTERM</td><td><code>-o jsonpath='{.metadata.finalizers}'</code>, סטטוס ה-node</td><td>לתקן את ה-controller שאחראי על ה-finalizer; force delete רק כשבטוח שהקונטיינר מת</td></tr>
<tr><td>Namespace תקוע ב-<code>Terminating</code></td><td>נשארו CRs שה-operator שלהם כבר לא קיים; APIService לא זמין (<code>metrics.k8s.io False</code>)</td><td><code>kubectl get ns x -o yaml</code> (conditions), <code>kubectl get apiservice | grep False</code></td><td>להחזיר את ה-operator/APIService או להסיר finalizers מה-CRs</td></tr>
<tr><td>HPA מראה <code>&lt;unknown&gt;/70%</code></td><td>חסרים CPU <em>requests</em> באחד הקונטיינרים; metrics-server למטה</td><td><code>describe hpa</code>: <code>missing request for cpu in container</code></td><td>להגדיר requests לכל קונטיינר; לתקן את metrics-server</td></tr>
<tr><td>Deploys נכשלים: <code>failed calling webhook … context deadline exceeded</code></td><td>ה-pods של ה-webhook למטה + <code>failurePolicy: Fail</code>; firewall בין ה-control plane ל-nodes</td><td><code>kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations</code></td><td>להחזיר את ה-webhook; להחריג את kube-system עם <code>namespaceSelector</code>; לפתוח את הפורט</td></tr>
<tr><td><code>x509: certificate …</code></td><td>certs של kubeadm שפגו (שנה), CA פרטי שלא מוכר, SAN שגוי, kubeconfig ישן, <code>caBundle</code> של webhook לא תואם</td><td><code>kubeadm certs check-expiration</code>, <code>openssl s_client -connect host:443</code></td><td>לחדש certs, לעשות mount ל-CA bundle, לייצר kubeconfig מחדש, cainjector של cert-manager</td></tr>
</table>
<pre>Warning  FailedAttachVolume  attachdetach-controller  Multi-Attach error for volume
"pvc-3f1c9a2e" Volume is already exclusively attached to one node and can't be attached to another

Error from server (InternalError): Internal error occurred: failed calling webhook
"validate.kyverno.svc-fail": failed to call webhook: Post
"https://kyverno-svc.kyverno.svc:443/validate/fail?timeout=10s": context deadline exceeded</pre>`
      }
    },
    {
      h: { en: "The debugging toolbox: kubectl debug, netshoot & friends", he: "ארגז הכלים: kubectl debug, netshoot וחברים" },
      body: {
        en: `<p>Production images are distroless — no shell, no curl. Don't rebuild the image; <strong>bring the tools to the pod</strong>:</p>
<pre># 1) Ephemeral container INSIDE the running pod (shares network + process namespace with "app")
kubectl debug -it pod/checkout-7d9f8b6c4-2xkqp -n shop --image=nicolaka/netshoot --target=app
  → curl -sv localhost:8080/healthz ; ss -lntp ; dig db.shop.svc.cluster.local ; ls /proc/1/root/app

# 2) Copy of a crashing pod with a different command (original keeps crashing untouched)
kubectl debug checkout-7d9f8b6c4-2xkqp -n shop -it --copy-to=checkout-debug --container=app -- sh

# 3) Node shell: privileged pod, node filesystem mounted at /host
kubectl debug node/ip-10-0-7-12.eu-west-1.compute.internal -it --image=ubuntu --profile=sysadmin
  → chroot /host ; journalctl -u kubelet --since "15 min ago" ; crictl ps ; df -h</pre>
<ul>
<li><strong>netshoot</strong> (<code>nicolaka/netshoot</code>) — curl, dig, tcpdump, iperf3, mtr, ss, openssl in one image. <code>kubectl run tmp --rm -it --image=nicolaka/netshoot -- bash</code> gives you a pod "inside" the cluster network.</li>
<li><strong>port-forward</strong> — <code>kubectl port-forward svc/web 8080:80</code> bypasses Ingress: if this works and the URL doesn't, the problem is above the Service.</li>
<li><strong>auth can-i</strong> — <code>kubectl auth can-i list secrets -n shop --as=system:serviceaccount:shop:checkout</code> settles every "Forbidden" argument.</li>
<li><strong>stern</strong> — tail logs of all matching pods with colors: <code>stern -n shop 'checkout-.*' --since 10m</code>. <strong>k9s</strong> — a TUI for jumping between pods, logs, events and describe in seconds.</li>
</ul>
<blockquote>💡 Real world: ephemeral containers can't be removed from a pod and keep running until the pod dies — on a sensitive workload, prefer <code>--copy-to</code>. Many clusters restrict <code>pods/ephemeralcontainers</code> via RBAC, so ask for that permission <em>before</em> the incident.</blockquote>`,
        he: `<p>Images בפרודקשן הם distroless – אין shell, אין curl. לא בונים image מחדש; <strong>מביאים את הכלים ל-pod</strong>:</p>
<pre># 1) Ephemeral container INSIDE the running pod (shares network + process namespace with "app")
kubectl debug -it pod/checkout-7d9f8b6c4-2xkqp -n shop --image=nicolaka/netshoot --target=app
  → curl -sv localhost:8080/healthz ; ss -lntp ; dig db.shop.svc.cluster.local ; ls /proc/1/root/app

# 2) Copy of a crashing pod with a different command (original keeps crashing untouched)
kubectl debug checkout-7d9f8b6c4-2xkqp -n shop -it --copy-to=checkout-debug --container=app -- sh

# 3) Node shell: privileged pod, node filesystem mounted at /host
kubectl debug node/ip-10-0-7-12.eu-west-1.compute.internal -it --image=ubuntu --profile=sysadmin
  → chroot /host ; journalctl -u kubelet --since "15 min ago" ; crictl ps ; df -h</pre>
<ul>
<li><strong>netshoot</strong> (<code>nicolaka/netshoot</code>) – curl, dig, tcpdump, iperf3, mtr, ss, openssl ב-image אחד. <code>kubectl run tmp --rm -it --image=nicolaka/netshoot -- bash</code> נותן לך pod "בתוך" הרשת של ה-cluster.</li>
<li><strong>port-forward</strong> – <code>kubectl port-forward svc/web 8080:80</code> עוקף את ה-Ingress: אם זה עובד וה-URL לא, הבעיה מעל ה-Service.</li>
<li><strong>auth can-i</strong> – <code>kubectl auth can-i list secrets -n shop --as=system:serviceaccount:shop:checkout</code> סוגר כל ויכוח על "Forbidden".</li>
<li><strong>stern</strong> – tail ללוגים של כל ה-pods שמתאימים, בצבעים: <code>stern -n shop 'checkout-.*' --since 10m</code>. <strong>k9s</strong> – TUI שמאפשר לקפוץ בין pods, לוגים, events ו-describe בשניות.</li>
</ul>
<blockquote>💡 מהשטח: אי אפשר להסיר ephemeral container מ-pod, והוא נשאר עד שה-pod מת – על workload רגיש עדיף <code>--copy-to</code>. בהרבה clusters ההרשאה ל-<code>pods/ephemeralcontainers</code> מוגבלת ב-RBAC, אז תבקשו אותה <em>לפני</em> האינסידנט.</blockquote>`
      }
    },
    {
      h: { en: "Stuck deletions: finalizers, force delete and its risks", he: "מחיקות תקועות: finalizers, force delete והסיכונים" },
      body: {
        en: `<p>A <strong>finalizer</strong> is a string in <code>metadata.finalizers</code> that says "don't remove this object until controller X has cleaned up". Deleting just sets <code>deletionTimestamp</code>; the object disappears only when the list is empty. If the controller is gone or broken, the object waits forever.</p>
<pre>$ kubectl get pvc data-pg-0 -o jsonpath='{.metadata.finalizers}'
["kubernetes.io/pvc-protection"]          # held because a pod still uses it — by design

# last resort, AFTER you understand what the finalizer protects:
$ kubectl patch pvc data-pg-0 --type=merge -p '{"metadata":{"finalizers":null}}'</pre>
<p><strong>Pod stuck Terminating</strong> usually means its node is unreachable — the kubelet can't confirm the container stopped. <code>kubectl delete pod x --grace-period=0 --force</code> only removes the API object; the container may <em>still be running</em> on that node. For a StatefulSet that's dangerous: the controller immediately creates <code>pg-0</code> elsewhere, and now two <code>pg-0</code> can write to the same data. Confirm the node is really dead (cloud console) first, or use the <code>out-of-service</code> taint.</p>
<p><strong>Namespace stuck Terminating</strong>: read its conditions — they name the blocker:</p>
<pre>$ kubectl get ns legacy -o jsonpath='{.status.conditions[*].message}'
Discovery failed for some groups, 1 failing: unable to retrieve the complete list of server APIs:
metrics.k8s.io/v1beta1: the server is currently unable to handle the request
Some content in the namespace has finalizers remaining: kafka.strimzi.io/finalizer in 3 resource instances

$ kubectl api-resources --verbs=list --namespaced -o name | xargs -n1 kubectl get -n legacy --ignore-not-found --show-kind</pre>
<blockquote>⚠️ Production tip: never "fix" a namespace by stripping the namespace finalizer via the <code>/finalize</code> API as step one. The CRs still exist in etcd as orphans, and their external resources (cloud LBs, DNS records, buckets) leak silently.</blockquote>`,
        he: `<p><strong>Finalizer</strong> הוא string ב-<code>metadata.finalizers</code> שאומר "אל תמחק את האובייקט עד ש-controller X סיים לנקות". מחיקה רק מסמנת <code>deletionTimestamp</code>; האובייקט נעלם רק כשהרשימה ריקה. אם ה-controller לא קיים או שבור – האובייקט מחכה לנצח.</p>
<pre>$ kubectl get pvc data-pg-0 -o jsonpath='{.metadata.finalizers}'
["kubernetes.io/pvc-protection"]          # held because a pod still uses it — by design

# last resort, AFTER you understand what the finalizer protects:
$ kubectl patch pvc data-pg-0 --type=merge -p '{"metadata":{"finalizers":null}}'</pre>
<p><strong>Pod תקוע ב-Terminating</strong> בדרך כלל אומר שה-node שלו לא זמין – ה-kubelet לא יכול לאשר שהקונטיינר נעצר. <code>kubectl delete pod x --grace-period=0 --force</code> מוחק רק את האובייקט ב-API; הקונטיינר אולי <em>עדיין רץ</em> על ה-node. ב-StatefulSet זה מסוכן: ה-controller מיד יוצר <code>pg-0</code> במקום אחר, ועכשיו שני <code>pg-0</code> יכולים לכתוב לאותו מידע. קודם מוודאים שה-node באמת מת (בקונסולה של הענן), או משתמשים ב-taint של <code>out-of-service</code>.</p>
<p><strong>Namespace תקוע ב-Terminating</strong>: קוראים את ה-conditions שלו – הם אומרים מי חוסם:</p>
<pre>$ kubectl get ns legacy -o jsonpath='{.status.conditions[*].message}'
Discovery failed for some groups, 1 failing: unable to retrieve the complete list of server APIs:
metrics.k8s.io/v1beta1: the server is currently unable to handle the request
Some content in the namespace has finalizers remaining: kafka.strimzi.io/finalizer in 3 resource instances

$ kubectl api-resources --verbs=list --namespaced -o name | xargs -n1 kubectl get -n legacy --ignore-not-found --show-kind</pre>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם לא "מתקנים" namespace בצעד ראשון ע״י הסרת ה-finalizer שלו דרך ה-API של <code>/finalize</code>. ה-CRs נשארים ב-etcd כיתומים, והמשאבים החיצוניים שלהם (LBs בענן, רשומות DNS, buckets) דולפים בשקט.</blockquote>`
      }
    }
  ],
  diagram: `  SYMPTOM ──► which layer is broken? (stop at the first red one)

  [1] POD       get pods ─► STATUS? ─► describe / logs --previous / -o yaml
       │          Pending · ImagePullBackOff · CrashLoop · OOMKilled(137) · 0/1 READY
       ▼
  [2] SERVICE   get endpointslices -l kubernetes.io/service-name=web
       │          empty? → selector / readiness     wrong port? → targetPort
       ▼
  [3] INGRESS   controller logs:  503 no endpoints | 502 refused/reset | 504 timeout
       │          cert? → cert-manager Certificate / x509
       ▼
  [4] NODE      describe node: Ready? DiskPressure? MemoryPressure? → kubectl debug node/
       ▼
  [5] CLUSTER   CoreDNS · CNI · webhooks (failurePolicy) · apiservices · quotas · certs

  Tools:  kubectl debug (ephemeral | --copy-to | node/)  ·  netshoot  ·  port-forward
          auth can-i  ·  events --sort-by  ·  stern  ·  k9s`,
  handsOn: [
    { cmd: "kubectl get events -A --sort-by=.lastTimestamp --field-selector type=Warning | tail -30",
      what: { en: "The cluster-wide 'what just went wrong' view: newest Warning events last.", he: "תמונת 'מה השתבש עכשיו' של כל ה-cluster: ה-Warning events האחרונים בסוף." } },
    { cmd: "kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded -o wide",
      what: { en: "Every pod that is not healthy-running, with its node — spot patterns (all on one node? one namespace?).", he: "כל pod שלא רץ תקין, יחד עם ה-node שלו – מזהים דפוסים (כולם על node אחד? namespace אחד?)." } },
    { cmd: "kubectl logs deploy/checkout -n shop --previous --tail=100",
      what: { en: "Logs of the container instance that crashed, not the fresh one that just restarted.", he: "הלוגים של מופע הקונטיינר שקרס, לא של זה שעלה הרגע מחדש." } },
    { cmd: "kubectl get endpointslices -n shop -l kubernetes.io/service-name=checkout -o wide",
      what: { en: "Does the Service have ready endpoints, and on which port? Empty = selector or readiness problem.", he: "יש ל-Service endpoints מוכנים, ועל איזה פורט? ריק = בעיה ב-selector או ב-readiness." } },
    { cmd: "kubectl debug -it pod/checkout-7d9f8b6c4-2xkqp -n shop --image=nicolaka/netshoot --target=app",
      what: { en: "Attach an ephemeral container with curl/dig/tcpdump to a distroless pod, sharing its network and processes.", he: "מחבר ephemeral container עם curl/dig/tcpdump ל-pod distroless, עם אותה רשת ותהליכים." } },
    { cmd: "kubectl debug node/ip-10-0-7-12.eu-west-1.compute.internal -it --image=ubuntu --profile=sysadmin -- chroot /host bash",
      what: { en: "Root shell on the node without SSH: check <code>journalctl -u kubelet</code>, <code>df -h</code>, <code>crictl ps</code>. Delete the debug pod afterwards.", he: "Shell של root על ה-node בלי SSH: בודקים <code>journalctl -u kubelet</code>, <code>df -h</code>, <code>crictl ps</code>. אחר כך מוחקים את ה-debug pod." } },
    { cmd: "kubectl run dns-test --rm -it --restart=Never --image=nicolaka/netshoot -- dig +search checkout.shop.svc.cluster.local",
      what: { en: "Test cluster DNS from inside the cluster; compare with <code>dig api.stripe.com.</code> (trailing dot skips the search list).", he: "בדיקת DNS מתוך ה-cluster; משווים ל-<code>dig api.stripe.com.</code> (נקודה בסוף מדלגת על ה-search list)." } },
    { cmd: "kubectl auth can-i --list -n shop --as=system:serviceaccount:shop:checkout",
      what: { en: "Everything a ServiceAccount may do in a namespace — ends 'Forbidden' debates.", he: "כל מה ש-ServiceAccount רשאי לעשות ב-namespace – סוגר ויכוחים על 'Forbidden'." } },
    { cmd: "kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations -o custom-columns=NAME:.metadata.name,POLICY:.webhooks[*].failurePolicy",
      what: { en: "When every apply times out: which webhooks are in the path and which ones fail closed.", he: "כשכל apply נתקע על timeout: אילו webhooks בדרך ואילו מהם fail closed." } },
    { cmd: "stern -n shop 'checkout-.*' --since 10m --exclude 'healthz'",
      what: { en: "Tail logs from every checkout pod at once (including new ones as they appear), filtering out probe noise.", he: "Tail ללוגים מכל ה-pods של checkout בבת אחת (כולל חדשים שעולים), בלי רעש של probes." } }
  ],
  mnemonic: {
    en: "<strong>P-S-I-N-C</strong>: <em>Pods Speak, Ingress Never Cares</em> — Pod, Service, Ingress, Node, Cluster. And at each stop: <strong>D-E-L-Y</strong> — Describe, Events, Logs --previous, YAML.",
    he: "<strong>P-S-I-N-C</strong> – Pod, Service, Ingress, Node, Cluster, לפי הסדר. ובכל תחנה: <strong>D-E-L-Y</strong> – Describe, Events, Logs --previous, YAML. \"דיליי\" – כי מי שמדלג על זה מתעכב."
  },
  pitfalls: [
    { en: "Restarting/deleting pods first. It rarely fixes the cause and wipes the previous container's logs and exit code — the evidence you needed.",
      he: "להתחיל ב-restart/מחיקה של pods. זה כמעט אף פעם לא פותר את הסיבה, ומוחק את הלוגים וה-exit code של הקונטיינר הקודם – בדיוק הראיות שהיית צריך." },
    { en: "Reading only the first clause of a FailedScheduling event. '0/6 nodes are available' lists several independent reasons; fixing CPU won't help the nodes excluded by taints or affinity.",
      he: "לקרוא רק את הפסוקית הראשונה ב-event של FailedScheduling. '0/6 nodes are available' מפרט כמה סיבות בלתי תלויות; תיקון ה-CPU לא יעזור ל-nodes שנפסלו בגלל taints או affinity." },
    { en: "Force-deleting StatefulSet pods on an unreachable node. The API object is gone but the container may still run, and the replacement can corrupt shared data (split brain).",
      he: "Force delete ל-pods של StatefulSet על node לא זמין. האובייקט ב-API נעלם אבל הקונטיינר אולי עדיין רץ, וה-pod המחליף יכול להשחית מידע משותף (split brain)." },
    { en: "Raising ingress timeouts globally to 'fix' 504s. You hide a slow dependency and let slow requests pile up connections across every app behind the controller.",
      he: "להעלות timeouts של ה-ingress גלובלית כדי 'לתקן' 504. מסתירים תלות איטית ונותנים לבקשות איטיות לצבור connections על כל האפליקציות שמאחורי ה-controller." }
  ],
  interview: [
    { q: { en: "A user reports the site returns 503. Walk me through your first five minutes.", he: "משתמש מדווח שהאתר מחזיר 503. תעבור איתי על חמש הדקות הראשונות שלך." },
      a: { en: "503 from the ingress controller usually means no ready upstream. I check the controller logs to confirm which backend, then <code>kubectl get endpointslices -l kubernetes.io/service-name=X</code>. If empty, I compare the Service selector with pod labels and check pod readiness (<code>describe pod</code> → probe failures). If pods aren't running at all, I go down to the pod layer: events, <code>logs --previous</code>. I also check what changed recently (deploy history, Argo CD) because most incidents follow a change.",
           he: "503 מה-ingress controller בדרך כלל אומר שאין upstream מוכן. בודק לוגים של ה-controller כדי לאמת לאיזה backend, ואז <code>kubectl get endpointslices -l kubernetes.io/service-name=X</code>. אם ריק – משווה את ה-selector של ה-Service ל-labels של ה-pods ובודק readiness (<code>describe pod</code> → כשלונות probe). אם ה-pods בכלל לא רצים, יורד לשכבת ה-pod: events, <code>logs --previous</code>. במקביל בודק מה השתנה לאחרונה (היסטוריית deploy, Argo CD), כי רוב האינסידנטים באים אחרי שינוי." } },
    { q: { en: "How do you debug a distroless container that has no shell?", he: "איך מתחקרים קונטיינר distroless שאין בו shell?" },
      a: { en: "<code>kubectl debug -it pod/x --image=nicolaka/netshoot --target=app</code> adds an ephemeral container sharing the pod's network and process namespace, so I can curl localhost, inspect <code>/proc/1/root</code>, and run tcpdump. If the pod crashes too fast, <code>--copy-to</code> with an overridden command creates a debuggable copy. For node-level issues, <code>kubectl debug node/X</code> with <code>chroot /host</code>.",
           he: "<code>kubectl debug -it pod/x --image=nicolaka/netshoot --target=app</code> מוסיף ephemeral container שחולק את ה-network וה-process namespace של ה-pod, כך שאפשר לעשות curl ל-localhost, להסתכל ב-<code>/proc/1/root</code> ולהריץ tcpdump. אם ה-pod קורס מהר מדי – <code>--copy-to</code> עם command אחר יוצר עותק שאפשר לתחקר. לבעיות ברמת ה-node – <code>kubectl debug node/X</code> עם <code>chroot /host</code>." } },
    { q: { en: "A namespace has been Terminating for two hours. What do you do?", he: "Namespace נמצא ב-Terminating כבר שעתיים. מה עושים?" },
      a: { en: "Read <code>status.conditions</code> — it names the blocker. Common ones: an unavailable APIService (fix or remove it, e.g. a dead metrics-server) or custom resources whose finalizers can't be processed because the operator was uninstalled first. I list remaining resources with <code>api-resources --namespaced</code> + <code>get</code>, restore the operator or clean up external resources manually, then remove the CR finalizers. Stripping the namespace finalizer directly is the last resort because it leaves orphans.",
           he: "קוראים את <code>status.conditions</code> – הוא אומר מי חוסם. הנפוצים: APIService שלא זמין (לתקן או להסיר, למשל metrics-server מת) או custom resources שה-finalizers שלהם לא מטופלים כי הסירו את ה-operator קודם. מוצאים מה נשאר עם <code>api-resources --namespaced</code> + <code>get</code>, מחזירים את ה-operator או מנקים ידנית משאבים חיצוניים, ואז מסירים את ה-finalizers מה-CRs. הסרת ה-finalizer של ה-namespace עצמו היא מוצא אחרון, כי זה משאיר יתומים." } }
  ],
  quiz: [
    { q: { en: "A pod shows <code>Reason: OOMKilled</code>, <code>Exit Code: 137</code>. What happened?", he: "Pod מראה <code>Reason: OOMKilled</code>, <code>Exit Code: 137</code>. מה קרה?" },
      options: [
        { en: "The app called exit(137) after an unhandled exception", he: "האפליקציה קראה ל-exit(137) אחרי exception לא מטופל" },
        { en: "The kernel killed the container (SIGKILL, 128+9) because it exceeded its memory limit", he: "ה-kernel הרג את הקונטיינר (SIGKILL, 128+9) כי הוא עבר את ה-memory limit" },
        { en: "The liveness probe failed three times", he: "ה-liveness probe נכשל שלוש פעמים" },
        { en: "The node was drained by the cluster autoscaler", he: "ה-node עבר drain ע״י ה-cluster autoscaler" }
      ], answer: 1,
      explain: { en: "137 = 128 + signal 9 (SIGKILL). With <code>Reason: OOMKilled</code>, the cgroup memory limit was exceeded. A liveness failure gives SIGTERM first (143 if the app exits cleanly).", he: "137 = 128 + signal 9 (SIGKILL). יחד עם <code>Reason: OOMKilled</code> – עברו את ה-memory limit של ה-cgroup. כשלון liveness שולח קודם SIGTERM (143 אם האפליקציה יוצאת יפה)." } },
    { q: { en: "Ingress returns <code>503</code> but every pod is <code>Running</code>. Most likely?", he: "ה-Ingress מחזיר <code>503</code> אבל כל ה-pods ב-<code>Running</code>. מה הכי סביר?" },
      options: [
        { en: "The ingress controller is out of memory", he: "ל-ingress controller נגמר הזיכרון" },
        { en: "The upstream is too slow and timed out", he: "ה-upstream איטי מדי ועבר timeout" },
        { en: "The Service has no ready endpoints: selector mismatch or readiness failing", he: "ל-Service אין endpoints מוכנים: selector לא תואם או readiness שנכשל" },
        { en: "The TLS certificate expired", he: "תעודת ה-TLS פגה" }
      ], answer: 2,
      explain: { en: "Running ≠ Ready ≠ selected. 503 means nothing to route to; check <code>get endpointslices</code>. Timeouts show as <code>504</code>, an expired cert fails at TLS handshake.", he: "Running לא אומר Ready ולא אומר שה-Service בחר בו. 503 = אין לאן לנתב; בודקים <code>get endpointslices</code>. Timeout נראה כ-<code>504</code>, ותעודה שפגה נכשלת כבר ב-TLS handshake." } },
    { q: { en: "A pod in a StatefulSet is stuck Terminating on a node that stopped responding. The safest action?", he: "Pod של StatefulSet תקוע ב-Terminating על node שהפסיק להגיב. מה הפעולה הכי בטוחה?" },
      options: [
        { en: "Immediately run <code>kubectl delete pod --grace-period=0 --force</code>", he: "מיד להריץ <code>kubectl delete pod --grace-period=0 --force</code>" },
        { en: "Confirm the node is really down (or shut it off), then apply the <code>out-of-service</code> taint or force delete", he: "לוודא שה-node באמת למטה (או לכבות אותו), ורק אז להוסיף taint של <code>out-of-service</code> או force delete" },
        { en: "Delete the StatefulSet and recreate it", he: "למחוק את ה-StatefulSet וליצור אותו מחדש" },
        { en: "Remove the PVC finalizer", he: "להסיר את ה-finalizer מה-PVC" }
      ], answer: 1,
      explain: { en: "Force delete removes only the API object; if the old container still runs, the new <code>pg-0</code> can write to the same volume. Fence the node first.", he: "Force delete מוחק רק את האובייקט ב-API; אם הקונטיינר הישן עדיין רץ, ה-<code>pg-0</code> החדש יכול לכתוב לאותו volume. קודם מבודדים את ה-node." } },
    { q: { en: "Calls to <code>api.stripe.com</code> from pods take ~5 extra seconds intermittently, in-cluster names are fine. A good first fix?", he: "קריאות ל-<code>api.stripe.com</code> מתוך pods לוקחות לפעמים 5 שניות יותר, שמות פנימיים תקינים. מה תיקון ראשון טוב?" },
      options: [
        { en: "Add more replicas to the application", he: "להוסיף replicas לאפליקציה" },
        { en: "Raise the HTTP client timeout to 30s", he: "להעלות את ה-timeout של ה-HTTP client ל-30 שניות" },
        { en: "Lower <code>ndots</code> via <code>dnsConfig</code> (or use a trailing-dot FQDN) and add NodeLocal DNSCache", he: "להוריד <code>ndots</code> דרך <code>dnsConfig</code> (או FQDN עם נקודה בסוף) ולהוסיף NodeLocal DNSCache" },
        { en: "Switch the Service to type LoadBalancer", he: "להחליף את ה-Service ל-type LoadBalancer" }
      ], answer: 2,
      explain: { en: "With <code>ndots:5</code> each external lookup first tries every search suffix; more queries mean more chances to hit the conntrack/UDP race that causes 5s retries. Fewer queries + a node-local cache fixes both.", he: "עם <code>ndots:5</code> כל lookup חיצוני מנסה קודם את כל ה-search suffixes; יותר שאילתות = יותר סיכוי ל-race של conntrack/UDP שגורם ל-retry של 5 שניות. פחות שאילתות + cache מקומי ב-node פותרים את שניהם." } }
  ],
  playground: "terminal",
  related: ["k8s-debugging", "net-troubleshooting", "k8s-probes", "k8s-services"]
});

// ---------------------------------------------------------------------------
// 31. Ingress, Gateway API, certificates & DNS
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-ingress-certs-dns",
  track: "kubernetes",
  order: 31,
  icon: "🚪",
  level: 3,
  minutes: 16,
  title: { en: "Ingress, Gateway API, cert-manager & external-dns", he: "Ingress, Gateway API, cert-manager ו-external-dns" },
  tldr: {
    en: "Traffic edge = router (ingress-nginx → Gateway API) + certificates (cert-manager) + DNS records (external-dns). All three are controllers; debug them by reading their status objects and logs.",
    he: "הקצה של התעבורה = נתב (ingress-nginx → Gateway API) + תעודות (cert-manager) + רשומות DNS (external-dns). שלושתם controllers; מתחקרים אותם דרך אובייקטי ה-status והלוגים שלהם."
  },
  analogy: {
    en: "Think of a hotel. external-dns puts the hotel's address on Google Maps, cert-manager keeps the official license framed in the lobby (and renews it before it expires), and the ingress controller is the reception desk that reads your booking and sends you to the right room (Service). The Gateway API splits reception into roles: the owner builds the lobby (GatewayClass/Gateway) and each department manages its own room list (HTTPRoute).",
    he: "תחשוב על מלון. external-dns שם את הכתובת של המלון ב-Google Maps, cert-manager דואג שהרישיון הרשמי תלוי בלובי (ומחדש אותו לפני שהוא פג), וה-ingress controller זה דלפק הקבלה שקורא את ההזמנה ושולח אותך לחדר הנכון (Service). ה-Gateway API מפצל את הקבלה לתפקידים: הבעלים בונה את הלובי (GatewayClass/Gateway) וכל מחלקה מנהלת את רשימת החדרים שלה (HTTPRoute)."
  },
  sections: [
    {
      h: { en: "ingress-nginx in production: annotations that matter", he: "ingress-nginx בפרודקשן: ה-annotations שחשובים" },
      body: {
        en: `<p>ingress-nginx is a Deployment running NGINX whose config is regenerated from every Ingress object. Its defaults are fine for a demo and wrong for many real apps:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: shop
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "25m"       # default 1m → 413 on uploads
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"    # default 60s → 504
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "5"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"     # HTTPS / GRPC if the pod speaks it
    nginx.ingress.kubernetes.io/limit-rps: "50"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: shop-web
            port:
              name: http</pre>
<p>Global settings (keep-alive, log format, <code>use-forwarded-headers</code>) live in the controller's ConfigMap, per-app settings in annotations. Check what NGINX actually generated: <code>kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | grep -A20 'shop.example.com'</code>.</p>
<blockquote>⚠️ Production tip: in March 2025 "IngressNightmare" (CVE-2025-1974) showed that the ingress-nginx admission webhook could be abused for unauthenticated RCE and cluster-wide secret theft. Snippet annotations (<code>configuration-snippet</code>) are disabled by default for the same reason — don't turn them back on.</blockquote>`,
        he: `<p>ingress-nginx הוא Deployment שמריץ NGINX, וה-config שלו נבנה מחדש מכל אובייקט Ingress. ברירות המחדל שלו טובות לדמו ולא נכונות להרבה אפליקציות אמיתיות:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: shop
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "25m"       # default 1m → 413 on uploads
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"    # default 60s → 504
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "5"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"     # HTTPS / GRPC if the pod speaks it
    nginx.ingress.kubernetes.io/limit-rps: "50"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: shop-web
            port:
              name: http</pre>
<p>הגדרות גלובליות (keep-alive, פורמט לוגים, <code>use-forwarded-headers</code>) נמצאות ב-ConfigMap של ה-controller, והגדרות לאפליקציה – ב-annotations. כדי לראות מה NGINX באמת ייצר: <code>kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | grep -A20 'shop.example.com'</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: במרץ 2025 "IngressNightmare" (CVE-2025-1974) הראה שאפשר לנצל את ה-admission webhook של ingress-nginx ל-RCE בלי אימות ולגניבת secrets מכל ה-cluster. Snippet annotations (<code>configuration-snippet</code>) כבויים כברירת מחדל מאותה סיבה – לא מדליקים אותם בחזרה.</blockquote>`
      }
    },
    {
      h: { en: "Reading edge errors: 413, 502, 503, 504", he: "לקרוא שגיאות בקצה: 413, 502, 503, 504" },
      body: {
        en: `<p>The controller's access and error logs tell you which side failed. Find them with <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller | grep shop-web</code>:</p>
<pre>[error] connect() failed (111: Connection refused) while connecting to upstream,
        upstream: "http://10.0.3.41:8080/api/cart"            → 502: wrong targetPort / app not listening
[error] upstream prematurely closed connection while reading response header
        upstream: "http://10.0.3.17:3000/"                    → 502: app closed keep-alive / pod killed mid-request
[error] upstream timed out (110: Operation timed out) while reading response header → 504
[warn]  client intended to send too large body: 31457280 bytes → 413: raise proxy-body-size
"GET / HTTP/1.1" 503 ... [shop-shop-web-http] [] - - - -  → 503: empty upstream list (no ready endpoints)</pre>
<ul>
<li><strong>502 during every rollout</strong> — the pod receives SIGTERM before NGINX removes it from its upstream list. Fix: <code>lifecycle.preStop: exec: sleep 10</code> (or the native <code>sleep</code> action) plus a <code>terminationGracePeriodSeconds</code> longer than the sleep + drain.</li>
<li><strong>Random 502 under low traffic</strong> — app keep-alive timeout (Node.js default 5s) shorter than the proxy's upstream keep-alive (60s): NGINX reuses a socket the app just closed. Set the app's keep-alive higher than the proxy's.</li>
<li><strong>502 with HTTPS backends</strong> — pod speaks TLS but NGINX speaks HTTP: set <code>backend-protocol: "HTTPS"</code>.</li>
</ul>
<blockquote>💡 Real world: always check <code>kubectl get endpointslices</code> before touching NGINX. Nine out of ten "ingress is broken" tickets are a Service with zero ready endpoints or a targetPort that points to a port nobody listens on.</blockquote>`,
        he: `<p>ה-access וה-error logs של ה-controller אומרים איזה צד נכשל. מוצאים אותם עם <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller | grep shop-web</code>:</p>
<pre>[error] connect() failed (111: Connection refused) while connecting to upstream,
        upstream: "http://10.0.3.41:8080/api/cart"            → 502: wrong targetPort / app not listening
[error] upstream prematurely closed connection while reading response header
        upstream: "http://10.0.3.17:3000/"                    → 502: app closed keep-alive / pod killed mid-request
[error] upstream timed out (110: Operation timed out) while reading response header → 504
[warn]  client intended to send too large body: 31457280 bytes → 413: raise proxy-body-size
"GET / HTTP/1.1" 503 ... [shop-shop-web-http] [] - - - -  → 503: empty upstream list (no ready endpoints)</pre>
<ul>
<li><strong>502 בכל rollout</strong> – ה-pod מקבל SIGTERM לפני ש-NGINX הוציא אותו מרשימת ה-upstreams. התיקון: <code>lifecycle.preStop: exec: sleep 10</code> (או ה-action המובנה <code>sleep</code>) ועוד <code>terminationGracePeriodSeconds</code> ארוך מה-sleep + זמן ה-drain.</li>
<li><strong>502 אקראיים בתעבורה נמוכה</strong> – ה-keep-alive timeout של האפליקציה (ב-Node.js ברירת המחדל 5 שניות) קצר מה-upstream keep-alive של ה-proxy (60 שניות): NGINX משתמש ב-socket שהאפליקציה סגרה הרגע. מגדירים keep-alive באפליקציה ארוך משל ה-proxy.</li>
<li><strong>502 עם backends ב-HTTPS</strong> – ה-pod מדבר TLS ו-NGINX מדבר HTTP: מגדירים <code>backend-protocol: "HTTPS"</code>.</li>
</ul>
<blockquote>💡 מהשטח: תמיד בודקים <code>kubectl get endpointslices</code> לפני שנוגעים ב-NGINX. תשעה מכל עשרה טיקטים של "ה-ingress שבור" הם Service עם אפס endpoints מוכנים או targetPort שמצביע על פורט שאף אחד לא מאזין עליו.</blockquote>`
      }
    },
    {
      h: { en: "Gateway API: the successor (and ingress-nginx retirement)", he: "Gateway API: היורש (והפרישה של ingress-nginx)" },
      body: {
        en: `<p>The Ingress API is frozen: anything beyond host/path routing became vendor annotations. <strong>Gateway API</strong> (GA since v1.0, 2023) is the replacement, with typed fields and role separation:</p>
<ul>
<li><strong>GatewayClass</strong> — which implementation (Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric, Traefik, cloud LBs like GKE / AWS LB Controller). Owned by the platform team.</li>
<li><strong>Gateway</strong> — a real listener: ports, hostnames, TLS certs, which namespaces may attach. Owned by ops.</li>
<li><strong>HTTPRoute</strong> (also GRPCRoute, TLSRoute) — routing rules owned by the app team in its own namespace.</li>
</ul>
<pre>apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: { name: public, namespace: infra }
spec:
  gatewayClassName: eg
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "*.example.com"
    tls: { mode: Terminate, certificateRefs: [{ name: wildcard-tls }] }
    allowedRoutes:
      namespaces: { from: Selector, selector: { matchLabels: { gateway-access: "true" } } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: shop, namespace: shop }
spec:
  parentRefs: [{ name: public, namespace: infra, sectionName: https }]
  hostnames: ["shop.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /api } }]
    timeouts: { request: 30s }
    backendRefs:                       # built-in canary: no annotations
    - { name: api-v1, port: 8080, weight: 90 }
    - { name: api-v2, port: 8080, weight: 10 }</pre>
<p>Debug through status: <code>kubectl describe httproute shop</code> → <code>status.parents[].conditions</code>. <code>Accepted=False / NotAllowedByListeners</code> = namespace not allowed by the Gateway; <code>ResolvedRefs=False / RefNotPermitted</code> = cross-namespace backend without a <code>ReferenceGrant</code>.</p>
<blockquote>⚠️ Production tip: the Kubernetes project retired community <strong>ingress-nginx</strong> in March 2026 — no more releases or security fixes. Existing installs keep running, but plan the move: inventory annotations, convert with <code>ingress2gateway</code>, run both side by side and shift DNS gradually. (F5's "NGINX Ingress Controller" is a different, still-maintained product — don't mix up the docs.)</blockquote>`,
        he: `<p>ה-API של Ingress קפוא: כל מה שמעבר לניתוב לפי host/path הפך ל-annotations של ספקים. <strong>Gateway API</strong> (GA מאז v1.0, 2023) הוא המחליף, עם שדות מוגדרים ו-separation בין תפקידים:</p>
<ul>
<li><strong>GatewayClass</strong> – איזה מימוש (Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric, Traefik, LBs של הענן כמו GKE / AWS LB Controller). שייך לצוות הפלטפורמה.</li>
<li><strong>Gateway</strong> – listener אמיתי: פורטים, hostnames, תעודות TLS, אילו namespaces מורשים להתחבר. שייך ל-ops.</li>
<li><strong>HTTPRoute</strong> (וגם GRPCRoute, TLSRoute) – כללי ניתוב שצוות האפליקציה מנהל ב-namespace שלו.</li>
</ul>
<pre>apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: { name: public, namespace: infra }
spec:
  gatewayClassName: eg
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "*.example.com"
    tls: { mode: Terminate, certificateRefs: [{ name: wildcard-tls }] }
    allowedRoutes:
      namespaces: { from: Selector, selector: { matchLabels: { gateway-access: "true" } } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: shop, namespace: shop }
spec:
  parentRefs: [{ name: public, namespace: infra, sectionName: https }]
  hostnames: ["shop.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /api } }]
    timeouts: { request: 30s }
    backendRefs:                       # built-in canary: no annotations
    - { name: api-v1, port: 8080, weight: 90 }
    - { name: api-v2, port: 8080, weight: 10 }</pre>
<p>מתחקרים דרך ה-status: <code>kubectl describe httproute shop</code> → <code>status.parents[].conditions</code>. <code>Accepted=False / NotAllowedByListeners</code> = ה-Gateway לא מתיר את ה-namespace; <code>ResolvedRefs=False / RefNotPermitted</code> = backend ב-namespace אחר בלי <code>ReferenceGrant</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: פרויקט Kubernetes הוציא את <strong>ingress-nginx</strong> הקהילתי לגמלאות במרץ 2026 – אין יותר releases ולא תיקוני אבטחה. התקנות קיימות ממשיכות לרוץ, אבל צריך לתכנן מעבר: למפות annotations, להמיר עם <code>ingress2gateway</code>, להריץ את שניהם במקביל ולהעביר DNS בהדרגה. (ה-"NGINX Ingress Controller" של F5 הוא מוצר אחר שעדיין מתוחזק – לא לבלבל בין התיעודים.)</blockquote>`
      }
    },
    {
      h: { en: "cert-manager: Issuers, ACME HTTP-01 vs DNS-01", he: "cert-manager: Issuers, ACME עם HTTP-01 מול DNS-01" },
      body: {
        en: `<p>cert-manager turns "I want a cert for these names" (a <strong>Certificate</strong>) into a TLS Secret and renews it automatically (by default when 1/3 of the lifetime remains). An <strong>Issuer</strong> is namespaced; a <strong>ClusterIssuer</strong> serves the whole cluster. For Let's Encrypt (ACME) you prove domain control in one of two ways:</p>
<ul>
<li><strong>HTTP-01</strong> — cert-manager serves a token at <code>http://host/.well-known/acme-challenge/…</code> via a temporary Ingress/HTTPRoute. Simple, but needs public port 80 reachable and can't issue wildcards.</li>
<li><strong>DNS-01</strong> — cert-manager writes a <code>_acme-challenge</code> TXT record via the DNS provider API. Works for wildcards and private clusters; needs DNS API credentials (use workload identity, not static keys).</li>
</ul>
<pre>apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef: { name: letsencrypt-prod-account }
    solvers:
    - selector: { dnsZones: ["example.com"] }
      dns01:
        route53: { region: eu-west-1, hostedZoneID: Z0123456789ABC }   # IRSA / Pod Identity
    - http01:
        ingress: { ingressClassName: nginx }
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: wildcard, namespace: infra }
spec:
  secretName: wildcard-tls
  dnsNames: ["example.com", "*.example.com"]
  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }
  privateKey: { algorithm: ECDSA, size: 256, rotationPolicy: Always }</pre>
<blockquote>💡 Real world: test against the staging ACME server first. Let's Encrypt enforces rate limits (e.g. 5 certs per identical set of names per 7 days), and a crash-looping config can lock you out for a week. Certificate lifetimes are also shrinking industry-wide (LE is moving toward 45-day certs), so manual renewal is no longer an option.</blockquote>`,
        he: `<p>cert-manager הופך "אני רוצה תעודה לשמות האלה" (<strong>Certificate</strong>) ל-Secret של TLS ומחדש אותה אוטומטית (כברירת מחדל כשנשאר שליש מתוקף התעודה). <strong>Issuer</strong> הוא ברמת namespace; <strong>ClusterIssuer</strong> משרת את כל ה-cluster. מול Let's Encrypt (ACME) מוכיחים בעלות על הדומיין באחת משתי דרכים:</p>
<ul>
<li><strong>HTTP-01</strong> – cert-manager מגיש token ב-<code>http://host/.well-known/acme-challenge/…</code> דרך Ingress/HTTPRoute זמני. פשוט, אבל צריך פורט 80 פתוח לאינטרנט ואי אפשר להוציא wildcard.</li>
<li><strong>DNS-01</strong> – cert-manager כותב רשומת TXT בשם <code>_acme-challenge</code> דרך ה-API של ספק ה-DNS. עובד ל-wildcards ול-clusters פרטיים; צריך credentials ל-DNS API (עם workload identity, לא מפתחות סטטיים).</li>
</ul>
<pre>apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef: { name: letsencrypt-prod-account }
    solvers:
    - selector: { dnsZones: ["example.com"] }
      dns01:
        route53: { region: eu-west-1, hostedZoneID: Z0123456789ABC }   # IRSA / Pod Identity
    - http01:
        ingress: { ingressClassName: nginx }
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: wildcard, namespace: infra }
spec:
  secretName: wildcard-tls
  dnsNames: ["example.com", "*.example.com"]
  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }
  privateKey: { algorithm: ECDSA, size: 256, rotationPolicy: Always }</pre>
<blockquote>💡 מהשטח: בודקים קודם מול שרת ה-staging של ACME. ל-Let's Encrypt יש rate limits (למשל 5 תעודות לאותו סט שמות בדיוק ב-7 ימים), ו-config שנכנס ללולאה יכול לנעול אותך לשבוע. גם תוקף התעודות מתקצר בכל התעשייה (LE עוברים לכיוון תעודות של 45 יום), אז חידוש ידני כבר לא אופציה.</blockquote>`
      }
    },
    {
      h: { en: "Debugging cert-manager: Certificate → CertificateRequest → Order → Challenge", he: "תחקור cert-manager: Certificate → CertificateRequest → Order → Challenge" },
      body: {
        en: `<p>When a cert is not <code>READY</code>, follow the chain of objects cert-manager creates — the error is always on the <em>deepest</em> one:</p>
<pre>$ kubectl get certificate,certificaterequest,order,challenge -n shop
NAME                                   READY   SECRET     AGE
certificate.cert-manager.io/shop-tls   False   shop-tls   14m
NAME                                        APPROVED   READY   ISSUER             AGE
certificaterequest.cert-manager.io/shop-tls-1   True   False   letsencrypt-prod   14m
NAME                                         STATE     AGE
order.acme.cert-manager.io/shop-tls-1-2873466751   pending   14m
NAME                                                        STATE     DOMAIN             AGE
challenge.acme.cert-manager.io/shop-tls-1-2873466751-3415867004   pending   shop.example.com   14m

$ kubectl describe challenge shop-tls-1-2873466751-3415867004 -n shop
  Reason:  Waiting for HTTP-01 challenge propagation: wrong status code '404', expected '200'</pre>
<table>
<tr><th>Challenge message</th><th>Meaning / fix</th></tr>
<tr><td><code>wrong status code '404'</code></td><td>Solver Ingress isn't picked up: wrong <code>ingressClassName</code>, or a catch-all rule / auth / forced HTTPS redirect intercepts <code>/.well-known</code></td></tr>
<tr><td><code>dial tcp …:80: i/o timeout</code></td><td>Port 80 closed at the LB / firewall, or DNS still points elsewhere</td></tr>
<tr><td><code>AccessDenied … route53:ChangeResourceRecordSets</code></td><td>DNS-01 identity lacks permission on that hosted zone</td></tr>
<tr><td><code>DNS record for "example.com" not yet propagated</code></td><td>Private/split-horizon DNS: set <code>--dns01-recursive-nameservers-only</code> with public resolvers</td></tr>
<tr><td><code>429 … rateLimited</code></td><td>Let's Encrypt limit hit — switch to staging, wait out the window</td></tr>
</table>
<p>The <code>cmctl</code> CLI shortcuts this: <code>cmctl status certificate shop-tls -n shop</code> prints the whole chain, and <code>cmctl renew shop-tls -n shop</code> forces a renewal to test the pipeline before the real expiry.</p>`,
        he: `<p>כשתעודה לא <code>READY</code>, עוקבים אחרי שרשרת האובייקטים ש-cert-manager יוצר – השגיאה תמיד נמצאת באובייקט <em>העמוק ביותר</em>:</p>
<pre>$ kubectl get certificate,certificaterequest,order,challenge -n shop
NAME                                   READY   SECRET     AGE
certificate.cert-manager.io/shop-tls   False   shop-tls   14m
NAME                                        APPROVED   READY   ISSUER             AGE
certificaterequest.cert-manager.io/shop-tls-1   True   False   letsencrypt-prod   14m
NAME                                         STATE     AGE
order.acme.cert-manager.io/shop-tls-1-2873466751   pending   14m
NAME                                                        STATE     DOMAIN             AGE
challenge.acme.cert-manager.io/shop-tls-1-2873466751-3415867004   pending   shop.example.com   14m

$ kubectl describe challenge shop-tls-1-2873466751-3415867004 -n shop
  Reason:  Waiting for HTTP-01 challenge propagation: wrong status code '404', expected '200'</pre>
<table>
<tr><th>הודעה ב-Challenge</th><th>משמעות / תיקון</th></tr>
<tr><td><code>wrong status code '404'</code></td><td>ה-Ingress של ה-solver לא נקלט: <code>ingressClassName</code> שגוי, או rule כללי / auth / redirect ל-HTTPS שתופס את <code>/.well-known</code></td></tr>
<tr><td><code>dial tcp …:80: i/o timeout</code></td><td>פורט 80 סגור ב-LB / firewall, או שה-DNS עדיין מצביע למקום אחר</td></tr>
<tr><td><code>AccessDenied … route53:ChangeResourceRecordSets</code></td><td>ל-identity של DNS-01 חסרה הרשאה על ה-hosted zone</td></tr>
<tr><td><code>DNS record for "example.com" not yet propagated</code></td><td>DNS פרטי/split-horizon: להגדיר <code>--dns01-recursive-nameservers-only</code> עם resolvers ציבוריים</td></tr>
<tr><td><code>429 … rateLimited</code></td><td>נתקלנו ב-limit של Let's Encrypt – לעבור ל-staging ולחכות שהחלון יעבור</td></tr>
</table>
<p>ה-CLI <code>cmctl</code> מקצר את זה: <code>cmctl status certificate shop-tls -n shop</code> מדפיס את כל השרשרת, ו-<code>cmctl renew shop-tls -n shop</code> מכריח חידוש כדי לבדוק את ה-pipeline לפני שהתוקף באמת נגמר.</p>`
      }
    },
    {
      h: { en: "external-dns: DNS records from Kubernetes objects", he: "external-dns: רשומות DNS מתוך אובייקטים של Kubernetes" },
      body: {
        en: `<p>external-dns watches Services, Ingresses and Gateway routes and creates matching records (Route 53, Azure DNS, Cloud DNS, Cloudflare). It marks ownership with a TXT registry record so it never touches records it didn't create:</p>
<pre>args:
- --source=service
- --source=ingress
- --source=gateway-httproute
- --provider=aws
- --domain-filter=example.com
- --policy=upsert-only          # never delete; "sync" also deletes stale records
- --registry=txt
- --txt-owner-id=prod-eu1       # UNIQUE per cluster
- --interval=1m

$ kubectl logs -n external-dns deploy/external-dns | tail -3
level=info msg="Desired change: CREATE shop.example.com A" profile=default zoneName=example.com.
level=info msg="Desired change: CREATE a-shop.example.com TXT" zoneName=example.com.
level=info msg="2 record(s) were successfully updated" zoneName=example.com.</pre>
<p>Debugging: no record? Check the hostname is inside <code>--domain-filter</code>, the source type is enabled, the Ingress has an address in <code>status.loadBalancer</code> (external-dns copies it — no address, no record), and the logs for <code>AccessDenied</code>. Override per object with <code>external-dns.alpha.kubernetes.io/hostname</code> and <code>…/ttl</code>.</p>
<blockquote>⚠️ Production tip: two clusters with the same <code>--txt-owner-id</code> and <code>--policy=sync</code> will happily delete each other's records — the classic blue/green cluster migration outage. Give each cluster its own owner id and hand over records deliberately.</blockquote>`,
        he: `<p>external-dns מסתכל על Services, Ingresses ו-routes של Gateway ויוצר רשומות תואמות (Route 53, Azure DNS, Cloud DNS, Cloudflare). הוא מסמן בעלות עם רשומת TXT (registry), כדי לא לגעת אף פעם ברשומות שהוא לא יצר:</p>
<pre>args:
- --source=service
- --source=ingress
- --source=gateway-httproute
- --provider=aws
- --domain-filter=example.com
- --policy=upsert-only          # never delete; "sync" also deletes stale records
- --registry=txt
- --txt-owner-id=prod-eu1       # UNIQUE per cluster
- --interval=1m

$ kubectl logs -n external-dns deploy/external-dns | tail -3
level=info msg="Desired change: CREATE shop.example.com A" profile=default zoneName=example.com.
level=info msg="Desired change: CREATE a-shop.example.com TXT" zoneName=example.com.
level=info msg="2 record(s) were successfully updated" zoneName=example.com.</pre>
<p>תחקור: אין רשומה? בודקים שה-hostname בתוך ה-<code>--domain-filter</code>, שסוג ה-source מופעל, שלאובייקט ה-Ingress יש כתובת ב-<code>status.loadBalancer</code> (external-dns מעתיק אותה – אין כתובת, אין רשומה), ובלוגים מחפשים <code>AccessDenied</code>. אפשר לדרוס פר-אובייקט עם <code>external-dns.alpha.kubernetes.io/hostname</code> ו-<code>…/ttl</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: שני clusters עם אותו <code>--txt-owner-id</code> ו-<code>--policy=sync</code> ימחקו בשמחה אחד לשני את הרשומות – ה-outage הקלאסי של מיגרציית cluster בשיטת blue/green. לכל cluster owner id משלו, ומעבירים רשומות באופן מכוון.</blockquote>`
      }
    }
  ],
  diagram: `                 DNS (Route53)  ◄── external-dns (watches Ingress/HTTPRoute, writes A + TXT owner)
                      │
   client ── HTTPS ──►│ shop.example.com
                      ▼
            ┌──────────────────────┐   TLS secret "shop-tls" ◄── cert-manager
            │ cloud LB (L4/NLB)     │                              Certificate
            └─────────┬────────────┘                                 └► CertificateRequest
                      ▼                                                   └► Order └► Challenge
   Ingress world:  ingress-nginx (retired 2026)     Gateway API world:      (HTTP-01 / DNS-01)
                   Ingress + annotations             GatewayClass (platform)
                                                     Gateway      (ops: ports, TLS)
                                                     HTTPRoute    (app team: paths, weights)
                      ▼
               Service "shop-web" ─► EndpointSlice (ready pods only) ─► pods :http
   errors:  413 body too big | 502 refused/reset | 503 no endpoints | 504 timeout`,
  handsOn: [
    { cmd: "kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --since=15m | grep -E '\" (502|503|504) |upstream'",
      what: { en: "Find 5xx responses and the upstream error messages behind them in the controller logs.", he: "מוצאים תשובות 5xx ואת הודעות השגיאה של ה-upstream שמאחוריהן בלוגים של ה-controller." } },
    { cmd: "kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | grep -A25 'server_name shop.example.com'",
      what: { en: "See the NGINX config actually generated from your Ingress and annotations.", he: "רואים את ה-config של NGINX שבאמת נוצר מה-Ingress וה-annotations שלך." } },
    { cmd: "kubectl get gatewayclass,gateway -A && kubectl describe httproute shop -n shop",
      what: { en: "Gateway API health: is the class accepted, does the Gateway have an address, is the route Accepted with ResolvedRefs?", he: "בריאות Gateway API: ה-class התקבל? ל-Gateway יש כתובת? ה-route במצב Accepted עם ResolvedRefs?" } },
    { cmd: "kubectl get certificate,certificaterequest,order,challenge -A",
      what: { en: "The whole cert-manager pipeline at once — the stuck object is the deepest one not Ready/valid.", he: "כל ה-pipeline של cert-manager בבת אחת – האובייקט התקוע הוא העמוק ביותר שלא Ready/valid." } },
    { cmd: "cmctl status certificate shop-tls -n shop",
      what: { en: "Human-readable status of a Certificate including its request, order and challenges.", he: "סטטוס קריא של Certificate כולל ה-request, ה-order וה-challenges שלו." } },
    { cmd: "kubectl get secret shop-tls -n shop -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -subject -issuer -enddate -ext subjectAltName",
      what: { en: "Inspect the issued cert: issuer (staging vs prod!), expiry date and SANs.", he: "בודקים את התעודה שהונפקה: ה-issuer (staging או prod!), תאריך תפוגה ו-SANs." } },
    { cmd: "openssl s_client -connect shop.example.com:443 -servername shop.example.com </dev/null 2>/dev/null | openssl x509 -noout -issuer -enddate",
      what: { en: "Which cert is the edge actually serving? (Often the controller's fake default cert when the secret is missing.)", he: "איזו תעודה הקצה באמת מגיש? (הרבה פעמים ה-fake default cert של ה-controller כשה-secret חסר.)" } },
    { cmd: "kubectl logs -n external-dns deploy/external-dns --since=30m | grep -iE 'desired change|error|denied'",
      what: { en: "What external-dns tried to change and whether the DNS provider refused it.", he: "מה external-dns ניסה לשנות והאם ספק ה-DNS סירב." } },
    { cmd: "dig +short shop.example.com @8.8.8.8 && dig +short TXT a-shop.example.com @8.8.8.8",
      what: { en: "Check the public record and its external-dns ownership TXT record.", he: "בודקים את הרשומה הציבורית ואת רשומת ה-TXT של הבעלות של external-dns." } }
  ],
  mnemonic: {
    en: "<strong>Name → Lock → Door</strong>: external-dns gives the <em>name</em>, cert-manager the <em>lock</em> (TLS), the ingress/gateway is the <em>door</em>. Status codes: <strong>3 = nobody home, 2 = rude answer, 4 = waited too long</strong>.",
    he: "<strong>שם → מנעול → דלת</strong>: external-dns נותן את ה<em>שם</em>, cert-manager את ה<em>מנעול</em> (TLS), ה-ingress/gateway הוא ה<em>דלת</em>. קודי סטטוס: <strong>503 = אין אף אחד בבית, 502 = ענו בגסות, 504 = חיכיתי יותר מדי</strong>."
  },
  pitfalls: [
    { en: "Using the Let's Encrypt production server while iterating on config. A loop of failed issuance hits rate limits and blocks real certs for days — use staging until the chain works.",
      he: "לעבוד מול השרת של Let's Encrypt production בזמן שמנסים config. לולאה של הנפקות כושלות נתקלת ב-rate limits וחוסמת תעודות אמיתיות לימים – עובדים מול staging עד שהשרשרת עובדת." },
    { en: "A global HTTP→HTTPS redirect or auth middleware that swallows <code>/.well-known/acme-challenge</code>, so HTTP-01 sees 404/302 and renewals silently fail 30 days later.",
      he: "Redirect גלובלי מ-HTTP ל-HTTPS או middleware של auth שבולעים את <code>/.well-known/acme-challenge</code>, כך ש-HTTP-01 מקבל 404/302 והחידושים נכשלים בשקט 30 יום אחר כך." },
    { en: "Raising <code>proxy-read-timeout</code> in the global ConfigMap to fix one slow endpoint. Every app now holds connections longer and the controller runs out of workers under load.",
      he: "להעלות <code>proxy-read-timeout</code> ב-ConfigMap הגלובלי כדי לתקן endpoint איטי אחד. עכשיו כל האפליקציות מחזיקות connections יותר זמן, וה-controller נגמר לו ה-workers בעומס." },
    { en: "Staying on retired ingress-nginx 'because it works'. Without security fixes, the next CVE in an internet-facing component that can read every Secret has no patch.",
      he: "להישאר על ingress-nginx שפרש 'כי זה עובד'. בלי תיקוני אבטחה, ל-CVE הבא ברכיב שחשוף לאינטרנט ויכול לקרוא כל Secret לא יהיה patch." }
  ],
  interview: [
    { q: { en: "Why is Gateway API replacing Ingress? What does it give you that annotations didn't?", he: "למה Gateway API מחליף את Ingress? מה הוא נותן שה-annotations לא נתנו?" },
      a: { en: "Ingress only standardized host/path → service; everything else (timeouts, header matching, canary weights, TLS passthrough, gRPC) was vendor annotations, non-portable and unvalidated. Gateway API has typed, portable fields for those, supports TCP/UDP/gRPC routes, and separates roles: the platform team owns GatewayClass/Gateway (ports, certs, which namespaces may attach) while app teams own HTTPRoutes in their namespaces. Status conditions on each route make debugging explicit.",
           he: "Ingress תקנן רק host/path → service; כל השאר (timeouts, התאמה לפי headers, משקלי canary, TLS passthrough, gRPC) היה annotations של ספקים – לא נייד ובלי ולידציה. ב-Gateway API יש לזה שדות מוגדרים וניידים, תמיכה ב-routes של TCP/UDP/gRPC, והפרדת תפקידים: צוות הפלטפורמה מחזיק GatewayClass/Gateway (פורטים, תעודות, אילו namespaces מורשים) וצוותי האפליקציה מחזיקים HTTPRoutes ב-namespaces שלהם. ה-status conditions על כל route הופכים את התחקור למפורש." } },
    { q: { en: "When would you pick DNS-01 over HTTP-01?", he: "מתי תבחר ב-DNS-01 על פני HTTP-01?" },
      a: { en: "For wildcard certificates (HTTP-01 can't issue them), for private/internal clusters not reachable on port 80 from the internet, and when many ingress replicas or CDNs make HTTP-01 routing unreliable. The cost is giving cert-manager write access to DNS, which I scope to specific zones and grant through workload identity rather than static keys.",
           he: "לתעודות wildcard (HTTP-01 לא יכול להנפיק אותן), ל-clusters פרטיים/פנימיים שלא נגישים מהאינטרנט בפורט 80, וכשהרבה replicas של ingress או CDN הופכים את הניתוב של HTTP-01 ללא אמין. המחיר: נותנים ל-cert-manager הרשאת כתיבה ל-DNS, ואני מגביל אותה ל-zones ספציפיים ונותן אותה דרך workload identity ולא מפתחות סטטיים." } },
    { q: { en: "Users get 502 for a few seconds on every deploy. Why, and how do you fix it?", he: "משתמשים מקבלים 502 לכמה שניות בכל deploy. למה, ואיך מתקנים?" },
      a: { en: "Pod termination and endpoint removal happen in parallel: the kubelet sends SIGTERM while the proxy still has the pod in its upstream list for a moment, so requests hit a closing process. Fix with a <code>preStop</code> sleep (5-15s) so the pod keeps serving while it's removed, graceful shutdown in the app (stop accepting, finish in-flight), and <code>terminationGracePeriodSeconds</code> larger than the sum. Also make sure app keep-alive is longer than the proxy's.",
           he: "סיום של pod והוצאה שלו מה-endpoints קורים במקביל: ה-kubelet שולח SIGTERM בזמן שה-proxy עוד מחזיק את ה-pod ברשימת ה-upstreams לרגע, אז בקשות מגיעות לתהליך שנסגר. מתקנים עם sleep ב-<code>preStop</code> (5-15 שניות) כדי שה-pod ימשיך לשרת בזמן שמוציאים אותו, graceful shutdown באפליקציה (מפסיקים לקבל, מסיימים בקשות פתוחות), ו-<code>terminationGracePeriodSeconds</code> גדול מהסכום. וגם לוודא שה-keep-alive של האפליקציה ארוך משל ה-proxy." } }
  ],
  quiz: [
    { q: { en: "Uploading a 30 MB file through ingress-nginx fails with <code>413 Request Entity Too Large</code>. Fix?", he: "העלאת קובץ של 30MB דרך ingress-nginx נכשלת עם <code>413 Request Entity Too Large</code>. מה התיקון?" },
      options: [
        { en: "Increase <code>proxy-read-timeout</code>", he: "להגדיל את <code>proxy-read-timeout</code>" },
        { en: "Set <code>nginx.ingress.kubernetes.io/proxy-body-size</code> on that Ingress (default is 1m)", he: "להגדיר <code>nginx.ingress.kubernetes.io/proxy-body-size</code> על ה-Ingress הזה (ברירת המחדל 1m)" },
        { en: "Raise the pod's memory limit", he: "להעלות את ה-memory limit של ה-pod" },
        { en: "Switch the Service to NodePort", he: "להחליף את ה-Service ל-NodePort" }
      ], answer: 1,
      explain: { en: "413 is NGINX rejecting the body before it reaches the app; the per-Ingress <code>proxy-body-size</code> annotation controls it.", he: "413 זה NGINX שדוחה את ה-body עוד לפני שהוא מגיע לאפליקציה; ה-annotation <code>proxy-body-size</code> ברמת ה-Ingress שולט בזה." } },
    { q: { en: "You need a <code>*.example.com</code> certificate from Let's Encrypt. Which solver?", he: "צריך תעודת <code>*.example.com</code> מ-Let's Encrypt. איזה solver?" },
      options: [
        { en: "HTTP-01 with the nginx ingress class", he: "HTTP-01 עם ה-ingress class של nginx" },
        { en: "DNS-01 (e.g. Route 53 via workload identity)", he: "DNS-01 (למשל Route 53 דרך workload identity)" },
        { en: "TLS-ALPN-01 via the Service", he: "TLS-ALPN-01 דרך ה-Service" },
        { en: "A self-signed Issuer", he: "Issuer מסוג self-signed" }
      ], answer: 1,
      explain: { en: "ACME only issues wildcards with DNS-01 — you must prove control of the whole zone, not one host.", he: "ACME מנפיק wildcards רק עם DNS-01 – צריך להוכיח שליטה על כל ה-zone, לא על host אחד." } },
    { q: { en: "An HTTPRoute in namespace <code>shop</code> shows <code>Accepted=False, reason NotAllowedByListeners</code>. Most likely cause?", he: "HTTPRoute ב-namespace <code>shop</code> מראה <code>Accepted=False, reason NotAllowedByListeners</code>. מה הסיבה הכי סבירה?" },
      options: [
        { en: "The backend Service has no endpoints", he: "ל-Service של ה-backend אין endpoints" },
        { en: "The Gateway listener's <code>allowedRoutes</code> doesn't permit routes from that namespace", he: "ה-<code>allowedRoutes</code> של ה-listener ב-Gateway לא מתיר routes מה-namespace הזה" },
        { en: "The TLS certificate is expired", he: "תעודת ה-TLS פגה" },
        { en: "external-dns didn't create the record", he: "external-dns לא יצר את הרשומה" }
      ], answer: 1,
      explain: { en: "Attachment is controlled by the Gateway owner. Label the namespace to match the listener selector (e.g. <code>gateway-access: \"true\"</code>). Missing endpoints would show in <code>ResolvedRefs</code>/runtime errors, not in Accepted.", he: "החיבור נשלט ע״י הבעלים של ה-Gateway. מוסיפים ל-namespace label שמתאים ל-selector של ה-listener (למשל <code>gateway-access: \"true\"</code>). חוסר ב-endpoints היה מופיע ב-<code>ResolvedRefs</code> או בשגיאות runtime, לא ב-Accepted." } },
    { q: { en: "A Certificate has been not-Ready for 20 minutes. The Challenge says <code>wrong status code '404', expected '200'</code>. Where do you look?", he: "Certificate לא Ready כבר 20 דקות. ה-Challenge אומר <code>wrong status code '404', expected '200'</code>. איפה מסתכלים?" },
      options: [
        { en: "The ACME account private key", he: "ה-private key של חשבון ה-ACME" },
        { en: "The DNS provider IAM permissions", he: "הרשאות ה-IAM של ספק ה-DNS" },
        { en: "The solver Ingress: ingress class, redirects or auth rules intercepting <code>/.well-known/acme-challenge</code>", he: "ה-Ingress של ה-solver: ingress class, redirects או חוקי auth שתופסים את <code>/.well-known/acme-challenge</code>" },
        { en: "The cert-manager webhook certificate", he: "התעודה של ה-webhook של cert-manager" }
      ], answer: 2,
      explain: { en: "404 means the HTTP-01 request reached a web server that doesn't route the token path to cert-manager's solver pod. IAM would matter for DNS-01.", he: "404 אומר שבקשת ה-HTTP-01 הגיעה לשרת web שלא מנתב את ה-path של ה-token ל-solver pod של cert-manager. IAM רלוונטי ל-DNS-01." } }
  ],
  related: ["net-http-tls", "net-load-balancing", "k8s-services", "k8s-troubleshooting-playbook"]
});

// ---------------------------------------------------------------------------
// 32. Operators & CRDs
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-operators-crds",
  track: "kubernetes",
  order: 32,
  icon: "🤖",
  level: 3,
  minutes: 15,
  title: { en: "Operators & CRDs: Extending Kubernetes", he: "Operators ו-CRDs: להרחיב את Kubernetes" },
  tldr: {
    en: "A CRD adds a new noun to the API; an operator is a controller that runs a reconcile loop to turn that noun into real infrastructure — and is debugged through status conditions, events and its own logs.",
    he: "CRD מוסיף שם-עצם חדש ל-API; operator הוא controller שמריץ reconcile loop והופך את השם-עצם הזה לתשתית אמיתית – ומתחקרים אותו דרך status conditions, events והלוגים שלו."
  },
  analogy: {
    en: "A CRD is a new form at the city hall: \"Request for a PostgreSQL cluster, 3 replicas, nightly backups\". Filing the form does nothing by itself. The operator is the clerk who owns that form type: they keep checking every filed form against reality, order servers, fix what drifted, and write the progress on the form's back side (status). If the clerk quits, the forms pile up — and nobody can even throw them away (finalizers).",
    he: "CRD זה טופס חדש בעירייה: \"בקשה ל-cluster של PostgreSQL, 3 replicas, גיבוי לילי\". הגשת הטופס לבד לא עושה כלום. ה-operator הוא הפקיד שאחראי על סוג הטופס הזה: הוא כל הזמן משווה כל טופס שהוגש למציאות, מזמין שרתים, מתקן מה שזז, וכותב את ההתקדמות בגב הטופס (status). אם הפקיד מתפטר – הטפסים נערמים, ואף אחד אפילו לא יכול לזרוק אותם (finalizers)."
  },
  sections: [
    {
      h: { en: "CRDs: adding your own API types", he: "CRDs: להוסיף סוגי API משלך" },
      body: {
        en: `<p>A <strong>CustomResourceDefinition</strong> registers a new resource type with the API server. From then on <code>kubectl get</code>, RBAC, watch, Argo CD and audit logs all work for it — it's stored in etcd like a Deployment. Modern CRDs must have a structural OpenAPI schema and can carry CEL validation rules evaluated by the API server itself:</p>
<pre>apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databasebackups.ops.example.com
spec:
  group: ops.example.com
  scope: Namespaced
  names: { kind: DatabaseBackup, plural: databasebackups, shortNames: [dbb] }
  versions:
  - name: v1alpha1
    served: true
    storage: true
    subresources: { status: {} }          # spec and status updated separately
    additionalPrinterColumns:
    - { name: Phase, type: string, jsonPath: .status.phase }
    - { name: Last, type: date, jsonPath: .status.lastBackupTime }
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: [database, schedule]
            x-kubernetes-validations:
            - rule: "self.retentionDays &gt;= 1 &amp;&amp; self.retentionDays &lt;= 90"
              message: "retentionDays must be 1-90"
            properties:
              database: { type: string }
              schedule: { type: string }
              retentionDays: { type: integer, default: 7 }</pre>
<p>Versioning matters: when you add <code>v1beta1</code>, only one version is the <code>storage</code> version, and differing schemas need a <strong>conversion webhook</strong>. A broken conversion webhook makes <em>every</em> read of that type fail — including the garbage collector and namespace deletion.</p>
<blockquote>💡 Real world: <code>kubectl get crd | wc -l</code> on a typical production cluster returns 80-200. Every add-on you install (cert-manager, Karpenter, Prometheus Operator, Argo CD, Kyverno) ships its own CRDs.</blockquote>`,
        he: `<p><strong>CustomResourceDefinition</strong> רושם סוג משאב חדש ב-API server. מאותו רגע <code>kubectl get</code>, RBAC, watch, Argo CD ו-audit logs עובדים איתו – הוא נשמר ב-etcd כמו Deployment. CRDs מודרניים חייבים schema מבני של OpenAPI, ויכולים לכלול חוקי ולידציה ב-CEL שה-API server עצמו מריץ:</p>
<pre>apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databasebackups.ops.example.com
spec:
  group: ops.example.com
  scope: Namespaced
  names: { kind: DatabaseBackup, plural: databasebackups, shortNames: [dbb] }
  versions:
  - name: v1alpha1
    served: true
    storage: true
    subresources: { status: {} }          # spec and status updated separately
    additionalPrinterColumns:
    - { name: Phase, type: string, jsonPath: .status.phase }
    - { name: Last, type: date, jsonPath: .status.lastBackupTime }
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: [database, schedule]
            x-kubernetes-validations:
            - rule: "self.retentionDays &gt;= 1 &amp;&amp; self.retentionDays &lt;= 90"
              message: "retentionDays must be 1-90"
            properties:
              database: { type: string }
              schedule: { type: string }
              retentionDays: { type: integer, default: 7 }</pre>
<p>גרסאות זה עניין: כשמוסיפים <code>v1beta1</code>, רק גרסה אחת היא ה-<code>storage</code> version, ו-schemas שונים דורשים <strong>conversion webhook</strong>. Conversion webhook שבור גורם לכל קריאה של הסוג הזה להיכשל – כולל ה-garbage collector ומחיקת namespaces.</p>
<blockquote>💡 מהשטח: <code>kubectl get crd | wc -l</code> ב-cluster פרודקשן טיפוסי מחזיר 80-200. כל add-on שמתקינים (cert-manager, Karpenter, Prometheus Operator, Argo CD, Kyverno) מביא CRDs משלו.</blockquote>`
      }
    },
    {
      h: { en: "Controllers and the reconcile loop", he: "Controllers וה-reconcile loop" },
      body: {
        en: `<p>A controller watches objects (through shared <em>informers</em> with a local cache), pushes changed keys into a <em>work queue</em>, and calls <code>Reconcile(namespace/name)</code>. Reconcile gets only the key — not "what changed" — so it must be <strong>level-triggered and idempotent</strong>: read desired state, observe actual state, take steps to converge, write status, done. Running it twice must be harmless.</p>
<pre>func (r *DatabaseBackupReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var bk opsv1.DatabaseBackup
    if err := r.Get(ctx, req.NamespacedName, &amp;bk); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)       // deleted: nothing to do
    }
    cron := desiredCronJob(&amp;bk)                                   // pure function of spec
    ctrl.SetControllerReference(&amp;bk, cron, r.Scheme)              // ownerRef → GC on delete
    if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, cron, mutateFn(cron)); err != nil {
        return ctrl.Result{}, err                                    // error → retried with backoff
    }
    bk.Status.ObservedGeneration = bk.Generation
    meta.SetStatusCondition(&amp;bk.Status.Conditions, readyCondition())
    return ctrl.Result{RequeueAfter: 10 * time.Minute}, r.Status().Update(ctx, &amp;bk)
}</pre>
<p>Conventions every good operator follows (and you should check when evaluating one):</p>
<ul>
<li><strong>Conditions</strong> in <code>status.conditions</code> (<code>Ready</code>, <code>Progressing</code>, <code>Degraded</code>) with <code>reason</code> and <code>message</code>.</li>
<li><strong>observedGeneration</strong> — if it lags <code>metadata.generation</code>, the controller hasn't processed your latest edit.</li>
<li><strong>ownerReferences</strong> on children so deleting the CR garbage-collects them.</li>
<li><strong>Leader election</strong> (a <code>Lease</code> object) so only one replica acts at a time.</li>
</ul>`,
        he: `<p>Controller מסתכל על אובייקטים (דרך <em>informers</em> משותפים עם cache מקומי), דוחף מפתחות שהשתנו ל-<em>work queue</em>, וקורא ל-<code>Reconcile(namespace/name)</code>. ה-Reconcile מקבל רק את המפתח – לא "מה השתנה" – ולכן הוא חייב להיות <strong>level-triggered ו-idempotent</strong>: לקרוא את ה-desired state, לבדוק את המצב בפועל, לעשות צעדים כדי להתכנס, לכתוב status, וזהו. הרצה כפולה צריכה להיות בלי נזק.</p>
<pre>func (r *DatabaseBackupReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var bk opsv1.DatabaseBackup
    if err := r.Get(ctx, req.NamespacedName, &amp;bk); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)       // deleted: nothing to do
    }
    cron := desiredCronJob(&amp;bk)                                   // pure function of spec
    ctrl.SetControllerReference(&amp;bk, cron, r.Scheme)              // ownerRef → GC on delete
    if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, cron, mutateFn(cron)); err != nil {
        return ctrl.Result{}, err                                    // error → retried with backoff
    }
    bk.Status.ObservedGeneration = bk.Generation
    meta.SetStatusCondition(&amp;bk.Status.Conditions, readyCondition())
    return ctrl.Result{RequeueAfter: 10 * time.Minute}, r.Status().Update(ctx, &amp;bk)
}</pre>
<p>מוסכמות שכל operator טוב מקיים (וכדאי לבדוק כשמעריכים אחד):</p>
<ul>
<li><strong>Conditions</strong> ב-<code>status.conditions</code> (<code>Ready</code>, <code>Progressing</code>, <code>Degraded</code>) עם <code>reason</code> ו-<code>message</code>.</li>
<li><strong>observedGeneration</strong> – אם הוא מפגר אחרי <code>metadata.generation</code>, ה-controller עוד לא עיבד את השינוי האחרון שלך.</li>
<li><strong>ownerReferences</strong> על האובייקטים הילדים, כך שמחיקת ה-CR עושה להם garbage collection.</li>
<li><strong>Leader election</strong> (אובייקט <code>Lease</code>) כדי שרק replica אחד יפעל בכל רגע.</li>
</ul>`
      }
    },
    {
      h: { en: "Finalizers: cleaning up things Kubernetes can't see", he: "Finalizers: לנקות דברים ש-Kubernetes לא רואה" },
      body: {
        en: `<p>ownerReferences clean up in-cluster children. But an operator often creates <em>external</em> things: an S3 bucket, a DNS record, an RDS instance, an EC2 node. For those it adds a <strong>finalizer</strong> to the CR:</p>
<pre>1. kubectl delete databasebackup nightly
2. API server sets metadata.deletionTimestamp — object still exists (Terminating)
3. operator's Reconcile sees deletionTimestamp → deletes the external bucket/snapshots
4. operator removes "ops.example.com/cleanup" from metadata.finalizers
5. finalizers list empty → API server actually deletes the object</pre>
<p>The famous failure: someone uninstalls the operator (or its Helm release) <strong>before</strong> deleting its CRs. Now nobody will ever remove the finalizer. The CRs hang in Terminating, the namespace containing them hangs, and an Argo CD sync that deletes the namespace never finishes.</p>
<pre>$ kubectl get kafkatopics -n events
NAME     CLUSTER   PARTITIONS   READY
orders   main      12           (Terminating for 3d)
$ kubectl get kafkatopic orders -n events -o jsonpath='{.metadata.finalizers}'
["strimzi.io/topic-operator"]</pre>
<blockquote>⚠️ Production tip: the right order to remove an operator is: delete its CRs → wait until they're gone (external resources cleaned) → uninstall the operator → delete the CRDs last. If you must remove a finalizer by hand, first clean up the external resource it was guarding, or you'll leak cost (orphaned volumes, LBs, nodes).</blockquote>`,
        he: `<p>ownerReferences מנקים ילדים בתוך ה-cluster. אבל operator הרבה פעמים יוצר דברים <em>חיצוניים</em>: bucket ב-S3, רשומת DNS, instance של RDS, node ב-EC2. בשבילם הוא מוסיף <strong>finalizer</strong> ל-CR:</p>
<pre>1. kubectl delete databasebackup nightly
2. API server sets metadata.deletionTimestamp — object still exists (Terminating)
3. operator's Reconcile sees deletionTimestamp → deletes the external bucket/snapshots
4. operator removes "ops.example.com/cleanup" from metadata.finalizers
5. finalizers list empty → API server actually deletes the object</pre>
<p>התקלה המפורסמת: מישהו מסיר את ה-operator (או את ה-Helm release שלו) <strong>לפני</strong> שמחק את ה-CRs. עכשיו אף אחד לעולם לא יסיר את ה-finalizer. ה-CRs תקועים ב-Terminating, ה-namespace שמכיל אותם תקוע, ו-sync של Argo CD שמוחק את ה-namespace לא נגמר אף פעם.</p>
<pre>$ kubectl get kafkatopics -n events
NAME     CLUSTER   PARTITIONS   READY
orders   main      12           (Terminating for 3d)
$ kubectl get kafkatopic orders -n events -o jsonpath='{.metadata.finalizers}'
["strimzi.io/topic-operator"]</pre>
<blockquote>⚠️ טיפ לפרודקשן: הסדר הנכון להסרת operator: מוחקים את ה-CRs שלו → מחכים שייעלמו (המשאבים החיצוניים נוקו) → מסירים את ה-operator → מוחקים את ה-CRDs אחרונים. אם חייבים להסיר finalizer ידנית – קודם מנקים את המשאב החיצוני שהוא שמר עליו, אחרת דולפים כסף (volumes, LBs, nodes יתומים).</blockquote>`
      }
    },
    {
      h: { en: "The operator pattern in the wild", he: "ה-operator pattern בשטח" },
      body: {
        en: `<p>An <strong>operator</strong> = CRDs + a controller that encodes a human operator's runbook (install, upgrade, failover, backup) as code. The Operator Framework's <strong>capability levels</strong> are a useful maturity scale: 1 Basic install → 2 Seamless upgrades → 3 Full lifecycle (backup/restore, failover) → 4 Deep insights (metrics, alerts) → 5 Auto-pilot (auto-scaling, auto-tuning, self-healing).</p>
<table>
<tr><th>Operator</th><th>You write</th><th>It manages</th></tr>
<tr><td>Prometheus Operator</td><td><code>ServiceMonitor</code>, <code>PodMonitor</code>, <code>PrometheusRule</code></td><td>Prometheus/Alertmanager StatefulSets, scrape config, rule reloads</td></tr>
<tr><td>CloudNativePG</td><td><code>Cluster</code> (postgresql.cnpg.io/v1), <code>ScheduledBackup</code></td><td>Primary + replicas, automated failover, WAL archiving to S3, PITR</td></tr>
<tr><td>Strimzi</td><td><code>Kafka</code>, <code>KafkaNodePool</code>, <code>KafkaTopic</code>, <code>KafkaUser</code></td><td>KRaft Kafka clusters, rolling restarts, certs, topics and ACLs</td></tr>
<tr><td>cert-manager</td><td><code>Certificate</code>, <code>ClusterIssuer</code></td><td>Issuance, renewal, TLS Secrets</td></tr>
<tr><td>Karpenter</td><td><code>NodePool</code>, <code>EC2NodeClass</code></td><td><code>NodeClaim</code>s → real EC2 instances, consolidation, drift replacement</td></tr>
</table>
<pre>apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: orders-db, namespace: orders }
spec:
  instances: 3
  storage: { size: 100Gi, storageClass: gp3 }
  backup:
    barmanObjectStore:
      destinationPath: s3://acme-pg-backups/orders
      s3Credentials: { inheritFromIAMRole: true }
    retentionPolicy: "30d"</pre>
<p>Those 14 lines replace a DBA's checklist: three pods across zones, streaming replication, a <code>-rw</code> Service that always points at the primary, and automated failover.</p>
<blockquote>💡 Real world: an operator is code running with broad RBAC in your cluster. Before adopting one, check: release cadence, CRD upgrade story (Helm does <em>not</em> upgrade CRDs in <code>crds/</code>), what happens if the operator is down for an hour (workloads should keep running), and whether its capability level matches what you'd trust it with.</blockquote>`,
        he: `<p><strong>Operator</strong> = CRDs + controller שמקודד את ה-runbook של מפעיל אנושי (התקנה, שדרוג, failover, גיבוי) כקוד. ה-<strong>capability levels</strong> של Operator Framework הם סולם בשלות שימושי: 1 Basic install → 2 Seamless upgrades → 3 Full lifecycle (גיבוי/שחזור, failover) → 4 Deep insights (מטריקות, התראות) → 5 Auto-pilot (auto-scaling, auto-tuning, self-healing).</p>
<table>
<tr><th>Operator</th><th>מה אתה כותב</th><th>מה הוא מנהל</th></tr>
<tr><td>Prometheus Operator</td><td><code>ServiceMonitor</code>, <code>PodMonitor</code>, <code>PrometheusRule</code></td><td>StatefulSets של Prometheus/Alertmanager, scrape config, טעינת rules</td></tr>
<tr><td>CloudNativePG</td><td><code>Cluster</code> (postgresql.cnpg.io/v1), <code>ScheduledBackup</code></td><td>Primary + replicas, failover אוטומטי, ארכוב WAL ל-S3, PITR</td></tr>
<tr><td>Strimzi</td><td><code>Kafka</code>, <code>KafkaNodePool</code>, <code>KafkaTopic</code>, <code>KafkaUser</code></td><td>Clusters של Kafka ב-KRaft, rolling restarts, תעודות, topics ו-ACLs</td></tr>
<tr><td>cert-manager</td><td><code>Certificate</code>, <code>ClusterIssuer</code></td><td>הנפקה, חידוש, Secrets של TLS</td></tr>
<tr><td>Karpenter</td><td><code>NodePool</code>, <code>EC2NodeClass</code></td><td><code>NodeClaim</code>s → instances אמיתיים ב-EC2, consolidation, החלפה ב-drift</td></tr>
</table>
<pre>apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: orders-db, namespace: orders }
spec:
  instances: 3
  storage: { size: 100Gi, storageClass: gp3 }
  backup:
    barmanObjectStore:
      destinationPath: s3://acme-pg-backups/orders
      s3Credentials: { inheritFromIAMRole: true }
    retentionPolicy: "30d"</pre>
<p>14 השורות האלה מחליפות צ'קליסט של DBA: שלושה pods על פני zones, streaming replication, Service מסוג <code>-rw</code> שתמיד מצביע על ה-primary, ו-failover אוטומטי.</p>
<blockquote>💡 מהשטח: operator זה קוד שרץ עם RBAC רחב בתוך ה-cluster שלך. לפני שמאמצים אחד בודקים: קצב releases, איך משדרגים CRDs (Helm <em>לא</em> משדרג CRDs שבתיקיית <code>crds/</code>), מה קורה אם ה-operator למטה לשעה (ה-workloads צריכים להמשיך לרוץ), והאם ה-capability level מתאים למה שאתה מוכן לסמוך עליו.</blockquote>`
      }
    },
    {
      h: { en: "Write one (kubebuilder) — or don't", he: "לכתוב אחד (kubebuilder) – או שלא" },
      body: {
        en: `<p>Writing an operator is justified when you have <strong>stateful, operational logic</strong> that must react continuously: failover, ordered upgrades, provisioning external resources, multi-step workflows. It is <em>not</em> justified for "templating a few YAMLs" — that's Helm/Kustomize, or a composition tool like Crossplane or kro.</p>
<pre>kubebuilder init --domain example.com --repo github.com/acme/backup-operator
kubebuilder create api --group ops --version v1alpha1 --kind DatabaseBackup
#   → api/v1alpha1/databasebackup_types.go   (Spec/Status structs → CRD schema)
#   → internal/controller/databasebackup_controller.go  (Reconcile)
make manifests      # generate CRD + RBAC from markers
make install        # apply CRDs to the current cluster
make run            # run the controller locally against the cluster
make docker-build docker-push IMG=ghcr.io/acme/backup-operator:0.1.0 &amp;&amp; make deploy IMG=...</pre>
<p>kubebuilder (and Operator SDK, built on it) generates controller-runtime boilerplate: informers, caching, leader election, metrics, webhooks. What it doesn't give you is the hard part — <strong>correct state machines</strong>, idempotency under retries, upgrades of your own CRD versions, and on-call ownership forever.</p>
<blockquote>💡 Real world: the total cost of an in-house operator is mostly not code — it's being paged at 3am for a controller only two people understand. Prefer an established community operator, then Helm + Jobs, and write your own only when the logic is your company's core competency.</blockquote>`,
        he: `<p>כתיבת operator מוצדקת כשיש <strong>לוגיקה תפעולית stateful</strong> שצריכה להגיב כל הזמן: failover, שדרוגים בסדר מסוים, הקמת משאבים חיצוניים, workflows של כמה שלבים. היא <em>לא</em> מוצדקת בשביל "template לכמה YAMLs" – בשביל זה יש Helm/Kustomize, או כלי composition כמו Crossplane או kro.</p>
<pre>kubebuilder init --domain example.com --repo github.com/acme/backup-operator
kubebuilder create api --group ops --version v1alpha1 --kind DatabaseBackup
#   → api/v1alpha1/databasebackup_types.go   (Spec/Status structs → CRD schema)
#   → internal/controller/databasebackup_controller.go  (Reconcile)
make manifests      # generate CRD + RBAC from markers
make install        # apply CRDs to the current cluster
make run            # run the controller locally against the cluster
make docker-build docker-push IMG=ghcr.io/acme/backup-operator:0.1.0 &amp;&amp; make deploy IMG=...</pre>
<p>kubebuilder (ו-Operator SDK שבנוי עליו) מייצר את ה-boilerplate של controller-runtime: informers, caching, leader election, מטריקות, webhooks. מה שהוא לא נותן זה את החלק הקשה – <strong>state machines נכונות</strong>, idempotency מול retries, שדרוג גרסאות ה-CRD שלך, ובעלות on-call לנצח.</p>
<blockquote>💡 מהשטח: רוב העלות של operator פנימי היא לא הקוד – זה להיות מוקפץ ב-3 בלילה בגלל controller שרק שני אנשים מבינים. עדיף operator קהילתי מבוסס, אחר כך Helm + Jobs, ולכתוב בעצמך רק כשהלוגיקה היא ליבת המומחיות של החברה.</blockquote>`
      }
    },
    {
      h: { en: "Debugging a misbehaving operator", he: "תחקור operator שמתנהג לא כמו שצריך" },
      body: {
        en: `<p>Symptom: you applied a CR and "nothing happens", or it's stuck <code>Ready=False</code>. Work from the CR outward:</p>
<ol>
<li><strong>CR status</strong>: <code>kubectl get cluster.postgresql.cnpg.io orders-db -o yaml</code> → <code>status.conditions</code>, and compare <code>observedGeneration</code> to <code>metadata.generation</code>. Lagging = the controller isn't processing.</li>
<li><strong>Events</strong>: <code>kubectl events --for cluster.postgresql.cnpg.io/orders-db -n orders</code>.</li>
<li><strong>Operator logs</strong>, filtered to the object: <code>kubectl logs -n cnpg-system deploy/cnpg-controller-manager | grep orders-db</code>.</li>
<li><strong>Is it the leader?</strong> <code>kubectl get lease -n cnpg-system</code> — a stale holder after a node failure delays everything.</li>
<li><strong>RBAC</strong>: look for <code>forbidden</code> in logs after an upgrade added a new resource type the ClusterRole doesn't cover.</li>
<li><strong>Metrics</strong>: <code>controller_runtime_reconcile_errors_total</code> and <code>workqueue_depth</code> — a growing queue means it can't keep up or is hot-looping.</li>
</ol>
<pre>{"level":"error","ts":"2026-11-12T09:41:07Z","msg":"Reconciler error","controller":"cluster",
 "namespace":"orders","name":"orders-db","error":"persistentvolumeclaims is forbidden:
 User \\"system:serviceaccount:cnpg-system:cnpg-manager\\" cannot patch resource
 \\"persistentvolumeclaims\\" in API group \\"\\" in the namespace \\"orders\\""}</pre>
<p>Two more classics: a <strong>hot loop</strong> (the operator and another controller — or Argo CD — keep rewriting the same field; look for thousands of reconciles per minute and fight over <code>managedFields</code>), and a <strong>CRD/operator version mismatch</strong> after upgrading only one of them (<code>no matches for kind "Cluster" in version …</code> or unknown fields silently pruned).</p>`,
        he: `<p>סימפטום: עשית apply ל-CR ו"שום דבר לא קורה", או שהוא תקוע ב-<code>Ready=False</code>. עובדים מה-CR החוצה:</p>
<ol>
<li><strong>Status של ה-CR</strong>: <code>kubectl get cluster.postgresql.cnpg.io orders-db -o yaml</code> → <code>status.conditions</code>, ומשווים <code>observedGeneration</code> ל-<code>metadata.generation</code>. פיגור = ה-controller לא מעבד.</li>
<li><strong>Events</strong>: <code>kubectl events --for cluster.postgresql.cnpg.io/orders-db -n orders</code>.</li>
<li><strong>לוגים של ה-operator</strong>, מסוננים לאובייקט: <code>kubectl logs -n cnpg-system deploy/cnpg-controller-manager | grep orders-db</code>.</li>
<li><strong>הוא ה-leader?</strong> <code>kubectl get lease -n cnpg-system</code> – holder ישן אחרי נפילת node מעכב הכל.</li>
<li><strong>RBAC</strong>: מחפשים <code>forbidden</code> בלוגים אחרי שדרוג שהוסיף סוג משאב שה-ClusterRole לא מכסה.</li>
<li><strong>מטריקות</strong>: <code>controller_runtime_reconcile_errors_total</code> ו-<code>workqueue_depth</code> – תור שגדל אומר שהוא לא עומד בקצב או נמצא ב-hot loop.</li>
</ol>
<pre>{"level":"error","ts":"2026-11-12T09:41:07Z","msg":"Reconciler error","controller":"cluster",
 "namespace":"orders","name":"orders-db","error":"persistentvolumeclaims is forbidden:
 User \\"system:serviceaccount:cnpg-system:cnpg-manager\\" cannot patch resource
 \\"persistentvolumeclaims\\" in API group \\"\\" in the namespace \\"orders\\""}</pre>
<p>עוד שני קלאסיקות: <strong>hot loop</strong> (ה-operator ו-controller אחר – או Argo CD – כל הזמן כותבים מחדש את אותו שדה; מחפשים אלפי reconciles בדקה ומלחמה על <code>managedFields</code>), ו-<strong>אי-התאמה בין גרסת ה-CRD לגרסת ה-operator</strong> אחרי ששדרגו רק אחד מהם (<code>no matches for kind "Cluster" in version …</code> או שדות לא מוכרים שנמחקים בשקט ב-pruning).</p>`
      }
    }
  ],
  diagram: `   you / Argo CD                         API server + etcd
   kubectl apply ──► DatabaseBackup CR ─────────────────────┐
                     spec:   what you want                   │ watch (informer cache)
                     status: conditions, observedGeneration  ▼
                                                   ┌──────────────────────┐
                                                   │ operator (controller) │ leader = Lease
                                                   │  work queue ─► Reconcile(ns/name)
                                                   │    read spec           │
                                                   │    observe actual      │
                                                   │    act (idempotent)    │
                                                   │    write status        │
                                                   └───┬────────────┬──────┘
                              ownerReferences (GC) ◄───┘            └──► external: S3, DNS, EC2
                              CronJob, Secret, PVC                       guarded by a FINALIZER
   delete CR → deletionTimestamp → operator cleans external → removes finalizer → object gone`,
  handsOn: [
    { cmd: "kubectl get crd -o custom-columns=NAME:.metadata.name,GROUP:.spec.group,VERSIONS:.spec.versions[*].name --sort-by=.spec.group",
      what: { en: "Inventory of every API extension in the cluster and its versions.", he: "מצאי של כל הרחבות ה-API ב-cluster והגרסאות שלהן." } },
    { cmd: "kubectl explain certificate.spec --recursive | head -40",
      what: { en: "Read a CRD's schema straight from the API server — the docs that always match the installed version.", he: "קוראים את ה-schema של CRD ישירות מה-API server – תיעוד שתמיד תואם לגרסה המותקנת." } },
    { cmd: "kubectl get certificate shop-tls -n shop -o jsonpath='{.metadata.generation} {.status.observedGeneration}{\"\\n\"}{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{\"\\n\"}{end}'",
      what: { en: "Has the controller processed my latest change, and what do its conditions say?", he: "ה-controller עיבד את השינוי האחרון שלי, ומה ה-conditions אומרים?" } },
    { cmd: "kubectl get lease -n cert-manager -o custom-columns=NAME:.metadata.name,HOLDER:.spec.holderIdentity,RENEWED:.spec.renewTime",
      what: { en: "Which replica of the operator is the active leader, and when it last renewed.", he: "איזה replica של ה-operator הוא ה-leader הפעיל, ומתי הוא חידש לאחרונה." } },
    { cmd: "kubectl logs -n cert-manager deploy/cert-manager --since=30m | grep -iE 'error|forbidden|conflict'",
      what: { en: "Reconcile errors, missing RBAC and update conflicts in the operator's own logs.", he: "שגיאות reconcile, RBAC חסר ו-conflicts בעדכונים בלוגים של ה-operator עצמו." } },
    { cmd: "kubectl get kafkatopics -A -o json | jq -r '.items[] | select(.metadata.deletionTimestamp) | \"\\(.metadata.namespace)/\\(.metadata.name) \\(.metadata.finalizers)\"'",
      what: { en: "List custom resources stuck in deletion and the finalizers holding them.", he: "רשימת custom resources שתקועים במחיקה וה-finalizers שמחזיקים אותם." } },
    { cmd: "kubectl auth can-i --list --as=system:serviceaccount:cnpg-system:cnpg-manager | grep -i persistentvolumeclaims",
      what: { en: "Confirm what the operator's ServiceAccount may do when logs say 'forbidden'.", he: "מוודאים מה ה-ServiceAccount של ה-operator רשאי לעשות כשהלוגים אומרים 'forbidden'." } },
    { cmd: "kubebuilder init --domain example.com --repo github.com/acme/backup-operator && kubebuilder create api --group ops --version v1alpha1 --kind DatabaseBackup --resource --controller",
      what: { en: "Scaffold a new operator project with one CRD and its controller.", he: "מייצרים שלד של פרויקט operator חדש עם CRD אחד וה-controller שלו." } }
  ],
  mnemonic: {
    en: "<strong>Noun + Verb</strong>: the CRD is the noun, the controller is the verb. And the loop is <strong>Read → Observe → Act → Report</strong> — <em>R-O-A-R</em>, repeat forever.",
    he: "<strong>שם-עצם + פועל</strong>: ה-CRD הוא שם העצם, ה-controller הוא הפועל. והלולאה היא <strong>Read → Observe → Act → Report</strong> – <em>R-O-A-R</em>, ושוב, לנצח."
  },
  pitfalls: [
    { en: "Uninstalling an operator before deleting its custom resources — finalizers are never removed, namespaces hang in Terminating, and external resources leak.",
      he: "להסיר operator לפני שמחקו את ה-custom resources שלו – אף אחד לא יסיר את ה-finalizers, namespaces נתקעים ב-Terminating, ומשאבים חיצוניים דולפים." },
    { en: "Upgrading an operator with Helm and assuming the CRDs were upgraded too. Helm installs <code>crds/</code> once and never upgrades them; new fields get pruned and the controller misbehaves.",
      he: "לשדרג operator עם Helm ולהניח שגם ה-CRDs שודרגו. Helm מתקין את <code>crds/</code> פעם אחת ולעולם לא משדרג אותם; שדות חדשים נמחקים ב-pruning וה-controller מתנהג מוזר." },
    { en: "Writing Reconcile as edge-triggered ('on create do X, on update do Y'). Missed events or retries then cause duplicate or missing actions; reconcile must compute from full state every time.",
      he: "לכתוב Reconcile כ-edge-triggered ('ב-create עשה X, ב-update עשה Y'). Events שהתפספסו או retries גורמים לפעולות כפולות או חסרות; reconcile חייב לחשב מתוך ה-state המלא בכל פעם." },
    { en: "Letting Argo CD and an operator manage the same field (e.g. replicas). They overwrite each other in a hot loop; use <code>ignoreDifferences</code> or let only one owner touch it.",
      he: "לתת ל-Argo CD ול-operator לנהל את אותו שדה (למשל replicas). הם דורסים אחד את השני ב-hot loop; משתמשים ב-<code>ignoreDifferences</code> או שרק בעלים אחד נוגע בשדה." }
  ],
  interview: [
    { q: { en: "What does 'level-triggered' mean for a controller and why does Kubernetes insist on it?", he: "מה זה אומר ש-controller הוא 'level-triggered' ולמה Kubernetes מתעקש על זה?" },
      a: { en: "The controller reacts to the current state, not to the event stream. Reconcile receives only a key, reads the desired spec and the actual world, and converges. That makes it robust to missed events, restarts, duplicate deliveries and concurrent changes — the next pass fixes whatever drifted. Edge-triggered logic ('when X was created do Y') breaks the moment an event is lost.",
           he: "ה-controller מגיב למצב הנוכחי, לא לרצף ה-events. ה-Reconcile מקבל רק מפתח, קורא את ה-spec הרצוי ואת המציאות, ומתכנס. זה הופך אותו לעמיד ל-events שהתפספסו, ל-restarts, למסירות כפולות ולשינויים במקביל – הסבב הבא מתקן כל מה שזז. לוגיקה edge-triggered ('כש-X נוצר עשה Y') נשברת ברגע ש-event אחד הולך לאיבוד." } },
    { q: { en: "When would you write your own operator, and when would you not?", he: "מתי תכתוב operator משלך, ומתי לא?" },
      a: { en: "Write one when there is continuous, stateful operational logic Kubernetes doesn't know — failover, ordered upgrades, managing external resources with cleanup — and no mature community operator exists. Don't when the need is templating (Helm/Kustomize), composing cloud resources (Crossplane/kro), or a one-off task (a Job). Factor in ownership: CRD versioning, upgrades, RBAC, on-call.",
           he: "כותבים כשיש לוגיקה תפעולית רציפה ו-stateful ש-Kubernetes לא מכיר – failover, שדרוגים מסודרים, ניהול משאבים חיצוניים עם ניקוי – ואין operator קהילתי בשל. לא כותבים כשהצורך הוא templating (Helm/Kustomize), הרכבת משאבי ענן (Crossplane/kro), או משימה חד-פעמית (Job). צריך לקחת בחשבון בעלות: גרסאות CRD, שדרוגים, RBAC, on-call." } },
    { q: { en: "A custom resource has been stuck Terminating for a day. How do you approach it?", he: "Custom resource תקוע ב-Terminating כבר יום. איך ניגשים?" },
      a: { en: "Check <code>metadata.finalizers</code> to see which controller owns cleanup, then check whether that controller is running and what its logs say about this object (often RBAC, a cloud API error, or the operator was uninstalled). Fix the controller so it completes cleanup. Only if that's impossible, clean the external resource manually and then patch the finalizer out — never just strip it blindly.",
           he: "בודקים את <code>metadata.finalizers</code> כדי לראות איזה controller אחראי על הניקוי, ואז אם ה-controller רץ ומה הלוגים שלו אומרים על האובייקט (הרבה פעמים RBAC, שגיאת API של הענן, או שה-operator הוסר). מתקנים את ה-controller כדי שישלים את הניקוי. רק אם זה בלתי אפשרי – מנקים ידנית את המשאב החיצוני ואז עושים patch להסרת ה-finalizer – אף פעם לא מסירים בעיוורון." } }
  ],
  quiz: [
    { q: { en: "A CR's <code>metadata.generation</code> is 7 but <code>status.observedGeneration</code> is 5. What does it tell you?", he: "ל-CR יש <code>metadata.generation</code> 7 אבל <code>status.observedGeneration</code> 5. מה זה אומר?" },
      options: [
        { en: "The CR has been edited 5 times", he: "ה-CR נערך 5 פעמים" },
        { en: "The controller hasn't processed the two latest spec changes (down, stuck, or erroring)", he: "ה-controller לא עיבד את שני השינויים האחרונים ב-spec (למטה, תקוע או בשגיאות)" },
        { en: "The CRD has two storage versions", he: "ל-CRD יש שתי גרסאות storage" },
        { en: "Everything is fine — the numbers are unrelated", he: "הכל בסדר – המספרים לא קשורים" }
      ], answer: 1,
      explain: { en: "generation increments on every spec change; observedGeneration is what the controller last reconciled. A gap = the controller is behind.", he: "generation עולה בכל שינוי ב-spec; observedGeneration הוא מה שה-controller עשה לו reconcile לאחרונה. פער = ה-controller מפגר." } },
    { q: { en: "Why does an operator add a finalizer to its custom resources?", he: "למה operator מוסיף finalizer ל-custom resources שלו?" },
      options: [
        { en: "To prevent anyone from editing the spec", he: "כדי למנוע מאחרים לערוך את ה-spec" },
        { en: "To speed up garbage collection of child pods", he: "כדי להאיץ garbage collection של pods ילדים" },
        { en: "To get a chance to clean up external resources before the object is removed", he: "כדי לקבל הזדמנות לנקות משאבים חיצוניים לפני שהאובייקט נמחק" },
        { en: "To make the object survive etcd restores", he: "כדי שהאובייקט ישרוד שחזור של etcd" }
      ], answer: 2,
      explain: { en: "In-cluster children are handled by ownerReferences. Finalizers block deletion until the controller cleans up what Kubernetes can't see (buckets, DNS, cloud instances).", he: "ילדים בתוך ה-cluster מטופלים ע״י ownerReferences. Finalizers חוסמים את המחיקה עד שה-controller מנקה את מה ש-Kubernetes לא רואה (buckets, DNS, instances בענן)." } },
    { q: { en: "After upgrading an operator's Helm chart, new spec fields you set silently disappear. Most likely?", he: "אחרי שדרוג ה-Helm chart של operator, שדות חדשים שהגדרת ב-spec נעלמים בשקט. מה הכי סביר?" },
      options: [
        { en: "The operator has a bug in Reconcile", he: "יש באג ב-Reconcile של ה-operator" },
        { en: "The CRDs weren't upgraded (Helm doesn't upgrade <code>crds/</code>), so the API server prunes unknown fields", he: "ה-CRDs לא שודרגו (Helm לא משדרג את <code>crds/</code>), אז ה-API server מוחק שדות לא מוכרים" },
        { en: "etcd is out of space", he: "נגמר המקום ב-etcd" },
        { en: "A NetworkPolicy blocks the operator", he: "NetworkPolicy חוסם את ה-operator" }
      ], answer: 1,
      explain: { en: "Structural schemas prune unknown fields. Apply the new CRDs explicitly (most projects publish them separately) before or with the chart upgrade.", he: "Schemas מבניים מוחקים שדות לא מוכרים. מחילים את ה-CRDs החדשים במפורש (רוב הפרויקטים מפרסמים אותם בנפרד) לפני או יחד עם שדרוג ה-chart." } },
    { q: { en: "Which is the strongest reason to write a custom operator instead of a Helm chart?", he: "מה הסיבה החזקה ביותר לכתוב operator במקום Helm chart?" },
      options: [
        { en: "You want fewer YAML files", he: "רוצים פחות קבצי YAML" },
        { en: "The workload needs continuous operational actions such as automated failover and ordered upgrades", he: "ה-workload צריך פעולות תפעול מתמשכות כמו failover אוטומטי ושדרוגים מסודרים" },
        { en: "You need to set different values per environment", he: "צריך ערכים שונים לכל סביבה" },
        { en: "Your team prefers Go over YAML", he: "הצוות מעדיף Go על פני YAML" }
      ], answer: 1,
      explain: { en: "Helm renders once at deploy time; an operator keeps reacting. Per-environment values and fewer files are templating problems.", he: "Helm מרנדר פעם אחת בזמן deploy; operator ממשיך להגיב כל הזמן. ערכים לכל סביבה ופחות קבצים הם בעיות של templating." } }
  ],
  related: ["k8s-architecture", "k8s-helm-gitops", "k8s-ingress-certs-dns", "k8s-troubleshooting-playbook"]
});

// ---------------------------------------------------------------------------
// 33. Security & policy
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-security-policy",
  track: "kubernetes",
  order: 33,
  icon: "🛡️",
  level: 3,
  minutes: 18,
  title: { en: "Kubernetes Security & Policy in Production", he: "אבטחה ו-Policy ב-Kubernetes בפרודקשן" },
  tldr: {
    en: "Layer the defenses: Pod Security Standards + securityContext (what a pod may do), Kyverno/Gatekeeper (what may be admitted), signed images (what may run), NetworkPolicy (who may talk), workload identity + external secrets (what it may access), Falco (what it actually does).",
    he: "בונים הגנה בשכבות: Pod Security Standards + securityContext (מה pod רשאי לעשות), Kyverno/Gatekeeper (מה מותר להכניס), images חתומים (מה מותר להריץ), NetworkPolicy (מי מדבר עם מי), workload identity + external secrets (למה מותר לגשת), Falco (מה הוא עושה בפועל)."
  },
  analogy: {
    en: "An airport. The building code says no gas cylinders in the terminal (Pod Security Standards). Security screening checks every bag against a rulebook (admission policies). Passports are verified against the issuing country's signature (image signing). Gates only open to the right flights (NetworkPolicy). Staff badges open only their own rooms and expire daily (workload identity). And cameras watch for people doing weird things after they're inside (Falco).",
    he: "שדה תעופה. תקנות הבנייה אומרות שאין בלוני גז בטרמינל (Pod Security Standards). הבידוק הביטחוני בודק כל תיק מול ספר חוקים (admission policies). דרכונים מאומתים מול החתימה של המדינה המנפיקה (חתימת images). השערים נפתחים רק לטיסות הנכונות (NetworkPolicy). תגי העובדים פותחים רק את החדרים שלהם ופגים כל יום (workload identity). ומצלמות מחפשות אנשים שעושים דברים מוזרים אחרי שכבר נכנסו (Falco)."
  },
  sections: [
    {
      h: { en: "Pod Security Standards & a restricted securityContext", he: "Pod Security Standards ו-securityContext מסוג restricted" },
      body: {
        en: `<p>Pod Security Admission (built in, replaced PodSecurityPolicy) enforces three profiles per namespace: <strong>privileged</strong> (anything), <strong>baseline</strong> (blocks hostNetwork, hostPath, privileged, dangerous caps) and <strong>restricted</strong> (baseline + non-root, no privilege escalation, drop ALL caps, seccomp). Each can run in <code>enforce</code>, <code>audit</code> or <code>warn</code> mode:</p>
<pre>kubectl label ns shop \\
  pod-security.kubernetes.io/enforce=restricted pod-security.kubernetes.io/enforce-version=latest \\
  pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/audit=restricted</pre>
<p>A container that passes <code>restricted</code>:</p>
<pre>spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
    seccompProfile: { type: RuntimeDefault }
  automountServiceAccountToken: false      # unless it talks to the API
  containers:
  - name: app
    image: ghcr.io/acme/shop@sha256:4f1c…
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities: { drop: ["ALL"] }
    volumeMounts: [{ name: tmp, mountPath: /tmp }]   # writable scratch, since root fs is RO
  volumes: [{ name: tmp, emptyDir: { sizeLimit: 256Mi } }]</pre>
<p>When a Deployment violates it, <code>kubectl apply</code> only <em>warns</em> — the rejection happens when the ReplicaSet creates pods, so the Deployment just sits at 0 ready. Look at the ReplicaSet:</p>
<pre>$ kubectl describe rs shop-web-5c7d9 -n shop | grep -A3 FailedCreate
Warning  FailedCreate  replicaset-controller  Error creating: pods "shop-web-5c7d9-x2k4p" is forbidden:
violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false (container "app" must set
securityContext.allowPrivilegeEscalation=false), unrestricted capabilities (container "app" must set
securityContext.capabilities.drop=["ALL"]), runAsNonRoot != true (pod or container "app" must set
securityContext.runAsNonRoot=true)</pre>
<blockquote>⚠️ Production tip: roll out with <code>warn</code> + <code>audit</code> first, fix workloads, then flip <code>enforce</code>. Use <code>kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted</code> — the server prints which existing pods would violate.</blockquote>`,
        he: `<p>Pod Security Admission (מובנה, החליף את PodSecurityPolicy) אוכף שלושה פרופילים לכל namespace: <strong>privileged</strong> (הכל מותר), <strong>baseline</strong> (חוסם hostNetwork, hostPath, privileged, capabilities מסוכנים) ו-<strong>restricted</strong> (baseline + non-root, בלי privilege escalation, drop ALL caps, seccomp). כל אחד יכול לרוץ במצב <code>enforce</code>, <code>audit</code> או <code>warn</code>:</p>
<pre>kubectl label ns shop \\
  pod-security.kubernetes.io/enforce=restricted pod-security.kubernetes.io/enforce-version=latest \\
  pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/audit=restricted</pre>
<p>קונטיינר שעובר את <code>restricted</code>:</p>
<pre>spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
    seccompProfile: { type: RuntimeDefault }
  automountServiceAccountToken: false      # unless it talks to the API
  containers:
  - name: app
    image: ghcr.io/acme/shop@sha256:4f1c…
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities: { drop: ["ALL"] }
    volumeMounts: [{ name: tmp, mountPath: /tmp }]   # writable scratch, since root fs is RO
  volumes: [{ name: tmp, emptyDir: { sizeLimit: 256Mi } }]</pre>
<p>כש-Deployment מפר את זה, <code>kubectl apply</code> רק <em>מזהיר</em> – הדחייה קורית כשה-ReplicaSet יוצר pods, אז ה-Deployment פשוט נשאר עם 0 ready. מסתכלים על ה-ReplicaSet:</p>
<pre>$ kubectl describe rs shop-web-5c7d9 -n shop | grep -A3 FailedCreate
Warning  FailedCreate  replicaset-controller  Error creating: pods "shop-web-5c7d9-x2k4p" is forbidden:
violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false (container "app" must set
securityContext.allowPrivilegeEscalation=false), unrestricted capabilities (container "app" must set
securityContext.capabilities.drop=["ALL"]), runAsNonRoot != true (pod or container "app" must set
securityContext.runAsNonRoot=true)</pre>
<blockquote>⚠️ טיפ לפרודקשן: מגלגלים קודם עם <code>warn</code> + <code>audit</code>, מתקנים workloads, ורק אז מדליקים <code>enforce</code>. <code>kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted</code> – השרת מדפיס אילו pods קיימים היו מפרים.</blockquote>`
      }
    },
    {
      h: { en: "Policy engines: Kyverno vs OPA Gatekeeper", he: "מנועי policy: Kyverno מול OPA Gatekeeper" },
      body: {
        en: `<p>PSS covers pod security only. For "every pod must have requests", "no <code>:latest</code>", "Ingress hosts must end with .example.com", "add team label" you need an admission policy engine:</p>
<ul>
<li><strong>Kyverno</strong> — policies are Kubernetes YAML; validate, <em>mutate</em>, <em>generate</em> (e.g. default NetworkPolicy per new namespace), verify images. Auto-generates rules for Deployments/StatefulSets from Pod rules.</li>
<li><strong>OPA Gatekeeper</strong> — policies in Rego (ConstraintTemplate + Constraint). More expressive, steeper learning curve; good if you already use OPA elsewhere.</li>
<li><strong>ValidatingAdmissionPolicy</strong> — built into Kubernetes (GA 1.30), CEL expressions, no webhook to run. Great for simple validations.</li>
</ul>
<pre>apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: pod-hygiene
spec:
  background: true                     # also reports on existing resources
  rules:
  - name: require-requests
    match: { any: [{ resources: { kinds: [Pod] } }] }
    exclude: { any: [{ resources: { namespaces: [kube-system] } }] }
    validate:
      failureAction: Enforce           # Audit while rolling out
      message: "CPU and memory requests are required."
      pattern:
        spec:
          containers:
          - resources: { requests: { cpu: "?*", memory: "?*" } }
  - name: disallow-latest
    match: { any: [{ resources: { kinds: [Pod] } }] }
    validate:
      failureAction: Enforce
      message: "Pin an image tag or digest; ':latest' is not allowed."
      pattern:
        spec:
          containers:
          - image: "!*:latest"

$ kubectl apply -f bad-deploy.yaml
Error from server: admission webhook "validate.kyverno.svc-fail" denied the request:
resource Deployment/shop/web was blocked due to the following policies
pod-hygiene:
  autogen-require-requests: 'validation error: CPU and memory requests are required.
    rule autogen-require-requests failed at path /spec/template/spec/containers/0/resources/requests/'</pre>
<blockquote>💡 Real world: policy engines are admission <em>webhooks</em> — if their pods die and <code>failurePolicy: Fail</code>, nobody can deploy (or even scale) anything. Run them with 3 replicas, a PDB, priorityClass, and exclude <code>kube-system</code> so you can always repair the cluster.</blockquote>`,
        he: `<p>PSS מכסה רק אבטחת pods. בשביל "לכל pod חייבים להיות requests", "בלי <code>:latest</code>", "hosts של Ingress חייבים להיגמר ב-.example.com", "להוסיף label של צוות" צריך מנוע admission policy:</p>
<ul>
<li><strong>Kyverno</strong> – ה-policies הם YAML של Kubernetes; validate, <em>mutate</em>, <em>generate</em> (למשל NetworkPolicy ברירת מחדל לכל namespace חדש), אימות images. מייצר אוטומטית חוקים ל-Deployments/StatefulSets מתוך חוקים על Pod.</li>
<li><strong>OPA Gatekeeper</strong> – policies ב-Rego (ConstraintTemplate + Constraint). יותר אקספרסיבי, עקומת למידה תלולה יותר; מתאים אם כבר משתמשים ב-OPA במקומות אחרים.</li>
<li><strong>ValidatingAdmissionPolicy</strong> – מובנה ב-Kubernetes (GA ב-1.30), ביטויי CEL, בלי webhook להריץ. מצוין לולידציות פשוטות.</li>
</ul>
<pre>apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: pod-hygiene
spec:
  background: true                     # also reports on existing resources
  rules:
  - name: require-requests
    match: { any: [{ resources: { kinds: [Pod] } }] }
    exclude: { any: [{ resources: { namespaces: [kube-system] } }] }
    validate:
      failureAction: Enforce           # Audit while rolling out
      message: "CPU and memory requests are required."
      pattern:
        spec:
          containers:
          - resources: { requests: { cpu: "?*", memory: "?*" } }
  - name: disallow-latest
    match: { any: [{ resources: { kinds: [Pod] } }] }
    validate:
      failureAction: Enforce
      message: "Pin an image tag or digest; ':latest' is not allowed."
      pattern:
        spec:
          containers:
          - image: "!*:latest"

$ kubectl apply -f bad-deploy.yaml
Error from server: admission webhook "validate.kyverno.svc-fail" denied the request:
resource Deployment/shop/web was blocked due to the following policies
pod-hygiene:
  autogen-require-requests: 'validation error: CPU and memory requests are required.
    rule autogen-require-requests failed at path /spec/template/spec/containers/0/resources/requests/'</pre>
<blockquote>💡 מהשטח: מנועי policy הם admission <em>webhooks</em> – אם ה-pods שלהם מתים ו-<code>failurePolicy: Fail</code>, אף אחד לא יכול לעשות deploy (או אפילו scale) לכלום. מריצים אותם עם 3 replicas, PDB, priorityClass, ומחריגים את <code>kube-system</code> כדי שתמיד אפשר יהיה לתקן את ה-cluster.</blockquote>`
      }
    },
    {
      h: { en: "Supply chain: signing and verifying images with cosign", he: "Supply chain: חתימה ואימות של images עם cosign" },
      body: {
        en: `<p>A tag is a mutable pointer; anyone with push rights can replace <code>shop:1.4.2</code>. Sigstore's <strong>cosign</strong> signs the image <em>digest</em>. In <strong>keyless</strong> mode the CI job's OIDC identity (e.g. GitHub Actions) gets a short-lived cert from Fulcio and the signature is recorded in the Rekor transparency log — no long-lived keys to leak.</p>
<pre># in CI (GitHub Actions with id-token: write)
cosign sign --yes ghcr.io/acme/shop@sha256:4f1c9e…

# anywhere: verify WHO built it
cosign verify ghcr.io/acme/shop@sha256:4f1c9e… \\
  --certificate-identity-regexp '^https://github.com/acme/shop/.github/workflows/release.yml@refs/heads/main$' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
Verification for ghcr.io/acme/shop@sha256:4f1c9e… --
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - Existence of the claims in the transparency log was verified offline
  - The code-signing certificate was verified using trusted certificate authority certificates</pre>
<p>Enforce it at admission so unsigned images can't run, and pin tags to digests on the fly:</p>
<pre>  - name: verify-signature
    match: { any: [{ resources: { kinds: [Pod] } }] }
    verifyImages:
    - imageReferences: ["ghcr.io/acme/*"]
      failureAction: Enforce
      mutateDigest: true
      attestors:
      - entries:
        - keyless:
            subject: "https://github.com/acme/*/.github/workflows/release.yml@refs/heads/main"
            issuer: "https://token.actions.githubusercontent.com"
            rekor: { url: https://rekor.sigstore.dev }</pre>
<blockquote>💡 Real world: go further with <strong>attestations</strong> — cosign can attach an SBOM and SLSA provenance to the image, and the policy can require "built by our CI, from main, with no critical CVEs in the attached scan".</blockquote>`,
        he: `<p>Tag הוא מצביע שאפשר לשנות; כל מי שיש לו הרשאת push יכול להחליף את <code>shop:1.4.2</code>. <strong>cosign</strong> של Sigstore חותם על ה-<em>digest</em> של ה-image. במצב <strong>keyless</strong> ה-OIDC identity של ה-job ב-CI (למשל GitHub Actions) מקבל תעודה קצרת-חיים מ-Fulcio, והחתימה נרשמת ב-transparency log של Rekor – בלי מפתחות ארוכי-טווח שיכולים לדלוף.</p>
<pre># in CI (GitHub Actions with id-token: write)
cosign sign --yes ghcr.io/acme/shop@sha256:4f1c9e…

# anywhere: verify WHO built it
cosign verify ghcr.io/acme/shop@sha256:4f1c9e… \\
  --certificate-identity-regexp '^https://github.com/acme/shop/.github/workflows/release.yml@refs/heads/main$' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
Verification for ghcr.io/acme/shop@sha256:4f1c9e… --
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - Existence of the claims in the transparency log was verified offline
  - The code-signing certificate was verified using trusted certificate authority certificates</pre>
<p>אוכפים את זה ב-admission כדי ש-images לא חתומים לא ירוצו, וממירים tags ל-digests תוך כדי:</p>
<pre>  - name: verify-signature
    match: { any: [{ resources: { kinds: [Pod] } }] }
    verifyImages:
    - imageReferences: ["ghcr.io/acme/*"]
      failureAction: Enforce
      mutateDigest: true
      attestors:
      - entries:
        - keyless:
            subject: "https://github.com/acme/*/.github/workflows/release.yml@refs/heads/main"
            issuer: "https://token.actions.githubusercontent.com"
            rekor: { url: https://rekor.sigstore.dev }</pre>
<blockquote>💡 מהשטח: אפשר ללכת רחוק יותר עם <strong>attestations</strong> – cosign יכול לצרף ל-image SBOM ו-SLSA provenance, וה-policy יכול לדרוש "נבנה ע״י ה-CI שלנו, מ-main, בלי CVEs קריטיים בסריקה המצורפת".</blockquote>`
      }
    },
    {
      h: { en: "NetworkPolicy: default-deny, then allow", he: "NetworkPolicy: default-deny ואז לפתוח" },
      body: {
        en: `<p>By default every pod can reach every other pod in the cluster — one compromised pod can scan your databases. NetworkPolicies are allow-lists enforced by the CNI (Calico, Cilium, or AWS VPC CNI with network policy enabled — on a CNI without support they're silently ignored!). Start each namespace with deny-all, then open what's needed — and don't forget DNS:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: shop }
spec:
  podSelector: {}                 # every pod in the namespace
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns, namespace: shop }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
      podSelector: { matchLabels: { k8s-app: kube-dns } }
    ports: [{ protocol: UDP, port: 53 }, { protocol: TCP, port: 53 }]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: web-from-ingress, namespace: shop }
spec:
  podSelector: { matchLabels: { app: web } }
  ingress:
  - from:
    - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: ingress-nginx } }
    ports: [{ port: 8080 }]</pre>
<p>Debug: symptom is a <em>timeout</em> (packets dropped), not "connection refused". Test from a netshoot pod with the same labels; with Cilium, <code>hubble observe --verdict DROPPED -n shop</code> shows exactly which policy dropped what.</p>
<blockquote>⚠️ Production tip: note the difference between one <code>- to:</code> item with both <code>namespaceSelector</code> and <code>podSelector</code> (AND) and two separate items (OR). A stray dash turns "kube-dns pods in kube-system" into "everything in kube-system OR any pod labeled kube-dns".</blockquote>`,
        he: `<p>כברירת מחדל כל pod יכול להגיע לכל pod אחר ב-cluster – pod אחד שנפרץ יכול לסרוק את ה-databases שלך. NetworkPolicies הן allow-lists שה-CNI אוכף (Calico, Cilium, או AWS VPC CNI עם network policy מופעל – על CNI בלי תמיכה הן פשוט נבלעות בשקט!). מתחילים כל namespace עם deny-all, ואז פותחים את מה שצריך – ולא שוכחים DNS:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: shop }
spec:
  podSelector: {}                 # every pod in the namespace
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns, namespace: shop }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
      podSelector: { matchLabels: { k8s-app: kube-dns } }
    ports: [{ protocol: UDP, port: 53 }, { protocol: TCP, port: 53 }]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: web-from-ingress, namespace: shop }
spec:
  podSelector: { matchLabels: { app: web } }
  ingress:
  - from:
    - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: ingress-nginx } }
    ports: [{ port: 8080 }]</pre>
<p>תחקור: הסימפטום הוא <em>timeout</em> (packets נזרקים), לא "connection refused". בודקים מ-pod של netshoot עם אותם labels; עם Cilium, <code>hubble observe --verdict DROPPED -n shop</code> מראה בדיוק איזה policy זרק מה.</p>
<blockquote>⚠️ טיפ לפרודקשן: שימו לב להבדל בין פריט <code>- to:</code> אחד עם <code>namespaceSelector</code> וגם <code>podSelector</code> (AND) לבין שני פריטים נפרדים (OR). מקף אחד מיותר הופך את "ה-pods של kube-dns ב-kube-system" ל"כל מה שב-kube-system או כל pod עם label של kube-dns".</blockquote>`
      }
    },
    {
      h: { en: "Secrets and workload identity: no static keys", he: "Secrets ו-workload identity: בלי מפתחות סטטיים" },
      body: {
        en: `<p>Kubernetes Secrets are base64, not encryption; enable envelope encryption (KMS) at rest and keep the <em>source of truth</em> in a real secret manager. Two common bridges:</p>
<ul>
<li><strong>External Secrets Operator</strong> — syncs from AWS Secrets Manager / Vault / GCP / Azure Key Vault into a regular Secret, refreshed on an interval. Works with env vars and every app.</li>
<li><strong>Secrets Store CSI Driver</strong> — mounts secrets as files directly from the provider at pod start; optional sync to a Secret.</li>
</ul>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: db-creds, namespace: shop }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: aws-secrets, kind: ClusterSecretStore }
  target: { name: db-creds, creationPolicy: Owner }
  data:
  - secretKey: DB_PASSWORD
    remoteRef: { key: prod/shop/db, property: password }

$ kubectl get externalsecret -n shop
NAME       STORE         REFRESH INTERVAL   STATUS              READY
db-creds   aws-secrets   1h                 SecretSyncedError   False   # → describe: AccessDeniedException</pre>
<p>And how does the pod (or ESO itself) authenticate to the cloud? <strong>Workload identity</strong>: a Kubernetes ServiceAccount is federated to a cloud identity via OIDC; the pod gets short-lived credentials automatically.</p>
<table>
<tr><th>Cloud</th><th>Mechanism</th><th>Wiring</th></tr>
<tr><td>AWS</td><td>EKS Pod Identity (or older IRSA)</td><td><code>aws eks create-pod-identity-association --cluster-name prod --namespace shop --service-account checkout --role-arn arn:aws:iam::111122223333:role/checkout</code>; IRSA = SA annotation <code>eks.amazonaws.com/role-arn</code></td></tr>
<tr><td>Azure</td><td>AKS Workload Identity</td><td>Federated credential on a managed identity; SA annotation <code>azure.workload.identity/client-id</code>, pod label <code>azure.workload.identity/use: "true"</code></td></tr>
<tr><td>GCP</td><td>Workload Identity Federation for GKE</td><td>IAM binding to <code>principal://…/subject/ns/shop/sa/checkout</code>, or SA annotation <code>iam.gke.io/gcp-service-account</code></td></tr>
</table>
<blockquote>⚠️ Production tip: without workload identity, pods inherit the <em>node's</em> IAM role via the instance metadata service. Block IMDS from pods (IMDSv2 with hop limit 1 on EKS) so a compromised pod can't borrow the node's permissions.</blockquote>`,
        he: `<p>Secrets של Kubernetes הם base64, לא הצפנה; מפעילים envelope encryption (KMS) at rest ומחזיקים את ה-<em>source of truth</em> ב-secret manager אמיתי. שני גשרים נפוצים:</p>
<ul>
<li><strong>External Secrets Operator</strong> – מסנכרן מ-AWS Secrets Manager / Vault / GCP / Azure Key Vault ל-Secret רגיל, עם רענון לפי interval. עובד עם env vars ועם כל אפליקציה.</li>
<li><strong>Secrets Store CSI Driver</strong> – עושה mount ל-secrets כקבצים ישירות מהספק בזמן עליית ה-pod; sync ל-Secret אופציונלי.</li>
</ul>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: db-creds, namespace: shop }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: aws-secrets, kind: ClusterSecretStore }
  target: { name: db-creds, creationPolicy: Owner }
  data:
  - secretKey: DB_PASSWORD
    remoteRef: { key: prod/shop/db, property: password }

$ kubectl get externalsecret -n shop
NAME       STORE         REFRESH INTERVAL   STATUS              READY
db-creds   aws-secrets   1h                 SecretSyncedError   False   # → describe: AccessDeniedException</pre>
<p>ואיך ה-pod (או ESO עצמו) מזדהה מול הענן? <strong>Workload identity</strong>: ServiceAccount של Kubernetes מפודרל ל-identity בענן דרך OIDC; ה-pod מקבל credentials קצרי-חיים אוטומטית.</p>
<table>
<tr><th>ענן</th><th>מנגנון</th><th>חיווט</th></tr>
<tr><td>AWS</td><td>EKS Pod Identity (או IRSA הוותיק)</td><td><code>aws eks create-pod-identity-association --cluster-name prod --namespace shop --service-account checkout --role-arn arn:aws:iam::111122223333:role/checkout</code>; IRSA = annotation על ה-SA <code>eks.amazonaws.com/role-arn</code></td></tr>
<tr><td>Azure</td><td>AKS Workload Identity</td><td>Federated credential על managed identity; annotation על ה-SA <code>azure.workload.identity/client-id</code>, label על ה-pod <code>azure.workload.identity/use: "true"</code></td></tr>
<tr><td>GCP</td><td>Workload Identity Federation for GKE</td><td>IAM binding ל-<code>principal://…/subject/ns/shop/sa/checkout</code>, או annotation על ה-SA <code>iam.gke.io/gcp-service-account</code></td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: בלי workload identity, pods יורשים את ה-IAM role של ה-<em>node</em> דרך ה-instance metadata service. חוסמים IMDS מ-pods (IMDSv2 עם hop limit 1 ב-EKS) כדי ש-pod שנפרץ לא יוכל "לשאול" את ההרשאות של ה-node.</blockquote>`
      }
    },
    {
      h: { en: "Runtime detection (Falco) and benchmarks (kube-bench)", he: "זיהוי בזמן ריצה (Falco) ו-benchmarks (kube-bench)" },
      body: {
        en: `<p>Admission controls what <em>starts</em>; <strong>Falco</strong> watches what containers actually <em>do</em>, via eBPF on every node (DaemonSet). Its default rules catch shells in containers, writes under <code>/etc</code>, reading <code>/etc/shadow</code>, unexpected outbound connections, and access to the service-account token. Ship alerts via Falcosidekick to Slack/PagerDuty/SIEM:</p>
<pre>09:12:44.183 Notice A shell was spawned in a container with an attached terminal
  (evt_type=execve user=root process=bash parent=runc command=bash terminal=34816
   container_name=app k8s_ns=shop k8s_pod_name=checkout-7d9f8b6c4-2xkqp image=ghcr.io/acme/checkout)</pre>
<p>Tune before paging: a <code>kubectl exec</code> by an SRE matches the same rule — add exceptions by namespace/user, keep noisy rules at lower priority, and alert only on the high-signal ones.</p>
<p><strong>kube-bench</strong> checks nodes and control plane against the CIS Kubernetes Benchmark:</p>
<pre>$ kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
$ kubectl logs job/kube-bench | grep -E '^\\[(FAIL|WARN)\\]' | head
[FAIL] 4.2.1 Ensure that the --anonymous-auth argument is set to false (Automated)
[FAIL] 4.2.6 Ensure that the --make-iptables-util-chains argument is set to true (Automated)
[WARN] 5.1.5 Ensure that default service accounts are not actively used (Manual)</pre>
<blockquote>💡 Real world: on managed clusters (EKS/AKS/GKE) the provider owns the control plane checks — use the provider-specific job (e.g. <code>job-eks.yaml</code>) and focus on node config, RBAC and workload findings. Treat the CIS result as a backlog, not a pass/fail gate.</blockquote>`,
        he: `<p>Admission שולט במה ש<em>עולה</em>; <strong>Falco</strong> מסתכל על מה שקונטיינרים באמת <em>עושים</em>, דרך eBPF על כל node (DaemonSet). החוקים ברירת המחדל שלו תופסים shells בתוך קונטיינרים, כתיבה תחת <code>/etc</code>, קריאה של <code>/etc/shadow</code>, חיבורים יוצאים לא צפויים וגישה ל-token של ה-service account. שולחים התראות דרך Falcosidekick ל-Slack/PagerDuty/SIEM:</p>
<pre>09:12:44.183 Notice A shell was spawned in a container with an attached terminal
  (evt_type=execve user=root process=bash parent=runc command=bash terminal=34816
   container_name=app k8s_ns=shop k8s_pod_name=checkout-7d9f8b6c4-2xkqp image=ghcr.io/acme/checkout)</pre>
<p>מכווננים לפני שמקפיצים אנשים: <code>kubectl exec</code> של SRE תופס את אותו חוק – מוסיפים exceptions לפי namespace/user, משאירים חוקים רועשים ב-priority נמוך, ומתריעים רק על אלה עם signal גבוה.</p>
<p><strong>kube-bench</strong> בודק nodes ו-control plane מול ה-CIS Kubernetes Benchmark:</p>
<pre>$ kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
$ kubectl logs job/kube-bench | grep -E '^\\[(FAIL|WARN)\\]' | head
[FAIL] 4.2.1 Ensure that the --anonymous-auth argument is set to false (Automated)
[FAIL] 4.2.6 Ensure that the --make-iptables-util-chains argument is set to true (Automated)
[WARN] 5.1.5 Ensure that default service accounts are not actively used (Manual)</pre>
<blockquote>💡 מהשטח: ב-clusters מנוהלים (EKS/AKS/GKE) הספק אחראי על בדיקות ה-control plane – משתמשים ב-job הייעודי (למשל <code>job-eks.yaml</code>) ומתמקדים בהגדרות node, RBAC וממצאים ב-workloads. מתייחסים לתוצאת ה-CIS כ-backlog, לא כשער pass/fail.</blockquote>`
      }
    }
  ],
  diagram: `  build ──► CI signs digest (cosign keyless → Fulcio cert, Rekor log)
                │
  deploy ─► API server ─► authn/RBAC ─► ADMISSION
                                        ├─ Pod Security Admission (ns labels: restricted)
                                        ├─ Kyverno / Gatekeeper / ValidatingAdmissionPolicy
                                        └─ verifyImages (signature + attestations)
                │ admitted
  run   ─► pod: runAsNonRoot · readOnlyRootFilesystem · drop ALL · seccomp RuntimeDefault
                │
  talk  ─► NetworkPolicy: default-deny ─► allow DNS ─► allow ingress-nginx → web:8080
                │
  access ─► ServiceAccount ══OIDC══► cloud IAM role (Pod Identity / AKS WI / GKE WIF)
            secrets: Secrets Manager/Vault ─► External Secrets Operator ─► Secret
                │
  watch ─► Falco (eBPF, every node) ─► Falcosidekick ─► Slack / SIEM
  audit ─► kube-bench (CIS) · PolicyReports · API audit logs`,
  handsOn: [
    { cmd: "kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted",
      what: { en: "Preview which existing pods would violate the restricted profile before enforcing it.", he: "תצוגה מקדימה – אילו pods קיימים יפרו את פרופיל restricted לפני שאוכפים." } },
    { cmd: "kubectl get ns -L pod-security.kubernetes.io/enforce,pod-security.kubernetes.io/warn",
      what: { en: "Which Pod Security level each namespace enforces/warns on.", he: "איזו רמת Pod Security כל namespace אוכף/מזהיר עליה." } },
    { cmd: "kubectl get policyreports -A -o custom-columns=NS:.metadata.namespace,PASS:.summary.pass,FAIL:.summary.fail,WARN:.summary.warn",
      what: { en: "Kyverno background scan results: how many existing resources fail each namespace's policies.", he: "תוצאות סריקת הרקע של Kyverno: כמה משאבים קיימים נכשלים ב-policies בכל namespace." } },
    { cmd: "cosign verify ghcr.io/acme/shop:1.4.2 --certificate-identity-regexp '^https://github.com/acme/' --certificate-oidc-issuer https://token.actions.githubusercontent.com",
      what: { en: "Verify the image was signed by your CI identity (keyless).", he: "מאמתים שה-image נחתם ע״י ה-identity של ה-CI שלכם (keyless)." } },
    { cmd: "kubectl run np-test -n shop --rm -it --restart=Never --labels=app=web --image=nicolaka/netshoot -- curl -m 3 -sv http://orders.orders.svc:8080/healthz",
      what: { en: "Test a NetworkPolicy from a pod with the same labels as the real workload; a 3s timeout = dropped.", he: "בודקים NetworkPolicy מ-pod עם אותם labels כמו ה-workload האמיתי; timeout של 3 שניות = נזרק." } },
    { cmd: "kubectl get externalsecret -A && kubectl describe externalsecret db-creds -n shop | tail -5",
      what: { en: "Are secrets syncing from the cloud secret manager? Errors usually mean IAM/identity problems.", he: "ה-secrets מסתנכרנים מה-secret manager בענן? שגיאות בדרך כלל אומרות בעיית IAM/identity." } },
    { cmd: "kubectl exec -n shop deploy/checkout -- sh -c 'env | grep -E \"AWS_(ROLE_ARN|CONTAINER_CREDENTIALS_FULL_URI)\"'",
      what: { en: "Check that workload identity is wired: Pod Identity injects the credentials URI, IRSA injects AWS_ROLE_ARN.", he: "בודקים שה-workload identity מחווט: Pod Identity מזריק את ה-URI של ה-credentials, IRSA מזריק AWS_ROLE_ARN." } },
    { cmd: "kubectl logs -n falco -l app.kubernetes.io/name=falco --since=1h | grep -E 'Warning|Error|Critical'",
      what: { en: "Recent higher-priority runtime alerts from Falco across nodes.", he: "התראות runtime בעדיפות גבוהה מ-Falco בכל ה-nodes מהשעה האחרונה." } },
    { cmd: "kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml && kubectl wait --for=condition=complete job/kube-bench --timeout=120s && kubectl logs job/kube-bench | grep -E 'FAIL|WARN' | head -20",
      what: { en: "Run the CIS benchmark on a node and list the top findings. Delete the Job afterwards.", he: "מריצים את ה-CIS benchmark על node ומציגים את הממצאים העיקריים. אחר כך מוחקים את ה-Job." } }
  ],
  mnemonic: {
    en: "<strong>S-A-S-N-I-R</strong> — <em>Standards, Admission, Signatures, Network, Identity, Runtime</em>: \"<strong>S</strong>ecure <strong>A</strong>pps <strong>S</strong>leep, <strong>N</strong>ever <strong>I</strong>n <strong>R</strong>uins\".",
    he: "<strong>S-A-S-N-I-R</strong> – <em>Standards, Admission, Signatures, Network, Identity, Runtime</em>. שש שכבות, מבחוץ פנימה: מה מותר להיות, מה מותר להיכנס, מי חתם, עם מי מדברים, למה ניגשים, ומה קורה בפועל."
  },
  pitfalls: [
    { en: "Enforcing a new policy straight in Enforce mode. Existing Deployments fail at the next rollout or scale-up, often during an incident. Start in Audit/warn, read PolicyReports, then enforce.",
      he: "לאכוף policy חדש ישר במצב Enforce. Deployments קיימים נכשלים ב-rollout או ב-scale-up הבא, הרבה פעמים באמצע אינסידנט. מתחילים ב-Audit/warn, קוראים PolicyReports, ואז אוכפים." },
    { en: "A default-deny NetworkPolicy without an egress rule for DNS — every app suddenly fails with name resolution timeouts.",
      he: "NetworkPolicy של default-deny בלי חוק egress ל-DNS – פתאום כל האפליקציות נכשלות עם timeouts בתרגום שמות." },
    { en: "Writing NetworkPolicies on a CNI that doesn't enforce them. They apply cleanly and do nothing — test with a real deny before trusting them.",
      he: "לכתוב NetworkPolicies על CNI שלא אוכף אותן. הן עולות בלי שגיאה ולא עושות כלום – בודקים עם חסימה אמיתית לפני שסומכים עליהן." },
    { en: "Policy webhooks with <code>failurePolicy: Fail</code> that also cover kube-system. When the engine is down, you can't even deploy the fix for the engine.",
      he: "Webhooks של policy עם <code>failurePolicy: Fail</code> שמכסים גם את kube-system. כשהמנוע למטה, אי אפשר אפילו לעשות deploy לתיקון של המנוע." }
  ],
  interview: [
    { q: { en: "Kyverno or OPA Gatekeeper — how do you choose?", he: "Kyverno או OPA Gatekeeper – איך בוחרים?" },
      a: { en: "Kyverno: policies as Kubernetes YAML, easy for platform teams, plus mutation, generation and built-in image verification — usually the faster path for Kubernetes-only needs. Gatekeeper: Rego is more expressive and reusable across non-Kubernetes OPA use cases (Terraform, APIs), good if the org already invests in OPA. For simple validations, the built-in ValidatingAdmissionPolicy (CEL) avoids running a webhook at all. Whatever you pick: audit mode first, HA deployment, kube-system excluded.",
           he: "Kyverno: policies כ-YAML של Kubernetes, קל לצוותי פלטפורמה, ועוד mutation, generation ואימות images מובנה – בדרך כלל המסלול המהיר לצרכים של Kubernetes בלבד. Gatekeeper: Rego יותר אקספרסיבי ושימושי גם מחוץ ל-Kubernetes (Terraform, APIs), מתאים אם הארגון כבר משקיע ב-OPA. לולידציות פשוטות, ValidatingAdmissionPolicy המובנה (CEL) חוסך להריץ webhook בכלל. מה שלא בוחרים: קודם audit, פריסה ב-HA, ו-kube-system מוחרג." } },
    { q: { en: "How should a pod in EKS get access to an S3 bucket?", he: "איך pod ב-EKS צריך לקבל גישה ל-S3 bucket?" },
      a: { en: "Through workload identity — EKS Pod Identity (or IRSA): an IAM role scoped to that bucket, associated with the pod's ServiceAccount; the SDK picks up short-lived credentials automatically. Not via static access keys in a Secret, and not via the node role (block IMDS from pods with hop limit 1), because that would give every pod on the node the same access.",
           he: "דרך workload identity – EKS Pod Identity (או IRSA): IAM role מוגבל ל-bucket הזה, משויך ל-ServiceAccount של ה-pod; ה-SDK לוקח credentials קצרי-חיים אוטומטית. לא דרך access keys סטטיים ב-Secret, ולא דרך ה-role של ה-node (חוסמים IMDS מ-pods עם hop limit 1), כי אז כל pod על ה-node מקבל את אותה גישה." } },
    { q: { en: "What does image signing protect against that vulnerability scanning doesn't?", he: "מפני מה חתימת images מגינה שסריקת חולשות לא?" },
      a: { en: "Scanning tells you what's inside an image; signing tells you who produced it and that it wasn't swapped. If an attacker pushes a malicious image under a legitimate tag, or someone deploys from a laptop build, verification at admission rejects it because the signature doesn't match the expected CI identity. Combined with attestations, the policy can also require provenance and a clean scan.",
           he: "סריקה אומרת מה יש בתוך ה-image; חתימה אומרת מי ייצר אותו ושלא הוחלף. אם תוקף דוחף image זדוני תחת tag לגיטימי, או שמישהו עושה deploy מ-build של לפטופ, האימות ב-admission דוחה אותו כי החתימה לא תואמת ל-identity של ה-CI. ביחד עם attestations, ה-policy יכול לדרוש גם provenance וסריקה נקייה." } }
  ],
  quiz: [
    { q: { en: "A namespace enforces <code>restricted</code>. Which container setting is required?", he: "Namespace אוכף <code>restricted</code>. איזו הגדרת קונטיינר נדרשת?" },
      options: [
        { en: "<code>privileged: true</code> with <code>runAsUser: 0</code>", he: "<code>privileged: true</code> עם <code>runAsUser: 0</code>" },
        { en: "<code>capabilities.drop: [\"ALL\"]</code> and <code>allowPrivilegeEscalation: false</code>", he: "<code>capabilities.drop: [\"ALL\"]</code> ו-<code>allowPrivilegeEscalation: false</code>" },
        { en: "<code>hostNetwork: true</code>", he: "<code>hostNetwork: true</code>" },
        { en: "A memory limit", he: "Memory limit" }
      ], answer: 1,
      explain: { en: "Restricted requires non-root, no privilege escalation, dropping ALL capabilities and a seccomp profile. Resource limits aren't part of PSS — that's a job for a policy engine.", he: "Restricted דורש non-root, בלי privilege escalation, drop ALL capabilities ו-seccomp profile. Resource limits לא חלק מ-PSS – זה תפקיד של מנוע policy." } },
    { q: { en: "After applying a default-deny NetworkPolicy, all apps in the namespace fail to reach anything, even allowed services. Most likely missing piece?", he: "אחרי apply של NetworkPolicy מסוג default-deny, כל האפליקציות ב-namespace לא מגיעות לשום דבר, אפילו לשירותים מותרים. מה הכי סביר שחסר?" },
      options: [
        { en: "An egress rule allowing DNS (UDP/TCP 53) to kube-dns", he: "חוק egress שמתיר DNS (UDP/TCP 53) ל-kube-dns" },
        { en: "A ClusterRoleBinding for the pods", he: "ClusterRoleBinding ל-pods" },
        { en: "A PodDisruptionBudget", he: "PodDisruptionBudget" },
        { en: "The <code>restricted</code> Pod Security label", he: "ה-label של Pod Security <code>restricted</code>" }
      ], answer: 0,
      explain: { en: "Service names must resolve first. Egress deny blocks DNS too, so every name lookup times out.", he: "קודם צריך לתרגם את שם ה-Service. חסימת egress חוסמת גם DNS, אז כל lookup נגמר ב-timeout." } },
    { q: { en: "Your Deployment applied fine but has 0 pods. The ReplicaSet shows <code>FailedCreate … violates PodSecurity \"restricted:latest\"</code>. Why didn't apply fail?", he: "ה-Deployment עלה בלי שגיאה אבל יש 0 pods. ה-ReplicaSet מראה <code>FailedCreate … violates PodSecurity \"restricted:latest\"</code>. למה ה-apply לא נכשל?" },
      options: [
        { en: "PSA only evaluates Pods; for workload objects it just warns, and the rejection happens at pod creation", he: "PSA בודק רק Pods; על אובייקטי workload הוא רק מזהיר, והדחייה קורית ביצירת ה-pod" },
        { en: "The namespace is in audit mode", he: "ה-namespace במצב audit" },
        { en: "kubectl skips admission for Deployments", he: "kubectl מדלג על admission ל-Deployments" },
        { en: "The image is not signed", he: "ה-image לא חתום" }
      ], answer: 0,
      explain: { en: "Enforcement applies to Pod objects created by the ReplicaSet controller; on the Deployment you only get a warning. Always check <code>describe rs</code> when a Deployment has no pods.", he: "האכיפה חלה על אובייקטי Pod שה-ReplicaSet controller יוצר; על ה-Deployment מקבלים רק אזהרה. תמיד בודקים <code>describe rs</code> כשאין ל-Deployment pods." } },
    { q: { en: "What is the main advantage of keyless cosign signing?", he: "מה היתרון העיקרי של חתימה keyless עם cosign?" },
      options: [
        { en: "Images become smaller", he: "ה-images נהיים קטנים יותר" },
        { en: "No long-lived private key to store or leak — the CI's OIDC identity is bound to a short-lived cert and logged in Rekor", he: "אין private key ארוך-טווח לשמור או שידלוף – ה-OIDC identity של ה-CI נקשר לתעודה קצרת-חיים ונרשם ב-Rekor" },
        { en: "It encrypts the image layers", he: "היא מצפינה את שכבות ה-image" },
        { en: "It replaces vulnerability scanning", he: "היא מחליפה סריקת חולשות" }
      ], answer: 1,
      explain: { en: "Signing proves origin and integrity, not confidentiality or absence of CVEs. Keyless removes key management and gives a public audit trail.", he: "חתימה מוכיחה מקור ושלמות, לא סודיות ולא היעדר CVEs. Keyless מבטל ניהול מפתחות ונותן audit trail ציבורי." } }
  ],
  related: ["container-security", "k8s-namespaces-rbac", "net-isolation", "k8s-operators-crds"]
});

// ---------------------------------------------------------------------------
// 34. Cluster observability
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-cluster-observability",
  track: "kubernetes",
  order: 34,
  icon: "🔭",
  level: 3,
  minutes: 16,
  title: { en: "Cluster Observability: Metrics, Alerts, Logs & Events", he: "Observability ל-Cluster: מטריקות, התראות, לוגים ו-Events" },
  tldr: {
    en: "Four metric sources (metrics-server, kube-state-metrics, node-exporter, cAdvisor), kube-prometheus-stack to scrape them, a short list of alerts that really page, Fluent Bit for logs, and an events exporter so the 1-hour event history survives.",
    he: "ארבעה מקורות מטריקות (metrics-server, kube-state-metrics, node-exporter, cAdvisor), kube-prometheus-stack שאוסף אותם, רשימה קצרה של התראות שבאמת מקפיצות, Fluent Bit ללוגים, ו-events exporter כדי שהיסטוריית ה-events של שעה תשרוד."
  },
  analogy: {
    en: "A hospital ward. cAdvisor is the heart-rate monitor on each patient (live usage per container). node-exporter watches the room itself — temperature, oxygen supply (host CPU, disk, network). kube-state-metrics is the head nurse's clipboard: who should be in which bed, who's been discharged, who's waiting (desired vs actual state). metrics-server is the quick glance the doctor takes on rounds (kubectl top, HPA). And the logs are the patient's own diary — detailed, but you only read it when something is wrong.",
    he: "מחלקה בבית חולים. cAdvisor הוא מוניטור הדופק על כל מטופל (צריכה חיה לכל קונטיינר). node-exporter מסתכל על החדר עצמו – טמפרטורה, אספקת חמצן (CPU, דיסק ורשת של ה-host). kube-state-metrics הוא הלוח של האחות הראשית: מי אמור להיות באיזו מיטה, מי שוחרר, מי מחכה (desired מול actual). metrics-server זה המבט המהיר של הרופא בסבב (kubectl top, HPA). והלוגים הם היומן של המטופל – מפורט, אבל קוראים אותו רק כשמשהו לא בסדר."
  },
  sections: [
    {
      h: { en: "Four metric sources — what each one gives you", he: "ארבעה מקורות מטריקות – מה כל אחד נותן" },
      body: {
        en: `<table>
<tr><th>Source</th><th>Runs as</th><th>Answers</th><th>Example metrics</th></tr>
<tr><td><strong>metrics-server</strong></td><td>Deployment; scrapes kubelet <code>/metrics/resource</code> every ~15s, keeps only the latest point in memory</td><td>"How much CPU/memory right now?" — for <code>kubectl top</code>, HPA, VPA. <em>Not</em> for Prometheus or history.</td><td><code>metrics.k8s.io</code> API</td></tr>
<tr><td><strong>cAdvisor</strong></td><td>Built into the kubelet (<code>/metrics/cadvisor</code>)</td><td>Per-container usage: CPU, memory, throttling, network, fs</td><td><code>container_cpu_usage_seconds_total</code>, <code>container_memory_working_set_bytes</code>, <code>container_cpu_cfs_throttled_periods_total</code></td></tr>
<tr><td><strong>kube-state-metrics</strong></td><td>Deployment; watches the API server</td><td>Object <em>state</em>: desired vs available replicas, pod phase, restarts, waiting reasons, requests/limits, node conditions</td><td><code>kube_pod_container_status_restarts_total</code>, <code>kube_deployment_status_replicas_available</code>, <code>kube_pod_container_resource_requests</code>, <code>kube_node_status_condition</code></td></tr>
<tr><td><strong>node-exporter</strong></td><td>DaemonSet with host access</td><td>The machine: CPU, load, memory, filesystems, disk IO, network errors</td><td><code>node_filesystem_avail_bytes</code>, <code>node_memory_MemAvailable_bytes</code>, <code>node_disk_io_time_seconds_total</code></td></tr>
</table>
<p>The power is in <strong>joining</strong> them: usage (cAdvisor) divided by requests (kube-state-metrics) gives rightsizing; working set vs limit predicts OOMKills before they happen:</p>
<pre># containers above 90% of their memory limit
max by (namespace, pod, container) (container_memory_working_set_bytes{container!=""})
  / on (namespace, pod, container)
max by (namespace, pod, container) (kube_pod_container_resource_limits{resource="memory"})
  &gt; 0.9</pre>
<blockquote>💡 Real world: <code>working_set_bytes</code>, not <code>usage_bytes</code>, is what the OOM killer and the kubelet's eviction logic care about — <code>usage</code> includes reclaimable page cache and makes every Java app look like it's about to die.</blockquote>`,
        he: `<table>
<tr><th>מקור</th><th>רץ בתור</th><th>עונה על</th><th>מטריקות לדוגמה</th></tr>
<tr><td><strong>metrics-server</strong></td><td>Deployment; אוסף מ-<code>/metrics/resource</code> של ה-kubelet כל ~15 שניות, ושומר רק את הנקודה האחרונה בזיכרון</td><td>"כמה CPU/זיכרון עכשיו?" – בשביל <code>kubectl top</code>, HPA, VPA. <em>לא</em> בשביל Prometheus או היסטוריה.</td><td>ה-API <code>metrics.k8s.io</code></td></tr>
<tr><td><strong>cAdvisor</strong></td><td>מובנה ב-kubelet (<code>/metrics/cadvisor</code>)</td><td>צריכה לכל קונטיינר: CPU, זיכרון, throttling, רשת, fs</td><td><code>container_cpu_usage_seconds_total</code>, <code>container_memory_working_set_bytes</code>, <code>container_cpu_cfs_throttled_periods_total</code></td></tr>
<tr><td><strong>kube-state-metrics</strong></td><td>Deployment; עושה watch על ה-API server</td><td>ה-<em>state</em> של האובייקטים: replicas רצויים מול זמינים, phase של pods, restarts, סיבות waiting, requests/limits, conditions של nodes</td><td><code>kube_pod_container_status_restarts_total</code>, <code>kube_deployment_status_replicas_available</code>, <code>kube_pod_container_resource_requests</code>, <code>kube_node_status_condition</code></td></tr>
<tr><td><strong>node-exporter</strong></td><td>DaemonSet עם גישה ל-host</td><td>המכונה: CPU, load, זיכרון, filesystems, IO של דיסק, שגיאות רשת</td><td><code>node_filesystem_avail_bytes</code>, <code>node_memory_MemAvailable_bytes</code>, <code>node_disk_io_time_seconds_total</code></td></tr>
</table>
<p>הכוח הוא ב<strong>חיבור</strong> ביניהם: צריכה (cAdvisor) חלקי requests (kube-state-metrics) נותן rightsizing; working set מול limit חוזה OOMKills לפני שהם קורים:</p>
<pre># containers above 90% of their memory limit
max by (namespace, pod, container) (container_memory_working_set_bytes{container!=""})
  / on (namespace, pod, container)
max by (namespace, pod, container) (kube_pod_container_resource_limits{resource="memory"})
  &gt; 0.9</pre>
<blockquote>💡 מהשטח: <code>working_set_bytes</code>, ולא <code>usage_bytes</code>, זה מה שמעניין את ה-OOM killer ואת לוגיקת ה-eviction של ה-kubelet – <code>usage</code> כולל page cache שאפשר לפנות, וגורם לכל אפליקציית Java להיראות כאילו היא עומדת למות.</blockquote>`
      }
    },
    {
      h: { en: "kube-prometheus-stack: the standard bundle", he: "kube-prometheus-stack: החבילה הסטנדרטית" },
      body: {
        en: `<p>One Helm chart installs the Prometheus Operator, Prometheus, Alertmanager, Grafana, kube-state-metrics, node-exporter, ServiceMonitors for the kubelet/cAdvisor/API server/CoreDNS, and ~150 alert rules and ~30 dashboards from the <em>kubernetes-mixin</em>.</p>
<pre>helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kps prometheus-community/kube-prometheus-stack \\
  -n monitoring --create-namespace -f kps-values.yaml

# kps-values.yaml (the parts people get wrong)
prometheus:
  prometheusSpec:
    retention: 15d
    retentionSize: 45GB
    storageSpec:
      volumeClaimTemplate:
        spec: { storageClassName: gp3, resources: { requests: { storage: 50Gi } } }
    serviceMonitorSelectorNilUsesHelmValues: false   # pick up ALL ServiceMonitors, not only release=kps
    ruleSelectorNilUsesHelmValues: false
    remoteWrite:
    - url: https://mimir.example.com/api/v1/push      # long-term storage (Mimir/Thanos/AMP/managed)
    resources: { requests: { cpu: "1", memory: 6Gi }, limits: { memory: 8Gi } }</pre>
<p>Apps expose <code>/metrics</code> and you add a <code>ServiceMonitor</code> next to their Service; the operator turns it into scrape config. If a target is missing, check in order: does the ServiceMonitor's selector match the Service labels, does the port <em>name</em> match, is the ServiceMonitor selected by Prometheus (<code>kubectl get prometheus -n monitoring -o yaml | grep -A3 serviceMonitorSelector</code>), and finally the Prometheus UI → Status → Targets for the scrape error.</p>
<blockquote>⚠️ Production tip: Prometheus memory grows with <strong>active series</strong>, not with traffic. One label with user IDs or full URLs can add millions of series and OOMKill Prometheus. Watch <code>prometheus_tsdb_head_series</code> and use <code>topk(10, count by (__name__) ({__name__=~".+"}))</code> to find the offender.</blockquote>`,
        he: `<p>Helm chart אחד מתקין את Prometheus Operator, Prometheus, Alertmanager, Grafana, kube-state-metrics, node-exporter, ServiceMonitors ל-kubelet/cAdvisor/API server/CoreDNS, וכ-150 alert rules וכ-30 dashboards מתוך ה-<em>kubernetes-mixin</em>.</p>
<pre>helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kps prometheus-community/kube-prometheus-stack \\
  -n monitoring --create-namespace -f kps-values.yaml

# kps-values.yaml (the parts people get wrong)
prometheus:
  prometheusSpec:
    retention: 15d
    retentionSize: 45GB
    storageSpec:
      volumeClaimTemplate:
        spec: { storageClassName: gp3, resources: { requests: { storage: 50Gi } } }
    serviceMonitorSelectorNilUsesHelmValues: false   # pick up ALL ServiceMonitors, not only release=kps
    ruleSelectorNilUsesHelmValues: false
    remoteWrite:
    - url: https://mimir.example.com/api/v1/push      # long-term storage (Mimir/Thanos/AMP/managed)
    resources: { requests: { cpu: "1", memory: 6Gi }, limits: { memory: 8Gi } }</pre>
<p>אפליקציות חושפות <code>/metrics</code>, ומוסיפים <code>ServiceMonitor</code> ליד ה-Service שלהן; ה-operator הופך אותו ל-scrape config. אם target חסר, בודקים לפי הסדר: ה-selector של ה-ServiceMonitor תואם ל-labels של ה-Service? ה-<em>שם</em> של הפורט תואם? Prometheus בכלל בוחר את ה-ServiceMonitor (<code>kubectl get prometheus -n monitoring -o yaml | grep -A3 serviceMonitorSelector</code>)? ולבסוף ב-UI של Prometheus → Status → Targets רואים את שגיאת ה-scrape.</p>
<blockquote>⚠️ טיפ לפרודקשן: הזיכרון של Prometheus גדל לפי מספר ה-<strong>active series</strong>, לא לפי התעבורה. Label אחד עם user IDs או URLs מלאים יכול להוסיף מיליוני series ולגרום ל-OOMKill של Prometheus. עוקבים אחרי <code>prometheus_tsdb_head_series</code> ומשתמשים ב-<code>topk(10, count by (__name__) ({__name__=~".+"}))</code> כדי למצוא את האשם.</blockquote>`
      }
    },
    {
      h: { en: "The must-have alerts (with PromQL)", he: "ההתראות שחייבים (עם PromQL)" },
      body: {
        en: `<p>Of the ~150 bundled rules, these are the ones that should reach a human. Each has a <code>for:</code> so blips don't page:</p>
<pre>- alert: KubePodCrashLooping            # kube-state-metrics
  expr: max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"}[5m]) &gt;= 1
  for: 15m
- alert: KubeNodeNotReady
  expr: kube_node_status_condition{condition="Ready",status="true"} == 0
  for: 15m
- alert: KubeDeploymentReplicasMismatch
  expr: kube_deployment_spec_replicas != kube_deployment_status_replicas_available
  for: 15m
- alert: CPUThrottlingHigh               # cAdvisor; usually a ticket, not a page
  expr: |
    sum by (namespace, pod, container) (increase(container_cpu_cfs_throttled_periods_total{container!=""}[5m]))
      / sum by (namespace, pod, container) (increase(container_cpu_cfs_periods_total[5m])) &gt; 0.25
  for: 15m
- alert: KubePersistentVolumeFillingUp   # kubelet volume stats
  expr: |
    kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes &lt; 0.15
    and predict_linear(kubelet_volume_stats_available_bytes[6h], 4 * 24 * 3600) &lt; 0
  for: 1h
- alert: ContainerOOMKilled              # custom: the mixin doesn't ship this one
  expr: |
    increase(kube_pod_container_status_restarts_total[10m]) &gt; 0
    and on (namespace, pod, container)
    kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1
- alert: NodeFilesystemAlmostOutOfSpace  # node-exporter
  expr: node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes &lt; 0.10
  for: 30m</pre>
<p>Also keep: <strong>KubeHpaMaxedOut</strong> (autoscaling can't help anymore), <strong>KubeJobFailed</strong>, <strong>KubeAPIErrorBudgetBurn</strong> and etcd alerts (control plane health), <strong>TargetDown</strong> (you're blind somewhere) and <strong>Watchdog</strong> — an always-firing alert routed to a dead-man's-switch service, so you learn when <em>alerting itself</em> is broken.</p>
<blockquote>💡 Real world: page on <em>symptoms users feel</em> (SLO burn rate, 5xx at the ingress), ticket on <em>causes</em> (throttling, a single CrashLooping pod in a 10-replica Deployment). A team that pages on every KubePodCrashLooping in dev namespaces will learn to ignore the pager.</blockquote>`,
        he: `<p>מתוך כ-150 החוקים שמגיעים בחבילה, אלה שצריכים להגיע לבן אדם. לכל אחד יש <code>for:</code> כדי שקפיצות רגעיות לא יקפיצו:</p>
<pre>- alert: KubePodCrashLooping            # kube-state-metrics
  expr: max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"}[5m]) &gt;= 1
  for: 15m
- alert: KubeNodeNotReady
  expr: kube_node_status_condition{condition="Ready",status="true"} == 0
  for: 15m
- alert: KubeDeploymentReplicasMismatch
  expr: kube_deployment_spec_replicas != kube_deployment_status_replicas_available
  for: 15m
- alert: CPUThrottlingHigh               # cAdvisor; usually a ticket, not a page
  expr: |
    sum by (namespace, pod, container) (increase(container_cpu_cfs_throttled_periods_total{container!=""}[5m]))
      / sum by (namespace, pod, container) (increase(container_cpu_cfs_periods_total[5m])) &gt; 0.25
  for: 15m
- alert: KubePersistentVolumeFillingUp   # kubelet volume stats
  expr: |
    kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes &lt; 0.15
    and predict_linear(kubelet_volume_stats_available_bytes[6h], 4 * 24 * 3600) &lt; 0
  for: 1h
- alert: ContainerOOMKilled              # custom: the mixin doesn't ship this one
  expr: |
    increase(kube_pod_container_status_restarts_total[10m]) &gt; 0
    and on (namespace, pod, container)
    kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1
- alert: NodeFilesystemAlmostOutOfSpace  # node-exporter
  expr: node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes &lt; 0.10
  for: 30m</pre>
<p>שומרים גם: <strong>KubeHpaMaxedOut</strong> (ה-autoscaling כבר לא יכול לעזור), <strong>KubeJobFailed</strong>, <strong>KubeAPIErrorBudgetBurn</strong> והתראות etcd (בריאות ה-control plane), <strong>TargetDown</strong> (אתה עיוור איפשהו) ו-<strong>Watchdog</strong> – התראה שתמיד פועלת ומנותבת לשירות dead-man's-switch, כדי לדעת מתי <em>מערכת ההתראות עצמה</em> שבורה.</p>
<blockquote>💡 מהשטח: מקפיצים על <em>סימפטומים שהמשתמשים מרגישים</em> (burn rate של SLO, 5xx ב-ingress), ופותחים טיקט על <em>סיבות</em> (throttling, pod אחד ב-CrashLoop ב-Deployment של 10 replicas). צוות שמוקפץ על כל KubePodCrashLooping ב-namespaces של dev ילמד להתעלם מה-pager.</blockquote>`
      }
    },
    {
      h: { en: "Logs: Fluent Bit → Loki or Elastic", he: "לוגים: Fluent Bit → Loki או Elastic" },
      body: {
        en: `<p>Containers write to stdout/stderr; the runtime stores it under <code>/var/log/pods/…</code> (symlinked from <code>/var/log/containers/*.log</code>) and the kubelet rotates it (<code>containerLogMaxSize</code> 10Mi × <code>containerLogMaxFiles</code> 5 by default). A DaemonSet agent tails those files, enriches each line with pod metadata and ships it:</p>
<pre>[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    multiline.parser  cri
    Tag               kube.*
    Mem_Buf_Limit     50MB
    Skip_Long_Lines   On
[FILTER]
    Name                kubernetes
    Match               kube.*
    Merge_Log           On          # parse JSON app logs into fields
    K8S-Logging.Exclude On          # honor fluentbit.io/exclude: "true" annotation
[OUTPUT]
    Name    loki
    Match   kube.*
    Host    loki-gateway.logging.svc
    Labels  job=fluent-bit, namespace=$kubernetes['namespace_name'], app=$kubernetes['labels']['app']</pre>
<ul>
<li><strong>Loki</strong> indexes only labels and greps the content — cheap storage on S3/GCS. Keep labels low-cardinality (namespace, app, level) and <em>never</em> pod name or request ID as a label. Query: <code>sum by (app) (count_over_time({namespace="shop"} |= "ERROR" [5m]))</code>.</li>
<li><strong>Elasticsearch/OpenSearch</strong> indexes every field — powerful search, but 3-10× the storage and operational weight.</li>
</ul>
<blockquote>💡 Real world: Grafana's Promtail reached end-of-life in 2026 — new setups use Fluent Bit, the OpenTelemetry Collector or Grafana Alloy. And only stdout is collected: an app writing to <code>/app/logs/debug.log</code> inside the container is invisible to the pipeline <em>and</em> fills the node's disk.</blockquote>`,
        he: `<p>קונטיינרים כותבים ל-stdout/stderr; ה-runtime שומר את זה תחת <code>/var/log/pods/…</code> (עם symlinks מ-<code>/var/log/containers/*.log</code>) וה-kubelet עושה rotation (<code>containerLogMaxSize</code> 10Mi × <code>containerLogMaxFiles</code> 5 כברירת מחדל). Agent שרץ כ-DaemonSet עושה tail לקבצים, מעשיר כל שורה ב-metadata של ה-pod ושולח:</p>
<pre>[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    multiline.parser  cri
    Tag               kube.*
    Mem_Buf_Limit     50MB
    Skip_Long_Lines   On
[FILTER]
    Name                kubernetes
    Match               kube.*
    Merge_Log           On          # parse JSON app logs into fields
    K8S-Logging.Exclude On          # honor fluentbit.io/exclude: "true" annotation
[OUTPUT]
    Name    loki
    Match   kube.*
    Host    loki-gateway.logging.svc
    Labels  job=fluent-bit, namespace=$kubernetes['namespace_name'], app=$kubernetes['labels']['app']</pre>
<ul>
<li><strong>Loki</strong> עושה אינדקס רק ל-labels ועושה grep על התוכן – אחסון זול על S3/GCS. שומרים labels עם cardinality נמוך (namespace, app, level) ו<em>אף פעם</em> לא שם pod או request ID כ-label. שאילתה: <code>sum by (app) (count_over_time({namespace="shop"} |= "ERROR" [5m]))</code>.</li>
<li><strong>Elasticsearch/OpenSearch</strong> עושה אינדקס לכל שדה – חיפוש חזק, אבל פי 3-10 אחסון ומשקל תפעולי.</li>
</ul>
<blockquote>💡 מהשטח: Promtail של Grafana הגיע ל-end-of-life ב-2026 – התקנות חדשות משתמשות ב-Fluent Bit, ב-OpenTelemetry Collector או ב-Grafana Alloy. ורק stdout נאסף: אפליקציה שכותבת ל-<code>/app/logs/debug.log</code> בתוך הקונטיינר בלתי נראית ל-pipeline <em>וגם</em> ממלאת את הדיסק של ה-node.</blockquote>`
      }
    },
    {
      h: { en: "Events exporter and the dashboards to have", he: "Events exporter וה-dashboards שחייבים" },
      body: {
        en: `<p>Kubernetes events (<code>FailedScheduling</code>, <code>BackOff</code>, <code>Evicted</code>, <code>FailedMount</code>, <code>Killing</code>) are the best causal record you have — and the API server deletes them after one hour. Ship them like logs:</p>
<ul>
<li><strong>kubernetes-event-exporter</strong> — watches events and routes them (by namespace, reason, type) to Loki/Elastic/Slack/webhooks.</li>
<li><strong>OpenTelemetry Collector</strong> with the <code>k8sobjects</code> receiver (watch mode on <code>events</code>) — same idea if you already run OTel.</li>
</ul>
<p>Then a post-mortem can answer "what happened at 02:14?" with <code>{job="k8s-events"} |= "Evicted" | json | involvedObject_namespace="shop"</code>.</p>
<p><strong>Dashboards worth having</strong> (most ship with kube-prometheus-stack):</p>
<ol>
<li><strong>Cluster capacity</strong>: requests vs allocatable per node pool — scheduling headroom (CPU <em>usage</em> can be 20% while requests are 95% and pods go Pending).</li>
<li><strong>Namespace / workload compute</strong>: usage vs requests vs limits per pod — rightsizing and noisy neighbours.</li>
<li><strong>Node exporter</strong>: disk, memory, network errors per node.</li>
<li><strong>Edge RED</strong>: ingress/gateway rate, errors (by 5xx code), latency p50/p99 per host.</li>
<li><strong>Control plane</strong>: API server request latency & errors, etcd DB size and leader changes, CoreDNS latency and SERVFAILs.</li>
<li><strong>Storage</strong>: PVC usage and growth; <strong>Cost</strong>: OpenCost/Kubecost per namespace.</li>
</ol>
<blockquote>⚠️ Production tip: your monitoring stack lives in the cluster it monitors. If the cluster dies, so do its alerts. Run the Watchdog to an external dead-man's switch and keep at least black-box probes (synthetic checks) outside the cluster.</blockquote>`,
        he: `<p>Events של Kubernetes (<code>FailedScheduling</code>, <code>BackOff</code>, <code>Evicted</code>, <code>FailedMount</code>, <code>Killing</code>) הם התיעוד הסיבתי הכי טוב שיש לך – וה-API server מוחק אותם אחרי שעה. שולחים אותם כמו לוגים:</p>
<ul>
<li><strong>kubernetes-event-exporter</strong> – עושה watch על events ומנתב אותם (לפי namespace, reason, type) ל-Loki/Elastic/Slack/webhooks.</li>
<li><strong>OpenTelemetry Collector</strong> עם ה-receiver <code>k8sobjects</code> (מצב watch על <code>events</code>) – אותו רעיון אם כבר מריצים OTel.</li>
</ul>
<p>ואז ב-post-mortem אפשר לענות על "מה קרה ב-02:14?" עם <code>{job="k8s-events"} |= "Evicted" | json | involvedObject_namespace="shop"</code>.</p>
<p><strong>Dashboards ששווה שיהיו</strong> (רובם מגיעים עם kube-prometheus-stack):</p>
<ol>
<li><strong>קיבולת ה-cluster</strong>: requests מול allocatable לכל node pool – מרווח ל-scheduling (ה-<em>usage</em> של CPU יכול להיות 20% בזמן שה-requests ב-95% ו-pods נתקעים ב-Pending).</li>
<li><strong>Compute לפי namespace / workload</strong>: usage מול requests מול limits לכל pod – rightsizing ו-noisy neighbours.</li>
<li><strong>Node exporter</strong>: דיסק, זיכרון, שגיאות רשת לכל node.</li>
<li><strong>RED בקצה</strong>: rate, errors (לפי קוד 5xx), latency p50/p99 לכל host ב-ingress/gateway.</li>
<li><strong>Control plane</strong>: latency ושגיאות של ה-API server, גודל DB של etcd והחלפות leader, latency ו-SERVFAILs של CoreDNS.</li>
<li><strong>Storage</strong>: שימוש וגדילה של PVCs; <strong>עלות</strong>: OpenCost/Kubecost לכל namespace.</li>
</ol>
<blockquote>⚠️ טיפ לפרודקשן: ה-monitoring stack שלך חי בתוך ה-cluster שהוא מנטר. אם ה-cluster מת – גם ההתראות שלו. שולחים את ה-Watchdog ל-dead-man's switch חיצוני ומחזיקים לפחות black-box probes (בדיקות סינתטיות) מחוץ ל-cluster.</blockquote>`
      }
    }
  ],
  diagram: `   node ───────────────────────────────────────────────┐
   │ kubelet ─ /metrics/cadvisor (per-container usage)  │
   │         ─ /metrics/resource ──► metrics-server ──► kubectl top, HPA (now only)
   │ node-exporter (DaemonSet: disk, mem, net)          │
   │ /var/log/containers/*.log ─► Fluent Bit ─► Loki / Elastic
   └────────────────────────────────────────────────────┘
   API server ─► kube-state-metrics (desired vs actual state)
              ─► event exporter ─► Loki (events survive > 1h)
                         │ scrape (ServiceMonitor / PodMonitor)
                         ▼
               Prometheus ── rules ──► Alertmanager ──► PagerDuty / Slack
                   │  remote_write        Watchdog ──► external dead-man's switch
                   ▼
               Mimir / Thanos / managed  ◄── Grafana dashboards`,
  handsOn: [
    { cmd: "kubectl top pods -A --sort-by=memory | head -15 && kubectl top nodes",
      what: { en: "Live usage via metrics-server — the quickest 'who is eating the node?' check.", he: "צריכה חיה דרך metrics-server – הבדיקה הכי מהירה של 'מי אוכל את ה-node?'." } },
    { cmd: "kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/shop/pods | jq '.items[] | {pod: .metadata.name, usage: [.containers[].usage]}'",
      what: { en: "Query the resource metrics API directly — if this fails, HPA and kubectl top fail too.", he: "שאילתה ישירה ל-resource metrics API – אם זה נכשל, גם HPA ו-kubectl top נכשלים." } },
    { cmd: "helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring --create-namespace --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false",
      what: { en: "Install the standard monitoring bundle, configured to pick up every ServiceMonitor in the cluster.", he: "מתקינים את חבילת ה-monitoring הסטנדרטית, כך שתאסוף כל ServiceMonitor ב-cluster." } },
    { cmd: "kubectl port-forward -n monitoring svc/kps-kube-prometheus-stack-prometheus 9090 & sleep 2; curl -s 'localhost:9090/api/v1/alerts' | jq '.data.alerts[] | select(.state==\"firing\") | .labels.alertname' | sort | uniq -c",
      what: { en: "Which alerts are firing right now, counted by name. Stop the port-forward afterwards (<code>kill %1</code>).", he: "אילו התראות פועלות עכשיו, לפי שם. אחר כך עוצרים את ה-port-forward (<code>kill %1</code>)." } },
    { cmd: "curl -s localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | select(.health!=\"up\") | \"\\(.labels.job) \\(.lastError)\"'",
      what: { en: "Scrape targets that are down and why — run with the port-forward from the previous step.", he: "Scrape targets שלמטה ולמה – מריצים עם ה-port-forward מהצעד הקודם." } },
    { cmd: "kubectl get servicemonitors,podmonitors,prometheusrules -A",
      what: { en: "Inventory of everything the Prometheus Operator turns into scrape configs and alert rules.", he: "מצאי של כל מה ש-Prometheus Operator הופך ל-scrape configs ול-alert rules." } },
    { cmd: "kubectl logs -n logging ds/fluent-bit --since=10m | grep -iE 'error|retry|backpressure|paused'",
      what: { en: "Is the log pipeline healthy? Retries and paused inputs mean you're losing or delaying logs.", he: "ה-pipeline של הלוגים בריא? retries ו-inputs מושהים אומרים שאתה מאבד או מעכב לוגים." } },
    { cmd: "kubectl get events -A --field-selector type=Warning -o custom-columns=TIME:.lastTimestamp,NS:.metadata.namespace,REASON:.reason,OBJ:.involvedObject.name,MSG:.message --sort-by=.lastTimestamp | tail -20",
      what: { en: "The last hour of warnings in a compact table — what an events exporter preserves for later.", he: "השעה האחרונה של אזהרות בטבלה מקוצרת – בדיוק מה ש-events exporter שומר לאחר כך." } }
  ],
  mnemonic: {
    en: "<strong>\"Now, State, Box, Box-inside\"</strong>: metrics-server = <em>now</em>, kube-state-metrics = <em>state</em>, node-exporter = the <em>box</em>, cAdvisor = the containers <em>inside</em> the box.",
    he: "<strong>\"עכשיו, מצב, קופסה, מה שבתוכה\"</strong>: metrics-server = <em>עכשיו</em>, kube-state-metrics = <em>מצב</em> האובייקטים, node-exporter = ה<em>קופסה</em>, cAdvisor = הקונטיינרים <em>בתוך</em> הקופסה."
  },
  pitfalls: [
    { en: "Using metrics-server as a monitoring system. It keeps one data point in memory — no history, no alerting; it exists for HPA and kubectl top.",
      he: "להשתמש ב-metrics-server כמערכת ניטור. הוא שומר נקודת מידע אחת בזיכרון – אין היסטוריה, אין התראות; הוא קיים בשביל HPA ו-kubectl top." },
    { en: "High-cardinality labels (user_id, full URL path, pod name in Loki) that explode series/streams and OOMKill Prometheus or make Loki slow and expensive.",
      he: "Labels עם cardinality גבוה (user_id, path מלא של URL, שם pod ב-Loki) שמפוצצים את מספר ה-series/streams וגורמים ל-OOMKill של Prometheus או הופכים את Loki לאיטי ויקר." },
    { en: "Paging on every bundled alert. CPUThrottlingHigh and single-pod CrashLooping in dev wake people up for nothing; route by severity and namespace.",
      he: "להקפיץ על כל התראה מהחבילה. CPUThrottlingHigh ו-CrashLooping של pod בודד ב-dev מעירים אנשים סתם; מנתבים לפי severity ו-namespace." },
    { en: "No Watchdog / dead-man's switch. When Prometheus or Alertmanager is down, the silence looks exactly like a healthy system.",
      he: "בלי Watchdog / dead-man's switch. כש-Prometheus או Alertmanager למטה, השקט נראה בדיוק כמו מערכת בריאה." }
  ],
  interview: [
    { q: { en: "What's the difference between metrics-server and kube-state-metrics?", he: "מה ההבדל בין metrics-server ל-kube-state-metrics?" },
      a: { en: "metrics-server collects current CPU/memory <em>usage</em> from kubelets and serves it via the metrics.k8s.io API for HPA and kubectl top — no history. kube-state-metrics watches the API server and exposes object <em>state</em> as Prometheus metrics: replicas desired vs available, pod phases, restart counts, waiting reasons, configured requests/limits. One measures consumption, the other describes what Kubernetes thinks should be and is.",
           he: "metrics-server אוסף את ה-<em>usage</em> הנוכחי של CPU/זיכרון מה-kubelets ומגיש אותו דרך ה-API metrics.k8s.io ל-HPA ול-kubectl top – בלי היסטוריה. kube-state-metrics עושה watch על ה-API server וחושף את ה-<em>state</em> של אובייקטים כמטריקות Prometheus: replicas רצויים מול זמינים, phases של pods, ספירת restarts, סיבות waiting, requests/limits שהוגדרו. אחד מודד צריכה, השני מתאר מה Kubernetes חושב שצריך להיות ומה יש." } },
    { q: { en: "Pods are Pending but node CPU usage dashboards show 25%. Explain.", he: "Pods ב-Pending אבל ה-dashboards מראים 25% שימוש ב-CPU ב-nodes. תסביר." },
      a: { en: "The scheduler places pods by <em>requests</em>, not actual usage. If requests sum to ~100% of allocatable, nothing new fits even though the CPUs are mostly idle. I'd compare <code>sum(kube_pod_container_resource_requests{resource=\"cpu\"})</code> to <code>sum(kube_node_status_allocatable{resource=\"cpu\"})</code> per node pool, then rightsize over-requested workloads using usage percentiles, and let the autoscaler add nodes meanwhile.",
           he: "ה-scheduler משבץ pods לפי <em>requests</em>, לא לפי צריכה בפועל. אם סכום ה-requests קרוב ל-100% מה-allocatable, שום דבר חדש לא נכנס למרות שה-CPUs רוב הזמן פנויים. משווים <code>sum(kube_pod_container_resource_requests{resource=\"cpu\"})</code> ל-<code>sum(kube_node_status_allocatable{resource=\"cpu\"})</code> לכל node pool, ואז עושים rightsizing ל-workloads עם requests מנופחים לפי אחוזוני צריכה, ובינתיים נותנים ל-autoscaler להוסיף nodes." } },
    { q: { en: "Which Kubernetes alerts would you page on, and which would be tickets?", he: "על אילו התראות Kubernetes היית מקפיץ, ואילו היו טיקטים?" },
      a: { en: "Page: user-facing SLO burn rate and edge 5xx, KubeNodeNotReady when capacity is at risk, PV filling up within hours, KubeAPIErrorBudgetBurn/etcd no leader, Watchdog missing. Tickets: CPUThrottlingHigh, single-pod CrashLooping in a healthy Deployment, HPA maxed out briefly, certificate expiring in 14+ days. The rule: page when a human must act now to protect users.",
           he: "להקפיץ: burn rate של SLO שמשתמשים מרגישים ו-5xx בקצה, KubeNodeNotReady כשהקיבולת בסיכון, PV שמתמלא תוך שעות, KubeAPIErrorBudgetBurn/etcd בלי leader, Watchdog שחסר. טיקטים: CPUThrottlingHigh, pod בודד ב-CrashLoop ב-Deployment בריא, HPA שהגיע למקסימום לזמן קצר, תעודה שפגה בעוד 14+ ימים. הכלל: מקפיצים כשבן אדם חייב לפעול עכשיו כדי להגן על המשתמשים." } }
  ],
  quiz: [
    { q: { en: "Which component provides the data behind <code>kubectl top</code> and the HPA's CPU utilization?", he: "איזה רכיב מספק את הנתונים מאחורי <code>kubectl top</code> וה-CPU utilization של ה-HPA?" },
      options: [
        { en: "kube-state-metrics", he: "kube-state-metrics" },
        { en: "node-exporter", he: "node-exporter" },
        { en: "metrics-server (resource metrics API)", he: "metrics-server (ה-resource metrics API)" },
        { en: "Fluent Bit", he: "Fluent Bit" }
      ], answer: 2,
      explain: { en: "HPA's resource metrics come from <code>metrics.k8s.io</code>, served by metrics-server. kube-state-metrics describes object state, node-exporter the host.", he: "ה-resource metrics של HPA מגיעים מ-<code>metrics.k8s.io</code>, שמוגש ע״י metrics-server. kube-state-metrics מתאר state של אובייקטים, node-exporter את ה-host." } },
    { q: { en: "Which memory metric best predicts an OOMKill?", he: "איזו מטריקת זיכרון הכי טוב חוזה OOMKill?" },
      options: [
        { en: "<code>container_memory_usage_bytes</code>", he: "<code>container_memory_usage_bytes</code>" },
        { en: "<code>container_memory_working_set_bytes</code> compared to the memory limit", he: "<code>container_memory_working_set_bytes</code> ביחס ל-memory limit" },
        { en: "<code>node_memory_MemFree_bytes</code>", he: "<code>node_memory_MemFree_bytes</code>" },
        { en: "<code>kube_pod_container_resource_requests</code>", he: "<code>kube_pod_container_resource_requests</code>" }
      ], answer: 1,
      explain: { en: "Working set excludes reclaimable cache and is what the kernel cgroup limit and kubelet eviction effectively act on.", he: "Working set לא כולל cache שאפשר לפנות, וזה מה שה-limit של ה-cgroup וה-eviction של ה-kubelet פועלים לפיו בפועל." } },
    { q: { en: "You created a ServiceMonitor but Prometheus (kube-prometheus-stack) never scrapes it. A very common cause?", he: "יצרת ServiceMonitor אבל Prometheus (של kube-prometheus-stack) אף פעם לא אוסף אותו. סיבה נפוצה מאוד?" },
      options: [
        { en: "The app must expose metrics on port 9090", he: "האפליקציה חייבת לחשוף מטריקות בפורט 9090" },
        { en: "Prometheus only selects ServiceMonitors labeled with the Helm release, unless <code>serviceMonitorSelectorNilUsesHelmValues: false</code>", he: "Prometheus בוחר רק ServiceMonitors עם label של ה-Helm release, אלא אם <code>serviceMonitorSelectorNilUsesHelmValues: false</code>" },
        { en: "ServiceMonitors only work in the monitoring namespace", he: "ServiceMonitors עובדים רק ב-namespace של monitoring" },
        { en: "metrics-server must be restarted", he: "צריך לעשות restart ל-metrics-server" }
      ], answer: 1,
      explain: { en: "By default the chart's Prometheus selects <code>release: kps</code>. Either add that label or disable the Helm-values selector. Also check the port name and the Service selector.", he: "כברירת מחדל ה-Prometheus של ה-chart בוחר <code>release: kps</code>. או שמוסיפים את ה-label או שמבטלים את ה-selector של ה-Helm values. בודקים גם את שם הפורט ואת ה-selector של ה-Service." } },
    { q: { en: "Why run a Kubernetes events exporter?", he: "למה להריץ events exporter של Kubernetes?" },
      options: [
        { en: "Events are needed for the scheduler to work", he: "ה-scheduler צריך events כדי לעבוד" },
        { en: "The API server keeps events only ~1 hour; exporting them preserves the causal timeline for post-mortems and alerting", he: "ה-API server שומר events רק בערך שעה; הייצוא שומר את ציר הזמן הסיבתי ל-post-mortems ולהתראות" },
        { en: "It replaces kube-state-metrics", he: "הוא מחליף את kube-state-metrics" },
        { en: "It reduces etcd CPU usage", he: "הוא מוריד את צריכת ה-CPU של etcd" }
      ], answer: 1,
      explain: { en: "Default <code>--event-ttl=1h</code>. Without export, the night's FailedScheduling/Evicted/BackOff events are gone by the morning review.", he: "ברירת המחדל <code>--event-ttl=1h</code>. בלי ייצוא, ה-FailedScheduling/Evicted/BackOff של הלילה נעלמים עד התחקיר של הבוקר." } }
  ],
  related: ["obs-metrics", "obs-alerting", "k8s-resources", "k8s-troubleshooting-playbook"]
});

// ---------------------------------------------------------------------------
// 35. Day-2 operations: upgrades, disruption, backups, multi-cluster
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-day2-upgrades",
  track: "kubernetes",
  order: 35,
  icon: "🔧",
  level: 3,
  minutes: 18,
  title: { en: "Day-2 Kubernetes: Upgrades, PDBs, Backups & DR", he: "Kubernetes ביום 2: שדרוגים, PDBs, גיבויים ו-DR" },
  tldr: {
    en: "Kubernetes ships ~3 minors a year and each is supported for ~14 months, so upgrading is a routine: check deprecated APIs → control plane (one minor at a time) → add-ons → nodes via surge or blue/green pools, with PDBs that allow drains, and Velero/etcd backups you've actually restored.",
    he: "Kubernetes מוציא בערך 3 גרסאות minor בשנה, וכל אחת נתמכת כ-14 חודשים, אז שדרוג הוא שגרה: בודקים APIs שהוצאו משימוש → control plane (minor אחד בכל פעם) → add-ons → nodes עם surge או blue/green pools, עם PDBs שמאפשרים drain, וגיבויי Velero/etcd שבאמת שוחזרו פעם."
  },
  analogy: {
    en: "Renovating a hotel while it stays open. You can't close every floor at once: first you upgrade the front office (control plane), then the building systems — elevators, plumbing (add-ons), then floor by floor, moving guests to fresh rooms before you gut the old ones (cordon & drain). The rule that some suites must always stay open (PDB) protects VIP guests — but if it says \"all suites always open\", the renovation stops forever. And before you start, you photograph everything and check you can actually rebuild from the photos (backups + restore drills).",
    he: "שיפוץ מלון שממשיך לפעול. אי אפשר לסגור את כל הקומות בבת אחת: קודם משדרגים את המשרד הראשי (control plane), אחר כך את מערכות הבניין – מעליות, אינסטלציה (add-ons), ואז קומה אחרי קומה, מעבירים אורחים לחדרים חדשים לפני שמפרקים את הישנים (cordon & drain). הכלל שחלק מהסוויטות חייבות תמיד להיות פתוחות (PDB) מגן על אורחי ה-VIP – אבל אם הוא אומר \"כל הסוויטות תמיד פתוחות\", השיפוץ נתקע לנצח. ולפני שמתחילים, מצלמים הכל ובודקים שבאמת אפשר לבנות מחדש מהתמונות (גיבויים + תרגולי שחזור)."
  },
  sections: [
    {
      h: { en: "Managed vs self-managed, and the support clock", he: "מנוהל מול self-managed, והשעון של התמיכה" },
      body: {
        en: `<p>Upstream Kubernetes releases a minor version roughly every 4 months and patches each for about 14 months. You can't "stay on a good version" — you need an upgrade routine.</p>
<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th><th>Self-managed (kubeadm, etc.)</th></tr>
<tr><td>Control plane</td><td>Managed; you click/IaC the upgrade</td><td>Managed; auto-upgrade channels optional</td><td>Managed; release channels (Rapid/Regular/Stable/Extended) auto-upgrade</td><td>You: etcd, certs, API server HA</td></tr>
<tr><td>Support window</td><td>~14 months standard + 12 months <em>extended</em> at ~6× the control-plane price</td><td>N-2 minors; LTS option on Premium tier</td><td>~14 months; Extended channel up to 24</td><td>Whatever you can patch</td></tr>
<tr><td>Nodes</td><td>Managed node groups / Karpenter / Auto Mode</td><td>Node pools with surge</td><td>Node pools: surge or blue-green</td><td>You</td></tr>
</table>
<p>"Managed" means the control plane is someone else's pager. You still own: upgrading <em>add-ons</em> (CNI, CoreDNS, kube-proxy, CSI drivers, ingress, cert-manager, operators), node upgrades, API deprecations in your manifests, PDBs, backups of your workloads and their data.</p>
<blockquote>💡 Real world: falling off the support window is expensive (EKS extended support raises the control plane from $0.10 to $0.60 per hour per cluster) and then forced — providers eventually auto-upgrade you. Teams that upgrade every quarter find it boring; teams that skip a year face a 4-version jump with removed APIs, which is an incident.</blockquote>`,
        he: `<p>Kubernetes upstream משחרר גרסת minor בערך כל 4 חודשים ומספק patches לכל אחת כ-14 חודשים. אי אפשר "להישאר על גרסה טובה" – צריך שגרת שדרוגים.</p>
<table>
<tr><th></th><th>EKS</th><th>AKS</th><th>GKE</th><th>Self-managed (kubeadm וכו')</th></tr>
<tr><td>Control plane</td><td>מנוהל; אתה מפעיל את השדרוג (קליק/IaC)</td><td>מנוהל; ערוצי auto-upgrade אופציונליים</td><td>מנוהל; release channels (Rapid/Regular/Stable/Extended) משדרגים אוטומטית</td><td>עליך: etcd, certs, HA של ה-API server</td></tr>
<tr><td>חלון תמיכה</td><td>~14 חודשים standard + 12 חודשים <em>extended</em> בבערך פי 6 ממחיר ה-control plane</td><td>N-2 minors; אופציית LTS ב-Premium tier</td><td>~14 חודשים; ערוץ Extended עד 24</td><td>כמה שתצליח לעשות patch</td></tr>
<tr><td>Nodes</td><td>Managed node groups / Karpenter / Auto Mode</td><td>Node pools עם surge</td><td>Node pools: surge או blue-green</td><td>עליך</td></tr>
</table>
<p>"מנוהל" אומר שה-control plane הוא ה-pager של מישהו אחר. עליך עדיין: לשדרג <em>add-ons</em> (CNI, CoreDNS, kube-proxy, CSI drivers, ingress, cert-manager, operators), לשדרג nodes, לטפל ב-API deprecations במניפסטים, PDBs, וגיבויים של ה-workloads והמידע שלהם.</p>
<blockquote>💡 מהשטח: ליפול מחלון התמיכה זה יקר (extended support ב-EKS מעלה את ה-control plane מ-$0.10 ל-$0.60 לשעה לכל cluster) ובסוף גם כפוי – הספקים משדרגים אותך אוטומטית. צוותים שמשדרגים כל רבעון מגלים שזה משעמם; צוותים שמדלגים שנה עומדים מול קפיצה של 4 גרסאות עם APIs שהוסרו, וזה אינסידנט.</blockquote>`
      }
    },
    {
      h: { en: "Version skew and the upgrade order", he: "Version skew וסדר השדרוג" },
      body: {
        en: `<p>The <strong>version skew policy</strong> defines which component versions may coexist — it's why the order matters:</p>
<table>
<tr><th>Component</th><th>Allowed relative to kube-apiserver</th></tr>
<tr><td>kube-apiserver (HA members)</td><td>Within 1 minor of each other (only during the upgrade)</td></tr>
<tr><td>controller-manager, scheduler</td><td>Same or 1 minor <em>older</em>, never newer</td></tr>
<tr><td>kubelet, kube-proxy</td><td>Up to 3 minors <em>older</em>, never newer</td></tr>
<tr><td>kubectl</td><td>±1 minor</td></tr>
</table>
<p>So: <strong>control plane first</strong> (nodes may lag, never lead), <strong>one minor at a time</strong> (1.33 → 1.34 → 1.35, no skipping), then <strong>add-ons</strong> to versions compatible with the new minor, then <strong>nodes</strong>.</p>
<pre># 0. pre-flight: deprecated APIs, add-on compatibility matrix, PDB sanity, fresh backup
# 1. control plane (EKS example)
aws eks update-cluster-version --name prod --kubernetes-version 1.34
aws eks wait cluster-active --name prod
# 2. add-ons: CoreDNS, kube-proxy, VPC CNI, EBS CSI (then Helm-managed: ingress, cert-manager, karpenter…)
aws eks describe-addon-versions --kubernetes-version 1.34 --addon-name coredns \\
  --query 'addons[].addonVersions[0].addonVersion'
aws eks update-addon --cluster-name prod --addon-name coredns --addon-version v1.12.2-eksbuild.4
# 3. nodes
aws eks update-nodegroup-version --cluster-name prod --nodegroup-name general   # managed node group
# Karpenter: bump the AMI alias in EC2NodeClass → nodes "drift" and are replaced respecting PDBs</pre>
<blockquote>⚠️ Production tip: rehearse every upgrade on a staging cluster with the same add-ons, and read the release notes' "Urgent upgrade notes" and removed APIs. The control plane can't be downgraded — once it's on 1.34, rollback means building a new cluster.</blockquote>`,
        he: `<p>ה-<strong>version skew policy</strong> מגדיר אילו גרסאות של רכיבים יכולות לחיות ביחד – ובגלל זה הסדר חשוב:</p>
<table>
<tr><th>רכיב</th><th>מותר ביחס ל-kube-apiserver</th></tr>
<tr><td>kube-apiserver (חברי HA)</td><td>עד minor אחד ביניהם (רק בזמן השדרוג)</td></tr>
<tr><td>controller-manager, scheduler</td><td>אותה גרסה או minor אחד <em>ישן</em> יותר, אף פעם לא חדש יותר</td></tr>
<tr><td>kubelet, kube-proxy</td><td>עד 3 minors <em>ישנים</em> יותר, אף פעם לא חדש יותר</td></tr>
<tr><td>kubectl</td><td>±1 minor</td></tr>
</table>
<p>לכן: <strong>control plane קודם</strong> (nodes יכולים לפגר, אף פעם לא להקדים), <strong>minor אחד בכל פעם</strong> (1.33 → 1.34 → 1.35, בלי דילוגים), אחר כך <strong>add-ons</strong> לגרסאות שתואמות ל-minor החדש, ואז <strong>nodes</strong>.</p>
<pre># 0. pre-flight: deprecated APIs, add-on compatibility matrix, PDB sanity, fresh backup
# 1. control plane (EKS example)
aws eks update-cluster-version --name prod --kubernetes-version 1.34
aws eks wait cluster-active --name prod
# 2. add-ons: CoreDNS, kube-proxy, VPC CNI, EBS CSI (then Helm-managed: ingress, cert-manager, karpenter…)
aws eks describe-addon-versions --kubernetes-version 1.34 --addon-name coredns \\
  --query 'addons[].addonVersions[0].addonVersion'
aws eks update-addon --cluster-name prod --addon-name coredns --addon-version v1.12.2-eksbuild.4
# 3. nodes
aws eks update-nodegroup-version --cluster-name prod --nodegroup-name general   # managed node group
# Karpenter: bump the AMI alias in EC2NodeClass → nodes "drift" and are replaced respecting PDBs</pre>
<blockquote>⚠️ טיפ לפרודקשן: עושים חזרה על כל שדרוג ב-cluster של staging עם אותם add-ons, וקוראים ב-release notes את ה-"Urgent upgrade notes" ואת ה-APIs שהוסרו. אי אפשר לעשות downgrade ל-control plane – ברגע שהוא על 1.34, rollback אומר לבנות cluster חדש.</blockquote>`
      }
    },
    {
      h: { en: "Deprecated APIs: find them before the upgrade finds you", he: "APIs שהוצאו משימוש: למצוא אותם לפני שהשדרוג מוצא אותך" },
      body: {
        en: `<p>When an API version is removed (think <code>policy/v1beta1</code> PodDisruptionBudget in 1.25, <code>autoscaling/v2beta2</code> HPA in 1.26, <code>flowcontrol.apiserver.k8s.io/v1beta3</code> in 1.32), the API server stops serving it. Running objects are converted and keep working — but every <em>apply</em> of the old manifest fails, so your next deploy or Argo sync breaks, usually at the worst moment.</p>
<pre>$ pluto detect-helm -A --target-versions k8s=v1.34.0 -o wide
NAME            NAMESPACE  KIND                 VERSION               REPLACEMENT        REMOVED  DEPRECATED
payments/hpa    payments   HorizontalPodAutoscaler autoscaling/v2beta2 autoscaling/v2     true     true

$ pluto detect-files -d ./k8s --target-versions k8s=v1.34.0
$ kubent --target-version 1.34.0          # kube-no-trouble: scans live cluster + Helm releases

# who is still CALLING deprecated APIs (including CI scripts and old controllers)?
$ kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis
apiserver_requested_deprecated_apis{group="flowcontrol.apiserver.k8s.io",removed_release="1.32",resource="prioritylevelconfigurations",version="v1beta3"} 1</pre>
<p>Three places to fix: Git manifests/charts (the source of truth), <strong>Helm release secrets</strong> (the stored manifest of the last release — if it references a removed API, <code>helm upgrade</code> fails; fix with the <code>helm mapkubeapis</code> plugin), and third-party charts (bump to a version that supports the new minor). EKS's <em>upgrade insights</em> and GKE's deprecation insights report the same from audit logs.</p>
<blockquote>💡 Real world: put <code>pluto detect-files</code> in CI against the <em>next</em> Kubernetes version. Deprecations then become a failing PR months in advance instead of a failing deploy on upgrade night.</blockquote>`,
        he: `<p>כש-API version מוסר (למשל PodDisruptionBudget של <code>policy/v1beta1</code> ב-1.25, HPA של <code>autoscaling/v2beta2</code> ב-1.26, <code>flowcontrol.apiserver.k8s.io/v1beta3</code> ב-1.32), ה-API server מפסיק להגיש אותו. אובייקטים שכבר רצים מומרים וממשיכים לעבוד – אבל כל <em>apply</em> של המניפסט הישן נכשל, אז ה-deploy הבא או ה-sync של Argo נשבר, בדרך כלל ברגע הכי גרוע.</p>
<pre>$ pluto detect-helm -A --target-versions k8s=v1.34.0 -o wide
NAME            NAMESPACE  KIND                 VERSION               REPLACEMENT        REMOVED  DEPRECATED
payments/hpa    payments   HorizontalPodAutoscaler autoscaling/v2beta2 autoscaling/v2     true     true

$ pluto detect-files -d ./k8s --target-versions k8s=v1.34.0
$ kubent --target-version 1.34.0          # kube-no-trouble: scans live cluster + Helm releases

# who is still CALLING deprecated APIs (including CI scripts and old controllers)?
$ kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis
apiserver_requested_deprecated_apis{group="flowcontrol.apiserver.k8s.io",removed_release="1.32",resource="prioritylevelconfigurations",version="v1beta3"} 1</pre>
<p>שלושה מקומות לתקן: מניפסטים/charts ב-Git (ה-source of truth), <strong>ה-secrets של Helm releases</strong> (המניפסט השמור של ה-release האחרון – אם הוא מפנה ל-API שהוסר, <code>helm upgrade</code> נכשל; מתקנים עם ה-plugin <code>helm mapkubeapis</code>), ו-charts של צד שלישי (לשדרג לגרסה שתומכת ב-minor החדש). ה-<em>upgrade insights</em> של EKS וה-deprecation insights של GKE מדווחים את אותו דבר מתוך ה-audit logs.</p>
<blockquote>💡 מהשטח: שמים <code>pluto detect-files</code> ב-CI מול גרסת ה-Kubernetes ה<em>באה</em>. ככה deprecations הופכים ל-PR שנכשל חודשים מראש, ולא ל-deploy שנכשל בליל השדרוג.</blockquote>`
      }
    },
    {
      h: { en: "Node upgrades, PDBs and why drains hang", he: "שדרוג nodes, PDBs ולמה drains נתקעים" },
      body: {
        en: `<p>Every node upgrade is: <strong>cordon</strong> (no new pods) → <strong>drain</strong> (evict pods via the Eviction API, which respects PDBs) → replace. Strategies:</p>
<ul>
<li><strong>Surge / rolling</strong> — add N new nodes, drain N old ones, repeat (<code>maxSurge</code>/<code>maxUnavailable</code> on AKS/EKS/GKE). Cheap, gradual.</li>
<li><strong>Blue/green node pools</strong> — create a whole new pool, cordon the old one, drain gradually, keep the old pool for fast rollback during a soak period. GKE supports it natively; elsewhere create a second node group/NodePool.</li>
<li><strong>Karpenter drift</strong> — change the AMI/NodeClass and Karpenter replaces nodes itself, respecting PDBs and disruption budgets.</li>
</ul>
<p>A <strong>PodDisruptionBudget</strong> limits <em>voluntary</em> disruptions. Its classic misconfiguration blocks drains forever:</p>
<pre>$ kubectl get pdb -A
NAMESPACE  NAME          MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS  AGE
payments   payments-api  3              N/A              0                    210d   # replicas: 3 → 0 allowed!
search     search-pdb    N/A            0                0                    90d    # maxUnavailable 0 = never

$ kubectl drain ip-10-0-7-12.eu-west-1.compute.internal --ignore-daemonsets --delete-emptydir-data --timeout=15m
node/ip-10-0-7-12.eu-west-1.compute.internal cordoned
evicting pod payments/payments-api-6f8d9c7b5-k2x9p
error when evicting pods/"payments-api-6f8d9c7b5-k2x9p" -n "payments" (will retry after 5s):
Cannot evict pod as it would violate the pod's disruption budget.</pre>
<p>Fixes: use <code>maxUnavailable: 1</code> (or a percentage) instead of <code>minAvailable</code> = replicas; scale up temporarily so a disruption is allowed; fix the <em>unhealthy</em> pods that eat the budget, and set <code>unhealthyPodEvictionPolicy: AlwaysAllow</code> so already-broken pods can always be evicted. Single-replica apps with a PDB simply can't be drained without downtime — that's the real finding.</p>
<blockquote>⚠️ Production tip: never "solve" a hanging drain with <code>--disable-eviction</code> or force-deleting pods during an upgrade. That bypasses PDBs — exactly the protection that keeps a 3-node quorum (etcd, Kafka, ZooKeeper, Postgres) from losing two members at once.</blockquote>`,
        he: `<p>כל שדרוג node הוא: <strong>cordon</strong> (בלי pods חדשים) → <strong>drain</strong> (evict ל-pods דרך ה-Eviction API, שמכבד PDBs) → החלפה. אסטרטגיות:</p>
<ul>
<li><strong>Surge / rolling</strong> – מוסיפים N nodes חדשים, עושים drain ל-N ישנים, וחוזר חלילה (<code>maxSurge</code>/<code>maxUnavailable</code> ב-AKS/EKS/GKE). זול והדרגתי.</li>
<li><strong>Blue/green node pools</strong> – יוצרים pool חדש שלם, עושים cordon לישן, drain הדרגתי, ומשאירים את ה-pool הישן ל-rollback מהיר בתקופת soak. ב-GKE זה נתמך מובנה; במקומות אחרים יוצרים node group/NodePool שני.</li>
<li><strong>Karpenter drift</strong> – משנים את ה-AMI/NodeClass ו-Karpenter מחליף nodes בעצמו, תוך כיבוד PDBs ו-disruption budgets.</li>
</ul>
<p><strong>PodDisruptionBudget</strong> מגביל שיבושים <em>וולונטריים</em>. הטעות הקלאסית בהגדרה שלו חוסמת drains לנצח:</p>
<pre>$ kubectl get pdb -A
NAMESPACE  NAME          MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS  AGE
payments   payments-api  3              N/A              0                    210d   # replicas: 3 → 0 allowed!
search     search-pdb    N/A            0                0                    90d    # maxUnavailable 0 = never

$ kubectl drain ip-10-0-7-12.eu-west-1.compute.internal --ignore-daemonsets --delete-emptydir-data --timeout=15m
node/ip-10-0-7-12.eu-west-1.compute.internal cordoned
evicting pod payments/payments-api-6f8d9c7b5-k2x9p
error when evicting pods/"payments-api-6f8d9c7b5-k2x9p" -n "payments" (will retry after 5s):
Cannot evict pod as it would violate the pod's disruption budget.</pre>
<p>תיקונים: <code>maxUnavailable: 1</code> (או אחוז) במקום <code>minAvailable</code> ששווה ל-replicas; scale up זמני כדי שיהיה disruption מותר; לתקן את ה-pods ה<em>לא בריאים</em> שאוכלים את התקציב, ולהגדיר <code>unhealthyPodEvictionPolicy: AlwaysAllow</code> כדי ש-pods שכבר שבורים תמיד יוכלו לעבור eviction. אפליקציות עם replica אחד ו-PDB פשוט אי אפשר לעשות להן drain בלי downtime – וזה הממצא האמיתי.</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם לא "פותרים" drain תקוע עם <code>--disable-eviction</code> או force delete ל-pods באמצע שדרוג. זה עוקף PDBs – בדיוק ההגנה ששומרת על quorum של 3 nodes (etcd, Kafka, ZooKeeper, Postgres) מלאבד שני חברים בבת אחת.</blockquote>`
      }
    },
    {
      h: { en: "Backups & DR: Velero and etcd basics", he: "גיבויים ו-DR: Velero ויסודות etcd" },
      body: {
        en: `<p>What to back up: <strong>manifests</strong> (Git already is your backup if <em>everything</em> is GitOps — including CRs and secrets references), <strong>cluster state</strong> not in Git (things created by operators and humans), and <strong>persistent data</strong>. <strong>Velero</strong> handles the last two: it exports API objects to object storage and snapshots volumes (CSI snapshots, or file-level copy via its node agent with Kopia).</p>
<pre>velero schedule create prod-daily --schedule="0 2 * * *" \\
  --include-namespaces shop,orders --snapshot-volumes --ttl 720h
velero backup get
NAME                         STATUS            ERRORS  WARNINGS  CREATED                         EXPIRES
prod-daily-20261112020015    PartiallyFailed   2       0         2026-11-12 02:00:15 +0000 UTC   29d
velero backup describe prod-daily-20261112020015 --details   # → which PVC snapshot failed and why
velero restore create --from-backup prod-daily-20261112020015 \\
  --include-namespaces shop --namespace-mappings shop:shop-restore-test</pre>
<p>Volume snapshots are <em>crash-consistent</em>, not application-consistent. For databases use native backups (pg_basebackup/WAL archiving via CloudNativePG, mysqldump, etc.) or Velero pre/post hooks that freeze writes.</p>
<p><strong>etcd</strong> (self-managed only — on EKS/AKS/GKE the provider backs it up): a snapshot is the whole cluster state.</p>
<pre>ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key snapshot save /backup/etcd-2026-11-12.db
etcdutl snapshot status /backup/etcd-2026-11-12.db -w table
etcdutl snapshot restore /backup/etcd-2026-11-12.db --data-dir /var/lib/etcd-restored</pre>
<p>etcd's default space quota is 2 GiB; when exceeded every write fails with <code>etcdserver: mvcc: database space exceeded</code> — compact, <code>defrag</code>, then <code>alarm disarm</code>. Thousands of stale events, Helm release secrets or huge CRs are the usual cause.</p>
<blockquote>💡 Real world: a backup you've never restored is a hope, not a backup. Schedule a quarterly restore drill into a scratch namespace/cluster and measure the real RTO — the first drill always finds a missing CRD, a StorageClass that doesn't exist in the DR region, or a secret that was never in Git.</blockquote>`,
        he: `<p>מה מגבים: <strong>מניפסטים</strong> (Git כבר הוא הגיבוי אם <em>הכל</em> ב-GitOps – כולל CRs והפניות ל-secrets), <strong>state של ה-cluster</strong> שלא נמצא ב-Git (דברים ש-operators ובני אדם יצרו), ו-<strong>מידע persistent</strong>. <strong>Velero</strong> מטפל בשני האחרונים: מייצא אובייקטי API ל-object storage ועושה snapshots ל-volumes (CSI snapshots, או העתקה ברמת קבצים דרך ה-node agent שלו עם Kopia).</p>
<pre>velero schedule create prod-daily --schedule="0 2 * * *" \\
  --include-namespaces shop,orders --snapshot-volumes --ttl 720h
velero backup get
NAME                         STATUS            ERRORS  WARNINGS  CREATED                         EXPIRES
prod-daily-20261112020015    PartiallyFailed   2       0         2026-11-12 02:00:15 +0000 UTC   29d
velero backup describe prod-daily-20261112020015 --details   # → which PVC snapshot failed and why
velero restore create --from-backup prod-daily-20261112020015 \\
  --include-namespaces shop --namespace-mappings shop:shop-restore-test</pre>
<p>Snapshots של volumes הם <em>crash-consistent</em>, לא application-consistent. ל-databases משתמשים בגיבויים native (pg_basebackup/ארכוב WAL דרך CloudNativePG, mysqldump וכו') או ב-hooks של Velero (pre/post) שמקפיאים כתיבות.</p>
<p><strong>etcd</strong> (רק ב-self-managed – ב-EKS/AKS/GKE הספק מגבה אותו): snapshot הוא כל ה-state של ה-cluster.</p>
<pre>ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key snapshot save /backup/etcd-2026-11-12.db
etcdutl snapshot status /backup/etcd-2026-11-12.db -w table
etcdutl snapshot restore /backup/etcd-2026-11-12.db --data-dir /var/lib/etcd-restored</pre>
<p>ה-space quota ברירת המחדל של etcd הוא 2GiB; כשעוברים אותו כל כתיבה נכשלת עם <code>etcdserver: mvcc: database space exceeded</code> – עושים compact, <code>defrag</code>, ואז <code>alarm disarm</code>. אלפי events ישנים, secrets של Helm releases או CRs ענקיים הם הסיבה הרגילה.</p>
<blockquote>💡 מהשטח: גיבוי שאף פעם לא שוחזר הוא תקווה, לא גיבוי. קובעים תרגול שחזור רבעוני ל-namespace/cluster זמני ומודדים את ה-RTO האמיתי – התרגול הראשון תמיד מוצא CRD חסר, StorageClass שלא קיים ב-region של ה-DR, או secret שאף פעם לא היה ב-Git.</blockquote>`
      }
    },
    {
      h: { en: "Multi-cluster patterns", he: "דפוסי multi-cluster" },
      body: {
        en: `<p>One giant cluster is one giant blast radius — a bad CRD upgrade, an etcd problem or a webhook outage hits everything. Common shapes:</p>
<ul>
<li><strong>Per environment</strong> (dev / staging / prod) — the minimum; lets you rehearse upgrades.</li>
<li><strong>Per region, active/active</strong> — global DNS or a global LB (Route 53 latency/failover records, Cloudflare, GCP global LB) in front; data replication is the hard part, not Kubernetes.</li>
<li><strong>Cells</strong> — N identical clusters each serving a slice of customers; a bad deploy or upgrade hits one cell first.</li>
<li><strong>Blue/green clusters</strong> — for risky jumps (CNI swap, multi-version upgrade) build a new cluster, deploy everything via GitOps, shift traffic by DNS weights, keep the old one for rollback.</li>
</ul>
<p>What makes it workable is treating clusters as cattle: cluster creation in Terraform/Crossplane, all workloads from Git (Argo CD <code>ApplicationSet</code> with a cluster generator fans the same apps out to every cluster), shared observability (remote-write to one Mimir/Thanos), and identity/secrets that don't depend on the cluster (workload identity + an external secret manager).</p>
<blockquote>⚠️ Production tip: watch for things that are secretly unique per cluster — external-dns owner IDs, cert-manager ACME accounts and rate limits, Kafka consumer group names, cron jobs that must run exactly once (two clusters = double billing emails). List them before your first active/active cut-over.</blockquote>`,
        he: `<p>Cluster ענק אחד זה blast radius ענק אחד – שדרוג CRD גרוע, בעיה ב-etcd או נפילה של webhook פוגעים בהכל. הצורות הנפוצות:</p>
<ul>
<li><strong>לפי סביבה</strong> (dev / staging / prod) – המינימום; מאפשר לעשות חזרות על שדרוגים.</li>
<li><strong>לפי region, active/active</strong> – DNS גלובלי או LB גלובלי (רשומות latency/failover ב-Route 53, Cloudflare, global LB של GCP) מלפנים; החלק הקשה הוא שכפול המידע, לא Kubernetes.</li>
<li><strong>Cells</strong> – N clusters זהים שכל אחד משרת פלח של לקוחות; deploy או שדרוג גרוע פוגע קודם ב-cell אחד.</li>
<li><strong>Blue/green clusters</strong> – לקפיצות מסוכנות (החלפת CNI, שדרוג של כמה גרסאות) בונים cluster חדש, פורסים הכל דרך GitOps, מעבירים תעבורה עם משקלים ב-DNS, ומשאירים את הישן ל-rollback.</li>
</ul>
<p>מה שהופך את זה לאפשרי זה להתייחס ל-clusters כ-cattle: יצירת cluster ב-Terraform/Crossplane, כל ה-workloads מ-Git (<code>ApplicationSet</code> של Argo CD עם cluster generator פורס את אותן אפליקציות לכל ה-clusters), observability משותף (remote-write ל-Mimir/Thanos אחד), ו-identity/secrets שלא תלויים ב-cluster (workload identity + secret manager חיצוני).</p>
<blockquote>⚠️ טיפ לפרודקשן: שימו לב לדברים שבסתר ייחודיים לכל cluster – owner IDs של external-dns, חשבונות ACME ו-rate limits של cert-manager, שמות consumer groups של Kafka, cron jobs שחייבים לרוץ בדיוק פעם אחת (שני clusters = מיילים כפולים של חיוב). רושמים אותם לפני ה-cut-over הראשון ל-active/active.</blockquote>`
      }
    }
  ],
  diagram: `  UPGRADE 1.33 → 1.34 (one minor at a time, never skip)

  [0] pre-flight ─ pluto/kubent · apiserver_requested_deprecated_apis · add-on matrix
       │           PDB sanity (ALLOWED DISRUPTIONS > 0) · fresh Velero backup + restore test
       ▼
  [1] control plane 1.34   (nodes may lag ≤ 3 minors, never lead)
       ▼
  [2] add-ons: CNI · CoreDNS · kube-proxy · CSI · ingress · cert-manager · operators
       ▼
  [3] nodes:  surge  ── +1 new ─► cordon old ─► drain (Eviction API, respects PDB) ─► delete
              blue/green pool ── new pool ─► cordon old pool ─► drain ─► soak ─► delete old
              Karpenter drift ── new AMI in EC2NodeClass ─► replace node by node
       ▼
  [4] verify: kubectl get nodes -o wide · alerts quiet · smoke tests

  drain hangs?  kubectl get pdb -A  → ALLOWED DISRUPTIONS 0 → fix PDB / scale up / heal pods`,
  handsOn: [
    { cmd: "kubectl version && kubectl get nodes -o custom-columns=NAME:.metadata.name,KUBELET:.status.nodeInfo.kubeletVersion,OS:.status.nodeInfo.osImage,RUNTIME:.status.nodeInfo.containerRuntimeVersion",
      what: { en: "Control plane vs kubelet versions on every node — your current skew.", he: "גרסת ה-control plane מול גרסת ה-kubelet בכל node – ה-skew הנוכחי שלך." } },
    { cmd: "pluto detect-helm -A --target-versions k8s=v1.34.0 -o wide && pluto detect-files -d ./k8s --target-versions k8s=v1.34.0",
      what: { en: "Find deprecated/removed APIs in live Helm releases and in your manifests, for the target version.", he: "מוצאים APIs שהוצאו משימוש/הוסרו ב-Helm releases חיים ובמניפסטים שלך, מול גרסת היעד." } },
    { cmd: "kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis",
      what: { en: "Which deprecated API versions clients are actually calling right now.", he: "באילו API versions שהוצאו משימוש לקוחות באמת משתמשים עכשיו." } },
    { cmd: "kubectl get pdb -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,MIN:.spec.minAvailable,MAX:.spec.maxUnavailable,ALLOWED:.status.disruptionsAllowed | awk 'NR==1 || $5==0'",
      what: { en: "PDBs that currently allow zero disruptions — these will block your drains.", he: "PDBs שכרגע מאפשרים אפס disruptions – הם יחסמו לך drains." } },
    { cmd: "kubectl cordon ip-10-0-7-12.eu-west-1.compute.internal && kubectl drain ip-10-0-7-12.eu-west-1.compute.internal --ignore-daemonsets --delete-emptydir-data --timeout=15m",
      what: { en: "Safely empty a node: no new pods, then evictions that respect PDBs, giving up after 15 minutes instead of hanging forever.", he: "מרוקנים node בבטחה: בלי pods חדשים, ואז evictions שמכבדים PDBs, ומוותרים אחרי 15 דקות במקום להיתקע לנצח." } },
    { cmd: "kubectl get pods -A -o wide --field-selector spec.nodeName=ip-10-0-7-12.eu-west-1.compute.internal",
      what: { en: "What's still running on the node you're draining — find the pod that's blocking.", he: "מה עדיין רץ על ה-node שאתה עושה לו drain – מוצאים את ה-pod שחוסם." } },
    { cmd: "velero backup create pre-upgrade-1-34 --include-namespaces '*' --snapshot-volumes --wait && velero backup describe pre-upgrade-1-34 --details | head -40",
      what: { en: "Take a full backup right before an upgrade and confirm it completed without errors.", he: "גיבוי מלא רגע לפני שדרוג, ובדיקה שהוא הסתיים בלי שגיאות." } },
    { cmd: "velero restore create --from-backup pre-upgrade-1-34 --include-namespaces shop --namespace-mappings shop:shop-restore-test && velero restore get",
      what: { en: "Restore drill into a side namespace — proves the backup works without touching production. Delete the test namespace afterwards.", he: "תרגול שחזור ל-namespace צדדי – מוכיח שהגיבוי עובד בלי לגעת בפרודקשן. אחר כך מוחקים את ה-namespace של הבדיקה." } },
    { cmd: "aws eks describe-addon-versions --kubernetes-version 1.34 --addon-name vpc-cni --query 'addons[].addonVersions[].addonVersion' --output text",
      what: { en: "Which add-on versions are compatible with the target Kubernetes version (EKS example).", he: "אילו גרסאות add-on תואמות לגרסת ה-Kubernetes של היעד (דוגמה מ-EKS)." } }
  ],
  mnemonic: {
    en: "<strong>\"Check, Brain, Organs, Body\"</strong>: Check APIs & backups → Brain (control plane) → Organs (add-ons) → Body (nodes). One minor per surgery, and the PDB is the anesthetist who can stop the operation.",
    he: "<strong>\"בדיקה, מוח, איברים, גוף\"</strong>: בודקים APIs וגיבויים → מוח (control plane) → איברים (add-ons) → גוף (nodes). minor אחד בכל ניתוח, וה-PDB הוא המרדים שיכול לעצור את הניתוח."
  },
  pitfalls: [
    { en: "PDB with <code>minAvailable</code> equal to replicas (or <code>maxUnavailable: 0</code>). Drains never finish; the upgrade stalls at 2am with half the nodes on each version.",
      he: "PDB עם <code>minAvailable</code> ששווה ל-replicas (או <code>maxUnavailable: 0</code>). ה-drains לא נגמרים לעולם; השדרוג נתקע ב-2 בלילה עם חצי מה-nodes בכל גרסה." },
    { en: "Upgrading nodes before the control plane, or skipping minors. Kubelets newer than the API server are unsupported, and the control plane can't jump two minors.",
      he: "לשדרג nodes לפני ה-control plane, או לדלג על minors. Kubelets חדשים מה-API server לא נתמכים, וה-control plane לא יכול לקפוץ שני minors." },
    { en: "Forgetting add-ons. The cluster is on 1.34 but the CNI, CSI driver or ingress controller only supports 1.32 — symptoms look like random networking or volume attach failures.",
      he: "לשכוח add-ons. ה-cluster על 1.34 אבל ה-CNI, ה-CSI driver או ה-ingress controller תומכים רק עד 1.32 – הסימפטומים נראים כמו תקלות רשת או חיבור volumes אקראיות." },
    { en: "Trusting Velero volume snapshots as database backups. They're crash-consistent; restore may need recovery or lose in-flight transactions — use DB-native backups or hooks.",
      he: "לסמוך על snapshots של volumes ב-Velero כגיבוי של database. הם crash-consistent; שחזור עלול להצריך recovery או לאבד טרנזקציות באמצע – משתמשים בגיבויים native של ה-DB או ב-hooks." }
  ],
  interview: [
    { q: { en: "Walk me through upgrading a production EKS cluster from 1.33 to 1.34.", he: "תעבור איתי על שדרוג cluster פרודקשן ב-EKS מ-1.33 ל-1.34." },
      a: { en: "Pre-flight: read release notes, scan for removed APIs (pluto/kubent, the deprecated-API metric, EKS upgrade insights), check add-on compatibility, confirm PDBs allow disruptions, take a Velero backup. Rehearse on staging. Then upgrade the control plane, then add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI, then Helm-managed ones), then nodes — managed node groups with surge or a new node group, or Karpenter drift by bumping the AMI. Watch alerts and SLOs throughout, and keep the old node pool briefly for rollback.",
           he: "Pre-flight: קוראים release notes, סורקים APIs שהוסרו (pluto/kubent, המטריקה של deprecated APIs, upgrade insights של EKS), בודקים תאימות add-ons, מוודאים ש-PDBs מאפשרים disruptions, לוקחים גיבוי Velero. עושים חזרה ב-staging. ואז משדרגים control plane, אחר כך add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI, ואז אלה שמנוהלים ב-Helm), ואז nodes – managed node groups עם surge או node group חדש, או drift של Karpenter ע״י החלפת ה-AMI. לאורך כל הדרך עוקבים אחרי התראות ו-SLOs, ומשאירים את ה-node pool הישן לזמן קצר בשביל rollback." } },
    { q: { en: "A drain has been hanging for 20 minutes during a node upgrade. What do you check?", he: "Drain תקוע כבר 20 דקות באמצע שדרוג nodes. מה בודקים?" },
      a: { en: "The drain output names the pod and says it would violate a PDB. <code>kubectl get pdb -A</code> → ALLOWED DISRUPTIONS 0. Then why: minAvailable equals replicas, maxUnavailable 0, or some replicas are unhealthy/Pending elsewhere so the budget is already consumed. Fix the cause — scale up, heal the unhealthy pods, change the PDB to maxUnavailable 1 with the owning team, set unhealthyPodEvictionPolicy AlwaysAllow. I wouldn't force-delete; that defeats the protection for quorum-based systems.",
           he: "הפלט של ה-drain מציין את ה-pod ואומר שזה יפר PDB. <code>kubectl get pdb -A</code> → ALLOWED DISRUPTIONS 0. ואז למה: minAvailable שווה ל-replicas, maxUnavailable 0, או שחלק מה-replicas לא בריאים/Pending במקום אחר אז התקציב כבר נוצל. מתקנים את הסיבה – scale up, מבריאים את ה-pods הלא בריאים, משנים את ה-PDB ל-maxUnavailable 1 יחד עם הצוות הבעלים, מגדירים unhealthyPodEvictionPolicy AlwaysAllow. לא הייתי עושה force delete; זה מבטל את ההגנה למערכות שמבוססות quorum." } },
    { q: { en: "How do you design backup and DR for workloads on Kubernetes?", he: "איך מתכננים גיבוי ו-DR ל-workloads על Kubernetes?" },
      a: { en: "Separate the layers: desired state from Git (GitOps can rebuild a cluster), cluster objects not in Git plus volumes via Velero to object storage in another region, and databases with native, application-consistent backups (WAL archiving/PITR). Define RPO/RTO per service, automate cluster creation (Terraform), and run regular restore drills into a fresh cluster to measure the real RTO and find gaps like missing CRDs or region-specific StorageClasses.",
           he: "מפרידים שכבות: ה-desired state מ-Git (GitOps יכול לבנות cluster מחדש), אובייקטי cluster שלא ב-Git יחד עם volumes דרך Velero ל-object storage ב-region אחר, ו-databases עם גיבויים native ו-application-consistent (ארכוב WAL/PITR). מגדירים RPO/RTO לכל שירות, הופכים יצירת cluster לאוטומטית (Terraform), ומריצים תרגולי שחזור קבועים ל-cluster חדש כדי למדוד את ה-RTO האמיתי ולמצוא חורים כמו CRDs חסרים או StorageClasses שתלויים ב-region." } }
  ],
  quiz: [
    { q: { en: "The API server is on 1.34. Which kubelet version is NOT allowed by the skew policy?", he: "ה-API server על 1.34. איזו גרסת kubelet אסורה לפי ה-skew policy?" },
      options: [
        { en: "1.31", he: "1.31" },
        { en: "1.33", he: "1.33" },
        { en: "1.34", he: "1.34" },
        { en: "1.35", he: "1.35" }
      ], answer: 3,
      explain: { en: "Kubelets may be up to three minors older than the API server but never newer. That's why the control plane is upgraded first.", he: "Kubelet יכול להיות עד שלושה minors ישן מה-API server אבל אף פעם לא חדש ממנו. בגלל זה משדרגים קודם את ה-control plane." } },
    { q: { en: "A Deployment has 3 replicas and a PDB with <code>minAvailable: 3</code>. What happens on <code>kubectl drain</code>?", he: "ל-Deployment יש 3 replicas ו-PDB עם <code>minAvailable: 3</code>. מה קורה ב-<code>kubectl drain</code>?" },
      options: [
        { en: "The pods are evicted one by one", he: "ה-pods עוברים eviction אחד אחרי השני" },
        { en: "Eviction is refused forever (0 allowed disruptions) and the drain retries until it times out", he: "ה-eviction נדחה לנצח (0 disruptions מותרים) וה-drain מנסה שוב עד timeout" },
        { en: "Kubernetes temporarily scales the Deployment to 4", he: "Kubernetes מגדיל זמנית את ה-Deployment ל-4" },
        { en: "The PDB is ignored for drains", he: "ה-PDB לא נלקח בחשבון ב-drains" }
      ], answer: 1,
      explain: { en: "Drain uses the Eviction API, which honors PDBs. With minAvailable equal to replicas, no voluntary disruption is ever allowed. Kubernetes doesn't auto-surge for you.", he: "Drain משתמש ב-Eviction API, שמכבד PDBs. כש-minAvailable שווה ל-replicas, אף שיבוש וולונטרי לא מותר. Kubernetes לא מוסיף replica בשבילך אוטומטית." } },
    { q: { en: "After a control-plane upgrade, CI deploys fail with <code>no matches for kind \"HorizontalPodAutoscaler\" in version \"autoscaling/v2beta2\"</code>, yet running HPAs work. Why?", he: "אחרי שדרוג control plane, deploys מה-CI נכשלים עם <code>no matches for kind \"HorizontalPodAutoscaler\" in version \"autoscaling/v2beta2\"</code>, אבל ה-HPAs שרצים עובדים. למה?" },
      options: [
        { en: "metrics-server must be reinstalled", he: "צריך להתקין מחדש את metrics-server" },
        { en: "The API version was removed; stored objects were converted, but manifests still using it can't be applied", he: "ה-API version הוסר; אובייקטים שמורים הומרו, אבל מניפסטים שעדיין משתמשים בו לא יכולים לעבור apply" },
        { en: "The kubelets are older than the API server", he: "ה-kubelets ישנים מה-API server" },
        { en: "etcd lost the HPA objects", he: "etcd איבד את אובייקטי ה-HPA" }
      ], answer: 1,
      explain: { en: "Removal stops serving the old version. Update manifests to <code>autoscaling/v2</code> and fix Helm release history with <code>helm mapkubeapis</code>. pluto/kubent would have caught it beforehand.", he: "הסרה מפסיקה להגיש את הגרסה הישנה. מעדכנים מניפסטים ל-<code>autoscaling/v2</code> ומתקנים היסטוריית Helm releases עם <code>helm mapkubeapis</code>. pluto/kubent היו תופסים את זה מראש." } },
    { q: { en: "What's the main advantage of a blue/green node-pool upgrade over in-place surge?", he: "מה היתרון העיקרי של שדרוג node pool בשיטת blue/green על פני surge במקום?" },
      options: [
        { en: "It needs no extra capacity", he: "לא צריך קיבולת נוספת" },
        { en: "It skips PDB checks", he: "הוא מדלג על בדיקות PDB" },
        { en: "The old pool stays available (cordoned) for a fast rollback during a soak period", he: "ה-pool הישן נשאר זמין (ב-cordon) ל-rollback מהיר בתקופת soak" },
        { en: "It upgrades the control plane at the same time", he: "הוא משדרג את ה-control plane באותו זמן" }
      ], answer: 2,
      explain: { en: "Blue/green costs double capacity temporarily but lets you uncordon the old pool if the new image misbehaves. Drains still respect PDBs.", he: "Blue/green עולה קיבולת כפולה זמנית, אבל מאפשר לעשות uncordon ל-pool הישן אם ה-image החדש מתנהג לא טוב. ה-drains עדיין מכבדים PDBs." } }
  ],
  related: ["rel-bcdr", "rel-ha", "k8s-scheduling", "k8s-helm-gitops"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Ephemeral container", "A temporary debug container added to a running pod (kubectl debug), sharing its network and optionally process namespace; it can't be removed until the pod dies.", "קונטיינר debug זמני שמוסיפים ל-pod שרץ (kubectl debug), עם אותה רשת ואופציונלית אותו process namespace; אי אפשר להסיר אותו עד שה-pod מת.", "k8s-troubleshooting-playbook"],
  ["netshoot", "nicolaka/netshoot — a container image packed with network debugging tools (curl, dig, tcpdump, ss, mtr, iperf3, openssl) for use inside the cluster.", "nicolaka/netshoot – image עמוס בכלי debug לרשת (curl, dig, tcpdump, ss, mtr, iperf3, openssl) לשימוש מתוך ה-cluster.", "k8s-troubleshooting-playbook"],
  ["Finalizer", "A key in metadata.finalizers that blocks an object's deletion until its controller finishes cleanup and removes the key.", "מפתח ב-metadata.finalizers שחוסם מחיקה של אובייקט עד שה-controller שלו מסיים לנקות ומסיר את המפתח.", "k8s-operators-crds"],
  ["EndpointSlice", "The API object listing the actual pod IPs/ports behind a Service and whether each is ready; empty = the Service routes nowhere.", "אובייקט ה-API שמפרט את כתובות ה-IP והפורטים של ה-pods מאחורי Service והאם כל אחד ready; ריק = ה-Service לא מנתב לשום מקום.", "k8s-troubleshooting-playbook"],
  ["CoreDNS", "The cluster DNS server (Deployment in kube-system, Service kube-dns) that resolves Service and pod names and forwards external queries.", "שרת ה-DNS של ה-cluster (Deployment ב-kube-system, Service בשם kube-dns) שמתרגם שמות של Services ו-pods ומעביר שאילתות חיצוניות הלאה.", "k8s-troubleshooting-playbook"],
  ["ndots", "resolv.conf option (5 in pods by default): names with fewer dots are first tried with every search suffix, multiplying DNS queries for external hosts.", "אופציה ב-resolv.conf (ב-pods ברירת המחדל 5): שמות עם פחות נקודות מנוסים קודם עם כל search suffix, מה שמכפיל שאילתות DNS לשמות חיצוניים.", "k8s-troubleshooting-playbook"],
  ["Gateway API", "The successor to Ingress: role-oriented, typed routing API (GatewayClass, Gateway, HTTPRoute, GRPCRoute…) implemented by many controllers.", "היורש של Ingress: API ניתוב מוגדר ומחולק לפי תפקידים (GatewayClass, Gateway, HTTPRoute, GRPCRoute…) שממומש ע״י הרבה controllers.", "k8s-ingress-certs-dns"],
  ["HTTPRoute", "Gateway API resource owned by app teams: matches host/path/headers and forwards to weighted backend Services, attached to a Gateway listener.", "משאב של Gateway API שצוותי האפליקציה מחזיקים: מתאים host/path/headers ומעביר ל-Services עם משקלים, מחובר ל-listener של Gateway.", "k8s-ingress-certs-dns"],
  ["cert-manager", "Kubernetes controller that issues and renews TLS certificates (ACME/Let's Encrypt, Vault, private CA) and stores them as Secrets.", "Controller של Kubernetes שמנפיק ומחדש תעודות TLS (ACME/Let's Encrypt, Vault, CA פרטי) ושומר אותן כ-Secrets.", "k8s-ingress-certs-dns"],
  ["ClusterIssuer", "cert-manager resource defining a cluster-wide certificate authority/ACME account and its challenge solvers (HTTP-01, DNS-01).", "משאב של cert-manager שמגדיר CA או חשבון ACME לכל ה-cluster ואת ה-solvers שלו (HTTP-01, DNS-01).", "k8s-ingress-certs-dns"],
  ["external-dns", "Controller that creates DNS records in Route 53/Azure DNS/Cloud DNS/Cloudflare from Services, Ingresses and Gateway routes, tracking ownership via TXT records.", "Controller שיוצר רשומות DNS ב-Route 53/Azure DNS/Cloud DNS/Cloudflare מתוך Services, Ingresses ו-routes של Gateway, ועוקב אחרי בעלות עם רשומות TXT.", "k8s-ingress-certs-dns"],
  ["CRD", "CustomResourceDefinition — registers a new resource type (with schema) in the Kubernetes API so it can be stored, watched and RBAC-controlled.", "CustomResourceDefinition – רושם סוג משאב חדש (עם schema) ב-API של Kubernetes, כך שאפשר לשמור אותו, לעשות לו watch ולשלוט בו עם RBAC.", "k8s-operators-crds"],
  ["Operator", "CRDs plus a controller that encodes operational knowledge (install, upgrade, failover, backup) for a specific application.", "CRDs יחד עם controller שמקודד ידע תפעולי (התקנה, שדרוג, failover, גיבוי) לאפליקציה מסוימת.", "k8s-operators-crds"],
  ["Reconcile loop", "The level-triggered controller cycle: read desired spec, observe actual state, act to converge, write status — repeated idempotently.", "המחזור ה-level-triggered של controller: קורא את ה-spec הרצוי, בודק את המצב בפועל, פועל כדי להתכנס, כותב status – שוב ושוב, באופן idempotent.", "k8s-operators-crds"],
  ["Pod Security Standards", "Three built-in pod security profiles — privileged, baseline, restricted — enforced per namespace by Pod Security Admission labels.", "שלושה פרופילי אבטחה מובנים ל-pods – privileged, baseline, restricted – שנאכפים לכל namespace דרך labels של Pod Security Admission.", "k8s-security-policy"],
  ["Kyverno", "Kubernetes-native policy engine: validate, mutate and generate resources and verify image signatures using YAML policies.", "מנוע policy native ל-Kubernetes: validate, mutate ו-generate למשאבים ואימות חתימות images עם policies ב-YAML.", "k8s-security-policy"],
  ["OPA Gatekeeper", "Admission controller that enforces policies written in Rego via ConstraintTemplates and Constraints.", "Admission controller שאוכף policies שנכתבו ב-Rego דרך ConstraintTemplates ו-Constraints.", "k8s-security-policy"],
  ["cosign", "Sigstore CLI to sign and verify container images and attestations, including keyless signing with OIDC identities logged in Rekor.", "CLI של Sigstore לחתימה ואימות של container images ו-attestations, כולל חתימה keyless עם OIDC identities שנרשמות ב-Rekor.", "k8s-security-policy"],
  ["Falco", "CNCF runtime security tool that watches syscalls via eBPF and alerts on suspicious behaviour like shells in containers.", "כלי runtime security של CNCF שמסתכל על syscalls דרך eBPF ומתריע על התנהגות חשודה כמו shell בתוך קונטיינר.", "k8s-security-policy"],
  ["Workload identity", "Federating a Kubernetes ServiceAccount to a cloud IAM identity (EKS Pod Identity/IRSA, AKS WI, GKE WIF) so pods get short-lived credentials without static keys.", "פדרציה של ServiceAccount ב-Kubernetes ל-identity של IAM בענן (EKS Pod Identity/IRSA, AKS WI, GKE WIF) כדי ש-pods יקבלו credentials קצרי-חיים בלי מפתחות סטטיים.", "k8s-security-policy"],
  ["kube-state-metrics", "Exporter that turns Kubernetes object state (replicas, pod phases, restarts, requests, node conditions) into Prometheus metrics.", "Exporter שהופך את ה-state של אובייקטים ב-Kubernetes (replicas, phases של pods, restarts, requests, conditions של nodes) למטריקות Prometheus.", "k8s-cluster-observability"],
  ["PDB", "PodDisruptionBudget — limits how many pods of an app may be voluntarily disrupted (drain, eviction) at once via minAvailable/maxUnavailable.", "PodDisruptionBudget – מגביל כמה pods של אפליקציה יכולים לעבור שיבוש וולונטרי (drain, eviction) בבת אחת דרך minAvailable/maxUnavailable.", "k8s-day2-upgrades"],
  ["Cordon / drain", "Cordon marks a node unschedulable; drain then evicts its pods through the Eviction API (respecting PDBs) before maintenance or replacement.", "Cordon מסמן node כלא זמין ל-scheduling; drain אחר כך מפנה את ה-pods שלו דרך ה-Eviction API (תוך כיבוד PDBs) לפני תחזוקה או החלפה.", "k8s-day2-upgrades"],
  ["Version skew", "The policy for which component versions may coexist: kubelets up to 3 minors older than the API server and never newer; upgrade one minor at a time.", "המדיניות שקובעת אילו גרסאות רכיבים יכולות לחיות ביחד: kubelets עד 3 minors ישנים מה-API server ואף פעם לא חדשים; משדרגים minor אחד בכל פעם.", "k8s-day2-upgrades"],
  ["Velero", "Backup/restore tool for Kubernetes objects and persistent volumes to object storage, with schedules, snapshots and namespace mapping.", "כלי גיבוי ושחזור לאובייקטים של Kubernetes ול-persistent volumes אל object storage, עם schedules, snapshots ומיפוי namespaces.", "k8s-day2-upgrades"]
].forEach(function (g) {
  window.INFRA.glossary.push({ term: g[0], track: "kubernetes", def: { en: g[1], he: g[2] }, lesson: g[3] });
});
