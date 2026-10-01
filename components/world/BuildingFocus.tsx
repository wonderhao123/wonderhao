"use client";
import {useEffect,useRef,useState} from 'react';
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {Vector3,MathUtils} from 'three';
import {projectBuildings} from '@/lib/world/city-buildings';
import {projectBySlug} from '@/lib/world/content';
import {buildingFocus} from '@/lib/world/building-focus';
import type {SceneProps} from './IslandScene';
export function BuildingFocus({p,dragged}:{p:SceneProps;dragged:React.RefObject<boolean>}){
 const [hover,setHover]=useState<string>();const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const {invalidate,gl}=useThree();const focused=p.focusedBuilding??hover;
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null};
 const leave=()=>{clear();timer.current=setTimeout(()=>setHover(undefined),160)};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);buildingFocus.target.value=0;buildingFocus.amount.value=0},[]);
 useEffect(()=>{const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;setHover(undefined)};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')cancel()};gl.domElement.addEventListener('pointerdown',cancel);window.addEventListener('keydown',escape);return()=>{gl.domElement.removeEventListener('pointerdown',cancel);window.removeEventListener('keydown',escape)}},[gl]);
 useFrame((_,dt)=>{
  const target=focused?projectBuildings.findIndex(b=>b.id===focused)+1:0;
  if(target)buildingFocus.target.value=target;
  const amount=target?1:0,old=buildingFocus.amount.value;
  buildingFocus.amount.value=p.reduced?amount:Math.abs(old-amount)<.01?amount:old+(amount-old)*Math.min(1,dt*14);
  if(!target&&buildingFocus.amount.value===0)buildingFocus.target.value=0;
  gl.domElement.setAttribute('data-focus-building',focused??'');
  if(buildingFocus.amount.value!==amount)invalidate();
 });
 const select=(id:string,e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<6&&!dragged.current&&!p.paused){clear();p.onFocusBuilding(id)}};
 return <>{projectBuildings.map(b=><group key={b.id} position={b.position}>
  {b.volumes.map((v,i)=><mesh key={i} position={v.position.map((n,j)=>n-b.position[j]) as [number,number,number]} onClick={e=>select(b.id,e)} onPointerOver={e=>{e.stopPropagation();if(p.paused||e.buttons||e.pointerType==='touch')return;clear();timer.current=setTimeout(()=>setHover(b.id),70);gl.domElement.style.cursor='pointer'}} onPointerOut={()=>{leave();gl.domElement.style.cursor=''}}>
   {b.id==='research'?<sphereGeometry args={[35,24,16]}/>:<boxGeometry args={v.size}/>}<meshBasicMaterial transparent opacity={0} depthWrite={false}/>
  </mesh>)}
  {focused===b.id&&!p.paused&&<Html center calculatePosition={(object,camera,size)=>{const point=object.getWorldPosition(new Vector3()).project(camera);return [MathUtils.clamp((point.x+1)*size.width/2,144,size.width-144),MathUtils.clamp((1-point.y)*size.height/2,240,size.height-145)]}} style={{transform:"translate(-50%, -100%)"}} position={[0,b.size[1]/2+6,0]} zIndexRange={[22,20]}><div className="building-focus-card" data-card-surface="" onPointerEnter={clear} onPointerLeave={leave} onPointerDown={e=>e.stopPropagation()}>
   <small>{projectBySlug(b.projects[0])?.category} / {b.projects.length} {b.projects.length===1?'project':'projects'}</small><strong>{b.name}</strong>
   <p>{projectBySlug(b.projects[0])?.summary}</p>
   <button autoFocus={!!p.focusedBuilding} aria-label={`Explore ${b.name}`} onFocus={clear} onClick={()=>{p.onFocusBuilding(b.id);p.onBuilding(b.id)}}>Explore projects ↗</button>
  </div></Html>}
 </group>)}</>;
}
