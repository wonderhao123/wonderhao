import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
type V3=[number,number,number];
export type TransportFinish='paint'|'glass'|'metal'|'rubber'|'accent'|'lamp'|'red'|'deck';
export type TransportBatch={finish:TransportFinish;geometry:THREE.BufferGeometry};
/** Each finish is one mesh, irrespective of the number of windows, rails or fittings. */
function builder(){
 const parts=new Map<TransportFinish,THREE.BufferGeometry[]>();
 const add=(finish:TransportFinish,g:THREE.BufferGeometry,p:V3=[0,0,0],r:V3=[0,0,0])=>{
  g.rotateX(r[0]);g.rotateY(r[1]);g.rotateZ(r[2]);g.translate(...p);
  const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();
  const list=parts.get(finish)??[];list.push(flat);parts.set(finish,list);
 };
 const box=(f:TransportFinish,p:V3,s:V3,r:V3=[0,0,0],radius=0)=>add(f,radius?new RoundedBoxGeometry(...s,1,Math.min(radius,...s.map(v=>v/2))):new THREE.BoxGeometry(...s),p,r);
 const rod=(f:TransportFinish,a:V3,b:V3,r:number)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const g=new THREE.CylinderGeometry(r,r,delta.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));add(f,g,start.add(end).multiplyScalar(.5).toArray() as V3)};
 const finish=():TransportBatch[]=>[...parts].map(([finish,list])=>{const geometry=mergeGeometries(list);list.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();return {finish,geometry}});
 return {add,box,rod,finish};
}
export function makeCarBody(bus=false){
 const b=builder(),w=bus?2.5:1.8,l=bus?10:4.4;
 b.box('paint',[0,.83,0],[w,1.02,l],[0,0,0],.18);
 b.box('rubber',[0,.31,0],[w*.85,.24,l*.91]);
 b.box('glass',[0,bus?1.86:1.55,bus?0:-.12],[w-.18,bus?1.12:.78,bus?9.5:2.55],[0,0,0],bus?.12:.35);
 b.box('paint',[0,bus?2.46:1.97,bus?0:-.22],[w-.12,.15,bus?9.55:1.85],[0,0,0],.07);
 for(const side of [-1,1]){
  for(const z of bus?[-3.9,-2.5,-1.1,.3,1.7,3.1,4.1]:[-.95,.05,.85])b.box('paint',[side*(w/2-.035),bus?1.86:1.6,z],[.07,bus?1.12:.6,.085]);
  b.box('metal',[side*(w/2+.012),1.25,0],[.04,.06,l*.87]);
  for(const z of bus?[-2.7,3.4]:[-.56,.68])b.box('metal',[side*(w/2+.035),1.15,z],[.04,.06,.25]);
  b.box('paint',[side*(w/2+.14),bus?2.1:1.52,bus?4.5:1.05],[.25,.15,.32],[0,0,0],.06);
  b.box('lamp',[side*w*.33,.92,l/2+.01],[w*.22,.17,.06],[0,0,0],.02);
  b.box('red',[side*w*.35,.94,-l/2-.01],[w*.17,.20,.06],[0,0,0],.02);
 }
 b.box('rubber',[0,.72,l/2+.025],[w*.43,.22,.05]);
 for(const z of [-1,1]){b.box('metal',[0,.49,z*l/2],[w*.89,.10,.09]);b.box('lamp',[0,.61,z*(l/2+.055)],[.32,.1,.025]);}
 if(bus){b.box('rubber',[0,2.04,4.80],[1.6,.28,.04]);b.box('lamp',[0,2.04,4.83],[.85,.08,.02]);b.box('metal',[0,2.56,-1.8],[1.6,.25,1.8],[0,0,0],.08);}
 return b.finish();
}
export function makeAircraft(){
 const b=builder();
 // A lathed profile gives the cockpit a rounded nose and the tail a gradual taper.
 const profile=[[-18,.05],[-17,.36],[-15,.95],[-12.5,1.65],[-10,1.75],[10.5,1.75],[13,1.57],[15,1.15],[16.5,.65],[17.3,.12]].map(([z,r])=>new THREE.Vector2(r,z));
 const body=new THREE.LatheGeometry(profile,28);body.rotateX(Math.PI/2);b.add('paint',body);
 const wing=(outline:[number,number][],y:number)=>{const s=new THREE.Shape();outline.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.22,bevelEnabled:false});g.rotateX(-Math.PI/2);b.add('paint',g,[0,y,0]);};
 wing([[-1,3],[-17,-5],[-17,-7],[-1,-2],[1,-2],[17,-7],[17,-5],[1,3]],-.2);
 wing([[-.6,-11],[-6,-14],[-6,-15.5],[0,-14],[6,-15.5],[6,-14],[.6,-11]],.6);
 const tail=new THREE.Shape();tail.moveTo(-15,0);tail.lineTo(-15,6.3);tail.lineTo(-13.1,6.1);tail.lineTo(-9.7,0);tail.closePath();const fin=new THREE.ExtrudeGeometry(tail,{depth:.35,bevelEnabled:false});fin.rotateY(-Math.PI/2);b.add('accent',fin,[.175,0,0]);
 for(const side of [-1,1]){
  const cockpit=new THREE.SphereGeometry(1,12,8);cockpit.scale(.88,.45,1.15);b.add('glass',cockpit,[side*.65,1.22,13.15]);
  for(let i=0;i<17;i++)b.box('glass',[side*1.71,.62,-10+i*1.3],[.065,.43,.5],[0,0,0],.12);
  for(const z of [-10.6,9.8]){b.box('metal',[side*1.69,0,z],[.045,1.5,.75],[0,0,0],.09);b.box('paint',[side*1.72,0,z],[.045,1.35,.61],[0,0,0],.07);}
  b.box('accent',[side*1.74,-.4,0],[.035,.12,22]);
  // Open nacelle lips and recessed intake fan; no capped white engine cylinders.
  const engine=new THREE.CylinderGeometry(1.05,.9,4.3,24,1,true);b.add('paint',engine,[side*6,-1.3,-1],[Math.PI/2,0,0]);
  b.add('metal',new THREE.TorusGeometry(.99,.1,6,24),[side*6,-1.3,1.18]);
  b.add('rubber',new THREE.CircleGeometry(.9,24),[side*6,-1.3,.94]);
  b.add('metal',new THREE.ConeGeometry(.24,.65,12),[side*6,-1.3,1.03],[Math.PI/2,0,0]);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;b.box('metal',[side*6+Math.cos(a)*.53,-1.3+Math.sin(a)*.53,.96],[.55,.045,.025],[0,0,a+.4]);}
  b.box('paint',[side*6,-.5,-1],[.4,1.2,2.2]);
  b.box('accent',[side*16.85,.6,-6],[.22,1.8,1.8],[0,0,-side*.15]);
  b.box(side<0?'red':'lamp',[side*17,.9,-5.5],[.18,.16,.35]);
  b.rod('metal',[side*1.55,-1.2,-3],[side*1.9,-2.7,-3],.1);
  b.add('rubber',new THREE.CylinderGeometry(.48,.48,.65,12),[side*1.9,-2.65,-3],[0,0,Math.PI/2]);
 }
 b.rod('metal',[0,-1.1,10],[0,-2.7,10],.09);b.add('rubber',new THREE.CylinderGeometry(.35,.35,.5,12),[0,-2.8,10],[0,0,Math.PI/2]);
 return b.finish();
}
export function makeShipDeck(kind:number,l:number,w:number){
 const b=builder(),cruise=kind===0,decks=cruise?6:2;
 b.box('deck',[0,2,0],[w*.82,2,l*.85],[0,0,0],1);
 for(let i=0;i<decks;i++){
  const width=w*(.75-i*.04),length=l*(.69-i*.065),y=4+i*2.8,z=-l*.05;
  b.box('paint',[0,y,z],[width,2.5,length],[0,0,0],.7);
  b.box('glass',[0,y,z+length/2+.025],[width*.90,1.3,.08]);
  for(const side of [-1,1]){
   b.box('glass',[side*(width/2+.02),y,z],[.08,1.1,length*.92]);
   b.box('paint',[side*(width/2+.13),y-1,z],[.3,.2,length*.95]);
   for(let t=-length*.44;t<length*.45;t+=2.4)b.box('paint',[side*(width/2+.08),y,z+t],[.11,1.15,.16]);
  }
 }
 // Continuous deck rails with repeated stanchions, all batched into the metal finish.
 for(const side of [-1,1]){
  for(const y of [3.3,4.1])b.rod('metal',[side*w*.4,y,-l*.37],[side*w*.4,y,l*.37],.055);
  for(let z=-l*.37;z<=l*.37;z+=3.8)b.rod('metal',[side*w*.4,2.6,z],[side*w*.4,4.15,z],.045);
  for(let z=-l*.3;z<l*.32;z+=4)b.add('glass',new THREE.CircleGeometry(.26,10),[side*w*.411,2,z],[0,side*Math.PI/2,0]);
 }
 b.box('accent',[0,cruise?22:11,-l*.16],[w*.3,5,l*.08],[0,0,0],.5);
 b.box('rubber',[0,cruise?24.55:13.55,-l*.16],[w*.29,.15,l*.079]);
 if(cruise){
  b.box('deck',[0,20.45,l*.13],[10,.3,18],[0,0,0],.8);b.box('glass',[0,20.65,l*.13],[7.5,.12,14],[0,0,0],1);
  for(const side of [-1,1])for(let i=-1;i<=1;i++){
   b.box('accent',[side*w*.43,8.8,i*24],[2.6,1.6,10],[0,0,0],.7);
   b.box('paint',[side*w*.43,9.65,i*24],[2,.7,6.8],[0,0,0],.3);
   for(const z of [-3,3])b.rod('metal',[side*w*.33,11,i*24+z],[side*w*.46,10.5,i*24+z],.10);
  }
  for(const x of [-4,4])b.add('paint',new THREE.SphereGeometry(1.15,12,8),[x,22.4,-l*.02]);
 }
 const mast=cruise?26:15;b.rod('metal',[0,mast-5,-l*.12],[0,mast+1,-l*.12],.15);b.box('paint',[0,mast,-l*.12],[cruise?7:3,.25,.5]);
 if(kind>2)for(const x of [-1,1])for(let z=0;z<3;z++){const pos:V3=[x*w*.17,4,l*(.12+z*.07)];b.box('accent',pos,[w*.29,3,l*.06]);for(let i=-3;i<=3;i++)b.box('metal',[pos[0]+i*w*.035,4,pos[2]+l*.031],[.10,2.8,.035]);}
 return b.finish();
}
