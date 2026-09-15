async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.context().route('http://**',r=>r.abort());
  await page.context().route('https://**',r=>r.abort());
  await page.goto('file:///C:/Users/OverJK/.codex/visualizations/2026/09/15/01a0a263-d875-7e62-bb38-af94e5742087/FOLWARK/rts/portable/GRAJ-FOLWARK.html');
  await page.locator('#loading').waitFor({state:'detached',timeout:30000});await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="language"]').selectOption('pl');await page.locator('[data-menu="main"]').click();
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
  await page.getByRole('button',{name:'Wybierz: Bokser',exact:true}).click();
  await page.getByRole('button',{name:'Wysrodkuj mape',exact:true}).click();
  await page.getByRole('button',{name:'Zapisz gre',exact:true}).click();
  const state=await page.evaluate(()=>({assets:Object.keys(window.FOLWARK_ASSETS).length,units:window.folwark.scene.world.living.length,time:window.folwark.scene.world.time,saved:!!localStorage.getItem('folwark-save'),scenario:window.folwark.scene.world.scenario,saveVersion:JSON.parse(localStorage.getItem('folwark-save')).state.version}));
  if(state.assets!==24||state.units!==22||!state.saved||state.scenario!=='survival'||state.saveVersion!==6)throw Error(JSON.stringify(state));
  await page.getByRole('button',{name:'Sasiedzi',exact:true}).click();
  if(await page.locator('.neighbor').count()!==3)throw Error('Offline neighbors missing');
  await page.getByRole('button',{name:'Ksiega folwarku',exact:true}).click();
  await page.locator('[data-art="cards-final"]').click();
  await page.locator('.full-art').evaluate(img=>img.decode());
  await page.getByRole('button',{name:'Zamknij',exact:true}).click();
  await page.screenshot({path:'output/playwright/offline.png'});
  await page.context().unroute('http://**');await page.context().unroute('https://**');
  if(errors.length)throw Error(errors.join('\n'));
  return {offline:true,networkBlocked:true,...state,errors};
}
