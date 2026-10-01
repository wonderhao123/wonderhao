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
const plan=await import(planUrl);
const {busState,busRoutes,aircraftState,vesselState,vesselSpecs}=await import(url(compile("../lib/world/city-life.ts").replace(/(["'])\.\/city-plan\1/g,JSON.stringify(planUrl))));
test("authored road grades obey the town and mountain budgets",()=>{
 for(const r of sampledRoads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i];const grade=Math.abs(b[1]-a[1])/Math.hypot(b[0]-a[0],b[2]-a[2]);
  assert.ok(grade<=(r.mountain?.1:.06)+1e-8,`${r.id}: ${grade}`);
 }
});
test("the road network is connected from the town, including the summit",()=>{
 // Include junctions on a road's interior, rather than only matching end nodes.
 const reached=new Set(['town-west']);let changed=true;
 const touches=(a,b)=>a.points.some(p=>b.points.slice(1).some((q,i)=>{const t=plan.segment(p[0],p[2],b.points[i],q);return t.d<.01&&Math.abs(t.y-p[1])<.01}));
 while(changed){changed=false;for(const a of sampledRoads)if(!reached.has(a.id)&&sampledRoads.some(b=>reached.has(b.id)&&(touches(a,b)||touches(b,a)))){reached.add(a.id);changed=true}}
 for(const r of sampledRoads)assert.ok(reached.has(r.id),`disconnected ${r.id}`);
});
test("streams descend and their tributaries join the main river",()=>{
 for(const s of streams)for(let i=1;i<s.length;i++)assert.ok(s[i][1]<s[i-1][1]);
 for(const s of streams.slice(1))assert.ok(streams[0].some(p=>JSON.stringify(p)===JSON.stringify(s.at(-1))));
});
test("the ring and runway have full flat foundations",()=>{
 for(let i=0;i<80;i++){const a=i/80*Math.PI*2;assert.ok(Math.abs(terrainHeight(sites.commons[0]+Math.cos(a)*48,sites.commons[2]+Math.sin(a)*48)-sites.commons[1])<.01)}
 for(let z=-1200;z<=1200;z+=100)for(const x of [-22.5,0,22.5])assert.equal(terrainHeight(airport.runway.x+x,z),14);
 assert.equal(airport.runway.length,2400);assert.ok(harbours.cruise.length>=vesselSpecs[0].length);
});
test("water approaches and dive habitat are separate from airport and traffic",()=>{
 for(let i=0;i<vesselSpecs.length;i++)for(let t=0;t<360;t+=5){const {p}=vesselState(t,i);assert.ok(terrainHeight(p[0],p[2])<0,`${i} boat on land at ${p}`);assert.ok(Math.hypot(p[0]-530,p[2]-470)>250)}
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

const landmarkSpec=JSON.parse(readFileSync(new URL('../lib/world/landmark-spec.json',import.meta.url)));
const architectureUrl=url(compile('../lib/world/city-architecture.ts').replace(/(["'])\.\/city-plan\1/g,JSON.stringify(planUrl)));
const {projectBuildings}=await import(url(compile('../lib/world/city-buildings.ts').replace(/(["'])\.\/city-architecture\1/g,JSON.stringify(architectureUrl)).replace(/import spec from ['"]\.\/landmark-spec\.json['"];?/,`const spec=${JSON.stringify(landmarkSpec)};`)));
const registry=await import(content);
test('each real project has exactly one semantic building and no scene invents a case',()=>{
 const mapped=projectBuildings.flatMap(b=>b.projects);
 assert.deepEqual([...mapped].sort(),registry.projects.map(p=>p.slug).sort());
 for(const b of projectBuildings){assert.ok(b.projects.length>0);assert.ok(b.position.every(Number.isFinite));assert.ok(Math.hypot(b.position[0],b.position[2])<650)}
 assert.ok(projectBuildings.find(b=>b.id==='campus').projects.includes('campus-systems'));
});
test('relocated historical place links still meet the same surveyed anchors',()=>{
 for(const place of registry.places)assert.deepEqual(place.position,sites[place.id]);
 for(const [x,z] of [[480,390],[515,390],[445,390]])assert.ok(terrainHeight(x,z)<-7,'circular facility needs submerged seabed support');
});

test('offshore shell, interaction and seabed share a complete spherical volume',()=>{
 const sphere=landmarkSpec.observatory,b=projectBuildings.find(b=>b.id==='research');
 assert.deepEqual(b.position,sphere.center);assert.deepEqual(b.size,[sphere.radius*2,sphere.radius*2,sphere.radius*2]);
 assert.ok(sphere.center[1]>0&&sphere.center[1]<sphere.radius*.2);
 for(let i=0;i<72;i++){const a=i*Math.PI/36;const x=sphere.center[0]+Math.cos(a)*sphere.radius,z=sphere.center[2]+Math.sin(a)*sphere.radius;assert.ok(terrainHeight(x,z)<=sphere.foundationY,'seabed must clear the entire lower hemisphere and foundation');}
});

test('Ring terrain stays below exposed foundation terrace tops',()=>{
 for(const [radius,top] of [[56,74],[60,72],[64,70]])for(let i=0;i<72;i++){const a=i*Math.PI/36;assert.ok(terrainHeight(80+Math.cos(a)*radius,-480+Math.sin(a)*radius)<top-.5);}
});

const {makeArchitecture,makeHeritageQuarter,keepDistantArchitecture,heritageBounds}=await import(url(compile('../lib/world/city-architecture.ts').replace(/(["'])\.\/city-plan\1/g,JSON.stringify(planUrl))));
test('expanded parcels have dry supported foundations and clear the street carriageways',()=>{
 assert.equal(plan.urbanLots.length,144);
 for(const lot of plan.urbanLots){
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const x=lot.x+sx*lot.width/2,z=lot.z+sz*lot.depth/2;
   assert.ok(Math.abs(terrainHeight(x,z)-lot.base)<1.5,`${lot.id} floating or buried at ${x},${z}: ${terrainHeight(x,z)}`);
   for(const road of sampledRoads)for(let i=1;i<road.points.length;i++)assert.ok(plan.segment(x,z,road.points[i-1],road.points[i]).d>road.width/2,`${lot.id} in ${road.id}`);
  }
 }
});
test('all pitched roofs close against a wall or roof slab, including every historical frontage',()=>{
 const parts=makeArchitecture();
 for(const roof of parts.filter(p=>p[0]===4)){
  const supports=parts.filter(p=>{
   const angle=p[8]-roof[8],w=Math.abs(Math.cos(angle))*p[5]+Math.abs(Math.sin(angle))*p[7],d=Math.abs(Math.sin(angle))*p[5]+Math.abs(Math.cos(angle))*p[7];
   return p[0]===0&&Math.abs(p[2]-roof[2])<.1&&Math.abs(p[4]-roof[4])<=3&&w>roof[5]*.7&&d>roof[7]*.5;
  });
  assert.ok(supports.some(p=>Math.abs(p[3]+p[6]/2-roof[3])<=.25),`unsupported roof ${roof.slice(2,5)}`);
 }
});
test('three enclosing ridges leave the bay and airfield corridor open',()=>{
 for(const [x,z] of [[-1260,-720],[-180,-1250],[1130,-680]])assert.ok(terrainHeight(x,z)>200);
 assert.ok(terrainHeight(0,800)<0);
 for(let x=400;x<2000;x+=40)assert.ok(Math.abs(terrainHeight(x,-Math.max(0,Math.min(80,(x-720)/6))))<30);
});
const {resourcesReady}=await import(url(compile('../lib/world/scene-readiness.ts')));
test('the reveal requires every committed resource, never any-ready or an empty set',()=>{
 const required=['terrain','town','water','ring'];
 assert.equal(resourcesReady(required,{town:'ready'}),false);
 assert.equal(resourcesReady([],{}),false);
 const states=Object.fromEntries(required.map(id=>[id,'ready']));assert.equal(resourcesReady(required,states),true);
 for(const bad of ['idle','loading','error'])for(const id of required)assert.equal(resourcesReady(required,{...states,[id]:bad}),false);
});

test('mountain road cuts blend continuously and support both new access paths',()=>{
 for(const bounds of [[-1400,-960,-1050,-650],[340,1160,-1400,-650]]){
  for(let z=bounds[2];z<bounds[3];z+=8)for(let x=bounds[0];x<bounds[1];x+=8){
   const y=plan.terrainHeight(x,z);
   for(const [dx,dz] of [[.5,0],[0,.5]])assert.ok(Math.abs(y-plan.terrainHeight(x+dx,z+dz))<3,`discontinuous mountain cut at ${x},${z}`);
  }
 }
 for(const road of plan.sampledRoads.filter(r=>['forest-ascent','field-ascent','north-spine'].includes(r.id))){
  for(let i=1;i<road.points.length;i++)for(let j=0;j<=10;j++){
   const a=road.points[i-1],b=road.points[i],t=j/10,p=a.map((v,k)=>v+(b[k]-v)*t);
   assert.ok(Math.abs(plan.terrainHeight(p[0],p[2])-(p[1]-.18))<.2,`${road.id} loses ground support`);
  }
 }
});


test('crescent beach has dry sand, a supported promenade and a submerged nearshore',()=>{
 for(let x=632;x<=1060;x+=21){const shore=plan.bayShore(x);
  assert.ok(terrainHeight(x,shore-22)>1.5&&terrainHeight(x,shore-22)<4,`sand ${x}`);
  assert.ok(Math.abs(terrainHeight(x,shore-65)-7)<.15,`promenade ${x}`);
  assert.ok(terrainHeight(x,shore+25)<-1,`nearshore ${x}`);
 }
 for(let i=0;i<=20;i++){const t=i/20;assert.ok(Math.abs(terrainHeight(575+35*t,297+(plan.bayShore(610)-65-297)*t)-7)<.01,'beach connection buried in bank');}
 // The existing deep habitat and full sphere volume cannot be reclaimed as beach.
 for(const x of [535,550,565])for(const z of [550,560,570])assert.ok(terrainHeight(x,z)<-17);
});
test('airfield guidance stays on the airport surface and distinguishes each role',()=>{
 const lights=plan.airfieldLights;
 for(const l of lights){assert.ok(Math.abs(terrainHeight(l.x,l.z)-14)<.01);assert.ok(l.y>14.4&&l.y<15);}
 const colors=role=>new Set(lights.filter(l=>l.role===role).map(l=>l.color));
 assert.deepEqual([...colors('taxi-edge')],['#518cff']);assert.deepEqual([...colors('taxi-center')],['#76ffc2']);
 assert.deepEqual([...colors('threshold')],['#6dffb8']);assert.deepEqual([...colors('runway-end')],['#ff5056']);
 for(const side of [-1,1])assert.ok(lights.filter(l=>l.role==='runway-edge'&&Math.sign(l.x-2460)===side).length>=59);
});
test('marina and container feeder footprints stay afloat and clear the working berths',()=>{
 for(let row=0;row<5;row++)for(const x of [263,284])for(const dx of [-2.5,2.5])for(const dz of [-9,9])assert.ok(terrainHeight(x+dx,615+row*32+dz)<0);
 for(const x of [-873,-849])for(const z of [329,383,437])assert.ok(terrainHeight(x,z)<0);
 for(let i=0;i<vesselSpecs.length;i++)for(let t=0;t<360;t+=2){const {p}=vesselState(t,i);
  assert.ok(Math.abs(p[0]+861)>30||Math.abs(p[2]-383)>85,`vessel ${i} enters cargo ship at ${t}`);
  assert.ok(p[0]<240||p[0]>320||p[2]<580||p[2]>770,`vessel ${i} enters marina at ${t}`);
 }
 for(const region of ['airport','dive','works','arrival'])assert.ok(plan.coastalLights.filter(l=>l.region===region).length>=6);
});


test('heritage precinct keeps its lawn and street entrances open at both detail levels',()=>{
 const parts=makeHeritageQuarter();
 assert.ok(parts.length>400);
 assert.ok(parts.every(p=>p[9]===0),'scenery must not invent project links');
 assert.ok(parts.every(keepDistantArchitecture),'distant view must retain connected cloisters and spire');
 for(const p of parts){
  assert.ok(p.slice(2,9).every(Number.isFinite));
  assert.ok(p[2]>=heritageBounds.minX&&p[2]<=heritageBounds.maxX&&p[4]>=heritageBounds.minZ&&p[4]<=heritageBounds.maxZ);
 }
 const solids=parts.filter(p=>p[0]===0&&p[6]>3);
 const clear=(x,z)=>!solids.some(p=>{
  const dx=x-p[2],dz=z-p[4],u=dx*Math.cos(p[8])-dz*Math.sin(p[8]),v=dx*Math.sin(p[8])+dz*Math.cos(p[8]);
  return Math.abs(u)<p[5]/2&&Math.abs(v)<p[7]/2;
 });
 for(const [x,z] of [[-109,158],[-109,141],[-16,128],[-35,128],[-65,80],[-65,55],[-65,105]])assert.ok(clear(x,z),`blocked garden/entry at ${x},${z}`);
 const tower=parts.find(p=>p[0]===13&&p[2]===-109&&p[4]===108);
 assert.ok(tower&&tower[3]-tower[6]/2<59&&tower[3]+tower[6]/2>76);
 assert.ok(parts.filter(p=>p[0]===12).length>60,'both storeys require real pointed arcades');
});

const THREE=await import('three');
const vegetation=await import(url(compile('../lib/world/vegetation.ts').replace(/from 'three'/g,`from '${import.meta.resolve('three')}'`).replace(/from 'three\/addons\/utils\/BufferGeometryUtils.js'/g,`from '${import.meta.resolve('three/addons/utils/BufferGeometryUtils.js')}'`)));
test('pointed cloister arches have traversable openings and solid supporting jambs',()=>{
 const g=vegetation.makeGothicArch(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(g,material);
 mesh.updateMatrixWorld();
 const cast=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh);
 assert.equal(cast(0,-.2).length,0);
 assert.equal(cast(0,.25).length,0);
 assert.ok(cast(.45,-.2).length>0);
 assert.ok(cast(0,.45).length>0);
 g.dispose();material.dispose();
});
