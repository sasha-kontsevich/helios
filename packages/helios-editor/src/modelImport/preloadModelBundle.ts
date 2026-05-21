import type { EngineAPI } from "@merlinn/helios-core";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import {
    cloneMeshGeometryWithNodeTransform,
    type GeneratedModelBundle,
} from "@merlinn/helios-three-plugin";

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            meshes.push(obj);
        }
    });
    return meshes;
}

/** Register runtime metas + GLTF resources so {@link EngineAPI.spawnModelManifest} can resolve guids. */
export function preloadModelBundleForPreview(
    api: EngineAPI,
    gltf: GLTF,
    bundle: GeneratedModelBundle,
    glbPath: string,
): void {
    gltf.scene.visible = false;
    gltf.scene.traverse((obj) => {
        obj.visible = false;
    });

    api.preloadAsset(
        {
            guid: bundle.glbMeta.guid,
            type: "gltf",
            loader: "loadGltfBinary",
            path: glbPath,
        },
        gltf,
    );

    api.preloadAsset(
        {
            guid: bundle.manifestMeta.guid,
            type: "model",
            loader: "loadModel",
            path: glbPath,
            dependencies: bundle.manifestMeta.dependencies,
        },
        bundle.manifest,
    );

    const meshes = collectMeshes(gltf.scene);
    for (const m of bundle.meshMetas) {
        const mesh = meshes[m.gltfMeshIndex];
        if (mesh) {
            api.preloadAsset(
                {
                    guid: m.guid,
                    type: "geometry",
                    loader: "loadGltfMesh",
                    path: glbPath,
                    dependencies: m.dependencies,
                    gltfMeshIndex: m.gltfMeshIndex,
                    gltfPrimitiveIndex: m.gltfPrimitiveIndex,
                },
                cloneMeshGeometryWithNodeTransform(mesh),
            );
        }
    }
    for (const m of bundle.materialMetas) {
        const mesh = meshes[m.gltfMeshIndex];
        const mat = mesh?.material;
        const resolved = Array.isArray(mat) ? mat[m.gltfPrimitiveIndex ?? 0] : mat;
        if (resolved) {
            api.preloadAsset(
                {
                    guid: m.guid,
                    type: "material",
                    loader: "loadGltfMaterial",
                    path: glbPath,
                    dependencies: m.dependencies,
                    gltfMeshIndex: m.gltfMeshIndex,
                    gltfPrimitiveIndex: m.gltfPrimitiveIndex,
                },
                (resolved as THREE.Material).clone(),
            );
        }
    }
}
