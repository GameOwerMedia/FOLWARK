import {treatyActive} from './Diplomacy';
import {mandate} from './Society';
import { DAY_SECONDS, type World, type Resource } from './World';
import {reserveStock,receivePayment} from './Region';
import { neighborSites,tradeSites } from './Landscape';
import type { Point } from './Navigation';
export type Edict='truth'|'propaganda'|'force'|'crackdown';
export type Press='free'|'censored';
export type Heating='off'|'normal'|'high';
export type Convoy={id:number;neighbor:string;kind:'trade'|'aid'|'contract';path:Point[];x:number;y:number;cargo:Partial<Record<Resource,number>>;payment?:Partial<Record<Resource,number>>;waitUntil?:number;state:'travel'|'unload'|'abroad';leg:'outbound'|'return'};
export type RegimeState={trust:number;integrity:number;heat:number;heating:Heating;press:Press;lies:number;nextEdict:number;forcedUntil:number;insulated:boolean;official:{day:number;text:string}[];relations:Record<string,number>;convoys:Convoy[];deaths:string[];sold:string[];revealDay:number};
export const createRegime=():RegimeState=>({trust:.65,integrity:1,heat:.8,heating:'normal',press:'free',lies:0,nextEdict:0,forcedUntil:0,insulated:false,official:[],relations:{dwor:.5,mlyn:.65,czerwony:.4},convoys:[],deaths:[],sold:[],revealDay:0});
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const edicts:Record<Edict,{name:string;cost:Partial<Record<Resource,number>>;description:string}>={
 truth:{name:'Ujawnij prawdziwe zapasy',cost:{gold:5},description:'+8 zaufania. Lojalnosc rosnie tylko, gdy istnieja zapasy.'},
 propaganda:{name:'Oglos rekordowe zbiory',cost:{gold:10},description:'Chwilowo +12 lojalnosci. -10 uczciwosci. Niedobor ujawni klamstwo.'},
 force:{name:'Przymusowa zmiana',cost:{grain:20},description:'Do jutra +35% pracy, +60% zmeczenia. Pracujacy traca zdrowie. Mozliwe zgony.'},
 crackdown:{name:'Pokaz sily strazy',cost:{gold:15},description:'+25 strachu, +12 krzywdy, -12 lojalnosci. Bezposrednie obrazenia pracownikow.'},
};
export const temperature=(w:World)=>w.scenario==='survival'?(w.day<4?8:w.day<7?0:w.day<9?-12:-24):w.season==='Zima'?-12:8;
export const fuelPerDay=(w:World,heating:Heating=w.regime.heating)=>({off:0,normal:28,high:48})[heating]*(1+Math.max(0,-temperature(w))/24*1.5)*(w.regime.insulated?.7:1)*(1-w.society.bedding*.1);
export function bulletin(w:World,text:string){w.regime.official.unshift({day:w.day,text});w.regime.official=w.regime.official.slice(0,60)}
export function edictReason(w:World,key:Edict){
 if(w.outcome)return 'Rozgrywka zakonczona';
 if(w.time<w.regime.nextEdict)return 'Nastepny dekret za '+Math.ceil((w.regime.nextEdict-w.time)/DAY_SECONDS*24)+' godz.';
 if(!w.count('stage'))return 'Wymaga placu zgromadzen';
 if((key==='truth'||key==='propaganda')&&!w.living.some(a=>a.job==='govern'&&!a.forced))return 'Brak rzecznika. Przydziel organizacje wspolnoty.';
 if(key==='crackdown'&&!w.living.some(a=>a.species==='dog'))return 'Brak strazy';
 if(!w.canPay(edicts[key].cost))return 'Brak zasobow';return '';
}
export function issueEdict(w:World,key:Edict){
 if(!edicts[key])return false;const reason=edictReason(w,key);if(reason){w.notify(reason);return false}
 const r=w.regime;w.pay(edicts[key].cost);r.nextEdict=w.time+DAY_SECONDS;
 if(key==='truth'){r.trust=clamp(r.trust+.08);for(const a of w.living)a.loyalty=clamp(a.loyalty+(w.economy.grain>80?.06:-.02));bulletin(w,'Rzeczywisty stan stodoly: '+Math.floor(w.economy.grain)+' workow zboza.')}
 if(key==='propaganda'){r.lies++;r.integrity=clamp(r.integrity-.1);for(const a of w.living)a.loyalty=clamp(a.loyalty+.12);bulletin(w,'Zbiory sa rekordowe. Rada zapewnia: kazdy bedzie syty.')}
 if(key==='force'){r.forcedUntil=w.time+DAY_SECONDS;r.integrity=clamp(r.integrity-.12);for(const a of w.living){a.fear=clamp(a.fear+.1);a.grievance=clamp(a.grievance+.06)}bulletin(w,'Wszyscy dobrowolnie zgodzili sie pracowac dluzej.')}
 if(key==='crackdown'){r.integrity=clamp(r.integrity-.2);r.trust=clamp(r.trust-.15);for(const a of w.living.filter(a=>!['pig','dog'].includes(a.species))){a.fear=clamp(a.fear+.25);a.grievance=clamp(a.grievance+.12);a.loyalty=clamp(a.loyalty-.12);a.health=clamp(a.health-.08)}bulletin(w,'Straz pokojowo przywrocila porzadek.');r.relations.mlyn=clamp(r.relations.mlyn-.2)}
 w.log('Dekret: '+edicts[key].name+'.');recordDeaths(w);return true;
}
export function setPress(w:World,press:Press){
 if(!['free','censored'].includes(press)||w.outcome||w.regime.press===press)return false;
 if(press==='censored'&&!w.canPay({gold:12})){w.notify('Cenzura wymaga 12 monet.');return false}
 if(press==='censored'){w.pay({gold:12});w.regime.integrity=clamp(w.regime.integrity-.08)}
 w.regime.press=press;w.log(press==='free'?'Zniesiono cenzure. Swiadkowie moga mowic.':'Zakazano rozpowszechniania wiadomosci bez zgody rady.');return true;
}
export function insulate(w:World){
 if(w.regime.insulated||w.outcome||!w.canPay({wood:60,stone:20}))return false;
 w.pay({wood:60,stone:20});w.regime.insulated=true;w.log('Ocieplono kwatery. Zuzycie opalu spadlo o 30%.');return true;
}
export function recordDeaths(w:World){
 for(const a of w.units.filter(a=>a.health<=0&&!w.regime.deaths.includes(a.id)&&!w.regime.sold.includes(a.id))){
  w.regime.deaths.push(a.id);w.regime.trust=clamp(w.regime.trust-.08);a.path=[];a.job=null;
  w.log(a.name+' nie zyje. Glod, zimno i wyczerpanie nie sa statystyka.');
  bulletin(w,w.regime.press==='censored'?'Jeden pracownik zostal przeniesiony. Plan produkcji bez zmian.':a.name+' nie przezyl. Rada ponosi odpowiedzialnosc.');
 }
}
export function tickRegime(w:World,dt:number){
 const r=w.regime;
 if(w.scenario==='survival'){
  const cold=Math.max(0,-temperature(w))/24;
  const rate=fuelPerDay(w)/DAY_SECONDS;
  const fuel=Math.min(w.resources.wood,rate*dt);w.resources.wood-=fuel;
  const supplied=rate>0&&fuel>=rate*dt-.00001;
  const target=supplied?(r.heating==='high'?.98:.77)-cold*.52+(r.insulated?.12:0):.35-cold*.3;
  r.heat=clamp(r.heat+(target-r.heat)*dt*.1);
  for(const a of w.living)if(r.heat<.4){a.health=clamp(a.health-dt*(.4-r.heat)*.028);a.grievance=clamp(a.grievance+dt*.002)}
 }
 for(const a of w.living){
  if(w.scenario==='survival'){
   a.loyalty=clamp(a.loyalty+dt*(r.trust-.5)*.001);
   a.grievance=clamp(a.grievance+dt*Math.max(0,.4-r.trust)*.003);
  }
  a.fear=clamp(a.fear-dt*(r.press==='censored'?.00015:.0007));
  if(w.time<r.forcedUntil&&['harvest','wood','stone','build','produce'].includes(a.task))a.health=clamp(a.health-dt*.0018);
 }
 if(r.lies>0&&w.economy.grain+w.resources.bread<55&&r.revealDay!==w.day){
  r.revealDay=w.day;r.lies--;r.trust=clamp(r.trust-.2);
  for(const a of w.living){a.loyalty=clamp(a.loyalty-.18);a.grievance=clamp(a.grievance+.14)}
  w.log('Pusta miska obalila komunikat o rekordowych zbiorach. Zaufanie do rady spadlo.');bulletin(w,'W dostawach wystapily przejsciowe trudnosci.');
 }
 for(const c of r.convoys){
  const site=tradeSites.find(n=>n.id===c.neighbor)!,barn=w.buildings.find(b=>b.kind==='barn'&&b.progress>=1);
  const destination=c.leg==='outbound'?site.entry:barn?{x:barn.x,y:barn.y+75}:null;
  if(!destination)continue;
  if(c.state==='abroad'&&w.time<(c.waitUntil??0))continue;
  if(c.path.length&&!w.navigation.clearLine(c,c.path[0])){
   const route=w.navigation.route(c,destination);if(!route)continue;c.path=route;
  }
  let distance=dt*80*w.navigation.speedAt(c);
  while(distance>0&&c.path.length){
   const p=c.path[0],length=Math.hypot(p.x-c.x,p.y-c.y),step=Math.min(distance,length);
   if(length>.0001){c.x+=(p.x-c.x)/length*step;c.y+=(p.y-c.y)/length*step}distance-=step;
   if(length<=step+.0001)c.path.shift();
  }
  if(!c.path.length&&c.leg==='outbound'){
   if(c.neighbor==='city'&&c.state!=='abroad'){c.state='abroad';c.waitUntil=w.time+65;w.log('Karawana opuscila mape. Zaladunek w miescie potrwa jeden dzien.');continue}
   if(c.payment){receivePayment(w,c.neighbor,c.payment,c.kind==='aid');c.payment=undefined}
  }
  if(!c.path.length&&c.leg==='outbound'&&c.kind!=='aid'){
   if(!barn)continue;const back=w.navigation.route(c,{x:barn.x,y:barn.y+75});if(!back)continue;
   c.leg='return';c.state='travel';c.path=back;continue;
  }
  if(!c.path.length){c.state='unload';for(const [key,amount]of Object.entries(c.cargo)){const k=key as Resource,delivered=Math.min(amount,Math.max(0,w.storageLimit(k)-w.get(k)));w.set(k,w.get(k)+delivered);c.cargo[k]=amount-delivered}}
 }
 const delivered=r.convoys.filter(c=>c.state==='unload'&&!c.path.length&&Object.values(c.cargo).every(n=>(n??0)<.0001));
 for(const c of delivered){
  const name=tradeSites.find(n=>n.id===c.neighbor)!.name;
  if(c.neighbor!=='city')r.relations[c.neighbor]=clamp(r.relations[c.neighbor]+(c.kind==='aid'?.2:.04));
  w.log(c.kind==='aid'?'Pomoc dotarla do '+name+'. Relacje poprawily sie.':'Dostawa z '+name+' dotarla do stodoly.');
 }
 r.convoys=r.convoys.filter(c=>!delivered.includes(c));recordDeaths(w);
}
export function dailyRegime(w:World){
 const r=w.regime;if(w.scenario!=='survival')return;
 let need=w.living.length*2;for(const k of ['milk','eggs'] as const){const n=Math.min(w.resources[k],need);w.resources[k]-=n;need-=n}
 const bread=Math.min(w.resources.bread,need/2);w.resources.bread-=bread;
 const grain=Math.min(w.economy.grain,need-bread*2);w.economy.grain-=grain;
 if(grain+bread*2<need){r.trust=clamp(r.trust-.06);w.log('Nie starczylo racji dziennych dla wszystkich.');for(const a of w.living)a.hunger=clamp(a.hunger+.12)}
 else{for(const a of w.living)a.hunger=clamp(a.hunger-.12);bulletin(w,'Wydano dzienne racje.')}
 if(w.day===3)w.event={title:'Prawda przy pustym stole',text:'Rada chce oglosic sukces. Pracownicy prosza o wspolny posilek, nie o przemowienie.',choices:[{label:'Wydaj 25 zboza. +8 zaufania.',effect:{grain:-25},trust:.08},{label:'Obiecaj poprawe bez wydawania zapasow. -8 zaufania.',effect:{},trust:-.08,integrity:-.06}]};
 if(w.day===5)w.event={title:'Ciala pamietaja',text:'Dwoje pracownikow zasypia przy pracy. Straz proponuje nazwac to sabotazem.',choices:[{label:'Oplac przerwe i opieke: 15 monet. +8 zaufania.',effect:{gold:-15},trust:.08},{label:'Nazwij ich sabotezystami. +10 strachu, -15 uczciwosci.',effect:{},fear:.1,trust:-.1,integrity:-.15}]};
 if(w.day===7)w.event={title:'Zima przekracza brame',text:'Temperatura spada do -12 stopni. Ocalenie folwarku wymaga opalu i ludzi zdolnych do pracy.',choices:[{label:'Rozdaj dodatkowe racje: 30 zboza. +10 zaufania.',effect:{grain:-30},trust:.1},{label:'Zachowaj zapasy. Nie wszyscy zrozumieja.',effect:{},trust:-.04}]};
 if(w.day>=11){
  w.event=null;w.outcome=w.living.length>=8&&r.heat>=.4?'Folwark przetrwal':'Cena przetrwania';
  w.log(w.outcome==='Folwark przetrwal'?(r.integrity>.55?'Zima minela. Zwierzeta zachowaly prawo do wlasnego glosu.':'Zima minela. Folwark ocalal, lecz dawni ciemiezyciele maja nowych nastepcow.'):'Za malo mieszkancow lub ciepla, by utrzymac wspolnote.');
 }
}
export const cityOrders={
 food:{name:'Zywnosc z miasta',label:'Zapasy zywnosci',cost:{gold:35},cargo:{grain:120,bread:30}},
 wood:{name:'Dostawa opalu',label:'Dostawa opalu',cost:{gold:30},cargo:{wood:100}},
 tools:{name:'Narzedzia z miasta',label:'Narzedzia z miasta',cost:{gold:40},cargo:{tools:20}},
 export:{name:'Sprzedaz plonow',label:'Sprzedaz plonow',cost:{grain:70},cargo:{gold:45}}
} as const;
export type CityOrder=keyof typeof cityOrders;
export function neighborOffer(w:World,id:string,kind:'trade'|'aid'|'contract'){
 const cargo:Partial<Record<Resource,number>>=id==='dwor'?{grain:85}:id==='mlyn'?{wood:75}:{bread:45};
 const cost:Partial<Record<Resource,number>>=kind==='aid'?{grain:25}:kind==='contract'?{}:id==='dwor'?{wood:40}:id==='mlyn'?{grain:45}:{gold:25};
 if(kind==='trade'){const discount=(treatyActive(w,id,'trade')?.8:1)*(mandate(w,'commerce')?.85:1);for(const k of Object.keys(cost) as Resource[])cost[k]=Math.ceil(cost[k]!*discount)}
 return {cost,cargo:kind==='aid'?{}:kind==='contract'?{grain:100,gold:30}:cargo};
}
export function sendConvoy(w:World,id:string,kind:'trade'|'aid'|'contract',unitId?:string,cityOrder:CityOrder='food'){
 const site=tradeSites.find(n=>n.id===id),r=w.regime;
 if(!site||w.outcome||!['trade','aid','contract'].includes(kind)||id==='city'&&(kind!=='trade'||!cityOrders[cityOrder]))return false;
 if(r.convoys.some(c=>c.neighbor===id)){w.notify('Jedna karawana jest juz na tym szlaku.');return false}
 if(kind==='trade'&&r.relations[id]<.2){w.notify('Embargo. Wyslij pomoc, by odbudowac relacje.');return false}
 const person=w.living.find(a=>a.id===unitId&&!['pig','dog'].includes(a.species));
 if(kind==='contract'&&(id!=='dwor'||!person)){w.notify('Kontrakt wymaga wskazania pracownika.');return false}
 const offer=id==='city'?cityOrders[cityOrder]:neighborOffer(w,id,kind),cost=offer.cost,cargo={...offer.cargo},barn=w.buildings.find(b=>b.kind==='barn'&&b.progress>=1);
 if(!barn||!w.canPay(cost)){w.notify('Brak zapasow na wysylke.');return false}
 const home={x:barn.x,y:barn.y+75},out=w.navigation.route(home,site.entry),back=w.navigation.route(site.entry,home);
 if(!out||!back){w.notify('Szlak nieprzejezdny.');return false}
 if(id!=='city'&&!reserveStock(w,id,cargo)){w.notify('Sasiad nie ma wystarczajacych zapasow.');return false}
 w.pay(cost);
 if(kind==='contract'&&person){
  w.order([person.id],'idle');person.health=0;r.sold.push(person.id);r.integrity=clamp(r.integrity-.35);r.trust=clamp(r.trust-.25);r.relations.mlyn=clamp(r.relations.mlyn-.25);
  w.log(person.name+' zostal oddany ludziom za obietnice zapasow. Nie wroci.');bulletin(w,r.press==='censored'?'Wyslano zasluzonego pracownika na leczenie.':person.name+' opuscil folwark na mocy kontraktu rady.');
 }
 r.convoys.push({id:w.nextId++,neighbor:id,kind,path:out,...home,cargo,payment:{...cost},waitUntil:0,state:'travel',leg:'outbound'});
 w.log('Wyruszyla karawana do '+site.name+'.');return true;
}
export function validRegime(raw:unknown):raw is RegimeState{
 const r=raw as RegimeState,finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n),unit=(n:unknown)=>finite(n)&&(n as number)>=0&&(n as number)<=1;
 const point=(p:Point)=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.x<=3600&&p.y>=0&&p.y<=2400;
 if(!r||![r.trust,r.integrity,r.heat].every(unit)||!['off','normal','high'].includes(r.heating)||!['free','censored'].includes(r.press)||typeof r.insulated!=='boolean'||![r.lies,r.nextEdict,r.forcedUntil,r.revealDay].every(n=>finite(n)&&n>=0))return false;
 if(!r.relations||neighborSites.some(n=>!unit(r.relations[n.id]))||!Array.isArray(r.convoys)||r.convoys.length>4||!Array.isArray(r.official)||r.official.some(e=>!e||!finite(e.day)||typeof e.text!=='string'))return false;
 if(![r.deaths,r.sold].every(a=>Array.isArray(a)&&a.every(id=>typeof id==='string')&&new Set(a).size===a.length))return false;
 if(new Set(r.convoys.map(c=>c?.id)).size!==r.convoys.length||new Set(r.convoys.map(c=>c?.neighbor)).size!==r.convoys.length)return false;
 return !r.convoys.some(c=>!c||!Number.isInteger(c.id)||!tradeSites.some(n=>n.id===c.neighbor)||!['trade','aid','contract'].includes(c.kind)||!point(c)||!Array.isArray(c.path)||c.path.some(p=>!point(p))||!['travel','unload','abroad'].includes(c.state)||c.state==='abroad'&&(c.neighbor!=='city'||!finite(c.waitUntil))||c.waitUntil!==undefined&&(!finite(c.waitUntil)||c.waitUntil<0)||c.payment!==undefined&&(!c.payment||Object.entries(c.payment).some(([k,n])=>!['grain','wood','stone','gold','flour','bread','tools','knowledge'].includes(k)||!finite(n)||(n as number)<0))||!['outbound','return'].includes(c.leg)||!c.cargo||Object.entries(c.cargo).some(([k,n])=>!['grain','wood','stone','gold','flour','bread','tools','knowledge'].includes(k)||!finite(n)||(n as number)<0));
}
