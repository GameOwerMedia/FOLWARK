import test from 'node:test';
import assert from 'node:assert/strict';
import {World,DAY_SECONDS} from '../src/simulation/World';
import {issueEdict,insulate,setPress,sendConvoy,tickRegime,recordDeaths,fuelPerDay} from '../src/simulation/Regime';
import {neighborSites,gates,decorations} from '../src/simulation/Landscape';
const advance=(w:World,seconds:number)=>{for(let t=0;t<seconds;t+=.1)w.tick(.1)};
const dispatchTime=(w:World,seconds:number)=>{for(let t=0;t<seconds;t+=.1)tickRegime(w,.1)};
test('new farm has no free perimeter fence and all neighbors are reachable',()=>{
 const w=new World();
 assert.equal(w.navigation.clearPoint({x:900,y:180}),true);
 for(const g of gates)assert.ok(w.navigation.clearPoint(g));
 for(const n of neighborSites){
  const start={x:825,y:470},path=w.navigation.route(start,n.entry);assert.ok(path);
  let p=start;for(const q of path){assert.ok(w.navigation.clearLine(p,q,5));p=q}
  assert.ok(Math.hypot(p.x-n.entry.x,p.y-n.entry.y)<1);
 }
 assert.ok(decorations.filter(d=>['treeOrange','treeWhite','pine','apple'].includes(d.key)&&d.x>110&&d.x<1640&&d.y>190&&d.y<1140).length<=3);
 assert.equal(w.canBuild('well',700,1150),false);
 assert.equal(w.canBuild('mill',2500,600),false);assert.equal(w.canBuild('mill',2500,450),true);
});
test('insulation costs resources once and cold raises actual fuel consumption',()=>{
 const w=new World('survival'),wood=w.resources.wood;
 assert.ok(insulate(w));assert.equal(w.resources.wood,wood-60);assert.equal(w.resources.stone,100);assert.equal(insulate(w),false);
 assert.equal(fuelPerDay(w),19.599999999999998);
 w.time=DAY_SECONDS*8;assert.ok(fuelPerDay(w)>48);
 const fuel=w.resources.wood;tickRegime(w,1);assert.ok(Math.abs(fuel-w.resources.wood-fuelPerDay(w)/DAY_SECONDS)<.0001);
});
test('winter without fuel injures residents and daily defaults cannot win unattended',()=>{
 const w=new World('survival');w.time=DAY_SECONDS*8;w.resources.wood=0;w.regime.heat=.1;
 const health=w.units[0].health;dispatchTime(w,10);assert.ok(w.units[0].health<health);assert.ok(w.regime.heat<.1);
 const passive=new World('survival');
 for(let i=0;i<7000&&!passive.outcome;i++){if(passive.event)passive.choose(1);passive.tick(.1)}
 assert.notEqual(passive.outcome,'Folwark przetrwal');assert.ok(passive.outcome);
});
test('winter can be survived through honest decisions, insulation, trade and heating',()=>{
 const w=new World('survival');assert.ok(insulate(w));let traded=false;
 for(let i=0;i<7000&&!w.outcome;i++){
  if(w.event)w.choose(0);
  if(w.day>=7)w.regime.heating='high';
  if(w.day>=7&&!traded)traded=sendConvoy(w,'mlyn','trade');
  w.tick(.1);
 }
 assert.ok(traded);assert.equal(w.outcome,null);assert.ok(w.journal.some(e=>e.text.startsWith('Pierwszy kryzys przetrwany')));assert.ok(w.living.length>=8);assert.ok(w.regime.heat>=.4);assert.equal(w.regime.integrity,1);
});
test('propaganda costs once, obeys cooldown, then hunger exposes the lie',()=>{
 const w=new World(),a=w.units[0],loyalty=a.loyalty,gold=w.resources.gold;
 assert.ok(issueEdict(w,'propaganda'));assert.ok(a.loyalty>loyalty);assert.equal(w.resources.gold,gold-10);
 assert.equal(issueEdict(w,'propaganda'),false);assert.equal(w.resources.gold,gold-10);
 w.economy.grain=0;w.resources.bread=0;tickRegime(w,.1);
 assert.equal(w.regime.lies,0);assert.ok(w.regime.trust<.5);assert.ok(a.loyalty<loyalty);
 assert.ok(w.journal.some(e=>e.text.includes('Pusta miska')));
});
test('forced shifts trade health for output and expire after one day',()=>{
 const w=new World(),a=w.units[0];a.path=[];a.task='harvest';const health=a.health;
 assert.ok(issueEdict(w,'force'));assert.equal(w.workRate,1.35);assert.equal(w.workFatigue,1.6);
 tickRegime(w,10);assert.ok(a.health<health);w.time=DAY_SECONDS;assert.equal(w.workRate,1);
});
test('violent orders and censorship preserve the real named death in the chronicle',()=>{
 const w=new World();assert.ok(setPress(w,'censored'));const a=w.units[0];a.health=.05;
 assert.ok(issueEdict(w,'crackdown'));assert.equal(a.health,0);assert.ok(w.regime.deaths.includes(a.id));
 assert.ok(w.journal.some(e=>e.text.includes(a.name+' nie zyje')));
 assert.ok(w.regime.official.some(e=>e.text.includes('przeniesiony')));
 recordDeaths(w);assert.equal(w.regime.deaths.length,1);
 const noGuard=new World();noGuard.units=noGuard.units.filter(a=>a.species!=='dog');assert.equal(issueEdict(noGuard,'crackdown'),false);
});
test('trade is paid at dispatch and delivers only after physically returning',()=>{
 const w=new World(),grain=w.economy.grain,wood=w.resources.wood,relation=w.regime.relations.dwor;
 assert.ok(sendConvoy(w,'dwor','trade'));assert.equal(w.resources.wood,wood-40);assert.equal(w.economy.grain,grain);
 assert.equal(w.regime.relations.dwor,relation);assert.equal(sendConvoy(w,'dwor','trade'),false);
 dispatchTime(w,1);assert.equal(w.economy.grain,grain);assert.equal(w.regime.convoys.length,1);
 dispatchTime(w,150);assert.equal(w.regime.convoys.length,0);assert.equal(w.economy.grain,grain+85);assert.ok(w.regime.relations.dwor>relation);
});
test('aid improves relations at arrival and full storage holds a returning convoy',()=>{
 const w=new World(),relation=w.regime.relations.mlyn;assert.ok(sendConvoy(w,'mlyn','aid'));
 assert.equal(w.regime.relations.mlyn,relation);dispatchTime(w,150);assert.equal(w.regime.relations.mlyn,relation+.2);
 w.economy.grain=w.capacity;assert.ok(sendConvoy(w,'dwor','trade'));dispatchTime(w,150);
 assert.equal(w.regime.convoys[0].state,'unload');assert.equal(w.regime.convoys[0].cargo.grain,85);
 w.economy.grain-=100;tickRegime(w,.1);assert.equal(w.economy.grain,w.capacity-15);assert.equal(w.regime.convoys.length,0);
});
test('convoys replan when construction obstructs the next segment',()=>{
 const w=new World();assert.ok(sendConvoy(w,'mlyn','trade'));const c=w.regime.convoys[0],p=c.path[0];
 const rock={x:(c.x+p.x)/2,y:(c.y+p.y)/2,rx:10,ry:10};
 w.navigation.rebuild([...w.navigation.obstacles,rock]);const before=JSON.stringify(c.path);
 tickRegime(w,.1);assert.notEqual(JSON.stringify(c.path),before);assert.ok(w.navigation.clearPoint(c,5));
 dispatchTime(w,150);assert.equal(w.regime.convoys.length,0);
});
test('contract removes the named worker permanently but does not count as a death',()=>{
 const w=new World(),a=w.units[0],gold=w.resources.gold;
 assert.equal(sendConvoy(w,'dwor','contract',w.units.find(a=>a.species==='pig')!.id),false);
 assert.ok(sendConvoy(w,'dwor','contract',a.id));assert.equal(w.living.length,21);assert.equal(a.health,0);
 assert.ok(w.regime.sold.includes(a.id));recordDeaths(w);assert.equal(w.regime.deaths.length,0);assert.equal(w.resources.gold,gold);
 dispatchTime(w,150);assert.equal(w.resources.gold,gold+30);assert.ok(w.regime.integrity<.7);
});
test('v4 preserves political and caravan state; corrupt state is rejected atomically',()=>{
 const w=new World('survival');setPress(w,'censored');sendConvoy(w,'mlyn','trade');advance(w,1);
 const save=w.snapshot(),copy=new World();copy.restore(save);assert.deepEqual(copy.snapshot(),save);
 const invalid=structuredClone(save);invalid.regime.convoys.push({...invalid.regime.convoys[0]});
 assert.throws(()=>copy.restore(invalid));assert.deepEqual(copy.snapshot(),save);
 const legacy:any=structuredClone(save);legacy.version=3;delete legacy.regime;copy.restore(legacy);
 assert.equal(copy.regime.convoys.length,0);assert.equal(copy.regime.trust,.65);
});
test('pause freezes fuel, fear, deaths, and caravan movement',()=>{
 const w=new World('survival');sendConvoy(w,'mlyn','trade');w.paused=true;const before=w.snapshot();
 advance(w,10);assert.deepEqual(w.snapshot(),before);
});
