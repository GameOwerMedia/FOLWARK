async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1600,height:1000});
 await page.goto('http://127.0.0.1:5177/');
 await page.locator('#loading').waitFor({state:'detached',timeout:90000});
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{folwark.scene.world.paused=true;folwark.scene.edgeScroll=false;folwark.scene.autosaveSeconds=0});
 await page.locator('[data-tab="research"]').click();
 if(await page.locator('[data-research]').count()!==11)throw Error('Missing technology branches');
 await page.screenshot({path:'output/playwright/frontier-research.png'});
 await page.locator('[data-tab="neighbors"]').click();
 if(await page.locator('.foreign-farm').count()!==3)throw Error('Missing foreign governments');
 await page.screenshot({path:'output/playwright/frontier-diplomacy.png'});
 await page.evaluate(()=>{const s=folwark.scene;s.focus(s.world.units[0].id);s.world.progression.xp[s.world.units[0].id]=240;s.onChange()});
 await page.locator('[data-tab="unit"]').click();
 await page.locator('[data-talent="artisan"]').click();await page.locator('[data-talent="master"]').click();
 if(await page.evaluate(()=>folwark.scene.world.progression.talents[folwark.scene.world.units[0].id].length)!==2)throw Error('Talent controls');
 await page.screenshot({path:'output/playwright/frontier-character.png'});
 await page.locator('[data-action="build"]').click();
 await page.locator('[data-build="fenceH"]').click();
 await page.evaluate(()=>{const s=folwark.scene,w=s.world;s.cameras.main.centerOn(2150,1300);w.resources.wood=500;
  for(const [kind,x,y]of [['fenceH',2050,1200],['fenceH',2150,1200],['fenceH',2250,1200],['fenceV',2000,1250],['fenceV',2000,1350],['fenceV',2300,1250],['fenceV',2300,1350],['fenceH',2050,1400],['fenceH',2250,1400],['gateH',2150,1400]]){
   if(!w.build(kind,x,y))throw Error('Fence placement');w.buildings.at(-1).progress=1;
  }
  w.rebuildGrid();s.cancelMode();s.selectedBuilding=w.buildings.at(-1).id;s.selected=[];s.onChange();
 });
 await page.locator('[data-tab="unit"]').click();
 await page.locator('[data-gate]').click();
 const passable=await page.evaluate(()=>!!folwark.scene.world.navigation.route({x:2150,y:1300},{x:2150,y:1500}));
 if(!passable)throw Error('Open gate blocked');
 await page.locator('[data-gate]').click();
 if(await page.evaluate(()=>!!folwark.scene.world.navigation.route({x:2150,y:1300},{x:2150,y:1500})))throw Error('Closed gate passable');
 await page.screenshot({path:'output/playwright/frontier-fences.png'});
 await page.evaluate(()=>{const s=folwark.scene,w=s.world;
  w.wildlife.predators=[{id:w.nextId++,kind:'wolf',x:2370,y:1310,health:1,until:w.time+100,target:null,path:[{x:2375,y:1320}],repath:2},{id:w.nextId++,kind:'fox',x:2400,y:1380,health:1,until:w.time+100,target:null,path:[],repath:2}];s.onChange();
 });
 await page.waitForTimeout(250);
 await page.screenshot({path:'output/playwright/frontier-predators.png'});
 const art=await page.evaluate(()=>{
  const s=folwark.scene,c=s.textures.get('wildlife').getSourceImage(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let clear=0,opaque=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>200)opaque++}
  return {clear,opaque,missing:s.children.list.filter(v=>v.texture?.key==='__MISSING').length};
 });
 if(art.clear<500000||art.opaque<100000||art.missing)throw Error('Invalid wildlife textures');
 await page.locator('[data-action="save"]').click();
 const snapshot=await page.evaluate(()=>folwark.scene.world.snapshot());
 await page.evaluate(save=>{folwark.scene.world.restore(save);folwark.scene.world.paused=true},snapshot);
 if(snapshot.version!==8)throw Error('Save version');
 await page.locator('[data-tab="neighbors"]').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);
 await page.screenshot({path:'output/playwright/frontier-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.setViewportSize({width:1600,height:1000});
 if(errors.length)throw Error(errors.join('\n'));
 return {techNodes:11,foreignFarms:3,art,saveVersion:8,errors};
}
