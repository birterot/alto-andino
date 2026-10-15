/* Top bar with a burger menu, shared by every page, plus the Alto Andino wordmark,
   breadcrumbs and previous/next links in the book chapters.
   Add <script src="PATH/assets/js/nav.js" defer></script> to a page to get it.
   To rename a section or add a menu entry, change the lists right below.
   Any element with a data-wordmark attribute is turned into the Alto Andino wordmark (the A's are mountains). */
(function () {
  var root = new URL("../../", document.currentScript.src).href;
  var BRAND = "ALTO ANDINO";
  var BOOK = "Bean to cup";   // the name of the notes-from-the-book section
  var PEAKS = "M2.5 18L12 3l9.5 15 M7.6 12.8l2.4 1.8 2-1.8 2 1.8 2.4-1.8";   // the mountain mark, also used as the A in the wordmark
  var ICONS = {
    home: "M4 11l8-7 8 7M6 10v10h4v-6h4v6h4V10",
    log: "M12 5v14M5 12h14",
    journal: "M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4zM5 17a3 3 0 013-3h11",
    trends: "M4 19V5M4 19h16M8 15l4-5 3 3 4-6",
    calc: "M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01",
    book: "book"
  };
  var ITEMS = [               // key, label, link
    ["home", "Home", "index.html"],
    ["log", "Log a brew", "journal/index.html#log"],
    ["calc", "Calculator", "calc/index.html"],
    ["journal", "Journal", "journal/index.html"],
    ["trends", "Trends", "trends/index.html"],
    ["book", BOOK, "chapters/index.html"]
  ];
  var CHAPTERS = [            // file name, label (order = menu order and the previous/next order)
    ["processing", "Processing"],
    ["roasting", "Roasting"],
    ["freshness", "Freshness and storage"],
    ["devices", "Brewing devices"]
  ];

  var path = location.pathname, file = (path.split("/").pop() || "index.html").replace(/\.html$/, "");
  var inBook = /\/chapters\//.test(path), chapter = inBook && file !== "index" ? file : null;
  var isHome = !inBook && !/\/(journal|trends|calc)\//.test(path);
  var isCalc = /\/calc\//.test(path);
  var NS = "http://www.w3.org/2000/svg";

  var css = document.createElement("style");
  css.textContent =
    ".topnav{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;background:var(--bg,#fff);border-bottom:1px solid var(--line,#ccc)}" +
    ".topnav .bar{display:flex;align-items:center;gap:4px;max-width:900px;margin:0 auto;padding:6px 8px}" +
    ".topnav .iconbtn{width:44px;height:44px;display:grid;place-items:center;background:none;border:0;color:inherit;cursor:pointer;border-radius:8px;text-decoration:none;flex:none}" +
    ".topnav .where{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;min-height:44px;font-size:15px;color:inherit;text-decoration:none}" +
    ".wm{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-weight:500;letter-spacing:.16em;white-space:nowrap}" +
    ".wm .ma{display:inline-block;width:1em;height:.72em;margin:0 .06em 0 .02em;vertical-align:baseline;overflow:visible}" +
    ".topnav .logo{color:var(--accent,#8A6A4A);flex:none}" +
    ".navback{position:fixed;inset:0;background:rgba(20,14,10,.38);z-index:40;opacity:0;transition:opacity .18s}" +
    ".navback.on{opacity:1}" +
    ".topnav nav{position:absolute;left:8px;right:8px;top:calc(100% + 6px);max-width:380px;background:var(--card,#fff);border:1px solid var(--line,#ccc);border-radius:16px;box-shadow:0 14px 36px rgba(20,14,10,.22);padding:8px;max-height:calc(100vh - 80px);overflow:auto}" +
    ".topnav nav[hidden]{display:none}" +
    ".topnav nav a{display:flex;align-items:center;gap:14px;padding:11px 14px;min-height:48px;border-radius:10px;color:inherit;text-decoration:none;font-size:16px}" +
    ".topnav nav a svg{flex:none;color:var(--accent,#8A6A4A)}" +
    ".topnav nav a:hover{background:var(--bg,#f5f5f5)}" +
    ".topnav nav a.child{margin-left:23px;padding:6px 12px 6px 18px;min-height:38px;border-radius:0 10px 10px 0;border-left:1px solid var(--line,#ccc);font-size:14.5px;color:var(--mut,#666)}" +
    ".topnav nav a[aria-current=page]{background:var(--bg,#f5f5f5);font-weight:600;color:var(--ink,#000)}" +
    ".topnav nav a.child[aria-current=page]{border-left:2px solid var(--accent,#8A6A4A)}" +
    ".topnav a:focus-visible,.topnav button:focus-visible{outline:2px solid currentColor;outline-offset:-2px}" +
    ".crumbs{font-size:13px;color:var(--mut,#666);margin:0 0 14px}.crumbs a{color:inherit}.crumbs span{margin:0 6px}" +
    ".pager{display:flex;justify-content:space-between;gap:12px;margin-top:56px;padding-top:20px;border-top:1px solid var(--line,#ccc)}" +
    ".pager a{display:block;flex:1;max-width:48%;padding:12px 16px;border:1px solid var(--line,#ccc);border-radius:10px;background:var(--card,#fff);color:inherit;text-decoration:none}" +
    ".pager a small{display:block;font-size:12px;color:var(--mut,#666)}.pager a.nx{text-align:right;margin-left:auto}" +
    ".pager a:hover{border-color:var(--ink,#000)}";
  document.head.appendChild(css);

  function svgEl(size, inner) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size); s.setAttribute("height", size);
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.8");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
    inner(s); return s;
  }
  function pathEl(d, extra) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); if (extra) for (var k in extra) p.setAttribute(k, extra[k]); return p; }
  function icon(name, size) {
    return svgEl(size || 22, function (s) {
      if (name === "book") {   // a coffee bean: oval with a pronounced S-crease
        var g = document.createElementNS(NS, "g"); g.setAttribute("transform", "rotate(32 12 12)");
        var e = document.createElementNS(NS, "ellipse"); e.setAttribute("cx", 12); e.setAttribute("cy", 12); e.setAttribute("rx", 5.6); e.setAttribute("ry", 9);
        g.appendChild(e); g.appendChild(pathEl("M12 3.2c-4.2 3.800 4.2 6.200 0 8.800s4.2 5 0 8.800")); s.appendChild(g);
      } else s.appendChild(pathEl(ICONS[name] || ICONS.home));
    });
  }
  window.altoIcon = icon;

  // The wordmark: the two A's of ALTO ANDINO are little mountain ranges.
  function mountainA() {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "1 2 21.5 16.5"); s.setAttribute("class", "ma"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2.4");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    s.appendChild(pathEl("M2.5 18L12 3l9.5 15 M7.6 12.8l2.4 1.8 2-1.8 2 1.8 2.4-1.8"));
    return s;
  }
  function wordmark(host, text) {
    var t = text || host.textContent || BRAND;
    host.textContent = ""; host.classList.add("wm"); host.setAttribute("aria-label", "Alto Andino");
    t.toUpperCase().split("").forEach(function (ch) {
      host.appendChild(ch === "A" ? mountainA() : document.createTextNode(ch));
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-wordmark]"), function (h) { wordmark(h); });

  var ICON_MENU = "M4 7h16M4 12h16M4 17h16", ICON_CLOSE = "M6 6l12 12M18 6L6 18";
  var head = document.createElement("header");
  head.className = "topnav";
  var bar = document.createElement("div");
  bar.className = "bar";
  var btn = document.createElement("button");
  btn.className = "iconbtn"; btn.type = "button";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "navmenu");
  btn.appendChild(svgEl(24, function (s) { s.appendChild(pathEl(ICON_MENU)); }));
  var where = document.createElement("a");
  where.className = "where"; where.href = root + "index.html";
  if (!isHome) {
    var logo = svgEl(24, function (s) { s.appendChild(pathEl(PEAKS, { "stroke-width": "2" })); }); logo.setAttribute("class", "logo");
    where.appendChild(logo);
    var nm = document.createElement("span"); where.appendChild(nm); wordmark(nm, BRAND);
  } else where.setAttribute("aria-hidden", "true");
  bar.appendChild(btn); bar.appendChild(where);
  if (!isCalc) {   // shortcut to the calculator, on every page
    var cb = document.createElement("a");
    cb.className = "iconbtn"; cb.href = root + "calc/index.html"; cb.setAttribute("aria-label", "Calculator"); cb.title = "Calculator";
    cb.appendChild(icon("calc", 24)); bar.appendChild(cb);
  }
  if (!isHome) {
    var home = document.createElement("a");
    home.className = "iconbtn"; home.href = root + "index.html"; home.setAttribute("aria-label", "Home");
    home.appendChild(icon("home", 24)); bar.appendChild(home);
  }

  var menu = document.createElement("nav");
  menu.id = "navmenu"; menu.hidden = true; menu.setAttribute("aria-label", "Main");
  var links = [];
  function addLink(key, label, href, sub, ic) {
    var a = document.createElement("a");
    a.href = root + href; a.dataset.k = key;
    if (sub) a.className = "child"; else a.appendChild(icon(ic, 22));
    a.appendChild(document.createTextNode(label));
    menu.appendChild(a); links.push(a);
  }
  ITEMS.forEach(function (it) {
    addLink(it[0], it[1], it[2], false, it[0]);
    if (it[0] === "book") CHAPTERS.forEach(function (c) { addLink("ch-" + c[0], c[1], "chapters/" + c[0] + ".html", true); });
  });
  head.appendChild(bar); head.appendChild(menu);
  var back = document.createElement("div"); back.className = "navback"; back.hidden = true;
  document.body.insertAdjacentElement("afterbegin", back);
  document.body.insertAdjacentElement("afterbegin", head);

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector("path").setAttribute("d", open ? ICON_CLOSE : ICON_MENU);
    if (open) { back.hidden = false; requestAnimationFrame(function () { back.classList.add("on"); }); }
    else { back.classList.remove("on"); back.hidden = true; }
  }
  function current() {
    if (inBook) return chapter ? "ch-" + chapter : "book";
    if (/\/journal\//.test(path)) return location.hash === "#log" ? "log" : "journal";
    if (/\/trends\//.test(path)) return "trends";
    if (isCalc) return "calc";
    return "home";
  }
  function markActive() {
    var now = current();
    links.forEach(function (a) { if (a.dataset.k === now) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }
  btn.addEventListener("click", function () { setOpen(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  back.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("click", function (e) { if (!head.contains(e.target) && !menu.hidden) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
  window.addEventListener("hashchange", markActive);
  markActive();

  // Book pages: breadcrumbs on top, previous/next at the bottom.
  var main = document.querySelector("main");
  if (inBook && main) {
    var cr = document.createElement("p");
    cr.className = "crumbs";
    var crumb = function (label, href) { var a = document.createElement("a"); a.textContent = label; a.href = root + href; cr.appendChild(a); };
    var sep = function () { var s = document.createElement("span"); s.textContent = "›"; s.setAttribute("aria-hidden", "true"); cr.appendChild(s); };
    crumb("Home", "index.html"); sep();
    if (chapter) {
      crumb(BOOK, "chapters/index.html"); sep();
      var cl = CHAPTERS.filter(function (c) { return c[0] === chapter; })[0];
      cr.appendChild(document.createTextNode(cl ? cl[1] : chapter));
    } else cr.appendChild(document.createTextNode(BOOK));
    main.insertBefore(cr, main.firstChild);

    var idx = -1; CHAPTERS.forEach(function (c, i) { if (c[0] === chapter) idx = i; });
    if (idx >= 0) {
      var pg = document.createElement("nav");
      pg.className = "pager"; pg.setAttribute("aria-label", "Chapters");
      var pl = function (c, cls, dir) {
        var a = document.createElement("a"); a.className = cls; a.href = root + "chapters/" + c[0] + ".html";
        var s = document.createElement("small"); s.textContent = dir; a.appendChild(s); a.appendChild(document.createTextNode(c[1])); pg.appendChild(a);
      };
      if (idx > 0) pl(CHAPTERS[idx - 1], "pv", "← Previous");
      if (idx < CHAPTERS.length - 1) pl(CHAPTERS[idx + 1], "nx", "Next →");
      main.appendChild(pg);
    }
  }
})();
