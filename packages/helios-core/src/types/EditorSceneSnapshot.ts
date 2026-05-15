/**
 * Full-scene snapshot for Enter Play / Exit Play (Unity-like): serializable entities only,
 * no stable eids — respawn assigns new ids on {@link applySceneSnapshot}.
 */

import type { EntitySnapshot } from "./EntitySnapshot";

export const EDITOR_SCENE_SNAPSHOT_SCHEMA = "helios.editor.sceneSnapshot" as const;

export const EDITOR_SCENE_SNAPSHOT_VERSION = 1 as const;

/** One spawned entity: component maps after runtime strip (same rules as editor clipboard). */
export interface EditorSceneSnapshotEntityV1 {
    readonly components: Record<string, Record<string, unknown>>;
}

export interface EditorSceneSnapshotV1 {
    readonly schema: typeof EDITOR_SCENE_SNAPSHOT_SCHEMA;
    readonly version: typeof EDITOR_SCENE_SNAPSHOT_VERSION;
    readonly entities: readonly EditorSceneSnapshotEntityV1[];
}

export interface CaptureSceneSnapshotOptions {
    /**
     * When true, entity is omitted (runtime-only decor, editor visuals regenerated after load).
     */
    shouldExcludeEntity?: (eid: number, snapshot: EntitySnapshot) => boolean;
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function buildEditorSceneSnapshotV1(
    entities: readonly EditorSceneSnapshotEntityV1[],
): EditorSceneSnapshotV1 {
    return {
        schema: EDITOR_SCENE_SNAPSHOT_SCHEMA,
        version: EDITOR_SCENE_SNAPSHOT_VERSION,
        entities,
    };
}

/** Parse and validate snapshot JSON for {@link applySceneSnapshot}. */
export function parseEditorSceneSnapshotPayload(data: unknown): EditorSceneSnapshotV1 {
    if (!isRecord(data)) {
        throw new Error("[EditorSceneSnapshot] Payload must be a JSON object.");
    }
    const schema = data.schema;
    const version = data.version;
    if (schema !== undefined && schema !== EDITOR_SCENE_SNAPSHOT_SCHEMA) {
        throw new Error(`[EditorSceneSnapshot] Unsupported schema: ${String(schema)}`);
    }
    if (version !== undefined && version !== EDITOR_SCENE_SNAPSHOT_VERSION) {
        throw new Error(`[EditorSceneSnapshot] Unsupported version: ${String(version)}`);
    }
    const rawEntities = data.entities;
    if (!Array.isArray(rawEntities)) {
        throw new Error("[EditorSceneSnapshot] Missing or invalid `entities` array.");
    }
    const entities: EditorSceneSnapshotEntityV1[] = [];
    for (let i = 0; i < rawEntities.length; i++) {
        const row = rawEntities[i];
        if (!isRecord(row)) {
            throw new Error(`[EditorSceneSnapshot] entities[${i}] must be an object.`);
        }
        const comps = row.components;
        if (!isRecord(comps)) {
            throw new Error(`[EditorSceneSnapshot] entities[${i}].components must be an object.`);
        }
        const normalized: Record<string, Record<string, unknown>> = {};
        for (const [name, fields] of Object.entries(comps)) {
            if (!isRecord(fields)) {
                throw new Error(`[EditorSceneSnapshot] Invalid component "${name}" at entities[${i}].`);
            }
            normalized[name] = { ...fields };
        }
        entities.push({ components: normalized });
    }
    return buildEditorSceneSnapshotV1(entities);
}

export function parseEditorSceneSnapshotJson(text: string): EditorSceneSnapshotV1 {
    let data: unknown;
    try {
        data = JSON.parse(text) as unknown;
    } catch {
        throw new Error("[EditorSceneSnapshot] Invalid JSON.");
    }
    return parseEditorSceneSnapshotPayload(data);
}
