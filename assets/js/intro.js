/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears).

   Smoothness: every moving part is its own picture layer, moved only with transform and opacity (the phone's graphics
   chip does that without redrawing), all as Web Animations planned up front. The outline is a picture as well (the mountain's
   own thick outline), uncovered round by a turning wedge: nothing is drawn as a line while it plays, so it stays sharp. */
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
  var W = 599, BOXW = 200;   // W: the width of the mark's drawing
  var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
  var theme = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 < 0.5 ? "dark" : "light";
  var dir = (document.querySelector('script[src$="intro.js"]') || {}).src; dir = dir ? dir.replace(/js\/intro\.js.*$/, "brand/intro/") : "assets/brand/intro/";
  function img(name) { var i = new Image(); i.src = dir + name + "-" + theme + ".png"; i.alt = ""; i.className = "il " + name; i.decoding = "async"; return i; }

  lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var box = document.createElement("div"); box.className = "introbox"; lay.appendChild(box);
  var plant = img("plant"), back = img("back"), mountain = img("mountain"), cover = img("back");
  cover.className = "il cover";   // a second backing over the mountain: it shrinks to the middle, so the lines inside appear from the outline inwards
  // the outline: a ready-made picture too (the mountain's thick outline only), uncovered by a turning wedge, as if drawn round
  var line = img("outline"); line.classList.add("line");
  box.appendChild(plant); box.appendChild(back); box.appendChild(mountain); box.appendChild(cover); box.appendChild(line);
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
  cover.style.transformOrigin = "50% 70%";
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
    play(mountain, [{ opacity: 0.001 }, { opacity: 1 }], 1340, 1);   // only once the outline is round (the backing's edge would show a faint line before)
    play(cover, [{ transform: "scale(1)" }, { transform: "scale(0.001)" }], 1350, 950, "cubic-bezier(.4,0,.25,1)");
    play(line, [{ opacity: 1 }, { opacity: 0 }], 2300, 60);
    if (!window.__introPaused) setTimeout(function () { line.remove(); cover.remove(); }, 2400);   // only the mountain and the plant left while it moves and scales
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
  var ready = [plant, back, mountain, cover, line].map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); });
  var loaded = new Promise(function (r) { if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); });
  var started = false;
  function go() { if (started || done) return; started = true; requestAnimationFrame(function () { requestAnimationFrame(start); }); }
  Promise.all(ready.concat([loaded])).then(go); setTimeout(go, 1500);
})();
