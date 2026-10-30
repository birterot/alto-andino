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
  try { for (var j = 0; j < localStorage.length; j++) { var k = localStorage.key(j); if (/^sb-.+-auth-token$/.test(k)) { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && (v.refresh_token || v.access_token) && v.user) session = v; } } } catch (e) {}
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

  // the month in review: big, right under the greeting (from what the last visit remembered, so it is there at once),
  // and the first time in each review a card over the whole screen. Fresh numbers replace it when they arrive.
  var mslot = el("div", "mslot"); box.appendChild(mslot);
  var monthShown = null;
  (function () {
    var per = monthPeriod(); if (!session || !per) return;
    var c = null; try { c = JSON.parse(get("alto.month.v1") || "null"); } catch (e) {}
    if (c && c.u === session.user.id && c.key === per.key && c.d) showMonth(c.d);
  })();

  // a short tour, once per phone (Settings can show it again): the five things that matter, each with a way there
  var TOUR = [
    ["Add a coffee", "Put your bag on the Coffee Shelf: name, roaster, a photo, the bag size and the roast date. Home then shows how many cups are left.", "journal/index.html#addcoffee", "Add a coffee"],
    ["Log a brew", "At the machine: pick the coffee and device, note grind, dose and time. Under \u201CFor\u201D, choose who drinks it.", "journal/index.html#log", "Log a brew"],
    ["Rate the cup", "Later, on your own phone: stars, taste, body and Balance. Cups waiting for you show up here on Home as \u201CTo rate\u201D.", "journal/index.html#torate", "My cups to rate"],
    ["Notifications", "Turn them on in Settings (in the app opened from the Home Screen), and you hear when someone made you a coffee.", "settings/index.html#pushset", "Turn them on"],
    ["Trends and Friends", "Trends shows your sweet spot, freshness and the brewing chart. With Friends you compare fun stats with other households.", "trends/index.html", "See Trends"]
  ];
  var tourOff = false; try { tourOff = !!localStorage.getItem("alto.tour.done"); } catch (e) { tourOff = true; }
  if (session && !tourOff) {
    var tc = el("div", "tour"), ti = 0; tc.setAttribute("role", "region"); tc.setAttribute("aria-label", "A quick tour");
    var done = function () { try { localStorage.setItem("alto.tour.done", "1"); } catch (e) {} tc.remove(); };
    var tdraw = function () {
      var s = TOUR[ti]; tc.textContent = "";
      var hd = el("div", "nh"); hd.appendChild(el("span", "nk", "Quick tour \u00B7 " + (ti + 1) + " of " + TOUR.length));
      var sk = el("button", "tskip", "Skip"); sk.type = "button"; sk.onclick = done; hd.appendChild(sk);
      tc.append(hd, el("p", "tt", s[0]), el("p", "nt", s[1]));
      var row = el("div", "trow"), go = el("a", "go", s[3] + " \u2192"); go.href = s[2];
      go.addEventListener("click", function () { if (ti === TOUR.length - 1) done(); else { try { sessionStorage.setItem("alto.tour.at", String(ti + 1)); } catch (e) {} } });
      row.appendChild(go);
      var nav = el("span", "tnav");
      if (ti > 0) { var bk = el("button", "", "Back"); bk.type = "button"; bk.onclick = function () { ti--; tdraw(); }; nav.appendChild(bk); }
      var nx = el("button", "next", ti === TOUR.length - 1 ? "Done" : "Next"); nx.type = "button"; nx.onclick = function () { if (ti === TOUR.length - 1) done(); else { ti++; tdraw(); } };
      nav.appendChild(nx); row.appendChild(nav); tc.appendChild(row);
    };
    try { var at = +sessionStorage.getItem("alto.tour.at"); if (at > 0 && at < TOUR.length) ti = at; } catch (e) {}   // back from "Show me": the next step
    tdraw(); box.appendChild(tc);
  }

  if (!session) {   // signed out (for example after clearing the browser's data): say so here, not only on the next page
    var so = el("div", "note out");
    so.appendChild(el("div", "nh")).appendChild(el("span", "nk", "Signed out"));
    so.appendChild(el("p", "nt", "Sign in to see your coffees, open bags and brews here."));
    var sa = el("a", "go", "Sign in \u2192"); sa.href = "journal/index.html"; so.appendChild(sa);
    box.appendChild(so);
  }

  // the tiles you chose in Settings > Home (all of them unless you took some away)
  function applyTiles() {
    var hide = [], order = []; try { hide = JSON.parse(localStorage.getItem("alto.homehide") || "[]") || []; order = JSON.parse(localStorage.getItem("alto.homeorder") || "[]") || []; } catch (e) {}
    // your order (Settings > Home); shortcuts not in it keep their place at the end
    var tl0 = document.querySelector(".tiles"), ts = Array.prototype.slice.call(document.querySelectorAll(".tiles .tile[data-k]"));
    if (tl0 && order.length) ts.slice().sort(function (a, b) { var i = order.indexOf(a.dataset.k), j = order.indexOf(b.dataset.k); return (i < 0 ? 99 + ts.indexOf(a) : i) - (j < 0 ? 99 + ts.indexOf(b) : j); }).forEach(function (t) { tl0.appendChild(t); });
    document.querySelectorAll(".tiles .tile[data-k]").forEach(function (t) { t.hidden = hide.indexOf(t.dataset.k) >= 0; });
    var tl = document.querySelector(".tiles"); if (tl) tl.hidden = !tl.querySelector(".tile[data-k]:not([hidden])");
  }
  applyTiles();

  // the big "Log a brew" comes right after the greeting: it is what Home is for
  var main = document.querySelector(".tiles .tile.main");
  if (main) box.appendChild(main);

  // open bags, with the cups left (drawn again when the fresh numbers arrive)
  var strip = el("div", "bags"); strip.setAttribute("aria-label", "Your open bags"); strip.hidden = true; box.appendChild(strip);
  function drawBags(sh) {
    strip.textContent = ""; strip.hidden = true;
    if (!sh || !Array.isArray(sh.coffees)) return;
    var open = sh.coffees.filter(function (c) { return c.open_date && !c.finished_at && !c.archived; });
    var seen = {}; open = open.filter(function (c) { var k = c.group_id || c.id; if (seen[k]) return false; seen[k] = 1; return true; });
    // the emptiest first (fewest cups left); bags without a size at the end
    var cupsLeft = function (c) { return c.bag_size_g ? (c.bag_size_g - ((sh.used || {})[c.id] || 0)) / ((sh.dose || {})[c.id] || 18) : Infinity; };
    open.sort(function (x, y) { return cupsLeft(x) - cupsLeft(y); });
    if (!open.length) return;
    open.slice(0, 8).forEach(function (c) {
      var a = el("a", "bagc"); a.href = "journal/index.html#c=" + c.id + "&new";
      a.setAttribute("aria-label", "Log a brew with " + c.name);
      var used = (sh.used || {})[c.id] || 0, dose = (sh.dose || {})[c.id] || 18;
      var frac = c.bag_size_g ? Math.max(0, Math.min(1, (c.bag_size_g - used) / c.bag_size_g)) : null;
      a.appendChild(bagIcon(frac));
      var t = el("span", "bt"); t.appendChild(el("strong", "", c.name));
      if (frac !== null) { var left = Math.max(0, c.bag_size_g - used), n = Math.floor(left / dose); t.appendChild(el("small", "", n >= 1 ? "about " + n + (n === 1 ? " cup" : " cups") + " left" : "almost empty")); }
      else if (c.roaster) t.appendChild(el("small", "", c.roaster));
      a.appendChild(t); strip.appendChild(a);
    });
    strip.hidden = false;
  }
  if (shelf) drawBags(shelf);

  // the sleep check (Settings > Sleep check, off unless you turned it on): in the morning, one tap for last night
  var ask = el("div", "ask"); ask.hidden = true; box.appendChild(ask);
  var sleepLogs = shelf && Array.isArray(shelf.sl) ? shelf.sl : null;

  // one note at a time: your caffeine first (when there was coffee today), then to do, Friends, the fact of the day
  var notes = [], cafNote = null, rateNote = null, tipNote = null, todoNote = null, trendNote = null;
  function todoOf(n) { return n > 0 ? { k: "To do", text: n + (n === 1 ? " of your brews still needs" : " of your brews still need") + " a Balance rating.", href: "journal/index.html#nobal", go: "Rate them", tap: true } : null; }
  // the order on Home: what is open to rate (a cup, then a Balance to give), the caffeine, the sleep tip, then the rest (friends, a bag running low, a fact)
  var PR = { rate: 0, todo: 1, caf: 2, tip: 3, trend: 4 };
  var tr = session && shelf ? toRate(shelf.tr, shelf.nm) : null;
  if (tr) { tr.pr = PR.rate; notes.push(rateNote = tr); }
  var caf = session ? caffeine(shelf && shelf.cb) : null;
  if (shelf && shelf.nob > 0) { todoNote = todoOf(shelf.nob); todoNote.pr = PR.todo; notes.push(todoNote); }
  if (caf) { caf.pr = PR.caf; notes.push(cafNote = caf); }
  var tip0 = session && cafPref().sleep === "on" && shelf && shelf.stip ? tipToNote(shelf.stip) : null;
  if (tip0) { tip0.pr = PR.tip; notes.push(tipNote = tip0); }
  if (shelf) {
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
  var card = null, i = 0, draw = null, infoOpen = false;
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
      if (n.small) {   // the explanation stays folded behind a small (i), so the note stays short
        var ib = el("button", "info", "i"); ib.type = "button"; ib.setAttribute("aria-label", "How to read this"); ib.setAttribute("aria-expanded", String(!!infoOpen));
        var ip = el("p", "ns", n.small); ip.hidden = !infoOpen;
        if (n.more) { ip.appendChild(document.createTextNode(" ")); var ml = el("a", "", "Your caffeine settings, and how it is worked out \u2192"); ml.href = n.more; ml.addEventListener("click", function (e) { e.stopPropagation(); }); ip.appendChild(ml); }
        ib.addEventListener("click", function (e) { e.stopPropagation(); infoOpen = !infoOpen; ip.hidden = !infoOpen; ib.setAttribute("aria-expanded", String(infoOpen)); });
        head.insertBefore(ib, head.children[1] || null); card.appendChild(ip);
      }
      if (n.href) { var a = el("a", "go", n.go + " →"); a.href = n.href; if (n.ext) { a.target = "_blank"; a.rel = "noopener"; } a.addEventListener("click", function (e) { e.stopPropagation(); }); card.appendChild(a); }
    };
    wireCard(); draw(); box.appendChild(card);
  }
  drawAsk();
  // Then, quietly: your brews of the last two months straight from the database, for the line under the greeting and the
  // caffeine (also brews someone else logged and you rated). Supabase's own library renews the login if it ran out.
  if (session && window.CAFFEINE) setTimeout(freshen, 900);
  var dbP = null;   // Supabase's library, loaded once when Home needs it (after the opening animation)
  function getDb() {
    if (dbP) return dbP;
    dbP = new Promise(function (ok, no) {
      var S = window.SUPA; if (!S) return no(new Error("no config"));
      var make = function () { if (window.supabase && window.supabase.createClient) ok(window.supabase.createClient(S.url, S.key)); else no(new Error("no library")); };
      if (window.supabase) return make();
      var sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js"; sc.onload = make; sc.onerror = function () { no(new Error("offline")); }; document.head.appendChild(sc);
    });
    return dbP;
  }
  function freshen() {
    getDb().then(function (db) {
      return db.auth.getSession().then(function (r) {
        var ses = r && r.data && r.data.session; if (!ses || ses.user.id !== session.user.id) return;
        var my = ses.user.id, since2 = new Date(Date.now() - 62 * 864e5).toISOString();
        return Promise.all([
          db.from("brews").select("id,coffee_id,brewed_at,device,dose_g,yield_g,water_g,is_dialin,made_by,created_by,coffees(name,is_decaf,variety,roast_level),brew_ratings(id,rater_id,is_guest,rating,balance,drank_at),brew_scores(rating_id)").gte("brewed_at", since2).order("brewed_at"),
          db.from("profiles").select("id,display_name,prefs"),
          (function () {   // the coffees, fresh (a bag opened on its own page, or by someone else, shows at once), then all brews of the open bags (for the cups left)
            var hid = (shelf && shelf.hh) || get("alto.household");
            var cs = hid ? db.from("coffees").select("*").eq("household_id", hid).order("created_at", { ascending: false }) : Promise.resolve({ data: null });
            return cs.then(function (r) {
              var list = r && !r.error && Array.isArray(r.data) ? r.data : null;
              // every bag not finished: one with a brew counts as open, even if nobody marked it (it opened on the day of its first brew)
              var cl = list || (shelf && shelf.coffees) || [];
              var ids = cl.filter(function (c) { return !c.finished_at && !c.archived; }).map(function (c) { return c.id; });
              var bq = ids.length ? db.from("brews").select("coffee_id,dose_g,brewed_at").in("coffee_id", ids).order("brewed_at") : Promise.resolve({ data: [] });
              return bq.then(function (b) {
                var first = {}; ((b && b.data) || []).forEach(function (x) { if (!first[x.coffee_id]) first[x.coffee_id] = x.brewed_at; });
                if (list) list.forEach(function (c) { if (!c.open_date && !c.finished_at && first[c.id]) c.open_date = String(first[c.id]).slice(0, 10); });
                return { data: b && b.data, error: b && b.error, coffees: list };
              });
            });
          })(),
          db.from("sleep_logs").select("night,quality").gte("night", since2.slice(0, 10)),   // the sleep check (supabase/31_sleep.sql; before that: an error, left out)
          db.rpc("my_guest_cups"),   // cups friends made you at their place (supabase/33_friend_guests.sql; before that: an error, left out)
          // your rated brews without a Balance (the To do note), counted fresh; brews!inner leaves out cups at friends' (you cannot see their brews)
          db.from("brew_ratings").select("id,brews!inner(id)", { count: "exact", head: true }).eq("rater_id", my).eq("is_guest", false).is("balance", null).not("rating", "is", null),
          // what is trending among your friends (supabase/34_friends_more.sql; before that: an error, left out)
          get("alto.household") ? db.rpc("friend_trending", { p_household: get("alto.household") }) : Promise.resolve({ data: [] })
        ]).then(function (res) {
          var q = res[0]; if (q.error || !Array.isArray(q.data)) return;
          var nm = {}; ((res[1] && res[1].data) || []).forEach(function (p) { nm[p.id] = p.display_name; if (p.id === my && p.prefs) savePref(p.prefs); });
          var cut = Date.now() - 36 * 36e5, mine = [], rows = [], pend = [], week = Date.now() - 7 * 864e5, all = [];
          q.data.forEach(function (b) {
            // your cup, not rated yet (the last 7 days)
            var me1 = (b.brew_ratings || []).filter(function (x) { return !x.is_guest && x.rater_id === my; })[0];
            if (me1 && me1.rating == null && me1.balance == null && !(b.brew_scores || []).some(function (s) { return s.rating_id === me1.id; }) && Date.parse(b.brewed_at) >= week)
              pend.push({ b: b.id, c: b.coffee_id, r: me1.id, n: (b.coffees || {}).name || "", m: b.made_by || b.created_by || null, t: b.brewed_at, d: b.device || "" });
            var rs = b.brew_ratings || [], made = (b.made_by || b.created_by) === my, drank = rs.some(function (x) { return !x.is_guest && x.rater_id === my; });
            if (made || drank) mine.push([Date.parse(b.brewed_at), made ? 1 : 0, drank ? 1 : 0]);
            if (CAFFEINE.recent(b, cut)) rows.push(CAFFEINE.row(b, b.coffees || {}));
            if (Number(b.dose_g) > 0 && rs.some(function (x) { return !x.is_guest && x.rater_id === my; })) all.push(CAFFEINE.row(b, b.coffees || {}));   // your cups, for the sleep tip
          });
          // cups at friends': to rate (on the Friends page), in your caffeine and in what you drank
          var gc = res[4] && !res[4].error && Array.isArray(res[4].data) ? res[4].data : [];
          gc.forEach(function (x) {
            var t = Date.parse(x.brewed_at), open = x.rating == null && x.balance == null && !Object.keys(x.scores || {}).length;
            if (open && t >= week) pend.push({ b: x.brew_id, r: x.rating_id, n: x.coffee_name || "", by: x.maker, t: x.brewed_at, d: x.device || "", g: 1 });
            mine.push([t, 0, 1]);
            var r = { t: x.brewed_at, g: Number(x.dose_g) || 0, y: x.yield_g == null ? null : Number(x.yield_g), w: x.water_g == null ? null : Number(x.water_g), dv: x.device || "",
              rl: x.roast_level || "", k: CAFFEINE.species({ is_decaf: x.is_decaf, variety: x.variety }), m: null, r: [my], rt: [x.drank_at || null] };
            for (var j = 1; j < (x.cups || 1); j++) { r.r.push("o"); r.rt.push(null); }   // shared with the others it was for
            if (r.g > 0 && (t >= cut || (x.drank_at && Date.parse(x.drank_at) >= cut))) rows.push(r);
            if (r.g > 0) all.push(r);
          });
          if (gc.length) { var byT = function (a, b) { return Date.parse(a.t) - Date.parse(b.t); }; pend.sort(byT); rows.sort(byT); all.sort(byT); mine.sort(function (a, b) { return a[0] - b[0]; }); }
          var nob = res[5] && !res[5].error && typeof res[5].count === "number" ? res[5].count : null;
          var logs = res[3] && !res[3].error && Array.isArray(res[3].data) ? res[3].data.map(function (x) { return { n: x.night, q: x.quality }; }) : null;
          var used = null; if (res[2] && Array.isArray(res[2].data)) { used = {}; res[2].data.forEach(function (x) { used[x.coffee_id] = (used[x.coffee_id] || 0) + (Number(x.dose_g) || 0); }); }
          var tip = logs ? sleepTip(logs, all) : null;
          var sh = null; try { sh = JSON.parse(localStorage.getItem("alto.shelf.v1") || "null"); if (sh && sh.u === my) { sh.cb = rows; sh.cbt = Date.now(); sh.my = mine; sh.tr = pend; sh.nm = nm; if (nob != null) sh.nob = nob; if (used) sh.used = Object.assign({}, sh.used || {}, used); if (res[2] && res[2].coffees) sh.coffees = res[2].coffees; if (logs) { sh.sl = logs; sh.stip = tip; } localStorage.setItem("alto.shelf.v1", JSON.stringify(sh)); } else sh = null; } catch (e) { sh = null; }
          if (sh) drawBags(sh);
          showStat(mine); showRate(pend, nm); showCaffeine(rows);
          var md = monthReview(q.data, gc, my);
          try { if (md) localStorage.setItem("alto.month.v1", JSON.stringify({ u: my, key: md.key, d: md })); else localStorage.removeItem("alto.month.v1"); } catch (e) {}
          showMonth(md);
          if (nob != null) todoNote = swapNote(todoNote, todoOf(nob), PR.todo);
          var tr = res[6] && !res[6].error && Array.isArray(res[6].data) ? res[6].data[0] : null;
          trendNote = swapNote(trendNote, tr ? { k: "From your friends", text: "Trending among your friends: " + tr.name + (tr.roaster ? " from " + tr.roaster : "") + ", " + (Math.round(tr.stars * 10) / 10).toFixed(1) + "\u2605 at " + tr.household_name + ".", href: "friends/index.html#f=" + tr.household + "&c=" + tr.id, go: "Their recipe" } : null, PR.trend);
          if (logs) { sleepLogs = logs; drawAsk(); showTip(tip); }
        });
      });
    }).catch(function () {});
  }
  // The note card: tap it, or swipe left and right, for the next or the previous note (wired once; it checks how many there are)
  function wireCard() {
    if (!card || card.dataset.wired) return; card.dataset.wired = "1";
    var go = function (d) { if (notes.length < 2) return; i = (i + d + notes.length) % notes.length; draw(); card.classList.remove("sl", "sr"); void card.offsetWidth; card.classList.add(d > 0 ? "sl" : "sr"); };
    var sx = null, sy = 0, swiped = false;
    card.addEventListener("touchstart", function (e) { if (e.touches.length !== 1) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiped = false; }, { passive: true });
    card.addEventListener("touchend", function (e) {
      if (sx === null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; go(dx < 0 ? 1 : -1); }
    }, { passive: true });
    // a tap: a "to do" note (to rate, a Balance missing) takes you there; any other note shows the next one (swiping works for all)
    card.addEventListener("click", function (e) { if (swiped) { swiped = false; return; } if (e.target.closest("a,button")) return; var n = notes[i]; if (n && n.tap && n.href) { location.href = n.href; return; } go(1); });
    card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } });
    card.tabIndex = 0; card.setAttribute("aria-label", "Notes: tap or swipe for the next one");
  }
  // a note that comes, changes or goes when the fresh brews arrive; a new one goes to its place in the order (PR)
  function swapNote(old, nu, pr) {
    var at = old ? notes.indexOf(old) : -1;
    if (nu) nu.pr = pr;
    if (nu && at >= 0) notes[at] = nu;
    else if (nu) { var j = notes.findIndex(function (n) { return (n.pr == null ? 9 : n.pr) > pr; }); notes.splice(j < 0 ? notes.length : j, 0, nu); }
    else if (at >= 0) notes.splice(at, 1);
    if (!card) return nu;
    i = 0;
    if (notes.length) draw();
    return nu;
  }
  // The month in review: on the last two days of a month ("so far") and the first week of the next.
  function monthPeriod() {
    var now = new Date(), d = now.getDate(), last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), m0, sofar;
    if (d >= last - 1) { m0 = new Date(now.getFullYear(), now.getMonth(), 1); sofar = true; }
    else if (d <= 7) { m0 = new Date(now.getFullYear(), now.getMonth() - 1, 1); sofar = false; }
    else return null;
    return { m0: m0, m1: new Date(m0.getFullYear(), m0.getMonth() + 1, 1), sofar: sofar, mon: m0.toLocaleDateString("en-GB", { month: "long" }),
      key: m0.getFullYear() + "-" + (m0.getMonth() + 1) + (sofar ? "-sofar" : "") };
  }
  // Your cups (brews that were for you, here or at friends'), the brews you made, your stars, your favourite and your best cup.
  function monthReview(brews, guest, my) {
    var per = monthPeriod(); if (!per) return null;
    var inM = function (t) { var x = Date.parse(t); return x >= per.m0.getTime() && x < per.m1.getTime(); };
    var cups = [], made = 0, grams = 0, dev = {};
    brews.forEach(function (b) {
      if (!inM(b.brewed_at)) return;
      if ((b.made_by || b.created_by) === my) { made++; grams += Number(b.dose_g) || 0; if (b.device) dev[b.device] = (dev[b.device] || 0) + 1; }
      var r = (b.brew_ratings || []).filter(function (x) { return !x.is_guest && x.rater_id === my; })[0];
      if (r) cups.push({ n: (b.coffees || {}).name || "a coffee", s: r.rating == null ? null : Number(r.rating), t: b.brewed_at });
    });
    (guest || []).forEach(function (x) { if (inM(x.brewed_at)) cups.push({ n: x.coffee_name || "a coffee", s: x.rating == null ? null : Number(x.rating), t: x.brewed_at }); });
    if (!cups.length && !made) return null;
    var st = cups.filter(function (c) { return c.s != null; }), avg = st.length ? st.reduce(function (a, c) { return a + c.s; }, 0) / st.length : null;
    var by = {}; st.forEach(function (c) { (by[c.n] = by[c.n] || []).push(c.s); });
    var fav = Object.keys(by).filter(function (k) { return by[k].length >= 2; }).map(function (k) { var v = by[k]; return [k, v.reduce(function (a, x) { return a + x; }, 0) / v.length, v.length]; })
      .sort(function (a, b) { return b[1] - a[1] || b[2] - a[2]; })[0] || null;
    var best = st.slice().sort(function (a, b) { return b.s - a.s || Date.parse(b.t) - Date.parse(a.t); })[0];
    var topDev = Object.keys(dev).sort(function (a, b) { return dev[b] - dev[a]; })[0];
    return { key: per.key, mon: per.mon, sofar: per.sofar, cups: cups.length, made: made, avg: avg, fav: fav,
      best: best && best.s >= 4 && (!fav || best.n !== fav[0] || best.s > fav[1]) ? { n: best.n, s: best.s, t: best.t } : null,
      dev: topDev && made >= 3 ? [topDev, dev[topDev]] : null, grams: Math.round(grams) };
  }
  // the review as a card: at the top of Home, or big over the whole screen (once per review)
  function monthCard(d, big) {
    var c = el("section", "mrev" + (big ? " big" : "")); c.setAttribute("aria-label", "Your " + d.mon);
    var hd = el("div", "mh"); hd.appendChild(el("span", "mk", d.sofar ? "Your month so far" : "Your month in review"));
    c.appendChild(hd);
    c.appendChild(el("p", "mt", d.mon));
    var nums = el("div", "mnums"), num = function (v, k) { var x = el("div"); x.append(el("b", "", v), el("small", "", k)); nums.appendChild(x); };
    num(String(d.cups), d.cups === 1 ? "cup" : "cups");
    num(String(d.made), d.made === 1 ? "brew made" : "brews made");
    if (d.avg != null) num((Math.round(d.avg * 10) / 10).toFixed(1) + "★", "on average");
    c.appendChild(nums);
    var ul = el("ul", "mlist"), li = function (e, t) { var x = el("li"); x.append(lineIco(e, "me"), el("span", "", t)); ul.appendChild(x); };
    var f1 = function (v) { return (Math.round(v * 10) / 10).toFixed(1) + "★"; };
    if (d.fav) li("trophy", "Favourite: " + d.fav[0] + ", " + f1(d.fav[1]) + " over " + d.fav[2] + " cups");
    if (d.best) { var bd = new Date(d.best.t); li("star", "Best cup: " + d.best.n + ", " + String(d.best.s).replace(/\.0$/, "") + "★ on " + bd.toLocaleDateString("en-GB", { weekday: "long" }) + " " + bd.getDate() + "."); }
    if (d.dev) li("device", "Most used: " + d.dev[0] + " (" + d.dev[1] + " of " + d.made + ")");
    if (d.grams >= 30) li("bean", "About " + d.grams + " g of beans" + (d.grams >= 200 ? ", " + (Math.round(d.grams / 250 * 10) / 10) + " bags of 250 g" : ""));
    if (ul.children.length) c.appendChild(ul);
    var row = el("div", "mrow"), go = el("a", "mgo", "See your brews →"); go.href = "journal/index.html#mine"; row.appendChild(go);
    c.appendChild(row);
    return c;
  }
  function showMonth(d) {
    mslot.textContent = ""; monthShown = d;
    if (!d) return;
    mslot.appendChild(monthCard(d, false));
    var seen = get("alto.month.seen");
    if (seen !== d.key) whenOpen(function () { if (monthShown && monthShown.key === d.key && get("alto.month.seen") !== d.key) popMonth(monthShown); });
  }
  // after the opening animation (it takes the "intro" class away from the page when it is done)
  function whenOpen(cb) {
    var root = document.documentElement;
    if (!root.classList.contains("intro")) { setTimeout(cb, 250); return; }
    var mo = new MutationObserver(function () { if (!root.classList.contains("intro")) { mo.disconnect(); setTimeout(cb, 650); } });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  }
  function popMonth(d) {
    if (document.querySelector(".mpop")) return;
    try { localStorage.setItem("alto.month.seen", d.key); } catch (e) {}
    var ov = el("div", "mpop"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    var c = monthCard(d, true), ok = el("button", "mok", "Nice!"); ok.type = "button";
    c.querySelector(".mrow").appendChild(ok);
    var close = function () { ov.classList.add("out"); setTimeout(function () { ov.remove(); }, 220); document.removeEventListener("keydown", esc); };
    var esc = function (e) { if (e.key === "Escape") close(); };
    ok.onclick = close; ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", esc);
    ov.appendChild(c); document.body.appendChild(ov); ok.focus({ preventScroll: true });
  }
  function showRate(list, nm) { rateNote = swapNote(rateNote, toRate(list, nm), PR.rate); }
  // your cups still to rate: one = which one (and who made it), several = how many, to My brews
  function toRate(list, nm) {
    if (!Array.isArray(list) || !list.length) return null;
    var my = session.user.id, x = list[list.length - 1], hm = function (iso) { var d = new Date(iso); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
    var by = x.by || (x.m && x.m !== my ? (nm && nm[x.m]) || "Someone" : null), today = new Date(x.t).toDateString() === new Date().toDateString();
    var when = (today ? "at " : new Date(x.t).toLocaleDateString("en-GB", { weekday: "long" }) + " at ") + hm(x.t);
    var what = (x.n || "a coffee") + (x.d ? " on the " + (/^(Manual|Semi-automatic|Moka|French|Pour|Cold|Filter|Fully)\b/.test(x.d) ? x.d[0].toLowerCase() + x.d.slice(1) : x.d) : "");
    var href = x.g ? "friends/index.html#rate=" + x.r : "journal/index.html#c=" + x.c + "&b=" + x.b + "&rate=" + x.r;   // g: a cup at a friend's
    if (list.length === 1) return { k: "To rate", text: (by ? by + " made you a coffee " + when + ": " : "Your coffee from " + when + " is still to rate: ") + what + ".", href: href, go: "Rate your cup" , tap: true};
    var allG = list.every(function (y) { return y.g; });
    return { k: "To rate", text: list.length + " of your cups are waiting for your rating. The latest: " + what + ", " + when + (by ? ", made by " + by : "") + ".", href: allG ? "friends/index.html" : x.g ? href : "journal/index.html#torate", go: allG ? "Rate them" : x.g ? "Rate this one" : "Rate them", tap: true };
  }
  function showCaffeine(rows) { cafNote = swapNote(cafNote, caffeine(rows), PR.caf); }

  // ---------- sleep check: how did you sleep, and what your coffee may have to do with it ----------
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function lastNight() { var d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); }
  function drawAsk() {   // mornings (4:00 to 14:00), until you answered for last night
    ask.textContent = ""; ask.hidden = true;
    var h = new Date().getHours();
    if (!session || cafPref().sleep !== "on" || !sleepLogs || h < 4 || h >= 14 || sleepLogs.some(function (x) { return x.n === lastNight(); })) return;
    var hd = el("div", "nh"); hd.appendChild(el("span", "nk", "Sleep check")); ask.appendChild(hd);
    ask.appendChild(el("p", "nt", "How did you sleep last night?"));
    var row = el("div", "faces");
    [[1, "M8 16.5c1.1-1.2 2.4-1.8 4-1.8s2.9.6 4 1.8", "Badly"], [2, "M8.5 15.5h7", "Okay"], [3, "M8 14.5c1.1 1.5 2.4 2.2 4 2.2s2.9-.7 4-2.2", "Well"]].forEach(function (f) {
      var b = el("button", "face"); b.type = "button"; b.setAttribute("aria-label", f[2]);
      b.append(lineIco("M12 3a9 9 0 100 18 9 9 0 000-18z M9 9.5v.5 M15 9.5v.5 " + f[1], "fe"), el("span", "fl", f[2]));
      b.onclick = function () { saveSleep(f[0]); };
      row.appendChild(b);
    });
    ask.appendChild(row); ask.hidden = false;
  }
  function saveSleep(q) {
    var night = lastNight();
    ask.textContent = ""; ask.appendChild(el("p", "nt", "Saving..."));
    getDb().then(function (db) {
      return db.from("sleep_logs").upsert({ user_id: session.user.id, night: night, quality: q }, { onConflict: "user_id,night" }).then(function (r) {
        if (r.error) throw r.error;
        sleepLogs = (sleepLogs || []).filter(function (x) { return x.n !== night; }).concat([{ n: night, q: q }]);
        try { var sh = JSON.parse(localStorage.getItem("alto.shelf.v1") || "null"); if (sh) { sh.sl = sleepLogs; localStorage.setItem("alto.shelf.v1", JSON.stringify(sh)); } } catch (e) {}
        ask.textContent = ""; ask.appendChild(el("p", "nt", q === 3 ? "Good to hear. Saved." : q === 2 ? "Saved." : "Sorry to hear. Saved."));
        setTimeout(function () { ask.hidden = true; }, 2500);
      });
    }).catch(function (e) { ask.textContent = ""; ask.appendChild(el("p", "nt", "Could not save: " + (e && e.message ? e.message : "no connection") + ".")); setTimeout(drawAsk, 3000); });
  }
  // Compares the nights you slept well with those you slept badly: when was your last coffee, how much was left at bedtime.
  // Needs a few of each; until then it says how far along it is.
  function sleepTip(logs, rows) {
    if (!logs.length) return null;
    var my = session.user.id, pref = cafPref(), bm = /^(\d\d):(\d\d)$/.exec(pref.bed || "") || [0, "23", "00"];
    var doses = [];
    rows.forEach(function (b) { var k = b.r.indexOf(my); if (k < 0) return; var t = Date.parse((b.rt && b.rt[k]) || b.t); if (isFinite(t)) doses.push({ t: t, mg: CAFFEINE.mg(b).mg / b.r.length }); });
    var nights = logs.map(function (x) {
      var p = x.n.split("-").map(Number), bed = new Date(p[0], p[1] - 1, p[2], +bm[1], +bm[2]).getTime(); if (+bm[1] < 12) bed += 864e5;   // a bedtime after midnight
      var day0 = new Date(p[0], p[1] - 1, p[2], 4).getTime(), cups = doses.filter(function (d) { return d.t >= day0 && d.t < bed; });
      var last = cups.length ? Math.max.apply(null, cups.map(function (d) { return d.t; })) : null;
      return { q: x.q, last: last === null ? null : (last - new Date(p[0], p[1] - 1, p[2]).getTime()) / 36e5, atBed: CAFFEINE.level(doses, bed) };
    });
    var good = nights.filter(function (n) { return n.q === 3; }), bad = nights.filter(function (n) { return n.q === 1; });
    if (good.length < 2 || bad.length < 2) return { k: "wait", n: logs.length };
    var avg = function (a, f) { var v = a.map(function (n) { return n[f]; }).filter(function (x) { return x !== null; }); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; };
    var gl = avg(good, "last"), bl = avg(bad, "last"), gb = avg(good, "atBed"), bb = avg(bad, "atBed");
    if (gl !== null && bl !== null && bl - gl >= 1) return { k: "time", good: gl, bad: bl, cut: Math.floor((gl + 0.5) * 2) / 2, n: logs.length };
    if (bb - gb >= 20) return { k: "mg", good: gb, bad: bb, n: logs.length };
    return { k: "none", n: logs.length };
  }
  function tipToNote(t) {
    if (!t) return null;
    var hm = function (h) { var m = Math.round(h * 60) % 1440; return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }, r10 = function (x) { return Math.round(x / 10) * 10; };
    var text = t.k === "wait" ? "Sleep check: " + t.n + (t.n === 1 ? " night" : " nights") + " so far. After a few good and a few bad ones, Home shows what your coffee may have to do with it."
      : t.k === "time" ? "On nights you slept well, your last coffee was around " + hm(t.good) + "; before bad nights around " + hm(t.bad) + ". Maybe try no coffee after " + hm(t.cut) + "."
      : t.k === "mg" ? "Before bad nights you still had about " + r10(t.bad) + " mg in you at bedtime, before good ones about " + r10(t.good) + " mg. A lower sleep line (Settings) may help."
      : "From " + t.n + " nights so far, your sleep does not seem to depend on your coffee: good and bad nights had about the same.";
    return { k: "Sleep", text: text, href: t.k === "mg" ? "settings/index.html#cafset" : null, go: "Sleep line" };
  }
  function showTip(t) { tipNote = swapNote(tipNote, cafPref().sleep === "on" ? tipToNote(t) : null, PR.tip); }

  // ---------- caffeine: the note and its curve (the numbers come from assets/js/caffeine.js) ----------
  // A brew counts for everyone it was for (split between them, rated or not yet), at the time they drank it if they said,
  // else at the time of the brew. Settings > Caffeine (kept on this phone too, so Home has it at once):
  // "high" counts the upper end of the range, "midnight" starts every day at zero, "line" is your sleep line (5 to 400 mg, 50 unless you changed it).
  function cafPref() { try { return JSON.parse(localStorage.getItem("alto.cafpref") || "{}") || {}; } catch (e) { return {}; } }
  function savePref(p) { try { localStorage.setItem("alto.homehide", JSON.stringify(Array.isArray(p.home_hide) ? p.home_hide : [])); localStorage.setItem("alto.homeorder", JSON.stringify(Array.isArray(p.home_order) ? p.home_order : [])); applyTiles(); } catch (e) {} try { localStorage.setItem("alto.cafpref", JSON.stringify({ mode: p.caf_mode || "", day: p.caf_day || "", line: p.caf_line != null ? p.caf_line : null, bed: p.caf_bed || "", show: p.caf_show || "", sleep: p.sleep === "on" && p.sleep_consent ? "on" : "" })); } catch (e) {} }   // the sleep check only with your consent
  function caffeine(rows) {
    if (!Array.isArray(rows) || !session || !window.CAFFEINE || cafPref().show === "off") return null;   // turned off in Settings
    var my = session.user.id, now = Date.now(), pref = cafPref(), high = pref.mode === "high";
    var line = pref.line != null && pref.line !== "" && Number(pref.line) >= 0 && Number(pref.line) <= 400 ? Math.round(Number(pref.line)) : 50;   // your sleep line (Settings: 25, 50, 100 or your own)
    var eff = Math.max(line, 1);   // 0 mg is never quite reached: under 1 mg counts as none left
    var bed = null, bm = /^(\d\d):(\d\d)$/.exec(pref.bed || "");   // your usual bedtime, the next one from now
    if (bm) { var bd = new Date(); bd.setHours(+bm[1], +bm[2], 0, 0); if (bd.getTime() <= now) bd.setDate(bd.getDate() + 1); bed = bd.getTime(); }
    var mid = new Date(); mid.setHours(0, 0, 0, 0);
    var doses = [];
    rows.forEach(function (b) {
      var k = b.r ? b.r.indexOf(my) : -1; if (!(b.g > 0) || k < 0) return;   // only the cups that were for you; shared with the others it was for
      var t = Date.parse((b.rt && b.rt[k]) || b.t); if (!isFinite(t) || t > now + 60e3) return;   // when you drank it (if you said), else the brew
      if (pref.day === "midnight" && t < mid.getTime()) return;   // a fresh start every day
      var c = CAFFEINE.mg(b), n = b.r.length;
      doses.push({ t: t, mg: (high ? c.hi : c.mg) / n, lo: c.lo / n, hi: c.hi / n });
    });
    var level = function (at) { return CAFFEINE.level(doses, at); };
    var today = doses.filter(function (d) { return d.t >= mid.getTime(); }), total = today.reduce(function (s, d) { return s + d.mg; }, 0);
    var nowL = level(now), span = doses.reduce(function (s, d) { return s + d.mg; }, 0), ratio = function (f) { return span ? doses.reduce(function (s, d) { return s + d[f]; }, 0) / span : 1; };
    var lo = nowL * ratio("lo"), hi = nowL * ratio("hi");
    if (!today.length && nowL < 10 && !bed) return null;
    // a cup like your usual one (the middle of your last five), for "last coffee by"
    var cups = doses.slice(-5).map(function (d) { return d.mg; }).sort(function (a, b) { return a - b; }), usual = cups.length ? cups[Math.floor(cups.length / 2)] : 160;
    var r10 = function (x) { return Math.round(x / 10) * 10; }, hm = function (ms) { var d = new Date(ms); d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
    // when it is under your sleep line (and stays there)
    var last = null; for (var at = now; at < now + 36 * 36e5; at += 5 * 6e4) if (level(at) >= eff) last = at;
    var lineTxt = line === 0 ? "none left" : "under " + line + " mg", day = function (ms) { return new Date(ms).toDateString() !== new Date(now).toDateString() ? " tomorrow" : ""; };
    var under = last === null ? (line === 0 ? "Practically none left." : "Already under " + line + " mg.") : (line === 0 ? "Practically none left from about " : "Under " + line + " mg from about ") + hm(last + 5 * 6e4) + day(last) + ".";
    if (bed) {   // with a bedtime: what is left then, and by when the last coffee should be
      var atBed = level(bed), lastBy = null, bedTxt = "At bedtime (" + hm(bed) + ")";
      if (atBed < eff) for (var tt = bed - 30 * 6e4; tt >= now; tt -= 10 * 6e4) if (atBed + CAFFEINE.level([{ t: tt, mg: usual }], bed) < eff) { lastBy = tt; break; }
      under = atBed >= eff ? bedTxt + " still about " + Math.max(1, r10(atBed)) + " mg, above your " + line + " mg line" + (last !== null ? " (" + lineTxt + " from about " + hm(last + 5 * 6e4) + day(last) + ")." : ".")
        : lastBy !== null && lastBy > now + 10 * 6e4 ? bedTxt + (atBed >= 5 ? " about " + r10(atBed) + " mg." : " practically none.") + " Last coffee of the day: by about " + hm(lastBy) + day(lastBy) + "."
        : bedTxt + (atBed >= 5 ? " about " + r10(atBed) + " mg, " : " practically none, ") + "so better no more coffee today.";
    }
    var none = !today.length && nowL < 5;
    var text = none ? "No caffeine in you yet today. " + under : (nowL >= 5 ? (high ? "Up to about " + r10(nowL) + " mg in you right now" : "About " + r10(nowL) + " mg in you right now" + (hi - lo >= 20 ? " (likely " + r10(lo) + "\u2013" + r10(hi) + ")" : "")) : "Almost none left") +
      (today.length ? ", from " + (today.length === 1 ? "1 coffee" : today.length + " coffees") + " today (about " + r10(total) + " mg)." : ".") + " " + under;
    if (total > 400) text += " That is more than the 400 mg a day usually given as the limit for healthy adults.";
    return { k: "Caffeine", text: text, curve: none ? null : curveOf(level, mid.getTime(), now, line, bed), small: "The curve is the caffeine in you today: solid until now, lighter for how it wears off. Below the dashed line (" + line + " mg" + (line === 50 ? ", about half an espresso" : line === 25 ? ", your line for sensitive sleepers" : line === 100 ? ", your line for tolerant sleepers" : ", your own line") + ") there is little left to keep you awake: a rough guide for a sleep-friendly evening, not a medical limit. A rough average with a range: everyone is affected differently" + (high ? " (you count the upper end)." : ".") + (bed ? " \u201CLast coffee\u201D assumes a cup like your usual one (about " + r10(usual) + " mg)." : ""), more: "settings/index.html#cafset" };
  }
  // today from 6:00 (or the first coffee) until midnight: solid up to now, lighter for what is still to come,
  // the dashed line (your sleep line, 50 mg unless you changed it), a mark for now with the amount, and the hours underneath
  function curveOf(level, mid, now, line, bed) {
    var NS = "http://www.w3.org/2000/svg", mk = function (t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var t0 = mid + 6 * 36e5, t1 = mid + 24 * 36e5; if (now < t0) t0 = mid; if (now > t1 - 36e5) t1 = now + 3 * 36e5;
    if (bed && bed > t1 && bed < t1 + 6 * 36e5) t1 = bed + 36e5;   // a bedtime after midnight: shown too
    var N = 120, pts = [], top = 100; for (var k = 0; k <= N; k++) { var at = t0 + (t1 - t0) * k / N, v = level(at); pts.push([at, v]); if (v > top) top = v; }
    top *= 1.08;
    var W = 300, H = 64, y = function (v) { return (H - 2 - (H - 4) * v / top).toFixed(1); }, x = function (at) { return (W * (at - t0) / (t1 - t0)).toFixed(1); };
    var pct = function (at) { return Math.max(0, Math.min(100, 100 * (at - t0) / (t1 - t0))); };
    var wrap = el("div", "cafc"), plot = el("div", "cplot"), s = mk("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
    var pathOf = function (list) { return list.map(function (p, k) { return (k ? "L" : "M") + x(p[0]) + " " + y(p[1]); }).join(" "); };
    var past = pts.filter(function (p) { return p[0] <= now; }), next = pts.filter(function (p) { return p[0] >= now; });
    if (past.length && past[past.length - 1][0] < now) past.push([now, level(now)]);
    if (next.length && next[0][0] > now) next.unshift([now, level(now)]);
    if (past.length > 1) { s.appendChild(mk("path", { d: pathOf(past) + " L" + x(now) + " " + (H - 2) + " L" + x(t0) + " " + (H - 2) + "Z", class: "ca" })); s.appendChild(mk("path", { d: pathOf(past), class: "cl" })); }
    if (next.length > 1) s.appendChild(mk("path", { d: pathOf(next), class: "cl fut" }));
    s.appendChild(mk("path", { d: "M0 " + y(Math.max(line, 1)) + " H" + W, class: "c50" }));
    var showBed = bed && bed >= t0 && bed <= t1;
    if (showBed) s.appendChild(mk("path", { d: "M" + x(bed) + " 0 V" + H, class: "cbed" }));
    s.appendChild(mk("path", { d: "M0 " + (H - 1) + " H" + W, class: "cbase" }));
    if (now >= t0 && now <= t1) s.appendChild(mk("path", { d: "M" + x(now) + " 0 V" + H, class: "cn" }));
    plot.appendChild(s);
    // labels in HTML (the drawing stretches to the width, text must not)
    var l50 = el("span", "l50", line + " mg"); l50.style.bottom = (2 + (H - 4) * Math.max(line, 1) / top) + "px"; plot.appendChild(l50);   // just above the dashed line
    if (showBed) { var lb = el("span", "lbed", "bed"), qb = pct(bed); lb.style.left = qb + "%"; if (qb > 88) lb.classList.add("r"); plot.appendChild(lb); }
    if (now >= t0 && now <= t1) { var ln = el("span", "lnow", "now " + Math.round(level(now) / 10) * 10 + " mg"), q = pct(now); ln.style.left = q + "%"; if (q > 75) ln.classList.add("r"); else if (q < 25) ln.classList.add("l"); plot.appendChild(ln); }
    wrap.appendChild(plot);
    var ax = el("div", "cax");
    for (var hh = Math.ceil((t0 - mid) / 36e5 / 6) * 6; mid + hh * 36e5 <= t1; hh += 6) { var tk = el("span", "", (hh % 24) + ":00"); if (hh === 24) tk.textContent = "24:00"; tk.style.left = pct(mid + hh * 36e5) + "%"; ax.appendChild(tk); }
    wrap.appendChild(ax);
    return wrap;
  }

  // the little bag from the Coffee Shelf, filled as far as there is coffee left
  // small line icons, in the drawing style of the rest of the app (a name, or a path of its own)
  var LINE = { trophy: "M8 4h8v5a4 4 0 01-8 0z M8 6H5a3 3 0 003 4 M16 6h3a3 3 0 01-3 4 M12 13v4 M8 20h8 M9 17h6v3H9z", star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z", device: "M4 5h16l-6 9h-4L4 5z M12 14v3 M7 20h10", bean: "M12 3c4 0 6.5 4 6.5 9S16 21 12 21s-6.5-4-6.5-9S8 3 12 3z M12 3.5c-2 2.8-2 5.8 0 8.5s2 5.7 0 8.5" };
  function lineIco(d, cls) {
    var NS = "http://www.w3.org/2000/svg", sv = document.createElementNS(NS, "svg"), pa = document.createElementNS(NS, "path");
    sv.setAttribute("viewBox", "0 0 24 24"); sv.setAttribute("aria-hidden", "true"); if (cls) sv.setAttribute("class", cls);
    pa.setAttribute("d", LINE[d] || d); sv.appendChild(pa); return sv;
  }
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
