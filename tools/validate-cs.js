// Validates CS Degree units (content/cs/*.js) and their Hebrew translations (content/cs-he/*.js).
// Usage: node tools/validate-cs.js            (everything)
//        node tools/validate-cs.js big-o logic   (specific unit ids)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const WIDGETS = ["bits", "truth", "growth", "guess", "sort", "graph", "derivative", "integral", "unitcircle", "hash"];
const TYPES = ["learn", "mcq", "tf", "input", "order", "widget"];
const QTYPES = ["mcq", "tf", "input", "order"];
const only = process.argv.slice(2);

function load(file, fn) {
  const out = [];
  const ctx = { CQ: { unit: u => out.push(u), unitHe: u => out.push(u) } };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  if (out.length !== 1) throw new Error(`expected exactly 1 CQ.${fn} call, got ${out.length}`);
  return out[0];
}
const hebrew = (s) => /[֐-׿]/.test(String(s || ""));

let failed = false, heCount = 0;
const enDir = path.join(root, "content", "cs"), heDir = path.join(root, "content", "cs-he");
const ids = fs.readdirSync(enDir).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).filter(id => !only.length || only.includes(id));
for (const id of ids) {
  const errs = [];
  let en, he;
  try { en = load(path.join(enDir, id + ".js"), "unit"); } catch (e) { errs.push("EN script error: " + e.message); }
  let stepCount = 0, qCount = 0;
  if (en) {
    if (en.id !== id) errs.push(`EN unit id ${en.id} != file name`);
    for (const l of en.lessons) for (const s of l.steps) {
      stepCount++; if (QTYPES.includes(s.type)) qCount++;
      if (!TYPES.includes(s.type)) errs.push(`EN ${l.id}: bad step type ${s.type}`);
      if (s.type === "widget" && !WIDGETS.includes(s.widget)) errs.push(`EN ${l.id}: unknown widget ${s.widget}`);
    }
  }
  const heFile = path.join(heDir, id + ".js");
  if (en && fs.existsSync(heFile)) {
    try { he = load(heFile, "unitHe"); } catch (e) { errs.push("HE script error: " + e.message); }
    if (he) {
      heCount++;
      if (he.id !== en.id) errs.push(`HE id ${he.id} != ${en.id}`);
      ["title", "tagline"].forEach(k => { if (!hebrew(he[k])) errs.push(`HE unit.${k} not Hebrew`); });
      if ((he.lessons || []).length !== en.lessons.length) errs.push(`HE has ${(he.lessons || []).length} lessons, EN has ${en.lessons.length}`);
      en.lessons.forEach((l, li) => {
        const hl = (he.lessons || [])[li]; const w = `HE lesson[${li}] ${l.id}`;
        if (!hl) return;
        if (hl.id !== l.id) errs.push(`${w}: id ${hl.id} != ${l.id}`);
        if (!hebrew(hl.title)) errs.push(`${w}: title not Hebrew`);
        if ((hl.steps || []).length !== l.steps.length) return errs.push(`${w}: ${(hl.steps || []).length} steps, EN has ${l.steps.length}`);
        l.steps.forEach((s, si) => {
          const h = hl.steps[si]; const ws = `${w} step[${si}]`;
          if (h.type !== s.type) return errs.push(`${ws}: type ${h.type} != ${s.type}`);
          if (s.type === "widget" && h.widget !== s.widget) errs.push(`${ws}: widget mismatch`);
          if (s.type === "learn" && !hebrew(h.html)) errs.push(`${ws}: learn html not Hebrew`);
          if (QTYPES.includes(s.type)) {
            if (!hebrew(h.q)) errs.push(`${ws}: q not Hebrew`);
            if (!h.explain || !hebrew(h.explain)) errs.push(`${ws}: explain missing/not Hebrew`);
          }
          if (s.type === "mcq") {
            if (!Array.isArray(h.choices) || h.choices.length !== s.choices.length) errs.push(`${ws}: choices count differs`);
            if (h.answer !== s.answer) errs.push(`${ws}: mcq answer ${h.answer} != ${s.answer}`);
          }
          if (s.type === "tf" && h.answer !== s.answer) errs.push(`${ws}: tf answer differs`);
          if (s.type === "order" && (!Array.isArray(h.items) || h.items.length !== s.items.length)) errs.push(`${ws}: order items count differs`);
          if (s.type === "input") {
            const ea = [].concat(s.answer), ha = [].concat(h.answer || []);
            if (!ea.every(a => ha.includes(a))) errs.push(`${ws}: input answers must keep all EN answers (${JSON.stringify(ea)})`);
          }
        });
      });
    }
  }
  if (errs.length) { failed = true; console.log(`FAIL ${id}`); errs.slice(0, 40).forEach(e => console.log("   - " + e)); }
  else console.log(`OK  ${id.padEnd(22)} ${en.lessons.length} lessons, ${stepCount} steps, ${qCount} questions${he ? "  + Hebrew ✓" : "  (no Hebrew yet)"}`);
}
console.log(`units=${ids.length} hebrew=${heCount}`);
process.exit(failed ? 1 : 0);
