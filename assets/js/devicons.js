/* Brewing device icons, line drawings on a 24 grid, the same everywhere (Trends, the Brewing devices chapter).
   Only the device itself, never a cup.
     DEVICONS.key(name, type)        which icon a device gets (by its name, else by its kind: espresso, filter, immersion, moka)
     DEVICONS.svg(name, type, cls)   the icon as an <svg> (stroke in the text colour, sized by the page) */
window.DEVICONS = (function () {
  var P = {
    lever: "M3.5 21h15 M16 21V6 M17.5 6.8L5.5 2.8 M5.5 2.8L3 2 M10.25 4.6V8 M12.25 10.5H16 M8.25 8h4v6.5h-4z M9.25 14.5l.5 2h1l.5-2",   // a lever press (Flair): post, lever, chamber with its spout
    espresso: "M3.5 3h17v6h-17z M5 9v10.5 M19 9v10.5 M3.5 19.5h17 M9.5 9h5v2h-5z M14.5 10h3.5 M11 11v1.5 M13 11v1.5 M8 16.5h8",   // a machine with its group head, portafilter and drip tray
    chemex: "M6.5 3h11L13.4 11 17.5 21h-11l4.1-10L6.5 3z M9.6 9.5h4.8 M9.9 12.5h4.2 M12 12.5v-3",   // an hourglass with the wooden collar in its waist
    filter: "M4 5h16l-6 9h-4L4 5z M12 14v3 M7 20h10",   // a dripper
    aero: "M8 2.5h8 M9.6 2.5v6 M14.4 2.5v6 M9.6 8.5h4.8 M8.5 5.5h7v13h-7z M6.5 18.5h11 M8.5 18.5l.5 2h6l.5-2",   // the plunger in its tube, with the filter cap
    immersion: "M7 7h10v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7z M5 7h14 M12 3v8 M9.5 11h5",   // a French press
    moka: "M8 3h8l-1.2 6H9.2L8 3z M9.2 9L7 20h10L14.8 9 M17 12.5h1.5a1.5 1.5 0 010 3H17",
    cold: "M6 4h12l-1.5 16h-9L6 4z M9.5 9h3v3h-3z M13 12.5h2.5V15H13z"
  };
  function key(name, type) {
    var n = name || "";
    if (/cold ?brew/i.test(n)) return "cold";
    if (/manual espresso|lever|flair/i.test(n)) return "lever";
    if (/chemex/i.test(n)) return "chemex";
    if (/aero ?press/i.test(n)) return "aero";
    if (/french press/i.test(n)) return "immersion";
    if (/moka/i.test(n)) return "moka";
    return ({ espresso: "espresso", filter: "filter", immersion: "immersion", moka: "moka" })[type] || "filter";
  }
  function svg(name, type, cls) {
    var NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); if (cls) s.setAttribute("class", cls);
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    p.setAttribute("d", P[key(name, type)]); s.appendChild(p); return s;
  }
  return { P: P, key: key, svg: svg };
})();
