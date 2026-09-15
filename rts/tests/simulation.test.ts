import assert from 'node:assert/strict';
import { test } from 'node:test';
import { World, DAY_SECONDS } from '../src/simulation/World';
import { harvestToInventory } from '../src/simulation/Economy';
function advance(w:World,seconds:number){for(let i=0;i<seconds*10;i++)w.tick(.1)}
test('working residents harvest, haul and deposit real resources',()=>{
 const w=new World(),grain=w.economy.grain,wood=w.resources.wood,stone=w.resources.stone;
 advance(w,60);
 assert.ok(w.economy.grain>grain+50);assert.ok(w.resources.wood>wood);assert.ok(w.resources.stone>stone);
 assert.ok(w.units.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.hunger)));
});
test('pause freezes movement, construction and economy',()=>{
 const w=new World();w.paused=true;const before=w.snapshot();advance(w,20);assert.deepEqual(w.snapshot(),before);
});
test('build costs, occupancy and completion are enforced',()=>{
 const w=new World();const wood=w.resources.wood;
 assert.equal(w.build('field',825,395),false);
 assert.equal(w.build('field',1420,300),true);
 assert.equal(w.resources.wood,wood-35);advance(w,65);assert.equal(w.built,1);
 w.resources.wood=0;assert.equal(w.build('house',1420,1020),false);
});
test('saving and restoring preserves assignments and exact state',()=>{
 const w=new World();advance(w,21);const save=w.snapshot(),other=new World();other.restore(save);
 assert.deepEqual(other.snapshot(),save);advance(other,10);assert.ok(other.time>save.time);
 assert.throws(()=>other.restore({version:1}));assert.throws(()=>other.restore({...save,resources:{wood:'wrong'}}));
});
test('food reduces hunger and unfair rations increase grievances',()=>{
 const w=new World();w.order(w.units.map(a=>a.id),'idle');w.units.forEach(a=>a.hunger=.7);
 const a=w.units[0];w.order([a.id],'eating');advance(w,30);assert.ok(a.hunger<.5);
 const equal=new World(),privileged=new World();privileged.setPolicy('privileged');
 advance(equal,60);advance(privileged,60);
 assert.ok(privileged.units[0].grievance>equal.units[0].grievance);
});
test('events pause time and apply only affordable choices',()=>{
 const w=new World();w.time=DAY_SECONDS*2-.01;w.tick(.1);assert.ok(w.event);
 const time=w.time;advance(w,10);assert.equal(w.time,time);w.resources.gold=0;w.choose(0);assert.ok(w.event);
 w.choose(2);assert.equal(w.event,null);
});
test('campaign can be won through construction and production',()=>{
 const w=new World();
 assert.ok(w.build('field',1420,300));assert.ok(w.build('well',300,300));assert.ok(w.build('granary',620,300));
 for(let i=0;i<DAY_SECONDS*7*10+30&&!w.outcome;i++){
   if(w.event){const index=w.day===3?0:w.day===5?0:w.resources.wood>=35?0:2;w.choose(index)}
   w.tick(.1);
 }
 assert.equal(w.built,3);assert.equal(w.outcome,'Wspolna przyszlosc');
 assert.equal(w.living.length,22);
 console.log('Campaign result:',Math.floor(w.economy.grain),'grain,',Math.round(w.politics.unrest*100),'unrest');
});
test('starvation is a real loss condition',()=>{
 const w=new World();w.units.forEach(a=>{a.job=null;a.path=[];a.task='idle';a.hunger=1;a.health=.01});w.economy.grain=0;
 advance(w,2);assert.ok(w.outcome);
});
test('moving with cargo does not teleport it into the barn',()=>{
 const w=new World();w.units.forEach(a=>{a.job=null;a.path=[];a.task='idle'});
 const a=w.units[0];a.carriedGrain=10;const grain=w.economy.grain;
 w.move([a.id],450,720);advance(w,10);
 assert.equal(w.economy.grain,grain);assert.equal(a.carriedGrain,10);
});
test('changing jobs deposits the previous resource without converting it',()=>{
 const w=new World();w.units.forEach(a=>{a.job=null;a.path=[];a.task='idle'});
 const a=w.units[0];a.load=8;a.resource='wood';a.x=825;a.y=440;
 const wood=w.resources.wood,stone=w.resources.stone;
 w.assign([a.id],'stone');advance(w,2);
 assert.equal(w.resources.wood,wood+8);assert.equal(w.resources.stone,stone);
});

test('movement and production are independent of frame rate',()=>{
 const slow=new World(),fast=new World();
 for(let i=0;i<400;i++)slow.tick(.1);
 for(let i=0;i<2400;i++)fast.tick(1/60);
 assert.deepEqual(fast.snapshot(),slow.snapshot());
});
test('a clicked field remains the assigned workplace',()=>{
 const w=new World(),a=w.units[0],field=w.buildings.find(b=>b.kind==='field')!;
 w.assign([a.id],'harvest',field.id);
 advance(w,90);assert.equal(a.target,field.id);assert.equal(a.job,'harvest');
});
test('hunger interrupts rest and both needs recover before work resumes',()=>{
 const w=new World(),a=w.units[0],field=w.buildings.find(b=>b.kind==='field')!;
 w.assign([a.id],'harvest',field.id);
 a.hunger=.88;a.fatigue=.92;a.task='resting';a.path=[];a.x=1075;a.y=490;
 const seen=new Set<string>();
 for(let i=0;i<1150;i++){w.tick(.1);seen.add(a.task)}
 assert.ok(seen.has('eating'));assert.ok(seen.has('resting'));assert.ok(seen.has('harvest'));
 assert.equal(a.target,field.id);assert.ok(a.health>.7);
});
test('full storage keeps undelivered cargo instead of discarding it',()=>{
 const w=new World();w.order(w.units.map(a=>a.id),'idle');
 const a=w.units[0];a.hunger=.1;a.x=720;a.y=430;a.carriedGrain=18;
 w.economy.grain=w.capacity-3;w.assign([a.id],'harvest');
 advance(w,1);assert.equal(w.economy.grain,w.capacity);assert.equal(a.carriedGrain,15);
 advance(w,8);assert.equal(a.carriedGrain,15);assert.equal(w.trade(true),false);
});
test('paths avoid structures, scenery and the pond continuously',()=>{
 const w=new World();let seed=173;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<180;i++){
  const from=w.navigation.nearestFree({x:100+rnd()*1600,y:150+rnd()*950})!;
  const to=w.navigation.nearestFree({x:100+rnd()*1600,y:150+rnd()*950})!;
  const path=w.navigation.route(from,to);assert.ok(path,'Reachable map location has no route');
  let previous=from;
  for(const point of path){assert.ok(w.navigation.clearLine(previous,point,5),JSON.stringify({previous,point}));previous=point}
 }
});
test('patrol visits successive points instead of repeating the same destination',()=>{
 const w=new World(),dog=w.units.find(a=>a.species==='dog')!;
 advance(w,60);assert.ok(dog.patrolStep>=3);assert.equal(dog.job,'patrol');
});
test('simulation movement never enters solid footprints',()=>{
 const w=new World();
 for(let i=0;i<1200;i++){
  w.tick(.1);
  for(const a of w.living)assert.ok(w.navigation.clearPoint(a,4),a.name+' crossed an obstacle');
 }
});
test('new construction replans an active route',()=>{
 const w=new World(),a=w.units[0];
 a.x=700;a.y=920;w.move([a.id],1100,920);
 const before=JSON.stringify(a.path);
 assert.ok(w.build('well',900,945));
 assert.ok(a.path.length);assert.equal(a.destination?.x,1100);
 assert.notEqual(JSON.stringify(a.path),before);
 let previous={x:a.x,y:a.y};for(const p of a.path){assert.ok(w.navigation.clearLine(previous,p,5));previous=p}
 assert.equal(w.canBuild('tower',1400,110),false);
});
test('productivity bonus increases yield without increasing fatigue per second',()=>{
 const w=new World(),a=w.units[0],copy=structuredClone(a);a.task='harvest';copy.task='harvest';
 const e1={grain:0,fieldGrain:200},e2={grain:0,fieldGrain:200};
 harvestToInventory(a,e1,1,1);harvestToInventory(copy,e2,1,1.25);
 assert.equal(a.fatigue,copy.fatigue);assert.equal(a.hunger,copy.hunger);
 assert.ok(copy.carriedGrain>a.carriedGrain);
});
