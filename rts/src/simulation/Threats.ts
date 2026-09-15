import type {World} from './World';
import type {Point} from './Navigation';
import {suited} from './Roles';
export type Raider=Point&{health:number;path:Point[]};
export type Threat={kind:'fire'|'raid';phase:'warning'|'active';x:number;y:number;buildingId:number;deadline:number;strength:number;raiders:Raider[]};
export type ThreatState={nextAt:number;sequence:number;active:Threat|null;resolved:number;lostGrain:number};
export const createThreats=(time=0):ThreatState=>({nextAt:time+150,sequence:0,active:null,resolved:0,lostGrain:0});
export function announceThreat(w:World,kind:'fire'|'raid'){
 if(w.threats.active||w.outcome)return false;
 const b=w.buildings.find(b=>b.kind==='barn'&&b.progress>=1);if(!b)return false;
 w.threats.active={kind,phase:'warning',x:kind==='raid'?1690:b.x,y:kind==='raid'?650:b.y+45,buildingId:b.id,deadline:w.time+30,strength:1,raiders:[]};
 w.log(kind==='raid'?'Zwiadowcy dostrzegli najezdzcow. Straz ma 30 sekund na dotarcie do wschodniej bramy.':'Dym nad stodola. Przygotuj gaszenie przy budynku w ciagu 30 sekund.');
 return true;
}
export function respondToThreat(w:World){
 const t=w.threats.active;if(!t||w.outcome)return false;
 const workers=w.living.filter(a=>suited(a,'guard')&&a.hunger<.85);
 if(!workers.length){w.notify('Brak zdolnej do dzialania strazy.');return false}
 w.command(workers.map(a=>a.id),'guard',{x:t.x,y:t.y+55});w.log('Straz wyrusza do miejsca zagrozenia.');return true;
}
export function emergencySupplies(w:World){
 const t=w.threats.active,cost={wood:15,grain:10};
 if(!t||t.strength<=0||w.outcome||!w.canPay(cost))return false;
 w.pay(cost);t.strength=Math.max(0,t.strength-.45);
 for(const e of t.raiders)e.health=Math.max(0,e.health-25);
 w.log('Zuzyto zapasy awaryjne: 15 drewna i 10 zboza. Zagrozenie oslablo.');return true;
}
export function tickThreats(w:World,dt:number){
 const state=w.threats;
 if(!state.active&&w.time>=state.nextAt){
  if(announceThreat(w,state.sequence%2===0?'fire':'raid'))state.sequence++;
  state.nextAt=w.time+260;
 }
 const t=state.active;if(!t)return;
 const barn=w.buildings.find(b=>b.id===t.buildingId);
 if(!barn){state.active=null;return}
 const entry={x:barn.x,y:barn.y+75};
 const finish=(message:string)=>{state.active=null;state.resolved++;state.nextAt=Math.max(state.nextAt,w.time+150);w.log(message)};
 if(t.strength<=0){finish(t.kind==='fire'?'Pozar ugaszony. Ocalale zapasy pozostaly w stodole.':'Straz odparla najazd. Folwark zachowal zapasy.');return}
 const responders=w.living.filter(a=>['guard','patrol'].includes(a.job??'')&&!a.path.length&&Math.hypot(a.x-t.x,a.y-t.y)<160);
 if(t.phase==='warning'){
  if(w.time<t.deadline)return;
  t.phase='active';t.deadline=w.time+60;
  if(t.kind==='raid')t.raiders=Array.from({length:3},(_,i)=>{
   const start=w.navigation.nearestFree({x:1870+i*55,y:650+i*25})!;
   return {...start,health:60*t.strength,path:w.navigation.route(start,entry)??[]};
  });
  w.log(t.kind==='raid'?'Najezdzcy przekroczyli granice. Straz walczy tylko tam, gdzie rzeczywiscie dotarla.':'Stodola plonie. Ogien niszczy zapasy i wstrzymuje rozladunek.');
 }
 if(t.kind==='fire'){
  t.strength=Math.max(0,t.strength-dt*(responders.length*.045+(w.count('well')?responders.length*.025:0)));
  const loss=Math.min(w.economy.grain,dt*t.strength*1.3);w.economy.grain-=loss;state.lostGrain+=loss;
  for(const a of w.living)if(Math.hypot(a.x-t.x,a.y-t.y)<70)a.health=Math.max(0,a.health-dt*.0015*t.strength);
  if(t.strength<=.001){finish('Pozar ugaszony. Ocalale zapasy pozostaly w stodole.');return}
 }else{
  for(const enemy of t.raiders){
   if(enemy.health<=0)continue;
   const defenders=w.living.filter(a=>['guard','patrol'].includes(a.job??'')&&Math.hypot(a.x-enemy.x,a.y-enemy.y)<140);
   enemy.health=Math.max(0,enemy.health-dt*defenders.length*(6+w.count('tower')*2));
   for(const a of defenders)if(Math.hypot(a.x-enemy.x,a.y-enemy.y)<85)a.health=Math.max(0,a.health-dt*.001);
   if(enemy.health<=0)continue;
   const p=enemy.path[0];
   if(p){
    if(!w.navigation.clearLine(enemy,p,10))enemy.path=w.navigation.route(enemy,entry)??[];
    else {const d=Math.hypot(p.x-enemy.x,p.y-enemy.y),step=Math.min(dt*48,d);if(d){enemy.x+=(p.x-enemy.x)/d*step;enemy.y+=(p.y-enemy.y)/d*step}if(step>=d-.001)enemy.path.shift()}
   }else if(Math.hypot(enemy.x-entry.x,enemy.y-entry.y)<120){
    const loss=Math.min(w.economy.grain,dt*1.2);w.economy.grain-=loss;state.lostGrain+=loss;
   }else enemy.path=w.navigation.route(enemy,entry)??[];
  }
  if(t.raiders.every(e=>e.health<=0)){finish('Straz odparla najazd. Folwark zachowal zapasy.');return}
 }
 if(w.time>=t.deadline)finish(t.kind==='raid'?'Najezdzcy wycofali sie. Utraconych zapasow nie odzyskamy.':'Pozar wygasl. Spalone zapasy przepadly.');
}
export function validThreats(value:unknown):value is ThreatState{
 const s=value as ThreatState,n=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0,p=(x:Point)=>x&&n(x.x)&&n(x.y)&&x.x<=3600&&x.y<=2400;
 if(!s||!n(s.nextAt)||!Number.isInteger(s.sequence)||s.sequence<0||!n(s.resolved)||!n(s.lostGrain))return false;
 const t=s.active;
 return t===null||!!t&&['fire','raid'].includes(t.kind)&&['warning','active'].includes(t.phase)&&p(t)&&Number.isInteger(t.buildingId)&&n(t.deadline)&&n(t.strength)&&t.strength<=1&&Array.isArray(t.raiders)&&t.raiders.length<=3&&t.raiders.every(e=>p(e)&&n(e.health)&&e.health<=60&&Array.isArray(e.path)&&e.path.length<=500&&e.path.every(p));
}
