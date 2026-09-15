import {createRegion,tickRegion,validRegion,type RegionState} from './Region';
import { createRegime, tickRegime, dailyRegime, validRegime, type RegimeState } from './Regime';
import { Navigation, type Point } from './Navigation';
import { WORLD_WIDTH, WORLD_HEIGHT, decorations, inPond, nearRoad, fenceObstacles, neighborObstacles } from './Landscape';
import { defaultLaws, recipes, technologies, roadCost, resourceNames, type Laws, type Road, type RoadKind, type Technology } from './Development';
import { createAnimal, type AnimalState, type AnimalTask, type Species } from './Animal';
import { createEconomy, harvestToInventory, eatFromStore, rest } from './Economy';
import { createPolitics, applyPoliticalPressure, updateUnrest, shouldRefuseWork, shouldProtest, rationCost } from './Politics';

export const WIDTH = WORLD_WIDTH, HEIGHT = WORLD_HEIGHT, DAY_SECONDS = 65;
export type Resource = 'grain' | 'wood' | 'stone' | 'gold' | 'flour' | 'bread' | 'tools' | 'knowledge';
export type BuildingKind = 'house'|'barn'|'field'|'garden'|'granary'|'well'|'infirmary'|'mill'|'tower'|'lumber'|'quarry'|'stage'|'bakery'|'smith'|'school'|'library'|'bees'|'orchard'|'market';
export type Job = 'harvest'|'wood'|'stone'|'patrol'|'build'|'produce'|'guard'|null;
export type Building = {id:number; kind:BuildingKind; x:number; y:number; progress:number; stock:number; priority:number; enabled:boolean; production:number; batches:number; level:number};
export type Resident = AnimalState & {job:Job; target:number|null; path:{x:number;y:number}[]; arrival:AnimalTask; resource:Resource; load:number; destination:Point|null; activityTarget:number|null; heading:number; travel:number; wait:number; patrolStep:number; queue:Point[]; patrolCenter:Point|null; autoBuilder:boolean};
export type Chronicle = {day:number; text:string};
export type Choice = {label:string; effect:Partial<Record<Resource,number>>; calm?:number;trust?:number;fear?:number;integrity?:number};
export type Dilemma = {title:string; text:string; choices:Choice[]};
type Save = {version:5; region:RegionState; regime:RegimeState; roads:Road[]; laws:Laws; research:Technology[]; scenario:'campaign'|'sandbox'|'survival'; accumulator:number; time:number; economy:ReturnType<typeof createEconomy>; resources:Record<Exclude<Resource,'grain'>,number>; politics:ReturnType<typeof createPolitics>; units:Resident[]; buildings:Building[]; journal:Chronicle[]; built:number; nextId:number; event:Dilemma|null; outcome:string|null};
export const buildingDefs: Record<BuildingKind,{name:string; art:string; width:number; cost:Partial<Record<Resource,number>>; description:string}> = {
  house:{name:'Dom mieszkalny',art:'house',width:220,cost:{wood:70,stone:25},description:'+4 miejsca dla mieszkancow'},
  barn:{name:'Stodola',art:'barn',width:245,cost:{wood:80,stone:30},description:'Magazyn i punkt rozladunku'},
  field:{name:'Pole pszenicy',art:'field',width:260,cost:{wood:35,grain:15},description:'Odnawialne zboze. Wymaga pracownika.'},
  garden:{name:'Ogrod warzywny',art:'garden',width:215,cost:{wood:40,grain:20},description:'Szybsze zbiory i posilki'},
  granary:{name:'Spichlerz',art:'granary',width:140,cost:{wood:60,stone:20},description:'+300 pojemnosci magazynu'},
  well:{name:'Studnia',art:'well',width:90,cost:{wood:25,stone:30},description:'Ogranicza narastanie glodu'},
  infirmary:{name:'Lecznica',art:'infirmary',width:195,cost:{wood:55,stone:25,gold:20},description:'Leczy wszystkich mieszkancow'},
  mill:{name:'Wiatrak',art:'mill',width:175,cost:{wood:90,stone:50},description:'5 zboza -> 4 maki. Wymaga pracownika.'},
  tower:{name:'Straznica',art:'tower',width:95,cost:{wood:45,stone:20},description:'Patrole uspokajaja nastroje'},
  lumber:{name:'Sklad drewna',art:'logs',width:100,cost:{wood:25},description:'Drewno z okolicznego lasu'},
  quarry:{name:'Kamieniolom',art:'rocks',width:125,cost:{wood:35},description:'Kamien do rozbudowy folwarku'},
  bakery:{name:'Piekarnia',art:'bakery',width:195,cost:{wood:65,stone:35},description:'4 maki + 1 drewna -> 6 chleba'},
  smith:{name:'Kuznia',art:'smith',width:195,cost:{wood:60,stone:45,gold:15},description:'3 drewna + 2 kamienia -> 2 narzedzia'},
  school:{name:'Szkola',art:'school',width:175,cost:{wood:65,stone:25,gold:10},description:'2 zboza -> 3 wiedzy'},
  library:{name:'Biblioteka',art:'library',width:180,cost:{wood:70,stone:30,tools:6},description:'Odblokowuje badania wspolnoty'},
  bees:{name:'Pasieka',art:'bees',width:160,cost:{wood:45,gold:10},description:'Miod zasila zapasy posilkow: +2 chleba na cykl'},
  orchard:{name:'Sad',art:'apple',width:150,cost:{wood:30,grain:20},description:'Owoce zasila zapasy zywnosci'},
  market:{name:'Targ',art:'market',width:185,cost:{wood:55,gold:15},description:'Korzystniejsze ceny handlu'},
  stage:{name:'Plac zgromadzen',art:'stage',width:180,cost:{wood:50,gold:10},description:'Miejsce spotkan i protestow'},
};
export const buildableKinds:BuildingKind[]=(Object.keys(buildingDefs) as BuildingKind[]).filter(k=>k!=='lumber'&&k!=='quarry');
export const speciesNames:Record<Species,string> = {pig:'Zarzadca',dog:'Straznik',horse:'Kon roboczy',cow:'Krowa',sheep:'Owca',hen:'Kura',goat:'Zielarka',ram:'Baran',boar:'Dzik',cat:'Zwiadowca',raven:'Poslaniec',donkey:'Mysliciel',mule:'Budowniczy',duck:'Kurier',goose:'Herold'};
export const taskNames:Record<AnimalTask,string> = {idle:'Oczekuje',moving:'W drodze',harvest:'Zbiera plony',hauling:'Transportuje',eating:'Posilek',resting:'Odpoczywa',refusing:'Odmawia pracy',protesting:'Protestuje',wood:'Zbiera drewno',stone:'Wydobywa kamien',patrol:'Patroluje',deposit:'Rozladowuje',build:'Buduje',produce:'Wytwarza',guard:'Pilnuje'};
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
export class World {
  time=0;speed=1;paused=false;economy=createEconomy();resources={wood:180,stone:120,gold:80,flour:0,bread:12,tools:0,knowledge:0};politics=createPolitics();
  units:Resident[]=[];buildings:Building[]=[];journal:Chronicle[]=[];built=0;nextId=100;event:Dilemma|null=null;outcome:string|null=null;
  toast='';toastSerial=0;revision=0;readonly navigation=new Navigation();private accumulator=0;
  regime=createRegime();region=createRegion();
  roads:Road[]=[];laws=defaultLaws();research:Technology[]=[];roadRevision=0;
  constructor(public scenario:'campaign'|'sandbox'|'survival'='campaign'){
    this.economy.grain=155;
    const layout:[BuildingKind,number,number][]=[['barn',825,395],['house',1100,445],['field',430,385],['field',565,520],['garden',1020,675],['well',790,720],['lumber',1250,870],['quarry',1460,655],['stage',1050,970],['lumber',2400,1460],['quarry',3020,1720],['orchard',1170,1860]];
    this.buildings=layout.map(([kind,x,y],id)=>({id,kind,x,y,stock:['lumber','quarry'].includes(kind)?900:180,progress:1,priority:0,enabled:true,production:0,batches:0,level:1}));
    this.rebuildGrid();
    const people:[string,Species,number,number,Job][]=[
      ['Bokser','horse',610,430,'harvest'],['Koniczyna','horse',670,540,'harvest'],
      ['Napoleon','pig',1060,530,null],['Azor','dog',1180,575,'patrol'],
      ['Malina','cow',965,730,'harvest'],['Biala','sheep',1160,820,'wood'],
      ['Chmurka','sheep',1310,715,'stone'],['Ruda','hen',900,680,'harvest'],
      ['Iskra','hen',960,780,'harvest'],['Ruta','goat',900,590,null],
      ['Benjamin','donkey',1150,680,'wood'],['Kruk','raven',750,630,null],
    ];
    for(const[name,species,x,y,job]of people){const a=this.addUnit(name,species,x,y);if(job)this.assign([a.id],job)}
    this.log('Pierwszy dzien wolnego folwarku. Zapasy na zime sa wspolna sprawa.');
  }
  get day(){return Math.floor((this.time+1e-7)/DAY_SECONDS)+1}
  get season(){if(this.scenario==='survival')return this.day>=7?'Zima':'Jesien';return ['Jesien','Zima','Wiosna','Lato'][Math.floor((this.day-1)/7)%4]}
  get workRate(){return ({rested:.8,balanced:1,intensive:1.3})[this.laws.work]*(this.time<this.regime.forcedUntil?1.35:1)}
  get workFatigue(){return ({rested:.65,balanced:1,intensive:1.5})[this.laws.work]*(this.time<this.regime.forcedUntil?1.6:1)}
  get capacity(){return 450+this.count('granary')*300+Math.max(0,this.count('barn')-1)*150}
  storageLimit(resource:Resource){return resource==='gold'||resource==='knowledge'?Infinity:resource==='wood'||resource==='stone'?this.capacity*2:this.capacity}
  get populationCap(){return 8+this.count('house')*4}
  get living(){return this.units.filter(a=>a.health>0)}
  count(kind:BuildingKind){return this.buildings.filter(b=>b.kind===kind&&b.progress>=1&&b.enabled).length}
  get(resource:Resource){return resource==='grain'?this.economy.grain:this.resources[resource]}
  set(resource:Resource,value:number){if(resource==='grain')this.economy.grain=value;else this.resources[resource]=value}
  canPay(cost:Partial<Record<Resource,number>>){return Object.entries(cost).every(([k,v])=>this.get(k as Resource)>=v)}
  pay(cost:Partial<Record<Resource,number>>){for(const[k,v]of Object.entries(cost))this.set(k as Resource,this.get(k as Resource)-v)}
  notify(text:string){this.toast=text;this.toastSerial++}
  log(text:string){this.journal.unshift({day:this.day,text});this.journal=this.journal.slice(0,60);this.notify(text)}
  addUnit(name:string,species:Species,x:number,y:number){
    const point=this.navigation.nearestFree({x,y})??{x:805,y:550};
    const a:Resident={...createAnimal({id:'unit-'+this.nextId++,name,species,...point,strength:species==='horse'?.95:.65,carryCapacity:species==='horse'?18:10}),job:null,target:null,path:[],arrival:'idle',resource:'grain',load:0,destination:null,activityTarget:null,heading:0,travel:0,wait:0,patrolStep:0,queue:[],patrolCenter:null,autoBuilder:true};
    if(this.research.includes('logistics'))a.carryCapacity+=8;
    this.units.push(a);this.revision++;return a;
  }
  recruit(species:Species='horse'){
    if(this.living.length>=this.populationCap){this.notify('Brak miejsc. Zbuduj dom mieszkalny.');return false}
    if(!this.canPay({grain:35,gold:15})){this.notify('Potrzeba 35 zboza i 15 monet.');return false}
    this.pay({grain:35,gold:15});const names=['Brzask','Figa','Dabek','Zefir','Kasztan','Mila'];
    this.addUnit(names[this.nextId%names.length],species,1080,570);this.log('Nowy mieszkaniec dolacza do folwarku.');return true;
  }
  footprint(b:Pick<Building,'kind'|'x'|'y'>){
    const width=buildingDefs[b.kind].width;
    return {x:b.x,y:b.y-25,rx:width*.38,ry:width*.16};
  }
  blocked(x:number,y:number){return x<45||y<95||x>WIDTH-50||y>HEIGHT-40||inPond(x,y,12)}
  canBuild(kind:BuildingKind,x:number,y:number){
    if(!buildableKinds.includes(kind))return false;
    const rx=buildingDefs[kind].width*.47,ry=buildingDefs[kind].width*.22;
    const artHeight=buildingDefs[kind].width*(['field','garden'].includes(kind)?.65:kind==='tower'?2:1.3);
    if(y-artHeight<30)return false;
    if([...fenceObstacles,...neighborObstacles].some(o=>Math.hypot((x-o.x)/(rx+o.rx),(y-25-o.y)/(ry+o.ry))<1.1))return false;
    if(nearRoad(x,y-25,undefined,rx*.65)||this.roads.some(r=>nearRoad(x,y-25,[r.points],rx*.8)))return false;
    if(!Number.isFinite(x)||!Number.isFinite(y)||this.blocked(x-rx,y-ry)||this.blocked(x+rx,y)||this.blocked(x,y-ry*2))return false;
    if(this.buildings.some(b=>Math.hypot((b.x-x)/(rx+buildingDefs[b.kind].width*.47),(b.y-y)/(ry+buildingDefs[b.kind].width*.22))<1.2))return false;
    if(decorations.some(d=>d.radius&&Math.hypot((d.x-x)/(rx+d.radius),(d.y-y)/(ry+d.radius*.6))<1.1))return false;
    return ![...this.living,...this.regime.convoys].some(a=>Math.abs(a.x-x)<rx&&a.y>y-ry*2&&a.y<y+12);
  }
  build(kind:BuildingKind,x:number,y:number){
    if(this.outcome)return false;
    if(!this.canBuild(kind,x,y)){this.notify('Za malo miejsca na budynek.');return false}
    if(!this.canPay(buildingDefs[kind].cost)){this.notify('Za malo surowcow.');return false}
    this.pay(buildingDefs[kind].cost);this.buildings.push({id:this.nextId++,kind,x,y,progress:0,stock:['lumber','quarry'].includes(kind)?600:140,priority:this.nextId,enabled:true,production:0,batches:0,level:1});this.revision++;
    this.rebuildGrid();
    for(const a of this.living)if(a.destination&&a.path.length)this.walk(a,a.destination.x,a.destination.y,a.arrival);
    this.dispatchBuilders();
    this.log('Rozpoczeto budowe: '+buildingDefs[kind].name+'.');return true;
  }
  nearest(kind:BuildingKind,a:Point){
    return this.buildings.filter(b=>b.kind===kind&&b.progress>=1).sort((b,c)=>Math.hypot(b.x-a.x,b.y-a.y)-Math.hypot(c.x-a.x,c.y-a.y))[0];
  }
  rebuildGrid(){
    this.navigation.rebuild(this.buildings.filter(b=>!['field','garden','orchard','lumber','quarry','stage'].includes(b.kind)).map(b=>this.footprint(b)),this.roads);
  }
  private walk(a:Resident,x:number,y:number,arrival:AnimalTask){
    const route=this.navigation.route(a,{x,y});
    if(!route){a.path=[];a.task='idle';a.wait=3;a.destination=null;return false}
    a.path=route;a.destination=route.at(-1)??null;a.arrival=arrival;
    a.task=a.path.length?(a.carriedGrain+a.load>0?'hauling':'moving'):arrival;
    return true;
  }
  private slot(a:Resident,b:Building,work=false):Point {
    const i=this.units.indexOf(a);
    if(work&&['field','garden','orchard'].includes(b.kind))return {x:b.x+(i%3-1)*35,y:b.y-25-Math.floor(i%6/3)*25};
    return {x:b.x+((i%5)-2)*25,y:b.y+27+Math.floor(i%10/5)*25};
  }
  private go(a:Resident,kind:BuildingKind,task:AnimalTask){
    if(!a.job&&a.destination&&a.arrival==='idle'&&['eating','resting'].includes(task))a.queue.unshift({...a.destination});
    const b=this.nearest(kind,a);if(!b){a.task='idle';a.wait=3;return}
    const p=this.slot(a,b);a.activityTarget=b.id;this.walk(a,p.x,p.y,task);
  }
  move(ids:string[],x:number,y:number,append=false){
    ids.forEach((id,i)=>{const a=this.living.find(u=>u.id===id);if(!a)return;
      const point={x:x+(i%3)*32,y:y+Math.floor(i/3)*30};
      if(append&&a.path.length){if(a.queue.length<16)a.queue.push(point);return}
      a.queue=[];a.autoBuilder=false;a.job=null;a.target=null;a.wait=0;this.walk(a,point.x,point.y,'idle');
    });
  }
  assign(ids:string[],job:Exclude<Job,null>,target?:number){
    for(const a of this.living.filter(a=>ids.includes(a.id))){
      a.queue=[];a.autoBuilder=false;a.job=job;a.target=target??null;a.wait=0;a.path=[];
      if(shouldRefuseWork(a)&&job!=='patrol'){a.task='refusing';continue}
      if(a.carriedGrain+a.load>0){this.go(a,'barn','deposit');continue}
      this.sendToJob(a);
    }
  }
  private sendToJob(a:Resident){
    a.path=[];a.destination=null;
    if(!a.job){a.task='idle';return}
    if(a.job==='build'&&!this.buildings.some(b=>b.progress<1&&b.enabled)){a.job=null;a.task='idle';return}
    if(a.carriedGrain+a.load>0){if(a.carriedGrain>0&&this.economy.grain>=this.capacity-.01||a.load>0&&this.get(a.resource)>=this.storageLimit(a.resource)-.01){a.task='idle';a.wait=4;return}this.go(a,'barn','deposit');return}
    if(a.job==='guard'&&a.patrolCenter){this.walk(a,a.patrolCenter.x,a.patrolCenter.y,'guard');return}
    const eligible=(b:Building)=>a.job==='build'?b.progress<1&&b.enabled:b.progress>=1&&b.enabled&&(a.job==='harvest'?['field','garden','orchard'].includes(b.kind):a.job==='wood'?b.kind==='lumber'&&b.stock>1e-8:a.job==='stone'?b.kind==='quarry'&&b.stock>1e-8:a.job==='produce'?!!recipes[b.kind]:['house','tower'].includes(b.kind));
    let b=this.buildings.find(b=>b.id===a.target&&eligible(b));
    if(!b){
      b=this.buildings.filter(eligible).sort((b,c)=>{
        const score=(b:Building)=>(a.job==='build'?b.priority*10000:0)+Math.hypot(b.x-a.x,b.y-a.y)+this.units.filter(u=>u.id!==a.id&&u.job===a.job&&u.target===b.id).length*110;
        return score(b)-score(c);
      })[0];
    }
    if(!b){a.task='idle';a.wait=5;return}
    a.target=b.id;a.activityTarget=b.id;
    if(a.job==='patrol'){
      const step=a.patrolStep%4;
      const center=a.patrolCenter??b;
      const points=[{x:center.x-135,y:center.y+95},{x:center.x+130,y:center.y+100},{x:center.x+175,y:center.y-50},{x:center.x-150,y:center.y-60}];
      const p=points[step];this.walk(a,p.x,p.y,'patrol');return;
    }
    const p=this.slot(a,b,true);this.walk(a,p.x,p.y,a.job);
  }
  private depositCargo(a:Resident){
    const b=this.buildings.find(b=>b.id===a.activityTarget);
    if(!b||b.kind!=='barn'||Math.hypot(a.x-b.x,a.y-b.y)>150){this.go(a,'barn','deposit');return false}
    const delivered=Math.min(a.carriedGrain,Math.max(0,this.capacity-this.economy.grain));
    this.economy.grain+=delivered;a.carriedGrain-=delivered;
    if(a.resource!=='grain'){const amount=Math.min(a.load,Math.max(0,this.storageLimit(a.resource)-this.get(a.resource)));this.resources[a.resource]+=amount;a.load-=amount}
    return true;
  }
  order(ids:string[],task:'resting'|'eating'|'idle'){
    for(const a of this.living.filter(a=>ids.includes(a.id))){
      a.autoBuilder=false;a.queue=[];a.job=null;a.target=null;a.path=[];a.destination=null;a.wait=0;
      if(task==='idle')a.task='idle';else this.go(a,task==='eating'?'barn':'house',task);
    }
  }
  roadPlan(kind:RoadKind,start:Point,end:Point){
    const length=Math.hypot(end.x-start.x,end.y-start.y),cost=roadCost(kind,length);
    if(!Number.isFinite(length)||length<24||length>700)return {valid:false,cost,reason:'Odcinek drogi: od 24 do 700 krokow.'};
    let covered=true;
    for(let i=0,n=Math.ceil(length/8);i<=n;i++){
      const p={x:start.x+(end.x-start.x)*i/n,y:start.y+(end.y-start.y)*i/n};
      if(!this.navigation.clearPoint(p,21)||this.buildings.some(b=>{const f=this.footprint(b);return Math.hypot((p.x-f.x)/(f.rx+16),(p.y-f.y)/(f.ry+16))<1}))return {valid:false,cost,reason:'Trasa przecina wode, budynek albo przeszkode.'};
      if(!this.roads.some(r=>r.kind===kind&&nearRoad(p.x,p.y,[r.points],14)))covered=false;
    }
    if(covered)return {valid:false,cost,reason:'Ta droga juz istnieje.'};
    return {valid:this.canPay(cost)&&!this.outcome,cost,reason:this.canPay(cost)?'Gotowe do budowy':'Za malo surowcow.'};
  }
  buildRoad(kind:RoadKind,start:Point,end:Point){
    const plan=this.roadPlan(kind,start,end);if(!plan.valid){this.notify(plan.reason);return false}
    this.pay(plan.cost);this.roads.push({id:this.nextId++,kind,points:[[start.x,start.y],[end.x,end.y]],cost:plan.cost});
    this.roadRevision++;this.rebuildGrid();this.replan();this.notify('Ukonczono droge. Transport przyspiesza.');return true;
  }
  removeRoad(id:number){
    const road=this.roads.find(r=>r.id===id);if(!road)return false;
    this.roads=this.roads.filter(r=>r.id!==id);for(const[k,v]of Object.entries(road.cost))this.set(k as Resource,this.get(k as Resource)+Math.floor(v*.25));
    this.roadRevision++;this.rebuildGrid();this.replan();return true;
  }
  private replan(){for(const a of this.living)if(a.destination&&a.path.length)this.walk(a,a.destination.x,a.destination.y,a.arrival)}
  private dispatchBuilders(){
    const site=this.buildings.filter(b=>b.progress<1&&b.enabled).sort((a,b)=>a.priority-b.priority)[0];if(!site)return;
    const current=this.living.filter(a=>a.job==='build');
    const free=this.living.filter(a=>a.autoBuilder&&!a.job&&a.task==='idle'&&!a.path.length).sort((a,b)=>Math.hypot(a.x-site.x,a.y-site.y)-Math.hypot(b.x-site.x,b.y-site.y));
    for(const a of free.slice(0,Math.max(0,2-current.length))){this.assign([a.id],'build',site.id);a.autoBuilder=true}
  }
  staffBuilding(id:number){
    const b=this.buildings.find(b=>b.id===id);if(!b)return false;
    const job:Job=b.progress<1?'build':recipes[b.kind]?'produce':['field','garden','orchard'].includes(b.kind)?'harvest':b.kind==='lumber'?'wood':b.kind==='quarry'?'stone':null;
    if(!job)return false;
    const workers=this.living.filter(a=>a.target===id&&a.job===job);
    if(workers.length>=3){this.notify('Przy tym stanowisku pracuje juz trzech mieszkancow.');return false}
    const a=this.living.filter(a=>!workers.includes(a)&&a.job!=='build').sort((a,c)=>(a.job?10000:0)+Math.hypot(a.x-b.x,a.y-b.y)-((c.job?10000:0)+Math.hypot(c.x-b.x,c.y-b.y)))[0];
    if(!a){this.notify('Brak dostepnych pracownikow.');return false}this.assign([a.id],job,id);return true;
  }
  releaseBuilding(id:number){this.order(this.living.filter(a=>a.target===id).map(a=>a.id),'idle')}
  cancelBuild(id:number){
    const b=this.buildings.find(b=>b.id===id&&b.progress<1);if(!b)return false;
    for(const[k,v]of Object.entries(buildingDefs[b.kind].cost))this.set(k as Resource,this.get(k as Resource)+Math.floor(v*(1-b.progress)*.8));
    this.releaseBuilding(id);this.buildings=this.buildings.filter(b=>b.id!==id);this.revision++;this.rebuildGrid();this.replan();this.dispatchBuilders();this.notify('Budowa anulowana. Odzyskano czesc niewykorzystanych materialow.');return true;
  }
  prioritize(id:number){const b=this.buildings.find(b=>b.id===id&&b.progress<1);if(!b)return;b.priority=Math.min(...this.buildings.map(b=>b.priority))-1;for(const a of this.living.filter(a=>a.job==='build')){this.assign([a.id],'build',id);a.autoBuilder=true}this.revision++}
  toggleBuilding(id:number){const b=this.buildings.find(b=>b.id===id);if(!b)return;b.enabled=!b.enabled;if(!b.enabled)this.releaseBuilding(id);this.revision++;this.dispatchBuilders()}
  upgrade(id:number){
    const b=this.buildings.find(b=>b.id===id&&b.progress>=1);if(!b||b.level>=3||!recipes[b.kind]&&!['field','garden','orchard'].includes(b.kind))return false;
    const cost={wood:25*b.level,stone:15*b.level,tools:2*b.level};if(!this.canPay(cost)){this.notify('Ulepszenie wymaga drewna, kamienia i narzedzi.');return false}
    this.pay(cost);b.level++;this.revision++;this.notify('Ulepszono budynek do poziomu '+b.level+'.');return true;
  }
  setLaw<K extends keyof Laws>(law:K,value:Laws[K]){
    const choices={work:['rested','balanced','intensive'],tax:['low','normal','high'],food:['saving','normal','generous'],forest:['sustainable','intensive']};
    if(!choices[law].includes(value))return;
    this.laws[law]=value;this.log('Rada zmienila zasady gospodarowania.');
  }
  researchTech(key:Technology){
    const tech=technologies[key];if(!tech||this.research.includes(key)||!this.count('library'))return false;
    if(!this.canPay(tech.cost)){this.notify('Brak zasobow na badania.');return false}
    this.pay(tech.cost);this.research.push(key);if(key==='logistics')for(const a of this.units)a.carryCapacity+=8;
    this.log('Ukonczono badania: '+tech.name+'.');return true;
  }
  command(ids:string[],kind:'patrol'|'guard'|'unload'|'build',point?:Point){
    if(kind==='build'){const b=this.buildings.filter(b=>b.progress<1&&b.enabled).sort((a,b)=>a.priority-b.priority)[0];if(b)this.assign(ids,'build',b.id);else this.notify('Nie ma aktywnej budowy.');return}
    for(const a of this.living.filter(a=>ids.includes(a.id))){
      if(kind==='unload'){a.queue=[];a.job=null;this.go(a,'barn','deposit')}
      else{a.patrolCenter=point??{x:a.x,y:a.y};this.assign([a.id],kind)}
    }
  }
  tradeQuote(resource:Resource){
    const prices:Record<Resource,number>={grain:15,wood:18,stone:22,gold:0,flour:23,bread:30,tools:38,knowledge:0};
    return {amount:resource==='tools'?10:40,buy:Math.ceil(prices[resource]*(this.count('market')?.85:1)),sell:Math.floor(prices[resource]*(this.count('market')?.75:.6))};
  }
  tradeResource(resource:Resource,buy:boolean){
    if(resource==='knowledge'||resource==='gold')return false;
    const quote=this.tradeQuote(resource),amount=quote.amount,cost=buy?{gold:quote.buy}:{[resource]:amount};
    if(!this.canPay(cost)||buy&&this.get(resource)+amount>this.storageLimit(resource)){this.notify('Za malo zasobow lub miejsca w magazynie.');return false}
    this.pay(cost);this.set(buy?resource:'gold',this.get(buy?resource:'gold')+(buy?amount:quote.sell));this.notify((buy?'Kupiono: ':'Sprzedano: ')+resourceNames[resource]);return true;
  }
  productionState(b:Building){
    if(!b.enabled)return 'Wstrzymano';
    const workers=this.living.filter(a=>a.target===b.id&&a.job===(b.progress<1?'build':'produce'));
    if(!workers.length)return 'Brak pracownikow';
    if(!workers.some(a=>!a.path.length&&['build','produce'].includes(a.task)))return 'Pracownicy w drodze / odpoczywaja';
    const recipe=recipes[b.kind];
    if(b.progress>=1&&recipe){if(!this.canPay(recipe.input))return 'Brak skladnikow';if(Object.entries(recipe.output).some(([k,v])=>this.get(k as Resource)+v>this.storageLimit(k as Resource)))return 'Magazyn pelny'}
    return b.progress<1?'Trwa budowa':'Produkcja';
  }
  setPolicy(policy:'equal'|'privileged'){
    if(this.politics.rationPolicy===policy)return;
    this.politics.rationPolicy=policy;this.log(policy==='equal'?'Rada przyjela rowne racje dla wszystkich.':'Rada przyznala wieksze racje swiniom i psom.');
  }
  feast(){
    if(!this.canPay({grain:40})){this.notify('Wspolny posilek kosztuje 40 zboza.');return false}
    this.pay({grain:40});for(const a of this.living){a.hunger=clamp(a.hunger-.38);a.grievance=clamp(a.grievance-.18);a.loyalty=clamp(a.loyalty+.12)}
    this.log('Wspolny posilek przywrocil zaufanie mieszkancow.');return true;
  }
  trade(buy:boolean){
    if(buy&&this.economy.grain+50>this.capacity){this.notify('Potrzeba 50 wolnych miejsc w magazynie.');return false}
    const cost=buy?{gold:15}:{grain:40};
    if(!this.canPay(cost)){this.notify('Brak zasobow do wymiany.');return false}
    this.pay(cost);if(buy)this.economy.grain+=50;else this.resources.gold+=12;
    this.notify(buy?'Kupiono 50 zboza.':'Sprzedano 40 zboza.');return true;
  }
  choose(index:number){
    const c=this.event?.choices[index];if(!c)return;
    if(!Object.entries(c.effect).every(([k,v])=>v>=0||this.get(k as Resource)>=-v)){this.notify('Brak zasobow na ta decyzje.');return}
    for(const[k,v]of Object.entries(c.effect))this.set(k as Resource,Math.max(0,this.get(k as Resource)+v));
    for(const a of this.living)a.grievance=clamp(a.grievance-(c.calm??0));
    if(c.trust)this.regime.trust=clamp(this.regime.trust+c.trust);if(c.integrity)this.regime.integrity=clamp(this.regime.integrity+c.integrity);if(c.fear)for(const a of this.living)a.fear=clamp(a.fear+c.fear);
    this.log(c.label);this.event=null;this.economy.grain=Math.min(this.capacity,this.economy.grain);
  }
  tick(elapsed:number){
    if(this.paused||this.event||this.outcome||!Number.isFinite(elapsed)||elapsed<=0)return;
    this.accumulator+=Math.min(elapsed,.25)*this.speed;
    while(this.accumulator>=.05-1e-9&&!this.event&&!this.outcome){this.accumulator=Math.max(0,this.accumulator-.05);this.step(.05)}
  }
  private moveAlongPath(a:Resident,dt:number){
    let remaining=dt*(a.species==='raven'?86:57)*(1-a.fatigue*.22)*this.navigation.speedAt(a)*(this.research.includes('logistics')?1.1:1);
    while(remaining>0&&a.path.length){
      const p=a.path[0],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);
      if(d<.01){a.path.shift();continue}
      const amount=Math.min(remaining,d),nx=a.x+dx/d*amount,ny=a.y+dy/d*amount;
      if(!this.navigation.clearPoint({x:nx,y:ny},5)){if(a.destination)this.walk(a,a.destination.x,a.destination.y,a.arrival);return}
      a.x=nx;a.y=ny;a.heading=Math.atan2(dy,dx);a.travel+=amount;remaining-=amount;
      if(amount>=d-.001)a.path.shift();
    }
    // Gentle local separation prevents residents stacking at work and delivery slots.
    for(const other of this.living){
      if(other.id===a.id)continue;
      let dx=a.x-other.x,dy=(a.y-other.y)*1.35,d=Math.hypot(dx,dy);
      if(d>=19)continue;
      if(d<.01){dx=this.units.indexOf(a)%2?1:-1;dy=.5;d=1}
      const push=Math.min(1.5,(19-d)*dt*1.6),p={x:a.x+dx/d*push,y:a.y+dy/d*push/1.35};
      if(this.navigation.clearPoint(p,6)){a.x=p.x;a.y=p.y}
    }
    if(!a.path.length){a.task=a.arrival;a.destination=null;if(a.queue.length&&a.arrival==='idle'&&!a.job){const p=a.queue.shift()!;this.walk(a,p.x,p.y,'idle')}}
  }
  private step(dt:number){
    const previousDay=this.day;this.time+=dt;
    this.dispatchBuilders();
    for(const b of this.buildings){
      if(!b.enabled)continue;
      const workers=this.living.filter(a=>a.target===b.id&&!a.path.length&&a.task===(b.progress<1?'build':'produce')&&Math.hypot(a.x-b.x,a.y-b.y)<170);
      const effort=Math.min(2.5,workers.reduce((sum,a)=>sum+(a.species==='mule'?1.4:1)*(1-a.fatigue*.35),0))*this.workRate;
      if(b.progress<1&&effort>0){
        b.progress=Math.min(1,b.progress+dt*effort/(20+buildingDefs[b.kind].width*.04)*(this.research.includes('masonry')?1.3:1));
        if(b.progress>=1){this.built++;this.revision++;this.log('Ukonczono: '+buildingDefs[b.kind].name+'.');for(const a of workers){a.target=null;a.task='idle'}}
      }else if(b.progress>=1){
        if(['field','garden','orchard'].includes(b.kind)){
          const water=this.buildings.some(w=>w.kind==='well'&&w.progress>=1&&w.enabled&&Math.hypot(w.x-b.x,w.y-b.y)<280);
          const season=this.season==='Zima'?.2:this.season==='Wiosna'?1.3:1;
          b.stock=Math.min(200+(b.level-1)*80,b.stock+dt*.65*season*(water?1.4:1)*(this.research.includes('agronomy')?1.2:1));
        }
        if(b.kind==='lumber'&&this.laws.forest==='sustainable')b.stock=Math.min(900,b.stock+dt*.12);
        const recipe=recipes[b.kind];
        if(recipe&&effort>0&&this.canPay(recipe.input)&&Object.entries(recipe.output).every(([k,v])=>this.get(k as Resource)+v<=this.storageLimit(k as Resource))){
          b.production+=dt*effort*(1+(b.level-1)*.2);
          if(b.production>=recipe.seconds){this.pay(recipe.input);for(const[k,v]of Object.entries(recipe.output))this.set(k as Resource,this.get(k as Resource)+v);b.production-=recipe.seconds;b.batches++}
        }
      }
    }
    for(const a of this.living){
      a.hunger=clamp(a.hunger+dt*.0025/(1+this.count('well')*.15));
      applyPoliticalPressure(a,this.politics,dt);
      a.grievance=clamp(a.grievance+dt*(this.laws.tax==='high'?.0018:this.laws.tax==='low'?-.001:0));
      if(this.count('infirmary')&&(this.scenario!=='survival'||this.regime.heat>=.4&&this.economy.grain+this.resources.bread>0))a.health=clamp(a.health+dt*.006);
      if(a.health<=0){a.path=[];a.job=null;continue}
      a.wait=Math.max(0,a.wait-dt);
      const enRoute=a.path.length>0,activity=enRoute?a.arrival:a.task;
      if(a.hunger>.70&&(this.economy.grain>.1||this.resources.bread>.1||a.carriedGrain>.1)&&!['eating','deposit'].includes(activity)){
        this.go(a,'barn','eating');
      }else if(a.fatigue>.84&&!['eating','resting','deposit'].includes(activity)){
        this.go(a,'house','resting');
      }else if(shouldProtest(a,this.politics)&&!['eating','resting','protesting'].includes(activity)){
        this.go(a,'stage','protesting');
      }
      if(a.path.length){this.moveAlongPath(a,dt);continue}
      if(a.task==='deposit'){
        if(!this.depositCargo(a))continue;
        if(a.hunger>.45){a.task='eating';continue}
        if(a.fatigue>.7){this.go(a,'house','resting');continue}
        this.sendToJob(a);continue;
      }
      if(a.task==='eating'){
        if(!this.depositCargo(a))continue;
        const ration=rationCost(a,this.politics)*(this.laws.food==='saving'?.75:this.laws.food==='generous'?1.25:1);
        if(this.resources.bread>0){const meal=Math.min(this.resources.bread,dt*.65*ration);this.resources.bread-=meal;a.hunger=clamp(a.hunger-meal*.36)}else eatFromStore(a,this.economy,dt,ration);
        if(a.hunger<.2||this.economy.grain+this.resources.bread<.01){
          if(a.fatigue>.25)this.go(a,'house','resting');else{a.task='idle';a.wait=this.economy.grain<.01?5:0}
        }
        continue;
      }
      if(a.task==='resting'){
        rest(a,dt);if(a.fatigue<=.12){a.task='idle';a.wait=1}continue;
      }
      if(a.task==='protesting'||shouldRefuseWork(a)){
        a.task=shouldProtest(a,this.politics)?'protesting':'refusing';a.fatigue=clamp(a.fatigue-dt*.018);
        if(!shouldRefuseWork(a)&&!shouldProtest(a,this.politics)){a.task='idle';a.wait=1}
        continue;
      }
      if(a.task==='build'||a.task==='produce'){
        const b=this.buildings.find(b=>b.id===a.target);
        if(!b||!b.enabled||a.task==='build'&&b.progress>=1){a.task='idle';a.target=null;continue}
        if(Math.hypot(a.x-b.x,a.y-b.y)>170){this.sendToJob(a);continue}
        if(a.task==='build'||this.productionState(b)==='Produkcja')a.fatigue=clamp(a.fatigue+dt*.01*this.workFatigue);
        continue;
      }
      if(a.task==='harvest'||a.task==='wood'||a.task==='stone'){
        const b=this.buildings.find(b=>b.id===a.target);
        if(!b||!b.enabled||Math.hypot(a.x-b.x,a.y-b.y)>170){this.sendToJob(a);continue}
        if(a.task==='harvest'){
          if(this.economy.grain>=this.capacity&&a.carriedGrain<=.01){a.task='idle';a.wait=5;continue}
          this.economy.fieldGrain=b.stock;
          const fatigue=a.fatigue;
          const harvested=harvestToInventory(a,this.economy,dt,this.workRate*(this.research.includes('agronomy')?1.2:1)*(1+(b.level-1)*.2)*(b.kind==='garden'?1.2:1));
          a.fatigue=clamp(fatigue+(a.fatigue-fatigue)*this.workFatigue);
          b.stock=Math.max(0,b.stock-harvested);
          if(a.carriedGrain>=a.carryCapacity-.01||b.stock<1&&a.carriedGrain>0)this.go(a,'barn','deposit');
        }else{
          a.resource=a.task;const amount=Math.min(b.stock,a.carryCapacity-a.load,dt*(a.task==='wood'?1.35:1.05)*this.workRate*(a.task==='wood'&&this.laws.forest==='intensive'?1.4:1));a.load+=amount;b.stock-=amount;
          a.fatigue=clamp(a.fatigue+dt*.009*this.workFatigue);
          if(a.load>=a.carryCapacity-.001||b.stock<=1e-8&&a.load>0)this.go(a,'barn','deposit');
        }
      }else if(a.task==='guard'){
        for(const other of this.living)if(Math.hypot(other.x-a.x,other.y-a.y)<160)other.grievance=clamp(other.grievance-dt*.001);
      }else if(a.task==='patrol'){
        for(const other of this.living)if(Math.hypot(other.x-a.x,other.y-a.y)<220)other.grievance=clamp(other.grievance-dt*.001*(1+this.count('tower')));
        a.patrolStep++;a.task='idle';a.wait=2.5;
      }else{
        a.fatigue=clamp(a.fatigue-dt*.015);
        if(a.job&&a.wait<=0)this.sendToJob(a);
        else if(!a.job&&a.queue.length&&a.wait<=0){const p=a.queue.shift()!;this.walk(a,p.x,p.y,'idle')}
      }
    }
    tickRegime(this,dt);tickRegion(this,dt);
    this.resources.gold+=dt*({low:.045,normal:.08,high:.16})[this.laws.tax]*this.living.length/12;updateUnrest(this.living,this.politics);
    if(this.living.length<6||this.politics.unrest>.8){this.outcome=this.living.length<6?'Folwark opustoszal':'Rewolucja';this.event=null;this.log('Rada utracila kontrole nad folwarkiem.');return}
    if(this.day!==previousDay){
      if(this.scenario==='survival'){dailyRegime(this);return}
      this.log('Nastal dzien '+this.day+'. Zapasy: '+Math.floor(this.economy.grain)+' zboza.');
      if(this.day===3)this.event={title:'Kupiec przy bramie',text:'Wedrowny kupiec oferuje zapasy przed nadejsciem chlodow.',choices:[{label:'Kup zapasy: 20 monet za 80 zboza',effect:{gold:-20,grain:80}},{label:'Wymien drewno: 40 drewna za 55 zboza',effect:{wood:-40,grain:55}},{label:'Podziekuj kupcowi',effect:{}}]};
      if(this.day===5)this.event={title:'Glos ze stodoly',text:'Mieszkancy prosza o wspolny posilek. Ciezka praca powinna sluzyc wszystkim.',choices:[{label:'Wydaj 35 zboza na wspolny stol',effect:{grain:-35},calm:.25},{label:'Rozdaj 15 monet',effect:{gold:-15},calm:.12},{label:'Utrzymaj dotychczasowe racje',effect:{},calm:-.12}]};
      if(this.day===7)this.event={title:'Pierwszy przymrozek',text:'Nocny przymrozek nadchodzi od lasu. Zabezpieczenie stodoly ocali zapasy.',choices:[{label:'Ociepl stodole: 35 drewna',effect:{wood:-35}},{label:'Zatrudnij kupca: 20 monet',effect:{gold:-20}},{label:'Pogodz sie ze strata 55 zboza',effect:{grain:-Math.min(55,this.economy.grain)}}]};
      if(this.day===8&&this.scenario==='campaign'){this.event=null;this.outcome=this.economy.grain>=350&&this.built>=3&&this.politics.unrest<.35?'Wspolna przyszlosc':'Zima przyszla za wczesnie'}
    }
  }
  snapshot():Save{
    return JSON.parse(JSON.stringify({version:5,region:this.region,regime:this.regime,roads:this.roads,laws:this.laws,research:this.research,scenario:this.scenario,accumulator:this.accumulator,time:this.time,economy:this.economy,resources:this.resources,politics:this.politics,units:this.units,buildings:this.buildings,journal:this.journal,built:this.built,nextId:this.nextId,event:this.event,outcome:this.outcome}));
  }
  restore(raw:unknown){
    const s=raw as Save,finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
    if(!s||![1,2,3,4,5].includes(s.version)||!Array.isArray(s.units)||!s.units.length||!Array.isArray(s.buildings)||!s.economy||!s.resources||!s.politics||!finite(s.time)||!finite(s.nextId)||!finite(s.built)||!Array.isArray(s.journal))throw Error('Nieprawidlowy zapis gry.');
    if(s.units.some(a=>!a||!a.id||!Object.hasOwn(speciesNames,a.species)||!finite(a.x)||!finite(a.y)||!finite(a.health)||!finite(a.hunger)||!finite(a.fatigue)||!Array.isArray(a.path)||a.path.some(p=>!finite(p.x)||!finite(p.y))||!Object.keys(taskNames).includes(a.task)))throw Error('Uszkodzone dane mieszkancow.');
    if(s.buildings.some(b=>!b||!Object.hasOwn(buildingDefs,b.kind)||!finite(b.x)||!finite(b.y)||!finite(b.stock)||!finite(b.progress)))throw Error('Uszkodzone dane budynkow.');
    for(const k of ['grain','wood','stone','gold']as Resource[])if(!finite(k==='grain'?s.economy.grain:s.resources[k]))throw Error('Nieprawidlowe zasoby.');
    const text=(v:unknown,max=5000)=>typeof v==='string'&&v.length<=max;
    if(s.units.length>1000||s.buildings.length>3000||s.units.some(a=>!text(a.id,100)||!text(a.name,100)||['strength','health','hunger','fear','loyalty','grievance','courage','docility','ambition','voice','fatigue'].some(k=>!finite(a[k as keyof Resident])||(a[k as keyof Resident] as number)<0||(a[k as keyof Resident] as number)>1)||!finite(a.carryCapacity)||a.carryCapacity<=0||!finite(a.carriedGrain)||a.carriedGrain<0)||new Set(s.units.map(a=>a.id)).size!==s.units.length)throw Error('Nieprawidlowe statystyki mieszkancow.');
    if(s.journal.length>100||s.journal.some(e=>!e||!finite(e.day)||!text(e.text))||!['equal','privileged'].includes(s.politics.rationPolicy)||!finite(s.politics.unrest)||s.outcome!==null&&!text(s.outcome,200))throw Error('Nieprawidlowa kronika lub polityka.');
    if(s.event!==null&&(!s.event||!text(s.event.title,200)||!text(s.event.text)||!Array.isArray(s.event.choices)||s.event.choices.length<1||s.event.choices.length>10||s.event.choices.some(c=>!c||!text(c.label,500)||!c.effect||Object.entries(c.effect).some(([k,v])=>!Object.hasOwn(resourceNames,k)||!finite(v))||['trust','fear','integrity','calm'].some(k=>c[k as keyof Choice]!==undefined&&!finite(c[k as keyof Choice])))))throw Error('Nieprawidlowe wydarzenie.');
    const point=(p:Point)=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.y>=0&&p.x<=WIDTH&&p.y<=HEIGHT;
    const nonnegative=(v:unknown)=>finite(v)&&(v as number)>=0;
    if((s.version as number)>=3){
      if(!['campaign','sandbox','survival'].includes(s.scenario)||!s.laws||!['rested','balanced','intensive'].includes(s.laws.work)||!['low','normal','high'].includes(s.laws.tax)||!['saving','normal','generous'].includes(s.laws.food)||!['sustainable','intensive'].includes(s.laws.forest))throw Error('Nieprawidlowe prawa gospodarcze.');
      if(!Array.isArray(s.research)||s.research.some(k=>!Object.hasOwn(technologies,k))||new Set(s.research).size!==s.research.length)throw Error('Nieprawidlowe badania.');
      if(!Array.isArray(s.roads)||s.roads.length>5000||s.roads.some(r=>!r||!Number.isInteger(r.id)||!['dirt','stone'].includes(r.kind)||!Array.isArray(r.points)||r.points.length!==2||r.points.some(p=>!Array.isArray(p)||p.length!==2||!point({x:p[0],y:p[1]}))||!r.cost||Object.entries(r.cost).some(([k,v])=>!['wood','stone'].includes(k)||!nonnegative(v))))throw Error('Nieprawidlowe drogi.');
      if(s.buildings.some(b=>!point(b)||!nonnegative(b.stock)||b.progress<0||b.progress>1||!finite(b.priority)||!nonnegative(b.production)||!Number.isInteger(b.batches)||b.batches<0||![1,2,3].includes(b.level)||typeof b.enabled!=='boolean'))throw Error('Nieprawidlowa produkcja.');
      if(s.units.some(a=>!Array.isArray(a.queue)||a.queue.length>16||a.queue.some(p=>!point(p))||a.destination&&!point(a.destination)||a.patrolCenter&&!point(a.patrolCenter)))throw Error('Nieprawidlowa kolejka rozkazow.');
      for(const k of Object.keys(resourceNames) as Resource[])if(!nonnegative(k==='grain'?s.economy.grain:s.resources[k]))throw Error('Nieprawidlowe zapasy.');
      const ids=[...s.buildings.map(b=>b.id),...s.roads.map(r=>r.id)];
      if(new Set(ids).size!==ids.length||ids.some(id=>!Number.isInteger(id)||id<0||id>=s.nextId)||!nonnegative(s.time)||!nonnegative(s.accumulator)||s.accumulator>1)throw Error('Nieprawidlowy stan symulacji.');
    }
    if(s.version>=4&&(!validRegime(s.regime)||s.regime.convoys.some(c=>c.id<0||c.id>=s.nextId||s.buildings.some(b=>b.id===c.id)||s.roads.some(r=>r.id===c.id))||[...s.regime.deaths,...s.regime.sold].some(id=>!s.units.some(a=>a.id===id&&a.health===0))))throw Error('Uszkodzony zapis rady lub karawan.');
    if(s.version===5&&(!validRegion(s.region)||s.region.traffic.some(t=>t.id>=s.nextId||s.regime.convoys.some(c=>c.id===t.id))))throw Error('Uszkodzony zapis regionu.');
    const copy=JSON.parse(JSON.stringify(s))as Save;
    this.time=copy.time;this.accumulator=copy.accumulator??0;this.economy=copy.economy;this.resources=Object.assign({flour:0,bread:0,tools:0,knowledge:0},copy.resources);this.politics=copy.politics;
    this.regime=s.version>=4?copy.regime:createRegime();this.region=s.version===5?copy.region:createRegion();
    this.roads=copy.roads??[];this.laws={...defaultLaws(),...copy.laws};this.research=copy.research??[];this.scenario=copy.scenario??'campaign';this.roadRevision++;
    this.buildings=copy.buildings.map(b=>({...b,enabled:b.enabled??true,priority:b.priority??b.id,production:b.production??0,batches:b.batches??0,level:b.level??1}));this.journal=copy.journal;this.built=copy.built;this.nextId=copy.nextId;this.event=copy.event;this.outcome=copy.outcome;
    this.units=copy.units.map(a=>({...a,destination:a.destination??a.path.at(-1)??null,activityTarget:a.activityTarget??null,heading:a.heading??0,travel:a.travel??0,wait:a.wait??0,patrolStep:a.patrolStep??0,queue:a.queue??[],patrolCenter:a.patrolCenter??null,autoBuilder:a.autoBuilder??false}));
    this.paused=false;this.speed=1;this.revision++;this.rebuildGrid();
    if((s.version as number)<4){
      for(const a of this.living){
        const safe=this.navigation.nearestFree(a);if(safe){a.x=safe.x;a.y=safe.y}
        a.path=[];a.task='idle';a.destination=null;a.activityTarget=null;
      }
    }
  }
}
