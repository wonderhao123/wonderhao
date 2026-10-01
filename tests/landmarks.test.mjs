import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
   assert.ok(asset.doc.meshes.length<=10);assert.ok(!asset.doc.images?.length);
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
