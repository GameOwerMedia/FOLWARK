import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import prepared from '../src/game/prepared-atlas.json';
import { frames } from '../src/game/Atlas';

test('all 80 prepared objects have transparent padding and no overlapping frames',async()=>{
 const {data,info}=await sharp('public/assets/sprites-prepared.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const objects=Object.entries(prepared);assert.equal(objects.length,80);
 for(const [name,f]of objects){
  const [x,y,w,h]=f.rect;
  assert.ok(x>=0&&y>=0&&x+w<=info.width&&y+h<=info.height,name+' outside atlas');
  let opaque=0;
  for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
   const alpha=data[((y+dy)*info.width+x+dx)*4+3];
   if(alpha>100)opaque++;
   if(dx===0||dy===0||dx===w-1||dy===h-1)assert.equal(alpha,0,name+' touches a cut boundary');
  }
  assert.ok(opaque>100,name+' empty');
  for(const [other,g]of objects){
   if(other===name)continue;
   const [gx,gy,gw,gh]=g.rect;
   assert.ok(x+w<=gx||gx+gw<=x||y+h<=gy||gy+gh<=y,name+' overlaps '+other);
  }
 }
});
test('runtime frames fit the actual dimensions of every source image',async()=>{
 const dimensions=new Map<string,{width:number;height:number}>();
 for(const [name,f]of Object.entries(frames)){
  if(!dimensions.has(f.sheet)){const m=await sharp('public/assets/'+f.sheet+'.png').metadata();dimensions.set(f.sheet,{width:m.width!,height:m.height!})}
  const m=dimensions.get(f.sheet)!,[x,y,w,h]=f.rect;
  assert.ok(x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height,name+' outside source sheet');
 }
});
