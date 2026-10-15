/* How flavour scores are stored and shown.
   Sour, sweet, bitter and balance are shown from -5 to +5 (0 = just right) and stored as 0 to 10 (5 = just right),
   so nothing already saved changes.
   Tasting notes are none / light / present. Stored as nothing / 3 / 7, shown as none / light / present. */
window.SCALE = (function () {
  var CORE = ["sour", "sweet", "bitter", "balance"];
  var LEVELS = [["none", 0], ["light", 3], ["present", 7]];   // [label, stored value]
  var isCore = function (a) { return CORE.indexOf(a) >= 0; };
  return {
    CORE: CORE, LEVELS: LEVELS, isCore: isCore,
    // stored -> the number shown on the -5..+5 slider (core only)
    toShown: function (a, v) { return isCore(a) ? v - 5 : v; },
    toStored: function (a, shown) { return isCore(a) ? shown + 5 : shown; },
    // old slider-era note values (0-10) -> nearest level index
    levelOf: function (stored) { return stored == null || stored <= 0 ? 0 : stored <= 4 ? 1 : 2; },
    // value on the trends chart (-5..+5): core minus 5, notes half of the stored value (light 1.5, present 3.5)
    chart: function (a, stored) { return isCore(a) ? stored - 5 : stored / 2; },
    text: function (a, stored) {
      if (isCore(a)) { var n = stored - 5; return (n > 0 ? "+" : "") + n; }
      return LEVELS[this.levelOf(stored)][0];
    }
  };
})();
