"use client";
import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {resourcesReady} from '@/lib/world/scene-readiness';
/** Readiness is committed scene content → compiled programs → rendered GPU fence. */
export function ScenePreparation({states,required,onReady,onStage}:{states:Record<string,string>;required:string[];onReady:()=>void;onStage:(id:string,state:string)=>void}){
 const {gl,scene,camera,invalidate}=useThree();
 const compiledFrame=useRef(0);
 const ready=resourcesReady(required,states),warm=useRef(false),done=useRef(false),fence=useRef<WebGLSync|null>(null);
 useEffect(()=>{
  let alive=true;warm.current=false;const context=gl.getContext() as WebGL2RenderingContext;
  if(fence.current){context.deleteSync(fence.current);fence.current=null;}
  if(!ready||done.current)return;
  onStage('gpu','loading');Object.assign(gl.shadowMap,{needsUpdate:true});
  const previous=gl.debug.onShaderError;let shaderFailed=false;
  // Three owns the mutable renderer debug callback; restore it on teardown.
  // eslint-disable-next-line react-hooks/immutability
  gl.debug.onShaderError=(...args)=>{shaderFailed=true;previous?.(...args);onStage('gpu','error')};
  gl.compileAsync(scene,camera).then(()=>{if(alive&&!shaderFailed){compiledFrame.current=Number(gl.domElement.dataset.renderFrame??0);warm.current=true;onStage('gpu','compiled');invalidate()}}).catch(()=>{if(alive)onStage('gpu','error')});
  return()=>{alive=false;gl.debug.onShaderError=previous;};
 },[ready,gl,scene,camera,invalidate,onStage]);
 useEffect(()=>()=>{if(fence.current)(gl.getContext() as WebGL2RenderingContext).deleteSync(fence.current)},[gl]);
 useFrame(()=>{
  if(!ready||!warm.current||done.current||document.hidden)return;
  if(Number(gl.domElement.dataset.renderFrame??0)<=compiledFrame.current){invalidate();return;}
  const context=gl.getContext() as WebGL2RenderingContext;
  if(!fence.current){fence.current=context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE,0);context.flush();invalidate();return;}
  const state=context.clientWaitSync(fence.current,0,0);
  if(state===context.WAIT_FAILED){onStage('gpu','error');warm.current=false;return;}
  if(state===context.TIMEOUT_EXPIRED){invalidate();return;}
  context.deleteSync(fence.current);fence.current=null;done.current=true;
  gl.domElement.setAttribute('data-reveal-time',String(performance.now()));
  onStage('gpu','ready');onReady();
 },2);
 return null;
}
