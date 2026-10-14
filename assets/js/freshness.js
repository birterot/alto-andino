/* Renders chapters/freshness.html from window.FRESHNESS (data/freshness.js). */
(function () {
  var F = window.FRESHNESS, $ = function (i) { return document.getElementById(i); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  $("ct").textContent = F.title; $("cs").textContent = F.sub;
  F.RULES.forEach(function (r) { $("rules").appendChild(el("li", "", r)); });
  $("dark").textContent = F.DARK;
  F.STORAGE.forEach(function (r, i) { $("store").appendChild(el("li", i === F.STORAGE_WARN ? "warn" : "", r)); });

  var d = $("rd"), out = $("res");
  function fmt(dt) { return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function add(dt, n) { var x = new Date(dt.getTime()); x.setDate(x.getDate() + n); return x; }
  function line(label, value) { var p = el("div"); p.appendChild(el("span", "", label + " ")); p.appendChild(el("b", "", value)); return p; }
  function calc() {
    out.textContent = "";
    if (!d.value) return;
    var p = d.value.split("-").map(Number), r = new Date(p[0], p[1] - 1, p[2]);
    if (isNaN(r)) return;
    var t = new Date(); t = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    var days = Math.round((t - r) / 864e5);
    if (days < 0) { out.appendChild(line("That roast date is in the future.", "")); return; }
    out.appendChild(line("Roasted", days + (days === 1 ? " day ago" : " days ago")));
    out.appendChild(line("Buy by", fmt(add(r, F.BUY_DAYS))));
    out.appendChild(line("Use up by", fmt(add(r, F.USE_DAYS))));
    var late = days > F.USE_DAYS ? "Past a month: this coffee is likely stale." : days > F.BUY_DAYS ? "Past the two-week buying window. Use it soon." : "Still in the sweet spot.";
    out.appendChild(el("p", "mut", late + " Darker roasts go stale faster."));
  }
  d.addEventListener("input", calc); calc();
})();
