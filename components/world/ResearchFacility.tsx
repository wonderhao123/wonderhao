"use client";
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {Parts} from './CityTerrain';
import type {Part} from '@/lib/world/city-assets';
/** Fixed vertical caisson, with an occupied face and a small lateral landing. */
export function ResearchFacility({dusk}:{dusk:boolean}){
 const body=useMemo(()=>{const s=new THREE.Shape();s.absarc(0,0,35,0,Math.PI*2,false);return new THREE.ExtrudeGeometry(s,{depth:15,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.4,bevelSegments:3,curveSegments:80})},[]);
 useEffect(()=>()=>body.dispose(),[body]);
 const parts=useMemo(()=>{
  const a:Part[]=[];const b=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>a.push([0,c,x,y,z,w,h,d,r]);
  // Narrow observation ribbons are broken by mullions; no individual transparent panes.
  for(const y of [8,17,26]){const w=2*Math.sqrt(32**2-y**2);b('#71989d',0,y,16.32,w,1.35,.16);b('#a48864',0,y+1,16.5,w+.8,.3,.6);for(let x=-w/2+3;x<w/2;x+=4)b('#263f4a',x,y,16.5,.16,1.5,.35)}
  for(let i=0;i<17;i++){const angle=i*Math.PI/16;const x=Math.cos(angle)*31,y=Math.sin(angle)*31; b('#46626a',x,y,16.3,.16,4,.2)}
  b('#263f4a',30,4,10,5,7,8);b('#82a7a5',30,4,14.1,3,5,.2);b('#a48864',36,1,7,12,1,15);
  for(const x of [33,41])for(const z of [1,12]){a.push([1,'#83908c',x,-9,z,.5,19,.5,0]);b('#a48864',x,2,z,.12,2,.12)}
  b('#a48864',41,2.8,7,.15,.15,13);b('#a48864',36,2.8,1,10,.15,.15);
  for(const x of [-18,18])b('#89918b',x,-25,7,7,21,11);
  b('#a9aca0',0,-35,7,58,4,28);
  // Service ladder on the side, docking bollards and a restrained roof access hatch.
  for(const x of [34.5,35.7])b('#a48864',x,-2,14,.13,7,.13);
  for(let i=0;i<10;i++)b('#a48864',35.1,-5+i*.65,14,1.2,.12,.12);
  b('#a48864',0,33.5,7,5,.7,7);
  return a;
 },[]);
 return <group position={[480,3,390]} rotation={[0,-.24,0]}>
  <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial color="#314c56" metalness={.48} roughness={.4}/></mesh>
  {[0,15.8].map(z=><mesh key={z} position={[0,0,z]} castShadow><torusGeometry args={[34.8,.65,8,120]}/><meshStandardMaterial color="#a48864" roughness={.36} metalness={.6}/></mesh>)}
  <mesh position={[0,-4,16.25]}><boxGeometry args={[67,3,.15]}/><meshStandardMaterial color="#243c43" roughness={.23} metalness={.5}/></mesh>
  <Parts parts={parts} dusk={dusk}/>
 </group>;
}
