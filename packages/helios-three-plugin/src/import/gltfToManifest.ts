import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ModelManifest } from "@merlinn/helios-core";
import type { SceneEntityInstance } from "@merlinn/helios-core";

export interface ModelBundlePaths {
    modelName: string;
    glbPath: string;
    manifestPath: string;
    glbGuid: string;
    manifestGuid: string;
}

export interface GeneratedModelBundle {
    manifest: ModelManifest;
    meshMetas: Array<{
        guid: string;
        gltfMeshIndex: number;
        gltfPrimitiveIndex: number;
        dependencies: string[];
    }>;
    materialMetas: Array<{
        guid: string;
        gltfMeshIndex: number;
        gltfPrimitiveIndex: number;
        dependencies: string[];
    }>;
    glbMeta: { guid: string; loader: string; dependencies: [] };
    manifestMeta: { guid: string; loader: string; dependencies: string[] };
}

function collectMeshNodes(root: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            meshes.push(obj);
        }
    });
    return meshes;
}

function decomposeTransform(obj: THREE.Object3D): {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
} {
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    obj.matrix.decompose(p, q, s);
    return {
        position: { x: p.x, y: p.y, z: p.z },
        rotation: { x: q.x, y: q.y, z: q.z, w: q.w },
        scale: { x: s.x, y: s.y, z: s.z },
    };
}

/**
 * Build a {@link ModelManifest} and companion asset metas from a parsed GLTF.
 */
export function buildModelBundleFromGltf(
    gltf: GLTF,
    options: { modelGuid: string; glbGuid: string; modelName: string },
): GeneratedModelBundle {
    const meshes = collectMeshNodes(gltf.scene);
    const entities: SceneEntityInstance[] = [
        {
            id: "root",
            components: {
                Name: { label: options.modelName },
            },
        },
    ];

    const meshMetas: GeneratedModelBundle["meshMetas"] = [];
    const materialMetas: GeneratedModelBundle["materialMetas"] = [];

    meshes.forEach((mesh, meshIndex) => {
        const meshId = `mesh_${meshIndex}`;
        const geoGuid = `${options.modelGuid}/geo/${meshIndex}`;
        const matGuid = `${options.modelGuid}/mat/${meshIndex}`;
        const transform = decomposeTransform(mesh);

        meshMetas.push({
            guid: geoGuid,
            gltfMeshIndex: meshIndex,
            gltfPrimitiveIndex: 0,
            dependencies: [options.glbGuid],
        });
        materialMetas.push({
            guid: matGuid,
            gltfMeshIndex: meshIndex,
            gltfPrimitiveIndex: 0,
            dependencies: [options.glbGuid],
        });

        entities.push({
            id: meshId,
            components: {
                Name: { label: mesh.name || meshId },
                Parent: { target: "root" },
                Position: transform.position,
                Rotation: transform.rotation,
                Scale: transform.scale,
                Mesh: {},
                Geometry: { guid: geoGuid },
                Material: { guid: matGuid },
            },
        });
    });

    const manifest: ModelManifest = {
        guid: options.modelGuid,
        name: options.modelName,
        glbGuid: options.glbGuid,
        entities,
    };

    return {
        manifest,
        meshMetas,
        materialMetas,
        glbMeta: { guid: options.glbGuid, loader: "loadGltfBinary", dependencies: [] },
        manifestMeta: {
            guid: options.modelGuid,
            loader: "loadModel",
            dependencies: [options.glbGuid],
        },
    };
}
