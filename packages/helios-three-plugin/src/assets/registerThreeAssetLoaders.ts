import type { Context } from "@merlinn/helios-core";
import * as THREE from "three";
import { TextureLoader } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cloneMeshGeometryWithNodeTransform, hideGltfScene } from "./gltfMeshGeometry";

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            meshes.push(obj);
        }
    });
    return meshes;
}

function resolveGltfDependency(ctx: Context, record: { dependencies?: string[] }): GLTF {
    const glbGuid = record.dependencies?.[0];
    if (!glbGuid) {
        throw new Error("[loadGltfMesh] Missing GLB dependency guid");
    }
    const rid = ctx.assetManager.getResourceId(glbGuid);
    return ctx.resources.get<GLTF>(rid);
}

export function registerThreeAssetLoaders(context: Context): void {
    context.assetManager.registerLoader("loadTexture", {
        async load(record) {
            const tex = await new TextureLoader().loadAsync(record.path);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        },
    });

    context.assetManager.registerLoader("loadGltfBinary", {
        async load(record) {
            const res = await fetch(record.path);
            if (!res.ok) {
                throw new Error(`[loadGltfBinary] failed: ${record.path} (${res.status})`);
            }
            const buffer = await res.arrayBuffer();
            const loader = new GLTFLoader();
            const gltf = await loader.parseAsync(buffer, record.path);
            return hideGltfScene(gltf);
        },
    });

    context.assetManager.registerLoader("loadGltfMesh", {
        async load(record) {
            const gltf = resolveGltfDependency(context, record);
            gltf.scene.updateWorldMatrix(true, true);
            const meshes = collectMeshes(gltf.scene);
            const index = record.gltfMeshIndex ?? 0;
            const mesh = meshes[index];
            if (!mesh?.geometry) {
                throw new Error(`[loadGltfMesh] mesh index ${index} not found`);
            }
            return cloneMeshGeometryWithNodeTransform(mesh);
        },
    });

    context.assetManager.registerLoader("loadGltfMaterial", {
        async load(record) {
            const gltf = resolveGltfDependency(context, record);
            const meshes = collectMeshes(gltf.scene);
            const index = record.gltfMeshIndex ?? 0;
            const mesh = meshes[index];
            if (!mesh) {
                throw new Error(`[loadGltfMaterial] mesh index ${index} not found`);
            }
            const mat = mesh.material;
            if (Array.isArray(mat)) {
                const pi = record.gltfPrimitiveIndex ?? 0;
                const m = mat[pi];
                return (m as THREE.Material).clone();
            }
            return (mat as THREE.Material).clone();
        },
    });
}
