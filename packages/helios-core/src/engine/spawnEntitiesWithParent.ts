import { addComponent, addEntity, entityExists } from "bitecs";
import type { Context } from "./Context";
import { Parent } from "../components/parent";
import type { SceneEntityInstance } from "../types/SceneData";
import { applyComponentsToEntity } from "./spawnEntityFromComponents";

export interface PendingParentLink {
    childEid: number;
    target: string | number;
}

function resolveParentTargetEid(
    ctx: Context,
    target: string | number,
    sceneIdToEid: Map<string, number>,
): number | null {
    if (typeof target === "string") {
        const mapped = sceneIdToEid.get(target);
        if (mapped === undefined) {
            console.warn(`[Helios] Parent target scene id "${target}" was not found`);
            return null;
        }
        return mapped;
    }
    if (!entityExists(ctx.ecsWorld as never, target)) {
        console.warn(`[Helios] Parent target eid ${target} does not exist`);
        return null;
    }
    return target;
}

export function applyParentLink(ctx: Context, childEid: number, parentEid: number): void {
    const world = ctx.ecsWorld as never;
    if (!entityExists(world, childEid) || !entityExists(world, parentEid)) {
        console.warn(`[Helios] Cannot link Parent: child=${childEid} parent=${parentEid}`);
        return;
    }
    if (!ctx.components.list().includes("Parent")) {
        console.warn("[Helios] Parent component is not registered");
        return;
    }
    const schema = ctx.components.get("Parent" as never) as typeof Parent;
    addComponent(world, schema, childEid);
    Parent.target[childEid] = parentEid;
    Parent.current[childEid] = 0;
}

export function applyPendingParentLinks(
    ctx: Context,
    pending: readonly PendingParentLink[],
    sceneIdToEid: Map<string, number>,
): void {
    for (const link of pending) {
        const parentEid = resolveParentTargetEid(ctx, link.target, sceneIdToEid);
        if (parentEid === null) {
            continue;
        }
        applyParentLink(ctx, link.childEid, parentEid);
    }
}

function stripParentFromComponents(
    components: Record<string, Record<string, unknown>>,
): { components: Record<string, Record<string, unknown>>; parentTarget?: string | number } {
    if (!components.Parent) {
        return { components };
    }
    const { Parent: parentFields, ...rest } = components;
    const target = parentFields.target;
    if (typeof target === "string" || typeof target === "number") {
        return { components: rest, parentTarget: target };
    }
    console.warn("[Helios] Parent component missing valid target field, skipping");
    return { components: rest };
}

/**
 * Spawn scene entities in two passes: components first, then Parent links (scene id or eid).
 */
export function spawnSceneEntityInstances(
    ctx: Context,
    instances: readonly SceneEntityInstance[],
): void {
    const sceneIdToEid = new Map<string, number>();
    const pending: PendingParentLink[] = [];

    for (const inst of instances) {
        const { components, parentTarget } = stripParentFromComponents(inst.components);
        const eid = addEntity(ctx.ecsWorld as never);
        applyComponentsToEntity(ctx, eid, components);
        if (inst.id) {
            sceneIdToEid.set(inst.id, eid);
        }
        if (parentTarget !== undefined) {
            pending.push({ childEid: eid, target: parentTarget });
        }
    }

    applyPendingParentLinks(ctx, pending, sceneIdToEid);
}

export interface SnapshotSpawnRow {
    components: Record<string, Record<string, unknown>>;
    sourceEid?: number;
}

/**
 * Spawn editor snapshot entities and remap Parent.target via captured source eids.
 */
export function spawnSnapshotEntitiesWithParentRemap(
    ctx: Context,
    rows: readonly SnapshotSpawnRow[],
): void {
    const oldToNew = new Map<number, number>();
    const pendingByOldParent = new Map<number, number[]>();

    for (const row of rows) {
        const { components, parentTarget } = stripParentFromComponents(row.components);
        const eid = addEntity(ctx.ecsWorld as never);
        applyComponentsToEntity(ctx, eid, components);
        if (row.sourceEid !== undefined) {
            oldToNew.set(row.sourceEid, eid);
        }
        if (parentTarget !== undefined && typeof parentTarget === "number") {
            const bucket = pendingByOldParent.get(parentTarget) ?? [];
            bucket.push(eid);
            pendingByOldParent.set(parentTarget, bucket);
        }
    }

    for (const [oldParentEid, children] of pendingByOldParent) {
        const newParentEid = oldToNew.get(oldParentEid);
        if (newParentEid === undefined) {
            console.warn(`[Helios] Snapshot Parent remap: parent source eid ${oldParentEid} not found`);
            continue;
        }
        for (const childEid of children) {
            applyParentLink(ctx, childEid, newParentEid);
        }
    }
}
