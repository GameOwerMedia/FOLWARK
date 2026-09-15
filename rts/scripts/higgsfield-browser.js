async page => {
 const requests=[];page.on('request',r=>requests.push(r.url()));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:960});await page.goto('http://127.0.0.1:5177');await page.locator('#loading').waitFor({state:'detached'});await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="language"]').selectOption('pl');await page.locator('[data-menu="main"]').click();
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 const result=await page.evaluate(()=>{
  const s=window.folwark.scene,w=s.world;w.paused=true;s.edgeScroll=false;
  const image=s.textures.get('terrain-materials').getSourceImage();
  if(image.width!==2048||image.height!==2048)throw Error('Terrain is not 2K');
  const frame=time=>{w.time=time;s.update(0,0);return {water:JSON.stringify(s.atmosphere.water.commandBuffer),wind:s.decoration[0].rotation}};
  const a=frame(0),b=frame(2),paused=frame(2),noon=frame(32.5);
  if(a.water===b.water)throw Error('Water is static');
  if(b.water!==paused.water||b.wind!==paused.wind)throw Error('Pause does not freeze atmospheric motion');
  if(s.atmosphere.light)throw Error('Rectangular light overlay returned');
  w.time=18;s.update(0,0);s.center();s.onChange();
  return {texture:[image.width,image.height],waterAnimated:true,pauseStable:true,noRectangularOverlay:true};
 });
 if(!requests.some(url=>url.includes('/assets/terrain-higgsfield.png')))throw Error('Higgsfield atlas was not loaded');
 await page.screenshot({path:'output/playwright/higgsfield-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.locator('[data-action="center"]').click();
 await page.screenshot({path:'output/playwright/higgsfield-mobile.png'});
 if(errors.length)throw Error(errors.join('\n'));return {...result,errors};
}
