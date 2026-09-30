"use client";
import {useMemo} from 'react';
import {Parts} from './CityTerrain';
import {hash,terrainHeight} from '@/lib/world/city-plan';
import type {Part} from '@/lib/world/city-assets';
/** Engineered upper quay meets a lower tidal walk through two stair landings. */
export function CoastalSite({dusk}:{dusk:boolean}){
 const parts=useMemo(()=>{
  const p:Part[]=[];const box=(c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=0)=>p.push([0,c,x,y,z,w,h,d,r]);
  for(let i=0;i<126;i++){
   const x=-360+i*6,z=290+25*Math.cos(x*.009),a=Math.atan(.225*Math.sin(x*.009));
   box('#b9bcb3',x,1.3,z+31,6.4,4.8,6,a);box('#d2c4a7',x,3.8,z+30,6.4,.25,5.6,a);
   box('#a48864',x,4.9,z+33,6.3,.08,.08,a);box('#a48864',x,4.4,z+33,.08,1,.08);
   for(let j=0;j<5;j++){
    const rx=x+hash(i*7+j)*6,rz=z+1+j*5+hash(i+j)*4,y=terrainHeight(rx,rz);
    if(Math.abs(rx+144)<4||Math.abs(rx-288)<4)continue;
    p.push([2,['#7c8379','#9b9a86','#727c73'][i%3],rx,y-.45,rz,2.5+hash(i+j)*1.5,1.5+hash(i+3),2.4,hash(i)*6]);
   }
   if(i%12===0){box('#a48864',x,4.4,z+30,2.4,.15,.65);box('#263f4a',x,4.1,z+30,1.7,.7,.4);}
  }
  for(const x of [-144,288]){
   const z=290+25*Math.cos(x*.009);
   for(let i=0;i<40;i++)box('#d2c4a7',x,20-i*.41,z-5+i*.88,5,.42,.9);
   // Side parapets follow the steps, without floating rails across the slope.
   for(let i=0;i<20;i++)for(const side of [-1,1])box('#b9bcb3',x+side*2.7,20.3-i*.82,z-4+i*1.76,.3,1.4,1.8);
  }
  // Fixed research approach: stepped access from the 7 m research quay to the 2 m landing.
  for(let i=0;i<13;i++)box('#b9bcb3',518,7-i*.4,310+i*.85,4,.4,.88);
  box('#b9bcb3',518,1.4,354,4,.8,68);
  for(const x of [516,520]){box('#a48864',x,3,354,.07,.07,66);for(let z=321;z<389;z+=4)box('#a48864',x,2.4,z,.06,1.2,.06);}
  for(let z=327;z<384;z+=14)p.push([1,'#b9bcb3',518,-16,z,.65,36,.65,0]);
  return p;
 },[]);
 return <Parts parts={parts} dusk={dusk}/>;
}
