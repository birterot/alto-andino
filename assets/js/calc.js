/* Brew calculator. Presets and defaults live in data/defaults.js. */
(function () {
  var DF = window.DEFAULTS, $ = function (i) { return document.getElementById(i); };
  var KEY = "alto.calc", HAND = "alto.handoff";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function show(n) { return isFinite(n) ? String(r1(n)) : ""; }

  // ---- the maths, kept in one function so it is easy to check ----
  // basis "water": ratio R = water / coffee.  basis "yield": ratio R = cup yield / coffee (espresso).
  // Water kept back: coffee * a + filter f.  For water brews: yield = water - coffee*a - f.  For espresso: water = yield + coffee*a.
  function solve(basis, known, value, R, a, f) {
    var dose, water, yld;
    if (basis === "water") {
      if (known === "dose") { dose = value; water = dose * R; }
      else if (known === "water") { water = value; dose = water / R; }
      else { // cup yield known: yield = water - dose*a - f and water = dose*R
        var d = R - a; if (d <= 0) return null;
        dose = (value + f) / d; water = dose * R;
      }
      yld = water - dose * a - f;
    } else {
      if (known === "dose") { dose = value; yld = dose * R; }
      else if (known === "yield") { yld = value; dose = yld / R; }
      else { dose = (value - f) / (R + a); yld = dose * R; }
      water = yld + dose * a + f;
    }
    return { dose: dose, water: water, yield: yld };
  }
  window.altoCalcSolve = solve;

  var presets = DF.PRESETS, st;
  function presetById(id) { return presets.filter(function (p) { return p.id === id; })[0] || presets[0]; }
  function fresh(p) {
    var basis = p.yr ? "yield" : "water", R = p.yr ? p.yr : 1000 / p.gpl;
    var s = { id: p.id, basis: basis, R: R, a: p.absorb, f: p.filter, known: "dose", value: p.dose || NaN };
    if (!p.dose) { s.known = "water"; s.value = p.water; }
    return s;
  }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.id && presetById(s.id).id === s.id) return s; } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  // ---- the page ----
  var sel = $("preset");
  presets.forEach(function (p) { var o = el("option", "", p.name); o.value = p.id; sel.appendChild(o); });
  var hm = location.hash.match(/preset=([\w-]+)/);
  st = hm && presetById(hm[1]).id === hm[1] ? fresh(presetById(hm[1])) : load() || fresh(presetById(DF.START_PRESET));
  sel.value = st.id;

  var inputs = {}, boxes = {};
  var FIELDS = [["dose", "Coffee", "g"], ["water", "Water", "g = ml"], ["yield", "Cup yield", "g"]];
  FIELDS.forEach(function (f) {
    var box = el("div", "fld"), lab = el("label", "l", f[1]), inp = el("input");
    inp.type = "number"; inp.inputMode = "decimal"; inp.step = "any"; inp.min = "0"; inp.id = "f-" + f[0]; lab.setAttribute("for", inp.id);
    var u = el("span", "u", "you set this");
    inp.addEventListener("input", function () {
      var v = num(inp.value); if (!isFinite(v)) return;
      st.known = f[0]; st.value = v; render(inp);
    });
    box.append(lab, u, inp); $("fields").appendChild(box); inputs[f[0]] = inp; boxes[f[0]] = { box: box, lab: lab };
  });
  var rx = $("r-x"), rg = $("r-g"), ka = $("k-a"), kf = $("k-f");

  function labels() {
    var yieldB = st.basis === "yield";
    boxes.dose.lab.textContent = "Coffee (g)";
    boxes.water.lab.textContent = yieldB ? "Water in the chamber (ml)" : "Water (ml, 1 g = 1 ml)";
    boxes.yield.lab.textContent = yieldB ? "Cup yield (g)" : "Cup yield after absorption (g)";
    $("gpl-wrap").hidden = yieldB;
    $("kept-note").textContent = yieldB
      ? "Cup yield = water - coffee x " + st.a + " - " + st.f + " g. Espresso ratios are coffee to yield."
      : "Cup yield = water - coffee x " + st.a + " - " + st.f + " g. Ratio is coffee to water.";
  }
  function render(skip) {
    var r = solve(st.basis, st.known, st.value, st.R, st.a, st.f);
    var msg = $("msg"); msg.textContent = "";
    if (!r || !isFinite(r.dose) || r.dose <= 0) { msg.textContent = r ? "" : "The ratio must be bigger than the water the grounds keep."; return; }
    if (r.yield < 0) msg.textContent = "The coffee and filter keep more water than you add. Add more water.";
    var vals = { dose: r.dose, water: r.water, yield: r.yield };
    FIELDS.forEach(function (f) {
      var inp = inputs[f[0]];
      if (inp !== skip) inp.value = show(vals[f[0]]);
      boxes[f[0]].box.classList.toggle("set", st.known === f[0]);
    });
    if (skip !== rx) rx.value = show(st.R);
    if (skip !== rg) rg.value = st.basis === "water" ? show(1000 / st.R) : "";
    if (skip !== ka) ka.value = st.a; if (skip !== kf) kf.value = st.f;
    labels(); save();
  }
  function setPreset(p, keepNothing) {
    st = fresh(p); sel.value = p.id;
    var t = $("temp"); if (p.temp) { t.hidden = false; t.textContent = "Suggested water temperature: about " + p.temp + " °C (from Flair's preheat settings)."; } else t.hidden = true;
    render();
  }
  sel.addEventListener("change", function () { setPreset(presetById(sel.value)); });
  rx.addEventListener("input", function () { var v = num(rx.value); if (v > 0) { st.R = v; render(rx); } });
  rg.addEventListener("input", function () { var v = num(rg.value); if (v > 0) { st.R = 1000 / v; render(rg); } });
  ka.addEventListener("input", function () { var v = num(ka.value); if (v >= 0) { st.a = v; render(ka); } });
  kf.addEventListener("input", function () { var v = num(kf.value); if (v >= 0) { st.f = v; render(kf); } });
  $("reset").addEventListener("click", function () { setPreset(presetById(sel.value)); });

  // temp note for the saved preset
  var p0 = presetById(st.id); if (p0.temp) { $("temp").hidden = false; $("temp").textContent = "Suggested water temperature: about " + p0.temp + " °C (from Flair's preheat settings)."; }
  render();

  // ---- "Log a brew": hand the numbers to the journal ----
  var tl = $("tolog");
  tl.addEventListener("click", function () {
    var r = solve(st.basis, st.known, st.value, st.R, st.a, st.f), p = presetById(st.id);
    if (!r || !(r.dose > 0)) return;
    try {
      localStorage.setItem(HAND, JSON.stringify({ t: Date.now(), device: p.device, dose_g: r1(r.dose), water_g: r1(r.water), yield_g: st.basis === "yield" ? r1(r.yield) : null,
        temp_c: p.temp || null, ratio: r1(st.R) }));
    } catch (e) {}
    location.href = "../journal/index.html#log";
  });
})();
