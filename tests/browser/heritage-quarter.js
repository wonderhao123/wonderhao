/* eslint-disable @typescript-eslint/no-unused-expressions */
// Run with playwright-cli run-code against the local production preview on port 3002.
async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:3002/');
 await page.evaluate(()=>localStorage.setItem('wonderhao.settings.v1',JSON.stringify({quality:'auto',dusk:false,reducedMotion:true,weather:'sunny'})));await page.reload();
 const enter=page.getByRole('button',{name:'Explore the island',exact:true});await Promise.race([enter.waitFor({state:'visible',timeout:60000}),page.waitForFunction(()=>document.querySelector('main')?.dataset.worldReady==='true',null,{timeout:60000})]);if(await enter.isVisible()){await enter.click();await page.locator('.arrival-screen').waitFor({state:'detached',timeout:60000})}await page.waitForFunction(()=>document.querySelector('main')?.dataset.worldReady==='true',null,{timeout:60000});
 const skip=page.getByRole('button',{name:'Skip arrival'});if(await skip.count())await skip.click();await page.setViewportSize({width:1440,height:960});
 for(const [name,position,target] of [['day',[45,120,260],[-78,30,89]],['roof',[-10,225,240],[-78,24,89]],['front',[-54,68,185],[-105,38,92]],['rear',[20,85,15],[-78,29,75]]]){
 await page.evaluate(({position,target})=>{history.replaceState({...history.state,islandCamera:{version:3,position,target,zoom:1,view:'surface'}},'','/');dispatchEvent(new PopStateEvent('popstate'))},{position,target});await page.waitForTimeout(500);await page.screenshot({path:`output/playwright/chijmes/${name}.jpg`,type:'jpeg',quality:90});}
 await page.getByRole('button',{name:'Switch to dusk',exact:true}).click();
 await page.evaluate(()=>{history.replaceState({...history.state,islandCamera:{version:3,position:[45,120,260],target:[-78,30,89],zoom:1,view:'surface'}},'','/');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/chijmes/night.jpg',type:'jpeg',quality:90});
 const day=page.getByRole('button',{name:'Switch to afternoon',exact:true});await day.click();
 await page.evaluate(()=>{history.replaceState({...history.state,islandCamera:{version:3,position:[45,120,260],target:[-78,30,89],zoom:1,view:'surface'}},'','/');dispatchEvent(new PopStateEvent('popstate'))});
 await page.screenshot({path:'output/playwright/chijmes/day.jpg',type:'jpeg',quality:90});
 await page.getByRole('button',{name:'Switch to dusk',exact:true}).click();
 await page.screenshot({path:'output/playwright/chijmes/night.jpg',type:'jpeg',quality:90});
 const metrics=await page.locator('canvas').evaluate(e=>({...e.dataset}));
 await page.mouse.move(880,530);await page.mouse.down();await page.mouse.move(960,565,{steps:12});await page.mouse.up();
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.screenshot({path:'output/playwright/chijmes/drag-night.jpg',type:'jpeg',quality:90});
 await page.evaluate(()=>localStorage.setItem('wonderhao.settings.v1',JSON.stringify({quality:'low',dusk:true,reducedMotion:true,weather:'sunny'})));
 await page.setViewportSize({width:390,height:844});await page.reload();
 await page.getByRole('button',{name:'Explore the island',exact:true}).waitFor({state:'visible',timeout:30000});await page.getByRole('button',{name:'Explore the island',exact:true}).click();await page.locator('.arrival-screen').waitFor({state:'detached',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('main')?.dataset.worldReady==='true',null,{timeout:60000});
 await page.evaluate(()=>{history.replaceState({...history.state,islandCamera:{version:3,position:[170,172,360],target:[-78,32,89],zoom:1,view:'surface'}},'','/');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForTimeout(500);
 await page.screenshot({path:'output/playwright/chijmes/mobile-low.jpg',type:'jpeg',quality:90});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 return {errors,metrics,overflow};
}
