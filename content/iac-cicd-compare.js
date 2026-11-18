window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Track: cloud — IaC and CI/CD compared side by side (Terraform, Bicep,
   Pulumi, AWS CDK), Terraform production workflow, CI/CD to EKS with
   GitOps, and AWS vs Azure vs GCP service choices.
   Lessons: iac-side-by-side, terraform-production-workflow,
            cicd-aws-eks-pipeline, cloud-big3-services-compare
   ========================================================================= */

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "iac-side-by-side",
  track: "cloud",
  order: 64,
  icon: "🧱",
  level: 2,
  minutes: 16,
  title: { en: "Same Infra, Four Tools: Terraform vs Bicep vs Pulumi vs CDK/CDKTF", he: "אותה תשתית, ארבעה כלים: Terraform מול Bicep מול Pulumi מול CDK/CDKTF" },
  tldr: {
    en: "Write one small stack (network + bucket + managed Kubernetes + a workload identity that may read the bucket) four times and the real differences jump out: where the truth lives (state file, ARM, Pulumi backend, CloudFormation stack), how honest the preview is, how you reuse and test, and how each tool handles drift, secrets and import. CDKTF was deprecated and archived on 10 December 2025, so it is a migration topic, not a choice.",
    he: "תכתוב stack קטן אחד (רשת + bucket + Kubernetes מנוהל + workload identity שמורשה לקרוא מה-bucket) ארבע פעמים, וההבדלים האמיתיים קופצים מיד: איפה האמת נשמרת (קובץ state, ARM, backend של Pulumi, stack של CloudFormation), כמה ה-preview אמין, איך עושים reuse ובדיקות, ואיך כל כלי מתמודד עם drift, סודות ו-import. CDKTF סומן deprecated ועבר ל-archive ב-10 בדצמבר 2025, אז הוא נושא של מיגרציה ולא אופציה."
  },
  analogy: {
    en: "Four contractors build the same house from the same plan. The Terraform contractor keeps his own notebook of what he built (lose it and he forgets the house is his). The Bicep contractor never keeps notes: he asks the city registry (ARM) every time. The Pulumi contractor keeps the notebook too, but writes the plan in a real programming language. The CDK contractor hands everything to the city's own building department (CloudFormation), which builds it and rolls back on its own if a wall fails.",
    he: "ארבעה קבלנים בונים את אותו בית מאותה תוכנית. הקבלן של Terraform מחזיק מחברת משלו עם כל מה שבנה (אם הוא מאבד אותה, הוא שוכח שהבית שלו). הקבלן של Bicep לא רושם כלום: הוא שואל את רשם העירייה (ARM) בכל פעם מחדש. הקבלן של Pulumi מחזיק מחברת גם כן, אבל כותב את התוכנית בשפת תכנות אמיתית. והקבלן של CDK מעביר הכל למחלקת הבנייה של העירייה (CloudFormation), שבונה בעצמה ועושה rollback לבד אם קיר נופל."
  },
  sections: [
    {
      h: { en: "The stack, and the Terraform version (AWS)", he: "ה-stack, והגרסה של Terraform (AWS)" },
      body: {
        en: `<p>The same target in every tool: a private network across 3 AZs, an object-storage bucket, a managed Kubernetes cluster, and an identity for the <code>shop/web</code> ServiceAccount that may <em>only read</em> the bucket. On AWS that last part is an IAM role + EKS Pod Identity association; on Azure it is a managed identity + federated credential + role assignment.</p>
<pre>terraform {
  required_version = "&gt;= 1.11"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 6.0" }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~&gt; 6.0"
  name    = "shop-\${var.env}"
  cidr    = "10.20.0.0/16"
  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.20.0.0/19", "10.20.32.0/19", "10.20.64.0/19"]
  public_subnets  = ["10.20.96.0/22", "10.20.100.0/22", "10.20.104.0/22"]
  enable_nat_gateway = true
  single_nat_gateway = var.env != "prod"   # one NAT per AZ in prod
}

resource "aws_s3_bucket" "assets" {
  bucket = "shop-assets-\${var.env}"     # new buckets block public access by default
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~&gt; 21.0"                   # v21 renamed cluster_name/cluster_version
  name               = "shop-\${var.env}"
  kubernetes_version = "1.34"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  enable_cluster_creator_admin_permissions = true
  eks_managed_node_groups = {
    default = { instance_types = ["m7i.large"], min_size = 2, max_size = 5, desired_size = 2 }
  }
}

resource "aws_eks_addon" "pod_identity" {
  cluster_name = module.eks.cluster_name
  addon_name   = "eks-pod-identity-agent"
}

resource "aws_iam_role" "web" {
  name = "shop-web-\${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "pods.eks.amazonaws.com" }
      Action    = ["sts:AssumeRole", "sts:TagSession"]
    }]
  })
}

resource "aws_iam_role_policy" "read_assets" {
  role = aws_iam_role.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.assets.arn, "\${aws_s3_bucket.assets.arn}/*"]
    }]
  })
}

resource "aws_eks_pod_identity_association" "web" {
  cluster_name    = module.eks.cluster_name
  namespace       = "shop"
  service_account = "web"
  role_arn        = aws_iam_role.web.arn
}</pre>
<p>Notice what HCL gives you: a dependency graph inferred from references (<code>module.eks.cluster_name</code>), community modules that hide ~60 resources behind 10 inputs, and <code>for_each</code>/<code>count</code> instead of loops. Notice what it does not: no functions you can unit-test, no classes, and every input of a module major version is an API you must re-read when you bump it.</p>`,
        he: `<p>אותה מטרה בכל כלי: רשת פרטית על 3 AZs, bucket של object storage, cluster של Kubernetes מנוהל, ו-identity ל-ServiceAccount בשם <code>shop/web</code> שמורשה <em>רק לקרוא</em> מה-bucket. ב-AWS החלק האחרון הוא IAM role ועוד association של EKS Pod Identity. ב-Azure זה managed identity, federated credential ו-role assignment.</p>
<pre>terraform {
  required_version = "&gt;= 1.11"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 6.0" }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~&gt; 6.0"
  name    = "shop-\${var.env}"
  cidr    = "10.20.0.0/16"
  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.20.0.0/19", "10.20.32.0/19", "10.20.64.0/19"]
  public_subnets  = ["10.20.96.0/22", "10.20.100.0/22", "10.20.104.0/22"]
  enable_nat_gateway = true
  single_nat_gateway = var.env != "prod"   # one NAT per AZ in prod
}

resource "aws_s3_bucket" "assets" {
  bucket = "shop-assets-\${var.env}"     # new buckets block public access by default
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~&gt; 21.0"                   # v21 renamed cluster_name/cluster_version
  name               = "shop-\${var.env}"
  kubernetes_version = "1.34"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  enable_cluster_creator_admin_permissions = true
  eks_managed_node_groups = {
    default = { instance_types = ["m7i.large"], min_size = 2, max_size = 5, desired_size = 2 }
  }
}

resource "aws_eks_addon" "pod_identity" {
  cluster_name = module.eks.cluster_name
  addon_name   = "eks-pod-identity-agent"
}

resource "aws_iam_role" "web" {
  name = "shop-web-\${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "pods.eks.amazonaws.com" }
      Action    = ["sts:AssumeRole", "sts:TagSession"]
    }]
  })
}

resource "aws_iam_role_policy" "read_assets" {
  role = aws_iam_role.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.assets.arn, "\${aws_s3_bucket.assets.arn}/*"]
    }]
  })
}

resource "aws_eks_pod_identity_association" "web" {
  cluster_name    = module.eks.cluster_name
  namespace       = "shop"
  service_account = "web"
  role_arn        = aws_iam_role.web.arn
}</pre>
<p>שים לב מה HCL נותן לך: גרף תלויות שנגזר אוטומטית מההפניות (<code>module.eks.cluster_name</code>), module-ים של הקהילה שמסתירים כ-60 משאבים מאחורי 10 inputs, ו-<code>for_each</code>/<code>count</code> במקום לולאות. ומה הוא לא נותן: אין פונקציות שאפשר לכתוב להן unit tests, אין מחלקות, וכל input של major version במודול הוא API שצריך לקרוא מחדש כשמשדרגים.</p>`
      }
    },
    {
      h: { en: "Bicep (Azure): no state file, ARM is the truth", he: "Bicep (Azure): אין קובץ state, ה-ARM הוא האמת" },
      body: {
        en: `<pre>param location string = resourceGroup().location
param env string = 'dev'

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-shop-\${env}'
  location: location
  properties: {
    addressSpace: { addressPrefixes: [ '10.20.0.0/16' ] }
    subnets: [ { name: 'snet-aks', properties: { addressPrefix: '10.20.0.0/19' } } ]
  }
}

resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stshop\${env}\${uniqueString(resourceGroup().id)}'   // 3-24 chars, global
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: { allowBlobPublicAccess: false, minimumTlsVersion: 'TLS1_2' }
}

resource aks 'Microsoft.ContainerService/managedClusters@2024-09-01' = {
  name: 'aks-shop-\${env}'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    dnsPrefix: 'shop-\${env}'
    oidcIssuerProfile: { enabled: true }
    securityProfile: { workloadIdentity: { enabled: true } }
    networkProfile: { networkPlugin: 'azure', networkPluginMode: 'overlay', podCidr: '192.168.0.0/16' }
    agentPoolProfiles: [ {
      name: 'system'
      mode: 'System'
      count: 2
      vmSize: 'Standard_D4s_v5'
      vnetSubnetID: '\${vnet.id}/subnets/snet-aks'
    } ]
  }
}

resource webId 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-shop-web-\${env}'
  location: location
}

resource fic 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: webId
  name: 'shop-web'
  properties: {
    issuer: aks.properties.oidcIssuerProfile.issuerURL
    subject: 'system:serviceaccount:shop:web'
    audiences: [ 'api://AzureADTokenExchange' ]
  }
}

var blobDataReader = '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1'   // Storage Blob Data Reader

resource ra 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sa.id, webId.id, blobDataReader)    // deterministic = idempotent
  scope: sa
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', blobDataReader)
    principalId: webId.properties.principalId
    principalType: 'ServicePrincipal'
  }
}</pre>
<p>Things only Bicep makes you think about: role assignment names must be GUIDs, so you build a deterministic one with <code>guid()</code> or a re-run fails with <code>RoleAssignmentExists</code>. Every resource pins an API version (<code>@2024-09-01</code>), and the linter warns when it is older than ~2 years. There is no state: ARM does an idempotent PUT per resource, so a deployment is "make these resources look like this".</p>
<blockquote>⚠️ Production tip: the default deployment mode is <strong>Incremental</strong>. Delete a resource from the Bicep file and it stays in Azure, quietly costing money. Complete mode deletes extras but only at resource-group scope and is dangerous. The modern answer is <strong>deployment stacks</strong>: <code>az stack group create ... --action-on-unmanage deleteResources --deny-settings-mode denyWriteAndDelete</code>, which tracks a managed set of resources and can block portal edits (drift prevention instead of drift detection).</blockquote>`,
        he: `<pre>param location string = resourceGroup().location
param env string = 'dev'

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-shop-\${env}'
  location: location
  properties: {
    addressSpace: { addressPrefixes: [ '10.20.0.0/16' ] }
    subnets: [ { name: 'snet-aks', properties: { addressPrefix: '10.20.0.0/19' } } ]
  }
}

resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stshop\${env}\${uniqueString(resourceGroup().id)}'   // 3-24 chars, global
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: { allowBlobPublicAccess: false, minimumTlsVersion: 'TLS1_2' }
}

resource aks 'Microsoft.ContainerService/managedClusters@2024-09-01' = {
  name: 'aks-shop-\${env}'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    dnsPrefix: 'shop-\${env}'
    oidcIssuerProfile: { enabled: true }
    securityProfile: { workloadIdentity: { enabled: true } }
    networkProfile: { networkPlugin: 'azure', networkPluginMode: 'overlay', podCidr: '192.168.0.0/16' }
    agentPoolProfiles: [ {
      name: 'system'
      mode: 'System'
      count: 2
      vmSize: 'Standard_D4s_v5'
      vnetSubnetID: '\${vnet.id}/subnets/snet-aks'
    } ]
  }
}

resource webId 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-shop-web-\${env}'
  location: location
}

resource fic 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: webId
  name: 'shop-web'
  properties: {
    issuer: aks.properties.oidcIssuerProfile.issuerURL
    subject: 'system:serviceaccount:shop:web'
    audiences: [ 'api://AzureADTokenExchange' ]
  }
}

var blobDataReader = '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1'   // Storage Blob Data Reader

resource ra 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sa.id, webId.id, blobDataReader)    // deterministic = idempotent
  scope: sa
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', blobDataReader)
    principalId: webId.properties.principalId
    principalType: 'ServicePrincipal'
  }
}</pre>
<p>דברים ש-Bicep מכריח אותך לחשוב עליהם: השם של role assignment חייב להיות GUID. לכן בונים שם דטרמיניסטי עם <code>guid()</code>, אחרת הרצה שנייה נכשלת עם <code>RoleAssignmentExists</code>. כל משאב נועל API version (<code>@2024-09-01</code>), וה-linter מזהיר כשהוא ישן מכשנתיים. אין state: ה-ARM עושה PUT אידמפוטנטי לכל משאב, כך שכל deployment אומר "תגרום למשאבים האלה להיראות ככה".</p>
<blockquote>⚠️ Production tip: מצב ה-deployment ברירת המחדל הוא <strong>Incremental</strong>. מחקת משאב מקובץ ה-Bicep? הוא נשאר ב-Azure ועולה כסף בשקט. מצב Complete מוחק את העודפים, אבל רק ב-scope של resource group, והוא מסוכן. התשובה המודרנית היא <strong>deployment stacks</strong>: <code>az stack group create ... --action-on-unmanage deleteResources --deny-settings-mode denyWriteAndDelete</code>. ה-stack עוקב אחרי סט מנוהל של משאבים ויכול לחסום עריכות מה-portal. כלומר מניעת drift, ולא רק זיהוי שלו.</blockquote>`
      }
    },
    {
      h: { en: "Pulumi TypeScript, AWS CDK, and what CDKTF looked like", he: "Pulumi ב-TypeScript, AWS CDK, ואיך CDKTF נראה" },
      body: {
        en: `<p><strong>Pulumi</strong> calls the cloud APIs through the same Terraform-derived providers (for most AWS resources), but your program is real TypeScript. It keeps its own state, like Terraform.</p>
<pre>import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";

const env = pulumi.getStack();                      // stack = dev | prod
const vpc = new awsx.ec2.Vpc("shop", {
  cidrBlock: "10.20.0.0/16",
  numberOfAvailabilityZones: 3,
  natGateways: { strategy: env === "prod" ? "OnePerAz" : "Single" },
});
const assets = new aws.s3.Bucket("assets", { forceDestroy: env !== "prod" });

const cluster = new eks.Cluster("shop", {
  vpcId: vpc.vpcId,
  privateSubnetIds: vpc.privateSubnetIds,
  publicSubnetIds: vpc.publicSubnetIds,
  instanceType: "m7i.large",
  desiredCapacity: 2, minSize: 2, maxSize: 5,
  authenticationMode: eks.AuthenticationMode.Api,
});
new aws.eks.Addon("pod-identity", { clusterName: cluster.eksCluster.name, addonName: "eks-pod-identity-agent" });

const role = new aws.iam.Role("web", {
  assumeRolePolicy: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow",
    Principal: { Service: "pods.eks.amazonaws.com" }, Action: ["sts:AssumeRole", "sts:TagSession"] }] }),
});
new aws.iam.RolePolicy("read-assets", {
  role: role.id,
  policy: assets.arn.apply(arn =&gt; JSON.stringify({ Version: "2012-10-17", Statement: [{
    Effect: "Allow", Action: ["s3:GetObject", "s3:ListBucket"], Resource: [arn, arn + "/*"] }] })),
});
new aws.eks.PodIdentityAssociation("web", {
  clusterName: cluster.eksCluster.name, namespace: "shop", serviceAccount: "web", roleArn: role.arn,
});
export const kubeconfig = cluster.kubeconfig;</pre>
<p>The one concept that trips everyone: <code>assets.arn</code> is an <code>Output&lt;string&gt;</code> (a promise of a value known only after create), so you transform it with <code>.apply()</code> or <code>pulumi.interpolate</code>, never string concatenation.</p>
<p><strong>AWS CDK</strong> also uses real code, but it <em>synthesizes a CloudFormation template</em> and lets CloudFormation do the deploy. High-level (L2) constructs write the IAM for you:</p>
<pre>import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as eks from "aws-cdk-lib/aws-eks";
import { KubectlV33Layer } from "@aws-cdk/lambda-layer-kubectl-v33";
import { Construct } from "constructs";

export class ShopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, "Vpc", { ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"), maxAzs: 3, natGateways: 1 });
    const assets = new s3.Bucket(this, "Assets", { enforceSSL: true, removalPolicy: RemovalPolicy.RETAIN });
    const cluster = new eks.Cluster(this, "Shop", {
      version: eks.KubernetesVersion.V1_33,
      kubectlLayer: new KubectlV33Layer(this, "Kubectl"),
      vpc, defaultCapacity: 2, defaultCapacityInstance: new ec2.InstanceType("m7i.large"),
    });
    const ns = cluster.addManifest("Ns", { apiVersion: "v1", kind: "Namespace", metadata: { name: "shop" } });
    const sa = cluster.addServiceAccount("Web", { name: "web", namespace: "shop",
      identityType: eks.IdentityType.POD_IDENTITY });
    sa.node.addDependency(ns);
    assets.grantRead(sa);              // writes the least-privilege IAM policy for you
  }
}</pre>
<p><code>assets.grantRead(sa)</code> is the CDK superpower: one line produces a correct IAM policy (including KMS decrypt if the bucket is KMS-encrypted). The cost: the classic EKS construct deploys helper Lambdas (kubectl layer) and custom resources to talk to the cluster; check whether the newer EKS v2 construct module (native CloudFormation, access entries) has gone stable before you start.</p>
<p><strong>CDKTF</strong> (CDK for Terraform) let you write the same constructs style and synthesize Terraform JSON. HashiCorp deprecated it and archived the repository on <strong>10 December 2025</strong>, citing lack of product-market fit; there are no more fixes or provider bindings. The official exit is <code>cdktf synth --hcl</code> to export your project to plain HCL and continue on Terraform (or OpenTofu); teams that want to stay code-first usually move to Pulumi, which has a CDKTF conversion path.</p>`,
        he: `<p><strong>Pulumi</strong> קורא ל-APIs של הענן דרך אותם providers שנגזרו מ-Terraform (לרוב המשאבים ב-AWS), אבל התוכנית שלך היא TypeScript אמיתי. הוא מחזיק state משלו, בדיוק כמו Terraform.</p>
<pre>import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";

const env = pulumi.getStack();                      // stack = dev | prod
const vpc = new awsx.ec2.Vpc("shop", {
  cidrBlock: "10.20.0.0/16",
  numberOfAvailabilityZones: 3,
  natGateways: { strategy: env === "prod" ? "OnePerAz" : "Single" },
});
const assets = new aws.s3.Bucket("assets", { forceDestroy: env !== "prod" });

const cluster = new eks.Cluster("shop", {
  vpcId: vpc.vpcId,
  privateSubnetIds: vpc.privateSubnetIds,
  publicSubnetIds: vpc.publicSubnetIds,
  instanceType: "m7i.large",
  desiredCapacity: 2, minSize: 2, maxSize: 5,
  authenticationMode: eks.AuthenticationMode.Api,
});
new aws.eks.Addon("pod-identity", { clusterName: cluster.eksCluster.name, addonName: "eks-pod-identity-agent" });

const role = new aws.iam.Role("web", {
  assumeRolePolicy: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow",
    Principal: { Service: "pods.eks.amazonaws.com" }, Action: ["sts:AssumeRole", "sts:TagSession"] }] }),
});
new aws.iam.RolePolicy("read-assets", {
  role: role.id,
  policy: assets.arn.apply(arn =&gt; JSON.stringify({ Version: "2012-10-17", Statement: [{
    Effect: "Allow", Action: ["s3:GetObject", "s3:ListBucket"], Resource: [arn, arn + "/*"] }] })),
});
new aws.eks.PodIdentityAssociation("web", {
  clusterName: cluster.eksCluster.name, namespace: "shop", serviceAccount: "web", roleArn: role.arn,
});
export const kubeconfig = cluster.kubeconfig;</pre>
<p>המושג שמפיל את כולם: <code>assets.arn</code> הוא <code>Output&lt;string&gt;</code>, כלומר הבטחה לערך שיהיה ידוע רק אחרי היצירה. לכן משנים אותו עם <code>.apply()</code> או <code>pulumi.interpolate</code>, ואף פעם לא עם שרשור מחרוזות.</p>
<p>גם <strong>AWS CDK</strong> משתמש בקוד אמיתי, אבל הוא <em>מייצר template של CloudFormation</em> ונותן ל-CloudFormation לבצע את ה-deploy. ה-constructs ברמה הגבוהה (L2) כותבים את ה-IAM בשבילך:</p>
<pre>import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as eks from "aws-cdk-lib/aws-eks";
import { KubectlV33Layer } from "@aws-cdk/lambda-layer-kubectl-v33";
import { Construct } from "constructs";

export class ShopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, "Vpc", { ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"), maxAzs: 3, natGateways: 1 });
    const assets = new s3.Bucket(this, "Assets", { enforceSSL: true, removalPolicy: RemovalPolicy.RETAIN });
    const cluster = new eks.Cluster(this, "Shop", {
      version: eks.KubernetesVersion.V1_33,
      kubectlLayer: new KubectlV33Layer(this, "Kubectl"),
      vpc, defaultCapacity: 2, defaultCapacityInstance: new ec2.InstanceType("m7i.large"),
    });
    const ns = cluster.addManifest("Ns", { apiVersion: "v1", kind: "Namespace", metadata: { name: "shop" } });
    const sa = cluster.addServiceAccount("Web", { name: "web", namespace: "shop",
      identityType: eks.IdentityType.POD_IDENTITY });
    sa.node.addDependency(ns);
    assets.grantRead(sa);              // writes the least-privilege IAM policy for you
  }
}</pre>
<p>הכוח המיוחד של CDK הוא <code>assets.grantRead(sa)</code>: שורה אחת שמייצרת IAM policy נכונה, כולל הרשאת KMS decrypt אם ה-bucket מוצפן ב-KMS. המחיר: ה-construct הקלאסי של EKS פורס Lambdas עזר (ה-kubectl layer) ו-custom resources כדי לדבר עם ה-cluster. לפני שאתה מתחיל, בדוק אם מודול ה-EKS v2 החדש (CloudFormation native עם access entries) כבר יצא מ-alpha.</p>
<p><strong>CDKTF</strong> (CDK for Terraform) אפשר לכתוב באותו סגנון של constructs ולייצר JSON של Terraform. HashiCorp סימנו אותו deprecated והעבירו את ה-repo ל-archive ב-<strong>10 בדצמבר 2025</strong>, עם הנימוק שלא נמצא לו product-market fit. אין יותר תיקונים ואין bindings חדשים ל-providers. היציאה הרשמית היא <code>cdktf synth --hcl</code>, שמייצא את הפרויקט ל-HCL רגיל כדי להמשיך על Terraform או OpenTofu. צוותים שרוצים להישאר code-first עוברים בדרך כלל ל-Pulumi, שיש לו מסלול המרה מ-CDKTF.</p>`
      }
    },
    {
      h: { en: "Where the truth lives: state, preview and drift", he: "איפה האמת נשמרת: state, preview ו-drift" },
      body: {
        en: `<table>
<tr><th></th><th>Terraform / OpenTofu</th><th>Bicep</th><th>Pulumi</th><th>AWS CDK</th></tr>
<tr><td>State</td><td>JSON state file in a backend you own (S3, azurerm, GCS, HCP Terraform). Contains secrets in plaintext</td><td>None. ARM is the source of truth; each run leaves a <em>deployment</em> record (max 800 per resource group, oldest auto-deleted)</td><td>Checkpoint per stack in Pulumi Cloud (default) or a self-managed backend (<code>s3://</code>, <code>azblob://</code>, <code>gs://</code>); secrets encrypted per stack</td><td>The CloudFormation stack, owned by AWS. Max 500 resources per stack</td></tr>
<tr><td>Preview</td><td><code>terraform plan -out=tfplan</code>; applying the saved plan does exactly that or fails as stale</td><td><code>az deployment group what-if</code>: helpful but noisy (server-side defaults show as changes), and not a binding plan</td><td><code>pulumi preview --diff</code>; update plans (<code>--save-plan</code>) exist but are not the default workflow</td><td><code>cdk diff</code> compares templates; a CloudFormation <em>change set</em> is the authoritative preview (shows replacements)</td></tr>
<tr><td>Failure mid-deploy</td><td>Partial apply; state records what was created; fix and re-apply</td><td>Deployment fails; already-PUT resources stay</td><td>Partial; state records progress; <code>pulumi cancel</code> / re-run</td><td>Automatic rollback of the whole stack (can stick in <code>UPDATE_ROLLBACK_FAILED</code>)</td></tr>
<tr><td>Drift</td><td><code>plan -refresh-only</code>, or <code>plan -detailed-exitcode</code> on a schedule</td><td>Re-run what-if; prevent it with deployment stack deny settings</td><td><code>pulumi refresh</code> / <code>pulumi preview --refresh</code>; scheduled drift detection in Pulumi Cloud</td><td><code>aws cloudformation detect-stack-drift</code> (not every resource type supported); CFN never auto-corrects</td></tr>
</table>
<p>The big mental shift for an Azure engineer: in Bicep, losing "the state" is impossible because there is none. In Terraform and Pulumi the state file <em>is</em> ownership. Lose it and the tool thinks nothing exists, so the next apply tries to create duplicates or fails on name conflicts. That is why the backend gets versioning, encryption and locking (see <code>terraform-production-workflow</code>).</p>`,
        he: `<table>
<tr><th></th><th>Terraform / OpenTofu</th><th>Bicep</th><th>Pulumi</th><th>AWS CDK</th></tr>
<tr><td>State</td><td>קובץ state ב-JSON ב-backend שלך (S3, azurerm, GCS, HCP Terraform). מכיל סודות כ-plaintext</td><td>אין. ה-ARM הוא מקור האמת; כל הרצה משאירה רשומת <em>deployment</em> (עד 800 ל-resource group, הישנות נמחקות אוטומטית)</td><td>Checkpoint לכל stack ב-Pulumi Cloud (ברירת מחדל) או ב-backend עצמאי (<code>s3://</code>, <code>azblob://</code>, <code>gs://</code>); סודות מוצפנים לכל stack</td><td>ה-stack של CloudFormation, ש-AWS מחזיקים. עד 500 משאבים ל-stack</td></tr>
<tr><td>Preview</td><td><code>terraform plan -out=tfplan</code>; הרצת ה-plan השמור עושה בדיוק את זה, או נכשלת כ-stale</td><td><code>az deployment group what-if</code>: מועיל אבל רועש (defaults של השרת מופיעים כשינויים), ולא מחייב</td><td><code>pulumi preview --diff</code>; יש update plans (<code>--save-plan</code>), אבל זה לא ה-workflow הרגיל</td><td><code>cdk diff</code> משווה templates; ה-<em>change set</em> של CloudFormation הוא ה-preview המחייב (מראה replacements)</td></tr>
<tr><td>כשל באמצע</td><td>Apply חלקי; ה-state רושם מה נוצר; מתקנים ומריצים שוב</td><td>ה-deployment נכשל; משאבים שכבר עברו PUT נשארים</td><td>חלקי; ה-state רושם התקדמות; <code>pulumi cancel</code> או הרצה חוזרת</td><td>Rollback אוטומטי לכל ה-stack (יכול להיתקע ב-<code>UPDATE_ROLLBACK_FAILED</code>)</td></tr>
<tr><td>Drift</td><td><code>plan -refresh-only</code>, או <code>plan -detailed-exitcode</code> מתוזמן</td><td>להריץ what-if שוב; למנוע עם deny settings של deployment stack</td><td><code>pulumi refresh</code> / <code>pulumi preview --refresh</code>; זיהוי drift מתוזמן ב-Pulumi Cloud</td><td><code>aws cloudformation detect-stack-drift</code> (לא כל סוגי המשאבים נתמכים); CFN לא מתקן לבד</td></tr>
</table>
<p>השינוי המחשבתי הגדול למהנדס Azure: ב-Bicep אי אפשר לאבד את ה-state, כי אין כזה. ב-Terraform וב-Pulumi קובץ ה-state <em>הוא</em> הבעלות. מאבדים אותו, והכלי חושב ששום דבר לא קיים. ה-apply הבא ינסה ליצור כפילויות או ייכשל על התנגשות שמות. בגלל זה ה-backend מקבל versioning, הצפנה ו-locking (ראה <code>terraform-production-workflow</code>).</p>`
      }
    },
    {
      h: { en: "Reuse, testing, secrets and import", he: "Reuse, בדיקות, סודות ו-import" },
      body: {
        en: `<table>
<tr><th></th><th>Terraform</th><th>Bicep</th><th>Pulumi</th><th>AWS CDK</th></tr>
<tr><td>Reuse</td><td>Modules from the public/private registry or Git (<code>?ref=v3.2.1</code>)</td><td>Bicep modules; publish to ACR as a private registry (<code>br:myacr.azurecr.io/bicep/aks:1.4.0</code>); Azure Verified Modules (<code>br/public:avm/res/...</code>)</td><td>ComponentResource classes; packaged multi-language components</td><td>Constructs (L1 raw, L2 opinionated, L3 patterns); Construct Hub; jsii for multi-language</td></tr>
<tr><td>Testing</td><td><code>terraform test</code> (<code>.tftest.hcl</code>, mock providers since 1.7), <code>tflint</code></td><td>Built-in linter (<code>bicepconfig.json</code>), PSRule for Azure, what-if in CI</td><td>Unit tests with mocks (<code>pulumi.runtime.setMocks</code>), policy packs (CrossGuard)</td><td><code>Template.fromStack()</code> assertions, snapshot tests, cdk-nag</td></tr>
<tr><td>Secrets</td><td>Mark <code>sensitive</code> (hides output, still in state); ephemeral resources (1.10) and write-only arguments (1.11) keep values out of state</td><td><code>@secure()</code> params; <code>getSecret()</code> from Key Vault in the params file</td><td><code>pulumi config set --secret</code>, encrypted in state; Pulumi ESC for env-wide secrets</td><td>Secrets Manager dynamic references; never plaintext in the template</td></tr>
<tr><td>Import existing</td><td><code>import {}</code> blocks + <code>plan -generate-config-out=gen.tf</code></td><td>Declare it with the same name (ARM PUT adopts it; careful, it overwrites properties) or reference with <code>existing</code></td><td><code>pulumi import</code> generates code; or the <code>import</code> resource option</td><td><code>cdk import</code>; <code>cdk migrate --from-scan</code> generates an app from existing resources</td></tr>
</table>
<pre># Terraform: a real test file (tests/assets.tftest.hcl)
run "bucket_is_named_per_env" {
  command = plan
  variables { env = "dev" }
  assert {
    condition     = aws_s3_bucket.assets.bucket == "shop-assets-dev"
    error_message = "bucket name must include the env"
  }
}

// CDK: assert the synthesized template
const t = Template.fromStack(new ShopStack(app, "Test"));
t.hasResourceProperties("AWS::S3::Bucket", { PublicAccessBlockConfiguration: Match.anyValue() });</pre>`,
        he: `<table>
<tr><th></th><th>Terraform</th><th>Bicep</th><th>Pulumi</th><th>AWS CDK</th></tr>
<tr><td>Reuse</td><td>Modules מה-registry הציבורי/הפרטי או מ-Git (<code>?ref=v3.2.1</code>)</td><td>Bicep modules; פרסום ל-ACR כ-registry פרטי (<code>br:myacr.azurecr.io/bicep/aks:1.4.0</code>); Azure Verified Modules (<code>br/public:avm/res/...</code>)</td><td>מחלקות ComponentResource; components ארוזים לכמה שפות</td><td>Constructs (L1 גולמי, L2 דעתני, L3 patterns); Construct Hub; jsii לריבוי שפות</td></tr>
<tr><td>בדיקות</td><td><code>terraform test</code> (<code>.tftest.hcl</code>, mock providers מגרסה 1.7), <code>tflint</code></td><td>Linter מובנה (<code>bicepconfig.json</code>), PSRule for Azure, what-if ב-CI</td><td>Unit tests עם mocks (<code>pulumi.runtime.setMocks</code>), policy packs (CrossGuard)</td><td>Assertions עם <code>Template.fromStack()</code>, snapshot tests, cdk-nag</td></tr>
<tr><td>סודות</td><td>סימון <code>sensitive</code> (מסתיר בפלט, עדיין ב-state); ephemeral resources (1.10) ו-write-only arguments (1.11) משאירים ערכים מחוץ ל-state</td><td>פרמטרים עם <code>@secure()</code>; <code>getSecret()</code> מ-Key Vault בקובץ הפרמטרים</td><td><code>pulumi config set --secret</code>, מוצפן ב-state; Pulumi ESC לסודות ברמת סביבה</td><td>Dynamic references ל-Secrets Manager; אף פעם לא plaintext ב-template</td></tr>
<tr><td>Import של קיים</td><td>בלוקים של <code>import {}</code> + <code>plan -generate-config-out=gen.tf</code></td><td>להצהיר עליו עם אותו שם (ה-PUT של ARM מאמץ אותו; זהירות, הוא דורס properties) או הפניה עם <code>existing</code></td><td><code>pulumi import</code> מייצר קוד; או ה-resource option בשם <code>import</code></td><td><code>cdk import</code>; <code>cdk migrate --from-scan</code> מייצר app ממשאבים קיימים</td></tr>
</table>
<pre># Terraform: a real test file (tests/assets.tftest.hcl)
run "bucket_is_named_per_env" {
  command = plan
  variables { env = "dev" }
  assert {
    condition     = aws_s3_bucket.assets.bucket == "shop-assets-dev"
    error_message = "bucket name must include the env"
  }
}

// CDK: assert the synthesized template
const t = Template.fromStack(new ShopStack(app, "Test"));
t.hasResourceProperties("AWS::S3::Bucket", { PublicAccessBlockConfiguration: Match.anyValue() });</pre>`
      }
    },
    {
      h: { en: "Decision table", he: "טבלת החלטה" },
      body: {
        en: `<table>
<tr><th>Situation</th><th>Pick</th><th>Why</th></tr>
<tr><td>Azure-only shop, ops-heavy team</td><td>Bicep + deployment stacks</td><td>Day-0 support for new Azure API versions, no state to protect, AVM modules</td></tr>
<tr><td>AWS-only, app developers own their infra</td><td>AWS CDK</td><td><code>grant*()</code> methods, CloudFormation rollback, same language as the app</td></tr>
<tr><td>Multi-cloud or many SaaS providers (Datadog, Cloudflare, GitHub, PagerDuty)</td><td>Terraform / OpenTofu</td><td>Largest provider ecosystem, most hiring familiarity, plan files are reviewable</td></tr>
<tr><td>Platform team building reusable abstractions with real tests</td><td>Pulumi</td><td>Classes, packages, unit tests, any provider Terraform has</td></tr>
<tr><td>Existing CDKTF codebase</td><td>Migrate</td><td><code>cdktf synth --hcl</code> to Terraform, or convert to Pulumi; do not start new work on it</td></tr>
<tr><td>Licence concerns about BSL</td><td>OpenTofu</td><td>MPL-licensed fork, drop-in for most configs (see <code>iac-landscape</code>)</td></tr>
</table>
<blockquote>💡 Interview line: "The language matters less than the state model and the review loop. I want a preview a reviewer can trust, a backend I can recover, and drift I detect before it detects me. For AWS plus a dozen SaaS providers that is Terraform; for an Azure-only estate I would not fight Bicep."</blockquote>`,
        he: `<table>
<tr><th>מצב</th><th>בחירה</th><th>למה</th></tr>
<tr><td>ארגון Azure בלבד, צוות עם הרבה ops</td><td>Bicep + deployment stacks</td><td>תמיכה מהיום הראשון ב-API versions חדשים של Azure, אין state לשמור עליו, module-ים של AVM</td></tr>
<tr><td>AWS בלבד, המפתחים מחזיקים את התשתית שלהם</td><td>AWS CDK</td><td>מתודות <code>grant*()</code>, rollback של CloudFormation, אותה שפה כמו האפליקציה</td></tr>
<tr><td>ריבוי עננים או הרבה ספקי SaaS (Datadog, Cloudflare, GitHub, PagerDuty)</td><td>Terraform / OpenTofu</td><td>האקוסיסטם הכי גדול של providers, הכי מוכר בגיוס, קבצי plan שאפשר לעשות להם review</td></tr>
<tr><td>צוות platform שבונה הפשטות לשימוש חוזר עם בדיקות אמיתיות</td><td>Pulumi</td><td>מחלקות, packages, unit tests, וכל provider שיש ל-Terraform</td></tr>
<tr><td>קוד קיים ב-CDKTF</td><td>מיגרציה</td><td><code>cdktf synth --hcl</code> ל-Terraform, או המרה ל-Pulumi; לא מתחילים עליו עבודה חדשה</td></tr>
<tr><td>חשש מרישיון ה-BSL</td><td>OpenTofu</td><td>Fork ברישיון MPL, תחליף ישיר לרוב הקונפיגורציות (ראה <code>iac-landscape</code>)</td></tr>
</table>
<blockquote>💡 משפט לראיון: "השפה פחות חשובה ממודל ה-state ומלולאת ה-review. אני רוצה preview שה-reviewer יכול לסמוך עליו, backend שאני יודע לשחזר, ו-drift שאני מזהה לפני שהוא מזהה אותי. בשביל AWS ועוד תריסר ספקי SaaS זה Terraform. בסביבה שכולה Azure, לא הייתי נלחם ב-Bicep."</blockquote>`
      }
    }
  ],
  diagram: "Terraform/Pulumi:  code --plan/preview--> provider APIs   (state file = ownership)\nBicep:             code --build--> ARM JSON --PUT--> ARM            (ARM = truth, no state)\nAWS CDK:           code --synth--> CFN template --change set--> CloudFormation stack (rollback)\nCDKTF:             code --synth--> TF JSON --> terraform   (archived Dec 2025: export with synth --hcl)",
  handsOn: [
    { cmd: "terraform plan -out=tfplan && terraform show -json tfplan | jq '.resource_changes[] | {address, actions: .change.actions}'", what: { en: "Save a binding plan and list every resource address with its action (create/update/delete/replace). This JSON is what policy tools and reviewers consume.", he: "שומר plan מחייב ומציג כל כתובת משאב עם הפעולה שלה (create/update/delete/replace). את ה-JSON הזה צורכים כלי policy וה-reviewers." } },
    { cmd: "az deployment group what-if -g rg-shop-dev -f main.bicep -p env=dev --result-format ResourceIdOnly", what: { en: "Bicep's preview. ResourceIdOnly cuts the property-level noise when you only want to know what gets created or deleted.", he: "ה-preview של Bicep. המצב ResourceIdOnly חותך את הרעש ברמת ה-properties כשאתה רק רוצה לדעת מה נוצר ומה נמחק." } },
    { cmd: "az stack group create -n shop-dev -g rg-shop-dev -f main.bicep --action-on-unmanage deleteResources --deny-settings-mode denyWriteAndDelete", what: { en: "Deploy as a deployment stack: resources removed from the file get deleted, and portal edits are blocked.", he: "פריסה כ-deployment stack: משאבים שהוסרו מהקובץ נמחקים, ועריכות מה-portal נחסמות." } },
    { cmd: "pulumi preview --diff --stack dev && pulumi refresh --stack dev --preview-only", what: { en: "Show property-level changes, then show drift between the Pulumi state and the real cloud without writing anything.", he: "מציג שינויים ברמת ה-properties, ואחר כך מראה drift בין ה-state של Pulumi לענן האמיתי, בלי לכתוב כלום." } },
    { cmd: "cdk synth ShopStack > /tmp/shop.yaml && cdk diff ShopStack", what: { en: "See the CloudFormation template CDK generates (count the IAM statements grantRead wrote), then diff it against the deployed stack.", he: "מציג את ה-template של CloudFormation ש-CDK מייצר (תספור כמה IAM statements נכתבו ע\"י grantRead), ואז משווה מול ה-stack הפרוס." } }
  ],
  mnemonic: {
    en: "Notebook, Registry, Notebook-in-code, Building department: Terraform keeps notes, Bicep asks ARM, Pulumi keeps notes in TypeScript, CDK hands it to CloudFormation. CDKTF retired in Dec 2025.",
    he: "מחברת, רשם, מחברת-בקוד, מחלקת בנייה: Terraform רושם לעצמו, Bicep שואל את ה-ARM, Pulumi רושם ב-TypeScript, ו-CDK מעביר ל-CloudFormation. CDKTF פרש בדצמבר 2025."
  },
  pitfalls: [
    { en: "Assuming Bicep deletes what you removed. Incremental mode leaves orphans running; use deployment stacks with actionOnUnmanage, or you will find a forgotten AKS cluster on the bill.", he: "להניח ש-Bicep מוחק את מה שהסרת. מצב Incremental משאיר יתומים רצים. תשתמש ב-deployment stacks עם actionOnUnmanage, אחרת תמצא cluster של AKS נשכח בחשבונית." },
    { en: "Treating what-if or cdk diff like a Terraform saved plan. Neither is binding; what-if has false positives, and cdk diff on templates can miss replacements that a change set would show.", he: "להתייחס ל-what-if או ל-cdk diff כמו ל-plan שמור של Terraform. אף אחד מהם לא מחייב: ל-what-if יש false positives, ו-cdk diff על templates יכול לפספס replacements שה-change set היה מראה." },
    { en: "Concatenating a Pulumi Output as a string. You get 'Calling [toString] on an Output' in the resource name; use pulumi.interpolate or apply().", he: "לשרשר Output של Pulumi כמחרוזת. תקבל 'Calling [toString] on an Output' בשם המשאב. תשתמש ב-pulumi.interpolate או ב-apply()." },
    { en: "Starting a new project on CDKTF because an old blog post recommends it. It is archived; there will be no new provider bindings, so it rots with every provider release.", he: "להתחיל פרויקט חדש על CDKTF כי פוסט ישן המליץ עליו. הוא ב-archive, לא יהיו bindings חדשים ל-providers, והוא יירקב עם כל release של provider." }
  ],
  interview: [
    {
      q: { en: "You are moving from Bicep to Terraform. What changes in how you operate, not just how you write code?", he: "אתה עובר מ-Bicep ל-Terraform. מה משתנה באופן התפעול, לא רק באיך שכותבים קוד?" },
      a: { en: "State becomes a critical asset: remote backend with versioning, encryption and locking, a recovery runbook, and least-privilege access since it holds secrets. Plans become binding artifacts reviewed in PRs and applied exactly. Deletion semantics flip: removing a resource from code destroys it, so I review deletes carefully and use moved/removed blocks for refactors. Drift is something I detect on a schedule rather than prevent with deny settings. And I lose day-0 Azure API coverage; azurerm sometimes lags, so azapi fills gaps.", he: "ה-state הופך לנכס קריטי: backend מרוחק עם versioning, הצפנה ו-locking, runbook לשחזור, והרשאות מינימליות כי יש בו סודות. ה-plan הופך ל-artifact מחייב שעובר review ב-PR ומורץ בדיוק כמו שהוא. סמנטיקת המחיקה מתהפכת: הסרת משאב מהקוד מוחקת אותו, אז אני בודק deletes בזהירות ומשתמש בבלוקים של moved/removed ב-refactors. את ה-drift אני מזהה בתזמון במקום למנוע אותו עם deny settings. ואני מאבד כיסוי מהיום הראשון של ה-API של Azure: לפעמים azurerm מפגר, ו-azapi משלים את הפער." }
    },
    {
      q: { en: "When would you choose AWS CDK over Terraform for an AWS-only company?", he: "מתי היית בוחר AWS CDK על פני Terraform בחברה שהיא AWS בלבד?" },
      a: { en: "When app teams own their infra and write TypeScript or Python anyway: L2 constructs and grant methods produce correct IAM with far less code, CloudFormation gives automatic rollback, and there is no state backend to run. I would stay on Terraform when we manage many non-AWS providers, need reviewable plan files for compliance, or have stacks that would exceed CloudFormation's 500-resource limit or its slow update times.", he: "כשצוותי האפליקציה מחזיקים את התשתית שלהם וכותבים TypeScript או Python ממילא: constructs ברמת L2 ומתודות grant מייצרים IAM נכון עם הרבה פחות קוד, CloudFormation נותן rollback אוטומטי, ואין backend של state להחזיק. הייתי נשאר על Terraform כשמנהלים הרבה providers שאינם AWS, כשצריך קבצי plan ל-compliance, או כשה-stacks יעברו את מגבלת 500 המשאבים של CloudFormation או את זמני העדכון האיטיים שלו." }
    },
    {
      q: { en: "What happened to CDKTF and what would you do with an existing CDKTF repo?", he: "מה קרה ל-CDKTF ומה היית עושה עם repo קיים שכתוב בו?" },
      a: { en: "HashiCorp deprecated it and archived the repo on 10 December 2025; no fixes or new provider bindings. I would freeze feature work, run cdktf synth --hcl to export to HCL, verify with terraform plan that the exported config shows no changes against the existing state, and then continue on Terraform or OpenTofu. If the team values code-first, Pulumi is the alternative, but that is a bigger migration with a state import.", he: "HashiCorp סימנו אותו deprecated והעבירו את ה-repo ל-archive ב-10 בדצמבר 2025: אין תיקונים ואין bindings חדשים ל-providers. הייתי מקפיא פיתוח פיצ'רים, מריץ cdktf synth --hcl כדי לייצא ל-HCL, מוודא עם terraform plan שהקונפיגורציה המיוצאת לא מראה שינויים מול ה-state הקיים, וממשיך על Terraform או OpenTofu. אם הצוות מעדיף code-first, החלופה היא Pulumi, אבל זו מיגרציה גדולה יותר עם import של state." }
    }
  ],
  quiz: [
    {
      q: { en: "You delete a storage account from main.bicep and redeploy with the default command. What happens?", he: "מחקת storage account מ-main.bicep ועשית deploy מחדש עם הפקודה הרגילה. מה קורה?" },
      options: [
        { en: "It is deleted, like terraform apply", he: "הוא נמחק, כמו ב-terraform apply" },
        { en: "Nothing: Incremental mode leaves it in place", he: "כלום: מצב Incremental משאיר אותו במקום" },
        { en: "The deployment fails with a conflict", he: "ה-deployment נכשל עם conflict" },
        { en: "It is moved to a soft-deleted state for 14 days", he: "הוא עובר ל-soft-delete ל-14 יום" }
      ],
      answer: 1,
      explain: { en: "ARM deployments default to Incremental: resources not in the template are left alone. Deployment stacks with actionOnUnmanage=deleteResources give Terraform-like delete semantics.", he: "Deployments של ARM הם Incremental כברירת מחדל: משאבים שלא ב-template נשארים. Deployment stacks עם actionOnUnmanage=deleteResources נותנים סמנטיקת מחיקה כמו ב-Terraform." }
    },
    {
      q: { en: "Which tool's deployment is automatically rolled back as a unit when one resource fails?", he: "ב-deploy של איזה כלי מתבצע rollback אוטומטי של הכל כיחידה כשמשאב אחד נכשל?" },
      options: [
        { en: "Terraform", he: "Terraform" },
        { en: "Pulumi", he: "Pulumi" },
        { en: "AWS CDK (via CloudFormation)", he: "AWS CDK (דרך CloudFormation)" },
        { en: "Bicep", he: "Bicep" }
      ],
      answer: 2,
      explain: { en: "CloudFormation rolls back the whole stack update. Terraform, Pulumi and ARM leave partially applied resources and record or report progress.", he: "CloudFormation עושה rollback לכל עדכון ה-stack. Terraform, Pulumi ו-ARM משאירים משאבים שהוחלו חלקית ורושמים או מדווחים את ההתקדמות." }
    },
    {
      q: { en: "Why is the Bicep role assignment name built with guid(sa.id, webId.id, roleId)?", he: "למה השם של ה-role assignment ב-Bicep נבנה עם guid(sa.id, webId.id, roleId)?" },
      options: [
        { en: "Role assignment names must be GUIDs, and a deterministic GUID keeps redeploys idempotent", he: "שמות של role assignments חייבים להיות GUID, ו-GUID דטרמיניסטי שומר על deploy חוזר אידמפוטנטי" },
        { en: "To encrypt the assignment", he: "כדי להצפין את ה-assignment" },
        { en: "Because Bicep has no string type", he: "כי ל-Bicep אין טיפוס string" },
        { en: "To make it random each time for security", he: "כדי שיהיה רנדומלי בכל פעם, בשביל אבטחה" }
      ],
      answer: 0,
      explain: { en: "A new random GUID on every run would try to create a second identical assignment and fail with RoleAssignmentExists.", he: "GUID רנדומלי חדש בכל הרצה ינסה ליצור assignment זהה שני וייכשל עם RoleAssignmentExists." }
    },
    {
      q: { en: "What is HashiCorp's recommended exit for a CDKTF project after the December 2025 deprecation?", he: "מה היציאה ש-HashiCorp ממליצים עליה לפרויקט CDKTF אחרי ה-deprecation בדצמבר 2025?" },
      options: [
        { en: "Upgrade to CDKTF 1.0", he: "לשדרג ל-CDKTF 1.0" },
        { en: "Rewrite in Bicep", he: "לכתוב מחדש ב-Bicep" },
        { en: "Export to HCL with cdktf synth --hcl and continue on Terraform", he: "לייצא ל-HCL עם cdktf synth --hcl ולהמשיך על Terraform" },
        { en: "Nothing; it moved to the CNCF", he: "כלום, הוא עבר ל-CNCF" }
      ],
      answer: 2,
      explain: { en: "The repo was archived read-only; the documented path is exporting to HCL. Pulumi is the common code-first alternative.", he: "ה-repo עבר ל-archive לקריאה בלבד; המסלול המתועד הוא ייצוא ל-HCL. Pulumi היא החלופה הנפוצה למי שרוצה code-first." }
    }
  ],
  related: ["cloud-iac", "iac-landscape", "staff-terraform-at-scale", "terraform-production-workflow", "cloud-managed-k8s-compare", "cloud-aws-iam-deep"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "terraform-production-workflow",
  track: "cloud",
  order: 65,
  icon: "🛠️",
  level: 3,
  minutes: 18,
  title: { en: "Terraform in Production: Remote State, PR Plans, Drift and Refactors", he: "Terraform ב-production: remote state, plan ב-PR, drift ו-refactors" },
  tldr: {
    en: "The engineer's daily loop: state in S3 with native locking (use_lockfile), KMS and versioning; one state per env/region/component; pinned modules and providers; plan in the PR, then the exact saved plan applied behind an approval using OIDC roles; policy checks on the plan JSON; a nightly plan -detailed-exitcode for drift; and refactors done with moved/import/removed blocks instead of state surgery.",
    he: "הלולאה היומיומית של המהנדס: state ב-S3 עם locking מובנה (use_lockfile), KMS ו-versioning; state נפרד לכל env, region ו-component; module-ים ו-providers נעולים לגרסה; plan ב-PR, ואז אותו plan שמור בדיוק רץ אחרי אישור עם roles של OIDC; בדיקות policy על ה-JSON של ה-plan; ריצה לילית של plan -detailed-exitcode בשביל drift; ו-refactors עם בלוקים של moved/import/removed במקום ניתוחים ב-state."
  },
  analogy: {
    en: "Terraform state is the land registry for your cloud. You keep it in a fireproof safe (versioned, encrypted S3), only one clerk may write at a time (the lock), every change starts as a printed proposal everyone signs (the saved plan), and once a night an inspector walks the streets comparing houses to the registry (drift detection). Renaming a street is done by filing a moved form, not by tearing pages out with a knife (state rm).",
    he: "ה-state של Terraform הוא הטאבו של הענן שלך. מחזיקים אותו בכספת חסינת אש (S3 מוצפן עם versioning), רק פקיד אחד כותב בכל רגע (ה-lock), כל שינוי מתחיל כהצעה מודפסת שכולם חותמים עליה (ה-plan השמור), ופעם בלילה מפקח עובר ברחובות ומשווה את הבתים לרישום (זיהוי drift). שינוי שם של רחוב עושים עם טופס moved, לא קורעים דפים עם סכין (state rm)."
  },
  sections: [
    {
      h: { en: "The backend: S3 with native locking, KMS and versioning", he: "ה-backend: S3 עם locking מובנה, KMS ו-versioning" },
      body: {
        en: `<pre>terraform {
  required_version = "~&gt; 1.14"
  backend "s3" {
    bucket       = "tfstate-111122223333-eu-west-1"
    key          = "prod/eu-west-1/eks/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    kms_key_id   = "arn:aws:kms:eu-west-1:111122223333:key/0b7c..."
    use_lockfile = true   # lock = prod/eu-west-1/eks/terraform.tfstate.tflock
  }
}</pre>
<p><code>use_lockfile</code> arrived in Terraform 1.10 as experimental and became GA in <strong>1.11</strong>, where the <code>dynamodb_table</code> arguments were deprecated. It relies on S3 conditional writes: the lock is a <code>.tflock</code> object created only if it does not already exist, so two applies cannot both get it. OpenTofu has the same feature. A DynamoDB lock table is now legacy.</p>
<p>The state bucket itself (bootstrapped once with local state, then moved in with <code>terraform init -migrate-state</code>):</p>
<pre>resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }      # your undo button
}
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.state.arn
    }
    bucket_key_enabled = true                             # far fewer KMS calls
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    id     = "old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}</pre>
<p><strong>Migrating off DynamoDB:</strong> set <code>use_lockfile = true</code> <em>next to</em> <code>dynamodb_table</code> (Terraform then takes both locks), run <code>terraform init -reconfigure</code> everywhere, and remove <code>dynamodb_table</code> once every pipeline and laptop uses the new config. The principal needs <code>s3:GetObject</code>, <code>s3:PutObject</code> and <code>s3:DeleteObject</code> on the <code>*.tflock</code> key.</p>
<blockquote>⚠️ Production tip: restore a corrupted state from a previous version, never by hand-editing JSON: <code>aws s3api list-object-versions --prefix prod/eu-west-1/eks/</code>, download the good version, then <code>terraform state push</code>. Push refuses an older serial or a different lineage unless you add <code>-force</code>, which is exactly the safety you want.</blockquote>`,
        he: `<pre>terraform {
  required_version = "~&gt; 1.14"
  backend "s3" {
    bucket       = "tfstate-111122223333-eu-west-1"
    key          = "prod/eu-west-1/eks/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    kms_key_id   = "arn:aws:kms:eu-west-1:111122223333:key/0b7c..."
    use_lockfile = true   # lock = prod/eu-west-1/eks/terraform.tfstate.tflock
  }
}</pre>
<p>האפשרות <code>use_lockfile</code> נכנסה ב-Terraform 1.10 כניסיונית והפכה ל-GA בגרסה <strong>1.11</strong>, ושם הארגומנטים של <code>dynamodb_table</code> סומנו deprecated. היא נשענת על conditional writes של S3: ה-lock הוא אובייקט <code>.tflock</code> שנוצר רק אם הוא עוד לא קיים. כך שני applies לא יכולים לתפוס אותו יחד. ל-OpenTofu יש את אותה יכולת. טבלת lock ב-DynamoDB היא היום legacy.</p>
<p>ה-bucket של ה-state עצמו (נוצר פעם אחת עם state מקומי, ואז עובר פנימה עם <code>terraform init -migrate-state</code>):</p>
<pre>resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }      # your undo button
}
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.state.arn
    }
    bucket_key_enabled = true                             # far fewer KMS calls
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    id     = "old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}</pre>
<p><strong>מעבר מ-DynamoDB:</strong> מגדירים <code>use_lockfile = true</code> <em>לצד</em> <code>dynamodb_table</code> (ואז Terraform לוקח את שני ה-locks), מריצים <code>terraform init -reconfigure</code> בכל מקום, ומסירים את <code>dynamodb_table</code> רק כשכל ה-pipelines והמחשבים עובדים עם הקונפיגורציה החדשה. ה-principal צריך <code>s3:GetObject</code>, <code>s3:PutObject</code> ו-<code>s3:DeleteObject</code> על המפתח של <code>*.tflock</code>.</p>
<blockquote>⚠️ Production tip: state פגום משחזרים מגרסה קודמת, אף פעם לא בעריכת JSON ידנית. מריצים <code>aws s3api list-object-versions --prefix prod/eu-west-1/eks/</code>, מורידים את הגרסה התקינה, ואז <code>terraform state push</code>. ה-push מסרב ל-serial ישן יותר או ל-lineage אחר אלא אם מוסיפים <code>-force</code>, וזו בדיוק ההגנה שאתה רוצה.</blockquote>`
      }
    },
    {
      h: { en: "State layout and pinning: small blast radius, reproducible runs", he: "חלוקת state ונעילת גרסאות: blast radius קטן, הרצות שחוזרות על עצמן" },
      body: {
        en: `<pre>live/
  prod/
    eu-west-1/
      network/     key: prod/eu-west-1/network/terraform.tfstate
      eks/         key: prod/eu-west-1/eks/terraform.tfstate
      data-rds/    key: prod/eu-west-1/data-rds/terraform.tfstate
    global/
      iam/
  staging/
    eu-west-1/ ...
modules/           # or a separate repo, released with git tags</pre>
<p>One state per <strong>env × region × component</strong>. A bad apply to <code>eks</code> cannot touch the database; plans stay fast (each refresh calls the cloud API for every resource); and two teams do not queue on the same lock. Split further when plans take minutes or unrelated teams keep blocking each other. Pass values between states with data sources or SSM parameters rather than <code>terraform_remote_state</code>, which needs read access to the <em>whole</em> other state, secrets included.</p>
<pre># modules: exact pins in prod, bumped by Renovate/Dependabot PRs
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.3.1"
}
module "baseline" {
  source = "git::https://github.com/org/tf-modules.git//baseline?ref=v3.2.1"
}

# providers: constraint in code, exact versions + hashes in the lock file
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 6.20" }
  }
}</pre>
<p>Commit <code>.terraform.lock.hcl</code>. Generate it for every platform your team uses, or a Mac laptop and a Linux runner will disagree on hashes:</p>
<pre>terraform providers lock -platform=linux_amd64 -platform=darwin_arm64 -platform=windows_amd64</pre>`,
        he: `<pre>live/
  prod/
    eu-west-1/
      network/     key: prod/eu-west-1/network/terraform.tfstate
      eks/         key: prod/eu-west-1/eks/terraform.tfstate
      data-rds/    key: prod/eu-west-1/data-rds/terraform.tfstate
    global/
      iam/
  staging/
    eu-west-1/ ...
modules/           # or a separate repo, released with git tags</pre>
<p>State אחד לכל <strong>env × region × component</strong>. Apply גרוע ל-<code>eks</code> לא יכול לגעת בדאטאבייס. ה-plans נשארים מהירים, כי כל refresh קורא ל-API של הענן לכל משאב. ושני צוותים לא עומדים בתור על אותו lock. מפצלים עוד כשה-plan לוקח דקות, או כשצוותים שלא קשורים זה לזה חוסמים אחד את השני. ערכים בין states מעבירים עם data sources או פרמטרים ב-SSM. לא עם <code>terraform_remote_state</code>, שדורש הרשאת קריאה ל-state האחר <em>כולו</em>, כולל הסודות.</p>
<pre># modules: exact pins in prod, bumped by Renovate/Dependabot PRs
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.3.1"
}
module "baseline" {
  source = "git::https://github.com/org/tf-modules.git//baseline?ref=v3.2.1"
}

# providers: constraint in code, exact versions + hashes in the lock file
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 6.20" }
  }
}</pre>
<p>תעשה commit ל-<code>.terraform.lock.hcl</code>. תייצר אותו לכל הפלטפורמות שהצוות משתמש בהן, אחרת Mac של מפתח ו-runner של Linux לא יסכימו על ה-hashes:</p>
<pre>terraform providers lock -platform=linux_amd64 -platform=darwin_arm64 -platform=windows_amd64</pre>`
      }
    },
    {
      h: { en: "Plan in the PR, apply the exact saved plan", he: "Plan ב-PR, ו-apply של אותו plan שמור בדיוק" },
      body: {
        en: `<p>The rule: <strong>what the approver saw is what gets applied</strong>. Re-running <code>terraform apply</code> without a plan file computes a new plan that nobody reviewed. With GitHub Actions + OIDC, the plan job uploads <code>tfplan</code> and the apply job, gated by an environment with required reviewers, downloads and applies that file:</p>
<pre>name: tf-prod-euw1-eks
on:
  pull_request: { paths: ["live/prod/eu-west-1/eks/**"] }
  push: { branches: [main], paths: ["live/prod/eu-west-1/eks/**"] }
permissions: { id-token: write, contents: read, pull-requests: write }
concurrency: { group: tf-prod-euw1-eks, cancel-in-progress: false }
env: { DIR: live/prod/eu-west-1/eks, TF_IN_AUTOMATION: "1" }
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "~1.14.0", terraform_wrapper: false }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/tf-plan    # read-only + state/lock
          aws-region: eu-west-1
      - run: terraform -chdir=$DIR init -input=false
      - run: terraform -chdir=$DIR plan -input=false -lock-timeout=5m -out=tfplan
      - run: terraform -chdir=$DIR show -json tfplan &gt; plan.json &amp;&amp; conftest test plan.json -p policy/
      - uses: actions/upload-artifact@v4
        with: { name: tfplan, path: "\${{ env.DIR }}/tfplan", retention-days: 5 }
  apply:
    if: github.event_name == 'push'
    needs: plan
    environment: prod                     # required reviewers see the plan output first
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "~1.14.0" }
      - uses: aws-actions/configure-aws-credentials@v4
        with: { role-to-assume: "arn:aws:iam::111122223333:role/tf-apply-prod", aws-region: eu-west-1 }
      - uses: actions/download-artifact@v4
        with: { name: tfplan, path: "\${{ env.DIR }}" }
      - run: terraform -chdir=$DIR init -input=false &amp;&amp; terraform -chdir=$DIR apply -input=false tfplan</pre>
<p>Two IAM roles with different trust: <code>tf-plan</code> trusts <code>repo:org/infra:pull_request</code> and <code>repo:org/infra:ref:refs/heads/main</code>; <code>tf-apply-prod</code> trusts only <code>repo:org/infra:environment:prod</code>. If the state changed between plan and apply, Terraform refuses with <em>Saved plan is stale</em>; that is a feature. The plan file contains secret values in clear, so keep artifact retention short and the repo private.</p>
<table>
<tr><th></th><th>GitHub Actions (DIY)</th><th>Atlantis</th><th>HCP Terraform</th></tr>
<tr><td>Where it runs</td><td>Your runners</td><td>Self-hosted server reacting to PR comments</td><td>HashiCorp-hosted or agents in your VPC</td></tr>
<tr><td>Apply timing</td><td>After merge, behind environment approval</td><td>Before merge: <code>atlantis apply</code> on an approved PR, then merge (main always reflects reality)</td><td>VCS-driven run on merge, or CLI-driven</td></tr>
<tr><td>Locking</td><td>State lock + <code>concurrency</code> group</td><td>Directory lock per PR</td><td>Workspace queue</td></tr>
<tr><td>Policy</td><td>conftest/Checkov steps</td><td>Built-in conftest policy checks</td><td>Sentinel or OPA policy sets, run tasks</td></tr>
</table>`,
        he: `<p>הכלל: <strong>מה שהמאשר ראה הוא מה שרץ</strong>. הרצה של <code>terraform apply</code> בלי קובץ plan מחשבת plan חדש שאף אחד לא בדק. עם GitHub Actions ו-OIDC, ה-job של ה-plan מעלה את <code>tfplan</code>. ה-job של ה-apply מוגן ע"י environment עם required reviewers, והוא מוריד את אותו קובץ ומריץ אותו:</p>
<pre>name: tf-prod-euw1-eks
on:
  pull_request: { paths: ["live/prod/eu-west-1/eks/**"] }
  push: { branches: [main], paths: ["live/prod/eu-west-1/eks/**"] }
permissions: { id-token: write, contents: read, pull-requests: write }
concurrency: { group: tf-prod-euw1-eks, cancel-in-progress: false }
env: { DIR: live/prod/eu-west-1/eks, TF_IN_AUTOMATION: "1" }
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "~1.14.0", terraform_wrapper: false }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/tf-plan    # read-only + state/lock
          aws-region: eu-west-1
      - run: terraform -chdir=$DIR init -input=false
      - run: terraform -chdir=$DIR plan -input=false -lock-timeout=5m -out=tfplan
      - run: terraform -chdir=$DIR show -json tfplan &gt; plan.json &amp;&amp; conftest test plan.json -p policy/
      - uses: actions/upload-artifact@v4
        with: { name: tfplan, path: "\${{ env.DIR }}/tfplan", retention-days: 5 }
  apply:
    if: github.event_name == 'push'
    needs: plan
    environment: prod                     # required reviewers see the plan output first
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "~1.14.0" }
      - uses: aws-actions/configure-aws-credentials@v4
        with: { role-to-assume: "arn:aws:iam::111122223333:role/tf-apply-prod", aws-region: eu-west-1 }
      - uses: actions/download-artifact@v4
        with: { name: tfplan, path: "\${{ env.DIR }}" }
      - run: terraform -chdir=$DIR init -input=false &amp;&amp; terraform -chdir=$DIR apply -input=false tfplan</pre>
<p>שני IAM roles עם trust שונה. ה-role בשם <code>tf-plan</code> סומך על <code>repo:org/infra:pull_request</code> ועל <code>repo:org/infra:ref:refs/heads/main</code>. ה-role בשם <code>tf-apply-prod</code> סומך רק על <code>repo:org/infra:environment:prod</code>. אם ה-state השתנה בין ה-plan ל-apply, Terraform מסרב עם השגיאה <em>Saved plan is stale</em>, וזה פיצ'ר. בקובץ ה-plan יש ערכים סודיים בטקסט גלוי, אז תשמור retention קצר ל-artifact ו-repo פרטי.</p>
<table>
<tr><th></th><th>GitHub Actions (DIY)</th><th>Atlantis</th><th>HCP Terraform</th></tr>
<tr><td>איפה זה רץ</td><td>ה-runners שלך</td><td>שרת self-hosted שמגיב להערות ב-PR</td><td>אצל HashiCorp, או agents ב-VPC שלך</td></tr>
<tr><td>מתי ה-apply</td><td>אחרי merge, מאחורי אישור של environment</td><td>לפני merge: <code>atlantis apply</code> על PR מאושר ואז merge (ה-main תמיד משקף את המציאות)</td><td>Run שמופעל מ-VCS ב-merge, או מה-CLI</td></tr>
<tr><td>Locking</td><td>State lock + קבוצת <code>concurrency</code></td><td>נעילת תיקייה לכל PR</td><td>תור של workspace</td></tr>
<tr><td>Policy</td><td>שלבים של conftest/Checkov</td><td>בדיקות conftest מובנות</td><td>Sentinel או OPA policy sets, run tasks</td></tr>
</table>`
      }
    },
    {
      h: { en: "Policy as code on the plan", he: "Policy as code על ה-plan" },
      body: {
        en: `<p>Static scanners read your <code>.tf</code> files; plan-based checks read <code>terraform show -json</code>, where module internals and computed values are resolved. Use both: static in the PR's first seconds, plan-based before apply.</p>
<pre># policy/terraform.rego  (conftest, Rego v1 syntax)
package main
import rego.v1

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type in {"aws_db_instance", "aws_s3_bucket", "aws_kms_key"}
  "delete" in rc.change.actions
  msg := sprintf("%s would be destroyed; needs the break-glass label", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type == "aws_vpc_security_group_ingress_rule"
  rc.change.after.cidr_ipv4 == "0.0.0.0/0"
  rc.change.after.from_port == 22
  msg := sprintf("%s opens SSH to the internet", [rc.address])
}</pre>
<pre>conftest test plan.json -p policy/                         # your org rules (Rego)
checkov -f plan.json --framework terraform_plan            # built-in checks on the plan
trivy config --severity HIGH,CRITICAL live/prod/            # tfsec's engine now lives in Trivy</pre>
<p>On HCP Terraform you get <strong>Sentinel</strong> (HashiCorp's policy language, with advisory/soft-mandatory/hard-mandatory levels) or OPA policy sets. A replace (<code>["delete","create"]</code>) is also a delete; catch it, because "change the subnet of the RDS instance" can mean a new empty database.</p>`,
        he: `<p>סורקים סטטיים קוראים את קבצי ה-<code>.tf</code>. בדיקות מבוססות plan קוראות את הפלט של <code>terraform show -json</code>, שבו הפנים של ה-module-ים והערכים המחושבים כבר פתורים. תשתמש בשניהם: סטטי בשניות הראשונות של ה-PR, ומבוסס plan לפני ה-apply.</p>
<pre># policy/terraform.rego  (conftest, Rego v1 syntax)
package main
import rego.v1

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type in {"aws_db_instance", "aws_s3_bucket", "aws_kms_key"}
  "delete" in rc.change.actions
  msg := sprintf("%s would be destroyed; needs the break-glass label", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type == "aws_vpc_security_group_ingress_rule"
  rc.change.after.cidr_ipv4 == "0.0.0.0/0"
  rc.change.after.from_port == 22
  msg := sprintf("%s opens SSH to the internet", [rc.address])
}</pre>
<pre>conftest test plan.json -p policy/                         # your org rules (Rego)
checkov -f plan.json --framework terraform_plan            # built-in checks on the plan
trivy config --severity HIGH,CRITICAL live/prod/            # tfsec's engine now lives in Trivy</pre>
<p>ב-HCP Terraform מקבלים <strong>Sentinel</strong> (שפת ה-policy של HashiCorp, עם רמות advisory, soft-mandatory ו-hard-mandatory) או OPA policy sets. גם replace (<code>["delete","create"]</code>) הוא מחיקה, ותתפוס אותו. "לשנות את ה-subnet של ה-RDS" יכול להיגמר בדאטאבייס חדש וריק.</p>`
      }
    },
    {
      h: { en: "Drift detection and refactoring without state surgery", he: "זיהוי drift ו-refactoring בלי ניתוחים ב-state" },
      body: {
        en: `<p><code>terraform plan -detailed-exitcode</code> returns <strong>0</strong> = no changes, <strong>1</strong> = error, <strong>2</strong> = changes present. A scheduled job on <code>main</code> turns that into a drift alert:</p>
<pre>on: { schedule: [ { cron: "0 5 * * 1-5" } ] }
...
      - id: drift
        run: |
          set +e
          terraform -chdir=$DIR plan -detailed-exitcode -lock=false -input=false -refresh-only &gt; drift.txt
          code=$?
          [ $code -eq 1 ] &amp;&amp; exit 1
          [ $code -eq 2 ] &amp;&amp; echo "drift=true" &gt;&gt; "$GITHUB_OUTPUT"
          exit 0</pre>
<p><code>-refresh-only</code> isolates out-of-band changes (someone clicked in the console) from unapplied code. <code>-lock=false</code> keeps the read-only scan from blocking real applies.</p>
<p><strong>Refactor with blocks, not CLI.</strong> Blocks go through review, run in the pipeline, and also work for everyone who consumes your module:</p>
<pre>moved {                                   # 1.1+: rename or move into a module, no destroy
  from = aws_s3_bucket.logs
  to   = module.logging.aws_s3_bucket.this
}

import {                                  # 1.5+; for_each in import since 1.7
  for_each = var.legacy_buckets           # { reports = "legacy-reports-2019", ... }
  to       = aws_s3_bucket.legacy[each.key]
  id       = each.value
}

removed {                                 # 1.7+: stop managing, keep the resource
  from = aws_db_instance.old_reporting
  lifecycle { destroy = false }
}</pre>
<p><code>terraform plan -generate-config-out=generated.tf</code> writes HCL for import targets that have no resource block yet. The CLI (<code>terraform state mv</code>, <code>state rm</code>) is the emergency path: run <code>terraform state pull &gt; backup.tfstate</code> first, and do it while nobody else can apply.</p>
<p><strong>count vs for_each:</strong> with <code>count</code> over <code>["a","b","c"]</code>, removing <code>"a"</code> shifts <code>[1]</code>→<code>[0]</code> and Terraform updates or recreates two resources you did not touch. <code>for_each</code> over a map or set keys each instance by a stable string. Keys must be known at plan time: <em>"The for_each value depends on resource attributes that cannot be determined until apply"</em> means you keyed on something like a generated ID; key on names you control.</p>`,
        he: `<p>הפקודה <code>terraform plan -detailed-exitcode</code> מחזירה <strong>0</strong> כשאין שינויים, <strong>1</strong> בשגיאה, ו-<strong>2</strong> כשיש שינויים. Job מתוזמן על <code>main</code> הופך את זה להתראת drift:</p>
<pre>on: { schedule: [ { cron: "0 5 * * 1-5" } ] }
...
      - id: drift
        run: |
          set +e
          terraform -chdir=$DIR plan -detailed-exitcode -lock=false -input=false -refresh-only &gt; drift.txt
          code=$?
          [ $code -eq 1 ] &amp;&amp; exit 1
          [ $code -eq 2 ] &amp;&amp; echo "drift=true" &gt;&gt; "$GITHUB_OUTPUT"
          exit 0</pre>
<p>הדגל <code>-refresh-only</code> מפריד בין שינויים מבחוץ (מישהו לחץ ב-console) לבין קוד שעוד לא הוחל. הדגל <code>-lock=false</code> מונע מהסריקה, שרק קוראת, לחסום applies אמיתיים.</p>
<p><strong>Refactor עושים עם בלוקים, לא עם ה-CLI.</strong> בלוקים עוברים review, רצים ב-pipeline, ועובדים גם לכל מי שצורך את ה-module שלך:</p>
<pre>moved {                                   # 1.1+: rename or move into a module, no destroy
  from = aws_s3_bucket.logs
  to   = module.logging.aws_s3_bucket.this
}

import {                                  # 1.5+; for_each in import since 1.7
  for_each = var.legacy_buckets           # { reports = "legacy-reports-2019", ... }
  to       = aws_s3_bucket.legacy[each.key]
  id       = each.value
}

removed {                                 # 1.7+: stop managing, keep the resource
  from = aws_db_instance.old_reporting
  lifecycle { destroy = false }
}</pre>
<p>הפקודה <code>terraform plan -generate-config-out=generated.tf</code> כותבת HCL ליעדי import שעוד אין להם בלוק resource. ה-CLI (<code>terraform state mv</code>, <code>state rm</code>) הוא מסלול החירום: קודם מריצים <code>terraform state pull &gt; backup.tfstate</code>, ועושים את זה כשאף אחד אחר לא יכול להריץ apply.</p>
<p><strong>count מול for_each:</strong> עם <code>count</code> על <code>["a","b","c"]</code>, הסרה של <code>"a"</code> מזיזה את <code>[1]</code> ל-<code>[0]</code>, ו-Terraform מעדכן או יוצר מחדש שני משאבים שלא נגעת בהם. עם <code>for_each</code> על map או set, כל instance מזוהה במחרוזת יציבה. המפתחות חייבים להיות ידועים בזמן ה-plan. השגיאה <em>"The for_each value depends on resource attributes that cannot be determined until apply"</em> אומרת שבנית מפתח על משהו כמו ID שנוצר בזמן ריצה. תבנה מפתחות על שמות שאתה שולט בהם.</p>`
      }
    },
    {
      h: { en: "Provider upgrades, and Terragrunt in brief", he: "שדרוג providers, ו-Terragrunt בקצרה" },
      body: {
        en: `<p><strong>Provider majors</strong> are breaking by definition. AWS provider 6.0 (2025), for example, added a per-resource <code>region</code> argument so one provider block can manage several regions without aliases, and removed long-deprecated arguments. The safe loop: read the upgrade guide → bump the constraint in <em>one</em> state → <code>terraform init -upgrade</code> → the plan must be a no-op (or only expected changes) → roll env by env with the lock file committed each time. Terraform core versions: pin <code>required_version</code> and use the same version in CI and on laptops (mise/tfenv), because a newer CLI may upgrade the state format.</p>
<p><strong>Terragrunt</strong> is a thin wrapper that removes repetition across many small states: one root file generates the backend block per directory, <code>dependency</code> blocks pass outputs between states (with <code>mock_outputs</code> for plans), and <code>terragrunt run --all plan</code> walks the tree in dependency order (older versions spelled it <code>run-all</code>).</p>
<pre># root.hcl
remote_state {
  backend  = "s3"
  generate = { path = "backend.tf", if_exists = "overwrite" }
  config = {
    bucket       = "tfstate-111122223333-eu-west-1"
    key          = "\${path_relative_to_include()}/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}</pre>
<p>Trade-offs: another tool and another version to pin, and <code>run --all apply</code> is a giant blast radius; keep it for plans and use per-directory applies in prod. OpenTofu narrowed the gap natively with early variable evaluation (variables in backend and module source) and client-side state encryption.</p>`,
        he: `<p><strong>Major של provider</strong> שובר דברים מעצם הגדרתו. למשל, AWS provider 6.0 (2025) הוסיף ארגומנט <code>region</code> לכל משאב, כך שבלוק provider אחד מנהל כמה regions בלי aliases. הוא גם הסיר ארגומנטים שהיו deprecated הרבה זמן. הלולאה הבטוחה: קוראים את ה-upgrade guide, מעלים את ה-constraint ב-state <em>אחד</em>, מריצים <code>terraform init -upgrade</code>, וה-plan חייב לצאת ריק (או רק עם שינויים צפויים). אחר כך מתקדמים env אחרי env, עם commit של ה-lock file בכל פעם. לגבי גרסת Terraform עצמה: תנעל את <code>required_version</code> ותשתמש באותה גרסה ב-CI ובמחשבים (mise או tfenv), כי CLI חדש יותר עלול לשדרג את פורמט ה-state.</p>
<p><strong>Terragrunt</strong> הוא wrapper דק שמוריד חזרתיות בין הרבה states קטנים. קובץ root אחד מייצר את בלוק ה-backend לכל תיקייה. בלוקים של <code>dependency</code> מעבירים outputs בין states (עם <code>mock_outputs</code> בשביל plans). והפקודה <code>terragrunt run --all plan</code> עוברת על העץ לפי סדר התלויות (בגרסאות ישנות קראו לזה <code>run-all</code>).</p>
<pre># root.hcl
remote_state {
  backend  = "s3"
  generate = { path = "backend.tf", if_exists = "overwrite" }
  config = {
    bucket       = "tfstate-111122223333-eu-west-1"
    key          = "\${path_relative_to_include()}/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}</pre>
<p>המחיר: עוד כלי ועוד גרסה לנעול. ו-<code>run --all apply</code> הוא blast radius ענק. תשאיר אותו ל-plans, וב-prod תריץ apply לכל תיקייה בנפרד. OpenTofu צמצם את הפער בעצמו עם early variable evaluation (משתנים ב-backend וב-source של module) ועם הצפנת state בצד הלקוח.</p>`
      }
    }
  ],
  diagram: "PR opened -> fmt/validate/tflint/trivy -> plan -out=tfplan (role tf-plan) -> show -json | conftest -> comment plan\nmerge -> plan -out=tfplan -> [env 'prod' approval] -> apply tfplan (role tf-apply-prod)\nnightly -> plan -refresh-only -detailed-exitcode -> exit 2 => drift alert\nstate: s3://tfstate/<env>/<region>/<component>/terraform.tfstate  (+ .tflock, KMS, versioning)",
  handsOn: [
    { cmd: "terraform init -reconfigure && terraform plan -lock-timeout=5m -out=tfplan", what: { en: "Re-initialise after switching the backend to use_lockfile, then plan while waiting up to 5 minutes for a held lock. Watch for a .tflock object appearing next to the state key during the plan.", he: "אתחול מחדש אחרי שהעברת את ה-backend ל-use_lockfile, ואז plan שמחכה עד 5 דקות ל-lock תפוס. תסתכל איך אובייקט .tflock מופיע ליד מפתח ה-state בזמן ה-plan." } },
    { cmd: "terraform plan -detailed-exitcode -refresh-only; echo \"exit=$?\"", what: { en: "Drift check: 0 means reality matches state, 2 means something changed outside Terraform, 1 is an error.", he: "בדיקת drift: 0 אומר שהמציאות תואמת ל-state, 2 אומר שמשהו השתנה מחוץ ל-Terraform, ו-1 זו שגיאה." } },
    { cmd: "terraform show -json tfplan | jq -r '.resource_changes[] | select(.change.actions | index(\"delete\")) | .address'", what: { en: "List every address the plan will destroy, including replacements. Make this a required review step.", he: "מציג כל כתובת שה-plan עומד למחוק, כולל replacements. תהפוך את זה לשלב review חובה." } },
    { cmd: "terraform plan -generate-config-out=generated.tf", what: { en: "With import blocks in place, let Terraform write the resource HCL for you; clean it up, then plan again until it shows only imports.", he: "כשבלוקי import במקום, Terraform כותב בשבילך את ה-HCL של המשאבים. תנקה אותו ותריץ plan שוב עד שמופיעים רק imports." } },
    { cmd: "terraform providers lock -platform=linux_amd64 -platform=darwin_arm64", what: { en: "Record provider hashes for CI and Mac laptops in .terraform.lock.hcl so init never fails with a checksum mismatch.", he: "רושם hashes של providers ל-CI ול-Mac ב-.terraform.lock.hcl, כדי ש-init לא ייכשל על checksum mismatch." } }
  ],
  mnemonic: {
    en: "LOCK, PIN, PLAN, PROVE, PATROL, MOVE: native lock in S3, pin modules and providers, apply the saved plan, prove it with policy, patrol for drift nightly, move with blocks not knives.",
    he: "נעל, קבע, תכנן, הוכח, סייר, הזז: lock מובנה ב-S3, נעילת גרסאות, apply ל-plan השמור, הוכחה עם policy, סיור drift לילי, והזזה עם בלוקים ולא עם סכין."
  },
  pitfalls: [
    { en: "Running apply without the saved plan file in CI. Terraform computes a fresh plan nobody reviewed; if a teammate merged in between, you apply their change unreviewed.", he: "להריץ apply ב-CI בלי קובץ ה-plan השמור. Terraform מחשב plan חדש שאף אחד לא בדק, ואם חבר צוות עשה merge בינתיים, אתה מחיל את השינוי שלו בלי review." },
    { en: "Giving the PR plan role write access to everything. PR code is attacker-controllable (an external data source or a malicious provider can run commands during plan); the plan role should be read-only plus state and lock access.", he: "לתת ל-role של ה-plan ב-PR הרשאות כתיבה להכל. קוד ב-PR יכול להיות בשליטת תוקף (external data source או provider זדוני מריצים פקודות כבר בזמן plan). ה-role של ה-plan צריך להיות read-only, ועוד גישה ל-state ול-lock." },
    { en: "Using count for things identified by name. Removing one item from the middle of the list renumbers the rest and recreates them; use for_each with stable keys.", he: "להשתמש ב-count לדברים שמזוהים בשם. הסרת פריט אחד מאמצע הרשימה ממספרת מחדש את השאר ויוצרת אותם מחדש. תשתמש ב-for_each עם מפתחות יציבים." },
    { en: "Doing terraform state rm to 'fix' a plan and forgetting the resource still exists. The next run tries to create it again and fails on a name conflict, or creates a duplicate that costs money; prefer removed blocks with destroy = false.", he: "להריץ terraform state rm כדי 'לתקן' plan ולשכוח שהמשאב עדיין קיים. ההרצה הבאה תנסה ליצור אותו שוב ותיכשל על התנגשות שמות, או תיצור כפיל שעולה כסף. עדיף בלוק removed עם destroy = false." }
  ],
  interview: [
    {
      q: { en: "Walk me through how a Terraform change gets to production in your pipeline.", he: "תסביר לי איך שינוי ב-Terraform מגיע ל-production ב-pipeline שלך." },
      a: { en: "PR touches one state directory. CI runs fmt, validate, tflint and Trivy, then plan with a read-only OIDC role and posts the plan to the PR; conftest checks the plan JSON for deletes of stateful resources and open ingress. After review and merge, the pipeline plans again on main, uploads the plan as an artifact, waits on the prod environment's required reviewers, then applies that exact file with an apply role whose trust policy only allows the prod environment subject. A stale plan fails safely. A nightly refresh-only plan with -detailed-exitcode alerts on drift.", he: "ה-PR נוגע בתיקיית state אחת. ה-CI מריץ fmt, validate, tflint ו-Trivy, ואחר כך plan עם role של OIDC שהוא read-only, ומפרסם את ה-plan ב-PR. conftest בודק את ה-JSON של ה-plan: מחיקות של משאבים עם state ו-ingress פתוח. אחרי review ו-merge, ה-pipeline מריץ plan שוב על main, מעלה אותו כ-artifact, ומחכה ל-required reviewers של environment ה-prod. אז הוא מריץ apply על אותו קובץ בדיוק, עם role שה-trust policy שלו מאשר רק את ה-subject של environment ה-prod. plan שהתיישן נכשל בצורה בטוחה. ובלילה, plan במצב refresh-only עם -detailed-exitcode מתריע על drift." }
    },
    {
      q: { en: "You need to move 40 resources from the root module into a new child module. How do you do it without downtime?", he: "צריך להעביר 40 משאבים מה-root module ל-child module חדש. איך עושים את זה בלי downtime?" },
      a: { en: "Add moved blocks from each old address to the new module address in the same PR as the code move. The plan must show only moves and zero creates or destroys; I make that a policy check. Moved blocks stay in the code for a few releases so other environments and module consumers pick them up. No state mv by hand, because that is invisible to review and has to be repeated per environment.", he: "מוסיפים בלוקים של moved מכל כתובת ישנה לכתובת החדשה ב-module, באותו PR שמזיז את הקוד. ה-plan חייב להראות רק moves, ואפס creates או destroys, ואני הופך את זה לבדיקת policy. בלוקי ה-moved נשארים בקוד כמה releases, כדי שסביבות אחרות וצרכני ה-module יקלטו אותם. בלי state mv ידני, כי הוא לא נראה ב-review וצריך לחזור עליו בכל סביבה." }
    },
    {
      q: { en: "Why is DynamoDB state locking considered legacy now, and how do you migrate?", he: "למה locking של state עם DynamoDB נחשב היום legacy, ואיך עוברים?" },
      a: { en: "Since Terraform 1.11 the S3 backend's use_lockfile is GA and the DynamoDB arguments are deprecated; S3 conditional writes make a .tflock object an atomic lock, so one less resource and IAM surface. Migrate by enabling use_lockfile alongside dynamodb_table (both locks are taken), re-init every consumer, then drop dynamodb_table and later delete the table.", he: "מאז Terraform 1.11 האפשרות use_lockfile ב-backend של S3 היא GA, והארגומנטים של DynamoDB סומנו deprecated. ה-conditional writes של S3 הופכים אובייקט .tflock ל-lock אטומי, אז יש משאב אחד פחות ומשטח IAM קטן יותר. עוברים כך: מפעילים use_lockfile לצד dynamodb_table (שני ה-locks נלקחים), מריצים init מחדש אצל כל הצרכנים, מסירים את dynamodb_table, ובהמשך מוחקים את הטבלה." }
    }
  ],
  quiz: [
    {
      q: { en: "terraform plan -detailed-exitcode returns 2. What does it mean?", he: "הפקודה terraform plan -detailed-exitcode מחזירה 2. מה זה אומר?" },
      options: [
        { en: "An error occurred", he: "קרתה שגיאה" },
        { en: "The plan succeeded and there are changes", he: "ה-plan הצליח ויש שינויים" },
        { en: "The state is locked", he: "ה-state נעול" },
        { en: "Two resources will be destroyed", he: "שני משאבים יימחקו" }
      ],
      answer: 1,
      explain: { en: "0 = no changes, 1 = error, 2 = success with a non-empty diff. That is the signal drift jobs use.", he: "0 = אין שינויים, 1 = שגיאה, 2 = הצלחה עם diff לא ריק. זה הסימן שבו משתמשים ה-jobs של ה-drift." }
    },
    {
      q: { en: "Which Terraform version made S3-native locking (use_lockfile) generally available?", he: "באיזו גרסה של Terraform ה-locking המובנה ב-S3 (use_lockfile) הפך ל-GA?" },
      options: [
        { en: "1.5", he: "1.5" },
        { en: "1.7", he: "1.7" },
        { en: "1.11", he: "1.11" },
        { en: "It is still experimental", he: "הוא עדיין ניסיוני" }
      ],
      answer: 2,
      explain: { en: "Experimental in 1.10, GA in 1.11 along with the deprecation of the DynamoDB arguments.", he: "ניסיוני ב-1.10, ו-GA ב-1.11 יחד עם ה-deprecation של הארגומנטים של DynamoDB." }
    },
    {
      q: { en: "You want Terraform to stop managing an RDS instance but keep it running. What is the reviewable way?", he: "אתה רוצה ש-Terraform יפסיק לנהל instance של RDS אבל ישאיר אותו רץ. מה הדרך שעוברת review?" },
      options: [
        { en: "Delete the resource block", he: "למחוק את בלוק ה-resource" },
        { en: "A removed block with lifecycle { destroy = false }", he: "בלוק removed עם lifecycle { destroy = false }" },
        { en: "A moved block to null", he: "בלוק moved ל-null" },
        { en: "terraform taint", he: "terraform taint" }
      ],
      answer: 1,
      explain: { en: "Deleting the block plans a destroy. removed with destroy = false (1.7+) drops it from state through a normal PR; state rm does the same invisibly.", he: "מחיקת הבלוק מתכננת destroy. בלוק removed עם destroy = false (מגרסה 1.7) מוציא אותו מה-state דרך PR רגיל. state rm עושה אותו דבר, אבל בלי שאף אחד רואה." }
    },
    {
      q: { en: "Why should the PR plan job use a different IAM role from the apply job?", he: "למה ה-job של ה-plan ב-PR צריך IAM role שונה מה-job של ה-apply?" },
      options: [
        { en: "Plan is slower with admin rights", he: "Plan איטי יותר עם הרשאות admin" },
        { en: "Terraform refuses to plan and apply with the same role", he: "Terraform מסרב להריץ plan ו-apply עם אותו role" },
        { en: "Unreviewed PR code runs during plan, so that role must not be able to change infrastructure", he: "קוד PR שלא עבר review רץ בזמן ה-plan, אז ה-role הזה לא אמור להיות מסוגל לשנות תשתית" },
        { en: "To save on STS costs", he: "כדי לחסוך בעלויות STS" }
      ],
      answer: 2,
      explain: { en: "Providers and data sources execute during plan. Restrict the plan role to read plus state/lock, and trust the apply role only for the protected environment's OIDC subject.", he: "Providers ו-data sources רצים כבר בזמן ה-plan. תגביל את ה-role של ה-plan לקריאה ועוד state ו-lock, ותגדיר שה-role של ה-apply סומך רק על ה-subject של ה-OIDC של ה-environment המוגן." }
    }
  ],
  related: ["staff-terraform-at-scale", "cloud-iac", "iac-landscape", "iac-side-by-side", "cicd-github-actions", "cloud-aws-iam-deep"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cicd-aws-eks-pipeline",
  track: "cloud",
  order: 66,
  icon: "🚚",
  level: 3,
  minutes: 18,
  title: { en: "CI/CD to EKS End to End: GitHub Actions, ECR and GitOps", he: "CI/CD ל-EKS מקצה לקצה: GitHub Actions, ECR ו-GitOps" },
  tldr: {
    en: "Build once, identify the image by its digest forever: PR checks → buildx with cache → push to an immutable ECR repo → scan → cosign signature + SBOM, all with a short-lived OIDC role whose trust policy pins the exact repo and branch. CI then commits the digest to a GitOps repo; Argo CD syncs, Argo Rollouts canaries with Prometheus analysis, and promotion to staging and prod is a Git change that copies the same digest, never a rebuild.",
    he: "בונים פעם אחת, ומזהים את ה-image לפי ה-digest שלו לתמיד: בדיקות PR, אחר כך buildx עם cache, push ל-repo של ECR עם tags שאי אפשר לשנות, סריקה, חתימה עם cosign ו-SBOM. הכל עם role קצר-חיים של OIDC, שה-trust policy שלו נועל את ה-repo וה-branch המדויקים. אחר כך ה-CI עושה commit של ה-digest ל-repo של GitOps. Argo CD מסנכרן, Argo Rollouts מריץ canary עם analysis מול Prometheus, וקידום ל-staging ול-prod הוא שינוי ב-Git שמעתיק את אותו digest. אף פעם לא build מחדש."
  },
  analogy: {
    en: "A pharmaceutical batch. It is produced once, gets a serial number nobody can reprint (the digest), passes lab tests (scan), gets a tamper-proof seal from a licensed factory (cosign with the workflow's identity) and an ingredients list (SBOM). Pharmacies do not remanufacture it; they order that serial number (promotion by digest), and a small first shipment goes to a few stores before the national rollout (canary).",
    he: "אצווה של תרופה. היא מיוצרת פעם אחת, מקבלת מספר סידורי שאי אפשר להדפיס מחדש (ה-digest), עוברת בדיקות מעבדה (סריקה), מקבלת חותם שאי אפשר לזייף ממפעל מורשה (cosign עם ה-identity של ה-workflow), ורשימת רכיבים (SBOM). בתי מרקחת לא מייצרים אותה מחדש. הם מזמינים את המספר הסידורי הזה (קידום לפי digest), ומשלוח ראשון וקטן יוצא לכמה סניפים לפני ההפצה הארצית (canary)."
  },
  sections: [
    {
      h: { en: "The path, and what runs on the PR", he: "המסלול, ומה רץ על ה-PR" },
      body: {
        en: `<p>Two repos, two loops. The <strong>app repo</strong> produces a signed image and says "this digest is ready". The <strong>GitOps repo</strong> says "this digest runs in this env", and Argo CD makes the cluster match it. CI never holds cluster credentials; it only needs ECR push rights and write access to one GitOps path.</p>
<p>PR checks (on <code>pull_request</code>, never <code>pull_request_target</code> for untrusted forks) must be fast and must not push anything:</p>
<pre>jobs:
  pr:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - run: make lint test                                  # unit tests, linters
      - run: hadolint Dockerfile
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with: { push: false, load: true, tags: "web:pr", cache-from: "type=gha" }
      - run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed web:pr
      - run: helm template chart/ -f chart/values-prod.yaml | kubeconform -strict -summary</pre>
<p>Mark them as <em>required status checks</em> in the branch ruleset so nothing merges red.</p>`,
        he: `<p>שני repos, שתי לולאות. ה-<strong>repo של האפליקציה</strong> מייצר image חתום ואומר "ה-digest הזה מוכן". ה-<strong>repo של GitOps</strong> אומר "ה-digest הזה רץ בסביבה הזו", ו-Argo CD דואג שה-cluster יתאים לזה. ל-CI אין אף פעם credentials ל-cluster. הוא צריך רק הרשאת push ל-ECR והרשאת כתיבה לנתיב אחד ב-repo של GitOps.</p>
<p>בדיקות ה-PR (על <code>pull_request</code>, ואף פעם לא <code>pull_request_target</code> בשביל forks לא מוכרים) חייבות להיות מהירות, ואסור להן לעשות push לשום דבר:</p>
<pre>jobs:
  pr:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - run: make lint test                                  # unit tests, linters
      - run: hadolint Dockerfile
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with: { push: false, load: true, tags: "web:pr", cache-from: "type=gha" }
      - run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed web:pr
      - run: helm template chart/ -f chart/values-prod.yaml | kubeconform -strict -summary</pre>
<p>תסמן אותן כ-<em>required status checks</em> ב-ruleset של ה-branch, כדי ששום דבר אדום לא ייכנס ל-main.</p>`
      }
    },
    {
      h: { en: "Build, push by digest, scan, sign, SBOM", he: "Build, push לפי digest, סריקה, חתימה ו-SBOM" },
      body: {
        en: `<pre>name: release
on: { push: { branches: [main] } }
permissions: { contents: read, id-token: write }
env:
  IMAGE: 111122223333.dkr.ecr.eu-west-1.amazonaws.com/shop/web
jobs:
  build:
    runs-on: ubuntu-latest
    outputs: { digest: "\${{ steps.build.outputs.digest }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4       # pin third-party actions by SHA in real life
        with: { role-to-assume: "arn:aws:iam::111122223333:role/gha-shop-web-ecr", aws-region: eu-west-1 }
      - uses: aws-actions/amazon-ecr-login@v2
      - uses: docker/setup-buildx-action@v3
      - id: build
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: "\${{ env.IMAGE }}:\${{ github.sha }}"         # immutable, traceable to a commit
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: mode=max                                # SLSA provenance attestation
          sbom: true                                          # BuildKit SBOM attestation
      - run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed "$IMAGE@\${{ steps.build.outputs.digest }}"
      - uses: sigstore/cosign-installer@v3
      - run: |
          cosign sign --yes "$IMAGE@\${{ steps.build.outputs.digest }}"     # keyless: Fulcio cert from the OIDC token
          syft "$IMAGE@\${{ steps.build.outputs.digest }}" -o spdx-json &gt; sbom.spdx.json
          cosign attest --yes --type spdxjson --predicate sbom.spdx.json "$IMAGE@\${{ steps.build.outputs.digest }}"</pre>
<p>Key details: <code>cache-to: type=gha,mode=max</code> caches every layer of multi-stage builds (a warm rebuild of a Node or Go service typically drops from minutes to well under one); everything after the build refers to <code>@sha256:...</code>, never the tag. Keyless cosign needs <code>id-token: write</code>: the signature certificate records the workflow, repo and ref, which is what admission policy later checks.</p>
<pre>resource "aws_ecr_repository" "web" {
  name                 = "shop/web"
  image_tag_mutability = "IMMUTABLE"          # a pushed tag can never point elsewhere
  encryption_configuration { encryption_type = "KMS" }
}

resource "aws_ecr_registry_scanning_configuration" "this" {
  scan_type = "ENHANCED"                      # Amazon Inspector: OS + language packages
  rule {
    scan_frequency = "CONTINUOUS_SCAN"        # re-scans when new CVEs are published
    repository_filter {
      filter      = "shop/*"
      filter_type = "WILDCARD"
    }
  }
}</pre>
<p>Basic ECR scanning only scans on push; <strong>enhanced scanning</strong> (Inspector, billed per image scanned) keeps rescanning images already running, which is what you need for "is anything in prod affected by the CVE published this morning?". Add a lifecycle policy to expire untagged images and old builds, or ECR storage grows forever.</p>`,
        he: `<pre>name: release
on: { push: { branches: [main] } }
permissions: { contents: read, id-token: write }
env:
  IMAGE: 111122223333.dkr.ecr.eu-west-1.amazonaws.com/shop/web
jobs:
  build:
    runs-on: ubuntu-latest
    outputs: { digest: "\${{ steps.build.outputs.digest }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4       # pin third-party actions by SHA in real life
        with: { role-to-assume: "arn:aws:iam::111122223333:role/gha-shop-web-ecr", aws-region: eu-west-1 }
      - uses: aws-actions/amazon-ecr-login@v2
      - uses: docker/setup-buildx-action@v3
      - id: build
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: "\${{ env.IMAGE }}:\${{ github.sha }}"         # immutable, traceable to a commit
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: mode=max                                # SLSA provenance attestation
          sbom: true                                          # BuildKit SBOM attestation
      - run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed "$IMAGE@\${{ steps.build.outputs.digest }}"
      - uses: sigstore/cosign-installer@v3
      - run: |
          cosign sign --yes "$IMAGE@\${{ steps.build.outputs.digest }}"     # keyless: Fulcio cert from the OIDC token
          syft "$IMAGE@\${{ steps.build.outputs.digest }}" -o spdx-json &gt; sbom.spdx.json
          cosign attest --yes --type spdxjson --predicate sbom.spdx.json "$IMAGE@\${{ steps.build.outputs.digest }}"</pre>
<p>פרטים חשובים: <code>cache-to: type=gha,mode=max</code> שומר ב-cache כל שכבה של build רב-שלבי (build חוזר עם cache חם של שירות Node או Go יורד בדרך כלל מדקות להרבה פחות מדקה). כל מה שאחרי ה-build מפנה ל-<code>@sha256:...</code>, אף פעם לא ל-tag. חתימה keyless עם cosign צריכה <code>id-token: write</code>. תעודת החתימה רושמת את ה-workflow, ה-repo וה-ref, ואת זה בודק אחר כך ה-admission policy.</p>
<pre>resource "aws_ecr_repository" "web" {
  name                 = "shop/web"
  image_tag_mutability = "IMMUTABLE"          # a pushed tag can never point elsewhere
  encryption_configuration { encryption_type = "KMS" }
}

resource "aws_ecr_registry_scanning_configuration" "this" {
  scan_type = "ENHANCED"                      # Amazon Inspector: OS + language packages
  rule {
    scan_frequency = "CONTINUOUS_SCAN"        # re-scans when new CVEs are published
    repository_filter {
      filter      = "shop/*"
      filter_type = "WILDCARD"
    }
  }
}</pre>
<p>הסריקה הבסיסית של ECR סורקת רק ב-push. <strong>Enhanced scanning</strong> (דרך Inspector, בתשלום לכל image שנסרק) ממשיך לסרוק images שכבר רצים. זה מה שצריך כדי לענות על "האם משהו ב-prod מושפע מה-CVE שפורסם הבוקר?". תוסיף lifecycle policy שמוחקת images בלי tag ו-builds ישנים, אחרת האחסון ב-ECR רק גדל.</p>`
      }
    },
    {
      h: { en: "GitHub OIDC to an IAM role, pinned by sub", he: "OIDC של GitHub ל-IAM role, נעול לפי sub" },
      body: {
        en: `<p>No access keys in GitHub secrets. The job gets a signed JWT from GitHub; AWS STS checks it against the IAM OIDC provider for <code>token.actions.githubusercontent.com</code> and returns credentials valid for an hour by default. All the security is in the trust policy's conditions:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:org/shop-web:ref:refs/heads/main"
      }
    }
  }]
}</pre>
<table>
<tr><th>Job context</th><th>The <code>sub</code> claim looks like</th></tr>
<tr><td>Push to a branch</td><td><code>repo:org/shop-web:ref:refs/heads/main</code></td></tr>
<tr><td>Tag</td><td><code>repo:org/shop-web:ref:refs/tags/v1.4.0</code></td></tr>
<tr><td>Pull request</td><td><code>repo:org/shop-web:pull_request</code></td></tr>
<tr><td>Job with <code>environment: prod</code></td><td><code>repo:org/shop-web:environment:prod</code> (replaces the ref form!)</td></tr>
</table>
<p>The classic gotcha: you add <code>environment: prod</code> to a job and it suddenly fails with <em>Not authorized to perform sts:AssumeRoleWithWebIdentity</em>, because the subject changed from the ref form to the environment form. The classic hole: <code>StringLike</code> with <code>repo:org/*</code>, which lets every repo in the org (including a forgotten sandbox) push to prod's registry. The permissions policy stays small: <code>ecr:GetAuthorizationToken</code> on <code>*</code>, plus <code>ecr:BatchCheckLayerAvailability</code>, <code>InitiateLayerUpload</code>, <code>UploadLayerPart</code>, <code>CompleteLayerUpload</code>, <code>PutImage</code>, <code>BatchGetImage</code> on the one repository ARN.</p>`,
        he: `<p>אין access keys ב-secrets של GitHub. ה-job מקבל JWT חתום מ-GitHub. ה-STS של AWS בודק אותו מול ה-IAM OIDC provider של <code>token.actions.githubusercontent.com</code>, ומחזיר credentials שתקפים לשעה כברירת מחדל. כל האבטחה נמצאת בתנאים של ה-trust policy:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:org/shop-web:ref:refs/heads/main"
      }
    }
  }]
}</pre>
<table>
<tr><th>הקשר ה-job</th><th>איך ה-claim בשם <code>sub</code> נראה</th></tr>
<tr><td>Push ל-branch</td><td><code>repo:org/shop-web:ref:refs/heads/main</code></td></tr>
<tr><td>Tag</td><td><code>repo:org/shop-web:ref:refs/tags/v1.4.0</code></td></tr>
<tr><td>Pull request</td><td><code>repo:org/shop-web:pull_request</code></td></tr>
<tr><td>Job עם <code>environment: prod</code></td><td><code>repo:org/shop-web:environment:prod</code> (מחליף את צורת ה-ref!)</td></tr>
</table>
<p>הפח הקלאסי: מוסיפים <code>environment: prod</code> ל-job, ופתאום הוא נכשל עם <em>Not authorized to perform sts:AssumeRoleWithWebIdentity</em>. הסיבה: ה-subject השתנה מצורת ה-ref לצורת ה-environment. החור הקלאסי: <code>StringLike</code> עם <code>repo:org/*</code>, שמאפשר לכל repo בארגון (כולל sandbox נשכח) לעשות push ל-registry של prod. ה-permissions policy נשארת קטנה: <code>ecr:GetAuthorizationToken</code> על <code>*</code>, ועוד <code>ecr:BatchCheckLayerAvailability</code>, <code>InitiateLayerUpload</code>, <code>UploadLayerPart</code>, <code>CompleteLayerUpload</code>, <code>PutImage</code> ו-<code>BatchGetImage</code> על ה-ARN של ה-repository האחד.</p>`
      }
    },
    {
      h: { en: "GitOps hand-off, Argo CD sync, Rollouts canary, promotion by digest", he: "העברה ל-GitOps, sync של Argo CD, canary עם Rollouts, וקידום לפי digest" },
      body: {
        en: `<pre>  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - id: app-token
        uses: actions/create-github-app-token@v1                  # short-lived, scoped to the gitops repo
        with: { app-id: "\${{ vars.GITOPS_APP_ID }}", private-key: "\${{ secrets.GITOPS_APP_KEY }}", repositories: shop-gitops }
      - uses: actions/checkout@v4
        with: { repository: org/shop-gitops, token: "\${{ steps.app-token.outputs.token }}" }
      - run: |
          cd envs/dev/web
          kustomize edit set image web=$IMAGE@\${{ needs.build.outputs.digest }}
          git commit -am "web(dev): \${{ github.sha }}" &amp;&amp; git push</pre>
<p>Alternative: <strong>Argo CD Image Updater</strong> watches ECR and writes the new digest back to Git itself (recent versions configure it with an <code>ImageUpdater</code> custom resource, older ones with Application annotations; check the docs for your version). Simpler CI, but less explicit about which commit triggered which deploy.</p>
<p>Argo CD (<code>syncPolicy.automated</code> with <code>prune</code> and <code>selfHeal</code>) applies the new Rollout spec. Argo Rollouts shifts traffic through the AWS Load Balancer Controller and asks Prometheus at each step:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: web }
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: web-canary
      stableService: web-stable
      trafficRouting: { alb: { ingress: web, servicePort: 80 } }
      analysis:
        templates: [ { templateName: success-rate } ]
        startingStep: 1
        args: [ { name: service, value: web-canary } ]
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 30
        - pause: { duration: 10m }
        - setWeight: 60
        - pause: { duration: 10m }
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  args: [ { name: service } ]
  metrics:
    - name: success-rate
      interval: 1m
      failureLimit: 2
      successCondition: result[0] &gt;= 0.99
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service}}",code!~"5.."}[2m]))
            / sum(rate(http_requests_total{service="{{args.service}}"}[2m]))</pre>
<p>Two failed measurements abort the rollout and send 100% back to stable in seconds, with no human. <strong>Promotion</strong> to staging and prod is a PR in the GitOps repo that copies the <em>same digest</em> from the dev overlay (CODEOWNERS or a GitHub environment approval gates prod). No rebuild, so what you tested is byte-for-byte what you ship. At the cluster, an admission policy (Kyverno <code>verifyImages</code> or Sigstore policy-controller) rejects any image not signed by <code>org/shop-web</code>'s release workflow on <code>main</code>.</p>`,
        he: `<pre>  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - id: app-token
        uses: actions/create-github-app-token@v1                  # short-lived, scoped to the gitops repo
        with: { app-id: "\${{ vars.GITOPS_APP_ID }}", private-key: "\${{ secrets.GITOPS_APP_KEY }}", repositories: shop-gitops }
      - uses: actions/checkout@v4
        with: { repository: org/shop-gitops, token: "\${{ steps.app-token.outputs.token }}" }
      - run: |
          cd envs/dev/web
          kustomize edit set image web=$IMAGE@\${{ needs.build.outputs.digest }}
          git commit -am "web(dev): \${{ github.sha }}" &amp;&amp; git push</pre>
<p>החלופה: <strong>Argo CD Image Updater</strong> עוקב אחרי ECR וכותב בעצמו את ה-digest החדש חזרה ל-Git. בגרסאות חדשות מגדירים אותו עם custom resource בשם <code>ImageUpdater</code>, ובישנות עם annotations על ה-Application (בדוק בתיעוד של הגרסה שלך). ה-CI פשוט יותר, אבל פחות ברור איזה commit גרם לאיזה deploy.</p>
<p>Argo CD (עם <code>syncPolicy.automated</code>, ועם <code>prune</code> ו-<code>selfHeal</code>) מחיל את ה-spec החדש של ה-Rollout. Argo Rollouts מזיז תעבורה דרך ה-AWS Load Balancer Controller, ושואל את Prometheus בכל שלב:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: web }
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: web-canary
      stableService: web-stable
      trafficRouting: { alb: { ingress: web, servicePort: 80 } }
      analysis:
        templates: [ { templateName: success-rate } ]
        startingStep: 1
        args: [ { name: service, value: web-canary } ]
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 30
        - pause: { duration: 10m }
        - setWeight: 60
        - pause: { duration: 10m }
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  args: [ { name: service } ]
  metrics:
    - name: success-rate
      interval: 1m
      failureLimit: 2
      successCondition: result[0] &gt;= 0.99
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service}}",code!~"5.."}[2m]))
            / sum(rate(http_requests_total{service="{{args.service}}"}[2m]))</pre>
<p>שתי מדידות כושלות עוצרות את ה-rollout ומחזירות 100% מהתעבורה ל-stable תוך שניות, בלי בן אדם. <strong>קידום</strong> ל-staging ול-prod הוא PR ב-repo של GitOps שמעתיק את <em>אותו digest</em> מה-overlay של dev. את prod מגן CODEOWNERS או אישור של GitHub environment. אין build מחדש, אז מה שבדקת הוא בדיוק, ביט לביט, מה שאתה משחרר. ב-cluster עצמו, admission policy (<code>verifyImages</code> של Kyverno או ה-policy-controller של Sigstore) דוחה כל image שלא נחתם ע"י ה-release workflow של <code>org/shop-web</code> על <code>main</code>.</p>`
      }
    },
    {
      h: { en: "CI/CD platforms compared", he: "השוואת פלטפורמות CI/CD" },
      body: {
        en: `<table>
<tr><th></th><th>GitHub Actions</th><th>Azure DevOps Pipelines</th><th>GitLab CI</th><th>AWS CodePipeline + CodeBuild</th><th>Google Cloud Build</th></tr>
<tr><td>YAML model</td><td><code>.github/workflows/*.yml</code>: workflow → jobs → steps; reusable workflows, composite actions</td><td><code>azure-pipelines.yml</code>: stages → jobs → steps; templates with <code>extends</code></td><td><code>.gitlab-ci.yml</code>: stages → jobs; <code>include</code>, <code>extends</code>, CI/CD components catalog</td><td><code>buildspec.yml</code> per build + a pipeline definition (stages/actions) usually in IaC</td><td><code>cloudbuild.yaml</code>: each step is a container image</td></tr>
<tr><td>Runners</td><td>GitHub-hosted (Linux/Windows/macOS, larger and GPU sizes), self-hosted, ARC on Kubernetes</td><td>Microsoft-hosted agents, self-hosted, VMSS scale-set agents / Managed DevOps Pools</td><td>SaaS runners, self-managed runners (Kubernetes executor, autoscaling)</td><td>Managed CodeBuild compute (EC2 or Lambda); CodeBuild can also host GitHub Actions runners</td><td>Default pool or private pools in your VPC</td></tr>
<tr><td>Cloud auth without keys</td><td>OIDC to AWS, Azure, GCP and others</td><td>Workload identity federation service connections (Azure first; OIDC tokens usable elsewhere)</td><td><code>id_tokens</code> (OIDC) to any cloud</td><td>Native IAM role, nothing to federate inside AWS</td><td>Native service account</td></tr>
<tr><td>Environments / approvals</td><td>Environments with required reviewers, wait timers, branch rules</td><td>Environments with approvals and checks (business hours, Azure Monitor gates, invoke function)</td><td>Protected environments, deployment approvals (paid tiers)</td><td>Manual approval action in a stage</td><td>Build approvals on triggers; promotion usually via Cloud Deploy</td></tr>
<tr><td>Ecosystem</td><td>Largest marketplace of actions (pin by SHA)</td><td>Marketplace extensions and tasks</td><td>Components catalog, built-in SAST/DAST in higher tiers</td><td>Small; AWS integrations</td><td>Community builders</td></tr>
<tr><td>Pricing model</td><td>Per-minute for hosted runners on private repos beyond included minutes; free for public repos</td><td>Per parallel job (one free hosted job with a monthly minute cap for private projects)</td><td>Compute minutes per tier, plus per-seat plans</td><td>CodeBuild per build-minute; CodePipeline V2 per action-execution minute</td><td>Per build-minute with a monthly free allowance</td></tr>
</table>
<p>Pricing details change often (GitHub, for example, has revised runner billing more than once); check the current pricing pages before you quote numbers in a design review.</p>`,
        he: `<table>
<tr><th></th><th>GitHub Actions</th><th>Azure DevOps Pipelines</th><th>GitLab CI</th><th>AWS CodePipeline + CodeBuild</th><th>Google Cloud Build</th></tr>
<tr><td>מודל ה-YAML</td><td><code>.github/workflows/*.yml</code>: workflow → jobs → steps; reusable workflows, composite actions</td><td><code>azure-pipelines.yml</code>: stages ← jobs ← steps; templates עם <code>extends</code></td><td><code>.gitlab-ci.yml</code>: stages → jobs; <code>include</code>, <code>extends</code>, קטלוג CI/CD components</td><td><code>buildspec.yml</code> לכל build, ועוד הגדרת pipeline (stages/actions) שבדרך כלל יושבת ב-IaC</td><td><code>cloudbuild.yaml</code>: כל step הוא container image</td></tr>
<tr><td>Runners</td><td>GitHub-hosted (Linux/Windows/macOS, גדלים גדולים ו-GPU), self-hosted, ARC על Kubernetes</td><td>Microsoft-hosted agents, self-hosted, VMSS scale-set agents / Managed DevOps Pools</td><td>SaaS runners, self-managed runners (Kubernetes executor, autoscaling)</td><td>Compute מנוהל של CodeBuild (EC2 או Lambda); CodeBuild יכול גם לארח runners של GitHub Actions</td><td>Pool ברירת מחדל או private pools ב-VPC שלך</td></tr>
<tr><td>הזדהות לענן בלי keys</td><td>OIDC ל-AWS, Azure, GCP ועוד</td><td>Service connections עם workload identity federation (בעיקר Azure; אפשר להשתמש ב-OIDC tokens גם במקומות אחרים)</td><td><code>id_tokens</code> (OIDC) לכל ענן</td><td>IAM role מובנה, אין מה לעשות federation בתוך AWS</td><td>Service account מובנה</td></tr>
<tr><td>Environments ואישורים</td><td>Environments עם required reviewers, wait timers, חוקי branch</td><td>Environments עם approvals ו-checks (שעות עבודה, gates של Azure Monitor, הפעלת function)</td><td>Protected environments, deployment approvals (בתוכניות בתשלום)</td><td>Manual approval action בתוך stage</td><td>Build approvals על triggers; קידום בדרך כלל דרך Cloud Deploy</td></tr>
<tr><td>אקוסיסטם</td><td>ה-marketplace הכי גדול של actions (לנעול לפי SHA)</td><td>Extensions ו-tasks ב-marketplace</td><td>קטלוג components, SAST/DAST מובנים בתוכניות הגבוהות</td><td>קטן; אינטגרציות של AWS</td><td>Builders של הקהילה</td></tr>
<tr><td>מודל תמחור</td><td>לפי דקה ל-hosted runners ב-repos פרטיים מעבר לדקות הכלולות; חינם ל-repos ציבוריים</td><td>לפי parallel job (job מתארח אחד בחינם עם תקרת דקות חודשית לפרויקטים פרטיים)</td><td>דקות compute לפי tier, ועוד תוכניות לפי משתמש</td><td>CodeBuild לפי דקת build; CodePipeline V2 לפי דקת הרצה של action</td><td>לפי דקת build, עם מכסה חינמית חודשית</td></tr>
</table>
<p>פרטי התמחור משתנים הרבה (GitHub, למשל, עדכנו את החיוב על runners יותר מפעם אחת). תבדוק את דפי התמחור העדכניים לפני שאתה מצטט מספרים ב-design review.</p>`
      }
    },
    {
      h: { en: "Translating Azure DevOps to GitHub Actions", he: "תרגום מ-Azure DevOps ל-GitHub Actions" },
      body: {
        en: `<table>
<tr><th>Azure DevOps</th><th>GitHub Actions</th><th>Watch out</th></tr>
<tr><td>Pipeline (<code>azure-pipelines.yml</code>)</td><td>Workflow (<code>.github/workflows/x.yml</code>)</td><td>One repo can have many workflows; each has its own triggers</td></tr>
<tr><td>Stage</td><td>A job (or a call to a reusable workflow) chained with <code>needs</code></td><td>No first-class stage; a "stage" is a group of jobs</td></tr>
<tr><td>Job / step / task</td><td>Job / step / action (<code>uses:</code>)</td><td><code>dependsOn</code> → <code>needs</code>, <code>condition</code> → <code>if</code></td></tr>
<tr><td>Template (steps/jobs/stages, <code>extends</code>)</td><td>Composite action (steps) or reusable workflow (<code>on: workflow_call</code>)</td><td>Reusable workflows nest up to a limited depth; check current limits</td></tr>
<tr><td>Service connection (workload identity federation)</td><td>OIDC + cloud role (<code>azure/login</code> with a federated credential, <code>configure-aws-credentials</code>)</td><td>Restrict the federated subject to repo + environment</td></tr>
<tr><td>Variable group (optionally Key Vault-linked)</td><td>Org/repo/environment variables and secrets</td><td>No direct Key Vault link; fetch at runtime with OIDC</td></tr>
<tr><td>Environment + approvals and checks</td><td>Environment + protection rules (required reviewers, wait timer, deployment branches)</td><td>Fewer built-in gate types; custom deployment protection rules via GitHub Apps</td></tr>
<tr><td>Agent pool</td><td>Runner group + labels</td><td>Self-hosted runners on public repos are dangerous</td></tr>
<tr><td>Pipeline artifacts</td><td><code>actions/upload-artifact</code> / <code>download-artifact</code></td><td>Retention is configurable; default 90 days</td></tr>
<tr><td>Runtime parameters</td><td><code>workflow_dispatch</code> inputs</td><td>Typed inputs: string, boolean, choice, number, environment</td></tr>
</table>
<pre>gh extension install github/gh-actions-importer
gh actions-importer audit azure-devops --output-dir out/        # inventory and feasibility report
gh actions-importer dry-run azure-devops pipeline --pipeline-id 42 --output-dir out/</pre>
<p>The importer handles the mechanical 70-80%; the remaining work is usually identity (service connections → OIDC), approvals, and Key Vault-linked variable groups.</p>`,
        he: `<table>
<tr><th>Azure DevOps</th><th>GitHub Actions</th><th>שים לב</th></tr>
<tr><td>Pipeline (<code>azure-pipelines.yml</code>)</td><td>Workflow (<code>.github/workflows/x.yml</code>)</td><td>ב-repo אחד יכולים להיות הרבה workflows, ולכל אחד triggers משלו</td></tr>
<tr><td>Stage</td><td>Job (או קריאה ל-reusable workflow) שמשורשר עם <code>needs</code></td><td>אין stage כמושג מובנה; "stage" הוא קבוצת jobs</td></tr>
<tr><td>Job / step / task</td><td>Job / step / action (<code>uses:</code>)</td><td><code>dependsOn</code> הופך ל-<code>needs</code>, ו-<code>condition</code> הופך ל-<code>if</code></td></tr>
<tr><td>Template (steps/jobs/stages, <code>extends</code>)</td><td>Composite action (ל-steps) או reusable workflow (<code>on: workflow_call</code>)</td><td>יש מגבלת עומק לקינון של reusable workflows; בדוק את המגבלות העדכניות</td></tr>
<tr><td>Service connection (עם workload identity federation)</td><td>OIDC ועוד role בענן (<code>azure/login</code> עם federated credential, <code>configure-aws-credentials</code>)</td><td>תגביל את ה-subject ב-federation ל-repo ול-environment</td></tr>
<tr><td>Variable group (אפשר מקושר ל-Key Vault)</td><td>Variables ו-secrets ברמת org, repo או environment</td><td>אין קישור ישיר ל-Key Vault; שולפים בזמן ריצה עם OIDC</td></tr>
<tr><td>Environment עם approvals ו-checks</td><td>Environment עם protection rules (required reviewers, wait timer, deployment branches)</td><td>פחות סוגי gates מובנים; custom deployment protection rules דרך GitHub Apps</td></tr>
<tr><td>Agent pool</td><td>Runner group ו-labels</td><td>Self-hosted runners על repos ציבוריים זה מסוכן</td></tr>
<tr><td>Pipeline artifacts</td><td><code>actions/upload-artifact</code> / <code>download-artifact</code></td><td>ה-retention ניתן להגדרה; ברירת המחדל 90 יום</td></tr>
<tr><td>Runtime parameters</td><td>Inputs של <code>workflow_dispatch</code></td><td>Inputs עם טיפוסים: string, boolean, choice, number, environment</td></tr>
</table>
<pre>gh extension install github/gh-actions-importer
gh actions-importer audit azure-devops --output-dir out/        # inventory and feasibility report
gh actions-importer dry-run azure-devops pipeline --pipeline-id 42 --output-dir out/</pre>
<p>ה-importer מטפל ב-70-80% המכניים. מה שנשאר זה בדרך כלל identity (מעבר מ-service connections ל-OIDC), אישורים, ו-variable groups שמקושרים ל-Key Vault.</p>`
      }
    }
  ],
  diagram: "PR: lint/test -> build (no push) -> trivy -> kubeconform        [required checks]\nmain: OIDC(sub=repo:org/shop-web:ref:refs/heads/main) -> buildx(cache gha) -> ECR (IMMUTABLE) @sha256:...\n      -> trivy + Inspector -> cosign sign + SBOM attest\n      -> commit digest to gitops/envs/dev -> Argo CD sync -> Rollout canary 10/30/60/100 + Prometheus analysis\npromote: PR copies SAME digest -> envs/staging -> envs/prod (approval) -> Kyverno verifyImages at admission",
  handsOn: [
    { cmd: "aws ecr describe-images --repository-name shop/web --query 'sort_by(imageDetails,&imagePushedAt)[-3:].[imageDigest,imageTags[0]]' --output table", what: { en: "Show the last three images with their digests and tags. The digest is the identity you promote.", he: "מציג את שלושת ה-images האחרונים עם ה-digests וה-tags שלהם. ה-digest הוא הזהות שאותה מקדמים." } },
    { cmd: "cosign verify $IMAGE@sha256:<digest> --certificate-identity-regexp 'https://github.com/org/shop-web/.github/workflows/release.yml@refs/heads/main' --certificate-oidc-issuer https://token.actions.githubusercontent.com", what: { en: "Prove the image was signed by the release workflow on main, which is exactly what the admission policy checks.", he: "מוכיח שה-image נחתם ע\"י ה-release workflow על main. זה בדיוק מה שה-admission policy בודק." } },
    { cmd: "aws inspector2 list-findings --filter-criteria '{\"ecrImageRepositoryName\":[{\"comparison\":\"EQUALS\",\"value\":\"shop/web\"}],\"severity\":[{\"comparison\":\"EQUALS\",\"value\":\"CRITICAL\"}]}' --query 'findings[].title'", what: { en: "List critical CVEs that enhanced scanning found in the repo, including ones published after the image was pushed.", he: "מציג CVEs קריטיים שה-enhanced scanning מצא ב-repo, כולל כאלה שפורסמו אחרי שה-image עלה." } },
    { cmd: "kubectl argo rollouts get rollout web -n shop --watch", what: { en: "Watch the canary move through its weights and analysis runs; abort with kubectl argo rollouts abort web.", he: "עוקב אחרי ה-canary כשהוא עובר בין המשקלים וה-analysis runs. עוצרים עם kubectl argo rollouts abort web." } },
    { cmd: "argocd app diff shop-web-prod && argocd app history shop-web-prod", what: { en: "See what Argo CD would change in prod and which Git revisions (and therefore digests) were deployed when.", he: "רואים מה Argo CD ישנה ב-prod, ואיזה revisions של Git (ולכן איזה digests) נפרסו ומתי." } }
  ],
  mnemonic: {
    en: "Build once, Digest forever, Sign what you ship, Git decides, Canary proves: B-D-S-G-C.",
    he: "בונים פעם אחת, digest לתמיד, חותמים על מה ששולחים, Git מחליט, ה-canary מוכיח."
  },
  pitfalls: [
    { en: "Deploying by tag (or :latest) instead of digest. With mutable tags, what ran in staging and what runs in prod can differ silently; with IMMUTABLE ECR tags plus digest references, they cannot.", he: "לפרוס לפי tag (או :latest) במקום digest. עם tags שאפשר לשנות, מה שרץ ב-staging ומה שרץ ב-prod יכולים להיות שונים בשקט. עם tags מסוג IMMUTABLE ב-ECR והפניות לפי digest, זה לא יכול לקרות." },
    { en: "A trust policy with StringLike repo:org/* or no sub condition at all. Any repo (or a fork's workflow in some setups) can assume your deploy role.", he: "Trust policy עם StringLike על repo:org/*, או בלי תנאי sub בכלל. כל repo (ובחלק מההגדרות גם workflow של fork) יכול לקבל את ה-role של ה-deploy שלך." },
    { en: "Rebuilding the image per environment. A rebuild pulls newer base layers and dependencies, so prod runs something you never tested; promote the digest.", he: "לבנות את ה-image מחדש לכל סביבה. build חדש מושך שכבות בסיס ותלויות חדשות יותר, כך ש-prod מריץ משהו שמעולם לא בדקת. תקדם את ה-digest." },
    { en: "Giving CI kubectl access to the cluster 'just for deploys'. It turns every workflow compromise into a cluster compromise; with GitOps, CI only writes to Git and Argo CD pulls.", he: "לתת ל-CI גישת kubectl ל-cluster 'רק בשביל deploys'. זה הופך כל פריצה ל-workflow לפריצה ל-cluster. עם GitOps, ה-CI רק כותב ל-Git, ו-Argo CD מושך." }
  ],
  interview: [
    {
      q: { en: "Design the pipeline from merge to production on EKS. Where are the trust boundaries?", he: "תתכנן את ה-pipeline מ-merge עד production על EKS. איפה גבולות האמון?" },
      a: { en: "Merge to main triggers a build job that assumes an IAM role via GitHub OIDC; the trust policy pins aud and sub to this repo's main branch, and the role can only push to one ECR repo. The image goes to an immutable repo, is scanned, signed keyless with cosign and gets an SBOM attestation. CI commits the digest to the GitOps repo with a short-lived GitHub App token. Argo CD, inside the cluster, pulls and syncs; Argo Rollouts canaries with Prometheus analysis. Promotion is a PR copying the digest, with approval for prod. At admission Kyverno verifies the signature identity. Boundaries: GitHub to AWS (OIDC sub), CI to cluster (only via Git), registry to cluster (signature verification).", he: "Merge ל-main מפעיל job של build שמקבל IAM role דרך OIDC של GitHub. ה-trust policy נועל את aud ואת sub ל-branch ה-main של ה-repo הזה, וה-role יכול לעשות push רק ל-repo אחד ב-ECR. ה-image נכנס ל-repo עם tags קבועים, נסרק, נחתם keyless עם cosign ומקבל attestation של SBOM. ה-CI עושה commit של ה-digest ל-repo של GitOps עם token קצר-חיים של GitHub App. Argo CD, מתוך ה-cluster, מושך ומסנכרן, ו-Argo Rollouts מריץ canary עם analysis מול Prometheus. קידום הוא PR שמעתיק את ה-digest, עם אישור ל-prod. ב-admission, Kyverno מאמת את ה-identity של החתימה. הגבולות: GitHub מול AWS (ה-sub של OIDC), CI מול cluster (רק דרך Git), ו-registry מול cluster (אימות חתימה)." }
    },
    {
      q: { en: "Your team uses Azure DevOps with variable groups linked to Key Vault and service connections. How do you migrate to GitHub Actions?", he: "הצוות שלך עובד עם Azure DevOps, עם variable groups שמקושרים ל-Key Vault ועם service connections. איך עוברים ל-GitHub Actions?" },
      a: { en: "Run gh actions-importer audit to inventory pipelines and get a conversion report, then dry-run per pipeline. Templates become composite actions or reusable workflows; stages become jobs with needs; environments with approvals map to GitHub environments with required reviewers. Service connections become OIDC: a federated credential on the Entra app or managed identity with subject repo:org/x:environment:prod, and azure/login in the workflow. Key Vault-linked variable groups become a runtime fetch from Key Vault after OIDC login, not copied secrets. Migrate one service end to end first, run both systems in parallel for a release, then cut over.", he: "מריצים gh actions-importer audit כדי למפות את ה-pipelines ולקבל דוח המרה, ואז dry-run לכל pipeline. Templates הופכים ל-composite actions או ל-reusable workflows. Stages הופכים ל-jobs עם needs. Environments עם approvals ממופים ל-GitHub environments עם required reviewers. Service connections הופכים ל-OIDC: federated credential על ה-app ב-Entra או על managed identity, עם subject בצורה repo:org/x:environment:prod, ו-azure/login ב-workflow. Variable groups שמקושרים ל-Key Vault הופכים לשליפה בזמן ריצה מ-Key Vault אחרי login עם OIDC, ולא להעתקה של סודות. קודם מעבירים שירות אחד מקצה לקצה, מריצים את שתי המערכות במקביל ל-release אחד, ורק אז עוברים." }
    },
    {
      q: { en: "The canary passes analysis but users report errors after full rollout. What went wrong and how do you harden it?", he: "ה-canary עבר את ה-analysis, אבל אחרי rollout מלא משתמשים מדווחים על שגיאות. מה השתבש ואיך מחזקים את זה?" },
      a: { en: "Usual causes: the query measured too little traffic at 10% to be significant, it looked at the wrong labels (stable plus canary blended), the error only appears under full load (connection pools, DB contention), or it only affects a segment (one region, one client version). Fixes: analysis on the canary service only with a minimum request count, add latency p99 and saturation metrics, keep analysis running in the background through 100%, add a post-promotion analysis step, and pin a rollback runbook: argo rollouts undo, or revert the digest in Git.", he: "הסיבות הרגילות: ב-10% היו מעט מדי בקשות כדי שהמדידה תהיה מובהקת. או שה-query הסתכל על labels לא נכונים (stable ו-canary מעורבבים). או שהשגיאה מופיעה רק תחת עומס מלא (connection pools, תחרות על ה-DB). או שהיא פוגעת רק בפלח מסוים (region אחד, גרסת client אחת). התיקונים: analysis רק על ה-service של ה-canary עם מינימום בקשות, הוספת latency p99 ומדדי saturation, להשאיר את ה-analysis רץ ברקע עד 100%, להוסיף שלב analysis אחרי הקידום, ו-runbook מוכן ל-rollback: argo rollouts undo, או revert של ה-digest ב-Git." }
    }
  ],
  quiz: [
    {
      q: { en: "A job that worked suddenly fails to assume its AWS role after you added environment: prod to it. Why?", he: "Job שעבד פתאום נכשל בקבלת ה-role ב-AWS אחרי שהוספת לו environment: prod. למה?" },
      options: [
        { en: "Environments disable OIDC", he: "Environments מבטלים OIDC" },
        { en: "The token's sub became repo:org/x:environment:prod, which the trust policy does not allow", he: "ה-sub ב-token הפך ל-repo:org/x:environment:prod, וה-trust policy לא מאשר אותו" },
        { en: "The role's session duration is too short", he: "משך ה-session של ה-role קצר מדי" },
        { en: "ECR does not support environments", he: "ECR לא תומך ב-environments" }
      ],
      answer: 1,
      explain: { en: "With an environment, the sub claim uses the environment form instead of the ref form. Add that exact subject to the trust policy.", he: "כשיש environment, ה-claim בשם sub משתמש בצורת ה-environment במקום בצורת ה-ref. תוסיף את ה-subject המדויק הזה ל-trust policy." }
    },
    {
      q: { en: "Why promote by digest rather than rebuilding for each environment?", he: "למה מקדמים לפי digest במקום לבנות מחדש לכל סביבה?" },
      options: [
        { en: "Digests are shorter than tags", he: "Digests קצרים יותר מ-tags" },
        { en: "ECR charges per build", he: "ECR גובה כסף לכל build" },
        { en: "The bytes tested in staging are exactly the bytes deployed to prod, and signatures stay valid", he: "הביטים שנבדקו ב-staging הם בדיוק הביטים שנפרסים ב-prod, והחתימות נשארות תקפות" },
        { en: "Argo CD cannot read tags", he: "Argo CD לא יודע לקרוא tags" }
      ],
      answer: 2,
      explain: { en: "A digest is a content hash. Rebuilding pulls newer layers and produces a different, untested, unsigned artifact.", he: "Digest הוא hash של התוכן. build חדש מושך שכבות חדשות ומייצר artifact אחר, שלא נבדק ולא נחתם." }
    },
    {
      q: { en: "What does ECR enhanced scanning add over basic scanning?", he: "מה enhanced scanning של ECR מוסיף על הסריקה הבסיסית?" },
      options: [
        { en: "It signs images", he: "הוא חותם על images" },
        { en: "Continuous rescans via Amazon Inspector, including language packages, as new CVEs appear", he: "סריקות חוזרות ורציפות דרך Amazon Inspector, כולל חבילות של שפות, כשמופיעים CVEs חדשים" },
        { en: "It blocks pulls of vulnerable images automatically", he: "הוא חוסם אוטומטית pull של images פגיעים" },
        { en: "It is free", he: "הוא בחינם" }
      ],
      answer: 1,
      explain: { en: "Basic scanning runs on push (or manually). Enhanced scanning with Inspector rescans continuously; blocking is still your admission policy's job.", he: "הסריקה הבסיסית רצה ב-push (או ידנית). Enhanced scanning עם Inspector סורק שוב ברציפות. החסימה עדיין באחריות ה-admission policy שלך." }
    },
    {
      q: { en: "Which Azure DevOps concept maps to a reusable workflow (on: workflow_call) in GitHub Actions?", he: "איזה מושג של Azure DevOps ממופה ל-reusable workflow (on: workflow_call) ב-GitHub Actions?" },
      options: [
        { en: "Variable group", he: "Variable group" },
        { en: "Service connection", he: "Service connection" },
        { en: "Agent pool", he: "Agent pool" },
        { en: "A jobs or stages template", he: "Template של jobs או stages" }
      ],
      answer: 3,
      explain: { en: "Step templates map to composite actions; job/stage templates map to reusable workflows. Variable groups map to variables/secrets, service connections to OIDC, agent pools to runner groups.", he: "Templates של steps ממופים ל-composite actions, ו-templates של jobs או stages ממופים ל-reusable workflows. Variable groups הופכים ל-variables ו-secrets, service connections ל-OIDC, ו-agent pools ל-runner groups." }
    }
  ],
  related: ["cicd-github-actions", "cloud-cicd", "k8s-argocd", "k8s-argo-rollouts", "staff-supply-chain", "k8s-helm-gitops", "container-security"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "cloud-big3-services-compare",
  track: "cloud",
  order: 67,
  icon: "⚖️",
  level: 2,
  minutes: 16,
  title: { en: "AWS vs Azure vs GCP: Choosing Services Like an Architect", he: "AWS מול Azure מול GCP: לבחור שירותים כמו ארכיטקט" },
  tldr: {
    en: "The names map one-to-one; the models do not. AWS isolates with accounts and gives the widest, most granular toolbox. Azure organises everything under one Entra tenant with resource groups and wins wherever Microsoft identity, licences and enterprise integration matter. GCP has a global VPC, a simpler project model and the strongest data and analytics story. Choose per workload on hard requirements, team skills and total cost (egress and licences included), and say so in interviews.",
    he: "השמות ממופים אחד לאחד, המודלים לא. AWS מבודד עם accounts ונותן את ארגז הכלים הרחב והגרנולרי ביותר. Azure מארגן הכל תחת tenant אחד של Entra עם resource groups, ומנצח בכל מקום שבו ה-identity, הרישיונות והאינטגרציה הארגונית של Microsoft חשובים. ל-GCP יש VPC גלובלי, מודל projects פשוט יותר, והסיפור החזק ביותר ב-data ו-analytics. בוחרים לכל workload לפי דרישות קשיחות, כישורי הצוות ועלות כוללת (כולל egress ורישיונות), וככה גם עונים בראיון."
  },
  analogy: {
    en: "Three hotel chains with the same room types. One (AWS) gives every guest a separate building with its own keys and lets you customise every pipe. One (Azure) runs everything from one front desk that already knows every employee of your company. One (GCP) has a private underground train connecting all its hotels worldwide, so moving between cities never touches the street.",
    he: "שלוש רשתות מלונות עם אותם סוגי חדרים. אחת (AWS) נותנת לכל אורח בניין נפרד עם מפתחות משלו, ומאפשרת להתאים כל צינור. השנייה (Azure) מנהלת הכל מדלפק קבלה אחד שכבר מכיר כל עובד בחברה שלך. השלישית (GCP) מחזיקה רכבת תחתית פרטית שמחברת את כל המלונות שלה בעולם, כך שמעבר בין ערים אף פעם לא יוצא לרחוב."
  },
  sections: [
    {
      h: { en: "Org model and IAM: where the boundaries are", he: "מודל ארגוני ו-IAM: איפה הגבולות" },
      body: {
        en: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Hierarchy</td><td>Organization → OUs → <strong>accounts</strong></td><td>Entra tenant → management groups → <strong>subscriptions</strong> → resource groups</td><td>Organization → folders → <strong>projects</strong></td></tr>
<tr><td>Hard isolation unit</td><td>Account (IAM, quotas, billing, blast radius)</td><td>Subscription (quotas, billing); RBAC scope can be narrower</td><td>Project (APIs enabled, quotas, billing)</td></tr>
<tr><td>Guardrails</td><td>SCPs and RCPs (resource control policies), Control Tower</td><td>Azure Policy (deny, audit, modify, deployIfNotExists)</td><td>Organization Policy constraints</td></tr>
<tr><td>Permission model</td><td>JSON policies on identities <em>and</em> resources; explicit deny wins; roles assumed via STS</td><td>Role assignment = principal + role definition + scope, inherited down; control plane vs data plane roles</td><td>Allow policies (bindings) on resources, inherited down; deny policies; IAM Conditions</td></tr>
<tr><td>Workload identity</td><td>IAM roles (instance profile, Pod Identity, IRSA)</td><td>Managed identities</td><td>Service accounts (avoid keys)</td></tr>
</table>
<p>What bites an Azure engineer on AWS: there is no resource group, so lifecycle and ownership live in tags and in <em>separate accounts</em>; a "landing zone" there means dozens to hundreds of accounts (see <code>cloud-landing-zones</code>). Cross-account access is a role in account B that trusts account A, plus permission in A to call <code>sts:AssumeRole</code>. What bites an AWS engineer on Azure: <code>Reader</code> or <code>Contributor</code> on a storage account does <em>not</em> let you read blobs; you need a data-plane role such as <code>Storage Blob Data Reader</code>. And Entra directory roles (Global Administrator) are a separate system from Azure RBAC.</p>`,
        he: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>היררכיה</td><td>Organization → OUs → <strong>accounts</strong></td><td>Entra tenant → management groups → <strong>subscriptions</strong> → resource groups</td><td>Organization → folders → <strong>projects</strong></td></tr>
<tr><td>יחידת הבידוד הקשיחה</td><td>Account (IAM, quotas, billing, blast radius)</td><td>Subscription (quotas, billing); ה-scope של RBAC יכול להיות צר יותר</td><td>Project (APIs מופעלים, quotas, billing)</td></tr>
<tr><td>Guardrails</td><td>SCPs ו-RCPs (resource control policies), Control Tower</td><td>Azure Policy (deny, audit, modify, deployIfNotExists)</td><td>Organization Policy constraints</td></tr>
<tr><td>מודל ההרשאות</td><td>JSON policies על identities <em>וגם</em> על משאבים; explicit deny מנצח; roles מתקבלים דרך STS</td><td>Role assignment = principal + role definition + scope, עובר בירושה למטה; roles של control plane מול data plane</td><td>Allow policies (bindings) על משאבים, בירושה למטה; deny policies; IAM Conditions</td></tr>
<tr><td>Workload identity</td><td>IAM roles (instance profile, Pod Identity, IRSA)</td><td>Managed identities</td><td>Service accounts (בלי keys)</td></tr>
</table>
<p>מה שתוקע מהנדס Azure ב-AWS: אין resource group. מחזור החיים והבעלות יושבים ב-tags וב-<em>accounts נפרדים</em>, ו-"landing zone" שם אומר עשרות עד מאות accounts (ראה <code>cloud-landing-zones</code>). גישה בין accounts היא role ב-account B שסומך על account A, ועוד הרשאה ב-A לקרוא ל-<code>sts:AssumeRole</code>. מה שתוקע מהנדס AWS ב-Azure: <code>Reader</code> או <code>Contributor</code> על storage account <em>לא</em> מאפשרים לקרוא blobs. צריך role של data plane, כמו <code>Storage Blob Data Reader</code>. ו-roles של ה-directory ב-Entra (כמו Global Administrator) הם מערכת נפרדת מ-Azure RBAC.</p>`
      }
    },
    {
      h: { en: "Networking: global VPC vs regional VPC/VNet", he: "רשת: VPC גלובלי מול VPC/VNet אזורי" },
      body: {
        en: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Network scope</td><td>VPC is regional; subnets live in one AZ</td><td>VNet is regional; subnets span the region's zones</td><td>VPC is <strong>global</strong>; subnets are regional</td></tr>
<tr><td>Multi-region private connectivity</td><td>Inter-region peering, Transit Gateway peering, or Cloud WAN</td><td>Global VNet peering, Virtual WAN</td><td>Nothing to build: two regions in one VPC route privately</td></tr>
<tr><td>Sharing one network across teams</td><td>VPC sharing via RAM</td><td>Hub-and-spoke peering</td><td>Shared VPC (host project + service projects)</td></tr>
<tr><td>Global L7 load balancing</td><td>Regional ALB + CloudFront / Global Accelerator / Route 53 latency routing</td><td>Front Door (global), Application Gateway (regional)</td><td>Global external Application LB: one anycast IP, backends in many regions</td></tr>
<tr><td>Subnet gotcha</td><td>Plan one subnet per AZ per tier; IP exhaustion with VPC CNI</td><td>Some services need a dedicated, delegated subnet</td><td>Secondary ranges for GKE pods/services must be sized up front</td></tr>
</table>
<p>The architectural consequence: on GCP, a multi-region active-active service can sit behind one global IP with one VPC and no transit layer. On AWS you assemble the same from regional pieces, which is more work but gives regional isolation by default (a misconfiguration in one region's VPC cannot touch another's).</p>`,
        he: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>היקף הרשת</td><td>VPC אזורי; כל subnet יושב ב-AZ אחד</td><td>VNet אזורי; subnets מתפרשים על כל ה-zones ב-region</td><td>VPC <strong>גלובלי</strong>; subnets אזוריים</td></tr>
<tr><td>חיבור פרטי בין regions</td><td>Inter-region peering, peering בין Transit Gateways, או Cloud WAN</td><td>Global VNet peering, Virtual WAN</td><td>אין מה לבנות: שני regions באותו VPC מנותבים באופן פרטי</td></tr>
<tr><td>שיתוף רשת אחת בין צוותים</td><td>VPC sharing דרך RAM</td><td>Peering בתבנית hub-and-spoke</td><td>Shared VPC (host project ו-service projects)</td></tr>
<tr><td>Load balancing גלובלי ב-L7</td><td>ALB אזורי ועוד CloudFront / Global Accelerator / latency routing ב-Route 53</td><td>Front Door (גלובלי), Application Gateway (אזורי)</td><td>Global external Application LB: כתובת anycast אחת, backends בהרבה regions</td></tr>
<tr><td>מלכודת subnets</td><td>לתכנן subnet לכל AZ לכל שכבה; מיצוי IPs עם VPC CNI</td><td>חלק מהשירותים צריכים subnet ייעודי עם delegation</td><td>צריך לתכנן מראש את ה-secondary ranges של GKE ל-Pods ול-services</td></tr>
</table>
<p>ההשלכה הארכיטקטונית: ב-GCP, שירות active-active על כמה regions יכול לשבת מאחורי IP גלובלי אחד, עם VPC אחד ובלי שכבת transit. ב-AWS מרכיבים את אותו דבר מחלקים אזוריים. זו יותר עבודה, אבל מקבלים בידוד אזורי כברירת מחדל: טעות קונפיגורציה ב-VPC של region אחד לא יכולה לגעת ב-region אחר.</p>`
      }
    },
    {
      h: { en: "Compute: Kubernetes and serverless containers", he: "Compute: Kubernetes ו-containers בלי שרתים" },
      body: {
        en: `<p>For managed Kubernetes (control-plane pricing, CNI, workload identity, upgrades) see <code>cloud-managed-k8s-compare</code>. In short: GKE is the most managed, AKS the most Entra-integrated, EKS the most assemble-it-yourself (with EKS Auto Mode closing the gap).</p>
<table>
<tr><th></th><th>AWS</th><th>Azure Container Apps</th><th>Google Cloud Run</th></tr>
<tr><td>Main option</td><td>ECS on Fargate; <strong>ECS Express Mode</strong> as the simple path. App Runner closed to new customers on 30 April 2026 (existing users keep it, no new features)</td><td>Container Apps (consumption or dedicated workload profiles)</td><td>Cloud Run services and jobs</td></tr>
<tr><td>Scale to zero</td><td>Not for an ECS service by default (you pay for running tasks); Lambda (container images up to 10 GB, 15-minute limit) does</td><td>Yes, KEDA-based rules (HTTP, queue length, cron...)</td><td>Yes, request-driven; concurrency per instance (default 80, max 1000)</td></tr>
<tr><td>Strength</td><td>Deep VPC/IAM integration, any long-running workload, Spot capacity</td><td>Dapr, revisions with traffic split, event-driven scaling from Service Bus/Event Hubs</td><td>Fastest from container to HTTPS URL; GPUs; per-request billing</td></tr>
</table>
<p>A rule of thumb: spiky HTTP or event-driven work with idle time leans Cloud Run or Container Apps; steady, long-running services with tight VPC and IAM needs lean ECS/Fargate or EKS.</p>`,
        he: `<p>על Kubernetes מנוהל (מחיר ה-control plane, ה-CNI, workload identity ו-upgrades) תקרא ב-<code>cloud-managed-k8s-compare</code>. בקצרה: GKE הכי מנוהל, AKS הכי משולב עם Entra, ו-EKS הכי "תרכיב לבד" (כש-EKS Auto Mode מצמצם את הפער).</p>
<table>
<tr><th></th><th>AWS</th><th>Azure Container Apps</th><th>Google Cloud Run</th></tr>
<tr><td>האפשרות המרכזית</td><td>ECS על Fargate; <strong>ECS Express Mode</strong> כמסלול הפשוט. App Runner נסגר ללקוחות חדשים ב-30 באפריל 2026 (לקוחות קיימים ממשיכים, בלי פיצ'רים חדשים)</td><td>Container Apps (consumption או workload profiles ייעודיים)</td><td>Cloud Run services ו-jobs</td></tr>
<tr><td>Scale to zero</td><td>לא ב-service של ECS כברירת מחדל (משלמים על tasks שרצים); Lambda כן (container images עד 10 GB, מגבלה של 15 דקות)</td><td>כן, חוקים מבוססי KEDA (HTTP, אורך תור, cron...)</td><td>כן, לפי בקשות; concurrency לכל instance (ברירת מחדל 80, מקסימום 1000)</td></tr>
<tr><td>החוזקה</td><td>אינטגרציה עמוקה ל-VPC ול-IAM, כל workload ארוך, קיבולת Spot</td><td>Dapr, revisions עם פיצול תעבורה, scaling מבוסס אירועים מ-Service Bus או Event Hubs</td><td>הדרך הכי מהירה מ-container ל-URL עם HTTPS; GPUs; חיוב לפי בקשה</td></tr>
</table>
<p>כלל אצבע: עבודה קופצנית ב-HTTP או מבוססת אירועים, עם זמן מת, נוטה ל-Cloud Run או ל-Container Apps. שירותים יציבים וארוכים עם דרישות הדוקות של VPC ו-IAM נוטים ל-ECS/Fargate או ל-EKS.</p>`
      }
    },
    {
      h: { en: "Databases and messaging: the real differences", he: "דאטאבייסים ו-messaging: ההבדלים האמיתיים" },
      body: {
        en: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Relational flagship</td><td><strong>Aurora</strong> (MySQL/PostgreSQL): storage keeps 6 copies across 3 AZs, up to 15 read replicas, Serverless v2, Global Database; Aurora DSQL for distributed active-active</td><td><strong>Azure SQL</strong> (Hyperscale up to 128 TB; Managed Instance for near-full SQL Server compatibility); PostgreSQL Flexible Server</td><td><strong>Spanner</strong> (global, externally consistent via TrueTime, 99.999% multi-region SLA); <strong>AlloyDB</strong> (PostgreSQL-compatible, columnar engine); Cloud SQL</td></tr>
<tr><td>NoSQL / multi-model</td><td>DynamoDB (single-digit ms, global tables)</td><td><strong>Cosmos DB</strong>: several APIs, five consistency levels, multi-region writes, billed in RU/s</td><td>Firestore, Bigtable</td></tr>
<tr><td>Queue</td><td>SQS (standard, FIFO)</td><td><strong>Service Bus</strong>: queues and topics with sessions, transactions, dead-lettering, duplicate detection</td><td>Pub/Sub pull subscriptions (exactly-once option, ordering keys)</td></tr>
<tr><td>Fan-out / events</td><td>SNS, EventBridge (rules, Pipes, Scheduler)</td><td>Event Grid (push, CloudEvents, MQTT)</td><td>Pub/Sub topics (global), Eventarc</td></tr>
<tr><td>Streaming</td><td>Kinesis Data Streams, MSK (Kafka)</td><td>Event Hubs (Kafka-compatible endpoint, Capture)</td><td>Pub/Sub, Managed Service for Apache Kafka; Dataflow</td></tr>
<tr><td>Analytics</td><td>Redshift, Athena</td><td>Fabric / Synapse</td><td><strong>BigQuery</strong> (serverless, the strongest of the three for SQL analytics)</td></tr>
</table>
<p>Where engineers argue: Service Bus is a richer enterprise broker than SQS (sessions, transactions), so a .NET shop migrating to AWS often needs SQS FIFO plus extra code, or Amazon MQ. Spanner gives global strong consistency that you otherwise approximate with Aurora Global Database (async replicas) or DSQL. Cosmos DB's RU model needs capacity planning that DynamoDB on-demand hides. See <code>cloud-event-services</code> for the event services in depth.</p>`,
        he: `<table>
<tr><th></th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>ספינת הדגל הרלציונית</td><td><strong>Aurora</strong> (MySQL/PostgreSQL): ה-storage שומר 6 עותקים על 3 AZs, עד 15 read replicas, Serverless v2, Global Database; ו-Aurora DSQL ל-active-active מבוזר</td><td><strong>Azure SQL</strong> (Hyperscale עד 128 TB; Managed Instance לתאימות כמעט מלאה ל-SQL Server); PostgreSQL Flexible Server</td><td><strong>Spanner</strong> (גלובלי, external consistency בזכות TrueTime, SLA של 99.999% ב-multi-region); <strong>AlloyDB</strong> (תואם PostgreSQL, עם columnar engine); Cloud SQL</td></tr>
<tr><td>NoSQL / multi-model</td><td>DynamoDB (latency של ms בודדות, global tables)</td><td><strong>Cosmos DB</strong>: כמה APIs, חמש רמות consistency, כתיבה בכמה regions, חיוב לפי RU/s</td><td>Firestore, Bigtable</td></tr>
<tr><td>תור</td><td>SQS (standard, FIFO)</td><td><strong>Service Bus</strong>: queues ו-topics עם sessions, transactions, dead-lettering וזיהוי כפילויות</td><td>Pull subscriptions של Pub/Sub (אפשרות exactly-once, ordering keys)</td></tr>
<tr><td>Fan-out ואירועים</td><td>SNS, EventBridge (rules, Pipes, Scheduler)</td><td>Event Grid (push, CloudEvents, MQTT)</td><td>Topics של Pub/Sub (גלובליים), Eventarc</td></tr>
<tr><td>Streaming</td><td>Kinesis Data Streams, MSK (Kafka)</td><td>Event Hubs (endpoint תואם Kafka, Capture)</td><td>Pub/Sub, Managed Service for Apache Kafka; Dataflow</td></tr>
<tr><td>Analytics</td><td>Redshift, Athena</td><td>Fabric / Synapse</td><td><strong>BigQuery</strong> (serverless, החזק מבין השלושה ל-analytics ב-SQL)</td></tr>
</table>
<p>איפה מהנדסים מתווכחים: Service Bus הוא broker ארגוני עשיר יותר מ-SQS (sessions, transactions). לכן ארגון .NET שעובר ל-AWS צריך לא פעם SQS FIFO ועוד קוד, או Amazon MQ. Spanner נותן consistency חזקה וגלובלית, שבמקום אחר מקרבים אליה עם Aurora Global Database (replicas אסינכרוניים) או עם DSQL. במודל ה-RU של Cosmos DB צריך תכנון קיבולת, ש-DynamoDB במצב on-demand מסתיר. על שירותי האירועים לעומק תקרא ב-<code>cloud-event-services</code>.</p>`
      }
    },
    {
      h: { en: "AI platforms, pricing quirks, quotas and support", he: "פלטפורמות AI, מוזרויות תמחור, quotas ו-support" },
      body: {
        en: `<table>
<tr><th></th><th>AWS Bedrock</th><th>Microsoft Foundry (formerly Azure AI Foundry)</th><th>Google Vertex AI</th></tr>
<tr><td>Signature models</td><td>Many vendors behind one API: Anthropic Claude, Meta Llama, Mistral, Amazon Nova and others</td><td>OpenAI's flagship models hosted first-party (Azure OpenAI), plus a large catalog of other models</td><td>Gemini first-party, Model Garden (including Claude and open models)</td></tr>
<tr><td>Platform pieces</td><td>Knowledge Bases (RAG), Guardrails, AgentCore for agent runtimes, provisioned throughput</td><td>Agent service, content safety, provisioned throughput units (PTU), data-zone deployments</td><td>Pipelines, feature store, TPUs, strongest for custom training</td></tr>
</table>
<p>Microsoft announced the Foundry rename at Ignite in November 2025. In practice the model you need (and its regional availability and quota) often decides the platform more than any other feature.</p>
<p><strong>Pricing quirks that change architectures:</strong></p>
<ul>
<li><strong>Internet egress:</strong> AWS and Azure include the first 100 GB/month free, then roughly $0.09/GB for the first tiers; GCP prices differ by Premium vs Standard network tier. All three waive egress for customers fully migrating out (on request).</li>
<li><strong>Cross-AZ traffic:</strong> AWS and GCP charge about $0.01/GB in each direction between zones, so a chatty service spread over 3 AZs pays for every hop. Azure currently does not bill inter-zone traffic within a region (verify for your region).</li>
<li><strong>NAT:</strong> an AWS NAT Gateway bills hourly plus per GB processed (about $0.045 each in us-east-1); pulling images through it is a classic surprise. Use VPC endpoints for S3/ECR. See <code>cloud-data-transfer-costs</code>.</li>
<li><strong>Discounts:</strong> AWS Savings Plans and RIs; Azure reservations, savings plan, and <strong>Azure Hybrid Benefit</strong> (bring existing Windows Server and SQL Server licences, often the deciding factor for Microsoft-heavy shops); GCP sustained-use discounts applied automatically to some machine families, plus committed-use discounts.</li>
</ul>
<p><strong>Quotas and capacity:</strong> new AWS accounts start with low EC2 vCPU quotas per instance family (Service Quotas); Azure has per-subscription, per-region, per-VM-family vCPU quotas <em>and</em> separate capacity constraints, so a quota approval does not guarantee allocation (GPUs especially); GCP quotas are per project and region. File increases days before a launch and use capacity reservations for critical events. Paid support tiers on all three set response times; check current plan names and prices. For Israeli data residency, all three have a Tel Aviv region (AWS <code>il-central-1</code>, Azure Israel Central, GCP <code>me-west1</code>), but not every service is available in each; verify the service list before you commit.</p>`,
        he: `<table>
<tr><th></th><th>AWS Bedrock</th><th>Microsoft Foundry (לשעבר Azure AI Foundry)</th><th>Google Vertex AI</th></tr>
<tr><td>מודלים בולטים</td><td>הרבה ספקים מאחורי API אחד: Anthropic Claude, Meta Llama, Mistral, Amazon Nova ועוד</td><td>מודלי הדגל של OpenAI באירוח first-party (Azure OpenAI), ועוד קטלוג גדול של מודלים אחרים</td><td>Gemini באירוח first-party, Model Garden (כולל Claude ומודלים פתוחים)</td></tr>
<tr><td>רכיבי הפלטפורמה</td><td>Knowledge Bases (RAG), Guardrails, AgentCore להרצת agents, provisioned throughput</td><td>Agent service, content safety, provisioned throughput units (PTU), פריסות data-zone</td><td>Pipelines, feature store, TPUs, הכי חזק לאימון מותאם</td></tr>
</table>
<p>Microsoft הכריזו על השם Foundry ב-Ignite בנובמבר 2025. בפועל, המודל שאתה צריך (והזמינות וה-quota שלו ב-region) מכריע את הבחירה בפלטפורמה יותר מכל פיצ'ר אחר.</p>
<p><strong>מוזרויות תמחור שמשנות ארכיטקטורה:</strong></p>
<ul>
<li><strong>Egress לאינטרנט:</strong> ב-AWS וב-Azure ה-100 GB הראשונים בחודש בחינם, ואחר כך בערך $0.09 ל-GB במדרגות הראשונות. ב-GCP המחיר תלוי ב-network tier, Premium או Standard. שלושתם מוותרים על egress ללקוחות שעוזבים לגמרי (לפי בקשה).</li>
<li><strong>תעבורה בין AZs:</strong> AWS ו-GCP גובים בערך $0.01 ל-GB בכל כיוון בין zones, אז שירות פטפטן שפרוס על 3 AZs משלם על כל קפיצה. Azure לא מחייב כרגע על תעבורה בין zones בתוך region (בדוק ל-region שלך).</li>
<li><strong>NAT:</strong> NAT Gateway ב-AWS מחייב לפי שעה ועוד לפי GB שעובר דרכו (בערך $0.045 לכל אחד ב-us-east-1). משיכת images דרכו היא הפתעה קלאסית. תשתמש ב-VPC endpoints ל-S3 ול-ECR. ראה <code>cloud-data-transfer-costs</code>.</li>
<li><strong>הנחות:</strong> ב-AWS יש Savings Plans ו-RIs. ב-Azure יש reservations, savings plan, ו-<strong>Azure Hybrid Benefit</strong>: מביאים רישיונות קיימים של Windows Server ו-SQL Server, ובארגונים כבדי Microsoft זה לא פעם מה שמכריע. ב-GCP יש sustained-use discounts שמוחלים אוטומטית על חלק ממשפחות המכונות, ועוד committed-use discounts.</li>
</ul>
<p><strong>Quotas וקיבולת:</strong> accounts חדשים ב-AWS מתחילים עם quotas נמוכים של vCPU ל-EC2 לכל משפחת instances (דרך Service Quotas). ב-Azure יש quotas של vCPU לכל subscription, region ומשפחת VM, <em>ובנפרד</em> מגבלות קיבולת. כלומר אישור quota לא מבטיח הקצאה, במיוחד ב-GPUs. ב-GCP ה-quotas הם לכל project ו-region. תגיש בקשות הגדלה כמה ימים לפני launch, ותשתמש ב-capacity reservations לאירועים קריטיים. לכל השלושה יש תוכניות support בתשלום עם זמני תגובה; בדוק את השמות והמחירים העדכניים. בשביל data residency בישראל, לכל השלושה יש region בתל אביב (AWS <code>il-central-1</code>, Azure Israel Central, GCP <code>me-west1</code>), אבל לא כל שירות זמין בכל אחד מהם. תבדוק את רשימת השירותים לפני שאתה מתחייב.</p>`
      }
    },
    {
      h: { en: "Where each is strongest, and answering \"why AWS over Azure?\"", he: "איפה כל אחד הכי חזק, ואיך עונים על \"למה AWS ולא Azure?\"" },
      body: {
        en: `<table>
<tr><th>Cloud</th><th>Strongest when you need</th><th>Watch out for</th></tr>
<tr><td>AWS</td><td>Breadth and depth of services, granular IAM, account-level isolation, the largest ecosystem and hiring pool, mature serverless and data services</td><td>Many ways to do one thing; networking costs (NAT, cross-AZ); you assemble more pieces yourself</td></tr>
<tr><td>Azure</td><td>Entra ID everywhere, Microsoft 365 and Windows/.NET/SQL Server estates, licence reuse, hybrid (Arc), enterprise procurement, OpenAI models</td><td>Regional capacity constraints, two permission systems (Entra roles and Azure RBAC), service maturity varies</td></tr>
<tr><td>GCP</td><td>BigQuery and data/ML, global network and load balancing, GKE, Spanner, a simpler project model</td><td>Smaller enterprise footprint and hiring pool, fewer niche services</td></tr>
</table>
<p><strong>How to answer "why AWS over Azure?" in an interview.</strong> Never bash a cloud; show a decision process. A strong answer has four parts:</p>
<ol>
<li><strong>Context first:</strong> "It depends on the workload and the organisation. Here is how I decided last time."</li>
<li><strong>Hard requirements:</strong> region and data residency, a specific managed service (Aurora, Bedrock model X), compliance, latency to customers.</li>
<li><strong>People and ecosystem:</strong> team skills, the identity system already in place (Entra pushes toward Azure), the SaaS and tooling around it, hiring.</li>
<li><strong>Total cost and risk:</strong> commitments and credits, licence reuse (Hybrid Benefit can flip the math), egress patterns, support and capacity.</li>
</ol>
<blockquote>💡 Example: "For a Kubernetes-heavy SaaS with a data team on Postgres and an AI feature built on a model available in Bedrock, I'd pick AWS: EKS plus Karpenter, Aurora, Bedrock in the same IAM model, and the larger pool of engineers who know it. If the customer base were Microsoft enterprises requiring Entra integration and the workload ran on SQL Server, Azure would win on identity and licences. I've worked in both, and the core skills transfer: IaC, OIDC federation, network design, cost control."</blockquote>`,
        he: `<table>
<tr><th>ענן</th><th>הכי חזק כשצריך</th><th>להיזהר מ-</th></tr>
<tr><td>AWS</td><td>רוחב ועומק של שירותים, IAM גרנולרי, בידוד ברמת account, האקוסיסטם ומאגר המגייסים הגדולים ביותר, serverless ושירותי data בשלים</td><td>הרבה דרכים לעשות דבר אחד; עלויות רשת (NAT, בין AZs); מרכיבים יותר חלקים לבד</td></tr>
<tr><td>Azure</td><td>Entra ID בכל מקום, סביבות Microsoft 365 ו-Windows/.NET/SQL Server, שימוש חוזר ברישיונות, hybrid (Arc), רכש ארגוני, מודלים של OpenAI</td><td>מגבלות קיבולת אזוריות, שתי מערכות הרשאות (roles של Entra ו-Azure RBAC), בשלות שירותים לא אחידה</td></tr>
<tr><td>GCP</td><td>BigQuery ו-data/ML, רשת ו-load balancing גלובליים, GKE, Spanner, מודל projects פשוט יותר</td><td>נוכחות ארגונית ומאגר מגייסים קטנים יותר, פחות שירותי נישה</td></tr>
</table>
<p><strong>איך עונים בראיון על "למה AWS ולא Azure?"</strong> אף פעם לא משמיצים ענן. מראים תהליך החלטה. לתשובה חזקה יש ארבעה חלקים:</p>
<ol>
<li><strong>קודם הקשר:</strong> "זה תלוי ב-workload ובארגון. ככה החלטתי בפעם האחרונה."</li>
<li><strong>דרישות קשיחות:</strong> region ו-data residency, שירות מנוהל ספציפי (Aurora, מודל מסוים ב-Bedrock), compliance, latency ללקוחות.</li>
<li><strong>אנשים ואקוסיסטם:</strong> הכישורים של הצוות, מערכת ה-identity שכבר קיימת (Entra דוחף ל-Azure), ה-SaaS והכלים מסביב, גיוס.</li>
<li><strong>עלות כוללת וסיכון:</strong> התחייבויות וקרדיטים, שימוש חוזר ברישיונות (Hybrid Benefit יכול להפוך את החשבון), דפוסי egress, support וקיבולת.</li>
</ol>
<blockquote>💡 דוגמה: "ל-SaaS שכבד על Kubernetes, עם צוות data על Postgres ופיצ'ר AI שבנוי על מודל שזמין ב-Bedrock, הייתי בוחר AWS: EKS עם Karpenter, Aurora, ו-Bedrock באותו מודל IAM, ועוד מאגר גדול יותר של מהנדסים שמכירים אותו. אם בסיס הלקוחות היה ארגוני Microsoft שדורשים אינטגרציה עם Entra, וה-workload היה רץ על SQL Server, Azure היה מנצח בגלל identity ורישיונות. עבדתי בשניהם, והכישורים המרכזיים עוברים: IaC, OIDC federation, תכנון רשת ושליטה בעלויות."</blockquote>`
      }
    }
  ],
  diagram: "AWS:   Org -> OU -> Account(VPC per region, subnet per AZ)          isolation = account\nAzure: Tenant -> MG -> Subscription -> Resource group (VNet per region) isolation = subscription\nGCP:   Org -> Folder -> Project ---- global VPC (subnet per region)    isolation = project",
  handsOn: [
    { cmd: "aws service-quotas get-service-quota --service-code ec2 --quota-code L-1216C47A --query 'Quota.Value'", what: { en: "Read your account's vCPU quota for On-Demand standard (A, C, D, H, I, M, R, T, Z) instances in the current region; new accounts are often surprisingly low.", he: "קורא את ה-quota של vCPU ב-account שלך ל-instances רגילים מסוג On-Demand (A, C, D, H, I, M, R, T, Z) ב-region הנוכחי. ב-accounts חדשים הוא לא פעם נמוך באופן מפתיע." } },
    { cmd: "az vm list-usage --location israelcentral -o table | grep -i 'Total Regional vCPUs\\|DSv5'", what: { en: "Azure: per-region vCPU quota and current use per VM family in your subscription.", he: "ב-Azure: ה-quota של vCPU לכל region, והשימוש הנוכחי לכל משפחת VM ב-subscription שלך." } },
    { cmd: "gcloud compute networks subnets list --network default --format='table(name,region,ipCidrRange)'", what: { en: "See one GCP VPC with subnets in many regions; the global VPC in one command.", he: "רואים VPC אחד של GCP עם subnets בהרבה regions. ה-VPC הגלובלי בפקודה אחת." } },
    { cmd: "aws ssm get-parameters-by-path --path /aws/service/global-infrastructure/regions/il-central-1/services --query 'Parameters[].Value' --output text", what: { en: "List which AWS services are available in the Tel Aviv region before you design around one.", he: "מציג אילו שירותי AWS זמינים ב-region של תל אביב, לפני שאתה מתכנן סביב שירות מסוים." } }
  ],
  mnemonic: {
    en: "Accounts, Tenant, Projects: AWS isolates by account, Azure organises by tenant and resource group, GCP connects the world in one VPC. Choose on Requirements, People, Cost (RPC).",
    he: "Accounts, Tenant, Projects: AWS מבודד לפי account, Azure מארגן לפי tenant ו-resource group, ו-GCP מחבר את העולם ב-VPC אחד. בוחרים לפי דרישות, אנשים ועלות."
  },
  pitfalls: [
    { en: "Assuming an AWS VPC spans regions like a GCP VPC. It does not; multi-region on AWS needs peering, Transit Gateway or Cloud WAN, and non-overlapping CIDRs planned from day one.", he: "להניח ש-VPC של AWS מתפרש על כמה regions כמו VPC של GCP. הוא לא. multi-region ב-AWS דורש peering, Transit Gateway או Cloud WAN, ותכנון CIDRs שלא חופפים מהיום הראשון." },
    { en: "Granting Contributor on an Azure storage account and expecting the app to read blobs. Control-plane roles do not grant data access; assign Storage Blob Data Reader/Contributor.", he: "לתת Contributor על storage account ב-Azure ולצפות שהאפליקציה תקרא blobs. roles של control plane לא נותנים גישה לנתונים. צריך להקצות Storage Blob Data Reader או Contributor." },
    { en: "Comparing list prices of compute only. Egress, cross-AZ traffic, NAT processing and licence reuse often decide the total; model the traffic pattern, not just the VMs.", he: "להשוות רק מחירון של compute. egress, תעבורה בין AZs, עיבוד ב-NAT ושימוש חוזר ברישיונות הם לא פעם מה שמכריע את הסכום. תמדל את דפוסי התעבורה, לא רק את ה-VMs." },
    { en: "Starting a new AWS project on App Runner because an older tutorial uses it. It closed to new customers on 30 April 2026; use ECS Express Mode, ECS on Fargate or Lambda.", he: "להתחיל פרויקט חדש ב-AWS על App Runner כי מדריך ישן משתמש בו. הוא נסגר ללקוחות חדשים ב-30 באפריל 2026. תשתמש ב-ECS Express Mode, ב-ECS על Fargate או ב-Lambda." }
  ],
  interview: [
    {
      q: { en: "Why would you choose AWS over Azure for a new platform?", he: "למה היית בוחר AWS ולא Azure לפלטפורמה חדשה?" },
      a: { en: "It depends on requirements, so I frame it as a decision: hard constraints (regions, residency, a must-have service), people (team skills, identity system, hiring), ecosystem, and total cost including egress, commitments and licences. For a cloud-native Kubernetes SaaS with Postgres and an AI feature I'd lean AWS for EKS plus Karpenter, Aurora, Bedrock and one IAM model, and account-level isolation for blast radius. If the company is an Entra and SQL Server shop selling to Microsoft enterprises, Azure's identity integration and Hybrid Benefit often win. The skills transfer either way.", he: "זה תלוי בדרישות, אז אני מציג את זה כהחלטה: אילוצים קשיחים (regions, residency, שירות שחייבים), אנשים (כישורי הצוות, מערכת ה-identity, גיוס), אקוסיסטם, ועלות כוללת כולל egress, התחייבויות ורישיונות. ל-SaaS מבוסס Kubernetes עם Postgres ופיצ'ר AI הייתי נוטה ל-AWS: EKS עם Karpenter, Aurora, Bedrock ומודל IAM אחד, ובידוד ברמת account בשביל ה-blast radius. אם החברה בנויה על Entra ו-SQL Server ומוכרת לארגוני Microsoft, האינטגרציה של Azure עם ה-identity ו-Hybrid Benefit מנצחים לא פעם. הכישורים עוברים בשני הכיוונים." }
    },
    {
      q: { en: "You need an active-active service in two regions with private connectivity between them. How does the design differ on GCP and AWS?", he: "צריך שירות active-active בשני regions עם חיבור פרטי ביניהם. במה התכנון שונה בין GCP ל-AWS?" },
      a: { en: "On GCP one global VPC already routes privately between regional subnets, and a global external Application Load Balancer gives one anycast IP with backends in both regions; the data layer could be Spanner for global consistency. On AWS each region has its own VPC with non-overlapping CIDRs, connected by inter-region peering or Transit Gateway peering; global entry is Route 53 latency or failover routing, or Global Accelerator, in front of regional ALBs; data is Aurora Global Database (async, one writer) or DynamoDB global tables or DSQL. More pieces on AWS, but stronger regional isolation.", he: "ב-GCP, VPC גלובלי אחד כבר מנתב באופן פרטי בין subnets אזוריים, ו-Global external Application Load Balancer נותן IP anycast אחד עם backends בשני ה-regions. שכבת הנתונים יכולה להיות Spanner בשביל consistency גלובלית. ב-AWS לכל region יש VPC משלו עם CIDRs שלא חופפים, שמחוברים ב-inter-region peering או peering בין Transit Gateways. הכניסה הגלובלית היא latency או failover routing ב-Route 53, או Global Accelerator, מול ALBs אזוריים. הנתונים ב-Aurora Global Database (אסינכרוני, writer אחד), ב-global tables של DynamoDB או ב-DSQL. יותר חלקים ב-AWS, אבל בידוד אזורי חזק יותר." }
    }
  ],
  quiz: [
    {
      q: { en: "Which cloud's VPC is a global resource with regional subnets?", he: "באיזה ענן ה-VPC הוא משאב גלובלי עם subnets אזוריים?" },
      options: [
        { en: "AWS", he: "AWS" },
        { en: "Azure", he: "Azure" },
        { en: "GCP", he: "GCP" },
        { en: "All three", he: "כל השלושה" }
      ],
      answer: 2,
      explain: { en: "GCP VPCs are global; AWS VPCs and Azure VNets are regional.", he: "VPC ב-GCP הוא גלובלי; VPC ב-AWS ו-VNet ב-Azure הם אזוריים." }
    },
    {
      q: { en: "An app with the Contributor role on an Azure storage account gets 403 reading a blob. Why?", he: "אפליקציה עם role של Contributor על storage account ב-Azure מקבלת 403 כשהיא קוראת blob. למה?" },
      options: [
        { en: "Contributor is a control-plane role; blob reads need a data-plane role such as Storage Blob Data Reader", he: "Contributor הוא role של control plane; קריאת blobs דורשת role של data plane כמו Storage Blob Data Reader" },
        { en: "Role assignments take 24 hours", he: "Role assignments לוקחים 24 שעות" },
        { en: "Blobs can only be read with account keys", he: "אפשר לקרוא blobs רק עם account keys" },
        { en: "Contributor is denied by default on storage", he: "Contributor חסום כברירת מחדל על storage" }
      ],
      answer: 0,
      explain: { en: "Azure splits management (control plane) from data access (data plane). Propagation can take minutes, not 24 hours.", he: "Azure מפריד בין ניהול (control plane) לגישה לנתונים (data plane). ההתפשטות יכולה לקחת דקות, לא 24 שעות." }
    },
    {
      q: { en: "What happened to AWS App Runner in 2026?", he: "מה קרה ל-AWS App Runner ב-2026?" },
      options: [
        { en: "It was shut down for everyone", he: "הוא נסגר לכולם" },
        { en: "It closed to new customers on 30 April 2026; existing customers continue, with ECS Express Mode recommended instead", he: "הוא נסגר ללקוחות חדשים ב-30 באפריל 2026; לקוחות קיימים ממשיכים, ו-ECS Express Mode מומלץ במקומו" },
        { en: "It was merged into Lambda", he: "הוא אוחד לתוך Lambda" },
        { en: "Nothing changed", he: "שום דבר לא השתנה" }
      ],
      answer: 1,
      explain: { en: "AWS's availability notice closes App Runner to new customers without a shutdown date and points to ECS Express Mode.", he: "הודעת הזמינות של AWS סוגרת את App Runner ללקוחות חדשים בלי תאריך כיבוי, ומפנה ל-ECS Express Mode." }
    },
    {
      q: { en: "For a Microsoft-heavy enterprise with many SQL Server and Windows Server licences, which factor most often tips the cost comparison toward Azure?", he: "בארגון כבד Microsoft עם הרבה רישיונות של SQL Server ו-Windows Server, איזה גורם מטה לרוב את השוואת העלויות לטובת Azure?" },
      options: [
        { en: "Free internet egress", he: "Egress חינמי לאינטרנט" },
        { en: "Sustained-use discounts", he: "Sustained-use discounts" },
        { en: "Azure Hybrid Benefit (reusing existing licences)", he: "Azure Hybrid Benefit (שימוש חוזר ברישיונות קיימים)" },
        { en: "Lower control-plane fees for AKS", he: "עלויות נמוכות יותר ל-control plane של AKS" }
      ],
      answer: 2,
      explain: { en: "Hybrid Benefit lets you apply existing licences to Azure VMs and SQL, removing a large licence component of the price. Sustained-use discounts are a GCP feature.", he: "Hybrid Benefit מאפשר להחיל רישיונות קיימים על VMs ועל SQL ב-Azure, וכך יורד רכיב רישוי גדול מהמחיר. Sustained-use discounts הם פיצ'ר של GCP." }
    }
  ],
  related: ["cloud-provider-map", "cloud-managed-k8s-compare", "cloud-landing-zones", "cloud-data-transfer-costs", "cloud-event-services", "cloud-aws-iam-deep", "cloud-serverless", "cloud-commitments"]
});

/* ------------------------------------------------------------------ */
[
  ["CDKTF", "CDK for Terraform: wrote Terraform configs in TypeScript/Python and synthesized JSON. HashiCorp deprecated and archived it on 10 December 2025; the exit is cdktf synth --hcl to plain HCL, or a move to Pulumi.", "CDK for Terraform: כתיבת קונפיגורציה של Terraform ב-TypeScript או Python ויצירת JSON. HashiCorp סימנו אותו deprecated והעבירו ל-archive ב-10 בדצמבר 2025. היציאה היא cdktf synth --hcl ל-HCL רגיל, או מעבר ל-Pulumi.", "iac-side-by-side"],
  ["Deployment stack", "Azure resource that tracks a managed set of resources from a Bicep/ARM deployment, deletes or detaches resources removed from the template (actionOnUnmanage) and can deny out-of-band changes.", "משאב ב-Azure שעוקב אחרי סט מנוהל של משאבים מ-deployment של Bicep או ARM. הוא מוחק או מנתק משאבים שהוסרו מה-template (actionOnUnmanage), ויכול לחסום שינויים מבחוץ.", "iac-side-by-side"],
  ["use_lockfile", "Terraform S3 backend option (GA in 1.11) that locks state with a .tflock object written by an S3 conditional write, replacing the deprecated DynamoDB lock table.", "אפשרות ב-backend של S3 ב-Terraform (GA מגרסה 1.11) שנועלת את ה-state עם אובייקט .tflock שנכתב ב-conditional write של S3. מחליפה את טבלת ה-lock של DynamoDB, שסומנה deprecated.", "terraform-production-workflow"],
  ["Terragrunt", "Thin wrapper around Terraform/OpenTofu that generates backend config per directory, passes outputs between states with dependency blocks and runs commands across a tree of states.", "Wrapper דק מעל Terraform או OpenTofu. מייצר קונפיגורציית backend לכל תיקייה, מעביר outputs בין states עם בלוקים של dependency, ומריץ פקודות על עץ שלם של states.", "terraform-production-workflow"],
  ["Argo CD Image Updater", "Argo CD add-on that watches a container registry for new images matching a policy and writes the new tag or digest back to Git (or to the Application) so Argo CD deploys it.", "תוסף ל-Argo CD שעוקב אחרי container registry, מזהה images חדשים שתואמים ל-policy, וכותב את ה-tag או ה-digest החדש חזרה ל-Git (או ל-Application) כדי ש-Argo CD יפרוס אותו.", "cicd-aws-eks-pipeline"],
  ["Global VPC", "GCP's network model: one VPC spans all regions with regional subnets, so VMs in different regions talk over private IPs with no peering or transit layer.", "מודל הרשת של GCP: VPC אחד מתפרש על כל ה-regions עם subnets אזוריים, כך ש-VMs ב-regions שונים מדברים ב-IPs פרטיים בלי peering ובלי שכבת transit.", "cloud-big3-services-compare"]
].forEach(([term, en, he, lesson]) => window.INFRA.glossary.push({ term, track: "cloud", def: { en, he }, lesson }));
