"use client";
import {useEffect,useState} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {LANDMARK_VERSION} from '@/lib/world/landmark-version';
import {assetPath} from '@/lib/world/assets';
function dispose(root:THREE.Group){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
/** Each mount owns parsed resources, avoiding shared-cache disposal races. */
export function LandmarkAsset({name,dusk=false,onStatus,low=false}:{name:'observatory'|'habitat'|'ship-hull'|'ring';dusk?:boolean;low?:boolean;onStatus?:(id:string,state:string)=>void}){
 const variant=name+(low&&name!=='ship-hull'?'-low':'');
 const [root,setRoot]=useState<THREE.Group>();const [attempt,setAttempt]=useState(0);const {invalidate}=useThree();
 useEffect(()=>{
  let alive=true,loaded:THREE.Group|undefined;const controller=new AbortController();onStatus?.(name,'loading');
  fetch(assetPath(`/world/models/${variant}.glb?v=${LANDMARK_VERSION}`),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Landmark unavailable');return r.arrayBuffer()}).then(b=>new GLTFLoader().parseAsync(b,''))
   .then(g=>{loaded=g.scene;loaded.userData.variant=variant;if(!alive){dispose(loaded);return}loaded.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});setRoot(loaded);onStatus?.(name,'ready');invalidate()})
   .catch(e=>{if(alive&&e.name!=='AbortError')onStatus?.(name,'error')});
  return()=>{alive=false;controller.abort();if(loaded)dispose(loaded);onStatus?.(name,'idle')};
 },[name,variant,attempt,invalidate,onStatus]);
 useEffect(()=>{const retry=()=>setAttempt(n=>n+1);window.addEventListener('world-retry-region',retry);return()=>window.removeEventListener('world-retry-region',retry)},[]);
 useEffect(()=>{root?.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial&&m.name==='Observation glazing'){m.emissive.set(dusk?'#bfa979':'#000000');m.emissiveIntensity=dusk?.3:0}}});invalidate()},[root,dusk,invalidate]);
 return root&&root.userData.variant===variant?<primitive object={root} dispose={null}/>:null;
}
