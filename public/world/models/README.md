# Original WONDERHAO models

All geometry is authored for this repository by `scripts/build-landmarks.py`. No external models, textures, purchases, or protected reference-site assets are included. Vibe-submarine informed the separation of dimensions, continuous shape construction, material and assembly, without copying its implementation or assets.

- **Units / axes:** metres. Blender authors Z-up; glTF export converts to Y-up. Observatory origin is the sphere centre; Ring origin is its ground-floor centre; habitat origin is the pressure-vessel centre. Ship hull has unit beam/length and is rotated/scaled by its existing vessel dimensions.
- **Geometry:** segmented spherical surface with radial normals; continuous annular Ring slabs; rounded pressure capsule with window reveals, ribs, saddles and pipes; swept displacement ship hull. Edge radii are actual bevel geometry where appropriate.
- **Materials:** opaque glTF metallic/roughness materials. Authoring sRGB colours are converted to linear before export; GLTFLoader handles import. No texture decoding, alpha ordering, external texture dependency or falsely claimed bake/compression stage.
- **LODs:** `*-low.glb` are Blender-decimated geometry exports (38% target ratio); standard variants preserve finer seams/frames. The script writes the source fingerprint only after every export succeeds.
- **Ownership:** the loader owns each mounted parse, disposes its geometry/materials, aborts fetch on unmount and disposes late parse results. Regenerate rather than editing the GLBs by hand.

Reference: https://github.com/zhulin025/Vibe-submarine (MIT; method reference only).
