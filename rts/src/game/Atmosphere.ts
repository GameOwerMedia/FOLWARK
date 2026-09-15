import Phaser from 'phaser';
import {pond,decorations} from '../simulation/Landscape';
import {buildingDefs,type World} from '../simulation/World';
import {pastureSegments} from '../simulation/Pastures';
import {frames} from './Atlas';
import {drawTerrain} from './Terrain';
import {fenceRun} from './Fence';

export class Atmosphere {
 private shadows:Phaser.GameObjects.Graphics;
 private water:Phaser.GameObjects.Graphics;
 private weather:Phaser.GameObjects.Graphics;
 private hazard:Phaser.GameObjects.Graphics;
 private pastureGround:Phaser.GameObjects.Graphics;
 private signature='';
 private season='';
 private fences:Phaser.GameObjects.Image[]=[];
 private castShadows:Phaser.GameObjects.Image[]=[];
 private enemies:Phaser.GameObjects.Image[]=[];
 constructor(private scene:Phaser.Scene){
  this.shadows=scene.add.graphics().setDepth(-15);
  this.water=scene.add.graphics().setDepth(-50);
  this.weather=scene.add.graphics().setDepth(4100);
  this.hazard=scene.add.graphics().setDepth(3900);
  this.pastureGround=scene.add.graphics().setDepth(-30);
  for(let i=0;i<20;i++){
   const angle=i/20*Math.PI*2,x=pond.x+Math.cos(angle)*(pond.rx+8),y=pond.y+Math.sin(angle)*(pond.ry+8);
   const key=i%3===0?'reeds':'rocks',f=frames[key],width=i%3===0?55:35+(i%4)*8;
   scene.add.image(x,y,f.sheet,key).setOrigin(.5,.75).setDisplaySize(width,width*f.rect[3]/f.rect[2]).setDepth(y);
  }
 }
 private shadow(key:string,x:number,y:number,width:number){
  const f=frames[key],name='cast-shadow-'+key;
  if(!this.scene.textures.exists(name)){
   const c=document.createElement('canvas');c.width=f.rect[2];c.height=f.rect[3];
   const g=c.getContext('2d')!;g.drawImage(this.scene.textures.get(f.sheet).getSourceImage() as HTMLImageElement,...f.rect,0,0,c.width,c.height);
   g.globalCompositeOperation='source-in';g.fillStyle='#142022';g.fillRect(0,0,c.width,c.height);
   this.scene.textures.addCanvas(name,c);
  }
  const image=this.scene.add.image(x,y-3,name).setOrigin(.5,1).setDisplaySize(width,width*f.rect[3]/f.rect[2]*.32).setRotation(-.72).setAlpha(.23).setDepth(-16);
  this.castShadows.push(image);
 }
 update(world:World,reducedMotion=false){
  const signature=world.season+world.buildings.map(b=>b.id+':'+b.kind+':'+b.x+':'+b.y+':'+(b.progress>=1)).join(',');
  if(signature!==this.signature){
   this.signature=signature;
   this.season=world.season;drawTerrain(this.scene,world.season,world.buildings);
   this.shadows.clear();this.castShadows.forEach(v=>v.destroy());this.castShadows=[];
   this.fences.forEach(v=>v.destroy());this.fences=[];this.pastureGround.clear();
   const objects=[...decorations.filter(d=>d.radius&&!['fence','fence2'].includes(d.key)).map(d=>({key:d.key,x:d.x,y:d.y,w:d.width})),
    ...world.buildings.filter(b=>!['field','garden','orchard','quarry','stage','pasture'].includes(b.kind)).map(b=>({key:buildingDefs[b.kind].art,x:b.x,y:b.y,w:buildingDefs[b.kind].width}))];
   for(const o of objects){
    const tree=['apple','treeWhite','treeOrange','pine'].includes(o.key),key=tree&&world.season==='Zima'?'winterTree':o.key;
    this.shadow(key,o.x,o.y,o.w);
    for(let i=3;i>=0;i--)this.shadows.fillStyle(0x14231b,.045).fillEllipse(o.x+o.w*.05,o.y-5,o.w*(.65+i*.08),o.w*(.12+i*.035));
   }
   for(const b of world.buildings.filter(b=>b.kind==='pasture')){
    const g=this.pastureGround;
    g.fillStyle(world.season==='Zima'?0xdde5df:world.season==='Wiosna'?0x607344:0x70704b,.36).fillRoundedRect(b.x-165,b.y-155,330,163,7);
    for(let i=0;i<80;i++){
     const x=b.x-155+(i*73%310),y=b.y-145+(i*31%145);
     g.lineStyle(1,world.season==='Zima'?0xf0f3ef:0xc3ba77,.42).lineBetween(x,y,x+2,y-3-i%5);
    }
    if(b.progress>=1){
     this.fences.push(...fenceRun(this.scene,pastureSegments(b)));
    }
   }
  }
  const t=reducedMotion?0:world.time,g=this.water;g.clear();
  if(world.season!=='Zima')for(let i=0;i<28;i++){
   const angle=i*2.39996,r=Math.sqrt((i+.5)/28),x=pond.x+Math.cos(angle)*pond.rx*r*.82,y=pond.y+Math.sin(angle)*pond.ry*r*.82;
   const phase=(t*.2+i*.137)%1,alpha=Math.sin(phase*Math.PI)*.22;
   g.lineStyle(.9,0xd6eee3,alpha).beginPath().arc(x,y,8+phase*18,.12*Math.PI,.82*Math.PI).strokePath();
  }
  const weather=this.weather;weather.clear();
  const camera=this.scene.cameras.main,area=camera.worldView;
  if(world.season==='Zima'&&!reducedMotion)for(let i=0;i<100;i++){
   const x=area.x+((i*83.17+t*11)%Math.max(1,area.width)),y=area.y+((i*47.91+t*(14+i%9))%Math.max(1,area.height));
   weather.fillStyle(0xf9ffff,.4+i%3*.15).fillCircle(x,y,1+i%3*.5);
  }
  if(world.season==='Jesien'&&!reducedMotion)for(let i=0;i<20;i++){
   const x=area.x+((i*131.7+t*15)%Math.max(1,area.width)),y=area.y+((i*71.3+t*9)%Math.max(1,area.height));
   weather.fillStyle(i%2?0xa7823f:0xbcb075,.6).fillEllipse(x,y,4,2);
  }
  const h=this.hazard;h.clear();const threat=world.threats.active;
  if(!threat){this.enemies.forEach(v=>v.destroy());this.enemies=[];return}
  const pulse=reducedMotion?.75:.65+Math.sin(t*4)*.2;
  h.lineStyle(2,0xe29351,pulse).strokeEllipse(threat.x,threat.y,140,60);
  if(threat.kind==='fire'&&threat.phase==='active'){
   const barn=world.buildings.find(b=>b.id===threat.buildingId)!;
   for(let i=0;i<20;i++){
    const phase=(t*1.4+i*.137)%1,x=barn.x-70+(i*37%140),y=barn.y-25-phase*145;
    h.fillStyle(i%3?0xdd6530:0xffcf69,(1-phase)*threat.strength*.8).fillEllipse(x+Math.sin(phase*5+i)*8,y,10+(1-phase)*10,22+phase*17);
   }
   for(let i=0;i<8;i++){const phase=(t*.35+i*.125)%1;h.fillStyle(0x3c403e,(1-phase)*.26).fillCircle(barn.x+Math.sin(i+phase)*30,barn.y-130-phase*110,15+phase*22)}
  }
  while(this.enemies.length>threat.raiders.length)this.enemies.pop()!.destroy();
  threat.raiders.forEach((e,i)=>{
   if(!this.enemies[i]){const f=frames.boar;this.enemies[i]=this.scene.add.image(e.x,e.y,f.sheet,'boar').setOrigin(.5,1).setDisplaySize(70,70*f.rect[3]/f.rect[2])}
   const v=this.enemies[i];v.setVisible(e.health>0).setPosition(e.x,e.y).setDepth(e.y).setTint(0xf4b9a4).setRotation(e.path.length?Math.sin(t*9+i)*.035:0);
   if(e.health>0){h.lineStyle(2,0xe06450).strokeEllipse(e.x,e.y,61,22);h.fillStyle(0x24211c,.9).fillRect(e.x-22,e.y-72,44,4).fillStyle(0xd0654e).fillRect(e.x-22,e.y-72,44*e.health/60,4)}
  });
 }
}
