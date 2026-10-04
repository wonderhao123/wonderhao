"use client";
import {useCallback,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {sites,terrainHeight,mountainSites,cubeSite} from '@/lib/world/city-plan';
import {makeArchitecture} from '@/lib/world/city-architecture';
import spec from '@/lib/world/landmark-spec.json';
import {cityViews,projectBuildings} from '@/lib/world/city-buildings';
import type {SceneProps,CameraSnapshot} from './IslandScene';
type Props=SceneProps;
export function CameraRig({p}:{p:Props}){
 const controls=useRef<Controls>(null);const {camera,size,invalidate}=useThree();
 const settle=useRef({dirty:false,quiet:0});
 const resetting=useRef(false);
 const safePose=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
 // Reuse the authored building solids. Reject obstructed camera moves without
 // lifting a horizontal pan or requiring a separate physics engine.
 const obstacles=useMemo(()=>makeArchitecture().filter(b=>(b[0]===0||b[0]===4||b[0]===13)&&b[5]>=8&&b[6]>=6&&b[7]>=8).map(b=>({x:b[2],z:b[4],w:(Math.abs(Math.cos(b[8]))*b[5]+Math.abs(Math.sin(b[8]))*b[7])/2+3,d:(Math.abs(Math.sin(b[8]))*b[5]+Math.abs(Math.cos(b[8]))*b[7])/2+3,bottom:b[0]===4?b[3]:b[3]-b[6]/2,top:b[3]+b[6]*(b[0]===4?1:.5)+3})),[]);
 const travel=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
 const beforeMode=useRef<CameraSnapshot|null>(null),previousMode=useRef('surface');
 const onCamera=p.onCamera;
 const mode=p.underwater?'underwater':p.level??'surface';
 const scene=p.scene;
 const openWater=scene==='cube'||scene==='sphere';
 useEffect(()=>{if(p.paused)travel.current=null},[p.paused]);
 useFrame(({camera:activeCamera})=>{if(activeCamera instanceof THREE.PerspectiveCamera){const near=mode==='surface'?1:.25,far=mode==='underwater'?600:24000;if(activeCamera.near!==near||activeCamera.far!==far){activeCamera.near=near;activeCamera.far=far;activeCamera.updateProjectionMatrix()}}});
 const snapshot=useCallback(()=>{const c=controls.current;if(c)onCamera({version:3,position:camera.position.toArray(),target:c.target.toArray(),zoom:1,view:mode})},[camera,onCamera,mode]);
 const stopInertia=useCallback(()=>{const c=controls.current;if(!c)return;const position=camera.position.clone(),target=c.target.clone(),damping=c.enableDamping;resetting.current=true;c.enableDamping=false;c.update();camera.position.copy(position);c.target.copy(target);c.update();c.enableDamping=damping;resetting.current=false;settle.current.dirty=false;snapshot();invalidate()},[camera,invalidate,snapshot]);
 useEffect(()=>{stopInertia()},[p.rotateMode,p.paused,stopInertia]);
 useEffect(()=>{
  const c=controls.current;if(!c)return;stopInertia();const target=c.target.clone(),position=camera.position.clone();
  const changed=previousMode.current!==mode;
  if(changed&&previousMode.current==='surface'&&!p.command.instant)beforeMode.current={version:3,position:position.toArray(),target:target.toArray(),zoom:1,view:'surface'};
  if(changed&&p.command.instant&&p.command.type==='focus')beforeMode.current=null;
  if(p.command.type==='restore'&&p.command.snapshot?.version===3&&p.command.snapshot.view===mode){target.fromArray(p.command.snapshot.target);position.fromArray(p.command.snapshot.position)}
  else if(mode==='underwater'&&(changed||p.command.type==='focus'||p.command.type==='home')){if(scene==='cube'){target.fromArray(cubeSite.center);position.copy(target).add(new THREE.Vector3(-105,24,135).multiplyScalar(size.width<700?1.6:1));position.y=cubeSite.center[1]+(size.width<700?44:24);}else if(scene==='sphere'){target.fromArray(spec.observatory.center);target.y=-6;position.copy(target).add(new THREE.Vector3(88,10,108).multiplyScalar(size.width<700?1.9:1));position.y=-2;}else{target.fromArray(scene==='observatory'?[550,-14,560]:[530,-10,470]);position.copy(target).add(new THREE.Vector3(24,9,32))}}
  else if(mode!=='surface'&&(changed||p.command.type==='home')){target.set(80,mode==='b1'?71:65,-480);position.set(125,113,-380)}
  else if(changed&&beforeMode.current&&!(scene==='cube'&&p.command.type==='focus')&&!(p.command.type==='focus'&&p.command.place!== (previousMode.current==='underwater'?'dive':'commons'))&&p.command.type!=='home'&&p.command.type!=='overview'){target.fromArray(beforeMode.current.target);position.fromArray(beforeMode.current.position)}
  else {
   const cmd=p.command,offset=position.clone().sub(target);
   if(cmd.type==='restore'&&cmd.snapshot?.version===3){target.fromArray(cmd.snapshot.target);position.fromArray(cmd.snapshot.position)}
   else if(cmd.type==='home'){target.fromArray(cityViews.home.target);position.copy(target).add(new THREE.Vector3(...cityViews.home.offset).multiplyScalar(size.width<700?1.28:1));}
   else if(cmd.type==='overview'){target.fromArray(cityViews.overview.target);position.copy(target).add(new THREE.Vector3(...cityViews.overview.offset).multiplyScalar(size.width<700?1.2:1));}
   else if(cmd.type==='mountain'&&cmd.building){const site=mountainSites[cmd.building as keyof typeof mountainSites];if(site){target.fromArray(site.position);target.y+=cmd.building==='tower'?24:4;position.copy(target).add(new THREE.Vector3(100,65,120))}}
   else if(cmd.type==='building'&&cmd.building){const b=projectBuildings.find(v=>v.id===cmd.building);if(b){target.fromArray(b.position);position.copy(target).add(new THREE.Vector3(120,155,230))}}
   else if(cmd.type==='focus'&&cmd.place){
    if(scene==='cube'){target.set(cubeSite.center[0],0,cubeSite.center[2]);position.copy(target).add(new THREE.Vector3(-110,145,185).multiplyScalar(size.width<700?1.3:1));}
    else if(scene==='sphere'){target.fromArray(spec.observatory.center);position.copy(target).add(new THREE.Vector3(110,85,135).multiplyScalar(size.width<700?1.5:1));}
    else{
    target.set(...sites[cmd.place]);let distance=cmd.place==='airport'?1350:cmd.place==='works'?580:cmd.place==='arrival'?520:cmd.place==='commons'?210:cmd.place==='dive'?190:260;
    if(cmd.place==='dive'){target.set(730,7,350);distance=820;}if(cmd.place==='arrival'){target.x+=55;target.z+=135;distance=700;}if(cmd.place==='works'){target.z+=65;distance=680;}
    if(cmd.detail)distance*=.75;if(size.width<700)distance*=1.2;position.copy(target).add(new THREE.Vector3(.12,.64,.77).multiplyScalar(distance));
    }
   }else if(cmd.type==='zoom-in'||cmd.type==='zoom-out')position.copy(target).add(offset.setLength(THREE.MathUtils.clamp(offset.length()*(cmd.type==='zoom-in'?.77:1.3),mode==='surface'?160:18,mode==='surface'?3200:openWater?360:220)));
   else if(cmd.type==='rotate'){offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);position.copy(target).add(offset)}
   else if(cmd.type==='tilt-up'||cmd.type==='tilt-down'){const sph=new THREE.Spherical().setFromVector3(offset);sph.phi=THREE.MathUtils.clamp(sph.phi+(cmd.type==='tilt-up'?-.15:.15),scene==='sphere'?.12:.35,mode==='underwater'&&scene==='sphere'?2.5:1.22);position.copy(target).add(new THREE.Vector3().setFromSpherical(sph))}
   else if(cmd.type.startsWith('pan-')){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);const forward=new THREE.Vector3(-right.z,0,right.x);const dir=cmd.type==='pan-left'?right.negate():cmd.type==='pan-right'?right:cmd.type==='pan-up'?forward.negate():forward;dir.multiplyScalar(mode==='surface'?45:8);target.add(dir);position.add(dir)}
  }
  previousMode.current=mode;
  if(p.reduced||p.command.instant){c.target.copy(target);camera.position.copy(position);c.update();snapshot()}else travel.current={target,position};invalidate();
 },[p.command,p.reduced,scene,openWater,mode,camera,invalidate,size.width,snapshot,stopInertia]);
 useFrame((_,dt)=>{
  const c=controls.current;if(!c||p.paused)return;
  if(settle.current.dirty){settle.current.quiet+=dt;if(settle.current.quiet>.14){snapshot();settle.current.dirty=false}else invalidate()}
  if(travel.current){const t=travel.current,f=1-Math.exp(-Math.min(dt,.06)*7);c.target.lerp(t.target,f);camera.position.lerp(t.position,f);c.update();if(camera.position.distanceTo(t.position)<.1){travel.current=null;snapshot()}else invalidate()}
 });
 return <OrbitControls ref={controls} makeDefault enabled={!p.paused} enableDamping={!p.reduced} dampingFactor={.09}
 minDistance={mode==='surface'?(scene==='sphere'?55:160):mode==='underwater'?8:18} maxDistance={mode==='surface'?3200:openWater?360:220} minPolarAngle={scene==='sphere'?.12:.45} maxPolarAngle={mode==='surface'?1.7:scene==='sphere'?2.5:openWater?1.53:1.42} rotateSpeed={.55}
 screenSpacePanning={false} mouseButtons={{LEFT:p.rotateMode?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE}} touches={{ONE:p.rotateMode?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN}}
 onStart={()=>{travel.current=null;stopInertia();p.onExplore?.()}} onEnd={snapshot} onChange={()=>{
 if(resetting.current)return;
 settle.current={dirty:true,quiet:0};
 const c=controls.current;if(!c)return;const old=c.target.clone();
 if(mode==='underwater'){if(scene==='cube'){c.target.x=THREE.MathUtils.clamp(c.target.x,cubeSite.center[0]-65,cubeSite.center[0]+35);c.target.z=THREE.MathUtils.clamp(c.target.z,cubeSite.center[2]-100,cubeSite.center[2]+100);c.target.y=THREE.MathUtils.clamp(c.target.y,cubeSite.center[1]-8,cubeSite.center[1]+24)}else{c.target.x=THREE.MathUtils.clamp(c.target.x,390,620);c.target.z=THREE.MathUtils.clamp(c.target.z,340,660);c.target.y=THREE.MathUtils.clamp(c.target.y,-18,-5)}camera.position.setY(Math.min(-1.5,camera.position.y));}
 else if(mode!=='surface'){c.target.x=THREE.MathUtils.clamp(c.target.x,35,125);c.target.z=THREE.MathUtils.clamp(c.target.z,-520,-440)}
 else{c.target.x=THREE.MathUtils.clamp(c.target.x,-1100,2650);c.target.z=THREE.MathUtils.clamp(c.target.z,-1500,Math.max(1050,cubeSite.center[2]+cubeSite.extent[1]))}
 camera.position.add(c.target.clone().sub(old));invalidate();
 if(mode==='underwater'&&openWater){
  const pos=camera.position,half=cubeSite.size/2+3;
  const inside=cubeSite.center.every((v,i)=>Math.abs(pos.getComponent(i)-v)<half);
  const inSphere=Math.hypot(pos.x-spec.observatory.center[0],pos.y-spec.observatory.center[1],pos.z-spec.observatory.center[2])<spec.observatory.radius+2.5;
  const blocked=(scene==='cube'?inside:inSphere)||pos.y<terrainHeight(pos.x,pos.z)+3;
  if(blocked&&safePose.current&&safePose.current.position.y<0){camera.position.copy(safePose.current.position);c.target.copy(safePose.current.target);travel.current=null}
  else if(!blocked)safePose.current={position:pos.clone(),target:c.target.clone()};
 }
 if(mode==='surface'){
  const pos=camera.position,sphere=spec.observatory,insideSphere=Math.hypot(pos.x-sphere.center[0],pos.y-sphere.center[1],pos.z-sphere.center[2])<sphere.radius+4,blocked=insideSphere||pos.y<terrainHeight(pos.x,pos.z)+5||obstacles.some(b=>Math.abs(pos.x-b.x)<b.w&&Math.abs(pos.z-b.z)<b.d&&pos.y>b.bottom-3&&pos.y<b.top);
  if(blocked&&safePose.current){camera.position.copy(safePose.current.position);c.target.copy(safePose.current.target);travel.current=null}
  else if(!blocked)safePose.current={position:pos.clone(),target:c.target.clone()};
 }
 }}/>
}
