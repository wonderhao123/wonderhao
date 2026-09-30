import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const content = url(compile("../lib/world/content.ts"));
const { resolveWorldRoute } = await import(
  url(
    compile("../lib/world/navigation.ts").replace(
      /(["'])\.\/content\1/,
      JSON.stringify(content),
    ),
  )
);
test("old project links infer scene and zone without requiring a new URL", () => {
  const route = resolveWorldRoute("?project=merchant-operations");
  assert.equal(route.place, "works");
  assert.equal(route.scene, "operations");
  assert.equal(route.unknown, false);
});
test("scene deep links infer a zone and malformed parentage is recoverable", () => {
  assert.equal(resolveWorldRoute("?scene=knowledge").place, "archive");
  const wrong = resolveWorldRoute(
    "?place=archive&scene=operations&project=merchant-operations",
  );
  assert.equal(wrong.place, "works");
  assert.equal(wrong.unknown, true);
  assert.equal(resolveWorldRoute("?scene=missing").unknown, true);
  assert.equal(
    resolveWorldRoute("?scene=missing&project=merchant-operations").unknown,
    true,
  );
});
test("headquarters levels and underwater modes keep valid parentage", () => {
 assert.equal(resolveWorldRoute("?place=commons&level=b1").level,"b1");
 assert.equal(resolveWorldRoute("?place=airport&level=b1").unknown,true);
 assert.equal(resolveWorldRoute("?scene=reef&view=underwater").place,"dive");
 assert.equal(resolveWorldRoute("?scene=reef&view=underwater").view,"underwater");
 assert.equal(resolveWorldRoute("?place=archive&view=underwater").view,undefined);
});
const planUrl=url(compile("../lib/world/city-plan.ts"));
const {bridges,sampledRoads,sites,streams,terrainHeight,airport,harbours,weatherAt}=await import(planUrl);
const {busState,busRoutes,aircraftState,vesselState,vesselSpecs}=await import(url(compile("../lib/world/city-life.ts").replace(/(["'])\.\/city-plan\1/g,JSON.stringify(planUrl))));
test("authored road grades obey the town and mountain budgets",()=>{
 for(const r of sampledRoads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i];const grade=Math.abs(b[1]-a[1])/Math.hypot(b[0]-a[0],b[2]-a[2]);
  assert.ok(grade<=(r.mountain?.1:.06)+1e-8,`${r.id}: ${grade}`);
 }
});
test("the road network is connected from the town, including the summit",()=>{
 const endpoints=sampledRoads.map(r=>[r.points[0],r.points.at(-1)]);
 const reached=new Set([JSON.stringify([0,20,0])]);let changed=true;
 while(changed){changed=false;for(const [a,b] of endpoints){const ka=JSON.stringify(a),kb=JSON.stringify(b);if(reached.has(ka)&&!reached.has(kb)){reached.add(kb);changed=true}if(reached.has(kb)&&!reached.has(ka)){reached.add(ka);changed=true}}}
 for(const [a,b] of endpoints)assert.ok(reached.has(JSON.stringify(a))||reached.has(JSON.stringify(b)));
});
test("streams descend and their tributaries join the main river",()=>{
 for(const s of streams)for(let i=1;i<s.length;i++)assert.ok(s[i][1]<s[i-1][1]);
 for(const s of streams.slice(1))assert.ok(streams[0].some(p=>JSON.stringify(p)===JSON.stringify(s.at(-1))));
});
test("the ring and runway have full flat foundations",()=>{
 for(let i=0;i<80;i++){const a=i/80*Math.PI*2;assert.ok(Math.abs(terrainHeight(sites.commons[0]+Math.cos(a)*48,sites.commons[2]+Math.sin(a)*48)-96)<.01)}
 for(let z=-1200;z<=1200;z+=100)for(const x of [-22.5,0,22.5])assert.equal(terrainHeight(airport.runway.x+x,z),14);
 assert.equal(airport.runway.length,2400);assert.ok(harbours.cruise.length>=vesselSpecs[0].length);
});
test("water approaches and dive habitat are separate from airport and traffic",()=>{
 for(let i=0;i<vesselSpecs.length;i++)for(let t=0;t<360;t+=5){const {p}=vesselState(t,i);assert.ok(terrainHeight(p[0],p[2])<0,`${i} boat on land at ${p}`);assert.ok(Math.hypot(p[0]-1590,p[2]-1850)>250)}
});
test("aircraft complete all phases without simultaneous runway occupancy",()=>{
 const phases=new Set();for(let t=0;t<960;t+=.5){const a=aircraftState(t,0),b=aircraftState(t,1);phases.add(a.phase);assert.ok(a.p.every(Number.isFinite)&&b.p.every(Number.isFinite),`invalid aircraft position at ${t}`);assert.ok(!a.resource||!b.resource||a.resource!==b.resource);}
 for(const p of ['Parked','Ground service','Pushback','Taxi out','Holding','Takeoff','Climb','Away','Approach','Landing','Taxi in'])assert.ok(phases.has(p));
});
test("vessels complete a cycle and never share a berth",()=>{
 for(let i=0;i<5;i++){const phases=new Set();for(let t=0;t<360;t++)phases.add(vesselState(t,i).phase);assert.equal(phases.size,5)}
 for(let t=0;t<360;t+=.5){const states=vesselSpecs.map((_,i)=>vesselState(t,i));for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++)assert.notEqual(states[i].resource,states[j].resource)}
});
test("weather modes remain bounded and automatic transitions are continuous",()=>{
 for(let t=0;t<800;t++){const a=weatherAt(t,'auto'),b=weatherAt(t+.01,'auto');assert.ok(a>=0&&a<=1);assert.ok(Math.abs(a-b)<.01)}
 assert.equal(weatherAt(200,'sunny'),0);assert.equal(weatherAt(0,'rain'),1);
});

test("bridge spans cover their channels with deck clearance",()=>{assert.ok(bridges.length>=2);for(const b of bridges){assert.ok(b.length>=36);assert.ok(b.centre[1]-1.6>b.water);assert.ok(b.centre.every(Number.isFinite));}});

test("both bus lines stop and all service legs meet without teleporting",()=>{for(let i=0;i<2;i++){const routes=busRoutes[i];for(let j=0;j<routes.length;j++)assert.deepEqual(routes[j].at(-1),routes[(j+1)%routes.length][0]);const stops=new Set();for(let t=0;t<2400;t++){const s=busState(t,i);assert.ok(s.p.every(Number.isFinite));if(s.stopped)stops.add(s.stop);}assert.equal(stops.size,routes.length);}});
test("moving ship hulls clear land, not only their centre points",()=>{
 for(let i=0;i<vesselSpecs.length;i++)for(let t=0;t<360;t+=2){const s=vesselSpecs[i],v=vesselState(t,i);for(const side of [-1,1])for(const end of [-1,1]){const x=v.p[0]+Math.cos(v.heading)*s.beam/2*side+Math.sin(v.heading)*s.length/2*end,z=v.p[2]-Math.sin(v.heading)*s.beam/2*side+Math.cos(v.heading)*s.length/2*end;assert.ok(terrainHeight(x,z)<.5,`${s.id} hull touches land at ${x},${z}`)}}
});
