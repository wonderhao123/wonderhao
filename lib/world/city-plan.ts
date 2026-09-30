/** Authored city survey. One unit is one metre; north is negative Z. */
export type V3 = [number, number, number];
export type P2 = [number, number];
export const CITY = { width: 7168, depth: 5120, tile: 256, sea: 0, version: 2 };
export const sites = {
  town: [0, 20, 0], commons: [80, 96, -680], archive: [-520, 24, -270],
  station: [-240, 39, -610], atelier: [225, 20, 165], arrival: [100, 8, 1510],
  works: [-1890, 9, 1330], dive: [1540, 7, 1650], airport: [2150, 14, -80],
} satisfies Record<string, V3>;
export type Road = { id: string; points: V3[]; width: number; mountain?: boolean; freight?: boolean };
export const roadNodes = {
  nw: [-360,20,-240], n: [0,20,-240], ne: [360,20,-240],
  w: [-360,20,0], c: [0,20,0], e: [360,20,0],
  sw: [-360,20,240], s: [0,20,240], se: [360,20,240],
  archive: [-520,24,-270], station: [-240,39,-610],
  port: [100,8,1460], dive: [1540,7,1590], works: [-1770,9,1300],
  airport: [2020,14,-80], utilities: [-1260,20,420],
} satisfies Record<string,V3>;
const N = roadNodes;
export const roadNetwork: Road[] = [
  {id:'north-west',points:[N.nw,N.n],width:14},{id:'north-east',points:[N.n,N.ne],width:14},
  {id:'west',points:[N.nw,N.w,N.sw],width:14},{id:'east',points:[N.ne,N.e,N.se],width:14},
  {id:'south-west',points:[N.sw,N.s],width:14},{id:'south-east',points:[N.s,N.se],width:14},
  {id:'town-west',points:[N.w,N.c],width:12},{id:'town-east',points:[N.c,N.e],width:12},
  {id:'town-north',points:[N.n,N.c],width:12},{id:'town-south',points:[N.c,N.s],width:12},
  {id:'archive-link',points:[N.nw,N.archive],width:10},
  {id:'research-link',points:[N.archive,[-620,28,-400],[-430,34,-560],N.station],width:10},
  {id:'citadel-ascent',points:[N.station,[-240,49,-850],[-80,60,-950],[160,72,-930],[300,84,-790],[210,96,-610],[80,96,-610]],width:10,mountain:true},
  {id:'citadel-service',points:[N.station,[-50,48,-510],[240,66,-480],[260,78,-650],[145,84,-680]],width:8,mountain:true},
  {id:'passenger-link',points:[N.s,[0,18,610],[100,12,1060],N.port],width:18},
  {id:'airport-link',points:[N.e,[720,20,0],[1200,18,-80],N.airport],width:20},
  {id:'reef-link',points:[N.se,[730,17,520],[1160,12,1110],N.dive],width:12},
  {id:'western-link',points:[N.w,[-820,20,0],[-1260,20,100],N.utilities],width:18},
  {id:'industrial-link',points:[N.utilities,[-1490,16,760],[-1660,9,1300],N.works,[-1920,9,1300]],width:20,freight:true},
  {id:'freight-bypass',points:[N.works,[-1660,9,1300],[-1660,12,1120],[-2200,12,700],[-2050,19,-250],[-1400,28,-900],[-800,30,-1100],[350,28,-1250],[1200,18,-1050],[1840,14,-750],[2020,14,-750],N.airport],width:18,freight:true},
  {id:'bus-west',points:[N.archive,[-780,23,-270],[-1050,20,100],N.utilities],width:12},
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
 [[-750,67,-1750],[-680,43,-1200],[-710,30,-750],[-720,13,-270],[-650,11,150],[-580,7,700],[-420,2,1250],[-340,-1,1700]],
 [[-1350,82,-1600],[-1100,47,-1200],[-710,30,-750]],
 [[520,78,-1650],[350,54,-1350],[-110,39,-1120],[-710,30,-750]],
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
export const harbours={cruise:{x:100,z:1730,length:220,beam:32},ferry:[[-85,1720],[10,1720]] as P2[],supply:[[-2030,1540],[-1840,1540]] as P2[],drydock:{x:-2190,z:1365,length:100,width:28}};
export function baseHeight(x:number,z:number){
 const edge=1-Math.hypot(x/3460,z/2410)+.027*Math.sin(x*.0014+z*.001)+.019*Math.sin(z*.0028);
 let h=Math.min(20,edge*280);
 const g=(cx:number,cz:number,sx:number,sz:number,k:number)=>k*Math.exp(-((x-cx)**2/sx**2+(z-cz)**2/sz**2));
 h+=clamp(edge*12)*(g(-1250,-1200,650,700,110)+g(250,-1500,800,450,110)+g(1050,-900,450,500,52));
 // Working and passenger shorelines are authored bays, not docks placed over dry land.
 const bay=(cx:number,start:number,span:number)=>Math.exp(-(((x-cx)/span)**4))*smooth(clamp((z-start)/160));
 h=h*(1-bay(60,1510,560))+(-12-(z-1670)*.03)*bay(60,1510,560);
 h=h*(1-bay(-1950,1320,490))+(-15-(z-1480)*.03)*bay(-1950,1320,490);
 const reef=bay(1590,1670,430);h=h*(1-reef)+(-3-clamp((z-1780)/400)*18)*reef;
 // Broad foothills supporting a deliberately terraced summit.
 h+=76*Math.exp(-(((x-80)/175)**2+((z+680)/180)**2));
 const summit=Math.hypot(x-80,z+680);if(summit<88)h=h*(smooth(clamp((summit-61)/27)))+96*(1-smooth(clamp((summit-61)/27)));
 // Town, airport and service compounds have complete ground planes.
 const rect=(cx:number,cz:number,w:number,d:number,y:number,blend:number)=>{const dist=Math.max(Math.abs(x-cx)-w/2,Math.abs(z-cz)-d/2);const t=smooth(clamp(dist/blend));h=y*(1-t)+h*t};
 rect(0,0,810,560,20,80);rect(2380,0,420,2620,14,110);rect(2070,-80,260,470,14,70);
 rect(-520,-270,145,135,24,55);rect(-240,-610,90,90,39,40);
 rect(100,1490,300,140,8,40);rect(-1980,1260,520,180,9,80);rect(1540,1650,140,85,7,25);rect(-1260,420,180,180,20,45);
 const w=channel(x,z);if(w.d<w.width/2+130){const t=smooth(clamp((w.d-w.width/2)/130));h=(w.y-2)*(1-t)+h*t}
 return h;
}
export function terrainHeight(x:number,z:number){
 let h=baseHeight(x,z);const w=channel(x,z);
 let nearest:{d:number;y:number;width:number;blend:number}|undefined;
 for(const b of roadBounds){if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)continue;
  for(let i=1;i<b.r.points.length;i++){
   const q=segment(x,z,b.r.points[i-1],b.r.points[i]);
   if(!nearest||q.d<nearest.d)nearest={...q,width:b.r.width,blend:b.r.mountain?100:30};
  }
 }
 if(nearest&&nearest.d<nearest.width/2+nearest.blend&&!(w.d<w.width/2+6&&nearest.y>w.y+3)){
  const t=smooth(clamp((nearest.d-nearest.width/2-4)/nearest.blend));h=(nearest.y-.18)*(1-t)+h*t;
 }
 if(Math.hypot(x-80,z+680)<54)h=96;
 if(Math.abs(x+2190)<14&&Math.abs(z-1365)<50)h=-2;
 return h;
}
export function hash(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
export type Weather='auto'|'sunny'|'cloudy'|'rain';
export function weatherAt(time:number,mode:Weather){
 const levels=[0,.65,1,.65,0],phase=Math.floor(time/180)%4,t=smooth(clamp((time%180-160)/20));
 return mode==='auto'?levels[phase]*(1-t)+levels[phase+1]*t:mode==='rain'?1:mode==='cloudy'?.65:0;
}
