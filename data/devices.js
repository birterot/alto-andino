/* Chapter 4: brewing devices. Edit the text here, not in the HTML.
   Each device: id, name, c (colours: fill, line, text as [light, dark]), kind, tag, body (one-line character),
   ratios [[label, grams per litre, grind]], water (default ml for the calculator),
   time (short text), variants [[name or "", steps[]]], tips[], extra [[title, [[name, text]...]]]. */
window.DEVICES = {
  title: "Brewing devices",
  sub: "The recommended method for each device, from the Atlas. Pick a device, then use the calculator for your amount of water. Your own dial-ins live in the journal.",
  D: [
    {
      id: "press", name: "French press", kind: "Infusion (immersion)",
      c: { f: ["#F0E6D0", "#3A2E17"], s: ["#8F6A2B", "#D6AE6A"], t: ["#6B4F1F", "#EBD3A3"] },
      tag: "Bigger, richer body and texture",
      body: "More oils and some tiny suspended pieces of coffee end up in the cup, which gives a bigger, richer body. The drink is uniformly extracted.",
      ratios: [["Standard", 75, "Medium, like caster (superfine) sugar"]], water: 500,
      time: "4 min steep, 5 min rest",
      variants: [["", [
        "Add the coffee and water, then steep for 4 minutes.",
        "Stir the crust so the particles fall to the bottom.",
        "Use a spoon to discard the leftover crust and particles on top.",
        "Wait 5 minutes.",
        "Put the lid on, but do not plunge: it creates turbulence and stirs up the silty coffee at the bottom.",
        "Pour the coffee through the mesh. Leave some coffee unpoured so you do not get a silty cup."]]],
      tips: [], extra: []
    },
    {
      id: "aero", name: "AeroPress", kind: "Infusion (immersion)",
      c: { f: ["#E0E5E8", "#232B31"], s: ["#4F6572", "#9DB1BD"], t: ["#364651", "#C4D2DB"] },
      tag: "Short and strong, or close to a regular cup",
      body: "Decide first what kind of cup you want: short and strong, or close to a regular cup.",
      ratios: [["Short and strong", 100, "Fine"], ["Close to a regular cup", 75, ""]], water: 250,
      time: "1 min brew",
      variants: [
        ["Traditional method", [
          "Add the coffee grounds.",
          "Add the desired amount of water.",
          "Give the coffee a quick stir.",
          "Put in the piston and seal the tube, but do not push down. This creates a vacuum and prevents liquid from dripping down.",
          "Brew for one minute.",
          "Slowly push the plunger down."]],
        ["Inverted method", [
          "Same steps, but put the AeroPress upside down.",
          "This makes sure really no water escapes, instead of relying on the physics of a vacuum."]]
      ],
      tips: ["The traditional method allows you to brew more coffee than the inverted method."], extra: []
    },
    {
      id: "pour", name: "Pour-over / filter", kind: "Percolation",
      c: { f: ["#E4EAE0", "#243026"], s: ["#4F6B55", "#9DB8A1"], t: ["#34493A", "#C5D6C7"] },
      tag: "Clean cup, many ways to adjust",
      body: "Filter brewers brew by percolation: water runs through the coffee bed and takes flavour with it.",
      ratios: [["Standard", 60, "Medium, like caster sugar, for 30 g coffee to 500 g water. Finer for a single cup, coarser for more."]], water: 500,
      time: "Bloom 30 s, then pour",
      variants: [["", [
        "Rinse the paper filter before adding the coffee.",
        "Bloom: pour about twice as much water as coffee by weight and cover all the grounds.",
        "Wait 30 seconds.",
        "Slowly pour the rest of the water. Pour directly on the coffee, not on the walls.",
        "Give the coffee a gentle swirl so the grounds do not stick to the sides."]]],
      tips: [],
      extra: [
        ["Variables", [
          ["Grind", "The finer, the more can be extracted, due to more contact time. Bitter means overextracted, so go coarser. Weak, sour or astringent means underextracted, so go finer."],
          ["Contact time", "Not only how quickly the water flows through, but also how long it takes to add the water. Add the water more slowly to increase contact time."],
          ["Amount of coffee", "The more coffee, the longer it takes, and the longer the contact time."]]],
        ["Bloom", [
          ["Why", "About 30 seconds to release the carbon dioxide trapped in the coffee. Add just enough water to cover the coffee bed."]]],
        ["Filters", [
          ["Metal", "Only removes larger pieces of coffee, so the cup has some silty sediment. Keeps most of the oils."],
          ["Cloth", "Strains suspended pieces of coffee but lets some oils through. A clean cup with a richer, fuller mouthfeel."],
          ["Paper", "The cleanest cup. Strains out all suspended material and all the oils. A fairly clear liquid with a reddish hue."]]]
      ]
    },
    {
      id: "moka", name: "Moka pot", kind: "Stove-top",
      c: { f: ["#EFDDD2", "#3C261D"], s: ["#94512F", "#D79A7A"], t: ["#6E3A22", "#EDC4AE"] },
      tag: "Strong, so go easy on the heat",
      body: "Stove-top brewer with a strong ratio. The aim is to avoid cooking the coffee for longer than necessary.",
      ratios: [["Standard", 200, "Quite fine, like salt"]], water: 300,
      time: "Until it gurgles",
      variants: [["", [
        "Fill the pot with already hot water, so the coffee is not cooked unnecessarily long. This reduces bitterness. Fill just below the valve.",
        "Put it on the stove with the lid up.",
        "Try to slow the brewing down: do not go too hot.",
        "When the pot starts gurgling, remove it from the heat and hold the bottom under cold water to stop the brewing entirely."]]],
      tips: [], extra: []
    }
  ]
};
