export function createMenuCover(root:HTMLElement,source:string,isEnabled:()=>boolean){
 const video=document.createElement('video');
 video.className='menu-cover-video';video.muted=true;video.loop=true;video.playsInline=true;
 video.preload='none';video.tabIndex=-1;video.setAttribute('aria-hidden','true');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),portrait=matchMedia('(max-aspect-ratio: 13/10)');
 let failed=false,pending=false,disposed=false;
 const allowed=()=>!disposed&&!failed&&isEnabled()&&!document.hidden&&!reduced.matches&&!portrait.matches;
 const hide=()=>{video.pause();video.classList.remove('is-playing')};
 function sync(){
  if(!root.contains(video))root.prepend(video);
  if(!allowed()){hide();return}
  if(!video.hasAttribute('src'))video.src=source;
  if(pending)return;
  pending=true;
  void video.play().catch(()=>video.classList.remove('is-playing')).finally(()=>{pending=false;if(!allowed())hide()});
 }
 video.addEventListener('playing',()=>{if(allowed())video.classList.add('is-playing');else hide()});
 video.addEventListener('error',()=>{failed=true;hide()});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);portrait.addEventListener('change',sync);
 return {sync,destroy(){disposed=true;hide();video.removeAttribute('src');video.load();video.remove();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);portrait.removeEventListener('change',sync)}};
}
