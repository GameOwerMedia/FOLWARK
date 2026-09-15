import Phaser from 'phaser';
import type { Road } from '../simulation/Development';
export class RoadLayer {
 private objects:Phaser.GameObjects.Image[]=[];private keys:string[]=[];
 constructor(private scene:Phaser.Scene){}
 render(roads:Road[]){
  this.objects.forEach(o=>o.destroy());this.keys.forEach(k=>this.scene.textures.remove(k));this.objects=[];this.keys=[];
  const source=this.scene.textures.get('terrain-materials').getSourceImage() as HTMLImageElement;
  for(const road of roads){
   const [a,b]=road.points,pad=28,x=Math.min(a[0],b[0])-pad,y=Math.min(a[1],b[1])-pad;
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(Math.abs(b[0]-a[0])+pad*2);canvas.height=Math.ceil(Math.abs(b[1]-a[1])+pad*2);
   const ctx=canvas.getContext('2d')!,tile=document.createElement('canvas');tile.width=180;tile.height=180;
   const g=tile.getContext('2d')!;g.drawImage(source,source.width/2+18,18,source.width/2-36,source.height/2-36,0,0,180,180);
   if(road.kind==='stone'){g.globalCompositeOperation='saturation';g.fillStyle='#888';g.fillRect(0,0,180,180)}
   ctx.lineCap='round';ctx.strokeStyle=ctx.createPattern(tile,'repeat')!;
   for(let width=48;width>=34;width-=2){ctx.globalAlpha=width>36?.13:1;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0]-x,a[1]-y);ctx.lineTo(b[0]-x,b[1]-y);ctx.stroke()}
   if(road.kind==='stone'){
    ctx.save();ctx.translate(a[0]-x,a[1]-y);ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));
    const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
    ctx.beginPath();ctx.roundRect(0,-17,distance,34,16);ctx.clip();
    for(let row=0;row<3;row++)for(let d=-16+(row%2)*8;d<distance;d+=16){
     const variation=(Math.sin(d*7+row*31+road.id)*437.1)%1;
     ctx.globalAlpha=.65;ctx.fillStyle=variation>.3?'#a19d87':variation<-.3?'#646859':'#848678';
     ctx.strokeStyle='#444b3e';ctx.lineWidth=1;
     ctx.beginPath();ctx.roundRect(d+1,-16+row*11,14,9,2);ctx.fill();ctx.stroke();
     ctx.globalAlpha=.25;ctx.strokeStyle='#e4dcc0';ctx.beginPath();ctx.moveTo(d+3,-14+row*11);ctx.lineTo(d+12,-14+row*11);ctx.stroke();
    }
    ctx.restore();
   }
   const key='road-'+road.id;this.scene.textures.addCanvas(key,canvas);this.keys.push(key);
   this.objects.push(this.scene.add.image(x,y,key).setOrigin(0).setDepth(-40));
  }
 }
}
