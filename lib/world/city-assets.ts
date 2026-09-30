import {makeArchitecture} from './city-architecture';
import { sites, terrainHeight, channel, sampledRoads, hash, airport, segment, relocation } from './city-plan';
export type Part=[shape:number,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,ry:number];
export type Region='town'|'commons'|'airport'|'arrival'|'works'|'dive'|'archive'|'station'|'nature';
export function makeRegion(region:Region):Part[]{
 if(region==='town')return makeArchitecture();
 if(region==='archive'||region==='station')return [];
 const offset=region in relocation&&region!=='commons'?relocation[region as keyof typeof relocation]:null;
 const parts:Part[]=[];const b=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>parts.push([0,c,x,y,z,w,h,d,r]);
 const cyl=(c:string,x:number,y:number,z:number,r:number,h:number)=>parts.push([1,c,x,y,z,r,h,r,0]);
 const tree=(x:number,z:number,i:number,s=1)=>{const y=terrainHeight(x+(offset?.[0]??0),z+(offset?.[2]??0))-(offset?.[1]??0),c=['#557a43','#416b42','#6b8b50','#4d7649'][i%4];cyl('#8c8064',x,y+2.5*s,z,.3*s,5*s);parts.push([6,c,x,y+6*s,z,5*s,4*s,5*s,hash(i)*6]);};
 const pavement=(x:number,z:number,w:number,d:number,y=20)=>{b('#cdd0bd',x,y+.14,z,w,.28,d);};
 const building=(x:number,z:number,w:number,d:number,floors:number,color='#ecece0',base=20)=>{
 const h=floors*3.5; b('#b8bba9',x,base+.35,z,w+2,.7,d+2);b(color,x,base+h/2+.7,z,w,h,d);
 b('#f6f4e8',x,base+h+.85,z,w+1.2,.35,d+1.2);b('#a6b7a4',x,base+h+1.08,z,w-1,.14,d-1);
 for(let f=0;f<floors;f++){
  const y=base+2.4+f*3.5;
  for(let k=0;k<Math.floor(w/4);k++){const px=x-w/2+2+k*4;for(const s of [-1,1]){b('#638c94',px,y,z+s*(d/2+.05),1.9,1.7,.12);b('#f4f2e5',px,y+1,z+s*(d/2+.38),2.3,.16,.8)}}
  for(let k=0;k<Math.floor(d/4);k++){const pz=z-d/2+2+k*4;for(const s of [-1,1])b('#70979a',x+s*(w/2+.05),y,pz,.12,1.7,1.9)}
  b('#d6dbc8',x,y+1.2,z+d/2+.15,w,.16,.6);
 }
 b('#284e58',x,base+1.65,z+d/2+.12,3,3.2,.24);b('#f5f0dc',x,base+3.7,z+d/2+2,5,.3,4);
 pavement(x,z+d/2+7,5,10,base);b('#839691',x-w/4,base+h+1.8,z,3,1.4,3);
 };
 const lamp=(x:number,z:number,y:number)=>{cyl('#728383',x,y+3,z,.12,6);b('#f5eac7',x+1,y+6,z,2.4,.25,.7)};
 const shed=(x:number,z:number,w:number,d:number,y=9)=>{building(x,z,w,d,2,'#dddcc8',y);b('#667e83',x,y+8.4,z,w+2,.5,d+2);for(let i=-1;i<=1;i++)b('#8a9a98',x+i*w/4,y+2.3,z+d/2+.2,5,4,.25)};
 if(region==='commons'){
  const [x,y,z]=sites.commons;
  pavement(x,z+60,45,20,y);b('#293d50',x,y+3,z+48,12,6,1);b('#f6f5ee',x,y+7,z+56,18,.6,16);b('#A66BFF',x,y+7.4,z+63.8,18,.16,.2);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;tree(x+Math.sin(a)*26,z+Math.cos(a)*26,i,.65)}
  cyl('#43616b',x,y+.25,z,10,.5);cyl('#9bd0c7',x,y+.6,z,8,.3);
 }
 if(region==='airport'){
  const {runway:r}=airport;
  pavement(2380,0,420,2620,14);b('#747e7e',r.x,14.3,0,45,.3,2400);b('#a4afa5',2350,14.31,0,23,.3,2360);
  for(let z=-1180;z<1200;z+=45)b('#f6f4e5',r.x,14.5,z,1.2,.04,22);
  for(const end of [-1,1])for(let i=-3;i<=3;i++)b('#f6f4e5',r.x+i*5,14.52,end*1140,2.4,.05,32);
  for(let z=-1150;z<=1150;z+=230){b('#b5beb2',2405,14.3,z,110,.3,22);for(const x of [2435,2485])cyl('#e7d9a3',x,14.65,z,.5,.3)}
  pavement(2225,-80,230,420,14);building(2110,-80,85,200,3,'#f0f0e6',14);
  b('#a0b9b7',2160,21,-80,6,6,190);
  for(let i=0;i<8;i++){b('#89acb3',2110,26,-164+i*24,63,.3,15);b('#f4f0e3',2110,26.4,-172+i*24,77,.5,1.1);b('#ececdf',2162,21,-172+i*24,.7,8,1.1)}
  pavement(2043,-80,44,240,14);b('#829491',2041,14.4,-80,18,.15,240);b('#a9bdb4',2049,18,-80,9,.35,90);
  for(let i=0;i<7;i++)cyl('#e6e9dd',2049,16,-119+i*13,.16,4);
  b('#9eaaa0',2028,14.35,-80,42,.2,20);b('#e6e8dd',2165,25,-80,12,.5,206);
  for(const z of [-155,0]){b('#9aadb0',2190,19,z,48,4,5);b('#e8eadf',2208,18,z+4,6,6,10)}
  building(2040,145,17,17,8,'#e5e9dd',14);b('#3f6b76',2040,44,145,26,5,26);b('#eceee2',2040,47,145,28,.6,28);
  shed(2110,-390,95,65,14);shed(2070,340,65,38,14);
  for(let i=0;i<12;i++)tree(2000,-340+i*54,i,.8);
 }
 if(region==='arrival'){
  pavement(100,1500,215,110,8);building(100,1490,115,35,2,'#eee9d9',8);
  b('#567d89',100,17,1510,108,4,.3);b('#e6eee4',100,19.8,1511,124,.4,14);
  b('#c0bfaa',100,4,1690,24,8,270);b('#d7d6c5',100,8.2,1690,24,.5,270);
  for(const x of [-85,10]){b('#bfc4b6',x,3.5,1640,12,7,160);b('#b9c8c6',x-12,6,1720,24,2,4)}
  b('#c6cbbc',0,4,1560,210,8,18);b('#bac8c7',119,9,1680,18,2,5);
  pavement(100,1453,200,25,8);b('#82968e',100,8.35,1453,170,.2,12);for(let i=0;i<5;i++){b('#71979b',35+i*30,11.2,1438,22,.25,6);cyl('#e1e2d5',35+i*30,9.6,1438,.2,3.2);}
  for(let z=1570;z<1830;z+=25){cyl('#7c8987',86,7,z,1.1,3);lamp(98,z,8)}
  for(let i=0;i<9;i++)tree(10+i*24,1445,i,.85);
 }
 if(region==='works'){
  pavement(-1890,1290,365,140,9);for(let i=0;i<3;i++)shed(-2040+i*125,1250,85,55);
  for(const x of [-2045,-1855]){b('#b8bba9',x,4,1490,16,8,220);for(let i=0;i<7;i++){b(['#668b8b','#bf8060','#879d7d'][i%3],x+25+(i%2)*15,11,1280+Math.floor(i/2)*16,12,4,5);}}
  // A complete dry dock, its closed gate, keel blocks and travel crane.
  b('#67787c',-2190,-1,1365,28,2,100);
  for(const x of [-2208,-2172])b('#bdc2b4',x,4,1365,8,12,116);
  for(const z of [1309,1421])b('#9aa8a0',-2190,4,z,44,12,8);
  for(let z=1325;z<1410;z+=9)b('#8f998b',-2190,1,z,12,2,2);
  for(const x of [-2213,-2167]){b('#d8b574',x,21,1370,2,36,3);b('#5f7378',x,3,1370,7,2,18)}b('#dab875',-2190,39,1370,49,2,4);
  // Stepped breakwater leaves the approach channel open to the south.
  b('#a5ada0',-2290,1,1480,18,5,370);b('#a5ada0',-2200,1,1660,180,5,18);
  for(let k=0;k<2;k++){const x=-2030+k*185;b('#d7b271',x,28,1405,3,40,3);b('#d7b271',x+16,46,1405,35,2,3);b('#465e64',x+32,34,1405,.2,24,.2)}
 }
 if(region==='dive'){
  const [x,y,z]=[1540,7,1650];pavement(x,z,130,80,y);building(x-20,z-5,52,24,1,'#f1eee2',y);b('#788e8e',x+36,y+3,z-8,34,.4,25);
  for(const px of [x+22,x+50])for(const pz of [z-18,z+2])cyl('#e1e5d7',px,y+1.5,pz,.22,3);
  b('#b49d79',x,4,1730,7,.4,100);for(let i=0;i<11;i++){const zz=1690+i*9;for(const xx of [x-3,x+3])cyl('#687d76',xx,1,zz,.2,6)}
  for(let i=0;i<7;i++)b('#cbd2c4',x+3.7,3.8-i*.55,1770,.25,.12,2);
  b('#9fc9bb',x+45,y+.15,z+18,18,.12,14);for(let i=0;i<9;i++)tree(x-55+i*14,z-37,i,.8);
 }
 if(region==='nature'){
  const compounds=(['town','commons','airport','arrival','works','dive','archive','station'] as Region[]).flatMap(makeRegion).filter(p=>p[0]===0&&p[5]>12&&p[7]>12);
  for(let i=0;i<2100;i++){
   const x=(hash(i+300)-.5)*2300,z=(hash(i+8700)-.5)*2000-350,y=terrainHeight(x,z);
   if(y<3||Math.abs(x)<380&&z>-380&&z<330||Math.abs(x-2380)<360&&Math.abs(z)<1400||Math.hypot(x-80,z+480)<100||channel(x,z).d<35)continue;
   if(compounds.some(p=>Math.abs(x-p[2])<p[5]/2+5&&Math.abs(z-p[4])<p[7]/2+5))continue;
   if(Object.values(sites).some(p=>Math.hypot(x-p[0],z-p[2])<115))continue;
   let near=false;for(const r of sampledRoads){for(let k=1;k<r.points.length;k++)if(segment(x,z,r.points[k-1],r.points[k]).d<r.width/2+8)near=true;}if(near)continue;
   tree(x,z,i,1+hash(i)*1.4);
  }

 }
 return offset?parts.map(p=>[p[0],p[1],p[2]+offset[0],p[3]+offset[1],p[4]+offset[2],...p.slice(5)] as Part):parts;
}
