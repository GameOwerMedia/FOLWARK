import {politicalMissions,isPolitical,canNegotiate,settleNegotiation,type PoliticalMission} from './ForeignPolitics';
import type {World,Resident} from './World';
import {neighborSites} from './Landscape';
import {mandate} from './Society';
export type Treaty='trade'|'nonaggression'|'knowledge'|PoliticalMission;
export const treaties:Record<Treaty,{name:string;description:string;cost:number}>={
 ...politicalMissions,
 trade:{name:'Umowa handlowa',description:'Przez 3 dni: -20% ceny karawan.',cost:15},
 nonaggression:{name:'Pakt o nieagresji',description:'Przez 3 dni: relacje nie spadna ponizej 60%.',cost:12},
 knowledge:{name:'Wymiana wiedzy',description:'20 wiedzy po powrocie posla. Umowa trwa 3 dni.',cost:18},
};
export type Embassy={unitId:string;neighbor:string;treaty:Treaty;phase:'outbound'|'negotiating'|'return';remaining:number;home:{x:number;y:number};accepted:boolean;cargo?:number;recruit?:boolean};
export type DiplomacyState={missions:Embassy[];agreements:{neighbor:string;kind:Treaty;until:number}[]};
export const createDiplomacy=():DiplomacyState=>({missions:[],agreements:[]});
export const onMission=(w:World,id:string)=>w.diplomacy.missions.some(m=>m.unitId===id);
export const treatyActive=(w:World,neighbor:string,kind:Treaty)=>w.diplomacy.agreements.some(a=>a.neighbor===neighbor&&a.kind===kind&&a.until>w.time);
export function envoyCost(w:World,kind:Treaty){return Math.ceil(treaties[kind].cost*(mandate(w,'commerce')||w.progression.system==='council'?.85:1))}
export function sendEnvoy(w:World,id:string,neighbor:string,kind:Treaty){
 const a=w.living.find(a=>a.id===id),site=neighborSites.find(n=>n.id===neighbor);
 if(w.outcome||!a||!['raven','pig'].includes(a.species)||!site||!Object.hasOwn(treaties,kind)||a.health<.3||a.fatigue>.8||onMission(w,id)||w.diplomacy.missions.some(m=>m.neighbor===neighbor)||treatyActive(w,neighbor,kind))return false;
 if(isPolitical(kind)&&(a.species!=='pig'||!canNegotiate(w,neighbor,kind)))return false;
 if(a.species!=='raven'&&!w.navigation.route(a,site.entry))return false;
 const cost={gold:envoyCost(w,kind)};if(!w.canPay(cost))return false;
 if(a.carriedGrain+a.load>0){w.notify('Posel musi najpierw rozladowac ladunek.');return false}
 w.pay(cost);a.job=null;a.target=null;a.path=[];a.destination=null;a.queue=[];a.autoBuilder=false;a.forced=false;a.task='diplomacy';
 w.diplomacy.missions.push({unitId:id,neighbor,treaty:kind,phase:'outbound',remaining:0,home:{x:a.x,y:a.y},accepted:false});
 w.log(a.name+' wyrusza z poselstwem: '+site.name+'.');w.revision++;return true;
}
function fly(w:World,a:Resident,p:{x:number;y:number},dt:number){
 if(a.species!=='raven'){
  if(!a.path.length||!w.navigation.clearLine(a,a.path[0],10))a.path=w.navigation.route(a,p)??[];
  const target=a.path[0];if(!target)return Math.hypot(a.x-p.x,a.y-p.y)<25;
  const dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*65*w.navigation.speedAt(a));
  if(d){a.x+=dx/d*step;a.y+=dy/d*step;a.heading=Math.atan2(dy,dx);a.travel+=step}if(step>=d-.001)a.path.shift();
  return Math.hypot(a.x-p.x,a.y-p.y)<25;
 }
 const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*190);
 if(d>.001){a.x+=dx/d*step;a.y+=dy/d*step;a.heading=Math.atan2(dy,dx);a.travel+=step}
 return d<=step+.001;
}
export function tickDiplomacy(w:World,dt:number){
 w.diplomacy.agreements=w.diplomacy.agreements.filter(a=>a.until>w.time);
 for(const t of w.diplomacy.agreements)if(t.kind==='nonaggression')w.regime.relations[t.neighbor]=Math.max(.6,w.regime.relations[t.neighbor]);
 const completed:Embassy[]=[];
 for(const m of w.diplomacy.missions){
  const a=w.living.find(a=>a.id===m.unitId);
  if(!a){completed.push(m);w.log('Posel nie wrocil. Negocjacje zostaly przerwane.');continue}
  const site=neighborSites.find(n=>n.id===m.neighbor)!;
  a.task='diplomacy';a.fatigue=Math.min(1,a.fatigue+dt*.001);
  if(m.phase==='outbound'&&fly(w,a,site.entry,dt)){m.phase='negotiating';m.remaining=12}
  else if(m.phase==='negotiating'){
   m.remaining=Math.max(0,m.remaining-dt);
   if(m.remaining===0){m.accepted=w.regime.relations[m.neighbor]>=.2;
    if(m.accepted&&isPolitical(m.treaty)){m.accepted=settleNegotiation(w,m.neighbor,m.treaty,a);if(m.accepted){m.cargo=m.treaty==='commerce'?40:0;m.recruit=m.treaty==='adoption'}}
    a.path=[];m.phase='return';w.log(m.accepted?'Umowa podpisana. Posel wraca z dokumentami.':'Rozmowy odrzucone. Posel wraca bez umowy.')}
  }else if(m.phase==='return'&&fly(w,a,m.home,dt)){
   const safe=w.navigation.nearestFree(m.home);if(safe){a.x=safe.x;a.y=safe.y}a.task='idle';a.wait=2;completed.push(m);
   if(m.accepted){
    if(m.cargo){const delivered=Math.min(m.cargo,Math.max(0,w.capacity-w.economy.grain));w.economy.grain+=delivered;m.cargo-=delivered;if(m.cargo>0){completed.pop();a.task='diplomacy';continue}}
    w.progression.xp[a.id]=Math.min(720,(w.progression.xp[a.id]??0)+60);
    if(m.recruit&&w.living.length<w.populationCap)w.addUnit('Newcomer','sheep',a.x+30,a.y);
    else if(m.recruit){w.foreign.farms.find(f=>f.id===m.neighbor)!.population++;w.log('Brak miejsc. Mieszkaniec pozostal u sasiada.');}
   }
   if(m.accepted&&!isPolitical(m.treaty)){w.diplomacy.agreements=w.diplomacy.agreements.filter(t=>t.neighbor!==m.neighbor||t.kind!==m.treaty);w.diplomacy.agreements.push({neighbor:m.neighbor,kind:m.treaty,until:w.time+195});w.regime.relations[m.neighbor]=Math.min(1,w.regime.relations[m.neighbor]+.12);if(m.treaty==='knowledge')w.resources.knowledge+=20;w.log('Ratyfikowano: '+treaties[m.treaty].name+' / '+site.name+'.')}
   w.revision++;
  }
 }
 w.diplomacy.missions=w.diplomacy.missions.filter(m=>!completed.includes(m));
}
export function validDiplomacy(d:DiplomacyState,units:Resident[]){
 const n=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 const site=(id:string)=>neighborSites.some(s=>s.id===id);
 return !!d&&Array.isArray(d.missions)&&d.missions.length<=3&&new Set(d.missions.map(m=>m?.unitId)).size===d.missions.length&&new Set(d.missions.map(m=>m?.neighbor)).size===d.missions.length&&d.missions.every(m=>m&&units.some(a=>a.id===m.unitId&&['raven','pig'].includes(a.species))&&site(m.neighbor)&&Object.hasOwn(treaties,m.treaty)&&['outbound','negotiating','return'].includes(m.phase)&&n(m.remaining)&&m.remaining<=12&&m.home&&n(m.home.x)&&n(m.home.y)&&m.home.x<=5400&&m.home.y<=3600&&typeof m.accepted==='boolean'&&(m.cargo===undefined||n(m.cargo)&&m.cargo<=40)&&(m.recruit===undefined||typeof m.recruit==='boolean'))&&Array.isArray(d.agreements)&&d.agreements.length<=9&&new Set(d.agreements.map(t=>t?.neighbor+':'+t?.kind)).size===d.agreements.length&&d.agreements.every(t=>t&&site(t.neighbor)&&Object.hasOwn(treaties,t.kind)&&n(t.until));
}
