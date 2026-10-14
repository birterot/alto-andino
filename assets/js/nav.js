/* Top bar with a burger menu, shared by every page.
   Add <script src="PATH/assets/js/nav.js" defer></script> to a page to get it.
   To add a menu entry, add one line to ITEMS. */
(function () {
  var root = new URL("../../", document.currentScript.src).href;
  var ITEMS = [
    ["atlas", "Atlas", "index.html"],
    ["journal", "Journal", "journal/index.html"],
    ["log", "Log a brew", "journal/index.html#log"],
    ["trends", "Trends", "trends/index.html"]
  ];

  var css = document.createElement("style");
  css.textContent =
    ".topnav{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;background:var(--bg,#fff);border-bottom:1px solid var(--line,#ccc)}" +
    ".topnav .bar{display:flex;align-items:center;gap:8px;max-width:900px;margin:0 auto;padding:6px 8px}" +
    ".topnav .burger{width:44px;height:44px;display:grid;place-items:center;background:none;border:0;color:inherit;cursor:pointer;border-radius:8px}" +
    ".topnav .brand{font-family:'Iowan Old Style',Palatino,Georgia,serif;font-weight:500;font-size:19px;letter-spacing:.01em;color:inherit;text-decoration:none}" +
    ".topnav nav{position:absolute;left:0;right:0;top:100%;background:var(--card,#fff);border-bottom:1px solid var(--line,#ccc)}" +
    ".topnav nav[hidden]{display:none}" +
    ".topnav nav a{display:block;max-width:900px;margin:0 auto;padding:14px 20px;min-height:48px;color:inherit;text-decoration:none;font-size:17px}" +
    ".topnav nav a[aria-current=page]{font-weight:600;background:var(--bg,#f5f5f5)}" +
    ".topnav a:focus-visible,.topnav button:focus-visible{outline:2px solid currentColor;outline-offset:-2px}";
  document.head.appendChild(css);

  var head = document.createElement("header");
  head.className = "topnav";
  var bar = document.createElement("div");
  bar.className = "bar";
  var btn = document.createElement("button");
  btn.className = "burger"; btn.type = "button";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "navmenu");
  var ICON_MENU = "M4 7h16M4 12h16M4 17h16", ICON_CLOSE = "M6 6l12 12M18 6L6 18";
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="' + ICON_MENU + '"/></svg>';
  var brand = document.createElement("a");
  brand.className = "brand"; brand.href = root + "index.html"; brand.textContent = "Coffee atlas";
  bar.appendChild(btn); bar.appendChild(brand);

  var menu = document.createElement("nav");
  menu.id = "navmenu"; menu.hidden = true; menu.setAttribute("aria-label", "Main");
  var links = ITEMS.map(function (it) {
    var a = document.createElement("a");
    a.href = root + it[2]; a.textContent = it[1]; a.dataset.k = it[0];
    menu.appendChild(a);
    return a;
  });
  head.appendChild(bar); head.appendChild(menu);
  document.body.insertAdjacentElement("afterbegin", head);

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector("path").setAttribute("d", open ? ICON_CLOSE : ICON_MENU);
  }
  function markActive() {
    var p = location.pathname;
    var now = /\/journal\//.test(p) ? (location.hash === "#log" ? "log" : "journal") : /\/trends\//.test(p) ? "trends" : "atlas";
    links.forEach(function (a) {
      if (a.dataset.k === now) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  btn.addEventListener("click", function () { setOpen(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", function (e) { if (!head.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
  window.addEventListener("hashchange", markActive);
  markActive();
})();
