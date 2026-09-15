import Phaser from 'phaser';
import { pond, decorations } from '../simulation/Landscape';
import { buildingDefs, type World } from '../simulation/World';

export class Atmosphere {
 private shadows:Phaser.GameObjects.Graphics;
 private water:Phaser.GameObjects.Graphics;
 private signature='';
 constructor(private scene:Phaser.Scene){
  this.shadows=scene.add.graphics().setDepth(-15);
  this.water=scene.add.graphics().setDepth(-50);
 }
 update(world:World,reducedMotion=false){
  const signature=world.buildings.map(b=>b.id+':'+b.kind+':'+b.x+':'+b.y+':'+Math.floor(b.progress*10)).join(',');
  if(signature!==this.signature){
   this.signature=signature;this.shadows.clear();
   const objects=[...decorations.filter(d=>d.radius&&d.key!=='fence'&&d.key!=='fence2').map(d=>({x:d.x,y:d.y,w:d.width,p:1})),
    ...world.buildings.filter(b=>!['field','garden','orchard','lumber','quarry','stage'].includes(b.kind)).map(b=>({x:b.x,y:b.y,w:buildingDefs[b.kind].width,p:b.progress}))];
   for(const o of objects)for(let i=4;i>=0;i--)this.shadows.fillStyle(0x14231b,.025+(.012*(4-i))).fillEllipse(o.x+o.w*.08,o.y-6,o.w*(.64+i*.075),o.w*(.12+i*.025)*(.3+.7*o.p));
  }
  const t=reducedMotion?0:world.time,g=this.water;g.clear();
  for(let i=0;i<18;i++){
   const angle=i*2.39996,r=Math.sqrt((i+.5)/18),x=pond.x+Math.cos(angle)*pond.rx*r*.82,y=pond.y+Math.sin(angle)*pond.ry*r*.82;
   const phase=(t*.2+i*.137)%1,alpha=Math.sin(phase*Math.PI)*.16;
   g.lineStyle(.8,0xd6eee3,alpha).beginPath().arc(x,y,8+phase*18,.12*Math.PI,.82*Math.PI).strokePath();
  }
 }
}
