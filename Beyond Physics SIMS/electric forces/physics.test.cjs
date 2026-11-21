const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('./coulomb-physics.js');
const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('reference triangle: exact distances, pair forces, resultant and direction', () => {
  const c = P.initial(), f = P.forces(c);
  near(Math.hypot(c[0].x-c[1].x,c[0].y-c[1].y),3);
  near(Math.hypot(c[1].x-c[2].x,c[1].y-c[2].y),4);
  near(Math.hypot(c[0].x-c[2].x,c[0].y-c[2].y),5);
  const diagonal=P.K*6e-9*5e-9/25, left=P.K*2e-9*5e-9/16;
  near(f.net[2].x,diagonal*.8-left,1e-20);near(f.net[2].y,diagonal*.6,1e-20);
  near(Math.hypot(f.net[2].x,f.net[2].y)*1e9,7.137185720061883,1e-7);
  near(Math.atan2(f.net[2].y,f.net[2].x)*180/Math.PI,65.0484877558032,1e-7);
});
test('every pair obeys Newton’s third law; inverse-square law and neutral charge',()=>{
  const c=P.initial(), f=P.forces(c);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){near(f.pairs[i][j].x,-f.pairs[j][i].x,1e-22);near(f.pairs[i][j].y,-f.pairs[j][i].y,1e-22);}
  const a=Math.hypot(f.net[2].x,f.net[2].y);
  c.forEach(q=>{q.x*=2;q.y*=2;});const g=P.forces(c).net[2];near(Math.hypot(g.x,g.y),a/4,1e-22);
  c[2].q=0;const z=P.forces(c);near(z.net[2].x,0);near(z.net[2].y,0);
});
test('rotation changes direction while preserving force magnitude',()=>{
  const c=P.initial(), before=P.forces(c).net[2];c.forEach(q=>{const x=q.x;q.x=-q.y;q.y=x;});
  const after=P.forces(c).net[2];near(after.x,-before.y,1e-22);near(after.y,before.x,1e-22);
});
test('two held charges remain fixed while q3 accelerates in its resultant direction',()=>{
  const c=P.initial(), before=c.map(q=>({...q})), f=P.forces(c).net[2];const r=P.advance(c,.02);
  assert.equal(r.stopped,null);near(r.elapsed,.02);assert.deepEqual(c.slice(0,2),before.slice(0,2));
  assert.ok(c[2].x>before[2].x&&c[2].y>before[2].y);near(c[2].vx/.02,f.x/c[2].mass,.0002);
});
test('free motion conserves energy and momentum without damping or boundary forces',()=>{
  const c=P.initial();c.forEach(q=>{q.q=Math.abs(q.q);q.pinned=false;});const e=P.energy(c).total;
  for(let i=0;i<600;i++)assert.equal(P.advance(c,.01).stopped,null);
  near(P.energy(c).total/e,1,2e-6);
  near(c.reduce((v,q)=>v+q.mass*q.vx,0),0,1e-20);near(c.reduce((v,q)=>v+q.mass*q.vy,0),0,1e-20);
});
test('attractive close approaches pause with finite states; no singularity or tunnelling',()=>{
  const c=P.initial();c[0].q=0;c[2].x=0;let result;
  for(let i=0;i<2000;i++){result=P.advance(c,.01);if(result.stopped)break;}
  assert.equal(result.stopped,'close');assert.ok(P.separation(c)>=P.CLOSE);
  c.forEach(q=>['x','y','vx','vy'].forEach(k=>assert.ok(Number.isFinite(q[k]))));
  const fast=P.initial();fast.forEach(q=>{q.pinned=false;q.q=0;});fast[0].x=-1;fast[0].y=0;fast[1].x=1;fast[1].y=0;fast[2].y=10;fast[0].vx=10000;fast[1].vx=-10000;
  assert.equal(P.advance(fast,.01).stopped,'close');assert.ok(fast[0].x<fast[1].x);
});
test('symmetric forces cancel, while a neutral moving particle travels inertially',()=>{
  const c=P.initial();c[0].x=-2;c[0].y=0;c[0].q=5e-9;c[1].x=2;c[1].y=0;c[1].q=5e-9;c[2].x=0;c[2].y=0;
  const f=P.forces(c).net[2];near(f.x,0);near(f.y,0);P.advance(c,.2);near(c[2].x,0);near(c[2].y,0);
  c[2].q=0;c[2].vx=.5;c[2].vy=-.2;P.advance(c,.3);near(c[2].x,.15);near(c[2].y,-.06);
});

test('line preset starts all free; selecting q1 cannot leave it held',()=>{
  const c=P.preset('line');assert.ok(c.every(q=>!q.pinned));
  P.selectForMotion(c,0,'all');assert.ok(c.every(q=>!q.pinned));
  const start=c.map(q=>({...q}));assert.equal(P.advance(c,.8).stopped,null);
  c.forEach((q,i)=>{assert.ok(Math.abs(q.x-start[i].x)>.01);near(q.y,0,1e-20);});
});
test('single-particle mode transfers freedom to q1, q2 and q3 in every preset',()=>{
  for(const name of ['triangle','repel','line','balance','dipole'])for(const index of [0,1,2]){
    const c=P.preset(name);P.selectForMotion(c,index,'selected');
    c.forEach((q,i)=>assert.equal(q.pinned,i!==index,`${name}: q${i+1}`));
    const start=c.map(q=>({...q}));const f=P.forces(c).net[index];const result=P.advance(c,.2);
    assert.equal(result.stopped,null);
    c.forEach((q,i)=>{if(i!==index)assert.deepEqual(q,start[i]);});
    if(Math.hypot(f.x,f.y)>1e-18)assert.ok(Math.hypot(c[index].x-start[index].x,c[index].y-start[index].y)>.0001,`${name}: q${index+1} must move`);
    else{near(c[index].x,start[index].x);near(c[index].y,start[index].y);}
  }
});
test('selecting a charge to inspect never changes manual holds or all-free mode',()=>{
  for(const mode of ['all','custom']){
    const c=P.initial(),pins=c.map(q=>q.pinned);
    P.selectForMotion(c,0,mode);assert.deepEqual(c.map(q=>q.pinned),pins);
  }
});
