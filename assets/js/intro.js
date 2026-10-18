/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears).

   Smoothness: every moving part is its own layer, moved only with transform and opacity (the phone's graphics chip
   does that without redrawing), all as Web Animations planned up front. Only the line drawing redraws the outline. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("intro")) return;
  var art = window.altoMarkArt, target = document.querySelector(".hero .mark");
  var hero = document.querySelector(".hero"), wm = hero && hero.querySelector("[data-wordmark]");
  var tiles = document.querySelector(".tiles"), bar = document.querySelector(".topnav");
  var anims = [], done = false, lay = null;
  function finish() {
    if (done) return; done = true;
    try { sessionStorage.setItem("alto.intro", "1"); } catch (e) {}
    root.classList.remove("intro");
    anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });   // the page keeps its normal look
    if (lay) lay.remove();
  }
  if (!art || !target || !document.body.animate) { finish(); return; }

  var NS = "http://www.w3.org/2000/svg", VB = art[0], W = 599, H = 397;
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  // the plant: the part of the mark above the two slopes of the mountain (in the mark's own units, 599 x 397)
  var SPROUT = [[268, 0], [393, 0], [393, 103.6], [389.2, 107.8], [385.8, 112.4], [371, 132.8], [357.4, 151.7], [349.2, 163.2], [337, 180.3], [334.3, 184],
    [324.8, 183.5], [322.4, 180.6], [309.2, 161.5], [298.8, 146.7], [281.5, 121.8], [268, 102]];
  var pts = SPROUT.map(function (p) { return p.join(","); }).join(" ");
  // the window the plant shows through: the same shape, open to the top (as a CSS polygon in % of the box)
  var win = "polygon(" + [[268, -400], [393, -400]].concat(SPROUT.slice(2)).map(function (p) { return (p[0] / W * 100).toFixed(2) + "% " + (p[1] / H * 100).toFixed(2) + "%"; }).join(",") + ")";
  function layer(cls) { var s = sv("svg", { viewBox: VB, class: "il " + cls }); return s; }

  lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var box = document.createElement("div"); box.className = "introbox"; lay.appendChild(box);
  // 1. the plant (behind), in its window
  var pw = document.createElement("div"); pw.className = "plantwin"; pw.style.clipPath = win; pw.style.webkitClipPath = win;
  var plant = layer("plant"), pdefs = sv("defs", {}), cp = sv("clipPath", { id: "ia-sp" }); cp.appendChild(sv("polygon", { points: pts })); pdefs.appendChild(cp); plant.appendChild(pdefs);
  plant.appendChild(sv("path", { d: art[1], "fill-rule": "evenodd", fill: "currentColor", "clip-path": "url(#ia-sp)" }));
  pw.appendChild(plant); box.appendChild(pw);
  // 2. the mountain: its fill, and on top the line that draws it
  var mclip = "M-20 -20H620V420H-20Z M" + SPROUT.map(function (p) { return p.join(" "); }).join(" L") + " Z";
  var fillL = layer("fill"), fd = sv("defs", {}), fc = sv("clipPath", { id: "ia-mt" }); fc.appendChild(sv("path", { d: mclip, "clip-rule": "evenodd" })); fd.appendChild(fc); fillL.appendChild(fd);
  fillL.appendChild(sv("path", { d: art[1], "fill-rule": "evenodd", fill: "currentColor", "clip-path": "url(#ia-mt)" }));
  box.appendChild(fillL);
  var lineL = layer("line"), ld = sv("defs", {}), lc = sv("clipPath", { id: "ia-mt2" }); lc.appendChild(sv("path", { d: mclip, "clip-rule": "evenodd" })); ld.appendChild(lc); lineL.appendChild(ld);
  var line = sv("path", { d: art[1], fill: "none", stroke: "currentColor", "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round", "clip-path": "url(#ia-mt2)" });
  lineL.appendChild(line); box.appendChild(lineL);
  document.body.appendChild(lay);
  lay.addEventListener("click", function () { anims.forEach(function (a) { try { a.finish(); } catch (e) {} }); finish(); });

  var L = 9000; try { L = Math.ceil(line.getTotalLength()); } catch (e) {}
  line.style.strokeDasharray = L + " " + L;

  // where the mountain lands: the mark on the page (laid out already, only hidden)
  var a = box.getBoundingClientRect(), b = target.getBoundingClientRect();
  var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), sc = b.width / a.width;

  var EASE = "cubic-bezier(.45,0,.55,1)", OUT = "cubic-bezier(.22,1,.36,1)", BACK = "cubic-bezier(.34,1.5,.64,1)";
  function play(el, frames, delay, dur, easing) {
    var an = el.animate(frames, { delay: delay, duration: dur, easing: easing || "linear", fill: "both" });
    anims.push(an); return an;
  }
  // the outline is drawn, then filled
  play(line, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], 0, 1500, EASE);
  play(fillL, [{ opacity: 0 }, { opacity: 1 }], 1150, 500, OUT);
  play(lineL, [{ opacity: 1 }, { opacity: 0 }], 1500, 350);
  // the plant comes up from behind the mountain, turning in from the side, then wiggles
  var dpx = 200 / W;   // mark units to pixels (the box is 200 px wide)
  play(plant, [{ translate: (18 * dpx).toFixed(1) + "px " + (190 * dpx).toFixed(1) + "px" }, { translate: "0px 0px" }], 1500, 750, OUT);
  play(plant, [{ rotate: "22deg" }, { rotate: "0deg" }], 1500, 750, BACK);
  play(plant, [{ rotate: "0deg" }, { rotate: "-7deg", offset: 0.2 }, { rotate: "5deg", offset: 0.45 }, { rotate: "-2.5deg", offset: 0.7 }, { rotate: "1deg", offset: 0.87 }, { rotate: "0deg" }], 2300, 800, "ease-in-out");
  // the mountain flies to its place, the real mark takes over, the name and the page fade in
  play(box, [{ transform: "translate(0px,0px) scale(1)" }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + sc + ")" }], 3150, 800, EASE);
  play(target, [{ visibility: "hidden" }, { visibility: "visible" }], 3950, 1);
  play(lay, [{ opacity: 1 }, { opacity: 0 }], 3950, 250);
  if (wm) play(wm, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], 3950, 600, OUT);
  if (tiles) play(tiles, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], 4200, 700, OUT);
  if (bar) play(bar, [{ opacity: 0 }, { opacity: 1 }], 4350, 600, OUT);
  var END = 5000;
  // for checking frame by frame (scratch tests): window.__introSeek(ms)
  window.__introSeek = function (t) { anims.forEach(function (an) { an.pause(); an.currentTime = t; }); };
  setTimeout(function () { if (!window.__introPaused) finish(); }, END);
})();
