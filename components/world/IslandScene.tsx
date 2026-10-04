"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {places,type PlaceId} from '@/lib/world/content';
import {type Weather} from '@/lib/world/city-plan';
import type {Region} from '@/lib/world/city-assets';
import {CityTerrain,CityRegion,RoadsAndRivers,regionCentre} from './CityTerrain';
import {aircraftState,vesselState} from '@/lib/world/city-life';
import {CityLife} from './CityLife';
import {CitadelInterior,Underwater} from './CityInteriors';
import {CoastalWater} from './CoastalWater';
import {SceneFinish} from './SceneFinish';
import {CityReflections} from './CityReflections';
import {CameraRig} from './CameraRig';
import {CoastalEnvironment} from './CoastalEnvironment';
import {LandmarkAsset} from './LandmarkAsset';
import {CoastalSite} from './CoastalSite';
import {ResearchFacility} from './ResearchFacility';
import {relocation} from '@/lib/world/city-plan';
import {MountainPlaces} from './MountainPlaces';
import {CityNight} from './CityNight';
import {BuildingFocus} from './BuildingFocus';
import {ScenePreparation} from './ScenePreparation';
import {TheCube} from './TheCube';
import {surfaceResources} from '@/lib/world/scene-readiness';
import {Crane,Optical} from './WorldDevices';
export type CameraSnapshot={version:3;position:[number,number,number];target:[number,number,number];zoom:number;view:string};
export type CameraAction={id:number;type:'mountain'|'building'|'home'|'overview'|'zoom-in'|'zoom-out'|'rotate'|'tilt-up'|'tilt-down'|'pan-left'|'pan-right'|'pan-up'|'pan-down'|'focus'|'restore';building?:string;snapshot?:CameraSnapshot;place?:PlaceId;instant?:boolean;detail?:boolean};
export interface SceneProps{
 focusedBuilding?:string;onFocusBuilding:(id?:string)=>void;
 rotateMode:boolean;onBuilding:(id:string)=>void;
 dusk:boolean;low:boolean;reduced:boolean;paused:boolean;selected?:PlaceId;hovered?:PlaceId;scene?:string;
 command:CameraAction;crane:number;prism:number;onPlace:(p:PlaceId)=>void;onHover:(p?:PlaceId)=>void;onProject:(slug:string)=>void;
 onReady:()=>void;onFailure:()=>void;onCamera:(s:CameraSnapshot)=>void;
 onTraffic?:(state:string)=>void;pace?:number;weather?:Weather;level?:'b1'|'b2';underwater?:boolean;onExplore?:()=>void;onRegionStatus?:(id:string,status:string)=>void;onMetrics?:(metrics:{fps:number;calls:number;triangles:number})=>void;
}
function Landmarks({p,dragged}:{p:SceneProps;dragged:React.RefObject<boolean>}){
 const [hover,setHover]=useState<PlaceId>();const select=(id:PlaceId,e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<6&&!dragged.current&&!p.paused)p.onPlace(id)};
 return <><BuildingFocus p={p} dragged={dragged}/>{places.filter(place=>['commons','arrival','airport','works','dive'].includes(place.id)).map(place=><group key={place.id} position={place.position}>
 <mesh position={[0,10,0]} visible={false} onClick={e=>select(place.id,e)} onPointerOver={e=>{e.stopPropagation();setHover(place.id);p.onHover(place.id);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(undefined);p.onHover(undefined);document.body.style.cursor=''}}>
 <boxGeometry args={place.id==='commons'?[104,24,104]:place.id==='airport'?[140,32,220]:[80,24,70]}/><meshBasicMaterial/>
 </mesh>
 {(hover===place.id||p.hovered===place.id)&&<Html center position={[0,35,0]} zIndexRange={[15,1]}><button className="place-marker" tabIndex={-1} onClick={()=>p.onPlace(place.id)}>{place.name} ↗</button></Html>}
 </group>)}</>;
}
function ContextListener({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const loss=(e:Event)=>{e.preventDefault();onFailure()};gl.domElement.addEventListener('webglcontextlost',loss);return()=>gl.domElement.removeEventListener('webglcontextlost',loss)},[gl,onFailure]);return null}
function World({p}:{p:SceneProps}){
 const dragged=useRef(false);const pointer=useRef<{x:number;y:number}|null>(null);const {gl}=useThree();
 useEffect(()=>{const el=gl.domElement;const down=(e:PointerEvent)=>{dragged.current=false;pointer.current={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)};const move=(e:PointerEvent)=>{if(pointer.current&&Math.hypot(e.clientX-pointer.current.x,e.clientY-pointer.current.y)>6)dragged.current=true};const up=()=>{pointer.current=null};const cancel=()=>{dragged.current=true;up()};el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',cancel);return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel);document.body.style.cursor=''}},[gl]);
 const clock=useRef(0),trafficTick=useRef(0),lastTraffic=useRef('');const near:Region[]=['town','commons','archive','station','nature','airport','arrival','works','dive'];const [region,setRegion]=useState('town');const elapsed=useRef(1);const {controls}=useThree();
 const onReady=p.onReady,onRegionStatus=p.onRegionStatus;
 const [states,setStates]=useState<Record<string,string>>({});
 const status=useCallback((id:string,state:string)=>{onRegionStatus?.(id,state);setStates(old=>old[id]===state?old:{...old,[id]:state})},[onRegionStatus]);
 useFrame((_,dt)=>{
  if(!p.paused&&!p.reduced&&!p.low)clock.current+=Math.min(dt,.1)*(p.pace??1);
  trafficTick.current+=dt;if(p.reduced||p.low||trafficTick.current>.25){trafficTick.current=0;const state=p.selected==='airport'?[0,1].map(i=>`Flight ${i+1}: ${aircraftState(clock.current,i).phase}`).join(' · '):p.selected==='arrival'?[0,1,2].map(i=>`${i===0?'Cruise':'Ferry '+i}: ${vesselState(clock.current,i).phase}`).join(' · '):p.selected==='works'?[3,4].map(i=>`Supply ${i-2}: ${vesselState(clock.current,i).phase}`).join(' · '):'';if(state!==lastTraffic.current){lastTraffic.current=state;p.onTraffic?.(state)}}
  elapsed.current+=dt;if(elapsed.current<.4)return;elapsed.current=0;
  const target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();
  let closest:Region='town',distance=Infinity;
  for(const id of ['town','commons','archive','station','airport','works','arrival','dive'] as Region[]){const c=regionCentre(id),d=Math.hypot(target.x-c[0],target.z-c[2]);if(d<distance){closest=id;distance=d}}
  if(region!==closest)setRegion(closest);
 });
 return <>
 <CameraRig p={p}/><CityReflections dusk={p.dusk}/><ContextListener onFailure={p.onFailure}/><CoastalEnvironment clock={clock} dusk={p.dusk} low={p.low} underwater={p.underwater} trench={p.underwater&&p.scene==='cube'} sphere={p.underwater&&p.scene==='sphere'} weather={p.weather??'sunny'}/>
 {!p.level&&<TheCube dusk={p.dusk} low={p.low} underwater={p.underwater&&p.scene==='cube'}/>}
 {p.underwater?<><group position={relocation.dive}><Underwater clock={clock} low={p.low} onStatus={status}/></group><ResearchFacility low={p.low} dusk={p.dusk} onStatus={status} underwater clock={clock}/></>:<>
 <MountainPlaces dusk={p.dusk}/><CityNight dusk={p.dusk}/><CityTerrain clock={clock} weather={p.weather} level={p.level??'exterior'} low={p.low} onStatus={status}/><RoadsAndRivers level={p.level}/><CoastalSite dusk={p.dusk}/>
 <CoastalWater onStatus={status} timeRef={clock} dusk={p.dusk} weather={p.weather} animate={!p.paused&&!p.reduced&&!p.low}/>
 {near.map(id=>id==='commons'&&p.level?null:<CityRegion key={id} detail={id==='nature'?!p.low:true} clock={clock} weather={p.weather} id={id} dusk={p.dusk} onStatus={status}/>)}
 {p.level&&<group position={relocation.commons}><CitadelInterior level={p.level}/></group>}
 <CityLife onStatus={status} clock={clock} region={p.selected==='atelier'?'town':p.selected??region} low={p.low}/>
 {!p.level&&<><ResearchFacility low={p.low} dusk={p.dusk} onStatus={status}/><group position={[80,76,-480]}><LandmarkAsset name="ring" animate={!p.paused&&!p.reduced&&(p.selected==='commons'||region==='commons')} low={p.low} dusk={p.dusk} onStatus={status}/></group><Landmarks p={p} dragged={dragged}/></>}
 {p.selected==='works'&&<group position={[-770,9,300]} scale={2}><group position={[-73,-4,-30]}><Crane step={p.crane}/></group></group>}
 {p.selected==='atelier'&&<group position={[145,20,150]} scale={3}><group position={[40,-5,-46]}><Optical value={p.prism}/></group></group>}
 </>}
 <ScenePreparation states={states} required={p.underwater?['habitat','observatory']:p.level?surfaceResources.filter(id=>id!=='commons'||!p.level).filter(id=>id!=='ring'&&id!=='observatory'):surfaceResources} onReady={onReady} onStage={status}/>
 <SceneFinish prepared={states.gpu==='compiled'||states.gpu==='ready'} low={p.low} degraded={false} paused={p.paused||p.reduced||p.low} onMetrics={p.onMetrics}/>
 </>;
}
export default function IslandScene(p:SceneProps){return <Canvas style={{touchAction:"none"}} camera={{position:[740,638,1000],fov:42,near:1,far:24000}} dpr={p.low?1:[1,1.5]} shadows={p.low?false:{type:THREE.PCFShadowMap}} frameloop={p.paused||p.reduced||p.low?'demand':'always'} gl={{antialias:true,powerPreference:'high-performance'}} onPointerMissed={()=>{p.onFocusBuilding(undefined);p.onExplore?.()}}><World p={p}/></Canvas>}
