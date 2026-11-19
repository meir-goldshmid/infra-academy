// Official sources per lesson id, shown as "Go deeper: official sources".
// Each list: 2-4 official docs / RFCs / man pages / project docs. Check with: node tools/check-refs.js [id]
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
INFRA.refs = {
  "ai-agent-evals": [
    {"t":"Anthropic docs: Define success criteria and build evaluations","u":"https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests"},
    {"t":"Anthropic: Demystifying evals for AI agents","u":"https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents"},
    {"t":"OpenTelemetry: GenAI semantic conventions","u":"https://opentelemetry.io/docs/specs/semconv/gen-ai/"}
  ],
  "ai-agent-infra-mcp": [
    {"t":"Model Context Protocol specification","u":"https://modelcontextprotocol.io/specification/latest"},
    {"t":"MCP docs: Introduction","u":"https://modelcontextprotocol.io/docs/getting-started/intro"},
    {"t":"Anthropic: Building effective agents","u":"https://www.anthropic.com/engineering/building-effective-agents"}
  ],
  "ai-agent-runtime": [
    {"t":"Anthropic docs: Tool use overview","u":"https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview"},
    {"t":"Anthropic: Building effective agents","u":"https://www.anthropic.com/engineering/building-effective-agents"},
    {"t":"gVisor docs","u":"https://gvisor.dev/docs/"},
    {"t":"Firecracker microVM","u":"https://firecracker-microvm.github.io/"}
  ],
  "ai-agents-patterns": [
    {"t":"Anthropic: Building effective agents","u":"https://www.anthropic.com/research/building-effective-agents"},
    {"t":"Yao et al.: ReAct (paper)","u":"https://arxiv.org/abs/2210.03629"},
    {"t":"Anthropic docs: Tool use overview","u":"https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"}
  ],
  "ai-aiops-oncall": [
    {"t":"Google SRE book: Effective Troubleshooting","u":"https://sre.google/sre-book/effective-troubleshooting/"},
    {"t":"Google SRE book: Being On-Call","u":"https://sre.google/sre-book/being-on-call/"},
    {"t":"Google SRE book: Monitoring Distributed Systems","u":"https://sre.google/sre-book/monitoring-distributed-systems/"}
  ],
  "ai-assisted-engineering": [
    {"t":"Anthropic: Claude Code overview","u":"https://docs.anthropic.com/en/docs/claude-code/overview"},
    {"t":"Anthropic: Claude Code security","u":"https://docs.anthropic.com/en/docs/claude-code/security"},
    {"t":"DORA: Capabilities","u":"https://dora.dev/capabilities/"}
  ],
  "ai-finetune-vs-rag": [
    {"t":"Anthropic docs: Prompt engineering overview","u":"https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"},
    {"t":"Paper: Retrieval-Augmented Generation (Lewis et al.)","u":"https://arxiv.org/abs/2005.11401"},
    {"t":"Paper: LoRA","u":"https://arxiv.org/abs/2106.09685"}
  ],
  "ai-gateway-design": [
    {"t":"LiteLLM docs: Proxy","u":"https://docs.litellm.ai/docs/simple_proxy"},
    {"t":"Anthropic docs: Rate limits","u":"https://docs.anthropic.com/en/api/rate-limits"},
    {"t":"Anthropic docs: Prompt caching","u":"https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"},
    {"t":"OpenTelemetry: GenAI semantic conventions","u":"https://opentelemetry.io/docs/specs/semconv/gen-ai/"}
  ],
  "ai-gpu-clusters": [
    {"t":"Paper: ZeRO memory optimizations","u":"https://arxiv.org/abs/1910.02054"},
    {"t":"Paper: Megatron-LM scaling","u":"https://arxiv.org/abs/2104.04473"},
    {"t":"NVIDIA docs: NCCL user guide","u":"https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/index.html"}
  ],
  "ai-llm-serving": [
    {"t":"vLLM docs: PagedAttention","u":"https://docs.vllm.ai/en/latest/design/paged_attention/"},
    {"t":"Kwon et al.: PagedAttention (paper)","u":"https://arxiv.org/abs/2309.06180"},
    {"t":"Dao et al.: FlashAttention (paper)","u":"https://arxiv.org/abs/2205.14135"}
  ],
  "ai-llmops": [
    {"t":"OpenTelemetry: GenAI semantic conventions","u":"https://opentelemetry.io/docs/specs/semconv/gen-ai/"},
    {"t":"Anthropic docs: Develop tests (evals)","u":"https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"},
    {"t":"LiteLLM docs: Proxy server","u":"https://docs.litellm.ai/docs/simple_proxy"}
  ],
  "ai-mcp-servers": [
    {"t":"MCP: Specification","u":"https://modelcontextprotocol.io/specification/2026-07-28"},
    {"t":"MCP: Security best practices","u":"https://modelcontextprotocol.io/docs/draft/tutorials/security/security_best_practices"},
    {"t":"MCP: Authorization","u":"https://modelcontextprotocol.io/specification/draft/basic/authorization"}
  ],
  "ai-platform-paved-road": [
    {"t":"Anthropic docs: Models overview","u":"https://docs.anthropic.com/en/docs/about-claude/models/overview"},
    {"t":"Anthropic docs: Prompt caching","u":"https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"},
    {"t":"CNCF: Platforms White Paper","u":"https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
    {"t":"Backstage docs: What is Backstage","u":"https://backstage.io/docs/overview/what-is-backstage"}
  ],
  "ai-rag-deep": [
    {"t":"Anthropic: Contextual Retrieval","u":"https://www.anthropic.com/research/contextual-retrieval"},
    {"t":"Lewis et al.: RAG (paper)","u":"https://arxiv.org/abs/2005.11401"},
    {"t":"Cormack et al.: Reciprocal Rank Fusion","u":"https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf"}
  ],
  "ai-security-practice": [
    {"t":"OWASP: Top 10 for LLM Applications","u":"https://owasp.org/www-project-top-10-for-large-language-model-applications/"},
    {"t":"OWASP: LLM Prompt Injection Prevention Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"},
    {"t":"NIST: AI Risk Management Framework","u":"https://www.nist.gov/itl/ai-risk-management-framework"}
  ],
  "algo-edit-distance": [
    {"t":"Wikipedia: Levenshtein distance","u":"https://en.wikipedia.org/wiki/Levenshtein_distance"},
    {"t":"Elasticsearch docs: Fuzzy query","u":"https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html"},
    {"t":"PostgreSQL docs: pg_trgm","u":"https://www.postgresql.org/docs/current/pgtrgm.html"}
  ],
  "algo-search-ranking": [
    {"t":"Elastic: Practical BM25 (algorithm and variables)","u":"https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables"},
    {"t":"Stanford CS276: Information Retrieval and Web Search","u":"https://web.stanford.edu/class/cs276/"}
  ],
  "algo-similarity-dedup": [
    {"t":"Paper: HyperLogLog (Flajolet et al.)","u":"https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf"},
    {"t":"Redis docs: Bloom filter","u":"https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/"}
  ],
  "ansible-hands-on": [
    {"t":"Ansible docs: Intro to playbooks","u":"https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_intro.html"},
    {"t":"Ansible docs: Roles","u":"https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html"},
    {"t":"Ansible docs: Vault","u":"https://docs.ansible.com/ansible/latest/vault_guide/index.html"},
    {"t":"Ansible docs: Building an inventory","u":"https://docs.ansible.com/ansible/latest/inventory_guide/intro_inventory.html"}
  ],
  "api-gateway-production": [
    {"t":"Kubernetes docs: Gateway API","u":"https://kubernetes.io/docs/concepts/services-networking/gateway/"},
    {"t":"Gateway API project docs","u":"https://gateway-api.sigs.k8s.io/"},
    {"t":"Envoy docs: Global rate limiting","u":"https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting"}
  ],
  "arch-api-gateway": [
    {"t":"microservices.io: API Gateway pattern","u":"https://microservices.io/patterns/apigateway.html"},
    {"t":"Istio docs: Architecture","u":"https://istio.io/latest/docs/ops/deployment/architecture/"},
    {"t":"Sam Newman: Backends for Frontends","u":"https://samnewman.io/patterns/architectural/bff/"}
  ],
  "arch-brokers": [
    {"t":"Apache Kafka docs: Introduction","u":"https://kafka.apache.org/documentation/#introduction"},
    {"t":"RabbitMQ docs: AMQP 0-9-1 concepts","u":"https://www.rabbitmq.com/tutorials/amqp-concepts"},
    {"t":"AWS docs: What is Amazon SNS","u":"https://docs.aws.amazon.com/sns/latest/dg/welcome.html"}
  ],
  "arch-caching": [
    {"t":"Redis docs: Key eviction","u":"https://redis.io/docs/latest/develop/reference/eviction/"},
    {"t":"AWS: Caching best practices","u":"https://aws.amazon.com/caching/best-practices/"},
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"}
  ],
  "arch-durable-execution": [
    {"t":"Temporal docs: What is Temporal","u":"https://docs.temporal.io/temporal"},
    {"t":"Temporal docs: Workflow Definition","u":"https://docs.temporal.io/workflow-definition"},
    {"t":"Celery docs: Tasks","u":"https://docs.celeryq.dev/en/stable/userguide/tasks.html"},
    {"t":"Microsoft Learn: Saga pattern","u":"https://learn.microsoft.com/en-us/azure/architecture/patterns/saga"}
  ],
  "arch-event-driven": [
    {"t":"Martin Fowler: Event Sourcing","u":"https://martinfowler.com/eaaDev/EventSourcing.html"},
    {"t":"Martin Fowler: CQRS","u":"https://martinfowler.com/bliki/CQRS.html"},
    {"t":"microservices.io: Saga pattern","u":"https://microservices.io/patterns/data/saga.html"},
    {"t":"microservices.io: Transactional outbox","u":"https://microservices.io/patterns/data/transactional-outbox.html"}
  ],
  "arch-feature-flags": [
    {"t":"Martin Fowler: Feature Toggles","u":"https://martinfowler.com/articles/feature-toggles.html"},
    {"t":"OpenFeature docs: Introduction","u":"https://openfeature.dev/docs/reference/intro/"},
    {"t":"Martin Fowler: Canary Release","u":"https://martinfowler.com/bliki/CanaryRelease.html"}
  ],
  "arch-graphql-production": [
    {"t":"GraphQL: Best practices","u":"https://graphql.org/learn/best-practices/"},
    {"t":"GraphQL: Specification","u":"https://spec.graphql.org/October2021/"},
    {"t":"OWASP: GraphQL Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html"}
  ],
  "arch-monolith-vs-microservices": [
    {"t":"Martin Fowler: Microservices","u":"https://martinfowler.com/articles/microservices.html"},
    {"t":"Martin Fowler: MonolithFirst","u":"https://martinfowler.com/bliki/MonolithFirst.html"},
    {"t":"microservices.io: Microservice architecture","u":"https://microservices.io/patterns/microservices.html"}
  ],
  "arch-queues": [
    {"t":"AWS docs: SQS dead-letter queues","u":"https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"},
    {"t":"RabbitMQ docs: Reliability Guide","u":"https://www.rabbitmq.com/docs/reliability"},
    {"t":"AWS docs: SQS visibility timeout","u":"https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"}
  ],
  "arch-resilience": [
    {"t":"Google SRE book: Handling Overload","u":"https://sre.google/sre-book/handling-overload/"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"},
    {"t":"Martin Fowler: Circuit Breaker","u":"https://martinfowler.com/bliki/CircuitBreaker.html"},
    {"t":"AWS Builders Library: Timeouts, retries and backoff with jitter","u":"https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"}
  ],
  "arch-scaling": [
    {"t":"AKF Partners: The Scale Cube","u":"https://akfpartners.com/growth-blog/scale-cube"},
    {"t":"Google SRE book: Load Balancing at the Frontend","u":"https://sre.google/sre-book/load-balancing-frontend/"},
    {"t":"AWS Well-Architected: Performance Efficiency Pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html"}
  ],
  "arch-service-discovery": [
    {"t":"Kubernetes docs: DNS for Services and Pods","u":"https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/"},
    {"t":"Consul docs: Service discovery","u":"https://developer.hashicorp.com/consul/docs/use-case/service-discovery"},
    {"t":"RFC 2782: DNS SRV","u":"https://www.rfc-editor.org/rfc/rfc2782"}
  ],
  "arch-sync-vs-async": [
    {"t":"Martin Fowler: What do you mean by Event-Driven?","u":"https://martinfowler.com/articles/201701-event-driven.html"},
    {"t":"microservices.io: Messaging","u":"https://microservices.io/patterns/communication-style/messaging.html"},
    {"t":"Enterprise Integration Patterns: Messaging","u":"https://www.enterpriseintegrationpatterns.com/patterns/messaging/"}
  ],
  "arch-wasm-edge": [
    {"t":"WebAssembly: Core specification","u":"https://webassembly.github.io/spec/core/"},
    {"t":"WASI: Introduction","u":"https://wasi.dev/"},
    {"t":"Cloudflare docs: How Workers works","u":"https://developers.cloudflare.com/workers/reference/how-workers-works/"}
  ],
  "atomics-optimistic-concurrency": [
    {"t":"Kubernetes docs: API concepts (resource versions)","u":"https://kubernetes.io/docs/reference/using-api/api-concepts/#resource-versions"},
    {"t":"Go: sync/atomic","u":"https://pkg.go.dev/sync/atomic"},
    {"t":"etcd docs: API guarantees","u":"https://etcd.io/docs/latest/learning/api_guarantees/"}
  ],
  "aws-detective-security": [
    {"t":"Amazon GuardDuty: Finding types","u":"https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-active.html"},
    {"t":"AWS Security Hub CSPM: Introduction","u":"https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html"},
    {"t":"IAM Access Analyzer: Using AWS IAM Access Analyzer","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html"}
  ],
  "aws-ec2-auto-scaling": [
    {"t":"Amazon EC2 Auto Scaling: Choose your scaling method","u":"https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html"},
    {"t":"Amazon EC2 Auto Scaling: Lifecycle hooks","u":"https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html"},
    {"t":"Amazon EC2 Auto Scaling: Use an instance refresh","u":"https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-instance-refresh.html"}
  ],
  "aws-eks-production": [
    {"t":"EKS Best Practices Guides","u":"https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html"},
    {"t":"eksctl docs","u":"https://eksctl.io/"},
    {"t":"EKS docs: What is Amazon EKS","u":"https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html"}
  ],
  "aws-for-azure-engineers": [
    {"t":"Microsoft Learn: Azure and AWS services comparison","u":"https://learn.microsoft.com/en-us/azure/architecture/aws-professional/services"},
    {"t":"AWS docs: IAM user guide","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"},
    {"t":"AWS docs: What is Amazon VPC","u":"https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html"}
  ],
  "aws-networking-edge": [
    {"t":"AWS docs: What is Transit Gateway","u":"https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html"},
    {"t":"AWS docs: What is AWS PrivateLink","u":"https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html"},
    {"t":"Route 53 docs: Choosing a routing policy","u":"https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html"}
  ],
  "bits-bytes-units": [
    {"t":"NIST: Prefixes for binary multiples","u":"https://physics.nist.gov/cuu/Units/binary.html"},
    {"t":"Wikipedia: Binary prefix","u":"https://en.wikipedia.org/wiki/Binary_prefix"},
    {"t":"AWS docs: EBS volume types","u":"https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html"}
  ],
  "caching-deep": [
    {"t":"Redis docs: Client-side caching","u":"https://redis.io/docs/latest/develop/clients/client-side-caching/"},
    {"t":"Redis docs: Eviction","u":"https://redis.io/docs/latest/develop/reference/eviction/"},
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"},
    {"t":"AWS Builders Library: Caching challenges and strategies","u":"https://aws.amazon.com/builders-library/caching-challenges-and-strategies/"}
  ],
  "cdn-production": [
    {"t":"CloudFront docs: Understand the cache key","u":"https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html"},
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"},
    {"t":"CloudFront docs: Origin Shield","u":"https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html"},
    {"t":"CloudFront docs: Invalidate files","u":"https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html"}
  ],
  "cicd-aws-eks-pipeline": [
    {"t":"GitHub docs: OIDC in Amazon Web Services","u":"https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services"},
    {"t":"Amazon ECR user guide","u":"https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html"},
    {"t":"Argo CD docs: Understand the basics","u":"https://argo-cd.readthedocs.io/en/stable/understand_the_basics/"},
    {"t":"GitHub docs: Understanding GitHub Actions","u":"https://docs.github.com/en/actions/get-started/understand-github-actions"}
  ],
  "cicd-github-actions": [
    {"t":"GitHub docs: Security hardening for GitHub Actions","u":"https://docs.github.com/en/actions/reference/security/secure-use"},
    {"t":"GitHub docs: OpenID Connect","u":"https://docs.github.com/en/actions/concepts/security/openid-connect"},
    {"t":"GitHub docs: Workflow syntax","u":"https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax"}
  ],
  "cloud-ai-platforms": [
    {"t":"AWS docs: What is Amazon Bedrock","u":"https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html"},
    {"t":"Microsoft Learn: What is Azure OpenAI","u":"https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure"},
    {"t":"Google Cloud docs: Vertex AI overview","u":"https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning"}
  ],
  "cloud-airgapped": [
    {"t":"Kubernetes docs: Pull an image from a private registry","u":"https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/"},
    {"t":"Harbor docs","u":"https://goharbor.io/docs/"},
    {"t":"RKE2 docs: Air-Gap install","u":"https://docs.rke2.io/install/airgap"},
    {"t":"Sigstore docs","u":"https://docs.sigstore.dev/"}
  ],
  "cloud-aws-iam-deep": [
    {"t":"AWS docs: Policy evaluation logic","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html"},
    {"t":"AWS docs: Permissions boundaries","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html"},
    {"t":"AWS docs: Service control policies","u":"https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html"}
  ],
  "cloud-big3-services-compare": [
    {"t":"Microsoft Learn: Azure and AWS services comparison","u":"https://learn.microsoft.com/en-us/azure/architecture/aws-professional/services"},
    {"t":"Google Cloud: AWS, Azure, GCP service comparison","u":"https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison"},
    {"t":"AWS Well-Architected Framework","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"}
  ],
  "cloud-cicd": [
    {"t":"Argo CD docs","u":"https://argo-cd.readthedocs.io/en/stable/"},
    {"t":"OpenGitOps: Principles","u":"https://opengitops.dev/"},
    {"t":"GitHub Actions docs: Understanding GitHub Actions","u":"https://docs.github.com/en/actions/get-started/understanding-github-actions"}
  ],
  "cloud-commitments": [
    {"t":"AWS docs: Savings Plans","u":"https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html"},
    {"t":"GCP docs: Committed use discounts","u":"https://cloud.google.com/docs/cuds"},
    {"t":"FinOps Foundation: Framework","u":"https://www.finops.org/framework/"}
  ],
  "cloud-data-transfer-costs": [
    {"t":"AWS: EC2 data transfer pricing","u":"https://aws.amazon.com/ec2/pricing/on-demand/"},
    {"t":"AWS docs: VPC endpoints","u":"https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html"},
    {"t":"GCP docs: Network pricing","u":"https://cloud.google.com/vpc/network-pricing"}
  ],
  "cloud-engineer-access": [
    {"t":"AWS docs: Session Manager","u":"https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html"},
    {"t":"AWS docs: IAM Identity Center","u":"https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html"},
    {"t":"Google Research: BeyondCorp","u":"https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/"}
  ],
  "cloud-event-services": [
    {"t":"AWS docs: What is Amazon SQS","u":"https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html"},
    {"t":"AWS docs: What is EventBridge","u":"https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html"},
    {"t":"Google Cloud docs: Pub/Sub overview","u":"https://docs.cloud.google.com/pubsub/docs/overview"}
  ],
  "cloud-finops": [
    {"t":"FinOps Foundation: Framework","u":"https://www.finops.org/framework/"},
    {"t":"AWS: Cost Optimization Pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html"},
    {"t":"AWS: EC2 purchasing options","u":"https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html"}
  ],
  "cloud-hybrid-edge": [
    {"t":"AWS Storage Gateway User Guide: What is Storage Gateway?","u":"https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html"},
    {"t":"AWS Outposts User Guide: What is AWS Outposts?","u":"https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html"},
    {"t":"AWS Local Zones User Guide: What is AWS Local Zones?","u":"https://docs.aws.amazon.com/local-zones/latest/ug/what-is-aws-local-zones.html"}
  ],
  "cloud-iac": [
    {"t":"Terraform docs: Introduction","u":"https://developer.hashicorp.com/terraform/intro"},
    {"t":"Terraform docs: State","u":"https://developer.hashicorp.com/terraform/language/state"},
    {"t":"Terraform docs: Modules","u":"https://developer.hashicorp.com/terraform/language/modules"}
  ],
  "cloud-iam-security": [
    {"t":"AWS IAM: Security best practices","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"},
    {"t":"AWS IAM: Policy evaluation logic","u":"https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html"},
    {"t":"Azure RBAC overview","u":"https://learn.microsoft.com/en-us/azure/role-based-access-control/overview"}
  ],
  "cloud-landing-zones": [
    {"t":"AWS Whitepaper: Organizing your AWS environment","u":"https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html"},
    {"t":"AWS docs: Service control policies","u":"https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html"},
    {"t":"Microsoft Learn: Azure landing zones","u":"https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/"}
  ],
  "cloud-managed-k8s-compare": [
    {"t":"AWS docs: What is Amazon EKS","u":"https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html"},
    {"t":"Microsoft Learn: AKS core concepts","u":"https://learn.microsoft.com/en-us/azure/aks/core-aks-concepts"},
    {"t":"Google Cloud docs: GKE overview","u":"https://docs.cloud.google.com/kubernetes-engine/docs/concepts/kubernetes-engine-overview"}
  ],
  "cloud-migration-strategy": [
    {"t":"AWS Prescriptive Guidance: Migration strategies (the 7 Rs)","u":"https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html"},
    {"t":"AWS Transform MGN User Guide: What is MGN?","u":"https://docs.aws.amazon.com/mgn/latest/ug/what-is-mgn.html"},
    {"t":"AWS DMS User Guide: Creating tasks for ongoing replication (CDC)","u":"https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Task.CDC.html"}
  ],
  "cloud-models": [
    {"t":"NIST SP 800-145: Definition of Cloud Computing","u":"https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf"},
    {"t":"AWS: Shared Responsibility Model","u":"https://aws.amazon.com/compliance/shared-responsibility-model/"},
    {"t":"Azure: Shared responsibility in the cloud","u":"https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility"}
  ],
  "cloud-provider-map": [
    {"t":"Azure: Azure for AWS professionals","u":"https://learn.microsoft.com/en-us/azure/architecture/aws-professional/services"},
    {"t":"Google Cloud: AWS, Azure, GCP service comparison","u":"https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison"}
  ],
  "cloud-regions-azs": [
    {"t":"AWS docs: Regions and Availability Zones","u":"https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html"},
    {"t":"Azure: Regions and availability zones","u":"https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview"},
    {"t":"Google Cloud: Geography and regions","u":"https://cloud.google.com/docs/geography-and-regions"}
  ],
  "cloud-secrets-management": [
    {"t":"Vault docs: Lease, Renew, and Revoke","u":"https://developer.hashicorp.com/vault/docs/concepts/lease"},
    {"t":"AWS Secrets Manager: Rotate secrets","u":"https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html"},
    {"t":"Kubernetes docs: Good practices for Secrets","u":"https://kubernetes.io/docs/concepts/security/secrets-good-practices/"}
  ],
  "cloud-serverless": [
    {"t":"AWS Lambda: Developer Guide","u":"https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"},
    {"t":"AWS Lambda: Execution environment lifecycle","u":"https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html"},
    {"t":"Google Cloud Run docs","u":"https://cloud.google.com/run/docs/overview/what-is-cloud-run"}
  ],
  "cloud-spot-instances": [
    {"t":"AWS docs: Spot Instances","u":"https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html"},
    {"t":"AWS docs: Spot Instance interruptions","u":"https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html"},
    {"t":"GCP docs: Spot VMs","u":"https://cloud.google.com/compute/docs/instances/spot"}
  ],
  "cloud-storage": [
    {"t":"AWS docs: Amazon S3 User Guide","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"},
    {"t":"AWS docs: EBS volume types","u":"https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html"},
    {"t":"AWS docs: What is Amazon EFS","u":"https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html"}
  ],
  "cloud-storage-lifecycle": [
    {"t":"AWS docs: S3 storage classes","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"},
    {"t":"AWS docs: S3 Lifecycle","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html"},
    {"t":"AWS docs: S3 Replication","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html"}
  ],
  "cloud-well-architected": [
    {"t":"AWS Well-Architected Framework","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/framework.html"},
    {"t":"Microsoft Learn: Azure Well-Architected Framework","u":"https://learn.microsoft.com/en-us/azure/well-architected/"},
    {"t":"Google Cloud: Architecture Framework","u":"https://docs.cloud.google.com/architecture/framework"}
  ],
  "compilers-how-code-runs": [
    {"t":"Crafting Interpreters","u":"https://craftinginterpreters.com/"},
    {"t":"V8 docs: TurboFan","u":"https://v8.dev/docs/turbofan"},
    {"t":"Python docs: dis module","u":"https://docs.python.org/3/library/dis.html"}
  ],
  "compliance-for-engineers": [
    {"t":"AICPA: SOC 2","u":"https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"},
    {"t":"NIST: SP 800-53 Rev. 5","u":"https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"},
    {"t":"AWS: Compliance programs","u":"https://aws.amazon.com/compliance/programs/"}
  ],
  "container-builds-buildkit": [
    {"t":"Docker docs: BuildKit","u":"https://docs.docker.com/build/buildkit/"},
    {"t":"Docker docs: Build cache","u":"https://docs.docker.com/build/cache/"},
    {"t":"Docker docs: Multi-platform builds","u":"https://docs.docker.com/build/building/multi-platform/"}
  ],
  "container-internals": [
    {"t":"man7: namespaces(7)","u":"https://man7.org/linux/man-pages/man7/namespaces.7.html"},
    {"t":"man7: cgroups(7)","u":"https://man7.org/linux/man-pages/man7/cgroups.7.html"},
    {"t":"Docker docs: OverlayFS storage driver","u":"https://docs.docker.com/engine/storage/drivers/overlayfs-driver/"}
  ],
  "container-registries": [
    {"t":"OCI: Distribution Spec","u":"https://github.com/opencontainers/distribution-spec/blob/main/spec.md"},
    {"t":"Docker docs: Registry mirror","u":"https://docs.docker.com/docker-hub/image-library/mirror/"}
  ],
  "container-runtimes-oci": [
    {"t":"OCI: Runtime Spec","u":"https://github.com/opencontainers/runtime-spec/blob/main/spec.md"},
    {"t":"OCI: Image Spec","u":"https://github.com/opencontainers/image-spec/blob/main/spec.md"},
    {"t":"containerd docs: Getting started","u":"https://github.com/containerd/containerd/blob/main/docs/getting-started.md"}
  ],
  "container-sbom-101": [
    {"t":"CISA: Software Bill of Materials (SBOM)","u":"https://www.cisa.gov/sbom"},
    {"t":"CycloneDX: Specification overview","u":"https://cyclonedx.org/specification/overview/"},
    {"t":"Sigstore docs: Signing containers with cosign","u":"https://docs.sigstore.dev/cosign/signing/signing_with_containers/"},
    {"t":"CISA: Known Exploited Vulnerabilities Catalog","u":"https://www.cisa.gov/known-exploited-vulnerabilities-catalog"}
  ],
  "container-security": [
    {"t":"Docker docs: Docker Engine security","u":"https://docs.docker.com/engine/security/"},
    {"t":"OWASP: Docker Security Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html"},
    {"t":"Docker docs: Rootless mode","u":"https://docs.docker.com/engine/security/rootless/"}
  ],
  "container-slim-images": [
    {"t":"Docker docs: Multi-stage builds","u":"https://docs.docker.com/build/building/multi-stage/"},
    {"t":"Google distroless README","u":"https://github.com/GoogleContainerTools/distroless"},
    {"t":"Chainguard Academy: Wolfi overview","u":"https://www.chainguard.dev/supply-chain-security-101/wolfi-overview"}
  ],
  "cpu": [
    {"t":"Linux kernel docs: Pressure Stall Information","u":"https://docs.kernel.org/accounting/psi.html"},
    {"t":"man7: sched(7)","u":"https://man7.org/linux/man-pages/man7/sched.7.html"}
  ],
  "crypto-encryption-practice": [
    {"t":"OWASP: Cryptographic Storage Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"},
    {"t":"AWS docs: KMS concepts (envelope encryption)","u":"https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html"},
    {"t":"RFC 5116: AEAD","u":"https://www.rfc-editor.org/rfc/rfc5116"}
  ],
  "crypto-hashing-practice": [
    {"t":"OWASP: Password Storage Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"},
    {"t":"RFC 9106: Argon2","u":"https://www.rfc-editor.org/rfc/rfc9106"},
    {"t":"NIST: FIPS 180-4 SHS","u":"https://csrc.nist.gov/pubs/fips/180-4/upd1/final"}
  ],
  "data-cdc-debezium": [
    {"t":"Debezium docs: Architecture","u":"https://debezium.io/documentation/reference/stable/architecture.html"},
    {"t":"Debezium docs: PostgreSQL connector","u":"https://debezium.io/documentation/reference/stable/connectors/postgresql.html"},
    {"t":"PostgreSQL docs: Logical Decoding","u":"https://www.postgresql.org/docs/current/logicaldecoding.html"}
  ],
  "data-contracts-schema-registry": [
    {"t":"Confluent: Schema Registry concepts","u":"https://docs.confluent.io/platform/current/schema-registry/fundamentals/index.html"},
    {"t":"Confluent: Schema evolution and compatibility","u":"https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html"},
    {"t":"Avro: Specification","u":"https://avro.apache.org/docs/current/specification/"}
  ],
  "data-lakehouse-formats": [
    {"t":"Apache Iceberg: Table spec","u":"https://iceberg.apache.org/spec/"},
    {"t":"Delta Lake docs","u":"https://docs.delta.io/latest/index.html"},
    {"t":"Apache Hudi: Overview","u":"https://hudi.apache.org/docs/overview"}
  ],
  "data-quality-observability": [
    {"t":"Great Expectations docs","u":"https://docs.greatexpectations.io/docs/"},
    {"t":"OpenLineage docs","u":"https://openlineage.io/docs/"},
    {"t":"Airflow docs: Logging and Monitoring","u":"https://airflow.apache.org/docs/apache-airflow/stable/administration-and-deployment/logging-monitoring/index.html"}
  ],
  "data-stream-processing": [
    {"t":"Flink docs: Stateful Stream Processing","u":"https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/"},
    {"t":"Flink docs: Timely Stream Processing","u":"https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/"},
    {"t":"Kafka docs: Kafka Streams","u":"https://kafka.apache.org/documentation/streams/"}
  ],
  "data-wrangling-for-engineers": [
    {"t":"pandas docs: User guide","u":"https://pandas.pydata.org/docs/user_guide/index.html"},
    {"t":"DuckDB docs","u":"https://duckdb.org/docs/"},
    {"t":"Polars user guide","u":"https://docs.pola.rs/"},
    {"t":"NumPy docs: Broadcasting","u":"https://numpy.org/doc/stable/user/basics.broadcasting.html"}
  ],
  "datacenter-bare-metal": [
    {"t":"Google SRE book: The Production Environment","u":"https://sre.google/sre-book/production-environment/"},
    {"t":"OpenStack Ironic docs: Bare Metal service","u":"https://docs.openstack.org/ironic/latest/"},
    {"t":"Metal3 docs: Bare metal host management","u":"https://metal3.io/documentation.html"}
  ],
  "db-backups": [
    {"t":"PostgreSQL docs: Continuous Archiving and PITR","u":"https://www.postgresql.org/docs/current/continuous-archiving.html"},
    {"t":"PostgreSQL docs: Backup and Restore","u":"https://www.postgresql.org/docs/current/backup.html"},
    {"t":"AWS docs: RDS Point-in-time recovery","u":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html"}
  ],
  "db-cap": [
    {"t":"Brewer: CAP Twelve Years Later","u":"https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/"},
    {"t":"Dynamo paper (Amazon)","u":"https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"},
    {"t":"Jepsen: Consistency Models","u":"https://jepsen.io/consistency"}
  ],
  "db-graph": [
    {"t":"Neo4j docs: Cypher manual","u":"https://neo4j.com/docs/cypher-manual/current/introduction/"},
    {"t":"Neo4j docs: Graph database concepts","u":"https://neo4j.com/docs/getting-started/get-started-with-neo4j/graph-database/"},
    {"t":"W3C: RDF 1.1 Primer","u":"https://www.w3.org/TR/rdf11-primer/"}
  ],
  "db-index-kinds": [
    {"t":"PostgreSQL docs: Indexes","u":"https://www.postgresql.org/docs/current/indexes.html"},
    {"t":"PostgreSQL docs: Index Types","u":"https://www.postgresql.org/docs/current/indexes-types.html"},
    {"t":"PostgreSQL docs: Partial Indexes","u":"https://www.postgresql.org/docs/current/indexes-partial.html"}
  ],
  "db-indexes": [
    {"t":"PostgreSQL docs: Indexes","u":"https://www.postgresql.org/docs/current/indexes.html"},
    {"t":"PostgreSQL docs: Index Types","u":"https://www.postgresql.org/docs/current/indexes-types.html"},
    {"t":"PostgreSQL docs: Using EXPLAIN","u":"https://www.postgresql.org/docs/current/using-explain.html"}
  ],
  "db-managed-cloud": [
    {"t":"AWS docs: Aurora storage and reliability","u":"https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html"},
    {"t":"Google Cloud docs: Cloud SQL high availability","u":"https://docs.cloud.google.com/sql/docs/postgres/high-availability"}
  ],
  "db-mongodb": [
    {"t":"MongoDB docs: Replication","u":"https://www.mongodb.com/docs/manual/replication/"},
    {"t":"MongoDB docs: Sharding","u":"https://www.mongodb.com/docs/manual/sharding/"},
    {"t":"MongoDB docs: Indexes","u":"https://www.mongodb.com/docs/manual/indexes/"}
  ],
  "db-olap-columnar": [
    {"t":"ClickHouse docs: MergeTree","u":"https://clickhouse.com/docs/reference/engines/table-engines/mergetree-family/mergetree"},
    {"t":"Apache Parquet docs: File format","u":"https://parquet.apache.org/docs/file-format/"},
    {"t":"Google Cloud docs: BigQuery storage overview","u":"https://docs.cloud.google.com/bigquery/docs/storage_overview"}
  ],
  "db-operations": [
    {"t":"PostgreSQL docs: Routine Vacuuming","u":"https://www.postgresql.org/docs/current/routine-vacuuming.html"},
    {"t":"PostgreSQL docs: Monitoring Database Activity","u":"https://www.postgresql.org/docs/current/monitoring.html"},
    {"t":"PostgreSQL docs: Server Configuration","u":"https://www.postgresql.org/docs/current/runtime-config.html"}
  ],
  "db-partitioning": [
    {"t":"PostgreSQL docs: Table Partitioning","u":"https://www.postgresql.org/docs/current/ddl-partitioning.html"},
    {"t":"Citus docs: Choosing distribution column","u":"https://docs.citusdata.com/en/stable/sharding/data_modeling.html"}
  ],
  "db-postgres-ha-patroni": [
    {"t":"Patroni docs","u":"https://patroni.readthedocs.io/en/latest/"},
    {"t":"PostgreSQL docs: High Availability","u":"https://www.postgresql.org/docs/current/high-availability.html"},
    {"t":"PostgreSQL docs: Log-Shipping Standby Servers","u":"https://www.postgresql.org/docs/current/warm-standby.html"}
  ],
  "db-query-debugging": [
    {"t":"PostgreSQL docs: Using EXPLAIN","u":"https://www.postgresql.org/docs/current/using-explain.html"},
    {"t":"PostgreSQL docs: pg_stat_statements","u":"https://www.postgresql.org/docs/current/pgstatstatements.html"},
    {"t":"PostgreSQL docs: Explicit Locking","u":"https://www.postgresql.org/docs/current/explicit-locking.html"}
  ],
  "db-replication": [
    {"t":"PostgreSQL docs: High Availability, Load Balancing, Replication","u":"https://www.postgresql.org/docs/current/high-availability.html"},
    {"t":"PostgreSQL docs: Log-Shipping Standby Servers","u":"https://www.postgresql.org/docs/current/warm-standby.html"}
  ],
  "db-restore-runbook": [
    {"t":"PostgreSQL docs: Continuous Archiving and PITR","u":"https://www.postgresql.org/docs/current/continuous-archiving.html"},
    {"t":"PostgreSQL docs: Backup and Restore","u":"https://www.postgresql.org/docs/current/backup.html"},
    {"t":"AWS RDS docs: Restoring to a point in time","u":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html"}
  ],
  "db-search-engines": [
    {"t":"Elasticsearch docs: Text analysis","u":"https://www.elastic.co/docs/manage-data/data-store/text-analysis"},
    {"t":"Elasticsearch docs: Index modules","u":"https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules"},
    {"t":"OpenSearch docs: Index settings","u":"https://docs.opensearch.org/latest/install-and-configure/configuring-opensearch/index-settings/"}
  ],
  "db-sharding": [
    {"t":"PostgreSQL docs: Table Partitioning","u":"https://www.postgresql.org/docs/current/ddl-partitioning.html"},
    {"t":"Vitess docs: Sharding","u":"https://vitess.io/docs/reference/features/sharding/"},
    {"t":"MongoDB docs: Sharding","u":"https://www.mongodb.com/docs/manual/sharding/"}
  ],
  "db-sql-vs-nosql": [
    {"t":"Werner Vogels: Amazon's Dynamo","u":"https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html"},
    {"t":"PostgreSQL docs: JSON types","u":"https://www.postgresql.org/docs/current/datatype-json.html"},
    {"t":"AWS docs: DynamoDB core components","u":"https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html"},
    {"t":"MongoDB docs: Data modeling","u":"https://www.mongodb.com/docs/manual/data-modeling/"}
  ],
  "db-storage-engines": [
    {"t":"PostgreSQL docs: B-Tree Indexes","u":"https://www.postgresql.org/docs/current/btree.html"},
    {"t":"RocksDB wiki: Overview","u":"https://github.com/meta/rocksdb/wiki/RocksDB-Overview"}
  ],
  "db-time-series": [
    {"t":"TimescaleDB docs: Hypertables","u":"https://www.tigerdata.com/docs/learn/hypertables/understand-hypertables"},
    {"t":"Prometheus docs: Storage","u":"https://prometheus.io/docs/prometheus/latest/storage/"},
    {"t":"InfluxDB docs: Schema design","u":"https://docs.influxdata.com/influxdb/v2/write-data/best-practices/schema-design/"}
  ],
  "db-transactions": [
    {"t":"PostgreSQL docs: Transaction Isolation","u":"https://www.postgresql.org/docs/current/transaction-iso.html"},
    {"t":"PostgreSQL docs: Explicit Locking","u":"https://www.postgresql.org/docs/current/explicit-locking.html"},
    {"t":"PostgreSQL docs: Concurrency Control","u":"https://www.postgresql.org/docs/current/mvcc.html"}
  ],
  "db-vector": [
    {"t":"pgvector README","u":"https://github.com/pgvector/pgvector"},
    {"t":"Malkov and Yashunin: HNSW (paper)","u":"https://arxiv.org/abs/1603.09320"},
    {"t":"OpenSearch docs: Vector search","u":"https://docs.opensearch.org/latest/search-plugins/vector-search/"}
  ],
  "db-wide-column-kv": [
    {"t":"AWS DynamoDB docs: Partitions and data distribution","u":"https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html"},
    {"t":"Cassandra docs: Dynamo architecture","u":"https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html"},
    {"t":"Amazon: Dynamo paper (SOSP 2007)","u":"https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"}
  ],
  "disks-hdd-ssd-nvme": [
    {"t":"NVMe: Specifications","u":"https://nvmexpress.org/specifications/"},
    {"t":"Linux kernel docs: Multi-queue block IO","u":"https://docs.kernel.org/block/blk-mq.html"},
    {"t":"fio docs","u":"https://fio.readthedocs.io/en/latest/fio_doc.html"}
  ],
  "distributed-storage-ceph": [
    {"t":"Ceph docs: Architecture","u":"https://docs.ceph.com/en/latest/architecture/"},
    {"t":"Ceph paper: CRUSH","u":"https://ceph.com/assets/pdfs/weil-crush-sc06.pdf"},
    {"t":"RFC 7143: iSCSI","u":"https://datatracker.ietf.org/doc/html/rfc7143"}
  ],
  "docker-compose": [
    {"t":"Docker docs: Compose file reference","u":"https://docs.docker.com/reference/compose-file/"},
    {"t":"Docker docs: Compose overview","u":"https://docs.docker.com/compose/"},
    {"t":"Docker docs: Control startup order","u":"https://docs.docker.com/compose/how-tos/startup-order/"}
  ],
  "docker-images": [
    {"t":"Docker docs: Multi-stage builds","u":"https://docs.docker.com/build/building/multi-stage/"},
    {"t":"Docker docs: Dockerfile best practices","u":"https://docs.docker.com/build/building/best-practices/"},
    {"t":"Docker docs: Dockerfile reference","u":"https://docs.docker.com/reference/dockerfile/"}
  ],
  "docker-run": [
    {"t":"Docker docs: docker container run","u":"https://docs.docker.com/reference/cli/docker/container/run/"},
    {"t":"Docker docs: Volumes","u":"https://docs.docker.com/engine/storage/volumes/"},
    {"t":"Docker docs: Networking overview","u":"https://docs.docker.com/engine/network/"}
  ],
  "docker-why": [
    {"t":"Docker docs: What is a container?","u":"https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/"},
    {"t":"OCI: Runtime Spec","u":"https://github.com/opencontainers/runtime-spec/blob/main/spec.md"},
    {"t":"Docker docs: What is an image?","u":"https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/"}
  ],
  "dora-metrics": [
    {"t":"DORA: Four key metrics","u":"https://dora.dev/guides/dora-metrics/"},
    {"t":"DORA: Capabilities","u":"https://dora.dev/capabilities/"}
  ],
  "ebpf-ecosystem": [
    {"t":"Cilium docs","u":"https://docs.cilium.io/en/stable/"},
    {"t":"Falco docs","u":"https://falco.org/docs/"},
    {"t":"Tetragon docs","u":"https://tetragon.io/docs/"}
  ],
  "ebpf-fundamentals": [
    {"t":"ebpf.io: What is eBPF","u":"https://ebpf.io/what-is-ebpf/"},
    {"t":"Linux kernel docs: BPF","u":"https://docs.kernel.org/bpf/index.html"},
    {"t":"man7: bpf(2)","u":"https://man7.org/linux/man-pages/man2/bpf.2.html"}
  ],
  "faas-vs-container-serverless": [
    {"t":"AWS Lambda developer guide","u":"https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"},
    {"t":"Google Cloud: What is Cloud Run","u":"https://cloud.google.com/run/docs/overview/what-is-cloud-run"},
    {"t":"Microsoft Learn: Azure Container Apps overview","u":"https://learn.microsoft.com/en-us/azure/container-apps/overview"},
    {"t":"Amazon ECS docs: AWS Fargate","u":"https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html"}
  ],
  "filesystems-compared": [
    {"t":"Linux kernel docs: ext4","u":"https://docs.kernel.org/filesystems/ext4/index.html"},
    {"t":"OpenZFS docs","u":"https://openzfs.github.io/openzfs-docs/"},
    {"t":"Linux kernel docs: XFS","u":"https://docs.kernel.org/filesystems/xfs/index.html"}
  ],
  "flow-alert-to-postmortem": [
    {"t":"Google SRE Book: Postmortem Culture","u":"https://sre.google/sre-book/postmortem-culture/"},
    {"t":"Google SRE Book: Managing Incidents","u":"https://sre.google/sre-book/managing-incidents/"},
    {"t":"Google SRE Workbook: Alerting on SLOs","u":"https://sre.google/workbook/alerting-on-slos/"}
  ],
  "flow-checkout-payment": [
    {"t":"Stripe docs: Idempotent requests","u":"https://docs.stripe.com/api/idempotent_requests"},
    {"t":"Stripe docs: Webhooks","u":"https://docs.stripe.com/webhooks"},
    {"t":"microservices.io: Saga pattern","u":"https://microservices.io/patterns/data/saga.html"}
  ],
  "flow-commit-to-prod": [
    {"t":"SLSA: Specification","u":"https://slsa.dev/spec/v1.0/"},
    {"t":"Sigstore docs: Cosign signing overview","u":"https://docs.sigstore.dev/cosign/signing/overview/"},
    {"t":"Argo CD docs: Overview","u":"https://argo-cd.readthedocs.io/en/stable/"}
  ],
  "flow-event-pipeline": [
    {"t":"Kafka docs: Introduction","u":"https://kafka.apache.org/documentation/#introduction"},
    {"t":"ClickHouse docs: Architecture overview","u":"https://clickhouse.com/docs/resources/develop-contribute/introduction/architecture"},
    {"t":"Kafka docs: Design","u":"https://kafka.apache.org/documentation/#design"}
  ],
  "flow-file-upload": [
    {"t":"AWS S3 docs: Sharing objects with presigned URLs","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html"},
    {"t":"AWS S3 docs: Uploading and copying objects using multipart upload","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html"},
    {"t":"AWS S3 docs: Event notifications","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html"}
  ],
  "flow-k8s-pod-lifecycle": [
    {"t":"Kubernetes docs: Pod Lifecycle","u":"https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"},
    {"t":"Kubernetes docs: Kubernetes Components","u":"https://kubernetes.io/docs/concepts/overview/components/"},
    {"t":"Kubernetes docs: Service","u":"https://kubernetes.io/docs/concepts/services-networking/service/"}
  ],
  "flow-llm-request": [
    {"t":"OWASP: Top 10 for LLM Applications","u":"https://owasp.org/projects/top-10-for-large-language-model-applications"},
    {"t":"Anthropic docs: Streaming Messages","u":"https://platform.claude.com/docs/en/build-with-claude/streaming"},
    {"t":"Anthropic docs: Tool use overview","u":"https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"}
  ],
  "flow-login-sso": [
    {"t":"OpenID Connect Core 1.0","u":"https://openid.net/specs/openid-connect-core-1_0.html"},
    {"t":"RFC 7636: PKCE","u":"https://www.rfc-editor.org/rfc/rfc7636.html"},
    {"t":"W3C: Web Authentication Level 2","u":"https://www.w3.org/TR/webauthn-2/"}
  ],
  "flow-tenant-onboarding": [
    {"t":"AWS Well-Architected: SaaS Lens","u":"https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html"},
    {"t":"Microsoft Learn: Multitenant SaaS architecture","u":"https://learn.microsoft.com/en-us/azure/architecture/guide/saas-multitenant-solution-architecture/"},
    {"t":"Microsoft Learn: Tenancy models for multitenant solutions","u":"https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models"}
  ],
  "flow-url-to-page": [
    {"t":"MDN: How the web works","u":"https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works"},
    {"t":"RFC 1034: Domain Names concepts","u":"https://www.rfc-editor.org/rfc/rfc1034.html"},
    {"t":"RFC 8446: TLS 1.3","u":"https://www.rfc-editor.org/rfc/rfc8446.html"}
  ],
  "fs-filesystems-raid": [
    {"t":"man7: filesystems(5)","u":"https://man7.org/linux/man-pages/man5/filesystems.5.html"},
    {"t":"kernel.org: ext4 admin guide","u":"https://www.kernel.org/doc/html/latest/admin-guide/ext4.html"},
    {"t":"man7: lvm(8)","u":"https://man7.org/linux/man-pages/man8/lvm.8.html"}
  ],
  "git-debugging": [
    {"t":"Git docs: git-bisect","u":"https://git-scm.com/docs/git-bisect"},
    {"t":"Git docs: git-blame","u":"https://git-scm.com/docs/git-blame"},
    {"t":"Git docs: git-worktree","u":"https://git-scm.com/docs/git-worktree"}
  ],
  "git-hosting-compare": [
    {"t":"GitHub docs: About protected branches","u":"https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches"},
    {"t":"GitLab docs: CI/CD","u":"https://docs.gitlab.com/ee/ci/"},
    {"t":"Azure DevOps docs: What is Azure Pipelines","u":"https://learn.microsoft.com/en-us/azure/devops/pipelines/get-started/what-is-azure-pipelines"}
  ],
  "git-internals": [
    {"t":"Pro Git: Git Objects","u":"https://git-scm.com/book/en/v2/Git-Internals-Git-Objects"},
    {"t":"Pro Git: Git References","u":"https://git-scm.com/book/en/v2/Git-Internals-Git-References"},
    {"t":"Git docs: gitglossary","u":"https://git-scm.com/docs/gitglossary"}
  ],
  "git-large-repos": [
    {"t":"Git docs: git-sparse-checkout","u":"https://git-scm.com/docs/git-sparse-checkout"},
    {"t":"Git docs: partial-clone","u":"https://git-scm.com/docs/partial-clone"},
    {"t":"Git docs: scalar","u":"https://git-scm.com/docs/scalar"}
  ],
  "git-repo-security": [
    {"t":"GitHub docs: About secret scanning","u":"https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning"},
    {"t":"GitHub docs: Securing your repository","u":"https://docs.github.com/en/code-security/getting-started/securing-your-repository"},
    {"t":"Pro Git: Signing Your Work","u":"https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work"}
  ],
  "git-undo-rescue": [
    {"t":"Pro Git: Reset Demystified","u":"https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified"},
    {"t":"Git docs: git-reflog","u":"https://git-scm.com/docs/git-reflog"},
    {"t":"GitHub docs: Removing sensitive data","u":"https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"}
  ],
  "git-workflow": [
    {"t":"Pro Git: Basic Branching and Merging","u":"https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging"},
    {"t":"Pro Git: Rebasing","u":"https://git-scm.com/book/en/v2/Git-Branching-Rebasing"},
    {"t":"Git docs: git-rebase","u":"https://git-scm.com/docs/git-rebase"}
  ],
  "go-concurrency": [
    {"t":"Effective Go: Concurrency","u":"https://go.dev/doc/effective_go#concurrency"},
    {"t":"Go blog: Pipelines and cancellation","u":"https://go.dev/blog/pipelines"},
    {"t":"Go: context package","u":"https://pkg.go.dev/context"},
    {"t":"Go: The Go Memory Model","u":"https://go.dev/ref/mem"}
  ],
  "go-platform-toolbox": [
    {"t":"client-go package docs","u":"https://pkg.go.dev/k8s.io/client-go"},
    {"t":"controller-runtime package docs","u":"https://pkg.go.dev/sigs.k8s.io/controller-runtime"},
    {"t":"The Kubebuilder Book","u":"https://book.kubebuilder.io/"},
    {"t":"Cobra docs","u":"https://cobra.dev/"}
  ],
  "http-status-errors": [
    {"t":"RFC 9110: HTTP Semantics","u":"https://www.rfc-editor.org/rfc/rfc9110"},
    {"t":"MDN: HTTP response status codes","u":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"},
    {"t":"NGINX docs: ngx_http_proxy_module","u":"https://nginx.org/en/docs/http/ngx_http_proxy_module.html"}
  ],
  "iac-landscape": [
    {"t":"Terraform docs: Introduction","u":"https://developer.hashicorp.com/terraform/intro"},
    {"t":"OpenTofu docs","u":"https://opentofu.org/docs/"},
    {"t":"Pulumi docs: Concepts","u":"https://www.pulumi.com/docs/iac/concepts/"}
  ],
  "iac-side-by-side": [
    {"t":"Terraform docs","u":"https://developer.hashicorp.com/terraform/docs"},
    {"t":"Microsoft Learn: What is Bicep","u":"https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview"},
    {"t":"Pulumi docs: concepts","u":"https://www.pulumi.com/docs/iac/concepts/"},
    {"t":"AWS CDK developer guide","u":"https://docs.aws.amazon.com/cdk/v2/guide/home.html"}
  ],
  "infra-data-structures": [
    {"t":"Redis docs: Bloom filter","u":"https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/"},
    {"t":"RocksDB wiki: Overview","u":"https://github.com/facebook/rocksdb/wiki/RocksDB-Overview"},
    {"t":"PostgreSQL docs: B-Tree Indexes","u":"https://www.postgresql.org/docs/current/btree.html"}
  ],
  "iot-fleets-ota": [
    {"t":"AWS IoT Core docs: Device Shadow service","u":"https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html"},
    {"t":"OASIS: MQTT 5.0 specification","u":"https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html"},
    {"t":"AWS IoT Core docs: Jobs","u":"https://docs.aws.amazon.com/iot/latest/developerguide/iot-jobs.html"},
    {"t":"The Update Framework (TUF) specification","u":"https://theupdateframework.github.io/specification/latest/"}
  ],
  "istio-in-production": [
    {"t":"Istio docs: Traffic Management","u":"https://istio.io/latest/docs/concepts/traffic-management/"},
    {"t":"Istio docs: Security (mTLS)","u":"https://istio.io/latest/docs/concepts/security/"},
    {"t":"Istio docs: Debugging Envoy and Istiod","u":"https://istio.io/latest/docs/ops/diagnostic-tools/proxy-cmd/"}
  ],
  "jvm-dotnet-go-web": [
    {"t":"Spring Boot docs: Actuator","u":"https://docs.spring.io/spring-boot/reference/actuator/index.html"},
    {"t":"Microsoft docs: Kestrel web server","u":"https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel"},
    {"t":"Go docs: net/http","u":"https://pkg.go.dev/net/http"}
  ],
  "k8s-architecture": [
    {"t":"Kubernetes docs: Cluster Architecture","u":"https://kubernetes.io/docs/concepts/architecture/"},
    {"t":"Kubernetes docs: Kubernetes Components","u":"https://kubernetes.io/docs/concepts/overview/components/"},
    {"t":"etcd docs: Why etcd","u":"https://etcd.io/docs/latest/learning/why/"}
  ],
  "k8s-argo-rollouts": [
    {"t":"Argo Rollouts docs","u":"https://argo-rollouts.readthedocs.io/en/stable/"},
    {"t":"Argo Rollouts docs: Canary","u":"https://argo-rollouts.readthedocs.io/en/stable/features/canary/"},
    {"t":"Argo Rollouts docs: Analysis","u":"https://argo-rollouts.readthedocs.io/en/stable/features/analysis/"}
  ],
  "k8s-argocd": [
    {"t":"Argo CD docs: Sync Options","u":"https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/"},
    {"t":"Argo CD docs: ApplicationSet","u":"https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/"},
    {"t":"Argo CD docs: Declarative Setup","u":"https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/"}
  ],
  "k8s-autoscaling": [
    {"t":"Kubernetes docs: Horizontal Pod Autoscaling","u":"https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/"},
    {"t":"Karpenter docs","u":"https://karpenter.sh/docs/"},
    {"t":"KEDA docs","u":"https://keda.sh/docs/"}
  ],
  "k8s-cluster-lifecycle-kubeadm": [
    {"t":"Kubernetes docs: Upgrading kubeadm clusters","u":"https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/"},
    {"t":"Kubernetes docs: Certificate Management with kubeadm","u":"https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/"},
    {"t":"Kubernetes docs: Operating etcd clusters for Kubernetes","u":"https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/"}
  ],
  "k8s-cluster-observability": [
    {"t":"Prometheus docs: Alerting rules","u":"https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/"},
    {"t":"Kubernetes docs: Metrics for system components","u":"https://kubernetes.io/docs/concepts/cluster-administration/system-metrics/"},
    {"t":"Kubernetes docs: Logging Architecture","u":"https://kubernetes.io/docs/concepts/cluster-administration/logging/"},
    {"t":"kube-state-metrics docs","u":"https://github.com/kubernetes/kube-state-metrics/tree/main/docs"}
  ],
  "k8s-config": [
    {"t":"Kubernetes docs: ConfigMaps","u":"https://kubernetes.io/docs/concepts/configuration/configmap/"},
    {"t":"Kubernetes docs: Secrets","u":"https://kubernetes.io/docs/concepts/configuration/secret/"},
    {"t":"Kubernetes docs: Encrypting Secret Data at Rest","u":"https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/"}
  ],
  "k8s-cost": [
    {"t":"OpenCost docs","u":"https://opencost.io/docs/"},
    {"t":"FinOps Foundation: Framework","u":"https://www.finops.org/framework/"},
    {"t":"Kubernetes docs: Resource Management for Pods and Containers","u":"https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"}
  ],
  "k8s-day2-upgrades": [
    {"t":"Kubernetes docs: Version Skew Policy","u":"https://kubernetes.io/releases/version-skew-policy/"},
    {"t":"Kubernetes docs: Disruptions (PDB)","u":"https://kubernetes.io/docs/concepts/workloads/pods/disruptions/"},
    {"t":"Kubernetes docs: Operating etcd clusters","u":"https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/"},
    {"t":"Velero docs","u":"https://velero.io/docs/"}
  ],
  "k8s-debugging": [
    {"t":"Kubernetes docs: Debug Running Pods","u":"https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/"},
    {"t":"Kubernetes docs: Debug Pods","u":"https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/"},
    {"t":"Kubernetes docs: Debug Services","u":"https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/"}
  ],
  "k8s-deployments": [
    {"t":"Kubernetes docs: Deployments","u":"https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"},
    {"t":"Kubernetes docs: ReplicaSet","u":"https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/"},
    {"t":"Kubernetes docs: Performing a Rolling Update","u":"https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/"}
  ],
  "k8s-etcd-apf": [
    {"t":"Kubernetes docs: API Priority and Fairness","u":"https://kubernetes.io/docs/concepts/cluster-administration/flow-control/"},
    {"t":"etcd docs: Maintenance","u":"https://etcd.io/docs/v3.5/op-guide/maintenance/"},
    {"t":"Kubernetes docs: Operating etcd clusters","u":"https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/"}
  ],
  "k8s-events-audit": [
    {"t":"Kubernetes docs: Auditing","u":"https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/"},
    {"t":"Kubernetes API: Event v1","u":"https://kubernetes.io/docs/reference/kubernetes-api/core/event-v1/"},
    {"t":"Kubernetes docs: Audit Policy API","u":"https://kubernetes.io/docs/reference/config-api/apiserver-audit.v1/"}
  ],
  "k8s-fleet-upgrades": [
    {"t":"Kubernetes docs: Version skew policy","u":"https://kubernetes.io/releases/version-skew-policy/"},
    {"t":"Kubernetes docs: Upgrading kubeadm clusters","u":"https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/"},
    {"t":"Kubernetes docs: Deprecated API Migration Guide","u":"https://kubernetes.io/docs/reference/using-api/deprecation-guide/"}
  ],
  "k8s-gitops-at-scale": [
    {"t":"Argo CD docs: ApplicationSet","u":"https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/"},
    {"t":"OpenGitOps principles","u":"https://opengitops.dev/"},
    {"t":"Argo CD docs: Cluster bootstrapping","u":"https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/"}
  ],
  "k8s-gpu-inference": [
    {"t":"Kubernetes docs: Schedule GPUs","u":"https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/"},
    {"t":"NVIDIA GPU Operator docs","u":"https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html"},
    {"t":"vLLM docs","u":"https://docs.vllm.ai/en/latest/"},
    {"t":"NVIDIA: MIG user guide","u":"https://docs.nvidia.com/datacenter/tesla/mig-user-guide/index.html"}
  ],
  "k8s-helm-deep": [
    {"t":"Helm docs: Chart Template Guide","u":"https://helm.sh/docs/chart_template_guide/"},
    {"t":"Helm docs: Chart Best Practices","u":"https://helm.sh/docs/chart_best_practices/"},
    {"t":"Helm docs: helm template","u":"https://helm.sh/docs/helm/helm_template/"}
  ],
  "k8s-helm-gitops": [
    {"t":"Helm docs","u":"https://helm.sh/docs/"},
    {"t":"Kustomize docs","u":"https://kubectl.docs.kubernetes.io/references/kustomize/"},
    {"t":"Argo CD docs","u":"https://argo-cd.readthedocs.io/en/stable/"},
    {"t":"OpenGitOps: Principles","u":"https://opengitops.dev/"}
  ],
  "k8s-hpa-deep": [
    {"t":"Kubernetes docs: Horizontal Pod Autoscaling","u":"https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/"},
    {"t":"Kubernetes docs: HPA Walkthrough","u":"https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/"},
    {"t":"Kubernetes docs: Resize CPU and Memory Resources assigned to Container","u":"https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/"},
    {"t":"Kubernetes autoscaler: Vertical Pod Autoscaler","u":"https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler"}
  ],
  "k8s-ingress-certs-dns": [
    {"t":"Kubernetes docs: Gateway API","u":"https://kubernetes.io/docs/concepts/services-networking/gateway/"},
    {"t":"cert-manager docs","u":"https://cert-manager.io/docs/"},
    {"t":"ExternalDNS docs","u":"https://kubernetes-sigs.github.io/external-dns/latest/"},
    {"t":"Gateway API docs","u":"https://gateway-api.sigs.k8s.io/"}
  ],
  "k8s-jobs-cronjobs": [
    {"t":"Kubernetes docs: Jobs","u":"https://kubernetes.io/docs/concepts/workloads/controllers/job/"},
    {"t":"Kubernetes docs: CronJob","u":"https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/"},
    {"t":"Kubernetes docs: Pod Failure Policy for Jobs","u":"https://kubernetes.io/docs/tasks/job/pod-failure-policy/"}
  ],
  "k8s-keda": [
    {"t":"KEDA docs: Concepts","u":"https://keda.sh/docs/latest/concepts/"},
    {"t":"KEDA docs: ScaledObject spec","u":"https://keda.sh/docs/latest/reference/scaledobject-spec/"},
    {"t":"KEDA docs: Scalers","u":"https://keda.sh/docs/latest/scalers/"}
  ],
  "k8s-kubectl-power-tips": [
    {"t":"Kubernetes docs: kubectl Quick Reference","u":"https://kubernetes.io/docs/reference/kubectl/quick-reference/"},
    {"t":"Kubernetes docs: JSONPath Support","u":"https://kubernetes.io/docs/reference/kubectl/jsonpath/"},
    {"t":"Kubernetes docs: Debug Running Pods","u":"https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/"}
  ],
  "k8s-multi-cluster": [
    {"t":"Istio docs: Deployment models (multicluster)","u":"https://istio.io/latest/docs/ops/deployment/deployment-models/"},
    {"t":"Cilium docs: Cluster Mesh","u":"https://docs.cilium.io/en/stable/network/clustermesh/clustermesh/"},
    {"t":"Kubernetes docs: Service","u":"https://kubernetes.io/docs/concepts/services-networking/service/"}
  ],
  "k8s-namespaces-rbac": [
    {"t":"Kubernetes docs: Using RBAC Authorization","u":"https://kubernetes.io/docs/reference/access-authn-authz/rbac/"},
    {"t":"Kubernetes docs: Network Policies","u":"https://kubernetes.io/docs/concepts/services-networking/network-policies/"},
    {"t":"Kubernetes docs: Pod Security Standards","u":"https://kubernetes.io/docs/concepts/security/pod-security-standards/"}
  ],
  "k8s-networking-cni": [
    {"t":"Kubernetes docs: Cluster Networking","u":"https://kubernetes.io/docs/concepts/cluster-administration/networking/"},
    {"t":"Kubernetes docs: Network Plugins","u":"https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/"},
    {"t":"CNI: Specification","u":"https://github.com/containernetworking/cni/blob/main/SPEC.md"}
  ],
  "k8s-node-autoprovisioning": [
    {"t":"Karpenter docs: NodePools","u":"https://karpenter.sh/docs/concepts/nodepools/"},
    {"t":"Kubernetes docs: Node Autoscaling","u":"https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/"},
    {"t":"GKE docs: Autopilot overview","u":"https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview"},
    {"t":"AKS docs: Node auto provisioning","u":"https://learn.microsoft.com/en-us/azure/aks/node-autoprovision"}
  ],
  "k8s-operators-crds": [
    {"t":"Kubernetes docs: Operator pattern","u":"https://kubernetes.io/docs/concepts/extend-kubernetes/operator/"},
    {"t":"Kubernetes docs: Custom Resources","u":"https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/"},
    {"t":"The Kubebuilder Book","u":"https://book.kubebuilder.io/"}
  ],
  "k8s-pods": [
    {"t":"Kubernetes docs: Pods","u":"https://kubernetes.io/docs/concepts/workloads/pods/"},
    {"t":"Kubernetes docs: Pod Lifecycle","u":"https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"},
    {"t":"Kubernetes docs: Init Containers","u":"https://kubernetes.io/docs/concepts/workloads/pods/init-containers/"}
  ],
  "k8s-probes": [
    {"t":"Kubernetes docs: Liveness, Readiness and Startup Probes","u":"https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/"},
    {"t":"Kubernetes docs: Configure Probes","u":"https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"},
    {"t":"Kubernetes docs: Container Lifecycle Hooks","u":"https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/"}
  ],
  "k8s-resources": [
    {"t":"Kubernetes docs: Resource Management for Pods and Containers","u":"https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"},
    {"t":"Kubernetes docs: Pod Quality of Service Classes","u":"https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/"},
    {"t":"Kubernetes docs: Node-pressure Eviction","u":"https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/"}
  ],
  "k8s-scheduling": [
    {"t":"Kubernetes docs: Kubernetes Scheduler","u":"https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/"},
    {"t":"Kubernetes docs: Assigning Pods to Nodes","u":"https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/"},
    {"t":"Kubernetes docs: Taints and Tolerations","u":"https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/"}
  ],
  "k8s-security-policy": [
    {"t":"Kubernetes docs: Security Checklist","u":"https://kubernetes.io/docs/concepts/security/security-checklist/"},
    {"t":"Kubernetes docs: Validating Admission Policy","u":"https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/"},
    {"t":"Kyverno docs","u":"https://kyverno.io/docs/"},
    {"t":"OPA Gatekeeper docs","u":"https://open-policy-agent.github.io/gatekeeper/website/docs/"}
  ],
  "k8s-services": [
    {"t":"Kubernetes docs: Service","u":"https://kubernetes.io/docs/concepts/services-networking/service/"},
    {"t":"Kubernetes docs: DNS for Services and Pods","u":"https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/"},
    {"t":"Kubernetes docs: Ingress","u":"https://kubernetes.io/docs/concepts/services-networking/ingress/"}
  ],
  "k8s-storage": [
    {"t":"Kubernetes docs: Persistent Volumes","u":"https://kubernetes.io/docs/concepts/storage/persistent-volumes/"},
    {"t":"Kubernetes docs: StatefulSets","u":"https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/"},
    {"t":"Kubernetes docs: Storage Classes","u":"https://kubernetes.io/docs/concepts/storage/storage-classes/"}
  ],
  "k8s-troubleshooting-playbook": [
    {"t":"Kubernetes docs: Troubleshooting Applications","u":"https://kubernetes.io/docs/tasks/debug/debug-application/"},
    {"t":"Kubernetes docs: Troubleshooting Clusters","u":"https://kubernetes.io/docs/tasks/debug/debug-cluster/"},
    {"t":"Kubernetes docs: Ephemeral Containers","u":"https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/"}
  ],
  "latency-numbers": [
    {"t":"Google SRE book: Embracing Risk","u":"https://sre.google/sre-book/embracing-risk/"},
    {"t":"Jeff Dean: Numbers Everyone Should Know (talk)","u":"https://static.googleusercontent.com/media/research.google.com/en//people/jeff/stanford-295-talk.pdf"},
    {"t":"Colin Scott: Latency numbers over time","u":"https://colin-scott.github.io/personal_website/research/interactive_latency.html"}
  ],
  "linking-binaries": [
    {"t":"man7: ld.so(8)","u":"https://man7.org/linux/man-pages/man8/ld.so.8.html"},
    {"t":"man7: ldd(1)","u":"https://man7.org/linux/man-pages/man1/ldd.1.html"},
    {"t":"man7: elf(5)","u":"https://man7.org/linux/man-pages/man5/elf.5.html"}
  ],
  "linux-bash-scripting": [
    {"t":"GNU Bash manual","u":"https://www.gnu.org/software/bash/manual/bash.html"},
    {"t":"Bash manual: The Set Builtin","u":"https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html"},
    {"t":"Bash manual: Shell Expansions","u":"https://www.gnu.org/software/bash/manual/html_node/Shell-Expansions.html"}
  ],
  "linux-boot-rescue": [
    {"t":"man7: bootup(7)","u":"https://man7.org/linux/man-pages/man7/bootup.7.html"},
    {"t":"man7: dracut(8)","u":"https://man7.org/linux/man-pages/man8/dracut.8.html"}
  ],
  "linux-cgroups-v2": [
    {"t":"Linux kernel docs: Control Group v2","u":"https://docs.kernel.org/admin-guide/cgroup-v2.html"},
    {"t":"man7: cgroups(7)","u":"https://man7.org/linux/man-pages/man7/cgroups.7.html"},
    {"t":"Kubernetes docs: About cgroup v2","u":"https://kubernetes.io/docs/concepts/architecture/cgroups/"}
  ],
  "linux-crash-debugging": [
    {"t":"core(5) - Linux manual page","u":"https://man7.org/linux/man-pages/man5/core.5.html"},
    {"t":"coredumpctl(1) - Linux manual page","u":"https://man7.org/linux/man-pages/man1/coredumpctl.1.html"},
    {"t":"Linux kernel docs: Documentation for Kdump","u":"https://docs.kernel.org/admin-guide/kdump/kdump.html"}
  ],
  "linux-disks-storage": [
    {"t":"man7: df(1)","u":"https://man7.org/linux/man-pages/man1/df.1.html"},
    {"t":"man7: mount(8)","u":"https://man7.org/linux/man-pages/man8/mount.8.html"},
    {"t":"man7: lsblk(8)","u":"https://man7.org/linux/man-pages/man8/lsblk.8.html"},
    {"t":"man7: inode(7)","u":"https://man7.org/linux/man-pages/man7/inode.7.html"}
  ],
  "linux-epoll-iouring": [
    {"t":"man7: epoll(7)","u":"https://man7.org/linux/man-pages/man7/epoll.7.html"},
    {"t":"man7: io_uring(7)","u":"https://man7.org/linux/man-pages/man7/io_uring.7.html"},
    {"t":"FreeBSD man pages: kqueue(2)","u":"https://man.freebsd.org/cgi/man.cgi?query=kqueue&sektion=2"},
    {"t":"Kegel: The C10K problem","u":"https://www.kegel.com/c10k.html"}
  ],
  "linux-files-navigation": [
    {"t":"man7: hier(7)","u":"https://man7.org/linux/man-pages/man7/hier.7.html"},
    {"t":"Linux Foundation: FHS 3.0","u":"https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html"},
    {"t":"GNU Coreutils manual","u":"https://www.gnu.org/software/coreutils/manual/coreutils.html"}
  ],
  "linux-hardening": [
    {"t":"man7: sshd_config(5)","u":"https://man7.org/linux/man-pages/man5/sshd_config.5.html"},
    {"t":"man7: auditd(8)","u":"https://man7.org/linux/man-pages/man8/auditd.8.html"}
  ],
  "linux-kernel-tuning": [
    {"t":"kernel.org: sysctl/vm","u":"https://www.kernel.org/doc/html/latest/admin-guide/sysctl/vm.html"},
    {"t":"man7: getrlimit(2)","u":"https://man7.org/linux/man-pages/man2/getrlimit.2.html"},
    {"t":"kernel.org: Transparent Hugepage Support","u":"https://www.kernel.org/doc/html/latest/admin-guide/mm/transhuge.html"}
  ],
  "linux-memory-leaks": [
    {"t":"man7: proc(5)","u":"https://man7.org/linux/man-pages/man5/proc.5.html"},
    {"t":"Valgrind: Memcheck manual","u":"https://valgrind.org/docs/manual/mc-manual.html"},
    {"t":"Linux kernel docs: Memory cgroup","u":"https://docs.kernel.org/admin-guide/cgroup-v1/memory.html"}
  ],
  "linux-namespaces-hands-on": [
    {"t":"man7: namespaces(7)","u":"https://man7.org/linux/man-pages/man7/namespaces.7.html"},
    {"t":"man7: unshare(1)","u":"https://man7.org/linux/man-pages/man1/unshare.1.html"},
    {"t":"man7: cgroups(7)","u":"https://man7.org/linux/man-pages/man7/cgroups.7.html"},
    {"t":"man7: nsenter(1)","u":"https://man7.org/linux/man-pages/man1/nsenter.1.html"}
  ],
  "linux-networking-commands": [
    {"t":"man7: ip(8)","u":"https://man7.org/linux/man-pages/man8/ip.8.html"},
    {"t":"man7: ss(8)","u":"https://man7.org/linux/man-pages/man8/ss.8.html"},
    {"t":"curl: man page","u":"https://curl.se/docs/manpage.html"},
    {"t":"tcpdump: man page","u":"https://www.tcpdump.org/manpages/tcpdump.1.html"}
  ],
  "linux-patching-packages": [
    {"t":"Debian manpages: apt_preferences(5)","u":"https://manpages.debian.org/bookworm/apt/apt_preferences.5.en.html"},
    {"t":"kured docs: Configuration","u":"https://kured.dev/docs/configuration/"},
    {"t":"AWS Systems Manager: Patch Manager","u":"https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html"}
  ],
  "linux-perf-tracing": [
    {"t":"man7: perf(1)","u":"https://www.man7.org/linux/man-pages/man1/perf.1.html"},
    {"t":"bpftrace: Reference guide","u":"https://github.com/bpftrace/bpftrace/blob/master/docs/reference_guide.md"},
    {"t":"BCC: Tutorial","u":"https://github.com/iovisor/bcc/blob/master/docs/tutorial.md"}
  ],
  "linux-performance-60s": [
    {"t":"man7: iostat(1)","u":"https://man7.org/linux/man-pages/man1/iostat.1.html"},
    {"t":"man7: vmstat(8)","u":"https://man7.org/linux/man-pages/man8/vmstat.8.html"},
    {"t":"Linux kernel docs: Pressure Stall Information","u":"https://docs.kernel.org/accounting/psi.html"}
  ],
  "linux-permissions-users": [
    {"t":"man7: chmod(1)","u":"https://man7.org/linux/man-pages/man1/chmod.1.html"},
    {"t":"sudo: sudoers manual","u":"https://www.sudo.ws/docs/man/sudoers.man/"},
    {"t":"man7: path_resolution(7)","u":"https://man7.org/linux/man-pages/man7/path_resolution.7.html"}
  ],
  "linux-processes": [
    {"t":"man7: ps(1)","u":"https://man7.org/linux/man-pages/man1/ps.1.html"},
    {"t":"man7: signal(7)","u":"https://man7.org/linux/man-pages/man7/signal.7.html"},
    {"t":"man7: strace(1)","u":"https://man7.org/linux/man-pages/man1/strace.1.html"}
  ],
  "linux-ssh-remote": [
    {"t":"OpenBSD: ssh_config(5)","u":"https://man.openbsd.org/ssh_config"},
    {"t":"OpenBSD: ssh(1)","u":"https://man.openbsd.org/ssh"},
    {"t":"rsync: man page","u":"https://download.samba.org/pub/rsync/rsync.1"},
    {"t":"tmux wiki","u":"https://github.com/tmux/tmux/wiki"}
  ],
  "linux-systemd-logs": [
    {"t":"man7: systemd.service(5)","u":"https://man7.org/linux/man-pages/man5/systemd.service.5.html"},
    {"t":"man7: journalctl(1)","u":"https://man7.org/linux/man-pages/man1/journalctl.1.html"},
    {"t":"man7: crontab(5)","u":"https://man7.org/linux/man-pages/man5/crontab.5.html"}
  ],
  "linux-text-processing": [
    {"t":"GNU grep manual","u":"https://www.gnu.org/software/grep/manual/grep.html"},
    {"t":"GNU awk manual","u":"https://www.gnu.org/software/gawk/manual/gawk.html"},
    {"t":"jq manual","u":"https://jqlang.org/manual/"},
    {"t":"GNU sed manual","u":"https://www.gnu.org/software/sed/manual/sed.html"}
  ],
  "linux-toolkit": [
    {"t":"man7: top(1)","u":"https://man7.org/linux/man-pages/man1/top.1.html"},
    {"t":"man7: proc(5)","u":"https://man7.org/linux/man-pages/man5/proc.5.html"},
    {"t":"man7: vmstat(8)","u":"https://man7.org/linux/man-pages/man8/vmstat.8.html"}
  ],
  "memory": [
    {"t":"Linux kernel docs: Concepts overview (memory management)","u":"https://docs.kernel.org/admin-guide/mm/concepts.html"},
    {"t":"Linux kernel docs: vm sysctl (overcommit, OOM)","u":"https://docs.kernel.org/admin-guide/sysctl/vm.html"},
    {"t":"man7: proc_meminfo(5)","u":"https://man7.org/linux/man-pages/man5/proc_meminfo.5.html"}
  ],
  "memory-hierarchy": [
    {"t":"man7: numa(7)","u":"https://man7.org/linux/man-pages/man7/numa.7.html"},
    {"t":"Linux kernel docs: Memory management concepts","u":"https://docs.kernel.org/admin-guide/mm/concepts.html"},
    {"t":"Linux kernel docs: Huge Pages","u":"https://docs.kernel.org/admin-guide/mm/hugetlbpage.html"}
  ],
  "ml-llm-library-map": [
    {"t":"PyTorch docs","u":"https://pytorch.org/docs/stable/index.html"},
    {"t":"Hugging Face docs: Transformers","u":"https://huggingface.co/docs/transformers/index"},
    {"t":"vLLM docs","u":"https://docs.vllm.ai/en/latest/"},
    {"t":"scikit-learn user guide","u":"https://scikit-learn.org/stable/user_guide.html"}
  ],
  "mlops-lifecycle": [
    {"t":"Google Cloud: MLOps pipelines and automation","u":"https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"},
    {"t":"MLflow docs","u":"https://mlflow.org/docs/latest/index.html"},
    {"t":"NeurIPS: Hidden Technical Debt in ML Systems","u":"https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html"}
  ],
  "mlops-serving-monitoring": [
    {"t":"Evidently docs","u":"https://docs.evidentlyai.com/"},
    {"t":"KServe docs: Canary rollout","u":"https://kserve.github.io/website/latest/modelserving/v1beta1/rollout/canary/"},
    {"t":"KServe docs: Introduction","u":"https://kserve.github.io/website/docs/intro"}
  ],
  "mlops-training-pipelines": [
    {"t":"Kubeflow docs: Pipelines","u":"https://www.kubeflow.org/docs/components/pipelines/"},
    {"t":"Feast docs","u":"https://docs.feast.dev/"},
    {"t":"Kubernetes docs: Schedule GPUs","u":"https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/"}
  ],
  "nestjs-ddd-event-driven": [
    {"t":"NestJS docs: CQRS","u":"https://docs.nestjs.com/recipes/cqrs"},
    {"t":"NestJS docs: Events","u":"https://docs.nestjs.com/techniques/events"},
    {"t":"Martin Fowler: Bounded Context","u":"https://martinfowler.com/bliki/BoundedContext.html"},
    {"t":"Microsoft Learn: Transactional Outbox pattern","u":"https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos"}
  ],
  "nestjs-in-depth": [
    {"t":"NestJS docs: Modules","u":"https://docs.nestjs.com/modules"},
    {"t":"NestJS docs: Providers","u":"https://docs.nestjs.com/providers"},
    {"t":"NestJS docs: Request lifecycle","u":"https://docs.nestjs.com/faq/request-lifecycle"}
  ],
  "net-bgp-anycast": [
    {"t":"RFC 4271: BGP-4","u":"https://www.rfc-editor.org/rfc/rfc4271"},
    {"t":"RFC 4786: Anycast Operation of Authoritative Name Servers","u":"https://www.rfc-editor.org/rfc/rfc4786"}
  ],
  "net-ddos-edge": [
    {"t":"AWS Whitepaper: DDoS Resiliency Best Practices","u":"https://docs.aws.amazon.com/whitepapers/latest/aws-best-practices-ddos-resiliency/"},
    {"t":"RFC 4987: TCP SYN Flooding","u":"https://www.rfc-editor.org/rfc/rfc4987"}
  ],
  "net-dns": [
    {"t":"RFC 1034: DNS Concepts","u":"https://www.rfc-editor.org/rfc/rfc1034"},
    {"t":"RFC 1035: DNS Implementation","u":"https://www.rfc-editor.org/rfc/rfc1035"},
    {"t":"AWS docs: Route 53 routing policies","u":"https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html"}
  ],
  "net-dns-operations": [
    {"t":"RFC 1034: DNS Concepts","u":"https://www.rfc-editor.org/rfc/rfc1034"},
    {"t":"RFC 8767: Serving Stale Data","u":"https://www.rfc-editor.org/rfc/rfc8767"},
    {"t":"AWS docs: Route 53 routing policies","u":"https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html"}
  ],
  "net-errors-by-layer": [
    {"t":"man7: tcp(7)","u":"https://man7.org/linux/man-pages/man7/tcp.7.html"},
    {"t":"man7: errno(3)","u":"https://man7.org/linux/man-pages/man3/errno.3.html"},
    {"t":"RFC 9293: TCP","u":"https://www.rfc-editor.org/rfc/rfc9293"}
  ],
  "net-firewalls": [
    {"t":"AWS docs: Security groups","u":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"},
    {"t":"AWS docs: Network ACLs","u":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html"},
    {"t":"OWASP: Top Ten","u":"https://owasp.org/www-project-top-ten/"}
  ],
  "net-grpc-production": [
    {"t":"gRPC docs: Core concepts","u":"https://grpc.io/docs/what-is-grpc/core-concepts/"},
    {"t":"gRPC docs: Deadlines","u":"https://grpc.io/docs/guides/deadlines/"},
    {"t":"gRPC: Load Balancing","u":"https://grpc.io/blog/grpc-load-balancing/"}
  ],
  "net-hops-paths": [
    {"t":"RFC 791: Internet Protocol","u":"https://www.rfc-editor.org/rfc/rfc791"},
    {"t":"RFC 792: ICMP","u":"https://www.rfc-editor.org/rfc/rfc792"},
    {"t":"man7: traceroute(8)","u":"https://man7.org/linux/man-pages/man8/traceroute.8.html"},
    {"t":"man7: ping(8)","u":"https://man7.org/linux/man-pages/man8/ping.8.html"}
  ],
  "net-http-caching": [
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"},
    {"t":"MDN: HTTP caching","u":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"},
    {"t":"RFC 5861: stale-while-revalidate","u":"https://www.rfc-editor.org/rfc/rfc5861"}
  ],
  "net-http-tls": [
    {"t":"RFC 9110: HTTP Semantics","u":"https://www.rfc-editor.org/rfc/rfc9110"},
    {"t":"RFC 8446: TLS 1.3","u":"https://www.rfc-editor.org/rfc/rfc8446"},
    {"t":"MDN: An overview of HTTP","u":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"}
  ],
  "net-https-errors": [
    {"t":"RFC 8446: TLS 1.3","u":"https://www.rfc-editor.org/rfc/rfc8446"},
    {"t":"MDN: Transport Layer Security","u":"https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security"},
    {"t":"OpenSSL docs: s_client","u":"https://docs.openssl.org/master/man1/openssl-s_client/"}
  ],
  "net-hybrid-connectivity": [
    {"t":"AWS docs: What is VPC peering","u":"https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html"},
    {"t":"AWS docs: What is AWS PrivateLink","u":"https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html"},
    {"t":"AWS docs: What is Transit Gateway","u":"https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html"}
  ],
  "net-ip-cidr": [
    {"t":"RFC 4632: CIDR","u":"https://www.rfc-editor.org/rfc/rfc4632"},
    {"t":"RFC 1918: Private Address Space","u":"https://www.rfc-editor.org/rfc/rfc1918"},
    {"t":"AWS docs: VPC CIDR blocks","u":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html"}
  ],
  "net-ipv6": [
    {"t":"RFC 8200: IPv6 Specification","u":"https://www.rfc-editor.org/rfc/rfc8200"},
    {"t":"RFC 4291: IPv6 Addressing Architecture","u":"https://www.rfc-editor.org/rfc/rfc4291"},
    {"t":"RFC 4861: Neighbor Discovery","u":"https://www.rfc-editor.org/rfc/rfc4861"}
  ],
  "net-isolation": [
    {"t":"NIST SP 800-207: Zero Trust Architecture","u":"https://csrc.nist.gov/pubs/sp/800/207/final"},
    {"t":"AWS docs: What are VPC endpoints","u":"https://docs.aws.amazon.com/vpc/latest/privatelink/what-are-vpc-endpoints.html"},
    {"t":"Google Research: BeyondCorp","u":"https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/"}
  ],
  "net-l2-switching": [
    {"t":"Linux kernel docs: Linux Ethernet Bonding Driver","u":"https://www.kernel.org/doc/html/latest/networking/bonding.html"},
    {"t":"man7: bridge(8)","u":"https://man7.org/linux/man-pages/man8/bridge.8.html"},
    {"t":"man7: ip-link(8)","u":"https://man7.org/linux/man-pages/man8/ip-link.8.html"}
  ],
  "net-load-balancing": [
    {"t":"AWS docs: What is Elastic Load Balancing","u":"https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html"},
    {"t":"NGINX docs: HTTP load balancing","u":"https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/"},
    {"t":"Google SRE book: Load Balancing in the Datacenter","u":"https://sre.google/sre-book/load-balancing-datacenter/"}
  ],
  "net-nat-conntrack": [
    {"t":"RFC 3022: Traditional IP NAT","u":"https://www.rfc-editor.org/rfc/rfc3022"},
    {"t":"Netfilter: conntrack-tools manual","u":"https://conntrack-tools.netfilter.org/manual.html"},
    {"t":"kernel.org: nf_conntrack sysctl","u":"https://www.kernel.org/doc/html/latest/networking/nf_conntrack-sysctl.html"}
  ],
  "net-osi-tcpip": [
    {"t":"RFC 1122: Requirements for Internet Hosts","u":"https://www.rfc-editor.org/rfc/rfc1122"},
    {"t":"RFC 9293: TCP","u":"https://www.rfc-editor.org/rfc/rfc9293"},
    {"t":"RFC 791: Internet Protocol","u":"https://www.rfc-editor.org/rfc/rfc791"}
  ],
  "net-proxies-cdn": [
    {"t":"NGINX docs: Reverse proxy","u":"https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/"},
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"},
    {"t":"AWS docs: What is Amazon CloudFront","u":"https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html"}
  ],
  "net-proxies-hands-on": [
    {"t":"NGINX docs: Reverse proxy","u":"https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/"},
    {"t":"HAProxy: Configuration manual","u":"https://docs.haproxy.org/3.0/configuration.html"},
    {"t":"Envoy docs: Architecture overview","u":"https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview"}
  ],
  "net-tcp-deep": [
    {"t":"RFC 9293: Transmission Control Protocol","u":"https://www.rfc-editor.org/rfc/rfc9293"},
    {"t":"man7: tcp(7)","u":"https://man7.org/linux/man-pages/man7/tcp.7.html"},
    {"t":"RFC 5681: TCP Congestion Control","u":"https://www.rfc-editor.org/rfc/rfc5681"}
  ],
  "net-tcp-vs-udp": [
    {"t":"RFC 768: UDP","u":"https://www.rfc-editor.org/rfc/rfc768"},
    {"t":"RFC 9293: TCP","u":"https://www.rfc-editor.org/rfc/rfc9293"},
    {"t":"RFC 9000: QUIC","u":"https://www.rfc-editor.org/rfc/rfc9000"}
  ],
  "net-troubleshooting": [
    {"t":"man7: traceroute(8)","u":"https://man7.org/linux/man-pages/man8/traceroute.8.html"},
    {"t":"curl: man page","u":"https://curl.se/docs/manpage.html"},
    {"t":"Wireshark: User Guide","u":"https://www.wireshark.org/docs/wsug_html_chunked/"}
  ],
  "net-vpc": [
    {"t":"AWS docs: What is Amazon VPC","u":"https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html"},
    {"t":"AWS docs: Route tables","u":"https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html"},
    {"t":"Google Cloud docs: VPC networks","u":"https://cloud.google.com/vpc/docs/vpc"}
  ],
  "node-web-frameworks": [
    {"t":"Node.js docs: Event loop, timers, nextTick","u":"https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"},
    {"t":"Fastify docs","u":"https://fastify.dev/docs/latest/"},
    {"t":"Express docs: Production best practices","u":"https://expressjs.com/en/advanced/best-practice-performance.html"}
  ],
  "obs-alerting": [
    {"t":"Google SRE workbook: Alerting on SLOs","u":"https://sre.google/workbook/alerting-on-slos/"},
    {"t":"Prometheus docs: Alerting rules","u":"https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/"},
    {"t":"Prometheus docs: Alertmanager","u":"https://prometheus.io/docs/alerting/latest/alertmanager/"}
  ],
  "obs-dashboards": [
    {"t":"Grafana docs: Dashboard best practices","u":"https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/"},
    {"t":"Grafana docs: Dashboards","u":"https://grafana.com/docs/grafana/latest/dashboards/"},
    {"t":"Google SRE book: Monitoring Distributed Systems","u":"https://sre.google/sre-book/monitoring-distributed-systems/"}
  ],
  "obs-datadog-victoriametrics": [
    {"t":"VictoriaMetrics docs","u":"https://docs.victoriametrics.com/"},
    {"t":"Grafana docs","u":"https://grafana.com/docs/grafana/latest/"},
    {"t":"Datadog docs: Metrics","u":"https://docs.datadoghq.com/metrics/"},
    {"t":"Prometheus docs: Storage","u":"https://prometheus.io/docs/prometheus/latest/storage/"}
  ],
  "obs-golden-signals": [
    {"t":"Google SRE book: Monitoring (Four Golden Signals)","u":"https://sre.google/sre-book/monitoring-distributed-systems/"},
    {"t":"Grafana: The RED Method","u":"https://grafana.com/blog/the-red-method-how-to-instrument-your-services/"}
  ],
  "obs-intro": [
    {"t":"Google SRE book: Monitoring Distributed Systems","u":"https://sre.google/sre-book/monitoring-distributed-systems/"},
    {"t":"OpenTelemetry docs: Observability primer","u":"https://opentelemetry.io/docs/concepts/observability-primer/"},
    {"t":"OpenTelemetry docs: Signals","u":"https://opentelemetry.io/docs/concepts/signals/"}
  ],
  "obs-logging-pipeline": [
    {"t":"Grafana Loki docs: Architecture","u":"https://grafana.com/docs/loki/latest/get-started/architecture/"},
    {"t":"Fluent Bit docs: Buffering and storage","u":"https://docs.fluentbit.io/manual/data-pipeline/buffering"},
    {"t":"OpenTelemetry docs: Logs","u":"https://opentelemetry.io/docs/concepts/signals/logs/"}
  ],
  "obs-logs": [
    {"t":"OpenTelemetry docs: Logs","u":"https://opentelemetry.io/docs/concepts/signals/logs/"},
    {"t":"Grafana Loki docs","u":"https://grafana.com/docs/loki/latest/"}
  ],
  "obs-metrics": [
    {"t":"Prometheus docs: Querying basics","u":"https://prometheus.io/docs/prometheus/latest/querying/basics/"},
    {"t":"Prometheus docs: Histograms and summaries","u":"https://prometheus.io/docs/practices/histograms/"},
    {"t":"Prometheus docs: Metric types","u":"https://prometheus.io/docs/concepts/metric_types/"}
  ],
  "obs-otel-collector": [
    {"t":"OpenTelemetry docs: Collector","u":"https://opentelemetry.io/docs/collector/"},
    {"t":"OpenTelemetry docs: Sampling","u":"https://opentelemetry.io/docs/concepts/sampling/"},
    {"t":"OpenTelemetry docs: Collector configuration","u":"https://opentelemetry.io/docs/collector/configuration/"}
  ],
  "obs-profiling-synthetics": [
    {"t":"Grafana Pyroscope docs","u":"https://grafana.com/docs/pyroscope/latest/"},
    {"t":"Google Research: Google-Wide Profiling","u":"https://research.google/pubs/google-wide-profiling-a-continuous-profiling-infrastructure-for-data-centers/"},
    {"t":"MDN: Performance API","u":"https://developer.mozilla.org/en-US/docs/Web/API/Performance_API"}
  ],
  "obs-prometheus-deep": [
    {"t":"Prometheus docs: Instrumentation best practices","u":"https://prometheus.io/docs/practices/instrumentation/"},
    {"t":"Prometheus docs: Recording rules","u":"https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/"},
    {"t":"Prometheus docs: Storage","u":"https://prometheus.io/docs/prometheus/latest/storage/"}
  ],
  "obs-slo-as-code": [
    {"t":"OpenSLO spec","u":"https://github.com/OpenSLO/OpenSLO"},
    {"t":"Google SRE workbook: Implementing SLOs","u":"https://sre.google/workbook/implementing-slos/"},
    {"t":"Google SRE workbook: Alerting on SLOs","u":"https://sre.google/workbook/alerting-on-slos/"}
  ],
  "obs-traces": [
    {"t":"OpenTelemetry docs: Traces","u":"https://opentelemetry.io/docs/concepts/signals/traces/"},
    {"t":"W3C Trace Context","u":"https://www.w3.org/TR/trace-context/"},
    {"t":"OpenTelemetry docs: Context propagation","u":"https://opentelemetry.io/docs/concepts/context-propagation/"}
  ],
  "plan-cloud-selection": [
    {"t":"Microsoft Learn: Azure and AWS services comparison","u":"https://learn.microsoft.com/en-us/azure/architecture/aws-professional/services"},
    {"t":"Google Cloud: AWS, Azure, GCP service comparison","u":"https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison"},
    {"t":"AWS Well-Architected: Reliability pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"}
  ],
  "plan-data-store-selection": [
    {"t":"AWS decision guide: Choosing a database","u":"https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html"},
    {"t":"Martin Fowler: Polyglot Persistence","u":"https://martinfowler.com/bliki/PolyglotPersistence.html"},
    {"t":"Amazon Dynamo paper (SOSP 2007)","u":"https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"}
  ],
  "plan-environments-namespaces": [
    {"t":"AWS whitepaper: Organizing Your AWS Environment","u":"https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html"},
    {"t":"Kubernetes docs: Namespaces","u":"https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/"},
    {"t":"Kubernetes docs: Multi-tenancy","u":"https://kubernetes.io/docs/concepts/security/multi-tenancy/"}
  ],
  "plan-failure-sla": [
    {"t":"Google SRE book: Embracing Risk","u":"https://sre.google/sre-book/embracing-risk/"},
    {"t":"Google SRE book: Service Level Objectives","u":"https://sre.google/sre-book/service-level-objectives/"},
    {"t":"AWS Well-Architected: Reliability pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"},
    {"t":"AWS Fault Injection Service","u":"https://docs.aws.amazon.com/fis/latest/userguide/what-is.html"}
  ],
  "plan-global-traffic": [
    {"t":"Route 53 docs: Choosing a routing policy","u":"https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html"},
    {"t":"Route 53 docs: Configuring DNS failover","u":"https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html"},
    {"t":"AWS Global Accelerator docs","u":"https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html"},
    {"t":"Google Cloud: Load balancing overview","u":"https://cloud.google.com/load-balancing/docs/load-balancing-overview"}
  ],
  "plan-product-infra-blueprint": [
    {"t":"AWS Well-Architected Framework","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
    {"t":"Microsoft Learn: Azure Well-Architected Framework","u":"https://learn.microsoft.com/en-us/azure/well-architected/"},
    {"t":"Google Cloud Architecture Framework","u":"https://cloud.google.com/architecture/framework"}
  ],
  "pr-ai-systems-design": [
    {"t":"Anthropic: Building effective agents","u":"https://www.anthropic.com/research/building-effective-agents"},
    {"t":"Anthropic docs: Prompt caching","u":"https://platform.claude.com/docs/en/build-with-claude/prompt-caching"},
    {"t":"Lewis et al.: Retrieval-Augmented Generation (paper)","u":"https://arxiv.org/abs/2005.11401"}
  ],
  "pr-api-design": [
    {"t":"Microsoft: RESTful web API design","u":"https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design"},
    {"t":"RFC 9110: HTTP Semantics","u":"https://www.rfc-editor.org/rfc/rfc9110.html"},
    {"t":"RFC 9457: Problem Details for HTTP APIs","u":"https://www.rfc-editor.org/rfc/rfc9457.html"}
  ],
  "pr-applied-crypto-pki": [
    {"t":"RFC 5280: X.509 PKI Certificate Profile","u":"https://www.rfc-editor.org/rfc/rfc5280.html"},
    {"t":"RFC 8446: TLS 1.3","u":"https://www.rfc-editor.org/rfc/rfc8446.html"},
    {"t":"OWASP Cryptographic Storage Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"}
  ],
  "pr-architect-questions": [
    {"t":"AWS Well-Architected Framework","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
    {"t":"Azure Well-Architected Framework","u":"https://learn.microsoft.com/en-us/azure/well-architected/"},
    {"t":"Google Cloud Architecture Framework","u":"https://cloud.google.com/architecture/framework"}
  ],
  "pr-architecture-styles": [
    {"t":"Microsoft Learn: Architecture styles","u":"https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/"},
    {"t":"Martin Fowler: Microservices","u":"https://martinfowler.com/articles/microservices.html"},
    {"t":"Martin Fowler: Monolith First","u":"https://martinfowler.com/bliki/MonolithFirst.html"}
  ],
  "pr-async-await": [
    {"t":"MDN: async function","u":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function"},
    {"t":"Python docs: Coroutines and Tasks","u":"https://docs.python.org/3/library/asyncio-task.html"},
    {"t":"Microsoft docs: Async programming scenarios","u":"https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios"}
  ],
  "pr-auth": [
    {"t":"RFC 6749: OAuth 2.0","u":"https://www.rfc-editor.org/rfc/rfc6749.html"},
    {"t":"OpenID Connect Core 1.0","u":"https://openid.net/specs/openid-connect-core-1_0.html"},
    {"t":"RFC 7519: JSON Web Token","u":"https://www.rfc-editor.org/rfc/rfc7519.html"}
  ],
  "pr-backups-strategy": [
    {"t":"PostgreSQL docs: Continuous Archiving and PITR","u":"https://www.postgresql.org/docs/current/continuous-archiving.html"},
    {"t":"AWS S3 docs: Object Lock","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html"},
    {"t":"AWS Backup docs: What is AWS Backup","u":"https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html"}
  ],
  "pr-big-data": [
    {"t":"Apache Spark docs: Overview","u":"https://spark.apache.org/docs/latest/"},
    {"t":"Hadoop docs: HDFS Architecture","u":"https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html"},
    {"t":"Delta Lake docs","u":"https://docs.delta.io/index.html"}
  ],
  "pr-bitwise": [
    {"t":"RFC 4632: CIDR","u":"https://www.rfc-editor.org/rfc/rfc4632.html"},
    {"t":"Python docs: Bitwise operations","u":"https://docs.python.org/3/builtins/stdtypes.html"},
    {"t":"Redis docs: Bitmaps","u":"https://redis.io/docs/latest/develop/data-types/bitmaps/"}
  ],
  "pr-cap-pacelc": [
    {"t":"Brewer: CAP Twelve Years Later (InfoQ)","u":"https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/"},
    {"t":"Amazon: Dynamo paper (SOSP 2007)","u":"https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"},
    {"t":"Jepsen: Consistency Models","u":"https://jepsen.io/consistency"}
  ],
  "pr-checksums-hashing": [
    {"t":"RFC 2104: HMAC","u":"https://www.rfc-editor.org/rfc/rfc2104.html"},
    {"t":"NIST FIPS 180-4: Secure Hash Standard","u":"https://csrc.nist.gov/pubs/fips/180-4/upd1/final"},
    {"t":"OWASP Cheat Sheet: Password Storage","u":"https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"}
  ],
  "pr-cloud-patterns": [
    {"t":"Azure Architecture Center: Cloud design patterns","u":"https://learn.microsoft.com/en-us/azure/architecture/patterns/"},
    {"t":"Fowler: Circuit Breaker","u":"https://martinfowler.com/bliki/CircuitBreaker.html"},
    {"t":"microservices.io: Saga pattern","u":"https://microservices.io/patterns/data/saga.html"}
  ],
  "pr-clusters": [
    {"t":"Raft consensus algorithm","u":"https://raft.github.io/"},
    {"t":"etcd docs: FAQ (quorum, cluster size)","u":"https://etcd.io/docs/v3.5/faq/"},
    {"t":"Kleppmann: How to do distributed locking","u":"https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"}
  ],
  "pr-code-review-quality": [
    {"t":"Google Engineering Practices: Code Review","u":"https://google.github.io/eng-practices/review/"},
    {"t":"GitHub docs: About protected branches","u":"https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches"},
    {"t":"Google Eng Practices: Speed of code reviews","u":"https://google.github.io/eng-practices/review/reviewer/speed.html"}
  ],
  "pr-concurrency-parallelism": [
    {"t":"Python docs: threading","u":"https://docs.python.org/3/library/threading.html"},
    {"t":"Python docs: multiprocessing","u":"https://docs.python.org/3/library/multiprocessing.html"},
    {"t":"Go blog: Concurrency is not parallelism","u":"https://go.dev/blog/waza-talk"}
  ],
  "pr-data-modeling": [
    {"t":"PostgreSQL docs: Data Definition","u":"https://www.postgresql.org/docs/current/ddl.html"},
    {"t":"PostgreSQL docs: Explicit Locking","u":"https://www.postgresql.org/docs/current/explicit-locking.html"},
    {"t":"AWS DynamoDB docs: NoSQL data modeling","u":"https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql.html"}
  ],
  "pr-data-security": [
    {"t":"NIST SP 800-111: Storage Encryption","u":"https://csrc.nist.gov/pubs/sp/800/111/final"},
    {"t":"AWS KMS docs: Cryptography basics (envelope encryption)","u":"https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html"},
    {"t":"PCI SSC: Tokenization Guidelines","u":"https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf"}
  ],
  "pr-db-landscape": [
    {"t":"AWS: Purpose-built databases","u":"https://aws.amazon.com/products/databases/"},
    {"t":"Dynamo paper (Amazon)","u":"https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"},
    {"t":"Martin Fowler: PolyglotPersistence","u":"https://martinfowler.com/bliki/PolyglotPersistence.html"}
  ],
  "pr-ddd": [
    {"t":"Martin Fowler: Bounded Context","u":"https://martinfowler.com/bliki/BoundedContext.html"},
    {"t":"Martin Fowler: Domain Driven Design","u":"https://martinfowler.com/bliki/DomainDrivenDesign.html"},
    {"t":"Microsoft Learn: Using domain analysis to model microservices","u":"https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis"}
  ],
  "pr-design-patterns": [
    {"t":"Fowler: Repository","u":"https://martinfowler.com/eaaCatalog/repository.html"},
    {"t":"Fowler: Unit of Work","u":"https://martinfowler.com/eaaCatalog/unitOfWork.html"},
    {"t":"Fowler: Dependency Injection","u":"https://martinfowler.com/articles/injection.html"}
  ],
  "pr-email-sms": [
    {"t":"RFC 7208: SPF","u":"https://www.rfc-editor.org/rfc/rfc7208.html"},
    {"t":"RFC 6376: DKIM Signatures","u":"https://www.rfc-editor.org/rfc/rfc6376.html"},
    {"t":"RFC 7489: DMARC","u":"https://www.rfc-editor.org/rfc/rfc7489.html"}
  ],
  "pr-encoding-serialization": [
    {"t":"RFC 3629: UTF-8","u":"https://www.rfc-editor.org/rfc/rfc3629.html"},
    {"t":"Protobuf docs: Encoding","u":"https://protobuf.dev/programming-guides/encoding/"},
    {"t":"RFC 4648: Base64 Data Encodings","u":"https://www.rfc-editor.org/rfc/rfc4648.html"}
  ],
  "pr-enterprise-integrations": [
    {"t":"RFC 7644: SCIM Protocol","u":"https://www.rfc-editor.org/rfc/rfc7644.html"},
    {"t":"OASIS: SAML 2.0 Technical Overview","u":"https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html"},
    {"t":"Stripe docs: Webhooks","u":"https://docs.stripe.com/webhooks"}
  ],
  "pr-error-handling": [
    {"t":"OWASP Top 10:2025 A10 Mishandling Exceptional Conditions","u":"https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/"},
    {"t":"OWASP Error Handling Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html"},
    {"t":"RFC 9457: Problem Details for HTTP APIs","u":"https://www.rfc-editor.org/rfc/rfc9457.html"}
  ],
  "pr-event-loop": [
    {"t":"Node.js docs: Event Loop, Timers, nextTick","u":"https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick"},
    {"t":"MDN: The event loop","u":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model"},
    {"t":"Python docs: asyncio event loop","u":"https://docs.python.org/3/library/asyncio-eventloop.html"}
  ],
  "pr-frontend-frameworks": [
    {"t":"React docs: Thinking in React","u":"https://react.dev/learn/thinking-in-react"},
    {"t":"Vue docs: Introduction","u":"https://vuejs.org/guide/introduction.html"},
    {"t":"Angular docs: Overview","u":"https://angular.dev/overview"}
  ],
  "pr-garbage-collection": [
    {"t":"Go docs: A Guide to the Go Garbage Collector","u":"https://go.dev/doc/gc-guide"},
    {"t":"Oracle: HotSpot GC Tuning Guide","u":"https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html"},
    {"t":"Python docs: gc module","u":"https://docs.python.org/3/library/gc.html"}
  ],
  "pr-http-versions": [
    {"t":"RFC 9113: HTTP/2","u":"https://www.rfc-editor.org/rfc/rfc9113.html"},
    {"t":"RFC 9114: HTTP/3","u":"https://www.rfc-editor.org/rfc/rfc9114.html"},
    {"t":"RFC 9000: QUIC","u":"https://www.rfc-editor.org/rfc/rfc9000.html"}
  ],
  "pr-idempotency": [
    {"t":"IETF draft: Idempotency-Key HTTP Header","u":"https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/"},
    {"t":"RFC 9110: Idempotent Methods","u":"https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods"},
    {"t":"Stripe docs: Idempotent requests","u":"https://docs.stripe.com/api/idempotent_requests"}
  ],
  "pr-ids-pagination": [
    {"t":"RFC 9562: UUIDs (v7)","u":"https://www.rfc-editor.org/rfc/rfc9562.html"},
    {"t":"PostgreSQL docs: LIMIT and OFFSET","u":"https://www.postgresql.org/docs/current/queries-limit.html"},
    {"t":"Slack API: Pagination","u":"https://docs.slack.dev/apis/web-api/pagination/"}
  ],
  "pr-input-validation": [
    {"t":"OWASP Input Validation Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html"},
    {"t":"Alexis King: Parse, dont validate","u":"https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/"},
    {"t":"OWASP Injection Prevention Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html"}
  ],
  "pr-integration-styles": [
    {"t":"Enterprise Integration Patterns: Messaging","u":"https://www.enterpriseintegrationpatterns.com/patterns/messaging/"},
    {"t":"Semantic Versioning 2.0.0","u":"https://semver.org/"},
    {"t":"Protobuf docs: Updating a message type","u":"https://protobuf.dev/programming-guides/proto3/#updating"}
  ],
  "pr-integration-testing": [
    {"t":"Testcontainers guides","u":"https://testcontainers.com/guides/"},
    {"t":"Pact docs: Introduction","u":"https://docs.pact.io/"},
    {"t":"Playwright docs: Intro","u":"https://playwright.dev/docs/intro"}
  ],
  "pr-multi-tenancy": [
    {"t":"AWS: SaaS Tenant Isolation Strategies","u":"https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html"},
    {"t":"PostgreSQL docs: Row Security Policies","u":"https://www.postgresql.org/docs/current/ddl-rowsecurity.html"},
    {"t":"Azure Architecture Center: Multitenant architecture","u":"https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/overview"}
  ],
  "pr-network-isolation-deep": [
    {"t":"AWS VPC: Security groups","u":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"},
    {"t":"Kubernetes docs: Network Policies","u":"https://kubernetes.io/docs/concepts/services-networking/network-policies/"},
    {"t":"NIST SP 800-207: Zero Trust Architecture","u":"https://csrc.nist.gov/pubs/sp/800/207/final"}
  ],
  "pr-network-plan": [
    {"t":"AWS docs: VPC security best practices","u":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html"},
    {"t":"RFC 1918: Private Address Space","u":"https://www.rfc-editor.org/rfc/rfc1918"},
    {"t":"Azure: Hub-spoke network topology","u":"https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke"},
    {"t":"Google Cloud: VPC overview","u":"https://cloud.google.com/vpc/docs/vpc"}
  ],
  "pr-observability-plan": [
    {"t":"OpenTelemetry docs: Instrumentation","u":"https://opentelemetry.io/docs/concepts/instrumentation/"},
    {"t":"Google SRE book: Monitoring Distributed Systems","u":"https://sre.google/sre-book/monitoring-distributed-systems/"},
    {"t":"Google SRE workbook: Implementing SLOs","u":"https://sre.google/workbook/implementing-slos/"}
  ],
  "pr-owasp-2025": [
    {"t":"OWASP Top 10:2025","u":"https://top10.owasp.org/2025/"},
    {"t":"OWASP Cheat Sheet Series","u":"https://cheatsheetseries.owasp.org/"},
    {"t":"OWASP ASVS","u":"https://asvs.owasp.org/"}
  ],
  "pr-owasp-api-llm": [
    {"t":"OWASP API Security Top 10 2023","u":"https://api-security.owasp.org/editions/2023/en/0x11-t10/"},
    {"t":"OWASP Top 10 for LLM Applications","u":"https://genai.owasp.org/llm-top-10/"},
    {"t":"MCP spec: Security best practices","u":"https://modelcontextprotocol.io/docs/draft/tutorials/security/security_best_practices"}
  ],
  "pr-performance-testing": [
    {"t":"k6 docs: Running k6","u":"https://grafana.com/docs/k6/latest/get-started/running-k6/"},
    {"t":"Go docs: Diagnostics (profiling, tracing)","u":"https://go.dev/doc/diagnostics"},
    {"t":"Go blog: Profiling Go Programs","u":"https://go.dev/blog/pprof"}
  ],
  "pr-platforms": [
    {"t":"Go docs: Effective Go","u":"https://go.dev/doc/effective_go"},
    {"t":"Node.js docs: Dont block the event loop","u":"https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop"},
    {"t":"The Rust Book","u":"https://doc.rust-lang.org/book/"}
  ],
  "pr-principal-playbook": [
    {"t":"AWS Well-Architected Framework","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
    {"t":"Google SRE book: Launch Coordination Checklist","u":"https://sre.google/sre-book/launch-checklist/"},
    {"t":"Google Cloud Architecture Framework","u":"https://cloud.google.com/architecture/framework"}
  ],
  "pr-privacy": [
    {"t":"GDPR text: Article 17 Right to erasure","u":"https://gdpr-info.eu/art-17-gdpr/"},
    {"t":"GDPR text: Article 25 Data protection by design","u":"https://gdpr-info.eu/art-25-gdpr/"},
    {"t":"OWASP Cheat Sheet: User Privacy Protection","u":"https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html"}
  ],
  "pr-queue-kinds": [
    {"t":"Amazon SQS: dead-letter queues","u":"https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"},
    {"t":"RabbitMQ docs: Queues","u":"https://www.rabbitmq.com/docs/queues"},
    {"t":"Apache Kafka docs: Introduction","u":"https://kafka.apache.org/documentation/#introduction"}
  ],
  "pr-race-deadlock": [
    {"t":"PostgreSQL docs: Explicit Locking","u":"https://www.postgresql.org/docs/current/explicit-locking.html"},
    {"t":"PostgreSQL docs: Transaction Isolation","u":"https://www.postgresql.org/docs/current/transaction-iso.html"},
    {"t":"Go docs: Data Race Detector","u":"https://go.dev/doc/articles/race_detector"}
  ],
  "pr-rate-limiters": [
    {"t":"Stripe: Rate limiters and load shedders","u":"https://stripe.com/blog/rate-limiters"},
    {"t":"Google SRE book: Handling Overload","u":"https://sre.google/sre-book/handling-overload/"},
    {"t":"RFC 6585: 429 Too Many Requests","u":"https://www.rfc-editor.org/rfc/rfc6585.html#section-4"}
  ],
  "pr-realtime-protocols": [
    {"t":"MDN: Server-sent events","u":"https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"},
    {"t":"RFC 6455: The WebSocket Protocol","u":"https://www.rfc-editor.org/rfc/rfc6455.html"},
    {"t":"gRPC docs: Core concepts","u":"https://grpc.io/docs/what-is-grpc/core-concepts/"}
  ],
  "pr-scaling-kinds": [
    {"t":"AWS Well-Architected: Reliability pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/framework/reliability.html"},
    {"t":"Kubernetes docs: Horizontal Pod Autoscaling","u":"https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"}
  ],
  "pr-security-ops": [
    {"t":"NIST SP 800-40r4: Patch Management","u":"https://csrc.nist.gov/pubs/sp/800/40/r4/final"},
    {"t":"FIRST: CVSS v3.1 Specification","u":"https://www.first.org/cvss/v3.1/specification-document"},
    {"t":"MITRE ATT&CK","u":"https://attack.mitre.org/"}
  ],
  "pr-security-owasp": [
    {"t":"OWASP Top 10","u":"https://owasp.org/projects/top-ten"},
    {"t":"OWASP Cheat Sheet Series","u":"https://cheatsheetseries.owasp.org/"},
    {"t":"OWASP ASVS","u":"https://asvs.owasp.org/"}
  ],
  "pr-singletons": [
    {"t":"Fowler: Registry","u":"https://martinfowler.com/eaaCatalog/registry.html"},
    {"t":"Kubernetes docs: Leases","u":"https://kubernetes.io/docs/concepts/architecture/leases/"},
    {"t":"etcd docs: API guarantees and leases","u":"https://etcd.io/docs/v3.5/learning/api/"}
  ],
  "pr-sizing": [
    {"t":"Google SRE book: Software Engineering in SRE","u":"https://sre.google/sre-book/software-engineering-in-sre/"},
    {"t":"AWS Well-Architected: Performance Efficiency","u":"https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"}
  ],
  "pr-solid": [
    {"t":"Fowler: Refactoring catalog","u":"https://refactoring.com/catalog/"},
    {"t":"Fowler: Dependency Injection","u":"https://martinfowler.com/articles/injection.html"},
    {"t":"Fowler: Inversion of Control","u":"https://martinfowler.com/bliki/InversionOfControl.html"}
  ],
  "pr-tenant-isolation-deep": [
    {"t":"AWS: SaaS Tenant Isolation Strategies","u":"https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html"},
    {"t":"PostgreSQL docs: Row Security Policies","u":"https://www.postgresql.org/docs/current/ddl-rowsecurity.html"},
    {"t":"Kubernetes docs: Multi-tenancy","u":"https://kubernetes.io/docs/concepts/security/multi-tenancy/"}
  ],
  "pr-test-strategy": [
    {"t":"Martin Fowler: Test Pyramid","u":"https://martinfowler.com/bliki/TestPyramid.html"},
    {"t":"Google SRE book: Testing for Reliability","u":"https://sre.google/sre-book/testing-reliability/"},
    {"t":"Martin Fowler: Contract Test","u":"https://martinfowler.com/bliki/ContractTest.html"}
  ],
  "pr-third-party-deps": [
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"},
    {"t":"Fowler: CircuitBreaker","u":"https://martinfowler.com/bliki/CircuitBreaker.html"},
    {"t":"AWS Builders Library: Timeouts, retries and backoff with jitter","u":"https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter"}
  ],
  "pr-threat-modeling": [
    {"t":"OWASP Threat Modeling Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html"},
    {"t":"Threat Modeling Manifesto","u":"https://www.threatmodelingmanifesto.org/"},
    {"t":"Microsoft: STRIDE threats","u":"https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats"}
  ],
  "pr-time-timestamps": [
    {"t":"RFC 3339: Date and Time on the Internet","u":"https://www.rfc-editor.org/rfc/rfc3339.html"},
    {"t":"IANA Time Zone Database","u":"https://www.iana.org/time-zones"},
    {"t":"Python docs: zoneinfo","u":"https://docs.python.org/3/library/zoneinfo.html"}
  ],
  "pr-unit-testing-craft": [
    {"t":"pytest docs: Get started","u":"https://docs.pytest.org/en/stable/getting-started.html"},
    {"t":"Jest docs: Getting Started","u":"https://jestjs.io/docs/getting-started"},
    {"t":"JUnit 5 User Guide","u":"https://docs.junit.org/6.1.3/overview.html"}
  ],
  "pr-validate-yourself": [
    {"t":"Google SRE book: Launch Coordination Checklist","u":"https://sre.google/sre-book/launch-checklist/"},
    {"t":"Google SRE book: Testing for Reliability","u":"https://sre.google/sre-book/testing-reliability/"}
  ],
  "processes-linux": [
    {"t":"man7: signal(7)","u":"https://man7.org/linux/man-pages/man7/signal.7.html"},
    {"t":"man7: credentials(7)","u":"https://man7.org/linux/man-pages/man7/credentials.7.html"},
    {"t":"Kubernetes docs: Pod termination","u":"https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination"}
  ],
  "python-infra-toolbox": [
    {"t":"Python docs: subprocess","u":"https://docs.python.org/3/library/subprocess.html"},
    {"t":"Python docs: asyncio","u":"https://docs.python.org/3/library/asyncio.html"},
    {"t":"Boto3 docs","u":"https://boto3.amazonaws.com/v1/documentation/api/latest/index.html"},
    {"t":"Python docs: pathlib","u":"https://docs.python.org/3/library/pathlib.html"}
  ],
  "python-web-frameworks": [
    {"t":"FastAPI docs","u":"https://fastapi.tiangolo.com/"},
    {"t":"Django docs: Deployment checklist","u":"https://docs.djangoproject.com/en/stable/howto/deployment/checklist/"},
    {"t":"Flask docs: Deploying to production","u":"https://flask.palletsprojects.com/en/stable/deploying/"}
  ],
  "raid-levels-deep": [
    {"t":"Linux kernel docs: md","u":"https://docs.kernel.org/admin-guide/md.html"},
    {"t":"OpenZFS docs: RAIDZ","u":"https://openzfs.github.io/openzfs-docs/Basic%20Concepts/RAIDZ.html"},
    {"t":"man7: mdadm(8)","u":"https://man7.org/linux/man-pages/man8/mdadm.8.html"}
  ],
  "random-numbers": [
    {"t":"man7: random(7)","u":"https://man7.org/linux/man-pages/man7/random.7.html"},
    {"t":"man7: getrandom(2)","u":"https://man7.org/linux/man-pages/man2/getrandom.2.html"},
    {"t":"NIST: SP 800-90A Rev. 1","u":"https://csrc.nist.gov/pubs/sp/800/90/a/r1/final"}
  ],
  "redis-deep": [
    {"t":"Redis docs: Data types","u":"https://redis.io/docs/latest/develop/data-types/"},
    {"t":"Redis docs: Persistence","u":"https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"},
    {"t":"Redis docs: Distributed locks","u":"https://redis.io/docs/latest/develop/use/patterns/distributed-locks/"},
    {"t":"Redis docs: Cluster spec","u":"https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"}
  ],
  "regex-for-engineers": [
    {"t":"Python docs: re module","u":"https://docs.python.org/3/library/re.html"},
    {"t":"man7: regex(7)","u":"https://man7.org/linux/man-pages/man7/regex.7.html"},
    {"t":"MDN: Regular expressions","u":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions"},
    {"t":"OWASP: Regular expression DoS (ReDoS)","u":"https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS"}
  ],
  "rel-bcdr": [
    {"t":"AWS whitepaper: Disaster recovery options in the cloud","u":"https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html"},
    {"t":"Google Cloud: Disaster recovery planning guide","u":"https://cloud.google.com/architecture/dr-scenarios-planning-guide"},
    {"t":"Azure: Reliability guidance overview","u":"https://learn.microsoft.com/en-us/azure/reliability/reliability-guidance-overview"}
  ],
  "rel-capacity-planning": [
    {"t":"Google SRE book: Software Engineering in SRE","u":"https://sre.google/sre-book/software-engineering-in-sre/"},
    {"t":"k6 docs: Load test types","u":"https://grafana.com/docs/k6/latest/testing-guides/test-types/"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"}
  ],
  "rel-cert-operations": [
    {"t":"cert-manager docs","u":"https://cert-manager.io/docs/"},
    {"t":"Lets Encrypt: How It Works","u":"https://letsencrypt.org/how-it-works/"},
    {"t":"RFC 8555: ACME","u":"https://www.rfc-editor.org/rfc/rfc8555"}
  ],
  "rel-chaos-engineering": [
    {"t":"Principles of Chaos Engineering","u":"https://principlesofchaos.org/"},
    {"t":"AWS Fault Injection Service docs","u":"https://docs.aws.amazon.com/fis/latest/userguide/what-is.html"},
    {"t":"Chaos Mesh docs","u":"https://chaos-mesh.org/docs/"}
  ],
  "rel-dependency-analysis": [
    {"t":"Google SRE book: Embracing Risk","u":"https://sre.google/sre-book/embracing-risk/"},
    {"t":"AWS Well-Architected: Design principles","u":"https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/design-principles.html"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"}
  ],
  "rel-deployments": [
    {"t":"Google SRE book: Release Engineering","u":"https://sre.google/sre-book/release-engineering/"},
    {"t":"Kubernetes docs: Deployments","u":"https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"},
    {"t":"Argo Rollouts docs","u":"https://argo-rollouts.readthedocs.io/en/stable/"},
    {"t":"Martin Fowler: BlueGreenDeployment","u":"https://martinfowler.com/bliki/BlueGreenDeployment.html"}
  ],
  "rel-dr-drills": [
    {"t":"AWS Well-Architected: Disaster recovery objectives","u":"https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html"},
    {"t":"AWS whitepaper: DR of workloads on AWS","u":"https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html"},
    {"t":"Principles of Chaos Engineering","u":"https://principlesofchaos.org/"}
  ],
  "rel-error-budgets": [
    {"t":"Google SRE workbook: Error Budget Policy","u":"https://sre.google/workbook/error-budget-policy/"},
    {"t":"Google SRE workbook: Alerting on SLOs","u":"https://sre.google/workbook/alerting-on-slos/"},
    {"t":"Google SRE book: Embracing Risk","u":"https://sre.google/sre-book/embracing-risk/"}
  ],
  "rel-ha": [
    {"t":"AWS Well-Architected: Reliability Pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"},
    {"t":"Azure Well-Architected: Reliability pillar","u":"https://learn.microsoft.com/en-us/azure/well-architected/reliability/"},
    {"t":"Google Cloud: Architecture Framework Reliability","u":"https://cloud.google.com/architecture/framework/reliability"}
  ],
  "rel-incident-comms": [
    {"t":"Google SRE book: Managing Incidents","u":"https://sre.google/sre-book/managing-incidents/"},
    {"t":"Google SRE book: Postmortem Culture","u":"https://sre.google/sre-book/postmortem-culture/"},
    {"t":"Atlassian: Incident Handbook","u":"https://www.atlassian.com/incident-management/handbook"}
  ],
  "rel-incident-management": [
    {"t":"Google SRE book: Managing Incidents","u":"https://sre.google/sre-book/managing-incidents/"},
    {"t":"Google SRE book: Postmortem Culture","u":"https://sre.google/sre-book/postmortem-culture/"},
    {"t":"Google SRE workbook: Incident Response","u":"https://sre.google/workbook/incident-response/"}
  ],
  "rel-measure-resource-needs": [
    {"t":"Kubernetes docs: Resource management for Pods and containers","u":"https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"},
    {"t":"Kubernetes docs: Vertical Pod Autoscaling","u":"https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/"},
    {"t":"man7: proc(5)","u":"https://man7.org/linux/man-pages/man5/proc.5.html"}
  ],
  "rel-runbooks-oncall": [
    {"t":"Google SRE Book: Being On-Call","u":"https://sre.google/sre-book/being-on-call/"},
    {"t":"Google SRE Book: Effective Troubleshooting","u":"https://sre.google/sre-book/effective-troubleshooting/"},
    {"t":"Google SRE Workbook: On-Call","u":"https://sre.google/workbook/on-call/"}
  ],
  "rel-safe-config-changes": [
    {"t":"Google SRE Workbook: Configuration Design and Best Practices","u":"https://sre.google/workbook/configuration-design/"},
    {"t":"Google SRE Workbook: Configuration Specifics","u":"https://sre.google/workbook/configuration-specifics/"},
    {"t":"Google SRE Workbook: Canarying Releases","u":"https://sre.google/workbook/canarying-releases/"}
  ],
  "rel-sli-slo-sla": [
    {"t":"Google SRE book: Service Level Objectives","u":"https://sre.google/sre-book/service-level-objectives/"},
    {"t":"Google SRE workbook: Implementing SLOs","u":"https://sre.google/workbook/implementing-slos/"},
    {"t":"AWS: Compute SLA","u":"https://aws.amazon.com/compute/sla/"}
  ],
  "release-engineering": [
    {"t":"Semantic Versioning 2.0.0","u":"https://semver.org/"},
    {"t":"Martin Fowler: Blue Green Deployment","u":"https://martinfowler.com/bliki/BlueGreenDeployment.html"},
    {"t":"Google SRE Workbook: Canarying Releases","u":"https://sre.google/workbook/canarying-releases/"}
  ],
  "runtime-threads-in-containers": [
    {"t":"Kubernetes docs: Resource management for Pods and containers","u":"https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"},
    {"t":"Linux kernel docs: CFS bandwidth control","u":"https://www.kernel.org/doc/html/latest/scheduler/sched-bwc.html"},
    {"t":"Go: runtime package","u":"https://pkg.go.dev/runtime#GOMAXPROCS"}
  ],
  "s3-deep": [
    {"t":"AWS docs: S3 User Guide","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"},
    {"t":"AWS docs: S3 multipart upload","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html"},
    {"t":"AWS docs: S3 Event Notifications","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html"}
  ],
  "sd-patterns-catalog": [
    {"t":"Azure Architecture Center: Cloud design patterns","u":"https://learn.microsoft.com/en-us/azure/architecture/patterns/"},
    {"t":"AWS Builders Library","u":"https://aws.amazon.com/builders-library/"},
    {"t":"Martin Fowler: Circuit Breaker","u":"https://martinfowler.com/bliki/CircuitBreaker.html"}
  ],
  "sql-basics-joins": [
    {"t":"PostgreSQL docs: Joins Between Tables","u":"https://www.postgresql.org/docs/current/tutorial-join.html"},
    {"t":"PostgreSQL docs: Table Expressions (FROM, JOIN)","u":"https://www.postgresql.org/docs/current/queries-table-expressions.html"}
  ],
  "sql-ctes-advanced": [
    {"t":"PostgreSQL docs: WITH Queries (CTEs)","u":"https://www.postgresql.org/docs/current/queries-with.html"},
    {"t":"PostgreSQL docs: Using EXPLAIN","u":"https://www.postgresql.org/docs/current/using-explain.html"}
  ],
  "sql-window-functions": [
    {"t":"PostgreSQL docs: Window Functions tutorial","u":"https://www.postgresql.org/docs/current/tutorial-window.html"},
    {"t":"PostgreSQL docs: Window Functions reference","u":"https://www.postgresql.org/docs/current/functions-window.html"}
  ],
  "staff-cells-blast-radius": [
    {"t":"AWS Builders Library: Workload isolation using shuffle-sharding","u":"https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/"},
    {"t":"AWS Builders Library: Static stability using Availability Zones","u":"https://aws.amazon.com/builders-library/static-stability-using-availability-zones/"},
    {"t":"AWS whitepaper: What is a cell-based architecture","u":"https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/what-is-a-cell-based-architecture.html"}
  ],
  "staff-consensus-consistency": [
    {"t":"Raft paper","u":"https://raft.github.io/raft.pdf"},
    {"t":"etcd docs: Learning","u":"https://etcd.io/docs/latest/learning/"},
    {"t":"Kleppmann: How to do distributed locking","u":"https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"},
    {"t":"ZooKeeper docs: Overview","u":"https://zookeeper.apache.org/doc/current/zookeeperOver.html"}
  ],
  "staff-design-docs": [
    {"t":"ADR GitHub organization","u":"https://adr.github.io/"},
    {"t":"Python PEP 1: PEP Purpose and Guidelines","u":"https://peps.python.org/pep-0001/"},
    {"t":"Rust RFC template","u":"https://github.com/rust-lang/rfcs/blob/master/0000-template.md"}
  ],
  "staff-ebpf-cilium": [
    {"t":"Cilium docs: Introduction","u":"https://docs.cilium.io/en/stable/overview/intro/"},
    {"t":"ebpf.io: What is eBPF","u":"https://ebpf.io/what-is-ebpf/"},
    {"t":"Tetragon docs: Overview","u":"https://tetragon.io/docs/overview/"}
  ],
  "staff-exactly-once": [
    {"t":"Microservices.io: Transactional outbox","u":"https://microservices.io/patterns/data/transactional-outbox.html"},
    {"t":"Debezium docs: Outbox event router","u":"https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html"},
    {"t":"Kafka docs: Message delivery semantics","u":"https://kafka.apache.org/documentation/#semantics"},
    {"t":"Microservices.io: Saga pattern","u":"https://microservices.io/patterns/data/saga.html"}
  ],
  "staff-influence": [
    {"t":"Google SRE workbook: Engagement Model","u":"https://sre.google/workbook/engagement-model/"},
    {"t":"StaffEng: Guides","u":"https://staffeng.com/guides/"},
    {"t":"Google SRE book: Communication and Collaboration","u":"https://sre.google/sre-book/communication-and-collaboration/"}
  ],
  "staff-interview-loop": [
    {"t":"StaffEng: What do Staff engineers actually do","u":"https://staffeng.com/guides/what-do-staff-engineers-actually-do/"},
    {"t":"StaffEng: Staff archetypes","u":"https://staffeng.com/guides/staff-archetypes/"}
  ],
  "staff-kafka-deep": [
    {"t":"Kafka docs: Design","u":"https://kafka.apache.org/documentation/#design"},
    {"t":"Kafka docs: KRaft","u":"https://kafka.apache.org/documentation/#kraft"},
    {"t":"Kafka docs: Log compaction","u":"https://kafka.apache.org/documentation/#compaction"}
  ],
  "staff-large-incidents": [
    {"t":"Google SRE book: Managing Incidents","u":"https://sre.google/sre-book/managing-incidents/"},
    {"t":"Google SRE book: Postmortem Culture","u":"https://sre.google/sre-book/postmortem-culture/"},
    {"t":"PagerDuty Incident Response docs","u":"https://response.pagerduty.com/"}
  ],
  "staff-migrations-at-scale": [
    {"t":"Martin Fowler: StranglerFigApplication","u":"https://martinfowler.com/bliki/StranglerFigApplication.html"},
    {"t":"Google SRE book: Release Engineering","u":"https://sre.google/sre-book/release-engineering/"},
    {"t":"Martin Fowler: ParallelChange","u":"https://martinfowler.com/bliki/ParallelChange.html"}
  ],
  "staff-multi-region-data": [
    {"t":"DynamoDB docs: Global tables","u":"https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html"},
    {"t":"Shapiro et al.: Conflict-free Replicated Data Types","u":"https://inria.hal.science/inria-00555588/document"},
    {"t":"Spanner docs: Replication","u":"https://cloud.google.com/spanner/docs/replication"}
  ],
  "staff-overload-metastable": [
    {"t":"Bronson et al.: Metastable Failures in Distributed Systems","u":"https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf"},
    {"t":"AWS Builders Library: Timeouts, retries and backoff with jitter","u":"https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"},
    {"t":"AWS Builders Library: Using load shedding to avoid overload","u":"https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/"},
    {"t":"Google SRE book: Addressing Cascading Failures","u":"https://sre.google/sre-book/addressing-cascading-failures/"}
  ],
  "staff-platform-engineering": [
    {"t":"CNCF: Platforms White Paper","u":"https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
    {"t":"Backstage docs: What is Backstage","u":"https://backstage.io/docs/overview/what-is-backstage"},
    {"t":"Kubernetes docs: Multi-tenancy","u":"https://kubernetes.io/docs/concepts/security/multi-tenancy/"}
  ],
  "staff-postgres-at-scale": [
    {"t":"PostgreSQL docs: MVCC intro","u":"https://www.postgresql.org/docs/current/mvcc-intro.html"},
    {"t":"PostgreSQL docs: Routine Vacuuming","u":"https://www.postgresql.org/docs/current/routine-vacuuming.html"},
    {"t":"PgBouncer docs: Config","u":"https://www.pgbouncer.org/config.html"},
    {"t":"PostgreSQL docs: Logical Replication","u":"https://www.postgresql.org/docs/current/logical-replication.html"}
  ],
  "staff-production-readiness": [
    {"t":"Google SRE book: Eliminating Toil","u":"https://sre.google/sre-book/eliminating-toil/"},
    {"t":"Google SRE book: Being On-Call","u":"https://sre.google/sre-book/being-on-call/"},
    {"t":"Google SRE book: Launch Coordination Checklist","u":"https://sre.google/sre-book/launch-checklist/"}
  ],
  "staff-queueing-tail-latency": [
    {"t":"Dean and Barroso: The Tail at Scale","u":"https://research.google/pubs/the-tail-at-scale/"},
    {"t":"Google SRE book: Handling Overload","u":"https://sre.google/sre-book/handling-overload/"},
    {"t":"AWS Builders Library: Timeouts, retries and backoff with jitter","u":"https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"}
  ],
  "staff-service-mesh": [
    {"t":"Istio docs: Ambient mode overview","u":"https://istio.io/latest/docs/ambient/overview/"},
    {"t":"Istio docs: Architecture","u":"https://istio.io/latest/docs/ops/deployment/architecture/"},
    {"t":"Linkerd docs: Architecture","u":"https://linkerd.io/2/reference/architecture/"}
  ],
  "staff-supply-chain": [
    {"t":"SLSA spec v1.0","u":"https://slsa.dev/spec/v1.0/"},
    {"t":"Sigstore docs: Cosign signing overview","u":"https://docs.sigstore.dev/cosign/signing/overview/"},
    {"t":"CycloneDX specification overview","u":"https://cyclonedx.org/specification/overview/"},
    {"t":"Kubernetes docs: Admission Controllers","u":"https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/"},
    {"t":"in-toto: Attestation framework spec","u":"https://github.com/in-toto/attestation"},
    {"t":"OpenSSF Scorecard: checks","u":"https://github.com/ossf/scorecard/blob/main/docs/checks.md"},
    {"t":"NIST SP 800-218: SSDF","u":"https://csrc.nist.gov/pubs/sp/800/218/final"}
  ],
  "staff-tech-strategy": [
    {"t":"Amazon 2015 shareholder letter (two-way doors)","u":"https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders"},
    {"t":"Martin Fowler: Technical Debt","u":"https://martinfowler.com/bliki/TechnicalDebt.html"},
    {"t":"AWS Well-Architected: Cost optimization pillar","u":"https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html"}
  ],
  "staff-terraform-at-scale": [
    {"t":"Terraform docs: Backends","u":"https://developer.hashicorp.com/terraform/language/backend"},
    {"t":"Terraform docs: Import","u":"https://developer.hashicorp.com/terraform/language/import"},
    {"t":"OPA docs: Policy language","u":"https://www.openpolicyagent.org/docs/latest/policy-language/"},
    {"t":"Terraform docs: Module structure","u":"https://developer.hashicorp.com/terraform/language/modules/develop/structure"}
  ],
  "staff-time-ordering": [
    {"t":"Lamport: Time, Clocks, and the Ordering of Events","u":"https://lamport.azurewebsites.net/pubs/time-clocks.pdf"},
    {"t":"Spanner paper","u":"https://research.google/pubs/spanner-googles-globally-distributed-database-2/"},
    {"t":"Spanner docs: TrueTime and external consistency","u":"https://cloud.google.com/spanner/docs/true-time-external-consistency"}
  ],
  "staff-zero-downtime-migrations": [
    {"t":"PostgreSQL docs: ALTER TABLE","u":"https://www.postgresql.org/docs/current/sql-altertable.html"},
    {"t":"PostgreSQL docs: CREATE INDEX","u":"https://www.postgresql.org/docs/current/sql-createindex.html"},
    {"t":"Martin Fowler: ParallelChange","u":"https://martinfowler.com/bliki/ParallelChange.html"}
  ],
  "staff-zero-trust-secrets": [
    {"t":"NIST SP 800-207: Zero Trust Architecture","u":"https://csrc.nist.gov/pubs/sp/800/207/final"},
    {"t":"SPIFFE docs: Concepts","u":"https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"},
    {"t":"Vault docs: Secrets engines","u":"https://developer.hashicorp.com/vault/docs/secrets"},
    {"t":"Kubernetes docs: Service Accounts","u":"https://kubernetes.io/docs/concepts/security/service-accounts/"}
  ],
  "static-site-hosting": [
    {"t":"Amazon S3 docs: Hosting a static website","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html"},
    {"t":"MDN: HTTP caching","u":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching"},
    {"t":"RFC 9111: HTTP Caching","u":"https://www.rfc-editor.org/rfc/rfc9111"},
    {"t":"GitHub Pages docs","u":"https://docs.github.com/en/pages"}
  ],
  "storage-io": [
    {"t":"man7: iostat(1)","u":"https://man7.org/linux/man-pages/man1/iostat.1.html"},
    {"t":"AWS docs: EBS volume types","u":"https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html"},
    {"t":"Linux kernel docs: Block layer","u":"https://docs.kernel.org/block/index.html"}
  ],
  "storage-kinds-map": [
    {"t":"AWS: What is object storage","u":"https://aws.amazon.com/what-is/object-storage/"},
    {"t":"Amazon S3 user guide","u":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"},
    {"t":"Amazon EBS user guide","u":"https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html"},
    {"t":"Amazon EFS user guide","u":"https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html"}
  ],
  "terraform-production-workflow": [
    {"t":"Terraform docs: Remote state","u":"https://developer.hashicorp.com/terraform/language/state/remote"},
    {"t":"Terraform docs: S3 backend","u":"https://developer.hashicorp.com/terraform/language/backend/s3"},
    {"t":"Terraform docs: Refactoring with moved blocks","u":"https://developer.hashicorp.com/terraform/language/modules/develop/refactoring"},
    {"t":"Terraform docs: Import","u":"https://developer.hashicorp.com/terraform/language/import"}
  ],
  "transpilers-bundlers": [
    {"t":"esbuild docs: Getting started","u":"https://esbuild.github.io/getting-started/"},
    {"t":"webpack: Concepts","u":"https://webpack.js.org/concepts/"},
    {"t":"Babel docs: Usage guide","u":"https://babeljs.io/docs/usage"}
  ],
  "ts-platform-toolbox": [
    {"t":"TypeScript Handbook","u":"https://www.typescriptlang.org/docs/handbook/intro.html"},
    {"t":"Node.js docs: Event loop, timers, nextTick","u":"https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"},
    {"t":"Zod docs","u":"https://zod.dev/"},
    {"t":"AWS CDK developer guide","u":"https://docs.aws.amazon.com/cdk/v2/guide/home.html"}
  ],
  "uuid-guid-deep": [
    {"t":"RFC 9562: UUIDs","u":"https://www.rfc-editor.org/rfc/rfc9562"},
    {"t":"PostgreSQL docs: UUID type","u":"https://www.postgresql.org/docs/current/datatype-uuid.html"},
    {"t":"ULID spec","u":"https://github.com/ulid/spec"}
  ],
  "virtualization-deep": [
    {"t":"KVM docs","u":"https://www.linux-kvm.org/page/Documents"},
    {"t":"Firecracker: design doc","u":"https://github.com/firecracker-microvm/firecracker/blob/main/docs/design.md"},
    {"t":"libvirt docs","u":"https://libvirt.org/docs.html"},
    {"t":"Proxmox VE admin guide","u":"https://pve.proxmox.com/pve-docs/pve-admin-guide.html"}
  ],
  "vms": [
    {"t":"KVM project: Documentation","u":"https://linux-kvm.org/page/Documents"},
    {"t":"AWS docs: Nitro System components","u":"https://docs.aws.amazon.com/whitepapers/latest/security-design-of-aws-nitro-system/the-components-of-the-nitro-system.html"},
    {"t":"Linux kernel docs: KVM API","u":"https://docs.kernel.org/virt/kvm/api.html"}
  ],
  "web-service-production-checklist": [
    {"t":"The Twelve-Factor App","u":"https://12factor.net/"},
    {"t":"Kubernetes docs: Liveness, readiness, startup probes","u":"https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"},
    {"t":"OWASP: REST Security Cheat Sheet","u":"https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html"}
  ],
  "windows-active-directory": [
    {"t":"Microsoft Learn: Active Directory Domain Services overview","u":"https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview"},
    {"t":"Microsoft Learn: Group Policy overview","u":"https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview"},
    {"t":"Microsoft Learn: Kerberos authentication overview","u":"https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview"}
  ]
};
