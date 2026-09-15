async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5177');
 await page.locator('#loading').waitFor({state:'detached'});await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="language"]').selectOption('pl');await page.locator('[data-menu="main"]').click();
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{const s=window.folwark.scene;s.world.paused=true;s.world.order(s.world.units.map(a=>a.id),'idle');s.world.units[0].x=950;s.world.units[0].y=850;s.world.move([s.world.units[0].id],720,850)});
 const samples=[];
 for(let i=0;i<8;i++){
  samples.push(await page.evaluate(()=>{
   const s=window.folwark.scene,w=s.world,a=w.units[0];w.paused=false;w.tick(.1);w.paused=true;
   s.update(0,0);const v=s.unitViews.get(a.id).sprite;
   return {x:a.x,y:a.y,heading:a.heading,frame:v.frame.name,flip:v.flipX,width:v.displayWidth,height:v.displayHeight};
  }));
 }
 if(new Set(samples.map(s=>s.frame)).size<5)throw Error('Walking frames are not advancing');
 if(samples.some(s=>!s.flip))throw Error('Leftward walk faces the wrong direction');
 if(new Set(samples.map(s=>s.width+':'+s.height)).size!==1)throw Error('Body size jumps during walking');
 await page.evaluate(()=>{const s=window.folwark.scene;s.world.order([s.world.units[0].id],'idle');s.update(0,0)});
 if(!await page.evaluate(()=>window.folwark.scene.unitViews.get('unit-100').sprite.flipX))throw Error('Idle direction snaps back');
 await page.getByRole('button',{name:'Opcje gry',exact:true}).click();
 await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="continue"]').click();
 if(!await page.evaluate(()=>window.folwark.scene.world.paused))throw Error('Closing options lost the user pause');
 const atlas=await page.evaluate(()=>{
  const s=window.folwark.scene,clipped=[],missing=[];
  for(const species of ['horse','dog','cow','pig','sheep','hen','goat','donkey','raven','ram','boar','cat','mule','duck','goose']){
   const t=s.textures.get('gait-'+species),source=t.getSourceImage();
   if(!source.width){missing.push(species);continue}
   const ctx=source.getContext('2d');
   for(let i=0;i<12;i++){
    const f=t.get(i),p=ctx.getImageData(f.cutX,f.cutY,f.cutWidth,f.cutHeight).data;
    for(let y=0;y<f.cutHeight;y++)for(let x=0;x<f.cutWidth;x++){
     if(x>2&&x<f.cutWidth-3&&y>2&&y<f.cutHeight-3)continue;
     if(p[(y*f.cutWidth+x)*4+3]>10){clipped.push(species+':'+i);y=f.cutHeight;break}
    }
   }
  }
  return {clipped,missing};
 });
 if(atlas.clipped.length||atlas.missing.length)throw Error(JSON.stringify(atlas));
 await page.evaluate(()=>{
  const c=document.createElement('canvas');c.id='gait-review';c.width=1000;c.height=680;
  Object.assign(c.style,{position:'fixed',left:'0',top:'0',zIndex:'100000',width:'1000px',height:'680px'});
  document.body.append(c);const g=c.getContext('2d');g.fillStyle='#394235';g.fillRect(0,0,1000,680);
  for(const [r,kind]of ['horse','dog','sheep','hen'].entries()){
   const t=window.folwark.scene.textures.get('gait-'+kind),source=t.getSourceImage();
   for(let col=0;col<4;col++){
    const f=t.get(col*3),scale=Math.min(210/f.cutWidth,145/f.cutHeight);
    g.drawImage(source,f.cutX,f.cutY,f.cutWidth,f.cutHeight,col*250+20,r*170+10,f.cutWidth*scale,f.cutHeight*scale);
    g.fillStyle='#fff';g.fillText(kind+' / '+col*3,col*250+20,r*170+164);
   }
  }
 });
 await page.locator('#gait-review').screenshot({path:'output/playwright/gait-review.png'});
 await page.locator('#gait-review').evaluate(el=>el.remove());
 const field=await page.evaluate(()=>{
  const s=window.folwark.scene,b=s.world.buildings.find(b=>b.kind==='field');s.selected=['unit-100'];s.contextOrder(b.x,b.y-30);
  return {target:s.world.units[0].target,field:b.id,depth:s.buildingViews.get(b.id).depth};
 });
 if(field.target!==field.field||field.depth>=0)throw Error('Field selection or field occlusion failed');
 await page.evaluate(()=>{window.folwark.scene.center();window.folwark.scene.onChange()});
 await page.screenshot({path:'output/playwright/revised-desktop.png'});
 if(errors.length)throw Error(errors.join('\n'));
 return {samples,animationFrames:180,atlas,field,errors};
}
