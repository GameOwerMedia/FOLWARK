export const WORLD_WIDTH=3600, WORLD_HEIGHT=2400;
export type Decoration={key:string;x:number;y:number;width:number;radius?:number};
export const pond={x:340,y:960,rx:215,ry:130};
export const roads:number[][][]=[
 [[700,1260],[700,1020],[770,830],[805,640],[870,510],[1145,555],[1450,670],[1650,650],[1950,650],[2200,610],[2780,610],[2810,840],[3030,800]],
 [[350,450],[555,605],[805,640],[825,420]],
 [[805,640],[1000,790],[1050,1005]],
 [[1145,555],[1230,725],[1250,895]],
 [[700,1260],[850,1430],[1100,1550],[870,1730],[870,2050],[1100,2080]],
 [[1100,1550],[1800,1550],[2350,1740],[2580,2080],[2750,2080]],
 [[2350,1740],[2400,1490]],
 [[2580,2080],[3010,1800]],
 [[2810,840],[3270,1050],[3400,1400],[3800,1400]],
];
export const decorations:Decoration[]=[];
let seed=192;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<35;i++){
 const x=80+random()*1640,y=170+random()*920;
 if(x>90&&x<1690&&y>175&&y<1190||nearRoad(x,y,roads,80))continue;
 decorations.push({key:['apple','treeOrange','treeWhite'][i%3],x,y,width:100+random()*40,radius:18});
}
const props:[string,number,number,number,number?][]=[
 ['apple',200,605,135,22],['apple',240,720,140,22],['treeOrange',145,815,120,18],


 ['fence',310,580,140,35],['fence2',530,725,145,35],
 ['lamp',880,520,38,5],['lamp',1215,575,38,5],
 ['barrels',950,445,75,22],['crates',680,380,80,24],['flag',1230,450,42],
 ['flowers',980,465,65],['flowersRed',1210,680,65],['flowers',895,815,65],
 ['reeds',160,1030,65],['reeds',500,1060,65],['reeds',290,835,65],
 ['stump',1390,820,65,18],['logs',1350,940,75,24],['rocks',1540,715,85,25],
 ['tent',1500,1020,145,43],['market',1420,430,190,55],
];
for(const[key,x,y,width,radius]of props)decorations.push({key,x,y,width,radius});
export function inPond(x:number,y:number,margin=0){
 return ((x-pond.x)/(pond.rx+margin))**2+((y-pond.y)/(pond.ry+margin))**2<1;
}
export function nearRoad(x:number,y:number, paths=roads, radius=24){
 for(const path of paths)for(let i=1;i<path.length;i++){
  const[a,b]=[path[i-1],path[i]],dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<radius)return true;
 }
 return false;
}
export const farmBounds={left:100,right:1650,top:180,bottom:1150};
export const fenceSegments:number[][][]=[
 [[100,180],[1650,180]],[[100,180],[100,1150]],
 [[100,1150],[635,1150]],[[765,1150],[1650,1150]],
 [[1650,180],[1650,590]],[[1650,715],[1650,1150]],
];
export const gates=[{x:700,y:1150,name:'Brama poludniowa'},{x:1650,y:650,name:'Brama wschodnia'}];
export const neighborSites=[
 {id:'dwor',name:'Kamienny Dwor',x:3110,y:635,entry:{x:3030,y:800},art:'house',description:'Ludzie. Kupia plony. Kupia tez cudza prace.'},
 {id:'mlyn',name:'Wolny Mlyn',x:1120,y:1920,entry:{x:1100,y:2080},art:'mill',description:'Spoldzielnia. Wymienia plony i opal. Nie ufa represjom.'},
 {id:'czerwony',name:'Czerwony Folwark',x:2830,y:1920,entry:{x:2750,y:2080},art:'barn',description:'Rzadza swinie. Zloto otwiera ich spichlerze.'},
] as const;
export const fenceObstacles=fenceSegments.flatMap(([a,b])=>{
 const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/20);
 return Array.from({length:count+1},(_,i)=>({x:a[0]+(b[0]-a[0])*i/count,y:a[1]+(b[1]-a[1])*i/count,rx:12,ry:12}));
});
export const cityGate={id:'city',name:'Miasto / trakt kupiecki',x:3540,y:1400,entry:{x:3540,y:1400}};
export const tradeSites=[...neighborSites,cityGate];
export const neighborObstacles=neighborSites.flatMap(n=>[{x:n.x,y:n.y-25,rx:90,ry:38},{x:n.x-150,y:n.y+45,rx:65,ry:30}]);
export const regions=[{name:'Stary folwark',x:850,y:650},{name:'Wschodnie laki',x:2470,y:680},{name:'Kamienny grzbiet',x:2860,y:1650},{name:'Poludniowy sad',x:1120,y:1820}];
for(let i=0;i<95;i++){
 const x=100+random()*(WORLD_WIDTH-200),y=200+random()*(WORLD_HEIGHT-280);
 if(x<1750&&y<1200||nearRoad(x,y,roads,85)||neighborSites.some(n=>Math.hypot(x-n.x,y-n.y)<280))continue;
 if((x>2200&&x<2900&&y<1150)||(x>800&&x<1500&&y>1450&&y<2000))continue;
 decorations.push({key:['treeOrange','apple','pine','treeWhite'][i%4],x,y,width:95+random()*65,radius:20});
}
