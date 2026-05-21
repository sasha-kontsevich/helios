import type { AssetRecord } from "./AssetRecord";

export interface IAssetLoader<T = unknown> {
    /** Loads an asset using its indexed record (path, GLTF indices, dependencies). */
    load(record: AssetRecord): Promise<T>;
}
