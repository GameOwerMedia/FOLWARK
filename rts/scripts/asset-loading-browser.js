async page=>{
 const url='http://127.0.0.1:5177/',errors=[],attempts=[];
 await page.unrouteAll({behavior:'wait'});
 page.on('pageerror',error=>errors.push(error.message));
 let mode='xhr';
 const target=/sprites-prepared|terrain-higgsfield/;
 await page.route('**/assets/*.png*',async route=>{
  const request=route.request(),key=request.url(),kind=request.resourceType();
  if(target.test(key)){
   attempts.push({mode,kind,url:key});
   if(mode==='all'||mode==='xhr'&&kind==='xhr')return route.abort();
   if(mode==='invalid'&&kind==='xhr')return route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="black"/></svg>'});
  }
  return route.continue();
 });
 await page.setViewportSize({width:1608,height:931});
 await page.goto(url);await page.locator('#loading').waitFor({state:'detached',timeout:60000});
 const healthy=async()=>{const result=await page.evaluate(()=>{
  const s=window.folwark.scene;
  return {
   sizes:['sprites-prepared','terrain-materials','meadow-fine'].map(k=>{const t=s.textures.get(k);return [k,t.key,t.source[0].width,t.source[0].height]}),
   missingFrames:s.textures.get('__MISSING').frameTotal,
   invalid:s.children.list.filter(o=>o.texture?.key==='__MISSING').length,
   ready:!!s.ghost,units:s.world.living.length
  };
 });if(!result.ready||result.invalid||result.missingFrames!==1||result.sizes.some(([key,actual,w,h])=>key!==actual||w<256||h<256))throw Error(JSON.stringify(result));return result};
 const automatic=await healthy();
 mode='invalid';await page.reload();await page.locator('#loading').waitFor({state:'detached',timeout:60000});await healthy();
 if(!attempts.some(r=>r.kind==='image'&&r.url.includes('retry=')))throw Error('Native recovery not used');
 await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="language"]').selectOption('en');await page.locator('[data-menu="main"]').click();
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="sandbox"]').click();
 await page.locator('[data-action="save"]').click();
 const saved=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('save')))));
 mode='all';await page.reload();await page.locator('#loading[data-state="error"]').waitFor({timeout:60000});
 if(await page.evaluate(()=>!!folwark.scene.ghost||folwark.game.textures.exists('terrain')||!document.querySelector('#start-menu').inert))throw Error('Broken scene/menu started');
 if(!(await page.locator('#loading').innerText()).includes('Your saved game is safe'))throw Error('English error absent');
 if(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('save')))))!==saved)throw Error('Save changed on failed load');
 await page.screenshot({path:'output/playwright/assets-error.png'});
 // A repeated failure must stay recoverable without duplicate scene creation.
 await page.locator('[data-retry-assets]').click();await page.locator('#loading[data-state="error"]').waitFor({timeout:60000});
 mode='none';await page.locator('[data-retry-assets]').click();await page.locator('#loading').waitFor({state:'detached',timeout:60000});
 await healthy();await page.locator('[data-menu="continue"]').click();
 await page.evaluate(()=>{folwark.scene.world.paused=true;folwark.scene.onChange()});
 await page.waitForTimeout(300);
 const pixels=await page.evaluate(()=>new Promise(resolve=>folwark.game.renderer.snapshot(img=>{
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
  const p=ctx.getImageData(0,0,c.width,c.height).data;let green=0,visible=0;
  for(let i=0;i<p.length;i+=4){if(p[i]<20&&p[i+1]>220&&p[i+2]<20)green++;if(p[i]+p[i+1]+p[i+2]>90)visible++}
  resolve({green,visible,total:p.length/4});
 })));
 if(pixels.green>10||pixels.visible<pixels.total*.1)throw Error('Placeholder/blank canvas '+JSON.stringify(pixels));
 for(const[width,height]of [[1608,931],[1280,720],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  const fits=await page.evaluate(()=>{const sidebar=document.querySelector('.sidebar').getBoundingClientRect(),canvas=folwark.game.canvas.getBoundingClientRect(),panel=document.querySelector('#world-panel').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&sidebar.right<=innerWidth+1&&Math.abs(canvas.width-panel.width)<2});
  if(!fits)throw Error('Layout overflow: '+width);
  await page.screenshot({path:'output/playwright/assets-recovered-'+width+'.png'});
 }
 mode='none';await page.unrouteAll({behavior:'wait'});
 if(errors.length)throw Error(errors.join('\n'));
 return {automatic,invalidDimensionsRecovered:true,permanentFailureBlocked:true,repeatedRetry:true,manualRecovery:true,savePreserved:true,pixels,viewports:3,errors};
}
