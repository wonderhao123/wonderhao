// Run with playwright-cli run-code --filename with the dive kit inspector open.
// Repeat for lightweight. Temporary probes are removed even on failure.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async(page)=>{
 const inspector=page.getByRole('dialog',{name:'Dive kit',exact:true});
 await inspector.locator('canvas').waitFor();
 await page.evaluate(()=>{
  window.__kitProbe={wrappers:[],stores:{}};
  for(const canvas of document.querySelectorAll('canvas')){
   const name=canvas.closest('.kit-stage')?'kit':'world';
   let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
   for(let i=0;fiber&&i<8;i++,fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){
    const root=hook.memoizedState?.current;if(!root?.configure||!root?.render)continue;
    const original=root.render;window.__kitProbe.wrappers.push({root,original});
    root.render=function(...args){const store=original.apply(this,args);window.__kitProbe.stores[name]=store;return store;};
   }
  }
 });
 const viewport=page.viewportSize();
 const sample=()=>page.evaluate(()=>{
  const {kit,world}=window.__kitProbe.stores,k=kit.getState(),w=world.getState();
  return {kit:k.camera.position.toArray(),world:w.camera.position.toArray(),target:k.controls.target.toArray(),frame:k.gl.info.render.frame,triangles:k.gl.info.render.triangles,parts:k.scene.getObjectByName('dive-kit-model').children.filter(o=>o.isGroup).map(o=>o.name)};
 });
 try{
  await page.setViewportSize({width:viewport.width+1,height:viewport.height});
  await page.waitForFunction(()=>window.__kitProbe.stores.kit&&window.__kitProbe.stores.world);
  await page.waitForTimeout(300);
  const initial=await sample();if(initial.parts.length!==4)throw Error('Missing equipment');
  const box=await inspector.locator('.kit-stage').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+90,y+25,{steps:12});await page.mouse.up();
  const dragged=await sample();
  if(Math.hypot(...dragged.kit.map((v,i)=>v-initial.kit[i]))<.2)throw Error('Drag did not rotate kit');
  if(Math.hypot(...dragged.world.map((v,i)=>v-initial.world[i]))>.01)throw Error('Kit drag moved island camera');
  await page.getByRole('button',{name:'Reset kit view',exact:true}).click();
  const reset=await sample();if(Math.hypot(...reset.kit.map((v,i)=>v-initial.kit[i]))>.01||Math.hypot(...reset.target.map((v,i)=>v-initial.target[i]))>.01)throw Error('Reset did not restore framing');
  await inspector.locator('.kit-stage').focus();await page.keyboard.press('ArrowRight');
  const keyboard=await sample();if(Math.hypot(...keyboard.kit.map((v,i)=>v-reset.kit[i]))<.1)throw Error('Keyboard rotation failed');
  const touch=await page.context().newCDPSession(page);
  try{
   await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*8,y:y+i*2}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const swiped=await sample();if(Math.hypot(...swiped.kit.map((v,i)=>v-keyboard.kit[i]))<.1)throw Error('Touch rotation failed');
  }finally{await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach();}
  await page.keyboard.press('Home');await page.waitForTimeout(300);const settled=await sample();
  await page.waitForTimeout(400);if((await sample()).frame>settled.frame+2)throw Error('Idle viewer keeps rendering');
  return {drag:true,touch:true,worldUnchanged:true,keyboard:true,reset:true,demandRendering:true,triangles:initial.triangles,parts:initial.parts};
 }finally{
  await page.evaluate(()=>{for(const {root,original} of window.__kitProbe.wrappers)root.render=original;delete window.__kitProbe;});
  await page.setViewportSize(viewport);
 }
}
