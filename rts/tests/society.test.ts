import test from 'node:test';
import assert from 'node:assert/strict';
import {World,type Resident} from '../src/simulation/World';
import {roles,aptitude,tickDuty} from '../src/simulation/Roles';
import {campaign,elect,nominate,polls,tickSociety,mandate} from '../src/simulation/Society';
import {sendEnvoy,onMission,tickDiplomacy,treatyActive} from '../src/simulation/Diplomacy';
import {neighborOffer,fuelPerDay} from '../src/simulation/Regime';
import {setLanguage,t} from '../src/i18n';
const quiet=()=>{const w=new World('sandbox');w.order(w.units.map(a=>a.id),'idle');return w};
const advance=(w:World,seconds:number)=>{for(let i=0;i<seconds*20;i++)w.tick(.05)};
test('a new farm has the book cast and appropriate initial jobs, not sheep miners',()=>{
 const w=new World();assert.equal(w.living.length,22);assert.ok(w.populationCap>=w.living.length);
 for(const name of ['Napoleon','Snowball','Squealer','Bokser','Benjamin','Mollie','Muriel','Jessie','Bluebell','Pincher','Mojzesz'])assert.ok(w.living.some(a=>a.name===name));
 for(const a of w.living)if(a.job)assert.ok(aptitude(a,a.job)>=.5,a.name);
 assert.equal(w.living.find(a=>a.species==='sheep')!.job,'care');assert.ok(w.count('pasture'));
});
test('only capable automatic builders are dispatched and staff respects workshop skills',()=>{
 const w=new World();w.build('well',2350,900);
 assert.ok(w.living.some(a=>a.job==='build'));assert.ok(w.living.filter(a=>a.job==='build').every(a=>a.species==='mule'));
 const a=w.units.find(a=>a.species==='hen')!,old=a.job;w.assign([a.id],'stone');assert.equal(a.job,old);assert.equal(a.forced,false);
 const school={...w.buildings[0],id:w.nextId++,kind:'school' as const,x:2400,y:700};w.buildings.push(school);
 assert.ok(w.staffBuilding(school.id));const worker=w.living.find(a=>a.target===school.id)!;assert.ok(['pig','donkey','goat','raven'].includes(worker.species));
});
test('forced unsuitable work is explicit, slow and harmful; stop clears coercion',()=>{
 const w=quiet(),a=w.units.find(a=>a.species==='hen')!,q=w.buildings.find(b=>b.kind==='quarry')!;
 w.assign([a.id],'stone',q.id);assert.equal(a.job,null);
 w.assign([a.id],'stone',q.id,true);assert.equal(a.forced,true);assert.equal(a.job,'stone');
 a.path=[];a.task='stone';a.x=q.x;a.y=q.y+30;a.health=.9;
 const before=a.health,grievance=a.grievance;advance(w,3);
 assert.ok(a.health<before);assert.ok(a.grievance>grievance);assert.ok(a.load>0&&a.load<1);
 w.order([a.id],'idle');assert.equal(a.forced,false);
});
test('livestock generates distinct goods from feed, never converts species or overfills storage',()=>{
 for(const species of ['cow','hen','sheep','goat'] as const){
  const w=quiet(),a=w.units.find(a=>a.species===species)!;a.job='care';
  const resource=roles[species].yield!,before=w.get(resource),grain=w.economy.grain;
  tickDuty(w,a,16);assert.equal(w.get(resource),before+2);assert.equal(w.economy.grain,grain-1);
  w.economy.grain=0;tickDuty(w,a,32);assert.equal(w.get(resource),before+2);
  w.economy.grain=20;w.set(resource,w.capacity);tickDuty(w,a,32);assert.equal(w.get(resource),w.capacity);assert.equal(w.economy.grain,20);
 }
});
test('research does not accumulate unbounded progress when food is absent',()=>{
 const w=quiet(),a=w.units.find(a=>a.species==='donkey')!;a.job='study';w.economy.grain=0;
 tickDuty(w,a,1000);assert.equal(a.dutyProgress,14);
 const other=new World();other.restore(w.snapshot());assert.deepEqual(other.snapshot(),w.snapshot());
});
test('raven flies over obstacles; ground units still need valid routes',()=>{
 const w=quiet(),raven=w.units.find(a=>a.species==='raven')!,horse=w.units[0];
 w.move([raven.id],340,960);assert.deepEqual(raven.destination,{x:340,y:960});advance(w,6);
 assert.ok(Math.hypot(raven.x-340,raven.y-960)<2);
 w.move([horse.id],340,960);assert.ok(!horse.destination||Math.hypot(horse.destination.x-340,horse.destination.y-960)>100);
});
test('an embassy negotiates and returns before ratification; paused time and busy orders cannot bypass it',()=>{
 const w=quiet(),a=w.units.find(a=>a.species==='raven')!,gold=w.resources.gold,knowledge=w.resources.knowledge;
 assert.ok(sendEnvoy(w,a.id,'dwor','knowledge'));assert.equal(w.resources.gold,gold-18);
 assert.equal(sendEnvoy(w,a.id,'mlyn','trade'),false);assert.ok(onMission(w,a.id));assert.equal(treatyActive(w,'dwor','knowledge'),false);
 w.assign([a.id],'harvest',undefined,true);w.move([a.id],50,50);w.order([a.id],'resting');assert.equal(a.task,'diplomacy');
 const before=w.snapshot();w.paused=true;advance(w,10);assert.deepEqual(w.snapshot(),before);w.paused=false;
 advance(w,13);assert.equal(w.diplomacy.missions[0].phase,'negotiating');assert.equal(w.resources.knowledge,knowledge);
 const copy=new World();copy.restore(w.snapshot());assert.deepEqual(copy.snapshot(),w.snapshot());
 advance(w,35);assert.equal(w.diplomacy.missions.length,0);assert.ok(treatyActive(w,'dwor','knowledge'));assert.equal(w.resources.knowledge,knowledge+20);
 assert.equal(sendEnvoy(w,a.id,'dwor','knowledge'),false);
});
test('embargo can reject a treaty and a dead envoy cannot ratify it',()=>{
 const w=quiet(),a=w.units.find(a=>a.species==='raven')!;w.regime.relations.dwor=.1;
 assert.ok(sendEnvoy(w,a.id,'dwor','trade'));advance(w,50);assert.equal(w.diplomacy.agreements.length,0);
 assert.ok(sendEnvoy(w,a.id,'mlyn','trade'));a.health=0;tickDiplomacy(w,.1);assert.equal(w.diplomacy.missions.length,0);assert.equal(w.diplomacy.agreements.length,0);
});
test('trade and peace treaties have timed, measurable effects',()=>{
 const w=quiet();w.diplomacy.agreements=[{neighbor:'dwor',kind:'trade',until:10},{neighbor:'mlyn',kind:'nonaggression',until:10}];
 assert.equal(neighborOffer(w,'dwor','trade').cost.wood,32);w.regime.relations.mlyn=.1;tickDiplomacy(w,.1);assert.equal(w.regime.relations.mlyn,.6);
 w.time=11;tickDiplomacy(w,.1);assert.equal(neighborOffer(w,'dwor','trade').cost.wood,40);assert.equal(w.diplomacy.agreements.length,0);
});
test('every living individual can win a real ballot, including hens and ravens',()=>{
 const base=new World().snapshot();
 for(const candidate of base.units){
  const w=new World();w.restore(base);w.resources.gold=100;
  assert.ok(nominate(w,candidate.id,'solidarity'));for(let i=0;i<3;i++)assert.ok(campaign(w,candidate.id));
  assert.equal(campaign(w,candidate.id),false);assert.equal(w.resources.gold,70);
  assert.equal(Object.values(polls(w)).reduce((a,b)=>a+b,0),w.living.length);
  assert.ok(elect(w));assert.equal(w.society.leaderId,candidate.id,candidate.name);assert.equal(w.politics.leaderSpecies,candidate.species);
  assert.equal(w.society.term,1);assert.ok(mandate(w,'solidarity'));assert.equal(elect(w),false);
 }
});
test('election cooldown, death succession and programme effects survive saving',()=>{
 const w=quiet(),candidate=w.units.find(a=>a.species==='mule')!;w.society.nominations[candidate.id]='industry';w.society.campaigns[candidate.id]=3;
 const rate=w.workRate;assert.ok(elect(w));assert.equal(w.society.leaderId,candidate.id);assert.equal(w.workRate,rate*1.12);
 const other=new World();other.restore(w.snapshot());assert.deepEqual(other.snapshot(),w.snapshot());assert.equal(elect(other),false);
 candidate.health=0;tickSociety(w);assert.equal(w.society.leaderId,null);assert.equal(w.society.nextElection,w.time);assert.ok(elect(w));
 const fuel=fuelPerDay(w);w.society.bedding=2;assert.equal(fuelPerDay(w),fuel*.8);
});
test('v5 saves migrate without deleting residents, cargo or their existing history',()=>{
 const w=quiet(),s:any=w.snapshot();s.version=5;delete s.society;delete s.diplomacy;
 for(const k of ['milk','eggs','wool','herbs'])delete s.resources[k];
 s.units[5].job='stone';s.units[5].load=2;s.units[5].resource='stone';
 for(const a of s.units){delete a.forced;delete a.dutyProgress}
 const other=new World();other.restore(s);
 assert.equal(other.units.length,s.units.length);assert.equal(other.units[5].job,null);assert.equal(other.units[5].load,2);assert.deepEqual(other.journal,s.journal);assert.equal(other.resources.milk,0);assert.equal(other.snapshot().version,6);
});
test('malformed society, flight and specialisation saves are rejected atomically',()=>{
 const w=quiet(),before=w.snapshot();
 const changes:Array<(s:any)=>void>=[s=>s.society.leaderId='missing',s=>s.society.campaigns['missing']=1,s=>s.society.bedding=8,s=>s.units[0].job='imaginary',s=>s.units[0].dutyProgress=Infinity,s=>s.resources.milk=-1,s=>s.diplomacy.missions=[{unitId:s.units[0].id,neighbor:'dwor',treaty:'trade',phase:'return',remaining:0,home:{x:1,y:1},accepted:true}]];
 for(const change of changes){const s=structuredClone(before);change(s);assert.throws(()=>w.restore(s));assert.deepEqual(w.snapshot(),before)}
});
test('role descriptions and duty names remain bilingual',()=>{
 setLanguage('en');for(const role of Object.values(roles))assert.notEqual(t(role.description),role.description);
 setLanguage('pl');assert.equal(t('Wladza nie nalezy do gatunku'),'Wladza nie nalezy do gatunku');
});
