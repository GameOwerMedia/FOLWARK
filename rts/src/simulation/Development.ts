import type { BuildingKind, Resource } from './World';
export type RoadKind='dirt'|'stone';
export type Road={id:number;kind:RoadKind;points:number[][];cost:Partial<Record<Resource,number>>};
export type Laws={work:'rested'|'balanced'|'intensive';tax:'low'|'normal'|'high';food:'saving'|'normal'|'generous';forest:'sustainable'|'intensive'};
export const defaultLaws=():Laws=>({work:'balanced',tax:'normal',food:'normal',forest:'sustainable'});
export const resourceNames:Record<Resource,string>={grain:'Zboze',wood:'Drewno',stone:'Kamien',gold:'Monety',flour:'Maka',bread:'Chleb',tools:'Narzedzia',knowledge:'Wiedza',milk:'Mleko',eggs:'Jaja',wool:'Welna',herbs:'Ziola'};
export const resourceArt:Record<Resource,string>={grain:'wheat',wood:'wood',stone:'stone',gold:'gold',flour:'flour',bread:'food',tools:'tools',knowledge:'knowledge',milk:'portrait-cow',eggs:'portrait-hen',wool:'portrait-sheep',herbs:'portrait-goat'};
export const recipes:Partial<Record<BuildingKind,{input:Partial<Record<Resource,number>>;output:Partial<Record<Resource,number>>;seconds:number}>>={
 mill:{input:{grain:5},output:{flour:4},seconds:8},
 bakery:{input:{flour:4,wood:1},output:{bread:6},seconds:9},
 smith:{input:{wood:3,stone:2},output:{tools:2},seconds:12},
 school:{input:{grain:2},output:{knowledge:3},seconds:12},
 bees:{input:{},output:{bread:2},seconds:16},
};
export const technologies={
 literacy:{name:'Powszechna nauka',cost:{knowledge:10,gold:10},description:'+15% pracy szkol i warsztatow'},
 irrigation:{name:'Nawadnianie',cost:{knowledge:45,tools:10},description:'+30% odrostu upraw'},
 preservation:{name:'Zapasy zimowe',cost:{knowledge:40,wood:25},description:'+200 miejsca na zapasy'},
 printing:{name:'Drukarnia',cost:{knowledge:25,tools:4},description:'Odblokowuje misje propagandowe swin'},
 solidarity:{name:'Solidarnosc ponad granicami',cost:{knowledge:45,gold:30},description:'Odblokowuje rewolucje i federacje'},
 charter:{name:'Karta wspolnoty',cost:{knowledge:35,gold:20},description:'Wybor ustroju wspolnoty'},
 husbandry:{name:'Opieka nad stadami',cost:{knowledge:20,grain:30},description:'Glod narasta o 15% wolniej'},
 kennels:{name:'Szkolenie psow',cost:{knowledge:30,grain:20},description:'+40% obrony psow przed drapieznikami'},
 agronomy:{name:'Plodozmian',cost:{knowledge:24,gold:15},description:'+20% zbiorow i szybszy odrost pol'},
 logistics:{name:'Wozy transportowe',cost:{knowledge:30,tools:8},description:'+8 udzwigu i +10% predkosci'},
 masonry:{name:'Ciesielstwo',cost:{knowledge:24,tools:6},description:'+30% tempa budowy'},
};
export type Technology=keyof typeof technologies;
export const prerequisites:Partial<Record<Technology,Technology[]>>={agronomy:['literacy'],logistics:['literacy'],masonry:['literacy'],irrigation:['agronomy'],preservation:['agronomy'],printing:['literacy'],solidarity:['printing','charter'],charter:['literacy'],husbandry:['literacy'],kennels:['husbandry']};
export const branches:Record<string,Technology[]>={'Technologia':['literacy','masonry','logistics'],'Agrokultura':['agronomy','irrigation','preservation','husbandry','kennels'],'Idee i propaganda':['printing','charter','solidarity']};
export const roadCost=(kind:RoadKind,length:number)=>kind==='dirt'?{wood:Math.ceil(length/35)}:{stone:Math.ceil(length/25),wood:Math.ceil(length/80)};
