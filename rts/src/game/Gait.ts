import Phaser from 'phaser';
import { frames } from './Atlas';

export const GAIT_FRAMES=12;
export function makeGaits(scene:Phaser.Scene,species:string[]){
  for(const kind of new Set(species)){
    const f=frames[kind],source=scene.textures.get(f.sheet).getSourceImage() as HTMLImageElement;
    const w=f.rect[2],h=f.rect[3],pad=24;
    const art=document.createElement('canvas');art.width=w;art.height=h;
    art.getContext('2d')!.drawImage(source,...f.rect,0,0,w,h);
    const strip=document.createElement('canvas');strip.width=(w+pad*2)*GAIT_FRAMES;strip.height=h+pad*2;
    const ctx=strip.getContext('2d',{willReadFrequently:true})!;
    const cols=12,rows=14;
    for(let frame=0;frame<GAIT_FRAMES;frame++){
      const phase=frame/GAIT_FRAMES*Math.PI*2;
      const vertex=(x:number,y:number)=>{
        const u=x/w,v=y/h,leg=Math.max(0,(v-.57)/.43);
        const stride=Math.sin(phase+u*Math.PI*4);
        return {x:x+pad+Math.sin(phase)*1.1+(kind==='raven'?Math.sin(phase+u*5)*9:stride*leg*Math.min(20,w*.08)),
          y:y+pad+(kind==='raven'?Math.sin(phase)*Math.sin(u*Math.PI)*15:-Math.max(0,stride)*leg*Math.min(9,h*.035)+Math.cos(phase*2)*(1-leg)*.6)};
      };
      ctx.save();ctx.translate(frame*(w+pad*2),0);
      // A small mesh bends lower limbs independently of the torso; artwork never swaps pose.
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const x=col*w/cols,y=row*h/rows,dx=w/cols,dy=h/rows;
        const a=vertex(x,y),b=vertex(x+dx,y),c=vertex(x,y+dy),d=vertex(x+dx,y+dy);
        triangle(ctx,art,[x,y,x+dx,y,x,y+dy],[a.x,a.y,b.x,b.y,c.x,c.y]);
        triangle(ctx,art,[x+dx,y+dy,x,y+dy,x+dx,y],[d.x,d.y,c.x,c.y,b.x,b.y]);
      }
      ctx.restore();
    }
    const texture=scene.textures.addCanvas('gait-'+kind,strip)!;
    for(let i=0;i<GAIT_FRAMES;i++)texture.add(i,0,i*(w+pad*2),0,w+pad*2,h+pad*2);
  }
}
function triangle(ctx:CanvasRenderingContext2D,image:HTMLCanvasElement,s:number[],d:number[]){
  const [x0,y0,x1,y1,x2,y2]=s,[u0,v0,u1,v1,u2,v2]=d;
  const det=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
  const a=((u1-u0)*(y2-y0)-(u2-u0)*(y1-y0))/det;
  const b=((v1-v0)*(y2-y0)-(v2-v0)*(y1-y0))/det;
  const c=((u2-u0)*(x1-x0)-(u1-u0)*(x2-x0))/det;
  const e=((v2-v0)*(x1-x0)-(v1-v0)*(x2-x0))/det;
  ctx.save();ctx.beginPath();ctx.moveTo(u0,v0);ctx.lineTo(u1,v1);ctx.lineTo(u2,v2);ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,e,u0-a*x0-c*y0,v0-b*x0-e*y0);ctx.drawImage(image,0,0);ctx.restore();
}
