// AWS & EKS depth for engineers coming from Azure/AKS: translation guide, EKS Day 2, AWS networking & edge.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.scenarios = window.INFRA.scenarios || [];

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "aws-for-azure-engineers",
  track: "cloud",
  order: 80,
  icon: "🔁",
  level: 2,
  minutes: 18,
  title: { en: "AWS for Azure Engineers: the Translation Guide", he: "AWS למהנדסי Azure: מדריך התרגום" },
  tldr: {
    en: "The service names map almost one to one, the semantics don't. In AWS the account (not a resource group) is the unit of isolation, IAM is policy documents evaluated per request (identity + resource policies, roles you assume), subnets live in one AZ, security groups can reference each other, and Front Door is split into four services. Translate concepts, not names.",
    he: "שמות השירותים ממופים כמעט אחד לאחד, אבל ההתנהגות לא. ב-AWS ה-account (ולא resource group) הוא יחידת הבידוד, IAM הוא מסמכי policy שנבדקים בכל בקשה (identity ו-resource policies, roles שעושים להם assume), subnet חי ב-AZ אחד, security groups יכולים להפנות אחד לשני, ו-Front Door מתפצל לארבעה שירותים. תתרגם מושגים, לא שמות."
  },
  analogy: {
    en: "Moving from Azure to AWS is like a British driver renting a car in New York. The pedals are in the same place and the road signs look familiar, so you feel at home for ten minutes. Then you turn into the wrong lane, because the rules underneath (which side you drive on, who yields at a roundabout) are different. The dangerous part isn't the unknown; it's what looks familiar but behaves differently.",
    he: "מעבר מ-Azure ל-AWS זה כמו נהג בריטי ששוכר רכב בניו יורק. הדוושות באותו מקום והשלטים נראים מוכרים, אז עשר דקות אתה מרגיש בבית. ואז אתה פונה לנתיב הלא נכון, כי החוקים מתחת (באיזה צד נוסעים, מי נותן זכות קדימה בכיכר) שונים. החלק המסוכן הוא לא מה שלא מוכר, אלא מה שנראה מוכר ומתנהג אחרת."
  },
  sections: [
    {
      h: { en: "Hierarchy and guardrails: Organizations vs management groups", he: "היררכיה ו-guardrails: Organizations מול management groups" },
      body: {
        en: `<table>
<tr><th>Azure</th><th>AWS</th><th>What actually differs</th></tr>
<tr><td>Tenant (Entra ID)</td><td>Organization (management account)</td><td>The AWS org is a billing + policy container, not an identity directory.</td></tr>
<tr><td>Management groups</td><td>Organizational Units (OUs)</td><td>Both nest; OUs max 5 levels below root.</td></tr>
<tr><td>Subscription</td><td>Account</td><td>The account is a much harder boundary: IAM, quotas, VPCs and billing are all per account. Cross-account access always needs an explicit trust.</td></tr>
<tr><td>Resource group</td><td>(nothing equivalent)</td><td>AWS "Resource Groups" are just tag queries. No lifecycle, no RBAC scope, no "delete the RG to clean up".</td></tr>
<tr><td>Azure Policy (deny / audit / modify / deployIfNotExists)</td><td>SCPs + RCPs (deny-only ceilings), AWS Config rules (audit / remediate), declarative policies, tag policies</td><td>An SCP never grants anything: it only caps what IAM in that account can do. It doesn't apply to the management account. Remediation is a separate service (Config).</td></tr>
</table>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyOutsideApprovedRegions",
    "Effect": "Deny",
    "NotAction": ["iam:*", "organizations:*", "route53:*", "cloudfront:*", "sts:*", "support:*"],
    "Resource": "*",
    "Condition": { "StringNotEquals": { "aws:RequestedRegion": ["eu-west-1", "eu-central-1"] } }
  }]
}</pre>
<p>This is the classic region-lock SCP. The <code>NotAction</code> list matters: global services (IAM, Route 53, CloudFront) are served from <code>us-east-1</code>, so a naive region deny breaks them.</p>
<blockquote>💡 Real world: a multi-region production setup is usually one account per environment per workload (prod-payments, staging-payments...), created by Control Tower / Account Factory or a Terraform vending pipeline, with a shared "network" account owning Transit Gateway and a "log archive" + "security" account. See <code>cloud-landing-zones</code>.</blockquote>`,
        he: `<table>
<tr><th>Azure</th><th>AWS</th><th>מה באמת שונה</th></tr>
<tr><td>Tenant (Entra ID)</td><td>Organization (management account)</td><td>ה-org של AWS הוא מכל של billing ו-policy, לא directory של זהויות.</td></tr>
<tr><td>Management groups</td><td>Organizational Units (OUs)</td><td>שניהם מקוננים; עד 5 רמות של OUs מתחת ל-root.</td></tr>
<tr><td>Subscription</td><td>Account</td><td>ה-account הוא גבול הרבה יותר קשיח: IAM, quotas, VPCs ו-billing הם כולם לכל account. גישה בין accounts תמיד דורשת trust מפורש.</td></tr>
<tr><td>Resource group</td><td>(אין מקבילה)</td><td>ה-Resource Groups של AWS הם רק שאילתות על tags. אין lifecycle, אין scope של הרשאות, ואין "מוחקים את ה-RG ומנקים הכל".</td></tr>
<tr><td>Azure Policy (deny / audit / modify / deployIfNotExists)</td><td>SCPs ו-RCPs (תקרות של deny בלבד), חוקי AWS Config (audit ו-remediation), declarative policies, tag policies</td><td>SCP אף פעם לא נותן הרשאה: הוא רק מגביל את מה ש-IAM באותו account יכול לעשות. הוא לא חל על ה-management account. ה-remediation הוא שירות נפרד (Config).</td></tr>
</table>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyOutsideApprovedRegions",
    "Effect": "Deny",
    "NotAction": ["iam:*", "organizations:*", "route53:*", "cloudfront:*", "sts:*", "support:*"],
    "Resource": "*",
    "Condition": { "StringNotEquals": { "aws:RequestedRegion": ["eu-west-1", "eu-central-1"] } }
  }]
}</pre>
<p>זה ה-SCP הקלאסי לנעילת regions. רשימת ה-<code>NotAction</code> קריטית: שירותים גלובליים (IAM, Route 53, CloudFront) מוגשים מ-<code>us-east-1</code>, ו-deny נאיבי על regions שובר אותם.</p>
<blockquote>💡 Real world: setup של production רב-אזורי הוא בדרך כלל account לכל סביבה לכל workload (prod-payments, staging-payments...). יוצרים אותם עם Control Tower ו-Account Factory או עם pipeline של Terraform, ולצידם account של "network" שמחזיק את ה-Transit Gateway, ו-accounts של "log archive" ו-"security". ראה <code>cloud-landing-zones</code>.</blockquote>`
      }
    },
    {
      h: { en: "Identity: Entra ID + Azure RBAC vs IAM policies and roles", he: "זהות: Entra ID ו-Azure RBAC מול IAM policies ו-roles" },
      body: {
        en: `<p>Azure RBAC is <em>role assignment at a scope</em>: principal + role definition + scope (MG / subscription / RG / resource). AWS IAM is <em>policy documents evaluated per API call</em>:</p>
<ul>
<li><strong>Identity-based policies</strong> attached to users, groups or roles ("what may this principal do").</li>
<li><strong>Resource-based policies</strong> on the resource itself: S3 bucket policy, KMS key policy, SQS queue policy, role trust policy ("who may touch me"). There is no Azure equivalent for most resources. A KMS key policy that doesn't trust the account locks out even administrators.</li>
<li><strong>Roles + AssumeRole</strong>: humans and workloads don't hold permanent keys; they call <code>sts:AssumeRole</code> and get temporary credentials (default 1 hour, role max up to 12 hours, role chaining capped at 1 hour). Cross-account = the role's trust policy names the other account and the caller's policy allows <code>sts:AssumeRole</code>: both sides must agree.</li>
<li><strong>Permission boundaries</strong>: a max-permissions policy on a role. Used to let platform teams delegate "create roles" without privilege escalation. Azure's closest idea is ABAC conditions on role assignments.</li>
<li><strong>IAM Identity Center</strong>: the SSO front door. Entra ID stays your IdP (SAML + SCIM provisioning); Identity Center maps groups to <em>permission sets</em>, which become roles in each account.</li>
</ul>
<pre>aws sso login --profile prod-admin
aws sts get-caller-identity --profile prod-admin
{
  "UserId": "AROAEXAMPLEID:dana@corp.example",
  "Account": "111122223333",
  "Arn": "arn:aws:sts::111122223333:assumed-role/AWSReservedSSO_PlatformAdmin_0a1b2c3d/dana@corp.example"
}</pre>
<p>Compute identity translates like this: <strong>managed identity on a VM</strong> = an <strong>IAM role in an instance profile</strong> (credentials served by IMDS at <code>169.254.169.254</code>). <strong>AKS Workload Identity</strong> = <strong>IRSA</strong> (OIDC federation, same idea) or <strong>EKS Pod Identity</strong> (an agent on the node; no OIDC provider per cluster). Policy evaluation details are in <code>cloud-aws-iam-deep</code>.</p>`,
        he: `<p>Azure RBAC הוא <em>role assignment ב-scope</em>: principal, role definition ו-scope (MG, subscription, RG או resource). AWS IAM הוא <em>מסמכי policy שנבדקים בכל קריאת API</em>:</p>
<ul>
<li><strong>Identity-based policies</strong> שמוצמדות ל-users, groups או roles ("מה ה-principal הזה רשאי לעשות").</li>
<li><strong>Resource-based policies</strong> על המשאב עצמו: bucket policy ב-S3, key policy ב-KMS, queue policy ב-SQS, trust policy של role ("מי רשאי לגעת בי"). לרוב המשאבים אין לזה מקבילה ב-Azure. Key policy ב-KMS שלא סומכת על ה-account נועלת בחוץ גם אדמינים.</li>
<li><strong>Roles ו-AssumeRole</strong>: בני אדם ו-workloads לא מחזיקים keys קבועים. הם קוראים ל-<code>sts:AssumeRole</code> ומקבלים credentials זמניים (שעה כברירת מחדל, עד 12 שעות לפי הגדרת ה-role, ו-role chaining מוגבל לשעה). גישה בין accounts עובדת רק כשהצדדים מסכימים: ה-trust policy של ה-role מציינת את ה-account השני, וה-policy של הקורא מתירה <code>sts:AssumeRole</code>.</li>
<li><strong>Permission boundaries</strong>: policy של הרשאות מקסימליות על role. משתמשים בזה כדי לתת לצוותים ליצור roles בלי privilege escalation. הרעיון הכי קרוב ב-Azure הוא ABAC conditions על role assignments.</li>
<li><strong>IAM Identity Center</strong>: דלת הכניסה של SSO. ה-Entra ID נשאר ה-IdP שלך (SAML ו-SCIM provisioning); ה-Identity Center ממפה groups ל-<em>permission sets</em>, שהופכים ל-roles בכל account.</li>
</ul>
<pre>aws sso login --profile prod-admin
aws sts get-caller-identity --profile prod-admin
{
  "UserId": "AROAEXAMPLEID:dana@corp.example",
  "Account": "111122223333",
  "Arn": "arn:aws:sts::111122223333:assumed-role/AWSReservedSSO_PlatformAdmin_0a1b2c3d/dana@corp.example"
}</pre>
<p>זהות של compute מתורגמת כך: <strong>managed identity על VM</strong> שווה ל-<strong>IAM role בתוך instance profile</strong> (ה-credentials מוגשים מ-IMDS בכתובת <code>169.254.169.254</code>). <strong>AKS Workload Identity</strong> שווה ל-<strong>IRSA</strong> (federation של OIDC, אותו רעיון) או ל-<strong>EKS Pod Identity</strong> (agent על ה-node, בלי OIDC provider לכל cluster). הפרטים של הערכת policies נמצאים ב-<code>cloud-aws-iam-deep</code>.</p>`
      }
    },
    {
      h: { en: "Networking: VPC vs VNet, the differences that bite", he: "רשת: VPC מול VNet, ההבדלים שנושכים" },
      body: {
        en: `<table>
<tr><th>Topic</th><th>Azure VNet</th><th>AWS VPC</th></tr>
<tr><td>Scope</td><td>Regional; a subnet spans all zones</td><td>Regional; <strong>a subnet lives in exactly one AZ</strong>. Three AZs = at least three subnets per tier.</td></tr>
<tr><td>Internet egress</td><td>NAT Gateway, LB outbound rules, (legacy) default outbound access</td><td>Public subnet = route <code>0.0.0.0/0</code> to an Internet Gateway. Private subnet = route to a NAT Gateway, which is <strong>zonal</strong>: one per AZ for HA.</td></tr>
<tr><td>Routing</td><td>System routes + UDR (route tables)</td><td>Route table per subnet; the "main" table is the implicit default</td></tr>
<tr><td>Firewalling</td><td>NSG: stateful, allow + deny, priorities, on subnet or NIC; ASGs as groups</td><td><strong>Security Group</strong>: stateful, allow-only, on the ENI, and a rule can reference <em>another SG</em> ("allow 5432 from sg-app"). <strong>NACL</strong>: stateless, subnet-level, numbered allow + deny, you must open ephemeral return ports (1024-65535).</td></tr>
<tr><td>Reserved IPs</td><td>5 per subnet</td><td>5 per subnet (network, router <code>.1</code>, DNS <code>.2</code>, future <code>.3</code>, broadcast)</td></tr>
<tr><td>Private PaaS access</td><td>Private Endpoint + Private DNS zone</td><td>Interface VPC endpoint (PrivateLink) with private DNS, or free gateway endpoints for S3 and DynamoDB</td></tr>
<tr><td>Hub-and-spoke</td><td>VNet peering, Virtual WAN</td><td>VPC peering (non-transitive), Transit Gateway, Cloud WAN</td></tr>
</table>
<p>The global edge splits differently too. <strong>Azure Front Door</strong> (anycast L7 + CDN + WAF + global routing) maps to <strong>CloudFront</strong> (CDN + L7 edge) + <strong>AWS WAF</strong> + <strong>Route 53</strong> routing policies (Traffic Manager's role) + <strong>Global Accelerator</strong> (anycast static IPs, L4). Application Gateway ≈ ALB, Azure Load Balancer ≈ NLB. Details in <code>aws-networking-edge</code>.</p>
<blockquote>⚠️ Production tip: AZ <em>names</em> are shuffled per account: <code>us-east-1a</code> in your account may be a different data center than in another account. Use AZ <em>IDs</em> (<code>use1-az1</code>) when coordinating across accounts (shared subnets, PrivateLink, latency tests). Azure's logical zones 1-2-3 are also mapped per subscription.</blockquote>`,
        he: `<table>
<tr><th>נושא</th><th>Azure VNet</th><th>AWS VPC</th></tr>
<tr><td>Scope</td><td>אזורי; subnet פרוס על כל ה-zones</td><td>אזורי; <strong>subnet חי ב-AZ אחד בדיוק</strong>. שלושה AZs אומר לפחות שלושה subnets לכל שכבה.</td></tr>
<tr><td>יציאה לאינטרנט</td><td>NAT Gateway, outbound rules ב-LB, ו-default outbound access (legacy)</td><td>Subnet ציבורי הוא subnet עם route של <code>0.0.0.0/0</code> ל-Internet Gateway. Subnet פרטי מנתב ל-NAT Gateway, שהוא <strong>zonal</strong>: אחד לכל AZ בשביל HA.</td></tr>
<tr><td>Routing</td><td>System routes ו-UDR (route tables)</td><td>Route table לכל subnet; ה-"main" table הוא ברירת המחדל המובלעת</td></tr>
<tr><td>Firewall</td><td>NSG: stateful, allow ו-deny, עדיפויות, על subnet או NIC; ASGs כקבוצות</td><td><strong>Security Group</strong>: stateful, allow בלבד, יושב על ה-ENI, וחוק יכול להפנות ל-<em>SG אחר</em> ("תתיר 5432 מ-sg-app"). <strong>NACL</strong>: stateless, ברמת ה-subnet, חוקים ממוספרים של allow ו-deny, וחייבים לפתוח פורטים ephemeral לחזרה (1024-65535).</td></tr>
<tr><td>IPs שמורים</td><td>5 לכל subnet</td><td>5 לכל subnet (network, router ב-<code>.1</code>, DNS ב-<code>.2</code>, שמור ב-<code>.3</code>, broadcast)</td></tr>
<tr><td>גישה פרטית ל-PaaS</td><td>Private Endpoint ו-Private DNS zone</td><td>Interface VPC endpoint (PrivateLink) עם private DNS, או gateway endpoints חינמיים ל-S3 ו-DynamoDB</td></tr>
<tr><td>Hub-and-spoke</td><td>VNet peering, Virtual WAN</td><td>VPC peering (לא טרנזיטיבי), Transit Gateway, Cloud WAN</td></tr>
</table>
<p>גם ה-edge הגלובלי מתפצל אחרת. <strong>Azure Front Door</strong> (anycast ב-L7, CDN, WAF ו-routing גלובלי) ממופה ל-<strong>CloudFront</strong> (CDN ו-edge של L7), <strong>AWS WAF</strong>, routing policies של <strong>Route 53</strong> (התפקיד של Traffic Manager) ו-<strong>Global Accelerator</strong> (IPs סטטיים של anycast ב-L4). Application Gateway מקביל ל-ALB, ו-Azure Load Balancer מקביל ל-NLB. הפירוט ב-<code>aws-networking-edge</code>.</p>
<blockquote>⚠️ Production tip: <em>שמות</em> ה-AZs מעורבבים לכל account: ה-<code>us-east-1a</code> שלך יכול להיות data center אחר מאשר ב-account אחר. תשתמש ב-<em>AZ IDs</em> (<code>use1-az1</code>) כשמתאמים בין accounts (shared subnets, PrivateLink, בדיקות latency). גם ה-zones הלוגיים 1-2-3 של Azure ממופים לכל subscription בנפרד.</blockquote>`
      }
    },
    {
      h: { en: "Secrets, monitoring and IaC", he: "Secrets, ניטור ו-IaC" },
      body: {
        en: `<table>
<tr><th>Azure</th><th>AWS</th><th>Translation notes</th></tr>
<tr><td>Key Vault (keys + secrets + certs)</td><td><strong>KMS</strong> (keys, envelope encryption) + <strong>Secrets Manager</strong> (secrets, rotation via Lambda) + <strong>SSM Parameter Store</strong> (config, standard tier free) + <strong>ACM</strong> (TLS certs, free public certs for ALB/CloudFront)</td><td>One Azure service becomes four. KMS access is governed by the key policy first, IAM second.</td></tr>
<tr><td>Azure Monitor metrics</td><td>CloudWatch metrics + alarms</td><td>Default EC2 metrics are 5-minute; detailed monitoring (1-minute) costs extra. No memory/disk metrics without the CloudWatch agent.</td></tr>
<tr><td>Log Analytics workspace + KQL</td><td>CloudWatch Logs (log groups) + Logs Insights query language</td><td>A new log group's retention is <strong>"Never expire"</strong>. Set retention or pay forever.</td></tr>
<tr><td>Application Insights</td><td>X-Ray / CloudWatch Application Signals (OpenTelemetry based)</td><td>Many teams just use OpenTelemetry to a vendor or to Amazon Managed Prometheus/Grafana.</td></tr>
<tr><td>Activity Log</td><td>CloudTrail</td><td>Create an org trail to the log-archive account; management events are free for one copy, data events cost.</td></tr>
<tr><td>ARM / Bicep</td><td>CloudFormation / CDK</td><td>Bicep is stateless (ARM is the state). CloudFormation keeps <em>stacks</em> with rollback and drift detection; StackSets deploy across accounts/regions.</td></tr>
<tr><td>Terraform azurerm</td><td>Terraform aws</td><td>The usual choice for multi-account AWS: one state per account/region/component, a provider per role via <code>assume_role</code>.</td></tr>
</table>
<pre>provider "aws" {
  region = "eu-west-1"
  alias  = "prod"
  assume_role {
    role_arn = "arn:aws:iam::111122223333:role/terraform-deployer"
  }
  default_tags { tags = { owner = "platform", env = "prod" } }
}</pre>`,
        he: `<table>
<tr><th>Azure</th><th>AWS</th><th>הערות תרגום</th></tr>
<tr><td>Key Vault (keys, secrets ו-certs)</td><td><strong>KMS</strong> (keys, envelope encryption), <strong>Secrets Manager</strong> (secrets, rotation דרך Lambda), <strong>SSM Parameter Store</strong> (קונפיגורציה, ה-tier הבסיסי חינמי) ו-<strong>ACM</strong> (תעודות TLS, תעודות ציבוריות חינמיות ל-ALB ו-CloudFront)</td><td>שירות אחד של Azure הופך לארבעה. הגישה ל-KMS נקבעת קודם לפי ה-key policy, ורק אחר כך לפי IAM.</td></tr>
<tr><td>Azure Monitor metrics</td><td>CloudWatch metrics ו-alarms</td><td>המטריקות הבסיסיות של EC2 הן ברזולוציה של 5 דקות; detailed monitoring (דקה) עולה כסף. אין מטריקות של זיכרון ודיסק בלי ה-CloudWatch agent.</td></tr>
<tr><td>Log Analytics workspace ו-KQL</td><td>CloudWatch Logs (log groups) ושפת השאילתות של Logs Insights</td><td>ה-retention של log group חדש הוא <strong>"Never expire"</strong>. תגדיר retention, אחרת תשלם לנצח.</td></tr>
<tr><td>Application Insights</td><td>X-Ray ו-CloudWatch Application Signals (מבוסס OpenTelemetry)</td><td>הרבה צוותים פשוט שולחים OpenTelemetry לספק חיצוני או ל-Prometheus ו-Grafana המנוהלים של Amazon.</td></tr>
<tr><td>Activity Log</td><td>CloudTrail</td><td>תיצור org trail שכותב ל-account של log-archive; עותק אחד של management events חינמי, data events עולים כסף.</td></tr>
<tr><td>ARM / Bicep</td><td>CloudFormation / CDK</td><td>Bicep הוא stateless (ה-ARM הוא ה-state). CloudFormation מחזיק <em>stacks</em> עם rollback ו-drift detection; StackSets פורסים על פני accounts ו-regions.</td></tr>
<tr><td>Terraform azurerm</td><td>Terraform aws</td><td>הבחירה הנפוצה ל-AWS עם הרבה accounts: state אחד לכל account, region ורכיב, ו-provider לכל role דרך <code>assume_role</code>.</td></tr>
</table>
<pre>provider "aws" {
  region = "eu-west-1"
  alias  = "prod"
  assume_role {
    role_arn = "arn:aws:iam::111122223333:role/terraform-deployer"
  }
  default_tags { tags = { owner = "platform", env = "prod" } }
}</pre>`
      }
    },
    {
      h: { en: "CLI cheat sheet: az vs aws", he: "שליפה מהירה של CLI: az מול aws" },
      body: {
        en: `<p>Good news: both CLIs use <strong>JMESPath</strong> for <code>--query</code>, so your filtering muscle memory transfers.</p>
<pre># who am I / switch context
az account show                               aws sts get-caller-identity
az account set -s prod-sub                    export AWS_PROFILE=prod-admin
az login                                      aws sso login --profile prod-admin

# kubeconfig
az aks get-credentials -g rg-prod -n aks-prod aws eks update-kubeconfig --name prod --region eu-west-1 --alias prod

# compute and network inventory
az vm list -o table                           aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,PrivateIpAddress]' --output table
az network vnet list -o table                 aws ec2 describe-vpcs --query 'Vpcs[].[VpcId,CidrBlock]' --output table
az network vnet subnet list ...               aws ec2 describe-subnets --filters Name=vpc-id,Values=vpc-0abc --query 'Subnets[].[SubnetId,AvailabilityZoneId,CidrBlock,AvailableIpAddressCount]'

# secrets and logs
az keyvault secret show --vault-name kv -n db aws secretsmanager get-secret-value --secret-id prod/db --query SecretString --output text
az monitor log-analytics query -w WS --analytics-query '...'
                                              aws logs start-query --log-group-name /aws/eks/prod/cluster --start-time $(date -d '-1 hour' +%s) --end-time $(date +%s) --query-string 'fields @timestamp, @message | limit 20'

# "everything with this tag"
az resource list --tag env=prod               aws resourcegroupstaggingapi get-resources --tag-filters Key=env,Values=prod</pre>`,
        he: `<p>החדשות הטובות: שני ה-CLIs משתמשים ב-<strong>JMESPath</strong> ל-<code>--query</code>, כך שזיכרון השריר של הסינון עובר איתך.</p>
<pre># who am I / switch context
az account show                               aws sts get-caller-identity
az account set -s prod-sub                    export AWS_PROFILE=prod-admin
az login                                      aws sso login --profile prod-admin

# kubeconfig
az aks get-credentials -g rg-prod -n aks-prod aws eks update-kubeconfig --name prod --region eu-west-1 --alias prod

# compute and network inventory
az vm list -o table                           aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,PrivateIpAddress]' --output table
az network vnet list -o table                 aws ec2 describe-vpcs --query 'Vpcs[].[VpcId,CidrBlock]' --output table
az network vnet subnet list ...               aws ec2 describe-subnets --filters Name=vpc-id,Values=vpc-0abc --query 'Subnets[].[SubnetId,AvailabilityZoneId,CidrBlock,AvailableIpAddressCount]'

# secrets and logs
az keyvault secret show --vault-name kv -n db aws secretsmanager get-secret-value --secret-id prod/db --query SecretString --output text
az monitor log-analytics query -w WS --analytics-query '...'
                                              aws logs start-query --log-group-name /aws/eks/prod/cluster --start-time $(date -d '-1 hour' +%s) --end-time $(date +%s) --query-string 'fields @timestamp, @message | limit 20'

# "everything with this tag"
az resource list --tag env=prod               aws resourcegroupstaggingapi get-resources --tag-filters Key=env,Values=prod</pre>`
      }
    },
    {
      h: { en: "Mental model traps", he: "מלכודות של מודל מחשבתי" },
      body: {
        en: `<ol>
<li><strong>"Owner on the subscription" ≠ AdministratorAccess.</strong> An admin role can still be denied by an SCP, a KMS key policy, an S3 bucket policy or a permission boundary. When AccessDenied makes no sense, check the layers above and on the resource.</li>
<li><strong>Subnets are zonal.</strong> An ASG, EKS node group or RDS subnet group needs subnets in each AZ, and pod/node IP capacity is per AZ. One full subnet means one AZ can't scale even if the others are empty.</li>
<li><strong>The region is in every call.</strong> The AWS console and CLI are region-scoped; "my instance disappeared" usually means a different <code>--region</code>. IAM, Route 53, CloudFront and Organizations are global (control plane in <code>us-east-1</code>).</li>
<li><strong>NAT Gateway bills per GB processed</strong> (in <code>us-east-1</code>: $0.045/hour + $0.045/GB). Pulling container images or calling S3 through it is a classic surprise; use VPC endpoints.</li>
<li><strong>Cross-AZ traffic is not free</strong>: about $0.01/GB in each direction. Chatty services and cross-AZ replication show up on the bill.</li>
<li><strong>No resource-group cleanup.</strong> Tag everything at creation (<code>default_tags</code>), and treat the account as the real disposal unit for sandboxes.</li>
<li><strong>Quotas are per account per region</strong> and many are low by default (EC2 vCPU per instance family, EIPs, VPCs). Request increases before a launch, through Service Quotas.</li>
</ol>`,
        he: `<ol>
<li><strong>"Owner על ה-subscription" זה לא AdministratorAccess.</strong> גם role של אדמין יכול להיחסם על ידי SCP, key policy ב-KMS, bucket policy ב-S3 או permission boundary. כש-AccessDenied לא הגיוני, תבדוק את השכבות מעל ועל המשאב עצמו.</li>
<li><strong>Subnets הם zonal.</strong> ל-ASG, ל-node group של EKS או ל-subnet group של RDS צריך subnet בכל AZ, וקיבולת ה-IPs של Pods ו-nodes היא לכל AZ. Subnet אחד מלא אומר ש-AZ אחד לא יכול לגדול, גם אם האחרים ריקים.</li>
<li><strong>ה-region נמצא בכל קריאה.</strong> ה-console וה-CLI של AWS הם לפי region. "ה-instance שלי נעלם" אומר בדרך כלל <code>--region</code> אחר. IAM, Route 53, CloudFront ו-Organizations הם גלובליים, וה-control plane שלהם יושב ב-<code>us-east-1</code>.</li>
<li><strong>NAT Gateway מחויב לפי GB שעובר דרכו</strong> (ב-<code>us-east-1</code>: $0.045 לשעה ועוד $0.045 ל-GB). משיכת container images או קריאות ל-S3 דרכו הן הפתעה קלאסית; תשתמש ב-VPC endpoints.</li>
<li><strong>תעבורה בין AZs לא חינמית</strong>: בערך $0.01 ל-GB לכל כיוון. שירותים פטפטנים ו-replication בין AZs מופיעים בחשבון.</li>
<li><strong>אין ניקוי לפי resource group.</strong> תתייג הכל ביצירה (<code>default_tags</code>), ותתייחס ל-account כיחידת הניקוי האמיתית של sandboxes.</li>
<li><strong>Quotas הם לכל account ולכל region</strong>, והרבה מהם נמוכים כברירת מחדל (vCPU של EC2 לכל משפחת instances, EIPs, VPCs). תבקש הגדלה דרך Service Quotas לפני launch.</li>
</ol>`
      }
    }
  ],
  diagram: `Azure                                   AWS
Tenant (Entra ID) ............ IdP      Organization + IAM Identity Center (Entra ID as IdP)
 └ Management group                       └ OU            <- SCP / RCP (deny ceilings)
    └ Subscription                           └ Account     <- hard boundary: IAM, quotas, billing
       └ Resource group                         └ (tags only)
          └ VNet (subnets span zones)              └ VPC (regional)
                                                      ├ subnet-a  (AZ use1-az1)
                                                      ├ subnet-b  (AZ use1-az2)
                                                      └ subnet-c  (AZ use1-az4)
Front Door  =  CloudFront + WAF + Route 53 policies + Global Accelerator`,
  handsOn: [
    { cmd: "aws sts get-caller-identity && aws configure list", what: { en: "Your first 'whoami' in AWS: account, role and the credential source in use (env vars, profile, SSO, IMDS).", he: "ה-'whoami' הראשון ב-AWS: ה-account, ה-role ומקור ה-credentials שבשימוש (env vars, profile, SSO או IMDS)." } },
    { cmd: "aws ec2 describe-availability-zones --region eu-west-1 --query 'AvailabilityZones[].[ZoneName,ZoneId]' --output table", what: { en: "See how AZ names map to AZ IDs in this account; compare with a teammate's account.", he: "תראה איך שמות ה-AZs ממופים ל-AZ IDs ב-account שלך, ותשווה ל-account של חבר לצוות." } },
    { cmd: "aws organizations list-policies-for-target --target-id 111122223333 --filter SERVICE_CONTROL_POLICY", what: { en: "List the SCPs that cap an account (run from the management or delegated admin account).", he: "רשימת ה-SCPs שמגבילים account (מריצים מה-management account או מ-delegated admin)." } },
    { cmd: "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::111122223333:role/app --action-names s3:GetObject --resource-arns arn:aws:s3:::invoices/2026/a.pdf", what: { en: "Ask IAM whether a role may perform an action before you debug in production. Note: the simulator does not evaluate SCPs from every angle; confirm with CloudTrail.", he: "תשאל את IAM אם role רשאי לבצע פעולה לפני שאתה מדבג ב-production. שים לב: הסימולטור לא מכסה כל שכבה של SCP, אז תאמת מול CloudTrail." } },
    { cmd: "aws logs describe-log-groups --query 'logGroups[?!retentionInDays].[logGroupName,storedBytes]' --output table", what: { en: "Find log groups with no retention (Never expire): the classic CloudWatch cost leak.", he: "מוצא log groups בלי retention (Never expire): דליפת העלויות הקלאסית של CloudWatch." } }
  ],
  mnemonic: {
    en: "ARAS: Account is the boundary, Roles are assumed, AZ owns the subnet, SCPs only deny.",
    he: "ARAS: ה-Account הוא הגבול, Roles עושים להם assume, ה-AZ מחזיק את ה-subnet, ו-SCPs רק חוסמים."
  },
  pitfalls: [
    { en: "Writing an SCP that denies everything outside your regions without exempting global services (IAM, STS, Route 53, CloudFront, support). Console logins and DNS changes break in every account under that OU.", he: "כתיבת SCP שחוסם הכל מחוץ ל-regions שלך בלי להחריג שירותים גלובליים (IAM, STS, Route 53, CloudFront, support). כניסות ל-console ושינויי DNS נשברים בכל account תחת ה-OU." },
    { en: "Creating one NAT Gateway for three AZs to save money. When that AZ fails, private subnets in the other two lose egress, and you pay cross-AZ data charges on every byte the whole time.", he: "יצירת NAT Gateway אחד לשלושה AZs כדי לחסוך. כשה-AZ הזה נופל, ה-subnets הפרטיים בשני האחרים מאבדים יציאה, ובינתיים אתה משלם על תעבורה בין AZs על כל byte." },
    { en: "Assuming Azure-style inheritance: an IAM policy on a role in account A grants nothing in account B. Cross-account needs a role in B whose trust policy allows A, and A's principal must be allowed to call sts:AssumeRole.", he: "הנחה של הורשה בסגנון Azure: IAM policy על role ב-account A לא נותנת כלום ב-account B. גישה בין accounts דורשת role ב-B שה-trust policy שלו מתירה את A, וה-principal ב-A צריך הרשאה ל-sts:AssumeRole." },
    { en: "Using long-lived IAM user access keys for CI because 'it's like a service principal secret'. Use OIDC federation from your CI (GitHub Actions, GitLab) to an IAM role; no stored keys. See leaked-aws-key.", he: "שימוש ב-access keys קבועים של IAM user ל-CI כי 'זה כמו secret של service principal'. תשתמש ב-OIDC federation מה-CI (GitHub Actions, GitLab) ל-IAM role, בלי keys שמורים בכלל." }
  ],
  interview: [
    {
      q: { en: "You know Azure well. How would you design the account structure for a multi-region EKS platform on AWS?", he: "אתה מכיר Azure טוב. איך תתכנן את מבנה ה-accounts לפלטפורמת EKS רב-אזורית ב-AWS?" },
      a: {
        en: "Start from the account as the blast-radius boundary, not resource groups. An Organization with OUs for Security, Infrastructure, Workloads (Prod/Non-prod) and Sandbox. Dedicated accounts: log archive (org CloudTrail, Config), security tooling (GuardDuty/Security Hub delegated admin), network (Transit Gateway, IPAM, Route 53 Resolver rules, egress VPC, shared via RAM), and per-workload/per-env accounts that host the EKS clusters in two or more regions. SCPs for region lock, deny leaving the org, deny disabling CloudTrail/GuardDuty, protect the platform roles. Identity Center with Entra ID as IdP via SAML + SCIM, permission sets per persona. Accounts are vended by Control Tower Account Factory or a Terraform pipeline with baseline (VPC from IPAM, OIDC role for CI, budgets). A strong answer also names the tradeoffs: more accounts mean more TGW attachments and cross-account IAM, but much smaller blast radius and cleaner cost attribution.",
        he: "מתחילים מה-account כגבול ה-blast radius, לא מ-resource groups. Organization עם OUs ל-Security, Infrastructure, Workloads (Prod ו-Non-prod) ו-Sandbox. Accounts ייעודיים: log archive (CloudTrail ו-Config ברמת ה-org), security tooling (delegated admin ל-GuardDuty ול-Security Hub), network (Transit Gateway, IPAM, חוקי Route 53 Resolver, VPC של egress, משותפים דרך RAM), ו-accounts לכל workload ולכל סביבה שמחזיקים את ה-clusters של EKS בשני regions או יותר. SCPs לנעילת regions, לחסימת יציאה מה-org, לחסימת כיבוי של CloudTrail ו-GuardDuty ולהגנה על ה-roles של הפלטפורמה. Identity Center עם Entra ID כ-IdP דרך SAML ו-SCIM, ו-permission set לכל persona. ה-accounts נוצרים דרך Account Factory של Control Tower או pipeline של Terraform עם baseline (VPC מ-IPAM, OIDC role ל-CI, budgets). תשובה חזקה מציינת גם את ה-tradeoffs: יותר accounts אומר יותר attachments ל-TGW ויותר IAM בין accounts, אבל blast radius הרבה יותר קטן וייחוס עלויות נקי יותר."
      }
    },
    {
      q: { en: "What is the AWS equivalent of AKS Workload Identity, and which would you choose on EKS today?", he: "מה המקבילה ב-AWS ל-Workload Identity של AKS, ובמה תבחר היום ב-EKS?" },
      a: {
        en: "Two options. IRSA is the same model as AKS Workload Identity: the cluster's OIDC issuer is registered as an IAM OIDC provider, the role's trust policy matches the service account subject, and the SDK exchanges the projected token via sts:AssumeRoleWithWebIdentity. EKS Pod Identity removes the per-cluster OIDC provider: you install the eks-pod-identity-agent add-on and create an association (cluster, namespace, service account to role); the role trusts the service principal pods.eks.amazonaws.com, so one role is reusable across clusters without editing trust policies, and it adds session tags (cluster, namespace, SA) for ABAC. I'd default to Pod Identity for new EC2-based clusters and keep IRSA where Pod Identity isn't supported (for example Fargate pods) or where an existing setup works. Either way: block pods from IMDS so they can't fall back to the node role.",
        he: "יש שתי אפשרויות. IRSA הוא אותו מודל כמו Workload Identity של AKS: ה-OIDC issuer של ה-cluster נרשם כ-OIDC provider ב-IAM, ה-trust policy של ה-role מתאימה ל-subject של ה-service account, וה-SDK מחליף את ה-token המוזרק דרך sts:AssumeRoleWithWebIdentity. EKS Pod Identity מוריד את ה-OIDC provider לכל cluster: מתקינים את ה-add-on של eks-pod-identity-agent ויוצרים association (cluster, namespace ו-service account מול role). ה-role סומך על ה-service principal בשם pods.eks.amazonaws.com, כך שאפשר להשתמש באותו role בכמה clusters בלי לערוך trust policies, ומתווספים session tags (cluster, namespace, SA) ל-ABAC. הייתי בוחר Pod Identity כברירת מחדל ל-clusters חדשים על EC2, ומשאיר IRSA איפה ש-Pod Identity לא נתמך (למשל Pods על Fargate) או איפה שה-setup הקיים עובד. בכל מקרה: לחסום ל-Pods גישה ל-IMDS כדי שלא ייפלו חזרה ל-role של ה-node."
      }
    }
  ],
  quiz: [
    {
      q: { en: "An SCP attached to the Prod OU allows only ec2:* and s3:*. A role in a prod account has AdministratorAccess. What can the role do?", he: "SCP שמוצמד ל-OU של Prod מתיר רק ec2:* ו-s3:*. ל-role ב-account של prod יש AdministratorAccess. מה ה-role יכול לעשות?" },
      options: [
        { en: "Everything: AdministratorAccess overrides SCPs", he: "הכל: AdministratorAccess גובר על SCPs" },
        { en: "Only EC2 and S3 actions: the SCP is a ceiling, IAM grants within it", he: "רק פעולות EC2 ו-S3: ה-SCP הוא תקרה, ו-IAM נותן הרשאות בתוכה" },
        { en: "Nothing: SCPs replace IAM policies", he: "כלום: SCPs מחליפים את ה-IAM policies" },
        { en: "Only EC2 and S3, plus anything the SCP doesn't mention", he: "רק EC2 ו-S3, ועוד כל מה שה-SCP לא מזכיר" }
      ],
      answer: 1,
      explain: { en: "Effective permissions are the intersection: the SCP sets the maximum, the identity policy grants. An SCP never grants anything by itself.", he: "ההרשאות בפועל הן החיתוך: ה-SCP קובע את המקסימום, וה-identity policy נותנת. SCP לעולם לא נותן הרשאה בעצמו." }
    },
    {
      q: { en: "You want an EKS node group spread across three AZs. What do you need in the VPC?", he: "אתה רוצה node group של EKS שפרוס על שלושה AZs. מה צריך ב-VPC?" },
      options: [
        { en: "One subnet; it spans all AZs like an Azure subnet", he: "Subnet אחד; הוא פרוס על כל ה-AZs כמו subnet ב-Azure" },
        { en: "Three VPCs, one per AZ", he: "שלושה VPCs, אחד לכל AZ" },
        { en: "At least one subnet in each of the three AZs", he: "לפחות subnet אחד בכל אחד משלושת ה-AZs" },
        { en: "A Transit Gateway between the AZs", he: "Transit Gateway בין ה-AZs" }
      ],
      answer: 2,
      explain: { en: "An AWS subnet belongs to exactly one AZ. Multi-AZ means one subnet per AZ per tier, and also one NAT Gateway per AZ for HA egress.", he: "Subnet ב-AWS שייך ל-AZ אחד בדיוק. Multi-AZ אומר subnet לכל AZ בכל שכבה, וגם NAT Gateway לכל AZ בשביל יציאה עם HA." }
    },
    {
      q: { en: "Which AWS setup is closest to what Azure Front Door gives you?", he: "איזה setup ב-AWS הכי קרוב למה ש-Azure Front Door נותן?" },
      options: [
        { en: "An Application Load Balancer", he: "Application Load Balancer" },
        { en: "CloudFront with AWS WAF, plus Route 53 routing policies (and Global Accelerator for static anycast IPs)", he: "CloudFront עם AWS WAF, ועוד routing policies של Route 53 (ו-Global Accelerator בשביל IPs סטטיים של anycast)" },
        { en: "Transit Gateway", he: "Transit Gateway" },
        { en: "API Gateway alone", he: "API Gateway לבד" }
      ],
      answer: 1,
      explain: { en: "Front Door bundles a global anycast L7 edge, CDN, WAF and origin routing. In AWS those are separate services you compose; an ALB is regional, like Application Gateway.", he: "Front Door אורז edge גלובלי של anycast ב-L7, CDN, WAF ו-routing ל-origins. ב-AWS אלה שירותים נפרדים שמרכיבים; ALB הוא אזורי, כמו Application Gateway." }
    },
    {
      q: { en: "A CI pipeline needs to deploy to AWS. What is the recommended credential setup?", he: "Pipeline של CI צריך לעשות deploy ל-AWS. מה ה-setup המומלץ ל-credentials?" },
      options: [
        { en: "An IAM user with access keys stored as CI secrets, rotated yearly", he: "IAM user עם access keys שמורים כ-secrets ב-CI, עם rotation פעם בשנה" },
        { en: "The root user's keys, locked in a vault", he: "ה-keys של ה-root user, נעולים ב-vault" },
        { en: "OIDC federation from the CI provider to an IAM role with a narrow trust policy (repo + branch)", he: "OIDC federation מספק ה-CI ל-IAM role עם trust policy צרה (repo ו-branch)" },
        { en: "An EC2 instance profile on the CI runner, shared by all repos", he: "Instance profile של EC2 על ה-runner של ה-CI, משותף לכל ה-repos" }
      ],
      answer: 2,
      explain: { en: "OIDC gives short-lived credentials per run, with nothing stored. The trust policy condition on the token's sub claim (repo:org/app:ref:refs/heads/main) keeps other repos and branches out.", he: "OIDC נותן credentials קצרי חיים לכל ריצה, בלי שום דבר שמור. ה-condition ב-trust policy על ה-claim בשם sub של ה-token (repo:org/app:ref:refs/heads/main) משאיר בחוץ repos ו-branches אחרים." }
    }
  ],
  related: ["cloud-provider-map", "cloud-aws-iam-deep", "cloud-landing-zones", "net-vpc", "cloud-managed-k8s-compare", "aws-eks-production", "aws-networking-edge"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "aws-eks-production",
  track: "kubernetes",
  order: 50,
  icon: "🟧",
  level: 3,
  minutes: 22,
  title: { en: "EKS in Production: from eksctl to Day 2", he: "EKS ב-production: מ-eksctl ועד Day 2" },
  tldr: {
    en: "A production EKS cluster is the control plane plus a set of pieces you choose and own: managed add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI, Pod Identity agent), access entries for who may use kubectl, the AWS Load Balancer Controller for ALB/NLB, Karpenter (or Auto Mode) for nodes, Bottlerocket or AL2023 as the node OS, and Pod Identity for AWS credentials. Day 2 is keeping all of them versioned, upgraded and cheap.",
    he: "Cluster של EKS ב-production הוא ה-control plane ועוד סט רכיבים שאתה בוחר ומחזיק: managed add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI, ה-agent של Pod Identity), access entries שקובעים מי משתמש ב-kubectl, ה-AWS Load Balancer Controller בשביל ALB ו-NLB, Karpenter (או Auto Mode) בשביל nodes, Bottlerocket או AL2023 כמערכת ההפעלה, ו-Pod Identity בשביל credentials של AWS. Day 2 זה לשמור על כולם עם גרסאות מנוהלות, מעודכנים וזולים."
  },
  analogy: {
    en: "EKS is like leasing an empty restaurant with a working kitchen manager (the control plane). The manager keeps the orders flowing, but you still hire the cooks (nodes), buy the stoves (add-ons), decide who gets a key (access entries), hire the doorman (load balancer controller) and the staffing agency (Karpenter). Auto Mode is the same restaurant with the agency, stoves and doorman included in the rent.",
    he: "EKS זה כמו לשכור מסעדה ריקה עם מנהל מטבח שעובד (ה-control plane). המנהל דואג שההזמנות יזרמו, אבל אתה עדיין מגייס את הטבחים (nodes), קונה את הכיריים (add-ons), מחליט למי יש מפתח (access entries), שוכר את השומר בכניסה (ה-load balancer controller) ואת חברת כוח האדם (Karpenter). Auto Mode זו אותה מסעדה, כשחברת כוח האדם, הכיריים והשומר כלולים בשכירות."
  },
  sections: [
    {
      h: { en: "Creating the cluster: eksctl and Terraform", he: "יצירת ה-cluster: eksctl ו-Terraform" },
      body: {
        en: `<p><code>eksctl</code> is great for learning and for small teams; most platform teams run Terraform so the cluster lives with the VPC, IAM and the rest of the account baseline.</p>
<pre>apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: prod-euw1
  region: eu-west-1
  version: "1.34"
vpc:
  id: vpc-0abc1234
  subnets:
    private:
      eu-west-1a: { id: subnet-0aaa }
      eu-west-1b: { id: subnet-0bbb }
      eu-west-1c: { id: subnet-0ccc }
  clusterEndpoints: { privateAccess: true, publicAccess: false }
accessConfig:
  authenticationMode: API
addons:
  - name: vpc-cni
    useDefaultPodIdentityAssociations: true
  - name: coredns
  - name: kube-proxy
  - name: eks-pod-identity-agent
  - name: aws-ebs-csi-driver
    useDefaultPodIdentityAssociations: true
managedNodeGroups:
  - name: system
    instanceType: m7g.large
    amiFamily: Bottlerocket
    minSize: 3
    maxSize: 6
    privateNetworking: true
    taints: [{ key: CriticalAddonsOnly, value: "true", effect: NoSchedule }]</pre>
<p>The same with <code>terraform-aws-modules/eks</code> (v21 renamed most inputs and dropped the <code>cluster_</code> prefix; check the module's upgrade notes for your version):</p>
<pre>module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = "prod-euw1"
  kubernetes_version = "1.34"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  endpoint_public_access = false

  addons = {
    vpc-cni                = { before_compute = true }
    eks-pod-identity-agent = { before_compute = true }
    coredns                = {}
    kube-proxy             = {}
  }

  eks_managed_node_groups = {
    system = {
      ami_type       = "BOTTLEROCKET_ARM_64"
      instance_types = ["m7g.large"]
      min_size = 3, max_size = 6, desired_size = 3
      taints = { addons = { key = "CriticalAddonsOnly", value = "true", effect = "NO_SCHEDULE" } }
    }
  }
}</pre>
<p>A common production shape: a small managed node group for system pods (Karpenter itself, CoreDNS) and Karpenter for everything else. Karpenter must not run on nodes it manages.</p>`,
        he: `<p><code>eksctl</code> מצוין ללמידה ולצוותים קטנים; רוב צוותי הפלטפורמה מריצים Terraform, כדי שה-cluster יחיה לצד ה-VPC, ה-IAM ושאר ה-baseline של ה-account.</p>
<pre>apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: prod-euw1
  region: eu-west-1
  version: "1.34"
vpc:
  id: vpc-0abc1234
  subnets:
    private:
      eu-west-1a: { id: subnet-0aaa }
      eu-west-1b: { id: subnet-0bbb }
      eu-west-1c: { id: subnet-0ccc }
  clusterEndpoints: { privateAccess: true, publicAccess: false }
accessConfig:
  authenticationMode: API
addons:
  - name: vpc-cni
    useDefaultPodIdentityAssociations: true
  - name: coredns
  - name: kube-proxy
  - name: eks-pod-identity-agent
  - name: aws-ebs-csi-driver
    useDefaultPodIdentityAssociations: true
managedNodeGroups:
  - name: system
    instanceType: m7g.large
    amiFamily: Bottlerocket
    minSize: 3
    maxSize: 6
    privateNetworking: true
    taints: [{ key: CriticalAddonsOnly, value: "true", effect: NoSchedule }]</pre>
<p>אותו דבר עם <code>terraform-aws-modules/eks</code> (גרסה 21 שינתה את שמות רוב ה-inputs והורידה את הקידומת <code>cluster_</code>; תבדוק את ה-upgrade notes של המודול לגרסה שלך):</p>
<pre>module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = "prod-euw1"
  kubernetes_version = "1.34"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  endpoint_public_access = false

  addons = {
    vpc-cni                = { before_compute = true }
    eks-pod-identity-agent = { before_compute = true }
    coredns                = {}
    kube-proxy             = {}
  }

  eks_managed_node_groups = {
    system = {
      ami_type       = "BOTTLEROCKET_ARM_64"
      instance_types = ["m7g.large"]
      min_size = 3, max_size = 6, desired_size = 3
      taints = { addons = { key = "CriticalAddonsOnly", value = "true", effect = "NO_SCHEDULE" } }
    }
  }
}</pre>
<p>מבנה נפוץ ב-production: node group מנוהל וקטן ל-Pods של המערכת (Karpenter עצמו, CoreDNS), ו-Karpenter לכל השאר. אסור ש-Karpenter ירוץ על nodes שהוא עצמו מנהל.</p>`
      }
    },
    {
      h: { en: "Add-ons, access entries and identity", he: "Add-ons, access entries וזהות" },
      body: {
        en: `<p><strong>Managed add-ons</strong> are versioned per Kubernetes minor. They don't auto-upgrade with the control plane; an upgrade is: control plane → add-ons → nodes.</p>
<pre>aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.34 \\
  --query 'addons[0].addonVersions[0:3].addonVersion'
aws eks update-addon --cluster-name prod-euw1 --addon-name vpc-cni \\
  --addon-version v1.20.4-eksbuild.1 --resolve-conflicts PRESERVE</pre>
<p><code>--resolve-conflicts PRESERVE</code> keeps fields you changed (like <code>ENABLE_PREFIX_DELEGATION</code>); <code>OVERWRITE</code> resets them to the add-on defaults. Better: set config through <code>--configuration-values</code> so it lives in IaC.</p>
<p><strong>Access entries</strong> replace the <code>aws-auth</code> ConfigMap. With <code>authenticationMode: API</code>, cluster access is an EKS API object you manage with IAM-style tooling, not a YAML file one bad edit can wipe out.</p>
<pre>aws eks create-access-entry --cluster-name prod-euw1 \\
  --principal-arn arn:aws:iam::111122223333:role/AWSReservedSSO_PlatformAdmin_0a1b2c3d
aws eks associate-access-policy --cluster-name prod-euw1 \\
  --principal-arn arn:aws:iam::111122223333:role/AWSReservedSSO_PlatformAdmin_0a1b2c3d \\
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \\
  --access-scope type=cluster
# read-only for developers, limited to two namespaces
aws eks associate-access-policy ... --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy \\
  --access-scope type=namespace,namespaces=payments,orders</pre>
<p>Migration path: <code>CONFIG_MAP</code> → <code>API_AND_CONFIG_MAP</code> (both work, entries win) → <code>API</code>. The switch is one-way.</p>
<p><strong>Pod Identity</strong> for workloads, and lock down IMDS so pods can't borrow the node role:</p>
<pre>aws eks create-pod-identity-association --cluster-name prod-euw1 \\
  --namespace payments --service-account invoicer \\
  --role-arn arn:aws:iam::111122223333:role/invoicer
# role trust policy principal: { "Service": "pods.eks.amazonaws.com" },
# actions: sts:AssumeRole, sts:TagSession</pre>
<blockquote>⚠️ Production tip: set <code>HttpTokens=required</code> (IMDSv2) and <code>HttpPutResponseHopLimit=1</code> on node launch templates (or in the Karpenter EC2NodeClass). With hop limit 1, the IMDSv2 token response can't cross the extra network hop into a pod's namespace, so pods can't reach the node role. Hop limit 2 is needed only if pods must call IMDS (some older agents); then the node role is effectively shared by every pod.</blockquote>`,
        he: `<p><strong>Managed add-ons</strong> מנוהלים בגרסאות לכל minor של Kubernetes. הם לא משתדרגים אוטומטית עם ה-control plane. הסדר של upgrade הוא: control plane, אחריו add-ons, ואחריהם nodes.</p>
<pre>aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.34 \\
  --query 'addons[0].addonVersions[0:3].addonVersion'
aws eks update-addon --cluster-name prod-euw1 --addon-name vpc-cni \\
  --addon-version v1.20.4-eksbuild.1 --resolve-conflicts PRESERVE</pre>
<p>האפשרות <code>--resolve-conflicts PRESERVE</code> שומרת על שדות ששינית (כמו <code>ENABLE_PREFIX_DELEGATION</code>); <code>OVERWRITE</code> מחזירה אותם לברירת המחדל של ה-add-on. עדיף להגדיר דרך <code>--configuration-values</code>, כדי שזה יחיה ב-IaC.</p>
<p><strong>Access entries</strong> מחליפים את ה-ConfigMap בשם <code>aws-auth</code>. עם <code>authenticationMode: API</code>, הגישה ל-cluster היא אובייקט ב-API של EKS שמנהלים עם כלים בסגנון IAM, ולא קובץ YAML שעריכה גרועה אחת יכולה למחוק.</p>
<pre>aws eks create-access-entry --cluster-name prod-euw1 \\
  --principal-arn arn:aws:iam::111122223333:role/AWSReservedSSO_PlatformAdmin_0a1b2c3d
aws eks associate-access-policy --cluster-name prod-euw1 \\
  --principal-arn arn:aws:iam::111122223333:role/AWSReservedSSO_PlatformAdmin_0a1b2c3d \\
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \\
  --access-scope type=cluster
# read-only for developers, limited to two namespaces
aws eks associate-access-policy ... --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy \\
  --access-scope type=namespace,namespaces=payments,orders</pre>
<p>מסלול המיגרציה: <code>CONFIG_MAP</code>, אחר כך <code>API_AND_CONFIG_MAP</code> (שניהם עובדים, וה-entries גוברים), ובסוף <code>API</code>. המעבר הוא חד-כיווני.</p>
<p><strong>Pod Identity</strong> בשביל ה-workloads, ונעילה של IMDS כדי ש-Pods לא ישאלו את ה-role של ה-node:</p>
<pre>aws eks create-pod-identity-association --cluster-name prod-euw1 \\
  --namespace payments --service-account invoicer \\
  --role-arn arn:aws:iam::111122223333:role/invoicer
# role trust policy principal: { "Service": "pods.eks.amazonaws.com" },
# actions: sts:AssumeRole, sts:TagSession</pre>
<blockquote>⚠️ Production tip: תגדיר <code>HttpTokens=required</code> (IMDSv2) ו-<code>HttpPutResponseHopLimit=1</code> ב-launch templates של ה-nodes (או ב-EC2NodeClass של Karpenter). עם hop limit של 1, התשובה עם ה-token של IMDSv2 לא עוברת את ה-hop הנוסף לתוך ה-namespace של ה-Pod, ולכן Pods לא מגיעים ל-role של ה-node. צריך hop limit של 2 רק אם Pods חייבים לקרוא ל-IMDS (חלק מה-agents הישנים), ואז ה-role של ה-node בעצם משותף לכל Pod.</blockquote>`
      }
    },
    {
      h: { en: "Load balancing: the AWS Load Balancer Controller", he: "Load balancing: ה-AWS Load Balancer Controller" },
      body: {
        en: `<p>The in-tree cloud provider still creates Classic/NLB load balancers, but production clusters install the <strong>AWS Load Balancer Controller</strong> (Helm chart, needs an IAM role via Pod Identity). It turns Ingress into an <strong>ALB</strong> and <code>Service type: LoadBalancer</code> into an <strong>NLB</strong>; recent versions also support Gateway API (check the release notes for your version).</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: public-shared      # many Ingresses, one ALB
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:eu-west-1:111122223333:certificate/abcd-1234
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
spec:
  ingressClassName: alb
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: api, port: { number: 8080 } } }
---
apiVersion: v1
kind: Service
metadata:
  name: grpc-edge
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internal
spec:
  type: LoadBalancer
  ports: [{ port: 443, targetPort: 8443, protocol: TCP }]
  selector: { app: grpc-edge }</pre>
<ul>
<li><strong><code>target-type: ip</code></strong> registers pod IPs directly in the target group: no NodePort hop, no kube-proxy SNAT, real client-to-pod health checks. <code>instance</code> mode goes through NodePort on every node.</li>
<li><strong>Pod readiness gates</strong>: label the namespace <code>elbv2.k8s.aws/pod-readiness-gate-inject=enabled</code> so a rolling update waits until the new pod is <em>healthy in the target group</em>. Without it, a fast rollout can leave the ALB with zero healthy targets.</li>
<li><strong>TargetGroupBinding</strong>: a CRD that attaches pods to a target group created outside Kubernetes (by Terraform). Use it when the ALB/NLB must outlive the cluster, for example during blue/green cluster migration or when Global Accelerator points at a fixed load balancer.</li>
</ul>
<pre>apiVersion: elbv2.k8s.aws/v1beta1
kind: TargetGroupBinding
metadata: { name: api-tgb, namespace: api }
spec:
  serviceRef: { name: api, port: 8080 }
  targetGroupARN: arn:aws:elasticloadbalancing:eu-west-1:111122223333:targetgroup/api-blue/0123456789abcdef
  targetType: ip</pre>`,
        he: `<p>ה-cloud provider המובנה עדיין יוצר load balancers מסוג Classic או NLB, אבל clusters של production מתקינים את <strong>AWS Load Balancer Controller</strong> (Helm chart, צריך IAM role דרך Pod Identity). הוא הופך Ingress ל-<strong>ALB</strong>, ו-Service מסוג LoadBalancer ל-<strong>NLB</strong>. גרסאות חדשות תומכות גם ב-Gateway API (תבדוק את ה-release notes לגרסה שלך).</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: public-shared      # many Ingresses, one ALB
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:eu-west-1:111122223333:certificate/abcd-1234
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
spec:
  ingressClassName: alb
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: api, port: { number: 8080 } } }
---
apiVersion: v1
kind: Service
metadata:
  name: grpc-edge
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internal
spec:
  type: LoadBalancer
  ports: [{ port: 443, targetPort: 8443, protocol: TCP }]
  selector: { app: grpc-edge }</pre>
<ul>
<li><strong><code>target-type: ip</code></strong> רושם את ה-IPs של ה-Pods ישירות ב-target group: בלי hop של NodePort, בלי SNAT של kube-proxy, ועם health checks אמיתיים מה-LB עד ה-Pod. מצב <code>instance</code> עובר דרך NodePort על כל node.</li>
<li><strong>Pod readiness gates</strong>: תסמן את ה-namespace עם הלייבל <code>elbv2.k8s.aws/pod-readiness-gate-inject=enabled</code>, כדי ש-rolling update יחכה עד שה-Pod החדש <em>בריא ב-target group</em>. בלי זה, rollout מהיר יכול להשאיר את ה-ALB עם אפס targets בריאים.</li>
<li><strong>TargetGroupBinding</strong>: CRD שמחבר Pods ל-target group שנוצר מחוץ ל-Kubernetes (ב-Terraform). משתמשים בו כשה-ALB או ה-NLB צריכים לחיות יותר מה-cluster, למשל במיגרציית blue/green בין clusters, או כש-Global Accelerator מצביע על load balancer קבוע.</li>
</ul>
<pre>apiVersion: elbv2.k8s.aws/v1beta1
kind: TargetGroupBinding
metadata: { name: api-tgb, namespace: api }
spec:
  serviceRef: { name: api, port: 8080 }
  targetGroupARN: arn:aws:elasticloadbalancing:eu-west-1:111122223333:targetgroup/api-blue/0123456789abcdef
  targetType: ip</pre>`
      }
    },
    {
      h: { en: "Nodes: Karpenter, Auto Mode, Bottlerocket vs AL2023", he: "Nodes: Karpenter, Auto Mode, ו-Bottlerocket מול AL2023" },
      body: {
        en: `<p><strong>Karpenter</strong> (v1 API) looks at pending pods and launches the cheapest instances that fit, then consolidates underused nodes away.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
      expireAfter: 720h                  # recycle nodes every 30 days (new AMI, no drift)
      requirements:
      - { key: karpenter.sh/capacity-type, operator: In, values: ["spot", "on-demand"] }
      - { key: kubernetes.io/arch, operator: In, values: ["arm64", "amd64"] }
      - { key: karpenter.k8s.aws/instance-category, operator: In, values: ["c", "m", "r"] }
      - { key: karpenter.k8s.aws/instance-generation, operator: Gt, values: ["5"] }
  limits: { cpu: "2000", memory: 8000Gi }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 2m
    budgets:
    - nodes: "10%"
    - nodes: "0"
      schedule: "0 8 * * mon-fri"        # no voluntary disruption during business peak
      duration: 10h
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata: { name: default }
spec:
  role: KarpenterNodeRole-prod-euw1
  amiSelectorTerms: [{ alias: bottlerocket@latest }]   # pin a version in prod, e.g. bottlerocket@v1.x.y
  subnetSelectorTerms: [{ tags: { karpenter.sh/discovery: prod-euw1 } }]
  securityGroupSelectorTerms: [{ tags: { karpenter.sh/discovery: prod-euw1 } }]
  metadataOptions: { httpTokens: required, httpPutResponseHopLimit: 1 }</pre>
<p><strong>EKS Auto Mode</strong> runs Karpenter, the VPC CNI, CoreDNS, kube-proxy, EBS CSI, Pod Identity and the load balancer controller as AWS-owned components off your nodes, and nodes run a Bottlerocket-based, immutable, AWS-patched OS with a maximum lifetime (21 days at most). You pay a management fee per instance on top of EC2 (check current pricing). Trade: far less Day-2 toil, less control (no SSH, no custom AMI, AWS chooses component versions).</p>
<table>
<tr><th></th><th>Bottlerocket</th><th>Amazon Linux 2023</th></tr>
<tr><td>Design</td><td>Container-only OS, read-only root, dm-verity, A/B image updates</td><td>General-purpose Linux, dnf, SSH-friendly</td></tr>
<tr><td>Config</td><td>TOML settings via user data / API</td><td>nodeadm (<code>NodeConfig</code> YAML) in user data</td></tr>
<tr><td>Debug</td><td>Admin/control containers, <code>apiclient</code></td><td>SSH / SSM and usual tools</td></tr>
<tr><td>Fits</td><td>Hardened, immutable fleets</td><td>Agents that need host packages, custom kernels</td></tr>
</table>
<p>Amazon Linux 2 AMIs for EKS reached end of support in November 2025; Kubernetes 1.32 was the last version with AL2 AMIs. Any AL2 node group is now a migration item.</p>`,
        he: `<p><strong>Karpenter</strong> (API גרסה v1) מסתכל על Pods ב-Pending ומרים את ה-instances הזולים ביותר שמתאימים, ואחר כך מאחד ומוריד nodes לא מנוצלים.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
      expireAfter: 720h                  # recycle nodes every 30 days (new AMI, no drift)
      requirements:
      - { key: karpenter.sh/capacity-type, operator: In, values: ["spot", "on-demand"] }
      - { key: kubernetes.io/arch, operator: In, values: ["arm64", "amd64"] }
      - { key: karpenter.k8s.aws/instance-category, operator: In, values: ["c", "m", "r"] }
      - { key: karpenter.k8s.aws/instance-generation, operator: Gt, values: ["5"] }
  limits: { cpu: "2000", memory: 8000Gi }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 2m
    budgets:
    - nodes: "10%"
    - nodes: "0"
      schedule: "0 8 * * mon-fri"        # no voluntary disruption during business peak
      duration: 10h
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata: { name: default }
spec:
  role: KarpenterNodeRole-prod-euw1
  amiSelectorTerms: [{ alias: bottlerocket@latest }]   # pin a version in prod, e.g. bottlerocket@v1.x.y
  subnetSelectorTerms: [{ tags: { karpenter.sh/discovery: prod-euw1 } }]
  securityGroupSelectorTerms: [{ tags: { karpenter.sh/discovery: prod-euw1 } }]
  metadataOptions: { httpTokens: required, httpPutResponseHopLimit: 1 }</pre>
<p><strong>EKS Auto Mode</strong> מריץ את Karpenter, ה-VPC CNI, CoreDNS, kube-proxy, EBS CSI, Pod Identity וה-load balancer controller כרכיבים בבעלות AWS, מחוץ ל-nodes שלך. ה-nodes רצים על מערכת הפעלה immutable מבוססת Bottlerocket, ש-AWS מעדכנים, עם אורך חיים מקסימלי (עד 21 יום). משלמים management fee לכל instance מעל מחיר ה-EC2 (תבדוק תמחור עדכני). ה-tradeoff: הרבה פחות עבודת Day 2, ופחות שליטה (אין SSH, אין AMI מותאם, ו-AWS בוחרים את גרסאות הרכיבים).</p>
<table>
<tr><th></th><th>Bottlerocket</th><th>Amazon Linux 2023</th></tr>
<tr><td>תכנון</td><td>מערכת הפעלה רק ל-containers, root לקריאה בלבד, dm-verity, עדכוני image בשיטת A/B</td><td>Linux כללי, dnf, נוח ל-SSH</td></tr>
<tr><td>קונפיגורציה</td><td>הגדרות TOML דרך user data או API</td><td>nodeadm (YAML מסוג <code>NodeConfig</code>) ב-user data</td></tr>
<tr><td>דיבאג</td><td>Admin ו-control containers, <code>apiclient</code></td><td>SSH או SSM והכלים הרגילים</td></tr>
<tr><td>מתאים ל</td><td>צי nodes מוקשח ו-immutable</td><td>Agents שצריכים חבילות על ה-host או kernel מותאם</td></tr>
</table>
<p>תמיכת EKS ב-AMIs של Amazon Linux 2 הסתיימה בנובמבר 2025, ו-Kubernetes 1.32 הייתה הגרסה האחרונה עם AMIs כאלה. כל node group על AL2 הוא עכשיו משימת מיגרציה.</p>`
      }
    },
    {
      h: { en: "Observability and cost levers", he: "Observability ומנופי עלות" },
      body: {
        en: `<p><strong>CloudWatch Container Insights</strong> (the <code>amazon-cloudwatch-observability</code> add-on, with enhanced observability) gives node/pod/container metrics, control-plane dashboards and logs with zero Prometheus to run. It's billed per observation and per GB of logs, which grows with pod count. <strong>Prometheus</strong> (self-hosted, or Amazon Managed Service for Prometheus with an agentless managed scraper) is what most platform teams standardize on for app metrics, PromQL alerts and Grafana. A common split: Container Insights or vendor for infra, Prometheus for SLO alerts. Turn on control-plane logs selectively (<code>audit</code> and <code>authenticator</code> are the useful ones; <code>api</code> is expensive).</p>
<pre>aws eks update-cluster-config --name prod-euw1 \\
  --logging '{"clusterLogging":[{"types":["audit","authenticator"],"enabled":true}]}'</pre>
<p><strong>Cost levers, roughly in order of impact:</strong></p>
<ol>
<li><strong>Right-size requests</strong>. Karpenter bin-packs on requests, not usage. Inflated requests = idle nodes.</li>
<li><strong>Spot + Graviton</strong>: diversified Spot (many instance types, all AZs) for stateless workloads, arm64 images for 20-40% better price-performance in many workloads (benchmark yours).</li>
<li><strong>Consolidation</strong> on, with disruption budgets and PDBs so it's safe.</li>
<li><strong>Network</strong>: VPC endpoints for ECR, S3, STS and CloudWatch instead of NAT; topology-aware routing to cut cross-AZ traffic.</li>
<li><strong>Control plane hygiene</strong>: stay on standard support. A cluster that ages into extended support costs 6x per hour; set <code>upgradePolicy.supportType=STANDARD</code> on non-critical clusters.</li>
<li><strong>Commitments</strong>: Compute Savings Plans for the on-demand floor (they cover EC2, Fargate and Lambda).</li>
</ol>`,
        he: `<p><strong>CloudWatch Container Insights</strong> (ה-add-on בשם <code>amazon-cloudwatch-observability</code>, עם enhanced observability) נותן מטריקות של nodes, Pods ו-containers, dashboards ל-control plane ולוגים, בלי להריץ Prometheus בכלל. החיוב לפי observation ולפי GB של לוגים, ולכן גדל עם מספר ה-Pods. <strong>Prometheus</strong> (self-hosted, או Amazon Managed Service for Prometheus עם managed scraper בלי agent) הוא הסטנדרט של רוב צוותי הפלטפורמה למטריקות אפליקטיביות, alerts ב-PromQL ו-Grafana. חלוקה נפוצה: Container Insights או ספק חיצוני לתשתית, ו-Prometheus ל-alerts של SLO. תפעיל לוגים של ה-control plane באופן סלקטיבי (<code>audit</code> ו-<code>authenticator</code> הם השימושיים; <code>api</code> יקר).</p>
<pre>aws eks update-cluster-config --name prod-euw1 \\
  --logging '{"clusterLogging":[{"types":["audit","authenticator"],"enabled":true}]}'</pre>
<p><strong>מנופי עלות, בערך לפי סדר ההשפעה:</strong></p>
<ol>
<li><strong>Right-size ל-requests</strong>. Karpenter אורז לפי requests, לא לפי שימוש בפועל. requests מנופחים שווים nodes סרק.</li>
<li><strong>Spot ו-Graviton</strong>: Spot מגוון (הרבה סוגי instances, כל ה-AZs) ל-workloads בלי state, ו-images של arm64 שנותנים price-performance טוב ב-20-40% בהרבה workloads (תמדוד אצלך).</li>
<li><strong>Consolidation</strong> מופעל, עם disruption budgets ו-PDBs כדי שיהיה בטוח.</li>
<li><strong>רשת</strong>: VPC endpoints ל-ECR, S3, STS ו-CloudWatch במקום NAT; topology-aware routing כדי לצמצם תעבורה בין AZs.</li>
<li><strong>היגיינה של ה-control plane</strong>: להישאר ב-standard support. Cluster שמזדקן לתוך extended support עולה פי 6 לשעה; ב-clusters לא קריטיים תגדיר <code>upgradePolicy.supportType=STANDARD</code>.</li>
<li><strong>Commitments</strong>: Compute Savings Plans לרצפת ה-on-demand (הם מכסים EC2, Fargate ו-Lambda).</li>
</ol>`
      }
    }
  ],
  diagram: `                 Route 53 / Global Accelerator
                              |
                 ALB (target-type: ip)  <- AWS Load Balancer Controller (Ingress / TargetGroupBinding)
                              |
  +---------------- EKS cluster (prod-euw1) ----------------+
  | control plane (AWS)  <- access entries (who) + audit logs |
  |                                                           |
  | system MNG (Bottlerocket, tainted)   Karpenter NodePools   |
  |  karpenter, coredns, LBC             spot+on-demand, arm64 |
  |                                                           |
  | each node: aws-node (VPC CNI) | kube-proxy | pod-identity  |
  |            IMDSv2, hop limit 1                            |
  +-------- pods get VPC IPs from subnets in 3 AZs -----------+
       |  Pod Identity -> IAM role -> S3 / SQS / Secrets Manager`,
  handsOn: [
    { cmd: "aws eks list-addons --cluster-name prod-euw1 && aws eks describe-addon --cluster-name prod-euw1 --addon-name vpc-cni --query 'addon.[addonVersion,status]'", what: { en: "Inventory the managed add-ons and their versions before an upgrade.", he: "מלאי של ה-managed add-ons והגרסאות שלהם לפני upgrade." } },
    { cmd: "aws eks list-access-entries --cluster-name prod-euw1 && aws eks list-associated-access-policies --cluster-name prod-euw1 --principal-arn <role-arn>", what: { en: "Answer 'who can run kubectl on prod' from the EKS API, not from a ConfigMap.", he: "תענה על 'מי יכול להריץ kubectl על prod' מתוך ה-API של EKS, ולא מתוך ConfigMap." } },
    { cmd: "kubectl get nodepools,nodeclaims -o wide && kubectl get nodes -L karpenter.sh/capacity-type,node.kubernetes.io/instance-type,topology.kubernetes.io/zone", what: { en: "See which instance types, capacity types and AZs Karpenter actually chose.", he: "תראה אילו סוגי instances, capacity types ו-AZs ש-Karpenter בחר בפועל." } },
    { cmd: "aws eks list-pod-identity-associations --cluster-name prod-euw1 --namespace payments", what: { en: "Map service accounts to IAM roles; check that no workload falls back to the node role.", he: "מיפוי של service accounts ל-IAM roles, ובדיקה שאף workload לא נופל חזרה ל-role של ה-node." } },
    { cmd: "aws eks list-insights --cluster-name prod-euw1 --filter kubernetesVersions=1.35", what: { en: "Upgrade insights: deprecated APIs in use, add-on compatibility, node version skew before moving to the next minor.", he: "Upgrade insights: APIs שיוצאים משימוש ועדיין בשימוש, תאימות add-ons ו-version skew של nodes, לפני מעבר ל-minor הבא." } }
  ],
  mnemonic: {
    en: "CANIL: Control plane, Add-ons, Nodes in that upgrade order; Identity via Pod Identity; Load balancers via the controller.",
    he: "CANIL: קודם Control plane, אחריו Add-ons ואחריהם Nodes, זה סדר ה-upgrade; Identity דרך Pod Identity; ו-Load balancers דרך ה-controller."
  },
  pitfalls: [
    { en: "Running Karpenter on nodes Karpenter manages. A consolidation or expiry can evict Karpenter itself, and nothing is left to launch replacement capacity. Run it on a small managed node group (or Fargate).", he: "הרצה של Karpenter על nodes ש-Karpenter מנהל. Consolidation או expiry יכולים לפנות את Karpenter עצמו, ואז לא נשאר מי שירים capacity חלופי. תריץ אותו על node group מנוהל וקטן (או על Fargate)." },
    { en: "Rolling out with ALB target-type ip and no pod readiness gates. Kubernetes marks new pods Ready and kills old ones before the ALB finishes health-checking the new targets, causing 502/503 bursts on every deploy.", he: "Rollout עם ALB במצב target-type ip ובלי pod readiness gates. Kubernetes מסמן את ה-Pods החדשים כ-Ready והורג את הישנים לפני שה-ALB סיים לבדוק את ה-targets החדשים, וכל deploy מייצר פרץ של 502 ו-503." },
    { en: "Leaving IMDS hop limit at 2 with no Pod Identity/IRSA on some workloads. Those pods silently use the node instance role, which usually has ECR, EBS and EC2 permissions: a lateral-movement path after any pod compromise.", he: "השארת hop limit של 2 ב-IMDS כשלחלק מה-workloads אין Pod Identity או IRSA. ה-Pods האלה משתמשים בשקט ב-role של ה-node, שבדרך כלל יש לו הרשאות ל-ECR, EBS ו-EC2: דרך לתנועה רוחבית אחרי פריצה לכל Pod." },
    { en: "Upgrading the control plane and forgetting add-ons and nodes. The cluster now runs a kube-proxy or VPC CNI version not tested with the new API server, and the next node rotation fails in surprising ways. Upgrade in order: control plane, add-ons, nodes, and read upgrade insights first.", he: "Upgrade ל-control plane ושכחה של ה-add-ons וה-nodes. ה-cluster מריץ עכשיו גרסה של kube-proxy או VPC CNI שלא נבדקה מול ה-API server החדש, וה-rotation הבא של nodes נכשל בדרכים מפתיעות. תשדרג לפי הסדר: control plane, add-ons ואז nodes, ותקרא קודם את ה-upgrade insights." }
  ],
  interview: [
    {
      q: { en: "Walk me through upgrading a production EKS cluster from 1.33 to 1.34 with zero downtime.", he: "תעביר אותי דרך upgrade של cluster של EKS ב-production מ-1.33 ל-1.34 בלי downtime." },
      a: {
        en: "Before: read the Kubernetes changelog and EKS release notes, run aws eks list-insights and a tool like pluto/kubent for removed APIs, check add-on and Helm chart compatibility (LBC, Karpenter, CSI drivers, service mesh), upgrade in a staging cluster first. Make sure PDBs exist and are not blocking (minAvailable = replicas blocks drains forever). Then: upgrade the control plane (in-place, about 10-15 minutes, API stays available); upgrade managed add-ons (vpc-cni, coredns, kube-proxy, ebs-csi) to versions listed for 1.34; then nodes: for Karpenter, update the EC2NodeClass AMI (or let drift detection replace nodes when the alias resolves to a new AMI) and let disruption budgets roll nodes gradually; for managed node groups, update the node group version which does a surge-and-drain. Watch error rates and pending pods during the roll. Strong answers mention: you can only move one minor at a time, kubelet may lag the API server (skew policy), rollback of the control plane isn't possible, so the real rollback is a blue/green cluster behind weighted Route 53 or Global Accelerator.",
        he: "לפני: לקרוא את ה-changelog של Kubernetes ואת ה-release notes של EKS, להריץ aws eks list-insights וכלי כמו pluto או kubent בשביל APIs שהוסרו, לבדוק תאימות של add-ons ו-Helm charts (LBC, Karpenter, CSI drivers, service mesh), ולשדרג קודם cluster של staging. לוודא שיש PDBs ושהם לא חוסמים (minAvailable ששווה למספר ה-replicas חוסם drain לנצח). ואז: upgrade ל-control plane (in-place, בערך 10-15 דקות, ה-API נשאר זמין); upgrade ל-managed add-ons (vpc-cni, coredns, kube-proxy, ebs-csi) לגרסאות שמופיעות עבור 1.34; ואז nodes: עם Karpenter מעדכנים את ה-AMI ב-EC2NodeClass (או נותנים ל-drift detection להחליף nodes כשה-alias מצביע על AMI חדש) ונותנים ל-disruption budgets לגלגל nodes בהדרגה; ב-managed node groups מעדכנים את גרסת ה-node group, והוא עושה surge ו-drain. במהלך הגלגול עוקבים אחרי error rates ו-Pods ב-Pending. תשובה חזקה מזכירה: אפשר לזוז רק minor אחד בכל פעם, ה-kubelet יכול לפגר אחרי ה-API server (skew policy), ואין rollback ל-control plane, ולכן ה-rollback האמיתי הוא cluster של blue/green מאחורי Route 53 משוקלל או Global Accelerator."
      }
    },
    {
      q: { en: "Karpenter or EKS Auto Mode for a new multi-region platform? Defend your choice.", he: "Karpenter או EKS Auto Mode לפלטפורמה רב-אזורית חדשה? תגן על הבחירה שלך." },
      a: {
        en: "It's a control vs toil tradeoff. Auto Mode: AWS runs Karpenter, CNI, CoreDNS, EBS CSI, LBC and patches the node OS; nodes are immutable and recycled within 21 days; you pay a per-instance management fee. Great when the team is small and the workloads are standard. Self-managed Karpenter + managed add-ons: you choose component versions and timing, can use custom AMIs, specific CNI settings (custom networking, prefix delegation tuning), SSH/SSM for debugging, third-party CNIs like Cilium; no fee, but someone owns upgrades of every component in every cluster in every region. My answer for a platform team with GitOps maturity: self-managed Karpenter with add-ons pinned in Terraform, because multi-region consistency and controlled change windows matter more than toil; I'd reconsider Auto Mode for long-tail clusters (dev, sandboxes) where the fee is cheaper than engineer time. Mention the fee as a percentage of EC2 spend scales with the fleet, so model it.",
        he: "זה tradeoff בין שליטה לעבודה שוטפת. Auto Mode: AWS מריצים את Karpenter, ה-CNI, CoreDNS, EBS CSI ו-LBC, ומעדכנים את מערכת ההפעלה של ה-nodes; ה-nodes הם immutable ומתחלפים תוך 21 יום לכל היותר; משלמים management fee לכל instance. מצוין כשהצוות קטן וה-workloads סטנדרטיים. Karpenter בניהול עצמי עם managed add-ons: אתה בוחר גרסאות ותזמון, יכול להשתמש ב-AMIs מותאמים, בהגדרות CNI ספציפיות (custom networking, כיוון של prefix delegation), ב-SSH או SSM לדיבאג, וב-CNIs חיצוניים כמו Cilium. אין fee, אבל מישהו אחראי על upgrade של כל רכיב בכל cluster בכל region. התשובה שלי לצוות פלטפורמה עם בגרות של GitOps: Karpenter בניהול עצמי עם add-ons נעולים ב-Terraform, כי עקביות בין regions וחלונות שינוי מבוקרים חשובים יותר מהעבודה השוטפת. הייתי שוקל Auto Mode ל-clusters שוליים (dev, sandboxes), שם ה-fee זול יותר מזמן מהנדס. כדאי לציין שה-fee הוא אחוז מהוצאת ה-EC2 וגדל עם הצי, אז צריך למדל אותו."
      }
    },
    {
      q: { en: "Why use target-type ip instead of instance for an ALB in front of EKS?", he: "למה להשתמש ב-target-type ip ולא ב-instance ל-ALB מול EKS?" },
      a: {
        en: "With ip, the ALB sends traffic straight to pod IPs (possible because VPC CNI pods have real VPC IPs). That removes the NodePort hop and kube-proxy's extra load balancing (which can cross AZs and adds SNAT, hiding the client IP), makes ALB health checks reflect the actual pod, and lets you use pod readiness gates for safe rollouts. Instance mode registers every node on a NodePort; a node with no matching pod still forwards, and externalTrafficPolicy semantics get involved. The cost of ip mode: target registration churn on large rollouts and the need for readiness gates and a sensible deregistration delay with preStop sleep so in-flight requests drain.",
        he: "עם ip, ה-ALB שולח תעבורה ישירות ל-IPs של ה-Pods (זה אפשרי כי ל-Pods ב-VPC CNI יש IPs אמיתיים מה-VPC). זה מוריד את ה-hop של NodePort ואת ה-load balancing הנוסף של kube-proxy (שיכול לחצות AZs ומוסיף SNAT שמסתיר את ה-IP של הלקוח), גורם ל-health checks של ה-ALB לשקף את ה-Pod האמיתי, ומאפשר pod readiness gates בשביל rollouts בטוחים. במצב instance כל node נרשם על NodePort; node בלי Pod מתאים עדיין מעביר הלאה, וההתנהגות של externalTrafficPolicy נכנסת לתמונה. המחיר של מצב ip: churn של רישום targets ב-rollouts גדולים, והצורך ב-readiness gates וב-deregistration delay הגיוני יחד עם preStop sleep, כדי שבקשות באמצע יסתיימו."
      }
    }
  ],
  quiz: [
    {
      q: { en: "You switch a cluster's authenticationMode from API_AND_CONFIG_MAP to API. What happens to the aws-auth ConfigMap?", he: "אתה מעביר את ה-authenticationMode של cluster מ-API_AND_CONFIG_MAP ל-API. מה קורה ל-ConfigMap בשם aws-auth?" },
      options: [
        { en: "It is still read, but access entries take priority", he: "הוא עדיין נקרא, אבל ה-access entries גוברים" },
        { en: "It is ignored; only access entries grant access, and you can't switch back", he: "מתעלמים ממנו; רק access entries נותנים גישה, ואי אפשר לחזור אחורה" },
        { en: "EKS converts it into access entries automatically", he: "EKS ממיר אותו ל-access entries אוטומטית" },
        { en: "The change is rejected while the ConfigMap exists", he: "השינוי נדחה כל עוד ה-ConfigMap קיים" }
      ],
      answer: 1,
      explain: { en: "In API mode EKS only uses access entries. Create entries for every principal in aws-auth first (node roles get entries automatically for managed node groups). The mode change is one-way.", he: "במצב API, ה-EKS משתמש רק ב-access entries. קודם תיצור entries לכל principal שמופיע ב-aws-auth (ל-roles של managed node groups נוצרים entries אוטומטית). שינוי המצב הוא חד-כיווני." }
    },
    {
      q: { en: "What does HttpPutResponseHopLimit=1 on EKS nodes achieve?", he: "מה משיג HttpPutResponseHopLimit=1 על nodes של EKS?" },
      options: [
        { en: "It disables IMDS for the node itself", he: "הוא מכבה את IMDS ל-node עצמו" },
        { en: "Pods in their own network namespace can't get an IMDSv2 token, so they can't use the node's IAM role", he: "Pods ב-network namespace משלהם לא מקבלים token של IMDSv2, ולכן לא יכולים להשתמש ב-IAM role של ה-node" },
        { en: "It limits the node to one network interface", he: "הוא מגביל את ה-node לממשק רשת אחד" },
        { en: "It forces IMDSv1", he: "הוא מכריח IMDSv1" }
      ],
      answer: 1,
      explain: { en: "The PUT token response has IP TTL equal to the hop limit. Going from the host into a pod's network namespace adds a hop, so with 1 the response is dropped. hostNetwork pods (like the CNI) still reach IMDS.", he: "לתשובת ה-PUT עם ה-token יש IP TTL ששווה ל-hop limit. המעבר מה-host לתוך ה-network namespace של Pod מוסיף hop, ולכן עם 1 התשובה נזרקת. Pods עם hostNetwork (כמו ה-CNI) עדיין מגיעים ל-IMDS." }
    },
    {
      q: { en: "Your Terraform owns an ALB that Global Accelerator points at. Which Load Balancer Controller feature attaches your pods to it?", he: "ה-Terraform שלך מחזיק ALB ש-Global Accelerator מצביע עליו. איזו יכולת של ה-Load Balancer Controller מחברת אליו את ה-Pods שלך?" },
      options: [
        { en: "An Ingress with alb.ingress.kubernetes.io/group.name", he: "Ingress עם alb.ingress.kubernetes.io/group.name" },
        { en: "A Service with type NodePort", he: "Service מסוג NodePort" },
        { en: "A TargetGroupBinding pointing at the existing target group ARN", he: "TargetGroupBinding שמצביע על ה-ARN של ה-target group הקיים" },
        { en: "An ExternalName Service", he: "Service מסוג ExternalName" }
      ],
      answer: 2,
      explain: { en: "TargetGroupBinding registers a Service's endpoints into a target group created outside Kubernetes, so the load balancer's lifecycle (and its DNS/IPs) is independent of the cluster.", he: "TargetGroupBinding רושם את ה-endpoints של Service לתוך target group שנוצר מחוץ ל-Kubernetes, כך שמחזור החיים של ה-load balancer (וה-DNS וה-IPs שלו) לא תלוי ב-cluster." }
    },
    {
      q: { en: "Pods are Pending and Karpenter launches nothing. Logs say the NodePool's limits are reached. Which field?", he: "Pods ב-Pending ו-Karpenter לא מרים כלום. בלוגים כתוב שהגעת ל-limits של ה-NodePool. איזה שדה?" },
      options: [
        { en: "spec.limits (e.g. cpu: 2000) on the NodePool", he: "ה-spec.limits (למשל cpu: 2000) על ה-NodePool" },
        { en: "spec.disruption.budgets", he: "ה-spec.disruption.budgets" },
        { en: "resources.limits on the pods", he: "ה-resources.limits על ה-Pods" },
        { en: "The EC2NodeClass metadataOptions", he: "ה-metadataOptions ב-EC2NodeClass" }
      ],
      answer: 0,
      explain: { en: "NodePool limits cap the total resources Karpenter may provision for that pool, a cost safety net. Raise them deliberately, or add a second pool; also check EC2 vCPU service quotas.", he: "ה-limits של NodePool מגבילים את סך המשאבים ש-Karpenter רשאי להרים ל-pool הזה, רשת ביטחון של עלות. מעלים אותם בכוונה או מוסיפים pool שני; וכדאי לבדוק גם את ה-quota של vCPU ב-EC2." }
    }
  ],
  related: ["cloud-managed-k8s-compare", "k8s-networking-cni", "k8s-node-autoprovisioning", "k8s-day2-upgrades", "k8s-ingress-certs-dns", "k8s-cost", "aws-for-azure-engineers", "aws-networking-edge"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "aws-networking-edge",
  track: "networking",
  order: 60,
  icon: "🌐",
  level: 3,
  minutes: 22,
  title: { en: "AWS Networking at Scale: Transit Gateway, PrivateLink, Route 53 and the Edge", he: "רשת ב-AWS ב-scale: Transit Gateway, PrivateLink, Route 53 וה-edge" },
  tldr: {
    en: "At scale, AWS networking is an IP plan (IPAM, non-overlapping CIDRs), a hub (Transit Gateway route tables for segmentation, peered across regions, or Cloud WAN), private service access (gateway endpoints, PrivateLink), deliberate egress (centralized NAT, firewall), and a global front: Route 53 policies with health checks for DNS steering, CloudFront for HTTP caching and edge logic, Global Accelerator for anycast static IPs and fast failover.",
    he: "ב-scale, רשת ב-AWS היא תוכנית IP (IPAM, CIDRs בלי חפיפות), hub (route tables של Transit Gateway בשביל הפרדה, עם peering בין regions, או Cloud WAN), גישה פרטית לשירותים (gateway endpoints, PrivateLink), יציאה מתוכננת (NAT ו-firewall מרוכזים), וחזית גלובלית: policies של Route 53 עם health checks לניתוב ב-DNS, CloudFront ל-caching של HTTP ולוגיקה ב-edge, ו-Global Accelerator בשביל IPs סטטיים של anycast ו-failover מהיר."
  },
  analogy: {
    en: "Think of a country's transport system. IPAM is the address registry that guarantees no two streets share a name. Transit Gateway is the central train station with separate platforms (route tables) so freight never mixes with passengers. PrivateLink is a private tunnel straight into one specific building. Route 53 is the signposting that sends drivers to the nearest open city. CloudFront is a chain of local warehouses stocking popular goods, and Global Accelerator is the toll highway: you enter at the nearest on-ramp and ride the private road all the way.",
    he: "תחשוב על מערכת התחבורה של מדינה. IPAM הוא רשם הכתובות שמבטיח שאין שני רחובות עם אותו שם. Transit Gateway הוא תחנת הרכבת המרכזית עם רציפים נפרדים (route tables), כך שמשא לא מתערבב עם נוסעים. PrivateLink הוא מנהרה פרטית ישר לבניין מסוים אחד. Route 53 הוא השילוט ששולח נהגים לעיר הפתוחה הקרובה. CloudFront הוא רשת מחסנים מקומיים שמחזיקים את המוצרים הפופולריים, ו-Global Accelerator הוא כביש האגרה: נכנסים במחלף הקרוב ונוסעים על הכביש הפרטי עד הסוף."
  },
  sections: [
    {
      h: { en: "The IP plan: IPAM and multi-account, multi-region VPCs", he: "תוכנית ה-IP: IPAM ו-VPCs על פני accounts ו-regions" },
      body: {
        en: `<p>Everything later (TGW routing, hybrid DNS, VPN to on-prem, EKS pod IPs) assumes <strong>no overlapping CIDRs</strong>. Fixing overlap afterwards means re-IPing live VPCs. Plan a hierarchy in <strong>VPC IPAM</strong> (delegated to the network account, shared via RAM):</p>
<pre>10.0.0.0/8            top-level pool (org)
├── 10.16.0.0/12      eu-west-1
│   ├── 10.16.0.0/14  prod      (allocation rule: netmask /20, tag env=prod)
│   └── 10.20.0.0/14  non-prod
├── 10.32.0.0/12      eu-central-1
└── 10.48.0.0/12      us-east-1
100.64.0.0/10         reused per VPC as a secondary CIDR for EKS pods (never routed via TGW)

aws ec2 create-vpc --ipv4-ipam-pool-id ipam-pool-0prod-euw1 --ipv4-netmask-length 20 \\
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=payments-prod-euw1}]'</pre>
<p>Sizing an EKS VPC: VPC CNI gives every pod a VPC IP. A /20 (4,091 usable) sounds big until 3 AZs × node subnets + warm IP pools eat it. Typical pattern: a routable /20 for nodes, load balancers and endpoints, plus a non-routable <code>100.64.0.0/16</code> secondary CIDR for pods (custom networking) or IPv6 for pods. AWS allows up to 5 IPv4 CIDRs per VPC by default (adjustable).</p>
<blockquote>💡 Real world: IPAM also audits. Its compliance view flags VPCs created outside pools and overlapping CIDRs across accounts, which is how you find the shadow VPC someone created by hand in 2023.</blockquote>`,
        he: `<p>כל מה שבא אחר כך (routing ב-TGW, DNS היברידי, VPN ל-on-prem, IPs של Pods ב-EKS) מניח שאין <strong>CIDRs חופפים</strong>. לתקן חפיפה בדיעבד זה להחליף כתובות ל-VPCs חיים. תתכנן היררכיה ב-<strong>VPC IPAM</strong> (מואצל ל-account של הרשת, משותף דרך RAM):</p>
<pre>10.0.0.0/8            top-level pool (org)
├── 10.16.0.0/12      eu-west-1
│   ├── 10.16.0.0/14  prod      (allocation rule: netmask /20, tag env=prod)
│   └── 10.20.0.0/14  non-prod
├── 10.32.0.0/12      eu-central-1
└── 10.48.0.0/12      us-east-1
100.64.0.0/10         reused per VPC as a secondary CIDR for EKS pods (never routed via TGW)

aws ec2 create-vpc --ipv4-ipam-pool-id ipam-pool-0prod-euw1 --ipv4-netmask-length 20 \\
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=payments-prod-euw1}]'</pre>
<p>תכנון גודל ל-VPC של EKS: ה-VPC CNI נותן לכל Pod כתובת IP מה-VPC. /20 (4,091 כתובות שמישות) נשמע גדול, עד ששלושה AZs כפול subnets של nodes ועוד warm pools של IPs אוכלים אותו. הדפוס הנפוץ: /20 שניתן לניתוב בשביל nodes, load balancers ו-endpoints, ועוד CIDR משני שלא מנותב, <code>100.64.0.0/16</code>, בשביל Pods (custom networking) או IPv6 ל-Pods. AWS מתירים עד 5 CIDRs של IPv4 לכל VPC כברירת מחדל (ניתן להגדלה).</p>
<blockquote>💡 Real world: IPAM גם עושה ביקורת. תצוגת ה-compliance שלו מסמנת VPCs שנוצרו מחוץ ל-pools ו-CIDRs חופפים בין accounts. ככה מוצאים את ה-VPC הצללי שמישהו יצר ידנית לפני שלוש שנים.</blockquote>`
      }
    },
    {
      h: { en: "Transit Gateway, segmentation and Cloud WAN", he: "Transit Gateway, הפרדה ו-Cloud WAN" },
      body: {
        en: `<p>VPC peering is 1:1 and non-transitive, so it stops scaling past a handful of VPCs. A <strong>Transit Gateway</strong> is a regional router: VPCs, VPNs and Direct Connect gateways attach to it, and <strong>TGW route tables</strong> decide who can reach whom.</p>
<pre>TGW route tables (segmentation)
  rt-prod      associated: prod VPCs        propagated from: prod VPCs, shared-services, egress
  rt-nonprod   associated: non-prod VPCs    propagated from: non-prod VPCs, shared-services, egress
  rt-shared    associated: shared-services  propagated from: everything
  rt-egress    associated: egress/inspection VPC  routes back to all
  => prod and non-prod can't reach each other; both reach shared services and the internet via egress

aws ec2 search-transit-gateway-routes --transit-gateway-route-table-id tgw-rtb-0prod \\
  --filters Name=type,Values=propagated,static --query 'Routes[].[DestinationCidrBlock,State,Type]'</pre>
<ul>
<li><strong>Association</strong> = which route table an attachment's <em>outgoing</em> traffic is looked up in. <strong>Propagation</strong> = which route tables learn the attachment's CIDRs.</li>
<li><strong>Inter-region</strong>: TGW peering attachments between regions run over the AWS backbone, encrypted, but support <strong>static routes only</strong> (no dynamic propagation across the peering). With many regions that becomes a mesh of static routes to maintain.</li>
<li><strong>Cost</strong> (us-east-1, check current pricing): about $0.05/hour per attachment plus $0.02/GB processed. Every hop through an inspection VPC is processed again.</li>
<li><strong>Cloud WAN</strong> is the managed global layer: you write one core network policy (JSON) with <em>segments</em> (prod, non-prod, shared) and regions; AWS builds the core network edges, routes dynamically between regions and enforces segment isolation. Pick it when you have many regions or want policy-driven segmentation; TGW + peering is still common and cheaper to reason about for 2-3 regions.</li>
</ul>
<p><strong>Centralized egress</strong>: spoke VPCs have no NAT; their default route points to TGW, which sends it to an egress VPC with NAT Gateways (and optionally AWS Network Firewall). One set of NAT GWs and one place to inspect, but you pay TGW processing on top of NAT processing, and that egress VPC becomes a shared dependency. Pair it with VPC endpoints in each spoke for heavy AWS traffic (S3, ECR, CloudWatch) so it never touches NAT.</p>`,
        he: `<p>VPC peering הוא אחד לאחד ולא טרנזיטיבי, ולכן הוא מפסיק להתרחב אחרי כמה VPCs. <strong>Transit Gateway</strong> הוא router אזורי: VPCs, חיבורי VPN ו-Direct Connect gateways מתחברים אליו, ו-<strong>route tables של TGW</strong> קובעים מי מגיע למי.</p>
<pre>TGW route tables (segmentation)
  rt-prod      associated: prod VPCs        propagated from: prod VPCs, shared-services, egress
  rt-nonprod   associated: non-prod VPCs    propagated from: non-prod VPCs, shared-services, egress
  rt-shared    associated: shared-services  propagated from: everything
  rt-egress    associated: egress/inspection VPC  routes back to all
  => prod and non-prod can't reach each other; both reach shared services and the internet via egress

aws ec2 search-transit-gateway-routes --transit-gateway-route-table-id tgw-rtb-0prod \\
  --filters Name=type,Values=propagated,static --query 'Routes[].[DestinationCidrBlock,State,Type]'</pre>
<ul>
<li><strong>Association</strong> קובע באיזה route table מחפשים את התעבורה <em>היוצאת</em> של attachment. <strong>Propagation</strong> קובע אילו route tables לומדים את ה-CIDRs של ה-attachment.</li>
<li><strong>בין regions</strong>: peering attachments של TGW בין regions רצים על ה-backbone של AWS, מוצפנים, אבל תומכים <strong>רק ב-static routes</strong> (אין propagation דינמי דרך ה-peering). עם הרבה regions זה הופך ל-mesh של static routes שצריך לתחזק.</li>
<li><strong>עלות</strong> (ב-us-east-1, תבדוק תמחור עדכני): בערך $0.05 לשעה לכל attachment ועוד $0.02 לכל GB שעובר. כל מעבר דרך VPC של inspection מחויב שוב.</li>
<li><strong>Cloud WAN</strong> היא השכבה הגלובלית המנוהלת: כותבים core network policy אחת (JSON) עם <em>segments</em> (prod, non-prod, shared) ו-regions, ו-AWS בונים את ה-core network edges, מנתבים דינמית בין regions ואוכפים הפרדה בין segments. תבחר בזה כשיש הרבה regions או כשאתה רוצה הפרדה מונחית policy. עבור שניים או שלושה regions, TGW עם peering עדיין נפוץ, ויותר פשוט להבין אותו.</li>
</ul>
<p><strong>Egress מרוכז</strong>: ל-VPCs ה-spoke אין NAT. ה-default route שלהם מצביע ל-TGW, שמעביר ל-VPC של egress עם NAT Gateways (ואופציונלית AWS Network Firewall). סט אחד של NAT GWs ומקום אחד לבדוק תעבורה, אבל משלמים על העיבוד ב-TGW מעל העיבוד ב-NAT, וה-VPC של ה-egress הופך לתלות משותפת. תשלב את זה עם VPC endpoints בכל spoke בשביל תעבורה כבדה ל-AWS (S3, ECR, CloudWatch), כדי שהיא לא תעבור ב-NAT בכלל.</p>`
      }
    },
    {
      h: { en: "VPC endpoints and PrivateLink", he: "VPC endpoints ו-PrivateLink" },
      body: {
        en: `<table>
<tr><th></th><th>Gateway endpoint</th><th>Interface endpoint (PrivateLink)</th></tr>
<tr><td>Services</td><td>S3 and DynamoDB only</td><td>Most AWS APIs (ECR, STS, KMS, SQS, Secrets Manager, CloudWatch...) and your own or partner services</td></tr>
<tr><td>How</td><td>A route-table entry to a prefix list</td><td>An ENI with a private IP in each chosen subnet/AZ; private DNS overrides the public name</td></tr>
<tr><td>Cost</td><td>Free</td><td>About $0.01/hour per AZ + $0.01/GB (check current pricing)</td></tr>
<tr><td>Reach from on-prem / other VPCs</td><td>No (route-table based, local VPC only)</td><td>Yes, via TGW/DX, with DNS forwarding to the endpoint</td></tr>
</table>
<p>An EKS cluster in private subnets with no NAT needs at least: <code>ecr.api</code>, <code>ecr.dkr</code>, S3 gateway (image layers), <code>sts</code> (Pod Identity/IRSA), <code>ec2</code> (VPC CNI/Karpenter), <code>logs</code>, <code>elasticloadbalancing</code>, and <code>eks-auth</code> for Pod Identity. Use endpoint policies to restrict which buckets/accounts are reachable (data-exfiltration control).</p>
<p><strong>PrivateLink for your own services</strong>: a provider puts an NLB in front of a service and creates an <em>endpoint service</em>; consumers in other accounts create interface endpoints to it. Traffic is one-way (consumer → provider), CIDRs may overlap, and there's no routing between the VPCs at all. It's the cleanest way to expose a platform API to hundreds of tenant VPCs.</p>
<pre>aws ec2 create-vpc-endpoint-service-configuration --network-load-balancer-arns arn:aws:elasticloadbalancing:...:loadbalancer/net/platform-api/abc \\
  --acceptance-required
aws ec2 create-vpc-endpoint --vpc-id vpc-0consumer --vpc-endpoint-type Interface \\
  --service-name com.amazonaws.vpce.eu-west-1.vpce-svc-0123456789abcdef0 --subnet-ids subnet-a subnet-b subnet-c</pre>`,
        he: `<table>
<tr><th></th><th>Gateway endpoint</th><th>Interface endpoint (PrivateLink)</th></tr>
<tr><td>שירותים</td><td>רק S3 ו-DynamoDB</td><td>רוב ה-APIs של AWS (ECR, STS, KMS, SQS, Secrets Manager, CloudWatch...) ושירותים שלך או של שותפים</td></tr>
<tr><td>איך</td><td>רשומה ב-route table שמצביעה ל-prefix list</td><td>ENI עם IP פרטי בכל subnet או AZ שבחרת; ה-private DNS דורס את השם הציבורי</td></tr>
<tr><td>עלות</td><td>חינם</td><td>בערך $0.01 לשעה לכל AZ ועוד $0.01 ל-GB (תבדוק תמחור עדכני)</td></tr>
<tr><td>גישה מ-on-prem או מ-VPCs אחרים</td><td>לא (מבוסס route table, רק ה-VPC המקומי)</td><td>כן, דרך TGW או DX, עם הפניית DNS ל-endpoint</td></tr>
</table>
<p>Cluster של EKS ב-subnets פרטיים בלי NAT צריך לפחות: <code>ecr.api</code>, <code>ecr.dkr</code>, gateway ל-S3 (שכבות ה-images), <code>sts</code> (בשביל Pod Identity או IRSA), <code>ec2</code> (בשביל VPC CNI ו-Karpenter), <code>logs</code>, <code>elasticloadbalancing</code>, ו-<code>eks-auth</code> בשביל Pod Identity. תשתמש ב-endpoint policies כדי להגביל לאילו buckets ו-accounts אפשר להגיע (שליטה על הוצאת מידע).</p>
<p><strong>PrivateLink לשירותים שלך</strong>: הספק שם NLB מול השירות ויוצר <em>endpoint service</em>; הצרכנים ב-accounts אחרים יוצרים אליו interface endpoints. התעבורה חד-כיוונית (מהצרכן לספק), ה-CIDRs יכולים לחפוף, ואין בכלל routing בין ה-VPCs. זו הדרך הנקייה ביותר לחשוף API של פלטפורמה למאות VPCs של tenants.</p>
<pre>aws ec2 create-vpc-endpoint-service-configuration --network-load-balancer-arns arn:aws:elasticloadbalancing:...:loadbalancer/net/platform-api/abc \\
  --acceptance-required
aws ec2 create-vpc-endpoint --vpc-id vpc-0consumer --vpc-endpoint-type Interface \\
  --service-name com.amazonaws.vpce.eu-west-1.vpce-svc-0123456789abcdef0 --subnet-ids subnet-a subnet-b subnet-c</pre>`
      }
    },
    {
      h: { en: "Route 53: zones, routing policies, health checks, hybrid DNS", he: "Route 53: zones, routing policies, health checks ו-DNS היברידי" },
      body: {
        en: `<ul>
<li><strong>Hosted zones</strong>: public (internet) and private (associated with VPCs, can be shared across accounts by association). Same name in both = split-horizon.</li>
<li><strong>Alias records</strong>: Route 53-specific, point at AWS resources (ALB, CloudFront, S3 website, another record), work at the zone apex, follow IP changes, and queries to alias targets are free.</li>
<li><strong>Routing policies</strong>: simple, <strong>weighted</strong> (canary, blue/green cluster migration), <strong>latency</strong> (lowest measured latency region), <strong>failover</strong> (primary/secondary with health check), <strong>geolocation</strong> (by country/continent: compliance, localized content), <strong>geoproximity</strong> (by distance with a bias to shift load), multivalue answer, and IP-based (by client CIDR).</li>
<li><strong>Health checks</strong>: checkers in multiple regions probe your endpoint every 30 s (or 10 s fast), failing after 3 consecutive failures by default. Health checkers can't reach private IPs: for private endpoints use a CloudWatch-alarm-based health check. <em>Calculated</em> health checks combine children ("healthy if 2 of 3 are healthy").</li>
</ul>
<pre>api.example.com  A  ALIAS  latency  region=eu-west-1     -> alb-euw1   health-check=hc-euw1  (evaluate target health: yes)
api.example.com  A  ALIAS  latency  region=eu-central-1  -> alb-euc1   health-check=hc-euc1
# a region whose health check fails drops out of latency answers; clients move within TTL (use 60 s)</pre>
<p><strong>Hybrid DNS with Resolver endpoints</strong>: the VPC resolver (at VPC base + 2) answers inside AWS. An <strong>inbound endpoint</strong> (ENIs in your VPC) lets on-prem DNS servers forward <code>aws.corp.example</code> queries to Route 53 private zones. An <strong>outbound endpoint</strong> + <strong>forwarding rules</strong> sends <code>corp.example</code> queries from VPCs to on-prem DNS. Put both in the network account and share the rules with RAM to every VPC.</p>
<blockquote>⚠️ Production tip: the Route 53 <em>control plane</em> (changing records) lives in <code>us-east-1</code>; the <em>data plane</em> (answering queries, health checks) is global and far more available. Design failover so it needs only the data plane: pre-built failover records driven by health checks or Route 53 ARC routing controls, not "we'll update the record during the outage".</blockquote>`,
        he: `<ul>
<li><strong>Hosted zones</strong>: ציבוריים (אינטרנט) ופרטיים (מקושרים ל-VPCs, ואפשר לשתף אותם בין accounts דרך association). אותו שם בשניהם יוצר split-horizon.</li>
<li><strong>Alias records</strong>: ייחודיים ל-Route 53. הם מצביעים על משאבי AWS (ALB, CloudFront, אתר ב-S3, רשומה אחרת), עובדים ב-apex של ה-zone, עוקבים אחרי שינויי IP, ושאילתות ל-alias targets הן בחינם.</li>
<li><strong>Routing policies</strong>: simple, <strong>weighted</strong> (canary, מיגרציית blue/green בין clusters), <strong>latency</strong> (ה-region עם ה-latency הנמוך שנמדד), <strong>failover</strong> (ראשי ומשני עם health check), <strong>geolocation</strong> (לפי מדינה או יבשת: רגולציה, תוכן מקומי), <strong>geoproximity</strong> (לפי מרחק, עם bias להזזת עומס), multivalue answer, ו-IP-based (לפי ה-CIDR של הלקוח).</li>
<li><strong>Health checks</strong>: בודקים מכמה regions פונים ל-endpoint שלך כל 30 שניות (או 10 במצב מהיר), ומסמנים כשל אחרי 3 כישלונות רצופים כברירת מחדל. הם לא מגיעים ל-IPs פרטיים: ל-endpoints פרטיים תשתמש ב-health check שמבוסס על CloudWatch alarm. <em>Calculated</em> health checks משלבים כמה בדיקות ("בריא אם 2 מתוך 3 בריאים").</li>
</ul>
<pre>api.example.com  A  ALIAS  latency  region=eu-west-1     -> alb-euw1   health-check=hc-euw1  (evaluate target health: yes)
api.example.com  A  ALIAS  latency  region=eu-central-1  -> alb-euc1   health-check=hc-euc1
# a region whose health check fails drops out of latency answers; clients move within TTL (use 60 s)</pre>
<p><strong>DNS היברידי עם Resolver endpoints</strong>: ה-resolver של ה-VPC (בכתובת הבסיס של ה-VPC ועוד 2) עונה בתוך AWS. <strong>Inbound endpoint</strong> (ENIs ב-VPC שלך) מאפשר לשרתי DNS ב-on-prem להעביר שאילתות על <code>aws.corp.example</code> ל-private zones של Route 53. <strong>Outbound endpoint</strong> יחד עם <strong>forwarding rules</strong> שולח שאילתות על <code>corp.example</code> מה-VPCs ל-DNS של ה-on-prem. תשים את שניהם ב-account של הרשת, ותשתף את החוקים לכל VPC דרך RAM.</p>
<blockquote>⚠️ Production tip: ה-<em>control plane</em> של Route 53 (שינוי רשומות) יושב ב-<code>us-east-1</code>; ה-<em>data plane</em> (מענה לשאילתות, health checks) גלובלי וזמין הרבה יותר. תתכנן failover שתלוי רק ב-data plane: רשומות failover מוכנות מראש שמונעות על ידי health checks או routing controls של Route 53 ARC, ולא "נעדכן את הרשומה בזמן התקלה".</blockquote>`
      }
    },
    {
      h: { en: "The edge: CloudFront, Global Accelerator, and active-active traffic", he: "ה-edge: CloudFront, Global Accelerator ותעבורת active-active" },
      body: {
        en: `<p><strong>CloudFront</strong>: a CDN and L7 reverse proxy at hundreds of edge locations, backed by regional edge caches.</p>
<ul>
<li><strong>Origins</strong>: S3, ALB/NLB, any HTTP server, or a <em>VPC origin</em> (private ALB/EC2 with no public exposure). Origin groups give origin failover for GET/HEAD.</li>
<li><strong>Cache policy</strong> (what goes in the cache key: headers, cookies, query strings) vs <strong>origin request policy</strong> (what is forwarded to the origin but not part of the key). Putting <code>Authorization</code> or all cookies in the key destroys the hit ratio.</li>
<li><strong>Origin Shield</strong>: an extra caching layer in one region close to your origin, collapsing requests from all edges. Good for expensive origins or live video; costs per request.</li>
<li><strong>OAC (Origin Access Control)</strong>: CloudFront signs requests to S3 with SigV4; the bucket stays private and its policy allows only <code>cloudfront.amazonaws.com</code> with <code>AWS:SourceArn</code> = your distribution. It replaces the legacy OAI and supports SSE-KMS.</li>
<li><strong>CloudFront Functions</strong> (lightweight JavaScript, viewer request/response only, sub-millisecond, no network calls; header rewrites, redirects, simple auth tokens) vs <strong>Lambda@Edge</strong> (Node.js/Python, viewer and origin events, seconds of runtime, network access, deployed from <code>us-east-1</code>; costlier and slower to deploy).</li>
</ul>
<p><strong>Global Accelerator</strong>: two static anycast IPv4 addresses announced from AWS edge locations. Clients enter the AWS backbone at the nearest edge; GA forwards TCP/UDP to endpoint groups (ALB, NLB, EC2, EIP) in each region, with <em>traffic dials</em> per region and endpoint weights. No caching, no HTTP features. Failover is driven by GA's own health checks and doesn't wait for DNS TTLs or client caches.</p>
<table>
<tr><th>Need</th><th>Pick</th></tr>
<tr><td>Cache static/dynamic HTTP, WAF, edge logic</td><td>CloudFront (+ WAF)</td></tr>
<tr><td>Non-HTTP (gRPC over raw TCP, UDP, MQTT, gaming), static IPs for allow-lists, fastest regional failover</td><td>Global Accelerator</td></tr>
<tr><td>Cheapest, simplest regional steering</td><td>Route 53 latency/failover records</td></tr>
</table>
<p><strong>Multi-region active-active pattern</strong>: Route 53 latency records (or GA endpoint groups) over per-region ALBs → EKS clusters in each region; CloudFront in front for cacheable traffic and WAF. The hard part is data, not traffic: decide per dataset between a single writer region with failover, partitioned ownership (users homed to a region), or multi-writer (DynamoDB global tables, Aurora Global Database for fast cross-region reads with one writer). Test it: shift traffic dials to 0% for a region monthly. See <code>staff-multi-region-data</code>.</p>`,
        he: `<p><strong>CloudFront</strong>: CDN ו-reverse proxy של L7 במאות מיקומי edge, עם regional edge caches מאחוריהם.</p>
<ul>
<li><strong>Origins</strong>: S3, ALB או NLB, כל שרת HTTP, או <em>VPC origin</em> (ALB או EC2 פרטיים, בלי חשיפה ציבורית). Origin groups נותנים failover בין origins לבקשות GET ו-HEAD.</li>
<li><strong>Cache policy</strong> (מה נכנס ל-cache key: headers, cookies, query strings) מול <strong>origin request policy</strong> (מה מועבר ל-origin בלי להיות חלק מה-key). הכנסה של <code>Authorization</code> או של כל ה-cookies ל-key הורסת את ה-hit ratio.</li>
<li><strong>Origin Shield</strong>: שכבת cache נוספת ב-region אחד קרוב ל-origin שלך, שמאחדת בקשות מכל ה-edges. טוב ל-origins יקרים או לווידאו חי; מחויב לפי בקשה.</li>
<li><strong>OAC (Origin Access Control)</strong>: ה-CloudFront חותם על הבקשות ל-S3 עם SigV4; ה-bucket נשאר פרטי, וה-policy שלו מתירה רק את <code>cloudfront.amazonaws.com</code> עם <code>AWS:SourceArn</code> ששווה ל-distribution שלך. הוא מחליף את ה-OAI הישן ותומך ב-SSE-KMS.</li>
<li><strong>CloudFront Functions</strong> (JavaScript קליל, רק viewer request ו-response, פחות ממילישנייה, בלי קריאות רשת; שכתוב headers, redirects, tokens פשוטים) מול <strong>Lambda@Edge</strong> (Node.js או Python, אירועי viewer ו-origin, שניות של ריצה, גישה לרשת, נפרס מ-<code>us-east-1</code>; יקר יותר ואיטי יותר לפריסה).</li>
</ul>
<p><strong>Global Accelerator</strong>: שתי כתובות IPv4 סטטיות של anycast שמוכרזות ממיקומי ה-edge של AWS. הלקוחות נכנסים ל-backbone של AWS ב-edge הקרוב, וה-GA מעביר TCP או UDP ל-endpoint groups (ALB, NLB, EC2, EIP) בכל region, עם <em>traffic dials</em> לכל region ומשקלים לכל endpoint. אין caching ואין יכולות HTTP. ה-failover מונע על ידי ה-health checks של GA עצמו, ולא מחכה ל-TTL של DNS או ל-cache של הלקוח.</p>
<table>
<tr><th>צורך</th><th>בחירה</th></tr>
<tr><td>Caching של HTTP סטטי ודינמי, WAF, לוגיקה ב-edge</td><td>CloudFront (ועוד WAF)</td></tr>
<tr><td>תעבורה שאינה HTTP (gRPC על TCP גולמי, UDP, MQTT, gaming), IPs סטטיים ל-allow-lists, ה-failover האזורי המהיר ביותר</td><td>Global Accelerator</td></tr>
<tr><td>ניתוב אזורי הכי זול ופשוט</td><td>רשומות latency או failover ב-Route 53</td></tr>
</table>
<p><strong>דפוס active-active רב-אזורי</strong>: רשומות latency ב-Route 53 (או endpoint groups ב-GA) מעל ALB בכל region, שמובילים ל-clusters של EKS בכל region; ו-CloudFront מקדימה בשביל תעבורה שאפשר לשמור ב-cache וה-WAF. החלק הקשה הוא הדאטה, לא התעבורה: לכל dataset מחליטים בין region כותב יחיד עם failover, בעלות מחולקת (משתמשים משויכים ל-region), או כתיבה מרובה (DynamoDB global tables, או Aurora Global Database לקריאות מהירות בין regions עם כותב יחיד). ובודקים את זה: פעם בחודש מורידים את ה-traffic dial של region ל-0%. ראה <code>staff-multi-region-data</code>.</p>`
      }
    }
  ],
  diagram: `                 users
                   |
     CloudFront (+WAF)  ...or...  Global Accelerator (2 anycast IPs)
                   |                         |
        Route 53 latency/failover  ----------+
           |                     |
   eu-west-1                  eu-central-1
   ALB -> EKS                 ALB -> EKS
     |                          |
   spoke VPC (IPAM /20)       spoke VPC (IPAM /20)
     |  TGW attach              |  TGW attach
   [TGW euw1] ==== peering (static routes) ==== [TGW euc1]
     |  rt-prod / rt-nonprod / rt-shared         |
   egress VPC (NAT GW per AZ, Network Firewall)  egress VPC
     |
   DX / VPN -> on-prem   <- Route 53 Resolver inbound/outbound endpoints`,
  handsOn: [
    { cmd: "aws ec2 get-ipam-pool-allocations --ipam-pool-id ipam-pool-0prod-euw1 --query 'IpamPoolAllocations[].[Cidr,ResourceId,ResourceOwner]' --output table", what: { en: "See which CIDRs are allocated from a pool and to which account/VPC.", he: "תראה אילו CIDRs הוקצו מ-pool, ולאיזה account ו-VPC." } },
    { cmd: "aws ec2 describe-transit-gateway-attachments --query 'TransitGatewayAttachments[].[TransitGatewayAttachmentId,ResourceType,ResourceOwnerId,Association.TransitGatewayRouteTableId]' --output table", what: { en: "Audit which attachment is associated with which TGW route table (that's your segmentation).", he: "ביקורת: איזה attachment משויך לאיזה route table ב-TGW (זו ההפרדה שלך)." } },
    { cmd: "aws ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=vpc-0abc --query 'VpcEndpoints[].[ServiceName,VpcEndpointType,State]' --output table", what: { en: "Check which AWS services this VPC reaches privately; anything missing goes through NAT and costs per GB.", he: "תבדוק לאילו שירותי AWS ה-VPC הזה מגיע באופן פרטי; כל מה שחסר עובר דרך NAT ועולה לפי GB." } },
    { cmd: "aws route53 test-dns-answer --hosted-zone-id Z0123456789ABC --record-name api.example.com --record-type A --resolver-ip 198.51.100.10", what: { en: "Ask Route 53 what it would answer for a given resolver location, to verify latency/geolocation routing without travelling.", he: "תשאל את Route 53 מה הוא יענה למיקום resolver מסוים, כדי לאמת ניתוב latency או geolocation בלי לנסוע." } },
    { cmd: "dig +short api.example.com && curl -s -o /dev/null -w '%{http_code} %{remote_ip} %{time_total}\\n' https://api.example.com/healthz", what: { en: "From a client: which region/IP you got and how fast. Run from two continents to see latency routing work.", he: "מצד הלקוח: איזה region ו-IP קיבלת ובכמה זמן. תריץ משתי יבשות כדי לראות את ניתוב ה-latency עובד." } }
  ],
  mnemonic: {
    en: "PHEDE: Plan IPs, Hub with route tables, Endpoints before NAT, DNS with health checks, Edge last (CloudFront caches, GA steers).",
    he: "PHEDE: לתכנן IPs, Hub עם route tables, Endpoints לפני NAT, DNS עם health checks, ו-Edge בסוף (CloudFront שומר ב-cache, ו-GA מנתב)."
  },
  pitfalls: [
    { en: "Overlapping CIDRs between accounts or with on-prem ('everyone got 10.0.0.0/16 from the wizard'). You can't attach them meaningfully to TGW or route them over DX; the fix is NAT hacks or re-IPing. Allocate every VPC from IPAM from day one.", he: "CIDRs חופפים בין accounts או מול ה-on-prem ('כולם קיבלו 10.0.0.0/16 מה-wizard'). אי אפשר לחבר אותם בצורה הגיונית ל-TGW או לנתב אותם על DX; הפתרון הוא טריקים של NAT או החלפת כתובות. תקצה כל VPC מ-IPAM מהיום הראשון." },
    { en: "Assuming TGW inter-region peering propagates routes. It doesn't: you need static routes on both sides, and forgetting one direction gives asymmetric 'works from A, times out from B' failures.", he: "הנחה ש-peering של TGW בין regions מפיץ routes. הוא לא: צריך static routes בשני הצדדים, ושכחה של כיוון אחד יוצרת תקלות אסימטריות של 'עובד מ-A, נתקע מ-B'." },
    { en: "Failover that depends on editing DNS records during the incident. The Route 53 control plane is in us-east-1 and may be impaired exactly then; and long TTLs keep clients on the dead region. Pre-create failover records with health checks (or ARC routing controls) and use TTLs around 60 s.", he: "Failover שתלוי בעריכת רשומות DNS בזמן התקלה. ה-control plane של Route 53 יושב ב-us-east-1 ויכול להיות פגוע בדיוק אז, ו-TTLs ארוכים משאירים לקוחות על ה-region המת. תיצור מראש רשומות failover עם health checks (או routing controls של ARC), ותשתמש ב-TTL של בערך 60 שניות." },
    { en: "Routing ECR image pulls and S3 traffic from private EKS nodes through NAT Gateways. Terabytes of image layers at about $0.045/GB processed (plus TGW processing in a centralized egress design) is pure waste; S3 gateway endpoints are free.", he: "ניתוב של משיכות images מ-ECR ותעבורת S3 מ-nodes פרטיים של EKS דרך NAT Gateways. טרה-בייטים של שכבות images בערך $0.045 ל-GB (ועוד עיבוד ב-TGW ב-egress מרוכז) הם בזבוז נקי; gateway endpoints ל-S3 הם בחינם." }
  ],
  interview: [
    {
      q: { en: "Design the network for EKS in two regions across 30 accounts, with hybrid connectivity to an on-prem data center.", he: "תתכנן את הרשת ל-EKS בשני regions על פני 30 accounts, עם חיבור היברידי ל-data center ב-on-prem." },
      a: {
        en: "IP plan first: IPAM in a network account with region and environment pools, /20 per workload VPC, never overlapping with on-prem ranges; pods on a non-routable 100.64.0.0/16 secondary CIDR (custom networking) or IPv6, so pod growth doesn't consume routable space. Hub: a TGW per region in the network account, shared via RAM; route tables for prod, non-prod, shared services and inspection; TGW peering between regions with static routes (or Cloud WAN if more regions are coming). Egress: centralized egress VPC per region with NAT per AZ and Network Firewall, plus interface/gateway endpoints in every spoke for ECR, S3, STS, logs to avoid NAT and TGW charges. Hybrid: two Direct Connect connections at different locations into a DX gateway attached to both TGWs, VPN as backup; Route 53 Resolver inbound/outbound endpoints in the network VPC with forwarding rules shared to all accounts. Ingress: per-region ALBs from the LB controller, Route 53 latency + health checks, or Global Accelerator if clients need static IPs. Call out tradeoffs: centralized egress = cheaper NAT + one inspection point, but extra TGW cost and a shared blast radius; a per-AZ failure must not take out egress for all spokes.",
        he: "קודם תוכנית IP: IPAM ב-account של הרשת עם pools לפי region וסביבה, /20 לכל VPC של workload, בלי חפיפה עם ה-ranges של ה-on-prem; Pods על CIDR משני שלא מנותב, 100.64.0.0/16 (custom networking), או על IPv6, כדי שגדילה של Pods לא תאכל מרחב שמנותב. Hub: TGW לכל region ב-account של הרשת, משותף דרך RAM; route tables ל-prod, non-prod, shared services ו-inspection; peering של TGW בין ה-regions עם static routes (או Cloud WAN אם יתווספו עוד regions). Egress: VPC של egress מרוכז בכל region עם NAT לכל AZ ו-Network Firewall, ובנוסף interface ו-gateway endpoints בכל spoke בשביל ECR, S3, STS ולוגים, כדי לחסוך עלויות NAT ו-TGW. היברידי: שני חיבורי Direct Connect במיקומים שונים לתוך DX gateway שמחובר לשני ה-TGWs, עם VPN כגיבוי; Resolver endpoints של Route 53, נכנס ויוצא, ב-VPC של הרשת, עם forwarding rules שמשותפים לכל ה-accounts. כניסה: ALB בכל region דרך ה-LB controller, ו-Route 53 עם latency ו-health checks, או Global Accelerator אם הלקוחות צריכים IPs סטטיים. לציין tradeoffs: egress מרוכז נותן NAT זול יותר ונקודת בדיקה אחת, אבל מוסיף עלות TGW ו-blast radius משותף; כשל של AZ אחד לא אמור להפיל egress לכל ה-spokes."
      }
    },
    {
      q: { en: "CloudFront or Global Accelerator in front of a multi-region API?", he: "CloudFront או Global Accelerator מול API רב-אזורי?" },
      a: {
        en: "Depends on protocol and what you need at the edge. CloudFront if it's HTTP(S) and you want caching (even short TTLs for GETs), WAF at the edge, header/URL logic with CloudFront Functions, and TLS termination close to users; origin selection by region is then done by pointing the origin at a Route 53 latency record or using origin groups for failover. Global Accelerator if it's non-HTTP or long-lived TCP (gRPC streaming, WebSockets at scale, MQTT, UDP), if customers must allow-list fixed IPs, or if you need region failover in seconds independent of DNS caching; GA uses traffic dials for controlled shifting. They can be combined, but usually you pick one per hostname. Strong answers also mention cost (GA has an hourly fee plus a per-GB premium; CloudFront per request and per GB, with potential savings from caching) and that neither solves data replication.",
        he: "תלוי בפרוטוקול ובמה שאתה צריך ב-edge. CloudFront אם זה HTTP או HTTPS ואתה רוצה caching (גם TTLs קצרים לבקשות GET), WAF ב-edge, לוגיקה על headers ו-URLs עם CloudFront Functions, וסיום TLS קרוב למשתמשים. את בחירת ה-region עושים אז כשה-origin מצביע על רשומת latency ב-Route 53, או עם origin groups בשביל failover. Global Accelerator אם זו תעבורה שאינה HTTP או TCP ארוך חיים (gRPC streaming, WebSockets ב-scale, MQTT, UDP), אם לקוחות חייבים לעשות allow-list ל-IPs קבועים, או אם צריך failover בין regions תוך שניות, בלי תלות ב-cache של DNS. ב-GA מזיזים תעבורה בצורה מבוקרת עם traffic dials. אפשר לשלב, אבל בדרך כלל בוחרים אחד לכל hostname. תשובה חזקה מזכירה גם עלות (ל-GA יש תשלום שעתי ועוד תוספת לכל GB; CloudFront מחויב לפי בקשה ולפי GB, עם חיסכון אפשרי מה-caching), ושאף אחד מהם לא פותר replication של דאטה."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A spoke VPC's attachment is associated with TGW route table rt-prod and propagates into rt-shared. What does that mean?", he: "ה-attachment של VPC מסוג spoke משויך ל-route table בשם rt-prod ב-TGW, ועושה propagation ל-rt-shared. מה זה אומר?" },
      options: [
        { en: "Traffic from the spoke is routed using rt-prod; rt-shared learns the spoke's CIDR so shared services can route back", he: "תעבורה מה-spoke מנותבת לפי rt-prod; ה-rt-shared לומד את ה-CIDR של ה-spoke, כך ששירותים משותפים יכולים לנתב חזרה" },
        { en: "Traffic from the spoke uses both tables at random", he: "תעבורה מה-spoke משתמשת בשתי הטבלאות באקראי" },
        { en: "The spoke can reach everything in rt-shared but nothing in rt-prod", he: "ה-spoke מגיע לכל מה שב-rt-shared ולא לשום דבר ב-rt-prod" },
        { en: "Propagation means traffic is mirrored to rt-shared", he: "Propagation אומר שהתעבורה משוכפלת ל-rt-shared" }
      ],
      answer: 0,
      explain: { en: "Association = the table used for lookups of traffic leaving that attachment (one per attachment). Propagation = which tables get a route to the attachment's CIDRs (can be many). Segmentation is built from these two.", he: "Association היא הטבלה שבה מחפשים את התעבורה שיוצאת מה-attachment (אחת לכל attachment). Propagation קובע אילו טבלאות מקבלות route ל-CIDRs של ה-attachment (יכולות להיות הרבה). ההפרדה בנויה משני אלה." }
    },
    {
      q: { en: "Private EKS nodes pull 5 TB/month of images from ECR through a NAT Gateway. What's the best fix?", he: "Nodes פרטיים של EKS מושכים 5 TB בחודש של images מ-ECR דרך NAT Gateway. מה התיקון הכי טוב?" },
      options: [
        { en: "A bigger NAT Gateway", he: "NAT Gateway גדול יותר" },
        { en: "Interface endpoints for ecr.api and ecr.dkr plus an S3 gateway endpoint (layers are served from S3)", he: "Interface endpoints ל-ecr.api ול-ecr.dkr, ועוד gateway endpoint ל-S3 (השכבות מוגשות מ-S3)" },
        { en: "Move the nodes to public subnets", he: "להעביר את ה-nodes ל-subnets ציבוריים" },
        { en: "A Transit Gateway to ECR", he: "Transit Gateway ל-ECR" }
      ],
      answer: 1,
      explain: { en: "ECR API and registry calls go to the interface endpoints; the image layers come from S3, which the free gateway endpoint covers. The bulk of the bytes leave NAT entirely.", he: "קריאות ה-API וה-registry של ECR עוברות ל-interface endpoints, ושכבות ה-images מגיעות מ-S3, שה-gateway endpoint החינמי מכסה. רוב ה-bytes יוצאים לגמרי מה-NAT." }
    },
    {
      q: { en: "Which statement about CloudFront Functions vs Lambda@Edge is correct?", he: "איזו טענה על CloudFront Functions מול Lambda@Edge נכונה?" },
      options: [
        { en: "CloudFront Functions can run on origin request/response and call external APIs", he: "CloudFront Functions יכולים לרוץ על origin request ו-response ולקרוא ל-APIs חיצוניים" },
        { en: "Lambda@Edge is cheaper and faster for simple header rewrites", he: "Lambda@Edge זול ומהיר יותר לשכתוב headers פשוט" },
        { en: "CloudFront Functions run only on viewer events, sub-millisecond, without network access; Lambda@Edge supports origin events and network calls", he: "CloudFront Functions רצים רק על אירועי viewer, בפחות ממילישנייה ובלי גישה לרשת; Lambda@Edge תומך באירועי origin ובקריאות רשת" },
        { en: "They are the same product with different names", he: "זה אותו מוצר עם שמות שונים" }
      ],
      answer: 2,
      explain: { en: "Use CloudFront Functions for cheap, high-volume viewer logic (redirects, header normalization, simple token checks). Use Lambda@Edge when you need origin-side events, longer runtime, the request body, or network calls.", he: "CloudFront Functions מתאימים ללוגיקה זולה בנפח גבוה בצד ה-viewer (redirects, נרמול headers, בדיקת token פשוטה). Lambda@Edge מתאים כשצריך אירועים בצד ה-origin, ריצה ארוכה יותר, את גוף הבקשה או קריאות רשת." }
    },
    {
      q: { en: "On-prem servers must resolve names in a Route 53 private hosted zone. What do you deploy?", he: "שרתים ב-on-prem צריכים לפענח שמות ב-private hosted zone של Route 53. מה פורסים?" },
      options: [
        { en: "A Route 53 Resolver inbound endpoint, and conditional forwarders on-prem pointing at its IPs", he: "Inbound endpoint של Route 53 Resolver, ו-conditional forwarders ב-on-prem שמצביעים על ה-IPs שלו" },
        { en: "An outbound endpoint with a forwarding rule", he: "Outbound endpoint עם forwarding rule" },
        { en: "Make the zone public", he: "להפוך את ה-zone לציבורי" },
        { en: "Point on-prem servers at 169.254.169.253", he: "להפנות את שרתי ה-on-prem ל-169.254.169.253" }
      ],
      answer: 0,
      explain: { en: "Inbound = queries coming into AWS (on-prem to private zones). Outbound + rules = queries leaving AWS (VPCs to on-prem domains). The link-local resolver address is only reachable from inside the VPC.", he: "Inbound זה שאילתות שנכנסות ל-AWS (מה-on-prem ל-private zones). Outbound עם rules זה שאילתות שיוצאות מ-AWS (מה-VPCs לדומיינים של ה-on-prem). כתובת ה-resolver מסוג link-local זמינה רק מתוך ה-VPC." }
    }
  ],
  related: ["net-vpc", "net-hybrid-connectivity", "net-dns-operations", "net-proxies-cdn", "net-bgp-anycast", "net-ddos-edge", "cloud-data-transfer-costs", "staff-multi-region-data", "aws-for-azure-engineers", "aws-eks-production"]
});

/* ------------------------------------------------------------------ glossary */
INFRA.glossary.push(
  { term: "Service Control Policy (SCP)", track: "cloud", def: { en: "An AWS Organizations policy attached to the root, an OU or an account that sets the maximum permissions for IAM principals there. It never grants anything; it only caps.", he: "Policy של AWS Organizations שמוצמדת ל-root, ל-OU או ל-account, וקובעת את ההרשאות המקסימליות של ה-IAM principals שם. היא אף פעם לא נותנת הרשאה, רק מגבילה." }, lesson: "aws-for-azure-engineers" },
  { term: "IAM Identity Center", track: "cloud", def: { en: "AWS's SSO service: connects an external IdP (such as Entra ID) and maps groups to permission sets, which become IAM roles in each account.", he: "שירות ה-SSO של AWS: מתחבר ל-IdP חיצוני (כמו Entra ID) וממפה groups ל-permission sets, שהופכים ל-IAM roles בכל account." }, lesson: "aws-for-azure-engineers" },
  { term: "Bottlerocket", track: "kubernetes", def: { en: "AWS's open-source, container-only Linux OS for nodes: read-only root filesystem, dm-verity, A/B image updates, configured through an API instead of package installs.", he: "מערכת ההפעלה של AWS ל-nodes, בקוד פתוח ורק ל-containers: מערכת קבצים root לקריאה בלבד, dm-verity, עדכוני image בשיטת A/B, וקונפיגורציה דרך API במקום התקנת חבילות." }, lesson: "aws-eks-production" },
  { term: "EKS access entry", track: "kubernetes", def: { en: "An EKS API object that grants an IAM principal access to a cluster, optionally with an access policy scoped to the cluster or namespaces. Replaces the aws-auth ConfigMap.", he: "אובייקט ב-API של EKS שנותן ל-IAM principal גישה ל-cluster, אופציונלית עם access policy שמוגבלת ל-cluster או ל-namespaces. מחליף את ה-ConfigMap בשם aws-auth." }, lesson: "aws-eks-production" },
  { term: "TargetGroupBinding", track: "kubernetes", def: { en: "AWS Load Balancer Controller CRD that registers a Service's pods into an existing ALB/NLB target group managed outside Kubernetes.", he: "CRD של AWS Load Balancer Controller שרושם את ה-Pods של Service לתוך target group קיים של ALB או NLB שמנוהל מחוץ ל-Kubernetes." }, lesson: "aws-eks-production" },
  { term: "Global Accelerator", track: "networking", def: { en: "AWS service giving two static anycast IPs that bring TCP/UDP traffic onto the AWS backbone at the nearest edge and route it to healthy regional endpoints, with traffic dials and fast failover.", he: "שירות AWS שנותן שתי כתובות IP סטטיות של anycast, מכניס תעבורת TCP ו-UDP ל-backbone של AWS ב-edge הקרוב ומנתב אותה ל-endpoints אזוריים בריאים, עם traffic dials ו-failover מהיר." }, lesson: "aws-networking-edge" },
  { term: "Route 53 Resolver endpoint", track: "networking", def: { en: "ENIs in a VPC for hybrid DNS: inbound endpoints let on-prem resolve Route 53 private zones; outbound endpoints with forwarding rules send VPC queries to on-prem DNS.", he: "ENIs בתוך VPC בשביל DNS היברידי: inbound endpoints מאפשרים ל-on-prem לפענח private zones של Route 53, ו-outbound endpoints עם forwarding rules שולחים שאילתות מה-VPC ל-DNS של ה-on-prem." }, lesson: "aws-networking-edge" },
  { term: "Origin Access Control (OAC)", track: "networking", def: { en: "CloudFront feature that signs origin requests to S3 with SigV4 so the bucket can stay private and trust only one distribution. Successor to OAI.", he: "יכולת של CloudFront שחותמת על הבקשות ל-S3 עם SigV4, כך שה-bucket נשאר פרטי וסומך רק על distribution אחד. היורש של OAI." }, lesson: "aws-networking-edge" }
);

/* ------------------------------------------------------------------ scenario */
INFRA.scenarios.push({
  id: "eks-ip-exhaustion",
  icon: "🧮",
  title: { en: "EKS: new pods stuck ContainerCreating, 'failed to assign an IP address'", he: "EKS: Pods חדשים תקועים ב-ContainerCreating עם 'failed to assign an IP address'" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "21:40, product launch. The HPA scaled checkout and search to 3x and Karpenter added 14 nodes, but dozens of new pods have been in ContainerCreating for 8 minutes. Error rate on checkout is 4% and climbing.",
        he: "21:40, השקת מוצר. ה-HPA הגדיל את checkout ו-search פי 3, ו-Karpenter הוסיף 14 nodes, אבל עשרות Pods חדשים תקועים ב-ContainerCreating כבר 8 דקות. ה-error rate ב-checkout עומד על 4% ומטפס."
      },
      data: `$ kubectl get pods -A --field-selector=status.phase=Pending | grep -c ContainerCreating
63
$ kubectl get pods -n shop -o wide | grep ContainerCreating | head -4
checkout-7d9c6b5f4-8kx2p   0/1   ContainerCreating   0   8m   <none>   ip-10-16-9-41.eu-west-1.compute.internal
checkout-7d9c6b5f4-c7tqz   0/1   ContainerCreating   0   8m   <none>   ip-10-16-9-41.eu-west-1.compute.internal
search-5f8d7c9b6-q2wln     0/1   ContainerCreating   0   7m   <none>   ip-10-16-10-12.eu-west-1.compute.internal
search-5f8d7c9b6-zz8rf     0/1   ContainerCreating   0   7m   <none>   ip-10-16-4-200.eu-west-1.compute.internal`,
      choices: [
        { label: { en: "kubectl describe one of the stuck pods and read the events", he: "kubectl describe לאחד ה-Pods התקועים ולקרוא את ה-events" }, next: "s2", score: 15,
          feedback: { en: "Right. ContainerCreating means the pod is scheduled; the events will say what the kubelet or CNI is failing on.", he: "נכון. ContainerCreating אומר שה-Pod כבר תוזמן; ה-events יגידו על מה ה-kubelet או ה-CNI נכשלים." } },
        { label: { en: "Roll out restart of checkout and search", he: "לעשות rollout restart ל-checkout ול-search" }, next: "s1b", score: -10,
          feedback: { en: "A restart creates even more new pods that need the same scarce resource, and kills healthy running ones. Never restart before you know the cause.", he: "Restart יוצר עוד יותר Pods חדשים שצריכים את אותו משאב חסר, והורג Pods בריאים שרצים. אף פעם לא עושים restart לפני שיודעים מה הסיבה." } },
        { label: { en: "Raise the NodePool CPU limit so Karpenter adds more nodes", he: "להעלות את ה-limit של CPU ב-NodePool כדי ש-Karpenter יוסיף עוד nodes" }, next: "s1b", score: -5,
          feedback: { en: "The pods are already scheduled onto nodes; capacity isn't the blocker. More nodes may even make it worse.", he: "ה-Pods כבר תוזמנו ל-nodes, כלומר capacity הוא לא החסם. עוד nodes יכולים אפילו להחמיר." } }
      ]
    },
    s1b: {
      text: {
        en: "Five minutes later: 91 pods are in ContainerCreating and checkout errors are at 7%. The incident channel is filling up.",
        he: "חמש דקות אחר כך: 91 Pods ב-ContainerCreating, ושגיאות ב-checkout עומדות על 7%. ערוץ התקלה מתמלא."
      },
      choices: [
        { label: { en: "Stop and describe a stuck pod", he: "לעצור ולעשות describe ל-Pod תקוע" }, next: "s2", score: 5,
          feedback: { en: "Late, but now you're collecting evidence.", he: "באיחור, אבל עכשיו אתה אוסף ראיות." } }
      ]
    },
    s2: {
      text: {
        en: "The events point at the CNI, not the scheduler.",
        he: "ה-events מצביעים על ה-CNI, לא על ה-scheduler."
      },
      data: `$ kubectl describe pod checkout-7d9c6b5f4-8kx2p -n shop | sed -n '/Events/,$p'
  Warning  FailedCreatePodSandBox  12s (x31 over 8m)  kubelet  Failed to create pod sandbox: rpc error:
  code = Unknown desc = failed to setup network for sandbox "4be1...": plugin type="aws-cni" name="aws-cni"
  failed (add): add cmd: failed to assign an IP address to container`,
      choices: [
        { label: { en: "Check aws-node (ipamd) logs on that node and the free IPs in the node subnets", he: "לבדוק את הלוגים של aws-node (ipamd) על ה-node הזה ואת ה-IPs הפנויים ב-subnets של ה-nodes" }, next: "s3", score: 15,
          feedback: { en: "Yes. The VPC CNI hands out real VPC IPs; you need to know whether the node hit its ENI limit or the subnet ran dry.", he: "כן. ה-VPC CNI מחלק IPs אמיתיים מה-VPC; צריך להבין אם ה-node הגיע ל-limit של ה-ENIs שלו או שה-subnet התרוקן." } },
        { label: { en: "Raise kubelet maxPods on the NodePool", he: "להעלות את maxPods של ה-kubelet ב-NodePool" }, next: "s2b", score: -10,
          feedback: { en: "maxPods only lets the scheduler place more pods per node. If there are no IPs, you just get more pods stuck in ContainerCreating.", he: "maxPods רק מאפשר ל-scheduler לשים יותר Pods על כל node. אם אין IPs, תקבל פשוט יותר Pods תקועים ב-ContainerCreating." } },
        { label: { en: "Delete the aws-node DaemonSet pods to reset the CNI", he: "למחוק את ה-Pods של ה-DaemonSet בשם aws-node כדי לאפס את ה-CNI" }, next: "s2b", score: -10,
          feedback: { en: "Restarting ipamd doesn't create addresses, and while it restarts, no new pod on that node gets networking at all.", he: "Restart ל-ipamd לא יוצר כתובות, ובזמן שהוא עולה מחדש אף Pod חדש על ה-node לא מקבל רשת בכלל." } }
      ]
    },
    s2b: {
      text: {
        en: "Nothing improved; the number of stuck pods kept growing. A teammate asks what the CNI logs say.",
        he: "שום דבר לא השתפר, ומספר ה-Pods התקועים המשיך לגדול. חבר לצוות שואל מה כתוב בלוגים של ה-CNI."
      },
      choices: [
        { label: { en: "Look at ipamd logs and subnet free IPs", he: "להסתכל בלוגים של ipamd וב-IPs הפנויים ב-subnets" }, next: "s3", score: 5,
          feedback: { en: "Good, back on the evidence trail.", he: "טוב, חזרת למסלול של הראיות." } }
      ]
    },
    s3: {
      text: {
        en: "The subnets are almost empty of free addresses, yet most nodes run few pods. Something is hoarding IPs.",
        he: "ב-subnets כמעט לא נשארו כתובות פנויות, ובכל זאת רוב ה-nodes מריצים מעט Pods. משהו אוגר IPs."
      },
      data: `$ kubectl logs -n kube-system ds/aws-node -c aws-node --tail=3   # on ip-10-16-9-41
{"level":"error","msg":"Failed to increase pool size due to not able to allocate ENI AllocENI: error assigning
 private IP addrs: InsufficientFreeAddressesInSubnet: The specified subnet does not have enough free addresses"}

$ aws ec2 describe-subnets --filters Name=tag:karpenter.sh/discovery,Values=prod-euw1 \\
    --query 'Subnets[].[SubnetId,AvailabilityZone,CidrBlock,AvailableIpAddressCount]' --output table
| subnet-0aaa | eu-west-1a | 10.16.0.0/22  |   3 |
| subnet-0bbb | eu-west-1b | 10.16.4.0/22  |  11 |
| subnet-0ccc | eu-west-1c | 10.16.8.0/22  |   0 |

$ kubectl get ds aws-node -n kube-system -o jsonpath='{.spec.template.spec.containers[0].env}' | jq -c '.[] | select(.name|test("WARM|MINIMUM|PREFIX"))'
{"name":"WARM_ENI_TARGET","value":"1"}
{"name":"ENABLE_PREFIX_DELEGATION","value":"false"}

# 58 nodes, mostly c5.4xlarge (8 ENIs x 30 IPs). Average 21 running pods per node.`,
      choices: [
        { label: { en: "Set WARM_IP_TARGET and MINIMUM_IP_TARGET on aws-node so idle warm IPs are released back to the subnets", he: "להגדיר WARM_IP_TARGET ו-MINIMUM_IP_TARGET ב-aws-node, כדי ש-IPs חמים שלא בשימוש ישתחררו חזרה ל-subnets" }, next: "s4", score: 20,
          feedback: { en: "Correct mitigation. With WARM_ENI_TARGET=1 every big node keeps a whole spare ENI (about 29 IPs) attached: 58 nodes can hoard roughly 1,700 IPs from 3 × /22 subnets (about 3,000 usable). WARM_IP_TARGET=5 with MINIMUM_IP_TARGET=25 frees most of them within minutes. Tradeoff: more EC2 API calls during pod churn.", he: "מיטיגציה נכונה. עם WARM_ENI_TARGET=1 כל node גדול מחזיק ENI רזרבי שלם (בערך 29 IPs). 58 nodes יכולים לאגור בערך 1,700 IPs מתוך שלושה subnets של /22 (בערך 3,000 כתובות שמישות). WARM_IP_TARGET=5 עם MINIMUM_IP_TARGET=25 משחרר את רובם תוך דקות. המחיר: יותר קריאות API ל-EC2 בזמן churn של Pods." } },
        { label: { en: "Enable prefix delegation right now", he: "להפעיל prefix delegation עכשיו" }, next: "s3b", score: 0,
          feedback: { en: "Good long-term idea, wrong moment. Prefix delegation needs free contiguous /28 blocks; these subnets are full and fragmented, so allocations fail with InsufficientCidrBlocks. It also only helps nodes that get new ENIs/prefixes.", he: "רעיון טוב לטווח הארוך, רגע לא נכון. Prefix delegation צריך בלוקים רציפים ופנויים של /28; ה-subnets האלה מלאים ומפוצלים, כך שההקצאות ייכשלו עם InsufficientCidrBlocks. בנוסף, זה עוזר רק ל-nodes שמקבלים ENIs או prefixes חדשים." } },
        { label: { en: "Resize the subnets from /22 to /20", he: "להגדיל את ה-subnets מ-/22 ל-/20" }, next: "s3b", score: -10,
          feedback: { en: "AWS subnets can't be resized. You can add a secondary CIDR to the VPC and create new subnets, but that's not a 5-minute fix.", he: "אי אפשר לשנות גודל של subnet ב-AWS. אפשר להוסיף CIDR משני ל-VPC וליצור subnets חדשים, אבל זה לא תיקון של 5 דקות." } }
      ]
    },
    s3b: {
      text: {
        en: "That didn't free anything; 110 pods are now stuck and the VP of engineering joined the call. Look at where the addresses actually went.",
        he: "זה לא שחרר כלום; 110 Pods תקועים עכשיו, וה-VP Engineering הצטרף לשיחה. תסתכל לאן הכתובות הלכו בפועל."
      },
      choices: [
        { label: { en: "Release the warm pool with WARM_IP_TARGET / MINIMUM_IP_TARGET", he: "לשחרר את ה-warm pool עם WARM_IP_TARGET ו-MINIMUM_IP_TARGET" }, next: "s4", score: 5,
          feedback: { en: "Yes: the IPs are attached to nodes but unused. Reclaim them first.", he: "כן: ה-IPs מחוברים ל-nodes אבל לא בשימוש. קודם מחזירים אותם." } }
      ]
    },
    s4: {
      text: {
        en: "Ten minutes after the change, eu-west-1a and 1b show hundreds of free IPs, pods start Running and checkout errors drop below 0.5%. eu-west-1c is still tight. The incident is mitigated. What's the durable fix?",
        he: "עשר דקות אחרי השינוי, ב-eu-west-1a וב-1b יש מאות IPs פנויים, ה-Pods עוברים ל-Running ושגיאות ה-checkout יורדות מתחת ל-0.5%. ב-eu-west-1c עדיין צפוף. התקלה מנוטרלת. מה התיקון העמיד?"
      },
      data: `$ kubectl set env ds/aws-node -n kube-system WARM_IP_TARGET=5 MINIMUM_IP_TARGET=25
daemonset.apps/aws-node env updated
$ aws ec2 describe-subnets ... --query 'Subnets[].[AvailabilityZone,AvailableIpAddressCount]' --output text
eu-west-1a  402
eu-west-1b  451
eu-west-1c   38`,
      choices: [
        { label: { en: "Add a 100.64.0.0/16 secondary CIDR, create per-AZ pod subnets and enable VPC CNI custom networking (ENIConfig per AZ), then roll nodes; add prefix delegation on the new, empty subnets", he: "להוסיף CIDR משני 100.64.0.0/16, ליצור subnets ל-Pods בכל AZ ולהפעיל custom networking ב-VPC CNI (ENIConfig לכל AZ), ואז לגלגל nodes; ולהפעיל prefix delegation על ה-subnets החדשים והריקים" }, next: "s5", score: 20,
          feedback: { en: "This separates pod IPs from the scarce routable space and gives each AZ tens of thousands of pod addresses. Prefix delegation on fresh subnets avoids fragmentation. Move the config into the vpc-cni add-on configuration in Terraform so the hotfix isn't overwritten.", he: "זה מפריד את ה-IPs של ה-Pods מהמרחב המנותב והמוגבל, ונותן לכל AZ עשרות אלפי כתובות ל-Pods. Prefix delegation על subnets חדשים נמנע מפיצול. תעביר את ההגדרות ל-configuration של ה-add-on בשם vpc-cni ב-Terraform, כדי שה-hotfix לא יידרס." } },
        { label: { en: "Keep the env change and close the incident", he: "להשאיר את שינוי ה-env ולסגור את התקלה" }, next: "s5", score: 0,
          feedback: { en: "It works today, but the next launch with 2x growth will hit the same wall, and the next add-on upgrade with OVERWRITE will silently revert your kubectl set env.", he: "זה עובד היום, אבל ההשקה הבאה עם גדילה פי 2 תיתקל באותו קיר, וה-upgrade הבא של ה-add-on עם OVERWRITE יחזיר בשקט את ה-kubectl set env שלך." } },
        { label: { en: "Rebuild the cluster as IPv6 tonight", he: "לבנות מחדש את ה-cluster כ-IPv6 הלילה" }, next: "s5", score: -5,
          feedback: { en: "IPv6 pods do eliminate IP exhaustion, but cluster IP family is fixed at creation; it's a planned migration (new cluster, dependencies must support IPv6), not a late-night change.", he: "Pods על IPv6 באמת מעלימים את מיצוי ה-IPs, אבל משפחת ה-IP של cluster נקבעת ביצירה. זו מיגרציה מתוכננת (cluster חדש, וכל התלויות צריכות לתמוך ב-IPv6), לא שינוי באמצע הלילה." } }
      ]
    },
    s5: {
      text: {
        en: "Postmortem. Which action item prevents a repeat without paging anyone at 21:40?",
        he: "Postmortem. איזה action item מונע חזרה בלי להעיר אף אחד ב-21:40?"
      },
      choices: [
        { label: { en: "Alert on free IPs per node subnet (for example below 20% for 10 minutes) and on ipamd allocation errors; add IP headroom to launch capacity planning", he: "Alert על IPs פנויים בכל subnet של nodes (למשל מתחת ל-20% במשך 10 דקות) ועל שגיאות הקצאה של ipamd; ולהוסיף מרווח IPs לתכנון ה-capacity של השקות" }, next: "win", score: 15,
          feedback: { en: "Subnet IP headroom is a capacity metric like CPU. Watch it per AZ (IPAM utilization or a small exporter on AvailableIpAddressCount) and you'll see the wall days before you hit it.", he: "מרווח IPs ב-subnet הוא מטריקת capacity, בדיוק כמו CPU. תעקוב אחריו לכל AZ (ניצולת ב-IPAM, או exporter קטן על AvailableIpAddressCount), ותראה את הקיר ימים לפני שתפגוש אותו." } },
        { label: { en: "Ask developers to request fewer replicas", he: "לבקש מהמפתחים לבקש פחות replicas" }, next: "lose", score: -10,
          feedback: { en: "The platform failed to provide addresses; blaming demand guarantees the next outage.", he: "הפלטפורמה לא סיפקה כתובות; להאשים את הביקוש זה להבטיח את התקלה הבאה." } }
      ]
    },
    win: {
      text: {
        en: "Resolved. You read the CNI error instead of restarting things, found warm-pool hoarding on full /22 subnets, reclaimed IPs in minutes, and fixed the design with custom networking, prefix delegation on fresh subnets and an IP-headroom alert.",
        he: "נפתר. קראת את השגיאה של ה-CNI במקום לעשות restart לדברים, מצאת אגירה של warm pool על subnets מלאים של /22, החזרת IPs תוך דקות, ותיקנת את התכנון עם custom networking, prefix delegation על subnets חדשים ו-alert על מרווח IPs."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The incident is closed, but the root cause (pods share routable subnet space and nobody watches it) is still there. The next traffic spike will repeat it.",
        he: "התקלה נסגרה, אבל שורש הבעיה (ה-Pods חולקים מרחב subnet מנותב, ואף אחד לא מנטר אותו) עדיין שם. הקפיצה הבאה בתעבורה תחזור על זה."
      },
      end: "lose"
    }
  },
  lessons: ["aws-eks-production", "k8s-networking-cni"]
});
