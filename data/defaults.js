/* Defaults and presets in one place, so they are easy to change. Edit the numbers, upload the file, done.

   BREW: what a new brew starts with in the journal (espresso numbers).
   PRESETS: the recipes in the calculator.
     gpl      grams of coffee per litre of water (filter, immersion, moka)   -> ratio is coffee to water
     yr       cup yield as a multiple of the coffee (espresso: 2.2 = 18 g in, 40 g out) -> ratio is coffee to yield
     absorb   grams of water the grounds keep, per gram of coffee
     filter   grams of water the paper filter keeps
     temp     water temperature from the kettle in Celsius
     preheat  Flair 58 preheat setting (low / medium / high, see PREHEAT)
     device   the name used in the journal's device list
   The absorb and filter numbers are rules of thumb. Weigh your own spent grounds and adjust them.
   GRINDERS: your grinders. "feel" lists [up to this setting, feel word]; the journal suggests the word from the number you type.
     K6 numbers are clicks counted from zero (manufacturer's table). Add a grinder by copying a block; leave feel out for no suggestion.
   PREHEAT: the Flair 58 preheat settings: id, label, about how hot in Celsius.
   FLAIR_BY_ROAST: which Flair recipe (and so which preheat setting) fits each roast level.
   BREW_TYPES: the kinds of brewing a coffee can be suitable for.
   ROAST_COLOURS: the colours of a coffee card, by roast level, light to dark (list order = the little roast scale).
     [fill light, fill dark, line light, line dark, text light, text dark]. Unknown roast levels use the process colours. */
window.DEFAULTS = {
  BREW: { preinfusion_bar: 2, preinfusion_s: 10, grind: 25, dose_g: 18, yield_g: 40, pressure_bar: 6, temp_c: 96 },
  PRESETS: [
    { id: "flair-med",   name: "Flair 58, medium roast",  device: "Flair 58", yr: 2.2, absorb: 1.5, filter: 0, temp: 96, preheat: "medium", dose: 18 },
    { id: "flair-dark",  name: "Flair 58, dark roast",    device: "Flair 58", yr: 1.5, absorb: 1.5, filter: 0, temp: 96, preheat: "low", dose: 18 },
    { id: "flair-light", name: "Flair 58, light roast",   device: "Flair 58", yr: 3,   absorb: 1.5, filter: 0, temp: 96, preheat: "high", dose: 18 },
    { id: "aero-regular", name: "AeroPress, regular cup", device: "AeroPress", gpl: 75,  absorb: 2, filter: 1, water: 250 },
    { id: "aero-short",  name: "AeroPress, short and strong", device: "AeroPress", gpl: 100, absorb: 2, filter: 1, water: 200 },
    { id: "v60",         name: "Hario V60",               device: "Hario V60", gpl: 60, absorb: 2, filter: 2, water: 500 },
    { id: "chemex",      name: "Chemex",                  device: "Chemex", gpl: 60, absorb: 2, filter: 3, water: 600 },
    { id: "pour",        name: "Pour-over (other)",       device: "Pour-over (other)", gpl: 60, absorb: 2, filter: 2, water: 500 },
    { id: "press",       name: "French press",            device: "French press", gpl: 75, absorb: 2, filter: 0, water: 500 },
    { id: "moka",        name: "Moka pot",                device: "Moka pot", gpl: 200, absorb: 2, filter: 0, water: 300 }
  ],
  GRINDERS: [
    { id: "k6", name: "Kingrinder K6", unit: "clicks", feel: [[24, "extra fine"], [59, "fine"], [89, "medium-fine"], [129, "medium"], [9999, "coarse"]] }
  ],
  PREHEAT: [["low", "Low", 85], ["medium", "Medium", 90], ["high", "High", 95]],
  FLAIR_BY_ROAST: { "light": "flair-light", "medium-light": "flair-light", "medium": "flair-med", "medium-dark": "flair-dark", "dark": "flair-dark" },
  BREW_TYPES: [["espresso", "Espresso"], ["filter", "Filter"], ["immersion", "Immersion"], ["moka", "Moka"]],
  ROAST_COLOURS: [
    ["Light",        ["#F7EFDC", "#2E2618", "#C9A15A", "#D9B878", "#5E4720", "#EAD7AE"]],
    ["Medium-light", ["#F2E5CD", "#2F2416", "#B5853F", "#D2A866", "#56401C", "#E6CDA0"]],
    ["Medium",       ["#ECDDC9", "#2C2119", "#93653A", "#C79A6E", "#4A321E", "#E2C6A8"]],
    ["Medium-dark",  ["#E6D6C7", "#281D17", "#74492D", "#B88562", "#3F271A", "#DDBFA6"]],
    ["Dark",         ["#E0D0C6", "#241A16", "#4A2E22", "#A57A63", "#2F1C14", "#D8BBA9"]]
  ],
  START_PRESET: "flair-med"
};
