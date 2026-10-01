"use client";
import {useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {makeNightField,nightField,streetLights} from '@/lib/world/night-lighting';
import type {Part} from '@/lib/world/city-assets';
import {Parts} from './CityTerrain';
import {mountainSites,coastalLights,airfieldLights} from '@/lib/world/city-plan';
export function CityNight({dusk}:{dusk:boolean}){
 const {invalidate}=useThree();
 // The atlas lights the city; these two local fills stay attached to physical sites.
 // Never reassign lights from the camera target: crossing a nearest-source boundary
 // makes specular highlights and illuminated facades pop while the user pans.
 const pierLamp=coastalLights.filter(light=>light.region==='dive'&&light.cool).at(-1)!;
 const tower=mountainSites.tower.position;
 const beacons=useMemo(()=>{
  const lights=[...airfieldLights,...coastalLights.map(l=>({x:l.x,y:l.y+l.height+.3,z:l.z,color:l.cool?'#d5efff':'#ffdca7'})),{x:2040,y:67.5,z:145,color:'#ff5056'}];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lights.flatMap(l=>[l.x,l.y,l.z]),3));g.setAttribute('color',new THREE.Float32BufferAttribute(lights.flatMap(l=>new THREE.Color(l.color).toArray()),3));return g;
 },[]);
 useEffect(()=>()=>beacons.dispose(),[beacons]);
 const poles=useMemo(()=>streetLights.flatMap(p=>[[1,'#263f4a',p.x,p.y+3.5,p.z,.10,7,.10,0,-1],[0,'#f5eac7',p.x,p.y+7,p.z,1.1,.25,1.1,0,-1]] as Part[]),[]);
 useEffect(()=>{const texture=makeNightField();nightField.texture.value=texture;invalidate();return()=>{nightField.texture.value=null;texture.dispose()}},[invalidate]);
 useEffect(()=>{nightField.amount.value=dusk?1:0;invalidate()},[dusk,invalidate]);
 return <><points geometry={beacons} visible={dusk} frustumCulled={false}>
  <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={`attribute vec3 color;varying vec3 lampColor;void main(){lampColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(4200./max(1.,-p.z),2.2,8.);}`} fragmentShader={`varying vec3 lampColor;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=exp(-r*r*5.)*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(lampColor*1.8,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>}`}/>
 </points><Parts parts={poles} dusk={dusk}/><pointLight name="observatory-landing-light" position={[pierLamp.x,pierLamp.y+pierLamp.height,pierLamp.z]} color="#d5eaff" intensity={dusk?650:0} distance={pierLamp.radius*1.8} decay={2}/><pointLight name="forest-tower-light" position={[tower[0],tower[1]+46,tower[2]]} color="#ffd6a0" intensity={dusk?120:0} distance={38} decay={2}/></>;
}
