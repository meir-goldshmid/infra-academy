---
name: explain
description: Answer an infra/cloud question in the Infra Academy style (analogy, mechanics, production example, commands, pitfalls, memory hook). Use for /explain <question>.
---

# /explain <question>

Question: $ARGUMENTS

1. Grep `content/` for the key terms. If lessons cover it, base your answer on them and link them (`#/lesson/<id>`).
2. Answer in the language of the question (Hebrew → Hebrew with English technical terms). Structure:
   - **🎭 Analogy** — one everyday picture.
   - **⚙️ How it really works** — precise, with real numbers.
   - **🏭 In production** — a concrete scenario, what it looks like in kubectl/logs/metrics.
   - **⌨️ Try it** — 1-3 real commands.
   - **🕳️ Pitfalls** — 1-3.
   - **🧠 Memory hook** — one line.
   - **❓ Check yourself** — 2 short questions (answers hidden at the end).
3. Finish by offering: "Want me to save this as a lesson? → /teach <topic>".
