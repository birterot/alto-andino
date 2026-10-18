/* Small chart toolkit for the Trends page: scatter, lines, bars, diverging bars, stacked columns, dumbbell.
   Plain SVG, no libraries. Every chart sizes itself to its box, has a tap/hover tooltip and keyboard focus,
   and every chart on the page also gets a "Show the numbers" table, so nothing is only in a tooltip.
   Colours come from CSS variables on the page (see trends/index.html), so light and dark mode both work. */
window.Charts = (function () {
  var NS = "http://www.w3.org/2000/svg";
  // a row label that never runs out of its space: cut with "…" (the full name stays in the tooltip and as a title)
  function rowLabel(g, xr, cy, text, maxW) {
    var n = Math.max(4, Math.floor(maxW / 7.1)), t = String(text);
    var el = s("text", { x: xr, y: cy + 4, "text-anchor": "end", class: "rl" }, t.length > n ? t.slice(0, n - 1).trim() + "\u2026" : t);
    if (t.length > n) el.appendChild(s("title", {}, t));
    g.appendChild(el); return el;
  }
  // label space: fits the longest label, but at most 150 px and about 40% of the chart width (phones)
  function labelSpace(box, rows, min) {
    var w = (box && box.clientWidth) || 360;
    return Math.min(150, Math.round(w * 0.4), Math.max(min, Math.max.apply(null, rows.map(function (r) { return String(r.label).length; })) * 7.2));
  }
  function s(tag, a, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) if (a[k] !== undefined && a[k] !== null) e.setAttribute(k, a[k]);
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }

  // ---------- numbers ----------
  function niceStep(span, count) {
    var raw = span / Math.max(1, count), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function ticks(d0, d1, count) {
    var st = niceStep(d1 - d0 || 1, count || 5), out = [];
    for (var v = Math.ceil(d0 / st) * st; v <= d1 + st * 1e-9; v += st) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  function niceDomain(lo, hi, count) {
    if (!isFinite(lo) || !isFinite(hi)) return [0, 1];
    if (lo === hi) { lo -= 1; hi += 1; }
    var st = niceStep(hi - lo, count || 5);
    return [Math.floor(lo / st) * st, Math.ceil(hi / st) * st];
  }
  function scale(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / ((d1 - d0) || 1) * (r1 - r0); }; }

  // ---------- tooltip ----------
  var tip = null, tipOwner = null;
  function tipBox() {
    if (!tip) {
      tip = h("div", "ctip"); tip.setAttribute("role", "status"); tip.hidden = true; document.body.appendChild(tip);
      document.addEventListener("pointerdown", function (e) { if (tipOwner && !tipOwner.contains(e.target)) hideTip(); }, true);
      window.addEventListener("scroll", hideTip, { passive: true });
    }
    return tip;
  }
  // content: { title, rows: [{ value, label, color, kind: "line" | "dot" }] }
  function showTip(x, y, content, owner) {
    var t = tipBox(); t.textContent = ""; tipOwner = owner || null;
    if (content.title) t.appendChild(h("div", "ct", content.title));
    (content.rows || []).forEach(function (r) {
      var row = h("div", "cr");
      if (r.color) { var k = h("i", r.kind === "dot" ? "kd" : "kl"); k.style.background = r.color; row.appendChild(k); }
      row.appendChild(h("b", "", r.value));
      if (r.label) row.appendChild(h("span", "", r.label));
      t.appendChild(row);
    });
    t.hidden = false;
    var w = t.offsetWidth, hh = t.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.min(Math.max(8, x - w / 2), vw - w - 8), top = y - hh - 14;
    if (top < 8) top = y + 18;
    t.style.left = left + "px"; t.style.top = (top + window.scrollY) + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; tipOwner = null; }
  // Hover, tap and keyboard focus all show the same tooltip.
  function bind(target, owner, content) {
    target.setAttribute("tabindex", "0");
    var at = function (e) { var r = target.getBoundingClientRect(); showTip(e && e.clientX !== undefined ? e.clientX : r.left + r.width / 2, e && e.clientY !== undefined ? e.clientY : r.top, content(), owner); target.classList.add("hot"); };
    target.addEventListener("pointerenter", at); target.addEventListener("pointerdown", at);
    target.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { hideTip(); } target.classList.remove("hot"); });
    target.addEventListener("focus", function () { at(); });
    target.addEventListener("blur", function () { hideTip(); target.classList.remove("hot"); });
  }

  // ---------- frame and axes ----------
  function frame(box, height, m) {
    box.textContent = "";
    var W = Math.max(280, Math.round(box.clientWidth || 340));
    var svg = s("svg", { class: "ch", width: W, height: height, viewBox: "0 0 " + W + " " + height });
    box.appendChild(svg);
    return { svg: svg, W: W, H: height, L: m[3], R: W - m[1], T: m[0], B: height - m[2] };
  }
  function axes(f, o) {
    var g = s("g", { class: "ax" }); f.svg.appendChild(g);
    (o.yTicks || []).forEach(function (v) {
      var y = o.y(v);
      g.appendChild(s("line", { x1: f.L, x2: f.R, y1: y, y2: y, class: v === o.yBase ? "base" : "grid" }));
      g.appendChild(s("text", { x: f.L - 8, y: y + 4, "text-anchor": "end" }, o.yFmt ? o.yFmt(v) : v));
    });
    (o.xTicks || []).forEach(function (v) {
      var x = o.x(v);
      if (o.xGrid) g.appendChild(s("line", { x1: x, x2: x, y1: f.T, y2: f.B, class: v === o.xBase ? "base" : "grid" }));
      g.appendChild(s("text", { x: x, y: f.B + 18, "text-anchor": "middle" }, o.xFmt ? o.xFmt(v) : v));
    });
    if (!o.noBaseline) g.appendChild(s("line", { x1: f.L, x2: f.R, y1: f.B, y2: f.B, class: "base" }));
    if (o.xLabel) g.appendChild(s("text", { x: (f.L + f.R) / 2, y: f.H - 4, "text-anchor": "middle", class: "lab" }, o.xLabel));
    if (o.yLabel) g.appendChild(s("text", { x: f.L - 8, y: f.T - 8, "text-anchor": "start", class: "lab", transform: null }, o.yLabel));
  }

  // ---------- scatter ----------
  // o: { box, height, points: [{ x, y, color, hollow, r, tip }], xLabel, yLabel, xDomain, yDomain, xFmt, yFmt,
  //      path: true (connect in order), last: true (ring the last point), yInvert, xBase, yBase, zones: [{x0,x1,label}] , corner: [tl,tr,bl,br] }
  function scatter(o) {
    var f = frame(o.box, o.height || 300, [o.yLabel ? 26 : 12, 14, o.xLabel ? 42 : 26, 40]);
    var pts = o.points;
    var xd = o.xDomain || niceDomain(Math.min.apply(null, pts.map(function (p) { return p.x; })), Math.max.apply(null, pts.map(function (p) { return p.x; })), 5);
    var yd = o.yDomain || niceDomain(Math.min.apply(null, pts.map(function (p) { return p.y; })), Math.max.apply(null, pts.map(function (p) { return p.y; })), 5);
    var x = scale(xd[0], xd[1], f.L + 6, f.R - 6), y = o.yInvert ? scale(yd[0], yd[1], f.T + 6, f.B - 6) : scale(yd[0], yd[1], f.B - 6, f.T + 6);
    (o.zones || []).forEach(function (z) {
      f.svg.appendChild(s("rect", { x: x(z.x0), y: f.T, width: x(z.x1) - x(z.x0), height: f.B - f.T, class: "zone" }));
      if (z.label) f.svg.appendChild(s("text", { x: (x(z.x0) + x(z.x1)) / 2, y: f.T + 14, "text-anchor": "middle", class: "zlab" }, z.label));
    });
    axes(f, { x: x, y: y, xTicks: o.xTicks || ticks(xd[0], xd[1], 5), yTicks: o.yTicks || ticks(yd[0], yd[1], 4), xFmt: o.xFmt, yFmt: o.yFmt, xLabel: o.xLabel, yLabel: o.yLabel, xGrid: o.xGrid, xBase: o.xBase, yBase: o.yBase, noBaseline: o.noBaseline });
    (o.corner || []).forEach(function (c, i) {
      if (!c) return;
      var right = i % 2 === 1, bottom = i > 1;
      f.svg.appendChild(s("text", { x: right ? f.R - 4 : f.L + 4, y: bottom ? f.B - 8 : f.T + 14, "text-anchor": right ? "end" : "start", class: "zlab" }, c));
    });
    var tp = pts.slice(o.trailFrom || 0);
    if (o.path && tp.length > 1) f.svg.appendChild(s("polyline", { points: tp.map(function (p) { return x(p.x) + "," + y(p.y); }).join(" "), class: "trail" }));
    pts.forEach(function (p, i) {
      var g = s("g", { class: p.faded ? "pt faded" : "pt" }), cx = x(p.x), cy = y(p.y), r = p.r || 5;
      g.appendChild(s("circle", { cx: cx, cy: cy, r: 13, class: "hit" }));
      if (o.last && i === pts.length - 1) g.appendChild(s("circle", { cx: cx, cy: cy, r: r + 5, class: "lastring" }));
      g.appendChild(s("circle", { cx: cx, cy: cy, r: r, class: p.hollow ? "dot hollow" : "dot", style: p.hollow ? "stroke:" + p.color : "fill:" + p.color }));
      if (p.tip) bind(g, o.box, p.tip);
      f.svg.appendChild(g);
    });
    return f;
  }

  // ---------- lines with crosshair ----------
  // o: { box, height, series: [{ name, color, points: [{ x, y }], dots: true }], cloud: [{x,y,tip}] (grey dots behind),
  //      xLabel, yLabel, xDomain, yDomain, yTicks, xFmt, yFmt, yBase, tipTitle(x), valueFmt(series, y), labelEnds }
  function lines(o) {
    var f = frame(o.box, o.height || 300, [o.yLabel ? 26 : 12, o.labelEnds ? 70 : 14, o.xLabel ? 42 : 26, 40]);
    var all = [].concat.apply([], o.series.map(function (sr) { return sr.points; })).concat(o.cloud || []);
    var xd = o.xDomain || niceDomain(Math.min.apply(null, all.map(function (p) { return p.x; })), Math.max.apply(null, all.map(function (p) { return p.x; })), 6);
    var yd = o.yDomain || niceDomain(Math.min.apply(null, all.map(function (p) { return p.y; })), Math.max.apply(null, all.map(function (p) { return p.y; })), 4);
    var x = scale(xd[0], xd[1], f.L, f.R), y = scale(yd[0], yd[1], f.B, f.T);
    axes(f, { x: x, y: y, xTicks: ticks(xd[0], xd[1], 6), yTicks: o.yTicks || ticks(yd[0], yd[1], 4), xFmt: o.xFmt, yFmt: o.yFmt, xLabel: o.xLabel, yLabel: o.yLabel, yBase: o.yBase });
    (o.cloud || []).forEach(function (p) {
      var g = s("g", { class: "pt" });
      g.appendChild(s("circle", { cx: x(p.x), cy: y(p.y), r: 4, class: "cloud" }));
      f.svg.appendChild(g);
    });
    o.series.forEach(function (sr) {
      var pts = sr.points.slice().sort(function (a, b) { return a.x - b.x; });
      if (pts.length > 1) f.svg.appendChild(s("polyline", { points: pts.map(function (p) { return x(p.x) + "," + y(p.y); }).join(" "), class: "ln", style: "stroke:" + sr.color }));
      if (sr.dots !== false) pts.forEach(function (p) { f.svg.appendChild(s("circle", { cx: x(p.x), cy: y(p.y), r: 4, class: "dot", style: "fill:" + sr.color })); });
      if (o.labelEnds && pts.length) { var e = pts[pts.length - 1]; f.svg.appendChild(s("text", { x: x(e.x) + 8, y: y(e.y) + 4, class: "endlab" }, sr.name)); }
    });
    // crosshair: snaps to the nearest x that has data, lists every series there
    var xs = []; o.series.forEach(function (sr) { sr.points.forEach(function (p) { if (xs.indexOf(p.x) < 0) xs.push(p.x); }); });
    xs.sort(function (a, b) { return a - b; });
    if (!xs.length) return f;
    var hair = s("line", { y1: f.T, y2: f.B, class: "hair", visibility: "hidden" }); f.svg.appendChild(hair);
    var pad = s("rect", { x: f.L, y: f.T, width: f.R - f.L, height: f.B - f.T, class: "pad", tabindex: "0" }); f.svg.appendChild(pad);
    var cur = 0;
    function at(i, cx, cy) {
      cur = Math.max(0, Math.min(xs.length - 1, i)); var xv = xs[cur], px = x(xv);
      hair.setAttribute("x1", px); hair.setAttribute("x2", px); hair.setAttribute("visibility", "visible");
      var rows = o.series.map(function (sr) {
        var p = sr.points.filter(function (q) { return q.x === xv; })[0];
        return p ? { value: o.valueFmt ? o.valueFmt(sr, p.y, p) : String(p.y), label: sr.name, color: sr.color } : null;
      }).filter(Boolean);
      var r = f.svg.getBoundingClientRect();
      showTip(cx !== undefined ? cx : r.left + px * r.width / f.W, cy !== undefined ? cy : r.top + f.T, { title: o.tipTitle ? o.tipTitle(xv) : String(xv), rows: rows }, o.box);
    }
    function near(e) {
      var r = f.svg.getBoundingClientRect(), px = (e.clientX - r.left) * f.W / r.width, best = 0, bd = Infinity;
      xs.forEach(function (v, i) { var d = Math.abs(x(v) - px); if (d < bd) { bd = d; best = i; } });
      at(best, e.clientX, e.clientY);
    }
    pad.addEventListener("pointermove", near); pad.addEventListener("pointerdown", near);
    pad.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { hideTip(); hair.setAttribute("visibility", "hidden"); } });
    pad.addEventListener("focus", function () { at(cur); });
    pad.addEventListener("blur", function () { hideTip(); hair.setAttribute("visibility", "hidden"); });
    pad.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); at(cur + (e.key === "ArrowRight" ? 1 : -1)); }
    });
    return f;
  }

  // ---------- horizontal bars (one series) ----------
  // o: { box, rows: [{ label, value, note, tip }], domain: [0, max], fmt, color }
  function hbars(o) {
    var lw = o.labelWidth || labelSpace(o.box, o.rows, 70);
    var rowH = 30, f = frame(o.box, o.rows.length * rowH + 30, [6, o.rows.some(function (r) { return r.sub; }) ? 76 : 44, 24, lw + 12]);
    var d = o.domain || [0, Math.max.apply(null, o.rows.map(function (r) { return r.value; }))];
    var x = scale(d[0], d[1], f.L, f.R);
    axes(f, { x: x, y: function () { return 0; }, xTicks: o.xTicks || ticks(d[0], d[1], 5), xGrid: true, xFmt: o.xFmt, noBaseline: true });
    o.rows.forEach(function (r, i) {
      var cy = f.T + i * rowH + rowH / 2, bh = 16, w = Math.max(2, x(r.value) - f.L);
      var g = s("g", { class: "bar" });
      g.appendChild(s("rect", { x: 0, y: cy - rowH / 2, width: f.W, height: rowH, class: "hit" }));
      rowLabel(g, f.L - 10, cy, r.label, f.L - 14);
      g.appendChild(s("path", { d: barPath(f.L, cy - bh / 2, w, bh, 4), style: "fill:" + (r.color || o.color) }));
      var vt = s("text", { x: f.L + w + 6, y: cy + 4, class: "val" }, r.text || (o.fmt ? o.fmt(r.value) : r.value));
      if (r.sub) vt.appendChild(s("tspan", { class: "note", dx: 4 }, r.sub));
      g.appendChild(vt);
      if (r.note) g.appendChild(s("text", { x: f.L + w + 6 + (String(o.fmt ? o.fmt(r.value) : r.value).length * 7.4) + 6, y: cy + 4, class: "note" }, r.note));
      if (r.tip) bind(g, o.box, r.tip);
      f.svg.appendChild(g);
    });
    return f;
  }
  // a bar with 4px rounded data end, square at the baseline (grows to the right)
  function barPath(x0, y0, w, hh, rr) {
    var r = Math.min(rr, w / 2, hh / 2);
    return "M" + x0 + " " + y0 + "H" + (x0 + w - r) + "Q" + (x0 + w) + " " + y0 + " " + (x0 + w) + " " + (y0 + r) + "V" + (y0 + hh - r) + "Q" + (x0 + w) + " " + (y0 + hh) + " " + (x0 + w - r) + " " + (y0 + hh) + "H" + x0 + "Z";
  }
  function barPathLeft(x1, y0, w, hh, rr) {   // grows to the left from x1
    var r = Math.min(rr, w / 2, hh / 2), x0 = x1 - w;
    return "M" + x1 + " " + y0 + "H" + (x0 + r) + "Q" + x0 + " " + y0 + " " + x0 + " " + (y0 + r) + "V" + (y0 + hh - r) + "Q" + x0 + " " + (y0 + hh) + " " + (x0 + r) + " " + (y0 + hh) + "H" + x1 + "Z";
  }

  // ---------- diverging bars around zero ----------
  // o: { box, rows: [{ label, value, color, tip }], domain: [-5, 5], fmt, compact }
  function divbars(o) {
    var rowH = o.compact ? 24 : 30, lw = 66;
    var f = frame(o.box, o.rows.length * rowH + (o.compact ? 22 : 28), [4, 14, o.compact ? 18 : 24, lw]);
    var d = o.domain || [-5, 5], x = scale(d[0], d[1], f.L, f.R), z = x(0);
    axes(f, { x: x, y: function () { return 0; }, xTicks: o.xTicks || [d[0], 0, d[1]], xGrid: true, xBase: 0, xFmt: o.xFmt, noBaseline: true });
    o.rows.forEach(function (r, i) {
      var cy = f.T + i * rowH + rowH / 2, bh = o.compact ? 12 : 16, g = s("g", { class: "bar" });
      g.appendChild(s("rect", { x: 0, y: cy - rowH / 2, width: f.W, height: rowH, class: "hit" }));
      rowLabel(g, f.L - 8, cy, r.label, f.L - 10);
      if (r.value === null || r.value === undefined) g.appendChild(s("text", { x: z + 6, y: cy + 4, class: "note" }, "no score yet"));
      else {
        var w = Math.abs(x(r.value) - z);
        if (w < 2) g.appendChild(s("rect", { x: z - 1.5, y: cy - bh / 2, width: 3, height: bh, rx: 1.5, style: "fill:" + r.color }));
        else g.appendChild(s("path", { d: r.value >= 0 ? barPath(z, cy - bh / 2, w, bh, 4) : barPathLeft(z, cy - bh / 2, w, bh, 4), style: "fill:" + r.color }));
      }
      if (r.tip) bind(g, o.box, r.tip);
      f.svg.appendChild(g);
    });
    return f;
  }

  // ---------- stacked columns (e.g. brews per week by person) ----------
  // o: { box, height, cols: [{ label, parts: [{ value, color, name }], tip }], yLabel }
  function stacked(o) {
    var f = frame(o.box, o.height || 220, [o.yLabel ? 26 : 12, 10, 30, 32]);
    var max = Math.max(1, Math.max.apply(null, o.cols.map(function (c) { return c.parts.reduce(function (a, p) { return a + p.value; }, 0); })));
    var yd = niceDomain(0, max, 4), y = scale(0, yd[1], f.B, f.T);
    var band = (f.R - f.L) / o.cols.length, bw = Math.min(24, band * 0.62);
    axes(f, { x: function () { return 0; }, y: y, yTicks: ticks(0, yd[1], 4).filter(function (v) { return v === Math.round(v); }), yLabel: o.yLabel, yBase: 0 });
    var every = Math.ceil(o.cols.length / Math.max(1, Math.floor((f.R - f.L) / 64)));
    o.cols.forEach(function (c, i) {
      var cx = f.L + band * i + band / 2, g = s("g", { class: "bar" }), total = 0;
      g.appendChild(s("rect", { x: cx - band / 2, y: f.T, width: band, height: f.B - f.T, class: "hit" }));
      var parts = c.parts.filter(function (p) { return p.value > 0; });
      parts.forEach(function (p, k) {
        var top = y(total + p.value), bottom = y(total) - (k > 0 ? 2 : 0), hgt = bottom - top;   // 2px surface gap between segments
        var isTop = k === parts.length - 1;
        if (hgt > 0) g.appendChild(s("path", { d: isTop ? colPath(cx - bw / 2, top, bw, hgt, 4) : "M" + (cx - bw / 2) + " " + top + "h" + bw + "v" + hgt + "h" + (-bw) + "Z", style: "fill:" + p.color }));
        total += p.value;
      });
      if (i % every === 0) g.appendChild(s("text", { x: cx, y: f.B + 18, "text-anchor": "middle" }, c.label));
      if (c.tip) bind(g, o.box, c.tip);
      f.svg.appendChild(g);
    });
    return f;
  }
  function colPath(x0, y0, w, hh, rr) {   // 4px rounded top, square at the baseline
    var r = Math.min(rr, w / 2, hh);
    return "M" + x0 + " " + (y0 + hh) + "V" + (y0 + r) + "Q" + x0 + " " + y0 + " " + (x0 + r) + " " + y0 + "H" + (x0 + w - r) + "Q" + (x0 + w) + " " + y0 + " " + (x0 + w) + " " + (y0 + r) + "V" + (y0 + hh) + "Z";
  }

  // ---------- dumbbell (two values per row, e.g. two people) ----------
  // o: { box, rows: [{ label, a, b, tip }], domain: [1, 5], colors: [ca, cb], fmt }
  function dumbbell(o) {
    var lw = labelSpace(o.box, o.rows, 80);
    var rowH = 32, f = frame(o.box, o.rows.length * rowH + 30, [6, 18, 24, lw + 12]);
    var d = o.domain, x = scale(d[0], d[1], f.L, f.R);
    axes(f, { x: x, y: function () { return 0; }, xTicks: ticks(d[0], d[1], 4), xGrid: true, xFmt: o.fmt, noBaseline: true });
    o.rows.forEach(function (r, i) {
      var cy = f.T + i * rowH + rowH / 2, g = s("g", { class: "bar" });
      g.appendChild(s("rect", { x: 0, y: cy - rowH / 2, width: f.W, height: rowH, class: "hit" }));
      rowLabel(g, f.L - 10, cy, r.label, f.L - 14);
      if (r.a !== null && r.b !== null) g.appendChild(s("line", { x1: x(r.a), x2: x(r.b), y1: cy, y2: cy, class: "stem" }));
      [[r.a, o.colors[0]], [r.b, o.colors[1]]].forEach(function (v) { if (v[0] !== null) g.appendChild(s("circle", { cx: x(v[0]), cy: cy, r: 6, class: "dot", style: "fill:" + v[1] })); });
      if (r.tip) bind(g, o.box, r.tip);
      f.svg.appendChild(g);
    });
    return f;
  }

  // ---------- table view ----------
  function table(headers, rows) {
    var t = h("table"), tr = h("tr");
    headers.forEach(function (x) { tr.appendChild(h("th", "", x)); }); t.appendChild(tr);
    rows.forEach(function (r) { var row = h("tr"); r.forEach(function (c) { row.appendChild(h("td", "", c === null || c === undefined ? "-" : String(c))); }); t.appendChild(row); });
    return t;
  }

  return { scatter: scatter, lines: lines, hbars: hbars, divbars: divbars, stacked: stacked, dumbbell: dumbbell, table: table, ticks: ticks, hideTip: hideTip, showTip: showTip };
})();
