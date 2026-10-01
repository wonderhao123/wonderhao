"use client";
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {mountainSites} from '@/lib/world/city-plan';
import {architecturalSurface} from '@/lib/world/surface-materials';
import type {Part} from '@/lib/world/city-assets';
import {Parts,ribbon} from './CityTerrain';
const height=48,turns=9,steps=648;
const radius=(t:number)=>9+24*(t-.46)**2;
/** Continuous solid ramp, helical rails and a triangulated load-bearing timber shell. */
export function MountainPlaces({dusk}:{dusk:boolean}){
 const tower=useMemo(()=>{
  const paths=[-1,1].map(side=>Array.from({length:steps+1},(_,i)=>{const t=i/steps,a=t*turns*Math.PI*2,r=radius(t)+side*1.2;return new THREE.Vector3(Math.sin(a)*r,t*height+1.1,Math.cos(a)*r)}));
  const vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<=steps;i++)for(const dy of [0,-.28])for(const side of [0,1]){const p=paths[side][i];vertices.push(p.x,p.y-1.1+dy,p.z)}
  for(let i=0;i<steps;i++){const a=i*4,b=a+4;indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3)}
  const ramp=new THREE.BufferGeometry();ramp.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));ramp.setIndex(indices);ramp.computeVertexNormals();
  const beams:THREE.BufferGeometry[]=[];
  const beam=(a:THREE.Vector3,b:THREE.Vector3,r:number)=>{const g=new THREE.CylinderGeometry(r,r,a.distanceTo(b),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());beams.push(g)};
  for(let tier=0;tier<8;tier++)for(let i=0;i<16;i++)for(const direction of [-1,1]){const t=tier/8,u=(tier+1)/8,a=i*Math.PI/8,b=a+direction*Math.PI/8;beam(new THREE.Vector3(Math.sin(a)*(radius(t)+1.7),t*height,Math.cos(a)*(radius(t)+1.7)),new THREE.Vector3(Math.sin(b)*(radius(u)+1.7),u*height,Math.cos(b)*(radius(u)+1.7)),.26)}
  for(let i=0;i<=steps;i+=3)for(const side of [0,1]){const top=paths[side][i];beam(top.clone().add(new THREE.Vector3(0,-1.1,0)),top,.045);}
  // Radial joists tie every ramp level into the exterior shell.
  for(let i=0;i<=steps;i+=9){const t=i/steps,a=t*turns*Math.PI*2;beam(new THREE.Vector3(Math.sin(a)*(radius(t)-1.2),t*height-.16,Math.cos(a)*(radius(t)-1.2)),new THREE.Vector3(Math.sin(a)*(radius(t)+1.7),t*height-.16,Math.cos(a)*(radius(t)+1.7)),.12)}
  for(let i=0;i<48;i++){const a=i*Math.PI/24,r=radius(1)+1.1;beam(new THREE.Vector3(Math.sin(a)*r,height,Math.cos(a)*r),new THREE.Vector3(Math.sin(a)*r,height+1.1,Math.cos(a)*r),.04)}
  const structure=mergeGeometries(beams);beams.forEach(g=>g.dispose());
  const rails=paths.map(p=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),steps,.055,5,false));
  return {ramp,structure,rails};
 },[]);
 const cabins=useMemo(()=>{const p:Part[]=[];const [x,y,z]=mountainSites.fieldbase.position;
  for(let i=0;i<3;i++){const cx=x-18+i*18,cz=z+(i%2)*15;p.push([0,'#b9bcb3',cx,y-.7,cz,14,1.4,18,0],[0,'#a48864',cx,y+2.5,cz,12,5,16,0],[4,'#263f4a',cx,y+4.95,cz,14,3,18,0],[0,'#386574',cx,y+2.5,cz+8.1,9,3,.2,0],[0,'#263f4a',cx,y+1.8,cz-8.1,3,3.6,.2,0],[0,'#d2c4a7',cx,y+.15,cz-12,14,.3,8,0]);}
  p.push([1,'#b9bcb3',x+20,y+1,z-17,2,2,2,0],[1,'#a48864',x+20,y+8,z-17,.15,14,.15,0],[0,'#386574',x+20,y+14,z-17,5,.25,3,0],[0,'#e4dfcf',x-20,y+1.2,z-20,7,2.4,4,0]);
  return p;
 },[]);
 const path=useMemo(()=>ribbon([[-1060,120.08,-720],[-1060,120.08,-700],[-1048,120.08,-700]],3),[]);
 useEffect(()=>()=>{tower.ramp.dispose();tower.structure.dispose();tower.rails.forEach(g=>g.dispose());path.dispose()},[tower,path]);
 return <>
  <group position={mountainSites.tower.position}>
   <mesh position={[0,-1.1,0]} receiveShadow><cylinderGeometry args={[19,20,2.2,48]}/><meshStandardMaterial color="#b9bcb3" roughness={.9}/></mesh>
   <mesh geometry={tower.ramp} castShadow receiveShadow><meshStandardMaterial color="#baa082" roughness={.8} side={THREE.DoubleSide}/></mesh>
   <mesh geometry={tower.structure} castShadow><meshStandardMaterial color="#9b7854" roughness={.68} onBeforeCompile={s=>architecturalSurface(s,false,false,"wood")}/></mesh>
   {tower.rails.map((g,i)=><mesh key={i} geometry={g}><meshStandardMaterial color="#53605b" metalness={.6} roughness={.4} emissive="#f1d6a6" emissiveIntensity={dusk?.28:0}/></mesh>)}
   <mesh position={[0,height-.18,0]} receiveShadow><cylinderGeometry args={[radius(1)+1.3,radius(1)+1.3,.36,64]}/><meshStandardMaterial color="#baa082" roughness={.8}/></mesh>
   <mesh position={[0,height+1.1,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius(1)+1.1,.065,5,96]}/><meshStandardMaterial color="#53605b"/></mesh>

  </group>
  <mesh geometry={path} receiveShadow><meshStandardMaterial color="#baa082" roughness={.9}/></mesh>
  <Parts parts={cabins} dusk={dusk}/>
 </>;
}
