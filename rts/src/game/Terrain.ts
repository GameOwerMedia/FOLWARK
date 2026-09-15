import Phaser from 'phaser';
import { WORLD_WIDTH as W, WORLD_HEIGHT as H, pond, roads,decorations } from '../simulation/Landscape';

export function drawTerrain(scene:Phaser.Scene){
  const source=scene.textures.get('terrain-materials').getSourceImage() as HTMLImageElement;
  const canvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const base=canvas(),ctx=base.getContext('2d')!;
  const materials=Array.from({length:4},(_,i)=>{
    const c=canvas(384,384),g=c.getContext('2d')!,sw=source.width/2,sh=source.height/2;
    if(i===0)g.drawImage(scene.textures.get('meadow-fine').getSourceImage() as HTMLImageElement,0,0,384,384);
    else g.drawImage(source,(i%2)*sw+18,Math.floor(i/2)*sh+18,sw-36,sh-36,0,0,384,384);
    const stamp=canvas(384,384),s=stamp.getContext('2d')!;
    s.drawImage(c,0,0);s.globalCompositeOperation='destination-in';
    const fade=s.createRadialGradient(192,192,105,192,192,190);
    fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');
    s.fillStyle=fade;s.fillRect(0,0,384,384);
    const tile=canvas(1024,1024),t=tile.getContext('2d')!;
    t.fillStyle=t.createPattern(c,'repeat')!;t.fillRect(0,0,1024,1024);
    let seed=190+i;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    // Overlapping, feathered material samples avoid both tile seams and mirror motifs.
    for(let y=-80;y<1184;y+=125)for(let x=-80;x<1184;x+=125){
      t.save();t.translate(x+random()*70,y+random()*70);t.rotate(random()*Math.PI*2);
      t.drawImage(stamp,-192,-192);t.restore();
    }
    return ctx.createPattern(tile,'repeat')!;
  });
  ctx.fillStyle=materials[0];ctx.fillRect(0,0,W,H);
  let seed=417;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  function layer(material:CanvasPattern,paint:(g:CanvasRenderingContext2D)=>void,blur=0){
    const mask=canvas(),g=mask.getContext('2d')!;paint(g);
    const color=canvas(),c=color.getContext('2d')!;
    c.fillStyle=material;c.fillRect(0,0,W,H);c.globalCompositeOperation='destination-in';
    c.filter=blur?'blur('+blur+'px)':'none';c.drawImage(mask,0,0);ctx.drawImage(color,0,0);
  }
  layer(materials[3],g=>{
    for(const d of decorations.filter(d=>['treeOrange','treeWhite','pine','apple'].includes(d.key))){
      if(d.x>100&&d.x<1650&&d.y>180&&d.y<1150)continue;
      const x=d.x,y=d.y,r=45;
      const gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'#ffffffaa');gradient.addColorStop(1,'#fff0');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);
    }
  });
  layer(materials[1],g=>{
    g.fillStyle='#fff';
    for(const path of roads)for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let d=0;d<=length;d+=5){
        const t=d/length,r=19+Math.sin(d*.043+i)*3+rng()*3;
        g.beginPath();g.ellipse(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,r,r*.83,0,0,Math.PI*2);g.fill();
      }
    }
  },5);
  const shore=(g:CanvasRenderingContext2D,margin:number)=>{
    g.beginPath();
    for(let i=0;i<=100;i++){
      const a=i/100*Math.PI*2,w=1+Math.sin(a*7)*.023+Math.sin(a*13)*.015;
      const x=pond.x+Math.cos(a)*(pond.rx+margin)*w,y=pond.y+Math.sin(a)*(pond.ry+margin)*w;
      if(i)g.lineTo(x,y);else g.moveTo(x,y);
    }g.closePath();g.fillStyle='#fff';g.fill();
  };
  layer(materials[3],g=>shore(g,19),7);
  layer(materials[1],g=>shore(g,7),3);
  layer(materials[2],g=>shore(g,-3),2);
  scene.textures.addCanvas('terrain',base);
  scene.add.image(0,0,'terrain').setName('world-terrain').setOrigin(0).setDepth(-100);
}
