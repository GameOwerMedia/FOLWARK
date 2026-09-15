async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(fn,msg)=>{if(!await page.evaluate(fn))throw Error(msg)};
 await page.setViewportSize({width:1440,height:960});
 await page.goto('http://127.0.0.1:5177');
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('folwark-options')||'{}');delete p.language;localStorage.setItem('folwark-options',JSON.stringify(p))});
 await page.reload();await page.locator('#loading').waitFor({state:'detached'});
 if(await page.locator('html').getAttribute('lang')!=='en')throw Error('English is not default');
 await page.getByRole('button',{name:'Options',exact:true}).click();
 if(await page.getByLabel('Language',{exact:true}).inputValue()!=='en')throw Error('Wrong language setting');
 await page.getByLabel('Language',{exact:true}).selectOption('pl');
 await page.getByRole('button',{name:'Wstecz',exact:true}).click();
 await page.getByRole('button',{name:'Nowa gra',exact:true}).click();
 await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{window.folwark.scene.world.paused=true;window.folwark.scene.onChange()});
 const original=await page.evaluate(()=>JSON.stringify(window.folwark.scene.world.snapshot()));
 await page.locator('[data-action="settings"]').click();await page.getByLabel('Jezyk',{exact:true}).selectOption('en');
 await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Return to the farm',exact:true}).click();
 if(await page.evaluate(()=>JSON.stringify(window.folwark.scene.world.snapshot()))!==original)throw Error('Language mutated the world');
 await page.waitForTimeout(100);
 await check(()=>window.folwark.scene.unitViews.get('unit-100').label.text==='Boxer','Canvas label not translated');
 await page.getByRole('button',{name:'Select: Boxer',exact:true}).click();
 if(!await page.locator('#inspector').innerText().then(s=>s.includes('Workhorse')))throw Error('Unit translation');
 const expected={mission:'Freedom has a price',economy:'Work and reserves',research:'Knowledge changes work',council:'At the common table',propaganda:'Truth is a resource',neighbors:'Stone Manor',journal:'Winter reserves'};
 for(const [tab,phrase]of Object.entries(expected)){
  await page.locator('[data-tab="'+tab+'"]').click();
  if(!(await page.locator('#inspector').innerText()).includes(phrase))throw Error('Untranslated panel '+tab);
 }
 await page.locator('[data-action="build"]').click();
 if(await page.getByRole('button',{name:'Wheat field',exact:false}).count()!==1)throw Error('Building translation');
 await page.locator('[data-action="close-tray"]').click();
 await page.locator('[data-tab="council"]').click();await page.getByLabel('Work schedule',{exact:true}).selectOption('intensive');
 await check(()=>window.folwark.scene.world.laws.work==='intensive','Translated control changed value');
 await page.locator('[data-tab="journal"]').click();
 if(!(await page.locator('#inspector').innerText()).includes('The council changed the economic laws.'))throw Error('New log not translated');
 await page.evaluate(()=>{const s=window.folwark.scene,w=s.world;w.time=129.9;w.paused=false;w.tick(.1);w.paused=true;s.onChange()});
 if(!(await page.locator('#modal').innerText()).includes('Truth at an empty table'))throw Error('Dilemma translation');
 const eventBefore=await page.evaluate(()=>JSON.stringify(window.folwark.scene.world.event));
 await page.locator('#modal [data-action="main-menu"]').click();await page.locator('[data-menu="options"]').click();await page.getByLabel('Language',{exact:true}).selectOption('pl');
 await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="continue"]').click();
 if(!(await page.locator('#modal').innerText()).includes('Prawda przy pustym stole'))throw Error('Dilemma not reversible');
 if(await page.evaluate(()=>JSON.stringify(window.folwark.scene.world.event))!==eventBefore)throw Error('Translated event mutated');
 await page.locator('[data-choice="0"]').click();
 await page.evaluate(()=>{window.folwark.scene.world.paused=true});
 await page.locator('[data-action="save"]').click();
 await page.reload();await page.locator('#loading').waitFor({state:'detached'});
 if(await page.locator('html').getAttribute('lang')!=='pl')throw Error('Polish not persisted');
 await page.getByRole('button',{name:'Kontynuuj',exact:true}).click();
 await page.evaluate(()=>{window.folwark.scene.world.paused=true});
 await page.locator('[data-action="settings"]').click();await page.getByLabel('Jezyk',{exact:true}).selectOption('en');
 await page.locator('[data-menu="main"]').click();await page.locator('[data-menu="continue"]').click();
 await page.locator('[data-tab="journal"]').click();
 if(!(await page.locator('#inspector').innerText()).includes('Spend 25 grain. +8 trust.'))throw Error('Loaded chronicle not translated');
 const sizes=[];
 for(const language of ['en','pl']){
  await page.locator('[data-action="settings"]').click();await page.locator('[data-pref="language"]').selectOption(language);await page.locator('[data-menu="main"]').click();
  for(const [width,height]of [[1920,1080],[1280,720],[390,844],[360,740],[900,900],[844,390]]){
   await page.setViewportSize({width,height});
   await page.evaluate(async()=>{const url=getComputedStyle(document.querySelector('#start-menu')).backgroundImage.slice(5,-2);const img=new Image();img.src=url;await img.decode()});
   await check(()=>document.documentElement.scrollWidth<=innerWidth,'Horizontal overflow');
   await page.screenshot({path:'output/playwright/title-'+language+'-'+width+'.png'});
   await page.locator('[data-menu="options"]').click();
   if(language==='en'&&!await page.getByLabel('Language',{exact:true}).count())throw Error('Language selector untranslated');
   await check(()=>[...document.querySelectorAll('.menu-options label')].every(el=>el.getBoundingClientRect().right<=innerWidth),'Options overflow');
   await page.screenshot({path:'output/playwright/language-options-'+language+'-'+width+'.png'});
   await page.locator('[data-menu="main"]').click();sizes.push(language+width);
  }
  await page.locator('[data-menu="continue"]').click();
 }
 await page.setViewportSize({width:1440,height:960});
 await page.locator('[data-action="settings"]').click();await page.locator('[data-pref="language"]').selectOption('en');await page.locator('[data-menu="main"]').click();
 if(errors.length)throw Error(errors.join('\n'));
 return {defaultEnglish:true,liveLanguageSwitch:true,canvasLabels:true,localizedPanels:7,saveCompatible:true,eventAndChronicle:true,sizes,errors};
}
