import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const lbar = $('#lbar'); lbar.style.width = '40%';
const TAU = Math.PI * 2;

/* ---------------- renderer ---------------- */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, 8);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(3, 4, 5); scene.add(key);
const back = new THREE.PointLight(0xffa640, 18, 9); back.position.set(0, 0.2, -2.2); scene.add(back);
const rimL = new THREE.DirectionalLight(0xffd7a8, 1.4); rimL.position.set(-5, 1, -2); scene.add(rimL);

/* ---------------- materials ---------------- */
const glassM = new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0, roughness:0.04, transmission:0, transparent:true, opacity:0.13,
  specularIntensity:1, clearcoat:1, clearcoatRoughness:0.02, envMapIntensity:2.2, depthWrite:false });
const glassBack = glassM.clone(); glassBack.side = THREE.BackSide; glassBack.opacity = 0.09;
const liquidM = new THREE.MeshPhysicalMaterial({ color:0xb4560c, roughness:0.08, metalness:0, clearcoat:1, clearcoatRoughness:0.04,
  emissive:0x7a2c00, emissiveIntensity:0.45, envMapIntensity:0.9 });
const goldM = new THREE.MeshStandardMaterial({ color:0xe5b25a, metalness:1, roughness:0.18, flatShading:true });
const goldSmooth = new THREE.MeshStandardMaterial({ color:0xe0ad55, metalness:1, roughness:0.22 });
const tubeM = new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.2, transmission:0, transparent:true, opacity:0.55 });
const darkM = new THREE.MeshStandardMaterial({ color:0x1c120b, metalness:0.3, roughness:0.4 });

/* ---------------- helpers ---------------- */
function roundRect(w, h, r){
  const s = new THREE.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function slab(w, h, d, r, bev){
  const g = new THREE.ExtrudeGeometry(roundRect(w, h, r), { depth:d, bevelEnabled:true, bevelThickness:bev, bevelSize:bev, bevelSegments:6, curveSegments:18 });
  g.translate(0, 0, -d/2); g.computeVertexNormals(); return g;
}

/* ---------------- bottle ---------------- */
const bottle = new THREE.Group(); scene.add(bottle);
const parts = {};
const P = (name, dy) => { const g = new THREE.Group(); g.userData.dy = dy; bottle.add(g); parts[name] = g; return g; };

const BW = 1.28, BH = 1.48, BD = 0.66, BEV = 0.13, BOT = -0.95;
const glassG = P('glass', 0);
const bodyGeo = slab(BW, BH, BD, 0.16, BEV);
const bodyBack = new THREE.Mesh(bodyGeo, glassBack); bodyBack.position.y = BOT + BH/2 + BEV; bodyBack.renderOrder = 1; glassG.add(bodyBack);
const body = new THREE.Mesh(bodyGeo, glassM); body.position.y = BOT + BH/2 + BEV; body.renderOrder = 2; glassG.add(body);
// shoulder + neck in glass
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.16, 48), glassM); neck.position.y = BOT + BH + 2*BEV + 0.06; glassG.add(neck);

// liquid (sits inside the thick glass, leaving a heavy base)
const liqG = P('liquid', -1.25);
const LH = 1.06;
const liquid = new THREE.Mesh(slab(BW - 0.3, LH, BD - 0.22, 0.1, 0.06), liquidM);
liquid.position.y = BOT + 0.36 + LH/2; liqG.add(liquid);
// meniscus line
const men = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.3, BD - 0.2), new THREE.MeshStandardMaterial({ color:0xffd28a, roughness:0.1, metalness:0.2, transparent:true, opacity:0.6 }));
men.rotation.x = -Math.PI/2; men.position.y = BOT + 0.36 + LH + 0.06; liqG.add(men);

// dip tube
const tubeG = P('tube', 0.42);
const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.45, 12), tubeM); tube.position.y = BOT + 0.36 + 0.72 + 0.12; tubeG.add(tube);

// collar + atomiser
const collarG = P('collar', 0.72);
const collarY = BOT + BH + 2*BEV + 0.2;
const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.14, 64), goldSmooth); collar.position.y = collarY; collarG.add(collar);
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.018, 12, 64), goldSmooth); ring.rotation.x = Math.PI/2; ring.position.y = collarY - 0.07; collarG.add(ring);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 24), goldSmooth); stem.position.y = collarY + 0.13; collarG.add(stem);
const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 32), darkM); nozzle.position.y = collarY + 0.24; collarG.add(nozzle);

// faceted cap
const capG = P('cap', 1.2);
const capY = collarY + 0.4;
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.62, 8, 1), goldM); cap.position.y = capY; cap.rotation.y = Math.PI/8; capG.add(cap);
const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.36, 0.12, 8, 1), goldM); capTop.position.y = capY + 0.37; capTop.rotation.y = Math.PI/8; capG.add(capTop);
const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshPhysicalMaterial({ color:0xd8741b, roughness:0, metalness:0, clearcoat:1, emissive:0x5a2200, emissiveIntensity:0.5 }));
gem.scale.y = 0.55; gem.position.y = capY + 0.46; capG.add(gem);

// label (gold foil on the front face)
const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 1200;
const labelTex = new THREE.CanvasTexture(lc); labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 8;
let SIZE = 50;
function drawLabel(){
  const g = lc.getContext('2d'); g.clearRect(0, 0, 1024, 1200);
  const foil = g.createLinearGradient(0, 0, 1024, 1200); foil.addColorStop(0, '#fff2c8'); foil.addColorStop(.45, '#e2ad55'); foil.addColorStop(1, '#a8701f');
  g.fillStyle = foil; g.strokeStyle = foil; g.textAlign = 'center';
  g.lineWidth = 3; g.strokeRect(150, 210, 724, 780);
  g.lineWidth = 1.5; g.strokeRect(168, 228, 688, 744);
  g.font = '500 70px Cormorant, serif'; g.letterSpacing = '24px'; g.fillText('AUŠRA', 524, 360);
  g.font = '500 26px Manrope, sans-serif'; g.letterSpacing = '14px'; g.fillText('PARFUMS · KLAIPĖDA', 518, 410);
  g.beginPath(); g.moveTo(400, 470); g.lineTo(624, 470); g.stroke();
  g.font = 'italic 400 132px Cormorant, serif'; g.letterSpacing = '0px'; g.fillText('Gintaras', 512, 620);
  g.font = '400 64px Cormorant, serif'; g.fillText('Nº 3', 512, 712);
  g.font = '500 26px Manrope, sans-serif'; g.letterSpacing = '12px'; g.fillText('EXTRAIT DE PARFUM', 518, 830);
  g.font = '500 30px Manrope, sans-serif'; g.letterSpacing = '6px'; g.fillText(`${SIZE} ml · ${(SIZE/29.57).toFixed(1)} fl.oz`, 515, 900);
  labelTex.needsUpdate = true;
}
const label = new THREE.Mesh(new THREE.PlaneGeometry(BW + 0.05, (BW + 0.05) * 1200/1024), new THREE.MeshStandardMaterial({ map:labelTex, transparent:true, metalness:0.9, roughness:0.25, depthWrite:false }));
label.position.set(0, body.position.y + 0.02, BD/2 + BEV + 0.004); label.renderOrder = 3; glassG.add(label);

/* ---------------- golden dust ---------------- */
const N = 380, dpos = new Float32Array(N*3), dsp = new Float32Array(N);
for(let i=0;i<N;i++){ dpos[i*3] = (Math.random()-.5)*9; dpos[i*3+1] = (Math.random()-.5)*6; dpos[i*3+2] = (Math.random()-.5)*4 - 1; dsp[i] = 0.05 + Math.random()*0.2; }
const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const dot = document.createElement('canvas'); dot.width = dot.height = 64; { const g = dot.getContext('2d'); const r = g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,230,170,1)'); r.addColorStop(.3,'rgba(255,190,90,.6)'); r.addColorStop(1,'rgba(255,170,60,0)'); g.fillStyle = r; g.fillRect(0,0,64,64); }
const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ size:0.07, map:new THREE.CanvasTexture(dot), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0.75 }));
scene.add(dust);

/* ---------------- keyframes (one per section) ---------------- */
const KS = [
  { rx:0.1,  ry:-0.5, rz:0,    x:0,     y:-0.28, s:0.95, ex:0, op:1,    bg:['#6a3510','#120703'] }, // hero
  { rx:0.06, ry:0.55, rz:0,    x:1.4,   y:-0.05,s:1.05, ex:0, op:1,    bg:['#f2c9b1','#b8735a'] }, // story — dawn
  { rx:0.18, ry:-0.85,rz:0.04, x:-1.45, y:0,    s:1.0,  ex:0, op:1,    bg:['#f0c76c','#8d5718'] }, // notes — honey
  { rx:0.0,  ry:1.05, rz:-0.32,x:1.4,   y:0.05, s:1.0,  ex:0, op:1,    bg:['#5d3b78','#140b20'] }, // on skin — dusk
  { rx:0.16, ry:-0.55,rz:0.04, x:-1.4,  y:-0.42,s:0.66, ex:1, op:1,    bg:['#3d3530','#0b0908'] }, // craft — smoke
  { rx:0.1,  ry:0.2,  rz:0,    x:0,     y:0,    s:1.35, ex:0, op:0.16, bg:['#f1e5cf','#c5a87e'] }, // origins — sand
  { rx:0.05, ry:2.55, rz:0,    x:1.4,   y:0,    s:1.0,  ex:0, op:1,    bg:['#b6641c','#2a1104'] }, // numbers — amber
  { rx:0.1,  ry:TAU-0.4,rz:0,  x:-1.45, y:-0.05,s:1.05, ex:0, op:1,    bg:['#5e1b2c','#15050b'] }, // buy — wine
  { rx:0.1,  ry:TAU+0.6,rz:0,  x:0,     y:0.4,  s:0.8,  ex:0, op:0,    bg:['#1f1612','#080505'] }, // faq
];
const MOB = [ {x:0,y:0.35,s:0.78}, {x:0,y:1.2,s:0.58}, {x:0,y:1.2,s:0.58}, {x:0,y:1.2,s:0.58}, {x:0,y:1.2,s:0.46}, {x:0,y:1.2,s:0.58,op:0.12}, {x:0,y:1.2,s:0.58}, {x:0,y:1.2,s:0.6}, {x:0,y:1.2,s:0.5,op:0} ];
const cur = { rx:0.1, ry:-2.2, rz:0, x:0, y:-0.1, s:0.6, ex:0, op:1 };
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const lerp = (a,b,t) => a + (b-a)*t;
const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
const mix = (a,b,t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')})`; };
const sections = [...document.querySelectorAll('main section')];
$('#progress').innerHTML = sections.map(() => '<i></i>').join('');
const dots = [...document.querySelectorAll('#progress i')];
let sizeMul = 1, sizeCur = 1;

function target(){
  const mid = scrollY + innerHeight/2;
  const centers = sections.map(s => s.offsetTop + Math.min(s.offsetHeight, innerHeight*1.4)/2);
  let i = 0; while(i < centers.length-2 && mid > centers[i+1]) i++;
  let t = (mid - centers[i]) / (centers[i+1] - centers[i]); t = Math.min(1, Math.max(0, t));
  const e = ease(t), mob = innerWidth < 860;
  const A = { ...KS[i], ...(mob ? MOB[i] : {}) }, B = { ...KS[i+1], ...(mob ? MOB[i+1] : {}) };
  const o = {}; for(const k of ['rx','ry','rz','x','y','s','ex','op']) o[k] = lerp(A[k], B[k], e);
  const r = document.documentElement.style;
  const bg1 = mix(A.bg[0], B.bg[0], e), bg2 = mix(A.bg[1], B.bg[1], e);
  r.setProperty('--bg1', bg1); r.setProperty('--bg2', bg2);
  const L = (c => { const [rr,gg,bb] = c.match(/\d+/g).map(Number); return (0.299*rr+0.587*gg+0.114*bb)/255; })(bg1);
  const light = L > 0.6;
  r.setProperty('--fg', light ? '#2a170b' : '#f6ead8');
  r.setProperty('--mut', light ? 'rgba(42,23,11,.74)' : 'rgba(246,234,216,.7)');
  r.setProperty('--line', light ? 'rgba(42,23,11,.22)' : 'rgba(246,234,216,.2)');
  r.setProperty('--acc', light ? '#8a3c0e' : '#e9b35f');
  r.setProperty('--card', light ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.06)');
  const act = t < .5 ? i : i+1; dots.forEach((d,k) => d.classList.toggle('on', k === act));
  const bt = $('#bigtitle'), hp = Math.min(1, scrollY / (innerHeight*0.7));
  bt.style.opacity = 1 - hp; bt.style.transform = `translateY(calc(${mob ? '-140%' : '-55%'} - ${hp*80}px)) scale(${1 + hp*0.12})`;
  return o;
}

/* ---------------- resize / mouse ---------------- */
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = w < 860 ? 42 : 30; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; });

/* ---------------- loop ---------------- */
const clock = new THREE.Clock();
function frame(){
  const dt = Math.min(clock.getDelta(), 0.05), T = target(), k = 1 - Math.pow(0.0015, dt), now = performance.now()/1000;
  for(const p in T) cur[p] = lerp(cur[p], T[p], k);
  sizeCur = lerp(sizeCur, sizeMul, k);
  bottle.rotation.set(cur.rx + my*0.1, cur.ry + mx*0.3 + Math.sin(now*0.4)*0.04, cur.rz);
  bottle.position.set(cur.x, cur.y + Math.sin(now*0.7)*0.03, 0);
  bottle.scale.setScalar(cur.s * sizeCur);
  for(const n in parts) parts[n].position.y = parts[n].userData.dy * cur.ex;
  parts.liquid.position.x = 0;
  canvas.style.opacity = cur.op.toFixed(3);
  // liquid shimmer
  liquidM.emissiveIntensity = 0.42 + Math.sin(now*1.3)*0.06;
  // dust drift
  const pa = dgeo.attributes.position.array;
  for(let i=0;i<N;i++){ pa[i*3+1] += dsp[i]*dt; pa[i*3] += Math.sin(now*0.5 + i)*0.0015; if(pa[i*3+1] > 3) pa[i*3+1] = -3; }
  dgeo.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ---------------- reveal + counters ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if(!e.isIntersecting) return; e.target.classList.add('in');
  e.target.querySelectorAll('[data-count]').forEach(el => { if(el.dataset.done) return; el.dataset.done = 1; const to = +el.dataset.count, suf = el.dataset.suf || '', t0 = performance.now();
    const step = n => { const p = Math.min(1, (n - t0)/1700), v = Math.round(to * (1 - Math.pow(1-p, 3))); el.textContent = v + suf; if(p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}), { threshold:0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------------- sizes ---------------- */
$('#sizes').addEventListener('click', e => {
  const b = e.target.closest('.size'); if(!b) return;
  document.querySelectorAll('.size').forEach(x => x.classList.toggle('on', x === b));
  SIZE = +b.dataset.s; sizeMul = { 30:0.84, 50:1, 100:1.17 }[SIZE];
  $('#price').textContent = '€' + b.dataset.p; drawLabel();
});

/* ---------------- modal + nav ---------------- */
document.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => $('#modal').classList.add('on')));
$('#mclose').onclick = () => $('#modal').classList.remove('on');
$('#modal').onclick = e => { if(e.target.id === 'modal') $('#modal').classList.remove('on'); };
const go = id => { const s = document.getElementById(id); scrollTo({ top:s.offsetTop, behavior:'smooth' }); };
document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.getAttribute('href').slice(1)); }));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

/* ---------------- start ---------------- */
lbar.style.width = '75%';
document.fonts.load('500 70px Cormorant').then(() => document.fonts.ready).then(() => {
  drawLabel();
  renderer.compile(scene, camera);
  lbar.style.width = '100%';
  setTimeout(() => $('#loader').classList.add('gone'), 400);
  frame();
});
window.__gin = { cur, bottle, setSize:s => document.querySelector(`.size[data-s="${s}"]`).click() };
