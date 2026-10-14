/* Chapter 2: roasting. Edit the text here, not in the HTML.
   STAGES: [name, short, detail points]. Order matters, the slider walks through them.
   ROASTERS: [id, name, speed ("slow" | "fast"), points]. */
window.ROASTING = {
  title: "Roasting",
  sub: "Roasting turns green coffee into the coffee we know. Two things can be adjusted: heat (light or dark) and time (fast or slow).",
  keys: [
    "The longer the coffee is roasted, the less acidity it has.",
    "The longer the coffee is roasted, the more bitterness it has.",
    "Sweetness is a bell curve, peaking between the highs of acidity and bitterness."
  ],
  STAGES: [
    ["Drying", "Water leaves the bean", [
      "Raw coffee contains about 7-11% water by weight.",
      "The beans need to absorb enough heat to start evaporating the water.",
      "This takes a large amount of heat and energy."]],
    ["Yellowing", "First browning", [
      "The first browning reactions begin.",
      "The beans start to expand and the thin papery skin (chaff) flakes off."]],
    ["First crack", "Familiar coffee flavours appear", [
      "Gases (mostly carbon dioxide) and water vapour build up.",
      "The pressure cracks the beans open and they nearly double in size.",
      "Now the familiar coffee flavours develop.",
      "After this stage most of the sugars are gone. They have reacted to the heat in many ways (e.g. Maillard reactions, caramelization, Strecker degradation), which creates a huge number of aromatic compounds."]],
    ["Roast development", "Balance of acidity and bitterness", [
      "This stage determines the balance of acidity and bitterness."]],
    ["Second crack", "Oils surface, acidity gone", [
      "Oils are driven to the surface of the bean.",
      "Acidity is almost completely lost and a generic \"roast\" flavour develops.",
      "Many characteristics of the raw coffee are lost, which results in a low-quality cup.",
      "Sometimes called \"French\" or \"Italian\" roast: high in body and bitterness, very dark."]]
  ],
  // Where each stage begins on the heat slider (0-100). Illustrative, the Atlas gives no numbers.
  STAGE_START: [0, 15, 30, 45, 78],
  QUENCH: {
    title: "After roasting: quenching",
    intro: "Quick cooling stops the roast, so the beans do not over-roast or develop baked, negative flavours.",
    points: [
      ["Cooling tray", "Used for small batches."],
      ["Water mist", "Sprayed onto the coffee. The coffee ages a bit quicker than with tray cooling."]
    ]
  },
  ROASTERS: [
    ["drum", "Drum roaster", "slow", ["Able to roast at slow speed."]],
    ["fluid", "Fluid-bed roaster", "fast", ["Shorter roast times.", "The beans swell a little more."]],
    ["tangential", "Tangential roaster", "fast", ["Faster roasting speed."]],
    ["centrifugal", "Centrifugal roaster", "fast", ["Roasts large quantities very quickly."]]
  ],
  FAST_NOTE: "Roasting at high speed minimises weight loss and increases the amount of coffee that can be extracted from the beans. That suits instant coffee, but it results in low-quality cups."
};
