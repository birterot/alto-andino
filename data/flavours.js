/* Tasting notes, grouped like the families of a coffee flavour wheel (loosely after the SCA wheel).
   Used to pick notes on the Coffee Shelf, and later to place your notes on a wheel in Trends.
   FLAVOURS.families: [name, [notes...]]; FLAVOURS.familyOf(note) -> the family's name, or null. */
window.FLAVOURS = (function () {
  var families = [
    ["Floral", ["floral", "jasmine", "rose", "chamomile", "orange blossom", "elderflower", "lavender", "hibiscus", "black tea"]],
    ["Berry", ["red fruit", "blackberry", "raspberry", "blueberry", "strawberry", "blackcurrant", "redcurrant", "cranberry"]],
    ["Fruit", ["cherry", "grape", "apple", "pear", "peach", "apricot", "plum", "pineapple", "mango", "passion fruit", "lychee", "melon", "tropical fruit", "stone fruit"]],
    ["Citrus", ["citrus", "lemon", "lime", "orange", "grapefruit", "bergamot", "mandarin"]],
    ["Dried fruit", ["raisin", "prune", "fig", "date", "dried fruit"]],
    ["Fermented", ["winey", "whisky", "rum", "fermented", "boozy"]],
    ["Green", ["herbal", "green tea", "grassy", "fresh herbs", "olive", "cucumber"]],
    ["Sweet", ["sweet", "caramel", "brown sugar", "honey", "maple syrup", "molasses", "vanilla", "toffee", "marzipan", "candy"]],
    ["Nutty & cocoa", ["nutty", "almond", "hazelnut", "peanut", "walnut", "pecan", "chocolate", "chocolaty", "dark chocolate", "milk chocolate", "cocoa"]],
    ["Spice", ["spicy", "cinnamon", "clove", "nutmeg", "cardamom", "black pepper", "anise", "ginger"]],
    ["Roasted", ["toast", "malt", "cereal", "biscuit", "smoky", "tobacco", "roasted"]]
  ];
  var idx = {};
  families.forEach(function (f) { f[1].forEach(function (n) { idx[n] = f[0]; }); });
  // a note that is not in the list: by a word in it ("dark cherry" is fruit, "lemon zest" citrus)
  function familyOf(note) {
    var n = String(note || "").trim().toLowerCase(); if (!n) return null;
    if (idx[n]) return idx[n];
    var words = n.split(/[\s-]+/);
    for (var i = words.length - 1; i >= 0; i--) if (idx[words[i]]) return idx[words[i]];
    for (var k in idx) if (n.indexOf(k) >= 0) return idx[k];
    return null;
  }
  return { families: families, familyOf: familyOf };
})();
