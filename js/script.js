'use strict';
/* VIMEO main.js - dynamic content, search/sort, gallery lightbox, map, animations */
const TUTORIALS = [
 {id:1,title:'Making a Standard Solution',subject:'Chemistry',author:'Yak B.',date:'2026-09-02',desc:'Step-by-step lab guide to preparing accurate solutions.'},
 {id:2,title:'Build a Login System with PHP & MySQL',subject:'Information Technology',author:'Blessing M.',date:'2026-09-14',desc:'Create secure user registration and login pages.'},
 {id:3,title:'Designing a Simple Bridge Prototype',subject:'Engineering',author:'Kanan K.',date:'2026-08-21',desc:'Model load-bearing structures using everyday materials.'},
 {id:4,title:'Line-Following Robot with Arduino',subject:'Science & Robotics',author:'Blessing M.',date:'2026-10-05',desc:'Wire sensors and code a robot that follows a path.'},
 {id:5,title:'Titration Made Simple',subject:'Chemistry',author:'Yak B.',date:'2026-10-11',desc:'Learn to find unknown concentrations accurately.'},
 {id:6,title:'Intro to Relational Databases',subject:'Information Technology',author:'Blessing M.',date:'2026-07-30',desc:'Tables, keys and SQL queries explained with examples.'},
 {id:7,title:'3D Modelling for Prototypes',subject:'Engineering',author:'Kanan K.',date:'2026-10-20',desc:'Turn sketches into printable design models.'},
 {id:8,title:'Reading Sensors with a Microcontroller',subject:'Science & Robotics',author:'Kanan K.',date:'2026-09-27',desc:'Collect and display real-world data from sensors.'}
];
const PAGE_SIZE = 4;
const state = {q:'', subject:'all', sort:'newest', shown:PAGE_SIZE};
const $ = (s, r=document) => r.querySelector(s);
const el = (tag, cls, text) => { const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; }; // textContent = XSS-safe

/* ---------- Dynamic listing + search / filter / sort ---------- */
function getResults(){
  const q = state.q.trim().toLowerCase();
  const list = TUTORIALS.filter(t =>
    (state.subject==='all' || t.subject===state.subject) &&
    (!q || (t.title+' '+t.desc+' '+t.author+' '+t.subject).toLowerCase().includes(q)));
  const sorters = {newest:(a,b)=>b.date.localeCompare(a.date), oldest:(a,b)=>a.date.localeCompare(b.date), az:(a,b)=>a.title.localeCompare(b.title)};
  return list.sort(sorters[state.sort]);
}
function render(){
  const box = $('#tutorialList'); if(!box) return;
  const all = getResults(), visible = all.slice(0, state.shown);
  box.replaceChildren();
  visible.forEach(t => {
    const c = el('article','card');
    c.append(el('span','tag',t.subject), el('h3',null,t.title), el('p',null,t.desc),
      el('p','meta','By '+t.author+' - '+new Date(t.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})));
    box.append(c);
  });
  if(!all.length) box.append(el('p','empty','No tutorials match your search. Try a different word or subject.'));
  $('#resultCount').textContent = all.length+' tutorial'+(all.length===1?'':'s')+' found';
  $('#loadMore').hidden = visible.length >= all.length;
}
function initListing(){
  if(!$('#tutorialList')) return;
  const subjects = [...new Set(TUTORIALS.map(t=>t.subject))];
  subjects.forEach(s => { const o=el('option',null,s); o.value=s; $('#subjectFilter').append(o); });
  const box = $('#tutorialList'); box.setAttribute('aria-busy','true');
  box.append(el('p','empty','Loading tutorials...'));
  setTimeout(()=>{ box.removeAttribute('aria-busy'); render(); }, 500); // simulates loading from a server
  let timer;
  const onSearch = v => { state.q=v; state.shown=PAGE_SIZE; render(); };
  const mainInput = $('#searchInput');
  $('#localSearch').addEventListener('input', e => { clearTimeout(timer); timer=setTimeout(()=>onSearch(e.target.value),200); });
  $('#subjectFilter').addEventListener('change', e => { state.subject=e.target.value; state.shown=PAGE_SIZE; render(); });
  $('#sortSelect').addEventListener('change', e => { state.sort=e.target.value; render(); });
  $('#loadMore').addEventListener('click', () => { state.shown+=PAGE_SIZE; render(); });
  const form = $('#searchForm');
  if(form) form.addEventListener('submit', e => { // top-of-page search feeds the listing
    e.preventDefault(); $('#localSearch').value = mainInput.value; onSearch(mainInput.value);
    $('#tutorials').scrollIntoView({behavior:'smooth'});
  });
}

/* ---------- Gallery lightbox ---------- */
function initLightbox(){
  const items = [...document.querySelectorAll('.gallery button')]; if(!items.length) return;
  const lb = $('#lightbox'), img = $('img',lb), cap = $('p',lb); let i=0, opener=null;
  const show = n => { i=(n+items.length)%items.length; const s=$('img',items[i]); img.src=s.src; img.alt=s.alt; cap.textContent=s.alt; };
  const open = n => { opener=document.activeElement; show(n); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); $('.lb-close',lb).focus(); };
  const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); if(opener) opener.focus(); };
  items.forEach((b,n)=>b.addEventListener('click',()=>open(n)));
  $('.lb-close',lb).addEventListener('click',close);
  $('.lb-prev',lb).addEventListener('click',()=>show(i-1));
  $('.lb-next',lb).addEventListener('click',()=>show(i+1));
  lb.addEventListener('click',e=>{ if(e.target===lb) close(); });
  document.addEventListener('keydown',e=>{ if(!lb.classList.contains('open')) return;
    if(e.key==='Escape') close(); if(e.key==='ArrowLeft') show(i-1); if(e.key==='ArrowRight') show(i+1); });
}

/* ---------- OpenLayers map ---------- */
function initMap(){
  const target = $('#map'); if(!target) return;
  if(typeof ol==='undefined'){ target.textContent='Map could not load. Please check your connection.'; return; }
  const pos = ol.proj.fromLonLat([28.0473,-26.2041]); // CHANGE to your school/campus (lon, lat)
  const marker = new ol.Feature(new ol.geom.Point(pos));
  marker.setStyle(new ol.style.Style({image:new ol.style.Circle({radius:9,fill:new ol.style.Fill({color:'#2563eb'}),stroke:new ol.style.Stroke({color:'#fff',width:3})})}));
  new ol.Map({target:'map',
    layers:[new ol.layer.Tile({source:new ol.source.OSM()}), new ol.layer.Vector({source:new ol.source.Vector({features:[marker]})})],
    view:new ol.View({center:pos,zoom:13})});
}

/* ---------- Scroll reveal animation ---------- */
function initReveal(){
  const els = document.querySelectorAll('main section');
  els.forEach(s=>s.classList.add('reveal'));
  if(!('IntersectionObserver' in window)){ els.forEach(s=>s.classList.add('visible')); return; }
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('visible'); io.unobserve(e.target);} }),{threshold:.1});
  els.forEach(s=>io.observe(s));
}
document.addEventListener('DOMContentLoaded',()=>{ initListing(); initLightbox(); initMap(); initReveal(); });