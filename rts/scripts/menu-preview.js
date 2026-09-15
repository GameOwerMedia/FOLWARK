async page=>{
 await page.setViewportSize({width:1440,height:960});await page.goto('http://127.0.0.1:5177');
 await page.locator('#loading').waitFor({state:'detached'});
 await page.screenshot({path:'output/playwright/menu-desktop.png'});
 await page.locator('[data-menu="new"]').click();await page.locator('[data-scenario="survival"]').click();
 await page.evaluate(()=>{window.folwark.scene.world.paused=true;window.folwark.scene.center()});
 await page.waitForTimeout(250);await page.screenshot({path:'output/playwright/meadow-fence.png'});
 return await page.evaluate(()=>({menu:window.folwark.scene.menuOpen,time:window.folwark.scene.world.time,fence:window.folwark.scene.textures.exists('fence-horizontal')}));
}
