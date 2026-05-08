import type { Context } from './Context';

/**
 * Registers minimal JSON loaders for `loadScene` and `loadPrefab` meta types (browser `fetch`).
 */
export function registerDefaultAssetLoaders(context: Context): void {
    context.assetManager.registerLoader('loadScene', {
        async load(path: string) {
            const res = await fetch(path);
            if (!res.ok) {
                throw new Error(`[AssetManager] loadScene failed: ${path} (${res.status})`);
            }
            return res.json();
        },
    });
    context.assetManager.registerLoader('loadPrefab', {
        async load(path: string) {
            const res = await fetch(path);
            if (!res.ok) {
                throw new Error(`[AssetManager] loadPrefab failed: ${path} (${res.status})`);
            }
            return res.json();
        },
    });
}
