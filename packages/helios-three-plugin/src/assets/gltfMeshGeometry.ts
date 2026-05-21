import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ensureGeometryUv2FromUv } from "./geometryUv";

/** Apply the mesh node's local matrix so ECS TRS from the manifest stays authoritative. */
export function cloneMeshGeometryWithNodeTransform(mesh: THREE.Mesh): THREE.BufferGeometry {
    const geo = mesh.geometry.clone();
    if (!mesh.matrix.equals(new THREE.Matrix4())) {
        geo.applyMatrix4(mesh.matrix);
    }
    ensureGeometryUv2FromUv(geo);
    return geo;
}

/** Prevent cached GLTF roots from rendering alongside ECS-built meshes. */
export function hideGltfScene(gltf: GLTF): GLTF {
    gltf.scene.visible = false;
    gltf.scene.traverse((obj) => {
        obj.visible = false;
    });
    return gltf;
}
