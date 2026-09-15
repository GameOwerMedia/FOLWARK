async page=>{
 await page.goto('http://127.0.0.1:5177');await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('folwark-options')||'{}');delete p.language;localStorage.setItem('folwark-options',JSON.stringify(p))});
 await page.reload();await page.locator('#loading').waitFor({state:'detached'});await page.setViewportSize({width:1440,height:960});
 await page.screenshot({path:'output/playwright/english-title.png'});
 const menu=await page.locator('#start-menu').innerText();
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{window.folwark.scene.world.paused=true;window.folwark.scene.onChange()});
 await page.screenshot({path:'output/playwright/english-game.png'});
 const panels={};
 for(const tab of ['mission','unit','economy','research','council','propaganda','neighbors','journal']){
 await page.locator('[data-tab="'+tab+'"]').click();panels[tab]=await page.locator('#inspector').innerText();
 }
 return {lang:await page.locator('html').getAttribute('lang'),menu,panels};
}
