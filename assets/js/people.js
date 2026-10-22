/* People: everyone has one colour, the same on every page (brew cards, Recent activity, My brews, Trends, Cupping).
   It is the colour they chose in Settings (DEFAULTS.COLORS), otherwise one from that list by their place among
   the people you can see (sorted ids, so it never changes); guests and people we do not know get one from their name.
     PEOPLE.color(id, name, prefs, ids)   prefs: { id: profile prefs }, ids: the ids of the people you can see
     PEOPLE.avatar(id, name, color)       their initial in a circle in that colour (class "av"; the page sizes it) */
window.PEOPLE = (function () {
  function color(id, name, prefs, ids) {
    var C = (window.DEFAULTS && DEFAULTS.COLORS) || [["x", "#8A5A3C"]];
    var p = id && prefs && prefs[id], own = p && C.filter(function (c) { return c[0] === p.color; })[0];
    if (own) return own[1];
    var i = id && ids ? ids.slice().sort().indexOf(id) : -1;
    if (i < 0) { i = 0; String(id || name || "").split("").forEach(function (ch) { i = (i * 31 + ch.charCodeAt(0)) >>> 0; }); }
    return C[i % C.length][1];
  }
  function avatar(id, name, col) {
    var s = document.createElement("span"); s.className = "av";
    s.textContent = (String(name || "?").trim()[0] || "?").toUpperCase();
    s.style.background = col; s.setAttribute("aria-hidden", "true"); return s;
  }
  return { color: color, avatar: avatar };
})();
