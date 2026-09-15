import type {Building,World} from './World';
import {segmentObstacles} from './Pastures';
export const isBarrier=(kind:string)=>['fenceH','fenceV','gateH','gateV'].includes(kind);
export const isGate=(kind:string)=>kind==='gateH'||kind==='gateV';
export function barrierSegment(b:Pick<Building,'kind'|'x'|'y'>):number[][] {
 return b.kind.endsWith('V')?[[b.x,b.y-50],[b.x,b.y+50]]:[[b.x-50,b.y],[b.x+50,b.y]];
}
export const barrierObstacles=(buildings:Building[])=>buildings.filter(b=>isBarrier(b.kind)&&b.progress>=1&&(!isGate(b.kind)||b.enabled)).flatMap(b=>segmentObstacles([barrierSegment(b)]));
export function toggleGate(w:World,id:number){
 const b=w.buildings.find(b=>b.id===id&&isGate(b.kind)&&b.progress>=1);
 if(!b||w.outcome)return false;
 // A gate may not close on a resident, caravan or predator.
 if(!b.enabled&&[...w.living,...w.regime.convoys,...w.region.traffic,...w.wildlife.predators].some(a=>segmentObstacles([barrierSegment(b)]).some(o=>Math.hypot(a.x-o.x,a.y-o.y)<24)))return false;
 b.enabled=!b.enabled;w.rebuildGrid();w.revision++;return true;
}
