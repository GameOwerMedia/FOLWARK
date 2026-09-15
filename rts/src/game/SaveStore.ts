import type {Language} from '../i18n';
import {World} from '../simulation/World';
export const saveSlots=['slot-1','slot-2','slot-3','quick','auto'] as const;
export type SaveSlot=typeof saveSlots[number];
export const slotName=(slot:SaveSlot)=>slot==='quick'?'Szybki zapis':slot==='auto'?'Zapis automatyczny':'Miejsce '+slot.at(-1);
const key=(slot:SaveSlot)=>slot==='quick'?'folwark-save':slot==='auto'?'folwark-autosave':'folwark-'+slot;
export type SaveEnvelope={format:'folwark-save';savedAt:number;name:string;state:ReturnType<World['snapshot']>};
export function decodeSave(text:string){
 if(text.length>2_000_000)throw Error('Plik zapisu jest zbyt duzy.');
 let raw;try{raw=JSON.parse(text)}catch{throw Error('Nieprawidlowy plik JSON.')}
 const state=raw?.format==='folwark-save'?raw.state:raw;
 const world=new World();world.restore(state);
 return {world,savedAt:raw?.format==='folwark-save'&&Number.isFinite(raw.savedAt)?raw.savedAt:0};
}
export function saveGame(world:World,slot:SaveSlot,name=slotName(slot)){
 const data:SaveEnvelope={format:'folwark-save',savedAt:Date.now(),name,state:world.snapshot()};
 localStorage.setItem(key(slot),JSON.stringify(data));
}
export function readGame(slot:SaveSlot){
 const raw=localStorage.getItem(key(slot));if(!raw)throw Error('To miejsce zapisu jest puste.');return decodeSave(raw);
}
export function removeGame(slot:SaveSlot){localStorage.removeItem(key(slot))}
export function listGames(){
 return saveSlots.map(slot=>{
  const raw=localStorage.getItem(key(slot));if(!raw)return {slot,empty:true,error:false,day:0,population:0,savedAt:0,scenario:''};
  try{const {world,savedAt}=decodeSave(raw);return {slot,empty:false,error:false,day:world.day,population:world.living.length,savedAt,scenario:world.scenario}}
  catch{return {slot,empty:false,error:true,day:0,population:0,savedAt:0,scenario:''}}
 });
}
export function exportGame(world:World){
 return JSON.stringify({format:'folwark-save',savedAt:Date.now(),name:'Eksport folwarku',state:world.snapshot()},null,2);
}
export type Preferences={language:Language;sound:boolean;volume:number;edgeScroll:boolean;cameraSpeed:number;reducedMotion:boolean;autosaveSeconds:number};
const defaults:Preferences={language:'en',sound:false,volume:.5,edgeScroll:true,cameraSpeed:.7,reducedMotion:false,autosaveSeconds:20};
export function readPreferences():Preferences{
 try{
  const p=JSON.parse(localStorage.getItem('folwark-options')||'{}');
  return {language:p.language==='pl'?'pl':'en',sound:typeof p.sound==='boolean'?p.sound:defaults.sound,volume:typeof p.volume==='number'?Math.max(0,Math.min(1,p.volume)):.5,edgeScroll:typeof p.edgeScroll==='boolean'?p.edgeScroll:true,cameraSpeed:typeof p.cameraSpeed==='number'?Math.max(.3,Math.min(1.5,p.cameraSpeed)):.7,reducedMotion:typeof p.reducedMotion==='boolean'?p.reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,autosaveSeconds:[0,20,60,120].includes(p.autosaveSeconds)?p.autosaveSeconds:20};
 }catch{return {...defaults}}
}
export function writePreferences(p:Preferences){localStorage.setItem('folwark-options',JSON.stringify(p))}
export const escapeHtml=(s:string)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
