window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ------------------------------------------------------------------ */
/* MLOps: lifecycle, training pipelines, serving & drift monitoring    */
/* ------------------------------------------------------------------ */

INFRA.lessons.push({
  id: "mlops-lifecycle",
  track: "ai",
  order: 20,
  icon: "🔁",
  level: 2,
  minutes: 14,
  title: { en: "MLOps: the ML Lifecycle Through an Infra Lens", he: "MLOps: מחזור החיים של ML בעיניים של איש תשתיות" },
  tldr: {
    en: "An ML system is code + data + model, and the model is a build artifact produced from the other two. MLOps is the discipline of versioning all three, tracking every run, promoting models through a registry, and monitoring them because they fail silently: no exception, no 500, just worse decisions.",
    he: "מערכת ML היא code + data + model, וה-model הוא build artifact שנוצר משני האחרים. MLOps זו המשמעת של לנהל גרסאות לשלושתם, לתעד כל ריצה, לקדם models דרך registry ולנטר אותם, כי הם נכשלים בשקט: בלי exception, בלי 500, רק החלטות גרועות יותר."
  },
  analogy: {
    en: "A regular service is a recipe: same recipe, same cake. An ML model is a sourdough starter: the recipe matters, but so does the flour batch you fed it and the kitchen it grew in. To bake the same loaf again you must record the recipe, the exact flour lot and the oven, and you need someone tasting the bread every day, because a starter can go sour without making a sound.",
    he: "שירות רגיל הוא מתכון: אותו מתכון, אותה עוגה. Model של ML הוא מחמצת: המתכון חשוב, אבל גם שק הקמח שהאכלת אותה וגם המטבח שבו היא גדלה. כדי לאפות שוב את אותו לחם אתה חייב לרשום את המתכון, את מספר האצווה של הקמח ואת התנור. וצריך מישהו שטועם את הלחם כל יום, כי מחמצת יכולה להחמיץ בלי להשמיע קול."
  },
  sections: [
    {
      h: { en: "Why ML is different: three inputs and silent failures", he: "למה ML שונה: שלושה inputs וכשלים שקטים" },
      body: {
        en: `<p>In normal software, behaviour is defined by code. In ML, behaviour is defined by <strong>code + data + hyperparameters</strong>, and the result is a binary blob (the model) that nobody can read. That changes the infra problem:</p>
<table>
<tr><th></th><th>Regular service</th><th>ML system</th></tr>
<tr><td>What you version</td><td>Code (git), image digest</td><td>Code, <strong>data snapshot</strong>, features, hyperparameters, model weights, environment</td></tr>
<tr><td>Build</td><td>Deterministic compile, minutes</td><td>Training run: hours to weeks, GPUs, often non-deterministic</td></tr>
<tr><td>Test</td><td>Unit/integration tests pass or fail</td><td>Offline metrics (AUC, F1, RMSE) on a held-out set, compared to the current champion</td></tr>
<tr><td>Failure mode</td><td>Errors, latency, crashes: loud</td><td>Accuracy decays as the world changes: <strong>silent</strong>. Latency and error rate stay green</td></tr>
<tr><td>Fix</td><td>Roll back code</td><td>Roll back model, fix data, or retrain</td></tr>
</table>
<p>The classic paper "Hidden Technical Debt in Machine Learning Systems" (Sculley et al., NeurIPS 2015) put it as <strong>CACE: Changing Anything Changes Everything</strong>. Rename a column upstream, change a default from 0 to null, or switch a unit from dollars to cents, and the model keeps answering with full confidence, just wrongly. The ML code itself is a small box in the middle; most of the system is data collection, feature extraction, serving, monitoring and config. That surrounding box is the platform team's job.</p>
<blockquote>💡 Real world: the most common "model bug" in production is not a bad model. It is a data pipeline that changed: a join that started dropping rows, a feature that became all nulls, or a unit change. That's why MLOps is mostly data engineering plus release engineering.</blockquote>`,
        he: `<p>בתוכנה רגילה, ההתנהגות מוגדרת ע"י הקוד. ב-ML, ההתנהגות מוגדרת ע"י <strong>code + data + hyperparameters</strong>, והתוצאה היא blob בינארי (ה-model) שאף אחד לא יכול לקרוא. זה משנה את בעיית התשתית:</p>
<table>
<tr><th></th><th>שירות רגיל</th><th>מערכת ML</th></tr>
<tr><td>מה מנהלים בגרסאות</td><td>קוד (git), digest של image</td><td>קוד, <strong>snapshot של הדאטה</strong>, features, hyperparameters, משקולות ה-model, הסביבה</td></tr>
<tr><td>Build</td><td>קומפילציה דטרמיניסטית, דקות</td><td>ריצת training: שעות עד שבועות, GPUs, ולרוב לא דטרמיניסטי</td></tr>
<tr><td>בדיקות</td><td>Unit/integration tests עוברים או נכשלים</td><td>מטריקות offline (AUC, F1, RMSE) על סט מוחזק בצד, בהשוואה ל-champion הנוכחי</td></tr>
<tr><td>איך זה נכשל</td><td>שגיאות, latency, קריסות: רועש</td><td>הדיוק נשחק כשהעולם משתנה: <strong>בשקט</strong>. ה-latency וה-error rate נשארים ירוקים</td></tr>
<tr><td>תיקון</td><td>Rollback לקוד</td><td>Rollback ל-model, תיקון דאטה, או retraining</td></tr>
</table>
<p>המאמר הקלאסי "Hidden Technical Debt in Machine Learning Systems" (Sculley ואחרים, NeurIPS 2015) קרא לזה <strong>CACE: Changing Anything Changes Everything</strong>. משנים שם של עמודה upstream, default מ-0 ל-null, או יחידה מדולרים לסנטים, וה-model ממשיך לענות בביטחון מלא. פשוט לא נכון. קוד ה-ML עצמו הוא קופסה קטנה באמצע; רוב המערכת היא איסוף דאטה, חילוץ features, serving, ניטור ו-config. הקופסה שמסביב היא העבודה של צוות הפלטפורמה.</p>
<blockquote>💡 Real world: ה"באג במודל" הכי נפוץ בפרודקשן הוא לא model גרוע. זה pipeline של דאטה שהשתנה: join שהתחיל להפיל שורות, feature שהפך כולו ל-null, או שינוי יחידות. לכן MLOps זה בעיקר data engineering ועוד release engineering.</blockquote>`
      }
    },
    {
      h: { en: "The lifecycle and the 0/1/2 maturity levels", he: "מחזור החיים ורמות הבשלות 0/1/2" },
      body: {
        en: `<p>The loop: <strong>data → features → training → evaluation → registry → deploy → monitor → retrain</strong>. Every arrow is a hand-off where something can silently change, so every arrow should leave a record (dataset version, run id, model version, deployment id).</p>
<p>Google's MLOps whitepaper describes three maturity levels. They are the most useful vocabulary for "where are we and what do we build next":</p>
<table>
<tr><th>Level</th><th>What it looks like</th><th>Typical pain</th><th>What the platform adds</th></tr>
<tr><td><strong>0: manual</strong></td><td>A data scientist trains in a notebook, hands a <code>model.pkl</code> to engineering, someone wraps it in Flask. Retrains a few times a year</td><td>"Which data was this trained on?" Nobody knows. Training/serving skew because features are re-implemented in the service</td><td>Experiment tracking, a model registry, a standard serving image</td></tr>
<tr><td><strong>1: pipeline automation</strong></td><td>The training <em>pipeline</em> is the deployable unit, not the model. It runs on a schedule or trigger (continuous training), validates data and model, and registers the result</td><td>Pipeline code itself is still deployed by hand; tests are thin</td><td>An orchestrator, a feature store, data validation, automatic evaluation gates, monitoring that triggers retraining</td></tr>
<tr><td><strong>2: CI/CD for pipelines</strong></td><td>Changes to pipeline code go through CI (unit tests, build components, deploy the pipeline to staging, run it), then CD promotes it. Many pipelines, many models</td><td>Scale: hundreds of models, GPU quotas, cost</td><td>Multi-tenant platform: quotas, templates, golden paths, lineage across everything</td></tr>
</table>
<blockquote>⚠️ Production tip: don't jump from 0 to 2. Most teams get 80% of the value from a tracking server, a registry with aliases, one standard serving path, and a scheduled retraining pipeline. Level 2 pays off when you have many models and many people changing pipelines.</blockquote>`,
        he: `<p>הלולאה: <strong>data ← features ← training ← evaluation ← registry ← deploy ← monitor ← retrain</strong>. כל חץ הוא מסירה שבה משהו יכול להשתנות בשקט, אז כל חץ צריך להשאיר רישום: גרסת dataset, run id, גרסת model, deployment id.</p>
<p>ה-whitepaper של Google על MLOps מתאר שלוש רמות בשלות. זה אוצר המילים הכי שימושי לשאלה "איפה אנחנו ומה בונים עכשיו":</p>
<table>
<tr><th>רמה</th><th>איך זה נראה</th><th>הכאב הטיפוסי</th><th>מה הפלטפורמה מוסיפה</th></tr>
<tr><td><strong>0: ידני</strong></td><td>Data scientist מאמן ב-notebook, מוסר <code>model.pkl</code> להנדסה, ומישהו עוטף את זה ב-Flask. Retraining כמה פעמים בשנה</td><td>"על איזה דאטה זה אומן?" אף אחד לא יודע. Training/serving skew כי ה-features ממומשים מחדש בתוך השירות</td><td>Experiment tracking, model registry, image סטנדרטי ל-serving</td></tr>
<tr><td><strong>1: אוטומציה של ה-pipeline</strong></td><td>היחידה שעושים לה deploy היא ה-<em>pipeline</em> של ה-training, לא ה-model. הוא רץ לפי לוח זמנים או טריגר (continuous training), מוודא את הדאטה ואת ה-model, ורושם את התוצאה</td><td>את קוד ה-pipeline עצמו עדיין מעלים ידנית; הבדיקות דלות</td><td>Orchestrator, feature store, ולידציה לדאטה, שערי evaluation אוטומטיים, ניטור שמפעיל retraining</td></tr>
<tr><td><strong>2: CI/CD ל-pipelines</strong></td><td>שינויים בקוד ה-pipeline עוברים CI (unit tests, build לרכיבים, deploy ל-staging והרצה), ואז CD מקדם. הרבה pipelines, הרבה models</td><td>Scale: מאות models, מכסות GPU, עלויות</td><td>פלטפורמה multi-tenant: quotas, templates, golden paths ו-lineage על הכל</td></tr>
</table>
<blockquote>⚠️ Production tip: אל תקפוץ מ-0 ל-2. רוב הצוותים מקבלים 80% מהערך משרת tracking, registry עם aliases, נתיב serving סטנדרטי אחד ו-pipeline של retraining שרץ לפי לוח זמנים. רמה 2 משתלמת כשיש הרבה models והרבה אנשים שמשנים pipelines.</blockquote>`
      }
    },
    {
      h: { en: "Experiment tracking and the model registry with MLflow", he: "Experiment tracking ו-model registry עם MLflow" },
      body: {
        en: `<p><strong>MLflow</strong> (open source, Linux Foundation) is the de facto standard; Databricks, Azure ML and SageMaker all offer it managed. Its vocabulary:</p>
<ul>
<li><strong>Experiment</strong>: a folder of runs ("fraud-model").</li>
<li><strong>Run</strong>: one training execution. Logs <strong>params</strong> (lr=0.05, max_depth=8), <strong>metrics</strong> over time (val_auc per epoch), <strong>tags</strong> (git sha, dataset version) and <strong>artifacts</strong> (plots, the model files).</li>
<li><strong>Logged model</strong>: in MLflow 3.x a model is a first-class entity with its own id, linked to the run, the dataset and its evaluation metrics.</li>
<li><strong>Registered model + versions</strong>: a named model ("fraud") with immutable versions 1, 2, 3.</li>
<li><strong>Aliases</strong>: mutable pointers like <code>@champion</code> and <code>@challenger</code>. Serving loads <code>models:/fraud@champion</code>; promotion and rollback are just moving the alias. The old fixed stages (Staging/Production) are deprecated in favour of aliases.</li>
</ul>
<pre>import mlflow
from mlflow import MlflowClient
mlflow.set_tracking_uri("https://mlflow.internal")
mlflow.set_experiment("fraud-model")

with mlflow.start_run() as run:
    mlflow.set_tags({"git_sha": GIT_SHA, "data_version": "lakefs://ml/main@a1b2c3"})
    mlflow.log_params({"max_depth": 8, "learning_rate": 0.05, "seed": 42})
    model = train(X_train, y_train)
    mlflow.log_metric("val_auc", 0.931)
    mlflow.sklearn.log_model(model, name="model",
                             registered_model_name="fraud",
                             input_example=X_train[:5])   # also stores the signature

client = MlflowClient()
client.set_registered_model_alias("fraud", "challenger", version=14)
# after the evaluation gate passes:
client.set_registered_model_alias("fraud", "champion", version=14)   # rollback = point back to 13</pre>
<p>Self-hosting MLflow is a small stateless server with two backends: a <strong>backend store</strong> (Postgres/MySQL for runs, params, metrics, registry) and an <strong>artifact store</strong> (S3/GCS/Blob for the heavy files). With <code>--artifacts-destination</code> the server proxies artifact uploads, so clients need no direct bucket credentials.</p>
<blockquote>⚠️ Production tip: the tracking DB grows fast when people log metrics every step. Hundreds of millions of metric rows make the UI crawl. Log per epoch, not per batch, and put a retention job on old experiments.</blockquote>`,
        he: `<p><strong>MLflow</strong> (קוד פתוח, תחת Linux Foundation) הוא הסטנדרט בפועל. Databricks, Azure ML ו-SageMaker מציעים אותו כשירות מנוהל. אוצר המילים שלו:</p>
<ul>
<li><strong>Experiment</strong>: תיקייה של ריצות ("fraud-model").</li>
<li><strong>Run</strong>: הרצת training אחת. רושמת <strong>params</strong> (lr=0.05, max_depth=8), <strong>metrics</strong> לאורך זמן (val_auc לכל epoch), <strong>tags</strong> (git sha, גרסת dataset) ו-<strong>artifacts</strong> (גרפים, קבצי ה-model).</li>
<li><strong>Logged model</strong>: ב-MLflow 3.x ה-model הוא ישות בפני עצמה עם id משלו, שמקושרת ל-run, ל-dataset ולמטריקות ה-evaluation שלו.</li>
<li><strong>Registered model וגרסאות</strong>: model עם שם ("fraud") וגרסאות immutable: 1, 2, 3.</li>
<li><strong>Aliases</strong>: מצביעים שאפשר להזיז, כמו <code>@champion</code> ו-<code>@challenger</code>. ה-serving טוען את <code>models:/fraud@champion</code>; קידום ו-rollback הם פשוט הזזה של ה-alias. ה-stages הקבועים הישנים (Staging/Production) הוצאו משימוש לטובת aliases.</li>
</ul>
<pre>import mlflow
from mlflow import MlflowClient
mlflow.set_tracking_uri("https://mlflow.internal")
mlflow.set_experiment("fraud-model")

with mlflow.start_run() as run:
    mlflow.set_tags({"git_sha": GIT_SHA, "data_version": "lakefs://ml/main@a1b2c3"})
    mlflow.log_params({"max_depth": 8, "learning_rate": 0.05, "seed": 42})
    model = train(X_train, y_train)
    mlflow.log_metric("val_auc", 0.931)
    mlflow.sklearn.log_model(model, name="model",
                             registered_model_name="fraud",
                             input_example=X_train[:5])   # also stores the signature

client = MlflowClient()
client.set_registered_model_alias("fraud", "challenger", version=14)
# after the evaluation gate passes:
client.set_registered_model_alias("fraud", "champion", version=14)   # rollback = point back to 13</pre>
<p>להריץ MLflow בעצמך זה שרת stateless קטן עם שני backends: <strong>backend store</strong> (Postgres או MySQL ל-runs, params, metrics וה-registry) ו-<strong>artifact store</strong> (S3, GCS או Blob לקבצים הכבדים). עם <code>--artifacts-destination</code> השרת עושה proxy להעלאות, כך שה-clients לא צריכים credentials ישירים ל-bucket.</p>
<blockquote>⚠️ Production tip: ה-DB של ה-tracking גדל מהר כשאנשים רושמים metric בכל step. מאות מיליוני שורות של metrics הופכות את ה-UI לזוחל. תרשום לכל epoch, לא לכל batch, ותוסיף job של retention על experiments ישנים.</blockquote>`
      }
    },
    {
      h: { en: "Reproducibility and lineage: pin the data, not just the code", he: "Reproducibility ו-lineage: לנעוץ את הדאטה, לא רק את הקוד" },
      body: {
        en: `<p>"Reproduce model v14" means rebuilding it from the same five things. Each one needs an immutable pointer stored on the run:</p>
<table>
<tr><th>Ingredient</th><th>Immutable pointer</th><th>Tools</th></tr>
<tr><td>Code</td><td>Git commit SHA</td><td>Git, CI tags the run</td></tr>
<tr><td>Data</td><td>Snapshot / commit id, never "the table as it is today"</td><td><strong>DVC</strong> (content hashes in small <code>.dvc</code> files committed to git, data in S3), <strong>lakeFS</strong> (git-like branches and commits over an object store), Iceberg/Delta time travel (snapshot id / version)</td></tr>
<tr><td>Environment</td><td>Container image <strong>digest</strong> (<code>@sha256:...</code>), not a tag; pinned CUDA/cuDNN and library versions</td><td>Docker, conda-lock, uv lockfiles</td></tr>
<tr><td>Config</td><td>Hyperparameters + seeds logged as params</td><td>MLflow, Hydra configs</td></tr>
<tr><td>Hardware</td><td>GPU type and count, driver version</td><td>Logged as tags</td></tr>
</table>
<p>Honest caveat for interviews: bit-for-bit reproducibility on GPUs is hard. Some cuDNN kernels and atomic adds are non-deterministic, and changing the GPU count changes the reduction order. PyTorch has <code>torch.use_deterministic_algorithms(True)</code> at a speed cost. The practical target is <strong>statistical reproducibility</strong> (same metrics within noise) plus <strong>exact lineage</strong> (you know exactly what went in).</p>
<p><strong>Lineage</strong> is the graph: raw table snapshot → feature view version → training dataset → run → model version → deployment. When a data bug is found in partition 2026-10-03, lineage answers "which models in production were trained on it?" in one query instead of a week of archaeology. OpenLineage-style events from the orchestrator plus MLflow's dataset tracking (<code>mlflow.log_input</code>) cover most of it.</p>
<blockquote>💡 Real world: GDPR deletion requests interact with this. If a user's data must be deleted, you need to know which training sets contained it and what your policy is for models already trained on it. Lineage is how you answer the auditor.</blockquote>`,
        he: `<p>"לשחזר את model v14" אומר לבנות אותו מחדש מאותם חמישה דברים. לכל אחד מהם צריך מצביע immutable שנשמר על ה-run:</p>
<table>
<tr><th>רכיב</th><th>מצביע immutable</th><th>כלים</th></tr>
<tr><td>קוד</td><td>Git commit SHA</td><td>Git, וה-CI מתייג את ה-run</td></tr>
<tr><td>דאטה</td><td>Snapshot או commit id, אף פעם לא "הטבלה כמו שהיא היום"</td><td><strong>DVC</strong> (hashes של התוכן בקבצי <code>.dvc</code> קטנים שנכנסים ל-git, הדאטה עצמו ב-S3), <strong>lakeFS</strong> (branches ו-commits בסגנון git מעל object store), time travel של Iceberg או Delta (snapshot id או version)</td></tr>
<tr><td>סביבה</td><td><strong>Digest</strong> של ה-image (<code>@sha256:...</code>), לא tag; גרסאות CUDA, cuDNN וספריות נעוצות</td><td>Docker, conda-lock, lockfiles של uv</td></tr>
<tr><td>Config</td><td>Hyperparameters ו-seeds שנרשמים כ-params</td><td>MLflow, configs של Hydra</td></tr>
<tr><td>חומרה</td><td>סוג GPU וכמות, גרסת driver</td><td>נרשם כ-tags</td></tr>
</table>
<p>הסתייגות כנה לראיון: שחזור ביט-לביט על GPUs זה קשה. חלק מה-kernels של cuDNN ופעולות atomic add לא דטרמיניסטיים, ושינוי במספר ה-GPUs משנה את סדר ה-reduction. ב-PyTorch יש <code>torch.use_deterministic_algorithms(True)</code>, במחיר של מהירות. היעד המעשי הוא <strong>reproducibility סטטיסטי</strong> (אותן מטריקות בתוך הרעש) ועוד <strong>lineage מדויק</strong> (אתה יודע בדיוק מה נכנס).</p>
<p><strong>Lineage</strong> הוא הגרף: snapshot של טבלה גולמית ← גרסת feature view ← training dataset ← run ← גרסת model ← deployment. כשמוצאים באג בדאטה ב-partition של 2026-10-03, ה-lineage עונה על "אילו models בפרודקשן אומנו עליו?" בשאילתה אחת, במקום שבוע של ארכיאולוגיה. אירועים בסגנון OpenLineage מה-orchestrator, יחד עם ה-dataset tracking של MLflow (<code>mlflow.log_input</code>), מכסים את רוב זה.</p>
<blockquote>💡 Real world: בקשות מחיקה לפי GDPR נוגעות בזה ישירות. אם צריך למחוק דאטה של משתמש, אתה חייב לדעת אילו training sets הכילו אותו ומה המדיניות לגבי models שכבר אומנו עליו. Lineage זה מה שאתה מראה למבקר.</blockquote>`
      }
    },
    {
      h: { en: "Team boundary and platform choice", he: "גבול האחריות בין הצוותים ובחירת פלטפורמה" },
      body: {
        en: `<p>A clean split that works: <strong>data scientists own</strong> the training code, features logic, evaluation metrics and the decision "is this model better". <strong>The platform team owns</strong> the paved road: compute (GPU pools, quotas), the orchestrator, tracking server and registry, the serving runtime and autoscaling, monitoring plumbing, cost and security. The contract between them is a <strong>template</strong>: a pipeline skeleton plus a serving spec where the DS fills in the model-specific parts.</p>
<table>
<tr><th></th><th>SageMaker AI</th><th>Vertex AI</th><th>Azure ML</th><th>Databricks</th><th>Self-hosted on K8s</th></tr>
<tr><td>Pipelines</td><td>SageMaker Pipelines</td><td>Vertex AI Pipelines (runs KFP v2 specs)</td><td>Azure ML pipelines</td><td>Lakeflow Jobs (formerly Workflows)</td><td>Kubeflow Pipelines, Argo Workflows, Airflow</td></tr>
<tr><td>Tracking / registry</td><td>Model Registry (model package groups) + managed MLflow</td><td>Vertex Experiments + Model Registry</td><td>MLflow-native workspace tracking + registry</td><td>MLflow with models in Unity Catalog</td><td>MLflow (Postgres + S3)</td></tr>
<tr><td>Features</td><td>SageMaker Feature Store</td><td>Vertex AI Feature Store (BigQuery-backed)</td><td>Managed feature store</td><td>Feature engineering in Unity Catalog + online tables</td><td>Feast</td></tr>
<tr><td>Serving</td><td>Real-time, serverless, async endpoints, batch transform</td><td>Endpoints, batch prediction</td><td>Managed online endpoints (blue/green traffic split), batch endpoints</td><td>Model Serving (serverless)</td><td>KServe, Triton, Ray Serve, BentoML</td></tr>
<tr><td>Monitoring</td><td>Model Monitor, Clarify</td><td>Model Monitoring</td><td>Model monitoring</td><td>Lakehouse Monitoring</td><td>Evidently / Prometheus / your own</td></tr>
<tr><td>Trade-off</td><td colspan="4">Fast start, IAM/VPC integrated, per-instance markup (SageMaker instances cost more than the same EC2), lock-in to the provider's SDK</td><td>Portable and cheaper at scale, but you run ~6 stateful systems and their upgrades</td></tr>
</table>
<blockquote>⚠️ Production tip: the self-hosted stack is not "free". Kubeflow + MLflow + KServe + Feast + a GPU scheduler is a product with on-call. Choose it when you have a platform team of several engineers and many models; otherwise a managed platform plus MLflow is usually cheaper in people-hours.</blockquote>`,
        he: `<p>חלוקה נקייה שעובדת: <strong>ה-data scientists אחראים</strong> על קוד ה-training, הלוגיקה של ה-features, מטריקות ה-evaluation וההחלטה "האם ה-model הזה יותר טוב". <strong>צוות הפלטפורמה אחראי</strong> על הכביש הסלול: compute (pools של GPU, quotas), ה-orchestrator, שרת ה-tracking וה-registry, ה-runtime של ה-serving וה-autoscaling, צנרת הניטור, עלויות ואבטחה. החוזה ביניהם הוא <strong>template</strong>: שלד של pipeline ו-spec ל-serving, שבו ה-DS ממלא את החלקים הספציפיים ל-model.</p>
<table>
<tr><th></th><th>SageMaker AI</th><th>Vertex AI</th><th>Azure ML</th><th>Databricks</th><th>Self-hosted על K8s</th></tr>
<tr><td>Pipelines</td><td>SageMaker Pipelines</td><td>Vertex AI Pipelines (מריץ specs של KFP v2)</td><td>Azure ML pipelines</td><td>Lakeflow Jobs (לשעבר Workflows)</td><td>Kubeflow Pipelines, Argo Workflows, Airflow</td></tr>
<tr><td>Tracking ו-registry</td><td>Model Registry (model package groups) ו-MLflow מנוהל</td><td>Vertex Experiments ו-Model Registry</td><td>Tracking ו-registry מבוססי MLflow ב-workspace</td><td>MLflow עם models ב-Unity Catalog</td><td>MLflow (Postgres ו-S3)</td></tr>
<tr><td>Features</td><td>SageMaker Feature Store</td><td>Vertex AI Feature Store (מעל BigQuery)</td><td>Feature store מנוהל</td><td>Feature engineering ב-Unity Catalog ו-online tables</td><td>Feast</td></tr>
<tr><td>Serving</td><td>Endpoints מסוג real-time, serverless ו-async, ו-batch transform</td><td>Endpoints ו-batch prediction</td><td>Managed online endpoints (חלוקת תעבורה blue/green), batch endpoints</td><td>Model Serving (serverless)</td><td>KServe, Triton, Ray Serve, BentoML</td></tr>
<tr><td>ניטור</td><td>Model Monitor, Clarify</td><td>Model Monitoring</td><td>Model monitoring</td><td>Lakehouse Monitoring</td><td>Evidently, Prometheus או משהו משלך</td></tr>
<tr><td>Trade-off</td><td colspan="4">התחלה מהירה, אינטגרציה ל-IAM ול-VPC, תוספת מחיר לכל instance (instances של SageMaker יקרים יותר מאותו EC2), נעילה ל-SDK של הספק</td><td>נייד וזול יותר ב-scale, אבל אתה מריץ בערך 6 מערכות stateful ואת ה-upgrades שלהן</td></tr>
</table>
<blockquote>⚠️ Production tip: ה-stack ה-self-hosted הוא לא "חינם". Kubeflow, MLflow, KServe, Feast ו-scheduler ל-GPU הם מוצר עם on-call. תבחר בו כשיש לך צוות פלטפורמה של כמה מהנדסים והרבה models; אחרת פלטפורמה מנוהלת עם MLflow בדרך כלל זולה יותר בשעות אדם.</blockquote>`
      }
    }
  ],
  diagram: `  raw data --snapshot--> features --> training run --> evaluation gate
     ^      (lakeFS/DVC)  (Feast)     (MLflow run)     (vs @champion)
     |                                                       |
  retrain trigger                                     registry: fraud v14
     |                                                  alias @champion
  monitor (drift, KPI) <-- serving (KServe/SageMaker) <-- deploy
  lineage: data snapshot -> run id -> model version -> deployment id`,
  handsOn: [
    { cmd: "mlflow server --backend-store-uri postgresql://mlflow:***@pg.internal/mlflow --artifacts-destination s3://ml-artifacts/mlflow --host 0.0.0.0 --port 5000",
      what: { en: "Run a production-style tracking server: Postgres holds runs and the registry, S3 holds artifacts, and the server proxies uploads so clients need no bucket credentials.", he: "מריץ שרת tracking בסגנון פרודקשן: Postgres מחזיק את ה-runs וה-registry, S3 מחזיק את ה-artifacts, והשרת עושה proxy להעלאות כך שה-clients לא צריכים credentials ל-bucket." } },
    { cmd: "python -c \"from mlflow import MlflowClient as C; c=C(); c.set_registered_model_alias('fraud','champion',14); print(c.get_model_version_by_alias('fraud','champion').version)\"",
      what: { en: "Promote version 14 by moving the @champion alias, then read it back. Rollback is the same call with the previous version; serving that loads models:/fraud@champion picks it up on its next reload.", he: "מקדם את גרסה 14 ע\"י הזזת ה-alias @champion, ואז קורא אותו בחזרה. Rollback זו אותה קריאה עם הגרסה הקודמת; serving שטוען את models:/fraud@champion יקלוט את זה בטעינה הבאה." } },
    { cmd: "mlflow models serve -m \"models:/fraud@champion\" -p 5001 --env-manager local",
      what: { en: "Serve the champion locally as a REST endpoint (POST /invocations). Good for smoke-testing a model's signature before it goes to KServe or SageMaker.", he: "מגיש את ה-champion מקומית כ-REST endpoint (POST /invocations). טוב ל-smoke test של ה-signature של ה-model לפני שהוא עולה ל-KServe או ל-SageMaker." } },
    { cmd: "dvc add data/train.parquet && git add data/train.parquet.dvc && git commit -m 'train set 2026-11' && dvc push",
      what: { en: "Version a training set with DVC: git stores a tiny pointer with the content hash, the data goes to the remote (S3). Checking out the commit plus dvc pull restores the exact bytes.", he: "מנהל גרסה ל-training set עם DVC: ה-git שומר מצביע קטן עם hash של התוכן, והדאטה עצמו הולך ל-remote (S3). Checkout ל-commit ועוד dvc pull מחזירים בדיוק את אותם bytes." } },
    { cmd: "lakectl branch create lakefs://ml-data/exp-fraud-v14 --source lakefs://ml-data/main && lakectl commit lakefs://ml-data/exp-fraud-v14 -m 'snapshot for v14'",
      what: { en: "With lakeFS, branch the data lake like a repo (zero-copy), freeze it with a commit and log that commit id on the MLflow run. Training reads s3://ml-data/<commit>/... and is reproducible forever.", he: "עם lakeFS עושים branch ל-data lake כמו ל-repo (בלי העתקה), מקפיאים עם commit ורושמים את ה-commit id על ה-run ב-MLflow. ה-training קורא מ-s3://ml-data/&lt;commit&gt;/... ונשאר שחזיר לתמיד." } }
  ],
  mnemonic: {
    en: "\"Code, Data, Model: version all three, or you can't reproduce any.\" Promote by moving @champion, roll back by moving it back.",
    he: "\"קוד, דאטה, model: תנהל גרסאות לשלושתם, או שלא תשחזר אף אחד.\" מקדמים ע\"י הזזת @champion, ועושים rollback ע\"י החזרה שלו."
  },
  pitfalls: [
    { en: "Training on \"the table as of now\". Two weeks later the table has changed, and the model can never be rebuilt or debugged. Always train from a snapshot id (lakeFS commit, Iceberg snapshot, DVC hash) and log it on the run.", he: "Training על \"הטבלה כמו שהיא עכשיו\". שבועיים אחרי הטבלה כבר השתנתה, ואי אפשר לבנות את ה-model מחדש או לדבג אותו. תמיד תאמן מ-snapshot id (commit של lakeFS, snapshot של Iceberg, hash של DVC) ותרשום אותו על ה-run." },
    { en: "Re-implementing feature logic in the serving service (SQL in training, Java in serving). The two drift apart and you get training/serving skew. Compute features once (feature store or a shared library) and use the same code path in both.", he: "מימוש מחדש של לוגיקת ה-features בתוך שירות ה-serving (SQL ב-training, Java ב-serving). השניים מתרחקים ומקבלים training/serving skew. תחשב features פעם אחת (feature store או ספרייה משותפת) ותשתמש באותו נתיב קוד בשניהם." },
    { en: "Serving \"latest version\" instead of an alias. Every new registration silently goes to production, including the experiment someone registered at 2 am. Serve models:/name@champion and gate the alias move behind evaluation.", he: "Serving של \"הגרסה האחרונה\" במקום alias. כל רישום חדש עולה לפרודקשן בשקט, כולל הניסוי שמישהו רשם ב-2 בלילה. תגיש את models:/name@champion ותשים את הזזת ה-alias מאחורי evaluation." },
    { en: "Monitoring only infra metrics. Latency, errors and CPU stay green while the model degrades. Without prediction-distribution and business-KPI monitoring, the first alert comes from finance.", he: "לנטר רק מטריקות תשתית. ה-latency, השגיאות וה-CPU נשארים ירוקים בזמן שה-model מידרדר. בלי ניטור של התפלגות ה-predictions ושל KPI עסקי, ההתראה הראשונה מגיעה מהכספים." }
  ],
  interview: [
    { q: { en: "A data scientist says \"I can't reproduce last quarter's model\". As the platform owner, what do you put in place?", he: "Data scientist אומר \"אני לא מצליח לשחזר את ה-model מהרבעון הקודם\". בתור בעל הפלטפורמה, מה אתה מקים?" },
      a: { en: "Make every run record immutable pointers for all inputs: git SHA (CI injects it), data snapshot id (lakeFS commit / Iceberg snapshot / DVC hash), container image digest, params and seeds, hardware. Enforce it in the pipeline template so it isn't optional, and refuse registry promotion for runs missing them. Add lineage from data to deployment. Be honest that GPU training is only statistically reproducible unless you enable deterministic algorithms; the goal is the same inputs and metrics within noise.", he: "לגרום לכל run לרשום מצביעים immutable לכל ה-inputs: git SHA (ה-CI מזריק), snapshot id של הדאטה (commit של lakeFS, snapshot של Iceberg או hash של DVC), digest של ה-image, params ו-seeds, וחומרה. לאכוף את זה ב-template של ה-pipeline כדי שזה לא יהיה אופציונלי, ולסרב לקדם ב-registry runs שחסר להם משהו. להוסיף lineage מהדאטה עד ה-deployment. ולהיות כן: training על GPU שחזיר רק סטטיסטית אלא אם מפעילים deterministic algorithms; המטרה היא אותם inputs ומטריקות בתוך הרעש." } },
    { q: { en: "Explain MLOps maturity levels 0, 1 and 2. What's the key difference between 1 and 2?", he: "תסביר את רמות הבשלות 0, 1 ו-2 של MLOps. מה ההבדל המרכזי בין 1 ל-2?" },
      a: { en: "Level 0: manual, notebook to hand-off, rare retraining. Level 1: the training pipeline is automated and runs continuously (scheduled or triggered), with data and model validation, so the model is refreshed without humans. Level 2 adds CI/CD for the pipeline code itself: changes are tested, built and deployed automatically. In 1 you automate producing models; in 2 you automate changing the thing that produces models.", he: "רמה 0: ידני, מ-notebook למסירה, retraining נדיר. רמה 1: ה-pipeline של ה-training אוטומטי ורץ באופן רציף (לפי לוח זמנים או טריגר), עם ולידציה לדאטה ול-model, כך שה-model מתרענן בלי בני אדם. רמה 2 מוסיפה CI/CD לקוד ה-pipeline עצמו: שינויים נבדקים, נבנים ועולים אוטומטית. ב-1 אתה ממכן את ייצור ה-models; ב-2 אתה ממכן את השינוי של מה שמייצר אותם." } },
    { q: { en: "Managed (SageMaker/Vertex) or self-hosted Kubeflow + MLflow + KServe? How do you decide?", he: "מנוהל (SageMaker או Vertex) או self-hosted עם Kubeflow, MLflow ו-KServe? איך מחליטים?" },
      a: { en: "Count models, people and GPU spend. Few models and a small platform team: managed wins on time to value and fewer systems to operate, despite the instance markup and SDK lock-in. Many models, an existing strong K8s platform, multi-cloud or on-prem GPUs, or a big GPU bill where the markup hurts: self-hosted pays off. A common middle path is managed compute plus MLflow as the portable tracking/registry layer.", he: "סופרים models, אנשים והוצאות GPU. מעט models וצוות פלטפורמה קטן: המנוהל מנצח בזמן לערך ובפחות מערכות לתפעל, למרות תוספת המחיר והנעילה ל-SDK. הרבה models, פלטפורמת K8s חזקה שכבר קיימת, multi-cloud או GPUs ב-on-prem, או חשבון GPU גדול שבו התוספת כואבת: self-hosted משתלם. דרך ביניים נפוצה היא compute מנוהל ו-MLflow כשכבת tracking ו-registry ניידת." } }
  ],
  quiz: [
    { q: { en: "Why is an ML model's failure mode described as \"silent\"?", he: "למה אומרים שה-model של ML נכשל \"בשקט\"?" },
      options: [
        { en: "Models never throw exceptions in Python", he: "Models אף פעם לא זורקים exceptions ב-Python" },
        { en: "When inputs drift or a feature breaks, the model still returns confident answers with normal latency, just wrong ones", he: "כשה-inputs זזים או feature נשבר, ה-model עדיין מחזיר תשובות בטוחות עם latency רגיל, פשוט שגויות" },
        { en: "Model servers don't emit logs", he: "שרתי models לא מוציאים לוגים" },
        { en: "Because GPUs suppress errors", he: "כי GPUs מדכאים שגיאות" }
      ], answer: 1,
      explain: { en: "Nothing crashes. Infra dashboards stay green while prediction quality falls, so you need data, prediction and KPI monitoring.", he: "שום דבר לא קורס. דשבורדים של תשתית נשארים ירוקים בזמן שאיכות ה-predictions יורדת, ולכן צריך ניטור של דאטה, predictions ו-KPI." } },
    { q: { en: "In the MLflow registry, how should production serving reference a model?", he: "ב-registry של MLflow, איך ה-serving בפרודקשן צריך להפנות ל-model?" },
      options: [
        { en: "models:/fraud/latest", he: "models:/fraud/latest" },
        { en: "The S3 path of the run's artifact folder", he: "הנתיב ב-S3 של תיקיית ה-artifacts של ה-run" },
        { en: "models:/fraud@champion, an alias moved only after an evaluation gate", he: "models:/fraud@champion, alias שזז רק אחרי שער evaluation" },
        { en: "The notebook that trained it", he: "ה-notebook שאימן אותו" }
      ], answer: 2,
      explain: { en: "Aliases are mutable pointers to immutable versions. Promotion and rollback are alias moves; \"latest\" ships every registration.", he: "Aliases הם מצביעים שזזים לגרסאות immutable. קידום ו-rollback הם הזזת alias; \"latest\" מעלה כל רישום." } },
    { q: { en: "What distinguishes MLOps level 2 from level 1?", he: "מה מבדיל בין רמה 2 לרמה 1 של MLOps?" },
      options: [
        { en: "Level 2 uses GPUs", he: "ברמה 2 משתמשים ב-GPUs" },
        { en: "Level 2 adds CI/CD for the pipeline code itself, not just automated retraining", he: "רמה 2 מוסיפה CI/CD לקוד ה-pipeline עצמו, לא רק retraining אוטומטי" },
        { en: "Level 2 means models are retrained manually but deployed automatically", he: "ברמה 2 מאמנים ידנית אבל עושים deploy אוטומטי" },
        { en: "Level 2 removes the model registry", he: "רמה 2 מוותרת על ה-model registry" }
      ], answer: 1,
      explain: { en: "Level 1 automates continuous training; level 2 automates testing, building and deploying changes to the pipelines.", he: "רמה 1 ממכנת continuous training; רמה 2 ממכנת בדיקה, build ו-deploy של שינויים ב-pipelines." } },
    { q: { en: "Which pointer makes the data side of a training run reproducible?", he: "איזה מצביע הופך את צד הדאטה של ריצת training לשחזיר?" },
      options: [
        { en: "The table name and the date the job ran", he: "שם הטבלה והתאריך שבו ה-job רץ" },
        { en: "A lakeFS commit, Iceberg snapshot id or DVC content hash logged on the run", he: "Commit של lakeFS, snapshot id של Iceberg או hash של DVC שנרשם על ה-run" },
        { en: "The container image tag :latest", he: "ה-tag ‏:latest של ה-image" },
        { en: "The random seed", he: "ה-random seed" }
      ], answer: 1,
      explain: { en: "Only an immutable snapshot identifier pins the bytes. A table name plus date still reads whatever the table holds today.", he: "רק מזהה snapshot שאי אפשר לשנות נועץ את ה-bytes. שם טבלה ותאריך עדיין קוראים את מה שיש בטבלה היום." } }
  ],
  related: ["mlops-training-pipelines", "mlops-serving-monitoring", "ai-llmops", "ai-finetune-vs-rag", "ai-gpu-clusters", "data-lakehouse-formats", "data-quality-observability"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "mlops-training-pipelines",
  track: "ai",
  order: 21,
  icon: "🏭",
  level: 3,
  minutes: 16,
  title: { en: "Training Pipelines, Feature Stores and Data on Kubernetes", he: "תשתית האימון: training pipelines, feature stores ודאטה על Kubernetes" },
  tldr: {
    en: "A training platform is four problems: orchestrate the steps (KFP, Argo, Airflow), serve the same features to training and inference (a feature store with point-in-time joins), schedule distributed GPU jobs all-or-nothing and survive interruptions (Kueue + checkpoints), and feed the GPUs fast enough that they aren't idle waiting on S3.",
    he: "פלטפורמת training היא ארבע בעיות: לתזמר את השלבים (KFP, Argo, Airflow), להגיש את אותם features ל-training ול-inference (feature store עם point-in-time joins), לתזמן jobs מבוזרים של GPU בשיטת הכל-או-כלום ולשרוד הפרעות (Kueue ו-checkpoints), ולהזין את ה-GPUs מספיק מהר כדי שהם לא יעמדו ויחכו ל-S3."
  },
  analogy: {
    en: "Think of a commercial kitchen. The pipeline is the order ticket that moves from station to station. The feature store is the prep station: every cook gets onions chopped the same way, whether for tonight's service or for testing a new dish. Gang scheduling is the rule that you don't start a banquet until every burner is free. And data loading is the runner bringing ingredients: the best chef in the world stands idle if the runner is slow.",
    he: "תחשוב על מטבח של מסעדה. ה-pipeline הוא פתק ההזמנה שעובר מעמדה לעמדה. ה-feature store הוא עמדת ההכנות: כל טבח מקבל בצל קצוץ באותה צורה, גם לשירות של הערב וגם לניסוי של מנה חדשה. Gang scheduling הוא הכלל שלא מתחילים אירוע עד שכל הכיריים פנויות. וטעינת הדאטה היא הרץ שמביא מצרכים: השף הכי טוב בעולם עומד בטל אם הרץ איטי."
  },
  sections: [
    {
      h: { en: "Orchestrators: which one for which job", he: "Orchestrators: מה מתאים למה" },
      body: {
        en: `<table>
<tr><th>Orchestrator</th><th>Model</th><th>Strengths</th><th>Watch out</th></tr>
<tr><td><strong>Kubeflow Pipelines (KFP v2)</strong></td><td>Python DSL compiled to an IR YAML; each step is a container (Pod) on K8s</td><td>ML-native: typed artifacts, step caching, lineage in ML Metadata; the same spec runs on Vertex AI Pipelines</td><td>Running full Kubeflow is heavy; you can install KFP standalone</td></tr>
<tr><td><strong>Argo Workflows</strong></td><td>K8s CRD, DAG or steps in YAML</td><td>Generic, very scalable, great for platform teams already on Argo CD</td><td>No ML concepts (artifacts are files); DS often dislike YAML</td></tr>
<tr><td><strong>Airflow</strong> (3.x)</td><td>Python DAGs, scheduler + workers; <code>KubernetesPodOperator</code> for heavy steps</td><td>Most teams already run it for ETL; one place for data + training schedules</td><td>Not built for passing large artifacts between tasks; use object storage paths</td></tr>
<tr><td><strong>SageMaker Pipelines</strong></td><td>Python SDK → JSON definition, managed</td><td>No infra, native steps for training, processing, register, condition</td><td>AWS only, debugging is slower</td></tr>
<tr><td><strong>Metaflow</strong></td><td>Python flow classes; <code>@kubernetes</code> / <code>@batch</code> decorators push steps to compute</td><td>The friendliest DS experience; versions every artifact automatically</td><td>Needs a scheduler underneath for production (Argo Workflows, Step Functions, Airflow)</td></tr>
</table>
<p>A KFP v2 pipeline. Every component runs as its own Pod, outputs are typed artifacts stored in object storage, and unchanged steps are served from cache:</p>
<pre>from kfp import dsl, compiler

@dsl.component(base_image="registry.internal/ml/train:1.8@sha256:3f1c...")
def build_dataset(snapshot: str, out: dsl.Output[dsl.Dataset]):
    ...  # read lakefs://ml-data/&lt;snapshot&gt;, join features, write parquet to out.path

@dsl.component(base_image="registry.internal/ml/train:1.8@sha256:3f1c...")
def train(data: dsl.Input[dsl.Dataset], model: dsl.Output[dsl.Model], lr: float) -&gt; float:
    ...  # train, log to MLflow, return val_auc

@dsl.component(base_image="python:3.12-slim", packages_to_install=["mlflow==3.*"])
def register(model: dsl.Input[dsl.Model], auc: float, threshold: float):
    if auc &lt; threshold:
        raise RuntimeError(f"val_auc {auc} below gate {threshold}")
    ...  # register version, set @challenger

@dsl.pipeline(name="fraud-train")
def fraud_train(snapshot: str, lr: float = 0.05):
    ds = build_dataset(snapshot=snapshot)
    t = train(data=ds.outputs["out"], lr=lr)
    t.set_accelerator_type("nvidia.com/gpu").set_accelerator_limit(1)
    t.set_memory_limit("32G")
    register(model=t.outputs["model"], auc=t.outputs["Output"], threshold=0.92)

compiler.Compiler().compile(fraud_train, "fraud_train.yaml")</pre>
<blockquote>💡 Real world: pick the orchestrator your data team already runs, then add ML pieces around it. Two schedulers (one for ETL, one for training) means two places where "did yesterday's data land?" has to be answered.</blockquote>`,
        he: `<table>
<tr><th>Orchestrator</th><th>מודל עבודה</th><th>חוזקות</th><th>שים לב</th></tr>
<tr><td><strong>Kubeflow Pipelines (KFP v2)</strong></td><td>DSL ב-Python שמתקמפל ל-YAML של IR; כל שלב הוא container (Pod) על K8s</td><td>מותאם ל-ML: artifacts עם טיפוסים, caching לשלבים, lineage ב-ML Metadata; אותו spec רץ גם על Vertex AI Pipelines</td><td>להריץ Kubeflow מלא זה כבד; אפשר להתקין KFP לבד</td></tr>
<tr><td><strong>Argo Workflows</strong></td><td>CRD של K8s, DAG או steps ב-YAML</td><td>גנרי, סקיילבילי מאוד, מעולה לצוותי פלטפורמה שכבר עובדים עם Argo CD</td><td>אין מושגים של ML (artifacts הם קבצים); DS בדרך כלל לא אוהבים YAML</td></tr>
<tr><td><strong>Airflow</strong> (3.x)</td><td>DAGs ב-Python, scheduler ו-workers; <code>KubernetesPodOperator</code> לשלבים כבדים</td><td>לרוב הצוותים זה כבר רץ ל-ETL; מקום אחד ללוחות הזמנים של דאטה ושל training</td><td>לא נבנה להעברת artifacts גדולים בין tasks; תעביר נתיבים ב-object storage</td></tr>
<tr><td><strong>SageMaker Pipelines</strong></td><td>SDK של Python שמייצר הגדרת JSON, מנוהל</td><td>בלי תשתית, שלבים מובנים ל-training, processing, register ו-condition</td><td>רק AWS, דיבוג איטי יותר</td></tr>
<tr><td><strong>Metaflow</strong></td><td>מחלקות flow ב-Python; decorators כמו <code>@kubernetes</code> או <code>@batch</code> שולחים שלבים ל-compute</td><td>החוויה הכי ידידותית ל-DS; מנהל גרסה לכל artifact אוטומטית</td><td>בפרודקשן צריך scheduler מתחת (Argo Workflows, Step Functions, Airflow)</td></tr>
</table>
<p>Pipeline של KFP v2. כל component רץ ב-Pod משלו, ה-outputs הם artifacts עם טיפוס שנשמרים ב-object storage, ושלבים שלא השתנו מוגשים מה-cache:</p>
<pre>from kfp import dsl, compiler

@dsl.component(base_image="registry.internal/ml/train:1.8@sha256:3f1c...")
def build_dataset(snapshot: str, out: dsl.Output[dsl.Dataset]):
    ...  # read lakefs://ml-data/&lt;snapshot&gt;, join features, write parquet to out.path

@dsl.component(base_image="registry.internal/ml/train:1.8@sha256:3f1c...")
def train(data: dsl.Input[dsl.Dataset], model: dsl.Output[dsl.Model], lr: float) -&gt; float:
    ...  # train, log to MLflow, return val_auc

@dsl.component(base_image="python:3.12-slim", packages_to_install=["mlflow==3.*"])
def register(model: dsl.Input[dsl.Model], auc: float, threshold: float):
    if auc &lt; threshold:
        raise RuntimeError(f"val_auc {auc} below gate {threshold}")
    ...  # register version, set @challenger

@dsl.pipeline(name="fraud-train")
def fraud_train(snapshot: str, lr: float = 0.05):
    ds = build_dataset(snapshot=snapshot)
    t = train(data=ds.outputs["out"], lr=lr)
    t.set_accelerator_type("nvidia.com/gpu").set_accelerator_limit(1)
    t.set_memory_limit("32G")
    register(model=t.outputs["model"], auc=t.outputs["Output"], threshold=0.92)

compiler.Compiler().compile(fraud_train, "fraud_train.yaml")</pre>
<blockquote>💡 Real world: תבחר את ה-orchestrator שצוות הדאטה כבר מריץ, ותוסיף סביבו את החלקים של ML. שני schedulers (אחד ל-ETL ואחד ל-training) זה שני מקומות שבהם צריך לענות על "הדאטה של אתמול הגיע?".</blockquote>`
      }
    },
    {
      h: { en: "Feature stores: offline vs online, and point-in-time correctness", he: "Feature stores: offline מול online, ונכונות point-in-time" },
      body: {
        en: `<p>A feature store (Feast as the open-source reference; SageMaker, Vertex and Databricks have managed ones) gives one definition of a feature and two ways to read it:</p>
<table>
<tr><th></th><th>Offline store</th><th>Online store</th></tr>
<tr><td>Backed by</td><td>Warehouse / lake: BigQuery, Snowflake, Redshift, Spark, Parquet on S3</td><td>Key-value: Redis, DynamoDB, Bigtable, Postgres</td></tr>
<tr><td>Holds</td><td>Full history of every feature value with timestamps</td><td>Only the latest value per entity key</td></tr>
<tr><td>Used by</td><td>Training: build a dataset of millions of rows</td><td>Inference: fetch features for one user in a few ms</td></tr>
<tr><td>Filled by</td><td>Batch/stream pipelines</td><td><strong>Materialization</strong> from offline (or direct stream push)</td></tr>
</table>
<p><strong>Point-in-time correct joins</strong> are the key idea. A training row says "transaction at 2026-10-03 14:02, label = fraud". The features joined to it must be the values <em>as they were at 14:02</em>, not today's values. If you join today's <code>user_txn_count_7d</code>, information from the future leaks into training (the 7-day count now includes the fraud spree that followed), offline AUC looks amazing, and production collapses. Feast's <code>get_historical_features</code> does an "as of" join: for each entity row, take the latest feature value with timestamp ≤ the event timestamp (and within the TTL).</p>
<pre>from feast import FeatureStore
store = FeatureStore(repo_path=".")

# Training: point-in-time join against the offline store
training_df = store.get_historical_features(
    entity_df=labels_df,     # columns: user_id, event_timestamp, label
    features=["user_stats:txn_count_7d", "user_stats:avg_amount_30d"],
).to_df()

# Serving: same feature names, latest values from the online store
feats = store.get_online_features(
    features=["user_stats:txn_count_7d", "user_stats:avg_amount_30d"],
    entity_rows=[{"user_id": 1842}],
).to_dict()</pre>
<p><strong>Training/serving skew</strong> is any difference between what the model saw in training and what it sees in production: different code computing a feature, a stale online store (materialization job failed three days ago), different null handling, or different units. A feature store removes the "two implementations" cause, not the others. You still need freshness alerts on materialization and a skew check (compare online feature distributions with the training set).</p>`,
        he: `<p>Feature store (Feast הוא הייחוס בקוד פתוח; ל-SageMaker, Vertex ו-Databricks יש מנוהלים) נותן הגדרה אחת ל-feature ושתי דרכים לקרוא אותו:</p>
<table>
<tr><th></th><th>Offline store</th><th>Online store</th></tr>
<tr><td>מאחוריו</td><td>Warehouse או lake: BigQuery, Snowflake, Redshift, Spark, Parquet על S3</td><td>Key-value: Redis, DynamoDB, Bigtable, Postgres</td></tr>
<tr><td>מה הוא מחזיק</td><td>את כל ההיסטוריה של כל ערך feature עם timestamps</td><td>רק את הערך האחרון לכל entity key</td></tr>
<tr><td>מי משתמש</td><td>Training: בניית dataset של מיליוני שורות</td><td>Inference: שליפת features למשתמש אחד בכמה ms</td></tr>
<tr><td>איך מתמלא</td><td>Pipelines של batch או stream</td><td><strong>Materialization</strong> מה-offline (או push ישיר מ-stream)</td></tr>
</table>
<p>הרעיון המרכזי הוא <strong>point-in-time correct joins</strong>. שורת training אומרת "עסקה ב-2026-10-03 14:02, label = fraud". ה-features שמצורפים אליה חייבים להיות הערכים <em>כפי שהיו ב-14:02</em>, לא הערכים של היום. אם תצרף את <code>user_txn_count_7d</code> של היום, מידע מהעתיד דולף ל-training (הספירה של 7 הימים כוללת עכשיו את גל ההונאות שבא אחרי), ה-AUC ב-offline נראה מדהים, והפרודקשן קורס. ה-<code>get_historical_features</code> של Feast עושה join מסוג "as of": לכל שורת entity לוקחים את ערך ה-feature האחרון עם timestamp שקטן או שווה ל-timestamp של האירוע (ובתוך ה-TTL).</p>
<pre>from feast import FeatureStore
store = FeatureStore(repo_path=".")

# Training: point-in-time join against the offline store
training_df = store.get_historical_features(
    entity_df=labels_df,     # columns: user_id, event_timestamp, label
    features=["user_stats:txn_count_7d", "user_stats:avg_amount_30d"],
).to_df()

# Serving: same feature names, latest values from the online store
feats = store.get_online_features(
    features=["user_stats:txn_count_7d", "user_stats:avg_amount_30d"],
    entity_rows=[{"user_id": 1842}],
).to_dict()</pre>
<p><strong>Training/serving skew</strong> הוא כל הבדל בין מה שה-model ראה ב-training לבין מה שהוא רואה בפרודקשן: קוד אחר שמחשב feature, online store לא מעודכן (ה-job של ה-materialization נכשל לפני שלושה ימים), טיפול שונה ב-null, או יחידות שונות. Feature store מעלים את הסיבה של "שני מימושים", לא את האחרות. עדיין צריך התראות freshness על ה-materialization ובדיקת skew (השוואה בין ההתפלגויות של ה-features ב-online לבין ה-training set).</p>`
      }
    },
    {
      h: { en: "Distributed training on Kubernetes: operators, gangs, checkpoints", he: "Training מבוזר על Kubernetes: operators, gangs ו-checkpoints" },
      body: {
        en: `<p>Three building blocks, usually combined:</p>
<ul>
<li><strong>Kubeflow Training Operator</strong> (v1: <code>PyTorchJob</code>, <code>TFJob</code>, <code>MPIJob</code>) creates master/worker Pods and injects <code>MASTER_ADDR</code>, <code>WORLD_SIZE</code>, <code>RANK</code>. Its successor <strong>Kubeflow Trainer v2</strong> uses a single <code>TrainJob</code> plus reusable <code>TrainingRuntime</code> templates (torchrun, DeepSpeed, MLX) so DS write less YAML.</li>
<li><strong>Ray on KubeRay</strong> (<code>RayCluster</code>, <code>RayJob</code>, <code>RayService</code>): one Python framework for data preprocessing (Ray Data), distributed training (Ray Train), tuning (Ray Tune) and serving. Strong when the pipeline is Python-heavy and needs CPU preprocessing feeding GPU training.</li>
<li><strong>A queue with gang admission</strong>: <strong>Kueue</strong> (or Volcano). A 16-GPU job that gets 12 GPUs just holds them and waits forever; two such jobs deadlock the cluster. Kueue admits a workload only when its whole quota fits, and handles quotas, borrowing between teams and preemption. Details in <code>ai-gpu-clusters</code>.</li>
</ul>
<pre>apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: fraud-ddp
  namespace: team-risk
  labels:
    kueue.x-k8s.io/queue-name: risk-gpu        # Kueue LocalQueue: admitted all-or-nothing
spec:
  runPolicy:
    backoffLimit: 6                            # restart after node/spot loss
  pytorchReplicaSpecs:
    Worker:
      replicas: 4
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: registry.internal/ml/train:1.8@sha256:3f1c...
            args: ["--ckpt-dir", "s3://ml-ckpt/fraud-ddp/", "--resume", "latest"]
            resources:
              limits: { nvidia.com/gpu: 8 }
          tolerations:
          - { key: nvidia.com/gpu, operator: Exists, effect: NoSchedule }</pre>
<p><strong>Checkpointing is your interruption insurance.</strong> Spot GPUs are commonly 60-90% cheaper, but AWS gives a 2-minute interruption notice and GCP/Azure about 30 seconds. Write checkpoints (model + optimizer state + data loader position + RNG state) to S3 every N minutes, write to a temp key then rename/commit so a half-written checkpoint is never "latest", and make the entrypoint resume automatically. The rule of thumb: checkpoint interval should be much shorter than the mean time between interruptions, and checkpoint write time should be a small fraction of the interval (async/sharded checkpointing helps for large models). SageMaker managed spot training does this pattern for you with <code>checkpoint_s3_uri</code> and <code>max_wait</code>.</p>`,
        he: `<p>שלוש אבני בניין, ובדרך כלל משלבים ביניהן:</p>
<ul>
<li><strong>Kubeflow Training Operator</strong> (v1: <code>PyTorchJob</code>, <code>TFJob</code>, <code>MPIJob</code>) יוצר Pods של master ו-workers ומזריק <code>MASTER_ADDR</code>, <code>WORLD_SIZE</code> ו-<code>RANK</code>. היורש שלו, <strong>Kubeflow Trainer v2</strong>, משתמש ב-<code>TrainJob</code> אחד ועוד templates של <code>TrainingRuntime</code> שאפשר למחזר (torchrun, DeepSpeed, MLX), כך ש-DS כותבים פחות YAML.</li>
<li><strong>Ray על KubeRay</strong> (<code>RayCluster</code>, <code>RayJob</code>, <code>RayService</code>): framework אחד ב-Python ל-preprocessing של דאטה (Ray Data), training מבוזר (Ray Train), tuning (Ray Tune) ו-serving. חזק כשה-pipeline כבד ב-Python וצריך preprocessing על CPU שמזין training על GPU.</li>
<li><strong>תור עם admission של gang</strong>: <strong>Kueue</strong> (או Volcano). Job של 16 GPUs שמקבל 12 פשוט מחזיק אותם ומחכה לנצח; שני jobs כאלה תוקעים את ה-cluster. Kueue מכניס workload רק כשכל ה-quota שלו נכנסת, ומטפל ב-quotas, בהשאלה בין צוותים וב-preemption. פרטים ב-<code>ai-gpu-clusters</code>.</li>
</ul>
<pre>apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: fraud-ddp
  namespace: team-risk
  labels:
    kueue.x-k8s.io/queue-name: risk-gpu        # Kueue LocalQueue: admitted all-or-nothing
spec:
  runPolicy:
    backoffLimit: 6                            # restart after node/spot loss
  pytorchReplicaSpecs:
    Worker:
      replicas: 4
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: registry.internal/ml/train:1.8@sha256:3f1c...
            args: ["--ckpt-dir", "s3://ml-ckpt/fraud-ddp/", "--resume", "latest"]
            resources:
              limits: { nvidia.com/gpu: 8 }
          tolerations:
          - { key: nvidia.com/gpu, operator: Exists, effect: NoSchedule }</pre>
<p><strong>Checkpointing הוא ביטוח ההפרעות שלך.</strong> GPUs של spot זולים בדרך כלל ב-60-90%, אבל AWS נותנים התראה של 2 דקות לפני interruption, ו-GCP ו-Azure בערך 30 שניות. תכתוב checkpoints (ה-model, ה-state של ה-optimizer, המיקום של ה-data loader וה-state של ה-RNG) ל-S3 כל N דקות. תכתוב קודם ל-key זמני ורק אז תעשה rename או commit, כדי ש-checkpoint חצי כתוב אף פעם לא יהיה "latest", ותגרום ל-entrypoint לעשות resume לבד. כלל אצבע: המרווח בין checkpoints צריך להיות קצר בהרבה מהזמן הממוצע בין הפרעות, וזמן הכתיבה צריך להיות חלק קטן מהמרווח (checkpointing אסינכרוני או מפוצל עוזר ב-models גדולים). ב-SageMaker, managed spot training עושה את הדפוס הזה בשבילך עם <code>checkpoint_s3_uri</code> ו-<code>max_wait</code>.</p>`
      }
    },
    {
      h: { en: "Data loading: don't let S3 starve the GPUs", he: "טעינת דאטה: אל תיתן ל-S3 להרעיב את ה-GPUs" },
      body: {
        en: `<p>A common, expensive bug: <code>nvidia-smi</code> shows GPU utilization bouncing between 0% and 100%, averaging 35%. The GPUs are waiting for data. Eight GPUs at full speed on image data can consume several GB/s; a naive loader doing one S3 GET per small file gets nowhere near that.</p>
<table>
<tr><th>Cause</th><th>Fix</th></tr>
<tr><td>Millions of small files, one GET each (tens of ms of latency per request)</td><td>Pack into shards of ~100 MB-1 GB (WebDataset tar, Parquet, TFRecord, MosaicML MDS) and read sequentially</td></tr>
<tr><td>S3 request rate limits: 5,500 GET/s per prefix</td><td>Spread objects across prefixes; larger objects = fewer requests</td></tr>
<tr><td>CPU-bound decoding/augmentation</td><td>More <code>DataLoader</code> workers (<code>num_workers</code>), <code>pin_memory=True</code>, GPU decoding (NVIDIA DALI), or preprocess once offline</td></tr>
<tr><td>Every epoch re-downloads the dataset</td><td>Cache on local NVMe (instance store) after epoch 1, or use a shared file system</td></tr>
<tr><td>Many nodes reading the same data</td><td><strong>FSx for Lustre</strong> linked to the S3 bucket (lazy-loads objects, hundreds of GB/s aggregate; persistent throughput tiers of 125-1000 MB/s per TiB), or Mountpoint for S3 / its CSI driver for simple sequential reads</td></tr>
</table>
<p>Measure before buying: compare step time with a synthetic in-memory dataset against the real loader. If synthetic is 2x faster, the bottleneck is input, not the GPU, and a bigger GPU won't help.</p>
<blockquote>⚠️ Production tip: watch <code>DCGM_FI_PROF_GR_ENGINE_ACTIVE</code> (or <code>DCGM_FI_DEV_GPU_UTIL</code>) from dcgm-exporter per job. A training job averaging under 50% is a data-loading ticket, not a "need more GPUs" ticket.</blockquote>`,
        he: `<p>באג נפוץ ויקר: <code>nvidia-smi</code> מראה GPU utilization שקופץ בין 0% ל-100%, ובממוצע 35%. ה-GPUs מחכים לדאטה. שמונה GPUs במהירות מלאה על דאטה של תמונות יכולים לצרוך כמה GB בשנייה; loader נאיבי שעושה GET אחד ל-S3 על כל קובץ קטן לא מתקרב לזה.</p>
<table>
<tr><th>סיבה</th><th>פתרון</th></tr>
<tr><td>מיליוני קבצים קטנים, GET לכל אחד (עשרות ms של latency לבקשה)</td><td>לארוז ל-shards של בערך 100 MB עד 1 GB (tar של WebDataset, Parquet, TFRecord, MDS של MosaicML) ולקרוא ברצף</td></tr>
<tr><td>מגבלות קצב בקשות ב-S3: 5,500 GET בשנייה לכל prefix</td><td>לפזר objects על כמה prefixes; objects גדולים יותר = פחות בקשות</td></tr>
<tr><td>Decoding או augmentation שחסומים על CPU</td><td>יותר workers ל-<code>DataLoader</code> (<code>num_workers</code>), <code>pin_memory=True</code>, decoding על GPU (NVIDIA DALI), או preprocessing חד-פעמי מראש</td></tr>
<tr><td>כל epoch מוריד את ה-dataset מחדש</td><td>Cache על NVMe מקומי (instance store) אחרי ה-epoch הראשון, או file system משותף</td></tr>
<tr><td>הרבה nodes קוראים את אותו דאטה</td><td><strong>FSx for Lustre</strong> מקושר ל-bucket ב-S3 (טוען objects בעצלות, מאות GB בשנייה במצטבר; tiers של throughput ב-persistent בין 125 ל-1000 MB בשנייה לכל TiB), או Mountpoint for S3 וה-CSI driver שלו לקריאות רציפות פשוטות</td></tr>
</table>
<p>תמדוד לפני שאתה קונה: תשווה את זמן ה-step עם dataset סינתטי בזיכרון מול ה-loader האמיתי. אם הסינתטי מהיר פי 2, צוואר הבקבוק הוא ה-input ולא ה-GPU, ו-GPU גדול יותר לא יעזור.</p>
<blockquote>⚠️ Production tip: תעקוב אחרי <code>DCGM_FI_PROF_GR_ENGINE_ACTIVE</code> (או <code>DCGM_FI_DEV_GPU_UTIL</code>) מ-dcgm-exporter לכל job. Job של training שממוצע מתחת ל-50% הוא ticket של טעינת דאטה, לא ticket של "צריך עוד GPUs".</blockquote>`
      }
    },
    {
      h: { en: "Cost control: spot, quotas and idle GPU hunting", he: "בקרת עלויות: spot, quotas וציד GPUs בטלים" },
      body: {
        en: `<p>GPU spend is usually the biggest line in an ML platform bill. The levers, in order of impact:</p>
<ol>
<li><strong>Kill idle GPUs.</strong> The top waste is notebooks and dev Pods holding a GPU at 0% for days. Cull idle Jupyter kernels (e.g. after 1-2 hours), alert on any Pod with a GPU at under 5% activity for 2+ hours, and give dev work fractional GPUs (MIG slices or time-slicing).</li>
<li><strong>Spot for training</strong>, on-demand or reserved for serving. Only with automatic resume from checkpoints. Mix instance types and AZs to reduce simultaneous interruptions.</li>
<li><strong>Quotas per team</strong> with Kueue <code>ClusterQueue</code> nominal quotas plus borrowing: teams get a guaranteed share and can borrow idle capacity, which is reclaimed by preemption when the owner needs it.</li>
<li><strong>Right-size</strong>: a small tabular model does not need an 8-GPU node; many gradient-boosting jobs are CPU jobs.</li>
<li><strong>Cache pipeline steps</strong> (KFP caching) so a failed step 5 doesn't rerun steps 1-4.</li>
<li><strong>Showback</strong>: label every Pod with team and project, and publish a weekly GPU-hours report per team. Visibility alone changes behaviour.</li>
</ol>
<pre># Prometheus: GPUs allocated but basically idle for 2 hours (dcgm-exporter)
avg_over_time(DCGM_FI_DEV_GPU_UTIL[2h]) &lt; 5
  and on (Hostname, gpu) DCGM_FI_DEV_FB_USED &gt; 0</pre>`,
        he: `<p>הוצאות GPU הן בדרך כלל השורה הכי גדולה בחשבון של פלטפורמת ML. המנופים, לפי סדר ההשפעה:</p>
<ol>
<li><strong>להרוג GPUs בטלים.</strong> הבזבוז הכי גדול הוא notebooks ו-Pods של dev שמחזיקים GPU על 0% במשך ימים. תסגור kernels של Jupyter שעומדים בטלים (למשל אחרי שעה-שעתיים), תתריע על כל Pod עם GPU בפעילות מתחת ל-5% במשך שעתיים ומעלה, ותיתן לעבודת dev חלקי GPU (פרוסות MIG או time-slicing).</li>
<li><strong>Spot ל-training</strong>, ו-on-demand או reserved ל-serving. רק עם resume אוטומטי מ-checkpoints. תערבב instance types ו-AZs כדי לצמצם הפרעות בו-זמניות.</li>
<li><strong>Quotas לכל צוות</strong> עם nominal quotas ב-<code>ClusterQueue</code> של Kueue ועוד השאלה: לכל צוות יש נתח מובטח, והוא יכול לשאול קיבולת פנויה שחוזרת אליו דרך preemption כשהבעלים צריך אותה.</li>
<li><strong>Right-sizing</strong>: model טבלאי קטן לא צריך node של 8 GPUs; הרבה jobs של gradient boosting הם בכלל jobs של CPU.</li>
<li><strong>Cache לשלבי pipeline</strong> (ה-caching של KFP), כדי ששלב 5 שנכשל לא יריץ מחדש את שלבים 1 עד 4.</li>
<li><strong>Showback</strong>: לתייג כל Pod עם צוות ופרויקט, ולפרסם דוח שבועי של שעות GPU לכל צוות. הנראות לבדה משנה התנהגות.</li>
</ol>
<pre># Prometheus: GPUs allocated but basically idle for 2 hours (dcgm-exporter)
avg_over_time(DCGM_FI_DEV_GPU_UTIL[2h]) &lt; 5
  and on (Hostname, gpu) DCGM_FI_DEV_FB_USED &gt; 0</pre>`
      }
    }
  ],
  diagram: `  Airflow/KFP DAG:  snapshot -> build_dataset -> train (PyTorchJob) -> evaluate -> register @challenger
                                   |                  |
                  Feast offline (point-in-time)    Kueue: admit 4x8 GPUs all-or-nothing
                                                      |
                     S3 shards -> FSx/NVMe cache -> GPUs     checkpoint -> s3://ml-ckpt (every N min)
  Feast online (Redis) <- materialize <- offline store         spot interruption -> requeue -> resume`,
  handsOn: [
    { cmd: "kfp run create --experiment-name fraud --package-file fraud_train.yaml snapshot=a1b2c3 lr=0.05",
      what: { en: "Submit the compiled KFP v2 pipeline with parameters. Re-run with the same snapshot and watch unchanged steps come back from cache.", he: "שולח את ה-pipeline המקומפל של KFP v2 עם פרמטרים. תריץ שוב עם אותו snapshot ותראה שלבים שלא השתנו חוזרים מה-cache." } },
    { cmd: "feast apply && feast materialize-incremental $(date -u +%Y-%m-%dT%H:%M:%S)",
      what: { en: "Register feature definitions, then load the latest feature values from the offline store into the online store. If this job stops running, serving silently uses stale features.", he: "רושם את הגדרות ה-features, ואז טוען את הערכים האחרונים מה-offline store ל-online store. אם ה-job הזה מפסיק לרוץ, ה-serving משתמש בשקט ב-features ישנים." } },
    { cmd: "kubectl get workloads -n team-risk && kubectl get clusterqueue risk-gpu-cq -o jsonpath='{.status.flavorsUsage}'",
      what: { en: "See which training jobs Kueue admitted or left pending and how much of the team's GPU quota is in use (including borrowed capacity).", he: "רואה אילו jobs של training ה-Kueue הכניס ואילו נשארו pending, וכמה מה-quota של GPU של הצוות בשימוש (כולל קיבולת מושאלת)." } },
    { cmd: "kubectl exec -n team-risk fraud-ddp-worker-0 -- nvidia-smi dmon -s u -c 30",
      what: { en: "Sample SM utilization for 30 seconds. A saw-tooth between 0 and 100 means the GPU is waiting on the data loader, not compute-bound.", he: "דוגם את ניצולת ה-SM במשך 30 שניות. שיני מסור בין 0 ל-100 אומרות שה-GPU מחכה ל-data loader ולא חסום על compute." } },
    { cmd: "aws sagemaker describe-training-job --training-job-name fraud-2026-11-17 --query '{s:TrainingJobStatus,billable:BillableTimeInSeconds,total:TrainingTimeInSeconds}'",
      what: { en: "For SageMaker managed spot training, compare billable vs total seconds to see the actual spot savings for the job.", he: "ב-managed spot training של SageMaker, משווה בין השניות שחויבו לסך השניות כדי לראות כמה ה-spot חסך בפועל ל-job." } }
  ],
  mnemonic: {
    en: "\"Orchestrate, As-of, Gang, Feed\": steps in a DAG, features joined as-of the event, GPUs admitted as a gang, and data fed fast enough to keep them busy.",
    he: "\"לתזמר, as-of, gang, להזין\": שלבים ב-DAG, features שמצורפים נכון לרגע האירוע, GPUs שנכנסים כ-gang, ודאטה שמוזן מספיק מהר כדי שיהיו עסוקים."
  },
  pitfalls: [
    { en: "Joining features by entity key only, without the event timestamp. Future values leak into training, offline metrics look great, production underperforms. Always build training sets with a point-in-time (as-of) join.", he: "Join ל-features רק לפי ה-entity key, בלי ה-timestamp של האירוע. ערכים מהעתיד דולפים ל-training, המטריקות ב-offline נראות מעולה, והפרודקשן מאכזב. תמיד תבנה training sets עם join מסוג point-in-time (as-of)." },
    { en: "Running distributed jobs without gang admission. Two half-scheduled 16-GPU jobs each hold 12 GPUs and wait forever. Put training behind Kueue or Volcano.", he: "להריץ jobs מבוזרים בלי admission של gang. שני jobs של 16 GPUs שתוזמנו חלקית מחזיקים כל אחד 12 GPUs ומחכים לנצח. תשים את ה-training מאחורי Kueue או Volcano." },
    { en: "Using spot for training without tested resume. The job restarts from step 0 after every interruption and costs more than on-demand. Test resume by killing a worker on purpose.", he: "להשתמש ב-spot ל-training בלי resume שנבדק. ה-job מתחיל מ-step 0 אחרי כל הפרעה ועולה יותר מ-on-demand. תבדוק resume ע\"י הריגה מכוונת של worker." },
    { en: "Buying bigger GPUs for a job that is input-bound. If utilization saw-tooths, fix sharding, workers and caching first.", he: "לקנות GPUs גדולים יותר ל-job שחסום על input. אם הניצולת נראית כמו שיני מסור, קודם תתקן sharding, workers ו-caching." }
  ],
  interview: [
    { q: { en: "What is a point-in-time correct join, and what happens without it?", he: "מה זה point-in-time correct join, ומה קורה בלעדיו?" },
      a: { en: "For each labeled event (entity, timestamp) you join the feature values that were valid at that timestamp: the latest value with ts ≤ event ts, within a TTL. Without it you join current values, which include information from after the event (label leakage). Offline metrics are inflated, the model learns signals that don't exist at prediction time, and it underperforms in production. Feature stores do this as-of join in get_historical_features; in SQL it's a window/ASOF JOIN.", he: "לכל אירוע עם label (entity ו-timestamp) מצרפים את ערכי ה-features שהיו בתוקף באותו רגע: הערך האחרון עם ts קטן או שווה ל-ts של האירוע, בתוך TTL. בלי זה מצרפים ערכים עכשוויים שכוללים מידע מאחרי האירוע (label leakage). המטריקות ב-offline מנופחות, ה-model לומד סיגנלים שלא קיימים בזמן ה-prediction, והוא מאכזב בפרודקשן. Feature stores עושים את ה-as-of join הזה ב-get_historical_features; ב-SQL זה window או ASOF JOIN." } },
    { q: { en: "Your 32-GPU training jobs on spot keep restarting and never finish. What do you change?", he: "ה-jobs של 32 GPUs שרצים על spot כל הזמן מתאתחלים ולא מסתיימים. מה אתה משנה?" },
      a: { en: "First, measure: interruption rate per instance type/AZ vs checkpoint interval. Make checkpoints frequent (e.g. every 10-20 minutes), atomic and auto-resumed, including optimizer and data-loader state. Diversify instance types and AZs, and handle the interruption notice to flush a final checkpoint. With 32 GPUs any single loss kills the whole step, so the effective interruption rate is roughly the per-node rate times the node count; if it stays too high, move the big runs to on-demand or reserved capacity (capacity blocks) and keep spot for smaller jobs and sweeps.", he: "קודם כל למדוד: קצב ההפרעות לכל instance type ו-AZ מול המרווח בין checkpoints. להפוך את ה-checkpoints לתכופים (למשל כל 10-20 דקות), אטומיים ועם resume אוטומטי, כולל ה-state של ה-optimizer וה-data loader. לגוון instance types ו-AZs, ולטפל בהתראת ה-interruption כדי לכתוב checkpoint אחרון. עם 32 GPUs כל אובדן של node אחד הורג את כל ה-step, אז קצב ההפרעות האפקטיבי הוא בערך הקצב לכל node כפול מספר ה-nodes. אם הוא עדיין גבוה מדי, להעביר את הריצות הגדולות ל-on-demand או לקיבולת שמורה (capacity blocks), ולהשאיר spot ל-jobs קטנים ול-sweeps." } },
    { q: { en: "GPU utilization on training is 35%. Walk through your diagnosis.", he: "ניצולת ה-GPU ב-training היא 35%. תעבור על האבחון שלך." },
      a: { en: "Check the pattern with nvidia-smi dmon or DCGM: saw-tooth means input stalls. Run the step with synthetic in-memory data; if it's much faster, it's the input pipeline. Then: are files small (pack into shards), is the loader CPU-bound (more num_workers, pin_memory, DALI, offline preprocessing), are we re-reading S3 every epoch (local NVMe cache, FSx for Lustre)? If synthetic is also slow, look at batch size, mixed precision and, for multi-node, NCCL communication.", he: "בודקים את הדפוס עם nvidia-smi dmon או DCGM: שיני מסור אומרות עצירות על input. מריצים את ה-step עם דאטה סינתטי בזיכרון; אם זה מהיר בהרבה, הבעיה ב-pipeline של ה-input. ואז: האם הקבצים קטנים (לארוז ל-shards), האם ה-loader חסום על CPU (עוד num_workers, pin_memory, DALI, preprocessing מראש), האם קוראים מ-S3 מחדש בכל epoch (cache על NVMe מקומי, FSx for Lustre)? אם גם הסינתטי איטי, בודקים batch size, mixed precision, ובריצה על כמה nodes גם את התקשורת של NCCL." } }
  ],
  quiz: [
    { q: { en: "What does the online store of a feature store hold?", he: "מה מחזיק ה-online store של feature store?" },
      options: [
        { en: "The full history of every feature value", he: "את כל ההיסטוריה של כל ערך feature" },
        { en: "The latest feature values per entity key, for low-latency lookups at inference", he: "את ערכי ה-features האחרונים לכל entity key, לשליפה מהירה בזמן inference" },
        { en: "Model weights", he: "את המשקולות של ה-model" },
        { en: "Training labels", he: "את ה-labels של ה-training" }
      ], answer: 1,
      explain: { en: "Offline keeps history for point-in-time training sets; online keeps the latest value in a KV store (Redis, DynamoDB) for millisecond reads.", he: "ה-offline שומר היסטוריה בשביל training sets נכונים לנקודת זמן; ה-online שומר את הערך האחרון ב-KV store (Redis, DynamoDB) לקריאות של מילישניות." } },
    { q: { en: "Why do distributed training jobs need gang scheduling?", he: "למה jobs של training מבוזר צריכים gang scheduling?" },
      options: [
        { en: "To make each Pod start faster", he: "כדי שכל Pod יעלה מהר יותר" },
        { en: "Because partially placed jobs hold GPUs while waiting for the rest, which can deadlock the cluster", he: "כי jobs שמוקמו חלקית מחזיקים GPUs בזמן שהם מחכים לשאר, וזה יכול לתקוע את ה-cluster" },
        { en: "To spread Pods across AZs", he: "כדי לפזר Pods על AZs" },
        { en: "It is required by NCCL", he: "כי NCCL דורש את זה" }
      ], answer: 1,
      explain: { en: "All-or-nothing admission (Kueue, Volcano) prevents two jobs each holding part of what they need and waiting forever.", he: "Admission של הכל-או-כלום (Kueue, Volcano) מונע מצב ששני jobs מחזיקים כל אחד חלק ממה שהם צריכים ומחכים לנצח." } },
    { q: { en: "GPU utilization saw-tooths between 0% and 100%, averaging 35%. Training with synthetic in-memory data is 2x faster. What's the bottleneck?", he: "ניצולת ה-GPU קופצת בין 0% ל-100%, ובממוצע 35%. Training עם דאטה סינתטי בזיכרון מהיר פי 2. מה צוואר הבקבוק?" },
      options: [
        { en: "The GPU is too small", he: "ה-GPU קטן מדי" },
        { en: "NCCL bandwidth", he: "רוחב הפס של NCCL" },
        { en: "The input pipeline: small files, CPU decoding or repeated S3 reads", he: "ה-pipeline של ה-input: קבצים קטנים, decoding על CPU או קריאות חוזרות מ-S3" },
        { en: "The learning rate", he: "ה-learning rate" }
      ], answer: 2,
      explain: { en: "Synthetic data removes I/O from the equation. Fix sharding, loader workers and caching (NVMe, FSx for Lustre) before buying GPUs.", he: "דאטה סינתטי מוציא את ה-I/O מהמשוואה. תתקן sharding, workers של ה-loader ו-caching (NVMe, FSx for Lustre) לפני שקונים GPUs." } },
    { q: { en: "What must a training checkpoint include to resume correctly after a spot interruption?", he: "מה checkpoint של training חייב לכלול כדי לחזור נכון אחרי interruption של spot?" },
      options: [
        { en: "Only the model weights", he: "רק את המשקולות של ה-model" },
        { en: "Model weights, optimizer state, data loader position and RNG state, written atomically", he: "משקולות ה-model, ה-state של ה-optimizer, המיקום של ה-data loader וה-state של ה-RNG, שנכתבים בצורה אטומית" },
        { en: "The container image", he: "את ה-image של ה-container" },
        { en: "The Kubernetes Pod spec", he: "את ה-spec של ה-Pod ב-Kubernetes" }
      ], answer: 1,
      explain: { en: "Without optimizer and loader state, resumed training changes trajectory or repeats data; without atomic writes a half-written file can become \"latest\".", he: "בלי ה-state של ה-optimizer וה-loader, ה-training שחוזר משנה מסלול או חוזר על דאטה; בלי כתיבה אטומית קובץ חצי כתוב יכול להפוך ל-\"latest\"." } }
  ],
  related: ["mlops-lifecycle", "mlops-serving-monitoring", "ai-gpu-clusters", "k8s-gpu-inference", "cloud-spot-instances", "k8s-jobs-cronjobs", "s3-deep"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "mlops-serving-monitoring",
  track: "ai",
  order: 22,
  icon: "📈",
  level: 3,
  minutes: 16,
  title: { en: "Model Serving, Rollouts and Drift Monitoring", he: "Model serving, rollouts וניטור drift" },
  tldr: {
    en: "Pick the inference mode first (online, batch, streaming), then the runtime (KServe, Triton, SageMaker endpoints). Roll models out like risky code, but judge them on prediction quality and business KPIs, not only errors. Then monitor what infra dashboards can't see: input drift, prediction drift and training/serving skew, because ground truth often arrives weeks late.",
    he: "קודם בוחרים את סוג ה-inference (online, batch, streaming), ואז את ה-runtime (KServe, Triton, endpoints של SageMaker). עושים rollout ל-models כמו לקוד מסוכן, אבל שופטים אותם לפי איכות ה-predictions ו-KPIs עסקיים, לא רק לפי שגיאות. ואז מנטרים את מה שדשבורדים של תשתית לא רואים: drift ב-inputs, drift ב-predictions ו-training/serving skew, כי ה-ground truth מגיע לעתים קרובות באיחור של שבועות."
  },
  analogy: {
    en: "A model in production is a weather forecaster hired last year. He still shows up on time and talks confidently (latency and uptime are fine), but the climate has shifted and his forecasts are slowly getting worse. You won't know for sure until the actual weather comes in, so meanwhile you watch whether the inputs he sees and the forecasts he makes look different from when you hired him.",
    he: "Model בפרודקשן הוא חזאי שגייסת בשנה שעברה. הוא עדיין מגיע בזמן ומדבר בביטחון (ה-latency וה-uptime בסדר), אבל האקלים השתנה והתחזיות שלו מידרדרות לאט. לא תדע בוודאות עד שמזג האוויר האמיתי יגיע, אז בינתיים אתה בודק אם הנתונים שהוא רואה והתחזיות שהוא נותן נראים שונה מאשר כשגייסת אותו."
  },
  sections: [
    {
      h: { en: "Online, batch or streaming inference", he: "Inference מסוג online, batch או streaming" },
      body: {
        en: `<table>
<tr><th></th><th>Online (real-time)</th><th>Batch</th><th>Streaming</th></tr>
<tr><td>Trigger</td><td>Request/response (REST/gRPC)</td><td>Schedule over a whole table</td><td>Each event on Kafka/Kinesis</td></tr>
<tr><td>Latency budget</td><td>Tens of ms (p99), inside a user request</td><td>Hours; only the job deadline matters</td><td>Seconds</td></tr>
<tr><td>Example</td><td>Fraud score at checkout, ranking</td><td>Nightly churn scores to CRM, demand forecast</td><td>Anomaly detection on telemetry, real-time features + score</td></tr>
<tr><td>Infra</td><td>Always-on replicas, autoscaling, online feature store</td><td>Spark/Ray job or SageMaker batch transform, writes to a table</td><td>Flink/Kafka Streams consumer calling the model in-process or via RPC</td></tr>
<tr><td>Cost profile</td><td>Pay for idle headroom</td><td>Cheapest per prediction; spot-friendly</td><td>Always-on consumers</td></tr>
</table>
<p>Interview point: <strong>if the prediction can be computed before it's needed, do it in batch</strong> and serve it from a key-value lookup. A nightly batch of 20M scores on spot is far cheaper and simpler than an online endpoint at 99.95% availability. Go online only when the input exists only at request time (the cart content, the transaction amount).</p>`,
        he: `<table>
<tr><th></th><th>Online (real-time)</th><th>Batch</th><th>Streaming</th></tr>
<tr><td>טריגר</td><td>Request/response (REST או gRPC)</td><td>לוח זמנים על טבלה שלמה</td><td>כל אירוע ב-Kafka או Kinesis</td></tr>
<tr><td>תקציב latency</td><td>עשרות ms (p99), בתוך בקשה של משתמש</td><td>שעות; חשוב רק ה-deadline של ה-job</td><td>שניות</td></tr>
<tr><td>דוגמה</td><td>ציון fraud ב-checkout, ranking</td><td>ציוני churn לילה ל-CRM, תחזית ביקוש</td><td>זיהוי אנומליות ב-telemetry, features בזמן אמת ועוד ציון</td></tr>
<tr><td>תשתית</td><td>Replicas שתמיד למעלה, autoscaling, online feature store</td><td>Job של Spark או Ray, או batch transform של SageMaker, שכותב לטבלה</td><td>Consumer של Flink או Kafka Streams שקורא ל-model בתוך התהליך או ב-RPC</td></tr>
<tr><td>פרופיל עלות</td><td>משלמים על מרווח בטל</td><td>הכי זול לכל prediction; מתאים ל-spot</td><td>Consumers שתמיד למעלה</td></tr>
</table>
<p>נקודה לראיון: <strong>אם אפשר לחשב את ה-prediction לפני שצריך אותו, תעשה את זה ב-batch</strong> ותגיש אותו מ-lookup ב-key-value. Batch לילי של 20 מיליון ציונים על spot זול ופשוט בהרבה מ-endpoint אונליין עם זמינות של 99.95%. עוברים ל-online רק כשה-input קיים רק בזמן הבקשה (תוכן העגלה, סכום העסקה).</p>`
      }
    },
    {
      h: { en: "Serving stacks: KServe, Triton, BentoML, SageMaker", he: "Stacks ל-serving: KServe, Triton, BentoML, SageMaker" },
      body: {
        en: `<table>
<tr><th>Runtime</th><th>What it is</th><th>Use when</th></tr>
<tr><td><strong>KServe</strong></td><td>K8s CRD <code>InferenceService</code>: predictor (+ optional transformer/explainer), pluggable runtimes (sklearn, xgboost, MLflow, Triton, Hugging Face/vLLM). Two modes: <strong>Knative</strong> (serverless: scale-to-zero, revision-based canary) and <strong>Standard</strong> (formerly RawDeployment: plain Deployment + HPA/KEDA, no Knative dependency)</td><td>You run K8s and want one standard API for every model</td></tr>
<tr><td><strong>NVIDIA Triton</strong> (now branded Dynamo-Triton)</td><td>High-performance server: TensorRT, ONNX, PyTorch, Python and vLLM backends; <strong>dynamic batching</strong>, multiple model instances per GPU, model ensembles. Ports 8000 HTTP, 8001 gRPC, 8002 metrics</td><td>GPU models where throughput per GPU matters; often used as a runtime under KServe</td></tr>
<tr><td><strong>BentoML</strong></td><td>Python-first: decorate a class as a service, build a "bento" container, adaptive batching</td><td>DS-owned services with custom pre/post-processing logic</td></tr>
<tr><td><strong>Ray Serve</strong></td><td>Python serving on Ray, composes multiple models in one graph</td><td>Pipelines of models, already on Ray</td></tr>
<tr><td><strong>TorchServe</strong></td><td>In limited maintenance; the repo was archived in 2025 with no further fixes or security patches</td><td>Don't start new projects on it; migrate existing ones</td></tr>
<tr><td><strong>SageMaker endpoints</strong></td><td><strong>Real-time</strong> (instances, auto scaling, multi-model and inference components, production variants with traffic weights), <strong>Serverless</strong> (1-6 GB memory, max concurrency up to 200 per endpoint, no GPUs, cold starts; provisioned concurrency available), <strong>Async</strong> (queue-backed, large payloads up to 1 GB, long processing, can scale to zero), <strong>Batch transform</strong></td><td>AWS shops without a K8s platform; async for long jobs with bursty load</td></tr>
</table>
<pre>apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: fraud
  namespace: risk-serving
  annotations:
    serving.kserve.io/deploymentMode: Knative        # serverless mode: concurrency autoscaling, scale-to-zero
    autoscaling.knative.dev/target: "20"           # target in-flight requests per replica
spec:
  predictor:
    minReplicas: 2                                  # keep warm: this is on the checkout path
    maxReplicas: 30
    canaryTrafficPercent: 10                        # 10% to the newest revision
    model:
      modelFormat: { name: mlflow }
      storageUri: s3://ml-artifacts/fraud/v15/      # resolved from @champion by the CD pipeline
      resources:
        requests: { cpu: "2", memory: 4Gi }
        limits:   { memory: 4Gi }</pre>
<blockquote>⚠️ Production tip: let the CD pipeline resolve the alias (<code>@champion</code> → v15 → its S3 path) and write the concrete path into the manifest in git. The running service then never changes underneath you when someone moves an alias, and git history shows exactly which version served when.</blockquote>`,
        he: `<table>
<tr><th>Runtime</th><th>מה זה</th><th>מתי להשתמש</th></tr>
<tr><td><strong>KServe</strong></td><td>CRD של K8s בשם <code>InferenceService</code>: predictor (ואופציונלית transformer או explainer), runtimes שאפשר להחליף (sklearn, xgboost, MLflow, Triton, Hugging Face ו-vLLM). שני מצבים: <strong>Knative</strong> (serverless: scale-to-zero ו-canary לפי revisions) ו-<strong>Standard</strong> (לשעבר RawDeployment: Deployment רגיל עם HPA או KEDA, בלי תלות ב-Knative)</td><td>אתה מריץ K8s ורוצה API סטנדרטי אחד לכל model</td></tr>
<tr><td><strong>NVIDIA Triton</strong> (היום תחת המותג Dynamo-Triton)</td><td>שרת עתיר ביצועים: backends של TensorRT, ONNX, PyTorch, Python ו-vLLM; <strong>dynamic batching</strong>, כמה instances של model על GPU אחד, ensembles. פורטים 8000 ל-HTTP, 8001 ל-gRPC ו-8002 ל-metrics</td><td>Models על GPU שבהם חשוב throughput לכל GPU; הרבה פעמים רץ כ-runtime מתחת ל-KServe</td></tr>
<tr><td><strong>BentoML</strong></td><td>Python קודם כל: מסמנים מחלקה כ-service, בונים container מסוג "bento", adaptive batching</td><td>שירותים שה-DS מחזיקים, עם לוגיקת pre/post-processing מותאמת</td></tr>
<tr><td><strong>Ray Serve</strong></td><td>Serving ב-Python מעל Ray, מרכיב כמה models בגרף אחד</td><td>שרשראות של models, כשכבר עובדים עם Ray</td></tr>
<tr><td><strong>TorchServe</strong></td><td>ב-limited maintenance; ה-repo עבר לארכיון ב-2025, בלי תיקונים ובלי security patches</td><td>לא מתחילים עליו פרויקטים חדשים; מעבירים את הקיימים</td></tr>
<tr><td><strong>Endpoints של SageMaker</strong></td><td><strong>Real-time</strong> (instances, auto scaling, multi-model ו-inference components, production variants עם משקלי תעבורה), <strong>Serverless</strong> (זיכרון 1-6 GB, max concurrency עד 200 ל-endpoint, בלי GPUs, cold starts; יש provisioned concurrency), <strong>Async</strong> (מבוסס תור, payloads גדולים עד 1 GB, עיבוד ארוך, יכול לרדת לאפס), <strong>Batch transform</strong></td><td>ארגונים על AWS בלי פלטפורמת K8s; async ל-jobs ארוכים עם עומס בפרצים</td></tr>
</table>
<pre>apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: fraud
  namespace: risk-serving
  annotations:
    serving.kserve.io/deploymentMode: Knative        # serverless mode: concurrency autoscaling, scale-to-zero
    autoscaling.knative.dev/target: "20"           # target in-flight requests per replica
spec:
  predictor:
    minReplicas: 2                                  # keep warm: this is on the checkout path
    maxReplicas: 30
    canaryTrafficPercent: 10                        # 10% to the newest revision
    model:
      modelFormat: { name: mlflow }
      storageUri: s3://ml-artifacts/fraud/v15/      # resolved from @champion by the CD pipeline
      resources:
        requests: { cpu: "2", memory: 4Gi }
        limits:   { memory: 4Gi }</pre>
<blockquote>⚠️ Production tip: תן ל-pipeline של ה-CD לפתור את ה-alias (<code>@champion</code> ← v15 ← הנתיב שלו ב-S3) ולכתוב את הנתיב הקונקרטי ל-manifest ב-git. כך השירות שרץ אף פעם לא משתנה מתחת לרגליים כשמישהו מזיז alias, וההיסטוריה ב-git מראה בדיוק איזו גרסה הוגשה ומתי.</blockquote>`
      }
    },
    {
      h: { en: "Autoscaling and the cold-start problem", he: "Autoscaling ובעיית ה-cold start" },
      body: {
        en: `<p>CPU utilization is a poor signal for model servers. Better signals:</p>
<ul>
<li><strong>Concurrency / in-flight requests</strong> per replica (Knative's default; KEDA on a Prometheus query in Standard mode). Set the target from a load test: the concurrency where p99 still meets the SLO.</li>
<li><strong>Queue depth / time in queue</strong> for batching servers (Triton's queue duration metrics) and for async endpoints (SageMaker async scales on the backlog per instance).</li>
<li><strong>GPU utilization alone is misleading</strong>: a GPU at 100% "utilization" may be doing tiny batches inefficiently, and an idle GPU at 0% may be waiting on a slow tokenizer. Combine with latency and queue metrics. LLM-specific signals (KV cache use, tokens/s) are in <code>ai-llm-serving</code>.</li>
</ul>
<p><strong>Scale-to-zero is a cost win and a latency trap.</strong> The first request after idle pays the full cold start, and for a GPU model that's a chain:</p>
<table>
<tr><th>Step</th><th>Typical time</th><th>Mitigation</th></tr>
<tr><td>Provision a GPU node (if none free)</td><td>1-5 minutes</td><td>Warm node pool / overprovisioning placeholder Pods</td></tr>
<tr><td>Pull a CUDA image (often 5-15 GB)</td><td>Tens of seconds to minutes</td><td>Smaller images, pre-pulled images on the node AMI, lazy-loading snapshotters</td></tr>
<tr><td>Download model weights</td><td>Seconds for MBs, minutes for tens of GB</td><td>Node-local cache, PVC with pre-staged weights, KServe's local model cache</td></tr>
<tr><td>Load into memory/GPU, warm up</td><td>Seconds to minutes</td><td>Warm-up requests in the readiness probe</td></tr>
</table>
<p>So: scale-to-zero is great for internal, rarely used or batch-like models. For anything on a user-facing path, keep <code>minReplicas ≥ 2</code> (one per AZ) and pay for it.</p>`,
        he: `<p>ניצולת CPU היא סיגנל גרוע לשרתי models. סיגנלים טובים יותר:</p>
<ul>
<li><strong>Concurrency או בקשות in-flight</strong> לכל replica (ברירת המחדל של Knative; KEDA על שאילתת Prometheus במצב Standard). קובעים את היעד מבדיקת עומס: ה-concurrency שבו ה-p99 עדיין עומד ב-SLO.</li>
<li><strong>עומק תור או זמן בתור</strong> לשרתים שעושים batching (מטריקות משך התור של Triton) ול-endpoints אסינכרוניים (SageMaker async עושה scaling לפי ה-backlog לכל instance).</li>
<li><strong>ניצולת GPU לבדה מטעה</strong>: GPU על 100% "utilization" יכול לעבוד על batches קטנטנים בחוסר יעילות, ו-GPU על 0% יכול לחכות ל-tokenizer איטי. תשלב עם מטריקות latency ותור. סיגנלים ספציפיים ל-LLM (שימוש ב-KV cache, tokens לשנייה) נמצאים ב-<code>ai-llm-serving</code>.</li>
</ul>
<p><strong>Scale-to-zero זה ניצחון בעלות ומלכודת ב-latency.</strong> הבקשה הראשונה אחרי זמן בטל משלמת את כל ה-cold start, וב-model על GPU זו שרשרת:</p>
<table>
<tr><th>שלב</th><th>זמן טיפוסי</th><th>הקלה</th></tr>
<tr><td>הקצאת node עם GPU (אם אין פנוי)</td><td>1-5 דקות</td><td>Node pool חם, או Pods ממלאי מקום ל-overprovisioning</td></tr>
<tr><td>משיכת image של CUDA (לרוב 5-15 GB)</td><td>עשרות שניות עד דקות</td><td>Images קטנים יותר, images שנמשכו מראש ב-AMI של ה-node, snapshotters עם lazy loading</td></tr>
<tr><td>הורדת המשקולות של ה-model</td><td>שניות ל-MBs, דקות לעשרות GB</td><td>Cache מקומי על ה-node, PVC עם משקולות מוכנות מראש, ה-local model cache של KServe</td></tr>
<tr><td>טעינה לזיכרון או ל-GPU, warm-up</td><td>שניות עד דקות</td><td>בקשות warm-up בתוך ה-readiness probe</td></tr>
</table>
<p>לכן: scale-to-zero מעולה ל-models פנימיים, כאלה שמשתמשים בהם לעתים רחוקות או כאלה שדומים ל-batch. לכל מה שנמצא בנתיב של משתמש, תשאיר <code>minReplicas ≥ 2</code> (אחד לכל AZ) ותשלם על זה.</p>`
      }
    },
    {
      h: { en: "Rolling out models: shadow, canary, A/B, champion/challenger, bandits", he: "Rollout ל-models: shadow, canary, A/B, champion/challenger ו-bandits" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>How</th><th>Answers</th><th>Cost / risk</th></tr>
<tr><td><strong>Shadow</strong></td><td>Mirror 100% (or a sample) of live traffic to the new model; its answers are logged, never returned</td><td>Does it run (latency, errors, memory) and how do its predictions differ from the champion on real inputs?</td><td>Zero user risk, double compute. Can't measure business impact</td></tr>
<tr><td><strong>Canary</strong></td><td>1% → 10% → 50% → 100% with automatic rollback on SLOs</td><td>Is it safe operationally?</td><td>Small blast radius. Short canaries rarely show model quality differences</td></tr>
<tr><td><strong>A/B test</strong></td><td>Random, sticky split by user id (e.g. 50/50) for a fixed period, compare a business metric with a statistical test</td><td>Is it better for the business?</td><td>Needs enough traffic and time for significance; half the users get the worse model meanwhile</td></tr>
<tr><td><strong>Champion/challenger</strong></td><td>The current model (champion) serves; one or more challengers run in shadow or on a small slice and are promoted when they win on agreed metrics</td><td>A continuous promotion process</td><td>Requires clear, pre-agreed win criteria</td></tr>
<tr><td><strong>Multi-armed bandit</strong></td><td>Traffic shifts automatically toward the better-performing variant (epsilon-greedy, Thompson sampling)</td><td>Maximize reward during the test</td><td>Needs fast feedback (clicks, not 60-day chargebacks); weaker statistical conclusions</td></tr>
</table>
<p>A typical safe sequence: <strong>offline eval gate → shadow for a few days → canary on SLOs → A/B on the business KPI → promote (move @champion)</strong>. Keep the previous version deployed but scaled down, so rollback is a traffic switch, not a redeploy.</p>
<blockquote>💡 Real world: Argo Rollouts, Flagger, KServe's <code>canaryTrafficPercent</code>, and SageMaker production variants (weights) and shadow tests all provide the traffic mechanics. The hard part is the analysis: define the metric, the minimum sample size, and who decides before the experiment starts.</blockquote>`,
        he: `<table>
<tr><th>דפוס</th><th>איך</th><th>על מה זה עונה</th><th>עלות וסיכון</th></tr>
<tr><td><strong>Shadow</strong></td><td>משכפלים 100% (או מדגם) מהתעבורה החיה ל-model החדש; התשובות שלו נרשמות ולא חוזרות למשתמש</td><td>האם הוא רץ (latency, שגיאות, זיכרון), ובמה ה-predictions שלו שונים מה-champion על inputs אמיתיים?</td><td>אפס סיכון למשתמש, compute כפול. אי אפשר למדוד השפעה עסקית</td></tr>
<tr><td><strong>Canary</strong></td><td>1% ← 10% ← 50% ← 100%, עם rollback אוטומטי לפי SLOs</td><td>האם הוא בטוח תפעולית?</td><td>Blast radius קטן. Canary קצר כמעט אף פעם לא חושף הבדלים באיכות ה-model</td></tr>
<tr><td><strong>A/B test</strong></td><td>חלוקה אקראית וקבועה לפי user id (למשל 50/50) לתקופה קבועה, והשוואה של מטריקה עסקית עם מבחן סטטיסטי</td><td>האם הוא טוב יותר לעסק?</td><td>צריך מספיק תעבורה וזמן כדי להגיע למובהקות; בינתיים חצי מהמשתמשים מקבלים את ה-model הפחות טוב</td></tr>
<tr><td><strong>Champion/challenger</strong></td><td>ה-model הנוכחי (champion) מגיש; challenger אחד או יותר רצים ב-shadow או על פרוסה קטנה, ומקודמים כשהם מנצחים לפי מטריקות שסוכמו מראש</td><td>תהליך קידום רציף</td><td>דורש קריטריוני ניצחון ברורים שסוכמו מראש</td></tr>
<tr><td><strong>Multi-armed bandit</strong></td><td>התעבורה זזה אוטומטית לגרסה שמצליחה יותר (epsilon-greedy, Thompson sampling)</td><td>למקסם תגמול כבר בזמן הניסוי</td><td>צריך feedback מהיר (קליקים, לא chargebacks של 60 יום); מסקנות סטטיסטיות חלשות יותר</td></tr>
</table>
<p>רצף בטוח טיפוסי: <strong>שער eval ב-offline ← shadow לכמה ימים ← canary לפי SLOs ← A/B על ה-KPI העסקי ← קידום (הזזת @champion)</strong>. תשאיר את הגרסה הקודמת למעלה אבל מוקטנת, כדי ש-rollback יהיה החלפת תעבורה ולא deploy מחדש.</p>
<blockquote>💡 Real world: Argo Rollouts, Flagger, ה-<code>canaryTrafficPercent</code> של KServe, וה-production variants (משקלים) וה-shadow tests של SageMaker נותנים את המכניקה של התעבורה. החלק הקשה הוא הניתוח: להגדיר את המטריקה, את גודל המדגם המינימלי ומי מחליט, לפני שהניסוי מתחיל.</blockquote>`
      }
    },
    {
      h: { en: "Drift: data, concept, prediction, and the delayed-label problem", he: "Drift: דאטה, concept, predictions ובעיית ה-labels המאחרים" },
      body: {
        en: `<table>
<tr><th>Kind</th><th>What changed</th><th>Example</th><th>Detect with</th></tr>
<tr><td><strong>Data drift</strong> (covariate shift)</td><td>The input distribution P(X)</td><td>A new market launches; average basket size doubles</td><td>Compare feature distributions vs the training reference</td></tr>
<tr><td><strong>Concept drift</strong></td><td>The relationship P(y|X)</td><td>Fraudsters change tactics: the same features now mean something else</td><td>Only with labels: accuracy/precision over time</td></tr>
<tr><td><strong>Prediction drift</strong></td><td>The output distribution P(ŷ)</td><td>Share of "fraud" predictions goes from 2% to 9%</td><td>Compare score histograms; the cheapest early warning</td></tr>
<tr><td><strong>Training/serving skew</strong></td><td>Serving inputs differ from training inputs from day one, due to a bug</td><td>Online pipeline sends price in cents, training used dollars</td><td>Compare serving-time features against the training set right after deploy</td></tr>
</table>
<p><strong>The statistics</strong> (computed per feature over a window, e.g. daily, against a reference such as the training set):</p>
<ul>
<li><strong>PSI (Population Stability Index)</strong>: bin the feature, then <code>PSI = Σ (actual% − expected%) × ln(actual% / expected%)</code>. Industry rule of thumb: &lt; 0.1 stable, 0.1-0.25 moderate shift, &gt; 0.25 significant. Simple, explainable, works for categorical features too.</li>
<li><strong>KS test</strong> (Kolmogorov-Smirnov): max distance between two empirical CDFs, for numeric features. Gotcha: with hundreds of thousands of rows, the p-value is tiny for trivial differences, so alert on the statistic (effect size), not on p &lt; 0.05.</li>
<li><strong>KL divergence</strong>: asymmetric and blows up when a bin is empty in the reference; <strong>Jensen-Shannon</strong> or Wasserstein distance are the safer, symmetric alternatives.</li>
</ul>
<pre>import numpy as np
def psi(expected, actual, bins=10, eps=1e-6):
    edges = np.quantile(expected, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    e = np.histogram(expected, edges)[0] / len(expected) + eps
    a = np.histogram(actual, edges)[0] / len(actual) + eps
    return float(np.sum((a - e) * np.log(a / e)))

psi(train["price"], serving_last_24h["price"])   # 0.03 = fine, 4.8 = something broke</pre>
<p><strong>Delayed ground truth</strong> is why you can't just monitor accuracy: fraud labels arrive with chargebacks weeks to months later, churn after a billing cycle, loan defaults after months. So you monitor <em>proxies</em> now (input drift, prediction drift, skew, business KPIs like approval rate) and true performance later, when labels join back to logged predictions. That requires logging every prediction with its request id, model version and input features, so they can be joined to labels when they land.</p>
<p><strong>Retraining triggers</strong>: on a schedule (simple, predictable), on drift beyond a threshold for N consecutive windows, or on measured performance drop once labels arrive. Never retrain automatically on drift caused by a data bug: you will teach the model the bug. Validate input data (schema, ranges, null rates, units) before both training and alerting.</p>
<p><strong>Tooling</strong>, described generically: open-source drift libraries (Evidently is the common one) compute these tests and reports from two DataFrames; observability platforms ingest prediction logs, compute drift per feature over time, join delayed labels and slice performance by segment; lightweight statistical profiles (whylogs-style sketches) let you monitor without storing raw data, which helps with PII.</p>`,
        he: `<table>
<tr><th>סוג</th><th>מה השתנה</th><th>דוגמה</th><th>איך מזהים</th></tr>
<tr><td><strong>Data drift</strong> (covariate shift)</td><td>ההתפלגות של ה-inputs, P(X)</td><td>נפתח שוק חדש; גודל הסל הממוצע מכפיל את עצמו</td><td>משווים התפלגויות של features מול ה-reference של ה-training</td></tr>
<tr><td><strong>Concept drift</strong></td><td>הקשר P(y|X)</td><td>רמאים משנים טקטיקה: אותם features אומרים עכשיו משהו אחר</td><td>רק עם labels: accuracy או precision לאורך זמן</td></tr>
<tr><td><strong>Prediction drift</strong></td><td>ההתפלגות של ה-outputs, P(ŷ)</td><td>אחוז ה-predictions של "fraud" עולה מ-2% ל-9%</td><td>משווים היסטוגרמות של ציונים; ההתראה המוקדמת הכי זולה</td></tr>
<tr><td><strong>Training/serving skew</strong></td><td>ה-inputs ב-serving שונים מה-inputs ב-training כבר מהיום הראשון, בגלל באג</td><td>ה-pipeline האונליין שולח מחיר בסנטים, וה-training השתמש בדולרים</td><td>משווים את ה-features בזמן serving מול ה-training set מיד אחרי ה-deploy</td></tr>
</table>
<p><strong>הסטטיסטיקה</strong> (מחושבת לכל feature על חלון, למשל יומי, מול reference כמו ה-training set):</p>
<ul>
<li><strong>PSI (Population Stability Index)</strong>: מחלקים את ה-feature ל-bins, ואז <code>PSI = Σ (actual% − expected%) × ln(actual% / expected%)</code>. כלל האצבע בתעשייה: מתחת ל-0.1 יציב, 0.1-0.25 שינוי בינוני, מעל 0.25 משמעותי. פשוט, קל להסביר, ועובד גם על features קטגוריאליים.</li>
<li><strong>KS test</strong> (Kolmogorov-Smirnov): המרחק המקסימלי בין שתי CDFs אמפיריות, ל-features מספריים. מלכודת: עם מאות אלפי שורות, ה-p-value זעיר גם על הבדלים שוליים, אז תתריע לפי הסטטיסטי עצמו (גודל האפקט), לא לפי p &lt; 0.05.</li>
<li><strong>KL divergence</strong>: לא סימטרי ומתפוצץ כש-bin ריק ב-reference; <strong>Jensen-Shannon</strong> או Wasserstein distance הן החלופות הסימטריות והבטוחות יותר.</li>
</ul>
<pre>import numpy as np
def psi(expected, actual, bins=10, eps=1e-6):
    edges = np.quantile(expected, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    e = np.histogram(expected, edges)[0] / len(expected) + eps
    a = np.histogram(actual, edges)[0] / len(actual) + eps
    return float(np.sum((a - e) * np.log(a / e)))

psi(train["price"], serving_last_24h["price"])   # 0.03 = fine, 4.8 = something broke</pre>
<p><strong>Ground truth מאחר</strong> הוא הסיבה שאי אפשר פשוט לנטר accuracy: labels של fraud מגיעים עם chargebacks אחרי שבועות עד חודשים, churn אחרי מחזור חיוב, ואי-החזר הלוואה אחרי חודשים. לכן מנטרים עכשיו <em>proxies</em> (drift ב-inputs, drift ב-predictions, skew, ו-KPIs עסקיים כמו אחוז אישורים), ואת הביצועים האמיתיים מאוחר יותר, כשה-labels מתחברים חזרה ל-predictions שנרשמו. זה מחייב לרשום כל prediction עם ה-request id, גרסת ה-model וה-features שנכנסו, כדי שאפשר יהיה לחבר אותם ל-labels כשהם מגיעים.</p>
<p><strong>טריגרים ל-retraining</strong>: לפי לוח זמנים (פשוט וצפוי), לפי drift מעל סף במשך N חלונות רצופים, או לפי ירידה מדודה בביצועים כשה-labels מגיעים. אף פעם אל תעשה retraining אוטומטי על drift שנגרם מבאג בדאטה: תלמד את ה-model את הבאג. תעשה ולידציה ל-input (schema, טווחים, אחוזי null, יחידות) לפני ה-training ולפני ההתראות.</p>
<p><strong>כלים</strong>, בתיאור כללי: ספריות drift בקוד פתוח (Evidently היא הנפוצה) מחשבות את המבחנים והדוחות האלה משני DataFrames; פלטפורמות observability קולטות לוגים של predictions, מחשבות drift לכל feature לאורך זמן, מחברות labels מאחרים ופורסות ביצועים לפי סגמנטים; ופרופילים סטטיסטיים קלים (sketches בסגנון whylogs) מאפשרים לנטר בלי לשמור דאטה גולמי, וזה עוזר עם PII.</p>`
      }
    }
  ],
  diagram: `  request -> feature lookup (online store) -> model (KServe, @champion v15) -> response
                     |                                   |
                     +---- log {req_id, features, model_version, score} ----> prediction log (S3/Kafka)
                                                                                   |
  reference = training set --> daily drift job (PSI/KS per feature, score histogram) --> alert
  labels arrive weeks later  --> join on req_id --> true precision/recall --> retrain trigger`,
  handsOn: [
    { cmd: "kubectl get inferenceservice fraud -n risk-serving -o jsonpath='{.status.components.predictor.traffic}'",
      what: { en: "See how KServe is splitting traffic between the latest (canary) revision and the previous one, and which revision is ready.", he: "רואה איך KServe מחלק תעבורה בין ה-revision האחרון (canary) לקודם, ואיזה revision מוכן." } },
    { cmd: "kubectl patch inferenceservice fraud -n risk-serving --type merge -p '{\"spec\":{\"predictor\":{\"canaryTrafficPercent\":0}}}'",
      what: { en: "Instant rollback in Knative mode: send 0% to the new revision; traffic returns to the last known-good revision without a redeploy.", he: "Rollback מיידי במצב Knative: שולחים 0% ל-revision החדש; התעבורה חוזרת ל-revision האחרון שעבד, בלי deploy מחדש." } },
    { cmd: "aws sagemaker update-endpoint-weights-and-capacities --endpoint-name fraud --desired-weights-and-capacities VariantName=champion,DesiredWeight=90 VariantName=challenger,DesiredWeight=10",
      what: { en: "Shift traffic between two production variants of a SageMaker real-time endpoint for a canary or A/B split, without creating a new endpoint config.", he: "מזיז תעבורה בין שני production variants של endpoint מסוג real-time ב-SageMaker, ל-canary או לחלוקת A/B, בלי ליצור endpoint config חדש." } },
    { cmd: "python -c \"from evidently import Report; from evidently.presets import DataDriftPreset; import pandas as pd; r=Report([DataDriftPreset()]); r.run(reference_data=pd.read_parquet('train.parquet'), current_data=pd.read_parquet('serving_24h.parquet')).save_html('drift.html')\"",
      what: { en: "Generate a per-feature drift report (Evidently 0.7+ API) comparing the last 24h of logged serving features with the training reference. Open drift.html and sort by drift score.", he: "מייצר דוח drift לכל feature (ה-API של Evidently מגרסה 0.7 ומעלה) שמשווה את ה-features שנרשמו ב-serving ב-24 השעות האחרונות מול ה-reference של ה-training. תפתח את drift.html ותמיין לפי ציון ה-drift." } },
    { cmd: "curl -s localhost:8002/metrics | grep -E 'nv_inference_(queue_duration_us|request_success|exec_count)'",
      what: { en: "Read Triton's Prometheus metrics: time requests wait in the queue vs execution count. Rising queue time with flat executions means you need more instances or bigger dynamic batches.", he: "קורא את המטריקות של Triton ב-Prometheus: כמה זמן בקשות מחכות בתור מול מספר ההרצות. זמן תור שעולה עם מספר הרצות שטוח אומר שצריך עוד instances או batches דינמיים גדולים יותר." } }
  ],
  mnemonic: {
    en: "\"Shadow, Canary, A/B, Promote\" for rollouts, and \"Inputs now, Labels later\": watch input and prediction drift today, because ground truth shows up weeks late.",
    he: "\"Shadow, Canary, A/B, קידום\" ל-rollouts, ו-\"inputs עכשיו, labels אחר כך\": תנטר drift ב-inputs וב-predictions היום, כי ה-ground truth מגיע באיחור של שבועות."
  },
  pitfalls: [
    { en: "Judging a model canary only on errors and latency. A model that returns valid but wrong scores passes every SLO check. Add prediction-distribution and business-KPI analysis to the rollout gate.", he: "לשפוט canary של model רק לפי שגיאות ו-latency. Model שמחזיר ציונים תקינים אבל שגויים עובר כל בדיקת SLO. תוסיף לשער ה-rollout ניתוח של התפלגות ה-predictions ושל ה-KPI העסקי." },
    { en: "Alerting on KS p-values with huge samples. Every feature is \"significantly drifted\" every day, people mute the alert, and the real incident is missed. Use effect-size thresholds (PSI > 0.25, KS statistic, Wasserstein) and require several consecutive windows.", he: "התראות לפי p-values של KS על מדגמים ענקיים. כל feature \"זז משמעותית\" כל יום, אנשים משתיקים את ההתראה, ופוספס האירוע האמיתי. תשתמש בספים של גודל אפקט (PSI מעל 0.25, הסטטיסטי של KS, Wasserstein) ותדרוש כמה חלונות רצופים." },
    { en: "Auto-retraining on drift without validating the data. If the drift is a unit or schema bug upstream, retraining bakes the bug into the next model. Validate inputs first; retrain only on real-world change.", he: "Retraining אוטומטי על drift בלי ולידציה לדאטה. אם ה-drift הוא באג של יחידות או schema ב-upstream, ה-retraining צורב את הבאג ל-model הבא. קודם ולידציה ל-inputs; retraining רק על שינוי אמיתי בעולם." },
    { en: "Scale-to-zero on a user-facing GPU model. The first request after idle waits minutes for node provisioning, image pull and weight loading. Keep warm replicas on critical paths.", he: "Scale-to-zero ל-model על GPU שמשרת משתמשים. הבקשה הראשונה אחרי זמן בטל מחכה דקות להקצאת node, משיכת image וטעינת משקולות. תשאיר replicas חמים בנתיבים קריטיים." }
  ],
  interview: [
    { q: { en: "Labels for your fraud model arrive 60 days late. How do you know the model is healthy this week?", he: "ה-labels של model ה-fraud מגיעים באיחור של 60 יום. איך תדע שה-model בריא השבוע?" },
      a: { en: "Monitor leading indicators: input drift per feature (PSI vs training), prediction drift (score histogram, share flagged), training/serving skew, data quality (nulls, ranges, units, freshness of online features), and business proxies (approval rate, manual-review queue size, early signals like customer disputes). Log every prediction with request id, model version and features, and join labels when they arrive to compute real precision/recall per segment. Where possible, get faster partial labels (analyst reviews of a sample).", he: "מנטרים מדדים מקדימים: drift ב-inputs לכל feature (PSI מול ה-training), drift ב-predictions (היסטוגרמת ציונים, אחוז שסומן), training/serving skew, איכות דאטה (nulls, טווחים, יחידות, רעננות של features ב-online), ו-proxies עסקיים (אחוז אישורים, גודל תור הבדיקה הידנית, סימנים מוקדמים כמו מחלוקות של לקוחות). רושמים כל prediction עם request id, גרסת model ו-features, ומחברים labels כשהם מגיעים כדי לחשב precision ו-recall אמיתיים לכל סגמנט. כשאפשר, משיגים labels חלקיים מהר יותר (בדיקה של analysts על מדגם)." } },
    { q: { en: "Shadow vs canary vs A/B for a new ranking model: when do you use each?", he: "Shadow מול canary מול A/B ל-model ranking חדש: מתי משתמשים בכל אחד?" },
      a: { en: "Shadow first: no user impact, validates latency, memory and output differences on real traffic. Canary next: small real share with automatic rollback on SLOs, proving it's operationally safe. Then an A/B test with a sticky user split, a pre-registered business metric and enough sample size to decide if it's actually better. Bandits fit when feedback is fast (clicks) and you care about reward during the test more than a clean statistical answer.", he: "קודם shadow: בלי השפעה על משתמשים, מוודא latency, זיכרון והבדלים בפלט על תעבורה אמיתית. אחר כך canary: נתח אמיתי קטן עם rollback אוטומטי לפי SLOs, שמוכיח שזה בטוח תפעולית. ואז A/B test עם חלוקה קבועה לפי משתמש, מטריקה עסקית שהוגדרה מראש ומדגם מספיק גדול כדי להחליט אם הוא באמת טוב יותר. Bandits מתאימים כשה-feedback מהיר (קליקים) ואכפת לך מהתגמול בזמן הניסוי יותר מתשובה סטטיסטית נקייה." } },
    { q: { en: "How do you autoscale a GPU model server on Kubernetes?", he: "איך עושים autoscaling לשרת model על GPU ב-Kubernetes?" },
      a: { en: "Not on CPU. Scale on in-flight requests per replica (Knative concurrency, or KEDA on a Prometheus metric) or on queue time for batching servers, with the target taken from a load test at the p99 SLO. Pair the Pod autoscaler with a node autoscaler (Karpenter/cluster autoscaler) and account for GPU cold start: node provisioning, multi-GB image pulls and weight loading. Keep minReplicas for user-facing paths, pre-pull images, cache weights locally, and use scale-to-zero only for rarely used models.", he: "לא לפי CPU. עושים scaling לפי בקשות in-flight לכל replica (concurrency של Knative, או KEDA על מטריקה של Prometheus) או לפי זמן בתור בשרתים שעושים batching, כשהיעד נלקח מבדיקת עומס ב-p99 של ה-SLO. מצמידים ל-autoscaler של ה-Pods גם autoscaler ל-nodes (Karpenter או cluster autoscaler), ולוקחים בחשבון cold start של GPU: הקצאת node, משיכת images של כמה GB וטעינת משקולות. משאירים minReplicas בנתיבים של משתמשים, מושכים images מראש, שומרים משקולות ב-cache מקומי, ו-scale-to-zero רק ל-models שמשתמשים בהם לעתים רחוקות." } }
  ],
  quiz: [
    { q: { en: "Which rollout pattern measures business impact on real users?", he: "איזה דפוס rollout מודד השפעה עסקית על משתמשים אמיתיים?" },
      options: [
        { en: "Shadow deployment", he: "Shadow deployment" },
        { en: "An A/B test with a sticky user split and a pre-defined metric", he: "A/B test עם חלוקה קבועה לפי משתמש ומטריקה שהוגדרה מראש" },
        { en: "Offline evaluation on a held-out set", he: "Evaluation ב-offline על סט מוחזק בצד" },
        { en: "A readiness probe", he: "Readiness probe" }
      ], answer: 1,
      explain: { en: "Shadow responses never reach users, so they can't move a business metric. A/B exposes a random, stable group to each model and compares outcomes.", he: "תשובות shadow אף פעם לא מגיעות למשתמשים, אז הן לא יכולות להזיז מטריקה עסקית. A/B חושף קבוצה אקראית וקבועה לכל model ומשווה תוצאות." } },
    { q: { en: "A feature's PSI between training and the last 24h of serving is 4.8. What does it most likely mean?", he: "ה-PSI של feature בין ה-training ל-24 השעות האחרונות של serving הוא 4.8. מה זה כנראה אומר?" },
      options: [
        { en: "Normal day-to-day noise", he: "רעש רגיל מיום ליום" },
        { en: "A moderate seasonal shift", he: "שינוי עונתי בינוני" },
        { en: "A drastic shift, very often a pipeline bug such as a unit or schema change", he: "שינוי דרסטי, ולעתים קרובות מאוד באג ב-pipeline כמו שינוי יחידות או schema" },
        { en: "The model needs more GPUs", he: "ה-model צריך עוד GPUs" }
      ], answer: 2,
      explain: { en: "Above 0.25 is already significant; 4.8 means the distributions barely overlap. Real-world drift is rarely that abrupt, so check data contracts and units first.", he: "מעל 0.25 זה כבר משמעותי; 4.8 אומר שההתפלגויות כמעט לא חופפות. Drift אמיתי בעולם כמעט אף פעם לא כל כך חד, אז קודם בודקים data contracts ויחידות." } },
    { q: { en: "Which drift type can only be confirmed once ground-truth labels arrive?", he: "איזה סוג drift אפשר לאשר רק כשה-labels של ה-ground truth מגיעים?" },
      options: [
        { en: "Data drift", he: "Data drift" },
        { en: "Prediction drift", he: "Prediction drift" },
        { en: "Concept drift", he: "Concept drift" },
        { en: "Training/serving skew", he: "Training/serving skew" }
      ], answer: 2,
      explain: { en: "Concept drift is a change in P(y|X); inputs and predictions may look identical, so you need labels to see that accuracy fell.", he: "Concept drift הוא שינוי ב-P(y|X); ה-inputs וה-predictions יכולים להיראות זהים, אז צריך labels כדי לראות שהדיוק ירד." } },
    { q: { en: "Why is scale-to-zero risky for a user-facing GPU model?", he: "למה scale-to-zero מסוכן ל-model על GPU שמשרת משתמשים?" },
      options: [
        { en: "Knative doesn't support GPUs", he: "Knative לא תומך ב-GPUs" },
        { en: "The first request pays for node provisioning, a multi-GB image pull and weight loading, which can take minutes", he: "הבקשה הראשונה משלמת על הקצאת node, משיכת image של כמה GB וטעינת משקולות, וזה יכול לקחת דקות" },
        { en: "It increases GPU cost", he: "זה מייקר את ה-GPU" },
        { en: "Models lose accuracy after scaling to zero", he: "Models מאבדים דיוק אחרי ירידה לאפס" }
      ], answer: 1,
      explain: { en: "Cold start on GPUs is a chain of slow steps. Keep minReplicas on critical paths and use scale-to-zero for rarely used models.", he: "Cold start על GPU הוא שרשרת של שלבים איטיים. תשאיר minReplicas בנתיבים קריטיים ותשתמש ב-scale-to-zero ל-models שמשתמשים בהם לעתים רחוקות." } }
  ],
  related: ["mlops-lifecycle", "mlops-training-pipelines", "ai-llm-serving", "k8s-gpu-inference", "k8s-argo-rollouts", "k8s-keda", "data-quality-observability", "data-contracts-schema-registry"]
});

/* ------------------------------------------------------------------ */
/* Glossary                                                            */
/* ------------------------------------------------------------------ */
INFRA.glossary.push(
  { term: "Model registry", track: "ai", lesson: "mlops-lifecycle", def: { en: "A catalog of named models with immutable versions, their lineage (run, data, metrics) and movable aliases like @champion that serving loads; promotion and rollback are alias moves (MLflow, SageMaker, Vertex).", he: "קטלוג של models עם שמות וגרסאות immutable, ה-lineage שלהם (run, דאטה, מטריקות) ו-aliases שזזים כמו @champion שה-serving טוען; קידום ו-rollback הם הזזת alias (MLflow, SageMaker, Vertex)." } },
  { term: "Feature store", track: "ai", lesson: "mlops-training-pipelines", def: { en: "One definition of each ML feature with two read paths: an offline store with full history for point-in-time-correct training sets, and an online key-value store with the latest values for low-latency inference (e.g. Feast).", he: "הגדרה אחת לכל feature של ML עם שני נתיבי קריאה: offline store עם כל ההיסטוריה ל-training sets נכונים לנקודת זמן, ו-online store מסוג key-value עם הערכים האחרונים ל-inference מהיר (למשל Feast)." } },
  { term: "Point-in-time join", track: "ai", lesson: "mlops-training-pipelines", def: { en: "An as-of join that attaches to each labeled event the feature values valid at that event's timestamp, preventing future information from leaking into training data.", he: "Join מסוג as-of שמצמיד לכל אירוע עם label את ערכי ה-features שהיו בתוקף ב-timestamp של האירוע, ומונע דליפה של מידע מהעתיד לדאטה של ה-training." } },
  { term: "Training/serving skew", track: "ai", lesson: "mlops-serving-monitoring", def: { en: "A mismatch between the features a model saw in training and what it receives in production (different code, stale online store, nulls, units); the model degrades silently with no errors.", he: "פער בין ה-features שה-model ראה ב-training לבין מה שהוא מקבל בפרודקשן (קוד שונה, online store לא מעודכן, nulls, יחידות); ה-model מידרדר בשקט בלי שגיאות." } },
  { term: "Concept drift", track: "ai", lesson: "mlops-serving-monitoring", def: { en: "A change in the relationship between inputs and the target, P(y|X), so the same features now predict different outcomes; detectable reliably only once ground-truth labels arrive.", he: "שינוי בקשר בין ה-inputs למטרה, P(y|X), כך שאותם features מנבאים עכשיו תוצאות אחרות; אפשר לזהות אותו באמינות רק כשה-labels של ה-ground truth מגיעים." } },
  { term: "Population Stability Index", track: "ai", lesson: "mlops-serving-monitoring", def: { en: "PSI: a binned drift score, sum of (actual% - expected%) x ln(actual%/expected%); rule of thumb under 0.1 stable, 0.1-0.25 moderate, over 0.25 significant shift.", he: "PSI: ציון drift לפי bins, סכום של (actual% - expected%) כפול ln(actual%/expected%); כלל אצבע: מתחת ל-0.1 יציב, 0.1-0.25 בינוני, מעל 0.25 שינוי משמעותי." } }
);

/* ------------------------------------------------------------------ */
/* On-call scenario                                                    */
/* ------------------------------------------------------------------ */
INFRA.scenarios.push({
  id: "model-accuracy-silent-drop",
  icon: "📉",
  title: { en: "The model got dumber and nothing is red", he: "ה-model נהיה טיפש יותר ושום דבר לא אדום" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Monday 10:00. The product analyst escalates: conversion on recommended items is down 15% week over week. No deploys to the recommender service in 3 weeks. Every dashboard you own is green. You're the ML platform on-call.",
        he: "יום שני, 10:00. אנליסטית המוצר מסלימה: ה-conversion על פריטים מומלצים ירד ב-15% שבוע מול שבוע. לא היו deploys לשירות ההמלצות כבר 3 שבועות. כל דשבורד שבאחריותך ירוק. אתה ה-on-call של פלטפורמת ה-ML."
      },
      data: `recsys-ranker (KServe)   replicas 6/6 Ready   p99 41ms (SLO 80ms)   5xx 0.01%
model                    models:/ranker@champion -> v31 (promoted 2026-10-27)
business KPI             rec_conversion  wk-1: 4.1%   this wk: 3.5%   (-15%)
infra alerts             none in 7 days`,
      choices: [
        { label: { en: "Look at the model's output: has the score distribution changed this week?", he: "להסתכל על הפלט של ה-model: האם התפלגות הציונים השתנתה השבוע?" }, next: "s2", score: 15,
          feedback: { en: "Right instinct. When infra is green and the KPI drops, the model's inputs or outputs changed. Prediction drift is the cheapest first signal.", he: "אינסטינקט נכון. כשהתשתית ירוקה וה-KPI יורד, משהו השתנה ב-inputs או ב-outputs של ה-model. Prediction drift הוא הסיגנל הראשון הכי זול." } },
        { label: { en: "Roll the model back to v30", he: "לעשות rollback ל-model לגרסה v30" }, next: "s1b", score: -5,
          feedback: { en: "v31 has been serving fine for three weeks, and the drop started last week. Rolling back without a hypothesis changes a variable that probably isn't the cause.", he: "v31 מגיש בסדר כבר שלושה שבועות, והירידה התחילה בשבוע שעבר. Rollback בלי השערה משנה משתנה שכנראה הוא לא הסיבה." } },
        { label: { en: "It's probably seasonality, wait another week", he: "זו כנראה עונתיות, נחכה עוד שבוע" }, next: "lose", score: -15,
          feedback: { en: "Another week of a 15% drop is real money, and you haven't checked anything yet.", he: "עוד שבוע של ירידה של 15% זה כסף אמיתי, ועוד לא בדקת כלום." } }
      ]
    },
    s1b: {
      text: {
        en: "You moved @champion back to v30. Two days later conversion is still down 14%. You lost two days and the analyst is now asking for an incident review.",
        he: "הזזת את @champion חזרה ל-v30. יומיים אחרי, ה-conversion עדיין למטה ב-14%. הפסדת יומיים, והאנליסטית כבר מבקשת incident review."
      },
      choices: [
        { label: { en: "Restore v31 and look at what the model is actually receiving and returning", he: "להחזיר את v31 ולבדוק מה ה-model באמת מקבל ומחזיר" }, next: "s2", score: 5,
          feedback: { en: "Good recovery. Both versions behave the same, which points away from the model and toward its inputs.", he: "התאוששות טובה. שתי הגרסאות מתנהגות אותו דבר, וזה מצביע הרחק מה-model ולכיוון ה-inputs שלו." } }
      ]
    },
    s2: {
      text: {
        en: "The prediction log shows the ranker's scores shifted sharply around Tuesday last week. Same model version before and after.",
        he: "ה-prediction log מראה שהציונים של ה-ranker זזו בחדות בסביבות יום שלישי בשבוע שעבר. אותה גרסת model לפני ואחרי."
      },
      data: `score histogram (share of candidates)       wk-2      wk-1 (from Tue)
  score < 0.1                                22%       61%
  0.1 - 0.5                                  51%       30%
  > 0.5                                      27%        9%
prediction PSI vs training reference: 0.71
model_version in logs: v31 (100% both weeks)`,
      choices: [
        { label: { en: "Compute per-feature drift: serving features of the last 7 days vs the training set", he: "לחשב drift לכל feature: ה-features ב-serving של 7 הימים האחרונים מול ה-training set" }, next: "s3", score: 15,
          feedback: { en: "Exactly. Same model, different outputs means different inputs. Find which feature moved.", he: "בדיוק. אותו model, פלט שונה, משמע inputs שונים. צריך למצוא איזה feature זז." } },
        { label: { en: "Trigger the retraining pipeline on last week's data so the model adapts", he: "להפעיל את ה-pipeline של ה-retraining על הדאטה של השבוע שעבר כדי שה-model יסתגל" }, next: "s2b", score: -10,
          feedback: { en: "If the shift is a data bug, retraining teaches the model the bug, and now training and serving agree on garbage.", he: "אם ה-shift הוא באג בדאטה, ה-retraining מלמד את ה-model את הבאג, ועכשיו ה-training וה-serving מסכימים על זבל." } }
      ]
    },
    s2b: {
      text: {
        en: "The retraining pipeline's evaluation gate fails: val NDCG drops from 0.412 to 0.297 because the new training window mixes old and new feature values. The gate saved you, but you still don't know the cause.",
        he: "שער ה-evaluation של ה-pipeline נכשל: ה-NDCG על ה-validation יורד מ-0.412 ל-0.297, כי חלון ה-training החדש מערבב ערכי features ישנים וחדשים. השער הציל אותך, אבל עדיין אתה לא יודע מה הסיבה."
      },
      choices: [
        { label: { en: "Go back and compare feature distributions per feature", he: "לחזור אחורה ולהשוות התפלגויות לכל feature" }, next: "s3", score: 5,
          feedback: { en: "Good. Find the moved feature before touching the model.", he: "טוב. קודם מוצאים את ה-feature שזז, ורק אז נוגעים ב-model." } }
      ]
    },
    s3: {
      text: {
        en: "The drift report on serving features vs the training reference has one obvious outlier.",
        he: "דוח ה-drift על ה-features ב-serving מול ה-reference של ה-training מראה חריג אחד ברור."
      },
      data: `feature                 PSI     train median   serving median (7d)
item_price              5.12        49.99          4999.00
user_ctr_30d            0.04        0.031          0.030
item_category           0.02        -              -
days_since_last_buy     0.06        12             13
null rate item_price    train 0.1%  serving 0.1%
first shifted window:   2026-11-10 06:00 UTC`,
      choices: [
        { label: { en: "Look at what changed upstream for item_price around Nov 10 06:00 (catalog service, schema, data contract)", he: "לבדוק מה השתנה ב-upstream של item_price בסביבות 10 בנובמבר ב-06:00 (שירות הקטלוג, ה-schema, ה-data contract)" }, next: "s4", score: 15,
          feedback: { en: "A 100x jump in the median is a unit change, not a market shift. Find the upstream change.", he: "קפיצה של פי 100 בחציון זה שינוי יחידות, לא שינוי בשוק. צריך למצוא את השינוי ב-upstream." } },
        { label: { en: "Clip item_price at the training max in the serving code and move on", he: "לחתוך את item_price למקסימום של ה-training בקוד ה-serving ולהמשיך הלאה" }, next: "s4", score: 0,
          feedback: { en: "It limits the damage a bit, but every item now looks like the most expensive one. Treat the cause, not the symptom.", he: "זה מגביל קצת את הנזק, אבל עכשיו כל פריט נראה כמו היקר ביותר. צריך לטפל בסיבה, לא בסימפטום." } }
      ]
    },
    s4: {
      text: {
        en: "Found it. On Nov 10 the catalog team migrated price to integer cents (a documented change in their API changelog). The nightly offline pipeline converts it back to dollars, but the streaming job that writes item_price to the online feature store reads the raw field. Training data is in dollars, serving is in cents: classic training/serving skew.",
        he: "מצאת. ב-10 בנובמבר צוות הקטלוג העביר את המחיר לסנטים כמספר שלם (שינוי מתועד ב-changelog של ה-API שלהם). ה-pipeline הלילי של ה-offline ממיר בחזרה לדולרים, אבל ה-streaming job שכותב את item_price ל-online feature store קורא את השדה הגולמי. דאטה של training בדולרים, serving בסנטים: training/serving skew קלאסי."
      },
      data: `$ git log --oneline -1 -- catalog-api/schema/item.avsc
9e1f2a7 (2026-11-10) price: decimal dollars -> int64 cents (price_cents), keep 'price' alias 30 days

$ feast feature-views describe item_stats | grep -A2 item_price
  item_price: source=kafka.catalog.items field=price   # online push: raw field
offline batch transform: price_cents / 100.0                # nightly: converted`,
      choices: [
        { label: { en: "Hotfix the streaming feature job to divide by 100, backfill the online store, verify PSI drops, then monitor the KPI", he: "לעשות hotfix ל-streaming job של ה-feature שיחלק ב-100, לעשות backfill ל-online store, לוודא שה-PSI יורד, ואז לעקוב אחרי ה-KPI" }, next: "s5", score: 20,
          feedback: { en: "Correct fix at the source of the skew, with verification. Within an hour of the backfill the serving median is 49.80 and PSI is 0.03.", he: "תיקון נכון במקור ה-skew, עם אימות. תוך שעה מה-backfill החציון ב-serving הוא 49.80 וה-PSI הוא 0.03." } },
        { label: { en: "Retrain the model on the new cents-based online values", he: "לאמן מחדש את ה-model על הערכים החדשים בסנטים מה-online" }, next: "lose", score: -15,
          feedback: { en: "Offline data is still in dollars, so training and serving would still disagree, and you'd have bound the model to a pipeline bug.", he: "הדאטה ב-offline עדיין בדולרים, אז ה-training וה-serving עדיין לא יסכימו, וקשרת את ה-model לבאג ב-pipeline." } },
        { label: { en: "Ask the catalog team to revert their change", he: "לבקש מצוות הקטלוג לבטל את השינוי שלהם" }, next: "s5", score: 5,
          feedback: { en: "Works short-term, but their change was valid and announced. The bug is that your two feature paths read the field differently.", he: "עובד לטווח קצר, אבל השינוי שלהם היה לגיטימי ומתועד. הבאג הוא ששני נתיבי ה-features שלך קוראים את השדה בצורה שונה." } }
      ]
    },
    s5: {
      text: {
        en: "Conversion recovers to 4.0% within two days. In the postmortem, which follow-up matters most?",
        he: "ה-conversion חוזר ל-4.0% תוך יומיים. ב-postmortem, איזה follow-up הכי חשוב?"
      },
      choices: [
        { label: { en: "One feature definition for both paths, data contracts with units and ranges on item_price, and a daily PSI skew alert on online features vs training", he: "הגדרה אחת ל-feature בשני הנתיבים, data contracts עם יחידות וטווחים על item_price, והתראת skew יומית לפי PSI על ה-features ב-online מול ה-training" }, next: "win", score: 20,
          feedback: { en: "This fixes the class of bug: the same transformation code for offline and online, validation that rejects a 100x jump, and an alert that would have fired on Nov 10 instead of a week later.", he: "זה מתקן את כל סוג הבאג: אותו קוד טרנספורמציה ל-offline ול-online, ולידציה שדוחה קפיצה של פי 100, והתראה שהייתה קופצת ב-10 בנובמבר במקום שבוע אחרי." } },
        { label: { en: "Add a latency alert on the ranker", he: "להוסיף התראת latency על ה-ranker" }, next: "s5", score: -5,
          feedback: { en: "Latency was 41 ms the whole time. This incident was invisible to infra metrics; you need data and prediction monitoring.", he: "ה-latency היה 41 ms כל הזמן. האירוע הזה היה בלתי נראה למטריקות תשתית; צריך ניטור של דאטה ושל predictions." } }
      ]
    },
    win: {
      text: {
        en: "Resolved. You went from KPI → prediction drift → feature drift → upstream unit change, fixed the skew at its source, and added the contract and the alert that make it a 1-hour incident next time instead of a 1-week one.",
        he: "נפתר. עברת מ-KPI ל-prediction drift, משם ל-drift ב-feature ומשם לשינוי יחידות ב-upstream, תיקנת את ה-skew במקור, והוספת את ה-contract וההתראה שיהפכו את זה בפעם הבאה לאירוע של שעה במקום של שבוע."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The KPI keeps sliding and the root cause is still live. Lesson: when infra is green and the business metric drops, follow the data: outputs, then per-feature drift, then upstream changes. Never retrain or wait before you know why.",
        he: "ה-KPI ממשיך לרדת והסיבה עדיין פעילה. השיעור: כשהתשתית ירוקה והמטריקה העסקית יורדת, הולכים אחרי הדאטה: הפלט, אחר כך drift לכל feature, ואז שינויים ב-upstream. אף פעם לא מאמנים מחדש ולא מחכים לפני שיודעים למה."
      },
      end: "lose"
    }
  },
  lessons: ["mlops-serving-monitoring", "mlops-training-pipelines"]
});
