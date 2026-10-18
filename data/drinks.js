/* Coffee drinks: what goes into each one. Used by the chapter chapters/drinks.html,
   and by the Coffee Shelf and Settings for the "Drink" and "Milk" choices.
   Amounts are typical; cafés and countries differ, so read them as a starting point, not a rule.
   Where there is an official definition it is named (the Italian espresso standard of the INEI, Istituto Nazionale Espresso Italiano).
   layers: from the bottom of the cup up, [kind, ml]. Kinds: espresso, water, milk (steamed), foam, cold (cold milk), ice, filter.
   milk: true when the drink has milk in it (then the brew form asks which milk). */
window.DRINKS = {
  title: "Coffee drinks",
  sub: "What is in an espresso, a flat white or a latte macchiato: how much coffee, milk, foam and water, and in which cup.",
  groups: [
    ["black", "Black", "Espresso on its own or with water."],
    ["milk", "With milk", "Espresso with steamed milk and foam. The drinks differ mostly in how much milk there is and how thick the foam is."],
    ["filter", "Filter", "Coffee from the V60, Chemex, AeroPress, French press or moka pot."]
  ],
  D: [
    { id: "espresso", name: "Espresso (traditional, 1 shot)", group: "black", milk: false, cup: "Espresso cup, 50–90 ml",
      layers: [["espresso", 25]], shot: "1 shot: about 7 g coffee, about 25 ml in the cup, in about 25 seconds",
      what: "The traditional Italian single shot, short and strong with crema on top. The Italian standard (INEI) is 7 g of coffee, 25 ml in the cup (give or take 2.5 ml), about 25 seconds, at about 9 bar.",
      flair: "Your Flair recipes (18 g in) make a doppio; for a single, use about half the coffee." },
    { id: "doppio", name: "Espresso doppio (common, 2 shots)", group: "black", milk: false, cup: "Espresso cup or small glass",
      layers: [["espresso", 45]], shot: "2 shots: about 14–18 g coffee, 35–50 ml in the cup",
      what: "A double espresso. Most specialty cafés pull a double as their standard shot, even when the menu just says espresso, and use it as the base for milk drinks; a common modern recipe is 18 g of coffee to 36–40 g in the cup (ratio about 1:2).",
      flair: "Flair 58: 18 g in, 36–40 g out." },
    { id: "ristretto", name: "Ristretto", group: "black", milk: false, cup: "Espresso cup",
      layers: [["espresso", 18]], shot: "1 short shot: the same coffee, about half the water",
      what: "A \"restricted\" espresso: the same dose with less water, stopped early (ratio about 1:1 to 1:1.5). Thicker, more concentrated and usually sweeter and less bitter, because the bitter compounds that come out late stay in the puck.",
      flair: "Flair 58: 18 g in, stop at about 20–27 g out." },
    { id: "lungo", name: "Lungo", group: "black", milk: false, cup: "Espresso or small cup, 90–120 ml",
      layers: [["espresso", 55]], shot: "1 long shot: more water through the same coffee",
      what: "A long espresso: about twice the water through the same coffee (ratio about 1:3 to 1:4). Lighter in body and often more bitter, because more is pulled out of the grounds. Not the same as an americano, where the water is added afterwards.",
      flair: "Flair 58: grind a little coarser so the longer shot does not over-extract." },
    { id: "americano", name: "Americano", group: "black", milk: false, cup: "Cup, 180–250 ml",
      layers: [["espresso", 40], ["water", 140]], shot: "1–2 shots, then hot water on top",
      what: "Espresso topped up with hot water. Ratios vary a lot; about 1 part espresso to 3–5 parts water is common. The water goes onto the espresso, so most of the crema breaks up." },
    { id: "long_black", name: "Long black", group: "black", milk: false, cup: "Cup, 150–200 ml",
      layers: [["water", 100], ["espresso", 45]], shot: "Hot water first, then 1–2 shots on top",
      what: "From Australia and New Zealand: like an americano the other way round. The espresso goes onto the water, so the crema stays on top; usually with less water, so a little stronger." },

    { id: "macchiato", name: "Macchiato", group: "milk", milk: true, cup: "Espresso cup, 60–90 ml",
      layers: [["espresso", 30], ["foam", 12]], shot: "1 shot (or a doppio), a spoonful or two of milk foam",
      what: "Espresso macchiato: espresso \"stained\" (macchiato) with a dollop of milk foam. Almost all espresso, just softened." },
    { id: "cortado", name: "Cortado", group: "milk", milk: true, cup: "Small glass, 100–150 ml",
      layers: [["espresso", 45], ["milk", 45], ["foam", 6]], shot: "1–2 shots, about the same amount of warm milk, hardly any foam",
      what: "From Spain: espresso \"cut\" (cortado) with about the same amount of warm milk and very little foam. The coffee stays in front." },
    { id: "piccolo", name: "Piccolo", group: "milk", milk: true, cup: "Small glass, about 90 ml",
      layers: [["espresso", 22], ["milk", 50], ["foam", 8]], shot: "1 ristretto, topped up with steamed milk",
      what: "From Australia: a small latte, a ristretto with steamed milk and a thin layer of foam in a small glass. Strong, but smooth." },
    { id: "flat_white", name: "Flat white", group: "milk", milk: true, cup: "Cup, 150–180 ml",
      layers: [["espresso", 45], ["milk", 100], ["foam", 7]], shot: "A doppio (often ristretto), about 100–120 ml steamed milk",
      what: "From Australia and New Zealand: more coffee and less milk than a latte, with a thin layer of very fine microfoam (about 5–8 mm) that blends into the milk. The espresso stays clearly in front; a favourite for latte art." },
    { id: "cappuccino", name: "Cappuccino", group: "milk", milk: true, cup: "Cup, 150–180 ml",
      layers: [["espresso", 25], ["milk", 75], ["foam", 50]], shot: "1 shot (often a doppio in cafés), about 100 ml milk foamed up",
      what: "Espresso, steamed milk and a thick, velvety foam cap (about 1.5–2 cm). The well-known rule is a third each; the Italian standard (INEI) is 25 ml espresso and 100 ml milk, foamed to about 125 ml." },
    { id: "latte", name: "Latte", group: "milk", milk: true, cup: "Large cup or glass, 240–350 ml",
      layers: [["espresso", 40], ["milk", 200], ["foam", 12]], shot: "1–2 shots, 200–250 ml steamed milk, about 1 cm foam",
      what: "Caffè latte: mostly milk, mild and creamy, with a thin layer of foam (about 1 cm). The coffee is in the background." },
    { id: "latte_macchiato", name: "Latte macchiato", group: "milk", milk: true, cup: "Tall glass, 250–300 ml",
      layers: [["milk", 170], ["espresso", 30], ["foam", 50]], shot: "A glass of steamed milk and foam, the shot poured in last",
      what: "Milk \"stained\" with coffee: the milk goes into the glass first and the espresso is poured in last. It settles between the milk and the foam, which gives the layers. The mildest of these drinks." },
    { id: "iced_latte", name: "Iced latte", group: "milk", milk: true, cup: "Tall glass with ice",
      layers: [["ice", 60], ["cold", 150], ["espresso", 40]], shot: "1–2 shots over ice and 150–200 ml cold milk",
      what: "Cold milk on ice with espresso on top. Not steamed, so no foam." },
    { id: "cafe_au_lait", name: "Café au lait", group: "milk", milk: true, cup: "Large cup or bowl",
      layers: [["filter", 120], ["milk", 120]], shot: "Filter coffee and hot milk, about half and half",
      what: "Not espresso: filter or French press coffee with about the same amount of hot milk. The French breakfast coffee." },

    { id: "filter", name: "Filter coffee, black", group: "filter", milk: false, cup: "Cup or mug, 200–300 ml",
      layers: [["filter", 220]], shot: "About 55–65 g coffee per litre of water",
      what: "Coffee from the V60, Chemex, AeroPress or French press, without milk. The way to taste the coffee itself." },
    { id: "filter_milk", name: "Filter coffee with milk", group: "filter", milk: true, cup: "Cup or mug",
      layers: [["filter", 200], ["cold", 30]], shot: "Filter coffee with a splash of milk",
      what: "Filter coffee with a little milk, warm or cold. Softens acidity and bitterness." },
    { id: "moka", name: "Moka pot coffee", group: "filter", milk: false, cup: "Espresso cup or small cup",
      layers: [["espresso", 50]], shot: "Strong and short, from the stove",
      what: "Strong like an espresso, but brewed with far less pressure (about 1–2 bar instead of about 9), so without real crema. Drunk on its own or with milk." }
  ],
  // milk kinds: id, name, a short note for the chapter
  MILKS: [
    ["whole", "Whole milk (3.5%)", "Glossy, creamy microfoam that holds its shape well, and the roundest taste. The usual choice for flat whites and latte art."],
    ["semi", "Semi-skimmed (1.5%)", "Foams easily, but the foam is a little less glossy and creamy and holds less long. Fine for most drinks; harder for detailed latte art."],
    ["lactose_free", "Lactose-free", "Foams like normal milk of the same fat, and tastes a little sweeter: the lactose is already split into sweeter sugars."],
    ["oat", "Oat (barista)", "The \"barista\" versions are made to foam well and taste mild and a little sweet. Ordinary oat drinks often hardly foam."],
    ["soy", "Soy", "Foams well. It can curdle in very hot or very acidic coffee: steam it a little cooler, or pour the milk in first."],
    ["almond", "Almond", "Light and nutty. Ordinary almond drinks make thin foam that falls apart quickly; barista versions hold better."],
    ["coconut", "Coconut", "A strong taste of its own. Plain coconut drinks foam poorly; barista blends work better."],
    ["other", "Other", ""]
  ],
  // the milk part of the chapter
  steam: [
    "Start with cold milk in a cold jug, filled to just below the spout. Milk that has been steamed once does not foam well again.",
    "First let some air in, with the wand tip just under the surface (a quiet \"tss-tss\"). The longer you do this, the more foam: briefly for a flat white (about 5–8 mm of foam), a little longer for a latte (about 1 cm), longest for a cappuccino (about 1.5–2 cm).",
    "Then dip the wand a little deeper and let the milk spin until it is hot. Stop at about 55–65 °C: the jug is just too hot to hold, and the milk tastes sweetest. Much above 70 °C it starts to taste cooked and the foam breaks down.",
    "Tap the jug on the counter and swirl it: the foam should shine like wet paint. Big bubbles mean too much air, or air let in too late."
  ]
};
