"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html,OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {places,type PlaceId} from '@/lib/world/content';
import {sites,terrainHeight,weatherAt,type Weather} from '@/lib/world/city-plan';
import type {Region} from '@/lib/world/city-assets';
import {CityTerrain,CityRegion,RoadsAndRivers,regionCentre} from './CityTerrain';
import {aircraftState,vesselState} from '@/lib/world/city-life';
import {CityLife,type Clock} from './CityLife';
import {CitadelInterior,Underwater} from './CityInteriors';
import {CoastalWater} from './CoastalWater';
import {SceneFinish} from './SceneFinish';
import {Crane,Optical} from './WorldDevices';
export type CameraSnapshot={version:2;position:[number,number,number];target:[number,number,number];zoom:number;view:string};
export type CameraAction={id:number;type:'home'|'overview'|'zoom-in'|'zoom-out'|'rotate'|'tilt-up'|'tilt-down'|'pan-left'|'pan-right'|'pan-up'|'pan-down'|'focus'|'restore';snapshot?:CameraSnapshot;place?:PlaceId;instant?:boolean;detail?:boolean};
interface Props{
 dusk:boolean;low:boolean;reduced:boolean;paused:boolean;selected?:PlaceId;hovered?:PlaceId;scene?:string;
 command:CameraAction;crane:number;prism:number;onPlace:(p:PlaceId)=>void;onHover:(p?:PlaceId)=>void;onProject:(slug:string)=>void;
 onReady:()=>void;onFailure:()=>void;onCamera:(s:CameraSnapshot)=>void;
 onTraffic?:(state:string)=>void;pace?:number;weather?:Weather;level?:'b1'|'b2';underwater?:boolean;onExplore?:()=>void;onRegionStatus?:(id:string,status:string)=>void;onMetrics?:(metrics:{fps:number;calls:number;triangles:number})=>void;
}
function CameraRig({p}:{p:Props}){
 const controls=useRef<Controls>(null);const {camera,size,invalidate}=useThree();
 const travel=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
 const beforeMode=useRef<CameraSnapshot|null>(null),previousMode=useRef('surface');
 const onCamera=p.onCamera;
 const mode=p.underwater?'underwater':p.level??'surface';
 useFrame(({camera:activeCamera})=>{if(activeCamera instanceof THREE.PerspectiveCamera){const near=mode==='surface'?8:.25,far=mode==='underwater'?600:24000;if(activeCamera.near!==near||activeCamera.far!==far){activeCamera.near=near;activeCamera.far=far;activeCamera.updateProjectionMatrix()}}});
 const snapshot=useCallback(()=>{const c=controls.current;if(c)onCamera({version:2,position:camera.position.toArray(),target:c.target.toArray(),zoom:1,view:mode})},[camera,onCamera,mode]);
 useEffect(()=>{
  const c=controls.current;if(!c)return;const target=c.target.clone(),position=camera.position.clone();
  const changed=previousMode.current!==mode;
  if(changed&&previousMode.current==='surface'&&!p.command.instant)beforeMode.current={version:2,position:position.toArray(),target:target.toArray(),zoom:1,view:'surface'};
  if(changed&&p.command.instant&&p.command.type==='focus')beforeMode.current=null;
  if(p.command.type==='restore'&&p.command.snapshot?.version===2&&p.command.snapshot.view===mode){target.fromArray(p.command.snapshot.target);position.fromArray(p.command.snapshot.position)}
  else if(mode==='underwater'&&(changed||p.command.type==='focus')){target.fromArray(p.scene==='observatory'?[1610,-14,1940]:[1590,-10,1850]);position.copy(target).add(new THREE.Vector3(20,30,27))}
  else if(changed&&mode!=='surface'){target.set(80,mode==='b1'?91:85,-680);position.set(125,133,-580)}
  else if(changed&&beforeMode.current&&!(p.command.type==='focus'&&p.command.place!== (previousMode.current==='underwater'?'dive':'commons'))&&p.command.type!=='home'&&p.command.type!=='overview'){target.fromArray(beforeMode.current.target);position.fromArray(beforeMode.current.position)}
  else {
   const cmd=p.command,offset=position.clone().sub(target);
   if(cmd.type==='restore'&&cmd.snapshot?.version===2){target.fromArray(cmd.snapshot.target);position.fromArray(cmd.snapshot.position)}
   else if(cmd.type==='home'){target.set(0,22,-210);position.copy(target).add(new THREE.Vector3(120,690,1030).multiplyScalar(size.width<700?1.22:1));}
   else if(cmd.type==='overview'){target.set(0,10,0);position.set(800,5200,6000);}
   else if(cmd.type==='focus'&&cmd.place){
    target.set(...sites[cmd.place]);let distance=cmd.place==='airport'?570:cmd.place==='works'?580:cmd.place==='arrival'?520:cmd.place==='commons'?210:cmd.place==='dive'?190:260;
    if(cmd.place==='dive'){target.z+=45;distance=310;}if(cmd.place==='arrival'){target.z+=135;distance=620;}if(cmd.place==='works'){target.z+=65;distance=680;}
    if(cmd.detail)distance*=.75;if(size.width<700)distance*=1.2;position.copy(target).add(new THREE.Vector3(.12,.64,.77).multiplyScalar(distance));
   }else if(cmd.type==='zoom-in'||cmd.type==='zoom-out')position.copy(target).add(offset.multiplyScalar(cmd.type==='zoom-in'?.77:1.3));
   else if(cmd.type==='rotate'){offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);position.copy(target).add(offset)}
   else if(cmd.type==='tilt-up'||cmd.type==='tilt-down'){const sph=new THREE.Spherical().setFromVector3(offset);sph.phi=THREE.MathUtils.clamp(sph.phi+(cmd.type==='tilt-up'?-.15:.15),.35,1.22);position.copy(target).add(new THREE.Vector3().setFromSpherical(sph))}
   else if(cmd.type.startsWith('pan-')){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);const forward=new THREE.Vector3(-right.z,0,right.x);const dir=cmd.type==='pan-left'?right.negate():cmd.type==='pan-right'?right:cmd.type==='pan-up'?forward.negate():forward;dir.multiplyScalar(mode==='surface'?45:8);target.add(dir);position.add(dir)}
  }
  previousMode.current=mode;
  if(p.reduced||p.command.instant){c.target.copy(target);camera.position.copy(position);c.update();snapshot()}else travel.current={target,position};invalidate();
 },[p.command,p.reduced,p.scene,mode,camera,invalidate,size.width,snapshot]);
 useFrame((_,dt)=>{
  const c=controls.current;if(!c||p.paused)return;
  if(travel.current){const t=travel.current,f=1-Math.exp(-Math.min(dt,.06)*7);c.target.lerp(t.target,f);camera.position.lerp(t.position,f);c.update();if(camera.position.distanceTo(t.position)<.1){travel.current=null;snapshot()}else invalidate()}
 });
 return <OrbitControls ref={controls} makeDefault enabled={!p.paused} enableDamping={!p.reduced} dampingFactor={.09}
 minDistance={mode==='surface'?55:mode==='underwater'?8:18} maxDistance={mode==='surface'?10500:220} minPolarAngle={.35} maxPolarAngle={1.22}
 screenSpacePanning={false} mouseButtons={{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}} touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}
 onStart={()=>{travel.current=null;p.onExplore?.()}} onEnd={snapshot} onChange={()=>{
 const c=controls.current;if(!c)return;const old=c.target.clone();
 if(mode==='underwater'){c.target.x=THREE.MathUtils.clamp(c.target.x,1450,1680);c.target.z=THREE.MathUtils.clamp(c.target.z,1720,2040);c.target.y=THREE.MathUtils.clamp(c.target.y,-18,-5);camera.position.setY(Math.min(45,camera.position.y));}
 else if(mode!=='surface'){c.target.x=THREE.MathUtils.clamp(c.target.x,35,125);c.target.z=THREE.MathUtils.clamp(c.target.z,-720,-640)}
 else{c.target.x=THREE.MathUtils.clamp(c.target.x,-3200,3100);c.target.z=THREE.MathUtils.clamp(c.target.z,-2250,2300);camera.position.setY(Math.max(camera.position.y,terrainHeight(camera.position.x,camera.position.z)+8))}
 camera.position.add(c.target.clone().sub(old));invalidate();
 }}/>
}
function Atmosphere({clock,p}:{clock:Clock;p:Props}){
 const sun=useRef<THREE.DirectionalLight>(null),ambient=useRef<THREE.HemisphereLight>(null),cloud=useRef<THREE.Group>(null),rain=useRef<THREE.LineSegments>(null);const {controls}=useThree();const skyColor=useRef<THREE.Color>(null),fog=useRef<THREE.Fog>(null);
 const dropGeometry=useMemo(()=>{const g=new THREE.BufferGeometry(),v=[];for(let i=0;i<700;i++)v.push(Math.sin(i*14.13)*450,Math.sin(i*73.9)*200+240,Math.cos(i*42.7)*450,Math.sin(i*14.13)*450-1,Math.sin(i*73.9)*200+246,Math.cos(i*42.7)*450);g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return g},[]);
 useFrame(()=>{
  const w=weatherAt(clock.current,p.weather??'auto'),target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();
  if(sun.current){sun.current.intensity=p.underwater?.9:p.dusk?.65:2.2-w*1.1;sun.current.position.set(target.x-500,target.y+850,target.z+400);sun.current.target.position.copy(target);sun.current.target.updateMatrixWorld();}
  if(ambient.current)ambient.current.intensity=p.underwater?.9:p.dusk?.7:1.1;
  const color=p.underwater?'#246e80':p.dusk?'#465c7b':w>.8?'#9cbdc1':'#cbdedb';skyColor.current?.set(color);if(fog.current){fog.current.color.set(color);fog.current.near=p.underwater?8:1300;fog.current.far=p.underwater?135:p.dusk?6800:9500;}
  if(cloud.current){cloud.current.visible=!p.underwater;cloud.current.position.set(Math.sin(clock.current*.006)*250,0,0)}
  if(rain.current){rain.current.visible=!p.underwater&&!p.level&&!p.low&&w>.8;rain.current.position.set(target.x,-(clock.current*65%170),target.z)}
 });
 return <>
 <color ref={skyColor} attach="background" args={['#cbdedb']}/><fog ref={fog} attach="fog" args={['#cbdedb',1300,9500]}/>
 <hemisphereLight ref={ambient} args={['#dbe8ea','#869767',1.3]}/>
 <directionalLight ref={sun} position={[-500,850,400]} intensity={2.2} castShadow={!p.low} shadow-mapSize={[2048,2048]} shadow-camera-left={-650} shadow-camera-right={650} shadow-camera-top={650} shadow-camera-bottom={-650} shadow-camera-far={2200} shadow-normalBias={.25} shadow-bias={-.00015}/>
 <group ref={cloud}>{Array.from({length:p.low?3:8},(_,i)=><group key={i} position={[Math.sin(i*12)*1800,350+i%3*70,Math.cos(i*14)*1500]}>{[0,1,2].map(j=><mesh key={j} position={[j*65,Math.sin(j)*12,0]} scale={[110,22+j*5,65]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#f1f2e8" transparent opacity={.48} depthWrite={false}/></mesh>)}</group>)}</group>
 <lineSegments ref={rain} geometry={dropGeometry}><lineBasicMaterial color="#d7e9e7" transparent opacity={.2} depthWrite={false}/></lineSegments>
 </>;
}
function Landmarks({p}:{p:Props}){
 const [hover,setHover]=useState<PlaceId>();const select=(id:PlaceId,e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<6&&!p.paused)p.onPlace(id)};
 return <>{places.map(place=><group key={place.id} position={place.position}>
 <mesh position={[0,10,0]} visible={false} onClick={e=>select(place.id,e)} onPointerOver={e=>{e.stopPropagation();setHover(place.id);p.onHover(place.id);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(undefined);p.onHover(undefined);document.body.style.cursor=''}}>
 <boxGeometry args={place.id==='commons'?[104,24,104]:place.id==='airport'?[140,32,220]:[80,24,70]}/><meshBasicMaterial/>
 </mesh>
 {(hover===place.id||p.hovered===place.id)&&<Html center position={[0,35,0]} zIndexRange={[15,1]}><button className="place-marker" tabIndex={-1} onClick={()=>p.onPlace(place.id)}>{place.name} ↗</button></Html>}
 </group>)}</>;
}
function ContextListener({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const loss=(e:Event)=>{e.preventDefault();onFailure()};gl.domElement.addEventListener('webglcontextlost',loss);return()=>gl.domElement.removeEventListener('webglcontextlost',loss)},[gl,onFailure]);return null}
function World({p}:{p:Props}){
 const clock=useRef(0),trafficTick=useRef(0),lastTraffic=useRef('');const [wide,setWide]=useState(false);const [near,setNear]=useState<Region[]>(['town','commons','archive','station','nature']);const [region,setRegion]=useState('town');const elapsed=useRef(1),last=useRef('');const {controls}=useThree();
 const onReady=p.onReady,onRegionStatus=p.onRegionStatus;
 useEffect(()=>{if(p.underwater)onReady()},[p.underwater,onReady]);
 const status=useCallback((id:string,state:string)=>{onRegionStatus?.(id,state);if(state==='ready')onReady()},[onReady,onRegionStatus]);
 useFrame(({camera},dt)=>{
  if(!p.paused&&!p.reduced&&!p.low)clock.current+=Math.min(dt,.1)*(p.pace??1);
  trafficTick.current+=dt;if(trafficTick.current>.25){trafficTick.current=0;const state=p.selected==='airport'?[0,1].map(i=>`Flight ${i+1}: ${aircraftState(clock.current,i).phase}`).join(' · '):p.selected==='arrival'?[0,1,2].map(i=>`${i===0?'Cruise':'Ferry '+i}: ${vesselState(clock.current,i).phase}`).join(' · '):p.selected==='works'?[3,4].map(i=>`Supply ${i-2}: ${vesselState(clock.current,i).phase}`).join(' · '):'';if(state!==lastTraffic.current){lastTraffic.current=state;p.onTraffic?.(state)}}
  elapsed.current+=dt;if(elapsed.current<.4)return;elapsed.current=0;
  const target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();
  const overview=camera.position.distanceTo(target)>2400;if(overview!==wide)setWide(overview);
  let closest:Region='town',distance=Infinity;const visible:Region[]=['nature'];
  for(const id of ['town','commons','archive','station','airport','works','arrival','dive'] as Region[]){const c=regionCentre(id),d=Math.hypot(target.x-c[0],target.z-c[2]);if(d<distance){closest=id;distance=d}if(overview||d<1100||id===p.selected)visible.push(id)}
  if(region!==closest)setRegion(closest);const key=visible.join();if(key!==last.current){last.current=key;setNear(visible)}
 });
 return <>
 <CameraRig p={p}/><ContextListener onFailure={p.onFailure}/><Atmosphere p={p} clock={clock}/>
 {p.underwater?<Underwater clock={clock} low={p.low}/>:<>
 <CityTerrain level={p.level??'exterior'} low={p.low} onFailure={p.onFailure}/><RoadsAndRivers/>
 <CoastalWater timeRef={clock} dusk={p.dusk} animate={!p.paused&&!p.reduced&&!p.low}/>
 {near.map(id=>id==='commons'&&p.level?null:<CityRegion key={id} detail={!wide||id==='commons'||id==='nature'} clock={clock} id={id} dusk={p.dusk} onStatus={status}/>)}
 {p.level&&<CitadelInterior level={p.level}/>}
 <CityLife clock={clock} region={p.selected==='atelier'?'town':p.selected??region} low={p.low}/>
 {!p.level&&<Landmarks p={p}/>}
 {p.selected==='works'&&<group position={[-2020,9,1400]} scale={2}><group position={[-73,-4,-30]}><Crane step={p.crane}/></group></group>}
 {p.selected==='atelier'&&<group position={[225,20,170]} scale={3}><group position={[40,-5,-46]}><Optical value={p.prism}/></group></group>}
 </>}
 <SceneFinish low={p.low} degraded={false} paused={p.paused||p.reduced||p.low} onMetrics={p.onMetrics}/>
 </>;
}
export default function IslandScene(p:Props){return <Canvas camera={{position:[130,682,720],fov:38,near:8,far:24000}} dpr={p.low?1:[1,1.5]} shadows={p.low?false:{type:THREE.PCFShadowMap}} frameloop={p.paused||p.reduced||p.low?'demand':'always'} gl={{antialias:true,powerPreference:'high-performance'}} onPointerMissed={()=>p.onExplore?.()}><World p={p}/></Canvas>}
