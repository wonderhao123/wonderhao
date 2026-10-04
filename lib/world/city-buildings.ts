import spec from './landmark-spec.json';
import {makeArchitecture} from './city-architecture';
import type {V3} from './city-plan';
/** Building programmes and spatial links. Project titles and case text come from content.ts. */
const architecture=makeArchitecture();
export const projectBuildings = [
 {id:'commerce',name:'Commerce House',programme:'Commerce & fulfilment',description:'The city’s trading house brings merchant operations and optical ordering together, from an order to its dispatch.',position:[89,48,-86],size:[54,60,48],projects:['merchant-operations','optical-ordering']},
 {id:'workflow',name:'Exchange Offices',programme:'Payroll & renovation',description:'Offices for the work behind a business: closing a payroll period and following a renovation from brief to completion.',position:[197,43,-70],size:[64,50,48],projects:['desktop-payroll','renovation-workflow']},
 {id:'knowledge',name:'Public Library',programme:'Knowledge & private notes',description:'A shared reference library and a quiet reading room give knowledge work and an offline notebook a home.',position:[-220,29,47],size:[122,20,32],projects:['workspace-knowledge','private-notebook']},
 {id:'campus',name:'Learning Campus',programme:'Connected campus',description:'The campus houses a reference system for course planning, room booking and wallet operations.',position:[-205,29,-221],size:[108,20,28],projects:['campus-systems']},
 {id:'field',name:'Field Operations',programme:'Offline field work',description:'An operations centre for research into incident reporting that can continue beyond network coverage.',position:[264,47,-164],size:[52,85,56],projects:['field-operations']},
 {id:'studio',name:'Design Studio',programme:'Creative work & service design',description:'A studio for design handovers and a service desk for mobile warranty submissions: two studies in a clear next step.',position:[83,39,75],size:[50,31,40],projects:['creative-operations','member-mobile']},
 {id:'frontages',name:'Waterfront Arcade',programme:'Digital storefronts & meeting places',description:'Shopfronts express distinct website identities; the waterfront meeting place houses a map-led social product exploration.',position:[183,28,160],size:[250,18,70],projects:['digital-frontages','social-map']},
 {id:'research',name:'The Sphere',programme:'Building this portfolio',description:'The observatory opens up the making of WONDERHAO: its procedural world, interaction design and software.',position:spec.observatory.center as V3,size:[70,70,70],projects:['wonderhao-world']},
].map((building,index)=>{
 const position=building.position as V3,size=building.size as V3;
 const volumes=architecture.filter(p=>p[9]===index+1&&(p[0]===0||p[0]===4)&&p[5]>=8&&p[6]>=3&&p[7]>=8).map(p=>({position:[p[2],p[3]+(p[0]===4?p[6]/2:0),p[4]] as V3,size:[p[5],p[6],p[7]] as V3}));
 if(!volumes.length)return {...building,position,size,volumes:[{position,size}]};
 const min=[0,1,2].map(axis=>Math.min(...volumes.map(v=>v.position[axis]-v.size[axis]/2))),max=[0,1,2].map(axis=>Math.max(...volumes.map(v=>v.position[axis]+v.size[axis]/2)));
 return {...building,position:min.map((v,i)=>(v+max[i])/2) as V3,size:min.map((v,i)=>max[i]-v) as V3,volumes};
});
export const SUN_DIRECTION:V3=[-.65,.42,-.68];
export const cityViews = {
 home:{target:[-60,60,-310] as V3,offset:[1300,1040,1710] as V3},
 overview:{target:[-50,120,-400] as V3,offset:[1350,120,1980] as V3},
};
