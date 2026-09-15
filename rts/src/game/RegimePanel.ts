import {productionNames} from '../simulation/Region';
import {escapeHtml} from './SaveStore';
import type { World, Resource } from '../simulation/World';
import { DAY_SECONDS } from '../simulation/World';
import { edicts, edictReason, temperature, fuelPerDay, neighborOffer, cityOrders,type Edict } from '../simulation/Regime';
import { neighborSites } from '../simulation/Landscape';
import { resourceNames } from '../simulation/Development';
import { atlasStyle } from './Atlas';
const icon=(key:string)=>'<i data-lucide="'+key+'"></i>';
const cost=(r:Partial<Record<Resource,number>>)=>Object.entries(r).map(([k,v])=>v+' '+resourceNames[k as Resource]).join(', ')||'Bez oplaty';
const meter=(name:string,n:number)=>'<div class="political-meter"><span>'+name+'</span><meter max="1" value="'+n+'"></meter><b>'+Math.round(n*100)+'%</b></div>';
export const chapter=(w:World)=>w.day>=14?['IV','Kolejny rok, te same obietnice']:w.day<4?['I','Ziemia po ludziach']:w.day<7?['II','Ciezar obietnic']:['III','Kto przezyje zime'];
export function nextObjective(w:World){
 if(w.scenario!=='survival')return 'Rozwoj folwarku / '+w.season;
 if(temperature(w)<=-20&&w.regime.heating!=='high')return 'Silny mroz: wlacz mocne ogrzewanie. Zwykle juz nie wystarczy.';
 if(temperature(w)<12&&w.resources.wood<40)return 'Pilne: zdobadz opal. Kwatery zuzywaja drewno.';
 if(w.economy.grain+w.resources.bread*2<80)return 'Pilne: uzupelnij zywnosc przed wydaniem racji.';
 if(!w.regime.insulated)return 'Ociepl kwatery przed zima: 60 drewna, 20 kamienia.';
 if(!w.count('infirmary'))return 'Zapewnij opieke: zbuduj lecznice.';
 if(w.day>=14)return 'Zabezpiecz plony, opal i zgode wspolnoty przed kolejna zima.';
 if(w.day<7)return 'Zgromadz zywnosc i opal. Mroz nadejdzie w dniu 7.';
 return w.day>=11?'Zima ustepuje. Utrzymaj zapasy do odwilzy w dniu 14.':'Utrzymaj cieplo i ocal 8 mieszkancow do switu dnia 11.';
}
export function survivalPanel(w:World){
 const r=w.regime,fear=w.living.reduce((s,a)=>s+a.fear,0)/Math.max(1,w.living.length);
 return '<section class="survival-panel"><span class="eyebrow">SCENARIUSZ / DLA DOROSLYCH</span><h2>Wolnosc ma swoja cene</h2><p>Ludzie odeszli. Zwierzeta przejely ziemie, lecz zima nie uznaje zwyciestw. Rada decyduje, kto pracuje, kto je i co wolno pamietac.</p><div class="mission-order"><strong>ROZKAZ RADY</strong><p>'+nextObjective(w)+'</p></div><h3>Warunki przetrwania</h3><ul><li>Pierwszy kryzys trwa 10 dni. Pozniej folwark dziala dalej.</li><li>Ocal 8 mieszkancow i 40% ciepla w dniu 11. Wiosna: dzien 14, lato: 21, nowy rok: 29.</li><li>Mniej niz 6 zywych lub ponad 80% niepokojow konczy rzady rady.</li></ul><p>Glod i zimno zabijaja. Przymus oslabia ciala. Strach moze uciszyc protest, ale nie naprawia krzywdy. Kronika zachowa takze uczciwosc twoich rzadow.</p>'+meter('Cieplo kwater',r.heat)+meter('Zaufanie',r.trust)+meter('Strach',fear)+meter('Uczciwosc rady',r.integrity)+'<h3>Ogrzewanie / '+temperature(w)+' C</h3><label class="regime-select">Spalanie drewna<select data-heating aria-label="Ogrzewanie">'+(['off','normal','high']as const).map(k=>'<option value="'+k+'" '+(r.heating===k?'selected':'')+'>'+({off:'Wylaczone / 0',normal:'Zwykle / '+Math.round(fuelPerDay(w,'normal'))+' na dzien',high:'Mocne / '+Math.round(fuelPerDay(w,'high'))+' na dzien'})[k]+'</option>').join('')+'</select></label><p>Mroz zwieksza zuzycie opalu. Dni 9 i 10 wymagaja mocnego ogrzewania. Odwilz obniza zuzycie; wiosna i lato nie wymagaja opalu.</p><button class="wide-action" data-action="insulate" '+(r.insulated||!w.canPay({wood:60,stone:20})?'disabled':'')+'>'+icon(r.insulated?'check':'house')+(r.insulated?'Kwatery ocieplone / -30% opalu':'Ociepl kwatery / 60 drewna, 20 kamienia')+'</button><div class="casualties"><span>Zgony: '+r.deaths.length+'</span><span>Oddani ludziom: '+r.sold.length+'</span></div></section>';
}
export function propagandaPanel(w:World){
 const r=w.regime;
 return '<section class="propaganda-panel"><span class="eyebrow">GLOS RADY</span><h2>Prawda jest zasobem</h2><p>Niskie zaufanie oslabia lojalnosc i zwieksza krzywde. Biuletyn nie napelni misek. Jesli zapasy spadna ponizej 55, klamstwo o urodzaju wyjdzie na jaw.</p>'+meter('Zaufanie',r.trust)+meter('Uczciwosc',r.integrity)+'<label class="regime-select">Prawo do glosu<select data-press aria-label="Wolnosc prasy"><option value="free" '+(r.press==='free'?'selected':'')+'>Wolna kronika</option><option value="censored" '+(r.press==='censored'?'selected':'')+'>Cenzura / 12 monet</option></select></label>'+
 (Object.keys(edicts)as Edict[]).map(key=>{const e=edicts[key],reason=edictReason(w,key);return '<article class="edict"><h3>'+e.name+'</h3><p>'+e.description+'</p><small>'+cost(e.cost)+'</small><button data-edict="'+key+'" '+(reason?'disabled':'')+' title="'+(reason||e.description)+'">'+icon(key==='truth'?'scroll-text':key==='propaganda'?'megaphone':key==='force'?'hammer':'shield-alert')+(reason||'Wydaj dekret')+'</button></article>'}).join('')+
 '<h3>Oficjalny biuletyn</h3><div class="official-record">'+(r.official.length?r.official.slice(0,8).map(e=>'<p><small>Dzien '+e.day+'</small>'+escapeHtml(e.text)+'</p>').join(''):'<p>Rada nie wydala jeszcze komunikatu.</p>')+'</div></section>';
}
export function neighborsPanel(w:World,selected:string){
 return '<section class="neighbors-panel"><span class="eyebrow">ZA OGRODZENIEM</span><h2>Obce bramy</h2><p>Dostawy podrozuja szlakiem do stodoly. Zaplata przy wysylce; ladunek trafia do zapasow po powrocie.</p>'+neighborSites.map(n=>{
 const settlement=w.region.settlements.find(s=>s.id===n.id)!,relation=w.regime.relations[n.id],offer=neighborOffer(w,n.id,'trade'),convoy=w.regime.convoys.find(c=>c.neighbor===n.id);
 return '<article class="neighbor '+(selected===n.id?'selected':'')+'"><button class="neighbor-location" data-neighbor-focus="'+n.id+'"><span class="atlas" style="'+atlasStyle(n.art)+'"></span><span><strong>'+n.name+'</strong>'+icon('locate-fixed')+'</span></button><p>'+n.description+'</p><div class="neighbor-economy"><strong>'+({working:'Praca w toku',full:'Magazyn pelny',shortage:'Niedobor skladnikow',strike:'Strajk pracownikow',storm:'Przestoj po wichurze'})[settlement.status]+'</strong><small>'+settlement.workers+' pracownikow / '+productionNames[n.id]+'</small><meter max="12" value="'+settlement.cycle+'"></meter><div><span>Zboze <b>'+Math.floor(settlement.stock.grain)+'</b></span><span>Drewno <b>'+Math.floor(settlement.stock.wood)+'</b></span><span>Chleb <b>'+Math.floor(settlement.stock.bread)+'</b></span></div><small>Cykle produkcji: '+settlement.cycles+' / Kupcy na szlaku: '+w.region.traffic.filter(t=>t.settlement===n.id).length+'</small></div>'+meter(relation<.2?'Embargo':'Relacje',relation)+'<p class="trade-quote">'+cost(offer.cost)+'<br>'+icon('arrow-down')+' '+cost(offer.cargo)+'</p>'+
 (convoy?'<p class="convoy-status">'+icon('route')+(convoy.state==='unload'?'Magazyn pelny / karawana czeka':'Karawana na szlaku')+'</p>':'<div class="neighbor-actions"><button data-neighbor="'+n.id+'" data-diplomacy="trade" '+(relation<.2||!w.canPay(offer.cost)||Object.entries(offer.cargo).some(([k,v])=>(settlement.stock[k as keyof typeof settlement.stock]??0)<v)?'disabled':'')+'>'+icon('truck')+' Wymiana</button><button data-neighbor="'+n.id+'" data-diplomacy="aid" '+(!w.canPay({grain:25})?'disabled':'')+' title="25 zboza, +20 relacji po dotarciu">'+icon('hand-heart')+' Pomoc</button></div>')+
 (n.id==='dwor'&&!convoy?'<button class="danger-action" data-action="contract">'+icon('file-warning')+' Kontrakt na pracownika</button>':'')+'</article>';
 }).join('')+cityPanel(w)+'</section>';
}
function cityPanel(w:World){
 const convoy=w.regime.convoys.find(c=>c.neighbor==='city');
 return '<section class="city-panel"><span class="eyebrow">ZA GRANICA MAPY</span><button class="neighbor-location" data-neighbor-focus="city"><h3>Trakt do miasta</h3>'+icon('locate-fixed')+'</button><p>Droga na wschod. Dzien na zaladunek poza mapa, oprocz czasu przejazdu w obie strony.</p>'+(convoy?'<p class="convoy-status">'+(convoy.state==='abroad'?'Karawana w miescie / pozostalo '+Math.ceil(((convoy.waitUntil??0)-w.time)/65*24)+' godz.':convoy.leg==='return'?'Karawana wraca do folwarku':'Karawana zmierza ku granicy')+'</p>':Object.entries(cityOrders).map(([key,o])=>'<button class="city-order" data-city-order="'+key+'" '+(!w.canPay(o.cost)?'disabled':'')+'><strong>'+o.label+'</strong><small>'+cost(o.cost)+' → '+cost(o.cargo)+'</small></button>').join(''))+'</section>';
}
