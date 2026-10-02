import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=name=>ts.transpileModule(readFileSync(new URL(`../lib/world/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const resolveThree=s=>s.replace(/from '(three[^']*)'/g,(_,path)=>`from '${import.meta.resolve(path)}'`);
const {makeCarBody,makeAircraft,makeShipDeck}=await import(url(resolveThree(compile('transport-geometry'))));
const {makeCanopy}=await import(url(resolveThree(compile('vegetation'))));
const plan=url(compile('city-plan'));
const {finishArchitecture}=await import(url(compile('city-architecture').replace(/from '.\/city-plan'/g,`from '${plan}'`)));
test('transport fittings remain batched, finite and inside their route clearance envelopes',()=>{
 for(const [name,batches,limit] of [['car',makeCarBody(),[2.5,2.5,4.8]],['bus',makeCarBody(true),[3.2,3,10.5]],['aircraft',makeAircraft(),[35,10,37]],['cruise',makeShipDeck(0,160,24),[25,30,161]],['cargo',makeShipDeck(3,50,12),[13,20,51]]]){
  assert.ok(batches.length<=8,`${name} draw calls`);
  for(const {geometry} of batches){
   for(const attribute of ['position','normal'])assert.ok([...geometry.attributes[attribute].array].every(Number.isFinite),`${name} ${attribute}`);
   geometry.computeBoundingBox();const box=geometry.boundingBox;
   assert.ok(box.min.x>=-limit[0]/2&&box.max.x<=limit[0]/2,`${name} width`);
   assert.ok(box.max.y<=limit[1]&&box.min.y>=-4,`${name} height`);
   assert.ok(box.min.z>=-limit[2]/2&&box.max.z<=limit[2]/2,`${name} length`);
   geometry.dispose();
  }
 }
});
test('tree detail has stable geometry, vertex tints and a cheaper light-quality crown',()=>{
 const a=makeCanopy(),b=makeCanopy(),low=makeCanopy(true);
 assert.deepEqual(a.attributes.position.array,b.attributes.position.array);
 assert.equal(a.attributes.color.count,a.attributes.position.count);
 assert.ok(low.index.count<a.index.count*.5);
 assert.ok(a.index.count/3<1800);
 for(const g of [a,b,low]){assert.ok([...g.attributes.normal.array].every(Number.isFinite));g.dispose();}
});
test('window reveals preserve project ownership and do not decorate solid walls',()=>{
 const glass=[0,'#36515e',10,30,20,12,3,.2,.6,12];
 const wall=[0,'#ddd9c6',10,30,20,12,3,8,.6,12];
 const parts=finishArchitecture([glass,wall]);assert.ok(parts.length>6);
 assert.equal(parts[0],glass);assert.equal(parts[1],wall);
 assert.ok(parts.slice(2).every(p=>p[9]===12&&p.slice(2,9).every(Number.isFinite)));
 assert.deepEqual(finishArchitecture([wall]),[wall]);
});
test('aligned window bands share vertical frames across storeys',()=>{
 const bands=Array.from({length:25},(_,i)=>[0,'#36515e',0,24+i*3.5,0,33,2.2,.16,0,1]);
 const parts=finishArchitecture(bands);
 assert.ok(parts.length-bands.length<40,'one sill per floor and one shared set of vertical mullions');
});
