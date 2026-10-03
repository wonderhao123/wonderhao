import type * as THREE from 'three';
/** Shared per-scene uniforms; alpha hashing preserves batched focus fades without multisample targets. */
export const buildingFocus={target:{value:0},amount:{value:0}};
export function focusSurface(shader:THREE.WebGLProgramParametersWithUniforms,instanced:boolean,owner=0){
 shader.uniforms.focusTarget=buildingFocus.target;shader.uniforms.focusAmount=buildingFocus.amount;
 shader.vertexShader=(instanced?'attribute float buildingOwner;\n':'')+'varying float focusOwner;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfocusOwner=${instanced?'buildingOwner':owner.toFixed(1)};`);
 shader.fragmentShader='uniform float focusTarget;uniform float focusAmount;varying float focusOwner;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(focusOwner>=0.&&focusTarget>.5&&abs(focusOwner-focusTarget)>.1)diffuseColor.a*=1.-focusAmount*.72;
 `);
}
