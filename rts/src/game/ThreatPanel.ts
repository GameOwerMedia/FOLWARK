import {getLanguage} from '../i18n';
import type {World} from '../simulation/World';
export function threatPanel(w:World){
 const t=w.threats.active;if(!t)return '';
 const pl=getLanguage()==='pl',name=t.kind==='fire'?(pl?'Pozar stodoly':'Barn fire'):(pl?'Najazd na folwark':'Farm raid');
 const text=t.kind==='fire'?(pl?'Ogien niszczy zboze. Straz przy stodole gasi pozar; studnie przyspieszaja prace.':'Fire consumes grain. Guards at the barn fight the fire; wells speed up their work.')
  :(pl?'Straz i patrole walcza z najezdzcami w poblizu. Straznice wzmacniaja obrone.':'Guards and patrols fight nearby raiders. Watchtowers strengthen the defence.');
 return '<section class="threat-panel"><h3>'+name+'</h3><p>'+text+'</p><strong>'+(t.phase==='warning'?(pl?'Czas na przygotowanie':'Preparation time'):(pl?'Zagrozenie aktywne':'Threat active'))+': '+Math.max(0,Math.ceil(t.deadline-w.time))+' s</strong><div class="compact-actions"><button data-action="threat-focus" title="'+(pl?'Pokaz zagrozenie':'Locate threat')+'"><i data-lucide="locate-fixed"></i></button><button data-action="threat-respond" title="'+(pl?'Wyslij straz':'Dispatch guards')+'"><i data-lucide="shield"></i></button><button data-action="threat-supplies" title="'+(pl?'Zapasy awaryjne: 15 drewna, 10 zboza':'Emergency supplies: 15 wood, 10 grain')+'" '+(t.strength<=0||!w.canPay({wood:15,grain:10})?'disabled':'')+'><i data-lucide="package"></i></button></div></section>';
}
