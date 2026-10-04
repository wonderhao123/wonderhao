// Run after entering The Ring, in each quality. Temporary renderer probes are restored.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async(page)=>{
 const viewport=page.viewportSize();
 await page.evaluate(()=>{
  window.__ringProbe={wrappers:[],store:null};
  const canvas=document.querySelector('canvas');
  let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
  for(let i=0;fiber&&i<8;i++,fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){
   const root=hook.memoizedState?.current;if(!root?.configure||!root?.render)continue;
   const original=root.render;window.__ringProbe.wrappers.push({root,original});
   root.render=function(...args){const store=original.apply(this,args);window.__ringProbe.store=store;return store;};
  }
 });
 const sample=()=>page.evaluate(()=>{
  const s=window.__ringProbe.store.getState();s.scene.updateMatrixWorld(true);
  return Array.from({length:5},(_,i)=>{const o=s.scene.getObjectByName(`Ring_orbit_${i+1}`);if(!o)throw Error('Missing orbit '+i);return {position:o.getWorldPosition(o.position.clone()).toArray(),q:o.quaternion.toArray()};});
 });
 const moving=(a,b)=>a.every((o,i)=>o.q.some((v,k)=>Math.abs(v-b[i].q[k])>.001));
 try{
  await page.setViewportSize({width:viewport.width+1,height:viewport.height});
  await page.waitForFunction(()=>window.__ringProbe.store);
  const a=await sample();await page.waitForTimeout(1100);const b=await sample();
  if(!moving(a,b))throw Error('Not all five ring assemblies rotate');
  for(const o of b)if(Math.hypot(...o.position.map((v,i)=>v-[80,84.5,-480][i]))>.001)throw Error('Orbit centre drifted away from nucleus');
  await page.getByRole('button',{name:'World settings',exact:true}).click();
  await page.waitForTimeout(150);const pause=await sample();await page.waitForTimeout(400);
  if(JSON.stringify(pause)!==JSON.stringify(await sample()))throw Error('Modal did not pause rings');
  const reduced=page.getByRole('checkbox',{name:/Reduce motion/});await reduced.check();
  await page.getByRole('button',{name:'Close Make yourself at home',exact:true}).click();
  const still=await sample();await page.waitForTimeout(400);
  if(JSON.stringify(still)!==JSON.stringify(await sample()))throw Error('Reduced motion did not stop rings');
  await page.getByRole('button',{name:'World settings',exact:true}).click();await reduced.uncheck();
  await page.getByRole('button',{name:'Close Make yourself at home',exact:true}).click();
  const resume=await sample();await page.waitForTimeout(700);
  if(!moving(resume,await sample()))throw Error('Rings did not resume');
  return {rotatingAssemblies:5,fixedCentre:[80,84.5,-480],modalPause:true,reducedMotion:true,resume:true};
 }finally{
  await page.evaluate(()=>{for(const {root,original} of window.__ringProbe.wrappers)root.render=original;delete window.__ringProbe;});
  await page.setViewportSize(viewport);
 }
}
