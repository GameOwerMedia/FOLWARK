export type Season='Jesien'|'Zima'|'Wiosna'|'Lato';
export function calendar(time:number,daySeconds=65){
 const day=Math.floor((time+1e-7)/daySeconds)+1,dayOfYear=(day-1)%28;
 const index=dayOfYear<6?0:dayOfYear<13?1:dayOfYear<20?2:3;
 const starts=[0,6,13,20],lengths=[6,7,7,8];
 return {season:(['Jesien','Zima','Wiosna','Lato'] as Season[])[index],year:Math.floor((day-1)/28)+1,
  day:dayOfYear-starts[index]+1,days:lengths[index],progress:((time/daySeconds)%28-starts[index])/lengths[index]};
}
export const seasonalGrowth=(season:Season)=>({Jesien:1,Zima:0,Wiosna:1.3,Lato:.85})[season];
