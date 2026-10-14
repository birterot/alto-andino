/* Japandi colours for the five processing methods, used by the journal.
   Order: [fill light, fill dark, line light, line dark, text light, text dark].
   This file overrides the colours of the same names in lists.js and leaves your own additions and device list alone. */
(function () {
  var P = {
    "Washed":         ["#E4EAE0", "#243026", "#4F6B55", "#9DB8A1", "#34493A", "#C5D6C7"],
    "Pulped natural": ["#E9EBD9", "#2B2E1B", "#6B7442", "#B4BC83", "#4B5230", "#D3D8B0"],
    "Honey":          ["#F0E6D0", "#3A2E17", "#8F6A2B", "#D6AE6A", "#6B4F1F", "#EBD3A3"],
    "Natural":        ["#EFDDD2", "#3C261D", "#94512F", "#D79A7A", "#6E3A22", "#EDC4AE"],
    "Semi-washed":    ["#E0E5E8", "#232B31", "#4F6572", "#9DB1BD", "#364651", "#C4D2DB"]
  };
  window.LISTS = window.LISTS || { process: {}, roast: [], device: [] };
  for (var k in P) window.LISTS.process[k] = P[k];
})();
