import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Rain-tree crowns: layered, spreading lobes instead of a single geometric ball. */
export function makeCanopy(simple=false){
 const pieces:THREE.BufferGeometry[]=[];
 for(let i=0;i<(simple?4:7);i++){
  const a=i*2.4,g=new THREE.SphereGeometry(1,simple?6:9,simple?4:6);const p=g.attributes.position;
  for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k),r=1+.12*Math.sin(x*7+y*5+z*9+i);p.setXYZ(k,x*r,y*r,z*r)}
  g.scale(i===0?.65:.54,i===0?.5:.34,i===0?.65:.54);
  g.translate(i===0?0:Math.cos(a)*.56,i===0?.35:.08+Math.sin(i*3)*.16,i===0?0:Math.sin(a)*.56);pieces.push(g);
 }
 const g=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());g.computeVertexNormals();return g;
}
/** Curved palm fronds with paired leaflets, opaque to avoid alpha overdraw. */
export function makePalm(){
 const vertices:number[]=[],indices:number[]=[];
 for(let f=0;f<9;f++){
  const a=f*Math.PI*2/9;const point=(r:number,y:number,w:number)=>[Math.cos(a)*r-Math.sin(a)*w,y,Math.sin(a)*r+Math.cos(a)*w];
  for(let i=0;i<11;i++){
   const t=i/11,next=(i+.85)/11,r=t,rr=next,w=Math.sin(t*Math.PI)*.22;
   for(const side of [-1,1]){
    const base=vertices.length/3;
    for(const p of [point(r,.5*Math.sin(t*2.7)-t*.38,0),point(rr,.5*Math.sin(next*2.7)-next*.38,0),point(r+.10,.5*Math.sin(t*2.7)-t*.38-.09,w*side)])vertices.push(...p);
    indices.push(base,base+1,base+2);
   }
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
/** Swept tiled eaves: section curvature and corner lift have structural thickness. */
export function makeTempleRoof(){
 const v:number[]=[],idx:number[]=[];const nx=20,nz=12;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=i/nx-.5,z=j/nz-.5,y=Math.pow(1-Math.abs(x)*2,1.8)+.15*Math.pow(Math.abs(z)*2,5)+.1*Math.pow(Math.abs(x)*2,8);
  v.push(x,y-layer*.06,z);
 }
 const stride=(nx+1)*(nz+1);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);const b=a+stride;idx.push(b,b+1,b+nx+1,b+1,b+nx+2,b+nx+1)}
 for(let j=0;j<=nz;j++)for(let i=0;i<nx;i++)if(j===0||j===nz){const a=j*(nx+1)+i;idx.push(a,a+1,a+stride,a+1,a+stride+1,a+stride)}
 for(let i=0;i<=nx;i++)for(let j=0;j<nz;j++)if(i===0||i===nx){const a=j*(nx+1)+i;idx.push(a,a+stride,a+nx+1,a+nx+1,a+stride,a+stride+nx+1)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function makeArch(){
 const s=new THREE.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,0);s.absarc(0,0,.5,0,Math.PI,false);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:16});g.translate(0,0,-.5);return g;
}

/** Irregular angular armourstone, with planar faces and a buried lower half. */
export function makeRock(){
 const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.19*Math.sin(x*4.1+y*7.3+z*5.7);p.setXYZ(i,x*r,Math.max(-.65,y*r),z*r)}
 g.computeVertexNormals();return g;
}

/** Shared unit hull for marina boats and the moored container feeder. Bow faces -Z. */
export function makeBoatHull(){
 const outline=new THREE.Shape();outline.moveTo(-.38,-.5);outline.lineTo(.38,-.5);outline.lineTo(.5,.12);outline.lineTo(.32,.37);outline.lineTo(0,.5);outline.lineTo(-.32,.37);outline.lineTo(-.5,.12);outline.closePath();
 const g=new THREE.ExtrudeGeometry(outline,{depth:.85,bevelEnabled:true,bevelSize:.04,bevelThickness:.075,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);g.translate(0,-.425,0);return g;
}

/** Unit pointed arch, centred in XY; a real open-bottom frame for walk-through cloisters. */
export function makeGothicArch(frame=true){
 const s=new THREE.Shape();
 s.moveTo(-.5,-.5);s.lineTo(-.5,.03);s.quadraticCurveTo(-.48,.28,0,.5);s.quadraticCurveTo(.48,.28,.5,.03);s.lineTo(.5,-.5);
 if(frame){
  s.lineTo(.4,-.5);s.lineTo(.4,.02);s.quadraticCurveTo(.39,.22,0,.4);s.quadraticCurveTo(-.39,.22,-.4,.02);s.lineTo(-.4,-.5);
 }
 s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:12});g.translate(0,0,-.5);return g;
}

/** A rising masonry arch transfers nave thrust into an outer aisle pier. */
export function makeFlyingButtress(){
 const s=new THREE.Shape();s.moveTo(-.5,-.5);s.bezierCurveTo(-.35,.04,.10,.43,.5,.5);s.lineTo(.5,.35);s.bezierCurveTo(.10,.28,-.27,-.10,-.5,-.64);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:12});g.translate(0,0,-.5);return g;
}
