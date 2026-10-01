/** Missing, loading, failed or unmounted requirements never satisfy the barrier. */
export function resourcesReady(required:readonly string[],states:Record<string,string>){
 return required.length>0&&required.every(id=>states[id]==='ready');
}
export const surfaceResources=['life','town','commons','archive','station','nature','airport','arrival','works','dive','terrain','water','ring','observatory'];
