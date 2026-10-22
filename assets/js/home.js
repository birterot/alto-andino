/* Home: a short "today" above the tiles. It loads nothing from the internet: it uses what the Coffee Shelf remembered
   from your last visit (alto.shelf.v1), so it is there at once and the opening animation stays smooth.
   - a greeting, and how many days in a row there was coffee / brews this month
   - your open bags, each with the cups left, tap to log a brew with it
   - one note at a time (tap for the next): your caffeine today, things to do, news from Friends, a coffee fact of the day */
(function () {
  var box = document.getElementById("today"); if (!box) return;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  // Signed in? The login is kept in the browser (Supabase's "sb-...-auth-token"). Without it, or for another person,
  // Home shows nothing personal, and says right away that you are signed out.
  var session = null;
  try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.+-auth-token$/.test(k)) { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && (v.refresh_token || v.access_token) && v.user) session = v; } } } catch (e) {}
  var shelf = null; try { shelf = JSON.parse(get("alto.shelf.v1") || "null"); } catch (e) {}
  if (shelf && (!Array.isArray(shelf.coffees) || Date.now() - shelf.t > 60 * 864e5)) shelf = null;
  if (!session || (shelf && shelf.u && shelf.u !== session.user.id)) shelf = null;
  var name = session ? get("alto.myname") : null, h = new Date().getHours();

  // greeting
  var hi = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : h < 22 ? "Good evening" : "Good night";
  var top = el("div", "hi"); top.appendChild(el("p", "greet", hi + (name ? ", " + name : "")));

  // only you: days in a row you had coffee, and this month what you brewed and what you drank (= rated)
  var stat = el("p", "stat"); stat.hidden = true; top.appendChild(stat);
  function showStat(my) {
    if (!Array.isArray(my)) return;
    var days = {}, made = 0, drank = 0, now = new Date(), key = function (d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); };
    my.forEach(function (x) {
      var d = new Date(x[0]); if (x[2]) days[key(d)] = 1;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) { made += x[1]; drank += x[2]; }
    });
    var run = 0, d = new Date(now);
    if (!days[key(d)]) d.setDate(d.getDate() - 1);   // no coffee yet today: the streak counts until yesterday
    while (days[key(d)]) { run++; d.setDate(d.getDate() - 1); }
    var bits = [];
    if (run >= 2) bits.push(run + " days in a row with coffee");
    if (made || drank) bits.push("this month you brewed " + made + " and drank " + drank);
    var st = bits.join(" \u00B7 "); stat.textContent = st ? st[0].toUpperCase() + st.slice(1) : ""; stat.hidden = !st;
  }
  if (shelf) showStat(shelf.my);
  box.appendChild(top);

  if (!session) {   // signed out (for example after clearing the browser's data): say so here, not only on the next page
    var so = el("div", "note out");
    so.appendChild(el("div", "nh")).appendChild(el("span", "nk", "Signed out"));
    so.appendChild(el("p", "nt", "Sign in to see your coffees, open bags and brews here."));
    var sa = el("a", "go", "Sign in \u2192"); sa.href = "journal/index.html"; so.appendChild(sa);
    box.appendChild(so);
  }

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

  // one note at a time: your caffeine first (when there was coffee today), then to do, Friends, the fact of the day
  var notes = [], cafNote = null, rateNote = null;
  var tr = session && shelf ? toRate(shelf.tr, shelf.nm) : null;
  if (tr) notes.push(rateNote = tr);
  var caf = session ? caffeine(shelf && shelf.cb) : null;
  if (caf) notes.push(cafNote = caf);
  if (shelf) {
    if (shelf.nob > 0) notes.push({ k: "To do", text: shelf.nob + (shelf.nob === 1 ? " of your brews still needs" : " of your brews still need") + " a Balance rating.", href: "journal/index.html#mine", go: "Rate them" });
    shelf.coffees.forEach(function (c) {
      if (!c.open_date || c.finished_at || c.archived || !c.bag_size_g) return;
      var left = c.bag_size_g - ((shelf.used || {})[c.id] || 0), dose = (shelf.dose || {})[c.id] || 18;
      if (left < dose * 3) notes.push({ k: "Almost empty", text: c.name + " is nearly finished." + (c.buy_url ? " Time to order a new bag?" : ""), href: c.buy_url && /^https?:\/\//.test(c.buy_url) ? c.buy_url : "journal/index.html#c=" + c.id, go: c.buy_url ? "Where to buy" : "Open", ext: !!c.buy_url });
    });
  }
  var fl = null; try { fl = JSON.parse(get("alto.friendline") || "null"); } catch (e) {}
  if (session && fl && fl.text && Date.now() - fl.t < 7 * 864e5) notes.push({ k: "From Friends", text: fl.text, href: "friends/index.html#f=" + fl.id, go: "See more" });
  var F = window.FACTS || [];
  if (F.length) {
    var day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5), f = F[day % F.length];
    notes.push({ k: "Did you know?", text: f[0], href: f[1] ? "chapters/" + f[1] + ".html" : null, go: "Read more" });
  }
  var card = null, i = 0, draw = null;
  if (notes.length) {
    card = el("div", "note");
    draw = function () {
      var n = notes[i]; card.textContent = "";
      var head = el("div", "nh"); head.appendChild(el("span", "nk", n.k));
      if (notes.length > 1) {
        var dots = el("span", "dots"); dots.setAttribute("aria-hidden", "true");
        notes.forEach(function (_, j) { dots.appendChild(el("i", j === i ? "on" : "")); });
        head.appendChild(dots);
      }
      card.appendChild(head); card.appendChild(el("p", "nt", n.text));
      if (n.curve) card.appendChild(n.curve);
      if (n.small) card.appendChild(el("p", "ns", n.small));
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
  // Then, quietly: your brews of the last two months straight from the database, for the line under the greeting and the
  // caffeine (also brews someone else logged and you rated). Supabase's own library renews the login if it ran out.
  if (session) setTimeout(freshen, 900);
  function freshen() {
    var S = window.SUPA; if (!S) return;
    var go = function () {
      if (!window.supabase || !window.supabase.createClient) return;
      var db = window.supabase.createClient(S.url, S.key);
      db.auth.getSession().then(function (r) {
        var ses = r && r.data && r.data.session; if (!ses || ses.user.id !== session.user.id) return;
        var my = ses.user.id, since2 = new Date(Date.now() - 62 * 864e5).toISOString();
        return Promise.all([
          db.from("brews").select("id,coffee_id,brewed_at,device,dose_g,is_dialin,made_by,created_by,coffees(name,is_decaf,variety),brew_ratings(id,rater_id,is_guest,rating,balance,drank_at),brew_scores(rating_id)").gte("brewed_at", since2).order("brewed_at"),
          db.from("profiles").select("id,display_name")
        ]).then(function (res) {
          var q = res[0]; if (q.error || !Array.isArray(q.data)) return;
          var nm = {}; ((res[1] && res[1].data) || []).forEach(function (p) { nm[p.id] = p.display_name; });
          var cut = Date.now() - 36 * 36e5, mine = [], rows = [], pend = [], week = Date.now() - 7 * 864e5;
          q.data.forEach(function (b) {
            // your cup, not rated yet (the last 7 days)
            var me1 = (b.brew_ratings || []).filter(function (x) { return !x.is_guest && x.rater_id === my; })[0];
            if (me1 && me1.rating == null && me1.balance == null && !(b.brew_scores || []).some(function (s) { return s.rating_id === me1.id; }) && Date.parse(b.brewed_at) >= week)
              pend.push({ b: b.id, c: b.coffee_id, r: me1.id, n: (b.coffees || {}).name || "", m: b.made_by || b.created_by || null, t: b.brewed_at, d: b.device || "" });
            var rs = b.brew_ratings || [], made = (b.made_by || b.created_by) === my, drank = rs.some(function (x) { return !x.is_guest && x.rater_id === my; });
            if (made || drank) mine.push([Date.parse(b.brewed_at), made ? 1 : 0, drank ? 1 : 0]);
            if (!(Number(b.dose_g) > 0) || !(Date.parse(b.brewed_at) >= cut || rs.some(function (x) { return x.drank_at && Date.parse(x.drank_at) >= cut; }))) return;
            var c = b.coffees || {}, v = String(c.variety || "").toLowerCase();
            rows.push({ t: b.brewed_at, g: Number(b.dose_g), d: !!b.is_dialin, m: b.made_by || b.created_by || null,
              r: rs.map(function (x) { return x.is_guest ? "g" : x.rater_id; }), rt: rs.map(function (x) { return x.drank_at || null; }),
              k: c.is_decaf ? "decaf" : /robusta/.test(v) ? (/arabica|,/.test(v) ? "blend" : "robusta") : "" });
          });
          try { var sh = JSON.parse(localStorage.getItem("alto.shelf.v1") || "null"); if (sh && sh.u === my) { sh.cb = rows; sh.cbt = Date.now(); sh.my = mine; sh.tr = pend; sh.nm = nm; localStorage.setItem("alto.shelf.v1", JSON.stringify(sh)); } } catch (e) {}
          showStat(mine); showRate(pend, nm); showCaffeine(rows);
        });
      }).catch(function () {});
    };
    if (window.supabase) return go();
    var sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js"; sc.onload = go; document.head.appendChild(sc);
  }
  // a note that comes, changes or goes when the fresh brews arrive (first = it goes to the top)
  function swapNote(old, nu, first) {
    var at = old ? notes.indexOf(old) : -1;
    if (nu && at >= 0) notes[at] = nu; else if (nu) { if (first) notes.unshift(nu); else notes.splice(rateNote && notes[0] === rateNote ? 1 : 0, 0, nu); } else if (at >= 0) notes.splice(at, 1);
    if (!card) return nu;
    i = 0;
    if (notes.length > 1 && !card.hasAttribute("role")) { card.setAttribute("role", "button"); card.tabIndex = 0; card.setAttribute("aria-label", "Next note"); card.addEventListener("click", function () { i = (i + 1) % notes.length; draw(); }); }
    if (notes.length) draw();
    return nu;
  }
  function showRate(list, nm) { rateNote = swapNote(rateNote, toRate(list, nm), true); }
  // your cups still to rate: one = which one (and who made it), several = how many, to My brews
  function toRate(list, nm) {
    if (!Array.isArray(list) || !list.length) return null;
    var my = session.user.id, x = list[list.length - 1], hm = function (iso) { var d = new Date(iso); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
    var by = x.m && x.m !== my ? (nm && nm[x.m]) || "Someone" : null, today = new Date(x.t).toDateString() === new Date().toDateString();
    var when = (today ? "at " : new Date(x.t).toLocaleDateString("en-GB", { weekday: "long" }) + " at ") + hm(x.t);
    var what = (x.n || "a coffee") + (x.d ? " on the " + (/^(Manual|Semi-automatic|Moka|French|Pour|Cold|Filter|Fully)\b/.test(x.d) ? x.d[0].toLowerCase() + x.d.slice(1) : x.d) : "");
    var href = "journal/index.html#c=" + x.c + "&b=" + x.b + "&rate=" + x.r;
    if (list.length === 1) return { k: "To rate", text: (by ? by + " made you a coffee " + when + ": " : "Your coffee from " + when + " is still to rate: ") + what + ".", href: href, go: "Rate your cup" };
    return { k: "To rate", text: list.length + " of your cups are waiting for your rating. The latest: " + what + ", " + when + (by ? ", made by " + by : "") + ".", href: "journal/index.html#torate", go: "Rate them" };
  }
  function showCaffeine(rows) { cafNote = swapNote(cafNote, caffeine(rows), false); }

  // ---------- caffeine: an estimate from the brews you rated ----------
  // About 9 mg of caffeine per gram of arabica coffee ends up in the cup (beans are about 1.2 % caffeine, most of it is
  // extracted); robusta about twice that, decaf almost none. In the body it rises for about 45 minutes and then halves
  // roughly every 5 hours (Bateman curve, absorption 4.5 per hour). A brew counts for everyone it was for (split
  // between them, rated or not yet), at the time they drank it if they said, else at the time of the brew.
  function caffeine(rows) {
    if (!Array.isArray(rows) || !session) return null;
    var my = session.user.id, MG = { decaf: 0.3, robusta: 18, blend: 13 }, KE = Math.LN2 / 5, KA = 4.5, now = Date.now();
    var doses = [];
    rows.forEach(function (b) {
      var k = b.r ? b.r.indexOf(my) : -1; if (!(b.g > 0) || k < 0) return;   // only the cups that were for you; shared with the others it was for
      var t = Date.parse((b.rt && b.rt[k]) || b.t); if (!isFinite(t) || t > now + 60e3) return;   // when you drank it (if you said), else the brew
      doses.push({ t: t, mg: b.g / b.r.length * (MG[b.k] || 9) });
    });
    var level = function (at) { return doses.reduce(function (s, d) { var hh = (at - d.t) / 36e5; return hh <= 0 ? s : s + d.mg * KA / (KA - KE) * (Math.exp(-KE * hh) - Math.exp(-KA * hh)); }, 0); };
    var mid = new Date(); mid.setHours(0, 0, 0, 0);
    var today = doses.filter(function (d) { return d.t >= mid.getTime(); }), total = today.reduce(function (s, d) { return s + d.mg; }, 0);
    var nowL = level(now);
    if (!today.length && nowL < 10) return null;
    var r10 = function (x) { return Math.round(x / 10) * 10; }, hm = function (ms) { var d = new Date(ms); d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
    // when it is under 50 mg (and stays there)
    var last = null; for (var at = now; at < now + 36 * 36e5; at += 5 * 6e4) if (level(at) >= 50) last = at;
    var under = last === null ? "Already under 50 mg." : "Under 50 mg from about " + hm(last + 5 * 6e4) + (new Date(last).getDate() !== new Date(now).getDate() ? " tomorrow." : ".");
    var text = (nowL >= 5 ? "About " + r10(nowL) + " mg in you right now" : "Almost none left") +
      (today.length ? ", from " + (today.length === 1 ? "1 coffee" : today.length + " coffees") + " today (about " + r10(total) + " mg)." : ".") + " " + under;
    if (total > 400) text += " That is more than the 400 mg a day usually given as the limit for healthy adults.";
    return { k: "Caffeine", text: text, curve: curveOf(level, mid.getTime(), now), small: "The curve is the caffeine in you today: solid until now, lighter for how it wears off. Why 50 mg: that is about half an espresso, and below it the caffeine left is unlikely to keep most people awake, so it is a rough guide for when an evening is sleep-friendly (not a medical limit; if you are sensitive, aim lower). An estimate: about 9 mg per gram of coffee, halving about every 5 hours, from the cups that were for you." };
  }
  // today from 6:00 (or the first coffee) until midnight: solid up to now, lighter for what is still to come,
  // the dashed 50 mg line, a mark for now with the amount, and the hours underneath
  function curveOf(level, mid, now) {
    var NS = "http://www.w3.org/2000/svg", mk = function (t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var t0 = mid + 6 * 36e5, t1 = mid + 24 * 36e5; if (now < t0) t0 = mid; if (now > t1 - 36e5) t1 = now + 3 * 36e5;
    var N = 120, pts = [], top = 100; for (var k = 0; k <= N; k++) { var at = t0 + (t1 - t0) * k / N, v = level(at); pts.push([at, v]); if (v > top) top = v; }
    top *= 1.08;
    var W = 300, H = 64, y = function (v) { return (H - 2 - (H - 4) * v / top).toFixed(1); }, x = function (at) { return (W * (at - t0) / (t1 - t0)).toFixed(1); };
    var pct = function (at) { return Math.max(0, Math.min(100, 100 * (at - t0) / (t1 - t0))); };
    var wrap = el("div", "cafc"), plot = el("div", "cplot"), s = mk("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
    var line = function (list) { return list.map(function (p, k) { return (k ? "L" : "M") + x(p[0]) + " " + y(p[1]); }).join(" "); };
    var past = pts.filter(function (p) { return p[0] <= now; }), next = pts.filter(function (p) { return p[0] >= now; });
    if (past.length && past[past.length - 1][0] < now) past.push([now, level(now)]);
    if (next.length && next[0][0] > now) next.unshift([now, level(now)]);
    if (past.length > 1) { s.appendChild(mk("path", { d: line(past) + " L" + x(now) + " " + (H - 2) + " L" + x(t0) + " " + (H - 2) + "Z", class: "ca" })); s.appendChild(mk("path", { d: line(past), class: "cl" })); }
    if (next.length > 1) s.appendChild(mk("path", { d: line(next), class: "cl fut" }));
    s.appendChild(mk("path", { d: "M0 " + y(50) + " H" + W, class: "c50" }));
    s.appendChild(mk("path", { d: "M0 " + (H - 1) + " H" + W, class: "cbase" }));
    if (now >= t0 && now <= t1) s.appendChild(mk("path", { d: "M" + x(now) + " 0 V" + H, class: "cn" }));
    plot.appendChild(s);
    // labels in HTML (the drawing stretches to the width, text must not)
    var l50 = el("span", "l50", "50 mg"); l50.style.bottom = (100 * 50 / top) + "%"; plot.appendChild(l50);
    if (now >= t0 && now <= t1) { var ln = el("span", "lnow", "now " + Math.round(level(now) / 10) * 10 + " mg"), q = pct(now); ln.style.left = q + "%"; if (q > 75) ln.classList.add("r"); else if (q < 25) ln.classList.add("l"); plot.appendChild(ln); }
    wrap.appendChild(plot);
    var ax = el("div", "cax");
    for (var hh = Math.ceil((t0 - mid) / 36e5 / 6) * 6; mid + hh * 36e5 <= t1; hh += 6) { var tk = el("span", "", (hh % 24) + ":00"); if (hh === 24) tk.textContent = "24:00"; tk.style.left = pct(mid + hh * 36e5) + "%"; ax.appendChild(tk); }
    wrap.appendChild(ax);
    return wrap;
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
