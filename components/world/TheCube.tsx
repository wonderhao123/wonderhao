"use client";
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {cubeSite,terrainHeight} from '@/lib/world/city-plan';

/** The same unbroken six-faced solid is used at both quality levels. */
export function TheCube({dusk,underwater=false,low=false}:{dusk:boolean;underwater?:boolean;low?:boolean}){
 const trench=useMemo(()=>{
  if(!underwater)return null;
  const g=new THREE.PlaneGeometry(640,840,low?64:128,low?84:168);
  g.rotateX(-Math.PI/2);g.translate(cubeSite.center[0],0,cubeSite.center[2]);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i)));
  g.computeVertexNormals();return g;
 },[underwater,low]);
 useEffect(()=>()=>trench?.dispose(),[trench]);
 // Only the diffuse water glow is visible from above; the solid belongs to the dive.
 if(!underwater)return null;
 return <>
  <mesh name="cube-solid" position={cubeSite.center} castShadow receiveShadow={!dusk}>
   <boxGeometry args={[cubeSite.size,cubeSite.size,cubeSite.size]}/>
   <meshStandardMaterial color="#e5eeeb" roughness={.2} metalness={.12} emissive="#b9f4ee" emissiveIntensity={dusk?1.15:0} />
  </mesh>
  {trench&&<mesh name="cube-trench" geometry={trench} receiveShadow>
   <meshStandardMaterial color="#435556" roughness={.98} onBeforeCompile={shader=>{
    shader.uniforms.cubeGlow={value:dusk?1:0};
    shader.uniforms.cubeCentre={value:new THREE.Vector3(...cubeSite.center)};
    shader.vertexShader='varying vec3 trenchPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntrenchPoint=position;');
    shader.fragmentShader='uniform float cubeGlow; uniform vec3 cubeCentre; varying vec3 trenchPoint;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     float strata=.5+.5*sin(trenchPoint.y*1.2+sin(trenchPoint.z*.08)*2.+sin(trenchPoint.x*.11));
     float grain=fract(sin(dot(floor(trenchPoint*3.),vec3(12.9898,78.233,36.7)))*43758.5453);
     diffuseColor.rgb*=.78+.18*strata+.12*grain;`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     vec3 delta=max(abs(trenchPoint-cubeCentre)-vec3(${cubeSite.size/2}.),vec3(0.));
     float glow=exp(-length(delta)*.065)*cubeGlow;
     totalEmissiveRadiance+=vec3(.06,.23,.22)*glow;`);
   }} key={dusk?'night':'day'}/>
  </mesh>}
 </>;
}
