import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/simulation/World';
import {tickRegion,receivePayment,reserveStock} from '../src/simulation/Region';
import {sendConvoy} from '../src/simulation/Regime';
import {cityGate,roads} from '../src/simulation/Landscape';
import {decodeSave,exportGame,readGame,saveGame,listGames,removeGame} from '../src/game/SaveStore';
const advance=(w:World,seconds:number)=>{for(let t=0;t<seconds;t+=.1){if(w.event)w.choose(1);w.tick(.1)}};
test('neighbor output consumes its own inputs and stalls when depleted',()=>{
 const w=new World(),mill=w.region.settlements[1],before={...mill.stock};
 tickRegion(w,12);assert.equal(mill.cycles,1);assert.equal(mill.stock.wood,before.wood+10);assert.equal(mill.stock.grain,before.grain-2);
 mill.stock.grain=0;tickRegion(w,10);assert.equal(mill.cycles,1);assert.equal(mill.status,'shortage');
 receivePayment(w,mill.id,{grain:25},true);tickRegion(w,12);assert.equal(mill.cycles,2);
});
test('neighbor exports reserve actual stock and cannot be repeated with empty stocks',()=>{
 const w=new World(),n=w.region.settlements[0];n.stock.grain=80;const before=w.resources.wood;
 assert.equal(sendConvoy(w,'dwor','trade'),false);assert.equal(w.resources.wood,before);
 n.stock.grain=100;assert.ok(sendConvoy(w,'dwor','trade'));assert.equal(n.stock.grain,15);
});
test('neighbors dispatch their own merchants and receive payment after returning',()=>{
 const w=new World('sandbox');advance(w,56);assert.ok(w.region.traffic.some(t=>t.settlement==='dwor'));
 const gold=w.region.settlements[0].stock.gold;advance(w,150);
 assert.ok(w.region.settlements[0].stock.gold>gold);assert.ok(w.region.settlements.every(n=>n.cycles>0));
});
test('strike stops production until time expires or aid arrives',()=>{
 const w=new World(),n=w.region.settlements[2];w.time=130;tickRegion(w,.1);const cycles=n.cycles;assert.equal(n.status,'strike');
 tickRegion(w,20);assert.equal(n.cycles,cycles);
 receivePayment(w,n.id,{grain:25},true);tickRegion(w,12);assert.ok(n.cycles>cycles);
});
test('city road exits the world and cargo waits outside before coming back',()=>{
 const w=new World('sandbox'),before=w.resources.wood;
 assert.ok(roads.some(r=>r.at(-1)![0]>3600));assert.ok(w.navigation.route({x:825,y:470},cityGate.entry));
 w.order(w.living.map(a=>a.id),'idle');assert.ok(sendConvoy(w,'city','trade',undefined,'wood'));
 let reached=false;
 for(let i=0;i<1200;i++){w.tick(.1);if(w.regime.convoys[0]?.state==='abroad'){reached=true;break}}
 assert.ok(reached);const t=w.time;assert.equal(w.resources.wood,before);advance(w,60);assert.equal(w.regime.convoys[0]?.state,'abroad');
 for(let i=0;i<1200&&w.regime.convoys.length;i++){if(w.event)w.choose(0);w.tick(.1)}assert.equal(w.regime.convoys.length,0);assert.equal(w.resources.wood,before+100);assert.ok(w.time-t>=65);
});
test('v5 preserves region and off-map transport; v4 migrates region safely',()=>{
 const w=new World('sandbox');sendConvoy(w,'city','trade',undefined,'tools');advance(w,55);
 const save=w.snapshot(),copy=new World();copy.restore(save);assert.deepEqual(copy.snapshot(),save);
 const old:any=structuredClone(save);old.version=4;delete old.region;old.regime.convoys=[];copy.restore(old);assert.equal(copy.region.settlements.length,3);
 const bad=structuredClone(save);bad.region.settlements[0].stock.grain=-1;assert.throws(()=>copy.restore(bad));
});
test('menu save envelopes, legacy quick saves, slots and export round-trip',()=>{
 const data=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)}});
 const w=new World('sandbox');saveGame(w,'slot-1');assert.equal(listGames().find(s=>s.slot==='slot-1')!.day,1);
 assert.deepEqual(readGame('slot-1').world.snapshot(),w.snapshot());
 data.set('folwark-save',JSON.stringify(w.snapshot()));assert.equal(readGame('quick').world.scenario,'sandbox');
 assert.deepEqual(decodeSave(exportGame(w)).world.snapshot(),w.snapshot());
 assert.throws(()=>decodeSave('{bad json'));data.set('folwark-slot-2','broken');assert.ok(listGames().find(s=>s.slot==='slot-2')!.error);
 removeGame('slot-1');assert.ok(listGames().find(s=>s.slot==='slot-1')!.empty);
});
test('pause freezes autonomous industry and NPC merchant traffic',()=>{
 const w=new World('sandbox');advance(w,60);w.paused=true;const before=w.snapshot();advance(w,10);assert.deepEqual(w.snapshot(),before);
});
test('neighbor cycles never spend missing inputs or waste inputs at full capacity',()=>{
 const w=new World(),n=w.region.settlements[1];n.stock.grain=2;tickRegion(w,120);
 assert.equal(n.cycles,1);assert.equal(n.stock.grain,0);assert.ok(n.cycle<12);
 n.stock.wood=500;n.stock.grain=50;tickRegion(w,120);
 assert.equal(n.stock.grain,50);assert.equal(n.status,'full');
});
test('malformed save entities are rejected without replacing the current world',()=>{
 const w=new World(),before=w.snapshot();
 for(const alter of [(s:any)=>s.units[0].health=-1,(s:any)=>s.units[0]=null,(s:any)=>s.units[0].species='constructor',(s:any)=>s.journal=[{day:1,text:{}}]]){
  const bad=structuredClone(before);alter(bad);assert.throws(()=>w.restore(bad));assert.deepEqual(w.snapshot(),before);
 }
});
