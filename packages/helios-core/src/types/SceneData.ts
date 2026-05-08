import { PrefabInstance } from './PrefabInstance';

/** Inline entity description (component names must match registered ECS components). */
export interface SceneEntityInstance {
    /** Optional editor/debug id (not stored in ECS). */
    id?: string;
    components: Record<string, Record<string, unknown>>;
}

export interface SceneData {
    guid: string;
    prefabs?: PrefabInstance[];
    /** Spawn entities directly from component maps (same shape as prefab `components`). */
    entities?: SceneEntityInstance[];
    resources?: Record<string, unknown>;
    enableSystems?: string[];
}