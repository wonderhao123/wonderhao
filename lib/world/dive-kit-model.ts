import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

type Point=[number,number,number];
/** Conventional white diving equipment, in metres with Y up. */
export function makeDiveKit(low:boolean,logo:THREE.Texture){
 const root=new THREE.Group();root.name='dive-kit-model';
 const segments=low?12:24,bevel=low?1:3;
 const fabric=new THREE.MeshStandardMaterial({color:'#eff1ef',roughness:.94});
 const white=new THREE.MeshStandardMaterial({color:'#f6f6f2',roughness:.4,metalness:.05});
 const rubber=new THREE.MeshStandardMaterial({color:'#353b3e',roughness:.92});
 const seam=new THREE.MeshStandardMaterial({color:'#9ca5a7',roughness:.9});
 const alloy=new THREE.MeshStandardMaterial({color:'#aab2b5',roughness:.35,metalness:.72});
 const glass=new THREE.MeshPhysicalMaterial({color:'#c8e3e5',roughness:.08,metalness:0,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide});
 const print=new THREE.MeshStandardMaterial({map:logo,transparent:true,alphaTest:.05,depthWrite:false,roughness:1});
 const add=(group:THREE.Group,g:THREE.BufferGeometry,m:THREE.Material,p:Point=[0,0,0],r:Point=[0,0,0])=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);group.add(o);return o;};
 const box=(g:THREE.Group,p:Point,size:Point,m:THREE.Material,r:Point=[0,0,0],radius=.025)=>add(g,new RoundedBoxGeometry(...size,bevel,radius),m,p,r);
 const tube=(g:THREE.Group,points:Point[],radius:number,m:THREE.Material)=>add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),low?16:32,radius,low?5:8,false),m);
 const ring=(g:THREE.Group,p:Point,radius:number,thickness:number,m:THREE.Material)=>add(g,new THREE.TorusGeometry(radius,thickness,low?5:8,segments),m,p,[Math.PI/2,0,0]);
 const badge=(g:THREE.Group,p:Point,size:number)=>add(g,new THREE.PlaneGeometry(size,size*450/428),print,p);
 const named=(name:string)=>{const g=new THREE.Group();g.name=name;root.add(g);return g;};
 // Continuous, tapered sleeves and legs rather than articulated hard-shell parts.
 const sleeve=(g:THREE.Group,points:Point[],radii:number[])=>{
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps=low?20:40;
  const geo=new THREE.TubeGeometry(curve,steps,1,segments,false),p=geo.attributes.position;
  for(let i=0;i<=steps;i++){
   const t=i/steps,c=curve.getPointAt(t),at=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(at)),radius=THREE.MathUtils.lerp(radii[a],radii[a+1],at-a);
   for(let j=0;j<=segments;j++){const k=i*(segments+1)+j;p.setXYZ(k,c.x+(p.getX(k)-c.x)*radius,c.y+(p.getY(k)-c.y)*radius,c.z+(p.getZ(k)-c.z)*radius);}
  }
  geo.computeVertexNormals();add(g,geo,fabric);
  const cuff=ring(g,points[points.length-1],radii[radii.length-1],.014,rubber);
  cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),curve.getTangentAt(1));
 };
 const body=named('dive-kit-suit');
 const positions:number[]=[],indices:number[]=[];
 const sections=[[.015,.175,.105],[.14,.195,.12],[.32,.18,.12],[.54,.215,.135],[.77,.265,.14],[.9,.28,.125],[.985,.16,.09],[1.035,.105,.073]];
 for(const [y,rx,rz] of sections)for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz);}
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const torso=new THREE.BufferGeometry();torso.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));torso.setIndex(indices);torso.computeVertexNormals();add(body,torso,fabric);
 const collar=ring(body,[0,1.035,0],.105,.013,rubber);collar.scale.y=.7;
 // A small printed maker's mark, flat seams and a practical rear zipper.
 badge(body,[-.1,.765,.137],.068);
 tube(body,[[0,1.01,-.082],[0,.83,-.136],[0,.54,-.143],[0,.33,-.127]],.006,rubber);
 box(body,[0,.92,-.144],[.025,.052,.015],alloy,[0,0,0],.006);
 tube(body,[[0,.945,-.15],[.025,.81,-.16],[.013,.66,-.15]],.006,rubber);
 for(const side of [-1,1]){
  sleeve(body,[[side*.22,.845,0],[side*.38,.62,0],[side*.46,.25,.015]],[.105,.077,.056]);
  const shoulder=add(body,new THREE.SphereGeometry(1,segments,low?8:16),fabric,[side*.22,.845,0]);shoulder.scale.set(.109,.112,.106);
  sleeve(body,[[side*.096,.095,0],[side*.125,-.42,0],[side*.15,-.95,.01]],[.114,.087,.058]);
  tube(body,[[side*.22,.81,.09],[side*.175,.53,.091],[side*.155,.3,.082],[side*.175,.1,.06]],.003,seam);
 }
 // A normal two-lens mask with a silicone skirt, nose pocket and rear strap.
 const mask=named('dive-kit-mask');mask.position.set(0,1.285,.02);
 const lensPath=(s:number)=>{const p=new THREE.Shape();p.moveTo(-.09*s,.045*s);p.quadraticCurveTo(-.105*s,.075*s,-.065*s,.075*s);p.lineTo(.067*s,.06*s);p.quadraticCurveTo(.105*s,.055*s,.094*s,.015*s);p.lineTo(.073*s,-.05*s);p.quadraticCurveTo(.063*s,-.073*s,.025*s,-.073*s);p.lineTo(-.065*s,-.06*s);p.quadraticCurveTo(-.095*s,-.055*s,-.095*s,-.025*s);p.closePath();return p;};
 for(const side of [-1,1]){
  const frame=lensPath(1.12),inner=lensPath(.86);frame.holes.push(new THREE.Path(inner.getPoints(low?8:16)));
  const rim=add(mask,new THREE.ExtrudeGeometry(frame,{depth:.035,bevelEnabled:true,bevelSegments:bevel,bevelSize:.009,bevelThickness:.009,curveSegments:low?6:12}),white,[side*.113,0,0]);rim.scale.x=side;
  const lens=add(mask,new THREE.ShapeGeometry(lensPath(.86),low?8:16),glass,[side*.113,0,.034]);lens.scale.x=side;
  box(mask,[side*.238,0,-.013],[.045,.062,.045],rubber,[0,0,0],.012);
 }
 box(mask,[0,.025,.005],[.055,.04,.06],white,[0,0,0],.013);
 const nose=add(mask,new THREE.ConeGeometry(.052,.115,segments),white,[0,-.043,.035],[0,0,Math.PI]);nose.scale.z=1.2;
 tube(mask,[[-.24,0,-.015],[-.22,0,-.16],[0,0,-.25],[.22,0,-.16],[.24,0,-.015]],.017,rubber);
 // Broad white fin blades, dark foot pockets and moulded grey side rails.
 const fins=named('dive-kit-fins');fins.position.set(-.73,-.39,.015);fins.rotation.z=-.13;
 for(const side of [-1,1]){
  const fin=new THREE.Group();fin.position.x=side*.135;fin.position.z=side*.065;fins.add(fin);
  const blade=new THREE.Shape();blade.moveTo(-.07,.22);blade.lineTo(.07,.22);blade.lineTo(.128,-.36);blade.quadraticCurveTo(.14,-.45,.08,-.46);blade.lineTo(-.08,-.46);blade.quadraticCurveTo(-.14,-.45,-.128,-.36);blade.closePath();
  add(fin,new THREE.ExtrudeGeometry(blade,{depth:.02,bevelEnabled:true,bevelSegments:bevel,steps:1,bevelSize:.01,bevelThickness:.007,curveSegments:low?4:8}),white);
  box(fin,[0,.21,.055],[.145,.25,.09],white,[0,0,0],.04);
  const pocket=add(fin,new THREE.SphereGeometry(1,segments,low?8:16),rubber,[0,.25,.101]);pocket.scale.set(.056,.09,.018);
  for(const x of [-.075,.075])tube(fin,[[x,.05,.04],[x*1.35,-.17,.036],[x*1.5,-.38,.031]],.007,seam);
 }
 // Plain painted cylinder, two restraint bands, a valve and an ordinary regulator.
 const tank=named('dive-kit-cylinder');tank.position.set(.75,.33,-.04);tank.rotation.z=-.07;
 add(tank,new THREE.CapsuleGeometry(.168,.65,low?4:8,segments),white);
 add(tank,new THREE.CylinderGeometry(.148,.15,.105,segments),rubber,[0,-.43,0]);
 for(const y of [-.23,.23]){ring(tank,[0,y,0],.17,.017,rubber);box(tank,[0,y,.17],[.056,.045,.025],alloy,[0,0,0],.008);}
 add(tank,new THREE.CylinderGeometry(.036,.05,.125,segments),alloy,[0,.525,0]);
 add(tank,new THREE.CylinderGeometry(.037,.037,.05,segments),rubber,[.055,.55,0],[0,0,Math.PI/2]);
 badge(tank,[0,.015,.174],.067);
 tube(root,[[.75,.865,-.04],[1,.8,.01],[1,.39,.08],[.78,.25,.16],[.55,.52,.2]],.016,rubber);
 const regulator=add(root,new THREE.CylinderGeometry(.064,.064,.047,segments),rubber,[.54,.53,.21],[Math.PI/2,0,0]);regulator.name='dive-kit-regulator';
 add(root,new THREE.TorusGeometry(.053,.006,5,segments),alloy,[.54,.53,.24]);
 for(const x of [-.023,0,.023])box(root,[.54+x,.53,.241],[.009,.048,.008],alloy,[0,0,0],.003);
 return root;
}

export function disposeDiveKit(root:THREE.Group){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
