async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(fn,msg)=>{if(!await page.evaluate(fn))throw Error(msg)};
 const ready=async()=>{await page.goto('http://127.0.0.1:5177');await page.locator('#loading').waitFor({state:'detached'});await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="language"]').selectOption('pl');await page.locator('[data-menu="main"]').click();};
 await page.setViewportSize({width:1440,height:960});await ready();
 await check(()=>window.folwark.scene.menuOpen&&window.folwark.scene.world.paused,'Start menu does not pause');
 await page.waitForTimeout(300);await check(()=>window.folwark.scene.world.time===0,'Simulation runs behind menu');
 await page.locator('[data-menu="options"]').click();await page.getByLabel('Przesuwanie przy krawedzi',{exact:true}).uncheck();
 await page.getByLabel('Ograniczone animacje',{exact:true}).check();await page.locator('[data-pref="autosaveSeconds"]').selectOption('60');
 await page.getByLabel('Szybkosc kamery',{exact:true}).focus();await page.keyboard.press('ArrowRight');
 await check(()=>window.folwark.scene.cameraSpeed>.7&&!window.folwark.scene.edgeScroll&&window.folwark.scene.reducedMotion,'Options not applied');
 await ready();await page.locator('[data-menu="options"]').click();
 if(!await page.getByLabel('Ograniczone animacje',{exact:true}).isChecked())throw Error('Options not persistent');
 await page.getByLabel('Ograniczone animacje',{exact:true}).uncheck();
 await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="sandbox"]').click();
 await page.evaluate(()=>{const w=window.folwark.scene.world;w.paused=true;w.resources.gold=123});
 await page.locator('[data-action="saves"]').click();await page.locator('[data-save-slot="slot-1"]').click();
 if(await page.locator('[data-menu="confirm"]').count())await page.locator('[data-menu="confirm"]').click();
 await page.evaluate(()=>{window.folwark.scene.world.resources.gold=5});
 await page.locator('[data-load-slot="slot-1"]').click();await page.evaluate(()=>window.folwark.scene.world.paused=true);
 await check(()=>Math.abs(window.folwark.scene.world.resources.gold-123)<1,'Slot load failed');
 await page.locator('[data-action="main-menu"]').click();
 await page.waitForTimeout(200);await check(()=>window.folwark.scene.world.paused,'Menu did not pause current game');
 await page.locator('[data-menu="saves"]').click();
 await page.locator('[data-delete-slot="slot-1"]').click();await page.locator('[data-menu="cancel"]').click();await page.locator('[data-menu="saves"]').click();
 if(await page.locator('[data-load-slot="slot-1"]').isDisabled())throw Error('Cancel deleted save');

 await page.locator('#save-import').setInputFiles('output/playwright/import-bad.json');
 await page.waitForTimeout(150);await check(()=>window.folwark.scene.menuOpen&&window.folwark.scene.world.resources.gold>122,'Bad import replaced world');
 await page.locator('#save-import').setInputFiles('output/playwright/import-good.json');
 await page.locator('[data-menu="confirm"]').click();
 await page.evaluate(()=>window.folwark.scene.world.paused=true);
 await page.locator('[data-action="saves"]').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-menu="export"]').click();const download=await downloadPromise;
 if(!download.suggestedFilename().endsWith('.json'))throw Error('Export missing');
 await page.screenshot({path:'output/playwright/save-slots.png'});
 await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="continue"]').click();
 await page.getByRole('button',{name:'Sasiedzi',exact:true}).click();
 await page.locator('[data-neighbor-focus="city"]').click();
 await page.locator('[data-city-order="wood"]').click();
 await check(()=>window.folwark.scene.world.regime.convoys.some(c=>c.neighbor==='city'),'City dispatch failed');
 await page.evaluate(()=>{
  const s=window.folwark.scene,w=s.world;w.order(w.living.map(a=>a.id),'idle');w.paused=false;
  for(let i=0;i<1000;i++){if(w.event)w.choose(0);w.tick(.1);if(w.regime.convoys[0]?.state==='abroad')break}
  w.paused=true;s.onChange();s.update(0,0);
 });
 await check(()=>window.folwark.scene.world.regime.convoys[0]?.state==='abroad','Caravan did not enter city');
 await check(()=>window.folwark.scene.world.region.settlements.some(n=>n.cycles>0),'Neighbors do not produce');
 await page.screenshot({path:'output/playwright/city-road.png'});
 await page.evaluate(()=>{
  const s=window.folwark.scene,w=s.world;w.paused=false;
  for(let i=0;i<1600&&w.regime.convoys.length;i++){if(w.event)w.choose(0);w.tick(.1)}
  w.paused=true;s.onChange();
 });
 await check(()=>window.folwark.scene.world.regime.convoys.length===0,'City cargo not delivered');
 await page.locator('[data-neighbor-focus="mlyn"]').click();await page.screenshot({path:'output/playwright/living-neighbor.png'});
 const layouts=[];
 for(const [width,height]of [[390,844],[360,740],[1280,720],[1920,1080]]){
  await page.setViewportSize({width,height});await page.locator('[data-action="main-menu"]').click();await page.waitForTimeout(100);
  await check(()=>document.documentElement.scrollWidth<=innerWidth,'Menu horizontal overflow');
  await page.screenshot({path:'output/playwright/menu-'+width+'.png'});
  await page.locator('[data-menu="options"]').click();
  await check(()=>document.querySelector('.menu-options').getBoundingClientRect().right<=innerWidth,'Options overflow');
  await page.screenshot({path:'output/playwright/options-'+width+'.png'});
  await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="continue"]').click();await page.waitForTimeout(100);
  await check(()=>{const s=window.folwark.scene,r=document.querySelector('#game').getBoundingClientRect();return Math.abs(s.scale.width-r.width)<2&&Math.abs(s.scale.height-r.height)<2},'Canvas size not restored');
  layouts.push(width);
 }
 await page.setViewportSize({width:1440,height:960});
 if(errors.length)throw Error(errors.join('\n'));
 return {menu:true,persistentOptions:true,slotSaveLoad:true,importExport:true,corruptImportSafe:true,cityRoundTrip:true,autonomousProduction:true,layouts,errors};
}
