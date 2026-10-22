/* How flavour scores are stored and shown.
   Sour, sweet and bitter are shown from -5 to +5 (0 = just right) and stored as 0 to 10 (5 = just right),
   and so is body (minus = watery or thin, plus = heavy or too strong), for the brewing chart in Trends,
   so nothing already saved changes. (Balance used to be a fourth slider like these; old balance scores keep
   that meaning and are still read, but new brews rate Balance on its own 0 to 5 scale, see BALANCE below.)
   Tasting notes are none / light / present. Stored as nothing / 3 / 7, shown as none / light / present. */
window.SCALE = (function () {
  var CORE = ["sour", "sweet", "bitter", "body", "balance"];   // everything stored on the -5..+5 slider scale (balance: old brews only)
  var PROFILE = ["sour", "sweet", "bitter"];           // the taste sliders
  // Balance: how well the flavours come together (harmony, not intensity), rated on its own from 0 to 5, or not at all.
  // Not worked out from sour, sweet or bitter. Saved per taster with their stars (brew_ratings.balance).
  var BALANCE = [
    [0, "Completely unbalanced", "The flavours feel disconnected, clash, or one characteristic overwhelmingly dominates."],
    [1, "Very unbalanced", "The flavours work poorly together, with noticeable disharmony."],
    [2, "Somewhat unbalanced", "Some harmony exists, but the components do not fully complement one another."],
    [3, "Fairly balanced", "The flavours generally work together, with some minor imbalance."],
    [4, "Very well balanced", "The different characteristics complement one another harmoniously."],
    [5, "Exceptionally balanced", "The flavours are exceptionally harmonious, integrated and complementary."]
  ];
  var LEVELS = [["none", 0], ["light", 3], ["present", 7]];   // [label, stored value]
  var isCore = function (a) { return CORE.indexOf(a) >= 0; };
  return {
    CORE: CORE, PROFILE: PROFILE, BODY: "body", BALANCE: BALANCE, LEVELS: LEVELS, isCore: isCore,
    balanceText: function (v) { return v === null || v === undefined || v === "" ? "" : (Math.round(v * 10) / 10) + "/5"; },
    balanceName: function (v) { var b = BALANCE[Math.round(v)]; return b ? b[1] : ""; },
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
