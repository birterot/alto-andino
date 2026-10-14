/* Top bar with a burger menu, shared by every page, plus breadcrumbs and previous/next links in the book chapters.
   Add <script src="PATH/assets/js/nav.js" defer></script> to a page to get it.
   To rename a section or add a menu entry, change the lists right below. */
(function () {
  var root = new URL("../../", document.currentScript.src).href;
  var BRAND = "Alto Andino";  // shown in the top bar of every page except the home page
  var BOOK = "Bean to cup";   // the name of the notes-from-the-book section
  var ITEMS = [               // key, label, link
    ["home", "Home", "index.html"],
    ["log", "Log a brew", "journal/index.html#log"],
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
  var isHome = !inBook && !/\/(journal|trends)\//.test(path);

  var css = document.createElement("style");
  css.textContent =
    ".topnav{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;background:var(--bg,#fff);border-bottom:1px solid var(--line,#ccc)}" +
    ".topnav .bar{display:flex;align-items:center;gap:4px;max-width:900px;margin:0 auto;padding:6px 8px}" +
    ".topnav .iconbtn{width:44px;height:44px;display:grid;place-items:center;background:none;border:0;color:inherit;cursor:pointer;border-radius:8px;text-decoration:none;flex:none}" +
    ".topnav .where{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;font-family:'Iowan Old Style',Palatino,Georgia,serif;font-size:16px;letter-spacing:.14em;text-transform:uppercase;color:inherit;text-decoration:none}.topnav .where svg{color:var(--accent,#8A6A4A)}" +
    ".topnav nav{position:absolute;left:0;right:0;top:100%;background:var(--card,#fff);border-bottom:1px solid var(--line,#ccc);max-height:calc(100vh - 60px);overflow:auto}" +
    ".topnav nav[hidden]{display:none}" +
    ".topnav nav a{display:block;max-width:900px;margin:0 auto;padding:14px 20px;min-height:48px;color:inherit;text-decoration:none;font-size:17px}" +
    ".topnav nav a.sub{padding:10px 20px 10px 44px;min-height:44px;font-size:15px;color:var(--mut,#666)}" +
    ".topnav nav a[aria-current=page]{font-weight:600;background:var(--bg,#f5f5f5);color:inherit}" +
    ".topnav a:focus-visible,.topnav button:focus-visible{outline:2px solid currentColor;outline-offset:-2px}" +
    ".crumbs{font-size:13px;color:var(--mut,#666);margin:0 0 14px}.crumbs a{color:inherit}.crumbs span{margin:0 6px}" +
    ".pager{display:flex;justify-content:space-between;gap:12px;margin-top:56px;padding-top:20px;border-top:1px solid var(--line,#ccc)}" +
    ".pager a{display:block;flex:1;max-width:48%;padding:12px 16px;border:1px solid var(--line,#ccc);border-radius:10px;background:var(--card,#fff);color:inherit;text-decoration:none}" +
    ".pager a small{display:block;font-size:12px;color:var(--mut,#666)}.pager a.nx{text-align:right;margin-left:auto}" +
    ".pager a:hover{border-color:var(--ink,#000)}";
  document.head.appendChild(css);

  var svg = function (d) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  var ICON_MENU = "M4 7h16M4 12h16M4 17h16", ICON_CLOSE = "M6 6l12 12M18 6L6 18", ICON_HOME = "M4 11l8-7 8 7M6 10v10h4v-6h4v6h4V10", ICON_PEAKS = "M2 19l7-11 4 6 3-4 6 9z";

  var head = document.createElement("header");
  head.className = "topnav";
  var bar = document.createElement("div");
  bar.className = "bar";
  var btn = document.createElement("button");
  btn.className = "iconbtn"; btn.type = "button";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "navmenu");
  btn.innerHTML = svg(ICON_MENU);
  var where = document.createElement("a");
  where.className = "where"; where.href = root + "index.html";
  if (!isHome) { where.innerHTML = svg(ICON_PEAKS); where.appendChild(document.createTextNode(BRAND)); } else where.setAttribute("aria-hidden", "true");
  bar.appendChild(btn); bar.appendChild(where);
  if (!isHome) {
    var home = document.createElement("a");
    home.className = "iconbtn"; home.href = root + "index.html"; home.setAttribute("aria-label", "Home");
    home.innerHTML = svg(ICON_HOME); bar.appendChild(home);
  }

  var menu = document.createElement("nav");
  menu.id = "navmenu"; menu.hidden = true; menu.setAttribute("aria-label", "Main");
  var links = [];
  function addLink(key, label, href, sub) {
    var a = document.createElement("a");
    a.href = root + href; a.textContent = label; a.dataset.k = key;
    if (sub) a.className = "sub";
    menu.appendChild(a); links.push(a);
  }
  ITEMS.forEach(function (it) {
    addLink(it[0], it[1], it[2], false);
    if (it[0] === "book") CHAPTERS.forEach(function (c) { addLink("ch-" + c[0], c[1], "chapters/" + c[0] + ".html", true); });
  });
  head.appendChild(bar); head.appendChild(menu);
  document.body.insertAdjacentElement("afterbegin", head);

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector("path").setAttribute("d", open ? ICON_CLOSE : ICON_MENU);
  }
  function current() {
    if (inBook) return chapter ? "ch-" + chapter : "book";
    if (/\/journal\//.test(path)) return location.hash === "#log" ? "log" : "journal";
    if (/\/trends\//.test(path)) return "trends";
    return "home";
  }
  function markActive() {
    var now = current();
    links.forEach(function (a) {
      if (a.dataset.k === now) { a.setAttribute("aria-current", "page"); } else a.removeAttribute("aria-current");
    });
  }
  btn.addEventListener("click", function () { setOpen(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", function (e) { if (!head.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
  window.addEventListener("hashchange", markActive);
  markActive();

  // Book pages: breadcrumbs on top, previous/next at the bottom.
  var main = document.querySelector("main");
  if (inBook && main) {
    var cr = document.createElement("p");
    cr.className = "crumbs";
    function crumb(label, href) { var a = document.createElement("a"); a.textContent = label; a.href = root + href; cr.appendChild(a); }
    function sep() { var s = document.createElement("span"); s.textContent = "›"; s.setAttribute("aria-hidden", "true"); cr.appendChild(s); }
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
      function pl(c, cls, dir) {
        var a = document.createElement("a"); a.className = cls; a.href = root + "chapters/" + c[0] + ".html";
        var s = document.createElement("small"); s.textContent = dir; a.appendChild(s); a.appendChild(document.createTextNode(c[1])); pg.appendChild(a);
      }
      if (idx > 0) pl(CHAPTERS[idx - 1], "pv", "← Previous");
      if (idx < CHAPTERS.length - 1) pl(CHAPTERS[idx + 1], "nx", "Next →");
      main.appendChild(pg);
    }
  }
})();
