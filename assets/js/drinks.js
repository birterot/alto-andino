/* Renders chapters/drinks.html from window.DRINKS (data/drinks.js): one tab per kind of drink,
   one card per drink with its cup drawn to scale, and a tab about milk. */
(function () {
  var C = window.DRINKS, $ = function (i) { return document.getElementById(i); };
  var NS = "http://www.w3.org/2000/svg";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var NAMES = { espresso: "Espresso", water: "Hot water", milk: "Steamed milk", foam: "Milk foam", cold: "Cold milk", ice: "Ice", filter: "Filter coffee", gelato: "Ice cream" };
  $("ct").textContent = C.title; $("cs").textContent = C.sub;

  var PX = 0.5, MAXML = 300, W = 62;   // 0.5 px per ml, every cup on the same scale
  function cup(d) {
    var total = d.layers.reduce(function (a, l) { return a + l[1]; }, 0);
    var hCup = Math.round(Math.max(total * 1.18, 40) * PX), top = MAXML * PX + 6 - hCup;
    var s = sv("svg", { width: W + 8, height: MAXML * PX + 10, viewBox: "-4 0 " + (W + 8) + " " + (MAXML * PX + 10), role: "img", "aria-label": d.name + ": " + d.layers.map(function (l) { return l[1] + " ml " + NAMES[l[0]].toLowerCase(); }).join(", ") });
    var y = MAXML * PX + 6, inset = 3;
    d.layers.forEach(function (l) {
      var h = l[1] * PX; y -= h;
      var r = sv("rect", { x: inset, y: y, width: W - 2 * inset, height: h, fill: "var(--l-" + l[0] + ")" });
      s.appendChild(r);
      if (l[0] === "foam") {   // foam: bubbles and a soft edge, so it shows against the milk and the page
        s.appendChild(sv("rect", { x: inset, y: y, width: W - 2 * inset, height: h, fill: "url(#dfoam)" }));
        s.appendChild(sv("line", { x1: inset, x2: W - inset, y1: y + 0.5, y2: y + 0.5, stroke: "var(--l-foamdot)", "stroke-width": 1 }));
      }
      if (l[0] === "gelato") {   // a round scoop, sitting in the espresso
        s.removeChild(r);
        s.appendChild(sv("path", { d: "M" + (inset + 3) + " " + (y + h) + " Q" + (inset + 3) + " " + (y + 2) + " " + (W / 2) + " " + (y + 1) + " Q" + (W - inset - 3) + " " + (y + 2) + " " + (W - inset - 3) + " " + (y + h) + " Z", fill: "var(--l-gelato)", stroke: "var(--l-foamdot)", "stroke-width": 0.8 }));
      }
      if (l[0] === "ice") for (var i = 0; i < 3; i++) s.appendChild(sv("rect", { x: inset + 6 + i * 16, y: y + 4 + (i % 2) * 8, width: 11, height: 11, rx: 2, fill: "none", stroke: "var(--glass)", "stroke-width": 1 }));
    });
    // the cup: an outline a bit taller than what is in it
    s.appendChild(sv("path", { d: "M0 " + top + " V" + (MAXML * PX + 3) + " Q0 " + (MAXML * PX + 6) + " 3 " + (MAXML * PX + 6) + " H" + (W - 3) + " Q" + W + " " + (MAXML * PX + 6) + " " + W + " " + (MAXML * PX + 3) + " V" + top, fill: "none", stroke: "var(--glass)", "stroke-width": 1.5, "stroke-linecap": "round" }));
    return s;
  }
  function card(d) {
    var c = el("article", "dcard"), left = el("div", "dcup"), total = d.layers.reduce(function (a, l) { return a + l[1]; }, 0);
    left.appendChild(cup(d)); left.appendChild(el("small", "", "~" + total + " ml"));
    var r = el("div");
    r.appendChild(el("h3", "", d.name)); r.appendChild(el("p", "shot", d.shot)); r.appendChild(el("p", "", d.what));
    r.appendChild(el("p", "cupsz", d.cup)); if (d.flair) r.appendChild(el("p", "flair", d.flair));
    c.append(left, r); return c;
  }
  // one shared bubble pattern for the foam
  var defs = sv("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute" }), pat = sv("pattern", { id: "dfoam", width: 9, height: 7, patternUnits: "userSpaceOnUse" });
  pat.appendChild(sv("circle", { cx: 2.5, cy: 2.5, r: 1.6, fill: "none", stroke: "var(--l-foamdot)", "stroke-width": 0.9 }));
  pat.appendChild(sv("circle", { cx: 7, cy: 5.5, r: 1.1, fill: "none", stroke: "var(--l-foamdot)", "stroke-width": 0.8 }));
  defs.appendChild(pat); document.querySelector("main").appendChild(defs);   // inside main, where the colours are defined
  function keys(kinds) {
    var u = el("ul", "dkeys");
    kinds.forEach(function (k) { var li = el("li"), i = el("i", k === "foam" ? "foam" : ""); i.style.setProperty("--k", "var(--l-" + k + ")"); li.append(i, document.createTextNode(NAMES[k])); u.appendChild(li); });
    return u;
  }
  var TABS = C.groups.map(function (g) { return g[0]; }).concat(["milkinfo"]), cur = 0;
  try { var saved = localStorage.getItem("alto.drinks.tab"); if (TABS.indexOf(saved) >= 0) cur = TABS.indexOf(saved); } catch (e) {}
  TABS.forEach(function (id, i) {
    var g = C.groups.find(function (x) { return x[0] === id; }), lbl = g ? g[1] : "Milk";
    var b = el("button", "tab", lbl); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("data-t", lbl);
    b.onclick = function () { cur = i; try { localStorage.setItem("alto.drinks.tab", id); } catch (e) {} render(); };
    $("tabs").appendChild(b);
  });
  function render() {
    Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (t, i) { t.setAttribute("aria-selected", String(i === cur)); });
    var p = $("panel"); p.textContent = ""; var id = TABS[cur];
    if (id === "milkinfo") {
      p.appendChild(el("h2", "", "Which milk"));
      var u = el("ul", "milks");
      C.MILKS.filter(function (m) { return m[2]; }).forEach(function (m) { var li = el("li"); li.appendChild(el("strong", "", m[1])); li.appendChild(document.createTextNode(m[2])); u.appendChild(li); });
      p.appendChild(u);
      p.appendChild(el("h2", "", "Steaming milk"));
      var o = el("ol", "steps"); C.steam.forEach(function (s) { o.appendChild(el("li", "", s)); }); p.appendChild(o);
      return;
    }
    var g = C.groups.find(function (x) { return x[0] === id; }), list = C.D.filter(function (d) { return d.group === id; });
    p.appendChild(el("p", "ghint", g[2]));
    var kinds = []; list.forEach(function (d) { d.layers.forEach(function (l) { if (kinds.indexOf(l[0]) < 0) kinds.push(l[0]); }); });
    p.appendChild(keys(kinds));
    var grid = el("div", "dgrid"); list.forEach(function (d) { grid.appendChild(card(d)); }); p.appendChild(grid);
  }
  render();
})();
