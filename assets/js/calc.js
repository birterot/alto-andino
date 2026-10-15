/* The calculator page. The calculator itself is in calcui.js, presets in data/defaults.js. */
(function () {
  var DF = window.DEFAULTS, hm = location.hash.match(/preset=([\w-]+)/);
  var api = window.altoCalc.mount(document.getElementById("calc"), { presets: DF.PRESETS, start: hm ? hm[1] : null, storageKey: "alto.calc" });
  if (!hm) { /* keep the last used recipe */ }
  document.getElementById("tolog").addEventListener("click", function () {
    var n = api.numbers(); if (!n) return;
    try { localStorage.setItem("alto.handoff", JSON.stringify({ t: Date.now(), device: n.device, dose_g: n.dose_g, water_g: n.water_g, yield_g: n.basis === "yield" ? n.yield_g : null, temp_c: n.temp_c, preheat: n.preheat, ratio: n.ratio })); } catch (e) {}
    location.href = "../journal/index.html#log";
  });
})();
