// Run after admission with the project directory closed, in each quality.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- invoked by Playwright CLI.
async(page)=>{
 const waitForFocus=async(name,step)=>{
  try{await page.waitForFunction(name=>!new URL(location.href).searchParams.has('project')&&document.activeElement?.getAttribute('aria-label')===`Explore ${name}`,name,{timeout:5000});}
  catch{throw Error(`${step}: focus did not reach ${name}; active element: ${await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,250))}`);}
 };
 const directory=page.getByRole('button',{name:'Island directory',exact:true});
 await directory.click();
 const buildings=await page.locator('.building-directory-entry').evaluateAll(rows=>rows.map(row=>({name:row.querySelector('strong').textContent,titles:row.querySelector('p').textContent.split(' · ')})));
 if(buildings.length!==8||buildings.reduce((n,b)=>n+b.titles.length,0)!==13)throw Error('Directory must expose all eight buildings and thirteen projects');
 const slugs=new Set();
 for(let i=0;i<buildings.length;i++){
  const b=buildings[i];
  if(i)await directory.click();
  await page.getByRole('button',{name:`Visit ${b.name}`,exact:true}).click();
  await waitForFocus(b.name,'Locate building');
  const titles=await page.locator('.building-focus-card li').allTextContents();
  if(JSON.stringify(titles)!==JSON.stringify(b.titles))throw Error(`Missing project in ${b.name}`);
  const card=await page.locator('.building-focus-card').boundingBox(),viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  if(!card||card.x<0||card.y<0||card.x+card.width>viewport.width||card.y+card.height>viewport.height)throw Error(`Clipped card: ${b.name}`);
  for(const title of b.titles){
   await page.getByRole('button',{name:`Explore ${b.name}`,exact:true}).press('Enter');
   if(b.titles.length>1)await page.locator('.building-projects').getByRole('button').filter({has:page.getByText(title,{exact:true})}).click();
   await page.getByRole('heading',{name:title,exact:true,level:1}).waitFor();
   const slug=new URL(page.url()).searchParams.get('project');
   if(!slug||slugs.has(slug))throw Error(`Missing or duplicate case route: ${title}`);
   slugs.add(slug);
   const standalone=page.getByRole('link',{name:'Open standalone case study'});
   if(await standalone.getAttribute('href')!==`/work/${slug}`)throw Error('Standalone case link changed');
   await page.keyboard.press('Escape');
   await waitForFocus(b.name,`Close ${title}`);
  }
 }
 return {buildings:buildings.length,projects:slugs.size,keyboardEntry:true,focusRestored:true,cardsInViewport:true,standaloneLinks:true};
}
