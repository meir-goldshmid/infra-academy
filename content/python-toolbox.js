window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

(function () {
/* Shared code blocks (identical in both languages). Escaped for HTML: &lt; &gt; &amp; */

const PY_BOTO_SESSION = `# ~/.aws/config: boto3 refreshes assume-role credentials from a profile by itself
[profile audit-prod]
role_arn          = arn:aws:iam::111122223333:role/OrgAuditRole
source_profile    = sso-admin
role_session_name = tag-audit
duration_seconds  = 3600
region            = eu-west-1</pre>
<pre>import boto3
from botocore.config import Config

CFG = Config(retries={"mode": "standard", "total_max_attempts": 6},
             connect_timeout=5, read_timeout=60, max_pool_connections=50)

sess = boto3.Session(profile_name="audit-prod")
print(sess.client("sts").get_caller_identity()["Arn"])   # always print who you are
ec2 = sess.client("ec2", region_name="eu-west-1", config=CFG)

# Cross-account loop with raw STS: static keys that expire and are NOT refreshed
def creds_for(account_id: str, role: str) -&gt; dict:
    c = boto3.client("sts").assume_role(
        RoleArn=f"arn:aws:iam::{account_id}:role/{role}",
        RoleSessionName="tag-audit", DurationSeconds=3600)["Credentials"]
    return {"aws_access_key_id": c["AccessKeyId"],
            "aws_secret_access_key": c["SecretAccessKey"],
            "aws_session_token": c["SessionToken"]}   # dies at c["Expiration"]`;

const PY_PAGINATE = `s3 = boto3.client("s3")

# BUG: at most 1,000 keys. IsTruncated=True is ignored, the report is silently wrong
keys = [o["Key"] for o in s3.list_objects_v2(Bucket="logs-prod")["Contents"]]

# Correct: the paginator follows ContinuationToken for you
pages = s3.get_paginator("list_objects_v2").paginate(
    Bucket="logs-prod", Prefix="alb/2026/11/", PaginationConfig={"PageSize": 1000})
total_bytes = 0
for page in pages:
    total_bytes += sum(o["Size"] for o in page.get("Contents", []))  # empty prefix: no "Contents" key

# JMESPath across every page (EC2 nests instances inside reservations)
ec2 = boto3.client("ec2", region_name="eu-west-1")
for inst in ec2.get_paginator("describe_instances").paginate().search("Reservations[].Instances[]"):
    print(inst["InstanceId"], inst["State"]["Name"])

# Waiter: poll until a state is reached, then raise WaiterError if it never is
ec2.stop_instances(InstanceIds=["i-0abc1234def567890"])
ec2.get_waiter("instance_stopped").wait(
    InstanceIds=["i-0abc1234def567890"],
    WaiterConfig={"Delay": 10, "MaxAttempts": 60})        # up to ~10 minutes
print(ec2.waiter_names)                                     # every waiter EC2 ships`;

const PY_K8S = `from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException
from kubernetes.config import ConfigException

try:
    config.load_incluster_config()   # ServiceAccount token + KUBERNETES_SERVICE_HOST
except ConfigException:
    config.load_kube_config()        # ~/.kube/config on a laptop
v1 = client.CoreV1Api()

NS, SEL = "payments", "app=api"
listing = v1.list_namespaced_pod(NS, label_selector=SEL, limit=500)  # more pages: listing.metadata._continue
rv = listing.metadata.resource_version

while True:
    w = watch.Watch()
    try:
        for ev in w.stream(v1.list_namespaced_pod, NS, label_selector=SEL,
                           resource_version=rv, timeout_seconds=300,
                           allow_watch_bookmarks=True):
            obj = ev["object"]
            rv = obj.metadata.resource_version          # remember where we are
            if ev["type"] == "BOOKMARK":
                continue
            print(ev["type"], obj.metadata.name, obj.status.phase)
    except ApiException as e:
        if e.status != 410:                              # 410 Gone: rv was compacted away
            raise
        rv = v1.list_namespaced_pod(NS, label_selector=SEL).metadata.resource_version  # relist`;

const PY_HTTP = `import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

retry = Retry(total=4, connect=3, read=2,
              backoff_factor=0.5, backoff_jitter=0.3,          # 0.5s, 1s, 2s ... + jitter
              status_forcelist=(429, 502, 503, 504),
              allowed_methods=frozenset({"GET", "HEAD", "PUT", "DELETE", "OPTIONS"}),  # no POST
              respect_retry_after_header=True, raise_on_status=False)
s = requests.Session()                                         # reuses TCP+TLS connections
s.mount("https://", HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=32))
r = s.get("https://cmdb.example.internal/api/v1/hosts", timeout=(3.05, 20))  # (connect, read)
r.raise_for_status()</pre>
<pre>import httpx

transport = httpx.HTTPTransport(
    retries=2,                                   # connection errors only, never on status codes
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20))
cmdb = httpx.Client(base_url="https://cmdb.example.internal",
                    timeout=httpx.Timeout(10.0, connect=3.0),   # httpx default is 5s
                    transport=transport,
                    headers={"User-Agent": "infra-audit/0.3"})

def check_health(c: httpx.Client) -&gt; bool:
    try:
        return c.get("/health").status_code == 200
    except httpx.TransportError:
        return False`;

const PY_SETTINGS = `from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AUDIT_", env_file=".env")

    accounts: list[str] = Field(min_length=1)       # env value is JSON: '["111122223333"]'
    role_name: str = "OrgAuditRole"
    workers: int = Field(16, ge=1, le=64)
    slack_webhook: SecretStr | None = None          # repr shows '**********'

    @field_validator("accounts")
    @classmethod
    def twelve_digits(cls, v: list[str]) -&gt; list[str]:
        bad = [a for a in v if not (a.isdigit() and len(a) == 12)]
        if bad:
            raise ValueError(f"not AWS account ids: {bad}")
        return v

settings = Settings()   # fails fast with a ValidationError that names every bad field</pre>
<pre>$ AUDIT_ACCOUNTS='["12345"]' AUDIT_WORKERS=500 python -c "import cfg"
pydantic_core._pydantic_core.ValidationError: 2 validation errors for Settings
accounts
  Value error, not AWS account ids: ['12345'] [type=value_error, ...]
workers
  Input should be less than or equal to 64 [type=less_than_equal, ...]`;

const PY_AUDIT = `# /// script
# requires-python = "&gt;=3.11"
# dependencies = ["boto3", "typer"]
# ///
"""Untagged EC2 instances and unattached EBS volumes, across accounts and regions."""
import csv
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Annotated

import boto3
import typer
from botocore.config import Config
from botocore.exceptions import ClientError

CFG = Config(retries={"mode": "standard", "total_max_attempts": 8},
             connect_timeout=5, read_timeout=30)
REQUIRED = {"owner", "cost-center"}
app = typer.Typer()

def creds_for(account_id: str, role: str) -&gt; dict:
    c = boto3.client("sts").assume_role(
        RoleArn=f"arn:aws:iam::{account_id}:role/{role}",
        RoleSessionName="tag-audit")["Credentials"]
    return {"aws_access_key_id": c["AccessKeyId"],
            "aws_secret_access_key": c["SecretAccessKey"],
            "aws_session_token": c["SessionToken"]}

def scan(creds: dict, account_id: str, region: str) -&gt; list[tuple]:
    # One Session per thread: Sessions are not thread-safe, clients are
    ec2 = boto3.Session(**creds).client("ec2", region_name=region, config=CFG)
    rows = []
    instances = ec2.get_paginator("describe_instances").paginate(
        Filters=[{"Name": "instance-state-name", "Values": ["running", "stopped"]}])
    for inst in instances.search("Reservations[].Instances[]"):
        tags = {t["Key"].lower() for t in inst.get("Tags", [])}
        if missing := REQUIRED - tags:
            rows.append((account_id, region, "ec2", inst["InstanceId"],
                         "missing tags: " + ",".join(sorted(missing))))
    volumes = ec2.get_paginator("describe_volumes").paginate(
        Filters=[{"Name": "status", "Values": ["available"]}])
    for vol in volumes.search("Volumes[]"):
        rows.append((account_id, region, "ebs", vol["VolumeId"],
                     f"unattached {vol['Size']} GiB since {vol['CreateTime']:%Y-%m-%d}"))
    return rows

@app.command()
def main(account: Annotated[list[str], typer.Option(help="Repeat per account")],
         role: str = "OrgAuditRole", workers: int = 16):
    jobs = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for acct in account:
            creds = creds_for(acct, role)
            regions = [r["RegionName"] for r in boto3.Session(**creds)
                       .client("ec2", region_name="us-east-1").describe_regions()["Regions"]]
            for region in regions:                       # enabled regions only
                jobs[pool.submit(scan, creds, acct, region)] = (acct, region)
        out = csv.writer(sys.stdout)
        out.writerow(["account", "region", "kind", "id", "finding"])
        for fut in as_completed(jobs):                   # results stream as they finish
            try:
                out.writerows(fut.result())
            except ClientError as e:
                print(f"skip {jobs[fut]}: {e.response['Error']['Code']}", file=sys.stderr)

if __name__ == "__main__":
    app()`;

const PY_TESTS = `# test_audit.py   (run: uv run pytest -q)
import boto3, httpx, pytest, respx
from botocore.exceptions import ClientError
from botocore.stub import Stubber
from moto import mock_aws
from audit import scan
from cfg import check_health

FAKE = {"aws_access_key_id": "testing", "aws_secret_access_key": "testing",
        "aws_session_token": "testing"}

@mock_aws                                   # moto 5: one decorator mocks every service
def test_finds_untagged_instance_and_loose_volume():
    ec2 = boto3.client("ec2", region_name="eu-west-1", **FAKE)
    ami = ec2.describe_images(Owners=["amazon"])["Images"][0]["ImageId"]
    ec2.run_instances(ImageId=ami, MinCount=1, MaxCount=1, TagSpecifications=[
        {"ResourceType": "instance", "Tags": [{"Key": "owner", "Value": "team-a"}]}])
    ec2.create_volume(Size=50, AvailabilityZone="eu-west-1a")
    kinds = sorted(r[2] for r in scan(FAKE, "123456789012", "eu-west-1"))
    assert kinds == ["ebs", "ec2"]

def test_access_denied_is_raised():           # Stubber: exact responses, no network
    ec2 = boto3.client("ec2", region_name="eu-west-1", **FAKE)
    with Stubber(ec2) as stub:
        stub.add_client_error("describe_instances", service_error_code="UnauthorizedOperation",
                              http_status_code=403)
        with pytest.raises(ClientError):
            ec2.describe_instances()

@respx.mock
def test_health_503_is_unhealthy():
    route = respx.get("https://cmdb.example.internal/health").mock(
        return_value=httpx.Response(503))
    assert check_health(httpx.Client(base_url="https://cmdb.example.internal")) is False
    assert route.call_count == 1`;

const TOML_PROJECT = `# pyproject.toml   (created by: uv init --package infra-audit)
[project]
name = "infra-audit"
version = "0.3.0"
requires-python = "&gt;=3.11"
dependencies = ["boto3&gt;=1.35", "typer&gt;=0.12", "pydantic-settings&gt;=2.4", "httpx&gt;=0.27"]

[project.scripts]
infra-audit = "infra_audit.cli:app"      # installs an 'infra-audit' command

[dependency-groups]
dev = ["pytest&gt;=8", "moto[ec2]&gt;=5", "respx&gt;=0.21"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"</pre>
<pre>uv add boto3 typer                # updates pyproject.toml + uv.lock
uv add --dev pytest "moto[ec2]" respx
uv run pytest -q                  # creates .venv on first run
uv sync --locked                  # CI: fail if uv.lock is stale
uv tool install .                 # 'infra-audit' on your PATH, isolated venv
uv run audit.py --account 111122223333   # single-file script: reads the # /// script header`;

/* ---------------- data lesson code ---------------- */

const PY_NUMPY = `import numpy as np

lat = np.loadtxt("latency_ms.txt")           # 5,000,000 numbers, one per line

# Python loop: ~0.3-0.5 s, every element is a boxed Python float
slow_ratio = sum(1 for x in lat if x &gt; 500) / len(lat)

# Vectorized: ~5 ms, one C loop over a contiguous float64 buffer
slow_ratio = (lat &gt; 500).mean()

p50, p95, p99 = np.percentile(lat, [50, 95, 99])           # method="linear" by default
print(f"p50={p50:.0f}ms p95={p95:.0f}ms p99={p99:.0f}ms  &gt;500ms={slow_ratio:.2%}")
# p50=41ms p95=212ms p99=780ms  &gt;500ms=1.63%`;

const PY_PANDAS = `import pandas as pd

logs = pd.read_parquet("access/2026-11/",                    # a directory of Parquet files
                       columns=["ts", "service", "status", "latency_ms"])
logs["is_err"] = logs["status"] &gt;= 500

per_svc = logs.groupby("service").agg(                       # named aggregation
    reqs=("status", "size"),
    errors=("is_err", "sum"),
    p50=("latency_ms", "median"),
)
per_svc["p99"] = logs.groupby("service")["latency_ms"].quantile(0.99)
per_svc["err_rate"] = per_svc["errors"] / per_svc["reqs"]

owners = pd.read_csv("service_owners.csv")                   # service,team,tier
report = per_svc.reset_index().merge(owners, on="service", how="left",
                                     validate="one_to_one", indicator=True)
print(report[report["_merge"] == "left_only"])               # services nobody owns</pre>
<pre># Capacity forecast: daily peak cores, 28-day rolling mean, days until 80% of quota
cpu = (pd.read_csv("cluster_cpu.csv", parse_dates=["ts"])      # ts,cores_used (1-min samples)
         .set_index("ts").sort_index())
daily_peak = cpu["cores_used"].resample("1D").max()          # use "h", "min", "ME", not "H", "T", "M"
trend = daily_peak.rolling("28D").mean()
growth_per_day = (trend.iloc[-1] - trend.iloc[-29]) / 28     # needs 29+ days of history
headroom = 640 * 0.8 - daily_peak.iloc[-7:].max()            # 640-core quota, alert at 80%
if growth_per_day &gt; 0:
    print(f"~{headroom / growth_per_day:.0f} days until 80% of quota")`;

const PY_PANDAS_TRAPS = `# pandas 3.0: Copy-on-Write is the only mode
prod = df[df["env"] == "prod"]
prod["cost"] = prod["cost"] * 1.17          # changes prod only, never df, no warning
df[df["env"] == "prod"]["cost"] = 0          # chained assignment: does NOTHING (ChainedAssignmentError warning)
df.loc[df["env"] == "prod", "cost"] = 0      # the one correct way

# Memory: measure first, then shrink
print(df.memory_usage(deep=True).sum() / 2**20, "MiB")
df["service"] = df["service"].astype("category")    # 50 distinct values in 20M rows: ~20x smaller
cur = pd.read_csv("cur.csv.gz", engine="pyarrow",
                  usecols=["line_item_product_code", "line_item_unblended_cost"],
                  dtype={"line_item_product_code": "category"})

# Bigger than RAM: stream chunks and combine partial aggregates
totals = None
for chunk in pd.read_csv("alb-2026-11.csv.gz", usecols=["service", "bytes"],
                         chunksize=1_000_000):
    part = chunk.groupby("service")["bytes"].sum()
    totals = part if totals is None else totals.add(part, fill_value=0)

# apply(axis=1) is a Python loop in disguise
df["gb"] = df.apply(lambda r: r["bytes"] / 1e9, axis=1)   # ~seconds per million rows
df["gb"] = df["bytes"] / 1e9                               # ~milliseconds
df["tier"] = np.select([df["p99"] &gt; 1000, df["p99"] &gt; 300], ["red", "amber"], default="green")`;

const PY_POLARS = `import polars as pl

q = (pl.scan_parquet("access/2026-11/*.parquet")             # lazy: nothing is read yet
       .filter(pl.col("status") &lt; 500)
       .with_columns(pl.col("ts").dt.truncate("5m").alias("bucket"))
       .group_by("service", "bucket")
       .agg(pl.len().alias("reqs"),
            pl.col("latency_ms").quantile(0.50).alias("p50"),
            pl.col("latency_ms").quantile(0.95).alias("p95"),
            pl.col("latency_ms").quantile(0.99).alias("p99"))
       .sort("service", "bucket"))

print(q.explain())                       # shows projection + predicate pushdown into the scan
df = q.collect(engine="streaming")       # all cores, processes in batches, larger-than-RAM OK
q.sink_parquet("latency_5m.parquet")     # or stream the result straight to disk
pdf = df.to_pandas()                     # hand off to plotting / statsmodels if needed`;

const PY_DUCKDB = `import duckdb

con = duckdb.connect()                                   # in-memory; spills to disk when needed
con.sql("CREATE SECRET cur (TYPE s3, PROVIDER credential_chain)")   # httpfs autoloads

monthly = con.sql("""
  SELECT date_trunc('month', line_item_usage_start_date)   AS month,
         line_item_product_code                            AS service,
         coalesce(resource_tags['user_team'], 'UNTAGGED')  AS team,
         round(sum(line_item_unblended_cost), 2)           AS cost
  FROM read_parquet('s3://billing-exports/cur2/data/BILLING_PERIOD=*/*.parquet',
                    hive_partitioning = true)
  WHERE BILLING_PERIOD &gt;= '2026-06'
  GROUP BY ALL
  ORDER BY month, cost DESC
""").df()                                                # or .pl() for Polars, .arrow()

by_team = monthly.pivot_table(index="team", columns="month", values="cost",
                              aggfunc="sum", fill_value=0)

# DuckDB can query a pandas/Polars DataFrame in scope by its variable name
logs = monthly  # any DataFrame
duckdb.sql("SELECT service, sum(cost) FROM logs GROUP BY ALL ORDER BY 2 DESC LIMIT 5").show()

# Percentiles straight from Parquet, no Python loop
duckdb.sql("""SELECT service, quantile_cont(latency_ms, [0.5, 0.95, 0.99]) AS p
              FROM 'access/2026-11/*.parquet' GROUP BY ALL""").show()`;

const TABLE_PICK_EN = `<table>
<tr><th>Data size (on one machine)</th><th>Pick</th><th>Why</th></tr>
<tr><td>Arrays of numbers, any size that fits</td><td>NumPy</td><td>Vectorized math, percentiles, histograms; the engine under pandas</td></tr>
<tr><td>Up to ~1-2 GB, interactive work</td><td>pandas</td><td>Biggest ecosystem (plotting, statsmodels, scikit-learn), everyone reads it. Rule of thumb: wants 5-10x the data size in RAM</td></tr>
<tr><td>~1 GB to tens of GB, pipelines</td><td>Polars</td><td>Multi-core Rust engine, lazy query optimizer, streaming engine; usually 5-20x faster than pandas</td></tr>
<tr><td>Tens to hundreds of GB, SQL-shaped questions, files on S3</td><td>DuckDB</td><td>SQL on Parquet/CSV/S3 with no load step, out-of-core spilling, often the fastest path on a laptop</td></tr>
<tr><td>TBs, many users, or scheduled at scale</td><td>Athena/Trino, BigQuery, ClickHouse, Spark</td><td>Distributed engines; your laptop is no longer the right place</td></tr>
</table>`;

const TABLE_PICK_HE = `<table>
<tr><th>גודל הנתונים (על מכונה אחת)</th><th>מה לבחור</th><th>למה</th></tr>
<tr><td>מערכים של מספרים, כל גודל שנכנס ל-RAM</td><td>NumPy</td><td>מתמטיקה וקטורית, percentiles, היסטוגרמות. זה המנוע שמתחת ל-pandas</td></tr>
<tr><td>עד ~1-2 GB, עבודה אינטראקטיבית</td><td>pandas</td><td>האקוסיסטם הכי גדול (plotting, statsmodels, scikit-learn), וכולם יודעים לקרוא אותו. כלל אצבע: צריך פי 5-10 מגודל הנתונים ב-RAM</td></tr>
<tr><td>~1 GB עד עשרות GB, pipelines</td><td>Polars</td><td>מנוע Rust מרובה ליבות, query optimizer עצל ו-streaming engine. בדרך כלל פי 5-20 יותר מהיר מ-pandas</td></tr>
<tr><td>עשרות עד מאות GB, שאלות בצורת SQL, קבצים ב-S3</td><td>DuckDB</td><td>SQL ישר על Parquet/CSV/S3 בלי שלב טעינה, spill לדיסק כשה-RAM נגמר. הרבה פעמים הדרך הכי מהירה על לפטופ</td></tr>
<tr><td>TBs, הרבה משתמשים, או ריצה מתוזמנת ב-scale</td><td>Athena/Trino, BigQuery, ClickHouse, Spark</td><td>מנועים מבוזרים. הלפטופ כבר לא המקום הנכון</td></tr>
</table>`;

/* ================================================================== */
INFRA.lessons.push({
  id: "python-infra-toolbox",
  track: "cloud",
  order: 85,
  icon: "🐍",
  level: 2,
  minutes: 16,
  title: { en: "The Python Toolbox for Infra Automation", he: "ארגז הכלים של Python לאוטומציית תשתיות" },
  tldr: {
    en: "Most infra scripts break the same five ways: they read only the first page, they have no timeout, they retry the wrong things, their credentials expire mid-run, and nobody can test them. boto3 paginators and retry config, the kubernetes client's watch with resourceVersion, httpx/requests with explicit timeouts, pydantic-settings, typer, a ThreadPoolExecutor, moto/respx tests and a uv project fix all five.",
    he: "רוב סקריפטי התשתית נשברים באותן חמש דרכים: קוראים רק את העמוד הראשון, אין timeout, עושים retry לדברים הלא נכונים, ה-credentials פגים באמצע הריצה, ואי אפשר לבדוק אותם. paginators ו-retry config של boto3, ה-watch של ה-client של Kubernetes עם resourceVersion, httpx/requests עם timeouts מפורשים, pydantic-settings, typer, ThreadPoolExecutor, בדיקות עם moto/respx ופרויקט uv פותרים את כל החמש."
  },
  analogy: {
    en: "A script is a field technician sent to count servers in 40 data centers. A bad one visits the first room of each building and reports 'all counted' (no paginator), waits forever at a locked door (no timeout), kicks a door that said 'come back later' ten times in a second (no backoff), and keeps working after his badge expired at noon (no credential refresh). The toolbox in this lesson is the checklist you hand him before he leaves.",
    he: "סקריפט הוא טכנאי שטח שנשלח לספור שרתים ב-40 חוות שרתים. טכנאי גרוע נכנס לחדר הראשון בכל בניין ומדווח 'ספרתי הכל' (אין paginator), מחכה לנצח מול דלת נעולה (אין timeout), דופק עשר פעמים בשנייה על דלת שכתוב עליה 'תחזור אחר כך' (אין backoff), וממשיך לעבוד אחרי שהתג שלו פג בצהריים (אין רענון credentials). ארגז הכלים בשיעור הזה הוא ה-checklist שאתה נותן לו לפני שהוא יוצא."
  },
  sections: [
    {
      h: { en: "boto3: sessions, assume-role, regions, client vs resource", he: "boto3: sessions, assume-role, regions, ו-client מול resource" },
      body: {
        en: `<p>A <code>Session</code> holds credentials and a default region; a <strong>client</strong> is a thin, generated wrapper over one service's API in one region. Get the identity right first, then everything else:</p>
<pre>${PY_BOTO_SESSION}</pre>
<ul>
<li><strong>Credential refresh.</strong> Profiles with <code>role_arn</code> (and SSO profiles) give refreshable credentials: a 6-hour job just keeps working. Keys you get from a raw <code>sts.assume_role()</code> call are static: they die at <code>Expiration</code> (default 1 hour, max is the role's <code>MaxSessionDuration</code>, and <strong>role chaining caps it at 1 hour</strong>). For long cross-account jobs, re-assume per batch or use a profile per account.</li>
<li><strong>Regions.</strong> No region means <code>NoRegionError</code>, or worse, a silently wrong default from someone's <code>~/.aws/config</code>. Pass <code>region_name</code> explicitly. IAM, Organizations and Route 53 are global; Cost Explorer (<code>ce</code>) answers from <code>us-east-1</code>; ACM certificates for CloudFront must live in <code>us-east-1</code>. <code>describe_regions()</code> returns only regions <em>enabled</em> for the account; opt-in regions you never enabled are invisible unless you pass <code>AllRegions=True</code>.</li>
<li><strong>Client vs resource.</strong> <code>boto3.resource("ec2")</code> gives friendly objects (<code>ec2.instances.filter(...)</code>), but AWS has frozen the resource interface: no new services or features, and resources are not thread-safe. Use clients for anything new. Clients are thread-safe; Sessions are not, so create one Session per thread.</li>
</ul>
<blockquote>💡 Real world: the most common "the script says we have no untagged instances" bug is a script that ran with the wrong profile in the wrong region. Print <code>get_caller_identity()["Arn"]</code> and the region at startup, always. IAM details: <code>cloud-aws-iam-deep</code>.</blockquote>`,
        he: `<p>ה-<code>Session</code> מחזיק credentials ו-region ברירת מחדל. ה-<strong>client</strong> הוא wrapper דק ומג'ונרט מעל ה-API של שירות אחד ב-region אחד. קודם כל לסדר את ה-identity, ורק אחר כך את השאר:</p>
<pre>${PY_BOTO_SESSION}</pre>
<ul>
<li><strong>רענון credentials.</strong> Profile עם <code>role_arn</code> (וגם profiles של SSO) נותן credentials שמתרעננים לבד: job של 6 שעות פשוט ממשיך לעבוד. המפתחות שמקבלים מקריאה ישירה ל-<code>sts.assume_role()</code> הם סטטיים: הם מתים ב-<code>Expiration</code> (ברירת מחדל שעה, המקסימום הוא ה-<code>MaxSessionDuration</code> של ה-role, ו-<strong>role chaining מגביל לשעה אחת</strong>). ב-jobs ארוכים בין חשבונות, תעשה assume מחדש לכל batch או תשתמש ב-profile לכל חשבון.</li>
<li><strong>Regions.</strong> בלי region מקבלים <code>NoRegionError</code>, או גרוע מזה, ברירת מחדל שגויה בשקט מה-<code>~/.aws/config</code> של מישהו. תעביר <code>region_name</code> במפורש. IAM, Organizations ו-Route 53 הם גלובליים. Cost Explorer (<code>ce</code>) עונה מ-<code>us-east-1</code>. תעודות ACM ל-CloudFront חייבות לשבת ב-<code>us-east-1</code>. הקריאה <code>describe_regions()</code> מחזירה רק regions ש<em>מופעלים</em> בחשבון. regions מסוג opt-in שלא הפעלת לא נראים בכלל, אלא אם תעביר <code>AllRegions=True</code>.</li>
<li><strong>Client מול resource.</strong> הקריאה <code>boto3.resource("ec2")</code> נותנת אובייקטים נוחים (<code>ec2.instances.filter(...)</code>), אבל AWS הקפיאו את ממשק ה-resource: אין שירותים או פיצ'רים חדשים, ו-resources לא thread-safe. לכל דבר חדש תשתמש ב-clients. Clients הם thread-safe, אבל Sessions לא, אז תיצור Session לכל thread.</li>
</ul>
<blockquote>💡 Real world: הבאג הכי נפוץ של "הסקריפט אומר שאין לנו instances בלי tags" הוא סקריפט שרץ עם ה-profile הלא נכון ב-region הלא נכון. תדפיס את <code>get_caller_identity()["Arn"]</code> ואת ה-region בתחילת הריצה, תמיד. פרטים על IAM: <code>cloud-aws-iam-deep</code>.</blockquote>`
      }
    },
    {
      h: { en: "Paginators, waiters and the retry config", he: "Paginators, waiters וה-retry config" },
      body: {
        en: `<p><strong>Bug #1 in infra scripts: reading only the first page.</strong> <code>list_objects_v2</code> returns at most 1,000 keys, IAM <code>list_users</code> 100 by default, Lambda <code>list_functions</code> 50. The call succeeds, the report is wrong, nobody notices. If <code>client.can_paginate("op")</code> is true, use the paginator.</p>
<pre>${PY_PAGINATE}</pre>
<p><strong>Retries.</strong> botocore retries throttling (<code>ThrottlingException</code>, EC2's <code>RequestLimitExceeded</code>), 5xx and connection errors for you, with exponential backoff and jitter:</p>
<table>
<tr><th>Mode</th><th>Behaviour</th><th>Default attempts (incl. first)</th></tr>
<tr><td><code>legacy</code></td><td>Old handler, fewer retryable errors. Was the boto3 default until botocore 1.44</td><td>5</td></tr>
<tr><td><code>standard</code></td><td>Exponential backoff with jitter (max 20 s), more transient and throttling errors, a retry quota that stops retrying during a real outage. <strong>The boto3 default since botocore 1.44 (November 2026)</strong></td><td>3 (DynamoDB: 4)</td></tr>
<tr><td><code>adaptive</code></td><td>Standard plus a client-side token bucket that slows the client down after throttling. Experimental; useful for one process hammering one API</td><td>3</td></tr>
</table>
<p>Watch the naming trap: in a <code>Config</code> object, <code>max_attempts</code> counts <em>retries only</em> (3 means 4 calls) and <code>total_max_attempts</code> counts every call. In <code>~/.aws/config</code> and the <code>AWS_MAX_ATTEMPTS</code> variable, <code>max_attempts</code> counts every call. Pin the mode explicitly (<code>AWS_RETRY_MODE=standard</code> or <code>Config</code>) so behaviour doesn't change when someone upgrades botocore.</p>
<blockquote>⚠️ Production tip: retries multiply. 32 threads x 8 attempts against a throttled API is 256 calls in a burst. Fewer workers with standard or adaptive mode finish sooner than more workers fighting the rate limit (see <code>staff-overload-metastable</code>).</blockquote>`,
        he: `<p><strong>באג מספר 1 בסקריפטי תשתית: לקרוא רק את העמוד הראשון.</strong> הקריאה <code>list_objects_v2</code> מחזירה עד 1,000 keys, ה-<code>list_users</code> של IAM מחזיר 100 כברירת מחדל, ו-<code>list_functions</code> של Lambda מחזיר 50. הקריאה מצליחה, הדוח שגוי, ואף אחד לא שם לב. אם <code>client.can_paginate("op")</code> מחזיר true, תשתמש ב-paginator.</p>
<pre>${PY_PAGINATE}</pre>
<p><strong>Retries.</strong> ה-botocore עושה בשבילך retry ל-throttling (<code>ThrottlingException</code>, וב-EC2 גם <code>RequestLimitExceeded</code>), לשגיאות 5xx ולשגיאות חיבור, עם exponential backoff ו-jitter:</p>
<table>
<tr><th>Mode</th><th>התנהגות</th><th>ניסיונות ברירת מחדל (כולל הראשון)</th></tr>
<tr><td><code>legacy</code></td><td>ה-handler הישן, פחות שגיאות שעוברות retry. היה ברירת המחדל של boto3 עד botocore 1.44</td><td>5</td></tr>
<tr><td><code>standard</code></td><td>Exponential backoff עם jitter (עד 20 שניות), יותר שגיאות transient ו-throttling, ו-retry quota שמפסיקה לנסות בזמן outage אמיתי. <strong>ברירת המחדל של boto3 מאז botocore 1.44 (נובמבר 2026)</strong></td><td>3 (ב-DynamoDB: 4)</td></tr>
<tr><td><code>adaptive</code></td><td>Standard ועוד token bucket בצד ה-client שמאט אותו אחרי throttling. ניסיוני. שימושי ל-process אחד שמפציץ API אחד</td><td>3</td></tr>
</table>
<p>שים לב למלכודת השמות: באובייקט <code>Config</code>, השדה <code>max_attempts</code> סופר <em>רק retries</em> (3 זה 4 קריאות), ו-<code>total_max_attempts</code> סופר את כל הקריאות. ב-<code>~/.aws/config</code> ובמשתנה <code>AWS_MAX_ATTEMPTS</code>, הערך <code>max_attempts</code> סופר את כל הקריאות. תקבע את ה-mode במפורש (<code>AWS_RETRY_MODE=standard</code> או <code>Config</code>) כדי שההתנהגות לא תשתנה כשמישהו משדרג את botocore.</p>
<blockquote>⚠️ Production tip: retries מתכפלים. 32 threads כפול 8 ניסיונות מול API שעושה throttling זה 256 קריאות ב-burst. פחות workers עם mode של standard או adaptive מסיימים מהר יותר מהרבה workers שנלחמים ב-rate limit (ראה <code>staff-overload-metastable</code>).</blockquote>`
      }
    },
    {
      h: { en: "The Kubernetes Python client: in-cluster config, watch, resourceVersion", he: "ה-client של Kubernetes ב-Python: in-cluster config, watch, ו-resourceVersion" },
      body: {
        en: `<p>The official <code>kubernetes</code> package is generated from the OpenAPI spec: <code>CoreV1Api().list_namespaced_pod(...)</code> is exactly <code>GET /api/v1/namespaces/{ns}/pods</code>. The same code runs on your laptop and inside a Pod if you try in-cluster config first:</p>
<pre>${PY_K8S}</pre>
<ul>
<li><strong>List, then watch from the list's resourceVersion.</strong> That is the informer pattern every controller uses: no event is lost between the list and the watch.</li>
<li><strong>Watches end.</strong> The server closes them (<code>timeout_seconds</code>, API server restarts, load balancer idle timeouts). The <code>while True</code> loop is not optional.</li>
<li><strong>410 Gone</strong> means your resourceVersion is older than what etcd still keeps (compaction runs every 5 minutes by default). The only fix is a fresh list. Bookmarks (<code>allow_watch_bookmarks</code>) keep your resourceVersion fresh on quiet watches so this happens less.</li>
<li>Lists are paginated too: pass <code>limit</code> and loop on <code>metadata._continue</code> on large clusters, or one call can return 50 MB of Pods.</li>
</ul>
<blockquote>💡 Real world: anything that must react to changes for weeks (a custom controller) belongs in a real framework such as kopf or controller-runtime in Go, with work queues and leader election. Raw watch loops are right for scripts, audits and one-off migrations. See <code>k8s-operators-crds</code>.</blockquote>`,
        he: `<p>החבילה הרשמית <code>kubernetes</code> מג'ונרטת מה-OpenAPI spec: הקריאה <code>CoreV1Api().list_namespaced_pod(...)</code> היא בדיוק <code>GET /api/v1/namespaces/{ns}/pods</code>. אותו קוד רץ גם על הלפטופ וגם בתוך Pod, אם קודם מנסים in-cluster config:</p>
<pre>${PY_K8S}</pre>
<ul>
<li><strong>קודם list, ואז watch מה-resourceVersion של ה-list.</strong> זו תבנית ה-informer שכל controller משתמש בה: שום event לא הולך לאיבוד בין ה-list ל-watch.</li>
<li><strong>Watches נגמרים.</strong> השרת סוגר אותם (<code>timeout_seconds</code>, restart של ה-API server, idle timeout של load balancer). הלולאה <code>while True</code> היא לא אופציונלית.</li>
<li><strong>410 Gone</strong> אומר שה-resourceVersion שלך ישן יותר ממה ש-etcd עוד שומר (compaction רץ כל 5 דקות כברירת מחדל). הפתרון היחיד הוא list חדש. Bookmarks (<code>allow_watch_bookmarks</code>) שומרים את ה-resourceVersion טרי גם ב-watch שקט, כך שזה קורה פחות.</li>
<li>גם lists מחולקים לעמודים: ב-clusters גדולים תעביר <code>limit</code> ותעשה לולאה על <code>metadata._continue</code>, אחרת קריאה אחת יכולה להחזיר 50 MB של Pods.</li>
</ul>
<blockquote>💡 Real world: כל דבר שצריך להגיב לשינויים במשך שבועות (controller מותאם) שייך ל-framework אמיתי כמו kopf, או controller-runtime ב-Go, עם work queues ו-leader election. לולאות watch גולמיות מתאימות לסקריפטים, audits ו-migrations חד-פעמיים. ראה <code>k8s-operators-crds</code>.</blockquote>`
      }
    },
    {
      h: { en: "HTTP done right: timeouts, safe retries, connection pooling", he: "HTTP כמו שצריך: timeouts, retries בטוחים ו-connection pooling" },
      body: {
        en: `<p><strong>requests has no default timeout.</strong> A call to a hung endpoint waits forever, and your cron job piles up. httpx defaults to 5 seconds, which is better but still a choice you should make explicitly.</p>
<pre>${PY_HTTP}</pre>
<ul>
<li><strong>Retry only idempotent methods.</strong> urllib3's default <code>allowed_methods</code> already excludes POST and PATCH. Retrying a POST that timed out <em>after</em> the server processed it creates two tickets, two VMs, two charges. If you must retry a POST, send an idempotency key (see <code>pr-idempotency</code>).</li>
<li><strong>Back off with jitter</strong> and honour <code>Retry-After</code> on 429/503. Sleep is <code>backoff_factor * 2^(n-1)</code>, capped by <code>backoff_max</code> (120 s).</li>
<li><strong>Reuse a Session/Client.</strong> <code>requests.get()</code> opens a new TCP+TLS connection per call; a <code>Session</code> keeps a pool. 1,000 calls to one host: roughly 1,000 handshakes vs a handful. Size the pool (<code>pool_maxsize</code>, <code>max_connections</code>) to your thread count, or threads queue for connections.</li>
<li>httpx's <code>HTTPTransport(retries=n)</code> retries only failed connects, never on status codes. For status-based retries use a small loop or a library such as tenacity or stamina.</li>
</ul>`,
        he: `<p><strong>ל-requests אין timeout ברירת מחדל.</strong> קריאה ל-endpoint תקוע מחכה לנצח, וה-cron jobs שלך נערמים אחד על השני. ב-httpx ברירת המחדל היא 5 שניות. זה עדיף, אבל זו עדיין החלטה שאתה צריך לקבל במפורש.</p>
<pre>${PY_HTTP}</pre>
<ul>
<li><strong>Retry רק למתודות idempotent.</strong> ה-<code>allowed_methods</code> של urllib3 כבר מוציא כברירת מחדל את POST ואת PATCH. retry ל-POST שעשה timeout <em>אחרי</em> שהשרת כבר עיבד אותו יוצר שני tickets, שני VMs, שני חיובים. אם חייבים retry ל-POST, תשלח idempotency key (ראה <code>pr-idempotency</code>).</li>
<li><strong>Backoff עם jitter</strong>, ולכבד את <code>Retry-After</code> בתשובות 429/503. זמן ההמתנה הוא <code>backoff_factor * 2^(n-1)</code>, עם תקרה של <code>backoff_max</code> (120 שניות).</li>
<li><strong>שימוש חוזר ב-Session/Client.</strong> הקריאה <code>requests.get()</code> פותחת חיבור TCP+TLS חדש בכל פעם. <code>Session</code> מחזיק pool. 1,000 קריאות לאותו host: בערך 1,000 handshakes מול קומץ. תתאים את גודל ה-pool (<code>pool_maxsize</code>, <code>max_connections</code>) למספר ה-threads, אחרת threads עומדים בתור לחיבור.</li>
<li>ב-httpx, ה-<code>HTTPTransport(retries=n)</code> עושה retry רק לחיבורים שנכשלו, אף פעם לא לפי status code. ל-retries לפי status תכתוב לולאה קטנה או תשתמש בספרייה כמו tenacity או stamina.</li>
</ul>`
      }
    },
    {
      h: { en: "Config, CLI and concurrency: pydantic-settings, typer, threads vs asyncio vs processes", he: "Config, CLI ו-concurrency: pydantic-settings, typer, ו-threads מול asyncio מול processes" },
      body: {
        en: `<p><strong>Validate config at startup, not at 3 a.m. in hour two.</strong> pydantic v2 (Rust core) turns env vars and <code>.env</code> files into typed, validated objects:</p>
<pre>${PY_SETTINGS}</pre>
<p><strong>CLIs:</strong> typer builds a CLI from type hints (on top of click): <code>--help</code>, types, repeated options and exit codes for free. Plain click is the same model with decorators. Either beats a hand-rolled <code>argparse</code> once you have subcommands.</p>
<p><strong>Concurrency for scripts:</strong></p>
<table>
<tr><th>Work</th><th>Tool</th><th>Why</th></tr>
<tr><td>Tens to hundreds of blocking API calls (boto3, requests, kubernetes)</td><td><code>ThreadPoolExecutor</code></td><td>The GIL is released while waiting on the network; boto3 is synchronous anyway. 8-32 workers is typical; above that you mostly buy throttling</td></tr>
<tr><td>Thousands of HTTP calls to async-capable APIs</td><td><code>asyncio</code> + <code>httpx.AsyncClient</code> + a <code>Semaphore</code></td><td>One thread, thousands of sockets. Needs async libraries end to end (aioboto3 for AWS), or <code>asyncio.to_thread</code> for blocking calls</td></tr>
<tr><td>CPU-bound: parsing GBs of logs, compression, hashing</td><td><code>ProcessPoolExecutor</code></td><td>Sidesteps the GIL with one interpreter per core. Free-threaded CPython (3.13t/3.14t) is becoming an option, but check your C extensions first</td></tr>
</table>
<p>Background: <code>pr-concurrency-parallelism</code> and <code>pr-async-await</code>.</p>`,
        he: `<p><strong>תבדוק את ה-config בעלייה, לא ב-3 בלילה בשעה השנייה של הריצה.</strong> pydantic v2 (עם core ב-Rust) הופך משתני סביבה וקבצי <code>.env</code> לאובייקטים עם טיפוסים ו-validation:</p>
<pre>${PY_SETTINGS}</pre>
<p><strong>CLIs:</strong> ה-typer בונה CLI מתוך type hints (מעל click): <code>--help</code>, טיפוסים, אופציות שחוזרות ו-exit codes בחינם. click רגיל הוא אותו מודל עם decorators. שניהם עדיפים על <code>argparse</code> שכתבת לבד, ברגע שיש לך subcommands.</p>
<p><strong>Concurrency לסקריפטים:</strong></p>
<table>
<tr><th>סוג העבודה</th><th>כלי</th><th>למה</th></tr>
<tr><td>עשרות עד מאות קריאות API חוסמות (boto3, requests, kubernetes)</td><td><code>ThreadPoolExecutor</code></td><td>ה-GIL משתחרר בזמן ההמתנה לרשת, ו-boto3 ממילא סינכרוני. 8-32 workers זה טיפוסי. מעבר לזה בעיקר קונים throttling</td></tr>
<tr><td>אלפי קריאות HTTP ל-APIs שתומכים ב-async</td><td><code>asyncio</code> + <code>httpx.AsyncClient</code> + <code>Semaphore</code></td><td>Thread אחד, אלפי sockets. צריך ספריות async מקצה לקצה (aioboto3 בשביל AWS), או <code>asyncio.to_thread</code> לקריאות חוסמות</td></tr>
<tr><td>עבודה שחוסמת על CPU: parsing של GBs של לוגים, דחיסה, hashing</td><td><code>ProcessPoolExecutor</code></td><td>עוקף את ה-GIL עם interpreter לכל ליבה. CPython בגרסת free-threaded (3.13t/3.14t) הופך לאופציה, אבל קודם תבדוק את ה-C extensions שלך</td></tr>
</table>
<p>רקע: <code>pr-concurrency-parallelism</code> ו-<code>pr-async-await</code>.</p>`
      }
    },
    {
      h: { en: "Putting it together: a cross-account audit, tested and packaged", he: "הכל ביחד: audit בין חשבונות, עם בדיקות ואריזה" },
      body: {
        en: `<p>A real script: every enabled region of every account, untagged instances and unattached EBS volumes, as CSV. Paginators, explicit retry config, one Session per thread, results streamed as they finish, failures per region reported without killing the run:</p>
<pre>${PY_AUDIT}</pre>
<p><strong>Tests that never touch AWS.</strong> moto fakes AWS in-process (state you can set up and assert on); botocore's <code>Stubber</code> returns exact canned responses and errors; respx does the same for httpx:</p>
<pre>${PY_TESTS}</pre>
<p><strong>Packaging with uv.</strong> uv (Astral, written in Rust) replaces pip, pip-tools, virtualenv and pipx with one fast tool and a cross-platform lockfile. A single file uses the inline <code># /// script</code> header (PEP 723); a team tool gets a <code>pyproject.toml</code>:</p>
<pre>${TOML_PROJECT}</pre>
<blockquote>💡 Real world: unattached EBS volumes and old snapshots are a classic FinOps quick win. A gp3 volume costs about $0.08 per GB-month in us-east-1, so 400 forgotten 500 GB volumes are about $16k a month. Feed the CSV into the tagging and cleanup process from <code>cloud-finops</code>.</blockquote>`,
        he: `<p>סקריפט אמיתי: כל region מופעל בכל חשבון, instances בלי tags ו-EBS volumes שלא מחוברים לכלום, בפורמט CSV. Paginators, retry config מפורש, Session לכל thread, תוצאות שיוצאות ברגע שהן מוכנות, וכשל ב-region אחד מדווח בלי להפיל את כל הריצה:</p>
<pre>${PY_AUDIT}</pre>
<p><strong>בדיקות שאף פעם לא נוגעות ב-AWS.</strong> ה-moto מזייף את AWS בתוך ה-process (state שאפשר להכין ולבדוק). ה-<code>Stubber</code> של botocore מחזיר תשובות ושגיאות מדויקות שהגדרת מראש. ה-respx עושה אותו דבר ל-httpx:</p>
<pre>${PY_TESTS}</pre>
<p><strong>אריזה עם uv.</strong> ה-uv (של Astral, כתוב ב-Rust) מחליף את pip, pip-tools, virtualenv ו-pipx בכלי מהיר אחד עם lockfile שעובד על כל הפלטפורמות. קובץ בודד משתמש ב-header של <code># /// script</code> (PEP 723). כלי של צוות מקבל <code>pyproject.toml</code>:</p>
<pre>${TOML_PROJECT}</pre>
<blockquote>💡 Real world: EBS volumes מנותקים ו-snapshots ישנים הם quick win קלאסי של FinOps. volume מסוג gp3 עולה בערך $0.08 ל-GB לחודש ב-us-east-1, אז 400 volumes נשכחים של 500 GB הם בערך $16k לחודש. תזין את ה-CSV לתהליך ה-tagging והניקוי מ-<code>cloud-finops</code>.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: `uv init --package infra-audit && cd infra-audit && uv add boto3 typer pydantic-settings httpx && uv add --dev pytest "moto[ec2]" respx`,
      what: { en: "Create a packaged project with a lockfile, runtime deps and a dev group for tests.", he: "יוצר פרויקט ארוז עם lockfile, תלויות runtime וקבוצת dev לבדיקות." } },
    { cmd: `AWS_PROFILE=audit-prod uv run python -c "import boto3; s=boto3.Session(); print(s.region_name, s.client('sts').get_caller_identity()['Arn'])"`,
      what: { en: "Confirm which identity and region a script will really use before it touches anything.", he: "מוודא באיזו identity ובאיזה region הסקריפט באמת ישתמש, לפני שהוא נוגע במשהו." } },
    { cmd: `AWS_RETRY_MODE=standard AWS_MAX_ATTEMPTS=6 uv run audit.py --account 111122223333 --account 444455556666 > findings.csv`,
      what: { en: "Run the audit across two accounts with the retry mode pinned. Errors per region go to stderr; findings go to the CSV.", he: "מריץ את ה-audit על שני חשבונות עם retry mode קבוע. שגיאות לכל region הולכות ל-stderr, הממצאים ל-CSV." } },
    { cmd: `uv run pytest -q`,
      what: { en: "Run the moto, Stubber and respx tests. No AWS account or network needed.", he: "מריץ את הבדיקות של moto, Stubber ו-respx. לא צריך חשבון AWS ולא רשת." } },
    { cmd: `kubectl get pods -n payments -l app=api --watch --output-watch-events`,
      what: { en: "See the ADDED/MODIFIED/DELETED stream that the Python watch loop consumes.", he: "רואה את ה-stream של ADDED/MODIFIED/DELETED שלולאת ה-watch ב-Python צורכת." } }
  ],
  mnemonic: {
    en: "PTR-CT: Paginate, Timeout, Retry only what's safe, Credentials that refresh, Test without the cloud.",
    he: "PTR-CT: Paginate, Timeout, Retry רק למה שבטוח, Credentials שמתרעננים, Test בלי הענן."
  },
  pitfalls: [
    { en: "Calling a list/describe API once and trusting the result. It's the first page only (1,000 S3 keys, 100 IAM users, 50 Lambda functions); the audit says 'clean' while half the account is unchecked. Always use the paginator.",
      he: "לקרוא ל-API של list/describe פעם אחת ולסמוך על התוצאה. זה רק העמוד הראשון (1,000 keys ב-S3, 100 משתמשי IAM, 50 פונקציות Lambda). ה-audit אומר 'נקי' בזמן שחצי חשבון לא נבדק. תמיד paginator." },
    { en: "requests calls without timeout=. One hung endpoint freezes the script forever; cron starts another copy every 5 minutes until the box runs out of memory or connections.",
      he: "קריאות requests בלי timeout=. endpoint אחד תקוע מקפיא את הסקריפט לנצח, וה-cron מפעיל עוד עותק כל 5 דקות עד שנגמר לשרת הזיכרון או החיבורים." },
    { en: "Retrying POSTs or adding retries on top of botocore's own retries. Non-idempotent retries duplicate side effects, and stacked retries (your loop x botocore x the load balancer) turn a brief throttle into a retry storm.",
      he: "לעשות retry ל-POST, או להוסיף retries מעל ה-retries שכבר יש ב-botocore. retries על פעולות לא idempotent משכפלים תופעות לוואי, ו-retries מוערמים (הלולאה שלך כפול botocore כפול ה-load balancer) הופכים throttle קצר ל-retry storm." },
    { en: "Sharing one boto3 Session or resource across threads, or using raw assume_role keys for a multi-hour job. The first gives intermittent credential errors; the second dies with ExpiredToken in hour two.",
      he: "לשתף Session או resource אחד של boto3 בין threads, או להשתמש במפתחות גולמיים מ-assume_role ב-job של כמה שעות. הראשון נותן שגיאות credentials לסירוגין. השני מת עם ExpiredToken בשעה השנייה." }
  ],
  interview: [
    { q: { en: "Your inventory script reports 1,000 objects in a bucket that has 4 million. What happened and how do you fix it, including for very large listings?",
           he: "סקריפט ה-inventory שלך מדווח על 1,000 אובייקטים ב-bucket שיש בו 4 מיליון. מה קרה, ואיך מתקנים, כולל ל-listings ענקיים?" },
      a: { en: "It called list_objects_v2 once and ignored IsTruncated/NextContinuationToken. Use the paginator (or loop on the token). For 4 million objects, listing costs about 4,000 LIST requests and minutes of time; if this is recurring, use S3 Inventory (a daily Parquet/CSV report) and query it with Athena or DuckDB instead of listing at all. Split listings by prefix across threads if you must list live.",
           he: "הוא קרא ל-list_objects_v2 פעם אחת והתעלם מ-IsTruncated/NextContinuationToken. משתמשים ב-paginator (או לולאה על ה-token). ל-4 מיליון אובייקטים, listing עולה בערך 4,000 בקשות LIST ודקות של זמן. אם זה חוזר על עצמו, עדיף S3 Inventory (דוח יומי ב-Parquet/CSV) ולשאול עליו ב-Athena או DuckDB במקום לעשות listing בכלל. אם חייבים listing חי, מפצלים לפי prefix בין threads." } },
    { q: { en: "Threads, asyncio or processes for a script that calls 3 AWS APIs in 40 accounts x 17 regions?",
           he: "Threads, asyncio או processes לסקריפט שקורא ל-3 APIs של AWS ב-40 חשבונות כפול 17 regions?" },
      a: { en: "Threads. That's ~2,000 I/O-bound calls with a synchronous SDK; the GIL is released while waiting on the network, so a ThreadPoolExecutor with 16-32 workers, one Session per thread and standard retry mode is simple and fast. asyncio needs aioboto3 everywhere for little gain at this scale; processes only help CPU-bound work. The real limit is API throttling per account and region, not Python.",
           he: "Threads. אלה ~2,000 קריאות I/O עם SDK סינכרוני. ה-GIL משתחרר בזמן ההמתנה לרשת, אז ThreadPoolExecutor עם 16-32 workers, Session לכל thread ו-retry mode של standard זה פשוט ומהיר. asyncio דורש aioboto3 בכל מקום, בשביל רווח קטן ב-scale הזה. processes עוזרים רק כשהעבודה חוסמת על CPU. המגבלה האמיתית היא throttling של ה-API לכל חשבון ו-region, לא Python." } },
    { q: { en: "Your Kubernetes watch loop occasionally crashes with 410 Gone. Why, and what's the correct handling?",
           he: "לולאת ה-watch שלך ב-Kubernetes קורסת מדי פעם עם 410 Gone. למה, ומה הטיפול הנכון?" },
      a: { en: "The resourceVersion you resumed from has been compacted out of etcd's history (watch reconnects after a long gap or a quiet watch with an old rv). The correct handling is to re-list, take the list's resourceVersion and watch again, treating the list as the new truth. Enable bookmarks to keep the rv fresh, and always wrap the watch in a reconnect loop because the server closes watches routinely.",
           he: "ה-resourceVersion שממנו המשכת נמחק מההיסטוריה של etcd ב-compaction (reconnect אחרי הפסקה ארוכה, או watch שקט עם rv ישן). הטיפול הנכון הוא list מחדש, לקחת את ה-resourceVersion של ה-list ולעשות watch שוב, כשה-list הוא האמת החדשה. מפעילים bookmarks כדי לשמור את ה-rv טרי, ותמיד עוטפים את ה-watch בלולאת reconnect, כי השרת סוגר watches באופן שגרתי." } }
  ],
  quiz: [
    { q: { en: "What does Config(retries={'max_attempts': 3}) give you in boto3?", he: "מה נותן Config(retries={'max_attempts': 3}) ב-boto3?" },
      options: [
        { en: "3 calls in total, including the first", he: "3 קריאות בסך הכל, כולל הראשונה" },
        { en: "3 retries, but only for POST-like operations", he: "3 retries, אבל רק לפעולות מסוג POST" },
        { en: "Up to 4 calls: the first one plus 3 retries", he: "עד 4 קריאות: הראשונה ועוד 3 retries" },
        { en: "Nothing; max_attempts is only read from ~/.aws/config", he: "כלום. max_attempts נקרא רק מ-~/.aws/config" }
      ],
      answer: 2,
      explain: { en: "In a Config object max_attempts counts retries only; total_max_attempts counts every call. In ~/.aws/config and AWS_MAX_ATTEMPTS the same name counts every call.", he: "באובייקט Config, השדה max_attempts סופר רק retries, ו-total_max_attempts סופר את כל הקריאות. ב-~/.aws/config וב-AWS_MAX_ATTEMPTS אותו שם סופר את כל הקריאות." } },
    { q: { en: "Which call is most likely to return incomplete data silently?", he: "איזו קריאה הכי צפויה להחזיר נתונים חלקיים בשקט?" },
      options: [
        { en: "s3.list_objects_v2(Bucket='logs') on a bucket with 50,000 objects", he: "s3.list_objects_v2(Bucket='logs') על bucket עם 50,000 אובייקטים" },
        { en: "sts.get_caller_identity()", he: "sts.get_caller_identity()" },
        { en: "ec2.get_waiter('instance_running').wait(...)", he: "ec2.get_waiter('instance_running').wait(...)" },
        { en: "s3.get_paginator('list_objects_v2').paginate(Bucket='logs')", he: "s3.get_paginator('list_objects_v2').paginate(Bucket='logs')" }
      ],
      answer: 0,
      explain: { en: "A single list_objects_v2 call returns at most 1,000 keys with IsTruncated=True. The paginator follows the continuation token for you.", he: "קריאה אחת ל-list_objects_v2 מחזירה עד 1,000 keys עם IsTruncated=True. ה-paginator עוקב אחרי ה-continuation token בשבילך." } },
    { q: { en: "You configure urllib3 Retry for an internal API. Which setup is safe?", he: "אתה מגדיר Retry של urllib3 ל-API פנימי. איזו הגדרה בטוחה?" },
      options: [
        { en: "Retry every method including POST on any 5xx, with no backoff", he: "Retry לכל מתודה כולל POST על כל 5xx, בלי backoff" },
        { en: "Retry POST only, because GET never fails", he: "Retry רק ל-POST, כי GET אף פעם לא נכשל" },
        { en: "No timeout, so that retries are never needed", he: "בלי timeout, ככה אף פעם לא צריך retries" },
        { en: "Retry GET/PUT/DELETE on 429/502/503/504 with jittered backoff, honouring Retry-After, plus an explicit (connect, read) timeout", he: "Retry ל-GET/PUT/DELETE על 429/502/503/504 עם backoff ו-jitter, תוך כיבוד Retry-After, ועוד timeout מפורש של (connect, read)" }
      ],
      answer: 3,
      explain: { en: "Retry idempotent methods only, back off with jitter, respect the server's Retry-After, and always set a timeout: requests has none by default.", he: "Retry רק למתודות idempotent, backoff עם jitter, לכבד את ה-Retry-After של השרת, ותמיד timeout: ל-requests אין timeout כברירת מחדל." } },
    { q: { en: "Why list first and then watch from the list's resourceVersion with the Kubernetes client?", he: "למה עושים קודם list ואז watch מה-resourceVersion של ה-list ב-client של Kubernetes?" },
      options: [
        { en: "Because watch cannot filter by label selector", he: "כי watch לא יכול לסנן לפי label selector" },
        { en: "So no change between the list and the start of the watch is missed", he: "כדי ששום שינוי בין ה-list לתחילת ה-watch לא יפוספס" },
        { en: "Because list is cached and watch is not", he: "כי list נשמר ב-cache ו-watch לא" },
        { en: "It is only needed outside the cluster; in-cluster watches never miss events", he: "זה נחוץ רק מחוץ ל-cluster. watches בתוך ה-cluster אף פעם לא מפספסים events" }
      ],
      answer: 1,
      explain: { en: "The list gives a consistent snapshot and its resourceVersion; watching from that rv delivers every change after the snapshot. This is the informer pattern.", he: "ה-list נותן snapshot עקבי ואת ה-resourceVersion שלו. watch מאותו rv מעביר כל שינוי שקרה אחרי ה-snapshot. זו תבנית ה-informer." } }
  ],
  related: ["cloud-aws-iam-deep", "cloud-finops", "s3-deep", "python-web-frameworks", "pr-concurrency-parallelism", "pr-async-await", "pr-idempotency", "staff-overload-metastable", "k8s-operators-crds", "pr-integration-testing", "data-wrangling-for-engineers"]
});

/* ================================================================== */
INFRA.lessons.push({
  id: "data-wrangling-for-engineers",
  track: "data",
  order: 90,
  icon: "🧮",
  level: 2,
  minutes: 16,
  title: { en: "pandas, NumPy, Polars and DuckDB for Engineers", he: "כלי דאטה למהנדסי תשתיות: pandas, NumPy, Polars ו-DuckDB" },
  tldr: {
    en: "Operational data (bills, access logs, metrics exports) is tabular, and four tools cover almost all of it on one machine: NumPy for vectorized math and percentiles, pandas for interactive work under a few GB, Polars for fast multi-core pipelines, and DuckDB for SQL straight on Parquet, CSV and S3. Parquet and Arrow are the common format that lets them pass data to each other.",
    he: "נתונים תפעוליים (חשבונות ענן, access logs, exports של metrics) הם טבלאות, וארבעה כלים מכסים כמעט את כולם על מכונה אחת: NumPy למתמטיקה וקטורית ו-percentiles, pandas לעבודה אינטראקטיבית עד כמה GB, Polars ל-pipelines מהירים על כל הליבות, ו-DuckDB ל-SQL ישר על Parquet, CSV ו-S3. Parquet ו-Arrow הם הפורמט המשותף שמאפשר להם להעביר נתונים אחד לשני."
  },
  analogy: {
    en: "NumPy is a calculator that works on a whole column at once. pandas is a spreadsheet you script: familiar, flexible, and it slows down once the sheet gets huge. Polars is the same spreadsheet run by a factory line that plans the whole job first and uses every worker. DuckDB is a librarian who answers SQL questions about a warehouse of files without you having to move the boxes.",
    he: "NumPy הוא מחשבון שעובד על עמודה שלמה בבת אחת. pandas הוא גיליון אלקטרוני שאתה כותב בקוד: מוכר, גמיש, ומאט כשהגיליון נהיה ענק. Polars הוא אותו גיליון, אבל מנוהל על ידי פס ייצור שמתכנן את כל העבודה מראש ומפעיל את כל העובדים. DuckDB הוא ספרן שעונה על שאלות SQL על מחסן שלם של קבצים, בלי שתצטרך להזיז ארגזים."
  },
  sections: [
    {
      h: { en: "NumPy: vectorize, don't loop; percentiles done right", he: "NumPy: וקטוריזציה במקום לולאות, ו-percentiles כמו שצריך" },
      body: {
        en: `<p>A NumPy array is one contiguous buffer of a single type (e.g. <code>float64</code>). An operation like <code>lat &gt; 500</code> runs one C loop over it; a Python <code>for</code> loop touches a boxed Python object per element. The gap is typically 50-100x:</p>
<pre>${PY_NUMPY}</pre>
<ul>
<li><strong>Percentiles, not averages.</strong> An average latency of 60 ms can hide a p99 of 2 s. Report p50/p95/p99.</li>
<li><strong>Never average percentiles</strong> across hosts or time windows: the mean of ten per-host p99s is not the fleet p99. Keep raw values, or mergeable histograms (Prometheus histograms, HDR, t-digest), and compute the percentile once.</li>
<li>The interpolation method changes small-sample results: NumPy defaults to <code>linear</code>, Polars to <code>nearest</code>, DuckDB has <code>quantile_cont</code> (interpolated) and <code>quantile_disc</code> (an actual value). On 10 samples, "p99" is basically the max.</li>
</ul>`,
        he: `<p>מערך של NumPy הוא buffer רציף אחד מטיפוס אחד (למשל <code>float64</code>). פעולה כמו <code>lat &gt; 500</code> מריצה לולאת C אחת עליו, בעוד שלולאת <code>for</code> של Python נוגעת באובייקט Python עטוף לכל איבר. הפער הוא בדרך כלל פי 50-100:</p>
<pre>${PY_NUMPY}</pre>
<ul>
<li><strong>Percentiles, לא ממוצעים.</strong> latency ממוצע של 60 ms יכול להסתיר p99 של 2 שניות. תדווח p50/p95/p99.</li>
<li><strong>אף פעם לא לעשות ממוצע של percentiles</strong> בין hosts או בין חלונות זמן: ממוצע של עשרה p99 של hosts הוא לא ה-p99 של כל הצי. שומרים ערכים גולמיים, או היסטוגרמות שאפשר למזג (histograms של Prometheus, HDR, t-digest), ומחשבים את ה-percentile פעם אחת.</li>
<li>שיטת האינטרפולציה משנה תוצאות על מדגמים קטנים: ב-NumPy ברירת המחדל היא <code>linear</code>, ב-Polars היא <code>nearest</code>, וב-DuckDB יש <code>quantile_cont</code> (עם אינטרפולציה) ו-<code>quantile_disc</code> (ערך שבאמת קיים). על 10 דגימות, "p99" הוא בעצם המקסימום.</li>
</ul>`
      }
    },
    {
      h: { en: "pandas essentials: read, group, merge, resample", he: "יסודות pandas: קריאה, group, merge ו-resample" },
      body: {
        en: `<p>A pandas <code>DataFrame</code> is a set of named columns sharing an index. Four verbs cover most infra questions: read only the columns you need, <code>groupby().agg()</code>, <code>merge</code> with a lookup table, and <code>resample</code>/<code>rolling</code> on a time index:</p>
<pre>${PY_PANDAS}</pre>
<ul>
<li><code>validate="one_to_one"</code> (or <code>many_to_one</code>) makes <code>merge</code> raise if the lookup table has duplicate keys, instead of silently multiplying your rows and your costs.</li>
<li><code>indicator=True</code> adds a <code>_merge</code> column: the cheapest way to find services with no owner.</li>
<li><code>resample("1D").max()</code> buckets by time; <code>rolling("28D")</code> smooths by time span, not row count, so missing samples don't distort it. A rolling mean of daily peaks is a crude but honest capacity trend; for seasonality, use a real model (see <code>rel-capacity-planning</code>).</li>
</ul>`,
        he: `<p><code>DataFrame</code> של pandas הוא אוסף עמודות עם שמות שחולקות index. ארבעה פעלים מכסים את רוב שאלות התשתית: לקרוא רק את העמודות שצריך, <code>groupby().agg()</code>, <code>merge</code> עם טבלת lookup, ו-<code>resample</code>/<code>rolling</code> על index של זמן:</p>
<pre>${PY_PANDAS}</pre>
<ul>
<li><code>validate="one_to_one"</code> (או <code>many_to_one</code>) גורם ל-<code>merge</code> לזרוק שגיאה אם בטבלת ה-lookup יש keys כפולים, במקום להכפיל בשקט את השורות שלך ואת העלויות.</li>
<li><code>indicator=True</code> מוסיף עמודת <code>_merge</code>: הדרך הכי זולה למצוא services בלי owner.</li>
<li><code>resample("1D").max()</code> מחלק לדליים לפי זמן. <code>rolling("28D")</code> מחליק לפי טווח זמן ולא לפי מספר שורות, כך שדגימות חסרות לא מעוותות אותו. ממוצע נע של שיאים יומיים הוא מגמת קיבולת גסה אבל כנה. אם יש עונתיות, צריך מודל אמיתי (ראה <code>rel-capacity-planning</code>).</li>
</ul>`
      }
    },
    {
      h: { en: "pandas 3.0 behaviour and the classic traps", he: "ההתנהגות של pandas 3.0 והמלכודות הקלאסיות" },
      body: {
        en: `<p><strong>pandas 3.0 (January 2026) changed two defaults that were opt-in in 2.x:</strong></p>
<ul>
<li><strong>Copy-on-Write is the only mode.</strong> Any DataFrame derived from another behaves like a copy; writing to it never changes the parent. The old <code>SettingWithCopyWarning</code> ("is this a view or a copy?") is gone, and chained assignment like <code>df[mask]["col"] = x</code> now <em>never</em> works. Use <code>df.loc[mask, "col"] = x</code>.</li>
<li><strong>Strings get a real <code>str</code> dtype</strong>, backed by PyArrow when it's installed, instead of NumPy <code>object</code> arrays of Python strings. Expect lower memory and faster string ops; code that checks <code>dtype == object</code> breaks.</li>
</ul>
<pre>${PY_PANDAS_TRAPS}</pre>
<ul>
<li><strong>Memory:</strong> on pandas 2.x an <code>object</code> column of short strings costs ~50-60 bytes per value. A <code>category</code> stores each distinct value once plus small integer codes. Always measure with <code>memory_usage(deep=True)</code>.</li>
<li><strong>Chunking</strong> works for aggregations that combine (sum, count, min, max). It does not work for exact percentiles or distinct counts across chunks; switch to Polars or DuckDB for those.</li>
<li><strong><code>apply(axis=1)</code></strong> calls a Python function per row. Use column arithmetic, <code>np.where</code>/<code>np.select</code>, <code>.str</code> and <code>.dt</code> accessors.</li>
</ul>`,
        he: `<p><strong>pandas 3.0 (ינואר 2026) שינה שתי ברירות מחדל שהיו opt-in ב-2.x:</strong></p>
<ul>
<li><strong>Copy-on-Write הוא ה-mode היחיד.</strong> כל DataFrame שנגזר מ-DataFrame אחר מתנהג כמו עותק, וכתיבה אליו אף פעם לא משנה את המקור. ה-<code>SettingWithCopyWarning</code> הישן ("זה view או copy?") נעלם, והשמה בשרשרת כמו <code>df[mask]["col"] = x</code> עכשיו <em>אף פעם</em> לא עובדת. תשתמש ב-<code>df.loc[mask, "col"] = x</code>.</li>
<li><strong>מחרוזות מקבלות dtype אמיתי של <code>str</code></strong>, מגובה ב-PyArrow כשהוא מותקן, במקום מערכי <code>object</code> של NumPy עם מחרוזות Python. צפה לפחות זיכרון ולפעולות מחרוזת מהירות יותר. קוד שבודק <code>dtype == object</code> יישבר.</li>
</ul>
<pre>${PY_PANDAS_TRAPS}</pre>
<ul>
<li><strong>זיכרון:</strong> ב-pandas 2.x, עמודת <code>object</code> של מחרוזות קצרות עולה ~50-60 bytes לערך. <code>category</code> שומר כל ערך שונה פעם אחת, ועוד קודים קטנים של מספרים שלמים. תמיד למדוד עם <code>memory_usage(deep=True)</code>.</li>
<li><strong>Chunking</strong> עובד לאגרגציות שאפשר לחבר (sum, count, min, max). הוא לא עובד ל-percentiles מדויקים או לספירת ערכים שונים בין chunks. בשביל אלה תעבור ל-Polars או DuckDB.</li>
<li><strong><code>apply(axis=1)</code></strong> קורא לפונקציית Python לכל שורה. תשתמש בחשבון על עמודות, ב-<code>np.where</code>/<code>np.select</code>, וב-accessors של <code>.str</code> ו-<code>.dt</code>.</li>
</ul>`
      }
    },
    {
      h: { en: "Polars: lazy, multi-core, streaming", he: "Polars: עצל, מרובה ליבות, streaming" },
      body: {
        en: `<p>Polars (Rust, Arrow memory, version 1.x) has no index and no <code>apply</code> habit: you compose <strong>expressions</strong> (<code>pl.col("x").quantile(0.99)</code>) and the engine runs them in parallel on all cores. The <strong>lazy API</strong> (<code>scan_*</code> instead of <code>read_*</code>) builds a query plan first, then optimizes it: it reads only the columns used (projection pushdown) and skips Parquet row groups that can't match the filter (predicate pushdown).</p>
<pre>${PY_POLARS}</pre>
<p><strong>Polars over pandas when:</strong> the data is more than ~1 GB, it's a pipeline that runs repeatedly, you want strict types (a column can't silently become <code>object</code>), or a pandas job is slow and single-core. <strong>Stay with pandas when:</strong> the data is small, the next step is a library that expects pandas, or the code is shared with people who know only pandas. <code>to_pandas()</code> and <code>pl.from_pandas()</code> make mixing cheap.</p>`,
        he: `<p>ל-Polars (כתוב ב-Rust, זיכרון בפורמט Arrow, גרסה 1.x) אין index ואין הרגל של <code>apply</code>: מרכיבים <strong>expressions</strong> (<code>pl.col("x").quantile(0.99)</code>), והמנוע מריץ אותם במקביל על כל הליבות. ה-<strong>lazy API</strong> (<code>scan_*</code> במקום <code>read_*</code>) בונה קודם query plan ורק אז מבצע לו אופטימיזציה: קורא רק את העמודות שבשימוש (projection pushdown) ומדלג על row groups ב-Parquet שלא יכולים להתאים ל-filter (predicate pushdown).</p>
<pre>${PY_POLARS}</pre>
<p><strong>Polars במקום pandas כש:</strong> הנתונים גדולים מ-~1 GB, מדובר ב-pipeline שרץ שוב ושוב, אתה רוצה טיפוסים קשיחים (עמודה לא יכולה להפוך בשקט ל-<code>object</code>), או ש-job של pandas איטי ותקוע על ליבה אחת. <strong>להישאר עם pandas כש:</strong> הנתונים קטנים, השלב הבא הוא ספרייה שמצפה ל-pandas, או שהקוד משותף עם אנשים שמכירים רק pandas. בעזרת <code>to_pandas()</code> ו-<code>pl.from_pandas()</code> לערבב ביניהם זה זול.</p>`
      }
    },
    {
      h: { en: "DuckDB and Parquet/Arrow: SQL on files, AWS cost report example", he: "DuckDB ו-Parquet/Arrow: SQL על קבצים, ודוגמה עם דוח העלויות של AWS" },
      body: {
        en: `<p>DuckDB (1.x) is an in-process analytical database: <code>pip install duckdb</code>, no server. It runs vectorized, multi-core SQL directly on Parquet, CSV and JSON, locally or on S3/GCS/Azure via the <code>httpfs</code> extension (autoloaded), and spills to disk when the data is larger than RAM. For "one question over a pile of files" it is often the fastest thing you can run on a laptop.</p>
<p><strong>Example: AWS Cost and Usage Report (CUR 2.0) by month, service and team tag</strong>, read straight from the S3 export:</p>
<pre>${PY_DUCKDB}</pre>
<ul>
<li>In CUR 2.0, tags live in the <code>resource_tags</code> MAP column with keys like <code>user_team</code>. Check your keys with <code>SELECT DISTINCT unnest(map_keys(resource_tags)) FROM ...</code>. Since DuckDB 1.2, <code>map['key']</code> returns the value (NULL if missing), not a list.</li>
<li><code>line_item_unblended_cost</code> is the on-demand price for usage covered by Savings Plans or RIs. For what you actually pay, use the amortized/effective-cost columns (see <code>cloud-finops</code>).</li>
<li><strong>Parquet</strong> is the on-disk format: columnar, compressed, typed, with min/max statistics per row group so engines skip data. <strong>Arrow</strong> is the in-memory columnar format: pandas (with PyArrow dtypes), Polars and DuckDB exchange Arrow data with little or no copying. Convert raw CSV logs to Parquet once; every later query gets 5-10x smaller reads.</li>
</ul>`,
        he: `<p>DuckDB (גרסה 1.x) הוא database אנליטי שרץ בתוך ה-process: <code>pip install duckdb</code>, בלי שרת. הוא מריץ SQL וקטורי על כל הליבות ישר על Parquet, CSV ו-JSON, מקומית או על S3/GCS/Azure דרך ה-extension של <code>httpfs</code> (שנטען אוטומטית), ועושה spill לדיסק כשהנתונים גדולים מה-RAM. לשאלה אחת על ערימת קבצים, הוא הרבה פעמים הדבר הכי מהיר שאפשר להריץ על לפטופ.</p>
<p><strong>דוגמה: Cost and Usage Report של AWS (CUR 2.0) לפי חודש, שירות ו-tag של צוות</strong>, ישר מה-export ב-S3:</p>
<pre>${PY_DUCKDB}</pre>
<ul>
<li>ב-CUR 2.0 ה-tags יושבים בעמודת MAP בשם <code>resource_tags</code>, עם keys כמו <code>user_team</code>. תבדוק אילו keys יש לך עם <code>SELECT DISTINCT unnest(map_keys(resource_tags)) FROM ...</code>. מאז DuckDB 1.2, הביטוי <code>map['key']</code> מחזיר את הערך עצמו (או NULL אם אין), ולא רשימה.</li>
<li>העמודה <code>line_item_unblended_cost</code> היא מחיר on-demand לשימוש שמכוסה ב-Savings Plans או RIs. בשביל מה שאתה באמת משלם, תשתמש בעמודות ה-amortized/effective cost (ראה <code>cloud-finops</code>).</li>
<li><strong>Parquet</strong> הוא הפורמט על הדיסק: עמודתי, דחוס, עם טיפוסים, ועם סטטיסטיקות min/max לכל row group כדי שמנועים ידלגו על נתונים. <strong>Arrow</strong> הוא הפורמט העמודתי בזיכרון: pandas (עם dtypes של PyArrow), Polars ו-DuckDB מעבירים ביניהם נתוני Arrow כמעט בלי העתקות. תמיר לוגים גולמיים מ-CSV ל-Parquet פעם אחת, וכל שאילתה אחר כך תקרא פי 5-10 פחות.</li>
</ul>`
      }
    },
    {
      h: { en: "Which tool when: a size-based cheat sheet", he: "איזה כלי מתי: טבלה לפי גודל הנתונים" },
      body: {
        en: `${TABLE_PICK_EN}
<p>Rough numbers for a 16 GB laptop: pandas is comfortable up to ~1-2 GB of raw data; Polars handles ~10-20 GB in memory and more with the streaming engine; DuckDB happily scans 100+ GB of Parquet from local disk or S3 if the result is small. These are heuristics, not limits: column count, string-heaviness and the query shape matter more than row count.</p>
<blockquote>💡 Real world: a common, effective split is DuckDB or Polars to filter and aggregate millions of rows down to thousands, then <code>.df()</code> / <code>.to_pandas()</code> for the last mile (pivot, plot, share). For the SQL itself, the window-function and percentile patterns in <code>sql-window-functions</code> and <code>sql-ctes-advanced</code> run unchanged in DuckDB.</blockquote>`,
        he: `${TABLE_PICK_HE}
<p>מספרים גסים ללפטופ עם 16 GB: pandas נוח עד ~1-2 GB של נתונים גולמיים. Polars מתמודד עם ~10-20 GB בזיכרון, ויותר עם ה-streaming engine. DuckDB סורק בכיף 100+ GB של Parquet מדיסק מקומי או מ-S3, אם התוצאה קטנה. אלה כללי אצבע ולא גבולות: מספר העמודות, כמות המחרוזות וצורת השאילתה משפיעים יותר ממספר השורות.</p>
<blockquote>💡 Real world: חלוקה נפוצה ויעילה: DuckDB או Polars מסננים ומאגדים מיליוני שורות לאלפים, ואז <code>.df()</code> / <code>.to_pandas()</code> בשביל הקילומטר האחרון (pivot, גרף, שיתוף). את ה-SQL עצמו, התבניות של window functions ו-percentiles מ-<code>sql-window-functions</code> ומ-<code>sql-ctes-advanced</code> רצות ב-DuckDB בלי שינוי.</blockquote>`
      }
    }
  ],
  handsOn: [
    { cmd: `python -m timeit -s "import numpy as np; a=np.random.rand(5_000_000)" "(a > 0.9).mean()"`,
      what: { en: "Time the vectorized version; then try the loop with -s \"import random; a=[random.random() for _ in range(5_000_000)]\" \"sum(x > 0.9 for x in a)/len(a)\" and compare.", he: "מודד את הגרסה הווקטורית. אחר כך תנסה את הלולאה עם -s \"import random; a=[random.random() for _ in range(5_000_000)]\" \"sum(x > 0.9 for x in a)/len(a)\" ותשווה." } },
    { cmd: `uv run --with "pandas>=3" --with pyarrow python -c "import pandas as pd; print(pd.__version__, pd.Series(['a','b']).dtype)"`,
      what: { en: "Check your pandas version and that strings get the new str dtype instead of object.", he: "בודק את גרסת ה-pandas ושמחרוזות מקבלות את ה-dtype החדש str ולא object." } },
    { cmd: `uv run --with polars python -c "import polars as pl; print(pl.scan_csv('access.csv').group_by('service').agg(pl.col('latency_ms').quantile(0.99)).collect())"`,
      what: { en: "p99 latency per service from a CSV with the lazy API, all cores.", he: "p99 של latency לכל service מתוך CSV עם ה-lazy API, על כל הליבות." } },
    { cmd: `duckdb -c "SELECT status, count(*) AS n, quantile_cont(latency_ms, 0.99) AS p99 FROM 'access/*.parquet' GROUP BY ALL ORDER BY n DESC"`,
      what: { en: "SQL over a folder of Parquet files with the DuckDB CLI: no load step, no Python.", he: "SQL על תיקייה של קבצי Parquet עם ה-CLI של DuckDB: בלי שלב טעינה ובלי Python." } },
    { cmd: `duckdb -c "CREATE SECRET (TYPE s3, PROVIDER credential_chain); SELECT line_item_product_code, round(sum(line_item_unblended_cost), 2) AS cost FROM read_parquet('s3://billing-exports/cur2/data/BILLING_PERIOD=2026-10/*.parquet') GROUP BY ALL ORDER BY cost DESC LIMIT 10"`,
      what: { en: "Top 10 services by cost for one month, straight from the CUR export in S3, using your normal AWS credential chain.", he: "10 השירותים הכי יקרים בחודש אחד, ישר מה-export של CUR ב-S3, עם ה-credential chain הרגיל של AWS." } }
  ],
  mnemonic: {
    en: "Numbers → NumPy, Notebook → pandas, Need speed → Polars, Questions on files → DuckDB. And never loop, never average a p99.",
    he: "מספרים → NumPy, מחברת → pandas, צריך מהירות → Polars, שאלות על קבצים → DuckDB. ואף פעם לא לולאה, ואף פעם לא ממוצע של p99."
  },
  pitfalls: [
    { en: "Averaging per-host or per-minute p99 values to get a fleet or daily p99. The result is meaningless (usually far too low). Recompute from raw samples or mergeable histograms.",
      he: "לעשות ממוצע של ערכי p99 לכל host או לכל דקה כדי לקבל p99 של כל הצי או של היום. התוצאה חסרת משמעות (בדרך כלל נמוכה מדי). מחשבים מחדש מדגימות גולמיות או מהיסטוגרמות שאפשר למזג." },
    { en: "Relying on chained assignment (df[mask]['col'] = x). Under pandas 3.0 Copy-on-Write it never modifies df; the 'fix' silently does nothing. Use df.loc[mask, 'col'] = x.",
      he: "להסתמך על השמה בשרשרת (df[mask]['col'] = x). תחת Copy-on-Write של pandas 3.0 היא אף פעם לא משנה את df, וה'תיקון' בשקט לא עושה כלום. תשתמש ב-df.loc[mask, 'col'] = x." },
    { en: "merge on a lookup table with duplicate keys. Rows multiply and so does the cost total; a 'how did the bill double?' bug. Pass validate='many_to_one' and check row counts before and after.",
      he: "merge עם טבלת lookup שיש בה keys כפולים. השורות מוכפלות, וגם סכום העלויות. באג של 'איך החשבון הוכפל?'. תעביר validate='many_to_one' ותבדוק את מספר השורות לפני ואחרי." },
    { en: "Loading a 20 GB CSV into pandas on a 16 GB laptop and blaming the machine. Read only the needed columns, convert to Parquet once, and use DuckDB or Polars lazy/streaming for the heavy aggregation.",
      he: "לטעון CSV של 20 GB ל-pandas על לפטופ עם 16 GB ולהאשים את המכונה. קוראים רק את העמודות הנחוצות, ממירים ל-Parquet פעם אחת, ומשתמשים ב-DuckDB או ב-Polars במצב lazy/streaming לאגרגציה הכבדה." }
  ],
  interview: [
    { q: { en: "Finance asks for monthly AWS cost per team for the last 6 months; the CUR export is 80 GB of Parquet in S3. How do you answer it today, and what would you build if it becomes weekly?",
           he: "ה-finance מבקשים עלות AWS חודשית לכל צוות על 6 החודשים האחרונים. ה-export של CUR הוא 80 GB של Parquet ב-S3. איך אתה עונה היום, ומה היית בונה אם זה הופך לשבועי?" },
      a: { en: "Today: DuckDB with an S3 secret from the credential chain, read_parquet over the BILLING_PERIOD partitions I need, group by month, service and resource_tags['user_team'], using the amortized cost columns, not unblended. Only the referenced columns and partitions are read, so it runs in minutes on a laptop. Weekly: the same SQL as an Athena view or a scheduled job writing a small Parquet summary, a tag-coverage metric (the UNTAGGED share), and a dashboard. Plus tag policies so UNTAGGED shrinks.",
           he: "היום: DuckDB עם secret של S3 מה-credential chain, ו-read_parquet רק על partitions של BILLING_PERIOD שאני צריך. group by לפי חודש, שירות ו-resource_tags['user_team'], עם עמודות ה-amortized cost ולא unblended. נקראות רק העמודות וה-partitions שבשימוש, אז זה רץ בדקות על לפטופ. שבועי: אותו SQL כ-view ב-Athena או job מתוזמן שכותב סיכום Parquet קטן, metric של כיסוי tags (החלק של UNTAGGED), ו-dashboard. ובנוסף tag policies כדי ש-UNTAGGED יקטן." } },
    { q: { en: "A pandas script that computes p99 per service from 30 GB of access logs gets OOM-killed. What do you change?",
           he: "סקריפט pandas שמחשב p99 לכל service מ-30 GB של access logs נהרג ב-OOM. מה אתה משנה?" },
      a: { en: "Chunking won't work, because exact percentiles don't combine across chunks. I'd convert the logs to Parquet (partitioned by day), then use Polars scan_parquet with group_by().agg(quantile(0.99)) and collect(engine='streaming'), or the equivalent DuckDB quantile_cont query, which spills to disk. Both read only the needed columns and use every core. If approximate is fine at bigger scale, use t-digest/approx_quantile, or keep histograms at the source.",
           he: "Chunking לא יעבוד, כי percentiles מדויקים לא מתחברים בין chunks. הייתי ממיר את הלוגים ל-Parquet (עם partition לפי יום), ואז Polars עם scan_parquet, group_by().agg(quantile(0.99)) ו-collect(engine='streaming'), או את אותה שאילתה ב-DuckDB עם quantile_cont, שעושה spill לדיסק. שניהם קוראים רק את העמודות הנחוצות ומשתמשים בכל הליבות. אם בקנה מידה גדול יותר מספיק קירוב, t-digest/approx_quantile, או לשמור היסטוגרמות כבר במקור." } }
  ],
  quiz: [
    { q: { en: "In pandas 3.0, what does df[df.env == 'prod']['cost'] = 0 do?", he: "ב-pandas 3.0, מה עושה df[df.env == 'prod']['cost'] = 0?" },
      options: [
        { en: "Sets cost to 0 for prod rows in df", he: "מאפס את cost בשורות של prod ב-df" },
        { en: "Nothing to df: it writes to a temporary copy (and warns about chained assignment)", he: "כלום ל-df: הוא כותב לעותק זמני (ומזהיר על השמה בשרשרת)" },
        { en: "Raises a SettingWithCopyError and stops", he: "זורק SettingWithCopyError ועוצר" },
        { en: "Sets cost to 0 in every row", he: "מאפס את cost בכל השורות" }
      ],
      answer: 1,
      explain: { en: "With Copy-on-Write as the only mode, chained assignment never updates the original. Use df.loc[mask, 'cost'] = 0.", he: "כש-Copy-on-Write הוא ה-mode היחיד, השמה בשרשרת אף פעם לא מעדכנת את המקור. תשתמש ב-df.loc[mask, 'cost'] = 0." } },
    { q: { en: "You have per-host p99 latency for 20 hosts. How do you get the fleet-wide p99?", he: "יש לך p99 של latency לכל אחד מ-20 hosts. איך מקבלים p99 של כל הצי?" },
      options: [
        { en: "Average the 20 values", he: "ממוצע של 20 הערכים" },
        { en: "Take the median of the 20 values", he: "החציון של 20 הערכים" },
        { en: "Take the maximum of the 20 values", he: "המקסימום של 20 הערכים" },
        { en: "Recompute from the raw samples or merged histograms of all hosts", he: "לחשב מחדש מהדגימות הגולמיות או מהיסטוגרמות ממוזגות של כל ה-hosts" }
      ],
      answer: 3,
      explain: { en: "Percentiles don't aggregate. Only raw data or mergeable sketches/histograms give a correct fleet percentile.", he: "Percentiles לא מתאגדים. רק נתונים גולמיים או sketches/היסטוגרמות שאפשר למזג נותנים percentile נכון לכל הצי." } },
    { q: { en: "Which tool fits best: 'top 10 services by cost over 6 months of CUR Parquet files in S3' on a laptop?", he: "איזה כלי הכי מתאים: '10 השירותים הכי יקרים על 6 חודשים של קבצי CUR ב-Parquet ב-S3', על לפטופ?" },
      options: [
        { en: "DuckDB: SQL straight on the Parquet files in S3, reading only needed columns", he: "DuckDB: SQL ישר על קבצי ה-Parquet ב-S3, וקריאה רק של העמודות הנחוצות" },
        { en: "Download everything and loop over rows with csv.reader", he: "להוריד הכל ולעבור על השורות בלולאה עם csv.reader" },
        { en: "NumPy, because it is the fastest library", he: "NumPy, כי זו הספרייה הכי מהירה" },
        { en: "pandas.read_csv with apply(axis=1)", he: "pandas.read_csv עם apply(axis=1)" }
      ],
      answer: 0,
      explain: { en: "DuckDB queries Parquet on S3 through httpfs with projection and partition pruning, multi-core, and spills if needed.", he: "DuckDB שואל על Parquet ב-S3 דרך httpfs, עם projection ו-partition pruning, על כל הליבות, ועושה spill אם צריך." } },
    { q: { en: "What does Polars' lazy API (scan_parquet ... collect) give you that read_parquet doesn't?", he: "מה נותן ה-lazy API של Polars (scan_parquet ... collect) ש-read_parquet לא נותן?" },
      options: [
        { en: "A pandas-compatible index", he: "index תואם ל-pandas" },
        { en: "Automatic plotting", he: "גרפים אוטומטיים" },
        { en: "A query plan optimized before execution: projection and predicate pushdown, and optional streaming", he: "Query plan שעובר אופטימיזציה לפני הביצוע: projection ו-predicate pushdown, ואופציה ל-streaming" },
        { en: "Row-by-row Python callbacks", he: "callbacks של Python לכל שורה" }
      ],
      answer: 2,
      explain: { en: "Lazy mode sees the whole query, so it reads only needed columns and row groups, and can run with the streaming engine for larger-than-RAM data.", he: "במצב lazy המנוע רואה את כל השאילתה, אז הוא קורא רק את העמודות וה-row groups הנחוצים, ויכול לרוץ עם ה-streaming engine על נתונים גדולים מה-RAM." } }
  ],
  related: ["db-time-series", "data-lakehouse-formats", "db-olap-columnar", "s3-deep", "cloud-finops", "cloud-data-transfer-costs", "rel-capacity-planning", "sql-window-functions", "sql-ctes-advanced", "sql-basics-joins", "python-infra-toolbox"]
});

/* ---------------- glossary ---------------- */
INFRA.glossary.push(
  { term: "Paginator", track: "cloud", def: { en: "A boto3 helper that follows NextToken/ContinuationToken across every page of a list/describe API, so scripts don't silently read only the first page.", he: "Helper של boto3 שעוקב אחרי NextToken/ContinuationToken על כל העמודים של API מסוג list/describe, כדי שסקריפטים לא יקראו בשקט רק את העמוד הראשון." }, lesson: "python-infra-toolbox" },
  { term: "boto3 waiter", track: "cloud", def: { en: "A boto3 helper that polls an API until a resource reaches a state (instance_stopped, db_instance_available), raising WaiterError after MaxAttempts.", he: "Helper של boto3 שעושה polling ל-API עד שמשאב מגיע למצב מסוים (instance_stopped, db_instance_available), וזורק WaiterError אחרי MaxAttempts." }, lesson: "python-infra-toolbox" },
  { term: "boto3 retry mode", track: "cloud", def: { en: "How botocore retries failed AWS calls: legacy (5 attempts), standard (3 attempts, jittered backoff, retry quota; the default since botocore 1.44) or adaptive (standard plus client-side rate limiting).", he: "הדרך שבה botocore עושה retry לקריאות AWS שנכשלו: legacy (5 ניסיונות), standard (3 ניסיונות, backoff עם jitter ו-retry quota, ברירת המחדל מאז botocore 1.44) או adaptive (standard ועוד rate limiting בצד ה-client)." }, lesson: "python-infra-toolbox" },
  { term: "pydantic-settings", track: "cloud", def: { en: "The pydantic v2 package that loads typed, validated settings from env vars and .env files (BaseSettings), failing fast on bad config.", he: "החבילה של pydantic v2 שטוענת settings עם טיפוסים ו-validation ממשתני סביבה ומקבצי .env (BaseSettings), ונכשלת מיד על config שגוי." }, lesson: "python-infra-toolbox" },
  { term: "DataFrame", track: "data", def: { en: "A table of named, typed columns in memory (pandas, Polars); the basic unit of Python data analysis.", he: "טבלה בזיכרון של עמודות עם שמות וטיפוסים (pandas, Polars). היחידה הבסיסית של ניתוח נתונים ב-Python." }, lesson: "data-wrangling-for-engineers", aliases: ["DataFrames"] },
  { term: "Vectorization", track: "data", def: { en: "Running one compiled loop over a whole array or column (NumPy, pandas, Polars) instead of a Python loop per element; typically 50-100x faster.", he: "הרצה של לולאה מקומפלת אחת על מערך או עמודה שלמה (NumPy, pandas, Polars) במקום לולאת Python לכל איבר. בדרך כלל פי 50-100 יותר מהיר." }, lesson: "data-wrangling-for-engineers", aliases: ["vectorized"] },
  { term: "Apache Arrow", track: "data", def: { en: "A standard in-memory columnar format that lets pandas, Polars, DuckDB and Spark share data with little or no copying.", he: "פורמט עמודתי סטנדרטי בזיכרון שמאפשר ל-pandas, Polars, DuckDB ו-Spark לשתף נתונים כמעט בלי העתקות." }, lesson: "data-wrangling-for-engineers" },
  { term: "DuckDB", track: "data", def: { en: "An in-process analytical SQL database that queries Parquet, CSV and S3 files directly, multi-core and out-of-core.", he: "Database אנליטי של SQL שרץ בתוך ה-process ושואל ישירות על קבצי Parquet, CSV ו-S3, על כל הליבות וגם מעבר לגודל ה-RAM." }, lesson: "data-wrangling-for-engineers" },
  { term: "Polars", track: "data", def: { en: "A Rust DataFrame library with a lazy, query-optimized API and a streaming engine; a multi-core alternative to pandas.", he: "ספריית DataFrame ב-Rust עם API עצל שעובר אופטימיזציה ו-streaming engine. חלופה ל-pandas שעובדת על כל הליבות." }, lesson: "data-wrangling-for-engineers" }
);
})();
