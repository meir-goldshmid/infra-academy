window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Track: cloud — Cloud models, regions, providers, storage, IaC, CI/CD,
   serverless, IAM & security, FinOps
   ========================================================================= */

window.INFRA.lessons.push({
  id: "cloud-models",
  track: "cloud",
  order: 1,
  icon: "🍕",
  level: 1,
  minutes: 8,
  title: { en: "Cloud Models: IaaS, PaaS, SaaS, FaaS", he: "מודלי ענן: IaaS, PaaS, SaaS, FaaS" },
  tldr: {
    en: "Every cloud model is just a line drawn through the stack: below it the provider owns the problem, above it you do — and that line also decides who gets paged at 3 AM.",
    he: "כל מודל ענן הוא בעצם קו שעובר דרך ה-stack: מתחתיו זו הבעיה של הספק, מעליו זו הבעיה שלך — והקו הזה גם קובע את מי מעירים ב-3 בלילה."
  },
  analogy: {
    en: "Pizza-as-a-Service. On-prem = you make pizza at home (buy the oven, flour, cheese, clean up). IaaS = take-and-bake: someone gives you the kitchen, you still cook. PaaS = delivery: pizza arrives hot, you provide the table and the drinks. SaaS = dining out: you just eat and complain about the service. FaaS = a single slice from a vending machine — you pay per slice, and the first one is a bit cold (cold start).",
    he: "פיצה כשירות. On-prem = מכינים פיצה בבית (קונים תנור, קמח, גבינה, ושוטפים כלים). IaaS = מקבלים מטבח מצויד, אבל אתה עדיין מבשל. PaaS = משלוח: הפיצה מגיעה חמה, אתה רק שם שולחן ושתייה. SaaS = מסעדה: אתה רק אוכל ומתלונן על השירות. FaaS = משולש פיצה ממכונה אוטומטית — משלמים לפי משולש, והראשון קצת קר (cold start)."
  },
  sections: [
    {
      h: { en: "The stack and the line", he: "ה-stack והקו" },
      body: {
        en: `<p>Picture the layers: <strong>data → application → runtime → OS → virtualization → servers → storage → network → physical datacenter</strong>. Each model moves the line up:</p>
<table>
<tr><th>Model</th><th>You manage</th><th>Provider manages</th><th>Examples</th></tr>
<tr><td>On-prem</td><td>Everything, including the A/C</td><td>Nothing</td><td>Your own racks</td></tr>
<tr><td>IaaS</td><td>OS, runtime, app, data</td><td>Hardware, hypervisor, network</td><td>EC2, Azure VMs, GCE</td></tr>
<tr><td>PaaS</td><td>App code + data</td><td>OS patching, runtime, scaling</td><td>App Service, Elastic Beanstalk, Cloud Run, Heroku, RDS</td></tr>
<tr><td>FaaS</td><td>A function + its config</td><td>Everything else, incl. scaling to zero</td><td>Lambda, Azure Functions, Cloud Functions</td></tr>
<tr><td>SaaS</td><td>Your data and users</td><td>The whole product</td><td>Gmail, Slack, Datadog, GitHub</td></tr>
</table>
<p>Managed Kubernetes (EKS/AKS/GKE) sits between IaaS and PaaS: the control plane is managed, the nodes and your YAML are yours.</p>`,
        he: `<p>תדמיין את השכבות: <strong>data → application → runtime → OS → virtualization → servers → storage → network → datacenter פיזי</strong>. כל מודל מזיז את הקו למעלה:</p>
<table>
<tr><th>מודל</th><th>מה עליך</th><th>מה על הספק</th><th>דוגמאות</th></tr>
<tr><td>On-prem</td><td>הכל, כולל המזגן</td><td>כלום</td><td>ה-racks שלך</td></tr>
<tr><td>IaaS</td><td>OS, runtime, אפליקציה, data</td><td>חומרה, hypervisor, רשת</td><td>EC2, Azure VMs, GCE</td></tr>
<tr><td>PaaS</td><td>קוד ו-data</td><td>patching ל-OS, runtime, scaling</td><td>App Service, Elastic Beanstalk, Cloud Run, Heroku, RDS</td></tr>
<tr><td>FaaS</td><td>פונקציה וה-config שלה</td><td>כל השאר, כולל scale to zero</td><td>Lambda, Azure Functions, Cloud Functions</td></tr>
<tr><td>SaaS</td><td>ה-data והמשתמשים שלך</td><td>כל המוצר</td><td>Gmail, Slack, Datadog, GitHub</td></tr>
</table>
<p>Kubernetes מנוהל (EKS/AKS/GKE) יושב בין IaaS ל-PaaS: ה-control plane מנוהל, ה-nodes וה-YAML שלך.</p>`
      }
    },
    {
      h: { en: "Shared responsibility model", he: "מודל האחריות המשותפת (Shared Responsibility)" },
      body: {
        en: `<p>AWS phrases it as: the provider is responsible for security <em>of</em> the cloud (physical security, hypervisor, global network); you are responsible for security <em>in</em> the cloud (IAM, data, network config, OS patches on your VMs, encryption choices).</p>
<p>The line moves with the model. On EC2, an unpatched kernel is <strong>your</strong> problem. On RDS, the DB engine patch is AWS's — but a database with a public endpoint and password <code>admin123</code> is still yours. In SaaS, misconfigured sharing permissions are still yours.</p>
<blockquote>⚠️ Production tip: virtually every famous "cloud breach" (Capital One 2019, countless open S3 buckets) happened on the <em>customer</em> side of the line. The cloud wasn't hacked — someone's config was. "It's in the cloud so it's secure" is not a security strategy.</blockquote>`,
        he: `<p>ב-AWS מנסחים את זה כך: הספק אחראי על אבטחה <em>של</em> הענן (אבטחה פיזית, hypervisor, הרשת הגלובלית); אתה אחראי על אבטחה <em>בתוך</em> הענן (IAM, data, הגדרות רשת, patches ל-OS ב-VMs שלך, הצפנה).</p>
<p>הקו זז לפי המודל. ב-EC2, kernel לא מעודכן זו <strong>הבעיה שלך</strong>. ב-RDS, ה-patch למנוע ה-DB הוא של AWS — אבל DB עם endpoint ציבורי וסיסמה <code>admin123</code> עדיין שלך. גם ב-SaaS, הרשאות שיתוף שהוגדרו לא נכון — עליך.</p>
<blockquote>⚠️ Production tip: כמעט כל "פריצה לענן" מפורסמת (Capital One ב-2019, אינספור S3 buckets פתוחים) קרתה בצד של <em>הלקוח</em>. אף אחד לא פרץ לענן — מישהו הגדיר לא נכון. "זה בענן אז זה מאובטח" זו לא אסטרטגיית אבטחה.</blockquote>`
      }
    },
    {
      h: { en: "On-prem vs cloud vs hybrid", he: "On-prem מול ענן מול Hybrid" },
      body: {
        en: `<p><strong>On-prem</strong>: CapEx (buy servers upfront, depreciate over ~5 years), full control, predictable cost at steady load, but procurement takes weeks and you pay for peak capacity 24/7.</p>
<p><strong>Public cloud</strong>: OpEx, pay-per-use, a new VM in ~60 seconds, global footprint, hundreds of managed services. Downsides: cost surprises (egress!), vendor lock-in, less control.</p>
<p><strong>Hybrid</strong>: some workloads on-prem, some in cloud, connected via VPN or a dedicated link (AWS Direct Connect, Azure ExpressRoute, GCP Interconnect). Common in banks, defense, and anything with data-residency rules. <strong>Multi-cloud</strong> = more than one public cloud — usually by acquisition or best-of-breed choice, rarely a great idea purely "to avoid lock-in".</p>
<blockquote>💡 Real world: Dropbox moved most storage off AWS to its own datacenters ("Magic Pocket") and saved ~$75M over two years. At huge, stable scale on-prem can win — for 99% of companies, it doesn't.</blockquote>`,
        he: `<p><strong>On-prem</strong>: CapEx (קונים שרתים מראש, פחת על ~5 שנים), שליטה מלאה, עלות צפויה בעומס יציב, אבל רכש לוקח שבועות ומשלמים על קיבולת שיא 24/7.</p>
<p><strong>ענן ציבורי</strong>: OpEx, משלמים לפי שימוש, VM חדש תוך ~60 שניות, נוכחות גלובלית, מאות שירותים מנוהלים. החסרונות: הפתעות בחשבון (egress!), vendor lock-in, פחות שליטה.</p>
<p><strong>Hybrid</strong>: חלק מה-workloads ב-on-prem וחלק בענן, מחוברים ב-VPN או קו ייעודי (AWS Direct Connect, Azure ExpressRoute, GCP Interconnect). נפוץ בבנקים, ביטחוני, וכל מה שיש לו דרישות data residency. <strong>Multi-cloud</strong> = יותר מענן ציבורי אחד — בדרך כלל בגלל רכישה או בחירת best-of-breed, ורק לעתים רחוקות רעיון טוב רק "כדי להימנע מ-lock-in".</p>
<blockquote>💡 Real world: Dropbox העבירו את רוב האחסון מ-AWS ל-datacenters משלהם ("Magic Pocket") וחסכו ~75 מיליון דולר בשנתיים. בסקייל ענק ויציב on-prem יכול לנצח — ל-99% מהחברות, לא.</blockquote>`
      }
    },
    {
      h: { en: "How to pick a model", he: "איך בוחרים מודל" },
      body: {
        en: `<p>Rule of thumb: <strong>go as high up the stack as your requirements allow</strong>. Every layer you own is a layer you patch, monitor, scale and get paged for.</p>
<ul>
<li>Stateless HTTP API, spiky traffic → FaaS or a container PaaS (Cloud Run, App Runner, Azure Container Apps).</li>
<li>Many services, need custom networking, sidecars, operators → managed Kubernetes.</li>
<li>Legacy app needing a specific kernel module or licensed software bound to a MAC address → IaaS VM.</li>
<li>Email, CRM, ticketing → SaaS. Never build your own Jira.</li>
</ul>
<p>The trade-off is always <strong>control vs. operational burden</strong>. Higher abstraction = less control, more lock-in, but far fewer 3 AM pages.</p>`,
        he: `<p>כלל אצבע: <strong>תעלה הכי גבוה ב-stack שהדרישות מאפשרות</strong>. כל שכבה שבבעלותך היא שכבה שאתה עושה לה patch, מנטר, עושה לה scale ומקבל עליה page.</p>
<ul>
<li>API סטייטלס ב-HTTP עם תעבורה קופצנית → FaaS או PaaS לקונטיינרים (Cloud Run, App Runner, Azure Container Apps).</li>
<li>הרבה סרוויסים, צריך networking מותאם, sidecars, operators → Kubernetes מנוהל.</li>
<li>אפליקציה legacy שצריכה kernel module מסוים או רישיון שקשור ל-MAC address → VM ב-IaaS.</li>
<li>מייל, CRM, טיקטים → SaaS. אף פעם אל תבנו Jira משלכם.</li>
</ul>
<p>הטרייד-אוף תמיד הוא <strong>שליטה מול עומס תפעולי</strong>. אבסטרקציה גבוהה = פחות שליטה, יותר lock-in, אבל הרבה פחות pages ב-3 בלילה.</p>`
      }
    }
  ],
  diagram: `           On-prem   IaaS     PaaS     FaaS     SaaS
Data       [you]     [you]    [you]    [you]    [you]
App        [you]     [you]    [you]    [you]    (prov)
Runtime    [you]     [you]    (prov)   (prov)   (prov)
OS         [you]     [you]    (prov)   (prov)   (prov)
Virt/HW    [you]     (prov)   (prov)   (prov)   (prov)
Network/DC [you]     (prov)   (prov)   (prov)   (prov)`,
  handsOn: [
    { cmd: "aws ec2 run-instances --image-id ami-0abcdef1234567890 --instance-type t3.micro --count 1", what: { en: "IaaS: you get a raw VM. Now you own patching, the firewall, and the OS.", he: "IaaS: מקבלים VM ריק. מעכשיו ה-patching, ה-firewall וה-OS עליך." } },
    { cmd: "gcloud run deploy hello --image=us-docker.pkg.dev/cloudrun/container/hello --region=europe-west1 --allow-unauthenticated", what: { en: "PaaS/serverless containers: one command, HTTPS URL, autoscaling, scale-to-zero.", he: "PaaS/קונטיינרים serverless: פקודה אחת, URL ב-HTTPS, autoscaling ו-scale to zero." } },
    { cmd: "az webapp up --name my-demo-app --runtime \"PYTHON:3.12\" --sku B1", what: { en: "Azure App Service: push code, the platform handles the OS and runtime.", he: "Azure App Service: דוחפים קוד, הפלטפורמה מטפלת ב-OS וב-runtime." } }
  ],
  mnemonic: {
    en: "\"I Pay So Fewer pages\": IaaS → PaaS → SaaS/FaaS — the higher you go, the fewer pages you get (and the less control you keep). Security: provider = OF the cloud, you = IN the cloud.",
    he: "ככל שעולים ב-stack (IaaS → PaaS → FaaS → SaaS) — פחות pages ופחות שליטה. ואבטחה: הספק אחראי \"על הענן\", אתה אחראי \"על מה שבתוך הענן\"."
  },
  pitfalls: [
    { en: "Assuming the provider patches your VMs. On IaaS the guest OS is yours — unpatched EC2 instances are a classic audit finding.", he: "להניח שהספק עושה patch ל-VMs שלך. ב-IaaS ה-OS שלך — EC2 לא מעודכנים זה ממצא קלאסי באודיט." },
    { en: "Lift-and-shift of a whole datacenter to VMs and expecting savings. Without rightsizing and managed services you often pay MORE than on-prem.", he: "Lift-and-shift של datacenter שלם ל-VMs וציפייה לחסוך. בלי rightsizing ושירותים מנוהלים הרבה פעמים משלמים יותר מ-on-prem." },
    { en: "Going multi-cloud 'to avoid lock-in' and ending up with the lowest common denominator of both clouds and double the expertise needed.", he: "ללכת ל-multi-cloud \"כדי להימנע מ-lock-in\" ולקבל את המכנה המשותף הנמוך של שני העננים ופי שניים ידע נדרש." }
  ],
  interview: [
    {
      q: { en: "Explain the shared responsibility model with an example.", he: "הסבר את מודל האחריות המשותפת עם דוגמה." },
      a: { en: "Provider secures the cloud itself (datacenters, hardware, hypervisor); customer secures what they put in it (IAM, data, network rules, guest OS). Example: with RDS, AWS patches the Postgres engine, but if I open port 5432 to 0.0.0.0/0 that's my fault. The boundary shifts up as you move from IaaS to PaaS to SaaS.", he: "הספק מאבטח את הענן עצמו (datacenters, חומרה, hypervisor); הלקוח מאבטח את מה שהוא שם בתוכו (IAM, data, חוקי רשת, OS של ה-VM). דוגמה: ב-RDS, AWS עושים patch ל-Postgres, אבל אם פתחתי את פורט 5432 ל-0.0.0.0/0 זו אשמתי. הגבול עולה ככל שעוברים מ-IaaS ל-PaaS ל-SaaS." }
    },
    {
      q: { en: "When would you choose VMs over a PaaS?", he: "מתי תבחר VMs על פני PaaS?" },
      a: { en: "When you need control the PaaS doesn't expose: custom kernel/drivers (GPUs, specific modules), licensed software tied to hardware, long-running stateful processes, unusual networking, or very steady high load where reserved VMs are cheaper. Otherwise PaaS wins on operational cost.", he: "כשצריך שליטה שה-PaaS לא חושף: kernel/drivers מותאמים (GPU, modules ספציפיים), תוכנה מורשית שקשורה לחומרה, תהליכים stateful ארוכים, networking חריג, או עומס גבוה ויציב שבו VMs עם reservation זולים יותר. אחרת PaaS מנצח בעלות התפעולית." }
    }
  ],
  quiz: [
    {
      q: { en: "Your app runs on EC2. A critical OpenSSL CVE drops. Who patches the OS?", he: "האפליקציה שלך רצה על EC2. יוצא CVE קריטי ב-OpenSSL. מי עושה patch ל-OS?" },
      options: [
        { en: "AWS, automatically, within 24h", he: "AWS, אוטומטית, תוך 24 שעות" },
        { en: "You — the guest OS is the customer's responsibility in IaaS", he: "אתה — ה-OS של ה-VM באחריות הלקוח ב-IaaS" },
        { en: "Nobody needs to; the hypervisor isolates it", he: "אף אחד, ה-hypervisor מבודד את זה" },
        { en: "AWS, but only if you have Business support", he: "AWS, אבל רק אם יש לך Business support" }
      ],
      answer: 1,
      explain: { en: "In IaaS, everything from the guest OS up is yours. Tools like SSM Patch Manager help, but you still own it.", he: "ב-IaaS כל מה שמה-OS ומעלה שלך. כלים כמו SSM Patch Manager עוזרים, אבל האחריות עדיין שלך." }
    },
    {
      q: { en: "In pizza-as-a-service, 'delivery' (pizza arrives, you provide the table) maps to:", he: "בפיצה כשירות, \"משלוח\" (הפיצה מגיעה, אתה שם שולחן) מתאים ל:" },
      options: [
        { en: "IaaS", he: "IaaS" },
        { en: "On-prem", he: "On-prem" },
        { en: "PaaS", he: "PaaS" },
        { en: "SaaS", he: "SaaS" }
      ],
      answer: 2,
      explain: { en: "PaaS: the platform 'cooks' (OS, runtime, scaling); you bring your app and data.", he: "PaaS: הפלטפורמה \"מבשלת\" (OS, runtime, scaling); אתה מביא את האפליקציה וה-data." }
    },
    {
      q: { en: "A bank must keep customer data in its own datacenter but wants cloud burst capacity for analytics. This is:", he: "בנק חייב לשמור data של לקוחות ב-datacenter שלו אבל רוצה קיבולת ענן לאנליטיקה. זה:" },
      options: [
        { en: "Multi-cloud", he: "Multi-cloud" },
        { en: "Hybrid cloud", he: "Hybrid cloud" },
        { en: "SaaS", he: "SaaS" },
        { en: "Serverless", he: "Serverless" }
      ],
      answer: 1,
      explain: { en: "Hybrid = on-prem + public cloud, usually connected via Direct Connect/ExpressRoute. Multi-cloud means multiple public clouds.", he: "Hybrid = on-prem + ענן ציבורי, בדרך כלל מחוברים ב-Direct Connect/ExpressRoute. Multi-cloud זה כמה עננים ציבוריים." }
    },
    {
      q: { en: "Which breach is the cloud provider's responsibility?", he: "איזו פריצה היא באחריות ספק הענן?" },
      options: [
        { en: "An S3 bucket set to public read", he: "S3 bucket שהוגדר כ-public read" },
        { en: "Access keys committed to a public GitHub repo", he: "Access keys שנדחפו ל-repo ציבורי ב-GitHub" },
        { en: "A hypervisor escape letting one tenant read another's memory", he: "בריחה מה-hypervisor שמאפשרת ל-tenant אחד לקרוא זיכרון של אחר" },
        { en: "A security group allowing SSH from 0.0.0.0/0", he: "Security group שמאפשר SSH מ-0.0.0.0/0" }
      ],
      answer: 2,
      explain: { en: "The hypervisor is 'security OF the cloud' — the provider's side. The other three are classic customer misconfigurations.", he: "ה-hypervisor הוא \"אבטחה של הענן\" — הצד של הספק. שלושת האחרים הם טעויות קונפיגורציה קלאסיות של הלקוח." }
    }
  ],
  related: ["vms", "cloud-serverless", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "cloud-regions-azs",
  track: "cloud",
  order: 2,
  icon: "🌍",
  level: 1,
  minutes: 8,
  title: { en: "Regions, Availability Zones & Edge", he: "Regions, Availability Zones ו-Edge" },
  tldr: {
    en: "A region is a city, an AZ is an independent building in that city (~1-2 ms apart), an edge location is a kiosk near your users — spread across AZs for HA, across regions for DR.",
    he: "Region זה עיר, AZ זה בניין עצמאי בתוך העיר (~1-2 ms ביניהם), edge location זה קיוסק ליד המשתמשים — פורסים על כמה AZs בשביל HA, ועל כמה regions בשביל DR."
  },
  analogy: {
    en: "Think of a hospital chain. A region is the city (Frankfurt). Availability zones are separate hospital buildings across town — each with its own power, generators and water, close enough that an ambulance gets between them in minutes. If one building floods, the others keep operating. Edge locations are the pharmacies on every corner: they don't do surgery, but they hand out the common stuff fast.",
    he: "תחשבו על רשת בתי חולים. Region זו העיר (פרנקפורט). Availability zones הם בניינים נפרדים ברחבי העיר — לכל אחד חשמל, גנרטורים ומים משלו, קרובים מספיק שאמבולנס יעבור ביניהם בדקות. אם בניין אחד מוצף, השאר ממשיכים לעבוד. Edge locations הם בתי המרקחת בכל פינה: לא עושים שם ניתוחים, אבל נותנים את הדברים הנפוצים מהר."
  },
  sections: [
    {
      h: { en: "Regions and AZs", he: "Regions ו-AZs" },
      body: {
        en: `<p>A <strong>region</strong> is a geographic area (<code>us-east-1</code>, <code>westeurope</code>, <code>europe-west1</code>, <code>il-central-1</code> in Tel Aviv). Regions are deliberately isolated: an outage in one should not spread to another, and most services are regional (an S3 bucket, a VPC, an RDS instance all live in one region).</p>
<p>An <strong>availability zone</strong> (AZ) is one or more datacenters with independent power, cooling and networking, typically tens of km apart within the region. Most regions have 3+ AZs (<code>us-east-1a</code> … <code>us-east-1f</code>). AZs are connected with low-latency private fiber: <strong>~1-2 ms round trip</strong>, good enough for synchronous DB replication.</p>
<p>Across regions, latency is physics: Frankfurt ↔ Virginia is ~90 ms RTT, Tel Aviv ↔ Frankfurt ~45-55 ms, Virginia ↔ Sydney ~200 ms. That's why cross-region replication is usually <em>asynchronous</em>.</p>
<blockquote>⚠️ Production tip: AZ names are shuffled per account in AWS — your <code>us-east-1a</code> is not my <code>us-east-1a</code>. Use AZ IDs (<code>use1-az1</code>) when coordinating across accounts.</blockquote>`,
        he: `<p><strong>Region</strong> זה אזור גיאוגרפי (<code>us-east-1</code>, <code>westeurope</code>, <code>europe-west1</code>, <code>il-central-1</code> בתל אביב). Regions מבודדים בכוונה: תקלה באחד לא אמורה לזלוג לאחר, ורוב השירותים הם regional (S3 bucket, VPC, RDS — כולם חיים ב-region אחד).</p>
<p><strong>Availability zone</strong> (AZ) זה datacenter אחד או יותר עם חשמל, קירור ורשת עצמאיים, בדרך כלל עשרות ק"מ זה מזה בתוך ה-region. ברוב ה-regions יש 3+ AZs (<code>us-east-1a</code> … <code>us-east-1f</code>). ה-AZs מחוברים בסיבים פרטיים עם latency נמוך: <strong>~1-2 ms round trip</strong>, מספיק טוב לרפליקציה סינכרונית של DB.</p>
<p>בין regions ה-latency הוא פיזיקה: פרנקפורט ↔ וירג'יניה ~90 ms RTT, תל אביב ↔ פרנקפורט ~45-55 ms, וירג'יניה ↔ סידני ~200 ms. בגלל זה רפליקציה בין regions היא בדרך כלל <em>אסינכרונית</em>.</p>
<blockquote>⚠️ Production tip: ב-AWS שמות ה-AZs מעורבבים לכל account — ה-<code>us-east-1a</code> שלך הוא לא ה-<code>us-east-1a</code> שלי. כשמתאמים בין accounts, תשתמשו ב-AZ IDs (<code>use1-az1</code>).</blockquote>`
      }
    },
    {
      h: { en: "Designing with AZs and regions", he: "תכנון עם AZs ו-regions" },
      body: {
        en: `<ul>
<li><strong>Multi-AZ = high availability.</strong> Spread instances over 3 AZs behind a load balancer; use RDS Multi-AZ / zone-redundant storage. Survives a datacenter failure. This is the default for anything production.</li>
<li><strong>Multi-region = disaster recovery</strong> (and global latency). Survives a whole-region outage, but costs real money and complexity: data replication, DNS failover, cross-region egress fees.</li>
</ul>
<p>Cost twist: traffic <em>between AZs</em> is not free in AWS — about <strong>$0.01/GB each direction</strong>. A chatty microservice mesh across 3 AZs can rack up thousands per month. Kubernetes topology-aware routing helps keep traffic in-zone.</p>
<p>Some services are <strong>global</strong> rather than regional: IAM, Route 53, CloudFront (AWS); Azure Front Door; GCP global HTTP(S) LB. Note that "global" control planes still often live in one region — the famous us-east-1 dependency.</p>`,
        he: `<ul>
<li><strong>Multi-AZ = high availability.</strong> פורסים instances על 3 AZs מאחורי load balancer; משתמשים ב-RDS Multi-AZ / zone-redundant storage. שורד נפילה של datacenter. זה ה-default לכל דבר בפרודקשן.</li>
<li><strong>Multi-region = disaster recovery</strong> (וגם latency גלובלי). שורד נפילה של region שלם, אבל עולה כסף ומורכבות אמיתיים: רפליקציית data, DNS failover, עמלות egress בין regions.</li>
</ul>
<p>טוויסט בעלויות: תעבורה <em>בין AZs</em> לא בחינם ב-AWS — בערך <strong>$0.01/GB לכל כיוון</strong>. mesh פטפטן של microservices על 3 AZs יכול להגיע לאלפי דולרים בחודש. topology-aware routing ב-Kubernetes עוזר לשמור את התעבורה בתוך ה-zone.</p>
<p>חלק מהשירותים הם <strong>global</strong> ולא regional: IAM, Route 53, CloudFront (AWS); Azure Front Door; GCP global HTTP(S) LB. שימו לב שגם control planes "גלובליים" חיים הרבה פעמים ב-region אחד — התלות המפורסמת ב-us-east-1.</p>`
      }
    },
    {
      h: { en: "Edge locations and CDNs", he: "Edge locations ו-CDN" },
      body: {
        en: `<p><strong>Edge locations / PoPs</strong> are hundreds of small sites in many more cities than regions (CloudFront has 600+ PoPs vs ~35 regions). They run CDN caches, DNS (Route 53 answers from the edge), DDoS protection, and small compute (CloudFront Functions, Lambda@Edge, Cloudflare Workers).</p>
<p>Why it matters: a user in Tel Aviv fetching a 2 MB JS bundle from <code>us-east-1</code> pays ~140 ms per round trip, multiplied by TCP+TLS handshakes. From an edge PoP in Tel Aviv, it's ~5 ms. Static assets belong on a CDN, always.</p>
<blockquote>💡 Real world: AWS us-east-1 had major outages in Dec 2021 and Oct 2025 that took down large chunks of the internet — including companies that "weren't even in us-east-1", because they depended on services whose control plane lived there. Know your hidden regional dependencies.</blockquote>`,
        he: `<p><strong>Edge locations / PoPs</strong> הם מאות אתרים קטנים בהרבה יותר ערים מאשר regions (ל-CloudFront יש 600+ PoPs לעומת ~35 regions). הם מריצים CDN cache, DNS (Route 53 עונה מה-edge), הגנת DDoS, ו-compute קטן (CloudFront Functions, Lambda@Edge, Cloudflare Workers).</p>
<p>למה זה חשוב: משתמש בתל אביב שמוריד JS bundle של 2 MB מ-<code>us-east-1</code> משלם ~140 ms לכל round trip, כפול ה-handshakes של TCP+TLS. מ-PoP בתל אביב זה ~5 ms. assets סטטיים שייכים ל-CDN, תמיד.</p>
<blockquote>💡 Real world: ל-AWS us-east-1 היו נפילות גדולות בדצמבר 2021 ובאוקטובר 2025 שהפילו חלקים גדולים מהאינטרנט — כולל חברות ש"בכלל לא היו ב-us-east-1", כי הן היו תלויות בשירותים שה-control plane שלהם יושב שם. תכירו את התלויות הנסתרות שלכם.</blockquote>`
      }
    },
    {
      h: { en: "Picking a region & data residency", he: "בחירת region ו-data residency" },
      body: {
        en: `<p>Checklist, in order of how often it actually decides:</p>
<ol>
<li><strong>Compliance / data residency</strong>: GDPR doesn't strictly force EU hosting, but many customers' contracts do; Israeli government and health data often must stay in Israel (<code>il-central-1</code>, Azure Israel Central, GCP <code>me-west1</code>). This is a hard constraint — check it first.</li>
<li><strong>Latency to users</strong>: measure with tools like cloudping or <code>curl -w</code>, don't guess.</li>
<li><strong>Service availability</strong>: new services and GPU instance types land in us-east-1/us-west-2 first; smaller regions lag by months.</li>
<li><strong>Price</strong>: the same instance can be 10-30% pricier in São Paulo or Tokyo than in Virginia or Ohio.</li>
<li><strong>Pair for DR</strong>: Azure has official region pairs; elsewhere pick a second region in the same legal jurisdiction.</li>
</ol>`,
        he: `<p>צ'קליסט, לפי סדר התדירות שבה זה באמת מכריע:</p>
<ol>
<li><strong>רגולציה / data residency</strong>: GDPR לא מחייב בדיוק hosting באירופה, אבל הרבה חוזים של לקוחות כן; data ממשלתי ורפואי בישראל צריך לרוב להישאר בארץ (<code>il-central-1</code>, Azure Israel Central, GCP <code>me-west1</code>). זה אילוץ קשיח — בודקים אותו ראשון.</li>
<li><strong>Latency למשתמשים</strong>: מודדים עם כלים כמו cloudping או <code>curl -w</code>, לא מנחשים.</li>
<li><strong>זמינות שירותים</strong>: שירותים חדשים וסוגי GPU נוחתים קודם ב-us-east-1/us-west-2; regions קטנים מפגרים בחודשים.</li>
<li><strong>מחיר</strong>: אותו instance יכול להיות יקר ב-10-30% בסאו פאולו או טוקיו לעומת וירג'יניה או אוהיו.</li>
<li><strong>זוג ל-DR</strong>: ב-Azure יש region pairs רשמיים; בשאר העננים בוחרים region שני באותה סמכות שיפוטית.</li>
</ol>`
      }
    }
  ],
  diagram: `Region eu-central-1 (Frankfurt)
 +-------------+   ~1-2ms   +-------------+   ~1-2ms   +-------------+
 |  AZ  a      |<---------->|  AZ  b      |<---------->|  AZ  c      |
 | app + DB pri|  sync repl | app + DB stby|            | app         |
 +-------------+            +-------------+            +-------------+
        \\________________ async replication ~90ms ________________
                                   v
                       Region us-east-1 (DR)
 Users --> Edge PoP (CDN cache, DNS, WAF) --> nearest region`,
  handsOn: [
    { cmd: "aws ec2 describe-availability-zones --region eu-central-1 --query 'AvailabilityZones[].[ZoneName,ZoneId]' --output table", what: { en: "List AZ names and their stable AZ IDs for your account.", he: "מציג את שמות ה-AZs וה-AZ IDs הקבועים שלהם ב-account שלך." } },
    { cmd: "aws ec2 describe-regions --query 'Regions[].RegionName' --output text", what: { en: "All regions enabled for your account (opt-in regions like il-central-1 must be enabled first).", he: "כל ה-regions שמופעלים ב-account (regions מסוג opt-in כמו il-central-1 צריך להפעיל קודם)." } },
    { cmd: "curl -o /dev/null -s -w 'connect=%{time_connect}s tls=%{time_appconnect}s total=%{time_total}s\\n' https://dynamodb.eu-central-1.amazonaws.com/ping", what: { en: "Measure real latency to a region endpoint from where you are.", he: "מודד latency אמיתי ל-endpoint של region מהמיקום שלך." } },
    { cmd: "az account list-locations -o table", what: { en: "Azure regions, including paired regions info via --query.", he: "רשימת ה-regions ב-Azure, כולל מידע על region pairs עם --query." } }
  ],
  mnemonic: {
    en: "\"AZ for HA, Region for DR, Edge for speed.\" And latency: 1 ms between buildings, ~90 ms across the ocean.",
    he: "\"AZ ל-HA, Region ל-DR, Edge למהירות.\" ו-latency: 1 ms בין בניינים, ~90 ms מעבר לאוקיינוס."
  },
  pitfalls: [
    { en: "Running 'HA' with 3 replicas that all landed in one AZ. Use topology spread constraints / placement across subnets in different AZs.", he: "להריץ \"HA\" עם 3 replicas שכולן נחתו באותו AZ. תשתמשו ב-topology spread constraints / פיזור על subnets ב-AZs שונים." },
    { en: "Synchronous cross-region calls in the request path: every request pays 90+ ms and you've made two regions a single point of failure.", he: "קריאות סינכרוניות בין regions בתוך מסלול הבקשה: כל בקשה משלמת 90+ ms ועשיתם משני regions נקודת כשל אחת." },
    { en: "Ignoring cross-AZ data transfer cost — a Kafka cluster replicating across 3 AZs can cost more in transfer than in brokers.", he: "להתעלם מעלות תעבורה בין AZs — Kafka cluster שמשכפל על 3 AZs יכול לעלות יותר בתעבורה מאשר ב-brokers." }
  ],
  interview: [
    {
      q: { en: "What's the difference between multi-AZ and multi-region, and when do you need each?", he: "מה ההבדל בין multi-AZ ל-multi-region, ומתי צריך כל אחד?" },
      a: { en: "Multi-AZ protects against a datacenter failure with ~1-2 ms latency, so you can replicate synchronously and fail over automatically — baseline for production. Multi-region protects against a regional outage or serves global users, but latency forces async replication (non-zero RPO), and it's much costlier. Choose it based on RTO/RPO requirements and business cost of a regional outage.", he: "Multi-AZ מגן מפני נפילת datacenter עם ~1-2 ms latency, אז אפשר לשכפל סינכרונית ולעשות failover אוטומטי — הבסיס לפרודקשן. Multi-region מגן מפני נפילת region או משרת משתמשים גלובליים, אבל ה-latency מכריח רפליקציה אסינכרונית (RPO לא אפס), וזה הרבה יותר יקר. מחליטים לפי דרישות RTO/RPO והעלות העסקית של נפילת region." }
    },
    {
      q: { en: "How would you choose a region for a new Israeli health-tech product?", he: "איך תבחר region למוצר health-tech ישראלי חדש?" },
      a: { en: "Start with regulation: health data likely must stay in Israel, so il-central-1 / Israel Central / me-west1. Then verify the managed services I need exist there, check pricing, and pick a DR strategy that satisfies the same residency rules (maybe multi-AZ only, plus backups in-country).", he: "מתחילים ברגולציה: data רפואי כנראה חייב להישאר בישראל, אז il-central-1 / Israel Central / me-west1. אחר כך מוודאים שהשירותים המנוהלים שאני צריך קיימים שם, בודקים מחירים, ובוחרים אסטרטגיית DR שעומדת באותן דרישות residency (אולי רק multi-AZ, ו-backups בתוך הארץ)." }
    }
  ],
  quiz: [
    {
      q: { en: "Typical round-trip latency between two AZs in the same region is about:", he: "ה-latency הטיפוסי (round trip) בין שני AZs באותו region הוא בערך:" },
      options: [
        { en: "0.01 ms", he: "0.01 ms" },
        { en: "1-2 ms", he: "1-2 ms" },
        { en: "30-50 ms", he: "30-50 ms" },
        { en: "90 ms", he: "90 ms" }
      ],
      answer: 1,
      explain: { en: "AZs are tens of km apart on dedicated fiber: ~1-2 ms, which is why synchronous replication across AZs is practical.", he: "AZs מרוחקים עשרות ק\"מ על סיבים ייעודיים: ~1-2 ms, ובגלל זה רפליקציה סינכרונית בין AZs ישימה." }
    },
    {
      q: { en: "Your service must survive a full datacenter fire with zero data loss. Minimum design?", he: "השירות חייב לשרוד שריפה ב-datacenter שלם בלי איבוד data. מה התכנון המינימלי?" },
      options: [
        { en: "Bigger instance with more RAM", he: "Instance גדול יותר עם יותר RAM" },
        { en: "Multi-AZ with synchronous DB replication", he: "Multi-AZ עם רפליקציית DB סינכרונית" },
        { en: "Multi-region with async replication", he: "Multi-region עם רפליקציה אסינכרונית" },
        { en: "Nightly backups to S3", he: "Backups לילי ל-S3" }
      ],
      answer: 1,
      explain: { en: "A datacenter = an AZ. Sync replication across AZs gives RPO≈0. Async multi-region can lose the last seconds; nightly backups lose up to a day.", he: "Datacenter = AZ. רפליקציה סינכרונית בין AZs נותנת RPO≈0. Multi-region אסינכרוני יכול לאבד את השניות האחרונות; backup לילי מאבד עד יום." }
    },
    {
      q: { en: "What's usually the FIRST factor to check when picking a region?", he: "מה בדרך כלל הדבר הראשון לבדוק כשבוחרים region?" },
      options: [
        { en: "Which region has the cheapest t3.micro", he: "באיזה region ה-t3.micro הכי זול" },
        { en: "Which region is newest", he: "איזה region הכי חדש" },
        { en: "Compliance / data residency requirements", he: "דרישות רגולציה / data residency" },
        { en: "Alphabetical order", he: "סדר אלפביתי" }
      ],
      answer: 2,
      explain: { en: "Residency is a hard constraint; latency and price are optimizations within the allowed set.", he: "Residency זה אילוץ קשיח; latency ומחיר הם אופטימיזציות בתוך מה שמותר." }
    }
  ],
  related: ["rel-ha", "rel-bcdr", "net-vpc", "cloud-provider-map"]
});

window.INFRA.lessons.push({
  id: "cloud-provider-map",
  track: "cloud",
  order: 3,
  icon: "🗺️",
  level: 1,
  minutes: 9,
  title: { en: "AWS vs Azure vs GCP: The Rosetta Stone", he: "AWS מול Azure מול GCP: מילון התרגום" },
  tldr: {
    en: "The three big clouds sell the same ~15 building blocks under different names — learn the concept once, then translate.",
    he: "שלושת העננים הגדולים מוכרים את אותן ~15 אבני בניין בשמות שונים — לומדים את הקונספט פעם אחת, ואז רק מתרגמים."
  },
  analogy: {
    en: "It's like supermarket chains in three countries. Every one has milk, bread and eggs — but one calls the aisle 'Dairy', another 'Fresh', and a third hides the milk next to the yogurt with a weird brand name. Once you know you're looking for milk (object storage), finding 'S3', 'Blob' or 'GCS' is just reading the signs.",
    he: "זה כמו רשתות סופרמרקט בשלוש מדינות. בכולן יש חלב, לחם וביצים — אבל אחת קוראת למעבר \"מוצרי חלב\", אחרת \"טרי\", ושלישית מחביאה את החלב ליד היוגורטים עם שם מותג מוזר. ברגע שאתה יודע שאתה מחפש חלב (object storage), למצוא S3, Blob או GCS זה רק לקרוא שלטים."
  },
  sections: [
    {
      h: { en: "Compute, containers, serverless", he: "Compute, קונטיינרים, serverless" },
      body: {
        en: `<table>
<tr><th>Concept</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>VMs</td><td>EC2</td><td>Virtual Machines</td><td>Compute Engine</td></tr>
<tr><td>VM autoscaling group</td><td>Auto Scaling Group</td><td>VM Scale Sets</td><td>Managed Instance Groups</td></tr>
<tr><td>Managed Kubernetes</td><td>EKS</td><td>AKS</td><td>GKE</td></tr>
<tr><td>Serverless containers</td><td>App Runner / ECS Fargate</td><td>Container Apps</td><td>Cloud Run</td></tr>
<tr><td>Functions (FaaS)</td><td>Lambda</td><td>Azure Functions</td><td>Cloud Run functions</td></tr>
<tr><td>PaaS web apps</td><td>Elastic Beanstalk</td><td>App Service</td><td>App Engine</td></tr>
<tr><td>Container registry</td><td>ECR</td><td>ACR</td><td>Artifact Registry</td></tr>
</table>
<p>GKE is widely considered the most polished K8s (Google invented it); AKS has a free control plane tier; EKS charges ~$0.10/hour per cluster (~$73/month) before you run a single pod.</p>`,
        he: `<table>
<tr><th>קונספט</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>VMs</td><td>EC2</td><td>Virtual Machines</td><td>Compute Engine</td></tr>
<tr><td>קבוצת autoscaling ל-VMs</td><td>Auto Scaling Group</td><td>VM Scale Sets</td><td>Managed Instance Groups</td></tr>
<tr><td>Kubernetes מנוהל</td><td>EKS</td><td>AKS</td><td>GKE</td></tr>
<tr><td>קונטיינרים serverless</td><td>App Runner / ECS Fargate</td><td>Container Apps</td><td>Cloud Run</td></tr>
<tr><td>פונקציות (FaaS)</td><td>Lambda</td><td>Azure Functions</td><td>Cloud Run functions</td></tr>
<tr><td>PaaS לאפליקציות web</td><td>Elastic Beanstalk</td><td>App Service</td><td>App Engine</td></tr>
<tr><td>Container registry</td><td>ECR</td><td>ACR</td><td>Artifact Registry</td></tr>
</table>
<p>GKE נחשב ל-K8s הכי מלוטש (גוגל המציאו אותו); ב-AKS יש tier חינמי ל-control plane; EKS גובה ~$0.10 לשעה לכל cluster (~$73 בחודש) עוד לפני שהרצתם pod אחד.</p>`
      }
    },
    {
      h: { en: "Data: storage, databases, messaging", he: "Data: אחסון, מסדי נתונים, messaging" },
      body: {
        en: `<table>
<tr><th>Concept</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Object storage</td><td>S3</td><td>Blob Storage</td><td>Cloud Storage (GCS)</td></tr>
<tr><td>Block disks</td><td>EBS</td><td>Managed Disks</td><td>Persistent Disk / Hyperdisk</td></tr>
<tr><td>Shared file (NFS/SMB)</td><td>EFS / FSx</td><td>Azure Files</td><td>Filestore</td></tr>
<tr><td>Managed SQL</td><td>RDS / Aurora</td><td>Azure SQL / Database for PostgreSQL</td><td>Cloud SQL / AlloyDB</td></tr>
<tr><td>NoSQL key-value/doc</td><td>DynamoDB</td><td>Cosmos DB</td><td>Firestore / Bigtable</td></tr>
<tr><td>Global SQL</td><td>Aurora DSQL</td><td>Cosmos DB</td><td>Spanner</td></tr>
<tr><td>Cache</td><td>ElastiCache</td><td>Azure Cache for Redis</td><td>Memorystore</td></tr>
<tr><td>Queue</td><td>SQS</td><td>Storage Queues / Service Bus</td><td>Cloud Tasks / Pub/Sub</td></tr>
<tr><td>Pub/sub &amp; events</td><td>SNS / EventBridge</td><td>Event Grid / Service Bus topics</td><td>Pub/Sub / Eventarc</td></tr>
<tr><td>Streaming / Kafka</td><td>Kinesis / MSK</td><td>Event Hubs (Kafka API)</td><td>Pub/Sub / Managed Kafka</td></tr>
<tr><td>Data warehouse</td><td>Redshift</td><td>Synapse / Fabric</td><td>BigQuery</td></tr>
</table>`,
        he: `<table>
<tr><th>קונספט</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Object storage</td><td>S3</td><td>Blob Storage</td><td>Cloud Storage (GCS)</td></tr>
<tr><td>דיסקים (block)</td><td>EBS</td><td>Managed Disks</td><td>Persistent Disk / Hyperdisk</td></tr>
<tr><td>File משותף (NFS/SMB)</td><td>EFS / FSx</td><td>Azure Files</td><td>Filestore</td></tr>
<tr><td>SQL מנוהל</td><td>RDS / Aurora</td><td>Azure SQL / Database for PostgreSQL</td><td>Cloud SQL / AlloyDB</td></tr>
<tr><td>NoSQL key-value/מסמכים</td><td>DynamoDB</td><td>Cosmos DB</td><td>Firestore / Bigtable</td></tr>
<tr><td>SQL גלובלי</td><td>Aurora DSQL</td><td>Cosmos DB</td><td>Spanner</td></tr>
<tr><td>Cache</td><td>ElastiCache</td><td>Azure Cache for Redis</td><td>Memorystore</td></tr>
<tr><td>תור</td><td>SQS</td><td>Storage Queues / Service Bus</td><td>Cloud Tasks / Pub/Sub</td></tr>
<tr><td>Pub/sub ו-events</td><td>SNS / EventBridge</td><td>Event Grid / Service Bus topics</td><td>Pub/Sub / Eventarc</td></tr>
<tr><td>Streaming / Kafka</td><td>Kinesis / MSK</td><td>Event Hubs (Kafka API)</td><td>Pub/Sub / Managed Kafka</td></tr>
<tr><td>Data warehouse</td><td>Redshift</td><td>Synapse / Fabric</td><td>BigQuery</td></tr>
</table>`
      }
    },
    {
      h: { en: "Networking, security, operations", he: "רשת, אבטחה, תפעול" },
      body: {
        en: `<table>
<tr><th>Concept</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Private network</td><td>VPC</td><td>VNet</td><td>VPC (global!)</td></tr>
<tr><td>Firewall rules</td><td>Security Groups / NACLs</td><td>NSGs</td><td>VPC firewall rules</td></tr>
<tr><td>L7 load balancer</td><td>ALB</td><td>Application Gateway / Front Door</td><td>HTTP(S) Load Balancer</td></tr>
<tr><td>L4 load balancer</td><td>NLB</td><td>Azure Load Balancer</td><td>Network LB</td></tr>
<tr><td>DNS</td><td>Route 53</td><td>Azure DNS</td><td>Cloud DNS</td></tr>
<tr><td>CDN</td><td>CloudFront</td><td>Front Door / Azure CDN</td><td>Cloud CDN</td></tr>
<tr><td>IAM</td><td>IAM (users, roles, policies)</td><td>Entra ID + Azure RBAC</td><td>Cloud IAM (service accounts)</td></tr>
<tr><td>Secrets</td><td>Secrets Manager / SSM Parameter Store</td><td>Key Vault</td><td>Secret Manager</td></tr>
<tr><td>Keys (KMS)</td><td>KMS</td><td>Key Vault (keys) / Managed HSM</td><td>Cloud KMS</td></tr>
<tr><td>Metrics &amp; monitoring</td><td>CloudWatch</td><td>Azure Monitor</td><td>Cloud Monitoring</td></tr>
<tr><td>Logging</td><td>CloudWatch Logs</td><td>Log Analytics</td><td>Cloud Logging</td></tr>
<tr><td>Audit log</td><td>CloudTrail</td><td>Activity Log</td><td>Cloud Audit Logs</td></tr>
<tr><td>IaC (native)</td><td>CloudFormation / CDK</td><td>ARM / Bicep</td><td>Infrastructure Manager</td></tr>
</table>`,
        he: `<table>
<tr><th>קונספט</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>רשת פרטית</td><td>VPC</td><td>VNet</td><td>VPC (גלובלי!)</td></tr>
<tr><td>חוקי firewall</td><td>Security Groups / NACLs</td><td>NSGs</td><td>VPC firewall rules</td></tr>
<tr><td>Load balancer ב-L7</td><td>ALB</td><td>Application Gateway / Front Door</td><td>HTTP(S) Load Balancer</td></tr>
<tr><td>Load balancer ב-L4</td><td>NLB</td><td>Azure Load Balancer</td><td>Network LB</td></tr>
<tr><td>DNS</td><td>Route 53</td><td>Azure DNS</td><td>Cloud DNS</td></tr>
<tr><td>CDN</td><td>CloudFront</td><td>Front Door / Azure CDN</td><td>Cloud CDN</td></tr>
<tr><td>IAM</td><td>IAM (users, roles, policies)</td><td>Entra ID + Azure RBAC</td><td>Cloud IAM (service accounts)</td></tr>
<tr><td>Secrets</td><td>Secrets Manager / SSM Parameter Store</td><td>Key Vault</td><td>Secret Manager</td></tr>
<tr><td>מפתחות (KMS)</td><td>KMS</td><td>Key Vault (keys) / Managed HSM</td><td>Cloud KMS</td></tr>
<tr><td>Metrics וניטור</td><td>CloudWatch</td><td>Azure Monitor</td><td>Cloud Monitoring</td></tr>
<tr><td>Logging</td><td>CloudWatch Logs</td><td>Log Analytics</td><td>Cloud Logging</td></tr>
<tr><td>Audit log</td><td>CloudTrail</td><td>Activity Log</td><td>Cloud Audit Logs</td></tr>
<tr><td>IaC מקורי</td><td>CloudFormation / CDK</td><td>ARM / Bicep</td><td>Infrastructure Manager</td></tr>
</table>`
      }
    },
    {
      h: { en: "The differences that actually bite", he: "ההבדלים שבאמת נושכים" },
      body: {
        en: `<p>Names are easy; <strong>mental models</strong> differ:</p>
<ul>
<li><strong>Resource hierarchy</strong>: AWS = Organization → OU → Account (the account is the hard isolation boundary). Azure = Tenant (Entra ID) → Management Group → Subscription → <em>Resource Group</em>. GCP = Organization → Folder → <em>Project</em>.</li>
<li><strong>Networking scope</strong>: an AWS VPC and Azure VNet are regional; a GCP VPC is <em>global</em> with regional subnets — no peering needed between regions.</li>
<li><strong>Identity</strong>: Azure is built on Entra ID (formerly Azure AD), so human SSO is native; AWS bolts on IAM Identity Center; GCP leans on Google accounts/Workspace.</li>
</ul>
<blockquote>💡 Real world: when switching clouds, people lose the most time on IAM and networking, not compute. A VM is a VM; "why can't my pod reach the database" is where the week goes.</blockquote>`,
        he: `<p>השמות זה הקל; ה-<strong>מודל המנטלי</strong> שונה:</p>
<ul>
<li><strong>היררכיית משאבים</strong>: AWS = Organization → OU → Account (ה-account הוא גבול הבידוד הקשיח). Azure = Tenant (Entra ID) → Management Group → Subscription → <em>Resource Group</em>. GCP = Organization → Folder → <em>Project</em>.</li>
<li><strong>היקף הרשת</strong>: VPC ב-AWS ו-VNet ב-Azure הם regional; VPC ב-GCP הוא <em>גלובלי</em> עם subnets לפי region — לא צריך peering בין regions.</li>
<li><strong>זהות</strong>: Azure בנוי על Entra ID (לשעבר Azure AD), אז SSO לבני אדם מובנה; ב-AWS מוסיפים IAM Identity Center; GCP נשען על חשבונות Google/Workspace.</li>
</ul>
<blockquote>💡 Real world: כשעוברים ענן, הכי הרבה זמן הולך על IAM ורשת, לא על compute. VM זה VM; "למה ה-pod שלי לא מגיע ל-DB" — שם הולך השבוע.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: "aws sts get-caller-identity", what: { en: "AWS 'whoami' — which account and role am I using right now?", he: "ה-\"whoami\" של AWS — באיזה account ו-role אני משתמש עכשיו?" } },
    { cmd: "az account show -o table", what: { en: "Azure 'whoami' — current tenant and subscription.", he: "ה-\"whoami\" של Azure — ה-tenant וה-subscription הנוכחיים." } },
    { cmd: "gcloud config list && gcloud projects list", what: { en: "GCP 'whoami' — active account and project.", he: "ה-\"whoami\" של GCP — החשבון והפרויקט הפעילים." } },
    { cmd: "aws s3 ls; az storage account list -o table; gcloud storage ls", what: { en: "Same concept, three CLIs: list object storage.", he: "אותו קונספט, שלושה CLIs: רשימת object storage." } }
  ],
  mnemonic: {
    en: "\"S3 = Blob = GCS, EC2 = VM = GCE, EKS/AKS/GKE — the K is always Kubernetes.\" Hierarchy: AWS Account, Azure Resource Group, GCP Project.",
    he: "\"S3 = Blob = GCS, EC2 = VM = GCE, EKS/AKS/GKE — ה-K תמיד Kubernetes.\" היררכיה: ב-AWS זה Account, ב-Azure זה Resource Group, ב-GCP זה Project."
  },
  pitfalls: [
    { en: "Assuming 'equivalent' means identical: SQS is a pull queue, GCP Pub/Sub is push-or-pull with different ordering and retry semantics. Read the guarantees, not just the name.", he: "להניח ש\"מקביל\" זה זהה: SQS זה תור pull, ו-Pub/Sub של GCP זה push או pull עם סמנטיקה שונה של ordering ו-retries. קוראים את ההבטחות, לא רק את השם." },
    { en: "Using one AWS account for prod, staging and dev. The account is the blast-radius boundary — use separate accounts via AWS Organizations.", he: "להשתמש ב-account אחד של AWS לפרוד, staging ו-dev. ה-account הוא גבול ה-blast radius — תשתמשו ב-accounts נפרדים דרך AWS Organizations." },
    { en: "Confusing Azure Entra ID roles (directory: who can manage users) with Azure RBAC roles (resources: who can manage VMs).", he: "לבלבל בין roles של Entra ID (directory: מי מנהל משתמשים) לבין roles של Azure RBAC (משאבים: מי מנהל VMs)." }
  ],
  interview: [
    {
      q: { en: "You know AWS well. How would you ramp up on GCP in a week?", he: "אתה מכיר AWS טוב. איך תיכנס ל-GCP בשבוע?" },
      a: { en: "Map concepts (Project ≈ Account, GCS ≈ S3, GKE ≈ EKS), then focus on what's different: global VPCs, IAM bindings on resources with service accounts and Workload Identity, and the project/folder hierarchy. Then deploy something end-to-end with Terraform to hit the real friction.", he: "ממפה קונספטים (Project ≈ Account, GCS ≈ S3, GKE ≈ EKS), ואז מתמקד במה ששונה: VPC גלובלי, IAM bindings על משאבים עם service accounts ו-Workload Identity, וההיררכיה של project/folder. ואז מעלה משהו end-to-end עם Terraform כדי להיתקל בחיכוך האמיתי." }
    },
    {
      q: { en: "What's the equivalent of an AWS account in Azure?", he: "מה המקבילה ל-AWS account ב-Azure?" },
      a: { en: "Closest is a Subscription — it's the billing and quota boundary. Resource Groups are a finer grouping inside it with no strong AWS equivalent (tags or CloudFormation stacks come closest).", he: "הכי קרוב זה Subscription — גבול ה-billing וה-quota. Resource Groups הם קיבוץ עדין יותר בתוכו בלי מקבילה חזקה ב-AWS (tags או CloudFormation stacks הכי קרובים)." }
    }
  ],
  quiz: [
    {
      q: { en: "The Azure equivalent of AWS S3 is:", he: "המקבילה ב-Azure ל-S3 של AWS היא:" },
      options: [
        { en: "Azure Files", he: "Azure Files" },
        { en: "Managed Disks", he: "Managed Disks" },
        { en: "Blob Storage", he: "Blob Storage" },
        { en: "Cosmos DB", he: "Cosmos DB" }
      ],
      answer: 2,
      explain: { en: "Blob Storage is object storage. Azure Files is SMB/NFS file shares, Managed Disks are block storage.", he: "Blob Storage זה object storage. Azure Files זה file shares ב-SMB/NFS, ו-Managed Disks זה block storage." }
    },
    {
      q: { en: "Which cloud's VPC spans all regions by default?", he: "ה-VPC של איזה ענן משתרע על כל ה-regions כברירת מחדל?" },
      options: [
        { en: "AWS", he: "AWS" },
        { en: "Azure", he: "Azure" },
        { en: "GCP", he: "GCP" },
        { en: "All of them", he: "כולם" }
      ],
      answer: 2,
      explain: { en: "GCP VPCs are global with regional subnets. AWS VPCs and Azure VNets are regional and need peering/transit to connect regions.", he: "VPC ב-GCP הוא גלובלי עם subnets אזוריים. VPC ב-AWS ו-VNet ב-Azure הם regional וצריכים peering/transit כדי לחבר regions." }
    },
    {
      q: { en: "Where would you look to find out who deleted a security group in AWS yesterday?", he: "איפה תחפש מי מחק security group ב-AWS אתמול?" },
      options: [
        { en: "CloudWatch Metrics", he: "CloudWatch Metrics" },
        { en: "CloudTrail", he: "CloudTrail" },
        { en: "VPC Flow Logs", he: "VPC Flow Logs" },
        { en: "AWS Config Rules only", he: "רק AWS Config Rules" }
      ],
      answer: 1,
      explain: { en: "CloudTrail records API calls (who, what, when, from where). Azure: Activity Log. GCP: Cloud Audit Logs. Flow Logs record network traffic, not API calls.", he: "CloudTrail מתעד קריאות API (מי, מה, מתי, מאיפה). ב-Azure: Activity Log. ב-GCP: Cloud Audit Logs. Flow Logs מתעדים תעבורת רשת, לא קריאות API." }
    },
    {
      q: { en: "GKE, AKS and EKS are all:", he: "GKE, AKS ו-EKS הם כולם:" },
      options: [
        { en: "Key management services", he: "שירותי ניהול מפתחות" },
        { en: "Managed Kubernetes services", he: "שירותי Kubernetes מנוהלים" },
        { en: "Event buses", he: "Event buses" },
        { en: "Edge key-value stores", he: "Key-value stores ב-edge" }
      ],
      answer: 1,
      explain: { en: "The K is Kubernetes: Google/Azure/Elastic Kubernetes Service.", he: "ה-K זה Kubernetes: Google/Azure/Elastic Kubernetes Service." }
    }
  ],
  related: ["cloud-storage", "cloud-iam-security", "net-vpc"]
});

window.INFRA.lessons.push({
  id: "cloud-storage",
  track: "cloud",
  order: 4,
  icon: "🗄️",
  level: 2,
  minutes: 9,
  title: { en: "Cloud Storage: Object, Block, File", he: "אחסון בענן: Object, Block, File" },
  tldr: {
    en: "Object storage is an infinite key→blob warehouse over HTTP, block storage is a virtual hard drive for one VM, file storage is a shared network folder — pick by access pattern, then tier by temperature.",
    he: "Object storage זה מחסן אינסופי של key→blob מעל HTTP, block storage זה דיסק וירטואלי ל-VM אחד, file storage זו תיקייה משותפת ברשת — בוחרים לפי דפוס הגישה, ואז מחלקים ל-tiers לפי \"טמפרטורה\"."
  },
  analogy: {
    en: "Object storage is a giant coat check: you hand over a whole coat, get a ticket (the key), and get the whole coat back — you can't swap one button. Block storage is your own desk drawer: fast, you can rearrange any item, but it's attached to your desk only. File storage is the office shared cabinet: everyone can open the same folders at once, but you queue at it on busy days.",
    he: "Object storage זה מלתחה ענקית: נותנים מעיל שלם, מקבלים פתק (ה-key), ומקבלים את המעיל השלם בחזרה — אי אפשר להחליף כפתור אחד. Block storage זו המגירה שלך בשולחן: מהיר, אפשר לסדר כל פריט, אבל היא מחוברת רק לשולחן שלך. File storage זה הארון המשותף במשרד: כולם פותחים את אותן תיקיות בו-זמנית, אבל בימים עמוסים יש תור."
  },
  sections: [
    {
      h: { en: "Three kinds of storage", he: "שלושה סוגי אחסון" },
      body: {
        en: `<table>
<tr><th></th><th>Object</th><th>Block</th><th>File</th></tr>
<tr><td>AWS / Azure / GCP</td><td>S3 / Blob / GCS</td><td>EBS / Managed Disks / Persistent Disk</td><td>EFS / Azure Files / Filestore</td></tr>
<tr><td>Interface</td><td>HTTP API (PUT/GET key)</td><td>Raw disk, you put a filesystem on it</td><td>NFS / SMB mount</td></tr>
<tr><td>Attach to</td><td>Anything with network</td><td>One VM (mostly), same AZ</td><td>Many VMs/pods at once</td></tr>
<tr><td>Latency</td><td>~10-100 ms per request</td><td>sub-ms to ~1 ms</td><td>~1-10 ms</td></tr>
<tr><td>Scale</td><td>Practically unlimited</td><td>Up to 16-64 TiB per volume</td><td>Petabytes, elastic</td></tr>
<tr><td>Price (approx, per GB-month)</td><td>~$0.023</td><td>~$0.08 (gp3)</td><td>~$0.30 (EFS standard)</td></tr>
<tr><td>Use for</td><td>Backups, media, data lakes, static sites, logs</td><td>DB data dirs, boot disks</td><td>Shared content, legacy apps, ML datasets</td></tr>
</table>
<p>Objects are <strong>immutable</strong>: to change one byte you rewrite the whole object. That's why you can't run Postgres on S3 — but you can store 50 PB of logs on it.</p>`,
        he: `<table>
<tr><th></th><th>Object</th><th>Block</th><th>File</th></tr>
<tr><td>AWS / Azure / GCP</td><td>S3 / Blob / GCS</td><td>EBS / Managed Disks / Persistent Disk</td><td>EFS / Azure Files / Filestore</td></tr>
<tr><td>ממשק</td><td>HTTP API (PUT/GET לפי key)</td><td>דיסק גולמי, שמים עליו filesystem</td><td>mount של NFS / SMB</td></tr>
<tr><td>מחובר ל</td><td>כל דבר עם רשת</td><td>VM אחד (ברוב המקרים), באותו AZ</td><td>הרבה VMs/pods במקביל</td></tr>
<tr><td>Latency</td><td>~10-100 ms לבקשה</td><td>פחות מ-ms עד ~1 ms</td><td>~1-10 ms</td></tr>
<tr><td>סקייל</td><td>כמעט אינסופי</td><td>עד 16-64 TiB ל-volume</td><td>פטה-בייטים, אלסטי</td></tr>
<tr><td>מחיר (בערך, ל-GB לחודש)</td><td>~$0.023</td><td>~$0.08 (gp3)</td><td>~$0.30 (EFS standard)</td></tr>
<tr><td>משמש ל</td><td>Backups, מדיה, data lakes, אתרים סטטיים, לוגים</td><td>תיקיית data של DB, דיסקי boot</td><td>תוכן משותף, אפליקציות legacy, datasets ל-ML</td></tr>
</table>
<p>Objects הם <strong>immutable</strong>: כדי לשנות בייט אחד כותבים מחדש את כל האובייקט. בגלל זה אי אפשר להריץ Postgres על S3 — אבל אפשר לשמור עליו 50 PB של לוגים.</p>`
      }
    },
    {
      h: { en: "Durability vs availability (the 11 nines)", he: "Durability מול Availability (11 התשיעיות)" },
      body: {
        en: `<p><strong>Durability</strong> = probability your data is not lost. S3 Standard is designed for <strong>99.999999999%</strong> (11 nines): store 10 million objects and expect to lose one every ~10,000 years. It achieves this by storing copies across ≥3 AZs and constantly checksumming/repairing.</p>
<p><strong>Availability</strong> = probability you can read it <em>right now</em>. S3 Standard is designed for 99.99% (~52 min/year of possible errors), with an SLA of 99.9%. S3 One Zone-IA lives in a single AZ — same 11 nines on paper, but an AZ disaster can destroy it.</p>
<p>Block storage is very different: EBS gp3 durability is ~99.8-99.9% per year (annual failure rate 0.1-0.2%), io2 is 99.999%. That's why <strong>you snapshot EBS volumes</strong> — snapshots are stored in S3.</p>
<blockquote>⚠️ Production tip: 11 nines of durability does NOT protect you from <code>aws s3 rm --recursive</code>. The cloud faithfully, durably stores your mistakes. Enable <strong>versioning</strong>, MFA delete or Object Lock for anything you can't afford to lose.</blockquote>`,
        he: `<p><strong>Durability</strong> = ההסתברות שה-data לא יאבד. S3 Standard מתוכנן ל-<strong>99.999999999%</strong> (11 תשיעיות): שומרים 10 מיליון אובייקטים ומצפים לאבד אחד כל ~10,000 שנה. זה מושג ע"י שמירת עותקים על ≥3 AZs ובדיקת checksum ותיקון כל הזמן.</p>
<p><strong>Availability</strong> = ההסתברות שאפשר לקרוא אותו <em>עכשיו</em>. S3 Standard מתוכנן ל-99.99% (~52 דקות בשנה של שגיאות אפשריות), עם SLA של 99.9%. S3 One Zone-IA חי ב-AZ אחד — אותן 11 תשיעיות על הנייר, אבל אסון ב-AZ יכול למחוק אותו.</p>
<p>Block storage שונה מאוד: ה-durability של EBS gp3 הוא ~99.8-99.9% בשנה (שיעור כשל שנתי 0.1-0.2%), ו-io2 הוא 99.999%. בגלל זה <strong>עושים snapshots ל-EBS</strong> — ה-snapshots נשמרים ב-S3.</p>
<blockquote>⚠️ Production tip: 11 תשיעיות של durability לא מגינות עליך מ-<code>aws s3 rm --recursive</code>. הענן שומר בנאמנות ובעמידות גם את הטעויות שלך. תפעילו <strong>versioning</strong>, MFA delete או Object Lock לכל מה שאסור לאבד.</blockquote>`
      }
    },
    {
      h: { en: "Storage tiers and lifecycle policies", he: "Storage tiers ו-lifecycle policies" },
      body: {
        en: `<p>Object storage is priced by "temperature". You pay less to store colder data, but more (and slower) to read it:</p>
<table>
<tr><th>S3 class</th><th>~$/GB-month</th><th>Retrieval</th></tr>
<tr><td>Standard</td><td>0.023</td><td>instant, free</td></tr>
<tr><td>Standard-IA (min 30 days)</td><td>0.0125</td><td>instant, $0.01/GB</td></tr>
<tr><td>Glacier Instant Retrieval</td><td>0.004</td><td>instant, $0.03/GB</td></tr>
<tr><td>Glacier Deep Archive (min 180 days)</td><td>0.00099</td><td>12-48 hours</td></tr>
</table>
<p>Azure: Hot / Cool / Cold / Archive. GCP: Standard / Nearline / Coldline / Archive. Automate moves with a lifecycle rule:</p>
<pre>{ "Rules": [{
  "ID": "logs-aging", "Status": "Enabled",
  "Filter": { "Prefix": "logs/" },
  "Transitions": [
    { "Days": 30,  "StorageClass": "STANDARD_IA" },
    { "Days": 90,  "StorageClass": "GLACIER_IR" },
    { "Days": 365, "StorageClass": "DEEP_ARCHIVE" } ],
  "Expiration": { "Days": 2555 } }] }</pre>
<p>Not sure about access patterns? <strong>S3 Intelligent-Tiering</strong> moves objects automatically for a small monitoring fee.</p>`,
        he: `<p>Object storage מתומחר לפי "טמפרטורה". משלמים פחות על אחסון data קר, אבל יותר (ולאט יותר) על קריאה שלו:</p>
<table>
<tr><th>S3 class</th><th>~$ ל-GB לחודש</th><th>שליפה</th></tr>
<tr><td>Standard</td><td>0.023</td><td>מיידית, בחינם</td></tr>
<tr><td>Standard-IA (מינימום 30 יום)</td><td>0.0125</td><td>מיידית, $0.01 ל-GB</td></tr>
<tr><td>Glacier Instant Retrieval</td><td>0.004</td><td>מיידית, $0.03 ל-GB</td></tr>
<tr><td>Glacier Deep Archive (מינימום 180 יום)</td><td>0.00099</td><td>12-48 שעות</td></tr>
</table>
<p>ב-Azure: Hot / Cool / Cold / Archive. ב-GCP: Standard / Nearline / Coldline / Archive. מעבירים אוטומטית עם lifecycle rule:</p>
<pre>{ "Rules": [{
  "ID": "logs-aging", "Status": "Enabled",
  "Filter": { "Prefix": "logs/" },
  "Transitions": [
    { "Days": 30,  "StorageClass": "STANDARD_IA" },
    { "Days": 90,  "StorageClass": "GLACIER_IR" },
    { "Days": 365, "StorageClass": "DEEP_ARCHIVE" } ],
  "Expiration": { "Days": 2555 } }] }</pre>
<p>לא בטוחים לגבי דפוס הגישה? <strong>S3 Intelligent-Tiering</strong> מזיז אובייקטים אוטומטית בתמורה לעמלת ניטור קטנה.</p>`
      }
    },
    {
      h: { en: "Block storage performance: IOPS and throughput", he: "ביצועי block storage: IOPS ו-throughput" },
      body: {
        en: `<p>Cloud disks are network-attached, and you buy performance explicitly. EBS <strong>gp3</strong>: baseline 3,000 IOPS and 125 MB/s regardless of size, provision up to 16,000 IOPS / 1,000 MB/s. <strong>io2</strong>: up to 64,000+ IOPS with sub-ms latency for heavy databases. The instance also has its own EBS bandwidth cap — a tiny instance can't drive a huge disk.</p>
<p>Also: block volumes are <strong>zonal</strong>. An EBS volume in <code>eu-central-1a</code> can't attach to a VM in <code>1b</code>. In Kubernetes, that's why a StatefulSet pod sometimes stays Pending after a node dies: its PersistentVolume is stuck in the other AZ. (Azure ZRS disks and GCP regional PDs replicate across zones to avoid this.)</p>
<blockquote>💡 Real world: migrating from gp2 to gp3 is usually a free ~20% saving with equal or better performance — one of the easiest FinOps wins, done online with <code>aws ec2 modify-volume</code>.</blockquote>`,
        he: `<p>דיסקים בענן מחוברים דרך הרשת, וקונים ביצועים במפורש. EBS <strong>gp3</strong>: בסיס של 3,000 IOPS ו-125 MB/s בלי קשר לגודל, ואפשר להקצות עד 16,000 IOPS / 1,000 MB/s. <strong>io2</strong>: עד 64,000+ IOPS עם latency מתחת ל-ms בשביל DBs כבדים. גם ל-instance יש תקרת EBS bandwidth משלו — instance קטנטן לא יכול להפעיל דיסק ענק.</p>
<p>ועוד: block volumes הם <strong>zonal</strong>. EBS volume ב-<code>eu-central-1a</code> לא יכול להתחבר ל-VM ב-<code>1b</code>. ב-Kubernetes, בגלל זה pod של StatefulSet לפעמים נשאר Pending אחרי שה-node מת: ה-PersistentVolume שלו תקוע ב-AZ האחר. (דיסקים ZRS ב-Azure ו-regional PD ב-GCP משוכפלים בין zones כדי למנוע את זה.)</p>
<blockquote>💡 Real world: מעבר מ-gp2 ל-gp3 הוא בדרך כלל חיסכון חינמי של ~20% עם ביצועים זהים או טובים יותר — אחד ה-FinOps wins הכי קלים, ונעשה online עם <code>aws ec2 modify-volume</code>.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: "aws s3 cp ./backup.tar.gz s3://my-bucket/backups/ --storage-class STANDARD_IA", what: { en: "Upload straight into a cheaper tier.", he: "העלאה ישירות ל-tier זול יותר." } },
    { cmd: "aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled", what: { en: "Turn on versioning so deletes and overwrites are recoverable.", he: "מפעיל versioning כדי שמחיקות ודריסות יהיו הפיכות." } },
    { cmd: "aws ec2 modify-volume --volume-id vol-0123456789abcdef0 --volume-type gp3 --iops 6000 --throughput 250", what: { en: "Convert a disk to gp3 and raise IOPS online, no downtime.", he: "ממיר דיסק ל-gp3 ומעלה IOPS אונליין, בלי downtime." } },
    { cmd: "fio --name=randread --rw=randread --bs=4k --size=1G --iodepth=32 --runtime=30 --direct=1", what: { en: "Benchmark the random-read IOPS your block volume actually delivers.", he: "בנצ'מרק ל-IOPS של קריאה רנדומלית שה-volume באמת נותן." } }
  ],
  mnemonic: {
    en: "\"Object = Online warehouse, Block = Boot disk, File = Folder for everyone.\" And: Durability = Don't lose it; Availability = Access it now.",
    he: "\"Object = מחסן ברשת, Block = דיסק של מחשב אחד, File = תיקייה של כולם.\" ו-Durability = לא לאבד; Availability = לגשת עכשיו."
  },
  pitfalls: [
    { en: "Putting a database on EFS/NFS for 'shared storage'. Latency and locking semantics will hurt; use block storage and DB-level replication.", he: "לשים DB על EFS/NFS בשביל \"אחסון משותף\". ה-latency וסמנטיקת ה-locking יכאיבו; משתמשים ב-block storage ורפליקציה ברמת ה-DB." },
    { en: "Moving millions of tiny objects to Glacier: per-object transition fees and minimum-size billing can cost more than you save.", he: "להעביר מיליוני אובייקטים קטנטנים ל-Glacier: עמלות מעבר לכל אובייקט וחיוב לפי גודל מינימלי יכולים לעלות יותר ממה שחוסכים." },
    { en: "Forgetting orphaned EBS volumes and old snapshots after deleting VMs — silent money leaks.", he: "לשכוח EBS volumes יתומים ו-snapshots ישנים אחרי מחיקת VMs — דליפות כסף שקטות." }
  ],
  interview: [
    {
      q: { en: "S3 has 11 nines of durability. Do I still need backups?", he: "ל-S3 יש 11 תשיעיות של durability. אני עדיין צריך backups?" },
      a: { en: "Yes. Durability protects against hardware loss, not against deletion, overwrite, ransomware, a compromised IAM key, or a region-wide issue. Use versioning, Object Lock, cross-region or cross-account replication, and test restores.", he: "כן. Durability מגן מפני אובדן חומרה, לא מפני מחיקה, דריסה, ransomware, IAM key שנפרץ, או בעיה ברמת region. משתמשים ב-versioning, Object Lock, רפליקציה cross-region או cross-account, ובודקים restore." }
    },
    {
      q: { en: "Why might a StatefulSet pod stay Pending after its node fails?", he: "למה pod של StatefulSet יכול להישאר Pending אחרי שה-node שלו נפל?" },
      a: { en: "Its PersistentVolume is a zonal block disk (EBS/PD). The scheduler must place the pod in the same AZ; if there's no capacity there, it stays Pending. Fixes: capacity in every AZ, regional disks, or app-level replication.", he: "ה-PersistentVolume שלו הוא דיסק block זונלי (EBS/PD). ה-scheduler חייב לשים את ה-pod באותו AZ; אם אין שם קיבולת, הוא נשאר Pending. פתרונות: קיבולת בכל AZ, דיסקים regional, או רפליקציה ברמת האפליקציה." }
    }
  ],
  quiz: [
    {
      q: { en: "You need a disk for a PostgreSQL data directory. Best choice?", he: "צריך דיסק לתיקיית ה-data של PostgreSQL. מה הכי מתאים?" },
      options: [
        { en: "S3 mounted with a FUSE driver", he: "S3 עם mount דרך FUSE" },
        { en: "Block storage (EBS gp3/io2, Managed Disk, PD)", he: "Block storage (EBS gp3/io2, Managed Disk, PD)" },
        { en: "EFS shared across all app servers", he: "EFS משותף לכל שרתי האפליקציה" },
        { en: "Glacier Instant Retrieval", he: "Glacier Instant Retrieval" }
      ],
      answer: 1,
      explain: { en: "Databases need low-latency random I/O and in-place writes — that's block storage. Object storage is immutable and slow per-request; NFS adds latency and locking issues.", he: "DBs צריכים I/O רנדומלי עם latency נמוך וכתיבה במקום — זה block storage. Object storage הוא immutable ואיטי לכל בקשה; NFS מוסיף latency ובעיות locking." }
    },
    {
      q: { en: "'11 nines' in S3 refers to:", he: "\"11 תשיעיות\" ב-S3 מתייחס ל:" },
      options: [
        { en: "Availability — S3 is never down", he: "Availability — S3 אף פעם לא נופל" },
        { en: "Durability — probability of not losing an object", he: "Durability — ההסתברות לא לאבד אובייקט" },
        { en: "The SLA refund percentage", he: "אחוז ההחזר ב-SLA" },
        { en: "Read latency in nanoseconds", he: "Latency של קריאה בננו-שניות" }
      ],
      answer: 1,
      explain: { en: "Durability is 11 nines; availability for S3 Standard is designed at 99.99% with a 99.9% SLA.", he: "Durability זה 11 תשיעיות; ה-availability של S3 Standard מתוכנן ל-99.99% עם SLA של 99.9%." }
    },
    {
      q: { en: "Compliance requires keeping audit logs 7 years; they're almost never read. Cheapest correct approach?", he: "רגולציה מחייבת לשמור audit logs 7 שנים; כמעט אף פעם לא קוראים אותם. מה הגישה הכי זולה ונכונה?" },
      options: [
        { en: "Keep them in S3 Standard forever", he: "להשאיר אותם ב-S3 Standard לתמיד" },
        { en: "Store them on a big EBS volume", he: "לשמור אותם על EBS volume גדול" },
        { en: "Lifecycle rule to Glacier Deep Archive + Object Lock, expire after 7 years", he: "Lifecycle rule ל-Glacier Deep Archive + Object Lock, ומחיקה אחרי 7 שנים" },
        { en: "Delete after 30 days and hope", he: "למחוק אחרי 30 יום ולקוות" }
      ],
      answer: 2,
      explain: { en: "Deep Archive is ~23x cheaper than Standard; Object Lock makes them tamper-proof; expiration keeps you from paying forever.", he: "Deep Archive זול פי ~23 מ-Standard; Object Lock הופך אותם לבלתי ניתנים לשינוי; ה-expiration מונע תשלום לנצח." }
    }
  ],
  related: ["storage-io", "db-backups", "cloud-finops"]
});

window.INFRA.lessons.push({
  id: "cloud-iac",
  track: "cloud",
  order: 5,
  icon: "🏗️",
  level: 2,
  minutes: 11,
  title: { en: "Infrastructure as Code & Terraform", he: "Infrastructure as Code ו-Terraform" },
  tldr: {
    en: "Describe infrastructure in versioned code, let a tool diff desired vs actual state, review the plan in a PR, then apply — no more snowflake servers clicked together in a console.",
    he: "מתארים תשתית בקוד עם version control, נותנים לכלי לעשות diff בין המצב הרצוי למצוי, עושים review ל-plan ב-PR, ואז apply — בלי שרתים-פתיתי-שלג שנבנו בקליקים בקונסול."
  },
  analogy: {
    en: "Terraform is an architect's blueprint plus a very literal contractor. You draw the house (code). The contractor compares the blueprint to what's on the lot (state + real cloud), writes a work order ('add 1 window, demolish 1 garage') — that's the plan — and only builds after you sign it. If someone secretly adds a balcony (console click), the next survey flags it as drift.",
    he: "Terraform זה תוכנית של אדריכל ועוד קבלן מאוד מילולי. אתה משרטט את הבית (קוד). הקבלן משווה את התוכנית למה שיש על המגרש (state + הענן האמיתי), כותב הזמנת עבודה (\"להוסיף חלון אחד, להרוס מוסך אחד\") — זה ה-plan — ובונה רק אחרי שחתמת. אם מישהו הוסיף מרפסת בסתר (קליק בקונסול), הסקר הבא יסמן את זה כ-drift."
  },
  sections: [
    {
      h: { en: "Why IaC", he: "למה IaC" },
      body: {
        en: `<p>Clicking in a console is fine for learning and terrible for production. IaC gives you:</p>
<ul>
<li><strong>Reproducibility</strong>: spin up an identical staging env, or rebuild prod in a new region during DR.</li>
<li><strong>Review</strong>: infra changes go through pull requests, with a diff anyone can read.</li>
<li><strong>History &amp; blame</strong>: <code>git log</code> tells you who opened port 22 and why.</li>
<li><strong>Drift detection</strong>: know when reality no longer matches the code.</li>
</ul>
<p>Two styles: <strong>declarative</strong> (Terraform, CloudFormation, Bicep — describe the end state, tool figures out the steps) vs <strong>imperative</strong> (bash scripts with <code>aws</code> CLI — run steps in order, which breaks the second time you run it). Declarative tools are <em>idempotent</em>: apply twice, get the same result.</p>`,
        he: `<p>קליקים בקונסול זה טוב ללמידה ונוראי לפרודקשן. IaC נותן:</p>
<ul>
<li><strong>שחזוריות</strong>: להרים סביבת staging זהה, או לבנות מחדש את הפרוד ב-region חדש בזמן DR.</li>
<li><strong>Review</strong>: שינויי תשתית עוברים דרך pull requests, עם diff שכל אחד יכול לקרוא.</li>
<li><strong>היסטוריה ו-blame</strong>: <code>git log</code> מספר מי פתח את פורט 22 ולמה.</li>
<li><strong>זיהוי drift</strong>: לדעת מתי המציאות כבר לא תואמת את הקוד.</li>
</ul>
<p>שני סגנונות: <strong>declarative</strong> (Terraform, CloudFormation, Bicep — מתארים את מצב הסיום, והכלי מבין את הצעדים) מול <strong>imperative</strong> (סקריפטי bash עם <code>aws</code> CLI — מריצים צעדים לפי הסדר, ונשבר בפעם השנייה שמריצים). כלים declarative הם <em>idempotent</em>: עושים apply פעמיים, מקבלים אותה תוצאה.</p>`
      }
    },
    {
      h: { en: "Terraform core concepts", he: "המושגים המרכזיים ב-Terraform" },
      body: {
        en: `<p><strong>Providers</strong> are plugins that talk to APIs (aws, azurerm, google, kubernetes, cloudflare, datadog…). <strong>Resources</strong> are things to create. <strong>Data sources</strong> read existing things. <strong>Variables/outputs</strong> parameterize and expose values.</p>
<pre>terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 5.0" }
  }
}
provider "aws" { region = "eu-central-1" }

variable "env" { type = string }

resource "aws_s3_bucket" "assets" {
  bucket = "acme-assets-\${var.env}"
  tags   = { env = var.env, team = "web" }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id   # implicit dependency
  versioning_configuration { status = "Enabled" }
}

output "bucket_arn" { value = aws_s3_bucket.assets.arn }</pre>
<p>Terraform builds a <strong>dependency graph</strong> from references (<code>aws_s3_bucket.assets.id</code>) and creates things in parallel where it can. Workflow: <code>init</code> (download providers) → <code>plan</code> (show diff: <code>+</code> create, <code>~</code> update in-place, <code>-/+</code> replace, <code>-</code> destroy) → <code>apply</code>.</p>`,
        he: `<p><strong>Providers</strong> הם plugins שמדברים עם APIs (aws, azurerm, google, kubernetes, cloudflare, datadog…). <strong>Resources</strong> הם דברים שיוצרים. <strong>Data sources</strong> קוראים דברים קיימים. <strong>Variables/outputs</strong> מאפשרים פרמטרים וחשיפת ערכים.</p>
<pre>terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 5.0" }
  }
}
provider "aws" { region = "eu-central-1" }

variable "env" { type = string }

resource "aws_s3_bucket" "assets" {
  bucket = "acme-assets-\${var.env}"
  tags   = { env = var.env, team = "web" }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id   # implicit dependency
  versioning_configuration { status = "Enabled" }
}

output "bucket_arn" { value = aws_s3_bucket.assets.arn }</pre>
<p>Terraform בונה <strong>גרף תלויות</strong> מתוך ההפניות (<code>aws_s3_bucket.assets.id</code>) ויוצר דברים במקביל כשאפשר. ה-workflow: <code>init</code> (הורדת providers) → <code>plan</code> (מציג diff: <code>+</code> יצירה, <code>~</code> עדכון במקום, <code>-/+</code> החלפה, <code>-</code> מחיקה) → <code>apply</code>.</p>`
      }
    },
    {
      h: { en: "State: the most important file you never edit", he: "State: הקובץ הכי חשוב שאף פעם לא עורכים" },
      body: {
        en: `<p><code>terraform.tfstate</code> maps your code (<code>aws_s3_bucket.assets</code>) to real IDs (<code>acme-assets-prod</code>). Without it, Terraform doesn't know what it owns. It also contains <strong>secrets in plaintext</strong> (DB passwords, keys), so treat it like a secret.</p>
<p>Never keep state on a laptop or in git. Use a <strong>remote backend with locking</strong> so two engineers can't apply at once and corrupt it:</p>
<pre>terraform {
  backend "s3" {
    bucket       = "acme-tf-state"
    key          = "prod/network/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true   # S3-native locking (older setups: dynamodb_table)
  }
}</pre>
<p>Azure: <code>azurerm</code> backend (blob lease = lock). GCP: <code>gcs</code> backend. Or Terraform Cloud / Spacelift / env0. Split state per environment and per layer (network, data, apps) to keep the blast radius small and plans fast.</p>
<blockquote>⚠️ Production tip: if a plan shows <code>-/+ destroy and then create replacement</code> on a database, STOP. Some attributes (engine, AZ, identifier) force replacement. Add <code>lifecycle { prevent_destroy = true }</code> to stateful resources.</blockquote>`,
        he: `<p><code>terraform.tfstate</code> ממפה בין הקוד (<code>aws_s3_bucket.assets</code>) ל-IDs אמיתיים (<code>acme-assets-prod</code>). בלעדיו Terraform לא יודע מה שלו. הוא גם מכיל <strong>secrets בטקסט גלוי</strong> (סיסמאות DB, מפתחות), אז מתייחסים אליו כמו ל-secret.</p>
<p>אף פעם לא שומרים state על לפטופ או ב-git. משתמשים ב-<strong>remote backend עם locking</strong> כדי ששני מהנדסים לא יעשו apply במקביל וישחיתו אותו:</p>
<pre>terraform {
  backend "s3" {
    bucket       = "acme-tf-state"
    key          = "prod/network/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true   # S3-native locking (older setups: dynamodb_table)
  }
}</pre>
<p>ב-Azure: backend של <code>azurerm</code> (blob lease = lock). ב-GCP: backend של <code>gcs</code>. או Terraform Cloud / Spacelift / env0. מפצלים state לפי סביבה ולפי שכבה (network, data, apps) כדי לשמור על blast radius קטן ו-plans מהירים.</p>
<blockquote>⚠️ Production tip: אם ה-plan מראה <code>-/+ destroy and then create replacement</code> על database — עוצרים. יש attributes (engine, AZ, identifier) שמכריחים החלפה. תוסיפו <code>lifecycle { prevent_destroy = true }</code> למשאבים stateful.</blockquote>`
      }
    },
    {
      h: { en: "Modules, drift, and import", he: "Modules, drift ו-import" },
      body: {
        en: `<p><strong>Modules</strong> are reusable functions for infra: a <code>vpc</code> module with inputs (CIDR, AZs) and outputs (subnet IDs). Pin versions: <code>source = "terraform-aws-modules/vpc/aws"</code>, <code>version = "5.8.1"</code>. Keep env differences in variables, not copy-pasted code.</p>
<p><strong>Drift</strong> = someone changed the real resource outside Terraform (a hotfix in the console at 2 AM). <code>terraform plan</code> will show it and offer to revert it. Run a scheduled <code>plan -detailed-exitcode</code> in CI (exit code 2 = changes) to detect drift daily.</p>
<p><strong>Import</strong> adopts existing resources: an <code>import { to = aws_s3_bucket.legacy  id = "old-bucket" }</code> block plus <code>terraform plan -generate-config-out=gen.tf</code> writes the code for you.</p>
<p>The <code>count</code>/<code>for_each</code> gotcha: with <code>count</code>, removing item 0 from a list shifts every index and Terraform wants to recreate everything after it. Prefer <code>for_each</code> over a map.</p>`,
        he: `<p><strong>Modules</strong> הם פונקציות לשימוש חוזר בתשתית: module של <code>vpc</code> עם inputs (CIDR, AZs) ו-outputs (subnet IDs). נועלים גרסאות: <code>source = "terraform-aws-modules/vpc/aws"</code>, <code>version = "5.8.1"</code>. ההבדלים בין סביבות נשארים במשתנים, לא בקוד מועתק.</p>
<p><strong>Drift</strong> = מישהו שינה את המשאב האמיתי מחוץ ל-Terraform (hotfix בקונסול ב-2 בלילה). <code>terraform plan</code> יראה את זה ויציע להחזיר. מריצים <code>plan -detailed-exitcode</code> מתוזמן ב-CI (exit code 2 = יש שינויים) כדי לזהות drift כל יום.</p>
<p><strong>Import</strong> מאמץ משאבים קיימים: בלוק <code>import { to = aws_s3_bucket.legacy  id = "old-bucket" }</code> ועוד <code>terraform plan -generate-config-out=gen.tf</code> כותב בשבילך את הקוד.</p>
<p>המלכודת של <code>count</code>/<code>for_each</code>: עם <code>count</code>, הסרת פריט 0 מרשימה מזיזה את כל האינדקסים ו-Terraform ירצה ליצור מחדש את כל מה שאחריו. עדיף <code>for_each</code> על map.</p>`
      }
    },
    {
      h: { en: "Alternatives: Pulumi, CDK, CloudFormation, Bicep", he: "אלטרנטיבות: Pulumi, CDK, CloudFormation, Bicep" },
      body: {
        en: `<table>
<tr><th>Tool</th><th>Language</th><th>Clouds</th><th>State</th></tr>
<tr><td>Terraform / OpenTofu</td><td>HCL</td><td>Any (3,000+ providers)</td><td>You manage (remote backend)</td></tr>
<tr><td>Pulumi</td><td>TypeScript, Python, Go, C#</td><td>Any</td><td>Pulumi Cloud or self-managed</td></tr>
<tr><td>CloudFormation</td><td>YAML/JSON</td><td>AWS only</td><td>Managed by AWS (stacks)</td></tr>
<tr><td>AWS CDK</td><td>TS/Python/Java… → synthesizes CloudFormation</td><td>AWS</td><td>CloudFormation</td></tr>
<tr><td>Bicep</td><td>Bicep DSL → ARM JSON</td><td>Azure only</td><td>Azure itself (no state file)</td></tr>
<tr><td>Crossplane</td><td>Kubernetes CRDs</td><td>Any</td><td>The K8s API</td></tr>
</table>
<p>OpenTofu is the open-source fork of Terraform created after HashiCorp's 2023 license change (BSL); it's CLI-compatible. Pick by team skills and cloud footprint: multi-cloud or SaaS providers → Terraform/OpenTofu; Azure-only shop → Bicep is lovely; developers who hate HCL → Pulumi or CDK.</p>
<blockquote>💡 Real world: whatever tool you pick, the real IaC maturity test is "can we lock the console to read-only in prod?" If people still need to click, your IaC isn't done.</blockquote>`,
        he: `<table>
<tr><th>כלי</th><th>שפה</th><th>עננים</th><th>State</th></tr>
<tr><td>Terraform / OpenTofu</td><td>HCL</td><td>כל ענן (3,000+ providers)</td><td>אתה מנהל (remote backend)</td></tr>
<tr><td>Pulumi</td><td>TypeScript, Python, Go, C#</td><td>כל ענן</td><td>Pulumi Cloud או self-managed</td></tr>
<tr><td>CloudFormation</td><td>YAML/JSON</td><td>רק AWS</td><td>מנוהל ע"י AWS (stacks)</td></tr>
<tr><td>AWS CDK</td><td>TS/Python/Java… → מייצר CloudFormation</td><td>AWS</td><td>CloudFormation</td></tr>
<tr><td>Bicep</td><td>Bicep DSL → ARM JSON</td><td>רק Azure</td><td>Azure עצמו (אין קובץ state)</td></tr>
<tr><td>Crossplane</td><td>Kubernetes CRDs</td><td>כל ענן</td><td>ה-API של K8s</td></tr>
</table>
<p>OpenTofu הוא ה-fork הקוד-פתוח של Terraform שנוצר אחרי שינוי הרישיון של HashiCorp ב-2023 (BSL); הוא תואם ב-CLI. בוחרים לפי הכישורים בצוות והענן: multi-cloud או SaaS providers → Terraform/OpenTofu; חנות Azure-only → Bicep מקסים; מפתחים ששונאים HCL → Pulumi או CDK.</p>
<blockquote>💡 Real world: לא משנה איזה כלי בחרתם, מבחן הבגרות האמיתי של IaC הוא "אפשר לנעול את הקונסול ל-read-only בפרוד?" אם אנשים עדיין צריכים לקלוק, ה-IaC שלכם לא גמור.</blockquote>`
      }
    }
  ],
  diagram: `  code (*.tf) ----+
                  |   terraform plan          terraform apply
  state (remote) -+--> [ diff engine ] --> plan --(PR review)--> cloud APIs
                  |          ^                                     |
  real cloud -----+          +------------- refresh <--------------+
                      +  create   ~ update   -/+ replace   - destroy`,
  handsOn: [
    { cmd: "terraform init && terraform fmt -recursive && terraform validate", what: { en: "Download providers, format code, catch syntax/type errors before planning.", he: "מוריד providers, מפרמט קוד, ותופס שגיאות תחביר/טיפוסים לפני plan." } },
    { cmd: "terraform plan -out=tfplan -var env=staging", what: { en: "Save the exact plan so apply runs what was reviewed, nothing else.", he: "שומר את ה-plan המדויק כדי שה-apply יריץ בדיוק את מה שעבר review, ותו לא." } },
    { cmd: "terraform apply tfplan", what: { en: "Apply the saved plan (no re-planning surprises).", he: "מריץ את ה-plan השמור (בלי הפתעות של plan מחדש)." } },
    { cmd: "terraform state list && terraform state show aws_s3_bucket.assets", what: { en: "Inspect what Terraform thinks it manages.", he: "בודק מה Terraform חושב שהוא מנהל." } },
    { cmd: "terraform plan -detailed-exitcode; echo $?", what: { en: "Drift check: 0 = clean, 2 = differences, 1 = error. Great for a nightly CI job.", he: "בדיקת drift: 0 = נקי, 2 = יש הבדלים, 1 = שגיאה. מעולה ל-job לילי ב-CI." } }
  ],
  mnemonic: {
    en: "\"Init, Plan, Apply — Read the plan or cry.\" And: State is Sacred, Shared (remote) and Secret.",
    he: "\"Init, Plan, Apply — מי שלא קורא את ה-plan, בוכה.\" ו-State: קדוש, משותף (remote) וסודי."
  },
  pitfalls: [
    { en: "Committing terraform.tfstate to git — it holds plaintext secrets and causes merge conflicts. Use a remote, encrypted, locked backend.", he: "לעשות commit ל-terraform.tfstate ל-git — יש בו secrets גלויים והוא גורם ל-merge conflicts. משתמשים ב-backend מרוחק, מוצפן ונעול." },
    { en: "Rubber-stamping plans. A renamed resource or a ForceNew attribute shows as destroy+create — on a database that's data loss. Use <code>moved {}</code> blocks for renames.", he: "לאשר plans בלי לקרוא. resource ששינו לו שם או attribute מסוג ForceNew מופיע כ-destroy+create — על DB זה איבוד data. משתמשים בבלוקי moved {} לשינוי שמות." },
    { en: "One giant state for everything: 15-minute plans, and a typo in the app layer can touch the VPC. Split by layer and environment.", he: "State ענק אחד לכל דבר: plans של 15 דקות, וטעות הקלדה בשכבת האפליקציה יכולה לגעת ב-VPC. מפצלים לפי שכבה וסביבה." },
    { en: "Unpinned provider/module versions — a new major version silently changes behavior. Commit .terraform.lock.hcl and pin versions.", he: "גרסאות לא נעולות ל-providers/modules — major חדש משנה התנהגות בשקט. עושים commit ל-.terraform.lock.hcl ונועלים גרסאות." }
  ],
  interview: [
    {
      q: { en: "What is Terraform state and why does it need locking?", he: "מה זה Terraform state ולמה הוא צריך locking?" },
      a: { en: "State maps resources in code to real-world IDs and caches attributes, so Terraform can compute diffs and know what it owns. If two applies run concurrently, both read the same state, make changes, and the last write wins — losing track of resources or corrupting state. Locking (S3 lockfile, DynamoDB, blob lease, TF Cloud) serializes operations.", he: "ה-state ממפה בין משאבים בקוד ל-IDs אמיתיים ושומר attributes, כדי ש-Terraform יחשב diffs וידע מה שלו. אם שני applies רצים במקביל, שניהם קוראים את אותו state, משנים, והכתיבה האחרונה מנצחת — מאבדים מעקב אחרי משאבים או משחיתים את ה-state. Locking (S3 lockfile, DynamoDB, blob lease, TF Cloud) מסדר את הפעולות אחת אחרי השנייה." }
    },
    {
      q: { en: "Someone changed a security group manually in prod. What happens on the next plan and what do you do?", he: "מישהו שינה security group ידנית בפרוד. מה קורה ב-plan הבא ומה עושים?" },
      a: { en: "Terraform refreshes, sees the drift and proposes reverting to the code. First understand WHY it was changed (maybe an incident fix). If it's needed, codify it in a PR; if not, apply to revert. Then prevent recurrence: read-only console in prod, scheduled drift detection.", he: "Terraform עושה refresh, רואה את ה-drift ומציע להחזיר למה שבקוד. קודם מבינים למה שינו (אולי תיקון בזמן אינסידנט). אם זה נחוץ — מכניסים לקוד ב-PR; אם לא — apply כדי להחזיר. ואז מונעים חזרה: קונסול read-only בפרוד, drift detection מתוזמן." }
    },
    {
      q: { en: "count vs for_each?", he: "count מול for_each?" },
      a: { en: "count indexes by position, so removing an element shifts indexes and causes unintended destroy/recreate. for_each keys by a stable map key or set value, so adding/removing one item only affects that item.", he: "count מאנדקס לפי מיקום, אז הסרת איבר מזיזה אינדקסים וגורמת ל-destroy/recreate לא רצוי. for_each משתמש במפתח יציב של map או set, אז הוספה/הסרה של פריט אחד משפיעה רק עליו." }
    }
  ],
  quiz: [
    {
      q: { en: "Your plan shows -/+ next to aws_db_instance.main. What does it mean?", he: "ה-plan מראה -/+ ליד aws_db_instance.main. מה זה אומר?" },
      options: [
        { en: "An in-place update, safe", he: "עדכון במקום, בטוח" },
        { en: "The DB will be destroyed and recreated — possible data loss", he: "ה-DB יימחק וייווצר מחדש — אפשרות לאיבוד data" },
        { en: "Terraform will import the DB", he: "Terraform יעשה import ל-DB" },
        { en: "Only tags will change", he: "רק tags ישתנו" }
      ],
      answer: 1,
      explain: { en: "-/+ means replace. ~ is in-place update. On stateful resources, replacement must be caught in review — use prevent_destroy.", he: "-/+ זו החלפה. ~ זה עדכון במקום. במשאבים stateful חייבים לתפוס החלפה ב-review — משתמשים ב-prevent_destroy." }
    },
    {
      q: { en: "Best place to store Terraform state for a team?", he: "איפה הכי נכון לשמור Terraform state בצוות?" },
      options: [
        { en: "In the git repo next to the code", he: "ב-git repo ליד הקוד" },
        { en: "On the tech lead's laptop", he: "על הלפטופ של ה-tech lead" },
        { en: "A remote encrypted backend with locking (S3/GCS/Blob/TF Cloud)", he: "Backend מרוחק ומוצפן עם locking (S3/GCS/Blob/TF Cloud)" },
        { en: "In a Kubernetes ConfigMap", he: "ב-ConfigMap של Kubernetes" }
      ],
      answer: 2,
      explain: { en: "State contains secrets and must be shared and locked. Git leaks secrets and can't lock; laptops aren't shared.", he: "State מכיל secrets וחייב להיות משותף ונעול. Git מדליף secrets ולא יודע לנעול; לפטופ לא משותף." }
    },
    {
      q: { en: "Which tool is Azure-only and needs no state file?", he: "איזה כלי הוא Azure-only ולא צריך קובץ state?" },
      options: [
        { en: "Pulumi", he: "Pulumi" },
        { en: "Bicep", he: "Bicep" },
        { en: "OpenTofu", he: "OpenTofu" },
        { en: "Crossplane", he: "Crossplane" }
      ],
      answer: 1,
      explain: { en: "Bicep compiles to ARM templates and Azure Resource Manager itself tracks deployments — no separate state file.", he: "Bicep מתקמפל ל-ARM templates ו-Azure Resource Manager עצמו עוקב אחרי ה-deployments — אין קובץ state נפרד." }
    },
    {
      q: { en: "terraform plan -detailed-exitcode returns 2. This means:", he: "terraform plan -detailed-exitcode מחזיר 2. זה אומר:" },
      options: [
        { en: "Error in the configuration", he: "שגיאה בקונפיגורציה" },
        { en: "No changes", he: "אין שינויים" },
        { en: "Success, with changes pending (possible drift)", he: "הצלחה, עם שינויים ממתינים (אולי drift)" },
        { en: "State is locked", he: "ה-state נעול" }
      ],
      answer: 2,
      explain: { en: "0 = no changes, 1 = error, 2 = changes present. Perfect signal for automated drift detection.", he: "0 = אין שינויים, 1 = שגיאה, 2 = יש שינויים. סיגנל מושלם לזיהוי drift אוטומטי." }
    }
  ],
  related: ["cloud-cicd", "k8s-helm-gitops", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "cloud-cicd",
  track: "cloud",
  order: 6,
  icon: "🚀",
  level: 2,
  minutes: 10,
  title: { en: "CI/CD Pipelines & GitOps", he: "CI/CD Pipelines ו-GitOps" },
  tldr: {
    en: "CI proves every commit works and builds one immutable artifact; CD promotes that same artifact through environments — automatically to prod (deployment) or with a button (delivery).",
    he: "CI מוכיח שכל commit עובד ובונה artifact אחד immutable; CD מקדם את אותו artifact בין סביבות — אוטומטית עד פרוד (deployment) או עם כפתור (delivery)."
  },
  analogy: {
    en: "A car factory. CI is the assembly line with quality checks at every station — a car with a faulty brake never leaves the line. The artifact is the finished car with a VIN. CD is the shipping process: the same car (same VIN!) goes to the test track (staging), then to the dealership (prod). You don't rebuild the car at each stop — you'd never know if the second one has the same brakes.",
    he: "מפעל רכב. CI זה פס הייצור עם בדיקות איכות בכל תחנה — רכב עם בלם תקול לא יוצא מהפס. ה-artifact הוא הרכב הגמור עם מספר שלדה. CD זה תהליך המשלוח: אותו רכב (אותו מספר שלדה!) הולך למסלול הניסוי (staging), ואז לסוכנות (prod). לא בונים את הרכב מחדש בכל תחנה — אחרת אין לך מושג אם לשני יש אותם בלמים."
  },
  sections: [
    {
      h: { en: "CI vs Continuous Delivery vs Continuous Deployment", he: "CI מול Continuous Delivery מול Continuous Deployment" },
      body: {
        en: `<ul>
<li><strong>Continuous Integration</strong>: every push/PR triggers build + tests + lint + security scans. Merge to main often (at least daily). Goal: main is always green.</li>
<li><strong>Continuous Delivery</strong>: every green main build produces a release-ready artifact and is deployed automatically to staging. Going to prod is a <em>business decision</em> — one click/approval.</li>
<li><strong>Continuous Deployment</strong>: no human gate. Every green commit goes to prod automatically, protected by tests, canaries and automatic rollback.</li>
</ul>
<p>DORA metrics measure how good you are at this: <strong>deployment frequency</strong>, <strong>lead time for changes</strong>, <strong>change failure rate</strong>, and <strong>time to restore</strong>. Elite teams deploy on demand, multiple times a day, with lead time under a day — and counterintuitively, <em>fewer</em> failures, because small changes are easy to reason about and roll back.</p>`,
        he: `<ul>
<li><strong>Continuous Integration</strong>: כל push/PR מפעיל build + טסטים + lint + סריקות אבטחה. עושים merge ל-main לעתים קרובות (לפחות פעם ביום). המטרה: main תמיד ירוק.</li>
<li><strong>Continuous Delivery</strong>: כל build ירוק של main מייצר artifact מוכן לשחרור ונפרס אוטומטית ל-staging. העלייה לפרוד היא <em>החלטה עסקית</em> — קליק/אישור אחד.</li>
<li><strong>Continuous Deployment</strong>: אין שער אנושי. כל commit ירוק עולה לפרוד אוטומטית, מוגן ע"י טסטים, canaries ו-rollback אוטומטי.</li>
</ul>
<p>מדדי DORA מודדים כמה טובים אתם בזה: <strong>deployment frequency</strong>, <strong>lead time for changes</strong>, <strong>change failure rate</strong>, ו-<strong>time to restore</strong>. צוותי elite פורסים on demand, כמה פעמים ביום, עם lead time של פחות מיום — ובאופן מפתיע, עם <em>פחות</em> תקלות, כי שינויים קטנים קל להבין ולהחזיר.</p>`
      }
    },
    {
      h: { en: "Pipeline stages and artifacts", he: "שלבי ה-pipeline ו-artifacts" },
      body: {
        en: `<p>A typical pipeline: <strong>checkout → install deps (cached) → lint/static analysis → unit tests → build → security scan (SAST, dependency CVEs, image scan) → push artifact → deploy to staging → integration/e2e tests → (approval) → deploy prod (canary → full) → smoke tests</strong>.</p>
<p>The golden rule: <strong>build once, deploy many</strong>. The Docker image <code>registry/app:3f2a9c1</code> (tagged by git SHA, or better pinned by digest <code>@sha256:…</code>) is the artifact. Staging and prod run the <em>same bytes</em>; only config (env vars, secrets) differs. Never use <code>:latest</code> in prod — you can't tell what's running or roll back to it.</p>
<p>Speed matters: a 40-minute pipeline means people batch changes and skip running it. Cache dependencies, run tests in parallel, and fail fast (lint before 20 minutes of e2e).</p>
<blockquote>💡 Real world: Google, Amazon and Meta deploy thousands of times a day. Amazon reported a deploy every ~11.6 seconds back in 2011. The trick isn't heroic engineers — it's small changes + boring automation.</blockquote>`,
        he: `<p>Pipeline טיפוסי: <strong>checkout → התקנת dependencies (עם cache) → lint/ניתוח סטטי → unit tests → build → סריקת אבטחה (SAST, CVEs ב-dependencies, סריקת image) → push ל-artifact → deploy ל-staging → טסטים integration/e2e → (אישור) → deploy לפרוד (canary → מלא) → smoke tests</strong>.</p>
<p>כלל הזהב: <strong>build once, deploy many</strong>. ה-Docker image <code>registry/app:3f2a9c1</code> (מתויג לפי git SHA, או עדיף נעול לפי digest <code>@sha256:…</code>) הוא ה-artifact. Staging ופרוד מריצים <em>אותם בייטים</em>; רק ה-config (env vars, secrets) שונה. אף פעם לא <code>:latest</code> בפרוד — אי אפשר לדעת מה רץ או לחזור אליו.</p>
<p>מהירות חשובה: pipeline של 40 דקות גורם לאנשים לאגד שינויים ולדלג עליו. עושים cache ל-dependencies, מריצים טסטים במקביל, ו-fail fast (lint לפני 20 דקות של e2e).</p>
<blockquote>💡 Real world: גוגל, אמזון ומטא פורסים אלפי פעמים ביום. אמזון דיווחו על deploy כל ~11.6 שניות כבר ב-2011. הסוד הוא לא מהנדסים גיבורים — אלא שינויים קטנים + אוטומציה משעממת.</blockquote>`
      }
    },
    {
      h: { en: "A real GitHub Actions pipeline (with OIDC)", he: "Pipeline אמיתי ב-GitHub Actions (עם OIDC)" },
      body: {
        en: `<pre>name: ci-cd
on:
  push: { branches: [main] }
  pull_request:
permissions:
  id-token: write   # needed for OIDC
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint &amp;&amp; npm test
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production        # protection rules + approvals
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
          aws-region: eu-central-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          IMAGE=123456789012.dkr.ecr.eu-central-1.amazonaws.com/app:\${{ github.sha }}
          docker build -t $IMAGE . &amp;&amp; docker push $IMAGE</pre>
<p>Notice: no <code>AWS_ACCESS_KEY_ID</code> anywhere. The job gets a short-lived token via OIDC (next section).</p>`,
        he: `<pre>name: ci-cd
on:
  push: { branches: [main] }
  pull_request:
permissions:
  id-token: write   # needed for OIDC
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint &amp;&amp; npm test
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production        # protection rules + approvals
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
          aws-region: eu-central-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          IMAGE=123456789012.dkr.ecr.eu-central-1.amazonaws.com/app:\${{ github.sha }}
          docker build -t $IMAGE . &amp;&amp; docker push $IMAGE</pre>
<p>שימו לב: אין <code>AWS_ACCESS_KEY_ID</code> בשום מקום. ה-job מקבל token קצר-מועד דרך OIDC (בסעיף הבא).</p>`
      }
    },
    {
      h: { en: "Secrets in CI: OIDC instead of long-lived keys", he: "Secrets ב-CI: OIDC במקום מפתחות ארוכי-טווח" },
      body: {
        en: `<p>The old way: create an IAM user, paste its access key into CI secrets, forget about it for 4 years. That key works from anywhere on the internet and is a top breach vector (the 2022 CircleCI incident forced customers to rotate every stored secret).</p>
<p>The modern way: <strong>OIDC federation</strong>. GitHub/GitLab issues a signed JWT for each job saying "I am repo <code>acme/app</code>, branch <code>main</code>, environment <code>production</code>". The cloud trusts GitHub's OIDC issuer and exchanges the JWT for <strong>temporary credentials (~1 hour)</strong>. The IAM role's trust policy pins exactly which repo/branch may assume it:</p>
<pre>"Condition": {
  "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
  "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:acme/app:environment:production" }
}</pre>
<p>Azure calls it Workload Identity Federation; GCP calls it Workload Identity Federation too. Same idea everywhere: <strong>nothing static to leak</strong>.</p>
<blockquote>⚠️ Production tip: a trust policy with <code>repo:acme/*</code> lets ANY repo in the org (including an intern's fork-made test repo) deploy to prod. Pin the repo and the branch/environment.</blockquote>`,
        he: `<p>הדרך הישנה: יוצרים IAM user, מדביקים את ה-access key שלו ב-secrets של ה-CI, ושוכחים ממנו ל-4 שנים. המפתח הזה עובד מכל מקום באינטרנט והוא אחד מוקטורי הפריצה המובילים (האירוע של CircleCI ב-2022 הכריח לקוחות לסובב כל secret שנשמר).</p>
<p>הדרך המודרנית: <strong>OIDC federation</strong>. GitHub/GitLab מנפיקים JWT חתום לכל job שאומר "אני repo <code>acme/app</code>, branch <code>main</code>, environment <code>production</code>". הענן סומך על ה-OIDC issuer של GitHub ומחליף את ה-JWT ב-<strong>credentials זמניים (~שעה)</strong>. ה-trust policy של ה-IAM role נועל בדיוק איזה repo/branch רשאי להשתמש בו:</p>
<pre>"Condition": {
  "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
  "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:acme/app:environment:production" }
}</pre>
<p>ב-Azure זה נקרא Workload Identity Federation; גם ב-GCP זה Workload Identity Federation. אותו רעיון בכל מקום: <strong>אין שום דבר סטטי שיכול לדלוף</strong>.</p>
<blockquote>⚠️ Production tip: trust policy עם <code>repo:acme/*</code> מאפשר לכל repo בארגון (כולל repo טסטים של סטודנט) לפרוס לפרוד. נועלים את ה-repo ואת ה-branch/environment.</blockquote>`
      }
    },
    {
      h: { en: "Environments, promotion and GitOps", he: "סביבות, promotion ו-GitOps" },
      body: {
        en: `<p><strong>Promotion</strong> = moving the same artifact dev → staging → prod, with gates between them (tests pass, approval, change window, SLO healthy). GitHub "environments" give you required reviewers, wait timers and environment-scoped secrets.</p>
<p><strong>GitOps</strong> flips deployment from push to pull: a git repo holds the desired state of the cluster (Helm values, manifests with image tags). An agent inside the cluster (<strong>Argo CD</strong> or <strong>Flux</strong>) continuously reconciles the cluster to match git. CI's last step is just a commit: "bump image tag to <code>3f2a9c1</code> in <code>envs/prod/values.yaml</code>".</p>
<p>Benefits: git is the audit log, rollback is <code>git revert</code>, CI needs no cluster credentials, and manual <code>kubectl edit</code> drift gets auto-reverted.</p>
<blockquote>💡 Real world: a common setup is two repos — <code>app</code> (code, CI builds image) and <code>platform-config</code> (GitOps, Argo CD watches it). A bot opens the tag-bump PR into the config repo; merging it is the deploy.</blockquote>`,
        he: `<p><strong>Promotion</strong> = להעביר את אותו artifact מ-dev ל-staging לפרוד, עם gates ביניהם (טסטים עברו, אישור, חלון שינויים, SLO תקין). ה-"environments" של GitHub נותנים reviewers חובה, טיימרים, ו-secrets ברמת הסביבה.</p>
<p><strong>GitOps</strong> הופך את ה-deploy מ-push ל-pull: repo ב-git מחזיק את המצב הרצוי של ה-cluster (Helm values, manifests עם image tags). Agent בתוך ה-cluster (<strong>Argo CD</strong> או <strong>Flux</strong>) מסנכרן כל הזמן את ה-cluster כדי שיתאים ל-git. השלב האחרון של ה-CI הוא רק commit: "להעלות את ה-image tag ל-<code>3f2a9c1</code> ב-<code>envs/prod/values.yaml</code>".</p>
<p>יתרונות: git הוא ה-audit log, rollback זה <code>git revert</code>, ה-CI לא צריך credentials ל-cluster, ו-drift מ-<code>kubectl edit</code> ידני מתוקן אוטומטית.</p>
<blockquote>💡 Real world: setup נפוץ הוא שני repos — <code>app</code> (קוד, ה-CI בונה image) ו-<code>platform-config</code> (GitOps, ש-Argo CD מאזין לו). בוט פותח PR של העלאת tag ל-repo הקונפיג; ה-merge שלו הוא ה-deploy.</blockquote>`
      }
    }
  ],
  diagram: `dev pushes -> [CI: lint -> test -> build -> scan -> push image:sha]
                                                   |
                         commit tag bump -> config repo (git = desired state)
                                                   |
                          Argo CD / Flux pulls & reconciles
                     dev cluster --> staging cluster --(approval)--> prod (canary -> 100%)`,
  handsOn: [
    { cmd: "gh workflow run ci-cd.yml --ref main && gh run watch", what: { en: "Trigger a GitHub Actions workflow and stream its progress from the terminal.", he: "מפעיל workflow ב-GitHub Actions ומציג את ההתקדמות בטרמינל." } },
    { cmd: "act -j test", what: { en: "Run a GitHub Actions job locally in Docker with nektos/act to debug faster.", he: "מריץ job של GitHub Actions מקומית ב-Docker עם nektos/act כדי לדבג מהר יותר." } },
    { cmd: "argocd app diff my-app && argocd app sync my-app", what: { en: "See what Argo CD would change, then sync the cluster to git.", he: "רואים מה Argo CD ישנה, ואז מסנכרנים את ה-cluster ל-git." } },
    { cmd: "aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com", what: { en: "One-time: let AWS trust GitHub's OIDC tokens (thumbprint no longer required for GitHub).", he: "פעם אחת: לגרום ל-AWS לסמוך על ה-OIDC tokens של GitHub (כבר לא צריך thumbprint עבור GitHub)." } }
  ],
  mnemonic: {
    en: "\"Build once, deploy many; trust tokens, not keys.\" Delivery = a button to prod; Deployment = no button.",
    he: "\"בונים פעם אחת, פורסים הרבה; סומכים על tokens, לא על מפתחות.\" Delivery = יש כפתור לפרוד; Deployment = אין כפתור."
  },
  pitfalls: [
    { en: "Rebuilding the image per environment — staging tested different bytes than prod is running. Promote the same digest.", he: "לבנות image מחדש לכל סביבה — ב-staging בדקו בייטים אחרים ממה שרץ בפרוד. מקדמים את אותו digest." },
    { en: "Long-lived cloud keys stored as CI secrets. Use OIDC federation with tightly scoped trust conditions.", he: "מפתחות ענן ארוכי-טווח ב-secrets של ה-CI. משתמשים ב-OIDC federation עם תנאי trust מצומצמים." },
    { en: "Running untrusted PR code (from forks) with access to secrets via pull_request_target — classic supply-chain hole.", he: "להריץ קוד PR לא אמין (מ-forks) עם גישה ל-secrets דרך pull_request_target — חור supply-chain קלאסי." },
    { en: "Flaky tests that everyone just re-runs. They train the team to ignore red builds; quarantine and fix them.", he: "טסטים flaky שכולם פשוט מריצים מחדש. זה מאמן את הצוות להתעלם מ-build אדום; מבודדים ומתקנים." }
  ],
  interview: [
    {
      q: { en: "Continuous delivery vs continuous deployment?", he: "Continuous delivery מול continuous deployment?" },
      a: { en: "Both keep every main commit releasable and automatically deployed to pre-prod. Delivery has a manual approval before prod; deployment has none — every green commit reaches prod automatically, relying on tests, canaries and auto-rollback.", he: "בשניהם כל commit ב-main מוכן לשחרור ונפרס אוטומטית ל-pre-prod. ב-delivery יש אישור ידני לפני פרוד; ב-deployment אין — כל commit ירוק מגיע לפרוד אוטומטית, בהסתמך על טסטים, canaries ו-rollback אוטומטי." }
    },
    {
      q: { en: "How do you give a CI pipeline access to AWS securely?", he: "איך נותנים ל-pipeline של CI גישה ל-AWS בצורה מאובטחת?" },
      a: { en: "OIDC federation: register the CI's OIDC issuer as an identity provider, create a role whose trust policy only accepts tokens for a specific repo and branch/environment, grant it least-privilege permissions. The job exchanges its JWT for ~1h temporary credentials — no static keys to leak or rotate.", he: "OIDC federation: רושמים את ה-OIDC issuer של ה-CI כ-identity provider, יוצרים role שה-trust policy שלו מקבל רק tokens של repo מסוים ו-branch/environment, ונותנים לו הרשאות least privilege. ה-job מחליף את ה-JWT ב-credentials זמניים לשעה — אין מפתחות סטטיים שידלפו או שצריך לסובב." }
    }
  ],
  quiz: [
    {
      q: { en: "Your pipeline rebuilds the Docker image separately for staging and prod. Main risk?", he: "ה-pipeline בונה את ה-Docker image מחדש בנפרד ל-staging ולפרוד. מה הסיכון המרכזי?" },
      options: [
        { en: "Slightly higher CI cost, nothing else", he: "עלות CI קצת גבוהה יותר, וזהו" },
        { en: "Prod may run different bytes than what was tested (new base image, deps)", he: "בפרוד עלולים לרוץ בייטים שונים ממה שנבדק (base image חדש, dependencies)" },
        { en: "Docker doesn't allow the same tag twice", he: "Docker לא מאפשר אותו tag פעמיים" },
        { en: "It breaks GitOps", he: "זה שובר GitOps" }
      ],
      answer: 1,
      explain: { en: "Build once, deploy many. Floating base tags and dependency ranges mean two builds of the same commit can differ.", he: "Build once, deploy many. Base tags צפים וטווחי גרסאות של dependencies אומרים ששני builds של אותו commit יכולים להיות שונים." }
    },
    {
      q: { en: "What does OIDC in CI replace?", he: "מה OIDC ב-CI מחליף?" },
      options: [
        { en: "Unit tests", he: "Unit tests" },
        { en: "Long-lived cloud access keys stored as secrets", he: "מפתחות גישה לענן ארוכי-טווח שנשמרים כ-secrets" },
        { en: "The container registry", he: "ה-container registry" },
        { en: "TLS certificates", he: "תעודות TLS" }
      ],
      answer: 1,
      explain: { en: "Each job gets a signed identity token and exchanges it for short-lived credentials. Nothing static to leak.", he: "כל job מקבל identity token חתום ומחליף אותו ב-credentials קצרי-מועד. אין שום דבר סטטי שידלוף." }
    },
    {
      q: { en: "In GitOps, how is a production deploy typically triggered?", he: "ב-GitOps, איך בדרך כלל מופעל deploy לפרוד?" },
      options: [
        { en: "CI runs kubectl apply with an admin kubeconfig", he: "ה-CI מריץ kubectl apply עם kubeconfig של admin" },
        { en: "An engineer SSHs into a node", he: "מהנדס נכנס ב-SSH ל-node" },
        { en: "Merging a commit that changes the desired state in git; an in-cluster agent syncs it", he: "Merge של commit שמשנה את המצב הרצוי ב-git; agent בתוך ה-cluster מסנכרן" },
        { en: "Restarting the Argo CD pod", he: "ריסטרט ל-pod של Argo CD" }
      ],
      answer: 2,
      explain: { en: "GitOps is pull-based: Argo CD/Flux reconcile the cluster to git. Rollback = git revert.", he: "GitOps מבוסס pull: Argo CD/Flux מסנכרנים את ה-cluster ל-git. Rollback = git revert." }
    },
    {
      q: { en: "Which DORA metric captures 'how often our deploys cause incidents'?", he: "איזה מדד DORA מודד \"כמה פעמים ה-deploys שלנו גורמים לתקלות\"?" },
      options: [
        { en: "Deployment frequency", he: "Deployment frequency" },
        { en: "Lead time for changes", he: "Lead time for changes" },
        { en: "Change failure rate", he: "Change failure rate" },
        { en: "MTTR", he: "MTTR" }
      ],
      answer: 2,
      explain: { en: "Change failure rate = % of deployments causing a failure in production.", he: "Change failure rate = אחוז ה-deployments שגורמים לתקלה בפרודקשן." }
    }
  ],
  related: ["k8s-helm-gitops", "cloud-iac", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "cloud-serverless",
  track: "cloud",
  order: 7,
  icon: "⚡",
  level: 2,
  minutes: 9,
  title: { en: "Serverless: Lambda, Functions, Cloud Run", he: "Serverless: Lambda, Functions, Cloud Run" },
  tldr: {
    en: "Serverless = you ship code, the platform runs it per event, scales from zero to thousands in seconds, and bills per millisecond — great for spiky work, pricey for constant load, with cold starts as the tax.",
    he: "Serverless = שולחים קוד, הפלטפורמה מריצה אותו לכל event, עושה scale מאפס לאלפים בשניות, ומחייבת לפי מילי-שנייה — מעולה לעומס קופצני, יקר לעומס קבוע, ו-cold starts הם המס."
  },
  analogy: {
    en: "Serverless is a taxi; a VM is owning a car. With a taxi you pay only for the ride, never for parking, and a hundred taxis can show up for a wedding. But if you drive 8 hours every day, a taxi gets expensive fast, and sometimes you wait a few minutes for one to arrive (cold start).",
    he: "Serverless זה מונית; VM זה רכב פרטי. במונית משלמים רק על הנסיעה, אף פעם לא על חניה, ומאה מוניות יכולות להגיע לחתונה. אבל אם נוסעים 8 שעות כל יום, מונית נהיית יקרה מהר, ולפעמים מחכים כמה דקות שתגיע (cold start)."
  },
  sections: [
    {
      h: { en: "What 'serverless' really means", he: "מה \"serverless\" אומר באמת" },
      body: {
        en: `<p>There are servers — you just don't see, patch, or pay for idle ones. Characteristics: <strong>no capacity planning, scale to zero, pay per use, event-driven</strong>.</p>
<table>
<tr><th></th><th>AWS Lambda</th><th>Azure Functions</th><th>Google Cloud Run</th></tr>
<tr><td>Unit</td><td>Function (zip or container image)</td><td>Function</td><td>Any container listening on $PORT</td></tr>
<tr><td>Max duration</td><td>15 min</td><td>5-10 min (Consumption), unlimited on Premium</td><td>60 min per request (jobs: up to 7 days)</td></tr>
<tr><td>Memory</td><td>128 MB - 10 GB (CPU scales with memory)</td><td>1.5 GB (Consumption) / up to 14 GB Premium</td><td>up to 32 GiB</td></tr>
<tr><td>Concurrency per instance</td><td>1 request</td><td>Multiple</td><td>Up to 1000 (default 80)</td></tr>
</table>
<p>Lambda's "1 request per instance" model matters: 500 concurrent requests = 500 execution environments, and 500 DB connections. Cloud Run handles many requests per instance, much like a normal web server.</p>`,
        he: `<p>יש שרתים — פשוט לא רואים אותם, לא עושים להם patch, ולא משלמים על זמן idle. המאפיינים: <strong>אין תכנון קיבולת, scale to zero, תשלום לפי שימוש, מונחה events</strong>.</p>
<table>
<tr><th></th><th>AWS Lambda</th><th>Azure Functions</th><th>Google Cloud Run</th></tr>
<tr><td>יחידה</td><td>פונקציה (zip או container image)</td><td>פונקציה</td><td>כל קונטיינר שמאזין ל-$PORT</td></tr>
<tr><td>זמן ריצה מקסימלי</td><td>15 דקות</td><td>5-10 דקות (Consumption), ללא הגבלה ב-Premium</td><td>60 דקות לבקשה (jobs: עד 7 ימים)</td></tr>
<tr><td>זיכרון</td><td>128 MB - 10 GB (ה-CPU גדל עם הזיכרון)</td><td>1.5 GB (Consumption) / עד 14 GB ב-Premium</td><td>עד 32 GiB</td></tr>
<tr><td>Concurrency ל-instance</td><td>בקשה אחת</td><td>כמה</td><td>עד 1000 (ברירת מחדל 80)</td></tr>
</table>
<p>המודל של Lambda של "בקשה אחת ל-instance" חשוב: 500 בקשות במקביל = 500 execution environments, ו-500 חיבורי DB. Cloud Run מטפל בהרבה בקשות ל-instance, בדומה לשרת web רגיל.</p>`
      }
    },
    {
      h: { en: "Cold starts", he: "Cold starts" },
      body: {
        en: `<p>When no warm instance exists, the platform must: allocate a micro-VM (Firecracker for Lambda), download your code/image, start the runtime, run your init code (imports, DB clients, config). That's a <strong>cold start</strong>. Typical numbers: Node/Python/Go <strong>~100-400 ms</strong>; Java/.NET with heavy frameworks <strong>1-5+ s</strong>; inside a VPC used to be awful, now mostly fixed.</p>
<p>Mitigations:</p>
<ul>
<li>Small deployment packages; lazy-load rarely used deps.</li>
<li>Initialize clients <em>outside</em> the handler so warm invocations reuse them.</li>
<li><strong>Provisioned concurrency</strong> (Lambda), Premium plan (Azure), <code>min-instances</code> (Cloud Run) — keep N instances warm. It works, but you're now paying for idle again.</li>
<li>Lambda SnapStart for Java/Python/.NET: snapshots the initialized runtime.</li>
</ul>
<blockquote>💡 Real world: cold starts usually hit &lt;1% of requests in steady traffic. They hurt most on rarely called, latency-sensitive endpoints — exactly the ones where a user notices a 3-second login.</blockquote>`,
        he: `<p>כשאין instance חם, הפלטפורמה צריכה: להקצות micro-VM (Firecracker ב-Lambda), להוריד את הקוד/image, להפעיל את ה-runtime, ולהריץ את קוד ה-init שלך (imports, DB clients, config). זה <strong>cold start</strong>. מספרים טיפוסיים: Node/Python/Go <strong>~100-400 ms</strong>; Java/.NET עם frameworks כבדים <strong>1-5+ שניות</strong>; בתוך VPC זה היה נוראי פעם, היום ברובו תוקן.</p>
<p>איך מקטינים:</p>
<ul>
<li>חבילות deploy קטנות; lazy-load ל-dependencies שמשתמשים בהם לעתים רחוקות.</li>
<li>לאתחל clients <em>מחוץ</em> ל-handler כדי שהפעלות חמות ישתמשו בהם מחדש.</li>
<li><strong>Provisioned concurrency</strong> (Lambda), Premium plan (Azure), <code>min-instances</code> (Cloud Run) — מחזיקים N instances חמים. זה עובד, אבל שוב משלמים על idle.</li>
<li>Lambda SnapStart ל-Java/Python/.NET: לוקח snapshot של ה-runtime אחרי אתחול.</li>
</ul>
<blockquote>💡 Real world: בתעבורה יציבה cold starts פוגעים בדרך כלל בפחות מ-1% מהבקשות. הם כואבים בעיקר ב-endpoints שנקראים לעתים רחוקות ורגישים ל-latency — בדיוק אלה שבהם המשתמש ישים לב ל-login של 3 שניות.</blockquote>`
      }
    },
    {
      h: { en: "Event triggers and patterns", he: "Event triggers ותבניות" },
      body: {
        en: `<p>Functions shine as glue between managed services:</p>
<ul>
<li><strong>HTTP</strong>: API Gateway / Function URL / Cloud Run URL.</li>
<li><strong>Storage</strong>: object uploaded to S3 → generate thumbnail.</li>
<li><strong>Queue/stream</strong>: SQS, Kinesis, Kafka, Pub/Sub, Service Bus → process batches.</li>
<li><strong>Schedule</strong>: EventBridge Scheduler / Cloud Scheduler / timer trigger → nightly cleanup (serverless cron).</li>
<li><strong>DB change streams</strong>: DynamoDB Streams, Cosmos DB change feed.</li>
</ul>
<p>Event-driven means <strong>at-least-once delivery</strong> — your function will sometimes be invoked twice for the same event. Make handlers <strong>idempotent</strong> (dedupe by event ID, conditional writes) and configure a <strong>DLQ / on-failure destination</strong> so poison events don't retry forever.</p>
<blockquote>⚠️ Production tip: never write a Lambda that's triggered by S3 uploads to bucket X and writes its output back to bucket X under the same prefix. Infinite recursion, infinite bill. (AWS now detects some loops, don't rely on it.)</blockquote>`,
        he: `<p>פונקציות מצטיינות כדבק בין שירותים מנוהלים:</p>
<ul>
<li><strong>HTTP</strong>: API Gateway / Function URL / URL של Cloud Run.</li>
<li><strong>Storage</strong>: קובץ עלה ל-S3 → יוצרים thumbnail.</li>
<li><strong>תור/stream</strong>: SQS, Kinesis, Kafka, Pub/Sub, Service Bus → עיבוד batches.</li>
<li><strong>Schedule</strong>: EventBridge Scheduler / Cloud Scheduler / timer trigger → ניקוי לילי (cron serverless).</li>
<li><strong>שינויים ב-DB</strong>: DynamoDB Streams, Cosmos DB change feed.</li>
</ul>
<p>Event-driven אומר <strong>at-least-once delivery</strong> — הפונקציה לפעמים תופעל פעמיים על אותו event. עושים handlers <strong>idempotent</strong> (dedupe לפי event ID, conditional writes) ומגדירים <strong>DLQ / on-failure destination</strong> כדי ש-events רעילים לא ינסו שוב לנצח.</p>
<blockquote>⚠️ Production tip: אף פעם אל תכתבו Lambda שמופעלת מהעלאה ל-bucket X וכותבת את הפלט בחזרה ל-bucket X באותו prefix. רקורסיה אינסופית, חשבון אינסופי. (AWS מזהים היום חלק מהלולאות, אל תסמכו על זה.)</blockquote>`
      }
    },
    {
      h: { en: "When serverless is cheaper — and when it isn't", he: "מתי serverless זול יותר — ומתי לא" },
      body: {
        en: `<p>Lambda pricing (x86, us-east-1): <strong>$0.20 per 1M requests + ~$0.0000167 per GB-second</strong>, with a free tier of 1M requests and 400K GB-s/month.</p>
<p>Example: an API getting <strong>1M requests/month</strong>, 200 ms each at 512 MB = 100,000 GB-s → ~$1.67 + $0.20 ≈ <strong>$2/month</strong>. A t3.small running 24/7 is ~$15. Serverless wins big.</p>
<p>Now <strong>100 req/s sustained</strong> (~260M/month), same profile: 26M GB-s → ~$433 + $52 ≈ <strong>$485/month</strong> (plus API Gateway at ~$1/M = $260 more). Two c7g.large instances behind a LB handle that for ~$150. Constant load flips the math.</p>
<p>Rule of thumb: serverless is cheaper when average utilization of the equivalent server would be below ~20-30%. Also count the hidden costs: API Gateway, NAT for VPC functions, CloudWatch Logs ingestion ($0.50/GB) — sometimes larger than compute.</p>
<p>And remember the human side: no patching and no capacity planning are real savings in engineer time.</p>`,
        he: `<p>תמחור Lambda (x86, us-east-1): <strong>$0.20 למיליון בקשות + ~$0.0000167 ל-GB-second</strong>, עם free tier של מיליון בקשות ו-400K GB-s בחודש.</p>
<p>דוגמה: API שמקבל <strong>מיליון בקשות בחודש</strong>, 200 ms כל אחת ב-512 MB = 100,000 GB-s → ~$1.67 + $0.20 ≈ <strong>$2 בחודש</strong>. t3.small שרץ 24/7 עולה ~$15. Serverless מנצח בגדול.</p>
<p>עכשיו <strong>100 בקשות בשנייה קבוע</strong> (~260 מיליון בחודש), אותו פרופיל: 26M GB-s → ~$433 + $52 ≈ <strong>$485 בחודש</strong> (ועוד API Gateway ב-~$1 למיליון = עוד $260). שני c7g.large מאחורי LB יטפלו בזה ב-~$150. עומס קבוע הופך את החשבון.</p>
<p>כלל אצבע: serverless זול יותר כשה-utilization הממוצע של השרת המקביל היה מתחת ל-~20-30%. וגם סופרים עלויות נסתרות: API Gateway, NAT לפונקציות בתוך VPC, ingestion ל-CloudWatch Logs ($0.50 ל-GB) — לפעמים יותר מה-compute.</p>
<p>ואל תשכחו את הצד האנושי: בלי patching ובלי תכנון קיבולת זה חיסכון אמיתי בזמן מהנדסים.</p>`
      }
    }
  ],
  diagram: `event (HTTP / S3 upload / SQS msg / cron)
        |
        v
  [warm instance?] --yes--> run handler (~ms)
        | no
        v
  cold start: micro-VM -> fetch code -> runtime init -> your init  (100ms - 5s)
        |
        v
  run handler --> success | error -> retry -> DLQ`,
  handsOn: [
    { cmd: "aws lambda invoke --function-name thumbnailer --payload '{\"key\":\"cat.jpg\"}' --cli-binary-format raw-in-base64-out out.json && cat out.json", what: { en: "Invoke a Lambda directly and read its response.", he: "מפעיל Lambda ישירות וקורא את התשובה." } },
    { cmd: "aws logs tail /aws/lambda/thumbnailer --follow --filter-pattern 'Init Duration'", what: { en: "Spot cold starts: the REPORT line includes 'Init Duration' only on cold invocations.", he: "מזהים cold starts: שורת ה-REPORT מכילה 'Init Duration' רק בהפעלות קרות." } },
    { cmd: "gcloud run deploy api --image=europe-docker.pkg.dev/acme/app/api:3f2a9c1 --min-instances=1 --max-instances=50 --concurrency=80 --region=europe-west1", what: { en: "Cloud Run with one warm instance (no cold start for the first user) and a cost ceiling via max-instances.", he: "Cloud Run עם instance חם אחד (בלי cold start למשתמש הראשון) ותקרת עלות דרך max-instances." } },
    { cmd: "aws lambda put-function-concurrency --function-name thumbnailer --reserved-concurrent-executions 50", what: { en: "Cap concurrency so a burst can't exhaust your DB connections or account limit.", he: "מגביל concurrency כדי ש-burst לא ימצה את חיבורי ה-DB או את ה-limit של ה-account." } }
  ],
  mnemonic: {
    en: "\"Spiky? Go serverless. Steady? Go servers.\" Plus the 3 I's of good functions: Idempotent, Initialized outside the handler, Instrumented with a DLQ.",
    he: "\"קופצני? serverless. יציב? שרתים.\" ועוד שלושה כללים לפונקציה טובה: idempotent, אתחול מחוץ ל-handler, ו-DLQ מוגדר."
  },
  pitfalls: [
    { en: "Opening a new DB connection per invocation with 1,000 concurrent Lambdas — instant 'too many connections'. Use RDS Proxy or a connection-friendly data store, and cap concurrency.", he: "לפתוח חיבור DB חדש בכל הפעלה עם 1,000 Lambdas במקביל — מיד 'too many connections'. משתמשים ב-RDS Proxy או ב-data store שמתאים לזה, ומגבילים concurrency." },
    { en: "Non-idempotent handlers: an SQS retry charges the customer twice.", he: "Handlers לא idempotent: retry של SQS מחייב את הלקוח פעמיים." },
    { en: "Using functions for long, steady, CPU-heavy work (video transcoding all day) — both the 15-min limit and the bill will hurt.", he: "להשתמש בפונקציות לעבודה ארוכה, קבועה וכבדת CPU (טרנסקודינג וידאו כל היום) — גם מגבלת 15 הדקות וגם החשבון יכאיבו." }
  ],
  interview: [
    {
      q: { en: "What causes a cold start and how do you reduce it?", he: "מה גורם ל-cold start ואיך מקטינים אותו?" },
      a: { en: "A new execution environment must be created: micro-VM, code download, runtime boot, and your init code. Reduce with smaller packages, lighter runtimes, lazy imports, initializing clients outside the handler, SnapStart, or paying for warm capacity (provisioned concurrency / min instances).", he: "צריך ליצור execution environment חדש: micro-VM, הורדת קוד, עליית runtime, וקוד ה-init שלך. מקטינים עם חבילות קטנות, runtimes קלים, lazy imports, אתחול clients מחוץ ל-handler, SnapStart, או תשלום על קיבולת חמה (provisioned concurrency / min instances)." }
    },
    {
      q: { en: "When would you NOT choose serverless?", he: "מתי לא תבחר serverless?" },
      a: { en: "Sustained high-throughput load (cheaper on reserved VMs/containers), long-running or stateful processes, strict p99 latency where cold starts are unacceptable, workloads needing GPUs or special hardware, or when per-instance concurrency limits overwhelm downstream systems.", he: "עומס גבוה ויציב (זול יותר על VMs/קונטיינרים עם reservation), תהליכים ארוכים או stateful, דרישות p99 latency קשוחות שבהן cold start לא מקובל, workloads שצריכים GPU או חומרה מיוחדת, או כשה-concurrency לכל instance מציף מערכות downstream." }
    }
  ],
  quiz: [
    {
      q: { en: "Which workload is the BEST fit for Lambda/Functions?", he: "איזה workload הכי מתאים ל-Lambda/Functions?" },
      options: [
        { en: "A WebSocket server holding 50K connections 24/7", he: "שרת WebSocket שמחזיק 50K חיבורים 24/7" },
        { en: "Resizing images when users upload them (bursty, a few thousand/day)", he: "שינוי גודל תמונות כשמשתמשים מעלים אותן (קופצני, כמה אלפים ביום)" },
        { en: "A 3-hour nightly ML training job on GPUs", he: "אימון ML של 3 שעות כל לילה על GPUs" },
        { en: "A PostgreSQL primary", he: "PostgreSQL primary" }
      ],
      answer: 1,
      explain: { en: "Event-driven, short, bursty, stateless — textbook serverless. The others are long-running, stateful, or need special hardware.", he: "מונחה events, קצר, קופצני, stateless — serverless מהספר. האחרים ארוכים, stateful, או צריכים חומרה מיוחדת." }
    },
    {
      q: { en: "Where should you create the DB client in a Lambda handler file?", he: "איפה צריך ליצור את ה-DB client בקובץ של Lambda?" },
      options: [
        { en: "Inside the handler, so each request gets a fresh one", he: "בתוך ה-handler, כדי שכל בקשה תקבל חדש" },
        { en: "Outside the handler, at module scope, so warm invocations reuse it", he: "מחוץ ל-handler, ברמת ה-module, כדי שהפעלות חמות ישתמשו בו מחדש" },
        { en: "In a separate Lambda", he: "ב-Lambda נפרדת" },
        { en: "It doesn't matter", he: "זה לא משנה" }
      ],
      answer: 1,
      explain: { en: "Module-scope code runs once per execution environment (during init) and survives between warm invocations.", he: "קוד ברמת ה-module רץ פעם אחת לכל execution environment (בזמן ה-init) ושורד בין הפעלות חמות." }
    },
    {
      q: { en: "An SQS-triggered function sometimes processes the same message twice. Correct fix?", he: "פונקציה שמופעלת מ-SQS לפעמים מעבדת את אותה הודעה פעמיים. מה התיקון הנכון?" },
      options: [
        { en: "Open a support ticket — SQS is broken", he: "לפתוח טיקט — SQS שבור" },
        { en: "Make the handler idempotent (dedupe by message ID / conditional write)", he: "להפוך את ה-handler ל-idempotent (dedupe לפי message ID / conditional write)" },
        { en: "Set memory to 10 GB", he: "להגדיר זיכרון ל-10 GB" },
        { en: "Disable retries entirely", he: "לבטל retries לגמרי" }
      ],
      answer: 1,
      explain: { en: "Standard SQS is at-least-once by design. Idempotency is the consumer's job; disabling retries just loses messages.", he: "SQS standard הוא at-least-once בכוונה. Idempotency זה התפקיד של ה-consumer; ביטול retries רק מאבד הודעות." }
    }
  ],
  related: ["cloud-models", "cloud-finops", "arch-queues"]
});

window.INFRA.lessons.push({
  id: "cloud-iam-security",
  track: "cloud",
  order: 8,
  icon: "🔐",
  level: 2,
  minutes: 12,
  title: { en: "Cloud IAM & Security", he: "IAM ואבטחה בענן" },
  tldr: {
    en: "In the cloud, identity is the new perimeter: every API call is checked against policies (explicit deny wins, default is deny), so give workloads short-lived roles with least privilege, keep secrets in a vault, encrypt everything, and log every call.",
    he: "בענן, הזהות היא ה-perimeter החדש: כל קריאת API נבדקת מול policies (explicit deny מנצח, ברירת המחדל היא deny), אז נותנים ל-workloads roles קצרי-מועד עם least privilege, שומרים secrets בכספת, מצפינים הכל, ומתעדים כל קריאה."
  },
  analogy: {
    en: "IAM is a hotel key-card system. Identities are guests and staff; policies are what each card opens. A role is the housekeeping card you check out at the start of a shift and return at the end — nobody takes it home. Least privilege: the pool guy's card doesn't open the safe. And CloudTrail is the log of every door swipe, which is how you find out who was in room 404 at 3 AM.",
    he: "IAM זה מערכת כרטיסי-מפתח של מלון. Identities הם האורחים והצוות; policies הם מה שכל כרטיס פותח. Role זה כרטיס של צוות הניקיון שלוקחים בתחילת משמרת ומחזירים בסופה — אף אחד לא לוקח אותו הביתה. Least privilege: הכרטיס של איש הבריכה לא פותח את הכספת. ו-CloudTrail זה הלוג של כל העברת כרטיס בדלת — ככה מגלים מי היה בחדר 404 ב-3 בלילה."
  },
  sections: [
    {
      h: { en: "Identities, roles and policies", he: "Identities, roles ו-policies" },
      body: {
        en: `<p><strong>Principals</strong> (who): human users, groups, and workload identities (roles, service accounts, managed identities). <strong>Policies</strong> (what): JSON documents of Effect / Action / Resource / Condition.</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-uploads/tenants/*",
    "Condition": { "Bool": { "aws:SecureTransport": "true" } }
  }]
}</pre>
<p>A <strong>role</strong> has no password or keys; you <em>assume</em> it and receive temporary credentials (STS, typically 1 hour). Humans should log in via SSO (IAM Identity Center, Entra ID, Google Workspace) and assume roles — <strong>no IAM users with access keys for people</strong>.</p>
<p>Azure: Entra ID identities + RBAC role assignments at a scope (management group / subscription / resource group / resource). GCP: IAM bindings (member + role) on org / folder / project / resource.</p>`,
        he: `<p><strong>Principals</strong> (מי): משתמשים אנושיים, קבוצות, וזהויות של workloads (roles, service accounts, managed identities). <strong>Policies</strong> (מה): מסמכי JSON של Effect / Action / Resource / Condition.</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-uploads/tenants/*",
    "Condition": { "Bool": { "aws:SecureTransport": "true" } }
  }]
}</pre>
<p>ל-<strong>role</strong> אין סיסמה או מפתחות; עושים לו <em>assume</em> ומקבלים credentials זמניים (STS, בדרך כלל לשעה). בני אדם צריכים להתחבר דרך SSO (IAM Identity Center, Entra ID, Google Workspace) ולעשות assume ל-roles — <strong>בלי IAM users עם access keys לאנשים</strong>.</p>
<p>ב-Azure: זהויות Entra ID + RBAC role assignments ב-scope (management group / subscription / resource group / resource). ב-GCP: IAM bindings (member + role) על org / folder / project / resource.</p>`
      }
    },
    {
      h: { en: "Policy evaluation: explicit deny wins", he: "הערכת policies: explicit deny מנצח" },
      body: {
        en: `<p>AWS evaluation logic, simplified:</p>
<ol>
<li>Start with <strong>implicit deny</strong> — everything is denied by default.</li>
<li>Any <strong>explicit Deny</strong> in any applicable policy (SCP, permission boundary, identity policy, resource policy, session policy) → <strong>DENIED</strong>. Game over, no Allow can override it.</li>
<li>Organization SCPs and permission boundaries act as <em>ceilings</em> — they must allow the action too.</li>
<li>Then an <strong>explicit Allow</strong> from an identity or resource policy → allowed.</li>
<li>Nothing matched → implicit deny.</li>
</ol>
<p>This is why guardrails use Deny: an SCP that says "Deny <code>*</code> outside eu-central-1 and il-central-1" or "Deny <code>cloudtrail:StopLogging</code>" can't be undone by an admin in a member account.</p>
<p><strong>Least privilege</strong> in practice: start from AWS-managed read-only, generate tight policies from real usage (IAM Access Analyzer policy generation), avoid <code>"Action": "*"</code> and <code>"Resource": "*"</code>, and review unused permissions regularly.</p>
<blockquote>💡 Real world: "AccessDenied" debugging tip — check in order: SCP, permission boundary, identity policy, resource policy (bucket/KMS key policy!), and session tags. The KMS key policy is the one everyone forgets.</blockquote>`,
        he: `<p>הלוגיקה של AWS, בפשטות:</p>
<ol>
<li>מתחילים ב-<strong>implicit deny</strong> — הכל אסור כברירת מחדל.</li>
<li>כל <strong>Deny מפורש</strong> בכל policy רלוונטי (SCP, permission boundary, identity policy, resource policy, session policy) → <strong>DENIED</strong>. נגמר המשחק, שום Allow לא יכול לעקוף.</li>
<li>SCPs של ה-Organization ו-permission boundaries הם <em>תקרה</em> — גם הם צריכים לאפשר את הפעולה.</li>
<li>ואז <strong>Allow מפורש</strong> מ-identity policy או resource policy → מותר.</li>
<li>שום דבר לא התאים → implicit deny.</li>
</ol>
<p>בגלל זה guardrails משתמשים ב-Deny: SCP שאומר "Deny <code>*</code> מחוץ ל-eu-central-1 ו-il-central-1" או "Deny <code>cloudtrail:StopLogging</code>" לא יכול להיעקף ע"י admin ב-account בן.</p>
<p><strong>Least privilege</strong> בפועל: מתחילים מ-read-only מנוהל, מייצרים policies הדוקים משימוש אמיתי (IAM Access Analyzer policy generation), נמנעים מ-<code>"Action": "*"</code> ו-<code>"Resource": "*"</code>, ובודקים הרשאות לא בשימוש באופן קבוע.</p>
<blockquote>💡 Real world: טיפ לדיבוג "AccessDenied" — בודקים לפי הסדר: SCP, permission boundary, identity policy, resource policy (bucket/KMS key policy!), ו-session tags. ה-KMS key policy זה זה שכולם שוכחים.</blockquote>`
      }
    },
    {
      h: { en: "Workload identity: no keys in pods", he: "Workload identity: בלי מפתחות בתוך pods" },
      body: {
        en: `<p>Your code needs to call S3. Wrong answer: an access key in an env var. Right answer: give the <em>workload</em> an identity, and let the SDK fetch short-lived credentials automatically:</p>
<ul>
<li><strong>EC2</strong>: instance profile (credentials via the metadata service, IMDSv2).</li>
<li><strong>EKS</strong>: IRSA or EKS Pod Identity — a Kubernetes ServiceAccount maps to an IAM role.</li>
<li><strong>AKS</strong>: Microsoft Entra Workload ID. <strong>Azure VMs/App Service</strong>: Managed Identity.</li>
<li><strong>GKE</strong>: Workload Identity Federation for GKE — KSA mapped to a Google service account.</li>
</ul>
<pre>apiVersion: v1
kind: ServiceAccount
metadata:
  name: uploader
  namespace: web
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/web-uploader</pre>
<p>The AWS SDK's default credential chain picks it up with zero code changes. Credentials rotate automatically; there's nothing to leak in git or a Docker image layer.</p>
<blockquote>⚠️ Production tip: enforce IMDSv2 (<code>HttpTokens=required</code>) on EC2. The 2019 Capital One breach used SSRF to read role credentials from IMDSv1 and download 100M+ customer records from S3.</blockquote>`,
        he: `<p>הקוד שלך צריך לקרוא ל-S3. תשובה שגויה: access key במשתנה סביבה. תשובה נכונה: נותנים ל-<em>workload</em> זהות, ונותנים ל-SDK להביא credentials קצרי-מועד אוטומטית:</p>
<ul>
<li><strong>EC2</strong>: instance profile (credentials דרך שירות ה-metadata, IMDSv2).</li>
<li><strong>EKS</strong>: IRSA או EKS Pod Identity — ServiceAccount של Kubernetes ממופה ל-IAM role.</li>
<li><strong>AKS</strong>: Microsoft Entra Workload ID. <strong>Azure VMs/App Service</strong>: Managed Identity.</li>
<li><strong>GKE</strong>: Workload Identity Federation for GKE — KSA ממופה ל-Google service account.</li>
</ul>
<pre>apiVersion: v1
kind: ServiceAccount
metadata:
  name: uploader
  namespace: web
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/web-uploader</pre>
<p>ה-default credential chain של ה-SDK של AWS מרים את זה בלי שינוי קוד. ה-credentials מתחלפים אוטומטית; אין מה שידלוף ב-git או ב-layer של Docker image.</p>
<blockquote>⚠️ Production tip: תאכפו IMDSv2 (<code>HttpTokens=required</code>) על EC2. הפריצה ל-Capital One ב-2019 השתמשה ב-SSRF כדי לקרוא credentials של role מ-IMDSv1 ולהוריד מ-S3 יותר מ-100 מיליון רשומות לקוחות.</blockquote>`
      }
    },
    {
      h: { en: "Secrets, KMS and encryption", he: "Secrets, KMS והצפנה" },
      body: {
        en: `<p><strong>Secrets managers</strong> (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, HashiCorp Vault) store DB passwords and API tokens encrypted, with IAM-controlled access, audit logs, versioning and <strong>automatic rotation</strong>. In K8s, the External Secrets Operator or the Secrets Store CSI driver syncs them into pods.</p>
<p><strong>KMS</strong> holds encryption keys inside HSMs; keys never leave. Services use <strong>envelope encryption</strong>: KMS encrypts a small data key, the data key encrypts your data. Deleting/disabling a KMS key = crypto-shredding all data under it (so KMS key deletion has a 7-30 day waiting period).</p>
<ul>
<li><strong>At rest</strong>: S3, EBS, RDS encryption with KMS — enable by default (S3 now encrypts all new objects automatically). Customer-managed keys (CMK) give you control over key policy and rotation.</li>
<li><strong>In transit</strong>: TLS 1.2+ everywhere, including inside the VPC; enforce with <code>aws:SecureTransport</code> conditions and mTLS in a service mesh.</li>
</ul>`,
        he: `<p><strong>Secrets managers</strong> (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, HashiCorp Vault) שומרים סיסמאות DB ו-API tokens מוצפנים, עם גישה שנשלטת ב-IAM, audit logs, גרסאות ו-<strong>rotation אוטומטי</strong>. ב-K8s, ה-External Secrets Operator או ה-Secrets Store CSI driver מסנכרנים אותם לתוך ה-pods.</p>
<p><strong>KMS</strong> מחזיק מפתחות הצפנה בתוך HSMs; המפתחות לא יוצאים משם אף פעם. השירותים משתמשים ב-<strong>envelope encryption</strong>: KMS מצפין data key קטן, וה-data key מצפין את ה-data שלך. מחיקה/השבתה של KMS key = crypto-shredding לכל ה-data שתחתיו (ולכן למחיקת KMS key יש תקופת המתנה של 7-30 יום).</p>
<ul>
<li><strong>At rest</strong>: הצפנה ב-S3, EBS, RDS עם KMS — מפעילים כברירת מחדל (S3 היום מצפין אוטומטית כל אובייקט חדש). Customer-managed keys (CMK) נותנים שליטה על key policy ו-rotation.</li>
<li><strong>In transit</strong>: TLS 1.2+ בכל מקום, גם בתוך ה-VPC; אוכפים עם תנאי <code>aws:SecureTransport</code> ו-mTLS ב-service mesh.</li>
</ul>`
      }
    },
    {
      h: { en: "Audit logs and the classic breaches", he: "Audit logs והפריצות הקלאסיות" },
      body: {
        en: `<p><strong>CloudTrail</strong> (Azure Activity Log, GCP Cloud Audit Logs) records every control-plane API call: who, what, when, from which IP. Enable an <strong>organization trail</strong> to a locked-down log-archive account with Object Lock, so an attacker with admin in a workload account can't erase their tracks. Add GuardDuty / Defender for Cloud / Security Command Center for threat detection.</p>
<p>The greatest hits of cloud breaches — almost all customer-side:</p>
<ul>
<li><strong>Public buckets</strong>: turn on S3 Block Public Access at the <em>account</em> level.</li>
<li><strong>Leaked access keys</strong> in git: bots scrape GitHub within <em>minutes</em> and spin up crypto miners. Use OIDC/roles, enable secret scanning + push protection.</li>
<li><strong>Over-privileged roles</strong>: <code>AdministratorAccess</code> on a web app turns any RCE into a full account takeover.</li>
<li><strong>Open management ports</strong>: SSH/RDP/DB to 0.0.0.0/0. Use SSM Session Manager / Bastion / IAP instead.</li>
<li><strong>SSRF → metadata service</strong>: enforce IMDSv2.</li>
</ul>`,
        he: `<p><strong>CloudTrail</strong> (ב-Azure Activity Log, ב-GCP Cloud Audit Logs) מתעד כל קריאת API ל-control plane: מי, מה, מתי, מאיזה IP. מפעילים <strong>organization trail</strong> ל-account ארכיון לוגים נעול עם Object Lock, כדי שתוקף עם admin ב-account של workload לא יוכל למחוק עקבות. מוסיפים GuardDuty / Defender for Cloud / Security Command Center לזיהוי איומים.</p>
<p>הלהיטים של פריצות ענן — כמעט כולם בצד הלקוח:</p>
<ul>
<li><strong>Buckets ציבוריים</strong>: מפעילים S3 Block Public Access ברמת ה-<em>account</em>.</li>
<li><strong>Access keys שדלפו</strong> ל-git: בוטים סורקים את GitHub תוך <em>דקות</em> ומרימים כורי קריפטו. משתמשים ב-OIDC/roles, ומפעילים secret scanning + push protection.</li>
<li><strong>Roles עם יותר מדי הרשאות</strong>: <code>AdministratorAccess</code> על אפליקציית web הופך כל RCE להשתלטות על כל ה-account.</li>
<li><strong>פורטי ניהול פתוחים</strong>: SSH/RDP/DB ל-0.0.0.0/0. משתמשים ב-SSM Session Manager / Bastion / IAP במקום.</li>
<li><strong>SSRF → שירות ה-metadata</strong>: אוכפים IMDSv2.</li>
</ul>`
      }
    }
  ],
  diagram: `request: role/web-uploader -> s3:PutObject on acme-uploads/x
   |
   +-> any explicit DENY (SCP / boundary / identity / resource / session)? --yes--> DENY
   |                                     no
   +-> allowed by SCP & boundary ceilings? --no--> DENY
   |                                     yes
   +-> explicit ALLOW (identity or resource policy)? --yes--> ALLOW
   |                                     no
   +-> implicit DENY`,
  handsOn: [
    { cmd: "aws sts get-caller-identity", what: { en: "First step of every AccessDenied investigation: who am I actually?", he: "הצעד הראשון בכל חקירת AccessDenied: מי אני בעצם?" } },
    { cmd: "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:role/web-uploader --action-names s3:DeleteObject --resource-arns arn:aws:s3:::acme-uploads/x", what: { en: "Ask IAM 'would this be allowed?' without actually doing it.", he: "שואלים את IAM \"האם זה יותר?\" בלי לבצע בפועל." } },
    { cmd: "aws s3control put-public-access-block --account-id 123456789012 --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true", what: { en: "Block public S3 access for the whole account in one command.", he: "חוסם גישה ציבורית ל-S3 לכל ה-account בפקודה אחת." } },
    { cmd: "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket --max-results 5", what: { en: "Find who deleted a bucket (last 90 days of management events).", he: "מוצאים מי מחק bucket (90 הימים האחרונים של management events)." } },
    { cmd: "gitleaks detect --source . -v", what: { en: "Scan a repo's history for leaked keys before attackers do.", he: "סורק את ההיסטוריה של repo למפתחות שדלפו לפני שהתוקפים יעשו את זה." } }
  ],
  mnemonic: {
    en: "\"Deny by default, Deny wins, Allow is earned.\" And for workloads: Roles, not keys — temporary beats permanent.",
    he: "\"Deny כברירת מחדל, Deny מנצח, Allow צריך להרוויח.\" ול-workloads: roles, לא מפתחות — זמני מנצח קבוע."
  },
  pitfalls: [
    { en: "Access keys for humans and apps. They never expire, get copied into .env files and Slack. Use SSO for people, roles/workload identity for apps.", he: "Access keys לבני אדם ולאפליקציות. הם לא פגים, ומועתקים לקבצי .env ול-Slack. SSO לאנשים, roles/workload identity לאפליקציות." },
    { en: "<code>\"Resource\": \"*\"</code> with <code>s3:*</code> because 'it didn't work otherwise'. Find the missing permission (often the KMS key policy) instead of opening everything.", he: "<code>\"Resource\": \"*\"</code> עם <code>s3:*</code> כי \"אחרת זה לא עבד\". מוצאים את ההרשאה החסרה (הרבה פעמים ה-KMS key policy) במקום לפתוח הכל." },
    { en: "Kubernetes Secrets assumed encrypted — by default they're base64 in etcd. Enable etcd encryption with KMS or use an external secrets manager.", he: "להניח ש-Secrets של Kubernetes מוצפנים — כברירת מחדל הם base64 ב-etcd. מפעילים הצפנת etcd עם KMS או משתמשים ב-secrets manager חיצוני." },
    { en: "CloudTrail in the same account the attacker controls, without log-file validation or Object Lock — they'll just delete it.", he: "CloudTrail באותו account שהתוקף שולט בו, בלי log-file validation או Object Lock — הוא פשוט ימחק אותו." }
  ],
  interview: [
    {
      q: { en: "An identity policy allows s3:GetObject, but an SCP denies it. Result?", he: "Identity policy מאפשר s3:GetObject, אבל SCP חוסם. מה התוצאה?" },
      a: { en: "Denied. Explicit deny anywhere in the evaluation chain always wins, and SCPs are permission ceilings for the whole account — even the account's root/admin can't bypass them.", he: "חסום. Deny מפורש בכל מקום בשרשרת ההערכה תמיד מנצח, ו-SCPs הם תקרת הרשאות לכל ה-account — אפילו root/admin של ה-account לא יכול לעקוף אותם." }
    },
    {
      q: { en: "A developer pushed an AWS access key to a public repo 10 minutes ago. What do you do?", he: "מפתח דחף AWS access key ל-repo ציבורי לפני 10 דקות. מה עושים?" },
      a: { en: "Assume it's already compromised. Deactivate/delete the key immediately, check CloudTrail for activity by that key (new users, roles, instances in unusual regions), revoke any sessions/resources created, rotate related secrets, then remove it from git history — and fix the root cause by moving to roles/OIDC and enabling push protection.", he: "מניחים שהוא כבר נפרץ. מבטלים/מוחקים את המפתח מיד, בודקים ב-CloudTrail פעילות של המפתח (users חדשים, roles, instances ב-regions חריגים), מבטלים sessions ומשאבים שנוצרו, מסובבים secrets קשורים, ואז מוחקים מההיסטוריה של git — ומתקנים את שורש הבעיה ע\"י מעבר ל-roles/OIDC והפעלת push protection." }
    },
    {
      q: { en: "Explain envelope encryption.", he: "הסבר envelope encryption." },
      a: { en: "Data is encrypted locally with a random data key (fast, symmetric). The data key itself is encrypted by a master key in KMS and stored next to the data. To decrypt, you ask KMS to decrypt the data key (IAM-checked, audited), then decrypt the data locally. The master key never leaves the HSM, and large data never goes to KMS.", he: "ה-data מוצפן מקומית עם data key רנדומלי (מהיר, סימטרי). ה-data key עצמו מוצפן ע\"י master key ב-KMS ונשמר ליד ה-data. כדי לפענח מבקשים מ-KMS לפענח את ה-data key (נבדק ב-IAM, מתועד), ואז מפענחים את ה-data מקומית. ה-master key לא יוצא מה-HSM, ו-data גדול אף פעם לא נשלח ל-KMS." }
    }
  ],
  quiz: [
    {
      q: { en: "A role has an Allow for s3:* on a bucket, and the bucket policy has an explicit Deny for that role. The request is:", he: "ל-role יש Allow ל-s3:* על bucket, וב-bucket policy יש Deny מפורש ל-role הזה. הבקשה:" },
      options: [
        { en: "Allowed — identity policies take precedence", he: "מאושרת — identity policies קודמים" },
        { en: "Denied — explicit deny always wins", he: "נדחית — deny מפורש תמיד מנצח" },
        { en: "Allowed only for GetObject", he: "מאושרת רק ל-GetObject" },
        { en: "Depends on which policy was created last", he: "תלוי איזה policy נוצר אחרון" }
      ],
      answer: 1,
      explain: { en: "Explicit Deny anywhere beats any Allow. Order of creation is irrelevant.", he: "Deny מפורש בכל מקום מנצח כל Allow. סדר היצירה לא רלוונטי." }
    },
    {
      q: { en: "Best way for a pod in EKS to access DynamoDB?", he: "מה הדרך הכי טובה ל-pod ב-EKS לגשת ל-DynamoDB?" },
      options: [
        { en: "Access key in a Kubernetes Secret", he: "Access key ב-Secret של Kubernetes" },
        { en: "Access key baked into the Docker image", he: "Access key אפוי בתוך ה-Docker image" },
        { en: "ServiceAccount mapped to an IAM role (IRSA / Pod Identity)", he: "ServiceAccount שממופה ל-IAM role (IRSA / Pod Identity)" },
        { en: "Give the node role AdministratorAccess", he: "לתת ל-role של ה-node הרשאת AdministratorAccess" }
      ],
      answer: 2,
      explain: { en: "Workload identity gives each pod its own short-lived, least-privilege credentials. A broad node role is shared by every pod on the node.", he: "Workload identity נותן לכל pod credentials קצרי-מועד עם least privilege משלו. Role רחב של node משותף לכל ה-pods על ה-node." }
    },
    {
      q: { en: "Which control would have prevented the SSRF → instance-credentials theft pattern (Capital One)?", he: "איזה control היה מונע את דפוס ה-SSRF → גניבת credentials מה-instance (Capital One)?" },
      options: [
        { en: "Enforcing IMDSv2 (session tokens required)", he: "אכיפת IMDSv2 (חובת session tokens)" },
        { en: "Bigger instance type", he: "Instance type גדול יותר" },
        { en: "Enabling S3 versioning", he: "הפעלת S3 versioning" },
        { en: "Switching to gp3 disks", he: "מעבר לדיסקים gp3" }
      ],
      answer: 0,
      explain: { en: "IMDSv2 requires a PUT to obtain a token first, which simple SSRF can't do. Least-privilege on the role would also have limited the blast radius.", he: "IMDSv2 דורש PUT כדי לקבל token קודם, וזה משהו ש-SSRF פשוט לא יכול לעשות. Least privilege על ה-role היה גם מצמצם את ה-blast radius." }
    },
    {
      q: { en: "What does disabling a KMS key effectively do to data encrypted with it?", he: "מה השבתת KMS key עושה בפועל ל-data שהוצפן איתו?" },
      options: [
        { en: "Nothing, data is decrypted automatically", he: "כלום, ה-data מפוענח אוטומטית" },
        { en: "Makes it unreadable until the key is re-enabled (deleting it = permanent)", he: "הופך אותו לבלתי קריא עד שמפעילים את המפתח שוב (מחיקה = לתמיד)" },
        { en: "Moves it to Glacier", he: "מעביר אותו ל-Glacier" },
        { en: "Re-encrypts it with a default key", he: "מצפין אותו מחדש עם מפתח ברירת מחדל" }
      ],
      answer: 1,
      explain: { en: "Without the key, data keys can't be decrypted. That's why deletion has a mandatory 7-30 day waiting period.", he: "בלי המפתח אי אפשר לפענח את ה-data keys. בגלל זה למחיקה יש תקופת המתנה חובה של 7-30 יום." }
    }
  ],
  related: ["net-firewalls", "net-vpc", "cloud-cicd", "cloud-models"]
});

window.INFRA.lessons.push({
  id: "cloud-finops",
  track: "cloud",
  order: 9,
  icon: "💸",
  level: 2,
  minutes: 10,
  title: { en: "FinOps: Understanding the Cloud Bill", he: "FinOps: להבין את חשבון הענן" },
  tldr: {
    en: "The cloud bill is a design document: compute is the obvious line, but egress, NAT gateways, cross-AZ traffic and log ingestion are the silent killers — tag everything, commit for the baseline, spot the flexible, rightsize the rest, and alert on anomalies.",
    he: "חשבון הענן הוא מסמך ארכיטקטורה: compute זו השורה הברורה, אבל egress, NAT gateways, תעבורה בין AZs ו-ingestion של לוגים הם הרוצחים השקטים — מתייגים הכל, מתחייבים על ה-baseline, spot למה שגמיש, rightsizing לשאר, ו-alerts על חריגות."
  },
  analogy: {
    en: "The cloud is a hotel minibar with a magic restocking fairy. Everything you grab is instantly replaced and nobody stops you — then checkout arrives. The room rate (compute) you knew about. The $9 water bottles (egress), the room-service delivery fee on every order (NAT processing), and the 'leaving the lights on in 40 rooms you forgot you booked' (idle resources) are what make you gasp.",
    he: "הענן הוא מיני-בר במלון עם פיה שממלאת אותו מחדש. כל מה שלוקחים מתמלא מיד ואף אחד לא עוצר אותך — ואז מגיע ה-checkout. את מחיר החדר (compute) ידעת. בקבוקי מים ב-$9 (egress), דמי משלוח על כל הזמנה לחדר (NAT processing), ו\"השארת אור דלוק ב-40 חדרים ששכחת שהזמנת\" (משאבים idle) — זה מה שגורם לך להחוויר."
  },
  sections: [
    {
      h: { en: "Where the money actually goes", he: "לאן הכסף באמת הולך" },
      body: {
        en: `<table>
<tr><th>Driver</th><th>Typical AWS price</th><th>Why it bites</th></tr>
<tr><td>Compute (EC2, nodes)</td><td>m7i.large ~$0.10/h ≈ $73/mo</td><td>Overprovisioned "just in case", idle dev envs 24/7</td></tr>
<tr><td><strong>Internet egress</strong></td><td>~$0.09/GB (first 10 TB)</td><td>Ingress is free, egress isn't. 100 TB/mo ≈ $7,000+</td></tr>
<tr><td><strong>NAT Gateway</strong></td><td>$0.045/h + <strong>$0.045/GB processed</strong></td><td>Private subnets pulling images/S3 data through NAT pay per GB</td></tr>
<tr><td>Cross-AZ traffic</td><td>$0.01/GB each way</td><td>Chatty services, Kafka/DB replication</td></tr>
<tr><td>Storage</td><td>S3 $0.023/GB, gp3 $0.08/GB</td><td>Orphaned volumes, snapshots forever, no lifecycle</td></tr>
<tr><td><strong>Logs</strong></td><td>CloudWatch ingest ~$0.50/GB</td><td>DEBUG logging in prod = 10-50x volume</td></tr>
<tr><td>Managed extras</td><td>Load balancers ~$16+/mo each, public IPv4 $0.005/h</td><td>One ALB per microservice per env adds up</td></tr>
</table>
<blockquote>💡 Real world: the most common "why did our bill triple?" story: pods in private subnets pulling large container images and S3 data through a NAT gateway. Fix: <strong>VPC gateway endpoints for S3 and DynamoDB are free</strong> and bypass NAT entirely; interface endpoints for ECR cost far less than NAT processing at volume.</blockquote>`,
        he: `<table>
<tr><th>מקור עלות</th><th>מחיר טיפוסי ב-AWS</th><th>למה זה נושך</th></tr>
<tr><td>Compute (EC2, nodes)</td><td>m7i.large ~$0.10 לשעה ≈ $73 לחודש</td><td>הקצאת יתר "ליתר ביטחון", סביבות dev דולקות 24/7</td></tr>
<tr><td><strong>Egress לאינטרנט</strong></td><td>~$0.09 ל-GB (10 TB ראשונים)</td><td>Ingress בחינם, egress לא. 100 TB בחודש ≈ $7,000+</td></tr>
<tr><td><strong>NAT Gateway</strong></td><td>$0.045 לשעה + <strong>$0.045 לכל GB שעובר</strong></td><td>Subnets פרטיים שמושכים images/data מ-S3 דרך NAT משלמים לפי GB</td></tr>
<tr><td>תעבורה בין AZs</td><td>$0.01 ל-GB לכל כיוון</td><td>סרוויסים פטפטנים, רפליקציה של Kafka/DB</td></tr>
<tr><td>אחסון</td><td>S3 $0.023 ל-GB, gp3 $0.08 ל-GB</td><td>Volumes יתומים, snapshots לנצח, בלי lifecycle</td></tr>
<tr><td><strong>לוגים</strong></td><td>ingest ל-CloudWatch ~$0.50 ל-GB</td><td>DEBUG logging בפרוד = פי 10-50 בנפח</td></tr>
<tr><td>תוספות מנוהלות</td><td>Load balancers ~$16+ לחודש כל אחד, public IPv4 $0.005 לשעה</td><td>ALB לכל microservice בכל סביבה מצטבר</td></tr>
</table>
<blockquote>💡 Real world: הסיפור הכי נפוץ של "למה החשבון שלנו שולש?": pods ב-subnets פרטיים שמושכים container images גדולים ו-data מ-S3 דרך NAT gateway. התיקון: <strong>VPC gateway endpoints ל-S3 ול-DynamoDB הם בחינם</strong> ועוקפים את ה-NAT לגמרי; interface endpoints ל-ECR עולים הרבה פחות מ-NAT processing בנפחים גדולים.</blockquote>`
      }
    },
    {
      h: { en: "Pricing models: on-demand, commitments, spot", he: "מודלי תמחור: on-demand, התחייבויות, spot" },
      body: {
        en: `<table>
<tr><th>Model</th><th>Discount vs on-demand</th><th>Catch</th><th>Use for</th></tr>
<tr><td>On-demand</td><td>0%</td><td>Most expensive</td><td>Spiky, unknown, short-lived</td></tr>
<tr><td>Savings Plans / Reserved Instances (AWS), Reservations / Savings Plan (Azure), CUDs (GCP)</td><td>~30-72%</td><td>1 or 3 year commitment ($/hour or specific instance)</td><td>The steady baseline you'll run anyway</td></tr>
<tr><td>Spot / Spot VMs / Preemptible</td><td>~60-90%</td><td>Can be reclaimed with 2 min (AWS) / 30 s (GCP, Azure) notice</td><td>Stateless, fault-tolerant: CI runners, batch, K8s workers with PDBs</td></tr>
</table>
<p>Strategy: look at the last 30-60 days of usage. Cover the <strong>always-on floor</strong> (e.g., 70-80% of it) with a Compute Savings Plan — it applies across instance families, regions, Fargate and Lambda. Run the bursty top on on-demand and spot. GCP also gives <em>sustained use discounts</em> automatically for VMs running most of the month.</p>
<blockquote>⚠️ Production tip: commit <em>after</em> rightsizing, not before. Otherwise you lock in a 3-year discount on servers that are 4x too big.</blockquote>`,
        he: `<table>
<tr><th>מודל</th><th>הנחה ביחס ל-on-demand</th><th>הקאץ'</th><th>מתאים ל</th></tr>
<tr><td>On-demand</td><td>0%</td><td>הכי יקר</td><td>קופצני, לא ידוע, קצר-מועד</td></tr>
<tr><td>Savings Plans / Reserved Instances (AWS), Reservations / Savings Plan (Azure), CUDs (GCP)</td><td>~30-72%</td><td>התחייבות ל-1 או 3 שנים ($ לשעה או instance ספציפי)</td><td>ה-baseline היציב שממילא ירוץ</td></tr>
<tr><td>Spot / Spot VMs / Preemptible</td><td>~60-90%</td><td>יכולים להילקח עם התראה של 2 דקות (AWS) / 30 שניות (GCP, Azure)</td><td>Stateless ועמיד לתקלות: CI runners, batch, K8s workers עם PDBs</td></tr>
</table>
<p>אסטרטגיה: מסתכלים על 30-60 ימי השימוש האחרונים. מכסים את <strong>הרצפה שתמיד דולקת</strong> (למשל 70-80% ממנה) עם Compute Savings Plan — הוא חל על משפחות instances שונות, regions, Fargate ו-Lambda. את החלק הקופצני מעל מריצים on-demand ו-spot. ב-GCP יש גם <em>sustained use discounts</em> אוטומטיים ל-VMs שרצים רוב החודש.</p>
<blockquote>⚠️ Production tip: מתחייבים <em>אחרי</em> rightsizing, לא לפני. אחרת נועלים הנחה ל-3 שנים על שרתים גדולים פי 4 ממה שצריך.</blockquote>`
      }
    },
    {
      h: { en: "Rightsizing and autoscaling", he: "Rightsizing ו-autoscaling" },
      body: {
        en: `<p>Most fleets run at <strong>10-20% average CPU</strong>. Rightsizing = match resources to actual usage:</p>
<ul>
<li>Use p95 CPU/memory over 2-4 weeks, not a single day. Tools: AWS Compute Optimizer, Azure Advisor, GCP Recommender, Kubecost / OpenCost for K8s.</li>
<li>In Kubernetes, <strong>requests</strong> drive cost — a pod requesting 2 CPU but using 0.2 reserves a node's worth of money. Use VPA recommendations to set realistic requests.</li>
<li>Switch generations/architectures: Graviton (ARM) instances are typically ~20% cheaper with better price-performance.</li>
</ul>
<p><strong>Autoscaling saves money only if it scales down.</strong> HPA for pods + Cluster Autoscaler/Karpenter for nodes; make sure nodes actually drain (PDBs not blocking, no local-storage pods pinning them). Schedule non-prod to shut down nights and weekends: 168 hours/week → ~50 working hours = <strong>~70% off</strong> dev/staging compute.</p>`,
        he: `<p>רוב ה-fleets רצים על <strong>10-20% CPU בממוצע</strong>. Rightsizing = להתאים משאבים לשימוש בפועל:</p>
<ul>
<li>משתמשים ב-p95 של CPU/זיכרון על פני 2-4 שבועות, לא יום אחד. כלים: AWS Compute Optimizer, Azure Advisor, GCP Recommender, Kubecost / OpenCost ל-K8s.</li>
<li>ב-Kubernetes ה-<strong>requests</strong> קובעים את העלות — pod שמבקש 2 CPU ומשתמש ב-0.2 שומר לעצמו כסף של node. משתמשים בהמלצות של VPA כדי לקבוע requests ריאליים.</li>
<li>מחליפים דור/ארכיטקטורה: instances של Graviton (ARM) זולים בדרך כלל ב-~20% עם price-performance טוב יותר.</li>
</ul>
<p><strong>Autoscaling חוסך כסף רק אם הוא יורד למטה.</strong> HPA ל-pods + Cluster Autoscaler/Karpenter ל-nodes; מוודאים שה-nodes באמת מתרוקנים (PDBs לא חוסמים, אין pods עם local storage שמחזיקים אותם). מתזמנים כיבוי של non-prod בלילות ובסופ"ש: 168 שעות בשבוע → ~50 שעות עבודה = <strong>~70% הנחה</strong> על compute של dev/staging.</p>`
      }
    },
    {
      h: { en: "Visibility: tagging, showback, anomaly alerts", he: "נראות: tagging, showback ו-anomaly alerts" },
      body: {
        en: `<p>You can't optimize what you can't attribute. FinOps basics:</p>
<ul>
<li><strong>Tagging policy</strong>: <code>team</code>, <code>service</code>, <code>env</code>, <code>cost-center</code> on everything, enforced in IaC (Terraform <code>default_tags</code>) and by policy (AWS Tag Policies / SCPs, Azure Policy "require tag").</li>
<li><strong>Showback</strong> (each team sees its costs) vs <strong>chargeback</strong> (each team actually pays from its budget). Showback alone changes behavior surprisingly fast.</li>
<li><strong>Unit economics</strong>: cost per customer, per 1K requests, per GB processed — a growing bill is fine if cost per order is falling.</li>
<li><strong>Budgets + anomaly detection</strong>: AWS Budgets and Cost Anomaly Detection, Azure Cost Management alerts, GCP budget alerts. Alert on daily spend, not the monthly invoice — by then it's 30 days too late.</li>
</ul>
<pre>provider "aws" {
  region = "eu-central-1"
  default_tags { tags = { team = "payments", env = "prod", service = "checkout" } }
}</pre>`,
        he: `<p>אי אפשר לבצע אופטימיזציה למה שאי אפשר לשייך. יסודות FinOps:</p>
<ul>
<li><strong>Tagging policy</strong>: <code>team</code>, <code>service</code>, <code>env</code>, <code>cost-center</code> על הכל, נאכף ב-IaC (<code>default_tags</code> ב-Terraform) וב-policy (AWS Tag Policies / SCPs, Azure Policy "require tag").</li>
<li><strong>Showback</strong> (כל צוות רואה את העלויות שלו) מול <strong>chargeback</strong> (כל צוות באמת משלם מהתקציב שלו). רק showback לבד משנה התנהגות מהר באופן מפתיע.</li>
<li><strong>Unit economics</strong>: עלות ללקוח, ל-1K בקשות, ל-GB מעובד — חשבון שגדל זה בסדר אם העלות להזמנה יורדת.</li>
<li><strong>Budgets + anomaly detection</strong>: AWS Budgets ו-Cost Anomaly Detection, התראות ב-Azure Cost Management, budget alerts ב-GCP. מתריעים על הוצאה יומית, לא על החשבונית החודשית — אז זה כבר מאוחר ב-30 יום.</li>
</ul>
<pre>provider "aws" {
  region = "eu-central-1"
  default_tags { tags = { team = "payments", env = "prod", service = "checkout" } }
}</pre>`
      }
    }
  ],
  handsOn: [
    { cmd: "aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE", what: { en: "Last month's cost broken down by service — find your top 5 lines.", he: "העלות של החודש שעבר לפי שירות — מוצאים את 5 השורות הגדולות." } },
    { cmd: "aws ce get-cost-and-usage --time-period Start=2026-11-01,End=2026-11-12 --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=USAGE_TYPE", what: { en: "Daily cost by usage type: look for NatGateway-Bytes, DataTransfer-Out-Bytes, DataProcessing-Bytes (logs).", he: "עלות יומית לפי usage type: מחפשים NatGateway-Bytes, DataTransfer-Out-Bytes, DataProcessing-Bytes (לוגים)." } },
    { cmd: "aws ec2 describe-volumes --filters Name=status,Values=available --query 'Volumes[].[VolumeId,Size,CreateTime]' --output table", what: { en: "Unattached EBS volumes = money for nothing.", he: "EBS volumes לא מחוברים = כסף על כלום." } },
    { cmd: "aws ec2 create-vpc-endpoint --vpc-id vpc-0abc123 --service-name com.amazonaws.eu-central-1.s3 --route-table-ids rtb-0def456", what: { en: "Free S3 gateway endpoint — S3 traffic stops going through the NAT gateway.", he: "S3 gateway endpoint בחינם — תעבורת S3 מפסיקה לעבור דרך ה-NAT gateway." } },
    { cmd: "kubectl top pods -A --sort-by=cpu | head -20", what: { en: "Compare actual usage with requests to spot over-requested workloads.", he: "משווים שימוש בפועל ל-requests כדי למצוא workloads שמבקשים יותר מדי." } }
  ],
  mnemonic: {
    en: "\"Commit the floor, Spot the spikes, Tag the rest, Watch the exits (egress, NAT, logs).\"",
    he: "\"מתחייבים על הרצפה, spot לקפיצות, מתייגים את השאר, ושומרים על היציאות (egress, NAT, לוגים).\""
  },
  pitfalls: [
    { en: "Sending S3/ECR traffic through a NAT gateway instead of VPC endpoints — paying $0.045/GB for traffic that could be free.", he: "להעביר תעבורת S3/ECR דרך NAT gateway במקום VPC endpoints — משלמים $0.045 ל-GB על תעבורה שיכולה להיות בחינם." },
    { en: "Leaving DEBUG logging on after an incident. At $0.50/GB ingest, an extra 1 TB/day is ~$15K/month.", he: "להשאיר DEBUG logging אחרי אינסידנט. ב-$0.50 ל-GB ingest, עוד 1 TB ביום זה ~$15K בחודש." },
    { en: "Buying 3-year reservations for instance types you'll migrate off in 6 months. Prefer flexible Compute Savings Plans.", he: "לקנות reservations ל-3 שנים על instance types שתעברו מהם בעוד חצי שנה. עדיף Compute Savings Plans גמישים." },
    { en: "Running stateful single-replica workloads on spot without handling interruptions.", he: "להריץ workloads stateful עם replica אחת על spot בלי לטפל ב-interruptions." }
  ],
  interview: [
    {
      q: { en: "The cloud bill jumped 40% this month. How do you investigate?", he: "חשבון הענן קפץ ב-40% החודש. איך חוקרים?" },
      a: { en: "Cost Explorer grouped by service, then by usage type and tag, daily granularity to find when it started. Correlate the start date with deploys/config changes. Usual suspects: data transfer/NAT bytes, log ingestion, new untagged resources, autoscaling that didn't scale down. Fix, then add a budget/anomaly alert so next time it's caught in a day.", he: "Cost Explorer לפי שירות, ואז לפי usage type ו-tag, ברזולוציה יומית כדי למצוא מתי זה התחיל. מצליבים את תאריך ההתחלה עם deploys/שינויי config. החשודים הרגילים: data transfer/NAT bytes, ingestion של לוגים, משאבים חדשים בלי tags, autoscaling שלא ירד. מתקנים, ואז מוסיפים budget/anomaly alert כדי שבפעם הבאה זה ייתפס תוך יום." }
    },
    {
      q: { en: "When would you use spot instances in Kubernetes?", he: "מתי תשתמש ב-spot instances ב-Kubernetes?" },
      a: { en: "For stateless, horizontally scaled workloads with multiple replicas, PDBs and graceful shutdown handling: web tiers, workers, CI runners, batch. Diversify instance types and AZs (Karpenter does this), keep a small on-demand baseline for critical pods, and never put single-replica stateful services there.", he: "ל-workloads stateless שעושים scale אופקי עם כמה replicas, PDBs וטיפול ב-graceful shutdown: שכבות web, workers, CI runners, batch. מגוונים instance types ו-AZs (Karpenter עושה את זה), שומרים baseline קטן של on-demand לפודים קריטיים, ואף פעם לא שמים שם שירותים stateful עם replica אחת." }
    }
  ],
  quiz: [
    {
      q: { en: "Pods in private subnets download 50 TB/month from S3 via a NAT gateway. Cheapest fix?", he: "Pods ב-subnets פרטיים מורידים 50 TB בחודש מ-S3 דרך NAT gateway. מה התיקון הכי זול?" },
      options: [
        { en: "Move pods to public subnets with public IPs", he: "להעביר את ה-pods ל-subnets ציבוריים עם public IPs" },
        { en: "Add an S3 gateway VPC endpoint (free)", he: "להוסיף S3 gateway VPC endpoint (בחינם)" },
        { en: "Buy a Savings Plan", he: "לקנות Savings Plan" },
        { en: "Use a bigger NAT gateway", he: "להשתמש ב-NAT gateway גדול יותר" }
      ],
      answer: 1,
      explain: { en: "50 TB × $0.045/GB ≈ $2,300/month in NAT processing, gone. Gateway endpoints for S3/DynamoDB have no hourly or per-GB charge.", he: "50 TB × $0.045 ל-GB ≈ $2,300 בחודש על NAT processing — נעלם. ל-gateway endpoints של S3/DynamoDB אין חיוב לשעה או ל-GB." }
    },
    {
      q: { en: "Which workload fits spot instances best?", he: "איזה workload הכי מתאים ל-spot instances?" },
      options: [
        { en: "A single-node PostgreSQL primary", he: "PostgreSQL primary על node אחד" },
        { en: "CI build runners", he: "CI build runners" },
        { en: "The only Kafka controller", he: "ה-Kafka controller היחיד" },
        { en: "A license server that must never restart", he: "שרת רישיונות שאסור לו לעשות restart" }
      ],
      answer: 1,
      explain: { en: "CI jobs are short, retryable and stateless — losing a runner just means re-running a job.", he: "CI jobs קצרים, ניתנים ל-retry ו-stateless — לאבד runner זה רק להריץ job שוב." }
    },
    {
      q: { en: "What should you do BEFORE buying a 3-year commitment?", he: "מה צריך לעשות לפני שקונים התחייבות ל-3 שנים?" },
      options: [
        { en: "Rightsize and cover only the steady baseline", he: "Rightsizing ולכסות רק את ה-baseline היציב" },
        { en: "Double the fleet to get a bigger discount", he: "להכפיל את ה-fleet כדי לקבל הנחה גדולה יותר" },
        { en: "Turn off tagging", he: "לכבות tagging" },
        { en: "Nothing, commitments are always good", he: "כלום, התחייבויות תמיד טובות" }
      ],
      answer: 0,
      explain: { en: "Commit on what you'll certainly run after optimization; otherwise you lock in waste for years.", he: "מתחייבים על מה שבטוח ירוץ אחרי אופטימיזציה; אחרת נועלים בזבוז לשנים." }
    },
    {
      q: { en: "Showback means:", he: "Showback זה:" },
      options: [
        { en: "Each team's budget is actually charged for its cloud usage", he: "התקציב של כל צוות באמת מחויב על השימוש שלו בענן" },
        { en: "Teams see the costs attributed to them, without internal billing", he: "צוותים רואים את העלויות שמשויכות אליהם, בלי חיוב פנימי" },
        { en: "The cloud provider refunds unused capacity", he: "ספק הענן מחזיר כסף על קיבולת לא מנוצלת" },
        { en: "A dashboard of spot interruption events", he: "Dashboard של spot interruptions" }
      ],
      answer: 1,
      explain: { en: "Showback = visibility; chargeback = actual internal billing. Both depend on good tagging.", he: "Showback = נראות; chargeback = חיוב פנימי בפועל. שניהם תלויים ב-tagging טוב." }
    }
  ],
  playground: "scaling",
  related: ["cloud-storage", "cloud-serverless", "net-vpc"]
});

/* ------------------------------- Glossary ------------------------------- */
[
  ["IaaS", "Infrastructure as a Service: rent raw VMs, disks and networks; you manage the OS and up.", "Infrastructure as a Service: שוכרים VMs, דיסקים ורשתות; מה-OS ומעלה עליך.", "cloud-models"],
  ["PaaS", "Platform as a Service: deploy code, the platform runs the OS, runtime and scaling.", "Platform as a Service: פורסים קוד, הפלטפורמה מנהלת OS, runtime ו-scaling.", "cloud-models"],
  ["SaaS", "Software as a Service: a complete product you just use (Gmail, Slack, Datadog).", "Software as a Service: מוצר שלם שרק משתמשים בו (Gmail, Slack, Datadog).", "cloud-models"],
  ["FaaS", "Functions as a Service: event-triggered functions billed per invocation and duration (Lambda, Azure Functions).", "Functions as a Service: פונקציות שמופעלות מ-events ומחויבות לפי הפעלה ומשך (Lambda, Azure Functions).", "cloud-models"],
  ["Shared Responsibility Model", "Provider secures the cloud itself; customer secures what they run and configure in it.", "הספק מאבטח את הענן עצמו; הלקוח מאבטח את מה שהוא מריץ ומגדיר בתוכו.", "cloud-models"],
  ["Region", "A geographic area with multiple isolated availability zones (e.g., eu-central-1).", "אזור גיאוגרפי עם כמה availability zones מבודדים (למשל eu-central-1).", "cloud-regions-azs"],
  ["Availability Zone (AZ)", "One or more datacenters with independent power and networking inside a region, ~1-2 ms apart.", "Datacenter אחד או יותר עם חשמל ורשת עצמאיים בתוך region, ~1-2 ms זה מזה.", "cloud-regions-azs"],
  ["Edge Location", "Small PoP close to users running CDN cache, DNS and edge compute.", "PoP קטן קרוב למשתמשים שמריץ CDN cache, DNS ו-edge compute.", "cloud-regions-azs"],
  ["Data Residency", "Requirement that data be stored and processed within a specific country or jurisdiction.", "דרישה שה-data יישמר ויעובד בתוך מדינה או סמכות שיפוטית מסוימת.", "cloud-regions-azs"],
  ["Object Storage", "Flat key→blob storage over HTTP with near-unlimited scale (S3, Blob, GCS).", "אחסון שטוח של key→blob מעל HTTP עם סקייל כמעט אינסופי (S3, Blob, GCS).", "cloud-storage"],
  ["Block Storage", "Network-attached virtual disk for a single VM (EBS, Managed Disks, Persistent Disk).", "דיסק וירטואלי שמחובר ברשת ל-VM אחד (EBS, Managed Disks, Persistent Disk).", "cloud-storage"],
  ["Durability", "Probability that stored data is not lost; S3 is designed for 11 nines.", "ההסתברות שה-data השמור לא יאבד; S3 מתוכנן ל-11 תשיעיות.", "cloud-storage"],
  ["Infrastructure as Code (IaC)", "Defining infrastructure in versioned, reviewable code instead of manual console changes.", "הגדרת תשתית בקוד עם גרסאות ו-review במקום שינויים ידניים בקונסול.", "cloud-iac"],
  ["Terraform State", "File mapping Terraform resources to real cloud IDs; must be remote, locked and treated as secret.", "קובץ שממפה משאבי Terraform ל-IDs אמיתיים בענן; חייב להיות מרוחק, נעול, ומטופל כ-secret.", "cloud-iac"],
  ["Drift", "Difference between the real infrastructure and what the IaC code declares.", "ההבדל בין התשתית בפועל למה שקוד ה-IaC מגדיר.", "cloud-iac"],
  ["Continuous Delivery", "Every change is automatically built, tested and release-ready; prod deploy needs one approval.", "כל שינוי נבנה, נבדק ומוכן לשחרור אוטומטית; deploy לפרוד דורש אישור אחד.", "cloud-cicd"],
  ["Continuous Deployment", "Every change that passes the pipeline goes to production automatically, no human gate.", "כל שינוי שעובר את ה-pipeline עולה לפרוד אוטומטית, בלי שער אנושי.", "cloud-cicd"],
  ["OIDC Federation", "CI jobs or workloads exchange a signed identity token for short-lived cloud credentials — no static keys.", "Jobs של CI או workloads מחליפים identity token חתום ב-credentials זמניים לענן — בלי מפתחות סטטיים.", "cloud-cicd"],
  ["Cold Start", "Extra latency when a serverless platform must create a new execution environment before handling a request.", "Latency נוסף כשפלטפורמת serverless צריכה ליצור execution environment חדש לפני טיפול בבקשה.", "cloud-serverless"],
  ["IAM Role", "An identity without long-term credentials, assumed to obtain temporary credentials.", "זהות בלי credentials ארוכי-טווח, שעושים לה assume כדי לקבל credentials זמניים.", "cloud-iam-security"],
  ["Least Privilege", "Grant only the permissions needed for the task, nothing more.", "לתת רק את ההרשאות שנחוצות למשימה, ולא יותר.", "cloud-iam-security"],
  ["Explicit Deny", "A Deny statement that overrides any Allow in IAM policy evaluation.", "הצהרת Deny שגוברת על כל Allow בהערכת IAM policies.", "cloud-iam-security"],
  ["Workload Identity", "Binding a pod/VM/function to a cloud identity so it gets auto-rotated credentials without keys.", "קישור pod/VM/פונקציה לזהות בענן כדי שיקבל credentials שמתחלפים אוטומטית, בלי מפתחות.", "cloud-iam-security"],
  ["KMS", "Key Management Service: managed HSM-backed encryption keys used for envelope encryption.", "Key Management Service: מפתחות הצפנה מנוהלים על גבי HSM, לשימוש ב-envelope encryption.", "cloud-iam-security"],
  ["CloudTrail", "AWS audit log of every API call: who did what, when, from where.", "ה-audit log של AWS לכל קריאת API: מי עשה מה, מתי, ומאיפה.", "cloud-iam-security"],
  ["Egress", "Data leaving the cloud (or a region/AZ); billed per GB, unlike mostly-free ingress.", "Data שיוצא מהענן (או מ-region/AZ); מחויב לפי GB, בניגוד ל-ingress שברובו בחינם.", "cloud-finops"],
  ["NAT Gateway", "Managed outbound internet for private subnets; charged hourly plus per GB processed.", "יציאה מנוהלת לאינטרנט מ-subnets פרטיים; מחויב לפי שעה ועוד לפי GB שעובר.", "cloud-finops"],
  ["Savings Plan", "Commit to $/hour of compute for 1-3 years in exchange for up to ~72% discount.", "התחייבות ל-$ לשעה של compute ל-1-3 שנים בתמורה להנחה של עד ~72%.", "cloud-finops"],
  ["Spot Instance", "Spare capacity at 60-90% discount that can be reclaimed with short notice.", "קיבולת עודפת בהנחה של 60-90% שיכולה להילקח בהתראה קצרה.", "cloud-finops"],
  ["Showback", "Reporting cloud costs per team/service without actually charging their budgets.", "דיווח עלויות ענן לפי צוות/שירות בלי לחייב בפועל את התקציב שלהם.", "cloud-finops"]
].forEach(([term, en, he, lesson]) => window.INFRA.glossary.push({ term, track: "cloud", def: { en, he }, lesson }));
