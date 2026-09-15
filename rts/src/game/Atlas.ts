import prepared from './prepared-atlas.json';
export type Frame = { sheet: string; rect: [number, number, number, number]; sheetSize?:[number,number] };
export function assetUrl(sheet:string):string {
  return (window as unknown as {FOLWARK_ASSETS?:Record<string,string>}).FOLWARK_ASSETS?.[sheet] ?? new URL('./assets/'+sheet+'.png?v=frontiers-8',document.baseURI).href;
}
export const sheets = ['concept-original','ui-original','resources','animals-original','buildings-original','animals-work','cards-original','buildings-civic','ui-heraldry','animals-special','cards-special','buildings-village','ui-portraits','concept-farm','animals-final','buildings-final','ui-final','cards-final'];
const f = (sheet: string, ...rect: [number, number, number, number]): Frame => ({ sheet, rect });
export const sourceFrames: Record<string, Frame> = {
  house: f('buildings-final',0,0,295,264), barn:f('buildings-final',295,40,262,226),
  granary:f('buildings-final',552,40,190,230), mill:f('buildings-final',736,0,232,277),
  smith:f('buildings-final',966,0,242,275), bakery:f('buildings-final',1208,40,240,226),
  school:f('buildings-final',0,258,198,192), library:f('buildings-final',198,270,210,178),
  stage:f('buildings-final',410,258,275,192), barracks:f('buildings-final',685,278,240,182),
  kennel:f('buildings-final',925,298,172,151), market:f('buildings-final',1098,280,168,164),
  bees:f('buildings-final',0,450,192,116), garden:f('buildings-final',192,450,256,114),
  vegetables:f('buildings-final',450,450,223,132), apple:f('buildings-final',673,443,151,136),
  pear:f('buildings-final',824,443,164,137), treeWhite:f('buildings-final',988,442,101,135),
  treePink:f('buildings-final',1180,447,93,132), treeOrange:f('buildings-final',1273,446,98,132),
  pine:f('buildings-final',1370,443,78,143), field:f('buildings-final',0,580,308,93),
  field2:f('buildings-final',308,580,246,96), fieldFence:f('buildings-final',556,580,197,93),
  stubble:f('buildings-final',753,580,249,99), soil:f('buildings-final',1003,580,202,93),
  well:f('buildings-final',12,673,109,113), crates:f('buildings-final',577,676,228,117),
  barrels:f('buildings-final',795,676,162,117), logs:f('buildings-final',1177,684,94,96),
  fence:f('buildings-final',0,785,166,70), fence2:f('buildings-final',166,787,167,72),
  wall:f('buildings-final',737,785,275,73), bridge:f('buildings-final',1163,780,285,95),
  pond:f('buildings-final',0,858,216,94), pond2:f('buildings-final',214,855,151,94),
  reeds:f('buildings-final',367,862,148,89), dock:f('buildings-final',518,862,123,91),
  lamp:f('buildings-final',642,859,59,108), flag:f('buildings-final',982,864,83,105),
  rocks:f('buildings-final',511,971,152,110), flowers:f('buildings-final',658,971,118,109),
  flowersRed:f('buildings-final',776,971,80,111), stump:f('buildings-final',969,969,142,111),
  infirmary:f('buildings-civic',970,100,267,234), tower:f('buildings-original',1230,0,218,400),
  pasture:f('buildings-original',987,373,397,167), tent:f('buildings-original',668,821,319,165),
  pig:f('animals-final',0,0,224,252), dog:f('animals-final',650,0,212,259),
  horse:f('animals-final',0,254,282,258), cow:f('animals-final',0,516,243,212),
  sheep:f('animals-final',464,573,219,153), hen:f('animals-final',705,936,179,150),
  goat:f('animals-final',847,514,153,215), ram:f('animals-final',999,491,220,249),
  boar:f('animals-final',0,721,267,213), cat:f('animals-final',705,746,207,184),
  ravenPerched:f('animals-special',808,310,243,191),
  raven:f('animals-final',880,734,225,201), donkey:f('animals-final',47,916,264,170),
  mule:f('animals-final',334,935,316,151), duck:f('animals-final',1090,759,183,173),
  goose:f('animals-final',1230,734,218,198),
  horseWork:f('animals-original',536,425,259,355), horseRest:f('animals-work',595,348,430,320),
  dogWork:f('animals-final',861,40,285,217), henWork:f('animals-final',1122,935,280,151),
  pigWork:f('animals-final',431,0,226,261), cowWork:f('animals-final',243,515,245,215),
  tools:f('resources',575,445,145,150), knowledge:f('resources',0,880,182,196), flour:f('resources',1233,899,102,169),
  wheat:f('resources',18,63,165,196), food:f('resources',180,85,154,155),
  wood:f('resources',946,90,162,149), stone:f('resources',1106,88,166,149),
  gold:f('resources',1268,62,178,184), water:f('resources',481,82,137,162),
  unrest:f('resources',1151,438,140,167), law:f('resources',347,880,169,168),
};
['pig','dog','horse','cow','sheep','hen','goat','ram','boar','cat','raven'].forEach((s,i) => sourceFrames['portrait-'+s] = f('ui-portraits',i*129+12,8,132,143));
sourceFrames['portrait-donkey'] = f('ui-portraits',262,150,136,131);
sourceFrames['portrait-mule'] = f('ui-portraits',393,150,136,131);
sourceFrames['portrait-duck'] = f('ui-portraits',131,150,136,131);
sourceFrames['portrait-goose'] = f('ui-portraits',0,150,136,131);
export const frames:Record<string,Frame> = {...sourceFrames,...prepared as unknown as Record<string,Frame>,timber:{sheet:'fence-timber',rect:[0,0,2172,724],sheetSize:[2172,724]},wolf:{sheet:'wildlife',rect:[20,350,620,550],sheetSize:[1536,1024]},fox:{sheet:'wildlife',rect:[615,460,485,450],sheetSize:[1536,1024]},human:{sheet:'wildlife',rect:[1120,20,410,930],sheetSize:[1536,1024]},winterTree:{sheet:'winter-tree',rect:[0,0,1226,1283],sheetSize:[1226,1283]}};
export const textureSheets=[...new Set([...sheets,'terrain-higgsfield','meadow-fine',...Object.values(frames).map(f=>f.sheet)])];

export function atlasStyle(key: string): string {
  const a = frames[key];
  if (!a) return '';
  const [x,y,w,h] = a.rect;
  const [sw,sh]=a.sheetSize??[1448,1086];
  return `background-image:var(--asset-${a.sheet});background-size:${sw/w*100}% ${sh/h*100}%;background-position:${x/(sw-w)*100}% ${y/(sh-h)*100}%;aspect-ratio:${w}/${h}`;
}
