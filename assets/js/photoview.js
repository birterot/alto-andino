/* A photo, full screen: PhotoView.open(url, alt).
   Pinch to zoom (or double-tap), drag to look around when zoomed in, tap next to the photo or "Close" to go back.
   Used for bag photos on the Coffee Shelf and screenshots on the Feedback page. */
window.PhotoView = (function () {
  var lay, img, hint, closeBtn, sc = 1, tx = 0, ty = 0, pts = new Map(), st = null, moved = false, lastTap = 0, back = null;
  function css() {
    var s = document.createElement("style");
    s.textContent = ".pv{position:fixed;inset:0;z-index:200;background:rgba(10,7,5,.94);display:grid;place-items:center;touch-action:none;overscroll-behavior:contain;opacity:0;transition:opacity .18s ease}" +
      ".pv.on{opacity:1}.pv[hidden]{display:none}" +
      ".pv img{max-width:100vw;max-height:100vh;max-height:100dvh;object-fit:contain;transform-origin:50% 50%;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;will-change:transform}" +
      ".pv .x{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:14px;min-width:44px;height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.45);background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:15px;cursor:pointer}" +
      ".pv .h{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);text-align:center;color:rgba(255,255,255,.7);font-size:13px;pointer-events:none;transition:opacity .4s}";
    document.head.appendChild(s);
  }
  function build() {
    css();
    lay = document.createElement("div"); lay.className = "pv"; lay.hidden = true; lay.setAttribute("data-noptr", "");   // no pull-to-refresh while looking at a photo
    lay.setAttribute("role", "dialog"); lay.setAttribute("aria-modal", "true"); lay.setAttribute("aria-label", "Photo");
    img = document.createElement("img"); img.alt = ""; img.draggable = false;
    closeBtn = document.createElement("button"); closeBtn.type = "button"; closeBtn.className = "x"; closeBtn.textContent = "Close";
    hint = document.createElement("p"); hint.className = "h"; hint.textContent = "Pinch or double-tap to zoom";
    lay.append(img, closeBtn, hint); document.body.appendChild(lay);
    closeBtn.addEventListener("click", function (e) { e.stopPropagation(); close(); });
    lay.addEventListener("pointerdown", down); lay.addEventListener("pointermove", move);
    lay.addEventListener("pointerup", up); lay.addEventListener("pointercancel", up);
    document.addEventListener("keydown", function (e) { if (!lay.hidden && e.key === "Escape") close(); });
    lay.addEventListener("wheel", function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, sc * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  }
  function apply(anim) {
    img.style.transition = anim ? "transform .25s ease" : "none";
    img.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + sc + ")";
  }
  function clamp() {
    var w = img.offsetWidth * sc, h = img.offsetHeight * sc, mx = Math.max(0, (w - innerWidth) / 2), my = Math.max(0, (h - innerHeight) / 2);
    tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
  }
  // zoom so that the point under the finger stays under the finger
  function zoomAt(x, y, s, anim) {
    s = Math.max(1, Math.min(5, s));
    var px = x - innerWidth / 2, py = y - innerHeight / 2, qx = (px - tx) / sc, qy = (py - ty) / sc;
    sc = s; tx = px - s * qx; ty = py - s * qy; if (sc === 1) { tx = 0; ty = 0; }
    clamp(); apply(anim);
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function down(e) {
    if (e.target === closeBtn) return;
    try { lay.setPointerCapture(e.pointerId); } catch (x) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var p = Array.from(pts.values());
    if (p.length === 1) { st = { x: p[0].x, y: p[0].y, tx: tx, ty: ty }; moved = false; }
    else if (p.length === 2) { var mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2; st = { d: dist(p[0], p[1]), sc: sc, qx: (mx - innerWidth / 2 - tx) / sc, qy: (my - innerHeight / 2 - ty) / sc }; moved = true; }
    hint.style.opacity = "0";
  }
  function move(e) {
    if (!pts.has(e.pointerId) || !st) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var p = Array.from(pts.values());
    if (p.length >= 2 && st.d) {
      var s = Math.max(1, Math.min(5, st.sc * dist(p[0], p[1]) / st.d)), mx = (p[0].x + p[1].x) / 2 - innerWidth / 2, my = (p[0].y + p[1].y) / 2 - innerHeight / 2;
      sc = s; tx = mx - s * st.qx; ty = my - s * st.qy; clamp(); apply(false);
    } else if (p.length === 1 && st.x !== undefined) {
      var dx = p[0].x - st.x, dy = p[0].y - st.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      if (sc > 1) { tx = st.tx + dx; ty = st.ty + dy; clamp(); apply(false); }
    }
  }
  function up(e) {
    var was = pts.get(e.pointerId); pts.delete(e.pointerId);
    if (pts.size === 1) { var q = Array.from(pts.values())[0]; st = { x: q.x, y: q.y, tx: tx, ty: ty }; return; }   // one finger left after a pinch
    if (pts.size) return;
    if (!moved && was) {
      var now = Date.now();
      if (now - lastTap < 320) { lastTap = 0; zoomAt(was.x, was.y, sc > 1.05 ? 1 : 2.5, true); return; }
      lastTap = now;
      var onImg = e.target === img;
      if (!onImg && sc <= 1.05) setTimeout(function () { if (lastTap === now) close(); }, 330);   // a single tap next to the photo closes it
    }
    if (sc < 1.05) { sc = 1; tx = 0; ty = 0; apply(true); }
    st = null;
  }
  function open(url, alt) {
    if (!lay) build();
    back = document.activeElement;
    sc = 1; tx = 0; ty = 0; pts.clear(); apply(false);
    img.src = url; img.alt = alt || "";
    hint.style.opacity = "1";
    lay.hidden = false; document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { lay.classList.add("on"); });
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (!lay || lay.hidden) return;
    lay.classList.remove("on"); document.documentElement.style.overflow = "";
    setTimeout(function () { lay.hidden = true; img.removeAttribute("src"); }, 180);
    if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (x) {}
  }
  return { open: open };
})();
