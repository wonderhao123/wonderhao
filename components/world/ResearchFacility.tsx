"use client";
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {LandmarkAsset} from './LandmarkAsset';
import spec from '@/lib/world/landmark-spec.json';
import type {V3} from '@/lib/world/city-plan';
import type {Clock} from './CityLife';
const sphere=spec.observatory,walk=sphere.walkway;

/** Eight fixed fixtures: never chosen, moved or dimmed by the camera. */
function MarineLights({dusk,low,clock}:{dusk:boolean;low:boolean;clock:Clock}){
 const lights=useMemo(()=>Array.from({length:walk.supportCount},(_,i)=>{
  const a=i*Math.PI*2/walk.supportCount,c=Math.cos(a),s=Math.sin(a);
  const position=new THREE.Vector3(walk.lightRadius*c,walk.lightY-sphere.center[1],walk.lightRadius*s);
  const target=new THREE.Object3D();target.position.set(walk.lightTargetRadius*c,walk.lightTargetY-sphere.center[1],walk.lightTargetRadius*s);
  const direction=target.position.clone().sub(position),length=direction.length();
  return {position,target,length,midpoint:position.clone().add(target.position).multiplyScalar(.5),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),direction.normalize())};
 }),[]);
 const fish=useRef<THREE.InstancedMesh>(null),tails=useRef<THREE.InstancedMesh>(null),dummy=useMemo(()=>new THREE.Object3D(),[]);
 const count=low?24:64;
 useFrame(()=>{
  if(!fish.current||!tails.current)return;
  for(let i=0;i<count;i++){
   const a=clock.current*.055+i*2.39996,r=45+(i%5)*1.05,y=-14-(i%7)*1.1+Math.sin(clock.current*.3+i)*.6;
   dummy.position.set(Math.cos(a)*r,y,Math.sin(a)*r);dummy.rotation.set(0,-a,Math.sin(clock.current*1.5+i)*.035);dummy.scale.set(.28,.48,1.1);dummy.updateMatrix();fish.current.setMatrixAt(i,dummy.matrix);
   dummy.translateZ(-1.45);dummy.rotation.set(0,-a+Math.sin(clock.current*5+i)*.3,0);dummy.scale.set(.10,.48,.65);dummy.updateMatrix();tails.current.setMatrixAt(i,dummy.matrix);
  }
  fish.current.instanceMatrix.needsUpdate=true;tails.current.instanceMatrix.needsUpdate=true;
 });
 return <>
  {lights.map((l,i)=><group key={i}>
   <primitive object={l.target}/>
   <spotLight name={`sphere-searchlight-${i}`} position={l.position} target={l.target} color="#bce9ed" intensity={dusk?2600:1800} distance={65} angle={.28} penumbra={.65} decay={2}/>
   <mesh name={`sphere-light-beam-${i}`} position={l.midpoint} quaternion={l.rotation} renderOrder={1}>
    <coneGeometry args={[Math.tan(.28)*l.length,l.length,low?16:32,1,true]}/>
    <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}
     uniforms={{strength:{value:dusk?.055:.025}}}
     vertexShader={`varying vec2 beamUv;void main(){beamUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
     fragmentShader={`uniform float strength;varying vec2 beamUv;void main(){float fade=smoothstep(0.,.15,beamUv.y)*pow(1.-beamUv.y,.6);gl_FragColor=vec4(.55,.86,.91,strength*fade);}`} />
   </mesh>
  </group>)}
  <instancedMesh name="sphere-fish" ref={fish} args={[undefined,undefined,count]} frustumCulled={false}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#a6c8c9" metalness={.32} roughness={.38}/></instancedMesh>
  <instancedMesh name="sphere-fish-tails" ref={tails} args={[undefined,undefined,count]} frustumCulled={false}><coneGeometry args={[1,1,3]}/><meshStandardMaterial color="#80a5b0" metalness={.18} roughness={.5}/></instancedMesh>
 </>;
}
/** Complete fixed sphere; model origin is its centre, not its waterline. */
export function ResearchFacility({dusk,onStatus,low,underwater=false,clock}:{dusk:boolean;low:boolean;underwater?:boolean;clock?:Clock;onStatus?:(id:string,state:string)=>void}){
 return <group position={sphere.center as V3}><LandmarkAsset name="observatory" low={low} dusk={dusk} onStatus={onStatus}/>{underwater&&clock&&<MarineLights dusk={dusk} low={low} clock={clock}/>}</group>;
}
