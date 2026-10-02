"use client";
import {useEffect,useMemo,useRef,useState,useCallback,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {busState,aircraftState,vesselSpecs,vesselState,along} from '@/lib/world/city-life';
import {terrainHeight,sampleRoad,type V3} from '@/lib/world/city-plan';
import {makeAircraft,makeCarBody,makeShipDeck} from '@/lib/world/transport-geometry';
import {TransportModel} from './TransportModel';
import {LandmarkAsset} from './LandmarkAsset';
export type Clock=MutableRefObject<number>;
function Box({p,s,c,r=0}:{p:V3;s:V3;c:string;r?:number}){return <mesh position={p} rotation={[0,r,0]} castShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.65}/></mesh>}
export function Aircraft({scale=1}:{scale?:number}){
 const batches=useMemo(()=>makeAircraft(),[]);
 return <group scale={scale}><TransportModel batches={batches}/></group>;
}

function Plane({index,clock}:{index:number;clock:Clock}){
 const ref=useRef<THREE.Group>(null);useFrame(()=>{if(!ref.current)return;const s=aircraftState(clock.current,index);ref.current.position.set(...s.p);ref.current.rotation.y=s.heading;ref.current.visible=s.visible;ref.current.rotation.x=s.phase==='Climb'?-.08:0});
 return <group ref={ref}><Aircraft/></group>
}
export function Ship({kind=0,onStatus,statusId}:{kind?:number;onStatus?:(id:string,state:string)=>void;statusId?:string}){
 const s=vesselSpecs[kind],l=s.length,w=s.beam;
 const batches=useMemo(()=>makeShipDeck(kind,l,w),[kind,l,w]);
 return <group>
  <group scale={[w,2.6,l]} rotation={[0,Math.PI,0]}><LandmarkAsset name="ship-hull" onStatus={onStatus} statusId={statusId}/></group>
  <TransportModel batches={batches} accent={kind===0?'#c18759':'#608e8d'}/>
 </group>;
}

function Vessel({index,clock,onStatus}:{index:number;clock:Clock;onStatus:(id:string,state:string)=>void}){const ref=useRef<THREE.Group>(null),wake=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(!ref.current)return;const s=vesselState(clock.current,index);ref.current.position.set(...s.p);const delta=THREE.MathUtils.euclideanModulo(s.heading-ref.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;ref.current.rotation.y+=delta*Math.min(1,dt*2);ref.current.rotation.z=Math.sin(clock.current*.7+index)*.006;if(wake.current){wake.current.visible=s.speed>0;wake.current.scale.z=.7+s.speed*.6+Math.sin(clock.current*2)*.05}});return <group ref={ref}><Ship kind={index} onStatus={onStatus} statusId={`ship-${index}`}/><group ref={wake} position={[0,-1.1,-vesselSpecs[index].length/2]}>{[-1,1].map(s=><mesh key={s} rotation={[-Math.PI/2,0,s*.2]} position={[s*4,0,-18]}><planeGeometry args={[2,38]}/><meshBasicMaterial color="#d9ede1" transparent opacity={.22} depthWrite={false}/></mesh>)}</group></group>}
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
 const batches=useMemo(()=>makeCarBody(bus),[bus]);
 return <group ref={ref}>
  <TransportModel batches={batches} paint={bus?'#8bbf9d':['#f2e4c4','#80a5af','#c48b73','#dce3d1'][index%4]}/>
  {[-1,1].flatMap((s,si)=>[-1,1].map((a,ai)=><group key={`${s}:${a}`} ref={el=>{wheels.current[si*2+ai]=el}} position={[s*(bus?1.15:.83),.4,a*(bus?3.3:1.4)]}>
   <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.4,.4,.3,16]}/><meshStandardMaterial color="#263033" roughness={.92}/></mesh>
   <mesh position={[s*.16,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.25,.25,.025,12]}/><meshStandardMaterial color="#adb8b9" metalness={.8} roughness={.28}/></mesh>
   <Box p={[s*.18,0,0]} s={[.02,.46,.065]} c="#667779"/>
  </group>))}
 </group>;
}

function Birds({clock,low}:{clock:Clock;low:boolean}){
 const roots=useRef<(THREE.Group|null)[]>([]),wings=useRef<(THREE.Group|null)[]>([]);
 useFrame(()=>{roots.current.forEach((r,i)=>{if(r){const t=clock.current*.06+i*.35;r.position.set(80+Math.cos(t)*170,65+Math.sin(t*.7)*12,-100+Math.sin(t)*100);r.rotation.y=-t;}});wings.current.forEach((w,i)=>{if(w)w.rotation.z=Math.sin(clock.current*4+i)*.35*(i%2?1:-1)});});
 return <>{Array.from({length:low?3:8},(_,i)=><group key={i} ref={r=>{roots.current[i]=r}}><Box p={[0,0,0]} s={[.35,.25,1.2]} c="#e5e3cc"/>{[-1,1].map((s,j)=><group key={s} ref={r=>{wings.current[i*2+j]=r}}><Box p={[s*.8,0,0]} s={[1.7,.08,.45]} c="#d2dacb" r={s*.2}/></group>)}</group>)}</>;
}
export function CityLife({clock,region,low,onStatus}:{clock:Clock;region:string;low:boolean;onStatus:(id:string,state:string)=>void}){
 const [states,setStates]=useState<Record<string,string>>({});
 const status=useCallback((id:string,state:string)=>setStates(old=>old[id]===state?old:{...old,[id]:state}),[]);
 useEffect(()=>{const needed=region==='arrival'?['ship-0','ship-1','ship-2']:region==='works'?['ship-3','ship-4','drydock']:[];onStatus('life',needed.some(id=>states[id]==='error')?'error':needed.every(id=>states[id]==='ready')?'ready':'loading')},[region,states,onStatus]);
 const paths=useMemo(()=>Array.from({length:24},(_,i)=>{const x=i%2?-170:170,z=i%4<2?-120:120;return [[x-120,20.4,z-100],[x+120,20.4,z-100],[x+120,20.4,z+100],[x-120,20.4,z+100],[x-120,20.4,z-100]] as V3[]}),[]);
 return <>
 <Birds clock={clock} low={low}/>{[0,1].map(i=><Car key={'bus'+i} index={i} bus clock={clock}/>)}
 {region==='airport'&&<><Plane clock={clock} index={0}/><Plane clock={clock} index={1}/><group position={[2240,16.5,255]} rotation={[0,Math.PI/2,0]}><Aircraft scale={.55}/></group></>}
 {(region==='arrival'||region==='works')&&vesselSpecs.map((_,i)=>(region==='works' ? i>2:i<3)&&<Vessel key={i} index={i} clock={clock} onStatus={status}/>)}
 {region==='works'&&<group position={[-940,2.5,265]}><Ship kind={4} onStatus={status} statusId="drydock"/></group>}
 {(region==='town'||region==='archive'||region==='station')&&<>{paths.slice(0,low?8:24).map((p,i)=><Walker key={i} path={p} index={i} clock={clock}/>)}{Array.from({length:low?3:8},(_,i)=><Car key={i} index={i} clock={clock}/>)}{Array.from({length:low?2:6},(_,i)=>{const x=-440-i*25,z=-500;const h=terrainHeight(x,z);return <Walker key={'animal'+i} animal index={i} clock={clock} path={[[x,h,z],[x-20,h,z-10],[x-30,h,z+10],[x,h,z]]}/>})}</>}
 </>;
}
