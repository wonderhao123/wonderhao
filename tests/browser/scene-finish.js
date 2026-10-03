// Run with playwright-cli run-code --filename after entering The Sphere underwater.
// Read the actual final framebuffer after rendering; a DOM screenshot alone misses flashes.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async(page)=>{
 if(!page.url().includes('scene=sphere')||!page.url().includes('view=underwater'))throw Error('Enter The Sphere underwater first');
 await page.evaluate(()=>{
  const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
  window.__finishProbe={wrappers:[],store:null,frames:0,blank:0,black:0};
  for(let i=0;fiber&&i<8;i++,fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){
   const root=hook.memoizedState?.current;if(!root?.configure||!root?.render)continue;
   const original=root.render;window.__finishProbe.wrappers.push({root,original});
   root.render=function(...args){const store=original.apply(this,args);window.__finishProbe.store=store;return store;};
  }
 });
 try{
  if(await page.getByRole('button',{name:'Switch to afternoon',exact:true}).count())await page.getByRole('button',{name:'Switch to afternoon',exact:true}).click();
  await page.getByRole('button',{name:'Switch to dusk',exact:true}).click();
  await page.evaluate(()=>{
   const p=window.__finishProbe,s=p.store.getState(),gl=s.gl.getContext(),pixel=new Uint8Array(4);
   p.pose={position:s.camera.position.clone(),target:s.controls.target.clone()};
   p.stop=s.internal.subscribe({current:()=>{
    p.frames++;let black=0;
    for(const [x,y]of [[.1,.1],[.3,.7],[.5,.5],[.9,.9]]){
     gl.readPixels(Math.floor(gl.drawingBufferWidth*x),Math.floor(gl.drawingBufferHeight*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
     if(pixel[3]<250)p.blank++;
     if(pixel[0]+pixel[1]+pixel[2]===0)black++;
    }
    if(black===4)p.black++;
   }},1.5,p.store);
  });
  for(const mode of ['night','day']){
   if(mode==='day')await page.getByRole('button',{name:'Switch to afternoon',exact:true}).click();
   for(let i=0;i<5;i++){
    await page.evaluate(()=>{const s=window.__finishProbe.store.getState();s.camera.position.set(568,-2,498);s.controls.target.set(480,-6,390);s.controls.update();s.invalidate();});
    const {width,height}=page.viewportSize();const x=width*.45,y=height*.45;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+width*.14,y,{steps:25});await page.mouse.up();
    await page.mouse.wheel(0,-150);await page.waitForTimeout(400);
   }
  }
  const result=await page.evaluate(()=>({frames:window.__finishProbe.frames,transparentSamples:window.__finishProbe.blank,blackFrames:window.__finishProbe.black}));
  if(result.frames<100)throw Error('Insufficient rendered-frame coverage');
  if(result.transparentSamples||result.blackFrames)throw Error(`Final framebuffer flashed: ${JSON.stringify(result)}`);
  return result;
 }finally{
  await page.evaluate(()=>{const p=window.__finishProbe;p.stop?.();for(const {root,original}of p.wrappers)root.render=original;if(p.pose){const s=p.store.getState();s.camera.position.copy(p.pose.position);s.controls.target.copy(p.pose.target);s.controls.update();s.invalidate();}delete window.__finishProbe;});
 }
}
