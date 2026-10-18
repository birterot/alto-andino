/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears). */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("intro")) return;
  var art = window.altoMarkArt, target = document.querySelector(".hero .mark");
  var done = false;
  function finish() {
    if (done) return; done = true;
    try { sessionStorage.setItem("alto.intro", "1"); } catch (e) {}
    root.classList.remove("intro");
    var o = document.getElementById("introlay"); if (o) o.remove();
  }
  if (!art || !target) { finish(); return; }

  var NS = "http://www.w3.org/2000/svg";
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  // where the plant is: the part of the mark above the two slopes of the mountain (in the mark's own units, 599 x 397)
  var SPROUT = "268,0 393,0 393,103.6 389.2,107.8 385.8,112.4 371,132.8 357.4,151.7 349.2,163.2 337,180.3 334.3,184 324.8,183.5 322.4,180.6 309.2,161.5 298.8,146.7 281.5,121.8 268,102";
  var ABOVE = "268,-400 393,-400 " + SPROUT.split(" ").slice(2).join(" ");   // the same, open to the top: the plant shows only above the mountain
  var BASE = [330, 184];   // where the stem meets the mountain: the plant turns around this point

  var lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var svg = sv("svg", { viewBox: art[0], class: "intromark" });
  var defs = sv("defs", {});
  var cs = sv("clipPath", { id: "ia-sp" }); cs.appendChild(sv("polygon", { points: SPROUT })); defs.appendChild(cs);
  var ca = sv("clipPath", { id: "ia-above" }); ca.appendChild(sv("polygon", { points: ABOVE })); defs.appendChild(ca);
  var cm = sv("clipPath", { id: "ia-mt" }); cm.appendChild(sv("path", { d: "M-20 -20H620V420H-20Z M" + SPROUT.split(" ").join(" L") + " Z", "clip-rule": "evenodd" })); defs.appendChild(cm);
  svg.appendChild(defs);
  // the plant first (so it is behind the mountain), then the mountain: its outline (drawn) and its fill
  var outer = sv("g", { "clip-path": "url(#ia-above)" }), plant = sv("g", {});
  plant.appendChild(sv("path", { d: art[1], "fill-rule": "evenodd", fill: "currentColor", "clip-path": "url(#ia-sp)" }));
  outer.appendChild(plant); svg.appendChild(outer);
  var mt = sv("g", { "clip-path": "url(#ia-mt)" });
  var line = sv("path", { d: art[1], fill: "none", stroke: "currentColor", "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" });
  var fill = sv("path", { d: art[1], "fill-rule": "evenodd", fill: "currentColor", opacity: 0 });
  mt.appendChild(line); mt.appendChild(fill); svg.appendChild(mt);
  lay.appendChild(svg); document.body.appendChild(lay);
  lay.addEventListener("click", skip);

  var L = 0; try { L = line.getTotalLength(); } catch (e) { L = 9000; }
  line.style.strokeDasharray = L + " " + L; line.style.strokeDashoffset = L;
  function setPlant(dx, dy, deg, op) {
    plant.setAttribute("transform", "translate(" + dx + " " + dy + ") rotate(" + deg + " " + BASE[0] + " " + BASE[1] + ")");
    plant.style.opacity = op;
  }
  setPlant(18, 190, 22, 1);

  // a small timeline: [start ms, length ms, step(t from 0 to 1)]
  var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var out = function (t) { return 1 - Math.pow(1 - t, 3); };
  var back = function (t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var hero = document.querySelector(".hero"), wm = hero && hero.querySelector("[data-wordmark]");
  var moveFrom = null;
  var steps = [
    [0, 1500, function (t) { line.style.strokeDashoffset = L * (1 - ease(t)); }],
    [1150, 500, function (t) { fill.setAttribute("opacity", out(t)); }],
    [1500, 350, function (t) { line.setAttribute("opacity", 1 - t); }],
    [1500, 750, function (t) { var k = out(t), r = back(t); setPlant(18 * (1 - k), 190 * (1 - k), 22 * (1 - r), 1); }],   // up without overshoot (the stem stays in the valley), the turn overshoots a little
    [2250, 750, function (t) { var w = Math.sin(t * Math.PI * 3) * 8 * (1 - t); setPlant(0, 0, w, 1); }],
    [3150, 750, function (t) { moveTo(ease(t)); if (t >= 1) root.classList.add("intro-landed"); }],   // landed: the real mark takes over
    [3750, 350, function (t) { lay.style.background = "transparent"; lay.style.opacity = String(1 - t); }]
  ];
  // the mountain flies from the middle of the screen to its place on the page
  function moveTo(k) {
    if (!moveFrom) {
      var a = svg.getBoundingClientRect(), b = target.getBoundingClientRect();
      moveFrom = { dx: b.left + b.width / 2 - (a.left + a.width / 2), dy: b.top + b.height / 2 - (a.top + a.height / 2), s: b.width / a.width };
      root.classList.add("intro-show");   // the name and the page fade in while it lands
    }
    svg.style.transform = "translate(" + moveFrom.dx * k + "px," + moveFrom.dy * k + "px) scale(" + (1 + (moveFrom.s - 1) * k) + ")";
  }
  var t0 = null, END = 4100;
  function frame(now) {
    if (done) return;
    if (t0 === null) t0 = now;
    var t = now - t0;
    steps.forEach(function (s) { var p = (t - s[0]) / s[1]; if (p >= 0) s[2](Math.min(1, p)); });
    if (t < END) requestAnimationFrame(frame); else setTimeout(finish, 650);   // let the page finish fading in
  }
  function skip() { root.classList.add("intro-show"); finish(); }
  requestAnimationFrame(frame);
})();
