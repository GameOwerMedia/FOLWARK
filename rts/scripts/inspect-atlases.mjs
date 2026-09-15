import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';

export async function components(file,threshold=80){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,labels=new Int32Array(w*h),queue=new Int32Array(w*h),items=[];
 let id=0;
 for(let pos=0;pos<labels.length;pos++){
  if(labels[pos]||data[pos*4+3]<threshold)continue;
  id++;let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0;queue[0]=pos;labels[pos]=id;
  while(head<tail){
   const p=queue[head++],x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w]){
    if(n<0||n>=labels.length||labels[n]||data[n*4+3]<threshold)continue;
    labels[n]=id;queue[tail++]=n;
   }
  }
  if(tail>150)items.push({id,area:tail,rect:[minX,minY,maxX-minX+1,maxY-minY+1]});
 }
 return {data,w,h,labels,items};
}
if(process.argv[1].endsWith('inspect-atlases.mjs')){
 await mkdir('output/atlas',{recursive:true});
 for(const name of ['buildings-final','buildings-original','buildings-civic','animals-original','animals-final','animals-special','ui-portraits']){
  const {items}=await components('public/assets/'+name+'.png');
  await writeFile('output/atlas/'+name+'.json',JSON.stringify(items,null,2));
  console.log(name,items.filter(x=>x.area>1500).map(x=>({id:x.id,area:x.area,rect:x.rect})));
 }
}

