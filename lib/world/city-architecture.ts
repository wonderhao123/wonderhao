import type {Part} from './city-assets';
import {urbanLots} from './city-plan';

/** Metre-scale architectural kit. Opaque glazing and mullions share instance batches. */
export const materials = {
 stone:'#e4dfcf', white:'#f2efe5', concrete:'#b9bcb3', glass:'#386574', dark:'#263f4a',
 bronze:'#a48864', terracotta:'#a85e48', sand:'#d2c4a7', paving:'#c8c9bc', green:'#6f8d61',
 leaves:'#386947', grass:'#82996c', asphalt:'#596969', water:'#589f9a', red:'#b65545',
};
export function makeArchitecture():Part[]{
 const p:Part[]=[];const m=materials;const ground=20;
 const box=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>p.push([0,c,x,y,z,w,h,d,r]);
 const column=(c:string,x:number,y:number,z:number,r:number,h:number)=>p.push([1,c,x,y,z,r,h,r,0]);
 const roof=(x:number,y:number,z:number,w:number,h:number,d:number,c=m.terracotta)=>p.push([4,c,x,y,z,w,h,d,0]);
 // Shape 0 is centre-anchored; shape 4 starts at the eave. One wall height drives both.
 const gable=(x:number,z:number,w:number,d:number,wallH:number,roofH:number,wallColor:string,roofColor:string,roofW:number,roofD:number)=>{box(wallColor,x,ground+wallH/2,z,w,wallH,d);roof(x,ground+wallH-.1,z,roofW,roofH,roofD,roofColor)};
 const curvedRoof=(x:number,y:number,z:number,w:number,h:number,d:number)=>p.push([8,m.terracotta,x,y,z,w,h,d,0]);
 const tree=(x:number,z:number,size=1)=>{column(m.bronze,x,ground+2.5*size,z,.28*size,5*size);p.push([6,m.leaves,x,ground+6*size,z,5.6*size,4.5*size,5.6*size,x*.017]);};
 const palm=(x:number,z:number)=>{column(m.bronze,x,24,z,.23,8);p.push([5,m.leaves,x,28,z,5.5,5.5,5.5,x*.013])};
 const slab=(x:number,z:number,w:number,d:number,c=m.paving)=>box(c,x,ground+.25,z,w,.5,d);
 const bench=(x:number,z:number,r=0)=>{box(m.bronze,x,21,z,3.5,.3,.7,r);box(m.dark,x,20.5,z,2.5,.7,.4,r)};
 const lamp=(x:number,z:number)=>{column(m.dark,x,23.5,z,.12,7);box(m.white,x+.7,27,z,1.8,.16,.5)};
 const entry=(x:number,z:number,w=10)=>{box(m.glass,x,22.4,z,w,4.5,.3);box(m.white,x,25,z+3,w+3,.35,6);for(const a of [-1,1])column(m.bronze,x+a*(w/2+1),22.5,z+5,.15,5);slab(x,z+8,w+2,6)};
 const ribbons=(x:number,z:number,w:number,d:number,h:number,base=26,step=3.5,c=m.white)=>{
  for(let y=base;y<base+h;y+=step){box(c,x,y,z,w+.5,.16,d+.5);}
  for(let a=-w/2+2;a<w/2;a+=6){for(const side of [-1,1])box(m.bronze,x+a,base+h/2,z+side*(d/2+.1),.14,h,.35)}
  for(let a=-d/2+2;a<d/2;a+=6){for(const side of [-1,1])box(m.bronze,x+side*(w/2+.1),base+h/2,z+a,.35,h,.14)}
 };
 const office=(x:number,z:number,w:number,d:number,h:number,kind:number)=>{
  const start=p.length;
  slab(x,z,w+20,d+22);box(m.stone,x,23,z,w+12,6,d+12);entry(x,z+d/2+6,14);
  // Occupied podium, upper setback and a planted sky terrace break the extrusion.
  box(m.glass,x,26+h/2,z,w,h,d);ribbons(x,z,w,d,h,26,kind===1?7:3.8,kind===1?m.dark:m.white);
  if(kind===1)for(let a=-w/2+3;a<w/2;a+=5)for(const side of [-1,1])box(m.stone,x+a,26+h/2,z+side*(d/2+.65),.55,h,1.25);
  // Service core and a sheltered colonnade make every elevation inhabited.
  box(m.stone,x-w/2+2,26+h/2,z,4,h,d-2);
  for(let a=-w/2;a<=w/2;a+=8){box(m.glass,x+a,23,z+d/2+6.12,5,3.8,.2);}
  const gardenY=26+h*.55;box(m.dark,x,gardenY,z,w+2,3,d+2);
  for(let i=0;i<7;i++)box(m.green,x-w/2+4+i*(w-8)/6,gardenY+1.7,z+d/2+1,3,1.2,3);
  box(m.stone,x,27+h,z,w+2,2,d+2);box(m.green,x,28.1+h,z,w-4,.4,d-4);
  if(kind===0){box(m.glass,x-w*.2,34+h,z,w*.58,12,d*.62);ribbons(x-w*.2,z,w*.58,d*.62,12,28+h,4);box(m.white,x-w*.2,40.5+h,z,w*.62,1,d*.66)}
  if(kind===1){for(const a of [-1,1])box(m.white,x+a*(w/2-2),30+h/2,z,2,h+8,d+2);box(m.bronze,x,32+h,z,w+3,6,3)}
  if(kind===2){box(m.white,x,31+h,z,w+3,1,d+3);for(let i=0;i<5;i++)box(m.bronze,x-12+i*6,29+h,z,.3,5,d+1)}
  for(const a of [-1,1]){tree(x+a*(w/2+7),z+d/2+7,.8);bench(x+a*(w/2+7),z+d/2+2)}
  const owner=x===89?1:x===197?2:x===264?5:x===83?6:0;
  for(let i=start;i<p.length;i++)p[i][9]=owner;
 };
 // Continuous waterfront: raised seawall, lower promenade, generous steps and railings.
 for(let i=0;i<64;i++){const x=-360+i*12,z=283+Math.cos(x*.009)*25;
  box(m.concrete,x,10,z,12,20,8);box(m.sand,x,20.35,z-8,12,.7,20);
  box(m.dark,x,21.4,z+2,12,.12,.12);column(m.dark,x-5.5,20.8,z+2,.08,1.5);
  if(i%3===0){palm(x,z-15);bench(x+4,z-17);lamp(x+5,z-3)}
 }
 for(const part of p)part[9]=-1;
 // CBD: asymmetric skyline with lower foreground workplaces and shared pedestrian courts.
 office(92,-192,48,44,116,0);office(175,-195,39,42,94,1);office(264,-164,46,50,77,2);
 office(89,-86,48,42,52,2);office(197,-70,58,42,40,0);
 slab(260,-55,48,62);for(let i=0;i<4;i++){tree(251+i*9,-52,.9);bench(251+i*9,-36)}
 // A paired, garden-linked company headquarters with a porous ground floor.
 office(260,-250,33,24,52,1);box(m.glass,212,70,-234,65,5,9);box(m.green,212,73,-234,64,.7,9);
 // Hospital: long inpatient wing, perpendicular outpatient block, covered ambulance arrival.
 slab(-79,-180,122,127);box(m.white,-75,42,-209,94,42,27);box(m.glass,-75,42,-194.8,89,36,.3);
 for(let y=28;y<64;y+=3.8)box(m.white,-75,y,-194,96,.45,1.5);
 for(let x=-118;x<-28;x+=7)box(m.concrete,x,42,-194,.4,39,1.4);
 for(let y=28;y<62;y+=3.8){box(m.glass,-75,y,-222.6,86,2,.2);for(const side of [-1,1])box(m.glass,-75+side*47.1,y,-209,.2,2,19)}
 box(m.concrete,-75,63.7,-209,95,.5,28);for(let i=0;i<4;i++){box(m.concrete,-103+i*18,65.2,-210,9,2.5,7);box(m.dark,-103+i*18,66.5,-210,7,.2,5)}
 box(m.stone,-105,29,-157,30,18,69);box(m.glass,-89,29,-157,.3,14,64);
 box(m.white,-58,27,-157,58,14,45);entry(-58,-133,19);
 for(let y=24;y<33;y+=3.5){box(m.glass,-58,y,-134.3,49,2,.2);box(m.glass,-28.8,y,-157,.2,2,36);box(m.glass,-120.2,y,-157,.2,2,57)}
 box(m.red,-75,59,-193,8,1.8,.3);box(m.red,-75,59,-192.9,1.8,8,.3);
 box(m.white,-28,26,-154,22,.7,18);for(let i=0;i<3;i++){column(m.concrete,-20,23,-161+i*7,.25,6)}
 box(m.white,-26,22.2,-150,2.5,2.4,6);box(m.red,-26,22.5,-146.9,1.5,.5,.12);box(m.dark,-26,23,-152,2.55,.8,1.4);
 for(let i=0;i<4;i++)tree(-121+i*20,-120,.9);
 const campusStart=p.length;
 // Campus: kindergarten court, teaching wings, library hall and a real marked sports field.
 slab(-226,-157,176,175);box(m.stone,-265,28,-167,22,16,101);box(m.stone,-205,28,-221,100,16,22);
 for(let y=24;y<35;y+=3.5){box(m.glass,-252.9,y,-168,.2,2,92);box(m.glass,-205,y,-209.8,93,2,.2)}
 for(let k=0;k<9;k++)box(m.white,-252.5,28,-206+k*10,.7,16,.55);
 for(let y=24;y<35;y+=3.5){box(m.glass,-276.2,y,-167,.2,2,92);box(m.glass,-205,y,-232.2,92,2,.2)}
 for(let x=-248;x<-158;x+=9){box(m.bronze,x,28,-209.5,.28,15,1.2);box(m.bronze,x,28,-232.5,.28,15,1.2)}
 box(m.white,-241,25,-207,34,.5,5);box(m.white,-241,25,-128,34,.5,5);
 slab(-206,-165,64,66,m.grass);for(let i=0;i<4;i++)tree(-225+i*13,-139,.8);
 slab(-188,-165,40,27,m.green);for(const side of [-1,1]){box(m.white,-188,20.56,-165+side*12.5,37,.05,.18);box(m.white,-188+side*18.5,20.56,-165,.18,.05,25);box(m.white,-188+side*18,22,-165,.16,3,5);box(m.white,-188+side*18,23.5,-165,1,.15,5)}box(m.white,-188,20.58,-165,.16,.06,25);
 gable(-209,-94,100,22,7,4,m.sand,m.terracotta,105,28);entry(-209,-82,9);
 for(let x=-250;x<-160;x+=12){box(m.glass,x,23.5,-82.7,5,3,.3);box(m.bronze,x,25.3,-81.7,7,.18,2.5);}
 for(let i=0;i<8;i++){box([m.terracotta,m.bronze,m.green][i%3],-251+i*12,23,-81,6,3,.3)}
 slab(-271,-91,26,27,m.sand);for(let i=0;i<3;i++){column(m.red,-280+i*7,22,-88,.12,4);box(m.bronze,-280+i*7,24,-88,1,.2,6)}
 for(const z of [-217,-117])for(let y=25;y<35;y+=3.5){box(m.glass,-265,y,z,14,2,.25);for(let x=-271;x<=-259;x+=4)box(m.white,x,y,z+.2,.22,2.5,.4);}
 for(const x of [-255,-235,-215,-195,-175]){box(m.concrete,x,37.2,-221,5,1.5,5);box(m.glass,x,38,-221,4,.12,4);}
 for(let x=-248;x<-164;x+=14){box(m.bronze,x,21.5,-140,5,.25,.7);box(m.concrete,x,20.8,-140,4,1,.5);}
 for(let i=campusStart;i<p.length;i++)p[i][9]=4;
 const archiveStart=p.length;
 // Knowledge archive: two wings enclosing a public reading courtyard, clerestory roof.
 slab(-215,65,148,82);box(m.stone,-220,28,47,116,16,26);box(m.stone,-271,26,75,18,12,42);
 box(m.glass,-220,28,60.3,108,11,.4);for(let x=-271;x<-166;x+=7)box(m.bronze,x,28,61,.8,16,1.7);
 box(m.white,-220,37,45,122,2,30);box(m.glass,-220,39,44,100,3,13);roof(-220,40.4,44,108,3,20,m.bronze);
 entry(-217,61,13);slab(-214,85,80,28,m.sand);for(let x=-246;x<-170;x+=20){tree(x,89,.75);bench(x,80)}
 for(let i=archiveStart;i<p.length;i++)p[i][9]=3;
 // Historical street walls: narrow frontages, five-foot ways, shutters and pitched tile roofs.
 const shop=(x:number,z:number,i:number)=>{
  const c=[m.stone,'#d9b89c','#adbbb0','#b0c4c5','#d7c69f'][i%5];
  gable(x,z,13.4,29,13.6,5,c,m.terracotta,14,32);box(m.white,x,32.9,z+15,13.6,.65,1);
  box(m.dark,x,22.4,z+14.7,10,4.7,.25);box(m.sand,x,25.6,z+17,14,.4,5);
  for(const a of [-1,1]){box(m.white,x+a*6,22.8,z+17,.55,5.7,.55);box(m.glass,x+a*3.3,29.2,z+14.7,2.2,3.3,.2);for(const side of [-1,1])box(m.green,x+a*3.3+side*1.45,29.2,z+15, .55,3.5,.3)}
  for(let a=-6;a<=6;a+=1.5)box(m.terracotta,x+a,33.6,z,.13,.15,30);
  box(m.white,x,27,z+15,13,.35,.65);box(m.terracotta,x,25.4,z+18.8,11,.3,1.8);slab(x,z+18,14,7);
  box(m.bronze,x,24.4,z+14.95,5,.7,.25);box(m.white,x,27.2,z+15.8,10,.25,2);for(const a of [-1,1]){box(m.white,x+a*3.3,31.2,z+15.2,3.4,.35,.7);box(m.white,x+a*3.3,27.4,z+15.2,3.4,.35,.7)}
 };
 for(let i=0;i<10;i++)shop(-299+i*14,155,i);
 for(let i=0;i<7;i++)shop(-306+i*14,208,i+2);
 p.push(...makeHeritageQuarter());
 // Temple: enclosed forecourt, red colonnade, layered eaves and a modest gateway.
 slab(-76,202,98,52);box(m.sand,-76,23,183,70,6,1);box(m.stone,-76,24,201,62,8,28);
 for(const side of [-1,1]){box(m.sand,-76+side*42,23,202,1.5,6,48);for(let i=0;i<5;i++)column(m.red,-102+i*13,24,218,.45,8)}
 curvedRoof(-76,27.9,201,75,6,39);box(m.stone,-76,33,198,45,5,20);curvedRoof(-76,35.4,198,50,5,25);
 box(m.bronze,-76,38,198,51,.55,1);for(const side of [-1,1]){box(m.bronze,-76+side*34,32,201,6,.6,40,side*.06)}
 for(const side of [-1,1])column(m.red,-76+side*10,24,226,.6,8);curvedRoof(-76,27.9,226,27,3,8);
 // Timber screens, recessed doors and a raised stone threshold in the temple forecourt.
 for(let x=-100;x<=-50;x+=10){box(m.red,x,24,215.2,6,6,.4);for(let i=-2;i<=2;i++)box(m.bronze,x+i,24,215.5,.12,5.5,.18);}
 for(let i=0;i<5;i++)box(m.sand,-76,20.3+i*.16,222-i*.5,28,.3,.6);
 column(m.bronze,-76,21.3,220,1.2,1.7);
 const waterfrontStart=p.length;
 // Waterfront commercial hall and design offices: open arcade, roof garden, skylights.
 slab(180,139,279,155);box(m.stone,183,27,160,245,14,68);box(m.glass,183,27,195,233,10,.5);
 for(let x=65;x<305;x+=10)box(m.white,x,27,197,.7,14,3);
 box(m.green,183,34.5,159,234,1,55);for(let i=0;i<6;i++){roof(96+i*34,35.8,150,22,5,39,m.glass);box(m.white,96+i*34,35.6,150,23,.5,42)}
 entry(145,196,20);entry(255,196,16);for(let i=waterfrontStart;i<p.length;i++)p[i][9]=7;office(83,75,45,34,18,2);office(251,66,55,35,26,1);
 slab(170,83,76,76,m.sand);column(m.concrete,170,20.8,84,17,1);column(m.water,170,21.4,84,15,.3);
 for(let i=0;i<5;i++){tree(123+i*26,218,1);bench(126+i*26,213)}
 // Residential edge: slab blocks with balconies, planted decks and smaller courtyard homes.
 for(let i=0;i<4;i++){
  const x=-302+i*64,z=-331-(i%2)*13,h=29+(i%2)*14;slab(x,z,53,57);
  box(m.concrete,x,17,z,53,6,57);box(m.stone,x,20+h/2,z,40,h,25);box(m.glass,x,21+h/2,z+13,35,h-3,.3);
  for(let y=24;y<20+h;y+=3.3){box(m.white,x,y,z+16,43,.35,6);box(m.bronze,x,y+1,z+18.5,43,.9,.2)}
  for(let a=-18;a<20;a+=9)box(m.white,x+a,21+h/2,z+16,.4,h,6);
  box(m.green,x,20+h+.4,z,39,.8,25);tree(x+24,z+21,.9);
 }
 // Hierarchical streets, signal crossings, transit entrances, sheltered bus stops.
 for(const [x,z] of [[0,0],[0,-280],[340,0],[-340,0],[0,230]]){
  for(const side of [-1,1])for(let i=-3;i<=3;i++){box(m.white,x+i*1.8,20.48,z+side*13,.8,.04,4);box(m.white,x+side*13,20.48,z+i*1.8,4,.04,.8)}
  for(const side of [-1,1]){column(m.dark,x+side*11,22.3,z+11,.12,4.6);box(m.dark,x+side*11,24.3,z+11,.5,1.3,.5);box(m.green,x+side*11,24,z+11.27,.25,.25,.1)}
 }
 for(const [x,z] of [[25,-29],[-300,-27],[315,130]]){
  box(m.dark,x,20.5,z,13,1,6);for(let i=0;i<9;i++)box(m.concrete,x-5+i*1.2,20.6-i*.3,z,1,.25,4);
  box(m.white,x,24,z,17,.5,7);for(const side of [-1,1])column(m.bronze,x+side*7,22,z,.18,4);
  column(m.dark,x+10,23,z,.13,6);box(m.red,x+10,26,z,2.7,1.8,.3);
 }
 for(const [x,z] of [[-20,-65],[320,-103],[-318,96]]){box(m.glass,x,22,z,10,3.5,.15);box(m.white,x,24,z+2,13,.35,5);for(const a of [-1,1])column(m.dark,x+a*5,22,z+3,.12,4);bench(x,z+1)}
 for(let x=-310;x<330;x+=33){for(const z of [-264,17]){if(Math.abs(x)<20)continue;tree(x,z,.8);lamp(x+8,z)}}
 for(let z=-240;z<220;z+=35){tree(320,z,.85);lamp(328,z);tree(-320,z,.85)}
 for(let x=-308;x<320;x+=33)for(const z of [-264,17]){if(Math.abs(x)<20)continue;box(m.dark,x,20.55,z,3,.07,3);box(m.sand,x,20.61,z,2.7,.08,2.7);}
 for(let x=-300;x<320;x+=24){box(m.dark,x,20.4,222,1.1,.04,.6);}
 // A deterministic parcel kit: structure, podium, four inhabited elevations, roof and entrance.
 for(const lot of urbanLots){
  const {x,z,base:y,width:w,depth:d,height:h,family,heading:r}=lot;
  const sign=r===0?1:-1,c=[m.stone,m.white,m.concrete][Math.round(x+z+2000)%3];
  box(m.concrete,x,y-.4,z,w+1,1,d+1);
  box(family==='office'?m.glass:c,x,y+h/2,z,w,h,d);
  box(m.stone,x,y+2,z,w+2,4,d+2);
  const facades=family==='office'?m.glass:'#496574';
  for(let f=5;f<h-1;f+=3.5){
   if(family==='office')box(m.white,x,y+f+1.2,z,w+.3,.16,d+.3);
   for(const side of [-1,1]){
    box(facades,x,y+f,z+side*(d/2+.06),w-4,2.2,.16);
    box(facades,x+side*(w/2+.06),y+f,z,.16,2.2,d-4);
    if(family==='apartment')box(m.white,x,y+f-1.2,z+side*(d/2+.8),w,.25,1.8);
   }
  }
  for(const side of [-1,1])for(let a=-w/2+4;a<w/2;a+=5)box(c,x+a,y+h/2,z+side*(d/2+.2),.4,h,.55);
  box(m.white,x,y+h+.25,z,w+1,.5,d+1);
  if(family==='shop')roof(x,y+h+.45,z,w+1,4,d+2);
  else {box(m.dark,x-w/4,y+h+1.2,z,7,1.4,6);box(m.green,x+w/4,y+h+.7,z,6,.4,d-4);}
  box(m.dark,x,y+1.9,z+sign*(d/2+.7),3.2,3.8,.25);
  box(m.bronze,x,y+4,z+sign*(d/2+2),w,.3,4);
  for(const a of [-1,1])column(m.dark,x+a*(w/2-1),y+2,z+sign*(d/2+3),.12,4);
  box(m.paving,x,y+.2,z+sign*(d/2+4),w+3,.4,8);
  for(const a of [-1,1])box(m.glass,x+a*w/3,y+2,z+sign*(d/2+.65),7,3,.2);
 }
 return p;
}

/** CHIJMES-inspired precinct, adapted to the existing block rather than a measured replica.
 * All elevations are metres above the common 20 m city datum. Architecture remains scenery.
 */
export const heritageBounds={minX:-140,maxX:-12,minZ:27,maxZ:162};
export function keepDistantArchitecture(p:Part){
 return p[5]*p[7]>180||(p[2]>=heritageBounds.minX&&p[2]<=heritageBounds.maxX&&p[4]>=heritageBounds.minZ&&p[4]<=heritageBounds.maxZ);
}
export function makeHeritageQuarter():Part[]{
 const p:Part[]=[];
 const lime='#eee9dd',trim='#f2efe5',slate='#53626a',tile='#a85e48',stone='#d2c4a7',wood='#a48864',iron='#263f4a',leaf='#386947';
 const add=(shape:number,c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>p.push([shape,c,x,y,z,w,h,d,r,0]);
 const box=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>add(0,c,x,y,z,w,h,d,r);
 const col=(c:string,x:number,y:number,z:number,r:number,h:number)=>add(1,c,x,y,z,r,h,r);
 const paving=(x:number,z:number,w:number,d:number)=>box(stone,x,20.57,z,w,.12,d);
 const pointed=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0,frame=true)=>add(frame?12:14,c,x,y,z,w,h,d,r);
 const spire=(x:number,z:number,y:number,w:number,h:number)=>add(13,slate,x,y,z,w,h,w);
 const tree=(x:number,z:number,s=1)=>{col(wood,x,22.7,z,.23*s,5.4);add(6,leaf,x,27,z,4.2*s,3*s,4.2*s,x*.017);};
 const bollard=(x:number,z:number)=>{col(iron,x,21.05,z,.14,1.1);box('#f5eac7',x,21.65,z,.32,.2,.32);};
 const table=(x:number,z:number)=>{col(iron,x,21.05,z,.13,1.05);col(wood,x,21.62,z,1.1,.13);for(const dz of [-1.7,1.7]){box(wood,x,21.15,z+dz,1.3,.18,.75);for(const dx of [-.48,.48])box(iron,x+dx,20.81,z+dz,.12,.68,.6);box(wood,x,21.55,z+dz*1.18,1.3,.65,.15);}};
 box(stone,-76,20.25,94.5,128,.5,135);
 // The chapel sits to the west of an open lawn. Its lower aisles reveal the clerestory.
 box(lime,-109,31,76,22,21,54);box(trim,-109,41.4,76,23,.4,55);
 add(4,slate,-109,41.5,76,24,11,56);
 for(const side of [-1,1]){
  const x=-109+side*14;
  box(lime,x,25.6,76,6,10.2,54);box(trim,x,30.85,76,7,.3,55);add(4,slate,x,30.9,76,7.5,3.2,56);
  for(let i=0;i<6;i++){
   const z=52+i*9;
   // Stepped piers support the aisle eaves; smaller upper piers meet the nave cornice.
   box(lime,-109+side*18,25.7,z,1.9,10.4,1.7);box(trim,-109+side*18,31,z,2.4,.3,2.2);
   box(lime,-109+side*11.3,36.3,z,1.1,10.2,1.4);
   spire(-109+side*18,z,33,2.2,3.6);
   add(15,lime,-109+side*14.5,36.35,z,7,10.3,1.15,side<0?0:Math.PI);
  }
  for(let i=0;i<5;i++){
   const z=56.5+i*9,r=side*Math.PI/2;
   pointed('#788fa1',-109+side*17.08,26.4,z,4.1,6.2,.14,r,false);
   pointed(trim,-109+side*17.25,26.4,z,4.7,6.8,.38,r);
   box(trim,-109+side*17.46,26,z,.18,5.4,.18);
   for(const dz of [-.9,.9])pointed(dz<0?'#c49665':'#688e91',-109+side*17.2,26,z+dz,1.3,4.7,.14,r,false);
   pointed('#788fa1',-109+side*11.08,37.2,z,3.9,5.5,.14,r,false);
   pointed(trim,-109+side*11.22,37.2,z,4.5,6.1,.35,r);
   box(trim,-109+side*11.43,36.9,z,.17,4.8,.17);
  }
 }
 // North apse: a faceted end volume, expressed below the main ridge.
 box(lime,-109,29.5,46,16,18,7);box(trim,-109,38.7,46,17,.4,8);add(4,slate,-109,38.8,46,18,7,9);
 for(const dx of [-5,0,5]){pointed('#c49665',-109+dx,31,42.42,3.1,9,.15,0,false);pointed(trim,-109+dx,31,42.2,3.6,9.7,.4);}
 for(const dx of [-14,14]){pointed('#788fa1',-109+dx,25.8,103.08,3,6,.15,0,false);pointed(trim,-109+dx,25.8,103.27,3.8,6.7,.35);}
 // Five-stage entry tower, with deep lancet portal, paired belfry and a slender octagonal spire.
 box(lime,-109,39,108,12,37,12);
 for(const y of [29,38,47,57.6])box(trim,-109,y,108,12.8,.6,12.8);
 box(lime,-109,58.3,108,12,1,12);spire(-109,108,67.7,12,18);
 box(trim,-109,77.8,108,.24,3.2,.24);box(trim,-109,78.2,108,1.8,.24,.24);
 for(const dx of [-5.8,5.8])for(const dz of [-5.8,5.8]){
  box(lime,-109+dx,39,108+dz,1.3,37,1.3);box(trim,-109+dx,58.5,108+dz,1.9,1.2,1.9);spire(-109+dx,108+dz,61.5,2,4.8);
 }
 pointed(wood,-109,25.4,114.08,5.2,8,.18,0,false);pointed(trim,-109,25.6,114.3,7.2,9.4,.7);
 box(iron,-109,24,114.45,.1,5,.15);
 for(const side of [-1,1]){
  pointed('#788fa1',-109+side*1.9,35.2,114.1,2.4,6,.15,0,false);pointed(trim,-109+side*1.9,35.2,114.3,2.9,6.7,.4);
  for(const r of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   const dx=side*2.4,dz=6.15,x=-109+dx*Math.cos(r)+dz*Math.sin(r),z=108-dx*Math.sin(r)+dz*Math.cos(r);
   pointed(iron,x,52,z,3.2,6.8,.18,r,false);pointed(trim,x+Math.sin(r)*.18,52,z+Math.cos(r)*.18,3.8,7.5,.4,r);
   for(let y=50;y<54;y+=.65)box(wood,x+Math.sin(r)*.24,y,z+Math.cos(r)*.24,2.5,.13,.18,r);
  }
 }
 // Entrance steps and a continuous, step-free side approach around the shallow landing.
 for(let i=0;i<4;i++)box(stone,-109,20.57+i*.12,119-i*.9,17,.14,1);
 paving(-109,138,33,34);paving(-86,115,9,30);
 // Two-storey cloister wings. Arcade openings are real holes; occupied rooms sit behind.
 const wing=(cx:number,cz:number,length:number,r:number)=>{
  const b=(c:string,x:number,y:number,z:number,w:number,h:number,d:number)=>box(c,cx+x*Math.cos(r)+z*Math.sin(r),y,cz-x*Math.sin(r)+z*Math.cos(r),w,h,d,r);
  b(lime,0,28.5,-2,length,16,10);b(trim,0,28.6,2,length+1,.45,18);b(trim,0,36.5,2,length+1,.5,18);
  add(4,tile,cx+2*Math.sin(r),36.65,cz+2*Math.cos(r),20,4.6,length+2,r+Math.PI/2);
  const bays=Math.round(length/7),step=length/bays;
  for(let i=0;i<bays;i++){
   const x=-length/2+(i+.5)*step;
   for(const y of [24.6,32.4]){
    pointed(trim,cx+x*Math.cos(r)+10*Math.sin(r),y,cz-x*Math.sin(r)+10*Math.cos(r),step,7.5,.7,r);
    b(iron,x,y,3.05,step-1.7,5.7,.16);b('#c49665',x,y,3.18,step-2.2,4.8,.14);
    b(trim,x,y,3.35,.12,4.8,.18);
    // Rear windows make the street elevations inhabited too.
    b('#688e91',x,y,-7.08,step-2.1,4.6,.16);b(trim,x,y,-7.2,.16,4.6,.2);
   }
   b('#f5eac7',x,27.5,6.6,.25,.25,.25);
   for(const dx of [-step/2,step/2]){b(trim,x+dx,21,10,.8,1,.95);b(trim,x+dx,25.8,10,.8,.4,.95);}
   // Open balustrade at the upper gallery, below the pointed arcade springing.
   b(trim,x,29.3,10,step,.2,.3);for(let j=0;j<5;j++)b(trim,x-step/2+.65+j*(step-1.3)/4,28.9,10,.14,.7,.18);
  }
 };
 wing(-60,35,76,0);wing(-24,85,80,-Math.PI/2);
 // Caldwell-inspired pavilion: smaller, classical proportions and a sheltered garden verandah.
 box(lime,-39,27,142,34,13,20);box(trim,-39,33.65,142,35,.4,21);add(4,tile,-39,33.75,142,23,4.5,36,Math.PI/2);
 for(const side of [-1,1])for(const x of [-51,-43,-35,-27]){box('#688e91',x,28.6,142+side*10.1,3,4.6,.15);for(const dx of [-1.7,0,1.7])box(trim,x+dx,28.6,142+side*10.25,.18,5,.25);for(const y of [26.1,31.1])box(trim,x,y,142+side*10.3,3.8,.25,.55);}
 box(trim,-39,25,128.5,34,.4,8);for(const x of [-54,-46,-38,-30,-22]){col(trim,x,22.7,125,.22,4.4);box(trim,x,24.6,125,.65,.4,.65);}
 // A rounded garden-facing bay distinguishes the classical house from the Gothic hall.
 col(lime,-39,27,148,8,13);col(trim,-39,33.7,148,8.3,.4);add(13,tile,-39,35.95,148,18,4.4,18);
 for(let i=0;i<5;i++){
  const a=.18+i*(Math.PI-.36)/4,x=-39+Math.cos(a)*8.05,z=148+Math.sin(a)*8.05,r=Math.PI/2-a;
  box('#688e91',x,28.6,z,2,4,.15,r);box(trim,x+Math.cos(a)*.15,28.6,z+Math.sin(a)*.15,.13,4.4,.16,r);
  for(const y of [26.4,30.8])box(trim,x+Math.cos(a)*.12,y,z+Math.sin(a)*.12,2.5,.22,.4,r);
 }
 // Garden rooms keep the tall chapel separate from the dining precinct.
 box('#82996c',-65,20.56,80,37,.14,48);
 for(const x of [-85,-45])box(stone,x,20.59,80,1.1,.14,51);
 for(const z of [54.5,105.5])box(stone,-65,20.59,z,41,.14,1.1);
 paving(-65,115,42,11);paving(-34,87,9,74);
 for(const [x,z] of [[-83,54],[-47,54],[-83,105],[-47,105],[-132,132],[-130,151],[-65,148]]){
  box(stone,x,20.8,z,4,.6,4);box(leaf,x,21.3,z,3.5,.7,3.5);tree(x,z,.85);
 }
 for(const [x,z] of [[-74,115],[-57,115],[-40,63],[-40,82],[-40,101],[-66,136]])table(x,z);
 for(const x of [-74,-57]){col(iron,x,22.4,115,.1,3.8);add(13,'#e5d9bc',x,24.15,115,6,1.1,6);}
 for(const z of [64,93]){box(wood,-81,21.2,z,.75,.2,4);box(wood,-82,21.7,z,.16,.85,4);for(const dz of [-1.5,1.5])box(iron,-81,20.85,z+dz,.65,.7,.15);}
 // Low enclosure has generous south and east portals, never a sealed compound.
 for(const [x,w] of [[-130,20],[-67,44],[-23,20]]){box(lime,x,21.8,158,w,2.6,.7);box(trim,x,23.2,158,w+.4,.2,1);}
 for(const x of [-119,-99,-44]){box(lime,x,22.8,158,1.2,4.6,1.2);spire(x,158,25.7,1.8,1.2);}
 for(const [x,z] of [[-121,123],[-96,123],[-121,148],[-96,148],[-84,114],[-46,114],[-34,53],[-34,77],[-34,101],[-60,150]])bollard(x,z);
 return p;
}
