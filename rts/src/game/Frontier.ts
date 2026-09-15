import {t} from '../i18n';
import Phaser from 'phaser';
import {drawFence} from './Fence';
import { gates, neighborSites,cityGate } from '../simulation/Landscape';
import type { FarmScene } from './FarmScene';
export class Frontier {
 private labels:{view:Phaser.GameObjects.Text;source:string}[]=[];
 private label(x:number,y:number,source:string,size:number,depth:number){const view=this.scene.add.text(x,y,t(source),{fontFamily:'Georgia',fontSize:size+'px',color:'#e1d4b2',stroke:'#253323',strokeThickness:3}).setOrigin(.5).setDepth(depth);this.labels.push({view,source})}
 private sites:{id:string;view:Phaser.GameObjects.Image}[]=[];
 private workers=new Map<string,Phaser.GameObjects.Image[]>();
 private merchants=new Map<number,Phaser.GameObjects.Image>();
 private convoys=new Map<number,Phaser.GameObjects.Image>();
 constructor(private scene:FarmScene){
  drawFence(scene);
  for(const gate of gates)this.label(gate.x,gate.y+38,gate.name,12,gate.y+100);
  scene.art('lamp',cityGate.x-12,cityGate.y-45,52);
  this.label(cityGate.x-120,cityGate.y-85,'DO MIASTA',20,2000);
  for(const n of neighborSites){
   this.sites.push({id:n.id,view:scene.art(n.art,n.x,n.y,230)});
   this.workers.set(n.id,Array.from({length:3},(_,i)=>scene.art(i===2?'horse':n.id==='dwor'?'pig':'sheep',n.x+i*30,n.y+85,38)));
   scene.art('barn',n.x-150,n.y+70,150);scene.art('field',n.x+150,n.y+90,175).setDepth(-10);
   this.label(n.x,n.y+155,n.name.toUpperCase(),19,n.y+500);
  }
 }
 siteAt(x:number,y:number){if(Math.hypot(x-cityGate.x,y-cityGate.y)<100)return 'city';return this.sites.find(s=>s.view.getBounds().contains(x,y))?.id}
 update(){
  for(const {view,source}of this.labels)view.setText(t(source));
  const state=this.scene.world.regime.convoys;
  for(const [id,view]of this.convoys)if(!state.some(c=>c.id===id)){view.destroy();this.convoys.delete(id)}
  for(const n of this.scene.world.region.settlements){
   const site=neighborSites.find(s=>s.id===n.id)!;
   this.workers.get(n.id)?.forEach((view,i)=>{
    const p=((n.cycle/12+i/3)%1),working=n.status==='working'&&i<n.workers;
    const q=p<.5?p*2:2-p*2;
    view.setPosition(site.x-120+q*240,site.y+112+Math.sin(q*Math.PI)*24).setDepth(view.y).setFlipX(p>.5);
    view.setAlpha(i<n.workers?1:.35);
    const texture='gait-'+(i===2?'horse':site.id==='dwor'?'pig':'sheep');
    if(this.scene.textures.exists(texture)){
     view.setTexture(texture,working&&!this.scene.reducedMotion?Math.floor(p*60)%12:0);
     view.setDisplaySize(38,38*view.frame.height/view.frame.width);
    }
   });
  }
  const traffic=this.scene.world.region.traffic;
  for(const[id,v]of this.merchants)if(!traffic.some(t=>t.id===id)){v.destroy();this.merchants.delete(id)}
  for(const t of traffic){
   let view=this.merchants.get(t.id);if(!view){view=this.scene.art('horseWork',t.x,t.y,58);this.merchants.set(t.id,view)}
   view.setVisible(t.leg!=='abroad').setPosition(t.x,t.y).setDepth(t.y);
   if(t.path[0])view.setFlipX(t.path[0].x<t.x);
  }
  for(const c of state){
   let view=this.convoys.get(c.id);if(!view){view=this.scene.art('horseWork',c.x,c.y,66);this.convoys.set(c.id,view)}
   view.setVisible(c.state!=='abroad').setPosition(c.x,c.y).setDepth(c.y);
   if(c.path[0])view.setFlipX(c.path[0].x<c.x);
  }
 }
}
