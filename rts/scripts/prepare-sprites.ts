import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { components } from './inspect-atlases.mjs';
import { sourceFrames } from '../src/game/Atlas';

// Component IDs refer to full connected objects in the ORIGINAL alpha channel,
// not guessed rectangular crops. This keeps neighboring tiles out of each sprite.
const selections:Record<string,[string,number]> = {
 house:['buildings-final',2],barn:['buildings-final',6],granary:['buildings-final',5],mill:['buildings-final',1],
 smith:['buildings-final',3],bakery:['buildings-final',4],school:['buildings-final',10],library:['buildings-final',9],
 stage:['buildings-final',11],barracks:['buildings-final',12],kennel:['buildings-final',14],market:['buildings-final',13],
 bees:['buildings-final',23],garden:['buildings-final',21],vegetables:['buildings-final',19],
 apple:['buildings-final',16],pear:['buildings-final',17],treeWhite:['buildings-final',22],treePink:['buildings-final',24],treeOrange:['buildings-final',20],pine:['buildings-final',18],
 field:['buildings-final',28],field2:['buildings-final',29],fieldFence:['buildings-final',30],stubble:['buildings-original',29],soil:['buildings-original',29],
 well:['buildings-original',125],crates:['buildings-original',109],barrels:['buildings-original',112],logs:['buildings-original',138],
 fence:['buildings-final',54],fence2:['buildings-final',57],wall:['buildings-original',79],bridge:['buildings-final',49],
 pond:['buildings-original',204],pond2:['buildings-original',189],reeds:['buildings-original',214],dock:['buildings-final',61],
 lamp:['buildings-original',135],flag:['buildings-original',77],rocks:['buildings-original',253],flowers:['buildings-original',216],flowersRed:['buildings-original',234],stump:['buildings-original',140],
 infirmary:['buildings-civic',5],tower:['buildings-original',3],pasture:['buildings-original',34],tent:['buildings-original',127],
 pig:['animals-final',2],dog:['animals-final',5],horse:['animals-final',7],cow:['animals-final',22],sheep:['animals-original',38],hen:['animals-original',40],
 goat:['animals-final',21],ram:['animals-final',20],boar:['animals-final',31],cat:['animals-final',34],raven:['animals-final',33],donkey:['animals-special',14],mule:['animals-special',22],duck:['animals-final',35],goose:['animals-final',32],
 horseWork:['animals-original',11],horseRest:['animals-final',11],dogWork:['animals-final',5],henWork:['animals-original',42],pigWork:['animals-final',3],cowWork:['animals-final',23],
};
const cache=new Map();
const sprites:any[]=[];const report:any[]=[];
for(const[key,original]of Object.entries(sourceFrames)){
 if(key.startsWith('portrait-'))continue;
 const sheet=selections[key]?.[0]??original.sheet;
 if(!cache.has(sheet))cache.set(sheet,await components('public/assets/'+sheet+'.png'));
 const image=cache.get(sheet);
 let selected=image.items.find((c:any)=>c.id===selections[key]?.[1]);
 if(!selected){
  const[x,y,w,h]=original.rect;
  selected=image.items.filter((c:any)=>c.area>200).sort((a:any,b:any)=>{
   const score=(c:any)=>{const[cx,cy,cw,ch]=c.rect;return Math.max(0,Math.min(x+w,cx+cw)-Math.max(x,cx))*Math.max(0,Math.min(y+h,cy+ch)-Math.max(y,cy))};
   return score(b)-score(a);
  })[0];
 }
 if(!selected)throw Error('Missing object '+key);
 const[x,y,w,h]=selected.rect,pad=6,outW=w+pad*2,outH=h+pad*2;
 const rgba=Buffer.alloc(outW*outH*4);
 for(let dy=-3;dy<h+3;dy++)for(let dx=-3;dx<w+3;dx++){
  const sx=x+dx,sy=y+dy;if(sx<0||sy<0||sx>=image.w||sy>=image.h)continue;
  const index=sy*image.w+sx;
  let belongs=image.labels[index]===selected.id;
  if(!belongs&&image.data[index*4+3]<80&&image.data[index*4+3]>0){
   for(let ny=-2;ny<=2&&!belongs;ny++)for(let nx=-2;nx<=2;nx++)if(image.labels[(sy+ny)*image.w+sx+nx]===selected.id){belongs=true;break}
  }
  if(belongs)image.data.copy(rgba,((dy+pad)*outW+dx+pad)*4,index*4,index*4+4);
 }
 const scale=Math.min(1,380/Math.max(outW,outH));
 const width=Math.round(outW*scale),height=Math.round(outH*scale);
 const buffer=await sharp(rgba,{raw:{width:outW,height:outH,channels:4}}).resize(width,height).png().toBuffer();
 sprites.push({key,width,height,buffer});
 report.push({key,source:sheet,component:selected.id,sourceRect:selected.rect,area:selected.area,sourceClipped:x===0||y===0||x+w>=image.w||y+h>=image.h});
}
let x=4,y=4,row=0;const width=2048;const frames:any={};const composites:any[]=[];
for(const s of sprites){
 if(x+s.width+4>width){x=4;y+=row+8;row=0}
 frames[s.key]={sheet:'sprites-prepared',rect:[x,y,s.width,s.height]};
 composites.push({input:s.buffer,left:x,top:y});x+=s.width+8;row=Math.max(row,s.height);
}
const height=y+row+4;
for(const value of Object.values(frames) as any[])value.sheetSize=[width,height];
await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toFile('public/assets/sprites-prepared.png');
await writeFile('src/game/prepared-atlas.json',JSON.stringify(frames,null,2)+'\n');
await mkdir('output/atlas',{recursive:true});
await writeFile('output/atlas/extraction-report.json',JSON.stringify(report,null,2));
const tiles:any[]=[];
for(let i=0;i<sprites.length;i++){
 const s=sprites[i],thumb=await sharp(s.buffer).resize(138,124,{fit:'inside'}).png().toBuffer();
 const metadata=await sharp(thumb).metadata();
 const col=i%8,row=Math.floor(i/8);
 tiles.push({input:thumb,left:col*160+11+Math.floor((138-metadata.width!)/2),top:row*160+4+Math.floor((124-metadata.height!)/2)});
 tiles.push({input:Buffer.from('<svg width="156" height="24"><text x="78" y="16" fill="white" font-family="Arial" font-size="12" text-anchor="middle">'+s.key+'</text></svg>'),left:col*160,top:row*160+132});
}
await sharp({create:{width:1280,height:Math.ceil(sprites.length/8)*160,channels:4,background:'#40473d'}}).composite(tiles).jpeg({quality:90}).toFile('output/atlas/sprite-review.jpg');
console.log(JSON.stringify({sprites:sprites.length,width,height,sourceClipped:report.filter(x=>x.sourceClipped)},null,2));
