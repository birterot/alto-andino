/* Defaults and presets in one place, so they are easy to change. Edit the numbers, upload the file, done.

   BREW: what a new brew starts with in the journal (espresso numbers).
   PRESETS: the recipes in the calculator.
     gpl      grams of coffee per litre of water (filter, immersion, moka)   -> ratio is coffee to water
     yr       cup yield as a multiple of the coffee (espresso: 2.2 = 18 g in, 40 g out) -> ratio is coffee to yield
     absorb   grams of water the grounds keep, per gram of coffee
     filter   grams of water the paper filter keeps
     temp     water temperature from the kettle in Celsius
     preheat  preheat setting of a manual espresso machine like the Flair 58 (low / medium / high, see PREHEAT)
     device   the name used in the journal's device list
   The absorb and filter numbers are rules of thumb. Weigh your own spent grounds and adjust them.
   GRINDERS: your grinders. "feel" lists [up to this setting, feel word]; the journal suggests the word from the number you type.
     K6 numbers are clicks counted from zero (manufacturer's table). Add a grinder by copying a block; leave feel out for no suggestion.
   PREHEAT: the Flair 58 preheat settings: id, label, about how hot in Celsius.
   FLAIR_BY_ROAST / SEMI_BY_ROAST: which manual / semi-automatic espresso recipe (and so which preheat setting or temperature) fits each roast level.
   BREW_TYPES: the kinds of brewing a coffee can be suitable for, with the devices each one means.
   ROAST_COLOURS: the colours of a coffee card, by roast level, light to dark (list order = the little roast scale).
     [fill light, fill dark, line light, line dark, text light, text dark]. Unknown roast levels use the process colours. */
window.DEFAULTS = {
  BREW: { preinfusion_bar: 2, preinfusion_s: 10, grind: 25, dose_g: 18, yield_g: 40, pressure_bar: 6, temp_c: 96 },
  PRESETS: [
    { id: "flair-med",   name: "Manual espresso, medium roast", device: "Manual espresso machine", yr: 2.2, absorb: 1.5, filter: 0, temp: 96, preheat: "medium", dose: 18 },
    { id: "flair-dark",  name: "Manual espresso, dark roast",   device: "Manual espresso machine", yr: 1.5, absorb: 1.5, filter: 0, temp: 96, preheat: "low", dose: 18 },
    { id: "flair-light", name: "Manual espresso, light roast",  device: "Manual espresso machine", yr: 3,   absorb: 1.5, filter: 0, temp: 96, preheat: "high", dose: 18 },
    { id: "semi-med",    name: "Semi-automatic espresso, medium roast", device: "Semi-automatic espresso machine", yr: 2.2, absorb: 1.5, filter: 0, temp: 93, dose: 18 },
    { id: "semi-dark",   name: "Semi-automatic espresso, dark roast",   device: "Semi-automatic espresso machine", yr: 1.5, absorb: 1.5, filter: 0, temp: 90, dose: 18 },
    { id: "semi-light",  name: "Semi-automatic espresso, light roast",  device: "Semi-automatic espresso machine", yr: 3,   absorb: 1.5, filter: 0, temp: 95, dose: 18 },
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
  // well-known grinders, only as suggestions when you add yours in Settings (any name can be typed)
  GRINDER_NAMES: ["1Zpresso J-Max", "1Zpresso JX-Pro", "1Zpresso K-Ultra", "1Zpresso ZP6", "Baratza Encore", "Baratza Encore ESP", "Baratza Sette 270", "Baratza Virtuoso+",
    "Comandante C40", "DF64", "Eureka Mignon Specialita", "Fellow Ode", "Fellow Opus", "Hario Skerton", "Kingrinder K4", "Kingrinder K6", "Lagom P64", "Mahlkönig X54",
    "Niche Zero", "Option-O Lagom Mini", "Timemore C2", "Timemore C3", "Timemore Chestnut X", "Wilfa Uniform", "Wilfa Svart"],
  PREHEAT: [["low", "Low", 85], ["medium", "Medium", 90], ["high", "High", 95]],
  FLAIR_BY_ROAST: { "light": "flair-light", "medium-light": "flair-light", "medium": "flair-med", "medium-dark": "flair-dark", "dark": "flair-dark" },
  SEMI_BY_ROAST: { "light": "semi-light", "medium-light": "semi-light", "medium": "semi-med", "medium-dark": "semi-dark", "dark": "semi-dark" },
  // [id, name, which devices that means]
  BREW_TYPES: [["espresso", "Espresso", "espresso machines, manual or with a pump"],
               ["filter", "Filter", "water poured through: V60, Chemex, Kalita, filter machine"],
               ["immersion", "Immersion", "the coffee steeps in the water: French press, AeroPress, Clever Dripper, cold brew"],
               ["moka", "Moka", "the moka pot on the stove"]],
  ROAST_COLOURS: [
    ["Light",        ["#F7EFDC", "#2E2618", "#C9A15A", "#D9B878", "#5E4720", "#EAD7AE"]],
    ["Medium-light", ["#F2E5CD", "#2F2416", "#B5853F", "#D2A866", "#56401C", "#E6CDA0"]],
    ["Medium",       ["#ECDDC9", "#2C2119", "#93653A", "#C79A6E", "#4A321E", "#E2C6A8"]],
    ["Medium-dark",  ["#E6D6C7", "#281D17", "#74492D", "#B88562", "#3F271A", "#DDBFA6"]],
    ["Dark",         ["#E0D0C6", "#241A16", "#4A2E22", "#A57A63", "#2F1C14", "#D8BBA9"]]
  ],
  // Coffee-growing countries, for the Country field (suggestions) and so the stats group by country.
  COUNTRIES: ["Bolivia", "Brazil", "Burundi", "China", "Colombia", "Costa Rica", "Cuba", "DR Congo", "Dominican Republic", "Ecuador",
    "El Salvador", "Ethiopia", "Guatemala", "Haiti", "Honduras", "India", "Indonesia", "Jamaica", "Kenya", "Laos", "Malawi", "Mexico",
    "Myanmar", "Nepal", "Nicaragua", "Panama", "Papua New Guinea", "Peru", "Philippines", "Puerto Rico", "Rwanda", "Taiwan", "Tanzania",
    "Thailand", "Timor-Leste", "Uganda", "USA (Hawaii)", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"],
  // other spellings (German, Spanish, English) and well-known regions that tell the country
  COUNTRY_ALIASES: {
    "brasil": "Brazil", "brasilien": "Brazil", "kolumbien": "Colombia", "äthiopien": "Ethiopia", "aethiopien": "Ethiopia", "etiopia": "Ethiopia", "etiopía": "Ethiopia",
    "kenia": "Kenya", "ruanda": "Rwanda", "indonesien": "Indonesia", "mexiko": "Mexico", "méxico": "Mexico", "jemen": "Yemen", "perú": "Peru",
    "panamá": "Panama", "honduras": "Honduras", "nikaragua": "Nicaragua", "guatemala": "Guatemala", "tansania": "Tanzania", "sambia": "Zambia",
    "simbabwe": "Zimbabwe", "kuba": "Cuba", "kongo": "DR Congo", "congo": "DR Congo", "drc": "DR Congo", "dr kongo": "DR Congo", "demokratische republik kongo": "DR Congo",
    "costa rica": "Costa Rica", "el salvador": "El Salvador", "salvador": "El Salvador", "ost-timor": "Timor-Leste", "osttimor": "Timor-Leste", "east timor": "Timor-Leste",
    "papua-neuguinea": "Papua New Guinea", "png": "Papua New Guinea", "dominikanische republik": "Dominican Republic", "república dominicana": "Dominican Republic",
    "philippinen": "Philippines", "filipinas": "Philippines", "vietnam": "Vietnam", "viet nam": "Vietnam", "indien": "India", "usa": "USA (Hawaii)", "hawaii": "USA (Hawaii)", "kona": "USA (Hawaii)",
    "sumatra": "Indonesia", "java": "Indonesia", "sulawesi": "Indonesia", "flores": "Indonesia", "bali": "Indonesia", "yunnan": "China"
  },
  // "Huila, Colombia", "Colombia - Huila" or "Kolumbien" -> { country: "Colombia", region: "Huila", countries: [...] }.
  // The first part that is a country (or tells the country) is the country, the rest is the region. Nothing known: the first part.
  splitOrigin: function (text) {
    var t = String(text || "").trim(); if (!t) return { country: null, region: null, countries: [] };
    var parts = t.split(/\s*[,;\/|]\s*|\s+[-–]\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var list = this.COUNTRIES, al = this.COUNTRY_ALIASES, found = [], at = -1;
    var known = function (p) {
      var l = p.toLowerCase();
      for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === l) return list[i];
      return al[l] || null;
    };
    var REGIONAL = ["sumatra", "java", "sulawesi", "flores", "bali", "kona", "yunnan"];   // a region that tells the country: it stays the region
    parts.forEach(function (p, i) { var k = known(p); if (k) { if (found.indexOf(k) < 0) found.push(k); if (at < 0) at = i; } });
    if (at < 0) return { country: parts[0], region: parts.slice(1).join(", ") || null, countries: [] };
    var rest = parts.filter(function (p) { return !known(p) || REGIONAL.indexOf(p.toLowerCase()) >= 0; });
    return { country: found[0], region: rest.join(", ") || null, countries: found };
  },
  // Captcha on sign-in and sign-up (Cloudflare Turnstile). Put the site key here (it is public, not secret).
  // Empty = no captcha. Only switch the captcha on in Supabase after this key is published.
  TURNSTILE_SITE_KEY: "0x4AAAAAAFYgW7mYfXFgAt5K",
  START_PRESET: "flair-med",
  // Colours for people (their initial in a circle, e.g. in Recent activity). Chosen in Settings, kept as the key.
  // All dark enough for white letters, in light and dark mode.
  COLORS: [["brown", "#8A5A3C", "Coffee brown"], ["green", "#4F7A64", "Sage"], ["blue", "#5C6F99", "Blue"], ["terra", "#A0644F", "Terracotta"],
    ["olive", "#7A6A3A", "Olive"], ["plum", "#7D5C8A", "Plum"], ["teal", "#3F7480", "Teal"], ["rose", "#A65A6E", "Rose"], ["ochre", "#9A7428", "Ochre"], ["slate", "#5E6670", "Slate"]]
};
