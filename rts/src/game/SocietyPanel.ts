import {roles,aptitude,suited} from '../simulation/Roles';
import {platforms,polls,preferredPlatform} from '../simulation/Society';
import {treaties,envoyCost,onMission,treatyActive} from '../simulation/Diplomacy';
import {neighborSites} from '../simulation/Landscape';
import {taskNames,type World,type Resident,type Job} from '../simulation/World';
import {escapeHtml as esc} from './SaveStore';
import {atlasStyle} from './Atlas';
const icon=(s:string)=>'<i data-lucide="'+s+'"></i>';
export function rolePanel(w:World,a:Resident,choice?:Job){
 const role=roles[a.species],mission=w.diplomacy.missions.find(m=>m.unitId===a.id);
 const jobs:Exclude<Job,null>[]=['harvest','wood','stone','build','produce','patrol','guard'];
 return '<section class="role-panel"><h3>'+role.name+'</h3><p>'+role.description+'</p>'+
 (w.society.leaderId===a.id?'<div class="leader-badge">'+icon('crown')+' Przywodca folwarku</div>':'')+
 '<div class="detail-row"><span>Wydajnosc zadania</span><b>'+Math.round(aptitude(a,a.job,w.buildings.find(b=>b.id===a.target)?.kind)*(a.forced?.75:1)*100)+'%</b></div>'+
 (a.forced?'<p class="forced-warning">Przymus: wolniejsza praca, wieksze zmeczenie, krzywda i utrata zdrowia.</p>':'')+
 (mission?'<p class="envoy-status">'+({outbound:'Lot do sasiada',negotiating:'Negocjacje',return:'Powrot z poselstwa'})[mission.phase]+'</p>':a.species==='raven'?'<button class="wide-action" data-tab="neighbors">'+icon('send')+' Poselstwa i umowy</button>':
 '<button class="wide-action" data-natural="'+a.id+'">'+icon('sprout')+' Naturalny obowiazek</button>')+
 (!mission?'<label class="regime-select">Przydzial pracy<select id="role-job" aria-label="Przydzial pracy">'+jobs.map(j=>'<option value="'+j+'" '+((choice??a.job)===j?'selected':'')+'>'+taskNames[j]+' / '+Math.round(aptitude(a,j)*100)+'%'+(!suited(a,j)?' / przymus':'')+'</option>').join('')+'</select></label><button class="wide-action" data-role-assign="'+a.id+'">'+icon('clipboard-check')+' Przydziel zadanie</button>':'')+'</section>';
}
export function electionPanel(w:World){
 const s=w.society,leader=w.living.find(a=>a.id===s.leaderId),votes=polls(w);
 return '<section class="election-panel"><span class="eyebrow">ZGROMADZENIE ZWIERZAT</span><h3>Wladza nie nalezy do gatunku</h3><div class="leader-badge">'+icon('crown')+' '+(leader?esc(leader.name):'Wakat')+'</div><p>'+(s.term?platforms[s.platform].name+' / '+platforms[s.platform].effect:'Rada tymczasowa. Program zacznie obowiazywac po wyborach.')+'</p><small>Kadencja '+s.term+' / Kazdy zywy mieszkaniec ma jeden glos.</small><button class="wide-action" data-action="election" '+(w.time<s.nextElection||!w.count('stage')?'disabled':'')+'>'+icon('vote')+(w.time<s.nextElection?'Wybory za '+Math.ceil((s.nextElection-w.time)/65*24)+' godz.':'Przeprowadz wybory')+'</button>'+
 (s.lastWinner?'<p>Ostatni wynik: '+esc(w.units.find(a=>a.id===s.lastWinner)?.name??'')+' / '+s.votes[s.lastWinner]+' glosow</p>':'')+
 '<h3>Kandydaci i sondaz</h3><div class="candidates">'+w.living.map(a=>'<article class="candidate"><button data-unit="'+a.id+'" class="candidate-name"><span class="atlas" style="'+atlasStyle('portrait-'+a.species)+'"></span><strong>'+esc(a.name)+'</strong><b>'+votes[a.id]+'</b></button><label>Program<select data-platform="'+a.id+'" aria-label="Program: '+esc(a.name)+'">'+Object.entries(platforms).map(([k,p])=>'<option value="'+k+'" '+((s.nominations[a.id]??preferredPlatform(a))===k?'selected':'')+'>'+p.name+'</option>').join('')+'</select></label><button data-campaign="'+a.id+'" '+((s.campaigns[a.id]??0)>=3||!w.canPay({gold:10})?'disabled':'')+' title="10 monet. Wieksze poparcie, do trzech spotkan.">'+icon('megaphone')+' Kampania '+(s.campaigns[a.id]??0)+'/3</button></article>').join('')+'</div></section>';
}
export function embassyPanel(w:World){
 const envoys=w.living.filter(a=>a.species==='raven'&&!onMission(w,a.id));
 return '<section class="embassy-panel"><h3>Poselstwa i umowy</h3>'+
 (!envoys.length?'<p>Brak wolnego kruka. Przyjmij posla albo poczekaj na powrot.</p>':'<label class="regime-select">Posel<select id="envoy-unit" aria-label="Posel">'+envoys.map(a=>'<option value="'+a.id+'">'+esc(a.name)+'</option>').join('')+'</select></label>')+
 neighborSites.map(n=>{
 const mission=w.diplomacy.missions.find(m=>m.neighbor===n.id);
 return '<article class="embassy"><h4>'+n.name+'</h4>'+(mission?'<p>'+esc(w.units.find(a=>a.id===mission.unitId)?.name??'')+' / '+({outbound:'Lot do sasiada',negotiating:'Negocjacje',return:'Powrot z poselstwa'})[mission.phase]+'</p>':
 Object.entries(treaties).map(([k,t])=>{const active=treatyActive(w,n.id,k as keyof typeof treaties),remaining=w.diplomacy.agreements.find(a=>a.neighbor===n.id&&a.kind===k);return '<button class="treaty-action" data-envoy="'+n.id+'" data-treaty="'+k+'" '+(active||!envoys.length||!w.canPay({gold:envoyCost(w,k as keyof typeof treaties)})?'disabled':'')+'><span>'+icon(active?'file-check':'send')+' '+t.name+'</span><small>'+t.description+'</small><b>'+(active?'Aktywna / '+Math.ceil((remaining!.until-w.time)/65*24)+' godz.':envoyCost(w,k as keyof typeof treaties)+' monet')+'</b></button>'}).join(''))+'</article>';
 }).join('')+'</section>';
}
