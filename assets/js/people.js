/* People: everyone has one colour, the same on every page (brew cards, Recent activity, My brews, Trends, Cupping, Friends),
   and their profile photo where they added one (Settings > You).
   The colour is the one they chose in Settings (DEFAULTS.COLORS), otherwise one from that list by their place among
   the people you can see (sorted ids, so it never changes); guests and people we do not know get one from their name.
     PEOPLE.color(id, name, prefs, ids)   prefs: { id: profile prefs }, ids: the ids of the people you can see
     PEOPLE.avatar(id, name, color)       their photo, or their initial in a circle in that colour (class "av"; the page sizes it)
     PEOPLE.photos(db, { id: photo_path }) tells which people have a photo; the links are made once (in one request) and kept
                                          on this phone for a day, and every avatar already on the page gets its photo */
window.PEOPLE = (function () {
  function color(id, name, prefs, ids) {
    var C = (window.DEFAULTS && DEFAULTS.COLORS) || [["x", "#8A5A3C"]];
    var p = id && prefs && prefs[id], own = p && C.filter(function (c) { return c[0] === p.color; })[0];
    if (own) return own[1];
    var i = id && ids ? ids.slice().sort().indexOf(id) : -1;
    if (i < 0) { i = 0; String(id || name || "").split("").forEach(function (ch) { i = (i * 31 + ch.charCodeAt(0)) >>> 0; }); }
    return C[i % C.length][1];
  }
  // photos: who has which file, and the signed links (kept for a day, minus an hour so they never run out on the page)
  var KEY = "alto.avatars", paths = {}, links = {}, asked = {};   // asked: links already on their way
  try { var c = JSON.parse(localStorage.getItem(KEY) || "{}"); Object.keys(c).forEach(function (p) { if (c[p].e > Date.now()) links[p] = c[p]; }); } catch (e) {}
  try { var w = JSON.parse(localStorage.getItem(KEY + ".who") || "{}"); Object.keys(w).forEach(function (k) { paths[k] = w[k]; }); } catch (e) {}
  function keep() { try { localStorage.setItem(KEY, JSON.stringify(links)); localStorage.setItem(KEY + ".who", JSON.stringify(paths)); } catch (e) {} }
  function urlOf(id) { var p = id && paths[id]; return p && links[p] ? links[p].u : null; }
  function paint(s, u) { s.textContent = ""; s.classList.add("ph"); s.style.backgroundImage = "url(\"" + u + "\")"; s.style.backgroundSize = "cover"; s.style.backgroundPosition = "center"; }
  function avatar(id, name, col) {
    var s = document.createElement("span"); s.className = "av";
    s.textContent = (String(name || "?").trim()[0] || "?").toUpperCase();
    s.style.background = col; s.setAttribute("aria-hidden", "true");
    if (id) { s.dataset.pid = id; var u = urlOf(id); if (u) paint(s, u); }
    return s;
  }
  function photos(db, who) {
    var want = [];
    Object.keys(who || {}).forEach(function (id) {
      var p = who[id] || null;
      if (p) paths[id] = p; else delete paths[id];   // a photo that was removed goes too
      if (p && !links[p] && !asked[p] && want.indexOf(p) < 0) want.push(p);
    });
    keep();
    var done = function () {
      document.querySelectorAll(".av[data-pid]").forEach(function (s) { var u = urlOf(s.dataset.pid); if (u && !s.classList.contains("ph")) paint(s, u); });
    };
    if (!want.length || !db || !db.storage) { done(); return Promise.resolve(); }
    want.forEach(function (p) { asked[p] = 1; });
    return db.storage.from("avatars").createSignedUrls(want, 86400).then(function (r) {
      ((r && r.data) || []).forEach(function (x) { if (x.signedUrl) links[x.path] = { u: x.signedUrl, e: Date.now() + 23 * 3600e3 }; });
      keep(); done();
    }).catch(function () {});
  }
  return { color: color, avatar: avatar, photos: photos };
})();
