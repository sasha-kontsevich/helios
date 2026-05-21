import {AssetMeta, AssetRecord} from "../types";
import {ResourceManager} from "./ResourceManager";

export class AssetDatabase {
    private assetsByGuid = new Map<string, AssetRecord>();
    private indexed     = false;

    constructor(private baseUrl = '/assets') {}

    /**
     * Scans asset-index paths and reads each sidecar `.meta` (JSON, GLB, manifest, stubs).
     */
    async indexMeta(assetList: string[]): Promise<void> {
        if (this.indexed) return;
        await Promise.all(
            assetList.map(async (assetPath) => {
                const assetUrl = `${this.baseUrl}/${assetPath}`;
                const metaUrl = `${assetUrl}.meta`;
                const res = await fetch(metaUrl);
                if (!res.ok) {
                    return;
                }
                const meta: AssetMeta = JSON.parse(await res.text());
                this.assetsByGuid.set(meta.guid, {
                    guid: meta.guid,
                    type: meta.type,
                    loader: meta.loader,
                    dependencies: meta.dependencies,
                    path: assetUrl,
                    gltfMeshIndex: meta.gltfMeshIndex,
                    gltfPrimitiveIndex: meta.gltfPrimitiveIndex,
                });
            }),
        );
        this.indexed = true;
    }

    /** Получить всю запись по GUID */
    getMeta(guid: string): AssetRecord | undefined {
        return this.assetsByGuid.get(guid);
    }

    /** Найти GUID по пути (если нужно) */
    getGuidByPath(path: string): string | undefined {
        for (const rec of this.assetsByGuid.values()) {
            if (rec.path === path) return rec.guid;
        }
        return undefined;
    }

    /** Список всех GUID (например, для прелоада) */
    getAllGuids(): string[] {
        return Array.from(this.assetsByGuid.keys());
    }

    /** Список всех записей (AssetRecord) */
    getAllRecords(): AssetRecord[] {
        return Array.from(this.assetsByGuid.values());
    }

    /** Register meta at runtime (e.g. editor model drop preview before asset-index refresh). */
    registerRecord(record: AssetRecord): void {
        this.assetsByGuid.set(record.guid, record);
    }
}