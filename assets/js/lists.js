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
  process: {
    "Washed": ["#E1F5EE","#04342C","#0F6E56","#5DCAA5","#085041","#9FE1CB"],
    "Pulped natural": ["#EAF3DE","#173404","#3B6D11","#97C459","#27500A","#C0DD97"],
    "Honey": ["#FAEEDA","#412402","#854F0B","#EF9F27","#633806","#FAC775"],
    "Natural": ["#FAECE7","#4A1B0C","#993C1D","#F0997B","#712B13","#F5C4B3"],
    "Semi-washed": ["#E6F1FB","#042C53","#185FA5","#85B7EB","#0C447C","#B5D4F4"]
  },
  roast: ["Light", "Medium-light", "Medium", "Medium-dark", "Dark"],
  // extra devices for the brew form, besides the ones in data/devices.js (French press, AeroPress, V60, Chemex,
  // pour-over, moka pot, manual and semi-automatic espresso machine). Anyone can add their own with "Other (add new)".
  device: ["Kalita Wave", "Clever Dripper", "Cold brew", "Filter coffee machine", "Fully automatic machine"]
};
