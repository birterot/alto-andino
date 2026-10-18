/* Chapter 4: brewing devices. Edit the text here, not in the HTML.
   Device: id, name, logAs (optional: the names the journal offers for this device, default = name), kind, c (colours [light, dark]: fill f, line s, text t), tag, body,
     ratios [[label, grams per litre, grind]] (default for all variants), water (default ml), time,
     variants [...], extra [[title, [[name, text]...]]] (shown for every variant).
   Variant: n (tab label), src (set it if the content is NOT from the Atlas), ratios, water, time,
     calc ("yield" = dose in, yield out; ratios then hold [label, yield multiple, grind]), tiles [[label, value]],
     steps [], tips [], extra [], links [[title, url]]. */
window.DEVICES = {
  title: "Brewing devices",
  sub: "Recommended methods for each device. Content from the Atlas is plain, content from other sources is marked. Your own dial-ins live on the Coffee Shelf.",
  D: [
    {
      id: "press", type: "immersion", name: "French press", kind: "Infusion (immersion)",
      c: { f: ["#F0E6D0", "#3A2E17"], s: ["#8F6A2B", "#D6AE6A"], t: ["#6B4F1F", "#EBD3A3"] },
      tag: "Bigger, richer body and texture",
      body: "More oils and some tiny suspended pieces of coffee end up in the cup, which gives a bigger, richer body. The drink is uniformly extracted.",
      ratios: [["Standard", 75, "Medium, like caster (superfine) sugar", "press"]], water: 500,
      time: "4 min steep, 5 min rest",
      variants: [{ n: "", steps: [
        "Add the coffee and water, then steep for 4 minutes.",
        "Stir the crust so the particles fall to the bottom.",
        "Use a spoon to discard the leftover crust and particles on top.",
        "Wait 5 minutes.",
        "Put the lid on, but do not plunge: it creates turbulence and stirs up the silty coffee at the bottom.",
        "Pour the coffee through the mesh. Leave some coffee unpoured so you do not get a silty cup."] }],
      extra: []
    },
    {
      id: "aero", type: "immersion", name: "AeroPress", kind: "Infusion (immersion)",
      c: { f: ["#E0E5E8", "#232B31"], s: ["#4F6572", "#9DB1BD"], t: ["#364651", "#C4D2DB"] },
      tag: "Short and strong, or close to a regular cup",
      body: "Decide first what kind of cup you want: short and strong, or close to a regular cup.",
      ratios: [["Close to a regular cup", 75, "", "aero-regular"], ["Short and strong", 100, "Fine", "aero-short"]], water: 250,
      time: "1 min brew",
      variants: [
        { n: "Traditional method", steps: [
          "Add the coffee grounds.",
          "Add the desired amount of water.",
          "Give the coffee a quick stir.",
          "Put in the piston and seal the tube, but do not push down. This creates a vacuum and prevents liquid from dripping down.",
          "Brew for one minute.",
          "Slowly push the plunger down."],
          tips: ["The traditional method allows you to brew more coffee than the inverted method."] },
        { n: "Inverted method", steps: [
          "Same steps, but put the AeroPress upside down.",
          "This makes sure really no water escapes, instead of relying on the physics of a vacuum."] }
      ],
      extra: []
    },
    {
      id: "pour", type: "filter", name: "Pour-over / filter", kind: "Percolation",
      logAs: ["Hario V60", "Chemex", "Pour-over (other)"],   // names offered in the journal's device list
      c: { f: ["#E4EAE0", "#243026"], s: ["#4F6B55", "#9DB8A1"], t: ["#34493A", "#C5D6C7"] },
      tag: "Clean cup, many ways to adjust",
      body: "Filter brewers brew by percolation: water runs through the coffee bed and takes flavour with it. Pick the Atlas method, or a recipe for the V60 or the Chemex.",
      ratios: [["Standard", 60, "Medium, like caster sugar, for 30 g coffee to 500 g water. Finer for a single cup, coarser for more.", "pour"]], water: 500,
      time: "Bloom 30 s, then pour",
      variants: [
        { n: "Atlas method", steps: [
          "Rinse the paper filter before adding the coffee.",
          "Bloom: pour about twice as much water as coffee by weight and cover all the grounds.",
          "Wait 30 seconds.",
          "Slowly pour the rest of the water. Pour directly on the coffee, not on the walls.",
          "Give the coffee a gentle swirl so the grounds do not stick to the sides."] },
        { n: "Hario V60", src: true,
          ratios: [["James Hoffmann (30 g to 500 g)", 60, "Medium-fine", "v60"]], water: 500, time: "About 3:30 in total",
          steps: [
            "Rinse the paper filter with water just off the boil. Add the grounds to the V60 and make a well in the middle.",
            "Start the timer and pour 60 g of water (twice the coffee weight) for the bloom. Swirl until the slurry is evenly mixed. A swirl works better than a spoon.",
            "Let it bloom for up to 45 seconds.",
            "At 0:45 pour 240 g more over 30 seconds, so you are at 300 g in total. Pouring onto the filter is fine.",
            "At 1:15 pour 200 g more over 30 seconds, so you are at 500 g in total. Pour a little slower than in the last phase and not too aggressively.",
            "At 1:45 stir once clockwise and once counterclockwise with a spoon. Let it drain a little, then give it a gentle swirl.",
            "Let the brew finish dripping, aiming to be done at about 3:30."],
          tips: ["The hotter the water, the faster the drawdown, and hotter is better for lighter roasts. The filter paper also changes the drawdown speed. Keeping the V60 full helps keep the temperature up.",
                 "This recipe is for 500 g of water. For other amounts, scale the pours in the same proportions."],
          links: [["James Hoffmann's Ultimate V60 Technique (Hario USA)", "https://www.hario-usa.com/blogs/recipes-and-more-from-friends/james-hoffmann-uitimate-v60-technique"]] },
        { n: "Chemex", src: true,
          ratios: [["Craft Coffee (36 g to 600 g)", 60, "A little coarser than medium", "chemex"]], water: 600, time: "About 3:30 in total",
          tiles: [["Water", "About 96 °C (205 °F)"]],
          steps: [
            "Heat the water to a boil, then let it sit for 30 seconds.",
            "Unfold the filter and place it in the Chemex with the three-layer side facing the pouring spout. Rinse it with hot water for about 5 seconds, then discard the rinse water.",
            "Add the ground coffee and gently shake the brewer to level the bed.",
            "Bloom (0:00 to 0:45): pour about 70 g of water evenly over the grounds and wait until the timer reads 35 to 45 seconds.",
            "Main pour (0:45 to 2:45): pour continuously in a spiral, avoiding the centre and the edges. Pause if the water gets near the rim. Stop at 2:45 or when you reach 600 g.",
            "Drawdown (2:45 to 3:30): let all the water drain, then remove the filter."],
          tips: ["Adjust the grind in small steps: if the total time is over 4:00, grind finer next time. If it is under 3:00, grind coarser.",
                 "The source gives the temperature as 205 without a unit, so that is probably Fahrenheit. Its recipe is for a 6-cup Chemex, so for your 3-cup, use the calculator to scale the amounts."],
          links: [["Chemex Brew Guide (Craft Coffee)", "https://www.craftcoffee.com/blogs/brew-guides/chemex-brew-guide"]] }
      ],
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
      id: "moka", type: "moka", name: "Moka pot", kind: "Stove-top",
      c: { f: ["#EFDDD2", "#3C261D"], s: ["#94512F", "#D79A7A"], t: ["#6E3A22", "#EDC4AE"] },
      tag: "Strong, so go easy on the heat",
      body: "Stove-top brewer with a strong ratio. The aim is to avoid cooking the coffee for longer than necessary.",
      ratios: [["Standard", 200, "Quite fine, like salt", "moka"]], water: 300,
      time: "Until it gurgles",
      variants: [{ n: "", steps: [
        "Fill the pot with already hot water, so the coffee is not cooked unnecessarily long. This reduces bitterness. Fill just below the valve.",
        "Put it on the stove with the lid up.",
        "Try to slow the brewing down: do not go too hot.",
        "When the pot starts gurgling, remove it from the heat and hold the bottom under cold water to stop the brewing entirely."] }],
      extra: []
    },
    {
      id: "flair", type: "espresso", name: "Manual espresso machine", tab: "Manual espresso", kind: "Lever espresso by hand, for example the Flair 58",
      logAs: ["Manual espresso machine"],
      c: { f: ["#F3DEDA", "#3B1D1A"], s: ["#A83A2E", "#E58D7F"], t: ["#7C291F", "#F2C4BB"] },
      tag: "Espresso by hand, with full control of temperature and pressure",
      body: "A manual (lever) espresso machine has no pump and often no heater: you heat the water and you make the pressure with the lever, so the shot is yours to shape. That also means more to dial in. Change one thing at a time and write it down. The method below is for the Flair 58; other lever machines work much the same way.",
      ratios: [["Medium roast (about 1:2)", 2.2, "Fine, espresso range. Tune it by the shot time.", "flair-med"],
               ["Dark roast (1:1 to 1:1.5)", 1.5, "Fine, espresso range. Tune it by the shot time.", "flair-dark"],
               ["Light roast (up to 1:3)", 3, "Fine, espresso range. Tune it by the shot time.", "flair-light"]],
      water: 18, time: "25 to 35 seconds",
      variants: [{ n: "Flair 58", src: true, calc: "yield", water: 18,
        tiles: [["Water temperature", "85 to 95 °C, by roast"], ["Pressure", "About 3 bar, then 6 to 9 bar"], ["Dose", "16 to 20 g, 18 g to start"]],
        steps: [
          "Preheat. With the Preheat Control System, pick the setting for your roast (see below), raise the lever fully, lock in the portafilter and wait about 5 minutes. Without it, seal the bottom with the preheat cap, fill with boiling water, wait 45 seconds, discard it and repeat as needed.",
          "Heat the brew water in a kettle. If you can, set it close to your preheat temperature.",
          "Grind about 18 g, or the dose that fits your basket, and fill the basket. Level and tamp the grounds.",
          "Fill the brew head with just-boiled water through the valve plunger and lock the portafilter in.",
          "Pre-infuse: lower the lever until the gauge shows about 2 to 3 bar and hold it for 5 to 10 seconds. The coffee expands slowly, which reduces channeling.",
          "Then build up to 6 to 7 bar (Flair's dial-in guide) or up to 9 bar (the manual) for the rest of the shot.",
          "Stop at the yield, for example 36 to 40 g from 18 g. A good first target is 25 to 30 seconds.",
          "Let it cool, then rinse the portafilter, basket, puck screen and valve plunger under cool water. No soap, no dishwasher, and keep the pressure gauge dry."],
        tips: ["Written from Flair's own guides for the Flair 58 and 58 Plus 2. The preheat settings only exist on models with the Preheat Control System, so check your manual if you are unsure which one you have.",
               "The two Flair guides differ a little (25 to 30 seconds and 6 to 7 bar against 30 to 35 seconds and 6 to 9 bar). Start in the overlap, at about 30 seconds, and adjust from there.",
               "Log every change as a dial-in on the Coffee Shelf, so you can always go back to an earlier setting."],
        extra: [
          ["Temperature and yield by roast", [
            ["Dark roast", "Low preheat setting, about 85 °C (185 °F). Yield about 1 to 1.5 times the dose."],
            ["Medium roast", "Medium setting, about 90 °C (194 °F). Yield about 2 times the dose."],
            ["Light roast", "High setting, about 95 °C (203 °F). Extremely light roasts: yield closer to 3 times the dose."]]],
          ["Pressure on the gauge", [
            ["Below 6 bar", "Fine for the pre-infusion. If something goes wrong in a shot, going down to around 6 bar can still save it at the end."],
            ["6 to 9 bar", "The classic espresso range."],
            ["10 to 12 bar", "Higher than you need. Easing off a little is usually better."],
            ["Above 12 bar", "Not recommended. Be careful."]]],
          ["Shot time", [
            ["25 to 35 seconds", "The classic range for an espresso shot."],
            ["Under 25 seconds", "Fast. Risk of underextraction (sour)."],
            ["Over 35 to 40 seconds", "Slow. Risk of overextraction (bitter)."],
            ["The cup decides", "These are only guides. If it tastes good to you, the recipe is right, even at 40 or 50 seconds. Many specialty coffees today run longer than 35 seconds."],
            ["From experience", "80 to 90% of coffees end up at around 45 seconds."]]],
          ["Taste says...", [
            ["Sour (underextracted)", "Raise the water temperature a few degrees, grind finer even if the shot goes past 30 seconds, or lower the dose slightly."],
            ["Bitter (overextracted)", "Lower the water temperature a few degrees, grind coarser even if the shot goes under 30 seconds, or raise the dose slightly."],
            ["Too fast or too slow", "Under about 25 seconds is fast, so grind finer. Over about 35 to 40 seconds is slow, so grind coarser. But if it tastes good, leave it."]]]
        ],
        links: [["Dialing in the Flair 58 Plus (Flair Espresso)", "https://flairespresso.com/blogs/news/dialing-in-flair-58-plus-manual-espresso-maker"],
                ["Flair 58 Plus 2 product guide (Seattle Coffee Gear)", "https://www.seattlecoffeegear.com/pages/product-resources/flair-58-plus-2-manual-espresso-machine-product-guide"]] }],
      extra: []
    },
    {
      id: "semi", type: "espresso", name: "Semi-automatic espresso machine", tab: "Semi-automatic", kind: "Espresso machine with a pump",
      logAs: ["Semi-automatic espresso machine"],
      c: { f: ["#E3E1EC", "#26232F"], s: ["#5E5682", "#ADA4D6"], t: ["#433C66", "#D3CDF0"] },
      tag: "The pump makes the pressure, you decide when the shot stops",
      body: "A pump machine heats the water and builds the pressure for you (usually about 9 bar). You grind, dose, tamp, start the shot and stop it at your yield, so most of the dialing in happens with the grind. Some machines also let you set the temperature, pre-infuse or change the pressure; then the same fields as for a manual machine apply.",
      ratios: [["Medium roast (about 1:2)", 2.2, "Fine, espresso range. Tune it by the shot time.", "semi-med"],
               ["Dark roast (1:1 to 1:1.5)", 1.5, "Fine, espresso range. Tune it by the shot time.", "semi-dark"],
               ["Light roast (up to 1:3)", 3, "Fine, espresso range. Tune it by the shot time.", "semi-light"]],
      water: 18, time: "25 to 35 seconds",
      variants: [{ n: "", src: true, calc: "yield", water: 18,
        tiles: [["Water temperature", "90 to 96 °C, if you can set it"], ["Pressure", "About 9 bar from the pump"], ["Dose", "16 to 20 g, 18 g to start (by basket)"]],
        steps: [
          "Switch the machine on early: most need 15 to 30 minutes until the group head and portafilter are properly hot. Keep the portafilter locked in while it heats.",
          "Run a little water through the group head (a short flush), then dry the basket.",
          "Grind about 18 g, or the dose your basket is made for. Distribute evenly, then tamp level.",
          "Lock in the portafilter and start the shot straight away, so the coffee does not cook on the hot group head.",
          "If your machine can pre-infuse, a few seconds at low pressure help the coffee settle and reduce channeling.",
          "Stop at the yield, for example 36 to 40 g from 18 g. A good first target is 25 to 30 seconds.",
          "Knock out the puck, rinse the basket and flush the group head again. Backflush and descale as your manual says."],
        tips: ["General espresso guidance, not from the Atlas and not for one particular machine. Your machine's manual has the details (warm-up time, temperature settings, cleaning).",
               "On most pump machines the pressure is fixed at about 9 bar, so the grind is your main tool: finer slows the shot down, coarser speeds it up.",
               "Log every change as a dial-in on the Coffee Shelf, so you can always go back to an earlier setting."],
        extra: [
          ["Temperature and yield by roast", [
            ["Dark roast", "Cooler, about 90 °C, if you can set it. Yield about 1 to 1.5 times the dose."],
            ["Medium roast", "About 92 to 94 °C. Yield about 2 times the dose."],
            ["Light roast", "Hotter, about 94 to 96 °C. Yield up to about 3 times the dose."]]],
          ["Pressure", [
            ["About 9 bar", "What most pump machines brew at, and the classic espresso value."],
            ["Pressure you can set", "Some machines let you pre-infuse or lower the pressure (pressure profiling). Then the same ranges as for a manual machine apply: 6 to 9 bar for the shot, more than about 10 to 12 bar is higher than you need."]]],
          ["Shot time", [
            ["25 to 35 seconds", "The classic range for an espresso shot."],
            ["Under 25 seconds", "Fast. Risk of underextraction (sour)."],
            ["Over 35 to 40 seconds", "Slow. Risk of overextraction (bitter)."],
            ["The cup decides", "These are only guides. If it tastes good to you, the recipe is right, even at 40 or 50 seconds. Many specialty coffees today run longer than 35 seconds."],
            ["From experience", "80 to 90% of coffees end up at around 45 seconds."]]],
          ["Taste says...", [
            ["Sour (underextracted)", "Raise the water temperature a few degrees, grind finer even if the shot goes past 30 seconds, or lower the dose slightly."],
            ["Bitter (overextracted)", "Lower the water temperature a few degrees, grind coarser even if the shot goes under 30 seconds, or raise the dose slightly."],
            ["Too fast or too slow", "Under about 25 seconds is fast, so grind finer. Over about 35 to 40 seconds is slow, so grind coarser. But if it tastes good, leave it."]]]
        ],
        links: [] }],
      extra: []
    }
  ]
};
