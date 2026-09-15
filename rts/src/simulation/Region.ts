import type {World,Resource} from './World';
import {neighborSites,cityGate} from './Landscape';
import type {Point} from './Navigation';
export type Stock=Record<'grain'|'wood'|'bread'|'gold',number>;
export type Settlement={id:string;stock:Stock;cycle:number;cycles:number;health:number;workers:number;status:'working'|'shortage'|'strike'|'storm'|'full';disruptedUntil:number;nextTrade:number;lastDay:number};
export type Traffic={id:number;settlement:string;path:Point[];x:number;y:number;leg:'outbound'|'abroad'|'return';until:number;cargo:Stock};
export type RegionState={settlements:Settlement[];traffic:Traffic[]};
export const createRegion=():RegionState=>({settlements:neighborSites.map((n,i)=>({id:n.id,stock:{grain:180,wood:150,bread:90,gold:100},cycle:0,cycles:0,health:1,workers:3,status:'working',disruptedUntil:0,nextTrade:50+i*25,lastDay:1})),traffic:[]});
export const productionNames:Record<string,string>={dwor:'Zniwa: +8 zboza',mlyn:'Wycinka: -2 zboza, +10 drewna',czerwony:'Pieczenie: -4 zboza, -1 drewna, +6 chleba'};
export function reserveStock(w:World,id:string,cargo:Partial<Record<Resource,number>>){
 const n=w.region.settlements.find(n=>n.id===id);if(!n||w.foreign.farms.find(f=>f.id===id)?.collapsed)return false;
 if(Object.entries(cargo).some(([k,v])=>!(k in n.stock)||n.stock[k as keyof Stock]<v))return false;
 for(const[k,v]of Object.entries(cargo))n.stock[k as keyof Stock]-=v;return true;
}
export function receivePayment(w:World,id:string,payment:Partial<Record<Resource,number>>,aid=false){
 const n=w.region.settlements.find(n=>n.id===id);if(!n)return;
 for(const[k,v]of Object.entries(payment))if(k in n.stock)n.stock[k as keyof Stock]=Math.min(500,n.stock[k as keyof Stock]+v);
 if(aid){n.health=Math.min(1,n.health+.2);n.disruptedUntil=w.time;n.status='working'}
}
function startMerchant(w:World,n:Settlement){
 const site=neighborSites.find(s=>s.id===n.id)!,resource=n.id==='dwor'?'grain':n.id==='mlyn'?'wood':'bread';
 if(n.stock[resource]<90||w.region.traffic.some(t=>t.settlement===n.id))return;
 const path=w.navigation.route(site.entry,cityGate.entry);if(!path)return;
 n.stock[resource]-=35;n.nextTrade=w.time+110;
 w.region.traffic.push({id:w.nextId++,settlement:n.id,path,...site.entry,leg:'outbound',until:0,cargo:{grain:25,wood:0,bread:0,gold:18}});
}
export function tickRegion(w:World,dt:number){
 const winter=w.season==='Zima';
 for(const n of w.region.settlements){
  if(w.foreign.farms.find(f=>f.id===n.id)?.collapsed){n.workers=0;continue}
  if(n.lastDay<w.day){
   n.lastDay=w.day;
   const need=Math.max(8,(w.foreign.farms.find(f=>f.id===n.id)?.population??18)*.8);
   const grain=Math.min(n.stock.grain,need);n.stock.grain-=grain;
   const bread=Math.min(n.stock.bread,(need-grain)/2);n.stock.bread-=bread;
   const food=grain+bread*2;
   const fuel=winter?Math.min(n.stock.wood,12):0;n.stock.wood-=fuel;
   n.health=Math.max(0,Math.min(1,n.health+(food<need||winter&&fuel<12?-.16:.025)));
   if(w.day===3&&n.id==='czerwony'||w.day===5&&n.id==='mlyn'){
    n.disruptedUntil=w.time+65;n.status=n.id==='mlyn'?'storm':'strike';
    w.log((n.id==='mlyn'?'Wichura zatrzymala Wolny Mlyn.':'Strajk w Czerwonym Folwarku.')+' Pomoc zywnosciowa moze wznowic prace.');
   }
  }
  n.workers=n.health<.4?1:n.health<.7?2:3;
  if(w.time<n.disruptedUntil)continue;
  const inputs=()=>n.id==='dwor'||n.id==='mlyn'&&n.stock.grain>=2||n.id==='czerwony'&&n.stock.grain>=4&&n.stock.wood>=1;
  const room=()=>n.id==='dwor'?n.stock.grain<=492:n.id==='mlyn'?n.stock.wood<=490:n.stock.bread<=494;
  n.status=!inputs()?'shortage':!room()?'full':'working';
  if(n.status!=='working'){if(w.time>=n.nextTrade)startMerchant(w,n);continue;}
  n.cycle+=dt*(n.workers/3)*(winter?.6:1);
  while(n.cycle>=12&&inputs()&&room()){
   n.cycle-=12;n.cycles++;
   if(n.id==='dwor')n.stock.grain=Math.min(500,n.stock.grain+8);
   if(n.id==='mlyn'){n.stock.grain=Math.max(0,n.stock.grain-2);n.stock.wood=Math.min(500,n.stock.wood+10)}
   if(n.id==='czerwony'){n.stock.grain=Math.max(0,n.stock.grain-4);n.stock.wood=Math.max(0,n.stock.wood-1);n.stock.bread=Math.min(500,n.stock.bread+6)}
  }
  if(!inputs()||!room())n.cycle=0;
  if(w.time>=n.nextTrade)startMerchant(w,n);
 }
 for(const t of w.region.traffic){
  const site=neighborSites.find(n=>n.id===t.settlement)!;
  if(t.leg==='abroad'){
   if(w.time<t.until)continue;
   const path=w.navigation.route(t,site.entry);if(!path)continue;t.path=path;t.leg='return';
  }
  const target=t.leg==='outbound'?cityGate.entry:site.entry;
  if(t.path.length&&!w.navigation.clearLine(t,t.path[0])){const route=w.navigation.route(t,target);if(!route)continue;t.path=route}
  let distance=dt*65*w.navigation.speedAt(t);
  while(distance>0&&t.path.length){
   const p=t.path[0],d=Math.hypot(p.x-t.x,p.y-t.y),step=Math.min(distance,d);
   if(d>.001){t.x+=(p.x-t.x)/d*step;t.y+=(p.y-t.y)/d*step}distance-=step;if(d<=step+.001)t.path.shift();
  }
  if(!t.path.length&&t.leg==='outbound'){t.leg='abroad';t.until=w.time+30}
  else if(!t.path.length&&t.leg==='return'){receivePayment(w,t.settlement,t.cargo);t.until=-1}
 }
 w.region.traffic=w.region.traffic.filter(t=>t.until!==-1);
}
export function validRegion(value:unknown):value is RegionState{
 const r=value as RegionState,number=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const point=(p:Point)=>p&&number(p.x)&&number(p.y)&&p.x<=5400&&p.y<=3600;
 const stock=(s:Stock)=>s&&['grain','wood','bread','gold'].every(k=>number(s[k as keyof Stock])&&s[k as keyof Stock]<=500);
 return !!r&&Array.isArray(r.settlements)&&r.settlements.length===3&&new Set(r.settlements.map(n=>n?.id)).size===3&&r.settlements.every(n=>n&&neighborSites.some(s=>s.id===n.id)&&stock(n.stock)&&number(n.cycle)&&n.cycle<12&&Number.isInteger(n.cycles)&&n.cycles>=0&&number(n.health)&&n.health<=1&&[0,1,2,3].includes(n.workers)&&['working','shortage','strike','storm','full'].includes(n.status)&&number(n.disruptedUntil)&&number(n.nextTrade)&&number(n.lastDay))&&Array.isArray(r.traffic)&&r.traffic.length<=3&&new Set(r.traffic.map(t=>t?.settlement)).size===r.traffic.length&&new Set(r.traffic.map(t=>t?.id)).size===r.traffic.length&&r.traffic.every(t=>t&&Number.isInteger(t.id)&&t.id>=0&&neighborSites.some(s=>s.id===t.settlement)&&point(t)&&Array.isArray(t.path)&&t.path.length<2000&&t.path.every(point)&&['outbound','abroad','return'].includes(t.leg)&&number(t.until)&&stock(t.cargo));
}
