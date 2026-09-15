import type {World,Resident} from './World';
export type System='council'|'directorate'|'commune';
export type Talent='artisan'|'master'|'speaker'|'diplomat'|'sentinel'|'guardian';
export const talents:Record<Talent,{name:string;parent:Talent|null;effect:string}>={
 artisan:{name:'Rzemieslnik',parent:null,effect:'+10% pracy'},
 master:{name:'Mistrz pracy',parent:'artisan',effect:'+20% pracy'},
 speaker:{name:'Mowca',parent:null,effect:'+5 wplywu z poselstwa'},
 diplomat:{name:'Dyplomata',parent:'speaker',effect:'+10 wplywu z poselstwa'},
 sentinel:{name:'Tropiciel',parent:null,effect:'+25% obrony przed drapieznikami'},
 guardian:{name:'Obronca stada',parent:'sentinel',effect:'+50% obrony przed drapieznikami'},
};
export type Progression={system:System|null;xp:Record<string,number>;talents:Record<string,Talent[]>};
export const createProgression=():Progression=>({system:null,xp:{},talents:{}});
export const hasTalent=(w:World,id:string,key:Talent)=>w.progression.talents[id]?.includes(key)??false;
export const talentPoints=(w:World,id:string)=>Math.floor((w.progression.xp[id]??0)/120)-(w.progression.talents[id]?.length??0);
export function learnTalent(w:World,id:string,key:Talent){
 const t=talents[key];if(w.outcome||!w.living.some(a=>a.id===id)||!t||hasTalent(w,id,key)||talentPoints(w,id)<1||t.parent&&!hasTalent(w,id,t.parent))return false;
 (w.progression.talents[id]??=[]).push(key);w.revision++;return true;
}
export const laborBonus=(w:World,a:Resident)=>1+(hasTalent(w,a.id,'artisan')?.1:0)+(hasTalent(w,a.id,'master')?.2:0);
export function chooseSystem(w:World,key:System){
 if(w.outcome||w.progression.system||!['council','directorate','commune'].includes(key)||!w.research.includes('charter'))return false;
 w.progression.system=key;w.revision++;return true;
}
export function tickProgression(w:World,dt:number){
 for(const a of w.living)if(!a.path.length&&['build','produce','govern','study','harvest','wood','stone','care','guard'].includes(a.task))
  w.progression.xp[a.id]=Math.min(720,(w.progression.xp[a.id]??0)+dt*.25);
 if(w.progression.system==='commune')for(const a of w.living)a.grievance=Math.max(0,a.grievance-dt*.0005);
 if(w.progression.system==='directorate')for(const a of w.living)a.grievance=Math.min(1,a.grievance+dt*.0003);
}
export function validProgression(p:Progression,units:Resident[]){
 return !!p&&(p.system===null||['council','directorate','commune'].includes(p.system))&&!!p.xp&&!!p.talents&&
 Object.entries(p.xp).every(([id,n])=>units.some(a=>a.id===id)&&Number.isFinite(n)&&n>=0&&n<=720)&&
 Object.entries(p.talents).every(([id,list])=>units.some(a=>a.id===id)&&Array.isArray(list)&&list.length<=6&&new Set(list).size===list.length&&list.length<=Math.floor((p.xp[id]??0)/120)&&list.every(k=>Object.hasOwn(talents,k)&&(!talents[k].parent||list.includes(talents[k].parent!))));
}
