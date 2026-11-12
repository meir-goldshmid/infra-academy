/* CS Degree registry (merged from CS Degree Quest). English units: content/cs/<id>.js call CQ.unit({...}).
   Hebrew translations: content/cs-he/<id>.js call CQ.unitHe({...}) with the identical structure. */
window.CQ = window.CQ || {
  units: [], he: {}, widgets: {},
  unit(u) {
    try {
      if (!u || !u.id || !Array.isArray(u.lessons)) throw new Error("invalid unit");
      this.units.push(u); this.units.sort((a, b) => a.order - b.order);
    } catch (e) { console.error("[CQ] failed to register unit", u && u.id, e); }
  },
  unitHe(u) { if (u && u.id) this.he[u.id] = u; }
};
