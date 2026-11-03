/* Tasting notes, as on the Coffee Taster's Flavor Wheel of the SCA and World Coffee Research (2016, built on the WCR
   Sensory Lexicon): 9 families inside, their groups in the middle, the notes outside, in the wheel's order and colours.
   "extra": words roasters often use that are not on the SCA wheel; they sit with the nearest group, can be picked,
   but do not count as notes of the wheel ("found 18 of 75").
   FLAVOURS.wheel       [{ f, col, count, groups: [{ g, notes: [...], extra: [...] }] }]   (count: false = defects, left out of the count)
   FLAVOURS.families    [family, [every note of it, the wheel's first, then the extras]]
   FLAVOURS.familyOf(n) the family of a note (also from a word in it: "dark cherry" is Fruity), or null
   FLAVOURS.groupOf(n)  its group ("Berry"), FLAVOURS.onWheel(n): one of the wheel's own notes
   FLAVOURS.family(n)   a family name, also an older one of this app ("Berry" -> "Fruity") */
window.FLAVOURS = (function () {
  var wheel = [
    { f: "Floral", col: "#DA1D81", groups: [
      { g: "Black tea", notes: ["black tea"] },
      { g: "Floral", notes: ["chamomile", "rose", "jasmine"], extra: ["floral", "orange blossom", "elderflower", "lavender", "hibiscus"] }] },
    { f: "Fruity", col: "#DA2A2C", groups: [
      { g: "Berry", notes: ["blackberry", "raspberry", "blueberry", "strawberry"], extra: ["berry", "red fruit", "blackcurrant", "redcurrant", "cranberry"] },
      { g: "Dried fruit", notes: ["raisin", "prune"], extra: ["dried fruit", "fig", "date"] },
      { g: "Other fruit", notes: ["coconut", "cherry", "pomegranate", "pineapple", "grape", "apple", "peach", "pear"], extra: ["fruity", "apricot", "plum", "mango", "passion fruit", "lychee", "melon", "stone fruit", "tropical fruit"] },
      { g: "Citrus fruit", notes: ["grapefruit", "orange", "lemon", "lime"], extra: ["citrus", "bergamot", "mandarin"] }] },
    { f: "Sour/Fermented", col: "#D9B81B", groups: [
      { g: "Sour", notes: ["sour aromatics", "acetic acid", "butyric acid", "isovaleric acid", "citric acid", "malic acid"] },
      { g: "Alcohol/Fermented", notes: ["winey", "whiskey", "fermented", "overripe"], extra: ["whisky", "rum", "boozy"] }] },
    { f: "Green/Vegetative", col: "#1E7B3A", groups: [
      { g: "Olive oil", notes: ["olive oil"] },
      { g: "Raw", notes: ["raw"] },
      { g: "Green/Vegetative", notes: ["under-ripe", "peapod", "fresh", "dark green", "vegetative", "hay-like", "herb-like"], extra: ["herbal", "green tea", "grassy", "cucumber"] },
      { g: "Beany", notes: ["beany"] }] },
    { f: "Other", col: "#1D9EB3", count: false, groups: [
      { g: "Papery/Musty", notes: ["stale", "cardboard", "papery", "woody", "moldy/damp", "musty/dusty", "musty/earthy", "animalic"] },
      { g: "Chemical", notes: ["bitter", "salty", "medicinal", "petroleum", "skunky", "rubber"] }] },
    { f: "Roasted", col: "#C4502E", groups: [
      { g: "Pipe tobacco", notes: ["pipe tobacco"] },
      { g: "Tobacco", notes: ["tobacco"] },
      { g: "Burnt", notes: ["acrid", "ashy", "smoky", "brown roast"], extra: ["roasted", "dark roast"] },
      { g: "Cereal", notes: ["grain", "malt"], extra: ["cereal", "toast", "biscuit"] }] },
    { f: "Spices", col: "#A8243F", groups: [
      { g: "Pungent", notes: ["pungent"] },
      { g: "Pepper", notes: ["black pepper"] },
      { g: "Brown spice", notes: ["anise", "nutmeg", "cinnamon", "clove"], extra: ["spicy", "cardamom", "ginger"] }] },
    { f: "Nutty/Cocoa", col: "#A5745A", groups: [
      { g: "Nutty", notes: ["peanuts", "hazelnut", "almond"], extra: ["nutty", "peanut", "walnut", "pecan"] },
      { g: "Cocoa", notes: ["chocolate", "dark chocolate"], extra: ["cocoa", "milk chocolate", "chocolaty"] }] },
    { f: "Sweet", col: "#E2622F", groups: [
      { g: "Brown sugar", notes: ["molasses", "maple syrup", "caramelized", "honey"], extra: ["brown sugar", "caramel", "toffee"] },
      { g: "Vanilla", notes: ["vanilla"] },
      { g: "Vanillin", notes: ["vanillin"] },
      { g: "Overall sweet", notes: ["overall sweet"], extra: ["sweet"] },
      { g: "Sweet aromatics", notes: ["sweet aromatics"], extra: ["marzipan", "candy"] }] }
  ];
  var fam = {}, grp = {}, own = {};
  wheel.forEach(function (w) {
    if (w.count == null) w.count = true;
    w.groups.forEach(function (g) {
      g.extra = g.extra || [];
      g.notes.forEach(function (n) { fam[n] = w.f; grp[n] = g.g; own[n] = true; });
      g.extra.forEach(function (n) { if (!fam[n]) { fam[n] = w.f; grp[n] = g.g; } });
    });
  });
  var families = wheel.map(function (w) { var a = []; w.groups.forEach(function (g) { a = a.concat(g.notes); }); w.groups.forEach(function (g) { a = a.concat(g.extra); }); return [w.f, a]; });
  // the family names this app used before it followed the SCA wheel
  var OLD = { "berry": "Fruity", "fruit": "Fruity", "citrus": "Fruity", "dried fruit": "Fruity", "fermented": "Sour/Fermented", "green": "Green/Vegetative",
    "spice": "Spices", "nutty & cocoa": "Nutty/Cocoa" };
  function family(name) {
    var n = String(name || "").trim(); if (!n) return null;
    for (var i = 0; i < wheel.length; i++) if (wheel[i].f.toLowerCase() === n.toLowerCase()) return wheel[i].f;
    return OLD[n.toLowerCase()] || null;
  }
  function find(note, map) {   // the note, or the last word of it that is a note ("roasted hazelnut": hazelnut)
    var n = String(note || "").trim().toLowerCase(); if (!n) return null;
    if (map[n]) return map[n];
    var words = n.split(/[\s-]+/);
    for (var i = words.length - 1; i >= 0; i--) if (map[words[i]]) return map[words[i]];
    for (var k in map) if (k.length > 3 && n.indexOf(k) >= 0) return map[k];
    return null;
  }
  return { wheel: wheel, families: families, family: family,
    familyOf: function (n) { return find(n, fam); }, groupOf: function (n) { return find(n, grp); },
    onWheel: function (n) { return !!own[String(n || "").trim().toLowerCase()]; },
    colour: function (f) { for (var i = 0; i < wheel.length; i++) if (wheel[i].f === f) return wheel[i].col; return null; } };
})();
