async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1600,height:1000});
 await page.goto('http://127.0.0.1:5177/');
 await page.locator('#loading').waitFor({state:'detached',timeout:90000});
 await page.locator('[data-menu="options"]').click();
 await page.locator('[data-pref="reducedMotion"]').uncheck();
 await page.locator('[data-pref="language"]').selectOption('en');
 await page.locator('[data-menu="main"]').click();
 await page.waitForFunction(()=>{const v=document.querySelector('.menu-cover-video');return v?.readyState>=2&&!v.paused&&v.classList.contains('is-playing')});
 const details=await page.locator('.menu-cover-video').evaluate(async v=>{
  v.pause();
  const c=document.createElement('canvas');c.width=160;c.height=90;const x=c.getContext('2d');
  async function frame(t){v.currentTime=t;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));x.drawImage(v,0,0,160,90);return [...x.getImageData(0,0,160,90).data]}
  const first=await frame(.05),middle=await frame(2.5),last=await frame(v.duration-.05);
  const diff=(a,b)=>a.reduce((n,v,i)=>n+Math.abs(v-b[i]),0)/a.length;
  const result={width:v.videoWidth,height:v.videoHeight,duration:v.duration,loop:v.loop,muted:v.muted,motion:diff(first,middle),join:diff(first,last)};
  await v.play();return result;
 });
 if(!details.loop||!details.muted||details.width!==1920||details.motion<=.01||details.join>2)throw Error(JSON.stringify(details));
 await page.screenshot({path:'output/playwright/menu-cover-desktop.png'});
 await page.locator('[data-menu="options"]').click();
 if(!await page.locator('.menu-cover-video').evaluate(v=>v.paused))throw Error('Background still playing in options');
 await page.locator('[data-pref="reducedMotion"]').check();await page.locator('[data-menu="main"]').click();
 if(!await page.locator('.menu-cover-video').evaluate(v=>v.paused&&!v.classList.contains('is-playing')))throw Error('Reduced motion ignored');
 await page.locator('[data-menu="options"]').click();await page.locator('[data-pref="reducedMotion"]').uncheck();await page.locator('[data-menu="main"]').click();
 await page.waitForFunction(()=>!document.querySelector('.menu-cover-video').paused);
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="sandbox"]').click();
 if(!await page.locator('.menu-cover-video').evaluate(v=>v.paused))throw Error('Video runs during game');
 await page.locator('[data-action="main-menu"]').first().click();
 await page.waitForFunction(()=>!document.querySelector('.menu-cover-video').paused);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 if(!await page.locator('.menu-cover-video').evaluate(v=>v.paused&&getComputedStyle(v).display==='none'))throw Error('Portrait fallback missing');
 await page.screenshot({path:'output/playwright/menu-cover-mobile.png'});
 await page.setViewportSize({width:1600,height:1000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('#loading').waitFor({state:'detached'});
 if(await page.locator('.menu-cover-video').getAttribute('src'))throw Error('Reduced motion downloads video');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>!document.querySelector('.menu-cover-video').paused);
 await page.locator('.menu-cover-video').evaluate(v=>v.dispatchEvent(new Event('error')));
 if(!await page.locator('.menu-cover-video').evaluate(v=>v.paused&&!v.classList.contains('is-playing')))throw Error('Error fallback missing');
 if(errors.length)throw Error(errors.join('\n'));
 return {details,errors,controls:'passed',reducedMotion:'passed',portrait:'static cover',fallback:'passed'};
}
