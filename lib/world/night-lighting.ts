import * as THREE from 'three';
import {sampledRoads,mountainSites} from './city-plan';
export const streetLights=sampledRoads.flatMap(road=>road.points.slice(1).flatMap((b,i)=>{
 const a=road.points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]),out:THREE.Vector3[]=[];
 for(let d=16;d<length;d+=road.mountain?65:38){const t=d/length,side=(i%2?1:-1)*(road.width/2+1.1);out.push(new THREE.Vector3(a[0]+(b[0]-a[0])*t+(b[2]-a[2])/length*side,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t-(b[0]-a[0])/length*side))}return out;
}));
export const nightField={texture:{value:null as THREE.DataTexture|null},amount:{value:0}};
/** R/B encode warm/cool irradiance; G is the surveyed light elevation. */
export function makeNightField(){
 const n=1024,span=6144,min=-2048,data=new Uint8Array(n*n*4);
 const stamp=(px:number,py:number,pz:number,tx:number,tz:number,along:number,across:number,strength:number,cool=false)=>{
  const radius=Math.max(along,across)*2.5,cx=(px-min)/span*n,cz=(pz-min)/span*n,r=radius/span*n;
  for(let z=Math.floor(cz-r);z<=cz+r;z++)for(let x=Math.floor(cx-r);x<=cx+r;x++){
   if(x<0||z<0||x>=n||z>=n)continue;
   const dx=(x+.5)/n*span+min-px,dz=(z+.5)/n*span+min-pz;
   const u=(dx*tx+dz*tz)/along,v=(dx*tz-dz*tx)/across;
   const value=Math.exp(-.5*(u*u+v*v))*strength*255,k=(z*n+x)*4,c=cool?2:0;
   if(value>data[k+c]){data[k+c]=value;if(value>Math.max(data[k],data[k+2])*.85)data[k+1]=py;data[k+3]=255;}
  }
 };
 // Overlapping road-aligned footprints form lit carriageways, with a soft dark verge.
 for(const road of sampledRoads)for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]),steps=Math.ceil(length/7);
  for(let j=0;j<=steps;j++){const t=j/steps;stamp(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,(b[0]-a[0])/length,(b[2]-a[2])/length,10,road.width*.45+2,road.mountain?.07:road.width>=14?.28:.17);}
 }
 // Small public-space pools complement the warm circulation network.
 for(const [x,y,z] of [[183,20,203],[-220,20,80],[-85,20,128],[80,76,-422],...Object.values(mountainSites).map(s=>s.position)])stamp(x,y,z,1,0,12,10,.20,true);
 const texture=new THREE.DataTexture(data,n,n);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
export function nightSurface(shader:THREE.WebGLProgramParametersWithUniforms,position:string){
 shader.uniforms.nightMap=nightField.texture;shader.uniforms.nightAmount=nightField.amount;
 shader.fragmentShader='uniform sampler2D nightMap;uniform float nightAmount;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 vec4 localLight=texture2D(nightMap,(${position}.xz+2048.)/6144.);
 float lightHeight=localLight.g*255.;
 float lightFalloff=exp(-pow(abs(${position}.y-lightHeight)/7.,2.));
 totalEmissiveRadiance+=(vec3(1.,.47,.16)*localLight.r+vec3(.38,.65,1.)*localLight.b)*nightAmount*lightFalloff*.9;
 `);
}
