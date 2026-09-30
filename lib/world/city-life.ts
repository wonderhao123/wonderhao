import {type V3,clamp,sampledRoads,roadNodes} from './city-plan';
export type PathPoint={p:V3; heading:number};
export function along(points:V3[],progress:number):PathPoint{
 const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((v,k)=>v-points[i][k]))),total=lengths.reduce((a,b)=>a+b,0);let d=clamp(progress)*total;
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],t=lengths[i]>0?clamp(d/lengths[i]):0;return {p:a.map((v,k)=>v+(b[k]-v)*t) as V3,heading:Math.atan2(b[0]-a[0],b[2]-a[2])}}else d-=lengths[i]}
 return {p:points[0],heading:0};
}
export function aircraftState(time:number,index:number){
 const t=((time-index*480)%960+960)%960,gateZ=index===0?-155:0,gate:V3=[2217,16.5,gateZ];
 let phase='Parked',path:V3[]=[gate,gate],u=0,resource:string|undefined;
 if(t<35)phase='Ground service';
 else if(t<50){phase='Pushback';path=[gate,[2260,16.5,gateZ]];u=(t-35)/15}
 else if(t<100){phase='Taxi out';path=[[2260,16.5,gateZ],[2350,16.5,gateZ],[2350,16.5,-1150],[2460,16.5,-1150]];u=(t-50)/50;resource='taxi'}
 else if(t<108){phase='Holding';path=[[2460,16.5,-1150],[2460,16.5,-1150]];resource='runway'}
 else if(t<143){phase='Takeoff';path=[[2460,16.5,-1150],[2460,18,500],[2460,70,1180]];u=((t-108)/35)**1.5;resource='runway'}
 else if(t<180){phase='Climb';path=[[2460,70,1180],[2460,450,3500],[2460,900,6500]];u=(t-143)/37}
 else if(t<320){phase='Away';path=[[2460,900,6500],[2460,900,6500]]}
 else if(t<360){phase='Approach';path=[[2460,900,-6500],[2460,300,-2800],[2460,26,-1100]];u=(t-320)/40;resource=t>350?'runway':undefined}
 else if(t<400){phase='Landing';path=[[2460,26,-1100],[2460,16.5,-500],[2460,16.5,1050]];u=(t-360)/40;resource='runway'}
 else if(t<450){phase='Taxi in';path=[[2460,16.5,1050],[2350,16.5,1050],[2350,16.5,gateZ],[2260,16.5,gateZ],gate];u=(t-400)/50;resource='taxi'}
 return {...along(path,u),phase,resource,visible:phase!=='Away',cycle:t};
}
export const vesselSpecs=[
 {id:'cruise',length:180,beam:27,berth:[135,1.3,1705] as V3,approach:[450,1.3,2850] as V3},
 {id:'ferry-a',length:46,beam:10,berth:[-104,1,1695] as V3,approach:[-220,1,2600] as V3},
 {id:'ferry-b',length:43,beam:9,berth:[-9,1,1720] as V3,approach:[70,1,2760] as V3},
 {id:'supply-a',length:42,beam:11,berth:[-2014,1,1510] as V3,approach:[-1850,1,2680] as V3},
 {id:'supply-b',length:36,beam:10,berth:[-1824,1,1510] as V3,approach:[-1450,1,2800] as V3},
];
export function vesselState(time:number,index:number){
 const s=vesselSpecs[index],t=(time+120+index*43)%360;
 const p0=s.approach,p1:[number,number,number]=[s.berth[0],s.berth[1],s.berth[2]+270];
 let phase='Alongside',u=1,path=[p0,p1,s.berth];
 if(t<80){phase='Approach';u=t/80*.8}
 else if(t<110){phase='Berthing';u=.8+(t-80)/30*.2}
 else if(t<230)phase='Alongside';
 else if(t<270){phase='Leaving berth';path=[s.berth,p1,p0];u=(t-230)/40*.2}
 else {phase='Outbound';path=[s.berth,p1,p0];u=.2+(t-270)/90*.8}
 const result=along(path,u);if((phase==='Leaving berth'||phase==='Outbound')&&result.p[2]<s.berth[2]+245)result.heading=Math.PI;return {...result,phase,resource:phase==='Alongside'?`berth:${s.id}`:`channel:${s.id}`,speed:phase==='Alongside'?0:phase==='Approach'||phase==='Outbound'?1:.3};
}

const roadPath=(id:string,reverse=false)=>{const p=sampledRoads.find(r=>r.id===id)!.points;return reverse?[...p].reverse():p};
const join=(...paths:V3[][])=>paths.flatMap((p,i)=>i?p.slice(1):p);
const airportTown=join(roadPath('airport-link',true),roadPath('town-east',true));
const townPort=join(roadPath('town-south'),roadPath('passenger-link'));
const communityArchive=join([roadNodes.w,roadNodes.nw],roadPath('archive-link'));
const archiveStation=roadPath('research-link');
const stationWorks=join(roadPath('research-link',true),roadPath('bus-west'),roadPath('industrial-link').slice(0,-1));
const worksCommunity=join([...roadPath('industrial-link').slice(0,-1)].reverse(),roadPath('western-link',true));
export const busRoutes=[
 [airportTown,townPort,[...townPort].reverse(),[...airportTown].reverse()],
 [communityArchive,archiveStation,stationWorks,worksCommunity],
];
const routeLength=(path:V3[])=>path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(...p.map((v,k)=>v-path[i][k])),0);
export function busState(time:number,index:number){
 const paths=busRoutes[index],durations=paths.map(p=>routeLength(p)/13),total=durations.reduce((s,d)=>s+d+12,0);let t=time%total;
 for(let i=0;i<paths.length;i++){const duration=durations[i];if(t<duration+12)return {...along(paths[i],Math.min(1,t/duration)),stopped:t>=duration,stop:i};t-=duration+12;}
 return {...along(paths[0],0),stopped:false,stop:0};
}
