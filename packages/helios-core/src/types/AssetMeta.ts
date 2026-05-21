import {AssetType} from "./index";

export interface AssetMeta {
    guid: string;
    type: AssetType;
    loader: string;
    dependencies?: string[];
    /** Index into parsed GLTF for `loadGltfMesh` / `loadGltfMaterial`. */
    gltfMeshIndex?: number;
    gltfPrimitiveIndex?: number;
}
