import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Raycaster,Matrix4,Quaternion,Vector3} from 'three';
const spec=JSON.parse(readFileSync(new URL('../lib/world/landmark-spec.json',import.meta.url)));
function glb(name){
 const buffer=readFileSync(new URL(`../public/world/models/${name}.glb`,import.meta.url));
 assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(4),2);
 const jsonLength=buffer.readUInt32LE(12),doc=JSON.parse(buffer.subarray(20,20+jsonLength).toString());
 return {doc,buffer,bin:28+jsonLength};
}
function attribute(asset,index){
 const accessor=asset.doc.accessors[index],view=asset.doc.bufferViews[accessor.bufferView];
 assert.equal(accessor.componentType,5126);const start=asset.bin+(view.byteOffset??0)+(accessor.byteOffset??0),stride=view.byteStride??12;
 return Array.from({length:accessor.count},(_,i)=>[0,4,8].map(o=>asset.buffer.readFloatLE(start+i*stride+o)));
}
function materialWorldPoints(asset,name){
 const points=[];
 function visit(index,parent){
  const node=asset.doc.nodes[index];
  const local=node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3(...(node.translation??[0,0,0])),new Quaternion(...(node.rotation??[0,0,0,1])),new Vector3(...(node.scale??[1,1,1])));
  const world=parent.clone().multiply(local);
  if(node.mesh!==undefined)for(const p of asset.doc.meshes[node.mesh].primitives){
   if(asset.doc.materials[p.material].name===name)for(const v of attribute(asset,p.attributes.POSITION))points.push(new Vector3(...v).applyMatrix4(world).toArray());
  }
  for(const child of node.children??[])visit(child,world);
 }
 for(const node of asset.doc.scenes[asset.doc.scene??0].nodes)visit(node,new Matrix4());
 return points;
}
function materialMeshes(asset,names){
 const meshes=[];
 function visit(index,parent){
  const node=asset.doc.nodes[index];
  const local=node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3(...(node.translation??[0,0,0])),new Quaternion(...(node.rotation??[0,0,0,1])),new Vector3(...(node.scale??[1,1,1])));
  const world=parent.clone().multiply(local);
  if(node.mesh!==undefined)for(const p of asset.doc.meshes[node.mesh].primitives){
   if(!names.includes(asset.doc.materials[p.material].name))continue;
   const geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute(attribute(asset,p.attributes.POSITION).flat(),3));
   const a=asset.doc.accessors[p.indices],v=asset.doc.bufferViews[a.bufferView],offset=asset.bin+(v.byteOffset??0)+(a.byteOffset??0),bytes=a.componentType===5125?4:2;
   geometry.setIndex(Array.from({length:a.count},(_,i)=>bytes===4?asset.buffer.readUInt32LE(offset+i*bytes):asset.buffer.readUInt16LE(offset+i*bytes)));
   const mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));mesh.applyMatrix4(world);mesh.updateMatrixWorld();meshes.push(mesh);
  }
  for(const child of node.children??[])visit(child,world);
 }
 for(const index of asset.doc.scenes[asset.doc.scene??0].nodes)visit(index,new Matrix4());
 return meshes;
}
test('exported observatory is a complete sphere with radial normals, not a disk or capped dome',()=>{
 const asset=glb('observatory'),points=[];let normalCount=0;
 for(const mesh of asset.doc.meshes)for(const primitive of mesh.primitives){
  const name=asset.doc.materials[primitive.material].name;
  if(name!=='Pavilion clear glazing'&&name!=='Immersed ceramic coating')continue;
  const vertices=attribute(asset,primitive.attributes.POSITION),normals=attribute(asset,primitive.attributes.NORMAL);
  for(let i=0;i<vertices.length;i++){
   const p=vertices[i],r=Math.hypot(...p);
   // Entry glazing shares the glass material; shell vertices lie on the design radius.
   if(Math.abs(r-spec.observatory.radius)>.02)continue;
   points.push(p);const dot=p.reduce((sum,x,k)=>sum+x*normals[i][k],0)/r;
   assert.ok(dot>.985,`non-radial shell normal ${dot}`);normalCount++;
  }
 }
 assert.ok(normalCount>5000);
 for(let axis=0;axis<3;axis++){assert.ok(Math.min(...points.map(p=>p[axis]))<-34.9);assert.ok(Math.max(...points.map(p=>p[axis]))>34.9);}
});
test('all hero assets have self-contained lower-detail variants and bounded material batches',()=>{
 for(const name of ['observatory','habitat','ring']){
  const standard=glb(name),low=glb(name+'-low');
  assert.ok(low.buffer.length<standard.buffer.length*.8);
  for(const asset of [standard,low]){
   assert.ok(asset.doc.meshes.length<=(name==='ring'?13:10));assert.ok(!asset.doc.images?.length);
   assert.ok(asset.doc.buffers.every(b=>!b.uri));
   const transparent=asset.doc.materials.filter(m=>(m.alphaMode??'OPAQUE')!=='OPAQUE');
   if(name==='observatory'){assert.equal(transparent.length,1);assert.equal(transparent[0].name,'Pavilion clear glazing');assert.equal(transparent[0].alphaMode,'BLEND');}
   else assert.equal(transparent.length,0);
  }
 }
});
test('terrain ships finite heights and packed upward normals for every LOD',()=>{
 for(const n of [16,32,64]){
  const b=readFileSync(new URL(`../public/world/city/14-10-${n}.bin`,import.meta.url)),count=(n+1)**2;
  assert.equal(b.length,count*8);
  for(let i=0;i<count;i++){assert.ok(Number.isFinite(b.readFloatLE(i*4)));const x=b.readInt16LE(count*4+i*4)/32767,z=b.readInt16LE(count*4+i*4+2)/32767;assert.ok(x*x+z*z<1.0001);}
 }
});

test('Ring crown faces upward and both neon roof edges remain closed in each quality',()=>{
 for(const name of ['ring','ring-low']){
  const asset=glb(name);
  const primitiveFor=material=>asset.doc.meshes.flatMap(m=>m.primitives).find(p=>asset.doc.materials[p.material].name===material);
  const crown=primitiveFor('Ring porcelain crown');
  const points=attribute(asset,crown.attributes.POSITION),normals=attribute(asset,crown.attributes.NORMAL);
  const upper=points.flatMap((p,i)=>p[1]>11.8?[normals[i][1]]:[]);
  assert.ok(upper.length>100,'the visible roof crown must survive simplification');
  assert.ok(upper.every(y=>y>.5),'roof normals must face the sky, not the courtyard floor');
  const edge=primitiveFor('Ring violet edge'),edgePoints=attribute(asset,edge.attributes.POSITION);
  for(const radius of [31.73,47.43]){
   const loop=edgePoints.filter(p=>Math.abs(Math.hypot(p[0],p[2])-radius)<.2);
   const sectors=new Set(loop.map(p=>Math.floor((Math.atan2(p[2],p[0])+Math.PI)/Math.PI*24)%48));
   assert.equal(sectors.size,48,'both roof edges must illuminate the full circumference');
   assert.ok(loop.every(p=>p[1]>10.7&&p[1]<11.7),'light strips must stay attached to roof edges');
  }
  const glazing=attribute(asset,primitiveFor('Ring blue glazing').attributes.POSITION);
  const outerRadiusAt=(height)=>Math.max(...glazing.filter(p=>Math.abs(p[1]-height)<.05).map(p=>Math.hypot(p[0],p[2])));
  assert.ok(outerRadiusAt(.28)-outerRadiusAt(10.46)>2,'the upper facade must lean inward');
 }
});

test('Ring fountain stays centred, open and clear of the perimeter gardens in both qualities',()=>{
 for(const name of ['ring','ring-low']){
  const asset=glb(name);
  const gold=materialWorldPoints(asset,'Ring champagne bronze');
  const orbits=gold.filter(p=>p[1]>6&&p[1]<14);
  assert.ok(orbits.length>400,'tilted metal orbits must survive simplification');
  for(const axis of [0,2]){
   const extent=orbits.map(p=>p[axis]);
   assert.ok(Math.min(...extent)<-4&&Math.max(...extent)>4,'orbits surround the courtyard origin');
  }
  const core=materialWorldPoints(asset,'Ring pearl light').filter(p=>p[1]>7.5&&p[1]<11&&Math.hypot(p[0],p[2])<2);
  assert.ok(core.length>100,'luminous nucleus must survive simplification');
  for(const axis of [0,2])assert.ok(core.every(p=>Math.abs(p[axis])<1.4),'nucleus must be at courtyard centre');
  for(const axis of [0,2])assert.ok(Math.min(...core.map(p=>p[axis]))<-1.2&&Math.max(...core.map(p=>p[axis]))>1.2,'nucleus spans both sides of the origin');
  assert.ok(core.every(p=>Math.abs(p[1]-9.4)<1.4),'nucleus stays within its open gimbal');
  const energy=materialWorldPoints(asset,'Ring aquamarine energy').filter(p=>p[1]>6);
  assert.ok(energy.length>200,'open water ribbons and orbit channels remain in lightweight view');
  for(const mat of ['Ring canopy 0','Ring canopy 1','Ring tree bark','Ring meadow']){
   const points=materialWorldPoints(asset,mat);
   assert.ok(points.length>0);
   assert.ok(points.every(p=>Math.hypot(p[0],p[2])>21),'planting must leave the central plaza open');
   assert.ok(points.every(p=>Math.abs(p[0])>2.5&&Math.abs(p[2])>2.5),'four axial approaches remain clear');
  }
  const water=materialWorldPoints(asset,'Ring reflecting water');
  assert.ok(water.filter(p=>p[1]>.4&&p[1]<.6).every(p=>Math.hypot(p[0],p[2])<9.9),'basin water remains contained by coping');
  assert.ok(gold.every(p=>p[1]<16),'sculpture must stay within its authored height');
 }
});


test('glass pavilion retains a clear spherical crown, continuous louvers and occupied galleries in both qualities',()=>{
 for(const name of ['observatory','observatory-low']){
  const asset=glb(name),material=n=>asset.doc.materials.find(m=>m.name===n);
  const vertices=n=>asset.doc.meshes.flatMap(m=>m.primitives).filter(p=>asset.doc.materials[p.material].name===n).flatMap(p=>attribute(asset,p.attributes.POSITION));
  const glass=material('Pavilion clear glazing');
  assert.ok(glass.pbrMetallicRoughness.baseColorFactor[3]>.1&&glass.pbrMetallicRoughness.baseColorFactor[3]<.4,'interior must remain visible through the shell');
  const shell=vertices('Pavilion clear glazing').filter(p=>Math.abs(Math.hypot(...p)-35)<.05);
  assert.ok(Math.max(...shell.map(p=>p[1]))>34.9,'glass reaches the crown');
  const nearSill=shell.filter(p=>p[1]>=1.9&&p[1]<3);
  assert.ok(nearSill.length>100,'a complete clear ground-floor circumference must survive LOD');
  const belts=vertices('Pavilion silver louvers');
  for(const y of [8.8,16,23.2,32.2]){
   const loop=belts.filter(p=>Math.abs(p[1]-y)<.45&&Math.hypot(p[0],p[2])>10);
   const sectors=new Set(loop.map(p=>Math.floor((Math.atan2(p[2],p[0])+Math.PI)/Math.PI*12)%24));
   assert.equal(sectors.size,24,`open shading belt at ${y}`);
  }
  for(const material of ['Pavilion limestone interior','Pavilion oak furnishings','Pavilion warm light'])assert.ok(vertices(material).length>100,`missing ${material}`);
  const lightPoints=vertices('Pavilion warm light');
  for(let i=0;i<15;i++){
   const y=8.8+i*1.8-.36,radius=Math.sqrt(35.18**2-y*y);
   const ring=lightPoints.filter(p=>Math.abs(p[1]-y)<.12&&Math.abs(Math.hypot(p[0],p[2])-radius)<.12);
   const sectors=new Set(ring.map(p=>Math.floor((Math.atan2(p[2],p[0])+Math.PI)/Math.PI*12)%24));
   assert.equal(sectors.size,24,`broken pavilion light ring ${i}`);
  }
  assert.ok(material('Pavilion warm light').emissiveFactor.some(v=>v>0));
 }
});


test('Sphere glass, promenade and exactly eight seabed supports survive both export qualities',()=>{
 for(const name of ['observatory','observatory-low']){
  const asset=glb(name),walk=spec.observatory.walkway,cy=spec.observatory.center[1];
  assert.ok(!asset.doc.materials.some(m=>m.name==='Immersed ceramic coating'),'no opaque lower pressure shell');
  const glass=materialWorldPoints(asset,'Pavilion clear glazing').filter(p=>Math.abs(Math.hypot(...p)-35)<.06);
  assert.ok(glass.some(p=>p[1]<-34.9),'transparent glass reaches the bottom pole');
  for(const y of [-28,-17,-8]){
   const belt=glass.filter(p=>Math.abs(p[1]-y)<1.5);
   assert.equal(new Set(belt.map(p=>Math.floor((Math.atan2(p[2],p[0])+Math.PI)/Math.PI*8)%16)).size,16,'lower glass covers every azimuth');
  }
  const concrete=materialWorldPoints(asset,'Marine concrete').filter(p=>p[1]<-5);
  assert.ok(concrete.every(p=>Math.abs(Math.hypot(p[0],p[2])-walk.supportRadius)<1.6),'all deep support sits below the annular deck; central foundation removed');
  const feet=concrete.filter(p=>p[1]+cy<walk.supportBottom+1.5);
  const sectors=new Set(feet.map(p=>(Math.round(Math.atan2(p[2],p[0])/(Math.PI*2/walk.supportCount))+walk.supportCount)%walk.supportCount));
  assert.equal(sectors.size,8,'exactly eight evenly distributed seabed feet');
  const deck=materialWorldPoints(asset,'Pavilion oak furnishings').filter(p=>Math.abs(p[1]+cy-walk.deckY)<.02&&Math.hypot(p[0],p[2])>walk.innerRadius);
  assert.equal(new Set(deck.map(p=>Math.floor((Math.atan2(p[2],p[0])+Math.PI)/Math.PI*16)%32)).size,32,'walkway must remain a full circle');
  const lights=materialWorldPoints(asset,'Pavilion warm light').filter(p=>p[1]+cy<walk.lightY+.6&&p[1]+cy>walk.lightY-1&&Math.hypot(p[0],p[2])>walk.lightRadius-.5&&Math.hypot(p[0],p[2])<walk.lightRadius+1);
  assert.equal(new Set(lights.map(p=>(Math.round(Math.atan2(p[2],p[0])/(Math.PI/4))+8)%8)).size,8,'eight underdeck searchlight lenses');
 }
});

test('Sphere interior stays open across the waterline with stairs reaching the bottom in both qualities',()=>{
 for(const name of ['observatory','observatory-low']){
  const asset=glb(name),stone=materialWorldPoints(asset,'Pavilion limestone interior');
  // All occupied upper floors leave a broad central shaft above the bottom deck.
  const upper=stone.filter(p=>p[1]>-31.5);
  assert.ok(upper.every(p=>Math.hypot(p[0],p[2])>8),'no slab or desk may plug the shared vertical room');
  assert.ok(stone.some(p=>p[1]<-31.9),'a usable bottom floor remains');
  const meshes=materialMeshes(asset,['Pavilion limestone interior','Pavilion stair treads','Pavilion oak furnishings']);
  for(const [x,z] of [[0,0],[3,0],[-3,0],[0,3],[0,-3]]){
   const down=new Raycaster(new Vector3(x,30,z),new Vector3(0,-1,0)).intersectObjects(meshes);
   assert.ok(down.length&&Math.abs(down[0].point.y+32)<.05,'surface sightline reaches the bottom floor without an intervening slab');
   const up=new Raycaster(new Vector3(x,-31.5,z),new Vector3(0,1,0)).intersectObjects(meshes);
   assert.equal(up.length,0,'bottom gallery has an unobstructed reciprocal view to the crown');
  }
  for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}
  const stairs=materialWorldPoints(asset,'Pavilion stair treads');
  assert.ok(stairs.some(p=>p[1]>=17.1)&&stairs.some(p=>p[1]<=-31.95),`${name}: stair extents ${Math.min(...stairs.map(p=>p[1]))}..${Math.max(...stairs.map(p=>p[1]))}`);
  for(let y=-31.8;y<17;y+=.25)assert.ok(stairs.some(p=>Math.abs(p[1]-y)<.22),`stair flight missing around local height ${y}`);
  assert.ok(stairs.every(p=>Math.hypot(p[0],p[2])>4),'stairs preserve the central view axis');
  // The upper landing must be enterable from its balcony, not fenced off by
  // the staircase's outer handrail. Derive its axis from the exported landing.
  const top=stairs.filter(p=>Math.abs(p[1]-17.12)<.01),center=top.reduce((v,p)=>v.add(new Vector3(...p)),new Vector3()).multiplyScalar(1/top.length);
  const radial=new Vector3(center.x,0,center.z).normalize();
  const origin=center.clone().addScaledVector(radial,3);origin.y=18.22;
  const guards=materialMeshes(asset,['Recessed joints','Anodised bronze']);
  const entry=new Raycaster(origin,radial.clone().negate(),0,3).intersectObjects(guards);
  assert.equal(entry.length,0,'landing entrance must have a real opening in the handrail');
  for(const mesh of guards){mesh.geometry.dispose();mesh.material.dispose();}
 }
});
