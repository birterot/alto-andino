/* Star ratings with half stars, drawn as small icons (a half star is a star filled on its left half).
     Stars.row(3.5)        -> an element with five stars, the fourth half filled (for averages it rounds to the nearest half)
     Stars.fill(button, f) -> sets one star button to 0, 0.5 or 1
     Stars.text(3.5)       -> "3.5 stars" style text for tooltips and tables: "3.5★"
   Colours come from CSS: the filled part uses currentColor, the empty part var(--line). */
window.Stars = (function () {
  var NS = "http://www.w3.org/2000/svg";
  var PATH = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z";
  function svg(cls) {
    var s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", cls);
    var p = document.createElementNS(NS, "path"); p.setAttribute("d", PATH); s.appendChild(p); return s;
  }
  function star(f) {
    var w = document.createElement("span"); w.className = "star";
    w.appendChild(svg("off"));
    var on = document.createElement("span"); on.className = "on"; on.style.width = (f * 100) + "%"; on.appendChild(svg("full"));
    w.appendChild(on); return w;
  }
  function half(v) { return Math.round(v * 2) / 2; }
  function row(v, label) {
    var r = document.createElement("span"), h = half(v || 0);
    r.className = "stars-row"; r.setAttribute("role", "img"); r.setAttribute("aria-label", label || (text(v) + " of 5"));
    for (var i = 1; i <= 5; i++) r.appendChild(star(h >= i ? 1 : h >= i - 0.5 ? 0.5 : 0));
    return r;
  }
  function fill(btn, f) {
    var s = btn.querySelector(".star"); if (!s) { s = star(0); btn.textContent = ""; btn.appendChild(s); }
    s.querySelector(".on").style.width = (f * 100) + "%";
  }
  function text(v) { return v === null || v === undefined ? "" : String(half(v)).replace(".0", "") + "★"; }
  // shared styles, so every page draws the same stars
  var css = document.createElement("style");
  css.textContent = ".stars-row{display:inline-flex;gap:2px;vertical-align:middle;color:var(--accent,#8A6A4A)}" +
    ".star{position:relative;display:inline-block;width:1em;height:1em;flex:none}" +
    ".star svg{position:absolute;left:0;top:0;width:1em;height:1em}" +
    ".star .off{fill:var(--line,#ddd)}" +
    ".star .on{position:absolute;left:0;top:0;height:100%;overflow:hidden}" +
    ".star .full{fill:currentColor}";
  document.head.appendChild(css);
  return { row: row, fill: fill, text: text, half: half };
})();
