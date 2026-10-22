/* The brew calculator, as a part that can be put on any page.
     altoCalc.mount(container, { presets, start, storageKey, onChange, compact })   compact = short labels, three fields in a row  ->  { numbers(), setPreset(id), load(state), preset() }
   The presets come from data/defaults.js. The maths is in solve(), kept in one place so it is easy to check. */
window.altoCalc = (function () {
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function show(n) { return isFinite(n) ? String(r1(n)) : ""; }

  // basis "water": ratio R = water / coffee.  basis "yield": ratio R = cup yield / coffee (espresso).
  // Water kept back: coffee * a + filter f.  Water brews: yield = water - coffee*a - f.  Espresso: water = yield + coffee*a + f.
  function solve(basis, known, value, R, a, f) {
    var dose, water, yld;
    if (basis === "water") {
      if (known === "dose") { dose = value; water = dose * R; }
      else if (known === "water") { water = value; dose = water / R; }
      else { var d = R - a; if (d <= 0) return null; dose = (value + f) / d; water = dose * R; }
      yld = water - dose * a - f;
    } else {
      if (known === "dose") { dose = value; yld = dose * R; }
      else if (known === "yield") { yld = value; dose = yld / R; }
      else { dose = (value - f) / (R + a); yld = dose * R; }
      water = yld + dose * a + f;
    }
    return { dose: dose, water: water, yield: yld };
  }

  function mount(root, o) {
    var presets = o.presets, st, onChange = o.onChange || function () {};
    var uid = "cu" + Math.random().toString(36).slice(2, 6);
    function byId(id) { return presets.filter(function (p) { return p.id === id; })[0]; }
    function fresh(p) {
      var s = { id: p.id, basis: p.yr ? "yield" : "water", R: p.yr ? p.yr : 1000 / p.gpl, a: p.absorb, f: p.filter, known: "dose", value: p.dose };
      if (!p.dose) { s.known = "water"; s.value = p.water; }
      return s;
    }
    function load() { if (!o.storageKey) return null; try { var s = JSON.parse(localStorage.getItem(o.storageKey)); if (s && byId(s.id)) return s; } catch (e) {} return null; }
    function save() { if (o.storageKey) try { localStorage.setItem(o.storageKey, JSON.stringify(st)); } catch (e) {} }

    root.textContent = ""; if (o.compact) root.classList.add("compact");
    var lab = el("label", "fl", "Recipe"); lab.setAttribute("for", uid + "p");
    var sel = el("select"); sel.id = uid + "p";
    presets.forEach(function (p) { var op = el("option", "", p.name); op.value = p.id; sel.appendChild(op); });
    var temp = el("p", "temp"); temp.hidden = true;
    var fields = el("div", "fields"), inputs = {}, boxes = {};
    [["dose"], ["water"], ["yield"]].forEach(function (f) {
      var box = el("div", "fld"), l = el("label", "l"), inp = el("input"), u = el("span", "u", "you set this");
      inp.type = "number"; inp.inputMode = "decimal"; inp.step = "any"; inp.min = "0"; inp.id = uid + f[0]; l.setAttribute("for", inp.id);
      inp.addEventListener("input", function () { var v = num(inp.value); if (!isFinite(v)) return; st.known = f[0]; st.value = v; render(inp); });
      box.append(l, u, inp); fields.appendChild(box); inputs[f[0]] = inp; boxes[f[0]] = { box: box, lab: l };
    });
    var ratio = el("div", "ratio"); ratio.appendChild(el("span", "rl", "Ratio"));
    var rrx = el("label", "rr"), rx = el("input"); rrx.append(document.createTextNode("1 :"), rx);
    rx.type = "number"; rx.inputMode = "decimal"; rx.step = "any"; rx.min = "0.1"; rx.setAttribute("aria-label", "Ratio, 1 to");
    var rrg = el("label", "rr"), rg = el("input"); rrg.append(rg, document.createTextNode(" g/l"));
    rg.type = "number"; rg.inputMode = "decimal"; rg.step = "any"; rg.min = "1"; rg.setAttribute("aria-label", "Grams of coffee per litre");
    ratio.append(rrx, rrg);
    var kept = el("details", "kept"); kept.appendChild(el("summary", "", "Water kept in the grounds and filter"));
    var kg = el("div", "kgrid"), ka = el("input"), kf = el("input");
    [["Grounds keep (g per g coffee)", ka], ["Filter keeps (g)", kf]].forEach(function (x) {
      var l = el("label", "", x[0]); x[1].type = "number"; x[1].inputMode = "decimal"; x[1].step = "any"; x[1].min = "0"; l.appendChild(x[1]); kg.appendChild(l);
    });
    var note = el("p", "hint"); kept.append(kg, note);
    var msg = el("p", "msg"); msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite");
    var reset = el("button", "reset", o.compact ? "Reset" : "Reset this recipe"); reset.type = "button";
    root.append(lab, sel, temp, fields, ratio, kept, msg, reset);

    function labels() {
      var y = st.basis === "yield";
      boxes.dose.lab.textContent = "Coffee (g)";
      if (o.compact) { boxes.water.lab.textContent = "Water (ml)"; boxes.yield.lab.textContent = "Yield (g)"; }
      else {
        boxes.water.lab.textContent = y ? "Water in the chamber (ml)" : "Water (ml, 1 g = 1 ml)";
        boxes.yield.lab.textContent = y ? "Cup yield (g)" : "Cup yield after absorption (g)";
      }
      rrg.hidden = y;
      note.textContent = "Cup yield = water - coffee x " + st.a + " - " + st.f + " g. " + (y ? "Espresso ratios are coffee to yield." : "The ratio is coffee to water.");
    }
    function numbers() {
      var r = solve(st.basis, st.known, st.value, st.R, st.a, st.f), p = byId(st.id);
      if (!r || !(r.dose > 0)) return null;
      return { preset: p, dose_g: r1(r.dose), water_g: r1(r.water), yield_g: r1(r.yield), ratio: r1(st.R), basis: st.basis, temp_c: p.temp || null, preheat: p.preheat || null, device: p.device,
        state: { id: st.id, basis: st.basis, R: st.R, a: st.a, f: st.f, known: st.known, value: st.value } };
    }
    function render(skip) {
      var r = solve(st.basis, st.known, st.value, st.R, st.a, st.f);
      msg.textContent = "";
      if (!r || !isFinite(r.dose) || r.dose <= 0) { if (!r) msg.textContent = "The ratio must be bigger than the water the grounds keep."; return; }
      if (r.yield < 0) msg.textContent = "The coffee and filter keep more water than you add. Add more water.";
      var v = { dose: r.dose, water: r.water, yield: r.yield };
      ["dose", "water", "yield"].forEach(function (k) { if (inputs[k] !== skip) inputs[k].value = show(v[k]); boxes[k].box.classList.toggle("set", st.known === k); });
      if (skip !== rx) rx.value = show(st.R);
      if (skip !== rg) rg.value = st.basis === "water" ? show(1000 / st.R) : "";
      if (skip !== ka) ka.value = st.a; if (skip !== kf) kf.value = st.f;
      labels(); save(); onChange(numbers());
    }
    function tempLine() {
      var p = byId(st.id);
      var ph = p.preheat && ((window.DEFAULTS && window.DEFAULTS.PREHEAT) || []).filter(function (x) { return x[0] === p.preheat; })[0];
      var parts = [];
      if (ph) parts.push("Preheat: " + ph[1].toLowerCase() + " (about " + ph[2] + " °C).");
      if (p.temp) parts.push(/^semi-automatic/i.test(p.device || "") ? "Temperature on the machine: " + p.temp + " °C." : "Water from the kettle: " + p.temp + " °C.");
      temp.hidden = !parts.length; temp.textContent = parts.join(" ");
    }
    function setPreset(id) { var p = byId(id) || presets[0]; st = fresh(p); sel.value = p.id; tempLine(); render(); }
    sel.addEventListener("change", function () { setPreset(sel.value); });
    rx.addEventListener("input", function () { var v = num(rx.value); if (v > 0) { st.R = v; render(rx); } });
    rg.addEventListener("input", function () { var v = num(rg.value); if (v > 0) { st.R = 1000 / v; render(rg); } });
    ka.addEventListener("input", function () { var v = num(ka.value); if (v >= 0) { st.a = v; render(ka); } });
    kf.addEventListener("input", function () { var v = num(kf.value); if (v >= 0) { st.f = v; render(kf); } });
    reset.addEventListener("click", function () { setPreset(sel.value); });

    st = (o.start && byId(o.start) && fresh(byId(o.start))) || load() || fresh(byId(presets[0].id));
    sel.value = st.id; tempLine(); render();
    // take over what you worked out elsewhere (the Calculator page), so both show the same numbers
    function load(s) { if (!s || !byId(s.id)) return; st = { id: s.id, basis: s.basis, R: +s.R, a: +s.a, f: +s.f, known: s.known, value: +s.value }; sel.value = st.id; tempLine(); render(); }
    return { numbers: numbers, setPreset: setPreset, load: load, preset: function () { return byId(st.id); } };
  }
  return { mount: mount, solve: solve };
})();
