import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const source=ts.transpileModule(readFileSync(new URL('../lib/world/dive-kit-model.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](three[^'"]*)['"]/g,(_,name)=>`from ${JSON.stringify(import.meta.resolve(name))}`);
const {makeDiveKit,disposeDiveKit}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const triangles=root=>{let total=0;root.traverse(o=>{if(o.isMesh)total+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return total;};
test('both dive kit qualities retain all equipment, white finishes, ordinary optics and subtle printed logos',()=>{
 const logo=new THREE.Texture(),models=[makeDiveKit(false,logo),makeDiveKit(true,logo)];
 for(const root of models){
  for(const name of ['suit','mask','fins','cylinder','regulator'])assert.ok(root.getObjectByName('dive-kit-'+name),name);
  assert.equal(root.getObjectByName('dive-kit-fins').children.length,2);
  let marks=0,whiteArea=0,totalArea=0;
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.isMesh)return;
   for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
   if(o.material.map){assert.equal(o.material.map,logo);marks++;}
   assert.ok(!o.material.isShaderMaterial,'no hologram shaders');
   assert.ok(!o.material.emissive||o.material.emissive.getHex()===0,'no luminous trim');
   assert.ok(!o.material.iridescence,'ordinary glass');
   const g=o.geometry,p=g.attributes.position,idx=g.index;
   const triangle=new THREE.Triangle();
   for(let i=0;i<(idx?.count??p.count);i+=3){
    [triangle.a,triangle.b,triangle.c].forEach((v,j)=>v.fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(o.matrixWorld));
    const area=triangle.getArea();totalArea+=area;
    if(o.material.color?.r>.7&&o.material.color?.g>.7&&o.material.color?.b>.7&&!o.material.transparent)whiteArea+=area;
   }
  });
  assert.equal(marks,2);assert.ok(whiteArea/totalArea>.7,'white should dominate actual equipment surface area');
  const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  assert.ok(size.x<2.5&&size.y<2.7&&size.z<1);
 }
 assert.ok(triangles(models[0])<100000,'bounded secondary viewer');
 assert.ok(triangles(models[1])<triangles(models[0])*.6,'lightweight really reduces geometry');
 models.forEach(disposeDiveKit);logo.dispose();
});
test('kit disposal releases shared resources once without disposing the shared logo texture',()=>{
 const logo=new THREE.Texture(),root=makeDiveKit(true,logo),geometries=new Set(),materials=new Set();let textures=0;
 root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
 const counts=new Map();for(const resource of [...geometries,...materials]){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}
 logo.addEventListener('dispose',()=>textures++);disposeDiveKit(root);
 for(const count of counts.values())assert.equal(count,1);assert.equal(textures,0);
});
