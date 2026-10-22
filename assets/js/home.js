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
  var notes = [], cafNote = null, rateNote = null, tipNote = null;
  var tr = session && shelf ? toRate(shelf.tr, shelf.nm) : null;
  if (tr) notes.push(rateNote = tr);
  var caf = session ? caffeine(shelf && shelf.cb) : null;
  if (caf) notes.push(cafNote = caf);
  var tip0 = session && cafPref().sleep === "on" && shelf && shelf.stip ? tipToNote(shelf.stip) : null;
  if (tip0) notes.push(tipNote = tip0);
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
    if (notes.length > 1) {
      card.setAttribute("role", "button"); card.tabIndex = 0; card.setAttribute("aria-label", "Next note");
      var next = function () { i = (i + 1) % notes.length; draw(); };
      card.addEventListener("click", next);
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
    }
    draw(); box.appendChild(card);
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
          (function () {   // all brews of the open bags (for the cups left), however old
            var ids = ((shelf && shelf.coffees) || []).filter(function (c) { return c.open_date && !c.finished_at && !c.archived; }).map(function (c) { return c.id; });
            return ids.length ? db.from("brews").select("coffee_id,dose_g").in("coffee_id", ids) : Promise.resolve({ data: [] });
          })(),
          db.from("sleep_logs").select("night,quality").gte("night", since2.slice(0, 10))   // the sleep check (supabase/31_sleep.sql; before that: an error, left out)
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
          var logs = res[3] && !res[3].error && Array.isArray(res[3].data) ? res[3].data.map(function (x) { return { n: x.night, q: x.quality }; }) : null;
          var used = null; if (res[2] && Array.isArray(res[2].data)) { used = {}; res[2].data.forEach(function (x) { used[x.coffee_id] = (used[x.coffee_id] || 0) + (Number(x.dose_g) || 0); }); }
          var tip = logs ? sleepTip(logs, all) : null;
          var sh = null; try { sh = JSON.parse(localStorage.getItem("alto.shelf.v1") || "null"); if (sh && sh.u === my) { sh.cb = rows; sh.cbt = Date.now(); sh.my = mine; sh.tr = pend; sh.nm = nm; if (used) sh.used = Object.assign({}, sh.used || {}, used); if (logs) { sh.sl = logs; sh.stip = tip; } localStorage.setItem("alto.shelf.v1", JSON.stringify(sh)); } else sh = null; } catch (e) { sh = null; }
          if (sh) drawBags(sh);
          showStat(mine); showRate(pend, nm); showCaffeine(rows);
          if (logs) { sleepLogs = logs; drawAsk(); showTip(tip); }
        });
      });
    }).catch(function () {});
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
    [[1, "\uD83D\uDE1E", "Badly"], [2, "\uD83D\uDE10", "Okay"], [3, "\uD83D\uDE0A", "Well"]].forEach(function (f) {
      var b = el("button", "face"); b.type = "button"; b.setAttribute("aria-label", f[2]);
      b.append(el("span", "fe", f[1]), el("span", "fl", f[2]));
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
  function showTip(t) { tipNote = swapNote(tipNote, cafPref().sleep === "on" ? tipToNote(t) : null, false); }

  // ---------- caffeine: the note and its curve (the numbers come from assets/js/caffeine.js) ----------
  // A brew counts for everyone it was for (split between them, rated or not yet), at the time they drank it if they said,
  // else at the time of the brew. Settings > Caffeine (kept on this phone too, so Home has it at once):
  // "high" counts the upper end of the range, "midnight" starts every day at zero, "line" is your sleep line (5 to 400 mg, 50 unless you changed it).
  function cafPref() { try { return JSON.parse(localStorage.getItem("alto.cafpref") || "{}") || {}; } catch (e) { return {}; } }
  function savePref(p) { try { localStorage.setItem("alto.cafpref", JSON.stringify({ mode: p.caf_mode || "", day: p.caf_day || "", line: p.caf_line != null ? p.caf_line : null, bed: p.caf_bed || "", show: p.caf_show || "", sleep: p.sleep || "" })); } catch (e) {} }
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
