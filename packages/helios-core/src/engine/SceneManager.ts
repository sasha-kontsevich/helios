// SceneManager.ts
import { Context } from './index';
import {SceneData, PrefabInstance, PrefabData} from '../types';

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
        // 1) получаем SceneData
        let scene = this.scenes.get(guid);
        if(!scene) {
            const sceneResourceId = await this.ctx.assetManager.loadAsset(guid);
            scene = this.ctx.resources.get<SceneData>(sceneResourceId);
        }

        if (!scene) { return }

        this.current = scene;

        // 2) сброс ECS (удалить все сущности и компоненты)
        // this.ctx.ecsWorld = this.ctx.engine.resetWorld();

        // 3) регистрируем глобальные ресурсы
        if (scene.resources) {
            for (const [key, val] of Object.entries(scene.resources)) {
                // ключевой выбор: храним под строкой или создаём numeric ID?
                // Здесь просто регистрируем под строковым ключом:
                this.ctx.resources.set(val, /* existingId: not used */);
            }
        }

        // 4) задействуем системы
        if (scene.enableSystems) {
            // scene.enableSystems.forEach(name =>
            //     this.ctx.systems.enable(name)
            // );
        }

        // 5) инстанцируем префабы с переопределениями
        for (const { prefabGuid, overrides } of scene.prefabs) {
            const eid = this.ctx.prefabs.instantiate(prefabGuid, overrides);
        }
    }

    /** Переключиться на новую сцену */
    async switchScene(guid: string) {
        // тут можно добавить логику "сцена уходит" и очистку
        await this.loadScene(guid);
    }
}
