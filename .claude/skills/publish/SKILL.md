---
name: publish
description: Validate Infra Academy content, commit and push to GitHub so the GitHub Pages site updates. Use for /publish.
---

# /publish

1. Run `node tools/lesson-dates.js` (refreshes the "Updated" date of every lesson from git), then `node tools/validate.js` and `node tools/validate-cs.js`. If validation fails, fix the content and re-run until `OK`. Do not publish broken content. Every lesson needs ≥2 official sources in `content/refs.js`.
2. If `content/refs.js` changed, run `node tools/check-refs.js` and fix broken links.
3. `git status` — review what changed. Commit with a short message describing the new/updated lessons.
4. `git push origin main`. Then run `node tools/lesson-dates.js` again: lines that were uncommitted are dated today either way, so the file should not change; if it does, commit it too.
5. Confirm the deploy: `gh api repos/{owner}/{repo}/pages/builds/latest --jq '.status + " " + .commit'` should show `built` and the pushed commit (it takes ~1 minute). Tell the user the Pages URL (`gh api repos/{owner}/{repo}/pages --jq .html_url`).
