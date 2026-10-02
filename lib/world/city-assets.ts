import {makeArchitecture,finishArchitecture} from './city-architecture';
import { sites, mountainSites, terrainHeight, channel, sampledRoads, hash, airport, segment, bayShore, coastalLights } from './city-plan';
export type Part=[shape:number,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,ry:number,owner?:number];
export type Region='town'|'commons'|'airport'|'arrival'|'works'|'dive'|'archive'|'station'|'nature';
export function makeRegion(region:Region):Part[]{
 if(region==='town')return makeArchitecture();
 if(region==='archive'||region==='station')return [];
 const parts:Part[]=[];const b=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>parts.push([0,c,x,y,z,w,h,d,r]);
 const cyl=(c:string,x:number,y:number,z:number,r:number,h:number)=>parts.push([1,c,x,y,z,r,h,r,0]);
 const tree=(x:number,z:number,i:number,s=1)=>{const y=terrainHeight(x,z),c=['#557a43','#416b42','#6b8b50','#4d7649'][i%4];cyl('#8c8064',x,y+2.5*s,z,.3*s,5*s);parts.push([6,c,x,y+6*s,z,5*s,4*s,5*s,hash(i)*6]);};
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
 const walk=(ax:number,az:number,bx:number,bz:number,y:number,w:number,color='#d2c4a7')=>b(color,(ax+bx)/2,y,(az+bz)/2,w,.45,Math.hypot(bx-ax,bz-az)+.25,Math.atan2(bx-ax,bz-az));
 const parasol=(x:number,z:number,y:number,i:number,r=3)=>{cyl('#e5dcc5',x,y+1.5,z,.1,3);parts.push([3,i%3===0?'#67a6a2':'#efe0bc',x,y+3,z,r,.55,r,0]);};
 const yacht=(x:number,z:number,length:number,width:number,r=0)=>{parts.push([11,'#eeeee1',x,.7,z,width,1.6,length,r]);b('#a48864',x,1.2,z,width*.76,.3,length*.67,r);b('#e9eee6',x,2,z+.6,width*.64,1.6,length*.32,r);b('#36515e',x,2.8,z+.6,width*.58,.6,length*.28,r);};
 const shed=(x:number,z:number,w:number,d:number,y=9)=>{building(x,z,w,d,2,'#dddcc8',y);b('#667e83',x,y+8.4,z,w+2,.5,d+2);for(let i=-1;i<=1;i++)b('#8a9a98',x+i*w/4,y+2.3,z+d/2+.2,5,4,.25)};
 if(region==='commons'){
  const [x,y,z]=sites.commons;
  pavement(x,z+60,45,20,y);b('#293d50',x,y+3,z+48,12,6,1);b('#f6f5ee',x,y+7,z+56,18,.6,16);b('#A66BFF',x,y+7.4,z+63.8,18,.16,.2);
  // The courtyard, trees and water now belong to the Ring GLB.
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
  // Slender control tower, panoramic cab, overhanging roof and antenna.
  building(2030,130,35,25,1,'#d8ded6',14);
  cyl('#d8ded6',2040,33,145,5,38);cyl('#496574',2040,53,145,12,7);
  cyl('#e9eee5',2040,49.2,145,13,1.2);cyl('#e9eee5',2040,57,145,14,1.1);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;b('#d8ded6',2040+11.7*Math.cos(a),53,145+11.7*Math.sin(a),.55,7,.55)}
  cyl('#758985',2040,62,145,.32,10);b('#ff5056',2040,67.2,145,.65,.6,.65);
  b('#b5beb2',2405,14.3,1050,110,.3,22);
  for(const z of [-155,0]){b('#e4c77d',2240,14.53,z,140,.07,.35);for(const x of [2210,2230,2250])b('#f4efd9',x,14.55,z+22,12,.08,.35);}
  for(let i=0;i<5;i++){b('#f1eee0',2173,15.3,80+i*7,3.4,1.5,5);b('#496574',2173,16.2,80+i*7,3,.5,2);}

  shed(2110,-390,95,65,14);shed(2070,340,65,38,14);
  for(let i=0;i<12;i++)tree(2000,-340+i*54,i,.8);
 }
 if(region==='arrival'){
  // Passenger terminal and cruise/ferry piers retain their existing navigation lanes.
  pavement(100,500,215,110,8);building(100,490,115,35,2,'#eee9d9',8);
  b('#567d89',100,17,510,108,4,.3);b('#e6eee4',100,19.8,511,124,.4,14);
  b('#c0bfaa',100,4,690,24,8,270);b('#d2c4a7',100,8.2,690,24,.5,270);
  for(const x of [-85,10]){b('#bfc4b6',x,3.5,640,12,7,160);b('#b9c8c6',x-12,6,720,24,2,4);for(let z=575;z<720;z+=25)b('#283f48',x-6,7.5,z,1.5,1.2,3);}
  b('#c6cbbc',0,4,560,210,8,18);b('#bac8c7',119,9,680,18,2,5);
  pavement(100,453,200,25,8);b('#82968e',100,8.35,453,170,.2,12);
  for(let i=0;i<9;i++)tree(10+i*24,445,i,.85);
  // The leisure marina has its own eastern quay, clubhouse and floating fingers.
  b('#c6cbbc',267,4,540,136,8,28);b('#d2c4a7',267,8.25,540,136,.5,28);
  building(260,531,46,17,1,'#eee9d9',8);
  for(const x of [210,265,320])for(const z of [532,549])cyl('#657c7b',x,-6,z,.7,28);
  for(let i=0;i<16;i++)b('#d2c4a7',330,8-i*.325,554+i*1.7,5,.4,2);
 b('#a48864',310,2.8,668,5,.6,184);b('#a48864',321,2.8,579,27,.6,6);
  for(let i=0;i<5;i++){const z=605+i*32;b('#a48864',282,2.8,z,59,.6,3);for(const x of [263,284])yacht(x,z+10,14+(i%2)*3,4.5);}
  for(let z=585;z<=750;z+=28){cyl('#657c7b',310,-9,z,.28,26);b('#e4e3cf',308,3.5,z,.6,1.1,.6);}
  for(let i=0;i<5;i++){const x=210+i*24;parasol(x,549,8,i,3);cyl('#e9ded0',x,8.8,549,1.2,.15);}
 }
 if(region==='works'){
  // Operational container terminal behind the quay; open basins remain to the south.
  pavement(-730,150,520,180,9);b('#6f7d7c',-717,9.34,157,480,.16,148);
  for(const x of [-790,-610])shed(x,87,130,42);
  for(let row=0;row<4;row++)for(let col=0;col<15;col++){
   const x=-930+col*29,z=130+row*22,h=2+(col+row)%2;
   for(let tier=0;tier<h;tier++){
    const color=['#627f8a','#ae624e','#b69b5f','#66887e','#c3c3a4'][(row*7+col+tier)%5];
    b(color,x,10.8+tier*3,z,24,2.8,7.5);
    for(let k=-10;k<=10;k+=4)b('#384f56',x+k,10.8+tier*3,z+3.78,.16,2.4,.1);
   }
  }
  for(const z of [113,216]){b('#e3d3a5',-718,9.48,z,478,.08,.35);for(let x=-920;x<-480;x+=35)b('#e4dec2',x,9.49,z+6,12,.08,.22);}
  for(const x of [-795,-605]){b('#b8bba9',x,4,365,16,8,270);for(let z=245;z<500;z+=16)b('#d8b574',x+7.3,8.2,z,1,.2,7);}
  for(const x of [-865,-705,-545]){
   // Twin portal legs, trolley rails and long waterside booms make genuine shore cranes.
   for(const dx of [-15,15])for(const z of [226,257]){b('#d8b574',x+dx,29,z,2.5,40,3);b('#465e64',x+dx,10,z,5,2,10);}
   b('#d8b574',x,49,242,35,3,38);
   for(const dx of [-7,7]){b('#d8b574',x+dx,52,272,2,3,106);for(let z=226;z<322;z+=10)b('#d8b574',x,52,z,16,1,1);}
   for(const z of [224,324])b('#ff5056',x,54,z,.7,.6,.7);
   b('#465e64',x,51,302,13,2,8);for(const dx of [-5,5])cyl('#465e64',x+dx,38,302,.12,24);
   b('#d8b574',x,26,302,14,1.5,6);b('#496574',x+10,46,263,5,4,6);
  }
  // Repair basin, closed caisson, keel blocks and rail-mounted travel lift.
  b('#67787c',-940,-1,265,28,2,100);
  for(const x of [-958,-922])b('#bdc2b4',x,4,265,8,12,116);
  for(const z of [209,321])b('#9aa8a0',-940,4,z,44,12,8);
  for(let z=225;z<310;z+=9)b('#8f998b',-940,1,z,12,2,2);
  for(const x of [-963,-917]){b('#d8b574',x,21,270,2,36,3);b('#5f7378',x,3,270,7,2,18);b('#465e64',x,10.1,265,.3,.15,112)}b('#dab875',-940,39,270,49,2,4);
  b('#a5ada0',-1040,1,380,18,5,370);b('#a5ada0',-950,1,560,180,5,18);
  // A moored container feeder west of the supply lanes gives the terminal a readable scale.
  parts.push([11,'#465e64',-861,2,383,24,8,108,0]);b('#a48864',-861,6.1,383,21,.4,89);
  building(-861,418,17,16,3,'#e7e5d8',6);
  for(let row=0;row<5;row++)for(let col=0;col<2;col++)for(let tier=0;tier<2;tier++)b(['#ae624e','#66887e','#b69b5f'][(row+col)%3],-866+col*10,8+tier*3,348+row*12,8,2.8,11);
 }
 if(region==='dive'){
  pavement(480,270,130,80,7);building(460,265,52,24,1,'#f1eee2',7);b('#788e8e',516,10,262,34,.4,25);
  for(const x of [502,530])for(const z of [252,272])cyl('#e1e5d7',x,8.5,z,.22,3);
  b('#b49d79',480,4,350,7,.4,100);for(let i=0;i<11;i++)for(const x of [477,483])cyl('#687d76',x,1,310+i*9,.2,6);
  for(let i=0;i<7;i++)b('#cbd2c4',483.7,3.8-i*.55,390,.25,.12,2);
  b('#9fc9bb',525,7.15,288,18,.12,14);for(let i=0;i<9;i++)tree(425+i*14,233,i,.8);
  walk(525,297,575,297,7,9);walk(575,297,610,bayShore(610)-65,7,9);
  for(let i=0;i<=6;i++){const x=575+i*35/6,z=297+i*(bayShore(610)-65-297)/6,bed=Math.min(6.5,terrainHeight(x,z));for(const dx of [-3,3])cyl('#657c7b',x+dx,(bed+7)/2,z,.25,7-bed);}
  for(let x=610;x<1060;x+=10){walk(x,bayShore(x)-65,x+10,bayShore(x+10)-65,7.2,11);}
  // Seafront cafes, seafood terraces, a beach club and water-sports rental pavilion.
  for(let i=0;i<4;i++){
   const x=660+i*110,z=bayShore(x)-88;
   pavement(x,z+12,65,40,7);building(x,z,43,20,i%2+1,'#eee5cf',7);
   b('#67a6a2',x,11,z+18,49,.45,13);for(const dx of [-22,22])cyl('#e5dcc5',x+dx,9,z+22,.16,4);
   for(let j=-2;j<=2;j++){const tx=x+j*9;cyl('#e9ded0',tx,8,z+23,1.25,.2);for(const dz of [-2,2])b('#a48864',tx,7.6,z+23+dz,1.2,1.2,1.1);}
   for(const dx of [-36,36]){const tx=x+dx,tz=bayShore(tx)-77,y=terrainHeight(tx,tz);cyl('#8c8064',tx,y+4,tz,.3,8);parts.push([5,'#557a43',tx,y+8,tz,6,6,6,0]);}
  }
  for(let i=0;i<20;i++)for(let row=0;row<2;row++){
   const x=632+i*21,z=bayShore(x)-22-row*21,y=terrainHeight(x,z);
   parasol(x,z,y,i+row,3.4);for(const dx of [-2.5,2.5]){b('#e5dcc5',x+dx,y+.35,z+3,1.6,.5,4);b('#67a6a2',x+dx,y+.65,z+3,1.35,.14,3.5);}
  }
  const sx=1010,sz=bayShore(sx)-42,sy=terrainHeight(sx,sz);
  b('#d2c4a7',sx,sy+.1,sz,20,.2,12);for(const dx of [-9,9])cyl('#e5dcc5',sx+dx,sy+1.7,sz,.12,3.4);b('#e5dcc5',sx,sy+2.4,sz,18,1.3,.07);
  for(let i=0;i<5;i++)parts.push([11,i%2?'#67a6a2':'#d8b574',551+i*3.5,7.5,297,1.2,.5,7,0]);
  for(const x of [710,930]){const z=bayShore(x)-43,y=terrainHeight(x,z);b('#e5dcc5',x,y+2,z,4,4,4);b('#67a6a2',x,y+4.3,z,6,.4,6);}
 }
 // Physical fixtures and their irradiance footprints share one surveyed layout.
 for(const light of coastalLights.filter(l=>l.region===region)){
  cyl('#657c7b',light.x,light.y+light.height/2,light.z,light.height>15?.35:.14,light.height);
  b(light.cool?'#d5efff':'#f5eac7',light.x,light.y+light.height,light.z,light.height>15?7:1.3,.35,light.height>15?2:1.3);
 }
 if(region==='nature'){
  const compounds=(['town','commons','airport','arrival','works','dive','archive','station'] as Region[]).flatMap(makeRegion).filter(p=>p[0]===0&&p[5]>12&&p[7]>12);
  for(let i=0;i<2100;i++){
   const x=(hash(i+300)-.5)*2300,z=(hash(i+8700)-.5)*2000-350,y=terrainHeight(x,z);
   if(Math.max(Math.abs(terrainHeight(x+6,z)-terrainHeight(x-6,z)),Math.abs(terrainHeight(x,z+6)-terrainHeight(x,z-6)))>5||Object.values(mountainSites).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<38))continue;
   if(x>590&&x<1120&&z>bayShore(x)-60)continue;
   if(y<3||Math.abs(x)<380&&z>-380&&z<330||Math.abs(x-2380)<360&&Math.abs(z)<1400||Math.hypot(x-80,z+480)<100||channel(x,z).d<35)continue;
   if(compounds.some(p=>Math.abs(x-p[2])<p[5]/2+5&&Math.abs(z-p[4])<p[7]/2+5))continue;
   if(Object.values(sites).some(p=>Math.hypot(x-p[0],z-p[2])<115))continue;
   let near=false;for(const r of sampledRoads){for(let k=1;k<r.points.length;k++)if(segment(x,z,r.points[k-1],r.points[k]).d<r.width/2+8)near=true;}if(near)continue;
   tree(x,z,i,1+hash(i)*1.4);
  }

 }
 return finishArchitecture(parts);
}
