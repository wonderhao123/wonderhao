"use client";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CITY,weatherAt,type Weather } from "@/lib/world/city-plan";
import { cityAsset } from "@/lib/world/assets";
const survey = {width:CITY.width,depth:CITY.depth,centerZ:0};
import spec from '@/lib/world/landmark-spec.json';
import {SUN_DIRECTION} from '@/lib/world/city-buildings';
const sunlight=SUN_DIRECTION;

// One wave field drives displacement and normals, so highlights travel with the swell.
const waves = `
float noise2(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453);
 float b=fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453);
 float c=fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453);
 float d=fract(sin(dot(i+1.,vec2(127.1,311.7)))*43758.5453);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float exposure(vec2 p){return mix(.28,1.,smoothstep(450.,1400.,length(p-vec2(80.,230.))));}
vec2 warp(vec2 p){return p+vec2(sin(p.y*.035)*7.,sin(p.x*.043)*5.);}
float swell(vec2 p,float t){
 p=warp(p);
 return .42*sin(dot(p,vec2(.033,.021))-t*.55) + .23*sin(dot(p,vec2(.14,.07))-t*.85)
       +.12*sin(dot(p,vec2(-.08,.23))-t*1.12)
       +.065*sin(dot(p,vec2(.39,.27))-t*1.6);
}
vec2 slope(vec2 p,float t,float detail){
 vec2 q=p*.85+vec2(-t*.23,t*.12);
 vec2 capillary=vec2(noise2(q+vec2(.3,0.))-noise2(q-vec2(.3,0.)),noise2(q+vec2(0.,.3))-noise2(q-vec2(0.,.3)))*.12;
 p=warp(p);
 return capillary*detail+ .42*vec2(.033,.021)*cos(dot(p,vec2(.033,.021))-t*.55)+ .23*vec2(.14,.07)*cos(dot(p,vec2(.14,.07))-t*.85)
       +.12*vec2(-.08,.23)*cos(dot(p,vec2(-.08,.23))-t*1.12)
       +.065*vec2(.39,.27)*cos(dot(p,vec2(.39,.27))-t*1.6)
       +detail*.025*vec2(1.7,.83)*cos(dot(p,vec2(1.7,.83))-t*2.3)
       +detail*.018*vec2(-1.1,2.1)*cos(dot(p,vec2(-1.1,2.1))-t*2.7);
}
`;
const depthCode = `
uniform sampler2D depthMap; uniform vec3 bounds; uniform float river;
float waterDepth(vec2 p){
 if(river>.5)return 1.8;
 vec2 uv=(p-vec2(0.,bounds.z))/bounds.xy+.5;
 float h=texture2D(depthMap,clamp(uv,0.,1.)).r;
 float surveyed=smoothstep(0.,.05,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
 return max(0.,-.08-mix(-30.,h,surveyed));
}
`;
const vertexShader = `
uniform float time; varying vec3 waterPosition;
${depthCode}
${waves}
void main(){
 vec4 p=modelMatrix*vec4(position,1.);
 float depth=waterDepth(p.xz);
 if(river<.5)p.y+=swell(p.xz,time)*exposure(p.xz)*smoothstep(.1,3.,depth);
 waterPosition=p.xyz;
 gl_Position=projectionMatrix*viewMatrix*p;
}`;
const fragmentShader = `
uniform float time; uniform vec3 deep,shallow,foam,sun,sky;uniform float daylight;uniform float storm;uniform vec4 observatory;
varying vec3 waterPosition;
${depthCode}
${waves}
void main(){
 vec3 eye=normalize(cameraPosition-waterPosition);
 vec2 p=waterPosition.xz;if(river<.5&&abs(p.x+940.)<14.&&abs(p.y-265.)<50.)discard;float depth=waterDepth(p);
 float attenuation=mix(smoothstep(.1,3.,depth),.65,river);
 float detailFade=1.-smoothstep(150.,1400.,distance(cameraPosition,waterPosition));
 vec2 s=slope(p,time,detailFade)*exposure(p)*attenuation*(1.+storm*.65);
 vec3 n=normalize(vec3(-s.x,1.,-s.y));
 float facing=max(dot(n,eye),0.);
 float fresnel=.04+.96*pow(1.-facing,5.);
 vec3 reflection=reflect(-eye,n);
 vec3 skyReflection=mix(sky*.65,sky,smoothstep(-.15,.55,reflection.y));
 vec3 color=mix(deep,shallow,exp(-depth*.30)*.85);
 color*=.93+.07*sin(p.x*.09+p.y*.12+time*.2);
 color=mix(color,skyReflection,.08+fresnel*.55);
 // Bounded analytic reflection of the fixed sphere: no per-object render targets.
 vec3 toSphere=observatory.xyz-waterPosition;float alongRay=dot(toSphere,reflection);
 float miss=length(toSphere-reflection*alongRay);float reflectedSphere=(1.-smoothstep(observatory.w-3.,observatory.w+1.,miss))*step(0.,alongRay)*smoothstep(0.,.15,reflection.y);
 color=mix(color,vec3(.11,.18,.19),reflectedSphere*fresnel*.72);
 float bedDetail=(.5+.5*sin(p.x*.42+sin(p.y*.19)*2.))*exp(-depth*.65);
 color+=vec3(.035,.05,.027)*bedDetail*(1.-fresnel);
 vec3 sunRay=normalize(sun*200000.-waterPosition);
 float highlight=max(dot(reflect(-sunRay,n),eye),0.);
 // Broad gloss under a finer, broken sun glitter; the sun matches the scene light.
 color+=vec3(1.,.88,.65)*daylight*mix(1.,.3,river)*(pow(highlight,100.)*.45+pow(highlight,18.)*.025);
 float phase=fract(depth*.38-time*.16+swell(p,time)*.12);
 float breaker=(1.-smoothstep(.025,.105,phase))*smoothstep(0.,.25,depth)*(1.-smoothstep(1.8,4.2,depth));
 float flecks=.5+.5*sin(p.x*2.3+sin(p.y*1.8))*sin(p.y*3.1-time*.9);
 float waterlineRadius=sqrt(observatory.w*observatory.w-observatory.y*observatory.y);
 float sphereDistance=length(p-observatory.xz);
 if(sphereDistance<waterlineRadius-.1)discard;
 float contact=(1.-smoothstep(.12,1.4,abs(sphereDistance-waterlineRadius)))*(.6+.4*sin(sphereDistance*4.-time));
 float shore=max(breaker*(.4+.6*flecks),contact*.25)*(1.-river);
 color=mix(color,foam,shore*.52);
 color=mix(color,color*.72,storm*.4);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function WaterMaterial({
  dusk,
  animate,
  depthMap,
  river = false,
  timeRef,
  weather="sunny",
}: {
  weather?:Weather;
  dusk: boolean;
  animate: boolean;
  depthMap?: THREE.DataTexture;
  river?: boolean;
  timeRef?: MutableRefObject<number>;
}) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const { invalidate } = useThree();
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      depthMap: { value: depthMap ?? null },
      river: { value: river ? 1 : 0 },
      bounds: {
        value: new THREE.Vector3(survey.width, survey.depth, survey.centerZ),
      },
      deep: { value: new THREE.Color() },
      shallow: { value: new THREE.Color() },
      foam: { value: new THREE.Color() },
      sky: { value: new THREE.Color() },
      sun: { value: new THREE.Vector3(...sunlight).normalize() },
      daylight: { value: 1 },
      storm:{value:0},observatory:{value:new THREE.Vector4(...spec.observatory.center as [number,number,number],spec.observatory.radius)},
    }),
    [depthMap, river],
  );
  useEffect(() => {
    const u = ref.current?.uniforms;
    if (!u) return;
    u.deep.value.set(dusk ? "#102b48" : river ? "#226d70" : "#19566b");
    u.shallow.value.set(dusk ? "#316574" : "#65bea9");
    u.foam.value.set(dusk ? "#7ea5b0" : "#e0efe5");
    u.sky.value.set(dusk ? "#52718f" : "#84b1c7");
    u.daylight.value = dusk ? 0.09 : 1;
    invalidate();
  }, [dusk, river, invalidate, uniforms]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.uniforms.storm.value=weatherAt(timeRef?.current??0,weather);
    if (animate) ref.current.uniforms.time.value = timeRef ? timeRef.current : ref.current.uniforms.time.value + Math.min(dt,.1);
  });
  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      side={river ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}
export function RiverWaterMaterial({
  dusk,
  animate,
}: {
  weather?:Weather;
  dusk: boolean;
  animate: boolean;
}) {
  return <WaterMaterial dusk={dusk} animate={animate} river />;
}
export function CoastalWater({dusk,animate,timeRef,weather}:{dusk:boolean;animate:boolean;timeRef?:MutableRefObject<number>;weather?:Weather}) {
 const geometry=useMemo(()=>{const g=new THREE.PlaneGeometry(2,2,384,384),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setXY(i,Math.sign(x)*x*x*9000,Math.sign(y)*y*y*9000)}return g},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const [depth,setDepth]=useState<THREE.DataTexture>();
 const {invalidate}=useThree();
 useEffect(()=>{let alive=true;let texture:THREE.DataTexture|undefined;
  fetch(cityAsset('water.bin')).then(r=>{if(!r.ok)throw Error('Depth unavailable');return r.arrayBuffer()}).then(buffer=>{
   texture=new THREE.DataTexture(new Uint16Array(buffer),512,512,THREE.RedFormat,THREE.HalfFloatType);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
   if(alive){setDepth(texture);invalidate()}else texture.dispose();
  }).catch(()=>{});return()=>{alive=false;texture?.dispose()}
 },[invalidate]);
 return <mesh geometry={geometry} rotation={[-Math.PI/2,0,0]} position={[0,-.08,0]} frustumCulled={false}><WaterMaterial dusk={dusk} animate={animate} depthMap={depth} timeRef={timeRef} weather={weather}/></mesh>
}
