import Phaser from 'phaser';
import {frames} from './Atlas';

export function snowTexture(scene:Phaser.Scene,key:string,ground=false){
 const name='snow-'+key+(ground?'-ground':'');if(scene.textures.exists(name))return name;
 const f=frames[key],c=document.createElement('canvas');c.width=f.rect[2];c.height=f.rect[3];
 const g=c.getContext('2d')!;g.drawImage(scene.textures.get(f.sheet).getSourceImage() as HTMLImageElement,...f.rect,0,0,c.width,c.height);
 const image=g.getImageData(0,0,c.width,c.height),data=image.data,alpha=new Uint8Array(c.width*c.height);
 for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
 // Snow collects on exposed upper edges; walls keep their original painted detail.
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const p=y*c.width+x,i=p*4;if(alpha[p]<30)continue;
  const exposed=y<4||alpha[Math.max(0,y-4)*c.width+x]<40;
  const mix=ground?.63+(Math.sin(x*.47+y*.63)+1)*.08:exposed?.87:.08;
  data[i]=Math.round(data[i]*(1-mix)+222*mix);data[i+1]=Math.round(data[i+1]*(1-mix)+232*mix);data[i+2]=Math.round(data[i+2]*(1-mix)+234*mix);
 }
 g.putImageData(image,0,0);scene.textures.addCanvas(name,c);return name;
}
