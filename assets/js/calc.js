/* The calculator page. The calculator itself is in calcui.js, presets in data/defaults.js. */
(function () {
  var DF = window.DEFAULTS, hm = location.hash.match(/preset=([\w-]+)/);
  // what you worked out last, so "Log a brew" can offer it even when you get there another way (menu, Home)
  var remember = function (n) { if (!n) return; try { localStorage.setItem("alto.calc.last", JSON.stringify({ t: Date.now(), device: n.device, dose_g: n.dose_g, water_g: n.water_g, yield_g: n.basis === "yield" ? n.yield_g : null, temp_c: n.temp_c, preheat: n.preheat, ratio: n.ratio, name: n.preset && n.preset.name, state: n.state })); } catch (e) {} };
  var api = window.altoCalc.mount(document.getElementById("calc"), { presets: DF.PRESETS, start: hm ? hm[1] : null, storageKey: "alto.calc", onChange: remember });
  if (!hm) { /* keep the last used recipe */ }
  document.getElementById("tolog").addEventListener("click", function () {
    var n = api.numbers(); if (!n) return;
    try { localStorage.setItem("alto.handoff", JSON.stringify({ t: Date.now(), device: n.device, dose_g: n.dose_g, water_g: n.water_g, yield_g: n.basis === "yield" ? n.yield_g : null, temp_c: n.temp_c, preheat: n.preheat, ratio: n.ratio, state: n.state })); } catch (e) {}
    location.href = "../journal/index.html#log";
  });
})();
