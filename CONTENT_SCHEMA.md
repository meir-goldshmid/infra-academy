# Content schema

All content lives in `content/*.js` as plain (non-module) scripts loaded by `index.html` via `<script>` tags.
No build step, no imports, works from `file://` and GitHub Pages.

Every file starts with:

```js
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
```

and then pushes objects. Every user-facing string is bilingual: `{ en: "...", he: "..." }`.
Hebrew must be natural, written by a Hebrew-speaking engineer: keep technical terms in English
inside Hebrew text where Israeli engineers would (Pod, Deployment, Load Balancer, latency, SLO, Kafka...).

## Lesson

```js
INFRA.lessons.push({
  id: "k8s-pods",               // unique, kebab-case
  track: "kubernetes",          // one of the track ids below
  order: 2,                     // order inside the track
  icon: "📦",                   // one emoji
  level: 1,                     // 1 = basics, 2 = working knowledge, 3 = senior/deep
  minutes: 7,                   // reading time estimate
  title:   { en: "Pods", he: "Pods – היחידה הקטנה ביותר" },
  tldr:    { en: "One sentence that sticks.", he: "..." },
  analogy: { en: "A memorable real-life analogy (2-4 sentences).", he: "..." },
  sections: [                   // 3-6 sections; the actual explanation
    { h: { en: "...", he: "..." }, body: { en: "<p>HTML</p>", he: "<p>HTML</p>" } }
  ],
  diagram: "client -> LB -> [pod1, pod2]",   // OPTIONAL plain-text ASCII diagram (language-neutral, monospace)
  handsOn: [                    // 2-5 things to actually type & try (docker, kubectl, linux, curl...)
    { cmd: "kubectl get pods -o wide", what: { en: "...", he: "..." } }
  ],
  mnemonic: { en: "A memory hook / acronym / rhyme", he: "..." },
  pitfalls: [ { en: "Common mistake + why", he: "..." } ],          // 2-4
  interview: [ { q: { en, he }, a: { en, he } } ],                  // 2-3 interview-style Q&A
  quiz: [                                                           // exactly 3-4 questions
    { q: { en, he }, options: [ { en, he }, { en, he }, { en, he }, { en, he } ], answer: 1,
      explain: { en, he } }
  ],
  playground: "lb",             // OPTIONAL id of an interactive simulator (see list below)
  related: ["k8s-services"]     // OPTIONAL ids of other lessons
});
```

Allowed HTML in `body`: `<p> <ul> <ol> <li> <strong> <em> <code> <pre> <table> <tr> <th> <td> <br> <blockquote>`.
Use `<blockquote>` for "💡 Real world" / "⚠️ Production tip" callouts. Use `<pre>` for YAML/config snippets.
Escape `<` and `>` inside `<pre>`/`<code>` as `&lt;` `&gt;`. Strings use JS double quotes or template literals — make sure the file parses (`node --check`).

## Glossary term

```js
INFRA.glossary.push({ term: "Pod", track: "kubernetes", def: { en: "One-line definition", he: "..." }, lesson: "k8s-pods" });
```

## Incident scenario (on-call simulator, choose-your-own-adventure)

```js
INFRA.scenarios.push({
  id: "oom-crashloop",
  icon: "🔥",
  title: { en: "...", he: "..." },
  start: "s1",
  steps: {
    s1: { text: { en: "PagerDuty fires: ...", he: "..." },
          data: "OPTIONAL monospace snippet: logs/metrics/kubectl output",
          choices: [ { label: { en, he }, next: "s2", score: 10, feedback: { en, he } } ] },
    win: { text: { en, he }, end: "win" },
    lose: { text: { en, he }, end: "lose" }
  },
  lessons: ["k8s-resources"]
});
```

## Track ids

| id | name |
|---|---|
| foundations | Compute foundations: CPU, memory, disk/IO, processes, Linux, VMs |
| linux | Linux command line: files, permissions, text processing, processes, systemd, networking, disks, SSH, bash |
| containers | Docker & containers |
| kubernetes | Kubernetes |
| networking | Networking, DNS, LB, firewalls, isolation |
| architecture | Microservices, queues, brokers, caching, API gateways |
| data | Databases, replication, sharding, backups |
| observability | Metrics, logs, traces, alerting |
| reliability | SLI/SLO/SLA, incidents, HA, BCDR |
| cloud | Cloud models, IaC, CI/CD, IAM, security, FinOps |
| staff | Senior & Staff+: distributed systems depth, platform/security at scale, design docs, strategy, migrations, leadership |
| flows | End-to-End Flows: one request followed hop by hop through every layer (lessons in this track must have a `flow`) |
| principal | Principal Engineer Playbook: requirements & questions, sizing, testing, validation, DB kinds, scaling, CAP/PACELC, clusters, integration, idempotency, queues, rate limiters, 3rd-party deps, SOLID, design patterns, singletons, concurrency, event loop, async/await, GC, HTTP versions, email/SMS/realtime protocols |

## Simulator ids (implemented in `js/sims.js`)

`lb` (load balancer), `resources` (CPU/memory requests & limits, throttling, OOMKill), `queue` (producer/consumer/backlog/DLQ),
`slo` (error budget calculator), `cidr` (subnet calculator), `firewall` (ordered rule tester), `scheduler` (k8s scheduling & node failure),
`dr` (RPO/RTO & DR strategy), `cache` (cache hit ratio & latency), `scaling` (autoscaling vs traffic), `terminal` (fake shell), `eviction` (FIFO vs LRU vs LFU cache eviction side by side).

## Interview prep — system design case (`INFRA.designs`)

```js
window.INFRA.designs = window.INFRA.designs || [];
INFRA.designs.push({
  id: "sd-url-shortener", icon: "🔗", level: 1,            // 1 warm-up, 2 classic, 3 senior
  title:  { en, he },
  prompt: { en: "The interviewer's exact question", he },
  clarify: [ { en: "Question you should ask", he } ],          // 4-6
  functional:    [ { en, he } ],                               // 3-5
  nonFunctional: [ { en, he } ],                               // 3-5 (scale, latency, availability, consistency…)
  estimates: { en: "<p>HTML back-of-envelope math with real numbers</p>", he },
  api: "POST /api/v1/urls {long_url} -> 201 {short}\nGET /{code} -> 301",   // plain text, language-neutral
  dataModel: "urls(code PK, long_url, owner_id, created_at, expires_at)",  // plain text
  diagram: "ASCII architecture diagram",                       // plain text
  deepDives: [ { h: { en, he }, body: { en: "<p>HTML</p>", he } } ],   // 3-5: bottlenecks, scaling, data, caching, failure modes
  tradeoffs: [ { en, he } ],                                   // 3-5
  followUps: [ { q: { en, he }, a: { en, he } } ],             // 3-4 harder interviewer follow-ups
  related: ["arch-caching", "db-sharding"]                     // lesson ids
});
```

## Interview prep — coding problem (`INFRA.problems`)

```js
window.INFRA.problems = window.INFRA.problems || [];
INFRA.problems.push({
  id: "lru-cache", icon: "🧠", difficulty: "medium",           // easy | medium | hard
  tags: ["hashmap", "linked-list", "design"],
  leetcode: "146",                                             // OPTIONAL LeetCode number if a classic equivalent exists
  title: { en, he },
  statement: { en: "<p>HTML problem statement</p>", he },
  examples: "Input: ...\nOutput: ...",                         // plain text
  hints: [ { en, he } ],                                       // 2-3, progressive
  solution: "python code (clean, commented in English)",
  explain: { en: "<p>HTML walkthrough of the approach</p>", he },
  complexity: "Time O(1) per op, Space O(capacity)",
  whyInfra: { en: "Where this exact idea lives in real infrastructure", he },
  followUps: [ { q: { en, he }, a: { en, he } } ]              // 1-3
});
```

## Learning path (`INFRA.paths`, in `content/paths.js`)

Guided journeys across tracks. The app shows them at `#/paths`, puts a "next step" bar on lessons in the path the
learner follows, and lists them in each lesson's "Where this fits" box. Plain strings only (no HTML).

```js
INFRA.paths = INFRA.paths || [];
INFRA.paths.push({
  id: "principal", icon: "👑", color: "#5f3dc4",
  title: { en, he }, blurb: { en, he },     // blurb: what you can do at the end
  audience: { en, he },                      // who it's for / what to know first
  stages: [ {
    title: { en, he },                       // "Stage 1 · Think before you draw"
    intro: { en, he },                       // 2-3 sentences: why this stage, how it connects
    steps: [ { lesson: "pr-architect-questions", why: { en, he } } ]   // why: one sentence, why it comes now
  } ]
});
```

Every `lesson` must be an existing lesson id (`node tools/validate.js` checks it).
Lesson pages also link glossary terms automatically (first mention of each term, to the term's `lesson`), so give new glossary terms a `lesson`.

## End-to-end flow (`flow` field on a lesson)

Required for lessons in the `flows` track, optional elsewhere. The app renders it as an interactive stepper
(actors strip, one hop at a time with running time total, failure box, Play, full step list).

```js
flow: {
  actors: ["Browser", "DNS resolver", "CDN edge", "API service", "Postgres"],   // plain, short, language-neutral
  steps: [
    { from: 0, to: 1, ms: 20,                          // actor indexes; ms = time this hop adds (optional; any size, shown as ms/s/min/h/days)
      label:  { en: "Resolve api.shop.com", he: "..." },                     // plain text
      detail: { en: "<p>HTML: what happens, real config in <pre></p>", he },   // raw HTML: escape < > inside
      fail:   { en: "HTML: what breaks, symptom, detection, mitigation", he } } // optional, include on most steps
  ]
}
```
12-20 steps per flow. `node tools/validate.js` checks indexes, bilingual fields and that `flows` lessons have a flow.
