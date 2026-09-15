import type Phaser from 'phaser';
export function prepareWildlifeArt(scene:Phaser.Scene){
 const source=scene.textures.get('wildlife').getSourceImage() as HTMLImageElement;
 const c=document.createElement('canvas');c.width=1536;c.height=1024;
 const g=c.getContext('2d')!;g.drawImage(source,0,0);
 const pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data;
 // Chroma-key sprite atlases at upload time, including antialiased edge spill.
 for(let i=0;i<d.length;i+=4){
  const spill=Math.min(d[i],d[i+2])-d[i+1];
  if(spill>65&&d[i+2]>d[i+1]*1.25){
   d[i+3]=Math.round(255*Math.max(0,1-(spill-65)/65));
   d[i]=Math.min(d[i],d[i+1]+30);d[i+2]=Math.min(d[i+2],d[i+1]+30);
  }
 }
 g.putImageData(pixels,0,0);scene.textures.remove('wildlife');scene.textures.addCanvas('wildlife',c);
}
