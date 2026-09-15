import type {Point,Obstacle} from './Navigation';
export function pastureSegments(b:Point):number[][][]{
 const l=b.x-165,r=b.x+165,t=b.y-155,y=b.y+8;
 return [[[l,t],[r,t]],[[l,t],[l,y]],[[r,t],[r,y]],[[l,y],[b.x-48,y]],[[b.x+48,y],[r,y]]];
}
export function segmentObstacles(segments:number[][][]):Obstacle[]{
 return segments.flatMap(([a,b])=>{
  const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/16);
  return Array.from({length:count+1},(_,i)=>({x:a[0]+(b[0]-a[0])*i/count,y:a[1]+(b[1]-a[1])*i/count,rx:7,ry:7}));
 });
}
