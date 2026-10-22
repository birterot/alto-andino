/* How much caffeine a brew has: an estimate, with a range, because coffee varies a lot.
   caffeine = grams of coffee x caffeine in the beans x how much of it the method pulls out
   - Beans (roasted): arabica about 1.2 % (12 mg per gram), robusta about 2.2 %, a blend with robusta about 1.6 %,
     decaf at most 0.1 % (we count 0.05 %). Darker roasts have a little more per gram (they lost water and mass), lighter a little less.
   - Pulled out: caffeine dissolves easily, so filter coffee gets almost all of it (about 95 %), immersion (French press,
     AeroPress, Clever) about 90 %, moka and cold brew about 85 %. Espresso depends on the yield: a ristretto (1:1) about 65 %,
     a normal shot (1:2) about 75 %, a lungo (1:3) about 85 %.
   - The range: beans of the same kind differ by about a quarter either way, espresso even more (cafe espressos have been
     measured from about 50 to over 300 mg). So "low" and "high" are the estimate minus and plus 25 % (30 % for espresso).
   A brew is { g: dose in grams, y: yield in g, w: water in g, dv: device name, k: "decaf" | "robusta" | "blend" | "", rl: roast level }. */
window.CAFFEINE = (function () {
  var MGG = { "": 12, arabica: 12, blend: 16, robusta: 22, decaf: 0.5 };
  var ROAST = { light: 0.98, "medium-light": 0.99, medium: 1, "medium-dark": 1.02, dark: 1.04 };
  function kind(name) {   // the same groups as the brew form (data/devices.js), by the name alone
    var n = String(name || "").toLowerCase();
    if (/cold ?brew/.test(n)) return "cold";
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
  return { mg: mg, kind: kind, pulled: pulled };
})();
