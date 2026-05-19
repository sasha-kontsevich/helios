// SceneManager.ts
import { Context } from './index';
import type { PrefabData, SceneData } from '../types';
import { spawnSceneEntityInstances } from './spawnEntitiesWithParent';

export class SceneManager {
    private scenes = new Map<string, SceneData>();
    private current?: SceneData;

    constructor(private ctx: Context) {}

    /** Регистрирует JSON-сцену в AssetDatabase/SceneManager */
    register(scene: SceneData) {
        this.scenes.set(scene.guid, scene);
    }

    /** Загружает сцену по GUID (или уже зарегистрированную) */
    async loadScene(guid: string) {
        let scene = this.scenes.get(guid);
        if (!scene) {
            const sceneResourceId = await this.ctx.assetManager.loadAsset(guid);
            const loaded = this.ctx.resources.get<Partial<SceneData>>(sceneResourceId);
            scene = {
                prefabs: [],
                entities: [],
                ...loaded,
                guid: loaded.guid ?? guid,
            } as SceneData;
        }

        if (!scene) {
            return;
        }

        this.current = scene;

        this.ctx.engine.api.clearWorld();

        if (scene.resources) {
            // TODO: resolve scene.resources entries (GUID refs, nested loads).
            void scene.resources;
        }

        if (scene.enableSystems) {
            // TODO: optional enableSystems wiring to SystemManager.
            void scene.enableSystems;
        }

        if (scene.entities?.length) {
            spawnSceneEntityInstances(this.ctx, scene.entities);
        }

        for (const { prefabGuid, overrides } of scene.prefabs ?? []) {
            const prefabResourceId = await this.ctx.assetManager.loadAsset(prefabGuid);
            const prefabData = this.ctx.resources.get<PrefabData>(prefabResourceId);
            this.ctx.prefabs.instantiate(prefabData, overrides);
        }
    }

    /** Переключиться на новую сцену */
    async switchScene(guid: string) {
        // тут можно добавить логику "сцена уходит" и очистку
        await this.loadScene(guid);
    }
}
