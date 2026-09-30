"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {LandmarkAsset} from './LandmarkAsset';
import {Parts} from './CityTerrain';
import type {Part} from '@/lib/world/city-assets';
import {hash,terrainHeight,relocation} from '@/lib/world/city-plan';
import type {Clock} from './CityLife';
function Annulus({y,inner,outer,height,color,start=0,length=Math.PI*2}:{y:number;inner:number;outer:number;height:number;color:string;start?:number;length?:number}){
 const g=useMemo(()=>{const s=new THREE.Shape();s.absarc(0,0,outer,start,start+length,false);s.lineTo(Math.cos(start+length)*inner,Math.sin(start+length)*inner);s.absarc(0,0,inner,start+length,start,true);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:96});geo.rotateX(-Math.PI/2);return geo},[inner,outer,height,start,length]);
 useEffect(()=>()=>g.dispose(),[g]);
 return <mesh geometry={g} position={[80,y,-680]} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.6} side={THREE.DoubleSide}/></mesh>
}
export function CitadelInterior({level}:{level:'b1'|'b2'}){
 const floor=level==='b1'?90:84;
 const parts=useMemo(()=>{
  const p:Part[]=[];const box=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>p.push([0,c,x,y,z,w,h,d,r]);
  for(const y of [84,90]){
   for(let k=0;k<6;k++){const a=k*Math.PI/3;box('#dce0dd',80+Math.sin(a)*40,y+2.3,-680+Math.cos(a)*40,.3,4.6,16,-a)}
   for(let i=0;i<9;i++){const a=i*.27+.22;box('#9eacb3',80+Math.cos(a)*41,y+1,-680+Math.sin(a)*41,5,1.6,2.2,a);box('#78b9c3',80+Math.cos(a)*41,y+2,-680+Math.sin(a)*41,4.2,.15,1.5,a)}
   for(let i=0;i<12;i++){box('#b7c2c2',62, y+i*.375,-682+i*.7,4,.35,.7);box('#849aa3',64.5,y+2.6,-678,.15,4.6,9)}
   box('#627583',97,y+2.4,-680,5,4.8,5);box('#A66BFF',97,y+4.9,-677.3,5,.15,.2);
  }
  // Exhibition islands, desks and partition mullions use the same structural grid.
  for(const y of [84,90])for(let i=0;i<12;i++){
   const a=i*Math.PI/6, x=80+Math.cos(a)*28,z=-680+Math.sin(a)*28;
   box('#8e9d9f',x,y+.25,z,10,.5,7,-a);box('#dbe2dc',x,y+1.2,z,8,.25,5,-a);
   box('#466b7a',x,y+2,z,6,1.4,.25,-a);box('#A66BFF',x,y+2.8,z,6,.08,.12,-a);
   for(const side of [-1,1]){box('#a4afb0',x+side*3,y+.6,z+3,1,.8,1);box('#889b9b',x+side*3,y+1.3,z+3.3,1,.65,.12)}
   for(let j=0;j<3;j++)box('#d3ded9',80+Math.cos(a)*46,y+1.8,-680+Math.sin(a)*46+j*1.1,.15,3.6,.15);
  }
  for(let i=0;i<7;i++){box('#465c6b',57+i*6,86,-713,3.5,4,3);box('#A66BFF',57+i*6,87.2,-711.4,2,.1,.1)}
  box('#98abb3',80,86,-650,16,1.6,5);box('#92c7c3',80,87,-650,14,.2,4);
  return p.filter(q=>q[3]+q[6]/2<=floor+5.8);
 },[floor]);
 return <>
  <mesh position={[80,77,-680]} receiveShadow><cylinderGeometry args={[68,68,2,96]}/><meshStandardMaterial color="#aaa58c" roughness={1}/></mesh>
  {/* Back half of the hill is an explicit capped rock section; front stays open to inspect. */}
  <Annulus y={77} inner={53} outer={67} height={19} color="#aaa58c" start={0} length={Math.PI}/>
  {[84,90].filter(y=>y<=floor).map(y=><group key={y}><Annulus y={y-.5} inner={11} outer={53} height={.5} color="#dedfd7"/><Annulus y={y} inner={48} outer={49} height={4.8} color="#cbd3cc" start={0} length={Math.PI}/></group>)}
  <Annulus y={floor} inner={11} outer={12} height={1} color="#859ca5"/>
  <Parts parts={parts} dusk/>
  <pointLight position={[80,floor+4,-680]} color="#c4b3ff" intensity={45} distance={65} decay={1.5}/>
 </>;
}
function Fish({i,clock}:{i:number;clock:Clock}){
 const ref=useRef<THREE.Group>(null),tail=useRef<THREE.Mesh>(null);
 useFrame(()=>{const t=clock.current*.15+i*.55,r=15+(i%8)*3;if(ref.current){ref.current.position.set(1590+Math.cos(t)*r,-5-(i%3)*.8,1850+Math.sin(t)*r*.7);ref.current.rotation.y=-t-Math.PI/2}if(tail.current)tail.current.rotation.y=Math.sin(clock.current*6+i)*.4});
 return <group ref={ref} scale={.55}><mesh scale={[.35,.55,1.4]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={['#d0c683','#82bfbd','#c59aa2'][i%3]}/></mesh><mesh ref={tail} position={[0,0,-1.3]} scale={[.15,.6,.7]}><coneGeometry args={[1,1,3]}/><meshStandardMaterial color="#6eaba9"/></mesh></group>
}
export function Underwater({clock,low,onStatus}:{clock:Clock;low:boolean;onStatus?:(id:string,state:string)=>void}){
 const waterTime=useRef({value:0});useFrame(()=>{waterTime.current.value=clock.current});
 const particles=useRef<THREE.Points>(null);
 const motes=useMemo(()=>{const g=new THREE.BufferGeometry(),v=[];for(let i=0;i<120;i++)v.push(1560+hash(i+71)*90,-3-hash(i+62)*5,1810+hash(i+13)*130);g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return g},[]);
 useEffect(()=>()=>motes.dispose(),[motes]);
 useFrame(()=>{if(particles.current)particles.current.position.set(Math.sin(clock.current*.07)*2,Math.sin(clock.current*.1)*.3,0)});

 const sand=useMemo(()=>{const g=new THREE.PlaneGeometry(430,520,80,80);g.rotateX(-Math.PI/2);g.translate(1570,0,1880);const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);a.setY(i,terrainHeight(x+relocation.dive[0],z+relocation.dive[2]))}g.computeVertexNormals();return g},[]);
 useEffect(()=>()=>sand.dispose(),[sand]);
 const parts=useMemo(()=>{
  const p:Part[]=[];for(let i=0;i<125;i++){const x=1450+hash(i+110)*260,z=1750+hash(i+820)*250,y=terrainHeight(x+relocation.dive[0],z+relocation.dive[2]);const r=1+hash(i)*3;
   if(Math.hypot(x-1610,z-1940)<31||Math.hypot(x-1540,z-1770)<39)continue;
   p.push([2,['#79918b','#8f9987','#a9ac92'][i%3],x,y+r*.4,z,r,r*.75,r*.8,hash(i)*6]);
   if(i%2===0)for(let j=0;j<7;j++){
    const a=j*.9,cx=x+Math.sin(a)*1.4,cz=z+Math.cos(a)*1.4;
    p.push([1,'#9c8e79',cx,y+1,cz,.15,2,.15,0]);
    p.push([2,['#c18d79','#b5a886','#859f92'][i%3],cx,y+2,cz,1.2,.25,1,0]);
   }
  }
  return p;
 },[]);
 const grassBeds=useMemo(()=>Array.from({length:600},(_,i)=>{const x=1550+hash(i+790)*115,z=1800+hash(i+397)*190;return {x,z,y:terrainHeight(x+relocation.dive[0],z+relocation.dive[2])+.9}}),[]);
 const grass=useRef<THREE.InstancedMesh>(null),dummy=useMemo(()=>new THREE.Object3D(),[]);
 useFrame(()=>{if(!grass.current)return;for(let i=0;i<600;i++){const {x,y,z}=grassBeds[i];dummy.position.set(x,y,z);dummy.rotation.set(Math.sin(clock.current*.6+i)*.13,hash(i)*6,0);const clear=Math.abs(x-1610)<20&&Math.abs(z-1940)<9;dummy.scale.set(clear?0:.24,clear?0:.5+hash(i)*.8,clear?0:.24);dummy.updateMatrix();grass.current.setMatrixAt(i,dummy.matrix)}grass.current.instanceMatrix.needsUpdate=true});
 return <>
  <points ref={particles} geometry={motes}><pointsMaterial color="#b8d8cd" size={.06} transparent opacity={.24} depthWrite={false}/></points>
  <mesh geometry={sand} receiveShadow><meshStandardMaterial color="#9fb9a3" roughness={.95} onBeforeCompile={shader=>{shader.uniforms.waterTime=waterTime.current;shader.vertexShader='varying vec3 reefPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nreefPoint=position;');shader.fragmentShader='uniform float waterTime; varying vec3 reefPoint;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat bands=abs(sin(reefPoint.x*.7+sin(reefPoint.z*.3+waterTime*.4))+sin(reefPoint.z*.8+cos(reefPoint.x*.4-waterTime*.2)));diffuseColor.rgb += vec3(.025,.045,.035)*(1.-smoothstep(.04,.2,bands));');}}/></mesh><Parts parts={parts} dusk={false}/><group position={[1610,-12.5,1940]}><LandmarkAsset name="habitat" low={low} onStatus={onStatus}/></group>
  <instancedMesh ref={grass} args={[undefined,undefined,600]}><planeGeometry args={[1,3,1,4]}/><meshStandardMaterial color="#568c7d" side={THREE.DoubleSide}/></instancedMesh>
  {Array.from({length:low?16:48},(_,i)=><Fish key={i} i={i} clock={clock}/>)}
  <pointLight position={[1610,-8,1942]} color="#bba5ff" intensity={55} distance={55}/>
 </>;
}
