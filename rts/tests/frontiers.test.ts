import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,type BuildingKind} from '../src/simulation/World';
import {toggleGate} from '../src/simulation/Barriers';
import {preyFor,spawnPredator,tickWildlife} from '../src/simulation/Wildlife';
import {sendEnvoy,tickDiplomacy} from '../src/simulation/Diplomacy';
import {canNegotiate,answerRequest,tickForeign} from '../src/simulation/ForeignPolitics';
import {learnTalent,chooseSystem,laborBonus} from '../src/simulation/Progression';
const quiet=()=>{const w=new World('sandbox');w.units.forEach(a=>{a.job=null;a.task='idle';a.path=[];a.wait=9999});w.resources.wood=2000;w.resources.gold=2000;return w};
function section(w:World,kind:BuildingKind,x:number,y:number){
 assert.ok(w.build(kind,x,y),kind+' '+x+','+y);const b=w.buildings.at(-1)!;b.progress=1;w.rebuildGrid();return b;
}
function enclosure(w:World){
 for(const x of [2050,2150,2250])section(w,'fenceH',x,1200);
 for(const x of [2050,2250])section(w,'fenceH',x,1400);
 for(const x of [2000,2300])for(const y of [1250,1350])section(w,'fenceV',x,y);
 return section(w,'gateH',2150,1400);
}
test('fences charge resources, need construction, join at corners and gates control actual paths',()=>{
 const w=quiet(),wood=w.resources.wood;assert.ok(w.build('fenceH',2050,1200));assert.equal(w.resources.wood,wood-8);
 assert.ok(w.navigation.clearPoint({x:2050,y:1200}));
 w.buildings=[];w.rebuildGrid();const gate=enclosure(w);
 assert.equal(w.navigation.route({x:2150,y:1300},{x:2150,y:1500}),null);
 assert.ok(toggleGate(w,gate.id));assert.ok(w.navigation.route({x:2150,y:1300},{x:2150,y:1500}));
 const a=w.units[0];a.x=2150;a.y=1400;assert.equal(toggleGate(w,gate.id),false);
 a.x=2400;a.y=1500;assert.ok(toggleGate(w,gate.id));assert.equal(w.navigation.route({x:2150,y:1300},{x:2150,y:1500}),null);
});
test('predators choose species-specific prey and wolves arrive only after rare hungry interval',()=>{
 const w=quiet();assert.ok(preyFor(w,'fox').every(a=>['hen','cat','duck','goose'].includes(a.species)));
 assert.ok(preyFor(w,'wolf').every(a=>!['hen','pig','dog','raven'].includes(a.species)));
 w.time=901;tickWildlife(w,.1);assert.equal(w.wildlife.predators.length,0);
 w.wildlife.wolfHunger=.96;tickWildlife(w,.1);assert.equal(w.wildlife.predators[0].kind,'wolf');
 assert.ok(w.wildlife.nextWolf>w.time+1000);
});
test('predator cannot attack across closed fencing; a nearby dog really fights',()=>{
 const w=quiet();w.buildings=[];w.rebuildGrid();const gate=enclosure(w),prey=w.units.find(a=>a.species==='hen')!;
 for(const a of w.units){a.x=2500;a.y=1000}prey.x=2150;prey.y=1370;
 spawnPredator(w,'fox');const e=w.wildlife.predators[0];e.x=2150;e.y=1420;e.target=prey.id;e.repath=99;
 const health=prey.health;for(let i=0;i<20;i++)tickWildlife(w,.1);assert.equal(prey.health,health);
 assert.ok(toggleGate(w,gate.id));e.y=1390;for(let i=0;i<10;i++)tickWildlife(w,.1);assert.ok(prey.health<health);
 const dog=w.units.find(a=>a.species==='dog')!;dog.x=e.x+15;dog.y=e.y;
 const enemyHealth=e.health;tickWildlife(w,1);assert.ok(e.health<enemyHealth);
});
test('political missions require a pig, unlocks and actual neighbor stock; payment and cargo are not duplicated',()=>{
 const w=quiet(),pig=w.units.find(a=>a.species==='pig')!,raven=w.units.find(a=>a.species==='raven')!;
 assert.equal(sendEnvoy(w,pig.id,'dwor','propaganda'),false);
 w.research.push('printing');assert.equal(sendEnvoy(w,raven.id,'dwor','propaganda'),false);
 assert.ok(sendEnvoy(w,pig.id,'dwor','commerce'));const gold=w.resources.gold,n=w.region.settlements[0],stock=n.stock.grain,grain=w.economy.grain;
 assert.equal(sendEnvoy(w,pig.id,'dwor','commerce'),false);assert.equal(w.resources.gold,gold);
 for(let i=0;i<2200&&w.diplomacy.missions.length;i++){w.time+=.1;tickDiplomacy(w,.1)}
 assert.equal(w.diplomacy.missions.length,0);assert.equal(n.stock.grain,stock-40);assert.equal(w.economy.grain,grain+40);
 assert.equal(w.foreign.farms[0].influence,10);assert.ok(w.progression.xp[pig.id]>0);
});
test('revolution and federation cannot bypass prerequisites; food aid conserves grain',()=>{
 const w=quiet(),f=w.foreign.farms[0],n=w.region.settlements[0];
 w.research.push('solidarity');assert.equal(canNegotiate(w,f.id,'liberation'),false);
 f.influence=80;f.propaganda=80;assert.ok(canNegotiate(w,f.id,'liberation'));assert.equal(canNegotiate(w,f.id,'federation'),false);
 f.government='commune';w.regime.relations[f.id]=.7;assert.ok(canNegotiate(w,f.id,'federation'));
 f.request='food';n.stock.grain=0;const grain=w.economy.grain;assert.ok(answerRequest(w,f.id,true));assert.equal(n.stock.grain,40);assert.equal(w.economy.grain,grain-40);assert.equal(answerRequest(w,f.id,true),false);
});
test('unfed neighbors request aid, lose population and can collapse',()=>{
 const w=quiet(),f=w.foreign.farms[1],n=w.region.settlements[1];n.stock.grain=n.stock.bread=0;
 for(let day=2;day<18;day++){w.time=(day-1)*65;tickForeign(w)}
 assert.ok(f.collapsed);assert.equal(f.population,0);assert.equal(n.workers,0);
});
test('character branches spend earned points once; constitutions are mutually exclusive',()=>{
 const w=quiet(),a=w.units[0];assert.equal(learnTalent(w,a.id,'master'),false);w.progression.xp[a.id]=240;
 assert.equal(learnTalent(w,a.id,'master'),false);assert.ok(learnTalent(w,a.id,'artisan'));assert.ok(learnTalent(w,a.id,'master'));assert.equal(learnTalent(w,a.id,'speaker'),false);assert.equal(laborBonus(w,a),1.3);
 assert.equal(chooseSystem(w,'commune'),false);w.research.push('charter');assert.ok(chooseSystem(w,'commune'));assert.equal(chooseSystem(w,'directorate'),false);
});
test('v8 saves round-trip all new state, migrate v7 and reject invalid politics atomically',()=>{
 const w=quiet();w.progression.xp[w.units[0].id]=120;learnTalent(w,w.units[0].id,'artisan');spawnPredator(w,'fox');
 const copy=new World();copy.restore(w.snapshot());assert.deepEqual(copy.snapshot(),w.snapshot());
 const before=copy.snapshot(),bad=w.snapshot();bad.foreign.farms[0].influence=NaN;
 assert.throws(()=>copy.restore(bad));assert.deepEqual(copy.snapshot(),before);
 const old={...w.snapshot(),version:7};delete (old as any).foreign;delete (old as any).progression;delete (old as any).wildlife;
 copy.restore(old);assert.equal(copy.wildlife.predators.length,0);assert.equal(copy.foreign.farms[0].government,'human');assert.equal(copy.units.length,w.units.length);
});
test('partially unloaded envoy cargo survives saving and never overfills storage',()=>{
 const w=quiet(),pig=w.units.find(a=>a.species==='pig')!;
 w.economy.grain=w.capacity-10;
 w.diplomacy.missions.push({unitId:pig.id,neighbor:'dwor',treaty:'commerce',phase:'return',remaining:0,home:{x:pig.x,y:pig.y},accepted:true,cargo:40});
 tickDiplomacy(w,.1);
 assert.equal(w.economy.grain,w.capacity);assert.equal(w.diplomacy.missions[0].cargo,30);
 const copy=new World();copy.restore(w.snapshot());
 tickDiplomacy(copy,.1);assert.equal(copy.diplomacy.missions[0].cargo,30);
 copy.economy.grain-=30;tickDiplomacy(copy,.1);
 assert.equal(copy.economy.grain,copy.capacity);assert.equal(copy.diplomacy.missions.length,0);
 assert.equal(copy.progression.xp[pig.id],60);
});
