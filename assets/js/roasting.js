/* Renders chapters/roasting.html from window.ROASTING (data/roasting.js). */
(function () {
  var R = window.ROASTING, $ = function (i) { return document.getElementById(i); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  var NS = "http://www.w3.org/2000/svg";
  function se(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }

  $("ct").textContent = R.title; $("cs").textContent = R.sub;
  var kl = $("keys"); R.keys.forEach(function (k) { kl.appendChild(el("li", "", k)); });

  // ---- chart ----
  var W = 360, H = 222, X0 = 14, X1 = 346, Y0 = 18, Y1 = 168;
  var fa = function (v) { return 1 - v; }, fb = function (v) { return v; };
  var fs = function (v) { return Math.exp(-Math.pow(v - 0.5, 2) / (2 * 0.17 * 0.17)); };
  function px(v) { return X0 + v * (X1 - X0); }
  function py(y) { return Y1 - y * (Y1 - Y0); }
  function path(f) { var d = ""; for (var i = 0; i <= 50; i++) { var v = i / 50; d += (i ? "L" : "M") + px(v).toFixed(1) + " " + py(f(v)).toFixed(1); } return d; }
  var svg = se("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Acidity falls, bitterness rises and sweetness peaks in between as the roast gets darker." });
  svg.appendChild(se("line", { x1: X0, y1: Y1, x2: X1, y2: Y1, stroke: "var(--line)", "stroke-width": 1 }));
  [["Light", X0, "start"], ["Dark", X1, "end"]].forEach(function (l) {
    var t = se("text", { x: l[1], y: Y1 + 16, "text-anchor": l[2], "font-size": 11, fill: "var(--mut)" }); t.textContent = l[0]; svg.appendChild(t);
  });
  var tx = se("text", { x: (X0 + X1) / 2, y: Y1 + 16, "text-anchor": "middle", "font-size": 11, fill: "var(--mut)" }); tx.textContent = "heat: roast level →"; svg.appendChild(tx);
  var starts = R.STAGE_START;
  [[2, "1st crack"], [4, "2nd crack"]].forEach(function (c) {
    var x = px(starts[c[0]] / 100);
    svg.appendChild(se("line", { x1: x, y1: Y0 - 4, x2: x, y2: Y1 + 18, stroke: "var(--line)", "stroke-dasharray": "3 4" }));
    var t = se("text", { x: x, y: Y1 + 30, "text-anchor": "middle", "font-size": 10, fill: "var(--mut)" }); t.textContent = c[1]; svg.appendChild(t);
  });
  var CURVES = [["ca", fa, "Acidity", "none", 0.02], ["cs", fs, "Sweetness", "6 4", 0.5], ["cb", fb, "Bitterness", "none", 0.98]];
  CURVES.forEach(function (c) {
    var p = se("path", { d: path(c[1]), fill: "none", "stroke-width": 2.5, "stroke-linecap": "round", "class": c[0] });
    if (c[3] !== "none") p.setAttribute("stroke-dasharray", c[3]);
    svg.appendChild(p);
  });
  var lab = [["ca", "Acidity", X0 + 4, py(0.97) - 6, "start"], ["cs", "Sweetness", px(0.5), py(1) - 6, "middle"], ["cb", "Bitterness", X1 - 2, py(0.97) - 6, "end"]];
  lab.forEach(function (l) { var t = se("text", { x: l[2], y: l[3], "font-size": 11.5, "font-weight": 600, "text-anchor": l[4], "class": l[0] + "t" }); t.textContent = l[1]; svg.appendChild(t); });
  var mk = se("line", { y1: Y0 - 4, y2: Y1, stroke: "var(--ink)", "stroke-width": 1.5 }); svg.appendChild(mk);
  var dots = CURVES.map(function (c) { var d = se("circle", { r: 4.5, "class": c[0] + "d", stroke: "var(--card)", "stroke-width": 1.5 }); svg.appendChild(d); return d; });
  $("chart").appendChild(svg);

  // ---- gauges ----
  var gaugeRows = {};
  [["a", "Acidity", "ca"], ["s", "Sweetness", "cs"], ["b", "Bitterness", "cb"]].forEach(function (g) {
    var row = el("div", "g " + g[2]); row.appendChild(el("span", "", g[1]));
    var seg = el("div", "seg"); for (var i = 0; i < 5; i++) seg.appendChild(el("span", "segc"));
    row.appendChild(seg); var v = el("span", "gv", ""); row.appendChild(v);
    $("gauges").appendChild(row); gaugeRows[g[0]] = [seg, v];
  });
  function setGauge(k, val) {
    var n = Math.round(val * 5), r = gaugeRows[k];
    Array.prototype.forEach.call(r[0].children, function (c, i) { c.className = "segc" + (i < n ? " on" : ""); });
    r[1].textContent = n + "/5";
  }

  // ---- stages ----
  var stageLis = R.STAGES.map(function (s, i) {
    var li = el("li", "stp");
    var b = el("button", "row"); b.type = "button"; b.setAttribute("aria-expanded", "false");
    var left = el("span", "", (i + 1) + ". " + s[0]); var sm = el("small", "mut", s[1]);
    b.appendChild(left); b.appendChild(sm);
    var d = el("div", "sd"); var ul = el("ul", "pts"); s[2].forEach(function (p) { ul.appendChild(el("li", "", p)); }); d.appendChild(ul);
    b.onclick = function () { b.setAttribute("aria-expanded", String(li.classList.toggle("open"))); };
    li.appendChild(b); li.appendChild(d); $("stages").appendChild(li); return li;
  });

  // ---- quench ----
  $("qt").textContent = R.QUENCH.title; $("qi").textContent = R.QUENCH.intro;
  R.QUENCH.points.forEach(function (p) {
    var d = el("div", "pcard"); d.appendChild(el("strong", "", p[0])); d.appendChild(el("span", "", p[1])); $("quench").appendChild(d);
  });

  // ---- roasters ----
  var roasterEls = R.ROASTERS.map(function (r) {
    var d = el("div", "pcard rcard"); d.appendChild(el("strong", "", r[1]));
    var ul = el("ul", "pts"); r[3].forEach(function (p) { ul.appendChild(el("li", "", p)); }); d.appendChild(ul);
    $("roasters").appendChild(d); return d;
  });

  // ---- sliders ----
  var heat = $("heat"), time = $("time");
  function stageIndex(v) { var s = 0; for (var i = 0; i < starts.length; i++) if (v >= starts[i]) s = i; return s; }
  function levelName(v) {
    if (v < 45) return "Light";
    if (v < 62) return "Medium";
    if (v < 78) return "Medium-dark";
    return "Dark (French or Italian roast)";
  }
  function updateHeat() {
    var v = Number(heat.value), x = v / 100;
    var xp = px(x);
    mk.setAttribute("x1", xp); mk.setAttribute("x2", xp);
    dots.forEach(function (d, i) { d.setAttribute("cx", xp); d.setAttribute("cy", py(CURVES[i][1](x))); });
    setGauge("a", fa(x)); setGauge("s", fs(x)); setGauge("b", fb(x));
    var si = stageIndex(v);
    $("heatout").textContent = levelName(v);
    $("stageout").textContent = "Stage: " + R.STAGES[si][0] + ". " + R.STAGES[si][1] + ".";
    stageLis.forEach(function (li, i) { li.classList.toggle("now", i === si); li.classList.toggle("done", i < si); });
    heat.setAttribute("aria-valuetext", levelName(v));
  }
  function updateTime() {
    var v = Number(time.value), mode = v < 34 ? "fast" : v > 66 ? "slow" : "mid";
    $("timeout").textContent = mode === "fast" ? "Fast" : mode === "slow" ? "Slow" : "In between";
    $("timenote").textContent = mode === "fast" ? R.FAST_NOTE
      : mode === "slow" ? "Slow roasting is what drum roasters can do."
      : "Move the slider to see which roasters fit a fast or a slow roast.";
    R.ROASTERS.forEach(function (r, i) { roasterEls[i].classList.toggle("hl", mode !== "mid" && r[2] === mode); });
    time.setAttribute("aria-valuetext", $("timeout").textContent);
  }
  heat.addEventListener("input", updateHeat); time.addEventListener("input", updateTime);
  updateHeat(); updateTime();
})();
