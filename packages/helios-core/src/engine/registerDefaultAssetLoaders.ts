import type { Context } from './Context';

/**
 * Registers minimal JSON loaders for `loadScene` and `loadPrefab` meta types (browser `fetch`).
 */
export function registerDefaultAssetLoaders(context: Context): void {
    context.assetManager.registerLoader("loadScene", {
        async load(record) {
            const res = await fetch(record.path);
            if (!res.ok) {
                throw new Error(`[AssetManager] loadScene failed: ${record.path} (${res.status})`);
            }
            return res.json();
        },
    });
    context.assetManager.registerLoader("loadPrefab", {
        async load(record) {
            const res = await fetch(record.path);
            if (!res.ok) {
                throw new Error(`[AssetManager] loadPrefab failed: ${record.path} (${res.status})`);
            }
            return res.json();
        },
    });
    context.assetManager.registerLoader("loadModel", {
        async load(record) {
            const res = await fetch(record.path);
            if (!res.ok) {
                throw new Error(`[AssetManager] loadModel failed: ${record.path} (${res.status})`);
            }
            const data = await res.json();
            return {
                guid: record.guid,
                name: data.name as string | undefined,
                glbGuid: data.glbGuid as string | undefined,
                entities: data.entities ?? [],
            };
        },
    });
}
