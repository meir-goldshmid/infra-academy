# 🛰️ Infra Academy

Learn infrastructure & cloud like you'll be on-call tomorrow — in **Hebrew and English**.

Kubernetes · Docker · VMs · CPU & memory · Linux · networking · DNS · TLS · load balancers · VPCs · firewalls & network isolation ·
microservices · queues & message brokers · caching · databases · replication & sharding · backups · metrics, logs & traces ·
alerting · SLI/SLO/SLA · error budgets · HA · BCDR (RPO/RTO) · incident management · deployments · Terraform · CI/CD · IAM · FinOps.

## What's inside

| | |
|---|---|
| 📚 **Lessons** | TL;DR → analogy → real explanation → diagram → hands-on commands → memory hook → pitfalls → interview Q&A → quiz |
| 🎮 **Playground** | 11 simulators: load balancer, requests/limits & OOMKill, queues & DLQ, SLO/error budget, CIDR, firewall rules, k8s scheduler, DR (RPO/RTO), cache hit ratio, autoscaling, debug terminal |
| 📟 **On-call simulator** | Choose-your-own-adventure incidents (OOM crashloop, DNS, queue backlog, expired cert, region down, cost spike…) |
| 🃏 **Flashcards** | Spaced repetition (Leitner) built from the glossary and interview questions |
| ⌨️ **Command cookbook** | Every command from every lesson, searchable |
| 🔎 **Search** | Press `/` anywhere |
| 🔥 **Progress** | XP, ranks, daily streak, notes per lesson (stored in your browser; export/import from the home page) |

## Run it

No build, no dependencies. Open `index.html` in a browser, or:

```bash
python -m http.server 8000   # then http://localhost:8000
```

## Use Claude Code as your tutor (instead of a chat or Google)

Open Claude Code in this folder (`claude`). `CLAUDE.md` turns it into an infra tutor, and these skills are included:

- `/explain <question>` — Academy-style answer: analogy, mechanics, production example, commands, pitfalls, memory hook.
- `/teach <topic>` — writes a new bilingual lesson into `content/my-lessons.js` and validates it.
- `/quiz-me <track>` — a mock interview, one question at a time, graded.
- `/publish` — validate, commit, push → GitHub Pages updates.

## Add content by hand

See [`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md), then run `node tools/validate.js`.
