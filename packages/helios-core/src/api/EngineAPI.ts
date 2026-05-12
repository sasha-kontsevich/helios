// src/api/EngineAPI.ts

import { extractComponentData } from "../utils/snapshot";
import {
    buildEditorEntityClipboardV1,
    ComponentMap,
    EditorEntityClipboardV1,
    EntitySnapshot,
    parseEditorEntityClipboardJson,
    parseEditorEntityClipboardPayload,
} from "../types";
import { Context } from "../engine/Context";
import { mergeComponentMapOntoEntity, spawnEntityFromComponentMap } from "../engine/spawnEntityFromComponents";

/** Matches `THREE_RENDERER_CAPABILITY` from `@merlinn/helios-three-plugin` when the Three plugin is registered. */
const RENDERER_THREE_CAPABILITY = "renderer.three";

interface ThreeRenderContextEditorCameraLike {
    setEditorRenderCameraEid?(eid: number | null): void;
    getEditorRenderCameraEid?(): number | null;
}
import {
    addComponent,
    addEntity,
    entityExists,
    getAllEntities,
    hasComponent,
    removeComponent,
    removeEntity,
} from "bitecs";

export class EngineAPI {
    constructor(private context: Context) {}

    private getThreeRenderContextEditorCamera(): ThreeRenderContextEditorCameraLike | undefined {
        return this.context.capabilities.getOrUndefined<ThreeRenderContextEditorCameraLike>(
            RENDERER_THREE_CAPABILITY,
        );
    }

    createEntity(): number {
        return addEntity(this.context.ecsWorld as any);
    }

    deleteEntity(eid: number): void {
        const world = this.context.ecsWorld;
        if (!entityExists(world as any, eid)) {
            return;
        }
        removeEntity(world as any, eid);
    }

    entityExists(eid: number): boolean {
        return entityExists(this.context.ecsWorld as any, eid);
    }

    getAllEntityIds(): number[] {
        return getAllEntities(this.context.ecsWorld as any);
    }

    listRegisteredComponents(): string[] {
        return this.context.components.list();
    }

    hasComponent(eid: number, componentName: keyof ComponentMap): boolean {
        const world = this.context.ecsWorld;
        if (!entityExists(world as any, eid)) {
            throw new Error(`[EngineAPI] Entity ${eid} does not exist.`);
        }
        const comp = this.context.components.get(componentName) as any;
        return hasComponent(world as any, comp, eid);
    }

    addComponent(eid: number, componentName: keyof ComponentMap, reset: boolean = true): void {
        const world = this.context.ecsWorld;
        if (!entityExists(world as any, eid)) {
            throw new Error(`[EngineAPI] Entity ${eid} does not exist.`);
        }
        const comp = this.context.components.get(componentName) as any;
        addComponent(world as any, comp, eid, reset);
    }

    removeComponent(eid: number, componentName: keyof ComponentMap, reset: boolean = true): void {
        const world = this.context.ecsWorld;
        if (!entityExists(world as any, eid)) {
            throw new Error(`[EngineAPI] Entity ${eid} does not exist.`);
        }
        const comp = this.context.components.get(componentName) as any;
        removeComponent(world as any, comp, eid, reset);
    }

    /** Получить snapshot по одной сущности */
    getEntitySnapshot(eid: number) {
        const snapshot: Record<string, any> = {};

        const world = this.context.ecsWorld;
        for (const name of this.context.components.list()) {
            const component = this.context.components.get(name as keyof ComponentMap) as any;
            if (hasComponent(world as any, component as any, eid)) {
                snapshot[name] = extractComponentData(component, eid);
            }
        }

        return {
            eid,
            components: snapshot,
        };
    }

    /** Получить snapshot по всем сущностям */
    getAllEntities(): EntitySnapshot[] {
        const result: EntitySnapshot[] = [];
        const eids = getAllEntities(this.context.ecsWorld as any);
        for (const eid of eids) result.push(this.getEntitySnapshot(eid));

        return result;
    }

    /** Пример метода: получить компонент у сущности */
    getComponent<T>(eid: number, name: keyof ComponentMap): T | null {
        const comp = this.context.components.get(name);
        return extractComponentData(comp, eid) as T;
    }

    /**
     * Write numeric fields into the live component storage (TypedArrays).
     * Only keys that map to array-like storage are applied; NaN is ignored.
     */
    applyComponentPatch(
        eid: number,
        componentName: keyof ComponentMap,
        patch: Record<string, unknown>,
    ): void {
        const world = this.context.ecsWorld;
        if (!entityExists(world as any, eid)) {
            throw new Error(`[EngineAPI] Entity ${eid} does not exist.`);
        }

        const comp = this.context.components.get(componentName) as any;
        if (!hasComponent(world as any, comp, eid)) {
            throw new Error(
                `[EngineAPI] Entity ${eid} has no component "${String(componentName)}".`,
            );
        }

        for (const [key, value] of Object.entries(patch)) {
            const storage = comp[key];
            if (storage == null || typeof storage === "function") continue;
            if (Array.isArray(storage) || (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(storage))) {
                if (typeof value === "number") {
                    if (!Number.isFinite(value)) continue;
                    (storage as ArrayLike<number> & { [i: number]: number })[eid] = value;
                    continue;
                }

                // Prefer the component's proxy resource mechanism (defineComponent) when available,
                // so snapshots can resolve objects/strings back (editor-friendly).
                if (value === undefined) continue;
                if (typeof comp.get === "function") {
                    comp.get(eid)[key] = value;
                } else {
                    const id = this.context.resources.set(value);
                    (storage as ArrayLike<number> & { [i: number]: number })[eid] = id;
                }
            }
        }
    }

    /**
     * Build a versioned clipboard payload from a live entity (editor / plugins).
     * Runtime mesh/object handles and rebuild flags are stripped; refs/descriptors are kept.
     */
    buildEditorEntityClipboardPayload(eid: number): EditorEntityClipboardV1 {
        const snap = this.getEntitySnapshot(eid);
        const components = snap.components as Record<string, Record<string, unknown>>;
        return buildEditorEntityClipboardV1(components);
    }

    /** JSON string suitable for `navigator.clipboard` or file export. */
    serializeEditorEntityClipboard(eid: number): string {
        return JSON.stringify(this.buildEditorEntityClipboardPayload(eid));
    }

    /** Clipboard JSON for a single component on an entity (same schema as full entity clipboard). */
    serializeEditorComponentClipboard(eid: number, componentName: string): string {
        const snap = this.getEntitySnapshot(eid);
        const fields = snap.components[componentName];
        if (fields === undefined) {
            throw new Error(`[EngineAPI] Entity ${eid} has no component "${componentName}".`);
        }
        return JSON.stringify(
            buildEditorEntityClipboardV1({
                [componentName]: fields as Record<string, unknown>,
            }),
        );
    }

    /**
     * Merge all components from a clipboard payload onto an existing entity (replaces each listed component).
     */
    mergeEntityFromEditorClipboardPayload(eid: number, payload: unknown): void {
        const parsed = parseEditorEntityClipboardPayload(payload);
        mergeComponentMapOntoEntity(this.context, eid, parsed.components);
    }

    /**
     * Spawn a new entity from a clipboard payload (same path as scene prefab field application).
     */
    createEntityFromEditorClipboardPayload(payload: unknown): number {
        const { components } = parseEditorEntityClipboardPayload(payload);
        return spawnEntityFromComponentMap(this.context, components);
    }

    createEntityFromEditorClipboardJson(json: string): number {
        return this.createEntityFromEditorClipboardPayload(parseEditorEntityClipboardJson(json));
    }

    /**
     * Spawn an entity and apply the given component field maps (same rules as scene load / clipboard paste).
     */
    createEntityFromComponents(components: Record<string, Record<string, unknown>>): number {
        return spawnEntityFromComponentMap(this.context, components);
    }

    /**
     * Editor viewport: render through an ECS entity with `ThreeCamera`, or `null` for the default free camera.
     * No-op if the Three renderer capability is not registered.
     */
    setEditorRenderCameraEid(eid: number | null): void {
        this.getThreeRenderContextEditorCamera()?.setEditorRenderCameraEid?.(eid);
    }

    /** Current editor viewport ECS camera entity id, or `null` for the free camera. */
    getEditorRenderCameraEid(): number | null {
        return this.getThreeRenderContextEditorCamera()?.getEditorRenderCameraEid?.() ?? null;
    }
}
