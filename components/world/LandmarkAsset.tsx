"use client";
import {useEffect,useState} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {LANDMARK_VERSION} from '@/lib/world/landmark-version';
import {focusSurface} from '@/lib/world/building-focus';
import {assetPath} from '@/lib/world/assets';
function dispose(root:THREE.Group){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
/** Each mount owns parsed resources, avoiding shared-cache disposal races. */
export function LandmarkAsset({name,dusk=false,onStatus,low=false,statusId=name}:{statusId?:string;name:'observatory'|'habitat'|'ship-hull'|'ring';dusk?:boolean;low?:boolean;onStatus?:(id:string,state:string)=>void}){
 const variant=name+(low&&name!=='ship-hull'?'-low':'');
 const [root,setRoot]=useState<THREE.Group>();const [attempt,setAttempt]=useState(0);const {invalidate}=useThree();
 useEffect(()=>{
  let alive=true,loaded:THREE.Group|undefined;const controller=new AbortController();onStatus?.(statusId,'loading');
  fetch(assetPath(`/world/models/${variant}.glb?v=${LANDMARK_VERSION}`),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Landmark unavailable');return r.arrayBuffer()}).then(b=>new GLTFLoader().parseAsync(b,''))
   .then(g=>{loaded=g.scene;loaded.userData.variant=variant;if(!alive){dispose(loaded);return}loaded.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.alphaHash=!material.transparent;if(material.name==='Pavilion clear glazing'){material.depthWrite=false;material.side=THREE.FrontSide;o.castShadow=false;o.renderOrder=2;}material.onBeforeCompile=(shader:THREE.WebGLProgramParametersWithUniforms)=>{
          focusSurface(shader,false,name==='observatory'?8:0);
        };material.customProgramCacheKey=()=>`landmark-focus-${name}-${material.name}`;}}});setRoot(loaded);onStatus?.(statusId,'ready');invalidate()})
   .catch(e=>{if(alive&&e.name!=='AbortError')onStatus?.(statusId,'error')});
  return()=>{alive=false;controller.abort();if(loaded)dispose(loaded);onStatus?.(statusId,'idle')};
 },[name,statusId,variant,attempt,invalidate,onStatus]);
 useEffect(()=>{const retry=()=>setAttempt(n=>n+1);window.addEventListener('world-retry-region',retry);return()=>window.removeEventListener('world-retry-region',retry)},[]);
 useEffect(()=>{root?.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial){
   if(m.name==='Pavilion clear glazing'){m.opacity=dusk?.16:.20;m.envMapIntensity=dusk?.4:1.1;}
   if(m.name==='Pavilion warm light'){m.userData.authoredGlow??=m.emissiveIntensity;m.emissiveIntensity=m.userData.authoredGlow*(dusk?1:.02);}
   if(m.name==='Pavilion limestone interior'||m.name==='Pavilion stair treads'){m.emissive.set('#ffd19b');m.emissiveIntensity=dusk?.32:0;}
   if(m.name==='Pavilion oak furnishings'){m.emissive.copy(m.color);m.emissiveIntensity=dusk?.25:0;}
   if(m.name==='Pavilion silver louvers'){m.emissive.set('#9eb4c0');m.emissiveIntensity=dusk?.08:0;}
   if(name==='observatory'&&m.name==='Anodised bronze'){m.emissive.set('#c3ac79');m.emissiveIntensity=dusk?.28:0}
   if(m.name==='Observation glazing'){m.emissive.set(dusk?'#bfa979':'#000000');m.emissiveIntensity=dusk?.3:0}
   if(m.name==='Ring violet edge'){m.userData.authoredGlow??=m.emissiveIntensity;m.emissiveIntensity=m.userData.authoredGlow*(dusk?1:.13);}
   if(m.name==='Ring aquamarine energy'||m.name==='Ring pearl light'){m.userData.authoredGlow??=m.emissiveIntensity;m.emissiveIntensity=m.userData.authoredGlow*(dusk?1:.24);}
   if(m.name==='Ring champagne bronze'){m.emissive.set('#bfa477');m.emissiveIntensity=dusk?.18:0;}
   if(m.name==='Ring blue glazing'){m.emissive.set('#769baa');m.emissiveIntensity=dusk?.13:0}
  }}});invalidate()},[root,dusk,invalidate,name]);
 return root&&root.userData.variant===variant?<primitive object={root} dispose={null}/>:null;
}
