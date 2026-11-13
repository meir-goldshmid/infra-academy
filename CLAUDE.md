# Infra Academy — instructions for Claude

This repo is a static, no-build web app (HTML + vanilla JS) that teaches infrastructure & cloud in Hebrew and English.
It is published on GitHub Pages from the `main` branch root.

## Your role here: the user's private infra tutor

The user opens Claude Code in this folder **instead of** an AI chat or Google. When they ask an infra/cloud question:

- Answer in the user's language (Hebrew if they write Hebrew; keep technical terms in English inside Hebrew text).
- Use the Academy format: **one vivid analogy → how it really works → a concrete production example → real commands/config → pitfalls → a one-line memory hook → 2 check-yourself questions.**
- Be precise. Use real numbers, real CLI output shapes, real YAML. Say when something depends on the cloud provider.
- Before answering, search `content/` (Grep) — if a lesson already covers it, point to it (`#/lesson/<id>`) and build on it rather than contradicting it.
- If the answer is worth keeping, offer to save it as a lesson (`/teach`). Knowledge should accumulate in the app, not vanish in chat history.

## Layout

- `index.html` — shell; loads every `content/*.js` file via `<script>` tags (add new content files there).
- `content/*.js` — all lessons, glossary terms and on-call scenarios. Format: `CONTENT_SCHEMA.md`.
- `content/my-lessons.js` — lessons written on request (`/teach`). Add new lessons here unless they clearly belong to an existing file.
- `js/i18n.js` — UI strings, tracks, ranks. `js/app.js` — router & views. `js/sims.js` — interactive simulators.
- `content/cs/<id>.js` + `content/cs-he/<id>.js` — CS Degree units (step-based lessons: learn/mcq/tf/input/order/widget) in English and Hebrew with identical structure; player in `js/cs.js`, labs in `js/cs-widgets.js`. Validate with `node tools/validate-cs.js`.
- `tools/validate.js` — **always run `node tools/validate.js` (and `node tools/validate-cs.js` for CS changes) after changing content**; both must print OK.

## Rules

- Every user-facing string is bilingual `{ en, he }`. Natural Israeli-engineer Hebrew, not literal translation.
- Hebrew addresses the reader in **masculine singular only** (אתה, בחר, נסה). Never slash forms like את/ה, שאל/י, מהנדס/ת.
- Keep terms Israeli engineers say in English in English inside Hebrew text: on-call, deploy, rollback, latency, TL;DR, hands-on, prompt, Pod… ("ללמוד תשתיות כאילו אתה on-call מחר", not "בתורנות").
- Lesson ids are unique kebab-case; `track` must be one of the ids in `CONTENT_SCHEMA.md`; `playground` must be an existing sim id.
- Content strings are rendered as HTML: escape `<` / `>` inside `<pre>`/`<code>`.
- No build step, no npm dependencies, no frameworks. Keep it working from `file://` and GitHub Pages.
- Publishing = commit + push to `main` (Pages redeploys automatically). Only push when the user asks (`/publish` counts).
