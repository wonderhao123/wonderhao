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
  if(!name.startsWith('Titanium')&&name!=='Immersed ceramic coating')continue;
  const vertices=attribute(asset,primitive.attributes.POSITION),normals=attribute(asset,primitive.attributes.NORMAL);
  for(let i=0;i<vertices.length;i++){
   const p=vertices[i],r=Math.hypot(...p);
   // Airlock shares titanium; pressure-shell vertices are exactly on the design radius.
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
   assert.ok(asset.doc.materials.every(m=>(m.alphaMode??'OPAQUE')==='OPAQUE'));
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
