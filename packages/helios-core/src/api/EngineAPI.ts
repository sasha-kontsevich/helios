// src/api/EngineAPI.ts

import { extractComponentData } from "../utils/snapshot";
import {
    buildEditorEntityClipboardV1,
    buildEditorSceneSnapshotV1,
    CaptureSceneSnapshotOptions,
    ComponentMap,
    EditorEntityClipboardV1,
    EditorSceneSnapshotEntityV1,
    EditorSceneSnapshotV1,
    EntitySnapshot,
    parseEditorEntityClipboardJson,
    parseEditorEntityClipboardPayload,
    parseEditorSceneSnapshotJson,
    parseEditorSceneSnapshotPayload,
} from "../types";
import type { SystemRuntimeSnapshot } from "../types/SystemRuntimeSnapshot";
import { Context } from "../engine/Context";
import {
    applyParentLink,
    spawnSnapshotEntitiesWithParentRemap,
} from "../engine/spawnEntitiesWithParent";
import { mergeComponentMapOntoEntity, spawnEntityFromComponentMap } from "../engine/spawnEntityFromComponents";
import {
    expandAllModelInstances,
    expandModelInstanceMarker,
    spawnModelInstance,
    spawnModelManifest,
    type SpawnModelInstanceOptions,
} from "../engine/spawnModelInstance";
import type { AssetRecord } from "../types/AssetRecord";
import type { ModelManifest } from "../types/ModelManifest";
import { Parent } from "../components/parent";
import { isCyclic } from "../utils/hierarchy";

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

    /**
     * Serializable scene snapshot (stripped runtime fields). Used for Play Mode enter/exit.
     */
    captureSceneSnapshot(options?: CaptureSceneSnapshotOptions): EditorSceneSnapshotV1 {
        const exclude = options?.shouldExcludeEntity;
        const entities: EditorSceneSnapshotEntityV1[] = [];
        for (const snap of this.getAllEntities()) {
            if (exclude?.(snap.eid, snap)) {
                continue;
            }
            const payload = this.buildEditorEntityClipboardPayload(snap.eid);
            entities.push({ sourceEid: snap.eid, components: payload.components });
        }
        return buildEditorSceneSnapshotV1(entities);
    }

    /** Remove every ECS entity (e.g. before loading a snapshot or new scene). Clears editor ECS camera selection. */
    clearWorld(): void {
        const world = this.context.ecsWorld as any;
        const eids = [...getAllEntities(world)];
        for (const eid of eids) {
            if (entityExists(world, eid)) {
                removeEntity(world, eid);
            }
        }
        this.setEditorRenderCameraEid(null);
    }

    /**
     * Replace the entire world with snapshot entities (clears first). Same spawn path as scene JSON / clipboard.
     */
    applySceneSnapshot(snapshot: EditorSceneSnapshotV1 | string): void {
        const data =
            typeof snapshot === "string"
                ? parseEditorSceneSnapshotJson(snapshot)
                : parseEditorSceneSnapshotPayload(snapshot as unknown);
        this.clearWorld();
        spawnSnapshotEntitiesWithParentRemap(
            this.context,
            data.entities.map((inst) => ({
                components: inst.components,
                sourceEid: inst.sourceEid,
            })),
        );
        void expandAllModelInstances(this.context);
    }

    getEntityParentEid(eid: number): number | null {
        const world = this.context.ecsWorld as never;
        if (!entityExists(world, eid)) {
            return null;
        }
        if (!this.hasComponent(eid, "Parent" as keyof ComponentMap)) {
            return null;
        }
        const target = Parent.target[eid];
        return target > 0 ? target : null;
    }

    setEntityParent(childEid: number, parentEid: number | null): void {
        const world = this.context.ecsWorld as never;
        if (!entityExists(world, childEid)) {
            console.warn(`[EngineAPI] setEntityParent: child ${childEid} does not exist`);
            return;
        }

        if (parentEid === null) {
            if (this.hasComponent(childEid, "Parent" as keyof ComponentMap)) {
                this.removeComponent(childEid, "Parent" as keyof ComponentMap);
            }
            return;
        }

        if (!entityExists(world, parentEid)) {
            console.warn(`[EngineAPI] setEntityParent: parent ${parentEid} does not exist`);
            return;
        }
        if (childEid === parentEid) {
            console.warn("[EngineAPI] setEntityParent: cannot parent entity to itself");
            return;
        }
        if (isCyclic(world, childEid, parentEid)) {
            console.warn(
                `[EngineAPI] setEntityParent: cyclic hierarchy child=${childEid} parent=${parentEid}`,
            );
            return;
        }

        applyParentLink(this.context, childEid, parentEid);
    }

    serializeSceneSnapshot(snapshot: EditorSceneSnapshotV1): string {
        return JSON.stringify(snapshot);
    }

    parseSceneSnapshotJson(text: string): EditorSceneSnapshotV1 {
        return parseEditorSceneSnapshotJson(text);
    }

    parseSceneSnapshotPayload(data: unknown): EditorSceneSnapshotV1 {
        return parseEditorSceneSnapshotPayload(data);
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

    /** GUIDs of indexed assets with loader `loadModel`. */
    listModelAssetGuids(): string[] {
        return this.context.assetDatabase
            .getAllRecords()
            .filter((r) => r.loader === "loadModel")
            .map((r) => r.guid);
    }

    /** GUIDs of indexed assets with loader `loadTexture`. */
    listTextureAssetGuids(): string[] {
        return this.context.assetDatabase
            .getAllRecords()
            .filter((r) => r.loader === "loadTexture")
            .map((r) => r.guid);
    }

    /** Spawn a 3D model asset (GLB + manifest) into the ECS world. */
    async spawnModelInstance(
        modelGuid: string,
        options?: SpawnModelInstanceOptions,
    ): Promise<number> {
        return spawnModelInstance(this.context, modelGuid, options);
    }

    /** Spawn from an in-memory manifest (editor preview before saving assets). */
    async spawnModelManifest(
        manifest: ModelManifest,
        options?: SpawnModelInstanceOptions,
    ): Promise<number> {
        return spawnModelManifest(this.context, manifest, options);
    }

    /** Expand all {@link ModelInstance} marker entities after scene load. */
    async expandAllModelInstances(): Promise<void> {
        await expandAllModelInstances(this.context);
    }

    /** Expand a single {@link ModelInstance} marker entity. */
    async expandModelInstanceAt(markerEid: number): Promise<number | null> {
        return expandModelInstanceMarker(this.context, markerEid);
    }

    /** Register asset meta and optional preloaded resource (editor drop preview). */
    preloadAsset(record: AssetRecord, resource?: unknown): void {
        this.context.assetManager.preloadAsset(record, resource);
    }

    /** Load asset by GUID into ResourceManager (textures, models, scenes, …). */
    async loadAsset(guid: string): Promise<number> {
        return this.context.assetManager.loadAsset(guid);
    }

    /**
     * Editor viewport: render through an ECS entity with `Camera`, or `null` for the default free camera.
     * No-op if the Three renderer capability is not registered.
     */
    setEditorRenderCameraEid(eid: number | null): void {
        this.getThreeRenderContextEditorCamera()?.setEditorRenderCameraEid?.(eid);
    }

    /** Current editor viewport ECS camera entity id, or `null` for the free camera. */
    getEditorRenderCameraEid(): number | null {
        return this.getThreeRenderContextEditorCamera()?.getEditorRenderCameraEid?.() ?? null;
    }

    /**
     * Editor host: disable simulation systems until Enter Play.
     * Call after registering `EDITOR_PLAY_SESSION_CAPABILITY` and before `engine.start()`.
     */
    applyEditorSystemHostPolicy(): void {
        this.context.systems.applyEditorHostPolicy();
    }

    /**
     * Enter Play: enable + start simulation systems, then restart editor presentation layer.
     */
    async beginPlaySessionSystems(): Promise<void> {
        await this.context.systems.beginPlaySessionSystems();
        await this.context.systems.restartEditorPresentationSystems();
    }

    /**
     * Exit Play: stop + disable simulation systems, then restart editor presentation layer.
     */
    async endPlaySessionSystems(): Promise<void> {
        await this.context.systems.endPlaySessionSystems();
        await this.context.systems.restartEditorPresentationSystems();
    }

    /** Read-only runtime view of registered systems (editor diagnostics). */
    listSystemRuntimeSnapshots(): SystemRuntimeSnapshot[] {
        return this.context.systems.listRuntimeSnapshots();
    }

    /** Enable or disable a system (`start` on enable, `stop` on disable). */
    async setSystemEnabled(name: string, enabled: boolean): Promise<void> {
        await this.context.systems.setSystemEnabled(name, enabled);
    }

    /** Pause or resume simulation systems (`System.runsInEditor !== true`) without stopping them. */
    setSimulationPaused(paused: boolean): void {
        this.context.systems.setSimulationPaused(paused);
    }

    toggleSimulationPaused(): boolean {
        const next = !this.context.systems.isSimulationPaused();
        this.context.systems.setSimulationPaused(next);
        return next;
    }

    isSimulationPaused(): boolean {
        return this.context.systems.isSimulationPaused();
    }

    /**
     * Read an optional capability from the engine context (host-registered bridges, e.g. game pause).
     */
    getCapability<T>(key: string): T | undefined {
        return this.context.capabilities.getOrUndefined<T>(key);
    }
}
