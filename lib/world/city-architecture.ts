import type {Part} from './city-assets';

/** Metre-scale architectural kit. Opaque glazing and mullions share instance batches. */
export const materials = {
 stone:'#e4dfcf', white:'#f2efe5', concrete:'#b9bcb3', glass:'#386574', dark:'#263f4a',
 bronze:'#a48864', terracotta:'#a85e48', sand:'#d2c4a7', paving:'#c8c9bc', green:'#6f8d61',
 leaves:'#50775b', grass:'#82996c', asphalt:'#596969', water:'#589f9a', red:'#b65545',
};
export function makeArchitecture():Part[]{
 const p:Part[]=[];const m=materials;const ground=20;
 const box=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>p.push([0,c,x,y,z,w,h,d,r]);
 const column=(c:string,x:number,y:number,z:number,r:number,h:number)=>p.push([1,c,x,y,z,r,h,r,0]);
 const roof=(x:number,y:number,z:number,w:number,h:number,d:number,c=m.terracotta)=>p.push([4,c,x,y,z,w,h,d,0]);
 const tree=(x:number,z:number,size=1)=>{column(m.bronze,x,ground+2.5*size,z,.28*size,5*size);p.push([2,m.leaves,x,ground+7*size,z,3.6*size,4.5*size,3.6*size,0]);};
 const slab=(x:number,z:number,w:number,d:number,c=m.paving)=>box(c,x,ground+.25,z,w,.5,d);
 const bench=(x:number,z:number,r=0)=>{box(m.bronze,x,21,z,3.5,.3,.7,r);box(m.dark,x,20.5,z,2.5,.7,.4,r)};
 const lamp=(x:number,z:number)=>{column(m.dark,x,23.5,z,.12,7);box(m.white,x+.7,27,z,1.8,.16,.5)};
 const entry=(x:number,z:number,w=10)=>{box(m.glass,x,22.4,z,w,4.5,.3);box(m.white,x,25,z+3,w+3,.35,6);for(const a of [-1,1])column(m.bronze,x+a*(w/2+1),22.5,z+5,.15,5);slab(x,z+8,w+2,6)};
 const ribbons=(x:number,z:number,w:number,d:number,h:number,base=26,step=3.5,c=m.white)=>{
  for(let y=base;y<base+h;y+=step){box(c,x,y,z,w+1,.25,d+1);}
  for(let a=-w/2+2;a<w/2;a+=4){for(const side of [-1,1])box(m.bronze,x+a,base+h/2,z+side*(d/2+.1),.2,h,.24)}
  for(let a=-d/2+2;a<d/2;a+=4){for(const side of [-1,1])box(m.bronze,x+side*(w/2+.1),base+h/2,z+a,.24,h,.2)}
 };
 const office=(x:number,z:number,w:number,d:number,h:number,kind:number)=>{
  slab(x,z,w+20,d+22);box(m.stone,x,23,z,w+12,6,d+12);entry(x,z+d/2+6,14);
  // Occupied podium, upper setback and a planted sky terrace break the extrusion.
  box(m.glass,x,26+h/2,z,w,h,d);ribbons(x,z,w,d,h);
  const gardenY=26+h*.55;box(m.dark,x,gardenY,z,w+2,3,d+2);
  for(let i=0;i<7;i++)box(m.green,x-w/2+4+i*(w-8)/6,gardenY+1.7,z+d/2+1,3,1.2,3);
  box(m.stone,x,27+h,z,w+2,2,d+2);box(m.green,x,28.1+h,z,w-4,.4,d-4);
  if(kind===0){box(m.glass,x-w*.2,34+h,z,w*.58,12,d*.62);ribbons(x-w*.2,z,w*.58,d*.62,12,28+h,4);box(m.white,x-w*.2,40.5+h,z,w*.62,1,d*.66)}
  if(kind===1){for(const a of [-1,1])box(m.white,x+a*(w/2-2),30+h/2,z,2,h+8,d+2);box(m.bronze,x,32+h,z,w+3,6,3)}
  if(kind===2){box(m.white,x,31+h,z,w+3,1,d+3);for(let i=0;i<5;i++)box(m.bronze,x-12+i*6,29+h,z,.3,5,d+1)}
  for(const a of [-1,1]){tree(x+a*(w/2+7),z+d/2+7,.8);bench(x+a*(w/2+7),z+d/2+2)}
 };
 // Continuous waterfront: raised seawall, lower promenade, generous steps and railings.
 for(let i=0;i<64;i++){const x=-360+i*12,z=283+Math.cos(x*.009)*25;
  box(m.concrete,x,10,z,12,20,8);box(m.sand,x,20.35,z-8,12,.7,20);
  box(m.dark,x,21.4,z+2,12,.12,.12);column(m.dark,x-5.5,20.8,z+2,.08,1.5);
  if(i%3===0){tree(x,z-15,.9);bench(x+4,z-17);lamp(x+5,z-3)}
 }
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
 // Campus: kindergarten court, teaching wings, library hall and a real marked sports field.
 slab(-226,-157,176,175);box(m.stone,-265,28,-167,22,16,101);box(m.stone,-205,28,-221,100,16,22);
 for(let y=24;y<35;y+=3.5){box(m.glass,-252.9,y,-168,.2,2,92);box(m.glass,-205,y,-209.8,93,2,.2)}
 for(let k=0;k<9;k++)box(m.white,-252.5,28,-206+k*10,.7,16,.55);
 for(let y=24;y<35;y+=3.5){box(m.glass,-276.2,y,-167,.2,2,92);box(m.glass,-205,y,-232.2,92,2,.2)}
 for(let x=-248;x<-158;x+=9){box(m.bronze,x,28,-209.5,.28,15,1.2);box(m.bronze,x,28,-232.5,.28,15,1.2)}
 box(m.white,-241,25,-207,34,.5,5);box(m.white,-241,25,-128,34,.5,5);
 slab(-206,-165,64,66,m.grass);for(let i=0;i<4;i++)tree(-225+i*13,-139,.8);
 slab(-188,-165,40,27,m.green);for(const side of [-1,1]){box(m.white,-188,20.56,-165+side*12.5,37,.05,.18);box(m.white,-188+side*18.5,20.56,-165,.18,.05,25);box(m.white,-188+side*18,22,-165,.16,3,5);box(m.white,-188+side*18,23.5,-165,1,.15,5)}box(m.white,-188,20.58,-165,.16,.06,25);
 box(m.sand,-209,23.5,-94,100,7,22);roof(-209,29,-94,105,4,28);entry(-209,-82,9);
 for(let i=0;i<8;i++){box([m.terracotta,m.bronze,m.green][i%3],-251+i*12,23,-81,6,3,.3)}
 slab(-271,-91,26,27,m.sand);for(let i=0;i<3;i++){column(m.red,-280+i*7,22,-88,.12,4);box(m.bronze,-280+i*7,24,-88,1,.2,6)}
 // Knowledge archive: two wings enclosing a public reading courtyard, clerestory roof.
 slab(-215,65,148,82);box(m.stone,-220,28,47,116,16,26);box(m.stone,-271,26,75,18,12,42);
 box(m.glass,-220,28,60.3,108,11,.4);for(let x=-271;x<-166;x+=7)box(m.bronze,x,28,61,.8,16,1.7);
 box(m.white,-220,37,45,122,2,30);box(m.glass,-220,39,44,100,3,13);roof(-220,41,44,108,3,20,m.bronze);
 entry(-217,61,13);slab(-214,85,80,28,m.sand);for(let x=-246;x<-170;x+=20){tree(x,89,.75);bench(x,80)}
 // Historical street walls: narrow frontages, five-foot ways, shutters and pitched tile roofs.
 const shop=(x:number,z:number,i:number)=>{
  const c=[m.stone,'#d9b89c','#adbbb0','#b0c4c5','#d7c69f'][i%5];
  box(c,x,26.8,z,13.4,13.6,29);roof(x,35,z,14,5,32);box(m.white,x,32.9,z+15,13.6,.65,1);
  box(m.dark,x,22.4,z+14.7,10,4.7,.25);box(m.sand,x,25.6,z+17,14,.4,5);
  for(const a of [-1,1]){box(m.white,x+a*6,22.8,z+17,.55,5.7,.55);box(m.glass,x+a*3.3,29.2,z+14.7,2.2,3.3,.2);for(const side of [-1,1])box(m.green,x+a*3.3+side*1.45,29.2,z+15, .55,3.5,.3)}
  box(m.white,x,27,z+15,13,.35,.65);box(m.terracotta,x,25.4,z+18.8,11,.3,1.8);slab(x,z+18,14,7);
  box(m.bronze,x,24.4,z+14.95,5,.7,.25);box(m.white,x,27.2,z+15.8,10,.25,2);for(const a of [-1,1]){box(m.white,x+a*3.3,31.2,z+15.2,3.4,.35,.7);box(m.white,x+a*3.3,27.4,z+15.2,3.4,.35,.7)}
 };
 for(let i=0;i<10;i++)shop(-299+i*14,155,i);
 for(let i=0;i<7;i++)shop(-306+i*14,208,i+2);
 // Church: nave, side aisles, portico and bell tower; restrained scale beside the shophouses.
 slab(-90,83,94,108);box(m.stone,-85,30,74,25,20,60);roof(-85,44,74,28,12,65,m.dark);
 for(const side of [-1,1]){box(m.stone,-85+side*18,25,73,12,10,56);roof(-85+side*18,32,73,13,5,60,m.dark);for(let i=0;i<5;i++){box(m.concrete,-85+side*25,27,50+i*11,1.8,15,3);box(m.glass,-85+side*24.2,28,54+i*11,.3,5,2.7)}}
 box(m.stone,-85,41,110,14,42,15);roof(-85,66,110,16,13,18,m.dark);box(m.bronze,-85,74,110,.4,8,.4);box(m.bronze,-85,75,110,4,.35,.35);entry(-85,118,6);
 box(m.dark,-85,53,117.6,6,8,.2);column(m.sand,-85,20.4,142,18,.5);
 // Temple: enclosed forecourt, red colonnade, layered eaves and a modest gateway.
 slab(-76,202,98,52);box(m.sand,-76,23,183,70,6,1);box(m.stone,-76,24,201,62,8,28);
 for(const side of [-1,1]){box(m.sand,-76+side*42,23,202,1.5,6,48);for(let i=0;i<5;i++)column(m.red,-102+i*13,24,214,.45,8)}
 roof(-76,31,201,75,5,39,m.terracotta);roof(-76,35.5,198,50,5,25,m.terracotta);
 box(m.bronze,-76,38,198,51,.55,1);for(const side of [-1,1]){box(m.bronze,-76+side*34,32,201,6,.6,40,side*.06)}
 for(const side of [-1,1])column(m.red,-76+side*10,24,226,.6,8);roof(-76,29,226,27,3,8,m.terracotta);
 // Waterfront commercial hall and design offices: open arcade, roof garden, skylights.
 slab(180,139,279,155);box(m.stone,183,27,160,245,14,68);box(m.glass,183,27,195,233,10,.5);
 for(let x=65;x<305;x+=10)box(m.white,x,27,197,.7,14,3);
 box(m.green,183,34.5,159,234,1,55);for(let i=0;i<6;i++){roof(96+i*34,38,150,22,5,39,m.glass);box(m.white,96+i*34,35.6,150,23,.5,42)}
 entry(145,196,20);entry(255,196,16);office(83,75,45,34,18,2);office(251,66,55,35,26,1);
 slab(170,83,76,76,m.sand);column(m.concrete,170,20.8,84,17,1);column(m.water,170,21.4,84,15,.3);
 for(let i=0;i<5;i++){tree(123+i*26,218,1);bench(126+i*26,213)}
 // Residential edge: slab blocks with balconies, planted decks and smaller courtyard homes.
 for(let i=0;i<4;i++){
  const x=-302+i*64,z=-331-(i%2)*13,h=29+(i%2)*14;slab(x,z,53,57);
  box(m.stone,x,20+h/2,z,40,h,25);box(m.glass,x,21+h/2,z+13,35,h-3,.3);
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
 return p;
}
