// Run with playwright-cli run-code --filename after entering The Sphere underwater.
// Reuse the production scene through a temporary page-only R3F store probe.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async (page) => {
  if (!page.url().includes('scene=sphere') || !page.url().includes('view=underwater')) throw Error('Enter The Sphere with the dive kit first');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    let fiber = canvas[Object.keys(canvas).find(key => key.startsWith('__reactFiber'))];
    window.__sphereProbe = {wrappers: [], store: null};
    for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const root = hook.memoizedState?.current;
        if (!root?.configure || !root?.render) continue;
        const original = root.render;
        window.__sphereProbe.wrappers.push({root, original});
        root.render = function (...args) {
          const store = original.apply(this, args);
          window.__sphereProbe.store = store;
          return store;
        };
      }
    }
  });
  const sample = () => page.evaluate(() => {
    const state = window.__sphereProbe.store?.getState();
    if (!state) throw Error('Renderer probe missing');
    const lights = [];
    state.scene.updateMatrixWorld(true);
    state.scene.traverse(o => {
      if (o.isSpotLight && o.name.startsWith('sphere-searchlight-')) lights.push({
        name:o.name, position:o.getWorldPosition(o.position.clone()).toArray(),
        target:o.target.getWorldPosition(o.position.clone()).toArray(), intensity:o.intensity,
        distance:o.distance, angle:o.angle, shadow:o.castShadow,
      });
    });
    return {lights, camera:state.camera.position.toArray(), target:state.controls.target.toArray(), fish:state.scene.getObjectByName('sphere-fish')?.count};
  });
  try {
    // Both transitions are real UI actions and force a normal Canvas render.
    const day = page.getByRole('button',{name:'Switch to afternoon',exact:true});
    if (await day.count()) await day.click();
    else {await page.getByRole('button',{name:'Switch to dusk',exact:true}).click();await day.click();}
    const daylight = await sample();
    await page.getByRole('button',{name:'Switch to dusk',exact:true}).click();
    const initial = await sample(),baseline=JSON.stringify(initial.lights);
    if (initial.lights.length!==8) throw Error('Expected eight fixed searchlights');
    if (![24,64].includes(initial.fish)) throw Error('Missing quality-tier fish school');
    for (let i=0;i<8;i++) {
      const l=initial.lights[i],a=i*Math.PI/4;
      if(Math.abs(l.position[0]-(480+41.65*Math.cos(a)))>.001||Math.abs(l.position[1]-1.2)>.001||Math.abs(l.position[2]-(390+41.65*Math.sin(a)))>.001)throw Error('Light left its fixture');
      if(l.target[1]!==-39||l.intensity!==2600||l.distance!==65||l.shadow)throw Error('Unbounded or incorrectly aimed light');
      if(daylight.lights[i].intensity!==1800)throw Error('Daytime seabed light disabled');
    }
    const viewport=page.viewportSize(),y=Math.round(viewport.height*.4),x=Math.round(viewport.width*.45);
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+70,y,{steps:12});await page.mouse.up();
    await page.waitForTimeout(500);
    const moved=await sample();
    if(JSON.stringify(moved.target)===JSON.stringify(initial.target))throw Error('Camera did not move');
    if(JSON.stringify(moved.lights)!==baseline)throw Error('Camera motion changed the light field');
    for(let i=0;i<7;i++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(400);}
    const near=await sample(),p=near.camera;
    if(Math.hypot(p[0]-480,p[1]-3,p[2]-390)<37.4)throw Error('Camera entered the glass shell');
    if(JSON.stringify(near.lights)!==baseline)throw Error('Zoom changed searchlights');
    return {fixedLights:initial.lights.length,fish:initial.fish,drag:true,zoomClearance:true,dayAndNight:true};
  } finally {
    await page.evaluate(()=>{for(const {root,original} of window.__sphereProbe.wrappers)root.render=original;delete window.__sphereProbe;});
  }
}
