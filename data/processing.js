/* Chapter 1: processing. Edit the text here, not in the HTML.
   D = methods (colours, cup notes, facts), G = gauge values taken from the notes,
   GN = gauge names, R = process steps in order ([name, used-by flags, shared-phase flag, text, per-method text]). */
(function(){
var D=[
{id:"washed",c:{f:["#E4EAE0","#243026"],s:["#4F6B55","#9DB8A1"],t:["#34493A","#C5D6C7"]},n:"Washed",tag:"Clean and complex, with fewer defects",fl:["clean","complex","higher acidity"],bad:[],st:["Acidity: higher","Clean, complex"],
f:[["cost","Expensive"],["risk","Wastewater can be toxic"],["temp","Hotter means faster fermentation"]]},
{id:"pulped",c:{f:["#E9EBD9","#2B2E1B"],s:["#6B7442","#B4BC83"],t:["#4B5230","#D3D8B0"]},n:"Pulped natural",tag:"Sweeter, with fewer defects",fl:["sweeter","sugar stays"],bad:[],st:["Sweeter","Sugar stays"],
f:[["pin","Mainly Brazil"],["water","Aims to use less water"]]},
{id:"honey",c:{f:["#F0E6D0","#3A2E17"],s:["#8F6A2B","#D6AE6A"],t:["#6B4F1F","#EBD3A3"]},n:"Honey",tag:"Cup notes still to add",fl:[],bad:[],st:["To fill in",""],
f:[["pin","Mostly Central America"],["water","Even less water than pulped natural"],["risk","Higher fermentation and defect risk"]]},
{id:"natural",c:{f:["#EFDDD2","#3C261D"],s:["#94512F","#D79A7A"],t:["#6E3A22","#EDC4AE"]},n:"Natural",tag:"Fruity, or funky when it goes wrong",fl:["blueberry","strawberry","tropical fruit"],bad:["barnyard","wild","fermented","manure"],st:["Fruity or funky","Berry, tropical"],
f:[["pin","Ethiopia, parts of Brazil"],["water","Chosen where water is scarce"],["time","Oldest method"],["risk","Prone to defects"],["cost","Often used for cheap bulk coffee"]]},
{id:"semi",c:{f:["#E0E5E8","#232B31"],s:["#4F6572","#9DB1BD"],t:["#364651","#C4D2DB"]},n:"Semi-washed",tag:"Low acidity, full body",fl:["wood","earthy","musty","spice","tobacco","leather"],bad:[],st:["Acidity: lower","More body"],
f:[["pin","Mostly Indonesia (Giling Basah)"]]}
];
var G={washed:{a:[4,"higher"]},semi:{a:[2,"lower"],b:[4,"fuller"]}};
var GN=[["a","Acidity"],["b","Body"],["r","Bitterness"],["s","Sweetness"]];
var R=[
["Depulp","11101",1,"The skin and fruit flesh are stripped off mechanically. Natural coffee skips this and is dried as a whole cherry.",["Strips the outer skin and the fruit flesh.","Strips all the skin and much of the flesh, using less water.","Uses even less water. Results range from 100% honey to 20% honey, depending on how much mucilage (miel) stays.","","Skin and flesh are removed."]],
["Ferment in tank","10000",1,"Beans sit in a clean tank or trough. Fermentation breaks down the pectin, the water turns gelatinous and the last flesh comes off. The hotter it is, the faster it goes. Wastewater can be toxic.",[]],
["Wash","10000",1,"Removes leftover debris.",[]],
["Sun-dry","11111",1,"Every method dries in the sun, but how much fruit is still on the bean differs.",["Dried to 11-12% moisture, sometimes with mechanical dryers.","Less flesh means a lower defect risk, but enough sugar stays to add sweetness.","More flesh left on, so the risk of fermentation and defects is higher.","Whole cherry in a thin layer, turned regularly against mould, rot and fermentation.","A quick dry, only to 30-35% moisture."]],
["Remove dried husk","00010",1,"The dried outer husk is removed mechanically.",[]],
["Hull while wet","00001",1,"The parchment is stripped while the bean is still wet (Giling Basah).",[]],
["Final dry","00001",1,"A second drying after hulling. It gives the beans a swamp-green colour.",[]],
["Rest (reposo)","11111",0,"Beans rest for 30-60 days before export.",[]],
["Dry hulling","11110",0,"Mechanically removes the parchment, which stays on until now. Semi-washed was already hulled wet.",[]],
["Sort defects","11111",0,"Defects are sorted out by colour and size.",[]],
["Size and grade","11111",0,"Done before roasting, so evenly sized beans are roasted together.",[]],
["Bag in jute","11111",0,"Packed in jute bags for shipping.",[]]
];
window.CHAPTER={
  slug:"processing",
  title:"From cherry to green coffee",
  sub:"Chapter 1, processing. Source: The World Atlas of Coffee. Pick a method to see its path and its cup.",
  pageTitle:"Processing | Coffee atlas",
  pathLabel:"The path",
  D:D,G:G,GN:GN,R:R,
  glossary:[
  ["Pectin","Substance in the fruit flesh. Fermentation breaks it down and the water turns gelatinous."],
  ["Mucilage (miel)","The sticky fruit layer left on the bean in the honey process. Miel means honey."],
  ["Parchment (pergamino)","The papery layer around the bean. It stays on until dry hulling."],
  ["Reposo","The resting period of 30-60 days before export."],
  ["Giling Basah","Indonesian wet-hulling, the semi-washed method."],
  ["Moisture targets","Washed coffee finishes at 11-12%. Semi-washed is first dried to only 30-35%."]
  ]
};
})();
