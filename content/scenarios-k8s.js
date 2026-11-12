// On-call scenarios: Kubernetes in production (choose-your-own-adventure)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.scenarios = window.INFRA.scenarios || [];

(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  /* ------------------------------------------------------------------ 1 */
  window.INFRA.scenarios.push({
    id: "k8s-pending-karpenter",
    icon: "⏳",
    title: t("Traffic spike, pods Pending, Karpenter launches nothing", "קפיצת תעבורה, pods ב-Pending ו-Karpenter לא מרים כלום"),
    start: "s1",
    steps: {
      s1: {
        text: t("20:05, campaign night. PagerDuty: 'checkout p99 latency 1.9s'. The HPA already scaled checkout from 12 to 30 replicas — but most of the new pods aren't running. The cluster uses Karpenter for nodes.",
                "20:05, ערב קמפיין. PagerDuty: 'checkout p99 latency 1.9s'. ה-HPA כבר הגדיל את checkout מ-12 ל-30 replicas – אבל רוב ה-pods החדשים לא רצים. ה-cluster משתמש ב-Karpenter בשביל nodes."),
        data: `$ kubectl get pods -n shop -l app=checkout --field-selector=status.phase=Pending
NAME                        READY   STATUS    RESTARTS   AGE
checkout-6b8f9d7c5-2xkqp    0/1     Pending   0          7m
checkout-6b8f9d7c5-4mzxq    0/1     Pending   0          7m
checkout-6b8f9d7c5-9wzlm    0/1     Pending   0          7m
... (14 more)
$ kubectl get nodeclaims
NAME            TYPE         CAPACITY   ZONE         NODE                          READY   AGE
general-8x2kq   c6i.2xlarge  spot       eu-west-1a   ip-10-0-11-87.eu-west-1...   True    3d
... (17 more, newest is 2h old)`,
        choices: [
          c("kubectl describe one of the Pending pods", "kubectl describe לאחד ה-pods שב-Pending", "s2", 15,
            "Right. A Pending pod's events contain both the scheduler's reason and Karpenter's reason for not provisioning.",
            "נכון. ב-events של pod ב-Pending יש גם את הסיבה של ה-scheduler וגם את הסיבה של Karpenter לא להרים node."),
          c("Restart the Karpenter controller pods", "לעשות restart ל-pods של ה-controller של Karpenter", "s1b", -5,
            "Restarting a controller that is working correctly changes nothing — Karpenter is <em>deciding</em> not to launch. Find out why first.",
            "Restart ל-controller שעובד תקין לא משנה כלום – Karpenter <em>מחליט</em> לא להרים. קודם מבינים למה."),
          c("Delete the Pending pods so they get rescheduled", "למחוק את ה-pods שב-Pending כדי שיתוזמנו מחדש", "s1b", -10,
            "The ReplicaSet just recreates identical Pending pods. Scheduling is retried continuously anyway; deleting only destroys the events you need.",
            "ה-ReplicaSet פשוט יוצר pods זהים ב-Pending. ה-scheduling ממילא מנוסה שוב ושוב; המחיקה רק משמידה את ה-events שאתה צריך.")
        ]
      },
      s1b: {
        text: t("Six minutes later: nothing changed. Still 17 Pending pods, no new NodeClaims. Latency is climbing and the campaign email just went out to another 2M users.",
                "שש דקות אחר כך: שום דבר לא השתנה. עדיין 17 pods ב-Pending, אין NodeClaims חדשים. ה-latency מטפס ומייל הקמפיין יצא עכשיו לעוד 2M משתמשים."),
        choices: [
          c("Now describe a Pending pod", "עכשיו describe ל-pod ב-Pending", "s2", 5,
            "Better late than never. Evidence before action.",
            "עדיף מאוחר מאשר אף פעם. ראיות לפני פעולה.")
        ]
      },
      s2: {
        text: t("The events tell two stories: the scheduler has no room, and Karpenter refuses to add room.",
                "ה-events מספרים שני סיפורים: ל-scheduler אין מקום, ו-Karpenter מסרב להוסיף מקום."),
        data: `$ kubectl describe pod checkout-6b8f9d7c5-2xkqp -n shop | sed -n '/Events/,$p'
Events:
  Type     Reason            From               Message
  ----     ------            ----               -------
  Warning  FailedScheduling  default-scheduler  0/18 nodes are available: 18 Insufficient cpu.
           preemption: 0/18 nodes are available: 18 No preemption victims found for incoming pod.
  Warning  FailedScheduling  karpenter          Failed to schedule pod, all available instance types
           exceed limits for nodepool: "general"`,
        choices: [
          c("Inspect the NodePool and Karpenter's logs", "לבדוק את ה-NodePool ואת הלוגים של Karpenter", "s3", 15,
            "Yes — 'exceed limits for nodepool' points straight at <code>spec.limits</code> on the NodePool.",
            "כן – 'exceed limits for nodepool' מצביע ישר על <code>spec.limits</code> ב-NodePool."),
          c("Lower CPU requests on checkout with kubectl edit so more pods fit", "להוריד CPU requests ב-checkout עם kubectl edit כדי שיותר pods ייכנסו", "s3", -5,
            "Cramming pods with smaller requests during a spike gives you throttling and noisy neighbours, and it doesn't address why capacity can't grow. Look at the NodePool.",
            "לדחוס pods עם requests קטנים יותר באמצע spike נותן throttling ו-noisy neighbours, ולא מטפל בזה שהקיבולת לא יכולה לגדול. מסתכלים על ה-NodePool.")
        ]
      },
      s3: {
        text: t("Found it: the NodePool has a CPU limit of 200 cores, set a year ago as a cost guardrail. The cluster is at 196.",
                "מצאת: ל-NodePool יש limit של 200 cores, שהוגדר לפני שנה כמעקה בטיחות לעלויות. ה-cluster על 196."),
        data: `$ kubectl get nodepool general -o yaml | yq '.spec.limits, .status.resources'
cpu: "200"
memory: 800Gi
---
cpu: "196"
memory: 412Gi
nodes: "18"

$ kubectl logs -n kube-system deploy/karpenter --since=10m | grep -m2 'could not schedule'
{"level":"ERROR","time":"2026-11-12T20:06:41Z","logger":"controller","message":"could not schedule pod",
 "controller":"provisioner","Pod":{"name":"checkout-6b8f9d7c5-2xkqp","namespace":"shop"},
 "error":"all available instance types exceed limits for nodepool: \\"general\\""}`,
        choices: [
          c("Raise the limit to 320 in the NodePool manifest in Git and let Argo CD sync it", "להעלות את ה-limit ל-320 במניפסט של ה-NodePool ב-Git ולתת ל-Argo CD לסנכרן", "s4", 15,
            "Clean fix: the NodePool is GitOps-managed, so the change is reviewed, audited and won't be reverted by self-heal. A fast-tracked PR takes 3 minutes.",
            "תיקון נקי: ה-NodePool מנוהל ב-GitOps, אז השינוי עובר review, מתועד ולא יוחזר ע״י self-heal. PR מזורז לוקח 3 דקות."),
          c("kubectl patch the NodePool limit right now, then open a PR", "kubectl patch ל-limit של ה-NodePool עכשיו, ואז לפתוח PR", "s4", 10,
            "Acceptable under fire — but remember Argo CD self-heal will revert a live patch within minutes unless the PR lands quickly (or you pause auto-sync for this app).",
            "סביר תחת אש – אבל זכור ש-self-heal של Argo CD יחזיר patch חי תוך דקות אם ה-PR לא נכנס מהר (או אם לא עוצרים auto-sync לאפליקציה הזאת)."),
          c("Delete the NodePool and recreate it without limits", "למחוק את ה-NodePool וליצור אותו מחדש בלי limits", "lose", -25,
            "Deleting a NodePool makes Karpenter delete every NodeClaim it owns — all 18 nodes get drained and terminated at peak traffic.",
            "מחיקת NodePool גורמת ל-Karpenter למחוק כל NodeClaim ששייך לו – כל 18 ה-nodes עוברים drain ונמחקים בשיא התעבורה.")
        ]
      },
      s4: {
        text: t("20:19. Karpenter launched 9 nodes, checkout is fully scheduled and latency is dropping. But three <code>report-worker</code> pods are still Pending — with a different message.",
                "20:19. Karpenter הרים 9 nodes, כל checkout מתוזמן וה-latency יורד. אבל שלושה pods של <code>report-worker</code> עדיין ב-Pending – עם הודעה אחרת."),
        data: `Warning  FailedScheduling  karpenter  Failed to schedule pod, no instance type satisfied resources
  {"cpu":"40150m","memory":"2148Mi","pods":"1"} and requirements karpenter.sh/capacity-type In [spot],
  karpenter.k8s.aws/instance-family In [c6i m6i], karpenter.k8s.aws/instance-size In [large xlarge 2xlarge 4xlarge]
  (no instance type has enough resources)

$ kubectl get deploy report-worker -n reports -o jsonpath='{.spec.template.spec.containers[0].resources}'
{"limits":{"memory":"2Gi"},"requests":{"cpu":"40","memory":"2Gi"}}`,
        choices: [
          c("Check the chart/values history for report-worker", "לבדוק את היסטוריית ה-chart/values של report-worker", "s5", 15,
            "Good instinct: 40 cores for a report worker smells like a typo. The values commit from this morning changed <code>cpu: 400m</code> to <code>cpu: 40</code>. Fix the value, the pods schedule on existing capacity.",
            "אינסטינקט טוב: 40 cores ל-report worker מריח כמו טעות הקלדה. ה-commit של ה-values מהבוקר שינה <code>cpu: 400m</code> ל-<code>cpu: 40</code>. מתקנים את הערך וה-pods נכנסים לקיבולת הקיימת."),
          c("Allow 12xlarge/16xlarge instances in the NodePool so the pods fit", "לאפשר instances של 12xlarge/16xlarge ב-NodePool כדי שה-pods ייכנסו", "s4b", -10,
            "That 'works' — Karpenter launches three 48-vCPU nodes for a worker that actually uses 0.3 cores. You've treated a typo with your cloud bill.",
            "זה 'עובד' – Karpenter מרים שלושה nodes של 48 vCPU ל-worker שבפועל משתמש ב-0.3 core. טיפלת בטעות הקלדה עם החשבון של הענן.")
        ]
      },
      s4b: {
        text: t("21:00. A FinOps alert: three c6i.12xlarge spot nodes at ~10% utilization. The reports team confirms the 40 was meant to be 400m.",
                "21:00. התראת FinOps: שלושה nodes של c6i.12xlarge ב-spot עם ניצולת של ~10%. צוות ה-reports מאשר שה-40 היה אמור להיות 400m."),
        choices: [
          c("Fix the request in Git and revert the NodePool change", "לתקן את ה-request ב-Git ולהחזיר את שינוי ה-NodePool", "s5", 5,
            "Right fix, one detour later. Karpenter's consolidation will remove the oversized nodes once they're empty.",
            "התיקון הנכון, אחרי עיקוף אחד. ה-consolidation של Karpenter יסיר את ה-nodes הענקיים כשהם יתרוקנו.")
        ]
      },
      s5: {
        text: t("20:40. Traffic spikes again. Some new checkout pods are Pending; Karpenter is trying, but NodeClaims fail and get retried in a loop.",
                "20:40. התעבורה קופצת שוב. חלק מה-pods החדשים של checkout ב-Pending; Karpenter מנסה, אבל NodeClaims נכשלים ומנוסים שוב בלולאה."),
        data: `{"level":"ERROR","message":"failed launching nodeclaim","NodeClaim":{"name":"general-q7k2d"},
 "error":"creating instance, insufficient capacity, with fleet error(s), InsufficientInstanceCapacity:
  We currently do not have sufficient c6i.2xlarge capacity in the Availability Zone you requested (eu-west-1a)."}

checkout topologySpreadConstraints: maxSkew 1, topologyKey topology.kubernetes.io/zone, whenUnsatisfiable DoNotSchedule
NodePool requirements: capacity-type In [spot]; instance-family In [c6i m6i]; instance-size In [large .. 4xlarge]`,
        choices: [
          c("Diversify the NodePool: more families/generations (c7i, m7i, c6a, m6a…) and allow on-demand as fallback", "לגוון את ה-NodePool: עוד families/דורות (c7i, m7i, c6a, m6a…) ולאפשר on-demand כ-fallback", "s6", 15,
            "Exactly. Spot capacity is per instance type per AZ; the more types Karpenter may choose, the less ICE hurts. With both spot and on-demand allowed, Karpenter prefers spot and falls back automatically.",
            "בדיוק. קיבולת spot היא לכל instance type בכל AZ; ככל ש-Karpenter יכול לבחור יותר סוגים, ICE כואב פחות. כש-spot ו-on-demand שניהם מותרים, Karpenter מעדיף spot ונופל ל-on-demand אוטומטית."),
          c("Remove the zone topologySpreadConstraint from checkout so pods go to any zone", "להסיר את ה-topologySpreadConstraint של zones מ-checkout כדי שה-pods ילכו לכל zone", "s6", -5,
            "It unblocks scheduling but trades away zone resilience — a single-AZ failure could now take most of checkout. Broadening capacity options fixes the cause without that trade.",
            "זה משחרר את ה-scheduling אבל מוותר על עמידות ל-zone – נפילה של AZ אחד יכולה עכשיו להפיל את רוב checkout. הרחבת אפשרויות הקיבולת פותרת את הסיבה בלי הוויתור הזה."),
          c("Pin the NodePool to exactly c6i.2xlarge so behaviour is predictable", "לנעול את ה-NodePool בדיוק על c6i.2xlarge כדי שההתנהגות תהיה צפויה", "lose", -20,
            "Pinning to the one instance type that's out of capacity guarantees more ICE errors. Checkout can't scale for the rest of the peak.",
            "לנעול על ה-instance type היחיד שנגמרה לו הקיבולת מבטיח עוד שגיאות ICE. checkout לא יכול לגדול עד סוף השיא.")
        ]
      },
      s6: {
        text: t("21:10. All pods Running, p99 back to 240ms. Time for the post-incident actions. Which set do you push for?",
                "21:10. כל ה-pods ב-Running, p99 חזר ל-240ms. הגיע הזמן ל-action items אחרי האינסידנט. על איזה סט אתה מתעקש?"),
        choices: [
          c("Alert at 80% of NodePool limits, LimitRange/Kyverno max request per container, diversified instance types, PriorityClasses for checkout", "התראה ב-80% מה-limits של ה-NodePool, LimitRange/Kyverno עם max request לקונטיינר, instance types מגוונים, PriorityClasses ל-checkout", "win", 15,
            "Each addresses a layer: <code>karpenter_nodepools_usage / karpenter_nodepools_limit &gt; 0.8</code> warns before the wall, a max-request policy catches 40-core typos in CI/admission, diversity beats ICE, and priority lets checkout preempt batch work.",
            "כל אחד מטפל בשכבה: <code>karpenter_nodepools_usage / karpenter_nodepools_limit &gt; 0.8</code> מזהיר לפני הקיר, policy של max request תופס טעויות של 40 cores ב-CI/admission, גיוון מנצח ICE, ו-priority מאפשר ל-checkout לדחוק עבודות batch."),
          c("Remove NodePool limits entirely so this never happens again", "להסיר לגמרי את ה-limits מה-NodePool כדי שזה לא יקרה שוב", "win", -5,
            "It removes this failure mode and adds a worse one: a runaway HPA or a bad request can now launch hundreds of nodes. Limits are a guardrail — monitor them instead of deleting them.",
            "זה מסיר את התקלה הזאת ומוסיף גרועה יותר: HPA שמשתולל או request שגוי יכולים עכשיו להרים מאות nodes. Limits הם מעקה בטיחות – מנטרים אותם במקום למחוק.")
        ]
      },
      win: {
        text: t("Incident closed. Root causes: NodePool CPU limit reached during a planned campaign, a 40-core request typo, and a too-narrow spot instance selection. You fixed each one through Git and left guardrails that alert before the next wall.",
                "האינסידנט נסגר. סיבות שורש: ה-limit של ה-CPU ב-NodePool הגיע לתקרה בזמן קמפיין מתוכנן, טעות הקלדה של request של 40 cores, ובחירת spot instances צרה מדי. תיקנת כל אחת דרך Git והשארת מעקות שמתריעים לפני הקיר הבא."),
        end: "win"
      },
      lose: {
        text: t("Checkout is down or can't scale through the peak. Lesson: Karpenter tells you exactly why it won't provision — in pod events and its logs. Fix the constraint it names (limits, requirements, requests); never delete the NodePool that owns your running nodes.",
                "checkout נפל או לא מצליח לגדול בשיא. הלקח: Karpenter אומר לך בדיוק למה הוא לא מרים – ב-events של ה-pod ובלוגים שלו. מתקנים את האילוץ שהוא מציין (limits, requirements, requests); אף פעם לא מוחקים את ה-NodePool שמחזיק את ה-nodes שרצים."),
        end: "lose"
      }
    },
    lessons: ["k8s-node-autoprovisioning", "k8s-scheduling", "k8s-troubleshooting-playbook"]
  });

  /* ------------------------------------------------------------------ 2 */
  window.INFRA.scenarios.push({
    id: "k8s-hpa-not-scaling",
    icon: "📈",
    title: t("Latency up, HPA stuck at <unknown>", "ה-latency עולה וה-HPA תקוע על <unknown>"),
    start: "s1",
    steps: {
      s1: {
        text: t("13:40. Marketing sent a push notification; traffic on the public API tripled. PagerDuty: 'api p99 2.4s (SLO 300ms)'. The API has an HPA with max 30 replicas — yet only 3 pods are running.",
                "13:40. השיווק שלח push notification; התעבורה ל-API הציבורי שולשה. PagerDuty: 'api p99 2.4s (SLO 300ms)'. ל-API יש HPA עם max של 30 replicas – ובכל זאת רצים רק 3 pods."),
        data: `$ kubectl get hpa -n api
NAME   REFERENCE        TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
api    Deployment/api   cpu: <unknown>/70%   3         30        3          41d

$ kubectl top pods -n api -l app=api
NAME                   CPU(cores)   MEMORY(bytes)
api-7c9d5b8f6-4kq2m    1974m        611Mi
api-7c9d5b8f6-8hx2c    1988m        598Mi
api-7c9d5b8f6-zz91k    1969m        620Mi`,
        choices: [
          c("kubectl describe hpa api", "kubectl describe hpa api", "s2", 15,
            "Yes. <code>&lt;unknown&gt;</code> means the HPA can't compute a metric, and its conditions/events say exactly why.",
            "כן. <code>&lt;unknown&gt;</code> אומר שה-HPA לא מצליח לחשב מטריקה, וה-conditions/events שלו אומרים בדיוק למה."),
          c("Mitigate first: kubectl scale deploy/api --replicas=15", "קודם להקל: kubectl scale deploy/api --replicas=15", "s1b", 5,
            "Reasonable mitigation — an HPA that can't read metrics doesn't change replicas, so your manual scale sticks. But it won't follow traffic; you still need the root cause.",
            "הקלה סבירה – HPA שלא מצליח לקרוא מטריקות לא משנה replicas, אז ה-scale הידני שלך נשאר. אבל הוא לא יעקוב אחרי התעבורה; עדיין צריך את סיבת השורש."),
          c("Restart metrics-server, it's probably broken", "restart ל-metrics-server, הוא כנראה שבור", "s1c", -5,
            "kubectl top just worked — metrics-server is fine. Restarting it costs time and proves nothing.",
            "kubectl top עבד הרגע – metrics-server תקין. ה-restart עולה זמן ולא מוכיח כלום.")
        ]
      },
      s1b: {
        text: t("15 pods running, p99 down to 650ms. Better, but traffic keeps growing and the HPA still shows <code>&lt;unknown&gt;</code>.",
                "15 pods רצים, p99 ירד ל-650ms. יותר טוב, אבל התעבורה ממשיכה לעלות וה-HPA עדיין מראה <code>&lt;unknown&gt;</code>."),
        choices: [
          c("Now describe the HPA", "עכשיו describe ל-HPA", "s2", 10,
            "Good sequence: stop the bleeding, then diagnose.",
            "רצף טוב: עוצרים את הדימום, ואז מאבחנים.")
        ]
      },
      s1c: {
        text: t("metrics-server is back after 40 seconds. <code>kubectl top</code> works exactly as before. The HPA still says <code>&lt;unknown&gt;/70%</code>.",
                "metrics-server חזר אחרי 40 שניות. <code>kubectl top</code> עובד בדיוק כמו קודם. ה-HPA עדיין אומר <code>&lt;unknown&gt;/70%</code>."),
        choices: [
          c("Describe the HPA", "describe ל-HPA", "s2", 5,
            "If <code>kubectl top</code> works, metrics exist — the problem is how the HPA computes utilization.",
            "אם <code>kubectl top</code> עובד, יש מטריקות – הבעיה היא איך ה-HPA מחשב utilization.")
        ]
      },
      s2: {
        text: t("The HPA has been blind for almost two days — since Tuesday's release.",
                "ה-HPA עיוור כבר כמעט יומיים – מאז הריליס של יום שלישי."),
        data: `$ kubectl describe hpa api -n api
Conditions:
  Type            Status  Reason                   Message
  ----            ------  ------                   -------
  AbleToScale     True    SucceededGetScale        the HPA controller was able to get the target's current scale
  ScalingActive   False   FailedGetResourceMetric  the HPA was unable to compute the replica count: failed to get
                                                   cpu utilization: missing request for cpu in container "api"
                                                   of Pod "api-7c9d5b8f6-4kq2m"
Events:
  Warning  FailedGetResourceMetric  2m (x1714 over 45h)  horizontal-pod-autoscaler  failed to get cpu utilization:
           missing request for cpu in container "api" of Pod "api-7c9d5b8f6-4kq2m"`,
        choices: [
          c("Look at the pod's container resources", "להסתכל על ה-resources של הקונטיינרים ב-pod", "s3", 15,
            "Right: utilization = usage / request. No request, no percentage.",
            "נכון: utilization = usage חלקי request. אין request, אין אחוזים."),
          c("Switch the HPA to a memory target instead", "להחליף את ה-HPA ליעד של memory", "s2b", -10,
            "Memory utilization also needs requests, and memory rarely tracks request load for this kind of API. You'd change the policy without fixing anything.",
            "גם memory utilization צריך requests, וזיכרון כמעט לא עוקב אחרי עומס בקשות ב-API כזה. שינית את המדיניות בלי לתקן כלום.")
        ]
      },
      s2b: {
        text: t("The new HPA shows <code>memory: &lt;unknown&gt;/70%</code> — same error, different resource.",
                "ה-HPA החדש מראה <code>memory: &lt;unknown&gt;/70%</code> – אותה שגיאה, משאב אחר."),
        choices: [
          c("Revert it and inspect the pod's resources", "להחזיר ולבדוק את ה-resources של ה-pod", "s3", 5,
            "Back on track.",
            "חזרה למסלול.")
        ]
      },
      s3: {
        text: t("The app container has no resources at all. The Istio sidecar does.",
                "לקונטיינר של האפליקציה אין resources בכלל. ל-sidecar של Istio יש."),
        data: `$ kubectl get pod api-7c9d5b8f6-4kq2m -n api -o jsonpath='{range .spec.containers[*]}{.name}{"\\t"}{.resources}{"\\n"}{end}'
api           {}
istio-proxy   {"limits":{"cpu":"2","memory":"1Gi"},"requests":{"cpu":"100m","memory":"128Mi"}}

$ helm history api -n api | tail -3
REVISION  UPDATED                   STATUS      CHART       APP VERSION  DESCRIPTION
41        Thu Nov  5 10:02:11 2026  superseded  api-2.9.3   2.17.4       Upgrade complete
42        Tue Nov 10 11:47:36 2026  deployed    api-3.0.0   2.18.0       Upgrade complete`,
        choices: [
          c("Compare the values and chart between revision 41 and 42", "להשוות את ה-values וה-chart בין revision 41 ל-42", "s4", 15,
            "The chart major version changed in revision 42 — the most likely place for a values key to stop being rendered.",
            "גרסת ה-major של ה-chart השתנתה ב-revision 42 – המקום הכי סביר שבו מפתח ב-values הפסיק להיות מרונדר."),
          c("The sidecar has requests, so this must be an HPA bug — open an upstream issue", "ל-sidecar יש requests, אז זה כנראה באג ב-HPA – לפתוח issue ב-upstream", "s3b", -10,
            "Not a bug: for resource utilization the HPA needs a request on <em>every</em> container in the pod (it sums usage and requests). One container without requests breaks the whole calculation.",
            "זה לא באג: בשביל resource utilization ה-HPA צריך request על <em>כל</em> קונטיינר ב-pod (הוא סוכם usage ו-requests). קונטיינר אחד בלי requests שובר את כל החישוב.")
        ]
      },
      s3b: {
        text: t("A colleague points you to the HPA docs: every container needs requests (or use a <code>ContainerResource</code> metric for a single container). Back to the release.",
                "קולגה מפנה אותך לתיעוד של HPA: כל קונטיינר צריך requests (או להשתמש במטריקה מסוג <code>ContainerResource</code> לקונטיינר בודד). חוזרים לריליס."),
        choices: [
          c("Diff the Helm values and chart between revisions", "לעשות diff ל-values ול-chart של Helm בין ה-revisions", "s4", 5,
            "Good.",
            "טוב.")
        ]
      },
      s4: {
        text: t("Found it. Chart 3.0.0 moved resources under <code>api.resources</code>; your values file still sets the old top-level <code>resources</code> key, which the new templates silently ignore.",
                "מצאת. Chart 3.0.0 העביר את ה-resources אל <code>api.resources</code>; קובץ ה-values שלכם עדיין מגדיר את המפתח הישן <code>resources</code> ברמה העליונה, והתבניות החדשות מתעלמות ממנו בשקט."),
        data: `$ helm get values api -n api --revision 42
image:
  tag: 2.18.0
resources:              # <- chart 3.x no longer reads this key
  requests: { cpu: 500m, memory: 512Mi }
  limits: { memory: 1Gi }

$ helm show values oci://ghcr.io/acme/charts/api --version 3.0.0 | grep -n -B1 -A2 'resources'
13:api:
14:  resources: {}
15:  # BREAKING (3.0.0): resources moved from .resources to .api.resources`,
        choices: [
          c("Move the values under api.resources in Git and roll out through the normal pipeline", "להעביר את ה-values אל api.resources ב-Git ולפרוס דרך ה-pipeline הרגיל", "s5", 15,
            "Fix at the source of truth. The pipeline renders, diffs and deploys; the new pods get requests and the HPA wakes up.",
            "תיקון במקור האמת. ה-pipeline מרנדר, עושה diff ופורס; ה-pods החדשים מקבלים requests וה-HPA מתעורר."),
          c("kubectl set resources deploy/api -c api --requests=cpu=500m,memory=512Mi right now", "kubectl set resources deploy/api -c api --requests=cpu=500m,memory=512Mi עכשיו", "s4b", 5,
            "It works immediately — and creates drift. The next helm upgrade renders the chart again without requests.",
            "זה עובד מיד – ויוצר drift. ה-helm upgrade הבא ירנדר שוב את ה-chart בלי requests.")
        ]
      },
      s4b: {
        text: t("The HPA starts scaling. 35 minutes later another engineer ships a config change through the Helm pipeline; requests disappear again and the HPA is back to <code>&lt;unknown&gt;</code>.",
                "ה-HPA מתחיל לגדול. 35 דקות אחר כך מהנדס אחר מעלה שינוי config דרך ה-pipeline של Helm; ה-requests נעלמים שוב וה-HPA חוזר ל-<code>&lt;unknown&gt;</code>."),
        choices: [
          c("Fix the values file in Git properly", "לתקן את קובץ ה-values ב-Git כמו שצריך", "s5", 5,
            "Live patches on Helm/GitOps-managed objects last until the next deploy. Always land the fix in the source.",
            "Patches חיים על אובייקטים שמנוהלים ב-Helm/GitOps מחזיקים עד ה-deploy הבא. תמיד מכניסים את התיקון למקור.")
        ]
      },
      s5: {
        text: t("The HPA is alive: <code>cpu: 185%/70%</code>, scaling 3 → 8 → 16 replicas. p99 is falling. Now: how do you make sure a chart upgrade can't silently blind the HPA again?",
                "ה-HPA חי: <code>cpu: 185%/70%</code>, גדל 3 → 8 → 16 replicas. ה-p99 יורד. עכשיו: איך מוודאים ששדרוג chart לא יעוור שוב את ה-HPA בשקט?"),
        data: `$ kubectl get hpa api -n api -w
NAME   REFERENCE        TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
api    Deployment/api   cpu: 185%/70%   3         30        3          41d
api    Deployment/api   cpu: 162%/70%   3         30        8          41d
api    Deployment/api   cpu: 88%/70%    3         30        16         41d
api    Deployment/api   cpu: 64%/70%    3         30        16         41d`,
        choices: [
          c("Kyverno policy requiring requests, alert on HPA ScalingActive=false, and a CI step that renders the chart and checks requests", "Kyverno policy שמחייב requests, התראה על HPA עם ScalingActive=false, ושלב ב-CI שמרנדר את ה-chart ובודק requests", "win", 15,
            "Defense in depth: admission blocks pods without requests, <code>kube_horizontalpodautoscaler_status_condition{condition=\"ScalingActive\",status=\"false\"} == 1</code> pages before customers notice, and CI catches renamed values keys at PR time.",
            "הגנה בשכבות: admission חוסם pods בלי requests, <code>kube_horizontalpodautoscaler_status_condition{condition=\"ScalingActive\",status=\"false\"} == 1</code> מקפיץ לפני שלקוחות מרגישים, ו-CI תופס מפתחות values ששמם השתנה כבר ב-PR."),
          c("Set minReplicas to 30 permanently so it never matters", "לקבוע minReplicas על 30 לתמיד כדי שזה לא ישנה", "win", -5,
            "Expensive and it masks the next broken HPA instead of detecting it. Capacity planning isn't a substitute for a working autoscaler.",
            "יקר, ומסתיר את ה-HPA השבור הבא במקום לזהות אותו. תכנון קיבולת הוא לא תחליף ל-autoscaler שעובד."),
          c("Delete the HPA and scale manually during campaigns", "למחוק את ה-HPA ולהגדיל ידנית בזמן קמפיינים", "lose", -15,
            "The next unannounced spike happens at 3am with nobody watching. You've replaced automation with a pager.",
            "ה-spike הבא שלא הודיעו עליו יקרה ב-3 בלילה כשאף אחד לא מסתכל. החלפת אוטומציה ב-pager.")
        ]
      },
      win: {
        text: t("Resolved. Root cause: a chart major upgrade moved <code>resources</code> to <code>api.resources</code>, so the app container lost its CPU request and the HPA couldn't compute utilization for two days — unnoticed until traffic tripled. Fixed in Git, with guardrails at admission, CI and alerting.",
                "נפתר. סיבת שורש: שדרוג major של ה-chart העביר את <code>resources</code> אל <code>api.resources</code>, אז הקונטיינר של האפליקציה איבד את ה-CPU request וה-HPA לא הצליח לחשב utilization יומיים – בלי שאף אחד שם לב עד שהתעבורה שולשה. תוקן ב-Git, עם מעקות ב-admission, ב-CI ובהתראות."),
        end: "win"
      },
      lose: {
        text: t("The service survives today but tonight's spike takes it down. Lesson: <code>&lt;unknown&gt;</code> in an HPA is always explained by <code>kubectl describe hpa</code> — usually a missing request on some container or a broken metrics pipeline. Fix it at the source and alert on it.",
                "השירות שורד היום אבל ה-spike של הלילה מפיל אותו. הלקח: <code>&lt;unknown&gt;</code> ב-HPA תמיד מוסבר ע״י <code>kubectl describe hpa</code> – בדרך כלל request חסר באחד הקונטיינרים או pipeline מטריקות שבור. מתקנים במקור ומתריעים על זה."),
        end: "lose"
      }
    },
    lessons: ["k8s-hpa-deep", "k8s-helm-deep", "k8s-resources"]
  });

  /* ------------------------------------------------------------------ 3 */
  window.INFRA.scenarios.push({
    id: "k8s-ingress-502",
    icon: "🚧",
    title: t("502s right after a deploy", "502 מיד אחרי deploy"),
    start: "s1",
    steps: {
      s1: {
        text: t("10:12. Argo CD synced <code>web</code> v2.4.0 at 10:05 and reports it Synced and Healthy. Since then: 'Ingress 5xx ratio 38% for shop.example.com'. Support tickets are arriving.",
                "10:12. Argo CD סנכרן את <code>web</code> v2.4.0 ב-10:05 ומדווח Synced ו-Healthy. מאז: 'Ingress 5xx ratio 38% for shop.example.com'. טיקטים של תמיכה מתחילים להגיע."),
        data: `$ curl -sI https://shop.example.com/ | head -1
HTTP/2 502
$ kubectl get deploy web -n shop
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
web    3/3     3            3           211d
# 5xx ratio: 0.3% before 10:05 → 38% after (rest still served from cache/CDN)`,
        choices: [
          c("Read the ingress-nginx controller logs for this host", "לקרוא את הלוגים של ה-ingress-nginx controller ל-host הזה", "s2", 15,
            "Good: the proxy logs say whether it couldn't connect, got reset, or timed out — each points somewhere different.",
            "טוב: הלוגים של ה-proxy אומרים אם הוא לא הצליח להתחבר, קיבל reset או timeout – כל אחד מצביע למקום אחר."),
          c("Roll back to v2.3.9 in Argo CD first", "קודם לעשות rollback ל-v2.3.9 ב-Argo CD", "s1b", 10,
            "A solid on-call instinct: the incident started with a deploy, so reverting is the fastest mitigation. Root cause still needed — v2.4.0 has to ship.",
            "אינסטינקט on-call טוב: האינסידנט התחיל עם deploy, אז revert הוא ההקלה הכי מהירה. עדיין צריך סיבת שורש – v2.4.0 חייב לעלות."),
          c("Restart the ingress-nginx controller pods", "לעשות restart ל-pods של ה-ingress-nginx controller", "s1c", -10,
            "The controller serves every app in the cluster. Restarting it drops in-flight connections for everyone and doesn't touch the actual problem.",
            "ה-controller משרת כל אפליקציה ב-cluster. Restart מפיל connections פתוחים לכולם ולא נוגע בבעיה האמיתית.")
        ]
      },
      s1b: {
        text: t("10:16. Rollback done, 5xx back to 0.3%. You deploy v2.4.0 to staging — the same 502s appear there. Now find out why before the 14:00 launch.",
                "10:16. ה-rollback הסתיים, 5xx חזר ל-0.3%. פורסים את v2.4.0 ל-staging – אותם 502 מופיעים גם שם. עכשיו צריך להבין למה לפני ההשקה של 14:00."),
        choices: [
          c("Read the ingress controller logs in staging", "לקרוא את הלוגים של ה-ingress controller ב-staging", "s2", 5,
            "Mitigate, then diagnose — in a place where it's safe.",
            "מקלים, ואז מאבחנים – במקום שבטוח לעשות את זה.")
        ]
      },
      s1c: {
        text: t("The controller pods restarted. A burst of errors hit every app behind it, then the 502 ratio for shop.example.com settles right back at 38%.",
                "ה-pods של ה-controller עלו מחדש. גל שגיאות פגע בכל האפליקציות מאחוריו, ואז אחוז ה-502 של shop.example.com חוזר בדיוק ל-38%."),
        choices: [
          c("Read the controller logs", "לקרוא את הלוגים של ה-controller", "s2", 0,
            "Logs first next time.",
            "בפעם הבאה – לוגים קודם.")
        ]
      },
      s2: {
        text: t("The error log is unambiguous.", "ה-error log חד-משמעי."),
        data: `$ kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --since=10m | grep shop-web | tail -2
2026/11/12 10:13:02 [error] 1187#1187: *88231 connect() failed (111: Connection refused) while connecting
  to upstream, client: 10.0.1.5, server: shop.example.com, request: "GET / HTTP/2.0",
  upstream: "http://10.0.3.41:8080/", host: "shop.example.com"
2026/11/12 10:13:02 [error] 1187#1187: *88233 connect() failed (111: Connection refused) while connecting
  to upstream, upstream: "http://10.0.4.17:8080/"`,
        choices: [
          c("Check the Service, its EndpointSlices and the pods", "לבדוק את ה-Service, ה-EndpointSlices שלו וה-pods", "s3", 15,
            "Errno 111 means the pod's IP answered but nothing listens on that port. The next question is: which port does the Service send to, and which port does the app use?",
            "Errno 111 אומר שה-IP של ה-pod ענה אבל אף אחד לא מאזין על הפורט הזה. השאלה הבאה: לאיזה פורט ה-Service שולח, ועל איזה פורט האפליקציה מאזינה?"),
          c("Raise proxy-connect-timeout and proxy-read-timeout on the Ingress", "להעלות proxy-connect-timeout ו-proxy-read-timeout על ה-Ingress", "s2b", -10,
            "Connection <em>refused</em> is an instant rejection, not slowness. Timeouts would show as 504 / errno 110.",
            "Connection <em>refused</em> זו דחייה מיידית, לא איטיות. Timeouts היו מופיעים כ-504 / errno 110.")
        ]
      },
      s2b: {
        text: t("Annotations applied, NGINX reloaded. The 502s don't change at all — they still fail in under 1ms.",
                "ה-annotations הוחלו, NGINX עשה reload. ה-502 לא משתנים בכלל – הם עדיין נכשלים בפחות מ-1ms."),
        choices: [
          c("Revert the timeouts and inspect the Service and endpoints", "להחזיר את ה-timeouts ולבדוק את ה-Service וה-endpoints", "s3", 5,
            "Good — and revert the timeouts, so you don't leave unexplained config behind.",
            "טוב – ולהחזיר את ה-timeouts, כדי לא להשאיר אחריך config לא מוסבר.")
        ]
      },
      s3: {
        text: t("Endpoints exist, the pods are Ready, the Service targets port 8080. Everything looks 'green'.",
                "יש endpoints, ה-pods במצב Ready, ה-Service מכוון לפורט 8080. הכל נראה 'ירוק'."),
        data: `$ kubectl get endpointslices -n shop -l kubernetes.io/service-name=web
NAME        ADDRESSTYPE   PORTS   ENDPOINTS                         AGE
web-8xk2p   IPv4          8080    10.0.3.41,10.0.4.17,10.0.5.22     211d

$ kubectl get pods -n shop -l app=web
NAME                  READY   STATUS    RESTARTS   AGE
web-6d5f7c9b8-4mzxq   1/1     Running   0          9m
web-6d5f7c9b8-7hx2c   1/1     Running   0          8m
web-6d5f7c9b8-tq4rn   1/1     Running   0          8m

$ kubectl get svc web -n shop -o jsonpath='{.spec.ports}'
[{"name":"http","port":80,"protocol":"TCP","targetPort":8080}]`,
        choices: [
          c("Check what port the app actually listens on (kubectl debug + ss) and diff the release", "לבדוק על איזה פורט האפליקציה באמת מאזינה (kubectl debug + ss) ולעשות diff לריליס", "s4", 15,
            "Ready only proves the readiness probe passed — on whatever port the probe checks. Verify the data path yourself.",
            "Ready רק מוכיח שה-readiness probe עבר – על הפורט שה-probe בודק. מאמתים את מסלול הנתונים בעצמך."),
          c("Pods are Ready and endpoints exist, so it's the network — escalate to the CNI team", "ה-pods ב-Ready ויש endpoints, אז זו הרשת – להסלים לצוות ה-CNI", "s3b", -10,
            "A network problem would look like timeouts, not instant refusals from the pod IP. 'Refused' means the packet arrived.",
            "בעיית רשת הייתה נראית כמו timeouts, לא כמו דחיות מיידיות מה-IP של ה-pod. 'Refused' אומר שה-packet הגיע.")
        ]
      },
      s3b: {
        text: t("The network team runs a quick test: <code>curl 10.0.3.41:8080</code> → refused, <code>curl 10.0.3.41:3000</code> → 200 OK. 'Your app is on 3000.'",
                "צוות הרשת מריץ בדיקה מהירה: <code>curl 10.0.3.41:8080</code> → refused, <code>curl 10.0.3.41:3000</code> → 200 OK. 'האפליקציה שלך על 3000.'"),
        choices: [
          c("Diff the v2.4.0 chart changes", "לעשות diff לשינויים ב-chart של v2.4.0", "s4", 5,
            "Lesson learned the slow way: test the port yourself with netshoot.",
            "לקח שנלמד בדרך האיטית: בודקים את הפורט בעצמך עם netshoot.")
        ]
      },
      s4: {
        text: t("v2.4.0 migrated the app to a new framework that listens on 3000. The chart updated <code>containerPort</code> and the readiness probe (via the named port <code>http</code>), but the Service template still hard-codes <code>targetPort: 8080</code>. Probes pass on 3000, traffic goes to 8080.",
                "v2.4.0 העביר את האפליקציה ל-framework חדש שמאזין על 3000. ה-chart עדכן את <code>containerPort</code> ואת ה-readiness probe (דרך ה-named port <code>http</code>), אבל ה-template של ה-Service עדיין מקבע <code>targetPort: 8080</code>. ה-probes עוברים על 3000, התעבורה הולכת ל-8080."),
        data: `$ kubectl debug -it web-6d5f7c9b8-4mzxq -n shop --image=nicolaka/netshoot --target=web -- ss -lntp
State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port  Process
LISTEN  0       511            0.0.0.0:3000        0.0.0.0:*      users:(("node",pid=1,fd=21))

$ git diff v2.3.9 v2.4.0 -- chart/
-        - name: http
-          containerPort: 8080
+        - name: http
+          containerPort: 3000
-      readinessProbe: { httpGet: { path: /healthz, port: 8080 } }
+      readinessProbe: { httpGet: { path: /health/ready, port: http } }
 # templates/service.yaml (unchanged)
     targetPort: 8080`,
        choices: [
          c("Change the Service to targetPort: http (named port) in the chart and ship it through the pipeline", "לשנות ב-chart את ה-Service ל-targetPort: http (named port) ולשחרר דרך ה-pipeline", "s5", 15,
            "The durable fix: a named targetPort follows whatever the container declares, so the next port change can't split probe and traffic again.",
            "התיקון העמיד: targetPort עם שם עוקב אחרי מה שהקונטיינר מצהיר, כך ששינוי הפורט הבא לא יפצל שוב בין ה-probe לתעבורה."),
          c("kubectl patch the Service to targetPort 3000 now, then fix the chart", "kubectl patch ל-Service ל-targetPort 3000 עכשיו, ואז לתקן את ה-chart", "s5", 10,
            "Fast relief — but Argo CD self-heal will revert the live patch within minutes unless you pause auto-sync or land the chart fix immediately.",
            "הקלה מהירה – אבל ה-self-heal של Argo CD יחזיר את ה-patch החי תוך דקות אם לא עוצרים auto-sync או מכניסים מיד את תיקון ה-chart."),
          c("The probe change is what's new — revert the readinessProbe to /healthz on 8080", "השינוי ב-probe הוא החדש – להחזיר את ה-readinessProbe ל-/healthz על 8080", "s4b", -15,
            "The probe was the one thing that was correct. Pointing it at a port nobody listens on makes every pod NotReady.",
            "ה-probe היה הדבר היחיד שהיה נכון. לכוון אותו לפורט שאף אחד לא מאזין עליו הופך כל pod ל-NotReady.")
        ]
      },
      s4b: {
        text: t("All three pods go 0/1 READY. The EndpointSlice empties and the site now returns <strong>503</strong> to 100% of users.",
                "כל שלושת ה-pods עוברים ל-0/1 READY. ה-EndpointSlice מתרוקן והאתר מחזיר עכשיו <strong>503</strong> ל-100% מהמשתמשים."),
        data: `Warning  Unhealthy  kubelet  Readiness probe failed: Get "http://10.0.3.41:8080/healthz":
         dial tcp 10.0.3.41:8080: connect: connection refused
$ kubectl get endpointslices -n shop -l kubernetes.io/service-name=web
NAME        ADDRESSTYPE   PORTS     ENDPOINTS   AGE
web-8xk2p   IPv4          <unset>   <unset>     211d
$ curl -sI https://shop.example.com/ | head -1
HTTP/2 503`,
        choices: [
          c("Revert the probe change and fix the Service targetPort instead", "להחזיר את השינוי ב-probe ולתקן במקום זה את ה-targetPort של ה-Service", "s5", 5,
            "Notice the signal change: 502 (endpoints exist, wrong port) became 503 (no ready endpoints). The status code told you which layer moved.",
            "שים לב לשינוי בסיגנל: 502 (יש endpoints, פורט שגוי) הפך ל-503 (אין endpoints מוכנים). קוד הסטטוס אמר לך איזו שכבה זזה."),
          c("Remove the readinessProbe entirely so the endpoints come back", "להסיר לגמרי את ה-readinessProbe כדי שה-endpoints יחזרו", "lose", -20,
            "Endpoints return — pointing at port 8080 where nothing listens, so it's 502 again. And now pods receive traffic before they're warm on every future rollout.",
            "ה-endpoints חוזרים – מצביעים על פורט 8080 שאף אחד לא מאזין עליו, אז שוב 502. ומעכשיו pods יקבלו תעבורה לפני שהם מוכנים בכל rollout עתידי.")
        ]
      },
      s5: {
        text: t("11:02. 502 ratio back to ~0. But the dashboard shows small bursts of 502 during every rollout, even before today.",
                "11:02. אחוז ה-502 חזר לקרוב ל-0. אבל ה-dashboard מראה גלים קטנים של 502 בכל rollout, גם לפני היום."),
        data: `[error] upstream prematurely closed connection while reading response header from upstream,
        upstream: "http://10.0.4.17:3000/api/cart"     (only during rollouts, ~40 errors each)
pod spec: no preStop hook, terminationGracePeriodSeconds: 30`,
        choices: [
          c("Add a preStop sleep (~10s), graceful shutdown in the app, and terminationGracePeriodSeconds 45", "להוסיף preStop sleep (~10 שניות), graceful shutdown באפליקציה, ו-terminationGracePeriodSeconds 45", "s6", 15,
            "Endpoint removal and SIGTERM race. The sleep keeps the old pod serving while NGINX drops it from its upstream list; then the app drains in-flight requests.",
            "יש race בין הוצאת ה-endpoint ל-SIGTERM. ה-sleep משאיר את ה-pod הישן משרת בזמן ש-NGINX מוציא אותו מרשימת ה-upstreams; אחר כך האפליקציה מסיימת בקשות פתוחות."),
          c("Increase replicas to 20 so each pod gets less traffic", "להגדיל ל-20 replicas כדי שכל pod יקבל פחות תעבורה", "s6", -5,
            "Fewer errors per pod, same race on every pod. You pay for 17 extra pods and keep the bug.",
            "פחות שגיאות לכל pod, אותו race בכל pod. משלמים על 17 pods נוספים ומשאירים את הבאג.")
        ]
      },
      s6: {
        text: t("v2.4.0 is live and clean. What do you add so a port mismatch never reaches production again?",
                "v2.4.0 באוויר ונקי. מה מוסיפים כדי שאי-התאמת פורטים לא תגיע שוב לפרודקשן?"),
        choices: [
          c("CI: render the chart and assert Service targetPort is a named container port; canary with Argo Rollouts analysis on 5xx; alert on per-host 5xx ratio", "CI: לרנדר את ה-chart ולוודא שה-targetPort של ה-Service הוא named port של הקונטיינר; canary עם analysis של Argo Rollouts על 5xx; התראה על אחוז 5xx לכל host", "win", 15,
            "A canary would have shown 38% errors on 5% of traffic and rolled back automatically — before most users noticed.",
            "Canary היה מראה 38% שגיאות על 5% מהתעבורה ועושה rollback אוטומטי – לפני שרוב המשתמשים היו שמים לב."),
          c("Freeze deploys on Fridays", "להקפיא deploys בימי שישי", "win", 0,
            "This happened on a Thursday. Freezes reduce exposure, they don't catch bugs.",
            "זה קרה ביום חמישי. הקפאות מקטינות חשיפה, הן לא תופסות באגים.")
        ]
      },
      win: {
        text: t("Resolved. Root cause: the app moved to port 3000; the probe used the named port and passed, but the Service hard-coded <code>targetPort: 8080</code>, so NGINX got <em>connection refused</em> → 502. Remember the codes: 503 = no ready endpoints, 502 = endpoint answered badly, 504 = too slow.",
                "נפתר. סיבת שורש: האפליקציה עברה לפורט 3000; ה-probe השתמש ב-named port ועבר, אבל ה-Service קיבע <code>targetPort: 8080</code>, אז NGINX קיבל <em>connection refused</em> → 502. זכור את הקודים: 503 = אין endpoints מוכנים, 502 = ה-endpoint ענה לא טוב, 504 = איטי מדי."),
        end: "win"
      },
      lose: {
        text: t("The site is down for 25 minutes and the rollback is now messy. Lesson: 'Ready' only means the probe passed on the port the probe checks. When the proxy says <em>connection refused</em>, compare Service targetPort with what the process actually listens on — and never remove readiness to 'get endpoints back'.",
                "האתר למטה 25 דקות וה-rollback עכשיו מסובך. הלקח: 'Ready' אומר רק שה-probe עבר על הפורט שה-probe בודק. כשה-proxy אומר <em>connection refused</em>, משווים את ה-targetPort של ה-Service למה שהתהליך באמת מאזין עליו – ולעולם לא מסירים readiness כדי 'להחזיר endpoints'."),
        end: "lose"
      }
    },
    lessons: ["k8s-ingress-certs-dns", "k8s-probes", "k8s-troubleshooting-playbook"]
  });

  /* ------------------------------------------------------------------ 4 */
  window.INFRA.scenarios.push({
    id: "k8s-argocd-drift",
    icon: "🔁",
    title: t("Argo CD OutOfSync & Degraded: drift fights and a stuck migration", "Argo CD ב-OutOfSync ו-Degraded: מלחמת drift ו-migration תקוע"),
    start: "s1",
    steps: {
      s1: {
        text: t("09:20. Argo CD notification: <code>payments</code> is OutOfSync and Degraded. Release v57 merged at 09:00. Slack from Dana, last night's on-call: 'At 3am payments-api was OOMing so I bumped memory with kubectl edit. It keeps going back to 512Mi and OOMing again?!'",
                "09:20. התראה מ-Argo CD: <code>payments</code> ב-OutOfSync וב-Degraded. ריליס v57 נכנס ל-main ב-09:00. הודעה ב-Slack מדנה, ה-on-call של הלילה: 'ב-3 בלילה payments-api עשה OOM אז הגדלתי memory עם kubectl edit. זה כל הזמן חוזר ל-512Mi ושוב OOM?!'"),
        data: `$ argocd app get payments
Name:          argocd/payments
Sync Policy:   Automated (Prune)  SelfHeal: true
Sync Status:   OutOfSync from main (a1c9e3f)
Health Status: Degraded

GROUP  KIND        NAMESPACE  NAME              STATUS     HEALTH    MESSAGE
       Service     payments   payments-api      Synced     Healthy
apps   Deployment  payments   payments-api      OutOfSync  Degraded  Deployment "payments-api" exceeded its progress deadline
batch  Job         payments   payments-migrate  OutOfSync  Healthy   (completed 6d ago, release v56)`,
        choices: [
          c("Run argocd app diff payments and look at the failing pods", "להריץ argocd app diff payments ולהסתכל על ה-pods שנכשלים", "s2", 15,
            "Diff shows exactly where live and Git disagree; pod logs show why it's Degraded. Two separate questions.",
            "ה-diff מראה בדיוק איפה ה-live וה-Git לא מסכימים; הלוגים של ה-pods מראים למה הוא Degraded. שתי שאלות נפרדות."),
          c("Disable selfHeal and kubectl edit the memory again", "לבטל selfHeal ולעשות שוב kubectl edit לזיכרון", "s1b", -10,
            "You'd win the fight with the controller by turning off the referee. Git still says 512Mi; the next sync reverts you again.",
            "תנצח במלחמה מול ה-controller ע״י כיבוי השופט. Git עדיין אומר 512Mi; ה-sync הבא יחזיר אותך שוב."),
          c("argocd app delete payments and recreate it to reset the state", "argocd app delete payments וליצור מחדש כדי לאפס את ה-state", "lose", -25,
            "The Application has the resources finalizer: deleting it cascades and deletes every resource it manages — Deployment, Service, Secrets. Payments goes down.",
            "ל-Application יש את ה-resources finalizer: המחיקה מבצעת cascade ומוחקת כל משאב שהיא מנהלת – Deployment, Service, Secrets. Payments נופל.")
        ]
      },
      s1b: {
        text: t("Memory is 1Gi again and the OOMs stop — but the app is still Degraded (new pods crash on startup), and now prod silently differs from Git. Whoever syncs next reverts it.",
                "הזיכרון שוב 1Gi וה-OOMs נעצרים – אבל האפליקציה עדיין Degraded (pods חדשים קורסים בעלייה), ועכשיו פרודקשן שונה מ-Git בשקט. מי שיעשה sync הבא יחזיר את זה."),
        choices: [
          c("Look at the diff and the crashing pods properly", "להסתכל כמו שצריך על ה-diff ועל ה-pods שקורסים", "s2", 0,
            "Back to evidence.",
            "חזרה לראיות.")
        ]
      },
      s2: {
        text: t("Two different problems: the memory drift, and new v57 pods crashing.",
                "שתי בעיות שונות: ה-drift בזיכרון, ו-pods חדשים של v57 שקורסים."),
        data: `$ argocd app diff payments
===== apps/Deployment payments/payments-api ======
 resources:
   limits:
-    memory: 1Gi          # live (kubectl edit by dana, 03:04)
+    memory: 512Mi        # desired (Git)

$ kubectl logs -n payments deploy/payments-api --tail=3
2026-11-12T09:18:44Z INFO  starting payments-api v57
2026-11-12T09:18:45Z ERROR pq: column "currency_code" of relation "payments" does not exist
2026-11-12T09:18:45Z FATAL failed to warm up statement cache, exiting`,
        choices: [
          c("Open a PR that raises the memory limit in Git (with Dana's numbers) and merge it", "לפתוח PR שמעלה את ה-memory limit ב-Git (עם המספרים של דנה) ולמזג", "s3", 15,
            "Git becomes right, self-heal stops fighting, and the change is reviewed and recorded. Emergency changes go through Git too — just faster.",
            "Git הופך לנכון, ה-self-heal מפסיק להילחם, והשינוי עובר review ומתועד. גם שינויי חירום עוברים דרך Git – פשוט מהר יותר."),
          c("Pause auto-sync for payments, then fix memory in Git", "לעצור auto-sync ל-payments, ואז לתקן את הזיכרון ב-Git", "s3", 10,
            "Pausing auto-sync is a legitimate break-glass step — as long as it's temporary and the fix lands in Git.",
            "עצירת auto-sync היא צעד break-glass לגיטימי – כל עוד זה זמני והתיקון נכנס ל-Git."),
          c("Add ignoreDifferences for resources so Argo stops reverting", "להוסיף ignoreDifferences ל-resources כדי ש-Argo יפסיק להחזיר", "s3", -10,
            "Now Argo is blind to resources forever — the next real change in Git won't apply either. You've hidden drift instead of fixing it.",
            "עכשיו Argo עיוור ל-resources לנצח – גם השינוי האמיתי הבא ב-Git לא ייושם. הסתרת drift במקום לתקן אותו.")
        ]
      },
      s3: {
        text: t("Memory is fixed. Still Degraded: v57 pods crash because the schema migration hasn't run. Why hasn't the migration Job run?",
                "הזיכרון תוקן. עדיין Degraded: ה-pods של v57 קורסים כי ה-migration של ה-schema לא רץ. למה ה-Job של ה-migration לא רץ?"),
        data: `$ kubectl get deploy,job -n payments -o custom-columns='KIND:.kind,NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave'
KIND         NAME               WAVE
Deployment   payments-api       0
Job          payments-migrate   5

$ argocd app get payments --show-operation | grep -A3 Operation
Operation:   Sync
Phase:       Running
Message:     waiting for healthy state of apps/Deployment/payments-api`,
        choices: [
          c("Make the Job a PreSync hook with BeforeHookCreation delete policy (Helm: pre-upgrade + before-hook-creation)", "להפוך את ה-Job ל-PreSync hook עם delete policy של BeforeHookCreation (ב-Helm: pre-upgrade + before-hook-creation)", "s5", 15,
            "Argo applies waves in order and waits for each to be healthy. Wave 0 (the app) can't get healthy without the schema from wave 5 — a deadlock. PreSync runs the migration before anything else, and BeforeHookCreation deletes last release's completed Job first.",
            "Argo מחיל waves לפי הסדר ומחכה שכל אחד יהיה healthy. Wave 0 (האפליקציה) לא יכול להיות healthy בלי ה-schema מ-wave 5 – deadlock. PreSync מריץ את ה-migration לפני כל השאר, ו-BeforeHookCreation מוחק קודם את ה-Job שהסתיים מהריליס הקודם."),
          c("Move the Job to sync-wave \"-1\"", "להעביר את ה-Job ל-sync-wave \"-1\"", "s4", 10,
            "Right idea — the migration must come first. But the Job is a plain resource with the same name as last release's completed Job…",
            "רעיון נכון – ה-migration חייב לבוא קודם. אבל ה-Job הוא משאב רגיל עם אותו שם כמו ה-Job שהסתיים בריליס הקודם…"),
          c("argocd app rollback payments to the v56 revision", "argocd app rollback payments ל-revision של v56", "s3b", -5,
            "Argo refuses: rollback isn't allowed while automated sync is enabled — auto-sync would immediately re-apply Git's v57 anyway.",
            "Argo מסרב: rollback לא מותר כש-automated sync מופעל – ה-auto-sync היה ממילא מחיל שוב מיד את v57 מ-Git.")
        ]
      },
      s3b: {
        text: t("<code>FATA[0001] rpc error: code = FailedPrecondition desc = rollback cannot be initiated when auto-sync is enabled</code>. In GitOps, 'rollback' means reverting the commit.",
                "<code>FATA[0001] rpc error: code = FailedPrecondition desc = rollback cannot be initiated when auto-sync is enabled</code>. ב-GitOps, 'rollback' זה לעשות revert ל-commit."),
        choices: [
          c("Fix the ordering instead: make the migration a PreSync hook", "לתקן במקום זה את הסדר: להפוך את ה-migration ל-PreSync hook", "s5", 5,
            "Fix forward in Git.",
            "Fix forward ב-Git.")
        ]
      },
      s4: {
        text: t("The sync now applies the Job first — and fails.", "ה-sync מחיל עכשיו את ה-Job קודם – ונכשל."),
        data: `Phase:    Failed
Message:  one or more objects failed to apply, reason: Job.batch "payments-migrate" is invalid:
          spec.template: Invalid value: core.PodTemplateSpec{...image:"ghcr.io/acme/payments-migrate:v57"...}:
          field is immutable`,
        choices: [
          c("Turn it into a PreSync hook with BeforeHookCreation (or suffix the Job name with the release)", "להפוך אותו ל-PreSync hook עם BeforeHookCreation (או להוסיף לשם ה-Job את מספר הריליס)", "s5", 10,
            "A Job's pod template is immutable. Hooks with BeforeHookCreation delete-and-recreate it every release; a unique name per release works too.",
            "ה-pod template של Job הוא immutable. Hooks עם BeforeHookCreation מוחקים ויוצרים אותו מחדש בכל ריליס; גם שם ייחודי לכל ריליס עובד."),
          c("kubectl delete job payments-migrate and sync again", "kubectl delete job payments-migrate ולעשות sync שוב", "s5", 5,
            "Unblocks today; the same error returns on v58. Fix the pattern, not the instance.",
            "משחרר היום; אותה שגיאה תחזור ב-v58. מתקנים את הדפוס, לא את המקרה.")
        ]
      },
      s5: {
        text: t("09:58. The migration ran first, the new pods start cleanly. Synced and Healthy. Before closing: how do you stop the 3am kubectl-edit vs self-heal fight from repeating?",
                "09:58. ה-migration רץ ראשון, ה-pods החדשים עולים נקי. Synced ו-Healthy. לפני הסגירה: איך מונעים את מלחמת kubectl edit מול self-heal של 3 בלילה מלחזור?"),
        data: `$ argocd app get payments | head -6
Sync Status:   Synced to main (7f3b2d1)
Health Status: Healthy
HOOK     KIND  NAME              STATUS     MESSAGE
PreSync  Job   payments-migrate  Succeeded  Reached expected number of succeeded pods`,
        choices: [
          c("Read-only RBAC for humans in prod + audited break-glass role, a 'fix forward in Git' emergency runbook, and Argo notifications on OutOfSync > 10m — keep selfHeal", "RBAC של קריאה בלבד לבני אדם בפרודקשן + role של break-glass עם audit, runbook חירום של 'fix forward ב-Git', והתראות Argo על OutOfSync מעל 10 דקות – ולהשאיר selfHeal", "win", 15,
            "Self-heal did its job: it enforced Git. The process gap was that the emergency change never reached Git. Make the right path the easy path at 3am.",
            "ה-self-heal עשה את העבודה שלו: אכף את Git. הפער היה בתהליך – שינוי החירום אף פעם לא הגיע ל-Git. הופכים את הדרך הנכונה לדרך הקלה גם ב-3 בלילה."),
          c("Turn selfHeal off permanently so on-call can kubectl edit at night", "לכבות selfHeal לתמיד כדי שה-on-call יוכל לעשות kubectl edit בלילה", "win", -10,
            "You'd accumulate silent drift until Git no longer describes production — and lose the ability to rebuild the cluster from Git.",
            "תצברו drift שקט עד ש-Git כבר לא יתאר את הפרודקשן – ותאבדו את היכולת לבנות את ה-cluster מחדש מ-Git.")
        ]
      },
      win: {
        text: t("Resolved. Two root causes: an emergency <code>kubectl edit</code> that never reached Git (self-heal kept reverting it), and a migration Job in a later sync wave than the app that needs it — a deadlock, since Argo waits for each wave to be healthy. Fixed forward in Git with a PreSync hook.",
                "נפתר. שתי סיבות שורש: <code>kubectl edit</code> של חירום שאף פעם לא הגיע ל-Git (ה-self-heal המשיך להחזיר אותו), ו-Job של migration ב-sync wave מאוחר יותר מהאפליקציה שצריכה אותו – deadlock, כי Argo מחכה שכל wave יהיה healthy. תוקן קדימה ב-Git עם PreSync hook."),
        end: "win"
      },
      lose: {
        text: t("Payments is down: deleting the Argo CD Application cascaded to every resource it managed. Lesson: in GitOps, fix the desired state in Git; never delete an Application with the resources finalizer unless you mean to delete the app (or use <code>--cascade=false</code>).",
                "Payments למטה: מחיקת ה-Application ב-Argo CD עשתה cascade לכל משאב שהיא ניהלה. הלקח: ב-GitOps מתקנים את ה-desired state ב-Git; אף פעם לא מוחקים Application עם resources finalizer אלא אם באמת רוצים למחוק את האפליקציה (או משתמשים ב-<code>--cascade=false</code>)."),
        end: "lose"
      }
    },
    lessons: ["k8s-argocd", "k8s-helm-deep"]
  });

  /* ------------------------------------------------------------------ 5 */
  window.INFRA.scenarios.push({
    id: "k8s-node-diskpressure",
    icon: "💽",
    title: t("DiskPressure: evictions across a node, and a drain that won't finish", "DiskPressure: evictions על node שלם, ו-drain שלא נגמר"),
    start: "s1",
    steps: {
      s1: {
        text: t("03:10. Alerts: 'NodeFilesystemAlmostOutOfSpace ip-10-0-7-12 (/ at 97%)' and 'KubePodNotReady' for 9 pods across three namespaces. All on the same node.",
                "03:10. התראות: 'NodeFilesystemAlmostOutOfSpace ip-10-0-7-12 (/ at 97%)' ו-'KubePodNotReady' ל-9 pods בשלושה namespaces. כולם על אותו node."),
        data: `$ kubectl get pods -A -o wide --field-selector spec.nodeName=ip-10-0-7-12.eu-west-1.compute.internal
NAMESPACE  NAME                          READY  STATUS                  RESTARTS  AGE
shop       cart-7f9c4d8b6-2xkqp          0/1    Evicted                 0         3h
shop       cart-7f9c4d8b6-9wzlm          0/1    ContainerStatusUnknown  1         3h
search     search-api-5d8b7c6f4-tq4rn    0/1    Evicted                 0         2d
search     search-api-5d8b7c6f4-7hx2c    1/1    Running                 0         2d
batch      export-worker-6c4d9f7b8-88lmn 1/1    Running                 0         20h
kafka      kafka-2                       1/1    Running                 0         12d`,
        choices: [
          c("kubectl describe node ip-10-0-7-12", "kubectl describe node ip-10-0-7-12", "s2", 15,
            "Conditions, taints and kubelet events on the node explain why the kubelet is evicting.",
            "ה-conditions, ה-taints וה-events של ה-kubelet על ה-node מסבירים למה ה-kubelet עושה evictions."),
          c("Delete all the Evicted pods to clean up", "למחוק את כל ה-pods שב-Evicted כדי לנקות", "s1b", 0,
            "Cosmetic. Evicted pods are just records; their replacements are already scheduled elsewhere. The disk is still full.",
            "קוסמטי. Pods ב-Evicted הם רק רשומות; המחליפים שלהם כבר מתוזמנים במקום אחר. הדיסק עדיין מלא."),
          c("Terminate the node in the cloud console and let it be replaced", "למחוק את ה-node בקונסולה של הענן ולתת לו להתחלף", "s1b", -10,
            "Abrupt termination skips graceful drain (kafka-2 included) and destroys the evidence. If the cause is a workload, it will follow the pod to the next node.",
            "מחיקה פתאומית מדלגת על drain מסודר (כולל kafka-2) ומשמידה את הראיות. אם הסיבה היא workload, היא תעבור עם ה-pod ל-node הבא.")
        ]
      },
      s1b: {
        text: t("Ten minutes later the node is at 98%. Two more pods get evicted.",
                "עשר דקות אחר כך ה-node על 98%. עוד שני pods עוברים eviction."),
        choices: [
          c("Describe the node", "describe ל-node", "s2", 5,
            "Diagnose before you act.",
            "מאבחנים לפני שפועלים.")
        ]
      },
      s2: {
        text: t("The kubelet is under DiskPressure, tainted the node, and image garbage collection can't free enough. Oddly, it evicted small pods first.",
                "ה-kubelet ב-DiskPressure, שם taint על ה-node, וה-garbage collection של ה-images לא מצליח לפנות מספיק. מוזר: הוא פינה קודם pods קטנים."),
        data: `Conditions:
  DiskPressure   True   KubeletHasDiskPressure   kubelet has disk pressure
Taints:          node.kubernetes.io/disk-pressure:NoSchedule
Events:
  Warning  EvictionThresholdMet  14m  kubelet  Attempting to reclaim ephemeral-storage
  Warning  FreeDiskSpaceFailed   9m   kubelet  Failed to garbage collect required amount of images.
           Attempted to free 6442450944 bytes, but only found 1073741824 bytes eligible to free.

$ kubectl get pod cart-7f9c4d8b6-2xkqp -n shop -o jsonpath='{.status.message}'
The node was low on resource: ephemeral-storage. Threshold quantity: 8589934592, available: 3170304Ki.
Container cart was using 212Ki, request is 0, has larger consumption of ephemeral-storage.
$ kubectl get pod export-worker-6c4d9f7b8-88lmn -n batch -o jsonpath='{.spec.priorityClassName}'
batch-critical`,
        choices: [
          c("Open a node shell (kubectl debug node) and find what's using the disk", "לפתוח shell על ה-node (kubectl debug node) ולמצוא מה תופס את הדיסק", "s3", 15,
            "Eviction ranks pods by (1) usage above requests, (2) <em>priority</em>, (3) usage. Every pod has request 0, so the high-priority export-worker survives while small pods die. Find the real consumer.",
            "ה-eviction מדרג pods לפי (1) שימוש מעל requests, (2) <em>priority</em>, (3) שימוש. לכל ה-pods יש request 0, אז ה-export-worker עם ה-priority הגבוה שורד בזמן ש-pods קטנים מתים. מוצאים את הצרכן האמיתי."),
          c("Lower the kubelet eviction thresholds so it stops evicting", "להוריד את ספי ה-eviction של ה-kubelet כדי שיפסיק לפנות", "s2b", -10,
            "Eviction protects the node. Without it the disk hits 100%, containerd and the kubelet fail, and the node goes NotReady with everything on it.",
            "ה-eviction מגן על ה-node. בלעדיו הדיסק מגיע ל-100%, containerd וה-kubelet נכשלים, וה-node עובר ל-NotReady עם כל מה שעליו.")
        ]
      },
      s2b: {
        text: t("Your platform lead stops the change: 'Thresholds are the only thing keeping kafka-2 alive on that node. Find the hog.'",
                "ה-lead של הפלטפורמה עוצר את השינוי: 'הספים הם הדבר היחיד ששומר על kafka-2 חי על ה-node הזה. תמצא את הזולל.'"),
        choices: [
          c("Open a node shell and look", "לפתוח shell על ה-node ולהסתכל", "s3", 5,
            "Good call by your lead.",
            "החלטה טובה של ה-lead שלך.")
        ]
      },
      s3: {
        text: t("Not container stdout logs (those are rotated) — a 41 GB file inside one container's writable layer.",
                "לא לוגים של stdout של קונטיינרים (אלה עוברים rotation) – קובץ של 41GB בתוך שכבת הכתיבה של קונטיינר אחד."),
        data: `$ kubectl debug node/ip-10-0-7-12.eu-west-1.compute.internal -it --image=ubuntu --profile=sysadmin
root@node:/# chroot /host
# df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   80G   78G  2.4G  98% /
# du -xh --max-depth=2 /var/lib /var/log 2>/dev/null | sort -h | tail -3
1.3G  /var/log/pods
4.1G  /var/lib/kubelet
61G   /var/lib/containerd
# find /var/lib/containerd -xdev -type f -size +5G -exec ls -lh {} +
-rw-r--r-- 1 10001 10001 41G Nov 12 03:12 /var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1873/fs/app/logs/export-debug.log
# crictl ps --name export-worker -q | xargs crictl inspect | grep -m1 snapshotKey
    "snapshotKey": "c41e0b…",   → snapshot 1873
# kubectl -n batch get cm export-worker-config -o jsonpath='{.data.LOG_LEVEL}'   (from your laptop)
debug`,
        choices: [
          c("Set LOG_LEVEL back to info in Git and restart export-worker (the new container gets a fresh layer)", "להחזיר LOG_LEVEL ל-info ב-Git ולעשות restart ל-export-worker (הקונטיינר החדש מקבל שכבה נקייה)", "s4", 15,
            "Restarting the container discards its writable layer — 41 GB freed at once — and the config fix stops the growth.",
            "Restart לקונטיינר זורק את שכבת הכתיבה שלו – 41GB מתפנים בבת אחת – ותיקון ה-config עוצר את הגדילה."),
          c("rm the 41 GB file directly on the host", "rm לקובץ של 41GB ישירות על ה-host", "s3b", -5,
            "The process still has the file open, so the space isn't released until it closes the descriptor. And you've edited a container's filesystem behind the runtime's back.",
            "לתהליך עדיין יש את הקובץ פתוח, אז המקום לא משתחרר עד שהוא סוגר את ה-descriptor. ובנוסף ערכת את ה-filesystem של קונטיינר מאחורי הגב של ה-runtime."),
          c("crictl rmi --prune to delete unused images first", "crictl rmi --prune כדי למחוק קודם images שלא בשימוש", "s3c", 5,
            "Buys a little time, but the kubelet's image GC already tried — and the log grows ~2 GB per hour.",
            "קונה קצת זמן, אבל ה-image GC של ה-kubelet כבר ניסה – והלוג גדל בכ-2GB לשעה.")
        ]
      },
      s3b: {
        text: t("<code>df</code> still shows 98%. <code>lsof +L1</code> lists the deleted-but-open file held by the export-worker process.",
                "<code>df</code> עדיין מראה 98%. <code>lsof +L1</code> מציג את הקובץ שנמחק-אבל-פתוח שהתהליך של export-worker מחזיק."),
        data: `# lsof +L1 | head -2
COMMAND   PID   USER  FD  TYPE  DEVICE  SIZE/OFF      NLINK  NODE    NAME
java    48211  10001  7w   REG   259,1  44023861248      0  918273  /app/logs/export-debug.log (deleted)`,
        choices: [
          c("Fix LOG_LEVEL in Git and restart the pod", "לתקן LOG_LEVEL ב-Git ולעשות restart ל-pod", "s4", 5,
            "Classic Linux lesson: deleting an open file only removes its name; the space returns when the last descriptor closes.",
            "לקח לינוקס קלאסי: מחיקת קובץ פתוח מסירה רק את השם שלו; המקום חוזר כשה-descriptor האחרון נסגר.")
        ]
      },
      s3c: {
        text: t("Freed 9 GB; the node drops to 87% and DiskPressure clears. Forty minutes later it's back at 90% and climbing.",
                "התפנו 9GB; ה-node יורד ל-87% וה-DiskPressure נעלם. ארבעים דקות אחר כך הוא שוב על 90% ומטפס."),
        choices: [
          c("Fix the export-worker log level and restart it", "לתקן את רמת הלוגים של export-worker ולעשות לו restart", "s4", 5,
            "Treat the cause, not the symptom.",
            "מטפלים בסיבה, לא בסימפטום.")
        ]
      },
      s4: {
        text: t("Disk is at 41%. You decide to replace this node anyway (it's on an old AMI with an 80 GB root volume). The drain hangs.",
                "הדיסק על 41%. החלטת להחליף את ה-node הזה בכל מקרה (הוא על AMI ישן עם root volume של 80GB). ה-drain נתקע."),
        data: `$ kubectl drain ip-10-0-7-12.eu-west-1.compute.internal --ignore-daemonsets --delete-emptydir-data --timeout=15m
node/ip-10-0-7-12.eu-west-1.compute.internal cordoned
evicting pod search/search-api-5d8b7c6f4-7hx2c
error when evicting pods/"search-api-5d8b7c6f4-7hx2c" -n "search" (will retry after 5s):
Cannot evict pod as it would violate the pod's disruption budget.

$ kubectl get pdb -n search ; kubectl get deploy search-api -n search
NAME         MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
search-pdb   2               N/A               0                     300d
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
search-api   2/2     2            2           300d`,
        choices: [
          c("Scale search-api to 3 so one disruption is allowed; after the drain, change the PDB to maxUnavailable: 1 with the search team", "להגדיל את search-api ל-3 כך שיהיה disruption אחד מותר; אחרי ה-drain, לשנות את ה-PDB ל-maxUnavailable: 1 יחד עם צוות ה-search", "s5", 15,
            "minAvailable equal to replicas means zero allowed disruptions — forever. Adding a replica lets the eviction proceed without ever dropping below 2.",
            "minAvailable ששווה ל-replicas אומר אפס disruptions מותרים – לנצח. הוספת replica מאפשרת ל-eviction להתקדם בלי לרדת אף פעם מתחת ל-2."),
          c("kubectl drain --disable-eviction to bypass the PDB", "kubectl drain --disable-eviction כדי לעקוף את ה-PDB", "s4b", -10,
            "That deletes pods directly, ignoring every PDB on the node — including kafka-2's.",
            "זה מוחק pods ישירות, ומתעלם מכל PDB על ה-node – כולל של kafka-2."),
          c("Force-delete every pod on the node and terminate it", "force delete לכל ה-pods על ה-node ולמחוק אותו", "lose", -20,
            "kafka-2 dies abruptly while kafka-0 is in a planned restart elsewhere; partitions fall below min.insync.replicas and producers with acks=all start failing.",
            "kafka-2 מת בבת אחת בזמן ש-kafka-0 בדיוק ב-restart מתוכנן במקום אחר; partitions יורדים מתחת ל-min.insync.replicas ו-producers עם acks=all מתחילים להיכשל.")
        ]
      },
      s4b: {
        text: t("The drain completes. search-api briefly runs on one replica (p99 doubles for 2 minutes), and kafka-2 restarts without a controlled shutdown — luckily the other brokers were healthy. You got away with it this time.",
                "ה-drain מסתיים. search-api רץ לרגע על replica אחד (p99 מוכפל לשתי דקות), ו-kafka-2 עולה מחדש בלי controlled shutdown – למזלך שאר ה-brokers היו בריאים. הפעם יצאת מזה."),
        choices: [
          c("Fix the PDB with the search team and move on to prevention", "לתקן את ה-PDB עם צוות ה-search ולעבור למניעה", "s5", 0,
            "Next time, make the PDB allow a disruption instead of bypassing all of them.",
            "בפעם הבאה – לגרום ל-PDB לאפשר disruption במקום לעקוף את כולם.")
        ]
      },
      s5: {
        text: t("04:20. New node on the current AMI, all pods healthy. What goes into the post-mortem action items?",
                "04:20. Node חדש על ה-AMI העדכני, כל ה-pods בריאים. מה נכנס ל-action items של ה-post-mortem?"),
        choices: [
          c("ephemeral-storage requests/limits on workloads, log only to stdout, predict_linear disk alert per node, review PriorityClasses, larger root volumes in the NodeClass", "requests/limits של ephemeral-storage ל-workloads, לוגים רק ל-stdout, התראת דיסק עם predict_linear לכל node, בדיקה של PriorityClasses, root volumes גדולים יותר ב-NodeClass", "win", 15,
            "With an ephemeral-storage limit the kubelet evicts <em>only the offender</em> when it exceeds its limit; stdout logs are rotated by the kubelet; and a predictive alert pages hours before DiskPressure.",
            "עם limit ל-ephemeral-storage ה-kubelet מפנה <em>רק את האשם</em> כשהוא עובר את ה-limit שלו; לוגים ב-stdout עוברים rotation ע״י ה-kubelet; והתראה חזויה מקפיצה שעות לפני DiskPressure."),
          c("Just give every node a 500 GB root volume", "פשוט לתת לכל node root volume של 500GB", "win", -5,
            "A debug log at 2 GB/hour fills 500 GB in ten days. Bigger disks delay the incident; limits and alerts prevent it.",
            "לוג debug של 2GB לשעה ממלא 500GB בעשרה ימים. דיסקים גדולים דוחים את האינסידנט; limits והתראות מונעים אותו.")
        ]
      },
      win: {
        text: t("Resolved. Root cause: a debug log level turned on in a ConfigMap made export-worker write 41 GB to a file in its container layer. With all pods at ephemeral-storage request 0, eviction followed priority and killed small pods instead. The drain was blocked by a PDB that allowed zero disruptions.",
                "נפתר. סיבת שורש: רמת לוג debug שהודלקה ב-ConfigMap גרמה ל-export-worker לכתוב 41GB לקובץ בשכבת הקונטיינר שלו. כשלכל ה-pods request של 0 ל-ephemeral-storage, ה-eviction הלך לפי priority והרג pods קטנים במקום. ה-drain נחסם ע״י PDB שאפשר אפס disruptions."),
        end: "win"
      },
      lose: {
        text: t("Kafka producers are failing and checkout can't record orders. Lesson: PDBs exist exactly for moments like this. When a drain hangs, make the budget allow a disruption (scale up, fix the PDB, heal unhealthy pods) — never force-delete your way through a node running quorum-based systems.",
                "ה-producers של Kafka נכשלים ו-checkout לא מצליח לרשום הזמנות. הלקח: PDBs קיימים בדיוק לרגעים כאלה. כש-drain נתקע, גורמים לתקציב לאפשר disruption (scale up, תיקון ה-PDB, הבראת pods לא בריאים) – אף פעם לא עושים force delete על node שמריץ מערכות מבוססות quorum."),
        end: "lose"
      }
    },
    lessons: ["k8s-troubleshooting-playbook", "k8s-day2-upgrades", "linux-disks-storage"]
  });
})();
