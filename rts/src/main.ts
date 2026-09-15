import {localizeDOM,setLanguage} from './i18n';
import {readPreferences} from './game/SaveStore';
import Phaser from 'phaser';
import { FarmScene } from './game/FarmScene';
import { attachUI } from './game/UI';
import './style.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
setLanguage(readPreferences().language);
localizeDOM(document.getElementById('loading')!);
const scene=new FarmScene();
attachUI(scene);
const game=new Phaser.Game({
  type:Phaser.AUTO,parent:'game',backgroundColor:'#414d35',scene:[scene],
  scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},
  render:{antialias:true,roundPixels:false},input:{activePointers:3},
  audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false},
});
document.addEventListener('asset-error',event=>{
  const loading=document.getElementById('loading');
  if(loading)loading.innerHTML='<strong>Nie mozna wczytac grafik</strong><span>Sprawdz pliki w katalogu assets i odswiez strone.</span>';
  console.error('Missing asset',(event as CustomEvent).detail);
});
// Live scene access for save diagnostics and deterministic smoke checks.
Object.assign(window,{folwark:{game,scene}});
