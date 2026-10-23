// Dropdown lists and colours for the coffee journal.
//
// Add a process: add a line to "process" with six colours
//   [fill light, fill dark, line light, line dark, text light, text dark]
// or use null for the neutral grey.
// Add a roast level: add its name to "roast". Add a brewing device: add its name to "device".
//
// You do not have to edit this file to use a new process or roast level:
// pick "Other (add new)" in the app and it is remembered for next time (in grey).
window.LISTS = {
  process: {   // Japandi colours: [fill light, fill dark, line light, line dark, text light, text dark]
    "Washed":         ["#E4EAE0", "#243026", "#4F6B55", "#9DB8A1", "#34493A", "#C5D6C7"],
    "Pulped natural": ["#E9EBD9", "#2B2E1B", "#6B7442", "#B4BC83", "#4B5230", "#D3D8B0"],
    "Honey":          ["#F0E6D0", "#3A2E17", "#8F6A2B", "#D6AE6A", "#6B4F1F", "#EBD3A3"],
    "Natural":        ["#EFDDD2", "#3C261D", "#94512F", "#D79A7A", "#6E3A22", "#EDC4AE"],
    "Semi-washed":    ["#E0E5E8", "#232B31", "#4F6572", "#9DB1BD", "#364651", "#C4D2DB"]
  },
  roast: ["Light", "Medium-light", "Medium", "Medium-dark", "Dark"],
  // extra devices for the brew form, besides the ones in data/devices.js (French press, AeroPress, V60, Chemex,
  // pour-over, moka pot, manual and semi-automatic espresso machine). Anyone can add their own with "Other (add new)".
  device: ["Kalita Wave", "Clever Dripper", "Cold brew", "Filter coffee machine", "Fully automatic machine"]
};
