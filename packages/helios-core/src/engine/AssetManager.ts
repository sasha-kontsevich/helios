// AssetManager.ts
import {AssetRecord, IAssetLoader} from "../types";
import { ResourceManager } from "./ResourceManager";
import { AssetDatabase } from "./AssetDatabase";
import {Context} from "./index";
import { AssetLoadStatusStore, labelFromAssetRecord } from "./AssetLoadStatusStore";

export class AssetManager {
    private loaders = new Map<string, IAssetLoader>();
    private cache   = new Map<string, number>(); // GUID → resourceId
    private readonly pendingByGuid = new Map<string, Promise<number>>();
    private assetDatabase: AssetDatabase;
    private resources: ResourceManager;
    private readonly loadStatus: AssetLoadStatusStore;

    constructor(context: Context) {
        this.resources = context.resources;
        this.assetDatabase = context.assetDatabase;
        this.loadStatus = context.assetLoadStatus;
    }

    /** Регистрируем лоадер для данного типа ассета (type из .meta) */
    registerLoader(type: string, loader: IAssetLoader) {
        this.loaders.set(type, loader);
    }

    /**
     * Register indexed meta and optional preloaded resource (skips loader on first resolve).
     */
    preloadAsset(record: AssetRecord, resource?: unknown): void {
        this.assetDatabase.registerRecord(record);
        if (resource !== undefined) {
            const id = this.resources.set(resource);
            this.cache.set(record.guid, id);
        }
    }

    /**
     * Основной метод: загружает ассет по guid, кладёт в ResourceManager,
     * возвращает numeric resourceId.
     */
    async loadAsset(guid: string): Promise<number> {
        if (this.cache.has(guid)) {
            return this.cache.get(guid)!;
        }

        const existing = this.pendingByGuid.get(guid);
        if (existing) {
            return existing;
        }

        const promise = this.loadAssetUncached(guid);
        this.pendingByGuid.set(guid, promise);
        try {
            return await promise;
        } finally {
            this.pendingByGuid.delete(guid);
        }
    }

    private async loadAssetUncached(guid: string): Promise<number> {
        const meta: AssetRecord | undefined = this.assetDatabase.getMeta(guid);
        if (!meta) throw new Error(`Asset "${guid}" not found in AssetDatabase`);

        const label = labelFromAssetRecord(meta);
        this.loadStatus.pushLoad(label);
        try {
            if (meta.dependencies) {
                await Promise.all(meta.dependencies.map(dep => this.loadAsset(dep)));
            }

            const loader = this.loaders.get(meta.loader);
            if (!loader) throw new Error(`No loader registered for type "${meta.loader}"`);

            const obj = await loader.load(meta);
            const id = this.resources.set(obj);
            this.cache.set(guid, id);
            return id;
        } finally {
            this.loadStatus.popLoad(label);
        }
    }

    /**
     * Возвращает resourceId уже загруженного ассета.
     * Бросает, если ассет не загружен.
     */
    getResourceId(guid: string): number {
        const id = this.cache.get(guid);
        if (id === undefined) {
            throw new Error(`[AssetManager] Asset "${guid}" not loaded`);
        }
        return id;
    }

    /** Позволяет синхронно проверить, загружен ли уже ассет */
    hasAsset(guid: string): boolean {
        return this.cache.has(guid);
    }

    /** Можно удалить из кэша и ResourceManager (по желанию) */
    releaseAsset(guid: string) {
        const id = this.cache.get(guid);
        if (id !== undefined) {
            this.resources.delete(id);
            this.cache.delete(guid);
        }
    }
}
