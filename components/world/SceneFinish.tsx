"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/** Owns rendering, including demand-mode invalidation. Does not schedule frames. */
export function SceneFinish({
  low,
  degraded,
  paused = false,
  onMetrics,
}: {
  low: boolean;
  degraded: boolean;
  paused?: boolean;
  onMetrics?: (metrics: {fps:number;calls:number;triangles:number})=>void;
}) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const sample = useRef({seconds:0,frames:0,times:[] as number[]});
  const pipeline = useRef<EffectComposer | null>(null);
  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    const composer = new EffectComposer(gl, target);
    composer.setPixelRatio(Math.min(gl.getPixelRatio(), degraded ? 1.25 : 1.5));
    composer.setSize(size.width, size.height);
    const render = new RenderPass(scene, camera);
    composer.addPass(render);
    const bloom = new UnrealBloomPass(new THREE.Vector2(size.width,size.height),.22,.35,1.9);
    bloom.enabled=!low;
    composer.addPass(bloom);
    const output = new OutputPass();
    composer.addPass(output);
    pipeline.current = composer;
    invalidate();
    return () => {
      pipeline.current = null;
      render.dispose();
      output.dispose();
      bloom.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera, size.width, size.height, low, degraded, invalidate]);
  useFrame(({gl}, dt) => {
    gl.info.autoReset=false;gl.info.reset();
    if (pipeline.current) pipeline.current.render(dt);
    else gl.render(scene, camera);
    if(gl.domElement.dataset.renderCalls!==String(gl.info.render.calls)||gl.domElement.dataset.renderTriangles!==String(gl.info.render.triangles))Object.assign(gl.domElement.dataset,{renderCalls:String(gl.info.render.calls),renderTriangles:String(gl.info.render.triangles)});
    if(!paused && dt<1){sample.current.seconds+=dt;sample.current.frames++;sample.current.times.push(dt*1000);if(sample.current.seconds>=2){const times=sample.current.times.sort((a,b)=>a-b);Object.assign(gl.domElement.dataset,{renderCalls:String(gl.info.render.calls),renderTriangles:String(gl.info.render.triangles),frameP50:String(times[Math.floor(times.length*.5)]),frameP95:String(times[Math.floor(times.length*.95)]),frameP99:String(times[Math.floor(times.length*.99)]),frameSamples:String(times.length)});onMetrics?.({fps:Math.round(sample.current.frames/sample.current.seconds),calls:gl.info.render.calls,triangles:gl.info.render.triangles});sample.current={seconds:0,frames:0,times:[]};}}else sample.current={seconds:0,frames:0,times:[]};
  }, 1);
  return null;
}
