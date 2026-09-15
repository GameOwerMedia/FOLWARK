import assert from 'node:assert/strict';
import {test} from 'node:test';
import {World,DAY_SECONDS} from '../src/simulation/World';
import {dailyRegime,tickRegime,fuelPerDay} from '../src/simulation/Regime';
import {calendar,seasonalGrowth} from '../src/simulation/Seasons';
import {announceThreat,tickThreats,emergencySupplies,respondToThreat} from '../src/simulation/Threats';
const idle=(w:World)=>w.units.forEach(a=>{a.job=null;a.task='idle';a.path=[];a.destination=null;a.wait=999});
test('all scenarios cycle through four seasons and into a new year',()=>{
 for(const scenario of ['survival','sandbox','campaign'] as const){
  const w=new World(scenario);
  for(const [day,season]of [[1,'Jesien'],[7,'Zima'],[14,'Wiosna'],[21,'Lato'],[29,'Jesien']] as const){
   w.time=(day-1)*DAY_SECONDS;assert.equal(w.season,season);assert.equal(w.calendar.day,1);
  }
  assert.equal(w.calendar.year,2);
 }
 assert.equal(calendar(6*65-.001).season,'Jesien');assert.equal(calendar(6*65).season,'Zima');
 assert.equal(seasonalGrowth('Zima'),0);assert.ok(seasonalGrowth('Wiosna')>seasonalGrowth('Lato'));
});
test('season calendar and pending threats survive save/load; v6 gets a grace period',()=>{
 const w=new World('sandbox');w.time=20*65;announceThreat(w,'raid');
 const other=new World();other.restore(w.snapshot());assert.deepEqual(other.snapshot(),w.snapshot());assert.equal(other.season,'Lato');
 const old={...w.snapshot(),version:6};delete (old as any).threats;
 other.restore(old);assert.equal(other.threats.active,null);assert.equal(other.threats.nextAt,w.time+150);
});
test('pasture starts unfenced and residents can reach it',()=>{
 const w=new World(),b=w.buildings.find(b=>b.kind==='pasture')!,n=w.navigation;
 assert.equal(n.clearPoint({x:b.x-165,y:b.y-80}),true);
 assert.equal(n.clearPoint({x:b.x,y:b.y+8},12),true);
 const route=n.route({x:b.x+220,y:b.y-80},{x:b.x,y:b.y-70});
 assert.ok(route?.length);
 let previous={x:b.x+220,y:b.y-80};
 for(const p of route!){assert.ok(n.clearLine(previous,p,10));previous=p}
 assert.ok(Math.hypot(previous.x-b.x,previous.y-(b.y-70))<2);
});
test('residents separate at rest instead of occupying one point',()=>{
 const w=new World('sandbox');idle(w);const [a,b]=w.units;a.x=b.x=2100;a.y=b.y=1100;
 for(let i=0;i<30;i++)w.tick(.1);
 assert.ok(Math.hypot(a.x-b.x,(a.y-b.y)*1.6)>38);
 assert.ok(w.navigation.clearPoint(a,10));assert.ok(w.navigation.clearPoint(b,10));
});
test('fire has a warning, consumes real grain and cannot be stopped remotely by a guard',()=>{
 const w=new World('sandbox');idle(w);const start=w.economy.grain;
 assert.ok(announceThreat(w,'fire'));tickThreats(w,1);assert.equal(w.economy.grain,start);
 const guard=w.units.find(a=>a.species==='dog')!;guard.job='guard';guard.x=2000;guard.y=1500;
 w.time=31;tickThreats(w,1);assert.equal(w.threats.active!.phase,'active');assert.equal(w.threats.active!.strength,1);
 assert.ok(w.economy.grain<start);
 guard.x=w.threats.active!.x;guard.y=w.threats.active!.y+80;
 tickThreats(w,1);assert.ok(w.threats.active!.strength<1);
 assert.ok(respondToThreat(w));assert.ok(w.units.some(a=>a.job==='guard'&&a.path.length));
});
test('emergency supplies are charged, cannot spend missing resources and have a bounded effect',()=>{
 const w=new World('sandbox');announceThreat(w,'fire');
 const grain=w.economy.grain,wood=w.resources.wood;
 assert.ok(emergencySupplies(w));assert.equal(w.economy.grain,grain-10);assert.equal(w.resources.wood,wood-15);
 w.resources.wood=0;const strength=w.threats.active!.strength;assert.equal(emergencySupplies(w),false);assert.equal(w.threats.active!.strength,strength);
 w.resources.wood=100;emergencySupplies(w);emergencySupplies(w);assert.equal(w.threats.active!.strength,0);
 assert.equal(emergencySupplies(w),false);
});
test('raiders travel on collision-safe routes, and active raids freeze and restore exactly',()=>{
 const w=new World('sandbox');idle(w);announceThreat(w,'raid');w.time=31;tickThreats(w,.1);
 const first=w.threats.active!.raiders[0],start={x:first.x,y:first.y};
 assert.ok(first.path.length);for(let i=0;i<40;i++){const p={x:first.x,y:first.y};tickThreats(w,.1);assert.ok(w.navigation.clearLine(p,first,10))}
 assert.ok(Math.hypot(first.x-start.x,first.y-start.y)>20);
 const saved=w.snapshot(),other=new World();other.restore(saved);assert.deepEqual(other.snapshot(),saved);
 w.paused=true;for(let i=0;i<100;i++)w.tick(.1);assert.deepEqual(w.snapshot(),saved);
 const bad=structuredClone(saved);bad.threats.active!.raiders[0].health=Infinity;
 assert.throws(()=>other.restore(bad));assert.deepEqual(other.snapshot(),saved);
});
test('surviving the first crisis does not stop the calendar or require sandbox mode',()=>{
 const w=new World('survival');w.regime.heat=.8;w.time=10*65;dailyRegime(w);
 assert.equal(w.outcome,null);assert.ok(w.journal.some(e=>e.text.startsWith('Pierwszy kryzys')));
 w.time=13*65;dailyRegime(w);assert.equal(w.season,'Wiosna');assert.equal(w.outcome,null);
 w.time=20*65;dailyRegime(w);assert.equal(w.season,'Lato');assert.equal(w.outcome,null);
 w.time=28*65;dailyRegime(w);assert.equal(w.calendar.year,2);assert.equal(w.outcome,null);
});
test('warm seasons do not burn fuel or cause cold injuries when heating is off',()=>{
 const w=new World('survival');w.time=13*65;w.regime.heating='off';w.regime.heat=.8;
 const health=w.units[0].health,wood=w.resources.wood;assert.equal(fuelPerDay(w),0);
 for(let i=0;i<600;i++)tickRegime(w,.1);
 assert.equal(w.units[0].health,health);assert.equal(w.resources.wood,wood);assert.ok(w.regime.heat>.8);
});
test('completing a pasture does not grant a free fence',()=>{
 const w=new World('sandbox');idle(w);assert.ok(w.build('pasture',2250,1150));
 const b=w.buildings.at(-1)!;b.progress=.9999;
 const a=w.units.find(a=>a.species==='mule')!;a.target=b.id;a.job='build';a.task='build';a.path=[];a.x=b.x;a.y=b.y+40;
 w.tick(.1);assert.equal(b.progress,1);
 assert.equal(w.navigation.clearPoint({x:b.x-165,y:b.y-80}),true);
 assert.equal(w.navigation.clearPoint({x:b.x,y:b.y+8},12),true);
});
