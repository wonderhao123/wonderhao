"use client";
import {useEffect,useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {busState,aircraftState,vesselSpecs,vesselState,along} from '@/lib/world/city-life';
import {terrainHeight,sampleRoad,type V3} from '@/lib/world/city-plan';
import {LandmarkAsset} from './LandmarkAsset';
export type Clock=MutableRefObject<number>;
function Box({p,s,c,r=0}:{p:V3;s:V3;c:string;r?:number}){return <mesh position={p} rotation={[0,r,0]} castShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.65}/></mesh>}
export function Aircraft({scale=1}:{scale?:number}){
 const wing=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-1,3);s.lineTo(-17,-5);s.lineTo(-17,-7);s.lineTo(-1,-2);s.lineTo(1,-2);s.lineTo(17,-7);s.lineTo(17,-5);s.lineTo(1,3);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.35,bevelEnabled:false});g.rotateX(-Math.PI/2);return g},[]);
 useEffect(()=>()=>wing.dispose(),[wing]);
 return <group scale={scale}>
  <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[1.75,1.75,28,16]}/><meshStandardMaterial color="#f5f1df"/></mesh>
  <mesh position={[0,0,15.4]} rotation={[Math.PI/2,0,0]} castShadow><coneGeometry args={[1.75,5,16]}/><meshStandardMaterial color="#f5f1df"/></mesh>
  <mesh position={[0,0,-15.4]} rotation={[-Math.PI/2,0,0]} castShadow><coneGeometry args={[1.75,5,16]}/><meshStandardMaterial color="#e6e7da"/></mesh>
  <mesh geometry={wing} castShadow><meshStandardMaterial color="#e1e5df"/></mesh>
  <Box p={[0,3,-13]} s={[.45,6,5]} c="#619fa4"/>
  <Box p={[0,.8,-13]} s={[12,.3,3]} c="#dde3da"/>
  <Box p={[0,1.3,13]} s={[2.5,.7,2]} c="#344f5b"/>
  {[-1,1].map(s=><group key={s}><mesh position={[s*6,-1.5,-1]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.15,1.05,4.5,12]}/><meshStandardMaterial color="#e1e6df"/></mesh>{Array.from({length:15},(_,i)=><Box key={i} p={[s*1.7,.6,-10+i*1.4]} s={[.09,.45,.55]} c="#38545e"/>)}<Box p={[s*2,-2.4,-3]} s={[.7,1,.9]} c="#344443"/></group>)}
 </group>
}
function Plane({index,clock}:{index:number;clock:Clock}){
 const ref=useRef<THREE.Group>(null);useFrame(()=>{if(!ref.current)return;const s=aircraftState(clock.current,index);ref.current.position.set(...s.p);ref.current.rotation.y=s.heading;ref.current.visible=s.visible;ref.current.rotation.x=s.phase==='Climb'?-.08:0});
 return <group ref={ref}><Aircraft/></group>
}
export function Ship({kind=0}:{kind?:number}){
 const s=vesselSpecs[kind],l=s.length,w=s.beam;
 return <group>
  <group scale={[w,2.6,l]} rotation={[0,Math.PI,0]}><LandmarkAsset name="ship-hull"/></group>
  <Box p={[0,2,0]} s={[w*.82,2,l*.85]} c="#dedfd3"/>
  {Array.from({length:kind===0?6:2},(_,i)=><group key={i}><Box p={[0,4+i*2.8,-l*.05]} s={[w*(.75-i*.04),2.5,l*(.69-i*.065)]} c="#f0eee0"/><Box p={[0,4+i*2.8,l*(.295-i*.0325)]} s={[w*(.68-i*.04),1.3,.12]} c="#466e7c"/>{[-1,1].map(side=><Box key={side} p={[side*w*(.377-i*.02),4+i*2.8,-l*.05]} s={[.1,1.1,l*(.64-i*.065)]} c="#57838c"/>)}</group>)}
  <Box p={[0,kind===0?22:11,-l*.16]} s={[w*.3,5,l*.08]} c="#bd8564"/>
  {kind===0&&<><Box p={[0,21,l*.13]} s={[8,.25,15]} c="#76b9b3"/>{[-1,1].flatMap(side=>[-1,0,1].map(i=><Box key={`${side}:${i}`} p={[side*w*.43,9,i*24]} s={[2.4,2,10]} c="#dca676"/>))}<Box p={[0,25,-l*.12]} s={[.5,6,.5]} c="#c3d1ca"/><Box p={[0,27,-l*.12]} s={[7,.4,.4]} c="#e2e8df"/></>}
  {kind>2&&<Box p={[0,4,l*.22]} s={[w*.6,3,l*.22]} c="#b4b79e"/>}
 </group>
}
function Vessel({index,clock}:{index:number;clock:Clock}){const ref=useRef<THREE.Group>(null),wake=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(!ref.current)return;const s=vesselState(clock.current,index);ref.current.position.set(...s.p);const delta=THREE.MathUtils.euclideanModulo(s.heading-ref.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;ref.current.rotation.y+=delta*Math.min(1,dt*2);ref.current.rotation.z=Math.sin(clock.current*.7+index)*.006;if(wake.current){wake.current.visible=s.speed>0;wake.current.scale.z=.7+s.speed*.6+Math.sin(clock.current*2)*.05}});return <group ref={ref}><Ship kind={index}/><group ref={wake} position={[0,-1.1,-vesselSpecs[index].length/2]}>{[-1,1].map(s=><mesh key={s} rotation={[-Math.PI/2,0,s*.2]} position={[s*4,0,-18]}><planeGeometry args={[2,38]}/><meshBasicMaterial color="#d9ede1" transparent opacity={.22} depthWrite={false}/></mesh>)}</group></group>}
function Walker({path,index,clock,animal=false}:{path:V3[];index:number;clock:Clock;animal?:boolean}){
 const root=useRef<THREE.Group>(null),l=useRef<THREE.Group>(null),r=useRef<THREE.Group>(null);
 useFrame(()=>{const t=clock.current+index*17,phase=t%110,moving=phase<95,at=along(path,moving?phase/95:1);if(root.current){root.current.position.set(...at.p);root.current.rotation.y=at.heading}const gait=moving?Math.sin(t*7)*.55:0;if(l.current)l.current.rotation.x=gait;if(r.current)r.current.rotation.x=-gait});
 return <group ref={root} scale={animal?1.3:1}>
  <Box p={[0,animal?.65:1.1,0]} s={animal?[.45,.55,1]:[.48,.65,.28]} c={animal?'#af9670':['#e6c288','#548b96','#cb8d73'][index%3]}/>
  <mesh position={[0,animal?1:1.7,animal?.45:0]}><sphereGeometry args={[animal?.22:.19,8,6]}/><meshStandardMaterial color={animal?'#b29d78':'#cfa77f'}/></mesh>
  <group ref={l} position={[-.14,.75,0]}><Box p={[0,-.35,animal?.35:0]} s={[.13,.7,.16]} c="#596e72"/>{animal&&<Box p={[0,-.35,-.35]} s={[.13,.7,.16]} c="#af9670"/>}</group><group ref={r} position={[.14,.75,0]}><Box p={[0,-.35,animal?.35:0]} s={[.13,.7,.16]} c="#596e72"/>{animal&&<Box p={[0,-.35,-.35]} s={[.13,.7,.16]} c="#af9670"/>}</group>
 </group>
}
function Car({index,clock,bus=false}:{index:number;clock:Clock;bus?:boolean}){
 const ref=useRef<THREE.Group>(null),wheels=useRef<(THREE.Group|null)[]>([]);const path=useMemo(()=>{
  return sampleRoad({id:'traffic',width:12,points:[[-336,20.6,-276],[336,20.6,-276],[336,20.6,230],[-336,20.6,230],[-336,20.6,-276]]});
 },[]);
 useFrame(()=>{wheels.current.forEach(w=>{if(w)w.rotation.x=clock.current*9});if(!ref.current)return;const duration=bus?400:140,t=(clock.current+index*(bus?0:17))%duration;const phase=t/(duration*.93);const at=bus?busState(clock.current,index):along(path,Math.min(phase,1));ref.current.position.set(at.p[0]+Math.cos(at.heading)*2,at.p[1]+(bus?.6:0),at.p[2]-Math.sin(at.heading)*2);ref.current.rotation.y=at.heading});
 return <group ref={ref}><Box p={[0,.75,0]} s={[bus?2.5:1.8,1.4,bus?10:4.4]} c={bus?'#8bbf9d':['#f2e4c4','#80a5af','#c48b73','#dce3d1'][index%4]}/><Box p={[0,1.7,0]} s={[bus?2.4:1.6,bus?1.1:.7,bus?9.6:2.6]} c="#47717d"/>{[-1,1].flatMap((s,si)=>[-1,1].map((a,ai)=><group key={`${s}:${a}`} ref={el=>{wheels.current[si*2+ai]=el}} position={[s*(bus?1.15:.83),.4,a*(bus?3.3:1.4)]}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.4,.4,.3,10]}/><meshStandardMaterial color="#374643"/></mesh><Box p={[s*.16,0,0]} s={[.02,.55,.08]} c="#bbc2b5"/></group>))}</group>
}
function Birds({clock,low}:{clock:Clock;low:boolean}){
 const roots=useRef<(THREE.Group|null)[]>([]),wings=useRef<(THREE.Group|null)[]>([]);
 useFrame(()=>{roots.current.forEach((r,i)=>{if(r){const t=clock.current*.06+i*.35;r.position.set(80+Math.cos(t)*170,65+Math.sin(t*.7)*12,-100+Math.sin(t)*100);r.rotation.y=-t;}});wings.current.forEach((w,i)=>{if(w)w.rotation.z=Math.sin(clock.current*4+i)*.35*(i%2?1:-1)});});
 return <>{Array.from({length:low?3:8},(_,i)=><group key={i} ref={r=>{roots.current[i]=r}}><Box p={[0,0,0]} s={[.35,.25,1.2]} c="#e5e3cc"/>{[-1,1].map((s,j)=><group key={s} ref={r=>{wings.current[i*2+j]=r}}><Box p={[s*.8,0,0]} s={[1.7,.08,.45]} c="#d2dacb" r={s*.2}/></group>)}</group>)}</>;
}
export function CityLife({clock,region,low}:{clock:Clock;region:string;low:boolean}){
 const paths=useMemo(()=>Array.from({length:24},(_,i)=>{const x=i%2?-170:170,z=i%4<2?-120:120;return [[x-120,20.4,z-100],[x+120,20.4,z-100],[x+120,20.4,z+100],[x-120,20.4,z+100],[x-120,20.4,z-100]] as V3[]}),[]);
 return <>
 <Birds clock={clock} low={low}/>{[0,1].map(i=><Car key={'bus'+i} index={i} bus clock={clock}/>)}
 {region==='airport'&&<><Plane clock={clock} index={0}/><Plane clock={clock} index={1}/><group position={[2240,16.5,255]} rotation={[0,Math.PI/2,0]}><Aircraft scale={.55}/></group></>}
 {(region==='arrival'||region==='works')&&vesselSpecs.map((_,i)=>(region==='works' ? i>2:i<3)&&<Vessel key={i} index={i} clock={clock}/>)}
 {region==='works'&&<group position={[-940,2.5,265]}><Ship kind={4}/></group>}
 {(region==='town'||region==='archive'||region==='station')&&<>{paths.slice(0,low?8:24).map((p,i)=><Walker key={i} path={p} index={i} clock={clock}/>)}{Array.from({length:low?3:8},(_,i)=><Car key={i} index={i} clock={clock}/>)}{Array.from({length:low?2:6},(_,i)=>{const x=-440-i*25,z=-500;const h=terrainHeight(x,z);return <Walker key={'animal'+i} animal index={i} clock={clock} path={[[x,h,z],[x-20,h,z-10],[x-30,h,z+10],[x,h,z]]}/>})}</>}
 </>;
}
