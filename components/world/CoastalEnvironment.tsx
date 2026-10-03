"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {weatherAt,type Weather} from '@/lib/world/city-plan';
import {SUN_DIRECTION} from '@/lib/world/city-buildings';
import type {Clock} from './CityLife';

export function CoastalEnvironment({clock,dusk,low,underwater,trench=false,sphere=false,weather}:{clock:Clock;dusk:boolean;low:boolean;underwater?:boolean;trench?:boolean;sphere?:boolean;weather:Weather}){
 const material=useRef<THREE.ShaderMaterial>(null);
 const sun=useRef<THREE.DirectionalLight>(null),sky=useRef<THREE.Mesh>(null),rain=useRef<THREE.LineSegments>(null);
 const {controls}=useThree();
 const uniforms=useMemo(()=>({sun:{value:new THREE.Vector3(...SUN_DIRECTION).normalize()},dusk:{value:0},cloud:{value:0},time:{value:0}}),[]);
 const drops=useMemo(()=>{const g=new THREE.BufferGeometry(),v=[];for(let i=0;i<500;i++){const x=Math.sin(i*23.1)*350,z=Math.cos(i*52.6)*350,y=(i%71)*3.2;v.push(x,y,z,x-1.8,y+5,z+.6)}g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return g},[]);
 useEffect(()=>()=>drops.dispose(),[drops]);
 useFrame(({camera})=>{
  const w=weatherAt(clock.current,weather),target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();
  if(material.current){material.current.uniforms.dusk.value=dusk?1:0;material.current.uniforms.cloud.value=w;material.current.uniforms.time.value=clock.current;}
  if(sky.current){sky.current.position.copy(camera.position);sky.current.visible=!underwater}
  if(sun.current){sun.current.position.copy(target).addScaledVector(uniforms.sun.value,1400);sun.current.target.position.copy(target);sun.current.target.updateMatrixWorld();sun.current.intensity=underwater?.8:dusk?.12:2.2-w*1.2;}
  if(rain.current){rain.current.visible=!underwater&&!low&&w>.8;rain.current.position.set(target.x,80-(clock.current*48%180),target.z)}
 });
 return <>
 <color attach="background" args={[underwater?(trench?(dusk?'#04121d':'#153b46'):sphere&&dusk?'#102f40':'#286577'):'#9fc5d4']}/>
 <fog attach="fog" args={[underwater?(trench?(dusk?'#04121d':'#153b46'):sphere&&dusk?'#102f40':'#286577'):dusk?'#193049':'#bbd2d7',underwater?(trench?85:sphere?45:20):1900,underwater?(trench?440:sphere?380:160):12500]}/>
 <hemisphereLight args={[dusk?'#9dbce7':'#b9d7ec',dusk?'#172738':'#7b8064',dusk?.25:1.35]}/>
 <directionalLight ref={sun} color={dusk?'#98b9e9':'#fff6e6'} castShadow={!low} shadow-mapSize={[2048,2048]} shadow-camera-left={-560} shadow-camera-right={560} shadow-camera-top={560} shadow-camera-bottom={-560} shadow-camera-far={2400} shadow-normalBias={.18} shadow-bias={-.0003}/>
 <mesh ref={sky} renderOrder={-10} frustumCulled={false}>
  <sphereGeometry args={[16000,32,20]}/>
  <shaderMaterial ref={material} side={THREE.BackSide} depthWrite={false} uniforms={uniforms} vertexShader={`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`
   uniform vec3 sun;uniform float dusk,cloud,time;varying vec3 direction;
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453),f.x),mix(fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453),fract(sin(dot(i+1.,vec2(127.1,311.7)))*43758.5453),f.x),f.y);}
   float fbm(vec2 p){return noise(p)*.55+noise(p*2.03)*.27+noise(p*4.07)*.13+noise(p*8.1)*.05;}
   void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 zenith=mix(vec3(.08,.32,.57),vec3(.004,.01,.025),dusk);vec3 horizon=mix(vec3(.53,.72,.8),vec3(.022,.045,.08),dusk);vec3 c=mix(horizon,zenith,pow(h,.45));float a=max(dot(d,sun),0.);c+=vec3(1.,.76,.38)*pow(a,30.)*.23*(1.-dusk*.9);c+=vec3(1.,.87,.6)*smoothstep(.99955,.9998,a)*mix(2.,.16,dusk);
   vec2 uv=d.xz/max(.05,d.y)*2.+vec2(time*.001,0.);float n=fbm(uv);float cover=smoothstep(.59-cloud*.14,.79-cloud*.11,n)*smoothstep(.03,.17,h);float light=fbm(uv+sun.xz*.3);vec3 lit=mix(vec3(.61,.69,.75),vec3(.98,.97,.94),smoothstep(.4,.76,light));lit*=mix(1.,.065,dusk);c=mix(c,lit,cover*.88);c=mix(c,mix(vec3(.47,.57,.62),vec3(.025,.045,.075),dusk),cloud*.35);gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')}/>
 </mesh>
 <lineSegments ref={rain} geometry={drops}><lineBasicMaterial color="#b5d2d7" transparent opacity={.18} depthWrite={false}/></lineSegments>
 </>;
}
