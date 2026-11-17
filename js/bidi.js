/* Bidi fixer for Hebrew (RTL) mode.
   Hebrew text is full of English terms, commands and numbers ("ב-kubectl get pods -o wide", ".NET", "C++", "/etc/fstab", "R+W>N").
   The Unicode bidi algorithm reorders neutral characters at the edges of those runs (".NET" shows as "NET.", "C++" as "++C").
   This module wraps every LTR run inside Hebrew text in <bdi dir="ltr"> so it is laid out as one isolated left-to-right unit.
   Content authors just write natural mixed text; no markup needed. Runs automatically on every DOM change while <html dir="rtl">. */
(function () {
  "use strict";
  const HEB = /[֐-׿]/;
  const LATIN_END = /[A-Za-z0-9]$/;
  const LATIN_START = /^[A-Za-z0-9]/;
  // An LTR run: optional leading neutrals glued to a word (only after start/space/bracket, so the Hebrew "ב-" prefix stays outside),
  // then words joined by spaces / code punctuation, then optional trailing glued symbols (C++, C#, 50%, /var/log/).
  const RUN = /(?:(?<=^|[\s(\[{"'״׳])[./~$@#\-+*<>=:]+)?[A-Za-z0-9][A-Za-z0-9_]*(?:[\s\-./:@#+=%&*'’,<>~|\\!?]+[A-Za-z0-9][A-Za-z0-9_]*)*(?:[+#%/*]+|\(\))?/g;
  const SKIP = new Set(["PRE", "CODE", "BDI", "SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "SVG", "KBD", "SAMP", "MATH"]);

  const rtl = () => document.documentElement.dir === "rtl";

  function skipped(node) {
    for (let el = node.parentNode; el && el !== document.body; el = el.parentNode) {
      if (el.nodeType !== 1) continue;
      if (SKIP.has(el.nodeName.toUpperCase()) || el.isContentEditable) return true;
      const d = el.getAttribute("dir");
      if (d === "ltr" || d === "auto") return true;
      if (el.hasAttribute("data-nobidi")) return true;
    }
    return false;
  }

  function neighbourText(node, dir) {
    let n = dir < 0 ? node.previousSibling : node.nextSibling;
    while (n && n.nodeType === 8) n = dir < 0 ? n.previousSibling : n.nextSibling;
    return n ? (n.textContent || "") : "";
  }

  function fixText(node) {
    const s = node.nodeValue;
    if (!s || s.length < 1 || !/[A-Za-z0-9]/.test(s)) return;
    const hasHeb = HEB.test(s);
    if (!hasHeb) {
      // pure-English text node (e.g. <strong>Kafka</strong>): only isolate it when its edges hold neutrals that would get flipped
      const tr = s.trim();
      if (!tr || /^[A-Za-z0-9].*[A-Za-z0-9)]$/.test(tr) || tr.length === 1) return;
    }
    if (skipped(node)) return;
    // a bare text node inside a flex/grid container is one anonymous item; splitting it would stack the pieces
    const pd = node.parentNode && node.parentNode.nodeType === 1 ? getComputedStyle(node.parentNode).display : "";
    if (/flex|grid/.test(pd)) return;
    RUN.lastIndex = 0;
    const parts = []; let last = 0, m, changed = false;
    // a list marker at the start of Hebrew text ("B. Active-active…", "2. Schema…") is its own unit: without this it joins the
    // English run that follows and the letter lands in the middle of the line instead of at the right edge
    const lead = hasHeb && /^\s*(?:[A-Za-z]|\d{1,3})[.)](?=\s)/.exec(s);
    if (lead) {
      const ws = lead[0].length - lead[0].trimStart().length;
      if (ws) parts.push(document.createTextNode(s.slice(0, ws)));
      const b = document.createElement("bdi"); b.dir = "ltr"; b.textContent = lead[0].slice(ws);
      parts.push(b); last = RUN.lastIndex = lead[0].length; changed = true;
    }
    while ((m = RUN.exec(s))) {
      if (!m[0]) { RUN.lastIndex++; continue; }
      const start = m.index, end = start + m[0].length;
      // keep an English phrase that continues across an element edge (<strong>Kafka</strong> topic) merged, as before
      const atStart = !s.slice(0, start).trim(), atEnd = !s.slice(end).trim();
      if (hasHeb && ((atStart && LATIN_END.test(neighbourText(node, -1).trimEnd())) ||
                     (atEnd && LATIN_START.test(neighbourText(node, 1).trimStart())))) continue;
      if (start > last) parts.push(document.createTextNode(s.slice(last, start)));
      const b = document.createElement("bdi"); b.dir = "ltr"; b.textContent = m[0];
      parts.push(b); last = end; changed = true;
    }
    if (!changed) return;
    if (last < s.length) parts.push(document.createTextNode(s.slice(last)));
    const frag = document.createDocumentFragment(); parts.forEach(p => frag.appendChild(p));
    node.parentNode.replaceChild(frag, node);
  }

  function walk(root) {
    if (!rtl() || !root) return;
    if (root.nodeType === 3) { if (root.parentNode) fixText(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.nodeName.toUpperCase())) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = []; let n; while ((n = tw.nextNode())) nodes.push(n);
    nodes.forEach(fixText);
  }

  function unwrapAll() { // switching back to English: restore plain text so nothing lingers
    document.querySelectorAll('bdi[dir="ltr"]').forEach(b => b.replaceWith(document.createTextNode(b.textContent)));
    document.body.normalize();
  }

  let busy = false;
  const mo = new MutationObserver(muts => {
    if (busy) return;
    busy = true;
    try {
      for (const mu of muts) {
        if (mu.type === "attributes") { if (rtl()) walk(document.body); else unwrapAll(); continue; }
        if (!rtl()) continue;
        if (mu.type === "characterData") { fixText(mu.target); continue; }
        mu.addedNodes.forEach(walk);
      }
    } finally { mo.takeRecords(); busy = false; }
  });

  function start() {
    walk(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.INFRA_BIDI = { walk, fixText };
})();
