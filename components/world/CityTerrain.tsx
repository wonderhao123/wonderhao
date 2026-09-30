"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type MutableRefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {cityAsset} from '@/lib/world/assets';
import {CITY,bridges,channel,sites,sampledRoads,streams,type V3} from '@/lib/world/city-plan';
import type {Part,Region} from '@/lib/world/city-assets';
const regionCache=new Map<string,Promise<Part[]>>();
const heightCache=new Map<string,Promise<Float32Array>>();
function heights(file:string){let p=heightCache.get(file);if(!p){p=fetch(cityAsset(file)).then(r=>{if(!r.ok)throw Error('Terrain unavailable');return r.arrayBuffer()}).then(b=>new Float32Array(b));heightCache.set(file,p);p.catch(()=>heightCache.delete(file));}return p}
function regionData(id:string){let p=regionCache.get(id);if(!p){p=fetch(cityAsset(id+'.json')).then(r=>{if(!r.ok)throw Error('Region unavailable');return r.json()});regionCache.set(id,p!);p!.catch(()=>regionCache.delete(id));}return p!}
function TerrainMesh({data,nx,nz,x,z,w,d,level,coverage}:{data:Float32Array;nx:number;nz:number;x:number;z:number;w:number;d:number;level:string;coverage?:THREE.DataTexture}){
 const cut=useRef({value:0});
 useFrame(()=>{cut.current.value=level==='b1'?90:level==='b2'?84:0});
 const geo=useMemo(()=>{
  const g=new THREE.PlaneGeometry(w,d,nx,nz);g.rotateX(-Math.PI/2);g.translate(x+w/2,0,z+d/2);
  const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){
   const y=data[i];p.setY(i,y);const px=p.getX(i),pz=p.getZ(i),water=channel(px,pz);
   const hue=y<1?'#d5d0ac':water.d<water.width/2+7?'#a4b99a':y>105?'#9aa58d':y>50?'#92b077':'#a6c789';
   const color=new THREE.Color(hue);color.multiplyScalar(.97+.025*Math.sin(px*.017)*Math.cos(pz*.019));c.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
 },[data,nx,nz,x,z,w,d]);
 useEffect(()=>()=>geo.dispose(),[geo]);
 return <mesh geometry={geo} receiveShadow><meshStandardMaterial customProgramCacheKey={()=>coverage?"city-far-coverage":"city-near"} vertexColors roughness={.95} onBeforeCompile={shader=>{
  shader.uniforms.cutLevel=cut.current; if(coverage)shader.uniforms.coverage={value:coverage};shader.vertexShader='varying vec3 surveyPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsurveyPosition=position;');
  shader.fragmentShader=(coverage?'uniform sampler2D coverage;\n':'')+'uniform float cutLevel; varying vec3 surveyPosition;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(cutLevel>0. && distance(surveyPosition.xz,vec2(80.,-680.))<68. && surveyPosition.y>cutLevel-.4) discard;'+(coverage?'\nif(texture2D(coverage,(surveyPosition.xz+vec2(3584.,2560.))/vec2(7168.,5120.)).r>.5) discard;':''));
 }}/></mesh>
}
function Tile({x,z,n,level,onCoverage}:{x:number;z:number;n:number;level:string;onCoverage:(x:number,z:number,add:number)=>void}){
 const [data,setData]=useState<Float32Array>();const {invalidate}=useThree();
 useEffect(()=>{let alive=true;const ix=(x+3584)/256,iz=(z+2560)/256;heights(`${ix}-${iz}-${n}.bin`).then(d=>{if(alive){setData(d);invalidate()}}).catch(()=>{});return()=>{alive=false}},[x,z,n,invalidate]);
 useEffect(()=>{if(!data)return;onCoverage(x,z,1);invalidate();return()=>onCoverage(x,z,-1)},[data,x,z,onCoverage,invalidate]);
 return data&&data.length===(n+1)**2?<TerrainMesh data={data} nx={n} nz={n} x={x} z={z} w={256} d={256} level={level}/>:null;
}
function makeCoverage(){
 const data=new Uint8Array(28*20),texture=new THREE.DataTexture(data,28,20,THREE.RedFormat),counts=new Map<number,number>();
 texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.needsUpdate=true;
 return {texture,update(x:number,z:number,add:number){const i=(z+2560)/256*28+(x+3584)/256,count=(counts.get(i)??0)+add;counts.set(i,count);data[i]=count>0?255:0;texture.needsUpdate=true;}};
}
export function CityTerrain({level,low,onFailure}:{level:string;low:boolean;onFailure:()=>void}){
 const coverage=useMemo(()=>makeCoverage(),[]);
 const onCoverage=useCallback((x:number,z:number,add:number)=>coverage.update(x,z,add),[coverage]);
 useEffect(()=>()=>coverage.texture.dispose(),[coverage]);
 const [far,setFar]=useState<Float32Array>(),[tiles,setTiles]=useState<{x:number;z:number;n:number}[]>([]);const last=useRef('');const elapsed=useRef(1);const {controls,invalidate}=useThree();
 useEffect(()=>{let alive=true;heights('far.bin').then(d=>{if(alive){setFar(d);invalidate()}}).catch(onFailure);return()=>{alive=false}},[onFailure,invalidate]);
 useFrame(({camera},dt)=>{
  elapsed.current+=dt;if(elapsed.current<.35)return;elapsed.current=0;
  const target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();const dist=camera.position.distanceTo(target);
  const key=`${Math.round(target.x/180)}:${Math.round(target.z/180)}:${dist>3300}:${low}`;if(last.current===key)return;last.current=key;
  if(dist>3300){setTiles([]);return}
  const out=[];for(let z=-2560;z<2560;z+=256)for(let x=-3584;x<3584;x+=256){const dd=Math.hypot(x+128-target.x,z+128-target.z);if(dd<Math.min(1500,dist+400))out.push({x,z,n:low?16:dd<480?64:32})}setTiles(out);
 });
 return <>{far&&<TerrainMesh data={far} nx={112} nz={80} x={-3584} z={-2560} w={CITY.width} d={CITY.depth} level={level} coverage={coverage.texture}/>} {tiles.map(t=><Tile key={`${t.x}:${t.z}:${t.n}`} {...t} level={level} onCoverage={onCoverage}/>)}</>;
}
function Instances({parts,shape,color,dusk,clock}:{parts:Part[];shape:number;color:string;dusk:boolean;clock?:MutableRefObject<number>}){
 const wind=useRef({value:0});useFrame(()=>{wind.current.value=clock?.current??0});
 const ref=useRef<THREE.InstancedMesh>(null);const matrix=useMemo(()=>new THREE.Object3D(),[]);
 useEffect(()=>{if(!ref.current)return;parts.forEach((p,i)=>{matrix.position.set(p[2],p[3],p[4]);matrix.scale.set(p[5],p[6],p[7]);matrix.rotation.set(0,p[8],0);matrix.updateMatrix();ref.current!.setMatrixAt(i,matrix.matrix)});ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere()},[parts,matrix]);
 const glow=color==='#A66BFF',glass=['#36515e','#496574','#638c94','#70979a','#3f6b76'].includes(color);
 return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]} castShadow receiveShadow>
 {shape===0?<boxGeometry/>:shape===1?<cylinderGeometry args={[1,1,1,10]}/>:shape===2?<icosahedronGeometry args={[1,1]}/>:<coneGeometry args={[1,2,7]}/>}
 <meshStandardMaterial customProgramCacheKey={()=>clock&&shape>=2&&["#8fa65f","#678b59","#aec57d","#75995e"].includes(color)?"city-wind":"city-static"} onBeforeCompile={shader=>{if(!clock||shape<2||!['#8fa65f','#678b59','#aec57d','#75995e'].includes(color))return;shader.uniforms.windTime=wind.current;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*.8+instanceMatrix[3].x*.017+instanceMatrix[3].z*.01)*.07*(position.y+1.);');}} color={color} roughness={glass?.24:.8} metalness={glass?.3:.03} emissive={glow?'#A66BFF':glass&&dusk?'#dabd87':'#000000'} emissiveIntensity={glow?2.8:dusk?.4:0}/>
 </instancedMesh>;
}
export function Parts({parts,dusk,clock}:{parts:Part[];dusk:boolean;clock?:MutableRefObject<number>}){
 const batches=useMemo(()=>{const m=new Map<string,Part[]>();parts.forEach(p=>{const k=p[0]+p[1];if(!m.has(k))m.set(k,[]);m.get(k)!.push(p)});return [...m.values()]},[parts]);
 return <>{batches.map((p,i)=><Instances key={i} parts={p} shape={p[0][0]} color={p[0][1]} dusk={dusk} clock={clock}/>)}</>;
}
export function CityRegion({id,dusk,onStatus,clock,detail=true}:{id:Region;dusk:boolean;detail?:boolean;clock?:MutableRefObject<number>;onStatus:(id:string,state:string)=>void}){
 const [parts,setParts]=useState<Part[]>(),[attempt,setAttempt]=useState(0),[error,setError]=useState(false);const {invalidate}=useThree();
 useEffect(()=>{let alive=true;onStatus(id,'loading');regionData(id+(detail?'':'-far')).then(p=>{if(alive){setParts(p);setError(false);onStatus(id,'ready');invalidate()}}).catch(()=>{if(alive){setError(true);onStatus(id,'error')}});return()=>{alive=false;onStatus(id,'idle')}},[id,detail,attempt,onStatus,invalidate]);
 // Retry is also exposed through the enclosing scene's HTML status control.
 useEffect(()=>{const retry=()=>setAttempt(v=>v+1);window.addEventListener('world-retry-region',retry);return()=>window.removeEventListener('world-retry-region',retry)},[]);
 return parts&&!error?<Parts parts={parts} dusk={dusk} clock={clock}/>:null;
}
export function ribbon(points:V3[],width:number){
 const g=new THREE.BufferGeometry(),v:number[]=[],idx:number[]=[];
 points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz)||1;for(const s of [-1,1])v.push(p[0]+dz/l*width/2*s,p[1],p[2]-dx/l*width/2*s);if(i)idx.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2)});
 g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function RoadsAndRivers(){
 const meshes=useMemo(()=>{
 const out:{g:THREE.BufferGeometry;color:string}[]=[];
 for(const r of sampledRoads){out.push({g:ribbon(r.points.map(p=>[p[0],p[1]+.3,p[2]]),r.width+3),color:'#e3dfc9'});out.push({g:ribbon(r.points.map(p=>[p[0],p[1]+.4,p[2]]),r.width),color:'#82928d'});}
 for(const s of streams)out.push({g:ribbon(s,27),color:'#6aa6a8'});return out;
 },[]);
 const detail=useMemo(()=>{
 const parts:Part[]=[];
 for(const r of sampledRoads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]),angle=Math.atan2(b[0]-a[0],b[2]-a[2]);
  for(let d=12;d<length-10;d+=22){const t=d/length,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=a[1]+(b[1]-a[1])*t;parts.push([0,'#e5e2c7',x,y+.47,z,.18,.07,7,angle]);
  }
 }
 for(const bridge of bridges){const [x,y,z]=bridge.centre,{width,length,heading}=bridge;
  parts.push([0,'#bdc5b8',x,y-.8,z,width+3,1.6,length,heading]);
  for(const side of [-1,1]){
   const px=x+Math.cos(heading)*(width/2+1)*side,pz=z-Math.sin(heading)*(width/2+1)*side;
   parts.push([0,'#8f9d99',px,y+1.2,pz,.2,.22,length,heading]);
   for(let d=-length/2;d<=length/2;d+=5)parts.push([0,'#9ba9a0',px+Math.sin(heading)*d,y+.6,pz+Math.cos(heading)*d,.2,1.2,.2,heading]);
   for(const end of [-1,1]){const ax=x+Math.sin(heading)*length/2*end,az=z+Math.cos(heading)*length/2*end;parts.push([0,'#b5bfae',ax,y-3,az,width+4,5,5,heading])}
  }

 }
 return parts;
 },[]);
 useEffect(()=>()=>meshes.forEach(m=>m.g.dispose()),[meshes]);
 return <>{meshes.map((m,i)=><mesh key={i} geometry={m.g} receiveShadow><meshStandardMaterial color={m.color} roughness={.86} side={THREE.DoubleSide}/></mesh>)}<Parts parts={detail} dusk={false}/></>;
}
export function regionCentre(id:Region):V3{return id==='nature'?[0,20,0]:sites[id]}
