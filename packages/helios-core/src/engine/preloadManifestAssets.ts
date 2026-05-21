import type { Context } from "./Context";
import type { ModelManifest } from "../types/ModelManifest";

/** Collect GLB + sub-mesh GUIDs referenced by a {@link ModelManifest}. */
export function collectManifestAssetGuids(manifest: ModelManifest): string[] {
    const guids = new Set<string>();
    if (manifest.glbGuid) {
        guids.add(manifest.glbGuid);
    }
    for (const inst of manifest.entities) {
        const geo = inst.components.Geometry?.guid;
        const mat = inst.components.Material?.guid;
        if (typeof geo === "string" && geo.length > 0) {
            guids.add(geo);
        }
        if (typeof mat === "string" && mat.length > 0) {
            guids.add(mat);
        }
    }
    return [...guids];
}

/** Load manifest GLB and all mesh/material sub-assets before spawning entities. */
export async function preloadManifestAssets(ctx: Context, manifest: ModelManifest): Promise<void> {
    for (const guid of collectManifestAssetGuids(manifest)) {
        await ctx.assetManager.loadAsset(guid);
    }
}
