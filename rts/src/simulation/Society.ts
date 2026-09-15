import type {World,Resident} from './World';
import type {Species} from './Animal';
export type Platform='solidarity'|'industry'|'security'|'learning'|'commerce';
export const platforms:Record<Platform,{name:string;effect:string}>={
 solidarity:{name:'Wspolny stol',effect:'-15% narastania glodu'},
 industry:{name:'Odbudowa',effect:'+12% wydajnosci pracy'},
 security:{name:'Bezpieczenstwo',effect:'+25% skutecznosci patroli'},
 learning:{name:'Edukacja',effect:'+25% pracy badawczej'},
 commerce:{name:'Otwarte bramy',effect:'-15% ceny umow i wymiany'},
};
export type SocietyState={bedding:number;leaderId:string|null;platform:Platform;nextElection:number;term:number;campaigns:Record<string,number>;nominations:Record<string,Platform>;votes:Record<string,number>;lastWinner:string|null};
export const createSociety=():SocietyState=>({bedding:0,leaderId:null,platform:'solidarity',nextElection:0,term:0,campaigns:{},nominations:{},votes:{},lastWinner:null});
export function preferredPlatform(a:Pick<Resident,'species'>):Platform{
 const p:Record<Species,Platform>={pig:'industry',dog:'security',horse:'solidarity',cow:'solidarity',sheep:'solidarity',hen:'solidarity',goat:'learning',ram:'security',boar:'industry',cat:'commerce',raven:'commerce',donkey:'learning',mule:'industry',duck:'commerce',goose:'solidarity'};return p[a.species];
}
export function nominate(w:World,id:string,platform:Platform){
 if(w.outcome||!w.living.some(a=>a.id===id)||!Object.hasOwn(platforms,platform))return false;
 w.society.nominations[id]=platform;w.revision++;return true;
}
export function campaign(w:World,id:string){
 if(w.outcome||!w.living.some(a=>a.id===id)||(w.society.campaigns[id]??0)>=3||!w.canPay({gold:10}))return false;
 w.pay({gold:10});w.society.campaigns[id]=(w.society.campaigns[id]??0)+1;w.revision++;return true;
}
export function polls(w:World){
 const votes:Record<string,number>=Object.fromEntries(w.living.map(a=>[a.id,0]));
 const preference=(voter:Resident,candidate:Resident)=>{
  const platform=w.society.nominations[candidate.id]??preferredPlatform(candidate);
  const familiarity=(Array.from(voter.id+candidate.id).reduce((n,c)=>n*31+c.charCodeAt(0),7)>>>0)%101/101;
  return (platform===preferredPlatform(voter)?.55:0)+(voter.species===candidate.species?.18:0)+candidate.voice*.25+candidate.loyalty*.12-candidate.grievance*.1+
   (w.society.campaigns[candidate.id]??0)*.32+(w.society.leaderId===candidate.id?(w.regime.trust-.5)*.5:0)+familiarity*.22;
 };
 for(const voter of w.living){const candidate=[...w.living].sort((a,b)=>preference(voter,b)-preference(voter,a)||a.id.localeCompare(b.id))[0];if(candidate)votes[candidate.id]++}
 return votes;
}
export function elect(w:World){
 if(w.outcome||w.time<w.society.nextElection||!w.count('stage')||!w.living.length)return false;
 const votes=polls(w),winner=[...w.living].sort((a,b)=>votes[b.id]-votes[a.id]||a.id.localeCompare(b.id))[0];
 const s=w.society;s.leaderId=winner.id;s.lastWinner=winner.id;s.platform=s.nominations[winner.id]??preferredPlatform(winner);s.votes=votes;s.term++;s.nextElection=w.time+130;s.campaigns={};s.nominations={};
 w.politics.leaderSpecies=winner.species;w.regime.trust=Math.min(1,w.regime.trust+.05);w.regime.integrity=Math.min(1,w.regime.integrity+.03);
 w.log('Wybory: '+winner.name+' / '+votes[winner.id]+' glosow. '+platforms[s.platform].name+'.');w.revision++;return true;
}
export function tickSociety(w:World){
 if(w.society.leaderId&&!w.living.some(a=>a.id===w.society.leaderId)){w.society.leaderId=null;w.society.nextElection=w.time;w.politics.leaderSpecies=undefined;w.log('Przywodca nie zyje. Zgromadzenie musi wybrac nastepce.')}
}
export function mandate(w:World,platform:Platform){return w.society.term>0&&!!w.society.leaderId&&w.living.some(a=>a.id===w.society.leaderId)&&w.society.platform===platform}
export function validSociety(s:SocietyState,units:Resident[]){
 const ids=new Set(units.map(a=>a.id)),n=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 const record=(v:unknown,test:(x:unknown)=>boolean)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([k,x])=>ids.has(k)&&test(x));
 return !!s&&Number.isInteger(s.bedding)&&s.bedding>=0&&s.bedding<=3&&(s.leaderId===null||ids.has(s.leaderId))&&(s.lastWinner===null||ids.has(s.lastWinner))&&Object.hasOwn(platforms,s.platform)&&n(s.nextElection)&&Number.isInteger(s.term)&&s.term>=0&&record(s.campaigns,x=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<=3)&&record(s.nominations,x=>typeof x==='string'&&Object.hasOwn(platforms,x))&&record(s.votes,x=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<=units.length);
}
