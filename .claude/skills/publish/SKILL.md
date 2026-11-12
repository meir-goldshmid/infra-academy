---
name: publish
description: Validate Infra Academy content, commit and push to GitHub so the GitHub Pages site updates. Use for /publish.
---

# /publish

1. Run `node tools/validate.js`. If it fails, fix the content and re-run until `OK`. Do not publish broken content.
2. `git status` — review what changed. Commit with a short message describing the new/updated lessons.
3. `git push origin main`.
4. Tell the user the Pages URL (from `gh api repos/{owner}/{repo}/pages --jq .html_url`) and that it refreshes within ~1 minute.
