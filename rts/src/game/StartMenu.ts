import {localizeDOM,locale} from '../i18n';
import {assetUrl} from './Atlas';
import {World} from '../simulation/World';
import type {FarmScene} from './FarmScene';
import {saveGame,readGame,listGames,removeGame,exportGame,decodeSave,slotName,readPreferences,writePreferences,escapeHtml,type SaveSlot,type Preferences} from './SaveStore';
import {createIcons,icons} from 'lucide';
type Screen='main'|'new'|'saves'|'options'|'credits'|'confirm';
export function attachStartMenu(scene:FarmScene,replace:(w:World)=>void,apply:(p:Preferences)=>void){
 const root=document.createElement('section');root.id='start-menu';root.style.setProperty('--menu-keyart-portrait','url("'+assetUrl('menu-keyart-portrait')+'")');root.style.setProperty('--menu-keyart','url("'+assetUrl('menu-keyart')+'")');root.setAttribute('aria-label','Menu gry');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');document.body.append(root);
 let screen:Screen='main',active=false,started=false,priorPause=false,message='',pending:(()=>void)|null=null,confirmText='';
 let preferences=readPreferences();apply(preferences);
 const i=(name:string)=>'<i data-lucide="'+name+'"></i>';
 const button=(id:string,label:string,icon:string,disabled=false)=>'<button data-menu="'+id+'" '+(disabled?'disabled':'')+'>'+i(icon)+'<span>'+label+'</span></button>';
 const capture=(enabled:boolean)=>{if(scene.input?.keyboard){scene.input.keyboard.enabled=enabled;if(enabled)scene.input.keyboard.enableGlobalCapture();else scene.input.keyboard.disableGlobalCapture()}};
 const resize=()=>requestAnimationFrame(()=>{if(scene.scale){const bounds=document.getElementById('game')!.getBoundingClientRect();scene.scale.setParentSize(bounds.width,bounds.height);scene.center()}});
 function close(){capture(true);active=false;root.hidden=true;scene.menuOpen=false;document.body.classList.remove('menu-open');scene.world.paused=priorPause;resize();scene.onChange()}
 function show(next:Screen='main'){
  if(!active){priorPause=scene.world.paused;active=true;scene.world.paused=true}
  capture(false);screen=next;message='';root.hidden=false;scene.menuOpen=true;document.body.classList.add('menu-open');scene.cancelMode();render();resize();
 }
 function confirm(text:string,action:()=>void){confirmText=text;pending=action;screen='confirm';render()}
 function acceptWorld(world:World){replace(world);started=true;priorPause=false;close()}
 function render(){
  root.dataset.screen=screen;
  let body='';
  if(screen==='main'){
   let available=false;try{available=listGames().some(s=>!s.empty&&!s.error)}catch{}
   body='<p class="menu-kicker">KRONIKA WOLNEGO FOLWARKU</p><h1>FOLWARK</h1><p class="menu-subtitle">Wszystkie zwierzeta sa rowne.<br>Do pierwszej pustej miski.</p><nav class="main-menu-actions">'+button('continue',started?'Wroc do folwarku':'Kontynuuj','play',!started&&!available)+button('new','Nowa gra','flag')+button('saves',started?'Zapisz / wczytaj':'Wczytaj gre','folder-open')+button('options','Opcje','settings-2')+button('credits','O projekcie','book-open')+'</nav><p class="menu-edition">PRZETRWANIE / WLADZA / KONSEKWENCJE</p>';
  }else{
   const title=({new:'Nowy folwark',saves:'Kroniki i zapisy',options:'Opcje',credits:'O projekcie',confirm:'Potwierdzenie'})[screen];
   body='<div class="menu-page-heading"><button data-menu="main" aria-label="Wstecz" title="Wstecz">'+i('arrow-left')+'</button><h2>'+title+'</h2></div>';
   if(screen==='new')body+='<div class="scenario-list">'+[
    ['survival','Folwark przez pory roku','Mroz, racje, propaganda. Przetrwanie ma swoja cene.'],
    ['sandbox','Wolny folwark','Gospodarka i pory roku bez koncowej daty.'],
    ['campaign','Pierwsza jesien','Dawna kampania: trzy budynki i 350 zboza.']
   ].map(([id,title,desc])=>'<button data-scenario="'+id+'"><span>'+title+'<small>'+desc+'</small></span>'+i('chevron-right')+'</button>').join('')+'</div>';
   if(screen==='saves'){
    let saves:ReturnType<typeof listGames>=[];try{saves=listGames()}catch{message='Pamiec przegladarki jest niedostepna. Uzyj eksportu pliku.'}
    body+='<div class="save-list">'+saves.map(s=>'<article><div><strong>'+slotName(s.slot)+'</strong><small>'+(s.empty?'Puste miejsce':s.error?'Uszkodzony zapis':(s.scenario==='survival'?'Przetrwanie':s.scenario==='sandbox'?'Tryb swobodny':'Kampania')+' / dzien '+s.day+' / '+s.population+' mieszkancow')+'</small><time>'+(s.savedAt?new Date(s.savedAt).toLocaleString(locale()):'')+'</time></div><div class="save-actions">'+(s.slot!=='auto'&&started?'<button data-save-slot="'+s.slot+'" title="Zapisz: '+slotName(s.slot)+'" aria-label="Zapisz: '+slotName(s.slot)+'">'+i('save')+'</button>':'')+'<button data-load-slot="'+s.slot+'" '+(s.empty||s.error?'disabled':'')+' title="Wczytaj: '+slotName(s.slot)+'" aria-label="Wczytaj: '+slotName(s.slot)+'">'+i('folder-open')+'</button><button data-delete-slot="'+s.slot+'" '+(s.empty?'disabled':'')+' title="Usun: '+slotName(s.slot)+'" aria-label="Usun: '+slotName(s.slot)+'">'+i('trash-2')+'</button></div></article>').join('')+'</div><div class="menu-file-actions">'+button('export','Eksportuj JSON','download',!started)+button('import','Importuj JSON','upload')+'</div><input id="save-import" type="file" accept=".json,application/json" hidden>';
   }
   if(screen==='options')body+='<div class="menu-options"><label><span>Jezyk</span><select data-pref="language" aria-label="Jezyk"><option value="en" '+(preferences.language==='en'?'selected':'')+'>English</option><option value="pl" '+(preferences.language==='pl'?'selected':'')+'>Polski</option></select></label><label>Dzwieki interfejsu<input type="checkbox" data-pref="sound" '+(preferences.sound?'checked':'')+'></label><label>Glosnosc<input type="range" min="0" max="1" step=".05" data-pref="volume" value="'+preferences.volume+'"></label><label>Przesuwanie przy krawedzi<input type="checkbox" data-pref="edgeScroll" '+(preferences.edgeScroll?'checked':'')+'></label><label>Szybkosc kamery<input type="range" min=".3" max="1.5" step=".1" data-pref="cameraSpeed" value="'+preferences.cameraSpeed+'"></label><label>Ograniczone animacje<input type="checkbox" data-pref="reducedMotion" '+(preferences.reducedMotion?'checked':'')+'></label><label>Automatyczny zapis<select data-pref="autosaveSeconds">'+[0,20,60,120].map(n=>'<option value="'+n+'" '+(preferences.autosaveSeconds===n?'selected':'')+'>'+(n?'Co '+n+' sekund':'Wylaczony')+'</option>').join('')+'</select></label></div><div class="menu-file-actions">'+button('fullscreen','Pelny ekran','maximize')+button('defaults','Domyslne ustawienia','rotate-ccw')+'</div>';
   if(screen==='credits')body+='<div class="menu-credits"><h3>Przetrwanie i wladza</h3><p>Gra strategiczna inspirowana Folwarkiem zwierzecym George\'a Orwella. Niezalezna interpretacja, bez powiazania z tworcami Frostpunka.</p><p>Grafiki postaci i budynkow: 18 arkuszy dostarczonych przez autora projektu. Materialy terenu: Higgsfield i OpenAI. Silnik: Phaser. Trasy: EasyStar.</p><p>Wersja robocza. Przemoc, smierc, represje i przymusowa praca.</p></div>';
   if(screen==='confirm')body+='<p class="menu-confirm-text">'+escapeHtml(confirmText)+'</p><div class="menu-file-actions">'+button('cancel','Anuluj','x')+button('confirm','Potwierdz','check')+'</div>';
  }
  root.innerHTML='<div class="menu-vignette"></div><div class="menu-content '+(screen==='main'?'menu-home':'menu-subpage')+'">'+body+'<p class="menu-message" role="status">'+escapeHtml(message)+'</p></div>';
  localizeDOM(root);
  createIcons({icons,attrs:{'stroke-width':1.6}});
 }
 root.addEventListener('click',e=>{
  const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target||target.disabled)return;
  try{
   if(target.dataset.scenario){
    const scenario=target.dataset.scenario as 'survival'|'sandbox'|'campaign',start=()=>acceptWorld(new World(scenario));
    if(started)confirm('Rozpoczac nowa gre? Niezapisany postep obecnego folwarku zostanie utracony.',start);else start();return;
   }
   const save=target.dataset.saveSlot as SaveSlot,load=target.dataset.loadSlot as SaveSlot,del=target.dataset.deleteSlot as SaveSlot;
   if(save){const action=()=>{saveGame(scene.world,save);message='Zapisano: '+slotName(save);screen='saves';render()};if(listGames().find(s=>s.slot===save)?.empty)action();else confirm('Zastapic zapis w '+slotName(save)+'?',action);return}
   if(load){acceptWorld(readGame(load).world);return}
   if(del){confirm('Usunac '+slotName(del)+'? Tej operacji nie mozna cofnac.',()=>{removeGame(del);screen='saves';render()});return}
   switch(target.dataset.menu){
    case 'continue':if(started)close();else{const latest=listGames().filter(s=>!s.empty&&!s.error).sort((a,b)=>b.savedAt-a.savedAt)[0];if(latest)acceptWorld(readGame(latest.slot).world)}break;
    case 'main':case 'new':case 'saves':case 'options':case 'credits':screen=target.dataset.menu as Screen;message='';render();break;
    case 'confirm':{const action=pending;pending=null;action?.();break}
    case 'cancel':pending=null;screen='main';render();break;
    case 'import':root.querySelector<HTMLInputElement>('#save-import')?.click();break;
    case 'export':{const url=URL.createObjectURL(new Blob([exportGame(scene.world)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='FOLWARK-dzien-'+scene.world.day+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='Wyeksportowano zapis.';render();break}
    case 'defaults':preferences={language:'en',sound:false,volume:.5,edgeScroll:true,cameraSpeed:.7,reducedMotion:false,autosaveSeconds:20};writePreferences(preferences);apply(preferences);render();break;
    case 'fullscreen':if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>{message='Pelny ekran jest niedostepny.';render()});break;
   }
  }catch(error){message=error instanceof Error?error.message:'Operacja nie powiodla sie.';render()}
 });
 root.addEventListener('change',async e=>{
  const target=e.target as HTMLInputElement;
  try{
   if(target.id==='save-import'){
    const file=target.files?.[0];if(!file)return;if(file.size>2_000_000)throw Error('Plik zapisu jest zbyt duzy.');
    const decoded=decodeSave(await file.text());
    confirm('Wczytac folwark z pliku? Obecny niezapisany postep zostanie zastapiony.',()=>acceptWorld(decoded.world));return;
   }
   const key=target.dataset.pref as keyof Preferences;if(!key)return;
   const value=key==='language'?(target.value==='pl'?'pl':'en'):target.type==='checkbox'?target.checked:Number(target.value);
   preferences={...preferences,[key]:value};writePreferences(preferences);apply(preferences);localizeDOM(root);
   if(key==='language'){render();root.querySelector<HTMLElement>('[data-pref="language"]')?.focus()}
  }catch(error){message=error instanceof Error?error.message:'Nie mozna odczytac pliku.';render()}
 });
 document.addEventListener('keydown',e=>{
  if(!active)return;
  if(e.key==='Escape'){e.preventDefault();if(screen!=='main'){screen='main';render()}else if(started)close()}
  if(e.key==='Tab'){
   const controls=[...root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not([hidden]),select')];
   const first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
 });
 show();
 return {show,close,ready:()=>{capture(!active);resize();render()},get active(){return active},get started(){return started}};
}
