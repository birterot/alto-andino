/* Home: a short "today" above the tiles. It loads nothing from the internet: it uses what the Coffee Shelf remembered
   from your last visit (alto.shelf.v1), so it is there at once and the opening animation stays smooth.
   - a greeting, and how many days in a row there was coffee / brews this month
   - your open bags, each with the cups left, tap to log a brew with it
   - one note at a time (tap for the next): things to do, news from Friends, a coffee fact of the day */
(function () {
  var box = document.getElementById("today"); if (!box) return;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var shelf = null; try { shelf = JSON.parse(get("alto.shelf.v1") || "null"); } catch (e) {}
  if (shelf && (!Array.isArray(shelf.coffees) || Date.now() - shelf.t > 60 * 864e5)) shelf = null;
  var name = get("alto.myname"), h = new Date().getHours();

  // greeting
  var hi = h < 5 ? "Good night" : h < 11 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Good night";
  var top = el("div", "hi"); top.appendChild(el("p", "greet", hi + (name ? ", " + name : "")));

  // days in a row and this month, from the times of your household's brews
  if (shelf && shelf.rates) {
    var days = {}, month = 0, now = new Date(), key = function (d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); };
    Object.keys(shelf.rates).forEach(function (id) { (shelf.rates[id] || []).forEach(function (x) {
      if (!x.t) return; var d = new Date(x.t); days[key(d)] = 1;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) month++;
    }); });
    var run = 0, d = new Date(now);
    if (!days[key(d)]) d.setDate(d.getDate() - 1);   // no coffee yet today: the streak counts until yesterday
    while (days[key(d)]) { run++; d.setDate(d.getDate() - 1); }
    var bits = [];
    if (run >= 2) bits.push(run + " days in a row with coffee");
    if (month) bits.push(month + (month === 1 ? " brew" : " brews") + " this month");
    if (bits.length) top.appendChild(el("p", "stat", bits.join(" · ")));
  }
  box.appendChild(top);

  // open bags, with the cups left
  if (shelf) {
    var open = shelf.coffees.filter(function (c) { return c.open_date && !c.finished_at && !c.archived; });
    var seen = {}; open = open.filter(function (c) { var k = c.group_id || c.id; if (seen[k]) return false; seen[k] = 1; return true; });
    // the emptiest first (fewest cups left); bags without a size at the end
    var cupsLeft = function (c) { return c.bag_size_g ? (c.bag_size_g - ((shelf.used || {})[c.id] || 0)) / ((shelf.dose || {})[c.id] || 18) : Infinity; };
    open.sort(function (x, y) { return cupsLeft(x) - cupsLeft(y); });
    if (open.length) {
      var strip = el("div", "bags"); strip.setAttribute("aria-label", "Your open bags");
      open.slice(0, 8).forEach(function (c) {
        var a = el("a", "bagc"); a.href = "journal/index.html#c=" + c.id + "&new";
        a.setAttribute("aria-label", "Log a brew with " + c.name);
        var used = (shelf.used || {})[c.id] || 0, dose = (shelf.dose || {})[c.id] || 18;
        var frac = c.bag_size_g ? Math.max(0, Math.min(1, (c.bag_size_g - used) / c.bag_size_g)) : null;
        a.appendChild(bagIcon(frac));
        var t = el("span", "bt"); t.appendChild(el("strong", "", c.name));
        if (frac !== null) { var left = Math.max(0, c.bag_size_g - used), n = Math.floor(left / dose); t.appendChild(el("small", "", n >= 1 ? "about " + n + (n === 1 ? " cup" : " cups") + " left" : "almost empty")); }
        else if (c.roaster) t.appendChild(el("small", "", c.roaster));
        a.appendChild(t); strip.appendChild(a);
      });
      box.appendChild(strip);
    }
  }

  // one note at a time: to do first, then Friends, then the fact of the day
  var notes = [];
  if (shelf) {
    if (shelf.nob > 0) notes.push({ k: "To do", text: shelf.nob + (shelf.nob === 1 ? " of your brews still needs" : " of your brews still need") + " a Balance rating.", href: "journal/index.html#mine", go: "Rate them" });
    shelf.coffees.forEach(function (c) {
      if (!c.open_date || c.finished_at || c.archived || !c.bag_size_g) return;
      var left = c.bag_size_g - ((shelf.used || {})[c.id] || 0), dose = (shelf.dose || {})[c.id] || 18;
      if (left < dose * 3) notes.push({ k: "Almost empty", text: c.name + " is nearly finished." + (c.buy_url ? " Time to order a new bag?" : ""), href: c.buy_url && /^https?:\/\//.test(c.buy_url) ? c.buy_url : "journal/index.html#c=" + c.id, go: c.buy_url ? "Where to buy" : "Open", ext: !!c.buy_url });
    });
  }
  var fl = null; try { fl = JSON.parse(get("alto.friendline") || "null"); } catch (e) {}
  if (fl && fl.text && Date.now() - fl.t < 7 * 864e5) notes.push({ k: "From Friends", text: fl.text, href: "friends/index.html#f=" + fl.id, go: "See more" });
  var F = window.FACTS || [];
  if (F.length) {
    var day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5), f = F[day % F.length];
    notes.push({ k: "Did you know?", text: f[0], href: f[1] ? "chapters/" + f[1] + ".html" : null, go: "Read more" });
  }
  if (notes.length) {
    var card = el("div", "note"), i = 0;
    var draw = function () {
      var n = notes[i]; card.textContent = "";
      var head = el("div", "nh"); head.appendChild(el("span", "nk", n.k));
      if (notes.length > 1) {
        var dots = el("span", "dots"); dots.setAttribute("aria-hidden", "true");
        notes.forEach(function (_, j) { dots.appendChild(el("i", j === i ? "on" : "")); });
        head.appendChild(dots);
      }
      card.appendChild(head); card.appendChild(el("p", "nt", n.text));
      if (n.href) { var a = el("a", "go", n.go + " →"); a.href = n.href; if (n.ext) { a.target = "_blank"; a.rel = "noopener"; } a.addEventListener("click", function (e) { e.stopPropagation(); }); card.appendChild(a); }
    };
    if (notes.length > 1) {
      card.setAttribute("role", "button"); card.tabIndex = 0; card.setAttribute("aria-label", "Next note");
      var next = function () { i = (i + 1) % notes.length; draw(); };
      card.addEventListener("click", next);
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
    }
    draw(); box.appendChild(card);
  }

  // the little bag from the Coffee Shelf, filled as far as there is coffee left
  function bagIcon(frac) {
    var NS = "http://www.w3.org/2000/svg", mk = function (t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var s = mk("svg", { viewBox: "0 0 40 52", width: 30, height: 39, "aria-hidden": "true" });
    var BODY = "M7.5 14h25l2.3 31.5a3 3 0 01-3 3.2H8.2a3 3 0 01-3-3.2z", id = "hb" + Math.random().toString(36).slice(2, 8);
    var cp = mk("clipPath", { id: id }); cp.appendChild(mk("path", { d: BODY })); var df = mk("defs", {}); df.appendChild(cp); s.appendChild(df);
    if (frac !== null) { var g = mk("g", { "clip-path": "url(#" + id + ")" }); g.appendChild(mk("rect", { x: 0, y: 14 + 35 * (1 - frac), width: 40, height: 35 * frac, class: "bf" })); s.appendChild(g); }
    s.appendChild(mk("path", { d: BODY, class: "bo" })); s.appendChild(mk("path", { d: "M6.5 7.5h27v6.5h-27z", class: "bo" }));
    s.appendChild(mk("path", { d: "M10 10.75h20", class: "bo thin" })); s.appendChild(mk("circle", { cx: 20, cy: 22.5, r: 2.4, class: "bo thin" }));
    return s;
  }
})();
