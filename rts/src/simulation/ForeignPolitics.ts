import type {World,Resident} from './World';
import {neighborSites} from './Landscape';
import {hasTalent} from './Progression';
export type Government='human'|'council'|'directorate'|'commune';
export type ForeignFarm={id:string;government:Government;leader:string;population:number;influence:number;propaganda:number;affiliated:boolean;collapsed:boolean;request:'food'|'join'|null;lastDay:number;starvation:number};
export type ForeignState={farms:ForeignFarm[]};
export const createForeign=():ForeignState=>({farms:neighborSites.map((s,i)=>({id:s.id,government:(['human','commune','directorate'] as const)[i],leader:['Mr. Pilkington','Clover','Caesar'][i],population:18+i*3,influence:0,propaganda:0,affiliated:false,collapsed:false,request:null,lastDay:1,starvation:0}))});
export type PoliticalMission='propaganda'|'commerce'|'liberation'|'federation'|'adoption';
export const politicalMissions:Record<PoliticalMission,{name:string;description:string;cost:number}>={
 propaganda:{name:'Misja propagandowa',description:'+20 propagandy, +15 wplywu. Wymaga drukarni.',cost:20},
 commerce:{name:'Delegacja handlowa',description:'Kup 40 zboza z zapasow sasiada. +10 wplywu.',cost:16},
 liberation:{name:'Wesprzyj rewolucje',description:'70 propagandy i 50 wplywu: obalenie ludzkiej wladzy.',cost:35},
 federation:{name:'Zaproponuj przylaczenie',description:'80 wplywu, 70 propagandy, relacje 60%. Wspolne dostawy.',cost:40},
 adoption:{name:'Przyjmij zwierze',description:'Przyjazd jednego mieszkanca. Wymaga wolnego miejsca.',cost:25},
};
export const isPolitical=(k:string):k is PoliticalMission=>Object.hasOwn(politicalMissions,k);
export function canNegotiate(w:World,id:string,k:PoliticalMission){
 const f=w.foreign.farms.find(f=>f.id===id),n=w.region.settlements.find(n=>n.id===id);
 if(!f||!n||f.collapsed)return false;
 if(k==='propaganda')return w.research.includes('printing');
 if(k==='commerce')return n.stock.grain>=40;
 if(k==='adoption')return f.population>3&&w.living.length<w.populationCap;
 if(k==='liberation')return w.research.includes('solidarity')&&f.government==='human'&&f.propaganda>=70&&f.influence>=50;
 return w.research.includes('solidarity')&&!f.affiliated&&f.government!=='human'&&f.influence>=80&&f.propaganda>=70&&w.regime.relations[id]>=.6;
}
export function settleNegotiation(w:World,id:string,k:PoliticalMission,a:Resident){
 if(!canNegotiate(w,id,k))return false;
 const f=w.foreign.farms.find(f=>f.id===id)!,n=w.region.settlements.find(n=>n.id===id)!;
 const bonus=(hasTalent(w,a.id,'speaker')?5:0)+(hasTalent(w,a.id,'diplomat')?10:0);
 if(k==='propaganda'){f.propaganda=Math.min(100,f.propaganda+20);f.influence=Math.min(100,f.influence+15+bonus)}
 if(k==='commerce'){
  // Reserve actual neighbor grain; the envoy carries it back, never creates stock.
  n.stock.grain-=40;f.influence=Math.min(100,f.influence+10+bonus);
 }
 if(k==='liberation'){f.government=w.progression.system??'council';f.leader='Animal assembly';w.regime.relations[id]=Math.max(.6,w.regime.relations[id]);f.request='join'}
 if(k==='federation'){f.affiliated=true;f.request=null}
 if(k==='adoption'){f.population--}
 return true;
}
export function answerRequest(w:World,id:string,accept:boolean){
 const f=w.foreign.farms.find(f=>f.id===id),n=w.region.settlements.find(n=>n.id===id);if(!f||!n||!f.request||w.outcome)return false;
 if(!accept){f.request=null;w.regime.relations[id]=Math.max(0,w.regime.relations[id]-.1);return true}
 if(f.request==='food'){
  if(!w.canPay({grain:40}))return false;w.pay({grain:40});n.stock.grain=Math.min(500,n.stock.grain+40);n.health=Math.min(1,n.health+.15);f.influence=Math.min(100,f.influence+20);w.regime.relations[id]=Math.min(1,w.regime.relations[id]+.15);
 }else {if(f.government==='human'||f.influence<50||w.regime.relations[id]<.5)return false;f.affiliated=true}
 f.request=null;w.revision++;return true;
}
export function tickForeign(w:World){
 for(const f of w.foreign.farms){
  if(f.collapsed||f.lastDay>=w.day)continue;
  f.lastDay=w.day;const n=w.region.settlements.find(n=>n.id===f.id)!;
  if(n.stock.grain+n.stock.bread<25){f.starvation++;if(!f.request)w.log(neighborSites.find(n=>n.id===f.id)!.name+': Prosba o zywnosc.');f.request='food';if(f.starvation>=3){f.population=Math.max(0,f.population-2);n.health=Math.max(0,n.health-.15)}}
  else f.starvation=Math.max(0,f.starvation-1);
  if(f.population===0){f.collapsed=true;f.request=null;n.workers=0;n.status='shortage';w.log(neighborSites.find(s=>s.id===f.id)!.name+': Farma opustoszala.');continue}
  if(!f.affiliated&&f.government!=='human'&&f.influence>=50&&w.regime.relations[f.id]>=.5&&n.health<.55)f.request='join';
  if(f.affiliated&&n.stock.grain>100){
   const amount=Math.min(20,n.stock.grain-100,w.capacity-w.economy.grain);if(amount>0){n.stock.grain-=amount;w.economy.grain+=amount}
  }
  const compatible=f.government===(w.progression.system??'council');
  w.regime.relations[f.id]=Math.max(0,Math.min(1,w.regime.relations[f.id]+(compatible?.015:f.government==='human'&&f.propaganda>40?-.025:0)));
  if(!f.affiliated)f.propaganda=Math.max(0,f.propaganda-1);
 }
}
export function validForeign(s:ForeignState){
 return !!s&&Array.isArray(s.farms)&&s.farms.length===3&&new Set(s.farms.map(f=>f?.id)).size===3&&s.farms.every(f=>f&&neighborSites.some(n=>n.id===f.id)&&['human','council','directorate','commune'].includes(f.government)&&typeof f.leader==='string'&&f.leader.length<=100&&Number.isInteger(f.population)&&f.population>=0&&f.population<=100&&[f.influence,f.propaganda].every(n=>Number.isFinite(n)&&n>=0&&n<=100)&&typeof f.affiliated==='boolean'&&typeof f.collapsed==='boolean'&&[null,'food','join'].includes(f.request)&&Number.isInteger(f.lastDay)&&f.lastDay>=1&&Number.isInteger(f.starvation)&&f.starvation>=0);
}
