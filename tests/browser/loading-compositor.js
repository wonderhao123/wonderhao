// Run with playwright-cli run-code --filename on the production site (Chromium).
// Screencast frames prove actual motion while JavaScript cannot execute.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async page => {
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const handled=[];
 await page.route('**/world/models/ring*.glb*',route=>{const work=gate.then(()=>route.continue());handled.push(work);return work;});
 const client=await page.context().newCDPSession(page);
 const frames=[];
 client.on('Page.screencastFrame',event=>{frames.push({at:Date.now(),data:event.data});client.send('Page.screencastFrameAck',{sessionId:event.sessionId});});
 try{
  await page.goto(new URL(page.url()).origin,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(3500);
  const results=[];
  for(const phase of ['spinning','entrance']){
   if(phase==='entrance')await page.evaluate(()=>{
    document.querySelector('.loading-dial').getAnimations({subtree:true}).forEach(animation=>{animation.currentTime=0;animation.play();});
   });
   frames.length=0;
   await client.send('Page.startScreencast',{format:'jpeg',quality:70,maxWidth:800,maxHeight:600,everyNthFrame:1});
   await page.waitForTimeout(150);
   const start=Date.now();
   await page.evaluate(()=>{const end=performance.now()+900;while(performance.now()<end){/* Test only: model the measured startup main-thread stall. */}});
   const end=Date.now();
   await page.waitForTimeout(150);
   const during=frames.filter(f=>f.at>start+100&&f.at<end-50);
   const distinct=new Set(during.map(f=>f.data)).size;
   if(distinct<5)throw Error(`${phase} froze during main-thread work: ${distinct} distinct frames`);
   results.push({phase,blockedMs:end-start,framesDuringBlock:during.length,distinctFramesDuringBlock:distinct});
   await client.send('Page.stopScreencast');
  }
  return results;
 }finally{await client.send('Page.stopScreencast');await client.detach();release();await Promise.allSettled(handled);await page.unroute('**/world/models/ring*.glb*');}
}
