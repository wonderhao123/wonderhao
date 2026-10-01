import type * as THREE from 'three';
import {nightSurface} from './night-lighting';
/** Continuous 3D material field avoids UV stretching on cliffs and seams between tiles. */
export const surfaceNoise=`
float materialHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float materialNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(materialHash(i),materialHash(i+vec3(1,0,0)),f.x),mix(materialHash(i+vec3(0,1,0)),materialHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(materialHash(i+vec3(0,0,1)),materialHash(i+vec3(1,0,1)),f.x),mix(materialHash(i+vec3(0,1,1)),materialHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;
const bump=`
vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
vec3 rx=cross(dy,normal),ry=cross(normal,dx);float determinant=dot(dx,rx);
normal=normalize(abs(determinant)*normal-sign(determinant)*(dFdx(materialHeight)*rx+dFdy(materialHeight)*ry));
`;
export function terrainSurface(shader:THREE.WebGLProgramParametersWithUniforms){
 nightSurface(shader,'surveyPosition');
 shader.vertexShader='varying vec3 groundNormal;\n'+shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\ngroundNormal=normal;');
 shader.fragmentShader='varying vec3 groundNormal;\n'+surfaceNoise+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 p=surveyPosition;float macro=materialNoise(p*.025),grain=materialNoise(p*.7);
 float slope=1.-abs(normalize(groundNormal).y);
 float rock=smoothstep(.15,.55,slope+macro*.08);
 float coast=290.+25.*cos(p.x*.009);
 float shoreBank=smoothstep(coast-14.,coast+1.,p.z)*(1.-smoothstep(coast+34.,coast+43.,p.z))*(1.-smoothstep(365.,415.,abs(p.x)));
 rock=max(rock,shoreBank*.92);
 float beach=1.-smoothstep(1.8,6.5,p.y+macro*2.);
 float bay=445.-60.*sin(3.14159265*clamp((p.x-600.)/480.,0.,1.));
 float sandCrescent=smoothstep(600.,625.,p.x)*(1.-smoothstep(1080.,1110.,p.x))*smoothstep(bay-57.,bay-50.,p.z);
 beach=max(beach,sandCrescent);
 float wet=1.-smoothstep(-.2,1.8,p.y);
 float soil=smoothstep(.66,.86,macro)*(1.-rock)*(1.-beach);
 vec3 grass=mix(vec3(.19,.27,.105),vec3(.32,.39,.19),macro);
 vec3 earth=mix(vec3(.25,.205,.13),vec3(.38,.31,.20),grain);
 vec3 stone=mix(vec3(.28,.30,.27),vec3(.48,.47,.40),macro);
 float strata=sin(p.y*.8+materialNoise(p*.12)*5.);stone*=.97+.03*strata;
 vec3 sand=mix(vec3(.65,.59,.43),vec3(.30,.34,.27),wet*.8);
 diffuseColor.rgb=mix(mix(mix(grass,earth,soil),stone,rock),sand,beach*(1.-rock*.85));
 float detail=1.-smoothstep(90.,650.,length(vViewPosition));
 diffuseColor.rgb*=1.+(grain-.5)*.10*detail;
 float materialHeight=(grain*.10+strata*.08*rock)*detail;
 `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=mix(.94,.48,wet)*(1.-groundWet*.25)+.035*(grain-.5);
 `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>\n${bump}`);
}
export function architecturalSurface(shader:THREE.WebGLProgramParametersWithUniforms,glass:boolean,foliage:boolean,finish:string=""){
 nightSurface(shader,'surfacePoint');
 shader.vertexShader='varying vec3 surfacePoint;varying vec3 surfaceOrigin;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec4 surfaceWorld=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 surfaceWorld=instanceMatrix*surfaceWorld;
 #endif
 surfacePoint=(modelMatrix*surfaceWorld).xyz;
 vec4 origin=vec4(0.,0.,0.,1.);
 #ifdef USE_INSTANCING
 origin=instanceMatrix*origin;
 #endif
 surfaceOrigin=(modelMatrix*origin).xyz;`);
 shader.fragmentShader='varying vec3 surfacePoint;varying vec3 surfaceOrigin;\n'+surfaceNoise+shader.fragmentShader;
 if(glass)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
// Window apertures, not luminous wall-sized hash cells. Horizontal caps stay dark.
vec3 wallNormal=abs(normalize(cross(dFdx(surfacePoint),dFdy(surfacePoint))));
float horizontal=wallNormal.z>wallNormal.x?surfacePoint.x:surfacePoint.z;
vec2 roomUV=vec2(horizontal/3.4,(surfacePoint.y-20.)/3.5),cell=floor(roomUV),uv=fract(roomUV);
vec2 aa=min(fwidth(roomUV),vec2(.25));
vec2 opening=smoothstep(vec2(.18,.16)-aa,vec2(.18,.16)+aa,uv)*(1.-smoothstep(vec2(.78,.78)-aa,vec2(.78,.78)+aa,uv));
float building=materialHash(vec3(floor(surfaceOrigin.xz/8.),7.));
float room=materialHash(vec3(cell,building*23.));
float floorUse=materialHash(vec3(cell.y,floor(surfaceOrigin.xz/8.)));
float occupied=step(mix(.61,.78,building),room)*step(.16,floorUse);
float aperture=opening.x*opening.y;
aperture=mix(aperture,.36,smoothstep(.35,.9,max(fwidth(roomUV.x),fwidth(roomUV.y))));
vec3 roomColor=mix(vec3(1.,.68,.35),vec3(.62,.80,1.),smoothstep(.48,.85,building));
totalEmissiveRadiance*=aperture*occupied*(.55+room*.45)*roomColor*(1.-step(.5,wallNormal.y));`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=materialNoise(surfacePoint*${foliage?'2.3':'.8'});
 float distanceFade=1.-smoothstep(80.,500.,length(vViewPosition));
 ${glass?`float pane=materialHash(floor(surfacePoint/vec3(4.,3.5,4.)));diffuseColor.rgb*=.82+.32*pane;`:`diffuseColor.rgb*=1.+(grain-.5)*${foliage?'.3':'.13'}*distanceFade;`}
 ${finish==='wood'?`float wood=sin(surfacePoint.y*8.+materialNoise(surfacePoint*vec3(4.,.18,4.))*5.);diffuseColor.rgb*=1.+wood*.09*distanceFade;`:finish==='tile'?`float tileLine=abs(sin(surfacePoint.x*7.))*abs(sin(surfacePoint.z*4.));diffuseColor.rgb*=1.-.13*(1.-smoothstep(.02,.10,tileLine))*distanceFade;`:finish==='paving'?`vec2 grid=abs(fract(surfacePoint.xz/1.8)-.5);float joint=max(grid.x,grid.y);diffuseColor.rgb*=1.-.12*smoothstep(.47,.49,joint)*distanceFade;`:''}
 float materialHeight=grain*${glass?'0.':foliage?'.025':'.035'}*distanceFade;
 `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>\n${bump}`);
}
