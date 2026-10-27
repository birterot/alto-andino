/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears).

   Smoothness: every moving part is its own picture layer, moved only with transform and opacity (the phone's graphics
   chip does that without redrawing), all as Web Animations planned up front. The outline is a picture as well (the mountain's
   own thick outline), uncovered round by a turning wedge, so it stays sharp. Then the lines inside are drawn out of the outline
   (thin, simple lines) and the mountain picture takes their place. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("intro")) return;
  var art = window.altoMarkArt, target = document.querySelector(".hero .mark");
  var hero = document.querySelector(".hero"), wm = hero && hero.querySelector("[data-wordmark]");
  var tiles = document.querySelector(".tiles"), bar = document.querySelector(".topnav"), more = document.querySelector("nav.small");
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
  // by the graphics chip without being redrawn.
  var NS = "http://www.w3.org/2000/svg", W = 599, BOXW = 200;   // W: the width of the mark's drawing
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  // the lines inside the mountain, as the middle of each line (traced from the mark): each starts where it meets the outline
  var INNER = ["M367.3 184.9L412.9 241.4L414.9 243.4L419.1 244.9L424.9 243.4L426.6 242.1L462.1 206.9","M149.5 359.3L233.1 260.9L238.1 255.6L243.4 253.6","M142.7 197.2L189.9 248.9","M120.7 230.7L163.6 277.1L164.6 278.4L164.9 280.6","M334.5 359.3L251.4 258.4L248.6 255.6L243.6 253.6","M179.8 141.2L204.1 170.4L208.1 174.4L213.4 176.4","M195.2 358.6L213.1 339.1L236.6 311.9L238.4 310.1L243.4 308.4","M97.3 359.3L138.4 309.9L139.6 307.9L140.9 302.6L138.4 295.6L103.4 257.4","M456.2 359.3L434.9 333.4L375.9 255.4L371.6 253.9L365.1 256.1L331.6 286.4L329.9 291.4L331.4 298.6L340.1 310.9L345.6 312.4L351.1 310.6L369.4 294.1L372.1 293.6","M504.3 359.8L470.9 314.6L469.6 312.6L468.4 307.6L469.6 301.4L471.1 299.4L501.6 266.4","M483.8 240.2L447.1 279.4","M275.1 159.9L217.9 219.1L211.6 221.4","M287.8 360.1L273.1 340.4L249.6 311.4L248.4 310.1L243.9 308.4","M162.3 167.9L177.6 186.6L204.6 217.1L206.6 219.1L211.6 221.4","M256.8 134.2L218.9 174.6L213.6 176.4"];
  var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
  var theme = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 < 0.5 ? "dark" : "light";
  var dir = (document.querySelector('script[src$="intro.js"]') || {}).src; dir = dir ? dir.replace(/js\/intro\.js.*$/, "brand/intro/") : "assets/brand/intro/";
  function img(name) { var i = new Image(); i.src = dir + name + "-" + theme + ".png"; i.alt = ""; i.className = "il " + name; i.decoding = "async"; return i; }

  lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var box = document.createElement("div"); box.className = "introbox"; lay.appendChild(box);
  var plant = img("plant"), back = img("back"), mountain = img("mountain");
  // the lines inside: drawn one by one out of the outline (thin lines, nothing cut out, so cheap to draw);
  // the mountain picture then takes their place, looking the same
  var inner = sv("svg", { viewBox: "0 0 599 397", class: "il inner" }), strokes = INNER.map(function (d) {
    var p = sv("path", { d: d, fill: "none", stroke: "currentColor", "stroke-width": 14.5, "stroke-linecap": "square", "stroke-linejoin": "miter" }); inner.appendChild(p); return p;
  });
  // the outline: a ready-made picture too (the mountain's thick outline only), uncovered by a turning wedge, as if drawn round
  var line = img("outline"); line.classList.add("line");
  box.appendChild(plant); box.appendChild(back); box.appendChild(mountain); box.appendChild(inner); box.appendChild(line);
  document.body.appendChild(lay);
  lay.addEventListener("click", function () { anims.forEach(function (a) { try { a.finish(); } catch (e) {} }); finish(); });

  // the wedge: from the middle of the mountain, starting straight down (the middle of the bottom edge), turning clockwise.
  // One clip shape per step of 10 degrees, all with the same number of corners, so the browser slides smoothly between them.
  function wedge(deg) {
    var cx = 50, cy = 64, R = 160, n = 18, pts = [cx + "% " + cy + "%"];
    for (var k = 0; k <= n; k++) { var an = (90 + deg * k / n) * Math.PI / 180; pts.push((cx + R * Math.cos(an)).toFixed(2) + "% " + (cy + R * Math.sin(an)).toFixed(2) + "%"); }
    return "polygon(" + pts.join(",") + ")";
  }
  var SWEEP = []; for (var d = 0; d <= 36; d++) SWEEP.push({ clipPath: wedge(d * 10), webkitClipPath: wedge(d * 10) });
  line.style.clipPath = line.style.webkitClipPath = wedge(0);
  var lens = strokes.map(function (p) { var l = 300; try { l = Math.ceil(p.getTotalLength()) + 8; } catch (e) {} p.style.strokeDasharray = l + " " + l; p.style.strokeDashoffset = l; return l; });
  mountain.style.opacity = 0.001;
  plant.style.transform = "translate3d(" + (18 * BOXW / W).toFixed(1) + "px," + (190 * BOXW / W).toFixed(1) + "px,0) rotate(22deg)";

  // the move to where the real mark sits on the page (measured from the box's own place in the middle, untransformed)
  function moveFrames() {
    var a = lay.getBoundingClientRect(), b = target.getBoundingClientRect(), w = BOXW;
    var cx = a.left + a.width / 2, cy = a.top + a.height / 2;   // the box is centred in the overlay
    var dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy, sc = b.width / w;
    return [{ transform: "translate3d(0px,0px,0) scale(1)" }, { transform: "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) scale(" + sc.toFixed(4) + ")" }];
  }
  var EASE = "cubic-bezier(.45,0,.55,1)", OUT = "cubic-bezier(.22,1,.36,1)";
  function play(el, frames, delay, dur, easing, fill) {
    var an = el.animate(frames, { delay: delay, duration: dur, easing: easing || "linear", fill: fill || "both" });
    anims.push(an); return an;
  }
  var px = function (u) { return (u * BOXW / W).toFixed(1); };
  function start() {
    // the outline is drawn round; then the lines inside grow in from the outline to the middle: the backing over the mountain
    // shrinks away (only a picture getting smaller, which the graphics chip does by itself). The outline picture sits on top
    // all along and goes once the mountain, with the same outline, is all there.
    play(line, SWEEP, 0, 1400, EASE);
    // the lines inside, all at the same pace from the outline inwards: the longest takes a second, the short ones are done earlier
    var most = Math.max.apply(null, lens);
    strokes.forEach(function (p, i) { play(p, [{ strokeDashoffset: lens[i] }, { strokeDashoffset: 0 }], 1350, Math.max(250, 1000 * lens[i] / most), "cubic-bezier(.3,0,.3,1)"); });
    play(mountain, [{ opacity: 0.001 }, { opacity: 1 }], 2380, 1);
    play(inner, [{ opacity: 1 }, { opacity: 0 }], 2380, 1);
    play(line, [{ opacity: 1 }, { opacity: 0 }], 2380, 1);
    if (!window.__introPaused) setTimeout(function () { line.remove(); inner.remove(); }, 2450);   // only the mountain and the plant left while it moves and scales
    // the plant: up from behind the mountain, turning in from the side, then a little wiggle. One animation on one property,
    // so the graphics chip can run it on its own without the page in between.
    var T = function (x, y, r, at, ease) { var k = { transform: "translate3d(" + x + "px," + y + "px,0) rotate(" + r + "deg)" }; if (at !== undefined) k.offset = at; if (ease) k.easing = ease; return k; };
    play(plant, [T(px(18), px(190), 22, 0, OUT), T(px(3), px(30), 3, 0.27, OUT), T(0, 0, -3, 0.4, "ease-in-out"), T(0, 0, 0, 0.5, "ease-in-out"),
      T(0, 0, -7, 0.6, "ease-in-out"), T(0, 0, 5, 0.72, "ease-in-out"), T(0, 0, -2.5, 0.85, "ease-in-out"), T(0, 0, 1, 0.93, "ease-in-out"), T(0, 0, 0, 1)], 1500, 1600);
    // the mountain flies to its place. Measured right when it starts: on the phone the page can still shift a little
    // after it opens (status bar, safe area), and the mountain should land exactly where the real one sits.
    var fly = function () { play(box, moveFrames(), window.__introPaused ? 3150 : 0, 800, EASE); };
    if (window.__introPaused) fly(); else setTimeout(function () { if (!done) fly(); }, 3150);
    play(target, [{ visibility: "hidden" }, { visibility: "visible" }], 3950, 1);
    play(lay, [{ opacity: 1 }, { opacity: 0 }], 3950, 250);
    if (wm) play(wm, [{ opacity: 0.001, transform: "translate3d(0,10px,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }], 3950, 600, OUT);
    if (tiles) play(tiles, [{ opacity: 0.001, transform: "translate3d(0,12px,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }], 4200, 700, OUT);
    var today = document.getElementById("today");
    if (today) play(today, [{ opacity: 0.001, transform: "translate3d(0,10px,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }], 4100, 700, OUT);
    if (more) play(more, [{ opacity: 0.001 }, { opacity: 1 }], 4400, 600, OUT);
    if (bar) play(bar, [{ opacity: 0.001 }, { opacity: 1 }], 4350, 600, OUT);
    setTimeout(function () { if (!window.__introPaused) finish(); }, END);
  }
  var END = 5000;
  // start when the page has finished loading and the pictures are ready, then wait two frames so the first frame of the
  // animation is not also the frame that sets everything up (at the latest after a second and a half)
  var ready = [plant, back, mountain, line].map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); });
  var loaded = new Promise(function (r) { if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); });
  var started = false;
  function go() { if (started || done) return; started = true; requestAnimationFrame(function () { requestAnimationFrame(start); }); }
  Promise.all(ready.concat([loaded])).then(go); setTimeout(go, 1500);
})();
