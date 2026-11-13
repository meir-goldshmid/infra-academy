// Validates content files against CONTENT_SCHEMA.md
// Usage: node tools/validate.js            (all files in content/)
//        node tools/validate.js content/x.js  (specific files)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(root, "content")).filter(f => f.endsWith(".js")).map(f => path.join("content", f));

const TRACKS = ["foundations","linux","containers","kubernetes","networking","architecture","data","observability","reliability","cloud","staff","principal"];
const SIMS = ["lb","resources","queue","slo","cidr","firewall","scheduler","dr","cache","scaling","terminal","eviction"];
const errors = [];
const sandbox = {}; sandbox.window = sandbox; // like a browser: window.INFRA and bare INFRA are the same
vm.createContext(sandbox);
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.resolve(root, f), "utf8"), sandbox, { filename: f }); }
  catch (e) { errors.push(`${f}: PARSE/RUN ERROR ${e.message}`); }
}
const I = sandbox.window.INFRA || { lessons: [], glossary: [], scenarios: [] };
I.lessons = I.lessons || []; I.glossary = I.glossary || []; I.scenarios = I.scenarios || []; I.designs = I.designs || []; I.problems = I.problems || []; I.topQuestions = I.topQuestions || [];
const bi = (o, where) => {
  if (!o || typeof o !== "object" || typeof o.en !== "string" || typeof o.he !== "string" || !o.en.trim() || !o.he.trim())
    errors.push(`${where}: missing bilingual {en,he}`);
};
const ids = new Set();
for (const l of I.lessons) {
  const w = `lesson ${l.id}`;
  if (!l.id) errors.push("lesson without id");
  if (ids.has(l.id)) errors.push(`${w}: duplicate id`); ids.add(l.id);
  if (!TRACKS.includes(l.track)) errors.push(`${w}: bad track ${l.track}`);
  ["title","tldr","analogy","mnemonic"].forEach(k => bi(l[k], `${w}.${k}`));
  if (!Array.isArray(l.sections) || l.sections.length < 2) errors.push(`${w}: needs sections`);
  (l.sections||[]).forEach((s,i) => { bi(s.h, `${w}.sections[${i}].h`); bi(s.body, `${w}.sections[${i}].body`); });
  (l.handsOn||[]).forEach((h,i) => { if (!h.cmd) errors.push(`${w}.handsOn[${i}] no cmd`); bi(h.what, `${w}.handsOn[${i}].what`); });
  (l.pitfalls||[]).forEach((p,i) => bi(p, `${w}.pitfalls[${i}]`));
  (l.interview||[]).forEach((q,i) => { bi(q.q, `${w}.interview[${i}].q`); bi(q.a, `${w}.interview[${i}].a`); });
  if (!Array.isArray(l.quiz) || l.quiz.length < 3) errors.push(`${w}: needs >=3 quiz questions`);
  (l.quiz||[]).forEach((q,i) => {
    bi(q.q, `${w}.quiz[${i}].q`); bi(q.explain, `${w}.quiz[${i}].explain`);
    (q.options||[]).forEach((o,j) => bi(o, `${w}.quiz[${i}].options[${j}]`));
    if (!(q.answer >= 0 && q.answer < (q.options||[]).length)) errors.push(`${w}.quiz[${i}]: answer out of range`);
  });
  if (l.playground && !SIMS.includes(l.playground)) errors.push(`${w}: unknown playground ${l.playground}`);
}
for (const g of I.glossary) { if (!g.term) errors.push("glossary term missing"); bi(g.def, `glossary ${g.term}`); }
for (const s of I.scenarios) {
  const w = `scenario ${s.id}`; bi(s.title, `${w}.title`);
  if (!s.steps || !s.steps[s.start]) errors.push(`${w}: start step missing`);
  for (const [k, st] of Object.entries(s.steps || {})) {
    bi(st.text, `${w}.${k}.text`);
    (st.choices||[]).forEach((c,i) => { bi(c.label, `${w}.${k}.choices[${i}].label`); if (!s.steps[c.next]) errors.push(`${w}.${k}.choices[${i}]: next '${c.next}' missing`); });
    if (!st.end && !(st.choices||[]).length) errors.push(`${w}.${k}: dead end without end`);
  }
}
for (const d of I.designs) {
  const w = `design ${d.id}`;
  ["title","prompt","estimates"].forEach(k => bi(d[k], `${w}.${k}`));
  ["clarify","functional","nonFunctional","tradeoffs"].forEach(k => { if (!Array.isArray(d[k]) || !d[k].length) errors.push(`${w}: needs ${k}`); (d[k]||[]).forEach((x,i) => bi(x, `${w}.${k}[${i}]`)); });
  ["api","dataModel","diagram"].forEach(k => { if (typeof d[k] !== "string" || !d[k].trim()) errors.push(`${w}: needs ${k} string`); });
  (d.deepDives||[]).forEach((x,i) => { bi(x.h, `${w}.deepDives[${i}].h`); bi(x.body, `${w}.deepDives[${i}].body`); });
  (d.followUps||[]).forEach((x,i) => { bi(x.q, `${w}.followUps[${i}].q`); bi(x.a, `${w}.followUps[${i}].a`); });
}
for (const p of I.problems) {
  const w = `problem ${p.id}`;
  ["title","statement","explain","whyInfra"].forEach(k => bi(p[k], `${w}.${k}`));
  if (!["easy","medium","hard"].includes(p.difficulty)) errors.push(`${w}: bad difficulty`);
  if (typeof p.solution !== "string" || p.solution.length < 40) errors.push(`${w}: needs solution code`);
  (p.hints||[]).forEach((x,i) => bi(x, `${w}.hints[${i}]`));
  (p.followUps||[]).forEach((x,i) => { bi(x.q, `${w}.followUps[${i}].q`); bi(x.a, `${w}.followUps[${i}].a`); });
}
const seen = new Set();
for (const x of [...I.designs, ...I.problems, ...I.topQuestions]) { if (seen.has(x.id)) errors.push(`duplicate id ${x.id}`); seen.add(x.id); }
const TOP_CATS = ["design","coding","infra","behavioral","leadership"], TOP_LVLS = ["senior","staff","principal"];
const linkOk = (h) => { const [, kind, a, b] = String(h).split("/");
  if (kind === "lesson") return I.lessons.some(l => l.id === a);
  if (kind === "oncall") return I.scenarios.some(s => s.id === a);
  if (kind === "interview" && a === "design") return I.designs.some(d => d.id === b);
  if (kind === "interview" && a === "code") return I.problems.some(p => p.id === b);
  return kind === "interview" && a === "behavioral"; };
for (const q of I.topQuestions) {
  const w = `top ${q.id}`;
  ["q","signal","outline"].forEach(k => bi(q[k], `${w}.${k}`));
  if (q.levelUp) bi(q.levelUp, `${w}.levelUp`);
  if (!TOP_CATS.includes(q.cat)) errors.push(`${w}: bad cat ${q.cat}`);
  if (!TOP_LVLS.includes(q.level)) errors.push(`${w}: bad level ${q.level}`);
  if (files.length >= 5) (q.links||[]).forEach(h => { if (!linkOk(h)) errors.push(`${w}: broken link ${h}`); });
}
const allIds = new Set(I.lessons.map(l => l.id));
const dangling = [];
for (const l of I.lessons) (l.related||[]).forEach(r => { if (!allIds.has(r)) dangling.push(`${l.id} -> ${r}`); });
console.log(`lessons=${I.lessons.length} glossary=${I.glossary.length} scenarios=${I.scenarios.length} designs=${I.designs.length} problems=${I.problems.length} top=${I.topQuestions.length}`);
if (dangling.length) console.log(`(info) related ids not found in loaded files: ${dangling.length}${files.length < 5 ? " (fine when validating a single file)" : ": " + dangling.join(", ")}`);
if (errors.length) { console.log(`ERRORS (${errors.length}):\n` + errors.slice(0, 60).join("\n")); process.exit(1); }
console.log("OK");
