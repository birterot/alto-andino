/* Renders a chapter page from window.CHAPTER (see data/*.js). */
(function(){
var C=window.CHAPTER,D=C.D,G=C.G,GN=C.GN,R=C.R,cup=window.cupSvg;
document.title=C.pageTitle;
document.getElementById("ct").textContent=C.title;
document.getElementById("cs").textContent=C.sub;
document.getElementById("pl").textContent=C.pathLabel;
var st0=document.createElement("style");
st0.textContent=D.map(function(m){var k=function(a){return "light-dark("+a[0]+","+a[1]+")"};return "."+m.id+"{--f:"+k(m.c.f)+";--s:"+k(m.c.s)+";--t:"+k(m.c.t)+"}"}).join("");
document.head.appendChild(st0);
var dl=document.getElementById("gloss");
C.glossary.forEach(function(g){var d=document.createElement("div");d.innerHTML="<dt></dt><dd></dd>";d.firstChild.textContent=g[0];d.lastChild.textContent=g[1];dl.appendChild(d)});
var cur=0;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e}
function ico(n){return '<svg aria-hidden="true"><use href="#'+n+'"/></svg>'}
function stepLi(r,i){
var li=el("li","stp");
var b=el("button","row");b.type="button";b.setAttribute("aria-expanded","false");
b.appendChild(el("span","",r[0]));
var ds=el("span","dots");ds.setAttribute("role","img");
var who=[];
for(var k=0;k<5;k++){var u=r[1].charAt(k)==="1";var d=el("i",u?"on "+D[k].id:D[k].id);ds.appendChild(d);if(u)who.push(D[k].n)}
ds.setAttribute("aria-label","Used by "+who.join(", "));
b.appendChild(ds);
var p=el("p","sd",r[3]+(r[4][i]?" In this method: "+r[4][i]:""));
b.onclick=function(){var o=li.classList.toggle("open");b.setAttribute("aria-expanded",o)};
li.appendChild(b);li.appendChild(p);return li}
function render(){
var m=D[cur],id=m.id;
document.querySelectorAll(".tab").forEach(function(t,i){t.setAttribute("aria-selected",i===cur)});
document.querySelectorAll(".mini").forEach(function(t,i){if(i===cur)t.setAttribute("aria-current","true");else t.removeAttribute("aria-current")});
var pa=document.getElementById("path"),af=document.getElementById("after");pa.textContent="";af.textContent="";
pa.className="path "+id;af.className="path "+id;
var an=[];
R.forEach(function(r){if(r[1].charAt(cur)!=="1")return;if(r[2])pa.appendChild(stepLi(r,cur));else{af.appendChild(stepLi(r,cur));an.push(r[0])}});
document.getElementById("aftersum").textContent="Then, the same for every method: "+an.map(function(x){return x.toLowerCase()}).join(", ");
var h='<div class="sb '+id+'"><div class="sbh">'+cup()+'<div><small>Steckbrief</small><h3>'+m.n+'</h3><p>'+m.tag+'</p></div></div><div class="sbb">'+(GN.some(function(g){return (G[id]||{})[g[0]]})?'<div><h4>In the cup, from the Atlas</h4><div id="gg"></div></div>':'');
h+='<div><h4>Flavour notes</h4><div class="chips">'+(m.fl.length?m.fl.map(function(x){return '<span class="chip">'+x+'</span>'}).join(""):'<span class="chip todo">to add from the Atlas</span>')+'</div>';
if(m.bad.length)h+='<h4 style="margin-top:10px">When it goes wrong</h4><div class="chips">'+m.bad.map(function(x){return '<span class="chip bad">'+x+'</span>'}).join("")+'</div>';
h+='</div><div><h4>Good to know</h4><div class="facts">'+m.f.map(function(x){return '<span class="fact">'+ico(x[0])+x[1]+'</span>'}).join("")+'</div></div>';
h+='</div></div>';
var sb=document.getElementById("sb");sb.innerHTML=h;
// the gauges show what the book says (general, not personal: your own tasting goes into your brews), only where it says something
var gg=document.getElementById("gg");
if(gg)GN.forEach(function(g){
var v=(G[id]||{})[g[0]];if(!v)return;
var row=el("div","g");row.appendChild(el("span","",g[1]));
var sg=el("div","seg ro");sg.setAttribute("role","img");sg.setAttribute("aria-label",g[1]+": "+v[1]+" ("+v[0]+" of 5)");
for(var i=1;i<=5;i++)sg.appendChild(el("span",i<=v[0]?"on":""));
row.appendChild(sg);row.appendChild(el("span","gv",v[1]));gg.appendChild(row)})}
var tb=document.getElementById("tabs"),st=document.getElementById("strip");
D.forEach(function(m,i){
var t=el("button","tab "+m.id,m.n);t.type="button";t.setAttribute("role","tab");t.setAttribute("data-t",m.n);t.onclick=function(){cur=i;render()};tb.appendChild(t);
var c=el("button","mini "+m.id);c.type="button";
c.innerHTML=cup().replace('class="steam"','')+'<strong>'+m.n+'</strong><span>'+m.st[0]+'</span><span>'+m.st[1]+'</span>';
c.onclick=function(){cur=i;render();tb.scrollIntoView({behavior:"smooth",block:"start"})};st.appendChild(c)});
render();
})();
