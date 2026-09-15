import {seasonPhrases} from './seasons';
import {societyPhrases} from './society';
import {menuPhrases} from './menu';
import {economyPhrases} from './economy';
import {regimePhrases} from './regime';
export type Language='en'|'pl';
let language:Language='en';
export const getLanguage=()=>language;
export const locale=()=>language==='pl'?'pl-PL':'en-GB';
export function setLanguage(value:Language){
 language=value;
 if(typeof document!=='undefined'){
  document.documentElement.lang=value;
  document.title=value==='en'?'FOLWARK | Survival and power':'FOLWARK | Przetrwanie i wladza';
 }
}
export const catalog:Record<string,string>=Object.fromEntries([menuPhrases,economyPhrases,regimePhrases,societyPhrases,seasonPhrases].flatMap(part=>part.trim().split('\n').filter(line=>line.trim()).map(line=>line.split('|'))));
const variants=new Map<string,string>();
for(const [pl,en]of Object.entries(catalog)){
 variants.set(pl.toLowerCase(),en.toLowerCase());
 variants.set(pl.toUpperCase(),en.toUpperCase());
 variants.set(pl,en);
}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrases=[...variants.keys()].sort((a,b)=>b.length-a.length).map(escape);
// One pass, longest phrase first: values and existing chronicles are never rewritten.
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+phrases.join('|')+')(?![\\p{L}\\p{N}_])','gu');
const cache=new Map<string,string>();
export function t(source:string){
 if(language==='pl')return source;
 const hit=cache.get(source);if(hit!==undefined)return hit;
 const result=source.replace(pattern,match=>variants.get(match)!);
 if(cache.size>3000)cache.clear();cache.set(source,result);return result;
}
type Entry={source:string;output:string};
const originals=new WeakMap<Node,Map<string,Entry>>();
function translate(node:Node,key:string,value:string,write:(value:string)=>void){
 let entries=originals.get(node);if(!entries){entries=new Map();originals.set(node,entries)}
 const previous=entries.get(key),source=previous?.output===value?previous.source:value,output=t(source);
 entries.set(key,{source,output});if(value!==output)write(output);
}
// Localize text and accessibility attributes, not markup, IDs, input values or handlers.
export function localizeDOM(root:Element){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 const visit=(node:Node)=>{
  if(node.nodeType===Node.TEXT_NODE){
   if(node.parentElement?.closest('script,style,svg,[data-no-i18n]'))return;
   const value=node.nodeValue??'';if(value.trim())translate(node,'text',value,v=>node.nodeValue=v);
  }else if(node instanceof Element&&!node.closest('[data-no-i18n]')){
   for(const key of ['title','aria-label','alt','placeholder']){
    const value=node.getAttribute(key);if(value)translate(node,key,value,v=>node.setAttribute(key,v));
   }
  }
 };
 visit(root);let node:Node|null;while((node=walker.nextNode()))visit(node);
}
