/* Caffeine, in one place: how much a brew has (an estimate, with a range, because coffee varies a lot) and how it
   wears off in the body. Used by Home (the note and its curve), the Coffee Shelf (which keeps the recent brews for Home)
   and the page settings/caffeine.html (its tables and "Try it").
   caffeine = grams of coffee x caffeine in the beans x how much of it the method pulls out
   - Beans (roasted): arabica about 1.2 % (12 mg per gram), robusta about 2.2 %, a blend with robusta about 1.6 %,
     decaf at most 0.1 % (we count 0.05 %). Darker roasts have a little more per gram (they lost water and mass), lighter a little less.
   - Pulled out: caffeine dissolves easily, so filter coffee gets almost all of it (about 95 %), immersion (French press,
     AeroPress, Clever) about 90 %, moka and cold brew about 85 %. Espresso depends on the yield: a ristretto (1:1) about 65 %,
     a normal shot (1:2) about 75 %, a lungo (1:3) about 85 %.
   - The range: beans of the same kind differ by about a quarter either way, espresso even more (cafe espressos have been
     measured from about 50 to over 300 mg). So "low" and "high" are the estimate minus and plus 25 % (30 % for espresso).
   - In the body: it rises for about 45 minutes, then halves about every 5 hours (a one-compartment curve, absorption
     4.5 per hour). People differ a lot (the 5 hours can be 2 to 10), so this is a rough average.
   A brew is { g: dose in grams, y: yield in g, w: water in g, dv: device name, k: "decaf" | "robusta" | "blend" | "", rl: roast level },
   plus for Home: t (brewed at), m (made by), r (who it is for: ids, "g" for a guest), rt (when each of them drank it, or null). */
window.CAFFEINE = (function () {
  var MGG = { "": 12, arabica: 12, blend: 16, robusta: 22, decaf: 0.5 };
  var ROAST = { light: 0.98, "medium-light": 0.99, medium: 1, "medium-dark": 1.02, dark: 1.04 };
  function kind(name) {   // the device groups of the brew form; Home has no device list, so the name rules are repeated here
    var n = String(name || "").toLowerCase();
    if (/cold ?brew/.test(n)) return "cold";
    if (window.DEVICES && DEVICES.typeOf) { var t = DEVICES.typeOf(name); if (t) return t; }
    if (/moka|bialetti|stove.?top|caffettiera/.test(n)) return "moka";
    if (/clever|switch|aeropress|french|\bpress\b|immersion|siphon|syphon|vacuum|cezve|ibrik|turkish|steep/.test(n)) return "immersion";
    if (/filter|drip|pour/.test(n)) return "filter";
    if (/espresso|automatic|bean.?to.?cup|machine|flair|lever|portafilter|siebtr|gaggia|rancilio|sage|breville|marzocco|lelit|rocket|decent|cafelat|robot|delonghi|de'longhi/.test(n)) return "espresso";
    return "filter";
  }
  function pulled(t, b) {
    if (t === "espresso") { var r = b.y > 0 && b.g > 0 ? b.y / b.g : 2; return Math.max(0.6, Math.min(0.9, 0.55 + 0.1 * r)); }
    return { moka: 0.85, cold: 0.85, immersion: 0.9, filter: 0.95 }[t] || 0.95;
  }
  function mg(b) {
    var t = kind(b.dv), g = Number(b.g) || 0;
    var per = MGG[b.k || ""] != null ? MGG[b.k || ""] : 12, roast = ROAST[String(b.rl || "").toLowerCase()] || 1;
    var m = g * per * roast * pulled(t, b), spread = t === "espresso" ? 0.3 : 0.25;
    return { mg: m, lo: m * (1 - spread), hi: m * (1 + spread), kind: t };
  }
  // the kind of beans, from the coffee on the shelf: the Decaf box, or Robusta in the variety (with another variety too: a blend)
  function species(c) {
    var v = String((c && c.variety) || "").toLowerCase();
    return c && c.is_decaf ? "decaf" : /robusta/.test(v) ? (/arabica|,/.test(v) ? "blend" : "robusta") : "";
  }
  // a saved brew (with its ratings) and its coffee, as Home needs them
  function row(b, c) {
    var rs = b.brew_ratings || [];
    return { t: b.brewed_at, g: Number(b.dose_g) || 0, y: b.yield_g == null ? null : Number(b.yield_g), w: b.water_g == null ? null : Number(b.water_g),
      dv: b.device || "", rl: (c && c.roast_level) || "", k: species(c), m: b.made_by || b.created_by || null,
      r: rs.map(function (x) { return x.is_guest ? "g" : x.rater_id; }), rt: rs.map(function (x) { return x.drank_at || null; }) };
  }
  // still counts at all: some coffee, and brewed (or drunk) since the given time (ms)
  function recent(b, since) {
    return Number(b.dose_g) > 0 && (Date.parse(b.brewed_at) >= since || (b.brew_ratings || []).some(function (x) { return x.drank_at && Date.parse(x.drank_at) >= since; }));
  }
  // how much is in you at a time (ms), from doses [{ t: ms, mg }]
  var KE = Math.LN2 / 5, KA = 4.5;
  function level(doses, at) {
    return doses.reduce(function (s, d) { var h = (at - d.t) / 36e5; return h <= 0 ? s : s + d.mg * KA / (KA - KE) * (Math.exp(-KE * h) - Math.exp(-KA * h)); }, 0);
  }
  return { mg: mg, kind: kind, pulled: pulled, species: species, row: row, recent: recent, level: level };
})();
