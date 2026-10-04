// Run with playwright-cli run-code --filename after opening The Cube at the surface.
// Repeat after switching quality. Uses the live scene, with no application debug hooks.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async (page) => {
  if (!page.url().includes('scene=cube') || page.url().includes('view=underwater')) throw Error('Open The Cube surface view first');
  const attach=()=>page.evaluate(() => {
    for(const {root,original} of window.__cubeProbe?.wrappers??[])root.render=original;
    const canvas = document.querySelector('canvas');
    let fiber = canvas[Object.keys(canvas).find(key => key.startsWith('__reactFiber'))];
    window.__cubeProbe = {wrappers:[],store:null};
    for (let i=0;fiber&&i<8;i++,fiber=fiber.return) for(let hook=fiber.memoizedState;hook;hook=hook.next){
      const root=hook.memoizedState?.current;
      if(!root?.configure||!root?.render)continue;
      const original=root.render;window.__cubeProbe.wrappers.push({root,original});
      root.render=function(...args){const store=original.apply(this,args);window.__cubeProbe.store=store;return store;};
    }
  });
  await attach();
  const sample=()=>page.evaluate(()=>{
    const s=window.__cubeProbe.store?.getState();if(!s)throw Error('Missing scene probe');
    const cube=s.scene.getObjectByName('cube-solid'),trench=s.scene.getObjectByName('cube-trench');
    let glow=null;s.scene.traverse(o=>{if(o.material?.uniforms?.cubeNight)glow=o.material.uniforms.cubeNight.value;});
    return {solid:!!cube,centre:cube?.position.toArray(),size:cube?.geometry.parameters.width,emission:cube?.material.emissiveIntensity,trench:!!trench,camera:s.camera.position.toArray(),glow};
  });
  const night=async(value)=>{
    const button=page.getByRole('button',{name:value?'Switch to dusk':'Switch to afternoon',exact:true});
    if(await button.count())await button.click();
    await page.waitForTimeout(400);
  };
  try{
    await night(true);await night(false);
    const day=await sample();if(day.solid||day.trench||day.glow!==0)throw Error('Cube exposed at daytime surface');
    await night(true);const surface=await sample();
    if(surface.solid||surface.trench||surface.glow!==1)throw Error('Surface must contain only night water glow');
    const kit=page.getByRole('button',{name:'Collect dive kit',exact:true});if(await kit.count())await kit.click();
    await page.getByRole('button',{name:'Descend to The Cube',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('main')?.dataset.worldReady==='true');
    await attach();await night(false);await night(true);
    await page.waitForTimeout(1200);
    const dive=await sample();
    if(!dive.solid||!dive.trench||dive.size!==56||JSON.stringify(dive.centre)!=='[1120,-54,1420]'||dive.emission!==1.15||dive.camera[1]>=-8)throw Error('Incorrect deep dive geometry or framing: '+JSON.stringify(dive));
    await night(false);const submergedDay=await sample();if(submergedDay.emission!==0)throw Error('Daytime solid emits');
    await night(true);
    for(let i=0;i<8;i++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(350);}
    const near=await sample();if(near.centre.every((v,i)=>Math.abs(near.camera[i]-v)<31))throw Error('Camera entered solid');
    await page.getByRole('button',{name:'↑ Return to shore',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('main')?.dataset.worldReady==='true');
    await attach();await night(false);await night(true);
    if(page.url().includes('view=underwater')||(await sample()).solid)throw Error('Return leaves the solid exposed');
    return {surfaceDay:true,surfaceNightGlowOnly:true,deepDive:true,dayAndNight:true,zoomClearance:true,return:true,centre:dive.centre,camera:dive.camera};
  }finally{
    await page.evaluate(()=>{for(const {root,original} of window.__cubeProbe.wrappers)root.render=original;delete window.__cubeProbe;});
  }
}
