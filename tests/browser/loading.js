// Run with playwright-cli run-code --filename after opening the production site.
// Hold/fail real assets so completion cannot be simulated by an elapsed timer.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async (page) => {
  const origin = new URL(page.url()).origin;
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__loadingSamples = [];
    window.__loadingTimeline = [];
    window.__loadingDialNode = null;
    window.__loadingMounts = 0;
    new MutationObserver(() => {
      const dial = document.querySelector('.loading-dial');
      if (dial && dial !== window.__loadingDialNode) { window.__loadingDialNode = dial; window.__loadingMounts++; }
      const loader = document.querySelector('.world-loading');
      const phase = !loader ? 'gone' : loader.dataset.exiting === 'true' ? 'exiting' : loader.dataset.complete === 'true' ? 'complete' : 'loading';
      if (window.__loadingTimeline.at(-1)?.phase !== phase) window.__loadingTimeline.push({ phase, at: performance.now(), rotation: loader ? getComputedStyle(loader.querySelector('.loading-dial-ticks')).transform : null });
      const meter = document.querySelector('[role="progressbar"]');
      if (!meter) return;
      const value = Number(meter.getAttribute('aria-valuenow'));
      const previous = window.__loadingSamples.at(-1);
      if (previous?.value === value) return;
      window.__loadingSamples.push({
        value,
        at: performance.now(),
        target: Number(document.querySelector(".world-loading")?.dataset.progressTarget),
        worldReady: document.querySelector('main')?.dataset.worldReady,
        gpuFrame: Number(document.querySelector('canvas')?.dataset.revealTime || 0),
        fonts: document.fonts.status,
      });
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-valuenow', 'data-complete', 'data-exiting'] });
  });
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  for (const quality of ['standard', 'low']) {
    await page.setViewportSize(quality === 'low' ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.evaluate(quality => {
      localStorage.clear();
      localStorage.setItem('wonderhao.settings.v1', JSON.stringify({ quality: quality === 'low' ? 'low' : 'auto' }));
    }, quality);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const held = [];
    const pattern = '**/world/models/ring*.glb*';
    await page.route(pattern, async route => { held.push(route.request().url()); await gate; await route.continue(); });
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')) > 10, null, { timeout: 30000 });
      await page.waitForTimeout(quality === 'standard' ? 16000 : 2100);
      const before = await page.evaluate(() => ({
        progress: Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')),
        arrival: !!document.querySelector('.arrival-screen'),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert(held.length > 0, 'The required GLB was not intercepted');
      assert(before.progress < 100 && !before.arrival, 'Revealed while a GLB is still pending');
      assert(!before.overflow, 'Loader overflows the viewport');
      await page.screenshot({ path: `output/playwright/loading-${quality}.png` });
      if (quality === 'low') {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert(await page.evaluate(() => [...document.querySelectorAll('.loading-dial *')].every(el => getComputedStyle(el).animationName === 'none')), 'Reduced motion still animates');
        await page.screenshot({ path: 'output/playwright/loading-reduced.png' });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      release();
      await page.waitForSelector('.arrival-screen', { timeout: 60000 });
      assert(await page.evaluate(() => window.__loadingMounts) === 1, 'Saved quality restarted the entrance animation');
      const timeline = await page.evaluate(() => window.__loadingTimeline);
      const completed = timeline.find(item => item.phase === 'complete');
      const exiting = timeline.find(item => item.phase === 'exiting');
      const gone = timeline.find(item => item.phase === 'gone' && item.at > completed?.at);
      assert(completed && exiting && gone, `Missing completion phases: ${JSON.stringify(timeline)}`);
      assert(exiting.at - completed.at >= 990, `100% hold too short: ${JSON.stringify(timeline)}`);
      assert(gone.at - exiting.at >= 390, `Exit too short: ${JSON.stringify(timeline)}`);
      assert(completed.rotation !== exiting.rotation, 'Rings stopped during the 100% hold');
      const samples = await page.evaluate(() => window.__loadingSamples);
      const final = samples.find(sample => sample.value === 100);
      assert(final && final.worldReady === 'true' && final.gpuFrame > 0 && final.fonts === 'loaded', '100 appeared before the GPU/font barrier');
      assert(samples.every(sample => sample.value <= sample.target), 'Smoothed display outran actual readiness');
      assert(samples.every((sample, i) => i === 0 || sample.value >= samples[i - 1].value), 'Progress moved backwards during one preparation');
      results.push({ quality, held: held[0], before, samples: samples.length, completion: final, holdMs: exiting.at - completed.at, exitMs: gone.at - exiting.at, maxIncrement: Math.max(...samples.slice(1).map((sample,i)=>sample.value-samples[i].value)) });
      await page.getByRole('button', { name: 'Explore the island', exact: true }).click();
      await page.waitForSelector('.arrival-screen', { state: 'detached' });
      assert(await page.locator('.world-viewport').getAttribute('inert') === null, 'World remains inert after entry');
    } finally { release(); await page.unroute(pattern); }
  }
  // Decode failures in pass assets also hold the barrier, with a working retry.
  await page.route('**/card/foil-grain.svg', route => route.abort());
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.world-loading[data-error="true"]');
  assert(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow')) < 100, 'Failed page asset reached 100');
  await page.waitForTimeout(2100);
  await page.screenshot({ path: 'output/playwright/loading-error.png' });
  await page.unroute('**/card/foil-grain.svg');
  await page.getByRole('button', { name: 'Retry', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.arrival-screen', { timeout: 60000 });
  results.push({ pageAssetFailure: 'held below 100; keyboard retry recovered' });
  // A failed model must likewise keep the scene hidden and support low-tier retry.
  await page.route('**/world/models/ring*.glb*', route => route.abort());
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.world-loading[data-error="true"]');
  assert(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow')) < 100, 'Failed GLB reached 100');
  await page.unroute('**/world/models/ring*.glb*');
  await page.getByRole('button', { name: 'Use lightweight view', exact: true }).click();
  await page.waitForSelector('.arrival-screen', { timeout: 60000 });
  results.push({ modelFailure: 'held below 100; lightweight recovery passed' });
  // Hold the final GPU fence even though every network resource has completed.
  await page.addInitScript(() => {
    window.__holdLoadingGpu = true;
    const original = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function (...args) {
      return window.__holdLoadingGpu ? this.TIMEOUT_EXPIRED : original.apply(this, args);
    };
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')) >= 90, null, { timeout: 30000 });
  await page.waitForTimeout(1000);
  assert(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow')) < 100, 'Pending GPU fence reached 100');
  await page.evaluate(() => { window.__holdLoadingGpu = false; });
  await page.waitForSelector('.arrival-screen', { timeout: 60000 });
  results.push({ gpuFence: 'held below 100 until GPU completion' });
  // Browser back during an unfinished interior cannot reuse surface readiness.
 await page.getByRole('button',{name:'Explore the island',exact:true}).click();
 await page.waitForSelector('.arrival-screen',{state:'detached'});
 await page.evaluate(()=>{window.__holdLoadingGpu=true;history.pushState({},'', '/?place=commons&level=b1');dispatchEvent(new PopStateEvent('popstate'));});
 await page.waitForSelector('.world-loading');
 await page.evaluate(()=>{history.back();});
 await page.waitForFunction(()=>location.search==='');
 await page.waitForTimeout(800);
 const returning=await page.evaluate(()=>({loading:!!document.querySelector('.world-loading'),ready:document.querySelector('main').dataset.worldReady,progress:document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')}));
 if(!returning.loading||returning.ready!=='false'||Number(returning.progress)>=100)throw Error(JSON.stringify(returning));
 await page.evaluate(()=>{window.__holdLoadingGpu=false;});
 await page.waitForSelector('.world-loading',{state:'detached',timeout:30000});
  results.push({ returning, recovered: true });
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  return results;
}
