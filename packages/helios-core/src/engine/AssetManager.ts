// AssetManager.ts
import {AssetMeta, AssetRecord, IAssetLoader} from "../types";
import { ResourceManager } from "./ResourceManager";
import { AssetDatabase } from "./AssetDatabase";
import {Context} from "./index";

export class AssetManager {
    private loaders = new Map<string, IAssetLoader>();
    private cache   = new Map<string, number>(); // GUID → resourceId
    private assetDatabase: AssetDatabase;
    private resources: ResourceManager;

    constructor(context: Context) {
        this.resources = context.resources;
        this.assetDatabase = context.assetDatabase;
    }

    /** Регистрируем лоадер для данного типа ассета (type из .meta) */
    registerLoader(type: string, loader: IAssetLoader) {
        this.loaders.set(type, loader);
    }

    /**
     * Основной метод: загружает ассет по guid, кладёт в ResourceManager,
     * возвращает numeric resourceId.
     */
    async loadAsset(guid: string): Promise<number> {
        // если уже загружено — сразу возвращаем ID
        if (this.cache.has(guid)) {
            return this.cache.get(guid)!;
        }

        // 1) берём мета
        const meta: AssetRecord | undefined = this.assetDatabase.getMeta(guid);
        if (!meta) throw new Error(`Asset "${guid}" not found in AssetDatabase`);

        // 2) рекурсивно грузим зависимости
        if (meta.dependencies) {
            await Promise.all(meta.dependencies.map(dep => this.loadAsset(dep)));
        }

        // 3) берём лоадер
        const loader = this.loaders.get(meta.loader);
        if (!loader) throw new Error(`No loader registered for type "${meta.loader}"`);

        // 4) фактически грузим «сырой» объект
        const obj = await loader.load(meta.path);

        // 5) кладём в ResourceManager — получаем numeric ID
        const id = this.resources.set(obj);

        // 6) кэшируем и возвращаем
        this.cache.set(guid, id);
        return id;
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
