"use client";
import {useEffect} from 'react';
import type {TransportBatch,TransportFinish} from '@/lib/world/transport-geometry';
const finishes:Record<TransportFinish,{color:string;roughness:number;metalness:number;emissive?:string;emissiveIntensity?:number}>={
 paint:{color:'#edf0e7',roughness:.48,metalness:.12},glass:{color:'#244d60',roughness:.12,metalness:.4},
 metal:{color:'#a7b3b7',roughness:.3,metalness:.8},rubber:{color:'#202c30',roughness:.92,metalness:0},
 accent:{color:'#558f9b',roughness:.4,metalness:.18},deck:{color:'#b9ac8c',roughness:.8,metalness:0},
 lamp:{color:'#fff1c7',roughness:.3,metalness:0,emissive:'#fff1c7',emissiveIntensity:.65},
 red:{color:'#bb463d',roughness:.3,metalness:0,emissive:'#dc3025',emissiveIntensity:.35},
};
export function TransportModel({batches,paint,accent}:{batches:TransportBatch[];paint?:string;accent?:string}){
 useEffect(()=>()=>batches.forEach(b=>b.geometry.dispose()),[batches]);
 return <>{batches.map(({finish,geometry})=><mesh key={finish} geometry={geometry} castShadow receiveShadow><meshStandardMaterial {...finishes[finish]} color={finish==='paint'&&paint?paint:finish==='accent'&&accent?accent:finishes[finish].color} envMapIntensity={finish==='glass'?1.2:.55}/></mesh>)}</>;
}
