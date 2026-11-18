---
name: teach
description: Write a new bilingual (Hebrew/English) Infra Academy lesson on a topic and add it to the app. Use when the user says /teach <topic> or asks to save an explanation as a lesson.
---

# /teach <topic>

Turn `<topic>` (from the arguments: $ARGUMENTS) into a permanent lesson in the Infra Academy app.

1. Grep `content/` for the topic. If an existing lesson already covers it, tell the user which one (`#/lesson/<id>`) and ask whether to extend it or write a new, deeper lesson.
2. Read `CONTENT_SCHEMA.md` and look at one existing lesson in the same track as a style reference.
3. Write the lesson object following the schema exactly:
   - accurate, practical, concrete (real commands, real YAML/config, real numbers);
   - a vivid analogy, 3-6 substantive sections with at least one `<blockquote>` "💡 Real world" / "⚠️ Production tip";
   - 2-5 `handsOn` commands, a mnemonic, 2-4 pitfalls, 2-3 interview Q&A, 3-4 quiz questions with plausible wrong options;
   - `playground` only if one of the existing sims fits; `related` pointing at existing lesson ids;
   - natural Israeli-engineer Hebrew (technical terms stay in English), masculine singular;
   - RTL/LTR: Hebrew prefixes/suffixes attach to English with a hyphen ("ב-kubectl", "Pod-ים"), commands/code go in `<code>`/`<pre>`; see the "Mixed Hebrew/English direction" rule in CONTENT_SCHEMA.md.
   Also add 3-8 glossary terms for new concepts.
4. Append it to `content/my-lessons.js` (pick the best-fitting `track`, and an `order` after the existing lessons in that track, e.g. 50+).
5. Run `node tools/validate.js` and fix until it prints `OK` (it also fails on wrong-way arrows: in Hebrew use ←, or run `node tools/bidi-arrows.js --fix`).
   Then do the full "RTL/BiDi check" from CLAUDE.md: re-read the Hebrew and look at the rendered lesson in Hebrew. If you delegate any writing to subagents, include that checklist in their brief.
6. Tell the user the lesson URL fragment (`#/lesson/<id>`), a 2-line summary, and that `/publish` will put it online.
