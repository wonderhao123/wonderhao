"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type MutableRefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {cityAsset} from '@/lib/world/assets';
import {CITY,bridges,sites,sampledRoads,streams,weatherAt,type Weather,type V3} from '@/lib/world/city-plan';
import {terrainSurface,architecturalSurface} from '@/lib/world/surface-materials';
import {makeCanopy,makePalm,makeTempleRoof,makeArch,makeGothicArch,makeFlyingButtress,makeRock,makeBoatHull} from '@/lib/world/vegetation';
import {focusSurface} from '@/lib/world/building-focus';
import type {Part,Region} from '@/lib/world/city-assets';
const regionCache=new Map<string,Promise<Part[]>>();
const heightCache=new Map<string,Promise<Float32Array>>();
function heights(file:string,expected:number){let p=heightCache.get(file);if(!p){p=fetch(cityAsset(file)).then(r=>{if(!r.ok)throw Error('Terrain unavailable');return r.arrayBuffer()}).then(b=>{const data=new Float32Array(b);if(data.length!==expected)throw Error('Invalid terrain survey');return data});heightCache.set(file,p);p.catch(()=>heightCache.delete(file));}return p}
function regionData(id:string){let p=regionCache.get(id);if(!p){p=fetch(cityAsset(id+'.json')).then(r=>{if(!r.ok)throw Error('Region unavailable');return r.json()});regionCache.set(id,p!);p!.catch(()=>regionCache.delete(id));}return p!}
function TerrainMesh({data,nx,nz,x,z,w,d,level,coverage,weather,clock}:{data:Float32Array;nx:number;nz:number;x:number;z:number;w:number;d:number;level:string;coverage?:THREE.DataTexture;weather?:Weather;clock?:MutableRefObject<number>}){
 const cut=useRef({value:0}),wet=useRef({value:0});
 useFrame(()=>{cut.current.value=level==='b1'?70:level==='b2'?64:0;wet.current.value=weatherAt(clock?.current??0,weather??'sunny')});
 const geo=useMemo(()=>{
  const g=new THREE.PlaneGeometry(w,d,nx,nz);g.rotateX(-Math.PI/2);g.translate(x+w/2,0,z+d/2);
  const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,data[i]);
  const normals=g.attributes.normal,packed=new Int16Array(data.buffer,data.byteOffset+p.count*4,p.count*2);
  for(let i=0;i<p.count;i++){const nx=packed[i*2]/32767,nz=packed[i*2+1]/32767;normals.setXYZ(i,nx,Math.sqrt(Math.max(0,1-nx*nx-nz*nz)),nz)}
  // Downward skirts seal coarse/fine boundaries on steep terrain without changing the survey.
  if(w===256){
   const border=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:nz},(_,j)=>(j+1)*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i-1),...Array.from({length:nz-1},(_,j)=>(nz-j-1)*(nx+1))];
   const positions=Array.from(p.array),normalData=Array.from(normals.array),uv=Array.from(g.attributes.uv.array),indices=Array.from(g.index!.array),count=p.count;
   border.forEach(i=>{positions.push(p.getX(i),p.getY(i)-48,p.getZ(i));normalData.push(normals.getX(i),normals.getY(i),normals.getZ(i));uv.push(g.attributes.uv.getX(i),g.attributes.uv.getY(i))});
   border.forEach((a,i)=>{const j=(i+1)%border.length,b=border[j];indices.push(a,b,count+i,b,count+j,count+i)});
   g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normalData,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);
  }
  return g;
 },[data,nx,nz,x,z,w,d]);
 useEffect(()=>()=>geo.dispose(),[geo]);
 return <mesh geometry={geo} receiveShadow><meshStandardMaterial customProgramCacheKey={()=>coverage?"city-far-coverage":"city-near"} roughness={.95} onBeforeCompile={shader=>{
  shader.uniforms.cutLevel=cut.current;shader.uniforms.groundWet=wet.current; if(coverage)shader.uniforms.coverage={value:coverage};shader.vertexShader='varying vec3 surveyPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsurveyPosition=position;');
  shader.fragmentShader=(coverage?'uniform sampler2D coverage;\n':'')+'uniform float groundWet; uniform float cutLevel; varying vec3 surveyPosition;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(cutLevel>0. && distance(surveyPosition.xz,vec2(80.,-480.))<68. && surveyPosition.y>cutLevel-.4) discard;'+(coverage?'\nif(texture2D(coverage,(surveyPosition.xz+vec2(3584.,2560.))/vec2(7168.,5120.)).r>.5) discard;':''));
  terrainSurface(shader);
 }}/></mesh>
}
function Tile({x,z,n,level,onCoverage,weather,clock,onStatus}:{x:number;z:number;n:number;level:string;onStatus:(id:string,state:string)=>void;onCoverage:(x:number,z:number,add:number)=>void;weather?:Weather;clock?:MutableRefObject<number>}){
 const [data,setData]=useState<Float32Array>();const {invalidate}=useThree();
 useEffect(()=>{let alive=true;const ix=(x+3584)/256,iz=(z+2560)/256;onStatus(`${x}:${z}:${n}`,'loading');heights(`${ix}-${iz}-${n}.bin`,(n+1)**2*2).then(d=>{if(alive){setData(d);invalidate()}}).catch(()=>{if(alive)onStatus(`${x}:${z}:${n}`,'error')});return()=>{alive=false;onStatus(`${x}:${z}:${n}`,'idle')}},[x,z,n,invalidate,onStatus]);
 useEffect(()=>{if(!data)return;onCoverage(x,z,1);onStatus(`${x}:${z}:${n}`,'ready');invalidate();return()=>onCoverage(x,z,-1)},[data,x,z,n,onCoverage,invalidate,onStatus]);
 return data&&data.length===(n+1)**2*2?<TerrainMesh data={data} nx={n} nz={n} x={x} z={z} w={256} d={256} level={level} weather={weather} clock={clock}/>:null;
}
function makeCoverage(){
 const data=new Uint8Array(28*20),texture=new THREE.DataTexture(data,28,20,THREE.RedFormat),counts=new Map<number,number>();
 texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.needsUpdate=true;
 return {texture,update(x:number,z:number,add:number){const i=(z+2560)/256*28+(x+3584)/256,count=(counts.get(i)??0)+add;counts.set(i,count);data[i]=count>0?255:0;texture.needsUpdate=true;}};
}
export function CityTerrain({level,low,onStatus,weather,clock}:{level:string;low:boolean;onStatus:(id:string,state:string)=>void;weather?:Weather;clock?:MutableRefObject<number>}){
 const [tileStates,setTileStates]=useState<Record<string,string>>({});
 const tileStatus=useCallback((id:string,state:string)=>setTileStates(old=>old[id]===state?old:{...old,[id]:state}),[]);
 const initialTiles=useMemo(()=>{const out=[];for(let z=-1792;z<=512;z+=256)for(let x=-1536;x<=1280;x+=256)out.push({x,z,n:low?16:Math.abs(x)<512&&z>-768&&z<256?64:32});return out},[low]);
 const coverage=useMemo(()=>makeCoverage(),[]);
 const onCoverage=useCallback((x:number,z:number,add:number)=>coverage.update(x,z,add),[coverage]);
 useEffect(()=>()=>coverage.texture.dispose(),[coverage]);
 const [farError,setFarError]=useState(false);
 const [far,setFar]=useState<Float32Array>(),[tiles,setTiles]=useState<{x:number;z:number;n:number}[]>(initialTiles);const last=useRef('');const elapsed=useRef(1);const {controls,invalidate}=useThree();
 useEffect(()=>{let alive=true;heights('far.bin',113*81*2).then(d=>{if(alive){setFar(d);invalidate()}}).catch(()=>{if(alive)setFarError(true)});return()=>{alive=false}},[onStatus,invalidate]);
 useEffect(()=>{const keys=tiles.map(t=>`${t.x}:${t.z}:${t.n}`);onStatus('terrain',farError||keys.some(k=>tileStates[k]==='error')?'error':far&&keys.length>0&&keys.every(k=>tileStates[k]==='ready')?'ready':'loading')},[tiles,tileStates,far,farError,onStatus]);
 useFrame(({camera},dt)=>{
  elapsed.current+=dt;if(elapsed.current<.35)return;elapsed.current=0;
  const target=(controls as unknown as {target?:THREE.Vector3})?.target??new THREE.Vector3();const dist=camera.position.distanceTo(target);
  const key=`${Math.round(target.x/180)}:${Math.round(target.z/180)}:${dist>3300}:${low}`;if(last.current===key)return;last.current=key;
  if(dist>3300)return;
  const out=[...initialTiles];for(let z=-2560;z<2560;z+=256)for(let x=-3584;x<3584;x+=256){const dd=Math.hypot(x+128-target.x,z+128-target.z);if(dd<Math.min(1100,dist+300)&&!initialTiles.some(t=>t.x===x&&t.z===z))out.push({x,z,n:low?16:dd<480?64:32})}setTiles(out);
 });
 return <>{far&&<TerrainMesh data={far} nx={112} nz={80} x={-3584} z={-2560} w={CITY.width} d={CITY.depth} level={level} weather={weather} clock={clock} coverage={coverage.texture}/>} {tiles.map(t=><Tile key={`${t.x}:${t.z}:${t.n}`} {...t} level={level} weather={weather} clock={clock} onCoverage={onCoverage} onStatus={tileStatus}/>)}</>;
}
function Instances({parts,shape,color,dusk,clock,weather}:{parts:Part[];shape:number;color:string;dusk:boolean;clock?:MutableRefObject<number>;weather?:Weather}){
 const heritageNight=useRef({value:dusk?1:0});useFrame(()=>{heritageNight.current.value=dusk?1:0});
 const material=useRef<THREE.MeshStandardMaterial>(null);const wind=useRef({value:0});useFrame(()=>{wind.current.value=clock?.current??0;if(material.current){const base=["#386574","#36515e","#496574","#638c94","#70979a","#3f6b76","#71989d"].includes(color)?.18:color==="#87969a"?.32:.76;material.current.roughness=base*(1-weatherAt(clock?.current??0,weather??"sunny")*.45)}});
 const foliage=shape===5||shape===6||shape===10;const plant=useMemo(()=>shape===5?makePalm():shape===6?makeCanopy():shape===10?makeCanopy(true):shape===8?makeTempleRoof():shape===9?makeArch():shape===2?makeRock():shape===11?makeBoatHull():shape===12?makeGothicArch():shape===14?makeGothicArch(false):shape===15?makeFlyingButtress():null,[shape]);useEffect(()=>()=>plant?.dispose(),[plant]);
 const ref=useRef<THREE.InstancedMesh>(null);const matrix=useMemo(()=>new THREE.Object3D(),[]);
 useEffect(()=>{if(!ref.current)return;parts.forEach((p,i)=>{matrix.position.set(p[2],p[3],p[4]);matrix.scale.set(p[5],p[6],p[7]);matrix.rotation.set(0,p[8],0);matrix.updateMatrix();ref.current!.setMatrixAt(i,matrix.matrix)});ref.current.geometry.setAttribute('buildingOwner',new THREE.InstancedBufferAttribute(new Float32Array(parts.map(p=>p[9]??0)),1));ref.current.geometry.computeVertexNormals();ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere()},[parts,matrix]);
 const stained=['#788fa1','#c49665','#688e91'].includes(color),heritage=color==='#eee9dd';
 const luminous=['#d5efff','#ff5056'].includes(color),glow=color==='#A66BFF'||color==='#f5eac7'&&dusk,glass=['#36515e','#496574','#638c94','#70979a','#3f6b76','#386574','#71989d'].includes(color);
 return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]} castShadow receiveShadow>
 {plant?<primitive attach="geometry" object={plant}/>:shape===4?<bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([-.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,0,1,.5,.5,0,.5,-.5,0,-.5,0,1,-.5,0,1,.5,-.5,0,-.5,0,1,.5,-.5,0,.5,.5,0,-.5,.5,0,.5,0,1,.5,.5,0,-.5,0,1,.5,0,1,-.5]),3]}/></bufferGeometry>:shape===13?<coneGeometry args={[.5,1,8]}/>:shape===0?<boxGeometry/>:shape===1?<cylinderGeometry args={[1,1,1,10]}/>:shape===2?<icosahedronGeometry args={[1,2]}/>:<coneGeometry args={[1,2,7]}/>}
 <meshStandardMaterial vertexColors={shape===6||shape===10} alphaToCoverage ref={material} side={shape===4||shape===8||foliage?THREE.DoubleSide:THREE.FrontSide} customProgramCacheKey={()=>`city-surface-${glass}-${foliage}-${heritage}-${Boolean(clock)}-${color==='#a48864'?'wood':color==='#a85e48'?'tile':['#d2c4a7','#c8c9bc'].includes(color)?'paving':'plain'}`} onBeforeCompile={shader=>{
  focusSurface(shader,true);architecturalSurface(shader,glass,foliage,color==='#a48864'?'wood':color==='#a85e48'?'tile':['#d2c4a7','#c8c9bc'].includes(color)?'paving':'');
  if(heritage){shader.uniforms.heritageNight=heritageNight.current;shader.fragmentShader='uniform float heritageNight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n// Warm facade uplight fades up the plaster instead of turning the whole block emissive.\nfloat wash=exp(-max(0.,surfacePoint.y-23.)/20.);\nfloat bay=.58+.42*pow(.5+.5*cos((surfacePoint.z-52.)*.698),4.);\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.71,.40)*heritageNight*wash*bay*.32;`);}
  if(clock&&foliage){shader.uniforms.windTime=wind.current;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*.8+instanceMatrix[3].x*.017+instanceMatrix[3].z*.01)*.035*max(0.,position.y);');}
 }} color={color} roughness={glass?.18:.76} metalness={glass?.32:color==="#87969a"?.65:.04} envMapIntensity={glass?1.15:1} emissive={stained?color:luminous?color:glow?(dusk?'#ffcf85':'#b6ced0'):glass&&dusk?'#ffffff':'#000000'} emissiveIntensity={stained?(dusk?.85:0):luminous?(dusk?2.5:0):glow?(dusk?1.3:.5):dusk?.85:0}/>

 </instancedMesh>;
}
export function Parts({parts,dusk,clock,weather}:{parts:Part[];dusk:boolean;clock?:MutableRefObject<number>;weather?:Weather}){
 const batches=useMemo(()=>{const m=new Map<string,Part[]>();parts.forEach(p=>{const k=p[0]+p[1];if(!m.has(k))m.set(k,[]);m.get(k)!.push(p)});return [...m.values()]},[parts]);
 return <>{batches.map((p,i)=><Instances key={i} parts={p} shape={p[0][0]} color={p[0][1]} dusk={dusk} clock={clock} weather={weather}/>)}</>;
}
export function CityRegion({id,dusk,onStatus,clock,weather,detail=true}:{id:Region;dusk:boolean;detail?:boolean;clock?:MutableRefObject<number>;onStatus:(id:string,state:string)=>void;weather?:Weather}){
 const [parts,setParts]=useState<Part[]>(),[attempt,setAttempt]=useState(0),[error,setError]=useState(false);const {invalidate}=useThree();
 useEffect(()=>{let alive=true;onStatus(id,'loading');regionData(id+(detail?'':'-far')).then(p=>{if(alive){setParts(p);setError(false);onStatus(id,'ready');invalidate()}}).catch(()=>{if(alive){setError(true);onStatus(id,'error')}});return()=>{alive=false;onStatus(id,'idle')}},[id,detail,attempt,onStatus,invalidate]);
 // Retry is also exposed through the enclosing scene's HTML status control.
 useEffect(()=>{const retry=()=>setAttempt(v=>v+1);window.addEventListener('world-retry-region',retry);return()=>window.removeEventListener('world-retry-region',retry)},[]);
 const renderParts=useMemo(()=>id==='nature'?parts?.map(p=>{const q:Part=[...p];if(q[0]===6||q[0]===2)q[0]=10;return q}):parts,[parts,id]);
 return renderParts&&!error?<Parts parts={renderParts} dusk={dusk} clock={clock} weather={weather}/>:null;
}
export function ribbon(points:V3[],width:number){
 const g=new THREE.BufferGeometry(),v:number[]=[],idx:number[]=[];
 points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz)||1;for(const s of [-1,1])v.push(p[0]+dz/l*width/2*s,p[1],p[2]-dx/l*width/2*s);if(i)idx.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2)});
 g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function RoadsAndRivers({level}:{level?:string}){
 const meshes=useMemo(()=>{
 const out:{g:THREE.BufferGeometry;color:string}[]=[];
 for(const r of sampledRoads){out.push({g:ribbon(r.points.map(p=>[p[0],p[1]+.3,p[2]]),r.width+3),color:'#e3dfc9'});out.push({g:ribbon(r.points.map(p=>[p[0],p[1]+.4,p[2]]),r.width),color:'#485456'});}
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
 return <>{meshes.map((m,i)=><mesh key={i} geometry={m.g} receiveShadow><meshStandardMaterial color={m.color} roughness={.86} key={level??'outside'} onBeforeCompile={shader=>{architecturalSurface(shader,false,false);if(level)shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(distance(surfacePoint.xz,vec2(80.,-480.))<68.)discard;')}} side={THREE.DoubleSide}/></mesh>)}<Parts parts={(level?detail.filter(p=>Math.hypot(p[2]-80,p[4]+480)>=68):detail).map(p=>{const part:Part=[...p];part[9]=-1;return part})} dusk={false}/></>;
}
export function regionCentre(id:Region):V3{return id==='nature'?[0,20,0]:sites[id]}
