import {PrefabInstance} from "./PrefabInstance";

export interface SceneData {
    guid: string;
    prefabs: PrefabInstance[];
    resources?: Record<string, any>;
    enableSystems?: string[];
}