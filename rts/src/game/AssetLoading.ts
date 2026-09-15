import type Phaser from 'phaser';
import {getLanguage} from '../i18n';
import {assetUrl,frames} from './Atlas';

const required=new Map<string,{sheet:string;width:number;height:number}>();
for(const frame of Object.values(frames)){
 const previous=required.get(frame.sheet);
 required.set(frame.sheet,{sheet:frame.sheet,
  width:Math.max(previous?.width??0,frame.sheetSize?.[0]??frame.rect[0]+frame.rect[2]),
  height:Math.max(previous?.height??0,frame.sheetSize?.[1]??frame.rect[1]+frame.rect[3])});
}
required.set('meadow-fine',{sheet:'meadow-fine',width:256,height:256});
required.set('terrain-materials',{sheet:'terrain-higgsfield',width:512,height:512});

function missingAssets(scene:Phaser.Scene){
 return [...required.keys()].filter(key=>{
  if(!scene.textures.exists(key))return true;
  const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const expected=required.get(key)!;
  return source.width<expected.width||source.height<expected.height;
 });
}

function loadingScreen(state:'loading'|'recovering'|'error',keys:string[]=[],retry?:()=>void){
 const root=document.getElementById('loading');
 if(!root)return;
 const pl=getLanguage()==='pl';
 root.dataset.state=state;root.setAttribute('role',state==='error'?'alert':'status');
 root.setAttribute('aria-live','polite');root.replaceChildren();
 const title=document.createElement('strong');title.textContent='FOLWARK';root.append(title);
 const message=document.createElement('span');
 message.textContent=state==='error'
  ?(pl?'Nie udalo sie pobrac wszystkich grafik. Zapis gry jest bezpieczny.':'Some artwork could not be loaded. Your saved game is safe.')
  :state==='recovering'
   ?(pl?'Ponownie pobieramy brakujace grafiki...':'Retrying missing artwork...')
   :(pl?'Wczytywanie grafiki folwarku...':'Loading the farm artwork...');
 root.append(message);
 if(state==='error'){
  const files=document.createElement('small');files.textContent=keys.map(key=>required.get(key)!.sheet+'.png').join(', ');root.append(files);
  const button=document.createElement('button');button.type='button';button.dataset.retryAssets='';
  button.textContent=pl?'Ponow wczytywanie':'Retry loading';button.addEventListener('click',()=>retry?.());root.append(button);button.focus();
 }else{
  const line=document.createElement('div');line.className='loader-line';root.append(line);
 }
}

export function preloadAssets(scene:Phaser.Scene){
 for(const id of ['shell','start-menu'])document.getElementById(id)?.setAttribute('inert','');
 loadingScreen('loading');
 scene.load.maxRetries=1;
 scene.load.maxParallelDownloads=2;
 scene.load.setCORS('anonymous');
 for(const [key,{sheet}]of required)scene.load.image({key,url:assetUrl(sheet),xhrSettings:{responseType:'blob',timeout:30000}});
}

// Native image loading is a second transport when XHR/blob loading or decoding fails.
function recoverImage(scene:Phaser.Scene,key:string){
 return new Promise<void>((resolve,reject)=>{
  const expected=required.get(key)!,image=new Image();
  let done=false;
  const finish=(error?:Error)=>{
   if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;
   if(error){image.src='';reject(error)}else resolve();
  };
  const timer=setTimeout(()=>finish(new Error('Image timeout: '+key)),30000);
  image.crossOrigin='anonymous';
  image.onload=()=>{
   if(image.naturalWidth<expected.width||image.naturalHeight<expected.height){finish(new Error('Invalid image dimensions: '+key));return}
   try{
    if(scene.textures.exists(key))scene.textures.remove(key);
    if(!scene.textures.addImage(key,image))throw new Error('Texture upload failed: '+key);
    finish();
   }catch(error){finish(error instanceof Error?error:new Error(String(error)))}
  };
  image.onerror=()=>finish(new Error('Image download failed: '+key));
  const url=new URL(assetUrl(expected.sheet));
  if(url.protocol==='https:'||url.protocol==='http:')url.searchParams.set('retry',Date.now().toString());
  image.src=url.href;
 });
}

export function finishAssetLoading(scene:Phaser.Scene,ready:()=>void){
 const complete=()=>{
  for(const id of ['shell','start-menu'])document.getElementById(id)?.removeAttribute('inert');
  ready();
 };
 const missing=missingAssets(scene);
 if(!missing.length){complete();return}
 const recover=async()=>{
  const keys=missingAssets(scene);loadingScreen('recovering');
  // Sequential recovery avoids downloading both large atlases at once on a weak connection.
  for(const key of keys){
   try{await recoverImage(scene,key)}catch(error){console.warn('[FOLWARK assets]',error)}
  }
  const remaining=missingAssets(scene);
  if(remaining.length)loadingScreen('error',remaining,()=>{void recover()});
  else complete();
 };
 void recover();
}
