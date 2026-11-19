// Checks that every "Go deeper" source link in content/refs.js still answers.
// Usage: node tools/check-refs.js              (all lessons)
//        node tools/check-refs.js <lesson-id>  (one lesson)
// Prints broken links and exits 1 if any. Some sites block bots (403/429): those are reported
// as "blocked" and do not fail the run, because the page usually works in a browser.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sb = {}; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "content", "refs.js"), "utf8"), sb);
const only = process.argv[2];
const items = Object.entries(sb.INFRA.refs || {})
  .filter(([id]) => !only || id === only)
  .flatMap(([id, rs]) => rs.map(r => ({ id, ...r })));

async function probe(u) {
  const opts = { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (infra-academy link check)" }, signal: AbortSignal.timeout(20000) };
  try {
    let r = await fetch(u, { ...opts, method: "HEAD" });
    if (r.status >= 400) r = await fetch(u, { ...opts, method: "GET" });
    return r.status;
  } catch (e) { return "ERR " + (e.cause && e.cause.code || e.name); }
}

(async () => {
  const bad = [], blocked = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const it = items[next++];
      const s = await probe(it.u);
      if (s === 403 || s === 429) blocked.push(`${s} ${it.id}: ${it.u}`);
      else if (typeof s !== "number" || s >= 400) bad.push(`${s} ${it.id}: ${it.u}`);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  if (blocked.length) console.log(`(info) ${blocked.length} blocked by bot protection (not failures):\n  ` + blocked.join("\n  "));
  if (bad.length) { console.log(`BROKEN (${bad.length}/${items.length}):\n  ` + bad.join("\n  ")); process.exit(1); }
  console.log(`refs OK (${items.length} links)`);
})();
