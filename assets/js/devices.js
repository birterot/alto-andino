/* Renders chapters/devices.html from window.DEVICES (data/devices.js). */
(function () {
  var C = window.DEVICES, D = C.D, $ = function (i) { return document.getElementById(i); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  $("ct").textContent = C.title; $("cs").textContent = C.sub;
  var st = document.createElement("style");
  st.textContent = D.map(function (m) {
    var k = function (a) { return "light-dark(" + a[0] + "," + a[1] + ")"; };
    return "." + m.id + "{--f:" + k(m.c.f) + ";--s:" + k(m.c.s) + ";--t:" + k(m.c.t) + "}";
  }).join("");
  document.head.appendChild(st);

  var cur = 0, vi = 0, ri = 0, water = {};
  function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
  function section(title) { var s = el("div", "dsec"); s.appendChild(el("h4", "", title)); return s; }
  function kvBlock(ex) {
    var s = section(ex[0]), dl = el("div", "kv");
    ex[1].forEach(function (kv) { var d = el("div"); d.appendChild(el("strong", "", kv[0])); d.appendChild(el("span", "", kv[1])); dl.appendChild(d); });
    s.appendChild(dl); return s;
  }
  function pick(v, m, k) { return v[k] !== undefined ? v[k] : m[k]; }

  function render() {
    var m = D[cur]; if (vi >= m.variants.length) vi = 0;
    var v = m.variants[vi], ratios = pick(v, m, "ratios"), yieldMode = v.calc === "yield";
    if (ri >= ratios.length) ri = 0;
    var wk = m.id + vi; if (water[wk] === undefined) water[wk] = pick(v, m, "water");
    Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (t, i) { t.setAttribute("aria-selected", String(i === cur)); });
    var p = $("panel"); p.textContent = ""; p.className = "sb " + m.id;

    var h = el("div", "sbh"); h.insertAdjacentHTML("beforeend", window.cupSvg());
    var hd = el("div"); hd.appendChild(el("small", "", m.kind)); hd.appendChild(el("h3", "", m.name)); hd.appendChild(el("p", "", m.tag));
    h.appendChild(hd); p.appendChild(h);

    var b = el("div", "sbb"); p.appendChild(b);
    b.appendChild(el("p", "dbody", m.body));

    var r = ratios[ri];
    var tiles = el("div", "tiles");
    var tl = [["Ratio", yieldMode ? "1:" + r[1] + " (dose to yield)" : r[1] + " g/l"], ["Grind", r[2] || "see notes"], ["Time", pick(v, m, "time")]];
    (v.tiles || []).forEach(function (x) { tl.push(x); });
    tl.forEach(function (x) { var t = el("div", "tile"); t.appendChild(el("small", "", x[0])); t.appendChild(el("strong", "", x[1])); tiles.appendChild(t); });
    b.appendChild(tiles);
    if (v.src) b.appendChild(el("p", "srcnote", "Not from the Atlas: this recipe comes from other sources, listed at the bottom."));

    var calc = section(yieldMode ? "How much yield?" : "How much coffee?");
    if (ratios.length > 1) {
      var sg = el("div", "tabs"); sg.setAttribute("role", "group"); sg.setAttribute("aria-label", yieldMode ? "Roast" : "Cup type");
      ratios.forEach(function (x, i) {
        var bt = el("button", "tab sm", yieldMode ? x[0] : x[0] + " (" + x[1] + " g/l)"); bt.type = "button"; bt.setAttribute("aria-pressed", String(i === ri));
        bt.onclick = function () { ri = i; render(); }; sg.appendChild(bt);
      });
      calc.appendChild(sg);
    }
    var row = el("div", "crow");
    var lab = el("label", "", yieldMode ? "Coffee (g)" : "Water (ml)"); lab.setAttribute("for", "wml");
    var inp = el("input"); inp.id = "wml"; inp.type = "number"; inp.min = "1"; inp.max = "5000"; inp.step = yieldMode ? "0.5" : "10"; inp.inputMode = "decimal"; inp.value = water[wk];
    var out = el("output", "cout"); out.setAttribute("aria-live", "polite");
    function upd() {
      var w = Number(inp.value); out.textContent = ""; if (!(w > 0)) return;
      water[wk] = w;
      if (yieldMode) { out.appendChild(el("b", "", fmt(w * r[1]) + " g")); out.appendChild(document.createTextNode(" in the cup")); }
      else { out.appendChild(el("b", "", fmt(w * r[1] / 1000) + " g")); out.appendChild(document.createTextNode(" coffee")); }
    }
    inp.addEventListener("input", upd); upd();
    row.appendChild(lab); row.appendChild(inp); row.appendChild(out); calc.appendChild(row);
    b.appendChild(calc);

    var ms = section("Method");
    if (m.variants.length > 1) {
      var vg = el("div", "tabs"); vg.setAttribute("role", "group"); vg.setAttribute("aria-label", "Method");
      m.variants.forEach(function (x, i) {
        var bt = el("button", "tab sm", x.n); bt.type = "button"; bt.setAttribute("aria-pressed", String(i === vi));
        bt.onclick = function () { vi = i; ri = 0; render(); }; vg.appendChild(bt);
      });
      ms.appendChild(vg);
    }
    var ol = el("ol", "rules"); v.steps.forEach(function (s) { ol.appendChild(el("li", "", s)); });
    ms.appendChild(ol); b.appendChild(ms);

    (v.tips || []).forEach(function (t) { b.appendChild(el("p", "callout", t)); });
    (v.extra || []).forEach(function (ex) { b.appendChild(kvBlock(ex)); });
    m.extra.forEach(function (ex) { b.appendChild(kvBlock(ex)); });

    if (v.links && v.links.length) {
      var s = section("Sources"); var ul = el("ul", "pts");
      v.links.forEach(function (l) { var li = el("li"); var a = el("a", "", l[0]); a.href = l[1]; a.target = "_blank"; a.rel = "noopener noreferrer"; li.appendChild(a); ul.appendChild(li); });
      s.appendChild(ul); b.appendChild(s);
    }
    var lg = el("p", "legend"); lg.appendChild(document.createTextNode("Tried it? "));
    var a = el("a", "", "Log a brew in the journal"); a.href = "../journal/index.html#log"; lg.appendChild(a); b.appendChild(lg);
  }

  var tb = $("tabs");
  D.forEach(function (m, i) {
    var t = el("button", "tab " + m.id, m.name); t.type = "button"; t.setAttribute("role", "tab");
    t.onclick = function () { cur = i; vi = 0; ri = 0; render(); }; tb.appendChild(t);
  });
  render();
})();
