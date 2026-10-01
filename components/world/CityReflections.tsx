"use client";
import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {SUN_DIRECTION} from '@/lib/world/city-buildings';
/** One small procedural environment per lighting state, never a reflection per window. */
export function CityReflections({dusk}:{dusk:boolean}){
 const {gl,scene,invalidate}=useThree();
 useEffect(()=>{
  const w=256,h=128,data=new Float32Array(w*h*4),sun=new THREE.Vector3(...SUN_DIRECTION).normalize();
  const top=new THREE.Color(dusk?'#41618c':'#9fcee4'),horizon=new THREE.Color(dusk?'#7498b5':'#dce6e1'),ground=new THREE.Color(dusk?'#111d2b':'#727e71');
  const direction=new THREE.Vector3(),color=new THREE.Color();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const lat=(y/h-.5)*Math.PI,lon=(x/w-.5)*Math.PI*2;
   direction.set(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon));
   color.copy(direction.y<0?ground:horizon).lerp(top,Math.max(0,direction.y));
   const glow=Math.pow(Math.max(0,direction.dot(sun)),80)*(dusk?.4:1.6);color.r+=glow;color.g+=glow*.85;color.b+=glow*.6;
   const i=(y*w+x)*4;data[i]=color.r;data[i+1]=color.g;data[i+2]=color.b;data[i+3]=1;
  }
  const input=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);input.mapping=THREE.EquirectangularReflectionMapping;input.needsUpdate=true;
  const pmrem=new THREE.PMREMGenerator(gl),target=pmrem.fromEquirectangular(input),previous=scene.environment;
  // Three owns this mutable scene; attach the baked environment for its lifetime.
  // eslint-disable-next-line react-hooks/immutability
  scene.environment=target.texture;scene.environmentIntensity=dusk?.30:.65;input.dispose();pmrem.dispose();invalidate();
  return()=>{scene.environment=previous;target.dispose()};
 },[dusk,gl,scene,invalidate]);return null;
}
