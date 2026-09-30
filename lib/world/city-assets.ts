import { sites, terrainHeight, channel, sampledRoads, hash, airport, segment } from './city-plan';
export type Part=[shape:number,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,ry:number];
export type Region='town'|'commons'|'airport'|'arrival'|'works'|'dive'|'archive'|'station'|'nature';
export function makeRegion(region:Region):Part[]{
 const parts:Part[]=[];const b=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>parts.push([0,c,x,y,z,w,h,d,r]);
 const cyl=(c:string,x:number,y:number,z:number,r:number,h:number)=>parts.push([1,c,x,y,z,r,h,r,0]);
 const tree=(x:number,z:number,i:number,s=1)=>{const y=terrainHeight(x,z);cyl('#8c8064',x,y+2*s,z,.35*s,4*s);parts.push([i%4?2:3,['#8fa65f','#678b59','#aec57d','#75995e'][i%4],x,y+6*s,z,3*s,5*s,3*s,hash(i)*6]);};
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
 if(region==='town'){
  // Four legible neighbourhoods, each with a planted court and open perimeter streets.
  for(const [bx,bz] of [[-180,-120],[180,-120],[-180,120],[180,120]]){
   pavement(bx,bz,310,198);b('#9fbd74',bx,20.32,bz,260,.12,152);
   for(let i=0;i<5;i++){const x=bx-108+i*54;building(x,bz-54,39,28,5+i%4,['#eeeadd','#e5e7dc','#f1ecda'][i%3]);}
   for(let i=0;i<4;i++){const x=bx-95+i*62;building(x,bz+54,40,27,bz>0?3:6,'#e7eadf');}
   for(let i=0;i<10;i++)tree(bx-130+i*28,bz+12,i,1.35);
   for(let i=0;i<10;i++)tree(bx-130+i*28,bz-16,i+3,.95);
   pavement(bx,bz,270,5);pavement(bx,bz,5,145);
   for(let i=0;i<4;i++){b('#b5a68b',bx-80+i*52,20.7,bz+25,5,.65,1.2);lamp(bx-80+i*52,bz-24,20)}
  }
  // Public square and a shaded hawker pavilion, with individual stalls and tables.
  pavement(0,0,62,62);cyl('#ccd9c7',0,20.5,0,19,1);cyl('#68aaa6',0,21.1,0,13,.35);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;tree(Math.cos(a)*27,Math.sin(a)*27,i,.65)}
  pavement(-185,118,76,46);b('#eceddb',-185,25.7,118,72,.5,42);
  for(let i=0;i<8;i++){const x=-216+i*9;cyl('#e3e3d8',x,23,100,.24,6);b(['#bd704f','#88a78e','#d6ae72'][i%3],x,22,102,7.2,3,5);cyl('#bbaa84',x,21,127,1.6,1);}
  // Shaded shop edges, crossings and roof gardens make the blocks usable at street scale.
  for(const x of [-360,0,360])for(const z of [-240,0,240])for(const side of [-1,1])for(let stripe=0;stripe<7;stripe++){
   b('#eee9d9',x-4.5+stripe*1.5,20.55,z+side*14,.7,.04,4);
   b('#eee9d9',x+side*14,20.55,z-4.5+stripe*1.5,4,.04,.7);
  }
  for(let i=0;i<22;i++){const x=-320+i*30;for(const z of [-222,222]){tree(x,z,i+11,.9);lamp(x+10,z,20)}}
  for(let i=0;i<6;i++){const x=75+i*42;building(x,207,30,12,2,'#e8dac1');b(['#81a696','#c58d70','#b6ad7b'][i%3],x,24.4,216,28,.3,5);}
  // School, clinic, fire station and sports ground form the civic edge.
  building(-445,120,55,24,3,'#efe4c9');pavement(-448,190,100,64);b('#7daa83',-448,20.4,190,90,.1,54);
  for(const s of [-1,1]){b('#f2eee0',-448,20.48,190+s*25,87,.07,.35);b('#f2eee0',-448+s*43,20.48,190,.35,.07,50)}
  building(445,110,44,27,3,'#f4f4e8');b('#cf7961',445,29,124,6,1,.3);b('#cf7961',445,29,124,1,5,.32);
  shed(455,-90,46,24,20);for(let i=0;i<3;i++)b('#bb654b',440+i*14,22,-75,8,3,2);
  pavement(-402,142,90,5);pavement(402,130,90,5);pavement(405,-69,100,5);
  // Twin bus shelters and community market frontage.
  for(const x of [-27,27]){b('#748f91',x,23.4,55,16,.3,5);for(const z of [53,57])cyl('#82908b',x-6,21.7,z,.12,3.4);b('#b4a385',x,20.7,55,11,.45,1.2)}
  for(let i=0;i<52;i++){const a=i*Math.PI*2/52;tree(Math.cos(a)*530,Math.sin(a)*350,i,1.1)}
 }
 if(region==='archive'){const [x,y,z]=sites.archive;pavement(x,z,120,100,y);building(x,z,58,35,3,'#dddcca',y);for(let i=0;i<12;i++)tree(x-53+i*10,z-42,i,1.1);b('#e9e7dc',x,y+12,z,67,.5,44);}
 if(region==='station'){const [x,y,z]=sites.station;pavement(x,z,88,80,y);building(x,z,32,23,2,'#e6e8dc',y);cyl('#a5b7b8',x+25,y+12,z-15,2,24);parts.push([2,'#c7d3ce',x+25,y+26,z-15,5,2,5,0]);}
 if(region==='commons'){
  const [x,y,z]=sites.commons;
  // The superstructure is centred on the same survey anchor as the cutaway.
  for(let i=0;i<128;i++){
   const a=i*Math.PI*2/128,s=Math.sin(a),c=Math.cos(a),r=-a;
   b('#efeee8',x+s*42,y+5.5,z+c*42,2.45,10,12,r);
   for(const rad of [48.06,35.93]){b('#36515e',x+s*rad,y+3.2,z+c*rad,2.15,2.2,.2,r);b('#496574',x+s*rad,y+7.3,z+c*rad,2.15,2.2,.2,r);}
   for(const h of [.4,10.7])b('#A66BFF',x+s*48.25,y+h,z+c*48.25,2.45,.18,.25,r);
   b('#f9f8ef',x+s*42,y+10.9,z+c*42,2.5,.25,12.8,r);
  }
  pavement(x,z+60,45,20,y);b('#293d50',x,y+3,z+48,12,6,1);b('#f6f5ee',x,y+7,z+56,18,.6,16);b('#A66BFF',x,y+7.4,z+63.8,18,.16,.2);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;cyl('#7e9f73',x+Math.sin(a)*27,y+1,z+Math.cos(a)*27,3,2)}
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
  const [x,y,z]=sites.dive;pavement(x,z,130,80,y);building(x-20,z-5,52,24,1,'#f1eee2',y);b('#788e8e',x+36,y+3,z-8,34,.4,25);
  for(const px of [x+22,x+50])for(const pz of [z-18,z+2])cyl('#e1e5d7',px,y+1.5,pz,.22,3);
  b('#b49d79',x,4,1730,7,.4,100);for(let i=0;i<11;i++){const zz=1690+i*9;for(const xx of [x-3,x+3])cyl('#687d76',xx,1,zz,.2,6)}
  for(let i=0;i<7;i++)b('#cbd2c4',x+3.7,3.8-i*.55,1770,.25,.12,2);
  b('#9fc9bb',x+45,y+.15,z+18,18,.12,14);for(let i=0;i<9;i++)tree(x-55+i*14,z-37,i,.8);
 }
 if(region==='nature'){
  const compounds=(['town','commons','airport','arrival','works','dive','archive','station'] as Region[]).flatMap(makeRegion).filter(p=>p[0]===0&&p[5]>12&&p[7]>12);
  for(let i=0;i<5300;i++){
   const x=(hash(i+300)-.5)*6600,z=(hash(i+8700)-.5)*4300,y=terrainHeight(x,z);
   if(y<3||Math.abs(x)<570&&Math.abs(z)<420||Math.abs(x-2380)<360&&Math.abs(z)<1400||Math.hypot(x-80,z+680)<100||channel(x,z).d<35)continue;
   if(compounds.some(p=>Math.abs(x-p[2])<p[5]/2+5&&Math.abs(z-p[4])<p[7]/2+5))continue;
   if(Object.values(sites).some(p=>Math.hypot(x-p[0],z-p[2])<115))continue;
   let near=false;for(const r of sampledRoads){for(let k=1;k<r.points.length;k++)if(segment(x,z,r.points[k-1],r.points[k]).d<r.width/2+8)near=true;}if(near)continue;
   tree(x,z,i,1+hash(i)*1.4);
  }
  // Water, energy and recycling compounds lie on the western service road.
  pavement(-1260,420,175,175,20);for(let i=0;i<3;i++){cyl('#c3ccc3',-1310+i*48,23,390,18,6);cyl('#71a09b',-1310+i*48,26.1,390,16,.2)}
  shed(-1260,463,118,37,20);for(let i=0;i<20;i++)b('#466b80',-1330+(i%10)*15,22,495+Math.floor(i/10)*10,12,.3,7,-.08);
 }
 return parts;
}
