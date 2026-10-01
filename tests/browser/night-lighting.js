// Run against the local production server with playwright-cli run-code --filename.
// Instrument only the test page: no scene/debug globals are shipped in the app.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Playwright CLI invokes this function expression with its page.
async (page) => {
  const errors = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  await page.goto('http://127.0.0.1:3002/');
  await page.evaluate(() => localStorage.setItem('wonderhao.settings.v1', JSON.stringify({
    quality: 'auto', dusk: true, reducedMotion: true, weather: 'sunny',
  })));
  await page.reload();
  const enter = page.getByRole('button', {name: 'Explore the island', exact: true});
  await enter.waitFor({state: 'visible', timeout: 30000});
  await enter.click();
  await page.locator('.arrival-screen').waitFor({state: 'detached', timeout: 60000});
  await page.waitForFunction(() => document.querySelector('main')?.dataset.worldReady === 'true', null, {timeout: 60000});
  const skip = page.getByRole('button', {name: 'Skip arrival'});
  if (await skip.count()) await skip.click();

  // Canvas.render returns its R3F store. Capture it on the next normal render,
  // keeping the exact children and arguments; restore the wrapper when done.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    let fiber = canvas[Object.keys(canvas).find(key => key.startsWith('__reactFiber'))];
    window.__nightLightProbe = {wrappers: [], store: null};
    for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const root = hook.memoizedState?.current;
        if (!root?.configure || !root?.render) continue;
        const original = root.render;
        window.__nightLightProbe.wrappers.push({root, original});
        root.render = function (...args) {
          const store = original.apply(this, args);
          window.__nightLightProbe.store = store;
          return store;
        };
      }
    }
  });
  const sample = () => page.evaluate(() => {
    const state = window.__nightLightProbe.store?.getState();
    if (!state) throw Error('Scene probe did not capture the renderer');
    const lights = [];
    state.scene.traverse(object => {
      if (object.isPointLight) lights.push({
        name: object.name, position: object.position.toArray(),
        intensity: object.intensity, color: object.color.getHexString(), distance: object.distance,
      });
    });
    return {target: state.controls.target.toArray(), lights};
  });
  try {
    await page.setViewportSize({width: 1440, height: 960});
    const states = [];
    // This sweep previously replaced the sphere's 7000-intensity light with
    // pier lights at x=500, then beach lights at x=575 and x=600.
    for (const x of [475, 500, 525, 550, 575, 600, 575, 550, 525, 500, 475]) {
      await page.evaluate(x => {
        history.replaceState({...history.state, islandCamera: {
          version: 3, position: [x + 170, 180, 720], target: [x, 7, 355], zoom: 1, view: 'surface',
        }}, '', '/');
        dispatchEvent(new PopStateEvent('popstate'));
      }, x);
      await page.waitForFunction(x => Math.abs(window.__nightLightProbe.store?.getState().controls.target.x - x) < .01, x);
      states.push(await sample());
    }
    const baseline = JSON.stringify(states[0].lights);
    if (states[0].lights.length !== 2) throw Error('Expected two retained local lights');
    if (states.some(state => JSON.stringify(state.lights) !== baseline)) throw Error('Lights move or change intensity while panning');

    // Real pointer dragging must obey the same invariant, not only URL restore.
    const targetBeforeDrag = (await sample()).target;
    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(980, 450, {steps: 25});
    await page.mouse.up();
    const dragged = await sample();
    if (JSON.stringify(dragged.target) === JSON.stringify(targetBeforeDrag)) throw Error('Drag did not move the camera');
    if (JSON.stringify(dragged.lights) !== baseline) throw Error('Lights changed during pointer drag');
    await page.getByRole('button', {name: 'Switch to afternoon', exact: true}).click();
    const day = await sample();
    if (day.lights.some(light => light.intensity !== 0)) throw Error('Night lights remain on in daylight');
    await page.getByRole('button', {name: 'Switch to dusk', exact: true}).click();
    const night = await sample();
    if (JSON.stringify(night.lights) !== baseline) throw Error('Dusk did not restore the same lights');
    if (errors.length) throw Error(errors.join('\n'));
    return {cameraSamples: states.length, pointerDrag: true, fixedLights: night.lights, dayOff: true, errors};
  } finally {
    page.off('pageerror', onError);
    await page.evaluate(() => {
      for (const {root, original} of window.__nightLightProbe.wrappers) root.render = original;
      delete window.__nightLightProbe;
    });
  }
}
