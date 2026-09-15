async page=>{
 const errors=[],seasons=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1600,height:1000});
 await page.goto('http://127.0.0.1:5177/');
 await page.locator('#loading').waitFor({state:'detached',timeout:60000});
 await page.locator('[data-menu="new"]').click();
 await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{const s=window.folwark.scene;s.world.paused=true;s.edgeScroll=false;s.autosaveSeconds=0;s.center()});
 for(const [season,day]of [['autumn',0],['winter',6],['spring',13],['summer',20]]){
  await page.evaluate(day=>{const s=window.folwark.scene;s.world.time=day*65;s.world.paused=true;s.onChange()},day);
  await page.waitForTimeout(600);
  await page.screenshot({path:'output/playwright/season-'+season+'.png'});
  const sample=await page.evaluate(()=>{
   const s=window.folwark.scene,c=s.textures.get('terrain').getSourceImage(),g=c.getContext('2d');
   return {season:s.world.season,ground:Array.from(g.getImageData(900,850,1,1).data),water:Array.from(g.getImageData(340,960,1,1).data),trees:s.decoration.filter(v=>v.texture.key==='winter-tree').length};
  });
  seasons.push(sample);
 }
 await page.evaluate(async()=>{
  const s=window.folwark.scene;s.world.time=0;
  const {announceThreat,tickThreats}=await import('/src/simulation/Threats.ts');
  announceThreat(s.world,'fire');s.world.time=31;tickThreats(s.world,.1);s.onChange();
 });
 await page.locator('[data-action="threat-focus"]').first().click();
 await page.waitForTimeout(400);
 await page.screenshot({path:'output/playwright/fire.png'});
 for(const [width,height]of [[390,844],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  await page.screenshot({path:'output/playwright/season-responsive-'+width+'.png'});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow '+width);
 }
 const state=await page.evaluate(()=>({season:window.folwark.scene.world.season,canvas:document.querySelector('canvas').width,missing:Object.values(window.folwark.scene.textures.list).filter(t=>t.key==='winter-tree').length,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(errors.length)throw Error(errors.join('\n'));
 if(new Set(seasons.map(s=>s.ground.join(','))).size!==4)throw Error('Terrain did not change every season');
 if(!seasons.find(s=>s.season==='Zima').trees)throw Error('Winter trees missing');
 return {errors,state,seasons};
}
