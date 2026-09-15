async page=>{
 const errors=[],failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));
 await page.unrouteAll({behavior:'wait'});await page.setViewportSize({width:1600,height:1000});
 await page.goto('https://gameowermedia.github.io/FOLWARK/');
 await page.locator('#loading').waitFor({state:'detached',timeout:90000});
 const release=await page.locator('script[type="module"]').getAttribute('src');
 if(!release.includes('DKs1NxnZ'))throw Error('Stale release: '+release);
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{const s=folwark.scene;s.edgeScroll=false;s.autosaveSeconds=0;s.world.paused=true;s.center()});
 const initial=await page.evaluate(()=>folwark.scene.world.snapshot());
 const views=[];
 for(const [name,day]of [['autumn',0],['winter',6],['spring',13],['summer',20]]){
  await page.evaluate(day=>{folwark.scene.world.time=day*65;folwark.scene.onChange()},day);await page.waitForTimeout(350);
  const result=await page.evaluate(()=>{
   const s=folwark.scene,c=s.textures.get('terrain').getSourceImage();
   return {season:s.world.season,ground:Array.from(c.getContext('2d').getImageData(900,850,1,1).data),water:Array.from(c.getContext('2d').getImageData(340,960,1,1).data),missing:s.children.list.filter(v=>v.texture?.key==='__MISSING').length};
  });
  if(result.missing)throw Error('Missing artwork');views.push(result);
  await page.screenshot({path:'output/playwright/public-'+name+'.png'});
 }
 if(new Set(views.map(v=>v.ground.join(','))).size!==4||new Set(views.map(v=>v.water.join(','))).size!==4)throw Error('Seasons visually identical');
 await page.evaluate(initial=>{const w=folwark.scene.world;w.restore(initial);w.time=w.threats.nextAt-.02;w.paused=false;w.tick(.05);w.paused=true;folwark.scene.onChange()},initial);
 await page.locator('[data-action="threat-focus"]').first().click();
 await page.locator('[data-action="threat-respond"]').click();
 const dispatched=await page.evaluate(()=>folwark.scene.world.units.filter(a=>a.job==='guard'&&a.path.length).length);
 if(dispatched<1)throw Error('Guard order had no effect');
 const wood=await page.evaluate(()=>folwark.scene.world.resources.wood);
 await page.locator('[data-action="threat-supplies"]').click();
 if(Math.abs(await page.evaluate(()=>folwark.scene.world.resources.wood)-(wood-15))>.01)throw Error('Emergency supply payment');
 await page.evaluate(()=>{const w=folwark.scene.world;w.time=w.threats.active.deadline;w.paused=false;w.tick(.05);w.paused=true;folwark.scene.onChange()});
 await page.screenshot({path:'output/playwright/public-fire.png'});
 const pixels=await page.evaluate(()=>new Promise(resolve=>folwark.game.renderer.snapshot(img=>{
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const data=g.getImageData(0,0,c.width,c.height).data;let green=0,visible=0;
  for(let i=0;i<data.length;i+=4){if(data[i]<20&&data[i+1]>220&&data[i+2]<20)green++;if(data[i]+data[i+1]+data[i+2]>90)visible++}
  resolve({green,visible,total:data.length/4});
 })));
 if(pixels.green>10||pixels.visible<pixels.total*.3)throw Error('Broken rendered canvas');
 await page.locator('[data-action="save"]').click();
 const save=await page.evaluate(()=>folwark.scene.world.snapshot());
 await page.evaluate(save=>{folwark.scene.world.restore(save);folwark.scene.world.paused=true},save);
 if(await page.evaluate(()=>folwark.scene.world.snapshot().version)!==7)throw Error('Wrong save schema');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.screenshot({path:'output/playwright/public-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length||failures.length)throw Error(JSON.stringify({errors,failures}));
 await page.setViewportSize({width:1600,height:1000});
 return {release,views,dispatched,pixels,saveVersion:7,errors,failures};
}
