import type { SceneEntityInstance } from "./SceneData";

/** Imported 3D model: ECS entity tree (same shape as scene entities). */
export interface ModelManifest {
    guid: string;
    name?: string;
    /** Optional GLB asset guid (manifest loader dependency). */
    glbGuid?: string;
    entities: SceneEntityInstance[];
}
