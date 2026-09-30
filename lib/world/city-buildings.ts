import type {V3} from './city-plan';
/** Spatial links only. Titles, case text and related projects come from content.ts. */
export const projectBuildings = [
 {id:'commerce',name:'Commerce House',position:[89,48,-86],size:[54,60,48],projects:['merchant-operations','optical-ordering']},
 {id:'workflow',name:'Exchange Offices',position:[197,43,-70],size:[64,50,48],projects:['desktop-payroll','renovation-workflow']},
 {id:'knowledge',name:'Public Library',position:[-220,29,47],size:[122,20,32],projects:['workspace-knowledge','private-notebook']},
 {id:'campus',name:'Learning Campus',position:[-205,29,-221],size:[108,20,28],projects:['campus-systems']},
 {id:'field',name:'Field Operations',position:[264,47,-164],size:[52,85,56],projects:['field-operations']},
 {id:'studio',name:'Design Studio',position:[83,39,75],size:[50,31,40],projects:['creative-operations','member-mobile']},
 {id:'frontages',name:'Waterfront Arcade',position:[183,28,160],size:[250,18,70],projects:['digital-frontages','social-map']},
 {id:'research',name:'Coastal Observatory',position:[480,17,390],size:[74,35,24],projects:['wonderhao-world']},
] satisfies {id:string;name:string;position:V3;size:V3;projects:string[]}[];
export const SUN_DIRECTION:V3=[-.65,.18,-.68];
export const cityViews = {
 home:{target:[-25,30,-65] as V3,offset:[620,530,890] as V3},
 overview:{target:[40,12,-85] as V3,offset:[960,260,1260] as V3},
};
