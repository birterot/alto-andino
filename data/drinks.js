/* Coffee drinks: what goes into each one. Used by the chapter chapters/drinks.html,
   and by the Journal and Settings for the "Drink" and "Milk" choices.
   Amounts are typical home / café sizes; cafés differ, so read them as a starting point, not a rule.
   layers: from the bottom of the cup up, [kind, ml]. Kinds: espresso, water, milk (steamed), foam, cold (cold milk), ice, filter.
   milk: true when the drink has milk in it (then the Journal asks which milk). */
window.DRINKS = {
  title: "Coffee drinks",
  sub: "What is in an espresso, a flat white or a latte macchiato: how much coffee, milk, foam and water, and in which cup.",
  groups: [
    ["black", "Black", "Espresso on its own or with water."],
    ["milk", "With milk", "Espresso with steamed milk and foam. The difference between them is mostly how much milk and how thick the foam is."],
    ["filter", "Filter", "Coffee from the V60, Chemex, AeroPress, French press or moka pot."]
  ],
  D: [
    { id: "espresso", name: "Espresso (traditional, 1 shot)", group: "black", milk: false, cup: "Espresso cup, 60–90 ml",
      layers: [["espresso", 28]], shot: "1 shot: about 7–9 g coffee to 25–30 g in the cup",
      what: "The traditional Italian single shot: short and strong, with crema on top, in 25–30 seconds. The base for everything else.",
      flair: "Our Flair recipes (18 g in) make a doppio; for a single, use about half the coffee." },
    { id: "doppio", name: "Espresso doppio (common, 2 shots)", group: "black", milk: false, cup: "Espresso cup or small glass",
      layers: [["espresso", 45]], shot: "2 shots: about 16–18 g coffee to 32–40 g in the cup",
      what: "A double espresso, ratio about 1:2. Most cafés make this as their standard shot, even when the menu just says espresso, and use it as the base for milk drinks.",
      flair: "Flair 58: 18 g in, 36–40 g out." },
    { id: "ristretto", name: "Ristretto", group: "black", milk: false, cup: "Espresso cup",
      layers: [["espresso", 20]], shot: "1 short shot, about 18 g to 18–27 g",
      what: "A restricted espresso: the same dose, less water (ratio 1:1 to 1:1.5). Thicker and sweeter, less bitter, more intense.",
      flair: "Flair 58: 18 g in, stop at 20–25 g out." },
    { id: "lungo", name: "Lungo", group: "black", milk: false, cup: "Espresso or small cup, 90–120 ml",
      layers: [["espresso", 60]], shot: "1 long shot, about 18 g to 50–70 g",
      what: "A long espresso: more water runs through the same coffee (ratio about 1:3). Lighter in body, often more bitter, because more is pulled out of the grounds.",
      flair: "Flair 58: grind a little coarser so the longer shot does not over-extract." },
    { id: "americano", name: "Americano", group: "black", milk: false, cup: "Cup, 180–250 ml",
      layers: [["espresso", 40], ["water", 140]], shot: "1–2 shots, then 120–180 ml hot water on top",
      what: "Espresso topped up with hot water: about as strong as filter coffee, but with the taste of espresso. The water goes onto the espresso, so the crema breaks up." },
    { id: "long_black", name: "Long black", group: "black", milk: false, cup: "Cup, 150–200 ml",
      layers: [["water", 110], ["espresso", 50]], shot: "100–120 ml hot water first, then 1–2 shots on top",
      what: "Like an americano, the other way round: the espresso goes onto the water, so the crema stays on top. Usually a bit stronger, with less water." },

    { id: "macchiato", name: "Macchiato", group: "milk", milk: true, cup: "Espresso cup, 60–90 ml",
      layers: [["espresso", 35], ["foam", 15]], shot: "1 shot, a spoonful of milk foam",
      what: "Espresso \"stained\" with a little milk foam. Almost all espresso, just softened." },
    { id: "cortado", name: "Cortado", group: "milk", milk: true, cup: "Small glass, 100–150 ml",
      layers: [["espresso", 50], ["milk", 50], ["foam", 10]], shot: "1–2 shots, the same amount of steamed milk, very little foam",
      what: "Half espresso, half warm milk, hardly any foam. The milk \"cuts\" the espresso; the coffee stays in front." },
    { id: "piccolo", name: "Piccolo", group: "milk", milk: true, cup: "Small glass, 90–100 ml",
      layers: [["espresso", 25], ["milk", 55], ["foam", 10]], shot: "1 ristretto, topped up with steamed milk",
      what: "A small latte: a ristretto with steamed milk and a thin layer of foam, in a small glass. Strong, but smooth." },
    { id: "flat_white", name: "Flat white", group: "milk", milk: true, cup: "Cup, 150–180 ml",
      layers: [["espresso", 50], ["milk", 100], ["foam", 8]], shot: "2 shots (often ristretto), about 100–120 ml steamed milk",
      what: "More coffee, less milk than a latte, with very fine, thin foam (about half a centimetre) that mixes into the milk. The espresso stays clearly in front; the classic for latte art." },
    { id: "cappuccino", name: "Cappuccino", group: "milk", milk: true, cup: "Cup, 150–180 ml",
      layers: [["espresso", 35], ["milk", 60], ["foam", 60]], shot: "1–2 shots, steamed milk and a thick layer of foam",
      what: "Roughly a third each: espresso, steamed milk, foam (1–2 cm thick). Airier and lighter than a flat white, with a soft foam cap." },
    { id: "latte", name: "Latte", group: "milk", milk: true, cup: "Large cup or glass, 240–350 ml",
      layers: [["espresso", 40], ["milk", 200], ["foam", 15]], shot: "1–2 shots, 200–250 ml steamed milk, about 1 cm foam",
      what: "Caffè latte: mostly milk, mild and creamy. The coffee is in the background; good for darker roasts and for latte art." },
    { id: "latte_macchiato", name: "Latte macchiato", group: "milk", milk: true, cup: "Tall glass, 250–300 ml",
      layers: [["milk", 170], ["espresso", 35], ["foam", 50]], shot: "Glass of steamed milk and foam, the shot poured in last",
      what: "The milk goes into the glass first and the espresso is poured in last, so it settles between milk and foam and makes layers. Milk \"stained\" with coffee: the mildest of all." },
    { id: "iced_latte", name: "Iced latte", group: "milk", milk: true, cup: "Tall glass with ice",
      layers: [["ice", 60], ["cold", 150], ["espresso", 40]], shot: "1–2 shots over ice and 150–200 ml cold milk",
      what: "Cold milk on ice, espresso on top. Not steamed, so no foam; the sweetness has to come from the coffee and the milk." },
    { id: "cafe_au_lait", name: "Café au lait", group: "milk", milk: true, cup: "Large cup or bowl",
      layers: [["filter", 120], ["milk", 120]], shot: "Filter coffee and hot milk, about half and half",
      what: "Not espresso: filter or French press coffee with the same amount of hot milk. The French breakfast coffee." },

    { id: "filter", name: "Filter coffee, black", group: "filter", milk: false, cup: "Cup or mug, 200–300 ml",
      layers: [["filter", 220]], shot: "About 60 g coffee per litre of water",
      what: "Coffee from the V60, Chemex, AeroPress or French press, without milk. The way to taste the coffee itself." },
    { id: "filter_milk", name: "Filter coffee with milk", group: "filter", milk: true, cup: "Cup or mug",
      layers: [["filter", 200], ["cold", 30]], shot: "Filter coffee with a splash of milk",
      what: "Filter coffee with a little milk, warm or cold. Softens acidity and bitterness." },
    { id: "moka", name: "Moka pot coffee", group: "filter", milk: false, cup: "Espresso cup or small cup",
      layers: [["espresso", 50]], shot: "Strong, short, from the stove",
      what: "Strong and short like an espresso, but made with less pressure, so without real crema. Drunk on its own or with milk." }
  ],
  // milk kinds: id, name, a short note for the chapter
  MILKS: [
    ["whole", "Whole milk (3.5%)", "Foams best and tastes sweetest: fat and protein make silky foam. The standard for latte art."],
    ["semi", "Semi-skimmed (1.5%)", "Foams easily, but the foam is drier and falls apart sooner; less sweet."],
    ["lactose_free", "Lactose-free", "Foams like normal milk and tastes a little sweeter (the lactose is already split into sugars)."],
    ["oat", "Oat (barista)", "The \"barista\" versions foam well and taste mild and a little sweet. Normal oat drinks often do not foam."],
    ["soy", "Soy", "Foams well, can curdle in very hot or very acidic coffee: steam it a little cooler."],
    ["almond", "Almond", "Light and nutty, foam is thin and falls apart quickly."],
    ["coconut", "Coconut", "Strong taste of its own, foams poorly."],
    ["other", "Other", ""]
  ],
  // the milk part of the chapter
  steam: [
    "Steam milk to 55–65 °C: the cup is still hot and the milk tastes sweetest. Above about 70 °C it starts to taste cooked and the foam breaks down.",
    "First let a little air in (the \"tss-tss\" sound) until the milk has grown by about a third for a cappuccino, less for a flat white; then dip the wand a bit deeper and let the milk spin until it is warm.",
    "Tap the jug on the counter and swirl it: the foam should shine like wet paint. Big bubbles mean too much air too late.",
    "Start with cold milk in a cold jug, filled to just below the spout. Milk you have steamed once does not foam well again."
  ]
};
