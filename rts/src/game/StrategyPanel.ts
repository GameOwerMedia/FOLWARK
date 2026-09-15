import type {World,Resident} from '../simulation/World';
import {getLanguage,t} from '../i18n';
import {talents,talentPoints,hasTalent} from '../simulation/Progression';
import {neighborSites} from '../simulation/Landscape';
import {escapeHtml as esc} from './SaveStore';
const say=(pl:string,en:string)=>getLanguage()==='pl'?pl:en;
const icon=(s:string)=>'<i data-lucide="'+s+'"></i>';
export function characterTree(w:World,a:Resident){
 return '<section class="talent-tree"><h3>'+say('Rozwoj postaci','Character development')+'</h3><div class="detail-row"><span>XP '+Math.floor(w.progression.xp[a.id]??0)+'</span><b>'+talentPoints(w,a.id)+' '+say('punktow','points')+'</b></div>'+
 Object.entries(talents).map(([k,n])=>'<button class="talent-node '+(n.parent?'child':'')+'" data-talent="'+k+'" data-person="'+a.id+'" '+(hasTalent(w,a.id,k as keyof typeof talents)||talentPoints(w,a.id)<1||n.parent&&!hasTalent(w,a.id,n.parent)?'disabled':'')+'><span>'+icon(hasTalent(w,a.id,k as keyof typeof talents)?'check':n.parent?'git-branch':'circle-plus')+t(n.name)+'</span><small>'+t(n.effect)+'</small></button>').join('')+'</section>';
}
export function systemPanel(w:World){
 const definitions=[['council','Rada obywatelska','Civic council','Misje dyplomatyczne tansze o 15%.','Diplomatic missions cost 15% less.'],['directorate','Dyrektoriat','Directorate','+12% pracy. Krzywda narasta.','+12% labour. Grievance rises.'],['commune','Komuna','Commune','Krzywda maleje z czasem.','Grievance falls over time.']] as const;
 return '<section class="system-tree"><h3>'+say('Ustroj wspolnoty','Political system')+'</h3>'+definitions.map(([key,pl,en,pd,ed])=>'<button class="talent-node" data-system="'+key+'" '+(w.progression.system||!w.research.includes('charter')?'disabled':'')+'><span>'+icon(w.progression.system===key?'check':'landmark')+say(pl,en)+'</span><small>'+say(pd,ed)+'</small></button>').join('')+'<small>'+say('Wymaga Karty wspolnoty. Wybor wyklucza pozostale ustroje.','Requires the Community Charter. Choosing one excludes the other systems.')+'</small></section>';
}
export function foreignPanel(w:World){
 return '<section class="foreign-politics"><h3>'+say('Polityka regionu','Regional politics')+'</h3>'+w.foreign.farms.map(f=>{
  const n=w.region.settlements.find(n=>n.id===f.id)!,site=neighborSites.find(n=>n.id===f.id)!;
  const gov={human:say('Wladza ludzi','Human rule'),council:say('Rada','Council'),directorate:say('Dyrektoriat','Directorate'),commune:say('Komuna','Commune')}[f.government];
  return '<article class="foreign-farm"><button class="foreign-heading" data-neighbor-focus="'+f.id+'">'+icon('map-pin')+site.name+'</button><strong>'+gov+' / '+esc(f.leader)+'</strong><div class="detail-row"><span>'+say('Ludnosc','Population')+'</span><b>'+f.population+'</b></div><div class="detail-row"><span>'+say('Zboze / chleb','Grain / bread')+'</span><b>'+Math.floor(n.stock.grain)+' / '+Math.floor(n.stock.bread)+'</b></div>'+
  '<label>'+say('Wplyw','Influence')+' '+Math.floor(f.influence)+'%<meter max="100" value="'+f.influence+'"></meter></label><label>'+say('Propaganda','Propaganda')+' '+Math.floor(f.propaganda)+'%<meter max="100" value="'+f.propaganda+'"></meter></label>'+
  (f.collapsed?'<p class="forced-warning">'+say('Farma opustoszala wskutek glodu.','The farm collapsed from starvation.')+'</p>':f.request?'<p>'+say(f.request==='food'?'Prosba o 40 zboza':'Prosba o przylaczenie',f.request==='food'?'Requests 40 grain':'Requests membership')+'</p><div class="compact-actions"><button data-foreign-answer="'+f.id+'" data-accept="yes" title="'+say('Przyjmij prosbe','Accept request')+'">'+icon('check')+'</button><button data-foreign-answer="'+f.id+'" data-accept="no" title="'+say('Odrzuc prosbe','Decline request')+'">'+icon('x')+'</button></div>':f.affiliated?'<p>'+icon('flag')+say('Czesc federacji / nadwyzki zboza trafiaja do wspolnych zapasow','Federation member / grain surplus feeds shared stores')+'</p>':'')+'</article>';
 }).join('')+'</section>';
}
export function wildlifePanel(w:World){
 return '<section class="wildlife-panel"><h3>'+say('Granice i drapiezniki','Boundaries and predators')+'</h3><div class="detail-row"><span>'+say('Drapieznikow w poblizu','Predators nearby')+'</span><b>'+w.wildlife.predators.length+'</b></div><div class="detail-row"><span>'+say('Ofiary / ucieczki','Victims / departures')+'</span><b>'+w.wildlife.kills+' / '+w.wildlife.escaped.length+'</b></div>'+w.wildlife.predators.map(e=>'<button class="wide-action" data-predator="'+e.id+'">'+icon('locate-fixed')+say(e.kind==='wolf'?'Wilk':'Lis',e.kind==='wolf'?'Wolf':'Fox')+'</button>').join('')+'</section>';
}
