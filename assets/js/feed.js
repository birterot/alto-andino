/* Activity: what happened in the household (brews, new coffees and bags, cuppings), as Home's last part.
   Folded: this week in cups, and the newest entries. "Show all" unfolds the full feed with its filters and
   "Show older" (it used to be the Recent activity page of the Coffee Shelf, whose code this follows).
     ALTO_FEED.mount(host, { getDb, me, hid, root, open })   getDb: Home's Supabase client (one per page), me: your id,
                                                              hid: the household, root: the site's root, open: unfolded
   Data files it needs (lists, defaults, drinks, devices, stars, people) load on first use, after the opening animation. */
window.ALTO_FEED = (function () {
  const NEED = [["LISTS", "assets/js/lists.js"], ["DEFAULTS", "data/defaults.js"], ["DRINKS", "data/drinks.js"], ["DEVICES", "data/devices.js"], ["Stars", "assets/js/stars.js"], ["PEOPLE", "assets/js/people.js"]];
  function need(root) {
    return Promise.all(NEED.filter(x => !window[x[0]]).map(x => new Promise(ok => { const s = document.createElement("script"); s.src = root + x[1]; s.onload = s.onerror = ok; document.head.appendChild(s); })));
  }
  const CSS = `
#activity label{display:block;margin-top:14px;font-size:13.5px;color:var(--mut)}
#activity input,#activity textarea,#activity select{display:block;width:100%;max-width:420px;margin-top:6px;font:inherit;font-size:16px;border-radius:12px;border:1px solid var(--line);background-color:var(--card);color:var(--ink)}
#activity input,#activity select{height:48px;padding:0 14px}
#activity select{padding-right:38px}
#activity textarea{padding:12px 14px;min-height:96px}
#activity input[type=date],#activity input[type=datetime-local]{line-height:46px}
#activity input:focus-visible,#activity select:focus-visible,#activity textarea:focus-visible{outline:2px solid var(--accent);outline-offset:1px;border-color:var(--accent)}
#activity input::placeholder,#activity textarea::placeholder{color:var(--mut);opacity:.7}
#activity input[type=checkbox]{width:20px;height:20px;padding:0;margin:0;accent-color:var(--ink)}
#activity .filters select,#activity .filters input{border-radius:999px}
#activity .filters input{padding:0 16px}
#activity .hint{color:var(--mut);font-size:14px}
#activity .btn{font:inherit;cursor:pointer;border-radius:8px;padding:8px 14px;min-height:40px;font-size:14px;border:1px solid var(--s,var(--ink));background:var(--s,var(--ink));color:var(--bg);display:inline-flex;align-items:center;gap:7px;text-decoration:none}
#activity .btn.ghost{background:none;color:var(--t,var(--ink))}
#activity .pt{display:inline;white-space:nowrap}
#activity .pt .av{vertical-align:middle;margin:-3px 5px 0 0}
#activity .pt .av{width:20px;height:20px;font-size:11px}
#activity .pt b{font-weight:600;color:var(--ink)}
#activity .lhead{border:1px solid var(--line);border-radius:16px;background:var(--card);padding:16px 18px 14px;margin:14px 0 20px}
#activity .lhead .lk{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:600;display:flex;align-items:center;gap:8px}
#activity .lhead .lk .av{width:22px;height:22px;font-size:11.5px;letter-spacing:0}
#activity .lhead .big{display:flex;align-items:baseline;gap:8px;margin:6px 0 2px;flex-wrap:wrap}
#activity .lhead .big b{font-size:34px;line-height:1;font-weight:700;font-variant-numeric:tabular-nums}
#activity .lhead .big span{color:var(--mut);font-size:15px}
#activity .wk{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin:14px -4px 0}
#activity .wk button{display:flex;flex-direction:column;align-items:center;min-width:0;padding:4px 0 6px;border:0;border-radius:10px;background:none;font:inherit;color:var(--mut);cursor:pointer;-webkit-tap-highlight-color:transparent}
#activity .wk button.on{background:var(--bg)}
#activity .wk svg{display:block;width:100%;max-width:54px;overflow:visible}
#activity .wk .n{font-weight:600;color:var(--ink);font-size:12.5px;line-height:1.3;margin-top:1px}
#activity .wk .dl{font-size:11.5px;line-height:1.3}
#activity .wk .today .dl{color:var(--ink);font-weight:600}
#activity .wk .in{fill:var(--bg)}
#activity .wk .sc{fill:var(--line);stroke:var(--mut);stroke-width:1.2;opacity:.85}
#activity .wk .rim{fill:var(--line);stroke:var(--mut);stroke-width:1.5;opacity:.9}
#activity .wk .crema{fill:#fff;opacity:.28}
#activity .wk .ol,#activity .wk .steam{fill:none;stroke:var(--mut);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
#activity .wk .today .ol,#activity .wk .today .rim,#activity .wk .today .sc{stroke:var(--ink);stroke-width:1.8}
#activity .wk .steam{opacity:.6;stroke-width:1.4}
#activity .wleg .wtip{margin-left:auto;font-size:12px}
#activity .wkp{margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--bg);font-size:14px;color:var(--mut)}
#activity .wkp .wkh{display:block;color:var(--ink);font-weight:600;margin-bottom:6px}
#activity .wkp p{margin:0}
#activity .wkr{display:flex;align-items:flex-start;gap:8px;margin:4px 0;line-height:20px}
#activity .wkr .av{width:20px;height:20px;font-size:11px}
#activity .wkr b{color:var(--ink);font-weight:600}
#activity .wkp .wgo{display:block;margin-top:8px;padding:4px 0;border:0;background:none;font:inherit;font-size:14px;font-weight:600;color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
#activity .when2{display:flex;gap:8px;margin:-8px 0 16px}
#activity .when2 label{flex:1;min-width:0;font-size:13px;color:var(--mut);margin:0}
#activity .when2 input{display:block;width:100%;min-width:0;box-sizing:border-box;margin-top:4px}
#activity .wleg{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:10px;font-size:13px;color:var(--mut)}
#activity .wleg span{display:inline-flex;align-items:center;gap:6px}
#activity .wleg i{width:10px;height:10px;border-radius:3px;display:inline-block}
#activity .fun{display:flex;align-items:flex-start;gap:10px;width:100%;overflow:hidden;touch-action:pan-y;user-select:none;-webkit-user-select:none;margin:12px 0 0;padding:10px 12px;border:0;border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;font-size:15px;line-height:1.4;text-align:left;cursor:pointer}
#activity .fun > span{flex:1;min-width:0;will-change:transform}
#activity .fun small{margin-left:auto;flex:none;color:var(--mut);font-size:12px;padding-top:2px}
#activity .fi .old{font-size:12.5px;color:var(--mut);margin-top:4px}
#activity .fi .open{display:inline-block;margin-top:8px;font-size:13.5px;color:var(--ink)}
#activity #feed h3.day{margin:24px 0 8px;font-size:14px;font-weight:600;color:var(--mut)}
#activity #feed h3.day:first-child{margin-top:4px}
#activity .fi{display:block;padding:12px 14px 13px;margin-bottom:8px;border:1px solid var(--line);border-left:4px solid var(--s,var(--line));border-radius:10px;background:var(--card);color:var(--ink);text-decoration:none}
#activity .fi:hover{border-color:var(--ink);border-left-color:var(--s,var(--ink))}
#activity .fi .ft{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
#activity .fi strong{font-size:16px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#activity .fi.who{padding-left:12px}
#activity .fi.who .ft{align-items:center;justify-content:flex-start}
#activity .fi.who .fh{flex:1;min-width:0;font-size:15.5px;line-height:1.3}
#activity .fi.who .fh b{font-weight:650}
#activity .fi.who .fc{font-weight:500}
#activity .fi.who > p,#activity .fi.who > .rr{margin-left:44px}
#activity .av{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;color:#fff;font-size:15px;font-weight:600;letter-spacing:0}
#activity .fi time,#activity .fe time{flex:none;font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums}
#activity .fi p{margin:3px 0 0;font-size:14px;color:var(--mut)}
#activity .fi .rr{display:grid;grid-template-columns:auto auto 1fr;gap:7px 7px;align-items:start;margin-top:8px;font-size:14px;line-height:20px}
#activity .fi .rr .stars-row{height:20px;align-items:center;font-size:13px;margin-right:3px}
#activity .fi .rr .av{width:20px;height:20px;font-size:11px}
#activity .fi .rr .rn{font-weight:600;color:var(--ink)}
#activity .fi .rr .rt.wide{grid-column:2 / -1}
#activity .fi .rr .rcm{grid-column:3;margin-top:-5px;color:var(--mut);font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#activity .fi .note .nl{color:var(--mut);font-style:normal}
#activity .bc .tcm{margin:6px 0 0;font-style:italic;color:var(--ink)}
#activity .bnote{margin:10px 0 0;padding:8px 12px;border-radius:10px;background:var(--bg);font-size:14px;color:var(--ink)}
#activity .fi .note{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#activity .fe{display:flex;align-items:flex-start;gap:10px;line-height:21px;padding:7px 4px 7px 8px;margin-bottom:6px;font-size:14px;color:var(--mut);text-decoration:none;border-radius:10px}
#activity .fe:hover{background:var(--card)}
#activity .fe svg{flex:none;margin-top:.5px;color:var(--s,var(--accent))}
#activity .fe > span{flex:1;min-width:0}
#activity .fe b{font-weight:600;color:var(--ink)}
#activity #rmore{margin-top:8px}
#activity .filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 16px}
#activity .filters input,#activity .filters select{margin:0;max-width:none}
#activity{margin:30px 0 0}
#activity .ah{display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 2px}
#activity .ah h2{margin:0;font:400 21px/1.3 "Iowan Old Style",Palatino,Georgia,serif;color:var(--ink)}
#activity .lhead{margin-top:10px}
#activity .ah{align-items:center}
#activity.aopen .ah{position:sticky;top:calc(env(safe-area-inset-top,0px) + 58px);z-index:5;margin:0 -20px;padding:4px 20px;background:var(--bg);border-bottom:1px solid var(--line)}
#activity .afold{display:inline-flex;align-items:center;gap:4px;min-height:40px;margin:0 -6px 0 0;padding:0 6px;border:0;border-radius:10px;background:none;font:inherit;font-size:14.5px;font-weight:600;color:var(--ink);cursor:pointer;-webkit-tap-highlight-color:transparent}
#activity .afold svg{transition:transform .2s}#activity .afold[aria-expanded=true] svg{transform:rotate(180deg)}
#activity .afull[hidden],#activity [hidden]{display:none}
`;
  function mount(host, ctx) {
    if (!host || !ctx || !ctx.getDb || !ctx.me) return;
    const root = ctx.root || "", J = root + "journal/index.html";
    Promise.all([ctx.getDb(), need(root)]).then(([db]) => build(db)).catch(() => {});
    function build(db) {
      if (!document.getElementById("afeedcss")) { const st = document.createElement("style"); st.id = "afeedcss"; st.textContent = CSS; document.head.appendChild(st); }
      host.innerHTML = '<div class="ah"><h2>Activity</h2><button type="button" class="afold" id="afold" aria-expanded="false" aria-controls="afull"><span>Show all</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></div>' +
        '<section class="lhead" id="rhead" hidden></section>' +
        '<div class="afull" id="afull" hidden><div class="filters" id="rfilters">' +
        '<select id="rflt-kind" aria-label="What to show"><option value="">Everything</option><option value="brew">Brews</option><option value="bag">Coffees and bags</option><option value="cup">Cuppings</option></select>' +
        '<select id="rflt-who" aria-label="Who"></select>' +
        '<select id="rflt-when" aria-label="When"><option value="">Any time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option><option value="custom">Dates…</option></select>' +
        '</div><div class="when2" id="rwhen" hidden><label>From<input type="date" id="rw-from"></label><label>To<input type="date" id="rw-to"></label></div></div>' +
        '<div id="feed"></div><button type="button" class="btn ghost" id="rmore" hidden>Show older</button>';
      host.hidden = false;
      const $ = id => document.getElementById(id);
      const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const say = () => {};   // a quiet part of Home: when the activity cannot load, it simply is not there
      const me = { id: ctx.me };
      let names = {}, prefsOf = {}, open = false, feedN = 40, feedId = 0, feedMore = false, feedItems = [], feedTimed = false;
      // sorting: dates and ids letter by letter (ISO dates sort right that way), names with one shared collator (fast, unlike localeCompare on each pair)
      const cmpRaw = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
      let collator = null; const cmpText = (a, b) => (collator || (collator = new Intl.Collator())).compare(a, b);
      const nameOf = id => (id && names[id]) || null;
      const inHH = q => (ctx.hid ? q.eq("household_id", ctx.hid) : q);
      // who: you first, then everyone who shows up in the activity
      const hhPeople = () => { const s = new Set([me.id]); feedItems.forEach(x => (x.who || []).forEach(id => { if (id) s.add(id); })); return [...s].sort((x, y) => (x === me.id ? -1 : y === me.id ? 1 : cmpText(String(nameOf(x) || ""), String(nameOf(y) || "")))); };
      const ICONS = { bag: "M6.5 8h11l1 12.5h-13z M9 8V6.5a3 3 0 016 0V8", plus: "M12 5v14 M5 12h14", check: "M4.5 12.5l5 5L19.5 7",
        cup: "M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5V9z M16 10h2a2 2 0 010 4h-2 M8 3v3 M12 3v3", cart: "M3 4h2.5l2 11h10.5l2-8H6.8 M9.5 19.5h.01 M17 19.5h.01" };
      function ico(name, size) {
        const NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg");
        s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size || 18); s.setAttribute("height", size || 18);
        s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.7");
        s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ico");
        const p = document.createElementNS(NS, "path"); p.setAttribute("d", ICONS[name] || ICONS.cup); s.appendChild(p); return s;
      }
      // loadFeed
      async function loadFeed() {
        const my = ++feedId;
        const { data: cs, error } = await inHH(db.from("coffees").select("*")).order("created_at", { ascending: false });
        if (my !== feedId) return;
        if (error) { say("Could not load the activity: " + error.message); return; }
        const ids = cs.map(c => c.id), byId = {}; cs.forEach(c => { byId[c.id] = c; });
        let brews = [], cups = [];
        const rg = whenRange("r");   // a time frame: everything in it (no "Show older")
        feedTimed = !!rg;
        if (ids.length) {
          const [rb, rc] = await Promise.all([
            (rg ? db.from("brews").select("*, brew_ratings(id,rater_id,is_guest,guest_name,rating,balance,drink,milk,note,created_at)").in("coffee_id", ids).gte("brewed_at", rg.a.toISOString()).lt("brewed_at", rg.b.toISOString()).order("brewed_at", { ascending: false }).limit(1000)
              : db.from("brews").select("*, brew_ratings(id,rater_id,is_guest,guest_name,rating,balance,drink,milk,note,created_at)").in("coffee_id", ids).order("brewed_at", { ascending: false }).limit((open ? feedN : 10) + 1)),
            db.from("cuppings").select("session_id,coffee_id,cupped_at,cupper_id,is_guest,guest_name,total").in("coffee_id", ids).order("cupped_at", { ascending: false }).limit(open ? 500 : 20)
          ]);
          if (my !== feedId) return;
          if (rb.error) { say("Could not load the brews: " + rb.error.message); return; }
          brews = rb.data || []; cups = rc.error ? [] : (rc.data || []);   // before supabase/21 has run, there are no cuppings
        }
        drawWeek(ids, byId, my);
        // only as far back as the brews go: older coffees and cuppings come with "Show older"
        const n0 = open ? feedN : 10; feedMore = !rg && brews.length > n0; if (feedMore) brews = brews.slice(0, n0);
        const cutoff = feedMore ? new Date(brews[brews.length - 1].brewed_at) : null;
        const items = [];
        brews.forEach(b => items.push({ k: "brew", t: new Date(b.brewed_at), b, c: byId[b.coffee_id], who: [b.made_by || b.created_by, ...(b.brew_ratings || []).filter(r => !r.is_guest).map(r => r.rater_id)] }));
        const first = {};
        cs.slice().sort((x, y) => cmpRaw(String(x.created_at || ""), String(y.created_at || ""))).forEach(c => { if (!first[gk(c)]) first[gk(c)] = c.id; });
        cs.forEach(c => {
          if (c.created_at) items.push({ k: "add", t: new Date(c.created_at), c, again: first[gk(c)] !== c.id, who: [c.created_by] });
          if (c.open_date) items.push({ k: "open", t: localDay(c.open_date, 0), c, who: [] });   // a date without a time: opened at the start of the day,
          if (c.finished_at) items.push({ k: "fin", t: localDay(c.finished_at, 23), c, who: [] });   // finished at its end
        });
        const ses = {};
        cups.forEach(r => {
          const s = ses[r.session_id] = ses[r.session_id] || { k: "cup", sid: r.session_id, t: new Date(r.cupped_at), coffees: [], people: [], who: [], best: null };
          const t = new Date(r.cupped_at); if (t < s.t) s.t = t;
          if (!s.coffees.includes(r.coffee_id)) s.coffees.push(r.coffee_id);
          const p = { rater_id: r.is_guest ? null : r.cupper_id, guest: !!r.is_guest, guest_name: r.guest_name || null }, pk = p.guest ? "g:" + (p.guest_name || "") : p.rater_id;
          if (!s.people.some(q => (q.guest ? "g:" + (q.guest_name || "") : q.rater_id) === pk)) s.people.push(p);
          if (!r.is_guest && r.cupper_id) s.who.push(r.cupper_id);
          if (r.total != null && (s.best == null || Number(r.total) > s.best)) s.best = Number(r.total);
        });
        Object.values(ses).forEach(s => { s.cs = s.coffees.map(id => byId[id]).filter(Boolean); items.push(s); });
        feedItems = items.filter(x => (!cutoff || x.t >= cutoff) && inWhen(rg, x.t)).sort((x, y) => y.t - x.t);
        // who: everyone in the household who shows up in the activity
        const ppl = hhPeople(), s = $("rflt-who"), keep = s.value; s.textContent = "";
        opt0(s, "", "Everyone"); ppl.forEach(id => opt0(s, id, me && id === me.id ? (names[id] ? names[id] + " (you)" : "You") : nameOf(id) || "Someone"));
        s.value = ppl.includes(keep) ? keep : ""; s.hidden = ppl.length < 2;
        renderFeed();
      }
      // renderFeed
      function renderFeed() {
        const kind = $("rflt-kind").value, who = $("rflt-who").value, KIND = { brew: ["brew"], bag: ["add", "open", "fin"], cup: ["cup"] };
        const list = feedItems.filter(x => (!kind || KIND[kind].includes(x.k)) && (!who || x.who.includes(who)));
        const box = $("feed"); box.textContent = "";
        $("rmore").hidden = !feedMore || !open;
        if (!open) {   // folded: the five newest entries (not the cup waiting for your stars: Home has a note for it)
          const few = feedItems.filter(x => !(x.k === "brew" && tastersOf(x.b).some(t => !t.guest && me && t.rater_id === me.id && isPending(t)))).slice(0, 5);
          if (!few.length) { box.appendChild(el("p", "hint", "Nothing here yet. Brews, new coffees and bags, and cuppings show up here, newest first.")); return; }
          let d0 = ""; few.forEach(x => { const dk = x.t.toDateString(); if (dk !== d0) { d0 = dk; box.appendChild(el("h3", "day", dayLabel(x.t))); } box.appendChild(feedCard(x)); });
          return;
        }
        if (!feedItems.length && whenRange("r")) { box.appendChild(el("p", "hint", "Nothing happened in this time frame.")); return; }
        if (!feedItems.length) { box.appendChild(el("p", "hint", "Nothing here yet. Brews, new coffees and bags, and cuppings show up here, newest first.")); return; }
        if (!list.length) { box.appendChild(el("p", "hint", feedMore ? "Nothing matches in the latest activity. \"Show older\" looks further back." : "Nothing matches these filters.")); return; }
        let day = "";
        list.forEach(x => {
          const dk = x.t.toDateString();
          if (dk !== day) { day = dk; box.appendChild(el("h3", "day", dayLabel(x.t))); }
          box.appendChild(feedCard(x));
        });
      }
      // feedCard
      function feedCard(x) {
        const line = (href, icon, parts, time, c) => {   // a short line: added, opened, finished, cupped
          const a = el("a", "fe"); a.href = href; if (c) applyLook(a, c);
          const t = el("span"); parts.forEach(p => t.append(typeof p === "string" ? document.createTextNode(p) : p));
          a.append(ico(icon, 20), t); if (time) a.appendChild(el("time", "", time)); return a;
        };
        const cname = c => el("b", "", c ? c.name : "a coffee");
        if (x.k === "brew") {
          const b = x.b, c = x.c, a = el("a", "fi who"); a.href = J + "#c=" + b.coffee_id + "&b=" + b.id; if (c) applyLook(a, c);
          const maker = b.made_by || b.created_by, by = maker ? tName({ rater_id: maker }) : null;
          // who brewed it comes first: their initial in a circle, then "Andrés brewed <coffee>"
          const top = el("div", "ft"), hd = el("span", "fh");
          hd.append(el("b", "", by || "Someone"), document.createTextNode(" brewed "), el("span", "fc", c ? c.name : "a coffee"));
          top.append(avatar(maker, by), hd); top.appendChild(el("time", "", hhmm(x.t))); a.appendChild(top);
          const nums = [b.dose_g != null ? b.dose_g + "\u00A0g in" : null, b.yield_g != null ? b.yield_g + "\u00A0g out" : b.water_g != null ? b.water_g + "\u00A0g water" : null,
            b.time_s != null ? (isEsp(typeOf(b.device)) && b.time_s < 90 ? b.time_s + "\u00A0s" : mmss(b.time_s) + "\u00A0min") : null].filter(Boolean).join(", ");
          const dev = DEV_OLD[b.device] || b.device, devT = dev && /^(Manual|Semi-automatic|Moka|French|Pour|Cold|Turkish|Drip)\b/.test(dev) ? dev[0].toLowerCase() + dev.slice(1) : dev;
          const what = [devT ? (devT[0].toUpperCase() + devT.slice(1)) : null, nums, b.is_dialin ? "dial-in" : null].filter(Boolean).join(" · ");
          a.appendChild(el("p", "", what));
          const ts = tastersOf(b);
          if (ts.length) {
            const rr = el("div", "rr");
            ts.forEach(t => rateLine(rr, t.rating, tName(t) + ": " + Stars.text(t.rating) + " of 5", t,
              isPending(t) ? ": to rate" : (t.drink ? ", " + drinkText(t.drink, t.milk).toLowerCase() : "") + (t.rating == null ? ", taste only" : ""), t.note));
            a.appendChild(rr);
          } else a.appendChild(el("p", "", "Not rated yet"));
          if (b.notes) { const n = el("p", "note"); n.append(el("span", "nl", "Brew comment: "), document.createTextNode(b.notes)); a.appendChild(n); }
          return a;
        }
        const who = id => id ? tName({ rater_id: id }) : null;
        if (x.k === "add") { const w = who(x.c.created_by); return line(J + "#c=" + x.c.id, x.again ? "cart" : "plus", [(w || "Someone") + (x.again ? " got a new bag of " : " added "), cname(x.c)], hhmm(x.t), x.c); }
        if (x.k === "open") return line(J + "#c=" + x.c.id, "bag", ["Opened a bag of ", cname(x.c)], "", x.c);
        if (x.k === "fin") return line(J + "#c=" + x.c.id, "check", ["Finished the bag of ", cname(x.c)], "", x.c);
        // a cupping session
        const cs = x.cs, shown = cs.slice(0, 2), parts = ["Cupping: "];
        shown.forEach((c, i) => { if (i) parts.push(cs.length === 2 ? " and " : ", "); parts.push(cname(c)); });
        if (cs.length > 2) parts.push(" and " + (cs.length - 2) + " more");
        parts.push(", by ");
        x.people.forEach((p, i) => { if (i) parts.push(i === x.people.length - 1 ? " and " : ", "); parts.push(personTag(p)); });
        if (x.best != null) parts.push(", best " + (Math.round(x.best * 4) / 4));
        return line(root + "cupping/#s=" + x.sid, "cup", parts, hhmm(x.t), cs[0]);
      }
      // drawWeek
      async function drawWeek(ids, byId, my) {
        const box = $("rhead");
        if (!ids.length) { box.hidden = true; return; }
        const from = dayStart(new Date(), 13);
        const { data, error } = await db.from("brews").select("id,coffee_id,brewed_at,made_by,created_by,dose_g").in("coffee_id", ids).gte("brewed_at", from.toISOString()).order("brewed_at");
        if (my !== feedId) return;
        if (error) { box.hidden = true; return; }
        const wk0 = dayStart(new Date(), 6), all = data || [];
        const week = all.filter(b => new Date(b.brewed_at) >= wk0), before = all.length - week.length;
        box.textContent = ""; box.hidden = false;
        box.appendChild(el("div", "lk", "This week"));
        const big = el("div", "big"); big.append(el("b", "", String(week.length)), el("span", "", (week.length === 1 ? "brew" : "brews") + " in the last 7 days" + (before ? (week.length > before ? ", " + (week.length - before) + " more than the week before" : week.length < before ? ", " + (before - week.length) + " fewer than the week before" : ", as many as the week before") : "")));
        box.appendChild(big);
        // one little cup per day, filled up with that day's brews in the colours of who brewed (full at the busiest day, at least 3).
        // Tap a cup: who made how many that day. Tap it again (or the button): those brews, below.
        const who = b => b.made_by || b.created_by || null, ppl = [...new Set(week.map(who))];
        const days = [...Array(7)].map((_, k) => { const d0 = dayStart(new Date(), 6 - k), d1 = dayStart(new Date(), 5 - k); return { d: d0, list: week.filter(b => { const t = new Date(b.brewed_at); return t >= d0 && t < d1; }) }; });
        const max = Math.max(3, ...days.map(x => x.list.length));
        const cupsRow = el("div", "wk"), panel = el("div", "wkp"); panel.hidden = true;
        const NS = "http://www.w3.org/2000/svg", mk = (n, a) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
        // the cup sits in the middle of a 44 wide picture (its saucer centred under the number and the day), the handle sticks out to the right
        const RIM = 13, BOT = 35, FULL = 15.5, hw = y => 12 - 2.2 * Math.max(0, y - RIM) / (BOT - RIM);   // half the width of the cup at height y
        const BODY = "M10 13L12.2 30.5Q12.9 35 17.5 35H26.5Q31.1 35 31.8 30.5L34 13Z";
        let sel = -1;
        const showDay = x => {   // the brews of that day in the list below
          openAll(true, true); setWhenDay("r", x.d); $("rflt-kind").value = "brew";
          loadFeed().then(() => { const f = $("rfilters"); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); });
        };
        const fillPanel = x => {
          panel.textContent = ""; panel.hidden = false;
          panel.appendChild(el("b", "wkh", (x.d.getTime() === dayStart(new Date(), 0).getTime() ? "Today" : WDL[x.d.getDay()]) + ", " + x.d.getDate() + " " + x.d.toLocaleDateString("en-GB", { month: "long" })));
          if (!x.list.length) { panel.appendChild(el("p", "", "No brews that day.")); return; }
          ppl.forEach(id => {
            const mine = x.list.filter(b => who(b) === id); if (!mine.length) return;
            const r = el("div", "wkr"), by = {}; mine.forEach(b => { const c = byId[b.coffee_id], n = c ? c.name : "a coffee"; by[n] = (by[n] || 0) + 1; });
            const tx = el("span"); tx.append(el("b", "", id ? tName({ rater_id: id }) : "Not set"), document.createTextNode(" made " + mine.length + (mine.length === 1 ? " brew: " : " brews: ") + Object.entries(by).map(([n, k]) => n + (k > 1 ? " \u00D7" + k : "")).join(", ")));
            r.append(avatar(id, id ? tName({ rater_id: id }) : "?"), tx); panel.appendChild(r);
          });
          const go = el("button", "wgo", "Show " + (x.list.length === 1 ? "this brew" : "these " + x.list.length + " brews") + " \u2193"); go.type = "button"; go.onclick = () => showDay(x); panel.appendChild(go);
        };
        days.forEach((x, k) => {
          const c = el("button", "d" + (k === 6 ? " today" : "")), cid = "wkc" + k + "-" + my; c.type = "button";
          c.setAttribute("aria-label", (k === 6 ? "Today" : WDL[x.d.getDay()]) + ": " + x.list.length + (x.list.length === 1 ? " brew" : " brews"));
          const s = mk("svg", { viewBox: "3 2 38 39", "aria-hidden": "true" });
          const cp = mk("clipPath", { id: cid }); cp.appendChild(mk("path", { d: BODY })); s.appendChild(cp);
          s.appendChild(mk("ellipse", { cx: 22, cy: 36.6, rx: 16.5, ry: 2.7, class: "sc" }));   // the saucer, the cup stands on it
          s.appendChild(mk("path", { d: BODY, class: "in" }));
          const g = mk("g", { "clip-path": "url(#" + cid + ")" }); let y = BOT, topCol = null;
          ppl.forEach(id => {
            const n = x.list.filter(b => who(b) === id).length; if (!n) return;
            const h = (BOT - FULL) * n / max; y -= h; topCol = id ? personColor(id) : "var(--mut)";
            g.appendChild(mk("rect", { x: 0, y: y, width: 44, height: h + 0.4, fill: topCol }));
          });
          s.appendChild(g);
          if (topCol) {   // the coffee's surface, with a little crema
            s.appendChild(mk("ellipse", { cx: 22, cy: y, rx: hw(y), ry: 1.6, fill: topCol }));
            s.appendChild(mk("ellipse", { cx: 22, cy: y, rx: hw(y) - 0.6, ry: 1.2, class: "crema" }));
          }
          s.appendChild(mk("ellipse", { cx: 22, cy: RIM, rx: 12, ry: 2, class: "rim" }));
          s.appendChild(mk("path", { d: "M10 13L12.2 30.5Q12.9 35 17.5 35H26.5Q31.1 35 31.8 30.5L34 13 M33.6 17H35.3A4.4 4.4 0 0135.3 25.8H32.6", class: "ol" }));
          if (k === 6 && x.list.length) s.appendChild(mk("path", { d: "M19 9c-1.6-1.6 1.6-2.6 0-4.8 M25 9c-1.6-1.6 1.6-2.6 0-4.8", class: "steam" }));   // today's cup is still warm
          c.append(s, el("span", "n", String(x.list.length)), el("span", "dl", k === 6 ? "Today" : WD[x.d.getDay()]));
          c.onclick = () => {
            if (sel === k && x.list.length) { showDay(x); return; }
            sel = k; cupsRow.querySelectorAll("button").forEach((bt, j) => bt.classList.toggle("on", j === k)); fillPanel(x);
          };
          cupsRow.appendChild(c);
        });
        box.appendChild(cupsRow);
        if (ppl.length) { const lg = el("div", "wleg"); ppl.forEach(id => { const s = el("span"), i = el("i"); i.style.background = id ? personColor(id) : "var(--mut)"; s.append(i, document.createTextNode(id ? tName({ rater_id: id }) : "Not set")); lg.appendChild(s); }); lg.appendChild(el("span", "wtip", "Tap a cup")); box.appendChild(lg); }
        box.appendChild(panel);
        // the fun lines
        const lines = [];
        if (week.length >= 3 && ppl.filter(Boolean).length >= 2) {
          const top = ppl.filter(Boolean).map(id => [id, week.filter(b => who(b) === id).length]).sort((a, b) => b[1] - a[1]);
          lines.push(top[0][1] === top[1][1] ? "A draw: " + tName({ rater_id: top[0][0] }) + " and " + tName({ rater_id: top[1][0] }) + " made " + top[0][1] + " brews each." : tName({ rater_id: top[0][0] }) + " made " + top[0][1] + " of the " + week.length + " brews.");
        }
        const byC = {}; week.forEach(b => { const c = byId[b.coffee_id]; if (c) { const k = c.name; byC[k] = (byC[k] || 0) + 1; } });
        const topC = Object.entries(byC).sort((a, b) => b[1] - a[1])[0];
        if (topC && topC[1] >= 2) lines.push("Most brewed: " + topC[0] + ", " + topC[1] + " times.");
        if (week.length) {
          const early = week.slice().sort((a, b) => { const x = new Date(a.brewed_at), y = new Date(b.brewed_at); return (x.getHours() * 60 + x.getMinutes()) - (y.getHours() * 60 + y.getMinutes()); })[0], t = new Date(early.brewed_at);
          lines.push("Earliest brew: " + (who(early) ? tName({ rater_id: who(early) }) : "someone") + ", " + WDL[t.getDay()] + " at " + hhmm(t) + ".");
          const late = week.slice().sort((a, b) => { const x = new Date(a.brewed_at), y = new Date(b.brewed_at); return (y.getHours() * 60 + y.getMinutes()) - (x.getHours() * 60 + x.getMinutes()); })[0], tl = new Date(late.brewed_at);
          if (tl.getHours() >= 15) lines.push("Latest brew: " + WDL[tl.getDay()] + " at " + hhmm(tl) + (who(late) ? ", by " + tName({ rater_id: who(late) }) : "") + ".");
        }
        const busy = days.slice().sort((a, b) => b.list.length - a.list.length)[0];
        if (busy && busy.list.length >= 2) lines.push("Busiest day: " + (busy === days[6] ? "today" : WDL[busy.d.getDay()]) + ", with " + busy.list.length + " brews.");
        const g = week.reduce((t, b) => t + (Number(b.dose_g) || 0), 0);
        if (g >= 30) lines.push("About " + Math.round(g) + " g of beans this week" + (g >= 200 ? ", " + (g >= 375 ? "about " + (Math.round(g / 250 * 2) / 2).toString().replace(".5", " and a half") + " bags of 250 g" : "almost a whole 250 g bag") : "") + ".");
        if (!week.length) lines.push("No brews this week yet. The first one of the week is waiting.");
        funLine(box, lines);
      }
      // funLine
      function funLine(box, lines) {   // the fun facts: swipe left or right (or tap) to go through them
        if (!lines.length) return;
        let i = Math.floor(Date.now() / 864e5) % lines.length;
        const b = el("button", "fun"); b.type = "button"; b.setAttribute("aria-label", "A fun fact, swipe or tap for the next");
        const t = el("span"), n = el("small");
        const draw = () => { t.textContent = lines[i]; n.textContent = lines.length > 1 ? (i + 1) + "/" + lines.length : ""; };
        const slide = (x, o, ms) => { t.style.transition = ms ? "transform " + ms + "ms ease, opacity " + ms + "ms ease" : "none"; t.style.transform = x ? "translateX(" + x + "px)" : ""; t.style.opacity = o; };
        const go = d => {   // d = 1: the next one comes in from the right, d = -1: the one before from the left
          if (lines.length < 2) { slide(0, 1, 150); return; }
          slide(-d * 60, 0, 130);
          setTimeout(() => { i = (i + d + lines.length) % lines.length; draw(); slide(d * 60, 0, 0); void t.offsetWidth; slide(0, 1, 170); }, 130);
        };
        let x0 = null, y0 = 0, dx = 0, drag = false, swiped = false;
        b.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; dx = 0; drag = false; swiped = false; });
        b.addEventListener("pointermove", e => {
          if (x0 == null) return;
          dx = e.clientX - x0;
          if (!drag && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) { drag = true; try { b.setPointerCapture(e.pointerId); } catch (_) { /* fine without */ } }
          if (drag) slide(dx, 1 - Math.min(0.7, Math.abs(dx) / 220), 0);
        });
        const end = () => {
          if (x0 == null) return; x0 = null;
          if (!drag) return;
          swiped = true;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); else slide(0, 1, 150);
        };
        b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
        b.onclick = () => { if (swiped) { swiped = false; return; } go(1); };
        b.append(t, n); draw(); box.appendChild(b);
      }
      // whenRange
      function whenRange(k) {   // k = "r" (Recent activity) or "m" (My brews)
        const v = $(k + "flt-when").value, t0 = dayStart(new Date(), 0), plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
        if (!v) return null;
        if (v === "today") return { a: t0, b: plus(t0, 1) };
        if (v === "yesterday") return { a: plus(t0, -1), b: t0 };
        if (v === "7" || v === "30") return { a: plus(t0, 1 - Number(v)), b: plus(t0, 1) };
        if (v === "month") { const a = new Date(t0); a.setDate(1); return { a, b: plus(t0, 1) }; }
        const day = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
        if (v.startsWith("d:")) { const a = day(v.slice(2)); return { a, b: plus(a, 1) }; }
        const f = $(k + "w-from").value, to = $(k + "w-to").value;   // custom: either end may be open
        if (!f && !to) return null;
        return { a: f ? day(f) : new Date(2000, 0, 1), b: to ? plus(day(to), 1) : plus(t0, 1) };
      }
      // inWhen
      const inWhen = (r, t) => !r || (t >= r.a && t < r.b);
      // setWhenDay
      function setWhenDay(k, d) {   // one day, as its own option ("Thu 22 Oct")
        const sel = $(k + "flt-when"); [...sel.options].filter(o => o.value.startsWith("d:")).forEach(o => o.remove());
        const o = el("option", "", WD[d.getDay()] + " " + d.getDate() + " " + d.toLocaleDateString("en-GB", { month: "short" }));
        o.value = "d:" + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        sel.insertBefore(o, sel.options[1]); sel.value = o.value; $(k + "when").hidden = true;
      }
      // whenUi
      function whenUi(k, redo) {
        $(k + "flt-when").addEventListener("change", () => {
          const c = $(k + "flt-when").value === "custom"; $(k + "when").hidden = !c;
          if (c && !$(k + "w-from").value) { const a = dayStart(new Date(), 6); $(k + "w-from").value = a.getFullYear() + "-" + String(a.getMonth() + 1).padStart(2, "0") + "-" + String(a.getDate()).padStart(2, "0"); }
          redo();
        });
        [k + "w-from", k + "w-to"].forEach(id => $(id).addEventListener("change", redo));
      }
      // dayLabel
      function dayLabel(d) {
        const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0);
        const n = Math.round((t - x) / 864e5);
        if (n === 0) return "Today";
        if (n === 1) return "Yesterday";
        if (n > 1 && n < 7) return x.toLocaleDateString("en-GB", { weekday: "long" });
        return x.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", ...(x.getFullYear() !== t.getFullYear() ? { year: "numeric" } : {}) });
      }
      // hhmm
      const hhmm = d => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      // localDay
      const localDay = (iso, h) => { const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d, h, h ? 59 : 0); };
      // WD
      const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], WDL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      // dayStart
      const dayStart = (d, back) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (back || 0)); return x; };
      // rateLine
      function rateLine(rr, rating, label, t, rest, note) {
        rr.appendChild(rating != null ? Stars.row(rating, label) : el("span"));
        if (t) rr.appendChild(avatar(t.guest ? null : t.rater_id, t.guest ? (t.guest_name || "Guest") : tName(t)));
        const tx = el("span", "rt"); if (t) tx.appendChild(el("span", "rn", tName(t))); tx.appendChild(document.createTextNode(rest)); rr.appendChild(tx);
        if (!t) tx.classList.add("wide");
        if (note) rr.appendChild(el("span", "rcm", "\u201C" + note + "\u201D"));   // their comment, in the text column
      }
      // personTag
      function personTag(t, bold) {
        const n = tName(t), s = el("span", "pt"); s.append(avatar(t.guest ? null : t.rater_id, t.guest ? (t.guest_name || "Guest") : n), el(bold ? "b" : "span", "", n)); return s;
      }
      // personColor
      const personColor = (id, name) => PEOPLE.color(id, name, prefsOf, Object.keys(names || {}));
      // avatar
      const avatar = (id, name) => PEOPLE.avatar(id, name && name !== "You" ? name : (me && id === me.id && names[me.id]) || name, personColor(id, name));
      // tName
      function tName(t) {
        if (!t) return "";
        if (t.guest) return t.guest_name ? t.guest_name + " (guest)" : "Guest";
        if (me && t.rater_id === me.id) return names[me.id] ? names[me.id] : "You";
        return nameOf(t.rater_id) || "Someone";
      }
      // tastersOf
      function tastersOf(b) {
        const sc = b.brew_scores || [], rs = (b.brew_ratings || []).slice().sort((x, y) => cmpRaw(String(x.created_at || ""), String(y.created_at || "")) || cmpRaw(String(x.id), String(y.id)));
        const sco = list => { const o = {}; list.forEach(x => { o[x.attribute] = x.score; }); return o; };
        if (rs.length) return rs.map(r => ({ id: r.id, rater_id: r.is_guest ? null : r.rater_id, guest: !!r.is_guest, guest_name: r.guest_name || null, rating: r.rating == null ? null : Number(r.rating), balance: r.balance == null ? null : Number(r.balance), drink: r.drink || null, milk: r.milk || null, drank: r.drank_at || null, note: r.note || null, scores: sco(sc.filter(x => x.rating_id === r.id)) }));
        if (b.rating != null || sc.length) return [{ rater_id: b.made_by || b.created_by || null, guest: false, guest_name: null, rating: b.rating == null ? null : Number(b.rating), balance: null, drink: null, milk: null, scores: sco(sc) }];
        return [];
      }
      // isPending
      const isPending = t => t && t.rating == null && t.balance == null && !Object.keys(t.scores || {}).length;   // in the brew's list, not rated yet
      // DR
      const DR = (window.DRINKS && window.DRINKS.D) || [], MILKS = (window.DRINKS && window.DRINKS.MILKS) || [];
      // drinkOf
      const drinkOf = id => DR.find(d => d.id === id) || null;
      // drinkName
      const drinkName = id => { const d = drinkOf(id); return d ? d.name : id || ""; };
      // milkName
      const milkName = id => { const m = MILKS.find(x => x[0] === id); return m ? m[1].replace(/ \(.*\)$/, "") : id || ""; };
      // drinkText
      const drinkText = (dk, mk) => { if (!dk) return ""; const wm = mk && (!drinkOf(dk) || drinkOf(dk).milk), n = drinkName(dk).replace(/ \((traditional|common), \d shots?\)$/, ""); return (wm ? n.replace(/ with milk$/, "") + ", " + milkName(mk).toLowerCase() : n); };   // "Filter coffee, whole milk", not "Filter coffee with milk, whole milk"
      // mmss
      const mmss = n => Math.floor(n / 60) + ":" + String(Math.round(n % 60)).padStart(2, "0");
      // DEV_OLD
      const DEV_OLD = { "Flair 58": "Manual espresso machine", "Flair": "Manual espresso machine" };   // names from before
      // isEsp
      const isEsp = t => t === "espresso" || t === "";
      // typeOf
      function typeOf(name) { return window.DEVICES && window.DEVICES.typeOf ? window.DEVICES.typeOf(name) : ""; }   // data/devices.js
      // PAL
      const PAL = window.LISTS.process;
      // GREY
      const GREY = ["#F1EFE8","#2C2C2A","#5F5E5A","#B4B2A9","#444441","#D3D1C7"];
      // applyPal
      function applyPal(a, process) {
        const p = PAL[process] || GREY;
        ["--f:" + p[0] + "," + p[1], "--s:" + p[2] + "," + p[3], "--t:" + p[4] + "," + p[5]].forEach(s => {
          const [k, v] = s.split(":"); const [l, d] = v.split(",");
          a.style.setProperty(k, "light-dark(" + l + "," + d + ")");
        });
      }
      // ROASTS
      const ROASTS = (window.DEFAULTS && window.DEFAULTS.ROAST_COLOURS) || [];
      // roastIdx
      const roastIdx = r => ROASTS.findIndex(x => x[0].toLowerCase() === String(r || "").trim().toLowerCase());
      // applyLook
      function applyLook(a, c) {
        const i = roastIdx(c.roast_level);
        if (i < 0) { applyPal(a, listOf(c.process)[0]); return; }
        const p = ROASTS[i][1];
        [["--f", 0], ["--s", 2], ["--t", 4]].forEach(([k, j]) => a.style.setProperty(k, "light-dark(" + p[j] + "," + p[j + 1] + ")"));
      }
      // listOf
      const listOf = t => String(t || "").split(",").map(x => x.trim()).filter(Boolean);
      // gk
      const gk = c => c.group_id || c.id;   // bags of one coffee share this key
      // opt0
      function opt0(s, v, t) { const o = el("option", "", t); o.value = v; s.appendChild(o); }
      // fold and unfold
      function openAll(on, quiet) {
        open = on; $("afull").hidden = !on; host.classList.toggle("aopen", on); const f = $("afold"); f.setAttribute("aria-expanded", String(on)); f.firstChild.textContent = on ? "Show less" : "Show all";   // unfolded: the heading with Show less stays in sight
        if (!on) { $("rflt-kind").value = ""; $("rflt-who").value = ""; $("rflt-when").value = ""; $("rwhen").hidden = true; [...$("rflt-when").options].filter(o => o.value.startsWith("d:")).forEach(o => o.remove()); feedN = 40; }
        if (quiet) return;
        // at once, from what is already there (folding needs nothing new; unfolding shows the first entries right away),
        // then fresh from the database: on a slow connection the list used to stay open until the answer came
        const timed = !on && feedTimed; renderFeed();
        if (!on && host.getBoundingClientRect().top < 0) host.scrollIntoView({ behavior: "smooth", block: "start" });
        if (on || timed) loadFeed();
      }
      $("afold").onclick = () => openAll(!open);
      ["rflt-kind", "rflt-who"].forEach(id => $(id).addEventListener("change", renderFeed));
      whenUi("r", () => loadFeed());
      $("rmore").onclick = () => { feedN += 40; loadFeed(); };
      db.from("profiles").select("id,display_name,prefs").then(r => {
        ((r && r.data) || []).forEach(p => { names[p.id] = p.display_name; if (p.prefs) prefsOf[p.id] = p.prefs; });
        if (ctx.open) { openAll(true, true); loadFeed().then(() => host.scrollIntoView({ block: "start" })); } else loadFeed();
      });
    }
  }
  return { mount };
})();
