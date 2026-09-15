import type { BuildingKind, Resource } from './World';
export type RoadKind='dirt'|'stone';
export type Road={id:number;kind:RoadKind;points:number[][];cost:Partial<Record<Resource,number>>};
export type Laws={work:'rested'|'balanced'|'intensive';tax:'low'|'normal'|'high';food:'saving'|'normal'|'generous';forest:'sustainable'|'intensive'};
export const defaultLaws=():Laws=>({work:'balanced',tax:'normal',food:'normal',forest:'sustainable'});
export const resourceNames:Record<Resource,string>={grain:'Zboze',wood:'Drewno',stone:'Kamien',gold:'Monety',flour:'Maka',bread:'Chleb',tools:'Narzedzia',knowledge:'Wiedza'};
export const resourceArt:Record<Resource,string>={grain:'wheat',wood:'wood',stone:'stone',gold:'gold',flour:'flour',bread:'food',tools:'tools',knowledge:'knowledge'};
export const recipes:Partial<Record<BuildingKind,{input:Partial<Record<Resource,number>>;output:Partial<Record<Resource,number>>;seconds:number}>>={
 mill:{input:{grain:5},output:{flour:4},seconds:8},
 bakery:{input:{flour:4,wood:1},output:{bread:6},seconds:9},
 smith:{input:{wood:3,stone:2},output:{tools:2},seconds:12},
 school:{input:{grain:2},output:{knowledge:3},seconds:12},
 bees:{input:{},output:{bread:2},seconds:16},
};
export const technologies={
 agronomy:{name:'Plodozmian',cost:{knowledge:24,gold:15},description:'+20% zbiorow i szybszy odrost pol'},
 logistics:{name:'Wozy transportowe',cost:{knowledge:30,tools:8},description:'+8 udzwigu i +10% predkosci'},
 masonry:{name:'Ciesielstwo',cost:{knowledge:24,tools:6},description:'+30% tempa budowy'},
};
export type Technology=keyof typeof technologies;
export const roadCost=(kind:RoadKind,length:number)=>kind==='dirt'?{wood:Math.ceil(length/35)}:{stone:Math.ceil(length/25),wood:Math.ceil(length/80)};
