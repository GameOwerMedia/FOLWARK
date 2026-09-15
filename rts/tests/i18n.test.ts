import test from 'node:test';
import assert from 'node:assert/strict';
import {t,setLanguage,getLanguage,locale,catalog} from '../src/i18n';
import {World,buildingDefs,speciesNames,taskNames} from '../src/simulation/World';
import {readPreferences,writePreferences,decodeSave,exportGame} from '../src/game/SaveStore';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}});
test('English is the default even with pre-language preferences and Polish is persistent',()=>{
 storage.clear();assert.equal(readPreferences().language,'en');
 storage.set('folwark-options',JSON.stringify({sound:true}));assert.equal(readPreferences().language,'en');
 writePreferences({...readPreferences(),language:'pl'});assert.equal(readPreferences().language,'pl');
 storage.set('folwark-options',JSON.stringify({language:'fr'}));assert.equal(readPreferences().language,'en');
});
test('catalog phrases translate fully, once, preserving case and punctuation',()=>{
 setLanguage('en');assert.equal(getLanguage(),'en');assert.equal(locale(),'en-GB');
 for(const [pl,en]of Object.entries(catalog)){assert.equal(t(pl),en,pl);assert.equal(t(pl.toUpperCase()),en.toUpperCase(),pl)}
 assert.equal(t('  Dzien 3 / 10  '),'  Day 3 / 10  ');
 assert.equal(t('Wyruszyla karawana do Wolny Mlyn.'),'A caravan departed for Free Mill.');
 assert.equal(t('xBokserx'),'xBokserx');
 assert.equal(t('Nastepny dekret za 12 godz.'),'Next edict in 12 hours');
});
test('language changes never change simulation or serialized chronicles',()=>{
 const w=new World('survival'),snapshot=w.snapshot(),text=w.journal[0].text;
 setLanguage('en');assert.notEqual(t(text),text);
 setLanguage('pl');assert.equal(t(text),text);assert.equal(locale(),'pl-PL');
 assert.deepEqual(w.snapshot(),snapshot);
 assert.deepEqual(decodeSave(exportGame(w)).world.snapshot(),snapshot);
 setLanguage('en');assert.deepEqual(w.snapshot(),snapshot);
});
test('all building descriptions, resident roles and tasks have English translations',()=>{
 setLanguage('en');
 for(const item of Object.values(buildingDefs)){assert.notEqual(t(item.name),item.name);assert.notEqual(t(item.description),item.description)}
 for(const text of [...Object.values(speciesNames),...Object.values(taskNames)])assert.notEqual(t(text),text);
});
