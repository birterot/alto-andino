/* The opening animation on the home page, once each time the app is opened:
   the mountain is drawn in the middle of the screen, the little plant comes up from behind it and wiggles,
   then the mountain moves up to its place, the name appears and the rest of the page fades in.
   Tap to skip. Not shown with "reduce motion" switched on (the page then just appears).

   Smoothness: every moving part is its own picture layer, moved only with transform and opacity (the phone's graphics
   chip does that without redrawing), all as Web Animations planned up front. Only the first outline is drawn as a line:
   the mountain's own thick outline (a wide line along its outer edge, cut to the mark), so the mountain only adds its inside. */
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
  // by the graphics chip without being redrawn. Only the first line drawing is vector: one simple outline.
  var NS = "http://www.w3.org/2000/svg", W = 599, BOXW = 200;   // W: the width of the mark's drawing
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
  var theme = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 < 0.5 ? "dark" : "light";
  var dir = (document.querySelector('script[src$="intro.js"]') || {}).src; dir = dir ? dir.replace(/js\/intro\.js.*$/, "brand/intro/") : "assets/brand/intro/";
  function img(name) { var i = new Image(); i.src = dir + name + "-" + theme + ".png"; i.alt = ""; i.className = "il " + name; i.decoding = "async"; return i; }

  lay = document.createElement("div"); lay.id = "introlay"; lay.setAttribute("aria-hidden", "true");
  var box = document.createElement("div"); box.className = "introbox"; lay.appendChild(box);
  var plant = img("plant"), back = img("back"), mountain = img("mountain"), cover = img("back");
  cover.className = "il cover";   // a second backing over the mountain: it shrinks to the middle, so the lines inside appear from the outline inwards
  // the outline: the first contour of the mark (its outer edge), without the plant part
  var outline = fromBottom(art[1].slice(0, art[1].indexOf("Z") + 1));
  var SPROUT = "268,0 393,0 393,103.6 389.2,107.8 385.8,112.4 371,132.8 357.4,151.7 349.2,163.2 337,180.3 334.3,184 324.8,183.5 322.4,180.6 309.2,161.5 298.8,146.7 281.5,121.8 268,102";
  // the drawing starts in the middle of the bottom edge (a straight cut there looks like a pen starting), not in a round corner:
  // the outline's last curve (the bottom edge) is split in two and the path starts between the halves
  function fromBottom(d) {
    try {
      var t = d.match(/[MCLZ]|-?[0-9.]+/g), segs = [], i = 0, st = null, cur = null;
      while (i < t.length) {
        var c = t[i++]; if (c === "Z") break;
        if (c === "M") { st = cur = [+t[i++], +t[i++]]; continue; }
        while (i < t.length && !/[MCLZ]/.test(t[i])) {
          if (c === "C") { var sg = [+t[i++], +t[i++], +t[i++], +t[i++], +t[i++], +t[i++]]; segs.push(sg); cur = sg.slice(4); }
          else { var q = [+t[i++], +t[i++]]; segs.push(cur.concat(q, q)); cur = q; }   // a straight line, as a curve
        }
      }
      var last = segs.pop(), p0 = segs.length ? segs[segs.length - 1].slice(4) : st, m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
      var p1 = last.slice(0, 2), p2 = last.slice(2, 4), p3 = last.slice(4);
      var a = m(p0, p1), b = m(p1, p2), c2 = m(p2, p3), ab = m(a, b), bc = m(b, c2), mid = m(ab, bc);   // de Casteljau at the half
      var f = function (q) { return q[0].toFixed(2) + " " + q[1].toFixed(2); };
      return "M" + f(mid) + "C" + f(bc) + " " + f(c2) + " " + f(p3) + segs.map(function (s) { return "C" + f(s.slice(0, 2)) + " " + f(s.slice(2, 4)) + " " + f(s.slice(4)); }).join("") +
        "C" + f(a) + " " + f(ab) + " " + f(mid) + "Z";
    } catch (e) { return d; }
  }
  var lineL = sv("svg", { viewBox: art[0], class: "il line" }), ld = sv("defs", {}), lc = sv("clipPath", { id: "ia-mt" }), lb = sv("clipPath", { id: "ia-band" });
  lc.appendChild(sv("path", { d: "M-20 -20H620V420H-20Z M" + SPROUT.split(" ").join(" L") + " Z", "clip-rule": "evenodd" }));
  lb.appendChild(sv("path", { d: art[1], "clip-rule": "evenodd" }));   // the mark itself: the wide line shows only where the mark's outline is
  ld.appendChild(lc); ld.appendChild(lb); lineL.appendChild(ld);
  var OUTLINE = 36;   // the mark's outline is about 35 units thick (of 599): the line is twice that, half of it falls outside and is cut away
  var g = sv("g", { "clip-path": "url(#ia-mt)" });
  var line = sv("path", { d: outline, fill: "none", stroke: "currentColor", "stroke-width": 2 * OUTLINE, "stroke-linejoin": "round", "clip-path": "url(#ia-band)" });
  g.appendChild(line); lineL.appendChild(g);
  box.appendChild(plant); box.appendChild(back); box.appendChild(mountain); box.appendChild(cover); box.appendChild(lineL);
  document.body.appendChild(lay);
  lay.addEventListener("click", function () { anims.forEach(function (a) { try { a.finish(); } catch (e) {} }); finish(); });

  var L = 4000; try { L = Math.ceil(line.getTotalLength()); } catch (e) {}
  line.style.strokeDasharray = L + " " + L; line.style.strokeDashoffset = L;
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
    // the outline is drawn; then the lines inside grow in from the outline to the middle: the backing over the mountain shrinks away
    // (only a picture getting smaller, which the graphics chip does by itself). The drawn outline sits on top all along and
    // goes once the mountain, with the same outline, is all there.
    play(line, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], 0, 1400, EASE);
    play(cover, [{ transform: "scale(1)" }, { transform: "scale(0.001)" }], 1350, 550, "cubic-bezier(.4,0,.2,1)");
    play(lineL, [{ opacity: 1 }, { opacity: 0 }], 1900, 60);
    if (!window.__introPaused) setTimeout(function () { lineL.remove(); cover.remove(); }, 2000);   // nothing vector left in the box while it moves and scales
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
  var ready = [plant, back, mountain, cover].map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); });
  var loaded = new Promise(function (r) { if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); });
  var started = false;
  function go() { if (started || done) return; started = true; requestAnimationFrame(function () { requestAnimationFrame(start); }); }
  Promise.all(ready.concat([loaded])).then(go); setTimeout(go, 1500);
})();
