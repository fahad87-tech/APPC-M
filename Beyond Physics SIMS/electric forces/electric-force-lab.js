/* UI and rendering: no network dependencies; works directly from disk. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), P = window.Coulomb;
  const canvas = $('world'), ctx = canvas.getContext('2d'), stage = $('stage');
  const sub = ['₁', '₂', '₃'], pairColors = ['#c29030', '#4098d7', '#9a76d2'];
  const teal = '#48dfbf', stagePairs = ['#f3bf6c', '#6bc4ff', '#c7a0ff'];
  let motionMode = 'selected';
  let charges = P.initial(), selected = 2, playing = false, time = 0;
  let launch = clone(charges), trails = [[], [], []], lastTrail = 0;
  let width = 800, height = 550, dpr = 1, previousFrame = 0, uiClock = 0;
  let view = { x: 0, y: 0, scale: 70 }, rotation = 0, pointer = null;
  let probe = { x: 0, y: -0.5 }, dirty = true, stopped = false;
  const flags = {};
  ['net', 'pairs', 'components', 'distances', 'trails', 'field', 'velocity', 'grid', 'probe'].forEach(key => {
    flags[key] = $('show-' + key).checked;
    $('show-' + key).addEventListener('change', event => {
      flags[key] = event.target.checked; dirty = true;
      $('probe-value').hidden = !flags.probe;
    });
  });
  function clone(a) { return a.map(c => ({ ...c })); }
  function n(v, digits = 2) { return Math.abs(v) < 1e-9 ? (0).toFixed(digits) : v.toFixed(digits); }
  function signed(v) { return (v >= 0 ? '+' : '−') + n(Math.abs(v)); }
  function compact(v) { return Math.abs(v) >= 1e4 ? v.toExponential(2) : n(v); }
  function qtext(c) { const q = c.q * 1e9; return (q > 0 ? '+' : q < 0 ? '−' : '') + Number(Math.abs(q).toFixed(1)); }
  function screen(p) { return { x: width / 2 + (p.x - view.x) * view.scale, y: height / 2 - (p.y - view.y) * view.scale }; }
  function world(p) { return { x: (p.x - width / 2) / view.scale + view.x, y: (height / 2 - p.y) / view.scale + view.y }; }
  function eventPoint(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left - stage.clientLeft, y: e.clientY - r.top - stage.clientTop }; }
  function notice(message) { $('toast').textContent = message; $('toast').hidden = !message; }
  function setPlaying(value) {
    playing = value;
    stage.classList.toggle('running', value);
    $('run-state').textContent = value ? 'LIVE EXPERIMENT' : time > 0 ? 'PAUSED' : 'READY TO EXPLORE';
    $('play').querySelector('use').setAttribute('href', value ? '#i-pause' : '#i-play');
    $('play').querySelector('span').textContent = value ? 'Pause' : 'Play';
    $('step').disabled = value;
    updateStatus(); dirty = true;
  }
  function updateStatus() {
    const held = charges.filter(c => c.pinned).length;
    $('status').textContent = (playing ? 'Running · ' : '') + (held ? `${held === 3 ? 'All' : held === 2 ? 'Two' : 'One'} held${held < 3 ? ` · ${3 - held === 1 ? 'one' : 'two'} free` : ''}` : 'All charges free');
  }
  function edit(mutate, clearNotice = true) {
    setPlaying(false); mutate(); charges.forEach(c => { c.vx = c.vy = 0; });
    time = 0; lastTrail = 0; trails = [[], [], []]; stopped = false;
    launch = clone(charges); if (clearNotice) notice(''); syncControls(); dirty = true;
  }
  function select(index) {
    const changed = selected !== index;
    selected = index;
    if (changed && motionMode === 'selected') edit(() => P.selectForMotion(charges, index, motionMode));
    else { syncControls(); dirty = true; }
  }
  function setMotionMode(mode) {
    edit(() => {
      motionMode = mode;
      if (mode === 'all') charges.forEach(c => { c.pinned = false; });
      else P.selectForMotion(charges, selected, mode);
    });
  }
  function syncControls() {
    const c = charges[selected];
    document.querySelectorAll('[data-select]').forEach((button, i) => {
      button.setAttribute('aria-pressed', i === selected);
      button.querySelector('.dot').style.background = charges[i].q > 0 ? '#ed695e' : charges[i].q < 0 ? '#4098d7' : '#8793a1';
    });
    if (document.activeElement !== $('charge-value')) $('charge-value').value = Number((c.q * 1e9).toFixed(1));
    $('charge-range').value = c.q * 1e9;
    $('charge-range').style.accentColor = c.q < 0 ? '#4098d7' : '#ed695e';
    if (document.activeElement !== $('pos-x')) $('pos-x').value = n(c.x);
    if (document.activeElement !== $('pos-y')) $('pos-y').value = n(c.y);
    if (document.activeElement !== $('mass')) $('mass').value = Number((c.mass * 1e9).toFixed(2));
    $('pin').setAttribute('aria-pressed', c.pinned); $('pin').querySelector('span').textContent = c.pinned ? 'Held · click to release' : 'Free · click to hold';
    const held = charges.every((c, i) => c.pinned === (i !== selected));
    $('hold-two').textContent = `Move q${sub[selected]} only`;
    $('hold-two').setAttribute('aria-pressed', held);
    $('release-all').setAttribute('aria-pressed', charges.every(c => !c.pinned));
    $('mode-selected').setAttribute('aria-pressed', motionMode === 'selected');
    $('mode-all').setAttribute('aria-pressed', motionMode === 'all');
    $('mode-selected').textContent = `Move q${sub[selected]} only`;
    $('mode-caption').textContent = motionMode === 'selected' ? 'Select a charge to set it free' : motionMode === 'all' ? 'All three respond to the force' : 'Custom holds';
    document.querySelectorAll('[data-hold]').forEach((button, i) => {
      button.setAttribute('aria-pressed', charges[i].pinned);
      button.querySelector('span').textContent = charges[i].pinned ? 'Held' : 'Free';
    });
    $('rotation-value').value = `${Math.round(rotation)}°`; $('rotation').value = rotation;
    updateReadout(); updateStatus();
  }
  function updateReadout() {
    const c = charges[selected], data = P.forces(charges), f = data.net[selected];
    const size = Math.hypot(f.x, f.y), angle = ((Math.atan2(f.y, f.x) * 180 / Math.PI) + 360) % 360;
    $('result-heading').textContent = 'NET FORCE ON q' + sub[selected];
    $('force-value').textContent = compact(size * 1e9);
    $('force-angle').textContent = size > 1e-18 ? n(angle, 1) + '°' : '—';
    $('fx').textContent = signed(f.x * 1e9); $('fy').textContent = signed(f.y * 1e9);
    $('support').textContent = c.pinned ? 'Held · release to move' : size < 1e-18 ? 'Balanced · zero acceleration' : `Free to move · ${compact(size / c.mass)} m/s²`;
    $('motion-speed').textContent = `${compact(Math.hypot(c.vx,c.vy))} m/s`;
    const displacement = Math.hypot(c.x-launch[selected].x,c.y-launch[selected].y);
    $('motion-distance').textContent = `${compact(displacement)} m`;
    $('motion-heading').textContent = `TRACKING q${sub[selected]}`;
    $('run-state').textContent = playing ? 'LIVE EXPERIMENT' : time > 0 ? 'PAUSED' : 'READY TO EXPLORE';
    $('time').textContent = `t = ${time.toFixed(2)} s`;
    if (document.activeElement !== $('pos-x')) $('pos-x').value = n(c.x);
    if (document.activeElement !== $('pos-y')) $('pos-y').value = n(c.y);
    const e = P.energy(charges); $('kinetic').textContent = compact(e.kinetic * 1e9); $('potential').textContent = compact(e.potential * 1e9);
    renderAddition(data);
    if (flags.probe) {
      const e = fieldAt(probe), mag = Math.hypot(e.x, e.y);
      $('probe-value').textContent = charges.some(c => Math.hypot(c.x-probe.x,c.y-probe.y)<.1) ? 'Probe too close · move the diamond' : `E = ${compact(mag)} N/C · ${mag > 1e-12 ? n((Math.atan2(e.y, e.x) * 180 / Math.PI + 360) % 360, 1) + '°' : '—'}`;
    }
  }
  function renderAddition(data) {
    const sources = charges.map((_, i) => i).filter(i => i !== selected);
    const a = data.pairs[selected][sources[0]], b = data.pairs[selected][sources[1]], f = data.net[selected];
    const points = [{ x: 0, y: 0 }, a, f];
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const scale = Math.min(200 / Math.max(maxX - minX, 1e-12), 70 / Math.max(maxY - minY, 1e-12));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const pt = p => ({ x: 140 + (p.x - cx) * scale, y: 59 - (p.y - cy) * scale });
    const zero = pt({ x: 0, y: 0 }), mid = pt(a), end = pt(f);
    function arrow(a, b, color, id, label) {
      if (Math.hypot(a.x - b.x, a.y - b.y) < 0.4) return '';
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ox = -dy / len * 8, oy = dx / len * 8;
      return `<defs><marker id="${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${color}"/></marker></defs><path d="M${a.x},${a.y} L${b.x},${b.y}" stroke="${color}" stroke-width="2" fill="none" marker-end="url(#${id})"/><text x="${(a.x+b.x)/2+ox}" y="${(a.y+b.y)/2+oy}" fill="${color}" font-size="9" text-anchor="middle">${label}</text>`;
    }
    $('addition').innerHTML = arrow(zero, mid, pairColors[sources[0]], 'add-a', `F${sub[selected]}${sub[sources[0]]}`) + arrow(mid, end, pairColors[sources[1]], 'add-b', `F${sub[selected]}${sub[sources[1]]}`) + arrow(zero, end, '#008b7b', 'add-net', 'ΣF') + `<circle cx="${zero.x}" cy="${zero.y}" r="2.5" fill="#738195"/>` + (Math.hypot(f.x, f.y) < 1e-18 ? '<text x="140" y="100" text-anchor="middle" fill="#738195" font-size="10">Forces cancel · ΣF = 0</text>' : '');
    sources.forEach((source, j) => {
      const val = data.pairs[selected][source];
      $(j === 0 ? 'pair-a' : 'pair-b').innerHTML = `<b style="color:${pairColors[source]}">F${sub[selected]}${sub[source]}</b> ${compact(Math.hypot(val.x, val.y) * 1e9)} nN`;
    });
  }
  function fit() {
    const xs = charges.map(c => c.x), ys = charges.map(c => c.y);
    const dx = Math.max(...xs) - Math.min(...xs), dy = Math.max(...ys) - Math.min(...ys);
    view.x = (Math.max(...xs) + Math.min(...xs)) / 2; view.y = (Math.max(...ys) + Math.min(...ys)) / 2;
    view.scale = Math.max(0.0001, Math.min(115, (width - (width < 650 ? 130 : 190)) / Math.max(dx + 1.6, 4), (height - (width < 650 ? 230 : 190)) / Math.max(dy + 1.6, 3.5)));
    if (width < 650) view.y -= 12 / view.scale;
    dirty = true;
  }
  function resize() {
    const r = canvas.getBoundingClientRect(); width = r.width; height = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); fit(); dirty = true;
  }
  function label(text, x, y, color = '#a4b8c9', font = '11px') {
    ctx.font = `${font} "Segoe UI", Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    ctx.fillStyle = '#101e2deb'; ctx.fillRect(x - w / 2 - 5, y - 9, w + 10, 18);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  function line(a, b, color, weight = 1, dash = []) {
    ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
  }
  function arrow(a, dx, dy, color, weight = 2, caption = '', offset = 0) {
    const length = Math.hypot(dx, dy); if (length < 0.5) return;
    const ux = dx / length, uy = dy / length, start = Math.min(offset, length * .3);
    const head = Math.min(9, Math.max(3, length * .25));
    const tip = { x: a.x + dx, y: a.y + dy };
    line({ x: a.x + ux * start, y: a.y + uy * start }, tip, color, weight);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x - head * ux - head * .43 * uy, tip.y - head * uy + head * .43 * ux); ctx.lineTo(tip.x - head * ux + head * .43 * uy, tip.y - head * uy - head * .43 * ux); ctx.closePath(); ctx.fill();
    if (caption && length > 34) label(caption, tip.x + ux * 17, tip.y + uy * 17, color, '11px');
  }
  function grid() {
    // A 1–2–5 grid keeps metre labels readable at every zoom level.
    const raw = 45 / view.scale, exponent = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map(v => v * exponent).find(v => v >= raw);
    const tl = world({ x: 0, y: 0 }), br = world({ x: width, y: height });
    ctx.fillStyle = '#31465b';
    for (let x = Math.ceil(tl.x / step) * step; x <= br.x; x += step) {
      for (let y = Math.ceil(br.y / step) * step; y <= tl.y; y += step) {
        const p = screen({ x, y }); ctx.beginPath(); ctx.arc(p.x, p.y, .8, 0, Math.PI * 2); ctx.fill();
      }
    }
    const o = screen({ x: 0, y: 0 });
    if (o.y > 56 && o.y < height - 40) line({ x: 0, y: o.y }, { x: width, y: o.y }, '#213247');
    if (o.x > 15 && o.x < width - 15) line({ x: o.x, y: 55 }, { x: o.x, y: height - 38 }, '#213247');
    const bar = step * view.scale;
    line({ x: 22, y: height - 59 }, { x: 22 + bar, y: height - 59 }, '#99a8b5');
    line({ x: 22, y: height - 62 }, { x: 22, y: height - 56 }, '#99a8b5');
    line({ x: 22 + bar, y: height - 62 }, { x: 22 + bar, y: height - 56 }, '#99a8b5');
    label(`${Number(step.toPrecision(3))} m`, 22 + bar / 2, height - 73, '#95a2af', '10px');
  }
  function fieldAt(p) {
    let x = 0, y = 0;
    charges.forEach(c => { const dx = p.x - c.x, dy = p.y - c.y, r = Math.hypot(dx, dy); if (r > 1e-12) { const f = P.K * c.q / (r*r*r); x += f*dx; y += f*dy; } });
    return { x, y };
  }
  function drawField() {
    for (let x = 35; x < width - 20; x += 44) for (let y = 75; y < height - 45; y += 44) {
      const w = world({ x, y }); if (charges.some(c => Math.hypot(w.x-c.x, w.y-c.y) * view.scale < 42)) continue;
      const e = fieldAt(w), mag = Math.hypot(e.x, e.y); if (mag < 1e-10) continue;
      const length = 15 + Math.min(9, Math.log1p(mag) * 2);
      ctx.globalAlpha = .2 + .25 * Math.min(1, Math.log1p(mag) / 5);
      arrow({ x: x - e.x / mag * length / 2, y: y + e.y / mag * length / 2 }, e.x / mag * length, -e.y / mag * length, '#7e9baf', 1);
    }
    ctx.globalAlpha = 1;
  }
  function drawDistances() {
    const centroid = { x: charges.reduce((v,c) => v+c.x,0)/3, y: charges.reduce((v,c) => v+c.y,0)/3 };
    const center = screen(centroid);
    for (let i = 0; i < 3; i++) for (let j = i+1; j < 3; j++) {
      const a = screen(charges[i]), b = screen(charges[j]);
      line(a,b,'#526477',1,[4,6]);
      const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
      const dx = mid.x-center.x, dy=mid.y-center.y, len=Math.hypot(dx,dy)||1;
      const area=Math.abs((charges[1].x-charges[0].x)*(charges[2].y-charges[0].y)-(charges[2].x-charges[0].x)*(charges[1].y-charges[0].y));
      const collinear=area<1e-6;
      const offset=width<650?34:22;
      label(`${n(Math.hypot(charges[i].x-charges[j].x,charges[i].y-charges[j].y))} m`,collinear?mid.x:mid.x+dx/len*offset,collinear?mid.y-(i===0&&j===2?96:57):mid.y+dy/len*offset,'#afc1d0');
    }
  }
  function draw() {
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height); ctx.fillStyle='#101c2b';ctx.fillRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.55,height*.48,0,width*.55,height*.48,width*.68);
    glow.addColorStop(0,'#20384d70');glow.addColorStop(1,'#101c2b00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    if(flags.grid)grid(); if(flags.field)drawField();
    if(flags.trails) trails.forEach((trail,i) => {
      if(trail.length<2)return;
      ctx.beginPath();trail.forEach((p,j) => { const a=screen(p);if(j===0)ctx.moveTo(a.x,a.y);else ctx.lineTo(a.x,a.y); });
      ctx.strokeStyle=charges[i].q<0?'#68c4ffb0':'#ff8a78b0';ctx.lineWidth=3;ctx.stroke();
      const origin=screen(trail[0]);ctx.beginPath();ctx.arc(origin.x,origin.y,5,0,Math.PI*2);ctx.strokeStyle='#94a8ba80';ctx.lineWidth=1;ctx.stroke();
    });
    if(flags.distances)drawDistances();
    const f=P.forces(charges), requested=Number($('arrow-scale').value);
    let max=0;
    if(flags.net)f.net.forEach(v=>{max=Math.max(max,Math.hypot(v.x,v.y)*1e9);});
    if(flags.pairs)f.pairs[selected].forEach(v=>{max=Math.max(max,Math.hypot(v.x,v.y)*1e9);});
    const factor=Math.min(requested, Math.min(width*.28,height*.30)/Math.max(max,1e-10));
    $('vector-scale').textContent=`1 nN = ${factor<.1?factor.toExponential(1):n(factor,1)} px${factor<requested-.01?' · auto':''}`;
    if(flags.components){
      const p=screen(charges[selected]), net=f.net[selected], dx=net.x*1e9*factor,dy=-net.y*1e9*factor;
      arrow(p,dx,0,'#71afa6',1.5,'Fₓ',24); arrow({x:p.x+dx,y:p.y},0,dy,'#71afa6',1.5,'Fᵧ');
      line(p,{x:p.x,y:p.y+dy},'#9dc9c2',1,[3,4]);line({x:p.x,y:p.y+dy},{x:p.x+dx,y:p.y+dy},'#9dc9c2',1,[3,4]);
      if(Math.hypot(dx,dy)>20){const a=Math.atan2(dy,dx);ctx.beginPath();ctx.arc(p.x,p.y,36,a<0?a:0,a<0?0:a);ctx.strokeStyle='#b4d4ce';ctx.lineWidth=1;ctx.stroke();}
    }
    if(flags.pairs)f.pairs[selected].forEach((v,j)=>{
      if(j===selected)return;const p=screen(charges[selected]);
      arrow(p,v.x*1e9*factor,-v.y*1e9*factor,stagePairs[j],2,`F${sub[selected]}${sub[j]}`,31);
    });
    if(flags.net)f.net.forEach((v,i)=>{ctx.globalAlpha=i===selected?1:.5;arrow(screen(charges[i]),v.x*1e9*factor,-v.y*1e9*factor,teal,i===selected?3.5:2,i===selected?'ΣF':'',31);});
    ctx.globalAlpha=1;
    if(flags.velocity){
      const vmax=Math.max(...charges.map(c=>Math.hypot(c.vx,c.vy))), vs=Math.min(28,130/Math.max(vmax,1e-10));
      charges.forEach((c,i)=>arrow(screen(c),c.vx*vs,-c.vy*vs,'#a37ac1',2,i===selected?'v':'',25));
      label(`velocity: 1 m/s = ${n(vs,1)} px`,width-112,height-53,'#a37ac1','10px');
    }
    if(flags.probe){
      const p=screen(probe),e=fieldAt(probe),mag=Math.hypot(e.x,e.y);
      if(mag>1e-10&&charges.every(c=>Math.hypot(c.x-probe.x,c.y-probe.y)>=.1))arrow(p,e.x/mag*57,-e.y/mag*57,'#627d92',2,'E',8);
      ctx.beginPath();ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x+7,p.y);ctx.lineTo(p.x,p.y+7);ctx.lineTo(p.x-7,p.y);ctx.closePath();ctx.fillStyle='white';ctx.fill();ctx.strokeStyle='#627d92';ctx.lineWidth=2;ctx.stroke();
    }
    charges.forEach((c,i)=>{
      const p=screen(c),el=$('particle-'+c.id);
      el.style.left=p.x+'px';el.style.top=p.y+'px';el.classList.toggle('negative',c.q<0);el.classList.toggle('neutral',c.q===0);el.classList.toggle('selected',i===selected);
      el.querySelector('.sign-glyph').textContent=c.q>0?'+':c.q<0?'−':'0';el.querySelector('.charge-label').textContent=`q${sub[i]} · ${qtext(c)} nC`;el.querySelector('.lock').hidden=!c.pinned;
      el.querySelector('.motion-tag').textContent=c.pinned?'HELD':'FREE';el.classList.toggle('held',c.pinned);
      el.setAttribute('aria-label',`Charge q${i+1}, ${qtext(c)} nanocoulombs, ${c.pinned?'held':'free'}. Arrow keys move; P toggles hold.`);
    });
    dirty=false;
  }
  function follow() {
    if(charges.some(c=>{const p=screen(c);return p.x<65||p.x>width-70||p.y<100||p.y>height-95;}))fit();
  }
  function tick(dt) {
    const result=P.advance(charges,dt);time+=result.elapsed;
    if(time-lastTrail>=.015){trails.forEach((trail,i)=>{if(!trail.length)trail.push({x:launch[i].x,y:launch[i].y});trail.push({x:charges[i].x,y:charges[i].y});if(trail.length>900)trail.shift();});lastTrail=time;}
    if(result.stopped){setPlaying(false);stopped=true;notice(result.stopped==='close'?'Close approach · paused. Rewind or move a charge to continue.':'Very rapid motion · paused. Rewind to explore at a slower speed.');}
    follow();dirty=true;
  }
  function start() {
    if(playing){setPlaying(false);return;}
    if(stopped){notice('Rewind or move a charge before playing again.');return;}
    if(charges.every(c=>c.pinned)){notice('Release a charge to set it in motion.');return;}
    notice('');setPlaying(true);
  }
  function frame(timestamp) {
    const dt=previousFrame?Math.min((timestamp-previousFrame)/1000,.04):0;previousFrame=timestamp;
    if(playing&&!pointer)tick(dt*Number($('speed').value));
    uiClock+=dt;if(uiClock>.06){updateReadout();uiClock=0;}
    if(dirty)draw();requestAnimationFrame(frame);
  }
  function resetPreset(name) {
    edit(()=>{
      charges=P.preset(name);selected=2;rotation=0;motionMode=charges.every(c=>!c.pinned)?'all':'selected';
    });fit();
  }
  function moveCharge(i,p) {
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e5||Math.abs(p.y)>1e5)return false;
    if(charges.some((c,j)=>j!==i&&Math.hypot(p.x-c.x,p.y-c.y)<=P.CLOSE+.02)){notice('Keep charges at least 0.20 m apart.');return false;}
    charges[i].x=p.x;charges[i].y=p.y;return true;
  }
  document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.select))));
  $('play').addEventListener('click',start);
  $('step').addEventListener('click',()=>{
    if(stopped){notice('Rewind or move a charge before stepping again.');return;}
    if(charges.every(c=>c.pinned)){notice('Release a charge to set it in motion.');return;}
    notice('');tick(.02);updateReadout();
  });
  $('restart').addEventListener('click',()=>{edit(()=>{charges=clone(launch);});fit();});
  $('reset').addEventListener('click',()=>{$('preset').value='triangle';resetPreset('triangle');});
  $('preset').addEventListener('change',e=>resetPreset(e.target.value));
  function toggleHold(index) { edit(()=>{charges[index].pinned=!charges[index].pinned;motionMode='custom';}); }
  $('pin').addEventListener('click',()=>toggleHold(selected));
  document.querySelectorAll('[data-hold]').forEach(button=>button.addEventListener('click',()=>toggleHold(Number(button.dataset.hold))));
  $('hold-two').addEventListener('click',()=>setMotionMode('selected'));
  $('release-all').addEventListener('click',()=>setMotionMode('all'));
  $('mode-selected').addEventListener('click',()=>setMotionMode('selected'));
  $('mode-all').addEventListener('click',()=>setMotionMode('all'));
  $('flip-sign').addEventListener('click',()=>edit(()=>{charges[selected].q=-charges[selected].q;}));
  function changeCharge(value) {
    if(Number.isFinite(value)&&value>=-20&&value<=20&&Math.abs(charges[selected].q-value*1e-9)>1e-22)edit(()=>{charges[selected].q=value*1e-9;});
  }
  $('charge-value').addEventListener('input',e=>{if(e.target.value.trim())changeCharge(Number(e.target.value));});
  $('charge-value').addEventListener('blur',()=>{$('charge-value').value=Number((charges[selected].q*1e9).toFixed(1));});
  $('charge-range').addEventListener('input',e=>changeCharge(Number(e.target.value)));
  ['x','y'].forEach(axis=>{
    $('pos-'+axis).addEventListener('input',e=>{
      if(!e.target.value.trim())return;
      const p={x:charges[selected].x,y:charges[selected].y};p[axis]=Number(e.target.value);
      if(p[axis]!==charges[selected][axis]&&moveCharge(selected,p)){edit(()=>{});fit();}
    });
    $('pos-'+axis).addEventListener('blur',()=>{$('pos-'+axis).value=n(charges[selected][axis]);});
  });
  $('mass').addEventListener('input',e=>{const mass=Number(e.target.value);if(mass>=1&&mass<=100&&Math.abs(charges[selected].mass-mass*1e-9)>1e-22)edit(()=>{charges[selected].mass=mass*1e-9;});});
  $('mass').addEventListener('blur',()=>{$('mass').value=Number((charges[selected].mass*1e9).toFixed(2));});
  ['charge-value','pos-x','pos-y','mass'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur();}));
  $('rotation').addEventListener('input',e=>{
    const value=Number(e.target.value),r=(value-rotation)*Math.PI/180;
    edit(()=>{
      const cx=charges.reduce((s,c)=>s+c.x,0)/3,cy=charges.reduce((s,c)=>s+c.y,0)/3;
      charges.forEach(c=>{const x=c.x-cx,y=c.y-cy;c.x=cx+x*Math.cos(r)-y*Math.sin(r);c.y=cy+x*Math.sin(r)+y*Math.cos(r);});rotation=value;
    });fit();
  });
  $('mirror').addEventListener('click',()=>{edit(()=>{const cx=charges.reduce((s,c)=>s+c.x,0)/3;charges.forEach(c=>{c.x=2*cx-c.x;});rotation=0;});fit();});
  $('arrow-scale').addEventListener('input',()=>{dirty=true;});
  $('fit').addEventListener('click',fit);
  function zoom(factor) {view.scale=Math.max(.0001,Math.min(280,view.scale*factor));dirty=true;}
  $('zoom-in').addEventListener('click',()=>zoom(1.2));$('zoom-out').addEventListener('click',()=>zoom(1/1.2));
  canvas.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();zoom(Math.exp(-e.deltaY*.002));}},{passive:false});
  charges.forEach((c,i)=>{
    const el=$('particle-'+c.id);
    el.addEventListener('click',()=>select(i));
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();select(i);el.focus({preventScroll:true});
      const w=world(eventPoint(e));pointer={type:'charge',index:i,dx:charges[i].x-w.x,dy:charges[i].y-w.y,changed:false};
      setPlaying(false);el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(!pointer||pointer.type!=='charge'||pointer.index!==i)return;
      const w=world(eventPoint(e));const ok=moveCharge(i,{x:w.x+pointer.dx,y:w.y+pointer.dy});
      if(ok){pointer.changed=true;notice('');dirty=true;updateReadout();}
    });
    const finish=()=>{
      if(!pointer||pointer.type!=='charge')return;const changed=pointer.changed;pointer=null;
      if(changed)edit(()=>{});
    };
    el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);el.addEventListener('lostpointercapture',finish);
    el.addEventListener('keydown',e=>{
      const delta={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];
      if(delta){e.preventDefault();select(i);edit(()=>moveCharge(i,{x:charges[i].x+delta[0]*(e.shiftKey?5:1),y:charges[i].y+delta[1]*(e.shiftKey?5:1)}),false);follow();}
    });
  });
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const p=eventPoint(e),pr=screen(probe);
    pointer=flags.probe&&Math.hypot(pr.x-p.x,pr.y-p.y)<22?{type:'probe'}:{type:'pan',x:p.x,y:p.y,vx:view.x,vy:view.y};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointer)return;const p=eventPoint(e);
    if(pointer.type==='probe'){const w=world(p);if(charges.every(c=>Math.hypot(c.x-w.x,c.y-w.y)>.1)){probe=w;updateReadout();}}
    if(pointer.type==='pan'){view.x=pointer.vx-(p.x-pointer.x)/view.scale;view.y=pointer.vy+(p.y-pointer.y)/view.scale;}
    dirty=true;
  });
  const endCanvas=()=>{pointer=null;};canvas.addEventListener('pointerup',endCanvas);canvas.addEventListener('pointercancel',endCanvas);canvas.addEventListener('lostpointercapture',endCanvas);
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,select,textarea')||e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.code==='Space'&&(e.target===document.body||e.target.classList.contains('charge'))){e.preventDefault();start();}
    if(e.key.toLowerCase()==='p'){e.preventDefault();$('pin').click();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);previousFrame=0;});
  $('save-image').addEventListener('click',()=>{
    draw();const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;
    const c=out.getContext('2d');c.drawImage(canvas,0,0);c.scale(dpr,dpr);
    charges.forEach((q,i)=>{
      const p=screen(q);c.beginPath();c.arc(p.x,p.y,23,0,Math.PI*2);c.fillStyle=q.q>0?'#ed695e':q.q<0?'#4098d7':'#8793a1';c.fill();c.strokeStyle='white';c.lineWidth=2;c.stroke();
      c.textAlign='center';c.textBaseline='middle';c.fillStyle='white';c.font='30px Segoe UI';c.fillText(q.q>0?'+':q.q<0?'−':'0',p.x,p.y-1);
      c.fillStyle='#dce9f3';c.font='12px Segoe UI';c.fillText(`q${sub[i]} · ${qtext(q)} nC · ${q.pinned?'held':'free'}`,p.x,p.y+43);
    });
    c.fillStyle='#fff';c.fillRect(0,0,width,50);c.fillRect(0,height-34,width,34);c.fillStyle='#1e2d40';c.textAlign='left';c.font='600 15px Segoe UI';c.fillText('Electric Force Lab · Beyond Physics',22,25);c.font='11px Segoe UI';
    const f=P.forces(charges).net[selected],angle=(Math.atan2(f.y,f.x)*180/Math.PI+360)%360;
    c.fillText(`q${sub[selected]}: |ΣF| = ${compact(Math.hypot(f.x,f.y)*1e9)} nN · ${Math.hypot(f.x,f.y)>1e-18?n(angle,1)+'°':'direction undefined'} · t = ${n(time)} s`,22,height-16);
    out.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='electric-force-experiment.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  });
  new ResizeObserver(resize).observe(stage);syncControls();resize();requestAnimationFrame(frame);
})();
