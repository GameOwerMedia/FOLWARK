import {localizeDOM,setLanguage,locale} from '../i18n';
import {attachStartMenu} from './StartMenu';
import {saveGame,decodeSave,escapeHtml} from './SaveStore';
import { createIcons, icons } from 'lucide';
import { atlasStyle, sheets, textureSheets, assetUrl } from './Atlas';
import { FarmScene } from './FarmScene';
import { economyPanel, researchPanel, lawsPanel, buildingControls, tradePrice } from './DevelopmentPanel';
import { survivalPanel, propagandaPanel, neighborsPanel, chapter, nextObjective } from './RegimePanel';
import { issueEdict, setPress, insulate, sendConvoy, temperature, edicts, cityOrders,type CityOrder, type Edict, type Press, type Heating } from '../simulation/Regime';
import { neighborSites,cityGate,tradeSites } from '../simulation/Landscape';
import { resourceNames, resourceArt, type Laws, type Technology } from '../simulation/Development';
import { roads, pond } from '../simulation/Landscape';
import { World, buildingDefs, buildableKinds, speciesNames, taskNames, DAY_SECONDS, WIDTH, HEIGHT, type BuildingKind, type Resource } from '../simulation/World';
import type { Species } from '../simulation/Animal';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const icon=(name:string)=>`<i data-lucide="${name}"></i>`;
const art=(key:string,cls='')=>`<span class="atlas ${cls}" style="${atlasStyle(key)}"></span>`;
const button=(action:string,title:string,symbol:string,extra='')=>`<button data-action="${action}" title="${title}" aria-label="${title}" ${extra}>${icon(symbol)}</button>`;
const bar=(label:string,value:number,cls:string)=>`<div class="stat"><span>${label}</span><meter min="0" max="100" value="${value}" class="${cls}"></meter><b>${Math.round(value)}<small>/100</small></b></div>`;
const cost=(kind:BuildingKind)=>Object.entries(buildingDefs[kind].cost).map(([k,v])=>`<span>${art(resourceArt[k as Resource])}${v}</span>`).join('');
let activeTab='mission',tray=false,lastRoster='',lastToast=-1,modalKey='',sound=false,volume=.5,audio:AudioContext|undefined;
export function attachUI(scene:FarmScene){
  for(const sheet of textureSheets)document.documentElement.style.setProperty('--asset-'+sheet, `url("${assetUrl(sheet)}")`);
  el('shell').innerHTML=`
    <header class="topbar">
      <div class="brand"><span class="brand-seal">${art('wheat')}</span><div><h1>FOLWARK</h1><span id="scenario-label">WOLNY FOLWARK</span></div></div>
      <div class="resources">${(['grain','wood','stone','gold','bread','tools'] as Resource[]).map(k=>`<div class="resource" title="${resourceNames[k]}">${art(resourceArt[k])}<div><b id="res-${k}">0</b><span>${resourceNames[k].toUpperCase()}</span></div></div>`).join('')}</div>
      <div class="chapter-header"><span class="chapter" id="chapter-label">ROZDZIAL I</span><strong id="chapter-title">Ziemia po ludziach</strong><span id="map-weather"></span></div>
      <div class="top-tools"><span class="header-clock" id="day-clock">00:00</span><span id="paused-banner" hidden>PAUZA</span>
        <div class="speed-controls">${button('pause','Pauza / wznowienie','pause')}<button data-speed="1" class="active" title="Normalne tempo">1x</button><button data-speed="2" title="Podwojne tempo">2x</button><button data-speed="4" title="Czterokrotne tempo">4x</button></div>
        ${button('main-menu','Menu glowne','menu')}${button('saves','Zapisy gry','folder-open')}${button('save','Zapisz gre','save')}${button('settings','Opcje gry','settings-2')}
      </div>
    </header><section class="crisis-bar" aria-label="Stan przetrwania"><strong id="crisis-objective"></strong><span id="crisis-heat"></span><span id="crisis-deadline"></span></section>
    <main class="play-layout">
      <section id="world-panel" aria-label="Mapa folwarku"><div id="game"></div>
        <div class="map-tools">${button('pan','Przesuwanie mapy przez przeciaganie','hand')}${button('center','Wysrodkuj mape','locate-fixed')}${button('zoom-in','Przybliz','plus')}${button('zoom-out','Oddal','minus')}${button('fullscreen','Pelny ekran','maximize')}</div>
        <div id="mode-banner" hidden></div>
        <div class="minimap-wrap"><div class="mini-title"><span>FOLWARK I OKOLICE</span><span>N ↑</span></div><canvas id="minimap" width="210" height="140" aria-label="Minimapa" title="Kliknij, aby przesunac widok"></canvas></div>
        <div class="world-caption"><span id="population-map"></span><span>WSZYSTKIE ZWIERZETA SA ROWNE.</span></div>
        <div id="build-tray" hidden></div>
      </section>
      <aside class="sidebar">
        <div class="day-row"><div>${icon('sun')}<span><span id="season-label">JESIEN</span> <b id="day-label">Dzien 1</b></span></div></div>
        <div class="day-progress"><span id="day-fill"></span></div>
        <nav class="side-tabs" aria-label="Panel folwarku"><button data-tab="unit" class="active">${icon('mouse-pointer-2')} Wybor</button><button data-tab="council">${icon('scale')} Rada</button><button data-tab="economy" title="Produkcja i kolejka budowy">${icon('factory')} Zaklady</button><button data-tab="research" title="Badania i technologie">${icon('book-open')} Rozwoj</button><button data-tab="journal">${icon('scroll-text')} Kronika</button><button data-tab="mission">${icon('snowflake')} Przetrwanie</button><button data-tab="propaganda">${icon('megaphone')} Propaganda</button><button data-tab="neighbors">${icon('landmark')} Sasiedzi</button></nav>
        <div id="toast" role="status" hidden></div><div id="inspector"></div>
        <section class="winter-goals"><div class="section-heading"><span>PRZETRWANIE I WŁADZA</span>${icon('snowflake')}</div>
          <div id="goals"></div>
        </section>
        <div class="unrest"><div><span>NIEPOKOJE</span><b id="unrest-value">0%</b></div><meter id="unrest-meter" min="0" max="100" value="0"></meter><span id="unrest-label">Mieszkancy ufaja radzie</span></div>
      </aside>
    </main>
    <footer class="commandbar">
      <div class="roster-area"><div class="section-heading"><span>MIESZKANCY <b id="population">12</b></span><button data-action="select-all" class="text-button" title="Wybierz wszystkich">WSZYSCY</button></div><div id="roster"></div></div>
      <div class="orders"><div class="section-heading"><span id="orders-label">ROZKAZY</span><span id="selection-count"></span></div><div class="order-buttons">
        ${button('move','Przemiesc: wybierz miejsce na mapie','move')}${button('harvest','Zbieraj plony','wheat')}${button('wood','Zbieraj drewno','axe')}${button('stone','Wydobywaj kamien','pickaxe')}${button('eat','Idz na posilek','utensils')}${button('rest','Odpocznij','moon')}${button('stop','Wstrzymaj rozkaz','hand')}${button('build-order','Buduj: przydziel do kolejki','hammer')}${button('unload','Rozladuj niesione zasoby','package-open')}${button('patrol','Patroluj wybrany obszar','flag')}${button('guard','Pilnuj wybranego miejsca','shield')}${button('idle-select','Wybierz bezczynnych mieszkancow','user-search')}
      </div></div>
      <div class="footer-actions"><button data-action="build" class="build-button">${icon('hammer')}<span>Rozbudowa</span></button><button data-action="library" class="library-button" title="Ksiega folwarku">${icon('book-open')}<span>Ksiega folwarku</span></button></div>
    </footer><dialog id="modal"></dialog>`;
  const modal=el<HTMLDialogElement>('modal');
  let pausedBeforeModal=false,modalWorld=scene.world;
  const closeModal=()=>{modal.close();modalKey='';scene.world.paused=modalWorld===scene.world?pausedBeforeModal:false};
  const showModal=(key:string,html:string)=>{if(modalKey===key)return;if(!modal.open){pausedBeforeModal=scene.world.paused;modalWorld=scene.world}scene.world.paused=true;modalKey=key;modal.innerHTML=html;if(!modal.open)modal.showModal();localizeDOM(modal);paintIcons()};
  const options=()=>menu.show('options');
  const save=()=>{try{saveGame(scene.world,'quick');scene.world.notify('Zapisano gre na tym urzadzeniu.')}catch{scene.world.notify('Przegladarka nie pozwala zapisac gry.')}};
  const load=(key:string)=>{try{const raw=localStorage.getItem(key);if(!raw){scene.world.notify('Nie ma jeszcze takiego zapisu.');return}const world=decodeSave(raw).world;scene.world=world;scene.resetViews();scene.selected=[world.living[0]?.id].filter(Boolean);scene.selectedBuilding=null;lastRoster='';closeModal();scene.world.notify('Wczytano zapis gry.')}catch{scene.world.notify('Nie udalo sie odczytac zapisu.')}};
  let selectedNeighbor='dwor';
  scene.onNeighbor=id=>{selectedNeighbor=id;activeTab='neighbors';render()};
  let pendingEdict:Edict|null=null;
  let tradeChoice:Resource='wood';
  document.addEventListener('change',e=>{const target=e.target as HTMLInputElement;if(target.hasAttribute('data-heating')&&['off','normal','high'].includes(target.value))scene.world.regime.heating=target.value as Heating;if(target.hasAttribute('data-press')){setPress(scene.world,target.value as Press);target.value=scene.world.regime.press}if(target.id==='trade-resource'){tradeChoice=target.value as Resource;el('trade-price').textContent=tradePrice(scene.world,tradeChoice)}if(target.dataset.law){scene.world.setLaw(target.dataset.law as keyof Laws,target.value as Laws[keyof Laws]);render()}if(target.dataset.setting==='edge-scroll')scene.edgeScroll=target.checked});
  document.addEventListener('click',e=>{
    const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target||target.disabled)return;
    if(sound)beep();
    if(target.dataset.neighborFocus){selectedNeighbor=target.dataset.neighborFocus;const n=tradeSites.find(n=>n.id===selectedNeighbor);if(n)scene.cameras.main.centerOn(n.x,n.y);activeTab='neighbors'}
    if(target.dataset.cityOrder)sendConvoy(scene.world,'city','trade',undefined,target.dataset.cityOrder as CityOrder);
    if(target.dataset.diplomacy)sendConvoy(scene.world,target.dataset.neighbor!,target.dataset.diplomacy as 'trade'|'aid');
    if(target.dataset.edict){const key=target.dataset.edict as Edict;if(key==='force'||key==='crackdown'){pendingEdict=key;showModal('edict',`<div class="dialog-header"><h2>${edicts[key].name}</h2>${button('close','Anuluj','x')}</div><p>${edicts[key].description} Skutki dla zdrowia i zaufania nie zostana cofniete po zakonczeniu dekretu.</p><div class="dialog-actions"><button data-action="close">Anuluj</button><button class="danger-action" data-action="confirm-edict">Wydaj rozkaz</button></div>`)}else issueEdict(scene.world,key)}
    const action=target.dataset.action;
    if(target.dataset.staff)scene.world.staffBuilding(Number(target.dataset.staff));
    if(target.dataset.release)scene.world.releaseBuilding(Number(target.dataset.release));
    if(target.dataset.priority)scene.world.prioritize(Number(target.dataset.priority));
    if(target.dataset.cancelBuild)scene.world.cancelBuild(Number(target.dataset.cancelBuild));
    if(target.dataset.toggleBuilding)scene.world.toggleBuilding(Number(target.dataset.toggleBuilding));
    if(target.dataset.upgrade)scene.world.upgrade(Number(target.dataset.upgrade));
    if(target.dataset.focusBuilding){scene.focusBuilding(Number(target.dataset.focusBuilding));activeTab='unit'}
    if(target.dataset.research)scene.world.researchTech(target.dataset.research as Technology);
    if(target.dataset.tab){activeTab=target.dataset.tab;render()}
    if(target.dataset.unit){scene.focus(target.dataset.unit);activeTab='unit'}
    if(target.dataset.speed){scene.world.speed=Number(target.dataset.speed);scene.world.paused=false}
    if(target.dataset.build){scene.chooseBuild(target.dataset.build as BuildingKind);tray=false}
    if(target.dataset.policy)scene.world.setPolicy(target.dataset.policy as 'equal'|'privileged');
    if(target.dataset.choice){scene.world.choose(Number(target.dataset.choice));if(!scene.world.event)closeModal()}
    if(target.dataset.recruit)scene.world.recruit(target.dataset.recruit as Species);
    if(target.dataset.art)showModal('art-'+target.dataset.art,`<div class="dialog-header"><h2>Archiwum folwarku</h2>${button('library','Powrot do ksiegi','arrow-left')}${button('close','Zamknij','x')}</div><img class="full-art" src="${assetUrl(target.dataset.art)}" alt="${target.dataset.art}">`);
    switch(action){
      case 'main-menu':if(modal.open){modal.close();modalKey=''}menu.show();break;
      case 'saves':menu.show('saves');break;
      case 'insulate':insulate(scene.world);break;
      case 'confirm-edict':if(pendingEdict)issueEdict(scene.world,pendingEdict);pendingEdict=null;closeModal();break;
      case 'contract':showModal('contract',`<div class="dialog-header"><h2>Cena jednego zycia</h2>${button('close','Anuluj kontrakt','x')}</div><p>Ludzie oferuja 100 zboza i 30 monet za pracownika. Wybrana osoba opusci folwark bezpowrotnie. Zaufanie spadnie o 25, uczciwosc rady o 35. Zapasy przyjada karawana.</p><label class="regime-select">Pracownik<select id="contract-unit">${scene.world.living.filter(a=>!['pig','dog'].includes(a.species)).map(a=>`<option value="${a.id}">${escapeHtml(a.name)} / ${speciesNames[a.species]}</option>`).join('')}</select></label><div class="dialog-actions"><button data-action="close">Odmow</button><button class="danger-action" data-action="confirm-contract">Oddaj ludziom bezpowrotnie</button></div>`);break;
      case 'confirm-contract':sendConvoy(scene.world,'dwor','contract',el<HTMLSelectElement>('contract-unit').value);closeModal();break;
      case 'pan':scene.cancelMode();scene.mode='pan';break;
      case 'road-dirt':case 'road-stone':scene.chooseRoad(action==='road-dirt'?'dirt':'stone');tray=false;break;
      case 'erase-road':scene.cancelMode();scene.mode='erase-road';tray=false;break;
      case 'patrol':case 'guard':scene.cancelMode();scene.mode=action;break;
      case 'build-order':scene.world.command(scene.selected,'build');break;
      case 'unload':scene.world.command(scene.selected,'unload');break;
      case 'idle-select':scene.selected=scene.world.living.filter(a=>!a.job&&!a.path.length&&a.task==='idle').map(a=>a.id);scene.selectedBuilding=null;break;
      case 'trade-buy':case 'trade-sell':scene.world.tradeResource(el<HTMLSelectElement>('trade-resource').value as Resource,action==='trade-buy');break;
      case 'continue-sandbox':scene.world.scenario='sandbox';scene.world.outcome=null;closeModal();break;
      case 'pause':scene.world.paused=!scene.world.paused;break;
      case 'center':scene.center();break;case 'zoom-in':scene.zoomBy(.15);break;case 'zoom-out':scene.zoomBy(-.15);break;
      case 'fullscreen':if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>scene.world.notify('Pelny ekran jest niedostepny.'));break;
      case 'move':scene.cancelMode();scene.mode='move';break;
      case 'harvest':case 'wood':case 'stone':scene.world.assign(scene.selected,action);break;
      case 'eat':scene.world.order(scene.selected,'eating');break;case 'rest':scene.world.order(scene.selected,'resting');break;case 'stop':scene.world.order(scene.selected,'idle');break;
      case 'build':tray=!tray;break;
      case 'close-tray':tray=false;break;
      case 'select-all':scene.selected=scene.world.living.map(a=>a.id);scene.selectedBuilding=null;break;
      case 'save':save();break;case 'load':load('folwark-save');break;case 'auto-load':load('folwark-autosave');break;
      case 'settings':options();break;case 'close':case 'resume':closeModal();break;
      case 'sound':sound=!sound;if(sound)beep();modalKey='';options();break;
      case 'feast':scene.world.feast();break;case 'buy':scene.world.trade(true);break;case 'sell':scene.world.trade(false);break;
      case 'restart-confirm':showModal('restart',`<div class="dialog-header"><h2>Nowy folwark?</h2>${button('close','Anuluj','x')}</div><p>Obecna rozgrywka zostanie zakonczona. Reczny zapis gry pozostanie dostepny.</p><div class="dialog-actions"><button data-action="close">Anuluj</button><button data-action="restart">Dawna kampania: 7 dni</button><button class="primary" data-action="restart-survival">Przetrwanie: 10 dni</button><button class="primary" data-action="restart-sandbox">Tryb swobodny</button></div>`);break;
      case 'restart':case 'restart-sandbox':case 'restart-survival':scene.world=new World(action==='restart'?'campaign':action==='restart-survival'?'survival':'sandbox');scene.resetViews();scene.selected=['unit-100'];scene.selectedBuilding=null;scene.mode='select';lastRoster='';activeTab='mission';closeModal();break;
      case 'library':
        showModal('library',`<div class="dialog-header"><div><span class="chapter">ARCHIWUM WIZUALNE</span><h2>Ksiega folwarku</h2></div>${button('close','Zamknij ksiege','x')}</div><div class="gallery">${sheets.map((s,i)=>`<button data-art="${s}"><img src="${assetUrl(s)}" alt="${s}" loading="lazy"><span>${String(i+1).padStart(2,'0')} / ${s.replaceAll('-',' ')}</span></button>`).join('')}</div>`);break;
    }
    render();
  });
  modal.addEventListener('cancel',e=>{e.preventDefault();if(!scene.world.event&&!scene.world.outcome)closeModal()});
  document.addEventListener('close-panel',()=>{tray=false;if(modal.open&&!scene.world.event&&!scene.world.outcome)closeModal();render()});
  el<HTMLCanvasElement>('minimap').addEventListener('pointerdown',e=>{
    const r=(e.currentTarget as HTMLElement).getBoundingClientRect();scene.cameras.main.centerOn((e.clientX-r.left)/r.width*WIDTH,(e.clientY-r.top)/r.height*HEIGHT);
  });
  let sidebarSignature='',traySignature='';
  function render(){
    const w=scene.world;
    const ch=chapter(w);el('chapter-label').textContent='ROZDZIAL '+ch[0];el('chapter-title').textContent=ch[1];
    el('crisis-objective').textContent=nextObjective(w);el('crisis-heat').textContent=w.scenario==='survival'?temperature(w)+' C / Cieplo '+Math.round(w.regime.heat*100)+'%':'';el('crisis-deadline').textContent=w.scenario==='survival'?'Dzien '+w.day+' / 10':'Dzien '+w.day;
    el('season-label').textContent=w.season.toUpperCase();
    for(const k of ['grain','wood','stone','gold','bread','tools'] as Resource[])el('res-'+k).textContent=Math.floor(w.get(k)).toLocaleString(locale());
    el('res-grain').parentElement!.parentElement!.title='Zboze: '+Math.floor(w.economy.grain)+' / '+w.capacity;
    el('day-label').textContent='Dzien '+w.day+(w.scenario==='campaign'?' / 7':'');
    el('scenario-label').textContent=w.scenario==='survival'?'PRZETRWANIE I WLADZA':w.scenario==='campaign'?'SIEDEM DNI DO ZIMY':'WOLNY FOLWARK';
    const hour=Math.floor((w.time%DAY_SECONDS)/DAY_SECONDS*24);
    el('day-clock').textContent=innerWidth<=700?'Dzien '+w.day:String(hour).padStart(2,'0')+':00';
    el('day-fill').style.width=((w.time%DAY_SECONDS)/DAY_SECONDS*100)+'%';
    el('map-weather').textContent=w.season+(hour<6||hour>20?'. Cicha noc.':hour<12?'. Spokojny poranek.':'. Czas pracy.');
    el('population').textContent=w.living.length+'/'+w.populationCap;
    el('population-map').textContent=w.living.length+' MIESZKANCOW  /  '+w.buildings.length+' BUDYNKOW';
    el('selection-count').textContent=scene.selected.length?scene.selected.length+' wybrano':'';
    document.querySelectorAll<HTMLButtonElement>('.order-buttons button').forEach(b=>b.disabled=b.dataset.action!=='idle-select'&&(!scene.selected.length||!!w.outcome));
    document.querySelector('[data-action="pan"]')?.classList.toggle('active',scene.mode==='pan');
    const pause=document.querySelector<HTMLButtonElement>('[data-action="pause"]')!;pause.classList.toggle('active',w.paused);pause.innerHTML=icon(w.paused?'play':'pause');
    document.querySelectorAll<HTMLElement>('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===w.speed));
    document.querySelectorAll<HTMLElement>('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
    el('paused-banner').hidden=!w.paused||!!w.event||modal.open;
    el('mode-banner').hidden=scene.mode==='select';
    el('mode-banner').textContent=scene.mode==='build'?buildingDefs[scene.buildKind].name:scene.mode==='road'?(scene.roadKind==='dirt'?'Droga ziemna':'Droga kamienna')+(scene.roadStart?' / koniec odcinka':' / poczatek odcinka'):({select:'',pan:'Przesuwanie mapy',move:'Przemieszczenie',patrol:'Obszar patrolu',guard:'Miejsce warty','erase-road':'Usuwanie drog'})[scene.mode];
    const unrest=Math.round(w.politics.unrest*100);
    el('unrest-value').textContent=unrest+'%';el<HTMLMeterElement>('unrest-meter').value=unrest;
    el('unrest-label').textContent=unrest<25?(w.living.some(a=>a.fear>.4)?'Cisza nie oznacza zgody':'Na razie bez protestow'):unrest<45?'Wsrod mieszkancow narasta niepokoj':'Na placu zbieraja sie protestujacy';
    el('goals').innerHTML=[['Zapasy zboza',Math.floor(w.economy.grain)+' / 350',w.economy.grain>=350],['Nowe budynki',w.built+' / 3',w.built>=3],['Niepokoje ponizej 35%',unrest+'%',unrest<35]].map(([label,value,ok])=>`<div class="goal ${ok?'complete':''}"><span>${icon(ok?'circle-check':'circle')}${label}</span><b>${value}</b></div>`).join('');
    if(w.scenario==='survival')el('goals').innerHTML=`<div class="goal"><span>Zywi mieszkancy</span><b>${w.living.length} / min. 8</b></div><div class="goal"><span>Cieplo na koniec zimy</span><b>${Math.round(w.regime.heat*100)}% / min. 40%</b></div><div class="goal"><span>Ofiary / oddani ludziom</span><b>${w.regime.deaths.length} / ${w.regime.sold.length}</b></div>`;
    const roster=w.living.map(a=>a.id+scene.selected.includes(a.id)).join('');
    if(roster!==lastRoster){el('roster').innerHTML=w.living.map(a=>`<button class="resident ${scene.selected.includes(a.id)?'selected':''}" data-unit="${a.id}" title="${a.name} / ${speciesNames[a.species]}" aria-label="Wybierz: ${a.name}">${art('portrait-'+a.species)}</button>`).join('');lastRoster=roster}
    let html='';
    if(activeTab==='propaganda'){html=propagandaPanel(w)}else if(activeTab==='neighbors'){html=neighborsPanel(w,selectedNeighbor)}else if(activeTab==='mission'&&w.scenario==='survival'){html=survivalPanel(w)}else if(activeTab==='unit'){
      const a=w.living.find(a=>a.id===scene.selected[0]),b=w.buildings.find(b=>b.id===scene.selectedBuilding);
      if(a)html=`<div class="unit-summary"><span class="eyebrow">MIESZKANIEC FOLWARKU</span><div class="unit-portrait">${art('portrait-'+a.species)}</div><h2>${a.name}</h2><span class="unit-role">${speciesNames[a.species]}</span><div class="current-task"><span class="live-dot"></span>${a.job==='harvest'&&a.task==='idle'&&w.economy.grain>=w.capacity-.1?'Magazyn pelny':taskNames[a.task]}${a.queue.length?' / kolejka '+a.queue.length:''}</div></div>
        <div class="stats">${bar('Zdrowie',a.health*100,'green')}${bar('Glod',a.hunger*100,'gold')}${bar('Zmeczenie',a.fatigue*100,'blue')}${bar('Lojalnosc',a.loyalty*100,'green')}${bar('Krzywda',a.grievance*100,'red')}</div>
        <div class="cargo"><span>${icon('package')} Niesiony ladunek</span><b>${Math.floor(a.carriedGrain+a.load)} / ${a.carryCapacity}</b></div>`;
      else if(b)html=`<div class="building-summary"><span class="eyebrow">ZABUDOWA FOLWARKU</span><div class="building-art">${art(buildingDefs[b.kind].art)}</div><h2>${buildingDefs[b.kind].name}</h2><p>${buildingDefs[b.kind].description}</p><div class="current-task">${b.progress<1?'Budowa: '+Math.floor(b.progress*100)+'%':'Gotowy do pracy'}</div></div>${b.kind==='house'?`<div class="recruit"><span class="section-heading">NOWI MIESZKANCY / 35 ZBOZA + 15 MONET</span><div>${(['horse','sheep','hen','goat'] as Species[]).map(s=>`<button data-recruit="${s}" title="Przyjmij: ${speciesNames[s]}" aria-label="Przyjmij: ${speciesNames[s]}">${art('portrait-'+s)}</button>`).join('')}</div></div>`:''}${buildingControls(w,b)}`;
      else html=`<div class="settlement-summary"><span class="eyebrow">WSPOLNOTA</span>${art('house')}<h2>Folwark zwierzat</h2><p>Wolnosc zaczyna sie od pelnej stodoly.</p><div class="overview-numbers"><span><b>${w.living.length}</b>mieszkancow</span><span><b>${w.buildings.length}</b>budynkow</span></div></div>`;
    }else if(activeTab==='economy'){html=economyPanel(w)}else if(activeTab==='research'){html=researchPanel(w)}else if(activeTab==='council'){
      html=`<div class="council"><span class="eyebrow">DECYZJE WSPOLNOTY</span><h2>Przy wspolnym stole</h2><p class="muted">Racje zywnosciowe</p><div class="policy-options"><button data-policy="equal" class="${w.politics.rationPolicy==='equal'?'selected':''}">${icon('scale')}<span>Rowne racje</span></button><button data-policy="privileged" class="${w.politics.rationPolicy==='privileged'?'selected':''}">${icon('crown')}<span>Przywileje rady</span></button></div><button class="wide-action" data-action="feast" title="40 zboza. Mniej glodu i krzywdy.">${icon('utensils')} Wspolny posilek <b>40 ${art('wheat')}</b></button>${lawsPanel(w,tradeChoice)}<h3>Wymiana zboza</h3><button class="wide-action" data-action="buy">${icon('shopping-basket')} Kup 50 zboza <b>15 ${art('gold')}</b></button><button class="wide-action" data-action="sell">${icon('coins')} Sprzedaj 40 zboza <b>+12 ${art('gold')}</b></button><h3>Nowi mieszkancy</h3><div class="recruit"><div>${(['horse','sheep','hen','goat'] as Species[]).map(s=>`<button data-recruit="${s}" title="Przyjmij: ${speciesNames[s]}. 35 zboza, 15 monet." aria-label="Przyjmij: ${speciesNames[s]}">${art('portrait-'+s)}</button>`).join('')}</div></div></div>`;
    }else if(activeTab==='mission'){html=`<div class="mission-summary"><span class="eyebrow">${w.scenario==='campaign'?'SIEDEM DNI DO ZIMY':'ROZWOJ WSPOLNOTY'}</span><h2>Wspolna przyszlosc</h2><p>${w.season} / Dzien ${w.day}</p><div class="mission-goals">${el('goals').innerHTML}</div><p>${w.scenario==='campaign'?'O swicie dnia 8: 350 zboza, trzy nowe budynki i niepokoje ponizej 35%.':'Tryb swobodny. Wspolnota rozwija sie bez koncowej daty. Zima ogranicza odrost plonow.'}</p><div class="mission-unrest">Niepokoje: ${unrest}% / Mieszkancy: ${w.living.length}</div></div>`;
    }else html=`<div class="journal"><span class="eyebrow">PAMIETAMY</span><h2>Kronika folwarku</h2>${w.journal.map(entry=>`<article><span>DZIEN ${entry.day}</span><p>${escapeHtml(entry.text)}</p></article>`).join('')}</div>`;
    if(html!==sidebarSignature&&document.activeElement?.tagName!=='SELECT'){el('inspector').innerHTML=html;sidebarSignature=html}
    el('build-tray').hidden=!tray;
    if(tray){
      const signature=[w.resources.wood,w.resources.stone,w.economy.grain,w.resources.gold,w.resources.tools].map(Math.floor).join('/');
      if(signature!==traySignature){el('build-tray').innerHTML=`<div class="tray-heading"><div><span class="eyebrow">WZNIESMY COS WSPOLNIE</span><h2>Rozbudowa folwarku</h2></div>${button('close-tray','Zamknij budowanie','x')}</div><div class="road-tools"><button data-action="road-dirt" title="Droga ziemna: 1 drewno / 35 krokow, +30% predkosci">${icon('route')} Droga ziemna</button><button data-action="road-stone" title="Droga kamienna: kamien i drewno, +65% predkosci">${icon('milestone')} Droga kamienna</button><button data-action="erase-road" title="Usun wybudowany odcinek drogi">${icon('eraser')}</button></div><div class="build-grid">${buildableKinds.map(kind=>`<button data-build="${kind}" ${w.canPay(buildingDefs[kind].cost)?'':'disabled'} title="${buildingDefs[kind].description}"><span class="build-art">${art(buildingDefs[kind].art)}</span><b>${buildingDefs[kind].name}</b><span class="cost">${cost(kind)}</span></button>`).join('')}</div>`;traySignature=signature}
    }
    if(w.toastSerial!==lastToast){el('toast').textContent=w.toast;el('toast').hidden=!w.toast;lastToast=w.toastSerial;el('toast').classList.remove('show');void el('toast').offsetWidth;el('toast').classList.add('show')}
    if(w.event&&!scene.menuOpen)showModal('event-'+w.event.title,`<div class="event-art">${art('pig')}</div><div class="dialog-header"><span class="chapter">DZIEN ${w.day} / DECYZJA RADY</span>${button('main-menu','Menu glowne','menu')}</div><h2>${escapeHtml(w.event.title)}</h2><p>${escapeHtml(w.event.text)}</p><div class="event-choices">${w.event.choices.map((c,i)=>`<button data-choice="${i}" ${Object.entries(c.effect).every(([k,v])=>v>=0||w.get(k as Resource)>=-v)?'':'disabled'}>${escapeHtml(c.label)}${icon('chevron-right')}</button>`).join('')}</div>`);
    if(w.outcome&&!scene.menuOpen)showModal('outcome',`<div class="outcome-art">${art(w.outcome==='Wspolna przyszlosc'?'house':'unrest')}</div><span class="chapter">KRONIKA PIERWSZEJ JESIENI</span><h2>${w.outcome}</h2><p>${w.scenario==='survival'?(w.outcome==='Folwark przetrwal'?(w.regime.integrity>.55?'Zima minela. Folwark ocalal bez porzucenia wszystkich zasad.':'Zima minela. Folwark ocalal, lecz rada zaczela przypominac dawnych panow.'):'Rada nie utrzymala wspolnoty. Glod, zimno, straty i niepokoje maja rzeczywiste konsekwencje.'):(w.outcome==='Wspolna przyszlosc'?'Zapasow wystarczy na zime. Folwark przetrwal dzieki wspolnej pracy.':'Kampania wymagala 350 zboza, trzech nowych budynkow i niepokojow ponizej 35%.')}</p><div class="end-stats"><span>${Math.floor(w.economy.grain)} zboza</span><span>${w.built} nowych budynkow</span><span>${unrest}% niepokojow</span></div>${w.day>=8&&w.living.length>=6&&w.politics.unrest<.8?'<button class="primary" data-action="continue-sandbox">Graj dalej w trybie swobodnym</button>':''}<button data-action="restart-confirm">Nowy folwark</button><button data-action="main-menu">Menu glowne</button>`);
    localizeDOM(el('shell'));drawMinimap(scene);paintIcons();
  }
  const menu=attachStartMenu(scene,w=>{scene.world=w;scene.resetViews();scene.selected=w.living[0]?[w.living[0].id]:[];scene.selectedBuilding=null;lastRoster='';activeTab='mission'},p=>{setLanguage(p.language);queueMicrotask(()=>{lastRoster='';sidebarSignature='';traySignature='';lastToast=-1;if(scene.cameras?.main)render();else localizeDOM(el('shell'))});scene.edgeScroll=p.edgeScroll;scene.cameraSpeed=p.cameraSpeed;scene.reducedMotion=p.reducedMotion;scene.autosaveSeconds=p.autosaveSeconds;sound=p.sound;volume=p.volume;document.body.classList.toggle('reduced-motion',p.reducedMotion)});
  scene.onChange=render;scene.onReady=()=>{render();menu.ready()};
}
function paintIcons(){createIcons({icons,attrs:{'stroke-width':1.65}})}
function beep(){audio??=new AudioContext();void audio.resume();const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.type='sine';oscillator.frequency.value=440;gain.gain.setValueAtTime(.05*volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);oscillator.start();oscillator.stop(audio.currentTime+.1)}
function drawMinimap(scene:FarmScene){
  const canvas=el<HTMLCanvasElement>('minimap'),ctx=canvas.getContext('2d')!;ctx.fillStyle='#3b4935';ctx.fillRect(0,0,210,140);
  const sx=210/WIDTH,sy=140/HEIGHT;ctx.fillStyle='#477478';ctx.beginPath();ctx.ellipse(pond.x*sx,pond.y*sy,pond.rx*sx,pond.ry*sy,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#b6a071';ctx.lineWidth=1;for(const path of [...roads,...scene.world.roads.map(r=>r.points)]){ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x*sx,y*sy):ctx.moveTo(x*sx,y*sy));ctx.stroke()}
  for(const b of scene.world.buildings){ctx.fillStyle=b.kind==='field'?'#c1a157':'#d0c4a6';ctx.fillRect(b.x*sx-4,b.y*sy-3,8,6)}
  for(const a of scene.world.living){ctx.fillStyle=scene.selected.includes(a.id)?'#fff6c8':a.task==='protesting'?'#ec6b55':'#9ac789';ctx.beginPath();ctx.arc(a.x*sx,a.y*sy,2,0,Math.PI*2);ctx.fill()}
  for(const n of neighborSites){ctx.fillStyle='#bc806b';ctx.fillRect(n.x*sx-4,n.y*sy-3,8,6)}
  for(const c of scene.world.regime.convoys){ctx.fillStyle='#f1d38e';ctx.fillRect(c.x*sx-2,c.y*sy-2,4,4)}
  const c=scene.cameras.main;if(c){ctx.fillStyle='#c9d9ea';ctx.fillRect(cityGate.x*sx-3,cityGate.y*sy-4,6,8);ctx.strokeStyle='#dfc987';ctx.lineWidth=1;ctx.strokeRect(c.worldView.x*sx,c.worldView.y*sy,c.worldView.width*sx,c.worldView.height*sy)}
}
