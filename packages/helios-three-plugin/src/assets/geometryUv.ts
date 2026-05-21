import * as THREE from "three";

/**
 * `MeshStandardMaterial.aoMap` samples the `uv2` attribute. Many OBJ/GLB meshes only have `uv`.
 * Unity often shares the same UV set for albedo, normal, and AO — mirror `uv` → `uv2` when missing.
 */
export function ensureGeometryUv2FromUv(geometry: THREE.BufferGeometry): void {
    if (geometry.attributes.uv2) {
        return;
    }
    const uv = geometry.attributes.uv;
    if (!uv) {
        return;
    }
    geometry.setAttribute("uv2", uv.clone());
}
