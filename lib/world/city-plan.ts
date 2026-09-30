/** Authored city survey. One unit is one metre; north is negative Z. */
export type V3 = [number, number, number];
export type P2 = [number, number];
export const CITY = { width: 7168, depth: 5120, tile: 256, sea: 0, version: 3 };
export const sites = {
  town: [0, 20, 0], commons: [80, 76, -480], archive: [-220, 20, 65],
  station: [-220, 20, -145], atelier: [145, 20, 150], arrival: [100, 8, 510],
  works: [-640, 9, 230], dive: [480, 7, 270], airport: [2150, 14, -80],
} satisfies Record<string, V3>;
/** Original peripheral assets retain their real dimensions, translated onto the new coast. */
export const relocation = {commons:[0,-20,200], arrival:[0,0,-1000], works:[1250,0,-1100], dive:[-1060,0,-1380]} satisfies Record<string,V3>;
export type Road = { id: string; points: V3[]; width: number; mountain?: boolean; freight?: boolean };
export const roadNodes = {
  nw: [-340,20,-280], n: [0,20,-280], ne: [340,20,-280],
  w: [-340,20,0], c: [0,20,0], e: [340,20,0],
  sw: [-340,20,230], s: [0,20,230], se: [340,20,230],
  archive: [-340,20,65], station: [-340,20,-145],
  port: [100,8,460], dive: [480,7,210], works: [-520,9,200],
  airport: [2020,14,-80], utilities: [-610,20,-120],
} satisfies Record<string,V3>;
const N = roadNodes;
export const roadNetwork: Road[] = [
  {id:'north-west',points:[N.nw,N.n],width:15},{id:'north-east',points:[N.n,N.ne],width:15},
  {id:'west',points:[N.nw,N.station,N.w,N.archive,N.sw],width:11},{id:'east',points:[N.ne,N.e,N.se],width:14},
  {id:'south-west',points:[N.sw,[-210,20,240],N.s],width:10},{id:'south-east',points:[N.s,[180,20,235],N.se],width:10},
  {id:'town-west',points:[N.w,N.c],width:12},{id:'town-east',points:[N.c,N.e],width:16},
  {id:'town-north',points:[N.n,N.c],width:14},{id:'town-south',points:[N.c,N.s],width:10},
  {id:'archive-link',points:[N.nw,N.station,N.w,N.archive],width:11},
  {id:'research-link',points:[N.archive,N.w,N.station],width:11},
  {id:'citadel-ascent',points:[N.station,[-410,23,-250],[-435,34,-390],[-380,44,-520],[-230,58,-600],[-60,72,-570],[80,76,-410]],width:8,mountain:true},
  {id:'citadel-service',points:[N.station,[-340,23,-225],[-250,31,-340],[-100,44,-375],[70,57,-355],[145,64,-480]],width:7,mountain:true},
  {id:'passenger-link',points:[N.s,[0,16,310],[100,8,460]],width:14},
  {id:'airport-link',points:[N.e,[720,20,0],[1200,18,-80],N.airport],width:16},
  {id:'reef-link',points:[N.e,[470,13,110],N.dive],width:10},
  {id:'western-link',points:[N.w,[-470,20,0],N.utilities],width:12},
  {id:'industrial-link',points:[N.utilities,[-565,16,40],[-410,9,200],N.works,[-670,9,200]],width:16,freight:true},
  {id:'bus-west',points:[N.archive,[-470,20,65],N.utilities],width:10},
];
export function smooth(t:number){return t*t*(3-2*t)}
export function clamp(v:number,a=0,b=1){return Math.max(a,Math.min(b,v))}
export function segment(x:number,z:number,a:V3,b:V3){
 const dx=b[0]-a[0],dz=b[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1));
 return {d:Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t),y:a[1]+(b[1]-a[1])*t,t};
}
/** Rounded junction approaches retain endpoint coordinates and monotone grades. */
export function sampleRoad(r:Road):V3[]{
 const pts:V3[]=[r.points[0]];
 for(let i=1;i<r.points.length-1;i++){
  const a=r.points[i-1],b=r.points[i],c=r.points[i+1];
  const trim=Math.min(45,Math.hypot(b[0]-a[0],b[2]-a[2])*.18,Math.hypot(c[0]-b[0],c[2]-b[2])*.18);
  const ab=Math.hypot(b[0]-a[0],b[2]-a[2]),bc=Math.hypot(c[0]-b[0],c[2]-b[2]);
  const p=b.map((v,k)=>v+(a[k]-v)*trim/ab) as V3,q=b.map((v,k)=>v+(c[k]-v)*trim/bc) as V3;
  pts.push(p);for(let j=1;j<=8;j++){const t=j/8;pts.push(p.map((v,k)=>(1-t)**2*v+2*(1-t)*t*b[k]+t*t*q[k]) as V3)}
 }
 pts.push(r.points.at(-1)!);return pts;
}
export const sampledRoads=roadNetwork.map(r=>({...r,points:sampleRoad(r)}));
const roadBounds=sampledRoads.map(r=>({r,minX:Math.min(...r.points.map(p=>p[0]))-110,maxX:Math.max(...r.points.map(p=>p[0]))+110,minZ:Math.min(...r.points.map(p=>p[2]))-110,maxZ:Math.max(...r.points.map(p=>p[2]))+110}));
export const streams:V3[][]=[
 [[-450,28,-860],[-550,22,-600],[-590,16,-320],[-555,5,-100],[-460,-1,370]],
 [[-680,24,-520],[-640,21,-440],[-590,16,-320]],
];
export function channel(x:number,z:number){let d=Infinity,y=0,width=24;streams.forEach((s,j)=>{for(let i=1;i<s.length;i++){const q=segment(x,z,s[i-1],s[i]);if(q.d<d){d=q.d;y=q.y;width=j?14:24+i*2}}});return {d,y,width}}
/** Complete skew bridge spans, derived from the same road and river centrelines. */
export const bridges=sampledRoads.flatMap(road=>{
 const result:{id:string;centre:V3;width:number;length:number;heading:number;water:number}[]=[];
 for(let i=1;i<road.points.length;i++)for(const stream of streams)for(let j=1;j<stream.length;j++){
  const a=road.points[i-1],b=road.points[i],c=stream[j-1],d=stream[j];
  const rx=b[0]-a[0],rz=b[2]-a[2],sx=d[0]-c[0],sz=d[2]-c[2],cross=rx*sz-rz*sx;if(Math.abs(cross)<.001)continue;
  const qx=c[0]-a[0],qz=c[2]-a[2],t=(qx*sz-qz*sx)/cross,u=(qx*rz-qz*rx)/cross;
  if(t<0||t>1||u<0||u>1)continue;
  const centre:V3=[a[0]+rx*t,a[1]+(b[1]-a[1])*t,a[2]+rz*t],water=c[1]+(d[1]-c[1])*u;
  if(centre[1]<water+3||result.some(v=>Math.hypot(v.centre[0]-centre[0],v.centre[2]-centre[2])<20))continue;
  result.push({id:road.id+'-'+i+'-'+j,centre,width:road.width,length:(channel(centre[0],centre[2]).width+22)/Math.max(.2,Math.abs(cross)/Math.hypot(rx,rz)/Math.hypot(sx,sz)),heading:Math.atan2(rx,rz),water});
 }
 return result;
});
export const airport={runway:{x:2460,z:0,length:2400,width:45,y:14},taxiX:2350,terminal:[2150,14,-80] as V3};
export const harbours={cruise:{x:100,z:730,length:220,beam:32},ferry:[[-85,720],[10,720]] as P2[],supply:[[-780,440],[-590,440]] as P2[],drydock:{x:-940,z:265,length:100,width:28}};
export function baseHeight(x:number,z:number){
 // A compact peninsula, an outer airfield and water between; never a uniformly scaled island.
 const main=1-Math.hypot(x/790,(z+400)/920);
 const air=1-Math.hypot((x-2380)/310,z/1510);
 let h=Math.min(20,Math.max(main*220,air*150));
 const rect=(cx:number,cz:number,w:number,d:number,y:number,blend:number)=>{const dist=Math.max(Math.abs(x-cx)-w/2,Math.abs(z-cz)-d/2);const t=smooth(clamp(dist/blend));h=y*(1-t)+h*t};
 // Sheltered urban bay; continuous quays follow this edge.
 const coast=290+25*Math.cos(x*.009);
 if(x>-390&&x<410)h=Math.min(h,20-(z-coast)*.65);
 if(x>400&&x<700)h=Math.min(h,12-(z-285)*.22);
 h+=60*Math.exp(-(((x-80)/210)**2+((z+480)/180)**2));
 rect(0,-35,735,525,20,25);
 rect(80,-480,112,112,76,34);
 rect(2380,0,420,2620,14,65);rect(2070,-80,260,470,14,45);
 rect(100,490,290,115,8,20);rect(-730,140,520,180,9,35);rect(480,270,140,85,7,18);
 // Ship approaches and habitat must stay below sea level, including their hull footprints.
 if(z>545&&x>-180&&x<280)h=Math.min(h,-14-(z-545)*.025);
 if(z>230&&x>-1040&&x< -470)h=Math.min(h,-12-(z-230)*.035);
 if(z>320&&x>365&&x<700)h=Math.min(h,-5-(z-320)*.055);
 const w=channel(x,z);if(w.d<w.width/2+30){const t=smooth(clamp((w.d-w.width/2)/30));h=(w.y-2)*(1-t)+h*t}
 return h;
}
export function terrainHeight(x:number,z:number){
 let h=baseHeight(x,z);const w=channel(x,z);
 let nearest:{d:number;y:number;width:number;blend:number}|undefined;
 for(const b of roadBounds){if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)continue;
  for(let i=1;i<b.r.points.length;i++){
   const q=segment(x,z,b.r.points[i-1],b.r.points[i]);
   if(!nearest||q.d<nearest.d)nearest={...q,width:b.r.width,blend:b.r.mountain?32:12};
  }
 }
 if(nearest&&nearest.d<nearest.width/2+nearest.blend&&!(w.d<w.width/2+6&&nearest.y>w.y+3)){
  const t=smooth(clamp((nearest.d-nearest.width/2-3)/nearest.blend));h=(nearest.y-.18)*(1-t)+h*t;
 }
 if(Math.hypot(x-80,z+480)<55)h=76;
 if(Math.abs(x+940)<14&&Math.abs(z-265)<50)h=-2;
 return h;
}
export function hash(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
export type Weather='auto'|'sunny'|'cloudy'|'rain';
export function weatherAt(time:number,mode:Weather){
 const levels=[0,.65,1,.65,0],phase=Math.floor(time/180)%4,t=smooth(clamp((time%180-160)/20));
 return mode==='auto'?levels[phase]*(1-t)+levels[phase+1]*t:mode==='rain'?1:mode==='cloudy'?.65:0;
}
