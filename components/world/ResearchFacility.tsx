"use client";
import {LandmarkAsset} from './LandmarkAsset';
import spec from '@/lib/world/landmark-spec.json';
import type {V3} from '@/lib/world/city-plan';
/** Complete fixed sphere; model origin is its centre, not its waterline. */
export function ResearchFacility({dusk,onStatus,low}:{dusk:boolean;low:boolean;onStatus?:(id:string,state:string)=>void}){
 return <group position={spec.observatory.center as V3}><LandmarkAsset name="observatory" low={low} dusk={dusk} onStatus={onStatus}/></group>;
}
