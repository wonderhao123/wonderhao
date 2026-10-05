/** Missing, loading, failed or unmounted requirements never satisfy the barrier. */
export function resourcesReady(required:readonly string[],states:Record<string,string>){
 return required.length>0&&required.every(id=>states[id]==='ready');
}
export const surfaceResources=['life','town','commons','archive','station','nature','airport','arrival','works','dive','terrain','water','ring','observatory'];

/** One manifest for both the renderer barrier and its visible progress. */
export function sceneResources(underwater=false,level?:'b1'|'b2'){
 return underwater?['habitat','observatory']:level?surfaceResources.filter(id=>!['commons','ring','observatory'].includes(id)):surfaceResources;
}

/** Completed preparation tasks, not elapsed time or an invented byte total. */
export function preparationProgress(required:readonly string[],states:Record<string,string>,sceneReady:boolean){
 const complete=resourcesReady(required,states)&&sceneReady;
 const completed=required.filter(id=>states[id]==='ready').length;
 return complete?100:Math.min(99,Math.floor(completed/(required.length+1)*100));
}

/** Smooth presentation may lag completed work, but must never invent progress.
 * Cap catch-up after a blocked/background frame so it cannot become a big jump. */
export function advanceLoadingProgress(current:number,target:number,elapsedMs:number){
 if(target<=current)return target;
 const step=Math.min(50,Math.max(12,(target-current)*4))*Math.min(32,Math.max(0,elapsedMs))/1000;
 return Math.min(target,current+step);
}
