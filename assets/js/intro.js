/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears).

   Smoothness: every moving part is its own picture layer, moved only with transform and opacity (the phone's graphics
   chip does that without redrawing), all as Web Animations planned up front. Only the first outline is drawn as a line. */
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

  // Light on the phone: the mountain, the plant and a backing (the mountain filled with the page colour, so the plant
  // can hide behind it) are ready-made pictures (assets/brand/intro). Pictures can be moved, turned, scaled and faded
  // by the graphics chip without being redrawn. Only the first line drawing is vector: one simple outline.
  var NS = "http://www.w3.org/2000/svg", W = 599, H = 397, BOXW = 200;
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
  var theme = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 < 0.5 ? "dark" : "light";
  var dir = (document.querySelector('script[src$="intro.js"]') || {}).src; dir = dir ? dir.replace(/js\/intro\.js.*$/, "brand/intro/") : "assets/brand/intro/";
  function img(name) { var i = new Image(); i.src = dir + name + "-" + theme + ".png"; i.alt = ""; i.className = "il " + name; i.decoding = "async"; return i; }

  lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var box = document.createElement("div"); box.className = "introbox"; lay.appendChild(box);
  var plant = img("plant"), back = img("back"), mountain = img("mountain");
  // the outline: the first contour of the mark (its outer edge), without the plant part
  var outline = art[1].slice(0, art[1].indexOf("Z") + 1);
  var SPROUT = "268,0 393,0 393,103.6 389.2,107.8 385.8,112.4 371,132.8 357.4,151.7 349.2,163.2 337,180.3 334.3,184 324.8,183.5 322.4,180.6 309.2,161.5 298.8,146.7 281.5,121.8 268,102";
  var lineL = sv("svg", { viewBox: art[0], class: "il line" }), ld = sv("defs", {}), lc = sv("clipPath", { id: "ia-mt" });
  lc.appendChild(sv("path", { d: "M-20 -20H620V420H-20Z M" + SPROUT.split(" ").join(" L") + " Z", "clip-rule": "evenodd" })); ld.appendChild(lc); lineL.appendChild(ld);
  var line = sv("path", { d: outline, fill: "none", stroke: "currentColor", "stroke-width": 5, "stroke-linejoin": "round", "clip-path": "url(#ia-mt)" });
  lineL.appendChild(line);
  box.appendChild(plant); box.appendChild(back); box.appendChild(lineL); box.appendChild(mountain);
  document.body.appendChild(lay);
  lay.addEventListener("click", function () { anims.forEach(function (a) { try { a.finish(); } catch (e) {} }); finish(); });

  var L = 4000; try { L = Math.ceil(line.getTotalLength()); } catch (e) {}
  line.style.strokeDasharray = L + " " + L; line.style.strokeDashoffset = L;
  mountain.style.opacity = 0;
  plant.style.transform = "translate3d(" + (18 * BOXW / W).toFixed(1) + "px," + (190 * BOXW / W).toFixed(1) + "px,0) rotate(22deg)";

  var a = box.getBoundingClientRect(), b = target.getBoundingClientRect();
  var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), sc = b.width / a.width;
  var EASE = "cubic-bezier(.45,0,.55,1)", OUT = "cubic-bezier(.22,1,.36,1)";
  function play(el, frames, delay, dur, easing, fill) {
    var an = el.animate(frames, { delay: delay, duration: dur, easing: easing || "linear", fill: fill || "both" });
    anims.push(an); return an;
  }
  var px = function (u) { return (u * BOXW / W).toFixed(1); };
  function start() {
    // the outline is drawn, then the mountain fades in over it
    play(line, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], 0, 1400, EASE);
    play(mountain, [{ opacity: 0 }, { opacity: 1 }], 1050, 550, OUT);
    play(lineL, [{ opacity: 1 }, { opacity: 0 }], 1450, 300);
    // the plant comes up from behind the mountain, turning in from the side, then wiggles: one transform track, so it stays smooth
    var T = function (x, y, r) { return { transform: "translate3d(" + x + "px," + y + "px,0) rotate(" + r + "deg)" }; };
    play(plant, [T(px(18), px(190), 22), Object.assign(T(px(3), px(30), 3), { offset: 0.55 }), Object.assign(T(0, 0, -3), { offset: 0.8 }), T(0, 0, 0)], 1500, 800, OUT);
    play(plant, [T(0, 0, 0), Object.assign(T(0, 0, -7), { offset: 0.2 }), Object.assign(T(0, 0, 5), { offset: 0.45 }), Object.assign(T(0, 0, -2.5), { offset: 0.7 }), Object.assign(T(0, 0, 1), { offset: 0.87 }), T(0, 0, 0)], 2300, 800, "ease-in-out", "forwards");   // "forwards": before it starts, the rise above is in charge
    // the mountain flies to its place, the real mark takes over, the name and the page fade in
    play(box, [{ transform: "translate3d(0px,0px,0) scale(1)" }, { transform: "translate3d(" + dx + "px," + dy + "px,0) scale(" + sc + ")" }], 3150, 800, EASE);
    play(target, [{ visibility: "hidden" }, { visibility: "visible" }], 3950, 1);
    play(lay, [{ opacity: 1 }, { opacity: 0 }], 3950, 250);
    if (wm) play(wm, [{ opacity: 0, transform: "translate3d(0,10px,0)" }, { opacity: 1, transform: "none" }], 3950, 600, OUT);
    if (tiles) play(tiles, [{ opacity: 0, transform: "translate3d(0,12px,0)" }, { opacity: 1, transform: "none" }], 4200, 700, OUT);
    if (bar) play(bar, [{ opacity: 0 }, { opacity: 1 }], 4350, 600, OUT);
    setTimeout(function () { if (!window.__introPaused) finish(); }, END);
  }
  var END = 5000;
  // for checking frame by frame (scratch tests): window.__introSeek(ms)
  window.__introSeek = function (t) { anims.forEach(function (an) { an.pause(); an.currentTime = t; }); };
  // start when the pictures are ready (they are small and cached after the first time), at the latest after a second
  var ready = [plant, back, mountain].map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); });
  var started = false; function go() { if (started || done) return; started = true; start(); }
  Promise.all(ready).then(go); setTimeout(go, 1000);
})();
