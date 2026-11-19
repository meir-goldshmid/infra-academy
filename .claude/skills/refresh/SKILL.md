---
name: refresh
description: Re-check an Infra Academy lesson against its official sources and fix anything outdated or wrong (versions, flags, limits, defaults, deprecated APIs). Use for /refresh <lesson-id>, /refresh stale (all lessons flagged "may be outdated"), or when the user says a lesson looks wrong or old.
---

# /refresh <lesson-id | stale>

Goal: the lesson matches what the official docs say **today**. The app shows "Updated <month>" from git history and flags lessons untouched for 12+ months; editing a lesson resets that.

1. **Pick lessons.** For `stale`, list ids in `content/lesson-dates.js` older than 12 months. Otherwise use the given id (Grep `content/` for `id: "<id>"` to find the file).
2. **Read the lesson and its sources** (`content/refs.js`, key = lesson id). Fetch each source page (WebFetch). If a link is dead or moved, find the new official page and update `content/refs.js` (keep ≥2 links, official docs / RFCs / man pages / project docs only).
3. **Check every factual claim** that can go stale: versions, default values, limits and quotas, CLI flags and output shape, API versions (e.g. `apiVersion`), deprecations and removals, prices, and the names of products and features. Also look for statements that were true but are now incomplete (a new recommended approach exists).
4. **Fix in place**, in both `en` and `he` with identical meaning. Follow every rule in `CLAUDE.md`, including the full RTL/BiDi check (validate, re-read the Hebrew, render the page in Hebrew).
5. If nothing needed changing, say so and don't touch the file (an untouched lesson keeps its old date: that is honest).
6. Run `node tools/check-refs.js <lesson-id>`, `node tools/lesson-dates.js` and `node tools/validate.js` (all must pass).
7. Report: what changed and why, with the source link for each change. Publish only if the user asks (`/publish`).
