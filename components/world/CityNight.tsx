"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useThree,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {makeNightField,nightField,streetLights} from '@/lib/world/night-lighting';
import type {Part} from '@/lib/world/city-assets';
import {Parts} from './CityTerrain';
import {mountainSites} from '@/lib/world/city-plan';
export function CityNight({dusk}:{dusk:boolean}){
 const {invalidate,controls}=useThree();
 const lightA=useRef<THREE.PointLight>(null),lightB=useRef<THREE.PointLight>(null);
 const sources=useMemo(()=>[...[[183,26,203],[-220,26,80],[-85,27,128],[80,82,-422]].map(p=>new THREE.Vector3(...p as [number,number,number])),...Object.values(mountainSites).map(s=>new THREE.Vector3(...s.position).add(new THREE.Vector3(0,6,0))),new THREE.Vector3(...mountainSites.tower.position).add(new THREE.Vector3(0,46,0))],[]);
 useFrame(()=>{const target=(controls as unknown as {target?:THREE.Vector3})?.target;if(!target)return;const near=[...sources].sort((a,b)=>a.distanceToSquared(target)-b.distanceToSquared(target));lightA.current?.position.copy(near[0]);lightB.current?.position.copy(near[1]);});
 const poles=useMemo(()=>streetLights.flatMap(p=>[[1,'#263f4a',p.x,p.y+3.5,p.z,.10,7,.10,0,-1],[0,'#f5eac7',p.x,p.y+7,p.z,1.1,.25,1.1,0,-1]] as Part[]),[]);
 useEffect(()=>{const texture=makeNightField();nightField.texture.value=texture;invalidate();return()=>{nightField.texture.value=null;texture.dispose()}},[invalidate]);
 useEffect(()=>{nightField.amount.value=dusk?1:0;invalidate()},[dusk,invalidate]);
 return <><Parts parts={poles} dusk={dusk}/><pointLight ref={lightA} color="#ffd6a0" intensity={dusk?120:0} distance={38} decay={2}/><pointLight ref={lightB} color="#ffd6a0" intensity={dusk?120:0} distance={38} decay={2}/></>;
}
