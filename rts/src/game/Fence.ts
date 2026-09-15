import Phaser from 'phaser';
import {frames} from './Atlas';
import {fenceSegments,gates} from '../simulation/Landscape';
import type {FarmScene} from './FarmScene';
export function drawFence(scene:FarmScene){
 const frame=frames.fence,source=scene.textures.get(frame.sheet).getSourceImage() as HTMLImageElement;
 // Project the straight section of the authored fence while keeping its posts upright.
 const make=(key:string,dx:number,dy:number)=>{
  const c=document.createElement('canvas');c.width=180;c.height=190;const g=c.getContext('2d')!;
  const a=dx/86,b=dy/86+13/86*.85;
  g.setTransform(a,b,0,.85,50-12*a,72-55*.85-12*b);
  g.drawImage(source,frame.rect[0],frame.rect[1],108,80,0,0,108,80);
  scene.textures.addCanvas(key,c);
 };
 make('fence-horizontal',100,0);
 for(const[a,b]of fenceSegments){
  const vertical=a[0]===b[0],length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/(vertical?80:100)),step=length/count;
  for(let i=0;i<count;i++){
   const x=a[0]+(b[0]-a[0])*i/count,y=a[1]+(b[1]-a[1])*i/count;
   const key='fence-horizontal';
   const image=scene.add.image(x,y,key).setOrigin(50/180,72/190).setDepth(y+(vertical?step:0)+1);
   image.setScale(step/100,vertical?.8:1);if(vertical)image.setRotation(Math.PI/2);
  }
 }
 for(const gate of gates){
  const vertical=gate.x===1650;
  scene.art('lamp',gate.x+(vertical?0:-64),gate.y+(vertical?-60:0),32);
  scene.art('lamp',gate.x+(vertical?0:64),gate.y+(vertical?60:0),32);
 }
}
