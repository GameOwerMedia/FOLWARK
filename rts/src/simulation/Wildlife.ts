import type {World,Resident} from './World';
import type {Point} from './Navigation';
import {hasTalent} from './Progression';
import {onMission} from './Diplomacy';
export type Predator=Point&{id:number;kind:'wolf'|'fox';health:number;until:number;target:string|null;path:Point[];repath:number};
export type WildlifeState={wolfHunger:number;foxHunger:number;nextWolf:number;nextFox:number;predators:Predator[];escaped:string[];fleeing:string[];lastEscape:number;kills:number};
export const createWildlife=(time=0):WildlifeState=>({wolfHunger:0,foxHunger:0,nextWolf:time+900,nextFox:time+360,predators:[],escaped:[],fleeing:[],lastEscape:time,kills:0});
const small=(a:Resident)=>['hen','duck','goose','cat'].includes(a.species);
export const preyFor=(w:World,kind:'wolf'|'fox')=>w.living.filter(a=>kind==='fox'?small(a):['horse','cow','sheep','goat','ram','mule','donkey'].includes(a.species));
export function spawnPredator(w:World,kind:'wolf'|'fox'){
 if(w.wildlife.predators.length>=3||!preyFor(w,kind).length)return false;
 const p=w.navigation.nearestFree({x:1760,y:kind==='wolf'?1120:360});if(!p)return false;
 w.wildlife.predators.push({...p,id:w.nextId++,kind,health:1,until:w.time+150,target:null,path:[],repath:0});
 w.log(kind==='wolf'?'Glodny wilk zbliza sie do folwarku.':'Lis poluje na male zwierzeta.');w.revision++;return true;
}
function advance(w:World,e:Predator,dt:number){
 const p=e.path[0];if(!p)return;
 if(!w.navigation.clearLine(e,p,10)){e.path=[];e.repath=0;return}
 const d=Math.hypot(p.x-e.x,p.y-e.y),step=Math.min(d,dt*(e.kind==='wolf'?66:76));
 if(d){e.x+=(p.x-e.x)/d*step;e.y+=(p.y-e.y)/d*step}if(d<=step+.001)e.path.shift();
}
export function tickWildlife(w:World,dt:number){
 const s=w.wildlife;
 s.wolfHunger=Math.min(1,s.wolfHunger+dt*(w.season==='Zima'?.0011:.0007));s.foxHunger=Math.min(1,s.foxHunger+dt*.002);
 if(w.time>=s.nextWolf&&s.wolfHunger>=.95){spawnPredator(w,'wolf');s.wolfHunger=.1;s.nextWolf=w.time+1300}
 if(w.time>=s.nextFox&&s.foxHunger>=.8){spawnPredator(w,'fox');s.foxHunger=.15;s.nextFox=w.time+430}
 for(const e of s.predators){
  if(e.health<=0)continue;
  const dogs=w.living.filter(a=>a.species==='dog'&&!onMission(w,a.id)&&!a.forced&&Math.hypot(a.x-e.x,a.y-e.y)<170);
  for(const dog of dogs){
   if(Math.hypot(dog.x-e.x,dog.y-e.y)<55&&w.navigation.clearLine(dog,e,4)){
    const strength=1+(w.research.includes('kennels')?.4:0)+(hasTalent(w,dog.id,'sentinel')?.25:0)+(hasTalent(w,dog.id,'guardian')?.5:0);
    w.progression.xp[dog.id]=Math.min(720,(w.progression.xp[dog.id]??0)+dt);
    e.health=Math.max(0,e.health-dt*.12*strength);if(e.kind==='wolf')dog.health=Math.max(0,dog.health-dt*.003);
   }else if(['patrol','guard','idle'].includes(dog.task)&&!dog.path.length)w.command([dog.id],'guard',e);
  }
  if(e.health<=0){w.log('Psy odparly drapieznika.');continue}
  e.repath-=dt;
  if(e.repath<=0){
   e.repath=2;e.path=[];e.target=null;
   const candidates=preyFor(w,e.kind).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));
   for(const a of candidates.slice(0,12)){const path=w.navigation.route(e,a);if(path&&(!path.length||Math.hypot(path.at(-1)!.x-a.x,path.at(-1)!.y-a.y)<40)){e.path=path;e.target=a.id;break}}
  }
  const prey=w.living.find(a=>a.id===e.target);
  if(prey&&Math.hypot(prey.x-e.x,prey.y-e.y)<34&&w.navigation.clearLine(e,prey,4)){
   prey.health=Math.max(0,prey.health-dt*(e.kind==='wolf'?.08:.13));
   if(prey.health===0){s.kills++;e.until=w.time;prey.path=[];prey.job=null;w.log(prey.name+': Ofiara drapieznika.')}
  }else advance(w,e,dt);
 }
 s.predators=s.predators.filter(e=>e.health>0&&e.until>w.time);
 // Escape is a physical route to the map edge, not a random disappearance.
 if(w.time-s.lastEscape>=65){
  s.lastEscape=w.time;
  const a=w.living.find(a=>a.species!=='raven'&&a.hunger>.9&&a.grievance>.65&&!onMission(w,a.id)&&!s.fleeing.includes(a.id));
  if(a){const exit={x:60,y:Math.max(110,a.y)},path=w.navigation.route(a,exit);
   if(path&&Math.hypot(path.at(-1)!.x-exit.x,path.at(-1)!.y-exit.y)<30){w.move([a.id],exit.x,exit.y);s.fleeing.push(a.id);w.log(a.name+': Probuje opuscic folwark.')}}
 }
 for(const id of s.fleeing){const a=w.living.find(a=>a.id===id);if(a&&a.x<85){s.escaped.push(id);a.path=[];a.job=null;a.task='idle';w.log(a.name+': Opuszcza folwark.')}}
 s.fleeing=s.fleeing.filter(id=>!s.escaped.includes(id)&&w.living.some(a=>a.id===id));
}
export function validWildlife(s:WildlifeState,units:Resident[]){
 const n=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const p=(p:Point)=>p&&n(p.x)&&n(p.y)&&p.x<=5400&&p.y<=3600;
 return !!s&&[s.wolfHunger,s.foxHunger].every(v=>n(v)&&v<=1)&&[s.nextWolf,s.nextFox,s.lastEscape,s.kills].every(n)&&
 [s.escaped,s.fleeing].every(ids=>Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>units.some(a=>a.id===id)))&&
 Array.isArray(s.predators)&&s.predators.length<=3&&new Set(s.predators.map(e=>e.id)).size===s.predators.length&&s.predators.every(e=>p(e)&&Number.isInteger(e.id)&&e.id>=0&&['wolf','fox'].includes(e.kind)&&n(e.health)&&e.health<=1&&n(e.until)&&Number.isFinite(e.repath)&&(e.target===null||units.some(a=>a.id===e.target))&&Array.isArray(e.path)&&e.path.length<=2000&&e.path.every(p));
}
