import {isBarrier} from '../simulation/Barriers';
import Phaser from 'phaser';
import type {Season} from '../simulation/Seasons';
import type {Building} from '../simulation/World';
import { WORLD_WIDTH as W, WORLD_HEIGHT as H, pond, roads,decorations } from '../simulation/Landscape';

export function drawTerrain(scene:Phaser.Scene,season:Season='Jesien',buildings:Building[]=[]){
  const source=scene.textures.get('terrain-materials').getSourceImage() as HTMLImageElement;
  const canvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const renderer=scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  const limit=renderer.gl?Math.min(4096,renderer.gl.getParameter(renderer.gl.MAX_TEXTURE_SIZE)):4096;
  const scale=Math.min(1,limit/W,limit/H);
  const base=canvas(Math.round(W*scale),Math.round(H*scale)),ctx=base.getContext('2d')!;
  ctx.scale(base.width/W,base.height/H);
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
    if(i===0){t.globalCompositeOperation='multiply';t.fillStyle=({Jesien:'#b8ad82',Zima:'#dae3dc',Wiosna:'#83ac65',Lato:'#a4b475'})[season];t.fillRect(0,0,1024,1024);t.globalCompositeOperation='source-over';if(season==='Zima'){t.fillStyle='#e1e7e1dc';t.fillRect(0,0,1024,1024)}}
    if(i===1){t.globalCompositeOperation='multiply';t.fillStyle=season==='Zima'?'#a3b4b4':'#9d8563';t.fillRect(0,0,1024,1024)}
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
    for(const b of buildings.filter(b=>!isBarrier(b.kind)&&!['field','pasture','lumber','quarry','orchard'].includes(b.kind))){
      const x=b.x,y=b.y+10,r=b.kind==='barn'?165:115;
      const fade=g.createRadialGradient(x,y,35,x,y,r);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');
      g.fillStyle=fade;g.fillRect(x-r,y-r*.6,r*2,r*1.3);
    }
  },2);
  layer(materials[1],g=>{
    g.fillStyle='#fff';
    for(const path of roads)for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let d=0;d<=length;d+=5){
        const t=d/length,r=19+Math.sin(d*.043+i)*3+rng()*3;
        g.beginPath();g.ellipse(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,r,r*.83,0,0,Math.PI*2);g.fill();
      }
    }
  },1.5);
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
  ctx.save();
  ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.rx-5,pond.ry-5,0,0,Math.PI*2);ctx.clip();
  const depth=ctx.createLinearGradient(pond.x,pond.y-pond.ry,pond.x,pond.y+pond.ry);
  depth.addColorStop(0,({Zima:'#d9e6e9ee',Wiosna:'#314439d9',Lato:'#123b41d9',Jesien:'#122c38d9'})[season]);depth.addColorStop(1,({Zima:'#8daebdc9',Wiosna:'#899b7040',Lato:'#438b8140',Jesien:'#547c7e40'})[season]);
  ctx.fillStyle=depth;ctx.fillRect(pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);
  if(season==='Zima')for(let i=0;i<24;i++){
    const x=pond.x+(rng()-.5)*pond.rx*2,y=pond.y+(rng()-.5)*pond.ry*2;
    ctx.strokeStyle='#edf4f4aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+22,y-8);ctx.lineTo(x+47,y-4);ctx.stroke();
  }
  ctx.restore();
  // Cart ruts follow the same road polylines used by navigation.
  ctx.strokeStyle=season==='Zima'?'#63767544':'#3f392944';ctx.lineWidth=1.4;
  for(const path of roads)for(const offset of [-8,8]){
    ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x+offset,y):ctx.moveTo(x+offset,y));ctx.stroke();
  }
  if(season==='Zima'){
    ctx.fillStyle='#e4ebe554';ctx.fillRect(0,0,W,H);
  }
  const existing=scene.textures.get('terrain');
  if(scene.textures.exists('terrain')){
    const target=existing.getSourceImage() as HTMLCanvasElement;target.getContext('2d')!.drawImage(base,0,0);(existing as Phaser.Textures.CanvasTexture).refresh();
  }else{
    scene.textures.addCanvas('terrain',base);
    scene.add.image(0,0,'terrain').setName('world-terrain').setDisplaySize(W,H).setOrigin(0).setDepth(-100);
  }
}
