import assert from 'node:assert/strict';
import {test} from 'node:test';
import {World,WIDTH,HEIGHT,DAY_SECONDS,type BuildingKind} from '../src/simulation/World';
import {roadCost} from '../src/simulation/Development';
function advance(w:World,seconds:number){for(let i=0;i<seconds*10;i++){if(w.event)w.choose(w.event.choices.length-1);w.tick(.1)}}
function quiet(){const w=new World('sandbox');w.order(w.units.map(a=>a.id),'idle');return w}
function ready(w:World,kind:BuildingKind,x:number,y:number){assert.ok(w.build(kind,x,y));const b=w.buildings.at(-1)!;b.progress=1;return b}
test('map has nine times the original area and eastern meadows accept buildings',()=>{
 const w=quiet();assert.equal(WIDTH*HEIGHT,1800*1200*9);assert.ok(w.canBuild('mill',2350,900));assert.ok(w.canBuild('bakery',2650,950));
 const a=w.units[0];w.move([a.id],2500,850);assert.ok(a.path.length);assert.equal(a.destination?.x,2500);
});
test('roads charge once, reject water and duplicate placement, and refund once',()=>{
 const w=quiet(),start={x:2200,y:750},end={x:2700,y:750},wood=w.resources.wood;
 assert.ok(w.buildRoad('dirt',start,end));assert.equal(w.resources.wood,wood-roadCost('dirt',500).wood!);
 assert.equal(w.buildRoad('dirt',start,end),false);assert.equal(w.roads.length,1);
 assert.equal(w.buildRoad('stone',{x:200,y:960},{x:500,y:960}),false);
 assert.equal(w.buildRoad('dirt',start,start),false);
 const id=w.roads[0].id;assert.ok(w.removeRoad(id));const after=w.resources.wood;assert.equal(w.removeRoad(id),false);assert.equal(w.resources.wood,after);
});
test('roads are preferred when they reduce travel time',()=>{
 const w=quiet(),a={x:2200,y:790},b={x:2700,y:790};assert.ok(w.buildRoad('stone',{x:2200,y:750},{x:2700,y:750}));
 const path=w.navigation.route(a,b)!;assert.ok(path.some(p=>p.y<780));assert.equal(w.navigation.speedAt({x:2450,y:750}),1.65);
 assert.equal(w.navigation.speedAt({x:2450,y:950}),1);
});
test('road movement is faster than movement across grass',()=>{
 const road=quiet(),grass=quiet();
 road.buildRoad('stone',{x:2200,y:750},{x:2700,y:750});
 for(const w of [road,grass]){w.units[0].x=2250;w.units[0].y=750;w.move([w.units[0].id],2650,750)}
 advance(road,2);advance(grass,2);assert.ok(road.units[0].x>grass.units[0].x+40);
});
test('construction needs physically present builders',()=>{
 const w=quiet();assert.ok(w.build('mill',2350,900));const b=w.buildings.at(-1)!;
 advance(w,30);assert.equal(b.progress,0);
 const a=w.units[0];a.x=2250;a.y=1000;w.assign([a.id],'build',b.id);
 advance(w,50);assert.equal(b.progress,1);assert.equal(w.built,1);
});
test('construction can be prioritized and canceled with a bounded refund',()=>{
 const w=new World();assert.ok(w.build('field',1420,300));assert.ok(w.build('well',300,300));
 const b=w.buildings.at(-1)!;w.prioritize(b.id);assert.ok(w.living.filter(a=>a.job==='build').every(a=>a.target===b.id));
 const wood=w.resources.wood;assert.ok(w.cancelBuild(b.id));assert.equal(w.resources.wood,wood+20);
 const after=w.resources.wood;assert.equal(w.cancelBuild(b.id),false);assert.equal(w.resources.wood,after);
});
test('a mill consumes grain, a bakery consumes flour and wood, and both need staff',()=>{
 const w=quiet(),mill=ready(w,'mill',2350,900),bakery=ready(w,'bakery',2650,950);
 const originalBread=w.resources.bread;w.economy.grain=100;
 advance(w,15);assert.equal(w.resources.flour,0);assert.equal(mill.production,0);
 const a=w.units.find(a=>a.species==='mule')!,b=w.units.find(a=>a.species==='pig')!;a.x=2300;a.y=927;b.x=2625;b.y=977;
 w.assign([a.id],'produce',mill.id);w.assign([b.id],'produce',bakery.id);
 advance(w,40);assert.ok(mill.batches>=3);assert.ok(bakery.batches>=2);assert.ok(w.resources.bread>originalBread);assert.ok(w.economy.grain<100);
 assert.equal(w.resources.flour,mill.batches*4-bakery.batches*4);
});
test('production stops when input or output capacity is missing',()=>{
 const w=quiet(),mill=ready(w,'mill',2350,900),a=w.units.find(a=>a.species==='mule')!;a.x=2300;a.y=927;w.assign([a.id],'produce',mill.id);w.economy.grain=0;
 advance(w,20);assert.equal(mill.batches,0);assert.equal(w.productionState(mill),'Brak skladnikow');
 w.economy.grain=100;w.resources.flour=w.capacity;
 advance(w,20);assert.equal(mill.batches,0);assert.equal(w.productionState(mill),'Magazyn pelny');
});
test('raw deposits are finite and exhausted deposits cannot create resources',()=>{
 const w=quiet(),b=w.buildings.find(b=>b.kind==='quarry')!,a=w.units[0];b.stock=2;a.x=b.x-50;a.y=b.y+27;
 w.assign([a.id],'stone',b.id);advance(w,5);assert.equal(b.stock,0);assert.ok(a.load<=2);
});
test('winter reduces field regeneration in the endless scenario',()=>{
 const autumn=quiet(),winter=quiet();winter.time=DAY_SECONDS*7;
 for(const w of [autumn,winter])w.buildings.find(b=>b.kind==='field')!.stock=10;
 advance(autumn,10);advance(winter,10);
 assert.ok(autumn.buildings[2].stock>winter.buildings[2].stock+3);assert.equal(winter.outcome,null);assert.equal(winter.season,'Zima');
});
test('work and tax policies have measurable economic and social effects',()=>{
 const low=quiet(),high=quiet();low.setLaw('tax','low');high.setLaw('tax','high');high.setLaw('work','intensive');
 assert.equal(high.workRate,1.3);assert.equal(high.workFatigue,1.5);
 advance(low,15);advance(high,15);assert.ok(high.resources.gold>low.resources.gold);assert.ok(high.units[0].grievance>low.units[0].grievance);
});
test('research needs a library, costs resources once and benefits new recruits',()=>{
 const w=quiet();w.resources.knowledge=100;w.resources.tools=30;
 assert.equal(w.researchTech('logistics'),false);ready(w,'library',2350,900);
 assert.ok(w.researchTech('literacy'));
 const carry=w.units[0].carryCapacity;assert.ok(w.researchTech('logistics'));assert.equal(w.units[0].carryCapacity,carry+8);
 const tools=w.resources.tools;assert.equal(w.researchTech('logistics'),false);assert.equal(w.resources.tools,tools);
 assert.equal(w.addUnit('Test','horse',2500,900).carryCapacity,30);
});
test('shift movement queues waypoints and food breaks do not skip recovery',()=>{
 const w=quiet(),a=w.units[0];a.x=950;a.y=850;
 w.move([a.id],1000,850);w.move([a.id],1100,850,true);assert.equal(a.queue.length,1);
 a.hunger=.72;let ate=false;
 for(let i=0;i<900;i++){w.tick(.1);if(a.task==='eating')ate=true}
 assert.ok(ate);assert.equal(a.queue.length,0);assert.ok(a.hunger<.7);assert.ok(Math.hypot(a.x-1100,a.y-850)<5);
});
test('version 4 saves preserve roads, laws, research and production exactly',()=>{
 const w=quiet();w.buildRoad('dirt',{x:2200,y:750},{x:2700,y:750});w.setLaw('work','rested');
 const save=w.snapshot(),other=new World();other.restore(save);assert.deepEqual(other.snapshot(),save);
 assert.equal(other.scenario,'sandbox');assert.equal(other.navigation.speedAt({x:2400,y:750}),1.3);
});
test('legacy version 2 saves get valid defaults for new systems',()=>{
 const w=quiet(),save:any=w.snapshot();save.version=2;delete save.roads;delete save.laws;delete save.research;delete save.scenario;
 delete save.resources.flour;delete save.resources.bread;delete save.resources.tools;delete save.resources.knowledge;
 const other=new World();other.restore(save);assert.equal(other.resources.tools,0);assert.equal(other.laws.work,'balanced');assert.deepEqual(other.roads,[]);
});
test('natural deposits cannot be purchased as buildings',()=>{
 const w=quiet();assert.equal(w.build('quarry',2500,600),false);assert.equal(w.build('lumber',2500,600),false);
});
test('market improves both trade directions',()=>{
 const w=quiet(),before=w.tradeQuote('wood');w.buildings.push({...w.buildings[0],id:999,kind:'market'});
 const after=w.tradeQuote('wood');assert.ok(after.buy<before.buy);assert.ok(after.sell>before.sell);
});
test('corrupt development saves are rejected without changing current state',()=>{
 const w=quiet(),original=w.snapshot();
 const corruptions=[s=>s.laws.work='broken',s=>s.resources.flour=-1,s=>s.units[0].queue=[{x:NaN,y:0}],s=>s.buildings[0].production=-1,s=>s.research=['imaginary'],s=>s.roads=[{id:999,kind:'water',points:[],cost:{}}]];
 for(const mutate of corruptions){const save=structuredClone(original);mutate(save);assert.throws(()=>w.restore(save));assert.deepEqual(w.snapshot(),original)}
});
