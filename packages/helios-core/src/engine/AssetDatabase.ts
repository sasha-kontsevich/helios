import {AssetMeta, AssetRecord} from "../types";
import {ResourceManager} from "./ResourceManager";

export class AssetDatabase {
    private assetsByGuid = new Map<string, AssetRecord>();
    private indexed     = false;

    constructor(private baseUrl = '/assets') {}

    /**
     * Сканирует указанный список JSON-файлов (из asset-index.json)
     * и читает к каждому его .meta, заполняя карту GUID → AssetRecord
     */
    async indexMeta(assetList: string[]): Promise<void> {
        if (this.indexed) return;
        await Promise.all(assetList.map(async assetPath => {
            if (!assetPath.endsWith('.json')) return;

            const jsonUrl  = `${this.baseUrl}/${assetPath}`;

            const metaUrl  = `${jsonUrl}.meta`;
            const metaText = await fetch(metaUrl).then(r => r.text());
            const meta: AssetMeta = JSON.parse(metaText);

            this.assetsByGuid.set(meta.guid, {
                guid:         meta.guid,
                type:         meta.type,
                loader:       meta.loader,
                dependencies: meta.dependencies,
                path:         jsonUrl,
            });
        }));
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
}