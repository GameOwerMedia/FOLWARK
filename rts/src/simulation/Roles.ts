import type {Species} from './Animal';
import type {Resident,Job,BuildingKind,Resource,World} from './World';
export type Role={name:string;description:string;primary:Job;skills:Partial<Record<Exclude<Job,null>,number>>;strength:number;capacity:number;yield?:Resource};
export const roles:Record<Species,Role>={
 horse:{name:'Praca pociagowa',description:'Orka, zniwa i ciezki transport.',primary:'harvest',skills:{harvest:1.45,wood:1.15,stone:1,build:.8},strength:.95,capacity:22},
 mule:{name:'Ciesielstwo',description:'Budowa, narzedzia i przewoz materialow.',primary:'build',skills:{build:1.6,wood:1.2,stone:1.1,produce:1},strength:.9,capacity:20},
 cow:{name:'Mleczarstwo',description:'Mleko dla wspolnej kuchni. Wymaga paszy.',primary:'care',skills:{care:1.3,harvest:.55},strength:.7,capacity:12,yield:'milk'},
 hen:{name:'Niesienie jaj',description:'Jaja dla wspolnej kuchni. Wymaga paszy.',primary:'care',skills:{care:1.2,harvest:.55},strength:.15,capacity:3,yield:'eggs'},
 duck:{name:'Niesienie jaj',description:'Jaja i drobne zbiory przy gospodarstwie.',primary:'care',skills:{care:1,harvest:.65},strength:.2,capacity:4,yield:'eggs'},
 sheep:{name:'Welna i wypas',description:'Welna na ocieplenie kwater. Wymaga paszy.',primary:'care',skills:{care:1.1,harvest:.6},strength:.4,capacity:6,yield:'wool'},
 goat:{name:'Ziola i opieka',description:'Zbiera ziola. Leczy rannych w poblizu.',primary:'care',skills:{care:1.2,study:.8,harvest:.8},strength:.4,capacity:6,yield:'herbs'},
 pig:{name:'Organizacja i propaganda',description:'Organizuje prace, przemawia i prowadzi nauke.',primary:'govern',skills:{govern:1.35,study:1.1,produce:.8},strength:.45,capacity:6},
 dog:{name:'Straz i patrol',description:'Chroni okolice i utrzymuje porzadek.',primary:'patrol',skills:{patrol:1.4,guard:1.4},strength:.7,capacity:5},
 ram:{name:'Obrona stada',description:'Warta, patrole i obrona wspolnoty.',primary:'guard',skills:{guard:1.3,patrol:1.1,harvest:.55},strength:.8,capacity:9},
 boar:{name:'Ciezka praca',description:'Kamien, drewno i obrona gospodarstwa.',primary:'stone',skills:{stone:1.4,wood:1.3,build:.9,guard:1.1,patrol:.85},strength:.95,capacity:17},
 cat:{name:'Zwiad',description:'Cichy patrol i obserwacja granic.',primary:'patrol',skills:{patrol:1.2,guard:.8},strength:.3,capacity:3},
 donkey:{name:'Nauka i pamiec',description:'Badania, kronika i praca przy narzedziach.',primary:'study',skills:{study:1.5,produce:1,harvest:.85,wood:.8},strength:.75,capacity:14},
 raven:{name:'Dyplomacja',description:'Lata z poselstwem. Negocjuje i przywozi podpisane umowy.',primary:null,skills:{study:.7,govern:.6},strength:.12,capacity:2},
 goose:{name:'Herold',description:'Ostrzega, przemawia i pilnuje gospodarstwa.',primary:'govern',skills:{govern:1.1,guard:1,patrol:.8},strength:.35,capacity:4},
};
export function aptitude(a:Pick<Resident,'species'>,job:Job,kind?:BuildingKind){
 if(!job)return 1;
 const role=roles[a.species];
 if(job==='care'&&kind&&(kind==='pasture'&&!['cow','sheep'].includes(a.species)||kind==='barn'&&a.species==='goat'))return .2;
 if(job==='produce'&&kind==='school')return role.skills.study??.2;
 if(job==='produce'&&kind==='smith')return a.species==='mule'?1.5:a.species==='donkey'?1:.2;
 return role.skills[job]??.2;
}
export function suited(a:Pick<Resident,'species'>,job:Job,kind?:BuildingKind){return aptitude(a,job,kind)>=.5}
export function workEfficiency(a:Resident,kind?:BuildingKind){return aptitude(a,a.job,kind)*(a.forced?.75:1)}
export function roleWorkplace(w:World,a:Resident){
 const kinds:BuildingKind[]=a.job==='care'?a.species==='goat'?['garden','field']:['cow','sheep'].includes(a.species)?['pasture','barn']:['barn']:a.job==='study'?['library','school','house']:['stage','house'];
 return w.buildings.filter(b=>b.enabled&&b.progress>=1&&kinds.includes(b.kind)).sort((b,c)=>(b.id===a.target?-10000:0)+kinds.indexOf(b.kind)*5000+Math.hypot(a.x-b.x,a.y-b.y)-((c.id===a.target?-10000:0)+kinds.indexOf(c.kind)*5000+Math.hypot(a.x-c.x,a.y-c.y)))[0];
}
export function tickDuty(w:World,a:Resident,dt:number){
 const efficiency=workEfficiency(a);
 a.fatigue=Math.min(1,a.fatigue+dt*.003*w.workFatigue*(a.forced?2:1));
 if(a.job==='care'){
  const output=roles[a.species].yield;
  if(!output)return;
  if(w.get(output)+2>w.storageLimit(output)||w.economy.grain<1)return;
  a.dutyProgress+=dt*efficiency;
  if(a.dutyProgress>=16){w.pay({grain:1});w.set(output,w.get(output)+2);a.dutyProgress-=16}
  if(a.species==='goat'&&w.resources.herbs>0){
   const patient=w.living.find(u=>u.id!==a.id&&u.health<.98&&Math.hypot(u.x-a.x,u.y-a.y)<240);
   if(patient){const dose=Math.min(w.resources.herbs,dt*.05);w.resources.herbs-=dose;patient.health=Math.min(1,patient.health+dose*.22)}
  }
 }else if(a.job==='study'){
  a.dutyProgress=Math.min(14,a.dutyProgress+dt*efficiency);
  if(a.dutyProgress>=14&&w.economy.grain>=1){w.pay({grain:1});w.resources.knowledge+=2;a.dutyProgress-=14}
 }else if(a.job==='govern'){
  a.dutyProgress+=dt*efficiency;
  if(a.dutyProgress>=18){w.resources.gold+=1;a.dutyProgress-=18;for(const u of w.living)if(Math.hypot(u.x-a.x,u.y-a.y)<300)u.loyalty=Math.min(1,u.loyalty+.005)}
 }
}
