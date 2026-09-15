import EasyStar from 'easystarjs';
import { WORLD_WIDTH, WORLD_HEIGHT, decorations, inPond, nearRoad, fenceObstacles, neighborObstacles } from './Landscape';
import type { Road } from './Development';
export type Point={x:number;y:number};
export type Obstacle=Point&{rx:number;ry:number};
export class Navigation {
 readonly cell=20;private finder=new EasyStar.js();private grid:number[][]=[];
 obstacles:Obstacle[]=[];private roads:Road[]=[];
 speedAt(p:Point){return this.roads.some(r=>r.kind==='stone'&&nearRoad(p.x,p.y,[r.points],22))?1.65:this.roads.some(r=>nearRoad(p.x,p.y,[r.points],22))||nearRoad(p.x,p.y)?1.3:1}
 private travelCost(a:Point,b:Point){const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/15));let cost=0;for(let i=1;i<=steps;i++)cost+=distance/steps/this.speedAt({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps});return cost}
 rebuild(buildings:Obstacle[],roads:Road[]=[]){
  this.roads=roads;
  this.obstacles=[...buildings,...neighborObstacles,...decorations.filter(d=>d.radius).map(d=>({x:d.x,y:d.y-8,rx:d.radius!,ry:d.radius!*.58}))];
  this.grid=Array.from({length:WORLD_HEIGHT/this.cell},(_,y)=>Array.from({length:WORLD_WIDTH/this.cell},(_,x)=>{
   const p={x:x*this.cell+10,y:y*this.cell+10};return this.clearPoint(p,12)?this.speedAt(p)>1.5?3:this.speedAt(p)>1?2:0:1;
  }));
  this.finder.setGrid(this.grid);this.finder.setAcceptableTiles([0,2,3]);this.finder.setTileCost(0,1.65);this.finder.setTileCost(2,1.65/1.3);this.finder.setTileCost(3,1);
  this.finder.enableDiagonals();this.finder.disableCornerCutting();this.finder.enableSync();
 }
 clearPoint(p:Point,margin=6){
  if(p.x<30+margin||p.y<80+margin||p.x>WORLD_WIDTH-30-margin||p.y>WORLD_HEIGHT-30-margin||inPond(p.x,p.y,margin))return false;
  return !this.obstacles.some(b=>((p.x-b.x)/(b.rx+margin))**2+((p.y-b.y)/(b.ry+margin))**2<1);
 }
 clearLine(a:Point,b:Point,margin=12){
  const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5);
  for(let i=1;i<=steps;i++)if(!this.clearPoint({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},margin))return false;
  return true;
 }
 nearestFree(point:Point){
  if(this.clearPoint(point,10))return {...point};
  for(let r=20;r<=220;r+=10)for(let i=0;i<24;i++){
   const p={x:point.x+Math.cos(i*Math.PI/12)*r,y:point.y+Math.sin(i*Math.PI/12)*r};
   if(this.clearPoint(p,10))return p;
  }
  return null;
 }
 route(start:Point,end:Point):Point[]|null{
  const target=this.nearestFree(end);if(!target)return null;
  if(Math.hypot(start.x-target.x,start.y-target.y)<60&&this.clearLine(start,target))return [{...target}];
  const toCell=(p:Point)=>({x:Math.max(0,Math.min(WORLD_WIDTH/20-1,Math.floor(p.x/20))),y:Math.max(0,Math.min(WORLD_HEIGHT/20-1,Math.floor(p.y/20)))});
  const s=toCell(start);
  let e=toCell(target);
  if(this.grid[e.y][e.x]===1){
   const alternatives:Point[]=[];
   for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if([0,2,3].includes(this.grid[e.y+dy]?.[e.x+dx]))alternatives.push({x:e.x+dx,y:e.y+dy});
   alternatives.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));
   if(!alternatives.length)return null;e=alternatives[0];
  }
  const old=this.grid[s.y][s.x];this.grid[s.y][s.x]=0;
  let result:Point[]|null=null;
  this.finder.findPath(s.x,s.y,e.x,e.y,path=>{
   if(!path)return;
   const points=path.slice(1).map(p=>({x:p.x*20+10,y:p.y*20+10}));
   if(points.length&&this.clearLine(points.at(-1)!,target))points.push(target);
   else if(!points.length)points.push(target);
   const smooth:Point[]=[];let from=start,index=0;
   while(index<points.length){
    let last=index;
    let cost=this.travelCost(from,points[last]);
    while(last+1<points.length){cost+=this.travelCost(points[last],points[last+1]);if(!this.clearLine(from,points[last+1])||this.travelCost(from,points[last+1])>cost*1.015)break;last++}
    smooth.push(points[last]);from=points[last];index=last+1;
   }
   result=smooth;
  });
  this.finder.calculate();this.grid[s.y][s.x]=old;return result;
 }
}
