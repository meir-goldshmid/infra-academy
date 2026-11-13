# 🛰️ Infra Academy

Learn infrastructure & cloud like you'll be on-call tomorrow — in **Hebrew and English**.

Kubernetes · Docker · VMs · CPU & memory · Linux · networking · DNS · TLS · load balancers · VPCs · firewalls & network isolation ·
microservices · queues & message brokers · caching · databases · replication & sharding · backups · metrics, logs & traces ·
alerting · SLI/SLO/SLA · error budgets · HA · BCDR (RPO/RTO) · incident management · deployments · Terraform · CI/CD · IAM · FinOps ·
Senior & Staff+: consensus, Kafka internals, tail latency, overload & metastable failures, cells, service mesh, zero trust, supply chain, eBPF, Postgres at scale, design docs, tech strategy, migrations at scale.

## What's inside

| | |
|---|---|
| 🎓 **CS Degree** | 13 units / 90 Duolingo-style lessons (logic, bits, proofs, logs, Big-O, probability, data structures, algorithms, graphs, calculus, linear algebra, theory of computation) with 10 interactive labs and mistake review — merged from CS Degree Quest |
| 🎯 **Interview prep** | Top 50 Senior→Principal questions reported at big tech (with what they test + answer outlines), system design cases, LeetCode-style coding problems for infra roles, timed mock interviews, question bank, behavioral prep |
| 👑 **Principal Engineer Playbook** | 41 lessons on the head knowledge: questions to ask before designing, goals vs non-goals, sizing, network plan, test strategy, self-validation, monitoring/logging plan; DB kinds, scaling kinds, CAP/PACELC, clusters; idempotency, integration styles, queue kinds, rate limiters, 3rd-party dependencies; SOLID, design patterns, singletons, cloud patterns; concurrency vs parallelism vs multiprocessing, event loop, async/await, GC; HTTP/1.1→2→3, email/SMS, realtime protocols; Node vs other platforms, big data/Hadoop, backups, privacy; time & timestamps, auth, IDs & pagination, multi-tenancy, OWASP, race conditions & deadlocks (code + DB), React/Vue/Angular, checksums & hashing, bitwise, encoding |
| 📚 **Lessons** | TL;DR → analogy → real explanation → diagram → hands-on commands → memory hook → pitfalls → interview Q&A → quiz |
| 🎮 **Playground** | 12 simulators: cache eviction (LRU vs LFU vs FIFO), load balancer, requests/limits & OOMKill, queues & DLQ, SLO/error budget, CIDR, firewall rules, k8s scheduler, DR (RPO/RTO), cache hit ratio, autoscaling, debug terminal |
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
CS Degree units live in `content/cs/<id>.js` (English, `CQ.unit`) with Hebrew translations in `content/cs-he/<id>.js` (`CQ.unitHe`, identical structure); validate with `node tools/validate-cs.js`.
