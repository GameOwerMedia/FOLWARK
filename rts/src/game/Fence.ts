import Phaser from 'phaser';
import {fenceSegments,gates} from '../simulation/Landscape';
import type {FarmScene} from './FarmScene';

export function fenceRun(scene:Phaser.Scene,segments:number[][][]){
 const views:Phaser.GameObjects.Image[]=[];
 const source=scene.textures.get('fence-timber').getSourceImage() as HTMLImageElement;
 for(const [a,b]of segments){
  const vertical=a[0]===b[0],length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/(vertical?62:105));
  const dx=(b[0]-a[0])/count,dy=(b[1]-a[1])/count,key='painted-timber-'+Math.round(dx*100)+'-'+Math.round(dy*100);
  if(!scene.textures.exists(key)){
   const c=document.createElement('canvas');c.width=Math.ceil(Math.abs(dx))+50;c.height=Math.ceil(Math.abs(dy))+90;
   const g=c.getContext('2d')!,ox=18,oy=60;
   g.fillStyle='#15201640';g.beginPath();g.moveTo(ox-5,oy);g.lineTo(ox+dx+8,oy+dy);g.lineTo(ox+dx+22,oy+dy+10);g.lineTo(ox+13,oy+12);g.fill();
   if(!vertical){
    // Map the painted end posts to the collision endpoints; never rotate posts.
    g.drawImage(source,0,0,2172,724,ox-10,oy-53,dx+20,56);
   }else{
    for(const h of [12,27,42]){
     g.save();g.translate(ox-3,oy-h);g.transform(0,dy/1750,8/90,0,0,0);
     g.drawImage(source,230,125,1750,90,0,0,1750,90);g.restore();
     g.strokeStyle='#b29a71aa';g.lineWidth=.8;g.beginPath();g.moveTo(ox+4,oy-h);g.lineTo(ox+4,oy+dy-h);g.stroke();
    }
    for(const y of [0,dy])g.drawImage(source,30,20,200,670,ox-8,oy+y-53,17,55);
   }
   scene.textures.addCanvas(key,c);
  }
  for(let i=0;i<count;i++){
   const x=a[0]+dx*i,y=a[1]+dy*i;
   views.push(scene.add.image(x-18,y-60,key).setOrigin(0).setDepth(y+Math.max(0,dy)+1));
  }
 }
 return views;
}
export function drawFence(scene:FarmScene){
 fenceRun(scene,fenceSegments);
 for(const gate of gates){
  const vertical=gate.x===1650;
  scene.art('lamp',gate.x+(vertical?0:-64),gate.y+(vertical?-60:0),40);
  scene.art('lamp',gate.x+(vertical?0:64),gate.y+(vertical?60:0),40);
 }
}
