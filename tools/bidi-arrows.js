// RTL arrow rule, used by tools/validate.js (check) and `node tools/bidi-arrows.js --fix` (auto-fix).
//
// The browser never mirrors arrows, so an arrow must point the way its surrounding text is laid out:
//   * A text segment (text between two HTML tags) that contains Hebrew lays out right-to-left; js/bidi.js isolates
//     each English term inside it. Every sequence arrow there must be ←:
//     "דרישות ← ענן ← סביבות", "רשת ו-traffic ← compute ← data".
//   * A segment with no Hebrew (<td>kitten→sitting = 3</td>, <strong>k→s</strong>) lays out left-to-right: keep →.
//     js/bidi.js treats → as part of an English run, so the chain stays together.
//   * <pre>, <code>, <kbd>, <samp>, .formula and dir="ltr" blocks, and monospace fields (diagram, data, cmd…) are
//     always LTR: keep →.
//   * English strings (key `en`) keep → even when they quote Hebrew.
// Only → ⇒ ⟶ ➜ ➡ are flagged; ← is never flagged (it also means assignment: "x ← x − η·f′(x)").
//
// How it knows which string an arrow belongs to: each arrow in the source is swapped for a unique private-use
// character, the file is executed, and every string in INFRA / CQ is walked with its object key.
// js/sims.js and js/cs-widgets.js are code, not data: there an arrow is flagged when the text between tags/quotes
// around it contains Hebrew. js/i18n.js is skipped on purpose (Previous/Next arrows point at screen sides).
// Usage: node tools/bidi-arrows.js            (report)
//        node tools/bidi-arrows.js --fix      (rewrite files in place)
//        node tools/bidi-arrows.js [--fix] file1.js file2.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FLIP = { "→": "←", "⇒": "⇐", "⟶": "⟵", "➜": "←", "➡": "⬅" };
const IS_ARROW = (c) => Object.prototype.hasOwnProperty.call(FLIP, c);
const HEB = /[֐-׿]/;
const LTR_KEYS = new Set(["en", "diagram", "data", "cmd", "solution", "api", "dataModel", "examples", "code", "complexity", "leetcode"]);
const PUA = 0xF0000;               // supplementary private-use plane: room for any number of markers
const root = path.join(__dirname, "..");

function ltrRanges(s) {
  const r = []; let m;
  const res = [/<(pre|code|kbd|samp)\b[\s\S]*?<\/\1>/g, /<(\w+)\b[^>]*(?:class="[^"]*\bformula\b|dir="ltr")[^>]*>[\s\S]*?<\/\1>/g];
  for (const re of res) while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  return r;
}
const inRanges = (r, i) => r.some(([a, b]) => i >= a && i < b);
function segmentHasHebrew(s, i) {   // text between the nearest tags around i
  let a = i, b = i;
  while (a > 0 && s[a - 1] !== ">" && s[a - 1] !== "<") a--;
  while (b < s.length && s[b] !== "<" && s[b] !== ">") b++;
  return HEB.test(s.slice(a, b));
}

// Data files: returns [{index, line, context}] of → that must become ←.
function checkData(file, src) {
  const pos = [], parts = [];
  let last = 0;
  for (let i = 0; i < src.length; i++) if (IS_ARROW(src[i])) {
    parts.push(src.slice(last, i), String.fromCodePoint(PUA + pos.length)); pos.push(i); last = i + 1;
  }
  if (!pos.length) return [];
  parts.push(src.slice(last));
  const marked = parts.join("");
  const sb = { console }; sb.window = sb; vm.createContext(sb);
  const reg = path.join(root, "js/cs-registry.js");
  if (/cs(-he)?[\\/]/.test(file) && fs.existsSync(reg)) vm.runInContext(fs.readFileSync(reg, "utf8"), sb);
  try { vm.runInContext(marked, sb, { filename: file }); } catch (e) { return [{ index: -1, line: 0, context: "could not execute: " + e.message }]; }
  const bad = new Set(), seen = new Set();
  (function walk(o, key) {
    if (typeof o === "string") {
      if (LTR_KEYS.has(key)) return;
      const s = Array.from(o).map(ch => { const c = ch.codePointAt(0); return c >= PUA && c < PUA + pos.length ? ch : ch; });
      // rebuild a version with real arrows for tag/segment analysis, remembering marker ids by position
      let plain = "", ids = [];
      for (const ch of s) { const c = ch.codePointAt(0); if (c >= PUA && c < PUA + pos.length) { ids[plain.length] = c - PUA; plain += src[pos[c - PUA]]; } else plain += ch; }
      const r = ltrRanges(plain);
      ids.forEach((id, j) => { if (id === undefined) return; if (src[pos[id]] === "←" || !IS_ARROW(src[pos[id]])) return;
        if (!inRanges(r, j) && segmentHasHebrew(plain, j)) bad.add(id); });
      return;
    }
    if (!o || typeof o !== "object" || seen.has(o)) return; seen.add(o);
    for (const k of Object.keys(o)) walk(o[k], k);
  })({ INFRA: sb.INFRA, CQ: sb.CQ }, "");
  return [...bad].map(id => { const i = pos[id]; return { index: i, line: src.slice(0, i).split("\n").length, context: src.slice(Math.max(0, i - 25), i + 25).replace(/\s+/g, " ") }; });
}

// Code files: text between tags / quotes around the arrow contains Hebrew.
function checkCode(src) {
  const found = [], r = ltrRanges(src);
  for (let i = 0; i < src.length; i++) {
    if (!IS_ARROW(src[i]) || src[i] === "←" || inRanges(r, i)) continue;
    let a = i, b = i; const stop = "<>\n\"'`";
    while (a > 0 && !stop.includes(src[a - 1])) a--;
    while (b < src.length && !stop.includes(src[b])) b++;
    if (HEB.test(src.slice(a, b))) found.push({ index: i, line: src.slice(0, i).split("\n").length, context: src.slice(Math.max(0, i - 25), i + 25).replace(/\s+/g, " ") });
  }
  return found;
}

function check(file) {
  const src = fs.readFileSync(path.resolve(root, file), "utf8");
  const found = /(^|[\\/])js[\\/]/.test(file) ? checkCode(src) : checkData(file, src);
  return { src, found };
}

function defaultFiles() {
  const list = [];
  for (const d of ["content", "content/cs-he"]) {
    const p = path.join(root, d); if (!fs.existsSync(p)) continue;
    fs.readdirSync(p).filter(f => f.endsWith(".js")).forEach(f => list.push(path.join(d, f)));
  }
  ["js/sims.js", "js/cs-widgets.js"].forEach(f => { if (fs.existsSync(path.join(root, f))) list.push(f); });
  return list;
}

module.exports = { check, defaultFiles, ltrRanges, segmentHasHebrew, LTR_KEYS, PUA };

if (require.main === module) {
  const args = process.argv.slice(2), doFix = args.includes("--fix");
  const files = args.filter(a => a !== "--fix"), list = files.length ? files : defaultFiles();
  let total = 0;
  for (const f of list) {
    const { src, found } = check(f); if (!found.length) continue; total += found.length;
    if (doFix) {
      const a = src.split(""); found.forEach(b => { if (b.index >= 0) a[b.index] = FLIP[a[b.index]]; });
      fs.writeFileSync(path.resolve(root, f), a.join(""));
      console.log(`${f}: ${found.length} fixed`);
    } else {
      found.slice(0, 5).forEach(b => console.log(`${f}:${b.line}: …${b.context}…`));
      console.log(`${f}: ${found.length} arrow(s) in Hebrew text should point left (←)`);
    }
  }
  console.log(doFix ? `fixed ${total}` : (total ? `found ${total}` : "OK"));
  if (!doFix && total) process.exit(1);
}
