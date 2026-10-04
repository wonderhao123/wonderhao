"use client";
import {Component,Suspense,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Canvas,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {ArrowLeft,ArrowRight,ArrowUp,ArrowDown,Expand,RotateCcw} from 'lucide-react';
import {assetPath} from '@/lib/world/assets';
import {makeDiveKit,disposeDiveKit} from '@/lib/world/dive-kit-model';
import {CityReflections} from './CityReflections';

class KitBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function Model({low,onReady,onFailure}:{low:boolean;onReady:()=>void;onFailure:()=>void}){
 const logo=useLoader(THREE.TextureLoader,assetPath('/hao-logo.svg'));
 const {scene,gl,invalidate}=useThree();
 useEffect(()=>{
  const kit=makeDiveKit(low,logo);scene.add(kit);invalidate();onReady();
  const lost=(event:Event)=>{event.preventDefault();onFailure();};
  gl.domElement.addEventListener('webglcontextlost',lost);
  return()=>{gl.domElement.removeEventListener('webglcontextlost',lost);scene.remove(kit);disposeDiveKit(kit);};
 },[low,logo,scene,gl,invalidate,onReady,onFailure]);
 return null;
}
function Unavailable({onFailure,children}:{onFailure:()=>void;children:ReactNode}){
 useEffect(onFailure,[onFailure]);return children;
}
export default function DiveKitViewer({low=false,expanded=false,onExpand}:{low?:boolean;expanded?:boolean;onExpand?:()=>void}){
 const controls=useRef<Controls>(null);
 const bindControls=useCallback((c:Controls|null)=>{controls.current=c;if(c){c.target.set(0,.22,0);c.update();c.saveState();}},[]);
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 const [attempt,setAttempt]=useState(0);
 // Stable callbacks keep the authored model mounted while the user inspects it.
 const ready=useCallback(()=>setStatus('ready'),[]),failed=useCallback(()=>setStatus('failed'),[]);
 const rotate=(axis:'x'|'y',amount:number)=>{
  const c=controls.current;if(!c)return;
  if(axis==='y')c.setAzimuthalAngle(c.getAzimuthalAngle()+amount);
  else c.setPolarAngle(THREE.MathUtils.clamp(c.getPolarAngle()+amount,.3,Math.PI-.3));
  c.update();
 };
 const fallback=<Unavailable onFailure={failed}><div className="kit-fallback" role="status"><strong>Dive kit</strong><p>Mask, suit, fins and air cylinder.</p><p>The 3D preview is unavailable. You can still collect your kit and dive.</p><button type="button" className="secondary-button" onClick={()=>{useLoader.clear(THREE.TextureLoader,assetPath('/hao-logo.svg'));setStatus('loading');setAttempt(v=>v+1);}}>Retry 3D preview</button></div></Unavailable>;
 return <div className={`kit-viewer ${expanded?'kit-viewer-expanded':''}`}>
  <div className="kit-caption"><span>WONDERHAO</span><span>DIVE KIT</span></div>
  <div className="kit-stage" role="group" tabIndex={0} aria-label="Interactive dive kit. Drag to rotate, or use arrow keys. Home resets the view."
   onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Home')controls.current?.reset();else rotate(e.key==='ArrowLeft'||e.key==='ArrowRight'?'y':'x',e.key==='ArrowLeft'||e.key==='ArrowUp'?-.3:.3);}}}>
   <KitBoundary key={attempt} fallback={fallback}>
    {status==='failed'?fallback:<Canvas key={`${low}-${attempt}`} frameloop="demand" dpr={low?1:[1,1.5]} camera={{position:expanded?[1.8,1,4.8]:[2.1,1.1,5.8],fov:34,near:.1,far:30}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} fallback={<p>3D is unavailable. You can still collect your kit and dive.</p>}>
     <ambientLight intensity={.65}/><directionalLight position={[3,5,4]} intensity={3} color="#e6f6ff"/><directionalLight position={[-3,1,2]} intensity={1.4} color="#eef2f4"/><directionalLight position={[1,3,-4]} intensity={2} color="#f6f2eb"/>
     <CityReflections dusk={false}/>
     <Suspense fallback={null}><Model low={low} onReady={ready} onFailure={failed}/></Suspense>
     <OrbitControls ref={bindControls} makeDefault target={[0,.22,0]} enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={.3} maxPolarAngle={Math.PI-.3} rotateSpeed={.65}/>
    </Canvas>}
   </KitBoundary>
   {status==='loading'&&<span className="kit-loading" role="status">Preparing your equipment…</span>}
  </div>
  <div className="kit-controls" aria-label="Dive kit rotation controls">
   <button type="button" className="icon-button" disabled={status!=='ready'} aria-label="Rotate kit left" title="Rotate left" onClick={()=>rotate('y',-.4)}><ArrowLeft size={16}/></button>
   <button type="button" className="icon-button" disabled={status!=='ready'} aria-label="Rotate kit right" title="Rotate right" onClick={()=>rotate('y',.4)}><ArrowRight size={16}/></button>
   {expanded&&<><button type="button" className="icon-button" disabled={status!=='ready'} aria-label="Tilt kit up" title="Tilt up" onClick={()=>rotate('x',-.25)}><ArrowUp size={16}/></button><button type="button" className="icon-button" disabled={status!=='ready'} aria-label="Tilt kit down" title="Tilt down" onClick={()=>rotate('x',.25)}><ArrowDown size={16}/></button></>}
   <button type="button" className="icon-button" disabled={status!=='ready'} aria-label="Reset kit view" title="Reset view" onClick={()=>controls.current?.reset()}><RotateCcw size={15}/></button>
   {onExpand&&<button type="button" className="kit-expand" onClick={onExpand}><Expand size={14}/>Inspect kit</button>}
  </div>
  <p className="kit-hint">Drag to rotate · {expanded?'Arrow keys work too':'Inspect every angle'}</p>
  {expanded&&<div className="kit-materials"><div><span>Mask</span><strong>Clear lenses</strong></div><div><span>Suit</span><strong>White neoprene</strong></div><div><span>Cylinder</span><strong>White finish</strong></div></div>}
 </div>;
}
